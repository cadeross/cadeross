"use client";

import { useEffect, useRef } from "react";

/* The hero stays pinned while the page scrolls up over it, and steps back
   as it goes: it fades, blurs and lifts a little, so the text that
   follows never collides with it. */
export default function HeroFade({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const update = () => {
      raf = 0;
      const span = Math.max(240, window.innerHeight * 0.42);
      const p = Math.min(1, Math.max(0, window.scrollY / span));
      const eased = p * p * (3 - 2 * p);
      el.style.opacity = String(1 - eased);
      if (!reduced) {
        el.style.transform = `translate3d(0, ${-eased * 32}px, 0) scale(${1 - eased * 0.02})`;
        el.style.filter = eased > 0.01 ? `blur(${(eased * 6).toFixed(2)}px)` : "";
      }
      el.style.visibility = p >= 1 ? "hidden" : "visible";
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="hero-fade">
      {children}
    </div>
  );
}
