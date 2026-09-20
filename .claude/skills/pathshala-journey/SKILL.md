---
name: pathshala-journey
description: Build or revise a Pathshala "journey" lesson — Brilliant-style, one screen at a time (Math for AI 1.x–3.x) — and write its words in the author's voice (conversational Bangla mixed with English, told as a story). Covers the spine a journey needs, the screen components, the kit API, wiring and verification. Self-contained: use whenever the task touches src/content/articles/math_for_ai/*.mdx journeys or src/components/interactive/*-journey.tsx, including writing or rewriting the prose, the <Then> explanations, or the short words inside screens (captions, tasks, feedback, speech bubbles, pass notes).
---

# Pathshala journeys

A journey is an MDX article whose body is `<Journey><Step>…</Step>…</Journey>`: one
screen at a time, each with one interactive screen component and one thing to do; the
Continue arrow stays locked until the screen calls `pass()`.

**The model journeys** are **1.1** (`01c_image_numbers.mdx` + `image-journey.tsx`) and
**2.3** (`02c_king_queen.mdx` + `word-journey.tsx`) — the author's own pick. Read one of
them before writing. 3.1 (`03a_treasure_add.mdx` + `treasure-journey.tsx`) is a good
reference for *screen* craft, but its original shape was a tour of errands rather than a
journey with a spine (§0).

**Save tokens:** don't read whole `*-journey.tsx` files (dimension-journey is ~2,800
lines). Navigate with `grep -n '^export function\|^// [0-9]' <file>` and read one
section with offset/limit. Everything needed to write a screen is on this page.

---

## 0 · The spine: one question owns the whole journey

Get this right before anything else. A journey is **not** a tour of one topic's uses —
it is **one unanswered question, asked on screen 1 with something at stake, and settled
only at the end.**

- **Screen 1 asks it and does not answer it.** 2.3 opens with `king − man + woman ≈
  queen` and withholds the answer for eight screens; 1.1 opens with a task that can fail
  (Rafi's drawing must match *exactly*, over a voice-only phone). **Never let the first
  `<Then>` resolve the hook** — that is the single most common way a journey goes flat.
  If the hook dies on screen 1, screens 2–8 have nothing pulling them.
- **Seal the reader's guess.** A prediction screen that locks a bet in and refuses to
  mark it (`NasibBet`, `PrizeRow`) buys real suspense. `pass()` says the bet is sealed
  and the answer comes later: `বাজি ধরা হলো। ছয়টা কাজ একটা একটা করে চেষ্টা করবো, আর শেষে
  আপনার বাজিটা মিলিয়ে দেখবো।`
- **Every middle screen earns a piece of the answer**, and its opening line says which
  piece: `বাজির তিন নম্বর কাজ।` · `প্রমাণ জমানো শুরু হোক সামিনের 7 দিয়ে।` · `তিনজন হয়ে গেল,
  এখন নাসিবের পালা।` Objections from the cast are the cheapest way to turn a dry rule
  into a beat — each of 3.4's three rules of length is somebody refusing to accept the
  verdict.
- **The old way fails first.** 1.1's `JustWords` (describing it aloud), 2.3's `ListGuess`
  (300 meaningless numbers). Let the reader feel the need before the tool arrives.
- **Mischief, and an honest limit.** 1.1 breaks the reading order on purpose to expose a
  hidden assumption; 2.3 owns up to its own `≈` and to the words it quietly excludes;
  3.6's `BigSpender` shows the journey's own trick being the wrong move. Admitting the
  seam builds more trust than hiding it.
- **`এবার আপনার পালা`:** one late screen with no scaffolding, where the reader answers the
  journey's question themselves (2.3's `FindPair`, 3.4's `PrizeGiven`, 3.5's `PickTape`).
  Wrong tries bounce, so the numbers actually get read.
- **The last step closes the loop it opened**, by name: `## শেষ! বাজির ফলাফল` ·
  `## শেষ! সোমের ধাঁধা মিটলো` · `## শেষ! মামা ছবি নিয়ে বাড়ি গেলেন`. Then a short recap and
  one memorable rule (`list হিসেবে রাখুন, arrow হিসেবে ভাবুন`), then the bridge — and the
  bridge teases the *next* journey's question, not its topic.

