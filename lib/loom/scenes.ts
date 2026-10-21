import { hex, withAlpha, type Renderer, type RGBA } from "./renderer";
import { HOME, MODEL_QUADRANTS } from "../content";

// which signature each quadrant re-weaves into follows the content order, not the screen position
const PATTERN_KIND = { wave: 0, tokens: 1, table: 2, plate: 3 } as const;

export const COLORS = {
  warp: hex("#16112e"),
  thread: hex("#2c2459"),
  threadHi: hex("#4a3f86"),
  sre: hex("#0f9a85"),
  ai: hex("#d7246f"),
  web3: hex("#f5821f"),
  zari: hex("#dcc27e"),
  card: hex("#2a2150"),
  bone: hex("#efe7d6"),
};
const WEFT: RGBA[] = [COLORS.sre, COLORS.ai, COLORS.web3];

export type Frame = {
  t: number; // ms
  w: number;
  h: number;
  progress: number; // 0..1 through the section's scroll range
  pointer: { x: number; y: number; active: boolean };
  reduced: boolean;
  mobile: boolean;
  ext: Record<string, number>;
};

export type Scene = (r: Renderer, f: Frame) => void;
export type SceneName = "hero" | "home" | "reliability" | "models" | "chains" | "converge" | "agents";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ───────────────────────── hero: the loom ─────────────────────────
// Warp threads hang from the harness; a shuttle throws one weft row per beat.
// The cloth grows up from the band and, once full, advances under it.
export const heroLayout = (tagCount: number) => {
  const cols = tagCount * 4;
  return { cols, tagX: (j: number) => (j * 4 + 1.5) / cols };
};

function hero(): Scene {
  let globalRow = 0;
  const rows: number[] = []; // global row numbers, newest first
  let shotStart = -1;
  let shotDir = 1;
  const BEAT = 560;
  const THROW = 470;
  return (r, f) => {
    const { w, h, t } = f;
    const tagCount = f.ext.tagCount || 24;
    const { cols } = heroLayout(tagCount);
    const dx = w / cols;
    const warpTop = f.ext.warpTop || 150;
    const fell = f.ext.clothBase || h * 0.62; // where the band begins
    const rowH = f.mobile ? 6 : 7;
    const maxRows = Math.max(8, Math.floor(((fell - warpTop) * 0.58) / rowH));
    const lit = f.ext.lit ?? -1;

    // the loom has been running long before the visitor arrives
    const target = f.reduced ? maxRows : Math.floor(maxRows * 0.7);
    if (rows.length < target && globalRow === rows.length) {
      while (rows.length < target) rows.unshift(globalRow++);
    }

    r.clear(COLORS.warp);
    // leaving the hero dives into a single thread of the cloth
    const z = f.reduced ? 0 : smooth(0.5, 0.76, f.progress);
    if (z > 0) {
      const j = Math.round(tagCount * 0.42);
      // capped so the cloth stays cloth: at most four times closer
      r.view(1 + z * z * 3, (j * 4 + 1.5) * dx, fell - rowH * 3);
    }

    // warp
    for (let i = 0; i < cols; i++) {
      const x = dx * i + dx / 2;
      const tagged = i % 4 === 1;
      const isLit = tagged && Math.floor(i / 4) === lit;
      const c = isLit ? COLORS.zari : tagged ? COLORS.threadHi : COLORS.thread;
      r.line(x, warpTop, x, h, isLit ? 2.2 : tagged ? 1.6 : 1, c);
    }

    // cloth: row k (0 = newest) sits just above the band, newest highest
    const top = fell - rows.length * rowH;
    for (let k = 0; k < rows.length; k++) {
      const g = rows[k];
      const y = top + k * rowH + rowH / 2;
      drawRow(r, g, y, rowH, cols, dx, lit);
    }

    if (f.reduced) { r.flush(); return; }

    // shuttle
    if (shotStart < 0 || t - shotStart > BEAT) {
      if (shotStart >= 0) {
        rows.unshift(globalRow++);
        if (rows.length > maxRows) rows.length = maxRows;
      }
      shotStart = t;
      shotDir = -shotDir;
    }
    const p = expoOut(clamp((t - shotStart) / THROW));
    const y = fell - (rows.length + 1) * rowH + rowH / 2;
    const sx = shotDir > 0 ? lerp(-40, w + 40, p) : lerp(w + 40, -40, p);
    // the weft trailing behind the shuttle
    const x0 = shotDir > 0 ? 0 : sx;
    const x1 = shotDir > 0 ? sx : w;
    r.rect((x0 + x1) / 2, y, Math.max(0, x1 - x0), rowH * 0.62, withAlpha(WEFT[globalRow % 3], 0.95));
    r.rect(sx, y, f.mobile ? 34 : 46, rowH * 1.5, COLORS.zari);
    r.flush();
  };
}

// one woven row: twill over/under with a diamond butta motif in zari
function drawRow(r: Renderer, g: number, y: number, rowH: number, cols: number, dx: number, lit: number) {
  const base = WEFT[g % 3];
  for (let i = 0; i < cols; i++) {
    const u = i % 24, v = g % 24;
    const motif = Math.abs(u - 12) + Math.abs(v - 12) < 5;
    const over = motif || (i + g) % 4 < 2;
    const x = dx * i + dx / 2;
    if (over) {
      r.rect(x, y, dx + 0.6, rowH * 0.72, motif ? COLORS.zari : base);
    } else {
      const tagged = i % 4 === 1 && Math.floor(i / 4) === lit;
      r.rect(x, y, Math.max(1.2, dx * 0.28), rowH, tagged ? COLORS.zari : COLORS.threadHi);
    }
  }
}

