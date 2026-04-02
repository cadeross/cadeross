"use client";

import { Fragment, useEffect, useState } from "react";
import { projects, groupByYear, type Project } from "@/lib/projects";

/* ─── Preview panel ───────────────────────────────────── */

function PreviewPanel({ project }: { project: Project | null }) {
  return (
    <div
      className="preview-panel"
      data-visible={project !== null ? "true" : "false"}
    >
      {project && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${project.previewColor} 0%, ${project.previewColor2} 100%)`,
          }}
        >
          <div
            className="preview-shimmer"
            style={{
              background: `linear-gradient(
                105deg,
                transparent 20%,
                rgba(255,255,255,0.04) 50%,
                transparent 80%
              )`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "14px",
              right: "14px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "-0.00563rem",
              }}
            >
              {project.title}
            </p>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 460,
                color: "rgba(255,255,255,0.3)",
                marginTop: "2px",
                letterSpacing: "-0.003rem",
              }}
            >
              {project.year} · {project.category}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Works list ──────────────────────────────────────── */

function WorksList({ onHover }: { onHover: (slug: string | null) => void }) {
  const groups = groupByYear(projects);
  let counter = 0;
  const rows = groups.flatMap((group) =>
    group.projects.map((project, pi) => ({
      project,
      showYear: pi === 0,
      year: group.year,
      i: counter++,
    }))
  );

  return (
    <div className="works-list">
      {rows.map(({ project, showYear, year, i }) => (
        <Fragment key={project.slug}>
          <div className="works-year-cell">
            {showYear && <span className="works-year">{year}</span>}
          </div>
          <a
            href={`/${project.slug}`}
            className="works-project-cell"
            onMouseEnter={() => onHover(project.slug)}
            onMouseLeave={() => onHover(null)}
            style={{ animation: `staggerIn 0.35s ease ${0.35 + i * 0.045}s both` }}
          >
            <p className="works-project-title">{project.title}</p>
            <p className="works-project-tag">{project.tagline}</p>
          </a>
        </Fragment>
      ))}
    </div>
  );
}

/* ─── Time-of-day greeting ────────────────────────────── */

function getTimeInfo(hour: number) {
  if (hour >= 5 && hour < 12)  return { greeting: "Good morning",   icon: "☀️",  period: "morning"   };
  if (hour >= 12 && hour < 17) return { greeting: "Good afternoon", icon: "🌤️", period: "afternoon" };
  if (hour >= 17 && hour < 21) return { greeting: "Good evening",   icon: "🌙",  period: "evening"   };
  return                               { greeting: "Good night",     icon: "✦",   period: "night"     };
}

/* ─── Page ────────────────────────────────────────────── */

export default function Home() {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [timeInfo, setTimeInfo] = useState(getTimeInfo(20)); // default to evening for SSR

  useEffect(() => {
    setTimeInfo(getTimeInfo(new Date().getHours()));
  }, []);

  const hoveredProject = projects.find((p) => p.slug === hoveredSlug) ?? null;
  const year = new Date().getFullYear();

  return (
    <div className="homepage">
      <PreviewPanel project={hoveredProject} />

      <article className="article">
        {/* ── Header ── */}
        <header>
          <p className="page-name">Cade Ross</p>
          <p className="page-greeting">
            {timeInfo.greeting}{" "}
            <span className="greeting-icon" data-period={timeInfo.period}>
              {timeInfo.icon}
            </span>
          </p>
        </header>

        {/* ── Bio ── */}
        <section className="about-section">
          <p>
            I was born in Dallas, Texas, and now reside in Atlanta, Georgia.
          </p>
          <p>
            Previously, I founded Vlyss, a design and development firm focused on
            blockchain and edtech initiatives. We partnered with companies such as
            Solana and Baylor University to bring their visions to life.
          </p>
          <p>
            Recently, I launched{" "}
            <a
              href="https://openwrit.com"
              className="about-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenWrit
            </a>
            , an open source, distractionless way to read the Bible.
          </p>
          <p>
            Currently, I am exploring new design opportunities while building
            personal projects.
          </p>
          <p>
            Beyond design and craft, I am learning Portuguese, and I thoroughly
            enjoy a match of tennis along with a sci-fi or fantasy novel. Let me
            know if you have any recs.
          </p>
          <p>
            I am on{" "}
            <a
              href="https://x.com/cadeross"
              className="about-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              X
            </a>
            , and you can message me on{" "}
            <a
              href="https://t.me/cadeross"
              className="about-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram
            </a>{" "}
            or by{" "}
            <a href="mailto:hello@cadeross.com" className="about-link">
              email
            </a>
            .
          </p>
        </section>
      </article>

      {/* ── Works ── */}
      <section className="postList">
        <div className="postList-header">
          <p className="postList-title">Works</p>
        </div>
        <WorksList onHover={setHoveredSlug} />
      </section>

      {/* ── Footer ── */}
      <footer className="page-footer">
        <div className="footer-row">
          <p>© {year} Cade Ross</p>
          <div className="footer-links">
            <a href="mailto:hello@cadeross.com">Email</a>
            <a
              href="https://twitter.com/cadeross"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
            <a
              href="https://github.com/cadeross"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
