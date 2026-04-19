"use client";

import { useEffect, useRef, useState } from "react";
import { ChatDrawer } from "./chat-drawer";
import { RequestActions } from "./request-actions";
import { createClient } from "@/lib/supabase/client";
import { ASSET_META, type AssetType, type CardRow, type ShareRequestStatus } from "@/types/database";

function unreadBadgeLabel(count: number) {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

type CardNested = Pick<CardRow, "id" | "asset_type" | "brand" | "last_four" | "nickname" | "issuer" | "plan_tier">;

export type RequestRowClient = {
  id: string;
  status: ShareRequestStatus;
  message: string | null;
  amount: number | null;
  purpose: string | null;
  platform: string | null;
  duration: string | null;
  created_at: string;
  requester_id: string;
  owner_id: string;
  owner_phone_visible: boolean;
  requester_phone_visible: boolean;
  cards: CardNested | null;
};

const STREAMING_TYPES = new Set(["netflix", "prime", "spotify", "jiohotstar"]);

function formatAmount(n: number | null) {
  if (!n) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function statusConfig(status: ShareRequestStatus) {
  const map: Record<ShareRequestStatus, { cls: string; icon: string }> = {
    pending: { cls: "bg-amber-100 text-amber-900 ring-amber-200", icon: "⏳" },
    accepted: { cls: "bg-emerald-100 text-emerald-900 ring-emerald-200", icon: "✓" },
    rejected: { cls: "bg-zinc-100 text-zinc-800 ring-zinc-200", icon: "✗" },
    cancelled: { cls: "bg-zinc-100 text-zinc-600 ring-zinc-200", icon: "—" },
  };
  return map[status];
}

function DetailPill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-credora-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-credora-ink)]">
      <span className="text-[var(--color-credora-slate)]">{icon}</span>
      {children}
    </span>
  );
}

function EmailReveal({ email, label }: { email: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-200/70">
        <svg className="h-3.5 w-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-700/70">{label}</p>
        <a href={`mailto:${email}`} className="block truncate text-sm font-semibold text-emerald-900 hover:underline">
          {email}
        </a>
      </div>
    </div>
  );
}

function PhoneReveal({ phone, label }: { phone: string; label: string }) {
  const tel = phone.replace(/\s/g, "");
  return (
    <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-200/70">
        <svg className="h-3.5 w-3.5 text-sky-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-sky-800/70">{label}</p>
        <a href={`tel:${tel}`} className="block truncate text-sm font-semibold text-sky-950 hover:underline">
          {phone}
        </a>
      </div>
    </div>
  );
}

