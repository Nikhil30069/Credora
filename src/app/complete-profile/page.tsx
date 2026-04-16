import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";
import { profileNeedsBasics } from "@/lib/profile-basics";

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/complete-profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileNeedsBasics(profile)) {
    redirect("/dashboard");
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fromGoogle =
    typeof meta?.full_name === "string"
      ? meta.full_name
      : typeof meta?.name === "string"
        ? meta.name
        : "";

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
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-credora-ink)]">Complete your profile</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-credora-slate)]">
          Your name appears on card listings in search. Your phone stays private until you opt in on an accepted share
          request.
        </p>
        <div className="mt-8 rounded-2xl border border-[var(--color-credora-line)] bg-white p-6 shadow-sm">
          <CompleteProfileForm defaultFullName={fromGoogle} />
        </div>
      </main>
    </div>
  );
}
