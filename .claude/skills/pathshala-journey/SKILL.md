---
name: pathshala-journey
description: Build or revise a Pathshala "journey" lesson — Brilliant-style, one screen at a time, at most 11 steps (Math for AI 1.x onward). Each journey is a story set in everyday Bengali life, told in plain English, and carried by three kinds of motion — animated story scenes, interactive animations the reader drives, and exercises the reader answers by acting on a picture. Covers the spine a journey needs, the 11-step budget, the voice, the screen components, the kit API, wiring and verification. Use whenever a task touches src/content/articles/math_for_ai/*.mdx journeys or src/components/interactive/*-journey.tsx, including writing, rewriting, shortening, splitting or porting an older Bangla journey, the <Then> explanations, and the short words inside screens (captions, tasks, feedback, speech bubbles, pass notes).
---

# Pathshala journeys

A journey is an MDX article whose body is `<Journey><Step>…</Step>…</Journey>`: one
screen at a time, each with one interactive screen component and one thing to do; the
Continue arrow stays locked until the screen calls `pass()`.

**The goal is that the concept becomes easy to grasp.** Everything below serves that: a
story the reader cares about, motion that shows what the words say, and hands-on play
that lets the reader find the idea before it is named.

**What every journey is:**

- **A story set in Bengali life, told in plain English.** The readers are Bengali. The
  scenes are theirs: a school in a Bangladeshi town, the haat, a tea stall, a rickshaw
  ride, cricket on the field, load-shedding, Pohela Boishakh, a launch on the river. The
  language is English, simple enough for a Bengali twelve-year-old reading in their
  second language (§2).
- **Backed by three kinds of motion** (§1.1): an animated **story scene** that acts out
  the setup, an **interactive animation** the reader drives to discover the idea, and a
  **watch-only figure** in the explanation. Exercises are **visual** too: the reader
  answers by tapping, dragging or picking a picture, not by reading a list of text
  options (§3.2).
- **At most 11 steps. Hard cap.** Every `<Step>` counts: the recall at the door, checks,
  the exercise and the ending. When a journey wants a twelfth step, it is two journeys.
  Planning an article means cutting it into **as many journeys as it honestly holds**,
  one "aha" each (`pathshala-journey-plan`).

**The model journeys** are **1.1** (`01c_image_numbers.mdx` + `image-journey.tsx`) and
**2.3** (`02c_king_queen.mdx` + `word-journey.tsx`) — the author's own pick. Their words
are Bangla (the course was Bangla until now): read one for **structure, pacing and
screen craft** (what each screen asks, when the reveal lands, how short the prose runs),
never for wording. 3.1 (`03a_treasure_add.mdx` + `treasure-journey.tsx`) is a good
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
  If the hook dies on screen 1, the rest has nothing pulling it.
- **Seal the reader's guess.** A prediction screen that locks a bet in and refuses to
  mark it (`NasibBet`, `PrizeRow`) buys real suspense. `pass()` says the bet is sealed
  and the answer comes later: *"Bet sealed. We'll check it at the end."*
- **Predict-first is rationed: 2 screens per journey, the sealed bet included** (3 at
  most in an 11-step journey). A guess only works when the reader commits to something
  that *might be wrong*. When every screen opens with "take a guess first", it costs
  nothing and by the third one it's just a tap. Spend the guesses where the obvious
  answer is wrong: the opening hook, or the moment a pattern flips (3.7 `Yardstick`:
  18 cm turns out to be the *big* gap). **Every other screen goes straight to doing**:
  the controls show at once, and the `Task` says what to do and what to watch (*"Write
  the weight in all four units and see which one is the twin."*). Don't put a guess on:
  - a calculation whose answer is easy to see coming;
  - the second case of a pattern already shown;
  - a question the reader can settle by just pressing the buttons;
  - the simplest case done by hand.

  A wrong option that teaches something needn't be lost: say it as one plain sentence in
  the result line or the `<Then>` (*"Add the two slots straight and you'd get 1.4 — but
  that's how far Samin walked."*).
- **Every middle screen earns a piece of the answer**, and its opening line says which
  piece: *"Job three of the bet."* · *"Three down — now it's Nasib's turn."* Objections
  from the cast are the cheapest way to turn a dry rule into a beat.
- **The old way fails first.** 1.1's `JustWords` (describing it aloud), 2.3's
  `ListGuess` (300 meaningless numbers). Let the reader feel the need before the tool
  arrives.
- **Mischief, and an honest limit.** 1.1 breaks the reading order on purpose to expose a
  hidden assumption; 2.3 owns up to its own `≈`. Admitting the seam builds trust.
- **"Your turn":** one late screen with no scaffolding, where the reader answers the
  journey's question themselves (2.3's `FindPair`, 3.4's `PrizeGiven`). Wrong tries
  bounce, so the numbers actually get read.
- **The last step closes the loop it opened**, by name: `## The end! The bet is settled` ·
  `## The end! Mama goes home with the photo`. Then a short recap, one memorable rule,
  and the bridge — which teases the *next* journey's question, not its topic.

**The skeleton — 11 steps at most:**

| step | what is on it | motion |
| --- | --- | --- |
| 1 | the scene, the stake, the question; a prediction, sealed unmarked. May open with a one-line recall of the last journey (§0.1). | story scene + the bet |
| 2 | the obvious way, and it fails — or the simplest case, done by hand | interactive animation |
| 3…7 | one piece of the answer each, often a named character's objection | story scene (if the setup is a scene) + interactive animation + figure in `<Then>` |
| 8 | **Your turn** — unaided; the reader answers the journey's question | interactive, wrong tries bounce |
| 9 | **Try it** — a visual exercise on a new case (§3.2) | the reader acts on a picture |
| 10 | `## The end! <the loop closed by name>` — recap, one rule, `<LessonLink>` | a closing story scene |

That is 10; the 11th slot is spare — a second middle piece, or one retrieval exercise
(§0.1). A journey can be shorter (7–8 steps is fine) as long as it still has a question,
a failed old way, the pieces, *Your turn* and the ending. **A journey that needs more
than 11 steps is carrying two ideas: split it** (and update the spec). Don't squeeze by
cramming two ideas into one step or one `<Then>` — that just moves the overload.

---

### 0.1 · Practice inside the budget

A journey that checks only once, at the end, never finds out whether last week's idea
stuck. But practice spends steps, so it is lean:

- **Recall at the door, folded into step 1.** One line of setup that calls back the
  previous journey inside today's scene (*"Fahim still has last week's box…"*), or — if
  the budget allows — a single visual recall exercise as step 1 with the hook on step 2.
  It must not hint at today's answer.
- **At most one retrieval exercise mid-journey**, on an idea from an *earlier* journey,
  placed right before the screen whose setup already calls back to it. Only if a step is
  free under the cap.
- **The "Try it" exercise near the end is required** (§3.2): a new case of today's idea,
  answered by acting on a picture.
- Never place practice where its answer gives away the next screen's prediction or the
  journey's question.

## 1 · Design rules (the author's standing feedback)

- Reader is **twelve and knows no school math.** Nothing is named before it is felt.
- Every idea follows: **tiny question → plays a small, countable case by hand → spots
  the pattern → reveal.** The eureka comes from what they did, not from text.
- **Minimal prose; the story is told by the animation and the interaction.** One or two
  lines of story before the widget — the scene and the question, never the answer. After
  it, `<Then>` holds the explanation, and it shows only once the screen is cleared, so it
  never spoils the task. It fits **about one phone screen** (§3.1).
- Feel the need before the tool (a sum too long to write → Σ). Teach notation on an
  everyday example first (roll numbers, Ammu's bazaar list).
- Everyday games for "why": dice totals, coin flips, peeling tiles, a radio knob, a
  carrom striker, a kite string.
- **Recurring cast:** Shiku (the class robot, walks the chalk grid), Samin, Som, Fahim,
  Nasib, Ammu, Dr. Apa, Mama, Rina, Karim. Concrete Bengali names, never "Object A /
  Object B", never swapped for Western names.
- Widget text is spoken English, never formula shorthand (§3).
- **The reader sees the action and its effect at the same time.** Whatever a tap changes
  must be on screen, next to the button, when the tap lands, with no scrolling. The author
  has had to ask for this more than once. Lay out every widget by §7 "Action and effect
  in one view".

### 1.1 · Every step moves

A step is not done until something on it moves. For each step, fill these three slots,
in this order of priority:

| slot | where | what it is | how |
| --- | --- | --- | --- |
| **Interactive animation** | the widget | the reader drives it: drags, taps, steps a machine, pours, walks Shiku — and watches the result animate. The discovery happens here. | the screen component (§5, §6) |
| **Story scene** | the setup, before the widget | a small cartoon of the setup: the cast walks in, someone makes a claim, the problem turns up. Watch-only. | `StoryFrame` + `Stage`, written with `story` (`pathshala-animate`) |
| **Explanation figure** | inside `<Then>` | acts out the explanation: the pattern replayed calmly, the formula built slot by slot, a callback. Watch-only. | `Scene` (`pathshala-animate`) |

Every step has an interactive animation. Every step whose setup describes a scene gets a
story scene. Every `<Then>` gets a figure (at most two). A step with only text and a
multiple-choice list is a sign the idea hasn't been turned into something to *do* yet.
How to build scenes and figures is in the **pathshala-animate** skill.

---

## 2 · The voice

Prose that sounds like one person explaining something to a friend over tea. Not a
textbook, not a chatbot, not a corporate e-learning script. The readers are Bengali and
read English as a second language, so the English is **plain**.

### 2.1 · Core feel

- **Talk to the reader as "you"**, relaxed and spoken: *"say"*, *"let's"*, *"look"*,
  *"notice that?"*, *"have a go"*.
- **Short sentences, one idea per paragraph.** Aim for sentences under ~15 words.
  Paragraphs run 2–5 sentences. Punchy fragments are fine: *"But not through feelings.
  Through numbers."*
- **Contractions:** *it's*, *that's*, *doesn't*, *we'll*. Written-out forms sound like a
  textbook.
- **Light, dry humour, never forced:** *"The computer, truth be told, is a bit of a
  donkey."*
- **Honest and understated.** No hype: *"We just measured it. That's all."*

### 2.2 · Plain English for a Bengali reader

- **Common words only.** If a class-seven student in Dhaka wouldn't know the word, use a
  simpler one: *use*, not *utilize*; *work out*, not *compute*; *about*, not
  *approximately*; *so*, not *therefore*.
- **No Western idioms or culture.** No *ballpark*, *touchdown*, *piece of cake*, *hit it
  out of the park*, Thanksgiving, snow days, dollars, miles, lemonade stands. Use taka,
  kilometres, cricket, sherbet, the monsoon.
- **Few phrasal verbs and no slang.** *Find*, not *figure out*; *give up*, *line up* are
  fine; *suss out*, *gonna*, *kinda* are not.
- **Spelling is British** (maths, colour, centimetres, metres), as Bangladeshi schools
  teach it, and consistent within a journey.
- **Technical terms stay plain English:** vector, pixel, dimension, grid, channel,
  representation, binary, order, element. Never coin a cute synonym. On first appearance,
  give the plain sense in a few words: *"**pixel** (short for picture element)"*.

### 2.3 · The world is Bengali

- **Names in Latin script:** Shiku, Samin, Som, Fahim, Nasib, Ammu, Dr. Apa, Mama. Never
  translate a name into a role ("Auntie", "the doctor"). Family words stay (*Ammu*,
  *Mama*, *Apa*, *Bhaiya*); gloss once only if the scene doesn't make it clear.
- **Local everyday words stay local:** sherbet, tiffin, the bazaar, the haat, fuchka,
  rickshaw, CNG, launch, load-shedding, Pohela Boishakh. Use them freely; gloss in three
  words at first use only if context doesn't carry it. Don't turn the sherbet stall into
  a lemonade stand.
- **Stakes the reader has lived:** a class prize, a cricket match, sharing a tiffin box,
  a bill at the tea stall, a power cut during exams, a shopkeeper who won't give change.
- **Numbers are ASCII digits everywhere** (*5 rows*, *36 million*, *(180, 78)*). Money is
  in taka (*৳40* or *40 taka*). Never call `bn()` in a new screen. Restate big results in
  words for impact: *"One picture: thirty-six million numbers."*
- **Punctuation.** Sentences end in a period. Curly quotes `“ ”` for dialogue. `???` and
  `!!!` only at the one or two peak moments of a piece.

### 2.4 · Transitions (instead of "Next, we will discuss")

*"So now the question is…"* · *"Alright, now…"* · *"That settles the pictures."* ·
*"Everything was going nicely… and then trouble."* · *"Let's do the sum now."* · *"Let me
break it down a bit more."* · *"Time to meet another word."*

### 2.5 · What makes it sound robotic (avoid)

- Formal English: *"It can be observed that"*, *"the following example"*, *"In this
  article, we will learn…"*, *"utilize"*, *"in order to"*.
- Opening with a definition, or naming a concept before the reader has felt the problem.
- Bullet lists doing the explaining. Prose explains; a short recap list belongs only at
  the very end.
- A summary after every section, or perfectly symmetrical sections.
- Over-explaining. Trust the reader and leave a puzzle: *"Why smaller squares mean a
  clearer picture — work that one out yourself."*
- Emojis, hype (*"an amazing revolution!"*), exclamation marks on ordinary sentences.
- Formula shorthand standing in for a sentence. `=`, `→`, `·` live inside formulas only.
- Explaining before the reader has played. The explanation goes after the screen, in
  `<Then>`.

### 2.6 · Before / after

Robotic:
> A vector is an ordered list of numbers. An example is provided below.

The author's voice:
> So the picture part is settled. Now let's take a classroom. Say we measure every
> student's height in centimetres and weight in kilograms. … This list has a name, by
> the way. It's called a **vector**.

| Robotic | Spoken |
| --- | --- |
| `Final position = sum of the two walks.` | `Shiku stopped where card 1 ended — and that's exactly where card 2 begins. Two walks joined, final address (4, 5).` |
| `Pair 1/3 · call the first card u` | `Pair 1 of 3. To keep the names short, let's call the first card u and the second v.` |
| `u + v = (u₁ + v₁, u₂ + v₂). Addition is component-wise.` | `First slot with first slot, second with second. That's all vector addition means.` |
| `150 cm + 12 years = ? Units cannot be added.` | `150 cm plus 12 years? Nobody knows what that number means. Not even the calculator.` |
| `✕ guess did not match` | `✕ the other way round` |

**Then the author's pass.** Voice rules alone don't stop a rewrite. Before a journey is
done, run every line through the **pathshala-voice** skill: the edits the author actually
makes to AI drafts — words people say, no assumed steps, the story's own logic filled
in, filler cut.

### 2.7 · Porting an older Bangla journey

Journeys 1.x–4.x were written in Bangla. Porting one means two jobs:

- **Translate the author's sentences, don't rewrite them.** Every beat, wrong option and
  pass note carries across. Translate the feel, not the words: a spoken Bangla idiom
  becomes the plain English a kid would use (*কেচালটা বাধলো* → "and then trouble").
- **Mechanics:** `।` → `.`; `bn()` → ASCII digits; Bangla-script loanwords (ফোন,
  কম্পিউটার) → phone, computer; names to Latin script. Keep the world: sherbet stays
  sherbet, Ammu stays Ammu.
- **Fit the cap.** If the old journey has more than 11 steps, don't cram: propose a
  split into two journeys (each with its own question) and get the author's OK.
- **Add the motion it lacks** (§1.1): old journeys often have text-only checks; turn the
  end check into a visual exercise (§3.2).
- Then run `pathshala-voice` over the result as you would a fresh journey.

---

## 3 · Where each piece of text goes

Each slot has one job, all of it in the §2 voice: someone sitting beside the reader.

| Where | Its job | Example |
| --- | --- | --- |
| Setup (MDX, before the widget) | the scene + the question, 1–2 lines | `Shiku has two cards like this. Before he starts walking — where's the treasure?` |
| Caption (in the widget) | what to look at, or how to read it | `On paper, east means right and north means up. And card 2 starts wherever card 1 stops.` |
| `Task` | the one thing to do, as a friendly request, plus what to watch | `Turn all four units and match the two distances.` · predict screen: `Tap a guess on the paper first, then send Shiku walking.` |
| Result line / `Nope` | react to what *they* did; nudge toward the pattern, don't hand over the rule | `Nope — Shiku stopped at (6, 4), and you said (5, 4). Look at the numbers on the two cards once more.` |
| `Speech` | the character in their own voice | Nasib: `Add these two cards of mine too, will you!` |
| `pass()` note | **one line** (≤ ~44 visible characters): the thing the reader will remember, not a retelling | `u + v = v + u — order doesn't matter.` · `Change the unit, change the twin.` |
| `<Then>` (MDX, after the widget) | the explanation, as story: 1–2 short paragraphs and 1–2 figures, one phone screen (§3.1) | below |
| Exercise feedback | why the right answer is right, and what the tempting wrong one did | `Those who picked (6, 4) dropped the minus signs.` |
| `SideQuest` title | what's inside, as a short noun phrase | `Mars Climate Orbiter: right numbers, wrong unit` |

**The `<Then>` explanation** points at what the reader just saw (*"Notice how…"*),
says *why* in everyday terms, names the idea last in **bold**, and only then gives the
formula. Good ingredients: a callback to an earlier lesson or character, where it shows
up in real ML, comfort for a common wrong guess (with the reason it was tempting), a line
that ticks off the journey's spine (*"so that's job two done"*), and now and then one
question left open. Don't recount the clicks or restate what the screen already shows.

**Rules of thumb for text inside a screen:**
- Full sentences ending in a period.
- "You" with friendly imperatives: look, try it, match them, tap.
- Names over labels: `Samin's card`, not `card v`.
- Values and tuples in ASCII digits.

### 3.1 · One screen per explanation

Attention peaks right after the reader solves something and drops fast. A `<Then>` that
runs for several screens puts the most reading where attention is lowest. So:

**The budget.** A `<Then>` is about one phone screen: **1–2 short paragraphs, ≤ ~80
words, and 1–2 figures.** With no figure, up to ~100 words. No `<Table>` in a `<Then>`.
`tools/then-audit.py` measures this (§9).

**Over budget → move it, in this order:**

1. **Let the figure say it.** A paragraph that describes a pattern can often become a
   beat of the explanation figure, with its sentence as the beat's caption.
2. **Side quest.** Anything the step's idea doesn't need goes in a `<SideQuest>` card
   (below).
3. **A follow-up step** — only if a step is free under the 11 cap: a setup line reacting
   to the last screen, a visual exercise (§3.2) or a self-closing `<Check>` whose answer
   is the second idea, then a `<Then>` carrying on with the original words.
4. **Otherwise it is a second journey's idea.** Put it in the spec's next journey rather
   than stretching this one.

Rules for a follow-up question: 3 options, one of them the tempting slip; vary where the
right answer sits; `hint` nudges (a question back, a callback), it doesn't answer;
`praise` is the eureka as a one-line pass note, never *"That's correct!"*; never ask for
a name the reader hasn't met; never let it answer the journey's question early.

**Side quests go in a `<SideQuest>` card, not in the explanation.** A side quest is
anything the step's idea doesn't need in order to be understood: a real-world story
(Mars Climate Orbiter), a reference table, a look-ahead (*"no need to worry about that
yet"*), a code gotcha (NumPy `u * v` vs `u @ v`), a list of more uses. Keep in the
`<Then>`: the name, the formula, the callback, the one ML sighting that pays off the
step, and the line that ticks off the spine.

**Revising an existing journey: move, never lose.** When you split or fold, the author's
words are moved, not rewritten. Only the new setup lines and question text are yours.
Back up the MDX first and diff after (§9), and use `tools/split_then.py` so no text gets
retyped.

### 3.2 · Exercises are visual

An exercise is where the reader proves the idea to themselves, so it should look like
the idea, not like a quiz form. The reader **answers by acting on a picture**:

| kind | the reader… | example |
| --- | --- | --- |
| **tap the picture** | taps the right dot, arrow, bar or cell on a drawing | tap the stall the two arrows point to |
| **drag to answer** | drags a dot, an arrow tip or a slider until it matches | drag Shiku's arrow so it ends at the treasure |
| **pick a picture** | chooses between 3 small drawings (not 3 strings) | which of these three arrows is `2 × v`? |
| **build it** | sets numbers with `Stepper`s and watches the drawing follow, until it matches a target | make the sherbet dot land on the line |
| **spot the mistake** | taps the step where a character's worked sum goes wrong | Nasib's bill: which line is wrong? |

Rules:
- **The feedback is visual too.** A wrong try animates what the reader's answer *would*
  mean (the arrow goes to the wrong stall), with a `Nope` line; the right one plays the
  confirming animation and calls `pass()`.
- **A new case, not a replay.** Different numbers, often a different corner of the same
  story. Same idea.
- **Wrong tries bounce, never lock.** The reader tries again until right.
- **3 choices** when choosing; the right one not always first; one choice is the
  tempting slip.
- The text-only `<Check>` is kept for a pure *why* question, and even then put a small
  figure (a `story` scene) above it so there's a picture to reason from.

Build an exercise as a screen component like any widget (§5). A picture-choice uses
`Choice` with an SVG as its children.

---

## 4 · MDX template

```mdx
export const metadata = {
  title: "Math for AI 2.9 — <English title>",
  description: "<the journey's question, not its topic — one or two sentences>",
  type: "article",
};

{/* Told as a Brilliant-style journey, like 1.1 and 2.3: screen 1 asks
    <the question> and it is not answered until <Screen>, N screens later.
    <N ≤ 11> steps. Each screen opens by reacting to the last; the explanation
    sits in <Then> and shows only once the task is done, one phone screen
    each. The screens live in components/interactive/<topic>-journey.tsx. */}

