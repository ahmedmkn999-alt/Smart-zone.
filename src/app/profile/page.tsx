import { redirect } from "next/navigation";
import Link from "next/link";
import { getVerifiedStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import CountdownTimer from "@/components/CountdownTimer";

const TRACK_NAMES: Record<string, string> = { SCI: "علمي علوم", MATH: "علمي رياضة", LIT: "أدبي" };

export default async function ProfilePage() {
  const claims = await getVerifiedStudentSession();
  if (!claims) redirect("/login");

  const code = await prisma.code.findUnique({ where: { id: claims.sub } });
  if (!code) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/subjects" className="mb-4 block text-center text-sm text-ice-dim">
          ← رجوع لقائمة المواد
        </Link>
        <div className="glass-card p-9 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border border-ice/30 bg-ice/10 text-3xl">
            👑
          </div>
          <h2 className="font-display text-lg font-extrabold">{code.name || "طالب SMART ZONE"}</h2>
          <span className="mt-2 inline-block rounded-full border border-ice/30 bg-ice/10 px-3 py-1 text-xs font-bold text-ice">
            {TRACK_NAMES[code.track]}
          </span>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-good">✅ نشط</span>
              <span className="text-silver-dim">{code.name ? "اشتراك شهري" : "كود تجربة"}</span>
            </div>
          </div>

          <div className="mt-6">
            <CountdownTimer expiresAt={code.expiresAt.toISOString()} />
            <div className="mt-2 flex justify-between px-1 text-xs text-silver-dim">
              <span>أيام</span>
              <span>ساعات</span>
              <span>دقائق</span>
              <span>ثواني</span>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-silver-dim">
            <span>كودك الحالي</span>
            <b className="font-display tracking-widest text-ice">****{code.codeLast4}</b>
          </div>
        </div>
      </div>
    </main>
  );
}
