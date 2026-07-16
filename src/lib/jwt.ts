import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type StudentClaims = {
  sub: string; // Code.id
  role: "student";
  track: "SCI" | "MATH" | "LIT";
  codeType: "student" | "trial";
  deviceId: string;
  sid: string; // Session.id — lets us revoke a single session server-side
};

export type AdminClaims = {
  sub: string; // AdminUser.id
  role: "admin" | "superadmin";
  email: string;
};

// توكن مؤقت جدًا (5 دقايق) بعد ما الباسورد يتحقق منه صح، لحد ما الأدمن يدخل
// كود الـ TOTP. الرول هنا "admin_pending" عمدًا — مش "admin"، عشان
// getAdminSession() العادي يرفضه تلقائيًا ومينفعش يستخدم كجلسة دخول حقيقية.
export type PendingAdminClaims = {
  sub: string;
  role: "admin_pending";
};

export type Claims = StudentClaims | AdminClaims | PendingAdminClaims;

const ACCESS_TOKEN_TTL = "15m"; // deliberately short — the whole point of JWT is it's *not* checked against the DB on every request
const REFRESH_TOKEN_TTL = "30d";

export async function signAccessToken(claims: Claims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(secret);
}

export async function signPendingAdminToken(sub: string): Promise<string> {
  return new SignJWT({ sub, role: "admin_pending" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);
}

export async function signRefreshToken(sub: string, sid: string): Promise<string> {
  return new SignJWT({ sub, sid, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(secret);
}

export async function verifyToken<T extends Claims>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as T;
  } catch {
    return null; // expired, forged, or malformed — never throw raw crypto errors to callers
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<{ sub: string; sid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== "refresh") return null;
    return { sub: payload.sub as string, sid: payload.sid as string };
  } catch {
    return null;
  }
}
