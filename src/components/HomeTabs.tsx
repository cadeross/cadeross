"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { SECTIONS, sectionHref, parseSection, type Section } from "@/lib/sections";

/* Per-character speed of the prompt backspacing and retyping its path. */
const TYPE_MS = 32;

type Props = {
  initial: Section;
  panels: Record<Section, ReactNode>;
};

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

/* Homepage nav as a terminal. The menu ([1] work [2] explorations
   [3] about) drives a prompt line, `~/work█`, that backspaces and retypes
   the new path before the section's listing prints in beneath it.

   Keys: 1–3 or ←/→ switch sections, ↑/↓ walk the listing, ↵ opens.
   Every menu item is still a real link, so deep links (/?section=about),
   new-tab clicks and the back button all work. */
export default function HomeTabs({ initial, panels }: Props) {
  const [selected, setSelected] = useState<Section>(initial);
  const [shown, setShown] = useState<Section>(initial);
  const [typed, setTyped] = useState<string>(initial);
  const typedRef = useRef<string>(initial);
  const timerRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  /* The key handler is bound once, so it reads the selection through a ref. */
  const selectedRef = useRef<Section>(initial);

  const go = useCallback((next: Section, push: boolean) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    selectedRef.current = next;
    setSelected(next);
    if (push) window.history.pushState(null, "", sectionHref(next));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      typedRef.current = next;
      setTyped(next);
      setShown(next);
      return;
    }

    /* Backspace to the shared prefix, then type the rest. */
    timerRef.current = window.setInterval(() => {
      const current = typedRef.current;
      let following: string;
      if (!next.startsWith(current)) following = current.slice(0, -1);
      else if (current.length < next.length) following = next.slice(0, current.length + 1);
      else {
        window.clearInterval(timerRef.current!);
        timerRef.current = null;
        setShown(next);
        return;
      }
      typedRef.current = following;
      setTyped(following);
    }, TYPE_MS);
  }, []);

  useEffect(() => {
    function onPopState() {
      go(parseSection(new URLSearchParams(window.location.search).get("section")), false);
    }

    function moveFocus(delta: number) {
      const entries = Array.from(
        panelRef.current?.querySelectorAll<HTMLAnchorElement>("a.home-entry") ?? [],
      );
      if (!entries.length) return false;
      const index = entries.indexOf(document.activeElement as HTMLAnchorElement);
      const next =
        index === -1
          ? delta > 0 ? 0 : entries.length - 1
          : Math.min(Math.max(index + delta, 0), entries.length - 1);
      entries[next].focus();
      return true;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      const index = SECTIONS.indexOf(selectedRef.current);
      const last = SECTIONS.length - 1;

      if (e.key >= "1" && e.key <= String(SECTIONS.length)) {
        e.preventDefault();
        const next = SECTIONS[Number(e.key) - 1];
        if (next !== selectedRef.current) go(next, true);
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next =
          e.key === "ArrowRight"
            ? SECTIONS[index === last ? 0 : index + 1]
            : SECTIONS[index === 0 ? last : index - 1];
        go(next, true);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (moveFocus(e.key === "ArrowDown" ? 1 : -1)) e.preventDefault();
      }
    }

    window.addEventListener("popstate", onPopState);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("keydown", onKeyDown);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [go]);

  function handleClick(e: MouseEvent<HTMLAnchorElement>, next: Section) {
    /* Respect modifier keys so cmd/ctrl/shift-click still opens new tabs. */
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (next !== selected) go(next, true);
  }

  const pending = selected !== shown;
  const hasListing = shown !== "about";

  return (
    <>
      <nav className="home-menu" role="tablist" aria-label="Sections" data-reveal>
        {SECTIONS.map((key, i) => (
          <a
            key={key}
            id={`tab-${key}`}
            href={sectionHref(key)}
            role="tab"
            aria-selected={key === selected}
            aria-controls="home-panel"
            className="home-menu-item"
            onClick={(e) => handleClick(e, key)}
          >
            <span className="home-menu-key" aria-hidden="true">
              [{i + 1}]
            </span>
            <span className="home-menu-label">{key}</span>
          </a>
        ))}
      </nav>

      <p className="home-prompt" aria-hidden="true" data-reveal>
        <span className="home-prompt-path">~/</span>
        <span className="home-prompt-typed">{typed}</span>
        <span className="home-prompt-cursor" data-active={pending ? "true" : undefined}>
          █
        </span>
        {hasListing && !pending && <span className="home-prompt-hint">↑↓ select · ↵ open</span>}
      </p>

      <section
        ref={panelRef}
        key={shown}
        id="home-panel"
        role="tabpanel"
        aria-labelledby={`tab-${shown}`}
        className="home-panel"
        data-pending={pending ? "true" : undefined}
      >
        {panels[shown]}
      </section>
    </>
  );
}
