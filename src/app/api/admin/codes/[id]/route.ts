import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf, requestMeta } from "@/lib/apiHelpers";
import { codeActionSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";
import { resetViolations } from "@/lib/security";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = codeActionSchema.safeParse(body);
  if (!parsed.success) return jsonError("إجراء غير معروف", 422);

  const code = await prisma.code.findUnique({ where: { id: params.id } });
  if (!code) return jsonError("الكود مش موجود", 404);

  const { ip, userAgent } = requestMeta();
  const { action } = parsed.data;

  switch (action) {
    case "renew": {
      const base = code.expiresAt > new Date() ? code.expiresAt : new Date();
      await prisma.code.update({
        where: { id: code.id },
        data: { expiresAt: new Date(base.getTime() + 30 * DAY_MS) }
      });
      break;
    }
    case "block":
      await prisma.code.update({ where: { id: code.id }, data: { status: "blocked" } });
      await prisma.session.updateMany({ where: { codeId: code.id, revokedAt: null }, data: { revokedAt: new Date() } });
      break;
    case "unblock":
      await prisma.code.update({ where: { id: code.id }, data: { status: "active" } });
      break;
    case "reset-device":
      await prisma.code.update({ where: { id: code.id }, data: { deviceId: null } });
      await prisma.session.updateMany({ where: { codeId: code.id, revokedAt: null }, data: { revokedAt: new Date() } });
      break;
    case "reset-violations":
      await resetViolations(code.id);
      break;
    case "delete":
      await prisma.code.delete({ where: { id: code.id } });
      break;
  }

  await writeAuditLog({
    actorType: "admin", adminId: admin.sub, action: `CODE_${action.toUpperCase()}`,
    targetType: "Code", targetId: code.id, ip, userAgent
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  await prisma.code.delete({ where: { id: params.id } });
  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "CODE_DELETE", targetType: "Code", targetId: params.id });

  return NextResponse.json({ ok: true });
}
