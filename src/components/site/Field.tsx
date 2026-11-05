"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  currentPalette,
  onRipple,
  ripple,
  setVoice,
  subscribe,
} from "./fieldStore";
import {
  PALETTES,
  hexToRgb,
  isPaletteKey,
  localHour,
  skyAt,
  type PaletteKey,
} from "./palettes";

/* The field: a column of slow, grainy colour on the right, cut into one
   band per section of the page you're on. The band you're reading opens
   up and carries its name; the rest fold down to slim strips above and
   below it, so the column is also a map of the page. Click a band to go
   there.

   It answers the site as well as the scroll. It takes on the palette of
   the project you're reading or pointing at, leans toward your cursor,
   and sends a ripple of light from the height of whatever you touch:
   a project, a band, the copy button. Moving to another page regroups
   the bands around the new page's sections. */

const MAX_SEGMENTS = 12;
const MAX_RIPPLES = 4;

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_scroll;
uniform float u_dpr;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_paper;
uniform float u_py;
uniform float u_h;
uniform float u_edge;
uniform vec2 u_m0;
uniform vec2 u_m1;
uniform float u_mamt;
uniform float u_pamt;
uniform float u_radius;
uniform int u_count;
uniform vec4 u_seg[${MAX_SEGMENTS}];
uniform vec4 u_rip[${MAX_RIPPLES}];

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(c, vec3(1.0 / 2.2)); }