// ───────────────────────── home: three rings of services orbiting me ─────────────────────────
// Three concentric rings in 3D, each tilted its own way: infrastructure inside, AI in the
// middle, my data outside. Every cube is one service. On a loop the rings spin up until the
// cubes smear into whole woven circles, hold, then slow back down so the names can be read.
const SPIN_P = 15500; // one cycle, ms
const SPIN_MAX = 18; // top speed, as a multiple of the resting speed
// speed multiplier through the cycle: rest, spin up, hold, spin down
function spinRate(u: number) {
  if (u < 5000) return 1;
  if (u < 9000) { const k = (u - 5000) / 4000; return 1 + (SPIN_MAX - 1) * k * k * k; }
  if (u < 12000) return SPIN_MAX;
  const k = (u - 12000) / 3500;
  return 1 + (SPIN_MAX - 1) * (1 - k) ** 3;
}
// the angle has to be a pure function of time (the canvas and the DOM chips both ask for it),
// so the speed curve is integrated once into a table
const SPIN_STEP = 10;
const SPIN_TABLE = (() => {
  const n = SPIN_P / SPIN_STEP;
  const out = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) out[i] = out[i - 1] + spinRate((i - 0.5) * SPIN_STEP) * SPIN_STEP;
  return out;
})();
function spunFor(t: number) {
  const laps = Math.floor(t / SPIN_P), u = t - laps * SPIN_P;
  const i = Math.floor(u / SPIN_STEP), k = (u - i * SPIN_STEP) / SPIN_STEP;
  return laps * SPIN_TABLE[SPIN_TABLE.length - 1] + lerp(SPIN_TABLE[i], SPIN_TABLE[i + 1], k);
}
// radius (of the stage's ring size), tilt toward the viewer, roll on screen, resting lap time
// (negative spins the other way): concentric, but each at its own angle
const RINGS = [
  { r: 0.44, pitch: 0.86, roll: 0.5, lap: 15000, tallR: 0.56, tallPitch: 0.62, tallRoll: 0.8 },
  { r: 0.72, pitch: 0.5, roll: -0.42, lap: -21000, tallR: 0.8, tallPitch: 0.72, tallRoll: -0.62 },
  { r: 1, pitch: 0.62, roll: 0.06, lap: 28000, tallR: 1, tallPitch: 0.86, tallRoll: 0.08 },
];

export function homeOrbit(t: number, w: number, h: number, reduced: boolean) {
  const tall = w < 560 && h > w * 0.9;
  const cx = w / 2, cy = h * 0.5;
  const R = tall ? Math.min(w * 0.44, h * 0.42) : Math.min(w * 0.43, h * 0.78);
  const u = reduced ? 0 : t - Math.floor(t / SPIN_P) * SPIN_P;
  const rate = reduced ? 1 : spinRate(u);
  const spun = reduced ? 0 : spunFor(t);
  const blur = clamp((rate - 1.6) / (SPIN_MAX * 0.85 - 1.6)); // 0 crisp cubes .. 1 whole circles
  // names come in after each lap begins and fade as soon as the spin picks up; they stay
  // away through the spin-down, so one ring's names never meet the next ring's
  const names = reduced ? 1 : u >= 9000 ? 0 : clamp((u - 300) / 500) * (1 - clamp((rate - 1) / 1.4));
  // which ring is named this lap; they take turns so labels never crowd each other
  const named = reduced ? 2 : Math.floor(t / SPIN_P) % 3;
  const rings = HOME.rings.map((ring, ri) => {
    const g = RINGS[ri];
    const pitch = tall ? g.tallPitch : g.pitch, roll = tall ? g.tallRoll : g.roll;
    const sp = Math.sin(pitch), cpi = Math.cos(pitch), sr = Math.sin(roll), cr = Math.cos(roll);
    const rr = tall ? g.tallR : g.r;
    const rad = R * rr;
    // a point on the ring at angle th: x right, y down the screen, z toward the viewer
    const at = (th: number) => {
      const X = Math.cos(th) * rad, Y = -Math.sin(th) * rad * sp, Z = Math.sin(th) * rad * cpi;
      return { x: cx + X * cr - Y * sr, y: cy - (X * sr + Y * cr), z: Z / R };
    };
    const turn = (spun / g.lap) * Math.PI * 2;
    return { ...ring, ri, rr, at, turn, dir: Math.sign(g.lap), gap: (Math.PI * 2) / ring.services.length };
  });
  let i = 0;
  const items = rings.flatMap((ring) =>
    ring.services.map((label, k) => {
      const th = ring.turn + (k + (ring.ri % 2) * 0.5) * ring.gap;
      const p = ring.at(th);
      const depth = (p.z / ring.rr + 1) / 2;
      return { i: i++, ring: ring.ri, label, th, ...p, depth, scale: 0.62 + 0.38 * depth };
    }),
  );
  return { cx, cy, tall, rings, items, blur, names, named, cube: tall ? 20 : 34 };
}

// a cube's face, filled with weft so it reads as cloth
function wovenFace(r: Renderer, p: { x: number; y: number }[], c: RGBA) {
  const picks = 7;
  for (let k = 0; k < picks; k++) {
    const u = (k + 0.5) / picks;
    const ax = lerp(p[0].x, p[3].x, u), ay = lerp(p[0].y, p[3].y, u);
    const bx = lerp(p[1].x, p[2].x, u), by = lerp(p[1].y, p[2].y, u);
    const hgt = Math.hypot(p[3].x - p[0].x, p[3].y - p[0].y) / picks;
    r.line(ax, ay, bx, by, Math.max(1, hgt * 0.62), c);
  }
}

function drawCube(r: Renderer, x: number, y: number, size: number, yaw: number, alpha: number, c: RGBA) {
  const pitch = 0.5;
  const hs = size / 2;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const proj = (X: number, Y: number, Z: number) => {
    const x1 = X * cy - Z * sy, z1 = X * sy + Z * cy;
    const y2 = Y * cp - z1 * sp;
    return { x: x + x1, y: y - y2 };
  };
  const toward = (X: number, Y: number, Z: number) => {
    const z1 = X * sy + Z * cy;
    return Y * sp + z1 * cp; // > 0 faces the viewer
  };
  const v = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ].map(([X, Y, Z]) => proj(X * hs, Y * hs, Z * hs));
  const faces: { idx: number[]; n: [number, number, number]; tone: number }[] = [
    { idx: [7, 6, 2, 3], n: [0, 1, 0], tone: 1 }, // top
    { idx: [3, 2, 1, 0], n: [0, 0, -1], tone: 0.62 },
    { idx: [6, 7, 4, 5], n: [0, 0, 1], tone: 0.62 },
    { idx: [2, 6, 5, 1], n: [1, 0, 0], tone: 0.78 },
    { idx: [7, 3, 0, 4], n: [-1, 0, 0], tone: 0.78 },
  ];
  for (const f of faces) {
    if (toward(...f.n) <= 0) continue;
    const pts = f.idx.map((k) => v[k]);
    wovenFace(r, pts, withAlpha(scale(c, f.tone), alpha));
    for (let k = 0; k < 4; k++) {
      const a = pts[k], b = pts[(k + 1) % 4];
      r.line(a.x, a.y, b.x, b.y, 1, withAlpha(COLORS.bone, 0.45 * alpha));
    }
  }
}

