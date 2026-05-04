"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  className?: string;
};

const TARGET = "/archive";

/* Interactive /archive link: type the path and press Enter to open it,
   or click as a normal link. The cursor sits at the start of the path
   and advances as matching characters are typed. */
export default function ArchiveLink({ className }: Props) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  function markTyping() {
    setIsTyping(true);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      setIsTyping(false);
      typingTimerRef.current = null;
    }, 500);
  }

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Enter") {
        if (typed === TARGET) {
          e.preventDefault();
          router.push("/archive");
        }
        return;
      }

      if (e.key === "Backspace") {
        if (typed.length === 0) return;
        e.preventDefault();
        setTyped((prev) => prev.slice(0, -1));
        markTyping();
        return;
      }

      if (e.key === "Escape") {
        if (typed.length === 0) return;
        e.preventDefault();
        setTyped("");
        markTyping();
        return;
      }

      if (e.key.length === 1) {
        const next = TARGET[typed.length];
        if (next && e.key === next) {
          e.preventDefault();
          setTyped((prev) => prev + e.key);
          markTyping();
        }
      }
    }

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [typed, router]);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    /* Respect modifier keys so cmd/ctrl/shift-click still opens new tabs. */
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0) return;
    e.preventDefault();
    router.push("/archive");
  }

  const remaining = TARGET.slice(typed.length);

  /* The cursor sits in the same column as the next character to be typed
     (overlay variant: 0-width with overflowing glyph), kept as a sibling of
     the placeholder so it stays out of the link's underline and isn't dimmed
     by the placeholder's opacity. When fully typed it trails the text as a
     normal blinking caret. */
  return (
    <span
      className="archive-link-wrap"
      data-typing={isTyping ? "true" : undefined}
    >
      {typed && (
        <a href="/archive" className={className} onClick={handleClick}>
          {typed}
        </a>
      )}
      {remaining ? (
        <>
          <span
            className="archive-cursor archive-cursor--overlay"
            aria-hidden="true"
          >
            █
          </span>
          <a
            href="/archive"
            className={`${className ?? ""} archive-placeholder`.trim()}
            onClick={handleClick}
          >
            {remaining}
          </a>
        </>
      ) : (
        <span
          className="archive-cursor archive-cursor--end"
          aria-hidden="true"
        >
          █
        </span>
      )}
    </span>
  );
}