import { Journey, Step, Check, Then, SideQuest } from "@/components/journey/journey";
import { ArriveScene, ScreenA, FigA, TryIt } from "@/components/interactive/<topic>-journey";

<Journey title="Two faces of a vector · 2.9">

<Step>

One or two lines of story: the scene, the stake, and the question this screen asks.

<ArriveScene story />

<ScreenA />

<Then>

What the reader just found, told as story: point at the pattern, say why. Name it last
in **bold**, then the formula ($…$). One idea, one screen.

<FigA />

<SideQuest title="A short noun phrase for what's inside">

A real-world story, a reference table or a look-ahead, with its figure if it has one.

</SideQuest>

</Then>

</Step>

<Step>

## Try it

One line of story setting up the new case.

<TryIt />

<Then>

Why the right answer is right, and what the tempting wrong one did.

</Then>

</Step>

<Step>

## The end! <the opening loop closed by name>

<ClosingScene story />

The recap, and one memorable rule. Then the bridge: the *next* journey's question.

<LessonLink href="/dashboard/articles/math_for_ai/<next-slug>" eyebrow="Next lesson" title="…">
  One line on why to go.
</LessonLink>

</Step>

</Journey>
```

MDX gotchas: blank lines around every `<Step>`, `<Check>`/`<Then>` child and component;
math is `$…$` / `$$…$$` (remark-math + KaTeX); a bare `{` in prose is a JS expression —
keep braces inside math; `LessonLink` and `Table` are global (no import); pipe tables
don't render, use `<Table head rows note />`; comments are `{/* */}`. In a `<Step>`, the
first component *without* `story` is the widget.

---

## 5 · Screen templates

### A predict screen (one of the journey's 2)

For every other screen, leave out `GUESS`/`guess`/`Choice`: show the controls from the
start and let the `Task` name what to do and what to watch.

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
    pass("36 tiles came off — 8 × 8 = 64 stayed."); // the eureka, spoken; shown by Continue
  };

  return (
    <>
      {/* the visual first: SVG or divs, Tailwind only; it animates when peeled */}
      {guess !== null && !peeled && (
        <button type="button" onClick={peel} className={`${primaryBtn} ${FADE}`}>Peel it off</button>
      )}
      <div className="mt-4 text-sm font-medium text-muted">How many tiles will come off?</div>
      <div className="mt-2 grid gap-2">
        {GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, peeled, RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={peeled}>Guess first, then peel it and see.</Task>
    </>
  );
}
```

**A sealed prediction** (§0) is the one screen that must *not* mark the answer — use a
plain look instead of `predictLook`:

```tsx
look={bet === i ? "picked" : bet !== null ? "dim" : "idle"}
```

### A visual exercise (§3.2)

```tsx
// ---------------------------------------------------------------------------
// 9 · Try it: which arrow is 2 × v? Picked as a picture; a wrong pick walks
// Shiku along it so the reader sees where it really goes.

const X9_ARROWS: [number, number][] = [[4, 2], [2, 4], [4, 4]];
const X9_RIGHT = 0;

export function TryDouble() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const choose = (i: number) => {
    setPick(i);
    if (i === X9_RIGHT) pass("Double v: both slots double.");
    else setMiss((m) => m + 1);
  };
  return (
    <>
      {/* the plane shows v, and the picked arrow drawn (and walked) on top of it */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X9_ARROWS.map((a, i) => (
          <Choice key={i} n={i} look={pick === i ? (i === X9_RIGHT ? "right" : "wrong") : "idle"} onClick={() => choose(i)}>
            {/* a small SVG of arrow a, not a string */}
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== X9_RIGHT && <Nope key={miss}>That one goes to ({tup(X9_ARROWS[pick])}). Is each slot twice v's?</Nope>}
      <Task done={pick === X9_RIGHT}>Pick the arrow that is twice Samin's.</Task>
    </>
  );
}

// at the bottom of the file: states for `npm run shot` (keys = useSeed names)
export const fixtures: Fixtures = {
  PeelFloor: { start: {}, peeled: { guess: 1, peeled: true } },
  TryDouble: { start: {}, wrong: { pick: 1 }, right: { pick: 0 } },
};
```

Use `useSeed` (not `useState`) for any state worth previewing; `usePlay`/`useTween` state
can't be seeded, so seed the state that drives them. Check the `Choice` look names in
kit.tsx before copying.

---

## 6 · The kit

`@/components/journey/journey` — `Journey({title})`, `Step`, `Task({done})` (the one thing
to do, ticked when done; pinned in the top bar wherever the screen puts it), `useGate()`
→ `pass(note?)`, `Check({question, options, answer, hint, praise})` (text options only —
for visual exercises write a screen, §3.2), `Then` (the explanation; in a Journey it gets
its own screens after the task, outside one it shows inline), `SideQuest({title})` (a
one-line card inside a `<Then>`; a tap opens its children in a `<dialog>` sheet, so it
never lengthens an explanation. Use it only inside a `<Then>`).

**The frame is one phone screen, fixed height** (the article page gives it the viewport):
top bar (× to library, progress, the pinned `Task`), the screen, bottom bar (pass note,
←, Continue). Progress is kept per browser in localStorage, so a reload lands on the same
screen. A locked Continue still answers a tap: it says what to do and shakes the `Task`,
so every gated screen needs a `Task`. After the last screen, the frame's own ending
opens: ✓, the pass notes as a recap (text notes only, so keep `pass()` notes plain
strings), and the next lesson in the course from `courses.ts`. The MDX's last step still
closes the loop in words (§0).

**Known gap — the frame's chrome is Bangla.** The Continue labels ("ব্যাখ্যাটা দেখুন",
"শেষ করুন"), the locked-Continue message, the ending screen, the `Scene` controls
("একবারে দেখুন" / "আগের" / "পরের"), `Check`'s default praise and the cast's under-feet
name labels (`CAST[who].name` in `cast.tsx`) are hardcoded Bangla. Until those take
English labels, an English journey ships with a few Bangla buttons. Work with it:
`Speech` takes any `who` string — pass "Nasib" — and leave `<Person label>` off, naming
characters in the caption instead. **Say so to the user when handing over a journey**;
localizing the chrome is a separate code task, never a silent one.

