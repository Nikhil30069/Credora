"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveProfileBasics } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  defaultFullName: string;
};

export function CompleteProfileForm({ defaultFullName }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fullName = String(new FormData(form).get("full_name") ?? "");
    const phone = String(new FormData(form).get("phone") ?? "");

    setPending(true);
    const r = await saveProfileBasics(fullName, phone);
    setPending(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    router.refresh();
    router.push("/dashboard?tab=search");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <Input
        name="full_name"
        autoComplete="name"
        required
        label="Full name"
        hint="Shown to others in your community when they find your listed cards."
        placeholder="e.g. Nikhil Kumar Gupta"
        defaultValue={defaultFullName}
        minLength={2}
      />
      <Input
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        label="Phone number"
        hint="Include country code if outside India. You choose when to share this after a request is accepted."
        placeholder="e.g. +91 98765 43210"
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Continue to Credora"}
      </Button>
    </form>
  );
}
