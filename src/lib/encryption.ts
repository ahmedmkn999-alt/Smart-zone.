import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "./env";

/*
 * AES-256-GCM for any field that must be stored *reversibly* (unlike passwords/codes,
 * which are one-way hashed). Not used by default anywhere yet, but available for
 * things like storing a teacher's private contact info, payment proof metadata, etc.
 * ENCRYPTION_KEY must be a 32-byte key, base64-encoded, in the environment.
 */

const key = Buffer.from(env.ENCRYPTION_KEY, "base64");
if (key.length !== 32) {
  throw new Error("ENCRYPTION_KEY لازم يكون 32 بايت بالظبط (base64) — راجع .env.example");
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv.authTag.ciphertext ، كله base64
  return `${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Malformed encrypted payload");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
