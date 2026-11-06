"use client";

import { useEffect } from "react";
import { rippleFrom, setVoice } from "./fieldStore";
import type { PaletteKey } from "./palettes";

/* Sets the palette a page speaks in. Rendered once per page; the painting
   crosses to it as the page arrives. */
export function FieldPage({ palette }: { palette: PaletteKey }) {
  useEffect(() => {
    setVoice("page", palette);
    setVoice("hover", null);
  }, [palette]);
  return null;
}

/* Any link that previews its project's colour on hover or focus. */
export function FieldHover({
  palette,
  children,
  className,
  reveal,
}: {
  palette: PaletteKey;
  children: React.ReactNode;
  className?: string;
  reveal?: boolean;
}) {
  const on = (el: Element) => {
    setVoice("hover", palette);
    rippleFrom(el, 0.8);
  };
  const off = () => setVoice("hover", null);
  return (
    <div
      className={className}
      data-reveal={reveal || undefined}
      onPointerEnter={(e) => e.pointerType === "mouse" && on(e.currentTarget)}
      onPointerLeave={off}
      onFocus={(e) => on(e.currentTarget)}
      onBlur={off}
    >
      {children}
    </div>
  );
}
