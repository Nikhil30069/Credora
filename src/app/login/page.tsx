import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const sessionHint = sp.reason === "session";

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-credora-surface)]">
      <header className="flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-credora-ink)] text-sm font-bold text-white">
            C
          </span>
          Credora
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-credora-ink)]">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--color-credora-slate)]">Sign in with the email you used to register.</p>
        {sessionHint ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Your session was not loaded. Sign in again, or confirm email is disabled in Supabase if you just registered.
          </p>
        ) : null}
        <div className="mt-8 rounded-2xl border border-[var(--color-credora-line)] bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
