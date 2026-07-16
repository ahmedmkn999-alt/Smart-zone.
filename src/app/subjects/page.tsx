import { redirect } from "next/navigation";
import Link from "next/link";
import { getVerifiedStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const TRACK_NAMES: Record<string, string> = { SCI: "علمي علوم", MATH: "علمي رياضة", LIT: "أدبي" };

export default async function SubjectsPage() {
  const claims = await getVerifiedStudentSession();
  if (!claims) redirect("/login");

  const subjects = await prisma.subject.findMany({
    where: { track: claims.track },
    orderBy: { order: "asc" }
  });

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-void/85 backdrop-blur-lg">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-6">
          <span className="font-display font-extrabold">SMART ZONE</span>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-ice/30 bg-ice/10 px-3 py-1 text-xs font-bold text-ice">
              {TRACK_NAMES[claims.track]}
            </span>
            <Link href="/profile" className="rounded-full border border-ice/30 p-2">
              👤
            </Link>
            <Link href="/support" className="rounded-full border border-ice/30 p-2">
              🤖
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 text-center">
        <span className="font-display text-xs font-bold tracking-widest text-ice-dim">
          موادك الدراسية
        </span>
        <h2 className="font-display mt-3 text-2xl font-extrabold">اختار المادة اللي عايز تذاكرها</h2>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 pb-20 sm:grid-cols-3">
        {subjects.length === 0 && (
          <p className="col-span-full text-center text-silver-dim">
            لسه مفيش مواد مضافة لشعبتك — تواصل مع الأدمن
          </p>
        )}
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/subjects/${s.id}/teachers`}
            className="glass-card flex flex-col items-center gap-3 p-5 transition hover:border-ice/40 hover:bg-ice/10"
          >
            <span className="font-display font-bold">{s.name}</span>
            <span className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-ice/20 bg-white/5">
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.imageUrl} alt={s.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl">📘</span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