function home(): Scene {
  const RING_TONE: Record<string, RGBA> = { sre: COLORS.sre, ai: COLORS.ai, bone: scale(COLORS.bone, 0.82) };
  return (r, f) => {
    const { w, h } = f;
    // the page starts the cycle when the stage first comes into view
    const t = f.t - (f.ext.t0 ?? 0);
    const o = homeOrbit(t, w, h, f.reduced);
    const { blur } = o;
    r.clear(COLORS.warp);
    // faint warp behind the orbit
    for (let x = 7; x < w; x += 18) r.line(x, 0, x, h, 1, withAlpha(COLORS.thread, 0.8));
    // each ring itself, woven: over and under
    for (const ring of o.rings) {
      const c = RING_TONE[ring.tone];
      const segs = 96;
      for (let i = 0; i < segs; i++) {
        if (i % 3 === 2) continue;
        const a = ring.at((i / segs) * Math.PI * 2), b = ring.at(((i + 0.7) / segs) * Math.PI * 2);
        const d = (a.z / ring.rr + 1) / 2;
        r.line(a.x, a.y, b.x, b.y, 1.5, withAlpha(scale(c, 0.55), 0.35 + 0.45 * d));
      }
    }
    // back to front across all three rings, so near cubes cover far ones
    const order = [...o.items].sort((a, b) => a.z - b.z);
    for (const it of order) {
      const ring = o.rings[it.ring];
      const c = RING_TONE[ring.tone];
      const alpha = 0.45 + 0.55 * it.depth;
      const size = o.cube * it.scale;
      // the link to me, and data running both ways on it; both give way to the spin
      const calm = 1 - blur;
      if (calm > 0.02) {
        woven(r, o.cx, o.cy, it.x, it.y, 1, withAlpha(COLORS.threadHi, alpha * 0.7 * calm));
        for (let k = 0; k < 2; k++) {
          const ph = f.reduced ? 0.35 + 0.3 * k : (t / 1300 + it.i * 0.17 + k * 0.5) % 1;
          const out = k === 0;
          const px = out ? lerp(o.cx, it.x, ph) : lerp(it.x, o.cx, ph);
          const py = out ? lerp(o.cy, it.y, ph) : lerp(it.y, o.cy, ph);
          const sz = 3 + 3 * it.depth;
          r.rect(px, py, sz, sz, withAlpha(out ? COLORS.ai : COLORS.bone, alpha * calm));
        }
      }
      // at speed each cube smears back along its ring; at the top they join into one circle
      if (blur > 0) {
        const len = ring.gap * Math.min(1.04, blur ** 0.8 * 1.04);
        const steps = Math.max(2, Math.ceil(len / 0.035));
        let prev = it;
        for (let j = 1; j <= steps; j++) {
          const q = ring.at(it.th - ring.dir * (len * j) / steps);
          const fade = lerp(1 - j / steps, 1, blur * blur);
          const tone = j % 2 ? 1 : 0.7; // over, under: the circle stays cloth
          const d = (q.z / ring.rr + 1) / 2;
          r.line(prev.x, prev.y, q.x, q.y, Math.max(2, o.cube * (0.62 + 0.38 * d) * 0.5), withAlpha(scale(c, tone), blur * fade * (0.5 + 0.5 * d)));
          prev = { ...prev, x: q.x, y: q.y };
        }
      }
      drawCube(r, it.x, it.y, size, it.th * 0.8 + 0.6, alpha * (1 - 0.7 * blur), c);
    }
    r.flush();
  };
}

// ───────────────────────── reliability: the packet path ─────────────────────────
// Traffic hits the network card; the XDP program in the kernel drops attacks in place,
// a sliver goes up to the userspace ML ensemble, clean requests reach the app, and every
// drop becomes a metric. Laid out along the flow, so phones can turn it vertical.
export const PACKET_ZONES: Record<string, [number, number, number, number]> = {
  // along0, along1, across0, across1, as fractions of the stage
  xdp: [0.22, 0.4, 0.3, 0.72],
  ml: [0.5, 0.72, 0.07, 0.23],
  tls: [0.82, 0.97, 0.4, 0.62],
  metrics: [0.5, 0.72, 0.78, 0.93],
};

export function packetGeometry(w: number, h: number) {
  const vertical = w < 560 && h > w * 0.9;
  const map = (a: number, b: number) => (vertical ? { x: b * w, y: a * h } : { x: a * w, y: b * h });
  const zones = Object.fromEntries(
    Object.entries(PACKET_ZONES).map(([id, [a0, a1, b0, b1]]) => {
      const p0 = map(a0, b0), p1 = map(a1, b1);
      return [id, { x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y), w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) }];
    }),
  );
  return { vertical, map, zones };
}

