import { composeEverdeck, composeOpenWrit } from "./productScenes";
import {
  rng,
  type Composition,
  type Drop,
  type Region,
  type Stroke,
  type Weights,
} from "./strokes";

/* The Monet version's painting, for winter: a quiet snowy valley seen
   from a little way off. A pale sky with a low sun, two soft lines of
   hills, a far edge of tiny pines, a small cabin with a stand of snow-laden
   pines beside it, a frozen pond, bare trees across the field, a fence, a
   path of footprints to the door, rocks and reeds at the pond's edge,
   rabbit tracks to a bush in the near corner, and sculpted drifts. Most of the
   snow is simply the paper, left white.

   The four palette stops play roles: 0 sky and snow shadow, 1 distance
   and ice, 2 evergreens and dark wood, 3 warmth (the sun's glow, the
   cabin). Any project's palette repaints the same valley in its
   own colours. Loads are kept low so everything stays pale and quiet.

   It also returns where things are, so the living layer on top can make
   them interactive: the cabin's window and chimney, the trees, the pond,
   the sun, and branches and posts where birds can sit. (Spring gets its
   own scene later.) */

const w = (a: number, b: number, c: number, d: number): Weights => [a, b, c, d];

/* Overall strength: lower is paler. */
const SOFT = 0.85;

export type Tree = { x: number; y: number; w: number; h: number; kind: "pine" | "bare" };

export type SceneFeatures = {
  sun: { x: number; y: number; r: number };
  cabin: { x: number; y: number; w: number; h: number; window: [number, number]; chimney: [number, number] };
  trees: Tree[];
  pond: { x: number; y: number; rx: number; ry: number };
  perches: [number, number][];
  horizon: number;
  /* Where the rabbit sits, under the near bush (none on the project
     pages' scenes). */
  rabbit: [number, number] | null;
  /* What drifts through the air: snow (the default), petals, or nothing
     indoors. */
  fall?: "snow" | "petals" | "none";
  /* What rises from the chimney point: smoke (the default), a mug's
     steam, or nothing. */
  smoke?: "chimney" | "steam" | "none";
  /* Where the stars and moon can be, if not the whole sky above the
     horizon (the window, indoors). */
  sky?: Region;
  /* The colour of what a shaken tree lets fall, if not snow. */
  grain?: [number, number, number];
};

export type Scene = Composition & { features: SceneFeatures };

