/* The brushwork. A page's painting is laid in the way a wash is painted:
   a quick pass of clear water at the top, then loaded strokes across the
   sheet from top to bottom, each one catching the wet lower edge of the
   last so they bleed together, the colour moving down the palette as it
   goes. Then a charge or two of the deep colour dropped into the wet,
   a lighter glaze, and a flick of spatter.

   Positions are CSS pixels from the canvas's top left. */

export type Weights = [number, number, number, number];

export type Dab = {
  x: number;
  y: number;
  r: number;
  water: number;
  load: Weights;
  lift: number;
  dry: number;
  /* Height over width; 1 is round. */
  squash?: number;
};

export type Stroke = {
  t0: number;
  dur: number;
  /* A quadratic curve: start, bend, end. */
  p: [[number, number], [number, number], [number, number]];
  r: number;
  water: number;
  load: Weights;
  dryEnd: number;
  wobble: number;
  seed: number;
  lift?: number;
  squash?: number;
  /* A steady line (a twig, a post): no press and lift along the stroke. */
  even?: boolean;
};

export type Drop = {
  t0: number;
  x: number;
  y: number;
  r: number;
  water: number;
  load: Weights;
  lift?: number;
  squash?: number;
};

export type Region = { x0: number; y0: number; x1: number; y1: number };

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* How much of each palette stop a stroke carries at a point down the
   sheet: the same ramp the light field uses, pale at the top, one deep
   note, a warm landing. */
export function rampWeights(t: number): Weights {
  const s1 = smooth(0, 0.36, t);
  const s2 = smooth(0.3, 0.66, t);
  const s3 = smooth(0.62, 1, t);
  return [
    (1 - s1) * (1 - s2) * (1 - s3),
    s1 * (1 - s2) * (1 - s3),
    s2 * (1 - s3),
    s3,
  ];
}

const scale = (w: Weights, k: number): Weights => [
  w[0] * k,
  w[1] * k,
  w[2] * k,
  w[3] * k,
];

export type Composition = { strokes: Stroke[]; drops: Drop[]; length: number };

export function compose(region: Region, seed: number, delay = 0): Composition {
  const rand = rng(seed);
  const between = (a: number, b: number) => a + (b - a) * rand();
  const { x0, y0, x1, y1 } = region;
  const W = x1 - x0;
  const H = y1 - y0;
  const strokes: Stroke[] = [];
  const drops: Drop[] = [];
  const tall = H > W * 0.9;
  const rows = Math.max(3, Math.min(8, Math.round(H / (tall ? 118 : 96))));
  const rowH = H / rows;
  const speed = between(1000, 1300);
  const gap = 0.3;
  let t = delay;

  /* Clear water over the top, so the first colour softens into it. */
  const wetRows = Math.max(1, Math.round(rows * 0.4));
  for (let i = 0; i < wetRows; i++) {
    const y = y0 + rowH * (i + 0.5);
    const ltr = i % 2 === 0;
    const a: [number, number] = [x0 + W * between(0.0, 0.08), y];
    const b: [number, number] = [x1 - W * between(0.0, 0.1), y + between(-0.2, 0.2) * rowH];
    strokes.push({
      t0: t + i * 0.12,
      dur: W / (speed * 1.6),
      p: ltr ? [a, [(a[0] + b[0]) / 2, y + between(-0.3, 0.3) * rowH], b] : [b, [(a[0] + b[0]) / 2, y], a],
      r: rowH * 0.75,
      water: 0.55,
      load: [0, 0, 0, 0],
      dryEnd: 0,
      wobble: rowH * 0.12,
      seed: rand() * 100,
    });
  }
  t += wetRows * 0.12 + 0.12;

  /* The wash, row by row. */
  const density = between(0.5, 0.62);
  for (let i = 0; i < rows; i++) {
    const f = (i + 0.5) / rows;
    const y = y0 + rowH * (i + 0.5) + between(-0.1, 0.1) * rowH;
    const ltr = i % 2 === 0;
    // Rows rarely start and stop at the same place.
    const a: [number, number] = [x0 + W * between(-0.01, 0.13), y];
    const b: [number, number] = [x1 - W * between(-0.01, 0.15), y + between(-0.28, 0.28) * rowH];
    const mid: [number, number] = [
      (a[0] + b[0]) / 2 + between(-0.1, 0.1) * W,
      y + between(-0.35, 0.35) * rowH,
    ];
    const dur = Math.abs(b[0] - a[0]) / speed;
    strokes.push({
      t0: t,
      dur,
      p: ltr ? [a, mid, b] : [b, mid, a],
      r: rowH * between(0.6, 0.72),
      water: between(0.78, 0.92),
      load: scale(rampWeights(f), density * between(0.85, 1.15) * 0.085),
      dryEnd: between(0.25, 0.6),
      wobble: rowH * between(0.06, 0.14),
      seed: rand() * 100,
    });
    t += Math.max(gap, dur * 0.55);
  }
  const washEnd = t;

  /* Deep colour dropped into the wet, low on the sheet, where it blooms. */
  const charges = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < charges; i++) {
    const fy = between(0.38, 0.85);
    drops.push({
      t0: delay + 0.5 + (washEnd - delay) * fy + between(0.05, 0.25),
      x: x0 + W * between(0.15, 0.85),
      y: y0 + H * fy,
      r: Math.min(W, H) * between(0.05, 0.09),
      water: 0.6,
      load: scale(rampWeights(Math.min(1, fy + 0.1)), 0.32),
    });
  }

  /* A lighter glaze across the middle while it's still damp. */
  const gy = y0 + H * between(0.35, 0.6);
  const ga: [number, number] = [x0 + W * between(0.05, 0.3), gy];
  const gb: [number, number] = [x1 - W * between(0.05, 0.35), gy + between(-0.5, 0.5) * rowH];
  strokes.push({
    t0: washEnd + 0.15,
    dur: Math.abs(gb[0] - ga[0]) / (speed * 0.9),
    p: [ga, [(ga[0] + gb[0]) / 2, gy + between(-0.6, 0.6) * rowH], gb],
    r: rowH * 0.42,
    water: 0.7,
    load: scale(rampWeights(between(0.4, 0.6)), 0.05),
    dryEnd: 0.7,
    wobble: rowH * 0.1,
    seed: rand() * 100,
  });

  /* Spatter, flicked from one corner. */
  const cx = rand() < 0.5 ? x0 + W * 0.12 : x1 - W * 0.12;
  const cy = rand() < 0.5 ? y0 + H * 0.2 : y1 - H * 0.18;
  const flecks = 9 + Math.floor(rand() * 8);
  for (let i = 0; i < flecks; i++) {
    const ang = rand() * Math.PI * 2;
    const dist = Math.pow(rand(), 0.7) * Math.min(W, H) * 0.24;
    drops.push({
      t0: washEnd + 0.5 + rand() * 0.18,
      x: cx + Math.cos(ang) * dist,
      y: cy + Math.sin(ang) * dist * 0.8,
      r: between(1.4, 4.8) * (rand() < 0.15 ? 2 : 1),
      water: 0.7,
      load: scale(rampWeights(between(0.5, 0.9)), 0.5),
    });
  }

  return { strokes, drops, length: washEnd + 0.8 };
}

