"use client";

import { useEffect, useState } from "react";

export default function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [text, setText] = useState("--:--:--:--");

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setText("انتهت الصلاحية");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setText(`${d} : ${h} : ${m} : ${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <div className="font-display text-3xl font-black tracking-widest text-ice">{text}</div>
  );
}
