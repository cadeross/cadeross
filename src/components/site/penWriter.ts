/* Writes the homepage introduction out with a pen, in handwritten mode
   (html[data-type="hand"], hand.css). Used by HeroIntro.

   Each word is drawn into a canvas in the same hand, then thinned to a
   one-pixel skeleton: the line a nib would have followed. The skeleton is
   traced into strokes the way a hand would write them (left to right,
   carrying on through crossings and loops in the direction it's going,
   lifting between letters that don't join, and going back to dot the i's
   and add apostrophes once the word is done). A mask then follows those
   strokes over time, as wide as the letter is at each point, so the word
   appears where the pen has been and nowhere else.

   The cadence is a hand's: the pen speeds up along straight runs and
   slows into curves and turns, eases in where it touches down and out
   where it lifts, travels quickly through the air between strokes, and
   rests between words, after punctuation and before each new line. The
   ink is drawn exactly as the finished text looks, and once a word is
   down its canvas gives way to the real text. */

type Pt = { x: number; y: number; r: number };
type Stroke = { pts: Pt[]; times: number[] };
type Run = {
  text: string;
  font: string;
  color: string;
  x: number;
  y: number;
};
type WordPlan = {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  mask: HTMLCanvasElement;
  mctx: CanvasRenderingContext2D;
  ink: HTMLCanvasElement;
  segs: { x0: number; y0: number; x1: number; y1: number; w: number; t: number }[];
  drawn: number;
  start: number;
  end: number;
  done: boolean;
};

/* Pace, in ems of path per second, and pauses, in seconds. */
const PEN = {
  speed: 26,
  air: 30,
  start: 0.3,
  liftInWord: 0.045,
  liftWord: 0.11,
  lineReturn: 0.34,
  rest: 0.14,
  dotPause: 0.08,
  /* The whole introduction never takes longer than this; a slower plan
     is played faster. */
  maxTotal: 7,
};

const SCALE = 2;

/* Zhang–Suen thinning: erode the letters to a one-pixel centre line. */
function thin(img: Uint8Array, w: number, h: number) {
  const del: number[] = [];
  let changed = true;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img[y * w + x]);
  while (changed) {
    changed = false;
    for (let pass = 0; pass < 2; pass++) {
      del.length = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (!img[y * w + x]) continue;
          const p2 = at(x, y - 1), p3 = at(x + 1, y - 1), p4 = at(x + 1, y), p5 = at(x + 1, y + 1);
          const p6 = at(x, y + 1), p7 = at(x - 1, y + 1), p8 = at(x - 1, y), p9 = at(x - 1, y - 1);
          const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (b < 2 || b > 6) continue;
          const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
          let a = 0;
          for (let i = 0; i < 8; i++) if (!seq[i] && seq[i + 1]) a++;
          if (a !== 1) continue;
          if (pass === 0 ? p2 * p4 * p6 || p4 * p6 * p8 : p2 * p4 * p8 || p2 * p6 * p8) continue;
          del.push(y * w + x);
        }
      }
      for (const i of del) img[i] = 0;
      if (del.length) changed = true;
    }
  }
}

/* Chamfer distance to the nearest blank pixel: half the letter's width. */
function distance(bin: Uint8Array, w: number, h: number) {
  const d = new Float32Array(w * h);
  const INF = 1e6;
  for (let i = 0; i < w * h; i++) d[i] = bin[i] ? INF : 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!d[i]) continue;
      if (x > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
      if (y > 0) d[i] = Math.min(d[i], d[i - w] + 1);
      if (x > 0 && y > 0) d[i] = Math.min(d[i], d[i - w - 1] + 1.414);
      if (x < w - 1 && y > 0) d[i] = Math.min(d[i], d[i - w + 1] + 1.414);
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (!d[i]) continue;
      if (x < w - 1) d[i] = Math.min(d[i], d[i + 1] + 1);
      if (y < h - 1) d[i] = Math.min(d[i], d[i + w] + 1);
      if (x < w - 1 && y < h - 1) d[i] = Math.min(d[i], d[i + w + 1] + 1.414);
      if (x > 0 && y < h - 1) d[i] = Math.min(d[i], d[i + w - 1] + 1.414);
    }
  return d;
}

const N8 = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
] as const;

