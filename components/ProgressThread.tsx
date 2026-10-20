"use client";

import { useEffect, useRef } from "react";

const STOPS = [
  { id: "home", color: "var(--zari)" },
  { id: "reliability", color: "var(--sre)" },
  { id: "chains", color: "var(--web3)" },
  { id: "agents", color: "var(--ai)" },
  { id: "models", color: "var(--ai)" },
  { id: "path", color: "var(--zari)" },
  { id: "converge", color: "var(--zari)" },
];

// The thread "Follow the thread" pulls: a gold weft that fills with scroll,
// its shuttle riding the current position.
export default function ProgressThread() {
  const ticks = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      // the rail belongs to the scroll, not the loom: it appears once the hero is behind you
      root.current?.toggleAttribute("data-on", scrollY > innerHeight * 0.55);
      // orientation lives in CSS: a vertical rail on desktop, a weft under the nav on phones
      root.current?.style.setProperty("--p", String(p));
      const items = ticks.current?.children;
      if (items) {
        STOPS.forEach((s, i) => {
          const el = document.getElementById(s.id);
          if (!el || max <= 0) return;
          // the scroll position at which this section reaches the top of the screen
          const at = Math.min(1, (el.getBoundingClientRect().top + scrollY) / max);
          (items[i] as HTMLElement).style.setProperty("--at", String(at));
        });
      }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    const ro = new ResizeObserver(on);
    ro.observe(document.body);
    return () => {
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="progress-thread" aria-hidden="true" ref={root}>
      <div className="pt-track" />
      <div className="pt-fill" />
      <div className="pt-ticks" ref={ticks}>
        {STOPS.map((s) => (
          <span key={s.id} style={{ background: s.color }} />
        ))}
      </div>
      <div className="pt-shuttle" />
    </div>
  );
}
