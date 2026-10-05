# Vector Operations and Norms

### Module 1 · Article 3 — *Mathematical Foundations for AI, from zero*

> **The one sentence:**
> You can do exactly three things to vectors — **add** them, **stretch** them, and
> **measure** them — and between them those three moves build averages, recipes,
> directions, distances, and the fix for the units trap from Article 1.

**Before you start:** Articles 1 and 2. You need the two faces of a vector (a list
of numbers, and an arrow with a direction and a length), and the habit of reading
`v ∈ ℝⁿ` as *"v is a list of n ordinary numbers."*

**What you'll be able to do by the end:** add, subtract and scale vectors both as
lists and as arrows; build any vector out of simple pieces; compute `‖v‖` in any
number of dimensions; and explain — with numbers — why raw data has to be scaled
before a model can compare things fairly.

---

## 0 · Where we are, and what we owe

Article 2 told us what a vector *is*. It deliberately stopped before letting
vectors *do* anything. Three debts are now due:

1. **The golf ball.** A ball thrown east at 60 km/h from a car driving north at
   60 km/h flies north-east at 84.9 km/h. We asserted that. Now we show why.
2. **The symbol `‖v‖`.** It has appeared in both previous articles as "the length
   of v". Today it becomes a number you can compute.
3. **The grams trap.** In Article 1, recording weight in grams instead of
   kilograms flipped which student counted as "most similar". We promised norms
   would fix it. They will — but the fix is more interesting than a formula.

And one extra: Article 2 used the words **basis**, **linear combination**, and
**linear** and then refused to explain them. Those arrive here too, because once
you can add and stretch, you have everything they need.

A note on how to read this article: every operation is shown **twice** — once as
arithmetic on lists, once as a movement of arrows. Don't skip either. The whole
point, from Article 2, is to be able to flip.

---

## 1 · Adding vectors

### As lists: add the matching slots

```
   u  =  (2, 1)
   v  =  (1, 3)

   u + v  =  (2 + 1,  1 + 3)  =  (3, 4)
```

That's all. Slot 1 with slot 1, slot 2 with slot 2. In general:

```
   u + v  =  (u₁ + v₁,  u₂ + v₂,  …,  uₙ + vₙ)
```

The rule has one precondition, and it's the one Article 2 kept stressing: **both
vectors must have the same number of slots**, meaning the same things. You cannot
add `(height, weight)` to `(age, blood pressure, glucose)`. There is no slot 3 to
pair with, and even slots 1 and 2 would be adding centimetres to years.

### As arrows: tip to tail

Now flip to the other face. Adding is **doing one movement, then the other**:

> Walk along u. From wherever you end up, walk along v.
> The arrow from where you started to where you finished is u + v.

```
   y
   4 ┤         ● (3,4)
     │        ↗│
   3 ┤ u+v  ↗  │ v = (1,3)
     │    ↗    │   drawn starting at
   2 ┤  ↗      │   the tip of u
     │↗        │
   1 ┤    ↗  ● (2,1)
     │  ↗ u
   0 ●────┬────┬────┬──  x
     0    1    2    3
```

This is where Article 2's "a vector has no location" pays off. We were allowed to
pick up `v` and draw it starting from the tip of `u` — because it's the *same
vector* wherever it's drawn.

**Order doesn't matter.** Walk v first, then u, and you arrive at exactly the same
spot. Draw both routes and they form the two sides of a parallelogram, meeting at
the same far corner. In symbols, `u + v = v + u` — which you can also see directly
from the list rule, since `2 + 1 = 1 + 2`.

### Debt #1 paid: the golf ball

Put east in slot 1 and north in slot 2 (speeds in km/h):

```
   car   =  ( 0, 60)       the car carries the ball north
   throw =  (60,  0)       the boy throws it east

   ball  =  car + throw  =  (60, 60)
```

The ball's velocity is `(60, 60)`: sixty east *and* sixty north at the same time,
which is north-east. How fast? That's the length of the arrow, which we'll learn to
compute properly in §5 — but it's the Pythagorean theorem, so:

```
   speed  =  √(60² + 60²)  =  √7200  ≈  84.9 km/h
```

The ball goes faster than either the car or the throw, in a direction neither of
them had. Adding vectors *combined two causes into one effect*. That is precisely
what addition means in physics, and it means the same in machine learning.

### More examples, to make it ordinary

**A delivery rider's trip.** Leg 1: 3 km east, 1 km north. Leg 2: 1 km east,
4 km north.

```
   leg₁ + leg₂  =  (3, 1) + (1, 4)  =  (4, 5)
```

