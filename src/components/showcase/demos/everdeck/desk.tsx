// Everdeck's flat desk objects (components/landing/Desk.tsx) in its buddy
// palette (lib/buddy/look.ts), for the build status under the bar.

const C = {
  ocean: { base: "#7CC4DD", deep: "#3A8FAD", tint: "#E3F3F8" },
  mint: { base: "#8EDDB4", deep: "#3DAE76", tint: "#E2F7EC" },
  peach: { base: "#FFB894", deep: "#E57C4C", tint: "#FFEDE3" },
  sun: { base: "#FFD772", deep: "#D9A21C", tint: "#FFF5D9" },
  rose: { base: "#F7A6BE", deep: "#D9608A", tint: "#FDE6EE" },
  sky: { base: "#9DB8FF", deep: "#5579E0", tint: "#E6EDFF" },
  stone: { base: "#C9C4BC", deep: "#8D867B", tint: "#F1EFEC" },
};

const svg = (w: number, h: number, children: React.ReactNode) => (
  <svg viewBox={`0 0 ${w} ${h}`} style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }} aria-hidden>
    {children}
  </svg>
);

export const Deck = () =>
  svg(200, 160, (
    <>
      <g transform="rotate(10 100 84)"><rect x="30" y="38" width="140" height="92" rx="18" fill={C.ocean.tint} /></g>
      <g transform="rotate(1 100 82)"><rect x="30" y="34" width="140" height="92" rx="18" fill={C.ocean.base} /></g>
      <g transform="rotate(-8 100 78)">
        <rect x="28" y="28" width="144" height="96" rx="19" fill={C.ocean.deep} />
        <rect x="46" y="46" width="40" height="12" rx="6" fill="#fff" />
        <rect x="46" y="70" width="104" height="9" rx="4.5" fill="#fff" opacity=".5" />
        <rect x="46" y="88" width="70" height="9" rx="4.5" fill="#fff" opacity=".5" />
      </g>
    </>
  ));

export const Marker = () => svg(150, 60, <path d="M14 38 Q 44 10 76 30 T 136 22" fill="none" stroke={C.sun.base} strokeWidth="22" strokeLinecap="round" />);

export const Tick = () =>
  svg(64, 64, (
    <>
      <circle cx="32" cy="32" r="30" fill={C.mint.deep} />
      <path d="M19 33 l 9 9 l 18 -19" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ));

export const Paper = () =>
  svg(110, 136, (
    <>
      <path d="M10 4 H 76 L 104 32 V 124 a 8 8 0 0 1 -8 8 H 10 a 8 8 0 0 1 -8 -8 V 12 a 8 8 0 0 1 8 -8 Z" fill={C.stone.tint} />
      <path d="M76 4 L 104 32 H 84 a 8 8 0 0 1 -8 -8 Z" fill={C.stone.base} />
      {[52, 70, 88, 106].map((y, n) => (
        <rect key={y} x="18" y={y} width={n === 3 ? 44 : 70} height="8" rx="4" fill={C.stone.base} opacity=".7" />
      ))}
    </>
  ));

export const Pencil = () =>
  svg(150, 34, (
    <>
      <rect x="2" y="4" width="24" height="26" rx="8" fill={C.rose.base} />
      <rect x="22" y="4" width="14" height="26" fill={C.stone.base} />
      <rect x="36" y="4" width="78" height="26" fill={C.sun.base} />
      <rect x="36" y="13" width="78" height="8" fill={C.sun.deep} opacity=".35" />
      <path d="M114 4 L 146 17 L 114 30 Z" fill={C.peach.tint} />
      <path d="M136 13 L 146 17 L 136 21 Z" fill="#1D1D1F" />
    </>
  ));

export const Letter = () =>
  svg(60, 60, (
    <>
      <circle cx="30" cy="30" r="28" fill={C.sky.base} />
      <text x="30" y="41" textAnchor="middle" fontSize="30" fontWeight="700" fill="#fff" style={{ fontFamily: "inherit" }}>
        A
      </text>
    </>
  ));
