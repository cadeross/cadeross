import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Cade Ross",
  description:
    "Designer and developer working at the intersection of design systems, interactive experiences, and emerging technology.",
};

const year = new Date().getFullYear();

export default function AboutPage() {
  return (
    <div className="inner-page">

      {/* 1 */}
      <a href="/" className="back-link">← Home</a>

      {/* 2 — Header */}
      <header className="about-header">
        {/* Swap for <img className="avatar" src="/avatar.png" alt="Cade Ross" /> when ready */}
        <div className="avatar-placeholder" />
        <p className="page-name">Cade Ross</p>
        <p className="page-role">Designer &amp; Developer</p>
      </header>

      {/* 3 — Bio */}
      <div className="about-bio">
        <p>
          I am a multidisciplinary designer and developer working at the
          intersection of design systems, interactive experiences, and emerging
          technology. I believe the best digital products feel inevitable —
          where every interaction is so considered that the interface disappears
          and only the task remains.
        </p>
        <p>
          Previously at [Company], where I led product design for [description].
          Before that, I spent time at [Company] focused on [description].
          Currently building independently and taking on select freelance work.
        </p>
        <p>
          My background spans graphic design, front-end engineering, and
          creative coding — a combination that lets me move fluidly between
          defining a system and implementing it. I am most drawn to problems
          where craft and engineering are genuinely inseparable.
        </p>
      </div>

      {/* 4 — Beliefs */}
      <div className="about-beliefs">
        {[
          "Good design is driven by ideas, not trends. I start with a strong concept and let it guide every decision downstream.",
          "Prototyping is thinking. The fastest path to clarity is making something tangible — even if it gets thrown away.",
          "Details compound. The difference between a good product and a great one lives in a thousand small choices most people will never consciously notice.",
          "Constraints are generative. The best work often comes from the tightest briefs.",
        ].map((belief, i) => (
          <div key={i} className="belief-item">
            <span className="belief-num">{i + 1}.</span>
            <p className="belief-text">{belief}</p>
          </div>
        ))}
      </div>

      {/* 5 — Connect */}
      <div className="about-connect">
        <a href="mailto:hello@cadeross.com" className="connect-link">
          Get in touch →
        </a>
        <a
          href="https://twitter.com/cadeross"
          target="_blank"
          rel="noopener noreferrer"
          className="connect-link-muted"
        >
          Twitter
        </a>
        <a
          href="https://github.com/cadeross"
          target="_blank"
          rel="noopener noreferrer"
          className="connect-link-muted"
        >
          GitHub
        </a>
      </div>

      {/* 6 — Footer */}
      <footer className="page-footer">
        <div className="footer-row">
          <p>© {year} Cade Ross</p>
          <div className="footer-links">
            <a href="mailto:hello@cadeross.com">Email</a>
            <a href="https://twitter.com/cadeross" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://github.com/cadeross" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
