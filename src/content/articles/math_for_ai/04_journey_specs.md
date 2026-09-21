# Article 4 → six journeys (Math for AI 4.x)

Source: `04-dot-product-and-similarity.md`. One running story: **শীতের ছুটিতে নানুর বাড়ি**.
The science fair is over, and ফাহিম goes with মামা to the village: নানু, মামা and
মামী live there (নানুর রেডিও from 2.8 is on the আলমারি). Each journey is one part of
the holiday: the হাট, the কাদা রাস্তা on the way home, দুপুরের ছাদ, the TV evening,
the river, and the গ্রামের পাঠাগার. The holiday ends with Module 1 read out loud.

The module's own debt, carried from 3.6 and the 3.7 finale: **নাসিবের movie club-এর
বন্ধ বাক্স, “ঘরে ঘরে গুণ করে যোগ”।** Why should that recipe measure how alike two
things are? 4.1 opens the box, 4.2 finds what its number says, 4.3 finds why, and
4.4 finishes মামা's film properly.

**Cast:** ফাহিম (the visitor, carries the club's box in his head) · মামা (comedy
lover, taste (2, 5) from 3.6; says big things confidently) · মামী (drama lover,
taste (4, 1); the sceptic) · নানু (no film history at all: the zero vector) ·
ভ্যানওয়ালা চাচা · মাঝি চাচা (গুণ টানা) · পাঠাগারের আপা (the librarian) · Shiku
(came along; still walks a chalk grid, now on the উঠান) · নাসিব and সামিন on the
phone when the club is needed.

**Already covered, not repeated:**
- the loud film and the length in the score (3.6 `LoudFilm`, `WhyLoud`): 4.2
  recalls it in one screen (`StrongPush`), 4.6 uses it only as the setup for
  the search engine
- normalising, v̂, the unit ring (3.6 `ShrinkToOne`, `HatCheck`, `OnTheRing`),
  and the normalised films 3.71 / 5.34 (3.6 `FairFight`): 4.4 finishes that
  hand-off in one screen instead of re-deriving it
- "length can be the news" (3.6 `BigSpender`): 4.6 is one sort screen, not a new story
- random high-dimensional arrows sit near 90° (2.7 `CoinArrows`, `CoinMany`): 4.2
  `CoinBox` shows that this was the box's 0 all along; one screen
- Pythagoras and ‖v‖ (2.5, 3.4), basis e₁ e₂ and the tilted remote (3.3
  `TwoButtons`, `TiltedField`), the knob machine (2.8 `OneKnob`, `KnobStep`):
  used only as callbacks

**Nothing dropped. The extras find a corner of the holiday:**
- the "Can I multiply two vectors?" debt from 3.7 → 4.1 `TwoSacks`
- linear model = features · weights → the দালাল's cow price (4.1 `CowPrice`); the
  neuron `w · x + b`, then a bend → the 4.1 `CowPrice` `<Then>`, with a callback to 3.3 `BendIt`
- the experiment table of §2 → 4.2 `PushRing`
- the cosine table (stick at 0°…180°) → 4.3 `StickShadow`
- "why the two definitions agree" (basis proof) → 4.3 `NoCrossTalk` (tap grid)
- "a component is a shadow", new coordinates = dot with new directions (PCA
  sentence) → 4.3 `AxisShadow` + `<Then>` callback to 3.3 `TiltedField`
- Cauchy–Schwarz: named in one `<Then>` line in 4.4
- the friend's near-tie and the 3.6 hand-off (divide by মামা's own length) → 4.4 `LastDivide`
- orthogonality in any dimension → 4.2 `CoinBox` + 4.2 Check; its meaning ("nothing in common",
  not "opposite") → 4.5 `SidePull` and the 4.4 `ScaleCard` pass note
- projection as a vector, leftover ⊥ → 4.5; PCA in words → 4.5 `KeepShadows`
- the loud film recommended to both, and the search engine → 4.6
- normalise once, then just dot; distance agrees for unit vectors (2 − 2cos θ) → 4.6 `OneRanking`
- the comparison table dot / cosine / distance → the 4.6 `<Then>`
- real systems (§8): neuron → 4.1; attention → 4.6 `WhoIsIt`; matrix multiplication →
  4.6 finale teaser for Module 2
