"use client";

import { useState, type ReactNode } from "react";

import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Stepper, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { Arrow, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { LightBhai, Projector, STAGE_WALL_F, StageWall, apply, det, pathOf, projectorLens, useLensRun, type Cols, type Move } from "./light-kit";
import { FLOWER_OUTLINE, LENS_G, PK, PatchWall, StageMora, cellPoly, patchCorners, patchFrame } from "./patch-kit";

// Screens for "Math for AI 9.2 — সোমের নিয়ম, খোঁজা লাগে না", told as a
// Journey in the author's Bangla-English. The plan is 09_journey_specs.md,
// block 9.2.
//
// ফিরানির পরের দুপুর, নানাবাড়ি। The মেহেদি hand is on the wall, thrown
// through Z = [[−1, 1], [2, 1]] (det −3: three ঘর, and a left hand)। আপা wants
// its stencil by evening. In 9.1 the ফুল's undo was found by dragging two dots;
// the লাইট ভাই says there is no other way. Som, looking at G and G⁻¹ side by
// side, finds the rule: swap the corners, flip the other two, divide by det.
//
// Ten screens. 1 seals the bet on Z's undo (RecipeBet). 2 Som's pattern, G
// beside G⁻¹, then the book's shear (SomsPattern). 3 the recipe as a machine,
// fed G; the ফুল runs back (SwapFlipDivide). 4 predict: does the undo also
// un-flip the hand? Then Z through the machine (HandBack). 5 Nasib's pocket
// lens [[1, 1], [1, 1]]: ÷ 0, the machine stops; tap a spot on its line, two
// dots came from there (ZeroRefuses). 6 Rina's tiny 0.1I, then a nearly flat
// lens: the undo's numbers swell (SmallDetBig). 7 Your turn (Check Q1):
// [[4, 7], [2, 6]] by hand (YourRecipe). 8 Try it (Check Q2): which painting
// can never go back (TryZero). 9 the bet opened on the hand (BetOpen). 10 the
// end (MDX).
//
// After the screens: the story scenes (NoonHand, NoHisab, SomsKhata,
// HandInMachine, PocketLens, TwoSmallLenses, ApaPalm, KhataPack, DoorPiece)
// and the watch-only figures (AllDay, WhyDivide, LetterRecipe, AdjSideways,
// FlipBack, WhereBack, SwellingUndo, RareZero), each numbered after its screen.
//
// The wall and the machine come from light-kit.tsx, the patch wall and the
// ফুল from patch-kit.tsx (both read-only). The "ফেরা run" (a painting on the
// wall, through a lens, onto the stencil card over a dashed ghost of the true
// stencil) is kept here locally (R_…): 9.1 builds the same piece in parallel,
// and the two are folded into one kit later. The মেহেদি hand is 8.3's stencil
// (a right palm, fingers along e₂, thumb out along e₁), redrawn as 8.5 did.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const BLUE = "#2563eb";
const OK = "#0d9488";
const BAD = PK.bad;
const HENNA = "#9a3412";
const HENNA_DARK = "#7c2d12";
const HENNA_LINE = "#fdba74";
const HEART = "#ec4899";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

const sg = (v: number) => (v < 0 ? `−${-v}` : `${v}`);
const pathD = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}`).join("") + "Z";
const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// ---------------------------------------------------------------------------
// Numbers. A lens is kept by its columns (light-kit's Cols); the book writes it
// by rows, [[a, b], [c, d]], so the recipe works on rows.

type Rows = [[number, number], [number, number]];
const colsOf = (r: Rows): Cols => [
  [r[0][0], r[1][0]],
  [r[0][1], r[1][1]],
];
const rowsOf = (c: Cols): Rows => [
  [c[0][0], c[1][0]],
  [c[0][1], c[1][1]],
];
/** one lens that does `first`, then `second` */
const onto = (second: Cols, first: Cols): Cols => [apply(second, first[0]), apply(second, first[1])];
/** Som's recipe: swap the corners, flip the other two, divide by det; null when det is 0 */
const undoOf = (c: Cols): Cols | null => {
  const D = det(c);
  if (Math.abs(D) < 1e-9) return null;
  const [[a, b], [cc, d]] = rowsOf(c);
  return colsOf([
    [d / D, -b / D],
    [-cc / D, a / D],
  ]);
};
const isPlain = (c: Cols) => Math.abs(c[0][0] - 1) + Math.abs(c[0][1]) + Math.abs(c[1][0]) + Math.abs(c[1][1] - 1) < 1e-6;

/** a number as the book would write it: whole, a fraction over 2, 3, 6, 9, or a short decimal (`dec`) */
const fmt = (v: number, dec = false) => {
  if (Math.abs(v - Math.round(v)) < 1e-9) return sg(Math.round(v));
  if (!dec)
    for (const d of [2, 3, 6, 9]) {
      const n = v * d;
      if (Math.abs(n - Math.round(n)) < 1e-9) return `${v < 0 ? "−" : ""}${Math.abs(Math.round(n))}/${d}`;
    }
  return sg(Math.round(v * 100) / 100);
};

const I2: Cols = [
  [1, 0],
  [0, 1],
];
/** 7.3's yellow spare Z = [[−1, 1], [2, 1]]: det −3 */
const Z: Cols = colsOf([
  [-1, 1],
  [2, 1],
]);
/** Nasib's pocket lens [[1, 1], [1, 1]], det 0 */
const CRUSH: Cols = colsOf([
  [1, 1],
  [1, 1],
]);
/** the book's shear [[1, 1], [0, 1]] */
const SHEAR: Cols = colsOf([
  [1, 1],
  [0, 1],
]);
/** the লাইট ভাই's lens for the heart's second copy (Check Q1): det 10 */
const Q1: Cols = colsOf([
  [4, 7],
  [2, 6],
]);

// ---------------------------------------------------------------------------
// The stencils: one ঘর [0, 1]² (the hand, the heart) or 8.1's five-ঘর ফুল।

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
/** a heart filling the ঘর */
const HEART_PTS: XY[] = Array.from({ length: 40 }, (_, i) => {
  const t = (i / 40) * 2 * Math.PI;
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [0.5 + (x / 17) * 0.46, 0.06 + ((y + 17) / 29.5) * 0.9];
});

type Shape = "hand" | "flower" | "heart";

/**
 * A stencil's light carried by `move`. `look`: "light" (thrown by the machine),
 * "paint" (painted on the wall), "ghost" (the true stencil, dashed), "faint"
 * (a painting the পলিথিন has been traced from).
 */
function R_Print({ f, shape, move, look = "light", tone = OK }: { f: Frame; shape: Shape; move: Move; look?: "light" | "paint" | "ghost" | "faint"; tone?: string }) {
  const outer = shape === "flower" ? FLOWER_OUTLINE : shape === "heart" ? HEART_PTS : SQ;
  const d = pathOf(f, move, outer, true);
  if (look === "ghost")
    return (
      <g className="pointer-events-none">
        <path d={d} fill={tone} fillOpacity={0.08} stroke={tone} strokeWidth={1.5} strokeDasharray="4 3" strokeLinejoin="round" />
        {shape === "hand" && <path d={pathOf(f, move, HAND, true)} fill="none" stroke={tone} strokeWidth={1.2} strokeDasharray="3 2" strokeLinejoin="round" />}
      </g>
    );
  const paint = look === "paint" || look === "faint";
  const fill = paint ? (shape === "heart" ? HEART : PK.paint) : PK.glow;
  return (
    <g className="pointer-events-none" opacity={look === "faint" ? 0.35 : 1}>
      {!paint && <path d={d} fill={PK.glow} fillOpacity={0.3} stroke={PK.glow} strokeOpacity={0.5} strokeWidth={4} strokeLinejoin="round" />}
      <path d={d} fill={fill} fillOpacity={paint ? 0.85 : 0.65} stroke={paint ? PK.paintDark : PK.lamp} strokeWidth={1.1} strokeLinejoin="round" />
      {shape === "hand" && (
        <>
          <path d={pathOf(f, move, HAND, true)} fill={paint ? "#fde68a" : HENNA} stroke={paint ? PK.paintDark : HENNA_DARK} strokeWidth={0.8} strokeLinejoin="round" />
          {!paint && <path d={pathOf(f, move, RING, true)} fill="none" stroke={HENNA_LINE} strokeWidth={Math.max(0.6, f.u * 0.02)} />}
        </>
      )}
    </g>
  );
}

/** a small white chip with words on the wall, at a spot in wall units */
function R_Chip({ f, at, text, tone = INK }: { f: Frame; at: XY; text: string; tone?: string }) {
  const bn = /[ঀ-৿]/.test(text);
  const w = text.length * (bn ? 5.2 : 6) + 10;
  const x = Math.min(f.W - w / 2 - 2, Math.max(w / 2 + 2, f.sx(at[0])));
  const y = f.sy(at[1]);
  return (
    <g className={`${POP} pointer-events-none`}>
      <rect x={x - w / 2} y={y - 8} width={w} height={14} rx={4} fill="white" fillOpacity={0.94} stroke={tone} strokeWidth={1} />
      <text x={x} y={y + 2.8} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={bn ? undefined : MONO} fill={tone}>
        {text}
      </text>
    </g>
  );
}

/**
 * The ফেরা run: the painting on the wall (`paint` carried the stencil there),
 * the dashed ghost of the true stencil at the nail, and — once `undo` is in —
 * the light of the traced পলিথিন thrown back through it, partway by `t`.
 */
function R_Run({ f, shape, paint, undo, t, label, className = "max-w-[11rem]", chip }: { f: Frame; shape: Shape; paint: Cols; undo: Cols | null; t: number; label: string; className?: string; chip?: ReactNode }) {
  const P = (p: XY) => apply(paint, p);
  const back: Move = (p) => (undo ? lerp(P(p), apply(undo, P(p)), t) : P(p));
  return (
    <PatchWall f={f} label={label} className={className}>
      <R_Print f={f} shape={shape} move={(p) => p} look="ghost" />
      <R_Print f={f} shape={shape} move={P} look={undo && t > 0 ? "faint" : "paint"} />
      {undo && t > 0 && <R_Print f={f} shape={shape} move={back} />}
      {chip}
    </PatchWall>
  );
}

/** Where the throw lands, read off the whole stack: on the ghost, and (for the hand) which hand. */
const verdict = (paint: Cols, undo: Cols) => {
  const s = onto(undo, paint);
  return { home: isPlain(s), d: det(s) };
};

// ---------------------------------------------------------------------------
// The lens as numbers: four cells that can move. The corners (a, d) are amber,
// the other two (b, c) violet. `stage` 0 as written; 1 corners swapped; 2 the
// other two flipped; 3 each divided by det (or, for det 0, the machine stops).

const CW = 46;
const CH = 28;
/** where each of a, b, c, d sits (row, col) after the swap */
const AT_SWAPPED: [number, number][] = [
  [1, 1],
  [0, 1],
  [1, 0],
  [0, 0],
];
const AT_PLAIN: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

function R_Bracket({ side }: { side: "l" | "r" }) {
  return <span className={`w-1.5 self-stretch border-y-2 border-current opacity-60 ${side === "l" ? "rounded-l-sm border-l-2" : "rounded-r-sm border-r-2"}`} />;
}

/** A 2 × 2 of strings, rows first, with brackets; `tint` colours corners amber and the other two violet. */
function Mat({ cells, tint = true, small = false }: { cells: [[string, string], [string, string]]; tint?: boolean; small?: boolean }) {
  const col = (r: number, c: number) => (!tint ? "" : r === c ? "text-[#b45309] dark:text-[#fbbf24]" : "text-[#7c3aed] dark:text-[#c4b5fd]");
  return (
    <span className={`inline-flex items-stretch font-mono font-bold ${small ? "text-xs" : "text-sm"}`}>
      <R_Bracket side="l" />
      <span className="grid grid-cols-2 gap-x-1 px-0.5">
        {[0, 1].map((r) =>
          [0, 1].map((c) => (
            <span key={`${r}${c}`} className={`${small ? "min-w-6" : "min-w-8"} text-center ${col(r, c)}`}>
              {cells[r][c]}
            </span>
          )),
        )}
      </span>
      <R_Bracket side="r" />
    </span>
  );
}
const matOf = (c: Cols, dec = false): [[string, string], [string, string]] => {
  const r = rowsOf(c);
  return [
    [fmt(r[0][0], dec), fmt(r[0][1], dec)],
    [fmt(r[1][0], dec), fmt(r[1][1], dec)],
  ];
};

/** The recipe box: the four numbers of `lens` moving through Som's three moves. */
function RecipeBox({ lens, stage, dec = false }: { lens: Cols; stage: number; dec?: boolean }) {
  const [[a, b], [c, d]] = rowsOf(lens);
  const D = det(lens);
  const zero = Math.abs(D) < 1e-9;
  const vals = [a, b, c, d].map((v, i) => {
    const flipped = stage >= 2 && (i === 1 || i === 2) ? -v : v;
    return stage >= 3 && !zero ? flipped / D : flipped;
  });
  const at = stage >= 1 ? AT_SWAPPED : AT_PLAIN;
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="inline-flex items-stretch font-mono text-sm font-bold">
        <R_Bracket side="l" />
        <span className="relative" style={{ width: CW * 2, height: CH * 2 }}>
          {vals.map((v, i) => (
            <span
              key={i}
              className={`absolute top-0 left-0 grid place-items-center transition-transform duration-700 ease-in-out motion-reduce:transition-none ${i === 0 || i === 3 ? "text-[#b45309] dark:text-[#fbbf24]" : "text-[#7c3aed] dark:text-[#c4b5fd]"}`}
              style={{ width: CW, height: CH, transform: `translate(${at[i][1] * CW}px, ${at[i][0] * CH}px)` }}
            >
              <span key={`${stage >= 2 && (i === 1 || i === 2) ? "f" : "p"}${stage >= 3 ? "d" : ""}`} className={stage >= 2 && (i === 1 || i === 2 || stage >= 3) ? POP : ""}>
                {fmt(v, dec)}
              </span>
            </span>
          ))}
        </span>
        <R_Bracket side="r" />
      </span>
      {stage === 2 && !zero && (
        <span className={`font-mono text-sm font-bold whitespace-nowrap text-muted ${POP}`}>÷ {fmt(D, dec)}</span>
      )}
      {stage >= 3 && zero && (
        <span className={`rounded-md bg-danger/10 px-1.5 py-0.5 font-mono text-sm font-bold whitespace-nowrap text-danger ${POP}`}>÷ 0</span>
      )}
    </div>
  );
}

const STEP_BTN = ["কোনা দুইটা অদলবদল", "বাকি দুইটার সাইন উল্টান", "det দিয়ে ভাগ করুন"];
const STEP_DONE = ["কোনা অদলবদল হলো।", "বাকি দুইটা উল্টালো।", "det দিয়ে ভাগ হলো।"];

/** a curled "ফেরা" arrow, drawn: the undo lens's mark */
function FeraMark({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" className="shrink-0">
      <path d="M15 12A6 6 0 1 1 13 5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="M9.5 3.5l3.8 1.4l-1.2 3.8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** a small drawn arrow for rows of steps (no glyph) */
function RowArrow() {
  return (
    <svg viewBox="0 0 16 10" className="h-2.5 w-4 shrink-0 text-muted" aria-hidden="true">
      <path d="M1 5H13M9 1.5L13 5L9 8.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "ডান হাত" / "বাম হাত", as a small badge */
function HandBadge({ d }: { d: number }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${d < 0 ? "bg-danger/10 text-danger" : "bg-accent/15 text-accent-text"} ${POP}`}>
      {d < 0 ? "বাম হাত" : "ডান হাত"}
    </span>
  );
}

