import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import { VerifyCardFaq } from "@/components/auth/verify-card-faq";
import { VerifyCardForm } from "@/components/auth/verify-card-form";

export default async function VerifyCardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/verify-card");

  const { data: profile } = await supabase
    .from("profiles")
    .select("signup_card_bin_verified_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.signup_card_bin_verified_at) redirect("/complete-profile");

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--color-credora-surface)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(37,99,235,0.12),transparent)]"
      />
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[var(--color-credora-ink)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-credora-ink)] text-sm font-bold text-white shadow-md shadow-[var(--color-credora-ink)]/20">
            C
          </span>
          Credora
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <VerifyCardFaq />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-[var(--color-credora-line)] bg-white/90 px-4 py-2 text-sm font-semibold text-[var(--color-credora-ink)] shadow-sm backdrop-blur-sm transition hover:border-[var(--color-credora-accent)] hover:bg-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 pb-20 pt-4 sm:px-8">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-credora-ink)] sm:text-4xl">
            Verify your card
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-[var(--color-credora-slate)] sm:mx-0">
            Enter the first <span className="font-semibold text-[var(--color-credora-ink)]">6–8 digits</span> of any of
            your credit cards to continue.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-[var(--color-credora-line)]/80 bg-white p-6 shadow-[0_24px_48px_-12px_rgba(12,18,34,0.12)] sm:p-8">
          <VerifyCardForm />
        </div>
      </main>
    </div>
  );
}
