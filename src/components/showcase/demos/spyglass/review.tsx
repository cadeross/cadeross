"use client";

import { Copy, Folder, Scissors, Trash2 } from "lucide-react";
import { RecordedPage } from "./parts";

// ReviewWindow: a 760×520 window with a transparent title bar over the
// player, and a bar under it (14pt in): the name in a glass capsule, a status
// in the tint, Trim, Copy, Show in Finder and Delete in glass, Done in blue.
// Drawn at the scale of the desktop around it.

export function ReviewWindow({
  show,
  status,
  trimming,
  children,
}: {
  show: boolean;
  status?: string | null;
  trimming?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="sg-review" data-show={show || undefined}>
      <div className="sg-review__player">
        <span className="sg-review__lights" aria-hidden>
          <i data-target="close" />
          <i />
          <i />
        </span>
        <div className="sg-review__frame">
          <RecordedPage />
        </div>
        <span className="sg-review__bubble" />
        {children}
      </div>
      <div className="sg-review__bar">
        <span className="sg-review__name">Spyglass 2026-10-31 at 09.41</span>
        <span className="sg-review__status" data-show={status ? true : undefined}>
          {status}
        </span>
        {trimming}
        <span className="sg-review__group">
          <span className="mac-glass-btn sg-review__btn" data-target="trim" data-cursor="pointer">
            <Scissors size={11} strokeWidth={2.5} aria-hidden />
            Trim
          </span>
          <span className="mac-glass-btn sg-review__btn">
            <Copy size={11} strokeWidth={2.5} aria-hidden />
            Copy
          </span>
          <span className="mac-glass-btn sg-review__icon">
            <Folder size={11} strokeWidth={2.5} aria-hidden />
          </span>
          <span className="mac-glass-btn sg-review__icon sg-review__trash">
            <Trash2 size={11} strokeWidth={2.5} aria-hidden />
          </span>
        </span>
        <span className="sg-review__done" data-target="done" data-cursor="pointer">
          Done
        </span>
      </div>
    </div>
  );
}
