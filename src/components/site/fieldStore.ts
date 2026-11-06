import type { PaletteKey } from "./palettes";

/* Who decides the painting's colours right now. The most specific voice wins:
   a hovered project, then the section you're reading, then the page itself.
   Kept outside React so the painting can read it every frame without
   re-rendering anything.

   Things you touch also report where they are: `ripple` tells the painting
   the point, so a new palette bleeds out from there. */

type Voices = {
  page: PaletteKey;
  section: PaletteKey | null;
  hover: PaletteKey | null;
};

const voices: Voices = { page: "cade", section: null, hover: null };
const listeners = new Set<() => void>();

export function setVoice<K extends keyof Voices>(key: K, value: Voices[K]) {
  if (voices[key] === value) return;
  voices[key] = value;
  listeners.forEach((fn) => fn());
}

export function currentPalette(): PaletteKey {
  return voices.hover ?? voices.section ?? voices.page;
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

type Ripple = (clientY: number, strength: number, clientX?: number) => void;
const ripples = new Set<Ripple>();

/* A touch on the page at (`clientX`, `clientY`). Strength 1 is a hover; a
   copy or a click goes higher. */
export function ripple(clientY: number, strength = 1, clientX?: number) {
  ripples.forEach((fn) => fn(clientY, strength, clientX));
}

/* Ripple from the vertical middle of an element. */
export function rippleFrom(el: Element, strength = 1) {
  const r = el.getBoundingClientRect();
  ripple(r.top + r.height / 2, strength, r.left + r.width / 2);
}

export function onRipple(fn: Ripple) {
  ripples.add(fn);
  return () => {
    ripples.delete(fn);
  };
}
