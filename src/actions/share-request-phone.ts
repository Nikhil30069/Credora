"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PhoneToggleResult = { ok: true } | { ok: false; error: string };

export async function setShareRequestPhoneVisible(requestId: string, visible: boolean): Promise<PhoneToggleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const { error } = await supabase.rpc("set_share_request_phone_visible", {
    request_id: requestId,
    visible,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
