import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 });

  const { data, error } = await supabase.rpc("my_unread_message_count");
  if (error) return NextResponse.json({ count: 0 });

  return NextResponse.json({ count: Number(data ?? 0) });
}
