import { cookies } from "next/headers";
import { isProd } from "./env";

export const COOKIE_NAMES = {
  studentAccess: "sz_access",
  studentRefresh: "sz_refresh",
  adminAccess: "sz_admin_access",
  adminRefresh: "sz_admin_refresh",
  adminPending: "sz_admin_pending", // بعد الباسورد قبل التحقق من TOTP — عمره قصير جدًا
  csrf: "sz_csrf" // deliberately NOT httpOnly — the client must be able to read it to echo it back
} as const;

const baseSecure = {
  httpOnly: true,
  secure: isProd, // Secure cookies require HTTPS — off only for local http://localhost dev
  sameSite: "strict" as const,
  path: "/"
};

export function setAuthCookies(opts: {
  accessName: string;
  refreshName: string;
  accessToken: string;
  refreshToken: string;
}) {
  const jar = cookies();
  jar.set(opts.accessName, opts.accessToken, { ...baseSecure, maxAge: 60 * 15 }); // 15 min
  jar.set(opts.refreshName, opts.refreshToken, { ...baseSecure, maxAge: 60 * 60 * 24 * 30 }); // 30 days
}

export function clearAuthCookies(accessName: string, refreshName: string) {
  const jar = cookies();
  jar.set(accessName, "", { ...baseSecure, maxAge: 0 });
  jar.set(refreshName, "", { ...baseSecure, maxAge: 0 });
}

export function setCsrfCookie(token: string) {
  cookies().set(COOKIE_NAMES.csrf, token, {
    httpOnly: false,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 4
  });
}

export function setPendingAdminCookie(token: string) {
  cookies().set(COOKIE_NAMES.adminPending, token, {
    ...baseSecure,
    maxAge: 60 * 5 // 5 دقايق بس عشان يكمّل الـ TOTP
  });
}

export function clearPendingAdminCookie() {
  cookies().set(COOKIE_NAMES.adminPending, "", { ...baseSecure, maxAge: 0 });
}
