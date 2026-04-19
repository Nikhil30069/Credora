"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ShareRequestStatus } from "@/types/database";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Fields for a credit-card request */
type CardPayload = {
  kind: "card";
  cardId: string;
  amount: number;
  platform: string;
  purpose: string;
  message: string | null;
};

/** Fields for a streaming / subscription request */
type StreamingPayload = {
  kind: "streaming";
  cardId: string;
  duration: string;
  useFor: string | null;  // "What will you use it for?" (optional)
  message: string | null;
};

/** Fallback for "other" asset types */
type OtherPayload = {
  kind: "other";
  cardId: string;
  purpose: string;
  message: string | null;
};

export type ShareRequestPayload = CardPayload | StreamingPayload | OtherPayload;

export async function createShareRequest(payload: ShareRequestPayload): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  // Validate per kind
  if (payload.kind === "card") {
    if (!payload.amount || payload.amount <= 0) return { ok: false, error: "Enter a valid amount." };
    if (!payload.platform.trim()) return { ok: false, error: "Platform is required." };
    if (!payload.purpose.trim()) return { ok: false, error: "Purpose is required." };
  } else if (payload.kind === "streaming") {
    if (!payload.duration.trim()) return { ok: false, error: "Duration is required." };
  } else {
    if (!payload.purpose.trim()) return { ok: false, error: "Purpose is required." };
  }

  const { data: card, error: cardErr } = await supabase
    .from("cards")
    .select("owner_id")
    .eq("id", payload.cardId)
    .maybeSingle();

  if (cardErr || !card) return { ok: false, error: "Asset not found." };
  if (card.owner_id === user.id) return { ok: false, error: "You cannot request your own asset." };

  // Build the DB row — only populate columns relevant to the kind
  const row: Record<string, unknown> = {
    card_id: payload.cardId,
    requester_id: user.id,
    owner_id: card.owner_id,
    message: payload.message?.trim() || null,
  };

  if (payload.kind === "card") {
    row.amount = payload.amount;
    row.platform = payload.platform.trim();
    row.purpose = payload.purpose.trim();
  } else if (payload.kind === "streaming") {
    row.duration = payload.duration.trim();
    row.purpose = payload.useFor?.trim() || null;
    // platform is left null; amount is left null
  } else {
    row.purpose = payload.purpose.trim();
  }

  const { error } = await supabase.from("share_requests").insert(row);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already have a pending request for this asset." };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateShareRequestStatus(
  requestId: string,
  nextStatus: ShareRequestStatus,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const { data: row, error: fetchErr } = await supabase
    .from("share_requests")
    .select("id, owner_id, requester_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchErr || !row) return { ok: false, error: "Request not found." };

  const allowedOwner: ShareRequestStatus[] = ["accepted", "rejected"];
  const allowedRequester: ShareRequestStatus[] = ["cancelled"];

  if (allowedOwner.includes(nextStatus)) {
    if (row.owner_id !== user.id) return { ok: false, error: "Not allowed." };
    if (row.status !== "pending") return { ok: false, error: "This request is no longer pending." };
  } else if (allowedRequester.includes(nextStatus)) {
    if (row.requester_id !== user.id) return { ok: false, error: "Not allowed." };
    if (row.status !== "pending") return { ok: false, error: "Only pending requests can be cancelled." };
  } else {
    return { ok: false, error: "Invalid status." };
  }

  const { error } = await supabase.from("share_requests").update({ status: nextStatus }).eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
