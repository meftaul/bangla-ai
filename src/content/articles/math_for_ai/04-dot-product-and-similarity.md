# The Dot Product and Similarity

### Module 1 · Article 4 — *Mathematical Foundations for AI, from zero*

> **The one sentence:**
> The dot product takes two vectors and gives back **one number that says how much
> they point the same way**. Divide out their lengths and what's left is pure
> direction — **cosine similarity**, the formula from the first page of Article 1,
> which you can finally read as a sentence.

**Before you start:** Articles 1–3. You need the two faces of a vector (list and
arrow), the norm `‖v‖` as "square every slot, add, take the root", and the unit
vector `v̂ = v / ‖v‖` as "same direction, length 1".

**What you'll be able to do by the end:** compute a dot product in any number of
dimensions; explain what its sign and size *mean*; find the angle between two
vectors you cannot draw; build a small recommender and a small search engine by
hand; and decide, for a given problem, whether to compare things with the dot
product, cosine similarity, or distance.

---

## 0 · Where we are, and the last debt

This is the last article of Module 1, and it has one job: close the loop that
Article 1 opened.

On the first page of this series you were shown this, and told it would become a
sentence:

```
                 u · v
cos(θ)  =  ─────────────────
              ‖u‖ · ‖v‖
```

Here is what you already have:

- **The bottom half is done.** `‖u‖` and `‖v‖` are lengths — Pythagoras, extended
  one triangle at a time (Article 3, §5).
- **You've used the top half without being told what it is.** In Article 1 we
  recommended a film by "multiplying matching slots and adding", got `22 > 8`,
  and moved on. We never said *why* that recipe should measure "pointing the same
  way". It looked like arbitrary arithmetic that happened to give the right answer.
- **Article 3 got you nine-tenths of the way.** It normalised the films, redid the
  multiply-and-add, and turned a near-tie (20 vs 22) into a clear winner (3.71 vs
  5.34). Then it stopped one step short and said "normalise the friend's vector too,
  and you arrive at cosine similarity."

And Article 3's final confusion was left hanging: *"Can I multiply two vectors?"*
The answer was: slot by slot, yes, but that gives another vector with no clean
meaning. The genuinely useful multiplication gives back a single number.

That number is today's subject. As in every article, we'll see it **twice** — once
as arithmetic on lists (§1), once as a picture of arrows (§3). The surprise of this
article is that two definitions that look completely unrelated turn out to produce
exactly the same number, and understanding *why* they agree is what makes the dot
product the most useful single operation in machine learning.

---

## 1 · The dot product as a list operation

### Multiply matching slots, then add

Here is the example the source book opens with:

```
   v  =  (2, 3)
   w  =  (2, 1)

   v · w  =  (2 × 2)  +  (3 × 1)  =  4 + 3  =  7
```

Pair up the slots by position, multiply each pair, add up the results. That's the
whole recipe. In general, for two vectors with n slots each:

```
   v · w  =  v₁w₁  +  v₂w₂  +  …  +  vₙwₙ

                n
          =     Σ   vᵢ · wᵢ
               i=1
```

Read the Σ version aloud, exactly as Article 1 taught: *"add up, for i from 1 to n,
the i-th slot of v times the i-th slot of w."*

The dot is written in the middle, `v · w`, and read "v dot w". That's where the name
comes from — nothing deeper than the symbol.

Three things to notice straight away:

**1. The answer is a scalar.** Two lists go in; one ordinary number comes out. This
is the single most important fact about the dot product, and it's why it is useful:
it *compresses a comparison of two whole lists into one number* you can rank, sort,
and threshold.

**2. Both vectors must have the same number of slots.** The familiar precondition.
`(2, 3) · (1, 4, 5)` has no answer — there is nothing to pair with the 5.

**3. Order doesn't matter.** `v · w = w · v`, because `2 × 2 = 2 × 2` and
`3 × 1 = 1 × 3`. Multiplying pairs doesn't care which one comes first.

### You've been doing dot products for years

The recipe looks abstract until you notice it everywhere.

**A shopping bill.** You buy 2 kg of rice, 1 litre of oil and 12 eggs. Rice is 60
taka a kilo, oil 180 a litre, eggs 12 each.

```
   quantities  =  (2,   1,  12)
   prices      =  (60, 180, 12)

   quantities · prices  =  (2 × 60) + (1 × 180) + (12 × 12)
                        =    120   +    180    +   144
                        =    444 taka
```

The total bill is the dot product of *how much* with *how much each*. Every
shopkeeper with a calculator is computing dot products all day.

**A weighted grade.** Your marks are 80 in the midterm, 60 in the project and 90 in
the final, weighted 20%, 30% and 50%:

```
   (80, 60, 90) · (0.2, 0.3, 0.5)  =  16 + 18 + 45  =  79
```

**A price prediction — the model from Article 1, grown up.** In Article 1 our model
was `price = a × area`, one knob. Real models use several features, each with its own
knob. Describe a flat by `(area in sq ft, bedrooms, age in years)` and give each
feature a knob:

```
   flat   x  =  (1200,  3,   10)
   knobs  w  =  (0.05,  2,  −0.3)

   predicted price  =  w · x  =  (0.05 × 1200) + (2 × 3) + (−0.3 × 10)
                              =       60       +    6    −     3
                              =   63 lakh
```

