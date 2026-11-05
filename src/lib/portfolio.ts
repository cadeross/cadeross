import type { PaletteKey } from "@/components/site/palettes";

export const EMAIL = "cade@cadeross.com";

/* Live Stageshow scenes, registered in src/components/showcase/Showcase.tsx. */
export type DemoId =
  | "everdeck-review"
  | "everdeck-generate"
  | "everdeck-import"
  | "openwrit-highlight"
  | "openwrit-chapters"
  | "harbor-servers"
  | "harbor-awake"
  | "spyglass-record"
  | "spyglass-review";

/* One figure on a project page. Images and videos without a `src` render as a
   labeled placeholder until the asset exists; a demo is a live scene. The
   caption sits under the plate, beside the speed switch. */
export type WorkMedia =
  | { type: "image"; src?: string; width?: number; height?: number; alt: string; caption?: string }
  | { type: "video"; src?: string; poster?: string; alt: string; caption?: string }
  | { type: "demo"; demo: DemoId; alt: string; caption?: string };

export type WorkSection = {
  heading: string;
  paragraphs: string[];
  media?: WorkMedia;
};

export type GalleryItem = {
  src?: string;
  alt: string;
  caption: string;
};

/* The small picture beside a project in the homepage lists: the product's
   own screenshot set on its palette. Without one, the tile is the palette
   and the project's initial. */
export type Thumb = { src: string; width: number; height: number };

export type WorkItem = {
  slug: string;
  title: string;
  year: string;
  /* The field's colour on this project's row and page. */
  palette: PaletteKey;
  /* Two sentences for the homepage row. */
  blurb: string;
  thumb?: Thumb;
  /* One line shown under the title in the homepage list. */
  summary: string;
  description: string;
  /* The figure under the title, before the first section. */
  hero?: WorkMedia;
  sections: WorkSection[];
  gallery?: GalleryItem[];
  liveUrl?: string;
};

export type Exploration = {
  title: string;
  year: string;
  summary: string;
  href: string;
  palette: PaletteKey;
  blurb: string;
  thumb?: Thumb;
};

