"use client";

import React, { useState } from "react";
import { useEra, ERA_LIST, type Era } from "./EraContext";

const ERA_META: Record<Era, { label: string; prefix: string; suffix: string }> = {
  "1600s": { label: "Renaissance", prefix: "❧ ", suffix: " ❧" },
  "1800s": { label: "Victorian",   prefix: "✦ ", suffix: " ✦" },
  "2000":  { label: "Y2K Web",     prefix: "[ ",  suffix: "  ]" },
  "2026":  { label: "Present",     prefix: "· ",  suffix: " ·" },
  "2077":  { label: "Future",      prefix: "> ",  suffix: " _" },
};

export default function TimeTravelDial() {
  const { era, isTransitioning, triggerTransition } = useEra();
  const [hovered, setHovered] = useState<Era | null>(null);

  const active = hovered ?? era;
  const meta = ERA_META[active];

  return (
    <div
      className={`dial${isTransitioning ? " dial--busy" : ""}`}
      aria-label="Time Travel"
      role="navigation"
    >
      {/* Display card — shows the era being hovered or the current era */}
      <div className="dial__card">
        <div className="dial__card-inner" key={active}>
          <span className="dial__card-label">
            {meta.prefix}{meta.label}{meta.suffix}
          </span>
          <span className="dial__card-year">{active}</span>
        </div>
      </div>

      {/* Track with pips */}
      <div className="dial__track">
        <div className="dial__line" aria-hidden="true" />
        <div className="dial__stops">
          {ERA_LIST.map((e) => (
            <button
              key={e}
              className={`dial__stop${era === e ? " dial__stop--active" : ""}`}
              onClick={() => triggerTransition(e)}
              disabled={isTransitioning}
              onMouseEnter={() => setHovered(e)}
              onMouseLeave={() => setHovered(null)}
              aria-label={ERA_META[e].label}
              aria-pressed={era === e}
            >
              <div className="dial__pip" />
              <span className="dial__tick">{e}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
