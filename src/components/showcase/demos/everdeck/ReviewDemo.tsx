"use client";

import { Baby, Brain, Ellipsis, Flag, FlaskConical, Lightbulb, MessageCircle, Mic, Pencil, Plus, Scale, Search } from "lucide-react";
import { Count, Stage, type Act } from "@/stageshow/kit";
import "./everdeck.css";

// Everdeck's study screen as the app draws it (StudyCardFace, AnswerControls,
// the study bar): the deck's progress along the top, the card as the page,
// Again / Hard / Good / Easy with when each brings it back, and the quick
// asks along the bottom. A card is answered with Space and rated Good by
// mouse; then a cloze card is filled in place and rated from the keyboard.
// The cards are from the app's demo deck.

type Rating = "again" | "hard" | "good" | "easy";
type Pos = "left" | "center" | "right";

type S = {
  pos: [Pos, Pos];
  rev: [boolean, boolean];
  current: 0 | 1;
  pressed: Rating | null;
  combo: number;
  seconds: number;
};

const initial: S = { pos: ["center", "right"], rev: [false, false], current: 0, pressed: null, combo: 3, seconds: 4 };
const POSTER: S = { ...initial, rev: [true, false] };

const REST = { wide: { x: 600, y: 300 }, compact: { x: 330, y: 330 } };

const ANSWERS: { key: Rating; label: string; when: string; hotkey: string }[] = [
  { key: "again", label: "Again", when: "1m", hotkey: "1" },
  { key: "hard", label: "Hard", when: "6m", hotkey: "2" },
  { key: "good", label: "Good", when: "10m", hotkey: "3" },
  { key: "easy", label: "Easy", when: "4d", hotkey: "4" },
];

const ASKS = [
  { icon: Lightbulb, label: "Explain" },
  { icon: Baby, label: "Like I’m five" },
  { icon: Scale, label: "Analogy" },
  { icon: FlaskConical, label: "Example" },
  { icon: Brain, label: "Mnemonic" },
];

async function script(a: Act<S>) {
  const tick = () => a.set((s) => ({ seconds: s.seconds + 1 }));
  await a.wait(1000);
  await tick();

  // 1. Space shows the answer; Good by mouse.
  await a.key("space");
  await a.set({ rev: [true, false] });
  a.mark("answer");
  await a.wait(900);
  await tick();
  await a.wait(700);
  await a.move({ at: "good", x: 0.7, y: 0.5 });
  await a.wait(200);
  await a.click();
  await a.set((s) => ({ pos: ["left", "center"], current: 1, combo: s.combo + 1, seconds: s.seconds + 1 }));
  await a.move("rest");
  await a.wait(1400);
  await tick();

  // 2. A cloze card: Space fills the blank where it stands, 3 rates it Good.
  await a.key("space");
  await a.set({ rev: [true, true] });
  a.mark("cloze");
  await a.wait(1000);
  await tick();
  await a.wait(600);
  await a.set({ pressed: "good" });
  await a.key("3");
  await a.snap({ pos: ["right", "center"], rev: [false, true] });
  await a.set((s) => ({ pressed: null, pos: ["center", "left"], current: 0, combo: s.combo + 1, seconds: s.seconds + 1 }));
  await a.wait(1600);
  await a.snap({ pos: ["center", "right"], rev: [false, false], combo: 3, seconds: 4 });
}