export const workItems: WorkItem[] = [
  {
    slug: "everdeck",
    title: "Everdeck",
    year: "[year]",
    palette: "everdeck",
    blurb:
      "A study app that turns notes, slides and PDFs into flashcards and practice exams. Each card comes back right before you'd forget it.",
    thumb: { src: "/media/everdeck/home.jpg", width: 1400, height: 1400 },
    summary: "A study app that turns notes into flashcards and practice exams",
    description:
      "A study app that turns notes into flashcards and practice exams, designed and built by Cade Ross.",
    liveUrl: "https://www.geteverdeck.com",
    hero: {
      type: "demo",
      demo: "everdeck-review",
      alt: "A study card in Everdeck: the answer is revealed, rated Good and scheduled three days out, then a cloze card is answered from the keyboard",
      caption: "Reviewing two cards, one by mouse and one by keyboard.",
    },
    sections: [
      {
        heading: "Context",
        paragraphs: [
          "Spaced-repetition flashcards are one of the most effective ways to study, and med students and language learners live in them. But making good cards takes hours, and Anki, the tool most serious learners use, is powerful but hard to love. I started Everdeck to find out what studying could feel like if the deck wrote itself and the app was something you wanted to open every day.",
        ],
      },
      {
        heading: "Problem and opportunity",
        paragraphs: [
          "AI flashcard tools already existed, but their questions were shallow and didn't sound like the exams people were preparing for. Switching from Anki also meant giving up years of review history. The opportunity was a tool that writes cards worth studying, in the style of your exam, and lets you bring everything you already have.",
        ],
        media: {
          type: "demo",
          demo: "everdeck-generate",
          alt: "A lecture PDF turning into flashcards, cloze cards and board-style questions, one after another",
          caption: "One set of notes, three kinds of card.",
        },
      },
      {
        heading: "Solution",
        paragraphs: [
          "You upload notes, slides or a PDF, and Everdeck writes flashcards, cloze cards and practice questions. Each card is scheduled with the FSRS-5 memory model, so it comes back right before you'd forget it.",
          "I wanted the first win to come before any commitment. You can try it with no account, and the first cards are ready to answer in moments while the rest of the deck is written in the background. Anki decks import whole, schedule and all, and the keyboard shortcuts match, so nothing you've built is lost.",
        ],
        media: {
          type: "demo",
          demo: "everdeck-import",
          alt: "An Anki package dropped on Everdeck's import page, and the preview of what comes across: cards and notes, decks, media, schedule and review history",
          caption: "An Anki deck comes across whole: schedule, media and every past review.",
        },
      },
      {
        heading: "Today and exams",
        paragraphs: [
          "Home opens on the next card, how many are due and about how long they'll take, then the Daily Review: each deck in turn, ticked off as it's done.",
          "Adding an exam date moves its decks to the front of your daily review and checks whether every new card will be seen in time.",
        ],
        media: {
          type: "image",
          src: "/media/everdeck/home.jpg",
          width: 1400,
          height: 1400,
          alt: "Everdeck's Home: the next card, 155 cards due in about 15 minutes, an upcoming exam and the Daily Review path through four decks",
          caption: "Home, with an exam six days out.",
        },
      },
      {
        heading: "Details",
        paragraphs: [
          "A daily habit lives or dies on small moments, so I spent much of my time on interaction details. [2 to 3 details in Cade's words: card flip timing, the streak flame, pressing E to edit mid-review, Find labels masking a diagram.]",
          "The landing page follows the same idea. Instead of screenshots, its demos run on the real scheduler, so visitors try the product before deciding to.",
        ],
        media: { type: "video", alt: "20 to 30 second interaction reel" },
      },
      {
        heading: "Building it",
        paragraphs: [
          "I designed Everdeck and built it with AI tools. [Two sentences on the workflow.] Working in the real medium let me tune motion and timing in context instead of in a static mockup.",
        ],
      },
      {
        heading: "Where it stands",
        paragraphs: [
          "Everdeck is in public beta. [Best number or a short user quote.] Try it: https://www.geteverdeck.com",
        ],
      },
    ],
  },
  {
    slug: "openwrit",
    title: "OpenWrit",
    year: "2026",
    palette: "openwrit",
    blurb:
      "An intentional way to read the Bible. A quiet reading surface with the day's readings, highlights and the Catechism beside it.",
    thumb: { src: "/media/openwrit/reader.jpg", width: 1330, height: 1400 },
    summary: "An intentional way to read the Bible",
    description:
      "An intentional way to read the Bible, designed and built by Cade Ross.",
    liveUrl: "https://openwrit.com",
    hero: {
      type: "demo",
      demo: "openwrit-highlight",
      alt: "Genesis 1 in OpenWrit's sepia theme: a verse is clicked, highlighted yellow from the color menu, then cleared the same way",
      caption: "Highlighting a verse, then clearing it from the same menu.",
    },
    sections: [
      {
        heading: "Context",
        paragraphs: [
          "OpenWrit is an intentional way to read the Bible. I designed it, built it and launched it on my own, and it's the clearest example of the kind of software I want to make: useful, restrained and paced for attention rather than engagement.",
        ],
      },
      {
        heading: "Problem and opportunity",
        paragraphs: [
          "Most Bible apps are crowded. Plans, streaks, devotionals and notifications compete with the text, and reading becomes something you get through rather than something you sit with. [One sentence on what prompted the project.]",
          "The opportunity was a reading surface that stays out of the way, with just enough structure to find your place and come back to it.",
        ],
        media: {
          type: "image",
          src: "/media/openwrit/reader.jpg",
          width: 1330,
          height: 1400,
          alt: "Genesis 1 in OpenWrit's sepia reader: the book, chapter and translation pills over the chapter in a serif",
          caption: "The reader: three pills and the text.",
        },
      },
      {
        heading: "Solution",
        paragraphs: [
          "I started with the page itself. The type, measure and contrast are tuned for long reading, and the interface chrome recedes while you read. Navigation is fast enough that moving between books and chapters doesn't break the flow. [One sentence on how navigation works.]",
          "Returning matters as much as reading. OpenWrit remembers where you were and puts you back there, so opening the app leads straight to the text. [One sentence on browsing or history.]",
        ],
        media: {
          type: "video",
          src: "/media/openwrit/reading.mp4",
          poster: "/media/openwrit/reading.jpg",
          alt: "Moving between chapters, picking a book and switching translations in OpenWrit, with highlights following each verse",
          caption: "Books, chapters and translations, and highlights that follow the verse.",
        },
      },
      {
        heading: "Daily readings",
        paragraphs: [
          "Each day opens on its Mass readings, under the date, the day's place in the liturgical year and its season. The first reading, the psalm and the gospel sit a tap apart.",
          "The Catechism has a reader of its own beside the Bible, with the same type and the same pills, so moving between the two never changes how reading feels.",
        ],
        media: {
          type: "image",
          src: "/media/openwrit/daily.jpg",
          width: 1330,
          height: 1400,
          alt: "OpenWrit's daily readings for Saturday of the Thirtieth Week in Ordinary Time, with Reading I, Psalm and Gospel tabs",
          caption: "Today's readings, with the season and year above them.",
        },
      },
      {
        heading: "Details",
        paragraphs: [
          "The visual system is built on quiet contrast and generous rhythm. Most decisions were about what to leave out, and keeping the product from feeling empty once things were removed. [One or two details in Cade's words.]",
          "I built the app and its release site myself, which kept design and implementation decisions in the same place. When spacing or a transition felt off, I could change it in the product, not in a mockup.",
        ],
        media: {
          type: "demo",
          demo: "openwrit-chapters",
          alt: "OpenWrit's chapter pill opening a grid of Genesis's 50 chapters: chapter 2 is clicked, then 1 is typed to come back",
          caption: "Click a chapter, or type its number and press Enter.",
        },
      },
      {
        heading: "Where it stands",
        paragraphs: [
          "OpenWrit is live at https://openwrit.com. [One concrete detail: a reader's note, a number, or what's next.]",
        ],
      },
    ],
  },
  {
    slug: "baylor",
    title: "Baylor University",
    year: "2025",
    palette: "baylor",
    blurb:
      "Platform and web design for education initiatives, through Vlyss. Page patterns built to stay clear as the content changes.",
    summary: "Platform and web design for education initiatives",
    description:
      "Platform and web design for education initiatives at Baylor University, by Cade Ross.",
    liveUrl: "https://baylor.edu",
    sections: [
      {
        heading: "Context",
        paragraphs: [
          "I worked with Baylor University through Vlyss, my design and development studio, on platform and web design for education-focused initiatives. [One sentence on the team and scope.]",
        ],
      },
      {
        heading: "Problem and opportunity",
        paragraphs: [
          "The work sat between institutional communication and software usability. Audiences needed to scan dense information, trust what they were reading and know what to do next, and each initiative had its own goals and stakeholders. [One sentence on the specific problem.]",
          "Clarity mattered more than visual novelty here, so the opportunity was structure: page patterns that hold up as content changes and stay readable for people who aren't looking to be impressed.",
        ],
        media: { type: "image", alt: "Baylor page structure and content hierarchy" },
      },
      {
        heading: "Solution",
        paragraphs: [
          "I explored product flows and page structures for each initiative, then designed layouts around clear hierarchy and repeatable content patterns. Those patterns let new pages follow the same logic without starting from scratch. [One sentence on what shipped.]",
          "Much of the work was translation: turning institutional goals into pages a student or family could act on quickly.",
        ],
        media: { type: "image", alt: "Baylor layouts across screen sizes" },
      },
      {
        heading: "Details",
        paragraphs: [
          "[One or two specific design decisions in Cade's words.]",
          "[End on one small, concrete detail: a pattern still in use, or a page that changed how people found something.]",
        ],
      },
    ],
  },
  {
    slug: "solana",
    title: "Solana brand",
    year: "2024",
    palette: "solana",
    blurb: "Brand design with the Solana team, through Vlyss.",
    summary: "Brand design with the Solana team, through Vlyss",
    description: "Brand work for Solana by Cade Ross.",
    liveUrl: "https://solana.com",
    sections: [],
    gallery: [
      { alt: "Solana brand image 1", caption: "[One-line caption]" },
      { alt: "Solana brand image 2", caption: "[One-line caption]" },
      { alt: "Solana brand image 3", caption: "[One-line caption]" },
      { alt: "Solana brand image 4", caption: "[One-line caption]" },
    ],
  },
];

