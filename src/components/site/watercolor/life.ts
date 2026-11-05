import type { Region } from "./strokes";
import type { SceneFeatures } from "./scene";

/* The living layer over the winter painting, drawn on its own canvas so it
   can be lighter than the paper (paint can only darken it).

   - Snow falls slowly over the whole scene. The cursor parts it gently;
     a click in the sky sends a soft gust through it.
   - Smoke drifts up from the chimney. Pointing at the cabin warms its
     window and thickens the smoke; clicking turns the lamp on or off.
   - Birds sit on the bare branches and the fence posts. Come near and
     they lift off together, then drift back a while later.
   - Click a tree and the snow slides off its branches.
   - The frozen pond catches a glint of light under the cursor.
   - The low sun glows a little brighter when you point at it.
   - A rabbit sits by the bush in the near corner. Get close and it hops
     off out of the picture, and comes back along its tracks later.

   Everything is slow on purpose. With reduced motion, the scene is drawn
   once, still: no falling snow, no flight. */

type Flake = { x: number; y: number; r: number; vx: number; vy: number; fall: number; ph: number; a: number };
type Puff = { x: number; y: number; vx: number; vy: number; r: number; age: number; life: number };
type Grain = { x: number; y: number; vx: number; vy: number; r: number; age: number; life: number };
type Bird = {
  perch: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: "away" | "perched" | "flying" | "landing";
  wait: number;
  flap: number;
  bob: number;
  from: [number, number];
  t: number;
  dur: number;
};

type Rabbit = {
  x: number;
  y: number;
  state: "home" | "away" | "leaving" | "returning";
  face: number;
  hop: number;
  wait: number;
  ear: number;
};

export type Hit = "cabin" | "pond" | "sun" | "sky" | `tree:${number}` | null;

export type Life = {
  setScene: (f: SceneFeatures, region: Region, w: number, h: number, revealIn: number) => void;
  pointer: (x: number, y: number) => Hit;
  leave: () => void;
  click: (x: number, y: number) => boolean;
  destroy: () => void;
};

const rnd = (a: number, b: number) => a + (b - a) * Math.random();

