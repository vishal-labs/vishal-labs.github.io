"use client";

import { useEffect, useRef, useState } from "react";
import LoomCanvas from "./LoomCanvas";
import { ArrowUpRight } from "./Icons";
import { SOURCES, sonarGeometry } from "@/lib/loom/scenes";
import { MODEL_QUADRANTS } from "@/lib/content";

// The models stage: logSonar's pixels, with each quadrant re-weaving into another model.
export default function SonarStage({ note, onActive }: { note: string; onActive?: (i: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const ext = useRef<Record<string, number>>({ quad: -1 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(-1);
  const [pinned, setPinned] = useState(-1);
  const active = hover >= 0 ? hover : pinned;
  ext.current.quad = active;

  useEffect(() => { onActive?.(active); }, [active, onActive]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const quadAt = (clientX: number, clientY: number) => {
    const el = box.current;
    if (!el) return -1;
    const r = el.getBoundingClientRect();
    const { size: s, gx0, gy0 } = sonarGeometry(r.width, r.height);
    const x = clientX - r.left - gx0, y = clientY - r.top - gy0;
    if (x < 0 || y < 0 || x > s || y > s) return -1;
    return (x < s / 2 ? 0 : 1) + (y < s / 2 ? 0 : 2);
  };

  const geo = size.w ? sonarGeometry(size.w, size.h) : null;
  const q = active >= 0 ? MODEL_QUADRANTS[active] : null;

  return (
    <figure className="stage stage-sonar">
      <div
        className="stage-box"
        ref={box}
        onPointerMove={(e) => { if (e.pointerType === "mouse") setHover(quadAt(e.clientX, e.clientY)); }}
        onPointerLeave={() => setHover(-1)}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          const hit = quadAt(e.clientX, e.clientY);
          setPinned((p) => (hit === p ? -1 : hit));
        }}
      >
        <LoomCanvas scene="models" className="stage-canvas" ext={ext} />
        {/* the three microservices are the sources themselves: their threads start where each chip ends */}
        {geo && (
          <ul className="sources" data-vertical={geo.vertical || undefined} aria-label="Log sources">
            {SOURCES.map((name, i) => {
              const p = geo.xy(geo.chipA, geo.lanes[i]);
              return (
                <li key={name} style={{ left: `${(p.x / size.w) * 100}%`, top: `${(p.y / size.h) * 100}%` }}>
                  <span className="kind">microservice</span> {name}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="sonar-controls" role="group" aria-label="Re-weave a quadrant into another model">
        {MODEL_QUADRANTS.map((m, i) => (
          <button
            key={m.id}
            type="button"
            className="quad"
            aria-pressed={pinned === i}
            data-active={active === i || undefined}
            onClick={() => setPinned((p) => (p === i ? -1 : i))}
          >
            {m.title}
          </button>
        ))}
      </div>
      <p className="sonar-readout" aria-live="polite">
        {q ? (
          <>
            <strong>{q.title}.</strong> {q.line}
            {q.href && (
              <>
                {" "}
                <a className="link" href={q.href} target="_blank" rel="noreferrer">
                  Source <ArrowUpRight />
                </a>
              </>
            )}
          </>
        ) : (
          note
        )}
      </p>
    </figure>
  );
}
