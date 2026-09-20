---
name: pathshala-journey-plan
description: Turn one long source article into a set of Pathshala journey specs — decide how many journeys, give each its own driving question, story and screen-by-screen storyboard, and place every leftover section so nothing is silently dropped. Produces a <nn>_journey_specs.md plan that the pathshala-journey skill then builds from. Use when asked to convert, split, chunk or plan an article into journeys, to re-cut an existing spec, or to decide how many journeys an article should become.
---

# Planning journeys from an article

This skill turns **one source article** (a long reference write-up, e.g.
`src/content/articles/math_for_ai/03-vector-operations-and-norms.md`, ~950 lines) into
**a spec for N journeys** (`03_journey_specs.md`). It stops there. Building the MDX and
the screens is the `pathshala-journey` skill's job, and it reads this plan as its input.

**Read the worked pair before planning** — source `03-vector-operations-and-norms.md`
against output `03_journey_specs.md`. A looser, chattier example of the same job is
`02_journey_guideline.md`.

**The plan is a proposal, not a decision.** How many journeys, and what gets cut, is the
user's call. Always present the cut and one smaller alternative (§8) before anyone starts
writing MDX.

---

## 1 · Inventory the source first

Read the whole source article. Don't plan from its table of contents — the hooks and the
best stories are buried in the prose.

Build a **section ledger** as you read: every `##` and `###` of the source, and what it
is. Categories:

- **spine material** — an idea the reader must *do* to get. Becomes journey screens.
- **a debt or a hook** — the article's own open mystery, often flagged as such
  (`## 0 · Where we are, and what we owe`, `### Debt #1 paid: the golf ball`,
  `### A clue about the grams trap, hiding in plain sight`). **These are gold**: an
  article that already tracks its own debts has handed you the driving questions (§4).
- **notation** — a symbol table. Becomes a `SayIt` tap-to-reveal screen per journey, and
  the full table in the last journey's finale.
- **confusions / FAQ** (`## 10 · Confusions worth clearing up now`) — each one becomes a
  `<Check>` or a pass note *where it naturally arises*, never a list.
- **examples** — raw material for screens, or for main-article prose.
- **recap / quiz / next** (`## 11 · Five things to carry forward`, `## Check yourself`) —
  usually prose or the finale, not a screen.

Nothing on the ledger may end up unassigned (§7).

---

## 2 · Decide how many journeys

One journey = **one story, one setting, one "aha", 8–11 screens.** Cut where the story
would have to change, not where the source's headings change.

- Count the source's distinct "aha"s, not its sections. `03` has 8 top sections but 5
  real aha's early on; it became 7 journeys because add and stretch each deserved their
  own hands-on story.
- A chunk that can't fill ~8 screens isn't a journey — fold it into a neighbour or leave
  it in the main article's prose.
- A chunk that wants more than ~11 screens is two journeys.
- Sanity check against precedent: Article 1 → 6 side lessons, Article 2 → 5 journeys,
  Article 3 → 7 journeys.

State the reasoning in the plan, the way `02_journey_guideline.md` opens: "I'd suggest 5
journeys. … It falls into five chunks, and each has its own story and one clear aha."

---

## 3 · Pick one running story for the whole module

All the journeys of an article share **one setting**, so the reader walks through a single
afternoon rather than N unrelated scenes. Module 3 is the school science fair: ফাহিম's
class seven runs a stall called «সংখ্যার মেলা», each journey is one corner of the fair, and
the fair day ends at ডাক্তার আপার health stall.

- Pick a setting that can host every chunk. Each journey gets its **own corner** of it
  (the treasure hunt, the শরবত stall, the snack table, the comment box, the চা stalls).
- Reuse the standing cast: Shiku (the class robot, walks the chalk grid), সামিন, সোম,
  ফাহিম, নাসিব, আম্মু, ডাক্তার আপা. Give each a role for the module (stall captain,
  treasurer, chess club, movie club, judge) and keep it consistent across journeys.
- The setting must supply **stakes**: a prize to award, a box to fill, a customer waiting,
  a bet to settle. A setting with nothing at stake gives you topics, not questions.

---

## 4 · Give every journey a driving question

