import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.22),transparent)]"
      />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[var(--color-credora-ink)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-credora-ink)] text-sm font-bold text-white">
            C
          </span>
          Credora
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full bg-[var(--color-credora-ink)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
          >
            Sign in with Google
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-24 pt-10 md:pt-16">
        <p className="inline-flex rounded-full border border-[var(--color-credora-line)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--color-credora-slate)] shadow-sm backdrop-blur">
          Domain-scoped card marketplace
        </p>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-[var(--color-credora-ink)] md:text-5xl md:leading-[1.08]">
          Share cards within your trusted community. Unlock offers together.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-credora-slate)]">
          Credora creates private pools scoped by your email domain — your college, company, or institution. Sign in
          with Google, list safe card metadata, and coordinate card-linked perks with people you already trust.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-credora-accent)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" fillOpacity=".7" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".5" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" fillOpacity=".5" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".7" />
            </svg>
            Get started with Google
          </Link>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Domain communities",
              body: "Your email domain defines your pool. College students stay with college students; company employees with colleagues.",
            },
            {
              title: "List & search cards",
              body: "Add safe card metadata (brand, issuer, last four). Search within your community for the right card when an offer needs it.",
            },
            {
              title: "Request & respond",
              body: "Send share requests with amount, platform, and purpose. Card owners accept or decline — emails exchange on acceptance.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--color-credora-line)] bg-[var(--color-credora-card)] p-6 shadow-sm"
            >
              <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-credora-slate)]">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 max-w-2xl rounded-2xl border border-amber-200/80 bg-amber-50/90 p-5 text-sm leading-relaxed text-amber-950/90">
          <strong className="font-semibold">Important:</strong> Only add metadata you are comfortable sharing. Never
          submit a full card number, CVV, or PIN. Real-world card sharing may violate issuer terms and local law — use
          Credora as a coordination tool and follow regulations that apply to you.
        </p>
      </main>
    </div>
  );
}
