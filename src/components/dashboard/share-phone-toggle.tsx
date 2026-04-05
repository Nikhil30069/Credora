"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setShareRequestPhoneVisible } from "@/actions/share-request-phone";

type Props = {
  requestId: string;
  visible: boolean;
};

export function SharePhoneToggle({ requestId, visible }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setError(null);
    startTransition(async () => {
      const r = await setShareRequestPhoneVisible(requestId, next);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)]/80 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-credora-slate)]">Your phone</p>
          <p className="text-xs text-[var(--color-credora-ink)]">
            {visible ? "Visible to the other party on this request." : "Hidden — they only see it if you share."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => toggle(!visible)}
            className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-credora-accent)] ${
              visible ? "bg-emerald-600" : "bg-zinc-300"
            } ${pending ? "opacity-60" : ""}`}
            aria-pressed={visible}
            aria-label={visible ? "Hide your phone from this contact" : "Share your phone with this contact"}
          >
            <span
              className={`pointer-events-none absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                visible ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-[var(--color-credora-ink)]">{visible ? "On" : "Off"}</span>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
