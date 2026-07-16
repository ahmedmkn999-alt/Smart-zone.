import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminLoginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/hash";
import { issueAdminSession } from "@/lib/auth";
import { signPendingAdminToken } from "@/lib/jwt";
import { setPendingAdminCookie } from "@/lib/cookies";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit, ADMIN_LOGIN_RATE_LIMIT } from "@/lib/rateLimit";
import { jsonError, requireCsrf, requestMeta } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const { ip, userAgent } = requestMeta();

  const rl = rateLimit(`admin-login:${ip}`, ADMIN_LOGIN_RATE_LIMIT);
  if (!rl.allowed) return jsonError("محاولات كتير، حاول تاني بعد شوية", 429);

  const body = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422);

  const { email, password } = parsed.data;
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  // نفس الرسالة ونفس الوقت تقريبًا سواء الإيميل مش موجود أو الباسورد غلط —
  // عشان محدش يقدر يستنتج مين الإيميلات الموجودة فعلاً بمجرد تجربة/توقيت الرد
  const dummyHash = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8j8mQxDh1yYQ8fCtF7oB0.OeKXzVYW";
  const ok = admin ? await verifyPassword(password, admin.passwordHash) : await verifyPassword(password, dummyHash);

  if (!admin || !ok) {
    await writeAuditLog({ actorType: "system", action: "ADMIN_LOGIN_FAIL", metadata: { email }, ip, userAgent });
    return jsonError("بيانات الدخول غلط", 401);
  }

  if (admin.totpEnabled) {
    const pendingToken = await signPendingAdminToken(admin.id);
    setPendingAdminCookie(pendingToken);
    await writeAuditLog({ actorType: "admin", adminId: admin.id, action: "ADMIN_LOGIN_PASSWORD_OK_AWAITING_2FA", ip, userAgent });
    return NextResponse.json({ ok: true, needsTotp: true });
  }

  await issueAdminSession(admin);
  await writeAuditLog({ actorType: "admin", adminId: admin.id, action: "ADMIN_LOGIN_SUCCESS", ip, userAgent });

  return NextResponse.json({ ok: true, needsTotp: false, email: admin.email, role: admin.role });
}
