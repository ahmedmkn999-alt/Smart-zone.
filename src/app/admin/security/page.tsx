"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { apiFetch } from "@/lib/apiClient";

type Violation = {
  id: string;
  type: string;
  detail: string | null;
  createdAt: string;
  code: { name: string | null; codeLast4: string; track: string; status: string } | null;
};
type Log = {
  id: string;
  actorType: string;
  action: string;
  targetType: string | null;
  createdAt: string;
};

export default function AdminSecurityPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [suspendedCount, setSuspendedCount] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    apiFetch<{ violations: Violation[]; suspendedCount: number }>("/api/admin/security-violations").then(
      (r) => {
        if (r.ok) {
          setViolations(r.data.violations);
          setSuspendedCount(r.data.suspendedCount);
        }
      }
    );
    apiFetch<{ logs: Log[] }>("/api/admin/audit-logs").then((r) => {
      if (r.ok) setLogs(r.data.logs);
    });
  }, []);

  return (
    <main className="min-h-screen pb-24">
      <AdminNav />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display mb-2 text-xl font-extrabold">الأمان</h1>
        <p className="mb-6 text-sm text-silver-dim">
          فتح أدوات المطور وحده مش مخالفة — اللي بيتسجل هنا هو عبث حقيقي متأكد منه السيرفر
          (كود اتستخدم من جهاز تاني، طلب مزوّر، توكن CSRF غلط...). بعد 3 محاولات، الكود
          بيتوقف تلقائيًا وتلاقيه هنا بحالة &quot;موقوف أمنيًا&quot;.
        </p>

        <div className="glass-card mb-6 p-6">
          <div className="font-display text-2xl font-black text-gold">{suspendedCount}</div>
          <div className="text-xs text-silver-dim">كود متوقف أمنيًا حاليًا</div>
        </div>

        <section className="glass-card mb-6 p-6">
          <h2 className="font-display mb-4 font-bold">محاولات العبث</h2>
          <div className="flex flex-col gap-2">
            {violations.map((v) => (
              <div key={v.id} className="rounded-xl border border-danger/25 bg-danger/5 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-bold text-danger">{v.type}</span>
                  <time className="text-xs text-silver-dim">
                    {new Date(v.createdAt).toLocaleString("ar-EG")}
                  </time>
                </div>
                {v.detail && <div className="mt-1 text-silver-dim">{v.detail}</div>}
                {v.code && (
                  <div className="mt-1 text-xs text-silver-dim">
                    {v.code.name || "كود تجربة"} · ****{v.code.codeLast4}
                  </div>
                )}
              </div>
            ))}
            {violations.length === 0 && <p className="text-center text-silver-dim">مفيش محاولات عبث مسجلة</p>}
          </div>
        </section>

        <section className="glass-card p-6">
          <h2 className="font-display mb-4 font-bold">سجل النشاط (Audit Log)</h2>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-right text-silver-dim">
                  <th className="p-2">الفاعل</th>
                  <th className="p-2">الإجراء</th>
                  <th className="p-2">الهدف</th>
                  <th className="p-2">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-white/5">
                    <td className="p-2">{l.actorType}</td>
                    <td className="p-2 text-ice">{l.action}</td>
                    <td className="p-2 text-silver-dim">{l.targetType || "-"}</td>
                    <td className="p-2 text-silver-dim">{new Date(l.createdAt).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
