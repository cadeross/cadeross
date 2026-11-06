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
import { writeIntro } from "./penWriter";
import { SWASHES } from "./swash";
import { PALETTES, type PaletteKey } from "./palettes";
import { Tile } from "./ProjectRow";

/* The homepage introduction: who I am in one line, then the things I've
   made, named inline. Each name carries a swatch of its project's colour.
   Pointing at one tints the painting and brings up a small card of the
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
  const introRef = useRef<HTMLDivElement>(null);

  // In handwritten mode the introduction is written out with a pen
  // (penWriter.ts), and written again whenever the visitor switches to
  // handwritten.
  useEffect(() => {
    const intro = introRef.current;
    if (!intro) return;
    const html = document.documentElement;
    let run = 0;
    let stop: (() => void) | null = null;
    let releaseTimer = 0;
    // What follows the introduction waits until it's written (Reveal).
    const hold = () => {
      html.dataset.introWriting = "";
    };
    const release = () => {
      window.clearTimeout(releaseTimer);
      if (!("introWriting" in html.dataset)) return;
      delete html.dataset.introWriting;
      window.dispatchEvent(new Event("intro-written"));
    };
    const reset = () => {
      stop?.();
      stop = null;
      for (const w of intro.querySelectorAll<HTMLElement>(".hero-word")) delete w.dataset.written;
    };
    const write = async () => {
      const id = ++run;
      reset();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (html.dataset.type !== "hand" || reduced) {
        intro.dataset.write = "done";
        release();
        return;
      }
      intro.dataset.write = "pending";
      hold();
      // The words have to be measured in the hand they'll be written in.
      await new Promise(requestAnimationFrame);
      await document.fonts.ready;
      if (id !== run) return;
      try {
        intro.dataset.write = "go";
        // Last, the project names are underlined with a flourish, one
        // after the other (hand.css times the strokes).
        stop = writeIntro(intro, () => {
          if (id !== run) return;
          intro.dataset.write = "underline";
          releaseTimer = window.setTimeout(release, 700);
          window.setTimeout(() => {
            if (id === run) intro.dataset.write = "done";
          }, 2000);
        });
      } catch {
        reset();
        intro.dataset.write = "done";
        release();
      }
    };
    write();
    let mode = html.dataset.type;
    const mo = new MutationObserver(() => {
      if (html.dataset.type === mode) return;
      mode = html.dataset.type;
      write();
    });
    mo.observe(html, { attributeFilter: ["data-type"] });
    // A new width reflows the words; show them as they are.
    const onResize = () => {
      if (intro.dataset.write === "done") return;
      run++;
      reset();
      intro.dataset.write = "done";
      release();
    };
    window.addEventListener("resize", onResize);
    return () => {
      run++;
      stop?.();
      release();
      mo.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);
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
    <div ref={introRef} className="intro" data-write="pending">
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
                    <span className="intro-name">{p.label}</span>
                    {/* The handwritten underline: a pen flourish. */}
                    <svg
                      className="intro-swash"
                      viewBox="0 0 120 24"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      style={{ "--swash": pi } as CSSProperties}
                    >
                      <mask
                        id={`intro-swash-${pi}`}
                        maskUnits="userSpaceOnUse"
                        x="-4"
                        y="-4"
                        width="128"
                        height="32"
                      >
                        <path
                          className="intro-swash-pen"
                          d={SWASHES[pi % SWASHES.length].spine}
                          pathLength={1}
                        />
                      </mask>
                      <path
                        className="intro-swash-ink"
                        d={SWASHES[pi % SWASHES.length].shape}
                        mask={`url(#intro-swash-${pi})`}
                      />
                    </svg>
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