/* Plays a composition back as dabs, a frame at a time. */
export class Player {
  private strokes: (Stroke & { done: number })[] = [];
  private drops: Drop[] = [];
  time = 0;

  load(c: Composition, at = this.time) {
    for (const s of c.strokes) this.strokes.push({ ...s, t0: s.t0 + at, done: 0 });
    for (const d of c.drops) this.drops.push({ ...d, t0: d.t0 + at });
  }

  get busy() {
    return this.strokes.length > 0 || this.drops.length > 0;
  }

  clear() {
    this.strokes = [];
    this.drops = [];
  }

  advance(dt: number, out: Dab[]) {
    this.time += dt;
    const now = this.time;
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      if (d.t0 > now) continue;
      out.push({ x: d.x, y: d.y, r: d.r, water: d.water, load: d.load, lift: d.lift ?? 0, dry: 0, squash: d.squash });
      this.drops.splice(i, 1);
    }
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const s = this.strokes[i];
      if (s.t0 > now) continue;
      const p1 = Math.min(1, (now - s.t0) / Math.max(s.dur, 0.001));
      let p = s.done;
      while (p < p1) {
        const at = this.at(s, p);
        out.push(at.dab);
        // Dabs about a third of a brush apart, by distance along the curve.
        const step = Math.max(0.002, (at.dab.r * 0.3) / Math.max(1, at.len));
        p += step;
      }
      s.done = p;
      if (p1 >= 1) this.strokes.splice(i, 1);
    }
  }

  private at(s: Stroke, p: number) {
    const [a, b, c] = s.p;
    const u = 1 - p;
    const x = u * u * a[0] + 2 * u * p * b[0] + p * p * c[0];
    const y = u * u * a[1] + 2 * u * p * b[1] + p * p * c[1];
    const dx = 2 * u * (b[0] - a[0]) + 2 * p * (c[0] - b[0]);
    const dy = 2 * u * (b[1] - a[1]) + 2 * p * (c[1] - b[1]);
    const len = Math.hypot(dx, dy);
    const nx = -dy / Math.max(len, 1);
    const ny = dx / Math.max(len, 1);
    const wob =
      Math.sin(p * 9.0 + s.seed) * 0.6 + Math.sin(p * 23.0 + s.seed * 1.7) * 0.4;
    // The brush lands, presses, then lifts and runs dry toward the end.
    const press = s.even ? 1 : smooth(0, 0.06, p) * (1 - 0.5 * smooth(0.55, 1, p));
    const r = s.r * (0.4 + 0.6 * press) * (0.92 + 0.08 * Math.sin(p * 31 + s.seed));
    const spent = 1 - 0.4 * p;
    return {
      len,
      dab: {
        x: x + nx * wob * s.wobble,
        y: y + ny * wob * s.wobble,
        r,
        water: s.water * (1 - 0.3 * p),
        load: scale(s.load, spent),
        lift: s.lift ?? 0,
        dry: s.dryEnd * smooth(0.72, 1, p),
        squash: s.squash,
      },
    };
  }
}
