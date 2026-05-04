"use client";

import { useEffect, useState } from "react";

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export default function ClockDial() {
  const [angles, setAngles] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    function tick() {
      const now = new Date();
      const s = now.getSeconds();
      const m = now.getMinutes();
      const h = now.getHours() % 12;
      setAngles({
        s: (s / 60) * 360,
        m: (m / 60) * 360 + (s / 60) * 6,
        h: (h / 12) * 360 + (m / 60) * 30,
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const cx = 21;
  const cy = 21;
  const faceR = 17.5;

  const r6 = (n: number) => Math.round(n * 1e6) / 1e6;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = toRad((i / 12) * 360 - 90);
    const isMajor = i % 3 === 0;
    const outerR = faceR;
    const innerR = isMajor ? faceR - 3 : faceR - 1.5;
    return {
      x1: r6(cx + outerR * Math.cos(a)),
      y1: r6(cy + outerR * Math.sin(a)),
      x2: r6(cx + innerR * Math.cos(a)),
      y2: r6(cy + innerR * Math.sin(a)),
      isMajor,
    };
  });

  const hourRad = toRad(angles.h - 90);
  const minRad = toRad(angles.m - 90);
  const secRad = toRad(angles.s - 90);

  const hourLen = 8;
  const minLen = 12;
  const secLen = 13.5;

  return (
    <div className="clock-dial-wrapper" aria-hidden="true">
      <div className="clock-dial">
        <svg
          viewBox="0 0 42 42"
          width="42"
          height="42"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx={cx}
            cy={cy}
            r={faceR}
            stroke="currentColor"
            strokeWidth="0.75"
            fill="none"
            opacity="0.2"
          />

          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="currentColor"
              strokeWidth={t.isMajor ? "1.2" : "0.7"}
              opacity={t.isMajor ? "0.38" : "0.18"}
              strokeLinecap="round"
            />
          ))}

          <line
            x1={cx}
            y1={cy}
            x2={cx + hourLen * Math.cos(hourRad)}
            y2={cy + hourLen * Math.sin(hourRad)}
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            opacity="0.85"
          />

          <line
            x1={cx}
            y1={cy}
            x2={cx + minLen * Math.cos(minRad)}
            y2={cy + minLen * Math.sin(minRad)}
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.7"
          />

          <line
            x1={cx - 3 * Math.cos(secRad)}
            y1={cy - 3 * Math.sin(secRad)}
            x2={cx + secLen * Math.cos(secRad)}
            y2={cy + secLen * Math.sin(secRad)}
            stroke="currentColor"
            strokeWidth="0.75"
            strokeLinecap="round"
            opacity="0.42"
          />

          <circle cx={cx} cy={cy} r="1.5" fill="currentColor" opacity="0.65" />
        </svg>
      </div>
    </div>
  );
}