- §9 "Module 1, read out loud" → 4.6 `Finale` (the formula, piece by piece, where each came from)
- notation (§10) → a SayIt-style `Table` in each finale; the full table in the 4.6 `Finale`
- FAQ (§11): `u * v` vs `u @ v` → 4.1 `TwoSacks` `<Then>` · "0.9 = 90%?" → 4.4
  `ScaleCard` · "cos 0 = opposite?" → 4.5 Check · zero vector → 4.4 `NanuCard` ·
  cross product → one line in the 4.1 `TwoSacks` `<Then>` ("আরেকটা গুণ আছে, ML-এ প্রায় লাগে না") ·
  cosine distance → 4.6 `OneRanking` `<Then>`
- Check yourself: Q1 → 4.1 Check · Q2 → 4.2 Check · Q3, Q4, Q8 → 4.4 · Q5 → 4.1
  `SelfDot` `<Then>` · Q6 → 4.5 `YourShadow` · Q7 → 4.6 Check
- Next (Article 5, span and basis) → the 4.6 bridge

| # | Slug | Title | Screens file |
| --- | --- | --- | --- |
| 4.1 | `04a_haat_dot` | Math for AI 4.1 — ঘরে ঘরে গুণ, হাটের হিসাব | `haat-journey.tsx` |
| 4.2 | `04b_van_push` | Math for AI 4.2 — পক্ষে না বিপক্ষে, কাদায় আটকানো ভ্যান | `push-journey.tsx` |
| 4.3 | `04c_noon_shadow` | Math for AI 4.3 — দুপুরের ছায়া, দুই হিসাব এক উত্তর | `shadow-journey.tsx` |
| 4.4 | `04c2_axis_shadow` | Math for AI 4.4 — দুই হিসাব কেন মেলে, axis-এর ছায়া | `shadow-journey.tsx` |
| 4.5 | `04d_cosine_movie` | Math for AI 4.5 — Cosine similarity, কার ছবি বেশি মানানসই | `cosine-journey.tsx` |
| 4.6 | `04e_tow_rope` | Math for AI 4.6 — গুণ টানা, টানের কতটা কাজে লাগে | `towrope-journey.tsx` |
| 4.7 | `04f_library_search` | Math for AI 4.7 — পাঠাগারের খোঁজ, dot না cosine | `library-journey.tsx` |
| 4.8 | `04f2_attention_box` | Math for AI 4.8 — এক box, ChatGPT-র ভেতরেও | `library-journey.tsx` |

(Built as six, then 4.3 and the library journey were each split in two; see
"The splits" at the end. The specs below keep their original numbers: 4.4–4.6
in them are now 4.5–4.7/4.8.)

Wiring: append all six after `03g_grams_trap` in `courses.ts`; 3.7's `Finale` step
gets a `LessonLink` to 4.1 (its last `<Then>` already names the dot product as the next
story); each journey's last step links to the next; 4.6 closes Module 1 and points to
Article 5 (span and basis).

The shared machine: 4.1 builds **the box** (`DotBox`: two lists in, pairs multiplied
line by line, then the sum). Every later journey reuses it from `haat-journey.tsx`,
so "the box" looks the same everywhere.

---