/**
 * The machine: three buttons walk the lens through Som's recipe (one move per
 * tap, each plays), then `run` throws the painting back through what came out.
 * Seeds "stage" (0…3) and "ran".
 */
function useMachine() {
  const [stage, setStage] = useSeed("stage", 0);
  const [ran, setRan] = useSeed("ran", false);
  const step = usePlay(750);
  const run = useLensRun(1300, 26);
  const next = (done?: (s: number) => void) => {
    if (step.running || run.running || stage >= 3) return;
    const ns = stage + 1;
    setStage(ns);
    step.play(1, () => done?.(ns));
  };
  const go = (done?: () => void) => {
    if (run.running || step.running) return;
    setRan(false);
    run.run(() => {
      setRan(true);
      done?.();
    });
  };
  const t = run.running ? run.t : ran ? 1 : 0;
  return { stage, ran, t, busy: step.running || run.running, running: run.running, next, go };
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The painted hand on the wall (Z's: 3 ঘর, a left hand).
//     Four cards for Z's undo. Sealing acts it out: the picked lens slides in
//     between the painting and the stencil card, the card gets a "?".

const X1_CARDS: { who: string; line: string; cells: [[string, string], [string, string]] | null }[] = [
  { who: "নাসিব", line: "সব সংখ্যা উল্টাও", cells: [["−1", "1/2"], ["1/2", "1"]] },
  { who: "করিম", line: "Z এর সংখ্যাই, এদিক ওদিক", cells: [["1", "−1"], ["−2", "−1"]] },
  { who: "ব্যাগের lens", line: "কেউ চেনে না", cells: [["−1/3", "1/3"], ["2/3", "1/3"]] },
  { who: "লাইট ভাই", line: "বলা যায় না, খুঁজতে হবে", cells: null },
];
const X1F = patchFrame(-1.4, 1.4, -0.3, 3.3, 30); // 100 × 124
const X1_CARD_F = makeFrame(-0.25, 1.25, -0.25, 1.25, 40, 4); // 68 × 68

/** the stencil card at the stand: white, the true stencil dashed on it; `q` hangs a "?" */
function R_StencilCard({ q = false, children }: { q?: boolean; children?: ReactNode }) {
  const f = X1_CARD_F;
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} width={f.W} height={f.H} role="img" aria-label="stencil এর card, আসল হাতের দাগ হালকা করে আঁকা" className="shrink-0">
      <rect x={1} y={1} width={f.W - 2} height={f.H - 2} rx={5} fill="white" stroke="#94a3b8" />
      <R_Print f={f} shape="hand" move={(p) => p} look="ghost" />
      {children}
      {q && (
        <text x={f.W / 2} y={f.H / 2 + 11} textAnchor="middle" fontSize={32} fontWeight={800} fill={BLUE} className={POP}>
          ?
        </text>
      )}
    </svg>
  );
}

export function RecipeBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(550);
  const k = !sealed ? 0 : act.running ? act.k : 3;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(3, () => pass("বাজি সিল হলো। আগে সোমের খাতা।"));
  };
  const card = bet === null ? null : X1_CARDS[bet];
  return (
    <>
      <div className="flex items-center justify-center gap-1.5">
        <PatchWall f={X1F} label="দেয়ালে Z দিয়ে আঁকা মেহেদি হাত: 3 ঘর, বাম হাত" className="max-w-[6.5rem]">
          <R_Print f={X1F} shape="hand" move={(p) => apply(Z, p)} look="paint" />
        </PatchWall>
        <RowArrow />
        <div className="flex w-[4.6rem] flex-col items-center gap-1">
          <span className={`grid size-9 place-items-center rounded-full border-2 border-[#0f1b2d]/50 bg-[#e0f2fe] text-[#0f1b2d] ${k >= 1 ? "shadow-[0_0_0_3px_rgba(253,224,71,0.7)]" : ""}`}>
            <FeraMark size={18} />
          </span>
          {k >= 1 && card && (
            <span key={bet} className={POP}>
              {card.cells ? <Mat cells={card.cells} small /> : <span className="text-xs text-muted">খুঁজে দেখা</span>}
            </span>
          )}
        </div>
        <RowArrow />
        <R_StencilCard q={k >= 2} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex flex-col gap-0.5 text-sm leading-tight">
              {c.cells ? <Mat cells={c.cells} small /> : <span className="font-semibold">কোনো নিয়ম নাই</span>}
              <span className="text-xs text-muted">
                {c.who}: {c.line}
              </span>
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={bet === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 3}>Z এর ফেরার lens কোনটা? একটা বেছে নিয়ে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Som's pattern. G beside G⁻¹ (9.1's, found by dragging). "1/3 বাইরে":
//     G⁻¹ becomes 1/3 × [[2, −1], [−1, 2]]. Then three taps, each plays on
//     the numbers: the 2s trade places, the 1s turn minus, the 3 is G's det.
//     Then the book's shear, through the same three moves: [[1, −1], [0, 1]].

const X2_FACTS = [
  { btn: "কোনার 2", say: "কোনার 2 দুইটা জায়গা বদলালো। সংখ্যা একই।" },
  { btn: "বাকি 1", say: "বাকি দুইটা 1, minus হয়ে গেলো।" },
  { btn: "ভাগের 3", say: "3 হলো G এর det: 2·2 − 1·1।" },
];

