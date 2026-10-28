import Link from "next/link";
import HomeTabs from "@/components/HomeTabs";
import Mark from "@/components/Mark";
import { EMAIL, explorations, workItems } from "@/lib/portfolio";
import { parseSection } from "@/lib/sections";

type Props = {
  searchParams: Promise<{ section?: string | string[] }>;
};

type Entry = { title: string; summary: string; year: string };

function External({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="about-link">
      {children}
    </a>
  );
}

/* One row of a listing: index, title, dotted leader, year, then the summary. */
function EntryBody({ entry, index, external }: { entry: Entry; index: number; external?: boolean }) {
  return (
    <>
      <span className="home-entry-index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="home-entry-body">
        <span className="home-entry-line">
          <span className="home-entry-title">{entry.title}</span>
          {external && (
            <span className="home-entry-arrow" aria-hidden="true">
              ↗
            </span>
          )}
          <span className="home-entry-leader" aria-hidden="true" />
          <span className="home-entry-year">{entry.year}</span>
        </span>
        <span className="home-entry-summary">{entry.summary}</span>
      </span>
    </>
  );
}

const workPanel = (
  <ul className="home-list">
    {workItems.map((item, i) => (
      <li key={item.slug} data-reveal>
        <Link href={`/work/${item.slug}`} className="home-entry">
          <EntryBody entry={item} index={i} />
        </Link>
      </li>
    ))}
  </ul>
);

const explorationsPanel = (
  <ul className="home-list">
    {explorations.map((item, i) => (
      <li key={item.title} data-reveal>
        <a href={item.href} className="home-entry" target="_blank" rel="noopener noreferrer">
          <EntryBody entry={item} index={i} external />
        </a>
      </li>
    ))}
  </ul>
);

const aboutPanel = (
  <div className="home-about">
    <p data-reveal>
      I design products end to end and build them into working software with AI tools. Right
      now I&apos;m building{" "}
      <External href="https://www.geteverdeck.com">Everdeck</External>, a study app that turns
      notes into flashcards and practice exams. Before that I launched{" "}
      <External href="https://openwrit.com">OpenWrit</External>, an intentional way to read the
      Bible, and founded <External href="https://vlyss.com">Vlyss</External>, a design and
      development studio that worked with teams like Solana and Baylor University.
    </p>
    <p data-reveal>I&apos;m open to fully remote design roles starting in January.</p>
    <p data-reveal>
      Outside of design, I&apos;m learning Portuguese, playing tennis and reading sci-fi and
      fantasy. Recommendations welcome.
    </p>
    <p id="connect" className="home-connect" data-reveal>
      <a href={`mailto:${EMAIL}`} className="about-link">
        Email
      </a>
      <span aria-hidden="true">·</span>
      <span>LinkedIn [url]</span>
      <span aria-hidden="true">·</span>
      <span>Resume [PDF link]</span>
      <span aria-hidden="true">·</span>
      <External href="https://t.me/cadeross">Telegram</External>
    </p>
  </div>
);

export default async function Home({ searchParams }: Props) {
  const { section } = await searchParams;

  return (
    <div className="homepage">
      <article className="article">
        <header>
          <Mark />
          <p className="page-name" data-reveal>
            Cade Ross
          </p>
          <p className="page-greeting" data-reveal>
            Product and interaction designer
          </p>
        </header>

        <HomeTabs
          initial={parseSection(section)}
          panels={{ work: workPanel, explorations: explorationsPanel, about: aboutPanel }}
        />
      </article>
    </div>
  );
}
