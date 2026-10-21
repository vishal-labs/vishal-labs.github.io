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

// a speaker; when off, a square-capped cross stands where the sound would be
export function Speaker({ className, on }: P & { on: boolean }) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 6v4h3l4 3V3l-4 3z" />
      {on ? <path d="M12 5.5c1 1.4 1 3.6 0 5" /> : <path d="M11.5 6.5l3 3m0-3-3 3" />}
    </svg>
  );
}
