"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { apiFetch } from "@/lib/apiClient";

type Teacher = { id: string; name: string; photoUrl: string | null; bio: string | null };

export default function AdminTeachersPage({ params }: { params: { id: string } }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");

  const load = useCallback(async () => {
    const r = await apiFetch<{ teachers: Teacher[] }>(`/api/admin/teachers?subjectId=${params.id}`);
    if (r.ok) setTeachers(r.data.teachers);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!name.trim()) return;
    await apiFetch("/api/admin/teachers", {
      method: "POST",
      body: JSON.stringify({
        subjectId: params.id,
        name: name.trim(),
        photoUrl: photoUrl.trim() || undefined,
        bio: bio.trim() || undefined
      })
    });
    setName("");
    setPhotoUrl("");
    setBio("");
    load();
  }

  async function del(id: string) {
    if (!confirm("تحذف المدرس ده؟ هيتحذف معاه كل كورساته.")) return;
    await apiFetch(`/api/admin/teachers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="min-h-screen pb-24">
      <AdminNav />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/admin/content/subjects" className="text-sm text-ice-dim">← رجوع للمواد</Link>
        <h1 className="font-display mt-3 mb-6 text-xl font-extrabold">إدارة المدرسين</h1>

        <section className="glass-card mb-6 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المدرس"
              className="rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice" />
            <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="رابط صورة المدرس"
              className="rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice" />
            <input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="نبذة قصيرة (اختياري)"
              className="rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice" />
          </div>
          <button onClick={add} className="btn-primary mt-3 rounded-xl px-6 py-2.5 font-display font-bold">
            ➕ إضافة مدرس
          </button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {teachers.map((t) => (
            <div key={t.id} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div className="font-display font-bold">{t.name}</div>
                <button onClick={() => del(t.id)} className="mini-btn text-danger">حذف</button>
              </div>
              <Link
                href={`/admin/content/teachers/${t.id}/courses`}
                className="btn-primary mt-4 block rounded-xl py-2 text-center text-sm font-bold"
              >
                إدارة الكورسات ←
              </Link>
            </div>
          ))}
          {teachers.length === 0 && <p className="col-span-full text-center text-silver-dim">مفيش مدرسين لسه</p>}
        </div>
      </div>
    </main>
  );
}
