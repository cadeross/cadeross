export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className="homepage">
      <article className="article">
        <header>
          <p className="page-name">Cade Ross</p>
          <p className="page-greeting">United States</p>
        </header>

        <section className="about-section">
          <p>I&apos;m an interaction and experience designer.</p>
          <p>
            Previously, I founded{" "}
            <a
              href="https://vlyss.com"
              className="about-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vlyss
            </a>
            , a design and development firm focused on blockchain and edtech initiatives.
            We partnered with companies such as{" "}
            <a
              href="https://solana.com"
              className="about-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Solana
            </a>{" "}
            and{" "}
            <a
              href="https://baylor.edu"
              className="about-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Baylor University
            </a>{" "}
            to bring their visions to life.
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
          <p>
            A small archive of my work lives at{" "}
            <a href="/archive" className="about-link">
              /archive
            </a>
            .
          </p>
        </section>
      </article>

      <footer className="page-footer">
        <div className="footer-row">
          <p>© {year} Cade Ross</p>
          <div className="footer-links">
            <a href="mailto:hello@cadeross.com">Email</a>
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
