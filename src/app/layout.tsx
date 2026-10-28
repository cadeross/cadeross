import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import BackgroundSparkles from "@/components/BackgroundSparkles";
import BootSequence from "@/components/BootSequence";
import Haptics from "@/components/Haptics";
import Reveal from "@/components/Reveal";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const title = "Cade Ross — Product and interaction designer";
const description = "Product and interaction designer, open to fully remote roles.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cadeross.com"),
  title,
  description,
  openGraph: { title, description, url: "/", siteName: "Cade Ross", type: "website" },
  twitter: { card: "summary", title, description },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* Dark only: the dark palette in globals.css keys off data-system-theme. */
  return (
    <html lang="en" suppressHydrationWarning data-booting="true" data-system-theme="dark">
      <body className={`${geistMono.variable} antialiased`}>
        <BackgroundSparkles />
        <Haptics />
        <BootSequence />
        <Reveal />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;clip-path:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
