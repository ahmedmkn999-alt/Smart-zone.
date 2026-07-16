"use client";

import { useEffect, useState, useCallback } from "react";
import AdminNav from "@/components/AdminNav";
import { apiFetch } from "@/lib/apiClient";

type Reply = { id: string; sender: string; body: string; createdAt: string };
type Thread = {
  id: string;
  name: string | null;
  track: string | null;
  status: string;
  createdAt: string;
  replies: Reply[];
};

const TRACK_NAMES: Record<string, string> = { SCI: "علمي علوم", MATH: "علمي رياضة", LIT: "أدبي" };

export default function AdminSupportPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const load = useCallback(async () => {
    const r = await apiFetch<{ threads: Thread[] }>("/api/admin/support");
    if (r.ok) setThreads(r.data.threads);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000); // polling بسيط بدل ما نبني WebSocket كامل
    return () => clearInterval(id);
  }, [load]);

  const active = threads.find((t) => t.id === activeId) || null;

  async function sendReply() {
    if (!activeId || !replyText.trim()) return;
    await apiFetch(`/api/admin/support/${activeId}/reply`, {
      method: "POST",
      body: JSON.stringify({ body: replyText.trim() })
    });
    setReplyText("");
    load();
  }

  async function toggleStatus(t: Thread) {
    await apiFetch(`/api/admin/support/${t.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: t.status === "open" ? "resolved" : "open" })
    });
    load();
  }

  return (
    <main className="min-h-screen pb-24">
      <AdminNav />
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[320px_1fr]">
        <section className="glass-card max-h-[70vh] overflow-y-auto p-4">
          <h2 className="font-display mb-3 px-2 font-bold">المحادثات</h2>
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={
                "mb-2 w-full rounded-xl border p-3 text-right text-sm " +
                (t.id === activeId ? "border-ice bg-ice/10" : "border-white/10 bg-white/5")
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{t.name || "زائر"}</span>
                <span className={"text-xs " + (t.status === "open" ? "text-good" : "text-silver-dim")}>
                  {t.status === "open" ? "مفتوحة" : "متحلة"}
                </span>
              </div>
              {t.track && <div className="text-xs text-silver-dim">{TRACK_NAMES[t.track]}</div>}
              <div className="mt-1 truncate text-xs text-silver-dim">
                {t.replies.at(-1)?.body}
              </div>
            </button>
          ))}
          {threads.length === 0 && <p className="p-3 text-sm text-silver-dim">مفيش رسائل لسه</p>}
        </section>

        <section className="glass-card flex max-h-[70vh] flex-col p-5">
          {!active ? (
            <p className="m-auto text-silver-dim">اختار محادثة من الجنب</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-display font-bold">{active.name || "زائر"}</span>
                <button onClick={() => toggleStatus(active)} className="mini-btn text-ice">
                  {active.status === "open" ? "تم الرد ✓" : "إعادة فتح"}
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {active.replies.map((r) => (
                  <div
                    key={r.id}
                    className={
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm " +
                      (r.sender === "admin"
                        ? "mr-auto rounded-br-sm bg-ice/15 text-silver"
                        : "rounded-bl-sm border border-white/10 bg-white/5")
                    }
                  >
                    {r.body}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="اكتب ردك..."
                  className="flex-1 rounded-xl border border-ice/25 bg-white/5 p-2.5 text-sm outline-none focus:border-ice"
                />
                <button onClick={sendReply} className="btn-primary rounded-xl px-4 text-sm font-bold">
                  إرسال
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
