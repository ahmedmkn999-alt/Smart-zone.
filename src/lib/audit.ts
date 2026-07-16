import { prisma } from "./db";

type AuditInput = {
  actorType: "admin" | "student" | "system";
  actorId?: string;
  adminId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: input.actorType,
        actorId: input.actorId,
        adminId: input.adminId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ip: input.ip ?? undefined,
        userAgent: input.userAgent ?? undefined
      }
    });
  } catch (err) {
    // الـ audit log ميتسببش في فشل العملية الأساسية لو حصل خطأ فيه — بس نسجله في الكونسول
    console.error("[audit] failed to write log:", err);
  }
}
