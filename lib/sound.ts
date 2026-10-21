// The loom's sound: off by default, synthesised (no files), and only ever started by the
// reader. Scenes call cue() and hum(); both do nothing until sound is switched on.

const KEY = "loom-sound";
let on = false;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let humGain: GainNode | null = null;
let humOsc: OscillatorNode[] = [];
let humSeen = 0;
const listeners = new Set<(on: boolean) => void>();

function stored() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}
function store(v: boolean) {
  try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* private mode: just don't remember */ }
}

// browsers only allow audio after a gesture, so the context is built on the toggle itself
function ensure() {
  if (ctx) { if (ctx.state === "suspended") void ctx.resume(); return ctx; }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  // the rings' hum: two soft partials under a low-pass, silent until the spin builds
  humGain = ctx.createGain();
  humGain.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 700;
  humGain.connect(lp).connect(master);
  humOsc = [0, 1].map((k) => {
    const o = ctx!.createOscillator();
    o.type = k ? "sine" : "triangle";
    o.frequency.value = k ? 110.6 : 55;
    o.connect(humGain!);
    o.start();
    return o;
  });
  // a scene that scrolls away stops calling hum(), so its hum fades on its own
  window.setInterval(() => {
    if (humGain && ctx && performance.now() - humSeen > 180) humGain.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
  }, 200);
  return ctx;
}

export const sound = {
  get on() { return on; },
  init() {
    on = stored();
    // remembered as on: wake the context on the reader's first touch or key
    if (on) {
      const wake = () => { ensure(); removeEventListener("pointerdown", wake); removeEventListener("keydown", wake); };
      addEventListener("pointerdown", wake);
      addEventListener("keydown", wake);
    }
    listeners.forEach((f) => f(on));
  },
  toggle() {
    on = !on;
    store(on);
    if (on) { ensure(); cue("clack"); }
    else if (humGain && ctx) humGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    listeners.forEach((f) => f(on));
  },
  subscribe(f: (on: boolean) => void) {
    listeners.add(f);
    return () => { listeners.delete(f); };
  },
};

export function cue(name: "clack" | "chime", variant = 0) {
  if (!on || !ctx || !master || !noise || ctx.state !== "running") return;
  const t = ctx.currentTime;
  if (name === "clack") {
    // the shuttle landing: a short knock of filtered noise over a low thump
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = variant ? 1500 : 1800;
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    src.connect(bp).connect(g).connect(master);
    src.start(t, Math.random() * 0.15, 0.08);
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.05);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(og).connect(master);
    o.start(t);
    o.stop(t + 0.08);
  } else {
    // the network resolving to its answer: two partials, a slow decay
    [523.25, 784].forEach((f, k) => {
      const o = ctx!.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx!.createGain();
      g.gain.setValueAtTime(0.0001, t + k * 0.09);
      g.gain.exponentialRampToValueAtTime(0.05, t + k * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.09 + 1.8);
      o.connect(g).connect(master!);
      o.start(t + k * 0.09);
      o.stop(t + k * 0.09 + 1.9);
    });
  }
}

/** The rings' hum follows their speed: 0 at rest, 1 at the top of the spin. */
export function hum(level: number) {
  if (!on || !ctx || !humGain || ctx.state !== "running") return;
  humSeen = performance.now();
  const t = ctx.currentTime;
  humGain.gain.setTargetAtTime(0.045 * level ** 0.8, t, 0.08);
  humOsc[0].frequency.setTargetAtTime(55 + 40 * level, t, 0.1);
  humOsc[1].frequency.setTargetAtTime(110.6 + 80 * level, t, 0.1);
}
