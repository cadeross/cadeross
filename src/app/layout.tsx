import type { Metadata } from "next";
import Script from "next/script";
import {
  Inter,
  IBM_Plex_Mono,
  Playfair_Display,
  Libre_Baskerville,
  Space_Mono,
  Caveat,
} from "next/font/google";
import "./globals.css";
import { EraProvider } from "@/components/EraContext";
import ClockDialGate from "@/components/ClockDialGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // Load variable font so we can use weight 460 (between 400–500)
  axes: ["opsz"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/* ── Era fonts ── */

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Cade Ross",
  description: "Designer & Developer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} ${playfairDisplay.variable} ${libreBaskerville.variable} ${spaceMono.variable} ${caveat.variable} antialiased`}
      >
        <Script id="system-theme" strategy="beforeInteractive">
          {`(function(){try{var m=window.matchMedia('(prefers-color-scheme: dark)');var set=function(){document.documentElement.setAttribute('data-system-theme',m.matches?'dark':'light');};set();if(m.addEventListener){m.addEventListener('change',set);}else if(m.addListener){m.addListener(set);}}catch(e){}})();`}
        </Script>
        <EraProvider>
          {children}
          <ClockDialGate />
        </EraProvider>
      </body>
    </html>
  );
}
