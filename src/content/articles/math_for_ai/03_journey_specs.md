# Article 3 → seven journeys (Math for AI 3.x)

Source: `03-vector-operations-and-norms.md`. One running story: **the school science
fair**. ফাহিমের class seven runs a stall called «সংখ্যার মেলা». Each journey is one
corner of the fair, and the fair day ends at ডাক্তার আপা's health stall (3.7).

**Cast:** ফাহিম (stall captain) · Shiku (the class robot, walks the chalk grid on the
field) · সামিন (stall treasurer) · সোম (chess club) · নাসিব (movie club) · আম্মু
(sends the tiffin for the snack table) · ডাক্তার আপা (judge, health stall).

**Already covered, not repeated:** golf ball (2.4 `GolfThrow`), Pythagoras in 2D/3D
(2.5 `TilePour`, `RoomCorner`), Σ (2.6), the learning-step line (2.8 `KnobStep`).
3.4 only recalls Pythagoras in one screen.

**Nothing dropped. The extras find a corner of the fair:**
- sentence = average of word vectors → the fair's comment box (3.3 `ReviewBox`)
- k-means → where to put two চা stalls on the field (3.4 `TeaStalls`)
- ridge / lasso penalties → the robotics club's "knob fine" (3.5 `KnobFine`)
- notation table → a `SayIt` card screen in each journey for that journey's symbols;
  the full table is the 3.7 `Finale` («মেলার ঝুলি»)
- FAQ → each confusion becomes a `Check` or a pass note where it naturally arises:
  "length = slots added?" (3.5 Check) · "square then root, pointless?" (3.4 Check) ·
  "‖v‖ vs |−3|" (3.4 `SayIt`) · "does normalising lose info?" (3.6 Check) ·
  "can I multiply two vectors?" (3.7 `Finale` teaser)

| # | Slug | Title | Screens file |
| --- | --- | --- | --- |
| 3.1 | `03a_treasure_add` | Math for AI 3.1 — যোগ-বিয়োগ, মেলার গুপ্তধন | `treasure-journey.tsx` |
| 3.2 | `03b_sherbet_stretch` | Math for AI 3.2 — Stretch, শরবতের recipe | `sherbet-journey.tsx` |
| 3.3 | `03c_tiffin_recipe` | Math for AI 3.3 — Recipe, টিফিন বক্সের অঙ্ক | `tiffin-journey.tsx` |
| 3.4 | `03d_norm_length` | Math for AI 3.4 — ‖v‖, গুপ্তধন কত দূরে | `norm-journey.tsx` |
| 3.5 | `03e_crow_king` | Math for AI 3.5 — কাক, পথিক আর দাবার রাজা | `crowking-journey.tsx` |
| 3.6 | `03f_unit_vector` | Math for AI 3.6 — শুধু দিক, movie club-এর গোলমাল | `unit-journey.tsx` |
| 3.7 | `03g_grams_trap` | Math for AI 3.7 — গ্রামের ফাঁদ, ডাক্তার আপার stall | `yardstick-journey.tsx` |

Wiring: append all seven after `02h_model_vectors` in `courses.ts`; 2.8's `Finale`
gets a `LessonLink` to 3.1; each journey's last step links to the next; 3.7 closes
module 3 and points to Article 4 (dot product).

---

