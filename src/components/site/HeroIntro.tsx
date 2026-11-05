"use client";

import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import type { Thumb } from "@/lib/portfolio";
import { ripple, setVoice } from "./fieldStore";
import { PALETTES, type PaletteKey } from "./palettes";
import { Tile } from "./ProjectRow";

/* The homepage introduction: who I am in one line, then the things I've
   made, named inline. Each name carries a swatch of its project's colour.
   Pointing at one tints the field and brings up a small card of the
   product that follows the cursor; leaving lets both settle back. */

export type HeroProject = {
  label: string;
  href: string;
  palette: PaletteKey;
  thumb?: Thumb;
  note: string;
};

export type HeroPart = string | { project: HeroProject; after?: string };

const LEAVE_DELAY = 140;

export default function HeroIntro({
  lead,
  parts,
}: {
  lead: string;
  parts: HeroPart[];
}) {
  const projects = parts
    .filter((p): p is { project: HeroProject } => typeof p !== "string")
    .map((p) => p.project);
  const [active, setActive] = useState<number | null>(null);
  // The card lives on <body>: the hero fades with a transform, which would
  // otherwise pin a fixed element to the hero instead of the window.
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);
  const peekRef = useRef<HTMLDivElement>(null);
  const motion = useRef({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    tilt: 0,
    raf: 0,
    last: 0,
    shown: false,
    leaveTimer: 0,
  });

  const loop = useCallback((t: number) => {
    const m = motion.current;
    const el = peekRef.current;
    if (!el) return;
    const dt = Math.min(0.05, (t - (m.last || t)) / 1000 || 0.016);
    m.last = t;
    const k = 1 - Math.exp(-dt * 16);
    const vx = (m.tx - m.x) * k;
    m.x += vx;
    m.y += (m.ty - m.y) * k;
    const lean = Math.max(-7, Math.min(7, (vx / Math.max(dt, 0.001)) * 0.006));
    m.tilt += (lean - m.tilt) * (1 - Math.exp(-dt * 10));
    el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0) rotate(${m.tilt}deg)`;
    const settled =
      Math.abs(m.tx - m.x) < 0.2 &&
      Math.abs(m.ty - m.y) < 0.2 &&
      Math.abs(m.tilt) < 0.05;
    m.raf = m.shown || !settled ? requestAnimationFrame(loop) : 0;
  }, []);

  const aim = useCallback((x: number, y: number) => {
    const m = motion.current;
    const el = peekRef.current;
    const w = el?.offsetWidth ?? 240;
    const h = el?.offsetHeight ?? 200;
    const pad = 16;
    // Below and to the right of the pointer, flipped when it would leave the window.
    let tx = x + 22;
    let ty = y + 26;
    if (tx + w > window.innerWidth - pad) tx = x - w - 22;
    if (ty + h > window.innerHeight - pad) ty = y - h - 22;
    m.tx = Math.max(pad, tx);
    m.ty = Math.max(pad, ty);
  }, []);

  const show = useCallback(
    (i: number, x: number, y: number) => {
      const m = motion.current;
      window.clearTimeout(m.leaveTimer);
      aim(x, y);
      if (!m.shown) {
        // Arrive where the pointer is rather than flying in from the last spot.
        m.x = m.tx;
        m.y = m.ty;
        m.tilt = 0;
      }
      m.shown = true;
      setActive(i);
      setVoice("hover", projects[i].palette);
      ripple(y, 0.9, x);
      if (!m.raf) {
        m.last = 0;
        m.raf = requestAnimationFrame(loop);
      }
    },
    [aim, loop, projects],
  );

  const hide = useCallback((immediate = false) => {
    const m = motion.current;
    window.clearTimeout(m.leaveTimer);
    const go = () => {
      m.shown = false;
      setActive(null);
      setVoice("hover", null);
    };
    if (immediate) go();
    else m.leaveTimer = window.setTimeout(go, LEAVE_DELAY);
  }, []);

  useEffect(() => {
    const m = motion.current;
    const onMove = (e: PointerEvent) => {
      if (m.shown && e.pointerType === "mouse") aim(e.clientX, e.clientY);
    };
    const onScroll = () => {
      if (m.shown) hide(true);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(m.leaveTimer);
      cancelAnimationFrame(m.raf);
      setVoice("hover", null);
    };
  }, [aim, hide]);

  let index = 0;
  let projectIndex = 0;
  const words = (text: string) =>
    text
      .split(" ")
      .filter(Boolean)
      .map((word) => {
        const i = index++;
        return (
          <Fragment key={`w${i}`}>
            <span className="hero-word" style={{ "--i": i } as CSSProperties}>
              {word}
            </span>{" "}
          </Fragment>
        );
      });


  return (
    <div className="intro">
      <h1 className="hero-title">
        <span className="intro-lead">{words(lead)}</span>
        <span className="intro-rest">
          {parts.map((part) => {
            if (typeof part === "string") return words(part);
            const p = part.project;
            const i = index++;
            const pi = projectIndex++;
            const [a, b, c, d] = PALETTES[p.palette];
            return (
              <Fragment key={p.href}>
                <span
                  className="hero-word"
                  style={{ "--i": i } as CSSProperties}
                >
                  <Link
                    href={p.href}
                    className="intro-chip"
                    data-active={active === pi || undefined}
                    style={
                      {
                        "--t0": a,
                        "--t1": b,
                        "--t2": c,
                        "--t3": d,
                      } as CSSProperties
                    }
                    onPointerEnter={(e) =>
                      e.pointerType === "mouse" &&
                      show(pi, e.clientX, e.clientY)
                    }
                    onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
                    onFocus={(e) => {
                      if (!e.currentTarget.matches(":focus-visible")) return;
                      const r = e.currentTarget.getBoundingClientRect();
                      show(pi, r.left, r.bottom - 14);
                    }}
                    onBlur={() => hide(true)}
                  >
                    <span className="intro-swatch" aria-hidden="true" />
                    <span className="intro-name">{p.label}</span>
                  </Link>
                  {part.after}
                </span>{" "}
              </Fragment>
            );
          })}
        </span>
      </h1>

      {host &&
        createPortal(
          <div
            ref={peekRef}
            className="peek"
            data-on={active !== null || undefined}
            aria-hidden="true"
          >
            <div className="peek-card">
              {projects.map((p, i) => (
                <div
                  key={p.href}
                  className="peek-face"
                  data-on={active === i || undefined}
                >
                  <Tile
                    palette={p.palette}
                    thumb={p.thumb}
                    title={p.label}
                    size="lg"
                  />
                  <span className="peek-note">
                    <span>{p.label}</span>
                    <span>{p.note}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>,
          host,
        )}
    </div>
  );
}
