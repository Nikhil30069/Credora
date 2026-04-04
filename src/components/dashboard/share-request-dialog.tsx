"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createShareRequest } from "@/actions/share-requests";
import { Button } from "@/components/ui/button";

type Props = {
  cardId: string;
  label: string;
};

export function ShareRequestDialog({ cardId, label }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
    setMessage("");
  }

  function submit() {
    setError(null);
    start(async () => {
      const r = await createShareRequest(cardId, message || null);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="primary" className="!py-1.5 !text-xs" onClick={() => setOpen(true)}>
        Request share
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal
            className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--color-credora-line)] bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-[var(--color-credora-ink)]">Request share</h3>
            <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
              You are requesting coordination for <span className="font-medium text-[var(--color-credora-ink)]">{label}</span>.
              The owner will see your email and message.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-[var(--color-credora-ink)]">Message (optional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[var(--color-credora-line)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-credora-accent)] focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                  placeholder="What offer or spend are you planning?"
                />
              </label>
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close} disabled={pending}>
                Cancel
              </Button>
              <Button type="button" onClick={submit} disabled={pending}>
                {pending ? "Sending…" : "Send request"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
