"use client";

import { usePathname } from "next/navigation";
import ClockDial from "@/components/ClockDial";

const HIDDEN_PATHS = new Set(["/focus", "/archive"]);

export default function ClockDialGate() {
  const pathname = usePathname();
  const normalized =
    pathname && pathname !== "/" ? pathname.replace(/\/$/, "") : "/";

  if (HIDDEN_PATHS.has(normalized)) return null;
  return <ClockDial />;
}
