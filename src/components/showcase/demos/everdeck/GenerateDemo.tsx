"use client";

import { Check, CloudUpload, FileText, Layers, Type, X } from "lucide-react";
import { Count, Stage, Swap, type Act, type Point } from "@/stageshow/kit";
import { Deck, Letter, Marker, Paper, Pencil, Tick } from "./desk";
import "./everdeck.css";
import "./generate.css";

// Generate, as the app runs it (GeneratePageShell, the Materials step,
// GeneratingStep over BuildStatus): a lecture PDF is dropped on the page,
// Continue, and the deck is written. The line rolls through the app's own
// phases while the serif figure counts up, the pencil rides the striped bar
// and each phase's desk object pops in colour. Cancel goes back.

type S = {
  step: "materials" | "writing";
  carry: Point | null;
  over: boolean;
  file: boolean;
  phase: number;
  percent: number;
};

const PHASES = [
  "Reading Cardiac cycle lecture.pdf…",
  "Finding what matters most…",
  "Writing flashcards…",
  "Writing practice questions…",
  "Double-checking answers…",
];
const PERCENTS = [14, 33, 55, 76, 92];
const MARKS = [
  { art: <Paper />, size: 26 },
  { art: <Marker />, size: 40 },
  { art: <Deck />, size: 40 },
  { art: <Letter />, size: 28 },
  { art: <Tick />, size: 28 },
];

const initial: S = { step: "materials", carry: null, over: false, file: false, phase: 0, percent: 0 };
const POSTER: S = { ...initial, step: "writing", file: true, phase: 2, percent: 55 };

const REST = { wide: { x: 640, y: 420 }, compact: { x: 330, y: 460 } };

async function script(a: Act<S>) {
  await a.wait(800);

  // 1. A PDF carried in from the desktop and dropped on the page.
  const start = a.layout === "wide" ? { x: 760, y: 470 } : { x: 420, y: 470 };
  a.place(start);
  await a.cursor("grab");
  await a.set({ carry: start });
  await a.move({ at: "drop", x: 0.6, y: 0.55 }, { duration: 1300, onMove: (at) => a.put({ carry: at }) });
  await a.set({ over: true });
  await a.wait(350);
  await a.cursor("pointer");
  await a.set({ carry: null, over: false, file: true });
  a.mark("dropped");
  await a.wait(800);

  // 2. Continue.
  await a.move({ at: "continue", x: 0.6, y: 0.55 });
  await a.wait(200);
  await a.click();
  await a.set({ step: "writing", phase: 0, percent: PERCENTS[0] });
  await a.move("rest");

  // 3. The deck is written, phase by phase.
  for (let i = 1; i < PHASES.length; i++) {
    await a.wait(1500);
    await a.set({ phase: i, percent: PERCENTS[i] });
  }
  a.mark("checking");
  await a.wait(1800);

  // 4. Cancel goes back to Materials.
  await a.move({ at: "cancel", x: 0.5, y: 0.55 });
  await a.wait(200);
  await a.click();
  await a.set({ step: "materials", file: false });
  await a.snap({ phase: 0, percent: 0 });
  await a.move("rest");
  await a.wait(400);
}

