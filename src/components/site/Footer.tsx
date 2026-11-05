"use client";

import { EMAIL } from "@/lib/portfolio";
import { rippleFrom } from "./fieldStore";

/* Name and role on the left; links and a way back up on the right. */
export default function Footer() {
  const toTop = (e: React.MouseEvent<HTMLButtonElement>) => {
    rippleFrom(e.currentTarget, 1.2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <footer className="site-footer" data-reveal>
      <div className="site-footer-id">
        <span>Cade Ross</span>
        <span>Product and interaction designer · © 2026</span>
      </div>
      <nav className="site-footer-links" aria-label="Elsewhere">
        <a href="https://github.com/cadeross" target="_blank" rel="noopener noreferrer" className="link">
          GitHub
        </a>
        <a href="https://t.me/cadeross" target="_blank" rel="noopener noreferrer" className="link">
          Telegram
        </a>
        <a href={`mailto:${EMAIL}`} className="link">
          Email
        </a>
        <button type="button" className="to-top" onClick={toTop}>
          <span className="to-top-swatch" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M8 12.5V3.5M4 7.5l4-4 4 4" />
            </svg>
          </span>
          Top
        </button>
      </nav>
    </footer>
  );
}
