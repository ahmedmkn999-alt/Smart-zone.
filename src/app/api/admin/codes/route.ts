import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf, requestMeta } from "@/lib/apiHelpers";
import { createStudentCodeSchema, createTrialCodeSchema } from "@/lib/validators";
import { generateStudentCode, generateTrialCode } from "@/lib/codes";
import { hashCode } from "@/lib/hash";
import { writeAuditLog } from "@/lib/audit";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  const codes = await prisma.code.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, codeLast4: true, type: true, name: true, track: true, status: true,
      deviceId: true, duration: true, violationCount: true, createdAt: true,
      expiresAt: true, lastLoginAt: true
    }
  });
  return NextResponse.json({ codes });
}

const createBodySchema = z.union([
  createStudentCodeSchema.extend({ kind: z.literal("student") }),
  createTrialCodeSchema.extend({ kind: z.literal("trial") })
]);

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422, { issues: parsed.error.flatten() });

  const { ip, userAgent } = requestMeta();
  const data = parsed.data;

  let plainCode: string;
  let expiresAt: Date;
  let name: string | null = null;
  let duration: string | null = null;

  if (data.kind === "student") {
    plainCode = generateStudentCode(data.track);
    expiresAt = new Date(Date.now() + 30 * DAY_MS);
    name = data.name;
  } else {
    plainCode = generateTrialCode(data.track, data.duration);
    expiresAt = new Date(Date.now() + (data.duration === "1H" ? 60 * 60 * 1000 : DAY_MS));
    duration = data.duration;
  }

  const codeHash = hashCode(plainCode);
  const codeLast4 = plainCode.slice(-4);

  const created = await prisma.code.create({
    data: {
      codeHash,
      codeLast4,
      type: data.kind,
      name,
      track: data.track,
      duration,
      expiresAt,
      status: "active"
    }
  });

  await writeAuditLog({
    actorType: "admin", adminId: admin.sub, action: "CODE_CREATE",
    targetType: "Code", targetId: created.id,
    metadata: { kind: data.kind, track: data.track }, ip, userAgent
  });

  // الكود الحقيقي بيترجع مرة واحدة بس هنا وقت الإنشاء — بعدها مستحيل تسترجعه
  // تاني من أي مكان، لأن اللي متخزن في القاعدة هو الـ hash بس مش النص نفسه.
  return NextResponse.json({ ok: true, plainCode, id: created.id });
}