export const explorations: Exploration[] = [
  {
    title: "Harbor",
    year: "2026",
    summary: "A macOS menu bar app for project folders and localhost servers",
    href: "/harbor",
    palette: "harbor",
    blurb: "A menu bar app for macOS that keeps project folders close and localhost servers in check. Free and open source.",
    thumb: { src: "/apps/harbor.png", width: 456, height: 597 },
  },
  {
    title: "Spyglass",
    year: "2026",
    summary: "A macOS menu bar app for recording your screen and camera",
    href: "/spyglass",
    palette: "spyglass",
    blurb: "A menu bar app for macOS that records your screen and camera, then puts the video on your clipboard.",
    thumb: { src: "/apps/spyglass.png", width: 456, height: 780 },
  },
];

/* Showcase pages for the Mac apps, at /harbor and /spyglass. Downloads point at
   each repo's latest release, so the asset must keep the name `<Title>.zip`. */
export type AppShowcase = {
  slug: string;
  title: string;
  palette: PaletteKey;
  tagline: string;
  description: string;
  repo: string;
  download: string;
  /* Used by the Open Graph image; the page shows it in a section's figure. */
  screenshot: { src: string; width: number; height: number; alt: string };
  hero?: WorkMedia;
  sections: WorkSection[];
  /* Extra install step after the Gatekeeper one, if the app needs it. */
  firstRun?: string;
};

