import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {/* Tab bar skeleton */}
      <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 border-b border-[var(--color-credora-line)] pb-3 sm:gap-x-14">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 pb-3">
            <div className="h-4 w-4 rounded bg-[var(--color-credora-mist)]" />
            <div className="h-4 w-16 rounded bg-[var(--color-credora-mist)]" />
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-4">
        <div className="h-9 w-56 max-w-full animate-pulse rounded-lg bg-[var(--color-credora-mist)]" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-[var(--color-credora-mist)]" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-credora-mist)]" />
          <div className="h-48 animate-pulse rounded-2xl bg-[var(--color-credora-mist)]" />
        </div>
        <p className="flex items-center justify-center gap-2 pt-4 text-xs text-[var(--color-credora-slate)]">
          <Spinner className="size-4 border-[var(--color-credora-slate)]/40 border-t-[var(--color-credora-accent)]" />
          Loading…
        </p>
      </div>
    </main>
  );
}
