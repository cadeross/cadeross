import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/lib/projects";
import { TableOfContents } from "@/components/TableOfContents";

type Props = {
  params: Promise<{ slug: string }>;
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: `${project.title} — Cade Ross`,
    description: project.tagline,
  };
}

const year = new Date().getFullYear();

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const tocItems = [
    { label: "Overview", id: "overview" },
    ...project.sections.map((s) => ({ label: s.label, id: slugify(s.label) })),
  ];

  return (
    <div className="cs-layout">

      {/* Sidebar */}
      <aside className="cs-sidebar">
        <a href="/" className="back-link">← Index</a>
        <TableOfContents items={tocItems} />
      </aside>

      {/* Main */}
      <main className="cs-main">

        {/* Header */}
        <div>
          <h1 className="cs-title">{project.title}</h1>
          <p className="cs-tagline" style={{ marginTop: "0.625rem" }}>{project.tagline}</p>
        </div>

        {/* Meta */}
        <div className="cs-meta">
          <div className="cs-meta-item">
            <span className="cs-meta-label">Year</span>
            <span className="cs-meta-value">{project.year}</span>
          </div>
          <div className="cs-meta-item">
            <span className="cs-meta-label">Discipline</span>
            <span className="cs-meta-value">{project.category}</span>
          </div>
          {project.role !== "—" && (
            <div className="cs-meta-item">
              <span className="cs-meta-label">Role</span>
              <span className="cs-meta-value">{project.role}</span>
            </div>
          )}
          {project.timeline !== "—" && (
            <div className="cs-meta-item">
              <span className="cs-meta-label">Timeline</span>
              <span className="cs-meta-value">{project.timeline}</span>
            </div>
          )}
        </div>

        {/* Hero */}
        <div
          className="cs-hero"
          style={{
            background: `linear-gradient(135deg, ${project.previewColor} 0%, ${project.previewColor2} 100%)`,
          }}
          aria-label={`${project.title} hero visual`}
        />

        {/* Overview */}
        <section id="overview">
          <p className="cs-overview">{project.overview}</p>
        </section>

        {/* Sections */}
        {project.sections.map((section) => (
          <section key={section.label} id={slugify(section.label)} className="cs-section">
            <p className="cs-section-label">{section.label}</p>
            <p className="cs-section-body">{section.body}</p>
          </section>
        ))}

        {/* Footer */}
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

      </main>
    </div>
  );
}
