/* The brushwork: strokes (a brush pulled along a curve, pressing and
   lifting, running dry at the end) and drops (a single touch of the
   brush), and the player that turns a composition into dabs a frame at a
   time. The scene itself is composed in scene.ts.

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

const scale = (w: Weights, k: number): Weights => [
  w[0] * k,
  w[1] * k,
  w[2] * k,
  w[3] * k,
];

export type Composition = { strokes: Stroke[]; drops: Drop[]; length: number };

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
