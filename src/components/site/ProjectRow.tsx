import Link from "next/link";
import type { CSSProperties } from "react";
import type { Thumb } from "@/lib/portfolio";
import { FieldHover } from "./FieldVoice";
import { PALETTES, type PaletteKey } from "./palettes";

/* A project in the homepage lists: a square tile in the project's palette
   with its screenshot rising out of the bottom, then title, year and two
   sentences. Hovering lifts the screenshot and tints the whole field. */

export function Tile({
  palette,
  thumb,
  title,
  size = "md",
  children,
}: {
  palette: PaletteKey;
  thumb?: Thumb;
  title: string;
  size?: "md" | "sm" | "lg";
  children?: React.ReactNode;
}) {
  const [a, b, c, d] = PALETTES[palette];
  const tall = thumb ? thumb.height / thumb.width > 1.15 : false;
  return (
    <span
      className="tile"
      data-size={size}
      data-tall={tall || undefined}
      style={{ "--t0": a, "--t1": b, "--t2": c, "--t3": d } as CSSProperties}
      aria-hidden="true"
    >
      <span className="tile-grain" />
      {children ? (
        <span className="tile-initial">{children}</span>
      ) : thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="tile-shot"
          src={thumb.src}
          alt=""
          width={thumb.width}
          height={thumb.height}
          loading={size === "lg" ? "eager" : "lazy"}
          decoding="async"
        />
      ) : (
        <span className="tile-initial">{title.charAt(0)}</span>
      )}
    </span>
  );
}

export default function ProjectRow({
  href,
  title,
  year,
  blurb,
  palette,
  thumb,
}: {
  href: string;
  title: string;
  year: string;
  blurb: string;
  palette: PaletteKey;
  thumb?: Thumb;
}) {
  return (
    <li data-reveal data-field={palette}>
      <FieldHover palette={palette} className="row-hover">
        <Link href={href} className="row">
          <Tile palette={palette} thumb={thumb} title={title} />
          <span className="row-text">
            <span className="row-head">
              <span className="row-title">{title}</span>
              <span className="row-year">{year}</span>
              <svg className="row-arrow" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8h9.5M8.5 4l4 4-4 4" />
              </svg>
            </span>
            <span className="row-blurb">{blurb}</span>
          </span>
        </Link>
      </FieldHover>
    </li>
  );
}
