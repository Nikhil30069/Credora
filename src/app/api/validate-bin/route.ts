import { NextResponse } from "next/server";

export type ValidateBinSuccess = {
  ok: true;
  scheme: string | null;
  type: string | null;
  brand: string | null;
  issuer: string | null;
  country: string | null;
};

export type ValidateBinError = {
  ok: false;
  error: string;
};

type BinlistPayload = {
  scheme?: string | null;
  type?: string | null;
  brand?: string | null;
  bank?: { name?: string | null } | null;
  country?: { alpha2?: string | null; name?: string | null } | null;
};

function normalizeBin(input: unknown) {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 8) return null;
  return digits.slice(0, 8);
}

/**
 * Uses the community BINlist API (https://binlist.net/) — validates issuer/range, not ownership.
 * Set BIN_LOOKUP_USER_AGENT in env to a string that includes contact info if you make many requests.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." } satisfies ValidateBinError, { status: 400 });
  }

  const raw = typeof body === "object" && body !== null && "bin" in body ? (body as { bin?: unknown }).bin : undefined;
  const bin = normalizeBin(raw);
  if (!bin) {
    return NextResponse.json(
      { ok: false, error: "Enter the first 6–8 digits on your card (Bank Identification Number)." } satisfies ValidateBinError,
      { status: 400 },
    );
  }

  const ua =
    process.env.BIN_LOOKUP_USER_AGENT?.trim() ||
    "Credora/1.0 (https://github.com/credora; card-BIN verification at signup)";

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);

  let res: Response;
  try {
    res = await fetch(`https://lookup.binlist.net/${bin}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": ua,
      },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    clearTimeout(t);
    return NextResponse.json(
      { ok: false, error: "Could not reach the card directory. Check your connection and try again." } satisfies ValidateBinError,
      { status: 502 },
    );
  } finally {
    clearTimeout(t);
  }

  if (res.status === 404) {
    return NextResponse.json(
      { ok: false, error: "That BIN is not recognized. Check the digits or try another card." } satisfies ValidateBinError,
      { status: 422 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: "Card lookup service is busy. Please try again in a moment." } satisfies ValidateBinError,
      { status: 503 },
    );
  }

  let data: BinlistPayload;
  try {
    data = (await res.json()) as BinlistPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected response from card directory." } satisfies ValidateBinError, {
      status: 502,
    });
  }

  const scheme = (data.scheme ?? "").trim();
  if (!scheme) {
    return NextResponse.json(
      { ok: false, error: "Could not determine card network from this BIN. Check the digits or try another card." } satisfies ValidateBinError,
      { status: 422 },
    );
  }

  const type = (data.type ?? "").toLowerCase();
  if (type === "debit") {
    return NextResponse.json(
      { ok: false, error: "This range is registered as a debit card. Credora is for credit cards only." } satisfies ValidateBinError,
      { status: 422 },
    );
  }

  if (type && type !== "credit") {
    return NextResponse.json(
      { ok: false, error: "We could not confirm a standard credit card for this BIN. Please use a credit card." } satisfies ValidateBinError,
      { status: 422 },
    );
  }

  const issuer = data.bank?.name?.trim() || null;
  const country = data.country?.alpha2?.trim() || data.country?.name?.trim() || null;

  return NextResponse.json({
    ok: true,
    scheme: data.scheme?.trim() ?? null,
    type: data.type?.trim() ?? null,
    brand: data.brand?.trim() ?? null,
    issuer,
    country,
  } satisfies ValidateBinSuccess);
}
