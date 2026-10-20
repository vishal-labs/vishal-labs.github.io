// A tiny batched renderer for the loom: every thread, weft, shuttle and node
// is a rotated rectangle. WebGL2 instancing when available, canvas 2D otherwise.

export type RGBA = readonly [number, number, number, number];

export interface Renderer {
  readonly kind: "webgl2" | "2d";
  resize(width: number, height: number, dpr: number): void;
  clear(color: RGBA): void;
  /** Zoom everything drawn this frame by `scale` around (ox, oy). Reset by clear(). */
  view(scale: number, ox: number, oy: number): void;
  rect(cx: number, cy: number, w: number, h: number, color: RGBA, angle?: number): void;
  line(x1: number, y1: number, x2: number, y2: number, width: number, color: RGBA): void;
  flush(): void;
  dispose(): void;
}

export function hex(value: string, alpha = 1): RGBA {
  const n = parseInt(value.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, alpha];
}

export function withAlpha(c: RGBA, alpha: number): RGBA {
  return [c[0], c[1], c[2], alpha];
}

const FLOATS = 9; // cx, cy, w, h, angle, r, g, b, a
const MAX_INSTANCES = 24000;

const VS = `#version 300 es
in vec2 aPos;
in vec2 iCenter;
in vec2 iSize;
in float iAngle;
in vec4 iColor;
uniform vec2 uRes;
uniform vec3 uView;
out vec4 vColor;
void main() {
  float c = cos(iAngle), s = sin(iAngle);
  vec2 p = aPos * iSize;
  p = vec2(p.x * c - p.y * s, p.x * s + p.y * c) + iCenter;
  p = (p - uView.yz) * uView.x + uView.yz;
  vec2 clip = (p / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vColor = iColor;
}`;

const FS = `#version 300 es
precision mediump float;
in vec4 vColor;
out vec4 outColor;
void main() { outColor = vec4(vColor.rgb * vColor.a, vColor.a); }`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
  return sh;
}

function createWebGL(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext("webgl2", { antialias: true, premultipliedAlpha: true, alpha: false });
  if (!gl) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const quad = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const data = new Float32Array(MAX_INSTANCES * FLOATS);
  const inst = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, inst);
  gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
  const stride = FLOATS * 4;
  const attrs: [string, number, number][] = [["iCenter", 2, 0], ["iSize", 2, 2], ["iAngle", 1, 4], ["iColor", 4, 5]];
  for (const [name, size, offset] of attrs) {
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset * 4);
    gl.vertexAttribDivisor(loc, 1);
  }
  const uRes = gl.getUniformLocation(prog, "uRes");
  const uView = gl.getUniformLocation(prog, "uView");
  let view: [number, number, number] = [1, 0, 0];

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  let count = 0;
  let w = 1;
  let h = 1;

  const push = (cx: number, cy: number, rw: number, rh: number, a: number, c: RGBA) => {
    if (count >= MAX_INSTANCES) return;
    const o = count * FLOATS;
    data[o] = cx; data[o + 1] = cy; data[o + 2] = rw; data[o + 3] = rh; data[o + 4] = a;
    data[o + 5] = c[0]; data[o + 6] = c[1]; data[o + 7] = c[2]; data[o + 8] = c[3];
    count++;
  };

  return {
    kind: "webgl2",
    resize(width, height, dpr) {
      w = width; h = height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    clear(c) {
      gl.clearColor(c[0], c[1], c[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      count = 0;
      view = [1, 0, 0];
    },
    view(scale, ox, oy) { view = [scale, ox, oy]; },
    rect(cx, cy, rw, rh, c, angle = 0) { push(cx, cy, rw, rh, angle, c); },
    line(x1, y1, x2, y2, width, c) {
      const dx = x2 - x1, dy = y2 - y1;
      push((x1 + x2) / 2, (y1 + y2) / 2, Math.hypot(dx, dy), width, Math.atan2(dy, dx), c);
    },
    flush() {
      gl.useProgram(prog);
      gl.uniform2f(uRes, w, h);
      gl.uniform3f(uView, view[0], view[1], view[2]);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, count * FLOATS);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      count = 0;
    },
    dispose() {
      gl.deleteBuffer(quad); gl.deleteBuffer(inst); gl.deleteVertexArray(vao); gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

function create2D(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext("2d")!;
  const css = (c: RGBA) => `rgba(${c[0] * 255},${c[1] * 255},${c[2] * 255},${c[3]})`;
  let ratio = 1;
  return {
    kind: "2d",
    resize(width, height, dpr) {
      ratio = dpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    clear(c) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = css(c);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    },
    view(scale, ox, oy) {
      ctx.setTransform(ratio * scale, 0, 0, ratio * scale, ratio * (ox - ox * scale), ratio * (oy - oy * scale));
    },
    rect(cx, cy, rw, rh, c, angle = 0) {
      ctx.fillStyle = css(c);
      if (!angle) { ctx.fillRect(cx - rw / 2, cy - rh / 2, rw, rh); return; }
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); ctx.fillRect(-rw / 2, -rh / 2, rw, rh); ctx.restore();
    },
    line(x1, y1, x2, y2, width, c) {
      ctx.strokeStyle = css(c); ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    },
    flush() {},
    dispose() {},
  };
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  try {
    return createWebGL(canvas) ?? create2D(canvas);
  } catch {
    return create2D(canvas);
  }
}
