# cadeross.com revamp brief

Goal: get the portfolio ready for a fully remote product design job search (January start).
Content style is modeled on https://nelson.co/ (homepage) and https://nelson.co/work/linear-26 (case study).
Fetch both pages before starting.

Notes for the session:
- This repo has uncommitted work in progress (library/bookshelf, MeshGradient). Keep it. Don't revert, delete, or restyle it.
- Keep the existing visual design. This brief is about content and structure.
- Brackets like [year] are placeholders Cade fills in. Leave them visible, don't invent values.

## 1. Positioning

- Title everywhere (homepage, metadata, About): **Product and interaction designer**
- Tone: neutral, understated, first person. No adjectives about Cade himself. Let the work speak.

## 2. Homepage (src/app/page.tsx)

Nelson-style: name, one line, nav, then lists. No intro paragraph, no per-project tag or description.

- Name: Cade Ross
- Line: Product and interaction designer, open to fully remote roles
- Nav: Work · Explorations · About
- Keep LocalTime and LibraryDoor as they are.
- Keep a small, visible email link (mailto:cade@cadeross.com) in a footer or beside the nav. Unlike nelson.co, recruiters need a fast way to reach Cade.

Work list (title + year only, newest first, each links to /work/<slug>):

| Title | Year | Route |
| --- | --- | --- |
| Everdeck | [year] | /work/everdeck (new) |
| OpenWrit | 2026 | /work/openwrit |
| Baylor University | 2025 | /work/baylor |
| Solana brand | 2024 | /work/solana (image gallery, little or no write-up) |

Explorations list (same format):

| Title | Year | Links to |
| --- | --- | --- |
| Harbor | [year] | https://github.com/cadeross/Harbor |

## 3. Case study pages (src/app/work/[slug]/page.tsx, src/lib/portfolio.ts)

Restructure the WorkItem model and page to match nelson.co/work/linear-26:
- Title (h1), then a "Get in touch" link to the About page. No role, year, or team block at the top.
- Then plain h2 sections, each 1 to 3 short paragraphs, no bullet lists in body copy.
- Media (image or looping video) sits inside the section it supports. Support `<video autoplay muted loop playsinline poster=...>` as well as images. Use clearly labeled placeholders where assets don't exist yet.
- About 450 words per study. End on something small and concrete, not a summary.
- Suggested model: `sections: { heading: string; paragraphs: string[]; media?: { type: "image" | "video"; src: string; poster?: string; alt: string } }[]` plus an optional `liveUrl`.
- Migrate the existing OpenWrit and Baylor copy into this shape (Context, Problem and opportunity, Solution, Details as fits). Rewrite in first person and trim to the style above.
- Solana: a short gallery page (3 to 6 images with one-line captions). Placeholders for now.

### Everdeck copy (use as written; brackets stay as placeholders)

**Context**
Spaced-repetition flashcards are one of the most effective ways to study, and med students and language learners live in them. But making good cards takes hours, and Anki, the tool most serious learners use, is powerful but hard to love. I started Everdeck to find out what studying could feel like if the deck wrote itself and the app was something you wanted to open every day.

**Problem and opportunity**
AI flashcard tools already existed, but their questions were shallow and didn't sound like the exams people were preparing for. Switching from Anki also meant giving up years of review history. The opportunity was a tool that writes cards worth studying, in the style of your exam, and lets you bring everything you already have.
[Image: one set of notes producing flashcards, cloze cards and board-style questions]

**Solution**
You upload notes, slides or a PDF, and Everdeck writes flashcards, cloze cards and practice questions. Each card is scheduled with the FSRS-5 memory model, so it comes back right before you'd forget it.
I wanted the first win to come before any commitment. You can try it with no account, and the first cards are ready to answer in moments while the rest of the deck is written in the background. Anki decks import whole, schedule and all, and the keyboard shortcuts match, so nothing you've built is lost.
Adding an exam date moves its decks to the front of your daily review and checks whether every new card will be seen in time.
[Video: upload to first card]

**Details**
A daily habit lives or dies on small moments, so I spent much of my time on interaction details. [2 to 3 details in Cade's words: card flip timing, the streak flame, pressing E to edit mid-review, Find labels masking a diagram.]
The landing page follows the same idea. Instead of screenshots, its demos run on the real scheduler, so visitors try the product before deciding to.
[Video: 20 to 30 second interaction reel]

**Building it**
I designed Everdeck and built it with AI tools. [Two sentences on the workflow.] Working in the real medium let me tune motion and timing in context instead of in a static mockup.

**Where it stands**
Everdeck is in public beta. [Best number or a short user quote.] Try it: https://www.geteverdeck.com

Framing rule for Everdeck: present it as a design study and a product Cade designed and built. No startup, fundraising, market-size or "building a company" language anywhere on the site.

## 4. About page (new route, /about)

All prose lives here.

> I'm a product and interaction designer. I design products end to end and build them into working software with AI tools.
>
> Right now I'm building Everdeck (https://www.geteverdeck.com), a study app that turns notes into flashcards and practice exams. Before that I launched OpenWrit (https://openwrit.com), an intentional way to read the Bible, and founded Vlyss (https://vlyss.com), a design and development studio that worked with teams like Solana and Baylor University.
>
> I'm open to fully remote design roles starting in January.
>
> Outside of design, I'm learning Portuguese, playing tennis and reading sci-fi and fantasy. Recommendations welcome.
>
> Email (cade@cadeross.com) · LinkedIn [url] · Resume [PDF link] · Telegram (https://t.me/cadeross)

Give the contact row an id of `connect` so the case-study "Get in touch" link can point to /about#connect.

## 5. Housekeeping

- Update page metadata (title, description, OG) to use the new title.
- Don't add an /archive page. An empty "Coming soon" page reads as unfinished.
- Run `npm run lint` and `npm run build` before finishing, and check every page at phone width.
- Don't commit or push. Leave changes for Cade to review.
