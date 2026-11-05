import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistSerifRegular } from "geist/font/serif/regular";

/* The products' own type, so the demos set text exactly as the apps do:
   Everdeck is Open Runde with Fraunces for its wordmark and figures; OpenWrit
   is Geist with Geist Serif for reading. The Mac apps use the system font.
   Loaded only where a figure is on the page (no preload). */

const openRunde = localFont({
  src: [
    { path: "./fonts/OpenRunde-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/OpenRunde-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/OpenRunde-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/OpenRunde-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-open-runde",
  display: "swap",
  preload: false,
});

const fraunces = Fraunces({
  weight: "600",
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});

export const productFonts = [openRunde.variable, fraunces.variable, GeistSans.variable, GeistSerifRegular.variable].join(" ");
