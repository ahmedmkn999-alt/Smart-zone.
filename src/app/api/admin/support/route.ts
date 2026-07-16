import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/apiHelpers";

export async function GET() {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  const threads = await prisma.supportThread.findMany({
    orderBy: { createdAt: "desc" },
    include: { replies: { orderBy: { createdAt: "asc" } } }
  });

  return NextResponse.json({ threads });
}
