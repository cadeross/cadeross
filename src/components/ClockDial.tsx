"use client";

import { useEffect, useState } from "react";
import { useEra, ERA_LIST } from "@/components/EraContext";

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export default function ClockDial() {
  const { era, isTransitioning, triggerTransition } = useEra();
  const [angles, setAngles] = useState({ h: 0, m: 0, s: 0 });
  const [spinning, setSpinning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  function handleClick() {
    if (isTransitioning || spinning) return;
    setSpinning(true);
    const idx = ERA_LIST.indexOf(era);
    const next = ERA_LIST[(idx + 1) % ERA_LIST.length];
    setTimeout(() => {
      setSpinning(false);
      triggerTransition(next);
    }, 420);
  }

  // Clock geometry
  const cx = 21;
  const cy = 21;
  const faceR = 17.5;

  // 12 tick marks around the face
  // Round to 6 dp to prevent SSR/client floating-point precision mismatches
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

  // Hand endpoints
  const hourRad = toRad(angles.h - 90);
  const minRad = toRad(angles.m - 90);
  const secRad = toRad(angles.s - 90);

  const hourLen = 8;
  const minLen = 12;
  const secLen = 13.5;

  return (
    <div className="clock-dial-wrapper">
      {/* Handwritten annotation — draws in on mount */}
      {mounted && (
        <div className="clock-annotation" aria-hidden="true">
          <svg
            viewBox="0 0 132 46"
            width="132"
            height="46"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            {/* "Time Travel" text — fades in after arrow is drawn */}
            <text
              className="annotation-label"
              x="10"
              y="16"
              fontFamily="var(--font-caveat, cursive)"
              fontSize="15"
              fill="currentColor"
              opacity="0"
            >
              Time Travel
            </text>
            {/* Curved arrow pointing toward the clock (right side) */}
            <path
              className="annotation-arrow-path"
              d="M 76 14 C 92 14, 112 24, 122 36"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            {/* Arrowhead */}
            <path
              className="annotation-arrowhead-path"
              d="M 114 31 L 123 37 L 115 43"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Live clock button */}
      <button
        className={[
          "clock-dial",
          spinning ? "clock-dial--spinning" : "",
          isTransitioning ? "clock-dial--busy" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={handleClick}
        aria-label={`Time Travel — era: ${era}. Click to advance to the next era.`}
      >
        <svg
          viewBox="0 0 42 42"
          width="42"
          height="42"
          xmlns="http://www.w3.org/2000/svg"
          data-spinning={spinning ? "true" : undefined}
        >
          {/* Clock face ring */}
          <circle
            cx={cx}
            cy={cy}
            r={faceR}
            stroke="currentColor"
            strokeWidth="0.75"
            fill="none"
            opacity="0.2"
          />

          {/* Tick marks */}
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

          {/* Hour hand */}
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

          {/* Minute hand */}
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

          {/* Second hand (with tail) */}
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

          {/* Center pivot */}
          <circle cx={cx} cy={cy} r="1.5" fill="currentColor" opacity="0.65" />
        </svg>
      </button>
    </div>
  );
}
