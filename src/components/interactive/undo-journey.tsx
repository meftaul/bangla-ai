"use client";

import { useId, type KeyboardEvent, type ReactNode } from "react";

import { Bubble, Card as CastCard, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { LightBhai, Projector, STAGE_WALL_F, StageBeam, StageWall, apply, det, projectorLens, type Cols, type Move } from "./light-kit";
import { FLOWER_OUTLINE, LENS_G, LENS_H, LENS_L, PK, cellPoly, mapPts, polyArea } from "./patch-kit";

// Screens for "Math for AI 9.1 — ফেরার lens", told as a Journey in the
// author's Bangla-English. The plan is 09_journey_specs.md, block 9.1.
//
// ফিরানির পরের সকাল। It rained in the night; Rina's stencils are পাল্প in a
// বালতি। The ফুল is still on the wall, 15 ঘর, thrown through G. Rina traces it
// onto পলিথিন। Which lens throws it back to the 5-ঘর stencil? Nasib: সব
// সংখ্যা উল্টায় দেন। Samin: ছোট করলেই তো হয় (H)। Karim: রং একবার দিলে আর
// ফেরে না। The লাইট ভাই puts one more lens on the মাদুর and says nothing.
//
// Nine screens. 1 seals the bet (UndoBet). 2 the plain glass: nothing moves,
// I (PlainGlass). 3 two easy undos, L and a 90° turn (EasyUndo). 4 predict,
// then Nasib's flipped numbers: the ফুল grows (OneOverEach). 5 who lands on
// e₁, on e₂: two dots dragged until G's light sits there, G⁻¹'s columns
// (WhoLandsHere). 6 G⁻¹ on the wall, and both orders (UndoOnWall). 7 Your
// turn: the tall heart, [[2, 0], [0, 5]] (YourUndo). 8 Try it: the hand in
// the আয়না (TryUndo). 9 the bet opened (BetOpen), the end.
//
// The shared piece, the ফেরা run: a painting (traced on পলিথিন) → a lens →
// light on a fresh card, over a dashed ghost of the true stencil, with a
// মিললো / মিললো না readout (CardSheet, Print, Verdict, RunRow, glide). The
// spec wants it in undo-kit.tsx; 9.2 and 9.3 are built in parallel, so it is
// local here, to be folded later.
//
// After the screens: the story scenes (MorningBucket, FourCards, ClearGlass,
// NasibTries, SaminCorner, TallHeart, NewStencil, ApaDoor) and the watch-only
// figures (UndoStake, ColumnsHome, ShearBack, NasibMiss, TwoDotsHome,
// FoldFive, StretchZero, RecapHome), each numbered after its screen.
//
// light-kit.tsx and patch-kit.tsx are used read-only.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const BLUE = "#2563eb";
const OK = "#0d9488";
const BAD = PK.bad;
const AMBER = "#d97706";
const TEAL = "#0d9488";
const HENNA = "#9a3412";
const HENNA_DARK = "#7c2d12";
const HENNA_LINE = "#fdba74";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

// ---------------------------------------------------------------------------
// Numbers. Lenses by columns (light-kit's Cols): [[a, b], [c, d]] has
// columns (a, c) and (b, d).

const I2: Cols = [
  [1, 0],
  [0, 1],
];
const G = LENS_G;
/** G⁻¹ = (1/3)[[2, −1], [−1, 2]]: the লাইট ভাই's unknown bag lens */
const G_INV: Cols = [
  [2 / 3, -1 / 3],
  [-1 / 3, 2 / 3],
];
/** Nasib's lens: every number of G flipped, [[½, 1], [1, ½]] */
const NASIB: Cols = [
  [0.5, 1],
  [1, 0.5],
];
/** the লাইট ভাই's turning lens: 90° to the left (e₁ → (0, 1), e₂ → (−1, 0)) */
const TURN: Cols = [
  [0, 1],
  [-1, 0],
];
/** the turn the other way */
const TURN_BACK: Cols = [
  [0, -1],
  [1, 0],
];
/** the আয়না M = [[−1, 0], [0, 1]] (7.4, 8.3) */
const MIRROR: Cols = [
  [-1, 0],
  [0, 1],
];
/** the লাইট ভাই's লম্বা lens [[2, 0], [0, 5]] (Check Q3) */
const TALL: Cols = [
  [2, 0],
  [0, 5],
];
/** 6.5's হেলানো lens [[1, 1], [0, 1]] and its undo */
const SHEAR: Cols = [
  [1, 0],
  [1, 1],
];
const SHEAR_BACK: Cols = [
  [1, 0],
  [-1, 1],
];
/** a stretch with one 0: [[2, 0], [0, 0]] */
const FLAT: Cols = [
  [2, 0],
  [0, 0],
];

/** one lens that does `first`, then `second` */
const onto = (second: Cols, first: Cols): Cols => [apply(second, first[0]), apply(second, first[1])];
const sameCols = (a: Cols, b: Cols) => a.every((c, i) => c.every((v, j) => Math.abs(v - b[i][j]) < 1e-6));
const near = (a: XY, b: XY) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ID_MOVE: Move = (p) => p;

/**
 * The lens carried partway by t (0 = nothing yet, 1 = the whole lens). A turn
 * turns (angle × t) instead of sliding straight, so a turning hand doesn't
 * shrink on the way.
 */
const glide = (c: Cols, t: number): Move => {
  const rot = Math.abs(det(c) - 1) < 1e-9 && Math.abs(c[0][0] - c[1][1]) < 1e-9 && Math.abs(c[0][1] + c[1][0]) < 1e-9;
  if (rot && t < 1) {
    const a = Math.atan2(c[0][1], c[0][0]) * t;
    const co = Math.cos(a);
    const si = Math.sin(a);
    return (p) => [p[0] * co - p[1] * si, p[0] * si + p[1] * co];
  }
  return (p) => {
    const q = apply(c, p);
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  };
};
/** lens after lens: the first move runs first */
const chain =
  (...ms: Move[]): Move =>
  (p) =>
    ms.reduce((q, m) => m(q), p);

/** A number as a fraction when it is one: 0.5 → "1/2", −1/3 → "−1/3". */
const fr = (v: number) => {
  for (let d = 1; d <= 10; d += 1) {
    const n = Math.round(v * d);
    if (Math.abs(v * d - n) < 1e-6) {
      const s = d === 1 ? `${Math.abs(n)}` : `${Math.abs(n)}/${d}`;
      return n < 0 ? `−${s}` : s;
    }
  }
  const r = Math.round(v * 100) / 100;
  return r < 0 ? `−${-r}` : `${r}`;
};
const area = (n: number) => `${Math.round(n * 100) / 100}`;

/** What the two numbers of a spot on the card count. */
const SPOT_SLOTS = ["ডানে কত ঘর", "উপরে কত ঘর"] as const;

// ---------------------------------------------------------------------------
// The stencils. Each is one or more outlines in ঘর units, the pin at (0, 0).

/** Rina's ফুল, 5 ঘর (patch-kit's FLOWER_OUTLINE) */
const FLOWER: XY[] = FLOWER_OUTLINE;
/** the heart (8.7), about 0.85 ঘর wide, inside the pin's ঘর */
const HEART: XY[] = Array.from({ length: 44 }, (_, i) => {
  const a = (i / 44) * 2 * Math.PI;
  const x = 16 * Math.sin(a) ** 3;
  const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
  return [0.52 + x * 0.026, 0.52 + y * 0.026] as XY;
});
/** the মেহেদি stencil (8.3): one ঘর, আপার ডান হাত inside it, fingers along e₂, thumb out to the right */
const SQ: XY[] = cellPoly([0, 0]);
const HAND: XY[] = [
  [0.25, 0.05],
  [0.2, 0.3],
  [0.17, 0.5],
  [0.14, 0.64],
  [0.16, 0.69],
  [0.21, 0.7],
  [0.25, 0.66],
  [0.28, 0.54],
  [0.3, 0.56],
  [0.3, 0.79],
  [0.33, 0.83],
  [0.38, 0.83],
  [0.41, 0.79],
  [0.42, 0.56],
  [0.44, 0.57],
  [0.44, 0.87],
  [0.47, 0.91],
  [0.52, 0.91],
  [0.55, 0.87],
  [0.56, 0.56],
  [0.58, 0.55],
  [0.58, 0.8],
  [0.61, 0.84],
  [0.66, 0.84],
  [0.69, 0.8],
  [0.69, 0.5],
  [0.73, 0.43],
  [0.83, 0.58],
  [0.88, 0.61],
  [0.93, 0.57],
  [0.92, 0.5],
  [0.81, 0.3],
  [0.73, 0.17],
  [0.68, 0.05],
];
const RING: XY[] = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * 2 * Math.PI;
  return [0.45 + 0.1 * Math.cos(a), 0.3 + 0.1 * Math.sin(a)];
});
type Pic = "flower" | "heart" | "hand";

const pathD = (f: Frame, pts: readonly XY[], m: Move = ID_MOVE) =>
  pts
    .map((p, i) => {
      const q = m(p);
      return `${i ? "L" : "M"}${f.sx(q[0]).toFixed(1)} ${f.sy(q[1]).toFixed(1)}`;
    })
    .join("") + "Z";

const GLASS_FILL = { G: "#a7f3d0", nasib: "#fde68a", H: "#bae6fd", bag: "#e9d5ff", clear: "#f8fafc", L: "#fbcfe8", turn: "#c7d2fe", mirror: "#e2e8f0", tall: "#fed7aa" } as const;

// ---------------------------------------------------------------------------
// The ফেরা run, the shared piece.

/**
 * A fresh white card at the machine's stand, as a Plane (fixed ink): Rina's
 * chalk-style grid in ঘর, the pin at (0, 0). `fine` adds faint lines every
 * 1/fine ঘর (for dragging a dot). Children are clipped to the card.
 */
function CardSheet({
  f,
  label,
  fine = 0,
  drag,
  onKey,
  className = "max-w-[13rem]",
  children,
}: {
  f: Frame;
  label: string;
  fine?: number;
  drag?: { down?: (p: XY) => void; move?: (p: XY) => void; up?: () => void };
  onKey?: (e: KeyboardEvent<SVGSVGElement>) => void;
  className?: string;
  children?: ReactNode;
}) {
  const id = `cs${Math.round(f.W)}x${Math.round(f.H)}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  let d = "";
  for (let x = Math.ceil(f.x0); x <= f.x1; x += 1) d += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  for (let y = Math.ceil(f.y0); y <= f.y1; y += 1) d += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  let fd = "";
  if (fine)
    for (let i = Math.ceil(f.x0 * fine); i <= f.x1 * fine; i += 1) {
      if (i % fine) fd += `M${f.sx(i / fine)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
    }
  if (fine)
    for (let i = Math.ceil(f.y0 * fine); i <= f.y1 * fine; i += 1) {
      if (i % fine) fd += `M${f.sx(f.x0)} ${f.sy(i / fine)}H${f.sx(f.x1)}`;
    }
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} drag={drag} onKey={onKey} className={`my-0! ${className}`}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={f.W} height={f.H} rx={6} fill="#fffdf7" stroke="#d6d3d1" strokeWidth={1} />
      {fd && <path d={fd} strokeWidth={0.5} stroke={PK.chalk} strokeOpacity={0.16} fill="none" className="pointer-events-none" />}
      <path d={d} strokeWidth={0.7} stroke={PK.chalk} strokeOpacity={0.35} fill="none" className="pointer-events-none" />
      <g clipPath={`url(#${id})`}>{children}</g>
      <circle cx={f.sx(0)} cy={f.sy(0)} r={2.6} fill="#e5e7eb" stroke={INK} strokeWidth={0.9} className="pointer-events-none" />
    </Plane>
  );
}

/**
 * A stencil's picture carried by `move`: "paint" (the painting as traced on
 * পলিথিন, orange), "light" (the machine's light on the card) or "ghost" (the
 * true stencil, dashed, from Rina's খাতা)।
 */
