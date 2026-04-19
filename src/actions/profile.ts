"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileSaveResult = { ok: true } | { ok: false; error: string };

function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  return { trimmed, digits };
}

export async function saveProfileBasics(fullName: string, phone: string): Promise<ProfileSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const name = fullName.trim();
  if (name.length < 2) return { ok: false, error: "Enter your full name (at least 2 characters)." };

  const { trimmed: phoneTrimmed, digits } = normalizePhone(phone);
  if (digits.length < 10 || digits.length > 15) {
    return { ok: false, error: "Enter a valid phone number (10–15 digits)." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: name,
      phone: phoneTrimmed,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard", "page");
  revalidatePath("/complete-profile", "page");
  return { ok: true };
}
