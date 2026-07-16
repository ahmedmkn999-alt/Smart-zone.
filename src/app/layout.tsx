import type { Metadata } from "next";
import { cookies } from "next/headers";
import { generateCsrfToken } from "@/lib/csrf";
import { setCsrfCookie } from "@/lib/cookies";
import { COOKIE_NAMES } from "@/lib/cookies";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMART ZONE | المنصة التعليمية لطلاب الثانوية العامة",
  description: "شروحات، بنك أسئلة، ومتابعة حقيقية لطلاب الثانوية العامة"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // بيتعمل مرة واحدة فين ما الكوكي مش موجود — نفس الرمز اللي بيتحقق منه
  // assertCsrf() في src/lib/csrf.ts. متعملوش في middleware.ts لأنه بيستخدم
  // Node's crypto (HMAC) اللي مش متاح في Edge runtime بتاع الـ middleware.
  if (!cookies().get(COOKIE_NAMES.csrf)) {
    setCsrfCookie(generateCsrfToken());
  }

  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
