"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { apiFetch } from "@/lib/apiClient";

type Subject = { id: string; name: string; track: string; imageUrl: string | null };
const TRACK_NAMES: Record<string, string> = { SCI: "علمي علوم", MATH: "علمي رياضة", LIT: "أدبي" };

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [track, setTrack] = useState("SCI");
  const [imageUrl, setImageUrl] = useState("");

  const load = useCallback(async () => {
    const r = await apiFetch<{ subjects: Subject[] }>("/api/admin/subjects");
    if (r.ok) setSubjects(r.data.subjects);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!name.trim()) return;
    await apiFetch("/api/admin/subjects", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), track, imageUrl: imageUrl.trim() || undefined })
    });
    setName("");
    setImageUrl("");
    load();
  }

  async function del(id: string) {
    if (!confirm("تحذف المادة دي؟ هيتحذف معاها كل المدرسين والكورسات جواها.")) return;
    await apiFetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="min-h-screen pb-24">
      <AdminNav />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display mb-2 text-xl font-extrabold">إدارة المواد</h1>
        <p className="mb-6 text-sm text-silver-dim">
          المستوى الأول: Track ← <b className="text-ice">المادة</b> ← مدرس ← كورس ← يوم ← فيديو
        </p>

        <section className="glass-card mb-6 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم المادة"
              className="rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice"
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
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="رابط صورة المادة (اختياري)"
              className="rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice"
            />
          </div>
          <button onClick={add} className="btn-primary mt-3 rounded-xl px-6 py-2.5 font-display font-bold">
            ➕ إضافة مادة
          </button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((s) => (
            <div key={s.id} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display font-bold">{s.name}</div>
                  <div className="text-xs text-silver-dim">{TRACK_NAMES[s.track]}</div>
                </div>
                <button onClick={() => del(s.id)} className="mini-btn text-danger">حذف</button>
              </div>
              <Link
                href={`/admin/content/subjects/${s.id}/teachers`}
                className="btn-primary mt-4 block rounded-xl py-2 text-center text-sm font-bold"
              >
                إدارة المدرسين ←
              </Link>
            </div>
          ))}
          {subjects.length === 0 && <p className="col-span-full text-center text-silver-dim">مفيش مواد لسه</p>}
        </div>
      </div>
    </main>
  );
}
