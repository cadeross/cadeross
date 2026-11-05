"use client";

import { Binoculars, Check, Copy, Folder, Moon } from "lucide-react";
import { Stage, Swap, type Act } from "@/stageshow/kit";
import "../mac.css";
import "./servers.css";
import "./awake.css";

// A close-up of KeepAwakeRow at the foot of Harbor's panel. On: the moon
// becomes binoculars, the row takes an orange tint and a watch phrase rolls
// in before the status settles. Off again: "Watch relieved", then "Sleeps as
// usual". The phrases are the app's own (WatchPhrases).

type S = { on: boolean; line: "off" | "posted" | "on" | "relieved" };

const initial: S = { on: false, line: "off" };
const POSTER: S = { on: true, line: "on" };

const LINES: Record<S["line"], { text: string; tint?: boolean }> = {
  off: { text: "Sleeps as usual" },
  posted: { text: "Night watch posted", tint: true },
  on: { text: "Stays up, lid open or closed" },
  relieved: { text: "Watch relieved", tint: true },
};

const REST = { wide: { x: 300, y: 250 }, compact: { x: 200, y: 280 } };

async function script(a: Act<S>) {
  await a.wait(900);
  await a.move({ at: "switch", x: 0.6, y: 0.5 });
  await a.wait(200);
  await a.click();
  await a.set({ on: true, line: "posted" });
  a.mark("on");
  await a.move("rest");
  await a.wait(1700);
  await a.set({ line: "on" });
  await a.wait(2200);
  await a.move({ at: "switch", x: 0.4, y: 0.5 });
  await a.wait(200);
  await a.click();
  await a.set({ on: false, line: "relieved" });
  await a.move("rest");
  await a.wait(1700);
  await a.set({ line: "off" });
  await a.wait(1200);
}

export default function AwakeDemo({ speed }: { speed: number }) {
  return (
    <Stage
      width={580}
      height={300}
      compact={{ below: 520, width: 390, height: 300 }}
      initial={initial}
      poster={POSTER}
      script={script}
      speed={speed}
      cursor={{ at: REST, style: "large" }}
      className="mac-scene hb hb-awake-demo"
    >
      {(s) => {
        const line = LINES[s.line];
        return (
          <div className="hb-zoom">
            <div className="mac-panel hb-zoom__panel">
              <div className="hb-list">
                <div className="hb-row mac-row">
                  <div className="hb-row__head">
                    <span className="hb-folder" aria-hidden>
                      <Folder size={30} strokeWidth={0} fill="currentColor" />
                    </span>
                    <div className="hb-row__text">
                      <div className="mac-row__title">pocket-weather</div>
                      <div className="mac-row__sub">~/Projects/pocket-weather</div>
                    </div>
                    <span className="mac-glass-btn mac-circle--sm">
                      <Copy size={12} strokeWidth={2.25} aria-hidden />
                    </span>
                  </div>
                </div>
              </div>
              <div className="hb-awake mac-row" data-on={s.on}>
                <span className="hb-awake__icon" data-on={s.on} aria-hidden>
                  <Moon className="hb-awake__moon" size={14} strokeWidth={0} fill="currentColor" />
                  <Binoculars className="hb-awake__bino" size={15} strokeWidth={2.5} />
                </span>
                <div className="hb-row__text">
                  <div className="mac-row__title">Keep Mac awake</div>
                  <Swap id={s.line} className="mac-row__sub hb-awake__line" data-tint={line.tint || undefined}>
                    {line.text}
                  </Swap>
                </div>
                <span className="mac-switch" data-on={s.on} data-target="switch" data-cursor="pointer" />
              </div>
              <div className="mac-footer">
                <span className="mac-check">
                  <span className="mac-check__box">
                    <Check size={10} strokeWidth={3.5} aria-hidden />
                  </span>
                  Launch at login
                </span>
                <span className="mac-glass-btn mac-capsule-sm">Quit</span>
              </div>
            </div>
          </div>
        );
      }}
    </Stage>
  );
}
