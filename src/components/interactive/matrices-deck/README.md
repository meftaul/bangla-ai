# Matrices are Transformers — as React components

`../index.html` (one 2,200-line file: 24 reveal.js slides, five canvas engines, one
global `SLIDES` registry) rebuilt as **one `.tsx` component per slide**, matching the
conventions of `bangla-ai/src/components` and `src/app/dashboard/articles`.

Every slide keeps its interactivity: the same sliders, buttons, sweeps, 3D orbits and
canvas animations, driven the same way.

## What's here

```
src/
  components/matrices/
    lib/
      math.ts          lerp/ease/clamp, 2×2 matrix ops, det, rgba, the COL palette
      sketch.ts        canvas base class — sizing, DPR, rAF loop, start/stop/destroy
      plane.ts         Plane      — a 2D grid deformed by a live matrix (or a warp)
      scatter.ts       Scatter    — two classes, crumple/un-crumple, a decision cut
      number-line.ts   NumberLine — points on ℝ moving under f
      space-3d.ts      Space3D    — small 3D projector with auto-orbit
      use-slide.ts     useSlideLifecycle() + useSketch() — the reveal.js bridge
    ui.tsx             shared markup: Btn, Btns, Stage, Panel, Mat, Mat2, Machine, Notes
    deck-styles.tsx    <DeckStyles /> — the deck's CSS, scoped under `.reveal`
    slides/            24 components, numbered in presentation order
    all-slides.tsx     all 24 in order, as one fragment
    index.ts           barrel export
  content/articles/
    matrices-are-transformers.mdx    the article that assembles the deck
optional/
  deck-with-options.tsx              see "Slide numbers", below — not required
```

Slide files map 1:1 to the original `data-id`s:

| # | file | `data-id` | interactive |
|---|------|-----------|---|
| 1 | `01-title.tsx` | `title` | wobbling background plane |
| 2 | `02-pitch.tsx` | `pitch` | — |
| 3 | `03-cut.tsx` | `cut` | clear / draw the line, live accuracy |
| 4 | `04-tangle.tsx` | `tangle` | angle sweep, best-so-far readout |
| 5 | `05-untangle.tsx` | `untangle` | crumpled / un-crumple / cut |
| 6 | `06-coords.tsx` | `coords` | 3D walk-around |
| 7 | `07-machine.tsx` | `machine` | CSS conveyor animation |
| 8 | `08-numline.tsx` | `numline` | four functions on ℝ |
| 9 | `09-vector.tsx` | `vector` | plotted vector |
| 10 | `10-matmachine.tsx` | `matmachine` | CSS conveyor animation |
| 11 | `11-allspace.tsx` | `allspace` | identity / apply |
| 12 | `12-linear.tsx` | `linear` | two panels on an auto-cycling timer |
| 13 | `13-columns.tsx` | `columns` | four live sliders |
| 14 | `14-play.tsx` | `play` | six matrix presets |
| 15 | `15-det.tsx` | `det` | five presets, live determinant |
| 16 | `16-shape.tsx` | `shape` | — |
| 17 | `17-lift.tsx` | `lift` | ℝ²→ℝ³, orbiting |
| 18 | `18-squash.tsx` | `squash` | ℝ³→ℝ², orbiting |
| 19 | `19-rank.tsx` | `rank` | — |
| 20 | `20-net.tsx` | `net` | pulsing network diagram |
| 21 | `21-recap.tsx` | `recap` | — |
| 22 | `22-next.tsx` | `next` | — |
| 23 | `23-bias.tsx` | `bias` | W·x vs W·x + b |
| 24 | `24-rows.tsx` | `rows` | — |

The eight non-interactive slides are plain server components — no `"use client"`, no
JS shipped. The other sixteen are client components that own their canvas and state.

## Installing it into bangla-ai

```bash
cd /home/nasib/Documents/misl/bangla-ai/bangla-ai
cp -r /home/nasib/Documents/misl/Learnings_for_project/Presentation_on_thursday/matrices-deck/src/components/matrices src/components/
cp    /home/nasib/Documents/misl/Learnings_for_project/Presentation_on_thursday/matrices-deck/src/content/articles/matrices-are-transformers.mdx src/content/articles/
npm run dev
```

Nothing else changes — no edits to `deck.tsx`, `mdx-components.tsx`, `next.config.ts`
or `globals.css`, and no new dependencies (reveal.js is already installed).