**Words are never trimmed to fit — a step becomes as many screens as it needs**, measured
on arrival:

| screens | what is on them |
| --- | --- |
| story | the setup paragraphs and `story` scenes, if they don't fit beside the widget. Centered, no `Task`, never locked. |
| widget | the widget, `Task` pinned in the top bar. The only screen that can lock Continue. |
| explanation | `<Then>`, once the task is done; the back arrow returns to the widget, which keeps its state. |

Breaks fall between paragraphs; a heading stays with what follows, a `$$…$$` block with
what precedes. What must fit a phone is the **widget itself** (§7). What can't be split
(one widget, one figure) is zoomed down to fit, to ×0.7 at most; past that it scrolls,
so still design the widget to fit. `Plane` never draws taller than 44svh.

`@/components/journey/kit` —
- motion: `POP` (pop in), `FADE` (fade in) — class strings, animate on mount (key an
  element to replay); `Draw({d, delay, ms, strokeWidth, className})` self-drawing path.
- timing: `usePlay(ms)` → `{k, running, play(end, done?, from?)}` (counter stepped by a
  timer; `done` fires from the timer, safe for `pass`); `useCountUp(max, ms, on)`;
  `useTween(numbers[], ms, start?)` eased glide (a moving dot, a camera). These are what
  make a widget an *interactive animation*: the reader's tap starts a play or a glide.
