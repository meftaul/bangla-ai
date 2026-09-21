---
name: pathshala-journey-plan
description: Turn one long source article into a set of Pathshala journey specs — cut it into as many small journeys as it honestly holds (one "aha" each, 11 steps at most), give each its own driving question, a story set in everyday Bengali life, and a step-by-step storyboard that names the story scene, the interactive animation, the explanation figure and the visual exercise, and place every leftover section so nothing is silently dropped. Produces a <nn>_journey_specs.md plan that the pathshala-journey skill then builds from. Use when asked to convert, split, chunk or plan an article into journeys, to re-cut an existing spec, or to decide how many journeys an article should become.
---

# Planning journeys from an article

This skill turns **one source article** (a long reference write-up, e.g.
`src/content/articles/math_for_ai/03-vector-operations-and-norms.md`, ~950 lines) into
**a spec for N journeys** (`03_journey_specs.md`). It stops there. Building the MDX and
the screens is the `pathshala-journey` skill's job, and it reads this plan as its input.

**The goal is graspability.** Every journey is a small story set in Bengali life, told in
plain English, where the reader *sees* the idea move and *does* it with their hands
before it is named. Small journeys are easier to grasp than long ones, so **cut the
article into as many journeys as it honestly holds, each at most 11 steps.**

**Read a worked pair before planning** — source `03-vector-operations-and-norms.md`
against output `03_journey_specs.md`, and the more recent `04_journey_specs.md`. Their
wording is Bangla and some of their journeys run past 11 steps; they show the *method*,
not the size or the language.

**The plan is a proposal, not a decision.** How many journeys, and what gets cut, is the
user's call. Always present the cut and one coarser alternative (§8) before anyone starts
writing MDX.

---

## 1 · Inventory the source first

Read the whole source article. Don't plan from its table of contents — the hooks and the
best stories are buried in the prose.

Build a **section ledger** as you read: every `##` and `###` of the source, and what it
is. Categories:

- **spine material** — an idea the reader must *do* to get. Becomes journey steps.
- **a debt or a hook** — the article's own open mystery, often flagged as such
  (`## 0 · Where we are, and what we owe`, `### Debt #1 paid: the golf ball`). **These
  are gold**: an article that tracks its own debts has handed you the driving questions.
- **notation** — a symbol table. Becomes a tap-to-reveal screen where it is needed, and
  the full table in a `SideQuest` at the end of the last journey.
- **confusions / FAQ** — each one becomes an exercise's tempting wrong option, or a line
  in a `<Then>`, *where it naturally arises*, never a list.
- **examples** — raw material for screens, scenes and exercises.
- **recap / quiz / next** — usually the ending step or a side quest, not a screen.

Nothing on the ledger may end up unassigned (§7).

---

## 2 · Decide how many journeys: as many as it holds

One journey = **one story, one setting corner, one "aha", 11 steps at most** (7–11 is the
usual range). Count every step: the hook, the pieces, *Your turn*, the visual exercise
and the ending.

- **Count the source's distinct "aha"s, then give each its own journey.** An aha is a
  moment the reader's picture of the world changes: "adding arrows is walking one after
  the other", "stretching changes length but not direction", "a unit vector is length 1".
  Two ahas in one journey means the second one gets squeezed. Split them.
- **The test for a split:** could each half open with its own question and close it by
  name? If yes, split. If one half has no question of its own (it's only a detail of the
  other), keep it together.
- **The floor:** a chunk that can't fill ~6 steps with a question, a failed old way, two
  pieces, *Your turn*, an exercise and an ending isn't a journey — fold it into a
  neighbour, turn it into a side quest, or leave it in the main article's prose.
- **The ceiling:** a chunk that wants more than 11 steps is two journeys. No exceptions,
  no "11 plus follow-up checks".
- Sanity check against precedent: Article 3 became 7 journeys under the old, looser
  budget (up to ~16 steps). Under the 11-step cap the same material would cut into
  roughly 10–12.

State the reasoning in the plan: "I'd suggest 9 journeys. The article has nine distinct
ahas, and each one has its own question and its own corner of the story."

---

## 3 · Pick one running story, set in Bengali life

All the journeys of an article share **one setting**, so the reader walks through a
single day or event rather than N unrelated scenes. Module 3 is the school science fair:
Fahim's class seven runs a stall, each journey is one corner of the fair, and the day
ends at Dr. Apa's health stall.

- **The setting is one the reader has lived:** a school science fair, the haat on market
  day, Pohela Boishakh, a cricket tournament on the field, a wedding, the launch trip
  home for Eid, a coaching centre, a village during load-shedding, the tea stall at the
  corner. Never a Western setting (no lemonade stands, snow days, baseball).
- **Many small journeys need many corners.** Pick a setting big enough to host every
  chunk, and give each journey its **own corner** of it (the treasure hunt, the sherbet
  stall, the snack table, the comment box, the tea stalls).
