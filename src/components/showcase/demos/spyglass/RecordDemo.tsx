"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { Count, Stage, Window, type Act } from "@/stageshow/kit";
import { clock, RecordedPage, SpyMenuBar, SpyPanel } from "./parts";
import { ReviewWindow } from "./review";
import "../mac.css";
import "./record.css";

// One recording, as Spyglass runs it: the panel from the menu bar, Start
// Recording (the panel closes first), the porthole counting Lights, Camera,
// Action!, the camera bubble and the floating pill while it records, Stop,
// and the review window saying it's already on the clipboard. Done returns
// the desktop to how it started.

type S = {
  panel: boolean;
  count: 0 | 1 | 2 | 3;
  recording: boolean;
  elapsed: number;
  review: boolean;
};

const initial: S = { panel: false, count: 0, recording: false, elapsed: 0, review: false };
const POSTER: S = { ...initial, review: true, elapsed: 5 };

const REST = { wide: { x: 470, y: 250 }, compact: { x: 300, y: 260 } };

const BEATS = {
  3: { word: "Lights", color: "#ff6b61" },
  2: { word: "Camera", color: "#ffad33" },
  1: { word: "Action!", color: "#33cc8c" },
} as const;

async function script(a: Act<S>) {
  await a.wait(700);

  await a.move("menubar-icon");
  await a.wait(150);
  await a.click();
  await a.set({ panel: true });
  await a.wait(900);

  await a.move({ at: "start", x: 0.3, y: 0.55 });
  await a.wait(200);
  await a.click();
  await a.set({ panel: false });
  await a.wait(200);
  await a.set({ count: 3 });
  a.mark("countdown");
  await a.move("rest");
  await a.wait(1000);
  await a.set({ count: 2 });
  await a.wait(1000);
  await a.set({ count: 1 });
  await a.wait(1000);
  await a.set({ count: 0, recording: true });
  a.mark("recording");

  for (let t = 1; t <= 4; t++) {
    await a.wait(1000);
    await a.set({ elapsed: t });
    if (t === 2) void a.move({ at: "stop", x: 0.75, y: 0.6 });
  }
  await a.wait(700);
  await a.set({ elapsed: 5 });
  await a.wait(300);

  await a.click("stop");
  await a.set({ recording: false });
  await a.wait(300);
  await a.set({ review: true });
  a.mark("review");
  await a.move("rest");
  await a.wait(2600);

  await a.move({ at: "done", x: 0.6, y: 0.6 });
  await a.wait(150);
  await a.click();
  await a.set({ review: false });
  await a.snap({ elapsed: 0 });
  await a.move("rest");
  await a.wait(300);
}

export default function RecordDemo({ speed }: { speed: number }) {
  return (
    <Stage
      width={580}
      height={470}
      compact={{ below: 520, width: 390, height: 560 }}
      initial={initial}
      poster={POSTER}
      script={script}
      speed={speed}
      cursor={{ at: REST }}
      className="mac-scene sg"
    >
      {(s, _rect, layout) => {
        const beat = s.count ? BEATS[s.count] : null;
        return (
          <>
            <SpyMenuBar open={s.panel} recording={s.recording} elapsed={s.elapsed} />

            <Window url="openwrit.com/read/genesis/1" className="sg-browser" receded={s.review}>
              <RecordedPage />
            </Window>

            <SpyPanel open={s.panel} />

            {/* The porthole: a tinted glass circle, the number in the beat's
                color, the word on a glass capsule and Cancel under it. */}
            <div className="sg-countdown" data-show={s.count > 0 || undefined} style={{ "--beat": beat?.color ?? "#33cc8c" } as React.CSSProperties}>
              <div className="sg-porthole">
                {([3, 2, 1] as const).map((n) => (
                  <span key={n} className="sg-porthole__n mac-rounded" data-on={s.count === n || undefined} data-past={s.count < n || undefined} style={{ color: BEATS[n].color }}>
                    {n}
                  </span>
                ))}
              </div>
              <span className="sg-word mac-rounded">{beat?.word ?? "Action!"}</span>
              <span className="mac-glass-btn sg-cancel">Cancel</span>
            </div>

            <div className="sg-bubble" data-show={s.recording || undefined}>
              <svg viewBox="0 0 16 16" aria-hidden>
                <path d="M8 1.5a3.1 3.1 0 1 1 0 6.2 3.1 3.1 0 0 1 0-6.2Zm0 7.4c3.1 0 5.4 1.8 5.9 4.6a.7.7 0 0 1-.7.8H2.8a.7.7 0 0 1-.7-.8C2.6 10.7 4.9 8.9 8 8.9Z" fill="currentColor" />
              </svg>
            </div>

            {/* ControlPill: dot and time, a divider, Start over, Discard, Stop. */}
            <div className="sg-pill" data-show={s.recording || undefined}>
              <span className="sg-pill__dot" />
              <Count value={s.elapsed} format={clock} className="sg-pill__time mac-rounded" />
              <span className="sg-pill__rule" />
              <span className="mac-glass-btn sg-pill__btn">
                <RotateCcw size={11} strokeWidth={2.75} aria-hidden />
              </span>
              <span className="mac-glass-btn sg-pill__btn">
                <Trash2 size={11} strokeWidth={2.75} aria-hidden />
              </span>
              <span className="sg-pill__stop" data-target="stop" data-cursor="pointer">
                <span className="sg-pill__square" />
                Stop
              </span>
            </div>

            <ReviewWindow show={s.review} status="Copied to clipboard" />

            <span data-target="rest" style={{ position: "absolute", left: REST[layout].x, top: REST[layout].y }} />
          </>
        );
      }}
    </Stage>
  );
}
