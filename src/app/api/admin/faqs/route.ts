import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse, jsonError, requireCsrf } from "@/lib/apiHelpers";
import { faqCreateSchema } from "@/lib/validators";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const body = await req.json().catch(() => null);
  const parsed = faqCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("بيانات غير صحيحة", 422);

  const count = await prisma.faq.count();
  const faq = await prisma.faq.create({
    data: { ...parsed.data, order: parsed.data.order ?? count }
  });

  await writeAuditLog({ actorType: "admin", adminId: admin.sub, action: "FAQ_CREATE", targetType: "Faq", targetId: faq.id });
  return NextResponse.json({ ok: true, faq });
}

// بذر الأسئلة السبعة الافتراضية أول ما اللوحة تتفتح ومفيش أي سؤال متسجل —
// النسخة العربية بالظبط اللي اتطلبت
export async function GET() {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;
  const faqs = await prisma.faq.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ faqs });
}
