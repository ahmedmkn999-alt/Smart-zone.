import { NextRequest, NextResponse } from "next/server";

/*
 * Next.js doesn't run Express, so `helmet` itself doesn't apply here — this
 * middleware sets the same category of headers Helmet would, by hand, on
 * every single response (pages AND API routes). This is the project's one
 * and only place headers get set, so there's no route that can accidentally
 * skip them.
 */

const isProd = process.env.NODE_ENV === "production";
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const expectedHost = appUrl ? new URL(appUrl).host : null;

const CSP = [
  "default-src 'self'",
  // Next.js needs 'unsafe-inline' for its hydration bootstrap script in dev;
  // in production this can be tightened further with a per-request nonce.
  "script-src 'self' 'unsafe-inline'" + (isProd ? "" : " 'unsafe-eval'"),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join("; ");

export function middleware(req: NextRequest) {
  // ─── منع استنساخ الموقع عبر Reverse Proxy / DNS Spoofing ───
  // لو حد عمل بروكسي بيوجّه على سيرفرنا بس بدومين تاني (عشان يغيّر الشكل أو
  // يسرق الطلاب)، الـ Host header هيبقى مختلف عن الدومين الرسمي المتوقع.
  if (isProd && expectedHost) {
    const hostHeader = req.headers.get("host");
    if (hostHeader !== expectedHost) {
      return new NextResponse("Invalid host", { status: 421 });
    }
  }

  // ─── Strict CORS: أي طلب بيغيّر بيانات (مش GET) لازم يجي من نفس الأصل ───
  // بيوقف أي موقع خارجي حتى لو حاول ينده على الـ API بتاعنا مباشرة من عنده
  if (req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    if (origin && expectedHost) {
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {
        /* origin غير صالح أصلاً */
      }
      if (originHost !== expectedHost) {
        return new NextResponse("Cross-origin request blocked", { status: 403 });
      }
    }
  }

  // ─── قفل الدخول على لوحة التحكم بـ IP معيّن (اختياري) ───
  // فعّالة بس لو ADMIN_IP_ALLOWLIST متظبطة في .env — سيبها فاضية لو الأدمن
  // بيشتغل من IP متغيّر (نت موبايل مثلًا) وعايز يعتمد على الباسورد + 2FA بس.
  if (req.nextUrl.pathname.startsWith("/admin") && process.env.ADMIN_IP_ALLOWLIST) {
    const allowlist = process.env.ADMIN_IP_ALLOWLIST.split(",").map((s) => s.trim());
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    if (!allowlist.includes(ip)) {
      return new NextResponse("Forbidden — IP not allowed", { status: 403 });
    }
  }

  const res = NextResponse.next();

  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );
  res.headers.set("X-DNS-Prefetch-Control", "off");
  if (isProd) {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  // ملحوظة: الكوكي بتاع CSRF بيتعمل في src/app/layout.tsx مش هنا — الـ middleware هنا
  // بيشتغل على Edge runtime اللي مبيدعمش Node's `crypto` (HMAC) اللي بنستخدمه في
  // lib/csrf.ts للتوقيع، فسيبنا إصدار الكوكي لمكان بيشتغل بـ Node runtime العادي.

  return res;
}

export const config = {
  matcher: [
    // كل حاجة ماعدا ملفات next الثابتة والصور
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};
