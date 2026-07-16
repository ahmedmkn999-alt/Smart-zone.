import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyToken, PendingAdminClaims } from "@/lib/jwt";
import { COOKIE_NAMES, clearPendingAdminCookie } from "@/lib/cookies";
import { issueAdminSession } from "@/lib/auth";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/twofa";
import { jsonError, requireCsrf, requestMeta } from "@/lib/apiHelpers";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({ code: z.string().trim().length(6) });

export async function POST(req: NextRequest) {
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const { ip, userAgent } = requestMeta();
  const rl = rateLimit(`admin-totp:${ip}`, { limit: 8, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) return jsonError("محاولات كتير، حاول تاني بعد شوية", 429);

  const pendingToken = cookies().get(COOKIE_NAMES.adminPending)?.value;
  if (!pendingToken) return jsonError("انتهت الجلسة المؤقتة، سجّل الدخول تاني", 401);

  const claims = await verifyToken<PendingAdminClaims>(pendingToken);
  if (!claims || claims.role !== "admin_pending") return jsonError("جلسة غير صالحة", 401);

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("اكتب كود مكوّن من 6 أرقام", 422);

  const admin = await prisma.adminUser.findUnique({ where: { id: claims.sub } });
  if (!admin || !admin.totpEnabled || !admin.totpSecret) return jsonError("2FA مش مفعّل", 400);

  const secret = decryptTotpSecret(admin.totpSecret);
  const valid = verifyTotpCode(secret, parsed.data.code);

  if (!valid) {
    await writeAuditLog({ actorType: "admin", adminId: admin.id, action: "ADMIN_2FA_FAIL", ip, userAgent });
    return jsonError("الكود غلط", 401);
  }

  clearPendingAdminCookie();
  await issueAdminSession(admin);
  await writeAuditLog({ actorType: "admin", adminId: admin.id, action: "ADMIN_LOGIN_SUCCESS_2FA", ip, userAgent });

  return NextResponse.json({ ok: true, email: admin.email, role: admin.role });
}