/* Trace the skeleton into pen strokes, in writing order. */
function trace(sk: Uint8Array, w: number, h: number, em: number) {
  const seen = new Uint8Array(w * h);
  const comp = new Int32Array(w * h).fill(-1);
  const comps: { px: number[]; minX: number; small: boolean }[] = [];
  let ids = 0;
  for (let i = 0; i < w * h; i++) {
    if (!sk[i] || comp[i] >= 0) continue;
    const id = ids++;
    const px: number[] = [];
    const q = [i];
    comp[i] = id;
    let minX = w, maxX = 0, minY = h, maxY = 0;
    while (q.length) {
      const p = q.pop()!;
      px.push(p);
      const x = p % w, y = (p / w) | 0;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (const [dx, dy] of N8) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const n = ny * w + nx;
        if (sk[n] && comp[n] < 0) {
          comp[n] = id;
          q.push(n);
        }
      }
    }
    const span = Math.max(maxX - minX, maxY - minY);
    comps.push({ px, minX, small: span < em * 0.3 });
  }
  // The body of the word left to right, then the dots and ticks.
  comps.sort((a, b) => Number(a.small) - Number(b.small) || a.minX - b.minX);

  const free = (p: number) => {
    const x = p % w, y = (p / w) | 0;
    let n = 0;
    for (const [dx, dy] of N8) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && sk[ny * w + nx] && !seen[ny * w + nx]) n++;
    }
    return n;
  };

  const strokes: { px: number[]; small: boolean }[] = [];
  let pen: { x: number; y: number } | null = null;
  for (const c of comps) {
    for (;;) {
      const left = c.px.filter((p) => !seen[p]);
      if (!left.length) break;
      // Touch down at a loose end: the nearest to the pen, not far back.
      let ends = left.filter((p) => free(p) <= 1);
      if (!ends.length) ends = left;
      let start = ends[0];
      let best = Infinity;
      for (const p of ends) {
        const x = p % w, y = (p / w) | 0;
        const score = pen
          ? Math.hypot(x - pen.x, y - pen.y) + (x < pen.x - em * 0.25 ? em * 3 : 0)
          : x + y * 0.05;
        if (score < best) {
          best = score;
          start = p;
        }
      }
      const path = [start];
      seen[start] = 1;
      let cur = start;
      let dir = { x: 1, y: 0 };
      for (;;) {
        const cx = cur % w, cy = (cur / w) | 0;
        if (path.length > 4) {
          const back = path[path.length - 5];
          const bx = cx - (back % w), by = cy - ((back / w) | 0);
          const len = Math.hypot(bx, by) || 1;
          dir = { x: bx / len, y: by / len };
        }
        let next = -1;
        let nextScore = -Infinity;
        for (const [dx, dy] of N8) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const n = ny * w + nx;
          if (!sk[n] || seen[n]) continue;
          const s = (dx * dir.x + dy * dir.y) / Math.hypot(dx, dy);
          if (s > nextScore) {
            nextScore = s;
            next = n;
          }
        }
        // Carry straight on through a crossing the pen has already made.
        if (next < 0) {
          for (const [dx, dy] of N8) {
            const s = (dx * dir.x + dy * dir.y) / Math.hypot(dx, dy);
            if (s < 0.6) continue;
            for (let k = 2; k <= 4 && next < 0; k++) {
              const nx = cx + dx * k, ny = cy + dy * k;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) break;
              const n = ny * w + nx;
              if (sk[n] && !seen[n] && comp[n] === comp[cur]) next = n;
            }
            if (next >= 0) break;
          }
        }
        if (next < 0) break;
        // Take the corner pixel of a staircase along with the step.
        const nx = next % w, ny = (next / w) | 0;
        if (Math.abs(nx - cx) === 1 && Math.abs(ny - cy) === 1) {
          for (const c2 of [cy * w + nx, ny * w + cx]) if (sk[c2]) seen[c2] = 1;
        }
        seen[next] = 1;
        path.push(next);
        cur = next;
      }
      pen = { x: cur % w, y: (cur / w) | 0 };
      strokes.push({ px: path, small: c.small });
    }
  }
  return strokes;
}

/* Times along a stroke: fast on the straights, slow into turns, easing in
   at the touch-down and out at the lift. Returns per-point times from 0. */
function timeStroke(pts: Pt[], em: number, speed: number, easeIn = true) {
  const times = [0];
  const len: number[] = [0];
  for (let i = 1; i < pts.length; i++)
    len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = len[len.length - 1] || 1;
  const k = Math.max(3, Math.round(em * 0.06));
  for (let i = 1; i < pts.length; i++) {
    const a = pts[Math.max(0, i - k)], b = pts[i], c = pts[Math.min(pts.length - 1, i + k)];
    const ax = b.x - a.x, ay = b.y - a.y, cx = c.x - b.x, cy = c.y - b.y;
    const la = Math.hypot(ax, ay), lc = Math.hypot(cx, cy);
    const turn = la && lc ? Math.acos(Math.max(-1, Math.min(1, (ax * cx + ay * cy) / (la * lc)))) : 0;
    let v = speed * (0.42 + 0.58 * Math.max(0, 1 - turn / 1.1));
    const fromStart = len[i] / em, toEnd = (total - len[i]) / em;
    if (easeIn) v *= 0.35 + 0.65 * Math.min(1, fromStart / 0.12);
    v *= 0.5 + 0.5 * Math.min(1, toEnd / 0.1);
    times.push(times[i - 1] + (len[i] - len[i - 1]) / em / v);
  }
  return times;
}

