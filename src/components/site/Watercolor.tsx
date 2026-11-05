"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { currentPalette, onRipple, setVoice, subscribe } from "./fieldStore";
import {
  PALETTES,
  hexToRgb,
  isPaletteKey,
  localHour,
  skyAt,
  type PaletteKey,
} from "./palettes";
import { createEngine, type Engine } from "./watercolor/engine";
import { createLife, type Life } from "./watercolor/life";
import { composeScene, type Scene } from "./watercolor/scene";
import {
  compose,
  hashString,
  rampWeights,
  type Region,
  type Weights,
} from "./watercolor/strokes";

/* The watercolor version's painting: a sheet of cold-press paper under the
   whole site, and on it a wash that paints itself in when a page loads,
   stroke by stroke, and dries with darker edges and granulated pigment.

   It listens to the same voices as the light field. Pointing at a project
   bleeds that project's colours through the painting from the nearest
   edge and drops water there, which blooms; reading a project in a list
   does the same. Opening a project washes the sheet and paints it again in
   that project's palette. Moving the cursor over the painting is a clean
   wet brush, and clicking drops in colour. */

const css = (c: number[]) =>
  `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)})`;

const toLinear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

/* A colour as pigment: how much of each channel a full-strength layer
   absorbs. */
const absorbance = (rgb: number[][]) =>
  rgb.map((c) => c.map((v) => -Math.log(Math.max(0.006, toLinear(v)))));

export type PaintMode = "wash" | "scene";

/* The Monet scene's own colours, in place of the sky: winter, as a
   painter's series through the day. Pale blue morning, clear noon, a rose
   and gold late afternoon, lavender dusk, a soft blue night. All of them
   light and quiet. Stops: sky and snow shadow, distance and ice,
   evergreens, warmth. (Spring gets its own set.) */
const WINTER: { h: number; pal: string[] }[] = [
  { h: 2, pal: ["#d5dbe8", "#aeb8cf", "#6f7c97", "#d9bfa6"] },
  { h: 8, pal: ["#e7edf4", "#c3cfdd", "#6d8595", "#e6c4b0"] },
  { h: 12.5, pal: ["#e4eef6", "#bdcddb", "#5f7f8b", "#ddc3a6"] },
  { h: 16.5, pal: ["#f2e5dd", "#cbc8da", "#677789", "#eab39b"] },
  { h: 19.5, pal: ["#ddd9e9", "#aeb4cd", "#5d6a84", "#d9aaa7"] },
];

function winterAt(hour: number): number[][] {
  const h = ((hour % 24) + 24) % 24;
  const keys = [...WINTER, { h: WINTER[0].h + 24, pal: WINTER[0].pal }];
  let i = keys.length - 2;
  for (let j = 0; j < keys.length - 1; j++) {
    const lo = keys[j].h;
    const hi = keys[j + 1].h;
    const hh = h < keys[0].h ? h + 24 : h;
    if (hh >= lo && hh < hi) {
      i = j;
      break;
    }
  }
  const a = keys[i];
  const b = keys[i + 1];
  const hh = h < keys[0].h ? h + 24 : h;
  const t = Math.min(1, Math.max(0, (hh - a.h) / (b.h - a.h)));
  return a.pal.map((hex, k) => {
    const ca = hexToRgb(hex);
    const cb = hexToRgb(b.pal[k]);
    return ca.map((v, n) => v + (cb[n] - v) * t);
  });
}

function layoutFor(canvas: HTMLCanvasElement, mode: PaintMode) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const wide = window.matchMedia("(min-width: 64rem)").matches;
  if (mode === "scene") {
    // A wide, low plate at the top of the page, under the header: a view
    // across a valley rather than a close-up. Taller on phones so the
    // scene still reads. Matches --wc-band in watercolor.css.
    const top = wide ? 100 : 82;
    const ph = Math.max(120, h - top - 16);
    const ratio = w < 640 ? 1.6 : 2.6;
    const pw = Math.min(w - Math.max(32, w * 0.1), ph * ratio, 1040);
    const x0 = (w - pw) / 2;
    const region: Region = { x0, y0: top, x1: x0 + pw, y1: top + ph };
    return { w, h, wide: false, region };
  }
  const region: Region = wide
    ? { x0: w * 0.515, y0: h * 0.075, x1: w - w * 0.035, y1: h - h * 0.075 }
    : { x0: w * 0.06, y0: 84, x1: w * 0.94, y1: h * 0.94 };
  return { w, h, wide, region };
}