function reliability(): Scene {
  type Pkt = { a: number; b: number; kind: 0 | 1 | 2; state: "fly" | "drop" | "up"; t: number; vy: number };
  type Dot = { t0: number; from: { a: number; b: number } };
  let pkts: Pkt[] = [];
  let dots: Dot[] = [];
  let clock = 0, last = 0, next = 0;
  return (r, f) => {
    const { w, h, t } = f;
    const g = packetGeometry(w, h);
    const P = g.map;
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    clock += f.reduced ? 0 : dt;
    const ext = f.ext;
    r.clear(COLORS.warp);

    const box = (id: string, fill: RGBA, edge: RGBA, picks: number) => {
      const z = g.zones[id];
      for (let k = 0; k < picks; k++) {
        const v = (k + 0.5) / picks;
        if (g.vertical) r.line(z.x + v * z.w, z.y, z.x + v * z.w, z.y + z.h, Math.max(1, (z.w / picks) * 0.45), fill);
        else r.line(z.x, z.y + v * z.h, z.x + z.w, z.y + v * z.h, Math.max(1, (z.h / picks) * 0.45), fill);
      }
      r.line(z.x, z.y, z.x + z.w, z.y, 1.5, edge); r.line(z.x, z.y + z.h, z.x + z.w, z.y + z.h, 1.5, edge);
      r.line(z.x, z.y, z.x, z.y + z.h, 1.5, edge); r.line(z.x + z.w, z.y, z.x + z.w, z.y + z.h, 1.5, edge);
    };
    // the path: internet → NIC → kernel → app, with a branch up to userspace and one down to metrics
    const lane = (a0: number, b0: number, a1: number, b1: number, c: RGBA) => { const p = P(a0, b0), q = P(a1, b1); woven(r, p.x, p.y, q.x, q.y, 1.4, c); };
    lane(0.04, 0.51, 0.82, 0.51, COLORS.threadHi);
    lane(0.46, 0.51, 0.61, 0.23, withAlpha(COLORS.threadHi, 0.8));
    lane(0.31, 0.72, 0.61, 0.78, withAlpha(COLORS.threadHi, 0.8));
    const nic0 = P(0.2, 0.26), nic1 = P(0.2, 0.76);
    r.line(nic0.x, nic0.y, nic1.x, nic1.y, 4, COLORS.bone);
    box("xdp", withAlpha(COLORS.sre, 0.22), COLORS.sre, 14);
    box("ml", withAlpha(COLORS.ai, 0.16), COLORS.ai, 6);
    box("tls", withAlpha(COLORS.bone, 0.1), COLORS.bone, 7);
    box("metrics", withAlpha(COLORS.sre, 0.14), COLORS.sre, 6);
    // the active zone, edged in zari
    const zone = ["xdp", "ml", "tls", "metrics"][ext.zone ?? -1];
    if (zone) {
      const z = g.zones[zone];
      r.line(z.x - 4, z.y - 4, z.x + z.w + 4, z.y - 4, 2, COLORS.zari); r.line(z.x - 4, z.y + z.h + 4, z.x + z.w + 4, z.y + z.h + 4, 2, COLORS.zari);
      r.line(z.x - 4, z.y - 4, z.x - 4, z.y + z.h + 4, 2, COLORS.zari); r.line(z.x + z.w + 4, z.y - 4, z.x + z.w + 4, z.y + z.h + 4, 2, COLORS.zari);
    }

    // traffic: mostly clean, some attacks, a rare packet bound for the ML ensemble
    if (!f.reduced) {
      while (clock >= next) {
        const roll = Math.random();
        pkts.push({ a: 0.03, b: 0.44 + Math.random() * 0.14, kind: roll < 0.2 ? 1 : roll < 0.24 ? 2 : 0, state: "fly", t: clock, vy: 0 });
        next += 40 + Math.random() * 40;
      }
    } else if (pkts.length === 0) {
      for (let i = 0; i < 26; i++) pkts.push({ a: 0.04 + (i / 26) * 0.8, b: 0.45 + ((i * 37) % 13) / 100, kind: i % 5 === 1 ? 1 : 0, state: "fly", t: 0, vy: 0 });
      ext.screened = 12840; ext.dropped = 2310; ext.upward = 32;
    }
    const speed = 0.00042 * dt;
    pkts = pkts.filter((p) => {
      if (!f.reduced) {
        if (p.state === "fly") {
          const before = p.a;
          p.a += speed;
          if (before < 0.31 && p.a >= 0.31) {
            ext.screened = (ext.screened ?? 0) + 1;
            if (p.kind === 1) {
              p.state = "drop"; ext.dropped = (ext.dropped ?? 0) + 1;
              dots.push({ t0: clock, from: { a: 0.31, b: 0.72 } });
            }
          }
          if (p.kind === 2 && before < 0.46 && p.a >= 0.46) { p.state = "up"; ext.upward = (ext.upward ?? 0) + 1; }
          if (p.a > 0.82) return false;
        } else if (p.state === "drop") {
          p.vy += 0.0000026 * dt; p.b += p.vy * dt;
          if (p.b > 0.95) return false;
        } else {
          p.a += speed * 0.55; p.b -= speed * 1.25;
          if (p.b < 0.16) return false;
        }
      }
      const q = P(p.a, p.b);
      const along = 10, across = 5;
      const c = p.kind === 1 ? COLORS.web3 : p.kind === 2 ? COLORS.ai : COLORS.bone;
      if (p.state === "drop") {
        // a drop: the packet turns into a cross as it falls out of the path
        r.line(q.x - 5, q.y - 5, q.x + 5, q.y + 5, 2, c); r.line(q.x - 5, q.y + 5, q.x + 5, q.y - 5, 2, c);
      } else if (g.vertical) r.rect(q.x, q.y, across, along, c);
      else r.rect(q.x, q.y, along, across, c);
      return true;
    });
    // every drop sends a metric down to prometheus
    dots = dots.filter((d) => {
      const k = (clock - d.t0) / 900;
      if (k >= 1) return false;
      const q = P(lerp(d.from.a, 0.61, k), lerp(d.from.b, 0.85, k));
      r.rect(q.x, q.y, 5, 5, COLORS.sre);
      return true;
    });
    r.flush();
  };
}

function mix(a: number) {
  a = Math.imul(a ^ (a >>> 16), 0x85ebca6b);
  a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35);
  return (a ^ (a >>> 16)) >>> 0;
}

// ───────────────────────── models: logSonar ─────────────────────────
// Three microservices pour raw log lines along their threads. Each line lifts off
// its thread and lands as one pixel, so the matrix is built only from what arrives,
// one band per service, the way logSonar draws them. A quadrant the visitor picks
// re-weaves into another model's signature.
export const SOURCES = ["bhima", "shakuni", "ashwatthama"];

export function sonarGeometry(w: number, h: number) {
  // phones turn the loom: sources on top, data falling down into column bands
  const vertical = w < 560 && h > w * 0.9;
  const L = vertical ? h : w; // along the flow
  const C = vertical ? w : h; // across it
  const n = vertical ? 21 : 30;
  const size = vertical ? Math.min(C * 0.88, L * 0.6) : Math.min(L * 0.5, C * 0.84);
  const a0 = L - size - L * 0.05; // where the matrix begins, along the flow
  const b0 = (C - size) / 2;
  const chipA = L * 0.04;
  const laneStart = chipA + (vertical ? 40 : 150);
  const xy = (a: number, b: number) => (vertical ? { x: b, y: a } : { x: a, y: b });
  const box = xy(a0, b0);
  const lanes = [0, 1, 2].map((k) => b0 + ((k + 0.5) * size) / 3);
  return { vertical, n, size, a0, b0, laneStart, chipA, lanes, xy, gx0: box.x, gy0: box.y };
}

const hash3 = (a: number, b: number, c: number) => mix(Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791)) / 4294967296;
const blend = (a: RGBA, b: RGBA, t: number): RGBA => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
const scale = (c: RGBA, k: number): RGBA => [c[0] * k, c[1] * k, c[2] * k, c[3]];

function sonarCell(band: number, r: number, c: number, gen: number, n: number): RGBA {
  const noise = hash3(r + band * 997, c, gen);
  if (band === 0) {
    // healthy: steady green, the odd warning
    return noise < 0.04 ? COLORS.zari : scale(COLORS.sre, 0.75 + 0.35 * noise);
  }
  if (band === 1) {
    // a slowdown that keeps coming back: the stripes FFT finds
    const stripe = c % 7 < 2 && r % 3 !== 1;
    return stripe ? blend(COLORS.ai, COLORS.bone, 0.15 * noise) : blend(COLORS.sre, COLORS.threadHi, 0.35 + 0.3 * noise);
  }
  // an anomaly: a window of slow, failing requests
  const inWindow = c > n * 0.56 && c < n * 0.72;
  return inWindow ? blend(COLORS.web3, COLORS.ai, noise * 0.6) : scale(COLORS.sre, 0.55 + 0.4 * noise);
}

