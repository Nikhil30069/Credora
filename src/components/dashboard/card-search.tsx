"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShareRequestDialog } from "./share-request-dialog";
import { brandLogoSrc, popularCardTint } from "@/lib/brand-logo";
import { ASSET_META, type AssetType } from "@/types/database";

type SearchResult = {
  id: string;
  owner_id: string;
  asset_type: AssetType;
  brand: string;
  last_four: string | null;
  nickname: string;
  issuer: string | null;
  plan_tier: string | null;
  created_at: string;
  rank: number;
  owner_name?: string;
};

type PopularItem = {
  id: string;
  owner_id: string;
  asset_type: string;
  brand: string;
  last_four: string | null;
  nickname: string;
  issuer: string | null;
  plan_tier: string | null;
  sharers_count: number;
};

function highlightMatch(text: string, query: string) {
  if (!query || query.length < 2) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? (
      <mark key={i} className="rounded bg-blue-100 px-0.5 text-blue-900">
        {p}
      </mark>
    ) : (
      p
    ),
  );
}

function relevanceBadge(rank: number) {
  if (rank >= 0.5) return { label: "Exact", cls: "bg-emerald-100 text-emerald-800 ring-emerald-200" };
  if (rank >= 0.25) return { label: "Strong", cls: "bg-blue-100 text-blue-800 ring-blue-200" };
  if (rank >= 0.12) return { label: "Partial", cls: "bg-amber-100 text-amber-800 ring-amber-200" };
  return { label: "Fuzzy", cls: "bg-zinc-100 text-zinc-600 ring-zinc-200" };
}

function assetSubtitle(c: SearchResult, query: string) {
  const parts: React.ReactNode[] = [];
  if (c.asset_type === "credit_card") {
    parts.push(highlightMatch(c.brand, query));
    if (c.issuer) parts.push(<> · {highlightMatch(c.issuer, query)}</>);
    if (c.last_four) parts.push(<> · •••• {c.last_four}</>);
  } else {
    parts.push(highlightMatch(c.brand, query));
    if (c.plan_tier) parts.push(<> · {highlightMatch(c.plan_tier, query)}</>);
  }
  return parts;
}

function SkeletonCard() {
  return (
    <div className="flex animate-pulse items-center gap-4 px-6 py-4">
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-40 rounded-md bg-[var(--color-credora-mist)]" />
        <div className="h-3.5 w-56 rounded-md bg-[var(--color-credora-mist)]" />
      </div>
      <div className="h-8 w-28 rounded-full bg-[var(--color-credora-mist)]" />
    </div>
  );
}

