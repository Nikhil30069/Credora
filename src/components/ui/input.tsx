import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ id, label, hint, className = "", ...props }: Props) {
  const inputId = id ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-[var(--color-credora-ink)]">{label}</span>
      <input
        id={inputId}
        className={`w-full rounded-xl border border-[var(--color-credora-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-credora-ink)] shadow-sm outline-none transition placeholder:text-[var(--color-credora-slate)] focus:border-[var(--color-credora-accent)] focus:ring-2 focus:ring-[var(--color-credora-accent-soft)] ${className}`}
        {...props}
      />
      {hint ? <span className="text-xs text-[var(--color-credora-slate)]">{hint}</span> : null}
    </label>
  );
}
