"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addCard } from "@/actions/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";

const brands = ["Visa", "Mastercard", "American Express", "Discover", "RuPay", "Diners", "Other"] as const;

export function AddCardForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(addCard, null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state && !state.ok ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="brand" label="Network" required defaultValue="Visa">
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </SelectField>
        <Input
          name="last_four"
          label="Last four digits"
          inputMode="numeric"
          maxLength={4}
          pattern="[0-9]{4}"
          required
          placeholder="4242"
          autoComplete="off"
        />
      </div>
      <Input name="nickname" label="Display name" required placeholder="Travel Visa · Personal" />
      <Input name="issuer" label="Issuer (optional)" placeholder="e.g. Chase, HDFC, Amex UK" />

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add card"}
      </Button>
    </form>
  );
}
