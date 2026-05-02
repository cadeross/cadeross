"use client";

import { usePathname } from "next/navigation";
import ClockDial from "@/components/ClockDial";
import { projects } from "@/lib/projects";

const projectPaths = new Set(projects.map((p) => `/${p.slug}`));

export default function ClockDialGate() {
  const pathname = usePathname();
  const normalized = pathname && pathname !== "/" ? pathname.replace(/\/$/, "") : "/";

  if (normalized === "/focus") return null;
  if (normalized && projectPaths.has(normalized)) return null;
  return <ClockDial />;
}
