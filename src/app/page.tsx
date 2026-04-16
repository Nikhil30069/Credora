import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/* ─── Brand logo tiles ───────────────────────────────────────────────── */
function NetflixLogo() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black">
      <svg viewBox="0 0 111 190" className="h-10 w-auto" fill="none">
        <path d="M0 0h30.4l27.5 72.9V0h30.4v190H58l-27.6-73V190H0V0z" fill="#E50914"/>
        <path d="M80.3 0h30.4v190H80.3V0z" fill="#E50914"/>
      </svg>
    </div>
  );
}

function PrimeLogo() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-[#00A8E1] gap-0.5 px-3">
      <span className="text-[11px] font-bold tracking-widest text-white uppercase">prime</span>
      <svg viewBox="0 0 80 14" className="w-14" fill="none">
        <path d="M6 4 Q40 14 74 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M68 1 L74 4 L68 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </div>
  );
}

function SpotifyLogo() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#1DB954]">
      <svg viewBox="0 0 168 168" className="h-12 w-12">
        <circle cx="84" cy="84" r="84" fill="#1DB954"/>
        <path d="M120.4 118.5a7 7 0 0 1-9.7 2.3c-26.6-16.3-60.2-20-99.7-10.9a7 7 0 1 1-3.1-13.6c43.3-9.9 80.4-5.6 110.2 12.6a7 7 0 0 1 2.3 9.6zM133 88.4a8.7 8.7 0 0 1-12 3c-30.5-18.8-77-24.2-113.1-13.2a8.7 8.7 0 1 1-5-16.7c41.3-12.2 92.7-6.3 127.8 15.1a8.7 8.7 0 0 1 2.3 11.8zM134.3 57.8C97.5 36.3 35.6 34.3 0 45.1a10.5 10.5 0 1 1-5.9-20.1C38.2 13 107.8 15.4 151.5 40.5a10.5 10.5 0 1 1-17.2 17.3z" fill="white"/>
      </svg>
    </div>
  );
}

function AmexLogo() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#007BC1] to-[#005B9A]">
      <div className="text-center">
        <div className="text-[9px] font-semibold tracking-[0.3em] text-white/70 uppercase">American</div>
        <div className="text-xl font-black tracking-tight text-white leading-none">AMEX</div>
        <div className="mt-0.5 h-0.5 w-8 mx-auto bg-white/40 rounded" />
      </div>
    </div>
  );
}

function HotstarLogo() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E0A50] to-[#5E35B1]">
      <div className="text-center">
        <span className="text-xl font-black text-white tracking-tight">Jio</span>
        <span className="ml-0.5 text-xl font-black text-[#FFD700] tracking-tight">hotstar</span>
      </div>
    </div>
  );
}

function VisaLogo() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white shadow-inner border border-gray-100">
      <svg viewBox="0 0 138 44" className="h-8 w-auto" fill="none">
        <path d="M52.3 0.8L34.3 43.2H22.8L14 9.3C13.5 7.3 13 6.5 11.4 5.6 8.7 4.1 4.4 2.7 0.7 1.9L1 0.8h18.6c2.4 0 4.5 1.6 5 4.2l4.6 24.4L40.6 0.8H52.3zm47.9 28.8c0-11.3-15.6-11.9-15.5-17 0-1.5 1.5-3.2 4.7-3.6 1.6-.2 5.9-.4 10.9 1.9l1.9-9a30 30 0 00-10.3-1.9c-10.9 0-18.6 5.8-18.7 14.1-.1 6.1 5.5 9.5 9.6 11.6 4.3 2 5.7 3.4 5.7 5.2 0 2.8-3.4 4-6.6 4-5.5.1-8.7-1.5-11.3-2.7L69 41.3c2.6 1.2 7.4 2.2 12.4 2.3 11.7 0 19.3-5.7 19.4-14.6l-.6.6zm29 13.6H138L130.3.8h-8.2a5 5 0 00-4.7 3.1L101.7 43.2h11.7l2.3-6.4h14.3l1.2 6.4zm-12.4-15.3l5.9-16.2 3.4 16.2h-9.3zM64.2.8L54.8 43.2H43.7L53 .8h11.2z" fill="#1A1F71"/>
      </svg>
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
    text: "Use your college or work Google account. Your email domain automatically places you in your private community — no invite needed.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-[var(--color-credora-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    title: "List what you're happy to share",
    text: "Add a card with cashback, a Netflix screen, a Spotify Family slot — whatever you'd share with someone you already trust.",
  },
  {
    icon: (
      <svg className="h-7 w-7 text-[var(--color-credora-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: "Request — owner accepts, you connect",
    text: "Send a request with context. If accepted, both sides see each other's contact and can coordinate directly.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

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

      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-6 sm:px-10 lg:pb-16 lg:pt-12">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-credora-slate)]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Free · Open to your community today
            </div>

            <h1 className="mt-5 text-[2.8rem] font-extrabold leading-[1.06] tracking-tight text-[var(--color-credora-ink)] sm:text-5xl lg:text-[3.4rem]">
              Borrow a Netflix.<br />
              Lend your Amex.<br />
              <span className="text-[var(--color-credora-accent)]">With people you trust.</span>
            </h1>

            <p className="mt-5 max-w-md text-lg leading-relaxed text-[var(--color-credora-slate)]">
              Credora is a private community for your college or workplace — share subscriptions, card benefits, and digital perks with the people you already know.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-[var(--color-credora-ink)] px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-[var(--color-credora-ink)]/20 transition hover:opacity-90"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with your work / school email
              </Link>
            </div>
            <p className="mt-3 text-xs text-[var(--color-credora-slate)]">
              No credit card required · Your domain = your community
            </p>
          </div>

          {/* Right: brand logo grid */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            {/* Row 1 */}
            <div className="aspect-square">
              <NetflixLogo />
            </div>
            <div className="aspect-square">
              <PrimeLogo />
            </div>
            <div className="aspect-square">
              <AmexLogo />
            </div>
            {/* Row 2 */}
            <div className="aspect-square">
              <SpotifyLogo />
            </div>
            <div className="aspect-square">
              <HotstarLogo />
            </div>
            <div className="aspect-square">
              <VisaLogo />
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
            Three steps to start sharing
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
