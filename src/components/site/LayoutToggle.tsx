"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { rippleFrom } from "./fieldStore";
import { LAYOUT_KEY } from "./layoutScript";
import {
  readVersion,
  setVersion,
  subscribeVersion,
  type Version,
} from "./versionStore";

/* Temporary switches, bottom left. One picks the version of the site (the
   light field, the watercolor or the Monet pond); the other, shown only with the light
   field, compares three places for it: a column on the right, a bar along
   the top, or the whole right half of the window. Both choices live on
   <html>, set before paint by layoutScript, so any combination loads
   without a flash. */

type Layout = "side" | "top" | "half";
const LAYOUTS: { value: Layout; label: string }[] = [
  { value: "side", label: "Side" },
  { value: "top", label: "Top" },
  { value: "half", label: "Half" },
];
const VERSIONS: { value: Version; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "watercolor", label: "Watercolor" },
  { value: "monet", label: "Monet" },
];

const listeners = new Set<() => void>();
const readLayout = (): Layout => {
  const v = document.documentElement.dataset.layout;
  return v === "top" || v === "half" ? v : "side";
};
const subscribeLayout = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

function applyLayout(v: Layout) {
  if (v === "side") delete document.documentElement.dataset.layout;
  else document.documentElement.dataset.layout = v;
  try {
    localStorage.setItem(LAYOUT_KEY, v);
  } catch {}
  listeners.forEach((fn) => fn());
}

function transition(apply: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => unknown;
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (doc.startViewTransition && !reduced) doc.startViewTransition(apply);
  else apply();
}

function Switch<T extends string>({
  label,
  className,
  options,
  value,
  onPick,
}: {
  label: string;
  className?: string;
  options: { value: T; label: string }[];
  value: T;
  onPick: (v: T, el: HTMLElement) => void;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div
      className={`layout-switch ${className ?? ""}`}
      role="group"
      aria-label={label}
    >
      <span className="layout-switch-label">{label}</span>
      <span
        className="layout-switch-track"
        style={{ "--n": options.length, "--i": index } as CSSProperties}
      >
        <span className="layout-switch-thumb" aria-hidden="true" />
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={(e) => {
              if (o.value !== value) onPick(o.value, e.currentTarget);
            }}
          >
            {o.label}
          </button>
        ))}
      </span>
    </div>
  );
}

export default function LayoutToggle() {
  const layout = useSyncExternalStore(
    subscribeLayout,
    readLayout,
    () => "side" as Layout,
  );
  const version = useSyncExternalStore(
    subscribeVersion,
    readVersion,
    () => "light" as Version,
  );

  return (
    <div className="switches">
      <Switch
        label="Version"
        options={VERSIONS}
        value={version}
        onPick={(v) => transition(() => setVersion(v))}
      />
      <Switch
        label="Layout"
        className="layout-switch-layout"
        options={LAYOUTS}
        value={layout}
        onPick={(v, el) => {
          transition(() => applyLayout(v));
          window.setTimeout(() => rippleFrom(el, 1.1), 450);
        }}
      />
    </div>
  );
}
