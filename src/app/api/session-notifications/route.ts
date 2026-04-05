import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SESSION_NOTIFICATION_WINDOW_HOURS } from "@/lib/session-notifications-config";
import type {
  SessionNotificationAccepted,
  SessionNotificationCard,
  SessionNotificationIncoming,
} from "@/types/session-notifications";

function sinceIsoHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function cardFromRow(row: unknown): SessionNotificationCard | null {
  if (!row || typeof row !== "object") return null;
  const c = row as Record<string, unknown>;
  const nickname = typeof c.nickname === "string" ? c.nickname : null;
  const brand = typeof c.brand === "string" ? c.brand : null;
  const last_four = typeof c.last_four === "string" ? c.last_four : null;
  if (!nickname || !brand || !last_four) return null;
  return { nickname, brand, last_four };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false as const, error: "Unauthorized" }, { status: 401 });
  }

  const since = sinceIsoHoursAgo(SESSION_NOTIFICATION_WINDOW_HOURS);

  const [incomingRes, outgoingRes] = await Promise.all([
    supabase
      .from("share_requests")
      .select("id, created_at, cards ( nickname, brand, last_four )")
      .eq("owner_id", user.id)
      .eq("status", "pending")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("share_requests")
      .select("id, created_at, updated_at, cards ( nickname, brand, last_four )")
      .eq("requester_id", user.id)
      .eq("status", "accepted")
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(25),
  ]);

  if (incomingRes.error) {
    return NextResponse.json(
      { ok: false as const, error: incomingRes.error.message },
      { status: 500 },
    );
  }
  if (outgoingRes.error) {
    return NextResponse.json(
      { ok: false as const, error: outgoingRes.error.message },
      { status: 500 },
    );
  }

  const incomingPending: SessionNotificationIncoming[] = (incomingRes.data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    card: cardFromRow(row.cards),
  }));

  const acceptedOutgoingRaw = (outgoingRes.data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    card: cardFromRow(row.cards),
  }));

  // Prefer acceptances that clearly happened after the row was created (owner responded).
  const sinceMs = Date.parse(since);
  const acceptedOutgoing: SessionNotificationAccepted[] = acceptedOutgoingRaw
    .filter((row) => {
      const c = new Date(row.createdAt).getTime();
      const u = new Date(row.updatedAt).getTime();
      if (u <= c + 800) return false;
      return u >= sinceMs;
    })
    .map((row) => ({
      id: row.id,
      acceptedAt: row.updatedAt,
      card: row.card,
    }));

  return NextResponse.json({
    ok: true as const,
    incomingPending,
    acceptedOutgoing,
  });
}
