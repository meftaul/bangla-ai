# Vector Spaces, Span and Basis

### Module 2 · Article 5 — *Mathematical Foundations for AI, from zero*

> **The one sentence:**
> A handful of vectors is a set of **ingredients**; everything you can cook from
> them is their **span**; and when the ingredients are non-redundant and cook the
> whole space, they are a **basis** — a choice of perspective, which you are allowed
> to change.

**Before you start:** Module 1 (Articles 1–4). You need linear combinations
(Article 3, §4), the standard basis `e₁, e₂`, and the idea that a vector has no
location. Nothing from Article 4 is strictly required, though §6 leans on
orthogonality.

**What you'll be able to do by the end:** say what a set of vectors can and cannot
build; test whether one of them is redundant; check whether a set is a basis;
re-express the same vector in a different basis by hand; and explain why "choosing
good features" and "choosing a basis" are the same act.

---

## 0 · Where we are

Module 1 looked at vectors one or two at a time: what one is, how to measure it, how
to compare two of them. Module 2 is about **many vectors at once** — collections,
tables, whole datasets — and the object that handles them, the matrix.

But matrices are unreadable until you have the language this article builds. So
before any matrix appears, one question:

> **Given a few vectors, what can you build out of them — and what can't you?**

Three debts come due here, all of them promises from earlier articles.

- **Article 3** introduced the **basis** and the **linear combination**, then said
  "both arrive properly in a later article". This is that article.
- **Article 3** also dangled the sentence that this whole series is walking towards:
  *"the standard basis isn't the only possible set of ingredients… choosing a better
  basis for your data is exactly what PCA does."* Today we do a change of basis by
  hand, on a real example, and see the data mean something different afterwards.
- **Article 4** showed that a vector's components are its **shadows** on the axes,
  and hinted that if you swapped the axes for different directions, the coordinates
  would change with them. Today the axes actually move.

One warning before we start. This article has more definitions per page than any
other in the series. That's because it is the vocabulary chapter — the words
**span**, **linearly independent**, **basis**, **dimension** and **subspace** are
used constantly in papers and library documentation, usually without explanation.
Every one of them is a plain idea underneath. Take them one at a time.

---

## 1 · What can you build? The span

Start with one vector and the only two moves you have (Article 3): **add** and
**scale**.

### One ingredient gives you a line

Take `v = (1, 1)`. What can you make using nothing but scaling?

```
   2·v   =  (2, 2)
   0.5·v =  (0.5, 0.5)
   0·v   =  (0, 0)
   −3·v  =  (−3, −3)
```

Every result has the same first and second slot, so every result lands on the
diagonal line through the origin. Nothing you do with one vector can get you off
that line:

```
   y
   3 ┤              ╱
   2 ┤        ● 2v╱
     │          ╱
   1 ┤      ● v
     │    ╱
   0 ●──╱─────┬─────┬──  x
     │╱  1     2     3
  −1 ┤
```

That line — **everything reachable from `v`** — is called the **span** of `v`.

### Two ingredients usually give you the plane

