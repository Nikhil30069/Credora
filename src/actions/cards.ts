"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BRANDS = ["Visa", "Mastercard", "American Express", "Discover", "RuPay", "Diners", "Other"] as const;

function normalizeLastFour(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 4) return null;
  return digits;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addCard(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const brand = String(formData.get("brand") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const issuer = String(formData.get("issuer") ?? "").trim() || null;
  const lastFour = normalizeLastFour(String(formData.get("last_four") ?? ""));

  if (!BRANDS.includes(brand as (typeof BRANDS)[number])) {
    return { ok: false, error: "Choose a valid network." };
  }
  if (!nickname) return { ok: false, error: "Add a short name for this card." };
  if (!lastFour) return { ok: false, error: "Last four digits must be exactly 4 numbers." };

  const { error } = await supabase.from("cards").insert({
    owner_id: user.id,
    brand,
    nickname,
    issuer,
    last_four: lastFour,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeCard(cardId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const { error } = await supabase.from("cards").delete().eq("id", cardId).eq("owner_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
