import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/twofa";
import { writeAuditLog } from "@/lib/audit";

const bodySchema = z.object({ code: z.string().trim().length(6) });

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("اكتب كود مكوّن من 6 أرقام", 422);

  const row = await prisma.adminUser.findUnique({ where: { id: admin.sub } });
  if (!row?.totpSecret) return jsonError("لازم تعمل /2fa/setup الأول", 400);

  const valid = verifyTotpCode(decryptTotpSecret(row.totpSecret), parsed.data.code);
  if (!valid) return jsonError("الكود غلط، جرب تاني", 401);

  await prisma.adminUser.update({ where: { id: admin.sub }, data: { totpEnabled: true } });
  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "ADMIN_2FA_ENABLED" });

  return NextResponse.json({ ok: true });
}