**The hardest and most important step.** A journey is one unanswered question, asked on
screen 1 and settled at the end — see `pathshala-journey` §0. A spec whose journeys have
only a `Story:` line produces a tour of errands, which is exactly the failure mode the
author flagged.

So each spec block opens with a `Question:` line. Test it:

1. **Can it be answered in one sentence on screen 1?** Then it's a topic, not a question.
   Push until the honest answer needs five or more screens.
2. **Is a wrong answer tempting?** If nobody would guess wrong, there's no suspense.
3. **Does it have stakes inside the story?** Somebody wants something and can't get it.
4. **Can the last screen close it by name?** Write that closing heading now:
   `## শেষ! বাজির ফলাফল`. If you can't, the question is still a topic.

### Question shapes that work

Turning a topic into a question is a small number of moves. Pick one that fits the
chunk's material:

| Shape | The move | Used by |
| --- | --- | --- |
| **The bet** | Someone claims one of these N jobs is impossible with your tools. Which? | 3.3 (যোগ + stretch → বাঁকা রাস্তা) |
| **The verdict** | A prize must be awarded, but the candidates can't be compared yet. | 3.4 (four finalists, four unlike cards) |
| **Everyone's right** | N people give N different answers and all are correct — so which does a machine take, and what breaks if it picks wrong? | 3.5 (কাক, পথিক, রাজা) |
| **The wrong answer, with a deadline** | The system is about to do something visibly dumb and somebody is standing there waiting. | 3.6 (মামা and the drama) |
| **Two machines disagree** | Same data, same flawless code, different answers. Trust which? | 3.7 (kg vs gram) |
| **The impossible errand** | Reproduce something *exactly* under a crippling constraint. | 1.1 (a bird over a button phone) |
| **The magic trick** | A result that looks like magic. How is it even possible? | 1.2 (five questions), 2.3 (king − man + woman) |

If a chunk resists all of these, it is probably notation, an FAQ, or recap — check §1's
ledger and place it as prose instead of forcing a journey around it.

---

## 5 · Storyboard the screens

Use the skeleton in `pathshala-journey` §0: seal a prediction on screen 1, let the old way
fail early, give each middle screen one piece of the answer, put one unaided
`এবার আপনার পালা` screen late, then `<Check>`, then the finale that closes the loop.

Write each screen as one line: **what it asks → what the reader does → the eureka**, with
the eureka written as the spoken `pass` note, because that sentence is the screen's whole
reason to exist. Add `[copy: X]` when an existing screen already has the interaction.

```
6. WayBack — সামিন is at (2, 1) and the prize at (6, 4). Which ONE card takes her
   there? → reader drags an arrow from সামিন to the prize and reads its numbers.
   → pattern over 2 more cases: end − start. → pass: "u − v = v থেকে u-তে যাওয়ার
   arrow। (6, 4) − (2, 1) = (4, 3)" [copy: RuleVsTape drag]
```

Add a `Then:` line wherever the explanation has a job beyond the eureka — the name, the
formula, a callback, an ML sighting, an open question.

Don't design the visuals here. One line per screen is the right resolution; the build
skill decides the SVG.

---

## 6 · Audit overlap with what already exists

Before the plan is done, grep the existing journeys so the new ones don't re-teach a
thing the reader already did by hand:

```
grep -rn '^export function' src/components/interactive/*-journey.tsx
grep -l '<Journey' src/content/articles/math_for_ai/*.mdx
```

Write the result into the plan as its own block, the way `03_journey_specs.md` does:

> **Already covered, not repeated:** golf ball (2.4 `GolfThrow`), Pythagoras in 2D/3D
> (2.5 `TilePour`, `RoomCorner`), Σ (2.6), the learning-step line (2.8 `KnobStep`).
> 3.4 only recalls Pythagoras in one screen.

A repeat is allowed when it's a deliberate callback in one screen. It's a bug when a whole
screen re-derives something the reader already earned.

---

## 7 · Place every leftover ("nothing dropped")

Go back to the §1 ledger and assign **every** entry. The plan states this explicitly so
the user can see nothing quietly vanished:

