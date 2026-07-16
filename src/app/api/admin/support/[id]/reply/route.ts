import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { supportReplySchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = supportReplySchema.safeParse({ ...body, threadId: params.id });
  if (!parsed.success) return jsonError("اكتب رد الأول", 422);

  const reply = await prisma.supportReply.create({
    data: { threadId: params.id, sender: "admin", adminId: admin.sub, body: parsed.data.body }
  });

  await writeAuditLog({
    actorType: "admin", adminId: admin.sub, action: "SUPPORT_REPLY_SENT",
    targetType: "SupportThread", targetId: params.id
  });

  return NextResponse.json({ ok: true, reply });
}