**The usual skeleton** (8–11 steps; longer → split into a new journey):

| step | what is on it |
| --- | --- |
| 1 | the scene, the stake, the question. A prediction, sealed unmarked. |
| 2 | the obvious way, and it fails — or the simplest case, done by hand |
| 3…n−3 | one piece of the answer each, often a named character's objection |
| n−2 | `এবার আপনার পালা` — unaided; the reader answers the journey's question |
| n−1 | `## একটু ঝালিয়ে নিন` + `<Check>` |
| n | `## শেষ! <the loop closed by name>` — recap, one rule, `<LessonLink>` |

---

## 1 · Design rules (the author's standing feedback)

- Reader is **twelve and knows no school math.** Nothing is named before it is felt.
- Every idea follows: **tiny question → reader predicts → plays a small, countable case
  by hand → spots the pattern → predicts the big case → reveal.** The eureka comes from
  what they did, not from text.
- **Minimal prose; the story is told by the interaction.** Words around the widget: set
  up before, explain after. One or two lines of story before the widget — the scene and
  the question, never the answer. After it, `<Then>` holds the explanation, and it shows
  only once the screen is cleared, so it never spoils the task. Every step gets one.
- Feel the need before the tool (a sum too long to write → Σ). Teach notation on an
  everyday example first (roll numbers, আম্মুর বাজারের list).
- Everyday games for "why": dice totals, coin flips, peeling tiles, a radio knob.
- **Recurring cast:** Shiku (the class robot, walks the chalk grid), সামিন, সোম, ফাহিম,
  নাসিব, আম্মু, ডাক্তার আপা. Concrete local names, never "Object A / Object B".
- Widget text is spoken Bangla, never formula shorthand (§3).

---

## 2 · The voice

Prose that sounds like one person explaining something to a friend over tea. Not a
translated textbook, not a chatbot.

### 2.1 · Core feel

- **Talk to the reader as `আপনি`**, in relaxed spoken চলিত: `ধরেন`, `চলেন`, `দেখুন`,
  `খেয়াল করেছেন?`, `বলুন তো`.
- **Everyday spoken forms show up now and then:** `নাই` alongside `নেই`, and `যেয়ে`,
  `যেগুলা`, `দেই`, `করতেছে`, `গাধা কিসিমের`, `কেচালটা বাধলো`, `সুন্দর মতো`. Sprinkle them
  in; too many turns it into a caricature.
- **Short sentences, one idea per paragraph.** Paragraphs run 2–6 sentences. Punchy
  fragments are fine: `তবে সেটা অনুভূতির মাধ্যমে না। সংখ্যার মাধ্যমে।`
- **Light, dry humour, never forced:** `কম্পিউটার আসলে খুবই গাধা কিসিমের।`
- **Honest and understated.** No hype: `আমরা just measure করেছি। এতটুকুই।`

### 2.2 · How Bangla and English mix

Bangla carries the grammar (verbs, particles, sentence flow). English fills in the nouns
and technical terms, the way Bangladeshi tech people actually talk.

- **Technical terms stay in English (Latin script).** Never coin Bangla for them:
  vector, feature, dimension, pixel, grid, channel, representation, machine learning,
  binary, order, element. Never `যন্ত্র শিক্ষণ` or `মাত্রা`.
- **Never glue a translated adjective onto a noun.** English says "the average student",
  but `গড় ছাত্র`, `গড় customer`, `গড় মানুষ` are not phrases anyone says. Keep the English
  word and rebuild the sentence, usually with `average-এ` as an adverb: `আমাদের student-রা
  average-এ কেমন গড়নের`, `average গড়নের একজন`. Same for typical, standard, ideal. Test by
  ear. (`গড়` alone as noun or verb is fine: `উচ্চতাগুলোর গড়`, `দলের গড়ে সরান`.)
- **Casual English words also stay Latin:** guess, balance, data, just, example,
  classroom, height, weight, express, measure, count, pick, add, matter.
- **Fully naturalized loanwords go in Bangla script:** ফোন, কম্পিউটার, সার্চ, মেসেজ, বাল্ব,
  ক্লাস, কারেন্ট, লোডশেডিং.
