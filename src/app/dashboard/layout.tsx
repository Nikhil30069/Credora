import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import { LoginNotificationsModal } from "@/components/dashboard/login-notifications-modal";
import { domainDisplayName } from "@/lib/blocked-domains";
import { profileNeedsBasics } from "@/lib/profile-basics";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";

  let userDomain = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("domain, full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    if (profileNeedsBasics(profile)) {
      redirect("/complete-profile");
    }
    userDomain = profile?.domain ?? "";
  }

  return (
    <div className="min-h-dvh bg-[var(--color-credora-surface)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-credora-line)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[var(--color-credora-ink)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-credora-ink)] text-sm font-bold text-white">
              C
            </span>
            Credora
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            {userDomain ? (
              <span className="hidden rounded-full bg-[var(--color-credora-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-credora-accent)] sm:inline-flex">
                {domainDisplayName(userDomain)}
              </span>
            ) : null}
            <span className="max-w-[200px] truncate text-sm text-[var(--color-credora-slate)] sm:max-w-xs" title={email}>
              {email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-[var(--color-credora-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-credora-ink)] shadow-sm transition hover:border-[var(--color-credora-accent)]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <LoginNotificationsModal />
      {children}
    </div>
  );
}