Now take the standard basis, `i = (1, 0)` and `j = (0, 1)` (the book's names for
`e₁` and `e₂`; both spellings are common, and this article uses the book's).

Scale each and add: `α·(1, 0) + β·(0, 1) = (α, β)`. Choose `α` and `β` freely and you
can land on **any point in the plane**. So the span of `{i, j}` is all of `ℝ²`.

That is exactly the picture Article 3 drew when it said "the components are the
amounts in a recipe":

```
   v  =  (2, 3)  =  2·(1, 0)  +  3·(0, 1)  =  2i + 3j
```

```
   y
   3 ┤          ↗ ● v = (2,3)
     │       ↗
   2 ┤    ↗            j = (0,1) stretched 3 times
     │ ↗               i = (1,0) stretched 2 times
   1 ┤↑ j
     │
   0 ●──→──┬─────┬──  x
     │  i  1     2
```

### But two ingredients don't *always* give you the plane

Here's the book's cautionary pair:

```
   w  =  (1, 1)
   z  =  (2, 2)
```

Two vectors — but `z` is just `2w`. Every combination collapses:

```
   α·(1, 1) + β·(2, 2)  =  (α + 2β,  α + 2β)
```

Both slots are always the same number. So no matter what `α` and `β` you pick, you
land on the line `y = x` again. **Two ingredients, and you still only have a line.**

```
   y
   4 ┤                   ╱
   3 ┤                 ╱     every combination of w and z
   2 ┤        ● z   ╱        lands somewhere on this line
     │           ╱           — and nowhere else
   1 ┤   ● w  ╱
     │     ╱
   0 ●───╱───┬─────┬─────┬──  x
     │ ╱     1     2     3
```

Try to reach `(3, 5)` with them:

```
   α + 2β  =  3        (first slot)
   α + 2β  =  5        (second slot)
```

The same quantity cannot be 3 and 5 at once. **`(3, 5)` is unreachable.** The second
ingredient added nothing that the first didn't already provide.

### The definition

> **Definition — span.**
> The **span** of a set of vectors is the collection of *every* vector you can build
> from them by scaling and adding — every linear combination.

```
   span{v}           =  a line through the origin (if v isn't the zero vector)
   span{i, j}        =  the whole plane, ℝ²
   span{w, z}        =  a line, because z was a copy of w in disguise
   span{(1,0,0), (0,1,0)}  =  a flat plane inside 3D space — the floor
```

Two things to notice, and they'll both matter later.

**The span always contains the origin.** Set every scalar to zero and you get the
zero vector. So a span is never a line that misses the origin; it's always *through*
it.

**The span is the honest measure of what your ingredients are worth.** Counting
ingredients tells you nothing: `{w, z}` above was two vectors that behaved like one.
What matters is how much the set can *reach*.

---

## 2 · Redundant ingredients: linear independence

The `{w, z}` failure deserves a name and a test, because in real data this situation
is everywhere and it is not usually so obvious.

### The idea

> A vector in your set is **redundant** if you could already have built it from the
> others. A set with no redundant members is called **linearly independent**.

`{w, z}` is *dependent*: `z = 2w`. `{i, j}` is *independent*: no amount of scaling
`(1, 0)` will ever produce `(0, 1)` — one has a second slot, the other never can.

### The test, and how to read it

The source book gives the standard definition, which looks stranger than it is:

```
   c₁·v₁  +  c₂·v₂  +  …  +  cₙ·vₙ  =  0
```

> The vectors are **linearly independent** if the *only* way to make that sum equal
> the zero vector is to set every single `c` to zero.

Read it as a sentence about walking: *"the only way to combine these movements and
end up back where you started is to not move at all."* If there is some *other* way
to get back to the origin — using amounts that aren't all zero — then the moves must
be cancelling each other out, which means one of them was reachable from the others.

**Check `{i, j}`:**

```
   α·(1, 0)  +  β·(0, 1)  =  (0, 0)

   first slot:   α  =  0
   second slot:  β  =  0
```

The only solution is `α = β = 0`. **Independent.** ✓

**Check `{w, z}`:**

```
   2·(1, 1)  +  (−1)·(2, 2)  =  (2, 2) + (−2, −2)  =  (0, 0)
```

Here's a way back to the origin using `c₁ = 2` and `c₂ = −1`, which are *not* zero.
**Dependent.** ✓ And notice that this same equation, rearranged, is exactly the
statement that one is a copy of the other: `z = 2w`.

**A less obvious example.** Is `{(1, 2), (2, 5)}` independent? Neither is a visible
multiple of the other, but let's be sure:

```
   α·(1, 2) + β·(2, 5)  =  (0, 0)

   first slot:    α + 2β  =  0     →   α  =  −2β
   second slot:  2α + 5β  =  0     →   2(−2β) + 5β  =  β  =  0

   so  β = 0,  and therefore  α = 0
```

Only zeros. **Independent** — so these two span the whole plane, even though they're
not at right angles and neither is particularly tidy.

(Doing this by hand for every pair would get old fast. In Article 8 you'll meet the
**determinant**, which answers "is this set independent?" with a single number.)

### Three facts worth memorising

**1. Any set containing the zero vector is dependent.** You can always scale `0` by
17 and add nothing else — a non-zero amount that changes nothing.

**2. In `ℝ²` you can never have three independent vectors.** Two independent vectors
already reach every point, so the third is necessarily reachable. For example:

```
   (2, 3)  =  2·(1, 0)  +  3·(0, 1)      →    2·i + 3·j − 1·(2,3)  =  0
```

In general, **in `ℝⁿ` you can have at most n independent vectors**. That number is
not a coincidence; §3 gives it its name.

**3. Independence is a property of the *set*, not of any one vector.** It's
meaningless to call a single vector "dependent". The redundancy lives in the
relationship.

### What dependence looks like in real data

This is not an abstract concern. Dependent columns appear in datasets constantly,
and they cause real damage:

| Your feature columns | The dependence | Why it happened |
| --- | --- | --- |
| height_cm, height_inches | one is 2.54 × the other | someone merged two sources |
| bedrooms, bathrooms, total_rooms | third = first + second | a "helpful" engineered feature |
| percent_male, percent_female | they sum to 100 | shares of a whole |
| Mon, Tue, …, Sun (one per day) | they sum to 1 for every row | one-hot encoding, all levels kept |

In each case one column is reachable from the others, and it adds **no information
whatsoever** — the span doesn't grow. Statisticians call this
**multicollinearity**, and it makes models unstable: the fitting procedure can't
decide how to split the credit between two columns saying the same thing, so the
knobs can swing wildly on tiny changes in data.

You'll see this same problem again in Articles 8, 9 and 10 wearing different
costumes: a determinant of zero, a matrix with no inverse, a system of equations
with infinitely many solutions. **They are all this one situation.**

---

## 3 · A basis: enough ingredients, and no waste

Now combine the two ideas.

> **Definition — basis.**
> A set of vectors is a **basis** for a space when it is both
> **(a) linearly independent** — nothing redundant — and
> **(b) spanning** — everything in the space is reachable.

The book's summary: *"for a set of vectors to be considered a basis of a vector
space, these vectors need to be linearly independent, and their span has to be equal
to the entire vector space."*

Think of it as the **smallest complete set of ingredients**. Drop one and you can no
longer make everything (you lose the span). Add one and the newcomer is redundant
(you lose the independence). A basis sits exactly at that balance point.

| Set | Independent? | Spans ℝ²? | A basis of ℝ²? |
| --- | --- | --- | --- |
| `{(1,0), (0,1)}` | yes | yes | **yes** — the standard basis |
| `{(1,2), (2,5)}` | yes | yes | **yes** |
| `{(1,1), (2,2)}` | no | no (only a line) | no |
| `{(1,0)}` | yes | no (only a line) | no |
| `{(1,0), (0,1), (2,3)}` | no (third is reachable) | yes | no |

### Dimension

Every basis of a given space turns out to have **the same number of vectors**. That
count is the **dimension** of the space — the word Article 1 used loosely for "how
many slots", now given a precise meaning:

> **The dimension of a space is the number of vectors in any basis for it** — the
> number of genuinely independent directions it has.

`ℝ²` has dimension 2; `ℝ³⁰⁰` has dimension 300. This is why you can't have three
independent vectors in the plane, and why two vectors can never span 3D space.

### The perspective metaphor

The source book has a good story about why one basis is not enough. The author
describes always feeling tall — until a trip to the Netherlands, where he suddenly
felt short. *"My height had not changed, but my perspective had."*

That's exactly what a basis is:

> **A basis is a perspective — a choice of which directions count as "the" directions.
> Change the basis and every coordinate changes, while the actual vector sits
> perfectly still.**

We've been using one perspective, the standard basis, since Article 1, as though it
were the only one available. It isn't. §5 does the swap.

---

## 4 · The space itself, and its rules

We've been saying "the space" informally. The book pauses here to define it, and
so should we — briefly, because the payoff is smaller than the vocabulary suggests.

### The two rules that matter

A **vector space** is a collection of objects (called vectors) together with the two
operations we already have, addition and scalar multiplication, satisfying one
overriding requirement: **you can't fall out of it.**

```
   if  v and w are in the space,    then  v + w  must be in the space
   if  v is in the space and λ is a number,   then  λ·v  must be in the space
```

This is called being **closed** under the two operations. Everything else follows
from it: set `λ = 0` and closure hands you the zero vector; set `λ = −1` and it hands
you the negative of every vector.

**A space that works:** `ℝ²`. Add two pairs of real numbers, you get a pair of real
numbers. Scale one, same. You can never leave. ✓

**A space that fails** (the book's example): `ℝ²` *with the origin removed*. Take

```
   v  =  (1, 1)        w  =  (−1, −1)

   v + w  =  (0, 0)    ← which we just declared isn't in the set
```

One legal addition and you've fallen out. **Not a vector space.**

**Two more failures worth knowing, because they're made of real ML data:**

- **Word-count vectors.** Counts can't be negative, so the set of count vectors isn't
  closed under scaling by `−1`, and it has no way to contain `−v`. (We still *embed*
  counts in `ℝⁿ` and use the full space's machinery — which is fine, and is exactly
  the abstraction move from Article 2.)
- **Normalised embeddings.** The set of vectors with length exactly 1 (Article 3's
  unit vectors) is not a vector space either: `(1, 0) + (0, 1) = (1, 1)`, whose
  length is `√2`. This is worth knowing, because "our embeddings live on the unit
  sphere" is a sentence you will meet, and the unit sphere is a *surface*, not a
  space in this sense.

### The axioms

Full formality requires eight rules, which the book lists and which we'll put in one
table. Every one of them is something you already assume without thinking:

| Axiom | In symbols | In English |
| --- | --- | --- |
| Commutative | `v + w = w + v` | order of addition doesn't matter |
| Associative | `v + (w + t) = (v + w) + t` | bracketing doesn't matter |
| Zero exists | `v + 0 = v` | there's a "stay put" vector |
| Negatives exist | `v + (−v) = 0` | every trip can be undone |
| Distributive (over vectors) | `c(v + w) = cv + cw` | scale a sum = sum of scaled |
| Distributive (over scalars) | `(c + d)v = cv + dv` | |
| Scalars combine | `(cd)v = c(dv)` | |
| One does nothing | `1·v = v` | |

The book is refreshingly blunt about whether you need these: *"Do you need to know
these axioms to apply machine learning? Well, not really. We all take them for
granted."* That's fair. The reason to have seen them is narrower but real:

> **These axioms are the licence for every algebraic step you take.** When Article 4
> expanded `(v₁e₁ + v₂e₂) · (w₁e₁ + w₂e₂)` by multiplying it out like ordinary
> algebra, it was these rules that made that legal.

And there's a second reason, the one Article 2 flagged: these rules are the *entire*
definition. Anything satisfying them is a vector space, and every theorem in this
series applies to it — including collections that look nothing like arrows.
Polynomials form a vector space. So do functions, and 28×28 images, and the set of
all possible weight settings for a neural network. **That's why one body of
mathematics serves all of them.**

### Subspaces

One last piece of vocabulary, because it's about to describe your data.

> A **subspace** is a vector space living inside a bigger one: a subset that is
> itself closed under adding and scaling.

In `ℝ³` the subspaces are: the origin alone, every line through the origin, every
plane through the origin, and all of `ℝ³`. And that's the complete list.

**Every span is a subspace** — which is really why span was worth defining. A line
that *misses* the origin is **not** a subspace: it fails closure the moment you scale
by zero.

Here's why you should care. Article 2 described a cloud of 300-dimensional data
"shaped like a flat pancake". Now you can say that precisely: **the data lies close
to a low-dimensional subspace of a high-dimensional space.** You have 300 features
but perhaps only 20 independent directions of real variation. Finding those 20 and
describing everything with them is compression — and it is the destination of this
series.

---

## 5 · Changing the basis, by hand

This is the part of the article that does actual work. Everything above was
vocabulary; this is what the vocabulary is for.

### The same arrow, different numbers

Take the vector we've been drawing all along:

```
   v  =  (2, 3)
```

Those two numbers have *always* meant "2 steps along `i`, 3 steps along `j`", where
`i = (1,0)` and `j = (0,1)`. The coordinates were never a property of the arrow
alone; they were the arrow **as seen from the standard basis**.

Now change perspective. Use the book's new basis:

```
   w  =  (1, 0)        z  =  (1, 1)
```

(Independent? `α(1,0) + β(1,1) = 0` gives `β = 0` from the second slot, then `α = 0`
from the first. Yes. Two independent vectors in `ℝ²`, so they're a basis.)

**Question: what are the coordinates of the same arrow `v` in this new basis?** We
need the amounts `v₁*` and `v₂*` such that:

```
   (2, 3)  =  v₁*·(1, 0)  +  v₂*·(1, 1)
```

Write out what each slot says:

```
   first slot:    2  =  v₁*  +  v₂*
   second slot:   3  =           v₂*
```

The second line hands us `v₂* = 3` immediately. Substitute into the first:

```
   2  =  v₁*  +  3      →      v₁*  =  −1
```

So:

```
   v  =  (2, 3)  in the standard basis
       =  (−1, 3)  in the basis {w, z}
```

**Check it**, always: `−1·(1, 0) + 3·(1, 1) = (−1, 0) + (3, 3) = (2, 3)`. ✓

Sit with what just happened. The arrow did not move. The page did not move. The
*numbers* changed, from `(2, 3)` to `(−1, 3)`, because we changed which directions
count as the directions. And a minus sign appeared out of nowhere — in the new
perspective you have to go *backwards* along `w` to correct for the overshoot that
`3·z` caused.

> **Coordinates are not a property of a vector. They are a property of a vector
> *and* a basis.**

Article 2 said the *order* of the slots was a convention. This is the deeper version:
**the whole coordinate system is a convention**, and a well-chosen one can make your
data easier to work with.

(Also notice what you just did to find those coordinates: you wrote down two
equations in two unknowns and solved them. That was a **system of linear equations**,
and Article 10 is devoted to doing it properly, for any size.)

### The example that shows why you'd bother

Coordinates changing is a curiosity. Coordinates changing *into something more
meaningful* is a technique. Here is the book's house example, which is the best
argument in the section.

You're predicting house prices, and each house is described by:

```
   house  =  (bedrooms, bathrooms)
```

so the standard basis has a plain reading: `i = (1, 0)` is "one more bedroom" and
`j = (0, 1)` is "one more bathroom".

Now suppose you notice two things in the data: houses with **more rooms in total**
cost more, and houses where bedrooms and bathrooms are **balanced** cost more. Those
are the two patterns that matter — but neither is what your coordinates measure.

So choose a basis that measures them:

```
   i*  =  (1,  1)        one more bedroom AND one more bathroom  →  "total size"
   j*  =  (1, −1)        one more bedroom, one FEWER bathroom    →  "imbalance"
```

Take a specific house — 3 bedrooms, 2 bathrooms:

```
   h  =  (3, 2)
```

Find its coordinates in the new basis:

```
   (3, 2)  =  h₁*·(1, 1)  +  h₂*·(1, −1)

   first slot:    3  =  h₁*  +  h₂*
   second slot:   2  =  h₁*  −  h₂*
```

Add the two equations (the `h₂*` terms cancel):

```
   5  =  2·h₁*        →     h₁*  =  5/2  =  2.5
```

And then from the first equation, `h₂* = 3 − 2.5 = 0.5`. So:

```
   h  =  (3, 2)      in the bedrooms/bathrooms basis
      =  (2.5, 0.5)  in the size/imbalance basis
```

**Check:** `2.5·(1, 1) + 0.5·(1, −1) = (2.5, 2.5) + (0.5, −0.5) = (3, 2)`. ✓

Now read the new coordinates as a sentence about the house:

- **First coordinate 2.5** — how far along "total size" this house sits. (The house has
  5 rooms in total, and each step of `i*` adds *two* rooms, so 2.5 steps. See the
  note below.)
- **Second coordinate 0.5** — how far along "imbalance": half a step, meaning it has
  one more bedroom than bathroom.

Same house. Same information, exactly — you can always convert back. But the second
description is in terms of *the things that actually drive the price*, which is why
the book calls a change of basis "a valuable technique for revealing different
aspects of the data".

### An honest note on that 2.5

The book reads `5/2` as suggesting "a somewhat balanced distribution", which is a bit
loose. It's worth being exact, because the looseness hides something you'll meet
again.

The coordinate is 2.5 rather than 5 because the basis vector `(1, 1)` is not a
one-room step — it's a *two-room* step, adding a bedroom and a bathroom at once. The
coordinate counts steps, so it counts half-rooms-each.

If you want the first coordinate to read as plain "total rooms", normalise the basis
vectors so each has length 1 (Article 3's `v̂`):

```
   î*  =  (1, 1)/√2        ĵ*  =  (1, −1)/√2
```

and the coordinates become `(5/√2, 1/√2) ≈ (3.54, 0.71)` — still scaled, but now by a
consistent `√2`, and now the two directions are at right angles *and* the same
length. A basis that is both orthogonal and unit-length is called **orthonormal**,
and it's the kind PCA produces, precisely because the coordinates it gives are
comparable with one another. The book's basis here is fine for illustration, but its
two directions aren't the same length — so the two coordinates aren't on the same
scale, which is the same fairness problem Article 3 fixed with feature scaling.

(These two basis vectors *are* at right angles, though: `(1,1) · (1,−1) = 1 − 1 = 0`.
Article 4's test, doing quiet work.)

### A basis doesn't have to be perpendicular

Worth stating plainly, since both of our examples might mislead. The first new basis,
`{(1, 0), (1, 1)}`, is *not* perpendicular — `(1,0) · (1,1) = 1 ≠ 0` — and it worked
perfectly well. The book draws this as a slanted grid: the graph paper itself tilts,
and `v` sits still while the grid moves under it.

Perpendicular bases are *nicer*, not required. With an orthonormal basis, finding a
vector's coordinates is just taking dot products (Article 4, §3: components are
shadows) instead of solving equations. Without it, you have to solve, as we just did.

---

## 6 · What this buys you in machine learning

Five payoffs, roughly in order of how soon you'll meet them.

**1. Feature engineering is a change of basis.** Replacing `(bedrooms, bathrooms)`
with `(total, imbalance)` is a basis change, and so is most of what data scientists
do by hand: turning `(height, weight)` into BMI-ish combinations, turning
`(revenue, cost)` into `(profit, margin)`, taking sums and differences of sensor
readings. You are not adding information — you're choosing coordinates in which the
information is easier to see.

**2. Redundant features are linear dependence**, with all the consequences of §2. If
you keep `total_rooms` alongside `bedrooms` and `bathrooms`, your feature set is
dependent, and later articles will show you the specific machinery that breaks.

**3. "Dimension" stops being vague.** A dataset with 300 columns does not necessarily
have 300 dimensions of information. If the columns are heavily dependent, the data
lives in a much smaller subspace. The true count has a name — the **rank** — and
it's coming in Module 3.

**4. PCA, stated properly.** With this vocabulary, the destination of this series can
finally be phrased in one line:

> **PCA finds an orthonormal basis, ordered so that the first direction is the one
> your data spreads out along most, then the next, and so on — and lets you keep the
> first few and discard the rest.**

Every word of that is now a word you know. That's the whole of Article 15, waiting.

**5. The coordinates of an embedding are arbitrary; the geometry is not.** Article 2
noted that "nobody knows what slot 137 of an embedding means". Here's the reason: the
model never chose a meaningful basis, it just landed in *some* coordinate system
during training. Rotate to a different orthonormal basis and every number changes
while every length and angle stays the same — so every cosine similarity, every
nearest neighbour, every answer you actually care about is untouched. **The numbers
are arbitrary. The relationships are real.** That's also why interpreting individual
dimensions of an embedding is hard research rather than a Tuesday afternoon.

---

## 7 · The notation from this article

| You see | You say |
| --- | --- |
| `span{v, w}` | "everything you can build from v and w by scaling and adding" |
| `i`, `j` | the standard basis of the plane — the book's names for `e₁`, `e₂` |
| `c₁v₁ + … + cₙvₙ = 0` | the independence test: "the only way back to the origin" |
| `dim(V)` | the dimension of V: how many vectors in any basis for it |
| `V ⊆ ℝⁿ` (closed under + and ·) | "V is a subspace of ℝⁿ" |
| `B = {w, z}` | a basis, given a name so you can say which perspective you mean |
| `[v]_B` | "the coordinates of v in the basis B" — e.g. `[v]_B = (−1, 3)` |

That last row is the notation for the distinction this article exists to make. When
precision matters, people write `[v]_B` rather than plain `v` — because `(2, 3)` and
`(−1, 3)` are *the same vector*, written in two perspectives.

---

## 8 · Confusions worth clearing up now

**"Is the span the same thing as the vector space?"**
Only when your ingredients are a basis. The span is whatever those particular
vectors reach; it's a subspace of the space they live in, and it might be much
smaller — a line inside the plane, say.

**"Does a basis have to be perpendicular?"**
No. It has to be independent and spanning. Perpendicular-and-unit-length
(*orthonormal*) is a bonus that makes coordinates easy to compute and fair to compare,
which is why the good algorithms aim for it.

**"Is linear independence the same as statistical independence, or uncorrelated?"**
No — and this trips up people with a statistics background. Linear independence is an
algebraic fact about whether one vector is a combination of others. Correlation is a
statistical relationship between variables. Two features can be strongly correlated
(0.99) and still linearly independent in the strict sense; they just make an
uncomfortably *near*-dependent set, which causes exactly the instability of §2 without
technically triggering the definition.

**"Can I have a basis with more vectors than the dimension?"**
No. Any set bigger than the dimension is automatically dependent, and any set smaller
can't span. The count is forced.

**"Why must a subspace contain the origin?"**
Because scaling by 0 is a legal move, and it lands you there. Any set closed under
scaling must contain the zero vector. This is why "a line through the origin" is a
subspace and "a line through (0, 5)" is not.

**"If coordinates depend on the basis, is anything real?"**
Yes: everything geometric. Lengths, distances, angles and dot products are properties
of the vectors themselves. Change to another orthonormal basis and those all survive
unchanged, while the coordinates are rewritten. The coordinates are the description;
the geometry is the thing.

---

## 9 · Five things to carry forward

1. **The span is what your ingredients can reach** — every linear combination of
   them. It always contains the origin, and it may be smaller than you expect.
2. **Linear independence means nothing is redundant.** The test: the only way to
   combine them into the zero vector is to use all zeros. Dependent columns in a
   dataset carry no extra information and destabilise models.
3. **A basis is independent *and* spanning** — the smallest complete set of
   ingredients. Every basis of a space has the same size, and that size is the
   **dimension**.
4. **Coordinates belong to a basis, not to a vector.** `(2, 3)` and `(−1, 3)` can be
   the same arrow seen from two perspectives. Changing basis rewrites the numbers and
   leaves the object alone.
5. **A well-chosen basis makes the data say something.** `(3, 2)` bedrooms and
   bathrooms became `(2.5, 0.5)` size and imbalance. Choosing that basis *from the
   data itself* is PCA.

---

## Check yourself

1. What is the span of `{(2, 0)}`? What is the span of `{(2, 0), (−5, 0)}`? Why are
   they the same?
2. Is `{(1, 3), (2, 6)}` linearly independent? Is it a basis of `ℝ²`?
3. Is `{(1, 3), (2, 7)}` linearly independent? Show your working with the zero test.
4. A dataset has the columns `bedrooms`, `bathrooms` and `total_rooms`. What is the
   dependence, and why does keeping all three add nothing?
5. Write `v = (4, 1)` in the basis `{w, z}` where `w = (1, 0)` and `z = (1, 1)`, and
   check your answer.
6. A house has 4 bedrooms and 2 bathrooms. Give its coordinates in the book's
   `{(1, 1), (1, −1)}` basis, and say in words what each coordinate means.
7. Is the set of vectors in `ℝ²` whose slots are both positive a vector space? Give a
   specific reason.
8. Why can't any set of two vectors be a basis for `ℝ³`?

<details>
<summary>Answers</summary>

1. Both spans are the whole horizontal axis — the line `y = 0`. `(−5, 0)` is
   `−2.5 × (2, 0)`, so it's already in the span of the first vector and adds nothing.
   The set `{(2,0), (−5,0)}` is dependent.
2. Not independent: `(2, 6) = 2 × (1, 3)`. Its span is only the line through `(1, 3)`,
   so it is **not** a basis of `ℝ²` — it fails both conditions at once.
3. `α(1,3) + β(2,7) = (0,0)` gives `α + 2β = 0` and `3α + 7β = 0`. From the first,
   `α = −2β`; substituting, `3(−2β) + 7β = β = 0`, hence `α = 0`. Only zeros, so it's
   **independent** — and being two independent vectors in `ℝ²`, it's a basis.
4. `total_rooms = bedrooms + bathrooms`, so the third column is a linear combination
   of the first two: the set is dependent. The span of all three is the same as the
   span of the first two, so the extra column enlarges nothing — it just gives the
   model two indistinguishable ways to express the same effect.
5. `(4, 1) = v₁*(1, 0) + v₂*(1, 1)`. Second slot: `v₂* = 1`. First slot:
   `4 = v₁* + 1`, so `v₁* = 3`. Coordinates `(3, 1)`. Check:
   `3(1,0) + 1(1,1) = (4, 1)`. ✓
6. `4 = h₁* + h₂*` and `2 = h₁* − h₂*`. Adding: `6 = 2h₁*`, so `h₁* = 3` and
   `h₂* = 1`. Coordinates `(3, 1)`: three steps along "total size" (6 rooms, two per
   step) and one step along "imbalance" (two more bedrooms than bathrooms). Check:
   `3(1,1) + 1(1,−1) = (4, 2)`. ✓
7. No. It has no zero vector, and it isn't closed under scaling: `−1 · (2, 3)` is
   `(−2, −3)`, whose slots aren't positive. Either reason alone is enough.
8. Because the dimension of `ℝ³` is 3. Two vectors can span at most a plane through
   the origin, so points off that plane are unreachable — the set fails the spanning
   condition no matter which two vectors you pick.
</details>

---

### Next

**Article 6 — Matrices and Linear Transformations.** The book ends this section with
a promise: *"there is another mathematical way to perform these transformations. For
this purpose, we will be making use of something that is probably familiar to you,
matrices."* Next we meet the matrix from both sides: as a **table** holding your whole
dataset, one row per thing, and as a **verb** — an action that picks up every vector
in the space and moves it, rotating, stretching and shearing the grid itself. Those
two readings are the matrix's version of the two faces a vector had in Article 2.

---

*Built alongside Jorge Brasil, **Before Machine Learning, Volume 1 — Linear Algebra
for A.I.**, §3.4. The axioms, the `ℝ²`-without-the-origin counterexample, the
independence definition, the `(2,3)` change of basis and the bedrooms/bathrooms
example follow that book; the span-first ordering, the dependent-columns table, the
unit-sphere and word-count counterexamples, and the note on the factor of 2 in the
house coordinates are this series' own.*
