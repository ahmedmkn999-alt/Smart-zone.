import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedStudentSession } from "@/lib/auth";
import { supportCreateSchema } from "@/lib/validators";
import { jsonError, requireCsrf, requestMeta } from "@/lib/apiHelpers";
import { rateLimit, SUPPORT_MESSAGE_RATE_LIMIT } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";

// الطالب المسجّل بيشوف الخيط بتاعه (لو موجود) عشان يقرا رد الأدمن
export async function GET() {
  const claims = await getVerifiedStudentSession();
  if (!claims) return NextResponse.json({ thread: null });

  const thread = await prisma.supportThread.findFirst({
    where: { codeId: claims.sub },
    orderBy: { createdAt: "desc" },
    include: { replies: { orderBy: { createdAt: "asc" } } }
  });

  return NextResponse.json({ thread });
}

export async function POST(req: NextRequest) {
  const csrfFail = requireCsrf();
  if (csrfFail) return csrfFail;

  const { ip, userAgent } = requestMeta();
  const rl = rateLimit(`support:${ip}`, SUPPORT_MESSAGE_RATE_LIMIT);
  if (!rl.allowed) return jsonError("رسايل كتير، استنى شوية وابعت تاني", 429);

  const body = await req.json().catch(() => null);
  const parsed = supportCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError("اكتب رسالة الأول", 422);

  // لو الزائر عنده جلسة طالب صالحة بنربط رسالته بكوده، ولو زائر عادي (لسه
  // مش مشترك) الرسالة برضه بتتقبل وبتوصل الأدمن، بس من غير هوية مرتبطة
  const claims = await getVerifiedStudentSession();
  const code = claims ? await prisma.code.findUnique({ where: { id: claims.sub } }) : null;

  let thread = claims
    ? await prisma.supportThread.findFirst({ where: { codeId: claims.sub, status: "open" } })
    : null;

  if (!thread) {
    thread = await prisma.supportThread.create({
      data: { codeId: claims?.sub, name: code?.name, track: code?.track }
    });
  }

  const reply = await prisma.supportReply.create({
    data: { threadId: thread.id, sender: "student", body: parsed.data.message }
  });

  await writeAuditLog({
    actorType: claims ? "student" : "system",
    actorId: claims?.sub,
    action: "SUPPORT_MESSAGE_SENT",
    targetType: "SupportThread",
    targetId: thread.id,
    ip,
    userAgent
  });

  return NextResponse.json({ ok: true, threadId: thread.id, reply });
}
