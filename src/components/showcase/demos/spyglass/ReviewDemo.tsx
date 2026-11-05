"use client";

import { Spinner, Stage, type Act } from "@/stageshow/kit";
import { ReviewWindow } from "./review";
import "../mac.css";
import "./record.css";
import "./trim.css";

// The review window after a recording, at its real minimum size: "Copied to
// clipboard" fades, Trim opens AVKit's trim bar, both ends are pulled in,
// Trim saves it ("Trimming…", then "Trimmed and copied"), and Done closes it.

type S = {
  show: boolean;
  status: string | null;
  trimming: boolean;
  left: number;
  right: number;
  busy: boolean;
};

const initial: S = { show: true, status: "Copied to clipboard", trimming: false, left: 0, right: 0, busy: false };
const POSTER: S = { ...initial, status: "Trimmed and copied" };

const REST = { wide: { x: 470, y: 160 }, compact: { x: 300, y: 160 } };
const STRIP = 300; // the trim bar's filmstrip width

async function script(a: Act<S>) {
  await a.wait(1600);
  await a.set({ status: null });
  await a.wait(500);

  await a.move({ at: "trim", x: 0.6, y: 0.6 });
  await a.wait(150);
  await a.click();
  await a.set({ trimming: true });
  a.mark("trim");
  await a.wait(600);

  const l = a.rect("handle-l");
  const from = { x: l.x + l.width / 2, y: l.y + l.height / 2 };
  await a.move(from);
  await a.wait(150);
  const scale = a.rect("strip").width / STRIP;
  await a.drag({ x: from.x + 64 * scale, y: from.y }, (at) => a.put({ left: Math.max(0, Math.min(64, (at.x - from.x) / scale)) }), { duration: 700, cursor: "preserve" });
  await a.wait(250);

  const r = a.rect("handle-r");
  const from2 = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  await a.move(from2);
  await a.wait(150);
  await a.drag({ x: from2.x - 40 * scale, y: from2.y }, (at) => a.put({ right: Math.max(0, Math.min(40, (from2.x - at.x) / scale)) }), { duration: 600, cursor: "preserve" });
  await a.wait(300);

  await a.move({ at: "trim-ok", x: 0.6, y: 0.6 });
  await a.wait(150);
  await a.click();
  await a.set({ trimming: false, busy: true, status: "Trimming…" });
  await a.wait(1300);
  await a.set({ busy: false, status: "Trimmed and copied" });
  a.mark("trimmed");
  await a.move("rest");
  await a.wait(2400);

  await a.move({ at: "done", x: 0.6, y: 0.6 });
  await a.wait(150);
  await a.click();
  await a.set({ show: false });
  await a.wait(500);
  await a.snap({ ...initial, show: false });
  await a.move("rest");
  await a.set({ show: true });
  await a.wait(300);
}

export default function ReviewDemo({ speed }: { speed: number }) {
  return (
    <Stage
      width={580}
      height={440}
      compact={{ below: 520, width: 390, height: 330 }}
      initial={initial}
      poster={POSTER}
      script={script}
      speed={speed}
      cursor={{ at: REST }}
      className="mac-scene sg sg-trim-demo"
    >
      {(s, _rect, layout) => (
        <>
          <ReviewWindow
            show={s.show}
            status={s.status}
          >
            {s.busy && (
              <div className="sg-trim-busy">
                <Spinner />
              </div>
            )}
            <div className="sg-trimbar" data-show={s.trimming || undefined}>
              <div className="sg-trimbar__strip" data-target="strip">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="sg-trimbar__frame" />
                ))}
                <span className="sg-trimbar__dim" style={{ left: 0, width: s.left }} />
                <span className="sg-trimbar__dim" style={{ right: 0, width: s.right }} />
                <span className="sg-trimbar__sel" style={{ left: s.left, right: s.right }}>
                  <span className="sg-trimbar__handle sg-trimbar__handle--l" data-target="handle-l" data-cursor="resize-ew" />
                  <span className="sg-trimbar__handle sg-trimbar__handle--r" data-target="handle-r" data-cursor="resize-ew" />
                </span>
              </div>
              <span className="sg-trimbar__btn">Cancel</span>
              <span className="sg-trimbar__btn sg-trimbar__btn--ok" data-target="trim-ok" data-cursor="pointer">
                Trim
              </span>
            </div>
          </ReviewWindow>
          <span data-target="rest" style={{ position: "absolute", left: REST[layout].x, top: REST[layout].y }} />
        </>
      )}
    </Stage>
  );
}
