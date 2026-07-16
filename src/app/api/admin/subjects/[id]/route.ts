import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { subjectSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = subjectSchema.partial().safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422);

  const subject = await prisma.subject.update({ where: { id: params.id }, data: parsed.data });
  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "SUBJECT_UPDATE", targetType: "Subject", targetId: subject.id });
  return NextResponse.json({ ok: true, subject });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  await prisma.subject.delete({ where: { id: params.id } });
  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "SUBJECT_DELETE", targetType: "Subject", targetId: params.id });
  return NextResponse.json({ ok: true });
}
