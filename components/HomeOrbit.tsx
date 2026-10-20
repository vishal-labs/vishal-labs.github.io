"use client";

import { useEffect, useRef } from "react";
import LoomCanvas from "./LoomCanvas";
import { homeOrbit } from "@/lib/loom/scenes";
import { HOME } from "@/lib/content";

// My VMs orbiting me. The canvas draws the cubes; these chips ride on top of them,
// on the same clock, so names stay crisp and change as each cube comes round.
export default function HomeOrbit() {
  const box = useRef<HTMLDivElement>(null);
  const chips = useRef<(HTMLLIElement | null)[]>([]);
  const names = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = false;
    let raf = 0;
    const place = (t: number) => {
      const r = el.getBoundingClientRect();
      const o = homeOrbit(t, r.width, r.height, reduced);
      for (const it of o.items) {
        const chip = chips.current[it.i];
        const name = names.current[it.i];
        if (!chip || !name) continue;
        const depth = (it.z + 1) / 2;
        const lift = (o.cube * it.scale) * 0.95 + 14;
        // keep every chip inside the stage, even at the ring's widest points
        const half = chip.offsetWidth / 2 + 6;
        const x = Math.min(r.width - half, Math.max(half, it.x));
        chip.style.transform = `translate(${x}px, ${it.y - lift}px) translate(-50%, -100%) scale(${0.82 + 0.18 * depth})`;
        chip.style.opacity = String(0.55 + 0.45 * depth);
        chip.style.zIndex = String(Math.round(depth * 10));
        if (name.textContent !== it.label) name.textContent = it.label;
      }
    };
    const loop = (t: number) => {
      raf = 0;
      if (!visible) return;
      place(t);
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (reduced) place(0);
      else if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(el);
    const ro = new ResizeObserver(() => place(reduced ? 0 : performance.now()));
    ro.observe(el);
    return () => { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  return (
    <figure className="stage stage-home">
      <div className="stage-box" ref={box}>
        <LoomCanvas scene="home" className="stage-canvas" />
        <ul className="orbit-chips" aria-label="Services I self-host">
          {HOME.orbit.map((o, i) => (
            <li key={i} ref={(n) => { chips.current[i] = n; }}>
              <span className="svc" ref={(n) => { names.current[i] = n; }}>{o.services[0]}</span>
              <span className="vm">{o.vm}</span>
            </li>
          ))}
        </ul>
        <span className="orbit-me">me</span>
      </div>
      <figcaption>
        {HOME.stageNote}
        <span className="sr-only"> Services shown: {HOME.orbit.flatMap((o) => o.services).join(", ")}.</span>
      </figcaption>
    </figure>
  );
}
