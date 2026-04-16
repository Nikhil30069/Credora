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
      <mark key={i} className="rounded bg-blue-100 px-0.5 text-blue-900">{p}</mark>
    ) : p,
  );
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
    <div className="flex animate-pulse gap-4 px-6 py-4">
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-40 rounded-md bg-[var(--color-credora-mist)]" />
        <div className="h-3.5 w-56 rounded-md bg-[var(--color-credora-mist)]" />
      </div>
      <div className="h-8 w-24 rounded-full bg-[var(--color-credora-mist)]" />
    </div>
  );
}

function PopularCard({
  item,
  delay,
  onSearch,
}: {
  item: PopularItem;
  delay: number;
  onSearch: (q: string) => void;
}) {
  const logo = brandLogoSrc(item.brand);
  const tint = popularCardTint(item.brand);
  const title = item.nickname?.trim() || `${item.brand}${item.plan_tier ? ` ${item.plan_tier}` : ""}`;
  const meta = ASSET_META[(item.asset_type ?? "other") as AssetType] ?? ASSET_META.other;
  const label = `${meta.icon} ${item.nickname} · ${item.brand}${item.plan_tier ? ` · ${item.plan_tier}` : ""}${item.last_four ? ` · •••• ${item.last_four}` : ""}`;

  return (
    <div
      className="group relative min-w-[220px] max-w-[220px] flex-[0_0_auto] cursor-pointer animate-slide-up rounded-2xl shadow-lg ring-1 ring-black/5 motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onSearch(item.brand)}
    >
      {/* background */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${tint}`} />
      {/* blurred logo bg */}
      {logo && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <Image
            src={logo}
            alt=""
            width={200}
            height={200}
            unoptimized
            className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-20 blur-2xl"
          />
        </div>
      )}
      {/* bottom fade */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="relative flex h-[148px] flex-col justify-between p-4">
        {/* top: logo icon + request button */}
        <div className="flex items-start justify-between gap-2">
          {logo ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 p-1.5 shadow-sm ring-1 ring-black/5 transition-transform group-hover:scale-105">
              <Image src={logo} alt="" width={28} height={28} unoptimized className="h-6 w-6 object-contain" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-base font-bold text-white">
              {item.brand.charAt(0).toUpperCase()}
            </div>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <ShareRequestDialog
              cardId={item.id}
              label={label}
              triggerVariant="secondary"
              triggerClassName="!py-1 !px-3 !text-xs !bg-white/90 !text-[var(--color-credora-ink)] hover:!bg-white"
            />
          </div>
        </div>

        {/* bottom: title + sharers */}
        <div>
          <p className="text-[15px] font-bold leading-snug text-white drop-shadow">{title}</p>
          <p className="mt-1 text-xs text-white/70">
            · Shared by {item.sharers_count} member{item.sharers_count === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CardSearch({ communityName }: { communityName: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [popular, setPopular] = useState<PopularItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: controller.signal });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (!controller.signal.aborted) setResults(json.results ?? []);
    } catch {
      if (!controller.signal.aborted) setResults([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/popular");
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) {
          setPopular(
            (json.items ?? []).map((row: Record<string, unknown>) => ({
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
    return () => { cancelled = true; };
  }, []);

  const onSearch = useCallback((q: string) => {
    setQuery(q);
    inputRef.current?.focus();
  }, []);

  const showPopular = !searched && !loading && query.trim().length < 2;

  return (
    <section className="mt-10 space-y-8">

      {/* ── Search bar ── */}
      <div className="mx-auto max-w-2xl">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <svg className="h-5 w-5 text-[var(--color-credora-slate)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for cards, subscriptions, or owner name..."
            className="w-full rounded-2xl border border-[var(--color-credora-line)] bg-white py-4 pl-12 pr-12 text-[15px] shadow-sm outline-none transition placeholder:text-[var(--color-credora-slate)] focus:border-[var(--color-credora-accent)] focus:ring-4 focus:ring-[var(--color-credora-accent-soft)]"
          />
          {loading && (
            <div className="absolute inset-y-0 right-4 flex items-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-credora-accent)] border-t-transparent" />
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-sm text-[var(--color-credora-slate)]">
          Find what you need from colleagues you trust.
        </p>
      </div>

      {/* ── Popular ── */}
      {showPopular && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[var(--color-credora-ink)]">
            Popular in {communityName}
          </h2>

          {popularLoading && (
            <div className="flex gap-4 overflow-x-auto pb-1">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-[148px] min-w-[220px] animate-pulse rounded-2xl bg-[var(--color-credora-mist)]" />
              ))}
            </div>
          )}

          {!popularLoading && popular.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
              {popular.map((item, i) => (
                <PopularCard key={item.id} item={item} delay={60 + i * 60} onSearch={onSearch} />
              ))}
            </div>
          )}

          {!popularLoading && popular.length === 0 && (
            <p className="text-sm text-[var(--color-credora-slate)]">
              No shared assets yet — try searching or ask teammates to add listings.
            </p>
          )}
        </div>
      )}

      {/* ── Skeleton while typing ── */}
      {loading && results.length === 0 && searched && (
        <div className="divide-y divide-[var(--color-credora-line)] rounded-2xl border border-[var(--color-credora-line)] bg-white shadow-sm">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* ── No results ── */}
      {searched && !loading && results.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--color-credora-slate)]">
          No assets match <span className="font-semibold text-[var(--color-credora-ink)]">&ldquo;{query}&rdquo;</span>.
        </p>
      )}

      {/* ── Results ── */}
      {results.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-credora-line)] bg-white shadow-sm animate-slide-up">
          <div className="flex items-center justify-between border-b border-[var(--color-credora-line)] px-6 py-3">
            <p className="text-sm font-semibold text-[var(--color-credora-ink)]">Results</p>
            <p className="text-xs tabular-nums text-[var(--color-credora-slate)]">
              {results.length} asset{results.length !== 1 ? "s" : ""}
            </p>
          </div>
          <ul className="divide-y divide-[var(--color-credora-line)]">
            {results.map((c) => {
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
                      <p className="font-semibold text-[var(--color-credora-ink)]">
                        {highlightMatch(c.nickname, query)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-credora-slate)]">{assetSubtitle(c, query)}</p>
                    {c.owner_name && (
                      <p className="mt-1 text-xs text-[var(--color-credora-slate)]">
                        Listed by <span className="font-medium text-[var(--color-credora-ink)]">{c.owner_name}</span>
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <ShareRequestDialog cardId={c.id} label={label} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
