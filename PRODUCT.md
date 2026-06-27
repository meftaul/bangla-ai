# Product

## Register

product

## Users

Bengali and English-speaking learners of AI and Data Science — students, self-taught
beginners, and working professionals who think most comfortably in Bangla but read
technical material in English. They arrive to *do* something: follow a structured
course, work through a notebook, sit in a live interactive session, or review an
article. Many are on mid-range laptops or phones; the interface must stay fast and
legible in both languages, often switching mid-sentence.

There are two roles in the same product: **learners** joining sessions, taking
quizzes/polls, and reading; and **instructors/authors** running live decks, managing
articles, and reviewing session results.

## Product Purpose

Pathshala (by Bangla.ai) makes learning AI and data science feel hands-on and
unintimidating for a bilingual audience. It pairs structured written material with
*live, interactive* teaching: presenter-driven slide decks, real-time polls, quizzes,
drag-and-drop exercises, and a shared whiteboard. Success looks like a learner
finishing a session having actually *done* the work — answered, voted, sketched — not
just watched, and coming back because the experience felt clear and rewarding rather
than like corporate training.

## Brand Personality

Three words: **clear, hands-on, joyful**. The voice is an encouraging tutor who
respects your time — confident and precise, never stuffy or childish. It speaks both
Bangla and English as equals (the landing CTA is literally *"শুরু করো"*), and it treats
delight as a teaching tool: progress is rewarded, interaction is the default, and the
crisp green accent means *go*. Warm but not soft; energetic but not loud.

## Anti-references

- **Corporate e-learning / LMS** (Moodle, enterprise Coursera): cluttered gray
  dashboards, form-heavy, joyless compliance-training energy. Pathshala is the opposite
  of "mandatory module."
- **Generic AI-SaaS**: dark-mode-purple gradients, neon glow, glassmorphism cards, the
  big-number hero-metric template. The 2024 AI-startup look is forbidden.
- **Dense academic textbook**: walls of text, no hierarchy, Times-New-Roman
  seriousness. Learning here should feel light and navigable, not like a PDF.

## Design Principles

- **Interaction is the lesson.** Every screen should invite doing, not just reading.
  Polls, quizzes, and live decks are the product, not decoration.
- **Two languages, one voice.** Bangla and English are first-class peers. Typography,
  spacing, and tone must read naturally in either, including mid-sentence switches.
- **One green means go.** A single locked accent carries interaction and CTAs; the
  categorical palette is for subject-coding only, never a second brand color. Restraint
  keeps the signal loud.
- **Calm surface, lively moments.** The resting interface is crisp and quiet (cool
  slate neutrals, soft cards); energy and motion are spent deliberately on rewards and
  reveals, not sprinkled everywhere.
- **Fast and legible everywhere.** Mid-range hardware, both color schemes, both
  languages. Clarity is a feature, not a finish.

## Accessibility & Inclusion

WCAG **AA** is the floor and is engineered into the tokens: accent fills pass AA with
white text in both light and dark schemes, and a separate `--accent-text` token exists
so accent *text* still passes AA on each background. Full `prefers-reduced-motion`
support is required — every animation has a no-motion path and content is visible
without it. Bilingual typography is an accessibility commitment, not a nicety: Bangla
(Hind Siliguri) and Latin (Geist/Space Grotesk) must both render at comfortable size
and line-height. Light/dark follows system preference with a manual override.
