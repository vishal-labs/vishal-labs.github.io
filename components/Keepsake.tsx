"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "./Icons";
import { SECTIONS } from "@/lib/content";
import { mix } from "@/lib/loom/scenes";

// The cloth a visitor weaves just by reading: one band per section, in the order they first
// reached it, as deep as the time they spent there, in that section's thread. Every stage
// control they touched adds a zari motif. Nothing is sent anywhere; it lives in this tab.

const INK = {
  warp: "#4a3f86", zari: "#dcc27e", bone: "#d9d1c0", sre: "#0f9a85", ai: "#d7246f",
  web3: "#f5821f", mute: "#8f86b8", all: "",
} as const;
const ALL = [INK.sre, INK.ai, INK.web3];
// what counts as pulling a thread: the buttons and zones on the stages
const PULLS = ".zone, .zone-chip, .agent-node, .quad, .harness, .orbit-rings li";

type Visit = { order: string[]; secs: Record<string, number>; pulled: Set<string> };

function weave(c: HTMLCanvasElement, v: Visit, w: number, h: number, dpr: number) {
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const g = c.getContext("2d")!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = "#16112e";
  g.fillRect(0, 0, w, h);

  const bands = v.order.filter((id) => (v.secs[id] ?? 0) >= 1);
  const total = bands.reduce((a, id) => a + v.secs[id], 0) || 1;
  const dx = 7;
  const cols = Math.ceil(w / dx);
  const rows = Math.max(bands.length, Math.floor(h / 6));
  const rowH = h / rows;
  // the seed is the visit itself, so two readings of the page never weave the same cloth
  const seed = mix(bands.reduce((a, id, k) => Math.imul(a ^ (id.length * 131 + k), 2654435761) ^ Math.round(v.secs[id]), 7) >>> 0);

  // share the rows out by time, at least one each, largest remainders first
  const share = bands.map((id) => (v.secs[id] / total) * rows);
  const n = share.map((s) => Math.max(1, Math.floor(s)));
  let left = rows - n.reduce((a, b) => a + b, 0);
  const byRem = share.map((s, i) => [s - Math.floor(s), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0 && byRem.length; k = (k + 1) % byRem.length, left--) n[byRem[k][1]]++;
  while (left < 0) { const i = n.indexOf(Math.max(...n)); n[i]--; left++; }

  // warp threads first, then the weft passes over them
  g.fillStyle = "#2c2459";
  for (let x = 0; x < cols; x++) g.fillRect(x * dx + dx * 0.36, 0, dx * 0.28, h);
  let r = 0;
  bands.forEach((id, b) => {
    const tone = SECTIONS.find((s) => s.id === id)?.tone ?? "warp";
    // each band weaves its own structure: plain, 2/2 twill, or a five-shaft satin
    const kind = (seed + b) % 3;
    for (let k = 0; k < n[b]; k++, r++) {
      const y = r * rowH;
      g.fillStyle = tone === "all" ? ALL[r % 3] : INK[tone];
      for (let x = 0; x < cols; x++) {
        const over = kind === 0 ? (x + r) % 2 === 0 : kind === 1 ? (x + r) % 4 < 2 : (x * 2 + r * 3 + seed) % 5 !== 0;
        if (over) g.fillRect(x * dx, y + rowH * 0.14, dx + 0.6, rowH * 0.72);
      }
    }
  });

  // a butta for every thread pulled, scattered by the same seed
  const motifs = Math.min(16, v.pulled.size);
  g.fillStyle = INK.zari;
  for (let k = 0; k < motifs; k++) {
    const hx = mix(seed + k * 7919) / 4294967296, hy = mix(seed ^ (k * 104729)) / 4294967296;
    const x = 18 + hx * (w - 36), y = 12 + hy * (h - 24);
    const s = Math.max(6, rowH * 1.5, w / 110);
    g.save();
    g.translate(x, y);
    g.rotate(Math.PI / 4);
    g.fillRect(-s / 2, -s / 2, s, s);
    g.restore();
  }
  // zari selvedge top and bottom
  g.fillRect(0, 0, w, 2);
  g.fillRect(0, h - 2, w, 2);
}

const fmt = (s: number) => (s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`);

export default function Keepsake() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const visit = useRef<Visit>({ order: [], secs: {}, pulled: new Set() });
  const [stats, setStats] = useState({ secs: 0, sections: 0, pulled: 0 });

  useEffect(() => {
    const v = visit.current;
    const sections = () => SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    // where the reader is: the section under the middle of the screen, twice a second
    const tick = setInterval(() => {
      if (document.hidden) return;
      const mid = innerHeight / 2;
      const at = sections().find((el) => { const r = el.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
      if (!at) return;
      if (!v.order.includes(at.id)) v.order.push(at.id);
      v.secs[at.id] = (v.secs[at.id] ?? 0) + 0.5;
    }, 500);
    const pull = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.(PULLS);
      if (!el) return;
      const sec = el.closest("section")?.id ?? "";
      v.pulled.add(`${sec}:${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 40)}`);
    };
    document.addEventListener("pointerover", pull, { passive: true });
    document.addEventListener("click", pull, { passive: true });
    document.addEventListener("focusin", pull);

    // re-weave while the cloth is on screen, so it keeps growing as they linger
    let visible = false;
    const draw = () => {
      const el = box.current, c = canvas.current;
      if (!el || !c) return;
      const { width, height } = el.getBoundingClientRect();
      weave(c, v, width, height, Math.min(devicePixelRatio || 1, 2));
      const secs = Object.values(v.secs).reduce((a, b) => a + b, 0);
      setStats({ secs, sections: v.order.filter((id) => (v.secs[id] ?? 0) >= 1).length, pulled: v.pulled.size });
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) draw(); });
    if (box.current) io.observe(box.current);
    const redraw = setInterval(() => { if (visible) draw(); }, 2000);
    const ro = new ResizeObserver(() => { if (visible) draw(); });
    if (box.current) ro.observe(box.current);
    return () => {
      clearInterval(tick); clearInterval(redraw); io.disconnect(); ro.disconnect();
      document.removeEventListener("pointerover", pull);
      document.removeEventListener("click", pull);
      document.removeEventListener("focusin", pull);
    };
  }, []);

  // the saved copy carries a line of words under the cloth, so it still makes sense on its own
  const save = () => {
    const v = visit.current;
    const W = 1600, H = 900, foot = 120;
    const out = document.createElement("canvas");
    out.width = W; out.height = H;
    const cloth = document.createElement("canvas");
    weave(cloth, v, W, H - foot, 1);
    const g = out.getContext("2d")!;
    g.fillStyle = "#0f0b22";
    g.fillRect(0, 0, W, H);
    g.drawImage(cloth, 0, 0);
    const cs = getComputedStyle(document.documentElement);
    const display = cs.getPropertyValue("--font-display").trim() || "sans-serif";
    const mono = cs.getPropertyValue("--font-mono").trim() || "monospace";
    g.fillStyle = "#dcc27e";
    g.font = `900 52px ${display}`;
    g.textBaseline = "middle";
    g.fillText("WOVEN READING VISHAL-LABS", 48, H - foot / 2 - 4);
    g.fillStyle = "#cbc4e4";
    g.font = `400 24px ${mono}`;
    g.textAlign = "right";
    const secs = Object.values(v.secs).reduce((a, b) => a + b, 0);
    g.fillText(`${fmt(secs)} · ${v.pulled.size} threads pulled · ${new Date().toISOString().slice(0, 10)}`, W - 48, H - foot / 2);
    out.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "vishal-labs-cloth.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  };

  return (
    <figure className="keepsake">
      <p>
        One last thing: this is the cloth you wove by reading. Each band is a section, as deep as the time
        you spent there, in its own thread; each gold motif is a thread you pulled on a stage. It never leaves
        your browser.
      </p>
      <div className="keepsake-box" ref={box}>
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <figcaption>
        <span>
          {fmt(stats.secs)} · {stats.sections} {stats.sections === 1 ? "section" : "sections"} · {stats.pulled}{" "}
          {stats.pulled === 1 ? "thread" : "threads"} pulled
        </span>
        <button type="button" className="link" onClick={save}>
          Save your cloth <ArrowDown />
        </button>
      </figcaption>
    </figure>
  );
}
