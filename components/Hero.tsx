"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LoomCanvas from "./LoomCanvas";
import Selvedge from "./Selvedge";
import { ArrowDown, ArrowUpRight } from "./Icons";
import { heroLayout } from "@/lib/loom/scenes";
import { LINKS, MOBILE_SERVICES, SERVICES } from "@/lib/content";

export default function Hero() {
  const [mobile, setMobile] = useState(false);
  const [lit, setLit] = useState(-1);
  const ext = useRef<Record<string, number>>({ tagCount: 24, lit: -1, warpTop: 150, clothBase: 600 });
  const stage = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);
  const harness = useRef<HTMLDivElement>(null);

  const services = mobile
    ? MOBILE_SERVICES.map((n) => SERVICES.find((s) => s.name === n)!)
    : SERVICES;
  const { tagX } = heroLayout(services.length);

  useEffect(() => {
    const q = matchMedia("(max-width: 720px)");
    const apply = () => setMobile(q.matches);
    apply();
    q.addEventListener("change", apply);
    return () => q.removeEventListener("change", apply);
  }, []);

  // the harness fades as the camera dives into a single thread
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: stage.current,
      start: "top top",
      end: "bottom top",
      onUpdate: (s) => {
        const t = Math.min(1, Math.max(0, s.progress / 0.32));
        stage.current?.style.setProperty("--dive", String(t));
      },
    });
    return () => st.kill();
  }, []);

  // keep the scene's geometry in step with the DOM it sits under
  useEffect(() => {
    const measure = () => {
      const s = stage.current?.getBoundingClientRect();
      const b = band.current?.getBoundingClientRect();
      const hr = harness.current?.getBoundingClientRect();
      if (!s || !b || !hr) return;
      ext.current.tagCount = services.length;
      ext.current.warpTop = hr.bottom - s.top;
      ext.current.clothBase = b.top - s.top;
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, [services.length]);

  const pick = (clientX: number) => {
    const s = stage.current?.getBoundingClientRect();
    if (!s) return;
    const fx = (clientX - s.left) / s.width;
    let best = -1, dist = Infinity;
    services.forEach((_, j) => {
      const d = Math.abs(tagX(j) - fx);
      if (d < dist) { dist = d; best = j; }
    });
    const within = dist < 1.2 / services.length;
    const next = within ? best : -1;
    ext.current.lit = next;
    setLit(next);
  };

  const litService = lit >= 0 ? services[lit] : null;

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div
        className="hero-stage"
        ref={stage}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => { ext.current.lit = -1; setLit(-1); }}
      >
        <LoomCanvas scene="hero" className="stage-canvas" ext={ext} />
        <div className="harness" ref={harness} aria-label="Services running in the homelab">
          <ul>
            {services.map((s, j) => (
              <li key={s.name} style={{ left: `${tagX(j) * 100}%` }} data-lit={lit === j || undefined}>
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="thread-reading" aria-live="polite">
          {litService ? (
            <>
              <strong>{litService.name}</strong> · {litService.role} · {litService.host}
            </>
          ) : (
            <span className="hint">{mobile ? "Tap a thread" : "Hover a thread"}: each one is a service running at home.</span>
          )}
        </p>
      </div>

      <div className="band zari" ref={band}>
        <div className="band-inner">
          <h1 id="hero-title">Vishal Dodda</h1>
          <div className="band-side">
            <p className="lede">
              SRE for blockchain infrastructure. I work where <em className="t-sre">reliability</em>,{" "}
              <em className="t-ai">AI</em> and <em className="t-web3">web3</em> cross. Follow one thread at a
              time; by the end of the page you&rsquo;ll see where they meet.
            </p>
            <div className="actions">
              <a className="btn" href="#philosophy">
                Follow the thread <ArrowDown />
              </a>
              <a className="link" href={LINKS.linkedin} target="_blank" rel="noreferrer">
                LinkedIn <ArrowUpRight />
              </a>
            </div>
          </div>
        </div>
        <Selvedge />
      </div>
    </section>
  );
}
