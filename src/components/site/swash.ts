/* Underline flourishes in handwritten mode (hand.css), shared by the
   introduction's project names and the signature. */

/* Underline flourishes for the project names in handwritten mode, in a
   120 × 24 box stretched under the name. Each is a pen stroke with some
   flare: it touches down light, swells as it runs under the word and
   thins out past the end. They differ, as two strokes by hand would: the
   first dips and flicks up at the end; the second drops in from above
   and trails off downward; the third is the signature's, a long stroke
   that sweeps back under the name. The stroke is a
   filled, tapered shape, uncovered along its centre line as it's drawn. */
type P = [number, number];
const SWASH_CURVES: [P, P, P, P][][] = [
  [
    [[4, 9], [24, 15], [62, 16], [96, 12]],
    [[96, 12], [107, 10.6], [114, 5], [119, -3.5]],
  ],
  [
    [[1, 6], [14, 9], [52, 14.5], [88, 13.5]],
    [[88, 13.5], [102, 13], [111, 12.5], [120, 15.5]],
  ],
  [
    [[6, 16], [30, 20], [78, 19], [108, 11]],
    [[108, 11], [116, 7], [118, 3], [113, 4]],
  ],
];

function swash(curves: [P, P, P, P][]) {
  const pts: { x: number; y: number; tx: number; ty: number }[] = [];
  for (const [a, b, c, d] of curves) {
    for (let i = pts.length ? 1 : 0; i <= 32; i++) {
      const t = i / 32, u = 1 - t;
      const x = u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0];
      const y = u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1];
      const tx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
      const ty = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
      pts.push({ x, y, tx, ty });
    }
  }
  // Light at the touch-down, full through the run, a hairline at the flick.
  const width = (f: number) =>
    5.6 * (f < 0.22 ? 0.35 + 0.65 * Math.sin((f / 0.22) * (Math.PI / 2)) : 1 - 0.72 * ((f - 0.22) / 0.78) ** 1.8);
  const left: string[] = [];
  const right: string[] = [];
  pts.forEach((p, i) => {
    const len = Math.hypot(p.tx, p.ty) || 1;
    const nx = -p.ty / len, ny = p.tx / len;
    const w = width(i / (pts.length - 1)) / 2;
    left.push(`${(p.x + nx * w).toFixed(2)} ${(p.y + ny * w).toFixed(2)}`);
    right.push(`${(p.x - nx * w).toFixed(2)} ${(p.y - ny * w).toFixed(2)}`);
  });
  const shape = `M${left.join(" L")} L${right.reverse().join(" L")} Z`;
  const spine = curves
    .map(([a, b, c, d], i) => `${i ? "" : `M${a.join(" ")} `}C ${b.join(" ")}, ${c.join(" ")}, ${d.join(" ")}`)
    .join(" ");
  return { shape, spine };
}

export const SWASHES = SWASH_CURVES.map(swash);