function smooth(pts: Pt[]) {
  if (pts.length < 5) return pts;
  return pts.map((_, i) => {
    let x = 0, y = 0, r = 0, n = 0;
    for (let j = Math.max(0, i - 3); j <= Math.min(pts.length - 1, i + 3); j++) {
      x += pts[j].x; y += pts[j].y; r += pts[j].r; n++;
    }
    return { x: x / n, y: y / n, r: r / n };
  });
}

/* Computed colours can come back as color(srgb …) (from color-mix),
   which a canvas may not take; turn those into rgba(). */
function paintable(c: string) {
  const m = c.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/);
  if (!m) return c;
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => Math.round(parseFloat(v) * 255));
  return `rgba(${r}, ${g}, ${b}, ${m[4] ?? 1})`;
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/* Measure a word's text as laid out, without its slight lean. */
function measure(word: HTMLElement, margin: number) {
  const rotate = word.style.rotate, translate = word.style.translate;
  word.style.rotate = "0deg";
  word.style.translate = "0px 0px";
  const box = word.getBoundingClientRect();
  const ox = box.left - margin, oy = box.top - margin;
  const runs: Run[] = [];
  const probe = document.createElement("canvas").getContext("2d")!;
  const walker = document.createTreeWalker(word, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    if (!text.trim()) continue;
    const el = node.parentElement!;
    const cs = getComputedStyle(el);
    range.selectNodeContents(node);
    const r = range.getBoundingClientRect();
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    probe.font = font;
    const m = probe.measureText(text);
    const run: Run = {
      text,
      font,
      color: paintable(cs.color),
      x: r.left - ox,
      y: r.top - oy + m.fontBoundingBoxAscent,
    };
    runs.push(run);
  }
  word.style.rotate = rotate;
  word.style.translate = translate;
  return { width: box.width + margin * 2, height: box.height + margin * 2, runs };
}

