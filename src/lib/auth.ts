import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "./db";
import { signAccessToken, signRefreshToken, verifyToken, StudentClaims, AdminClaims } from "./jwt";
import { setAuthCookies, clearAuthCookies, COOKIE_NAMES } from "./cookies";
import { hashCode } from "./hash";
import { createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* ─────────────────────── student session ─────────────────────── */

export async function issueStudentSession(codeRow: {
  id: string;
  track: string;
  type: string;
}, deviceId: string /* already-hashed fingerprint, see src/lib/hash.ts#hashDeviceFingerprint */, ip?: string, userAgent?: string) {
  const session = await prisma.session.create({
    data: {
      codeId: codeRow.id,
      deviceId,
      refreshHash: "pending", // filled in right after we know the token
      ip,
      userAgent
    }
  });

  const claims: StudentClaims = {
    sub: codeRow.id,
    role: "student",
    track: codeRow.track as StudentClaims["track"],
    codeType: codeRow.type as StudentClaims["codeType"],
    deviceId,
    sid: session.id
  };

  const accessToken = await signAccessToken(claims);
  const refreshToken = await signRefreshToken(codeRow.id, session.id);

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshHash: hashToken(refreshToken) }
  });

  setAuthCookies({
    accessName: COOKIE_NAMES.studentAccess,
    refreshName: COOKIE_NAMES.studentRefresh,
    accessToken,
    refreshToken
  });

  return { accessToken, refreshToken, sessionId: session.id };
}

export async function getStudentSession(): Promise<StudentClaims | null> {
  const token = cookies().get(COOKIE_NAMES.studentAccess)?.value;
  if (!token) return null;
  const claims = await verifyToken<StudentClaims>(token);
  if (!claims || claims.role !== "student") return null;
  return claims;
}

// أقوى من getStudentSession(): بيتأكد كمان إن الجلسة (Session row) لسه مش
// متلغاة في قاعدة البيانات، مش بس إن الـ JWT لسه صالح. استخدمها في أي مكان
// حساس (البروفايل، محتوى الكورسات) عشان لو الأدمن ألغى الجلسة يدويًا أو
// نظام كشف العبث ألغاها، التأثير يبان فورًا مش بعد ما الـ 15 دقيقة تخلص.
export async function getVerifiedStudentSession(): Promise<StudentClaims | null> {
  const claims = await getStudentSession();
  if (!claims) return null;
  const session = await prisma.session.findUnique({ where: { id: claims.sid } });
  if (!session || session.revokedAt) return null;
  const code = await prisma.code.findUnique({ where: { id: claims.sub } });
  if (!code || code.status !== "active" || code.expiresAt < new Date()) return null;
  return claims;
}

export async function endStudentSession(sessionId?: string) {
  if (sessionId) {
    await prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
  clearAuthCookies(COOKIE_NAMES.studentAccess, COOKIE_NAMES.studentRefresh);
}

/* ─────────────────────── admin session ─────────────────────── */

export async function issueAdminSession(admin: { id: string; role: string; email: string }) {
  const claims: AdminClaims = {
    sub: admin.id,
    role: admin.role as AdminClaims["role"],
    email: admin.email
  };
  const accessToken = await signAccessToken(claims);
  const refreshToken = await signRefreshToken(admin.id, uuidv4());

  setAuthCookies({
    accessName: COOKIE_NAMES.adminAccess,
    refreshName: COOKIE_NAMES.adminRefresh,
    accessToken,
    refreshToken
  });

  return { accessToken, refreshToken };
}

export async function getAdminSession(): Promise<AdminClaims | null> {
  const token = cookies().get(COOKIE_NAMES.adminAccess)?.value;
  if (!token) return null;
  const claims = await verifyToken<AdminClaims>(token);
  if (!claims || (claims.role !== "admin" && claims.role !== "superadmin")) return null;
  return claims;
}

export async function endAdminSession() {
  clearAuthCookies(COOKIE_NAMES.adminAccess, COOKIE_NAMES.adminRefresh);
}

export { hashCode };
