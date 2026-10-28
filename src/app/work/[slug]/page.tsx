import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseToc from "@/components/CaseToc";
import {
  getWorkItem,
  sectionId,
  workItems,
  type WorkMedia,
} from "@/lib/portfolio";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return workItems.map((item) => ({ slug: item.slug }));
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

/* Turn bare URLs in body copy into links, shown without the protocol. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="about-link">
        {part.replace(/^https?:\/\//, "")}
      </a>
    ) : (
      part
    ),
  );
}

function Media({ media }: { media: WorkMedia }) {
  if (!media.src) {
    return (
      <div className="cs-media cs-media--placeholder" data-reveal="fade" role="img" aria-label={`Placeholder: ${media.alt}`}>
        <span>
          [{media.type === "video" ? "Video" : "Image"}: {media.alt}]
        </span>
      </div>
    );
  }

  if (media.type === "video") {
    return (
      <video
        className="cs-media"
        data-reveal="fade"
        src={media.src}
        poster={media.poster}
        aria-label={media.alt}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img className="cs-media" data-reveal="fade" src={media.src} alt={media.alt} />;
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const item = getWorkItem(slug);

  if (!item) notFound();

  const index = workItems.indexOf(item);
  const next = workItems[(index + 1) % workItems.length];

  return (
    <main className="cs-layout">
      <aside className="cs-sidebar">
        <Link href="/" className="back-link" data-reveal>
          ← Work
        </Link>
        {item.sections.length > 0 && (
          <CaseToc
            label={`${item.title} sections`}
            items={item.sections.map((section) => ({
              id: sectionId(section.heading),
              heading: section.heading,
            }))}
          />
        )}
      </aside>

      <article className="cs-main">
        <h1 className="cs-title" data-reveal>{item.title}</h1>
        <Link href="/?section=about#connect" className="cs-contact about-link" data-reveal>
          Get in touch
        </Link>

        {item.sections.map((section) => (
          <section key={section.heading} id={sectionId(section.heading)} className="cs-section">
            <h2 className="cs-section-label" data-reveal>{section.heading}</h2>
            <div className="cs-section-body">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} data-reveal>
                  <Linkified text={paragraph} />
                </p>
              ))}
            </div>
            {section.media && <Media media={section.media} />}
          </section>
        ))}

        {item.gallery && (
          <section className="cs-gallery" aria-label={`${item.title} gallery`}>
            {item.gallery.map((image, i) => (
              <figure key={i} className="cs-figure">
                <Media media={{ type: "image", src: image.src, alt: image.alt }} />
                <figcaption className="cs-caption" data-reveal>{image.caption}</figcaption>
              </figure>
            ))}
          </section>
        )}

        <Link href={`/work/${next.slug}`} className="cs-next" data-reveal="fade">
          <span className="cs-next-label">Next</span>
          <span className="cs-next-title">{next.title}</span>
          <span className="cs-next-summary">{next.summary}</span>
        </Link>
      </article>
    </main>
  );
}
