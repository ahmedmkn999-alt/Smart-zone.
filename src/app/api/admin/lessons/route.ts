import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { lessonSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const dayId = req.nextUrl.searchParams.get("dayId") ?? undefined;
  const lessons = await prisma.lesson.findMany({
    where: dayId ? { dayId } : undefined,
    orderBy: { order: "asc" }
  });
  return NextResponse.json({ lessons });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = lessonSchema.safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422, { issues: parsed.error.flatten() });

  const count = await prisma.lesson.count({ where: { dayId: parsed.data.dayId } });
  const lesson = await prisma.lesson.create({ data: { ...parsed.data, order: parsed.data.order ?? count } });

  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "LESSON_CREATE", targetType: "Lesson", targetId: lesson.id });
  return NextResponse.json({ ok: true, lesson });
}