- **Reuse the standing cast:** Shiku (the class robot, walks the chalk grid), Samin, Som,
  Fahim, Nasib, Ammu, Dr. Apa, Mama, Rina, Karim. Give each a role for the module (stall
  captain, treasurer, chess club, movie club, judge) and keep it consistent.
- **The setting must supply stakes**: a prize to award, a box to fill, a customer
  waiting, a bet to settle, change to give back. A setting with nothing at stake gives
  you topics, not questions.
- **The story must be animatable.** Each corner should have something to *show*: people
  walking, things being poured, stacked, pushed, measured. If the story only happens in
  dialogue, the story scenes will be talking heads.

---

## 4 · Give every journey a driving question

**The hardest and most important step.** A journey is one unanswered question, asked on
step 1 and settled at the end — see `pathshala-journey` §0. A spec whose journeys have
only a `Story:` line produces a tour of errands.

So each spec block opens with a `Question:` line. Test it:

1. **Can it be answered in one sentence on step 1?** Then it's a topic, not a question.
   Push until the honest answer needs several steps.
2. **Is a wrong answer tempting?** If nobody would guess wrong, there's no suspense.
3. **Does it have stakes inside the story?** Somebody wants something and can't get it.
4. **Can the last step close it by name?** Write that closing heading now:
   `## The end! The bet is settled`. If you can't, the question is still a topic.

With small journeys, the question is small too — that's fine. *"Can Shiku reach the
mango tree using only these two cards?"* is a whole journey.

### Question shapes that work

| Shape | The move | Used by |
| --- | --- | --- |
| **The bet** | Someone claims one of these N jobs is impossible with your tools. Which? | 3.3 (add + stretch → the bent road) |
| **The verdict** | A prize must be awarded, but the candidates can't be compared yet. | 3.4 (four finalists, four unlike cards) |
| **Everyone's right** | N people give N different answers and all are correct — so which does a machine take? | 3.5 (the crow, the walker, the king) |
| **The wrong answer, with a deadline** | The system is about to do something visibly dumb and somebody is standing there waiting. | 3.6 (Mama and the drama) |
| **Two machines disagree** | Same data, same flawless code, different answers. Trust which? | 3.7 (kg vs gram) |
| **The impossible errand** | Reproduce something *exactly* under a crippling constraint. | 1.1 (a bird over a button phone) |
| **The magic trick** | A result that looks like magic. How is it even possible? | 1.2 (five questions), 2.3 (king − man + woman) |

If a chunk resists all of these, it is probably notation, an FAQ, or recap — check §1's
ledger and place it as a side quest or prose instead of forcing a journey around it.

---

## 5 · Storyboard the steps

Use the skeleton in `pathshala-journey` §0: seal a prediction on step 1, let the old way
fail early, give each middle step one piece of the answer, put one unaided *Your turn*
step late, then a visual exercise, then the ending that closes the loop. **Number the
steps; the last number must be ≤ 11.**

Mark the steps that open with a guess with `[predict]`: **2 per journey, the sealed bet
on step 1 included**, and only where the obvious answer is wrong.

For each step write:

- **one line: what it asks → what the reader does → the eureka**, with the eureka
  written as the spoken `pass` note, because that sentence is the step's whole reason to
  exist. Add `[copy: X]` when an existing screen already has the interaction.
- **`Scene:`** the story scene that acts out the setup, if the setup is a scene (who
  walks in, what claim is made). Most steps have one; the ending usually has one.
- **`Then:`** what the explanation adds (the name, the formula, a callback), and
  **`Fig:`** what its watch-only figure acts out. Budget each `Then:` at one phone
  screen (1–2 short paragraphs); a second idea is a second step or a second journey.
- **`Side quest:`** a real-world story, table or look-ahead, only if any.

The **exercise step** says what the new case is and *how the reader answers on the
picture* (tap, drag, pick a drawing, build with steppers, spot the mistake — see
`pathshala-journey` §3.2). A text-only multiple choice is not an exercise spec.

```
6. WayBack — Samin is at (2, 1) and the prize at (6, 4). Which ONE card takes her
   there? → reader drags an arrow from Samin to the prize and reads its numbers
   → pattern over 2 more cases: end − start → pass: "u − v goes from v to u."
   [copy: RuleVsTape drag]
   Scene: Samin stands by the gate holding a blank card; Fahim points at the prize.
   Then: the name (subtraction), set against addition · Fig: the two arrows swap ends
   Side quest: —
9. TryItBack — visual exercise: Nasib at (5, 5), the tea stall at (1, 3) → reader drags
   the one-card arrow; a wrong arrow walks Nasib to the wrong stall
```

Don't design the visuals in detail here. One line per slot is the right resolution; the
build skill decides the SVG.

---

## 6 · Audit overlap with what already exists

Before the plan is done, grep the existing journeys so the new ones don't re-teach a
thing the reader already did by hand:

```
grep -rn '^export function' src/components/interactive/*-journey.tsx
grep -l '<Journey' src/content/articles/math_for_ai/*.mdx
```

Write the result into the plan as its own block:

