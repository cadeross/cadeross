import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseStudy from "@/components/site/CaseStudy";
import { getWorkItem, showcaseItems } from "@/lib/portfolio";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return showcaseItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getWorkItem(slug);

  if (!item) return {};

  const title = `${item.title} — Cade Ross`;
  return {
    title,
    description: item.description,
    openGraph: { title, description: item.description, url: `/work/${item.slug}` },
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const item = getWorkItem(slug);

  if (!item) notFound();

  const index = showcaseItems.indexOf(item);
  const next = showcaseItems[(index + 1) % showcaseItems.length];

  return (
    <CaseStudy
      title={item.title}
      lede={item.blurb}
      palette={item.palette}
      meta={item.year}
      hero={item.hero}
      sections={item.sections}
      gallery={item.gallery}
      actions={
        <>
          {item.liveUrl && (
            <a href={item.liveUrl} target="_blank" rel="noopener noreferrer" className="button">
              Visit {item.liveUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              <span className="button-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          )}
          <Link href="/#contact" className="link">
            Get in touch
          </Link>
        </>
      }
      next={{
        href: `/work/${next.slug}`,
        title: next.title,
        summary: next.summary,
        palette: next.palette,
        thumb: next.thumb,
      }}
    />
  );
}