- chrome: `Choice({n, look, disabled, onClick})` + `predictLook(i, guess, over, answer)`;
  `Ticks({items: [label, done][]})` sub-goals; `Speech({who, initial, tint, tone})`
  character bubble; `Nope` (key it per miss); `Stepper({value, onChange, min, max,
  label})`; `primaryBtn`, `quietBtn`, `pill(on)` class strings; `Laptop`/`Out`.
- scenes: `useScene(steps, ms | ms[])` + `<Scene scene caption>` (or cast's
  `<StoryFrame>`) for watch-only story scenes and figures. See `pathshala-animate`.
- previews: `useSeed(key, initial)`, `Fixtures`, `SeedProvider`.

`@/components/journey/plane` — graph paper in data units: `makeFrame(x0, x1, y0, y1, u,
pad=18)` → `f` with `f.sx(x)`, `f.sy(y)`, `f.u`; `<Plane f label grid axes ticks
drag={{down, move, up}} onKey className>`; `Arrow({f, from, to, tone, w, draw, dashed,
faint})`, `Label`, `Dot`, `Star`; helpers `snap`, `clamp`, `same`, `plus`, `minus`, `mix`,
`dist`, `sg` (real minus sign), `tup`, `INK`.

`./figure-kit` — `bn(n)` Bangla digits: only in the older Bangla journeys; new screens use
ASCII digits. `./arrow-journey` — `Shiku`, `Trail`, `route`, `useWalk` (Shiku walking the
grid).