```
3.1 — যোগ-বিয়োগ, মেলার গুপ্তধন
Story: The fair opens with a treasure hunt on the field, which is chalked into a grid.
Every clue card is an arrow: "3 ঘর পূর্বে, 1 ঘর উত্তরে". Shiku has to find the prize.

1. TwoClues — Two cards: (3, 1), then (1, 4). Where is the prize? → reader taps a guess
   cell, then presses "হাঁটো" and Shiku walks card 1, then card 2 from where it stopped
   (tip to tail). → pass: "(3, 1) তারপর (1, 4) → (4, 5)। শেষ address = দুই হাঁটা জোড়া।"
   [copy: useWalk / ShikuTape]
2. SlotAdd — Three more card pairs, shown only as numbers. The reader fills the answer
   box by box before Shiku walks it to check. → pattern: 1st with 1st, 2nd with 2nd.
   → pass: "u + v = (u₁ + v₁, u₂ + v₂)। ঘরে ঘরে যোগ, আর কিছু না।"
3. SwapOrder — সোম reads card 2 first. Does he find the same prize? (হ্যাঁ / না / বলা যায় না)
   → both routes are drawn in two colours and form a parallelogram that meets at one
   corner. → pass: "u + v = v + u। কারণ 3 + 1 = 1 + 3।" [copy: predict → reveal]
4. SnackLabel — No picture now. আম্মুর tiffin: ডিম (80, 6, 0), রুটি (80, 3, 1),
   কলা (105, 1, 14) as (calorie, protein, চিনি). The reader adds the three cards into
   a label. → pass: "ছবি আঁকা যায় না, তবু নিয়ম একই: ঘরে ঘরে যোগ। (265, 10, 15)"
5. WrongShape — Someone tries (height, weight) + (age, BP, sugar). The reader tries to
   pair the slots, and slot 3 has no partner; even slot 1 would add cm to years. Tiny
   screen. → pass: "যোগ করতে হলে দুইটার ঘর একই মাপের, একই মানের হতে হবে।"
6. WayBack — সামিন is at (2, 1) and the prize at (6, 4). Which ONE card takes her
   there? → reader drags an arrow from সামিন to the prize and reads its numbers.
   → pattern over 2 more cases: end − start. → pass: "u − v = v থেকে u-তে যাওয়ার
   arrow। (6, 4) − (2, 1) = (4, 3)" [copy: RuleVsTape drag]
7. CheckTrip — Walk from v along (u − v). Where do you land? → Shiku lands on u.
   → pass: "v + (u − v) = u ✓"
8. StallMoney — সামিন's book: last year (খাবার, সাজ, পুরস্কার) = (1200, 300, 250),
   this year (1100, 450, 100). The reader subtracts, then taps each sign to read it
   ("কম", "বেশি"). → pass: "(−100, +150, −150): একটা vector-এ পুরো গল্প। বিয়োগ মানে
   কী বদলাল।"
9. SayIt — Tap-to-reveal cards: `u + v` → "u, তারপর v" · `u − v` → "v থেকে u-তে
   যাওয়ার arrow". [copy: SayItCards]
10. Check — (4, −1) + (−2, 3) = ? → LessonLink → 3.2.
```

```
3.2 — Stretch, শরবতের recipe
Story: The class sells লেবুর শরবত. The recipe card is written for 4 glasses, but the
queue keeps changing size.

1. MoreGlasses — Recipe for 4 glasses: (লেবু, চিনির চামচ) = (2, 4). 8 people are in
   line. Guess the new card → reader taps ×2 and both boxes change together.
   → pass: "প্রতিটা ঘর একই সংখ্যা দিয়ে গুণ: (4, 8)।"
2. TasteLine — The recipe drawn as a dot on (লেবু, চিনি) graph paper. The reader makes
   2, 4, 8 and 1 glass: every dot falls on one straight line through 0. Then নাসিব
   doubles only the sugar → the dot jumps off the line and a sip face says "এটা অন্য
   শরবত!" → pass: "একই লাইনে থাকলে একই স্বাদ, শুধু কম-বেশি। লাইন ছাড়লে অন্য জিনিস।"
3. StretchKnob — A λ slider on v = (1, 2), with five target ghosts to hit: 3v, 0.5v,
   0, −0.5v, −2v. Ticks for each one. → pattern: it never leaves the line; below 0 it
   flips; 0 collapses to a dot. [copy: DotsBunch slider + Ticks]
   → pass: "λ দিয়ে গুণ করলে arrow লম্বা, খাটো বা উল্টা হয়, কিন্তু লাইন ছাড়ে না।"
4. FiveCases — Sort five λ cards into what they do (লম্বা / খাটো / শূন্য / উল্টা-খাটো /
   উল্টা-লম্বা). The table fills itself as the reader sorts. The word "scalar" is named
   here: the thing that scales. [copy: CoinArrows table]
5. FlipThenAdd — Replay WayBack from 3.1: flip v (×−1), then add. It lands in the same
   spot. → pass: "বিয়োগ আলাদা কিছু না: u − v = u + (−1)v। আমাদের হাতে আসলে দুইটাই চাল,
   যোগ আর stretch।"
6. GramsClue — The fair's height-weight board: A (172, 68), B (190, 69), C (173, 78).
   Two buttons: "পুরো vector × 1000" and "শুধু ওজন × 1000 (gram)". Predict which one
   changes who is nearest to A → play both. → pass: "পুরো vector stretch করলে সব দূরত্ব
   একসাথে বাড়ে, উত্তর একই। একটা axis stretch করলে map বেঁকে যায়।" (Seed for 3.7.)
7. SayIt — `λ` → "lambda, একটা সাধারণ সংখ্যা" · `λv` → "v-কে lambda দিয়ে stretch" ·
   `−v` → "v উল্টা".
8. Check — 0.5 · (4, 6) = ? → LessonLink → 3.3.
```

