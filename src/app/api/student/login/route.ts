import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { studentLoginSchema } from "@/lib/validators";
import { hashCode, hashDeviceFingerprint } from "@/lib/hash";
import { issueStudentSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { recordTamperEvent } from "@/lib/security";
import { rateLimit, LOGIN_RATE_LIMIT, getClientIp } from "@/lib/rateLimit";
import { jsonError, requireCsrf, requestMeta } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const { ip, userAgent } = requestMeta();

  // Rate limit BEFORE touching the DB — codes are short strings, brute-forcing
  // them is the realistic threat here, not SQL injection (Prisma already
  // parameterizes every query so injection isn't a viable vector regardless).
  const rl = rateLimit(`student-login:${ip}`, LOGIN_RATE_LIMIT);
  if (!rl.allowed) {
    return jsonError("محاولات كتير من نفس الجهاز، حاول تاني بعد شوية", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = studentLoginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("بيانات غير صحيحة", 422, { issues: parsed.error.flatten() });
  }
  const { code, deviceFingerprint } = parsed.data;
  const deviceHash = hashDeviceFingerprint(deviceFingerprint);

  const codeHash = hashCode(code);
  const codeRow = await prisma.code.findUnique({ where: { codeHash } });

  if (!codeRow) {
    await writeAuditLog({
      actorType: "student",
      action: "STUDENT_LOGIN_FAIL",
      metadata: { reason: "NOT_FOUND" },
      ip,
      userAgent
    });
    return jsonError("الكود غلط أو مش موجود", 401);
  }

  if (codeRow.status !== "active") {
    await writeAuditLog({
      actorType: "student",
      actorId: codeRow.id,
      action: "STUDENT_LOGIN_FAIL",
      metadata: { reason: codeRow.status.toUpperCase() },
      ip,
      userAgent
    });
    return jsonError(
      codeRow.status === "suspended"
        ? "الكود ده متوقف مؤقتًا لأسباب أمنية، تواصل مع الأدمن"
        : "الكود ده محظور، تواصل مع الأدمن",
      403
    );
  }

  if (codeRow.expiresAt < new Date()) {
    return jsonError("الكود ده انتهت صلاحيته", 403);
  }

  // Device lock: first login binds the code to this device. Any *different*
  // device trying the same code afterwards is a real, server-verified tamper
  // signal — not a guess — so it goes through the 3-strike policy.
  if (codeRow.deviceId && codeRow.deviceId !== deviceHash) {
    const result = await recordTamperEvent({
      codeId: codeRow.id,
      type: "DEVICE_MISMATCH",
      detail: "login attempt from a second device",
      ip,
      userAgent
    });
    return jsonError(
      result.suspended
        ? "الكود ده اتوقف بسبب محاولات دخول متكررة من أجهزة مختلفة"
        : "الكود ده شغال على جهاز تاني بالفعل",
      403
    );
  }

  const updated = await prisma.code.update({
    where: { id: codeRow.id },
    data: { deviceId: deviceHash, lastLoginAt: new Date() }
  });

  await issueStudentSession(updated, deviceHash, ip, userAgent);

  await writeAuditLog({
    actorType: "student",
    actorId: updated.id,
    action: "STUDENT_LOGIN_SUCCESS",
    ip,
    userAgent
  });

  return NextResponse.json({
    ok: true,
    track: updated.track,
    name: updated.name,
    expiresAt: updated.expiresAt
  });
}