```
4.1 — ঘরে ঘরে গুণ, হাটের হিসাব
Question: মামা says the club's box ("ঘরে ঘরে গুণ করে যোগ") is the oldest sum at the
          হাট and can do all five of today's jobs. মামী says it's a trick made up for
          films and does nothing but shop bills. Which of the five jobs can the box
          really do? The loser buys জিলাপি.
Story:    Friday হাট. ফাহিম goes round with মামা and মামী, the box in his head.

1. HaatBet — The five jobs as cards: মুদির bill · ফাহিমের final number · দালালের গরুর
   দাম · দুই বস্তা এক বস্তায় · Shiku-র arrow কত লম্বা. মামা: "পাঁচটাই". মামী: "শুধু
   দোকানের হিসাব". The reader ticks the ones they think the box can do, then seals.
   Unmarked. → pass: "বাজি সিল হলো। হাট ঘুরে একটা একটা কাজ বাক্সে দেবো।" [copy: NasibBet, multi-select]
2. GroceryBill — (চাল, তেল, ডিম) = (2, 1, 12) against দাম (60, 180, 12). The reader
   runs the box a line at a time: pair, multiply, then add → 444. → pass: "পরিমাণের
   সাথে দাম, ঘরে ঘরে গুণ, তারপর সব যোগ: 444 টাকা। দোকানি সারাদিন এই বাক্সই চালান।"
   Then: the name. dot product, u · v, "u dot v"; the answer is ONE number.
3. NoPartner — Two tiny rounds. The দোকানি reads the price list first: same bill?
   (yes: 60 × 2 = 2 × 60). Then a customer brings 4 items against a 3-price card: the
   4th has no partner and the box jams. → pass: "কে আগে সেটা ব্যাপার না, কিন্তু দুই
   list-এ ঘর সমান না হলে বাক্স চলে না।"
4. ReportCard — ফাহিমের marks (80, 60, 90), the school's weights (0.2, 0.3, 0.5).
   Predict: above or below the plain average (76.7)? → 79. Then flip to a
   project-heavy card (0.2, 0.5, 0.3) → 73. → pass: "যে পরীক্ষার weight বেশি, final
   number সেদিকে ঝোঁকে।"
5. CowPrice — The দালাল's knob card: per kg 400, per litre of milk 4000, per year of
   age −5000. বড় বুড়ি গাই (250, 6, 10) against ছোট জোয়ান গাই (200, 5, 3). Predict
   the dearer one (the big one is the trap) → 74000 vs 85000. → pass: "বয়সের knob-টা
   minus। দালালের পুরো হিসাবটা: গরুর তথ্য · knob।"
   Then: every linear model is a dot product; the knobs are the "weights" (নানুর
   রেডিওর knob, 2.8). A neuron is this plus one number, then a bend (3.3 BendIt).
6. TwoSacks — মামী: "(চাল, ডাল) = (10, 2) আর (5, 3), বাক্স দিয়ে এক বস্তায় ঢালো।"
   The box says 56. 56 কী? The reader tries to read the sack from it and can't, then
   the old যোগ gives (15, 5). A third button, "ঘরে ঘরে গুণ, যোগ ছাড়া" → (50, 6),
   which means nothing. → pass: "বাক্স সবসময় একটাই সংখ্যা দেয়। বস্তা মেলাতে লাগে list,
   মানে পুরানো যোগ।" [copy: WrongShape / NeverShrinks: can't be won]
   Then: the 3.7 teaser answered (the useful multiply gives one number); NumPy's
   `u * v` vs `u @ v` bug; the cross product exists, ML barely uses it.
7. SelfDot — Shiku's arrow (3, 4) put into both slots of the box → 25. Shiku's tape says
   5. The reader links them (25 = 5 × 5), then predicts (2, 3, 6) → 49 → 7.
   → pass: "নিজের সাথে গুণ-যোগ করলে বাক্স দেয় দৈর্ঘ্যের বর্গ: v · v = ‖v‖²।"
   Then: squares are never negative, so v · v never is (Check-yourself Q5). First
   clue that the box knows geometry: if it knows length, does it know direction?
8. BoxOrNot — এবার আপনার পালা: five new jobs, sorted into "বাক্সের কাজ" / "বাক্সের
   কাজ না" with wrong tries bouncing: ভ্যান ভাড়া, ক্রিকেটের রান, সকাল আর বিকেলের বাজার
   এক list-এ, সবার উচ্চতা দ্বিগুণ, 3 জিনিস আর 4 দাম.
9. Check — (2, −1, 4) · (3, 5, 1) = ? (5 · 15, the minus dropped · (6, −5, 4), no add)
10. Finale — ## শেষ! তর্কের ফয়সালা. The bet table ✓ ✓ ✓ ✗ ✓: মামা wins 4–1, মামী
    buys the জিলাপি. Rule: "দুই list, ঘরে ঘরে গুণ, সব যোগ, হাতে একটা সংখ্যা।"
    Symbols: u · v · Σ uᵢvᵢ · v · v = ‖v‖². Bridge: on the way home the van sinks in the
    mud. মামা: "সবাই ঠেলো, ধাক্কা তো ধাক্কাই!" Is every push a help? (4.2)
```

