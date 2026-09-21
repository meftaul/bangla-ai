# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The line above is load-bearing: this is **Next.js 16** with breaking changes from older versions. Read `node_modules/next/dist/docs/` before writing framework code.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint-config-next`)
- `npm run check` — tsc + ESLint on git-changed files + MDX compile of every article (`-- --all` lints everything)
- `npm run shot -- <component-file> [Screen[:state]]` — PNGs of journey screens in named states, into `.shots/` (no dev server or login needed)
- Tests are standalone `assert`-based self-checks, **not** a test runner (no `npm test`):
  - `npx tsx src/lib/articles.test.ts`
  - `SESSION_SELFCHECK=1 npx tsx src/lib/session.ts`

Env vars live in `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

DB migrations in `supabase/migrations/` are run **by hand in the Supabase SQL editor** — there is no Supabase CLI or service-role key wired up. Bootstrap the first admin by editing `profiles.role` (see end of `0001`).

## What this is

"Pathshala" — a Bangla/English learning app. Admins author lessons as MDX, then run them as **live, slide-synced classroom sessions**; students join by code, answer embedded activities, and get scored after the session ends.

## Architecture

**Stack:** Next.js 16 App Router, React 19, Tailwind v4, `@next/mdx`, Supabase (auth + Postgres + Realtime), reveal.js (slides), Excalidraw (whiteboard), KaTeX (math). Path alias `@/*` → `src/*`.

**MDX articles are pages.** `pageExtensions` includes `md`/`mdx`. Files in `src/content/articles/*.mdx` are the **source of truth for which lessons exist**; the DB `articles` table holds only mutable `status` (`draft`/`published`/`live_session`). `src/lib/articles.ts` reads MDX `export const metadata` via **regex over the raw file** (`readMeta`) to avoid compiling every article just to list titles. Components used in MDX (`Slide`, `Quiz`, `Poll`, `DragDrop`) are registered globally in `mdx-components.tsx` — no imports needed inside `.mdx`.

**Auth & security boundary.** Middleware lives in **`src/proxy.ts`** (exports `proxy`, not the conventional `middleware.ts`) → `src/lib/supabase/middleware.ts#updateSession`, which refreshes the session and gates `/dashboard`. Do not insert code between `createServerClient` and `getClaims()` — it desyncs the session. Server components use `src/lib/supabase/server.ts`; client uses `src/lib/supabase/client.ts`. **RLS is the only real authorization** — `getRole()`/`is_admin` app checks are UI gating only. Answer keys ship in the client MDX bundle by design; scoring integrity comes from RLS (insert-only `responses`, PK blocks re-answer) not secrecy.

**Live sessions** (`src/components/live/`). Three modes via `LiveSessionProvider`: `practice` (no provider → activities work standalone with no-op submit), `presenter`, `viewer`. Realtime uses three Supabase channels per session id:
- `session:{id}` — presence (roster) + `answer` broadcasts for live counts/poll tallies (`session-context.tsx`)
- `session:{id}:board` — whiteboard scene + deck/board view toggle (`stage.tsx`)
- `session:{id}:nav` — presenter slide → viewer follow (deck components)

Key patterns: activities **self-register** to `session_activities` on presenter mount (the whole deck mounts at once, so we never parse MDX server-side). The reveal deck and Excalidraw board **stay mounted** and toggle via CSS (`hidden`) — both are expensive to recreate. The whiteboard broadcasts the presenter's visible region + canvas size so viewers **fit** it to their own screen cross-device (`stage.tsx#fit`). Late joiners catch up from persisted `current_slide` / `board` / `board_view` columns.

**Scoring** (`src/lib/session.ts`) is pure and Supabase-free for testability: polls aren't scorable; unanswered activities count against the total.

## Conventions

- Math for AI **journeys** (`src/content/articles/math_for_ai/`, `src/components/interactive/*-journey.tsx`): follow the `pathshala-journey` skill in `.claude/skills/`. New journeys are stories set in Bengali life, written in plain English, **11 steps at most**, with an animation or interaction on every step and visual exercises (journeys 1.x–4.x are older Bangla ones). To cut a source article into journeys first — as many as it holds, one "aha" each — use `pathshala-journey-plan`, which writes the `<nn>_journey_specs.md` that `pathshala-journey` then builds from. To animate a journey (story scenes before the widget, interactive animations, watch-only figures in `<Then>`), use `pathshala-animate`. Before handing a journey over, run its prose and screen text through `pathshala-voice` (the author's own editing pass).

- `// ponytail:` comments mark **deliberate** simplifications with their upgrade path — respect them; don't "fix" them without reason.
- PostgREST query builders are lazy: a bare `.update(...)` never runs — chain `.then(() => {})` to fire it.
- Dev runs React 19 StrictMode (double-invoked effects); realtime/reveal/Excalidraw setup is written to tolerate it (fresh channel per effect run, `destroy()`/`removeChannel` cleanup).
