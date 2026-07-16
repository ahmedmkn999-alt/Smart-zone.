"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import VideoWatermark from "./VideoWatermark";

export default function LessonVideoPlayer({
  lessonId,
  studentName,
  codeLast4
}: {
  lessonId: string;
  studentName: string;
  codeLast4: string;
}) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ videoUrl: string }>(`/api/video/${lessonId}/access`).then((r) => {
      if (r.ok) setVideoUrl(r.data.videoUrl);
      else setError(r.error);
    });
  }, [lessonId]);

  const watermarkLabel = `${studentName} · ****${codeLast4}`;

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-ice/20 bg-black">
      {videoUrl && (
        <>
          <iframe
            src={videoUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <VideoWatermark label={watermarkLabel} />
        </>
      )}
      {!videoUrl && !error && (
        <div className="flex h-full items-center justify-center text-sm text-silver-dim">جاري التحميل...</div>
      )}
      {error && <div className="flex h-full items-center justify-center text-sm text-danger">{error}</div>}
    </div>
  );
}
