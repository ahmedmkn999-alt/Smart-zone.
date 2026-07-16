import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { env } from "./env";
import { COOKIE_NAMES } from "./cookies";

export const CSRF_HEADER = "x-csrf-token";

// Double-submit cookie pattern:
// 1. Server issues a random token, signed with a server secret, in a readable cookie.
// 2. The client's fetch() must echo that exact token back in a custom header.
// 3. A cross-site form/script can trigger a cookie-carrying request, but it CANNOT
//    read the cookie's value (browsers block cross-origin cookie reads) to put it
//    in the header — so a forged request fails this check even with valid session cookies.
export function generateCsrfToken(): string {
  const raw = randomBytes(24).toString("hex");
  const sig = createHmac("sha256", env.CSRF_SECRET).update(raw).digest("hex");
  return `${raw}.${sig}`;
}

function isValidSignature(token: string): boolean {
  const [raw, sig] = token.split(".");
  if (!raw || !sig) return false;
  const expected = createHmac("sha256", env.CSRF_SECRET).update(raw).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Call this in every mutating route handler (POST/PATCH/DELETE) before touching the DB.
export function assertCsrf(): { ok: true } | { ok: false; reason: string } {
  const cookieToken = cookies().get(COOKIE_NAMES.csrf)?.value;
  const headerToken = headers().get(CSRF_HEADER);

  if (!cookieToken || !headerToken) return { ok: false, reason: "MISSING_CSRF_TOKEN" };
  if (!isValidSignature(cookieToken)) return { ok: false, reason: "INVALID_CSRF_SIGNATURE" };
  if (cookieToken !== headerToken) return { ok: false, reason: "CSRF_TOKEN_MISMATCH" };
  return { ok: true };
}
