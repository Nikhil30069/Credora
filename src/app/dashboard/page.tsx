import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddCardForm } from "@/components/dashboard/add-card-form";
import { RemoveCardButton } from "@/components/dashboard/remove-card-button";
import { RequestActions } from "@/components/dashboard/request-actions";
import { ShareRequestDialog } from "@/components/dashboard/share-request-dialog";
import type { CardRow, ShareRequestStatus } from "@/types/database";

type Tab = "uploaded" | "search" | "requests";

type CardNested = Pick<CardRow, "id" | "brand" | "last_four" | "nickname" | "issuer">;

type IncomingRow = {
  id: string;
  status: ShareRequestStatus;
  message: string | null;
  created_at: string;
  requester_id: string;
  cards: CardNested | null;
};

type OutgoingRow = {
  id: string;
  status: ShareRequestStatus;
  message: string | null;
  created_at: string;
  owner_id: string;
  cards: CardNested | null;
};

function tabClass(active: boolean) {
  return [
    "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition",
    active
      ? "bg-[var(--color-credora-ink)] text-white shadow-sm"
      : "text-[var(--color-credora-slate)] hover:bg-black/5 hover:text-[var(--color-credora-ink)]",
  ].join(" ");
}

function statusPill(status: ShareRequestStatus) {
  const map: Record<ShareRequestStatus, string> = {
    pending: "bg-amber-100 text-amber-900 ring-amber-200",
    accepted: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    rejected: "bg-zinc-100 text-zinc-800 ring-zinc-200",
    cancelled: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${map[status]}`}>
      {status}
    </span>
  );
}

function sanitizeSearch(raw: string) {
  return raw.replace(/[^a-zA-Z0-9\s]/g, "").trim();
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab =
    sp.tab === "search" || sp.tab === "requests" ? sp.tab : "uploaded";
  const qRaw = typeof sp.q === "string" ? sp.q : "";
  const q = sanitizeSearch(qRaw);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?reason=session");

  const { count: pendingIncoming } = await supabase
    .from("share_requests")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("status", "pending");

  const pendingCount = pendingIncoming ?? 0;

  let myCards: Pick<CardRow, "id" | "brand" | "last_four" | "nickname" | "issuer" | "created_at">[] | null = null;
  if (tab === "uploaded") {
    const { data } = await supabase
      .from("cards")
      .select("id, brand, last_four, nickname, issuer, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    myCards = data ?? [];
  }

  let pool: CardRow[] = [];
  if (tab === "search") {
    let query = supabase
      .from("cards")
      .select("id, owner_id, brand, last_four, nickname, issuer, created_at")
      .neq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(120);

    if (q) {
      const pattern = `%${q}%`;
      query = query.or(`brand.ilike.${pattern},issuer.ilike.${pattern}`);
    }

    const { data } = await query;
    pool = (data ?? []) as CardRow[];
  }

  let incomingRows: IncomingRow[] = [];
  let outgoingRows: OutgoingRow[] = [];
  let requesterEmail: Record<string, string> = {};
  let ownerEmail: Record<string, string> = {};

  if (tab === "requests") {
    const { data: incoming } = await supabase
      .from("share_requests")
      .select("id, status, message, created_at, requester_id, cards ( id, brand, last_four, nickname, issuer )")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    const { data: outgoing } = await supabase
      .from("share_requests")
      .select("id, status, message, created_at, owner_id, cards ( id, brand, last_four, nickname, issuer )")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    incomingRows = (incoming ?? []) as unknown as IncomingRow[];
    outgoingRows = (outgoing ?? []) as unknown as OutgoingRow[];

    const requesterIds = [...new Set(incomingRows.map((r) => r.requester_id))];
    const ownerIds = [...new Set(outgoingRows.map((r) => r.owner_id))];

    if (requesterIds.length > 0) {
      const { data: requesterProfiles } = await supabase.from("profiles").select("id, email").in("id", requesterIds);
      requesterEmail = Object.fromEntries((requesterProfiles ?? []).map((p) => [p.id, p.email]));
    }
    if (ownerIds.length > 0) {
      const { data: ownerProfiles } = await supabase.from("profiles").select("id, email").in("id", ownerIds);
      ownerEmail = Object.fromEntries((ownerProfiles ?? []).map((p) => [p.id, p.email]));
    }
  }

  const searchHref = (nextQ: string) => {
    const params = new URLSearchParams();
    params.set("tab", "search");
    if (nextQ) params.set("q", nextQ);
    return `/dashboard?${params.toString()}`;
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-credora-ink)] md:text-3xl">
            Your workspace
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-credora-slate)]">
            Manage the cards you have listed, discover other members’ networks, and respond to share requests in one
            flow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--color-credora-line)] bg-white p-1.5 shadow-sm">
          <Link href="/dashboard?tab=uploaded" className={tabClass(tab === "uploaded")}>
            Uploaded cards
          </Link>
          <Link href={searchHref(qRaw)} className={tabClass(tab === "search")}>
            Search
          </Link>
          <Link href="/dashboard?tab=requests" className={tabClass(tab === "requests")}>
            <span>Share requests</span>
            {pendingCount > 0 ? (
              <span
                className={
                  tab === "requests"
                    ? "ml-2 inline-flex min-w-[1.25rem] justify-center rounded-full bg-white/20 px-1 text-[11px] font-bold text-white tabular-nums"
                    : "ml-2 inline-flex min-w-[1.25rem] justify-center rounded-full bg-amber-100 px-1 text-[11px] font-bold text-amber-950 tabular-nums ring-1 ring-amber-200/80"
                }
              >
                {pendingCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {tab === "uploaded" ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--color-credora-line)] bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">Add a card</h2>
            <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
              Only non-sensitive fields are stored—network, nickname, issuer, and last four digits.
            </p>
            <div className="mt-6">
              <AddCardForm />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-credora-line)] bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">Your listed cards</h2>
            <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
              These entries are visible to other signed-in members for discovery.
            </p>
            <ul className="mt-6 space-y-3">
              {(myCards ?? []).length === 0 ? (
                <li className="rounded-xl border border-dashed border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-4 py-8 text-center text-sm text-[var(--color-credora-slate)]">
                  No cards yet. Add your first card to join the pool.
                </li>
              ) : (
                (myCards ?? []).map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)]/60 px-4 py-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-[var(--color-credora-ink)]">{c.nickname}</p>
                      <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
                        {c.brand}
                        {c.issuer ? ` · ${c.issuer}` : ""} · •••• {c.last_four}
                      </p>
                    </div>
                    <RemoveCardButton cardId={c.id} />
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      ) : null}

      {tab === "search" ? (
        <section className="mt-10 space-y-6">
          <form
            action="/dashboard"
            method="get"
            className="flex flex-col gap-3 rounded-2xl border border-[var(--color-credora-line)] bg-white p-4 shadow-sm sm:flex-row sm:items-end"
          >
            <input type="hidden" name="tab" value="search" />
            <div className="flex-1 space-y-1.5">
              <label htmlFor="q" className="text-sm font-medium text-[var(--color-credora-ink)]">
                Search by network or issuer
              </label>
              <input
                id="q"
                name="q"
                defaultValue={qRaw}
                placeholder="e.g. Amex, HDFC, Visa"
                className="w-full rounded-xl border border-[var(--color-credora-line)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-credora-accent)] focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[var(--color-credora-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
            >
              Search
            </button>
          </form>

          <div className="rounded-2xl border border-[var(--color-credora-line)] bg-white shadow-sm">
            <div className="border-b border-[var(--color-credora-line)] px-6 py-4">
              <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">Results</h2>
              <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
                {q ? `Matches for “${q}”.` : "Showing the newest cards from other members (up to 120)."}
              </p>
            </div>
            <ul className="divide-y divide-[var(--color-credora-line)]">
              {pool.length === 0 ? (
                <li className="px-6 py-10 text-center text-sm text-[var(--color-credora-slate)]">
                  {q
                    ? "No cards match that search. Try another issuer or network."
                    : "No other members have listed cards yet—or you are the only one in the pool."}
                </li>
              ) : (
                pool.map((c) => {
                  const label = `${c.nickname} · ${c.brand}${c.issuer ? ` · ${c.issuer}` : ""} · •••• ${c.last_four}`;
                  return (
                    <li key={c.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-[var(--color-credora-ink)]">{c.nickname}</p>
                        <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
                          {c.brand}
                          {c.issuer ? ` · ${c.issuer}` : ""} · •••• {c.last_four}
                        </p>
                      </div>
                      <ShareRequestDialog cardId={c.id} label={label} />
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </section>
      ) : null}

      {tab === "requests" ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--color-credora-line)] bg-white shadow-sm">
            <div className="border-b border-[var(--color-credora-line)] px-6 py-4">
              <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">Incoming</h2>
              <p className="mt-1 text-sm text-[var(--color-credora-slate)]">Requests on cards you own.</p>
            </div>
            <ul className="divide-y divide-[var(--color-credora-line)]">
              {incomingRows.length === 0 ? (
                <li className="px-6 py-10 text-center text-sm text-[var(--color-credora-slate)]">
                  No requests yet. When someone needs your card, it will appear here.
                </li>
              ) : (
                incomingRows.map((r) => {
                  const card = r.cards;
                  const who = requesterEmail[r.requester_id] ?? "Member";
                  return (
                    <li key={r.id} className="space-y-3 px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {statusPill(r.status)}
                        <span className="text-xs text-[var(--color-credora-slate)]">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-credora-ink)]">
                        <span className="font-semibold">{who}</span> asked to coordinate
                        {card ? (
                          <>
                            {" "}
                            on{" "}
                            <span className="font-medium">
                              {card.nickname} ({card.brand} · •••• {card.last_four})
                            </span>
                          </>
                        ) : (
                          " a card"
                        )}
                        .
                      </p>
                      {r.message ? (
                        <p className="rounded-xl bg-[var(--color-credora-surface)] px-3 py-2 text-sm text-[var(--color-credora-slate)]">
                          “{r.message}”
                        </p>
                      ) : null}
                      <RequestActions requestId={r.id} role="owner" status={r.status} />
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--color-credora-line)] bg-white shadow-sm">
            <div className="border-b border-[var(--color-credora-line)] px-6 py-4">
              <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">Outgoing</h2>
              <p className="mt-1 text-sm text-[var(--color-credora-slate)]">Requests you have sent.</p>
            </div>
            <ul className="divide-y divide-[var(--color-credora-line)]">
              {outgoingRows.length === 0 ? (
                <li className="px-6 py-10 text-center text-sm text-[var(--color-credora-slate)]">
                  You have not sent any requests. Use Search to find a card.
                </li>
              ) : (
                outgoingRows.map((r) => {
                  const card = r.cards;
                  const who = ownerEmail[r.owner_id] ?? "Owner";
                  return (
                    <li key={r.id} className="space-y-3 px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {statusPill(r.status)}
                        <span className="text-xs text-[var(--color-credora-slate)]">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-credora-ink)]">
                        To <span className="font-semibold">{who}</span>
                        {card ? (
                          <>
                            {" "}
                            for{" "}
                            <span className="font-medium">
                              {card.nickname} ({card.brand} · •••• {card.last_four})
                            </span>
                          </>
                        ) : null}
                      </p>
                      {r.message ? (
                        <p className="rounded-xl bg-[var(--color-credora-surface)] px-3 py-2 text-sm text-[var(--color-credora-slate)]">
                          “{r.message}”
                        </p>
                      ) : null}
                      <RequestActions requestId={r.id} role="requester" status={r.status} />
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>
      ) : null}
    </main>
  );
}
