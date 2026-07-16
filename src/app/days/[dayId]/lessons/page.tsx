import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getVerifiedStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import LessonVideoPlayer from "@/components/LessonVideoPlayer";

export default async function LessonsPage({ params }: { params: { dayId: string } }) {
  const claims = await getVerifiedStudentSession();
  if (!claims) redirect("/login");

  const day = await prisma.courseDay.findUnique({
    where: { id: params.dayId },
    include: { course: { include: { teacher: { include: { subject: true } } } } }
  });
  if (!day || day.course.teacher.subject.track !== claims.track) notFound();

  const [lessons, code] = await Promise.all([
    prisma.lesson.findMany({ where: { dayId: day.id }, orderBy: { order: "asc" } }),
    prisma.code.findUnique({ where: { id: claims.sub } })
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href={`/courses/${day.courseId}/days`} className="text-sm text-ice-dim">
        ← رجوع للأيام
      </Link>
      <h1 className="font-display mt-4 mb-8 text-2xl font-extrabold">حصص {day.title}</h1>

      <div className="flex flex-col gap-8">
        {lessons.length === 0 && (
          <p className="text-center text-silver-dim">لسه مفيش حصص مضافة لليوم ده</p>
        )}
        {lessons.map((l) => (
          <div key={l.id} className="glass-card p-5">
            <h3 className="font-display mb-3 font-bold">🎬 {l.title}</h3>
            <LessonVideoPlayer
              lessonId={l.id}
              studentName={code?.name || "طالب SMART ZONE"}
              codeLast4={code?.codeLast4 || "----"}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