function sonarPattern(kind: number, u: number, v: number, t: number, r: number, c: number): RGBA {
  const flicker = hash3(r, c, Math.floor(t / 220));
  if (kind === 0) {
    // radar: a signal pulled out of noise
    const target = 0.5 + 0.28 * Math.sin(u * Math.PI * 4 + t / 600);
    return Math.abs(v - target) < 0.07 ? COLORS.sre : withAlpha(COLORS.threadHi, 0.2 + 0.5 * flicker);
  }
  if (kind === 1) {
    // hinglish: rows of word dashes, spam tokens lit
    if (r % 2 === 1) return withAlpha(COLORS.warp, 1);
    const word = Math.floor((c + hash3(r, 0, 1) * 5) / 4);
    if ((c + Math.floor(hash3(r, 0, 1) * 5)) % 4 === 3) return withAlpha(COLORS.warp, 1);
    return hash3(r, word, 7) < 0.25 ? COLORS.ai : withAlpha(COLORS.bone, 0.5);
  }
  if (kind === 2) {
    // mcp: a table; the agent's current query row in zari
    const live = Math.floor(t / 900) % 5;
    if (v < 0.14) return withAlpha(COLORS.zari, 0.55);
    if (c % 6 === 0 || r % 4 === 0) return COLORS.threadHi;
    return Math.floor((v - 0.14) / 0.172) === live ? COLORS.zari : withAlpha(COLORS.bone, 0.18);
  }
  // calorie-vision: a plate, its macros as three colours
  const dx = u - 0.5, dy = v - 0.5, d = Math.hypot(dx, dy);
  if (d > 0.46) return withAlpha(COLORS.warp, 1);
  if (d > 0.37) return withAlpha(COLORS.bone, 0.7);
  const ang = (Math.atan2(dy, dx) / (Math.PI * 2) + 1 + t / 9000) % 1;
  return ang < 0.4 ? COLORS.sre : ang < 0.7 ? COLORS.web3 : COLORS.ai;
}

function models(): Scene {
  type Flight = { band: number; idx: number; t0: number; lane: number; fly: number; len: number; dy: number };
  type Band = { spawned: number; landed: number[]; phase: "fill" | "hold" | "clear"; since: number; gen: number; next: number };
  const FLY = 420;
  let flights: Flight[] = [];
  let bands: Band[] = [];
  let clock = 0;
  let last = 0;
  const morph = [0, 0, 0, 0];
  return (r, f) => {
    const { w, h, t } = f;
    const g = sonarGeometry(w, h);
    const { n, size, a0, b0, laneStart, lanes, xy, vertical } = g;
    const cell = size / n;
    const rows = n / 3;
    const total = rows * n;
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    clock += f.reduced ? 0 : dt;
    if (bands.length !== 3 || bands[0].landed.length !== total) {
      bands = [0, 1, 2].map((k) => ({ spawned: 0, landed: new Array(total).fill(-1), phase: "fill", since: k * 400, gen: 0, next: k * 400 }));
      flights = [];
    }
    if (f.reduced) for (const bd of bands) { bd.landed.fill(-9999); bd.spawned = total; bd.phase = "hold"; }

    const quad = f.ext.quad ?? -1;
    for (let q = 0; q < 4; q++) {
      const goal = q === quad ? 1 : 0;
      morph[q] = f.reduced ? goal : morph[q] + (goal - morph[q]) * Math.min(1, dt / 160);
    }
    // rect in flow coordinates: `along` runs with the data, `across` spans the band
    const rect = (a: number, b: number, along: number, across: number, c: RGBA) => {
      const p = xy(a, b);
      if (vertical) r.rect(p.x, p.y, across, along, c);
      else r.rect(p.x, p.y, along, across, c);
    };
    // cells fill column by column away from the sources, so the matrix grows like cloth
    const cellAt = (band: number, idx: number) => {
      const c = Math.floor(idx / rows), rr = idx % rows;
      return { c, rr, a: a0 + (c + 0.5) * cell, b: b0 + band * (size / 3) + (rr + 0.5) * cell };
    };

    r.clear(COLORS.warp);

    // the threads from each microservice to its band
    lanes.forEach((lb) => {
      const s0 = xy(laneStart, lb), s1 = xy(a0 - 6, lb);
      r.line(s0.x, s0.y, s1.x, s1.y, 1.5, COLORS.threadHi);
    });

    // band lifecycle: fill, hold the finished image, wipe, weave again
    const gap = f.mobile ? 34 : 26;
    bands.forEach((bd, band) => {
      if (f.reduced) return;
      if (bd.phase === "fill") {
        while (bd.spawned < total && clock >= bd.next) {
          flights.push({ band, idx: bd.spawned++, t0: bd.next, lane: 560 + Math.random() * 420, fly: FLY, len: 5 + Math.random() * 22, dy: (Math.random() - 0.5) * (size / 3) * 0.55 });
          bd.next += gap * (0.6 + Math.random() * 0.8);
        }
        if (bd.landed.every((v) => v !== -1)) { bd.phase = "hold"; bd.since = clock; }
      } else if (bd.phase === "hold" && clock - bd.since > 2600) {
        bd.phase = "clear"; bd.since = clock;
      } else if (bd.phase === "clear" && clock - bd.since > 760) {
        bd.landed.fill(-1); bd.spawned = 0; bd.gen++; bd.phase = "fill"; bd.next = clock + 200;
      }
    });

    // the matrix: empty slots, landed pixels, a brief flash where one just arrived
    const cx0 = g.gx0 + size / 2, cy0 = g.gy0 + size / 2;
    for (let band = 0; band < 3; band++) {
      const bd = bands[band];
      const wipe = bd.phase === "clear" ? (clock - bd.since) / 760 : -1;
      for (let idx = 0; idx < total; idx++) {
        const { c, rr, a, b } = cellAt(band, idx);
        const landedAt = bd.landed[idx];
        const cleared = wipe >= 0 && c / n < wipe;
        let col: RGBA = withAlpha(COLORS.thread, 0.55);
        if (landedAt !== -1 && !cleared) {
          col = sonarCell(band, rr, c, bd.gen, n);
          const age = clock - landedAt;
          if (age < 260) col = blend(col, COLORS.bone, 1 - age / 260);
        }
        const p = xy(a, b);
        const q = (p.x < cx0 ? 0 : 1) + (p.y < cy0 ? 0 : 2);
        if (morph[q] > 0.001) {
          const u = (p.x - (q % 2 ? cx0 : g.gx0)) / (size / 2);
          const v = (p.y - (q < 2 ? g.gy0 : cy0)) / (size / 2);
          col = blend(col, sonarPattern(PATTERN_KIND[MODEL_QUADRANTS[q].pattern], u, v, t, Math.floor(v * n / 2), Math.floor(u * n / 2)), morph[q]);
        }
        r.rect(p.x, p.y, cell * 0.86, cell * 0.86, col);
      }
    }

    // raw log lines: grey dashes on the thread, then a flight into their cell
    if (f.reduced) {
      for (let i = 0; i < 24; i++) {
        const band = i % 3;
        rect(lerp(laneStart, a0 - 10, ((i * 7) % 24) / 24), lanes[band] + (((i * 37) % 10) / 10 - 0.5) * (size / 3) * 0.55, 6 + ((i * 5) % 18), 2, withAlpha(COLORS.bone, 0.55));
      }
    } else {
      const smoothstep = (k: number) => k * k * (3 - 2 * k);
      flights = flights.filter((fl) => {
        const u = clock - fl.t0;
        if (u < 0) return true;
        const target = cellAt(fl.band, fl.idx);
        if (u < fl.lane) {
          const k = smoothstep(u / fl.lane);
          rect(lerp(laneStart, a0 - 10, k), lanes[fl.band] + fl.dy, fl.len, 2, withAlpha(COLORS.bone, 0.35 + 0.35 * k));
          return true;
        }
        const k = (u - fl.lane) / fl.fly;
        if (k >= 1) { bands[fl.band].landed[fl.idx] = clock; return false; }
        const e = expoOut(k);
        const col = blend(withAlpha(COLORS.bone, 0.7), sonarCell(fl.band, target.rr, target.c, bands[fl.band].gen, n), e);
        // the log line contracts from a dash into a pixel as it lands
        rect(lerp(a0 - 10, target.a, e), lerp(lanes[fl.band] + fl.dy, target.b, e), lerp(fl.len, cell * 0.86, e), lerp(2, cell * 0.86, e), col);
        return true;
      });
    }

    // the picked quadrant, edged in zari
    for (let q = 0; q < 4; q++) {
      if (morph[q] < 0.02) continue;
      const qx = g.gx0 + (q % 2) * size / 2, qy = g.gy0 + Math.floor(q / 2) * size / 2, s2 = size / 2;
      const z = withAlpha(COLORS.zari, morph[q]);
      r.line(qx, qy, qx + s2, qy, 2, z); r.line(qx, qy + s2, qx + s2, qy + s2, 2, z);
      r.line(qx, qy, qx, qy + s2, 2, z); r.line(qx + s2, qy, qx + s2, qy + s2, 2, z);
    }
    r.flush();
  };
}