vec3 ramp(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 a = toLinear(u_c0);
  vec3 b = toLinear(u_c1);
  vec3 c = toLinear(u_c2);
  vec3 d = toLinear(u_c3);
  vec3 col = mix(a, b, smoothstep(0.0, 0.36, t));
  col = mix(col, c, smoothstep(0.30, 0.66, t));
  col = mix(col, d, smoothstep(0.62, 1.0, t));
  return col;
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  // Work in band space: .y runs along the bands (down a column, or across a
  // bar laid along the top), .x runs across them.
  vec2 q = u_h > 0.5 ? px.yx : px;
  vec2 res = u_h > 0.5 ? u_res.yx : u_res;

  // Which band this pixel belongs to, and how far inside it is.
  float d = 1e5;
  float act = 0.0;
  for (int i = 0; i < ${MAX_SEGMENTS}; i++) {
    if (i >= u_count) break;
    vec4 s = u_seg[i];
    float h = max(s.y - s.x, 0.0) * 0.5;
    if (h < 0.5) continue;
    float r = min(u_radius, h);
    float di = sdRoundBox(q - vec2(res.x * 0.5, s.x + h), vec2(res.x * 0.5, h), r);
    if (di < d) { d = di; act = s.z; }
  }
  float alpha = clamp(0.5 - d, 0.0, 1.0);
  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }

  vec2 uv = q / res;
  float y = uv.y;
  float aspect = res.x / res.y;
  vec2 p = vec2(uv.x * aspect, y);
  float t = u_time;

  // Ripples: a soft ring of light spreading from the inner edge.
  float wave = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = u_rip[i];
    if (r.w <= 0.0) continue;
    float dist = length(px - r.xy);
    float front = r.z * 620.0 * u_dpr;
    float width = (70.0 + r.z * 120.0) * u_dpr;
    wave += exp(-pow((dist - front) / width, 2.0)) * r.w * exp(-r.z * 1.5);
  }

  // The cursor, when it's over a whole field: a soft lantern that trails
  // behind fast movement like a comet, lifting the colour toward its
  // lightest note and dragging the pattern along the way it moves.
  float mg = 0.0;
  float halo = 0.0;
  vec2 mv = vec2(0.0);
  if (u_mamt > 0.001) {
    vec2 pa = px - u_m1;
    vec2 ba = u_m0 - u_m1;
    float hh = clamp(dot(pa, ba) / max(dot(ba, ba), 1.0), 0.0, 1.0);
    vec2 dv = pa - ba * hh;
    float R = (170.0 + length(ba) * 0.35 / u_dpr) * u_dpr;
    float d2 = dot(dv, dv);
    mg = exp(-d2 / (R * R)) * u_mamt;
    // A deeper ring just outside the light gives it an edge on pale skies.
    halo = (exp(-d2 / (R * R * 3.2)) * u_mamt - mg) * 0.9;
    mv = ba / res.y;
    p -= mv * mg * 1.6;
  }

  float n1 = snoise(vec3(p * vec2(1.1, 1.35), t * 0.035));
  float n2 = snoise(vec3(p * 2.7 + 7.0, t * 0.05 + 3.0));
  float lean = u_pamt * 0.05 * exp(-pow((y - u_py) * 2.6, 2.0));

  float pos = y * 0.74 + u_scroll * 0.26 + n1 * 0.085 + n2 * 0.03 + lean + wave * 0.1;
  pos += (uv.x - 0.5) * 0.05 * sin(t * 0.07 + y * 2.0);
  pos += halo * 0.22 - mg * 0.24;

  vec3 col = ramp(pos);
  col *= 1.0 + n2 * 0.035;
  col = toSrgb(col);

  // Bands you aren't reading sit back toward the paper.
  col = mix(col, u_paper, 0.24 * (1.0 - act));
  col = mix(col, vec3(1.0), clamp(wave, 0.0, 1.0) * 0.22 + mg * 0.16);
  // A faint inner edge so each band reads as its own piece.
  col *= 1.0 - 0.035 * u_edge * smoothstep(-2.5 * u_dpr, 0.0, d);

  float g = hash(floor(gl_FragCoord.xy / max(u_dpr * 0.75, 1.0))) - 0.5;
  col += g * 0.055;

  gl_FragColor = vec4(col * alpha, alpha);
}
`;

type Section = { id: string | null; label: string };
type Span = { top: number; bottom: number };

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const css = (c: number[]) =>
  `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)})`;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Field() {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const segRefs = useRef<(HTMLElement | null)[]>([]);
  const [sections, setSections] = useState<Section[]>([
    { id: null, label: "" },
  ]);
  const [fallback, setFallback] = useState(false);

  /* Shared with the loop without re-running it. */
  const layout = useRef({
    spans: [{ top: 0, bottom: 1 }] as Span[],
    hover: -1,
  });

  /* ── Colour, bands, ripples and the shader loop ─────────────────── */
  useEffect(() => {
    const root = document.documentElement;
    const panel = panelRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    /* The site's own palette is the sky at the visitor's local time. For a
       preview, ?hour=19.5 pins the clock. */
    const pinned = Number.parseFloat(
      new URLSearchParams(window.location.search).get("hour") ?? "",
    );
    const hour = () => (Number.isFinite(pinned) ? pinned : localHour());
    const resolve = (key: PaletteKey) =>
      key === "cade" ? skyAt(hour()) : PALETTES[key].map(hexToRgb);
    const start = resolve(currentPalette());
    const colors = start.map((c) => [...c]);
    let target = start;
    let lastCss = "";

    const writeCss = () => {
      const next = colors.map(css);
      const key = next.join();
      if (key === lastCss) return;
      lastCss = key;
      next.forEach((value, i) => root.style.setProperty(`--f${i}`, value));
      // Band labels switch to light ink when the field goes dark (night).
      const [r, g, b] = colors[0].map((v, i) => (v + colors[1][i]) / 2);
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      root.style.setProperty(
        "--field-ink",
        lum < 0.42 ? "rgb(255 255 255 / 0.82)" : "rgb(26 27 24 / 0.72)",
      );
    };
    writeCss();

    const unsubscribe = subscribe(() => {
      target = resolve(currentPalette());
    });
    // The sky moves on as the visitor stays.
    const skyTimer = window.setInterval(() => {
      if (currentPalette() === "cade") target = resolve("cade");
    }, 60_000);

    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
    let program: WebGLProgram | null = null;
    if (gl) {
      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      if (vs && fs) {
        program = gl.createProgram()!;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) program = null;
      }
    }
    if (!gl || !program) setFallback(true);

    let uniforms: Record<string, WebGLUniformLocation | null> = {};
    if (gl && program) {
      gl.useProgram(program);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const loc = gl.getAttribLocation(program, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      uniforms = Object.fromEntries(
        [
          "u_res",
          "u_time",
          "u_scroll",
          "u_dpr",
          "u_c0",
          "u_c1",
          "u_c2",
          "u_c3",
          "u_paper",
          "u_py",
          "u_h",
          "u_edge",
          "u_m0",
          "u_m1",
          "u_mamt",
          "u_pamt",
          "u_radius",
          "u_count",
          "u_seg",
          "u_rip",
        ].map((n) => [n, gl.getUniformLocation(program!, n)]),
      );
    }

    /* Band geometry depends on the breakpoint; the CSS owns it. */
    let dpr = 1;
    let gap = 6;
    let radius = 12;
    let panelH = 1; // length along the bands
    let across = 1; // thickness across them
    let horizontal = false;
    let whole = false;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
      const style = getComputedStyle(panel);
      gap = parseFloat(style.getPropertyValue("--seg-gap")) || 6;
      radius = parseFloat(style.getPropertyValue("--seg-radius")) || 0;
      // Some layouts show the field whole, as one unbroken piece of colour.
      whole = style.getPropertyValue("--seg-whole").trim() === "1";
      // A panel wider than it is tall is the bar along the top.
      horizontal = panel.clientWidth > panel.clientHeight * 1.5;
      panelH = horizontal ? panel.clientWidth : panel.clientHeight;
      across = horizontal ? rect.height : rect.width;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    ro.observe(panel);

    let pointerX = 0.5;
    let pointerY = 0.5;
    let pointerAmt = 0;
    let pointerGoal = 0;
    let pointerIdle = 0;
    /* The cursor over a whole field, in panel pixels: a quick follower and
       a slow one, so fast moves stretch the light between them. */
    const cursor = {
      x: 0,
      y: 0,
      over: false,
      fx: 0,
      fy: 0,
      sx: 0,
      sy: 0,
      amt: 0,
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        const r = panel.getBoundingClientRect();
        const wasOver = cursor.over;
        cursor.x = e.clientX - r.left;
        cursor.y = e.clientY - r.top;
        cursor.over =
          cursor.x >= 0 &&
          cursor.x <= r.width &&
          cursor.y >= 0 &&
          cursor.y <= r.height;
        if (cursor.over && !wasOver && cursor.amt < 0.05) {
          // Arrive where the pointer is, not from wherever it left.
          cursor.fx = cursor.sx = cursor.x;
          cursor.fy = cursor.sy = cursor.y;
        }
      }
      pointerX = e.clientX / window.innerWidth;
      pointerY = e.clientY / window.innerHeight;
      pointerGoal = 1;
      window.clearTimeout(pointerIdle);
      pointerIdle = window.setTimeout(() => (pointerGoal = 0), 1400);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    const onLeave = () => (cursor.over = false);
    document.documentElement.addEventListener("pointerleave", onLeave);

    /* Ripples, oldest replaced first. Positions are in panel pixels. */
    const rips: { x?: number; y: number; age: number; strength: number }[] = [];
    const offRipple = onRipple((clientY, strength) => {
      if (reduced.matches) return;
      // Along a column, level with what you touched; along the top bar,
      // at the same share of the way down the window.
      const top = panel.getBoundingClientRect().top;
      const y = horizontal
        ? (clientY / window.innerHeight) * panelH
        : Math.max(0, Math.min(panelH, clientY - top));
      if (rips.length >= MAX_RIPPLES) rips.shift();
      rips.push({ y, age: 0, strength });
    });

    /* Clicking a whole field drops a ripple right where you clicked. */
    const onPanelDown = (e: PointerEvent) => {
      if (!whole || reduced.matches) return;
      const r = panel.getBoundingClientRect();
      if (rips.length >= MAX_RIPPLES) rips.shift();
      rips.push({
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        age: 0,
        strength: 1.6,
      });
    };
    panel.addEventListener("pointerdown", onPanelDown);

    const paperBase = hexToRgb("#f7f7f5");
    const paper = [0, 0, 0];
    const ripData = new Float32Array(MAX_RIPPLES * 4);
    const segData = new Float32Array(MAX_SEGMENTS * 4);
    let edges: Span[] = [];
    let acts: number[] = [];

    let scrollY = window.scrollY;
    let scroll = 0;
    let smoothPy = 0.5;
    let raf = 0;
    let last = performance.now();
    let clock = Math.random() * 100;
    let frame = 0;
    /* On first load, take the page's colour and layout outright. */
    const snapUntil = performance.now() + 300;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.1));
      last = now;
      if (document.hidden) return;
      const snap = reduced.matches || now < snapUntil;

      const vh = window.innerHeight;
      const docH = root.scrollHeight;
      const max = docH - vh;
      const k = snap ? 1 : 1 - Math.exp(-dt * 7);
      scrollY += (window.scrollY - scrollY) * k;
      const progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      const goal = progress;
      scroll += (goal - scroll) * k;

      /* How much of a reading window each section fills. The window
         slides from 40% down the screen to the very bottom as the page
         ends, so short closing sections still get their turn. */
      const { spans: sectionSpans, hover } = layout.current;
      const spans = whole ? [{ top: 0, bottom: docH }] : sectionSpans;
      const n = Math.min(spans.length, MAX_SEGMENTS);
      const half = vh * 0.3;
      const focus = scrollY + vh * 0.4 + progress * vh * 0.6;
      const c = Math.min(Math.max(focus, half), Math.max(half, docH - half));
      const nextActs: number[] = [];
      for (let i = 0; i < n; i++) {
        const s = spans[i];
        const overlap = Math.max(
          0,
          Math.min(s.bottom, c + half) - Math.max(s.top, c - half),
        );
        nextActs.push(Math.min(1, overlap / (half * 2)));
      }

      /* The reading band takes a little over half the column; the rest
         share what's left. A hovered band opens a touch. */
      const share = n > 1 ? 0.56 : 1;
      const K = n > 1 ? (share * n - 1) / (1 - share) : 0;
      const weights = nextActs.map(
        (a, i) => 1 + K * a + (i === hover ? K * 0.14 : 0),
      );
      const total = weights.reduce((x, w) => x + w, 0);
      const free = Math.max(0, panelH - gap * (n - 1));
      const goals: Span[] = [];
      let y = 0;
      for (let i = 0; i < n; i++) {
        const h = (weights[i] / total) * free;
        goals.push({ top: y, bottom: y + h });
        y += h + gap;
      }

      /* Bands glide to their places; new ones grow from the bottom. */
      if (edges.length !== n) {
        edges = goals.map(
          (g, i) => edges[i] ?? { top: panelH, bottom: panelH },
        );
        acts = nextActs.map((a, i) => acts[i] ?? 0);
      }
      const ek = snap ? 1 : 1 - Math.exp(-dt * 9);
      let settling = false;
      for (let i = 0; i < n; i++) {
        const dTop = goals[i].top - edges[i].top;
        const dBot = goals[i].bottom - edges[i].bottom;
        if (Math.abs(dTop) > 0.1 || Math.abs(dBot) > 0.1) settling = true;
        edges[i].top += dTop * ek;
        edges[i].bottom += dBot * ek;
        acts[i] += (nextActs[i] - acts[i]) * ek;
      }

      /* Palettes cross in about 700ms, slowing as they land. */
      const ck = snap ? 1 : 1 - Math.exp(-dt * 4.2);
      let moving = false;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          const d = target[i][j] - colors[i][j];
          if (Math.abs(d) > 0.0008) moving = true;
          colors[i][j] += d * ck;
        }
      }
      if (moving) writeCss();

      pointerAmt += (pointerGoal - pointerAmt) * (1 - Math.exp(-dt * 2.2));
      smoothPy +=
        ((horizontal ? pointerX : pointerY) - smoothPy) *
        (1 - Math.exp(-dt * 3));
      if (!reduced.matches) clock += dt;

      for (let i = rips.length - 1; i >= 0; i--) {
        rips[i].age += dt;
        if (rips[i].age > 2.6) rips.splice(i, 1);
      }

      /* The DOM half of each band: its button and label. */
      for (let i = 0; i < n; i++) {
        const el = segRefs.current[i];
        if (!el) continue;
        const e = edges[i];
        const len = `${Math.max(0, e.bottom - e.top).toFixed(2)}px`;
        if (horizontal) {
          el.style.transform = `translate3d(${e.top.toFixed(2)}px, 0, 0)`;
          el.style.width = len;
          el.style.height = "100%";
        } else {
          el.style.transform = `translate3d(0, ${e.top.toFixed(2)}px, 0)`;
          el.style.width = "100%";
          el.style.height = len;
        }
        // Compared on the element itself: a band's button is replaced when
        // the page changes, and the new one needs its value written.
        const a = String(Math.round(acts[i] * 100) / 100);
        if (el.style.getPropertyValue("--a") !== a) {
          el.style.setProperty("--a", a);
          el.toggleAttribute("data-active", acts[i] > 0.5);
        }
      }

      const live = whole && !reduced.matches;
      cursor.amt +=
        ((live && cursor.over ? 1 : 0) - cursor.amt) * (1 - Math.exp(-dt * 4));
      cursor.fx += (cursor.x - cursor.fx) * (1 - Math.exp(-dt * 20));
      cursor.fy += (cursor.y - cursor.fy) * (1 - Math.exp(-dt * 20));
      cursor.sx += (cursor.fx - cursor.sx) * (1 - Math.exp(-dt * 4.5));
      cursor.sy += (cursor.fy - cursor.sy) * (1 - Math.exp(-dt * 4.5));
      const trailing =
        Math.hypot(cursor.fx - cursor.sx, cursor.fy - cursor.sy) > 0.5;

      /* Idle, the drift is slow enough that half the frames are plenty. */
      frame++;
      const idle =
        !moving &&
        !settling &&
        !rips.length &&
        Math.abs(goal - scroll) < 0.0005 &&
        pointerAmt < 0.01 &&
        cursor.amt < 0.01 &&
        !trailing;
      if (idle && frame % 2) return;

      if (gl && program) {
        segData.fill(0);
        for (let i = 0; i < n; i++) {
          segData[i * 4] = edges[i].top * dpr;
          segData[i * 4 + 1] = edges[i].bottom * dpr;
          segData[i * 4 + 2] = n > 1 ? acts[i] : 1;
        }
        ripData.fill(0);
        rips.forEach((r, i) => {
          if (r.x !== undefined) {
            ripData[i * 4] = r.x * dpr;
            ripData[i * 4 + 1] = r.y * dpr;
          } else {
            ripData[i * 4] = horizontal ? r.y * dpr : 0;
            ripData[i * 4 + 1] = horizontal ? across * dpr : r.y * dpr;
          }
          ripData[i * 4 + 2] = r.age;
          ripData[i * 4 + 3] = r.strength;
        });
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uniforms.u_res, canvas.width, canvas.height);
        gl.uniform1f(uniforms.u_time, clock);
        gl.uniform1f(uniforms.u_scroll, scroll);
        gl.uniform1f(uniforms.u_dpr, dpr);
        gl.uniform3fv(uniforms.u_c0, colors[0]);
        gl.uniform3fv(uniforms.u_c1, colors[1]);
        gl.uniform3fv(uniforms.u_c2, colors[2]);
        gl.uniform3fv(uniforms.u_c3, colors[3]);
        // Matches --paper in site.css: the ground tinted by the field.
        for (let j = 0; j < 3; j++)
          paper[j] = paperBase[j] * 0.93 + colors[0][j] * 0.07;
        gl.uniform3fv(uniforms.u_paper, paper);
        gl.uniform1f(uniforms.u_py, smoothPy);
        gl.uniform1f(uniforms.u_h, horizontal ? 1 : 0);
        gl.uniform1f(uniforms.u_edge, whole ? 0 : 1);
        gl.uniform2f(uniforms.u_m0, cursor.fx * dpr, cursor.fy * dpr);
        gl.uniform2f(uniforms.u_m1, cursor.sx * dpr, cursor.sy * dpr);
        gl.uniform1f(uniforms.u_mamt, cursor.amt);
        gl.uniform1f(uniforms.u_pamt, pointerAmt);
        gl.uniform1f(uniforms.u_radius, radius * dpr);
        gl.uniform1i(uniforms.u_count, n);
        gl.uniform4fv(uniforms.u_seg, segData);
        gl.uniform4fv(uniforms.u_rip, ripData);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsubscribe();
      window.clearInterval(skyTimer);
      offRipple();
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      panel.removeEventListener("pointerdown", onPanelDown);
      window.clearTimeout(pointerIdle);
    };
  }, []);

  /* ── Sections: the bands, and which palette you're reading ──────── */
  useEffect(() => {
    let raf = 0;

    const measure = () => {
      // Sections hidden by the version switch have no boxes; skip them.
      const els = Array.from(
        document.querySelectorAll<HTMLElement>("[data-tick]"),
      ).filter((el) => el.getClientRects().length > 0);
      const docH = document.documentElement.scrollHeight;
      if (!els.length) {
        layout.current.spans = [{ top: 0, bottom: docH }];
        setSections((prev) =>
          prev.length === 1 && prev[0].id === null
            ? prev
            : [{ id: null, label: "" }],
        );
        return;
      }
      const tops = els.map((el, i) =>
        i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY,
      );
      layout.current.spans = tops.map((top, i) => ({
        top,
        bottom: tops[i + 1] ?? docH,
      }));
      const next = els.map((el) => ({
        id: el.id,
        label: el.dataset.tick ?? "",
      }));
      setSections((prev) =>
        prev.length === next.length &&
        prev.every((p, i) => p.id === next[i].id && p.label === next[i].label)
          ? prev
          : next,
      );
    };

    const read = () => {
      raf = 0;
      const line = window.innerHeight * 0.55;
      let section: string | null = null;
      document.querySelectorAll<HTMLElement>("[data-field]").forEach((el) => {
        const r = el.getClientRects()[0];
        if (r && r.top < line) section = el.dataset.field ?? null;
      });
      setVoice("section", isPaletteKey(section) ? section : null);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };

    read();
    measure();
    const settle = window.setTimeout(measure, 600);
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Arriving on a page sends a wave down from the top. */
    const arrive = window.setTimeout(() => ripple(0, 0.9), 120);

    return () => {
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.clearTimeout(settle);
      window.clearTimeout(arrive);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  const jump = (i: number, id: string | null, el: HTMLElement) => {
    ripple(el.getBoundingClientRect().top + 24, 1.3);
    if (!id) return;
    const target = i === 0 ? null : document.getElementById(id);
    window.scrollTo({
      top: target
        ? target.getBoundingClientRect().top +
          window.scrollY -
          (document.querySelector(".site-header")?.getBoundingClientRect()
            .height ?? 96) -
          24
        : 0,
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  };

  const multiple = sections.length > 1;

  return (
    <div
      ref={panelRef}
      className="field-panel"
      data-fallback={fallback || undefined}
    >
      <canvas ref={canvasRef} className="field-canvas" aria-hidden="true" />
      <nav
        className="field-segs"
        aria-label={multiple ? "Sections on this page" : undefined}
        aria-hidden={!multiple}
      >
        {sections.map((s, i) => (
          <button
            key={s.id ?? "page"}
            ref={(el) => {
              segRefs.current[i] = el;
            }}
            type="button"
            className="field-seg"
            tabIndex={multiple ? 0 : -1}
            disabled={!multiple}
            onClick={(e) => jump(i, s.id, e.currentTarget)}
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              layout.current.hover = i;
            }}
            onPointerLeave={() => {
              if (layout.current.hover === i) layout.current.hover = -1;
            }}
          >
            {multiple && (
              <span className="field-seg-label">
                <span className="field-seg-n">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s.label}</span>
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
