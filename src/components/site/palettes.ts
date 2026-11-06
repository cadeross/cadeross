/* The project palettes. Each is four stops: pale, a middle, one deep note
   and a warm landing. Every project owns one, so the painting (and the
   swatches and tiles) take on its colours as you scroll past it, hover it
   or open it. In the painting the stops play the scene's roles: sky and
   snow shadow, distance and ice, evergreens, warmth. */

export type PaletteKey =
  | "cade"
  | "everdeck"
  | "openwrit"
  | "baylor"
  | "solana"
  | "harbor"
  | "spyglass"
  | "desk"
  | "cathedral";

export type Palette = readonly [string, string, string, string];

export const PALETTES: Record<PaletteKey, Palette> = {
  // The site's own colours before the page knows the time (server render,
  // no script). Once it runs, the painting uses its winter colours for the
  // visitor's hour (winterAt in Watercolor.tsx).
  cade: ["#dde6f3", "#b4c8ea", "#8fb5a4", "#f1d2a6"],
  everdeck: ["#cdeef3", "#86cfe1", "#3a98b9", "#f1d9a0"],
  openwrit: ["#f6e6c6", "#efc492", "#d98a61", "#a65a52"],
  baylor: ["#eef2c2", "#bcd98f", "#4f9468", "#f5c74c"],
  solana: ["#dcc8ff", "#a88aff", "#64cfcc", "#a2f4c2"],
  harbor: ["#d3e2ff", "#8fb2f4", "#4a6fc4", "#ffae6b"],
  spyglass: ["#ffe1d3", "#ffa088", "#ec5a4e", "#ffd39c"],
  // The project pages' scenes in their own, natural colours rather than
  // the project's (watercolor/productScenes.ts). The desk: cool wall and
  // window light, a soft teal for the cards, the mug and the garden, slate
  // for line and shade, honey for the wood and the highlighter.
  desk: ["#e1e6e6", "#7fb3bc", "#3e4c56", "#d9a65e"],
  // The cathedral: a pale morning sky, warm sunlit stone and fields, a
  // cool green-grey for shade, grass and trees, red-brown for roofs and
  // poppies.
  cathedral: ["#d6e1ec", "#e6c48c", "#62806f", "#a65845"],
};

/* Which palette a project page's painting is painted in. */
export const SCENE_PALETTE: Partial<Record<PaletteKey, PaletteKey>> = {
  everdeck: "desk",
  openwrit: "cathedral",
};

export function isPaletteKey(value: unknown): value is PaletteKey {
  return typeof value === "string" && value in PALETTES;
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function localHour(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}
