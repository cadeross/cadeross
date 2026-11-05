"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/* The wordmark, pinned top left over a soft fade of paper so text slips
   under it cleanly. The asterisk (the favicon's six arms) turns with the
   page as you scroll, and a crumb names the page you're on. */

const RAYS = [-90, -30, 30];

export default function Header({ crumbs }: { crumbs: Record<string, string> }) {
  const pathname = usePathname();
  const markRef = useRef<SVGSVGElement>(null);
  const crumb = crumbs[pathname];

  useEffect(() => {
    const mark = markRef.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let shown = window.scrollY;
    let target = shown;
    const loop = () => {
      shown += (target - shown) * 0.14;
      mark.style.transform = `rotate(${shown * 0.12}deg)`;
      raf = Math.abs(target - shown) > 0.1 ? requestAnimationFrame(loop) : 0;
    };
    const onScroll = () => {
      target = window.scrollY;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    mark.style.transform = `rotate(${shown * 0.12}deg)`;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="site-header-fade" aria-hidden="true" />
      <nav className="site-header-inner" aria-label="Site">
        <Link href="/" className="wordmark" aria-label="Cade Ross, home">
          <span className="wordmark-spin">
            <svg ref={markRef} className="wordmark-mark" viewBox="-12 -12 24 24" aria-hidden="true">
              {RAYS.map((deg) => (
                <line
                  key={deg}
                  x1={Math.cos((deg * Math.PI) / 180) * -9.5}
                  y1={Math.sin((deg * Math.PI) / 180) * -9.5}
                  x2={Math.cos((deg * Math.PI) / 180) * 9.5}
                  y2={Math.sin((deg * Math.PI) / 180) * 9.5}
                />
              ))}
            </svg>
          </span>
          <span className="wordmark-name">Cade Ross</span>
        </Link>
        <span className="crumb" data-shown={crumb ? "" : undefined} aria-hidden={!crumb}>
          <span className="crumb-slash">/</span>
          <span key={crumb} className="crumb-text">
            {crumb}
          </span>
        </span>
      </nav>
    </header>
  );
}
