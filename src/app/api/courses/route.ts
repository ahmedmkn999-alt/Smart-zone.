import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedStudentSession } from "@/lib/auth";
import { jsonError, requestMeta } from "@/lib/apiHelpers";
import { recordTamperEvent } from "@/lib/security";

export async function GET(req: NextRequest) {
  const claims = await getVerifiedStudentSession();
  if (!claims) return jsonError("سجّل الدخول الأول", 401);

  const teacherId = req.nextUrl.searchParams.get("teacherId");
  if (!teacherId) return jsonError("teacherId مطلوب", 400);

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, include: { subject: true } });
  if (!teacher) return jsonError("المدرس مش موجود", 404);

  if (teacher.subject.track !== claims.track) {
    const { ip, userAgent } = requestMeta();
    await recordTamperEvent({
      codeId: claims.sub, type: "FORGED_REQUEST",
      detail: `requested teacherId ${teacherId} outside own track`, ip, userAgent
    });
    return jsonError("مش مسموح لك بالوصول للمدرس ده", 403);
  }

  const courses = await prisma.course.findMany({ where: { teacherId }, orderBy: { order: "asc" } });
  return NextResponse.json({ courses });
}
