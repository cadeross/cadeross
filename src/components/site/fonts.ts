import { Instrument_Serif, Newsreader } from "next/font/google";

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