```
3.3 — Recipe, টিফিন বক্সের অঙ্ক
Story: The class poster needs "average-এ আমাদের class", and the snack table sells combo boxes.
Two moves, add and stretch, build all of it.

1. BalanceCard — Rina (168, 55), Karim (172, 68) and Nadia (159, 51) sit as three
   weights on a card. Where does it balance? → reader drops a pin → reveal: add all,
   then × 1/3 → (166.3, 58), the balance point. [copy: predict → act → reveal]
   → pass: "average = সব যোগ, তারপর 1/n দিয়ে stretch। একে centroid বলে।"
2. SumShrink — The reader steps a two-stage machine: add (499, 174), then × 1/3.
   → pass: "নতুন কোনো চাল লাগেনি: একবার যোগ, একবার stretch।" [copy: BazaarSigma]
3. ReviewBox — The fair's মন্তব্য বাক্স. Every word is a dot on a small map
   (two numbers per word; happy words sit right, sad left, the other slot unnamed). The reader drops a comment slip in
   ("শরবত দারুণ মজা"), its words light up, and their average dot lands. Sort 4 slips
   into 😊 / 😞 by where the dot falls. Twist: "ভালো না, খারাপ" and "খারাপ না, ভালো"
   land on the SAME dot. → pass: "বাক্যটা তার শব্দগুলোর average-এ বসে। সহজ কৌশল, ভালোই কাজ
   করে, কিন্তু শব্দের ক্রম হারিয়ে যায়।"
4. ComboBox — ডাক্তার আপা orders a box with label (345, 16, 15). Steppers for ডিম,
   রুটি and কলা, and a live label total. The reader hunts until it matches (2, 1, 1).
   → pass: "কিছু এটা + কিছু ওটা + কিছু সেটা। এর নাম linear combination।" [Stepper]
5. NameParts — The expression λ₁v₁ + λ₂v₂ + λ₃v₃ is written under the box. Tap each
   part to label it "কতটা" or "উপকরণ". Warning card: here v₁, v₂ are different vectors,
   not slots. [copy: SayItCards]
6. TwoButtons — Shiku knows only two moves: e₁ = one step east, e₂ = one step north.
   Reach (2, 3), then (−1, 4). The reader taps e₁/e₂ (minus allowed) and a counter
   tracks the presses. → pattern: the presses ARE the numbers.
   → pass: "(2, 3) = 2·e₁ + 3·e₂। vector-এর সংখ্যাগুলো আসলে recipe-র পরিমাণ।"
7. TiltedField — The fair ground is tilted to the gate. New buttons: a = (1, 1) and
   b = (−1, 1). Reach (2, 4). The reader finds 3a + 1b, and the screen shows there is
   only one way. → pass: "উপকরণ বদলালেও একই জায়গায় পৌঁছানো যায়, প্রতিবার ঠিক এক উপায়ে।
   এটাই basis।" (A one-line PCA teaser.)
8. BendIt — Challenge: using only add and stretch, draw a curve from A to B. Every
   attempt comes out straight. It can't be won. [copy: NeverShrinks]
   → pass: "যোগ আর stretch: সোজা লাইন সোজাই থাকে। 'Linear' মানে এটাই।"
9. Check — which is a linear combination? (`SayIt` is folded into NameParts and
   TwoButtons: `λ₁v₁ + … + λₖvₖ` → "প্রতিটা উপকরণ কিছুটা করে", `e₁, e₂` → "প্রতিটা
   axis ধরে এক পা".) → LessonLink → 3.4.
```