**Reference screens** (grep them by name for a pattern to copy — their inner text is
Bangla; copy the interaction, write English words):
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

- **Design the widget for a 375×667 phone, and only for it.** On a tablet or laptop the
  Journey zooms the widget for you (`GROW_WIDGET`: up to ×1.45, height-aware; see
  pathshala-animate §3). So don't add `sm:`/`lg:` size classes, and keep pointer maths as
  ratios of `getBoundingClientRect()`.
- **Phone size.** The widget's screen has ~460px (less the pinned Task, and a pass note
  once done), so a widget's visual + controls should fit in about 400px. Put the visual
  first and its controls right under it; prefer swapping a stage in place (guess → play →
  result) over stacking a new block under the old one. A screen that can't fit is two
  screens — and under the 11 cap, possibly two journeys.
- **Action and effect in one view.** Before writing the JSX, list what each button
  changes (a dot, a dial, a number, a bar, a card). All of it must be visible, next to
  the button, on a 375px phone. The order that works:

  ```
  visual (Plane / svg / cards)      ← what moves
  controls                          ← right under it, touching
  live readout / short caption      ← the number that changed
  growing blocks, verdict cards     ← anything that gets longer as the reader steps
  question + <Choice> list          ← a guess, once made, is done and can sit lowest
  Ticks
  ```

  The traps, all found in real journeys:
  - **Two visuals split by the graph.** Dials above the Plane and the step button below
    it: pressing the button moves both, and one of them is off screen (`KnobStep` was
    like this). Put secondary visuals *in the same row* as their buttons, under the main
    visual, with the readout between them.
  - **Run button under the guess list.** Render the run button right under the visual,
    *before* the question, gated on `guess !== null`.
  - **A block that grows between them.** Put the stage buttons right under the visual and
    let the growing block pile up *below* them.
  - **A finished stage left in place.** Once a sub-task is done, swap its controls out so
    the next question moves up under the visual.
  - **`sm:flex-row` rescues.** Design the phone layout; the frame zooms it up.

  Reference layouts: `KnobStep`, `OneKnob`, `SugarCube` / `HowFar` / `LoudFilm`,
  `GapNames` / `RoomCorner`.
