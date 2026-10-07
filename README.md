# Rapid_Reference

> Learn faster. Revise smarter.

**Live site: https://rahul9994.github.io/Rapid-Reference/**

A fast, keyboard-first revision site for **Python, DSA (in Python), Operating Systems, DBMS, Computer Networks** and **technical interviews** — with the complete **Striver's A2Z DSA Sheet** as a progress tracker.

## Features

- **Landing page** — animated hero (graph-constellation canvas, floating code/terminal/BST/SQL cards, letter-reveal headline), first-visit boot animation, scroll-triggered sections.
- **12 themes** — Dark, Light, Midnight, Cyberpunk, Aurora, AMOLED, Dracula, Ocean, Forest, Sunset, Nord, Sepia (+ System). Live mini-previews, circular reveal transition, saved in `localStorage`, applied before first paint.
- **Notes** — 109 topics (Python 27 · DSA 28 · OS 17 · DBMS 18 · CN 19) with sidebar topic tree, filter, breadcrumbs, scroll-spy table of contents, collapsible sections, copy-code buttons, callouts (tips / common mistakes / interview notes / remember this), reading progress, prev/next (`[` `]`), bookmarks and recently viewed.
- **DSA SHEET** — 495 items (452 problems + 43 lessons) across 20 sections in the original A2Z order. Search, section / difficulty / status filters, sorting, progress ring, difficulty + topic-wise progress, confetti on finishing a section, random unsolved problem, export / import / reset progress (with undo).
- **FAQ** — 134 interview questions in 8 categories with animated *Reveal Answer / Hide Answer* cards, search, category filters, reveal-all, "Quiz me" and shareable deep links.
- **Global search** — `Ctrl/⌘ + K` or `/` opens a command palette that searches every note section, FAQ answer and A2Z problem (1,800+ entries) with grouped, highlighted results and keyboard navigation.
- Responsive from 320px phones to 2560px+ monitors, `prefers-reduced-motion` support, focus states, skip link, custom 404, toasts, skeletons and empty states.

## Getting started

Requirements: **Node.js 20+** (built and tested with Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (http://localhost:4173)
```

## Deploying

**GitHub Pages (current setup):** every push to `main` runs `.github/workflows/deploy.yml`, which builds with `BASE_PATH=/<repo-name>/` and publishes `dist/` (plus a `404.html` copy of `index.html` so deep links work). To test the Pages build locally:

```bash
BASE_PATH=/Rapid-Reference/ npm run build
npx vite preview --base /Rapid-Reference/
```

`dist/` is a static single-page app, so other hosts work too — routes like `/notes/python/lists` just need a fallback to `index.html`:

- **Vercel** — `vercel.json` is included.
- **Netlify** — `public/_redirects` is included.
- **Other hosts** — configure "rewrite all paths to /index.html".

## Customising

| What | Where |
|---|---|
| GitHub link in the footer / About page | `src/data/site.ts` → `github` |
| Hosting sub-path | `BASE_PATH` env var at build time (root `/` by default) |
| Add or edit a note | `src/content/notes/<category>/<slug>.md` + an entry in `src/data/notes.ts` |
| Add FAQ questions | `src/content/faq/<category>.md` — each `## Question` heading followed by its answer |
| Theme colours | `src/styles/themes.css` (+ names in `src/data/themes.ts`) |
| FAQ count shown on the landing page | `src/components/home/constants.ts` |

### Markdown conventions used in notes

- `##` headings become collapsible sections and appear in the table of contents (with `###`).
- Callouts: `> [!TIP]`, `> [!WARNING]`, `> [!INTERVIEW]`, `> [!REMEMBER]`, `> [!NOTE]`, `> [!IMPORTANT]` (optional title after the tag).
- Code fences: `python`, `sql`, `bash`, `http`, `c`; ` ```output ` for expected output; ` ```diagram Caption ` for ASCII diagrams.

## Refreshing the A2Z sheet

The sheet data (`src/data/a2z-sheet.json`) was pulled from Striver's official page on takeuforward.org. To re-sync it:

```bash
npm run sheet:update      # runs scripts/fetch_a2z_sheet.py (Python 3, standard library only)
```

Progress is keyed by takeUforward's item IDs, so existing checkmarks survive a refresh.

## Sources & attribution

- **DSA sheet**: problem titles, order, sections, difficulty and links © Striver / [takeUforward](https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2). No problem statements or solutions are copied — every row links back to the original.
- **Notes and FAQ** are original revision content written for this project.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion · React Router · Lucide · marked + highlight.js. Routes and content are code-split; notes load per category, the sheet and FAQ load on demand.

## Privacy

No accounts, analytics or backend. Theme, progress, bookmarks and history live only in your browser's `localStorage`.

---

© 2026 Rapid_Reference
