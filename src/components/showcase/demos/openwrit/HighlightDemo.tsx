"use client";

import { useState } from "react";
import { Copy, Share2, StickyNote, X } from "lucide-react";
import { Popover, Stage, type Act } from "@/stageshow/kit";
import { GENESIS, Pill, TopBar, useMarker } from "./reader";
import "./highlight.css";

// OpenWrit's reader, sepia, at Genesis 1. Click verse 3 and its menu opens
// (the six marker colors, then Note, Copy, Share); yellow lays a real marker
// stroke under the verse. Click it again and the yellow dot, now marked with
// an x, takes it off: the loop's reset is the app's own undo.

type S = { menu: boolean; marked: boolean; hot: string | null; selected: boolean };

const initial: S = { menu: false, marked: false, hot: null, selected: false };
const POSTER: S = { ...initial, marked: true };

const REST = { wide: { x: 480, y: 395 }, compact: { x: 320, y: 520 } };

const DOTS = [
  { id: "yellow", color: "#FFCC00" },
  { id: "green", color: "#34C759" },
  { id: "blue", color: "#007AFF" },
  { id: "pink", color: "#FF2D55" },
  { id: "purple", color: "#AF52DE" },
  { id: "orange", color: "#FF9500" },
];

async function pickYellow(a: Act<S>) {
  await a.move({ at: "verse", x: 0.3, y: 0.7 });
  await a.wait(200);
  await a.click();
  await a.set({ menu: true, selected: true });
  await a.wait(550);
  await a.move("dot-yellow");
  await a.set({ hot: "yellow" });
  await a.wait(350);
  await a.click();
}

async function script(a: Act<S>) {
  await a.wait(1000);

  await pickYellow(a);
  await a.set({ menu: false, hot: null, selected: false });
  await a.wait(80);
  await a.set({ marked: true });
  a.mark("marked");
  await a.move("rest");
  await a.wait(2800);

  await pickYellow(a);
  await a.set({ menu: false, hot: null, selected: false });
  await a.wait(80);
  await a.set({ marked: false });
  await a.move("rest");
  await a.wait(1400);
}

function Verse({ n, text, target, marked, selected }: { n: number; text: string; target?: string; marked?: boolean; selected?: boolean }) {
  const [el, setEl] = useState<HTMLSpanElement | null>(null);
  useMarker(el, !!marked);
  return (
    <>
      <span className="ow-verse" data-target={target} data-cursor={target ? "pointer" : undefined} data-selected={selected || undefined}>
        <sup className="ow-num">{n}</sup>
        <span ref={setEl}>{text}</span>
      </span>{" "}
    </>
  );
}

export default function HighlightDemo({ speed }: { speed: number }) {
  return (
    <Stage
      width={580}
      height={420}
      compact={{ below: 520, width: 390, height: 560 }}
      initial={initial}
      poster={POSTER}
      script={script}
      speed={speed}
      cursor={{ at: REST }}
      className="ow"
    >
      {(s, rect, layout) => {
        const v = rect("verse");
        const width = layout === "wide" ? 580 : 390;
        const left = Math.min(Math.max(v.x + 10, 12), width - 212);
        // Radix flips the menu above the verse when there's no room below.
        const top = v.y - 8 - 172;
        return (
          <>
            <TopBar />
            <div className="ow-pills">
              <Pill>Genesis</Pill>
              <Pill>Chapter 1</Pill>
              <Pill>
                <span className="ow-pill--muted">NRSVCE</span>
              </Pill>
            </div>
            <div className="ow-head">
              <div className="ow-title">Genesis 1</div>
              <div className="ow-edition">New Revised Standard Version Catholic Edition</div>
            </div>
            <div className="ow-text">
              {GENESIS[1].map(([n, text]) => (
                <Verse
                  key={n}
                  n={n}
                  text={text}
                  target={n === 3 ? "verse" : undefined}
                  marked={n === 3 && s.marked}
                  selected={n === 3 && s.selected}
                />
              ))}
            </div>

            <Popover show={s.menu} origin="bottom left" className="ow-menu" style={{ left, top }}>
              <div className="ow-dots">
                {DOTS.map((d) => (
                  <span key={d.id} className="ow-dotcell" data-target={`dot-${d.id}`} data-cursor="pointer">
                    <span className="ow-dot" style={{ background: d.color }} data-hot={s.hot === d.id || undefined} data-active={(d.id === "yellow" && s.marked) || undefined}>
                      {d.id === "yellow" && (
                        <span className="ow-dot__x">
                          <X size={12} strokeWidth={2.5} aria-hidden />
                        </span>
                      )}
                    </span>
                  </span>
                ))}
              </div>
              <div className="ow-sep" />
              <div className="ow-items">
                <div className="ow-item">
                  <StickyNote size={14} strokeWidth={2} aria-hidden />
                  Note
                </div>
                <div className="ow-item">
                  <Copy size={14} strokeWidth={2} aria-hidden />
                  Copy
                </div>
                <div className="ow-item">
                  <Share2 size={14} strokeWidth={2} aria-hidden />
                  Share
                </div>
              </div>
            </Popover>
            <span data-target="rest" style={{ position: "absolute", left: REST[layout].x, top: REST[layout].y }} />
          </>
        );
      }}
    </Stage>
  );
}
