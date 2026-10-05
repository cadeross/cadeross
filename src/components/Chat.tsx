"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "what are you working on?",
  "what was Vlyss?",
  "why build OpenWrit?",
  "how can I reach you?",
];
const MAX_CHARS = 500;
/* Keep requests small: the last few exchanges are plenty of context. */
const HISTORY_LIMIT = 10;

/* Terminal-style chat prompt: type anywhere on the page (or tap the line
   on touch devices) and press Enter to ask. With nothing typed, Enter asks
   the dim suggested question. Answers stream in beneath as plain prose. */
export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<number | null>(null);

  const askedCount = messages.filter((m) => m.role === "user").length;
  const suggestion = SUGGESTIONS[askedCount % SUGGESTIONS.length];

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

  /* Typing anywhere on the page routes into the prompt, like a terminal. */
  useEffect(() => {
    function handle(e: globalThis.KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          /* Leave Enter/Space on focused links and buttons alone. */
          target.closest("a, button, select"))
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1 && e.key !== "Enter") return;

      const input = inputRef.current;
      if (!input) return;
      e.preventDefault();
      input.focus({ preventScroll: true });
      if (e.key === "Enter") {
        void ask();
      } else {
        setDraft((prev) => (prev + e.key).slice(0, MAX_CHARS));
        markTyping();
      }
    }

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });

  async function ask() {
    if (busy) return;
    const question = (draft.trim() || suggestion).slice(0, MAX_CHARS);
    const history: Message[] = [...messages, { role: "user", content: question }];

    setDraft("");
    setBusy(true);
    setMessages([...history, { role: "assistant", content: "" }]);

    const appendToAnswer = (text: string) =>
      setMessages((prev) => {
        const next = prev.slice();
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content + text };
        return next;
      });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: trimHistory(history) }),
      });
      if (!res.ok || !res.body) {
        appendToAnswer(
          res.status === 429
            ? await res.text()
            : "Something went wrong on my end. Try again in a moment.",
        );
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToAnswer(decoder.decode(value, { stream: true }));
      }
    } catch {
      appendToAnswer("I couldn't connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value.slice(0, MAX_CHARS));
    markTyping();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void ask();
    } else if (e.key === "Escape") {
      setDraft("");
      inputRef.current?.blur();
    }
  }

  const streaming = busy && messages[messages.length - 1]?.content === "";

  return (
    <div className="chat" data-typing={isTyping ? "true" : undefined}>
      {messages.length > 0 && (
        <div className="chat-log" aria-live="polite">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="chat-q">
                <span className="chat-prompt-mark">› </span>
                {m.content}
              </p>
            ) : (
              <p key={i} className="chat-a">
                {m.content}
                {busy && i === messages.length - 1 && (
                  <span className="chat-cursor chat-cursor--busy" aria-hidden="true">
                    █
                  </span>
                )}
              </p>
            ),
          )}
        </div>
      )}

      {!busy && (
        <p className="chat-line" onClick={() => inputRef.current?.focus()}>
          <span className="chat-prompt-mark">{messages.length ? "› " : "Ask me anything › "}</span>
          {draft ? (
            <>
              <span className="chat-typed">{draft}</span>
              <span className="chat-cursor" aria-hidden="true">█</span>
            </>
          ) : (
            <>
              <span className="chat-cursor chat-cursor--overlay" aria-hidden="true">█</span>
              <span className="chat-placeholder">{suggestion}</span>
            </>
          )}
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            value={draft}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CHARS}
            aria-label={`Ask a question about Cade. Press Enter to ask “${suggestion}”.`}
            autoComplete="off"
            enterKeyHint="send"
          />
        </p>
      )}
      {streaming && <span className="sr-only">Thinking…</span>}
    </div>
  );
}

function trimHistory(history: Message[]) {
  const recent = history.slice(-HISTORY_LIMIT);
  /* The API expects the conversation to open with a user turn. */
  return recent[0]?.role === "assistant" ? recent.slice(1) : recent;
}
