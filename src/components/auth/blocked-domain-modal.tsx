"use client";

import { useEffect } from "react";

type Props = {
  onDismiss: () => void;
};

export function BlockedDomainModal({ onDismiss }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blocked-domain-title"
      aria-describedby="blocked-domain-desc"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-credora-ink)]/45 backdrop-blur-[3px] animate-fade-in"
        onClick={onDismiss}
        aria-label="Close dialog"
      />
      <div className="relative z-10 w-full max-w-md animate-slide-up rounded-2xl border border-[var(--color-credora-line)] bg-white px-6 pb-6 pt-7 shadow-2xl ring-1 ring-black/5">
        <div className="flex justify-center gap-6 text-5xl leading-none sm:text-6xl sm:gap-8">
          <span
            className="inline-block animate-float-slow motion-reduce:animate-none"
            aria-hidden
          >
            😢
          </span>
          <span
            className="inline-block animate-float-slow motion-reduce:animate-none [animation-delay:0.45s]"
            aria-hidden
          >
            🔜
          </span>
        </div>

        <h2
          id="blocked-domain-title"
          className="mt-5 text-center text-lg font-semibold tracking-tight text-[var(--color-credora-ink)] sm:text-xl"
        >
          Not your fault — we’re not there yet
        </h2>
        <p
          id="blocked-domain-desc"
          className="mt-3 text-center text-sm leading-relaxed text-[var(--color-credora-slate)]"
        >
          Right now Credora only supports sign-in with a <strong className="font-semibold text-[var(--color-credora-ink)]">work, school, or organization</strong> email (a domain your company or college owns).{" "}
          <strong className="font-semibold text-[var(--color-credora-ink)]">Personal Gmail and similar sign-up is coming soon.</strong>
        </p>

        <p className="mt-4 rounded-xl bg-[var(--color-credora-accent-soft)] px-3 py-2.5 text-center text-xs font-medium text-[var(--color-credora-ink)]">
          Coming soon: sign in with any email
        </p>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 w-full rounded-xl bg-[var(--color-credora-ink)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