export function SomsPattern() {
  const pass = useGate();
  const [out, setOut] = useSeed("out", false);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const [shear, setShear] = useSeed("shear", 0);
  const tick = usePlay(750);
  const all = seen.length === 3;
  const see = (i: number) => {
    if (tick.running) return;
    setCur(i);
    setSeen(seen.includes(i) ? seen : [...seen, i]);
    tick.play(1);
  };
  const nextShear = () => {
    if (tick.running || shear >= 3) return;
    const ns = shear + 1;
    setShear(ns);
    tick.play(1, () => {
      if (ns === 3) pass("কোনা বদলাও, বাকি দুইটা উল্টাও, det এ ভাগ।");
    });
  };
  // the G side: the 2s swap while fact 0 plays, the 1s ring during fact 1
  const swapped = cur === 0 && tick.running;
  const g = (i: number, v: string) => {
    const ring = (cur === 1 && (i === 1 || i === 2)) || (cur === 0 && (i === 0 || i === 3));
    return (
      <span key={i} className={`absolute top-0 left-0 grid place-items-center rounded-md transition-[transform,background-color] duration-700 ease-in-out motion-reduce:transition-none ${ring ? "bg-[#fde047]/50" : ""} ${i === 0 || i === 3 ? "text-[#b45309] dark:text-[#fbbf24]" : "text-[#7c3aed] dark:text-[#c4b5fd]"}`} style={{ width: 34, height: CH, transform: `translate(${(swapped ? AT_SWAPPED : AT_PLAIN)[i][1] * 34}px, ${(swapped ? AT_SWAPPED : AT_PLAIN)[i][0] * CH}px)` }}>
        {v}
      </span>
    );
  };
  const inv = out
    ? [["2", "−1"], ["−1", "2"]]
    : [["2/3", "−1/3"], ["−1/3", "2/3"]];
  return (
    <>
      {shear === 0 ? (
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted">G</span>
            <span className="inline-flex items-stretch font-mono text-sm font-bold">
              <R_Bracket side="l" />
              <span className="relative" style={{ width: 68, height: CH * 2 }}>
                {["2", "1", "1", "2"].map((v, i) => g(i, v))}
              </span>
              <R_Bracket side="r" />
            </span>
            {seen.includes(2) && <span className={`rounded-full bg-accent/15 px-2 font-mono text-xs font-bold text-accent-text ${POP}`}>det 3</span>}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="flex items-center gap-1 text-xs text-muted">
              <FeraMark size={12} /> G⁻¹, 9.1 এ টেনে পাওয়া
            </span>
            <span className="flex items-center gap-1">
              {out && <span className={`font-mono text-sm font-bold ${cur === 2 && tick.running ? "rounded bg-[#fde047]/60" : ""} ${POP}`}>1/3 ×</span>}
              <span key={out ? "o" : "i"} className={out ? POP : ""}>
                <Mat cells={inv as [[string, string], [string, string]]} />
              </span>
            </span>
            {seen.includes(2) && <span className="h-5" />}
          </div>
        </div>
      ) : (
        <div className={`flex flex-col items-center gap-1 ${FADE}`}>
          <span className="text-xs text-muted">বইয়ের হেলানো lens, det 1·1 − 1·0 = 1</span>
          <div className="flex items-center gap-2">
            <Mat cells={matOf(SHEAR)} />
            <RowArrow />
            <RecipeBox lens={SHEAR} stage={shear} />
          </div>
        </div>
      )}
      <div className="mt-2 min-h-[2.75rem] text-center text-sm">
        {shear === 0 && cur !== null && (
          <span key={cur} className={FADE}>
            {X2_FACTS[cur].say}
          </span>
        )}
        {shear > 0 && (
          <span key={shear} className={FADE}>
            {STEP_DONE[shear - 1]} {shear === 3 ? "1 দিয়ে ভাগ করলে কিছু বদলায় না।" : ""}
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-1.5">
        {!out && (
          <button type="button" className={primaryBtn} onClick={() => setOut(true)}>
            1/3 বাইরে আনুন
          </button>
        )}
        {out &&
          shear === 0 &&
          X2_FACTS.map((x, i) => (
            <button key={x.btn} type="button" className={seen.includes(i) ? quietBtn : primaryBtn} disabled={tick.running} onClick={() => see(i)}>
              {x.btn}
            </button>
          ))}
        {all && shear < 3 && (
          <button type="button" className={primaryBtn} disabled={tick.running} onClick={nextShear}>
            {STEP_BTN[shear]}
          </button>
        )}
      </div>
      <Task done={shear >= 3 && !tick.running}>
        {!all ? "G আর G⁻¹ মিলিয়ে দেখুন। আগে 1/3 বাইরে আনুন, তারপর নিচের তিনটায় একটা একটা করে tap করুন।" : "এবার বইয়ের হেলানো lens এ একই তিনটা কাজ করুন।"}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The recipe as a machine, fed G. The reader walks it through the three
//     moves, then throws the ফুল painting back: it lands on the stencil's
//     ghost, and the lens that came out is 9.1's dragged G⁻¹.

const X3F = patchFrame(-2.6, 5.6, -2.6, 5.6, 16); // 147 × 147

export function SwapFlipDivide() {
  const pass = useGate();
  const m = useMachine();
  const undo = m.stage >= 3 ? undoOf(LENS_G) : null;
  const landed = m.ran && !m.running;
  const step = () => m.next();
  const run = () => m.go(() => pass("খোঁজা লাগলো না।"));
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <div className="flex w-[8.75rem] flex-col items-center gap-1.5">
          <span className="text-xs text-muted">G</span>
          <RecipeBox lens={LENS_G} stage={m.stage} />
          {m.stage >= 3 && (
            <span className={`flex items-center gap-1 text-xs font-semibold text-accent-text ${FADE}`}>
              <FeraMark size={12} /> 9.1 এর G⁻¹ ই
            </span>
          )}
        </div>
        <R_Run f={X3F} shape="flower" paint={LENS_G} undo={undo} t={m.t} label="G দিয়ে আঁকা ফুল দেয়ালে; সোমের নিয়মে বানানো lens দিয়ে ফেরালে ফুল stencil এর দাগের উপর বসে" className="max-w-[9rem]" chip={landed ? <R_Chip f={X3F} at={[1.5, -2]} text="মিললো" tone={OK} /> : null} />
      </div>
      <div className="mt-2 flex justify-center">
        {m.stage < 3 ? (
          <button type="button" className={primaryBtn} disabled={m.busy} onClick={step}>
            {STEP_BTN[m.stage]}
          </button>
        ) : (
          !landed && (
            <button type="button" className={primaryBtn} disabled={m.busy} onClick={run}>
              ফুল ফেরান
            </button>
          )
        )}
      </div>
      <Task done={landed}>যন্ত্রে G দিন: তিনটা কাজ একটা একটা করে। তারপর বের হওয়া lens দিয়ে ফুল ফেরান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Predict first: will the undo also turn the hand back into a right hand?
//     Three pictures: small right hand · small left hand · a right hand three
//     times too big. Then Z through the machine, and the hand runs back.

const X4F = patchFrame(-1.6, 1.6, -0.4, 3.4, 30); // 112 × 130
const X4_OPTS: { cols: Cols; say: string }[] = [
  { cols: I2, say: "ছোট, আবার ডান হাত" },
  {
    cols: colsOf([
      [-1, 0],
      [0, 1],
    ]),
    say: "ছোট, কিন্তু বাম হাতই",
  },
  {
    cols: colsOf([
      [3, 0],
      [0, 3],
    ]),
    say: "ডান হাত, কিন্তু বড়",
  },
];
const X4_RIGHT = 0;

/** a small picture of the stencil after the stack `cols`, drawn on a card */
function R_Icon({ cols, shape = "hand", size = 50, span = 3.2 }: { cols: Cols; shape?: Shape; size?: number; span?: number }) {
  const pts = (shape === "flower" ? FLOWER_OUTLINE : SQ).map((p) => apply(cols, p));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const f = makeFrame(cx - span / 2, cx + span / 2, cy - span / 2, cy + span / 2, (size - 6) / span, 3);
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect x={0} y={0} width={f.W} height={f.H} rx={4} fill="white" stroke="#cbd5e1" />
      <R_Print f={f} shape={shape} move={(p) => apply(cols, p)} />
    </svg>
  );
}

export function HandBack() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const m = useMachine();
  const undo = m.stage >= 3 ? undoOf(Z) : null;
  const landed = m.ran && !m.running;
  const run = () => m.go(() => pass("−3 এর উল্টা −1/3: ছোট করে, আবার উল্টায়।"));
  const v = undo ? verdict(Z, undo) : null;
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {X4_OPTS.map((o, i) => (
          <Choice key={i} n={i} look={predictLook(i, guess, landed, X4_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="flex flex-col items-center gap-0.5">
              <R_Icon cols={o.cols} span={i === 2 ? 3.4 : 2.2} size={46} />
              <span className="text-center text-[0.7rem] leading-tight">{o.say}</span>
            </span>
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={`mt-2 flex items-center justify-center gap-2 ${FADE}`}>
          <div className="flex w-[8.75rem] flex-col items-center gap-1.5">
            <span className="text-xs text-muted">Z</span>
            <RecipeBox lens={Z} stage={m.stage} />
          </div>
          <R_Run
            f={X4F}
            shape="hand"
            paint={Z}
            undo={undo}
            t={m.t}
            label="Z দিয়ে আঁকা বাম হাত দেয়ালে; Z এর ফেরা lens দিয়ে ফেরালে ছোট ডান হাত, stencil এর দাগের উপর"
            className="max-w-[7rem]"
            chip={landed && v ? <R_Chip f={X4F} at={[0, -0.05]} text={v.home ? "মিললো" : "মিললো না"} tone={v.home ? OK : BAD} /> : null}
          />
        </div>
      )}
      {guess !== null && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {m.stage < 3 ? (
            <button type="button" className={primaryBtn} disabled={m.busy} onClick={() => m.next()}>
              {STEP_BTN[m.stage]}
            </button>
          ) : !landed ? (
            <button type="button" className={primaryBtn} disabled={m.busy} onClick={run}>
              হাত ফেরান
            </button>
          ) : (
            v && <HandBadge d={v.d} />
          )}
        </div>
      )}
      <Task done={landed}>{guess === null ? "Z এর ফেরা lens হাতটাকে কেমন ফেরাবে? আগে একটা ছবি বেছে নিন।" : "যন্ত্রে Z দিন, তিনটা কাজ করুন, তারপর হাত ফেরান।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Nasib's pocket lens [[1, 1], [1, 1]] (8.4, 8.5). Through the machine:
//     swap (nothing to see), flip, then ÷ 0: the machine stops. Then its line
//     on the wall: tap a lit spot, and the two spots that both land there
//     light up, (k, 0) and (0, k) (6.5's FlatCrossing, now named).

const X5F = patchFrame(-0.6, 5.6, -0.6, 5.6, 24); // 165 × 165
const X5_SPOTS: XY[] = [
  [2, 2],
  [3, 3],
  [5, 5],
];

export function ZeroRefuses() {
  const pass = useGate();
  const m = useMachine();
  const [spot, setSpot] = useSeed<number | null>("spot", null);
  const beam = usePlay(60);
  const stopped = m.stage >= 3 && !m.busy;
  const tap = (i: number) => {
    if (!stopped || beam.running) return;
    setSpot(i);
    beam.play(16, () => pass("det শূন্য হলে ভাগ চলে না: ফেরার lens নাই।"));
  };
  const bt = spot === null ? 0 : beam.running ? beam.k / 16 : 1;
  const s = spot === null ? null : X5_SPOTS[spot];
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <div className="flex w-[8.75rem] flex-col items-center gap-1.5">
          <span className="text-xs text-muted">নাসিবের lens</span>
          <RecipeBox lens={CRUSH} stage={m.stage} />
          {stopped && <span className={`text-center text-xs font-semibold text-danger ${FADE}`}>det 1·1 − 1·1 = 0. যন্ত্র থেমে গেলো।</span>}
        </div>
        {stopped ? (
          <div className={FADE}>
            <PatchWall f={X5F} label="নাসিবের lens এর আলো দেয়ালে একটা দাগ; দাগের একটা বিন্দুতে tap করলে দুইটা আলাদা বিন্দু জ্বলে, দুইটাই এখানে এসে পড়ে" className="max-w-[9.5rem]">
              <path d={`M${X5F.sx(-1)} ${X5F.sy(-1)}L${X5F.sx(6)} ${X5F.sy(6)}`} stroke={PK.glow} strokeWidth={X5F.u * 0.5} strokeOpacity={0.55} strokeLinecap="round" />
              <path d={`M${X5F.sx(-1)} ${X5F.sy(-1)}L${X5F.sx(6)} ${X5F.sy(6)}`} stroke={PK.lamp} strokeWidth={1.4} />
              {s &&
                [
                  [s[0], 0],
                  [0, s[1]],
                ].map((from, j) => {
                  const p = lerp(from as XY, s, bt);
                  return (
                    <g key={`${spot}${j}`}>
                      <path d={`M${X5F.sx(from[0])} ${X5F.sy(from[1])}L${X5F.sx(p[0])} ${X5F.sy(p[1])}`} stroke={BLUE} strokeWidth={1.6} strokeDasharray="4 3" />
                      <circle cx={X5F.sx(from[0])} cy={X5F.sy(from[1])} r={6} fill="white" stroke={BLUE} strokeWidth={2} className={POP} />
                      <text x={X5F.sx(from[0]) + (j === 0 ? -9 : 9)} y={X5F.sy(from[1]) + (j === 0 ? -9 : 14)} textAnchor={j === 0 ? "end" : "start"} fontSize={9} fontWeight={700} fontFamily={MONO} fill={BLUE}>
                        {`(${from[0]}, ${from[1]})`}
                      </text>
                    </g>
                  );
                })}
              {X5_SPOTS.map((p, i) => (
                <g
                  key={i}
                  role="button"
                  tabIndex={0}
                  aria-label={`দাগের বিন্দু (${p[0]}, ${p[1]})`}
                  className="cursor-pointer"
                  onClick={() => tap(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      tap(i);
                    }
                  }}
                >
                  <circle cx={X5F.sx(p[0])} cy={X5F.sy(p[1])} r={11} fill="transparent" />
                  <circle cx={X5F.sx(p[0])} cy={X5F.sy(p[1])} r={spot === i ? 6 : 4.5} fill={spot === i ? PK.lamp : "white"} stroke={PK.lamp} strokeWidth={2} />
                </g>
              ))}
            </PatchWall>
          </div>
        ) : (
          <div className="grid h-[10rem] w-[10rem] place-items-center rounded-lg border border-dashed border-border text-center text-xs text-muted">নাসিবের lens এর দাগ</div>
        )}
      </div>
      {s && bt >= 1 && (
        <div className={`mt-2 text-center text-sm ${FADE}`}>
          <span className="font-mono">{`(${s[0]}, 0)`}</span> আর <span className="font-mono">{`(0, ${s[1]})`}</span>, দুইজনই পড়ে <span className="font-mono">{`(${s[0]}, ${s[1]})`}</span> এ। কাকে ফেরাবে?
        </div>
      )}
      {m.stage < 3 && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={primaryBtn} disabled={m.busy} onClick={() => m.next()}>
            {STEP_BTN[m.stage]}
          </button>
        </div>
      )}
      <Task done={spot !== null && !beam.running}>{!stopped ? "নাসিবের lens যন্ত্রে দিন। তিনটা কাজ একটা একটা করে।" : "দাগের উপরের একটা আলোর বিন্দুতে tap করুন। কে কে এখানে এসে পড়ে?"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Small det. Rina's tiny lens 0.1I (8.4's TinyButFine): its undo is 10I.
//     Then a nearly flat lens [[2, 2], [1, 1.1]] (det 0.2): its undo is
//     [[5.5, −10], [−5, 10]]. Each tap runs the recipe at once; a bar of the
//     biggest number grows from the lens's to the undo's.

const X6_LENS: { name: string; cols: Cols; shape: Shape }[] = [
  {
    name: "রিনার ছোট lens",
    cols: colsOf([
      [0.1, 0],
      [0, 0.1],
    ]),
    shape: "flower",
  },
  {
    name: "প্রায় চ্যাপ্টা lens",
    cols: colsOf([
      [2, 2],
      [1, 1.1],
    ]),
    shape: "heart",
  },
];
const X6_MAX = 10;
const big = (c: Cols) => Math.max(...c.flat().map(Math.abs));

/** the biggest number of a lens as a bar, out of X6_MAX */
function R_Bar({ v, tone, label }: { v: number; tone: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-14 shrink-0 text-right text-muted">{label}</span>
      <span className="relative h-3.5 w-[9rem] rounded-full bg-foreground/10">
        <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${Math.max(2, (v / X6_MAX) * 100)}%`, background: tone }} />
      </span>
      <span className="w-8 font-mono font-bold">{fmt(v, true)}</span>
    </div>
  );
}

export function SmallDetBig() {
  const pass = useGate();
  const [tab, setTab] = useSeed("tab", 0);
  const [done, setDone] = useSeed<boolean[]>("done", [false, false]);
  const tick = usePlay(750);
  const L = X6_LENS[tab];
  const U = undoOf(L.cols)!;
  const made = done[tab];
  const make = () => {
    if (tick.running || made) return;
    const nd = done.map((d, i) => d || i === tab);
    setDone(nd);
    tick.play(1, () => {
      if (nd.every(Boolean)) pass("প্রায় চ্যাপ্টা lens এর ফেরা lens বিশাল।");
    });
  };
  const pf = tab === 0 ? patchFrame(-1.4, 2.4, -1.4, 2.4, 22) : patchFrame(-0.4, 4.4, -0.4, 2.8, 22);
  return (
    <>
      <div className="mb-2 flex justify-center gap-1.5">
        {X6_LENS.map((l, i) => (
          <button key={l.name} type="button" className={`rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors motion-reduce:transition-none ${tab === i ? "border-cat-blue bg-cat-blue text-white" : done[i] ? "border-accent text-accent-text" : "border-border hover:border-cat-blue/60"}`} onClick={() => setTab(i)} disabled={tick.running}>
            {l.name}
          </button>
        ))}
      </div>
      <div key={tab} className={`flex items-center justify-center gap-2 ${FADE}`}>
        <PatchWall f={pf} label={tab === 0 ? "রিনার ছোট lens দিয়ে আঁকা ফুল, এক বিন্দুর মতো ছোট; পাশে আসল ফুলের দাগ" : "প্রায় চ্যাপ্টা lens দিয়ে আঁকা heart, সরু একটা ফালি; পাশে আসল heart এর দাগ"} className="max-w-[7.5rem]">
          <R_Print f={pf} shape={L.shape} move={(p) => p} look="ghost" />
          <R_Print f={pf} shape={L.shape} move={(p) => apply(L.cols, p)} look="paint" />
        </PatchWall>
        <div className="flex flex-col items-center gap-1.5">
          <Mat cells={matOf(L.cols, true)} />
          <span className="text-xs text-muted">
            det <span className="font-mono">{fmt(det(L.cols), true)}</span>
          </span>
          {made && (
            <span className={`flex items-center gap-1 ${POP}`}>
              <FeraMark size={14} />
              <Mat cells={matOf(U, true)} />
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-col items-center gap-1">
        <R_Bar v={big(L.cols)} tone="#94a3b8" label="lens এর" />
        <R_Bar v={made ? big(U) : 0} tone={tab === 0 ? OK : BAD} label="ফেরার" />
      </div>
      <div className="mt-2 flex justify-center">
        {!made && (
          <button type="button" className={primaryBtn} disabled={tick.running} onClick={make}>
            নিয়মে ফেরা lens বানান
          </button>
        )}
      </div>
      <Task done={done.every(Boolean) && !tick.running}>দুইটা lens এরই ফেরা lens বানান। দেখুন বড় সংখ্যাটা কত বড় হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn (Check Q1). The লাইট ভাই's lens [[4, 7], [2, 6]] threw the
//     heart's second copy. The reader builds its undo by hand: tap two cells
//     to swap them, flip a cell's sign, set the divisor; then run. A wrong
//     lens throws the heart crooked, too big, or off the card.

const X7F = patchFrame(-2.4, 11.4, -2.4, 8.4, 12); // 182 × 146
const X7_PAINT = Q1;
/** starting cells, rows first: a, b, c, d */
const X7_START = [4, 7, 2, 6];

export function YourRecipe() {
  const pass = useGate();
  const [cells, setCells] = useSeed<number[]>("cells", X7_START);
  const [sel, setSel] = useSeed<number | null>("sel", null);
  const [div, setDiv] = useSeed("div", 1);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1300, 26);
  const mine: Cols = colsOf([
    [cells[0] / div, cells[1] / div],
    [cells[2] / div, cells[3] / div],
  ]);
  const v = verdict(X7_PAINT, mine);
  const tapCell = (i: number) => {
    if (run.running) return;
    setRan(false);
    if (sel === null) setSel(i);
    else if (sel === i) setSel(null);
    else {
      const n = [...cells];
      [n[sel], n[i]] = [n[i], n[sel]];
      setCells(n);
      setSel(null);
    }
  };
  const flip = () => {
    if (sel === null || run.running) return;
    const n = [...cells];
    n[sel] = -n[sel];
    setCells(n);
    setRan(false);
  };
  const go = () => {
    if (run.running) return;
    setSel(null);
    setRan(false);
    run.run(() => {
      setRan(true);
      if (v.home) pass("0.6, −0.7, −0.2, 0.4: heart ফিরলো।");
      else setMiss((x) => x + 1);
    });
  };
  const t = run.running ? run.t : ran ? 1 : 0;
  const over = ran && !run.running;
  const swapped = cells[0] === 6 && cells[3] === 4;
  const nope = !swapped
    ? "Heart বাঁকা হয়ে এলো। কোনার 4 আর 6 কি জায়গা বদলেছে?"
    : !(cells[1] === -7 && cells[2] === -2)
      ? "Heart বাঁকা হয়ে এলো। বাকি দুইটা, 7 আর 2, দুইটারই সাইন উল্টাতে হয়।"
      : Math.abs(div) !== 10
        ? `Heart এর মাপ ঠিক হলো না। ভাগ ${div} দিয়ে দিলেন; det হলো 4·6 − 7·2।`
        : "Heart উল্টা হয়ে এলো। det 10, −10 না।";
  const pos: [number, number][] = AT_PLAIN;
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <R_Run f={X7F} shape="heart" paint={X7_PAINT} undo={mine} t={t} label="লাইট ভাইয়ের lens দিয়ে আঁকা বড় হেলানো heart; আপনার বানানো lens দিয়ে ফেরালে কোথায় পড়ে" className="max-w-[10.5rem]" chip={over ? <R_Chip f={X7F} at={[4.5, -1.6]} text={v.home ? "মিললো" : "মিললো না"} tone={v.home ? OK : BAD} /> : null} />
        <div className="flex flex-col items-center gap-1.5">
          <span className="inline-flex items-stretch font-mono text-sm font-bold">
            <R_Bracket side="l" />
            <span className="grid grid-cols-2 gap-1 p-0.5">
              {pos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`ঘর ${i + 1}: ${sg(cells[i])}`}
                  onClick={() => tapCell(i)}
                  className={`h-8 w-9 cursor-pointer rounded-md border-2 font-mono text-sm font-bold transition-colors motion-reduce:transition-none ${sel === i ? "border-cat-blue bg-cat-blue/15" : "border-border hover:border-cat-blue/60"}`}
                >
                  <span key={cells[i]} className={POP}>
                    {sg(cells[i])}
                  </span>
                </button>
              ))}
            </span>
            <R_Bracket side="r" />
          </span>
          <span className="flex items-center gap-1 text-xs text-muted">ভাগ</span>
          <Stepper value={div} onChange={(n) => {
              setDiv(n === 0 ? (div > 0 ? -1 : 1) : n);
              setRan(false);
            }} min={-20} max={20} label="ভাগ" />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        <button type="button" className={quietBtn} disabled={sel === null || run.running} onClick={flip}>
          সাইন উল্টান
        </button>
        <button type="button" className={primaryBtn} disabled={run.running} onClick={go}>
          heart ফেরান
        </button>
      </div>
      {sel !== null && <div className="mt-1 text-center text-xs text-muted">আরেকটা ঘরে tap করলে দুইটা জায়গা বদলাবে।</div>}
      {over && !v.home && <Nope key={miss}>{nope}</Nope>}
      <Task done={over && v.home}>সোমের নিয়মে এই lens এর ফেরা lens বানান: দুইটা ঘরে tap করলে জায়গা বদলায়। তারপর heart ফেরান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it (Check Q2). Three lenses with their heart paintings. Which one
//     can never be thrown back? A wrong tap throws its painting back onto the
//     ghost; the right one stops the machine at ÷ 0.

const X8_LENS: Cols[] = [
  colsOf([
    [3, 1],
    [1, 2],
  ]),
  colsOf([
    [3, 6],
    [1, 2],
  ]),
  colsOf([
    [2, 0],
    [0, 5],
  ]),
];
const X8_RIGHT = 1;
const X8_NOPE = ["", "", ""].map((_, i) => {
  const D = det(X8_LENS[i]);
  return `এটা তো ফিরে এলো, ঠিক দাগের উপর। det ${fmt(D)}, শূন্য না।`;
});
const X8F = patchFrame(-0.6, 9.6, -0.6, 5.6, 16); // 179 × 115

export function TryZero() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1200, 24);
  const choose = (i: number) => {
    if (run.running || (ran && pick === X8_RIGHT)) return;
    setPick(i);
    setRan(false);
    run.run(() => {
      setRan(true);
      if (i === X8_RIGHT) pass("3·2 − 6·1 = 0: ফেরার পথ নাই।");
      else setMiss((m) => m + 1);
    });
  };
  const t = run.running ? run.t : ran ? 1 : 0;
  const over = ran && !run.running;
  const L = pick === null ? null : X8_LENS[pick];
  const U = L ? undoOf(L) : null;
  return (
    <>
      <R_Run
        f={X8F}
        shape="heart"
        paint={L ?? I2}
        undo={U}
        t={t}
        label="বেছে নেওয়া lens এর heart দেয়ালে; ফেরানো গেলে heart আসল দাগের উপর ফিরে আসে"
        className="mx-auto max-w-[12rem]"
        chip={over && pick === X8_RIGHT ? <R_Chip f={X8F} at={[6, 4.6]} text="÷ 0: যন্ত্র থামলো" tone={BAD} /> : over ? <R_Chip f={X8F} at={[1.5, 2.2]} text="মিললো" tone={OK} /> : null}
      />
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X8_LENS.map((c, i) => (
          <Choice key={i} n={i} look={pick === i && over ? (i === X8_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={run.running || (over && pick === X8_RIGHT)} onClick={() => choose(i)}>
            <span className="flex flex-col items-center gap-1">
              <R_Icon cols={c} shape="heart" size={50} span={i === 1 ? 9.5 : 5.2} />
              <Mat cells={matOf(c)} small tint={false} />
            </span>
          </Choice>
        ))}
      </div>
      {over && pick !== null && pick !== X8_RIGHT && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={over && pick === X8_RIGHT}>কোন ছবিটা আর কোনোদিন stencil এ ফিরবে না? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The bet opened on the painted hand. Each card throws the traced hand
//     back through its lens onto the stencil card: Nasib's lands slanted and
//     wrong-sized; Karim's (no ÷) three times too long, upside down; the bag's
//     lands on the ghost; the লাইট ভাই's "no rule" has nothing to run.

const X9F = patchFrame(-3.6, 2.6, -3.6, 3.6, 17); // 121 × 138
const X9_LENS: (Cols | null)[] = [
  colsOf([
    [-1, 0.5],
    [0.5, 1],
  ]),
  colsOf([
    [1, -1],
    [-2, -1],
  ]),
  undoOf(Z),
  null,
];
const X9_SAY = ["হাত বাঁকা, মাপও ভুল। সংখ্যা উল্টালে lens উল্টায় না।", "ভাগ ভুলে গেলো: হাত 3 গুণ লম্বা, মাথা নিচে।", "ঠিক দাগের উপর। ছোট, আর ডান হাত।", "খোঁজা লাগে নাই। চার সংখ্যা থেকেই lens বের হলো।"];

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const run = useLensRun(1200, 24);
  const tap = (i: number) => {
    if (run.running) return;
    const no = open.includes(i) ? open : [...open, i];
    setOpen(no);
    setCur(i);
    run.run(() => {
      if (no.length === X1_CARDS.length) pass("চার সংখ্যা থেকেই ফেরার lens।");
    });
  };
  const L = cur === null ? null : (X9_LENS[cur] ?? undoOf(Z));
  const t = cur === null ? 0 : run.running ? run.t : 1;
  const landed = cur !== null && !run.running;
  const v = L ? verdict(Z, L) : null;
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <R_Run f={X9F} shape="hand" paint={Z} undo={L} t={t} label="দেয়ালের হাত, বাজির যেই card খুলবেন তার lens দিয়ে ফেরানো; আসল stencil এর দাগ হালকা করে" className="max-w-[8rem]" />
        <div className="flex w-[8.5rem] flex-col items-center gap-1 text-center text-sm">
          {landed && cur !== null && v ? (
            <div key={cur} className={`flex flex-col items-center gap-1 ${FADE}`}>
              <span className={v.home ? "font-semibold text-accent-text" : "text-danger"}>{X9_SAY[cur]}</span>
              {v.home && <HandBadge d={v.d} />}
            </div>
          ) : (
            <span className="text-muted">একটা card খুলুন</span>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={open.includes(i) ? (i === 2 ? "right" : "wrong") : "idle"} disabled={run.running} onClick={() => tap(i)}>
            <span className="flex flex-col gap-0.5 text-sm leading-tight">
              {c.cells ? <Mat cells={c.cells} small /> : <span className="font-semibold">কোনো নিয়ম নাই</span>}
              <span className="text-xs text-muted">{c.who}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={open.length === X1_CARDS.length && !run.running}>বাজির চারটা card একটা একটা করে খুলুন। প্রতিটার lens দিয়ে হাত ফেরান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage bits for the story scenes.

const SW: [number, number] = [8, 30]; // the stage wall's top-left
const PJ: [number, number] = [214, 150]; // the machine's feet
/** Z's painted hand on the stage wall: centred left of the door */
const onStage = (p: XY): [number, number] => [SW[0] + STAGE_WALL_F.sx(p[0]), SW[1] + STAGE_WALL_F.sy(p[1])];
const ST_HAND_AT: XY = [3.4, 1.2];
const ST_HAND_S = 0.9;
const stHand = (m: Cols): Move => (p) => {
  const q = apply(m, p);
  return [ST_HAND_AT[0] + q[0] * ST_HAND_S, ST_HAND_AT[1] + q[1] * ST_HAND_S];
};

/** the painted hand on the stage wall (in wall units, drawn with STAGE_WALL_F) */
function St_WallHand() {
  const f = STAGE_WALL_F;
  return (
    <g className="pointer-events-none">
      <path d={pathOf(f, stHand(Z), SQ, true)} fill={PK.paint} fillOpacity={0.85} stroke={PK.paintDark} strokeWidth={0.7} />
      <path d={pathOf(f, stHand(Z), HAND, true)} fill="#fde68a" stroke={PK.paintDark} strokeWidth={0.5} />
    </g>
  );
}

/** আপা in her শাড়ি: the cast's আপা with a red আঁচল, and her name */
function St_Apa({ x, y = 150, facing = 1, arm = "down", walking = false }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "hold" | "point" | "wave"; walking?: boolean }) {
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

/** a sheet of পলিথিন held up, the hand traced on it in marker */
function St_Poly({ x, y, w = 26 }: { x: number; y: number; w?: number }) {
  const u = w * 0.55;
  const d = HAND.map((p, i) => `${i ? "L" : "M"}${(x - u / 2 + p[0] * u).toFixed(1)} ${(y + u / 2 - p[1] * u).toFixed(1)}`).join("") + "Z";
  return (
    <g className="pointer-events-none">
      <rect x={x - w / 2} y={y - w / 2} width={w} height={w} rx={1.5} fill="#e0f2fe" fillOpacity={0.7} stroke="#94a3b8" strokeWidth={0.7} />
      <path d={d} fill="none" stroke="#1e3a8a" strokeWidth={0.8} />
    </g>
  );
}

/** Som's খাতা, open, two little lens grids written on it */
function St_Khata({ x, y, open = true, stencil = false }: { x: number; y: number; open?: boolean; stencil?: boolean }) {
  return (
    <g className="pointer-events-none">
      {open ? (
        <>
          <path d={`M${x - 20} ${y - 12}L${x} ${y - 10}L${x + 20} ${y - 12}L${x + 20} ${y + 10}L${x} ${y + 12}L${x - 20} ${y + 10}Z`} fill="#fefce8" stroke="#a16207" strokeWidth={0.8} />
          <path d={`M${x} ${y - 10}V${y + 12}`} stroke="#a16207" strokeWidth={0.6} />
          {!stencil &&
            [-10, 10].map((dx) => (
              <g key={dx}>
                <path d={`M${x + dx - 6} ${y - 6}v11M${x + dx + 6} ${y - 6}v11`} stroke={INK} strokeWidth={0.7} />
                <path d={`M${x + dx - 3.5} ${y - 3}h2M${x + dx + 1.5} ${y - 3}h2M${x + dx - 3.5} ${y + 2}h2M${x + dx + 1.5} ${y + 2}h2`} stroke={INK} strokeWidth={1} />
              </g>
            ))}
          {stencil && <rect x={x - 17} y={y - 8} width={14} height={14} fill="#b45309" />}
        </>
      ) : (
        <rect x={x - 12} y={y - 9} width={24} height={17} rx={1} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth={0.8} />
      )}
    </g>
  );
}

/** a small lens held up: a glass disc with a number grid scratched on */
function St_Lens({ x, y, fill = "#d6d3d1", r = 6, fera = false }: { x: number; y: number; fill?: string; r?: number; fera?: boolean }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={0.9} />
      {fera ? <path d={`M${x + r * 0.5} ${y + r * 0.2}a${r * 0.5} ${r * 0.5} 0 1 1 -${r * 0.2} -${r * 0.5}`} fill="none" stroke={INK} strokeWidth={0.9} /> : <path d={`M${x - r * 0.4} ${y}h${r * 0.8}M${x} ${y - r * 0.4}v${r * 0.8}`} stroke={INK} strokeWidth={0.6} opacity={0.6} />}
    </g>
  );
}

/** the stencil card, cut from a cereal box, the hand cut out of it */
function St_Stencil({ x, y, u = 14 }: { x: number; y: number; u?: number }) {
  const d = HAND.map((p, i) => `${i ? "L" : "M"}${(x - u / 2 + p[0] * u).toFixed(1)} ${(y + u / 2 - p[1] * u).toFixed(1)}`).join("") + "Z";
  return (
    <g className="pointer-events-none">
      <rect x={x - u * 0.8} y={y - u * 0.8} width={u * 1.6} height={u * 1.6} rx={1.5} fill="#b45309" stroke="#78350f" strokeWidth={0.7} />
      <path d={d} fill="#fef3c7" />
    </g>
  );
}

/** the sun, low or high */
function St_Sun({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none transition-transform duration-1000 ease-in-out motion-reduce:transition-none" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <circle r={16} fill="#fde047" opacity={0.3} />
      <circle r={10} fill="#fde047" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · দুপুর। The wall with the painted hand. আপা holds her palm up beside
//      it; Rina traces the hand on পলিথিন; the লাইট ভাই wipes his forehead.

export function NoonHand({}: Story) {
  const s = useScene(3, [600, 2000, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="দুপুর; দেয়ালে Z দিয়ে আঁকা মেহেদি হাত, বড় আর উল্টা; আপা নিজের হাতের তালু পাশে তুলে ধরলেন; রিনা পলিথিনে হাতটা দাগিয়ে নিলো; লাইট ভাই কপালের ঘাম মুছলেন">
        <St_Sun x={176} y={20} />
        <StageWall x={SW[0]} y={SW[1]}>
          <St_WallHand />
        </StageWall>
        <St_Apa x={206} facing={-1} arm={k >= 1 ? "point" : "down"} />
        <Person who="rina" x={148} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 && (
          <g className={POP}>
            <St_Poly x={126} y={100} />
          </g>
        )}
        <LightBhai x={274} y={150} facing={-1} arm={k >= 3 ? "wave" : "down"} />
        {k >= 3 && <Bubble x={274} y={84} side="left" lines={["আপা, এর কোনো হিসাব নাই।", "হাতে খুঁইজা বাইর করতে হয়।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1b · Nasib and Karim: two answers. Nasib flips every number; Karim, peeking
//      into Som's খাতা, shuffles Z's numbers. Som, head down, says nothing.

export function NoHisab({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="উঠানে নাসিব, করিম আর সোম; নাসিব বললো আবার সব সংখ্যা উল্টাও; করিম সোমের খাতায় উঁকি দিয়ে Z এর সংখ্যা এদিক ওদিক করে লিখলো; সোম খাতায় মাথা নিচু করে আছে">
        <Person who="nasib" x={60} y={150} facing={1} arm={k === 1 ? "point" : "down"} label />
        <Person who="som" x={170} y={150} facing={-1} arm="hold" label />
        <St_Khata x={158} y={112} />
        <Person who="karim" x={k >= 2 ? 206 : 250} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} walking={k === 2} label ms={1000} />
        <StageMora x={296} y={150} />
        {k === 1 && <Bubble x={60} y={84} side="right" lines={["আবার সব সংখ্যা উল্টাও।", "2 হলে 1/2।"]} />}
        {k === 2 && <Bubble x={206} y={84} side="left" lines={["Z এর সংখ্যাই,", "একটু এদিক ওদিক।"]} />}
        {k >= 3 && <Bubble x={170} y={84} side="mid" tone="think" lines={["G আর G⁻¹…"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · Som's খাতা: G on the left page, 9.1's G⁻¹ on the right. He looks from
//      one to the other.

export function SomsKhata({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const num = (x: number, y: number, t: string, fs = 8.5) => (
    <text x={x} y={y} fontSize={fs} fontWeight={700} fontFamily={MONO} fill={INK} textAnchor="middle">
      {t}
    </text>
  );
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সোম খাতা খুলে বসেছে; বাঁ পাতায় G, ডান পাতায় 9.1 এর G⁻¹; সোম একবার এদিক দেখে, একবার ওদিক; বললো, দুইটার মধ্যে কিছু একটা মিলে">
        <Person who="som" x={60} y={150} facing={1} arm="hold" label />
        <St_Khata x={76} y={112} />
        <g transform="translate(146 22)">
          <rect x={-4} y={0} width={164} height={52} rx={4} fill="#fefce8" stroke="#a16207" />
          <path d="M72 3V49" stroke="#a16207" strokeWidth={0.8} />
          <text x={6} y={30} fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK}>
            G
          </text>
          <path d="M24 14v26M60 14v26" stroke={INK} strokeWidth={0.8} />
          {num(35, 24, "2")}
          {num(49, 24, "1")}
          {num(35, 36, "1")}
          {num(49, 36, "2")}
          {k >= 1 && (
            <g className={POP}>
              <text x={77} y={30} fontSize={9} fontWeight={800} fontFamily={MONO} fill={INK}>
                G⁻¹
              </text>
              <path d="M98 14v26M152 14v26" stroke={INK} strokeWidth={0.8} />
              {num(111, 24, "2/3", 7)}
              {num(138, 24, "−1/3", 7)}
              {num(111, 36, "−1/3", 7)}
              {num(138, 36, "2/3", 7)}
            </g>
          )}
        </g>
        {k >= 2 && <Bubble x={60} y={84} side="right" lines={["দুইটার মধ্যে", "কিছু একটা মিলে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · The hand. Rina slides the traced পলিথিন into the machine। আপা, at
//      the wall: হাতটা উল্টা হয়ে আছে। ফেরত আসলে সোজা হবে তো?

export function HandInMachine({}: Story) {
  const s = useScene(3, [600, 1800, 2200, 2600]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="রিনা হাত দাগানো পলিথিন যন্ত্রে ঢুকালো; আপা দেয়ালের হাতের সামনে দাঁড়িয়ে বললেন, হাতটা উল্টা হয়ে আছে, ফেরত আসলে সোজা হবে তো">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_WallHand />
        </StageWall>
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        <Person who="rina" x={k >= 1 ? 262 : 290} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} label ms={900} />
        {k === 0 && <St_Poly x={284} y={110} w={20} />}
        {k >= 1 && (
          <g className={POP}>
            <St_Poly x={lx + 14} y={ly} w={14} />
          </g>
        )}
        <St_Apa x={k >= 2 ? 150 : 176} facing={-1} arm={k >= 3 ? "point" : "down"} walking={k === 2} />
        {k >= 3 && <Bubble x={150} y={84} side="mid" lines={["হাতটা উল্টা হয়ে আছে।", "ফেরত আসলে সোজা হবে তো?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · Nasib's pocket lens. He holds it up; the line it drew in 8.5 is still
//      on the wall's edge. ইটা দিয়াও বানাও।

export function PocketLens({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const a = onStage([-2, -1.5]);
  const b = onStage([4.5, 5]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব পকেট থেকে তার lens বের করলো, চারটাই 1; দেয়ালের কোনায় এখনো তার আলোর দাগের চক দাগ; নাসিব বললো, এইটারও বানাও">
        <StageWall x={SW[0]} y={SW[1]}>
          <path d={`M${a[0] - SW[0]} ${a[1] - SW[1]}L${b[0] - SW[0]} ${b[1] - SW[1]}`} stroke="#94a3b8" strokeWidth={1.4} strokeDasharray="3 2" />
        </StageWall>
        <Person who="som" x={206} y={150} facing={-1} arm="hold" label />
        <St_Khata x={194} y={112} />
        <Person who="nasib" x={262} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 1 && (
          <g className={POP}>
            <St_Lens x={246} y={100} r={7} />
            {["1 1", "1 1"].map((l, i) => (
              <text key={i} x={230} y={98 + i * 7} textAnchor="end" fontSize={6.5} fontWeight={700} fontFamily={MONO} fill={INK}>
                {l}
              </text>
            ))}
          </g>
        )}
        {k >= 2 && <Bubble x={262} y={80} side="left" lines={["এইটারও বানাও।", "সোমের নিয়মে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Two small lenses. Rina's tiny one from 8.4 (0.1 all round); the লাইট
//      ভাই's cheapest, nearly flat.

export function TwoSmallLenses({}: Story) {
  const s = useScene(2, [600, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="রিনা 8.4 এর সবচেয়ে ছোট lens টা তুলে ধরলো; লাইট ভাই ব্যাগ থেকে একটা প্রায় চ্যাপ্টা lens বের করলেন">
        <Person who="rina" x={90} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 1 && (
          <g className={POP}>
            <St_Lens x={106} y={104} r={3} fill="#bae6fd" />
            {k === 1 && <Bubble x={90} y={80} side="right" lines={["সবচেয়ে ছোট lens।", "কোনায় 0.1, বাকি 0।"]} />}
          </g>
        )}
        <LightBhai x={226} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} />
        <rect x={250} y={124} width={14} height={11} rx={2} fill="#78350f" />
        {k >= 2 && (
          <g className={POP}>
            <ellipse cx={208} cy={104} rx={9} ry={3} fill="#d6d3d1" stroke={INK} strokeWidth={0.9} />
            <Bubble x={226} y={80} side="left" lines={["এইটা প্রায় চ্যাপ্টা।", "সস্তা মাল।"]} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 9a · The stencil cut. আপা presses her palm on it. The লাইট ভাই laughs.

export function ApaPalm({}: Story) {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="বিকাল; রিনা cereal এর বাক্স থেকে নতুন stencil কেটে বের করলো; আপা stencil এর উপর নিজের হাত রাখলেন, মাপে মাপ; লাইট ভাই হাসলেন, মাথা চুলকালেন">
        <Person who="rina" x={100} y={150} facing={1} arm="hold" label />
        {k === 0 && <rect x={108} y={100} width={22} height={16} rx={1} fill="#b45309" stroke="#78350f" strokeWidth={0.7} />}
        {k >= 1 && (
          <g className={POP}>
            <St_Stencil x={124} y={104} />
          </g>
        )}
        <St_Apa x={160} facing={-1} arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && <path d="M132 100q6 -6 12 0" stroke="#e8b88f" strokeWidth={4} strokeLinecap="round" fill="none" className={POP} />}
        <LightBhai x={246} y={150} facing={-1} arm={k >= 3 ? "wave" : "down"} />
        {k >= 3 && <Bubble x={246} y={84} side="left" lines={["হাতে খুঁইজা বাইর করতে হয়!", "হা হা। কী কইছিলাম।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 10a · Evening. আপা puts the stencil between two pages of a খাতা।

export function KhataPack({}: Story) {
  const s = useScene(2, [600, 2000, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যা; আপা stencil টা একটা খাতার দুই পাতার মাঝে রাখলেন; খাতা বন্ধ করলেন">
        <St_Apa x={140} facing={1} arm="hold" />
        {k <= 1 && <St_Khata x={166} y={110} stencil={k >= 1} />}
        {k >= 2 && (
          <g className={POP}>
            <St_Khata x={166} y={110} open={false} />
          </g>
        )}
        <circle cx={270} cy={120} r={12} fill="#f97316" opacity={0.7} />
      </Stage>
    </StoryFrame>
  );
}

// 10b · The bridge to 9.3. আপার আরেকটা হাত beside the door (Z, then W, then L:
//      [[4, 2], [2, 4]], 12 ঘর, right-handed)। আপা points at it. Karim lines up
//      three undo lenses in the same order.

const ST_DOOR_HAND: Move = (p) => {
  const q = apply(onto(colsOf([[2, 0], [0, 2]]), LENS_G), p);
  return [2.4 + 0.26 * q[0], 0.1 + 0.26 * q[1]];
};

export function DoorPiece({}: Story) {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="দরজার পাশে আপার আরেকটা বড় হাত, Z তারপর W তারপর L দিয়ে আঁকা; আপা আঙুল দিয়ে দেখালেন, ওইটাও নিবো; করিম যন্ত্রের সামনে তিনটা ফেরা lens সাজালো, আগে Z এর, তারপর W এর, তারপর L এর">
        <StageWall x={SW[0]} y={SW[1]}>
          <path d={pathOf(STAGE_WALL_F, ST_DOOR_HAND, SQ, true)} fill={PK.paint} fillOpacity={0.85} stroke={PK.paintDark} strokeWidth={0.7} />
          <path d={pathOf(STAGE_WALL_F, ST_DOOR_HAND, HAND, true)} fill="#fde68a" stroke={PK.paintDark} strokeWidth={0.5} />
        </StageWall>
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        <St_Apa x={124} facing={-1} arm={k >= 1 ? "point" : "down"} />
        {k === 1 && <Bubble x={124} y={84} side="mid" lines={["দরজার পাশেরটাও", "নিবো।"]} />}
        <Person who="karim" x={270} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 && (
          <g>
            <path d={`M${lx - 6} ${ly + 8}H${lx - 52}`} stroke="#b08d3c" strokeWidth={2} />
            {["Z⁻¹", "W⁻¹", "H"].map((l, i) =>
              k >= 2 + (i > 0 ? 1 : 0) || i === 0 ? (
                <g key={l} className={POP} style={{ transitionDelay: `${i * 250}ms` }}>
                  <St_Lens x={lx - 12 - i * 16} y={ly} fill={["#fde68a", "#ddd6fe", "#bae6fd"][i]} fera />
                  <text x={lx - 12 - i * 16} y={ly - 9} textAnchor="middle" fontSize={6.5} fontWeight={800} fontFamily={MONO} fill={INK}>
                    {l}
                  </text>
                </g>
              ) : null,
            )}
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · The stake: all day. 9.1's hunt, a dot dragged until its light sat on
//      e₁; the sun moves; the hand still waits; আপার ট্রাংক in the evening.

const X1B_SAY = [
  "9.1 এ ফুলের ফেরা lens পেতে dot টেনে টেনে বসাতে হয়েছিলো। প্রথমে e₁ এর জন্য।",
  "তারপর e₂ এর জন্য। একটা ছবির জন্য দুইবার খোঁজা।",
  "এবার হাত। আবার খোঁজা। সূর্য হেলে যাচ্ছে।",
  "সন্ধ্যায় আপা ট্রাংক গোছাবেন। তার আগে stencil চাই।",
];
const X1B_F = patchFrame(-1.4, 2.4, -1.4, 3.4, 26); // 115 × 141
/** where the dragged dot's light fell, try by try, until it sat on e₁ (then e₂) */
const X1B_TRIES: XY[][] = [
  [
    [1.8, 2.4],
    [1.6, 0.8],
    [1, 0],
  ],
  [
    [1.8, 2.4],
    [0.7, 1.7],
    [0, 1],
  ],
];

export function AllDay() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  const f = X1B_F;
  const sun = [18, 46, 74, 100][k];
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <div className="mx-auto flex w-[12rem] flex-col items-center gap-1">
        <svg viewBox="0 0 120 26" className="block h-auto w-full" role="img" aria-label="আকাশে সূর্য সরে যাচ্ছে; শেষে আপার ট্রাংক">
          <rect x={0} y={0} width={120} height={26} rx={5} fill={k >= 3 ? "#fed7aa" : "#e0f2fe"} className="transition-[fill] duration-700 motion-reduce:transition-none" />
          <g style={{ transform: `translate(${sun}px, ${k >= 3 ? 18 : 12}px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
            <circle r={6} fill={k >= 3 ? "#f97316" : "#fde047"} />
          </g>
          {k >= 3 && (
            <g className={POP}>
              <rect x={80} y={9} width={26} height={14} rx={1.5} fill="#1e3a8a" stroke="#0f172a" strokeWidth={0.8} />
              <path d="M80 13H106M93 9V23" stroke="#facc15" strokeWidth={1} />
              <rect x={91} y={14.5} width={4} height={4} rx={0.6} fill="#facc15" />
            </g>
          )}
        </svg>
        <div className="w-[7.5rem]">
          <PatchWall f={f} label="stencil এর card এ dot টেনে টেনে খোঁজা; পরে দেয়ালে Z এর হাত, প্রশ্নবোধক" className="max-w-none">
            {k <= 1 && (
              <g key={k}>
                <circle cx={f.sx(k === 0 ? 1 : 0)} cy={f.sy(k === 0 ? 0 : 1)} r={7} fill="none" stroke={OK} strokeWidth={1.4} strokeDasharray="3 2" />
                <text x={f.sx(k === 0 ? 1 : 0) + 9} y={f.sy(k === 0 ? 0 : 1) - 6} fontSize={9} fontWeight={700} fill={OK}>
                  {k === 0 ? "e₁" : "e₂"}
                </text>
                <path d={X1B_TRIES[k].map((p, i) => `${i ? "L" : "M"}${f.sx(p[0])} ${f.sy(p[1])}`).join("")} fill="none" stroke={BLUE} strokeWidth={1} strokeDasharray="3 2" />
                {X1B_TRIES[k].map((p, i) => (
                  <circle key={i} cx={f.sx(p[0])} cy={f.sy(p[1])} r={3.4} fill={i === 2 ? BLUE : "white"} stroke={BLUE} strokeWidth={1.4} className={POP} style={{ transitionDelay: `${i * 350}ms` }} />
                ))}
              </g>
            )}
            {k >= 2 && (
              <g className={FADE}>
                <R_Print f={f} shape="hand" move={(p) => apply(Z, p)} look="paint" />
                <text x={f.sx(1.3)} y={f.sy(1.9)} fontSize={24} fontWeight={800} fill={BLUE}>
                  ?
                </text>
              </g>
            )}
          </PatchWall>
        </div>
      </div>
    </Scene>
  );
}

// 2½ · Why divide. G throws one ঘর onto 3 ঘর। Swap and flip without the ÷:
//      the ঘর comes back square but 3 long and 3 wide, 9 ঘর। Divide by 3:
//      it sits on the ghost.

const X2B_SAY = ["এক ঘর।", "G দিয়ে গেলে 3 ঘর।", "অদলবদল আর সাইন উল্টানো lens দিয়ে ফেরালে: সোজা, কিন্তু 3 গুণ লম্বা, 3 গুণ চওড়া। 9 ঘর।", "3 দিয়ে ভাগ করলে: ঠিক এক ঘর।"];
const X2B_F = patchFrame(-0.4, 3.4, -0.4, 3.4, 30); // 130 × 130

export function WhyDivide() {
  const s = useScene(3, [600, 1600, 2400, 2200]);
  const k = s.k;
  const f = X2B_F;
  const cols: Cols = k === 0 ? I2 : k === 1 ? LENS_G : k === 2 ? colsOf([[3, 0], [0, 3]]) : I2;
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <div className="mx-auto w-[8.5rem]">
        <PatchWall f={f} label="এক ঘর G দিয়ে 3 ঘর; ভাগ ছাড়া ফেরালে 9 ঘর; 3 দিয়ে ভাগ করলে আবার এক ঘর" className="max-w-none">
          <path d={pathD(f, SQ)} fill="none" stroke={OK} strokeWidth={1.5} strokeDasharray="4 3" />
          <path key={k} d={pathD(f, patchCorners(cols))} fill={k === 2 ? PK.bad : PK.glow} fillOpacity={k === 2 ? 0.25 : 0.65} stroke={k === 2 ? PK.bad : PK.lamp} strokeWidth={1.3} className={FADE} />
        </PatchWall>
      </div>
    </Scene>
  );
}

// 3½a · The recipe in letters: a, d trade places; b, c take a minus; the
//       whole thing over ad − bc.

const X3B_SAY = ["যেকোনো lens: a, b, c, d.", "a আর d জায়গা বদলায়।", "b আর c এর সাইন উল্টায়।", "সবকিছুকে ভাগ করে ad − bc দিয়ে: det।"];

export function LetterRecipe() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const at = k >= 1 ? AT_SWAPPED : AT_PLAIN;
  const L = ["a", "b", "c", "d"];
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <div className="flex items-center justify-center gap-2 py-2 font-mono text-lg font-bold text-[#0f1b2d] dark:text-[#e2e8f0]">
        {k >= 3 && (
          <span className={`flex flex-col items-center text-sm ${POP}`}>
            <span>1</span>
            <span className="border-t-2 border-current px-1">ad − bc</span>
          </span>
        )}
        <span className="inline-flex items-stretch">
          <R_Bracket side="l" />
          <span className="relative" style={{ width: 80, height: 64 }}>
            {L.map((l, i) => (
              <span key={l} className={`absolute top-0 left-0 grid place-items-center transition-transform duration-700 ease-in-out motion-reduce:transition-none ${i === 0 || i === 3 ? "text-[#b45309] dark:text-[#fbbf24]" : "text-[#7c3aed] dark:text-[#c4b5fd]"}`} style={{ width: 40, height: 32, transform: `translate(${at[i][1] * 40}px, ${at[i][0] * 32}px)` }}>
                <span key={k >= 2 && (i === 1 || i === 2) ? "m" : "p"} className={k >= 2 && (i === 1 || i === 2) ? POP : ""}>
                  {k >= 2 && (i === 1 || i === 2) ? `−${l}` : l}
                </span>
              </span>
            ))}
          </span>
          <R_Bracket side="r" />
        </span>
      </div>
    </Scene>
  );
}

// 3½b · For the side quest: bigger lenses. 8.6's checkerboard of signs over a
//       3 × 3, each cell a minor with its sign; then the whole board turned
//       sideways (rows become columns): the adjugate.

const X3C_SAY = ["3 × 3 lens এর জন্য 8.6 এর দাবার ঘর: + − +।", "প্রতিটা ঘরে তার minor, চিহ্নসহ। এটাই cofactor.", "পুরাটা কাত করুন: row হয় column। এর নাম adj(A)।", "তারপর det দিয়ে ভাগ। 2 × 2 এর নিয়ম এরই ছোট রূপ।"];

export function AdjSideways() {
  const s = useScene(3, [600, 1800, 2000, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X3C_SAY, k)}>
      <div className="flex items-center justify-center gap-2 py-1 font-mono text-sm font-bold">
        {k >= 3 && <span className={`text-[#0f1b2d] dark:text-[#e2e8f0] ${POP}`}>1/det ×</span>}
        <span className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }, (_, n) => {
            const r = Math.floor(n / 3);
            const c = n % 3;
            const [rr, cc] = k >= 2 ? [c, r] : [r, c];
            const plus = (r + c) % 2 === 0;
            return (
              <span
                key={n}
                className={`grid size-9 place-items-center rounded-sm text-xs transition-transform duration-700 ease-in-out motion-reduce:transition-none ${plus ? "bg-[#fef3c7] text-[#92400e]" : "bg-[#ede9fe] text-[#5b21b6]"}`}
                style={{ transform: `translate(${(cc - c) * 38}px, ${(rr - r) * 38}px)` }}
              >
                {k >= 1 ? `${plus ? "+" : "−"}M${r + 1}${c + 1}` : plus ? "+" : "−"}
              </span>
            );
          })}
        </span>
      </div>
    </Scene>
  );
}