function Print({ f, pic, move = ID_MOVE, look, soft = false }: { f: Frame; pic: Pic; move?: Move; look: "paint" | "light" | "ghost"; soft?: boolean }) {
  const main = pic === "flower" ? FLOWER : pic === "heart" ? HEART : SQ;
  const d = pathD(f, main, move);
  const palm = pic === "hand" ? pathD(f, HAND, move) : "";
  const o = soft ? 0.5 : 1;
  if (look === "ghost")
    return (
      <g className="pointer-events-none" opacity={o}>
        <path d={d} fill="none" stroke={BLUE} strokeWidth={1.5} strokeDasharray="4 3" strokeLinejoin="round" />
        {palm && <path d={palm} fill={BLUE} fillOpacity={0.08} stroke={BLUE} strokeWidth={1.1} strokeDasharray="3 2" strokeLinejoin="round" />}
      </g>
    );
  if (look === "paint")
    return (
      <g className="pointer-events-none" opacity={o}>
        <path d={d} fill={PK.paint} fillOpacity={pic === "hand" ? 0.18 : 0.32} stroke={PK.paintDark} strokeWidth={1.1} strokeLinejoin="round" />
        {palm && <path d={palm} fill={HENNA} fillOpacity={0.55} stroke={HENNA_DARK} strokeWidth={0.8} strokeLinejoin="round" />}
      </g>
    );
  return (
    <g className="pointer-events-none" opacity={o}>
      <path d={d} fill={PK.glow} fillOpacity={0.3} stroke={PK.glow} strokeOpacity={0.55} strokeWidth={5} strokeLinejoin="round" />
      <path d={d} fill={PK.glow} fillOpacity={0.62} stroke={PK.lamp} strokeWidth={1.3} strokeLinejoin="round" />
      {palm && (
        <>
          <path d={palm} fill={HENNA} stroke={HENNA_DARK} strokeWidth={0.8} strokeLinejoin="round" />
          <path d={pathD(f, RING, move)} fill="none" stroke={HENNA_LINE} strokeWidth={Math.max(0.6, f.u * 0.02)} />
        </>
      )}
    </g>
  );
}

/** The machine's beam onto the card while a run plays: a faint cone from the lower right corner. */
function SheetBeam({ f, to }: { f: Frame; to: XY }) {
  const x0 = f.W + 4;
  const y0 = f.H + 4;
  const x = f.sx(to[0]);
  const y = f.sy(to[1]);
  const L = Math.hypot(x - x0, y - y0) || 1;
  const w = f.W * 0.14;
  const nx = (-(y - y0) / L) * w;
  const ny = ((x - x0) / L) * w;
  return <path d={`M${x0} ${y0}L${x + nx} ${y + ny}L${x - nx} ${y - ny}Z`} fill={PK.glow} opacity={0.2} className="pointer-events-none" />;
}

/** a drawn tick or cross (no glyphs) */
function Mark({ ok, size = 14 }: { ok: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} aria-hidden="true" className="shrink-0">
      <circle cx={7} cy={7} r={6.5} fill={ok ? OK : BAD} />
      {ok ? <path d="M3.8 7.2l2.2 2.2l4.2 -4.6" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M4.6 4.6l4.8 4.8M9.4 4.6l-4.8 4.8" stroke="white" strokeWidth={1.8} strokeLinecap="round" />}
    </svg>
  );
}

/** মিললো / মিললো না, and what the card shows. */
function Verdict({ ok, children }: { ok: boolean; children?: ReactNode }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 text-sm ${POP}`}>
      <Mark ok={ok} />
      <span className={`font-semibold ${ok ? "text-accent-text" : "text-danger"}`}>{ok ? "মিললো" : "মিললো না"}</span>
      {children && <span className="text-muted">· {children}</span>}
    </div>
  );
}

/**
 * A round glass for the machine, as a small drawing: its colour, a letter,
 * and with `back` the curled ফেরা arrow on its rim (an undo lens). `lit`
 * glows it; `none` crosses out an empty holder (Karim's card).
 */
function GlassIcon({ fill, letter, back = false, lit = false, none = false, empty = false, size = 32 }: { fill: string; letter?: string; back?: boolean; lit?: boolean; none?: boolean; empty?: boolean; size?: number }) {
  if (empty)
    return (
      <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="shrink-0">
        <circle cx={16} cy={16} r={11.5} fill="none" stroke={INK} strokeOpacity={0.45} strokeWidth={1.2} strokeDasharray="3 2" />
      </svg>
    );
  const bn = letter ? /[ঀ-৿]/.test(letter) : false;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="shrink-0">
      {lit && <circle cx={16} cy={16} r={15.5} fill={PK.glow} opacity={0.55} />}
      <circle cx={16} cy={16} r={11.5} fill={none ? "white" : fill} stroke={lit ? PK.lamp : INK} strokeWidth={lit ? 2 : 1.2} strokeDasharray={none ? "3 2" : undefined} />
      {!none && <path d="M10 11q3 -4 7 -4" fill="none" stroke="white" strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />}
      {letter && !none && (
        <text x={16} y={20} textAnchor="middle" fontSize={letter.length > 2 ? 8 : 11} fontWeight={800} fontFamily={bn ? undefined : MONO} fill={INK}>
          {letter}
        </text>
      )}
      {none && <path d="M10 10l12 12M22 10l-12 12" stroke={BAD} strokeWidth={2} strokeLinecap="round" />}
      {back && (
        <g>
          <path d="M26.5 9A12.5 12.5 0 0 0 16 3.5" fill="none" stroke={BLUE} strokeWidth={1.8} strokeLinecap="round" />
          <path d="M16 3.5l3.2 -2.2M16 3.5l3.2 2.4" stroke={BLUE} strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

/** a small drawn arrow for rows (no glyph) */
function RowArrow() {
  return (
    <svg viewBox="0 0 16 10" className="h-2.5 w-4 shrink-0 text-muted" aria-hidden="true">
      <path d="M1 5H13M9 1.5L13 5L9 8.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The run in one row: পলিথিন → the glasses → card. `lit` lights the glass being passed. */
function RunRow({ from = "পলিথিন", glasses, lit = -1, end }: { from?: string; glasses: ReactNode[]; lit?: number; end?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center justify-center gap-1.5 text-sm">
      <span className="text-muted">{from}</span>
      {glasses.map((g, i) => (
        <span key={i} className={`flex items-center gap-1.5 ${lit === i ? "scale-110" : ""} transition-transform duration-300 motion-reduce:transition-none`}>
          <RowArrow />
          {g}
        </span>
      ))}
      <RowArrow />
      <span className="text-muted">card</span>
      {end}
    </div>
  );
}

/** A lens as its four numbers, fractions and all; column 1 amber, column 2 teal. */
function FLens({ cols, small = false, shown = 2 }: { cols: Cols; small?: boolean; shown?: number }) {
  const cell = small ? "min-w-6 text-[0.68rem] leading-4" : "min-w-7 text-xs leading-5";
  return (
    <span className="inline-flex shrink-0 items-stretch align-middle font-mono font-bold">
      <span className="w-1 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
      {[0, 1].map((c) => (
        <span key={c} className={`flex flex-col items-center px-0.5 ${c ? "text-cat-teal" : "text-cat-amber"}`}>
          {[0, 1].map((r) => (
            <span key={r} className={`${cell} text-center`}>
              {c < shown ? fr(cols[c][r]) : "\u00a0"}
            </span>
          ))}
        </span>
      ))}
      <span className="w-1 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
    </span>
  );
}

/** A spot on the card as a list, fractions shown as fractions; each number names its slot on hover. */
function FTup({ v }: { v: XY }) {
  return (
    <span className="font-mono whitespace-nowrap">
      (
      {v.map((n, i) => (
        <span key={i}>
          {i > 0 && ", "}
          <span
            tabIndex={0}
            aria-label={`${fr(n)} ${SPOT_SLOTS[i]}`}
            className="group/tup relative cursor-help underline decoration-foreground/30 decoration-dotted underline-offset-2 outline-none"
          >
            {fr(n)}
            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 font-sans text-[0.7rem] whitespace-nowrap text-background opacity-0 transition-opacity group-hover/tup:opacity-100 group-focus/tup:opacity-100 motion-reduce:transition-none">
              {SPOT_SLOTS[i]}
            </span>
          </span>
        </span>
      ))}
      )
    </span>
  );
}

/** A small picture of what a lens does to a stencil: the ghost, and the light after the lens. */
function LensPic({ pic, cols, size = 58 }: { pic: Pic; cols: Cols; size?: number }) {
  const main = pic === "flower" ? FLOWER : pic === "heart" ? HEART : SQ;
  const pts: XY[] = [...main, ...main.map(glide(cols, 1)), [0, 0]];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const S = Math.max(x1 - x0, y1 - y0, 1) * 1.12;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const f = makeFrame(cx - S / 2, cx + S / 2, cy - S / 2, cy + S / 2, (size - 6) / S, 3);
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect x={0} y={0} width={f.W} height={f.H} rx={4} fill="#fffdf7" stroke="#d6d3d1" />
      <path d={`M${f.sx(0)} 0V${f.H}M0 ${f.sy(0)}H${f.W}`} stroke={PK.chalk} strokeOpacity={0.35} strokeWidth={0.6} />
      <Print f={f} pic={pic} look="ghost" soft />
      <Print f={f} pic={pic} move={glide(cols, 1)} look="light" />
    </svg>
  );
}

/** The run clock: `phases` lenses in turn, `frames` ticks each. t(i) is lens i's progress. */
function useRun(ms = 1100, frames = 22) {
  const p = usePlay(ms / frames);
  return {
    running: p.running,
    t: (i: number) => clamp01(p.k / frames - i),
    play: (phases: number, done?: () => void) => p.play(frames * phases, done),
  };
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The painting traced on পলিথিন, the ghost of the 5-ঘর
//     stencil on the card. Four cards: Nasib's flipped numbers, Samin's H,
//     the unknown bag lens, Karim's "never". Sealing acts it out: the glass
//     lights, the beam goes, a "?" hangs over the ghost.

const F1 = makeFrame(-2.5, 5.5, -2.5, 5.5, 22, 8); // 192 × 192
const X1_CARDS: { who: string; line: string; cols: Cols | null; fill: string; letter?: string }[] = [
  { who: "নাসিব", line: "সব সংখ্যা উল্টাও", cols: NASIB, fill: GLASS_FILL.nasib },
  { who: "সামিন", line: "ছোট করলেই তো হয়", cols: LENS_H, fill: GLASS_FILL.H, letter: "H" },
  { who: "ঝোলার lens", line: "কেউ চেনে না", cols: G_INV, fill: GLASS_FILL.bag, letter: "?" },
  { who: "করিম", line: "রং একবার দিলে আর ফেরে না", cols: null, fill: "white" },
];
const PAINT_FLOWER: Move = glide(G, 1);

function BetGlass({ i, lit = false, size = 32 }: { i: number; lit?: boolean; size?: number }) {
  const c = X1_CARDS[i];
  return <GlassIcon fill={c.fill} letter={c.letter} none={!c.cols} lit={lit} size={size} />;
}

export function UndoBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(450);
  const k = !sealed ? 0 : act.running ? act.k : 4;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(4, () => pass("বাজি সিল হলো। আগে সবচেয়ে সোজা lens।"));
  };
  return (
    <>
      <RunRow
        glasses={[bet === null ? <GlassIcon key="e" fill="white" empty size={30} /> : <BetGlass key={bet} i={bet} lit={k >= 1} size={30} />]}
        lit={k >= 1 && k < 3 ? 0 : -1}
        end={k >= 3 ? <span className={`font-mono font-bold text-cat-blue ${POP}`}>?</span> : undefined}
      />
      <CardSheet f={F1} label="card এ রিনার 5 ঘরের ফুলের dashed দাগ; পলিথিনে আঁকা দেয়ালের 15 ঘরের ফুল; কোন lens এ ফেরে, প্রশ্নবোধক" className="max-w-[12rem]">
        <Print f={F1} pic="flower" move={PAINT_FLOWER} look="paint" />
        <Print f={F1} pic="flower" look="ghost" />
        {k >= 2 && <SheetBeam f={F1} to={[0.5, 0.5]} />}
        {k >= 3 && (
          <text x={F1.sx(0.5)} y={F1.sy(0.5) + 9} textAnchor="middle" fontSize={28} fontWeight={800} fill={BLUE} className={POP}>
            ?
          </text>
        )}
      </CardSheet>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex flex-col gap-0.5 text-sm leading-tight">
              <span className="flex items-center gap-1.5">
                {c.cols ? <FLens cols={c.cols} small /> : <BetGlass i={i} size={26} />}
                <span className="font-semibold">{c.who}</span>
              </span>
              <span className="text-xs text-muted">{c.line}</span>
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={bet === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 4}>কোন card দিলে ফুল ঠিক dashed দাগে ফিরবে? একটা বেছে নিয়ে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The plain glass. Two runs through it: Rina's খাতার ফুল (the stencil's
//     own shape) lands on itself, the ঘর's two sides drawn as e₁, e₂ and
//     staying put; the wall's ফুল comes out as it went in, 15 ঘর।

const X2_RUNS = [
  { key: "khata", label: "খাতার ফুল চালান" },
  { key: "wall", label: "দেয়ালের ফুল চালান" },
] as const;

export function PlainGlass() {
  const pass = useGate();
  const [done, setDone] = useSeed<boolean[]>("done", [false, false]);
  const [cur, setCur] = useSeed<0 | 1>("cur", 0);
  const run = useRun(1000, 20);
  const go = (i: 0 | 1) => {
    if (run.running) return;
    setCur(i);
    run.play(1, () => {
      const nd = done.map((v, j) => v || j === i);
      setDone(nd);
      if (nd.every(Boolean)) pass("সাদা কাঁচ কিছুই বদলায় না।");
    });
  };
  const settled = !run.running && done[cur];
  const t = run.running ? run.t(0) : done[cur] ? 1 : 0;
  const src: Move = cur === 1 ? PAINT_FLOWER : ID_MOVE;
  return (
    <>
      <RunRow from={cur === 1 ? "দেয়ালের ফুল" : "খাতার ফুল"} glasses={[<GlassIcon key="c" fill={GLASS_FILL.clear} lit={run.running} size={30} />]} />
      <CardSheet f={F1} label="সাদা কাঁচ দিয়ে চালানো: খাতার ফুল যেখানে ছিলো সেখানেই পড়ে, এক ঘরের দুই পাশ e1 আর e2 তে; দেয়ালের ফুল 15 ঘরই থাকে" className="max-w-[12rem]">
        {cur === 1 && <Print f={F1} pic="flower" move={src} look="paint" soft />}
        <Print f={F1} pic="flower" look="ghost" />
        {run.running && <SheetBeam f={F1} to={cur === 1 ? [1.5, 1.5] : [0.5, 0.5]} />}
        {t > 0 && (
          <g opacity={t}>
            <Print f={F1} pic="flower" move={src} look="light" />
          </g>
        )}
        {settled && cur === 0 && (
          <g key={`e${done.join()}`}>
            <Arrow f={F1} from={[0, 0]} to={[1, 0]} tone="amber" draw w={2.4} />
            <Arrow f={F1} from={[0, 0]} to={[0, 1]} tone="teal" draw w={2.4} delay={200} />
          </g>
        )}
      </CardSheet>
      <div className="mt-1.5 min-h-6">
        {settled && (cur === 0 ? <Verdict ok>একই মাপ, একই জায়গা</Verdict> : <Verdict ok={false}>এখনো 15 ঘর</Verdict>)}
      </div>
      <div className="mt-1.5 flex flex-wrap justify-center gap-2">
        {X2_RUNS.map((r, i) => (
          <button key={r.key} type="button" className={done[i] ? quietBtn : primaryBtn} disabled={run.running} onClick={() => go(i as 0 | 1)}>
            {r.label}
          </button>
        ))}
      </div>
      <Task done={done.every(Boolean) && !run.running}>দুইটা ফুলই সাদা কাঁচ দিয়ে চালান। দেখুন, card এ কী পড়ে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Two easy undos. Tab L: the heart through L (twice as big), then the
//     reader's pick from the bag: L again · H ✓ · the turn back. Tab turn:
//     the মেহেদি hand turned 90° to the left, then: the turn again · the
//     আয়না · the turn back ✓. The machine runs the lens, then the pick.

const F3H = makeFrame(-0.6, 3.4, -2.2, 2.4, 40, 8); // 176 × 200
const F3T = makeFrame(-1.5, 1.5, -1.5, 1.5, 58, 8); // 190 × 190
const X3_TABS: { name: string; f: Frame; pic: Pic; lens: Cols; fill: string; opts: { cols: Cols; fill: string; letter: string }[]; right: number; nope: string[] }[] = [
  {
    name: "L এর heart",
    f: F3H,
    pic: "heart",
    lens: LENS_L,
    fill: GLASS_FILL.L,
    opts: [
      { cols: LENS_L, fill: GLASS_FILL.L, letter: "L" },
      { cols: LENS_H, fill: GLASS_FILL.H, letter: "H" },
      { cols: TURN_BACK, fill: GLASS_FILL.turn, letter: "" },
    ],
    right: 1,
    nope: ["heart আরো দুইগুণ হলো। এখন stencil এর চারগুণ। বড় করার উল্টা কী?", "", "heart ডানে ঘুরে গেলো, মাপ এখনো দুইগুণ। L তো ঘোরায় নি, বড় করেছিলো।"],
  },
  {
    name: "ঘোরানো হাত",
    f: F3T,
    pic: "hand",
    lens: TURN,
    fill: GLASS_FILL.turn,
    opts: [
      { cols: TURN, fill: GLASS_FILL.turn, letter: "" },
      { cols: MIRROR, fill: GLASS_FILL.mirror, letter: "M" },
      { cols: TURN_BACK, fill: GLASS_FILL.turn, letter: "" },
    ],
    right: 2,
    nope: ["হাত আরো একবার বামে ঘুরলো। আঙুল এখন নিচের দিকে।", "হাত উল্টে গেলো, বুড়ো আঙুল অন্য পাশে। ঘোরা ফেরে ঘোরা দিয়েই।", ""],
  },
];

export function EasyUndo() {
  const pass = useGate();
  const [tab, setTab] = useSeed<0 | 1>("tab", 0);
  const [picks, setPicks] = useSeed<(number | null)[]>("picks", [null, null]);
  const [solved, setSolved] = useSeed<boolean[]>("solved", [false, false]);
  const [miss, setMiss] = useSeed("miss", 0);
  const run = useRun(1000, 20);
  const T = X3_TABS[tab];
  const F3 = T.f;
  const pick = picks[tab];
  const choose = (i: number) => {
    if (run.running || solved[tab]) return;
    const np = picks.map((v, j) => (j === tab ? i : v));
    setPicks(np);
    run.play(2, () => {
      if (i !== T.right) {
        setMiss((m) => m + 1);
        return;
      }
      const ns = solved.map((v, j) => v || j === tab);
      setSolved(ns);
      if (ns.every(Boolean)) pass("বড়র ফেরা ছোট, বামে ঘোরার ফেরা ডানে।");
    });
  };
  const t0 = run.running ? run.t(0) : 1;
  const t1 = run.running ? run.t(1) : pick === null ? 0 : 1;
  const move = pick === null ? glide(T.lens, 1) : chain(glide(T.lens, t0), glide(T.opts[pick].cols, t1));
  const landed = pick !== null && !run.running;
  const opt = (o: { fill: string; letter: string; cols: Cols }) => <GlassIcon fill={o.fill} letter={o.letter} back size={26} />;
  return (
    <>
      <div className="mb-1.5 flex justify-center gap-2">
        {X3_TABS.map((x, i) => (
          <button key={x.name} type="button" className={`cursor-pointer rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors motion-reduce:transition-none ${tab === i ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"}`} disabled={run.running} onClick={() => setTab(i as 0 | 1)}>
            {solved[i] && <Mark ok size={12} />} {x.name}
          </button>
        ))}
      </div>
      <RunRow
        from="stencil"
        glasses={[<GlassIcon key="l" fill={T.fill} letter={tab === 0 ? "L" : ""} size={26} />, pick === null ? <GlassIcon key="p" fill="white" empty size={26} /> : <span key={`p${pick}`}>{opt(T.opts[pick])}</span>]}
        lit={run.running ? (run.t(0) < 1 ? 0 : 1) : -1}
      />
      <CardSheet f={F3} label="stencil প্রথম lens দিয়ে যায়, তারপর বেছে নেওয়া ফেরার lens দিয়ে; ঠিকটা হলে ছবি dashed দাগে ফেরে" className="max-w-[12rem]">
        <Print f={F3} pic={T.pic} look="ghost" />
        {pick !== null && !run.running && <Print f={F3} pic={T.pic} move={glide(T.lens, 1)} look="paint" soft />}
        <Print f={F3} pic={T.pic} move={move} look="light" />
      </CardSheet>
      <div className="mt-1 min-h-6">{landed && <Verdict ok={pick === T.right} />}</div>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {T.opts.map((o, i) => (
          <Choice key={`${tab}${i}`} n={i} look={pick === i && landed ? (i === T.right ? "right" : "wrong") : "idle"} disabled={run.running || solved[tab]} onClick={() => choose(i)}>
            <LensPic pic={T.pic} cols={o.cols} size={54} />
          </Choice>
        ))}
      </div>
      {landed && pick !== T.right && <Nope key={miss}>{T.nope[pick]}</Nope>}
      <Task done={solved.every(Boolean) && !run.running}>দুইটা tab এই ফেরার lens বেছে নিন। ঠিকটা হলে ছবি dashed দাগে ফেরে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Predict, then Nasib's lens. Guess: ফেরে · ছোট কিন্তু হেলানো · আরো বড়
