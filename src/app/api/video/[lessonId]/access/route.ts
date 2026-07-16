import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedStudentSession } from "@/lib/auth";
import { jsonError, requestMeta } from "@/lib/apiHelpers";
import { recordTamperEvent } from "@/lib/security";
import { signVideoToken } from "@/lib/videoAccess";

export async function GET(_req: Request, { params }: { params: { lessonId: string } }) {
  const claims = await getVerifiedStudentSession();
  if (!claims) return jsonError("سجّل الدخول الأول", 401);

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { day: { include: { course: { include: { teacher: { include: { subject: true } } } } } } }
  });
  if (!lesson) return jsonError("الحصة مش موجودة", 404);

  if (lesson.day.course.teacher.subject.track !== claims.track) {
    const { ip, userAgent } = requestMeta();
    await recordTamperEvent({
      codeId: claims.sub, type: "FORGED_REQUEST",
      detail: `requested lessonId ${params.lessonId} outside own track`, ip, userAgent
    });
    return jsonError("مش مسموح لك بالوصول للحصة دي", 403);
  }

  const token = signVideoToken(lesson.id, claims.sub);

  return NextResponse.json({
    videoUrl: lesson.videoUrl,
    token,
    expiresInSeconds: 2 * 60 * 60,
    watermark: { codeLast4: null } // بيتملى من /api/student/me في الكلاينت، هنا بس مثال شكل الرد
  });
}
