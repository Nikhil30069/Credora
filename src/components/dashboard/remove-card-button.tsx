"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeCard } from "@/actions/cards";
import { Button } from "@/components/ui/button";

export function RemoveCardButton({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="danger"
      className="!py-1.5 !text-xs"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await removeCard(cardId);
          if (r.ok) router.refresh();
        })
      }
    >
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}
