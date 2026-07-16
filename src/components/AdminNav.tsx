import Link from "next/link";

const links = [
  { href: "/admin/dashboard", label: "الرئيسية" },
  { href: "/admin/codes", label: "الأكواد" },
  { href: "/admin/content/subjects", label: "المحتوى" },
  { href: "/admin/faqs", label: "الأسئلة الشائعة" },
  { href: "/admin/support", label: "الدعم الفني" },
  { href: "/admin/security", label: "الأمان" },
  { href: "/admin/2fa", label: "2FA" }
];

export default function AdminNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-void/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-4">
        <span className="font-display ml-4 font-extrabold">لوحة تحكم SMART ZONE</span>
        <nav className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-silver-dim hover:border-ice/40 hover:text-ice"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
