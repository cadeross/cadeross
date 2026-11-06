"use client";

import { useEffect, useRef, useState } from "react";
import { rippleFrom } from "./fieldStore";
import Signature from "./Signature";

/* How the homepage ends in handwritten mode: like a letter. An invitation
   to write back with the address in it (and a small "copy" beside it), a
   closing, the signature, and the bit about life outside design as a
   postscript. Typeset mode keeps the "Say hello" block instead. */
export default function LetterClose({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    rippleFrom(e.currentTarget, 1.2);
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
    <section
      className="block letter-close"
      data-hand-only
      aria-label="Sign-off"
      data-tick="Contact"
    >
      <p className="sign-off" data-reveal>
        If you&apos;d like to talk, write to me anytime at{" "}
        <a href={`mailto:${email}`} className="link letter-email">
          {email}
        </a>
        <button
          type="button"
          className="letter-copy"
          onClick={copy}
          data-copied={copied || undefined}
          aria-label={copied ? "Copied" : `Copy ${email}`}
        >
          <span aria-hidden="true">{copied ? "copied" : "copy"}</span>
        </button>
      </p>
      <p className="valediction" data-reveal>
        Warmly,
      </p>
      <Signature name="Cade" />
      <p className="ps" data-reveal>
        <span className="ps-mark">P.S.</span> Outside of design, I&apos;m learning
        Portuguese, playing tennis and reading sci-fi and fantasy.
        Recommendations welcome.
      </p>
    </section>
  );
}