```
3.4 — ‖v‖, গুপ্তধন কত দূরে
Story: Treasure-hunt prizes go to whoever ended up farthest from the gate. We need a
number for "how long is this arrow".

1. TapeRecall — Clue (3, 4). How long? The reader lays Shiku's tape (from 2.5) → 5.
   Only now does the arrow get its name tag: ‖v‖. → pass: "‖v‖ = arrow-এর দৈর্ঘ্য =
   √(3² + 4²) = 5।" [copy: ShikuTape]
2. BoxClue — 3-slot clue (2, 3, 6) from the rooftop stall. The reader fills
   squares → add → root. → pass: "যত ঘরই থাকুক: বর্গ, যোগ, root। (2, 3, 6) → 7।"
3. TripLength — সামিন at (1, 2), prize at (7, 10). How far? The reader first builds the
   trip (end − start = (6, 8), from 3.1), then measures it: 10.
   → pass: "দূরত্ব(a, b) = ‖a − b‖। দুইটা পুরানো idea আসলে একটাই।"
4. TeaStalls — The committee wants 2 চা stalls so visitors walk the least. 12 visitor
   dots in two loose clumps. The reader drops 2 flags anywhere → "কাছেরটায় যাও" colours
   each visitor by the nearer flag (that's ‖a − b‖) → "average-এ সরাও" moves each flag to
   its visitors' average (3.3's centroid) → repeat until the flags stop moving.
   [copy: usePlay step machine] → pass: "কাছের দলে ভাগ, average-এ সরাও, আবার। এর নাম
   k-means। 'average customer', 'typical spam' এভাবেই বের হয়।"
5. NoZero — Challenge: make an arrow of length 0 that isn't at the gate, or one with a
   negative length. The slots can be dragged anywhere and it still can't be done.
   → pass: "দৈর্ঘ্য কখনো negative না। শূন্য শুধু 'কোথাও না গেলে'।" [NeverShrinks]
6. StretchTape — λ slider on (1, 2) with a live length readout. Predict the length at
   λ = −2 → 4.47, which is 2 × 2.24; flipping doesn't change it.
   → pass: "‖λv‖ = |λ|·‖v‖। উল্টালে দিক বদলায়, দৈর্ঘ্য না।"
7. Detour — Clues (3, 1) + (1, 4). Two meters: "হেঁটেছে" 7.29 and "দূরে আছে" 6.40. The
   reader rotates leg 2 trying to make the two equal. It only works when both legs
   point the same way. Callback: golf ball 60 + 60 pushes, but a speed of 84.9.
   → pass: "ঘোরা পথ কখনো সোজা পথের চেয়ে ছোট না: ‖u + v‖ ≤ ‖u‖ + ‖v‖।"
8. SayIt — `|−3|` → "3, minus চিহ্ন ছাড়া" · `‖v‖` → "v-এর দৈর্ঘ্য; দুই দাগ মানে
   vector" · `‖a − b‖` → "a আর b-এর দূরত্ব" · `‖v‖²` → "root নেওয়ার আগের সংখ্যা".
9. Check — "বর্গ করে আবার root, এটা কি অকারণ?" Explanation: squaring makes every
   gap positive, and the root brings back cm instead of cm². ML code often skips the
   root (`‖v‖²`) because a bigger length always has a bigger square. → LessonLink → 3.5.
```

