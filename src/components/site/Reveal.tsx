"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* Brings [data-reveal] elements in as they reach the viewport: a short lift
   out of a soft blur. Elements arriving together are staggered 60ms apart in
   reading order, capped so a long batch never drags. Once an element has
   finished, `data-done` drops the reveal transition so its own hover
   effects keep their timing. Re-scans on every navigation and whenever new
   content mounts. While the homepage's introduction is being written by
   hand, the batch waits for it (the `intro-written` event). */

const STEP = 60;
const MAX = 480;
const DURATION = 900;

export default function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pending = new Set<Element>();
    const timers: number[] = [];
    let raf = 0;

    const flush = () => {
      raf = 0;
      // On the homepage in handwritten mode, nothing below the introduction
      // comes in until the pen has finished writing it (HeroIntro).
      if (document.documentElement.hasAttribute("data-intro-writing")) return;
      const batch = Array.from(pending).sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
      pending.clear();
      batch.forEach((el, i) => {
        const delay = Math.min(i * STEP, MAX);
        (el as HTMLElement).style.setProperty("--reveal-delay", `${delay}ms`);
        el.setAttribute("data-in", "");
        timers.push(window.setTimeout(() => el.setAttribute("data-done", ""), delay + DURATION));
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          pending.add(entry.target);
        }
        if (pending.size && !raf) raf = requestAnimationFrame(flush);
      },
      { rootMargin: "0px" },
    );

    const scan = () => {
      document.querySelectorAll("[data-reveal]:not([data-in])").forEach((el) => {
        if (reduced) {
          el.setAttribute("data-in", "");
          el.setAttribute("data-done", "");
        } else io.observe(el);
      });
    };
    scan();
    const release = () => {
      if (pending.size && !raf) raf = requestAnimationFrame(flush);
    };
    window.addEventListener("intro-written", release);
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("intro-written", release);
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname]);

  return null;
}