The rider ends up 4 km east and 5 km north of the restaurant, whatever route they
took between. (Hold on to this one — it comes back in §5.)

**Your breakfast, as nutrition.** Make every food a vector of
`(calories, protein in g, sugar in g)` — approximate values:

```
   egg     =  ( 80,  6,  0)
   toast   =  ( 80,  3,  1)
   banana  =  (105,  1, 14)

   egg + toast + banana  =  (265, 10, 15)
```

The total nutrition of a meal is the **sum of the vectors** of its foods. You've
done this on a food-label app without ever calling it vector addition.

**A sentence, from words.** One of the simplest ways to turn a sentence into a
vector is to add up the vectors of its words (and divide by how many — see §4). It
throws away word order, so it is crude, but it works surprisingly well for tasks
like "is this review positive or negative?" And it only works because addition of
arrows *combines meanings*: the sentence lands somewhere between its words.

---

## 2 · Subtracting vectors

### As lists: subtract the matching slots

```
   u − v  =  (u₁ − v₁,  u₂ − v₂,  …,  uₙ − vₙ)
```

### As arrows: the arrow *from* v *to* u

This is the more useful reading, and you've already used it twice.

> **u − v is the arrow that starts at the tip of v and ends at the tip of u.**
> It answers: *"how do I get from v to u?"*

In Article 2, finding which vector an arrow represented was "end minus start".
That was subtraction. And `king − man` was the arrow from *man* to *king* — the
"make it royal" direction. Also subtraction.

Check it with the rule: if `u − v` really is the trip from v to u, then starting
at v and taking that trip should land you on u. It does:

```
   v + (u − v)  =  u          ✓
```

### Example: what changed?

Subtraction is how you measure change. Your monthly spending, in taka, as
`(food, transport, entertainment)`:

```
   August     =  (12000, 3000, 2500)
   September  =  (11000, 4500, 1000)

   September − August  =  (−1000, +1500, −1500)
```

One vector tells the whole story: food down a thousand, transport up fifteen
hundred (new office?), entertainment down fifteen hundred. Signs carry meaning —
negative is "less than before", positive is "more".

