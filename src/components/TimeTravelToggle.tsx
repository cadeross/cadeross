"use client";

import React from "react";
import { useEra, ERA_LIST, type Era } from "./EraContext";

const ERA_META: Record<Era, { label: string; year: string }> = {
  "1600s": { label: "Renaissance", year: "1600s" },
  "1800s": { label: "Victorian",   year: "1800s" },
  "2000":  { label: "Y2K",         year: "2000"  },
  "2026":  { label: "Present",     year: "2026"  },
  "2077":  { label: "Future",      year: "2077"  },
};

export default function TimeTravelToggle() {
  const { era, isTransitioning, triggerTransition } = useEra();

  return (
    <nav
      className={`era-toggle${isTransitioning ? " era-toggle--transitioning" : ""}`}
      aria-label="Time Travel — select era"
    >
      {ERA_LIST.map((e) => (
        <button
          key={e}
          className={`era-toggle__btn${era === e ? " era-toggle__btn--active" : ""}`}
          onClick={() => triggerTransition(e)}
          disabled={isTransitioning}
          aria-pressed={era === e}
        >
          <span className="era-toggle__label">{ERA_META[e].label}</span>
          <span className="era-toggle__year">{ERA_META[e].year}</span>
        </button>
      ))}
    </nav>
  );
}
