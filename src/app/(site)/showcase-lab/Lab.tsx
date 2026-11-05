"use client";

import Showcase from "@/components/showcase/Showcase";
import type { DemoId } from "@/lib/portfolio";

export default function Lab({ demo }: { demo: string }) {
  return (
    <main style={{ maxWidth: "36.375rem", margin: "0 auto", padding: "3rem 1rem" }}>
      <Showcase media={{ type: "demo", demo: demo as DemoId, alt: demo, caption: demo }} className="lab" />
    </main>
  );
}