- **Make the tap animate.** A widget whose result just appears is a form. Let the effect
  play: Shiku walks, the bar fills, the dot glides (`usePlay`, `useTween`, `Draw`). Keep
  plays short (under ~2s) so the reader can try again quickly.
- Tailwind only, no global CSS; class names must be literal strings (map a key to a full
  class, never build `bg-cat-${x}`). Tailwind v4: `bg-linear-to-t`, `starting:`.
- Colours: theme tokens (`text-muted`, `bg-accent/10`, `text-cat-blue` …) for chrome;
  **fixed ink** (`fill-[#0f1b2d]`, white sheets) for drawn objects that are "paper".
- The Journey renders inside `.article`, whose `p`/`h1`/`h2` rules win — use `div`/`span`
  in screens.
- Monospace is for numbers, formulas and code — never prose.
- ◀ ▶ and similar glyphs render as emoji on Linux: use − / + / → text.
- SVG labels near an edge: anchor inward (`textAnchor="end"` on the right) or clamp x.
- Add `motion-reduce:transition-none` to anything with a transition.
- Call `pass()` from handlers or `usePlay`'s `done`, never inside a state updater.
- Keep a label and its number together with `&nbsp;` (`card&nbsp;2`) where a caption wraps.
- Watch for name collisions: one `*-journey.tsx` file holds every screen, so module-level
  consts are shared (`MOVES` already taken → `TWO_MOVES`).