- **Bangla suffixes attach to English words.** Hyphen in polished text, space in looser
  text; stay consistent within one piece: `lamp-টা`, `data-ও`, `pixel-এর`, `Order-টাই`.
- **English verbs become noun + করা/হওয়া/দেওয়া:** `express করা`, `count করতে পারবো`,
  `order matter করে`.
- **Capitalize an English word that opens a sentence:** `Binary-র আসল মজাটা…`,
  `Grid-টা আপনার কাছে একটা ছবি…`
- **Sometimes a whole English line lands the punch:** `Thirty-six million numbers!!!`
- **On a term's first appearance, give English + its Bangla sense:**
  `**pixel** (picture element-এর ছোট রূপ)`, `learn করতে হচ্ছে বা শিখতে হচ্ছে`.

**Numbers.** Bangla numerals for everyday counting in the story (`৫টা`, `৮টা row`,
`১ কোটি ২০ লাখ`); ASCII digits for machine values, data and anything inside a formula or
tuple (`0`, `255`, `(180, 78)`, `12 megapixel`). Counts inside Bangla screen text go
through `bn()`. Restate big results in Bangla words for impact:
`একটা ছবি মানে তিন কোটি ষাট লাখ সংখ্যা।`

**Punctuation.** End sentences with `।`. Bangla curly quotes `“ ”` for dialogue. `???`
and `!!!` only at the one or two peak moments of a piece.

### 2.3 · Transitions (instead of "Next, we will discuss")

`তাহলে প্রশ্ন দাঁড়ালো…` · `এবার…` · `আচ্ছা চলুন…` · `ছবির ব্যাপারটা তো বোঝা গেল।` ·
`এতক্ষণ তো খুব সুন্দর মতো… কিন্তু কেচালটা বাধলো…` · `এবার হিসাবটা করে ফেলা যাক।` ·
`আরেকটু ভেঙে বলি।` · `এখন আরেকটা শব্দের সাথে পরিচয় করিয়ে দেই।`

### 2.4 · What makes it sound robotic (avoid)

- সাধু or officialese Bangla: `নিম্নলিখিত`, `উক্ত`, `প্রদান করা হলো`, `পরিলক্ষিত হয়`,
  `এই নিবন্ধে আমরা শিখব…`.
- English sentence structure translated word-for-word into Bangla.
- Coined Bangla terms for technical words; or the inverse, English-heavy sentences where
  Bangla is just glue.
- Opening with a definition, or naming a concept before the reader has felt the problem.
- Bullet lists doing the explaining. Prose explains; bullets are rare, and a short recap
  list belongs only at the very end.
- A "সারসংক্ষেপ" after every section, or perfectly symmetrical sections.
- Over-explaining. Trust the reader and leave a puzzle: `কেন ঘর ছোট আর বেশি হলে ছবি
  পরিষ্কার হবে, নিজেরা ভেবে বের করবেন।`
- Emojis, hype (`অসাধারণ বিপ্লব!`), exclamation marks on ordinary sentences.
- Formula shorthand standing in for a sentence. `=`, `→`, `·` live inside formulas only.
- Explaining before the reader has played. The explanation goes after the screen, in
  `<Then>`.

### 2.5 · Before / after

Robotic:
> ভেক্টর হলো সংখ্যার একটি ক্রমযুক্ত তালিকা। নিম্নে একটি উদাহরণ প্রদান করা হলো।

The author's voice:
> ছবির ব্যাপারটা তো বোঝা গেল। এখন চলেন একটা classroom এর example দেওয়া যাক। ধরেন একটা
> classroom এর প্রত্যেকটা student এর height আমরা centimeter আর weight kg তে মাপবো। …
> এই representation টার কিন্তু একটা নাম আছে। নামটা হলো vector।