Read the knobs as a sentence: *every square foot adds 0.05 lakh, every bedroom adds
2 lakh, and every year of age takes off 0.3 lakh.* The negative knob says "older is
cheaper". This is called a **linear model**, and here is the thing to carry away:

> **Every linear model is a dot product: the features, dotted with the knobs.**

The knob vector `w` is called the **weights**, which is why "the model's weights" is
what everyone calls the knobs. Learning (Article 1, §7) is the search for the `w`
that makes these dot products match reality.

### A vector dotted with itself

One more, which you'll use constantly. Dot `v = (3, 4)` with itself:

```
   v · v  =  (3 × 3) + (4 × 4)  =  9 + 16  =  25
```

That's `3² + 4²` — the sum of squares from Article 3. Take the square root and you
get 5, which is `‖v‖`. So:

```
   v · v  =  ‖v‖²          or equivalently          ‖v‖  =  √(v · v)
```

**The norm was a dot product all along.** "Square every slot and add" is just "multiply
every slot by itself and add", which is the dot product of v with v. This small
identity is the first clue that the dot product has something to do with length —
and therefore with geometry.

---

## 2 · What the number is telling you: an experiment

We have a recipe. We don't yet know what the answer *means*. So let's do what
Article 1 recommended for every scary formula: put in small numbers and watch.

Fix one vector, `u = (3, 1)`, and dot it with a series of other vectors that point
in steadily different directions:

| w | Direction compared with u | u · w |
| --- | --- | --- |
| (6, 2) | exactly the same way, twice as long | 18 + 2 = **20** |
| (3, 1) | exactly the same way | 9 + 1 = **10** |
| (2, 2) | a little off (about 27°) | 6 + 2 = **8** |
| (1, 3) | well off (about 53°) | 3 + 3 = **6** |
| (0, 3) | further off (about 72°) | 0 + 3 = **3** |
| (−1, 3) | at a right angle (90°) | −3 + 3 = **0** |
| (−3, 1) | past the right angle (about 143°) | −9 + 1 = **−8** |
| (−3, −1) | exactly opposite (180°) | −9 − 1 = **−10** |

Stare at the right-hand column while reading down the middle one. Three patterns
jump out.

**The sign tracks the angle.** While `w` is within 90° of `u`, the dot product is
positive. At exactly 90° it's zero. Past 90°, it goes negative. It is as if the dot
product is asking *"are you broadly on my side, or against me?"*

```
                        ↑ w          u · w  =  0
                        │            (at right angles)
                        │
                        │      ↗ w   u · w  >  0
                        │    ↗       (less than 90° apart)
                        │  ↗
         w ←────────────●──────────────→ u
      u · w  <  0     origin
      (more than 90° apart)
```

**The size tracks the angle, too.** Among the rows where `w` has a similar length,
the closer the direction, the bigger the number: 10, 8, 6, 3, 0.

**But length gets mixed in.** Rows one and two point in *exactly* the same
direction, yet `(6, 2)` scores 20 and `(3, 1)` scores 10. Doubling the length
doubled the dot product. So the dot product isn't a pure measure of direction: it
blends "how aligned?" with "how long?" into one number.

That last point is the whole "loud film" problem from Articles 1 and 3, now caught
in the act. Hold on to it; §7 is about what to do with it.

The source book summarises the sign in a box worth memorising:

| Dot product | Meaning |
| --- | --- |
| `u · w > 0` | they point broadly the same way (less than 90° apart) |
| `u · w = 0` | they are at right angles (**perpendicular**) |
| `u · w < 0` | they point broadly opposite ways (more than 90° apart) |

(An honest refinement: the book says "positive means the same direction". It means
*broadly* the same — anything within 90°. `(3, 1)` and `(0, 3)` are 72° apart and
still score positive. Only the extreme values, which we'll pin down in §4, mean
"exactly the same" and "exactly opposite".)

So the experiment has told us *what* the dot product measures — alignment, blended
with length. It hasn't told us *why* multiplying matching slots should measure
alignment at all. For that we need the other face.

---

## 3 · The arrow reading: shadows

### A two-minute detour: cosine

Our geometry so far has needed only Pythagoras. Now we need exactly one more idea
from trigonometry, and it's gentler than its reputation.

Take any right-angled triangle and pick one of its two sharp corners. Call the angle
there `θ` ("theta"). The long side is the **hypotenuse**; the side touching your
corner is the **adjacent** side.

```
                            ●
                          ╱ │
          hypotenuse    ╱   │
          (the stick) ╱     │
                    ╱       │
                  ╱ θ       │
                ●───────────┘
                  adjacent
                  (the shadow)
```

Here is the fact: **the ratio adjacent ÷ hypotenuse depends only on the angle θ** —
not on how big the triangle is. Double every side, and the ratio stays the same.
That ratio has a name:

```
                  adjacent
   cos(θ)  =   ──────────────       read: "the cosine of theta"
                 hypotenuse
```

The physical picture makes it easy. Hold a 1-metre stick at angle θ above the
ground, with the sun directly overhead. Its shadow on the ground is exactly
`cos(θ)` metres long:

