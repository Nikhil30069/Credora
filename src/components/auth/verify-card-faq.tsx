"use client";

import { useEffect, useRef } from "react";

const ITEMS = [
  {
    q: "I don’t have a credit card",
    a: "Right now Credora is limited to members who can verify with a valid credit card. We plan to open up to more people over time—thanks for your patience.",
  },
  {
    q: "Why do you ask for card digits?",
    a: "We only use the first 6–8 digits to confirm your number belongs to a real credit card range. We don’t store your digits, and we never ask for your full card number or CVV.",
  },
] as const;

export function VerifyCardFaq() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => {
      document.body.style.overflow = "";
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  function open() {
    document.body.style.overflow = "hidden";
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-full border border-[var(--color-credora-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-credora-ink)] shadow-sm transition hover:border-[var(--color-credora-accent)] hover:text-[var(--color-credora-accent)]"
      >
        FAQ
      </button>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),26rem)] max-h-[min(85vh,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-credora-line)] bg-white p-0 text-[var(--color-credora-ink)] shadow-2xl [&::backdrop]:bg-[var(--color-credora-ink)]/40"
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-credora-line)] px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">Common questions</h2>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-credora-slate)] transition hover:bg-[var(--color-credora-surface)] hover:text-[var(--color-credora-ink)]"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-5 overflow-y-auto px-5 py-5">
          {ITEMS.map((item) => (
            <div key={item.q}>
              <h3 className="text-sm font-semibold text-[var(--color-credora-ink)]">{item.q}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-credora-slate)]">{item.a}</p>
            </div>
          ))}
        </div>
      </dialog>
    </>
  );
}
