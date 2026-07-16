"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await apiFetch<{ needsTotp: boolean }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.data.needsTotp) {
      setNeedsTotp(true);
      return;
    }
    router.push("/admin/dashboard");
  }

  async function submitTotp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await apiFetch("/api/admin/login/totp", {
      method: "POST",
      body: JSON.stringify({ code: totp })
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={needsTotp ? submitTotp : submitPassword}
        className="glass-card w-full max-w-sm p-9 text-center"
      >
        <h1 className="font-display text-lg font-extrabold">دخول المشرف</h1>
        <p className="mt-2 text-sm text-silver-dim">
          {needsTotp ? "اكتب كود التحقق من تطبيق المصادقة" : "لوحة التحكم بتاعة SMART ZONE"}
        </p>

        {!needsTotp ? (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="الإيميل"
              className="mt-6 w-full rounded-xl border border-ice/25 bg-white/5 p-3 text-center outline-none focus:border-ice"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة السر"
              className="mt-3 w-full rounded-xl border border-ice/25 bg-white/5 p-3 text-center outline-none focus:border-ice"
            />
          </>
        ) : (
          <input
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            placeholder="123456"
            className="mt-6 w-full rounded-xl border border-ice/25 bg-white/5 p-3 text-center font-display text-lg tracking-widest outline-none focus:border-ice"
          />
        )}

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <button
          disabled={loading}
          className="btn-primary mt-5 w-full rounded-xl py-3 font-display font-extrabold disabled:opacity-60"
        >
          {loading ? "..." : needsTotp ? "تأكيد" : "دخول"}
        </button>
      </form>
    </main>
  );
}