```
4.2 — পক্ষে না বিপক্ষে, কাদায় আটকানো ভ্যান
Question: The van is stuck on the কাদা রাস্তা, and five people push from all sides.
          মামা says every push helps a little ("ধাক্কা তো ধাক্কাই"). Is he right, or is
          someone doing nothing, or even pushing it back? The rain is coming.
Story:    Road direction r = (4, 3). Pushes: ফাহিম (4, 3), মামা (6, 2), ভ্যানওয়ালা
          চাচা (1, 4), মামী (−3, 4), পাশের বাড়ির রফিক (−5, 5). By eye মামী and রফিক
          both push "from the side". The box: 25, 30, 16, 0, −5. Total 66; the van
          needs 80 to come out.

1. VanStuck — The scene on graph paper: the road, the van, five push arrows. Sealed
   bet: সবাই সাহায্য করছে · কেউ কেউ কোনো কাজে আসছে না, ক্ষতি কেউ করছে না · কেউ
   একজন উল্টো পেছনে ঠেলছে. → pass: "বাজি সিল হলো। কার ধাক্কা কতটা কাজের, সেটা
   মাপার একটা যন্ত্র লাগবে।"
2. StraightPush — The simplest case by hand: ফাহিম pushes straight along the road
   (4, 3) → box 25; then from the front, (−4, −3) → −25. → pass: "পেছন থেকে ঠেললে
   +25, সামনে থেকে −25। চিহ্নটাই বলে ধাক্কা পক্ষে না বিপক্ষে।"
   Then: the box's number is not newtons; the road card is 5 long, so every number is
   5 × the real help. Why 5 × is 4.3's question. The sign and the ranking are exact.
3. PushRing — ফাহিম walks round the van, same strength (length 5): 12 spots on a
   ring. The reader finds the largest number, a zero, the most negative; a table fills
   (90°-এর কম → +, ঠিক 90° → 0, 90°-এর বেশি → −) with the angle arc shown.
   → pass: "রাস্তার দিকে তাক করলে সবচেয়ে বেশি, সোজা কোণে 0, 90° পেরোলেই minus।"
   [copy: CoinArrows table + Ticks]
4. StrongPush — A হাটের কুলি, twice ফাহিম's strength, stands off at an angle: (0, 10)
   vs ফাহিম (4, 3). Who helps more? → 30 vs 25: the crooked strong push wins. → pass:
   "বাক্সের নম্বরে দিক আর জোর মিশে থাকে।" Then: for a van that's right (strength IS
   help); for মামা's films it was the loud-film problem (3.6). Hold that thought (4.4).
5. CoinBox — নাসিব's coins from 2.7, as ±1 lists: blue (+1, −1, +1, +1), red
   (+1, +1, −1, +1). The reader runs the box: a match gives +1, a mismatch −1 → 0.
   Then 100 tosses: the box lands near 0 out of 100. → pass: "মিল-অমিল সমান হলে বাক্সে 0,
   মানে সোজা কোণ। ২.৭-এর 90° এই বাক্সেরই 0। ছবি আঁকা ছাড়াই।"
   Then: 4 slots can't be drawn, 100 even less, but the box still says "right
   angle". Name: perpendicular / orthogonal, u ⊥ v ⇔ u · v = 0.
6. FixTheCrew — এবার আপনার পালা: the five push cards, numbers only. For each, the
   reader picks পক্ষে / কাজে আসছে না / বিপক্ষে (wrong tries bounce), working the box in
   their head. Then "মামী আর রফিককে পেছনে পাঠান" → both become (4, 3) → the total
   climbs from 66 to 121 → the van rolls out. → pass: "রফিক উল্টো ঠেলছিল (−5), মামী
   কোনো কাজেই আসছিলেন না (0)। দুইজনকে পেছনে পাঠাতেই ভ্যান উঠলো।"
7. Check — (3, −2, 5) and (4, 1, −2): are they at right angles? (yes, box 0 · no, 20
   (a minus dropped) · can't tell without drawing)
8. Finale — ## শেষ! ভ্যান কাদা থেকে উঠলো. The bet: মামা was wrong twice. The sign
   table (+ / 0 / −). Rule: "বাক্সের চিহ্ন বলে পক্ষে না বিপক্ষে, শূন্য মানে সোজা কোণ।"
   Bridge: মামী: "কিন্তু গুণ করে যোগ করলে কোণের খবর আসে কেন?" and মামা says he can
   get the same 25 without multiplying slots at all, with a tape and a protractor on the
   ছাদ tomorrow noon. (4.3)
```