> **Already covered, not repeated:** golf ball (2.4 `GolfThrow`), Pythagoras in 2D/3D
> (2.5 `TilePour`, `RoomCorner`), Σ (2.6), the learning-step line (2.8 `KnobStep`).
> 3.4 only recalls Pythagoras in one step.

A repeat is allowed when it's a deliberate callback in one step. It's a bug when a whole
step re-derives something the reader already earned — and under an 11-step cap it's a
step you can't afford.

---

## 7 · Place every leftover ("nothing dropped")

Go back to the §1 ledger and assign **every** entry. The plan states this explicitly so
the user can see nothing quietly vanished:

> **Nothing dropped. The extras find a corner of the fair:**
> - sentence = average of word vectors → the fair's comment box (3.3 `ReviewBox`)
> - k-means → where to put two tea stalls on the field (3.4 `TeaStalls`)
> - notation table → a `SideQuest` at the end of the last journey
> - FAQ → each confusion becomes an exercise's tempting wrong option where it arises

Allowed destinations: a journey step · an exercise (or its wrong option) · a pass note ·
a `<Then>` callback · a `<SideQuest>` card (stories, reference tables, look-aheads) ·
main-article prose · the last journey's ending · **its own new journey** (often the
right answer under the cap) · **explicitly deferred to a later article** (say which).
"Dropped" is a fine answer as long as it's written down.

---

## 8 · Offer a coarser alternative

Always give the user one alternative with fewer journeys — still every journey ≤ 11 steps
— and say what you'd keep separate whatever happens:

> If 11 journeys is too many, an 8-journey version folds 3.2 into 3.1's side quest and
> leaves the notation to the article's prose. I'd still keep 3.6 separate, because it's
> the payoff to the opening mystery.

---

## 9 · Output: the spec file

Write to `src/content/articles/math_for_ai/<nn>_journey_specs.md`. Shape:

````md
# Article <n> → <N> journeys (Math for AI <n>.x)

Source: `<source file>`. One running story: **<the setting>**. <One or two lines on the
setting, and how the day ends.>

Language: English, set in Bengali life. Every journey ≤ 11 steps.

**Cast:** <name> (<role>) · <name> (<role>) · …

**Already covered, not repeated:** <§6>

**Nothing dropped. The extras find a corner:** <§7 bullets>

| # | Slug | Title | Steps | Screens file |
| --- | --- | --- | --- | --- |
| <n>.1 | `<nna>_<slug>` | Math for AI <n>.1 — <English title> | 9 | `<topic>-journey.tsx` |
| … | | | | |

Wiring: append all <N> after `<prev slug>` in `courses.ts`; <prev journey>'s ending gets
a `LessonLink` to <n>.1; each journey's last step links to the next; <n>.<N> closes the
module and points to Article <n+1>.

---

```
<n>.1 — <title>
Question: <asked on step 1, settled on the last step, with its stake>
Story:    <who, where in Bengali life, what's at stake>
Steps:    <count ≤ 11>

1. <ScreenName> [predict] — <question> → <what the reader does> → pass: "<eureka>"
   Scene: <the story scene>
   Then: <the name, the formula, a callback> · Fig: <what the figure acts out>
   Side quest: <story / table / look-ahead>                  (only if any)
2. …
n−2. <ScreenName> — Your turn: the reader answers the Question unaided
n−1. <TryIt> — visual exercise: <new case> → <how they answer on the picture>
n. The end! <loop closed by name> — Scene: <closing moment> → LessonLink → <n>.2
```

<one such fenced block per journey>

---

## Open questions

1. <a call you could not make alone, with the options>
2. …
````

Keep the per-journey blocks in fenced code blocks: they are working notes, not prose,
and the fence keeps formulas and `→` readable.

---

## 10 · Also report problems you noticed in the source

Planning means reading the whole article closely, so say what's broken while you're
there:

> - It has no `export const metadata`, so it won't be listed as a lesson.
> - It uses pipe tables, which don't render in this pipeline and would need `<Table>`.

Worth flagging: missing `metadata`, pipe tables, `LessonLink` targets that don't exist,
any idea named before it is felt, and examples that only make sense in a Western setting
(and what Bengali scene could replace them).

---

## 11 · Open questions are raised, not resolved

End the plan with the calls you couldn't make alone. For example:

1. **3.7 step 4, ÷ √5:** heavy for a zero-math reader. Option: show it as "the average of
   the squared gaps, then the root" (same number) and never show √n.
2. **3.6 uses "multiply and add" before the dot product exists.** OK as a black-box club
   rule, or should 3.6 compare by angle only?
3. **3.5 is at 11 steps.** If it feels long, `WorstPixel` is the one to move into its own
   journey.

Anything that changes the reader's experience and has two defensible answers goes here
rather than being decided silently.

---

## 12 · Handoff

When the user approves a cut, switch to the `pathshala-journey` skill and build one
journey at a time, verifying each (`npm run check`, then `npm run shot` on new screens)
before starting the next. Add the animation with `pathshala-animate` and finish with the
`pathshala-voice` pass. Keep the spec file updated if the build changes the plan — it is
the module's memory, and later journeys read it.
