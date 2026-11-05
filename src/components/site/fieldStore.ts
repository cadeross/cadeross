import type { PaletteKey } from "./palettes";

/* Who decides the field's colour right now. The most specific voice wins:
   a hovered project, then the section you're reading, then the page itself.
   Kept outside React so the field can read it every frame without
   re-rendering anything.

   The field also answers things you do: `ripple` sends a wave of light
   through it from the height of whatever you just touched. */

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

/* `clientX` is optional: the column field only needs the height, but the
   watercolor uses the point itself. */
type Ripple = (clientY: number, strength: number, clientX?: number) => void;
const ripples = new Set<Ripple>();

/* A wave through the field, starting at the panel's inner edge level with
   `clientY`. Strength 1 is a hover; a copy or a click goes higher. */
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
