"use client";

import { useState } from "react";
import AdminNav from "@/components/AdminNav";
import { apiFetch } from "@/lib/apiClient";

export default function Admin2FAPage() {
  const [uri, setUri] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [enabled, setEnabled] = useState(false);

  async function startSetup() {
    const r = await apiFetch<{ otpauthUri: string; secret: string }>("/api/admin/2fa/setup", {
      method: "POST"
    });
    if (!r.ok) return setStatus(r.error);
    setUri(r.data.otpauthUri);
    setSecret(r.data.secret);
  }

  async function verify() {
    const r = await apiFetch("/api/admin/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ code })
    });
    if (!r.ok) return setStatus(r.error);
    setEnabled(true);
    setStatus("تم تفعيل التحقق بخطوتين بنجاح ✅");
  }

  return (
    <main className="min-h-screen pb-24">
      <AdminNav />
      <div className="mx-auto max-w-lg px-6 py-10">
        <h1 className="font-display mb-2 text-xl font-extrabold">التحقق بخطوتين (2FA)</h1>
        <p className="mb-6 text-sm text-silver-dim">
          بعد التفعيل، هتحتاج تكتب كود من تطبيق زي Google Authenticator أو Authy كل مرة تسجّل دخول فيها، حتى لو حد عرف الباسورد.
        </p>

        {!uri && (
          <button onClick={startSetup} className="btn-primary rounded-xl px-6 py-3 font-display font-bold">
            ابدأ التفعيل
          </button>
        )}

        {uri && !enabled && (
          <div className="glass-card p-6">
            <p className="mb-3 text-sm text-silver-dim">
              افتح تطبيق المصادقة وضيف حساب جديد بالمفتاح ده يدويًا (أو حوّل الرابط تحت لـ QR بأي مولّد أونلاين):
            </p>
            <div className="mb-4 break-all rounded-xl border border-ice/25 bg-white/5 p-3 font-display text-sm text-ice">
              {secret}
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="اكتب الكود المكوّن من 6 أرقام"
              className="w-full rounded-xl border border-ice/25 bg-white/5 p-3 text-center outline-none focus:border-ice"
            />
            <button onClick={verify} className="btn-primary mt-3 w-full rounded-xl py-3 font-display font-bold">
              تأكيد وتفعيل
            </button>
          </div>
        )}

        {status && <p className="mt-4 text-sm text-good">{status}</p>}
      </div>
    </main>
  );
}
