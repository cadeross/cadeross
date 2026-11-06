import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./site.css";
import "./watercolor.css";
import { instrument, newsreader } from "@/components/site/fonts";
import Header from "@/components/site/Header";
import { nightScript } from "@/components/site/nightScript";
import Reveal from "@/components/site/Reveal";
import Watercolor from "@/components/site/Watercolor";
import { apps, workItems } from "@/lib/portfolio";

const title = "Cade Ross — Product and interaction designer";
/* While the remote-roles lines are hidden (see SHOW_CONTACT_NOTE in
   page.tsx), the description leaves it out too. To bring it back:
   "Product and interaction designer, open to fully remote roles." */
const description = "Product and interaction designer.";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#141822" },
  ],
  colorScheme: "light dark",
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
      data-paint=""
      data-version="monet"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js');${nightScript}`,
          }}
        />
      </head>
      <body>
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <Watercolor />
        <Header crumbs={crumbs} />
        <Reveal />
        <div id="content" className="page">
          {children}
        </div>
      </body>
    </html>
  );
}
