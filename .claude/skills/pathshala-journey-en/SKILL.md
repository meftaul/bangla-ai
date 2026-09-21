---
name: pathshala-journey-en
description: Build or revise a Pathshala "journey" lesson — Brilliant-style, one screen at a time (Math for AI 1.x–3.x) — with every word the reader sees written in English. Same spine, screens, kit, wiring and verification as pathshala-journey, but the voice is spoken English for a twelve-year-old instead of the author's Bangla. Use whenever a task touches src/content/articles/math_for_ai/*.mdx journeys or src/components/interactive/*-journey.tsx and the deliverable is English — the user asked for English, an English version or edition, "not Bangla", or translating a Bangla journey into English. For journeys written in the author's Bangla, use pathshala-journey instead.
---

# Pathshala journeys in English

This is the English-delivery twin of `pathshala-journey`. The craft is identical —
read that skill's name only if you need the Bangla voice. Everything needed to build
an English journey is on this page: the spine a journey needs, the screen components,
the kit API, wiring, verification, and the **English voice** that replaces the
author's Bangla.

A journey is an MDX article whose body is `<Journey><Step>…</Step>…</Journey>`: one
screen at a time, each with one interactive screen component and one thing to do; the
Continue arrow stays locked until the screen calls `pass()`.

**The model journeys** are still **1.1** (`01c_image_numbers.mdx` + `image-journey.tsx`)
and **2.3** (`02c_king_queen.mdx` + `word-journey.tsx`) — the author's own pick. Their
words are Bangla: read one for **structure and pacing** (what each screen asks, when
the reveal lands, how short the prose runs), never for wording. 3.1
(`03a_treasure_add.mdx` + `treasure-journey.tsx`) is a good reference for *screen*
craft.

**Save tokens:** don't read whole `*-journey.tsx` files (dimension-journey is ~2,800
lines). Navigate with `grep -n '^export function\|^// [0-9]' <file>` and read one
section with offset/limit.

**Where English journeys live:** the same course as the Bangla ones —
`src/content/articles/math_for_ai/<nn><letter>_<slug>.mdx`, wired into the same
`math_for_ai.items` in `courses.ts`. A journey is entirely one language; never mix
Bangla and English prose inside one journey.

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
  and the answer comes later: *"The bet is sealed. We'll try the six jobs one by one,
  and match your guess against them at the end."*
