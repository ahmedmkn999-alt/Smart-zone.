import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { courseSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const teacherId = req.nextUrl.searchParams.get("teacherId") ?? undefined;
  const courses = await prisma.course.findMany({
    where: teacherId ? { teacherId } : undefined,
    orderBy: { order: "asc" }
  });
  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422, { issues: parsed.error.flatten() });

  const count = await prisma.course.count({ where: { teacherId: parsed.data.teacherId } });
  const course = await prisma.course.create({ data: { ...parsed.data, order: parsed.data.order ?? count } });

  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "COURSE_CREATE", targetType: "Course", targetId: course.id });
  return NextResponse.json({ ok: true, course });
}
