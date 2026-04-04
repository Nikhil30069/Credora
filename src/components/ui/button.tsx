import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className = "", disabled, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const styles: Record<NonNullable<Props["variant"]>, string> = {
    primary:
      "bg-[var(--color-credora-accent)] text-white shadow-sm hover:bg-blue-600 focus-visible:outline-[var(--color-credora-accent)]",
    secondary:
      "border border-[var(--color-credora-line)] bg-white text-[var(--color-credora-ink)] hover:border-[var(--color-credora-accent)] focus-visible:outline-[var(--color-credora-accent)]",
    ghost: "text-[var(--color-credora-slate)] hover:bg-black/5 hover:text-[var(--color-credora-ink)] focus-visible:outline-[var(--color-credora-accent)]",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  };
  return <button type="button" className={`${base} ${styles[variant]} ${className}`} disabled={disabled} {...props} />;
}
