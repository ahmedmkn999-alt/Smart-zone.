import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "./env";

/* ───────────── Admin passwords: bcrypt (salted, slow-by-design) ───────────── */

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/*
 * ───────────── Student/trial codes: HMAC-SHA256 pepper (deterministic) ─────────────
 *
 * Codes are short, low-entropy strings the student types in — unlike passwords
 * we DO need to look one up by equality ("WHERE codeHash = ?"), which a salted
 * bcrypt hash can't do (same input → different hash every time). A deterministic
 * keyed hash (HMAC with a server-only secret pepper) gives us both properties:
 * the plaintext code is never stored anywhere, AND we can still find the row.
 * The pepper lives only in the server's env, never in the database or client.
 */

export function hashCode(code: string): string {
  return createHmac("sha256", env.CODE_PEPPER).update(code.trim().toUpperCase()).digest("hex");
}

export function codeHashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB); // constant-time compare, avoids timing side-channels
}

/*
 * ───────────── Device fingerprint: HMAC-SHA256, same pattern as codes ─────────────
 *
 * The client computes a fingerprint from hardware/browser signals fresh on every
 * login (see src/lib/deviceFingerprint.ts) — NOT from a value stored in
 * localStorage, which the spec explicitly calls out as forgeable/deletable.
 * The server never stores the raw fingerprint components (that would be an
 * unnecessary privacy-sensitive fingerprint database) — only this keyed hash,
 * which is enough to tell "same device" from "different device" on repeat visits.
 */
export function hashDeviceFingerprint(fingerprint: string): string {
  return createHmac("sha256", env.DEVICE_PEPPER).update(fingerprint).digest("hex");
}