// ───────────────────────── chains: laced punch cards ─────────────────────────

function chains(): Scene {
  const patterns = new Map<number, [number, number]>();
  const pattern = (k: number): [number, number] => {
    if (patterns.has(k)) return patterns.get(k)!;
    // each card is hashed from the one before it
    const prev = k <= 0 ? [0x2545f491, 0x9e3779b9] : pattern(k - 1);
    const p: [number, number] = [mix(prev[0] ^ Math.imul(k, 0x9e3779b9)), mix(prev[1] + k)];
    patterns.set(k, p);
    return p;
  };
  return (r, f) => {
    const { w, h, t } = f;
    const ch = Math.min(h * 0.6, f.mobile ? 210 : 280);
    const cw = ch * 0.62;
    const gap = cw * 0.34;
    const pitch = cw + gap;
    const offset = (f.reduced ? 0 : t * 0.02) + f.progress * pitch * 4;
    const y = h * 0.5;
    const head = w * 0.68;
    r.clear(COLORS.warp);
    const first = Math.floor((offset - w * 0.2) / pitch) - 1;
    const last = first + Math.ceil(w / pitch) + 3;
    for (let k = Math.max(0, first); k <= last; k++) {
      const cx = k * pitch - offset + w * 0.1;
      if (cx < -pitch || cx > w + pitch) continue;
      const near = 1 - clamp(Math.abs(cx - head) / pitch);
      // lacing to the next card
      const nx = cx + pitch;
      for (const ly of [y - ch * 0.3, y + ch * 0.3]) {
        r.line(cx + cw / 2, ly, nx - cw / 2, ly, 2, COLORS.zari);
        const mid = (cx + nx) / 2;
        r.line(mid - 6, ly - 6, mid + 6, ly + 6, 1.5, COLORS.zari);
        r.line(mid - 6, ly + 6, mid + 6, ly - 6, 1.5, COLORS.zari);
      }
      // card body and border
      r.rect(cx, y, cw, ch, COLORS.card);
      const bc = withAlpha(COLORS.web3, 0.55 + 0.45 * near);
      r.rect(cx, y - ch / 2, cw, 2, bc);
      r.rect(cx, y + ch / 2, cw, 2, bc);
      r.rect(cx - cw / 2, y, 2, ch, bc);
      r.rect(cx + cw / 2, y, 2, ch, bc);
      if (near > 0.5) r.rect(cx, y - ch / 2 + 8, cw - 8, 10, withAlpha(COLORS.web3, near));
      // punched holes: 5 × 9, from the card's hash
      const [a, b] = pattern(k);
      const hw = cw / 7, hh = ch / 13;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 5; col++) {
          const bit = row * 5 + col;
          const on = bit < 32 ? (a >>> bit) & 1 : (b >>> (bit - 32)) & 1;
          const hx = cx - cw / 2 + hw * (col + 1.5);
          const hy = y - ch / 2 + hh * (row + 2.6);
          r.rect(hx, hy, hw * 0.55, hh * 0.5, on ? COLORS.warp : withAlpha(COLORS.threadHi, 0.55));
        }
      }
    }
    r.flush();
  };
}

// ───────────────────────── agents: my assistant stack inside its privacy boundary ─────────────────────────
// Positions are polar around the boundary's centre, as I drew it: memory on top, the
// agent to the right, notes below, the isolated vault to the left, me in the middle.
const AGENT_POS: Record<string, [number, number]> = {
  me: [0, 0],
  honcho: [-90, 0.72],
  hermes: [0, 0.64],
  silverbullet: [90, 0.72],
  obsidian: [180, 0.64],
  paperclip: [135, 0.58],
  ollama: [-150, 0.76],
  opencode: [-38, 1.22],
};
export const AGENT_EDGES: { from: string; to: string; both: boolean; label?: string }[] = [
  { from: "ollama", to: "honcho", both: false, label: "local models" },
  { from: "opencode", to: "hermes", both: false, label: "ZDR endpoint" },
  { from: "me", to: "hermes", both: true },
  { from: "me", to: "obsidian", both: true },
  { from: "hermes", to: "honcho", both: true },
  { from: "hermes", to: "silverbullet", both: true },
  { from: "me", to: "paperclip", both: false },
];