export function createLife(canvas: HTMLCanvasElement, { reduced }: { reduced: () => boolean }): Life | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let f: SceneFeatures | null = null;
  let R: Region = { x0: 0, y0: 0, x1: 1, y1: 1 };
  let W = 1;
  let H = 1;
  let dpr = 1;
  let u = 1;
  let reveal = 0; // seconds until the scene's life appears
  let shown = 0; // 0 → 1 as it appears

  let flakes: Flake[] = [];
  const smoke: Puff[] = [];
  const grains: Grain[] = [];
  let birds: Bird[] = [];
  let rabbit: Rabbit | null = null;

  const pointer = { x: -1e4, y: -1e4, over: false };
  let hover: Hit = null;
  let lamp = false;
  let windowGlow = 0.2;
  let sunGlow = 0;
  let glint = 0;
  let gust = 0;
  let gustDir = 1;
  let emitAcc = 0;
  let hoverTree = -1;
  let sprinkleAcc = 0;

  let raf = 0;
  let last = 0;
  let visible = true;
  let clock = 0;

  const inside = (x: number, y: number, m = 0) => x >= R.x0 - m && x <= R.x1 + m && y >= R.y0 - m && y <= R.y1 + m;

  /* Fade near the plate's edges so nothing stops on a hard line. */
  const edgeFade = (x: number, y: number) => {
    const d = Math.min(x - R.x0, R.x1 - x, y - R.y0, R.y1 - y);
    return Math.max(0, Math.min(1, d / (26 * u)));
  };

  const makeFlake = (top: boolean): Flake => {
    const depth = Math.random();
    return {
      x: rnd(R.x0, R.x1),
      y: top ? R.y0 - rnd(0, 30) : rnd(R.y0, R.y1),
      r: (0.6 + depth * 1.5) * u,
      vx: 0,
      vy: 0,
      fall: (6 + depth * 12) * u,
      ph: Math.random() * Math.PI * 2,
      a: 0.55 + depth * 0.4,
    };
  };

  const makeBirds = () => {
    if (!f) return;
    const perches = f.perches;
    const n = Math.min(perches.length, 3 + Math.floor(Math.random() * 3));
    const used = new Set<number>();
    birds = [];
    for (let i = 0; i < n; i++) {
      let p = Math.floor(Math.random() * perches.length);
      for (let k = 0; k < 8 && used.has(p); k++) p = Math.floor(Math.random() * perches.length);
      used.add(p);
      birds.push({
        perch: p,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        state: "away",
        wait: reveal + 0.6 + i * 0.5,
        flap: Math.random() * 10,
        bob: Math.random() * 10,
        from: [0, 0],
        t: 0,
        dur: 1,
      });
    }
  };

  /* A bird glides in from off the plate and settles on its perch. */
  const comeBack = (b: Bird) => {
    if (!f) return;
    const [px, py] = f.perches[b.perch];
    const fromLeft = Math.random() < 0.5;
    b.from = [fromLeft ? R.x0 - 30 : R.x1 + 30, R.y0 + rnd(0, (f.horizon - R.y0) * 0.6)];
    b.x = b.from[0];
    b.y = b.from[1];
    b.t = 0;
    b.dur = Math.hypot(px - b.from[0], py - b.from[1]) / (70 * u) + 1;
    b.state = "landing";
  };

  const scatter = (x: number, y: number) => {
    for (const b of birds) {
      if (b.state !== "perched" && b.state !== "landing") continue;
      const dx = b.x - x;
      const dy = b.y - y;
      const d = Math.max(1, Math.hypot(dx, dy));
      b.vx = (dx / d) * rnd(60, 100) * u + rnd(-20, 20) * u;
      b.vy = -rnd(50, 80) * u;
      b.state = "flying";
      b.wait = rnd(9, 15);
    }
  };

  const hitTest = (x: number, y: number): Hit => {
    if (!f || !inside(x, y) || shown < 0.5) return null;
    const c = f.cabin;
    if (Math.abs(x - c.x) < c.w * 0.6 && Math.abs(y - c.y) < c.h * 0.6) return "cabin";
    for (let i = f.trees.length - 1; i >= 0; i--) {
      const t = f.trees[i];
      if (Math.abs(x - t.x) < t.w * 0.45 && Math.abs(y - t.y) < t.h * 0.5) return `tree:${i}`;
    }
    const p = f.pond;
    if (((x - p.x) / p.rx) ** 2 + ((y - p.y) / (p.ry * 1.6)) ** 2 < 1) return "pond";
    if (Math.hypot(x - f.sun.x, y - f.sun.y) < f.sun.r * 2.2) return "sun";
    if (y < f.horizon - 8 * u) return "sky";
    return null;
  };

  const shake = (i: number, amount: number) => {
    if (!f) return;
    const t = f.trees[i];
    for (let k = 0; k < amount; k++)
      grains.push({
        x: t.x + rnd(-0.4, 0.4) * t.w,
        y: t.y - t.h * rnd(0.05, 0.5),
        vx: rnd(-6, 6) * u,
        vy: rnd(-8, 4) * u,
        r: rnd(0.6, 1.6) * u,
        age: 0,
        life: rnd(1.4, 2.4),
      });
  };

  /* ── Drawing ─────────────────────────────────────────────────────── */

  const draw = () => {
    const baseU = u;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!f) return;
    const s = shown;

    // The sun's glow.
    {
      const r = f.sun.r * (3 + sunGlow * 0.8);
      const a = (0.28 + 0.06 * Math.sin(clock * 0.35) + sunGlow * 0.22) * s;
      const g = ctx.createRadialGradient(f.sun.x, f.sun.y, 0, f.sun.x, f.sun.y, r);
      g.addColorStop(0, `rgba(255, 249, 236, ${a})`);
      g.addColorStop(0.35, `rgba(255, 238, 214, ${a * 0.55})`);
      g.addColorStop(1, "rgba(255, 238, 214, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.sun.x, f.sun.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chimney smoke.
    for (const p of smoke) {
      const k = p.age / p.life;
      const a = 0.1 * Math.sin(Math.PI * Math.min(1, k * 1.2)) * edgeFade(p.x, p.y) * s;
      if (a <= 0) continue;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(168, 166, 170, ${a})`);
      g.addColorStop(1, "rgba(168, 166, 170, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // The window's lamplight, on the wall and a little on the snow.
    {
      const [wx, wy] = f.cabin.window;
      const a = windowGlow * s;
      const r = 16 * u * (0.8 + windowGlow * 0.6);
      const g = ctx.createRadialGradient(wx, wy, 0, wx, wy, r);
      g.addColorStop(0, `rgba(255, 214, 140, ${Math.min(0.95, a * 1.2)})`);
      g.addColorStop(0.25, `rgba(255, 190, 110, ${a * 0.5})`);
      g.addColorStop(1, "rgba(255, 190, 110, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(wx, wy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // A glint across the ice.
    if (glint > 0.01) {
      const p = f.pond;
      const x = Math.max(p.x - p.rx * 0.8, Math.min(p.x + p.rx * 0.8, pointer.x));
      const len = p.rx * 0.5;
      const g = ctx.createLinearGradient(x - len, 0, x + len, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, `rgba(255,255,255,${0.75 * glint})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - len, p.y - 1.1 * u, len * 2, 2.2 * u);
      ctx.fillRect(x - len * 0.4, p.y + p.ry * 0.4 - 0.6 * u, len * 0.8, 1.2 * u);
    }

    // Birds: small ink marks, wings in a soft V when flying.
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const b of birds) {
      if (b.state === "away") continue;
      const a = 0.8 * edgeFade(b.x, b.y) * s;
      if (a <= 0) continue;
      ctx.strokeStyle = `rgba(58, 60, 72, ${a})`;
      ctx.fillStyle = `rgba(58, 60, 72, ${a})`;
      if (b.state === "perched") {
        const bob = Math.sin(b.bob) > 0.96 ? -0.8 * u : 0;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y - 1.6 * u + bob, 2.2 * u, 1.5 * u, -0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x + 1.8 * u, b.y - 3 * u + bob, 1.05 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 0.8 * u;
        ctx.beginPath();
        ctx.moveTo(b.x - 1.8 * u, b.y - 1.2 * u + bob);
        ctx.lineTo(b.x - 3.6 * u, b.y - 0.2 * u + bob);
        ctx.stroke();
      } else {
        const span = 4.2 * u;
        const lift = Math.sin(b.flap) * 2.6 * u;
        ctx.lineWidth = 1 * u;
        ctx.beginPath();
        ctx.moveTo(b.x - span, b.y - lift);
        ctx.quadraticCurveTo(b.x - span * 0.4, b.y - lift * 0.2 - 0.8 * u, b.x, b.y);
        ctx.quadraticCurveTo(b.x + span * 0.4, b.y - lift * 0.2 - 0.8 * u, b.x + span, b.y - lift);
        ctx.stroke();
      }
    }

    // The rabbit: a small soft-brown shape, ears up, a white tail.
    if (rabbit && rabbit.state !== "away") {
      const r = rabbit;
      const a = 0.88 * edgeFade(r.x, r.y) * s;
      const u = baseU * 1.45;
      if (a > 0) {
        const lift = Math.max(0, Math.sin(r.hop)) * 5 * u * (r.state === "home" ? 0 : 1);
        const x = r.x;
        const y = r.y - lift;
        const f = r.face;
        ctx.fillStyle = `rgba(104, 90, 80, ${a})`;
        ctx.beginPath();
        ctx.ellipse(x, y - 2.6 * u, 4 * u, 2.8 * u, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + f * 3.6 * u, y - 4.6 * u, 1.9 * u, 0, Math.PI * 2);
        ctx.fill();
        const ear = Math.sin(r.ear) > 0.97 ? 0.5 : 0;
        for (const k of [0, 1]) {
          ctx.beginPath();
          ctx.ellipse(x + f * (2.9 + k * 1.1) * u, y - 7.8 * u, 0.7 * u, 2.6 * u, f * (-0.25 - k * 0.2 + ear), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(x - f * 3.9 * u, y - 2.8 * u, 1.1 * u, 0, Math.PI * 2);
        ctx.fill();
        // Its shadow on the snow.
        ctx.fillStyle = `rgba(120, 140, 170, ${0.14 * a})`;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y + 0.4 * u, 4.6 * u, 1.1 * u, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Snow sliding off branches.
    for (const p of grains) {
      const a = (1 - p.age / p.life) * 0.95 * edgeFade(p.x, p.y);
      if (a <= 0) continue;
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Falling snow, with a faint cool edge so it reads on pale paint.
    for (const fl of flakes) {
      const a = fl.a * edgeFade(fl.x, fl.y);
      if (a <= 0.01) continue;
      ctx.fillStyle = `rgba(150, 165, 190, ${a * 0.22})`;
      ctx.beginPath();
      ctx.arc(fl.x + 0.35 * u, fl.y + 0.45 * u, fl.r * 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  /* ── Motion ──────────────────────────────────────────────────────── */

  const step = (dt: number) => {
    if (!f) return;
    clock += dt;
    if (reveal > 0) reveal -= dt;
    else shown = Math.min(1, shown + dt / 1.6);

    const wind = 4 * u * Math.sin(clock * 0.13) + gust * gustDir * 60 * u;
    gust *= Math.exp(-dt * 0.9);

    for (const fl of flakes) {
      fl.ph += dt * 0.8;
      // The cursor parts the snow, softly.
      const dx = fl.x - pointer.x;
      const dy = fl.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      const rad = 46 * u;
      if (pointer.over && d2 < rad * rad) {
        const d = Math.max(1, Math.sqrt(d2));
        const push = (1 - d / rad) * 90 * u;
        fl.vx += (dx / d) * push * dt;
        fl.vy += (dy / d) * push * dt;
      }
      fl.vx *= Math.exp(-dt * 1.5);
      fl.vy *= Math.exp(-dt * 1.5);
      fl.x += (Math.sin(fl.ph) * 5 * u + wind + fl.vx) * dt;
      fl.y += (fl.fall + fl.vy) * dt;
      if (fl.y > R.y1 + 10 || fl.x < R.x0 - 40 || fl.x > R.x1 + 40) Object.assign(fl, makeFlake(true));
    }

    // Smoke: steadier and thicker while you point at the cabin.
    const rate = (hover === "cabin" ? 7 : 2.4) * shown;
    emitAcc += dt * rate;
    while (emitAcc > 1) {
      emitAcc -= 1;
      smoke.push({
        x: f.cabin.chimney[0] + rnd(-1, 1) * u,
        y: f.cabin.chimney[1] - 2 * u,
        vx: rnd(-2, 2) * u,
        vy: -rnd(7, 11) * u,
        r: 2.5 * u,
        age: 0,
        life: rnd(6, 9),
      });
    }
    for (let i = smoke.length - 1; i >= 0; i--) {
      const p = smoke[i];
      p.age += dt;
      p.vx += (wind * 0.25 + 3 * u - p.vx) * dt * 0.5;
      p.vy *= Math.exp(-dt * 0.15);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += dt * 3 * u;
      if (p.age > p.life) smoke.splice(i, 1);
    }

    for (let i = grains.length - 1; i >= 0; i--) {
      const g = grains[i];
      g.age += dt;
      g.vy += 34 * u * dt;
      g.vx += (wind * 0.4 - g.vx) * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (g.age > g.life) grains.splice(i, 1);
    }
    if (hoverTree >= 0) {
      sprinkleAcc += dt * 6;
      while (sprinkleAcc > 1) {
        sprinkleAcc -= 1;
        shake(hoverTree, 1);
      }
    }

    const lampGoal = lamp ? 0.85 : hover === "cabin" ? 0.6 : 0.22;
    windowGlow += (lampGoal - windowGlow) * (1 - Math.exp(-dt * 3));
    sunGlow += ((hover === "sun" ? 1 : 0) - sunGlow) * (1 - Math.exp(-dt * 2));
    glint += ((hover === "pond" ? 1 : 0) - glint) * (1 - Math.exp(-dt * 4));

    for (const b of birds) {
      if (b.state === "away") {
        b.wait -= dt;
        if (b.wait <= 0) comeBack(b);
      } else if (b.state === "landing") {
        const [px, py] = f.perches[b.perch];
        b.t += dt / b.dur;
        const k = Math.min(1, b.t);
        const e = 1 - Math.pow(1 - k, 3);
        b.x = b.from[0] + (px - b.from[0]) * e;
        b.y = b.from[1] + (py - b.from[1]) * e - Math.sin(Math.PI * k) * 18 * u;
        b.flap += dt * (k < 0.8 ? 11 : 4);
        if (k >= 1) b.state = "perched";
      } else if (b.state === "perched") {
        b.bob += dt * rnd(0.6, 1.4);
        const [px, py] = f.perches[b.perch];
        b.x = px;
        b.y = py;
      } else {
        b.flap += dt * 13;
        b.vy -= 6 * u * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (!inside(b.x, b.y, 30)) {
          b.state = "away";
        }
      }
    }
    if (rabbit) {
      const r = rabbit;
      const [hx, hy] = f.rabbit;
      if (r.state === "home") {
        r.ear += dt * rnd(0.5, 1.5);
        if (pointer.over && Math.hypot(r.x - pointer.x, r.y - pointer.y) < 60 * u) {
          r.state = "leaving";
          r.face = pointer.x > r.x ? -1 : 1;
          r.hop = 0;
        }
      } else if (r.state === "leaving") {
        r.hop += dt * 9;
        r.x += r.face * 52 * u * dt;
        r.y += Math.sin(clock * 0.7) * 2 * u * dt;
        if (!inside(r.x, r.y, 20)) {
          r.state = "away";
          r.wait = rnd(10, 16);
        }
      } else if (r.state === "away") {
        r.wait -= dt;
        if (r.wait <= 0) {
          r.state = "returning";
          r.face = Math.random() < 0.5 ? 1 : -1;
          r.x = r.face > 0 ? R.x0 - 12 : R.x1 + 12;
          r.y = hy + rnd(-6, 6) * u;
          r.hop = 0;
        }
      } else {
        r.hop += dt * 8;
        const dx = hx - r.x;
        r.face = dx >= 0 ? 1 : -1;
        r.x += Math.sign(dx) * Math.min(Math.abs(dx), 40 * u * dt);
        r.y += (hy - r.y) * (1 - Math.exp(-dt * 1.5));
        if (Math.abs(dx) < 0.5) {
          r.state = "home";
          r.x = hx;
          r.y = hy;
        }
      }
    }

    // Birds keep a little distance from the cursor.
    if (pointer.over && birds.some((b) => b.state === "perched" && Math.hypot(b.x - pointer.x, b.y - pointer.y) < 55 * u))
      scatter(pointer.x, pointer.y);
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (document.hidden || !visible || !f) return;
    if (reduced()) {
      shown = 1;
      reveal = 0;
      windowGlow = lamp ? 0.85 : 0.22;
      draw();
      cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    step(dt);
    draw();
  };
  const wake = () => {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) wake();
  });
  io.observe(canvas);

  return {
    setScene(features, region, w, h, revealIn) {
      f = features;
      R = region;
      W = w;
      H = h;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      u = Math.min(1.2, Math.max(0.55, (region.y1 - region.y0) / 400));
      reveal = reduced() ? 0 : revealIn;
      shown = reduced() ? 1 : 0;
      smoke.length = 0;
      grains.length = 0;
      const area = (region.x1 - region.x0) * (region.y1 - region.y0);
      flakes = Array.from({ length: Math.round(Math.min(150, area / 3800)) }, () => makeFlake(false));
      makeBirds();
      rabbit = {
        x: features.rabbit[0],
        y: features.rabbit[1],
        state: "home",
        face: features.rabbit[0] < (region.x0 + region.x1) / 2 ? 1 : -1,
        hop: 0,
        wait: 0,
        ear: Math.random() * 10,
      };
      if (reduced()) {
        // Still life: birds already on their perches.
        for (const b of birds) {
          b.state = "perched";
          [b.x, b.y] = features.perches[b.perch];
        }
      }
      wake();
    },

    pointer(x, y) {
      pointer.x = x;
      pointer.y = y;
      pointer.over = inside(x, y, 20);
      const next = hitTest(x, y);
      if (next !== hover) {
        if (next?.startsWith("tree:")) shake(Number(next.slice(5)), 6);
        hover = next;
        hoverTree = next?.startsWith("tree:") ? Number(next.slice(5)) : -1;
      }
      if (pointer.over) wake();
      return hover === "sky" ? null : hover;
    },

    leave() {
      pointer.over = false;
      pointer.x = pointer.y = -1e4;
      hover = null;
      hoverTree = -1;
    },

    click(x, y) {
      const h = hitTest(x, y);
      if (!h) return false;
      if (h === "cabin") lamp = !lamp;
      else if (h.startsWith("tree:")) shake(Number(h.slice(5)), 40);
      else if (h === "sky" || h === "sun") {
        gust = 1;
        gustDir = x < (R.x0 + R.x1) / 2 ? 1 : -1;
        scatter(x, y);
      } else if (h === "pond") glint = 1.6;
      wake();
      if (reduced()) draw();
      return true;
    },

    destroy() {
      cancelAnimationFrame(raf);
      io.disconnect();
    },
  };
}
