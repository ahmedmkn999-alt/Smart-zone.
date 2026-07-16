import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminSession, getStudentSession } from "./auth";
import { assertCsrf } from "./csrf";
import { AdminClaims, StudentClaims } from "./jwt";

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function requireAdmin(): Promise<AdminClaims | NextResponse> {
  const admin = await getAdminSession();
  if (!admin) return jsonError("غير مصرح لك بالدخول هنا", 401);
  return admin;
}

export async function requireStudent(): Promise<StudentClaims | NextResponse> {
  const student = await getStudentSession();
  if (!student) return jsonError("سجّل الدخول الأول", 401);
  return student;
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

// كل POST/PATCH/DELETE لازم يمر من هنا الأول — بيرجع NextResponse لو الـ CSRF مش سليم
export function requireCsrf(): NextResponse | null {
  const result = assertCsrf();
  if (!result.ok) return jsonError("فشل التحقق من الطلب (CSRF)", 403, { reason: result.reason });
  return null;
}

export function requestMeta() {
  const h = headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const userAgent = h.get("user-agent") || undefined;
  return { ip, userAgent };
}
