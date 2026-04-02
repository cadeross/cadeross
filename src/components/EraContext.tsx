"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Era = "1600s" | "1800s" | "2000" | "2026" | "2077";

export const ERA_LIST: Era[] = ["1600s", "1800s", "2000", "2026", "2077"];

/* Duration (ms) for each era's exit overlay animation */
const ERA_EXIT_MS: Record<Era, number> = {
  "1600s": 700,
  "1800s": 600,
  "2000":  400,
  "2026":  350,
  "2077":  400,
};

/* Duration (ms) for each era's enter overlay animation */
const ERA_ENTER_MS: Record<Era, number> = {
  "1600s": 800,
  "1800s": 700,
  "2000":  300,
  "2026":  350,
  "2077":  450,
};

interface EraContextValue {
  era: Era;
  isTransitioning: boolean;
  triggerTransition: (next: Era) => void;
}

const EraContext = createContext<EraContextValue>({
  era: "2026",
  isTransitioning: false,
  triggerTransition: () => {},
});

export function useEra() {
  return useContext(EraContext);
}

export function EraProvider({ children }: { children: React.ReactNode }) {
  const [era, setEra] = useState<Era>("2026");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* On mount: read stored era and apply to DOM */
  useEffect(() => {
    const stored = localStorage.getItem("era") as Era | null;
    const initial: Era = stored && ERA_LIST.includes(stored) ? stored : "2026";
    setEra(initial);
    document.documentElement.setAttribute("data-era", initial);
    setMounted(true);
  }, []);

  /* Keep data-era attribute in sync with React state */
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-era", era);
    }
  }, [era, mounted]);

  const triggerTransition = useCallback(
    (next: Era) => {
      if (isTransitioning || next === era) return;

      setIsTransitioning(true);
      const html = document.documentElement;

      // Phase 1 — Exit: overlay animates over the current era
      html.setAttribute("data-era-transitioning", "exit");

      setTimeout(() => {
        // Swap era while the screen is covered by the overlay
        setEra(next);
        localStorage.setItem("era", next);
        html.setAttribute("data-era", next);
        html.setAttribute("data-era-transitioning", "enter");

        // Phase 2 — Enter: overlay animates away to reveal the new era
        setTimeout(() => {
          html.removeAttribute("data-era-transitioning");
          setIsTransitioning(false);
        }, ERA_ENTER_MS[next]);
      }, ERA_EXIT_MS[era]);
    },
    [era, isTransitioning]
  );

  return (
    <EraContext.Provider value={{ era, isTransitioning, triggerTransition }}>
      {children}
    </EraContext.Provider>
  );
}