function Steps({ writing }: { writing: boolean }) {
  const steps = ["Start", "Materials", "Tailor", "Review"];
  const at = writing ? 3 : 1;
  return (
    <div className="ed-steps">
      {steps.map((label, i) => (
        <span key={label} className="ed-step" data-state={i < at ? "done" : i === at ? "now" : "next"}>
          <span className="ed-step__dot">{i < at ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
          {label}
        </span>
      ))}
      <span className="ed-steps__close">Close</span>
    </div>
  );
}

export default function GenerateDemo({ speed }: { speed: number }) {
  return (
    <Stage
      width={720}
      height={520}
      compact={{ below: 520, width: 390, height: 520 }}
      initial={initial}
      poster={POSTER}
      script={script}
      speed={speed}
      cursor={{ at: REST }}
      className="ed ed-gen"
    >
      {(s, _rect, layout) => {
        const writing = s.step === "writing";
        return (
          <>
            <div className="ed-page">
              <Steps writing={writing} />
              <Swap id={s.step} className="ed-gen__head">
                {writing ? (
                  <>
                    <div className="ed-display">Writing your deck</div>
                    <p className="ed-lead">It opens for you to look over as soon as it’s ready.</p>
                  </>
                ) : (
                  <>
                    <div className="ed-display">What are we studying?</div>
                    <p className="ed-lead">
                      Notes, PowerPoint slides, Word documents or PDFs become cards and practice questions. Add everything that belongs in one deck, or drop in an Anki deck to bring it over.
                    </p>
                  </>
                )}
              </Swap>

              <div className="ed-gen__body" data-step={s.step}>
                <div className="ed-gen__materials">
                  <span className="ed-seg">
                    <span className="ed-seg__item" data-on="true">New deck</span>
                    <span className="ed-seg__item">Add to a deck</span>
                  </span>
                  <div className="ed-drop" data-target="drop" data-over={s.over || undefined} data-full={s.file || undefined}>
                    <div className="ed-drop__empty">
                      <span className="ed-drop__icon">
                        <CloudUpload size={20} strokeWidth={1.75} />
                      </span>
                      <p className="ed-drop__title">Drop your notes or slides</p>
                      <p className="ed-drop__hint">PDF, PowerPoint, Word, TXT or Markdown · up to 3 sources · click to browse</p>
                      {layout === "wide" && (
                        <p className="ed-drop__hint ed-drop__anki">
                          <Layers size={13} strokeWidth={1.75} /> Anki decks (.apkg) work too: they&apos;re imported as they are
                        </p>
                      )}
                    </div>
                    <div className="ed-drop__file">
                      <span className="ed-file__icon">
                        <FileText size={17} strokeWidth={1.75} />
                      </span>
                      <span className="ed-file__text">
                        <span className="ed-file__name">Cardiac cycle lecture.pdf</span>
                        <span className="ed-file__meta">PDF · 18 pages</span>
                      </span>
                      <X size={15} strokeWidth={1.75} className="ed-file__x" />
                    </div>
                  </div>
                  <div className="ed-gen__actions">
                    <span className="ed-paste">
                      <Type size={14} strokeWidth={1.75} /> Paste text instead
                    </span>
                    <span className="ed-pill" data-target="continue" data-cursor="pointer" data-off={!s.file || undefined}>
                      Continue
                    </span>
                  </div>
                </div>

                <div className="ed-gen__writing">
                  <div className="ed-build__line">
                    <Swap id={s.phase} className="ed-build__what">
                      {PHASES[s.phase]}
                    </Swap>
                    <span className="ed-display ed-build__pct">
                      <Count value={s.percent} duration={900} />%
                    </span>
                  </div>
                  <div className="ed-build__bar">
                    <div className="ed-build__track">
                      <div className="ed-build__fill" style={{ width: `${Math.max(4, s.percent)}%` }}>
                        <span className="ed-build__stripes" />
                      </div>
                    </div>
                    <div className="ed-build__pencil" style={{ left: `${Math.max(4, s.percent)}%` }}>
                      <div className="ed-build__pencil-in">
                        <Pencil />
                      </div>
                    </div>
                  </div>
                  <div className="ed-build__marks">
                    {MARKS.map((m, i) => (
                      <span key={i} className="ed-build__mark" data-state={i < s.phase ? "done" : i === s.phase ? "now" : "next"} style={{ width: m.size }}>
                        {m.art}
                      </span>
                    ))}
                  </div>
                  <div className="ed-build__foot">
                    <span>Usually under two minutes.</span>
                    <span className="ed-build__cancel" data-target="cancel" data-cursor="pointer">
                      Cancel
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* The file being carried in from the desktop, held under the hand. */}
            <div className="ed-carry" data-show={s.carry ? true : undefined} style={s.carry ? { left: s.carry.x, top: s.carry.y } : undefined}>
              <FileText size={26} strokeWidth={1.5} />
              <span>Cardiac cycle lecture.pdf</span>
            </div>
            <span data-target="rest" style={{ position: "absolute", left: REST[layout].x, top: REST[layout].y }} />
          </>
        );
      }}
    </Stage>
  );
}