//     ✓. Then the painting runs through [[½, 1], [1, ½]]: it grows, 11.25 ঘর,
//     slanted, far past the dashed stencil.

const F4 = makeFrame(-3, 7.5, -3, 7.5, 18, 8); // 205 × 205
const X4_OPTS = ["ফুল ফেরত আসবে। 5 ঘর, dashed দাগের উপর।", "ছোট হবে, কিন্তু হেলানো থাকবে।", "উল্টা আরো বড় হবে।"];
const X4_RIGHT = 2;
const X4_AREA = polyArea(mapPts(onto(NASIB, G), FLOWER));

export function OneOverEach() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);
  const run = useRun(1400, 28);
  const go = () => {
    if (guess === null || run.running || ran) return;
    run.play(1, () => {
      setRan(true);
      pass("সংখ্যা উল্টালে lens উল্টায় না।");
    });
  };
  const t = run.running ? run.t(0) : ran ? 1 : 0;
  const over = ran && !run.running;
  const now = polyArea(FLOWER.map(chain(PAINT_FLOWER, glide(NASIB, t))));
  return (
    <>
      <RunRow from="পলিথিন" glasses={[<GlassIcon key="n" fill={GLASS_FILL.nasib} letter="½" lit={run.running} size={28} />]} end={<span className="ml-1 text-sm font-bold"><span className="font-mono">{area(now)}</span> ঘর</span>} />
      <CardSheet f={F4} label="দেয়ালের ফুল নাসিবের lens দিয়ে যায়; ফুল ছোট না হয়ে 11 ঘরের বেশি হয়, হেলানো, dashed stencil থেকে অনেক দূরে" className="max-w-[12.5rem]">
        {t > 0 && <Print f={F4} pic="flower" move={PAINT_FLOWER} look="paint" soft />}
        <Print f={F4} pic="flower" look="ghost" />
        {run.running && <SheetBeam f={F4} to={[2.5, 2.5]} />}
        <Print f={F4} pic="flower" move={chain(PAINT_FLOWER, glide(NASIB, t))} look={t > 0 ? "light" : "paint"} />
      </CardSheet>
      <div className="mt-1 min-h-6">{over && <Verdict ok={false}>5 নয়, {area(X4_AREA)} ঘর</Verdict>}</div>
      <div className="mt-1 grid gap-1.5">
        {X4_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, X4_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="text-sm">{o}</span>
          </Choice>
        ))}
      </div>
      {guess !== null && !ran && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={primaryBtn} disabled={run.running} onClick={go}>
            নাসিবের lens দিয়ে চালান
          </button>
        </div>
      )}
      <Task done={over}>আগে guess দিন, তারপর নাসিবের lens দিয়ে দেয়ালের ফুল চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Who lands here. Two dots on the card, dragged on a ⅓-grid; each
//     throws its light through G (a glow, joined by a dashed line). The
//     first dot's light must sit on e₁, then the second's on e₂. A dot that
//     makes it locks as an arrow: G⁻¹'s two columns.

const F5 = makeFrame(-2, 2, -2, 2, 48, 8); // 208 × 208
const X5_TARGET: XY[] = [
  [1, 0],
  [0, 1],
];
const X5_START: XY[] = [
  [1 / 3, 0],
  [0, 1 / 3],
];
const X5_TONE: string[] = [AMBER, TEAL];

