"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addAsset } from "@/actions/cards";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { ASSET_META, type AssetType } from "@/types/database";

const CARD_BRANDS = ["Visa", "Mastercard", "American Express", "Discover", "RuPay", "Diners", "Other"] as const;

const PLAN_TIERS: Partial<Record<AssetType, string[]>> = {
  netflix: ["Mobile", "Basic", "Standard", "Premium"],
  prime: ["Monthly", "Annual", "Prime Lite"],
  spotify: ["Individual", "Duo", "Family", "Student"],
  jiohotstar: ["Mobile", "Super", "Premium"],
};

const ASSET_TYPES: AssetType[] = ["credit_card", "netflix", "prime", "spotify", "jiohotstar", "other"];

export function AddAssetForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [assetType, setAssetType] = useState<AssetType>("credit_card");
  const [state, formAction, pending] = useActionState(addAsset, null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setAssetType("credit_card");
      router.refresh();
    }
  }, [state, router]);

  const tiers = PLAN_TIERS[assetType];
  const isCard = assetType === "credit_card";
  const isSub = !isCard;

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {state && !state.ok ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
      ) : null}

      {/* Asset type selector */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--color-credora-ink)]">What are you listing?</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ASSET_TYPES.map((t) => {
            const m = ASSET_META[t];
            const active = assetType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setAssetType(t)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition ${
                  active
                    ? "border-[var(--color-credora-accent)] bg-[var(--color-credora-accent-soft)] ring-2 ring-[var(--color-credora-accent-soft)]"
                    : "border-[var(--color-credora-line)] bg-white hover:border-[var(--color-credora-accent)]/40"
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <span className="text-[11px] font-medium leading-tight text-[var(--color-credora-ink)]">{m.label}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="asset_type" value={assetType} />
      </div>

      {/* Credit card fields */}
      {isCard ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField name="brand" label="Network" required defaultValue="Visa">
              {CARD_BRANDS.map((b) => (
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
        </>
      ) : null}

      {/* Subscription fields */}
      {isSub ? (
        <>
          {assetType === "other" ? (
            <Input name="brand" label="Subscription name" required placeholder="e.g. YouTube Premium, Hotstar" />
          ) : null}
          <Input
            name="nickname"
            label="Display name"
            required
            placeholder={`e.g. ${ASSET_META[assetType].label} Family · Shared`}
          />
          {tiers ? (
            <SelectField name="plan_tier" label="Plan" required>
              <option value="">Select plan…</option>
              {tiers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectField>
          ) : (
            <Input name="plan_tier" label="Plan (optional)" placeholder="e.g. Premium, Family" />
          )}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
            <label className="flex items-start gap-3">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-emerald-300 accent-emerald-600" />
              <span className="text-sm text-emerald-900">
                I confirm I have an active <strong>{ASSET_META[assetType].label}</strong> subscription and am willing to
                share it with my community.
              </span>
            </label>
          </div>
        </>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Spinner className="size-3.5 border-white border-t-transparent" />
            Saving…
          </>
        ) : (
          `List ${ASSET_META[assetType].label}`
        )}
      </Button>
    </form>
  );
}