// 4½ · The hand flips back: from the painted left hand (3 ঘর) through a flat
//      moment to the small right hand on the ghost. −3 × (−1/3) = 1.

const X4B_SAY = ["দেয়ালে 3 ঘর, বাম হাত। det −3.", "ফেরার পথে হাত পাতার মতো উল্টায়। মাঝখানে এক মুহূর্ত চ্যাপ্টা।", "শেষে এক ঘর, ডান হাত। (−3) × (−1/3) = 1."];
const X4B_F = patchFrame(-1.4, 1.4, -0.3, 3.3, 30);

export function FlipBack() {
  const s = useScene(2, [600, 2000, 2200]);
  const k = s.k;
  const f = X4B_F;
  const t = [0, 0.5, 1][k];
  const move: Move = (p) => lerp(apply(Z, p), p, t);
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <div className="mx-auto w-[7rem]">
        <PatchWall f={f} label="Z এর হাত ফেরার পথে উল্টে যায়, শেষে ছোট ডান হাত" className="max-w-none">
          <R_Print f={f} shape="hand" move={(p) => p} look="ghost" />
          <R_Print key={k} f={f} shape="hand" move={move} />
        </PatchWall>
      </div>
    </Scene>
  );
}

// 5½ · Where back? (5, 0) and (0, 5) both land on (5, 5). A lens sends one
//      spot to one spot: from (5, 5) its arrow can go to (5, 0) or to (0, 5),
//      not both.

