/* Subtle terminal-style sparkles drifting behind every page.
   Each is just a `*` character that briefly twinkles into view and vanishes.
   Positions are deterministic so SSR and client match — no hydration jitter. */

type Sparkle = {
  x: number;        // % across viewport
  y: number;        // % down viewport
  size: number;     // px (font-size)
  opacity: number;  // 0..1 peak
  delay: number;    // s
  duration: number; // s
};

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const COUNT = 48;

const sparkles: Sparkle[] = (() => {
  const r = lcg(0xC4DE);
  const out: Sparkle[] = [];
  for (let i = 0; i < COUNT; i++) {
    out.push({
      x: r() * 100,
      y: r() * 100,
      size: 9 + r() * 7,
      opacity: 0.32 + r() * 0.38,
      delay: r() * 32,
      duration: 22 + r() * 22,
    });
  }
  return out;
})();

export default function BackgroundSparkles() {
  return (
    <div className="bg-sparkles" aria-hidden="true">
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="bg-sparkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: `${s.size}px`,
            ["--sp-opacity" as string]: s.opacity,
            ["--sp-delay" as string]: `${s.delay}s`,
            ["--sp-duration" as string]: `${s.duration}s`,
          }}
        >
          *
        </span>
      ))}
    </div>
  );
}
