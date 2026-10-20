"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LoomCanvas from "./LoomCanvas";
import { NET, convergeNodes, toScreen } from "@/lib/loom/scenes";

const TONE = ["t-sre", "t-ai", "t-web3", "t-zari"];

export default function Converge() {
  const box = useRef<HTMLDivElement>(null);
  const [horizontal, setHorizontal] = useState(true);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setHorizontal(width >= 560 && width > height * 1.05);
    });
    ro.observe(el);

    // chips arrive with their layer, on the same scrub the canvas weaves to
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let st: ScrollTrigger | undefined;
    if (!reduced) {
      gsap.registerPlugin(ScrollTrigger);
      const chips = () => Array.from(el.querySelectorAll<HTMLElement>(".net-node"));
      const apply = (p: number) => {
        const t = Math.min(1, Math.max(0, (p - 0.38) / 0.48));
        const net = t * t * (3 - 2 * t);
        for (const c of chips()) c.style.opacity = String(Math.min(1, Math.max(0, net * 4 - Number(c.dataset.l) + 0.4)));
      };
      apply(0);
      // same range the canvas uses: the pin on normal screens, plain scroll on short ones
      const short = window.innerHeight < 560;
      st = ScrollTrigger.create(
        short
          ? { trigger: el.closest("section"), start: "top bottom", end: "bottom top", onUpdate: (s) => apply(s.progress) }
          : {
              trigger: el.closest("section"),
              start: "top top",
              end: () => "+=" + window.innerHeight * (matchMedia("(max-width: 720px)").matches ? 0.9 : 1.4),
              onUpdate: (s) => apply(s.progress),
            },
      );
    }
    return () => { ro.disconnect(); st?.kill(); };
  }, []);

  const nodes = convergeNodes(horizontal);
  const pos = (a: number, b: number) => {
    const s = toScreen(a, b, horizontal);
    return { left: `${s.x * 100}%`, top: `${s.y * 100}%` };
  };

  return (
    <section className="converge" id="converge" aria-labelledby="converge-title">
      <div className="converge-stage" ref={box}>
        <LoomCanvas scene="converge" className="stage-canvas" pin />
        {/* each node is a solid chip, so no label ever sits on a moving thread */}
        <ol className="net" aria-label="The network, layer by layer">
          {nodes.map((col, li) =>
            col.map((n, ni) => {
              const meta = NET[li][ni];
              const out = li === nodes.length - 1;
              return (
                <li
                  key={`${li}-${ni}`}
                  className={`net-node ${TONE[meta.d]}${out ? " out" : ""}${li === 0 ? " in" : ""}`}
                  style={pos(n.a, n.b)}
                  data-l={li}
                >
                  {out && <span className="argmax">argmax</span>}
                  <span className="full">{meta.full}</span>
                  <span className="short" aria-hidden="true">{meta.short}</span>
                </li>
              );
            }),
          )}
        </ol>
      </div>
      <div className="band zari">
        <div className="band-inner">
          <h2 id="converge-title">
            <span className="t-sre">SRE</span> × <span className="t-ai">AI</span> × <span className="t-web3">Web3</span>
          </h2>
          <p className="lede">
            The philosophy from the top, made literal: every project you just read is a node in this network.
            Reliability, models and chains go in, and
            its argmax, the single most likely answer, is the engineer I am: one who keeps chains running and puts
            models to work on real infrastructure.
          </p>
        </div>
      </div>
    </section>
  );
}
