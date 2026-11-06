"use client";

import { useSyncExternalStore } from "react";
import { TYPE_KEY } from "./typeScript";

/* Top right on every page: switch the text between the typeset serifs and
   the handwritten pen. The swap crossfades so the page doesn't jump. */

type Mode = "set" | "hand";

const read = (): Mode =>
  document.documentElement.dataset.type === "hand" ? "hand" : "set";

/* The mode lives on <html data-type>, set before paint; watch it there. */
const subscribe = (onChange: () => void) => {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributeFilter: ["data-type"] });
  return () => mo.disconnect();
};

export default function TypeToggle() {
  const mode = useSyncExternalStore<Mode | null>(subscribe, read, () => null);

  const choose = (next: Mode) => {
    if (next === read()) return;
    const root = document.documentElement;
    const apply = () => {
      if (next === "hand") root.dataset.type = "hand";
      else delete root.dataset.type;
      try {
        localStorage.setItem(TYPE_KEY, next);
      } catch {}
    };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    };
    if (!reduced && doc.startViewTransition) {
      root.classList.add("type-swap");
      const vt = doc.startViewTransition(apply) as { finished?: Promise<void> };
      vt.finished?.finally(() => root.classList.remove("type-swap"));
    } else apply();
  };

  return (
    <div className="type-toggle" role="group" aria-label="Text style">
      <button
        type="button"
        className="type-toggle-option"
        data-face="set"
        aria-pressed={mode === "set"}
        onClick={() => choose("set")}
      >
        Typeset
      </button>
      <span className="type-toggle-sep" aria-hidden="true">
        /
      </span>
      <button
        type="button"
        className="type-toggle-option"
        data-face="hand"
        aria-pressed={mode === "hand"}
        onClick={() => choose("hand")}
      >
        Handwritten
      </button>
    </div>
  );
}
