"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AssetType } from "@/types/database";

const CARD_BRANDS = ["Visa", "Mastercard", "American Express", "Discover", "RuPay", "Diners", "Other"] as const;
const VALID_ASSET_TYPES: AssetType[] = ["credit_card", "netflix", "prime", "spotify", "jiohotstar", "other"];
const SUBSCRIPTION_TYPES: AssetType[] = ["netflix", "prime", "spotify", "jiohotstar", "other"];

const BRAND_FOR_SUB: Partial<Record<AssetType, string>> = {
  netflix: "Netflix",
  prime: "Amazon Prime",
  spotify: "Spotify",
  jiohotstar: "JioHotstar",
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addAsset(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const assetType = String(formData.get("asset_type") ?? "credit_card") as AssetType;
  if (!VALID_ASSET_TYPES.includes(assetType)) return { ok: false, error: "Choose a valid asset type." };

  const nickname = String(formData.get("nickname") ?? "").trim();
  if (!nickname) return { ok: false, error: "Add a display name for this asset." };

  if (assetType === "credit_card") {
    const brand = String(formData.get("brand") ?? "").trim();
    const issuer = String(formData.get("issuer") ?? "").trim() || null;
    const lastFourRaw = String(formData.get("last_four") ?? "").replace(/\D/g, "");
    if (!CARD_BRANDS.includes(brand as (typeof CARD_BRANDS)[number])) {
      return { ok: false, error: "Choose a valid card network." };
    }
    if (lastFourRaw.length !== 4) return { ok: false, error: "Last four digits must be exactly 4 numbers." };

    const { error } = await supabase.from("cards").insert({
      owner_id: user.id,
      asset_type: "credit_card",
      brand,
      nickname,
      issuer,
      last_four: lastFourRaw,
    });
    if (error) return { ok: false, error: error.message };
  } else if (SUBSCRIPTION_TYPES.includes(assetType)) {
    const brand = BRAND_FOR_SUB[assetType] ?? String(formData.get("brand") ?? "").trim();
    if (!brand) return { ok: false, error: "Enter the subscription name." };
    const planTier = String(formData.get("plan_tier") ?? "").trim() || null;

    const { error } = await supabase.from("cards").insert({
      owner_id: user.id,
      asset_type: assetType,
      brand,
      nickname,
      plan_tier: planTier,
      last_four: null,
      issuer: null,
    });
    if (error) return { ok: false, error: error.message };
  }

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
