"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/database";

const MAX_CHARS = 2000;

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function avatarLetter(email: string) {
  return email.charAt(0).toUpperCase();
}

type ChatDrawerProps = {
  open: boolean;
  onClose: () => void;
  requestId: string;
  myUserId: string;
  counterpartEmail: string;
  assetLabel: string;
  /** Called after read state is persisted (clears unread badge on parent). */
  onMarkedRead?: () => void;
};

export function ChatDrawer({
  open,
  onClose,
  requestId,
  myUserId,
  counterpartEmail,
  assetLabel,
  onMarkedRead,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /** FIFO of optimistic `temp-*` ids still waiting for the server row (Realtime or insert response). */
  const pendingTempIdsRef = useRef<string[]>([]);
  const supabase = createClient();

  // ── scroll to bottom ──────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useLayoutEffect(() => {
    if (open && !loading) scrollToBottom(false);
  }, [open, loading, scrollToBottom]);

  // ── mark read ─────────────────────────────────────────────────────────────
  const markRead = useCallback(async () => {
    const { error } = await supabase.from("message_reads").upsert(
      { request_id: requestId, user_id: myUserId, last_read_at: new Date().toISOString() },
      { onConflict: "request_id,user_id" },
    );
    if (!error) onMarkedRead?.();
  }, [supabase, requestId, myUserId, onMarkedRead]);

  // ── load history + realtime ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    pendingTempIdsRef.current = [];

    let mounted = true;

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("id, request_id, sender_id, content, created_at")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (mounted) {
        setMessages((data as Message[]) ?? []);
        setLoading(false);
      }
    })();

    // Realtime subscription for new inserts
    const channel = supabase
      .channel(`chat:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;

            // Own message: merge into the matching optimistic row (temp id ≠ server id, so dedupe by id alone fails).
            if (msg.sender_id === myUserId) {
              const pending = pendingTempIdsRef.current;
              for (let p = 0; p < pending.length; p++) {
                const tempId = pending[p];
                const i = prev.findIndex((m) => m.id === tempId);
                if (i !== -1) {
                  const next = [...prev];
                  next[i] = msg;
                  pending.splice(p, 1);
                  return next;
                }
              }
            }

            return [...prev, msg];
          });
          // auto-scroll on incoming messages
          setTimeout(() => scrollToBottom(true), 50);
          // mark read if this is from counterpart
          if (msg.sender_id !== myUserId) markRead();
        },
      )
      .subscribe();

    // mark read when opening
    markRead();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [open, requestId, myUserId, supabase, scrollToBottom, markRead]);

  // mark read when messages finish loading
  useEffect(() => {
    if (!loading && open) markRead();
  }, [loading, open, markRead]);

  // re-focus input when drawer opens
  useEffect(() => {
    if (open && !loading) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, loading]);

  // ── send message ──────────────────────────────────────────────────────────
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      request_id: requestId,
      sender_id: myUserId,
      content: text,
      created_at: new Date().toISOString(),
    };
    pendingTempIdsRef.current.push(tempId);
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setTimeout(() => scrollToBottom(true), 50);

    const { data: inserted, error: err } = await supabase
      .from("messages")
      .insert({
        request_id: requestId,
        sender_id: myUserId,
        content: text,
      })
      .select("id, request_id, sender_id, content, created_at")
      .single();

    const dropPending = () => {
      const q = pendingTempIdsRef.current;
      const i = q.indexOf(tempId);
      if (i !== -1) q.splice(i, 1);
    };

    if (err || !inserted) {
      dropPending();
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
      setError("Failed to send. Try again.");
    } else {
      dropPending();
      setMessages((prev) => {
        if (prev.some((m) => m.id === inserted.id)) return prev;
        const i = prev.findIndex((m) => m.id === tempId);
        if (i === -1) return [...prev, inserted as Message];
        const next = [...prev];
        next[i] = inserted as Message;
        return next;
      });
    }
    setSending(false);
  }, [input, sending, requestId, myUserId, supabase, scrollToBottom]);

  // Enter to send, Shift+Enter for new line
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send],
  );

  // ── group messages by date ────────────────────────────────────────────────
  type Group = { date: string; msgs: Message[] };
  const groups = messages.reduce<Group[]>((acc, msg) => {
    const d = new Date(msg.created_at).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const last = acc[acc.length - 1];
    if (last?.date === d) {
      last.msgs.push(msg);
    } else {
      acc.push({ date: d, msgs: [msg] });
    }
    return acc;
  }, []);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* drawer */}
      <div
        role="dialog"
        aria-modal
        aria-label={`Chat about ${assetLabel}`}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-[var(--color-credora-line)] px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-credora-accent)] text-sm font-bold text-white">
            {avatarLetter(counterpartEmail)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--color-credora-ink)]">
              {counterpartEmail}
            </p>
            <p className="truncate text-xs text-[var(--color-credora-slate)]">{assetLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-credora-slate)] transition hover:bg-[var(--color-credora-surface)] hover:text-[var(--color-credora-ink)]"
            aria-label="Close chat"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Messages list ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-credora-accent)] border-t-transparent" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-credora-accent-soft)]">
                <svg className="h-7 w-7 text-[var(--color-credora-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[var(--color-credora-ink)]">Start the conversation</p>
              <p className="mt-1 max-w-xs text-xs text-[var(--color-credora-slate)]">
                You&apos;re now connected. Coordinate the share, ask questions, or agree on terms.
              </p>
            </div>
          )}

          {!loading && groups.map((group) => (
            <div key={group.date}>
              {/* date separator */}
              <div className="relative my-4 flex items-center gap-3">
                <div className="flex-1 border-t border-[var(--color-credora-line)]" />
                <span className="shrink-0 rounded-full border border-[var(--color-credora-line)] bg-white px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-credora-slate)]">
                  {group.date}
                </span>
                <div className="flex-1 border-t border-[var(--color-credora-line)]" />
              </div>

              <div className="space-y-1.5">
                {group.msgs.map((msg, idx) => {
                  const isMe = msg.sender_id === myUserId;
                  const prevMsg = group.msgs[idx - 1];
                  const nextMsg = group.msgs[idx + 1];
                  const sameSenderAsPrev = prevMsg?.sender_id === msg.sender_id;
                  const sameSenderAsNext = nextMsg?.sender_id === msg.sender_id;
                  const isOptimistic = msg.id.startsWith("temp-");

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* avatar — only shown on last message in a run */}
                      <div className="w-7 shrink-0">
                        {!isMe && !sameSenderAsNext ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-credora-mist)] text-[11px] font-bold text-[var(--color-credora-slate)]">
                            {avatarLetter(counterpartEmail)}
                          </div>
                        ) : null}
                      </div>

                      <div
                        className={`flex max-w-[75%] flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={[
                            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                            isMe
                              ? "rounded-br-sm bg-[var(--color-credora-accent)] text-white"
                              : "rounded-bl-sm bg-[var(--color-credora-surface)] text-[var(--color-credora-ink)]",
                            sameSenderAsPrev && isMe ? "rounded-tr-sm" : "",
                            sameSenderAsPrev && !isMe ? "rounded-tl-sm" : "",
                            isOptimistic ? "opacity-70" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={{ wordBreak: "break-word" }}
                        >
                          {msg.content.split("\n").map((line, i) => (
                            <span key={i}>
                              {line}
                              {i < msg.content.split("\n").length - 1 && <br />}
                            </span>
                          ))}
                        </div>
                        {/* timestamp — only on last in a run */}
                        {!sameSenderAsNext && (
                          <span className="px-1 text-[10px] text-[var(--color-credora-slate)]">
                            {isOptimistic ? "Sending…" : formatTime(msg.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div ref={bottomRef} className="h-px" />
        </div>

        {/* ── Error banner ────────────────────────────────────────────────── */}
        {error && (
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-red-200">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-auto underline">
              Dismiss
            </button>
          </div>
        )}

        {/* ── Input area ──────────────────────────────────────────────────── */}
        <div className="border-t border-[var(--color-credora-line)] bg-white px-4 py-3">
          <div className="flex items-end gap-3">
            <div className="relative min-h-[44px] flex-1">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) setInput(e.target.value);
                }}
                onKeyDown={onKeyDown}
                placeholder="Message…"
                className="w-full resize-none overflow-hidden rounded-2xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-4 py-3 pr-16 text-sm leading-relaxed outline-none transition placeholder:text-[var(--color-credora-slate)] focus:border-[var(--color-credora-accent)] focus:ring-3 focus:ring-[var(--color-credora-accent-soft)]"
                style={{ maxHeight: "160px", overflowY: "auto" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
                }}
              />
              {input.length > MAX_CHARS * 0.85 && (
                <span
                  className={`absolute bottom-2 right-3 text-[10px] tabular-nums ${
                    input.length >= MAX_CHARS ? "text-red-600" : "text-[var(--color-credora-slate)]"
                  }`}
                >
                  {input.length}/{MAX_CHARS}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || sending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-credora-accent)] text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              {sending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-5 w-5 translate-x-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-credora-slate)]">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