| Robotic | Spoken |
| --- | --- |
| `শেষ ঠিকানা = দুই হাঁটা জোড়া।` | `Card ১ হেঁটে Shiku যেখানে থামলো, card ২ শুরু হলো সেখান থেকেই। দুই হাঁটা জুড়ে শেষ ঠিকানা (4, 5)।` |
| `জোড়া ১/৩ · প্রথম card-কে বলি u` | `জোড়া ১/৩। নাম ছোট রাখতে প্রথম card-টাকে ডাকি u, দ্বিতীয়টাকে v।` |
| `u + v = (u₁ + v₁, u₂ + v₂)। ঘরে ঘরে যোগ।` | `প্রথম ঘরের সাথে প্রথম ঘর, দ্বিতীয়র সাথে দ্বিতীয়। Vector যোগ বলতে এতটুকুই।` |
| `150 cm + 12 বছর = ? সেন্টিমিটারের সাথে বছর যোগ হয় না।` | `150 cm-এর সাথে 12 বছর? উচ্চতার সাথে বয়স যোগ করে যে সংখ্যা আসবে, তার মানে কেউ জানে না।` |
| `✕ guess মেলেনি` | `✕ উল্টোটা হয়েছে` |

---

**Then the author's pass.** Voice rules alone don't stop a rewrite. Before a journey is
done, run every line through the **pathshala-voice** skill, which lists what the author
actually changes in AI drafts: plain English words people say, no assumed steps, the
story's own logic filled in, filler cut. Romanized Banglish typed into a file is the
author's own edit: convert it, don't rewrite it.

## 3 · Where each piece of text goes

Each slot has one job, all of it in the §2 voice: someone sitting beside the reader.

| Where | Its job | Example |
| --- | --- | --- |
| Setup (MDX, before the widget) | the scene + the question, 1–2 lines | `Shiku-র হাতে এমন দুইটা card। ও হাঁটা শুরু করার আগে বলুন তো, গুপ্তধন কোথায়?` |
| Caption (in the widget) | what to look at, or how to read it | `কাগজে পূর্ব মানে ডানে, উত্তর মানে ওপরে। আর card ২ পড়া শুরু হবে card ১ যেখানে থামে, সেখান থেকে।` |
| `Task` | the one thing to do, as a polite request | `আগে কাগজে tap করে একটা guess দিন, তারপর Shiku-কে হাঁটতে পাঠান।` |
| Result line / `Nope` | react to what *they* did; nudge toward the pattern, don't hand over the rule | `উঁহু, Shiku গিয়ে থামলো (6, 4)-এ, আর আপনার উত্তর ছিল (5, 4)। Card দুইটার সংখ্যাগুলোর দিকে আরেকবার তাকান তো।` |
| `Speech` | the character in their own voice | নাসিব: `আমার এই দুইটা card-ও একটু যোগ করে দাও না!` |
| `pass()` note | the eureka in 1–2 sentences; a formula may ride along but never replaces the sentence; fits the footer at phone width | `কে আগে পড়লো তাতে কিছু যায় আসে না: u + v = v + u। ঘরে ঘরে দেখলে 3 + 1 আর 1 + 3 তো একই।` |
| `<Then>` (MDX, after the widget) | the explanation, as story: 1–3 short paragraphs | below |
| `Check` children | why the right answer is right, and what the tempting wrong one did | `যারা (6, 4) বেছেছিলেন, তারা minus চিহ্নগুলো বাদ দিয়ে ফেলেছিলেন।` |

**The `<Then>` explanation** points at what the reader just saw (`খেয়াল করেছেন, …?`,
`Table-টার দিকে একবার তাকান।`), says *why* in everyday terms, names the idea last in
**bold**, and only then gives the formula. Good ingredients: a callback to an earlier
lesson or character (`২.২-এ … End − Start করতেন, সেটা আসলে এই বিয়োগই ছিল।`), where it
shows up in real ML, comfort for a common wrong guess (`যারা (4, 3) বেছেছিলেন, তারা একা
নন।`), a line that ticks off the journey's spine (`তার মানে দুই নম্বর কাজও শেষ`), and now
and then one question left open (`u − v আর v − u কি এক? নিজেই ভেবে দেখুন।`). Don't recount
the clicks or restate what the screen already shows.

**Rules of thumb for text inside a screen:**
- Full sentences ending in `।`.
- `আপনি` with polite imperatives: দেখান, দিন, মিলিয়ে নিন, tap করুন.
- Names over labels: `সামিনের card`, not `card v`.
- Tuple and card values stay Latin; counts in Bangla sentences go through `bn()`.

---

## 4 · MDX template

