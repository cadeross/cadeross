/* The field's palettes. Each is four stops, top to bottom, that the gradient
   panel melts between. Every project owns one, so the panel takes on its
   colour as you scroll past it, hover it or open it. Tuned for the warm
   paper background: pale at the top, one deep note, a warm landing. */

export type PaletteKey =
  | "cade"
  | "everdeck"
  | "openwrit"
  | "baylor"
  | "solana"
  | "harbor"
  | "spyglass";

export type Palette = readonly [string, string, string, string];

export const PALETTES: Record<PaletteKey, Palette> = {
  // The site's own colours before the page knows the time (server render,
  // no script). Once it runs, the field uses `skyAt` for the visitor's hour.
  cade: ["#dde6f3", "#b4c8ea", "#8fb5a4", "#f1d2a6"],
  everdeck: ["#cdeef3", "#86cfe1", "#3a98b9", "#f1d9a0"],
  openwrit: ["#f6e6c6", "#efc492", "#d98a61", "#a65a52"],
  baylor: ["#eef2c2", "#bcd98f", "#4f9468", "#f5c74c"],
  solana: ["#dcc8ff", "#a88aff", "#64cfcc", "#a2f4c2"],
  harbor: ["#d3e2ff", "#8fb2f4", "#4a6fc4", "#ffae6b"],
  spyglass: ["#ffe1d3", "#ffa088", "#ec5a4e", "#ffd39c"],
};

export function isPaletteKey(value: unknown): value is PaletteKey {
  return typeof value === "string" && value in PALETTES;
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/* The site's own colours follow the visitor's clock: one sky for every
   hour of the day, each a little different from the last, blended minute by
   minute toward the next. Night is deep blue, dawn warms through rose and
   peach, midday is clear and pale, the evening turns gold and then violet.
   Index = hour of the day, local time. */
const SKY: Palette[] = [
  ["#232a45", "#323a62", "#4a5181", "#736a96"], // 00 midnight
  ["#20263f", "#2e355a", "#454b78", "#6b6390"], // 01 deepest night
  ["#222842", "#30385d", "#474e7d", "#6f6894"], // 02
  ["#262c48", "#353d63", "#4f5584", "#7a6f9b"], // 03
  ["#2c3254", "#3e4573", "#5c5e90", "#8a78a2"], // 04 a hint of light
  ["#3b4270", "#5c5f92", "#9a7fa8", "#d6a3a2"], // 05 before dawn
  ["#6e78ad", "#b493b8", "#f0aaa8", "#ffc896"], // 06 dawn
  ["#a9bbe5", "#e9b8c6", "#ffc59e", "#ffdd94"], // 07 sunrise
  ["#c3d6f0", "#d9c4d8", "#f9d2b4", "#fbe3b0"], // 08 soft morning
  ["#cfe2f6", "#b2d0ee", "#c8e0e2", "#f7e9c6"], // 09 morning
  ["#c9e3f8", "#9fcaef", "#b7dde6", "#f1eed2"], // 10 clear
  ["#c3e2fb", "#90c4f2", "#a5d7ea", "#e7f2e6"], // 11 bright
  ["#bfe1fc", "#86bff3", "#9fd5ec", "#e2f3f0"], // 12 noon, high blue
  ["#c5e3fa", "#8fc6f0", "#acdae4", "#ecf2e2"], // 13
  ["#cde3f6", "#a0c9ec", "#b4d8dc", "#f1ecd6"], // 14 haze
  ["#d3e2f2", "#b0c9e8", "#a9cfc6", "#f2e3c4"], // 15
  ["#d8e1ef", "#bac6e6", "#a3c3b4", "#f2d6ac"], // 16 late afternoon
  ["#e6dfd6", "#d9c3c4", "#c5b1a2", "#f1cb98"], // 17 warming
  ["#f4dba8", "#f5b685", "#ea8c6d", "#b9687f"], // 18 golden hour
  ["#efb894", "#d48b8f", "#a3739f", "#5f5a92"], // 19 sunset
  ["#c98f9b", "#9474a0", "#5e6198", "#363d6b"], // 20 dusk
  ["#4c4f80", "#53588a", "#6b6896", "#8f7aa1"], // 21 blue hour
  ["#30375c", "#414977", "#5b5e8e", "#8577a0"], // 22
  ["#272e4b", "#373f67", "#50578a", "#7a6f9b"], // 23
];

export function skyAt(hour: number): number[][] {
  const h = ((hour % 24) + 24) % 24;
  const i = Math.floor(h);
  const t = h - i;
  const a = SKY[i];
  const b = SKY[(i + 1) % 24];
  return a.map((hex, j) => {
    const ca = hexToRgb(hex);
    const cb = hexToRgb(b[j]);
    return ca.map((v, k) => v + (cb[k] - v) * t);
  });
}

export function localHour(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}
