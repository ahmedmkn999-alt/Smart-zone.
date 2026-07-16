"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { apiFetch } from "@/lib/apiClient";

type Day = { id: string; title: string };

export default function AdminDaysPage({ params }: { params: { id: string } }) {
  const [days, setDays] = useState<Day[]>([]);
  const [title, setTitle] = useState("");

  const load = useCallback(async () => {
    const r = await apiFetch<{ days: Day[] }>(`/api/admin/days?courseId=${params.id}`);
    if (r.ok) setDays(r.data.days);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!title.trim()) return;
    await apiFetch("/api/admin/days", {
      method: "POST",
      body: JSON.stringify({ courseId: params.id, title: title.trim() })
    });
    setTitle("");
    load();
  }

  async function del(id: string) {
    if (!confirm("تحذف اليوم ده؟ هتتحذف معاه كل حصصه.")) return;
    await apiFetch(`/api/admin/days/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="min-h-screen pb-24">
      <AdminNav />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/admin/content/subjects" className="text-sm text-ice-dim">← رجوع للمواد</Link>
        <h1 className="font-display mt-3 mb-6 text-xl font-extrabold">إدارة الأيام</h1>

        <section className="glass-card mb-6 flex flex-wrap gap-3 p-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="اسم اليوم، مثلاً: اليوم الأول"
            className="flex-1 rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice"
          />
          <button onClick={add} className="btn-primary rounded-xl px-6 font-display font-bold">➕ إضافة يوم</button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {days.map((d) => (
            <div key={d.id} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div className="font-display font-bold">🗓️ {d.title}</div>
                <button onClick={() => del(d.id)} className="mini-btn text-danger">حذف</button>
              </div>
              <Link
                href={`/admin/content/days/${d.id}/lessons`}
                className="btn-primary mt-4 block rounded-xl py-2 text-center text-sm font-bold"
              >
                إدارة الحصص ←
              </Link>
            </div>
          ))}
          {days.length === 0 && <p className="col-span-full text-center text-silver-dim">مفيش أيام لسه</p>}
        </div>
      </div>
    </main>
  );
}
