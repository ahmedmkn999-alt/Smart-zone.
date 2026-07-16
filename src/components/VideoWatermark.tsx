"use client";

import { useEffect, useState } from "react";

// علامة مائية شبه شفافة بتتحرك لأماكن عشوائية فوق الفيديو كل شوية — رادع ضد
// تصوير الشاشة بالموبايل، مش تشفير حقيقي للفيديو نفسه (شوف src/lib/videoAccess.ts)
export default function VideoWatermark({ label }: { label: string }) {
  const [pos, setPos] = useState({ top: "10%", left: "10%" });

  useEffect(() => {
    const move = () => {
      setPos({
        top: `${5 + Math.random() * 80}%`,
        left: `${5 + Math.random() * 70}%`
      });
    };
    move();
    const id = setInterval(move, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="pointer-events-none absolute z-10 select-none font-display text-xs font-bold text-white/40 transition-all duration-1000 sm:text-sm"
      style={{ top: pos.top, left: pos.left, textShadow: "0 0 6px rgba(0,0,0,.6)" }}
    >
      {label}
    </div>
  );
}
