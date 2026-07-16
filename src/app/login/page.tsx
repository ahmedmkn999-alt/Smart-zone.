"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { computeDeviceFingerprint } from "@/lib/deviceFingerprint";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.trim().length < 4) {
      setError("من فضلك اكتب كود صحيح مكوّن من 4 خانات على الأقل");
      return;
    }
    setLoading(true);
    const deviceFingerprint = computeDeviceFingerprint();
    const result = await apiFetch("/api/student/login", {
      method: "POST",
      body: JSON.stringify({ code: code.trim(), deviceFingerprint })
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    let n = 5;
    const interval = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(interval);
        router.push("/subjects");
      }
    }, 1000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display mb-1 text-center text-lg font-extrabold">SMART ZONE</h1>

        <div className="glass-card relative overflow-hidden p-9 text-center">
          {!success ? (
            <>
              <h2 className="font-display text-xl font-extrabold">تسجيل الدخول</h2>
              <p className="mt-2 text-sm text-silver-dim">
                اكتب كود الدخول اللي استلمته من المشرف
              </p>
              <form onSubmit={handleSubmit} className="mt-8">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="اكتب الكود هنا"
                  className="w-full rounded-2xl border border-ice/30 bg-white/5 p-4 text-center font-display text-lg font-bold tracking-widest outline-none focus:border-ice"
                />
                {error && <p className="mt-2 text-sm text-danger">{error}</p>}
                <button
                  disabled={loading}
                  className="btn-primary mt-5 w-full rounded-2xl py-4 font-display font-extrabold disabled:opacity-60"
                >
                  {loading ? "جاري التحقق..." : "دخول"}
                </button>
              </form>
              <a href="/support" className="mt-5 block text-sm text-silver-dim">
                مش عندك كود؟ <span className="text-ice">تواصل مع الأدمن</span>
              </a>
            </>
          ) : (
            <>
              <div className="font-display mx-auto text-5xl font-black text-ice">{countdown}</div>
              <h2 className="font-display mt-4 text-lg font-bold">تم التحقق ✓</h2>
              <p className="mt-2 text-sm text-silver-dim">جاري تحويلك للمنصة...</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