export function RequestCardClient({
  r,
  role,
  counterpartEmail,
  counterpartPhone,
  myUserId,
  initialUnreadCount = 0,
}: {
  r: RequestRowClient;
  role: "owner" | "requester";
  counterpartEmail: string;
  counterpartPhone: string | null;
  myUserId: string;
  /** Unread messages in this thread (from server on load; updated live). */
  initialUnreadCount?: number;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadChat, setUnreadChat] = useState(initialUnreadCount);
  const chatOpenRef = useRef(chatOpen);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  useEffect(() => {
    setUnreadChat(initialUnreadCount);
  }, [initialUnreadCount]);

  const card = r.cards;
  const sc = statusConfig(r.status);
  const isAccepted = r.status === "accepted";
  const phoneLabel = role === "owner" ? "Requester phone" : "Owner phone";

  // Owner always sees requester contact; requester sees owner contact only after acceptance
  const showContact = role === "owner" || isAccepted;
  const assetMeta = card
    ? (ASSET_META[(card.asset_type ?? "credit_card") as AssetType] ?? ASSET_META.other)
    : null;

  const assetLabel = card
    ? `${card.nickname}${card.plan_tier ? ` · ${card.plan_tier}` : ""}${card.last_four ? ` · •••• ${card.last_four}` : ""}`
    : "Asset";

  // Live unread: new messages from counterpart while chat drawer is closed
  useEffect(() => {
    if (!isAccepted) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`unread-badge:${r.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${r.id}`,
        },
        (payload) => {
          const row = payload.new as { sender_id?: string };
          if (row.sender_id === myUserId) return;
          if (chatOpenRef.current) return;
          setUnreadChat((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAccepted, r.id, myUserId]);

  return (
    <>
      <li className="group relative overflow-hidden rounded-xl border border-[var(--color-credora-line)] bg-white transition hover:border-[var(--color-credora-accent)]/30 hover:shadow-md">
        {isAccepted && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
        )}
        {r.status === "pending" && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400" />
        )}

        <div className="space-y-3 p-5">
          {/* top row: status + date */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${sc.cls}`}>
                <span>{sc.icon}</span> {r.status}
              </span>
              {card && assetMeta && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${assetMeta.color}`}>
                  {assetMeta.icon} {assetMeta.label}
                </span>
              )}
              {card && (
                <span className="rounded-lg bg-[var(--color-credora-ink)]/5 px-2 py-0.5 text-xs font-medium text-[var(--color-credora-ink)]">
                  {card.brand}
                  {card.last_four ? ` · •••• ${card.last_four}` : ""}
                  {card.plan_tier ? ` · ${card.plan_tier}` : ""}
                </span>
              )}
            </div>
            <time className="text-[11px] tabular-nums text-[var(--color-credora-slate)]">
              {new Date(r.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" · "}
              {new Date(r.created_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>

          {card && (
            <p className="text-sm font-medium text-[var(--color-credora-ink)]">
              {card.nickname}
              {card.issuer && <span className="font-normal text-[var(--color-credora-slate)]"> · {card.issuer}</span>}
              {card.plan_tier && !card.issuer && (
                <span className="font-normal text-[var(--color-credora-slate)]"> · {card.plan_tier}</span>
              )}
            </p>
          )}

          {(() => {
            const assetType = card?.asset_type ?? "other";
            const isStreaming = STREAMING_TYPES.has(String(assetType).toLowerCase());
            const isCard = assetType === "credit_card";
            const hasPills = isStreaming
              ? r.duration || r.purpose
              : isCard
              ? r.amount || r.platform || r.purpose
              : r.purpose;
            return hasPills ? (
              <div className="flex flex-wrap gap-2">
                {isStreaming ? (
                  <>
                    {r.duration && <DetailPill icon="⏱">{r.duration}</DetailPill>}
                    {r.purpose && <DetailPill icon="🎬">{r.purpose}</DetailPill>}
                  </>
                ) : isCard ? (
                  <>
                    {r.amount && <DetailPill icon="₹">{formatAmount(r.amount)}</DetailPill>}
                    {r.platform && <DetailPill icon="🏪">{r.platform}</DetailPill>}
                    {r.purpose && <DetailPill icon="📋">{r.purpose}</DetailPill>}
                  </>
                ) : (
                  <>
                    {r.purpose && <DetailPill icon="📋">{r.purpose}</DetailPill>}
                  </>
                )}
              </div>
            ) : null;
          })()}

          {r.message && (
            <p className="rounded-lg bg-[var(--color-credora-surface)] px-3 py-2 text-sm italic text-[var(--color-credora-slate)]">
              &ldquo;{r.message}&rdquo;
            </p>
          )}

          {showContact ? (
            <>
              <EmailReveal
                email={counterpartEmail}
                label={role === "owner" ? "Requester contact" : "Owner contact"}
              />
              {counterpartPhone?.trim() && (
                <PhoneReveal phone={counterpartPhone.trim()} label={phoneLabel} />
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[var(--color-credora-slate)]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-credora-accent-soft)] text-[10px] font-bold text-[var(--color-credora-accent)]">
                {counterpartEmail.charAt(0).toUpperCase()}
              </span>
              <span>Owner contact visible after acceptance</span>
            </div>
          )}

          {/* action row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <RequestActions requestId={r.id} role={role} status={r.status} />

            {isAccepted && (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="relative inline-flex items-center gap-2 rounded-full bg-[var(--color-credora-ink)] px-4 py-2 pr-5 text-xs font-semibold text-white shadow-sm transition hover:opacity-85 active:scale-95"
                aria-label={unreadChat > 0 ? `Chat, ${unreadChat} unread` : "Chat"}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                Chat
                {unreadChat > 0 ? (
                  <span className="absolute -right-1 -top-1 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white tabular-nums">
                    {unreadBadgeLabel(unreadChat)}
                  </span>
                ) : null}
              </button>
            )}
          </div>
        </div>
      </li>

      {/* Chat drawer — rendered per card, only mounted when accepted */}
      {isAccepted && (
          <ChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          requestId={r.id}
          myUserId={myUserId}
          counterpartEmail={counterpartEmail}
          assetLabel={assetLabel}
          onMarkedRead={() => setUnreadChat(0)}
        />
      )}
    </>
  );
}
