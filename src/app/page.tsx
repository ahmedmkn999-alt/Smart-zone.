import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-void/80 backdrop-blur-lg">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-6">
          <span className="font-display text-lg font-extrabold">SMART ZONE</span>
          <Link
            href="/login"
            className="btn-primary rounded-full px-6 py-2 text-sm font-bold"
          >
            دخول الطالب
          </Link>
        </div>
      </nav>

      <header className="px-6 py-24 text-center">
        <span className="font-display text-xs font-bold tracking-widest text-ice-dim">
          اتجاهك نحو التفوق
        </span>
        <h1 className="font-display mt-4 text-5xl font-black tracking-wide text-silver">
          SMART ZONE
        </h1>
        <p className="mt-3 text-lg text-ice">المنصة التعليمية لطلاب الثانوية العامة</p>
        <p className="mx-auto mt-5 max-w-md leading-8 text-silver-dim">
          كل اللي محتاجه للثانوية العامة في مكان واحد، منظم وسهل. شروحات، بنك
          أسئلة، ومتابعة حقيقية لحد ما توصل لهدفك.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link href="/login" className="btn-primary rounded-full px-8 py-4 font-display font-bold">
            🚀 ابدأ رحلة التعلم الآن
          </Link>
          <Link
            href="/support"
            className="rounded-full border border-white/15 bg-white/5 px-8 py-4 font-display font-bold text-silver"
          >
            💬 تواصل معنا
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["+6000", "سؤال في البنك"],
            ["3", "سنين كاملة من المنهج"],
            ["24س", "سرعة التحديث"]
          ].map(([num, label]) => (
            <div key={label} className="glass-card p-7 text-center">
              <div className="font-display text-3xl font-black text-ice">{num}</div>
              <div className="mt-2 text-sm text-silver-dim">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-sm text-silver-dim">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a className="text-ice" href="https://t.me/smart_zone_2027" target="_blank" rel="noopener">
            قناة التيليجرام
          </a>
          <span>·</span>
          <a
            className="text-ice"
            href="https://whatsapp.com/channel/0029Vb8GmomKGGGDH6yerw47"
            target="_blank"
            rel="noopener"
          >
            قناة الواتساب
          </a>
          <span>·</span>
          <Link className="text-ice" href="/support">
            الدعم الفني
          </Link>
        </div>
        <p className="mt-4">© 2026 SMART ZONE | جميع الحقوق محفوظة</p>
        <p className="text-ice-dim">تصميم Ahmed</p>
      </footer>
    </main>
  );
}
