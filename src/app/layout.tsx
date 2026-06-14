import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import BackgroundSparkles from "@/components/BackgroundSparkles";
import BootSequence from "@/components/BootSequence";
import Haptics from "@/components/Haptics";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cade Ross",
  description: "Designer & Developer",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-booting="true">
      <body className={`${geistMono.variable} ${sourceSerif4.variable} antialiased`}>
        <Script id="system-theme" strategy="beforeInteractive">
          {`(function(){try{var m=window.matchMedia('(prefers-color-scheme: dark)');var set=function(){document.documentElement.setAttribute('data-system-theme',m.matches?'dark':'light');};set();if(m.addEventListener){m.addEventListener('change',set);}else if(m.addListener){m.addListener(set);}}catch(e){}})();`}
        </Script>
        <BackgroundSparkles />
        <Haptics />
        <BootSequence />
        {children}
      </body>
    </html>
  );
}
