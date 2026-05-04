"use client";

import { useEffect, useState } from "react";

/* Tail of the fade-out keyframe (1.28s + 220ms). When this fires we
   clear html[data-booting], which un-pauses every entrance animation
   so each runs its own declared delay from this moment on. */
const BOOT_LIFETIME_MS = 1500;

/* Renders the entrance "start█" sequence as an overlay above the page.
   The <html data-booting="true"> attribute is set in the layout so the
   pause is active before paint; this component clears it once the boot
   animation has finished. */
export default function BootSequence() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.removeAttribute("data-booting");
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => {
      document.documentElement.removeAttribute("data-booting");
      setVisible(false);
    }, BOOT_LIFETIME_MS);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="boot-sequence" aria-hidden="true">
      <div className="boot-sequence-inner">
        <p className="boot-sequence-line">
          <span className="boot-sequence-text">start</span>
          <span className="boot-sequence-cursor">█</span>
        </p>
      </div>
    </div>
  );
}
