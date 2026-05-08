"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

type Props = {
  className?: string;
};

const TARGET = "/archive";
const PATH_CHAR = /^[A-Za-z0-9/_\-.]$/;

function destination(typed: string) {
  return typed.startsWith("/") && typed.length > 1 ? typed : TARGET;
}

/* Interactive /archive link: type the path and press Enter to open it,
   or click as a normal link. The cursor sits at the start of the path
   and advances as matching characters are typed. Typing diverges freely
   from "/archive" — Enter navigates to whatever path the user typed. */
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
        if (typed.startsWith("/")) {
          e.preventDefault();
          router.push(typed);
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

      if (e.key.length === 1 && PATH_CHAR.test(e.key)) {
        // The first character must be `/` so the typed string stays a path.
        if (typed.length === 0 && e.key !== "/") return;
        e.preventDefault();
        setTyped((prev) => prev + e.key);
        markTyping();
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
    router.push(destination(typed));
  }

  const isPrefix = typed === TARGET.slice(0, typed.length);
  const remaining = isPrefix ? TARGET.slice(typed.length) : "";
  const href = destination(typed);

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
        <a href={href} className={className} onClick={handleClick}>
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
            href={href}
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
