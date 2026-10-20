// Authored icons: square caps and mitred joins, drawn on the same 16px grid as the warp.
type P = { className?: string };

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  "aria-hidden": true,
};

export function ArrowUpRight({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 11.5 11 5M5.5 4.5h6v6" />
    </svg>
  );
}

export function ArrowDown({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M8 2.5v10M3.5 8.5 8 13l4.5-4.5" />
    </svg>
  );
}
