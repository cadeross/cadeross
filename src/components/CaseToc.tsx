"use client";

import { useEffect, useState } from "react";

type Props = {
  label: string;
  items: { id: string; heading: string }[];
};

/* Sidebar contents for a case study. Highlights the section currently
   being read: the last heading that has crossed the upper third of the
   viewport. */
export default function CaseToc({ label, items }: Props) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    function update() {
      const line = window.innerHeight / 3;
      let current = items[0]?.id;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      /* At the bottom of the page the last short sections can never reach
         the line, so treat the final one as active. */
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = items[items.length - 1]?.id;
      }
      setActive(current);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  return (
    <nav className="cs-toc" aria-label={label} data-reveal="fade">
      {items.map(({ id, heading }) => (
        <a
          key={id}
          href={`#${id}`}
          className="cs-toc-link"
          data-active={id === active ? "true" : undefined}
          aria-current={id === active ? "location" : undefined}
        >
          {heading}
        </a>
      ))}
    </nav>
  );
}
