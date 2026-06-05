# Play It Pro — Mark's Drum Studio Portal

Private studio web app for **Drum Lessons by Mark**: lesson planning, student practice, scheduling, and messaging. Teachers and admins use **studio**; students use **Console**.

**Live site:** [drumlessonsbymark.com](https://www.drumlessonsbymark.com)

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Supabase** — auth, database, storage
- **TanStack Query** — cached API data
- **PWA** — installable app with offline asset caching
- **GitHub Pages** — production hosting (`npm run deploy`)

## Features

- **Lesson builder** — block-based lessons (text, video, audio, sequencer, notation, tempo, rudiment, checklist, resources)
- **Stack & bento canvas** — vertical or 12-column grid layouts
- **Student portal** — assigned lessons, practice tasks, progress
- **Lesson library** — card and table views, assign to students
- **Admin JSON import/export** — bulk lesson upload from AI-generated JSON
- **Rich text, drum notation, music notation** — with playback and student preview

## Quick start

```bash
cd play-it-pro-platform
npm install
cp .env.example .env   # add Supabase URL + anon key
npm run dev              # http://127.0.0.1:5288
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run deploy` | Build and publish to GitHub Pages |
| `npm run setup:audio` | Copy/generate drum & instrument audio assets |
| `npm run capture:help-screenshots` | Regenerate lesson-builder help PNGs (Playwright) |

## Environment

Create `.env` from `.env.example`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional: reCAPTCHA, push notification (VAPID) keys — see `.env.example`.

## Database

SQL migrations and one-shot setup live in `supabase/`. Run consolidated scripts in the Supabase SQL editor as documented in `supabase/sql/README.md`.

## Lesson JSON (AI import)

- **Knowledge base:** `play-it-pro-lesson-json-knowledgebase.md`
- **Sample file:** `public/lesson-templates/sample-lesson-import.json`
- **Import:** admin only — Lesson builder → **Import JSON**

## Project layout

```
src/
  components/lesson-planning/   # Lesson builder, blocks, student view
  components/studio/              # Shell, sidebar, profile
  pages/studio/mark/              # Teacher/admin portal
  pages/studio/student/           # Student portal
  lib/                            # Services, notation, import/export, cache
public/
  help/lesson-builder/            # Help screenshots
  audio/                          # Drum samples & instrument packs
docs/                             # Extended internal documentation
```

## Deploy

```bash
npm run deploy
```

Pushes `dist/` to the `gh-pages` branch. Ensure GitHub Pages serves from that branch and that `homepage` in `package.json` matches your domain.

## License

Private — Drum Lessons by Mark / LL Designs.
