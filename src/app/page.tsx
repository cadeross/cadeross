import ArchiveLink from "@/components/ArchiveLink";

export default function Home() {
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
            , an intentional, distractionless way to read the Bible.
          </p>
          <p>
            Currently, I am exploring new design opportunities while building
            personal projects.
          </p>
          <p>
            Beyond design and craft, I am learning Portuguese, and I thoroughly
            enjoy a match of tennis or a good sci-fi/fantasy novel. Let me
            know if you have any recs!
          </p>
          <p>
            A small archive of my work lives at{" "}
            <ArchiveLink className="about-link" />
          </p>
          <p>
            You can reach me on{" "}
            <a
              href="https://t.me/cadeross"
              className="about-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram
            </a>{" "}
            or by{" "}
            <a href="mailto:cadeross33@gmail.com" className="about-link">
              email
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}
