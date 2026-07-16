import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, requireCsrf } from "@/lib/apiHelpers";
import { generateTotpSecret, totpKeyUri, encryptTotpSecret } from "@/lib/twofa";

export async function POST() {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const secret = generateTotpSecret();
  const uri = totpKeyUri(secret, admin.email);

  // بيتخزن مشفّر فورًا، لكن totpEnabled بيفضل false لحد ما يتأكد بكود صحيح
  // في /api/admin/2fa/verify — عشان محدش "يفعّل" 2FA بغلط ويقفل نفسه بره
  await prisma.adminUser.update({
    where: { id: admin.sub },
    data: { totpSecret: encryptTotpSecret(secret) }
  });

  return NextResponse.json({ ok: true, otpauthUri: uri, secret });
}
