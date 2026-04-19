/** Small inline spinner for buttons and compact loading states. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-90 ${className}`}
      aria-hidden
    />
  );
}
