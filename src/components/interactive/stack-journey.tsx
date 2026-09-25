"use client";

import { useState, type ReactNode } from "react";

import { Bubble, Card as CastCard, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { LensCard, LightBhai, Projector, STAGE_WALL_F, StageWall, apply, byCols, det, partway, pathOf, projectorLens, useLensRun, type Cols, type Move } from "./light-kit";
import { turnCols } from "./road-kit";
import {
  CutPieces,
  FLOWER_OUTLINE,
  LENS_G,
  LENS_L,
  PK,
  PaintFill,
  Patch,
  PatchWall,
  StageBrush,
  StageKouta,
  StageMora,
  TargetCells,
  UnitTile,
  cellPoly,
  mapPts,
  patchCorners,
  patchFrame,
  planPatch,
} from "./patch-kit";

// Screens for "Math for AI 8.5 — lens এর উপর lens, জায়গা গুণ", told as a
// Journey in the author's Bangla-English. The plan is 08_journey_specs.md,
// block 8.5.
//
// ফিরানির আগের দিন। The big piece above the door: the লাইট ভাই throws Rina's
// ফুল stencil (5 ঘর, 5 কৌটা) through Z, then W (7.3's two spares, the G job),
// then L = 2I, "the দুইগুণ lens". মামা goes to the বাজার once, today. Nasib:
// দুইগুণ lens তো, দুইগুণ রং; আগের দুইটার 3; মোট 5।
//
// Nine screens. 1 seals the bet: 5 · 6 · 12 · 36 (StackBet). 2 the মেহেদি
// hand through Z (3 ঘর, a left hand), then W (still 3, a right hand again):
// (−3) × (−1) = 3 (ZThenW). 3 predict, then L one column at a time: 2, then
// 4 (DoubleLens). 4 the তাস slid sideways (shear, 1 ঘর), then a 37° turn
// (1 ঘর) (SlideAndTurn). 5 Nasib slips 8.4's [[1, 1], [1, 1]] into the stack:
// wherever it sits, a line (OneZeroRuinsAll). 6 Your turn (Check Q5): det A =
// 5; 3A, A·A, Aᵀ painted (YourStack). 7 Try it: three lenses, which picture
// (TryStack). 8 the bet opened on the painted ফুল (BetOpen). 9 the end (MDX).
//
// After the screens: the story scenes (StackMorning, ThreeMore, SlantTurn,
// NasibSlips, LadderPaint, DoorDrying, PaikarVan) and the watch-only figures
// (StackStake, FlipFlip, WhyMultiply, SquareCube, TurnFormula, ZeroChain,
// AddPatches, TwoStretches), each numbered after its screen.
//
// The patch, the wall and the কৌটা come from patch-kit.tsx; the machine and
// the লাইট ভাই from light-kit.tsx (both read-only). The মেহেদি hand is 8.3's
// stencil (a right palm, fingers along e₂, thumb out along e₁), redrawn here
// because mehedi-journey.tsx doesn't export it.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const BLUE = "#2563eb";
const OK = "#0d9488";
const BAD = PK.bad;
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

const sg = (v: number) => (v < 0 ? `−${-v}` : `${v}`);
const pathD = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}`).join("") + "Z";
const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const lerpCols = (a: Cols, b: Cols, t: number): Cols => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** one lens that does `first`, then `second` */
const onto = (second: Cols, first: Cols): Cols => [apply(second, first[0]), apply(second, first[1])];

// ---------------------------------------------------------------------------
// The lenses, by columns (light-kit's Cols).

const I2: Cols = [
  [1, 0],
  [0, 1],
];
/** 7.3's yellow spare Z = [[−1, 1], [2, 1]]: det −3 */
const Z: Cols = [
  [-1, 2],
  [1, 1],
];
/** 7.3's violet spare W = [[0, 1], [1, 1]]: det −1 */
const W: Cols = [
  [0, 1],
  [1, 1],
];
/** 8.4's crusher, the one Nasib kept: [[1, 1], [1, 1]], det 0 */
const CRUSH: Cols = [
  [1, 1],
  [1, 1],
];
/** the হেলানো lens [[1, 1], [0, 1]]: a stack of তাস slid sideways */
const SHEAR: Cols = [
  [1, 0],
  [1, 1],
];
const ID_MOVE: Move = (p) => p;

const Z_FILL = "#fde68a"; // 7.3's Z, yellow
const W_FILL = "#ddd6fe"; // 7.3's W, violet
const L_FILL = "#bae6fd"; // the দুইগুণ lens
const C_FILL = "#d6d3d1"; // Nasib's pocket lens, grey

// ---------------------------------------------------------------------------
// The মেহেদি stencil (8.3): one ঘর [0, 1]², আপার ডান হাত inside it.

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

/** The stencil's light carried by `move`: the lit ঘর (a patch once bent) with the hand dark in it. `ghost`: a dashed outline in `tone`. */
function S_Print({ f, move = ID_MOVE, ghost = false, tone = BLUE, soft = false }: { f: Frame; move?: Move; ghost?: boolean; tone?: string; soft?: boolean }) {
  const tile = pathOf(f, move, SQ, true);
  const palm = pathOf(f, move, HAND, true);
  if (ghost)
    return (
      <g className="pointer-events-none" opacity={soft ? 0.5 : 1}>
        <path d={tile} fill="none" stroke={tone} strokeWidth={1.4} strokeDasharray="4 3" />
        <path d={palm} fill={tone} fillOpacity={0.12} stroke={tone} strokeWidth={1.3} strokeDasharray="3 2" strokeLinejoin="round" />
      </g>
    );
  return (
    <g className="pointer-events-none" opacity={soft ? 0.45 : 1}>
      <path d={tile} fill={PK.glow} fillOpacity={0.3} stroke={PK.glow} strokeOpacity={0.5} strokeWidth={4} strokeLinejoin="round" />
      <path d={tile} fill={PK.glow} fillOpacity={0.6} stroke={PK.lamp} strokeWidth={1.2} strokeLinejoin="round" />
      <path d={palm} fill={HENNA} stroke={HENNA_DARK} strokeWidth={0.8} strokeLinejoin="round" />
      <path d={pathOf(f, move, RING, true)} fill="none" stroke={HENNA_LINE} strokeWidth={Math.max(0.6, f.u * 0.02)} />
    </g>
  );
}

/** a small picture of what a lens does to the মেহেদি stencil; `span` fixes the scale so sizes compare */
function S_Icon({ cols, size = 44, span }: { cols: Cols; size?: number; span?: number }) {
  const m = byCols(cols);
  const c = SQ.map(m);
  const xs = c.map((p) => p[0]);
  const ys = c.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const S = span ?? Math.max(x1 - x0, y1 - y0, 1);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const f = makeFrame(cx - S / 2, cx + S / 2, cy - S / 2, cy + S / 2, (size - 6) / S, 3);
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect x={0} y={0} width={f.W} height={f.H} rx={4} fill={PK.lime} />
      <S_Print f={f} move={m} />
    </svg>
  );
}

/** "ডান হাত" / "বাম হাত", as a small badge */
function HandBadge({ d }: { d: number }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${d < 0 ? "bg-danger/10 text-danger" : "bg-accent/15 text-accent-text"} ${POP}`}>
      {d < 0 ? "বাম হাত, উল্টা" : "ডান হাত, সোজা"}
    </span>
  );
}

/** a small white chip with words on the wall, at a spot in wall units */
function S_Chip({ f, at, text, tone = INK }: { f: Frame; at: XY; text: string; tone?: string }) {
  const bn = /[ঀ-৿]/.test(text);
  const w = text.length * (bn ? 5.4 : 6) + 10;
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className={`${POP} pointer-events-none`}>
      <rect x={x - w / 2} y={y - 8} width={w} height={14} rx={4} fill="white" fillOpacity={0.92} stroke={tone} strokeWidth={1} />
      <text x={x} y={y + 2.8} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={bn ? undefined : MONO} fill={tone}>
        {text}
      </text>
    </g>
  );
}

