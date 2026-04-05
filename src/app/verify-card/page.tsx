import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
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
    <div className="flex min-h-dvh flex-col bg-[var(--color-credora-surface)]">
      <header className="flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-credora-ink)] text-sm font-bold text-white">
            C
          </span>
          Credora
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full border border-[var(--color-credora-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-credora-ink)] shadow-sm transition hover:border-[var(--color-credora-accent)]"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-credora-ink)]">Verify your credit card</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-credora-slate)]">
          We use the public{" "}
          <a
            href="https://binlist.net/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[var(--color-credora-accent)] underline-offset-2 hover:underline"
          >
            BINlist
          </a>{" "}
          directory to confirm your digits belong to a known{" "}
          <span className="font-semibold text-[var(--color-credora-ink)]">credit</span> card range (not debit). This does not prove you
          hold the card or run a charge — it is a signup gate only. We do not store your
          BIN after this step.
        </p>
        <div className="mt-8 rounded-2xl border border-[var(--color-credora-line)] bg-white p-6 shadow-sm">
          <VerifyCardForm />
        </div>
      </main>
    </div>
  );
}
