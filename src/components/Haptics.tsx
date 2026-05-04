"use client";

import { useEffect } from "react";

/* Very short pulse — feels like a faint tick, not a buzz.
   Android honors short durations; iOS Safari silently ignores
   navigator.vibrate, so this is a graceful no-op there. */
const TAP_MS = 6;

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], summary, label[for], input[type="checkbox"], input[type="radio"]';

export default function Haptics() {
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== "touch") return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const hit = target.closest(INTERACTIVE_SELECTOR);
      if (!hit) return;
      if (hit instanceof HTMLElement && hit.dataset.noHaptic === "true") return;
      try {
        navigator.vibrate(TAP_MS);
      } catch {
        // ignore — some browsers throw when called from non-user gesture contexts
      }
    }

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
