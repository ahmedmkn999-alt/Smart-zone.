import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { subjectSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function GET() {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const subjects = await prisma.subject.findMany({ orderBy: [{ track: "asc" }, { order: "asc" }] });
  return NextResponse.json({ subjects });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = subjectSchema.safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422, { issues: parsed.error.flatten() });

  const count = await prisma.subject.count({ where: { track: parsed.data.track } });
  const subject = await prisma.subject.create({
    data: { ...parsed.data, imageUrl: parsed.data.imageUrl || null, order: parsed.data.order ?? count }
  });

  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "SUBJECT_CREATE", targetType: "Subject", targetId: subject.id });
  return NextResponse.json({ ok: true, subject });
}