```
4.3 — দুপুরের ছায়া, দুই হিসাব এক উত্তর
Question: মামা claims a second recipe gives the box's number without multiplying any
          slots: measure two lengths and one angle, and multiply. ফাহিম's box says
          (2, 3) · (2, 1) = 7. Will মামা's tape-and-protractor get 7? The whole ছাদ is watching.
Story:    Noon on the ছাদ, sun straight overhead, a bamboo stick and chalk arrows.

1. TwoRecipes — sealed bet: 7-এর চেয়ে বেশি · ঠিক 7 · কম · কোনো মিলই থাকবে না.
2. StickShadow — A 1 m stick; the reader tilts it (slider) and reads its shadow at
   0°, 30°, 45°, 60°, 90°: a table fills. Then a 2 m stick at 60° → shadow 1: the
   ratio stays. → pass: "ছায়া ÷ লাঠি শুধু কোণের ওপর নির্ভর করে।"
   Then: the name cos(θ) (adjacent ÷ hypotenuse), a calculator's `cos`.
3. BackShadow — Predict the shadow at 120° → it falls behind: −0.5; 180° → −1. The
   table extends. → pass: "ছায়া কখনো লাঠির চেয়ে লম্বা না: cos সবসময় −1 থেকে 1-এর মধ্যে।"
4. ArrowShadow — Two chalk arrows v and w; which is w's shadow on v: rotate w onto v,
   or drop a straight line down onto v? (the trap: rotating). The reader drags w's
   tip; the shadow length ‖w‖ cos θ updates. → pass: "ছায়া মানে w-এর যে অংশটা v-এর দিকে।"
5. LengthTimesShadow — মামা's recipe: ‖v‖ × (w's shadow on v). Test 1: v = (2, 0),
   w = (3, 3): 2 × 4.24 × 0.707 = 6, and the box says 6. → pass: "দুই হিসাব, একই 6।"
6. BookPair — (2, 3) and (2, 1): 3.61 × 2.24 × cos 29.7° = 7.0. The box: 7. Is it luck?
7. AxisShadow — (2, 3) · e₁ = 2, (2, 3) · e₂ = 3: the reader drops shadows onto both
   axes. → pass: "Vector-এর প্রতিটা সংখ্যা আসলে একটা axis-এর ওপর তার ছায়া।"
   Then: callback to 3.3 TiltedField: in a tilted basis, the new numbers are dots with
   the new directions (the PCA sentence).
8. NoCrossTalk — A 2 × 2 tap grid (v₁e₁ + v₂e₂) against (w₁e₁ + w₂e₂): four cells.
   The reader taps each: e₁·e₁ = 1, e₂·e₂ = 1, e₁·e₂ = 0 (no shadow). The off-diagonal
   cells vanish, leaving v₁w₁ + v₂w₂. → pass: "Axis-গুলো সোজা কোণে আর 1 লম্বা বলেই
   শুধু ঘরে ঘরে গুণ টিকে থাকে।"
9. YourPair — এবার আপনার পালা: the reader drags any two arrows; before measuring,
   they predict মামা's number from the box alone. Wrong tries bounce.
10. Check — v = (1, 0), w = (0, 4): both recipes (0, cos 90° = 0).
11. Finale — ## শেষ! মামার হিসাবও 7. Rule: "u · v = ‖u‖ · ‖v‖ · cos θ, দৈর্ঘ্য ×
    দৈর্ঘ্য × কতটা একই দিকে।" Bridge: so divide out both lengths and only the angle is
    left. মামা: "আমার ছবিটা মামীর চেয়ে বেশি মানানসই হয়েছিল, নম্বর বেশি!" (4.4)
```

```
4.4 — Cosine similarity, কার ছবি বেশি মানানসই
Question: Evening, one TV. 3.6's fixed club rule gave মামা Mr. Bean with 5.34 and মামী
          Titanic with 4.08. মামা says his film fits him better, since his number is
          bigger. মামী won't have it. Whose film fits better? The loser makes the tea.
Story:    মামা (2, 5), মামী (4, 1), Titanic (5, 2), Mr. Bean (1, 4). নানু joins later
          with no film history at all.

1. WhoFits — sealed bet: মামা · মামী · সমান সমান · বলা যায় না.
2. LoudPerson — Measure the two tastes: মামা 5.39, মামী 4.12. মামা gives big numbers to
   everything; his own length is in the score too. → pass: "দৈর্ঘ্য শুধু ছবির না,
   মানুষেরও থাকে।" [copy: WhyLoud tape]
3. RunBackwards — Take 4.3's rule u · v = ‖u‖‖v‖ cos θ and divide both lengths across
   (a balance-scale screen: the same thing off both sides). → cos θ = u · v / (‖u‖‖v‖).
   → pass: "Box-এর নম্বর থেকে দুইটা দৈর্ঘ্য ভাগ করলে পড়ে থাকে শুধু কোণ।"
   Then: "cosine similarity"; in 300 dimensions there's no protractor, and this line is
   what "the angle" means.
4. ScaleCard — The fixed scale: +1, 0, −1 with arrows. The reader places 5 cosines on
   it, and a slider shows 0.9 = 26°, 0.5 = 60°. → pass: "0.9 মানে 90% মিল না, মানে
   প্রায় 26° দূরে।" (FAQ) Then: Cauchy–Schwarz in one line (a shadow never outgrows its stick).
5. LastDivide — 3.6's 3.71 and 5.34 were one division short: ÷ মামা's own 5.39 →
   0.69 and 0.99. → pass: "৩.৬ সব ধাপ করেছিল, শুধু শেষ ভাগটা বাকি ছিল।"
6. NanuCard — নানু has watched nothing: (0, 0). The reader tries to divide → ÷ 0,
   NaN. → pass: "শূন্য arrow-এর কোনো দিক নাই, তাই কোনো কোণও নাই।"
7. VerdictCos — এবার আপনার পালা: the reader computes both cosines unaided → 0.991 and
   0.991. A tie. The mirror picture (swap the slots and the whole drawing reflects).
8. Check — the book's Q3: a = (1, 3), b = (4, 2), c = (2, 3) → recommend c (0.707 vs
   0.965); and (1, 2) with (−2, −4) → −1.
9. Finale — ## শেষ! চা বানাবে দুইজনই. Bridge: the river trip; the মাঝি says the longer
   the tow rope, the less pull is wasted. (4.5)
```