export default function ReviewDemo({ speed }: { speed: number }) {
  return (
    <Stage
      width={720}
      height={500}
      compact={{ below: 520, width: 390, height: 560 }}
      initial={initial}
      poster={POSTER}
      script={script}
      speed={speed}
      cursor={{ at: REST }}
      keys="bottom-left"
      className="ed ed-review"
    >
      {(s, _rect, layout) => {
        const rev = s.rev[s.current];
        return (
          <>
            <div className="ed-segbar" aria-hidden>
              <span style={{ background: "#ff9f43", flex: 1.3 }} />
              <span style={{ background: "#c9dcf7", flex: 6 }}>
                <span className="ed-segbar__now" style={{ width: `${20 + s.combo * 4}%` }} />
              </span>
              <span style={{ background: "#f8d6d4", flex: 3.5 }} />
              <span style={{ background: "#d4e6fa", flex: 3.5 }} />
            </div>

            <div className="ed-bar">
              <span className="ed-wordmark">Everdeck</span>
              <span className="ed-slash">/</span>
              <span className="ed-deck">Cardiology</span>
              <span className="ed-of">
                <Count value={s.current === 0 ? 2 : 3} /> of 4
              </span>
              <span className="ed-bar__right">
                <span className="ed-timer">00:{String(s.seconds).padStart(2, "0")}</span>
                <Search size={17} strokeWidth={1.75} />
                <Plus size={18} strokeWidth={1.75} />
                <MessageCircle size={17} strokeWidth={1.75} />
              </span>
            </div>

            <div className="ed-combo" data-show={s.combo >= 4 || undefined}>
              <Count value={Math.max(4, s.combo)} className="ed-combo__n" /> in a row
            </div>

            <div className="ed-cards">
              <div className="ed-card" data-pos={s.pos[0]}>
                <p className="ed-label">Question</p>
                <div className="ed-q">Beck’s triad — what is it and what does it indicate?</div>
                <div className="ed-answer" data-show={s.rev[0] || undefined}>
                  <span className="ed-rule" />
                  <p className="ed-label">Answer</p>
                  <div className="ed-a">
                    Beck’s triad of cardiac tamponade: (1) hypotension, (2) elevated JVP/distended neck veins, (3) muffled/distant heart sounds. Also: tachycardia, pulsus paradoxus &gt;10 mmHg, electrical alternans on ECG. Tx: emergent pericardiocentesis.
                  </div>
                </div>
              </div>
              <div className="ed-card" data-pos={s.pos[1]}>
                <p className="ed-label">Fill in the blank</p>
                <div className="ed-q" data-cloze={s.rev[1] ? "shown" : "live"}>
                  Thiazides act on the{" "}
                  {s.rev[1] ? <span className="ed-cloze">distal convoluted tubule</span> : <span className="ed-cloze-blank">[...]</span>}.
                </div>
                <div className="ed-extra" data-show={s.rev[1] || undefined}>
                  <span className="ed-rule" />
                  <div className="ed-a ed-a--extra">They block the Na⁺/Cl⁻ cotransporter (NCC).</div>
                </div>
              </div>
            </div>

            <div className="ed-controls">
              <div className="ed-show" data-show={!rev || undefined}>
                Show answer <span className="ed-key ed-key--word">Space</span>
              </div>
              <div className="ed-rate" data-show={rev || undefined}>
                <div className="ed-answers">
                  {ANSWERS.map((o) => (
                    <span key={o.key} className="ed-ans" data-tone={o.key} data-target={o.key} data-cursor="pointer" data-pressed={s.pressed === o.key || undefined}>
                      <span className="ed-ans__label">{o.label}</span>
                      <span className="ed-ans__when">
                        {o.when} <span className="ed-key">{o.hotkey}</span>
                      </span>
                    </span>
                  ))}
                </div>
                <p className="ed-examnote">Scheduled for your exam on Nov 6</p>
              </div>
            </div>

            <div className="ed-asks">
              {layout === "wide" && (
                <span className="ed-asks__tools">
                  <Ellipsis size={17} strokeWidth={1.75} />
                  <Flag size={15} strokeWidth={1.75} />
                  <Pencil size={15} strokeWidth={1.75} />
                  <Mic size={15} strokeWidth={1.75} />
                </span>
              )}
              <span className="ed-asks__chips">
                {(layout === "wide" ? ASKS.slice(0, 4) : ASKS.slice(0, 1)).map(({ icon: Icon, label }) => (
                  <span key={label} className="ed-chip">
                    <Icon size={13} strokeWidth={1.75} />
                    {label}
                  </span>
                ))}
              </span>
              {layout === "wide" && <span className="ed-asks__ask">Ask about this card</span>}
            </div>
            <span data-target="rest" style={{ position: "absolute", left: REST[layout].x, top: REST[layout].y }} />
          </>
        );
      }}
    </Stage>
  );
}
