# Article 5 → five journeys (Math for AI 5.x)

Source: `05-vector-spaces-span-and-basis.md`. One running story: **বাসা বদল**. The
holiday is over and ফাহিমের family is moving to a flat in a new এলাকা. Each journey is
one day of moving week: the empty flat and the remote shop, the দালাল's rent খাতা, moving
day, the first walk to the new school, and the বাড়িওয়ালা's ছাদের flat. The week ends
with the family's first night in the new flat.

I'd suggest 5 journeys. The article is shorter than 3 or 4 (~800 lines), but it has five
separate aha's and each needs its own hands-on story: *what can a set reach*, *which one is
redundant*, *how few is enough (and the count is forced)*, *the same arrow gets new numbers*,
and *new numbers can mean something*. §4 (vector space, axioms, subspace) is the one chunk
that can't fill 8 screens; it folds into 5.3 as two screens and a `<Then>`.

The module's own debt, carried from the 4.6 finale bridge: **"কয়েকটা উপকরণ দিয়ে কোথায়
কোথায় পৌঁছানো যায়, কোন উপকরণ বাড়তি, সবচেয়ে কম কয়টা লাগে, আর আমার data-র আসলে কয়টা দিক
লাগে?"** 5.1 answers the first part, 5.2 the second, 5.3 the third and fourth. 5.4 and 5.5
pay two older debts: 3.3's `TiltedField` / `DataBasis` ("a better basis for your data is PCA")
and 2.3's "137 নম্বর ঘরের মানে কী, কেউ জানে না … পরে বিস্তারিত আসবে".

