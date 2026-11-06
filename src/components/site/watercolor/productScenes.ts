import { rng, type Drop, type Region, type Stroke, type Weights } from "./strokes";
import type { Scene, SceneFeatures, Tree } from "./scene";

/* The paintings on the two project pages, in the same Monet-style hand as
   the homepage's winter valley but about the product, each painted in its
   project's palette.

   Everdeck: a student's desk by a window, after the desk on Everdeck's
   landing page. A fanned deck of flashcards with the E on the front one
   and a stroke of highlighter, an open notebook with a highlighted line,
   a marker and a pencil, a mug of something warm, a plant, and a desk
   lamp; through the window, a garden in the morning. Stops: 0 the wall
   and light, 1 the card teal and garden, 2 deep teal for line and shade,
   3 warm sand for wood, highlighter and lamplight.

   OpenWrit: a cathedral in the early morning, at the centre of the
   scene: a west front with two spired towers, a rose window over the
   great door, the nave running back under a tall crossing spire, a small
   town and trees round its foot, a path to the door across a meadow of
   grass and poppies, and near the front a bench with an open book on it.
   Stops: 0 dawn sky, 1 apricot light and fields, 2 terracotta, 3 the
   deep red-brown of trees, roofs and poppies.

   Both return the same features as the valley, so the living layer works
   on them: the lamp (or the chapel's window) to switch on, the sun or
   window light, perches for birds outside, and so on. */

const w = (a: number, b: number, c: number, d: number): Weights => [a, b, c, d];
const SOFT = 0.85;
const NOWHERE = { x: -1e5, y: -1e5, rx: 1, ry: 1 };

function painter(region: Region, seed: number) {
  const rand = rng(seed);
  const between = (a: number, b: number) => a + (b - a) * rand();
  const { x0, y0, x1, y1 } = region;
  const W = x1 - x0;
  const H = y1 - y0;
  const u = Math.min(1.2, Math.max(0.55, H / 400));
  const strokes: Stroke[] = [];
  const drops: Drop[] = [];
  const soft = (l: Weights): Weights => [l[0] * SOFT, l[1] * SOFT, l[2] * SOFT, l[3] * SOFT];

  const line = (
    t0: number,
    a: [number, number],
    b: [number, number],
    opts: Partial<Stroke> & { r: number; load: Weights },
    bend = 0.06,
  ) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
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
  const drop = (d: Drop) => drops.push({ ...d, load: d.lift ? d.load : soft(d.load) });

  /* A point in a box turned by `ang` about its centre. */
  const turn = (cx: number, cy: number, ang: number) => (lx: number, ly: number): [number, number] => [
    cx + lx * Math.cos(ang) - ly * Math.sin(ang),
    cy + lx * Math.sin(ang) + ly * Math.cos(ang),
  ];

  /* A box laid in with parallel strokes along its length. */
  const box = (
    t0: number,
    cx: number,
    cy: number,
    bw: number,
    bh: number,
    ang: number,
    opts: {
      load: Weights;
      water?: number;
      rows?: number;
      lift?: number;
      speed?: number;
      /* Paint round this (upright) box, leaving it as paper. */
      avoid?: { x: number; y: number; w: number; h: number };
    },
  ) => {
    const at = turn(cx, cy, ang);
    const rows = opts.rows ?? Math.max(2, Math.round(bh / (7 * u)));
    const r = (bh / rows) * 0.72;
    const style = { r, water: opts.water ?? 0.5, load: opts.load, lift: opts.lift, dryEnd: 0, wobble: 0.3, dur: opts.speed ?? 700 };
    const v = opts.avoid;
    const clear = (p: [number, number]) =>
      !v || Math.abs(p[0] - v.x) > v.w / 2 + r * 0.6 || Math.abs(p[1] - v.y) > v.h / 2 + r * 0.6;
    for (let i = 0; i < rows; i++) {
      const ly = -bh / 2 + (bh * (i + 0.5)) / rows;
      if (!v) {
        line(t0 + i * 0.04, at(-bw / 2 + 1, ly), at(bw / 2 - 1, ly), style, 0.005);
        continue;
      }
      // Only the runs of the row outside the box being kept white.
      const n = 24;
      let start: [number, number] | null = null;
      for (let k = 0; k <= n; k++) {
        const p = at(-bw / 2 + 1 + ((bw - 2) * k) / n, ly);
        const ok = clear(p);
        if (ok && !start) start = p;
        if ((!ok || k === n) && start) {
          const end = ok ? p : at(-bw / 2 + 1 + ((bw - 2) * (k - 1)) / n, ly);
          if (Math.hypot(end[0] - start[0], end[1] - start[1]) > r * 0.5) line(t0 + i * 0.04, start, end, style, 0.005);
          start = null;
        }
      }
    }
    return t0 + rows * 0.04;
  };

  /* A box drawn round in a fine, steady line. */
  const outline = (t0: number, cx: number, cy: number, bw: number, bh: number, ang: number, r: number, load: Weights) => {
    const at = turn(cx, cy, ang);
    const c: [number, number][] = [at(-bw / 2, -bh / 2), at(bw / 2, -bh / 2), at(bw / 2, bh / 2), at(-bw / 2, bh / 2)];
    for (let i = 0; i < 4; i++)
      line(t0 + i * 0.06, c[i], c[(i + 1) % 4], { r, water: 0.25, load, dryEnd: 0, wobble: 0.2, even: true, dur: 500 }, 0.01);
    return t0 + 0.3;
  };

  return { rand, between, x0, y0, x1, y1, W, H, u, strokes, drops, line, drop, turn, box, outline };
}

/* ── Everdeck: the desk by the window ─────────────────────────────────── */

