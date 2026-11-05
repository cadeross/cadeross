import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Instrument_Serif, Newsreader } from "next/font/google";
import "./site.css";
import "./watercolor.css";
import Backdrop from "@/components/site/Backdrop";
import Header from "@/components/site/Header";
import LayoutToggle from "@/components/site/LayoutToggle";
import { layoutScript } from "@/components/site/layoutScript";
import Reveal from "@/components/site/Reveal";
import { apps, workItems } from "@/lib/portfolio";

/* The watercolor version's serifs. Not preloaded: the light version never
   asks for them. */
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
  preload: false,
});
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
  preload: false,
});

const title = "Cade Ross — Product and interaction designer";
const description =
  "Product and interaction designer, open to fully remote roles.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cadeross.com"),
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "Cade Ross",
    type: "website",
  },
  twitter: { card: "summary", title, description },
};

export const viewport: Viewport = {
  themeColor: "#f7f7f5",
  colorScheme: "light",
};

const crumbs: Record<string, string> = Object.fromEntries([
  ...workItems.map((item) => [`/work/${item.slug}`, item.title]),
  ...apps.map((app) => [`/${app.slug}`, app.title]),
]);

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${newsreader.variable} ${instrument.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js');${layoutScript}`,
          }}
        />
      </head>
      <body>
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <Backdrop />
        <Header crumbs={crumbs} />
        <Reveal />
        <div id="content" className="page">
          {children}
        </div>
        <LayoutToggle />
      </body>
    </html>
  );
}