**Cast:** ফাহিম (moving, carries Shiku) · Shiku (the class robot; its remote from 3.3 broke in
the packing) · আব্বু (asks the money questions: "বাথরুমের দাম কত?") · আম্মু (marks where the
furniture goes with chalk) · দালাল ভাই (has a rent app on his phone; says big things
confidently) · বাড়িওয়ালা চাচা (owns the building, has a new ছাদের flat to rent) · নাসিব
(comes to help and bets, as in 3.3: "দুই button থাকলেই সব জায়গা", "নতুন তথ্য ছাড়া নতুন কিছু
বের হয় না") · সামিন (reads the খাতা, spots columns) · সোম (chess; the one who peels equations)
· রিকশাওয়ালা মামা (5.4, knows only "সোজা রাস্তা" and "কোনাকুনি গলি") · the robotics club's
drone from 3.5 (5.3, the one remote that has to go up).

**Already covered, not repeated:**
- linear combination, the recipe λ₁v₁ + λ₂v₂ (3.3 `ComboBox`, `NameParts`): used, not re-taught
- e₁, e₂ and "the numbers ARE the presses" (3.3 `TwoButtons`, `PressCount`): 5.1 recalls it in
  one screen (`OldRemote`)
- one tilted basis a = (1, 1), b = (−1, 1), "reach every spot, exactly one way", fractional
  presses, three bases for one star, the PCA teaser (3.3 `TiltedField`, `TwoWaysStar`,
  `FinerPresses`, `BasisCompare`, `DataBasis`). 3.3 already said the word **basis**. So 5.x
  never re-teaches "reach everything, one way"; its new ground is redundancy, the forced
  count, solving by hand, and meaning. 5.3 opens with a one-line callback.
- stretching one vector stays on a line through 0 (3.2 `TasteLine`, `StretchKnob`,
  `OneInLine`): 5.1 `OneButton` is that line, now named span. One screen.
- "a component is a shadow; in a square, 1-long tilted basis the new numbers are dots"
  (4.3 `AxisShadow` + its `<Then>`): 5.4 `WrongTape` `<Then>` callback only
- right angle ⇔ box = 0 (4.2 `CoinBox`): 5.5 `NewAxes` uses it in one tap
- projecting a cloud onto one line, PCA in words (4.5 `KeepShadows`): 5.5 `OneNumberRent`
  callback only
- the unit ring (3.6 `OnTheRing`): reused as one of 5.3 `CantFallOut`'s clubs
- feature scaling / fairness between coordinates (3.7): one line in the 5.5 `ReadTheNumbers` `<Then>`
- the "flat পিঠা" cloud (`02_vector_deep_dive.md`, main prose): 5.3 `FlatSheet` makes it real

**Nothing dropped. The extras find a corner of moving week:**
- §0 the three debts → the module debt paragraph above; each journey's finale says which one it paid
- §1 one ingredient → a line → 5.1 `OneButton`; two usually → the plane → 5.1 `OldRemote`,
  `MessyRemote`; the (1, 1), (2, 2) collapse and unreachable (3, 5) → 5.1 `TwinButtons`,
  `SlotsSame`; the span table → 5.1 `PaintReach`; "span always contains the origin" → 5.1
  `PaintReach` `<Then>`; "count tells nothing, reach does" → 5.1 finale rule; the floor inside
  3D → 5.3 `FloorInRoom`
- §2 redundant / independent → 5.2; the zero-walk test → 5.2 `WalkBack`; (1, 2), (2, 5) by the
  test → 5.2 `TrickyPair` (a deliberate callback to 5.1's remote গ); determinant teaser
  (Article 8) → `TrickyPair` `<Then>`
- the three facts: zero vector → 5.2 `ThreeInPlane` pass note + 5.1 `YourRemotes` (a dead button); at most n in
  ℝⁿ → 5.2 `ThreeInPlane`, 5.3; "a property of the set" → 5.2 `WalkBack` `<Then>`
- the dependent-columns table (cm/inch, bed+bath=total, % male/female, one-hot days) → 5.2
  `FindTheExtra`, re-dressed as the দালাল's columns
- multicollinearity, knobs swinging → 5.2 `SameRent`; "later costumes" (det 0, no inverse,
  infinite solutions) → one line in the 5.2 finale `<Then>`
- §3 basis = independent + spanning, "drop one / add one", the 5-row table → 5.3 `DropOne`,
  `ShopShelf`; dimension → 5.3 `AnyPairTwo`, `FanOnCeiling`; the Netherlands story → 5.4
  `SameSchool`, retold as ফাহিম at the new school (tallest in the old class, middle of the line
  in the new one)
- §4 closure, ℝ² without the origin, word counts, the unit sphere → 5.3 `CantFallOut`; the
  axioms table, "licence for algebra" (callback to 4.3 `NoCrossTalk`), polynomials / images /
  network weights are vector spaces → `CantFallOut` `<Then>`; subspaces of ℝ³, the line
  missing the origin → 5.3 `FloorInRoom`; the data pancake, "300 columns, 20 real directions",
  compression → 5.3 `FlatSheet`
- §5 (2, 3) → (−1, 3) in {(1, 0), (1, 1)}, the minus sign, [v]_B → 5.4; system of equations
  teaser (Article 10) → 5.4 `PeelEquations` `<Then>`; "a basis needn't be perpendicular" →
  5.4 is built on a slanted grid + 5.4 Check; orthonormal → dots, not solving → 5.4 `WrongTape`
  `<Then>`
- the house example (3, 2) → (2.5, 0.5) → 5.5; the honest 2.5 note and the √2 normalise to
  (3.54, 0.71) → 5.5 `ReadTheNumbers` + `<Then>`; (1, 1) · (1, −1) = 0 → 5.5 `NewAxes`
- §6 payoffs: feature engineering (profit/margin, BMI-ish) → 5.5 `OneNumberRent` `<Then>` ·
  redundant features → 5.2 · dimension / rank (Module 3) → 5.3 `FlatSheet` `<Then>` · PCA in
  one line → 5.5 `Finale` · embedding coordinates arbitrary, geometry real → 5.5 `SpinTheGrid`
- §7 notation → a small `Table` in each finale; the full table in the 5.5 `Finale`
- §8 FAQ: "span = the space?" → 5.1 Check option · "must a basis be perpendicular?" → 5.4
  Check · "linear independence = uncorrelated?" → 5.2 finale `<Then>` ("প্রায় কপি" columns
  wobble too) · "more vectors than the dimension?" → 5.3 Check · "why must a subspace
  contain the origin?" → 5.3 `FloorInRoom` pass · "is anything real?" → 5.5 `SpinTheGrid`
- §9 five things → 5.5 `Finale`
- Check yourself: Q1 → 5.1 Check · Q2 → 5.2 `FindTheExtra` · Q3 → 5.2 Check · Q4 → 5.2
  `FindTheExtra` · Q5 → 5.4 `YourErrand` · Q6 → 5.5 `YourHouse` · Q7 → 5.3 `CantFallOut` ·
  Q8 → 5.3 Check
- Next (Article 6, matrices as a table and as a verb) → the 5.5 bridge
- the credits paragraph → stays in the source only (dropped from the lessons on purpose)

| # | Slug | Title | Screens file |
| --- | --- | --- | --- |
| 5.1 | `05a_remote_span` | Math for AI 5.1 — Span, কোন remote কোথায় পৌঁছায় | `remote-journey.tsx` |
| 5.2 | `05b_extra_column` | Math for AI 5.2 — বাড়তি column, বাথরুমের দাম কত | `rent-journey.tsx` |
| 5.3 | `05c_moving_basis` | Math for AI 5.3 — Basis আর dimension, সবচেয়ে কম কয়টা button | `moving-journey.tsx` |
| 5.4 | `05d_school_lanes` | Math for AI 5.4 — একই arrow, নতুন সংখ্যা, স্কুলের রাস্তা | `lanes-journey.tsx` |
| 5.5 | `05e_rooftop_rent` | Math for AI 5.5 — ছাদের flat-এর ভাড়া, basis বদলে দেখা | `rooftop-journey.tsx` |

Wiring: append all five after `04f_library_search` in `courses.ts`; 4.6's `Finale` gets a
`LessonLink` to 5.1 (its last `<Then>` already names span, independence and basis as the
next story, in words only); each journey's last step links to the next; 5.5 closes the
article and points to Article 6 (matrices).

The shared machine: 5.1 builds **the remote** (`ButtonRemote`: two or three arrow-buttons,
each with − / + and a fractional slider, and a "সব combination" paint toggle that shades the
reach). 5.2, 5.3 and 5.4 reuse it from `remote-journey.tsx`, so "the remote" looks the same
everywhere, the way 4.x reused `DotBox`.

---

```
5.1 — Span, কোন remote কোথায় পৌঁছায়
Question: Shiku's remote broke in the packing. The toy shop downstairs has four
          two-button remotes on the shelf, and ফাহিম has money for one. আম্মু has
          chalked four marks on the empty flat's tiles (আলমারি, খাট, টেবিল, জুতার র‍্যাক).
          Which remotes take Shiku from the door to EVERY mark? নাসিব: "দুই button
          থাকলেই সব জায়গা।" The shop closes at মাগরিব.
Story:    The empty flat, bare tiles = the grid, the door corner = the origin.
          Remotes: ক (1, 0), (0, 1) · খ (1, 1), (2, 2) · গ (1, 2), (2, 5) · ঘ (2, 0), (−5, 0).
          Marks: আলমারি (3, 5) · খাট (1, 3) · টেবিল (2, 2) · র‍্যাক (1, 0).
          ক and গ reach all four; খ reaches only the টেবিল, ঘ only the র‍্যাক: every
          wrong remote gets one success, so the trap holds until the end.

1. RemoteShelf — The four remotes as cards, the four chalk marks on the tiles. The reader
   ticks the remotes they think reach every mark, then seals. Unmarked. → pass: "বাজি সিল
   হলো। একটা একটা remote চালিয়ে দেখি।" [copy: HaatBet / NasibBet multi-select]
2. OneButton — First the shop's cheapest remote, one button (1, 1). Stretch it forwards,
   backwards, halfway: every stop lands on one line through the door. The reader tries to
   reach the খাট and can't. → pass: "এক button মানে একটা লাইন, আর লাইনটা দরজা ছুঁয়ে যায়।"
   [copy: 3.2 StretchKnob] Then: 3.2's শরবতের লাইন was this same line. Its name: the span
   of (1, 1), everything this remote can reach.
3. OldRemote — Remote ক, the old kind. The reader reaches all four marks in a row; the
   presses are the mark's own numbers. One quick screen. → pass: "(3, 5) মানে 3 বার e₁,
   5 বার e₂। পুরানো remote সবখানে যায়।" [copy: 3.3 TwoButtons]
4. TwinButtons — Remote খ. The reader drives it (both sliders, minus allowed) at the
   আলমারি (3, 5). The টেবিল works, the আলমারি never does: every combination lands on the
   diagonal. Can't be won. → pass: "(2, 2) আসলে (1, 1)-এরই দুই গুণ। Button দুইটা, কাজ
   একটার।" [copy: NeverShrinks]
5. SlotsSame — Why: tap to build α·(1, 1) + β·(2, 2) = (α + 2β, α + 2β). Both slots always
   hold the same number, and the আলমারি needs 3 in one and 5 in the other. → pass: "দুই ঘরে
   সবসময় একই সংখ্যা, তাই (3, 5) কোনোদিনও না।"
6. MessyRemote — Remote গ, which looks the least tidy. Predict: does it reach the
   আলমারি? The reader hunts with steppers → 5 presses of (1, 2), then ONE BACK on (2, 5):
   (5, 10) − (2, 5) = (3, 5). Then the খাট: −1 and +1. → pass: "দেখতে অগোছালো, কিন্তু
   দুইটা আলাদা দিক। একটু পিছিয়ে হলেও সবখানে যায়।"
7. PaintReach — The "সব combination" toggle on each remote: ক paints the whole floor, খ one
   diagonal line, গ the whole floor, ঘ only the wall line along the door. → pass: "যতগুলো
   জায়গায় পৌঁছানো যায়, সবগুলো একসাথে: একেই বলে span।"
   Then: the definition in words; span{v} = a line, span{e₁, e₂} = the plane, span{(1, 1),
   (2, 2)} = a line. Every span contains the door: press nothing and you're there.
8. YourRemotes — এবার আপনার পালা: four new remotes, the reader predicts "লাইন" or "পুরো
   মেঝে" before painting: (3, 1) & (−6, −2) · (1, 0) & (1, 1) · (0, 0) & (2, 1) (a dead
   button) · (2, 3) alone. Wrong tries bounce.
9. Check — span of {(2, 0)} vs {(2, 0), (−5, 0)} (the same wall line · the whole floor, the
   trap · two lines) and "remote-এর span কি সবসময় পুরো মেঝে?" (FAQ: only when it's a basis)
10. Finale — ## শেষ! ফাহিম remote গ কিনলো. The bet table ✓ ✗ ✓ ✗: নাসিব's rule lost
    twice. Rule: "Button গুনে লাভ নাই, দেখো কতদূর পৌঁছায়।" Symbols: span{v, w}.
    Bridge: next morning the দালাল's rent app says a bathroom is worth 3000 টাকা, then
    after one more flat, −2000. How can a bathroom make a flat cheaper? (5.2)
```

```
5.2 — বাড়তি column, বাথরুমের দাম কত
Question: আব্বু must choose between two flats; the second has one extra bathroom and costs
          4000 more. "একটা বাথরুমের দাম কত?" The দালাল's app said 3000 in the morning, and
          after he added one more flat to his খাতা, −2000. Same data, same app. Which
          answer should আব্বু believe? He signs tonight.
Story:    The দালাল's খাতা: 6 flats with (bed, bath, মোট ঘর) and rent in হাজার. The real
          rule behind the rents is 5·bed + 3·bath. Because মোট ঘর = bed + bath, every knob
          set (5 − c, 3 − c, c) gives exactly the same rents: c = 0 → 3000, c = 5 → −2000.

1. TwoAnswers — sealed bet: 3000 ঠিক · −2000 ঠিক · দুইটাই ঠিক · কোনোটারই মানে নাই.
   → pass: "বাজি সিল হলো। আগে খাতাটা খুলে দেখি।"
2. CopyColumn — Warm-up: the খাতা lists area twice, in sq ft and in sq m. Given three rows
   of sq ft, the reader fills the sq m column before it's shown (÷ 10.76). → pass: "একটা
   column আরেকটার কপি। ওটা থেকে নতুন কিছু জানা যায় না।"
3. HiddenSum — The মোট ঘর column isn't a copy of anything. The reader picks the rule from
   four cards (bed × 2 · bed + bath · bath + 1 · কোনো নিয়ম নাই) and checks it on every row.
   → pass: "কপি না, তবু বাড়তি: বাকি দুইটা column জুড়েই এটা বানানো যায়।"
4. SameRent — Two knob cards, the app's morning one (5, 3, 0) and its evening one
   (0, −2, 5). The reader runs both on all 6 flats: identical rents, row after row.
   → pass: "দুইটা আলাদা knob-set, হুবহু একই ভাড়া। App বলতেই পারে না কোনটা ঠিক।"
   Then: this is why the bathroom knob swings wildly: the credit can be shuffled between
   bath and মোট ঘর for free. The name multicollinearity, said once. Real libraries either
   complain or quietly pick one.
5. WalkBack — Back to 5.1's remotes and the zero test: can Shiku press non-zero amounts and
   end up back at the door? খ: 2·(1, 1) − 1·(2, 2) = (0, 0), yes. ক: only by pressing
   nothing. The reader tries both. → pass: "না নড়ে ছাড়া দরজায় ফেরা না গেলে, কেউ বাড়তি না।"
   Then: the definition c₁v₁ + … + cₙvₙ = 0 only when every c = 0; the name linearly
   independent / dependent. It's a property of the set: no single button is "dependent".
6. TrickyPair — Remote গ again: (1, 2) and (2, 5), no visible copy. The reader tries to
   walk back to the door with sliders, then steps the slot-by-slot machine: α = −2β, then
   β = 0. → pass: "শুধু শূন্য চাপলেই দরজা: independent।" [copy: SpreadMachine step]
   Then: doing this for every pair gets old; Article 8's determinant answers it in one number.
7. ThreeInPlane — A third button (2, 3) added to ক. The reader finds the walk back
   (2, 3, −1). Then a challenge: choose ANY third button so that the three are independent.
   Can't be won; the zero button flashes as the worst choice. → pass: "মেঝেতে তিনটা button
   মানেই একটা বাড়তি। আর 0 button সবসময় বাড়তি।" [copy: NeverShrinks]
8. FindTheExtra — এবার আপনার পালা: five small খাতা, the reader taps the extra column and
   picks its recipe, wrong tries bounce: ভাড়া (টাকা) & ভাড়া (হাজার) · bed, bath, মোট ঘর ·
   ছেলে % & মেয়ে % of the building · উত্তর/দক্ষিণ/পূর্ব/পশ্চিম-মুখী one-hot (always sum
   to 1) · bed & তলা (none extra: the trap).
9. Check — Is {(1, 3), (2, 7)} independent? Show it with the zero test (yes, β = 0 · no,
   one's a copy · can't tell without a picture).
10. Finale — ## শেষ! বাথরুমের দাম 3000. Delete মোট ঘর and rerun: the app gives 3000 every
    time. The 4000 flat is charging 1000 extra; আব্বু takes the first one. The bet: "কোনোটারই
    মানে নাই" wins for the original app, 3000 wins once the column is gone. Rule: "একটা
    column বাকিদের দিয়ে বানানো গেলে সে কিছু যোগ করে না, শুধু knob-গুলোকে দোলায়।"
    Then: "প্রায় কপি" columns wobble too, without technically being dependent (the
    correlation FAQ, no numbers); this same trouble returns in Articles 8–10 as a zero
    determinant, no inverse, infinitely many solutions. Bridge: moving day. The truck is
    coming, and the drone has to dust the ceiling fan: how few buttons can a remote have? (5.3)
```

```
5.3 — Basis আর dimension, সবচেয়ে কম কয়টা button
Question: Moving day. Every remote button costs 50 টাকা at the shop. Shiku needs a floor
          remote, and the robotics club's drone needs one that reaches the ceiling fan.
          The shopkeeper: "যত বেশি button, তত নিরাপদ।" নাসিব: "ঠিক দিকের একটা button-ই
          যথেষ্ট।" সোম: "যেভাবেই বানাও, সংখ্যাটা একই।" What is the fewest for the
          floor, and for the room, and is that number the same whoever designs it?
Story:    The flat fills with boxes. 3.3 already found that a, b reach everywhere exactly one
          way (callback line only); the new question is the count.

1. FewestButtons — sealed: floor 1 / 2 / 3 / যত বেশি তত ভালো; room 2 / 3 / 4.
2. DropOne — Start with {(1, 0), (0, 1), (2, 3)} from 5.2. The reader removes buttons one at a
   time and paints: drop (2, 3) → still the whole floor; drop another → a line.
   → pass: "একটা বাদ দিলে কিছু হারায় না, আরেকটা বাদ দিলেই সব যায়। মাঝের জায়গাটাই basis।"
   Then: basis = independent AND spanning; the smallest complete set. Callback to 3.3,
   where a, b already did "every spot, one way".
3. ShopShelf — The source's 5-row table as a sort: {(1,0),(0,1)} · {(1,2),(2,5)} ·
   {(1,1),(2,2)} · {(1,0)} · {(1,0),(0,1),(2,3)} into basis / not, then the reason
   (বাড়তি আছে / সব জায়গায় যায় না). The table fills. [copy: CoinArrows table]
4. AnyPairTwo — The reader designs their own floor remote by dragging buttons anywhere.
   Every working design has exactly two; three always lights a "বাড়তি" flag, one always
   paints a line. → pass: "যে-ই বানাক, মেঝের জন্য ঠিক দুইটা। এই সংখ্যার নাম dimension।"
5. FanOnCeiling — The drone in the room (3D view). Two floor buttons can't lift it; a
   slanted pair paints only a tilted plank. Add an "up" button: the fan is reached. A fourth
   is always extra. → pass: "ঘরের জন্য তিনটা। দুইটা button দিয়ে ঘর ভরে না।"
6. FloorInRoom — Inside the 3D room: the floor is the span of two buttons, a flat sheet
   through the door corner. A tilted plank through the corner is a span too; a shelf 1 m
   above the floor is not: scale by 0 and you fall off it. → pass: "ঘরের ভেতরের যেকোনো
   span দরজার কোণ ছুঁয়ে যায়। না ছুঁলে ওটা span না।"
   Then: the name subspace; the complete list in ℝ³ (the corner alone, lines through it,
   planes through it, the whole room); every span is one. (FAQ: why the origin.)
7. CantFallOut — Four clubs of arrows; the reader tries to add or stretch their way out of
   each: all floor arrows (can't) · the floor minus the door corner ((1, 1) + (−1, −1)
   falls out) · the 1-long ring from 3.6 ((1, 0) + (0, 1) is 1.41 long) · only positive
   counts (× −1 falls out). → pass: "যোগ আর stretch করে যেখান থেকে বের হওয়া যায় না, সেটাই
   vector space।" (Check-yourself Q7)
   Then: the eight rules as one Table, "you already assume all of them"; they are what made
   4.3's NoCrossTalk multiplying-out legal. Anything obeying them is a vector space:
   polynomials, 28 × 28 images, a network's weights. "Our embeddings live on the unit
   sphere" is a surface, not a space.
8. FlatSheet — The দালাল's খাতা from 5.2 as 6 dots in 3D (bed, bath, মোট ঘর). The reader
   rotates the view until the cloud goes edge-on: a line. All six lie on one flat sheet.
   → pass: "তিনটা column, কিন্তু data থাকে একটা চ্যাপ্টা পাতে: আসলে দুইটা দিক।"
   Then: the picture is introduced here, not recalled (no journey has shown it before): real
   data rarely lies exactly on a sheet, but often close to one, like a চ্যাপ্টা পিঠা floating
   in the room. In words: data lying near a small subspace of a big space. 300 columns,
   maybe 20 real directions. That true count has a name, rank (Module
   3). This answers ফাহিম's question from the ঘাট: "আমার data-র আসলে কয়টা দিক লাগে?"
9. ShopOrder — এবার আপনার পালা: the shelf holds 7 buttons, including traps (a copy, a sum
   of two others, the zero button, a floor-only pair). The reader buys the cheapest set that
   reaches both the floor marks and the fan. Only 3 independent ones pass.
10. Check — Why can no set of two vectors be a basis of ℝ³? (a plane at most · they could if
    long enough · only if at right angles) and "can a basis have more vectors than the
    dimension?"
11. Finale — ## শেষ! দুই আর তিন. সোম wins: floor 2, room 3, whoever designs it. Rule:
    "Basis = কিছু বাড়তি নাই, আর সবখানে যায়। কয়টা লাগে, সেটাই dimension।" Symbols:
    dim(V), V ⊆ ℝⁿ. Bridge: tomorrow is the first day at the new school, and the new এলাকা
    has no road going north. (5.4)
```

```
5.4 — একই arrow, নতুন সংখ্যা, স্কুলের রাস্তা
Question: The map says the new school is (2, 3) from home: 2 east, 3 north. But the এলাকা
          has only two kinds of road: the সোজা main road going east, w = (1, 0), and the
          কোনাকুনি গলি going north-east, z = (1, 1). No road goes north at all. The
          রিকশাওয়ালা মামা wants the trip in "কত block সোজা, কত block কোনাকুনি". Which card
          does ফাহিম give him? First day, can't be late.
Story:    The new neighbourhood, a slanted grid laid over the map's square one.

1. SchoolBet — sealed, four cards: (2, 3) · (2, 1) · (−1, 3) · "যাওয়াই যাবে না, উত্তরের
   রাস্তা নাই". → pass: "বাজি সিল হলো। রিকশায় উঠে দেখি।"
2. NoNorthRoad — The reader drives the rickshaw with the ButtonRemote (সোজা ±, কোনাকুনি ±)
   → finds 3 blocks কোনাকুনি, then 1 block BACK on the main road. → pass: "উত্তরের রাস্তা
   ছাড়াই স্কুল, শুধু একটু পিছিয়ে যেতে হলো।" [copy: 3.3 TiltedField]
3. WhyMinus — Replay: 3 কোনাকুনি blocks land at (3, 3), one block too far east. The reader
   drags the correction. → pass: "গলি উত্তরে নিতে গিয়ে পূর্বেও ঠেলে দেয়। Minus-টা সেই
   বাড়তি পূর্ব কেটে দেয়।"
4. PeelEquations — Solving it without the rickshaw: a two-line step machine. Slot 2: only the
   গলি moves north, so z-amount = 3. Slot 1: 2 = w-amount + 3, so w-amount = −1. Check:
   −1·(1, 0) + 3·(1, 1) = (2, 3). → pass: "দ্বিতীয় ঘর থেকে একটা উত্তর সরাসরি, তারপর প্রথম
   ঘরে বসাও।" [copy: SpreadMachine step] Then: two equations, two unknowns: a system of
   linear equations. Article 10 does it for any size.
5. SameSchool — One arrow, two grids. The reader toggles the square map grid and the
   slanted road grid: the arrow never moves, its card flips between (2, 3) and (−1, 3).
   → pass: "School নড়েনি, arrow নড়েনি। বদলেছে শুধু grid।"
   Then: coordinates belong to an arrow AND a basis; [v]_B = (−1, 3). ফাহিম at the old
   school was the tallest in the line; at the new one he stands in the middle. His height
   didn't change, the line did. That's what a basis is: a choice of point of view.
6. YourErrand — এবার আপনার পালা: আম্মুর দুইটা errand, solved by hand with PeelEquations,
   then the rickshaw drives it to check: বাজার (4, 1) → (3, 1) (Check-yourself Q5) and
   মসজিদ (0, 2) → (−2, 2).
7. WrongTape — Trap: ফাহিম measures the trip on the new card with 3.4's tape, √(1² + 3²)
   = 3.16. The real tape says 3.61. → pass: "তেরছা grid-এর সংখ্যায় Pythagoras চলে না, কারণ
   রাস্তাগুলো সোজা কোণে না, আর গলির এক block 1-এর চেয়ে লম্বা।"
   Then: a basis doesn't need right angles; this one works fine for getting to school. But
   when the roads ARE at right angles and each block is 1 long (orthonormal), the new
   numbers are just shadows (4.3 AxisShadow), no solving, and lengths come out right.
8. Check — "Basis-কে কি সোজা কোণে হতেই হবে?" (no, just independent and spanning · yes ·
   only in 3D)
9. Finale — ## শেষ! ঘণ্টা পড়ার আগেই স্কুলে. The bet: (−1, 3) wins; "যাওয়াই যাবে না"
   was the trap. Rule: "সংখ্যা arrow-এর একার না, arrow আর basis দুইজনের।" Symbols:
   B = {w, z}, [v]_B. Bridge: at home the বাড়িওয়ালা চাচা is stuck: what rent should
   he ask for the new ছাদের flat? (5.5)
```

```
5.5 — ছাদের flat-এর ভাড়া, basis বদলে দেখা
Question: The বাড়িওয়ালা চাচা's খাতা has 8 flats as (bed, bath) with their rents, and the new
          ছাদের flat (4, 2) needs a rent before the tenant comes this evening. ফাহিম claims
          he can rewrite the same two columns so that rent needs just ONE number. নাসিব: "নতুন
          তথ্য ছাড়া নতুন কিছু বের হয় না।" Who's right? A জিলাপি bet.
Story:    The rents follow total size, and bed/bath balance barely matters. On the
          (bed, bath) grid the rent climbs diagonally; on ফাহিম's grid it climbs along one
          axis.

1. JilapiBet — sealed: ফাহিম · নাসিব · দুইজনেই.
2. RentGrid — The 8 flats as dots on (bed, bath), coloured by rent. The reader tries a
   one-knob rule along bed alone, then bath alone: neither fits. → pass: "ভাড়া বাড়ে
   কোনাকুনি, কোনো একটা axis ধরে না।"
3. NewAxes — ফাহিম's two buttons: size = (1, 1), "এক bed আর এক bath একসাথে", and
   imbalance = (1, −1), "এক bed বেশি, এক bath কম". The reader checks they're a basis
   (5.3) and taps the box: 1·1 + 1·(−1) = 0, square to each other (4.2). One quick screen.
4. HouseInNewBasis — Flat (3, 2) in the new basis. Step machine: 3 = s + m, 2 = s − m; add the
   two lines and m cancels: s = 2.5, then m = 0.5. Check: 2.5·(1, 1) + 0.5·(1, −1) = (3, 2).
   → pass: "একই flat, নতুন card: (2.5, 0.5)।"
5. ReadTheNumbers — Tap each number to read it out: 2.5 = "size ধরে আড়াই ধাপ, আর প্রতি ধাপে
   দুইটা ঘর, মোট 5" · 0.5 = "আধা ধাপ imbalance, মানে bath-এর চেয়ে এক bed বেশি".
   → pass: "নতুন সংখ্যাগুলো flat-টার কথা বলে, যেটা পুরানো সংখ্যা চুপচাপ লুকিয়ে রাখতো।"
   Then: the honest 2.5 note: each size step is two rooms, so the steps aren't 1 long.
   Divide both buttons by √2 (3.6) and the card becomes (3.54, 0.71): orthonormal, both
   numbers on one scale, the fairness problem 3.7 fixed with scaling.
6. OneNumberRent — All 8 flats redrawn on the new grid: rent climbs along size only;
   imbalance is small and barely moves it. The reader fits a one-knob rule: rent = 8000 ×
   size. → pass: "একই তথ্য, নতুন grid-এ ভাড়ার পুরো গল্প একটা সংখ্যায়।"
   Then: feature engineering is a change of basis ((revenue, cost) → (profit, margin),
   sums and differences of sensors). You add no information; you pick coordinates in which
   it's easy to see. Keeping size and dropping imbalance is 4.5's KeepShadows again.
7. SpinTheGrid — The word map from 2.3 (king, queen, man, woman). The reader rotates a
   square, 1-long grid under it: every slot number changes, while the distance and cosine
   readouts (3.4, 4.4) never move. → pass: "সংখ্যাগুলো grid-এর, সম্পর্কগুলো আসল।"
   Then: 2.3's debt paid: slot 137 means nothing because the model never picked a
   meaningful basis; it landed in some grid while training. Every cosine and every nearest
   neighbour survives any such turn. (FAQ: is anything real? Everything geometric.)
8. YourHouse — এবার আপনার পালা: the ছাদের flat (4, 2) → the reader solves (3, 1) by hand,
   reads it aloud (three size steps = 6 rooms, one imbalance step = two more beds than
   baths), and prices it with the one-knob rule: 24000. (Check-yourself Q6)
9. Check — "নতুন basis-এ লিখলে কি নতুন তথ্য আসে?" (no, you can always convert back · yes,
   the imbalance is new · only if orthonormal)
10. Finale — ## শেষ! বাজির ফয়সালা, আর নতুন বাসায় প্রথম রাত. Both were right: নাসিব (no new
    information, the card converts back) and ফাহিম (one number now tells the rent). They
    split the জিলাপি. Tap-to-reveal the five things to carry forward, then PCA in one line
    ("data থেকেই এমন একটা orthonormal basis খুঁজে বের করা, যার প্রথম দিকে data সবচেয়ে
    বেশি ছড়ায়, তারপর পরেরটা, আর প্রথম কয়েকটা রেখে বাকিগুলো বাদ"): every word is now known.
    The full notation Table (span{v, w} · e₁, e₂ (books also write i, j) · c₁v₁ + … = 0 ·
    dim(V) · V ⊆ ℝⁿ · B = {w, z} · [v]_B). Bridge → Article 6: so far the grid moved and
    the arrow stayed. What if a machine picks up the whole grid and moves every arrow at
    once? And a whole খাতা, one row per flat, is itself one object: the matrix.
```

---

## Open questions

1. **A new setting, বাসা বদল.** The holiday ended with 4.6 on the bus home, so a move gives
   a fresh place, and each day brings its own physical scene (empty tiles, the খাতা, boxes
   and the fan, slanted roads, the ছাদ). Or should Article 5 open a new setting that can last
   through all of Module 2 (matrices are coming), for example the new school?
2. **5.3 carries the most vocabulary** (basis, dimension, subspace, vector space, the flat
   sheet): 11 screens. If it runs long, `CantFallOut` becomes a `<Then>` paragraph (the
   source itself says the payoff is small), and `ShopShelf` folds into `ShopOrder`.
3. **5.2's app gives arbitrary knobs.** Real least squares with an exact copy either errors or
   quietly picks one answer; the story has it give two different answers on two runs. OK as a
   story simplification (with the one-line honesty in the `SameRent` `<Then>`), or should the
   screen show a tiny "প্রায় কপি" column instead, so that the swing is honest?
4. **Correlation (FAQ 3)** needs a word the app hasn't taught. The plan words it as "প্রায়
   কপি column-ও knob দোলায়" with no 0.99. Keep it that way, or give it its own screen?
5. **i, j vs e₁, e₂.** The source switches to the book's i, j; the app has used e₁, e₂ since
   3.3. The plan keeps e₁, e₂ and mentions i, j once in the 5.5 notation table.
6. **5.5's rent rule is exactly linear in size.** That makes the old-basis rule just as short
   (4000 × bed + 4000 × bath), which weakens "one number". Option: add small noise to the
   rents so that `RentGrid`'s one-axis fits visibly fail while the size fit works, and let
   the imbalance knob come out near 0 instead of exactly 0.
7. **Module 2 in `courses.ts`.** The course is one flat list. Add a visible "Module 2" break
   before 5.1, or keep appending?

**If five is too many,** a three-journey version merges 5.1 and 5.2 ("কোথায় পৌঁছায়, আর কে
বাড়তি": the remote bet, then the rent খাতা as its second half, cutting `OldRemote`,
`SlotsSame`, `CopyColumn` and `ThreeInPlane`), keeps 5.3, and merges 5.4 with 5.5 (the school
trip, then the ছাদের flat, with `WrongTape` and `SpinTheGrid` becoming `<Then>` paragraphs). I
would keep 5.4 separate whatever happens: "same arrow, new numbers, and a minus sign from
nowhere" is the one thing this article exists to show, and it needs room to surprise.

## Problems noticed in the source

Each one says how it's handled. The source file itself is left untouched: it's the reference
the journeys are built from, never rendered.

- It's a `.md` with no `export const metadata`, so it won't list as a lesson; it's reference
  material, like `03-` and `04-` (neither has metadata either). **Handled:** nothing to fix;
  each of the five `05*.mdx` journeys gets its own `metadata` when built.
- Pipe tables in §2, §3, §4 and §7; any that move into a lesson need `<Table>`. **Handled:**
  every table the plan uses (the 5.3 axioms table, the notation tables in each finale) is
  specced as `<Table>`; the §2 and §3 tables become screens (`FindTheExtra`, `ShopShelf`).
- It says Article 3 promised the basis would "arrive properly later". In the app, 3.3 already
  names **basis**, does a tilted-basis hunt with the "exactly one way" point, and shows three
  bases side by side (`TiltedField`, `TwoWaysStar`, `BasisCompare`). **Handled:** the
  "Already covered" block; 5.3 `DropOne` recalls 3.3 in one line, and the new ground is
  redundancy, the forced count, solving by hand and meaning.
- Its pancake callback points to "Article 2"; in the app it lives only in
  `02_vector_deep_dive.md`'s main prose (চ্যাপ্টা পিঠা), not in a journey. **Handled:**
  5.3 `FlatSheet` introduces the picture fresh (the reader sees the খাতা's dots lie on a
  sheet) and its `<Then>` never says "remember".
- The Netherlands anecdote is the book author's first-person story; it's retold with ফাহিম
  at the new school.
- "Linearly independent", "span", "basis", "subspace" and "multicollinearity" should stay in
  English; don't coin Bangla for them (no রৈখিকভাবে স্বাধীন).
- It names "correlated (0.99)" in the FAQ before correlation exists anywhere in the series.
  **Handled for now, your call:** the 5.2 finale `<Then>` says it as "প্রায় কপি column-ও knob
  দোলায়", with no number and no word "correlation"; open question 4 asks whether it deserves
  more.
- The numbers check out: (2, 3) → (−1, 3); (3, 2) → (2.5, 0.5) and (3.54, 0.71) after ÷ √2;
  the Q5 and Q6 answers (3, 1); Q3's β = 0.