export function composeEverdeck(region: Region, seed: number, delay = 0): Scene {
  const P = painter(region, seed);
  const { between, x0, y0, x1, y1, W, H, u, drops, line, drop, box, outline, turn } = P;
  const at = (f: number) => x0 + W * f;
  const hz = y0 + H * between(0.56, 0.6); // the back edge of the desk
  const deep = y1 - hz;
  let t = delay;

  /* The wall: a soft, pale wash with a little warmth toward the lamp. */
  for (let i = 0; i < 3; i++) {
    const y = y0 + ((hz - y0) * (i + 0.5)) / 3;
    line(t + i * 0.3, [x0 + W * between(0, 0.02), y], [x1 - W * between(0, 0.02), y + between(-4, 4) * u], {
      r: ((hz - y0) / 3) * 1.1,
      water: 0.85,
      load: w(0.035 - i * 0.006, 0.006, 0, 0.01 + i * 0.006),
      dryEnd: 0.05,
      dur: 1300,
    }, 0.02);
  }
  t += 1.1;

  /* The window, and the garden through it in the morning. */
  const win = { x0: at(0.06), x1: at(0.38), y0: y0 + H * 0.08, y1: hz - H * 0.09 };
  const ww = win.x1 - win.x0;
  const wh = win.y1 - win.y0;
  for (let i = 0; i < 3; i++) {
    const y = win.y0 + (wh * (i + 0.5)) / 3;
    line(t + i * 0.12, [win.x0 + 2 * u, y], [win.x1 - 2 * u, y], {
      r: (wh / 3) * 0.62,
      water: 0.75,
      load: w(0.05 - i * 0.01, 0.02 + i * 0.012, 0, 0.004),
      dryEnd: 0,
      wobble: 1,
      dur: 900,
    }, 0.01);
  }
  const sun = { x: win.x0 + ww * between(0.62, 0.74), y: win.y0 + wh * 0.28, r: H * 0.045 };
  drop({ t0: t + 0.4, x: sun.x, y: sun.y, r: sun.r * 2.2, water: 0.5, load: w(0, 0, 0, 0.05) });
  drops.push({ t0: t + 0.7, x: sun.x, y: sun.y, r: sun.r * 0.9, water: 0.4, load: [0, 0, 0, 0], lift: 0.6 });
  t += 0.8;
  // A tree's crown across the top corner, and the garden below: loose
  // dabs of leaf and a scatter of flowers, as Monet would see it.
  for (let i = 0; i < 26; i++) {
    const x = win.x0 + ww * between(0.02, 0.4);
    const y = win.y0 + wh * between(0.04, 0.45);
    drop({ t0: t + i * 0.02, x, y, r: between(3, 7) * u, squash: between(0.6, 0.9), water: 0.45, load: w(0, between(0.08, 0.16), between(0.04, 0.12), 0) });
  }
  for (let i = 0; i < 46; i++) {
    const x = win.x0 + ww * between(0.02, 0.98);
    const y = win.y0 + wh * between(0.55, 0.97);
    drop({ t0: t + 0.4 + i * 0.015, x, y, r: between(2.5, 6) * u, squash: between(0.5, 0.85), water: 0.4, load: w(0, between(0.08, 0.16), between(0.05, 0.14), 0.01) });
  }
  for (let i = 0; i < 16; i++)
    drop({ t0: t + 1.1 + i * 0.02, x: win.x0 + ww * between(0.05, 0.95), y: win.y0 + wh * between(0.62, 0.95), r: between(1.6, 3) * u, water: 0.3, load: w(0, 0, 0.01, between(0.3, 0.45)) });
  t += 1.5;
  // The frame, the glazing bars and the sill.
  const frame = w(0.02, 0.02, 0.12, 0.05);
  outline(t, (win.x0 + win.x1) / 2, (win.y0 + win.y1) / 2, ww, wh, 0, 2 * u, frame);
  line(t + 0.3, [(win.x0 + win.x1) / 2, win.y0], [(win.x0 + win.x1) / 2, win.y1], { r: 1.3 * u, water: 0.25, load: frame, dryEnd: 0, wobble: 0.1, even: true, dur: 500 }, 0.005);
  line(t + 0.35, [win.x0, win.y0 + wh * 0.42], [win.x1, win.y0 + wh * 0.42], { r: 1.3 * u, water: 0.25, load: frame, dryEnd: 0, wobble: 0.1, even: true, dur: 500 }, 0.005);
  line(t + 0.45, [win.x0 - 5 * u, win.y1 + 3 * u], [win.x1 + 5 * u, win.y1 + 3 * u], { r: 3.2 * u, water: 0.4, load: w(0.01, 0.01, 0.05, 0.12), dryEnd: 0, wobble: 0.3, dur: 600 }, 0.005);
  t += 0.8;

  /* The desk: warm wood, its grain, and its back edge against the wall. */
  for (let i = 0; i < 4; i++) {
    const y = hz + (deep * (i + 0.5)) / 4;
    line(t + i * 0.2, [x0 - 4, y], [x1 + 4, y + between(-3, 3) * u], { r: (deep / 4) * 0.85, water: 0.7, load: w(0.008, 0, 0.004 + i * 0.002, 0.11 + i * 0.014), dryEnd: 0, wobble: 1.5, dur: 1300 }, 0.01);
  }
  line(t + 0.3, [x0, hz], [x1, hz + between(-1, 1) * u], { r: 1.8 * u, water: 0.35, load: w(0, 0, 0.03, 0.2), dryEnd: 0, wobble: 0.3, dur: 1400 }, 0.003);
  for (let i = 0; i < 8; i++) {
    const y = hz + deep * between(0.1, 0.95);
    const xa = x0 + W * between(0, 0.6);
    line(t + 0.6 + i * 0.07, [xa, y], [xa + W * between(0.2, 0.45), y + between(-3, 3) * u], { r: 0.7 * u, water: 0.2, load: w(0, 0, 0.012, 0.12), dryEnd: 0.4, wobble: 0.8, even: true, dur: 1200 }, 0.02);
  }
  // Morning light from the window falling across the desk.
  for (let i = 0; i < 5; i++) {
    const f = i / 4;
    const y = hz + deep * (0.08 + f * 0.6);
    const shift = W * 0.07 * (1 + f * 1.4);
    line(t + 1 + i * 0.08, [win.x0 + shift, y], [win.x1 + shift, y], { r: deep * 0.08, water: 0.3, load: [0, 0, 0, 0], lift: 0.28, dryEnd: 0, wobble: 1, dur: 900 }, 0.005);
  }
  t += 1.6;

  // Object scale: the still life fills the desk, but never crowds it.
  const s = Math.min(deep / 50, W / 420);

  /* A plant in a terracotta pot by the window. */
  {
    const px = at(0.1);
    const py = hz + deep * 0.42;
    box(t, px, py, 26 * s, 24 * s, 0, { load: w(0.01, 0, 0.012, 0.3), rows: 3 });
    line(t + 0.15, [px - 15 * s, py - 12 * s], [px + 15 * s, py - 12 * s], { r: 2.2 * s, water: 0.35, load: w(0, 0, 0.04, 0.32), dryEnd: 0, wobble: 0.2, dur: 400 }, 0);
    for (let i = 0; i < 13; i++) {
      const ang = -Math.PI / 2 + ((i + 0.5) / 13 - 0.5) * 2.6 + between(-0.12, 0.12);
      const len = between(30, 56) * s * (1 - Math.abs(((i + 0.5) / 13 - 0.5)) * 0.6);
      line(t + 0.25 + i * 0.05, [px + between(-4, 4) * s, py - 13 * s], [px + Math.cos(ang) * len, py - 13 * s + Math.sin(ang) * len], { r: between(2.2, 3.2) * s, water: 0.45, load: w(0, 0.06, 0.14, 0), dryEnd: 0.7, wobble: 0.6, dur: 380 }, 0.22);
    }
    drop({ t0: t, x: px + 8 * s, y: py + 14 * s, r: 16 * s, squash: 0.25, water: 0.4, load: w(0.01, 0.01, 0.04, 0.03) });
    t += 0.9;
  }

  /* The deck, fanned as on Everdeck's icon: two cards behind in the teal,
     the front one lifted back to white, the E on it, a stroke of
     highlighter under the E. */
  const deck = { x: at(0.33), y: hz + deep * 0.5 };
  const cw = 38 * s;
  const ch = 50 * s;
  // The cards behind are painted round the front one, which stays paper.
  const front = { x: deck.x, y: deck.y, w: cw, h: ch };
  box(t, deck.x - 11 * s, deck.y + 3 * s, cw, ch, -0.21, { load: w(0, 0.08, 0.1, 0), avoid: front, rows: 9 });
  box(t + 0.35, deck.x + 10 * s, deck.y - 2 * s, cw, ch, 0.15, { load: w(0.01, 0.1, 0.03, 0), avoid: front, rows: 9 });
  t += 0.9;
  outline(t + 0.25, deck.x, deck.y, cw, ch, 0, 0.8 * s, w(0, 0.03, 0.12, 0));
  {
    const at2 = turn(deck.x, deck.y - 2 * s, 0);
    const e = w(0, 0.03, 0.26, 0);
    const opt = { water: 0.3, load: e, dryEnd: 0, wobble: 0.1, even: true, dur: 260 };
    line(t + 0.6, at2(-6 * s, -11 * s), at2(-6 * s, 11 * s), { r: 2 * s, ...opt }, 0.01);
    line(t + 0.7, at2(-6 * s, -11 * s), at2(7 * s, -11 * s), { r: 1.6 * s, ...opt }, 0.01);
    line(t + 0.75, at2(-6 * s, 0), at2(4 * s, 0), { r: 1.5 * s, ...opt }, 0.01);
    line(t + 0.8, at2(-6 * s, 11 * s), at2(8 * s, 11 * s), { r: 1.6 * s, ...opt }, 0.01);
    line(t + 0.95, at2(-11 * s, 13 * s), at2(12 * s, 12 * s), { r: 3 * s, water: 0.4, load: w(0, 0, 0, 0.3), dryEnd: 0.3, wobble: 0.4, dur: 300 }, 0.03);
  }
  // Its shadow on the desk.
  drop({ t0: t + 1, x: deck.x + 10 * s, y: deck.y + ch * 0.55, r: cw * 0.7, squash: 0.18, water: 0.35, load: w(0.01, 0.02, 0.05, 0.02) });
  t += 1.2;

  /* An open notebook, a line of notes highlighted, the marker beside it. */
  const nb = { x: at(0.58), y: hz + deep * 0.5, ang: -0.05 };
  const pw = 44 * s;
  const ph = 52 * s;
  const nat = turn(nb.x, nb.y, nb.ang);
  box(t, nb.x, nb.y, pw * 2 + 4 * s, ph, nb.ang, { load: [0, 0, 0, 0], lift: 1, water: 0.3, rows: 7 });
  outline(t + 0.25, nb.x, nb.y, pw * 2 + 4 * s, ph, nb.ang, 0.8 * s, w(0, 0.02, 0.08, 0.03));
  line(t + 0.5, nat(0, -ph / 2), nat(0, ph / 2), { r: 1 * s, water: 0.3, load: w(0, 0.02, 0.08, 0.02), dryEnd: 0, wobble: 0.1, even: true, dur: 300 }, 0.01);
  for (let side = -1; side <= 1; side += 2)
    for (let i = 0; i < 6; i++) {
      const ly = -ph / 2 + ph * (0.18 + i * 0.13);
      const a = nat(side < 0 ? -pw + 6 * s : 6 * s, ly);
      const len = (pw - 12 * s) * between(0.55, 1);
      line(t + 0.6 + i * 0.05 + (side > 0 ? 0.3 : 0), a, nat((side < 0 ? -pw + 6 * s : 6 * s) + len, ly), { r: 0.4 * s, water: 0.15, load: w(0, 0.015, 0.045, 0), dryEnd: 0.3, wobble: 0.6, even: true, dur: 500 }, 0.02);
    }
  const hl = nat(6 * s, -ph / 2 + ph * 0.44);
  const hlEnd = nat(pw - 6 * s, -ph / 2 + ph * 0.44);
  line(t + 1.4, hl, hlEnd, { r: 3.4 * s, water: 0.4, load: w(0, 0, 0, 0.3), dryEnd: 0.2, wobble: 0.5, dur: 350 }, 0.02);
  const pond = { x: (hl[0] + hlEnd[0]) / 2, y: (hl[1] + hlEnd[1]) / 2, rx: (hlEnd[0] - hl[0]) / 2, ry: 4 * s };
  {
    const a = nat(-pw * 0.5, ph / 2 + 10 * s);
    const b = nat(pw * 0.4, ph / 2 + 4 * s);
    line(t + 1.6, a, b, { r: 3.6 * s, water: 0.4, load: w(0, 0, 0.02, 0.26), dryEnd: 0, wobble: 0.2, even: true, dur: 400 }, 0.01);
    const cap = nat(pw * 0.4 + 9 * s, ph / 2 + 3.4 * s);
    line(t + 1.75, b, cap, { r: 3.6 * s, water: 0.35, load: w(0, 0.02, 0.2, 0.04), dryEnd: 0, wobble: 0.1, even: true, dur: 300 }, 0.01);
    // A pencil, too.
    const pa = nat(pw * 0.7, -ph / 2 - 10 * s);
    const pb = nat(pw * 1.25, -ph / 2 + 12 * s);
    line(t + 1.9, pa, pb, { r: 1.5 * s, water: 0.3, load: w(0, 0, 0.03, 0.2), dryEnd: 0, wobble: 0.1, even: true, dur: 400 }, 0.01);
    line(t + 2.05, pb, [pb[0] + 4 * s, pb[1] + 2.2 * s], { r: 1 * s, water: 0.25, load: w(0, 0.02, 0.2, 0), dryEnd: 0.5, wobble: 0, even: true, dur: 200 }, 0);
  }
  drop({ t0: t + 2, x: nb.x + 8 * s, y: nb.y + ph * 0.56, r: pw * 1.1, squash: 0.12, water: 0.35, load: w(0.01, 0.02, 0.04, 0.02) });
  t += 2.2;

  /* A mug of something warm, steam rising off it (the living layer). */
  const mug = { x: at(0.8), y: hz + deep * 0.45 };
  const mw = 24 * s;
  const mh = 28 * s;
  box(t, mug.x, mug.y, mw, mh, 0, { load: w(0.01, 0.12, 0.06, 0), rows: 4 });
  line(t + 0.25, [mug.x - mw / 2, mug.y - mh / 2], [mug.x + mw / 2, mug.y - mh / 2], { r: 2.2 * s, water: 0.35, load: w(0, 0.01, 0.08, 0.2), dryEnd: 0, wobble: 0, dur: 300 }, 0);
  line(t + 0.35, [mug.x + mw / 2, mug.y - mh * 0.28], [mug.x + mw / 2 + 2 * s, mug.y + mh * 0.22], { r: 1.5 * s, water: 0.3, load: w(0, 0.08, 0.1, 0), dryEnd: 0, wobble: 0.1, dur: 300 }, 0.9);
  drop({ t0: t + 0.4, x: mug.x + 6 * s, y: mug.y + mh * 0.55, r: mw * 0.9, squash: 0.22, water: 0.35, load: w(0.01, 0.02, 0.05, 0.02) });
  const steam: [number, number] = [mug.x, mug.y - mh / 2 - 2 * s];
  t += 0.6;

  /* A day-to-a-page calendar pinned to the wall, today's number on it. */
  {
    const cx = at(0.6);
    const cy = y0 + (hz - y0) * 0.45;
    const cw2 = 30 * s;
    const ch2 = 32 * s;
    drop({ t0: t, x: cx + 3 * s, y: cy + 3 * s, r: cw2 * 0.6, squash: 1, water: 0.3, load: w(0.012, 0.006, 0.01, 0.004) });
    box(t + 0.2, cx, cy, cw2, ch2, 0.03, { load: [0, 0, 0, 0], lift: 1, water: 0.3, rows: 4 });
    box(t + 0.45, cx, cy - ch2 * 0.36, cw2, ch2 * 0.28, 0.03, { load: w(0, 0.09, 0.08, 0), rows: 2 });
    outline(t + 0.6, cx, cy, cw2, ch2, 0.03, 0.6 * s, w(0, 0.02, 0.08, 0.02));
    const n = w(0, 0.02, 0.2, 0);
    const o = { water: 0.25, load: n, dryEnd: 0, wobble: 0.15, even: true, dur: 260 };
    // Today ticked off.
    line(t + 0.9, [cx - 6 * s, cy + 1 * s], [cx - 1.5 * s, cy + 6 * s], { r: 1.5 * s, ...o }, 0.05);
    line(t + 1, [cx - 1.5 * s, cy + 6 * s], [cx + 8 * s, cy - 6 * s], { r: 1.5 * s, ...o }, 0.06);
    drop({ t0: t + 1.2, x: cx, y: cy - ch2 / 2 - 2 * s, r: 1.6 * s, water: 0.25, load: w(0, 0, 0.05, 0.3) });
    t += 1.3;
  }

  /* A desk lamp at the far side, leaning over toward the work. */
  const lampBase: [number, number] = [at(0.92), hz + deep * 0.62];
  const elbow: [number, number] = [lampBase[0] + 10 * s, hz - 44 * s];
  const head: [number, number] = [lampBase[0] - 26 * s, hz - 62 * s];
  const arm = w(0, 0.02, 0.18, 0.03);
  drop({ t0: t, x: lampBase[0], y: lampBase[1], r: 11 * s, squash: 0.35, water: 0.4, load: w(0, 0.02, 0.16, 0.03) });
  line(t + 0.15, lampBase, elbow, { r: 1.2 * s, water: 0.25, load: arm, dryEnd: 0, wobble: 0.1, even: true, dur: 500 }, 0.01);
  line(t + 0.4, elbow, head, { r: 1.2 * s, water: 0.25, load: arm, dryEnd: 0, wobble: 0.1, even: true, dur: 500 }, 0.01);
  const shade = turn(head[0], head[1], -0.5);
  box(t + 0.6, ...shade(-8 * s, 4 * s), 22 * s, 13 * s, -0.5, { load: w(0, 0.06, 0.16, 0.02), rows: 3 });
  const bulb = shade(-10 * s, 13 * s);
  drop({ t0: t + 0.9, x: bulb[0], y: bulb[1], r: 3 * s, water: 0.3, load: w(0, 0, 0, 0.3) });
  t += 1.1;

  const features: SceneFeatures = {
    sun,
    cabin: { x: head[0], y: head[1] + 4 * s, w: 40 * s, h: 40 * s, window: bulb, chimney: steam },
    trees: [] as Tree[],
    pond,
    perches: [],
    horizon: hz,
    rabbit: null,
    fall: "none",
    smoke: "steam",
    sky: { x0: win.x0 + 4 * u, y0: win.y0 + 4 * u, x1: win.x1 - 4 * u, y1: win.y0 + wh * 0.5 },
  };
  return { strokes: P.strokes, drops: P.drops, length: t - delay, features };
}