function paintRuns(c: HTMLCanvasElement, runs: Run[], color?: string) {
  const ctx = c.getContext("2d")!;
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.textBaseline = "alphabetic";
  for (const run of runs) {
    ctx.font = run.font;
    ctx.fillStyle = color ?? run.color;
    ctx.fillText(run.text, run.x, run.y);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/* Plan the writing of every `selector` word inside `intro` (the homepage
   introduction, or the signature) and start the pen. Returns a function
   that stops it and shows the text as it is. */
export function writeIntro(intro: HTMLElement, onDone: () => void, selector = ".hero-word") {
  const words = [...intro.querySelectorAll<HTMLElement>(selector)];

  intro.dataset.measure = "";
  const measured = words.map((el) => {
    const em = parseFloat(getComputedStyle(el).fontSize) || 32;
    const margin = Math.ceil(em * 0.7);
    return { el, em, margin, top: el.getBoundingClientRect().top, ...measure(el, margin) };
  });
  delete intro.dataset.measure;

  const plans: WordPlan[] = [];
  let t = PEN.start;
  let lastTop: number | null = null;
  let lastText = "";
  for (const m of measured) {
    const em = m.em * SCALE;
    if (lastTop !== null) {
      t += m.top > lastTop + m.em * 0.5 ? PEN.lineReturn : PEN.liftWord;
      if (/[.,;:!?]$/.test(lastText)) t += PEN.rest;
    }
    lastTop = m.top;
    lastText = m.el.textContent?.trim() ?? "";

    const W = Math.ceil(m.width * SCALE), H = Math.ceil(m.height * SCALE);
    const ink = canvas(W, H);
    paintRuns(ink, m.runs);

    // The letters alone, as a bitmap to find the pen's path.
    const shape = canvas(W, H);
    paintRuns(shape, m.runs, "#000");
    const data = shape.getContext("2d")!.getImageData(0, 0, W, H).data;
    const bin = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) bin[i] = data[i * 4 + 3] > 100 ? 1 : 0;
    const dist = distance(bin, W, H);
    const sk = bin.slice();
    thin(sk, W, H);

    const strokes: Stroke[] = [];
    const raw = trace(sk, W, H, em);
    let prev: Pt | null = null;
    let wordT = 0;
    let wentBack = false;
    for (const s of raw) {
      const pts = smooth(
        s.px.map((p) => {
          const x = p % W, y = (p / W) | 0;
          return { x, y, r: Math.max(dist[p], 1) + 1.6 };
        }),
      );
      // A stray pixel or two the tracing left behind: no lift for it.
      if (s.px.length < 4 && !s.small) {
        strokes.push({ pts, times: pts.map(() => wordT) });
        continue;
      }
      // A branch that leaves from ink already down is carried on from
      // there, the pen gliding back along its line rather than lifting.
      let branch = false;
      if (prev && !s.small) {
        const p0 = pts[0];
        const near = (em * 0.07) ** 2;
        branch = strokes.some((st) =>
          st.pts.some((q) => (q.x - p0.x) ** 2 + (q.y - p0.y) ** 2 < near),
        );
      }
      if (prev) {
        const gap = Math.hypot(pts[0].x - prev.x, pts[0].y - prev.y) / em;
        wordT += branch ? gap / (PEN.air * 1.4) : PEN.liftInWord + gap / PEN.air;
        if (s.small && !wentBack) {
          wordT += PEN.dotPause;
          wentBack = true;
        }
      }
      const times = timeStroke(pts, em, PEN.speed, !branch).map((x) => x + wordT);
      wordT = times[times.length - 1];
      strokes.push({ pts, times });
      prev = pts[pts.length - 1];
    }
    const segs: WordPlan["segs"] = [];
    for (const s of strokes) {
      for (let i = 1; i < s.pts.length; i++) {
        const a = s.pts[i - 1], b = s.pts[i];
        segs.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, w: (a.r + b.r), t: t + s.times[i] });
      }
      if (s.pts.length === 1 || s.pts.length === 2) {
        const p = s.pts[0];
        segs.push({ x0: p.x, y0: p.y, x1: p.x + 0.01, y1: p.y, w: p.r * 2, t: t + s.times[0] });
      }
    }
    segs.sort((a, b) => a.t - b.t);

    const el = canvas(W, H);
    el.className = "pen-canvas";
    el.setAttribute("aria-hidden", "true");
    el.style.width = `${m.width}px`;
    el.style.height = `${m.height}px`;
    el.style.left = `${-m.margin}px`;
    el.style.top = `${-m.margin}px`;
    const mask = canvas(W, H);
    plans.push({
      el: m.el,
      canvas: el,
      ctx: el.getContext("2d")!,
      mask,
      mctx: mask.getContext("2d")!,
      ink,
      segs,
      drawn: 0,
      start: t,
      end: t + wordT,
      done: false,
    });
    m.el.style.setProperty("--w-start", `${t.toFixed(3)}s`);
    t += wordT;
  }

  const pace = t > PEN.maxTotal ? PEN.maxTotal / t : 1;
  if (pace < 1)
    for (const p of plans) {
      p.start *= pace;
      p.end *= pace;
      for (const s of p.segs) s.t *= pace;
      p.el.style.setProperty("--w-start", `${p.start.toFixed(3)}s`);
    }

  for (const p of plans) {
    p.el.appendChild(p.canvas);
    p.mctx.lineCap = "round";
    p.mctx.lineJoin = "round";
  }

  const t0 = performance.now();
  let raf = 0;
  let stopped = false;

  const finish = (p: WordPlan) => {
    p.done = true;
    p.canvas.remove();
    p.el.dataset.written = "";
  };

  const frame = (now: number) => {
    const time = (now - t0) / 1000;
    let active = false;
    for (const p of plans) {
      if (p.done) continue;
      active = true;
      if (time < p.start) continue;
      // Lay down the ink the pen has reached.
      const m = p.mctx;
      m.strokeStyle = "#000";
      const before = p.drawn;
      while (p.drawn < p.segs.length && p.segs[p.drawn].t <= time) {
        const s = p.segs[p.drawn++];
        m.lineWidth = s.w;
        m.beginPath();
        m.moveTo(s.x0, s.y0);
        m.lineTo(s.x1, s.y1);
        m.stroke();
      }
      // Only touch the canvas when the pen has put down more ink: every
      // repaint runs the ink filter over the word again, which Safari does
      // on the CPU.
      if (p.drawn > before) {
        const c = p.ctx;
        c.globalCompositeOperation = "source-over";
        c.clearRect(0, 0, p.canvas.width, p.canvas.height);
        c.drawImage(p.mask, 0, 0);
        c.globalCompositeOperation = "source-in";
        c.drawImage(p.ink, 0, 0);
        c.globalCompositeOperation = "source-over";
      }

      if (p.drawn >= p.segs.length && time > p.end + 0.05) finish(p);
    }
    if (active && !stopped) raf = requestAnimationFrame(frame);
    else if (!stopped) onDone();
  };
  raf = requestAnimationFrame(frame);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    for (const p of plans) if (!p.done) finish(p);
  };
}
