---
name: pathshala-animate
description: Add animated content to Pathshala journey lessons. Story scenes are small cartoons of the setup's story (set in Bengali life), with the cast walking in, talking and holding up cards, placed before the widget. Explanation figures are watch-only animations inside the <Then> that act out what each paragraph says. Interactive animations and visual exercises are widgets whose every tap plays out as motion, including the feedback on a wrong answer. Use whenever asked to animate, "beautify", add scenes, pictures or motion to a journey (src/content/articles/math_for_ai/*.mdx, src/components/interactive/*-journey.tsx), whenever the author leaves an inline note asking for one ("(ekhane animation add koro …)", "(add an animation here …)"), and when building a new journey (every step of every new journey moves). Pairs with the pathshala-journey skill, which covers the voice and the screen kit.
---

# Pathshala animations

The goal is a concept the reader can grasp by **watching it happen and making it happen**.
The author wants the lessons to **show what the words say, in motion**. That covers
every step of a journey, in three places:

| kind | where | what it does | frame |
| --- | --- | --- | --- |
| **Story scene** | the setup words, before the widget | acts out the story: the cast arrives, someone makes a claim, a problem turns up | `StoryFrame` + `Stage` (cast.tsx) |
| **Interactive animation** | the widget, and the visual exercise | the reader drives it; every tap plays out as motion, and a wrong answer animates what it would mean (§2½) | the screen itself (`usePlay`, `useTween`, `Draw`) |
| **Explanation figure** | inside `<Then>`, right after the paragraph it shows | shows the paragraph: the pattern, the why, a formula built up, a callback, a real-world example | `Scene` (kit) or `StoryFrame` |

Story scenes and figures are **watch-only**, driven by the reader: each waits on its
first frame with two buttons, *play all* (every beat on a timer; the chrome label is
currently the Bangla **একবারে দেখুন**) and **step by step** (back / next, one beat per
tap). Nothing else in the figure is a control. All three are **relevant**: they use the
same characters, cards and numbers as the words, with nothing decorative. Read the
`pathshala-journey` skill for the voice (§2–3), visual exercises (§3.2) and the build
rules (§7). This page is only about the animation.

Models to copy (grep by name):
- **Story scenes:** `FinalistsArrive`, `SomOnRoof`, `LostCard` (norm-journey), `SherbetQueue`, `HealthBoard` (sherbet-journey), `LostGentleman` (crowking-journey), `MamaGoesHome` (unit-journey), `TwinStall` (yardstick-journey).
- **Explanation figures:** `RoofBox`, `SquareTiles`, `NormBuild`, `WalkVsCrow`, `GolfSum` (norm-journey), `TwoTapes`, `HatOn` (unit-journey), `SlotBySlot`, `WordTug` (tiffin-journey), `TaxiGrid`, `PinchPush` (crowking-journey), `EqualPrice` (yardstick-journey).

---

## 1 · What to animate: read the words, not the math

Go **paragraph by paragraph**. For each one, ask whether a short animation could show what
these words say. If it could, and nothing next to it already shows it, add one.

