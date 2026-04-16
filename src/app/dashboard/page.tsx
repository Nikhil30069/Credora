import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddAssetForm } from "@/components/dashboard/add-asset-form";
import { RemoveCardButton } from "@/components/dashboard/remove-card-button";
import { RequestActions } from "@/components/dashboard/request-actions";
import { CardSearch } from "@/components/dashboard/card-search";
import { SharePhoneToggle } from "@/components/dashboard/share-phone-toggle";
import { domainDisplayName } from "@/lib/blocked-domains";
import { ASSET_META, type AssetType, type CardRow, type ShareRequestStatus } from "@/types/database";

type Tab = "uploaded" | "search" | "requests";

type CardNested = Pick<CardRow, "id" | "asset_type" | "brand" | "last_four" | "nickname" | "issuer" | "plan_tier">;

type RequestRow = {
  id: string;
  status: ShareRequestStatus;
  message: string | null;
  amount: number | null;
  purpose: string | null;
  platform: string | null;
  created_at: string;
  requester_id: string;
  owner_id: string;
  owner_phone_visible: boolean;
  requester_phone_visible: boolean;
  cards: CardNested | null;
};

function tabLinkClass(active: boolean) {
  return [
    "inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition -mb-px",
    active
      ? "border-[var(--color-credora-ink)] text-[var(--color-credora-ink)]"
      : "border-transparent text-[var(--color-credora-slate)] hover:border-[var(--color-credora-line)] hover:text-[var(--color-credora-ink)]",
  ].join(" ");
}

function statusConfig(status: ShareRequestStatus) {
  const map: Record<ShareRequestStatus, { cls: string; icon: string }> = {
    pending: { cls: "bg-amber-100 text-amber-900 ring-amber-200", icon: "⏳" },
    accepted: { cls: "bg-emerald-100 text-emerald-900 ring-emerald-200", icon: "✓" },
    rejected: { cls: "bg-zinc-100 text-zinc-800 ring-zinc-200", icon: "✗" },
    cancelled: { cls: "bg-zinc-100 text-zinc-600 ring-zinc-200", icon: "—" },
  };
  return map[status];
}

function formatAmount(n: number | null) {
  if (!n) return null;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function DetailPill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-credora-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-credora-ink)]">
      <span className="text-[var(--color-credora-slate)]">{icon}</span>
      {children}
    </span>
  );
}

function EmailReveal({ email, label }: { email: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-200/70">
        <svg className="h-3.5 w-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-700/70">{label}</p>
        <a href={`mailto:${email}`} className="block truncate text-sm font-semibold text-emerald-900 hover:underline">
          {email}
        </a>
      </div>
    </div>
  );
}

function PhoneReveal({ phone, label }: { phone: string; label: string }) {
  const tel = phone.replace(/\s/g, "");
  return (
    <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-200/70">
        <svg className="h-3.5 w-3.5 text-sky-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-sky-800/70">{label}</p>
        <a href={`tel:${tel}`} className="block truncate text-sm font-semibold text-sky-950 hover:underline">
          {phone}
        </a>
      </div>
    </div>
  );
}

