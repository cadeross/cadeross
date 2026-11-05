"use client";

import { useEffect, useRef } from "react";
import { BookPlus, ChevronDown, MessageSquarePlus, Pilcrow, User } from "lucide-react";
import { highlight, type MarkHandle } from "@highlighters/core";

// OpenWrit's reader in the sepia theme, from reading-toolbar, picker-parts
// and the reading page: the top bar (account, Bible / Catechism, chat), the
// three glass pills, the chapter in Geist Serif at 18/28.8, verse numbers
// raised in mono at 0.6em.

export const GENESIS: Record<number, [number, string][]> = {
  1: [
    [1, "In the beginning when God created the heavens and the earth,"],
    [2, "the earth was a formless void and darkness covered the face of the deep, while a wind from God swept over the face of the waters."],
    [3, "Then God said, “Let there be light”; and there was light."],
    [4, "And God saw that the light was good; and God separated the light from the darkness."],
    [5, "God called the light Day, and the darkness he called Night. And there was evening and there was morning, the first day."],
    [6, "And God said, “Let there be a dome in the midst of the waters, and let it separate the waters from the waters.”"],
    [7, "So God made the dome and separated the waters that were under the dome from the waters that were above the dome. And it was so."],
  ],
  2: [
    [1, "Thus the heavens and the earth were finished, and all their multitude."],
    [2, "And on the seventh day God finished the work that he had done, and he rested on the seventh day from all the work that he had done."],
    [3, "So God blessed the seventh day and hallowed it, because on it God rested from all the work that he had done in creation."],
    [4, "These are the generations of the heavens and the earth when they were created. In the day that the Lord God made the earth and the heavens,"],
    [5, "when no plant of the field was yet in the earth and no herb of the field had yet sprung up—"],
    [6, "but a stream would rise from the earth, and water the whole face of the ground—"],
  ],
};

export function TopBar() {
  return (
    <div className="ow-top">
      <span className="ow-round ow-glass" aria-hidden>
        <User size={15} strokeWidth={1.75} />
      </span>
      <span className="ow-seg ow-glass">
        <span className="ow-seg__item" data-on="true">
          <BookPlus size={13} strokeWidth={2} aria-hidden />
          Bible
        </span>
        <span className="ow-seg__item">
          <Pilcrow size={13} strokeWidth={2} aria-hidden />
          Catechism
        </span>
      </span>
      <span className="ow-round ow-glass" aria-hidden>
        <MessageSquarePlus size={15} strokeWidth={1.75} />
      </span>
    </div>
  );
}

export function Pill({ children, target, open }: { children: React.ReactNode; target?: string; open?: boolean }) {
  return (
    <span className="ow-pill" data-target={target} data-cursor={target ? "pointer" : undefined} data-open={open || undefined}>
      {children}
      <ChevronDown size={14} strokeWidth={2} className="ow-pill__chev" aria-hidden />
    </span>
  );
}

const MARKER = {
  color: "#FFD772",
  opacity: 0.85,
  blendMode: "normal" as const,
  tip: { angle: 4, overshoot: 3, angleJitter: 1.2 },
  seed: 31,
  animation: { duration: 600, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
};

/** A real marker stroke under a verse (the app's own library and ink, lib/ink.ts),
 * drawn on when `on` turns true and faded away when it turns false. */
export function useMarker(el: HTMLElement | null, on: boolean) {
  const handle = useRef<MarkHandle | null>(null);
  useEffect(() => {
    if (!el) return;
    if (on && !handle.current) {
      const host = el.closest<HTMLElement>(".ow-text") ?? undefined;
      handle.current = highlight(el, MARKER, host);
    }
    if (!on && handle.current) {
      const h = handle.current;
      handle.current = null;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 450);
        h.update({ opacity: MARKER.opacity * (1 - t * t * (3 - 2 * t)) });
        if (t < 1) requestAnimationFrame(step);
        else h.remove();
      };
      requestAnimationFrame(step);
    }
  }, [el, on]);
  useEffect(() => () => handle.current?.remove(), []);
}
