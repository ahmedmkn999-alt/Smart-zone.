import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/apiHelpers";

export async function GET() {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return NextResponse.json({ logs });
}
