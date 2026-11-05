import type { Metadata } from "next";
import CaseStudy from "@/components/site/CaseStudy";
import { apps, explorations, type AppShowcase, type WorkSection } from "@/lib/portfolio";

export function appMetadata(app: AppShowcase): Metadata {
  const title = `${app.title} for Mac — Cade Ross`;
  return {
    title,
    description: app.description,
    openGraph: { title, description: app.description, url: `/${app.slug}` },
    twitter: { card: "summary_large_image", title, description: app.description },
  };
}

/* Showcase page for one of the Mac apps: what it is, a download, and how to
   get past Gatekeeper until the builds are notarized. Shares the case study
   page, with a download in place of the site link. */
export default function AppPage({ app }: { app: AppShowcase }) {
  const next = apps[(apps.indexOf(app) + 1) % apps.length];
  const nextRow = explorations.find((e) => e.href === `/${next.slug}`);
  const install: WorkSection = {
    heading: "Install",
    paragraphs: [
      `Download the zip, unzip it and drag ${app.title} into your Applications folder. It runs on Apple silicon and Intel Macs with macOS 26 or later.`,
      `${app.title} isn't notarized yet, so the first time you open it macOS says it can't check it for malicious software. Click Done, then open System Settings → Privacy & Security, scroll down and click Open Anyway next to ${app.title}. You only need to do this once.`,
      ...(app.firstRun ? [app.firstRun] : []),
    ],
  };

  return (
    <CaseStudy
      title={app.title}
      lede={app.tagline}
      palette={app.palette}
      meta="Free · Open source · macOS 26 or later"
      hero={app.hero}
      sections={[...app.sections, install]}
      actions={
        <>
          <a href={app.download} className="button">
            <svg className="button-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10" />
            </svg>
            Download for Mac
          </a>
          <a href={app.repo} target="_blank" rel="noopener noreferrer" className="link">
            Source on GitHub
          </a>
        </>
      }
      next={{
        href: `/${next.slug}`,
        title: next.title,
        summary: nextRow?.summary ?? next.tagline,
        palette: next.palette,
        thumb: nextRow?.thumb,
      }}
    />
  );
}