```
4.5 — গুণ টানা, টানের কতটা কাজে লাগে
Question: The boat full of হাটের মাল must be towed home before dark. মাঝি চাচা says
          "দড়ি যত লম্বা, টান তত কম নষ্ট।" True, false, or does rope length not matter?
Story:    Two men on the bank pull the boat with a rope (গুণ টানা). The river is v; the
          rope is w.

1. RopeBet — sealed: লম্বা দড়িতে লাভ · দৈর্ঘ্যে কিছু যায় আসে না · ছোট দড়িতে লাভ.
2. SplitPull — Drag the rope angle; the pull splits live into "সামনে" (the shadow) and
   "পাড়ের দিকে" (the leftover). → pass: "প্রতিটা টান দুই ভাগ: নদী ধরে, আর নদীর সোজা কোণে।"
3. ShadowArrow — The shadow as an arrow: (w · v)/(v · v) · v; (2, 1) onto (2, 3) →
   (1.08, 1.62). [copy: StretchKnob λ]
4. Leftover — w − shadow = (0.92, −0.62); the box against the river → 0. → pass: "যা
   বাকি থাকে, সেটা সবসময় নদীর সোজা কোণে।"
5. SidePull — The leftover only drags the boat to the bank; the হালের মাঝি steers
   against it. → pass: "সোজা কোণের টান সামনে এক পা-ও নেয় না: কোনো মিল নাই, 0।"
   Then: 0 means "nothing in common", not "opposite" (−1 is a strong relationship).
6. LongRope — The bank is a fixed distance away; the reader lengthens the rope and
   watches the angle shrink and the forward part climb towards the full pull. The
   bet's answer comes out of the reader's own slider.
7. KeepShadows — A cloud of 12 points along a diagonal. Project them all onto it: keep
   the shadows (1 number each), drop the leftovers (small). → pass: "দুইটা সংখ্যার
   জায়গায় একটা, হারালো শুধু ছোট্ট বাকিটুকু। এটাই PCA-র মূল কথা।"
8. YourShadow — এবার আপনার পালা: (4, 2) onto (1, 1) → shadow (3, 3), leftover (1, −1),
   check 0.
9. Check — "cos 0 মানে কি উল্টা?" (no: unrelated; opposite is −1)
10. Finale — ## শেষ! নৌকা ঘাটে ভিড়লো. Bridge: the পাঠাগার's two search machines. (4.6)
```

