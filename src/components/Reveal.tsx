"use client";

import { useEffect } from "react";

/* Gap between consecutive elements revealed in the same frame. */
const STEP_MS = 85;
/* Longest delay any one element waits, so big batches don't drag. */
const MAX_DELAY_MS = 900;

const SELECTOR = "[data-reveal]:not([data-revealed])";

function byDocumentOrder(a: Element, b: Element) {
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

/* Prints [data-reveal] elements in as they scroll into view, in document
   order, one after another — the same terminal entrance the homepage has
   always had, extended to every page, to content further down, and to
   anything mounted later (tab panels, client navigations). Waits for the
   boot sequence to finish before the first batch. */
export default function Reveal() {
  useEffect(() => {
    const root = document.documentElement;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const revealAll = () =>
        document.querySelectorAll(SELECTOR).forEach((el) => el.setAttribute("data-revealed", ""));
      revealAll();
      const mo = new MutationObserver(revealAll);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    let queue: Element[] = [];
    let frame = 0;

    function flush() {
      frame = 0;
      queue.sort(byDocumentOrder).forEach((el, i) => {
        (el as HTMLElement).style.animationDelay = `${Math.min(i * STEP_MS, MAX_DELAY_MS)}ms`;
        el.setAttribute("data-revealed", "");
      });
      queue = [];
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          queue.push(entry.target);
        }
        if (queue.length && !frame) frame = requestAnimationFrame(flush);
      },
      { rootMargin: "0px 0px -6% 0px" },
    );

    const observeNew = () => document.querySelectorAll(SELECTOR).forEach((el) => io.observe(el));
    const mo = new MutationObserver(observeNew);

    function start() {
      observeNew();
      mo.observe(document.body, { childList: true, subtree: true });
    }

    let bootWatch: MutationObserver | null = null;
    if (root.hasAttribute("data-booting")) {
      bootWatch = new MutationObserver(() => {
        if (root.hasAttribute("data-booting")) return;
        bootWatch?.disconnect();
        start();
      });
      bootWatch.observe(root, { attributes: true, attributeFilter: ["data-booting"] });
    } else {
      start();
    }

    return () => {
      bootWatch?.disconnect();
      mo.disconnect();
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