| Angle θ | Stick is… | Shadow = cos(θ) |
| --- | --- | --- |
| 0° | lying flat | 1 (the full stick) |
| 30° | tilted up a little | 0.866 |
| 45° | halfway up | 0.707 |
| 60° | steep | 0.5 |
| 90° | standing straight up | 0 (no shadow at all) |

Past 90° the stick leans *backwards*, and its shadow falls behind you — we count that
as negative:

| Angle θ | 120° | 135° | 150° | 180° |
| --- | --- | --- | --- | --- |
| cos(θ) | −0.5 | −0.707 | −0.866 | −1 |

Two properties to keep. **Cosine is 1 when the angle is zero, 0 at a right angle,
and −1 when pointing opposite.** And **a shadow is never longer than the stick**, so
cosine always sits between −1 and 1.

That's all the trigonometry this series needs. Your calculator (or any programming
language) does the rest: `cos(29.74°) ≈ 0.868`.

### Projection: the shadow of one arrow on another

Now put two arrows, `v` and `w`, at the same origin, with angle `θ` between them.
Tilt your head so that `v` lies flat, like the ground, and shine a light straight
down onto it:

```
                           ● tip of w
                         ╱ ┆
                   w   ╱   ┆   drop a line straight down,
                     ╱     ┆   at a right angle to v
                   ╱ θ     ┆
     origin  ●━━━━━━━━━━━━━┷────────────────────►  v
             └── shadow ───┘
               of w on v
```

The shadow that `w` casts on the line of `v` is called the **projection of w onto v**.
The source book stresses a point that's easy to get wrong: projection is *not*
rotating `w` until it lies on top of `v`. It is finding **the part of w that goes in
v's direction** — how far along v you would get if you could only travel in v's
direction.

The dashed line, `w` itself, and the shadow form a right-angled triangle with `w` as
the hypotenuse. So by the definition of cosine:

```
   length of the shadow  =  ‖w‖ · cos(θ)
```

### The geometric definition

Now the book's move. If we want a single number for "how much do these two point the
same way?", a natural candidate is: **the length of v, times the length of w's
shadow on v.**

```
   v · w  =  ‖v‖ · ‖w‖ · cos(θ)
```

Read it aloud: *"the dot product is the length of v, times the length of w, times the
cosine of the angle between them."* Or, more usefully: *"the length of v, times how
much of w points along v."*

Watch every case from the §2 experiment fall out of this:

- Same direction: `θ = 0`, `cos = 1`, the shadow is all of `w` — the biggest possible
  dot product for those two lengths.
- Right angle: `θ = 90°`, `cos = 0`, no shadow at all — dot product zero.
- Opposite: `θ = 180°`, `cos = −1`, the shadow falls backwards — negative.
- Double the length of `w`: its shadow doubles too — the dot product doubles. That's
  the `(6, 2)` row.

The pattern that seemed mysterious in the table is now obvious in the picture. The
dot product is *length times length times alignment*, and alignment is the cosine.

### Do the two definitions really agree?

We now have two completely different-looking recipes:

```
   list recipe:    v · w  =  v₁w₁ + v₂w₂ + … + vₙwₙ
   arrow recipe:   v · w  =  ‖v‖ · ‖w‖ · cos(θ)
```

One multiplies slots. The other measures lengths and an angle. They had better give
the same number, or we've been using the same symbol for two different things. Test
them.

**Test 1 — an angle we know.** Take `v = (2, 0)`, flat along the first axis, and
`w = (3, 3)`, pointing diagonally. The diagonal makes exactly 45° with the axis.

```
   list recipe:    (2 × 3) + (0 × 3)                   =  6

   arrow recipe:   ‖v‖ = 2
                   ‖w‖ = √(9 + 9)  =  √18  ≈  4.243
                   cos(45°)  ≈  0.707
                   2 × 4.243 × 0.707                  ≈  6.0     ✓
```

**Test 2 — the book's example.** `v = (2, 3)`, `w = (2, 1)`, where the list recipe
gave 7. The angle between them is about 29.7°:

```
   ‖v‖  =  √(4 + 9)  =  √13  ≈  3.606
   ‖w‖  =  √(4 + 1)  =  √5   ≈  2.236
   cos(29.7°)        ≈  0.868

   3.606 × 2.236 × 0.868   ≈  7.0     ✓
```

(The book quotes the angle as 29.4°; the precise value is 29.74°. With 29.4° the
product comes to 7.02 rather than 7.00 — a rounding slip in the book, and a good
reminder that arithmetic you check yourself is arithmetic you own.)

Same number, both times. That isn't luck.

### Why they agree — a sketch, using only what you already have

This part is optional, but it's the most satisfying argument in Module 1, and every
piece of it comes from Article 3.

**Step 1 — shadows add up.** Walk along `a`, then along `b` (tip to tail). The shadow
of the whole trip on a line is the shadow of the first leg plus the shadow of the
second. And stretching an arrow by λ stretches its shadow by λ. So the arrow recipe
obeys the same rules as ordinary multiplication: you can split a sum apart and pull
scalars out.

**Step 2 — dot the basis arrows with each other.** Recall `e₁ = (1, 0)` and
`e₂ = (0, 1)`, one step along each axis. Both have length 1, and they're at right
angles. Using the arrow recipe:

```
   e₁ · e₁  =  1 × 1 × cos(0°)   =  1        (an arrow's shadow on itself)
   e₂ · e₂  =  1 × 1 × cos(0°)   =  1
   e₁ · e₂  =  1 × 1 × cos(90°)  =  0        (perpendicular: no shadow)
```

**Step 3 — expand.** From Article 3, every vector is a recipe over the basis:
`v = v₁e₁ + v₂e₂` and `w = w₁e₁ + w₂e₂`. Dot them, splitting the sums apart as Step 1
allows:

```
   v · w  =  (v₁e₁ + v₂e₂) · (w₁e₁ + w₂e₂)

          =  v₁w₁ (e₁·e₁)  +  v₁w₂ (e₁·e₂)  +  v₂w₁ (e₂·e₁)  +  v₂w₂ (e₂·e₂)

          =  v₁w₁ (1)      +  v₁w₂ (0)      +  v₂w₁ (0)      +  v₂w₂ (1)

          =  v₁w₁  +  v₂w₂
```

**The list recipe falls out of the arrow recipe.** The cross terms vanish because the
axes are perpendicular, and the matching terms survive because each axis has length
1. "Multiply matching slots and add" isn't arbitrary at all: it's what shadows look
like when your axes are at right angles.

With n axes the argument is identical — every pair of different axes contributes 0,
every axis with itself contributes 1 — so the agreement holds in every dimension.

### A bonus: a component *is* a shadow

Dot any vector with a basis arrow:

```
   (2, 3) · e₁  =  (2 × 1) + (3 × 0)  =  2
   (2, 3) · e₂  =  (2 × 0) + (3 × 1)  =  3
```

You get its components back. So the number in slot 1 of a vector is exactly **the
length of its shadow on axis 1**. Article 2 said the numbers in a vector are "how far
you go along each axis"; now you know they are shadows.

Remember this. If you ever swap the standard axes for *different* perpendicular
directions — a tilted street grid, a better basis for your data — then a point's new
coordinates are simply its dot products with the new directions. That sentence is
nearly the whole of principal component analysis, where this series is headed.

---

## 4 · Cosine similarity: the formula from page one

### Running the formula backwards

The arrow recipe says `v · w = ‖v‖ · ‖w‖ · cos(θ)`. Divide both sides by the two
lengths:

```
                  v · w
   cos(θ)  =  ───────────
               ‖v‖ · ‖w‖
```

There it is — the formula from the top of Article 1, derived rather than
announced. Read it the way you'd read it to a friend:

> *"Take the dot product, then divide out both lengths. What's left is the pure
> alignment of the two arrows — the cosine of the angle between them."*

This is **cosine similarity**. It is the dot product with loudness removed.

Here's why running the formula backwards matters so much. In two dimensions you
could measure θ with a protractor. In 300 dimensions there is no protractor and no
picture — but there is still this formula. You can compute the right-hand side for
any two lists of 300 numbers. **In high dimensions, the formula doesn't just
calculate the angle; it's what we *mean* by the angle.** "These two word vectors are
20° apart" is a meaningful sentence only because of this line.

### Why it's always between −1 and 1

A shadow is never longer than the stick that casts it. So `|v · w|` can never exceed
`‖v‖ · ‖w‖`, which means the ratio is trapped:

```
   −1   ≤   cos(θ)   ≤   1
```

(This fact has a name you'll see in papers — the **Cauchy–Schwarz inequality** — and
you now know the one-line reason for it.)

So cosine similarity lives on a fixed scale, whatever the vectors are and however
long:

```
   +1   →  pointing exactly the same way        (as similar as it gets)
    0   →  at right angles                      (nothing in common)
   −1   →  pointing exactly opposite            (as different as it gets)
```

A fixed scale is what makes cosine similarity so practical. A dot product of 22 means
nothing on its own — is that big? It depends on the lengths. A cosine of 0.99 means
the same thing everywhere: *nearly the same direction*.

### Finishing the recommender properly

Back to the streaming service from Article 1. Films are `(drama, comedy)`, each 0–5.

```
   Susan liked   m  =  (4, 1)       heavy drama
   candidate     a  =  (5, 2)       a drama
   candidate     b  =  (1, 4)       a comedy
```

**Step 1 — the lengths.**

```
   ‖m‖  =  √(16 + 1)   =  √17  ≈  4.123
   ‖a‖  =  √(25 + 4)   =  √29  ≈  5.385
   ‖b‖  =  √(1 + 16)   =  √17  ≈  4.123
```

**Step 2 — the dot products** (we did these in Article 1):

```
   m · a  =  20 + 2  =  22
   m · b  =   4 + 4  =   8
```

**Step 3 — divide.**

```
                     22                22
   cos(m, a)  =  ───────────  =  ─────────  ≈  0.991      (about 7.8° apart)
                  √17 · √29        22.20

                      8                 8
   cos(m, b)  =  ───────────  =  ─────────  ≈  0.471      (about 61.9° apart)
                  √17 · √17         17
```

Recommend `a`. Same answer as Article 1 — but now the scores mean something on their
own. `a` is almost exactly Susan's kind of film; `b` is well away from it.

