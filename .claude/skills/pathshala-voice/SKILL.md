---
name: pathshala-voice
description: Make a Pathshala journey read the way the author writes and edits it. The author's editing pass, learned from their own revisions of AI drafts, is plain spoken Bangla with the English words people actually say. Every step is reasoned out, never assumed. The story's own logic is filled in, objections are ticked off, and filler and clever metaphors are cut. Use when writing, rewriting, polishing or reviewing any journey prose or screen text (src/content/articles/math_for_ai/*.mdx, the Bangla strings in src/components/interactive/*-journey.tsx). Use it as the final pass before handing a journey over, when asked to make text "smooth", "non robotic" or "in my way", and whenever the author has typed romanized Banglish edits or notes into a file that need turning into finished Bangla.
---

# Writing a journey the author's way

The base voice (আপনি, spoken চলিত, English technical words in Latin, story first and name
last) is in `pathshala-journey` §2–3. The longer guide is the author's
`bangla-story-article` skill. Read one of them first.

**This skill is the author's editing pass.** It lists what the author actually changes
when they rework an AI draft. It was learned from their own commits and edits ("fixed
wordings", "fixed binary text", the 3.1 treasure-hunt rewrite, the 3.4 notes). An AI draft
can follow every voice rule and still get rewritten, and these are the reasons. Run every
line of a journey through §1, then the checklist in §3.

---

## 1 · What the author changes, and why

Each item shows the author's real edit: `AI draft` → **author**.

### A · Use the word people actually say, even when it's English

The author swaps careful Bangla for the English a Bangladeshi kid or teacher uses out loud:
- `বিজ্ঞান মেলা` → **`Science Fair`**; `গুপ্তধন খোঁজা` → **`Treasure Hunt`**; `গুপ্তধন` → **`treasure`**
- `সাজ` → **`decoration`**; `কার্ড` → **`card`**
- `arrow হিসেবে ভাবুন` → **`arrow হিসেবে imagine করুন`**
- `গড় বয়স` → **`বয়সের average`**; `গড় রান` → **`batting average`**

Test it by ear: would a student say this word to a friend? If the natural word is English,
keep it English, in Latin script. Never glue a translated adjective onto a noun (`গড়
ছাত্র`).

Use the reader's own vocabulary, too. Once the reader knows x and y, the author writes
`x-এর ঘর` and `y-এর ঘর`, not `পূর্বের`/`উত্তরের`.

### B · Never assume a step; reason it out

- `ডানের বাল্বের দাম ১ ধরে নিলাম।` →
  **`ডানের বাল্বটা দিয়ে শুরু করি। একটা বাল্ব off থাকলে কিছুই যোগ হয় না, মানে ০। তাহলে on
  করলে পরের সংখ্যাটা বলা উচিত, ১। দাম ২ দিলে ১ বলার আর কোনো উপায় থাকে না। তাই ডানের
  বাল্বের দাম ১।`**

`ধরে নিলাম` / "let's assume" is a red flag. A twelve-year-old must be able to *derive*
every number from what they already know. If a choice looks arbitrary, give the reason
that forces it.

### C · Spell out the chain, and land it with `তার মানে`

- `ফাহিমের প্রথম পা আর সোমের দ্বিতীয় পা আসলে একই card, শুধু দুই জায়গায় আঁকা।` →
  **`খেয়াল করেছেন, ফাহিম যে দিক বরাবর প্রথমে হাঁটলো, সোম ঠিক সেদিক বরাবর হাঁটলো পরে? শুধু
  graph paper-এ ওদের জায়গাটা আলাদা। আর vector কাগজের কোন জায়গায় বসে আছে, তাতে যে কিছু যায়
  আসে না, সেটা তো আমরা আগেই শিখেছি। তার মানে মুখোমুখি arrow দুইটা আসলে একই vector।`**

Don't compress a proof into one clever line. Walk it:
1. what they saw;
2. the fact from before that applies;
3. **`তার মানে …`** plus the conclusion.

### D · Plain beats clever

- `order-টাই এখানে address-এর মতো কাজ করছে।` → **`order-টা এখানে অনেক important।`**
- `পূর্বের হিসাব কখনো উত্তরের হিসাবে মেশে না।` → **`x-এর সংখ্যা কখনো y-এর সংখ্যার সাথে
  যোগ হয় না, যে যার ঘরে থাকে।`**

Cut metaphors that need decoding, and say the literal thing. A homely image the reader
already lives with is welcome (see H); a writerly one isn't.

### E · Cut the filler

The author deletes these on sight:
- `কোনো ধাঁধা নাই,` · `শুনতে একদম সোজা, কিন্তু` · `এবার ছবি ছাড়া, শুধু সংখ্যা।`
- decorative job titles (`সামিন হচ্ছে stall-এর খাজাঞ্চি, … সব হিসাব তার খাতায়` → **`সামিন
  stall-এর টাকা-পয়সার হিসাব রাখে।`**)
- translated articles (`মিলে একটা ধূসর` → **`মিলে ধূসর`**)
- a stray `লেখক`, and extra `সব`

If a clause only sets mood or restates the obvious, drop it.

### F · Fill in the story's own logic

The author adds the *why* inside the story, which AI drafts skip:
- `দ্বিতীয় card সোমের, আর সেটা মাঠে না, স্কুলের ছাদে।` + **`যেহেতু ও মাটি থেকে ওপরে আছে, তাই
  ওর card-এ আরেকটা সংখ্যা যোগ হয়েছে: ছাদের height।`**
- A vague rule made exact: **`নিজের card ধরে হেঁটে যে Gate থেকে সবচেয়ে বেশি দূরে গিয়ে থামবে,
  পুরস্কার তার।`**

If something in the scene changes (a third number, a lost card, a new rule), say what in
the story caused it.

### G · Tie every result back to the stake

After a rule is shown, the author says what it means for the journey's question:
- **`নিয়মটা খাটে, তার মানে বিচারটা ঠিকঠাকই হবে।`**
- **`“কতটা হেঁটেছে” আর “কত দূরে থেমেছে”, দুইটা আলাদা হিসাব, আর পুরস্কারের rule ছিল
  দ্বিতীয়টা।`**

### H · An everyday comparison from a kid's own day

- **`বাসা থেকে স্কুলে যাওয়া আর স্কুল থেকে বাসায় ফেরা, রাস্তার length তো একই থাকে।`**

Use one short comparison the reader has lived. Don't pile up several.

### I · Tick off the objection by name, and be fair to it

- **`**নাসিবের দ্বিতীয় argument-টাও টিকলো না।**`** (bold, the character's name, the count)
- **`ফাহিমের আপত্তিটা তাই ফেলে দেওয়ার মতো না, কিন্তু অপ্রাসঙ্গিক।`**

Take the objector seriously first ("not silly, but beside the point"), then close it.

### J · Say the invariant like a person would

- `হাঁটা পথ সবসময় 7.29।` → **`হাঁটা পথ সবসময় 7.29, এক চুলও নড়ে না।`**

Say what stays fixed with a spoken idiom (`এক চুলও নড়ে না`, `একবারও বাড়ে না`), not
just the number.

### K · Instructions exact, in order, with a foothold

- `Shiku হাঁটবে ঠিকই, কিন্তু আপনি উত্তর লিখে ফেলার পরে।` → **`Shiku এবারও হাঁটবে ঠিকই,
  কিন্তু তার আগে সংখ্যা দুইটা আপনাকে বসাতে হবে।`**
- Added scaffolding: **`তবে শুরুতেই থার্ড বাল্ব নিয়ে মাথা ঘামানোর দরকার নেই। প্রথম দুটো বাল্ব
  অন-অফ করে আগের প্যাটার্নটা আনুন। এরপর …`**
- A rule's hidden condition stated: `কোনো সংখ্যা যেন দুইবার না আসে` → **`বাল্ব দুটার দাম
  যোগ করতে গেলে কোনো সংখ্যা যেন দুইবার না আসে`**

Tell the reader exactly what to do first, and give the easy first move.

### L · Answer what the journey can answer; contrast with the last rule

The AI draft left `u − v আর v − u কি এক? নিজেই ভেবে দেখুন।` hanging. The author had the
next screen show it, then closed it plainly:

**`তাই u − v আর v − u এক না, একটা আরেকটার ঠিক উল্টো। যোগের বেলায় order matter করেনি,
বিয়োগের বেলায় করে।`**

Keep an open question only as a real teaser for a later journey. When you close one, set
it against the rule just before it (`যোগের বেলায় … বিয়োগের বেলায় …`).

### M · Honest about suspense and difficulty

- Holding back, and saying so: **`But ছবিটা এখনও অতটা স্পষ্ট না। Hold tight, একটু পরেই
  স্পষ্ট হবে।`**
- Admitting the notation is hard, lightly: `paper-এ … ছোট ছোট চিহ্নে` → **`বইপত্রে …
  দুর্বোধ্য সব symbol দিয়ে`**

### N · Spoken glue and everyday verbs

- Particles the author adds: **`ও কিন্তু`**, **`এবারও`**, **`একবার`**, **`অনুযায়ী`**, **`তো`**.
- Verbs made everyday:
  - `তৈরি হলো` → **`আঁকা হয়ে গেল`**
  - `দেখা যাক` → **`দেখি`**
  - `হয়:` → **`হয়ে যায়।`**
  - `মোটে` → **`মাত্র`**
  - `উল্টো দিকের` → **`মুখোমুখি`**
- Open an explanation by turning to the reader: **`ঝামেলাটা খেয়াল করেছেন?`**

### O · Gloss a term once, then stick to one name

- **`**parallelogram** বা সামান্তরিক`** · **`তিনটা দিক বা dimension`**
- Once it's `treasure`, it stays `treasure`. Once it's `card`, don't switch to `হাঁটা`.
- Quotes are `“ ”`, never `« »`.

### P · No claim you can't stand behind

The author deleted `ফোনের food-tracking app-গুলো behind the scene এ ঠিক এই যোগটাই করে।`
Real-world "this is how X works" lines must be true and specific. If you're not sure,
cut it or show it instead.

---

## 2 · When the author has typed into the file

The author revises by typing **romanized Banglish** straight into the draft, mid-sentence,
plus notes in parentheses. From 3.4:

```
jehetu o mati theke opore ache. tai or card e arekta shongkha add hoyeche. chad er height.
নিয়মটা খাটে,tarmane judgement thikthak i hobe।
দ্বিতীয় card যেদিকেই ঘোরান, হাঁটা পথ সবসময় 7.29। eta shobshomoy fixed thakche.
(ekhane pythagoras er animationta diye arekbar mone korano …)
```

How to treat it:
- **Romanized lines are the author's own words. Convert them; don't rewrite them.** Put them in Bangla script with their wording and order intact. English words stay in Latin, and the sentence gets fixed spacing and `।`:
  - `jehetu o mati theke opore ache …` → `যেহেতু ও মাটি থেকে ওপরে আছে, তাই ওর card-এ আরেকটা সংখ্যা যোগ হয়েছে: ছাদের height।`
  - `eta shobshomoy fixed thakche` → `এক চুলও নড়ে না` (the same meaning, said as the author later chose to)
  - `judgement thikthak i hobe` → `বিচারটা ঠিকঠাকই হবে`
- **Fix only typing slips** (`রাস্তাr`, `tow` → `তো`, a missing space or closing `**`). Don't smooth away their idioms.
- **Parenthetical notes are instructions**, like `(ekhane animation add koro …)` or `(give them …)`. Do what they ask (animation requests go to `pathshala-animate`), then delete the note.
- **Leave the author's own spellings alone.** In lines the author wrote, some casual English is in Bangla script (`থার্ড বাল্ব`, `অন-অফ`, `প্যাটার্ন`, `স্টুডেন্ট`). Don't "correct" those. In new text you write, follow the base rules and keep technical words in Latin.
- **The author edits while you work.** Re-read a file right before editing it, and change only what you were asked to.

---

## 3 · The final pass (every line, prose and screen strings)

Read the journey aloud in your head, as a teacher talking to a class-seven student. For
each sentence:

1. **Words (A):** is there a Bangla word nobody says, where the English is natural? Is there a translated adjective + noun?
2. **Reasoning (B, C):** is anything assumed (`ধরে নিলাম`, a number from nowhere)? Is a conclusion skipped, where it should end in `তার মানে …`?
3. **Clarity (D, E):** is there a metaphor to decode, or a clause that is only mood or filler?
4. **Story (F, G):** does the scene's change have a story reason? Does the result come back to the stake?
5. **Voice (H–J):** is an objection closed by name? Is the invariant said like a person would say it? Is there at most one everyday comparison?
6. **Instructions (K):** are they exact and in order, with an easy first move?
7. **Endings (L):** is a question left open that the journey actually answers? Is the new rule set against the last one?
8. **Consistency (N–P):** spoken glue, one name per thing, `“ ”` quotes, the gloss given once, no unverifiable claim.
9. **Author's text (§2):** no romanized text or parenthetical notes left, and the author's own lines kept in their words.

Then check the mechanics:
- sentences end in `।`;
- tuples in Latin digits, counts through `bn()`;
- no emojis, and `!!!` / `???` only at the one peak.

---

## 4 · Don't

- **Don't rewrite the author's own sentences into "better" ones.** Their wording wins. You convert, fix slips and fill the gaps they asked for.
- **Don't swing to the other extreme.** English-heavy sentences with Bangla as glue are wrong too. English is for the words people say in English; the grammar stays Bangla.
- **Don't add hype, praise or cheerleading.** A `pass()` note states what was found, not `দারুণ!`.
- **Don't comfort by formula.** A line like `যারা X বেছেছিলেন, তারা একা নন` stays only if it goes on to say *why* X was tempting.
- **Don't explain before the reader plays.** The explanation lives in `<Then>`.
