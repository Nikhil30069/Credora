"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateShareRequestStatus } from "@/actions/share-requests";
import type { ShareRequestStatus } from "@/types/database";

type Props = {
  requestId: string;
  role: "owner" | "requester";
  status: ShareRequestStatus;
};

export function RequestActions({ requestId, role, status }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status !== "pending") return null;

  function run(next: ShareRequestStatus) {
    setError(null);
    start(async () => {
      const r = await updateShareRequestStatus(requestId, next);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  if (role === "owner") {
    return (
      <div className="space-y-2 pt-1">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run("accepted")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Accept
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run("rejected")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.97] disabled:opacity-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Decline
          </button>
        </div>
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("cancelled")}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-800 active:scale-[0.97] disabled:opacity-50"
      >
        Cancel request
      </button>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
