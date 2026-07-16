"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { apiFetch } from "@/lib/apiClient";

type Lesson = { id: string; title: string; videoUrl: string };

export default function AdminLessonsPage({ params }: { params: { id: string } }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const load = useCallback(async () => {
    const r = await apiFetch<{ lessons: Lesson[] }>(`/api/admin/lessons?dayId=${params.id}`);
    if (r.ok) setLessons(r.data.lessons);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!title.trim() || !videoUrl.trim()) return;
    await apiFetch("/api/admin/lessons", {
      method: "POST",
      body: JSON.stringify({ dayId: params.id, title: title.trim(), videoUrl: videoUrl.trim() })
    });
    setTitle("");
    setVideoUrl("");
    load();
  }

  async function del(id: string) {
    if (!confirm("تحذف الحصة دي؟")) return;
    await apiFetch(`/api/admin/lessons/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="min-h-screen pb-24">
      <AdminNav />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/admin/content/subjects" className="text-sm text-ice-dim">← رجوع للمواد</Link>
        <h1 className="font-display mt-3 mb-6 text-xl font-extrabold">إدارة الحصص (فيديو = حصة)</h1>

        <section className="glass-card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="اسم الحصة، مثلاً: الحصة الأولى"
            className="rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice"
          />
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="رابط الفيديو (embed link)"
            className="rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice"
          />
          <button onClick={add} className="btn-primary rounded-xl px-6 py-2.5 font-display font-bold sm:col-span-2">
            ➕ إضافة حصة
          </button>
        </section>

        <div className="flex flex-col gap-3">
          {lessons.map((l) => (
            <div key={l.id} className="glass-card flex items-center justify-between p-4">
              <div>
                <div className="font-display font-bold">🎬 {l.title}</div>
                <div className="mt-1 max-w-md truncate text-xs text-silver-dim">{l.videoUrl}</div>
              </div>
              <button onClick={() => del(l.id)} className="mini-btn text-danger">حذف</button>
            </div>
          ))}
          {lessons.length === 0 && <p className="text-center text-silver-dim">مفيش حصص لسه</p>}
        </div>
      </div>
    </main>
  );
}