const X5B_SAY = ["(5, 0) আর (0, 5): দুইটা আলাদা জায়গা।", "নাসিবের lens দুইটাকেই পাঠায় (5, 5) এ।", "ফেরার lens (5, 5) কে কোথায় পাঠাবে? (5, 0) এ?", "তাহলে (0, 5) হারালো। একটা জায়গা থেকে এক জায়গাতেই যাওয়া যায়।"];
const X5B_F = makeFrame(-0.6, 5.8, -0.6, 5.8, 22, 6);

export function WhereBack() {
  const s = useScene(3, [600, 1600, 2000, 2400]);
  const k = s.k;
  const f = X5B_F;
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <svg viewBox={`0 0 ${f.W} ${f.H}`} role="img" aria-label="(5, 0) আর (0, 5) দুইটাই (5, 5) এ পড়ে; ফেরার পথ একটাকেই নিতে পারে" className="mx-auto block h-auto w-full max-w-[10rem]">
        <rect x={0} y={0} width={f.W} height={f.H} rx={8} fill={PK.lime} />
        <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(5.8)} ${f.sy(5.8)}`} stroke={PK.lamp} strokeWidth={1.2} strokeDasharray="3 2" />
        {k >= 1 && (
          <g className={FADE}>
            <Arrow f={f} from={[5, 0]} to={[5, 5]} tone="violet" w={2} draw />
            <Arrow f={f} from={[0, 5]} to={[5, 5]} tone="violet" w={2} draw />
          </g>
        )}
        {k >= 2 && (
          <path d={`M${f.sx(5) + 6} ${f.sy(5)}Q${f.sx(6)} ${f.sy(2.5)} ${f.sx(5) + 6} ${f.sy(0) - 4}`} fill="none" stroke={OK} strokeWidth={2} strokeDasharray="4 3" className={FADE} />
        )}
        {[
          [5, 0],
          [0, 5],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={f.sx(x)} cy={f.sy(y)} r={5} fill={k >= 3 && i === 1 ? "#e5e7eb" : "white"} stroke={k >= 3 && i === 1 ? BAD : BLUE} strokeWidth={2} />
            <text x={f.sx(x) + (i === 0 ? -8 : 2)} y={f.sy(y) + (i === 0 ? -8 : 16)} textAnchor={i === 0 ? "end" : "start"} fontSize={9} fontWeight={700} fontFamily={MONO} fill={INK}>
              {`(${x}, ${y})`}
            </text>
          </g>
        ))}
        {k >= 1 && <circle cx={f.sx(5)} cy={f.sy(5)} r={5} fill={PK.lamp} className={POP} />}
        {k >= 3 && (
          <text x={f.sx(0) + 8} y={f.sy(5) - 10} fontSize={16} fontWeight={800} fill={BAD} className={POP}>
            ?
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 6½ · The undo swells as the det shrinks: the lens [[2, 2], [1, 1 + e]] with
//      e = 0.5, 0.25, 0.1, 0.05 (det 1, 0.5, 0.2, 0.1). Its patch thins; the
//      biggest number of its undo goes 2 → 4 → 10 → 20.

const X6B = [0.5, 0.25, 0.1, 0.05];
const X6B_SAY = ["det 1. ফেরা lens এর সবচেয়ে বড় সংখ্যা 2।", "det 0.5. সবচেয়ে বড় সংখ্যা 4।", "det 0.2. সবচেয়ে বড় সংখ্যা 10।", "det 0.1. সবচেয়ে বড় সংখ্যা 20। ছবি যত চ্যাপ্টা, ফেরা তত বড়।"];
const X6B_F = patchFrame(-0.3, 4.3, -0.3, 3.3, 24);

export function SwellingUndo() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const e = X6B[k];
  const L = colsOf([
    [2, 2],
    [1, 1 + e],
  ]);
  const b = big(undoOf(L)!);
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <div className="flex items-center justify-center gap-2">
        <div className="w-[7rem]">
          <PatchWall f={X6B_F} label="lens এর ছবি যত চ্যাপ্টা হয়, ফেরা lens এর সংখ্যা তত বড় হয়" className="max-w-none">
            <path key={k} d={pathD(X6B_F, patchCorners(L))} fill={PK.glow} fillOpacity={0.7} stroke={PK.lamp} strokeWidth={1.2} className={FADE} />
          </PatchWall>
        </div>
        <div className="flex h-[6.5rem] items-end gap-1">
          <span className="w-6 rounded-t-md bg-[#e11d48] transition-[height] duration-700 ease-out motion-reduce:transition-none" style={{ height: `${(b / 20) * 100}%` }} />
          <span className="font-mono text-sm font-bold">{fmt(b, true)}</span>
        </div>
      </div>
    </Scene>
  );
}

// 10½ · For the side quest "কেন singular": random lenses almost never land on
//       det 0; the one that does has a copied column.

const X10_LENSES: [Rows, boolean][] = [
  [[[3, -1], [2, 5]], false],
  [[[0.4, 7], [-2, 1.3]], false],
  [[[6, 2], [-1, 4]], false],
  [[[-5, 3], [2, 2.5]], false],
  [[[1.7, -3], [4, 0.2]], false],
  [[[2, 4], [1, 2]], true],
];
const X10_SAY = ["এলোমেলো চারটা করে সংখ্যা নিয়ে lens বানান।", "det প্রায় কখনো ঠিক 0 হয় না।", "যেটা 0 হলো, তার দ্বিতীয় column প্রথমটার ঠিক দুইগুণ। কারণ ছাড়া হয় নাই।"];

export function RareZero() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const n = k === 0 ? 3 : 6;
  return (
    <Scene scene={s} caption={say(X10_SAY, k)}>
      <div className="grid grid-cols-3 gap-1.5 py-1">
        {X10_LENSES.slice(0, n).map(([r, zero], i) => {
          const d = det(colsOf(r));
          return (
            <span key={i} className={`flex flex-col items-center gap-0.5 rounded-lg border p-1 ${zero && k >= 2 ? "border-danger bg-danger/5" : "border-border"} ${POP}`} style={{ transitionDelay: `${(i % 3) * 150}ms` }}>
              <Mat cells={matOf(colsOf(r), true)} small tint={false} />
              <span className={`font-mono text-xs ${zero ? "font-bold text-danger" : "text-muted"}`}>det {fmt(d, true)}</span>
            </span>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  RecipeBet: { start: {}, picked: { bet: 1 }, sealed: { bet: 2, sealed: true }, sealedBhai: { bet: 3, sealed: true } },
  SomsPattern: { start: {}, out: { out: true }, fact: { out: true, seen: [0, 1], cur: 1 }, facts: { out: true, seen: [0, 1, 2], cur: 2 }, shear: { out: true, seen: [0, 1, 2], cur: 2, shear: 3 } },
  SwapFlipDivide: { start: {}, swapped: { stage: 1 }, flipped: { stage: 2 }, divided: { stage: 3 }, ran: { stage: 3, ran: true } },
  HandBack: { start: {}, guessed: { guess: 1 }, flipped: { guess: 1, stage: 2 }, ran: { guess: 1, stage: 3, ran: true } },
  ZeroRefuses: { start: {}, flipped: { stage: 2 }, stopped: { stage: 3 }, tapped: { stage: 3, spot: 2 } },
  SmallDetBig: { start: {}, one: { done: [true, false] }, two: { tab: 1, done: [true, true] } },
  YourRecipe: {
    start: {},
    sel: { sel: 0 },
    wrong: { cells: [6, 7, 2, 4], div: 10, ran: true },
    noDiv: { cells: [6, -7, -2, 4], div: 1, ran: true },
    right: { cells: [6, -7, -2, 4], div: 10, ran: true },
  },
  TryZero: { start: {}, wrong: { pick: 0, ran: true }, right: { pick: 1, ran: true } },
  BetOpen: { start: {}, nasib: { open: [0], cur: 0 }, karim: { open: [0, 1], cur: 1 }, done: { open: [0, 1, 2, 3], cur: 2 } },
  NoonHand: { rest: { k: 0 }, rina: { k: 2 }, done: {} },
  NoHisab: { nasib: { k: 1 }, karim: { k: 2 }, done: {} },
  SomsKhata: { rest: { k: 0 }, done: {} },
  HandInMachine: { rest: { k: 0 }, poly: { k: 1 }, done: {} },
  PocketLens: { rest: { k: 0 }, done: {} },
  TwoSmallLenses: { rina: { k: 1 }, done: {} },
  ApaPalm: { rest: { k: 0 }, palm: { k: 2 }, done: {} },
  KhataPack: { rest: { k: 0 }, done: {} },
  DoorPiece: { apa: { k: 1 }, done: {} },
  AllDay: { rest: { k: 0 }, two: { k: 1 }, hand: { k: 2 }, done: {} },
  WhyDivide: { g: { k: 1 }, nine: { k: 2 }, done: {} },
  LetterRecipe: { rest: { k: 0 }, swap: { k: 1 }, done: {} },
  AdjSideways: { rest: { k: 0 }, minors: { k: 1 }, done: {} },
  FlipBack: { rest: { k: 0 }, mid: { k: 1 }, done: {} },
  WhereBack: { rest: { k: 0 }, land: { k: 1 }, done: {} },
  SwellingUndo: { rest: { k: 0 }, done: {} },
  RareZero: { rest: { k: 0 }, done: {} },
};
