import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedStudentSession } from "@/lib/auth";
import { jsonError } from "@/lib/apiHelpers";

export async function GET() {
  const claims = await getVerifiedStudentSession();
  if (!claims) return jsonError("سجّل الدخول الأول", 401);

  const code = await prisma.code.findUnique({ where: { id: claims.sub } });
  if (!code) return jsonError("الكود مش موجود", 404);

  // آخر 4 خانات بس — الكود الكامل متسيبش يترجع تاني بعد أول مرة يتعرض فيها للأدمن
  return NextResponse.json({
    name: code.name,
    track: code.track,
    codeType: code.type,
    status: code.status,
    expiresAt: code.expiresAt,
    codeLast4: code.codeLast4
  });
}
