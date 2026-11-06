import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./(site)/site.css";
import "./(site)/watercolor.css";
import { instrument, newsreader } from "@/components/site/fonts";
import Header from "@/components/site/Header";
import { nightScript } from "@/components/site/nightScript";
import Watercolor from "@/components/site/Watercolor";

export const metadata: Metadata = {
  title: "Not found — Cade Ross",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#141822" },
  ],
  colorScheme: "light dark",
};

/* Any unmatched URL. The same paper and the same valley, one line and a
   way home. */
export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${newsreader.variable} ${instrument.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      data-paint=""
      data-version="monet"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: nightScript }} />
      </head>
      <body>
        <Watercolor />
        <Header crumbs={{}} />
        <div className="page">
          <main className="lost page-enter">
            <p className="label">404</p>
            <h1 className="lost-title">There&apos;s nothing at this address.</h1>
            <Link href="/" className="link">
              Back to the homepage
            </Link>
          </main>
        </div>
      </body>
    </html>
  );
}
