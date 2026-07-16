import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedStudentSession } from "@/lib/auth";
import { jsonError, requestMeta } from "@/lib/apiHelpers";
import { recordTamperEvent } from "@/lib/security";

export async function GET(req: NextRequest) {
  const claims = await getVerifiedStudentSession();
  if (!claims) return jsonError("سجّل الدخول الأول", 401);

  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) return jsonError("subjectId مطلوب", 400);

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) return jsonError("المادة مش موجودة", 404);

  // لو حد بيحاول يفتح مادة مش تبع شعبته (بتعديل الـ id في الطلب يدويًا)، ده
  // مش "غلطة عادية" — ده طلب مزوّر فعليًا، فبيتسجل كمحاولة عبث حقيقية.
  if (subject.track !== claims.track) {
    const { ip, userAgent } = requestMeta();
    await recordTamperEvent({
      codeId: claims.sub, type: "FORGED_REQUEST",
      detail: `requested subjectId ${subjectId} outside own track`, ip, userAgent
    });
    return jsonError("مش مسموح لك بالوصول للمادة دي", 403);
  }

  const teachers = await prisma.teacher.findMany({ where: { subjectId }, orderBy: { order: "asc" } });
  return NextResponse.json({ teachers });
}
