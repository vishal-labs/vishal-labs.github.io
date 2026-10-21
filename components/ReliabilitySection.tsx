"use client";

import { useEffect, useRef, useState } from "react";
import LoomCanvas from "./LoomCanvas";
import Ledger from "./Ledger";
import { XDP_RULES, packetGeometry } from "@/lib/loom/scenes";
import { RELIABILITY_ZONES, type DOMAINS } from "@/lib/content";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

// Reliability: the XDP packet path. Each stage of the path swaps the copy column.
export default function ReliabilitySection({ d }: { d: (typeof DOMAINS)[number] }) {
  const box = useRef<HTMLDivElement>(null);
  const ext = useRef<Record<string, number>>({ zone: -1, screened: 0, dropped: 0, upward: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(-1);
  const [pinned, setPinned] = useState(-1);
  const [counts, setCounts] = useState({ screened: 0, dropped: 0, upward: 0 });
  // which pattern tabs just caught something, and whether prometheus is alerting
  const [hits, setHits] = useState<boolean[]>([false, false, false, false]);
  const [alert, setAlert] = useState(false);
  const active = hover >= 0 ? hover : pinned;
  ext.current.zone = active;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    // the counters print themselves a few times a second, in place; the tabs and the alert
    // follow the scene's own clock
    const id = setInterval(() => {
      const e = ext.current;
      setCounts((c) => (c.screened === e.screened && c.dropped === e.dropped && c.upward === e.upward ? c : { screened: e.screened ?? 0, dropped: e.dropped ?? 0, upward: e.upward ?? 0 }));
      const now = e.clock ?? 0;
      const next = XDP_RULES.map((_, i) => now - (e[`hit${i}`] ?? -1e9) < 650);
      setHits((h) => (h.every((v, i) => v === next[i]) ? h : next));
      setAlert(!!e.alert);
    }, 120);
    return () => { ro.disconnect(); clearInterval(id); };
  }, []);

  const geo = size.w ? packetGeometry(size.w, size.h) : null;
  const zone = active >= 0 ? RELIABILITY_ZONES[active] : null;
  const pctRect = (z: { x: number; y: number; w: number; h: number }) => ({
    left: `${(z.x / size.w) * 100}%`, top: `${(z.y / size.h) * 100}%`,
    width: `${(z.w / size.w) * 100}%`, height: `${(z.h / size.h) * 100}%`,
  });
  const at = (a: number, b: number) => {
    const p = geo!.map(a, b);
    return { left: `${(p.x / size.w) * 100}%`, top: `${(p.y / size.h) * 100}%` };
  };

  return (
    <section id={d.id} className={`domain d-${d.domain}`} aria-labelledby={`${d.id}-title`}>
      <div className="split">
        <div className="copy">
          <h2 id={`${d.id}-title`}>{d.title}</h2>
          <div className="copy-swap" key={active}>
            <p className="takeaway">{zone ? zone.lede : d.lede}</p>
            {(zone ? zone.body : d.body).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="bridge">
            {d.bridge.before}
            <a className={`t-${d.bridge.tone}`} href={d.bridge.to}>{d.bridge.link}</a>
            {d.bridge.after}
          </p>
        </div>
        <figure className="stage stage-packets">
          <div className="stage-box" ref={box} data-vertical={geo?.vertical || undefined} onMouseLeave={() => setHover(-1)}>
            <LoomCanvas scene="reliability" className="stage-canvas" ext={ext} />
            {geo && (
              <>
                <span className="path-label" style={at(...geo.L.labels.internet)}>internet</span>
                <span className="path-label" style={at(...geo.L.labels.nic)}>NIC</span>
                <span className="path-label drop" style={at(...geo.L.labels.drop)}>dropped<span className="long"> in kernel</span></span>
                {/* the four patterns XDP screens for; the one that catches an attack lights */}
                <ul className="xdp-rules" style={pctRect(geo.rules)} aria-label="Patterns screened in the kernel">
                  {XDP_RULES.map((rule, i) => (
                    <li key={rule} data-hit={hits[i] || undefined}>{rule}</li>
                  ))}
                </ul>
                {RELIABILITY_ZONES.map((z, i) => (
                  <div key={z.id} className="zone" style={pctRect(geo.zones[z.id as "xdp" | "ml" | "tls" | "metrics"])} onMouseEnter={() => setHover(i)}>
                    <button
                      type="button"
                      className={`zone-chip z-${z.id}`}
                      aria-pressed={pinned === i}
                      data-active={active === i || undefined}
                      data-alert={(z.id === "metrics" && alert) || undefined}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(-1)}
                      onClick={() => setPinned((p) => (p === i ? -1 : i))}
                    >
                      {z.title}
                      {z.id === "metrics" && alert && <span className="alert"> · alert</span>}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
          <p className="packet-counters" aria-label="Synthetic traffic counters">
            <span><i className="sw sw-seen" aria-hidden="true" /><strong>{fmt(counts.screened)}</strong> screened</span>
            <span><i className="sw sw-drop" aria-hidden="true" /><strong>{fmt(counts.dropped)}</strong> dropped in kernel</span>
            <span><i className="sw sw-up" aria-hidden="true" /><strong>{fmt(counts.upward)}</strong> sent up to userspace</span>
          </p>
          <figcaption>{d.stageNote}</figcaption>
        </figure>
      </div>
      <Ledger items={d.ledger} />
    </section>
  );
}
