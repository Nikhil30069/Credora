"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(new FormData(form).get("password") ?? "");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);

    if (signErr) {
      setError(signErr.message);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <Input name="email" type="email" autoComplete="email" required label="Email" placeholder="you@company.com" />
      <Input
        name="password"
        type="password"
        autoComplete="current-password"
        required
        label="Password"
        placeholder="••••••••"
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-[var(--color-credora-slate)]">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-[var(--color-credora-accent)] hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
