export type ArchiveItem = {
  id: string;
  title: string;
  year: string;
  /* When set, render the actual media. Leave undefined to show a placeholder tile. */
  src?: string;
  /* Defaults to "image". Use "video" for .mp4/.webm; "gif" renders as a static <img>. */
  type?: "image" | "video" | "gif";
  /* Poster frame shown in the grid for video items (optional). */
  poster?: string;
};

export const archiveItems: ArchiveItem[] = [
  { id: "openwrit-reading", title: "OpenWrit · Reading view", year: "2026", src: "/images/openwrit.jpg" },
  { id: "openwrit-library", title: "OpenWrit · Library", year: "2026", src: "/images/openwrit.jpg" },
  { id: "baylor-platform", title: "Baylor · Platform", year: "2025", src: "/images/baylor.jpg" },
  { id: "baylor-marketing", title: "Baylor · Marketing site", year: "2025", src: "/images/baylor.jpg" },
  { id: "notion-calendar", title: "Notion Calendar · Concept", year: "2025" },
  { id: "solana-education", title: "Solana · Education brand", year: "2024", src: "/images/solana.jpg" },
  { id: "solana-docs", title: "Solana · Docs concept", year: "2024", src: "/images/solana.jpg" },
  { id: "vlyss-identity", title: "Vlyss · Identity", year: "2024", src: "/images/vlyss.jpg" },
  { id: "vlyss-site", title: "Vlyss · Marketing site", year: "2024", src: "/images/vlyss.jpg" },
  { id: "the-prayer-app", title: "The Prayer App", year: "2023" },
  { id: "study-typography", title: "Study · Typography", year: "2023", src: "/images/code.jpg" },
  { id: "study-grid", title: "Study · Grid system", year: "2023", src: "/images/minimal.jpg" },
  { id: "study-motion", title: "Study · Motion sketches", year: "2023", src: "/images/svg.jpg" },
  { id: "wallet-concept", title: "Wallet · Concept", year: "2023" },
  { id: "reader-app", title: "Reader · App concept", year: "2022" },
  { id: "essay-layout", title: "Essay · Layout study", year: "2022" },
  { id: "marketplace", title: "Marketplace · Concept", year: "2022" },
  { id: "dashboard-study", title: "Dashboard · Study", year: "2022" },
  { id: "icon-set", title: "Icon set · 64", year: "2022" },
  { id: "type-specimen", title: "Type · Specimen", year: "2021" },
  { id: "color-system", title: "Color · System study", year: "2021" },
  { id: "portfolio-v2", title: "Portfolio · v2", year: "2021" },
  { id: "portfolio-v1", title: "Portfolio · v1", year: "2020" },
  { id: "first-site", title: "First site", year: "2019" },
];