```mdx
export const metadata = {
  title: "Math for AI 2.9 — <Bangla title>",
  description: "<the journey's question, not its topic — one or two sentences>",
  type: "article",
};

{/* Told as a Brilliant-style journey, like 1.1 and 2.3: screen 1 asks
    <the question> and it is not answered until <Screen>, N screens later.
    Each screen opens by reacting to the last; the explanation sits in <Then>
    and shows only once the task is done. The screens live in
    components/interactive/<topic>-journey.tsx. */}

import { Journey, Step, Check, Then } from "@/components/journey/journey";
import { ScreenA, ScreenB } from "@/components/interactive/<topic>-journey";

<Journey title="Vector-এর দুই চেহারা · ২.৯">

<Step>

One or two lines of story: the scene, the stake, and the question this screen asks.

<ScreenA />

<Then>

What the reader just found, told as story: point at the pattern, say why, name it
last in **bold**, then the formula ($…$). A callback; maybe one open question.

</Then>

</Step>

<Step>

## একটু ঝালিয়ে নিন

<Check question="…" options={["…", "…", "…"]} answer={0} hint="…">

Why the right answer is right, and what the tempting wrong one did.

</Check>

</Step>

<Step>

## শেষ! <the opening loop closed by name>

The recap, and one memorable rule. Then the bridge: the *next* journey's question.

<LessonLink href="/dashboard/articles/math_for_ai/<next-slug>" eyebrow="পরের পাঠ" title="…">
  One line on why to go.
</LessonLink>

</Step>

</Journey>
```

MDX gotchas: blank lines around every `<Step>`, `<Check>`/`<Then>` child and component;
math is `$…$` / `$$…$$` (remark-math + KaTeX); a bare `{` in prose is a JS expression —
keep braces inside math; `LessonLink` and `Table` are global (no import); pipe tables
don't render, use `<Table head rows note />`; comments are `{/* */}`.

---

## 5 · Screen template

```tsx
// ---------------------------------------------------------------------------
// 3 · <What the screen does, and the discovery it is built for.>

const GUESS = ["…", "…", "…"];
const RIGHT = 1;

export function PeelFloor() {
  const pass = useGate();                                // locks Continue until pass()
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [peeled, setPeeled] = useSeed("peeled", false);  // useSeed = useState a preview can set

  const peel = () => {
    setPeeled(true);
    pass("খোসায় পড়লো 36টা tile, আর ভেতরে রয়ে গেল 8 × 8 = 64টা।"); // the eureka, spoken; shown by Continue
  };

  return (
    <>
      {/* the visual: SVG or divs, Tailwind only */}
      <div className="mt-4 text-sm font-medium text-muted">খোসায় কয়টা tile পড়বে, আন্দাজ করুন তো?</div>
      <div className="mt-2 grid gap-2">
        {GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, peeled, RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && !peeled && (
        <button type="button" onClick={peel} className={`${primaryBtn} ${FADE}`}>খোসা ছাড়ান</button>
      )}
      <Task done={peeled}>আগে একটা guess দিন, তারপর খোসাটা ছাড়িয়ে দেখুন।</Task>
    </>
  );
}

// at the bottom of the file: states for `npm run shot` (keys = useSeed names)
export const fixtures: Fixtures = {
  PeelFloor: { start: {}, peeled: { guess: 1, peeled: true } },
};
```

Use `useSeed` (not `useState`) for any state worth previewing; `usePlay`/`useTween` state
can't be seeded, so seed the state that drives them.

**A sealed prediction** (§0) is the one screen that must *not* mark the answer — use a
plain look instead of `predictLook`:

```tsx
look={bet === i ? "picked" : bet !== null ? "dim" : "idle"}
```

---

## 6 · The kit

`@/components/journey/journey` — `Journey({title})`, `Step`, `Task({done})` (the one thing
to do, ticked when done; pinned in the top bar wherever the screen puts it), `useGate()`
→ `pass(note?)`, `Check({question, options, answer, hint, praise})`, `Then` (the
explanation; in a Journey it gets its own screens after the task, outside one it shows
inline).

**The frame is one phone screen, fixed height** (the article page gives it the viewport):
top bar (× to library, progress, the pinned `Task`), the screen, bottom bar (pass note,
←, Continue). Progress is kept per browser in localStorage.

**Words are never trimmed to fit — a step becomes as many screens as it needs**, measured
on arrival:

| screens | what is on them |
| --- | --- |
| story | the setup paragraphs, if they don't fit beside the widget (the widget keeps the last ones that do). Centered, no `Task`, never locked. |
| widget | the widget, `Task` pinned in the top bar. The only screen that can lock Continue. |
| explanation | `<Then>`, once the task is done. Continue reads "ব্যাখ্যাটা দেখুন"; "← screen-টা আবার দেখুন" goes back to the widget, which keeps its state. |

Breaks fall between paragraphs; a heading stays with what follows, a `$$…$$` block with
what precedes. So write the story and the explanation at the length they need: what must
fit a phone is the **widget itself** (§7). Content a tap adds below the fold is scrolled
into view, as far as the tapped control stays on screen.

`@/components/journey/kit` —
- motion: `POP` (pop in), `FADE` (fade in) — class strings, animate on mount (key an
  element to replay); `Draw({d, delay, ms, strokeWidth, className})` self-drawing path.
- timing: `usePlay(ms)` → `{k, running, play(end, done?, from?)}` (counter stepped by a
  timer; `done` fires from the timer, safe for `pass`); `useCountUp(max, ms, on)`;
  `useTween(numbers[], ms, start?)` eased glide (a moving dot, a camera).
- chrome: `Choice({n, look, disabled, onClick})` + `predictLook(i, guess, over, answer)`;
  `Ticks({items: [label, done][]})` sub-goals; `Speech({who, initial, tint, tone})`
  character bubble; `Nope` (key it per miss); `Stepper({value, onChange, min, max,
  label})`; `primaryBtn`, `quietBtn`, `pill(on)` class strings; `Laptop`/`Out`.
- scenes: `useScene(steps, ms | ms[])` → `{k, steps, done, playing, stepping, play,
  step, byHand}`, beats 0…steps; `<Scene scene caption>` (or cast's `<StoryFrame>`) draws
  the controls, একবারে দেখুন and ধাপে ধাপে (আগের / পরের). It never starts on its own. Draw it
  phone-sized; the frame grows it on tablets and laptops (`GROW` / `GROW_WIDE`). See the
  pathshala-animate skill.
- previews: `useSeed(key, initial)`, `Fixtures`, `SeedProvider`.

`@/components/journey/plane` — graph paper in data units: `makeFrame(x0, x1, y0, y1, u,
pad=18)` → `f` with `f.sx(x)`, `f.sy(y)`, `f.u`; `<Plane f label grid axes ticks
drag={{down, move, up}} onKey className>`; `Arrow({f, from, to, tone, w, draw, dashed,
faint})`, `Label`, `Dot`, `Star`; helpers `snap`, `clamp`, `same`, `plus`, `minus`, `mix`,
`dist`, `sg` (real minus sign), `tup`, `INK`.

`./figure-kit` — `bn(n)` Bangla digits (for counts in Bangla text; keep math numbers
Latin). `./arrow-journey` — `Shiku`, `Trail`, `route`, `useWalk` (Shiku walking the grid).

**Animation.** Every journey gets animated story scenes in its setups and watch-only
figures in its `<Then>`s. How to make them (`useScene`/`Scene`, `cast.tsx`, the `story`
prop, sizes, gotchas) is in the **pathshala-animate** skill.

**Reference screens** (grep them by name for a pattern to copy):
sealed prediction that opens a journey: `NasibBet`, `PrizeRow` · the reader's own verdict,
wrong tries bounce: `PrizeGiven`, `PickTape` · predict → act → reveal: `TilePour`,
`SugarCube`, `DiceMany`, `TwoClues` · discover a rule into a table: `CoinArrows`,
`SlotAdd`, `WayBack` · numbered stage buttons: `GapNames`, `RoomCorner` · a slider that
gates at a threshold: `DotsBunch`, `BallSkin`, `LongSum` · a challenge that can't be won:
`NeverShrinks`, `WrongShape`, `BendIt`, `NoZero`, `BigSpender` · step a machine:
`BazaarSigma`, `WardFive`, `SumShrink` · drag on graph paper: `RuleVsTape`, `ShikuTape` ·
downhill steps: `OneKnob`, `KnobStep` · tap to reveal: `VectorLadder`, `SayItCards` ·
predict per item, then reveal: `StallMoney` · 3D pinhole view: `RoomCorner` · isometric:
`SugarCube` · seeded randomness: `rng()` in surprise-journey.

---

## 7 · Build rules and gotchas

- **Design the widget for a 375×667 phone, and only for it.** On a tablet or laptop the Journey zooms the widget for you (`GROW_WIDGET`: up to ×1.45, height-aware; see pathshala-animate §3). So don't add `sm:`/`lg:` size classes, and keep pointer maths as ratios of `getBoundingClientRect()`.
- **Phone size.** The widget's screen has ~460px (less the
  pinned Task, and a pass note once done), so a widget's visual + controls should fit in
  about 400px. Story paragraphs don't count: the frame moves them to their own screen.
  Put the visual first and its controls right under it, so what a tap changes is in view;
  prefer swapping a stage in place (guess → play → result) over stacking a new block
  under the old one. A screen that can't fit is two screens.