export default function Watercolor({ mode = "wash" }: { mode?: PaintMode }) {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lifeCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const lifeRef = useRef<Life | null>(null);
  const pathRef = useRef(pathname);
  const geo = useRef<{ w: number; h: number; wide: boolean; region: Region }>({
    w: 1,
    h: 1,
    wide: true,
    region: { x0: 0, y0: 0, x1: 1, y1: 1 },
  });
  /* The last place the site was touched, for where colour bleeds from. */
  const touch = useRef({ x: 0, y: 0, at: -1e9 });

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  /* ── The engine, colour, and interaction ───────────────────────────── */
  useEffect(() => {
    const root = document.documentElement;
    const canvas = canvasRef.current!;
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = () => reducedMq.matches;

    const pinned = Number.parseFloat(
      new URLSearchParams(window.location.search).get("hour") ?? "",
    );
    const hour = () => (Number.isFinite(pinned) ? pinned : localHour());
    const resolve = (key: PaletteKey) =>
      key === "cade"
        ? mode === "scene"
          ? winterAt(hour())
          : skyAt(hour())
        : PALETTES[key].map(hexToRgb);
    const composeFor = mode === "scene" ? composeScene : compose;
    // The pond stays light whatever the palette: its pigment is thinner.
    const pigment = (rgb: number[][]) =>
      mode === "scene"
        ? absorbance(rgb).map((c) => c.map((v) => v * 0.8))
        : absorbance(rgb);

    /* The CSS side: --f0…--f3 for the type and tiles, crossing smoothly. */
    let target = resolve(currentPalette());
    const colors = target.map((c) => [...c]);
    let cssRaf = 0;
    let cssLast = 0;
    const writeCss = () =>
      colors.forEach((c, i) => root.style.setProperty(`--f${i}`, css(c)));
    writeCss();
    const cssLoop = (now: number) => {
      const dt = Math.min(0.05, (now - (cssLast || now)) / 1000);
      cssLast = now;
      const k = reduced() ? 1 : 1 - Math.exp(-dt * 4.2);
      let moving = false;
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 3; j++) {
          const d = target[i][j] - colors[i][j];
          if (Math.abs(d) > 0.001) moving = true;
          colors[i][j] += d * k;
        }
      writeCss();
      cssRaf = moving ? requestAnimationFrame(cssLoop) : 0;
    };

    const engine = createEngine(canvas, { reduced });
    engineRef.current = engine;
    const scene = mode === "scene";
    const life =
      scene && lifeCanvasRef.current
        ? createLife(lifeCanvasRef.current, { reduced })
        : null;
    lifeRef.current = life;
    // No WebGL2: the CSS shows a still wash instead.
    if (!engine) canvas.parentElement?.setAttribute("data-fallback", "");

    const toCanvas = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      return { x: clientX - r.left, y: clientY - r.top };
    };
    const clamp = (v: number, a: number, b: number) =>
      Math.min(b, Math.max(a, v));

    /* Where something touched on the page lands on the painting: level
       with it on the painting's inner edge, or right there if it's over
       the painting. */
    const landing = (clientY: number, clientX?: number) => {
      const { region: R, wide } = geo.current;
      const p = toCanvas(clientX ?? 0, clientY);
      const over = p.x >= R.x0 && p.x <= R.x1 && p.y >= R.y0 && p.y <= R.y1;
      if (wide) {
        return {
          x: over ? p.x : R.x0 + 26,
          y: clamp(p.y, R.y0 + 24, R.y1 - 24),
        };
      }
      return {
        x: clamp(clientX ?? (R.x0 + R.x1) / 2, R.x0 + 24, R.x1 - 24),
        y: clamp(p.y, R.y0 + 24, R.y1 - 24),
      };
    };

    const paintPage = (instant: boolean, delay = 0) => {
      if (!engine) return;
      const c = composeFor(
        geo.current.region,
        hashString(pathRef.current),
        delay,
      );
      const now = instant || reduced();
      if (now) engine.paintInstant(c);
      else engine.paint(c);
      if (life && "features" in c) {
        const { w, h, region } = geo.current;
        life.setScene(
          (c as Scene).features,
          region,
          w,
          h,
          now ? 0 : c.length * 0.8,
        );
      }
    };

    const layout = (first: boolean) => {
      if (!engine) return;
      geo.current = layoutFor(canvas, mode);
      const { w, h, region } = geo.current;
      engine.resize(w, h, region);
      engine.palette(pigment(resolve(currentPalette())), null, true);
      paintPage(!first);
    };
    layout(true);

    let paperURL: string | null = null;
    let alive = true;
    engine?.paperURL().then((url) => {
      if (!url) return;
      if (!alive) return URL.revokeObjectURL(url);
      paperURL = url;
      root.style.setProperty("--wc-paper", `url(${url})`);
    });

    /* A new palette bleeds out from wherever the site was just touched, or
       else from the painting's inner edge, level with the reading line. */
    let palRaf = 0;
    const unsubscribe = subscribe(() => {
      target = resolve(currentPalette());
      if (!cssRaf) {
        cssLast = 0;
        cssRaf = requestAnimationFrame(cssLoop);
      }
      if (palRaf) return;
      // The ripple that says where comes just after the colour changes.
      palRaf = requestAnimationFrame(() => {
        palRaf = 0;
        const recent = performance.now() - touch.current.at < 400;
        const R = geo.current.region;
        const origin = recent
          ? { x: touch.current.x, y: touch.current.y }
          : landing(window.innerHeight * 0.55, R.x0);
        engine?.palette(pigment(resolve(currentPalette())), origin);
      });
    });
    const skyTimer = window.setInterval(() => {
      if (currentPalette() !== "cade") return;
      target = resolve("cade");
      if (!cssRaf) cssRaf = requestAnimationFrame(cssLoop);
      const R = geo.current.region;
      engine?.palette(pigment(target), { x: R.x1, y: R.y0 });
    }, 60_000);

    /* A touch drops clean water where it lands, which blooms back through
       the drying paint; a harder one carries a little colour too. */
    const offRipple = onRipple((clientY, strength, clientX) => {
      if (clientY <= 1) return; // the light field's arrival wave
      const at = landing(clientY, clientX);
      touch.current = { ...at, at: performance.now() };
      // The scene keeps its picture; only its colours answer.
      if (!engine || reduced() || scene) return;
      const R = geo.current.region;
      const deep = rampWeights(
        clamp((at.y - R.y0) / Math.max(1, R.y1 - R.y0) + 0.25, 0, 1),
      );
      const ink = strength > 1.2 ? 0.05 : 0.012;
      const r = 22 + strength * 16;
      engine.dab({
        x: at.x,
        y: at.y,
        r,
        water: 0.55,
        load: deep.map((v) => v * ink) as Weights,
        lift: 0.22,
        dry: 0,
      });
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = r * (0.5 + Math.random() * 0.5);
        engine.dab({
          x: at.x + Math.cos(a) * d,
          y: at.y + Math.sin(a) * d,
          r: r * (0.35 + Math.random() * 0.3),
          water: 0.45,
          load: [0, 0, 0, 0],
          lift: 0.15,
          dry: 0,
        });
      }
    });

    /* The cursor over the painting is a clean, damp brush. */
    let lastX = 0;
    let lastY = 0;
    let travelled = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (life) {
        // The scene's living things answer the cursor instead.
        const p = toCanvas(e.clientX, e.clientY);
        const over = !(e.target as Element | null)?.closest?.(
          "a, button, input, textarea, select, label",
        );
        const hit = over ? life.pointer(p.x, p.y) : (life.leave(), null);
        root.classList.toggle("wc-pointing", !!hit);
        return;
      }
      if (!engine || reduced()) return;
      const p = toCanvas(e.clientX, e.clientY);
      const R = geo.current.region;
      const over =
        p.x > R.x0 + 8 && p.x < R.x1 - 8 && p.y > R.y0 + 8 && p.y < R.y1 - 8;
      travelled += Math.hypot(p.x - lastX, p.y - lastY);
      lastX = p.x;
      lastY = p.y;
      if (!over) return;
      touch.current = { x: p.x, y: p.y, at: performance.now() };
      if (travelled < 10) return;
      travelled = 0;
      engine.dab({
        x: p.x,
        y: p.y,
        r: 14,
        water: 0.3,
        load: [0, 0, 0, 0],
        lift: 0.05,
        dry: 0,
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    /* Clicking the painting drops in colour. */
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (
        (e.target as Element | null)?.closest?.(
          "a, button, input, textarea, select, label",
        )
      )
        return;
      if (life) {
        const p = toCanvas(e.clientX, e.clientY);
        life.click(p.x, p.y);
        return;
      }
      if (!engine || reduced()) return;
      const p = toCanvas(e.clientX, e.clientY);
      const R = geo.current.region;
      if (p.x < R.x0 || p.x > R.x1 || p.y < R.y0 || p.y > R.y1) return;
      const f = clamp((p.y - R.y0) / Math.max(1, R.y1 - R.y0) + 0.2, 0, 1);
      const load = rampWeights(f).map((v) => v * 0.2) as Weights;
      engine.dab({
        x: p.x,
        y: p.y,
        r: 24 + Math.random() * 10,
        water: 0.8,
        load,
        lift: 0,
        dry: 0,
      });
    };
    window.addEventListener("pointerdown", onDown);
    const onLeave = () => {
      life?.leave();
      root.classList.remove("wc-pointing");
    };
    root.addEventListener("pointerleave", onLeave);

    /* Repaint after a real resize, not the address bar coming and going. */
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const next = layoutFor(canvas, mode);
        const prev = geo.current;
        if (
          Math.abs(next.w - prev.w) < 2 &&
          Math.abs(next.h - prev.h) < 120 &&
          next.wide === prev.wide
        )
          return;
        layout(false);
      }, 220);
    });
    ro.observe(canvas);

    return () => {
      alive = false;
      unsubscribe();
      offRipple();
      window.clearInterval(skyTimer);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerleave", onLeave);
      root.classList.remove("wc-pointing");
      life?.destroy();
      lifeRef.current = null;
      cancelAnimationFrame(cssRaf);
      cancelAnimationFrame(palRaf);
      ro.disconnect();
      engine?.destroy();
      engineRef.current = null;
      root.style.removeProperty("--wc-paper");
      if (paperURL) URL.revokeObjectURL(paperURL);
    };
  }, [mode]);

  /* ── Opening another page washes the sheet and paints it again ─────── */
  const firstPath = useRef(true);
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    const engine = engineRef.current;
    if (!engine) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const c = (mode === "scene" ? composeScene : compose)(
      geo.current.region,
      hashString(pathname),
      reduced ? 0 : 0.35,
    );
    if (reduced) {
      engine.clearPaint();
      engine.paintInstant(c);
    } else {
      engine.wash(0.75);
      engine.paint(c);
    }
    if (lifeRef.current && "features" in c) {
      const { w, h, region } = geo.current;
      lifeRef.current.setScene(
        (c as Scene).features,
        region,
        w,
        h,
        reduced ? 0 : c.length * 0.8,
      );
    }
  }, [pathname, mode]);

  /* ── Which palette you're reading ──────────────────────────────────── */
  useEffect(() => {
    let raf = 0;
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
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return (
    <>
      <div className="wc" aria-hidden="true">
        <canvas ref={canvasRef} className="wc-canvas" />
        {/* Ragged, pooled edges for the small swatches and tiles. */}
        <svg className="wc-defs" width="0" height="0" focusable="false">
          <filter id="wc-edge" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.045"
              numOctaves="3"
              seed="7"
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale="7"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      </div>
      {/* Snow, smoke, lamplight and birds: lighter than paper, so not
        multiplied with the paint. */}
      {mode === "scene" && (
        <canvas ref={lifeCanvasRef} className="wc-life" aria-hidden="true" />
      )}
    </>
  );
}
