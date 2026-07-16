import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getVerifiedStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function CoursesPage({ params }: { params: { teacherId: string } }) {
  const claims = await getVerifiedStudentSession();
  if (!claims) redirect("/login");

  const teacher = await prisma.teacher.findUnique({
    where: { id: params.teacherId },
    include: { subject: true }
  });
  if (!teacher || teacher.subject.track !== claims.track) notFound();

  const courses = await prisma.course.findMany({
    where: { teacherId: teacher.id },
    orderBy: { order: "asc" }
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href={`/subjects/${teacher.subjectId}/teachers`} className="text-sm text-ice-dim">
        ← رجوع للمدرسين
      </Link>
      <h1 className="font-display mt-4 mb-8 text-2xl font-extrabold">كورسات {teacher.name}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.length === 0 && (
          <p className="col-span-full text-center text-silver-dim">لسه مفيش كورسات مضافة</p>
        )}
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/courses/${c.id}/days`}
            className="glass-card p-6 font-display font-bold transition hover:border-ice/40"
          >
            📚 {c.title}
          </Link>
        ))}
      </div>
    </main>
  );
}
