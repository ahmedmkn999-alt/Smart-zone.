import { authenticator } from "otplib";
import { encrypt, decrypt } from "./encryption";

authenticator.options = { window: 1 }; // يسمح بفارق 30 ثانية قبل/بعد عشان فروق الساعة البسيطة

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpKeyUri(secret: string, email: string): string {
  return authenticator.keyuri(email, "SMART ZONE Admin", secret);
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

// السر بيتخزن في قاعدة البيانات مشفّر (AES-256-GCM) مش نص صريح، زي أي بيانات
// حساسة تانية — لو حصل تسريب لقاعدة البيانات، السر مينفعش يتستخدم من غير
// ENCRYPTION_KEY اللي عايش في الـ server env بس.
export function encryptTotpSecret(secret: string): string {
  return encrypt(secret);
}
export function decryptTotpSecret(payload: string): string {
  return decrypt(payload);
}
