import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./(site)/site.css";
import Field from "@/components/site/Field";
import Header from "@/components/site/Header";

export const metadata: Metadata = {
  title: "Not found — Cade Ross",
};

/* Any unmatched URL. Same paper, same field, one line and a way home. */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <Field />
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
