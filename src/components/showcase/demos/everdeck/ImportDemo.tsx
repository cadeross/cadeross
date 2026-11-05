"use client";

import { Check, FileArchive, Upload } from "lucide-react";
import { Stage, Swap, type Act, type Point } from "@/stageshow/kit";
import "./everdeck.css";
import "./generate.css";
import "./import.css";

// Bringing an Anki deck across, as AnkiImportFlow runs it: an .apkg is
// dropped on "Bring your Anki decks", read, and the preview says exactly
// what comes (the coverage rows and the "In this file" ticket with its pile
// of cards). "Choose another file" goes back to the start.

type S = { step: "upload" | "preview"; carry: Point | null; over: boolean; reading: boolean };

const initial: S = { step: "upload", carry: null, over: false, reading: false };
const POSTER: S = { ...initial, step: "preview" };

const REST = { wide: { x: 470, y: 560 }, compact: { x: 330, y: 520 } };

const ROWS = [
  { title: "Cards and notes", detail: "2,418 cards from 2,105 notes, drawn with 2 note types (Basic, Cloze)." },
  { title: "Decks and subdecks", detail: "6 decks, kept as separate decks in one folder unless you merge them below." },
  { title: "Images and audio", detail: "312 files, every one the cards use." },
  { title: "Schedule", detail: "1,962 cards keep their due date, interval and ease; 456 are new." },
  { title: "Review history", detail: "48,310 past reviews, for scheduling, your history and the calendar." },
];

const FACTS = [
  { label: "With a schedule", value: "1,962" },
  { label: "Past reviews", value: "48,310" },
  { label: "Media files", value: "312" },
];

async function script(a: Act<S>) {
  await a.wait(800);

  const start = a.layout === "wide" ? { x: 760, y: 470 } : { x: 420, y: 500 };
  a.place(start);
  await a.cursor("grab");
  await a.set({ carry: start });
  await a.move({ at: "drop", x: 0.62, y: 0.5 }, { duration: 1300, onMove: (at) => a.put({ carry: at }) });
  await a.set({ over: true });
  await a.wait(350);
  await a.cursor("pointer");
  await a.set({ carry: null, over: false, reading: true });
  await a.move("rest");
  await a.wait(1100);
  await a.set({ step: "preview", reading: false });
  a.mark("preview");
  await a.wait(3600);

  await a.move({ at: "back", x: 0.5, y: 0.6 });
  await a.wait(200);
  await a.click();
  await a.set({ step: "upload" });
  await a.move("rest");
  await a.wait(500);
}

export default function ImportDemo({ speed }: { speed: number }) {
  return (
    <Stage
      width={720}
      height={600}
      compact={{ below: 520, width: 390, height: 560 }}
      initial={initial}
      poster={POSTER}
      script={script}
      speed={speed}
      cursor={{ at: REST }}
      className="ed ed-import"
    >
      {(s, _rect, layout) => {
        const preview = s.step === "preview";
        return (
          <>
            <div className="ed-page">
              <div className="ed-steps">
                <span className="ed-step" data-state={preview ? "done" : "now"}>
                  <span className="ed-step__dot">{preview ? <Check size={11} strokeWidth={3} /> : 1}</span>
                  Package
                </span>
                <span className="ed-step" data-state={preview ? "now" : "next"}>
                  <span className="ed-step__dot">2</span>
                  Import
                </span>
                <span className="ed-steps__close">Close</span>
              </div>

              <Swap id={s.step} className="ed-import__head">
                {preview ? (
                  <>
                    <div className="ed-display">Here’s what’s in it</div>
                    <p className="ed-lead">Look through every card before it comes across, then name it and import.</p>
                  </>
                ) : (
                  <>
                    <div className="ed-display">Bring your Anki decks</div>
                    <p className="ed-lead">Your cards, media, schedule and past reviews come across as they are. Here’s exactly what comes, and how to get the file out of Anki.</p>
                  </>
                )}
              </Swap>

              <div className="ed-import__body" data-step={s.step}>
                <div className="ed-import__upload">
                  <div className="ed-drop ed-drop--anki" data-target="drop" data-over={s.over || undefined}>
                    <div className="ed-drop__empty">
                      <span className="ed-drop__icon ed-drop__icon--tint">
                        <Upload size={20} strokeWidth={1.75} />
                      </span>
                      <p className="ed-drop__title">{s.reading ? "Reading your file…" : "Drop your Anki package"}</p>
                      <p className="ed-drop__hint">.apkg or .colpkg (best) · .txt or .csv · click to browse</p>
                    </div>
                  </div>
                </div>

                <div className="ed-import__preview">
                  <div className="ed-cover">
                    {ROWS.map((r, i) => (
                      <div key={r.title} className="ed-cover__row" style={{ transitionDelay: preview ? `${120 + i * 70}ms` : "0ms" }}>
                        <span className="ed-cover__mark">
                          <Check size={11} strokeWidth={3} />
                        </span>
                        <div>
                          <div className="ed-cover__title">{r.title}</div>
                          {layout === "wide" && <div className="ed-cover__detail">{r.detail}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="ed-ticket">
                    <p className="ed-ticket__head">In this file</p>
                    <div className="ed-pile">
                      <span className="ed-pile__under" style={{ transform: "rotate(-7deg) translateY(4px)" }} />
                      <span className="ed-pile__under" style={{ transform: "rotate(4deg) translateY(2px)" }} />
                      <div className="ed-pile__top">
                        <div className="ed-pile__count">
                          <span className="ed-display">2,418</span>
                          <span className="ed-pile__unit">cards</span>
                        </div>
                        <span className="ed-pile__bar" />
                      </div>
                    </div>
                    <dl className="ed-facts">
                      {FACTS.map((f) => (
                        <div key={f.label} className="ed-fact">
                          <dt>{f.label}</dt>
                          <dd>{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="ed-import__foot">
                    <span className="ed-back" data-target="back" data-cursor="pointer">
                      Choose another file
                    </span>
                    <span className="ed-pill">Import 2,418 cards</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ed-carry" data-show={s.carry ? true : undefined} style={s.carry ? { left: s.carry.x, top: s.carry.y } : undefined}>
              <FileArchive size={26} strokeWidth={1.5} />
              <span>Step 1 Pharmacology.apkg</span>
            </div>
            <span data-target="rest" style={{ position: "absolute", left: REST[layout].x, top: REST[layout].y }} />
          </>
        );
      }}
    </Stage>
  );
}
