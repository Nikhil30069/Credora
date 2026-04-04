"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateShareRequestStatus } from "@/actions/share-requests";
import type { ShareRequestStatus } from "@/types/database";
import { Button } from "@/components/ui/button";

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
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            className="!py-1.5 !text-xs"
            disabled={pending}
            onClick={() => run("accepted")}
          >
            Accept
          </Button>
          <Button
            variant="secondary"
            className="!py-1.5 !text-xs"
            disabled={pending}
            onClick={() => run("rejected")}
          >
            Decline
          </Button>
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="ghost" className="!py-1.5 !text-xs" disabled={pending} onClick={() => run("cancelled")}>
        Cancel request
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
