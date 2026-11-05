"use client";

import { ArrowUpRight, Anchor, BatteryFull, Check, Copy, Folder, Moon, Plus, Sailboat, Wifi } from "lucide-react";
import { Caret, Collapse, Count, Prompt, Roll, Spinner, Stage, Window, type Act } from "@/stageshow/kit";
import "../mac.css";
import "./servers.css";

// Harbor, as PanelView draws it (360pt, header, folder rows, Keep Mac awake,
// footer): aurora-web is stopped from its row ("Docking…", then the Docked
// toast), then started again in its terminal, and Harbor picks it up on its
// own. The loop ends where it began, two ships at sea.

type Line = { id: number; kind: "prompt" | "out" | "dim" | "ok"; text: string; fresh?: boolean };

type S = {
  running: boolean;
  docking: boolean;
  toast: boolean;
  lines: Line[];
  typed: string;
  typing: boolean;
};

const PATH = "aurora-web";

const run = (from: number, fresh = false): Line[] => [
  { id: from, kind: "prompt", text: "npm run dev", fresh },
  { id: from + 1, kind: "ok", text: "VITE v6.3.5  ready in 412 ms", fresh },
  { id: from + 2, kind: "out", text: "➜  Local:   http://localhost:5173/", fresh },
  { id: from + 3, kind: "dim", text: "➜  Network: use --host to expose", fresh },
];

// Earlier runs above the live one, so the bottom-pinned terminal reads the
// same at the start and end of the loop.
const INITIAL_LINES: Line[] = [0, 1, 2, 3].flatMap((i) => [
  ...(i > 0 ? [{ id: i * 5 - 1, kind: "out" as const, text: "^C" }] : []),
  ...run(i * 5),
]);

const initial: S = { running: true, docking: false, toast: false, lines: INITIAL_LINES, typed: "", typing: false };
const POSTER: S = { ...initial, running: false, toast: true };

const REST = { wide: { x: 186, y: 420 }, compact: { x: 330, y: 420 } };

async function script(a: Act<S>) {
  await a.wait(900);

  // 1. Stop aurora-web from its row.
  await a.move({ at: "stop", x: 0.7, y: 0.6 });
  await a.wait(250);
  await a.click();
  await a.set({ docking: true });
  await a.wait(650);
  await a.set((s) => ({
    running: false,
    docking: false,
    toast: true,
    lines: [...s.lines, { id: 100, kind: "out", text: "^C", fresh: true }],
    typing: true,
  }));
  a.mark("docked");
  await a.move("rest");
  await a.wait(1600);
  await a.set({ toast: false });
  await a.wait(500);

  // 2. Start it again where it lives, in its terminal.
  await a.move({ at: "terminal", x: 0.45, y: 0.6 });
  await a.wait(200);
  await a.click();
  await a.wait(200);
  await a.type("typed", "npm run dev", { interval: 60 });
  await a.wait(200);
  await a.key("enter");
  await a.set((s) => ({ typed: "", typing: false, lines: [...s.lines, ...run(101, true)] }));
  await a.move("rest");
  await a.wait(800);

  // 3. Harbor spots it on localhost and matches it to the folder.
  await a.set({ running: true });
  a.mark("found");
  await a.wait(2400);

  await a.snap({ lines: INITIAL_LINES });
  await a.wait(200);
}

function Terminal({ s }: { s: S }) {
  return (
    <Window chrome="terminal" title="aurora-web — zsh" className="hb-term" data-target="terminal" data-cursor="ibeam">
      <div className="hb-term__lines">
        {s.lines.map((l) =>
          l.kind === "prompt" ? (
            <Prompt key={l.id} path={PATH} data-fresh={l.fresh || undefined}>
              {l.text}
            </Prompt>
          ) : (
            <div key={l.id} className={`ss-term__line ${l.kind === "out" ? "" : l.kind}`} data-fresh={l.fresh || undefined}>
              {l.text}
            </div>
          ),
        )}
        {s.typing && (
          <Prompt path={PATH} data-fresh>
            {s.typed}
            <Caret still={s.typed.length > 0} />
          </Prompt>
        )}
      </div>
    </Window>
  );
}

function FolderIcon() {
  return (
    <span className="hb-folder" aria-hidden>
      <Folder size={30} strokeWidth={0} fill="currentColor" />
    </span>
  );
}

