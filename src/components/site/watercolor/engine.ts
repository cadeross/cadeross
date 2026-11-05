import {
  COMPOSITE,
  MAX_DABS,
  PALETTE,
  PAPER_COLOR,
  PAPER_DATA,
  SIM,
  VERT,
} from "./shaders";
import { Player, type Composition, type Dab, type Region } from "./strokes";

/* Runs the watercolor on a canvas: the paper, the wet-paint simulation,
   the palette that bleeds from one project's colours to the next, and the
   final picture. Everything outside the painting's region stays untouched
   paper, so the work is scissored to it. Idle (dry, settled) it stops
   drawing altogether. */

export const TILE_CSS = 512; // CSS pixels per paper tile
const TILE_PX = 1024;
const SIM_SCALE = 0.62; // simulation cells per CSS pixel
const STEP = 1 / 120; // seconds per simulation step
const DRY_AFTER = 7; // seconds for the wettest stroke to dry
export const PAPER_BASE: [number, number, number] = [0.957, 0.937, 0.894]; // #f4efe4

type Program = {
  prog: WebGLProgram;
  u: (name: string) => WebGLUniformLocation | null;
};

type Target = { fb: WebGLFramebuffer; tex: WebGLTexture[] };

export type Engine = {
  resize: (w: number, h: number, region: Region) => void;
  /* Absorbance per stop, 4 × rgb. */
  palette: (k: number[][], origin: { x: number; y: number } | null, instant?: boolean) => void;
  paint: (c: Composition) => void;
  dab: (d: Dab) => void;
  wash: (seconds: number) => void;
  /* Runs a composition to dry, without drawing in between. */
  paintInstant: (c: Composition) => void;
  clearPaint: () => void;
  paperURL: () => Promise<string | null>;
  destroy: () => void;
  region: () => Region;
};

function compile(gl: WebGL2RenderingContext, frag: string): Program | null {
  const make = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("[watercolor]", gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  };
  const vs = make(gl.VERTEX_SHADER, VERT);
  const fs = make(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, "a_pos");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("[watercolor]", gl.getProgramInfoLog(prog));
    return null;
  }
  const cache = new Map<string, WebGLUniformLocation | null>();
  return {
    prog,
    u: (name) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
      return cache.get(name)!;
    },
  };
}

