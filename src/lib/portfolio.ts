export const EMAIL = "cadeross33@gmail.com";

/* Media without a `src` renders as a labeled placeholder until the asset exists. */
export type WorkMedia = {
  type: "image" | "video";
  src?: string;
  poster?: string;
  alt: string;
};

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

export type WorkItem = {
  slug: string;
  title: string;
  year: string;
  /* One line shown under the title in the homepage list. */
  summary: string;
  description: string;
  sections: WorkSection[];
  gallery?: GalleryItem[];
  liveUrl?: string;
};

export type Exploration = {
  title: string;
  year: string;
  summary: string;
  href: string;
};

export const workItems: WorkItem[] = [
  {
    slug: "everdeck",
    title: "Everdeck",
    year: "[year]",
    summary: "A study app that turns notes into flashcards and practice exams",
    description:
      "A study app that turns notes into flashcards and practice exams, designed and built by Cade Ross.",
    liveUrl: "https://www.geteverdeck.com",
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
          type: "image",
          alt: "One set of notes producing flashcards, cloze cards and board-style questions",
        },
      },
      {
        heading: "Solution",
        paragraphs: [
          "You upload notes, slides or a PDF, and Everdeck writes flashcards, cloze cards and practice questions. Each card is scheduled with the FSRS-5 memory model, so it comes back right before you'd forget it.",
          "I wanted the first win to come before any commitment. You can try it with no account, and the first cards are ready to answer in moments while the rest of the deck is written in the background. Anki decks import whole, schedule and all, and the keyboard shortcuts match, so nothing you've built is lost.",
          "Adding an exam date moves its decks to the front of your daily review and checks whether every new card will be seen in time.",
        ],
        media: { type: "video", alt: "Upload to first card" },
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
    summary: "An intentional way to read the Bible",
    description:
      "An intentional way to read the Bible, designed and built by Cade Ross.",
    liveUrl: "https://openwrit.com",
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
        media: { type: "image", alt: "OpenWrit reading view" },
      },
      {
        heading: "Solution",
        paragraphs: [
          "I started with the page itself. The type, measure and contrast are tuned for long reading, and the interface chrome recedes while you read. Navigation is fast enough that moving between books and chapters doesn't break the flow. [One sentence on how navigation works.]",
          "Returning matters as much as reading. OpenWrit remembers where you were and puts you back there, so opening the app leads straight to the text. [One sentence on browsing or history.]",
        ],
        media: { type: "video", alt: "Moving between chapters and returning to a passage" },
      },
      {
        heading: "Details",
        paragraphs: [
          "The visual system is built on quiet contrast and generous rhythm. Most decisions were about what to leave out, and keeping the product from feeling empty once things were removed. [One or two details in Cade's words.]",
          "I built the app and its release site myself, which kept design and implementation decisions in the same place. When spacing or a transition felt off, I could change it in the product, not in a mockup.",
        ],
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
    year: "[year]",
    summary: "A macOS menu bar app for project folders and localhost servers",
    href: "https://github.com/cadeross/Harbor",
  },
  {
    title: "Spyglass",
    year: "[year]",
    summary: "A macOS menu bar app for recording your screen and camera",
    href: "https://github.com/cadeross/Spyglass",
  },
];

export function getWorkItem(slug: string) {
  return workItems.find((item) => item.slug === slug);
}

export function sectionId(heading: string) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
