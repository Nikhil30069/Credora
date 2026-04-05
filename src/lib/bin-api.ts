export type BinLookupOk = {
  ok: true;
  scheme: string | null;
  type: string | null;
  brand: string | null;
  issuer: string | null;
  country: string | null;
};

export async function lookupCardBin(bin: string): Promise<BinLookupOk> {
  const res = await fetch("/api/validate-bin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bin }),
  });
  const data = (await res.json()) as BinLookupOk | { ok: false; error?: string };
  if (!data || typeof data !== "object" || !("ok" in data) || !data.ok) {
    const msg = "error" in data && typeof data.error === "string" ? data.error : "Card verification failed.";
    throw new Error(msg);
  }
  return data;
}