/** a round glass chip for the stack row: its letter on its colour; `on` rings it */
function GlassChip({ letter, fill, on = false, small = false }: { letter: ReactNode; fill: string; on?: boolean; small?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border-2 font-mono font-bold text-[#0f1b2d] transition-shadow duration-300 motion-reduce:transition-none ${small ? "size-7 text-xs" : "size-9 text-sm"} ${on ? "border-[#f59e0b] shadow-[0_0_0_4px_rgba(253,224,71,0.6)]" : "border-[#0f1b2d]/60"}`}
      style={{ background: fill }}
    >
      {letter}
    </span>
  );
}

/** a small drawn arrow for rows of lenses (no glyph) */
function RowArrow() {
  return (
    <svg viewBox="0 0 16 10" className="h-2.5 w-4 shrink-0 text-muted" aria-hidden="true">
      <path d="M1 5H13M9 1.5L13 5L9 8.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. One ঘর of light, and the stack: Z → W → L. Four cards.
//     Sealing acts it out: the glasses light one by one, then that many ঘর
//     stand on the wall next to the one ঘর, with a "?".

const X1_CARDS = [
  { who: "নাসিব", n: 5, line: "3 আর 2, যোগ" },
  { who: "সোম", n: 6, line: "3 আর 2, গুণ" },
  { who: "সামিন", n: 12, line: "Z, W মিলে G; তারপর L" },
  { who: "করিম", n: 36, line: "Z এ 3, G তে 3, L এ 2 × 2" },
];
const X1F = patchFrame(-0.4, 7.4, -0.4, 6.4, 24); // 203 × 179
const X1_GLASS = [
  { l: "Z", fill: Z_FILL },
  { l: "W", fill: W_FILL },
  { l: "L", fill: L_FILL },
];

export function StackBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(450);
  const k = !sealed ? 0 : act.running ? act.k : 5;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(5, () => pass("বাজি সিল হলো। আগে প্রথম দুইটা lens।"));
  };
  const n = bet === null ? 0 : X1_CARDS[bet].n;
  return (
    <>
      <div className="mb-1.5 flex items-center justify-center gap-1.5 text-sm">
        <span className="text-muted">এক ঘর</span>
        {X1_GLASS.map((g, i) => (
          <span key={g.l} className="flex items-center gap-1.5">
            <RowArrow />
            <GlassChip letter={g.l} fill={g.fill} on={k === i + 1} small />
          </span>
        ))}
        <RowArrow />
        <span className="font-mono font-bold text-cat-blue">?</span>
      </div>
      <PatchWall f={X1F} label="দেয়ালে stencil এর এক ঘর আলো; Z, W, L পার হয়ে কত ঘর হবে; বাজির ঘর গুলো পাশে, প্রশ্নবোধক" className="max-w-[14rem]">
        <UnitTile f={X1F} />
        {k >= 4 &&
          Array.from({ length: n }, (_, i) => (
            <rect
              key={i}
              x={X1F.sx(1.3 + (i % 6))}
              y={X1F.sy(Math.floor(i / 6) + 1)}
              width={X1F.u - 2}
              height={X1F.u - 2}
              rx={2}
              fill={PK.glow}
              fillOpacity={0.55}
              stroke={PK.lamp}
              strokeWidth={1}
              className={POP}
              style={{ transitionDelay: `${i * 25}ms` }}
            />
          ))}
        {k >= 5 && (
          <text x={X1F.sx(0.5)} y={X1F.sy(3)} textAnchor="middle" fontSize={26} fontWeight={800} fill={BLUE} className={POP}>
            ?
          </text>
        )}
      </PatchWall>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex flex-col text-sm leading-tight">
              <span>
                <span className="font-mono font-bold">{c.n}</span> গুণ · {c.who}
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
      <Task done={k >= 5}>দরজার উপরের ছবিতে stencil এর কতগুণ রং লাগবে? একটা বেছে নিয়ে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Z, then W. The মেহেদি stencil (a flip shows on a hand, not on a ফুল).
//     Run Z: the ঘর becomes Z's patch, 3 ঘর, the hand now a left hand. Run W
//     on that picture: it lands on G's patch, still 3 ঘর, a right hand again.
//     The rows fill as the runs land: Z −3, W −1 (its own ঘর stays one ঘর,
//     turned over), both: 3.

const X2F = patchFrame(-1.5, 3.5, -0.5, 3.5, 36); // 196 × 160
const X2_ZM = byCols(Z);

export function ZThenW() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const run = useLensRun(1300, 26);
  const go = () => {
    if (run.running || stage >= 2) return;
    const ns = stage + 1;
    run.run(() => {
      setStage(ns);
      if (ns === 2) pass("গুণ হয়: (−3) × (−1) = 3।");
    });
  };
  const t = run.t;
  let move: Move = ID_MOVE;
  if (stage === 0 && run.running) move = partway(X2_ZM, t);
  else if (stage === 1) move = run.running ? (p) => lerp(X2_ZM(p), apply(W, X2_ZM(p)), t) : X2_ZM;
  else if (stage >= 2) move = byCols(LENS_G);
  const landed = !run.running;
  const rows = [
    { key: "Z", fill: Z_FILL, cols: Z, show: stage >= 1, d: -3, text: "3 ঘর" },
    { key: "W", fill: W_FILL, cols: W, show: stage >= 2, d: -1, text: "1 ঘর" },
  ];
  return (
    <>
      <div className="flex items-center justify-center gap-2.5">
        <PatchWall f={X2F} label="মেহেদি হাতের stencil এর আলো; Z দিয়ে গেলে 3 ঘর, বাম হাত; তারপর W দিয়ে গেলে এখনো 3 ঘর, আবার ডান হাত, G এর ছোপ" className="max-w-[12rem]">
          {stage >= 1 && <S_Print f={X2F} ghost soft tone={PK.chalk} />}
          {stage >= 2 && landed && <path d={pathD(X2F, patchCorners(LENS_G))} fill="none" stroke={OK} strokeWidth={1.8} strokeDasharray="5 3" className={POP} />}
          <S_Print f={X2F} move={move} />
          {stage === 1 && landed && <S_Chip f={X2F} at={[-0.4, 3.1]} text="3 ঘর, বাম হাত" tone={BAD} />}
          {stage >= 2 && landed && <S_Chip f={X2F} at={[1.2, 3.25]} text="এখনো 3 ঘর, ডান হাত: G" tone={OK} />}
        </PatchWall>
        <div className="flex w-[7.5rem] flex-col gap-1.5 text-sm">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-1.5">
              <GlassChip letter={r.key} fill={r.fill} small />
              {r.show && landed ? (
                <span className={`flex flex-col leading-tight ${FADE}`}>
                  <span>
                    det <span className="font-mono font-bold">{sg(r.d)}</span>
                  </span>
                  <span className="text-xs text-muted">{r.key === "W" ? "নিজে: এক ঘর, উল্টা" : "3 ঘর, উল্টা"}</span>
                </span>
              ) : (
                <span className="font-mono text-muted">?</span>
              )}
            </div>
          ))}
          {stage >= 2 && landed && (
            <div className={`rounded-lg bg-accent/10 px-1.5 py-1 text-center ${POP}`}>
              <div className="font-mono text-xs font-bold whitespace-nowrap">(−3) × (−1)</div>
              <div className="font-mono text-sm font-bold">= 3</div>
              <div className="text-xs text-muted">দুইটা মিলে</div>
            </div>
          )}
        </div>
      </div>
      {stage < 2 && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={stage === 0 ? primaryBtn : quietBtn} disabled={run.running} onClick={go}>
            {stage === 0 ? "Z দিয়ে চালান" : "এবার W দিয়ে চালান"}
          </button>
        </div>
      )}
      <Task done={stage >= 2 && landed}>আগে Z দিয়ে চালান, তারপর W দিয়ে। প্রতিবার দেখুন: কত ঘর, কোন হাত।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict, then L one column at a time. Guess: 2 · 4 · 8. Then "ডানে
//     দ্বিগুণ" stretches the ঘর by column 1, "উপরে দ্বিগুণ" by column 2;
//     the whole ঘর inside number themselves as each stretch lands.

const X3_OPTS = ["2 গুণ। নামই তো দুইগুণ lens।", "4 গুণ।", "8 গুণ।"];
const X3_RIGHT = 1;
const X3F = patchFrame(-0.5, 2.5, -0.5, 2.5, 46); // 154 × 154

export function DoubleLens() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [dbl, setDbl] = useSeed<boolean[]>("dbl", [false, false]);
  const glide = usePlay(800);
  const [a, d] = useTween([dbl[0] ? 2 : 1, dbl[1] ? 2 : 1], 750);
  const stretch = (i: number) => {
    if (guess === null || glide.running || dbl[i]) return;
    const nd = dbl.map((v, j) => v || j === i);
    setDbl(nd);
    glide.play(1, () => {
      if (nd.every(Boolean)) pass("দুই দিকে দুইগুণ: চারগুণ।");
    });
  };
  const real: Cols = [
    [dbl[0] ? 2 : 1, 0],
    [0, dbl[1] ? 2 : 1],
  ];
  const plan = planPatch(real);
  const count = real[0][0] * real[1][1];
  const settled = !glide.running;
  const over = dbl.every(Boolean) && settled;
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <PatchWall f={X3F} label="এক ঘর আলো; L এর প্রথম column ঘরকে ডানে দ্বিগুণ করে, দ্বিতীয়টা উপরে; প্রতিবার ভেতরের পুরা ঘর গুলো গোনা হয়" className="max-w-[10rem]">
          <Patch
            f={X3F}
            cols={[
              [a, 0],
              [0, d],
            ]}
          />
          <UnitTile f={X3F} faint />
          {settled && count > 1 && <TargetCells key={count} f={X3F} plan={plan} slid={plan.pieces.map(() => true)} />}
        </PatchWall>
        <div className="flex w-[7rem] flex-col items-center gap-1.5 text-center text-sm">
          <LensCard cols={real} />
          <div>
            এক ঘর → <span key={settled ? count : "run"} className={`font-mono text-lg font-bold ${POP}`}>{settled ? count : "…"}</span> ঘর
          </div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {["ডানে দ্বিগুণ", "উপরে দ্বিগুণ"].map((l, i) => (
          <button key={l} type="button" className={quietBtn + " justify-center px-2 text-sm"} disabled={guess === null || glide.running || dbl[i]} onClick={() => stretch(i)}>
            {l}
          </button>
        ))}
      </div>
      <div className="mt-2 grid gap-1.5">
        {X3_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, X3_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="text-sm leading-tight">{o}</span>
          </Choice>
        ))}
      </div>
      {over && guess === 0 && <Nope>একদিকে দ্বিগুণে 2 হলো। অন্য দিকেও দ্বিগুণ: 2 এর দ্বিগুণ, 4।</Nope>}
      {over && guess === 2 && <Nope>8 হতো তিন দিকে দ্বিগুণ করলে। দেয়ালের দিক মাত্র দুইটা: ডানে আর উপরে।</Nope>}
      <Task done={over}>আগে guess দিন। তারপর ঘরটা একবার ডানে, একবার উপরে দ্বিগুণ করুন। কয় ঘর হলো?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Slide and turn. The ঘর as a stack of five তাস; "ঠেলুন" slides each
//     card sideways by its height (the shear). Cut and slide: 1 ঘর. Then the
//     ঘর turns 37° about the pin: the same ঘর, turned.

const X4F = patchFrame(-1, 2.5, -0.5, 1.9, 46); // 177 × 126
const X4_PLAN = planPatch(SHEAR);
const X4_NONE = X4_PLAN.pieces.map(() => false);
const X4_ALL = X4_PLAN.pieces.map(() => true);
const X4_CARD = ["#fef9c3", "#fde68a"];

