import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getVerifiedStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DaysPage({ params }: { params: { courseId: string } }) {
  const claims = await getVerifiedStudentSession();
  if (!claims) redirect("/login");

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: { teacher: { include: { subject: true } } }
  });
  if (!course || course.teacher.subject.track !== claims.track) notFound();

  const days = await prisma.courseDay.findMany({
    where: { courseId: course.id },
    orderBy: { order: "asc" }
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href={`/teachers/${course.teacherId}/courses`} className="text-sm text-ice-dim">
        ← رجوع للكورسات
      </Link>
      <h1 className="font-display mt-4 mb-8 text-2xl font-extrabold">أيام {course.title}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {days.length === 0 && (
          <p className="col-span-full text-center text-silver-dim">لسه مفيش أيام مضافة</p>
        )}
        {days.map((d) => (
          <Link
            key={d.id}
            href={`/days/${d.id}/lessons`}
            className="glass-card p-6 font-display font-bold transition hover:border-ice/40"
          >
            🗓️ {d.title}
          </Link>
        ))}
      </div>
    </main>
  );
}