- Tailwind only, no global CSS; class names must be literal strings (map a key to a full
  class, never build `bg-cat-${x}`). Tailwind v4: `bg-linear-to-t`, `starting:`.
- Colours: theme tokens (`text-muted`, `bg-accent/10`, `text-cat-blue` …) for chrome;
  **fixed ink** (`fill-[#0f1b2d]`, white sheets) for drawn objects that are "paper".
- The Journey renders inside `.article`, whose `p`/`h1`/`h2` rules win — use `div`/`span`
  in screens.
- Monospace is for Latin numbers and formulas. Never set Bangla text in `font-mono`.
- ◀ ▶ and similar glyphs render as emoji on Linux: use − / + / → text.
- SVG labels near an edge: anchor inward (`textAnchor="end"` on the right) or clamp x.
- Add `motion-reduce:transition-none` to anything with a transition.
- Call `pass()` from handlers or `usePlay`'s `done`, never inside a state updater.
- Keep a label and its number together with `&nbsp;` (`card&nbsp;১`) where a caption wraps.
- Watch for name collisions: one `*-journey.tsx` file holds every screen, so module-level
  consts are shared (`MOVES` already taken → `TWO_MOVES`).

---

## 8 · Files and wiring checklist

- [ ] Lesson: `src/content/articles/math_for_ai/<nn><letter>_<slug>.mdx` (filename = slug).
- [ ] Screens: `src/components/interactive/<topic>-journey.tsx`, `"use client"`, one file
      per journey (new journeys get a new file). Number the section comments (`// 3 · …`)
      in journey order; renumber if you insert one.
- [ ] Screen 1 asks the journey's question and does not answer it (§0).
- [ ] Every step has a setup line or two, its screen, and a `<Then>` explanation.
- [ ] Add the slug to `math_for_ai.items` in `src/content/courses.ts`, in order.
- [ ] Previous journey's last step ends with a `<LessonLink>` to this one; this one's last
      step links to the next (or the series finale says "সাতটা lesson…"). Don't link a
      slug that doesn't exist yet: bridge in words and say so to the user.
- [ ] Tell the user: a new slug is **draft** in the DB until they publish it.
- [ ] `npm run check`, then `npm run shot` on the screens you changed (§9).

---

## 9 · Verify (cheaply)

```
npm run check                                   # tsc + ESLint on changed files + every MDX compiles
npm run shot -- <file> Screen[:state] ...       # PNGs in .shots/<file>/, one per state
npm run shot -- <file> --list                   # screens and their fixture states
npm run shot -- <file> Screen --dark            # dark theme
```

`shot` needs no dev server and no login. Read only the PNGs for screens you changed, and
check the reported height against the ~460px budget (§7). Motion is reduced in shots, so
every state is shown settled. It renders the screen component alone, so the MDX prose and
`<Then>` aren't in the picture.

---

## 10 · Spec format (ask the user for this when a journey is vague)

```
2.9 — <title>
Question: <the one thing screen 1 asks and the last screen answers, with its stake>
Story:    <who, where, what's at stake>
1. <Screen> — question → what the reader does → eureka (the pass note, spoken)
   Then: <what the explanation adds: the name, the formula, a callback, an open question>
2. …
n. <Screen> — এবার আপনার পালা: the reader answers the question unaided
```