**Story scenes.** One per step whose setup describes a *scene*: a character acts, a place
appears, a claim or objection is made, a problem arrives. Skip setups that are only an
instruction ("work it out without the knob…"), notation talk, or a review question. The
closing `## The end!` step gets one when it describes a moment ("Mama goes home with the
photo"). The scenes are Bengali life: a haat, a tea stall, a school field, a rickshaw, a
launch ghat — draw what the story names.

**Explanation figures.** Every `<Then>` has at least one, and **never more than 2**: a
`<Then>` is budgeted at one phone screen (pathshala-journey §3.1). If the words would earn
a third, that `<Then>` holds two ideas — move one into its own step if the journey is
under 11 steps, or into the next journey. A figure for a side story or a table
(`MarsMiss`, `PandaGibbon`, `ColorSixteen`, `DataBasis`) goes inside that `<SideQuest>`,
right after its paragraph. The sheet renders it like anywhere else. A watch-only figure
that *poses* a question can move into a step's setup as a `story` scene (3.7's
`WhichTwin`; give the component the `({}: Story)` signature). Good sources, straight from
the words:
- **the thing the paragraph points at** ("Notice how…", "Look at the table…"): the pattern the reader just produced, replayed calmly as a summary. It is *not* the widget again.
- **the everyday why**, acted out: walking, pouring, stacking, sliding, tiles.
- **the formula, built**: term by term, numbers flowing slot by slot, the bold name landing last (`NormBuild`, `HatOn`).
- **callbacks** to an earlier lesson or character, as a mini replay, often with the cast (`WalkVsCrow` is 2.5's ball; `RoofBox` is the mosquito on the veranda).
- **real-world or ML examples** named in the text, as a tiny scene (a shop, a photo cut to 16 colours, a GPU).
- **the open question** at the end: set it up visually and stop at "?".

**Never:**
- **Spoil.** A story scene sets up the widget's question and must not show its answer: not the 5 on Fahim's tape, not where the tea stalls go, not the winner. An open question stays open.
- **Re-run the widget** the reader just played. Add the angle the widget didn't have.
- **Invent** numbers or dialogue the prose doesn't imply. If a scene truly needs one, keep it small, and list it in your report so the author can check it.
- **Add decoration.** Every element on screen must be something the words mention.

**Inline author notes** in the MDX, like `(ekhane ekta animation add koro …)` or `(give them
animated reminder …)`, are requests. Build what they ask for, then delete the note.

---

## 2 · The machinery

### `useScene` + `Scene` (from `@/components/journey/kit`)

```tsx
const s = useScene(4, [600, 1200, 1200, 1600]); // steps, then ms before beat 1, 2, …
const k = s.k;                                   // beats shown so far: 0 … steps
<Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}> … </Scene>
```

- **The reader starts it.** It never plays on its own. `Scene` and `StoryFrame` draw the controls (`SceneControls`): *play all* (**একবারে দেখুন**) plays every beat on the timer, then becomes *replay* (**আবার দেখুন**). **step by step** switches to *← back · 2 / 5 · next →* (**আগের / পরের**), and tapping it mid-play takes over from that beat. Never add your own play or replay button. (These labels are Bangla chrome until kit.tsx is localized; see pathshala-journey §6.)
- **Every beat must stand alone.** The reader can stop on any beat for as long as they like, and step *backwards*. So draw each beat purely from `k`: whatever exists at beat k is mounted, and whatever doesn't is not. Give each beat its own caption (`SAY[k]`), including beat 0, the resting first frame, which should already show the setting. Don't rely on timers inside a beat, or on something that only makes sense mid-glide.
- **Walking stops on arrival.** Cast `Person`/`Robot` legs swing only while they glide to a new spot (for `ms`), then stop, even if the beat stays. A local walker of your own should use cast's `Loop` (`<Loop on run={`${x},${y}`} ms type values dur />`), not `repeatCount="indefinite"`. Hovering (a drone, rotors) may loop forever.
- **Settled when still.** Reduced motion opens on the last beat, and so does a `shot` preview, unless a fixture seeds `k`. Seed `stepping: true` as well to shoot the step controls.
- **Motion.** Drive motion by *what exists at beat k*: mount elements at a beat, where the `POP`, `FADE`, `Draw` and `<Arrow draw>` entrances animate on mount. Change attributes or classes under a CSS transition, or glide values with `useTween([...], ms)`. Put `motion-reduce:transition-none` on every transition.

### Story scenes (from `@/components/journey/cast`)

```tsx
export function FinalistsArrive() {
  const s = useScene(5, [600, 2600, 1400, 1400, 1400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="…a11y description…">
        <Gate x={34} y={150} />
        <Person who="fahim" x={78} y={150} arm={k === 1 ? "wave" : "down"} mood="happy" label />
        {k === 1 && <Bubble x={78} y={84} side="right" lines={["Whoever ends up", "farthest wins!"]} />}
        <Person who="som" x={k >= 2 ? 140 : 370} y={150} facing={-1} walking={k === 2} label={k >= 3} />
        {k >= 3 && <Card x={140} y={74} text="(2, 3, 6)" tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}
```

- **`Stage`** is a 320×180 painted backdrop: `field | fair | night | room | street | evening`, with the horizon at `ground` (150 by default). Everything on it is fixed ink, so it looks the same in light and dark.
- **`Person`** is the recurring cast: `fahim samin som nasib ammu apa mama rina karim`.
  - Feet sit at `(x, y)`, about 62 units tall. Change `x` and they glide over `ms`. Set `walking` during that beat so the legs swing.
  - Other props: `facing` −1 turns them left; `mood` is `plain | happy | puzzled | smug | sad | shout`; `arm` is `down | wave | hold | point`; `label` puts the name under their feet.
  - Samin is a boy.
  - The `label` name under their feet is drawn in Bangla (`CAST[who].name`) until cast.tsx is localized; in English journeys leave `label` off and name people in the caption or a bubble.
- **`Robot`** is Shiku.
- **`Bubble`**: 1–2 lines of about 22 characters each, with the tail at a head (y − 66). Use `side` near an edge and `tone="think"` for thoughts.
- **Props:** `Card` (a clue card, tuple in Latin digits, "?" for a lost one), `Gate`, `Stall`, `Tree`, `Building` (`roof`), `Chest` (`open`).
- **Anything missing** (a glass, a drone, a laptop, a crowd figure, a scale): draw it locally in the journey's tsx with a prefixed name. A new character not in the cast reuses the closest look, with their own name drawn as `<text>`.

### The `story` prop (story scenes only)

In a `<Step>`, the Journey takes the **first component** as the widget. A component
written with `story` is treated as part of the setup words instead, so it flows onto the
story screens with the paragraphs:

```mdx
Sounds simple. But when the four finalists arrived, their four cards looked nothing alike.

<FinalistsArrive story />

<PrizeRow />
```

Every story scene **must** be written with `story`. The MDX isn't type-checked, so the
component can take no props. If you type it, use `({}: Story)` with `type Story = { story?:
boolean }`, because `(_: …)` trips ESLint's no-unused-vars. Explanation figures inside
`<Then>` need no prop.

---

## 2½ · Interactive animations and visual exercises

The widget is where the reader *makes* the idea happen, so it animates too. The
difference from a scene: the reader's own action starts each play, and what plays
depends on what they did.

- **Every tap plays out.** Don't just swap a number: Shiku walks the card, the sherbet
  pours, the dot glides to its new place, the bar fills (`usePlay` for stepped motion,
  `useTween` for a glide, `Draw` / `<Arrow draw>` for a line appearing). The readout
  updates when the motion lands, not before.
- **Short plays.** Under ~2s, so the reader can try again at once. A tap mid-play
  restarts from the new input rather than queueing.
- **A wrong answer animates what it means.** In an exercise, the reader's wrong pick
  plays out honestly — the arrow walks Nasib to the wrong stall, the scale tips the other
  way — and a `Nope` line says what to look at. That picture teaches more than "✕ wrong".
  The right answer plays the confirming motion, then `pass()` fires from the play's
  `done`.
- **Choices can be pictures.** `Choice` takes any children: put a small SVG in it (an
  arrow, a bar pair, a mini grid) instead of a string. Keep each at ≤ ~90px tall so three
  fit in a row or a column under the main visual.
- **Same rules as scenes:** relevant, no decoration, fixed ink for "paper", motion-reduce
  respected (under reduced motion, jump to the end state), and everything a tap changes
  in view (pathshala-journey §7).
- **Seed the state that drives the motion** (`useSeed`), so `shot` can show the
  wrong-pick and right-pick end states.

Models: `TilePour`, `SugarCube` (predict → the reader's tap plays it), `ShikuTape`,
`RuleVsTape` (drag and watch), `KnobStep` (step a machine), `PrizeGiven` (wrong tries
bounce).

---

## 3 · Craft

- **Beats.** Use 3–6 per figure. Timings are for *play all*, with 500–700ms before the first beat. Give plain beats 900–1600ms and a beat that puts text on screen at least 2200ms, so it can be read. Something must move in every one.
- **Size: draw for the phone, and let the frame grow it.** Design every figure at phone size: **≤ ~260px tall** including the caption and controls (a phone `shot` of ≤ ~320 means you're there), leaving a paragraph room on the ~460px screen. A story scene is its 320×180 stage, about 190px on a phone. Bigger screens are handled by the frames, never by the figure:

  | screen (width **and** height) | explanation drawing (`GROW`, CSS zoom) | story frame (`GROW_WIDE`) |
  | --- | --- | --- |
  | phone, or anything short (a phone on its side, a short laptop) | ×1 | 22rem |
  | ≥ 640 wide and ≥ 640 tall (tablet) | ×1.2 | 26.4rem |
  | ≥ 768 wide and ≥ 760 tall | ×1.35 | 29.7rem |
  | ≥ 1024 wide and ≥ 860 tall (laptop) | ×1.5 | 33rem |
  | ≥ 1280 wide and ≥ 1000 tall (big screen) | ×1.7 | 37.4rem |

  `Scene` zooms only the drawing: the caption and the controls keep their size. `StoryFrame` widens, and the SVG stage grows with it. Each step needs the height too, because the Journey is exactly one screen tall, so a figure must never outgrow it. The constants live in kit.tsx.

  **Widgets grow too, but less** (`GROW_WIDGET`: ×1.15 at ≥ 640 wide and ≥ 780 tall, ×1.3 at ≥ 768 / ≥ 900, ×1.45 at ≥ 1024 / ≥ 1040). A widget is taller than a figure and shares the screen with the Task and Continue. The Journey wraps each step's widget itself (journey.tsx `growWidget`), so a screen needs nothing. The words, the pinned Task and the pass note keep their size. The review `Check` opts out with `data-nogrow` on its root.

  **A figure in a `<Then>` that isn't a `Scene`** (a tap-driven one like `AbsBars`, `FinerPresses`, `BasisCompare`) wraps its root in `GROW` itself, or it stays phone-sized.

  **Two traps:**
  - **Units:** write these media queries in **rem with the same digit count** (`40/48/64/80rem`), never px. Tailwind orders the variants as text and the last matching one wins, so `1024px` would sort before `640px` and a laptop would get the tablet step.
  - **Pointer math:** under zoom, pointer maths must use ratios of `getBoundingClientRect()` (`(e.clientX - r.left) / r.width`), as `Plane` does. `offsetWidth`/`offsetX` ignore the zoom and would put a drag in the wrong place.
- **Stay flexible so the zoom works.** Let a figure size itself by `w-full` plus a `max-w-[…]` cap, SVGs by `viewBox` with `h-auto w-full`, and rows by flex with a small gap. Under zoom, those caps grow and full-width parts still fill. Don't hard-code pixel widths for the whole figure, don't use viewport units (`vw`/`vh`) inside a figure, and don't add your own `sm:`/`lg:` size classes: the frame already scales, and doing it twice would overshoot the screen. A figure that isn't in a `Scene` or `StoryFrame` doesn't grow; keep new ones inside a frame.
- **Keeping it small:** readouts go *beside* the sheet, not under it. Use SVG sheets of `max-w-[12rem]`–`[16rem]` and captions of 1–2 lines. Swap content in place per beat rather than stacking.
- **Spacing on the stage:** keep people 50–70 units apart, cards above heads at about y − 76, bubbles inside the 320 width, and nothing over the top-right corner (the replay chip).
- **Colour.** Chrome uses theme tokens (`text-muted`, `bg-accent/10`, `fill-cat-blue` on the page). Drawn "paper" uses fixed ink (`fill-[#0f1b2d]`, white sheets), and small labels on a white sheet need a fixed dark ink so they don't pale in dark mode.
- **Text.** Captions, labels and bubbles are short, plain spoken English in the author's voice (pathshala-journey §2), full sentences ending in a period. Numbers and tuples in ASCII digits; money in taka. No `bn()`, no emojis. A bubble line is ≤ ~22 characters, so pick short words.
- **Placement in the MDX.** Put the figure right after the paragraph it shows. You may split a paragraph at a sentence boundary so a figure sits after the exact sentence, but never change the wording. Keep imports in the MDX's import block.

---

## 4 · Gotchas (each one bit us once)

- **Plane width:** `<Plane>` always has `w-full my-5 mx-auto`. To size it, wrap it in a sized div and pass `className="my-0! max-w-none"`. Plain `my-0` loses to `my-5`.
- **Monospace is for numbers only:** `font-mono` or SVG `fontFamily="ui-monospace"` holds tuples and formulas, never a sentence. (In the older Bangla journeys it must never hold Bangla; pick the font per line with `/[ঀ-৿]/.test(l)`.)
- **Emoji glyphs:** ◀ ▶ ↗ ↖ ✓-style glyphs render as emoji on Linux. Draw arrows and ticks as paths.
- **Keyframes:** no CSS keyframes (there's no global CSS). For looping motion (legs, rotors, a bob), use SVG `<animateTransform>` and skip it under reduced motion (cast.tsx's `useCalm`, or a local copy of it).
- **Refs and lint:** the React Compiler lint treats any object holding a ref as a ref. That is why `useScene` returns a state callback-ref named `mount`, and why `Scene` destructures it. Don't reach into `s.mount`.
- **Gradient IDs:** the SVG gradient ids in `Stage` include the backdrop, because `shot` renders each figure on its own and `useId` repeats across the page.
- **Name collisions:** one tsx holds every screen of a journey. Prefix module consts per figure (`X3_…`, `S4_…`), and alias clashing imports (`Card as CastCard`).
- **Prettier:** it isn't installed, and `npx prettier` hangs downloading. Don't run it; indent by hand.
- **Section comments:** number each figure's section comment after its screen, e.g. `// 3½ · A figure for screen 3's explanation, no task: …` or `// 2a · A story scene for screen 2's setup, no task: …`. Update the file's header comment if it lists screens.

---

## 5 · Verify

```
npx tsc --noEmit -p .                     # your file clean
npx eslint src/components/interactive/<file>.tsx
node scripts/check.mjs                    # every MDX compiles
npm run shot -- src/components/interactive/<file>.tsx Fig Fig:mid   # then LOOK at the PNGs
npm run shot -- src/components/interactive/<file>.tsx Fig --dark
npm run shot -- src/components/interactive/<file>.tsx Fig --width=1100   # laptop (shot is 900 tall): drawing at ×1.5
```

`shot` renders with `renderToStaticMarkup` (no effects), so a `useScene` figure shows its
**last beat**. Add fixtures so the in-between beats can be seen, and keep them:

```ts
export const fixtures: Fixtures = { Fig: { mid: { k: 2 }, done: {} } };
```

Look at every PNG and check four things:
- nothing overlaps or is clipped;
- bubbles and labels are readable;
- the height is within budget;
- it matches its paragraph.

Fix what you see and re-shoot. The screenshots don't show the timing, so say so in your
report, and ask the author to watch one journey in `npm run dev`.

---

## 6 · Doing many journeys at once

One agent per journey works well, because each owns exactly its `.mdx` and its `*-journey.tsx`.
Tell every agent:
- don't edit `src/components/journey/*` or other journeys' files;
- ignore tsc and eslint errors in files that aren't theirs, since those are mid-edit.

If `cast.tsx` needs a new piece, collect the requests and add it yourself afterwards. The
author edits MDX files by hand too, so re-read a file right before editing it, and only
insert tags, imports and paragraph splits.

Ask each agent to report:
- a table of figure / widget, step and sentence, what it shows, and shot height;
- any step with no motion at all, and why;
- the `<Then>`s or setups left bare, and why;
- any invented number or line, to pass on to the author.
