"use client";

import { useEffect, useRef, useState } from "react";

/* The favicon's six-armed asterisk, alive. It draws itself in ray by ray
   once the boot sequence ends, ticks a sixth of a turn every so often
   like a slow second hand (six-fold symmetry means every tick lands on
   the same shape), turns toward you on hover, and on click spins half a
   turn and throws off a few of the background's `*` sparkles. */

const RAYS = [-90, -30, 30, 90, 150, 210];
const IDLE_TICK_MS = 7000;
const SPARKLE_MS = 800;

type Burst = { id: number; offset: number };

export default function Mark() {
  const [turn, setTurn] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const hovering = useRef(false);
  const burstId = useRef(0);
  const turnRef = useRef(0);

  function rotate(by: number) {
    turnRef.current += by;
    setTurn(turnRef.current);
  }

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!hovering.current && document.visibilityState === "visible") rotate(60);
    }, IDLE_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  function handleClick() {
    rotate(180);
    const id = ++burstId.current;
    setBursts((prev) => [...prev, { id, offset: turnRef.current }]);
    window.setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), SPARKLE_MS);
  }

  return (
    <button
      type="button"
      className="mark"
      aria-label="Spin the mark"
      data-reveal="mark"
      onPointerEnter={() => {
        hovering.current = true;
        rotate(60);
      }}
      onPointerLeave={() => {
        hovering.current = false;
      }}
      onClick={handleClick}
    >
      <svg viewBox="0 0 32 32" className="mark-svg" aria-hidden="true">
        <g className="mark-spin" style={{ transform: `rotate(${turn}deg)` }}>
          {RAYS.map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={angle}
                className="mark-ray"
                x1={16}
                y1={16}
                x2={16 + Math.cos(rad) * 10}
                y2={16 + Math.sin(rad) * 10}
                pathLength={1}
                style={{ animationDelay: `${i * 70}ms` }}
              />
            );
          })}
        </g>
      </svg>

      {bursts.map((burst) =>
        RAYS.map((angle) => (
          <span
            key={`${burst.id}-${angle}`}
            className="mark-sparkle"
            aria-hidden="true"
            style={{ "--angle": `${angle + burst.offset}deg` } as React.CSSProperties}
          >
            *
          </span>
        )),
      )}
    </button>
  );
}
