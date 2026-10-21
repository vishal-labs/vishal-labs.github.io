"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createRenderer } from "@/lib/loom/renderer";
import { SCENES, type Frame, type SceneName } from "@/lib/loom/scenes";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  scene: SceneName;
  className?: string;
  /** Mutable values the parent shares with the scene (hover index, layout). */
  ext?: React.RefObject<Record<string, number>>;
};

export default function LoomCanvas({ scene, className, ext }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const box = canvas.parentElement!;
    const section = canvas.closest("section") ?? box;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileQuery = matchMedia("(max-width: 720px)");

    const renderer = createRenderer(canvas);
    const draw = SCENES[scene]();
    const frame: Frame = {
      t: 0, w: 1, h: 1, progress: 0,
      pointer: { x: 0, y: 0, active: false },
      reduced, mobile: mobileQuery.matches,
      ext: ext?.current ?? {},
    };

    let visible = false;
    let raf = 0;
    const render = (t: number) => {
      frame.t = reduced ? 1e7 : t;
      frame.ext = ext?.current ?? frame.ext;
      draw(renderer, frame);
    };
    const loop = (t: number) => {
      raf = 0;
      if (!visible) return;
      render(t);
      raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (reduced) render(0);
      else if (visible && !raf) raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const r = box.getBoundingClientRect();
      frame.w = Math.max(1, r.width);
      frame.h = Math.max(1, r.height);
      frame.mobile = mobileQuery.matches;
      const dpr = Math.min(window.devicePixelRatio || 1, frame.mobile ? 1.5 : 2);
      renderer.resize(frame.w, frame.h, dpr);
      render(performance.now());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    resize();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      kick();
    });
    io.observe(box);

    const onMove = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      frame.pointer = { x: e.clientX - r.left, y: e.clientY - r.top, active: true };
    };
    const onLeave = () => { frame.pointer.active = false; };
    box.addEventListener("pointermove", onMove, { passive: true });
    box.addEventListener("pointerleave", onLeave);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (s) => { frame.progress = s.progress; },
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      trigger.kill();
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerleave", onLeave);
      renderer.dispose();
    };
  }, [scene, ext]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
