"use client";

import { useEffect, useState, useCallback } from "react";
import AdminNav from "@/components/AdminNav";
import { apiFetch } from "@/lib/apiClient";

type Faq = { id: string; question: string; answer: string; order: number };

const DEFAULTS = [
  { question: "ما سعر الاشتراك؟", answer: "300 جنيه." },
  { question: "كيف أشترك؟", answer: "حول المبلغ على 01114672635 ثم أرسل صورة التحويل داخل المنصة." },
  { question: "مدة الاشتراك؟", answer: "30 يوم." },
  { question: "هل يوجد تجربة؟", answer: "نعم، تجربة مجانية لمدة ساعة." },
  { question: "كيف أحصل على الكود؟", answer: "بعد مراجعة الدفع يتم إرسال الكود." },
  { question: "هل الكود يعمل أكثر من مرة؟", answer: "لا، مرة واحدة فقط." },
  { question: "هل أستطيع تغيير الجهاز؟", answer: "نعم، عن طريق إرسال طلب تغيير جهاز." }
];

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [seeded, setSeeded] = useState(false);

  const load = useCallback(async () => {
    const r = await apiFetch<{ faqs: Faq[] }>("/api/admin/faqs");
    if (r.ok) setFaqs(r.data.faqs);
    return r.ok ? r.data.faqs : [];
  }, []);

  useEffect(() => {
    load().then(async (current) => {
      if (!seeded && current.length === 0) {
        setSeeded(true);
        for (const item of DEFAULTS) {
          await apiFetch("/api/admin/faqs", { method: "POST", body: JSON.stringify(item) });
        }
        load();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add() {
    if (!question.trim() || !answer.trim()) return;
    await apiFetch("/api/admin/faqs", {
      method: "POST",
      body: JSON.stringify({ question: question.trim(), answer: answer.trim() })
    });
    setQuestion("");
    setAnswer("");
    load();
  }

  async function editItem(f: Faq) {
    const newQ = prompt("عدّل السؤال:", f.question);
    if (newQ === null) return;
    const newA = prompt("عدّل الإجابة:", f.answer);
    if (newA === null) return;
    await apiFetch(`/api/admin/faqs/${f.id}`, {
      method: "PATCH",
      body: JSON.stringify({ question: newQ.trim(), answer: newA.trim() })
    });
    load();
  }

  async function del(id: string) {
    if (!confirm("تحذف السؤال ده؟")) return;
    await apiFetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="min-h-screen pb-24">
      <AdminNav />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display mb-6 text-xl font-extrabold">الأسئلة الشائعة (الدعم الذكي)</h1>

        <section className="glass-card mb-6 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="السؤال"
              className="rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice"
            />
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="الإجابة"
              className="rounded-xl border border-ice/25 bg-white/5 p-3 outline-none focus:border-ice"
            />
          </div>
          <button onClick={add} className="btn-primary mt-3 rounded-xl px-6 py-2.5 font-display font-bold">
            ➕ إضافة سؤال
          </button>
        </section>

        <section className="glass-card p-6">
          <div className="flex flex-col gap-3">
            {faqs.map((f) => (
              <div key={f.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display font-bold">{f.question}</div>
                    <div className="mt-1 text-sm text-silver-dim">{f.answer}</div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => editItem(f)} className="mini-btn text-ice">تعديل</button>
                    <button onClick={() => del(f.id)} className="mini-btn text-danger">حذف</button>
                  </div>
                </div>
              </div>
            ))}
            {faqs.length === 0 && <p className="text-center text-silver-dim">مفيش أسئلة لسه</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
