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
    title: "Improved Google Calendar",
    category: "Product design",
    year: "2026",
    slug: "improved-google-calendar",
    previewColor: "#1a73e8",
    previewColor2: "#0d47a1",
    tagline: "A web app designed to bring more peace to your time",
    overview:
      "A redesign of Google Calendar focused on reducing cognitive load and creating a calmer relationship with time management. The project explores how small changes to information density, typography, and interaction patterns can meaningfully reduce scheduling anxiety.",
    role: "Designer, developer",
    timeline: "2026",
    sections: [
      {
        label: "Problem",
        body: "Google Calendar surfaces everything at once — recurring meetings, personal appointments, deadlines — with equal visual weight. The result is a calendar that feels dense and urgent even when your week is light.",
      },
      {
        label: "Approach",
        body: "The redesign introduces a clear visual hierarchy that distinguishes between committed time, flexible time, and empty space. Typography, color, and layout were all tuned to reduce the sense of overwhelm without hiding important information.",
      },
      {
        label: "Outcome",
        body: "A working web prototype that demonstrates the core principles. The project informed several personal productivity habits and has been shared with a small group of early users.",
      },
    ],
  },
  {
    title: "Project Pal",
    category: "Utility",
    year: "2026",
    slug: "project-pal",
    previewColor: "#1c1c1e",
    previewColor2: "#2c2c2e",
    tagline: "A MacOS menu bar app to quickly launch your projects in Terminal",
    overview:
      "Project Pal lives in your Mac menu bar and gives you one-click access to any project directory. Open a project in Terminal, VS Code, or Finder without remembering where you put it or typing paths. Built for developers who work across many repositories.",
    role: "Designer, developer",
    timeline: "2026",
    sections: [
      {
        label: "Background",
        body: "I found myself spending a surprising amount of time navigating to project directories. The friction was small per instance, but it added up — and more importantly, it interrupted flow at the exact moment I was trying to get started.",
      },
      {
        label: "Design",
        body: "The interface needed to be fast and invisible. Clicking the menu bar icon shows a sorted list of projects. One more click opens it in the right tool. No preferences to configure, no onboarding, no chrome.",
      },
      {
        label: "Outcome",
        body: "A native SwiftUI app distributed outside the App Store. In daily use since launch.",
      },
    ],
  },
  {
    title: "OpenWrit",
    category: "Open source",
    year: "2026",
    slug: "openwrit",
    previewColor: "#2d1b00",
    previewColor2: "#5c3a1e",
    tagline: "Building an open source, distractionless Bible experience",
    overview:
      "OpenWrit is a reading application for the Bible that removes everything between you and the text. No commentary, no study notes, no social features. Just the text, set beautifully, with nothing to tap or click.",
    role: "Designer, developer",
    timeline: "2026",
    sections: [
      {
        label: "Motivation",
        body: "Most Bible apps are designed to maximize engagement — daily streaks, highlights to share, devotionals to subscribe to. I wanted the opposite: an app that disappears. Something that felt closer to reading a physical book than using software.",
      },
      {
        label: "Design principles",
        body: "One typeface. One size. One color. No icons in the reading view. Pagination over scrolling. The goal was to make every decision feel obvious in retrospect — so obvious that the design itself becomes invisible.",
      },
      {
        label: "Open source",
        body: "The project is fully open source. The design system and reading engine are available as separate packages for anyone building a similar reading experience.",
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
      "A custom learning platform designed and developed for Baylor University, focused on improving the student experience for a blockchain and technology curriculum. Built through Vlyss.",
    role: "Designer, developer",
    timeline: "2025",
    sections: [
      {
        label: "Context",
        body: "Baylor University needed a platform to deliver a new blockchain curriculum to undergraduate students. Existing LMS options were either too generic or too complex for the specific pedagogical approach the faculty had designed.",
      },
      {
        label: "Approach",
        body: "We built a focused platform from scratch — course structure, video delivery, exercises, and progress tracking — designed specifically for how this curriculum was taught rather than for how generic courses are taught.",
      },
      {
        label: "Outcome",
        body: "The platform launched with the Fall 2025 cohort. Student completion rates exceeded projections.",
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
      "A design exploration investigating how Notion Calendar could better serve people who manage both personal and professional time in the same tool. Focused on the tension between project thinking and calendar thinking.",
    role: "Designer",
    timeline: "2025",
    sections: [
      {
        label: "Starting point",
        body: "Notion Calendar inherits the block-based mental model of Notion, which creates friction when you just need to see your week and move things around. The concept explores what happens when you let the calendar be a calendar first.",
      },
      {
        label: "Explorations",
        body: "Several directions were explored: a timeline view that surfaces project dependencies alongside calendar blocks, a context-switching mode that shows only the events relevant to a given project, and a simpler daily view designed for morning planning.",
      },
      {
        label: "Reflection",
        body: "The project clarified my thinking about the difference between productivity software and scheduling software, and fed directly into the Improved Google Calendar project.",
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
      "Visual identity and brand system for a Solana Foundation education initiative aimed at onboarding new developers to the Solana ecosystem. Built through Vlyss.",
    role: "Designer",
    timeline: "2024",
    sections: [
      {
        label: "Brief",
        body: "The initiative needed a visual language that felt distinct from the main Solana brand while remaining clearly connected to it. The target audience was developers new to blockchain — technically sophisticated but unfamiliar with the Solana ecosystem.",
      },
      {
        label: "Design direction",
        body: "The system uses a reduced palette drawn from Solana's signature gradient, paired with a monospace type system that signals technical credibility. Motion and interaction patterns reinforce a sense of precision and speed.",
      },
      {
        label: "Deliverables",
        body: "Logo, color system, typography scale, icon set, presentation templates, and motion guidelines.",
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
      "A mobile application designed to support a daily practice of prayer and reflection. Focuses on simplicity, calm, and making the habit of prayer as frictionless as possible.",
    role: "Designer, developer",
    timeline: "2023",
    sections: [
      {
        label: "Motivation",
        body: "Prayer apps tend to fall into two categories: liturgical reference tools, or social platforms built around sharing. I wanted something in between — personal, quiet, and focused on the practice itself.",
      },
      {
        label: "Core features",
        body: "A journal for written prayers, a simple timer for silent prayer, reminders that feel gentle rather than urgent, and a way to revisit past entries. Nothing more.",
      },
      {
        label: "Design",
        body: "Dark mode by default. Generous whitespace. A type-led interface with no icons. The visual language was designed to signal that this is a space for slowing down.",
      },
    ],
  },
];
