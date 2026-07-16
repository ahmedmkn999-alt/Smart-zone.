"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { apiFetch } from "@/lib/apiClient";

type Course = { id: string; title: string };

export default function AdminCoursesPage({ params }: { params: { id: string } }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");

  const load = useCallback(async () => {
    const r = await apiFetch<{ courses: Course[] }>(`/api/admin/courses?teacherId=${params.id}`);
    if (r.ok) setCourses(r.data.courses);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!title.trim()) return;
    await apiFetch("/api/admin/courses", {
      method: "POST",
      body: JSON.stringify({ teacherId: params.id, title: title.trim() })
    });
    setTitle("");
    load();
  }

  async function del(id: string) {
    if (!confirm("تحذف الكورس ده؟ هيتحذف معاه كل أيامه وحصصه.")) return;
    await apiFetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="min-h-screen pb-24">
      <AdminNav />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/admin/content/subjects" className="text-sm text-ice-dim">← رجوع للمواد</Link>
        <h1 className="font-display mt-3 mb-6 text-xl font-extrabold">إدارة الكورسات (الشهور)</h1>

        <section className="glass-card mb-6 flex flex-wrap gap-3 p-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="اسم الكورس، مثلاً: شهر أكتوبر"
            className="flex-1 rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice"
          />
          <button onClick={add} className="btn-primary rounded-xl px-6 font-display font-bold">➕ إضافة كورس</button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <div key={c.id} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div className="font-display font-bold">📚 {c.title}</div>
                <button onClick={() => del(c.id)} className="mini-btn text-danger">حذف</button>
              </div>
              <Link
                href={`/admin/content/courses/${c.id}/days`}
                className="btn-primary mt-4 block rounded-xl py-2 text-center text-sm font-bold"
              >
                إدارة الأيام ←
              </Link>
            </div>
          ))}
          {courses.length === 0 && <p className="col-span-full text-center text-silver-dim">مفيش كورسات لسه</p>}
        </div>
      </div>
    </main>
  );
}
