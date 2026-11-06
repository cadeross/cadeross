"use client";

import { useEffect, useRef } from "react";
import { writeIntro } from "./penWriter";
import { SWASHES } from "./swash";

/* The letter's signature, in handwritten mode: the name, signed by the same
   pen as the introduction when it comes into view, then underlined with a
   long flourish. Seen without motion (or in typeset mode, where it isn't
   shown), it's simply there. */
export default function Signature({ name }: { name: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const html = document.documentElement;
    let stop: (() => void) | null = null;
    let timer = 0;
    let signed = false;

    const sign = async () => {
      if (signed) return;
      signed = true;
      el.dataset.write = "pending";
      await document.fonts.ready;
      el.dataset.write = "go";
      try {
        stop = writeIntro(
          el,
          () => {
            el.dataset.write = "underline";
            timer = window.setTimeout(() => (el.dataset.write = "done"), 1600);
          },
          ".sig-word",
        );
      } catch {
        el.dataset.write = "done";
      }
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.dataset.write = "done";
      return;
    }
    // Wait until it's well in view, and only sign in handwritten mode.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || html.dataset.type !== "hand") return;
        io.disconnect();
        window.setTimeout(sign, 250);
      },
      { threshold: 0.9 },
    );
    io.observe(el);
    // Switching to handwritten with the signature already in view.
    const mo = new MutationObserver(() => {
      if (signed || html.dataset.type !== "hand") return;
      io.unobserve(el);
      io.observe(el);
    });
    mo.observe(html, { attributeFilter: ["data-type"] });
    return () => {
      io.disconnect();
      mo.disconnect();
      stop?.();
      window.clearTimeout(timer);
    };
  }, []);

  const swash = SWASHES[2];
  return (
    <p ref={ref} className="signature" data-write="pending" aria-label={name}>
      <span className="sig-word" aria-hidden="true">
        {name}
      </span>
      <svg
        className="sig-swash"
        viewBox="0 0 120 24"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <mask id="sig-swash" maskUnits="userSpaceOnUse" x="-4" y="-4" width="128" height="32">
          <path className="intro-swash-pen" d={swash.spine} pathLength={1} />
        </mask>
        <path className="intro-swash-ink" d={swash.shape} mask="url(#sig-swash)" />
      </svg>
    </p>
  );
}
