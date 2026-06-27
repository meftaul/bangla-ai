---
name: Pathshala by Bangla.ai
description: A joyful, hands-on bilingual platform for learning AI & Data Science.
colors:
  background: "#f6f8fb"
  foreground: "#0f1b2d"
  muted: "#5a6b7d"
  border: "#e4e9f0"
  surface: "#ffffff"
  accent: "#047857"
  accent-text: "#047857"
  accent-foreground: "#ffffff"
  accent-bright: "#6ee7b7"
  accent-deep: "#0c3b30"
  logo-string: "#d92b2b"
  danger: "#dc2626"
  cat-blue: "#2563eb"
  cat-amber: "#d97706"
  cat-coral: "#e11d48"
  cat-violet: "#7c3aed"
  cat-teal: "#0d9488"
  dark-background: "#0e1626"
  dark-foreground: "#e9eef6"
  dark-muted: "#93a2b6"
  dark-border: "#26344c"
  dark-surface: "#16223a"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(3.75rem, 6vw + 1rem, 6rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(1.875rem, 2vw + 1rem, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  bangla:
    fontFamily: "Hind Siliguri, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.18em"
rounded:
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
  cta-pill:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
  field-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "10px 12px"
  surface-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
    padding: "24px"
---

# Design System: Pathshala by Bangla.ai

## 1. Overview

**Creative North Star: "The Joyful Lab"**

Pathshala is a place to *do*, not just read. The system is built like a clean, bright
workbench: a calm cool-slate surface that gets out of the way, with energy and color
spent deliberately on the moments that reward the learner — a quiz answered, a poll
cast, a deck advancing, a CTA that means *go*. The resting interface is quiet and
crisp (Khan Academy × Brilliant restraint); the interactive moments are where the
delight lives. It is bilingual at its core: Bangla (Hind Siliguri) and English
(Geist / Space Grotesk) are first-class peers, switching mid-sentence without a seam.

This system explicitly rejects three things. It is **not** corporate e-learning —
no gray Moodle clutter, no joyless compliance-module density. It is **not** generic
AI-SaaS — no dark-purple gradients, neon glow, glassmorphism, or hero-metric template.
And it is **not** a dense academic textbook — no walls of unhierarchied text, no
Times-New-Roman seriousness. Joyful, never juvenile: there are no cartoon mascots,
no crayon-primary palette, no rounded-everything.

The whole interface lives on cool, crisp neutrals with **one** green accent locked for
all interaction. There is no pure black and no pure white anywhere — the light scheme
is a cool off-white, the dark scheme a deep slate-navy. Both ship AA-clean.

**Key Characteristics:**
- Cool slate neutrals at rest; one locked green accent for *go*.
- Bilingual-equal typography (Bangla + Latin), switching mid-sentence.
- Soft, slightly-raised cards over flat boxes — a tactile workbench, not a spreadsheet.
- Motion is rare and rewarding: fade-ups, scroll reveals, a gentle logo bob.
- Light/dark follows system preference, with a manual override that always wins.

## 2. Colors

A cool, crisp neutral field with a single committed green and a separate categorical
set reserved strictly for subject-coding.

### Primary
- **Forest Green** (`#047857`): The one interaction color. Every CTA fill, primary
  button, focus ring, active nav state, and the logo body. White text on it passes AA
  (~5.5:1) in both schemes. Its job is to mean *go* — nothing else competes for it.
- **Mint Bright** (`#6ee7b7`): The accent's voice on dark bands — accent *text* and the
  logo dot on the deep-green footer/CTA, and the AA-safe accent text color in dark mode.
- **Deep Forest** (`#0c3b30`): A constant deep teal-forest band (identical in both
  schemes) used as the surface for the footer and the landing's "Join in" CTA block.

### Secondary
- **Accent Foreground** (`#ffffff`): Text/icon color *on* a green fill. Used only on
  accent or deep-forest surfaces, never as a page background.

### Tertiary — Categorical (subject coding / illustration ONLY)
- **Cat Blue** (`#2563eb` / dark `#60a5fa`), **Cat Amber** (`#d97706` / `#fbbf24`),
  **Cat Coral** (`#e11d48` / `#fb7185`), **Cat Violet** (`#7c3aed` / `#a78bfa`),
  **Cat Teal** (`#0d9488` / `#2dd4bf`): For coding subjects, charts, and illustration.
  Each brightens in dark mode to hold contrast. **Never** used as a second brand accent.
- **Danger** (`#dc2626` / dark `#f87171`): Errors and destructive actions only. Success
  reuses the primary green — there is no separate success color.

### Neutral
- **Cool Off-White** (`#f6f8fb`) / **Deep Slate-Navy** (`#0e1626`): Page background,
  light / dark.
- **Surface** (`#ffffff` / `#16223a`): Cards, inputs, raised panels.
- **Slate Ink** (`#0f1b2d` / `#e9eef6`): Primary text.
- **Slate Muted** (`#5a6b7d` / `#93a2b6`): Secondary text, labels, captions.
- **Hairline Border** (`#e4e9f0` / `#26344c`): Card borders, dividers, input strokes.

### Named Rules
**The One Green Rule.** Exactly one accent — Forest Green — carries *all* interaction.
CTAs, primary buttons, focus rings, active states, the logo. The categorical palette
exists only to color subjects and illustrations; promoting any `--cat-*` hue to a
second brand accent is forbidden.

**The No-Pure-Black-or-White Rule.** Light is a cool off-white (`#f6f8fb`), dark is a
slate-navy (`#0e1626`). `#000` and `#fff` never appear as background or body text.

**The Two-Token Accent Rule.** Accent *fills* use `--accent` with white text; accent
*text/dots* use `--accent-text` (green on light, mint on dark). Never set small green
text from the fill token — it fails AA on the cool background.

## 3. Typography

**Display Font:** Space Grotesk (with `sans-serif` fallback)
**Body Font:** Geist (with Arial, Helvetica fallback)
**Bangla Font:** Hind Siliguri (weights 400 / 600 / 700)

**Character:** A geometric-grotesk display (Space Grotesk) gives headlines a confident,
slightly technical snap; Geist keeps body text neutral and highly legible. Hind
Siliguri carries all Bangla as a true peer — not a fallback — so bilingual copy reads
evenly in either script.

### Hierarchy
- **Display** (Space Grotesk, 700, `clamp` to ~6rem, line-height 1, tracking -0.02em):
  Hero headline only — e.g. the landing "Let's Learn". Tight leading, never above ~96px.
- **Headline** (Space Grotesk, 700, ~1.875–2.25rem, line-height ~1.15): Section and
  CTA-block headings. Used for the Bangla "শেখাটা মজার হোক" CTA at 3xl–4xl.
- **Title** (Space Grotesk / Geist, 600, ~1.25–1.375rem): Card titles, deck slide
  headings, article H2s.
- **Body** (Geist, 400, 1rem, line-height 1.7): Prose and UI text; articles cap at a
  comfortable measure (~65–75ch). Bangla body uses Hind Siliguri at line-height ~1.6.
- **Label** (Geist, 600, 0.75rem, uppercase, tracking 0.18em): The eyebrow kicker —
  used sparingly above hero and CTA blocks, paired with a small accent dot.

### Named Rules
**The Peer-Script Rule.** Bangla is never a downgraded fallback. Any surface that can
show Bangla (`font-bangla`) gets Hind Siliguri at full size and proper line-height;
mixed Bangla/English in one line must read evenly.

**The Quiet-Kicker Rule.** The uppercase tracked label is allowed only as a deliberate
eyebrow on hero and CTA blocks (with the accent dot), not stamped above every section.

## 4. Elevation

A mostly-flat system with **one** soft, tinted card shadow — the system layers with
borders and gentle elevation, not heavy drop shadows. Surfaces are bordered hairline
panels; cards lift just enough to feel tactile (the Khan/Brilliant workbench feel)
rather than float. Depth in dark mode comes from surface lightness stepping up off the
slate-navy base, not from darker shadows alone. Sticky headers use a translucent
background with backdrop-blur, the only blur in the system.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgb(15 27 45 / 0.04), 0 10px 24px -14px rgb(15 27 45 / 0.14)`):
  The single elevation token (`--shadow-card`), tinted to the slate background hue.
  Dark mode: `0 1px 2px rgb(0 0 0 / 0.3), 0 12px 28px -14px rgb(0 0 0 / 0.55)`. Used on
  `.surface-card` only.

### Named Rules
**The One-Shadow Rule.** There is exactly one elevation token. Cards use it; everything
else is flat with a hairline border. No layered shadow scale, no glassmorphism.

## 5. Components

### Buttons
- **Shape:** Buttons and inputs use the `xl` radius (12px); standalone CTAs use the
  full `pill` radius (9999px). Cards use `2xl` (16px), large CTA blocks `3xl` (24px).
- **Primary** (`.btn-primary`): Forest Green fill, white text, `px-4 py-2.5`,
  `text-sm font-medium`. Hover lifts 1px (`-translate-y-px`), active settles back.
- **CTA pill:** Green fill, pill radius, larger padding (`px-7 py-3.5`), often with a
  trailing arrow that nudges right on hover. The landing's "Let's Start Now" / "শুরু করো".
- **Secondary** (`.btn-secondary`): Surface fill, hairline border, foreground text;
  border turns green on hover.
- **Ghost** (`.btn-ghost`): Muted text, no fill; text darkens to foreground on hover.
- **Hover / Focus:** `transition-all`; the lift is transform-only (no layout shift).

### Cards / Containers
- **Corner Style:** `2xl` (16px) for standard cards, `3xl` (24px) for hero CTA blocks.
- **Background:** Surface (`#ffffff` / `#16223a`).
- **Shadow Strategy:** The single `--shadow-card` token (see Elevation). Slightly
  raised, not flat — deliberately tactile.
- **Border:** Hairline (`--border`) on every card.
- **Internal Padding:** ~24px (`lg`); CTA blocks go to ~48–80px.

### Inputs / Fields
- **Style** (`.field-input`): Surface background, hairline border, `xl` radius,
  `px-3 py-2.5`. Placeholder text uses the muted token.
- **Focus:** Border turns green and a 2px green focus ring at 40% opacity appears
  (`focus:ring-2 focus:ring-accent/40`); default outline removed.

### Navigation
- **Header:** Sticky, `z-40`, hairline bottom border, translucent background
  (`bg-background/80`) with `backdrop-blur-md`. Logo lockup left, theme toggle + green
  "Sign in" pill right.
- **Active state:** Driven by the accent green.
- **Mobile:** Max-width container (`max-w-6xl`) with responsive horizontal padding
  (`px-4 sm:px-6 lg:px-8`); dashboard nav collapses into a shell.

### Signature Components
- **Live Deck (reveal.js):** Presenter + viewer slide decks themed from our tokens
  (reveal's white.css is overridden so slides follow light/dark instead of always
  rendering on white). Headings use the display font; links/controls use accent-text.
- **Interactive set:** Quiz, Poll, and Drag-Drop exercises plus an Excalidraw
  whiteboard — the "Joyful Lab" core. These are the moments color and motion are spent on.
- **Pathshala mark:** Inline SVG logo whose body tracks `--color-primary` (the accent)
  and whose "strings" are flag-red (`--logo-string`). Floats gently on the hero
  (`float-y`, transform-only, off under reduced-motion).

## 6. Do's and Don'ts

### Do:
- **Do** carry *all* interaction on the one Forest Green accent (`#047857`); use
  `--accent` for fills (white text) and `--accent-text` for small green/mint text.
- **Do** treat Bangla (Hind Siliguri) as a first-class peer to Latin — full size,
  proper line-height, even in mixed lines.
- **Do** keep surfaces flat with hairline borders; reach for elevation only via the
  single `--shadow-card` token on `.surface-card`.
- **Do** use cool off-white / slate-navy backgrounds — never `#000` or `#fff`.
- **Do** give every animation a `prefers-reduced-motion` path; content must be fully
  visible without motion (fade-ups and scroll-reveals enhance an already-visible default).
- **Do** spend color and motion on interactive rewards (quizzes, polls, deck reveals),
  keeping the resting interface calm.

### Don't:
- **Don't** promote any `--cat-*` hue to a second brand accent — categorical colors are
  for subject-coding and illustration only.
- **Don't** ship the generic AI-SaaS look: no dark-purple gradients, neon glow,
  glassmorphism cards, or the big-number hero-metric template.
- **Don't** drift into corporate-LMS density — no gray cluttered form-walls, no joyless
  compliance-module energy.
- **Don't** become a dense academic textbook — no unhierarchied text-walls, no
  Times-New-Roman seriousness.
- **Don't** go juvenile — no cartoon mascots, crayon-primary palette, or
  rounded-everything. Joyful, not childish.
- **Don't** use pure black or pure white, gradient text, or `border-left` color stripes
  as accents. Use full borders and the accent fill instead.