---

## 8 · Files and wiring checklist

- [ ] Lesson: `src/content/articles/math_for_ai/<nn><letter>_<slug>.mdx` (filename = slug),
      all in English.
- [ ] Screens: `src/components/interactive/<topic>-journey.tsx`, `"use client"`, one file
      per journey. Number the section comments (`// 3 · …`) in journey order.
- [ ] **11 steps or fewer** (`grep -c '<Step>' <file>`). More → split the journey.
- [ ] Screen 1 asks the journey's question and does not answer it (§0).
- [ ] Every step has an interactive animation; scenes get a story scene; every `<Then>`
      has a figure (§1.1).
- [ ] A visual "Try it" exercise near the end; no text-only check without a picture (§3.2).
- [ ] Predict-first on only 2 screens (3 at most), the sealed bet included (§0).
- [ ] Every `<Then>` fits one screen (`tools/then-audit.py` shows no OVER); side quests
      sit in `<SideQuest>` (§3.1).
- [ ] The world is Bengali (names, places, money in taka); the English is plain; no
      Western idioms; ASCII digits; British spelling (§2).
- [ ] Revising/porting: nothing the author wrote was lost (diff against a backup, §9).
- [ ] Add the slug to `math_for_ai.items` in `src/content/courses.ts`, in order.
- [ ] Previous journey's last step ends with a `<LessonLink>` to this one; this one's last
      step links to the next. Don't link a slug that doesn't exist yet: bridge in words
      and say so to the user.
