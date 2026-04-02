"use client";
import { useEffect, useState } from "react";

type TocItem = { label: string; id: string };

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-30% 0px -65% 0px" }
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="cs-toc">
      {items.map(({ label, id }) => (
        <a
          key={id}
          href={`#${id}`}
          className="cs-toc-link"
          data-active={activeId === id ? "true" : "false"}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
