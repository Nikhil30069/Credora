import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
};

export function SelectField({ id, label, hint, className = "", children, ...props }: Props) {
  const selectId = id ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="block space-y-1.5" htmlFor={selectId}>
      <span className="text-sm font-medium text-[var(--color-credora-ink)]">{label}</span>
      <select
        id={selectId}
        className={`w-full rounded-xl border border-[var(--color-credora-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-credora-ink)] shadow-sm outline-none transition focus:border-[var(--color-credora-accent)] focus:ring-2 focus:ring-[var(--color-credora-accent-soft)] ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint ? <span className="text-xs text-[var(--color-credora-slate)]">{hint}</span> : null}
    </label>
  );
}