function RequestCard({
  r,
  role,
  counterpartEmail,
  counterpartPhone,
  myPhoneVisible,
}: {
  r: RequestRow;
  role: "owner" | "requester";
  counterpartEmail: string;
  counterpartPhone: string | null;
  myPhoneVisible: boolean;
}) {
  const card = r.cards;
  const sc = statusConfig(r.status);
  const isAccepted = r.status === "accepted";
  const showEmail = isAccepted;
  const phoneLabel = role === "owner" ? "Requester phone" : "Owner phone";
  const assetMeta = card ? (ASSET_META[(card.asset_type ?? "credit_card") as AssetType] ?? ASSET_META.other) : null;

  return (
    <li className="group relative overflow-hidden rounded-xl border border-[var(--color-credora-line)] bg-white transition hover:border-[var(--color-credora-accent)]/30 hover:shadow-md">
      {isAccepted ? (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400" />
      ) : null}
      {r.status === "pending" ? (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400" />
      ) : null}

      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${sc.cls}`}>
              <span>{sc.icon}</span> {r.status}
            </span>
            {card && assetMeta ? (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${assetMeta.color}`}>
                {assetMeta.icon} {assetMeta.label}
              </span>
            ) : null}
            {card ? (
              <span className="rounded-lg bg-[var(--color-credora-ink)]/5 px-2 py-0.5 text-xs font-medium text-[var(--color-credora-ink)]">
                {card.brand}{card.last_four ? ` · •••• ${card.last_four}` : ""}{card.plan_tier ? ` · ${card.plan_tier}` : ""}
              </span>
            ) : null}
          </div>
          <time className="text-[11px] tabular-nums text-[var(--color-credora-slate)]">
            {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {" · "}
            {new Date(r.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </time>
        </div>

        {card ? (
          <p className="text-sm font-medium text-[var(--color-credora-ink)]">
            {card.nickname}
            {card.issuer ? <span className="font-normal text-[var(--color-credora-slate)]"> · {card.issuer}</span> : null}
            {card.plan_tier && !card.issuer ? <span className="font-normal text-[var(--color-credora-slate)]"> · {card.plan_tier}</span> : null}
          </p>
        ) : null}

        {(r.amount || r.purpose || r.platform) ? (
          <div className="flex flex-wrap gap-2">
            {r.amount ? <DetailPill icon="₹">{formatAmount(r.amount)}</DetailPill> : null}
            {r.platform ? <DetailPill icon="🏪">{r.platform}</DetailPill> : null}
            {r.purpose ? <DetailPill icon="📋">{r.purpose}</DetailPill> : null}
          </div>
        ) : null}

        {r.message ? (
          <p className="rounded-lg bg-[var(--color-credora-surface)] px-3 py-2 text-sm italic text-[var(--color-credora-slate)]">
            &ldquo;{r.message}&rdquo;
          </p>
        ) : null}

        <div className="flex items-center gap-2 text-xs text-[var(--color-credora-slate)]">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-credora-accent-soft)] text-[10px] font-bold text-[var(--color-credora-accent)]">
            {counterpartEmail.charAt(0).toUpperCase()}
          </span>
          {showEmail ? (
            <a href={`mailto:${counterpartEmail}`} className="font-medium text-[var(--color-credora-ink)] hover:underline">
              {counterpartEmail}
            </a>
          ) : (
            <span>{role === "owner" ? "Requester" : "Card owner"} · email visible after acceptance</span>
          )}
        </div>

        {showEmail ? (
          <EmailReveal
            email={counterpartEmail}
            label={role === "owner" ? "Requester contact" : "Card owner contact"}
          />
        ) : null}

        {isAccepted && counterpartPhone?.trim() ? <PhoneReveal phone={counterpartPhone.trim()} label={phoneLabel} /> : null}

        {isAccepted ? (
          <SharePhoneToggle
            requestId={r.id}
            visible={myPhoneVisible}
          />
        ) : null}

        <RequestActions requestId={r.id} role={role} status={r.status} />
      </div>
    </li>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab =
    sp.tab === "uploaded" ? "uploaded" : sp.tab === "requests" ? "requests" : "search";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?reason=session");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("domain")
    .eq("id", user.id)
    .maybeSingle();
  const userDomain = myProfile?.domain ?? "";

  const { count: pendingIncoming } = await supabase
    .from("share_requests")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("status", "pending");

  const pendingCount = pendingIncoming ?? 0;

  type MyCard = Pick<CardRow, "id" | "asset_type" | "brand" | "last_four" | "nickname" | "issuer" | "plan_tier" | "created_at">;
  let myCards: MyCard[] = [];
  if (tab === "uploaded") {
    const { data } = await supabase
      .from("cards")
      .select("id, asset_type, brand, last_four, nickname, issuer, plan_tier, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    myCards = (data ?? []) as unknown as MyCard[];
  }

  let incomingRows: RequestRow[] = [];
  let outgoingRows: RequestRow[] = [];
  const requesterEmail: Record<string, string> = {};
  const ownerEmail: Record<string, string> = {};

  let counterpartPhoneByRequestId: Record<string, string | null> = {};

  if (tab === "requests") {
    const { data: incoming } = await supabase
      .from("share_requests")
      .select(
        "id, status, message, amount, purpose, platform, created_at, requester_id, owner_id, owner_phone_visible, requester_phone_visible, cards ( id, asset_type, brand, last_four, nickname, issuer, plan_tier )",
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    const { data: outgoing } = await supabase
      .from("share_requests")
      .select(
        "id, status, message, amount, purpose, platform, created_at, requester_id, owner_id, owner_phone_visible, requester_phone_visible, cards ( id, asset_type, brand, last_four, nickname, issuer, plan_tier )",
      )
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false });

    incomingRows = (incoming ?? []) as unknown as RequestRow[];
    outgoingRows = (outgoing ?? []) as unknown as RequestRow[];

    const acceptedRequestIds = [
      ...incomingRows.filter((r) => r.status === "accepted").map((r) => r.id),
      ...outgoingRows.filter((r) => r.status === "accepted").map((r) => r.id),
    ];
    const phoneEntries = await Promise.all(
      acceptedRequestIds.map(async (rid) => {
        const { data } = await supabase.rpc("counterparty_phone_for_share_request", {
          p_request_id: rid,
        });
        return [rid, (typeof data === "string" ? data : null) ?? null] as const;
      }),
    );
    counterpartPhoneByRequestId = Object.fromEntries(phoneEntries);

    const acceptedInIds = incomingRows.filter((r) => r.status === "accepted").map((r) => r.requester_id);
    const allRequesterIds = [...new Set(incomingRows.map((r) => r.requester_id))];

    const acceptedOutIds = outgoingRows.filter((r) => r.status === "accepted").map((r) => r.owner_id);
    const allOwnerIds = [...new Set(outgoingRows.map((r) => r.owner_id))];

    if (allRequesterIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", allRequesterIds);
      for (const p of profiles ?? []) {
        if (acceptedInIds.includes(p.id)) {
          requesterEmail[p.id] = p.email;
        } else {
          requesterEmail[p.id] = p.email.replace(/^(.).+(@.+)$/, "$1•••$2");
        }
      }
    }
    if (allOwnerIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", allOwnerIds);
      for (const p of profiles ?? []) {
        if (acceptedOutIds.includes(p.id)) {
          ownerEmail[p.id] = p.email;
        } else {
          ownerEmail[p.id] = p.email.replace(/^(.).+(@.+)$/, "$1•••$2");
        }
      }
    }
  }

  const communityLabel = userDomain ? domainDisplayName(userDomain) : "your community";

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <nav className="border-b border-[var(--color-credora-line)]">
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 sm:gap-x-14">
          <Link href="/dashboard?tab=search" className={tabLinkClass(tab === "search")}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Search
          </Link>
          <Link href="/dashboard?tab=uploaded" className={tabLinkClass(tab === "uploaded")}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            My assets
          </Link>
          <Link href="/dashboard?tab=requests" className={tabLinkClass(tab === "requests")}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <span>Requests</span>
            {pendingCount > 0 ? (
              <span className="ml-1 inline-flex min-w-[1.25rem] justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-950 tabular-nums ring-1 ring-amber-200/80">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        </div>
      </nav>

      {tab !== "search" ? (
        <div className="mt-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-credora-ink)] md:text-3xl">
            {tab === "uploaded" ? "Your listed assets" : "Share requests"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-credora-slate)]">
            {tab === "uploaded"
              ? "Add what you’re open to sharing, or manage listings visible to your community."
              : "Incoming requests on assets you own, and outgoing requests you’ve sent."}
          </p>
        </div>
      ) : null}

      {tab === "uploaded" ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-[var(--color-credora-line)] bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">List an asset</h2>
            <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
              Credit cards, subscriptions, or any digital perk you&apos;d share with your community.
            </p>
            <div className="mt-6">
              <AddAssetForm />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-credora-line)] bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">Your listed assets</h2>
            <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
              Visible to other signed-in members in your community for discovery.
            </p>
            <ul className="mt-6 space-y-3">
              {(myCards ?? []).length === 0 ? (
                <li className="rounded-xl border border-dashed border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-4 py-8 text-center text-sm text-[var(--color-credora-slate)]">
                  No assets yet. List your first card or subscription to join the pool.
                </li>
              ) : (
                (myCards ?? []).map((c) => {
                  const meta = ASSET_META[(c.asset_type ?? "credit_card") as AssetType] ?? ASSET_META.other;
                  return (
                    <li
                      key={c.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)]/60 px-4 py-4 transition hover:border-[var(--color-credora-accent)]/30 hover:shadow-sm sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${meta.color}`}>
                            {meta.icon} {meta.label}
                          </span>
                          <p className="font-semibold text-[var(--color-credora-ink)]">{c.nickname}</p>
                        </div>
                        <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
                          {c.brand}
                          {c.issuer ? ` · ${c.issuer}` : ""}
                          {c.last_four ? ` · •••• ${c.last_four}` : ""}
                          {c.plan_tier ? ` · ${c.plan_tier}` : ""}
                        </p>
                      </div>
                      <RemoveCardButton cardId={c.id} />
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>
      ) : null}

      {tab === "search" ? <CardSearch communityName={communityLabel} /> : null}

      {tab === "requests" ? (
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <svg className="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">Incoming</h2>
                <p className="text-xs text-[var(--color-credora-slate)]">Requests on assets you own</p>
              </div>
            </div>
            <ul className="space-y-3">
              {incomingRows.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-[var(--color-credora-line)] bg-white px-6 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-credora-surface)]">
                    <svg className="h-6 w-6 text-[var(--color-credora-slate)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-credora-ink)]">No incoming requests</p>
                  <p className="mt-1 text-xs text-[var(--color-credora-slate)]">When someone wants your card, it appears here.</p>
                </li>
              ) : (
                incomingRows.map((r) => (
                  <RequestCard
                    key={r.id}
                    r={r}
                    role="owner"
                    counterpartEmail={requesterEmail[r.requester_id] ?? "Hidden"}
                    counterpartPhone={counterpartPhoneByRequestId[r.id] ?? null}
                    myPhoneVisible={r.owner_phone_visible ?? false}
                  />
                ))
              )}
            </ul>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <svg className="h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">Outgoing</h2>
                <p className="text-xs text-[var(--color-credora-slate)]">Requests you have sent</p>
              </div>
            </div>
            <ul className="space-y-3">
              {outgoingRows.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-[var(--color-credora-line)] bg-white px-6 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-credora-surface)]">
                    <svg className="h-6 w-6 text-[var(--color-credora-slate)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-credora-ink)]">No outgoing requests</p>
                  <p className="mt-1 text-xs text-[var(--color-credora-slate)]">Use Search to find a card and send a request.</p>
                </li>
              ) : (
                outgoingRows.map((r) => (
                  <RequestCard
                    key={r.id}
                    r={r}
                    role="requester"
                    counterpartEmail={ownerEmail[r.owner_id] ?? "Hidden"}
                    counterpartPhone={counterpartPhoneByRequestId[r.id] ?? null}
                    myPhoneVisible={r.requester_phone_visible ?? false}
                  />
                ))
              )}
            </ul>
          </section>
        </div>
      ) : null}
    </main>
  );
}
