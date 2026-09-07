---
name: pathshala-deck
description: Author a modern, engaging Pathshala slide-deck lesson (reveal.js MDX article) with live activities. Use when asked to create, port, or restyle a presentation, deck, slides lesson, or slides article in this app.
---

# Pathshala deck authoring

Decks are MDX articles rendered by reveal.js and run as live classroom sessions.
The house design system lives in `src/app/deck.css` and is already imported for every
deck by `src/components/deck.tsx` — **do not re-declare it.** A new deck is content
plus, at most, a short delta for what it alone needs.

Reference decks: `src/content/articles/user-security-awareness.mdx` (the house look —
its whole style block is 7 hue lines plus two bespoke widgets) and
`src/content/articles/learn-claude-code.mdx` (a deck that inverts the palette to a
dark terminal theme by re-pointing deck.css's tokens rather than overriding its rules).

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

## 3 · Theming — write a delta, not a stylesheet

`src/app/deck.css` already ships the tokens, type scale, reveal chrome, the activity
list reset, and every primitive: `.card`/`.cards`, `.panel`, `.verdict`, `.evo`,
`.flow`, `.pull`, `.duo`, `.stats`, `.chips`, `.risks`, `.act`, `.title-slide`,
`.chapter-in`, tables, and the Terminal / ContextWindow / PasswordMeter panels.
**Use those before inventing anything.**

Only if the deck needs something of its own, add one
``<style>{`…`}</style>`` tag before the first slide — the CSS must be a **template
literal** (raw braces break MDX), and it ships only with that article. In practice a
delta is:

- **Its per-chapter hue map**, the one thing every deck defines:
  `.reveal.ch-x, .reveal .ch-x { --hue: 245; }` — the compound form recolors the deck
  background (deck.tsx mirrors the current slide's `ch-*` onto `.reveal`, since custom
  properties only cascade down); the descendant form recolors the slide's content.
- **Bespoke widgets** this deck alone uses (e.g. `.mail`, `.lanes`).

To reskin a deck wholesale, re-point deck.css's tokens (`--ink --bg --line --surface
--accent --accent-ink --display --sans --mono`…) inside `.reveal` rather than
out-specifying its rules — every shared primitive and reveal's chrome then follow.
`learn-claude-code.mdx` does exactly this. Re-scope the app tokens
(`--foreground --muted --border --surface --accent --accent-text --accent-foreground
--danger`) in the same block so Quiz/Poll/DragDrop follow the deck in both app themes.

Fonts: Space Grotesk / Hanken Grotesk / JetBrains Mono are self-hosted via `next/font`
in `layout.tsx`. Add a Google Fonts `<link>` only for a family this deck alone uses.

Never name a class `.grid` — it collides with Tailwind's `grid` utility inside
Quiz/Poll/DragDrop. Use `.cards`. Slides are `height:100%` with flex inner divs —
never rely on `section` being flex (reveal forces inline `display:block` on the
current slide).

## 4 · Slide JSX rules

- Each `<Slide>` wraps **one JSX root** (a single `<div>`), with **no blank lines
  inside the JSX tree** — a blank line flips MDX back into markdown parsing.
- `<Slide>` forwards every prop to the `<section>`, so reveal's per-slide API works
  on it directly: `<Slide className="ch-why" data-transition="fade">`,
  `data-auto-animate`, `data-background-*`. Don't drop to a raw `<section>`.
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
  reveals. **`steps.length` must equal the slide's fragment count + 1.** The stepping
  contract itself lives in `useFragmentSteps` (`use-fragment-steps.tsx`), shared with
  `ContextWindow` — use that hook for any new fragment-driven animation.
- Line types: `cmd` (typed char-by-char, ❯ prefix) · `ag` (agent, ●) · `out`
  (output) · `dim` (comment) · `ok` (✓ green) · `warn` (⚠ amber).
- Terminal, ContextWindow and PasswordMeter are styled by `deck.css` — nothing to
  copy into the article.

## 6 · Components

All globally registered in `mdx-components.tsx` — use them in MDX with no imports.

Layout blocks (`src/components/deck-blocks.tsx`) — reach for these before hand-rolling
a slide; each replaced ~20 copy-pasted instances:

| Component | Contract |
|---|---|
| `Chapter` | `n`, `ch`, `title` — a full-bleed chapter divider |
| `Verdict` | `tone={"accent"\|"danger"}`, `fragment`, children — a takeaway chip |
| `Evo` | `art` (raw SVG string), `n`, `title`, `lead`, `points={[…]}`, `flip`, `verdict`, `ch` — a concept beside its diagram; every point reveals as its own fragment, so never write `className="fragment fade-up"` by hand |

Activities:

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