- **Predict-first is rationed: 2–3 screens per journey, the sealed bet included.** A guess
  only works when the reader commits to something that *might be wrong*. When every
  screen opens with "take a guess first", it costs nothing, the widget moves on either
  way, and by the third one it's just a tap. Spend the guesses where the result truly
  surprises, where the obvious answer is wrong: the opening hook, the moment a pattern
  flips (3.7 `Yardstick`: 18 cm turns out to be the *big* gap), the one reveal per idea
  that the rest build on (2.7 keeps one per surprise: `DiceMany`, `CoinMany`,
  `SugarCube`). **Every other screen goes straight to doing**: the controls show at
  once, and the `Task` says what to do and what to watch (*"Write the weight in all
  four units and see which one is the twin."*). Don't put a guess on:
  - a calculation whose answer is easy to see coming (*what do we multiply (3, 4) by to get 1?*);
  - the second or third case of a pattern already shown (10D after 3D; weights after heights);
  - a question the reader can settle by just pressing the buttons (*how do you press e₁?*);
  - the simplest case done by hand (step 2's grocery bill).

  A wrong option that teaches something (`1.4` is the walker's length, `3,780` is
  add-then-multiply) needn't be lost: say it as one plain sentence in the result line or
  the `<Then>` (*"Add the two slots straight and you'd get 1.4 — but that's how far
  Samin walked."*). A question asked *after* the reader has done the thing
  (`BigSpender`, `TiltedField`'s "is there any other way?") or an open question in the
  setup text doesn't count against the budget.
- **Every middle screen earns a piece of the answer**, and its opening line says which
  piece: *"Job three of the bet."* · *"Let the proof-stacking begin with Samin's 7."* ·
  *"Three down — now it's Nasib's turn."* Objections from the cast are the cheapest way
  to turn a dry rule into a beat — each of 3.4's three rules of length is somebody
  refusing to accept the verdict.
- **The old way fails first.** 1.1's `JustWords` (describing it aloud), 2.3's
  `ListGuess` (300 meaningless numbers). Let the reader feel the need before the tool
  arrives.
- **Mischief, and an honest limit.** 1.1 breaks the reading order on purpose to expose a
  hidden assumption; 2.3 owns up to its own `≈` and to the words it quietly excludes;
  3.6's `BigSpender` shows the journey's own trick being the wrong move. Admitting the
  seam builds more trust than hiding it.
- **"Your turn":** one late screen with no scaffolding, where the reader answers the
  journey's question themselves (2.3's `FindPair`, 3.4's `PrizeGiven`, 3.5's
  `PickTape`). Wrong tries bounce, so the numbers actually get read.
- **The last step closes the loop it opened**, by name: `## The end! The bet is
  settled` · `## The end! Som's riddle solved` · `## The end! Uncle goes home with the
  photo`. Then a short recap and one memorable rule (*"store it as a list, think of it
  as an arrow"*), then the bridge — and the bridge teases the *next* journey's
  question, not its topic.

**The usual skeleton** (8–11 widget steps, plus the follow-up `<Check>` steps that §3.1
add when an explanation outgrows one screen; past ~16 steps in all, split it into two
journeys):

| step | what is on it |
| --- | --- |
| 0 | a recall `<Check>` on the previous journey's idea, tied to the story's first callback (§0.1) |
| 1 | the scene, the stake, the question. A prediction, sealed unmarked. |
| 2 | the obvious way, and it fails — or the simplest case, done by hand |
| 3…n−3 | one piece of the answer each, often a named character's objection |
| (after any of these) | a follow-up `<Check>` step: one question on the explanation's second idea, then that half of the explanation (§3.1) |
| n−2 | **Your turn** — unaided; the reader answers the journey's question |
| (2 of these, mid-journey) | a retrieval `<Check>` on an idea from an *earlier* journey, placed where the story calls back to it (§0.1) |
| n−1 | `## A quick recap` + `<Check>` |
| n | `## The end! <the loop closed by name>` — recap, one rule, `<LessonLink>` |

---

### 0.1 · Practice: recall at the door, retrieval in the middle

A journey that checks only once, at the end, never finds out whether last week's idea stuck.
So every journey also gets:

- **An opening recall step**, before the hook: one line of setup, then a `<Check>` on the
  *previous* journey's main idea (*"Which vector is the arrow that stops at (4, 2),
  starting from (1, 1)?"*). Tie it to the story's first callback where there is one
  (04c opens on Fahim's box → ask for a box). The child paragraph (1–2 sentences) turns
  from the old idea to today's scene, and must not hint at today's answer.
- **Two mid-journey retrieval checks** (one in a journey already past ~17 steps), each on
  an idea from an *earlier* journey, spaced across the course, not just the last one.
  Place each right before the screen whose setup already calls back
  (*"Nasib's coins, back in 2.7…"*, *"Rafiq describing the bird over the phone…"*): the
  callback becomes something the reader answers instead of reads. Setup line: *"Before
  <screen> — think back to <old scene> once."*
- Never place one where its answer gives away the next screen's prediction or the
  journey's question. Three options, right answer spread over A/B/C, a one-line `praise`,
  a `hint` that points back at the old scene.

## 1 · Design rules (the author's standing feedback)

- Reader is **twelve and knows no school math.** Nothing is named before it is felt.
- Every idea follows: **tiny question → plays a small, countable case by hand → spots
  the pattern → reveal.** The eureka comes from what they did, not from text. A tapped
  prediction before the play is a spice, not a step: 2–3 per journey (§0).
- **Minimal prose; the story is told by the interaction.** Words around the widget: set
  up before, explain after. One or two lines of story before the widget — the scene and
  the question, never the answer. After it, `<Then>` holds the explanation, and it shows
  only once the screen is cleared, so it never spoils the task. Every step gets one, and
  it fits **about one phone screen** (§3.1): a second screen of reading is a second task.
- Feel the need before the tool (a sum too long to write → Σ). Teach notation on an
  everyday example first (roll numbers, Ammu's shopping list).
- Everyday games for "why": dice totals, coin flips, peeling tiles, a radio knob.
- **Recurring cast (Latin script):** Shiku (the class robot, walks the chalk grid),
  Samin, Som, Fahim, Nasib, Ammu, Dr. Apa. Concrete names, never "Object A / Object B".
- Widget text is spoken English, never formula shorthand (§3).
- **The reader sees the action and its effect at the same time.** Whatever a tap changes
  must be on screen, next to the button, when the tap lands, with no scrolling. The author
  has had to ask for this more than once. Lay out every widget by §7 "Action and effect
  in one view".

---

## 2 · The voice

Prose that sounds like one person explaining something to a friend over tea. Not a
translated textbook, not a chatbot, not a corporate e-learning script.

### 2.1 · Core feel

- **Talk to the reader as "you"**, relaxed and spoken: *"say"*, *"let's"*, *"look"*,
  *"notice that?"*, *"have a go"*. British English — **maths**, centimetres, colour —
  matching the course's existing English prose.
- **Contractions, always:** *it's*, *that's*, *doesn't*, *we'll*, *you've*. Writing them
  out is the fastest way to sound like a textbook.
- **Short sentences, one idea per paragraph.** Paragraphs run 2–6 sentences. Punchy
  fragments are fine: *"But not through feelings. Through numbers."*
- **Light, dry humour, never forced:** *"The computer, truth be told, is a bit of a
  donkey."*
- **Honest and understated.** No hype: *"We just measured it. That's all."*

### 2.2 · The world stays, the words are English

The Bangla journeys live in a Bangladeshi school town, and the English ones keep that
world — only the language changes. Don't swap the setting for a generic Western one.

- **Names in Latin script:** Shiku, Samin, Som, Fahim, Nasib, Ammu, Dr. Apa. Never
  translate a name into a role ("Auntie", "the doctor"). A family word may gloss once
  (*Ammu — her mum*) and then stay.
- **Local everyday words carry over:** sherbet, tiffin break, the bazaar, cricket on the
  field, load-shedding. Gloss in three words at first use if it isn't obvious from
  context, then use freely. Don't turn the sherbet stall into a lemonade stand.
- **Technical terms are plain English already:** vector, pixel, dimension, grid,
  channel, representation, binary, order, element. Never coin a cute synonym, never
  reach for a fancier word (*use*, not *utilize*; *work out*, not *compute*, unless the
  verb *is* the idea).
- **Numbers are ASCII digits everywhere** (*5 rows*, *36 million*, *(180, 78)*,
  *12 megapixel*). `bn()` is for Bangla screens only — never call it from an English
  screen. Restate big results in words for impact: *"One picture: thirty-six million
  numbers."*
- **Punctuation.** Sentences end in a period. Curly quotes `“ ”` for dialogue. `???`
  and `!!!` only at the one or two peak moments of a piece.
- **Spelling is British** (maths, colour, centimetres, metres) and consistent within a
  journey.

### 2.3 · Transitions (instead of "Next, we will discuss")

*"So now the question stands…"* · *"Alright, now…"* · *"That settles the pictures."* ·
*"Everything was going so nicely… and here's where it gets sticky."* · *"Let's do the
sum now."* · *"Let me break it down a bit more."* · *"Time to meet another word."*

### 2.4 · What makes it sound robotic (avoid)

- Formal or officialese English: *"It can be observed that"*, *"the following
  example"*, *"In this article, we will learn…"*, *"utilize"*, *"in order to"*.
- Word-for-word translation calques carried over from a Bangla draft. Translate the
  beat, then say it the way English actually says it.
- Opening with a definition, or naming a concept before the reader has felt the problem.
- Bullet lists doing the explaining. Prose explains; bullets are rare, and a short recap
  list belongs only at the very end.
- A summary after every section, or perfectly symmetrical sections.
- Over-explaining. Trust the reader and leave a puzzle: *"Why smaller squares mean a
  clearer picture — work that one out yourself."*
- Emojis, hype (*"an amazing revolution!"*), exclamation marks on ordinary sentences.
- Formula shorthand standing in for a sentence. `=`, `→`, `·` live inside formulas only.
- Explaining before the reader has played. The explanation goes after the screen, in
  `<Then>`.

### 2.5 · Before / after

Robotic:
> A vector is an ordered list of numbers. An example is provided below.

The author's voice:
> So the picture part is settled. Now let's take a classroom. Say we measure every
> student's height in centimetres and weight in kilograms. … This representation has a
> name, by the way. It's called a **vector**.

| Robotic | Spoken |
| --- | --- |
| `Final position = sum of the two walks.` | `Shiku stopped where card 1 ended — and that's exactly where card 2 begins. Two walks joined, final address (4, 5).` |
| `Pair 1/3 · call the first card u` | `Pair 1 of 3. To keep the names short, let's call the first card u and the second v.` |
| `u + v = (u₁ + v₁, u₂ + v₂). Addition is component-wise.` | `First slot with first slot, second with second. That's all vector addition means.` |
| `150 cm + 12 years = ? Units cannot be added.` | `150 cm plus 12 years? Nobody knows what that number means. Not even the calculator.` |
| `✕ guess did not match` | `✕ the other way round` |

---

### 2.6 · The author's pass

Voice rules alone don't stop a rewrite. Before an English journey is done, put every
line through this pass — the same edits the author makes in Bangla drafts, carried into
English (`pathshala-voice` §1 is the Bangla original; read it if the user's own edits
are in play):

1. **Words people say.** Would a twelve-year-old say this word out loud? Swap
   book-English for the spoken word. Never stack a noun-phrase where a plain sentence
   would do.
2. **Nothing assumed; reason it out.** "Let's assume the right bulb is worth 1" is a
   red flag — derive it: *"Start with the right bulb. Off, it adds nothing — that's 0.
   So on, it must say the next number: 1. There's no other number the machine could
   mean."*
3. **Spell out the chain, land it with "so that means".** Don't compress a proof into
   one clever line: (1) what they saw, (2) the fact from before that applies, (3)
   *so that means…* plus the conclusion.
4. **Plain beats clever.** Cut metaphors that need decoding; say the literal thing.
   One homely comparison the reader has lived (walking to school and back — same road,
   same length) is welcome; a writerly one isn't, and there's at most one per idea.
5. **Cut filler.** Mood clauses, decorative job titles (*"Samin, the stall's treasurer,
   keeper of all accounts"* → *"Samin keeps the stall's money"*), restating the obvious.
6. **Fill in the story's own logic.** If the scene changes (a third number, a lost
   card, a new rule), say what in the story caused it: *"He's up on the roof, off the
   ground — so his card gets one more number: the roof's height."*
7. **Tie every result back to the stake.** *"The rule holds, so the judgement will be
   fair."* · *"‘How far she walked' and ‘how far she ended up' are two different sums —
   and the prize rule asked for the second one."*
8. **Tick off objections by name, and be fair to them.** *"**Nasib's second argument
   didn't survive either.**"* · *"Fahim's objection isn't silly — it just doesn't
   matter here."*
9. **Say the invariant like a person would.** Not *"the walk length is always 7.29"* but
   *"the walk length is always 7.29 — not a hair more or less."*
10. **Instructions exact, in order, with a foothold.** Tell them the easy first move:
    *"Don't worry about the third bulb yet. Get the old pattern back with the first
    two, then…"*
11. **Close what the journey can answer.** Keep an open question only as a real teaser
    for a later journey; when you close one, set it against the rule just before it
    (*"order didn't matter for adding — for subtracting, it does"*).
12. **Honest about suspense and difficulty.** *"The picture isn't clear yet. Hold
    tight — it will be."*
13. **Spoken glue, used sparingly:** *now*, *right?*, *look at that*, *so*, *by the
    way*. Open an explanation by turning to the reader: *"See the trouble?"*
14. **One name per thing, glossed once.** Once it's *treasure*, it stays *treasure*.
    A term gets its plain-English sense at first appearance, then just its name.
15. **No claim you can't stand behind.** Real-world "this is how X works" lines must be
    true and specific. If you're not sure, cut it or show it instead.

If the author types into the file: parenthetical notes are instructions — do what they
ask (animation requests go to `pathshala-animate`), then delete the note. Banglish or
Bangla lines the author typed into an English draft are the author's own words: carry
them into English keeping their wording and order; don't rewrite them. Re-read a file
right before editing it — the author edits while you work.

### 2.7 · Translating a Bangla journey

A likely job in this course is translating an existing Bangla journey into English.
Then the structure is already right; your job is the language.

- **Translate the author's sentences, don't rewrite them.** Every screen, beat, wrong
  option and pass note carries across. Nothing is dropped, reordered or "improved".
- **Translate the feel, not the words.** A spoken Bangla idiom becomes the spoken
  English a kid would use (*কেচালটা বাধলো* → "here's where it gets sticky"). If a
  line can't survive translation, say the same beat the plain way.
- **Mechanics to swap:** `।` → `.`; `bn()` → plain ASCII digits; Bangla-script
  loanwords (ফোন, কম্পিউটার) → phone, computer; keep `“ ”` quotes.
- **Keep the world.** Sherbet stays sherbet; Ammu stays Ammu; the science fair stays
  the science fair.
- **After translating:** same step count, every `pass()` note carried across, and every
  `<Check>`'s options and answers intact. Then run §2.6 over the result as you would a
  fresh journey.

---

## 3 · Where each piece of text goes

Each slot has one job, all of it in the §2 voice: someone sitting beside the reader.

| Where | Its job | Example |
| --- | --- | --- |
| Setup (MDX, before the widget) | the scene + the question, 1–2 lines | `Shiku has two cards like this. Before he starts walking — where's the treasure?` |
| Caption (in the widget) | what to look at, or how to read it | `On paper, east means right and north means up. And card 2 starts wherever card 1 stops.` |
| `Task` | the one thing to do, as a friendly request; on most screens that's the doing itself, plus what to watch (a guess only on the 2–3 predict screens, §0) | `Turn all four units and match the two distances.` · predict screen: `Tap a guess on the paper first, then send Shiku walking.` |
| Result line / `Nope` | react to what *they* did; nudge toward the pattern, don't hand over the rule | `Nope — Shiku stopped at (6, 4), and you said (5, 4). Look at the numbers on the two cards once more.` |
| `Speech` | the character in their own voice | Nasib: `Add these two cards of mine too, will you!` |
| `pass()` note | **one line** (≤ ~44 visible characters): the thing the reader will remember, not a retelling. A long note eats the widget's screen and turns the ending's recap into a wall | `u + v = v + u — order doesn't matter.` · `Change the unit, change the twin.` |
| `<Then>` (MDX, after the widget) | the explanation, as story: 1–2 short paragraphs and at most 2 figures, one phone screen (§3.1) | below |
| `Check` children | why the right answer is right, and what the tempting wrong one did | `Those who picked (6, 4) dropped the minus signs.` |
| Follow-up step setup | one line reacting to the last screen and pointing at the next idea | `So all the dots sat on one line. Now — Nasib's sherbet.` |
| Follow-up `Check` | a question the reader can answer from what they just did; its answer is what the second half explains | `Nasib's sherbet has the same lemon as before, only double sugar. Where does his dot sit?` |
| Follow-up `praise` | the eureka as a one-line pass note (it goes into the ending's recap), never `That's correct!` | `Grow one slot alone and the dot leaves the line.` |
| `SideQuest` title | what's inside, as a short noun phrase | `Mars Climate Orbiter: right numbers, wrong unit` |

**The `<Then>` explanation** points at what the reader just saw (*"Notice how…"*,
*"Take one look at the table."*), says *why* in everyday terms, names the idea last in
**bold**, and only then gives the formula. Good ingredients: a callback to an earlier
lesson or character (*"in 2.2 you worked out End − Start — that was exactly this
subtraction"*), where it shows up in real ML, comfort for a common wrong guess (*"if
you picked (4, 3), you're in good company"*), a line that ticks off the journey's spine
(*"so that's job two done"*), and now and then one question left open (*"is u − v the
same as v − u? Think it through yourself"*). Don't recount the clicks or restate what
the screen already shows.

**Rules of thumb for text inside a screen:**
- Full sentences ending in a period.
- "You" with friendly imperatives: look, give it a try, match them, tap.
- Names over labels: `Samin's card`, not `card v`.
- Values and tuples in ASCII digits; no `bn()` in English screens.

### 3.1 · One screen per explanation

Attention peaks right after the reader solves something and drops fast. A `<Then>` that
runs for several screens puts the most reading where attention is lowest. So:

**The budget.** A `<Then>` is about one phone screen: **1–2 short paragraphs, ≤ ~100
words, and at most 2 figures.** With no figure, up to ~110 words or three short
paragraphs is fine. No `<Table>` in a `<Then>`. `tools/then-audit.py` (in
`pathshala-journey`) measures this (§9).

**Over budget → a second task, not a second screen.** Find where the explanation turns
to its *second idea* (usually a new paragraph: a new case, a callback, a "why?"). Close
the step there and start a new `<Step>`:

1. a **setup line** reacting to the last screen (*"There's the rule. But why does it
   hold?"*);
2. a self-closing **`<Check>`** whose answer is exactly what the second half explains, but
   which the reader can work out from what they just did. Good kinds: the next case by
   hand (*"what do we get if we multiply (1, 2, 5) by 3?"*), a callback (*"square, add,
   then root — where have we done this sum before?"*), a "why" choice (*"press 1, and a
   few people switch teams — why?"*), a judgment call (*"Dr. Apa wants weight to count
   extra. Does that work?"*), or an *"inside or outside?"*. Never ask for a name the
   reader hasn't met yet. The name comes in the `<Then>`, after they've felt the idea.
3. a **`<Then>`** carrying on with the original words, unchanged.

Rules for these follow-up `<Check>`s:
- **3 options.** One right, and one that is the tempting slip (sum first, then multiply;
  keep the minus; *kg is the real unit*). The wrong options react the way the `Nope` line does.
- **Vary where the right answer sits** (A, B or C). A journey where it's always A teaches
  the reader to tap A.
- `hint` nudges toward the pattern (a question back, a callback); it doesn't say the answer.
- `praise` is the **eureka as a one-line pass note** (§3). It shows in the footer
  and in the ending's recap, so never the default `That's correct!`.
- No children: the explanation lives in the `<Then>`. (The last recap check keeps a
  short child paragraph; move its figures into its `<Then>`.)
- **Don't let a follow-up answer the journey's question early** (§0), and don't turn a
  deliberately open question into a check. When the spine question finally comes back,
  it can be the `## Your turn` check (3.7: *"so the machine says one thing — what
  should make us believe it?"*).
- A paragraph that *poses* the question may move out of the `<Then>` to become the new
  step's setup, and a watch-only figure that sets up the question can go with it as a
  `story` scene.

**Side quests go in a `<SideQuest>` card, not in the explanation.** A side quest is
anything the step's idea doesn't need in order to be understood:
- a real-world story (Mars Climate Orbiter, panda → gibbon);
- a reference table (the three norms, row vs column normalise, the notation table at
  the end of an article);
- a look-ahead the text itself calls later (*"no need to wrestle with that yet"*: PCA, the
  neuron);
- a code gotcha or a bracketed aside (NumPy `u * v` vs `u @ v`, cross product);
- a list of more uses (*"where else this trick shows up"*).

Keep in the `<Then>`: the name, the formula, the callback, the one ML sighting that pays
off the step, and the line that ticks off the spine. In a `<Then>` the card is one line
(`Side quest` + title → a sheet); its children keep their figures. End-of-journey
reference tables go in a card at the very end of the last step.

**Revising an existing journey: move, never lose.** When you split or fold, the author's
words are moved, not rewritten. Only the new setup lines and check text are yours. Back up
the MDX first and diff after (§9), and use `tools/split_then.py` (in `pathshala-journey`)
so no text gets retyped.

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
    Each screen opens by reacting to the last; the explanation sits in <Then>
    and shows only once the task is done, about one phone screen each: where it
    runs longer, its second half follows its own <Check>, and side quests sit in
    <SideQuest> cards. The screens live in
    components/interactive/<topic>-journey.tsx. */}

import { Journey, Step, Check, Then, SideQuest } from "@/components/journey/journey";
import { ScreenA, ScreenB, FigA, FigB } from "@/components/interactive/<topic>-journey";

<Journey title="Two faces of a vector · 2.9">

<Step>

One or two lines of story: the scene, the stake, and the question this screen asks.

<ScreenA />

<Then>

What the reader just found, told as story: point at the pattern, say why. One idea,
one screen.

<FigA />

</Then>

</Step>

<Step>

One line reacting to the last screen and turning to the second idea.

<Check
  question="A question whose answer is the second idea, worked out from what they just did"
  options={[
    "the tempting slip",
    "the right answer",
    "another wrong one",
  ]}
  answer={1}
  hint="a nudge back to the pattern, not the answer"
  praise="The eureka as a spoken pass note, one or two sentences."
/>

<Then>

The second idea: name it last in **bold**, then the formula ($…$). A callback; maybe
one open question.

<FigB />

<SideQuest title="A short noun phrase for what's inside">

A real-world story, a reference table or a look-ahead, with its figure if it has one.

</SideQuest>

</Then>

</Step>

<Step>

## A quick recap

<Check question="…" options={["…", "…", "…"]} answer={0} hint="…">

Why the right answer is right, and what the tempting wrong one did.

</Check>

</Step>

<Step>

## The end! <the opening loop closed by name>

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
don't render, use `<Table head rows note />`; comments are `{/* */}`.

---

## 5 · Screen template

This template is a **predict screen**, one of the journey's 2–3 (§0). For every other
screen, leave out `GUESS`/`guess`/`Choice`: show the controls from the start
(`{!peeled && <button …>}`) and let the `Task` name what to do and what to watch.

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
    pass("36 tiles fell off the peel — 8 × 8 = 64 stayed on."); // the eureka, spoken; shown by Continue
  };

  return (
    <>
      {/* the visual: SVG or divs, Tailwind only */}
      <div className="mt-4 text-sm font-medium text-muted">How many tiles will fall off the peel?</div>
      <div className="mt-2 grid gap-2">
        {GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, peeled, RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && !peeled && (
        <button type="button" onClick={peel} className={`${primaryBtn} ${FADE}`}>Peel it off</button>
      )}
      <Task done={peeled}>Guess first, then peel it and see.</Task>
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
inline), `SideQuest({title})` (a one-line card inside a `<Then>`; a tap opens its
children in a `<dialog>` sheet on `document.body`, outside the Journey's split and zoom,
so it never lengthens an explanation. Children are ordinary MDX: paragraphs, `<Table>`,
figures. Use it only inside a `<Then>`, because in a step's main part it would be taken
for the widget). `<Check>` is also the usual follow-up task when a `<Then>` outgrows one
screen (§3.1).

**The frame is one phone screen, fixed height** (the article page gives it the viewport):
top bar (× to library, progress, the pinned `Task`), the screen, bottom bar (pass note,
←, Continue). Progress is kept per browser in localStorage: the step and screen, whether
the task in hand was done, and every step's pass note, so a reload lands on the same
screen with Continue as it was. A locked Continue still answers a tap: it says what to
do and shakes the `Task`, so every gated screen needs a `Task`. After the last screen,
the frame's own ending opens: ✓, the pass notes as a recap (text notes only, so keep
`pass()` notes plain strings), and the next lesson in the course from `courses.ts`. The
MDX's last step still closes the loop in words (§0).

**Known gap — the frame's chrome is Bangla.** The Continue label ("ব্যাখ্যাটা দেখুন"),
the locked-Continue message, the ending screen ("শেষ!", the step count), the `Scene`
controls ("একবারে দেখুন" / "আগের" / "পরের") and the cast's under-feet name labels
(`CAST[who].name` in `cast.tsx` — সামিন, নাসিব…) are hardcoded Bangla. An English
journey therefore ships with a few Bangla buttons until those take labels as props (or a
locale). Work with it: `Speech` takes any `who` string — pass "Nasib", not the cast key's
Bangla name — and leave `<Person label>` off, naming characters in the caption instead.
**Say so to the user when handing over an English journey**; localizing the chrome is a
separate code task, never a silent one.

**Words are never trimmed to fit — a step becomes as many screens as it needs**, measured
on arrival:

| screens | what is on them |
| --- | --- |
| story | the setup paragraphs, if they don't fit beside the widget (the widget keeps the last ones that do). Centered, no `Task`, never locked. |
| widget | the widget, `Task` pinned in the top bar. The only screen that can lock Continue. |
| explanation | `<Then>`, once the task is done. Continue reads the chrome label for "see the explanation"; the back arrow returns to the widget, which keeps its state. |

Breaks fall between paragraphs; a heading stays with what follows, a `$$…$$` block with
what precedes. So write the story and the explanation at the length they need: what must
fit a phone is the **widget itself** (§7). Screens never scroll by design: when a screen
grows after arrival (a guess reveals a figure), the story words kept beside the widget
move to their own screen, and an explanation screen's overflow starts a new screen. What
can't be split (one widget, one figure) is zoomed down to fit, to ×0.7 at most; past that
it scrolls, so still design the widget to fit. `Plane` never draws taller than 44svh.

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
  the controls. It never starts on its own. Draw it phone-sized; the frame grows it on
  tablets and laptops (`GROW` / `GROW_WIDE`). See the pathshala-animate skill. **Its
  control buttons are Bangla chrome (above); write the caption in English.**
- previews: `useSeed(key, initial)`, `Fixtures`, `SeedProvider`.

`@/components/journey/plane` — graph paper in data units: `makeFrame(x0, x1, y0, y1, u,
pad=18)` → `f` with `f.sx(x)`, `f.sy(y)`, `f.u`; `<Plane f label grid axes ticks
drag={{down, move, up}} onKey className>`; `Arrow({f, from, to, tone, w, draw, dashed,
faint})`, `Label`, `Dot`, `Star`; helpers `snap`, `clamp`, `same`, `plus`, `minus`, `mix`,
`dist`, `sg` (real minus sign), `tup`, `INK`.

`./figure-kit` — `bn(n)` Bangla digits, **for Bangla screens only**; English screens use
plain ASCII digits. `./arrow-journey` — `Shiku`, `Trail`, `route`, `useWalk` (Shiku
walking the grid).

**Animation.** Every journey gets animated story scenes in its setups and watch-only
figures in its `<Then>`s. How to make them (`useScene`/`Scene`, `cast.tsx`, the `story`
prop, sizes, gotchas) is in the **pathshala-animate** skill.

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

- **Design the widget for a 375×667 phone, and only for it.** On a tablet or laptop the Journey zooms the widget for you (`GROW_WIDGET`: up to ×1.45, height-aware; see pathshala-animate §3). So don't add `sm:`/`lg:` size classes, and keep pointer maths as ratios of `getBoundingClientRect()`.
- **Phone size.** The widget's screen has ~460px (less the
  pinned Task, and a pass note once done), so a widget's visual + controls should fit in
  about 400px. Story paragraphs don't count: the frame moves them to their own screen.
  Put the visual first and its controls right under it, so what a tap changes is in view;
  prefer swapping a stage in place (guess → play → result) over stacking a new block
  under the old one. A screen that can't fit is two screens.
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
    like this). Put secondary visuals (dials, a radio, a meter) *in the same row* as
    their buttons, under the main visual, with the readout between them.
  - **Run button under the guess list.** Predict → reveal screens used to put the
    run/walk/pour button after the `<Choice>` list, so the animation plays
    ~200px above the thumb. Render the button right under the visual, *before* the
    question, gated on `guess !== null`. The choices stay below and show the verdict.
  - **A block that grows between them.** Stage formulas, a chip per step, result lines:
    each press pushes the button further from the picture. Put the stage buttons right
    under the visual and let the growing block pile up *below* them.
  - **A finished stage left in place.** Once a sub-task is done (the compass in
    `GradientFeel`), swap its controls out so the next question moves up under the visual.
  - **`sm:flex-row` rescues.** Side by side on a laptop but stacked on a phone puts the
    visual and its buttons far apart. Design the phone layout; the frame zooms it up.

  Reference layouts: `KnobStep` (dials, error and button in one row under the map),
  `OneKnob` (radio beside its buttons), `SugarCube` / `HowFar` / `LoudFilm` (run button
  under the visual, guess below), `GapNames` / `RoomCorner` (stage button above the
  growing formulas).
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
      per journey (new journeys get a new file). Number the section comments (`// 3 · …`)
      in journey order; renumber if you insert one.
- [ ] Screen 1 asks the journey's question and does not answer it (§0).
- [ ] Every step has a setup line or two, its screen, and a `<Then>` explanation.
- [ ] Predict-first on only 2–3 screens, the sealed bet included, each one where the
      obvious answer is wrong (§0). Count: `grep -c predictLook <file>` plus the bet.
      No `<Then>` or result line still says "those who picked X" about a guess that's gone.
- [ ] Every `<Then>` fits one screen (`then-audit.py` shows no OVER). Longer ones
      are split into follow-up `<Check>` steps, and side quests sit in `<SideQuest>` (§3.1).
- [ ] Follow-up checks: right answer not always A, `praise` is a spoken eureka, and none
      of them answers the journey's question early.
- [ ] English mechanics: no `bn()` calls, no Bangla script anywhere, ASCII digits,
      periods, British spelling, contractions in prose.
- [ ] Revising/translating: nothing the author wrote was lost — same step count, every
      beat and pass note carried (diff against a backup, §9).
- [ ] Add the slug to `math_for_ai.items` in `src/content/courses.ts`, in order.
- [ ] Previous journey's last step ends with a `<LessonLink>` to this one; this one's last
      step links to the next. Don't link a slug that doesn't exist yet: bridge in words
      and say so to the user.
- [ ] Tell the user: a new slug is **draft** in the DB until they publish it.
- [ ] Tell the user: the frame's chrome (Continue, ending, Scene buttons) is still
      Bangla — a separate code task to localize (§6).
- [ ] Every widget: each button, and everything it changes, visible together on a 375px
      phone. No graph, guess list or growing block between a control and its effect (§7).
- [ ] Verify (§9): every MDX compiles, tsc and ESLint pass, the Then audit is clean.

---

## 9 · Verify (cheaply)

The `pathshala-journey` tools already scan `math_for_ai/*.mdx` and every
`*-journey.tsx` — English journeys included, since they live in the same folders. Run
them from the repo root:

```
node .claude/skills/pathshala-journey/tools/mdx-check.mjs     # every MDX compiles (or pass files)
python3 .claude/skills/pathshala-journey/tools/then-audit.py  # each <Then> vs the one-screen budget
python3 .claude/skills/pathshala-journey/tools/notes-audit.py 44  # pass notes + praise longer than one line
npx tsc --noEmit -p .                                         # types
npx eslint <changed .tsx files>                               # lint
```

`notes-audit.py`'s default limit of 34 is tuned for Bangla glyph widths; pass **44** for
English notes (Latin glyphs run narrower — and confirm with a shot the note fits the
footer at 375px). A mixed corpus prints both languages; only judge the lines in the
journey you touched.

When revising, copy the MDX to the scratchpad first, then confirm no original line went
missing. Every non-blank line from `<Journey` on must still appear somewhere in the new
file (a line may change only when you deliberately edited it, e.g. adding `story`).
When *translating*, lines legitimately change wholesale — check instead that the step
count and every screen's beats survived:

```
python3 - <<'EOF'
b = open("<backup>.mdx").read(); a = open("src/content/articles/math_for_ai/<file>.mdx").read()
print("steps:", b.count("<Step>"), "->", a.count("<Step>"))
print("screens:", b.count("<Journey"), "->", a.count("<Journey"))
print("checks:", b.count("<Check"), "->", a.count("<Check"))
EOF
```

If this branch has the `check`/`shot` npm scripts (look in `package.json`; they are not
always there), use them too:

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
   + Check: <follow-up question> → Then: <the second idea>   (only if one Then can't hold it, §3.1)
   Side quest: <story / table / look-ahead, if any>
2. …
n. <Screen> — Your turn: the reader answers the question unaided
```

When cutting a source article into journeys first, use `pathshala-journey-plan` (its
specs are language-agnostic; note in the spec that the journeys will be English, and
build them with this skill).
