"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* The top left, pinned over a soft fade of paper so text slips under it
   cleanly. The homepage leaves it empty. Every other page gets a way back
   home and a crumb naming the page you're on. */

export default function Header({ crumbs }: { crumbs: Record<string, string> }) {
  const pathname = usePathname();
  const crumb = crumbs[pathname];
  const home = pathname === "/";

  return (
    <header className="site-header">
      <div className="site-header-fade" aria-hidden="true" />
      {!home && (
        <nav className="site-header-inner" aria-label="Site">
          <Link href="/" className="home-link">
            <span className="home-link-arrow" aria-hidden="true">
              ←
            </span>
            Home
          </Link>
          <span className="crumb" data-shown={crumb ? "" : undefined} aria-hidden={!crumb}>
            <span className="crumb-slash">/</span>
            <span key={crumb} className="crumb-text">
              {crumb}
            </span>
          </span>
        </nav>
      )}
    </header>
  );
}