export function SlideAndTurn() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const run = useLensRun(1200, 24);
  const go = () => {
    if (run.running || stage >= 3) return;
    const ns = stage + 1;
    run.run(() => {
      setStage(ns);
      if (ns === 3) pass("হেলালে বা ঘুরালে জায়গা একই।");
    });
  };
  const t = run.running ? run.t : 1;
  const sh = stage === 0 ? (run.running ? t : 0) : 1;
  const cards = stage <= 1 && !(stage === 1 && run.running);
  const cutting = (stage === 1 && run.running) || stage === 2 || (stage === 2 && run.running);
  const turning = stage >= 3 || (stage === 2 && run.running);
  const ang = stage >= 3 ? 37 : stage === 2 && run.running ? 37 * t : 0;
  const landed = !run.running;
  return (
    <>
      <div className="flex items-center justify-center gap-2.5">
        <PatchWall f={X4F} label="এক ঘর, পাঁচটা তাসের মতো; তাস ঠেললে ঘর হেলে যায়; কেটে সরালে আবার এক ঘর; তারপর ঘর 37 ডিগ্রি ঘোরে, একই ঘর" className="max-w-[12rem]">
          {cards &&
            [0, 1, 2, 3, 4].map((i) => {
              const m = partway(byCols(SHEAR), sh);
              const pts: XY[] = [
                [0, i / 5],
                [1, i / 5],
                [1, (i + 1) / 5],
                [0, (i + 1) / 5],
              ];
              return <path key={i} d={pathOf(X4F, m, pts, true)} fill={X4_CARD[i % 2]} stroke="#b45309" strokeWidth={1} strokeLinejoin="round" />;
            })}
          {cutting && !turning && (
            <>
              <CutPieces f={X4F} plan={X4_PLAN} cut slid={stage === 2 || run.t > 0.25 ? X4_ALL : X4_NONE} />
              {stage === 2 && landed && <TargetCells f={X4F} plan={X4_PLAN} slid={X4_ALL} />}
            </>
          )}
          {turning && (
            <>
              <path d={pathD(X4F, SQ)} fill="none" stroke={PK.chalk} strokeWidth={1.2} strokeDasharray="4 3" />
              <Patch f={X4F} cols={turnCols(ang)} />
              {stage >= 3 && landed && <S_Chip f={X4F} at={[1.6, 1.6]} text="একই ঘর, ঘোরানো" tone={OK} />}
            </>
          )}
        </PatchWall>
        <div className="flex w-[6.5rem] flex-col gap-2 text-sm">
          <div className="flex flex-col items-center gap-0.5 text-center">
            <LensCard cols={SHEAR} small />
            <span className="text-xs text-muted">হেলানো</span>
            <span className="font-mono font-bold">{stage >= 2 ? "1 ঘর" : "?"}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="rounded border border-border px-1.5 font-mono text-xs font-bold">37°</span>
            <span className="text-xs text-muted">ঘোরানো</span>
            <span className="font-mono font-bold">{stage >= 3 && landed ? "1 ঘর" : "?"}</span>
          </div>
        </div>
      </div>
      {stage < 3 && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={stage === 0 ? primaryBtn : quietBtn} disabled={run.running} onClick={go}>
            {stage === 0 ? "তাস পাশে ঠেলুন" : stage === 1 ? "কেটে সরিয়ে গুনুন" : "ঘরটা 37° ঘোরান"}
          </button>
        </div>
      )}
      <Task done={stage >= 3 && landed}>তাসের বান্ডিল পাশে ঠেলুন, তারপর কেটে গুনুন। শেষে ঘরটা ঘুরিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · One zero ruins all. The stack Z → W → L, and Nasib's pocket lens
//     [[1, 1], [1, 1]] slipped in: before Z, after W, or last. "চালান" runs
//     the ঘর through all four, lens by lens; the running product of the dets
//     builds under the chips. Wherever it sits, the patch ends a line.

const X5F = patchFrame(-3, 7, -1, 7, 20); // 216 × 176
const X5_POS = ["Z এর আগে", "W এর পরে", "সবার শেষে"];
const X5_AT = [0, 2, 3];
type X5Lens = { key: string; cols: Cols; fill: string };
const X5_BASE: X5Lens[] = [
  { key: "Z", cols: Z, fill: Z_FILL },
  { key: "W", cols: W, fill: W_FILL },
  { key: "L", cols: LENS_L, fill: L_FILL },
];
const X5_C: X5Lens = { key: "N", cols: CRUSH, fill: C_FILL };
const X5_FR = 12;
const x5Chain = (pos: number) => {
  const c = [...X5_BASE];
  c.splice(X5_AT[pos], 0, X5_C);
  return c;
};
const x5Pre = (chain: X5Lens[]) => {
  const pre: Cols[] = [I2];
  chain.forEach((l, i) => pre.push(onto(l.cols, pre[i])));
  return pre;
};

