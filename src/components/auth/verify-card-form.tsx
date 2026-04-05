"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { lookupCardBin } from "@/lib/bin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerifyCardForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const binRaw = String(new FormData(form).get("card_bin") ?? "").replace(/\D/g, "");

    if (binRaw.length < 6 || binRaw.length > 8) {
      setError("Enter the first 6–8 digits on your credit card.");
      return;
    }

    setPending(true);
    try {
      await lookupCardBin(binRaw);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Session expired. Sign in again.");
        setPending(false);
        return;
      }

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ signup_card_bin_verified_at: new Date().toISOString() })
        .eq("id", user.id);

      if (updErr) {
        setError(updErr.message);
        setPending(false);
        return;
      }

      router.refresh();
      router.push("/complete-profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <Input
        name="card_bin"
        inputMode="numeric"
        autoComplete="off"
        required
        label="First 6–8 digits of your credit card"
        hint="The BIN (first digits on the front). Never enter your full card number or CVV here."
        placeholder="e.g. 457173"
        maxLength={8}
        pattern="[0-9]{6,8}"
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Verifying…" : "Verify and continue"}
      </Button>
      <p className="text-center text-sm text-[var(--color-credora-slate)]">
        <Link href="/" className="font-semibold text-[var(--color-credora-accent)] hover:underline">
          Back to home
        </Link>
      </p>
    </form>
  );
}