```
4.6 — পাঠাগারের খোঁজ, dot না cosine
Question: The গ্রামের পাঠাগার has two search machines. Asked for "মাছ", one puts a
          book about boats and rice above a short note about fish. Same data, same
          flawless code, different answers. Which one should the আপা keep?
Story:    Books as word counts (মাছ, নৌকা, ধান). Query q = (1, 0, 0). A = (2, 0, 0) short
          fish note, B = (20, 1, 0) long fish book, C = (3, 5, 4) boats and rice.

1. TwoMachines — sealed bet: dot-এর machine · cosine-এর machine · দুইটাই ঠিক, কাজ বুঝে.
2. DotRanking — The reader runs the box on A, B, C: 2, 20, 3. C beats A. → pass: "লম্বা
   বই শুধু লম্বা হওয়ার জোরে উঠে যাচ্ছে।"
3. CosRanking — The same with the lengths divided out: 1.000, 0.999, 0.424.
4. LoudForBoth — The loud film L = (5, 5) under the box wins for মামা AND মামী (25, 35);
   cosine gives each their own genre. → pass: "যে ছবি সবার জন্য জেতে, সে মানানসই বলে
   না, লম্বা বলে জেতে।"
5. LengthIsNews — sort 5 jobs into "dot" / "cosine": দালালের গরুর দাম, সামিনের বড় ক্রেতা
   (3.6 BigSpender), খবরের মিল, শব্দের মিল, "আরো এরকম ছবি". [copy: TwoNormalises sort]
6. OneRanking — Normalise every card once; now the plain box IS cosine, and ranking
   by distance gives the same order (‖û − v̂‖² = 2 − 2cos θ). → pass: "একবার normalise,
   তারপর শুধু বাক্স: তিনটা মাপ একই ranking দেয়।" Then: cosine distance = 1 − cos.
7. WhoIsIt — "বিড়ালটা দুধ খেলো কারণ ওটার খিদে পেয়েছিল": which word does "ওটা" look
   at? The reader runs the box between "ওটা"'s query and each word's key; the biggest
   wins. → pass: "Attention-এর নামই scaled dot-product attention।"
8. PickTool — এবার আপনার পালা: five fresh jobs, dot / cosine / distance, wrong tries bounce.
9. Check — news articles of wildly different lengths: rank by? (cosine)
10. Finale — ## শেষ! Module 1, মুখে পড়া. Tap-to-reveal the formula piece by piece: u, v
    (Article 1) · arrows (2) · ‖u‖ (3) · u · v and cos θ (4). The one sentence. The full
    notation table. Bridge → Article 5: which vectors can a set of ingredients build?
```

---

## Open questions

1. **The setting moves from the fair to নানুর বাড়ি.** The fair ended with 3.7. A new
   place gives each journey a physical scene (হাট, কাদা, ছাদ, নদী) the fair couldn't.
   Or keep the fair for one more "day after" module?
2. **4.2 uses a road card r = (4, 3), not a unit card.** The box's numbers are 5 × the
   real help. The `<Then>` owns up to it and hands the "why 5 ×?" to 4.3. The other
   choice is r = (0.8, 0.6), which makes every number the true help but means decimals
   in the reader's head in `FixTheCrew`.
3. **4.3 `NoCrossTalk` (the basis proof) is the heaviest screen in the module.** Keep it
   as a 2 × 2 tap grid, or cut it to a `<Then>` paragraph and let `AxisShadow` carry the "why"?
4. **The source leans on "the formula from page one of Article 1".** The app's Article 1
   never shows the cosine formula, and never does the 22 vs 8 recommendation (that
   first happens in 3.6). The module's hook is therefore 3.6's closed box, and the formula
   appears for the first time in 4.4. Should Article 1 get the formula as a teaser, to
   make 4.6's "read it out loud" finale land as intended?
5. **4.6 is long** (search, loud film, normalise once, distance, attention, the Module 1
   finale). If it runs past 11 screens, `WhoIsIt` (attention) moves into the finale as a
   `<Then>` teaser.

**If six is too many,** a four-journey version keeps 4.1 (folding 4.2's `PushRing` and
`CoinBox` into it as the last two screens), keeps 4.3 whole, merges 4.4 with 4.5
(cosine, then projection as its last three screens), and keeps 4.6. I would keep 4.3
and 4.4 separate whatever happens: 4.3 is the "why", and 4.4 is the payoff to the
module's debt.

## Problems noticed in the source

- It's a `.md` with no `export const metadata`, so it won't list as a lesson; it's
  reference material, the way `03-vector-operations-and-norms.md` is.
- Pipe tables throughout (§2, §3, §7, §8, §9, §10); any that move into a lesson need `<Table>`.
- It names the cosine formula as "from the first page of Article 1" and "Article 1's
  22 > 8" recommender. Neither exists in the app's Article 1 (see open question 4).
- Its recommender uses Susan and a friend; the app already has মামা (2, 5), Titanic
  (5, 2) and Mr. Bean (1, 4) from 3.6, so Susan (4, 1) becomes মামী.
- Its price model calls back to "Article 1's `price = a × area`", which the app doesn't
  have. The nearest knob in the app is 2.8's radio (`OneKnob`), so 4.1 calls back to that.
