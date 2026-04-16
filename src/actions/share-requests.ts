"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ShareRequestStatus } from "@/types/database";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type ShareRequestPayload = {
  cardId: string;
  amount: number;
  purpose: string;
  platform: string;
  message: string | null;
};

export async function createShareRequest(payload: ShareRequestPayload): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  if (!payload.amount || payload.amount <= 0) return { ok: false, error: "Enter a valid amount." };
  if (!payload.purpose.trim()) return { ok: false, error: "Purpose is required." };
  if (!payload.platform.trim()) return { ok: false, error: "Platform is required." };

  const { data: card, error: cardErr } = await supabase
    .from("cards")
    .select("owner_id")
    .eq("id", payload.cardId)
    .maybeSingle();

  if (cardErr || !card) return { ok: false, error: "Asset not found." };
  if (card.owner_id === user.id) return { ok: false, error: "You cannot request your own asset." };

  const { error } = await supabase.from("share_requests").insert({
    card_id: payload.cardId,
    requester_id: user.id,
    owner_id: card.owner_id,
    amount: payload.amount,
    purpose: payload.purpose.trim(),
    platform: payload.platform.trim(),
    message: payload.message?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already have a pending request for this card." };
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
