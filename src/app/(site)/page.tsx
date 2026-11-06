import CopyEmail from "@/components/site/CopyEmail";
import { FieldPage } from "@/components/site/FieldVoice";
import Footer from "@/components/site/Footer";
import HeroFade from "@/components/site/HeroFade";
import HeroIntro, { type HeroProject } from "@/components/site/HeroIntro";
import ProjectRow, { Tile } from "@/components/site/ProjectRow";
import { EMAIL, explorations, workItems } from "@/lib/portfolio";

const work = (slug: string) => workItems.find((w) => w.slug === slug)!;
const exploration = (href: string) =>
  explorations.find((e) => e.href === href)!;

const project = (
  item: {
    title: string;
    palette: HeroProject["palette"];
    thumb?: HeroProject["thumb"];
  },
  href: string,
  note: string,
): HeroProject => ({
  label: item.title,
  href,
  palette: item.palette,
  thumb: item.thumb,
  note,
});

const EVERDECK = project(work("everdeck"), "/work/everdeck", "Study app");
const OPENWRIT = project(work("openwrit"), "/work/openwrit", "Bible reader");
const HARBOR = project(exploration("/harbor"), "/harbor", "Menu bar app");
const SPYGLASS = project(
  exploration("/spyglass"),
  "/spyglass",
  "Screen recorder",
);

const INTRO = {
  lead: "I'm Cade, a product and interaction designer.",
  parts: [
    "I've designed and built",
    { project: EVERDECK, after: "," },
    { project: OPENWRIT },
    "and two small Mac apps,",
    { project: HARBOR },
    "and",
    { project: SPYGLASS, after: "." },
  ],
};

/* The "open to remote roles" card under the intro. Hidden for now. */
const SHOW_NOTICE = false;

/* The "open to fully remote roles" line under the email. Hidden for now;
   set to true to bring it back. */
const SHOW_CONTACT_NOTE = false;

const ELSEWHERE: { label: string; href?: string }[] = [
  { label: "Email", href: `mailto:${EMAIL}` },
  { label: "Telegram", href: "https://t.me/cadeross" },
  { label: "GitHub", href: "https://github.com/cadeross" },
  { label: "LinkedIn [url]" },
  { label: "Resume [PDF link]" },
  { label: "Everdeck", href: "https://www.geteverdeck.com" },
  { label: "OpenWrit", href: "https://openwrit.com" },
];

function External({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link">
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <main className="home">
      <FieldPage palette="cade" />

      <div id="intro" className="hero-pin" data-tick="Intro">
        <HeroFade>
          <section className="hero" aria-label="Introduction">
            <HeroIntro {...INTRO} />
          </section>
        </HeroFade>
      </div>

      {SHOW_NOTICE && (
        <div className="notice-wrap" data-reveal>
          <a href="#contact" className="notice">
            <Tile palette="cade" title="Cade Ross" size="sm">
              <svg
                className="tile-mark"
                viewBox="-12 -12 24 24"
                aria-hidden="true"
              >
                <line x1="0" y1="-9" x2="0" y2="9" />
                <line x1="-7.8" y1="-4.5" x2="7.8" y2="4.5" />
                <line x1="7.8" y1="-4.5" x2="-7.8" y2="4.5" />
              </svg>
            </Tile>
            <span className="notice-body">
              <span>Open to fully remote design roles from January.</span>
              <span className="notice-cta gradient-text">Get in touch</span>
            </span>
          </a>
        </div>
      )}

      <section
        id="about"
        className="block prose"
        data-field="cade"
        aria-label="About"
        data-tick="About"
      >
        <p data-reveal>
          I design products end to end and build them into working software with
          AI tools.
        </p>
        <p data-reveal>
          Right now I&apos;m building{" "}
          <External href="https://www.geteverdeck.com">Everdeck</External>, a
          study app that turns notes into flashcards and practice exams. Before
          that I launched{" "}
          <External href="https://openwrit.com">OpenWrit</External>, an
          intentional way to read the Bible, and founded{" "}
          <External href="https://vlyss.com">Vlyss</External>, a design and
          development studio that worked with teams like Solana and Baylor
          University.
        </p>
        <p data-reveal>
          Outside of design, I&apos;m learning Portuguese, playing tennis and
          reading sci-fi and fantasy. Recommendations welcome.
        </p>
      </section>

      <section
        id="work"
        className="block"
        aria-labelledby="work-label"
        data-tick="Selected work"
      >
        <h2 id="work-label" className="label" data-reveal>
          Selected work
        </h2>
        <ul className="rows">
          {workItems.map((item) => (
            <ProjectRow
              key={item.slug}
              href={`/work/${item.slug}`}
              title={item.title}
              year={item.year}
              blurb={item.blurb}
              palette={item.palette}
              thumb={item.thumb}
            />
          ))}
        </ul>
      </section>

      <section
        id="explorations"
        className="block"
        aria-labelledby="explorations-label"
        data-tick="Explorations"
      >
        <h2 id="explorations-label" className="label" data-reveal>
          Explorations
        </h2>
        <ul className="rows">
          {explorations.map((item) => (
            <ProjectRow
              key={item.title}
              href={item.href}
              title={item.title}
              year={item.year}
              blurb={item.blurb}
              palette={item.palette}
              thumb={item.thumb}
            />
          ))}
        </ul>
      </section>

      <section
        id="how"
        className="block prose"
        data-field="cade"
        aria-labelledby="how-label"
        data-tick="How I work"
      >
        <h2 id="how-label" className="label" data-reveal>
          How I work
        </h2>
        <ol className="steps">
          <li data-reveal>
            <span className="steps-n">1</span>
            <span>Design the whole product, end to end.</span>
          </li>
          <li data-reveal>
            <span className="steps-n">2</span>
            <span>Build it in the real medium.</span>
          </li>
          <li data-reveal>
            <span className="steps-n">3</span>
            <span>Spend the time on the small moments.</span>
          </li>
        </ol>
        <p data-reveal>
          Most of what makes software feel good happens between the screens: how
          a card turns over, how long a transition waits, what the app remembers
          for you. Building my own designs lets me tune those moments in the
          product itself instead of describing them in a mockup.
        </p>
      </section>

      <section
        id="elsewhere"
        className="block"
        aria-labelledby="elsewhere-label"
        data-tick="Elsewhere"
      >
        <h2 id="elsewhere-label" className="label" data-reveal>
          Elsewhere
        </h2>
        <ul className="grid-list">
          {ELSEWHERE.map((item) => (
            <li key={item.label} data-reveal>
              {item.href ? (
                item.href.startsWith("mailto:") ? (
                  <a href={item.href} className="link">
                    {item.label}
                  </a>
                ) : (
                  <External href={item.href}>{item.label}</External>
                )
              ) : (
                <span className="placeholder">{item.label}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section
        id="contact"
        className="block contact"
        aria-labelledby="contact-label"
        data-tick="Contact"
      >
        <span id="connect" className="anchor" aria-hidden="true" />
        <h2 id="contact-label" className="contact-title" data-reveal>
          Say hello
        </h2>
        <div data-reveal>
          <CopyEmail email={EMAIL} />
        </div>
        {SHOW_CONTACT_NOTE && (
          <p className="contact-note" data-reveal>
            I&apos;m open to fully remote design roles starting in January.
            Email is the fastest way to reach me.
          </p>
        )}
      </section>

      <Footer />
    </main>
  );
}
