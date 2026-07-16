import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getVerifiedStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function TeachersPage({ params }: { params: { subjectId: string } }) {
  const claims = await getVerifiedStudentSession();
  if (!claims) redirect("/login");

  const subject = await prisma.subject.findUnique({ where: { id: params.subjectId } });
  if (!subject || subject.track !== claims.track) notFound();

  const teachers = await prisma.teacher.findMany({
    where: { subjectId: subject.id },
    orderBy: { order: "asc" }
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/subjects" className="text-sm text-ice-dim">
        ← رجوع للمواد
      </Link>
      <h1 className="font-display mt-4 mb-8 text-2xl font-extrabold">مدرسين {subject.name}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {teachers.length === 0 && (
          <p className="col-span-full text-center text-silver-dim">لسه مفيش مدرسين مضافين للمادة دي</p>
        )}
        {teachers.map((t) => (
          <Link
            key={t.id}
            href={`/teachers/${t.id}/courses`}
            className="glass-card flex items-center gap-4 p-5 transition hover:border-ice/40"
          >
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ice/20 bg-white/5">
              {t.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.photoUrl} alt={t.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl">👨‍🏫</span>
              )}
            </span>
            <div>
              <div className="font-display font-bold">{t.name}</div>
              {t.bio && <div className="mt-1 text-xs text-silver-dim">{t.bio}</div>}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
