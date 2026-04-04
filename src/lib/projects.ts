export type ProjectGroup = { category: string; projects: Project[] };

export function groupByCategory(items: Project[]): ProjectGroup[] {
  const map = new Map<string, Project[]>();
  for (const p of items) {
    if (!map.has(p.category)) map.set(p.category, []);
    map.get(p.category)!.push(p);
  }
  return Array.from(map.entries()).map(([category, projects]) => ({ category, projects }));
}

export function groupByYear(items: Project[]): { year: string; projects: Project[] }[] {
  const map = new Map<string, Project[]>();
  for (const p of items) {
    if (!map.has(p.year)) map.set(p.year, []);
    map.get(p.year)!.push(p);
  }
  return Array.from(map.entries())
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(([year, projects]) => ({ year, projects }));
}

export type Project = {
  title: string;
  category: string;
  year: string;
  slug: string;
  previewColor: string;
  previewColor2: string;
  tagline: string;
  overview: string;
  role: string;
  timeline: string;
  sections: { label: string; body: string }[];
};

export const projects: Project[] = [
  {
    title: "OpenWrit",
    category: "Open source",
    year: "2026",
    slug: "openwrit",
    previewColor: "#2d1b00",
    previewColor2: "#5c3a1e",
    tagline: "Building an open source, distractionless Bible experience",
    overview:
      "OpenWrit is a reading application for the Bible that removes everything between you and the text. No commentary, no study notes, no social features. Just the text, set beautifully, with nothing to tap or click. The project is an exploration in restraint and clarity, designed to make the interface disappear so the reading experience can take center stage.",
    role: "Designer, developer",
    timeline: "2026",
    sections: [
      {
        label: "Context",
        body: "Most Bible apps are designed to maximize engagement through streaks, social sharing, or study tooling. I wanted the opposite: a reading experience that feels closer to a physical book than to a modern app. The core question was simple: what does the interface look like when it gets out of the way?",
      },
      {
        label: "Goals",
        body: "Reduce cognitive noise, preserve reverence, and make the text feel calm and grounded. The interface should feel quiet at every touch point, with controls that appear only when needed and never compete with the content.",
      },
      {
        label: "Design system",
        body: "One typeface. One size. One color. No icons in the reading view. Pagination over scrolling. Spacing and rhythm do the heavy lifting. Image placeholder - Reading view with single typeface and no chrome.",
      },
      {
        label: "Reading experience",
        body: "The UI fades into the edges of the page, leaving the content centered and uninterrupted. Controls are minimal, predictable, and consistent across devices. Image placeholder - Pagination and subtle progress indicator.",
      },
      {
        label: "Open source",
        body: "OpenWrit is designed as an open foundation. The design system and reading engine are structured to be reusable for anyone building a similar focused reading experience. Image placeholder - Repository structure and component tokens.",
      },
      {
        label: "Outcome",
        body: "The result is a calm, text-first experience that prioritizes reading over tooling. The system is intentionally restrained so it can scale to new content and formats without losing its character.",
      },
    ],
  },
  {
    title: "Platform for Baylor University",
    category: "Client work",
    year: "2025",
    slug: "baylor-platform",
    previewColor: "#154360",
    previewColor2: "#1a5276",
    tagline: "A learning platform built for Baylor University students",
    overview:
      "A custom learning platform designed and developed for Baylor University, focused on improving the student experience for a blockchain and technology curriculum. Built through Vlyss. The platform balances course delivery, resource sharing, and progress tracking in a single, coherent experience for educators and students.",
    role: "Designer, developer",
    timeline: "2025",
    sections: [
      {
        label: "Context",
        body: "Baylor University needed a platform to deliver a new blockchain curriculum to undergraduate students. Existing LMS options were either too generic or too complex for the specific pedagogical approach the faculty had designed.",
      },
      {
        label: "Audience",
        body: "The experience needed to work for two groups: students learning complex material and educators managing content, pacing, and feedback. Clarity, structure, and low friction were non-negotiable.",
      },
      {
        label: "Experience design",
        body: "We built a focused platform from scratch - course structure, video delivery, exercises, and progress tracking - designed specifically for how this curriculum was taught rather than for how generic courses are taught. Image placeholder - Course overview and lesson structure.",
      },
      {
        label: "Platform features",
        body: "Key features include a module-based curriculum, structured assignments, a resource library for educators, and clear progress indicators for students. Image placeholder - Educator resource library and assignment flow.",
      },
      {
        label: "Delivery and testing",
        body: "The product was iterated with faculty and local educators to ensure the workflows were understandable and the interface felt supportive rather than overwhelming. Image placeholder - Testing notes and iteration snapshots.",
      },
      {
        label: "Outcome",
        body: "The platform launched with the 2025 cohort and established a scalable foundation for future curriculum expansions.",
      },
    ],
  },
  {
    title: "Redesigning Notion Calendar",
    category: "Concept",
    year: "2025",
    slug: "notion-calendar",
    previewColor: "#191919",
    previewColor2: "#2f2f2f",
    tagline: "A concept exploration of what Notion Calendar could become",
    overview:
      "A design exploration investigating how Notion Calendar could better serve people who manage both personal and professional time in the same tool. Focused on the tension between project thinking and calendar thinking, the concept asks how the product might feel if it looked and behaved like a first-class part of the Notion ecosystem.",
    role: "Designer",
    timeline: "2025",
    sections: [
      {
        label: "Problem",
        body: "Notion Calendar was acquired and rebranded rather than rebuilt in-house, which left the experience feeling disconnected from the rest of Notion. The concept explores what changes when the calendar feels native to the Notion ecosystem. Image placeholder - Current state vs. proposed direction.",
      },
      {
        label: "Design direction",
        body: "The redesign pulls from Notion's familiar structure: clean surfaces, flexible layouts, and unified navigation. The goal was to make the calendar feel like it belongs beside Notes and Mail rather than living as a separate product. Image placeholder - Main calendar view with Notion-aligned UI.",
      },
      {
        label: "Sidebar and navigation",
        body: "A single sidebar connects Notes, Calendar, and Mail, so context switching feels natural instead of fragmented. Supporting elements like AI tools and quick actions are placed within the same system. Image placeholder - Unified sidebar and navigation.",
      },
      {
        label: "Scheduling flow",
        body: "Meeting scheduling is designed to be fast and contained, with availability surfaced in-context and actions kept within one or two clicks. Image placeholder - Meeting scheduler interaction.",
      },
      {
        label: "Event details",
        body: "Event details move into a smaller windowed surface rather than a full sidebar, freeing space and creating depth while keeping linked Notion docs close at hand. Image placeholder - Event details window with linked docs.",
      },
      {
        label: "Views and customization",
        body: "The system supports multiple view modes (including 4-day and full-week) so users can tailor the calendar to their planning style. Image placeholder - 4-day and week view comparison.",
      },
      {
        label: "Outcome",
        body: "The concept defines a cohesive product direction for Notion Calendar and serves as a framework for future explorations in scheduling tools.",
      },
    ],
  },
  {
    title: "Solana's Education Brand",
    category: "Brand",
    year: "2024",
    slug: "solana-education",
    previewColor: "#9945ff",
    previewColor2: "#14f195",
    tagline: "Brand identity for Solana's developer education initiative",
    overview:
      "Visual identity and brand system for a Solana Foundation education initiative aimed at onboarding new developers to the Solana ecosystem. Built through Vlyss. The system connects Solana's technical energy with the credibility and clarity expected in academic settings.",
    role: "Designer",
    timeline: "2024",
    sections: [
      {
        label: "Brief",
        body: "The initiative needed a visual language that felt distinct from the main Solana brand while remaining clearly connected to it. The target audience was developers new to blockchain - technically sophisticated but unfamiliar with the Solana ecosystem.",
      },
      {
        label: "Research",
        body: "I reviewed Solana brand guidelines, the blockchain education landscape, and current edtech branding patterns. Early conversations helped clarify how the program should feel: serious enough for academics, exciting enough for builders. Image placeholder - Research moodboard and competitive scan.",
      },
      {
        label: "Concept exploration",
        body: "Multiple concept directions explored how to balance Solana's momentum with academic structure. Variations in type, color, and iconography were tested before narrowing the system. Image placeholder - Concept directions and typography exploration.",
      },
      {
        label: "System design",
        body: "The final system uses a restrained palette and a custom mark that can toggle between filled and stroked forms, allowing the identity to flex across contexts without losing recognition. Image placeholder - Final logo and core brand elements.",
      },
      {
        label: "Applications",
        body: "The identity was applied to digital surfaces, presentations, and marketing materials to ensure consistency across touch points. Image placeholder - Brand applications across channels.",
      },
      {
        label: "Outcome",
        body: "The rebrand rolled into Solana's education initiative and provides a clear, extensible foundation for future programs.",
      },
    ],
  },
  {
    title: "The Prayer App",
    category: "Product design",
    year: "2023",
    slug: "the-prayer-app",
    previewColor: "#0d1b2a",
    previewColor2: "#1b2a3b",
    tagline: "A quiet space for personal prayer and reflection",
    overview:
      "A mobile application designed to support a daily practice of prayer and reflection. Focuses on simplicity, calm, and making the habit of prayer as frictionless as possible. The experience is designed to feel gentle, structured, and unhurried.",
    role: "Designer, developer",
    timeline: "2023",
    sections: [
      {
        label: "Problem",
        body: "Prayer apps tend to fall into two categories: liturgical reference tools or social platforms built around sharing. I wanted something in between - personal, quiet, and focused on the practice itself.",
      },
      {
        label: "Daily rhythm",
        body: "The app is structured around a morning, afternoon, and evening cadence, with the interface subtly shifting through the day. Image placeholder - Time-of-day gradients and daily rhythm screens.",
      },
      {
        label: "Prayer player",
        body: "A dedicated player guides each session with minimal controls, a tactile dial, and gentle feedback. The experience is designed to feel guided but never rushed. Image placeholder - Prayer player with dial and controls.",
      },
      {
        label: "Collections",
        body: "Collections organize prayers by theme and tradition, giving users a quiet way to explore without overwhelming the main flow. Image placeholder - Collection navigation and prayer detail view.",
      },
      {
        label: "Practices",
        body: "Practice flows break down prayer methods into short, repeatable exercises with optional guidance. Image placeholder - Practice flow and lesson sequence.",
      },
      {
        label: "Outcome",
        body: "The result is a calm, type-led interface that supports consistent prayer without relying on aggressive reminders or social mechanics.",
      },
    ],
  },
];
