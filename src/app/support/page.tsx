"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

type Faq = { id: string; question: string; answer: string };
type Bubble = { from: "bot" | "user"; text: string };

export default function SupportPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([
    { from: "bot", text: "أهلاً بيك 👋 أنا مساعد SMART ZONE الذكي. اختار سؤالك من تحت وهجاوبك فورًا، ولو مش لاقي سؤالك، اكتبه تحت." }
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<{ faqs: Faq[] }>("/api/faqs").then((r) => {
      if (r.ok) setFaqs(r.data.faqs);
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles, typing]);

  function askFaq(f: Faq) {
    setBubbles((b) => [...b, { from: "user", text: f.question }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setBubbles((b) => [...b, { from: "bot", text: f.answer }]);
    }, 700 + Math.random() * 400);
  }

  async function sendCustom() {
    const text = input.trim();
    if (!text || sending) return;
    setBubbles((b) => [...b, { from: "user", text }]);
    setInput("");
    setSending(true);
    setTyping(true);

    await apiFetch("/api/support", { method: "POST", body: JSON.stringify({ message: text }) });

    setTimeout(() => {
      setTyping(false);
      setSending(false);
      setBubbles((b) => [
        ...b,
        { from: "bot", text: "تمام، وصل سؤالك لفريق الدعم وهيتم الرد عليك في أقرب وقت 🙏" }
      ]);
    }, 700 + Math.random() * 400);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-8">
      <h1 className="font-display mb-6 text-center text-lg font-extrabold">🤖 الدعم الذكي</h1>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4">
        {bubbles.map((b, i) => (
          <div
            key={i}
            className={
              "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-8 " +
              (b.from === "bot"
                ? "self-start rounded-bl-sm border border-ice/20 bg-white/5"
                : "self-end rounded-br-sm border border-ice/40 bg-ice/10 font-semibold")
            }
          >
            {b.text}
          </div>
        ))}
        {typing && (
          <div className="flex w-fit gap-1 self-start rounded-2xl rounded-bl-sm border border-ice/20 bg-white/5 px-4 py-3">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ice-dim [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ice-dim [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ice-dim [animation-delay:300ms]" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
        {faqs.map((f) => (
          <button
            key={f.id}
            onClick={() => askFaq(f)}
            className="rounded-xl border border-ice/20 bg-white/5 px-4 py-3 text-right text-sm transition hover:border-ice hover:bg-ice/10"
          >
            {f.question}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendCustom()}
          placeholder="اكتب سؤالك هنا لو مش لاقيه فوق..."
          className="flex-1 rounded-2xl border border-ice/25 bg-white/5 px-4 py-3 text-sm outline-none focus:border-ice"
        />
        <button
          onClick={sendCustom}
          disabled={sending}
          className="btn-primary rounded-2xl px-5 font-display font-bold disabled:opacity-60"
        >
          إرسال
        </button>
      </div>
    </main>
  );
}
