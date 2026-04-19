"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { createShareRequest } from "@/actions/share-requests";
import { Button } from "@/components/ui/button";
import type { AssetType } from "@/types/database";

type Props = {
  cardId: string;
  label: string;
  assetType?: AssetType | string;
  /** Defaults to primary (blue). Use secondary on dark surfaces (e.g. popular cards). */
  triggerVariant?: "primary" | "secondary" | "ghost" | "danger";
  triggerClassName?: string;
};

const STREAMING_TYPES = new Set(["netflix", "prime", "spotify", "jiohotstar"]);

const DURATION_OPTIONS = [
  "1 day",
  "3 days",
  "1 week",
  "2 weeks",
  "1 month",
  "3 months",
];

const POPULAR_PLATFORMS = [
  "Amazon", "Flipkart", "Myntra", "Swiggy", "Zomato",
  "MakeMyTrip", "Booking.com", "Uber", "Ola", "BigBasket",
  "PhonePe", "Paytm", "Other",
];

export function ShareRequestDialog({
  cardId,
  label,
  assetType = "other",
  triggerVariant = "primary",
  triggerClassName = "",
}: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Card fields
  const [amount, setAmount] = useState("");
  const [platform, setPlatform] = useState("");
  const [customPlatform, setCustomPlatform] = useState("");
  const [purpose, setPurpose] = useState("");

  // Streaming fields
  const [duration, setDuration] = useState("");
  const [useFor, setUseFor] = useState("");

  // Shared
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, start] = useTransition();

  useLayoutEffect(() => { setMounted(true); }, []);

  const isStreaming = STREAMING_TYPES.has(String(assetType).toLowerCase());
  const isCard = assetType === "credit_card";

  function close() {
    setOpen(false);
    setError(null);
    setSuccess(false);
    setAmount(""); setPlatform(""); setCustomPlatform(""); setPurpose("");
    setDuration(""); setUseFor("");
    setMessage("");
  }

  function submit() {
    setError(null);

    start(async () => {
      let result;

      if (isCard) {
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) { setError("Enter a valid amount greater than 0."); return; }
        const finalPlatform = platform === "Other" ? customPlatform.trim() : platform;
        if (!finalPlatform) { setError("Select or enter a platform."); return; }
        if (!purpose.trim()) { setError("Please describe the purpose of use."); return; }

        result = await createShareRequest({
          kind: "card",
          cardId,
          amount: parsedAmount,
          platform: finalPlatform,
          purpose: purpose.trim(),
          message: message || null,
        });

      } else if (isStreaming) {
        if (!duration) { setError("Please select how long you need access."); return; }

        result = await createShareRequest({
          kind: "streaming",
          cardId,
          duration,
          useFor: useFor.trim() || null,
          message: message || null,
        });

      } else {
        if (!purpose.trim()) { setError("Please describe the purpose."); return; }

        result = await createShareRequest({
          kind: "other",
          cardId,
          purpose: purpose.trim(),
          message: message || null,
        });
      }

      if (!result.ok) { setError(result.error); return; }
      setSuccess(true);
      setTimeout(() => { close(); router.refresh(); }, 1200);
    });
  }

  const streamingLabel = (() => {
    const t = String(assetType).toLowerCase();
    if (t === "netflix") return "Netflix";
    if (t === "prime") return "Prime Video";
    if (t === "spotify") return "Spotify";
    if (t === "jiohotstar") return "JioHotstar";
    return "subscription";
  })();

  const overlay =
    open && mounted ? (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
              {/* Header */}
              <div className="border-b border-[var(--color-credora-line)] px-6 py-5">
                <h3 className="text-lg font-semibold text-[var(--color-credora-ink)]">Request share</h3>
                <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
                  For <span className="font-medium text-[var(--color-credora-ink)]">{label}</span>
                </p>
              </div>

              {/* Body */}
              <div className="space-y-4 px-6 py-5">

                {/* ── CREDIT CARD ── */}
                {isCard && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block space-y-1.5">
                        <span className="text-sm font-medium text-[var(--color-credora-ink)]">
                          Amount (₹) <span className="text-red-500">*</span>
                        </span>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-sm text-[var(--color-credora-slate)]">₹</span>
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
                          Merchant / Platform <span className="text-red-500">*</span>
                        </span>
                        <select
                          value={platform}
                          onChange={(e) => setPlatform(e.target.value)}
                          className="w-full rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                        >
                          <option value="">Select…</option>
                          {POPULAR_PLATFORMS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {platform === "Other" && (
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
                    )}

                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-[var(--color-credora-ink)]">
                        Purpose of use <span className="text-red-500">*</span>
                      </span>
                      <input
                        type="text"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="e.g. Buying electronics, Grocery shopping"
                        className="w-full rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                      />
                    </label>
                  </>
                )}

                {/* ── STREAMING / SUBSCRIPTION ── */}
                {isStreaming && (
                  <>
                    <div className="rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] p-3.5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-credora-slate)]">
                        How long do you need access?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {DURATION_OPTIONS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDuration(d)}
                            className={[
                              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                              duration === d
                                ? "border-[var(--color-credora-accent)] bg-[var(--color-credora-accent)] text-white"
                                : "border-[var(--color-credora-line)] bg-white text-[var(--color-credora-ink)] hover:border-[var(--color-credora-accent)]/60",
                            ].join(" ")}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-[var(--color-credora-ink)]">
                        What will you use it for?{" "}
                        <span className="text-xs font-normal text-[var(--color-credora-slate)]">(optional)</span>
                      </span>
                      <input
                        type="text"
                        value={useFor}
                        onChange={(e) => setUseFor(e.target.value)}
                        placeholder={`e.g. Watching a series on ${streamingLabel}, Music for gym`}
                        className="w-full rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                      />
                    </label>
                  </>
                )}

                {/* ── OTHER ── */}
                {!isCard && !isStreaming && (
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-[var(--color-credora-ink)]">
                      Purpose <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Describe how you'll use this"
                      className="w-full rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                    />
                  </label>
                )}

                {/* Additional note — always shown */}
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-[var(--color-credora-ink)]">
                    Additional note{" "}
                    <span className="text-xs font-normal text-[var(--color-credora-slate)]">(optional)</span>
                  </span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
                    placeholder="Anything else you want the owner to know?"
                  />
                </label>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[var(--color-credora-line)] px-6 py-4">
                <p className="text-xs text-[var(--color-credora-slate)]">Your email will be shared on acceptance.</p>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={close} disabled={pending}>Cancel</Button>
                  <Button type="button" onClick={submit} disabled={pending}>
                    {pending ? "Sending…" : "Send request"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    ) : null;

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
      {overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
