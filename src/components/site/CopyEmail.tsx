"use client";

import { useEffect, useRef, useState } from "react";
import { rippleFrom } from "./fieldStore";

/* The contact line: the address written out on a rule, a mailto on the
   text and a copy button at the end. Copying morphs the icon into a tick
   and a small ink tag says so, then both quietly reset. */
export default function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    rippleFrom(e.currentTarget, 1.6);
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const area = document.createElement("textarea");
      area.value = email;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="copy-email" data-copied={copied || undefined}>
      <a href={`mailto:${email}`} className="copy-email-address">
        {email}
      </a>
      <button type="button" className="copy-email-button" onClick={copy} aria-label={`Copy ${email}`}>
        <svg className="copy-icon copy-icon-copy" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
          <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
        </svg>
        <svg className="copy-icon copy-icon-tick" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9.25" />
          <path d="M8 12.5L10.5 15L16 9" />
        </svg>
      </button>
      <span className="copy-email-tag" aria-hidden="true">
        Copied to clipboard
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}