> **Nothing dropped. The extras find a corner of the fair:**
> - sentence = average of word vectors → the fair's comment box (3.3 `ReviewBox`)
> - k-means → where to put two চা stalls on the field (3.4 `TeaStalls`)
> - ridge / lasso penalties → the robotics club's "knob fine" (3.5 `KnobFine`)
> - notation table → a `SayIt` screen per journey; the full table in the 3.7 `Finale`
> - FAQ → each confusion becomes a `Check` or a pass note where it arises

Allowed destinations: a journey screen · a `<Check>` · a pass note · a `<Then>` callback ·
main-article prose · the last journey's finale · **explicitly deferred to a later
article** (say which). "Dropped" is a fine answer as long as it's written down.

---

## 8 · Offer a smaller cut

Always give the user one alternative with fewer journeys, and say what you'd keep separate
whatever happens:

> If 5 is too many, a 3-journey version merges 2.1 into the main prose and folds 2.2 with
> 2.3 ("Arrow আর king-queen"). I'd still keep 2.3 separate, because it's the payoff to the
> opening mystery.

---

## 9 · Output: the spec file

Write to `src/content/articles/math_for_ai/<nn>_journey_specs.md`. Shape:

````md
# Article <n> → <N> journeys (Math for AI <n>.x)

Source: `<source file>`. One running story: **<the setting>**. <One or two lines on the
setting, and how the day ends.>

**Cast:** <name> (<role>) · <name> (<role>) · …

**Already covered, not repeated:** <§6>

**Nothing dropped. The extras find a corner:** <§7 bullets>

| # | Slug | Title | Screens file |
| --- | --- | --- | --- |
| <n>.1 | `<nna>_<slug>` | Math for AI <n>.1 — <Bangla title> | `<topic>-journey.tsx` |
| … | | | |

Wiring: append all <N> after `<prev slug>` in `courses.ts`; <prev journey>'s Finale gets a
`LessonLink` to <n>.1; each journey's last step links to the next; <n>.<N> closes the
module and points to Article <n+1>.

---

```
<n>.1 — <title>
Question: <asked on screen 1, settled on the last screen, with its stake>
Story:    <who, where, what's at stake>

1. <ScreenName> — <question> → <what the reader does> → pass: "<the eureka, spoken>"
   [copy: <existing screen>]
   Then: <the name, the formula, a callback, an open question>
2. …
n. <ScreenName> — এবার আপনার পালা: the reader answers the Question unaided
n+1. Check — <the drill> → LessonLink → <n>.2
```

<one such fenced block per journey>

---

## Open questions

1. <a call you could not make alone, with the options>
2. …
````

Keep the per-journey blocks in fenced code blocks, as the existing specs do: they are
working notes, not prose, and the fence keeps Bangla, formulas and `→` readable.

---

## 10 · Also report problems you noticed in the source

Planning means reading the whole article closely, so say what's broken while you're
there — the way `02_journey_guideline.md` ends:

> - It has no `export const metadata`, so it won't be listed as a lesson.
> - It uses pipe tables, which don't render in this pipeline and would need `<Table>`.

Worth flagging: missing `metadata`, pipe tables, `LessonLink` targets that don't exist,
coined Bangla for technical terms, translated adjective+noun compounds
(`গড় ছাত্র` — see `pathshala-journey` §2.2), and any idea named before it is felt.

---

## 11 · Open questions are raised, not resolved

End the plan with the calls you couldn't make alone. Real examples from
`03_journey_specs.md`:

1. **3.7 screen 4, ÷ √5:** heavy for a zero-math reader. Option: show it as "gap-গুলোর
   বর্গের average, তারপর root" (same number) and never show √n.
2. **3.6 uses "গুণ করে যোগ" before the dot product exists.** OK as a black-box club rule,
   or should 3.6 compare by angle only?
3. **3.5 is now 10 screens.** If it feels long, `WorstPixel` is the one to cut.

Anything that changes the reader's experience and has two defensible answers goes here
rather than being decided silently.

---

## 12 · Handoff

When the user approves a cut, switch to the `pathshala-journey` skill and build one
journey at a time, verifying each (`npm run check`, then `npm run shot` on new screens)
before starting the next. Keep the spec file updated if the build changes the plan — it is
the module's memory, and later journeys read it.