/* ── OpenWrit: a cathedral in the morning ─────────────────────────────── */

export function composeOpenWrit(region: Region, seed: number, delay = 0): Scene {
  const P = painter(region, seed);
  const { rand, between, x0, y0, x1, y1, W, H, u, drops, line, drop, box, outline } = P;
  const at = (f: number) => x0 + W * f;
  const hz = y0 + H * between(0.62, 0.65);
  const deep = y1 - hz;
  const k = Math.min(H / 150, W / 400);
  const perches: [number, number][] = [];
  const trees: Tree[] = [];
  let t = delay;

  /* A dawn sky, pale above and warm low down, and the sun off to one side. */
  for (let i = 0; i < 3; i++) {
    const y = y0 + ((hz - y0) * (i + 0.5)) / 3;
    line(t + i * 0.35, [x0 + W * between(0, 0.03), y], [x1 - W * between(0, 0.03), y + between(-4, 4) * u], {
      r: ((hz - y0) / 3) * 1.15,
      water: 0.85,
      load: w(0.05 - i * 0.012, 0.004 + i * 0.016, 0.001 + i * 0.002, 0),
      dryEnd: 0.05,
      dur: 1300,
    }, 0.02);
  }
  for (let i = 0; i < 4; i++) {
    const y = y0 + (hz - y0) * between(0.1, 0.45);
    const xa = x0 + W * between(0, 0.65);
    line(t + 1 + i * 0.15, [xa, y], [xa + W * between(0.12, 0.28), y + between(-3, 3) * u], { r: between(2.5, 4) * u, squash: 0.5, water: 0.5, load: w(0.01, 0.04, 0.04, 0.006), dryEnd: 0.6, wobble: 1.5, dur: 900 }, 0.03);
  }
  t += 1.6;
  const sun = { x: at(between(0.82, 0.88)), y: y0 + (hz - y0) * between(0.3, 0.38), r: H * 0.045 };
  drop({ t0: t, x: sun.x, y: sun.y, r: sun.r * 2.6, water: 0.6, load: w(0, 0.08, 0.02, 0) });
  drops.push({ t0: t + 0.35, x: sun.x, y: sun.y, r: sun.r, water: 0.45, load: [0, 0, 0, 0], lift: 0.85 });
  t += 0.6;

  // A low line of distant hills behind the town.
  {
    let prev: [number, number] = [x0 + W * 0.01, hz - H * 0.04];
    for (let i = 1; i <= 7; i++) {
      const next: [number, number] = [x0 + (W * 0.98 * i) / 7, hz - H * 0.04 + H * 0.012 * Math.sin(i * 1.3 + seed)];
      line(t + i * 0.08, prev, next, { r: H * 0.03, water: 0.7, load: w(0.012, 0.02, 0.03, 0.006), dryEnd: 0, wobble: 2, dur: 1100 }, 0.03);
      prev = next;
    }
  }
  t += 0.8;

  /* ── The cathedral, at the centre: a west front with two towers and
     their spires, a gable between them with a rose window over the great
     door, the nave running back, and a tall spire over the crossing. The
     morning light comes from the right, so the left faces are in shade. ── */
  const cx = at(0.5);
  const base = hz + H * 0.015;
  const fw = Math.min(W * 0.15, H * 0.42); // the width of the west front
  const tw = fw * 0.27; // each tower
  const towerH = H * 0.3;
  // Stone: warm in the light, a cool grey in shade (sky blue over the
  // warm stone, a little of the green-grey).
  const lit = w(0.01, 0.06, 0.012, 0.004);
  const shade = w(0.04, 0.06, 0.045, 0.014);
  const dark = w(0, 0.02, 0.15, 0.28);
  const spireLoad = w(0, 0.03, 0.12, 0.2);
  /* A spire: strokes pulled up from its base to one point, so it comes
     to a sharp tip. */
  const spire = (x: number, by: number, half: number, h: number, load: Weights, t0: number) => {
    const n = Math.max(4, Math.round(half / (1.6 * k)));
    for (let i = 0; i <= n; i++) {
      const bx = x - half + (2 * half * i) / n;
      // Pulled a little past the tip: a stroke thins out before its end.
      line(t0 + i * 0.03, [bx, by], [x, by - h * 1.2], { r: Math.max(0.6 * k, (half / n) * 0.9), water: 0.3, load, dryEnd: 0, wobble: 0, even: true, dur: 500 }, 0);
    }
  };

  // The nave, running back to the right, and its long roof.
  const naveL = cx + fw * 0.3;
  const naveR = cx + fw * 1.55;
  const naveH = H * 0.16;
  box(t, (naveL + naveR) / 2, base - naveH / 2, naveR - naveL, naveH, 0, { load: w(0.03, 0.06, 0.03, 0.008), rows: 3 });
  for (let i = 0; i < 3; i++) {
    const y = base - naveH - 2.5 * k * (i + 0.5);
    line(t + 0.25 + i * 0.05, [naveL, y], [naveR - i * 2 * k, y], { r: 1.6 * k, water: 0.4, load: w(0, 0.02, 0.12, 0.2), dryEnd: 0, wobble: 0.2, dur: 600 }, 0.004);
  }
  for (let i = 0; i < 6; i++) {
    const x = naveL + ((naveR - naveL) * (i + 0.6)) / 6.4;
    line(t + 0.4 + i * 0.04, [x, base - naveH * 0.25], [x, base - naveH * 0.78], { r: 0.9 * k, water: 0.25, load: dark, dryEnd: 0, wobble: 0.1, even: true, dur: 300 }, 0);
    line(t + 0.45 + i * 0.04, [x + ((naveR - naveL) / 6.4) * 0.5, base], [x + ((naveR - naveL) / 6.4) * 0.5, base - naveH * 0.9], { r: 0.7 * k, water: 0.25, load: shade, dryEnd: 0, wobble: 0.1, even: true, dur: 300 }, 0);
  }
  t += 0.8;

  // The crossing spire, tall and thin, rising from the nave roof.
  const sx = cx + fw * 1.05;
  const sTop = base - H * 0.6;
  {
    const sBase = base - naveH + 2 * k;
    box(t, sx, sBase - 3 * k, 8 * k, 16 * k, 0, { load: shade, rows: 3 });
    spire(sx, sBase - 10 * k, 4 * k, sBase - 10 * k - sTop, spireLoad, t + 0.2);
    line(t + 0.55, [sx, sTop], [sx, sTop - 6 * k], { r: 0.45 * k, water: 0.25, load: dark, dryEnd: 0, wobble: 0, even: true, dur: 200 }, 0);
    line(t + 0.6, [sx - 2 * k, sTop - 4.2 * k], [sx + 2 * k, sTop - 4.2 * k], { r: 0.45 * k, water: 0.25, load: dark, dryEnd: 0, wobble: 0, even: true, dur: 200 }, 0);
    perches.push([sx + 2 * k, sTop - 5 * k]);
    t += 0.8;
  }

  // The two towers: the left one in shade, the right one in the light.
  const towerTop = base - towerH;
  for (const side of [-1, 1]) {
    const tx = cx + side * (fw / 2 - tw / 2);
    box(t, tx, base - towerH / 2, tw, towerH, 0, { load: side < 0 ? shade : lit, rows: 6 });
    // Tall lancet windows and the belfry openings.
    for (const lx of [-0.2, 0.2]) {
      line(t + 0.3, [tx + lx * tw, base - towerH * 0.55], [tx + lx * tw, base - towerH * 0.32], { r: 0.9 * k, water: 0.25, load: dark, dryEnd: 0, wobble: 0.05, even: true, dur: 300 }, 0);
      line(t + 0.35, [tx + lx * tw, towerTop + towerH * 0.22], [tx + lx * tw, towerTop + towerH * 0.08], { r: 1.1 * k, water: 0.25, load: dark, dryEnd: 0, wobble: 0.05, even: true, dur: 300 }, 0);
    }
    // A string course, then the spire.
    line(t + 0.4, [tx - tw / 2 - 1 * k, towerTop + 1 * k], [tx + tw / 2 + 1 * k, towerTop + 1 * k], { r: 1 * k, water: 0.3, load: w(0, 0.02, 0.1, 0.12), dryEnd: 0, wobble: 0, dur: 300 }, 0);
    const spH = H * 0.17;
    spire(tx, towerTop, tw / 2 + 0.6 * k, spH, side < 0 ? spireLoad : w(0, 0.03, 0.09, 0.16), t + 0.5);
    perches.push([tx, towerTop - spH - 1.5 * u], [tx + (side * tw) / 2, towerTop - 1 * k]);
    trees.push({ x: tx, y: base - towerH * 0.6, w: tw * 1.2, h: towerH * 1.2, kind: "pine" });
  }
  t += 1;

  // Between the towers: the gable over the great door, and the rose.
  const mw = fw - tw * 2;
  const gableBase = base - towerH * 0.8;
  box(t, cx, base - towerH * 0.4, mw, towerH * 0.8, 0, { load: lit, rows: 5 });
  {
    const gh = towerH * 0.22;
    const n = 4;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      const half = (mw / 2) * (1 - f) + 0.5 * k;
      line(t + 0.3 + i * 0.04, [cx - half, gableBase - gh * f], [cx + half, gableBase - gh * f], { r: (gh / n) * 0.75, water: 0.35, load: w(0.006, 0.05, 0.05, 0.02), dryEnd: 0, wobble: 0, dur: 300 }, 0);
    }
    line(t + 0.45, [cx - mw / 2, gableBase], [cx, gableBase - gh], { r: 0.7 * k, water: 0.25, load: w(0, 0.02, 0.1, 0.12), dryEnd: 0, wobble: 0, even: true, dur: 300 }, 0);
    line(t + 0.5, [cx + mw / 2, gableBase], [cx, gableBase - gh], { r: 0.7 * k, water: 0.25, load: w(0, 0.02, 0.1, 0.12), dryEnd: 0, wobble: 0, even: true, dur: 300 }, 0);
    // The cross on the gable.
    line(t + 0.55, [cx, gableBase - gh], [cx, gableBase - gh - 7 * k], { r: 0.5 * k, water: 0.25, load: dark, dryEnd: 0, wobble: 0, even: true, dur: 200 }, 0);
    line(t + 0.6, [cx - 2.4 * k, gableBase - gh - 5 * k], [cx + 2.4 * k, gableBase - gh - 5 * k], { r: 0.5 * k, water: 0.25, load: dark, dryEnd: 0, wobble: 0, even: true, dur: 200 }, 0);
    perches.push([cx + 2.4 * k, gableBase - gh - 6 * k]);
  }
  const rose: [number, number] = [cx, base - towerH * 0.56];
  const rr = Math.min(mw * 0.32, H * 0.04);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    drop({ t0: t + 0.7 + i * 0.02, x: rose[0] + Math.cos(a) * rr, y: rose[1] + Math.sin(a) * rr, r: rr * 0.24, water: 0.3, load: w(0, 0.03, 0.12, 0.2) });
  }
  drop({ t0: t + 1, x: rose[0], y: rose[1], r: rr * 0.55, water: 0.3, load: w(0, 0.06, 0.06, 0.1) });
  // The great door and its pointed arch, and a small door each side.
  const door = (x: number, h: number, wd: number, t0: number) => {
    box(t0, x, base - h / 2, wd, h, 0, { load: dark, rows: 2 });
    line(t0 + 0.1, [x - wd / 2, base - h], [x, base - h - wd * 0.7], { r: wd * 0.22, water: 0.3, load: dark, dryEnd: 0, wobble: 0, dur: 200 }, 0);
    line(t0 + 0.12, [x + wd / 2, base - h], [x, base - h - wd * 0.7], { r: wd * 0.22, water: 0.3, load: dark, dryEnd: 0, wobble: 0, dur: 200 }, 0);
  };
  door(cx, towerH * 0.22, mw * 0.36, t + 1.1);
  for (const side of [-1, 1]) door(cx + side * (fw / 2 - tw / 2), towerH * 0.14, tw * 0.36, t + 1.2);
  // A long shadow from the front across the square.
  drop({ t0: t + 1.3, x: cx - fw * 0.6, y: base + 3 * k, r: fw * 0.8, squash: 0.08, water: 0.4, load: w(0.01, 0.04, 0.07, 0.01) });
  t += 1.5;

  /* The town gathered round its foot: low roofs and walls, and trees. */
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1;
    const dist = fw * (0.8 + Math.floor(i / 2) * 0.55) + between(0, 0.12) * fw;
    const x = cx + side * dist + (side > 0 ? fw * 1.05 : 0);
    if (x < x0 + 12 * k || x > x1 - 12 * k) continue;
    const hw = between(9, 14) * k;
    const hh = between(6, 9) * k;
    box(t + i * 0.08, x, base - hh / 2, hw, hh, 0, { load: rand() < 0.5 ? lit : w(0.01, 0.05, 0.06, 0.006), rows: 2 });
    // A pitched roof, and a window.
    for (let r = 0; r < 3; r++) {
      const f = (r + 0.5) / 3;
      const half = (hw / 2 + 1.2 * k) * (1 - f);
      line(t + i * 0.08 + 0.1 + r * 0.03, [x - half, base - hh - 5 * k * f], [x + half, base - hh - 5 * k * f], { r: 1.3 * k, water: 0.35, load: w(0, 0.02, 0.12, 0.24), dryEnd: 0, wobble: 0, dur: 300 }, 0);
    }
    drop({ t0: t + i * 0.08 + 0.2, x: x + hw * 0.18, y: base - hh * 0.5, r: 0.8 * k, squash: 1.3, water: 0.25, load: dark });
  }
  t += 0.9;
  const crown = (x: number, y: number, rx: number, ry: number, t0: number) => {
    for (let i = 0; i < 70; i++) {
      const ang = between(0, Math.PI * 2);
      const rr2 = Math.sqrt(rand());
      const bright = Math.cos(ang) * rr2 > 0.15;
      drop({ t0: t0 + i * 0.01, x: x + Math.cos(ang) * rx * rr2, y: y + Math.sin(ang) * ry * rr2, r: between(2, 4) * k, squash: between(0.6, 0.9), water: 0.35, load: bright ? w(0.004, 0.09, 0.1, 0.01) : w(0, 0.04, 0.17, 0.05) });
    }
    trees.push({ x, y, w: rx * 2, h: ry * 2.2, kind: "bare" });
    perches.push([x - rx * 0.4, y - ry * 0.85]);
  };
  crown(cx - fw * 1.2, base - 13 * k, 20 * k, 15 * k, t);
  crown(cx - fw * 2.3, base - 10 * k, 15 * k, 11 * k, t + 0.3);
  crown(cx + fw * 2.05, base - 11 * k, 17 * k, 13 * k, t + 0.6);
  crown(cx + fw * 2.9, base - 9 * k, 13 * k, 10 * k, t + 0.9);
  t += 1.4;

  /* The meadow before it: a warm ground wash, broken strokes of grass, a
     path to the great door, poppies, and near the front a bench with an
     open book left on it. */
  for (let i = 0; i < 3; i++) {
    const y = hz + (deep * (i + 0.6)) / 3;
    line(t + i * 0.15, [x0 - 4, y], [x1 + 4, y + between(-3, 3) * u], { r: (deep / 3) * 0.85, water: 0.7, load: w(0.01, 0.05 + i * 0.01, 0.012 + i * 0.008, 0), dryEnd: 0, wobble: 1.5, dur: 1300 }, 0.01);
  }
  t += 0.6;
  for (let row = 0; row < 5; row++) {
    const yy = hz + deep * (0.12 + row * 0.19);
    const near = row / 4;
    const n = 16 + row * 4;
    for (let i = 0; i < n; i++) {
      const x = x0 + W * between(-0.02, 1.02);
      const y = yy + between(-0.06, 0.06) * deep;
      const len = between(10, 22) * u * (0.6 + near);
      line(t + row * 0.12 + i * 0.008, [x, y], [x + len, y + between(-2, 2) * u], {
        r: between(2, 4) * u * (0.6 + near * 0.6),
        squash: 0.6,
        water: 0.45,
        load: rand() < 0.5 ? w(0.006, 0.1, 0.04, 0) : w(0, 0.05, 0.1, 0.02),
        dryEnd: 0.4,
        wobble: 0.8,
        dur: 500,
      }, 0.08);
    }
  }
  t += 0.9;
  for (let i = 0; i <= 60; i++) {
    const p = i / 60;
    const q = 1 - p;
    const a: [number, number] = [at(0.44), y1 + 6 * u];
    const b: [number, number] = [at(0.47), hz + deep * 0.5];
    const c: [number, number] = [cx, base + 1 * k];
    const x = q * q * a[0] + 2 * q * p * b[0] + p * p * c[0];
    const y = q * q * a[1] + 2 * q * p * b[1] + p * p * c[1];
    drops.push({ t0: t + p, x, y, r: (1.2 + 7 * q) * k * 0.6, squash: 0.45, water: 0.4, load: [0, 0, 0, 0], lift: 0.5 });
  }
  t += 1.1;
  for (let i = 0; i < 46; i++) {
    const near = Math.pow(rand(), 0.7);
    const x = x0 + W * between(0.02, 0.98);
    if (Math.abs(x - at(0.45)) < W * 0.04) continue;
    const y = hz + deep * (0.3 + near * 0.66);
    drop({ t0: t + i * 0.02, x, y, r: (0.6 + near * 1.4) * k, squash: 0.8, water: 0.18, load: w(0, 0.01, 0.1, between(0.35, 0.5)) });
  }
  t += 1;
  {
    const bx = at(0.17);
    const by = hz + deep * 0.62;
    const bw = 28 * k;
    const seat = w(0, 0.02, 0.12, 0.28);
    line(t, [bx - bw / 2, by], [bx + bw / 2, by], { r: 1.2 * k, water: 0.3, load: seat, dryEnd: 0, wobble: 0.1, even: true, dur: 400 }, 0.005);
    line(t + 0.1, [bx - bw / 2 + 1.5 * k, by - 6 * k], [bx + bw / 2 - 1.5 * k, by - 6 * k], { r: 0.9 * k, water: 0.3, load: seat, dryEnd: 0, wobble: 0.1, even: true, dur: 400 }, 0.005);
    for (const lx of [-bw / 2 + 2 * k, bw / 2 - 2 * k])
      line(t + 0.2, [bx + lx, by - 6 * k], [bx + lx, by + 6 * k], { r: 0.8 * k, water: 0.25, load: seat, dryEnd: 0, wobble: 0, even: true, dur: 300 }, 0);
    drop({ t0: t + 0.25, x: bx - 4 * k, y: by + 7 * k, r: bw * 0.6, squash: 0.15, water: 0.35, load: w(0.01, 0.03, 0.06, 0.03) });
    const kx = bx + 3 * k;
    const ky = by - 2 * k;
    box(t + 0.4, kx, ky, 15 * k, 5 * k, -0.04, { load: [0, 0, 0, 0], lift: 1, water: 0.3, rows: 2 });
    outline(t + 0.55, kx, ky, 15 * k, 5 * k, -0.04, 0.4 * k, w(0, 0.01, 0.08, 0.14));
    line(t + 0.7, [kx, ky - 2.5 * k], [kx, ky + 2.5 * k], { r: 0.35 * k, water: 0.2, load: w(0, 0.01, 0.08, 0.14), dryEnd: 0, wobble: 0, even: true, dur: 200 }, 0);
    line(t + 0.8, [kx + 0.6 * k, ky + 2.5 * k], [kx + 2 * k, ky + 6.5 * k], { r: 0.4 * k, water: 0.25, load: w(0, 0, 0.06, 0.36), dryEnd: 0.3, wobble: 0.2, even: true, dur: 200 }, 0.2);
    perches.push([bx - bw / 2 + 3 * k, by - 7 * k]);
    t += 1;
  }

  const features: SceneFeatures = {
    sun,
    // The cathedral's front: point at it and the rose window glows; at
    // night it's lit from within.
    cabin: { x: cx, y: base - towerH * 0.5, w: fw, h: towerH, window: rose, chimney: [sx, sTop] },
    trees,
    pond: NOWHERE,
    perches,
    horizon: hz,
    rabbit: null,
    fall: "petals",
    smoke: "none",
    grain: [214, 128, 104],
  };
  return { strokes: P.strokes, drops: P.drops, length: t - delay, features };
}