In machine learning, subtraction appears everywhere something is compared to
something else: prediction minus truth (the **error**, from Article 1's knob-turning),
this frame of video minus the last (what moved?), a patient today minus the same
patient last year (what's getting worse?).

---

## 3 · Scaling a vector

The second operation multiplies a vector by a single ordinary number — a
**scalar**, traditionally written with the Greek letter `λ` (lambda).

### As lists: multiply every slot by the same number

```
   λv  =  (λ·v₁,  λ·v₂,  …,  λ·vₙ)
```

For example:

```
   3 · (1, 2)   =  (3, 6)
   0.5 · (4, 6) =  (2, 3)
  −1 · (2, 5)   =  (−2, −5)
```

### As arrows: stretch, shrink, or flip — but stay on the same line

Scaling never bends a vector off its line. It only changes how far along that line
it reaches, and possibly which way it faces. There are exactly five cases:

| λ | What happens to the arrow | Example with v = (1, 2) |
| --- | --- | --- |
| λ > 1 | same direction, **longer** | 3v = (3, 6) |
| 0 < λ < 1 | same direction, **shorter** | 0.5v = (0.5, 1) |
| λ = 0 | collapses to the zero vector | 0v = (0, 0) |
| −1 < λ < 0 | **flipped**, shorter | −0.5v = (−0.5, −1) |
| λ < −1 | **flipped**, longer | −2v = (−2, −4) |

```
                          ● 3v (3,6)
                        ╱
                      ╱
                    ╱
                  ● v (1,2)
                ╱
              ● 0.5v
            ╱
  ────────●────────        all of them live on
        ╱ origin           ONE straight line
      ╱                    through the origin
    ● −2v (−2,−4)
```

The word "scalar" comes from exactly this: it's the thing that **scales**.

Subtraction, by the way, isn't really a separate operation. It's "flip, then add":

```
   u − v  =  u + (−1)·v
```

So we really only have **two** operations for moving vectors around: add, and
scale. Keep that count in mind — it matters in §4.

### Examples of scaling

**A recipe.** A cake for 4 people, as `(flour in g, sugar in g, eggs)`:

```
   cake₄  =  (200, 100, 2)

   for 6 people:   1.5 · cake₄  =  (300, 150, 3)
   for 2 people:   0.5 · cake₄  =  (100,  50, 1)
```

Scaling keeps the *proportions* — the direction — and changes only the amount.
That's why the cake still tastes like the same cake. If you doubled the flour and
not the sugar, you'd have changed the direction, and you'd have a different cake.

**Two eggs.** From the breakfast example: `2 · egg = (160, 12, 0)`.

**A learning step.** In Article 1, learning meant nudging knobs. Article 2 said
all the knobs together form one vector, and "which way to turn them" is another
vector the same shape. The size of the nudge is a scalar called the **learning
rate**:

```
   new knobs  =  old knobs  −  (learning rate) · (direction to improve)
```

One subtraction, one scaling. That line — with a billion slots in each vector — is
the heart of how every modern neural network is trained. You can now read every
symbol in it except where the "direction to improve" comes from.

### A clue about the grams trap, hiding in plain sight

Converting kilograms to grams multiplies by 1000. That sounds like scaling. So why
did it wreck our comparison in Article 1, when scaling "keeps the direction"?

Because we didn't scale the **vector**. We scaled **one slot**.

```
   scaling the whole vector by 1000:    (172, 68)  →  (172000, 68000)
   converting only weight to grams:     (172, 68)  →  (172,    68000)
```

Scale *every* slot by 1000 and every distance grows by exactly 1000 — so every
comparison stays the same. (Our A-to-B and A-to-C distances would become 18,028 and
10,050: C still wins.) But stretch *only one axis*, and you've distorted the
space: directions tilt, and the stretched axis dominates every distance. That's
not scaling a vector. That's warping the map. Remember this distinction; §8 uses it.

---

## 4 · Putting the two together

Two operations, add and scale. Here is how much you can build with just those.

### The average

The average of several vectors is: **add them all up, then scale by 1/n.**

Take the three students from Article 1:

```
   Rina   =  (168, 55)
   Karim  =  (172, 68)
   Nadia  =  (159, 51)

   sum      =  (168+172+159,  55+68+51)  =  (499, 174)
   average  =  (1/3) · (499, 174)       ≈  (166.3, 58)
```

The **average student** is 166.3 cm and 58 kg. As a point, it sits right in the
middle of the three — the balance point of the cloud. It's called the **centroid**.

This one small idea powers a surprising amount of machine learning. A popular
clustering method, *k-means*, is almost nothing but this: guess some group
centres, assign every point to its nearest centre, recompute each centre as the
average of its points, repeat. "The average customer in each segment" is a vector
average. So is "the typical face" and "the typical spam email".

### Linear combinations: recipes for vectors

Go back to breakfast. Two eggs, one toast, one banana:

```
   2 · egg + 1 · toast + 1 · banana
     =  2·(80, 6, 0) + (80, 3, 1) + (105, 1, 14)
     =  (160, 12, 0) + (80, 3, 1) + (105, 1, 14)
     =  (345, 16, 15)
```

Scale each ingredient by its portion, then add. That pattern — **some amount of
this, plus some amount of that, plus some amount of the other** — is called a
**linear combination**:

```
   λ₁·v₁  +  λ₂·v₂  +  …  +  λₖ·vₖ
```

The `λ`s are the amounts (the portions); the `v`s are the ingredients. It is the
single most common shape of expression in all of linear algebra. Once you learn to
see it, you'll find it in nearly every formula for the rest of your life.

(A small notation warning: here `v₁, v₂` are *different vectors*, numbered —
not slots of one vector. Context tells you which. Papers use this double meaning
constantly; it is the most common reason a formula "looks wrong" to a beginner.)

### The basis: why the list of numbers *is* the arrow

Now the promise from Article 2. There, we said: in `v = (2, 3)`, the numbers are
instructions — *2 steps along axis one, 3 steps along axis two*. Here's that
sentence written as mathematics.

Name the two single steps:

```
   e₁  =  (1, 0)       one step along axis one
   e₂  =  (0, 1)       one step along axis two
```

Then:

```
   (2, 3)  =  2·(1, 0) + 3·(0, 1)  =  2·e₁ + 3·e₂
```

**Every vector is a linear combination of the single-step arrows, and its
components are exactly the amounts.** That's what the numbers in a vector *are*:
the recipe quantities, with the axes as the ingredients. The two faces of a vector
from Article 2 — list and arrow — are connected by exactly this equation.

That set of single-step arrows `e₁, e₂, …, eₙ` is called the **standard basis**.
"Basis" means *a set of ingredients from which you can build every vector, each in
exactly one way.*

And here's the thought that eventually leads to the destination of this series:
**the standard basis isn't the only possible set of ingredients.** You could
describe every point on a map with "steps east" and "steps north" — or with "steps
along the main road" and "steps along the cross street", if the city is tilted.
Choosing a *better* basis for your data — ingredients that fit the shape of the
cloud — is exactly what PCA does. For now, just enjoy that the idea is simple:
*different ingredients, same dishes.*

### What "linear" actually means

Article 2 asked, "what's linear about linear algebra?" Now there's an answer.

**Linear algebra is the mathematics of what you can do with only two moves: adding
and scaling.** That's the whole restriction. Both moves keep straight lines
straight — scaling slides along a line, adding shifts lines without bending them.
Nothing you build from them can curve.

That restriction is a gift and a limitation:

- **The gift:** these operations are simple enough that a computer can do billions
  of them per second, and predictable enough that we can prove things about them.
  Every GPU on earth is, at heart, a machine for doing linear combinations fast.
- **The limitation:** a model built *only* from adding and scaling can only ever
  draw straight lines through data. Real data curves. How neural networks escape
  this limitation — with one small bend between the straight parts — is a story for
  a later module, and it is a good one.

---

## 5 · Measuring a vector: the norm

Debt #2. The length of a vector has a name — its **norm** — and a symbol with
double bars:

```
   ‖v‖        read: "the norm of v", or just "the length of v"
```

### In two dimensions: Pythagoras, again

Take `v = (3, 4)`. The arrow goes 3 across and 4 up. Those two movements and the
arrow itself form a right-angled triangle — and the arrow is the long side.

```
   y
   4 ┤         ●
     │       ╱ │
   3 ┤     ╱   │
     │ ‖v‖     │ 4
   2 ┤ ╱       │
     │╱        │
   1 ┤         │
     │    3    │
   0 ●─────────┘──  x
```

The Pythagorean theorem says the long side squared equals the other two squared
and added:

```
   ‖v‖²  =  3² + 4²  =  9 + 16  =  25
   ‖v‖   =  √25     =  5
```

In general, for any two-slot vector:

```
   ‖v‖  =  √( v₁² + v₂² )
```

### In three dimensions: the same trick, twice

Now `v = (3, 4, 12)` — picture a box-shaped room 3 m wide, 4 m deep and 12 m tall,
and the arrow is the diagonal from one bottom corner to the opposite top corner.

**Step 1 — across the floor.** The floor is a flat 3 × 4 rectangle, so its diagonal
is the 2D problem we just solved: **5**.

**Step 2 — up to the ceiling.** Now stand at the far end of that floor diagonal and
look up. The floor diagonal (5) and the height (12) form a *new* right-angled
triangle, whose long side is the full room diagonal:

```
   ‖v‖  =  √(5² + 12²)  =  √(25 + 144)  =  √169  =  13
```

But 5² was just 3² + 4², so we could have written it in one go:

```
   ‖v‖  =  √(3² + 4² + 12²)  =  13
```

**That's the whole reason the formula extends to any dimension.** Every new slot
adds one more right-angled triangle, stacked on the result of the last. You never
need to see the fourth dimension; you only need to believe that adding one more
slot works the same way as adding the third did. So:

```
   ‖v‖  =  √( v₁² + v₂² + … + vₙ² )

                 ⎡  n     ⎤
        =   √    ⎢  Σ  vᵢ² ⎥
                 ⎣ i=1    ⎦
```

Read the Σ version out loud: *"square every slot, add them all up, take the square
root."* This is called the **Euclidean norm**, or the **L2 norm** — the ordinary,
straight-line, ruler length.

### You've already computed norms

Remember the distance formula from Article 1 and the five-slot patient example from
Article 2? Look at what we did there: subtract the two vectors, then *square every
slot, add, take the square root*. That's the norm — of the difference.

> **The distance between two vectors is the length of the arrow between them:**
>
> ```
>    distance(a, b)  =  ‖a − b‖
> ```

Two ideas from two different articles — "how far apart are these?" and "how long
is this arrow?" — turn out to be the same idea. `a − b` is the trip from b to a
(§2); `‖ ‖` measures the trip. In Article 2, patient p to patient q came out as
3.6: that was `‖p − q‖`.

### Three rules every norm obeys

These look fussy, but each is common sense, and together they are what the word
"length" *means*:

**1. Length is never negative, and only "nowhere" has length zero.**
`‖v‖ ≥ 0`, and `‖v‖ = 0` only for the zero vector. Squares are never negative, so
the sum of squares can only be zero if every slot is zero.

**2. Stretch an arrow and its length stretches by the same amount. Flipping doesn't
change length.** `‖λv‖ = |λ| · ‖v‖`, where `|λ|` means λ with its minus sign
dropped. Check it: `‖(1, 2)‖ = √5 ≈ 2.24`, and `‖−2·(1, 2)‖ = ‖(−2, −4)‖ = √20 ≈ 4.47`
— exactly twice as long, pointing the other way.

**3. A detour is never shorter than going straight.** `‖u + v‖ ≤ ‖u‖ + ‖v‖`. This
is called the **triangle inequality**. The delivery rider from §1:

```
   distance ridden   =  ‖(3,1)‖ + ‖(1,4)‖  ≈  3.16 + 4.12  =  7.29 km
   distance from start  =  ‖(4,5)‖         ≈  6.40 km
```

They rode 7.29 km to end up 6.40 km away. The golf ball too: 60 + 60 = 120 km/h
worth of pushing, but only 84.9 km/h of actual speed, because the two pushes weren't
in the same direction. The only time the detour equals the straight line is when
both legs point exactly the same way.

---

## 6 · There's more than one way to measure length

Here's a question that sounds silly and isn't: *how far is it?*

You're standing on a street corner in a city laid out in a neat grid. The café is
**3 blocks east and 4 blocks north**. How far away is it?

- **As the crow flies:** 5 blocks. That's the Euclidean norm, `√(3² + 4²)`.
- **As you walk:** 7 blocks. You can't cut through buildings; you go 3 along and 4
  up, and the distance is `|3| + |4|`.
- **As a chess king moves** (one step in any direction, diagonals allowed): 4 moves.
  Go diagonally 3 times, then straight once. The distance is the *largest* single
  slot, `max(|3|, |4|)`.

All three are legitimate, and all three obey the three rules of §5. They are three
different **norms**:

| Name | Also called | Formula | For (3, 4) | Think of |
| --- | --- | --- | --- | --- |
| **L2** | Euclidean | `√(v₁² + v₂² + … + vₙ²)` | 5 | a ruler; a crow |
| **L1** | Manhattan, taxicab | `|v₁| + |v₂| + … + |vₙ|` | 7 | walking a street grid |
| **L∞** | max, Chebyshev | the largest `|vᵢ|` | 4 | a chess king; the worst slot |

The subscript says which one: `‖v‖₂`, `‖v‖₁`, `‖v‖∞`. When a book writes plain
`‖v‖` with no subscript, it means **L2**.

A nice way to see how they differ: draw every point that is exactly **1** away from
the origin under each norm. For L2 that's a circle — obviously. The others are not:

```
      L2: a circle            L1: a diamond            L∞: a square

         · · ·                      ·                  · · · · ·
      ·         ·                ·     ·               ·       ·
     ·     ●     ·             ·    ●    ·             ·   ●   ·
      ·         ·                ·     ·               ·       ·
         · · ·                      ·                  · · · · ·
```

Same idea of "distance 1", three different shapes. Which norm you pick changes
which points count as "close" — and that means it changes your model's behaviour.

### When would you use anything but L2?

Mostly you won't; L2 is the default, and it's right for most geometry. But the
others earn their keep:

- **L1** is less dominated by one big difference, because it doesn't square
  anything. Two houses that differ by 1 in each of ten features have L1 distance 10;
  two that differ by 10 in one feature also have L1 distance 10. Under L2 the second
  pair would look much further apart (10 versus about 3.2). If one wild value
  shouldn't dominate, L1 is fairer.
- **L1 and L2 as penalties.** When training a model, it's common to add the norm of
  the knob-vector to the loss from Article 1, to discourage huge knob settings.
  Penalising with L2 (called *ridge* or *weight decay*) keeps all knobs small.
  Penalising with L1 (called *lasso*) tends to push many knobs to exactly zero —
  switching features off entirely, which can be handy when you have far more
  features than you need. The diamond's sharp corners, sitting right on the axes,
  are the geometric reason for that.
- **L∞** measures the *worst single slot*. "No pixel in this image was changed by
  more than 2%" is an L∞ statement, and it's exactly how researchers define a
  "small" tampering of an image when testing whether a model can be fooled.

---

## 7 · Unit vectors: keeping the direction, discarding the length

Sometimes you care about which way a vector points, and its length is just in the
way. So: remove it.

**Divide a vector by its own length**, and you get an arrow pointing the same way
with length exactly 1. It's called the **unit vector** in that direction, written
with a little hat:

```
                v
   v̂   =   ─────
              ‖v‖
```

Read it as *"v-hat equals v divided by its length"*. Take `v = (3, 4)`, whose length
is 5:

```
   v̂  =  (3/5, 4/5)  =  (0.6, 0.8)

   check:  ‖v̂‖  =  √(0.6² + 0.8²)  =  √(0.36 + 0.64)  =  √1  =  1   ✓
```

Dividing by 5 is just scaling by `λ = 1/5` — so by §3, `v̂` sits on the same line as
`v`, facing the same way. We've kept the direction and set the length to 1. This is
called **normalising** the vector.

Every direction has exactly one unit vector. So a unit vector is a pure
*direction*, with the magnitude stripped out. Think of it as a compass bearing
with no distance attached. (The standard basis arrows `e₁ = (1, 0)` and
`e₂ = (0, 1)` from §4 are unit vectors — that's why they make good ingredients.)

### Why you'd want to: the "loud film" problem

Remember the exercise in Article 1. Susan's friend loves comedy:

```
   friend  =  (2, 5)        (drama, comedy)
   a       =  (5, 2)        a drama
   b       =  (1, 4)        a comedy
```

Multiplying matching slots and adding gave **20** for the drama and **22** for the
comedy — a near tie, for a comedy fan choosing between a drama and a comedy. We
blamed "loudness": film `a` has big numbers overall, so it scores well against
everything. Now we can say exactly what that means. It's a *longer arrow*:

```
   ‖a‖  =  √(25 + 4)   =  √29  ≈  5.39
   ‖b‖  =  √(1 + 16)   =  √17  ≈  4.12
```

Normalise both films so they have length 1, and they compete on direction alone:

```
   â  ≈  (0.928, 0.371)
   b̂  ≈  (0.243, 0.970)
```

Redo the same multiply-and-add against the friend's taste:

```
   against â :  (2 × 0.928) + (5 × 0.371)  ≈  3.71
   against b̂ :  (2 × 0.243) + (5 × 0.970)  ≈  5.34
```

The near-tie is gone. With length out of the way, the comedy clearly wins, as it
should. Normalise the friend's vector too and you arrive at **cosine similarity** —
the formula from the top of Article 1 — which is where Article 4 finishes.

---

## 8 · Debt #3: fixing the grams trap

Here's the problem from Article 1, one more time:

```
   A  =  (172, 68)
   B  =  (190, 69)      much taller, about the same weight
   C  =  (173, 78)      about the same height, much heavier

   in kg:     A→B  ≈  18.0    A→C  ≈  10.0      C is closer
   in grams:  A→B  ≈  1000.2  A→C  ≈  10000.0   B is closer
```

### The diagnosis

Distance is `‖A − B‖`: square every slot of the difference, add, root. And that
formula **treats every slot as equally important** — one unit in slot 1 counts
exactly as much as one unit in slot 2.

But "one unit" was our choice. Is 1 cm of height as significant as 1 kg of weight?
As 1 gram? Nobody asked — the formula just assumed yes. So the distance wasn't only
measuring the students; it was also measuring **our choice of units**. Change the
units and you change the answer, without changing the people. And as §3 showed,
converting kg to grams is not scaling the vector; it's stretching *one axis* by a
thousand, which lets that one feature shout over the others.

### The idea of the fix

Stop measuring each feature in its own arbitrary unit. Measure it in a unit that
comes from the data itself:

> **How big is this difference, compared with how much this feature normally
> varies?**

A 10 kg gap between two people is big if most people's weights sit within a few
kilos of each other, and small if weights vary wildly. So we need, for each
feature, a number meaning *"a typical difference, for this feature, among these
people"*. That number is the **standard deviation** — and it's a norm.

### The spread of a feature is a norm

Suppose we have measurements from a sample of five students at the school:

```
   heights  =  (155, 165, 170, 175, 185)      average 170 cm
   weights  =  ( 52,  64,  70,  76,  88)      average  70 kg
```

Notice something new: these vectors aren't one *student* with several features.
Each is one *feature* across several students — a **column** of the data table,
rather than a row. Same mathematics, different slice of the table. (Hold that
thought; it is the doorway to matrices in Module 2.)

For each feature: subtract the average from every value, measure the length of what's
left, and divide by `√n` so that having more students doesn't make it bigger.

```
   heights − 170  =  (−15, −5, 0, 5, 15)
   ‖ that ‖        =  √(225 + 25 + 0 + 25 + 225)  =  √500  ≈  22.36
   spread          =  22.36 / √5                         =  10 cm

   weights − 70   =  (−18, −6, 0, 6, 18)
   ‖ that ‖        =  √(324 + 36 + 0 + 36 + 324)  =  √720  ≈  26.83
   spread          =  26.83 / √5                         =  12 kg
```

A typical height difference is about 10 cm; a typical weight difference is about
12 kg. Those are our new yardsticks.

### Measure in yardsticks, then compare

Divide every difference by its feature's yardstick, and only then take the norm:

```
   A → B :  height  18 cm ÷ 10 cm  =  1.8
            weight   1 kg ÷ 12 kg  ≈  0.08
            distance  √(1.8² + 0.08²)   ≈  1.80

   A → C :  height   1 cm ÷ 10 cm  =  0.1
            weight  10 kg ÷ 12 kg  ≈  0.83
            distance  √(0.1² + 0.83²)   ≈  0.84
```

C is closer. Now do it **in grams**. Every weight gets multiplied by 1000, so every
weight deviation does too, and by rule 2 of §5 their norm grows by 1000 as well —
the yardstick becomes **12,000 g**:

```
   A → B :  weight   1000 g ÷ 12000 g  ≈  0.08       distance  ≈  1.80
   A → C :  weight  10000 g ÷ 12000 g  ≈  0.83       distance  ≈  0.84
```

**Identical.** Kilograms, grams, pounds, tonnes — the answer is the same, because
*grams divided by grams has no units left*. The arbitrary choice has cancelled out
of the calculation. That's the fix, and that is the promise from Article 1 kept.

In practice the average is subtracted too, so every feature is centred on zero:

```
                  value − average
   scaled  =   ────────────────────
                    spread
```

This is called **standardisation**, and the result is a **z-score**: *"how many
typical differences above or below average is this?"* In the Python library
scikit-learn it's a one-liner called `StandardScaler`, and it is among the first
things done to data before training most models. You now know exactly what it does
and why.

### An honest note: this doesn't discover the "true" answer

It's tempting to conclude that scaling *reveals* that C is really more similar to A.
It doesn't. It replaces an arbitrary yardstick (whatever unit you happened to type)
with a principled one (how much this feature varies among these people).

That principled yardstick depends on the data. If this school's weights only varied
by about 5 kg, then a 10 kg gap would be *two* typical differences — a lot — and the
same calculation would give A→B ≈ 1.81 and A→C ≈ 2.00, and B would win. That's not
a bug. The data is telling you "in this population, a 10 kg difference is unusual."

And sometimes you know better than the data. A doctor might decide a weight
difference matters more for a diagnosis than a height difference, and weight the
features accordingly. Scaling is a **modelling decision** — the point is that it's
now a *visible* decision, made on purpose, rather than an accident of units.

### Two "normalisations" — don't mix them up

Libraries use the word "normalise" for both §7 and §8. They are different
operations for different problems:

| | Normalising a vector (§7) | Scaling features (§8) |
| --- | --- | --- |
| Acts on | one **row** — one thing | one **column** — one feature |
| Divides by | that vector's own length | that feature's spread |
| Removes | loudness, overall size | arbitrary units |
| Afterwards | every vector has length 1 | every feature has a similar range |
| Used for | comparing directions (cosine) | fair distances; most models |

When someone says "did you normalise the data?", it's worth asking which one.

---

## 9 · The notation from this article

| You see | You say |
| --- | --- |
| `u + v` | "add u and v, slot by slot" — or "u, then v" |
| `u − v` | "the arrow from v to u" |
| `λv` | "v stretched by lambda" |
| `λ₁v₁ + λ₂v₂ + … + λₖvₖ` | "a linear combination: some of each ingredient" |
| `e₁, e₂, …, eₙ` | "the standard basis: one step along each axis" |
| `‖v‖` or `‖v‖₂` | "the (Euclidean) length of v" |
| `‖v‖₁` | "the Manhattan length: add up the sizes of the slots" |
| `‖v‖∞` | "the largest slot, ignoring sign" |
| `‖a − b‖` | "the distance between a and b" |
| `v̂` | "v-hat: the unit vector pointing the same way as v" |
| `|λ|` | "lambda without its minus sign" (absolute value) |

---

## 10 · Confusions worth clearing up now

**"Isn't the length just the components added up?"**
That's the L1 norm, and only if you ignore the signs. The ordinary length (L2)
squares first. For `(3, 4)`, adding gives 7; the actual ruler length is 5.

**"Squaring and then square-rooting — isn't that pointless?"**
No. The squaring makes every contribution positive and matches Pythagoras; the root
at the end brings the answer back to the original units (centimetres, not square
centimetres). You'll often see ML code skip the root and use `‖v‖²` directly. It's
cheaper, and since a bigger length always has a bigger square, comparisons come out
the same.

**"Why double bars, ‖v‖, and not single bars like |−3|?"**
Single bars are absolute value for ordinary numbers — size, ignoring sign. Double
bars signal "this is a vector". Same idea, bigger object. Some books use single bars
for vectors too; context tells you.

**"Does normalising lose information?"**
Yes — the length, completely. Whether that's acceptable depends on the question.
For "what *kind* of film is this?", length is noise and dropping it helps. For "how
much did this customer spend?", length is the whole answer and dropping it would be
a disaster.

**"Can I multiply two vectors together?"**
Slot by slot, yes — code libraries do it all the time. But that gives you another
vector with no clean geometric meaning. The genuinely useful way to "multiply" two
vectors gives back a *single number* that says how much they agree. That's the dot
product, and it's next.

---

## 11 · Five things to carry forward

1. **There are only two moves: add and scale.** Adding is tip-to-tail ("this, then
   that"); scaling stretches, shrinks, or flips along the same line. Subtraction is
   flip-then-add, and `u − v` is the arrow from v to u.
2. **Linear combinations are recipes.** Some of each ingredient, added up. Every
   vector is a recipe over the standard basis, and its components are the amounts.
   "Linear" means: built from only these two moves — straight lines stay straight.
3. **The norm is length, via Pythagoras**, extended one triangle at a time into any
   number of dimensions: square every slot, add, take the root. And
   `distance(a, b) = ‖a − b‖`.
4. **Length is a choice.** L2 is the crow, L1 is the walk, L∞ is the worst slot.
   Each changes what counts as "close".
5. **Two kinds of normalising.** Divide a *vector* by its length to keep only its
   direction. Divide a *feature* by its spread to cancel out arbitrary units — the fix
   for the grams trap.

---

## Check yourself

1. Compute `(4, −1) + (−2, 3)`. Describe what you did in terms of arrows.
2. You're at point `(1, 2)` and want to get to `(7, 10)`. What vector is the trip,
   and how long is it?
3. Find `‖(2, 3, 6)‖`.
4. Normalise `(5, 12)`. Check that your answer has length 1.
5. For `v = (−6, 8)`, find `‖v‖₁`, `‖v‖₂` and `‖v‖∞`.
6. Converting *every* feature to a unit 1000 times smaller changes no comparisons.
   Converting *only weight* to grams changes them. Why the difference?
7. After standardising, why does it no longer matter whether weight was recorded in
   kilograms or grams?

<details>
<summary>Answers</summary>

1. `(4 + (−2), −1 + 3) = (2, 2)`. As arrows: walk along `(4, −1)` — four right, one
   down — then, from where you land, walk along `(−2, 3)` — two left, three up. You
   end up at `(2, 2)`, and the arrow from the start to there is the sum.
2. The trip is end minus start: `(7 − 1, 10 − 2) = (6, 8)`. Its length is
   `√(36 + 64) = √100 = 10`.
3. `√(4 + 9 + 36) = √49 = 7`.
4. `‖(5, 12)‖ = √(25 + 144) = √169 = 13`, so the unit vector is
   `(5/13, 12/13) ≈ (0.385, 0.923)`. Check: `(5/13)² + (12/13)² = (25 + 144)/169 = 1`. ✓
5. `‖v‖₁ = 6 + 8 = 14`; `‖v‖₂ = √(36 + 64) = 10`; `‖v‖∞ = max(6, 8) = 8`.
   (Notice L∞ ≤ L2 ≤ L1. That ordering always holds.)
6. Changing every slot by the same factor is scaling the whole difference vector, so
   every distance is multiplied by the same amount (rule 2) and every ranking is
   preserved. Changing one slot only stretches a single axis: the distorted feature
   now contributes far more to every distance than the others do.
7. Because each difference is divided by that feature's own spread, measured in the
   same unit. Grams ÷ grams and kilograms ÷ kilograms both leave a plain number, and
   it's the same number. The unit cancels out before the norm is ever taken.
</details>

---

### Next

**Article 4 — The Dot Product and Similarity.** We finally multiply two vectors the
useful way — getting back one number that says *how much do these two agree?* We'll
see why "multiply matching slots and add" is secretly a statement about the angle
between two arrows, use it to finish the movie recommender properly, and put the last
piece in place: the formula from the first page of Article 1, `cos(θ) = (u · v) /
(‖u‖ · ‖v‖)`, which you can now almost read — the bottom half is this article.

---

*Built alongside Jorge Brasil, **Before Machine Learning, Volume 1 — Linear Algebra
for A.I.** The treatment of addition, scalar multiplication and the derivation of the
Euclidean norm follow that book; the worked examples, the alternative norms, and the
feature-scaling resolution of Article 1's units problem are this series' own.*
