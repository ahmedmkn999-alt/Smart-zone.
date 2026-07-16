import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedStudentSession } from "@/lib/auth";
import { jsonError, requestMeta } from "@/lib/apiHelpers";
import { recordTamperEvent } from "@/lib/security";

export async function GET(req: NextRequest) {
  const claims = await getVerifiedStudentSession();
  if (!claims) return jsonError("سجّل الدخول الأول", 401);

  const courseId = req.nextUrl.searchParams.get("courseId");
  if (!courseId) return jsonError("courseId مطلوب", 400);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { teacher: { include: { subject: true } } }
  });
  if (!course) return jsonError("الكورس مش موجود", 404);

  if (course.teacher.subject.track !== claims.track) {
    const { ip, userAgent } = requestMeta();
    await recordTamperEvent({
      codeId: claims.sub, type: "FORGED_REQUEST",
      detail: `requested courseId ${courseId} outside own track`, ip, userAgent
    });
    return jsonError("مش مسموح لك بالوصول للكورس ده", 403);
  }

  const days = await prisma.courseDay.findMany({ where: { courseId }, orderBy: { order: "asc" } });
  return NextResponse.json({ days });
}
