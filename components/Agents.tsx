"use client";

import { useEffect, useRef, useState } from "react";
import LoomCanvas from "./LoomCanvas";
import Ledger from "./Ledger";
import { AGENT_EDGES, agentsLayout } from "@/lib/loom/scenes";
import { AGENTS } from "@/lib/content";

// My assistant stack, drawn as its privacy boundary. Every node is a button.
export default function Agents() {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // hover previews a node; a click or tap pins it, the way the models matrix works
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = hover ?? pinned;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = size.w ? agentsLayout(size.w, size.h) : null;
  const pct = (p: { x: number; y: number }) => ({ left: `${(p.x / size.w) * 100}%`, top: `${(p.y / size.h) * 100}%` });
  const node = AGENTS.nodes.find((n) => n.id === active);

  return (
    <section className="domain d-ai agents" id="agents" aria-labelledby="agents-title">
      <div className="split">
        <div className="copy">
          <h2 id="agents-title">{AGENTS.title}</h2>
          <div className="copy-swap" key={active ?? "none"}>
            <p className="takeaway">{node ? node.lede : AGENTS.lede}</p>
            {(node ? node.body : AGENTS.body).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="bridge">
            {AGENTS.bridge.before}
            <a className="t-zari" href={AGENTS.bridge.to}>{AGENTS.bridge.link}</a>
            {AGENTS.bridge.after}
          </p>
        </div>
        <figure className="stage stage-agents">
          <div className="stage-box" ref={box} onMouseLeave={() => setHover(null)}>
            <LoomCanvas scene="agents" className="stage-canvas" />
            {geo && (
              <>
                <span className="boundary-label" style={pct({ x: geo.cx, y: geo.tall ? geo.cy + geo.R + 18 : geo.cy - geo.R })}>privacy boundary</span>
                {AGENT_EDGES.filter((e) => e.label).map((e) => {
                  const a = geo.pos[e.from], b = geo.pos[e.to];
                  return (
                    <span key={e.label} className="edge-label" style={pct({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })}>
                      {e.label}
                    </span>
                  );
                })}
                <ul className="agent-nodes">
                  {AGENTS.nodes.map((n) => (
                    <li key={n.id} style={pct(geo.pos[n.id])}>
                      <button
                        type="button"
                        className={`agent-node n-${n.id}${n.inside ? "" : " outside"}`}
                        aria-pressed={pinned === n.id}
                        data-active={active === n.id || undefined}
                        onMouseEnter={() => setHover(n.id)}
                        onFocus={() => setHover(n.id)}
                        onBlur={() => setHover(null)}
                        onClick={() => setPinned((p) => (p === n.id ? null : n.id))}
                      >
                        {n.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <p className="sonar-readout" aria-live="polite">
            {node ? (
              <>
                <strong>{node.name}</strong> <span className="where">· {node.where}.</span> {node.what}
              </>
            ) : (
              AGENTS.stageNote
            )}
          </p>
        </figure>
      </div>
      <Ledger items={AGENTS.ledger} />
    </section>
  );
}
