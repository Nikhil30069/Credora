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
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--color-credora-slate)] transition hover:text-[var(--color-credora-ink)]"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[var(--color-credora-ink)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pb-24 pt-10 md:pt-16">
        <p className="inline-flex rounded-full border border-[var(--color-credora-line)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--color-credora-slate)] shadow-sm backdrop-blur">
          Marketplace for card-linked perks
        </p>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-[var(--color-credora-ink)] md:text-5xl md:leading-[1.08]">
          Share cards thoughtfully. Unlock offers. Earn rewards together.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-credora-slate)]">
          Credora helps people who hold cards list safe, non-sensitive details so others can find the right network
          or issuer for a purchase—then request a share in one place.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-credora-accent)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-600"
          >
            Create your account
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-credora-line)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-credora-ink)] shadow-sm transition hover:border-[var(--color-credora-accent)]"
          >
            I already have an account
          </Link>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "List your cards",
              body: "Add network, issuer, and last four digits—never your full number or CVV.",
            },
            {
              title: "Search the pool",
              body: "Find Visa, Amex, or your bank’s card when a merchant offer needs a specific product.",
            },
            {
              title: "Request & respond",
              body: "Raise a share request; card owners see it in one inbox and can accept or decline.",
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
          submit a full card number, CVV, or PIN. Real-world card sharing may violate issuer terms and local law—use
          Credora as a coordination tool and follow regulations that apply to you.
        </p>
      </main>
    </div>
  );
}