function githubApp(title: string) {
  const repo = `https://github.com/cadeross/${title}`;
  return { repo, download: `${repo}/releases/latest/download/${title}.zip` };
}

export const apps: AppShowcase[] = [
  {
    slug: "harbor",
    title: "Harbor",
    palette: "harbor",
    ...githubApp("Harbor"),
    tagline:
      "A menu bar app for macOS that keeps your project folders close and your localhost servers in check.",
    description:
      "Harbor is a free, open source menu bar app for macOS that keeps your project folders close and your localhost servers in check.",
    screenshot: {
      src: "/apps/harbor.png",
      width: 456,
      height: 597,
      alt: "The Harbor panel with four pinned folders, two of them running localhost servers",
    },
    hero: {
      type: "demo",
      demo: "harbor-servers",
      alt: "Harbor's menu bar panel: a localhost server is stopped from the panel, then started again from the terminal and picked up on its own",
      caption: "Stop a server from the menu bar. Start it again and Harbor finds it.",
    },
    sections: [
      {
        heading: "What it does",
        paragraphs: [
          "Pin the folders you work in and copy their full path with one click. Harbor spots the dev servers listening on localhost, matches each one to its project, and lets you stop it from the menu bar instead of hunting for the right terminal tab.",
          "Open any folder in Finder, your editor (Cursor, Zed or VS Code) or your terminal (Ghostty, iTerm, Warp or Terminal). The menu bar icon shows how many servers are running, and the panel notices servers outside your pinned folders too.",
        ],
        media: {
          type: "image",
          src: "/apps/harbor.png",
          width: 456,
          height: 597,
          alt: "The Harbor panel with four pinned folders, two of them running localhost servers",
          caption: "The panel, with servers outside your pinned folders listed below.",
        },
      },
      {
        heading: "Keep your Mac awake",
        paragraphs: [
          "One switch keeps your Mac awake with the lid open or closed, so long-running work like agents, builds and downloads carries on while you're away. Nothing needs admin rights, and everything is released when you switch it off or quit.",
        ],
        media: {
          type: "demo",
          demo: "harbor-awake",
          alt: "Harbor's Keep Mac awake row switched on and off: the moon becomes binoculars, the row turns orange and a watch phrase rolls in",
          caption: "On, the Mac stays awake with the lid open or closed. Off, it sleeps as usual.",
        },
      },
      {
        heading: "How it's built",
        paragraphs: [
          "Harbor is native SwiftUI with the macOS Liquid Glass APIs and no dependencies. It finds listening ports with lsof and reads each process's working directory to match servers to folders. The source is on GitHub under the MIT license.",
        ],
      },
    ],
  },
  {
    slug: "spyglass",
    title: "Spyglass",
    palette: "spyglass",
    ...githubApp("Spyglass"),
    tagline:
      "A menu bar app for macOS that records your screen and your face, then puts the video straight on your clipboard.",
    description:
      "Spyglass is a free, open source screen recorder for the macOS menu bar. Record your screen and camera, and the video lands on your clipboard.",
    screenshot: {
      src: "/apps/spyglass.png",
      width: 456,
      height: 780,
      alt: "The Spyglass panel set to record the screen with the camera, above four recent recordings",
    },
    hero: {
      type: "demo",
      demo: "spyglass-record",
      alt: "Spyglass records the screen with a camera bubble: a 3-2-1 countdown, a floating control pill, then the video is saved and copied to the clipboard",
      caption: "Start, count down, record, stop. The video is already on your clipboard.",
    },
    firstRun:
      "The first time you record, macOS asks for Screen Recording, Camera and Microphone access.",
    sections: [
      {
        heading: "What it does",
        paragraphs: [
          "Record your screen with a round camera bubble, the screen alone, or just the camera. Capture a full display, a single window, or an area you drag out, with your microphone and your Mac's sound mixed into one track.",
          "Press ⌘⇧L to start. A 3-2-1 countdown gives you a moment, and a floating control pill lets you stop, start over or discard. The pill stays out of the video; the camera bubble is recorded right where it sits.",
        ],
        media: {
          type: "image",
          src: "/apps/spyglass.png",
          width: 456,
          height: 780,
          alt: "The Spyglass panel set to record the screen with the camera, above four recent recordings",
          caption: "The panel: what to record, which devices, and your recent videos.",
        },
      },
      {
        heading: "When you stop",
        paragraphs: [
          "The video is saved to your Movies folder and copied to your clipboard, ready to paste into Slack, Mail or Messages. A review window opens so you can trim the ends, rename it or share it. Nothing is uploaded anywhere.",
        ],
        media: {
          type: "demo",
          demo: "spyglass-review",
          alt: "Spyglass's review window: both ends of the recording are trimmed in the trim bar, and the shorter video is saved and copied again",
          caption: "Trim the ends and the shorter video replaces the copy on your clipboard.",
        },
      },
      {
        heading: "How it's built",
        paragraphs: [
          "Spyglass is native SwiftUI with ScreenCaptureKit, AVFoundation and the macOS Liquid Glass APIs, and no dependencies. Recordings are H.264 for playback anywhere or HEVC at native resolution. The source is on GitHub under the MIT license.",
        ],
      },
    ],
  },
];

export function getApp(slug: string) {
  const app = apps.find((item) => item.slug === slug);
  if (!app) throw new Error(`Unknown app: ${slug}`);
  return app;
}

export function getWorkItem(slug: string) {
  return workItems.find((item) => item.slug === slug);
}

export function sectionId(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
