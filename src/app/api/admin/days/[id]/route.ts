import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { courseDaySchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = courseDaySchema.partial().safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422);

  const day = await prisma.courseDay.update({ where: { id: params.id }, data: parsed.data });
  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "DAY_UPDATE", targetType: "CourseDay", targetId: day.id });
  return NextResponse.json({ ok: true, day });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  await prisma.courseDay.delete({ where: { id: params.id } });
  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "DAY_DELETE", targetType: "CourseDay", targetId: params.id });
  return NextResponse.json({ ok: true });
}
