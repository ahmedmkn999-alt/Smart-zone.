import { prisma } from "./db";
import { writeAuditLog } from "./audit";

/*
 * IMPORTANT DESIGN NOTE (read this before wiring up new "tamper" triggers):
 *
 * This app never trusts client-held state for anything security-relevant.
 * The access/refresh tokens live in HttpOnly cookies JS can't read or write.
 * Every protected page/action re-derives truth (track, status, expiry, role)
 * from the database via the verified JWT on the server, on every request.
 * There is no "isPremium" flag sitting in localStorage for an attacker to
 * usefully flip — so "the user edited localStorage" is not, by itself,
 * something the server needs to react to. Per the spec: opening DevTools is
 * NOT a violation. A violation is when the SERVER catches a real mismatch:
 *
 *   - a request body claims a role/status/track that disagrees with the JWT
 *   - a refresh token that was already revoked/rotated gets reused (replay)
 *   - a mutating request arrives without a valid CSRF token
 *   - a device-locked code is used from a second deviceId
 *
 * Each of these is detected SERVER-SIDE, in the route handler, and reported
 * here. recordTamperEvent() is the single place the 3-strike policy lives.
 */

export type TamperType =
  | "CLAIM_MISMATCH"      // JWT claims vs. request body disagree (forged fields)
  | "FORGED_REQUEST"      // request shape/values don't match what the UI could have sent
  | "CSRF_FAIL"           // missing/invalid CSRF token on a mutating request
  | "REFRESH_REPLAY"      // a revoked/rotated refresh token was reused
  | "DEVICE_MISMATCH"     // device-locked code used from a second device
  | "CLIENT_REPORTED_TAMPER"; // defense-in-depth signal reported by the client itself

const AUTO_SUSPEND_THRESHOLD = 3;

export async function recordTamperEvent(params: {
  codeId?: string;
  sessionId?: string;
  type: TamperType;
  detail?: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  await prisma.securityViolation.create({
    data: {
      codeId: params.codeId,
      sessionId: params.sessionId,
      type: params.type,
      detail: params.detail,
      ip: params.ip ?? undefined,
      userAgent: params.userAgent ?? undefined
    }
  });

  await writeAuditLog({
    actorType: "system",
    actorId: params.codeId,
    action: "TAMPER_DETECTED",
    targetType: "Code",
    targetId: params.codeId,
    metadata: { type: params.type, detail: params.detail },
    ip: params.ip,
    userAgent: params.userAgent
  });

  if (!params.codeId) return { suspended: false, violationCount: null };

  const code = await prisma.code.update({
    where: { id: params.codeId },
    data: { violationCount: { increment: 1 } }
  });

  if (code.violationCount >= AUTO_SUSPEND_THRESHOLD && code.status === "active") {
    await prisma.$transaction([
      prisma.code.update({
        where: { id: code.id },
        data: { status: "suspended" }
      }),
      prisma.session.updateMany({
        where: { codeId: code.id, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);

    await writeAuditLog({
      actorType: "system",
      actorId: code.id,
      action: "CODE_AUTO_SUSPENDED",
      targetType: "Code",
      targetId: code.id,
      metadata: { violationCount: code.violationCount, reason: "3-strike tamper policy" }
    });

    return { suspended: true, violationCount: code.violationCount };
  }

  return { suspended: false, violationCount: code.violationCount };
}

// الأدمن يقدر يصفّر العداد ويرجّع الكود يشتغل تاني بعد ما يراجع الموقف
export async function resetViolations(codeId: string) {
  await prisma.code.update({ where: { id: codeId }, data: { violationCount: 0 } });
}
