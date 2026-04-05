import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function SignupPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-credora-ink)]">Join Credora</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-credora-slate)]">
          Sign in with your organization&apos;s Google account. You need a credit card to be verified after signing in
          for the first time. Your email domain defines your trusted community pool.
        </p>
        <div className="mt-8 rounded-2xl border border-[var(--color-credora-line)] bg-white p-6 shadow-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