export function createEngine(
  canvas: HTMLCanvasElement,
  { reduced }: { reduced: () => boolean },
): Engine | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;
  const floatOK = !!gl.getExtension("EXT_color_buffer_float");
  const halfOK = floatOK || !!gl.getExtension("EXT_color_buffer_half_float");
  if (!halfOK) return null;
  // 32-bit state keeps the tiny per-step settling exact; fall back to half.
  const linear32 = !!gl.getExtension("OES_texture_float_linear");
  const use32 = floatOK && linear32;
  const internal = use32 ? gl.RGBA32F : gl.RGBA16F;
  const type = use32 ? gl.FLOAT : gl.HALF_FLOAT;

  const programs = {
    paperData: compile(gl, PAPER_DATA),
    paperColor: compile(gl, PAPER_COLOR),
    sim: compile(gl, SIM),
    pal: compile(gl, PALETTE),
    comp: compile(gl, COMPOSITE),
  };
  if (Object.values(programs).some((p) => !p)) return null;
  const P = programs as Record<keyof typeof programs, Program>;

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const texture = (
    w: number,
    h: number,
    fmt: { internal: number; format: number; type: number },
    filter: number,
    wrap: number,
  ) => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internal, w, h, 0, fmt.format, fmt.type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return tex;
  };

  const target = (w: number, h: number, n: number, fmt: Parameters<typeof texture>[2], filter: number): Target => {
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const tex: WebGLTexture[] = [];
    for (let i = 0; i < n; i++) {
      const t = texture(w, h, fmt, filter, gl.CLAMP_TO_EDGE);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0);
      tex.push(t);
    }
    gl.drawBuffers(tex.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    return { fb, tex };
  };

  const rgba8 = { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE };
  const rgbaF = { internal, format: gl.RGBA, type };

  /* ── Paper ─────────────────────────────────────────────────────────── */
  const paperFB = gl.createFramebuffer()!;
  const paperTex = texture(TILE_PX, TILE_PX, rgba8, gl.LINEAR, gl.REPEAT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, paperFB);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, paperTex, 0);
  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
  gl.viewport(0, 0, TILE_PX, TILE_PX);
  gl.disable(gl.SCISSOR_TEST);
  gl.useProgram(P.paperData.prog);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  /* ── State ─────────────────────────────────────────────────────────── */
  let cw = 1; // canvas, device px
  let ch = 1;
  let cssH = 1;
  let dpr = 1;
  let sw = 1; // simulation cells
  let sh = 1;
  let region: Region = { x0: 0, y0: 0, x1: 1, y1: 1 };
  let sim: [Target, Target] | null = null;
  let pal: [Target, Target] | null = null;
  let k: number[][] = [
    [0.3, 0.3, 0.3],
    [0.8, 0.8, 0.8],
    [1.6, 1.6, 1.6],
    [0.6, 0.6, 0.6],
  ];
  const front = { x: 0, y: 0, r: 0, w: 1, active: false, start: 0, speed: 1 };
  let palReset = true;

  const player = new Player();
  const queued: Dab[] = [];
  let wetUntil = 0;
  let washLeft = 0;
  let washRate = 0;
  let dirty = true;
  let clock = 0;
  let raf = 0;
  let last = performance.now();
  let acc = 0;

  const da = new Float32Array(MAX_DABS * 4);
  const db = new Float32Array(MAX_DABS * 4);
  const dc = new Float32Array(MAX_DABS * 4);

  const freeTargets = () => {
    for (const pair of [sim, pal]) {
      pair?.forEach((t) => {
        t.tex.forEach((tx) => gl.deleteTexture(tx));
        gl.deleteFramebuffer(t.fb);
      });
    }
  };

  const clearTarget = (t: Target, values: number[][]) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
    values.forEach((v, i) => gl.clearBufferfv(gl.COLOR, i, v));
  };

  /* Region in simulation cells, GL-up. */
  const simRegion = () => [
    region.x0 * SIM_SCALE,
    (cssH - region.y1) * SIM_SCALE,
    region.x1 * SIM_SCALE,
    (cssH - region.y0) * SIM_SCALE,
  ];

  /* Scissor to the region (plus its ragged margin), in a target's pixels. */
  const scissor = (scaleX: number, scaleY: number, h: number) => {
    const m = 40;
    const x = Math.max(0, Math.floor((region.x0 - m) * scaleX));
    const y = Math.max(0, Math.floor((cssH - region.y1 - m) * scaleY));
    const x2 = Math.ceil((region.x1 + m) * scaleX);
    const y2 = Math.ceil((cssH - region.y0 + m) * scaleY);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, Math.max(0, x2 - x), Math.max(0, Math.min(h, y2) - y));
  };

  const bindTex = (unit: number, tex: WebGLTexture, loc: WebGLUniformLocation | null) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  };

  const paperUniforms = (p: Program) => {
    gl.uniform2f(p.u("u_res"), sw, sh);
    gl.uniform1f(p.u("u_scale"), SIM_SCALE);
    gl.uniform1f(p.u("u_tile"), TILE_CSS);
    gl.uniform4fv(p.u("u_region"), simRegion());
  };

  /* One simulation step, with up to MAX_DABS new marks. */
  const step = (dabs: Dab[]) => {
    if (!sim) return;
    const [src, dst] = sim;
    const p = P.sim;
    gl.useProgram(p.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.viewport(0, 0, sw, sh);
    scissor(SIM_SCALE, SIM_SCALE, sh);
    bindTex(0, src.tex[0], p.u("u_s0"));
    bindTex(1, src.tex[1], p.u("u_s1"));
    bindTex(2, src.tex[2], p.u("u_s2"));
    bindTex(3, paperTex, p.u("u_paper"));
    paperUniforms(p);
    gl.uniform1f(p.u("u_h"), STEP);
    gl.uniform1f(p.u("u_evap"), 0.16);
    gl.uniform1f(p.u("u_wash"), washLeft > 0 ? washRate : 0);
    const n = Math.min(MAX_DABS, dabs.length);
    for (let i = 0; i < n; i++) {
      const d = dabs[i];
      da[i * 4] = d.x * SIM_SCALE;
      da[i * 4 + 1] = (cssH - d.y) * SIM_SCALE;
      da[i * 4 + 2] = Math.max(0.8, d.r * SIM_SCALE);
      da[i * 4 + 3] = d.water;
      db.set(d.load, i * 4);
      dc[i * 4] = d.lift;
      dc[i * 4 + 1] = d.dry;
      dc[i * 4 + 2] = d.squash ?? 1;
      dc[i * 4 + 3] = 0;
    }
    gl.uniform1i(p.u("u_n"), n);
    if (n) {
      gl.uniform4fv(p.u("u_da"), da);
      gl.uniform4fv(p.u("u_db"), db);
      gl.uniform4fv(p.u("u_dc"), dc);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    sim = [dst, src];
  };

  const palStep = (dt: number) => {
    if (!pal) return;
    const [src, dst] = pal;
    const p = P.pal;
    gl.useProgram(p.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.viewport(0, 0, sw, sh);
    scissor(SIM_SCALE, SIM_SCALE, sh);
    bindTex(0, src.tex[0], p.u("u_p0"));
    bindTex(1, src.tex[1], p.u("u_p1"));
    bindTex(2, src.tex[2], p.u("u_p2"));
    bindTex(3, paperTex, p.u("u_paper"));
    paperUniforms(p);
    gl.uniform3fv(p.u("u_k0"), k[0]);
    gl.uniform3fv(p.u("u_k1"), k[1]);
    gl.uniform3fv(p.u("u_k2"), k[2]);
    gl.uniform3fv(p.u("u_k3"), k[3]);
    if (palReset) {
      gl.uniform4f(p.u("u_front"), 0, 0, 1e6, 1);
      gl.uniform1f(p.u("u_rate"), 1);
    } else {
      gl.uniform4f(p.u("u_front"), front.x, front.y, front.r, front.w);
      gl.uniform1f(p.u("u_rate"), 1 - Math.exp(-dt * 7));
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    pal = [dst, src];
    palReset = false;
  };

  const composite = () => {
    if (!sim || !pal) return;
    const p = P.comp;
    gl.useProgram(p.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cw, ch);
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    scissor(dpr, dpr, ch);
    bindTex(0, sim[0].tex[0], p.u("u_s0"));
    bindTex(1, sim[0].tex[1], p.u("u_s1"));
    bindTex(2, sim[0].tex[2], p.u("u_s2"));
    bindTex(3, pal[0].tex[0], p.u("u_p0"));
    bindTex(4, pal[0].tex[1], p.u("u_p1"));
    bindTex(5, pal[0].tex[2], p.u("u_p2"));
    bindTex(6, paperTex, p.u("u_paper"));
    gl.uniform2f(p.u("u_cres"), cw, ch);
    gl.uniform2f(p.u("u_sres"), sw, sh);
    gl.uniform1f(p.u("u_dpr"), dpr);
    gl.uniform1f(p.u("u_tile"), TILE_CSS);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  /* Feed queued and played dabs into steps, MAX_DABS at a time. */
  const runSteps = (count: number, dabs: Dab[]) => {
    let i = 0;
    for (let s = 0; s < count || i < dabs.length; s++) {
      step(dabs.slice(i, i + MAX_DABS));
      i += MAX_DABS;
      if (washLeft > 0) washLeft -= STEP;
    }
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (document.hidden || !sim) return;
    clock += dt;

    const dabs: Dab[] = queued.splice(0);
    player.advance(dt, dabs);
    if (dabs.length) wetUntil = Math.max(wetUntil, clock + DRY_AFTER);
    if (washLeft > 0) wetUntil = Math.max(wetUntil, clock + 0.5);

    const wet = clock < wetUntil || player.busy;
    if (wet || dabs.length) {
      acc += dt;
      const n = Math.min(6, Math.floor(acc / STEP));
      acc -= n * STEP;
      runSteps(n, dabs);
      dirty = true;
    } else acc = 0;

    if (front.active) {
      front.r = (clock - front.start) * front.speed;
      palStep(dt);
      dirty = true;
      const reach = Math.hypot(sw, sh) + front.w * 3;
      if (front.r > reach && clock - front.start > reach / front.speed + 1.2) front.active = false;
    } else if (palReset) {
      palStep(dt);
      dirty = true;
    }

    if (dirty) {
      composite();
      dirty = false;
    }
  };

  const allocate = () => {
    freeTargets();
    sim = [target(sw, sh, 3, rgbaF, gl.LINEAR), target(sw, sh, 3, rgbaF, gl.LINEAR)];
    pal = [target(sw, sh, 3, rgbaF, gl.LINEAR), target(sw, sh, 3, rgbaF, gl.LINEAR)];
    gl.disable(gl.SCISSOR_TEST);
    const zero = [0, 0, 0, 0];
    sim.forEach((t) => clearTarget(t, [zero, zero, zero]));
    pal.forEach((t) => clearTarget(t, [zero, zero, zero]));
    palReset = true;
    front.active = false;
  };

  const engine: Engine = {
    region: () => region,

    resize(w, h, r) {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      cssH = h;
      region = r;
      cw = Math.max(1, Math.round(w * dpr));
      ch = Math.max(1, Math.round(h * dpr));
      canvas.width = cw;
      canvas.height = ch;
      sw = Math.max(1, Math.round(w * SIM_SCALE));
      sh = Math.max(1, Math.round(h * SIM_SCALE));
      allocate();
      player.clear();
      queued.length = 0;
      dirty = true;
    },

    palette(next, origin, instant) {
      k = next;
      if (instant || reduced()) {
        palReset = true;
        front.active = false;
        return;
      }
      const o = origin ?? { x: region.x0, y: region.y0 };
      front.x = o.x * SIM_SCALE;
      front.y = (cssH - o.y) * SIM_SCALE;
      front.w = 150 * SIM_SCALE;
      front.speed = 1500 * SIM_SCALE;
      front.start = clock;
      front.r = 0;
      front.active = true;
    },

    paint(c) {
      player.load(c);
      wetUntil = Math.max(wetUntil, clock + c.length + DRY_AFTER);
    },

    dab(d) {
      queued.push(d);
    },

    wash(seconds) {
      washLeft = seconds;
      washRate = 3.2;
    },

    paintInstant(c) {
      player.load(c);
      const dt = 1 / 60;
      let t = 0;
      while (player.busy && t < 12) {
        const dabs: Dab[] = [];
        player.advance(dt, dabs);
        runSteps(2, dabs);
        t += dt;
      }
      // Dry it.
      runSteps(Math.round(DRY_AFTER / STEP), []);
      washLeft = 0;
      wetUntil = clock;
      palReset = true;
      dirty = true;
    },

    clearPaint() {
      if (!sim) return;
      gl.disable(gl.SCISSOR_TEST);
      const zero = [0, 0, 0, 0];
      sim.forEach((t) => clearTarget(t, [zero, zero, zero]));
      player.clear();
      dirty = true;
    },

    async paperURL() {
      // Light the tile once and hand it to CSS as the page's background.
      const fb = gl.createFramebuffer()!;
      const tex = texture(TILE_PX, TILE_PX, rgba8, gl.NEAREST, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      gl.viewport(0, 0, TILE_PX, TILE_PX);
      gl.disable(gl.SCISSOR_TEST);
      const p = P.paperColor;
      gl.useProgram(p.prog);
      bindTex(0, paperTex, p.u("u_data"));
      gl.uniform2f(p.u("u_texel"), 1 / TILE_PX, 1 / TILE_PX);
      gl.uniform3fv(p.u("u_base"), PAPER_BASE);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const px = new Uint8Array(TILE_PX * TILE_PX * 4);
      gl.readPixels(0, 0, TILE_PX, TILE_PX, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.deleteFramebuffer(fb);
      gl.deleteTexture(tex);
      dirty = true;
      const c2 = document.createElement("canvas");
      c2.width = c2.height = TILE_PX;
      const ctx = c2.getContext("2d");
      if (!ctx) return null;
      const img = ctx.createImageData(TILE_PX, TILE_PX);
      const row = TILE_PX * 4;
      for (let y = 0; y < TILE_PX; y++) {
        img.data.set(px.subarray((TILE_PX - 1 - y) * row, (TILE_PX - y) * row), y * row);
      }
      ctx.putImageData(img, 0, 0);
      const blob = await new Promise<Blob | null>((res) => c2.toBlob(res, "image/png"));
      return blob ? URL.createObjectURL(blob) : null;
    },

    destroy() {
      cancelAnimationFrame(raf);
      freeTargets();
      gl.deleteTexture(paperTex);
      gl.deleteFramebuffer(paperFB);
      Object.values(P).forEach((p) => gl.deleteProgram(p.prog));
      // The context is kept: a remount (or React's dev double effect) gets
      // the same one back from the canvas.
    },
  };

  raf = requestAnimationFrame(tick);
  return engine;
}
