import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { courseSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = courseSchema.partial().safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422);

  const course = await prisma.course.update({ where: { id: params.id }, data: parsed.data });
  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "COURSE_UPDATE", targetType: "Course", targetId: course.id });
  return NextResponse.json({ ok: true, course });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  await prisma.course.delete({ where: { id: params.id } });
  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "COURSE_DELETE", targetType: "Course", targetId: params.id });
  return NextResponse.json({ ok: true });
}