const AGENT_INSIDE = (id: string) => id !== "opencode";

export function agentsLayout(w: number, h: number) {
  const tall = w < 560 && h > w * 0.9;
  const R = tall ? Math.min(w * 0.44, h * 0.34) : Math.min(w * 0.4, h * 0.42);
  const cx = w / 2, cy = h * (tall ? 0.55 : 0.54);
  const pos: Record<string, { x: number; y: number }> = {};
  for (const [id, [d0, k0]] of Object.entries(AGENT_POS)) {
    // on phones the two outside services sit above the ring rather than beside it
    const deg = tall && id === "opencode" ? -50 : d0;
    const k = tall && !AGENT_INSIDE(id) ? 1.24 : k0;
    const a = (deg * Math.PI) / 180;
    pos[id] = { x: cx + Math.cos(a) * R * k, y: cy + Math.sin(a) * R * k };
  }
  return { R, cx, cy, pos, tall };
}

function agents(): Scene {
  return (r, f) => {
    const { w, h, t } = f;
    const { R, cx, cy, pos, tall } = agentsLayout(w, h);
    const T = f.reduced ? 0 : t;
    r.clear(COLORS.warp);

    // inside the boundary: a faint warp, the cloth of my own network
    for (let x = cx - R + 7; x < cx + R; x += 14) {
      const half = Math.sqrt(Math.max(0, R * R - (x - cx) ** 2));
      r.line(x, cy - half, x, cy + half, 1, withAlpha(COLORS.thread, 0.9));
    }
    // the privacy boundary: a woven ring, over and under
    const segs = 140;
    for (let i = 0; i < segs; i++) {
      if (i % 4 === 3) continue;
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 0.8) / segs) * Math.PI * 2;
      r.line(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, i % 2 ? 4 : 2.5, COLORS.web3);
    }

    // connections, and the traffic on them
    AGENT_EDGES.forEach((e, k) => {
      const a = pos[e.from], b = pos[e.to];
      woven(r, a.x, a.y, b.x, b.y, 1.6, withAlpha(COLORS.threadHi, 1));
      const lanes = e.both ? [0, 1] : [0];
      lanes.forEach((dir) => {
        for (let p = 0; p < 2; p++) {
          const ph = f.reduced ? (0.3 + 0.4 * p) : (T / 1300 + k * 0.21 + p * 0.5 + dir * 0.25) % 1;
          const from = dir ? b : a, to = dir ? a : b;
          const x = lerp(from.x, to.x, ph), y = lerp(from.y, to.y, ph);
          // traffic from outside wears saffron until it crosses the boundary
          const outside = Math.hypot(x - cx, y - cy) > R;
          r.rect(x, y, 6, 6, outside ? COLORS.web3 : COLORS.bone);
        }
      });
    });

    // hermes spawns subagents for parallel work: they bud off, work, and fold back in
    const hm = pos.hermes;
    for (let i = 0; i < 3; i++) {
      const life = f.reduced ? 0.5 : ((T / 2400 + i / 3) % 1);
      const grow = Math.sin(life * Math.PI);
      const ang = ((150 + i * 30) * Math.PI) / 180;
      const d = 30 + 34 * grow;
      const x = hm.x + Math.cos(ang) * d, y = hm.y + Math.sin(ang) * d;
      r.line(hm.x, hm.y, x, y, 1, withAlpha(COLORS.ai, 0.6 * grow));
      r.rect(x, y, 8 * grow + 1, 8 * grow + 1, withAlpha(COLORS.ai, grow));
    }
    // paperclip's company of agents: an org chart around it. Goals travel out along the
    // reporting lines in zari, heartbeats come back in green, and each agent's budget drains and refills.
    const pc = pos.paperclip;
    const team = 5;
    const rx = tall ? 50 : Math.max(R * 0.3, 74), ry = tall ? 32 : Math.max(R * 0.22, 50);
    const sq = tall ? 11 : 16;
    const spin = T / 9000;
    // the team's orbit, so the company reads as one group
    for (let i = 0; i < 48; i++) {
      if (i % 2) continue;
      const a0 = (i / 48) * Math.PI * 2, a1 = ((i + 1) / 48) * Math.PI * 2;
      r.line(pc.x + Math.cos(a0) * rx, pc.y + Math.sin(a0) * ry, pc.x + Math.cos(a1) * rx, pc.y + Math.sin(a1) * ry, 1, withAlpha(COLORS.sre, 0.45));
    }
    const members = Array.from({ length: team }, (_, i) => {
      const ang = spin + (i / team) * Math.PI * 2;
      return { x: pc.x + Math.cos(ang) * rx, y: pc.y + Math.sin(ang) * ry };
    });
    members.forEach((m, i) => {
      const nx = members[(i + 1) % team];
      r.line(m.x, m.y, nx.x, nx.y, 1, withAlpha(COLORS.sre, 0.35)); // the team, talking among itself
      woven(r, pc.x, pc.y, m.x, m.y, 1.4, COLORS.threadHi); // reporting line
      const goal = f.reduced ? 0.45 : (T / 1500 + i * 0.2) % 1;
      const beat = f.reduced ? 0.7 : (T / 1100 + i * 0.37) % 1;
      r.rect(lerp(pc.x, m.x, goal), lerp(pc.y, m.y, goal), 5, 5, COLORS.zari);
      r.rect(lerp(m.x, pc.x, beat), lerp(m.y, pc.y, beat), 5, 5, COLORS.sre);
      r.rect(m.x, m.y, sq, sq, COLORS.sre);
      r.rect(m.x, m.y, sq * 0.5, sq * 0.5, COLORS.warp);
      const budget = f.reduced ? 0.6 : 1 - ((T / (5000 + i * 900)) % 1);
      const bw = sq * 1.4;
      r.rect(m.x - bw / 2 + (bw / 2) * budget, m.y + sq * 0.9, bw * budget, 2.5, COLORS.zari);
    });
    r.flush();
  };
}

