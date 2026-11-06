"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { currentPalette, onRipple, setVoice, subscribe } from "./fieldStore";
import {
  PALETTES,
  hexToRgb,
  isPaletteKey,
  localHour,
  type PaletteKey,
} from "./palettes";
import {
  NIGHT_AMP,
  NIGHT_BASE,
  createEngine,
  type Engine,
} from "./watercolor/engine";
import { createLife, type Life } from "./watercolor/life";
import { composeScene } from "./watercolor/scene";
import { hashString, type Region } from "./watercolor/strokes";

/* The site's painting: a Monet-style winter valley in a plate across the
   top of every page, on a sheet of cold-press paper that runs under the
   whole site. It paints itself in, stroke by stroke, when a page loads.

   Its colours answer the site: pointing at a project bleeds that
   project's palette through the scene from where you pointed, reading a
   project in a list does the same, and opening one washes the sheet and
   paints the valley again in that project's colours. The living layer on
   top (snow, smoke, the lamp, birds, the rabbit) answers the cursor.

   In dark mode it's night: see the night section below. */

const css = (c: number[]) =>
  `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)})`;

const toLinear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);

/* A colour as pigment: how much of each channel a full-strength layer
   absorbs. Scaled down so the scene stays light whatever the palette. */
const pigment = (rgb: number[][]) =>
  rgb.map((c) => c.map((v) => -Math.log(Math.max(0.006, toLinear(v))) * 0.8));

/* The scene's own colours: winter, as a painter's series through the
   day. Pale blue morning, clear noon, a rose and gold late afternoon,
   lavender dusk, a soft blue night. All of them light and quiet. Stops:
   sky and snow shadow, distance and ice, evergreens, warmth. (Spring gets
   its own set.) */
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
  const hh = h < keys[0].h ? h + 24 : h;
  let i = keys.length - 2;
  for (let j = 0; j < keys.length - 1; j++) {
    if (hh >= keys[j].h && hh < keys[j + 1].h) {
      i = j;
      break;
    }
  }
  const a = keys[i];
  const b = keys[i + 1];
  const t = Math.min(1, Math.max(0, (hh - a.h) / (b.h - a.h)));
  return a.pal.map((hex, k) => {
    const ca = hexToRgb(hex);
    const cb = hexToRgb(b.pal[k]);
    return ca.map((v, n) => v + (cb[n] - v) * t);
  });
}

/* A wide, low plate at the top of the page, under the header: a view
   across a valley rather than a close-up. Taller on phones so the scene
   still reads. Matches --wc-band in watercolor.css. */
function layoutFor(canvas: HTMLCanvasElement) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const wide = window.matchMedia("(min-width: 64rem)").matches;
  const top = wide ? 100 : 82;
  // Room below the plate for its ragged edge.
  const ph = Math.max(120, h - top - 48);
  const ratio = w < 640 ? 1.6 : 2.6;
  const pw = Math.min(w - Math.max(32, w * 0.1), ph * ratio, 1040);
  const x0 = (w - pw) / 2;
  const region: Region = { x0, y0: top, x1: x0 + pw, y1: top + ph };
  return { w, h, region };
}

const INTERACTIVE = "a, button, input, textarea, select, label";