```
3.5 — কাক, পথিক আর দাবার রাজা
Story: A lost visitor asks "ফাহিমের stall কত দূর?". Three friends give three answers,
and all three are right.

1. HowFar — The stall is 3 blocks east and 4 north through the rows of stalls. Speech
   bubbles: the robotics club's drone says 5, the walker says 7, সোম's chess king says
   4. Who's right? (5 / 7 / 4 / তিনজনই) → reveal: all three. [Speech + Choice]
2. WalkRows — The reader walks between the stalls (no cutting through). Try 3 routes:
   every shortest one is 7. → pass: "হাঁটার দূরত্ব = |3| + |4| = 7। একে L1 বলে।"
3. KingMoves — A chess king on the board. The reader reaches (3, 4) in as few moves as
   possible: 4 (3 diagonal + 1 straight). → pass: "রাজার দূরত্ব = বড় ঘরটা, max(3, 4)
   = 4। এটা L∞।"
4. NameThree — The table fills in from the three screens: L2 = 5 (the crow),
   L1 = 7 (the walk), L∞ = 4 (the king). Subscripts ‖v‖₂, ‖v‖₁, ‖v‖∞ appear, and a plain
   ‖v‖ means L2. [copy: CoinArrows table]
5. OneAway — "ঠিক 1 দূরের সব জায়গা" for each friend. Predict the shape first, then
   tap/drag the points → a circle, a diamond, a square.
   → pass: "একই '1 দূর', তিন রকম আকার। কোন মাপ নাও, তাতে কে 'কাছে' সেটাই বদলায়।"
6. OneWildValue — Two pairs of students: one differs by 1 in each of 10 things, the
   other by 10 in just one thing. Predict which pair is farther under the crow and
   under the walk → L1 10 vs 10, L2 3.2 vs 10.
   → pass: "L2 একটা বড় পার্থক্যকে চেঁচাতে দেয়। L1 সবাইকে সমান গোনে।"
7. KnobFine — The robotics club's pumpkin-weight guesser (2.8's radio knobs) has 2
   knobs, and a star marks its "best" setting at (2, 0.6). Club rule: turning knobs
   too far costs a fine, because a wild machine memorises the practice pumpkins and
   fails on new ones. So the knobs must stay inside a budget of 1. Round 1, measured
   by the crow (a circle): the reader drags the knob-dot to get as close to the star
   as possible → (0.96, 0.29), both knobs small. Round 2, measured by the walk (a
   diamond): the best spot is the corner (1, 0), so knob 2 is exactly 0. [Ticks for
   2 rounds; copy: RuleVsTape drag] → pass: "Crow-fine (L2, ridge) সব knob একটু
   ছোট করে। Walk-fine (L1, lasso) কিছু knob একেবারে 0 করে দেয়, মানে ওই clue বন্ধ।
   কারণ diamond-এর কোণাগুলো axis-এর উপরেই।"
8. WorstPixel — An 8-pixel strip of the stall's photo. The reader nudges pixels, and
   an L∞ meter shows only the worst one. "কোনো pixel 2%-এর বেশি বদলায়নি" is an L∞ rule.
9. Check — "দৈর্ঘ্য মানে কি ঘরগুলো যোগ করা?" → "ওটা L1, আর তাও minus চিহ্ন বাদ দিয়ে।
   আসল ruler দৈর্ঘ্য L2: (3, 4)-এ যোগ করলে 7, ruler বলে 5।"
10. Check — (−6, 8): L1, L2, L∞ = ? (14, 10, 8; always L∞ ≤ L2 ≤ L1) → LessonLink → 3.6.
```

```
3.6 — শুধু দিক, movie club-এর গোলমাল
Story: নাসিব's movie club recommends a film to each visitor. The visitor loves comedy,
and the club's score almost gives them a drama.

1. LoudFilm — Visitor (drama, comedy) = (2, 5). Film a = (5, 2) is a drama, film b =
   (1, 4) is a comedy. The club's rule is given as a machine: "ঘরে ঘরে গুণ, তারপর যোগ".
   Predict the winner → the reader runs both: 20 vs 22, almost a tie!
   (The rule is used as a black box here; Article 4 explains it.)
2. WhyLoud — The two films drawn as arrows, with lengths measured: 5.39 vs 4.12. Film
   a just has bigger numbers everywhere. → pass: "Loud film = লম্বা arrow। দৈর্ঘ্যের
   জোরেই score পাচ্ছে।"
3. ShrinkToOne — A λ slider on (3, 4) with a length readout. Stop exactly at length 1
   → λ = 1/5 → (0.6, 0.8). → pass: "নিজের দৈর্ঘ্য দিয়ে ভাগ = দিক একই, দৈর্ঘ্য 1।"
   [copy: DotsBunch gate at threshold]
4. HatCheck — The reader checks 0.6² + 0.8² = 1 and names it v̂ = v / ‖v‖ ("v-hat").
5. OnTheRing — A dozen arrows of all lengths. Tap "normalise" and they all shrink onto
   the ring of radius 1 → only their compass bearings stay. e₁ and e₂ were already on
   the ring. → pass: "Unit vector = শুধু দিক, দূরত্ব ছাড়া।"
6. FairFight — Rerun the club's rule with â and b̂: 3.71 vs 5.34. The comedy wins
   clearly. → pass: "দৈর্ঘ্য সরিয়ে দিলে ছবিগুলো শুধু দিক দিয়ে লড়ে।"
7. Check — "normalise করলে কি কিছু হারাই?" (the film's kind vs a customer's total
   spend) → LessonLink → 3.7.
```

