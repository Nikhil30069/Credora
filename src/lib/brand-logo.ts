/** Map listing brand text to a hero logo in /public/brands (or null for generic). */
export function brandLogoSrc(brand: string): string | null {
  const b = brand.toLowerCase();
  if (b.includes("netflix")) return "/brands/netflix.svg";
  if (b.includes("hotstar") || b.includes("disney+") || b.includes("disney")) return "/brands/hotstar.svg";
  if (b.includes("spotify")) return "/brands/spotify.svg";
  if (b.includes("american express") || b.includes("amex") || /\bax\b/.test(b)) return "/brands/americanexpress.svg";
  if (b.includes("visa")) return "/brands/visa.svg";
  if (b.includes("prime") || b.includes("amazon")) return "/brands/prime.svg";
  return null;
}

export function popularCardTint(brand: string): string {
  const b = brand.toLowerCase();
  if (b.includes("netflix")) return "from-red-950 via-zinc-900 to-black";
  if (b.includes("hotstar") || b.includes("disney")) return "from-indigo-950 via-blue-950 to-slate-950";
  if (b.includes("spotify")) return "from-emerald-950 via-green-950 to-zinc-950";
  if (b.includes("amex") || b.includes("american express")) return "from-sky-900 via-blue-950 to-slate-950";
  if (b.includes("visa")) return "from-blue-950 via-indigo-950 to-slate-950";
  if (b.includes("prime") || b.includes("amazon")) return "from-sky-900 via-cyan-950 to-slate-950";
  return "from-violet-950 via-slate-900 to-zinc-950";
}
