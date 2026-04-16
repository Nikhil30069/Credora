import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const PERKS = [
  { icon: "💳", name: "Credit Cards", desc: "Cashback, rewards, lounge access" },
  { icon: "🎬", name: "Netflix", desc: "Screen-share with people you trust" },
  { icon: "🎵", name: "Spotify", desc: "Family & duo plan slots" },
  { icon: "📦", name: "Amazon Prime", desc: "Delivery, video, music" },
  { icon: "🏏", name: "JioHotstar", desc: "Live sports & entertainment" },
  { icon: "📱", name: "& more", desc: "YouTube, Notion, Figma…" },
];

const STEPS = [
  {
    num: "01",
    title: "Sign in with Google",
    text: "Your email domain defines your community. College, company, or org — you only see people you already belong with.",
  },
  {
    num: "02",
    title: "List what you have",
    text: "Add credit cards, streaming subscriptions, or any digital perk you'd share with someone you trust.",
  },
  {
    num: "03",
    title: "Search & request",
    text: "Find what you need, send a request with context, and coordinate directly once accepted.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.18),transparent)]"
      />

      {/* Header */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[var(--color-credora-ink)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-credora-ink)] text-sm font-bold text-white shadow-md shadow-[var(--color-credora-ink)]/20">
            C
          </span>
          Credora
        </Link>
        <Link
          href="/login"
          className="rounded-full bg-[var(--color-credora-ink)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="relative mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-14">
        <div className="flex flex-wrap items-center gap-2">
          {["💳", "🎬", "🎵", "📦", "🏏"].map((e) => (
            <span key={e} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-base shadow-sm ring-1 ring-[var(--color-credora-line)]">
              {e}
            </span>
          ))}
          <span className="rounded-full border border-[var(--color-credora-line)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--color-credora-slate)] shadow-sm">
            Cards · Subscriptions · Digital perks
          </span>
        </div>

        <h1 className="mt-8 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--color-credora-ink)] sm:text-5xl md:text-6xl">
          Share digital perks with people you{" "}
          <span className="bg-gradient-to-r from-[var(--color-credora-accent)] to-blue-500 bg-clip-text text-transparent">
            actually trust
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-credora-slate)]">
          Credora builds private communities around your email domain — your college, company, or org.
          List credit cards, Netflix, Spotify, Prime, or any subscription and coordinate sharing with people
          who are already part of your world.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--color-credora-accent)] px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-600"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" fillOpacity=".7" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".5" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" fillOpacity=".5" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".7" />
            </svg>
            Get started with Google
          </Link>
          <span className="text-sm text-[var(--color-credora-slate)]">Free · No credit card required</span>
        </div>

        {/* Asset pills */}
        <div className="mt-20">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-[var(--color-credora-slate)]">
            What people share on Credora
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {PERKS.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-[var(--color-credora-line)] bg-white p-5 text-center shadow-sm transition hover:border-[var(--color-credora-accent)]/30 hover:shadow-md"
              >
                <span className="text-3xl">{p.icon}</span>
                <p className="mt-2 text-sm font-semibold text-[var(--color-credora-ink)]">{p.name}</p>
                <p className="mt-1 text-xs text-[var(--color-credora-slate)]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-[var(--color-credora-slate)]">
            How it works
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.num} className="rounded-2xl border border-[var(--color-credora-line)] bg-white p-6 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-credora-accent-soft)] text-sm font-bold text-[var(--color-credora-accent)]">
                  {s.num}
                </span>
                <h3 className="mt-4 text-base font-semibold text-[var(--color-credora-ink)]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-credora-slate)]">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust note */}
        <div className="mx-auto mt-20 max-w-2xl rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 text-center">
          <p className="text-sm leading-relaxed text-amber-950/90">
            <strong className="font-semibold">Built on trust, not surveillance.</strong> Credora never stores full card
            numbers, passwords, or login credentials. You decide what to share, who to share with, and can revoke any
            time. Always respect issuer terms and local regulations.
          </p>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-credora-ink)] px-8 py-3.5 text-[15px] font-semibold text-white shadow-md transition hover:opacity-90"
          >
            Join your community
          </Link>
          <p className="mt-3 text-sm text-[var(--color-credora-slate)]">
            Sign in with your work or college Google account to get started.
          </p>
        </div>
      </main>
    </div>
  );
}
