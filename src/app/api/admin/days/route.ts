import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { courseDaySchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const courseId = req.nextUrl.searchParams.get("courseId") ?? undefined;
  const days = await prisma.courseDay.findMany({
    where: courseId ? { courseId } : undefined,
    orderBy: { order: "asc" }
  });
  return NextResponse.json({ days });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = courseDaySchema.safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422, { issues: parsed.error.flatten() });

  const count = await prisma.courseDay.count({ where: { courseId: parsed.data.courseId } });
  const day = await prisma.courseDay.create({ data: { ...parsed.data, order: parsed.data.order ?? count } });

  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "DAY_CREATE", targetType: "CourseDay", targetId: day.id });
  return NextResponse.json({ ok: true, day });
}
