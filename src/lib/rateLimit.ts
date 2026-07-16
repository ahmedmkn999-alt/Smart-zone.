/*
 * In-memory sliding-window rate limiter.
 *
 * ⚠️ PRODUCTION NOTE: this only works correctly on a single long-running Node
 * process. Serverless platforms (Vercel, etc.) run many isolated instances, so
 * this in-memory map won't be shared between them and the effective limit will
 * be much higher than configured. For real production traffic, swap this for
 * a shared store — Upstash Redis (@upstash/ratelimit) is the drop-in standard
 * choice and works great on serverless. The function signature below is kept
 * intentionally simple so swapping the implementation later doesn't require
 * touching any call sites.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// عيّنات جاهزة للنقاط الحساسة (تسجيل دخول الطالب/الأدمن) — كودين خاطئين كتير من نفس الـ IP يبقى بريفورس
export const LOGIN_RATE_LIMIT = { limit: 8, windowMs: 5 * 60 * 1000 }; // 8 محاولات كل 5 دقايق
export const ADMIN_LOGIN_RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };
export const SUPPORT_MESSAGE_RATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
