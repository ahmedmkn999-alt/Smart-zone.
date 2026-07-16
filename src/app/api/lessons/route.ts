import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedStudentSession } from "@/lib/auth";
import { jsonError, requestMeta } from "@/lib/apiHelpers";
import { recordTamperEvent } from "@/lib/security";

export async function GET(req: NextRequest) {
  const claims = await getVerifiedStudentSession();
  if (!claims) return jsonError("سجّل الدخول الأول", 401);

  const dayId = req.nextUrl.searchParams.get("dayId");
  if (!dayId) return jsonError("dayId مطلوب", 400);

  const day = await prisma.courseDay.findUnique({
    where: { id: dayId },
    include: { course: { include: { teacher: { include: { subject: true } } } } }
  });
  if (!day) return jsonError("اليوم مش موجود", 404);

  if (day.course.teacher.subject.track !== claims.track) {
    const { ip, userAgent } = requestMeta();
    await recordTamperEvent({
      codeId: claims.sub, type: "FORGED_REQUEST",
      detail: `requested dayId ${dayId} outside own track`, ip, userAgent
    });
    return jsonError("مش مسموح لك بالوصول لليوم ده", 403);
  }

  const lessons = await prisma.lesson.findMany({ where: { dayId }, orderBy: { order: "asc" } });
  return NextResponse.json({ lessons });
}
