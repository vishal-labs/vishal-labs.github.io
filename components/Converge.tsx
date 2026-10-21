"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LoomCanvas from "./LoomCanvas";
import { CONVERGE_FROM, NET, convergeNodes, toScreen } from "@/lib/loom/scenes";

const TONE = ["t-sre", "t-ai", "t-web3", "t-zari"];
// anything the reader does that should win over the landing glide
const INPUTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

export default function Converge() {
  const box = useRef<HTMLDivElement>(null);
  const ext = useRef<Record<string, number>>({});
  const [horizontal, setHorizontal] = useState(true);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setHorizontal(width >= 560 && width > height * 1.05);
    });
    ro.observe(el);

    // chips arrive with their layer, on the same clock the canvas weaves to
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let st: ScrollTrigger | undefined;
    let tween: gsap.core.Tween | undefined;
    let wait = 0;
    let glide = 0;
    let cancelGlide: (() => void) | undefined;
    let teardown: (() => void) | undefined;
    if (!reduced) {
      gsap.registerPlugin(ScrollTrigger);
      const section = el.closest("section")!;
      const chips = () => Array.from(el.querySelectorAll<HTMLElement>(".net-node"));
      const clock = { p: CONVERGE_FROM };
      const apply = () => {
        ext.current.play = clock.p;
        const t = Math.min(1, Math.max(0, (clock.p - 0.38) / 0.48));
        const net = t * t * (3 - 2 * t);
        for (const c of chips()) c.style.opacity = String(Math.min(1, Math.max(0, net * 4 - Number(c.dataset.l) + 0.4)));
      };
      apply();
      // plays once, start to finish; after that only the perpetual pulses run
      const play = () => {
        if (tween) return;
        tween = gsap.to(clock, { p: 1, duration: 4.2, ease: "none", onUpdate: apply });
      };
      // landing from above: once the reader stops scrolling, the section settles into the
      // viewport with a slow eased glide, then plays. Any input of theirs cancels the glide.
      const quiet = () => {
        clearTimeout(wait);
        wait = window.setTimeout(settle, 160);
      };
      const settle = () => {
        removeEventListener("scroll", quiet);
        const top = section.getBoundingClientRect().top;
        if (top <= 2 || top > window.innerHeight * 0.5) return play();
        const from = window.scrollY, start = performance.now();
        const ms = Math.min(1100, 520 + top * 0.9);
        const stop = () => {
          cancelAnimationFrame(glide);
          for (const e of INPUTS) removeEventListener(e, stop);
          cancelGlide = undefined;
          play();
        };
        const step = (now: number) => {
          const k = Math.min(1, (now - start) / ms);
          const eased = 0.5 - Math.cos(Math.PI * k) / 2; // sine in-out: no jolt at either end
          window.scrollTo({ top: from + top * eased, behavior: "instant" });
          if (k < 1) glide = requestAnimationFrame(step);
          else stop();
        };
        for (const e of INPUTS) addEventListener(e, stop, { passive: true });
        cancelGlide = stop;
        glide = requestAnimationFrame(step);
      };
      const land = () => {
        if (tween) return;
        if (window.innerHeight < 560) return play(); // short screens: the section is taller than the view
        addEventListener("scroll", quiet, { passive: true });
        quiet();
      };
      teardown = () => {
        removeEventListener("scroll", quiet);
        cancelAnimationFrame(glide);
        if (cancelGlide) for (const e of INPUTS) removeEventListener(e, cancelGlide);
      };
      st = ScrollTrigger.create({
        trigger: section,
        start: "top 45%",
        end: "bottom 45%",
        onEnter: land,
        onEnterBack: play,
      });
    }
    return () => {
      ro.disconnect();
      st?.kill();
      tween?.kill();
      clearTimeout(wait);
      teardown?.();
    };
  }, []);

  const nodes = convergeNodes(horizontal);
  const pos = (a: number, b: number) => {
    const s = toScreen(a, b, horizontal);
    return { left: `${s.x * 100}%`, top: `${s.y * 100}%` };
  };

  return (
    <section className="converge" id="converge" aria-labelledby="converge-title">
      <div className="converge-stage" ref={box}>
        <LoomCanvas scene="converge" className="stage-canvas" ext={ext} />
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
