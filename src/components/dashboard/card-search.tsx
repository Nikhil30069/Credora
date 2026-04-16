"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShareRequestDialog } from "./share-request-dialog";
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

export function CardSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <section className="mt-10 space-y-6">
      <div className="rounded-2xl border border-[var(--color-credora-line)] bg-white p-5 shadow-sm">
        <label htmlFor="card-search" className="block text-sm font-medium text-[var(--color-credora-ink)]">
          Search by card, subscription, or owner name
        </label>
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
            <svg className="h-4 w-4 text-[var(--color-credora-slate)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            id="card-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Netflix, Amex, HDFC, Spotify Premium…"
            className="w-full rounded-xl border border-[var(--color-credora-line)] bg-[var(--color-credora-surface)] py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-[var(--color-credora-slate)] focus:border-[var(--color-credora-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--color-credora-accent-soft)]"
          />
          {loading ? (
            <div className="absolute inset-y-0 right-3.5 flex items-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-credora-accent)] border-t-transparent" />
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-[var(--color-credora-slate)]">
          Type at least 2 characters. Results rank by relevance — exact matches first.
        </p>
      </div>

      {!searched && !loading ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-credora-line)] bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-credora-accent-soft)]">
            <svg className="h-7 w-7 text-[var(--color-credora-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[var(--color-credora-ink)]">Discover assets in your community</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--color-credora-slate)]">
            Search for credit cards, subscriptions, or anything your community members have listed. Try &ldquo;Netflix&rdquo;, &ldquo;Visa&rdquo;, or &ldquo;Spotify&rdquo;.
          </p>
        </div>
      ) : null}

      {loading && results.length === 0 ? (
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
        <div className="rounded-2xl border border-[var(--color-credora-line)] bg-white shadow-sm">
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
                      <p className="font-semibold text-[var(--color-credora-ink)]">
                        {highlightMatch(c.nickname, query)}
                      </p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-credora-slate)]">
                      {assetSubtitle(c, query)}
                    </p>
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