export function OneZeroRuinsAll() {
  const pass = useGate();
  const [pos, setPos] = useSeed<number | null>("pos", null);
  const [tried, setTried] = useSeed<boolean[]>("tried", [false, false, false]);
  const run = usePlay(40);
  const go = (p: number) => {
    if (run.running) return;
    setPos(p);
    run.play(4 * X5_FR, () => {
      const nt = tried.map((v, j) => v || j === p);
      setTried(nt);
      if (nt.every(Boolean)) pass("মাঝে একটা শূন্য, পুরা stack শূন্য।");
    });
  };
  const chain = pos === null ? [...X5_BASE] : x5Chain(pos);
  const pre = x5Pre(chain);
  const kk = pos === null ? 0 : run.running ? run.k : tried[pos] ? 4 * X5_FR : 0;
  const i = Math.min(3, Math.floor(kk / X5_FR));
  const t = kk >= 4 * X5_FR ? 1 : (kk % X5_FR) / X5_FR;
  const cols = kk >= 4 * X5_FR ? pre[4] : lerpCols(pre[i], pre[i + 1], t);
  const passed = kk >= 4 * X5_FR ? 4 : i; // lenses fully through
  const dets = chain.slice(0, passed).map((l) => det(l.cols));
  const prod = dets.reduce((x, y) => x * y, 1);
  const parts = dets.map(sg);
  const flat = pos !== null && passed > X5_AT[pos];
  return (
    <>
      <div className="mb-1.5 flex items-center justify-center gap-1">
        {chain.map((l, j) => (
          <span key={`${l.key}${j}`} className="flex items-center gap-1">
            {j > 0 && <RowArrow />}
            <span className="flex flex-col items-center">
              <GlassChip letter={l.key === "N" ? <span className="text-[0.55rem] leading-none">1 1</span> : l.key} fill={l.fill} on={pos !== null && run.running && j === i} small />
              <span className={`font-mono text-[0.65rem] ${j < passed ? "text-foreground" : "text-transparent"}`}>{sg(det(l.cols))}</span>
            </span>
          </span>
        ))}
      </div>
      {pos === null && (
        <div className="mb-1 flex items-center justify-center gap-1.5 text-sm text-muted">
          নাসিবের lens <LensCard cols={CRUSH} small /> কোথায় বসবে?
        </div>
      )}
      <PatchWall f={X5F} label="এক ঘর আলো stack এর lens গুলো দিয়ে একটার পর একটা যায়; নাসিবের lens এ এসে ছবি একটা দাগ হয়ে যায়, পরে আর চওড়া হয় না" className="max-w-[13rem]">
        <UnitTile f={X5F} faint />
        {pos !== null && <Patch f={X5F} cols={cols} />}
        {flat && <S_Chip f={X5F} at={[-0.6, 6.2]} text="দাগ: জায়গা 0" tone={BAD} />}
      </PatchWall>
      <div className="mt-1 min-h-6 text-center font-mono text-sm">
        {pos !== null && passed > 0 && (
          <span className={prod === 0 ? "text-danger" : ""}>
            {parts.map((p) => (p.startsWith("−") ? `(${p})` : p)).join(" × ")} = <span className="font-bold">{sg(prod)}</span>
          </span>
        )}
      </div>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {X5_POS.map((l, j) => (
          <button key={l} type="button" disabled={run.running} onClick={() => go(j)} className={`${quietBtn} h-auto justify-center px-1.5 py-1.5 text-xs leading-tight ${tried[j] ? "border-danger text-danger" : ""}`}>
            {l}
          </button>
        ))}
      </div>
      <Task done={tried.every(Boolean) && !run.running}>নাসিবের lens টা তিনটা জায়গাতেই বসিয়ে চালান। কোথাও কি ছবি বাঁচে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn (Check Q5). A = [[1, 2], [−2, 1]]: det 5, its patch a tilted
//     square. Three pictures: 3A, A·A, Aᵀ. For each the reader sets how many
//     ঘর one ঘর becomes and paints; paint rises to n / true of the patch:
//     short leaves the top bare, over spills.

const X6_A: Cols = [
  [1, -2],
  [2, 1],
];
type X6Pic = { key: string; name: ReactNode; cols: Cols; f: Frame; nope: string };
const X6_PICS: X6Pic[] = [
  {
    key: "3A",
    name: "3A",
    cols: [
      [3, -6],
      [6, 3],
    ],
    f: patchFrame(-0.6, 9.6, -6.6, 3.6, 17),
    nope: "3A মানে দুই দিকেই 3 গুণ। A এর ছোপ 3 × 3 টা বসে।",
  },
  {
    key: "AA",
    name: "A·A",
    cols: onto(X6_A, X6_A),
    f: patchFrame(-3.6, 4.6, -7.6, 1.6, 19),
    nope: "প্রথম A তে এক ঘর 5 ঘর। পরের A সেই 5 ঘরের প্রতিটাকে আবার 5 গুণ করে।",
  },
  {
    key: "AT",
    name: "Aᵀ",
    cols: [
      [1, 2],
      [-2, 1],
    ],
    f: patchFrame(-2.6, 3.6, -2.6, 3.6, 29),
    nope: "Aᵀ এর ছোপ দেখুন: A এর ছোপের মতোই একটা হেলানো চারকোনা, একই মাপের।",
  },
];

function X6_Count({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  const b = "grid h-8 min-w-8 cursor-pointer place-items-center rounded-full px-1.5 font-mono text-sm font-bold text-muted transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-default disabled:opacity-30 motion-reduce:transition-none";
  const set = (v: number) => onChange(Math.max(1, Math.min(99, v)));
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface p-0.5">
      <button type="button" aria-label="পাঁচ কম" className={b} disabled={disabled || value <= 1} onClick={() => set(value - 5)}>
        −5
      </button>
      <button type="button" aria-label="এক কম" className={b} disabled={disabled || value <= 1} onClick={() => set(value - 1)}>
        −1
      </button>
      <span className="w-9 text-center font-mono text-lg font-semibold tabular-nums">{value}</span>
      <button type="button" aria-label="এক বেশি" className={b} disabled={disabled || value >= 99} onClick={() => set(value + 1)}>
        +1
      </button>
      <button type="button" aria-label="পাঁচ বেশি" className={b} disabled={disabled || value >= 99} onClick={() => set(value + 5)}>
        +5
      </button>
    </span>
  );
}

export function YourStack() {
  const pass = useGate();
  const [tab, setTab] = useSeed("tab", 0);
  const [vals, setVals] = useSeed<number[]>("vals", [5, 5, 5]);
  const [painted, setPainted] = useSeed<boolean[]>("painted", [false, false, false]);
  const [ok, setOk] = useSeed<boolean[]>("ok", [false, false, false]);
  const [miss, setMiss] = useState(0);
  const pour = usePlay(1100);
  const pic = X6_PICS[tab];
  const truth = Math.abs(det(pic.cols));
  const n = vals[tab];
  const paint = () => {
    if (pour.running || ok[tab]) return;
    const i = tab;
    setPainted(painted.map((v, j) => v || j === i));
    pour.play(1, () => {
      if (vals[i] === Math.abs(det(X6_PICS[i].cols))) {
        const no = ok.map((v, j) => v || j === i);
        setOk(no);
        if (no.every(Boolean)) pass("5 এর 3A তে 45, A·A তে 25, Aᵀ তে 5।");
      } else setMiss((m) => m + 1);
    });
  };
  const setN = (v: number) => {
    setVals(vals.map((x, j) => (j === tab ? v : x)));
    setPainted(painted.map((x, j) => (j === tab ? false : x)));
  };
  const shown = painted[tab];
  const landed = shown && !pour.running;
  const poly = patchCorners(pic.cols);
  const f = pic.f;
  return (
    <>
      <div className="mb-1.5 flex justify-center gap-1.5">
        {X6_PICS.map((p, j) => (
          <button key={p.key} type="button" disabled={pour.running} onClick={() => setTab(j)} className={`cursor-pointer rounded-full border-2 px-3 py-1 font-mono text-sm font-semibold transition-colors motion-reduce:transition-none ${tab === j ? "border-cat-blue bg-cat-blue text-white" : ok[j] ? "border-accent text-accent-text" : "border-border hover:border-cat-blue/60"}`}>
            <span className="inline-flex items-center gap-1">
              {p.name}
              {ok[j] && (
                <svg viewBox="0 0 12 12" className="size-3" aria-label="ঠিক">
                  <path d="M2 6.5L5 9.5L10 2.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2">
        <PatchWall key={pic.key} f={f} label={`দেয়ালে ${pic.key} এর ছোপের দাগ, পাশে A এর ছোপ; যত কৌটা দেবেন, ততটা রং হবে`} className="max-w-[11.5rem]">
          <path d={pathD(f, patchCorners(X6_A))} fill={PK.glow} fillOpacity={0.35} stroke={PK.lamp} strokeWidth={1} strokeDasharray="3 2" />
          <path d={pathD(f, poly)} fill="none" stroke={PK.paintDark} strokeWidth={1.3} strokeDasharray="4 3" />
          <PaintFill f={f} poly={poly} frac={shown ? Math.min(1, n / truth) : 0} spill={landed && n > truth} />
          {landed && n < truth && <path d={pathD(f, poly)} fill="none" stroke={BAD} strokeWidth={1.8} strokeDasharray="4 3" className={POP} />}
          {landed && ok[tab] && tab === 0 && (
            <path
              d={[1, 2].map((s) => pathOf(f, ID_MOVE, [[s, -2 * s], [s + 6, -2 * s + 3]]) + pathOf(f, ID_MOVE, [[2 * s, s], [2 * s + 3, s - 6]])).join("")}
              stroke={INK}
              strokeWidth={1}
              strokeOpacity={0.6}
              fill="none"
              className={POP}
            />
          )}
        </PatchWall>
        <div className="flex w-[6.5rem] flex-col items-center gap-1 text-center text-sm">
          <div className="text-xs text-muted">A: এক ঘর → 5 ঘর</div>
          <LensCard cols={X6_A} small name={<span className="font-mono text-xs">A</span>} />
          <div className="mt-1 font-mono font-bold">{pic.name}</div>
          <LensCard cols={pic.cols} small />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm">এক ঘর →</span>
        <X6_Count value={n} onChange={setN} disabled={pour.running || ok[tab]} />
        <span className="text-sm">ঘর</span>
        <button type="button" className={primaryBtn} disabled={pour.running || ok[tab]} onClick={paint}>
          রং করুন
        </button>
      </div>
      {landed && !ok[tab] && n < truth && <Nope key={miss}>রং ফুরিয়ে গেলো, ছোপের উপরটা খালি। {pic.nope}</Nope>}
      {landed && !ok[tab] && n > truth && <Nope key={miss}>ছোপ ভরে রং গড়িয়ে পড়লো। {pic.nope}</Nope>}
      <Task done={ok.every(Boolean)}>det(A) = 5. তিনটা ছবির প্রতিটায় এক ঘর কত ঘর হয়, বসিয়ে রং করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it. Three lenses in a row, each with its small picture: the
//     হেলানো, the আয়না, উপরে 3 গুণ টানা [[1, 0], [0, 3]]। Which picture do they
//     throw? 3 ঘর right hand (the flip forgotten) · 3 ঘর left hand · 5 ঘর
//     (1 + 1 + 3 added). A pick runs the stack on the wall, then lays the
//     pick over the result.

const X7_E: Cols = [
  [1, 0],
  [0, 3],
];
const X7_M: Cols = [
  [-1, 0],
  [0, 1],
];
const X7_STACK = [
  { cols: SHEAR, name: "হেলানো" },
  { cols: X7_M, name: "আয়না" },
  { cols: X7_E, name: "উপরে 3 গুণ" },
];
const X7_PRE: Cols[] = [I2];
X7_STACK.forEach((l, i) => X7_PRE.push(onto(l.cols, X7_PRE[i])));
const X7_OPTS: Cols[] = [
  [
    [1, 0],
    [1, 3],
  ],
  X7_PRE[3],
  [
    [-1, 0],
    [-1, 5],
  ],
];
const X7_RIGHT = 1;
const X7_NOPE = [
  "বুড়ো আঙুল দেখুন। আয়না একবার উল্টিয়েছে, পরে কেউ আর ফেরায় নাই। হাত বাম।",
  "",
  "5 এলো 1 + 1 + 3 যোগ করে। Lens পরপর চালালে গুণ: 1 × 1 × 3 = 3।",
];
const X7F = patchFrame(-2.6, 2.6, -0.4, 5.4, 24); // 141 × 155
const X7_FR = 10;

export function TryStack() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = usePlay(50);
  const choose = (i: number) => {
    if (run.running || (ran && pick === X7_RIGHT)) return;
    setPick(i);
    setRan(false);
    run.play(3 * X7_FR, () => {
      setRan(true);
      if (i === X7_RIGHT) pass("3 ঘর, উল্টানো: 1 × (−1) × 3 = −3।");
      else setMiss((m) => m + 1);
    });
  };
  const kk = run.running ? run.k : ran ? 3 * X7_FR : 0;
  const i = Math.min(2, Math.floor(kk / X7_FR));
  const t = kk >= 3 * X7_FR ? 1 : (kk % X7_FR) / X7_FR;
  const cols = kk >= 3 * X7_FR ? X7_PRE[3] : lerpCols(X7_PRE[i], X7_PRE[i + 1], t);
  const over = ran && !run.running;
  return (
    <>
      <div className="flex items-center justify-center gap-1">
        {X7_STACK.map((l, j) => (
          <span key={l.name} className="flex items-center gap-1">
            {j > 0 && <RowArrow />}
            <span className={`flex flex-col items-center gap-0.5 rounded-lg p-0.5 ${run.running && j === i ? "bg-[#fde047]/40" : ""}`}>
              <S_Icon cols={l.cols} size={40} span={3.4} />
              <span className="text-[0.65rem] leading-none text-muted">{l.name}</span>
            </span>
          </span>
        ))}
      </div>
      <PatchWall f={X7F} label="মেহেদি হাতের stencil তিনটা lens দিয়ে একটার পর একটা যায়; বেছে নেওয়া ছবিটা উপরে বসে মিলে কি না দেখায়" className="mt-1.5 max-w-[11rem]">
        {pick !== null ? <S_Print f={X7F} move={byCols(cols)} /> : <S_Print f={X7F} />}
        {over && pick !== null && <S_Print f={X7F} move={byCols(X7_OPTS[pick])} ghost tone={pick === X7_RIGHT ? OK : BLUE} />}
      </PatchWall>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X7_OPTS.map((c, j) => (
          <Choice key={j} n={j} look={pick === j && over ? (j === X7_RIGHT ? "right" : "wrong") : pick === j ? "picked" : "idle"} disabled={run.running || (over && pick === X7_RIGHT)} onClick={() => choose(j)}>
            <S_Icon cols={c} size={54} span={5.2} />
          </Choice>
        ))}
      </div>
      {over && pick !== null && pick !== X7_RIGHT && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={over && pick === X7_RIGHT}>তিনটা lens পরপর চালালে মেহেদি হাত দেয়ালে কেমন হবে? ছবিটা বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The bet opened on the door piece: the ফুল through Z, W, then L (the
//     same as through G, then L). Rina had 5 কৌটা for the stencil. Each card
//     pours 5 × its number: 25 and 30 stop short, 60 fills it, 180 spills.

const X8_LG = onto(LENS_L, LENS_G);
const X8_FLOWER = mapPts(X8_LG, FLOWER_OUTLINE);
const X8F = patchFrame(-4.5, 10.5, -4.5, 10.5, 11); // 181 × 181

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const pour = usePlay(1100);
  const tap = (i: number) => {
    if (pour.running) return;
    const no = open.includes(i) ? open : [...open, i];
    setOpen(no);
    setCur(i);
    pour.play(1, () => {
      if (no.length === X1_CARDS.length) pass("যোগ না, গুণ: 3 × 4 = 12।");
    });
  };
  const c = cur === null ? null : X1_CARDS[cur];
  const kouta = c ? c.n * 5 : 0;
  const landed = c !== null && !pour.running;
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <PatchWall f={X8F} label="দরজার উপরে ফুলের ছবি, Z, W আর L পার হয়ে; বাজির যেই card খুলবেন, তার কৌটা দিয়ে রং হবে" className="max-w-[10rem]" pin={false}>
          <path d={pathD(X8F, X8_FLOWER)} fill="none" stroke={PK.paintDark} strokeWidth={1.2} strokeDasharray="4 3" />
          <PaintFill f={X8F} poly={X8_FLOWER} frac={c ? Math.min(1, kouta / 60) : 0} spill={landed && kouta > 60} />
          {landed && kouta < 60 && <path d={pathD(X8F, X8_FLOWER)} fill="none" stroke={BAD} strokeWidth={1.8} strokeDasharray="4 3" className={POP} />}
        </PatchWall>
        <div className="flex w-[8.5rem] flex-col items-center gap-1 text-center text-sm">
          <div className="flex items-center gap-1">
            <GlassChip letter="Z" fill={Z_FILL} small />
            <GlassChip letter="W" fill={W_FILL} small />
            <GlassChip letter="L" fill={L_FILL} small />
          </div>
          {c && landed ? (
            <div key={cur} className={FADE}>
              <div>
                {c.who}: <span className="font-mono font-bold">{kouta}</span> কৌটা
              </div>
              {kouta < 60 && <div className="text-danger">ফুলের উপরটা খালি</div>}
              {kouta === 60 && <div className="font-semibold text-accent-text">ঠিক ঠিক ভরলো</div>}
              {kouta > 60 && (
                <div className="text-danger">
                  <span className="font-mono">{kouta - 60}</span> কৌটা বাড়তি
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted">stencil এ 5 কৌটা</div>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((b, i) => (
          <Choice key={b.who} n={i} look={open.includes(i) ? (b.n === 12 ? "right" : "wrong") : "idle"} disabled={pour.running} onClick={() => tap(i)}>
            <span className="flex flex-col text-sm leading-tight">
              <span>
                <span className="font-mono font-bold">{b.n}</span> গুণ · {b.who}
              </span>
              <span className="text-xs text-muted">{b.n * 5} কৌটা</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={open.length === X1_CARDS.length && !pour.running}>বাজির চারটা card একটা একটা করে খুলুন। প্রতিটার কৌটা দেয়ালে ঢেলে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage bits for the story scenes.

const SW: [number, number] = [8, 30]; // the stage wall's top-left
const PJ: [number, number] = [214, 150]; // the machine's feet
/** the big ফুল above the door, drawn small on the stage wall (wall units) */
const ST_DOOR_FLOWER: XY[] = mapPts(LENS_G, FLOWER_OUTLINE).map(([x, y]) => [6 + 0.32 * x, 3.25 + 0.3 * y] as XY);
const onStage = (p: XY): [number, number] => [SW[0] + STAGE_WALL_F.sx(p[0]), SW[1] + STAGE_WALL_F.sy(p[1])];

/** the ফুল above the door on the stage wall: paint up to `paint`, or a dashed outline */
function St_DoorFlower({ paint, light = false }: { paint?: number; light?: boolean }) {
  const f = STAGE_WALL_F;
  return (
    <g className="pointer-events-none">
      <path d={pathD(f, ST_DOOR_FLOWER)} fill={light ? PK.glow : paint === undefined ? PK.glow : "none"} fillOpacity={light ? 0.5 : 0.2} stroke={paint === undefined ? PK.lamp : PK.paintDark} strokeWidth={1} strokeDasharray={paint === undefined ? "2.5 1.5" : undefined} />
      {paint !== undefined && paint > 0 && <PaintFill f={f} poly={ST_DOOR_FLOWER} frac={paint} />}
    </g>
  );
}

/** a small round glass with its letter */
function St_Glass({ x, y, letter, fill, r = 5.5 }: { x: number; y: number; letter: string; fill: string; r?: number }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={0.9} />
      <text x={x} y={y + r * 0.45} textAnchor="middle" fontSize={r * 1.25} fontWeight={800} fontFamily={MONO} fill={INK}>
        {letter}
      </text>
    </g>
  );
}

/** the three glasses lined up in front of the machine's lens (Z nearest the bulb) */
function St_Stack({ n = 3, crush = false }: { n?: number; crush?: boolean }) {
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  const g = [
    { l: "Z", fill: Z_FILL },
    { l: "W", fill: W_FILL },
    ...(crush ? [{ l: "N", fill: C_FILL }] : []),
    { l: "L", fill: L_FILL },
  ];
  return (
    <g>
      <path d={`M${lx - 6} ${ly + 7}H${lx - 12 - g.length * 12}`} stroke="#b08d3c" strokeWidth={2} />
      {g.slice(0, n + (crush ? 1 : 0)).map((x, i) => (
        <g key={x.l} className={POP}>
          <St_Glass x={lx - 12 - i * 12} y={ly} letter={x.l === "N" ? "" : x.l} fill={x.fill} r={5} />
        </g>
      ))}
    </g>
  );
}

/** মামার হাতে টাকার নোট */
function St_Notes({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 6} y={y - 4} width={12} height={7} rx={1} fill="#86efac" stroke="#166534" strokeWidth={0.6} transform={`rotate(-12 ${x} ${y})`} />
      <rect x={x - 5} y={y - 3} width={12} height={7} rx={1} fill="#bbf7d0" stroke="#166534" strokeWidth={0.6} transform={`rotate(8 ${x} ${y})`} />
    </g>
  );
}

/** a deck of তাস on a surface at (x, y); `slid` leans it */
function St_Deck({ x, y, slid = 0 }: { x: number; y: number; slid?: number }) {
  return (
    <g className="pointer-events-none">
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={x - 9 + i * slid} y={y - 3 - i * 2.2} width={18} height={2.4} fill={i % 2 ? "#fde68a" : "#fef9c3"} stroke="#b45309" strokeWidth={0.4} />
      ))}
    </g>
  );
}

/** a বাঁশের মই leaning on the wall: foot at (x, y), top at (tx, ty) */
function St_Ladder({ x, y, tx, ty }: { x: number; y: number; tx: number; ty: number }) {
  const rungs = Array.from({ length: 7 }, (_, i) => (i + 1) / 8);
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 6} ${y}L${tx - 5} ${ty}M${x + 6} ${y}L${tx + 5} ${ty}`} stroke="#a16207" strokeWidth={2} strokeLinecap="round" />
      {rungs.map((r) => {
        const cx = x + (tx - x) * r;
        const cy = y + (ty - y) * r;
        const hw = 6 - r;
        return <path key={r} d={`M${cx - hw} ${cy}H${cx + hw}`} stroke="#a16207" strokeWidth={1.3} />;
      })}
    </g>
  );
}

/** the গেট with its cloth; `cloth` hangs আম্মু's red and yellow কাপড় */
function St_Gate({ x, cloth = false }: { x: number; cloth?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={70} width={5} height={80} fill="#57534e" />
      <rect x={x + 34} y={70} width={5} height={80} fill="#57534e" />
      <path d={`M${x - 2} 70H${x + 41}`} stroke="#57534e" strokeWidth={4} />
      {cloth && (
        <g className={POP}>
          <path d={`M${x} 72Q${x + 19} 96 ${x + 39} 72`} fill="none" stroke="#dc2626" strokeWidth={5} />
          <path d={`M${x} 76Q${x + 19} 104 ${x + 39} 76`} fill="none" stroke="#facc15" strokeWidth={3} />
          <path d={`M${x + 2} 72V104M${x + 37} 72V104`} stroke="#dc2626" strokeWidth={3} />
        </g>
      )}
    </g>
  );
}

/** the পাইকার's ভ্যান with the slanted wooden box roped on; wheels on the ground at x */
function St_Van({ x }: { x: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 34} y={124} width={64} height={8} rx={1.5} fill="#1e40af" />
      <circle cx={x - 24} cy={140} r={9} fill="none" stroke="#334155" strokeWidth={2} />
      <circle cx={x + 20} cy={140} r={9} fill="none" stroke="#334155" strokeWidth={2} />
      <path d={`M${x + 30} 128L${x + 42} 112H${x + 48}`} stroke="#334155" strokeWidth={2} fill="none" />
      <path d={`M${x - 26} 124L${x - 18} 98L${x + 12} 98L${x + 4} 124Z`} fill="#a16207" stroke="#713f12" strokeWidth={1} />
      <path d={`M${x - 18} 98L${x - 10} 90L${x + 20} 90L${x + 12} 98M${x + 20} 90L${x + 12} 116L${x + 4} 124`} fill="#ca8a04" stroke="#713f12" strokeWidth={1} />
      <path d={`M${x - 24} 116L${x + 8} 106M${x - 20} 104L${x + 10} 120`} stroke="#e7e5e4" strokeWidth={1} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · ফিরানির আগের দিন। The wall, the door, the empty space above it; the
//      লাইট ভাই lines up Z, W, L in front of the machine; মামা counts his
//      notes; Nasib's claim.

export function StackMorning({}: Story) {
  const s = useScene(4, [600, 1600, 1800, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ফিরানির আগের দিন; দেয়ালে দরজার উপরে খালি জায়গা; লাইট ভাই যন্ত্রের সামনে তিনটা lens বসালেন, Z, W আর L; মামা টাকা গুনছেন; নাসিব বললো দুইগুণ lens তো, দুইগুণ রং, আর আগের দুইটার 3, মোট 5">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_DoorFlower />
        </StageWall>
        <Projector x={PJ[0]} y={PJ[1]} lens="good" />
        {k >= 1 && <St_Stack />}
        <LightBhai x={250} y={150} facing={-1} arm={k === 1 ? "point" : "down"} />
        <Person who="mama" x={294} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 && (
          <g className={POP}>
            <St_Notes x={284} y={112} />
          </g>
        )}
        <Person who="nasib" x={62} y={150} facing={1} arm={k >= 3 ? "point" : "down"} label />
        {k === 3 && <Bubble x={62} y={84} side="mid" lines={["দুইগুণ lens তো,", "দুইগুণ রং।"]} />}
        {k >= 4 && <Bubble x={62} y={84} side="mid" lines={["আগের দুইটার 3।", "মোট 5।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1b · Three more answers: Som (গুণ, 6), Samin (G then L, 12), Karim (36).

const TM_SAY: { who: "som" | "samin" | "karim"; x: number; lines: string[]; side: "left" | "mid" | "right" }[] = [
  { who: "som", x: 70, lines: ["যোগ না, গুণ।", "3 × 2, মানে 6।"], side: "right" },
  { who: "samin", x: 160, lines: ["Z আর W মিলে G।", "তারপর L। 12."], side: "mid" },
  { who: "karim", x: 250, lines: ["Z এ 3, G তে আবার 3,", "L এ 2 আর 2। 36."], side: "left" },
];

export function ThreeMore({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="উঠানে তিনজন; সোম বললো যোগ না, গুণ, 3 গুণ 2, মানে 6; সামিন বললো Z আর W মিলে G, তারপর L, 12; করিম বললো Z এ 3, G তে আবার 3, L এ 2 আর 2, 36">
        {TM_SAY.map((p, i) => (
          <Person key={p.who} who={p.who} x={p.x} y={150} facing={i < 1 ? 1 : -1} label arm={k === i + 1 ? (p.who === "samin" ? "hold" : "point") : "down"} />
        ))}
        {k >= 2 && (
          <rect x={148} y={104} width={6} height={10} rx={1.2} fill="#0f172a" className={POP} />
        )}
        {k >= 1 && <Bubble key={k} x={TM_SAY[k - 1].x} y={84} side={TM_SAY[k - 1].side} lines={TM_SAY[k - 1].lines} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Two more lenses: one slants, one turns. Karim: হেলালে লম্বা, রং বেশি।
//      Som puts a deck of তাস on the মোড়া, not slid yet.

function St_IconGlass({ x, y, kind }: { x: number; y: number; kind: "slant" | "turn" }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={7} fill="#e0f2fe" stroke={INK} strokeWidth={0.9} />
      {kind === "slant" ? (
        <path d={`M${x - 4} ${y + 3}H${x + 1}L${x + 4} ${y - 3}H${x - 1}Z`} fill="none" stroke={INK} strokeWidth={0.9} />
      ) : (
        <path d={`M${x - 3.5} ${y + 1}A3.6 3.6 0 1 1 ${x + 1} ${y + 3.4}M${x + 1} ${y + 3.4}l-0.2 -2.2M${x + 1} ${y + 3.4}l-2 0.6`} fill="none" stroke={INK} strokeWidth={0.9} />
      )}
    </g>
  );
}

export function SlantTurn({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="লাইট ভাইয়ের হাতে আরো দুইটা lens, একটা ছবি হেলায়, একটা ঘোরায়; করিম বললো হেলালে ছবি লম্বা হয়, রং বেশি লাগবে; সোম পকেট থেকে তাসের বান্ডিল বের করে মোড়ার উপর রাখলো">
        <LightBhai x={70} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && (
          <g className={POP}>
            <St_IconGlass x={92} y={104} kind="slant" />
            <St_IconGlass x={108} y={96} kind="turn" />
          </g>
        )}
        <Person who="karim" x={170} y={150} facing={-1} arm={k === 2 ? "point" : "down"} label />
        {k === 2 && <Bubble x={170} y={84} side="mid" lines={["হেলালে লম্বা হয়।", "রং বেশি লাগবে।"]} />}
        <StageMora x={228} y={150} />
        {k >= 3 && (
          <g className={POP}>
            <St_Deck x={228} y={134} />
          </g>
        )}
        <Person who="som" x={272} y={150} facing={-1} arm={k >= 3 ? "point" : "down"} label />
      </Stage>
    </StoryFrame>
  );
}

// 5a · The লাইট ভাই goes for water. Nasib takes a lens out of his pocket:
//      [[1, 1], [1, 1]], the one that was meant for the পুকুর. He slips it
//      into the row. His claim.

export function NasibSlips({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="লাইট ভাই পানি খেতে গেলেন; নাসিব পকেট থেকে একটা lens বের করলো, পাতে লেখা 1 1 1 1, পুকুরে যাওয়ার কথা ছিলো; নাসিব সেটা stack এ গুঁজে দিলো; বললো একটা খারাপ, বাকি তিনটা ভালো, ভালোরাই জিতবে">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_DoorFlower />
        </StageWall>
        <Projector x={PJ[0]} y={PJ[1]} lens="good" />
        <St_Stack crush={k >= 2} />
        <LightBhai x={k >= 1 ? 372 : 262} y={150} facing={1} walking={k === 1} />
        <Person who="nasib" x={k === 2 ? 170 : k >= 3 ? 70 : 110} y={150} facing={1} arm={k === 1 || k === 2 ? "hold" : k >= 3 ? "point" : "down"} walking={k >= 2} label ms={900} />
        {k === 1 && (
          <g className={POP}>
            <St_Glass x={126} y={113} letter="" fill={C_FILL} r={6} />
            <CastCard x={132} y={72} text="[[1,1],[1,1]]" tone="coral" />
          </g>
        )}
        {k >= 3 && <Bubble x={70} y={84} side="mid" lines={["তিনটা ভালো,", "ভালোরাই জিতবে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 8a · Evening. Rina on the মই above the door, Karim holding it, মামা
//      counting the empty কৌটা: sixty.

export function LadderPaint({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const [fx, fy] = onStage([6, 3.6]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যা; রিনা মই বেয়ে দরজার উপরে উঠে বড় ফুলটা রং করলো; করিম নিচে মই ধরে দাঁড়িয়ে; মামা খালি কৌটা গুনছেন, ষাটটা">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_DoorFlower paint={k >= 2 ? 1 : k >= 1 ? 0.5 : undefined} />
        </StageWall>
        <St_Ladder x={fx + 56} y={150} tx={fx + 36} ty={fy + 30} />
        <Person who="rina" x={fx + 40} y={fy + 60} facing={-1} arm={k >= 1 ? "point" : "hold"} />
        <StageBrush x={fx + 30} y={fy + 22} a={-160} wet={k >= 1} />
        <Person who="karim" x={fx + 76} y={150} facing={-1} arm="hold" label />
        {Array.from({ length: 12 }, (_, i) => (
          <StageKouta key={i} x={232 + (i % 6) * 9} y={150 - Math.floor(i / 6) * 11} open={k >= 2 || i < 5} />
        ))}
        <Person who="mama" x={292} y={150} facing={-1} arm={k >= 3 ? "point" : "down"} label />
        {k >= 3 && <Bubble x={292} y={84} side="left" lines={["ষাট কৌটা।", "সব খালি।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Night. The door piece drying; আম্মু hangs the গেটের কাপড় for ফিরানি.

export function DoorDrying({}: Story) {
  const s = useScene(2, [600, 1800, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাত; দরজার উপরে বড় ফুল, রং শুকাচ্ছে; আম্মু গেটে লাল আর হলুদ কাপড় টাঙালেন; কাল ফিরানি">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_DoorFlower paint={1} light={k >= 1} />
        </StageWall>
        <St_Gate x={236} cloth={k >= 2} />
        <Person who="ammu" x={k >= 1 ? 226 : 196} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} />
        <text x={k >= 1 ? 226 : 196} y={161} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#f8fafc" className="transition-[x] duration-1000 motion-reduce:transition-none">
          আম্মু
        </text>
      </Stage>
    </StoryFrame>
  );
}

// 9b · The bridge to 8.6: ফিরানির সকাল; the পাইকার's ভ্যান at the gate, a
//      slanted wooden box roped on it; নানা looks at it.

export function PaikarVan({}: Story) {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ফিরানির দিন সকাল; গেটে পাইকারের ভ্যান থামলো; ভ্যানে দড়ি দিয়ে বাঁধা একটা হেলানো কাঠের বাক্স; নানা তাকিয়ে আছেন">
        <St_Gate x={150} cloth />
        <g style={{ transform: `translateX(${k >= 1 ? 0 : 140}px)` }} className="transition-transform duration-1000 ease-out motion-reduce:transition-none">
          <St_Van x={236} />
          <text x={236} y={164} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
            পাইকারের ভ্যান
          </text>
        </g>
        <Person who="nana" x={96} y={150} facing={1} arm={k >= 2 ? "point" : "down"} label />
        {k >= 2 && (
          <text x={246} y={84} textAnchor="middle" fontSize={20} fontWeight={800} fill={BLUE} className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · The stake: one bazaar, today. One ঘর goes through Z, W, L in turn;
//      how many ঘর above the door? Stopped at "?".

const S1_SAY = [
  "কাল ফিরানি। মামা বাজারে যাবেন আজ, একবারই।",
  "Stencil এর এক ঘর আলো যাবে Z দিয়ে।",
  "তারপর W দিয়ে।",
  "তারপর L দিয়ে।",
  "দরজার উপরে গিয়ে কত ঘর? যত ঘর, তার 5 গুণ কৌটা।",
];
const S1_G = [
  { l: "Z", fill: Z_FILL },
  { l: "W", fill: W_FILL },
  { l: "L", fill: L_FILL },
];

export function StackStake() {
  const s = useScene(4, [600, 1600, 1400, 1400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S1_SAY, k)}>
      <svg viewBox="0 0 280 96" role="img" aria-label="এক ঘর আলো Z, W, L পার হয়ে দরজার উপরের দেয়ালে যায়; কত ঘর, প্রশ্নবোধক" className="mx-auto block h-auto w-full max-w-[17rem]">
        <rect x={6} y={34} width={26} height={26} fill={PK.glow} fillOpacity={0.75} stroke={PK.lamp} strokeWidth={1.2} />
        <text x={19} y={74} textAnchor="middle" fontSize={8} fill={INK}>
          এক ঘর
        </text>
        {S1_G.map((g, i) => {
          const x = 68 + i * 44;
          const lit = k >= i + 1;
          return (
            <g key={g.l}>
              {lit && <path d={`M${x - 36} 47H${x - 7}`} stroke={PK.glow} strokeWidth={8} opacity={0.55} className={FADE} />}
              <circle cx={x} cy={47} r={11} fill={g.fill} stroke={lit ? PK.lamp : INK} strokeWidth={lit ? 2 : 1} />
              <text x={x} y={51} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK}>
                {g.l}
              </text>
            </g>
          );
        })}
        {k >= 4 && <path d="M167 47H206" stroke={PK.glow} strokeWidth={8} opacity={0.55} className={FADE} />}
        <rect x={208} y={8} width={66} height={80} rx={4} fill={PK.lime} stroke={PK.chalk} strokeWidth={0.8} />
        <rect x={228} y={58} width={26} height={30} fill="#78350f" />
        <text x={241} y={20} textAnchor="middle" fontSize={7} fill={INK}>
          দরজার উপরে
        </text>
        {k >= 4 && (
          <text x={241} y={48} textAnchor="middle" fontSize={24} fontWeight={800} fill={BLUE} className={POP}>
            ?
          </text>
        )}
        {k === 0 &&
          [0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${216 + i * 14} 26)`}>
              <StageKouta x={0} y={12} s={1.4} />
            </g>
          ))}
      </svg>
    </Scene>
  );
}

// 2½a · Two flips: the hand turns over like a page (a left hand), then over
//       again (a right hand). Two minus signs, one plus.

const S2_SAY = ["আপার ডান হাত। বুড়ো আঙুল ডানে।", "একবার উল্টালো: বাম হাত। একটা minus.", "আবার উল্টালো: আবার ডান হাত।", "দুইবার উল্টানো মানে সোজা। (−1) × (−1) = +1."];
const S2F = patchFrame(-0.25, 1.25, -0.15, 1.15, 76); // 130 × 115

export function FlipFlip() {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  const [c] = useTween([k === 1 ? -1 : 1], 900);
  const flip: Move = (p) => [0.5 + (p[0] - 0.5) * c, p[1]];
  return (
    <Scene scene={s} caption={say(S2_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <PatchWall f={S2F} label="মেহেদি হাত পাতার মতো উল্টায়, বাম হাত হয়; আবার উল্টায়, ডান হাত হয়" className="max-w-[8rem]" pin={false}>
          <S_Print f={S2F} move={flip} />
        </PatchWall>
        <div className="w-[6.5rem] text-center">
          <HandBadge key={k === 1 ? "l" : `r${k}`} d={k === 1 ? -1 : 1} />
          {k >= 3 && <div className={`mt-1 font-mono text-sm font-bold ${POP}`}>(−1) × (−1) = +1</div>}
        </div>
      </div>
    </Scene>
  );
}

// 2½b · Why multiply: G's patch cut and slid is 3 whole ঘর. Send that
//       picture through G again: each of the 3 ঘর becomes the same patch of
//       3. 3 × 3 = 9.

const S2B_SAY = ["G এর ছোপ কেটে সরালে 3টা পুরা ঘর।", "এবার এই ছবিটা আবার G দিয়ে যাক।", "প্রতিটা ঘর একই রকম ছোপ হলো, প্রতিটা 3 ঘর।", "3 ঘর, প্রতিটা 3 গুণ: 9। আগের গুণ × পরের গুণ।"];
const S2BF = patchFrame(-0.4, 7.4, -0.4, 5.4, 21); // 180 × 138
const S2B_TONE = ["#f59e0b", "#0d9488", "#7c3aed"];

export function WhyMultiply() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 1 : 0], 1100);
  const m = partway(byCols(LENS_G), t);
  return (
    <Scene scene={s} caption={say(S2B_SAY, k)}>
      <PatchWall f={S2BF} label="তিনটা পুরা ঘর G দিয়ে আবার যায়; প্রতিটা ঘর 3 ঘরের একই ছোপ; মোট 9" className="max-w-[12rem]">
        {[0, 1, 2].map((i) => (
          <path key={i} d={pathOf(S2BF, m, cellPoly([i, 0]), true)} fill={S2B_TONE[i]} fillOpacity={0.45} stroke={S2B_TONE[i]} strokeWidth={1.4} strokeLinejoin="round" />
        ))}
        {k >= 1 && k < 2 && <S_Chip f={S2BF} at={[1.5, 2]} text="আবার G" tone={INK} />}
        {k >= 2 &&
          [0, 1, 2].map((i) => {
            const c = apply(LENS_G, [i + 0.5, 0.5]);
            return (
              <text key={i} x={S2BF.sx(c[0])} y={S2BF.sy(c[1]) + 4} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK} className={POP}>
                3
              </text>
            );
          })}
        {k >= 3 && <S_Chip f={S2BF} at={[1.4, 4.6]} text="3 × 3 = 9" tone={PK.paintDark} />}
      </PatchWall>
    </Scene>
  );
}

// 3½ · One way doubled is 2, both ways 4; নানার কাঠা, three ways: 8.

const S3_SAY = ["এক ঘর।", "একদিকে দ্বিগুণ: 2 ঘর।", "অন্য দিকেও দ্বিগুণ: 2 × 2 = 4 ঘর।", "নানার কাঠার মতো বাক্সে দিক তিনটা। তিন দিকে দ্বিগুণ: 2 × 2 × 2 = 8।"];

function S3_Cube({ x, y, z, o, s }: { x: number; y: number; z: number; o: [number, number]; s: number }) {
  const P = (a: number, b: number, c: number) => `${o[0] + (a - b) * s * 0.87},${o[1] + (a + b) * s * 0.5 - c * s}`;
  return (
    <g>
      <polygon points={`${P(x, y, z + 1)} ${P(x + 1, y, z + 1)} ${P(x + 1, y + 1, z + 1)} ${P(x, y + 1, z + 1)}`} fill="#fde68a" stroke="#92400e" strokeWidth={0.8} />
      <polygon points={`${P(x + 1, y, z)} ${P(x + 1, y + 1, z)} ${P(x + 1, y + 1, z + 1)} ${P(x + 1, y, z + 1)}`} fill="#f59e0b" stroke="#92400e" strokeWidth={0.8} />
      <polygon points={`${P(x, y + 1, z)} ${P(x + 1, y + 1, z)} ${P(x + 1, y + 1, z + 1)} ${P(x, y + 1, z + 1)}`} fill="#d97706" stroke="#92400e" strokeWidth={0.8} />
    </g>
  );
}

export function SquareCube() {
  const s = useScene(3, [600, 1400, 1600, 2600]);
  const k = s.k;
  const [w, h] = useTween([k >= 1 ? 2 : 1, k >= 2 ? 2 : 1], 800);
  const u = 26;
  const cubes: [number, number, number][] = [];
  for (let z = 0; z < 2; z += 1) for (let y = 0; y < 2; y += 1) for (let x = 0; x < 2; x += 1) cubes.push([x, y, z]);
  cubes.sort((a, b) => a[2] - b[2] || a[0] + a[1] - (b[0] + b[1]));
  return (
    <Scene scene={s} caption={say(S3_SAY, k)}>
      <svg viewBox="0 0 250 100" role="img" aria-label="এক ঘর একদিকে দ্বিগুণে 2, দুই দিকে 4; তিন দিকের বাক্সে 8" className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect x={6} y={10} width={2 * u + 12} height={2 * u + 12} rx={4} fill={PK.lime} />
        <rect x={12} y={16 + 2 * u - h * u} width={w * u} height={h * u} fill={PK.glow} fillOpacity={0.7} stroke={PK.lamp} strokeWidth={1.2} />
        <path d={`M${12 + u} 16V${16 + 2 * u}M12 ${16 + u}H${12 + 2 * u}`} stroke={INK} strokeOpacity={0.35} strokeDasharray="3 2" />
        <text x={12 + u} y={94} textAnchor="middle" fontSize={13} fontWeight={800} fontFamily={MONO} fill={INK}>
          {k === 0 ? "1" : k === 1 ? "2" : "4"}
        </text>
        {k >= 3 && (
          <g className={FADE}>
            {cubes.map(([x, y, z]) => (
              <S3_Cube key={`${x}${y}${z}`} x={x} y={y} z={z} o={[170, 34]} s={17} />
            ))}
            <text x={170} y={96} textAnchor="middle" fontSize={13} fontWeight={800} fontFamily={MONO} fill={INK}>
              8
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · The turn by 37°, in numbers: the bottom side goes to (0.8, 0.6), the
//      left side to (−0.6, 0.8) (the 3-4-5 triangle); ad − bc = 0.64 + 0.36.

const S4_SAY = [
  "ঘরটা 37° ঘুরলো। নিচের পাশ গেলো (0.8, 0.6) এ।",
  "বাম পাশ গেলো (−0.6, 0.8) এ।",
  "তাহলে lens এর চারটা সংখ্যা: 0.8, −0.6, 0.6, 0.8.",
  "ad − bc = 0.8 × 0.8 − (−0.6) × 0.6 = 0.64 + 0.36 = 1.",
];
const S4F = patchFrame(-0.9, 1.1, -0.3, 1.6, 80); // 176 × 168

export function TurnFormula() {
  const s = useScene(3, [600, 1800, 2000, 2800]);
  const k = s.k;
  const R: Cols = [
    [0.8, 0.6],
    [-0.6, 0.8],
  ];
  return (
    <Scene scene={s} caption={say(S4_SAY, k)}>
      <PatchWall f={S4F} label="37 ডিগ্রি ঘোরানো ঘর; নিচের পাশ (0.8, 0.6), বাম পাশ (−0.6, 0.8); ad − bc = 0.64 + 0.36 = 1" className="max-w-[11rem]">
        <path d={pathD(S4F, SQ)} fill="none" stroke={PK.chalk} strokeWidth={1} strokeDasharray="4 3" />
        <Patch f={S4F} cols={R} />
        <path d={`M${S4F.sx(0)} ${S4F.sy(0)}H${S4F.sx(0.8)}V${S4F.sy(0.6)}`} fill="none" stroke={INK} strokeWidth={0.9} strokeDasharray="3 2" />
        <text x={S4F.sx(0.4)} y={S4F.sy(0) + 12} textAnchor="middle" fontSize={10} fontFamily={MONO} fill={INK}>
          0.8
        </text>
        <text x={S4F.sx(0.8) + 4} y={S4F.sy(0.3) + 3} fontSize={10} fontFamily={MONO} fill={INK}>
          0.6
        </text>
        <Arrow f={S4F} from={[0, 0]} to={R[0]} tone="amber" w={2.6} list="(0.8, 0.6)" />
        {k >= 1 && <Arrow f={S4F} from={[0, 0]} to={R[1]} tone="teal" w={2.6} list="(−0.6, 0.8)" />}
        {k >= 3 && <S_Chip f={S4F} at={[0.1, 1.45]} text="det = 1" tone={OK} />}
      </PatchWall>
    </Scene>
  );
}

// 5½ · The chain: −3, −1, 0, 4; the product runs 1 → −3 → 3 → 0 → 0; after
//      the zero the line only gets longer. Which lens can bring a line back:
//      Article 9.

const S5_SAY = [
  "Stack এ চারটা lens. det: −3, −1, 0, 4.",
  "গুণ করতে করতে: 1, তারপর −3, তারপর 3।",
  "তারপর নাসিবের lens। 3 × 0 = 0. ছবি একটা দাগ।",
  "তারপর L। 0 × 4 = 0. দাগ লম্বা হলো, চওড়া হলো না।",
  "দাগ থেকে ছবি আর ফেরে কি না, সেটা Article 9 এর প্রশ্ন।",
];
const S5_CH = [
  { l: "Z", d: -3, fill: Z_FILL },
  { l: "W", d: -1, fill: W_FILL },
  { l: "", d: 0, fill: C_FILL },
  { l: "L", d: 4, fill: L_FILL },
];
const S5_RUN = ["1", "−3", "3", "0", "0"];
const S5F = patchFrame(-0.5, 7.5, -0.5, 7.5, 13); // 120 × 120
const S5_COLS: Cols[] = [
  I2,
  LENS_G,
  [
    [3, 3],
    [3, 3],
  ],
  [
    [6, 6],
    [6, 6],
  ],
];

export function ZeroChain() {
  const s = useScene(4, [600, 1800, 2200, 2400, 2400]);
  const k = s.k;
  const stage = k <= 1 ? (k === 1 ? 1 : 0) : k - 1;
  const [a, b, c, d] = useTween(S5_COLS[Math.min(3, stage)].flat(), 900);
  return (
    <Scene scene={s} caption={say(S5_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <PatchWall f={S5F} label="stack এর ছবি: প্রথমে ছোপ, নাসিবের lens এ দাগ, L এ দাগ লম্বা" className="max-w-[7.5rem]">
          <Patch
            f={S5F}
            cols={[
              [a, b],
              [c, d],
            ]}
          />
          {k === 4 && (
            <text x={S5F.sx(1.5)} y={S5F.sy(5.5)} textAnchor="middle" fontSize={22} fontWeight={800} fill={BLUE} className={POP}>
              ?
            </text>
          )}
        </PatchWall>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1">
            {S5_CH.map((g, i) => (
              <span key={i} className="flex flex-col items-center">
                <GlassChip letter={g.l} fill={g.fill} small on={(k === 1 && i < 2) || (k === 2 && i === 2) || (k === 3 && i === 3)} />
                <span className="font-mono text-xs">{sg(g.d)}</span>
              </span>
            ))}
          </div>
          <div className="font-mono text-sm">
            {S5_RUN.slice(0, k === 0 ? 1 : k === 1 ? 3 : k === 2 ? 4 : 5).map((v, i, arr) => (
              <span key={i} className={i === arr.length - 1 ? `font-bold ${v === "0" ? "text-danger" : ""}` : "text-muted"}>
                {i > 0 ? " → " : ""}
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// 9½a · Side quest: additivity. Two patches share the side (0, 1): one with
//       (2, 1) (2 ঘর), one with (1, −1) (1 ঘর) set on its tip; slide the top
//       triangle down and they are one patch with (3, 0): 3 ঘর.

const S9A_SAY = [
  "দুইটা ছোপের এক পাশ একই, (0, 1)। প্রথমটার অন্য পাশ (2, 1): 2 ঘর।",
  "দ্বিতীয়টার অন্য পাশ (1, −1): 1 ঘর। বসালাম প্রথমটার মাথায়।",
  "উপরের তেকোনা নিচে নামালে একটাই ছোপ, অন্য পাশ (3, 0)।",
  "পাশ যোগ হলো, জায়গাও যোগ হলো: 2 + 1 = 3।",
];
const S9AF = patchFrame(-0.4, 3.4, -0.4, 2.4, 40); // 168 × 128

export function AddPatches() {
  const s = useScene(3, [600, 2000, 1800, 2400]);
  const k = s.k;
  const [dy] = useTween([k >= 2 ? 1 : 0], 900);
  const one: XY[] = [
    [0, 0],
    [2, 1],
    [2, 2],
    [0, 1],
  ];
  const two: XY[] = [
    [2, 1],
    [3, 0],
    [3, 1],
    [2, 2],
  ];
  const low: XY[] = [
    [0, 0],
    [2, 1],
    [3, 0],
    [3, 1],
    [0, 1],
  ];
  const top: XY[] = [
    [0, 1],
    [2, 2],
    [3, 1],
  ].map(([x, y]) => [x, y - dy] as XY);
  return (
    <Scene scene={s} caption={say(S9A_SAY, k)}>
      <PatchWall f={S9AF} label="দুইটা ছোপ, এক পাশ একই; 2 ঘর আর 1 ঘর; উপরের তেকোনা নিচে নামালে 3 ঘরের একটা ছোপ" className="max-w-[11rem]">
        {k < 2 ? (
          <>
            <path d={pathD(S9AF, one)} fill="#f59e0b" fillOpacity={0.5} stroke="#b45309" strokeWidth={1.3} />
            {k >= 1 && <path d={pathD(S9AF, two)} fill="#0d9488" fillOpacity={0.45} stroke="#0f766e" strokeWidth={1.3} className={POP} />}
          </>
        ) : (
          <>
            <path d={pathD(S9AF, low)} fill={PK.paint} fillOpacity={0.6} stroke={PK.paintDark} strokeWidth={1.2} />
            <path d={pathD(S9AF, top)} fill={PK.paint} fillOpacity={0.6} stroke={PK.paintDark} strokeWidth={1.2} />
          </>
        )}
        <Arrow f={S9AF} from={[0, 0]} to={[0, 1]} tone="blue" w={2.4} />
        {k >= 3 && <S_Chip f={S9AF} at={[1.5, 1.9]} text="2 + 1 = 3" tone={PK.paintDark} />}
      </PatchWall>
    </Scene>
  );
}

// 9½b · Side quest: det as the product of stretches. G sends (1, 1) to
//       (3, 3) and leaves (1, −1) where it is (6.3's StubbornArrow). The
//       patch on those two: 3 times one way, 1 times the other: 3.

const S9B_SAY = [
  "G এর দুইটা বিশেষ দিক: (1, 1) আর (1, −1)।",
  "G চালালে (1, 1) গেলো (3, 3) এ। একই দিকে, 3 গুণ লম্বা।",
  "(1, −1) রয়ে গেলো (1, −1) এ। যেখানে ছিলো, সেখানেই।",
  "ছোপটা একদিকে 3 গুণ, অন্যদিকে 1 গুণ। জায়গা 3 × 1 = 3 = det(G)।",
];
const S9BF = patchFrame(-0.4, 4.2, -1.4, 3.4, 34); // 172 × 179

export function TwoStretches() {
  const s = useScene(3, [600, 1800, 1800, 2600]);
  const k = s.k;
  const [a] = useTween([k >= 1 ? 3 : 1], 900);
  const u: XY = [a, a];
  const v: XY = [1, -1];
  return (
    <Scene scene={s} caption={say(S9B_SAY, k)}>
      <PatchWall f={S9BF} label="G এ (1, 1) তিনগুণ লম্বা হয়ে (3, 3), (1, −1) যেমন ছিলো; তাদের ছোপ তিনগুণ" className="max-w-[11rem]">
        <path d={pathD(S9BF, [[0, 0], u, [u[0] + v[0], u[1] + v[1]], v])} fill={PK.glow} fillOpacity={0.55} stroke={PK.lamp} strokeWidth={1.2} />
        {k >= 1 && <path d={pathD(S9BF, [[0, 0], [1, 1], [2, 0], [1, -1]])} fill="none" stroke={PK.chalk} strokeWidth={1} strokeDasharray="4 3" />}
        <Arrow f={S9BF} from={[0, 0]} to={u} tone="amber" w={2.6} list={k >= 1 ? "(3, 3)" : "(1, 1)"} />
        <Arrow f={S9BF} from={[0, 0]} to={v} tone="teal" w={2.6} list="(1, −1)" />
        {k >= 3 && <S_Chip f={S9BF} at={[2.8, 0.2]} text="3 × 1 = 3" tone={PK.paintDark} />}
      </PatchWall>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  StackBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 3, sealed: true } },
  ZThenW: { start: {}, z: { stage: 1 }, done: { stage: 2 } },
  DoubleLens: { start: {}, one: { guess: 0, dbl: [true, false] }, wrong: { guess: 0, dbl: [true, true] }, done: { guess: 1, dbl: [true, true] } },
  SlideAndTurn: { start: {}, slid: { stage: 1 }, cut: { stage: 2 }, done: { stage: 3 } },
  OneZeroRuinsAll: { start: {}, mid: { pos: 1, tried: [false, true, false] }, done: { pos: 2, tried: [true, true, true] } },
  YourStack: {
    start: {},
    short: { tab: 0, vals: [15, 5, 5], painted: [true, false, false] },
    spill: { tab: 1, vals: [45, 30, 5], painted: [false, true, false], ok: [true, false, false] },
    right3A: { tab: 0, vals: [45, 5, 5], painted: [true, false, false], ok: [true, false, false] },
    done: { tab: 2, vals: [45, 25, 5], painted: [true, true, true], ok: [true, true, true] },
  },
  TryStack: { start: {}, wrong: { pick: 0, ran: true }, added: { pick: 2, ran: true }, right: { pick: 1, ran: true } },
  BetOpen: { start: {}, short: { open: [0], cur: 0 }, over: { open: [0, 1, 3], cur: 3 }, done: { open: [0, 1, 2, 3], cur: 2 } },
  StackMorning: { rest: { k: 0 }, lenses: { k: 1 }, claim: { k: 3 }, done: {} },
  ThreeMore: { som: { k: 1 }, samin: { k: 2 }, done: {} },
  SlantTurn: { karim: { k: 2 }, done: {} },
  NasibSlips: { pocket: { k: 1 }, done: {} },
  LadderPaint: { rest: { k: 0 }, half: { k: 1 }, done: {} },
  DoorDrying: { rest: { k: 0 }, done: {} },
  PaikarVan: { rest: { k: 0 }, done: {} },
  StackStake: { rest: { k: 0 }, z: { k: 1 }, done: {} },
  FlipFlip: { left: { k: 1 }, done: {} },
  WhyMultiply: { rest: { k: 0 }, done: {} },
  SquareCube: { two: { k: 1 }, four: { k: 2 }, done: {} },
  TurnFormula: { one: { k: 0 }, done: {} },
  ZeroChain: { two: { k: 1 }, zero: { k: 2 }, done: {} },
  AddPatches: { two: { k: 1 }, done: {} },
  TwoStretches: { rest: { k: 0 }, done: {} },
};
