import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { teacherSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const subjectId = req.nextUrl.searchParams.get("subjectId") ?? undefined;
  const teachers = await prisma.teacher.findMany({
    where: subjectId ? { subjectId } : undefined,
    orderBy: { order: "asc" }
  });
  return NextResponse.json({ teachers });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = teacherSchema.safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422, { issues: parsed.error.flatten() });

  const count = await prisma.teacher.count({ where: { subjectId: parsed.data.subjectId } });
  const teacher = await prisma.teacher.create({
    data: {
      ...parsed.data,
      photoUrl: parsed.data.photoUrl || null,
      bio: parsed.data.bio || null,
      order: parsed.data.order ?? count
    }
  });

  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "TEACHER_CREATE", targetType: "Teacher", targetId: teacher.id });
  return NextResponse.json({ ok: true, teacher });
}