Then, as an admin: **/dashboard/articles/manage** → find "Matrices are Transformers"
→ set its status. `listDiskArticles()` picks it up from the filesystem, so it appears
in the manage list as soon as the file exists; the `articles` row is created by the
status toggle. `type: "slides"` means students only reach it through a live session
(`/dashboard/sessions`), while an admin can preview it at
`/dashboard/articles/matrices-are-transformers`.

To reorder or drop slides, edit the MDX — it lists all 24 explicitly. To use the deck
outside MDX:

```tsx
import Deck from "@/components/deck";
import { DeckStyles, AllSlides } from "@/components/matrices";

<div className="deck-frame">
  <Deck>
    <DeckStyles />
    <AllSlides />
  </Deck>
</div>;
```

## How the port works

**Lifecycle.** The original registered each slide against the Reveal instance
(`Reveal.on('slidechanged')`) and got `show` / `hide` / `relayout` callbacks. A slide
component can't reach that instance — `Deck` owns it — so `useSlideLifecycle()`
derives the same three events from the `present` class reveal writes on the
`<section>`, watched with a `MutationObserver`. That's the trick `ContextWindow`
already uses in this repo, and it makes a slide behave identically in practice,
presenter and viewer mode. `relayout` fires on window resize, because reveal rescales
the deck with a CSS transform that no `ResizeObserver` reports.

**Canvas ownership.** `useSketch()` builds one sketch per component and destroys it on
unmount — React 19 StrictMode double-invokes effects in dev, so every `Sketch`
subclass now implements `destroy()`. Sketches are never re-created by a re-render.

**State.** Button groups, readouts and sliders are React state instead of
`querySelectorAll('[data-x]')` + `classList` + `innerHTML`. Where a readout tracks an
animating matrix, the `Plane` stays the single source of truth: it calls `onFrame` per
frame and the component bails out of `setState` when the values haven't changed.

**Styling.** `<DeckStyles />` ships the original CSS scoped under `.reveal`, the same
way `learn-claude-code.mdx` ships its theme. The palette is renamed `--mi`, `--mj`,
`--macc`… — the single-letter `--i` in the original would have collided with the
results-bar stagger index in `globals.css`. Canvas colours live in `COL`
(`lib/math.ts`); the two must stay in sync.

## Deliberate differences from index.html

- **Canvas-size independence.** The original was authored for reveal's 1280×760 with
  30px type and pixel-fixed diagrams; this app's `Deck` uses reveal's 960×700 default.
  Rather than hard-code either, `.slides` is made a CSS query container and every size
  is a fraction of the canvas width (`2.344cqw` = the original 30px at 1280). The deck
  now lays out correctly at whatever size `Deck` is configured for.
- **Loops stop when a slide leaves.** The title background, the angle sweep and the
  network pulse ran for the whole talk in the original (`NetSketch.step` returned an
  unconditional `true`, so `hide` couldn't stop it). They now pause off-slide. Nothing
  visible changes.
- **Colours are TypeScript constants.** The original read them from CSS custom
  properties, which forced `loadColors()` to run twice — once too early to work.

Everything else is a faithful port: the same seeded point layouts, the same easing,
tween durations, matrix presets and speaker notes.

## Speaker notes and slide numbers

Notes are in `<aside className="notes">` on every slide. reveal.css hides them by
default, so they cost nothing; pressing **S** for the speaker window needs reveal's
`RevealNotes` plugin, which this app's `Deck` doesn't register.

If you want that, or the `13 / 24` slide counter, `optional/deck-with-options.tsx` is
`src/components/deck.tsx` with one added optional `options` prop passed through to
`Reveal`. It is backward compatible with `presenter-deck.tsx` / `viewer-deck.tsx`, but
it is **not** needed for the deck to work — only copy it over if you want those extras,
and pass e.g. `options={{ slideNumber: "c/t" }}` at the call site.

## Verified

- `tsc --noEmit` and `eslint` clean, using bangla-ai's own `tsconfig.json` and
  `eslint.config.mjs` (including the React Compiler `react-hooks/immutability` and
  `refs` rules).
- Server-rendered with `react-dom/server`: 24 sections, 17 canvas stages, 33 buttons,
  4 sliders, 24 note blocks, 37 fragments — each count identical to `index.html`.
- The MDX compiles with `@mdx-js/mdx` to 24 slide components with no `<p>` wrappers,
  so they stay direct children of `.slides` as reveal requires.

Not verified: the running app (it needs Supabase auth and an admin account).
