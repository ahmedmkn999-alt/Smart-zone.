"use client";

import { useEffect, useState, useCallback } from "react";
import AdminNav from "@/components/AdminNav";
import { apiFetch } from "@/lib/apiClient";

type CodeRow = {
  id: string;
  codeLast4: string;
  type: string;
  name: string | null;
  track: string;
  status: string;
  deviceId: string | null;
  duration: string | null;
  violationCount: number;
  expiresAt: string;
};

const TRACK_NAMES: Record<string, string> = { SCI: "علمي علوم", MATH: "علمي رياضة", LIT: "أدبي" };

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [name, setName] = useState("");
  const [track, setTrack] = useState("SCI");
  const [trialTrack, setTrialTrack] = useState("SCI");
  const [trialDuration, setTrialDuration] = useState<"1H" | "1D">("1H");
  const [search, setSearch] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);
  const [toast, setToastMsg] = useState("");

  const load = useCallback(async () => {
    const r = await apiFetch<{ codes: CodeRow[] }>("/api/admin/codes");
    if (r.ok) setCodes(r.data.codes);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2200);
  }

  async function addStudent() {
    if (!name.trim()) return showToast("اكتب اسم الطالب الأول");
    const r = await apiFetch<{ plainCode: string }>("/api/admin/codes", {
      method: "POST",
      body: JSON.stringify({ kind: "student", name: name.trim(), track })
    });
    if (!r.ok) return showToast(r.error);
    setName("");
    setNewCode(r.data.plainCode);
    load();
  }

  async function addTrial() {
    const r = await apiFetch<{ plainCode: string }>("/api/admin/codes", {
      method: "POST",
      body: JSON.stringify({ kind: "trial", track: trialTrack, duration: trialDuration })
    });
    if (!r.ok) return showToast(r.error);
    setNewCode(r.data.plainCode);
    load();
  }

  async function doAction(id: string, action: string) {
    const r = await apiFetch(`/api/admin/codes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action })
    });
    if (!r.ok) return showToast(r.error);
    showToast("تم");
    load();
  }

  async function doDelete(id: string) {
    if (!confirm("متأكد إنك عايز تحذف الكود ده؟")) return;
    const r = await apiFetch(`/api/admin/codes/${id}`, { method: "DELETE" });
    if (!r.ok) return showToast(r.error);
    load();
  }

  const filtered = codes.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.codeLast4.includes(search)
  );
  const students = filtered.filter((c) => c.type === "student");
  const trials = filtered.filter((c) => c.type === "trial");

  return (
    <main className="min-h-screen pb-24">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display mb-6 text-xl font-extrabold">إدارة الأكواد</h1>

        {/* Add student */}
        <section className="glass-card mb-6 p-6">
          <h2 className="font-display mb-4 font-bold">إضافة طالب جديد</h2>
          <div className="flex flex-wrap gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم الطالب"
              className="flex-1 rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice"
            />
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="rounded-xl border border-ice/25 bg-void p-3 outline-none"
            >
              <option value="SCI">علمي علوم</option>
              <option value="MATH">علمي رياضة</option>
              <option value="LIT">أدبي</option>
            </select>
            <button onClick={addStudent} className="btn-primary rounded-xl px-6 font-display font-bold">
              ➕ إنشاء الكود
            </button>
          </div>
        </section>

        {/* Students table */}
        <section className="glass-card mb-6 p-6">
          <h2 className="font-display mb-4 font-bold">الطلاب والأكواد</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 دور بالاسم أو آخر 4 أرقام من الكود..."
            className="mb-4 w-full rounded-xl border border-ice/20 bg-white/5 p-2.5 text-sm outline-none focus:border-ice"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-silver-dim">
                  <th className="p-2">الاسم</th>
                  <th className="p-2">الشعبة</th>
                  <th className="p-2">الكود</th>
                  <th className="p-2">الحالة</th>
                  <th className="p-2">محاولات عبث</th>
                  <th className="p-2">الجهاز</th>
                  <th className="p-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-white/5">
                    <td className="p-2">{s.name}</td>
                    <td className="p-2 text-silver-dim">{TRACK_NAMES[s.track]}</td>
                    <td className="p-2 font-display text-ice">****{s.codeLast4}</td>
                    <td className="p-2">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-bold " +
                          (s.status === "active"
                            ? "bg-good/15 text-good"
                            : s.status === "suspended"
                            ? "bg-gold/15 text-gold"
                            : "bg-danger/15 text-danger")
                        }
                      >
                        {s.status === "active" ? "نشط" : s.status === "suspended" ? "موقوف أمنيًا" : "محظور"}
                      </span>
                    </td>
                    <td className="p-2 text-silver-dim">{s.violationCount} / 3</td>
                    <td className="p-2 text-silver-dim">{s.deviceId ? "مرتبط بجهاز" : "لسه ماخشش"}</td>
                    <td className="flex flex-wrap gap-1 p-2">
                      <button onClick={() => doAction(s.id, "renew")} className="mini-btn text-ice">تجديد شهر</button>
                      <button onClick={() => doAction(s.id, "reset-device")} className="mini-btn text-good">تغيير الجهاز</button>
                      <button
                        onClick={() => doAction(s.id, s.status === "active" ? "block" : "unblock")}
                        className="mini-btn text-gold"
                      >
                        {s.status === "active" ? "حظر" : "إلغاء الحظر"}
                      </button>
                      {s.violationCount > 0 && (
                        <button onClick={() => doAction(s.id, "reset-violations")} className="mini-btn text-ice-dim">
                          تصفير محاولات العبث
                        </button>
                      )}
                      <button onClick={() => doDelete(s.id)} className="mini-btn text-danger">حذف</button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-silver-dim">مفيش طلاب لسه</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Trial codes */}
        <section className="glass-card p-6">
          <h2 className="font-display mb-4 font-bold">أكواد تجربة</h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={trialTrack}
              onChange={(e) => setTrialTrack(e.target.value)}
              className="rounded-xl border border-ice/25 bg-void p-3 outline-none"
            >
              <option value="SCI">علمي علوم</option>
              <option value="MATH">علمي رياضة</option>
              <option value="LIT">أدبي</option>
            </select>
            <select
              value={trialDuration}
              onChange={(e) => setTrialDuration(e.target.value as "1H" | "1D")}
              className="rounded-xl border border-ice/25 bg-void p-3 outline-none"
            >
              <option value="1H">ساعة واحدة</option>
              <option value="1D">يوم كامل</option>
            </select>
            <button onClick={addTrial} className="btn-primary rounded-xl px-6 font-display font-bold">
              ➕ إنشاء كود تجربة
            </button>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-silver-dim">
                  <th className="p-2">الشعبة</th>
                  <th className="p-2">المدة</th>
                  <th className="p-2">الكود</th>
                  <th className="p-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((t) => (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="p-2 text-silver-dim">{TRACK_NAMES[t.track]}</td>
                    <td className="p-2 text-silver-dim">{t.duration === "1H" ? "ساعة واحدة" : "يوم كامل"}</td>
                    <td className="p-2 font-display text-ice">****{t.codeLast4}</td>
                    <td className="p-2">
                      <button onClick={() => doDelete(t.id)} className="mini-btn text-danger">حذف</button>
                    </td>
                  </tr>
                ))}
                {trials.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-silver-dim">مفيش أكواد تجربة لسه</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* New-code modal */}
      {newCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-6 backdrop-blur-sm"
          onClick={() => setNewCode(null)}
        >
          <div className="glass-card w-full max-w-xs p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 text-3xl">✅</div>
            <h3 className="font-display mb-4 font-bold">تم إنشاء الكود</h3>
            <div className="font-display mb-4 rounded-xl border border-ice/30 bg-ice/10 p-4 text-xl font-black tracking-widest text-ice">
              {newCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newCode);
                showToast("تم النسخ");
              }}
              className="btn-primary mb-2 w-full rounded-xl py-3 font-display font-bold"
            >
              📋 نسخ الكود
            </button>
            <button
              onClick={() => setNewCode(null)}
              className="w-full rounded-xl border border-white/15 py-2.5 text-sm text-silver-dim"
            >
              تمام
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-ice/30 bg-deep px-5 py-3 text-sm">
          {toast}
        </div>
      )}
    </main>
  );
}
