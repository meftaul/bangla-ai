---
name: pathshala-deck
description: Author a modern, engaging Pathshala slide-deck lesson (reveal.js MDX article) with live activities. Use when asked to create, port, or restyle a presentation, deck, slides lesson, or slides article in this app.
---

# Pathshala deck authoring

Decks are MDX articles rendered by reveal.js and run as live classroom sessions.
Golden example to copy from: `src/content/articles/agentic-coding.mdx` — its layout
CSS, slide patterns, and Terminal scripts are the reference implementation. Don't
re-derive them; adapt them.

## 1 · File & metadata

Create `src/content/articles/<slug>.mdx` — **the filename is the slug**. First line:

```js
export const metadata = { title: "…", description: "…", type: "slides" };
```

`readMeta` (`src/lib/articles.ts`) parses this with a flat regex: values must be
plain quoted string literals with **no apostrophes or quotes inside** (the regex
stops at either quote type). No nesting, no computed values.

## 2 · Engagement recipe

What makes a deck engaging here, in order of impact:

- **Open with a warm-up `Poll`** (slide 2) — gets every phone in the room tapping.
- **A checkpoint `Quiz` after each concept section** — 1 question, plausible wrong
  answers, one fun/memorable one (e.g. the real bug from a demo).
- **`DragDrop` for anything that has an order** (process steps, priorities).
- **Close with an opinion `Poll` + full-bleed statement slides** for the takeaway.
- ≤5 bullets per slide, one idea each, optional `.sub` detail line under a `strong` lead.
- Reveal bullets as **fragments**, in step with a `Terminal` animation beside them.

## 3 · Theming (per-article, no global changes)

Put one ``<style>{`…`}</style>`` tag before the first `<Slide>` — the CSS must be a
**template literal** (raw braces break MDX). It ships only with that article's page,
so scoping under `.reveal` is already article-scoped. Requirements:

- **Re-scope the app tokens inside `.reveal`** so Quiz/Poll/DragDrop follow the
  deck palette in both app themes:
  `--foreground --muted --border --surface --accent --accent-text
  --accent-foreground --danger` (they feed Tailwind's `text-foreground`,
  `border-border`, `bg-accent`… via `@theme inline` in `globals.css`).
- **Recolor `.reveal .controls` and `.reveal .progress`** — reveal's `white.css`
  beats `globals.css` in bundle order, but the article's inline style tag beats both.
- **`.reveal .act ul { list-style: none; margin-left: 0; padding-left: 0; }`** —
  white.css re-adds disc bullets inside activity option lists.
- A Google Fonts `<link … />` in the MDX is fine for deck-specific type.

Layout classes to copy from the golden example: `.split`/`.points`/`.termwrap`
(bullets beside a terminal), `.act` (centered activity slide), `.statement`
(full-bleed quote), `.kicker` (mono section label). Slides are `height:100%` with
flex inner divs — never rely on `section` being flex (reveal forces inline
`display:block` on the current slide).

## 4 · Slide JSX rules

- Each `<Slide>` wraps **one JSX root** (a single `<div>`), with **no blank lines
  inside the JSX tree** — a blank line flips MDX back into markdown parsing.
- `className`, not `class`; self-closing `<br />`.
- In Terminal step strings, use typographic quotes (’ “ ”) so JS string quoting
  never clashes; keep straight `"` inside single-quoted strings only.

## 5 · Fragments & Terminal

- Stepped bullets: `<li className="fragment">…</li>`. Fragment steps **sync to live
  viewers** — the presenter broadcasts `{ index, f }` on the nav channel
  (`src/components/live/presenter-deck.tsx` → `viewer-deck.tsx`). Late joiners see
  fragments reset until the presenter's next step (only the slide index persists).
- `<Terminal title="…" steps={[…]} />` (`src/components/interactive/terminal.tsx`):
  `steps[0]` types when the slide becomes current, `steps[n]` when fragment *n*
  reveals. **`steps.length` must equal the slide's fragment count + 1.**
- Line types: `cmd` (typed char-by-char, ❯ prefix) · `ag` (agent, ●) · `out`
  (output) · `dim` (comment) · `ok` (✓ green) · `warn` (⚠ amber).
- Terminal markup is unstyled on its own — its classes (`.term .tbar .dot .ttl
  .tbody .tl-* .caret`) must be styled in the article's style block. Copy that
  block from the golden example.

## 6 · Activities

All globally registered in `mdx-components.tsx` — use them in MDX with no imports.

| Component | Contract |
|---|---|
| `Quiz` | `id`, `question`, `options={[…]}`, `answer={i}` — **zero-based index** of the correct option |
| `Poll` | `id`, `question`, `options` — no right answer, unscored |
| `DragDrop` | `id`, `prompt`, `items={[…]}` — **authored in the correct order**; learners see them shuffled; all-or-nothing grading |

**Every activity needs a unique `id`.** Registration upserts on
`(session_id, activity_id)`; duplicate ids silently share phase/results. Scoring
(`src/lib/session.ts`): polls don't count; an unanswered quiz counts against the
learner — so only include quizzes you'll actually run in the session.

## 7 · Publish — or it 404s

The article page requires a DB `articles` row **even for admin preview**
(`src/app/dashboard/articles/[slug]/page.tsx`). New MDX files default to draft with
no row. Either: Manage Library → set the deck to Published (confirm dialog), or add
the slug to the seeds in `supabase/migrations/0001_init.sql`. Slide decks are
session-only for learners; published just makes them reachable/hostable.

## 8 · Verify

1. `npm run build` — catches MDX parse errors.
2. Preview at `/dashboard/articles/<slug>` as admin: step **every** fragment with
   →; terminals type in step and replay when you revisit a slide; activities give
   instant practice-mode feedback and are legible against the deck theme.
3. For a live-critical deck: two browsers (presenter + learner joined by code) —
   viewer bullets and terminals follow your fragment steps; quiz answers move the
   presenter's live tally; the post-session report scores quizzes + drag-drops.
