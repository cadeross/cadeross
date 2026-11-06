import Link from "next/link";
import Showcase from "@/components/showcase/Showcase";
import { sectionId, type GalleryItem, type Thumb, type WorkMedia, type WorkSection } from "@/lib/portfolio";
import { FieldHover, FieldPage } from "./FieldVoice";
import Footer from "./Footer";
import type { PaletteKey } from "./palettes";
import { Tile } from "./ProjectRow";

/* The page every project shares: title and a line under it, the actions,
   a hero figure, then plain sections. It ends on a card for the next
   project. */

export type NextCard = {
  href: string;
  title: string;
  summary: string;
  palette: PaletteKey;
  thumb?: Thumb;
};

/* Turn bare URLs in body copy into links, shown without the protocol. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="link">
        {part.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      </a>
    ) : (
      part
    ),
  );
}

export default function CaseStudy({
  title,
  lede,
  palette,
  actions,
  meta,
  hero,
  sections,
  gallery,
  next,
}: {
  title: string;
  lede: string;
  palette: PaletteKey;
  actions: React.ReactNode;
  meta?: string;
  hero?: WorkMedia;
  sections: WorkSection[];
  gallery?: GalleryItem[];
  next: NextCard;
}) {
  return (
    <main className="case">
      <FieldPage palette={palette} />

      <header id="overview" className="case-head" data-tick="Overview">
        <h1 className="case-title" data-reveal>
          {title}
        </h1>
        <p className="case-lede" data-reveal>
          {lede}
        </p>
        <div className="case-actions" data-reveal>
          {actions}
        </div>
        {meta && (
          <p className="case-meta" data-reveal>
            {meta}
          </p>
        )}
      </header>

      {hero && (
        <div className="case-hero">
          <Showcase media={hero} />
        </div>
      )}

      {sections.map((section) => (
        <section
          key={section.heading}
          id={sectionId(section.heading)}
          className="case-section"
          data-tick={section.heading}
        >
          <h2 className="label" data-reveal>
            {section.heading}
          </h2>
          <div className="prose">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} data-reveal>
                <Linkified text={paragraph} />
              </p>
            ))}
          </div>
          {section.media && <Showcase media={section.media} />}
        </section>
      ))}

      {gallery && (
        <section className="case-gallery" aria-label={`${title} gallery`}>
          {gallery.map((image, i) => (
            <Showcase
              key={i}
              media={{ type: "image", src: image.src, alt: image.alt, caption: image.caption }}
            />
          ))}
        </section>
      )}

      <FieldHover palette={next.palette} className="next-wrap" reveal>
        <Link href={next.href} className="notice next">
          <Tile palette={next.palette} thumb={next.thumb} title={next.title} size="sm" />
          <span className="notice-body">
            <span className="next-text">
              <span className="next-label">Next</span>
              <span>{next.title}</span>
            </span>
            <span className="notice-cta gradient-text next-summary">{next.summary}</span>
          </span>
        </Link>
      </FieldHover>

      <Footer />
    </main>
  );
}