/** a dot the reader drags, its light through the lens, and its target corner */
function HuntDot({ f, p, light, tone, active, locked }: { f: Frame; p: XY; light: XY; tone: string; active: boolean; locked: boolean }) {
  return (
    <g className="pointer-events-none">
      {!locked && <path d={`M${f.sx(p[0])} ${f.sy(p[1])}L${f.sx(light[0])} ${f.sy(light[1])}`} stroke={tone} strokeOpacity={0.5} strokeWidth={1.1} strokeDasharray="3 3" />}
      <circle cx={f.sx(light[0])} cy={f.sy(light[1])} r={11} fill={PK.glow} opacity={0.35} />
      <circle cx={f.sx(light[0])} cy={f.sy(light[1])} r={5.5} fill={PK.glow} stroke={PK.lamp} strokeWidth={1.4} />
      <circle cx={f.sx(p[0])} cy={f.sy(p[1])} r={active ? 7 : 5.5} fill={tone} stroke="white" strokeWidth={2} />
    </g>
  );
}

/** the two target corners, e₁ and e₂, as dashed rings */
function Targets({ f, hit }: { f: Frame; hit: boolean[] }) {
  return (
    <g className="pointer-events-none">
      {X5_TARGET.map((q, i) => (
        <g key={i}>
          <circle cx={f.sx(q[0])} cy={f.sy(q[1])} r={9} fill="none" stroke={X5_TONE[i]} strokeWidth={1.6} strokeDasharray={hit[i] ? undefined : "3 2"} />
          <text x={f.sx(q[0]) + (i ? -12 : 4)} y={f.sy(q[1]) + (i ? -8 : 20)} textAnchor={i ? "end" : "start"} fontSize={11} fontWeight={800} fontFamily={MONO} fill={X5_TONE[i]}>
            {i ? "e₂" : "e₁"}
          </text>
        </g>
      ))}
    </g>
  );
}

