import { VERSION_KEY } from "./layoutScript";

/* Which version of the site is showing. It lives on <html data-version>,
   set before paint by layoutScript, so either loads without a flash; this
   is the React side of it. */

export type Version = "light" | "watercolor" | "monet";

const listeners = new Set<() => void>();

export function readVersion(): Version {
  const v = document.documentElement.dataset.version;
  return v === "watercolor" || v === "monet" ? v : "light";
}

export function subscribeVersion(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setVersion(v: Version) {
  const root = document.documentElement;
  if (v === "light") {
    delete root.dataset.version;
    delete root.dataset.paint;
  } else {
    root.dataset.version = v;
    // Both painted versions share the paper and the serifs.
    root.dataset.paint = "";
  }
  try {
    localStorage.setItem(VERSION_KEY, v);
  } catch {}
  listeners.forEach((fn) => fn());
}
