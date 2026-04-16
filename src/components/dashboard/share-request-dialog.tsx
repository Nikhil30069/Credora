"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createShareRequest } from "@/actions/share-requests";
import { Button } from "@/components/ui/button";

type Props = {
  cardId: string;
  label: string;
  /** Defaults to primary (blue). Use secondary on dark surfaces (e.g. popular cards). */
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerClassName?: string;
};

const POPULAR_PLATFORMS = [
  "Amazon", "Flipkart", "Myntra", "Swiggy", "Zomato",
  "MakeMyTrip", "Booking.com", "Uber", "Ola", "BigBasket",
  "PhonePe", "Paytm", "Other",
];

export function ShareRequestDialog({
  cardId,
  label,
  triggerVariant = "primary",
  triggerClassName = "",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [platform, setPlatform] = useState("");
  const [customPlatform, setCustomPlatform] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, start] = useTransition();

  function close() {
    setOpen(false);
    setError(null);
    setSuccess(false);
    setAmount("");
    setPurpose("");
    setPlatform("");
    setCustomPlatform("");
    setMessage("");
  }

  function submit() {
    setError(null);
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (!purpose.trim()) {
      setError("Please describe the purpose of use.");
      return;
    }
    const finalPlatform = platform === "Other" ? customPlatform.trim() : platform;
    if (!finalPlatform) {
      setError("Select or enter a platform.");
      return;
    }

    start(async () => {
      const r = await createShareRequest({
        cardId,
        amount: parsedAmount,
        purpose: purpose.trim(),
        platform: finalPlatform,
        message: message || null,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        close();
        router.refresh();
      }, 1200);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        className={`!py-1.5 !px-4 !text-xs group ${triggerClassName}`}
        onClick={() => setOpen(true)}
      >
        <svg className="mr-1 h-3.5 w-3.5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Request share
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal
            className="relative z-10 w-full max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-300 rounded-2xl border border-[var(--color-credora-line)] bg-white shadow-2xl"
          >
            {success ? (
              <div className="flex flex-col items-center gap-4 p-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-[var(--color-credora-ink)]">Request sent!</p>
                <p className="text-sm text-[var(--color-credora-slate)]">The owner will review your request.</p>
              </div>
            ) : (
              <>
                <div className="border-b border-[var(--color-credora-line)] px-6 py-5">
                  <h3 className="text-lg font-semibold text-[var(--color-credora-ink)]">Request share</h3>
                  <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
                    For <span className="font-medium text-[var(--color-credora-ink)]">{label}</span>
                  </p>
                </div>

                <div className="space-y-4 px-6 py-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-[var(--color-credora-ink)]">
                        Amount (&#8377;) <span className="text-red-500">*</span>
                      </span>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-sm text-[var(--color-credora-slate)]">&#8377;</span>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="5,000"
                          className="w-full rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] py-2.5 pl-8 pr-3 text-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                        />
                      </div>
                    </label>

                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-[var(--color-credora-ink)]">
                        Platform <span className="text-red-500">*</span>
                      </span>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                      >
                        <option value="">Select platform…</option>
                        {POPULAR_PLATFORMS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {platform === "Other" ? (
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-[var(--color-credora-ink)]">Platform name <span className="text-red-500">*</span></span>
                      <input
                        type="text"
                        value={customPlatform}
                        onChange={(e) => setCustomPlatform(e.target.value)}
                        placeholder="e.g. Dominos, Apple Store"
                        className="w-full rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                      />
                    </label>
                  ) : null}

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[var(--color-credora-ink)]">
                      Purpose of use <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. Flight booking, Grocery shopping, Electronics purchase"
                      className="w-full rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[var(--color-credora-ink)]">Additional note <span className="text-xs font-normal text-[var(--color-credora-slate)]">(optional)</span></span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                      placeholder="Anything else you want the owner to know?"
                    />
                  </label>

                  {error ? (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between border-t border-[var(--color-credora-line)] px-6 py-4">
                  <p className="text-xs text-[var(--color-credora-slate)]">
                    Your email will be shared on acceptance.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={close} disabled={pending}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={submit} disabled={pending}>
                      {pending ? "Sending…" : "Send request"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
