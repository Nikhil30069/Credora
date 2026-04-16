import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/* ─── Brand logo tiles (SVGs in /public/brands — replace files to update) ─ */
function BrandTile({
  src,
  alt,
  frameClassName,
  imgClassName,
}: {
  src: string;
  alt: string;
  frameClassName: string;
  imgClassName?: string;
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center overflow-hidden rounded-2xl p-3 sm:p-4 ${frameClassName}`}
    >
      <Image
        src={src}
        alt={alt}
        width={320}
        height={160}
        unoptimized
        className={
          imgClassName ??
          "h-auto max-h-11 w-full max-w-[7.5rem] object-contain sm:max-h-[3.25rem]"
        }
      />
    </div>
  );
}

const STEPS = [
  {
    icon: (
      <svg className="h-7 w-7 text-[var(--color-credora-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21 18.75 2.25M20.25 12V5.75A2.25 2.25 0 0 0 18 3.5H8.75m10.5 0 3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 8.25a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z" />
      </svg>
    ),
    title: "Sign in with your org email",
    text: "Your work or college Google account puts you in a private community with people on the same domain — no invite needed.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-[var(--color-credora-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: "Search, then request what you need",
    text: "Browse popular listings and search by card, subscription, or owner. Send a request with context — if it’s accepted, you connect.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-[var(--color-credora-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    title: "List assets when you want to share",
    text: "Optional: add a card or subscription you’re happy to lend — your community can discover it the same way.",
  },
];

const DEMO_SPOTLIGHT = [
  {
    title: "Netflix Premium",
    hint: "Streaming · style preview",
    logo: "/brands/netflix.svg",
    tint: "from-red-950 via-zinc-900 to-black",
  },
  {
    title: "Disney+ Hotstar",
    hint: "Streaming · style preview",
    logo: "/brands/hotstar.svg",
    tint: "from-indigo-950 via-blue-950 to-slate-950",
  },
  {
    title: "American Express Platinum",
    hint: "Card perks · style preview",
    logo: "/brands/americanexpress.svg",
    tint: "from-sky-900 via-blue-950 to-slate-950",
  },
] as const;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard?tab=search");

  return (
    <div className="min-h-dvh bg-white text-[var(--color-credora-ink)]">
      {/* ─── Nav ────────────────────────────────────────────────────────── */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-credora-ink)] text-sm font-black text-white">
            C
          </span>
          <span className="text-lg font-bold tracking-tight">Credora</span>
        </div>
        <Link
          href="/login"
          className="rounded-full bg-[var(--color-credora-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
        >
          Sign In
        </Link>
      </nav>

      {/* ─── Hero: search-first ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-8 top-24 h-20 w-20 opacity-[0.14] motion-reduce:opacity-10">
            <div className="h-full w-full animate-float-slow motion-reduce:animate-none">
              <BrandTile src="/brands/netflix.svg" alt="" frameClassName="bg-black" />
            </div>
          </div>
          <div className="absolute right-4 top-36 h-20 w-20 opacity-[0.12] motion-reduce:opacity-10">
            <div className="h-full w-full animate-float-slow motion-reduce:animate-none [animation-delay:1s]">
              <BrandTile src="/brands/spotify.svg" alt="" frameClassName="bg-[#1DB954]" />
            </div>
          </div>
          <div className="absolute bottom-32 left-1/4 hidden h-16 w-16 opacity-[0.1] sm:block motion-reduce:opacity-10">
            <div className="h-full w-full animate-float-slow motion-reduce:animate-none [animation-delay:2s]">
              <BrandTile src="/brands/visa.svg" alt="" frameClassName="bg-white shadow-inner ring-1 ring-gray-200" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-12 pt-8 sm:px-10 lg:pb-20 lg:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-credora-slate)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
              100% Free
            </div>

            <h1 className="mt-6 text-[2.4rem] font-extrabold leading-[1.08] tracking-tight text-[var(--color-credora-ink)] sm:text-5xl">
              Find perks your colleagues<br />
              <span className="text-[var(--color-credora-accent)]">already share.</span>
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[var(--color-credora-slate)] sm:text-lg">
              Search cards, subscriptions, and digital benefits inside your private org community — then request what you need.
            </p>

            <Link
              href="/login"
              className="group mt-8 flex w-full max-w-xl mx-auto items-center gap-4 rounded-2xl border-2 border-[var(--color-credora-line)] bg-white py-4 pl-5 pr-5 text-left shadow-md transition hover:border-[var(--color-credora-accent)] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-credora-accent)]"
            >
              <svg className="h-5 w-5 shrink-0 text-[var(--color-credora-slate)] transition group-hover:text-[var(--color-credora-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span className="text-base text-[var(--color-credora-slate)]">
                Search for cards, subscriptions, or owner name…
              </span>
              <span className="ml-auto hidden rounded-full bg-[var(--color-credora-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--color-credora-accent)] sm:inline">
                Sign in to search
              </span>
            </Link>
            <p className="mt-3 text-sm font-medium text-[var(--color-credora-slate)]">
              Find what you need from colleagues you trust.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center gap-3 rounded-xl bg-[var(--color-credora-ink)] px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[var(--color-credora-ink)]/20 transition hover:opacity-90"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Link>
            <p className="mt-3 text-xs text-[var(--color-credora-slate)]">
              No credit card required · Your domain = your community
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-lg font-bold text-[var(--color-credora-ink)]">Popular looks inside Credora</h2>
              <p className="text-xs text-[var(--color-credora-slate)]">Illustrative cards — your real community appears after sign-in.</p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
              {DEMO_SPOTLIGHT.map((d, i) => (
                <div
                  key={d.title}
                  className="relative min-w-[min(100%,260px)] max-w-[260px] flex-[0_0_auto] animate-slide-up overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 motion-reduce:animate-none"
                  style={{ animationDelay: `${100 + i * 80}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${d.tint}`} />
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <Image
                      src={d.logo}
                      alt=""
                      width={180}
                      height={180}
                      unoptimized
                      className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.2] blur-2xl"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                  <div className="relative flex h-[140px] flex-col justify-between p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 p-1 shadow-md ring-1 ring-black/5">
                      <Image src={d.logo} alt="" width={28} height={28} unoptimized className="h-6 w-6 object-contain" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold leading-snug text-white">{d.title}</p>
                      <p className="mt-1 text-xs text-white/70">{d.hint}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Divider ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-credora-line)] to-transparent" />
      </div>

      {/* ─── How it works ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-credora-accent)]">How it works</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--color-credora-ink)]">
            Get started in three steps
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] p-6 transition hover:border-[var(--color-credora-accent)]/40 hover:shadow-md"
            >
              <div className="absolute right-5 top-5 text-5xl font-black text-[var(--color-credora-ink)]/5 select-none leading-none">
                {i + 1}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-credora-accent-soft)]">
                {s.icon}
              </div>
              <h3 className="mt-4 text-base font-bold text-[var(--color-credora-ink)]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-credora-slate)]">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Social proof strip ───────────────────────────────────────────── */}
      <section className="border-y border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] py-10">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="flex flex-wrap items-center justify-center gap-6 text-center sm:justify-between">
            {[
              { stat: "💳", label: "Credit Cards" },
              { stat: "🎬", label: "Netflix" },
              { stat: "📦", label: "Amazon Prime" },
              { stat: "🎵", label: "Spotify" },
              { stat: "🏏", label: "JioHotstar" },
              { stat: "📱", label: "& much more" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-[var(--color-credora-slate)]">
                <span className="text-2xl">{item.stat}</span>
                <span className="font-semibold text-[var(--color-credora-ink)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-credora-ink)] sm:text-4xl">
            Your community is already here.<br />
            <span className="text-[var(--color-credora-accent)]">Are you?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-base text-[var(--color-credora-slate)]">
            Sign in with your work or college Google account to see what your community is sharing right now.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-xl bg-[var(--color-credora-accent)] px-8 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Join my community
          </Link>
          <p className="mt-4 text-xs text-[var(--color-credora-slate)]">
            Credora never stores passwords, card numbers, or subscription credentials.
          </p>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-credora-line)] py-6 text-center text-xs text-[var(--color-credora-slate)]">
        © {new Date().getFullYear()} Credora · Share responsibly · Always respect issuer and platform terms
      </footer>
    </div>
  );
}
