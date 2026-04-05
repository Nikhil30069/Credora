"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LOGIN_PULSE_STORAGE_KEY } from "@/lib/login-pulse";
import { SESSION_NOTIFICATION_WINDOW_HOURS } from "@/lib/session-notifications-config";
import type { SessionNotificationAccepted, SessionNotificationIncoming } from "@/types/session-notifications";
const DISMISSED_ACCEPT_KEY = "credora_dismissed_accept_toasts_v1";

function readDismissedAcceptIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_ACCEPT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function rememberDismissedAcceptIds(ids: string[]) {
  if (ids.length === 0) return;
  const s = readDismissedAcceptIds();
  ids.forEach((id) => s.add(id));
  localStorage.setItem(DISMISSED_ACCEPT_KEY, JSON.stringify([...s]));
}

function formatCardLabel(card: SessionNotificationIncoming["card"]) {
  if (!card) return "a listed card";
  return `${card.nickname} (${card.brand} · •••• ${card.last_four})`;
}

export function LoginNotificationsModal() {
  const [open, setOpen] = useState(false);
  const [incoming, setIncoming] = useState<SessionNotificationIncoming[]>([]);
  const [accepted, setAccepted] = useState<SessionNotificationAccepted[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pulse = sessionStorage.getItem(LOGIN_PULSE_STORAGE_KEY);
    if (!pulse) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session-notifications", { credentials: "same-origin" });
        const data = (await res.json()) as
          | { ok: true; incomingPending: SessionNotificationIncoming[]; acceptedOutgoing: SessionNotificationAccepted[] }
          | { ok: false };

        if (cancelled) return;
        sessionStorage.removeItem(LOGIN_PULSE_STORAGE_KEY);

        if (!data || !("ok" in data) || !data.ok) return;

        const dismissed = readDismissedAcceptIds();
        const filteredAccepted = data.acceptedOutgoing.filter((r) => !dismissed.has(r.id));
        const hasIncoming = data.incomingPending.length > 0;
        const hasAccepted = filteredAccepted.length > 0;
        if (!hasIncoming && !hasAccepted) return;

        setIncoming(data.incomingPending);
        setAccepted(filteredAccepted);
        setOpen(true);
      } catch {
        if (!cancelled) sessionStorage.removeItem(LOGIN_PULSE_STORAGE_KEY);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss() {
    rememberDismissedAcceptIds(accepted.map((a) => a.id));
    setOpen(false);
  }

  if (!open) return null;

  const inc = incoming.length;
  const acc = accepted.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[var(--color-credora-ink)]/45 backdrop-blur-sm"
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="login-notify-title"
        className="relative z-10 w-full max-w-lg animate-slide-up rounded-2xl border border-[var(--color-credora-line)] bg-white shadow-2xl shadow-black/15"
      >
        <div className="border-b border-[var(--color-credora-line)] bg-gradient-to-br from-blue-50/90 via-white to-emerald-50/50 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[var(--color-credora-line)]">
              <span className="text-lg" aria-hidden>
                ✨
              </span>
            </span>
            <div>
              <h2 id="login-notify-title" className="text-lg font-semibold text-[var(--color-credora-ink)]">
                You have updates
              </h2>
              <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
                Only showing events from the last {SESSION_NOTIFICATION_WINDOW_HOURS} hours (new requests on your
                cards, or someone accepting a request you sent).
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {inc > 0 ? (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 transition hover:border-amber-300">
              <div className="flex items-center gap-2 text-amber-950">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/60 text-sm font-bold">
                  {inc}
                </span>
                <p className="text-sm font-semibold">
                  {inc === 1 ? "New card share request" : `${inc} new card share requests`}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-amber-950/85">
                {inc === 1
                  ? "Someone wants to coordinate using a card you listed. Review the amount, platform, and purpose, then accept or decline."
                  : "People are waiting on you to review their requests on your cards."}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-amber-950/90">
                {incoming.slice(0, 4).map((r) => (
                  <li key={r.id} className="flex gap-2 rounded-lg bg-white/60 px-2.5 py-1.5 ring-1 ring-amber-100">
                    <span className="text-amber-600" aria-hidden>
                      →
                    </span>
                    <span className="font-medium">{formatCardLabel(r.card)}</span>
                  </li>
                ))}
              </ul>
              {inc > 4 ? (
                <p className="mt-2 text-xs text-amber-900/70">+{inc - 4} more in your inbox</p>
              ) : null}
            </div>
          ) : null}

          {acc > 0 ? (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4 transition hover:border-emerald-300">
              <div className="flex items-center gap-2 text-emerald-950">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-200/60">
                  <svg className="h-4 w-4 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                <p className="text-sm font-semibold">
                  {acc === 1 ? "Share request accepted" : `${acc} share requests accepted`}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-emerald-950/85">
                {acc === 1
                  ? `Good news — the owner accepted your request for ${formatCardLabel(accepted[0]?.card ?? null)}. Open Requests to see their email and connect.`
                  : "Owners accepted your requests. Head to Requests to see contact details for each card."}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-emerald-950/90">
                {accepted.slice(0, 4).map((r) => (
                  <li key={r.id} className="flex gap-2 rounded-lg bg-white/60 px-2.5 py-1.5 ring-1 ring-emerald-100">
                    <span className="text-emerald-600" aria-hidden>
                      ✓
                    </span>
                    <span className="font-medium">{formatCardLabel(r.card)}</span>
                  </li>
                ))}
              </ul>
              {acc > 4 ? (
                <p className="mt-2 text-xs text-emerald-900/70">+{acc - 4} more accepted</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-credora-line)] px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl border border-[var(--color-credora-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-credora-ink)] transition hover:bg-[var(--color-credora-surface)]"
          >
            Later
          </button>
          <Link
            href="/dashboard?tab=requests"
            onClick={() => dismiss()}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--color-credora-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            View requests
          </Link>
        </div>
      </div>
    </div>
  );
}