function FolderRow({ name, port, running, docking, stop }: { name: string; port?: number; running?: boolean; docking?: boolean; stop?: string }) {
  return (
    <div className="hb-row mac-row">
      <div className="hb-row__head">
        <FolderIcon />
        <div className="hb-row__text">
          <div className="mac-row__title">{name}</div>
          <div className="mac-row__sub">~/Projects/{name}</div>
        </div>
        <span className="mac-glass-btn mac-circle--sm">
          <Copy size={12} strokeWidth={2.25} aria-hidden />
        </span>
      </div>
      {port !== undefined && (
        <Collapse open={!!running}>
          <div className="hb-row__server">
            <span className="mac-glass-btn mac-capsule-sm hb-chip">
              <span className="hb-dot" />
              localhost:{port}
              <ArrowUpRight size={10} strokeWidth={3} className="hb-chip__arrow" aria-hidden />
            </span>
            <span className="mac-glass-btn mac-capsule-sm hb-stop" data-target={stop} data-cursor="pointer">
              {docking ? <Spinner /> : <span className="hb-stop__square" />}
              <span>{docking ? "Docking…" : "Stop"}</span>
            </span>
          </div>
        </Collapse>
      )}
    </div>
  );
}

export function HarborPanel({ s, awake = false }: { s: Pick<S, "running" | "docking" | "toast">; awake?: boolean }) {
  const ships = s.running ? 2 : 1;
  return (
    <div className="hb-panel mac-panel">
      <div className="mac-header">
        <div className="mac-header__text">
          <div className="mac-title">Harbor</div>
          <div className="mac-subtitle">
            <Roll>{ships === 1 ? "1 ship at sea" : `${ships} ships at sea`}</Roll>
          </div>
        </div>
        <span className="mac-glass-btn mac-circle">
          <Plus size={14} strokeWidth={2.5} aria-hidden />
        </span>
      </div>
      <div className="hb-list">
        <FolderRow name="aurora-web" port={5173} running={s.running} docking={s.docking} stop="stop" />
        <FolderRow name="design-system" port={6006} running />
        <FolderRow name="pocket-weather" />
      </div>
      <div className="hb-awake mac-row" data-on={awake}>
        <span className="hb-awake__icon" aria-hidden>
          <Moon size={14} strokeWidth={0} fill="currentColor" />
        </span>
        <div className="hb-row__text">
          <div className="mac-row__title">Keep Mac awake</div>
          <div className="mac-row__sub">Sleeps as usual</div>
        </div>
        <span className="mac-switch" data-on={awake} />
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
      <div className="hb-toast mac-glass-btn mac-rounded" data-show={s.toast || undefined}>
        <Anchor size={12} strokeWidth={2.5} aria-hidden />
        Docked aurora-web
      </div>
    </div>
  );
}

export function MenuBar({ app, count, children }: { app: string; count?: number; children?: React.ReactNode }) {
  return (
    <div className="mac-menubar">
      <span className="mac-menubar__app">{app}</span>
      <span className="mac-menubar__menu mac-wide">File</span>
      <span className="mac-menubar__menu mac-wide">Edit</span>
      <span className="mac-menubar__menu mac-wide">View</span>
      <span className="mac-menubar__right">
        {children ?? (
          <span className="mac-menubar__item" data-open="true">
            <Sailboat size={15} strokeWidth={2} aria-hidden />
            {count !== undefined && <Count value={count} />}
          </span>
        )}
        <Wifi size={15} strokeWidth={2.25} aria-hidden />
        <BatteryFull size={19} strokeWidth={1.75} aria-hidden />
        <span className="mac-menubar__time mac-wide">Fri Oct 31 9:41</span>
      </span>
    </div>
  );
}

export default function ServersDemo({ speed }: { speed: number }) {
  return (
    <Stage
      width={580}
      height={470}
      compact={{ below: 520, width: 390, height: 600 }}
      initial={initial}
      poster={POSTER}
      script={script}
      speed={speed}
      cursor={{ at: REST }}
      className="mac-scene hb"
    >
      {(s, _rect, layout) => (
        <>
          <MenuBar app="Ghostty" count={s.running ? 2 : 1} />
          <Terminal s={s} />
          <HarborPanel s={s} />
          <span data-target="rest" style={{ position: "absolute", left: REST[layout].x, top: REST[layout].y }} />
        </>
      )}
    </Stage>
  );
}
