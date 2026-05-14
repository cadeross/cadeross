import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import BackgroundSparkles from "@/components/BackgroundSparkles";
import BootSequence from "@/components/BootSequence";
import Haptics from "@/components/Haptics";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Cade Ross",
  description: "Designer & Developer",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3e9fff" },
    { media: "(prefers-color-scheme: dark)", color: "#6aa8ff" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-booting="true">
      <body className={`${geistMono.variable} antialiased`}>
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
