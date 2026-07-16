import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { writeAuditLog } from "@/lib/audit";

const statusSchema = z.object({ status: z.enum(["open", "resolved"]) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422);

  await prisma.supportThread.update({ where: { id: params.id }, data: { status: parsed.data.status } });
  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "SUPPORT_STATUS_CHANGE", targetType: "SupportThread", targetId: params.id });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  await prisma.supportThread.delete({ where: { id: params.id } });
  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "SUPPORT_DELETE", targetType: "SupportThread", targetId: params.id });

  return NextResponse.json({ ok: true });
}
