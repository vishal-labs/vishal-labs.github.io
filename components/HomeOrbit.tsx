"use client";

import { useEffect, useRef } from "react";
import LoomCanvas from "./LoomCanvas";
import { homeOrbit } from "@/lib/loom/scenes";
import { HOME } from "@/lib/content";

const TONE_CLASS = { sre: "t-sre", ai: "t-ai", bone: "t-bone" } as const;
const SERVICES = HOME.rings.flatMap((ring, ri) => ring.services.map((svc) => ({ svc, ri, tone: ring.tone })));

// Three rings of services orbiting me. The canvas draws the cubes; these chips ride on top
// of them, on the same clock, so names stay crisp. One ring is named per lap, only while
// the rings turn slowly, and a chip that would touch another label simply waits its turn.
export default function HomeOrbit() {
  const box = useRef<HTMLDivElement>(null);
  const me = useRef<HTMLSpanElement>(null);
  const chips = useRef<(HTMLLIElement | null)[]>([]);
  const keys = useRef<(HTMLLIElement | null)[]>([]);
  const ext = useRef<Record<string, number>>({});

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = false;
    let raf = 0;
    const place = (now: number) => {
      const r = el.getBoundingClientRect();
      const o = homeOrbit(now - (ext.current.t0 ?? 0), r.width, r.height, reduced);
      const m = me.current;
      // me, with room to spare: a label still fading out must not slide under it
      const pad = o.tall ? 12 : 22;
      const taken = m ? [{ l: m.offsetLeft - m.offsetWidth / 2 - pad, t: m.offsetTop - m.offsetHeight / 2 - pad, r: m.offsetLeft + m.offsetWidth / 2 + pad, b: m.offsetTop + m.offsetHeight / 2 + pad }] : [];
      // nearest first, so the label in front wins any tie
      for (const it of [...o.items].sort((a, b) => b.z - a.z)) {
        const chip = chips.current[it.i];
        if (!chip) continue;
        const s = 0.84 + 0.16 * it.depth;
        const cw = chip.offsetWidth * s, ch = chip.offsetHeight * s;
        const lift = o.cube * it.scale * 0.9 + 10;
        const x = Math.min(r.width - cw / 2 - 6, Math.max(cw / 2 + 6, it.x));
        const y = it.y - lift;
        const box2 = { l: x - cw / 2 - 4, t: y - ch - 4, r: x + cw / 2 + 4, b: y + 4 };
        const free = taken.every((q) => box2.r <= q.l || box2.l >= q.r || box2.b <= q.t || box2.t >= q.b);
        const show = it.ring === o.named && o.names > 0 && it.depth > 0.3 && free && y - ch > 4;
        if (show) taken.push(box2);
        chip.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${s})`;
        chip.style.opacity = show ? String(o.names * (0.6 + 0.4 * it.depth)) : "0";
        chip.style.zIndex = String(Math.round(it.depth * 10));
      }
      keys.current.forEach((k, ri) => {
        if (!k) return;
        const on = ri === o.named && o.names > 0.5;
        if (on !== (k.dataset.on === "1")) k.dataset.on = on ? "1" : "0";
      });
    };
    const loop = (t: number) => {
      raf = 0;
      if (!visible) return;
      place(t);
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      // the cycle starts, at rest and named, the first time the stage is seen
      if (visible && ext.current.t0 === undefined) ext.current.t0 = performance.now();
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
        <LoomCanvas scene="home" className="stage-canvas" ext={ext} />
        <ul className="orbit-chips" aria-hidden="true">
          {SERVICES.map((s, i) => (
            <li key={s.svc} className={`ring-${s.tone}`} ref={(n) => { chips.current[i] = n; }}>
              {s.svc}
            </li>
          ))}
        </ul>
        <span className="orbit-me" ref={me}>me</span>
      </div>
      <ul className="orbit-rings" aria-label="Services I self-host, ring by ring">
        {HOME.rings.map((ring, ri) => (
          <li key={ring.id} className={TONE_CLASS[ring.tone]} ref={(n) => { keys.current[ri] = n; }}>
            <span className="swatch" aria-hidden="true" />
            {ring.name}
            <span className="sr-only">: {ring.services.join(", ")}</span>
          </li>
        ))}
      </ul>
      <figcaption>{HOME.stageNote}</figcaption>
    </figure>
  );
}
