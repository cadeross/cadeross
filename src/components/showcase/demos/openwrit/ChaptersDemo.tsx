"use client";

import { Popover, Roll, Stage, Swap, type Act } from "@/stageshow/kit";
import { GENESIS, Pill, TopBar } from "./reader";
import "./highlight.css";
import "./chapters.css";

// Moving between chapters with the chapter pill: its popover is the app's
// NumberGrid (a "Go to chapter" field over ten columns of 34pt cells for
// Genesis's 50). Chapter 2 is clicked; then, to come back, 1 is typed and
// Enter pressed. The pill's label, the title and the text change in place.

type S = { open: boolean; chapter: 1 | 2; hot: number | null; typed: string };

const initial: S = { open: false, chapter: 1, hot: null, typed: "" };
const POSTER: S = { ...initial, chapter: 2 };

const REST = { wide: { x: 480, y: 395 }, compact: { x: 320, y: 470 } };

async function script(a: Act<S>) {
  await a.wait(900);

  await a.move({ at: "chapter-pill", x: 0.4, y: 0.6 });
  await a.wait(150);
  await a.click();
  await a.set({ open: true });
  await a.wait(500);
  await a.move({ at: "cell-2", x: 0.5, y: 0.7 });
  await a.set({ hot: 2 });
  await a.wait(300);
  await a.click();
  await a.set({ open: false, hot: null, chapter: 2 });
  a.mark("chapter-2");
  await a.move("rest");
  await a.wait(2400);

  await a.move({ at: "chapter-pill", x: 0.4, y: 0.6 });
  await a.wait(150);
  await a.click();
  await a.set({ open: true });
  await a.wait(500);
  await a.set({ typed: "1", hot: 1 });
  await a.key("1");
  await a.wait(400);
  await a.key("enter");
  await a.set({ open: false, hot: null, typed: "", chapter: 1 });
  await a.wait(2000);
}

export default function ChaptersDemo({ speed }: { speed: number }) {
  return (
    <Stage
      width={580}
      height={420}
      compact={{ below: 520, width: 390, height: 520 }}
      initial={initial}
      poster={POSTER}
      script={script}
      speed={speed}
      cursor={{ at: REST }}
      keys="bottom-right"
      className="ow ow-chapters"
    >
      {(s, rect, layout) => {
        const pill = rect("chapter-pill");
        const width = layout === "wide" ? 356 : 356;
        const stageW = layout === "wide" ? 580 : 390;
        const left = Math.min(Math.max(pill.x + pill.width / 2 - width / 2, 12), stageW - width - 12);
        return (
          <>
            <TopBar />
            <div className="ow-pills">
              <Pill>Genesis</Pill>
              <Pill target="chapter-pill" open={s.open}>
                <Roll>{`Chapter ${s.chapter}`}</Roll>
              </Pill>
              <Pill>
                <span className="ow-pill--muted">NRSVCE</span>
              </Pill>
            </div>
            <div className="ow-head">
              <div className="ow-title">
                <Roll>{`Genesis ${s.chapter}`}</Roll>
              </div>
              <div className="ow-edition">New Revised Standard Version Catholic Edition</div>
            </div>
            <Swap id={s.chapter} className="ow-text">
              {GENESIS[s.chapter].map(([n, text]) => (
                <span key={n}>
                  <sup className="ow-num">{n}</sup>
                  {text}{" "}
                </span>
              ))}
            </Swap>

            <Popover show={s.open} origin="top" className="ow-grid-pop" style={{ left, top: pill.y + pill.height + 6, width }}>
              <div className="ow-grid-pop__field">
                {s.typed ? <span className="ow-grid-pop__typed">{s.typed}</span> : <span className="ow-grid-pop__ph">Go to chapter (1–50)...</span>}
              </div>
              <div className="ow-grid">
                {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                  <span
                    key={n}
                    className="ow-grid__cell"
                    data-target={`cell-${n}`}
                    data-cursor="pointer"
                    data-current={n === s.chapter || undefined}
                    data-hot={s.hot === n || undefined}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </Popover>
            <span data-target="rest" style={{ position: "absolute", left: REST[layout].x, top: REST[layout].y }} />
          </>
        );
      }}
    </Stage>
  );
}
