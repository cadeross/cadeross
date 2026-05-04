import Link from "next/link";

export default function ArchivePage() {
  return (
    <div className="homepage">
      <article className="article">
        <header>
          <p className="page-name">~/archive</p>
          <p className="page-greeting">Coming soon</p>
        </header>

        <section className="about-section">
          <p>
            <Link href="/" className="about-link">
              ← back home
            </Link>
          </p>
        </section>
      </article>
    </div>
  );
}
