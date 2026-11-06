import {
  Ms_Madi,
  Oooh_Baby,
  Instrument_Serif,
  Kalam,
  Newsreader,
  Playwrite_NZ,
} from "next/font/google";

/* The site's serifs: Instrument Serif for display, Newsreader for
   reading. Shared by the site layout and the 404 page. */
export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

export const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

/* The handwritten experiment (<html data-type="hand">, see typeScript.ts).
   The default hand is a slightly messy, joined cursive: Ms Madi for the
   larger writing (the introduction, titles) and Oooh Baby, with the same
   slant and fine line, for paragraphs. Alternates for comparison:
   ?pen=baby (Oooh Baby throughout), ?pen=nz (Playwrite NZ, a neat school
   cursive) and ?pen=print (Kalam, unjoined). Not preloaded: the browser
   only fetches the faces in use. */
export const msMadi = Ms_Madi({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ms-madi",
  display: "swap",
  preload: false,
});

export const ooohBaby = Oooh_Baby({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-oooh-baby",
  display: "swap",
  preload: false,
});

export const playwriteNZ = Playwrite_NZ({
  variable: "--font-playwrite-nz",
  display: "swap",
});

export const kalam = Kalam({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-kalam",
  display: "swap",
  preload: false,
});

export const fontVars = [newsreader, instrument, msMadi, ooohBaby, playwriteNZ, kalam]
  .map((f) => f.variable)
  .join(" ");
