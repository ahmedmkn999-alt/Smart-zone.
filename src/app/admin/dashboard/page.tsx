import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminNav from "@/components/AdminNav";

export default async function AdminDashboard() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const [totalCodes, activeCodes, blockedCodes, suspendedCodes, openThreads, subjectsCount] =
    await Promise.all([
      prisma.code.count(),
      prisma.code.count({ where: { status: "active" } }),
      prisma.code.count({ where: { status: "blocked" } }),
      prisma.code.count({ where: { status: "suspended" } }),
      prisma.supportThread.count({ where: { status: "open" } }),
      prisma.subject.count()
    ]);

  const kpis = [
    ["إجمالي الأكواد", totalCodes],
    ["أكواد نشطة", activeCodes],
    ["أكواد محظورة", blockedCodes],
    ["موقوفة أمنيًا", suspendedCodes],
    ["رسائل دعم مفتوحة", openThreads],
    ["عدد المواد", subjectsCount]
  ] as const;

  return (
    <main className="min-h-screen">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display mb-6 text-xl font-extrabold">
          أهلاً يا {admin.email} 👋
        </h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {kpis.map(([label, value]) => (
            <div key={label} className="glass-card p-6 text-center">
              <div className="font-display text-2xl font-black text-ice">{value}</div>
              <div className="mt-1 text-xs text-silver-dim">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