// ───────────────────────── converge: three wefts weave a network ─────────────────────────
const LAYERS = [3, 5, 6, 1];
const LAYER_A = [0.46, 0.59, 0.71, 0.83];
// tall stages need more room between layers, and the threads meet higher up
const LAYER_A_TALL = [0.4, 0.55, 0.69, 0.87];
// the clock runs from here to 1: threads enter, the network weaves, then pulses run forever
export const CONVERGE_FROM = -0.35;
export const convergePoint = (horizontal: boolean) => (horizontal ? CONVERGE_POINT : 0.27);
// each node's domain colours the weft leaving it (0 sre, 1 ai, 2 web3, 3 zari)
export const NET = [
  [{ full: "reliability", short: "sre", d: 0 }, { full: "models", short: "ai", d: 1 }, { full: "chains", short: "web3", d: 2 }],
  [
    { full: "xdp filter", short: "xdp", d: 0 },
    { full: "logsonar", short: "sonar", d: 1 },
    { full: "observability", short: "lgtm", d: 0 },
    { full: "rpc ops", short: "rpc", d: 2 },
    { full: "validator", short: "valid", d: 2 },
  ],
  [
    { full: "mcp agent", short: "mcp", d: 1 },
    { full: "hermes agent", short: "hermes", d: 1 },
    { full: "radar classifier", short: "radar", d: 1 },
    { full: "hinglish svm", short: "svm", d: 1 },
    { full: "calorie-vision", short: "vision", d: 1 },
    { full: "credit dapp", short: "defi", d: 2 },
  ],
  [{ full: "vishal", short: "vishal", d: 3 }],
];
export const CONVERGE_POINT = 0.32;

// normalized (flow a, cross b) → screen fraction; vertical flow on tall screens
export function convergeNodes(horizontal: boolean) {
  // tall screens flow downward and need wider rows so labels never collide
  const spacing = horizontal ? [0.13, 0.13, 0.12, 0.13] : [0.3, 0.16, 0.15, 0.16];
  return LAYERS.map((n, li) =>
    Array.from({ length: n }, (_, k) => ({ a: (horizontal ? LAYER_A : LAYER_A_TALL)[li], b: 0.5 + (k - (n - 1) / 2) * spacing[li] })),
  );
}
export const toScreen = (a: number, b: number, horizontal: boolean) =>
  horizontal ? { x: a, y: b } : { x: b, y: a };

function converge(): Scene {
  return (r, f) => {
    const { w, h, t } = f;
    // left-to-right only when there's real width for five chips per layer
    const horizontal = w >= 560 && w > h * 1.05;
    const P = (a: number, b: number) => {
      const s = toScreen(a, b, horizontal);
      return [s.x * w, s.y * h] as const;
    };
    // played on a clock by the page (Converge.tsx), not scrubbed by scroll
    const p = f.reduced ? 1 : f.ext.play ?? CONVERGE_FROM;
    const weave = f.reduced ? 1 : smooth(CONVERGE_FROM, 0.38, p);
    const net = smooth(0.38, 0.86, p);
    r.clear(COLORS.warp);

    // faint warp behind everything, across the flow
    const warpN = f.mobile ? 18 : 34;
    for (let i = 0; i < warpN; i++) {
      const b = (i + 0.5) / warpN;
      const [x1, y1] = P(0, b), [x2, y2] = P(1, b);
      r.line(x1, y1, x2, y2, 1, withAlpha(COLORS.thread, 0.7));
    }

    // three wefts sweep in to the fixed point
    const F = P(convergePoint(horizontal), 0.5);
    const starts = horizontal ? [0.2, 0.5, 0.8] : [0.12, 0.5, 0.88];
    starts.forEach((b0, i) => {
      const steps = 40;
      const upto = Math.floor(steps * weave);
      let [px, py] = P(0, b0);
      for (let s = 1; s <= upto; s++) {
        const u = s / steps;
        const a = convergePoint(horizontal) * u;
        const b = lerp(b0, 0.5, u * u * (3 - 2 * u));
        const [x, y] = P(a, b);
        r.line(px, py, x, y, 5, WEFT[i]);
        px = x; py = y;
      }
    });

    const nodes = convergeNodes(horizontal);
    const scr = nodes.map((col) => col.map((n) => P(n.a, n.b)));
    // edges appear layer by layer, woven in the colour of the work they leave
    const tone = (d: number) => (d === 3 ? COLORS.zari : WEFT[d]);
    const edgeAlpha = (li: number) => clamp(net * 4 - li);
    scr[0].forEach(([x, y], i) => woven(r, F[0], F[1], x, y, 3, withAlpha(WEFT[i], edgeAlpha(0))));
    for (let li = 0; li < scr.length - 1; li++) {
      const al = edgeAlpha(li + 1);
      if (al <= 0) continue;
      scr[li].forEach(([ax, ay], ai) =>
        scr[li + 1].forEach(([bx, by], bi) => {
          // strongest where the two ends share a domain
          const same = NET[li][ai].d === NET[li + 1][bi].d || li === scr.length - 2;
          woven(r, ax, ay, bx, by, same ? 2 : 1.2, withAlpha(tone(NET[li][ai].d), al * (same ? 0.85 : 0.32)));
        }),
      );
    }
    // signal pulses once the network is whole
    if (net >= 1 && !f.reduced) {
      // every input fires, not just the first; each pulse wears its source's colour
      for (let q = 0; q < 18; q++) {
        const li = q % 3;
        const fi = Math.floor(q / 3) % scr[li].length;
        const from = scr[li][fi];
        const to = scr[li + 1][(q * 3 + fi) % scr[li + 1].length];
        const k = (t / 820 + q * 0.13) % 1;
        const c = li === 0 ? WEFT[fi % 3] : tone(NET[li][fi].d);
        r.rect(lerp(from[0], to[0], k), lerp(from[1], to[1], k), 6, 6, c);
      }
      // and the three threads keep feeding the fixed point
      starts.forEach((b0, i) => {
        const k = (t / 820 + i * 0.33) % 1;
        const u = k;
        const [x, y] = P(convergePoint(horizontal) * u, lerp(b0, 0.5, u * u * (3 - 2 * u)));
        r.rect(x, y, 7, 7, WEFT[i]);
      });
    }
    // nodes are drawn by the page as solid chips, so nothing shows through their words
    // the fixed point
    r.rect(F[0], F[1], 12, 12, COLORS.zari, Math.PI / 4);
    r.flush();
  };
}

// an edge drawn as weft: over-runs broken by the warp it passes under
function woven(r: Renderer, x1: number, y1: number, x2: number, y2: number, width: number, c: RGBA) {
  if (c[3] <= 0) return;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const run = 10, gap = 4;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  for (let d = 0; d < len; d += run + gap) {
    const e = Math.min(len, d + run);
    r.line(x1 + ux * d, y1 + uy * d, x1 + ux * e, y1 + uy * e, width, c);
  }
}

export const SCENES: Record<SceneName, () => Scene> = { hero, home, reliability, models, chains, converge, agents };