function PopularAssetCard({
  item,
  styleDelay,
  onPickSearch,
}: {
  item: PopularItem;
  styleDelay: number;
  onPickSearch: (q: string) => void;
}) {
  const logo = brandLogoSrc(item.brand);
  const tint = popularCardTint(item.brand);
  const title = item.nickname?.trim() || `${item.brand}${item.plan_tier ? ` ${item.plan_tier}` : ""}`;
  const meta = ASSET_META[(item.asset_type ?? "other") as AssetType] ?? ASSET_META.other;
  const label = `${meta.icon} ${item.nickname} · ${item.brand}${item.plan_tier ? ` · ${item.plan_tier}` : ""}${item.last_four ? ` · •••• ${item.last_four}` : ""}`;

  return (
    <div
      className="group relative min-w-[min(100%,280px)] max-w-[280px] flex-[0_0_auto] animate-slide-up rounded-2xl shadow-lg ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:animate-none motion-reduce:transition-none"
      style={{ animationDelay: `${styleDelay}ms` }}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${tint}`} />
      {logo ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <Image
            src={logo}
            alt=""
            width={200}
            height={200}
            unoptimized
            className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 scale-125 object-contain opacity-[0.22] blur-2xl saturate-150"
          />
        </div>
      ) : null}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/85 via-black/45 to-black/25" />

      <div className="relative flex h-[148px] flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          {logo ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-md ring-1 ring-black/5 transition group-hover:scale-105">
              <Image src={logo} alt="" width={32} height={32} unoptimized className="h-7 w-7 object-contain" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold text-white ring-1 ring-white/30">
              {item.brand.charAt(0).toUpperCase()}
            </div>
          )}
          <ShareRequestDialog
            cardId={item.id}
            label={label}
            triggerVariant="secondary"
            triggerClassName="!shadow-md !ring-1 !ring-black/5"
          />
        </div>
        <div>
          <p className="line-clamp-2 text-[15px] font-bold leading-snug text-white drop-shadow-sm">{title}</p>
          <button
            type="button"
            onClick={() => onPickSearch(item.brand)}
            className="mt-1.5 text-left text-xs font-medium text-white/80 transition hover:text-white"
          >
            · Shared by {item.sharers_count} member{item.sharers_count === 1 ? "" : "s"}
            <span className="text-white/50"> — filter search</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const TRY_TERMS = ["Netflix", "Spotify", "American Express", "Disney", "Visa"];

export function CardSearch({ communityName }: { communityName: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [popular, setPopular] = useState<PopularItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    abortRef.current?.abort();
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (!controller.signal.aborted) {
        setResults(json.results ?? []);
      }
    } catch {
      if (!controller.signal.aborted) setResults([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/popular");
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) {
          const raw = json.items ?? [];
          setPopular(
            raw.map((row: Record<string, unknown>) => ({
              id: String(row.id),
              owner_id: String(row.owner_id),
              asset_type: String(row.asset_type ?? "other"),
              brand: String(row.brand ?? ""),
              last_four: row.last_four != null ? String(row.last_four) : null,
              nickname: String(row.nickname ?? ""),
              issuer: row.issuer != null ? String(row.issuer) : null,
              plan_tier: row.plan_tier != null ? String(row.plan_tier) : null,
              sharers_count: Number(row.sharers_count ?? 0),
            })),
          );
        }
      } catch {
        if (!cancelled) setPopular([]);
      } finally {
        if (!cancelled) setPopularLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onPickSearch = useCallback((q: string) => {
    setQuery(q);
    searchInputRef.current?.focus();
  }, []);

  const showDiscover = !searched && !loading && query.trim().length < 2;

  return (
    <section className="mt-8 space-y-10">
      <div className="mx-auto max-w-3xl animate-fade-in text-center">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center">
            <svg className="h-5 w-5 text-[var(--color-credora-slate)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            id="card-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for cards, subscriptions, or owner name…"
            className="w-full rounded-2xl border border-[var(--color-credora-line)] bg-white py-4 pl-14 pr-12 text-base shadow-sm outline-none transition placeholder:text-[var(--color-credora-slate)] focus:border-[var(--color-credora-accent)] focus:ring-4 focus:ring-[var(--color-credora-accent-soft)]"
          />
          {loading ? (
            <div className="absolute inset-y-0 right-5 flex items-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-credora-accent)] border-t-transparent" />
            </div>
          ) : null}
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--color-credora-slate)]">
          Find what you need from colleagues you trust.
        </p>
        <p className="mt-2 text-xs text-[var(--color-credora-slate)]/90">
          Type at least 2 characters. Results are ranked by relevance.
        </p>
      </div>

      {showDiscover ? (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--color-credora-ink)]">
              Popular in {communityName}
            </h2>
            {popularLoading ? (
              <span className="text-xs text-[var(--color-credora-slate)]">Loading…</span>
            ) : null}
          </div>

          {!popularLoading && popular.length > 0 ? (
            <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin px-1">
              {popular.map((item, i) => (
                <PopularAssetCard key={item.id} item={item} styleDelay={80 + i * 70} onPickSearch={onPickSearch} />
              ))}
            </div>
          ) : null}

          {!popularLoading && popular.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-credora-line)] bg-white/80 px-6 py-10 text-center">
              <p className="text-sm font-medium text-[var(--color-credora-ink)]">Your community is just getting started</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-credora-slate)]">
                No pooled listings yet. Try a quick search — or ask teammates to add what they can share.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {TRY_TERMS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onPickSearch(t)}
                    className="rounded-full border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-credora-ink)] transition hover:border-[var(--color-credora-accent)] hover:bg-white"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading && results.length === 0 && searched ? (
        <div className="divide-y divide-[var(--color-credora-line)] rounded-2xl border border-[var(--color-credora-line)] bg-white shadow-sm">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {searched && !loading && results.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-credora-line)] bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-[var(--color-credora-slate)]">
            No assets match <span className="font-semibold text-[var(--color-credora-ink)]">&ldquo;{query}&rdquo;</span>.
            Try a different name or category.
          </p>
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="rounded-2xl border border-[var(--color-credora-line)] bg-white shadow-sm animate-slide-up">
          <div className="border-b border-[var(--color-credora-line)] px-6 py-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold text-[var(--color-credora-ink)]">Results</h2>
              <span className="text-xs tabular-nums text-[var(--color-credora-slate)]">
                {results.length} asset{results.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
              Ranked by relevance to <span className="font-medium text-[var(--color-credora-ink)]">&ldquo;{query}&rdquo;</span>
            </p>
          </div>
          <ul className="divide-y divide-[var(--color-credora-line)]">
            {results.map((c) => {
              const badge = relevanceBadge(c.rank);
              const meta = ASSET_META[c.asset_type] ?? ASSET_META.other;
              const label = `${meta.icon} ${c.nickname} · ${c.brand}${c.plan_tier ? ` · ${c.plan_tier}` : ""}${c.last_four ? ` · •••• ${c.last_four}` : ""}`;
              return (
                <li
                  key={c.id}
                  className="flex flex-col gap-3 px-6 py-4 transition hover:bg-[var(--color-credora-surface)]/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                      <p className="font-semibold text-[var(--color-credora-ink)]">{highlightMatch(c.nickname, query)}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-credora-slate)]">{assetSubtitle(c, query)}</p>
                    {c.owner_name ? (
                      <p className="mt-1 text-xs text-[var(--color-credora-slate)]">
                        Listed by <span className="font-medium text-[var(--color-credora-ink)]">{c.owner_name}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    <ShareRequestDialog cardId={c.id} label={label} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