- [ ] Tell the user: a new slug is **draft** in the DB until they publish it, and the
      frame's chrome is still Bangla (§6).
- [ ] Every widget: each button, and everything it changes, visible together on a 375px
      phone (§7).
- [ ] Verify (§9): every MDX compiles, tsc and ESLint pass, the audits are clean.

---

## 9 · Verify (cheaply)

Run from the repo root:

```
node .claude/skills/pathshala-journey/tools/mdx-check.mjs     # every MDX compiles (or pass files)
python3 .claude/skills/pathshala-journey/tools/then-audit.py  # steps ≤ 11, each <Then> vs the one-screen budget
python3 .claude/skills/pathshala-journey/tools/notes-audit.py # pass notes + praise longer than one line (44 chars)
npx tsc --noEmit -p .                                         # types
npx eslint <changed .tsx files>                               # lint
```

The audits scan the older Bangla journeys too; only judge the journey you touched (pass
its file to `then-audit.py`).

When revising, copy the MDX to the scratchpad first, then confirm no original line went
missing. Every non-blank line from `<Journey` on must still appear somewhere in the new
file (a line may change only when you deliberately edited it, e.g. adding `story`):

```
python3 - <<'EOF'
b = open("<backup>.mdx").read(); a = open("src/content/articles/math_for_ai/<file>.mdx").read()
print([l.strip() for l in b[b.index("<Journey"):].splitlines() if l.strip() and l.strip() not in a])
EOF
```

When *porting* a Bangla journey, lines change wholesale — check instead that every beat,
pass note and exercise survived.

If this branch has the `check`/`shot` npm scripts (look in `package.json`), use them too:

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
Story:    <who, where in Bengali life, what's at stake>
Steps:    <n ≤ 11>
1. <Screen> — question → what the reader does → eureka (the pass note, spoken)
   Scene: <the story scene, if the setup is a scene>
   Then: <what the explanation adds> · Fig: <what the figure acts out>
   Side quest: <story / table / look-ahead, if any>
2. …
n−2. <Screen> — Your turn: the reader answers the question unaided
n−1. <TryIt> — visual exercise: <the new case> → <how they answer on the picture>
n. The end! <loop closed>
```

When cutting a source article into journeys first, use `pathshala-journey-plan`.
