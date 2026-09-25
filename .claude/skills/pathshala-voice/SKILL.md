---
name: pathshala-voice
description: Make a Pathshala journey read the way the author writes and edits it — plain spoken English for Bengali readers, a story set in their own world, every step reasoned out and never assumed, the story's own logic filled in, objections ticked off, filler and clever metaphors cut. The pass was learned from the author's own revisions of AI drafts. Use when writing, rewriting, polishing or reviewing any journey prose or screen text (src/content/articles/math_for_ai/*.mdx, the strings in src/components/interactive/*-journey.tsx). Use it as the final pass before handing a journey over, when asked to make text "smooth", "non robotic" or "in my way", and whenever the author has typed notes or edits into a file — in English or romanized Banglish — that need turning into finished text.
---

# Writing a journey the author's way

The base voice (you, spoken and plain, story first and name last, a Bengali world) is in
`pathshala-journey` §2–3. Read it first.

**This skill is the author's editing pass.** It lists what the author actually changes
when they rework an AI draft. It was learned from their own commits and edits ("fixed
wordings", "fixed binary text", the 3.1 treasure-hunt rewrite, the 3.4 notes) — made on
Bangla drafts, and carried here into English. An AI draft can follow every voice rule and
still get rewritten; these are the reasons. Run every line of a journey through §1, then
the checklist in §3.

**Who reads it:** a Bengali twelve-year-old, reading English as a second language, who
knows no school math. Every sentence must be easy for *that* reader.

---

## 1 · What the author changes, and why

Each item shows the kind of edit: `AI draft` → **author**.

### A · Use the word people actually say

- `compute the resultant` → **`work out where he ends up`**
- `utilize both cards` → **`use both cards`**
- `approximately 7` → **`about 7`**
- `the treasure-seeking activity` → **`the Treasure Hunt`**

Test it by ear: would a class-seven student in Dhaka say this word to a friend? If not,
use the one they would. Use the reader's own vocabulary, too: once the reader knows x and
y, write *"the x slot"* and *"the y slot"*, not *"the eastward component"*.

### B · Never assume a step; reason it out

- `Let's say the right bulb is worth 1.` →
  **`Start with the right bulb. Off, it adds nothing — that's 0. So on, it should say the
  next number: 1. If we made it worth 2, there'd be no way left to say 1. So the right
  bulb is worth 1.`**

"Let's assume" / "suppose" is a red flag. A twelve-year-old must be able to *derive*
every number from what they already know. If a choice looks arbitrary, give the reason
that forces it.

### C · Spell out the chain, and land it with "so"

- `Fahim's first step and Som's second step are the same card, drawn in two places.` →
  **`Notice that the way Fahim walked first is exactly the way Som walked second? Only
  their spot on the graph paper is different. And we already learned that where a
  vector sits on the paper doesn't matter. So the two facing arrows are the same
  vector.`**

Don't compress a proof into one clever line. Walk it:
1. what they saw;
2. the fact from before that applies;
3. **"So …"** plus the conclusion.

### D · Plain beats clever

- `The order acts like an address here.` → **`The order matters a lot here.`**
- `East's ledger never mingles with north's.` → **`An x number is never added to a y
  number. Each stays in its own slot.`**

Cut metaphors that need decoding, and say the literal thing. A homely image the reader
already lives with is welcome (see H); a writerly one isn't. Idioms are metaphors too —
*"in the same boat"*, *"a whole new ball game"* — and a second-language reader may not
know them.

### E · Cut the filler

The author deletes these on sight:
- `No riddle here —` · `It sounds simple, but` · `Now without pictures, just numbers.`
- decorative job titles (`Samin, the stall's treasurer and keeper of every account` →
  **`Samin keeps the stall's money.`**)
- stacked adjectives, extra *all*, *very*, *really*, *actually*.

If a clause only sets mood or restates the obvious, drop it.

### F · Fill in the story's own logic

The author adds the *why* inside the story, which AI drafts skip:
- `The second card is Som's, and he's on the school roof, not the field.` + **`He's up
  off the ground, so his card gets one more number: the roof's height.`**
- A vague rule made exact: **`Whoever walks their own card and stops farthest from the
  Gate wins the prize.`**

If something in the scene changes (a third number, a lost card, a new rule), say what in
the story caused it.

### G · Tie every result back to the stake

After a rule is shown, say what it means for the journey's question:
- **`The rule holds. So the judging will be fair.`**
- **`"How far she walked" and "how far away she stopped" are two different sums — and
  the prize rule asked for the second one.`**

### H · An everyday comparison from a Bengali kid's own day

- **`Walking from home to school and walking back — the road is the same length.`**
- **`Like sharing one tiffin box between two friends.`**

Use one short comparison the reader has lived. Don't pile up several, and never reach for
one from outside their world (baseball, snow, Halloween).

### I · Tick off the objection by name, and be fair to it

- **`**Nasib's second argument didn't survive either.**`** (bold, the name, the count)
- **`Fahim's objection isn't silly. It just doesn't matter here.`**

Take the objector seriously first, then close it.

### J · Say the invariant like a person would

- `The walk is always 7.29.` → **`The walk is always 7.29. Not a hair more or less.`**

Say what stays fixed with a spoken phrase, not just the number.

### K · Instructions exact, in order, with a foothold

- `Shiku will walk, but after you answer.` → **`Shiku will walk this time too — but first
  you have to fill in the two numbers.`**
- Added scaffolding: **`Don't worry about the third bulb yet. Use the first two bulbs to
  get the old pattern back. Then…`**
- A rule's hidden condition stated: `no number should come twice` → **`when you add the
  two bulbs' values, no number should come twice`**

Tell the reader exactly what to do first, and give the easy first move.

### L · Answer what the journey can answer; contrast with the last rule

The AI draft left `Is u − v the same as v − u? Think about it.` hanging. The author had
the next screen show it, then closed it plainly:

**`So u − v and v − u are not the same. Each is the exact opposite of the other. For
adding, order didn't matter. For subtracting, it does.`**

Keep an open question only as a real teaser for a later journey.

### M · Honest about suspense and difficulty

- Holding back, and saying so: **`The picture isn't clear yet. Hold on — it will be.`**
- Admitting the notation is hard, lightly: **`Books write this with all sorts of scary
  symbols.`**

### N · Spoken glue and everyday verbs

- Glue, used sparingly: **`now`**, **`so`**, **`this time too`**, **`once`**,
  **`right?`**
- Verbs made everyday: `is constructed` → **`gets drawn`**; `let us examine` → **`let's
  look`**; `merely` → **`only`**; `opposite-facing` → **`facing each other`**.
- Open an explanation by turning to the reader: **`See the trouble?`**

### O · Short sentences for a second-language reader

- `Since the second card starts where the first one ended, which is how Shiku walks, the
  final address is simply the two cards added.` → **`Card 2 starts where card 1 ended.
  That's how Shiku walks. So the final address is the two cards added.`**

One clause per sentence where you can. Break a sentence at *which*, *since*, *although*.
No passive voice when an active one is available.

### P · Gloss a term once, then stick to one name

- **`**parallelogram** (a slanted rectangle)`** · **`three directions, or
  dimensions`**
- Once it's `treasure`, it stays `treasure`. Once it's `card`, don't switch to `walk`.
- Quotes are `“ ”`.

### Q · No claim you can't stand behind

The author deleted `Food-tracking apps on your phone do exactly this sum behind the
scenes.` Real-world "this is how X works" lines must be true and specific. If you're not
sure, cut it or show it instead.

---

## 2 · When the author has typed into the file

The author revises by typing straight into the draft, mid-sentence — in English, or in
**romanized Banglish** — plus notes in parentheses:

```
jehetu o mati theke opore ache. tai or card e arekta shongkha add hoyeche. chad er height.
The rule holds, tarmane judgement thikthak i hobe.
(ekhane pythagoras er animationta diye arekbar mone korano …)
```

How to treat it:
- **Typed lines are the author's own words. Keep their meaning and order; don't rewrite
  them.** English lines stay as written (fix only typing slips). Banglish lines are put
  into plain English, as close to their wording as English allows:
  - `jehetu o mati theke opore ache …` → `He's up off the ground, so his card gets one more number: the roof's height.`
  - `tarmane judgement thikthak i hobe` → `So the judging will be fair.`
- **Fix only typing slips** (a missing space, a doubled word, a missing `**`). Don't
  smooth away their phrasing.
- **Parenthetical notes are instructions**, like `(ekhane animation add koro …)` or
  `(add a scene here)`. Do what they ask (animation requests go to `pathshala-animate`),
  then delete the note.
- **The author edits while you work.** Re-read a file right before editing it, and change
  only what you were asked to.

---

## 3 · The final pass (every line, prose and screen strings)

Read the journey aloud in your head, as a teacher talking to a class-seven student in a
Bangladeshi school. For each sentence:

1. **Words (A, O):** a word the reader might not know? An idiom? A sentence longer than
   ~15 words or with two clauses that could be two sentences?
2. **Reasoning (B, C):** is anything assumed ("let's say", a number from nowhere)? Is a
   conclusion skipped, where it should end in "So …"?
3. **Clarity (D, E):** a metaphor to decode, or a clause that is only mood or filler?
4. **Story (F, G, H):** does the scene's change have a story reason? Does the result come
   back to the stake? Is the world Bengali — names, places, food, money in taka — with
   nothing Western slipped in?
5. **Voice (I, J):** is an objection closed by name? Is the invariant said like a person
   would say it?
6. **Instructions (K):** exact and in order, with an easy first move?
7. **Endings (L):** is a question left open that the journey actually answers? Is the new
   rule set against the last one?
8. **Consistency (N, P, Q):** spoken glue, one name per thing, the gloss given once, no
   unverifiable claim.
9. **Author's text (§2):** no Banglish or parenthetical notes left, and the author's own
   lines kept in their words.
10. **Exercises and side quests (pathshala-journey §3.1–3.2):** the exercise's wrong
    options are real slips, not jokes; its `Nope` lines say what to look at in the
    picture; the hint is a question back, not the answer; `praise` and `pass()` notes are
    the eureka said like a person, never *"That's correct!"*. A `SideQuest` title is a
    plain noun phrase (`A common code bug: u * v vs u @ v`).

Then check the mechanics:
- sentences end in a period; British spelling (maths, colour, metres);
- numbers and tuples in ASCII digits, no `bn()`;
- no emojis, and `!!!` / `???` only at the one peak.

---

## 4 · Don't

- **Don't rewrite the author's own sentences into "better" ones.** Their wording wins.
  You translate their Banglish, fix slips and fill the gaps they asked for.
- **Don't write down to the reader.** Plain is not babyish: no *"Yay!"*, no *"Great
  job, superstar!"*.
- **Don't add hype, praise or cheerleading.** A `pass()` note states what was found.
- **Don't comfort by formula.** *"If you picked X, you're not alone"* stays only if it
  goes on to say *why* X was tempting.
- **Don't explain before the reader plays.** The explanation lives in `<Then>`.
