"use client";

import { useSyncExternalStore } from "react";
import Field from "./Field";
import Watercolor from "./Watercolor";
import { readVersion, subscribeVersion, type Version } from "./versionStore";

/* The page's ground: the light field, the watercolor or the Monet pond,
   whichever version is showing. The server always renders the field; the watercolor's CSS
   hides it until this takes over. */
export default function Backdrop() {
  const version = useSyncExternalStore(
    subscribeVersion,
    readVersion,
    () => "light" as Version,
  );
  if (version === "light") return <Field />;
  // Keyed so switching between the two paintings starts a fresh sheet.
  return <Watercolor key={version} mode={version === "monet" ? "scene" : "wash"} />;
}