export function WhoLandsHere() {
  const pass = useGate();
  const [pts, setPts] = useSeed<XY[]>("pts", X5_START);
  const [locked, setLocked] = useSeed<boolean[]>("locked", [false, false]);
  const active = !locked[0] ? 0 : !locked[1] ? 1 : -1;
  const lights = pts.map((p) => apply(G, p));
  const [a0, a1, b0, b1] = useTween([...lights[0], ...lights[1]], 160);
  const shown: XY[] = [
    [a0, a1],
    [b0, b1],
  ];
  const place = (raw: XY) => {
    if (active < 0) return;
    const q: XY = [Math.max(-2, Math.min(2, Math.round(raw[0] * 3) / 3)), Math.max(-2, Math.min(2, Math.round(raw[1] * 3) / 3))];
    if (near(q, pts[active])) return;
    setPts(pts.map((p, i) => (i === active ? q : p)));
    if (near(apply(G, q), X5_TARGET[active])) {
      const nl = locked.map((v, i) => v || i === active);
      setLocked(nl);
      if (nl.every(Boolean)) pass("কে এসে e₁ এ পড়ে, সেটাই ফেরার প্রথম পাশ।");
    }
  };
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const d: Record<string, XY> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    const s = d[e.key];
    if (!s || active < 0) return;
    e.preventDefault();
    place([pts[active][0] + s[0] / 3, pts[active][1] + s[1] / 3]);
  };
  const cur = active < 0 ? 1 : active;
  return (
    <>
      <CardSheet f={F5} fine={3} label="card এ দুইটা বিন্দু টানা যায়, তিন ভাগের এক ঘর করে; প্রতিটার আলো G দিয়ে কোথায় পড়ে তা হলুদ দাগে; প্রথমটার আলো e1 এ, দ্বিতীয়টার e2 তে বসাতে হবে" drag={{ down: place, move: place }} onKey={key} className="max-w-[13rem]">
        <Targets f={F5} hit={locked} />
        {pts.map((p, i) =>
          locked[i] ? (
            <g key={i}>
              <Arrow f={F5} from={[0, 0]} to={p} tone={i ? "teal" : "amber"} w={2.4} list={`(${fr(p[0])}, ${fr(p[1])})`} draw />
              <HuntDot f={F5} p={p} light={shown[i]} tone={X5_TONE[i]} active={false} locked />
            </g>
          ) : (
            i === active && <HuntDot key={i} f={F5} p={p} light={shown[i]} tone={X5_TONE[i]} active locked={false} />
          ),
        )}
      </CardSheet>
      <div className="mt-2 flex min-h-12 flex-col items-center gap-1 text-sm">
        {active >= 0 ? (
          <>
            <div>
              <span style={{ color: X5_TONE[cur] }} className="font-semibold">
                {cur ? "দ্বিতীয় বিন্দু" : "প্রথম বিন্দু"}
              </span>{" "}
              <FTup v={pts[cur]} />
            </div>
            <div className="flex items-center gap-1.5">
              <RowArrow /> G এর আলো পড়লো <FTup v={lights[cur]} />
            </div>
          </>
        ) : (
          <div className={`flex items-center gap-2 ${POP}`}>
            <span className="text-muted">দুই বিন্দু, দুই column:</span>
            <FLens cols={[pts[0], pts[1]]} />
          </div>
        )}
      </div>
      <Task done={active < 0}>প্রথম বিন্দুটা টেনে এমন জায়গায় রাখুন, যাতে তার আলো e₁ এ পড়ে। তারপর দ্বিতীয়টার আলো e₂ তে। হালকা দাগ গুলো এক ঘরের তিন ভাগের এক।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · G⁻¹ on the wall. Three runs: the painting through G⁻¹ (15 → 5 ঘর, onto
//     the ghost); the খাতার ফুল through G⁻¹ then G; and through G then G⁻¹.
//     The ঘর count runs as the picture moves.

const X6_RUNS: { label: string; src: Move; lenses: Cols[]; names: string[] }[] = [
  { label: "দেয়ালের ফুল, G⁻¹ দিয়ে", src: PAINT_FLOWER, lenses: [G_INV], names: ["G⁻¹"] },
  { label: "খাতার ফুল: আগে G⁻¹, তারপর G", src: ID_MOVE, lenses: [G_INV, G], names: ["G⁻¹", "G"] },
  { label: "খাতার ফুল: আগে G, তারপর G⁻¹", src: ID_MOVE, lenses: [G, G_INV], names: ["G", "G⁻¹"] },
];

function NamedGlass({ name, lit = false, size = 28 }: { name: string; lit?: boolean; size?: number }) {
  const back = name.includes("⁻¹");
  return <GlassIcon fill={back ? GLASS_FILL.bag : GLASS_FILL.G} letter={name} back={back} lit={lit} size={size} />;
}

export function UndoOnWall() {
  const pass = useGate();
  const [done, setDone] = useSeed<boolean[]>("done", [false, false, false]);
  const [cur, setCur] = useSeed("cur", 0);
  const run = useRun(1100, 22);
  const R = X6_RUNS[cur];
  const go = (i: number) => {
    if (run.running) return;
    setCur(i);
    run.play(X6_RUNS[i].lenses.length, () => {
      const nd = done.map((v, j) => v || j === i);
      setDone(nd);
      if (nd.every(Boolean)) pass("G, তারপর G⁻¹: সাদা কাঁচ। উল্টা order এও।");
    });
  };
  const settled = !run.running && done[cur];
  const ts = R.lenses.map((_, i) => (run.running ? run.t(i) : done[cur] ? 1 : 0));
  const move = chain(R.src, ...R.lenses.map((c, i) => glide(c, ts[i])));
  const n = polyArea(FLOWER.map(move));
  const litAt = run.running ? ts.findIndex((v) => v < 1) : -1;
  return (
    <>
      <RunRow from={cur === 0 ? "পলিথিন" : "খাতা"} glasses={R.names.map((nm, i) => <NamedGlass key={`${cur}${i}`} name={nm} lit={litAt === i} size={28} />)} end={<span className="ml-1 text-sm font-bold"><span className="font-mono">{area(n)}</span> ঘর</span>} />
      <CardSheet f={F1} label="G inverse দিয়ে চালানো: দেয়ালের 15 ঘরের ফুল 5 ঘরে ফেরে, dashed stencil এর উপর; খাতার ফুল G আর G inverse দুই order এই যেখানে ছিলো সেখানে ফেরে" className="max-w-[12rem]">
        {cur === 0 && <Print f={F1} pic="flower" move={PAINT_FLOWER} look="paint" soft />}
        <Print f={F1} pic="flower" look="ghost" />
        {run.running && <SheetBeam f={F1} to={[0.5, 0.5]} />}
        <Print f={F1} pic="flower" move={move} look="light" />
      </CardSheet>
      <div className="mt-1 min-h-6">{settled && <Verdict ok>{cur === 0 ? "15 ঘর থেকে 5 ঘর" : "আগের জায়গায় ফিরলো"}</Verdict>}</div>
      <div className="mt-1 grid gap-1.5">
        {X6_RUNS.map((r, i) => (
          <button key={r.label} type="button" className={`${done[i] ? quietBtn : primaryBtn} h-10! justify-center text-sm`} disabled={run.running} onClick={() => go(i)}>
            {done[i] && <Mark ok size={13} />}
            {r.label}
          </button>
        ))}
      </div>
      <Task done={done.every(Boolean) && !run.running}>তিনটা run ই চালান। প্রতিবার দেখুন ফুল dashed দাগে বসে কিনা।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn (Check Q3). The heart painted through [[2, 0], [0, 5]]. Two
//     dots on a 1/10 grid, each with its light through the লম্বা lens; no
//     locking. "চালান" swaps to the run: the painting through the lens the
//     two dots make. Wrong dots throw the heart too wide, too tall, slanted.

const F7 = makeFrame(-0.6, 1.6, -0.6, 1.6, 88, 8); // 210 × 210
const F7R = makeFrame(-0.8, 2.6, -0.6, 5.4, 32, 8); // 125 × 208
const X7_START: XY[] = [
  [0.3, 0],
  [0, 0.4],
];
const X7_RIGHT: Cols = [
  [0.5, 0],
  [0, 0.2],
];
const PAINT_HEART: Move = glide(TALL, 1);

/** what the heart looks like after the reader's lens, in words */
const x7Nope = (B: Cols, pts: readonly XY[]) => {
  const M = onto(B, TALL);
  const bits: string[] = [];
  if (Math.abs(det(M)) < 1e-6) bits.push("চ্যাপ্টা হয়ে একটা দাগ");
  else {
    if (det(M) < 0) bits.push("উল্টে গেছে");
    if (Math.abs(M[0][1]) + Math.abs(M[1][0]) > 1e-6) bits.push("হেলে গেছে");
    const w = Math.abs(M[0][0]);
    const h = Math.abs(M[1][1]);
    if (w > 1.05) bits.push("পাশে বেশি চওড়া");
    else if (w < 0.95) bits.push("পাশে সরু");
    if (h > 1.05) bits.push("বেশি লম্বা");
    else if (h < 0.95) bits.push("বেঁটে");
  }
  const miss = [0, 1].filter((i) => !near(apply(TALL, pts[i]), X5_TARGET[i]));
  const where = miss.map((i) => (i ? "দ্বিতীয় বিন্দুর আলো e₂ তে পড়ে নি" : "প্রথম বিন্দুর আলো e₁ এ পড়ে নি")).join(", ");
  return `Heart ${bits.join(", ")}. ${where}.`;
};

export function YourUndo() {
  const pass = useGate();
  const [pts, setPts] = useSeed<XY[]>("pts", X7_START);
  const [sel, setSel] = useSeed("sel", 0);
  const [view, setView] = useSeed<"hunt" | "run">("view", "hunt");
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useSeed("miss", 0);
  const run = useRun(1300, 26);
  const B: Cols = [pts[0], pts[1]];
  const right = sameCols(B, X7_RIGHT);
  const lights = pts.map((p) => apply(TALL, p));
  const [a0, a1, b0, b1] = useTween([...lights[0], ...lights[1]], 160);
  const shown: XY[] = [
    [a0, a1],
    [b0, b1],
  ];
  const snap = (v: number) => Math.max(-0.6, Math.min(1.6, Math.round(v * 10) / 10));
  const down = (raw: XY) => {
    const i = Math.hypot(raw[0] - pts[0][0], raw[1] - pts[0][1]) <= Math.hypot(raw[0] - pts[1][0], raw[1] - pts[1][1]) ? 0 : 1;
    setSel(i);
    moveTo(raw, i);
  };
  const moveTo = (raw: XY, i = sel) => {
    const q: XY = [snap(raw[0]), snap(raw[1])];
    if (near(q, pts[i])) return;
    setPts(pts.map((p, j) => (j === i ? q : p)));
  };
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const d: Record<string, XY> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (e.key === " ") {
      e.preventDefault();
      setSel(sel ? 0 : 1);
      return;
    }
    const s = d[e.key];
    if (!s) return;
    e.preventDefault();
    moveTo([pts[sel][0] + s[0] / 10, pts[sel][1] + s[1] / 10]);
  };
  const go = () => {
    if (run.running) return;
    setView("run");
    setRan(false);
    run.play(1, () => {
      setRan(true);
      if (right) pass("টানের ফেরা: 2 এর জায়গায় ½, 5 এর জায়গায় ⅕।");
      else setMiss((m) => m + 1);
    });
  };
  const t = run.running ? run.t(0) : ran ? 1 : 0;
  const landed = view === "run" && ran && !run.running;
  return (
    <>
      {view === "hunt" ? (
        <>
          <CardSheet f={F7} fine={10} label="card এ দুইটা বিন্দু, দশ ভাগের এক ঘর করে সরে; প্রতিটার আলো লম্বা lens দিয়ে কোথায় পড়ে তা হলুদ দাগে; e1 আর e2 কোনা দাগানো" drag={{ down, move: (p) => moveTo(p) }} onKey={key} className="max-w-[13rem]">
            <Targets f={F7} hit={[false, false]} />
            {pts.map((p, i) => (
              <HuntDot key={i} f={F7} p={p} light={shown[i]} tone={X5_TONE[i]} active={sel === i} locked={false} />
            ))}
          </CardSheet>
          <div className="mt-2 flex flex-col items-center gap-0.5 text-sm">
            {pts.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span style={{ color: X5_TONE[i] }} className="font-semibold">
                  {i ? "দ্বিতীয়" : "প্রথম"}
                </span>
                <FTup v={p} />
                <RowArrow />
                <span className="text-muted">আলো</span>
                <FTup v={lights[i]} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center">
            <button type="button" className={primaryBtn} onClick={go}>
              এই দুই বিন্দুর lens দিয়ে heart চালান
            </button>
          </div>
        </>
      ) : (
        <>
          <RunRow glasses={[<FLens key="b" cols={B} small />]} />
          <CardSheet f={F7R} label="দেয়ালের লম্বা heart আপনার বানানো lens দিয়ে যায়; ঠিক হলে ছোট heart এর dashed দাগে বসে" className="max-w-[8rem]">
            <Print f={F7R} pic="heart" move={PAINT_HEART} look="paint" soft />
            <Print f={F7R} pic="heart" look="ghost" />
            {run.running && <SheetBeam f={F7R} to={[0.5, 1.5]} />}
            <Print f={F7R} pic="heart" move={chain(PAINT_HEART, glide(B, t))} look="light" />
          </CardSheet>
          <div className="mt-1 min-h-6">{landed && <Verdict ok={right} />}</div>
          {landed && !right && <Nope key={miss}>{x7Nope(B, pts)}</Nope>}
          {landed && !right && (
            <div className="mt-2 flex justify-center">
              <button type="button" className={quietBtn} onClick={() => setView("hunt")}>
                বিন্দু আবার সরান
              </button>
            </div>
          )}
        </>
      )}
      <Task done={landed && right}>Heart এর ফেরার lens বানান: দুইটা বিন্দু বসান, তারপর দেয়ালের heart চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it. The মেহেদি hand thrown through the আয়না: a left hand. Three
//     lenses, as pictures: H · M ✓ · the turn back. Each pick runs the
//     painting through it.

const F8 = makeFrame(-1.6, 1.6, -1.6, 1.6, 54, 8); // 189 × 189
const X8_OPTS: { cols: Cols; fill: string; letter: string }[] = [
  { cols: LENS_H, fill: GLASS_FILL.H, letter: "H" },
  { cols: MIRROR, fill: GLASS_FILL.mirror, letter: "M" },
  { cols: TURN_BACK, fill: GLASS_FILL.turn, letter: "" },
];
const X8_RIGHT = 1;
const X8_NOPE = ["হাত অর্ধেক মাপের হলো, আর এখনো বাম হাত। বুড়ো আঙুল দেখুন।", "", "হাত ঘুরে গেলো, আঙুল এখন ডানে। বুড়ো আঙুল এখনো ভুল পাশে।"];
const PAINT_HAND: Move = glide(MIRROR, 1);

export function TryUndo() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const run = useRun(1100, 22);
  const choose = (i: number) => {
    if (run.running) return;
    setPick(i);
    run.play(1, () => (i === X8_RIGHT ? pass("আয়নার ফেরা আয়না নিজেই।") : setMiss((m) => m + 1)));
  };
  const t = pick === null ? 0 : run.running ? run.t(0) : 1;
  const landed = pick !== null && !run.running;
  return (
    <>
      <RunRow glasses={[pick === null ? <GlassIcon key="e" fill="white" empty size={28} /> : <GlassIcon key={pick} fill={X8_OPTS[pick].fill} letter={X8_OPTS[pick].letter} back lit={run.running} size={28} />]} />
      <CardSheet f={F8} label="দেয়ালের বাম হাত বেছে নেওয়া lens দিয়ে যায়; ঠিকটা হলে ডান হাত হয়ে dashed stencil এ বসে" className="max-w-[11.5rem]">
        <Print f={F8} pic="hand" move={PAINT_HAND} look="paint" soft />
        <Print f={F8} pic="hand" look="ghost" />
        {pick !== null && <Print f={F8} pic="hand" move={chain(PAINT_HAND, glide(X8_OPTS[pick].cols, t))} look="light" />}
      </CardSheet>
      <div className="mt-1 min-h-6">{landed && <Verdict ok={pick === X8_RIGHT} />}</div>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {X8_OPTS.map((o, i) => (
          <Choice key={i} n={i} look={pick === i && landed ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={run.running || (pick === X8_RIGHT && landed)} onClick={() => choose(i)}>
            <LensPic pic="hand" cols={o.cols} size={54} />
          </Choice>
        ))}
      </div>
      {landed && pick !== X8_RIGHT && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={landed && pick === X8_RIGHT}>কোন lens হাতটাকে আবার ডান হাত বানিয়ে dashed দাগে বসাবে? ছবি দেখে বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The bet opened. The four cards from the মাদুর, one by one: each runs
//     the painting through its lens and says what came out. Karim's card runs
//     the bag lens: it does come back.

const X9_SAY = ["11 ঘরের বেশি, হেলানো। হারলো।", "3.75 ঘর। ছোট হলো, কিন্তু হেলানো। হারলো।", "ঠিক 5 ঘর, dashed দাগের উপর। এটাই G⁻¹।", "ফেরে। অন্তত G এর বেলায়। হারলো।"];
const X9_RIGHT = 2;

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const run = useRun(1200, 24);
  const tap = (i: number) => {
    if (run.running || open.includes(i)) return;
    setCur(i);
    run.play(1, () => {
      const next = [...open, i];
      setOpen(next);
      if (next.length === X1_CARDS.length) pass("ঝোলার অচেনা lens টাই ছিলো G⁻¹।");
    });
  };
  const lens = cur === null ? I2 : (X1_CARDS[cur].cols ?? G_INV);
  const t = cur === null ? 0 : run.running ? run.t(0) : 1;
  const F = F1;
  return (
    <>
      <RunRow glasses={[cur === null ? <GlassIcon key="e" fill="white" empty size={28} /> : <BetGlass key={cur} i={cur === 3 ? 2 : cur} lit={run.running} size={28} />]} />
      <CardSheet f={F} label="বাজির চারটা card এর lens দিয়ে দেয়ালের ফুল একটা একটা করে চালানো; শুধু ঝোলার lens এ ফুল dashed stencil এ ফেরে" className="max-w-[11rem]">
        <Print f={F} pic="flower" move={PAINT_FLOWER} look="paint" soft />
        <Print f={F} pic="flower" look="ghost" />
        {cur !== null && <Print f={F} pic="flower" move={chain(PAINT_FLOWER, glide(lens, t))} look="light" />}
      </CardSheet>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => {
          const shown = open.includes(i);
          return (
            <Choice key={c.who} n={i} look={shown ? (i === X9_RIGHT ? "right" : "wrong") : "idle"} disabled={run.running || shown} onClick={() => tap(i)}>
              <span className="flex flex-col text-sm leading-tight">
                <span className="font-semibold">{c.who}</span>
                {shown ? <span className={`text-xs ${FADE}`}>{X9_SAY[i]}</span> : <span className="text-xs text-muted">{c.line}</span>}
              </span>
            </Choice>
          );
        })}
      </div>
      <Task done={open.length === X1_CARDS.length && !run.running}>মাদুরের চারটা card একটা একটা করে খুলুন। প্রতিটার lens দিয়ে ফুল চালানো হবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage bits for the story scenes: the উঠান the morning after the rain. The
// wall (light-kit's StageWall) carries the week's paintings: the ফুল through
// G, the two মেহেদি hands, the door piece.

const SW: [number, number] = [8, 30]; // the stage wall's top-left
const PJ: [number, number] = [214, 150]; // the machine's feet
const onStage = (p: XY): [number, number] => [SW[0] + STAGE_WALL_F.sx(p[0]), SW[1] + STAGE_WALL_F.sy(p[1])];
const small = (pts: readonly XY[], s: number, at: XY): XY[] => pts.map((p) => [p[0] * s + at[0], p[1] * s + at[1]]);
const ST_FLOWER = small(mapPts(G, FLOWER), 0.34, [-2.2, -0.9]);
const ST_DOOR = small(mapPts(G, FLOWER), 0.3, [5.6, 3.2]);
const ST_HAND_Z = small(
  HAND.map(([x, y]) => [-x, y] as XY),
  1.5,
  [3.6, 0.2],
);
const ST_HAND_M = small(
  HAND.map(([x, y]) => [-x, y] as XY),
  0.8,
  [4.6, 1.1],
);
const ST_TALL = small(mapPts(TALL, HEART), 0.55, [7.2, -1.2]);

/** The week's paintings on the stage wall (inside <StageWall>); `tall` adds the tall heart by the door. */
function St_Paintings({ tall = false, trace = 0 }: { tall?: boolean; trace?: number }) {
  const f = STAGE_WALL_F;
  const d = (p: readonly XY[]) => pathD(f, p);
  return (
    <g className="pointer-events-none">
      <rect x={0} y={0} width={f.W} height={f.H} rx={6} fill="#64748b" opacity={0.1} />
      <path d={d(ST_FLOWER)} fill={PK.paint} fillOpacity={0.9} stroke={PK.paintDark} strokeWidth={0.6} />
      <path d={d(ST_DOOR)} fill={PK.paint} fillOpacity={0.9} stroke={PK.paintDark} strokeWidth={0.6} />
      <path d={d(ST_HAND_Z)} fill={HENNA} fillOpacity={0.85} stroke={HENNA_DARK} strokeWidth={0.5} />
      <path d={d(ST_HAND_M)} fill="#c2410c" fillOpacity={0.85} stroke={HENNA_DARK} strokeWidth={0.5} />
      {tall && <path d={d(ST_TALL)} fill="#ec4899" fillOpacity={0.85} stroke="#be185d" strokeWidth={0.6} />}
      {trace > 0 && (
        <g className={FADE}>
          <rect x={f.sx(-2.95)} y={f.sy(1.05)} width={f.u * 2.6} height={f.u * 2.1} fill="#e0f2fe" fillOpacity={0.55} stroke="#64748b" strokeWidth={0.7} />
          <path d={d(ST_FLOWER)} fill="none" stroke="#1e293b" strokeWidth={0.9} strokeDasharray={trace >= 2 ? undefined : "2 2"} />
        </g>
      )}
    </g>
  );
}

/** the বালতি with the stencils melted in it; `bits` shows the torn pieces in the পাল্প */
function St_Bucket({ x, y = 150 }: { x: number; y?: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 11} ${y - 22}L${x - 8} ${y}H${x + 8}L${x + 11} ${y - 22}Z`} fill="#94a3b8" stroke="#475569" strokeWidth={0.9} />
      <ellipse cx={x} cy={y - 22} rx={11} ry={3} fill="#d6c7a1" stroke="#475569" strokeWidth={0.9} />
      <path d={`M${x - 6} ${y - 23}l3 1M${x + 1} ${y - 21}l3 -1.5M${x - 2} ${y - 23.5}l2 1`} stroke={PK.paint} strokeWidth={1.3} strokeLinecap="round" />
      <path d={`M${x + 4} ${y - 23}l2 0.8`} stroke="#ec4899" strokeWidth={1.3} strokeLinecap="round" />
      <path d={`M${x - 11} ${y - 22}Q${x} ${y - 40} ${x + 11} ${y - 22}`} fill="none" stroke="#475569" strokeWidth={0.8} />
    </g>
  );
}

/** a puddle on the wet উঠান */
function St_Puddle({ x, w = 26 }: { x: number; w?: number }) {
  return <ellipse cx={x} cy={160} rx={w / 2} ry={3.5} fill="#bfdbfe" opacity={0.8} className="pointer-events-none" />;
}

/** the মাদুর on the ground, from x0 to x1, and small round glasses on it */
function St_Mat({ x0, x1, glasses = [] }: { x0: number; x1: number; glasses?: { x: number; fill: string; mark?: string }[] }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x0} 166L${x0 + 8} 156H${x1 - 8}L${x1} 166Z`} fill="#e7c98a" stroke="#a16207" strokeWidth={0.7} />
      {Array.from({ length: Math.floor((x1 - x0) / 8) }, (_, i) => (
        <path key={i} d={`M${x0 + 4 + i * 8} 166L${x0 + 10 + i * 8} 156`} stroke="#ca8a04" strokeWidth={0.5} />
      ))}
      {glasses.map((g, i) => (
        <g key={i} className={POP}>
          <ellipse cx={g.x} cy={161} rx={6} ry={3} fill={g.fill} stroke={INK} strokeWidth={0.7} />
          {g.mark && (
            <text x={g.x} y={152} textAnchor="middle" fontSize={8} fontWeight={800} fill={g.mark === "?" ? BLUE : INK} fontFamily={MONO}>
              {g.mark}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

/** a round glass held up at (x, y), radius r */
function St_Glass({ x, y, r = 7, fill = GLASS_FILL.clear, label }: { x: number; y: number; r?: number; fill?: string; label?: string }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill={fill} fillOpacity={0.55} stroke={INK} strokeWidth={0.9} />
      <path d={`M${x - r * 0.5} ${y - r * 0.3}q${r * 0.3} ${-r * 0.4} ${r * 0.7} ${-r * 0.4}`} stroke="white" strokeWidth={1.2} fill="none" />
      {label && (
        <text x={x} y={y + 2.6} textAnchor="middle" fontSize={r * 0.95} fontWeight={800} fontFamily={MONO} fill={INK}>
          {label}
        </text>
      )}
    </g>
  );
}

/** আপা in her শাড়ি (8.7's look): the cast's আপা with a red আঁচল */
function St_Apa({ x, y = 150, facing = 1, arm = "down", walking = false }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "hold" | "point"; walking?: boolean }) {
  return (
    <>
      <Person who="apa" x={x} y={y} facing={facing} arm={arm} walking={walking} />
      <g style={{ transform: `translate(${x}px, ${y}px)` }} className="pointer-events-none transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
        <path d="M-10 -40h20l3 26h-26Z" fill="#dc2626" />
        <path d="M-10 -52q0 -13 10 -13t10 13l-2 14h-3l1 -12q-6 -5 -12 0l1 12h-3Z" fill="#b91c1c" />
        <path d="M-10 -34l20 12" stroke="#facc15" strokeWidth={1.4} />
        <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          আপা
        </text>
      </g>
    </>
  );
}

/** Som's card with G⁻¹'s four numbers, top-left at (x, y) */
function St_NumCard({ x, y }: { x: number; y: number }) {
  const rows = [
    ["2/3", "−1/3"],
    ["−1/3", "2/3"],
  ];
  return (
    <g className={`${POP} pointer-events-none`}>
      <rect x={x} y={y} width={44} height={26} rx={2.5} fill="white" stroke={BLUE} strokeWidth={1.1} />
      {rows.map((r, i) =>
        r.map((v, j) => (
          <text key={`${i}${j}`} x={x + 12 + j * 21} y={y + 11 + i * 10} textAnchor="middle" fontSize={7.5} fontWeight={700} fontFamily={MONO} fill={BLUE}>
            {v}
          </text>
        )),
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · The morning after the rain. Puddles; the বালতি with the stencils
//      melted in it; Rina presses a পলিথিন on the wall and traces the ফুল;
//      the machine back on its stand, the লাইট ভাই by it.

export function MorningBucket({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2000]);
  const k = s.k;
  const [fx] = onStage([-1.4, 0.2]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ফিরানির পরের সকাল, বৃষ্টির পর উঠান ভেজা; বালতির পানিতে stencil গুলো গলে পাল্প; রিনা দেয়ালে পলিথিন চেপে ধরে ফুলের দাগ টানছে; যন্ত্র আবার বাঁশের তেপায়ায়, পাশে লাইট ভাই">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Paintings trace={k >= 2 ? (k >= 3 ? 2 : 1) : 0} />
        </StageWall>
        <St_Puddle x={120} />
        <St_Puddle x={250} w={34} />
        <St_Bucket x={150} />
        {k >= 1 && <Person who="rina" x={fx + 30} y={150} facing={-1} arm={k >= 2 ? "point" : "down"} label />}
        {k >= 3 && (
          <g className={POP}>
            <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
          </g>
        )}
        <LightBhai x={k >= 3 ? 262 : 300} y={150} facing={-1} walking={k === 3} />
      </Stage>
    </StoryFrame>
  );
}

// 1b · Four answers: Nasib holds G to the sun (সব সংখ্যা উল্টায় দেন); Samin
//      (ছোট করলেই তো হয়); Karim (রং একবার দিলে আর ফেরে না); the লাইট ভাই
//      puts one more lens on the মাদুর and says nothing.

export function FourCards({}: Story) {
  const s = useScene(4, [600, 2400, 2200, 2400, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব G রোদের দিকে তুলে বললো সব সংখ্যা উল্টায় দেন, ফুল ফেরত; সামিন বললো ছোট করলেই তো হয়; করিম বললো রং একবার দিলে আর ফেরে না; লাইট ভাই চুপচাপ আরেকটা lens মাদুরে রাখলেন">
        <St_Mat x0={130} x1={250} glasses={[{ x: 146, fill: GLASS_FILL.H }, { x: 160, fill: GLASS_FILL.nasib }, ...(k >= 4 ? [{ x: 214, fill: GLASS_FILL.bag, mark: "?" }] : [])]} />
        <Person who="nasib" x={50} y={150} facing={1} arm={k === 1 ? "hold" : "down"} label />
        {k === 1 && <St_Glass x={62} y={104} r={7} fill={GLASS_FILL.G} label="G" />}
        {k === 1 && <Bubble x={50} y={82} side="right" lines={["সব সংখ্যা উল্টায় দেন।", "ফুল ফেরত।"]} />}
        <Person who="samin" x={110} y={150} facing={1} arm={k === 2 ? "point" : "down"} label />
        {k === 2 && <Bubble x={110} y={84} side="mid" lines={["ছোট করলেই তো হয়।", "H দেন।"]} />}
        <Person who="karim" x={176} y={150} facing={-1} arm="down" label />
        {k === 3 && <Bubble x={176} y={84} side="mid" lines={["রং একবার দিলে", "আর ফেরে না।"]} />}
        <LightBhai x={k >= 4 ? 228 : 270} y={150} facing={-1} arm={k >= 4 ? "hold" : "down"} walking={k === 4} />
      </Stage>
    </StoryFrame>
  );
}

// 2a · The plain glass: the লাইট ভাই takes a clear, round glass out of his
//      bag and holds it before his eye; the নারকেল গাছ behind looks the same
//      through it.

export function ClearGlass({}: Story) {
  const s = useScene(2, [600, 1800, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="লাইট ভাই ঝোলা থেকে একটা গোল সাদা কাঁচ বের করলেন; চোখের সামনে ধরলেন; ওপাশের নারকেল গাছ যেমন ছিলো তেমনই দেখা গেলো">
        <g className="pointer-events-none">
          <path d="M252 150Q246 100 258 58" stroke="#78532e" strokeWidth={6} fill="none" strokeLinecap="round" />
          {[-150, -115, -70, -35].map((a) => {
            const r = (a * Math.PI) / 180;
            return <path key={a} d={`M258 58q${Math.cos(r) * 18} ${Math.sin(r) * 12 - 8} ${Math.cos(r) * 38} 8`} stroke="#3f7d3a" strokeWidth={3.5} fill="none" strokeLinecap="round" />;
          })}
        </g>
        <LightBhai x={130} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} />
        <Person who="rina" x={70} y={150} facing={1} label />
        {k >= 1 && (
          <g style={{ transform: `translate(${k >= 2 ? 4 : 0}px, ${k >= 2 ? -14 : 0}px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
            <St_Glass x={146} y={104} r={9} />
          </g>
        )}
        {k >= 2 && <path d="M136 92L256 64" stroke={INK} strokeOpacity={0.35} strokeWidth={0.8} strokeDasharray="2 3" className={FADE} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Nasib writes ½, 1, 1, ½ on a plain glass with a marker and sets it in
//      front of the machine: এইবার ফুল ফেরত।

export function NasibTries({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব একটা সাদা কাঁচে marker দিয়ে লিখলো আধা, এক, এক, আধা; কাঁচটা যন্ত্রের সামনে বসিয়ে দিলো; বললো এইবার ফুল ফেরত">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Paintings />
        </StageWall>
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        {k >= 3 && <St_Glass x={lx - 12} y={ly} r={6} fill={GLASS_FILL.nasib} />}
        <Person who="nasib" x={k >= 2 ? 156 : 110} y={150} facing={1} arm={k === 1 ? "hold" : k >= 3 ? "point" : "down"} walking={k === 2} label />
        {k >= 1 && k < 3 && (
          <g style={{ transform: `translateX(${k >= 2 ? 46 : 0}px)` }} className="transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
            <St_Glass x={122} y={104} r={7} fill={GLASS_FILL.nasib} />
            <CastCard x={124} y={74} text="½ 1 1 ½" tone="amber" />
          </g>
        )}
        {k >= 3 && <Bubble x={156} y={84} side="mid" lines={["এইবার ফুল ফেরত।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · Samin at the wall: a finger one ঘর right of the nail, e₁। উল্টা দিক
//      থেকে ভাবি: এই কোনায় G আলো পাঠায় কোথা থেকে?

export function SaminCorner({}: Story) {
  const s = useScene(3, [600, 1600, 2200, 2400]);
  const k = s.k;
  const [ex, ey] = onStage([1, 0]);
  const [px, py] = onStage([0, 0]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সামিন দেয়ালের পেরেকের কাছে গেলো; পেরেক থেকে এক ঘর ডানে আঙুল রাখলো, e1; বললো উল্টা দিক থেকে ভাবি, এই কোনায় G আলো পাঠায় কোথা থেকে">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Paintings />
        </StageWall>
        {k >= 1 && (
          <g className={POP}>
            <path d={`M${px} ${py}H${ex}`} stroke={AMBER} strokeWidth={1.6} />
            <circle cx={ex} cy={ey} r={4} fill="none" stroke={AMBER} strokeWidth={1.4} />
            <text x={ex + 2} y={ey + 11} fontSize={8} fontWeight={800} fontFamily={MONO} fill={AMBER}>
              e₁
            </text>
          </g>
        )}
        <Person who="samin" x={k >= 1 ? ex + 28 : 200} y={150} facing={-1} arm={k >= 1 ? "point" : "down"} walking={k === 1} label />
        {k === 2 && <Bubble x={ex + 28} y={84} side="mid" lines={["উল্টা দিক থেকে ভাবি।"]} />}
        {k >= 3 && <Bubble x={ex + 28} y={84} side="right" lines={["এই কোনায় G আলো", "পাঠায় কোথা থেকে?"]} />}
        <Person who="fahim" x={270} y={150} facing={-1} label />
      </Stage>
    </StoryFrame>
  );
}

// 7a · The tall heart by the door: Rina painted it on 8.7's night through
//      the লম্বা lens. She points at it; its stencil is in the বালতি too.

export function TallHeart({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const [hx] = onStage([7.8, 0]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="দরজার পাশে লম্বা একটা heart, 8.7 এর রাতে রিনা লম্বা lens দিয়ে রং করেছিলো; রিনা আঙুল দিয়ে দেখালো; বললো এইটার stencil ও বালতিতে">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Paintings tall />
        </StageWall>
        <St_Bucket x={230} />
        <Person who="rina" x={k >= 1 ? hx + 32 : 270} y={150} facing={-1} arm={k >= 1 ? "point" : "down"} walking={k === 1} label />
        {k >= 2 && <Bubble x={hx + 32} y={84} side="left" lines={["এইটার stencil ও", "বালতিতে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Noon. G⁻¹ on the machine, the ফুল of light on a card, 5 ঘর। Rina on
//      the মাদুর, the empty cereal box beside her: pencil round the light,
//      then scissors. The new ফুল। The old one still in the বালতি।

export function NewStencil({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;
  const f = makeFrame(-1.2, 2.2, -1.2, 2.2, 9, 0);
  const cx = 118;
  const cy = 98;
  const flower = FLOWER.map((p) => [cx + f.sx(p[0]) - f.sx(0.5), cy + f.sy(p[1]) - f.sy(0.5)] as XY);
  const fd = flower.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("") + "Z";
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="দুপুর; যন্ত্রে G inverse; সাদা card এ ফুলের আলো, পাঁচ ঘর; রিনা মাদুরে বসে আলোর দাগ ধরে পেন্সিল টানলো, তারপর কাঁচি; নতুন ফুল; পুরানোটা তখনো বালতির পানিতে">
        <St_Mat x0={60} x1={180} />
        <path d={`M${cx - 16} ${cy + 24}L${cx - 22} 156M${cx + 16} ${cy + 24}L${cx + 22} 156M${cx} ${cy + 24}V152`} stroke="#8b5e34" strokeWidth={2} strokeLinecap="round" />
        <rect x={cx - 24} y={cy - 24} width={48} height={48} rx={2} fill={k >= 3 ? "#fde68a" : "white"} stroke="#a8a29e" className="transition-colors duration-700 motion-reduce:transition-none" />
        {k < 3 && <StageBeam from={[lx, ly]} to={[cx + 4, cy]} w={16} />}
        {k < 3 && <path d={fd} fill={PK.glow} fillOpacity={0.7} stroke={PK.lamp} strokeWidth={0.8} />}
        {k >= 1 && <path d={fd} fill="none" stroke={INK} strokeWidth={0.9} strokeDasharray={k >= 2 ? undefined : "2 1.5"} className={FADE} />}
        {k >= 3 && <path d={fd} fill="#f59e0b" fillOpacity={0.35} className={POP} />}
        <Projector x={PJ[0]} y={PJ[1]} on={k < 3} lens="good" />
        <St_Glass x={lx - 12} y={ly} r={5} fill={GLASS_FILL.bag} />
        <Person who="rina" x={76} y={156} facing={1} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 2 && (
          <g className={POP}>
            <path d={`M${cx - 30} ${cy + 18}l8 -5m-8 5l8 2`} stroke="#475569" strokeWidth={1.6} strokeLinecap="round" />
            <circle cx={cx - 32} cy={cy + 17} r={2} fill="none" stroke="#dc2626" strokeWidth={1.2} />
            <circle cx={cx - 32} cy={cy + 22} r={2} fill="none" stroke="#dc2626" strokeWidth={1.2} />
          </g>
        )}
        <rect x={186} y={128} width={16} height={22} fill="#fbbf24" stroke="#b45309" strokeWidth={0.8} />
        <text x={194} y={141} textAnchor="middle" fontSize={5} fontWeight={700} fill="#7c2d12">
          cereal
        </text>
        <St_Bucket x={290} />
      </Stage>
    </StoryFrame>
  );
}

// 9b · The bridge to 9.2: আপা at the door, the big hand on the wall (thrown
//      through Z): আমার হাতটা? The লাইট ভাই: আবার টাইনা টাইনা খোঁজা লাগবো।
//      Som stares at G⁻¹'s four numbers.

export function ApaDoor({}: Story) {
  const s = useScene(3, [600, 2200, 2400, 2200]);
  const k = s.k;
  const [hx] = onStage([3.1, 0]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="আপা দরজায় এসে দাঁড়ালেন, দেয়ালের বড় হাতটার দিকে তাকালেন, বললেন আমার হাতটা; লাইট ভাই বললেন আবার টাইনা টাইনা খোঁজা লাগবো; সোম G inverse এর চারটা সংখ্যার দিকে তাকিয়ে">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Paintings />
        </StageWall>
        <St_Apa x={hx + 30} facing={-1} arm={k >= 1 ? "point" : "down"} />
        {k === 1 && <Bubble x={hx + 30} y={84} side="mid" lines={["আমার হাতটা?"]} />}
        <LightBhai x={214} y={150} facing={-1} />
        {k === 2 && <Bubble x={214} y={84} side="mid" lines={["আবার টাইনা টাইনা", "খোঁজা লাগবো।"]} />}
        <Person who="som" x={280} y={150} facing={-1} arm={k >= 3 ? "hold" : "down"} label />
        {k >= 3 && <St_NumCard x={266} y={58} />}
        {k >= 3 && <Bubble x={294} y={60} side="left" tone="think" lines={["?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The stake: the stencils in the বালতি; the wall's ফুল, 15 ঘর; a fresh
//      card, the dashed stencil, "?"; then আপার হাত, before the day after
//      tomorrow.

const S1_SAY = ["রাতের বৃষ্টিতে stencil গুলো বালতির পানিতে। কাগজ গলে পাল্প।", "দেয়ালে রং টিকে আছে। ফুল 15 ঘর।", "Card এ ফেরত চাই রিনার 5 ঘরের ফুল। কোন lens দিয়ে?", "তারপর আপার হাত। পরশুর আগে।"];
const S1F = makeFrame(-2.5, 5.5, -2.5, 5.5, 8.5, 0); // 68 × 68

export function UndoStake() {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S1_SAY, k)}>
      <svg viewBox="0 0 280 100" role="img" aria-label="বালতিতে গলে যাওয়া stencil; দেয়ালে 15 ঘরের ফুল; সাদা card এ 5 ঘরের dashed দাগ আর প্রশ্নবোধক; পরে আপার হাত" className="mx-auto block h-auto w-full max-w-[17rem]">
        <g transform="translate(-102 -62) scale(1)">
          <St_Bucket x={130} y={150} />
        </g>
        {k >= 1 && (
          <g className={FADE}>
            <path d="M44 48H62M58 44L62 48L58 52" fill="none" stroke={INK} strokeOpacity={0.45} strokeWidth={1.3} strokeLinecap="round" />
            <g transform="translate(68 14)">
              <rect x={0} y={0} width={S1F.W} height={S1F.H} rx={4} fill={PK.lime} />
              <path d={pathD(S1F, FLOWER, PAINT_FLOWER)} fill={PK.paint} fillOpacity={0.85} stroke={PK.paintDark} strokeWidth={0.8} />
              <text x={S1F.W / 2} y={S1F.H + 12} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily={MONO} fill={PK.paintDark}>
                15
              </text>
            </g>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d="M140 48H156M152 44L156 48L152 52" fill="none" stroke={INK} strokeOpacity={0.45} strokeWidth={1.3} strokeLinecap="round" />
            <g transform="translate(162 14)">
              <rect x={0} y={0} width={S1F.W} height={S1F.H} rx={4} fill="#fffdf7" stroke="#d6d3d1" />
              <path d={pathD(S1F, FLOWER)} fill="none" stroke={BLUE} strokeWidth={1.2} strokeDasharray="3 2" />
              <text x={S1F.sx(0.5)} y={S1F.sy(0.5) + 7} textAnchor="middle" fontSize={20} fontWeight={800} fill={BLUE}>
                ?
              </text>
              <text x={S1F.W / 2} y={S1F.H + 12} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily={MONO} fill={BLUE}>
                5
              </text>
            </g>
          </g>
        )}
        {k >= 3 && (
          <g className={POP} transform="translate(240 28)">
            <path d={pathD(makeFrame(0, 1, 0, 1, 34, 0), HAND)} fill={HENNA} fillOpacity={0.3} stroke={HENNA} strokeWidth={1} strokeDasharray="3 2" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · I's columns: the ঘর's two sides before the plain glass and after,
//      unmoved; they are the columns; 5 × 1 = 5.

const S2_SAY = ["সাদা কাঁচের আগে: প্রথম পাশ (1, 0), দ্বিতীয় পাশ (0, 1)।", "কাঁচের পরে প্রথম পাশ রইলো (1, 0) এ। সেটাই প্রথম column।", "দ্বিতীয় পাশ রইলো (0, 1) এ। সেটাই দ্বিতীয় column।", "সংখ্যায় 1 যেমন: 5 × 1 = 5। কিছুই বদলায় না।"];
const S2F = makeFrame(-0.6, 1.6, -0.6, 1.6, 50, 6); // 122 × 122

export function ColumnsHome() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S2_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <CardSheet f={S2F} label="এক ঘরের দুই পাশ সাদা কাঁচের পরেও একই জায়গায়; সেগুলোই I এর দুই column" className="max-w-[7.5rem]">
          <path d={pathD(S2F, SQ)} fill={PK.glow} fillOpacity={0.5} stroke={PK.lamp} strokeWidth={1} />
          <Arrow f={S2F} from={[0, 0]} to={[1, 0]} tone="amber" w={2.4} />
          <Arrow f={S2F} from={[0, 0]} to={[0, 1]} tone="teal" w={2.4} />
          {k >= 1 && <circle key="a" cx={S2F.sx(1)} cy={S2F.sy(0)} r={7} fill="none" stroke={AMBER} strokeWidth={1.5} className={POP} />}
          {k >= 2 && <circle key="b" cx={S2F.sx(0)} cy={S2F.sy(1)} r={7} fill="none" stroke={TEAL} strokeWidth={1.5} className={POP} />}
        </CardSheet>
        <div className="flex w-[6.5rem] flex-col items-center gap-1.5 text-sm">
          {k >= 1 ? (
            <span key={k >= 2 ? "two" : "one"} className={POP}>
              <FLens cols={I2} shown={k >= 2 ? 2 : 1} />
            </span>
          ) : (
            <span className="text-muted">সাদা কাঁচ</span>
          )}
          {k >= 3 && <span className={`font-mono font-bold ${POP}`}>5 × 1 = 5</span>}
        </div>
      </div>
    </Scene>
  );
}

// 3½ · 6.5's হেলানো ঘর: slanted, then slanted back the other way; the two
//      together, I.

const S3_SAY = ["এক ঘর।", "6.5 এর হেলানো lens: উপরের পাশ ডানে সরে গেলো।", "ফেরার lens উল্টা দিকে হেলায়। ঘর আবার সোজা।", "হেলানো, তারপর উল্টা হেলানো: দুইটা মিলে I।"];
const S3F = makeFrame(-0.6, 2.4, -0.4, 1.4, 50, 6); // 162 × 102

export function ShearBack() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const [t1, t2] = useTween([k >= 1 ? 1 : 0, k >= 2 ? 1 : 0], 900);
  const m = chain(glide(SHEAR, t1), glide(SHEAR_BACK, t2));
  return (
    <Scene scene={s} caption={say(S3_SAY, k)}>
      <div className="flex items-center justify-center gap-2">
        <CardSheet f={S3F} label="এক ঘর হেলানো lens এ ডানে হেলে যায়, ফেরার lens এ আবার সোজা হয়" className="max-w-[10rem]">
          <path d={pathD(S3F, SQ)} fill="none" stroke={BLUE} strokeWidth={1.3} strokeDasharray="4 3" />
          <path d={pathD(S3F, SQ, m)} fill={PK.glow} fillOpacity={0.6} stroke={PK.lamp} strokeWidth={1.2} />
        </CardSheet>
        <div className="flex w-[5.5rem] flex-col items-center gap-1 text-sm">
          {k >= 1 && <FLens cols={SHEAR} small />}
          {k >= 2 && (
            <span className={POP}>
              <FLens cols={SHEAR_BACK} small />
            </span>
          )}
          {k >= 3 && <span className={`font-mono text-lg font-bold ${POP}`}>= I</span>}
        </div>
      </div>
    </Scene>
  );
}

// 4½ · Why Nasib's lens misses: G sends e₁ to (2, 1); Nasib's lens sends
//      (2, 1) to (2, 2.5), not back to e₁.

const S4_SAY = ["এক ঘরের প্রথম পাশ, e₁।", "G এটাকে পাঠায় (2, 1) এ।", "নাসিবের lens (2, 1) কে পাঠায় (2, 2.5) এ।", "e₁ এ ফেরে না। ফেরার lens কে পুরা চলাটা উল্টাতে হবে।"];
const S4F = makeFrame(-0.5, 3, -0.5, 3, 42, 6); // 159 × 159

export function NasibMiss() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S4_SAY, k)}>
      <CardSheet f={S4F} label="e1 কে G পাঠায় (2, 1) এ; নাসিবের lens (2, 1) কে পাঠায় (2, 2.5) এ; e1 এ ফেরে না" className="max-w-[9.5rem]">
        <circle cx={S4F.sx(1)} cy={S4F.sy(0)} r={8} fill="none" stroke={AMBER} strokeWidth={1.5} strokeDasharray={k >= 3 ? undefined : "3 2"} />
        {k < 1 && <Arrow f={S4F} from={[0, 0]} to={[1, 0]} tone="amber" w={2.4} />}
        {k >= 1 && <Arrow key="g" f={S4F} from={[0, 0]} to={[2, 1]} tone="teal" w={2.4} draw />}
        {k >= 2 && <Arrow key="n" f={S4F} from={[2, 1]} to={[2, 2.5]} tone="coral" w={2.4} draw list="(2, 2.5)" />}
        {k >= 3 && <path d={`M${S4F.sx(1) - 5} ${S4F.sy(0) - 5}l10 10m0 -10l-10 10`} stroke={BAD} strokeWidth={2} strokeLinecap="round" className={POP} />}
      </CardSheet>
    </Scene>
  );
}

// 5½ · The two dots found: G throws them to e₁ and e₂; the undo sends e₁,
//      e₂ back to them; so they are its columns: G⁻¹.

const S5_SAY = ["দুইটা বিন্দু: (2/3, −1/3) আর (−1/3, 2/3)।", "G এদের আলো ফেলে e₁ আর e₂ তে।", "ফেরার lens উল্টা পথে যায়: e₁ কে পাঠায় (2/3, −1/3) এ, e₂ কে (−1/3, 2/3) এ।", "e₁, e₂ যেখানে যায়, সেগুলোই column। এই lens এর নাম G⁻¹।"];
const S5F = makeFrame(-0.8, 1.4, -0.8, 1.4, 56, 6); // 135 × 135

export function TwoDotsHome() {
  const s = useScene(3, [600, 1600, 2400, 2400]);
  const k = s.k;
  const [t] = useTween([k >= 1 ? 1 : 0], 900);
  const P = [G_INV[0], G_INV[1]];
  return (
    <Scene scene={s} caption={say(S5_SAY, k)}>
      <div className="flex items-center justify-center gap-2">
        <CardSheet f={S5F} fine={3} label="দুই বিন্দুর আলো G দিয়ে e1 আর e2 তে; উল্টা পথে ফেরার lens e1, e2 কে বিন্দু দুইটায় পাঠায়; সেগুলোই G inverse এর column" className="max-w-[8.5rem]">
          <Targets f={S5F} hit={[k >= 1, k >= 1]} />
          {P.map((p, i) => {
            const l = apply(G, p);
            const at: XY = k >= 2 ? l : [p[0] + (l[0] - p[0]) * t, p[1] + (l[1] - p[1]) * t];
            return (
              <g key={i}>
                {k < 2 && <circle cx={S5F.sx(at[0])} cy={S5F.sy(at[1])} r={5} fill={PK.glow} stroke={PK.lamp} strokeWidth={1.2} />}
                <circle cx={S5F.sx(p[0])} cy={S5F.sy(p[1])} r={5} fill={X5_TONE[i]} stroke="white" strokeWidth={1.6} />
              </g>
            );
          })}
          {k >= 2 &&
            P.map((p, i) => (
              <Arrow key={`b${i}`} f={S5F} from={X5_TARGET[i]} to={p} tone={i ? "teal" : "amber"} w={2} draw dashed list={`(${fr(p[0])}, ${fr(p[1])})`} />
            ))}
        </CardSheet>
        <div className="flex w-[6rem] flex-col items-center gap-1 text-sm">
          {k >= 3 ? (
            <span className={`flex flex-col items-center gap-1 ${POP}`}>
              <FLens cols={G_INV} small />
              <span className="font-mono font-bold">G⁻¹</span>
            </span>
          ) : (
            <span className="text-muted">?</span>
          )}
        </div>
      </div>
    </Scene>
  );
}

// 6½ · 15 ঘর folding into 5: G⁻¹ makes one ঘর a third; × 3, then × 1/3, is
//      1, the plain glass's det.

const S6_SAY = ["দেয়ালের ফুল: 15 ঘর।", "G⁻¹ দিয়ে গেলে: 5 ঘর। প্রতি ঘর তিন ভাগের এক।", "G এ জায়গা 3 গুণ, G⁻¹ এ 1/3 গুণ।", "3 × 1/3 = 1. সাদা কাঁচের det।"];
const S6F = makeFrame(-2.5, 5.5, -2.5, 5.5, 15, 6); // 132 × 132

export function FoldFive() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  const [t] = useTween([k >= 1 ? 1 : 0], 1100);
  const m = chain(PAINT_FLOWER, glide(G_INV, t));
  const n = polyArea(FLOWER.map(m));
  return (
    <Scene scene={s} caption={say(S6_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <CardSheet f={S6F} label="দেয়ালের 15 ঘরের ফুল G inverse দিয়ে 5 ঘরে ভাঁজ হয়" className="max-w-[8.5rem]">
          <Print f={S6F} pic="flower" look="ghost" />
          <Print f={S6F} pic="flower" move={m} look={k >= 1 ? "light" : "paint"} />
        </CardSheet>
        <div className="flex w-[6rem] flex-col items-center gap-1 text-sm">
          <span className="font-mono text-lg font-bold">{Math.round(n)} ঘর</span>
          {k >= 2 && (
            <span className={`font-mono text-xs ${POP}`}>
              det G = 3
              <br />
              det G⁻¹ = 1/3
            </span>
          )}
          {k >= 3 && <span className={`font-mono font-bold ${POP}`}>3 × 1/3 = 1</span>}
        </div>
      </div>
    </Scene>
  );
}

// 7½ · A stretch-only lens: flip each stretch and the tall heart comes home.
//      One stretch 0: the heart flattens to a line, and nothing brings its
//      height back.

const S7_SAY = ["লম্বা lens এর heart: পাশে 2, উপরে 5।", "1/2 আর 1/5 দিয়ে গেলে heart আগের জায়গায় ফেরে।", "এবার একটা lens যার উপরের টান 0।", "Heart চ্যাপ্টা, একটা দাগ। দাগ থেকে উচ্চতা আর ফেরে না।"];
const S7F = makeFrame(-0.4, 2.2, -0.4, 5, 24, 6); // 74 × 142

export function StretchZero() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const [a, b] = useTween(k === 0 ? [2, 5] : k === 1 ? [1, 1] : k === 2 ? [1, 1] : [2, 0], 1000);
  const cols: Cols = [
    [a, 0],
    [0, b],
  ];
  return (
    <Scene scene={s} caption={say(S7_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <CardSheet f={S7F} label="লম্বা heart আধা আর পাঁচ ভাগের এক দিয়ে আগের জায়গায় ফেরে; উপরের টান 0 হলে heart চ্যাপ্টা দাগ, আর ফেরে না" className="max-w-[5rem]">
          <Print f={S7F} pic="heart" look="ghost" soft />
          <Print f={S7F} pic="heart" move={glide(cols, 1)} look="light" />
          {k >= 3 && (
            <text x={S7F.sx(1.1)} y={S7F.sy(2)} textAnchor="middle" fontSize={22} fontWeight={800} fill={BLUE} className={POP}>
              ?
            </text>
          )}
        </CardSheet>
        <div className="flex w-[6rem] flex-col items-center gap-1.5">
          <FLens cols={k >= 2 ? FLAT : TALL} small />
          {k === 1 && (
            <span className={POP}>
              <FLens cols={X7_RIGHT} small />
            </span>
          )}
        </div>
      </div>
    </Scene>
  );
}

// 9½ · The recap: the stencil, through G onto the wall (15 ঘর), through G⁻¹
//      back home (5 ঘর): A, then A⁻¹, is the plain glass.

const S9_SAY = ["রিনার stencil: 5 ঘর।", "G দিয়ে দেয়ালে: 15 ঘর।", "G⁻¹ দিয়ে ফেরত: 5 ঘর, একই জায়গায়।", "G, তারপর G⁻¹: সাদা কাঁচ। সব কিছু আগের জায়গায় ফেরে।"];

export function RecapHome() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const [t1, t2] = useTween([k >= 1 ? 1 : 0, k >= 2 ? 1 : 0], 1000);
  const m = chain(glide(G, t1), glide(G_INV, t2));
  return (
    <Scene scene={s} caption={say(S9_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <CardSheet f={S6F} label="stencil G দিয়ে 15 ঘর, তারপর G inverse দিয়ে আবার 5 ঘর, একই জায়গায়" className="max-w-[8.5rem]">
          <Print f={S6F} pic="flower" look="ghost" />
          <Print f={S6F} pic="flower" move={m} look={k === 1 ? "paint" : "light"} />
        </CardSheet>
        <div className="flex w-[5rem] flex-col items-center gap-1.5">
          <NamedGlass name="G" lit={k === 1} size={30} />
          {k >= 2 && (
            <span className={POP}>
              <NamedGlass name="G⁻¹" lit={k === 2} size={30} />
            </span>
          )}
          {k >= 3 && <span className={`font-mono font-bold ${POP}`}>= I</span>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  UndoBet: { start: {}, picked: { bet: 0 }, sealed: { bet: 2, sealed: true } },
  PlainGlass: { start: {}, khata: { cur: 0, done: [true, false] }, wall: { cur: 1, done: [true, true] } },
  EasyUndo: {
    start: {},
    wrongL: { tab: 0, picks: [0, null] },
    rightL: { tab: 0, picks: [1, null], solved: [true, false] },
    wrongTurn: { tab: 1, picks: [1, 1], solved: [true, false] },
    done: { tab: 1, picks: [1, 2], solved: [true, true] },
  },
  OneOverEach: { start: {}, guess: { guess: 0 }, ran: { guess: 0, ran: true } },
  WhoLandsHere: { start: {}, one: { pts: [[2 / 3, -1 / 3], [0, 1 / 3]], locked: [true, false] }, done: { pts: [[2 / 3, -1 / 3], [-1 / 3, 2 / 3]], locked: [true, true] } },
  UndoOnWall: { start: {}, wall: { cur: 0, done: [true, false, false] }, done: { cur: 2, done: [true, true, true] } },
  YourUndo: {
    start: {},
    wrong: { pts: [[0.5, 0], [0, 0.4]], view: "run", ran: true },
    right: { pts: [[0.5, 0], [0, 0.2]], view: "run", ran: true },
  },
  TryUndo: { start: {}, wrongH: { pick: 0 }, wrongTurn: { pick: 2 }, right: { pick: 1 } },
  BetOpen: { start: {}, one: { open: [0], cur: 0 }, done: { open: [0, 1, 3, 2], cur: 2 } },
  MorningBucket: { rest: { k: 0 }, rina: { k: 2 }, done: {} },
  FourCards: { nasib: { k: 1 }, karim: { k: 3 }, done: {} },
  ClearGlass: { rest: { k: 0 }, done: {} },
  NasibTries: { write: { k: 1 }, done: {} },
  SaminCorner: { one: { k: 2 }, done: {} },
  TallHeart: { rest: { k: 0 }, done: {} },
  NewStencil: { light: { k: 0 }, cut: { k: 2 }, done: {} },
  ApaDoor: { apa: { k: 1 }, bhai: { k: 2 }, done: {} },
  UndoStake: { two: { k: 1 }, done: {} },
  ColumnsHome: { one: { k: 1 }, done: {} },
  ShearBack: { slant: { k: 1 }, done: {} },
  NasibMiss: { g: { k: 1 }, done: {} },
  TwoDotsHome: { light: { k: 1 }, back: { k: 2 }, done: {} },
  FoldFive: { rest: { k: 0 }, done: {} },
  StretchZero: { home: { k: 1 }, done: {} },
  RecapHome: { wall: { k: 1 }, done: {} },
};
