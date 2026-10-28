export const SECTIONS = ["work", "explorations", "about"] as const;
export type Section = (typeof SECTIONS)[number];

export function parseSection(value: unknown): Section {
  return SECTIONS.includes(value as Section) ? (value as Section) : "work";
}

export function sectionHref(section: Section) {
  return section === "work" ? "/" : `/?section=${section}`;
}