```
3.7 — গ্রামের ফাঁদ, ডাক্তার আপার stall
Story: Fair day. ডাক্তার আপা's health stall runs "তোমার যমজ কে?", which matches each
student to the most similar one by (height, weight). One volunteer types weight in
grams, and the answer flips.

1. KgVsGram — A (172, 68), B (190, 69), C (173, 78). Who is A's twin? Predict → in kg,
   C wins (10.0 vs 18.0). Flip the switch to gram → B wins (1000 vs 10000)!
   → pass: "মানুষ একই, উত্তর উল্টা। বদলেছে শুধু আমাদের unit।"
2. UnitDial — A dial for weight's unit (kg / 100 g / 10 g / g). The reader turns it and
   watches the winner flip. → pass: "Formula ধরে নেয় 1 cm = 1 kg = 1 g। কেউ জিজ্ঞেস
   করেনি। দূরত্ব আমাদের unit-ও মাপছিল।"
3. TwoSchools — Two schools' weight dot-strips: one tight (everyone within a few kg),
   one wide. Is a 10 kg gap "a lot"? The reader picks for each school.
   → pass: "বড় না ছোট, সেটা বোঝা যায় feature-টা সাধারণত কতটা ছড়ায় তা দিয়ে।"
4. SpreadMachine — Five students' heights (155, 165, 170, 175, 185), which is a COLUMN,
   not one student. The reader steps a machine: subtract average → the gaps
   (−15, −5, 0, 5, 15) → their length → ÷ √5 → 10 cm. Then weights → 12 kg.
   [copy: BazaarSigma / WardFive] → pass: "স্বাভাবিক ফারাক: height-এ 10 cm, weight-এ
   12 kg। এটাই নতুন মাপকাঠি।"
5. Yardstick — Redo A→B and A→C, dividing each gap by its yardstick first: 1.80 vs
   0.84 → C. → pass: "প্রতিটা gap নিজের মাপকাঠিতে মাপো, তারপর দূরত্ব।"
6. GramsCancel — The same switch as screen 1, flipped to gram now. The numbers don't
   move. → pass: "gram ÷ gram = শুধু একটা সংখ্যা। Unit কেটে গেল। Article 1-এর কথা
   রাখা হলো।"
7. ZScore — (value − average) ÷ spread. The reader places 3 students on a z-line:
   "average-এর চেয়ে কয়টা স্বাভাবিক ফারাক উপরে-নিচে". Name drop: StandardScaler.
8. NotTheTruth — A slider for the weight spread. At 5 kg, B wins (1.81 vs 2.00). The
   reader finds where the winner flips. → pass: "Scaling সত্য খুঁজে দেয় না; সিদ্ধান্তটা
   চোখের সামনে আনে।"
9. TwoNormalises — Sort cards into "একটা row-কে তার দৈর্ঘ্য দিয়ে ভাগ (3.6)" and
   "একটা column-কে তার spread দিয়ে ভাগ (3.7)".
10. Finale — «মেলার ঝুলি»: "সাতটা lesson…" recap of the two moves, recipes, the three
    lengths and the two normalisations, and the full notation `Table` (every symbol
    from 3.1–3.7 with how to say it). Teaser as a last tap: "দুইটা vector গুণ করা যায়?"
    → "ঘরে ঘরে গুণ" gives just another list with no clean meaning; the useful
    multiply returns ONE number, "কতটা মিলে" → Article 4 (the movie club's rule,
    finally).
```

---

## Open questions

1. **3.7 screen 4, ÷ √5:** it's heavy for a zero-math reader. Option: the machine shows
   it as "gap-গুলোর বর্গের average, তারপর root" (same number), and the reader never sees √n.
2. **3.6 uses "গুণ করে যোগ" before the dot product exists.** Is it OK as a black-box
   club rule, or should 3.6 compare by angle only (no score)?
3. **3.5 is now 10 screens.** If it feels long, `WorstPixel` is the one to cut.