export default function Watercolor() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lifeCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const lifeRef = useRef<Life | null>(null);
  const pathRef = useRef(pathname);
  const geo = useRef<{ w: number; h: number; region: Region }>({
    w: 1,
    h: 1,
    region: { x0: 0, y0: 0, x1: 1, y1: 1 },
  });
  /* The last place the site was touched, for where colour bleeds from. */
  const touch = useRef({ x: 0, y: 0, at: -1e9 });

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  /* ── The engine, colour, night and interaction ─────────────────────── */
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
      key === "cade" ? winterAt(hour()) : PALETTES[key].map(hexToRgb);

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
    const life = lifeCanvasRef.current
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

    /* Where something touched on the page lands on the painting: right
       there if it's over the plate, otherwise the nearest point on it. */
    const landing = (clientY: number, clientX?: number) => {
      const R = geo.current.region;
      const p = toCanvas(clientX ?? (R.x0 + R.x1) / 2, clientY);
      return {
        x: clamp(p.x, R.x0 + 24, R.x1 - 24),
        y: clamp(p.y, R.y0 + 24, R.y1 - 24),
      };
    };

    /* ── Night ──
       Night follows dark mode. Changing it while here lets dusk fall (or
       dawn break) over a few seconds: the sky darkens from the top down,
       the sun sets and the moon rises, stars come out, the lamp comes on,
       and the page's paper and type turn with it. */
    const forced = new URLSearchParams(window.location.search).get("night");
    const darkMq = window.matchMedia("(prefers-color-scheme: dark)");
    let nightNow = root.hasAttribute("data-night") ? 1 : 0;
    let nightFrom = nightNow;
    let nightGoal = nightNow;
    let nightStart = 0;
    let nightRaf = 0;
    const NIGHT_MS = 3400;
    const ease = (x: number) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    engine?.setNight(nightNow);
    const nightLoop = (now: number) => {
      const k = Math.min(1, (now - nightStart) / NIGHT_MS);
      nightNow = nightFrom + (nightGoal - nightFrom) * ease(k);
      engine?.setNight(nightNow);
      life?.setNight(nightNow);
      nightRaf = k < 1 ? requestAnimationFrame(nightLoop) : 0;
    };
    const goNight = (dark: boolean) => {
      const goal = dark ? 1 : 0;
      if (goal === nightGoal) return;
      root.toggleAttribute("data-night", dark);
      nightFrom = nightNow;
      nightGoal = goal;
      if (reduced()) {
        nightNow = goal;
        engine?.setNight(goal);
        life?.setNight(goal);
        return;
      }
      nightStart = performance.now();
      cancelAnimationFrame(nightRaf);
      nightRaf = requestAnimationFrame(nightLoop);
    };
    const onScheme = (e: MediaQueryListEvent) => {
      if (forced !== "1" && forced !== "0") goNight(e.matches);
    };
    darkMq.addEventListener("change", onScheme);

    /* ── Painting ── */
    const paintPage = (instant: boolean) => {
      if (!engine) return;
      const c = composeScene(geo.current.region, hashString(pathRef.current));
      const now = instant || reduced();
      if (now) engine.paintInstant(c);
      else engine.paint(c);
      engine.setHorizon(c.features.horizon);
      if (life) {
        const { w, h, region } = geo.current;
        life.setScene(c.features, region, w, h, now ? 0 : c.length * 0.8);
        life.setNight(nightNow);
      }
    };

    const layout = (first: boolean) => {
      if (!engine) return;
      geo.current = layoutFor(canvas);
      const { w, h, region } = geo.current;
      engine.resize(w, h, region);
      engine.palette(pigment(resolve(currentPalette())), null, true);
      paintPage(!first);
    };

    /* Two sheets of the same paper, lit for day and for night. */
    const paperURLs: string[] = [];
    let alive = true;
    const tile = async (
      prop: string,
      base?: [number, number, number],
      amp?: number,
    ) => {
      const url = await engine?.paperURL(base, amp);
      if (!url) return;
      if (!alive) return URL.revokeObjectURL(url);
      paperURLs.push(url);
      root.style.setProperty(prop, `url(${url})`);
    };
    tile("--wc-paper").then(() =>
      tile("--wc-paper-night", NIGHT_BASE, NIGHT_AMP),
    );

    layout(true);

    /* A new palette bleeds out from wherever the site was just touched, or
       else from the plate's left edge. */
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
          : { x: R.x0, y: (R.y0 + R.y1) / 2 };
        engine?.palette(pigment(resolve(currentPalette())), origin);
      });
    });
    // The day's colours move on as the visitor stays.
    const skyTimer = window.setInterval(() => {
      if (currentPalette() !== "cade") return;
      target = resolve("cade");
      if (!cssRaf) cssRaf = requestAnimationFrame(cssLoop);
      const R = geo.current.region;
      engine?.palette(pigment(target), { x: R.x1, y: R.y0 });
    }, 60_000);

    /* Touching something on the page only sets where colour bleeds from;
       the picture itself is left alone. */
    const offRipple = onRipple((clientY, _strength, clientX) => {
      if (clientY <= 1) return;
      touch.current = { ...landing(clientY, clientX), at: performance.now() };
    });

    /* The scene's living things answer the cursor. */
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !life) return;
      const p = toCanvas(e.clientX, e.clientY);
      const free = !(e.target as Element | null)?.closest?.(INTERACTIVE);
      const hit = free ? life.pointer(p.x, p.y) : (life.leave(), null);
      root.classList.toggle("wc-pointing", !!hit);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !life) return;
      if ((e.target as Element | null)?.closest?.(INTERACTIVE)) return;
      const p = toCanvas(e.clientX, e.clientY);
      life.click(p.x, p.y);
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
        const next = layoutFor(canvas);
        const prev = geo.current;
        if (Math.abs(next.w - prev.w) < 2 && Math.abs(next.h - prev.h) < 120)
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
      darkMq.removeEventListener("change", onScheme);
      cancelAnimationFrame(nightRaf);
      cancelAnimationFrame(cssRaf);
      cancelAnimationFrame(palRaf);
      ro.disconnect();
      life?.destroy();
      lifeRef.current = null;
      engine?.destroy();
      engineRef.current = null;
      root.style.removeProperty("--wc-paper");
      root.style.removeProperty("--wc-paper-night");
      paperURLs.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

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
    const c = composeScene(
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
    engine.setHorizon(c.features.horizon);
    const life = lifeRef.current;
    if (life) {
      const { w, h, region } = geo.current;
      life.setScene(c.features, region, w, h, reduced ? 0 : c.length * 0.8);
      life.setNight(
        document.documentElement.hasAttribute("data-night") ? 1 : 0,
      );
    }
  }, [pathname]);

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
      {/* Snow, smoke, lamplight and birds: lighter than paper. */}
      <canvas ref={lifeCanvasRef} className="wc-life" aria-hidden="true" />
    </>
  );
}
