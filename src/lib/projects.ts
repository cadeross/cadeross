export type ArchiveImage = {
  id: string;
  title: string;
  year: string;
  src: string;
  width: number;
  height: number;
  /* Position on the constellation canvas, in 0-1 coordinates. */
  x: number;
  y: number;
};

/* Replace `src` paths with real images dropped into /public/archive/. */
export const archiveImages: ArchiveImage[] = [
  {
    id: "openwrit-reading",
    title: "OpenWrit · Reading view",
    year: "2026",
    src: "/archive/openwrit-reading.jpg",
    width: 1600,
    height: 1000,
    x: 0.18,
    y: 0.28,
  },
  {
    id: "baylor-platform",
    title: "Baylor · Platform",
    year: "2025",
    src: "/archive/baylor-platform.jpg",
    width: 1600,
    height: 1000,
    x: 0.62,
    y: 0.18,
  },
  {
    id: "notion-calendar",
    title: "Notion Calendar · Concept",
    year: "2025",
    src: "/archive/notion-calendar.jpg",
    width: 1600,
    height: 1000,
    x: 0.36,
    y: 0.62,
  },
  {
    id: "solana-education",
    title: "Solana · Education brand",
    year: "2024",
    src: "/archive/solana-education.jpg",
    width: 1600,
    height: 1000,
    x: 0.78,
    y: 0.55,
  },
  {
    id: "the-prayer-app",
    title: "The Prayer App",
    year: "2023",
    src: "/archive/the-prayer-app.jpg",
    width: 1200,
    height: 1500,
    x: 0.12,
    y: 0.78,
  },
];