export function composeScene(region: Region, seed: number, delay = 0): Scene {
  const rand = rng(seed);
  const between = (a: number, b: number) => a + (b - a) * rand();
  const { x0, y0, x1, y1 } = region;
  const W = x1 - x0;
  const H = y1 - y0;
  // Small marks: the valley is seen from a distance.
  const u = Math.min(1.2, Math.max(0.55, H / 400));
  const hz = y0 + H * between(0.4, 0.44);
  const strokes: Stroke[] = [];
  const drops: Drop[] = [];
  const soft = (l: Weights): Weights => [l[0] * SOFT, l[1] * SOFT, l[2] * SOFT, l[3] * SOFT];
  const perches: [number, number][] = [];
  const trees: Tree[] = [];
  let t = delay;

  const line = (
    t0: number,
    a: [number, number],
    b: [number, number],
    opts: Partial<Stroke> & { r: number; load: Weights },
    bend = 0.06,
  ) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    // opts.dur is a speed here, in pixels a second.
    const { dur: speed = 900, load, ...rest } = opts;
    strokes.push({
      t0,
      dur: Math.max(0.05, len / speed),
      p: [a, [(a[0] + b[0]) / 2 + between(-bend, bend) * len, (a[1] + b[1]) / 2 + between(-bend, bend) * len], b],
      water: 0.7,
      dryEnd: 0.3,
      wobble: opts.r * 0.12,
      seed: rand() * 100,
      load: soft(load),
      ...rest,
    });
  };
  const drop = (d: Drop) => drops.push({ ...d, load: soft(d.load) });

  /* Which way the scene faces: the cabin and pines on one side, the bare
     trees and the sun on the other. */
  const flip = rand() < 0.5;
  const at = (f: number) => (flip ? x1 - W * f : x0 + W * f);
  const dir = flip ? -1 : 1;

  /* ── Sky ── */
  const skyRows = 3;
  const skyH = (hz - y0) / skyRows;
  for (let i = 0; i < skyRows; i++) {
    const y = y0 + skyH * (i + 0.5);
    const f = i / (skyRows - 1);
    const a: [number, number] = [x0 + W * between(0, 0.03), y];
    const b: [number, number] = [x1 - W * between(0, 0.03), y + between(-0.1, 0.1) * skyH];
    line(t + i * 0.35, i % 2 ? b : a, i % 2 ? a : b, {
      r: skyH * 1.15,
      water: 0.85,
      load: w(0.045 - f * 0.012, 0.008, 0, 0.004 + f * 0.012),
      dryEnd: 0.05,
      dur: 1300,
    }, 0.02);
  }
  t += skyRows * 0.35 + 0.2;

  /* A low winter sun: lifted out of the damp sky, with a warm halo. */
  const sun = { x: at(between(0.7, 0.82)), y: y0 + (hz - y0) * between(0.4, 0.55), r: H * 0.055 };
  drop({ t0: t, x: sun.x, y: sun.y, r: sun.r * 2.6, water: 0.6, load: w(0, 0, 0, 0.05) });
  drops.push({ t0: t + 0.35, x: sun.x, y: sun.y, r: sun.r, water: 0.45, load: [0, 0, 0, 0], lift: 0.7 });
  t += 0.6;

  /* ── Hills: a far, palest line, then a nearer one ── */
  const hills = (top: number, amp: number, load: Weights, t0: number) => {
    const n = 7;
    let prev: [number, number] = [x0 + W * 0.01, top + amp * Math.sin(seed)];
    for (let i = 1; i <= n; i++) {
      const x = x0 + (W * 0.98 * i) / n;
      const y = top + amp * Math.sin(i * 1.3 + seed) + amp * 0.5 * Math.sin(i * 3.1 + seed * 2);
      const next: [number, number] = [x, y];
      line(t0 + i * 0.08, prev, next, { r: (hz - top) * 0.6 + 2 * u, water: 0.7, load, dryEnd: 0, wobble: 2, dur: 1100 }, 0.03);
      prev = next;
    }
  };
  hills(hz - H * 0.09, H * 0.02, w(0.012, 0.018, 0, 0), t);
  hills(hz - H * 0.045, H * 0.015, w(0.004, 0.026, 0.006, 0), t + 0.5);
  t += 1.1;

  /* ── A pine: tiers of flattened dabs narrowing upward, snow lifted off
     the top of each tier. ── */
  const pine = (x: number, base: number, h: number, strength: number, t0: number, record = true) => {
    // Distant pines are just a few soft dabs.
    if (h < 16 * u) {
      const tiers = 3;
      for (let i = 0; i < tiers; i++) {
        const f = i / (tiers - 1);
        drop({
          t0: t0 + i * 0.03,
          x: x + between(-0.5, 0.5) * u,
          y: base - h * (0.12 + 0.8 * f),
          r: h * 0.34 * (1 - f * 0.75) + 1.2 * u,
          squash: 0.4,
          water: 0.5,
          load: w(0, 0.03, 0.13 * strength, 0),
        });
      }
      return;
    }
    // Nearer ones: a thin trunk, then boughs drooping out to each side,
    // shorter toward the top, never quite symmetric. Snow is lifted off
    // the upper edge of the lower boughs.
    line(t0, [x, base + 1], [x + between(-1, 1) * u, base - h], {
      r: 1 * u,
      water: 0.3,
      load: w(0, 0.03, 0.12 * strength, 0.02),
      dryEnd: 0.2,
      wobble: 0.3,
      even: true,
      dur: 500,
    }, 0.01);
    const tiers = Math.max(5, Math.round(h / (5.5 * u)));
    for (let i = 0; i < tiers; i++) {
      const f = i / (tiers - 1);
      const y = base - h * (0.06 + 0.9 * f);
      const reach = h * 0.3 * Math.pow(1 - f, 0.9) + 1.6 * u;
      for (const side of [-1, 1]) {
        const len = reach * between(0.75, 1.15);
        const droop = len * between(0.25, 0.45);
        line(t0 + 0.1 + i * 0.035, [x, y - 1.5 * u], [x + side * len, y + droop], {
          r: (1.6 + 2.2 * (1 - f)) * u,
          water: 0.45,
          load: w(0, 0.03, 0.16 * strength, 0),
          dryEnd: 0.5,
          wobble: 0.8,
          dur: 320,
        }, 0.12);
        if (f < 0.75 && rand() < 0.7)
          line(t0 + 0.5 + i * 0.035, [x + side * len * 0.15, y - 2.2 * u], [x + side * len * 0.8, y + droop * 0.6 - 1.6 * u], {
            r: 1.1 * u,
            water: 0.25,
            load: [0, 0, 0, 0],
            lift: 0.45,
            dryEnd: 0.3,
            wobble: 0.3,
            dur: 320,
          }, 0.05);
      }
    }
    if (record) trees.push({ x, y: base - h / 2, w: h * 0.6, h, kind: "pine" });
  };

  /* The far edge of tiny pines along the foot of the hills, in clumps. */
  for (let x = x0 + W * 0.02; x < x1 - W * 0.02; ) {
    const clump = between(30, 110) * u;
    for (let cx = x; cx < Math.min(x + clump, x1 - W * 0.02); cx += between(4, 8) * u)
      pine(cx, hz + between(-1, 2), between(6, 13) * u, 0.45, t + ((cx - x0) / W) * 0.8, false);
    x += clump + between(20, 90) * u;
  }
  t += 1.0;

  /* ── Snow shadows: long, very pale blue drifts across the field ── */
  for (let i = 0; i < 4; i++) {
    const y = hz + (y1 - hz) * (0.2 + i * 0.2) + between(-6, 6) * u;
    const a: [number, number] = [x0 + W * between(0, 0.3), y];
    const b: [number, number] = [x0 + W * between(0.6, 1), y + between(-8, 8) * u];
    line(t + i * 0.2, a, b, { r: between(8, 14) * u, water: 0.55, load: w(0.03, 0.012, 0, 0), dryEnd: 0.4, wobble: 3, dur: 1000 }, 0.04);
  }
  t += 0.6;

  /* ── The frozen pond ── */
  const pond = { x: x0 + W * between(0.45, 0.58), y: hz + (y1 - hz) * between(0.42, 0.55), rx: W * between(0.12, 0.16), ry: 0 };
  pond.ry = pond.rx * 0.17;
  for (let i = 0; i < 6; i++) {
    const f = (i + 0.5) / 6;
    const y = pond.y - pond.ry + pond.ry * 2 * f;
    const half = pond.rx * Math.sqrt(1 - Math.pow(2 * f - 1, 2)) * 0.9;
    line(t + i * 0.08, [pond.x - half, y], [pond.x + half, y], {
      r: pond.ry * 0.38,
      water: 0.65,
      load: w(0.02, 0.06, 0.008, 0),
      dryEnd: 0,
      wobble: 0.5,
      dur: 700,
    }, 0.01);
  }
  // Glints lifted out of the ice.
  for (let i = 0; i < 4; i++) {
    const y = pond.y + between(-0.6, 0.6) * pond.ry;
    const x = pond.x + between(-0.6, 0.4) * pond.rx;
    line(t + 0.6 + i * 0.08, [x, y], [x + pond.rx * between(0.2, 0.45), y], {
      r: 1.6 * u,
      water: 0.3,
      load: [0, 0, 0, 0],
      lift: 0.6,
      dryEnd: 0,
      wobble: 0,
      dur: 600,
    }, 0);
  }
  t += 1.0;

  /* ── The cabin and its pines ── */
  const cw = 46 * u;
  const ch = 24 * u;
  const cabinX = at(between(0.22, 0.3));
  const cabinBase = hz + (y1 - hz) * between(0.3, 0.38);
  const pineBase = cabinBase + 6 * u;
  const stand = 5 + Math.floor(rand() * 4);
  for (let i = 0; i < stand; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const off = (cw * 0.7 + between(6, 34) * u * (1 + Math.floor(i / 2) * 0.6)) * side * dir;
    const near = between(0, 1);
    pine(cabinX + off, pineBase - 12 * u + near * 16 * u, between(40, 74) * u * (0.8 + near * 0.4), 1, t + i * 0.18);
  }
  t += stand * 0.18 + 0.2;

  // Walls, a dark eave under the snowy roof, a warm window, a chimney.
  for (let i = 0; i < 3; i++) {
    const y = cabinBase - ch * (0.2 + i * 0.3);
    line(t + i * 0.08, [cabinX - cw / 2, y], [cabinX + cw / 2, y], {
      r: ch * 0.2,
      water: 0.5,
      load: w(0, 0.03, 0.09, 0.15),
      dryEnd: 0,
      wobble: 0.3,
      dur: 500,
    }, 0);
  }
  const eave = cabinBase - ch;
  line(t + 0.3, [cabinX - cw * 0.62, eave], [cabinX + cw * 0.62, eave], { r: 1.3 * u, water: 0.35, load: w(0, 0.02, 0.16, 0.04), dryEnd: 0, wobble: 0, dur: 500 }, 0);
  const apex: [number, number] = [cabinX, eave - ch * 0.75];
  // The roof under its snow: a pale cool shade, darker at the gable end.
  for (let i = 0; i < 3; i++) {
    const f = (i + 0.5) / 3;
    const y = eave - ch * 0.75 * f;
    const half = cw * 0.62 * (1 - f) + 2 * u;
    line(t + 0.32 + i * 0.03, [cabinX - half, y], [cabinX + half, y], { r: ch * 0.15, water: 0.4, load: w(0.05, 0.03, 0, 0), dryEnd: 0, wobble: 0, dur: 500 }, 0);
  }
  line(t + 0.4, [cabinX - cw * 0.62, eave], apex, { r: 1 * u, water: 0.3, load: w(0.03, 0.04, 0.02, 0), dryEnd: 0.2, wobble: 0, dur: 400 }, 0);
  line(t + 0.45, [cabinX + cw * 0.62, eave], apex, { r: 1 * u, water: 0.3, load: w(0.03, 0.04, 0.02, 0), dryEnd: 0.2, wobble: 0, dur: 400 }, 0);
  const chimney: [number, number] = [cabinX + cw * 0.24 * dir, eave - ch * 0.62];
  line(t + 0.5, [chimney[0], eave - ch * 0.25], chimney, { r: 2.2 * u, water: 0.4, load: w(0, 0.02, 0.08, 0.1), dryEnd: 0, wobble: 0, dur: 300 }, 0);
  const windowAt: [number, number] = [cabinX - cw * 0.2 * dir, cabinBase - ch * 0.5];
  drop({ t0: t + 0.6, x: windowAt[0], y: windowAt[1], r: 3 * u, squash: 0.9, water: 0.35, load: w(0, 0, 0, 0.35) });
  line(t + 0.65, [cabinX + cw * 0.15 * dir, cabinBase], [cabinX + cw * 0.15 * dir, cabinBase - ch * 0.55], { r: 2 * u, water: 0.35, load: w(0, 0.02, 0.12, 0.04), dryEnd: 0, wobble: 0, dur: 300 }, 0);
  const cabin = { x: cabinX, y: cabinBase - ch * 0.8, w: cw * 1.3, h: ch * 2, window: windowAt, chimney };
  t += 0.9;

  /* ── Bare trees across the field ── */
  const branch = (x: number, y: number, ang: number, len: number, depth: number, t0: number) => {
    const ex = x + Math.cos(ang) * len;
    const ey = y + Math.sin(ang) * len;
    line(t0, [x, y], [ex, ey], {
      r: (0.3 + depth * 0.38) * u,
      water: 0.16,
      load: w(0, 0.04, 0.1 + depth * 0.012, 0.03),
      dryEnd: depth < 1 ? 0.6 : depth < 2 ? 0.3 : 0,
      wobble: 0.4,
      even: true,
      dur: 340,
    }, 0.1);
    if (depth === 2 && rand() < 0.5) perches.push([ex, ey]);
    if (depth <= 0) return;
    const kids = depth > 3 ? 2 : 2 + (rand() < 0.35 ? 1 : 0);
    for (let k = 0; k < kids; k++) {
      const spread = between(0.22, 0.5) * (k === 0 ? -1 : k === 1 ? 1 : between(-0.3, 0.3));
      branch(ex, ey, ang + spread + between(-0.1, 0.1), len * between(0.74, 0.84), depth - 1, t0 + len / 340 + k * 0.03);
    }
  };
  const bare = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < bare; i++) {
    const bx = at(between(0.62, 0.9));
    const base = hz + (y1 - hz) * between(0.3, 0.62);
    const h = between(70, 105) * u * (0.75 + (base - hz) / (y1 - hz));
    branch(bx, base, -Math.PI / 2 + between(-0.06, 0.06), h * 0.34, 4, t + i * 0.4);
    trees.push({ x: bx, y: base - h * 0.55, w: h * 0.8, h, kind: "bare" });
    // Its shadow on the snow.
    line(t + i * 0.4 + 0.2, [bx, base + 1], [bx - h * 0.5 * dir, base + 4 * u], { r: 2.4 * u, water: 0.4, load: w(0.03, 0.02, 0, 0), dryEnd: 0.5, wobble: 1, dur: 500 }, 0.05);
  }
  t += bare * 0.4 + 1.2;

  /* ── A fence from the cabin out into the field ── */
  const posts = 6 + Math.floor(rand() * 3);
  const fx0 = cabinX + cw * 0.9 * dir;
  const fy0 = cabinBase + 4 * u;
  const step = 15 * u * dir;
  for (let i = 0; i < posts; i++) {
    const x = fx0 + step * i;
    const y = fy0 + i * 2.2 * u;
    const ph = (9 + i * 0.6) * u;
    line(t + i * 0.08, [x, y], [x, y - ph], { r: 1.1 * u, water: 0.3, load: w(0, 0.02, 0.1, 0.05), dryEnd: 0, wobble: 0, dur: 300 }, 0);
    perches.push([x, y - ph - 1.5 * u]);
    if (i > 0)
      line(t + i * 0.08 + 0.05, [x - step, y - 2.2 * u - ph * 0.55], [x, y - ph * 0.55], { r: 0.7 * u, water: 0.25, load: w(0, 0.02, 0.07, 0.03), dryEnd: 0.3, wobble: 0, dur: 400 }, 0.02);
  }
  t += posts * 0.08 + 0.3;

  /* ── A path trodden through the snow to the door: a soft blue trough
     with footprints along it, larger as it comes toward us. ── */
  const pathAt = (() => {
    const a: [number, number] = [x0 + W * between(0.4, 0.52), y1 + 4 * u];
    const c: [number, number] = [cabinX + cw * 0.15 * dir, cabinBase + 2 * u];
    const b: [number, number] = [(a[0] + c[0]) / 2 + between(0.08, 0.16) * W * -dir, (a[1] + c[1]) / 2 + (y1 - hz) * 0.1];
    return (p: number): [number, number] => {
      const q = 1 - p;
      return [q * q * a[0] + 2 * q * p * b[0] + p * p * c[0], q * q * a[1] + 2 * q * p * b[1] + p * p * c[1]];
    };
  })();
  for (let i = 0; i <= 34; i++) {
    const p = i / 34;
    const [x, y] = pathAt(p);
    const near = 1 - p;
    drop({ t0: t + p * 1.1, x, y, r: (2.5 + 8 * near) * u, squash: 0.32, water: 0.45, load: w(0.05, 0.06, 0.018, 0) });
  }
  for (let i = 0; i < 30; i++) {
    const p = (i + 0.5) / 30;
    const [x, y] = pathAt(p);
    const [nx] = pathAt(Math.min(1, p + 0.01));
    const near = 1 - p;
    const side = i % 2 ? 1 : -1;
    const off = (1.2 + 2.6 * near) * u * side * (nx >= x ? 1 : -1);
    drop({ t0: t + 0.4 + p * 1.1, x: x + between(-0.5, 0.5) * u, y: y + off * 0.5, r: (1.2 + 2.6 * near) * u, squash: 0.55, water: 0.3, load: w(0.05, 0.08, 0.05, 0) });
  }
  t += 1.4;

  /* ── Rocks along the near shore of the pond, capped with snow, and a
     few frozen reeds. ── */
  const rocks = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < rocks; i++) {
    const ang = between(0.15, 0.85) * Math.PI;
    const rx = pond.x + Math.cos(ang) * pond.rx * between(0.85, 1.05);
    const ry = pond.y + Math.sin(ang) * pond.ry * between(1.05, 1.3);
    const rr = between(3, 6) * u;
    drop({ t0: t + i * 0.1, x: rx, y: ry, r: rr, squash: 0.6, water: 0.4, load: w(0, 0.05, 0.1, 0.04) });
    drops.push({ t0: t + i * 0.1 + 0.3, x: rx, y: ry - rr * 0.35, r: rr * 0.8, squash: 0.35, water: 0.25, load: [0, 0, 0, 0], lift: 0.6 });
  }
  const reedSide = pond.x - pond.rx * 0.75 * dir;
  for (let i = 0; i < 9; i++) {
    const x = reedSide + between(-0.12, 0.12) * pond.rx;
    const y = pond.y + pond.ry * between(0.2, 0.9);
    line(t + 0.4 + i * 0.05, [x, y], [x + between(-3, 3) * u, y - between(9, 18) * u], {
      r: 0.55 * u,
      water: 0.15,
      load: w(0, 0.02, 0.07, 0.06),
      dryEnd: 0.4,
      wobble: 0.3,
      even: true,
      dur: 260,
    }, 0.12);
  }
  t += 0.9;

  /* ── Rabbit tracks wandering across the field to a bush in the near
     corner, where the rabbit lives. ── */
  const bushX = at(between(0.82, 0.9));
  const bushY = y1 - (y1 - hz) * between(0.12, 0.2);
  {
    let x = at(between(0.3, 0.45));
    let y = hz + (y1 - hz) * between(0.55, 0.65);
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const p = i / steps;
      x += (bushX - x) / (steps - i) + between(-6, 6) * u;
      y += (bushY - y) / (steps - i) + between(-2, 2) * u;
      const s = 0.7 + 0.6 * ((y - hz) / (y1 - hz));
      drop({ t0: t + p * 0.8, x, y, r: 1.5 * u * s, squash: 0.7, water: 0.25, load: w(0.04, 0.07, 0.06, 0) });
      drop({ t0: t + p * 0.8 + 0.03, x: x + 2.6 * u * s, y: y - 1 * u, r: 1.5 * u * s, squash: 0.7, water: 0.25, load: w(0.04, 0.07, 0.06, 0) });
      drop({ t0: t + p * 0.8 + 0.06, x: x + 1.2 * u * s, y: y + 3 * u * s, r: 0.8 * u * s, squash: 0.8, water: 0.25, load: w(0.05, 0.07, 0.03, 0) });
    }
  }
  t += 0.9;

  /* ── Low bushes poking out of the drifts in the foreground ── */
  const bush = (bx: number, by: number, size: number, t0: number) => {
    // A soft blue hollow in the snow around it.
    drop({ t0, x: bx, y: by + 1.5 * u, r: size * 0.9, squash: 0.25, water: 0.4, load: w(0.04, 0.02, 0, 0) });
    const stems = 4 + Math.floor(rand() * 3);
    for (let k = 0; k < stems; k++) {
      const ang = -Math.PI / 2 + ((k + 0.5) / stems - 0.5) * 1.6 + between(-0.12, 0.12);
      branch(bx + between(-0.2, 0.2) * size, by, ang, size * between(0.4, 0.55), 2, t0 + 0.15 + k * 0.05);
    }
    // A few dry leaves hanging on.
    for (let k = 0; k < 6; k++)
      drop({
        t0: t0 + 0.6 + k * 0.04,
        x: bx + between(-0.6, 0.6) * size,
        y: by - size * between(0.3, 0.8),
        r: between(1, 1.8) * u,
        squash: 0.6,
        water: 0.25,
        load: w(0, 0, 0.02, 0.2),
      });
    trees.push({ x: bx, y: by - size * 0.45, w: size * 1.4, h: size, kind: "bare" });
  };
  bush(bushX, bushY, between(40, 52) * u, t);
  bush(at(between(0.05, 0.14)), y1 - (y1 - hz) * between(0.1, 0.18), between(32, 42) * u, t + 0.3);
  t += 1.0;

  /* ── Drifts: the snow's sculpted near edge, crisp shadow on one side ── */
  for (let i = 0; i < 3; i++) {
    const y = y1 - (y1 - hz) * between(0.04, 0.3);
    const xa = x0 + W * between(0, 0.5);
    const xb = xa + W * between(0.2, 0.45);
    line(t + i * 0.2, [xa, y], [xb, y + between(-6, 6) * u], {
      r: between(3, 5) * u,
      squash: 0.6,
      water: 0.4,
      load: w(0.05, 0.02, 0, 0),
      dryEnd: 0.2,
      wobble: 2,
      dur: 900,
    }, 0.08);
  }
  t += 0.8;

  /* ── The near snowbank: a soft cool band along the bottom with a
     crisp, rolling top edge, so the foreground has some form. ── */
  {
    const n = 6;
    let prev: [number, number] = [x0 - 4, y1 - (y1 - hz) * 0.12];
    for (let i = 1; i <= n; i++) {
      const x = x0 + (W * i) / n + 4;
      const y = y1 - (y1 - hz) * (0.08 + 0.07 * Math.abs(Math.sin(i * 1.7 + seed)));
      line(t + i * 0.1, prev, [x, y], { r: 7 * u, squash: 0.7, water: 0.45, load: w(0.05, 0.025, 0, 0.004), dryEnd: 0, wobble: 1.5, dur: 900 }, 0.05);
      prev = [x, y];
    }
  }
  t += 0.7;

  /* ── Tall dry grasses through the snow, in loose clumps ── */
  const clumps = 6 + Math.floor(rand() * 4);
  for (let i = 0; i < clumps; i++) {
    const gx = x0 + W * between(0.03, 0.97);
    const gy = y1 - (y1 - hz) * between(0.02, 0.22);
    const near = (gy - hz) / (y1 - hz);
    const blades = 4 + Math.floor(rand() * 4);
    for (let j = 0; j < blades; j++) {
      const bx = gx + between(-5, 5) * u;
      const len = between(12, 26) * u * (0.6 + near * 0.6);
      line(t + i * 0.05 + j * 0.02, [bx, gy], [bx + between(-0.45, 0.45) * len, gy - len], {
        r: 0.5 * u,
        water: 0.14,
        load: w(0, 0.02, 0.05, 0.1),
        dryEnd: 0.5,
        wobble: 0.4,
        even: true,
        dur: 300,
      }, 0.15);
    }
  }
  t += 0.8;

  /* ── An old rail fence half buried in the near corner ── */
  {
    const fx = at(between(0.6, 0.72));
    const fy = y1 - (y1 - hz) * between(0.16, 0.24);
    const posts = 4;
    const gap = 22 * u * dir;
    for (let i = 0; i < posts; i++) {
      const x = fx + gap * i;
      const y = fy + i * 3 * u;
      const ph = between(14, 18) * u;
      line(t + i * 0.1, [x, y + 2 * u], [x + between(-1, 1) * u, y - ph], { r: 1.5 * u, water: 0.3, load: w(0, 0.03, 0.12, 0.08), dryEnd: 0, wobble: 0, even: true, dur: 260 }, 0.02);
      drops.push({ t0: t + i * 0.1 + 0.3, x, y: y - ph - 0.5 * u, r: 2.4 * u, squash: 0.45, water: 0.25, load: [0, 0, 0, 0], lift: 0.6 });
      perches.push([x, y - ph - 2 * u]);
      if (i > 0)
        for (const k of [0.35, 0.7])
          line(t + i * 0.1 + 0.15, [x - gap, y - 3 * u - ph * k], [x, y - ph * k], { r: 0.9 * u, water: 0.25, load: w(0, 0.03, 0.09, 0.06), dryEnd: 0.2, wobble: 0.3, even: true, dur: 300 }, 0.03);
    }
  }
  t += 0.7;

  return {
    strokes,
    drops,
    length: t - delay,
    features: { sun, cabin, trees, pond, perches, horizon: hz, rabbit: [bushX - 16 * u * dir, bushY + 3 * u] },
  };
}

/* The painting for a page: the project pages get their own scenes, every
   other page the valley. */
export function composeFor(pathname: string, region: Region, seed: number, delay = 0): Scene {
  if (pathname.startsWith("/work/everdeck")) return composeEverdeck(region, seed, delay);
  if (pathname.startsWith("/work/openwrit")) return composeOpenWrit(region, seed, delay);
  return composeScene(region, seed, delay);
}