### And the friend — where the dot product nearly failed

Susan's friend liked `p = (2, 5)`, a comedy person. In Article 1 the raw dot
products gave a near-tie between the drama and the comedy:

```
   p · a  =  10 + 10  =  20
   p · b  =   2 + 20  =  22
```

Now as cosines, with `‖p‖ = √29 ≈ 5.385`:

```
   cos(p, a)  =  20 / (√29 · √29)  =  20 / 29      ≈  0.690     (about 46° apart)
   cos(p, b)  =  22 / (√29 · √17)  ≈  22 / 22.20   ≈  0.991     (about 8° apart)
```

The near-tie is gone. The comedy is an almost perfect match; the drama is nearly half
a right angle away. That was always the true picture — the drama's big numbers were
simply shouting over it.

Compare with Article 3, which normalised only the films and got 3.71 and 5.34. Divide
both by the friend's own length, `√29 ≈ 5.39`, and you get about 0.69 and 0.99 —
exactly these cosines. Article 3 had done every step but the last one.

(Notice too that the friend's match with the comedy, 0.991, is identical to Susan's
match with the drama. That's no accident: `p = (2, 5)` and `b = (1, 4)` are
`a = (5, 2)` and `m = (4, 1)` with their slots swapped — the same picture, reflected
across the diagonal. Angles don't change under a reflection.)

---

## 5 · Perpendicular means "nothing in common"

The middle of the cosine scale deserves its own section, because it is about to
become one of the most important ideas in the whole subject.

Two vectors are **perpendicular** — or, in the word linear algebra prefers,
**orthogonal** — when the angle between them is 90°. The dot product gives you a
test that works in any dimension, with no picture:

> **Two vectors are orthogonal exactly when their dot product is zero.**

In two dimensions you could have checked with a set square. In three or more you
cannot, but you can always compute:

```
   (1, 2, −1) · (3, −1, 1)  =  3 − 2 − 1  =  0
```

These two arrows in 3D space stand at a perfect right angle to each other, and you
found out without drawing anything.

**What it means in data.** If two vectors are orthogonal, neither has any shadow on
the other: knowing how far you've gone along one tells you *nothing* about how far
you've gone along the other. They are unrelated directions. That is why a cosine of
0 reads as "nothing in common" rather than "opposite" — opposite is −1, and opposite
is a strong relationship (knowing one tells you a lot about the other!). Zero is the
absence of any relationship.

**Your axes are orthogonal, and that's why they're pleasant.** `e₁ · e₂ = 0`. That
was exactly what made the cross terms vanish in §3, and it's why you can read a
vector's components one at a time without them interfering. Perpendicular
ingredients don't get in each other's way.

**A callback to high dimensions.** Article 2 warned that in very high dimensions,
"almost every pair of randomly chosen directions turns out to be nearly at right
angles". Now you can say it precisely: pick two random vectors of 300 slots, and
their cosine similarity will almost always be close to 0. This is why, in a
well-trained embedding, a cosine of 0.5 between two words is a *strong* signal — by
chance alone you would expect something near zero.

Orthogonality will come back again and again: the directions PCA finds are
orthogonal; the matrices that rotate without stretching are built from orthogonal
vectors; the "eigenvectors" of Module 3 are orthogonal in the cases we care about
most. It all starts with a dot product being zero.

---

## 6 · Projection as a vector: splitting an arrow in two

§3 found the *length* of w's shadow on v. Often you want the shadow itself — the
actual arrow lying along v. The source book draws exactly this.

The shadow has length `‖w‖ cos(θ)`, which (dividing the arrow recipe by `‖v‖`) is
`(w · v) / ‖v‖`. It points along v, whose direction is the unit vector `v̂ = v / ‖v‖`.
Length times direction:

```
                     w · v                w · v
   projection  =  ─────────  ·  v̂   =   ───────  ·  v
                     ‖v‖                  v · v
```

(The second form uses `‖v‖² = v · v` from §1, which saves taking any square roots.)

**The book's example.** Project `w = (2, 1)` onto `v = (2, 3)`:

```
   w · v  =  4 + 3  =  7
   v · v  =  4 + 9  =  13

   projection  =  (7/13) · (2, 3)  =  (14/13, 21/13)  ≈  (1.08, 1.62)
```

A short arrow lying along v's line, from the origin to about `(1.08, 1.62)` — a little
over half of v, which is exactly what the book's Figure 3.9 shows.

**The leftover.** Subtract the shadow from w and you get whatever part of w was *not*
along v:

```
   leftover  =  w − projection  =  (2, 1) − (14/13, 21/13)  =  (12/13, −8/13)
```

Check it against v:

```
   leftover · v  =  (12/13 × 2) + (−8/13 × 3)  =  24/13 − 24/13  =  0     ✓
```

Orthogonal, exactly. So every vector w splits cleanly into two pieces relative to any
direction v:

```
   w   =   (the part along v)   +   (the part at right angles to v)
            the shadow               the leftover
```

**Why machine learning cares.** The source book flags projection as fundamental "in
understanding how data can be represented in lower-dimensional spaces", and here is
the one-sentence version of why. Suppose your data is 300-dimensional, but it mostly
spreads out along a handful of directions. Project every point onto those few
directions, keep the shadows, throw away the leftovers — and you've compressed 300
numbers into a handful, losing only the small leftover parts. **That is principal
component analysis**, stated in words you now fully understand. The rest of this
series is about how to *find* the right directions.

---

## 7 · Dot product or cosine? The book's closing question

The source book ends its dot product section by asking: if both would work, which
should you use? It's a real decision with real consequences, so let's watch the two
disagree.

### The loud film

Add a third candidate to Susan's shelf, a film that rates itself at the maximum on
everything:

```
   L  =  (5, 5)       lots of drama AND lots of comedy
```

Score it against Susan (`m = (4, 1)`) and her friend (`p = (2, 5)`):

| | Dot with Susan | Cosine with Susan | Dot with friend | Cosine with friend |
| --- | --- | --- | --- | --- |
| a = (5, 2), drama | 22 | **0.991** | 20 | 0.690 |
| b = (1, 4), comedy | 8 | 0.471 | 22 | **0.991** |
| L = (5, 5), loud | **25** | 0.858 | **35** | 0.919 |

The dot product recommends `L` **to both of them** — the drama lover *and* the comedy
lover. Cosine similarity gives each of them their own genre.

A film that wins for everybody isn't being recommended because it fits. It's being
recommended because it's long — `‖L‖ = √50 ≈ 7.07`, the longest arrow on the shelf.
That's the loudness problem at its purest.

### The search engine

Here's the same problem where it really bites. Turn documents into vectors by counting
three words, `(cat, dog, stock)`. A user searches for "cat": `q = (1, 0, 0)`.

```
   A  =  ( 2, 0, 0)      a short note about cats
   B  =  (20, 1, 0)      a long article about cats
   C  =  ( 3, 5, 4)      a document about dogs and the stock market
                         that happens to mention cats three times
```

| Document | q · doc | cosine(q, doc) |
| --- | --- | --- |
| A — short, about cats | 2 | **1.000** |
| B — long, about cats | 20 | **0.999** |
| C — about dogs and stocks | 3 | 0.424 |

Under the dot product, the long article wins by a mile (fine), but the dogs-and-stocks
document **beats the short cat note**, 3 to 2 — just because it's longer. Under cosine
similarity, both cat documents score as near-perfect matches and the off-topic one is
correctly last. Length was measuring *how much text there is*, not *what it's about*.

### So which one?

The book's answer, which holds up: **it depends on whether length carries meaning in
your problem.**

- **Use cosine similarity when only direction matters** — when you care what *kind*
  of thing something is, not how much of it there is. Text search, document
  similarity, "find more like this", and comparing word or sentence embeddings are
  the classic cases. This is why semantic search and chatbot knowledge bases usually
  rank by cosine — or by dot products of pre-normalised vectors, which, as you're
  about to see, is the same thing.
- **Use the dot product when length is part of the answer.** In the price model of
  §1, the size of the flat isn't noise to be divided out — it *is* the price. And in
  many large-scale recommenders, the film vectors that come out of training tend to
  be longer for films that are broadly popular; there, the dot product's preference
  for long arrows can be exactly what you want. Just know that you're choosing it.

### The practical trick: normalise once, then just dot

If you normalise every vector to length 1 beforehand, the lengths in the cosine
formula are both 1, and:

```
   cos(θ)  =  û · v̂        (for unit vectors, cosine similarity IS the dot product)
```

Real systems do exactly this. Normalise every document or embedding once when you
store it; then every comparison afterwards is a plain dot product — the cheapest
possible operation, which is what GPUs are built for.

### And distance agrees, too

One more connection, which ties this article to Article 3. For unit vectors, the
squared distance between them and their cosine are locked together:

```
   ‖û − v̂‖²  =  2 − 2·cos(θ)
```

(Expand `(û − v̂) · (û − v̂)` using the "split the sums apart" rule from §3, and
remember `û · û = v̂ · v̂ = 1`.) Check it with the unit films from Article 3,
`â ≈ (0.928, 0.371)` and `b̂ ≈ (0.243, 0.970)`:

```
   â − b̂  ≈  (0.685, −0.599)          ‖â − b̂‖²  ≈  0.469 + 0.359  ≈  0.83
   cos(a, b)  =  13 / √493  ≈  0.585   2 − 2 × 0.585            ≈  0.83   ✓
```

So once everything is normalised, "nearest by distance" and "most similar by cosine"
are the *same ranking*. The three ways of comparing vectors in this module collapse
into one.

| | Dot product | Cosine similarity | Distance |
| --- | --- | --- | --- |
| Formula | `u · v` | `(u · v) / (‖u‖‖v‖)` | `‖u − v‖` |
| Bigger means | more similar | more similar | **less** similar |
| Range | anything | −1 to 1 | 0 upwards |
| Affected by length? | yes | no | yes |
| Good for | scoring, linear models | "same kind of thing?" | "same position?" |

---

## 8 · Where you'll meet the dot product in real systems

It's hard to overstate how much of modern AI is this one operation, repeated.

| In a real system | The dot product is… |
| --- | --- |
| A linear model | features · weights — the prediction itself (§1) |
| A single artificial neuron | inputs · weights, plus a constant, then a small "bend" |
| Semantic search, chatbot knowledge bases | query embedding · document embedding, usually normalised (cosine) |
| Recommenders | user vector · item vector, for every item on the shelf |
| Attention in language models | one word's "query" · another word's "key" — *how relevant is that word to this one?* |
| Matrix multiplication | a whole table of dot products at once — *Module 2* |

Two of those rows deserve a sentence each.

**The neuron.** A neuron in a neural network computes `w · x + b` — exactly the price
model of §1 — and then applies a small bend so that stacked neurons can draw curves
rather than only straight lines. That's the "one small bend between the straight
parts" Article 3 promised. The straight part is a dot product.

**Attention.** The mechanism at the heart of every modern language model is formally
called *scaled dot-product attention*. For each word, the model computes dot products
between that word's vector and every other word's vector, and a large dot product
means "pay attention to that word". When a chatbot works out that "it" in a sentence
refers to "the cat", it did so, in part, with dot products. The name is literal.

---

## 9 · Module 1, read out loud

Four articles ago, this was a wall of symbols:

```
                 u · v
cos(θ)  =  ─────────────────
              ‖u‖ · ‖v‖
```

Here is every piece of it, and where it came from:

| Piece | What it is | Where you learned it |
| --- | --- | --- |
| `u`, `v` | two things, rewritten as ordered lists of numbers | Article 1 — representation |
| …and also as arrows | a direction and a length, with no fixed location | Article 2 — the two faces |
| `‖u‖`, `‖v‖` | their lengths: square, add, root | Article 3 — norms |
| `u · v` | multiply matching slots and add = length × length × alignment | Article 4 — this one |
| `cos(θ)` | alignment alone, on a fixed scale from −1 to 1 | Article 4 — this one |

And the whole thing, as one sentence:

> **"To see how alike two things are, turn them into arrows, measure how much they
> point the same way, and divide out how long they are — so that only the direction
> is left."**

That's what a search engine does when it matches your query. It's what a recommender
does when it finds a film like the one you loved. It's what a chatbot does when it
looks up the paragraph that answers your question. You can now do all three by hand.

---

## 10 · The notation from this article

| You see | You say |
| --- | --- |
| `u · v` | "u dot v": multiply matching slots and add |
| `Σ uᵢvᵢ` | the same thing, written as a loop |
| `uᵀv` | the same thing again — papers' favourite way to write it (*Module 2 explains the ᵀ*) |
| `⟨u, v⟩` | the same thing once more, called the **inner product** in more formal texts |
| `θ` | the angle between two arrows |
| `cos(θ)` | "cosine theta": how aligned they are, from −1 to 1 |
| `(u · v) / (‖u‖‖v‖)` | cosine similarity |
| `u ⊥ v` | "u is perpendicular (orthogonal) to v": `u · v = 0` |
| `v · v = ‖v‖²` | a vector dotted with itself is its length squared |
| `((w · v) / (v · v)) v` | the projection of w onto v: w's shadow, as an arrow |

That table's first four rows are four notations for one operation. If a paper writes
`xᵀw`, `⟨x, w⟩` or `x · w`, it is multiplying matching slots and adding. Nothing more
exotic is happening.

---

## 11 · Confusions worth clearing up now

**"Is `u · v` the same as multiplying the vectors in code?"**
Usually not. In NumPy, `u * v` multiplies slot by slot and gives back a *vector*
(`[4, 3]` for our `(2,3)` and `(2,1)`). The dot product is `np.dot(u, v)` or `u @ v`,
and gives back one number (`7`). Confusing the two is one of the most common bugs in
beginner ML code — and since both run without errors, nothing warns you.

**"Does a cosine similarity of 0.9 mean 90% similar?"**
No. Cosine isn't a percentage, and it isn't evenly spread. A cosine of 0.9 means the
arrows are about 26° apart; 0.5 means 60° apart — not "half similar". Treat cosine
values as a ranking and a rough scale, not a percentage.

**"Does a cosine of 0 mean opposite?"**
No — opposite is −1. Zero means *unrelated*: at right angles, no shadow either way.
In practice, with many real embedding models, strongly negative cosines are uncommon,
and most of the action happens somewhere between 0 and 1.

**"What's the cosine similarity of the zero vector with something?"**
It doesn't exist. You'd be dividing by `‖0‖ = 0`, and an arrow of length zero has no
direction (Article 2) so it has no angle with anything. In code, this shows up as a
`NaN` ("not a number") in your results. An all-zero vector — an empty document, a
user with no history — has to be handled separately.

**"Isn't there another way to multiply vectors?"**
Yes: the **cross product**, which the source book mentions and deliberately skips.
It only works in three dimensions and returns a *vector* perpendicular to both inputs.
It's essential in physics and 3D graphics and almost absent from machine learning. You
can safely ignore it.

**"Is cosine similarity a distance?"**
Not quite: bigger means *closer*, the opposite of a distance. Libraries often offer
"cosine distance", defined as `1 − cos(θ)`, so that 0 means identical. It's useful,
but it doesn't obey all the rules of a true distance, so don't be surprised if a paper
is fussy about the name.

---

## 12 · Five things to carry forward

1. **The dot product multiplies matching slots and adds, returning one number.** It
   shows up as bills, grades, and every linear model: features dotted with weights.
2. **It has a second face: length × length × cos(θ).** Geometrically, it's the length
   of one arrow times the shadow of the other on it. The two faces agree because the
   axes are perpendicular and have length 1.
3. **Its sign is a verdict.** Positive: broadly the same way. Zero: perpendicular,
   nothing in common. Negative: broadly opposite. And zero is the universal test for
   **orthogonality**, in any dimension.
4. **Cosine similarity is the dot product with length divided out.** It lives between
   −1 and 1, and in high dimensions it's what "the angle between two vectors" *means*.
   Use it when only direction matters; use the raw dot product when length carries
   meaning.
5. **Projection splits any vector into a shadow and a perpendicular leftover.** Keep
   the shadows on a few good directions and drop the leftovers, and you have the idea
   behind compressing data — the destination of this series.

---

## Check yourself

1. Compute `(2, −1, 4) · (3, 5, 1)`.
2. Are `(3, −2, 5)` and `(4, 1, −2)` perpendicular? How do you know, without drawing?
3. **The book's version of the recommender.** Susan liked `a = (1, 3)`. The candidates
   are `b = (4, 2)` and `c = (2, 3)`. Compute both dot products, then both cosine
   similarities. Which film do you recommend?
4. Find the cosine similarity of `(1, 2)` and `(−2, −4)`. What does the answer tell you
   about these two arrows?
5. Why is `v · v` always equal to `‖v‖²`? Why does this mean `v · v` can never be
   negative?
6. Project `w = (4, 2)` onto `v = (1, 1)`. Find the shadow and the leftover, and check
   that the leftover is perpendicular to `v`.
7. You're building a search engine over news articles of wildly different lengths.
   Should you rank by dot product or by cosine similarity? Why?
8. A colleague says two word embeddings with cosine similarity 0.5 are "50% similar".
   What's a more accurate thing to say?

<details>
<summary>Answers</summary>

1. `(2 × 3) + (−1 × 5) + (4 × 1) = 6 − 5 + 4 = 5`.
2. Yes. `(3 × 4) + (−2 × 1) + (5 × −2) = 12 − 2 − 10 = 0`, and a zero dot product
   means a 90° angle, in any number of dimensions.
3. Dot products: `a · b = 4 + 6 = 10` and `a · c = 2 + 9 = 11`. Lengths: `‖a‖ = √10`,
   `‖b‖ = √20`, `‖c‖ = √13`. Cosines: `10 / √200 ≈ 0.707` (45° apart) and
   `11 / √130 ≈ 0.965` (about 15° apart). Recommend **c**. Here both methods agree —
   but notice how much more decisively cosine separates them (0.707 vs 0.965) than the
   raw dot products do (10 vs 11).
4. Dot product `−2 − 8 = −10`; lengths `√5` and `√20`, whose product is `√100 = 10`.
   So the cosine is `−10 / 10 = −1`. They point in **exactly opposite** directions —
   `(−2, −4)` is just `(1, 2)` scaled by −2 (Article 3: a negative scalar flips).
5. Because `v · v = v₁v₁ + v₂v₂ + … = v₁² + v₂² + …`, which is exactly the sum of
   squares inside the norm. Squares are never negative, so neither is their sum —
   an arrow's shadow on itself is the whole arrow, lying forwards.
6. `w · v = 4 + 2 = 6` and `v · v = 1 + 1 = 2`, so the projection is
   `(6/2) · (1, 1) = (3, 3)`. The leftover is `(4, 2) − (3, 3) = (1, −1)`. Check:
   `(1 × 1) + (−1 × 1) = 0`. ✓ So `(4, 2) = (3, 3) + (1, −1)`: a part along the
   diagonal, plus a part at right angles to it.
7. Cosine similarity. With raw dot products, long articles score higher just for
   containing more words — so a long, off-topic article can outrank a short, on-topic
   one (the cat-note example in §7). Dividing out the lengths compares what documents
   are *about*, not how long they are.
8. A cosine of 0.5 means the two arrows are 60° apart. That isn't "half similar" —
   and in a 300-dimensional embedding, where random directions sit near 0, a cosine of
   0.5 is actually quite a strong relationship.
</details>

---

### Next

**Module 2 begins — Article 5: Vector Spaces, Span and Basis.** Module 1 treated
vectors one or two at a time. Next we ask what a whole *collection* of vectors can do
together: which vectors can you build from a given set of ingredients (the **span**)?
When is an ingredient redundant, because the others can already make it (**linear
independence**)? And what's the smallest set of ingredients that builds everything —
the **basis** that Article 3 introduced, now given a proper footing. It's the ground
floor for matrices, and it's the precise version of the question PCA will eventually
answer: *which few directions does my data really need?*

---

*Built alongside Jorge Brasil, **Before Machine Learning, Volume 1 — Linear Algebra
for A.I.**, §3.3. The two definitions of the dot product, the projection-based
derivation, the `(2, 3) · (2, 1) = 7` check and the version of the recommender in
exercise 3 follow that book; the shadow picture, the proof via the basis, the loud-film
and search-engine comparisons, orthogonality, and the applications here are this
series' own.*
