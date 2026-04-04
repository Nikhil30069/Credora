"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
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
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { data, error: signErr } = await supabase.auth.signUp({ email, password });
    setPending(false);

    if (signErr) {
      setError(signErr.message);
      return;
    }

    if (!data.session) {
      setError(
        "No session was returned. In Supabase go to Authentication → Providers → Email and turn off “Confirm email”, then try again—or confirm your inbox if verification is on.",
      );
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
        autoComplete="new-password"
        required
        label="Password"
        hint="At least 8 characters. Turn off email confirmation in Supabase for instant access."
        placeholder="••••••••"
        minLength={8}
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-[var(--color-credora-slate)]">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-[var(--color-credora-accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