- Its book-angle footnote (29.4° vs 29.74°) is right; 4.3 uses 29.7°.

## Build notes (what changed while building)

All six are built and wired. The open questions above were settled by default: the
নানুর বাড়ি setting stays, 4.2 keeps the (4, 3) road card (4.3 `TwoTests` `<Then>` pays
the "why 5 ×" debt), and 4.3 `NoCrossTalk` is a 2 × 2 tap grid on concrete numbers
(2, 3) and (2, 1).

- **4.3:** `LengthTimesShadow` and `BookPair` became one screen, `TwoTests` (two
  rounds). The bet asks "will the recipes *always* agree?", so two matches are a
  suspicion, not the answer; `NoCrossTalk` and `YourPair` settle it. Check uses
  (1, 0) and (0, 4).
- **4.4:** `LastDivide` divides only মামা × Titanic (3.71 → 0.69) so the verdict isn't
  leaked. `RunBackwards` lets the reader divide by ‖v‖ and ‖w‖ in either order; a
  one-sided divide tips the balance. The 3.6 scores are 5.34 (মামা, Bean) and 4.09
  (মামী, Titanic); both cosines are 0.991.
- **4.5:** `ShadowArrow` + `Leftover` became `FindFoot` (slide a point along the
  river until the dropped line is square, λ = 7/13) and `ShadowRecipe` (step
  machine: 7, 13, shadow, leftover, check 0). `LongRope` uses a bank 3 m away and a
  pull of 10: 6.6 forward at 4 m, 9.8 at 15 m.
- **4.6:** `WhoIsIt` has two rounds ("…খিদে পেয়েছিল" → বিড়ালটা, "…টাটকা ছিল" → দুধ).
  The finale's full notation table lives in the `Finale` step's `<Then>`; the bridge
  to Article 5 is in words only (no slug yet).

## The splits (eight journeys now)

4.3 carried cos θ, projection, মামা's recipe, shadows on the axes, turned axes,
the two rules, the 2 × 2 proof and three slots: too many ideas for one
journey, and the turned-axes step was a text-only `<Check>` that was hard to
picture. It is now two journeys, both on the ছাদ, screens in `shadow-journey.tsx`:

- **4.3 `04c_noon_shadow`** asks only "মামার ফিতা-চাঁদা থেকে কত আসবে?" (`TwoRecipes`,
  bet: 7-এর বেশি · ঠিক 7 · কম) and settles it in `TwoTests`. New: a 4.1 retrieval
  (v · v = 13 → √13) before `TwoTests`; `RoadDebt` is the `এবার আপনার পালা`; a new
  review check (2 × 3 × cos 60° = 3). The finale takes the SayIt table and ends
  on `NotYetProof`: two matches are not "always".
- **4.4 `04c2_axis_shadow`** asks "সবসময় মিলবে?" (`AlwaysBet`, sealed; `MamiDoubt`
  story). Every step of the why is played: `AxisShadow` → `TiltedAxes` (new: turn
  the axes to 0°, 37°, 53°, 90°; shadow and box agree at each; replaces the
  text-only "Axis যদি বদলে যায়?" check) → `ShadowRules` (new: the two rules by hand,
  walks end to end, then × 2, × 3, × −1) → `NoCrossTalk` (cells now draw the two
  axes) → three slots → a 4.2 retrieval (মামীর ধাক্কা, box 0) → `YourPair`. The
  finale is 4.3's old one, bridging to the TV argument.

The library journey had 16 steps, so it split too:

- **4.7 `04f_library_search`** keeps the search question (which machine does
  আপা keep?): `TwoMachines` → `DotRanking` → `CosRanking` → `LoudForBoth` →
  `LengthIsNews` → `PickTool` (এবার আপনার পালা) → the news check → a new finale,
  `## শেষ! আপা রাখলেন machine খ` (the old finale's first paragraph and `KeepBoth`).
- **4.8 `04f2_attention_box`** asks সোমের দাবি: is the হাট's box inside ChatGPT?
  (`NightCall` + new sealed `BoxBet`). Evidence: `OneRanking` (normalise once, box
  = cosine) → `ChordCos` check (distance agrees) → a 2.3 retrieval (words are
  vectors) → `WhoIsIt` → the "who sets the numbers" check (attention, the neuron)
  settles it. New: a recall on the loud film, an এবার আপনার পালা check (1-unit
  cards: box = cosine = 0.96), a review check on the toy attention. The Module 1
  finale and the span teaser end it.

