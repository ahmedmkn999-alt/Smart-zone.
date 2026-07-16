import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/apiHelpers";

export async function GET() {
  const admin = await requireAdmin();
  if (isResponse(admin)) return admin;

  const violations = await prisma.securityViolation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { code: { select: { name: true, codeLast4: true, track: true, status: true } } }
  });

  const suspendedCount = await prisma.code.count({ where: { status: "suspended" } });

  return NextResponse.json({ violations, suspendedCount });
}
