export function profileNeedsBasics(row: { full_name: string | null; phone: string | null } | null) {
  if (!row) return true;
  const nameOk = (row.full_name ?? "").trim().length >= 2;
  const digits = (row.phone ?? "").replace(/\D/g, "");
  const phoneOk = digits.length >= 10 && digits.length <= 15;
  return !(nameOk && phoneOk);
}
