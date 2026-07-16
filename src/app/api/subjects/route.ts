import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVerifiedStudentSession } from "@/lib/auth";
import { jsonError } from "@/lib/apiHelpers";

// بيرجع مواد شعبة الطالب هو بس — الشعبة بتتاخد من الجلسة المتحقق منها على
// السيرفر، مش من أي query param، عشان محدش يقدر "يغيّر" شعبته من الطلب.
export async function GET() {
  const claims = await getVerifiedStudentSession();
  if (!claims) return jsonError("سجّل الدخول الأول", 401);

  const subjects = await prisma.subject.findMany({
    where: { track: claims.track },
    orderBy: { order: "asc" }
  });

  return NextResponse.json({ subjects });
}
