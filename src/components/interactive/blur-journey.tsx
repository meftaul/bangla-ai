"use client";

import { useState, type ReactNode } from "react";

import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { LightBhai, Projector, STAGE_WALL_F, StageWall, apply, det, pathOf, useLensRun, type Cols, type Move } from "./light-kit";
import { LENS_G, PK, PatchWall, patchCorners, patchFrame } from "./patch-kit";

// Screens for "Math for AI 9.5 — ঝাপসা lens, ফেরাতে গেলে বিপদ", told as a
// Journey in the author's Bangla-English. The plan is 09_journey_specs.md,
// block 9.5. The last journey of Article 9.
//
// চলে যাওয়ার দিন। The last painting on the wall is Rina's heart, thrown through
// the লাইট ভাই's cheapest lens S = [[1, 0.95], [0.95, 1]] (det 0.0975): a thin
// slanted sliver. A মাছি sat on it and left a speck. S has an undo, so the
// লাইট ভাই says the heart will come back exactly. It does — until the speck:
// S squashed the heart across to a twentieth, so its undo pulls that way
// twenty times, and a speck a hair off the sliver lands as a long scratch.
// A little plain glass (S + λI) calms the undo, at a price: the heart comes
// back a bit squashed across. The same in AI: near-copied columns, wild
// weights, ridge.
//
// Nine screens. 1 seals the bet on what the throw-back shows (SpeckBet). 2
// the sliver alone comes back clean (CleanBack). 3 predict, then the speck
// and a nudge along vs across (DustBlows). 4 λ of plain glass (AddPlainGlass).
// 5 the flat খাতা: sq ft and sq m, wild weights, ridge (WildWeights). 6 Your
// turn: pick λ for a second blur lens with two specks (YourLambda). 7 Try it:
// which painting will blot (TryWhichLens). 8 the bet opened (BetOpen). 9 the
// end: five things (FiveThings), the rest is MDX.
//
// After the screens: the story scenes (VanAtGate, SpeckGuesses, SecondSheet,
// HairOff, ThinGlass, SaminApp, GlassGift, VanLoaded, LastQuestion) and the
// watch-only figures (SpeckStake, CancelFig, SqueezeDir, DetRises,
// CopyToSliver, SolveFig), each numbered after its screen.
//
// The wall and the machine come from light-kit.tsx, the patch wall from
// patch-kit.tsx (both read-only). The ফেরা run is kept here locally, as 9.2
// and 9.3 did. Honest maths note: adding λI shrinks the heart AND the scratch
// by the same factor across (the across-direction is just rescaled), so the
// glass buys a calm throw (nothing flies far, small numbers), paid for with a
// heart squashed across — never a "clean" heart. The screens say so.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const BLUE = "#2563eb";
const OK = "#0d9488";
const BAD = PK.bad;
const HEART = "#ec4899";
const SPECK = "#3b2a1a";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

const sg = (v: number) => (v < 0 ? `−${-v}` : `${v}`);
/** a short decimal, with a real minus */
const fmt = (v: number, d = 2) => sg(Math.round(v * 10 ** d) / 10 ** d || 0);
const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pathD = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}`).join("") + "Z";
const taka = (v: number) => (Math.round(v) < 0 ? "−" : "") + Math.abs(Math.round(v)).toLocaleString("en-US");

// ---------------------------------------------------------------------------
// Numbers. A lens is kept by its columns (light-kit's Cols); these are all
// symmetric, so rows and columns read the same.

const inv = (c: Cols): Cols => {
  const D = det(c);
  return [
    [c[1][1] / D, -c[0][1] / D],
    [-c[1][0] / D, c[0][0] / D],
  ];
};
/** the lens with λ of plain glass mixed in: λ added to both corners */
const plusI = (c: Cols, l: number): Cols => [
  [c[0][0] + l, c[0][1]],
  [c[1][0], c[1][1] + l],
];
const sym = (a: number, b: number): Cols => [
  [a, b],
  [b, a],
];
const big = (c: Cols) => Math.max(...c.flat().map(Math.abs));

/** the ঝাপসা lens S = [[1, 0.95], [0.95, 1]], det 0.0975 */
const S = sym(1, 0.95);
/** Your turn's second blur lens [[1.2, 1.1], [1.1, 1.2]], det 0.23 */
const T = sym(1.2, 1.1);
/** Try it: the thin one [[2, 1.9], [1.9, 2]] (det 0.39), and half-size 0.5I (det 0.25) */
const THIN = sym(2, 1.9);
const HALF = sym(0.5, 0);
const I2 = sym(1, 0);

/** across the sliver (the squashed direction) and along it */
const ACROSS: XY = [Math.SQRT1_2, -Math.SQRT1_2];
const ALONG: XY = [Math.SQRT1_2, Math.SQRT1_2];

/** a heart filling the ঘর [0, 1]² */
const HEART_PTS: XY[] = Array.from({ length: 44 }, (_, i) => {
  const t = (i / 44) * 2 * Math.PI;
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [0.5 + (x / 17) * 0.46, 0.06 + ((y + 17) / 29.5) * 0.9];
});
/** the heart scaled about the pin: `al` along the line y = x, `ac` across it (what λ does to it) */
const through = (al: number, ac: number): XY[] =>
  HEART_PTS.map((p) => {
    const u = (p[0] + p[1]) * Math.SQRT1_2 * al;
    const v = (p[0] - p[1]) * Math.SQRT1_2 * ac;
    return [u * ALONG[0] + v * ACROSS[0], u * ALONG[1] + v * ACROSS[1]];
  });

/**
 * A speck on the painting: over the heart's point `q` (stencil units), `d` off
 * the sliver across and `along` down it (wall units), radius `r` (wall units).
 */
type Speck = { q: XY; d: number; r: number; along?: number };
const speckAt = (paint: Cols, s: Speck): XY => {
  const p = apply(paint, s.q);
  const a = s.along ?? 0;
  return [p[0] + s.d * ACROSS[0] + a * ALONG[0], p[1] + s.d * ACROSS[1] + a * ALONG[1]];
};
const ring = (c: XY, r: number, n = 30): XY[] => Array.from({ length: n }, (_, i) => [c[0] + r * Math.cos((i / n) * 2 * Math.PI), c[1] + r * Math.sin((i / n) * 2 * Math.PI)] as XY);

/** Rina's speck on the S painting: a tenth of a ঘর across, a hair off the sliver */
const SPECK_S: Speck = { q: [0.5, 0.55], d: 0.03, r: 0.05 };

// ---------------------------------------------------------------------------
// The ফেরা run on one patch of wall: the ghost of the true heart (dashed), the
// painting (`paint` carried the heart there) with its specks, and — once
// `undo` is in — the traced পলিথিন's light thrown back, partway by `t`. A
// speck blocks light, so it lands as a dark shadow.

function Throw({
  f,
  paint,
  undo,
  t,
  specks = [],
  label,
  className = "max-w-[10rem]",
  ghost = true,
  bare = false,
  children,
}: {
  f: Frame;
  paint: Cols;
  undo: Cols | null;
  t: number;
  specks?: Speck[];
  label: string;
  className?: string;
  ghost?: boolean;
  /** no painting yet: only the ghost */
  bare?: boolean;
  children?: ReactNode;
}) {
  const P: Move = (p) => apply(paint, p);
  const back = (w: XY): XY => (undo ? lerp(w, apply(undo, w), t) : w);
  const thrown = undo && t > 0;
  const sw = Math.max(1.2, f.u * 0.05);
  return (
    <PatchWall f={f} label={label} className={className}>
      {ghost && <path d={pathD(f, HEART_PTS)} fill={OK} fillOpacity={0.07} stroke={OK} strokeWidth={1.4} strokeDasharray="4 3" className="pointer-events-none" />}
      <g opacity={bare ? 0 : thrown ? 0.3 : 1} className="pointer-events-none">
        <path d={pathOf(f, P, HEART_PTS, true)} fill={HEART} fillOpacity={0.85} stroke={PK.paintDark} strokeWidth={sw} strokeLinejoin="round" />
        {specks.map((s, i) => (
          <path key={i} d={pathD(f, ring(speckAt(paint, s), s.r))} fill={SPECK} />
        ))}
      </g>
      {thrown && (
        <g className="pointer-events-none">
          <path d={pathOf(f, (p) => back(P(p)), HEART_PTS, true)} fill={PK.glow} fillOpacity={0.7} stroke={PK.lamp} strokeWidth={1.1} strokeLinejoin="round" />
          {specks.map((s, i) => (
            <path key={i} d={pathD(f, ring(speckAt(paint, s), s.r).map(back))} fill={SPECK} fillOpacity={0.85} stroke={SPECK} strokeWidth={1.4} strokeLinejoin="round" />
          ))}
        </g>
      )}
      {children}
    </PatchWall>
  );
}

/** a small white chip with words on the wall, at a spot in wall units */
function Chip({ f, at, text, tone = INK }: { f: Frame; at: XY; text: string; tone?: string }) {
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

function Bracket({ side }: { side: "l" | "r" }) {
  return <span className={`w-1.5 self-stretch border-y-2 border-current opacity-60 ${side === "l" ? "rounded-l-sm border-l-2" : "rounded-r-sm border-r-2"}`} />;
}

/** A 2 × 2 lens as numbers, rows first, with brackets. */
function Mat({ c, d = 2, small = false }: { c: Cols; d?: number; small?: boolean }) {
  const cells = [c[0][0], c[1][0], c[0][1], c[1][1]];
  return (
    <span className={`inline-flex items-stretch font-mono font-bold ${small ? "text-xs" : "text-sm"}`}>
      <Bracket side="l" />
      <span className="grid grid-cols-2 gap-x-1.5 px-0.5">
        {cells.map((v, i) => (
          <span key={i} className={`${small ? "min-w-7" : "min-w-9"} text-center ${i === 0 || i === 3 ? "text-[#b45309] dark:text-[#fbbf24]" : "text-[#7c3aed] dark:text-[#c4b5fd]"}`}>
            {fmt(v, d)}
          </span>
        ))}
      </span>
      <Bracket side="r" />
    </span>
  );
}

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

// ---------------------------------------------------------------------------
// Small outcome pictures: a stencil card with the ghost heart, and what landed.

type Outcome = "clean" | "dot" | "blob" | "streak" | "none";
const MINI_F = makeFrame(-0.7, 1.7, -0.7, 1.7, 24, 2); // 62 × 62

/** points of an ellipse centred at c, semi-axis a across and b along */
const ellipse = (c: XY, a: number, b: number): XY[] =>
  Array.from({ length: 30 }, (_, i) => {
    const th = (i / 30) * 2 * Math.PI;
    const u = a * Math.cos(th);
    const v = b * Math.sin(th);
    return [c[0] + u * ACROSS[0] + v * ALONG[0], c[1] + u * ACROSS[1] + v * ALONG[1]] as XY;
  });
const Q0: XY = SPECK_S.q;
/** where S⁻¹ throws Rina's speck: 0.6 across from q, 1 ঘর either side of that */
const STREAK = ellipse([Q0[0] + 0.6 * ACROSS[0], Q0[1] + 0.6 * ACROSS[1]], 1, 0.03);

function OutcomeCard({ kind, q = false, size = 62 }: { kind: Outcome; q?: boolean; size?: number }) {
  const f = MINI_F;
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} width={size} height={size} role="img" aria-label="stencil এর card" className="shrink-0">
      <defs>
        <clipPath id={`oc${kind}${size}`}>
          <rect x={1} y={1} width={f.W - 2} height={f.H - 2} rx={5} />
        </clipPath>
      </defs>
      <rect x={1} y={1} width={f.W - 2} height={f.H - 2} rx={5} fill="white" stroke="#94a3b8" />
      <g clipPath={`url(#oc${kind}${size})`}>
        <path d={pathD(f, HEART_PTS)} fill="none" stroke={OK} strokeWidth={1} strokeDasharray="3 2" />
        {kind === "none" ? (
          <path d={pathOf(f, (p) => apply(S, p), HEART_PTS, true)} fill={PK.glow} stroke={PK.lamp} strokeWidth={1.2} />
        ) : (
          <path d={pathD(f, HEART_PTS)} fill={PK.glow} fillOpacity={0.75} stroke={PK.lamp} strokeWidth={0.8} />
        )}
        {kind === "dot" && <path d={pathD(f, ring(Q0, 0.05))} fill={SPECK} />}
        {kind === "blob" && <path d={pathD(f, ring([0.62, 0.5], 0.2))} fill={SPECK} fillOpacity={0.85} />}
        {kind === "streak" && <path d={pathD(f, STREAK)} fill={SPECK} fillOpacity={0.85} stroke={SPECK} strokeWidth={1} />}
      </g>
      {q && (
        <text x={f.W / 2} y={f.H / 2 + 10} textAnchor="middle" fontSize={28} fontWeight={800} fill={BLUE} className={POP}>
          ?
        </text>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The sliver on the wall with the speck → the ফেরা lens →
//     the stencil card with the ghost heart. Four cards: what the card will
//     show. Sealing drops the picked picture onto the card with a "?".

const X1_CARDS: { who: string; line: string; kind: Outcome }[] = [
  { who: "লাইট ভাই", line: "পরিষ্কার heart, এক ফোঁটাও এদিক ওদিক না", kind: "clean" },
  { who: "সামিন", line: "Heart, আর ছোট একটা ফোঁটা", kind: "dot" },
  { who: "সোম", line: "Heart এর উপর বিশাল দাগ", kind: "streak" },
  { who: "নাসিব", line: "Heart ই আসবে না", kind: "none" },
];
const X1F = patchFrame(-0.3, 2.2, -0.3, 2.2, 40); // 116 × 116

export function SpeckBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(550);
  const k = !sealed ? 0 : act.running ? act.k : 3;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(3, () => pass("বাজি সিল হলো। আগে দাগ ছাড়া।"));
  };
  return (
    <>
      <div className="flex items-center justify-center gap-1.5">
        <Throw f={X1F} paint={S} undo={null} t={0} specks={[SPECK_S]} ghost={false} label="দেয়ালে S দিয়ে আঁকা heart: কোনাকুনি চিকন একটা ফালি, তার এক চুল পাশে মাছির দাগ" className="max-w-[6.5rem]" />
        <RowArrow />
        <span className={`grid size-9 place-items-center rounded-full border-2 border-[#0f1b2d]/50 bg-[#e0f2fe] text-[#0f1b2d] ${k >= 1 ? "shadow-[0_0_0_3px_rgba(253,224,71,0.7)]" : ""}`}>
          <FeraMark size={18} />
        </span>
        <RowArrow />
        <span className="relative">
          {k >= 2 && bet !== null ? (
            <span key={bet} className={`block opacity-60 ${POP}`}>
              <OutcomeCard kind={X1_CARDS[bet].kind} q size={78} />
            </span>
          ) : (
            <OutcomeCard kind="clean" size={78} />
          )}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex items-center gap-2 text-sm leading-tight">
              <OutcomeCard kind={c.kind} size={40} />
              <span className="flex flex-col gap-0.5">
                <span className="text-xs">{c.line}</span>
                <span className="text-xs text-muted">{c.who}</span>
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
      <Task done={k >= 3}>দাগসহ ফালি ফেরালে card এ কী পড়বে? একটা বেছে নিয়ে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The sliver alone (no speck) through S⁻¹. One tap builds the undo with
//     9.2's recipe (the three moves tick by), a second throws it back: the
//     sliver opens into the heart, on the ghost.

const X2F = patchFrame(-0.6, 2.2, -0.6, 2.2, 44); // 139 × 139
const X2_MOVES = ["কোনা বদলানো", "সাইন উল্টানো", "÷ 0.0975"];

export function CleanBack() {
  const pass = useGate();
  const [made, setMade] = useSeed("made", false);
  const [ran, setRan] = useSeed("ran", false);
  const tick = usePlay(500);
  const run = useLensRun(1400, 28);
  const make = () => {
    if (made || tick.running) return;
    setMade(true);
    tick.play(3);
  };
  const go = () => {
    if (run.running || tick.running) return;
    setRan(false);
    run.run(() => {
      setRan(true);
      pass("দাগ না থাকলে ঠিকঠাক ফেরে।");
    });
  };
  const moves = !made ? 0 : tick.running ? tick.k : 3;
  const t = run.running ? run.t : ran ? 1 : 0;
  const U = inv(S);
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <Throw f={X2F} paint={S} undo={moves >= 3 ? U : null} t={t} label="দেয়ালে S এর চিকন ফালি; ফেরা lens দিয়ে ফেরালে আলো গিয়ে পড়ে আসল heart এর দাগের উপর" className="max-w-[9rem]">
          {ran && !run.running && <Chip f={X2F} at={[0.5, -0.4]} text="মিললো" tone={OK} />}
        </Throw>
        <div className="flex w-[8.5rem] flex-col items-center gap-1.5">
          <span className="text-xs text-muted">ঝাপসা lens S</span>
          <Mat c={S} />
          <span className="text-xs text-muted">
            det <span className="font-mono">0.0975</span>
          </span>
          {made && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex flex-wrap justify-center gap-1">
                {X2_MOVES.map((m, i) => (
                  <span key={m} className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold ${i < moves ? `bg-accent/15 text-accent-text ${POP}` : "bg-foreground/5 text-muted"}`}>
                    {m}
                  </span>
                ))}
              </div>
              {moves >= 3 && (
                <span className={`flex items-center gap-1 ${POP}`}>
                  <FeraMark size={14} />
                  <Mat c={U} small />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        {moves < 3 ? (
          <button type="button" className={primaryBtn} disabled={made} onClick={make}>
            ফেরা lens বানান
          </button>
        ) : (
          <button type="button" className={primaryBtn} disabled={run.running} onClick={go}>
            ফালি ফেরান
          </button>
        )}
      </div>
      <Task done={ran && !run.running}>সোমের নিয়মে S এর ফেরা lens বানান। তারপর দাগ ছাড়া ফালিটা ফেরান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict first: where does the speck land? Three pictures (a small dot ·
//     a bigger blob · a long scratch). The throw plays it. Then the speck is
//     nudged a hair (0.05 ঘর) along the sliver and across it: along, its
//     shadow on the card moves 0.03 ঘর; across, a whole ঘর।

const X3F = patchFrame(-0.8, 2.2, -0.8, 2.2, 44); // 148 × 148
const X3_OPTS: { kind: Outcome; say: string }[] = [
  { kind: "dot", say: "ছোট একটা ফোঁটা" },
  { kind: "blob", say: "একটু বড় ফোঁটা" },
  { kind: "streak", say: "লম্বা একটা আঁচড়" },
];
const X3_RIGHT = 2;
const X3_NUDGE = 0.05;

export function DustBlows() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);
  const [off, setOff] = useSeed<[number, number]>("off", [0, 0]);
  const [last, setLast] = useSeed<"along" | "across" | null>("last", null);
  const run = useLensRun(1500, 30);
  const [along, across] = useTween(off, 700);
  const go = () => {
    if (guess === null || run.running) return;
    setRan(false);
    run.run(() => setRan(true));
  };
  const nudge = (which: "along" | "across") => {
    if (!ran || run.running) return;
    const next: [number, number] = which === "along" ? [off[0] + X3_NUDGE, off[1]] : [off[0], off[1] + X3_NUDGE];
    setOff(next);
    setLast(which);
    if (next[0] > 0 && next[1] > 0) pass("প্রায় চ্যাপ্টা lens এর ফেরা: ছোট দাগ বিশাল।");
  };
  const t = run.running ? run.t : ran ? 1 : 0;
  const over = ran && !run.running;
  const speck: Speck = { ...SPECK_S, along, d: SPECK_S.d + across };
  const moved = last === "along" ? X3_NUDGE / 1.95 : last === "across" ? X3_NUDGE / 0.05 : 0;
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <Throw f={X3F} paint={S} undo={guess === null ? null : inv(S)} t={t} specks={[speck]} label="দেয়ালে S এর ফালি আর মাছির দাগ; ফেরালে heart ঠিক জায়গায়, আর দাগটা লম্বা আঁচড় হয়ে card এর উপর দিয়ে চলে যায়" className="max-w-[9.5rem]" />
        {over && (
          <div className={`flex w-[7.5rem] flex-col items-center gap-1 text-center text-xs ${FADE}`}>
            {last === null ? (
              <span className="text-muted">দেয়ালে দাগটা এক চুল সরান। Card এ দেখুন।</span>
            ) : (
              <span key={`${off[0]}${off[1]}`} className={`flex flex-col items-center ${POP}`}>
                <span className="text-muted">দেয়ালে সরলো 0.05 ঘর</span>
                <span className={`font-semibold ${last === "across" ? "text-danger" : "text-accent-text"}`}>
                  card এ সরলো <span className="font-mono">{fmt(moved)}</span> ঘর
                </span>
              </span>
            )}
          </div>
        )}
      </div>
      {!over ? (
        <>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {X3_OPTS.map((o, i) => (
              <Choice key={o.kind} n={i} look={predictLook(i, guess, false, X3_RIGHT)} disabled={run.running} onClick={() => setGuess(i)}>
                <span className="flex flex-col items-center gap-1 text-xs leading-tight">
                  <OutcomeCard kind={o.kind} size={46} />
                  {o.say}
                </span>
              </Choice>
            ))}
          </div>
          <div className="mt-2 flex justify-center">
            <button type="button" className={primaryBtn} disabled={guess === null || run.running} onClick={go}>
              দাগসহ ফেরান
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={`mt-1 text-center text-sm ${guess === X3_RIGHT ? "text-accent-text" : "text-danger"}`}>{guess === X3_RIGHT ? "ঠিক ধরেছেন: লম্বা আঁচড়, 2 ঘর।" : "ফোঁটা না, 2 ঘর লম্বা আঁচড়। Heart এর চেয়েও বড়।"}</div>
          <div className="mt-2 flex justify-center gap-2">
            <button type="button" className={primaryBtn} onClick={() => nudge("along")}>
              ফালি বরাবর এক চুল
            </button>
            <button type="button" className={primaryBtn} onClick={() => nudge("across")}>
              আড়াআড়ি এক চুল
            </button>
          </div>
        </>
      )}
      <Task done={off[0] > 0 && off[1] > 0}>আগে guess দিন, তারপর দাগসহ ফেরান। শেষে দাগটা দুই দিকেই এক চুল সরিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · λ of plain glass. Each λ mixes λI into S; the undo of S + λI throws the
//     same পলিথিন back. The shapes glide between λs: the scratch shortens, and
//     the heart narrows across by the same factor (the price).

const X4_LAMS = [0, 0.02, 0.05, 0.1, 0.2, 0.5];

function LamPills({ lams, lam, seen, onPick, disabled = false }: { lams: number[]; lam: number; seen?: number[]; onPick: (l: number) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <span className="mr-0.5 font-mono text-sm font-bold">λ</span>
      {lams.map((l) => (
        <button
          key={l}
          type="button"
          disabled={disabled}
          onClick={() => onPick(l)}
          className={`cursor-pointer rounded-full border-2 px-2 py-0.5 font-mono text-sm font-semibold transition-colors motion-reduce:transition-none ${l === lam ? "border-cat-blue bg-cat-blue text-white" : seen?.includes(l) ? "border-accent/60" : "border-border hover:border-cat-blue/60"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function AddPlainGlass() {
  const pass = useGate();
  const [lam, setLam] = useSeed("lam", 0);
  const [seen, setSeen] = useSeed<number[]>("seen", [0]);
  const [lt] = useTween([lam], 700);
  const pick = (l: number) => {
    setLam(l);
    const ns = seen.includes(l) ? seen : [...seen, l];
    setSeen(ns);
    if (ns.some((v) => v >= 0.02 && v <= 0.1) && ns.includes(0.5)) pass("একটু সাদা কাঁচ মিশালে ফেরা শান্ত।");
  };
  const L = plusI(S, lam);
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <Throw f={X3F} paint={S} undo={inv(plusI(S, lt))} t={1} specks={[SPECK_S]} label="S এর সাথে λ পরিমাণ সাদা কাঁচ মিশিয়ে ফেরানো: λ যত বাড়ে, আঁচড় তত ছোট, heart ও আড়াআড়ি তত চাপা" className="max-w-[9.5rem]" />
        <div className="flex w-[7.5rem] flex-col items-center gap-1 text-center">
          <span className="text-xs text-muted">S + λI</span>
          <span key={lam} className={FADE}>
            <Mat c={L} small />
          </span>
          <span className="text-xs text-muted">
            det <span className="font-mono font-bold text-foreground">{fmt(det(L), 3)}</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <FeraMark size={12} />
            সবচেয়ে বড় সংখ্যা <span className="font-mono font-bold text-foreground">{fmt(big(inv(L)))}</span>
          </span>
        </div>
      </div>
      <div className="mt-3">
        <LamPills lams={X4_LAMS} lam={lam} seen={seen} onPick={pick} />
      </div>
      <Task done={seen.some((v) => v >= 0.02 && v <= 0.1) && seen.includes(0.5)}>λ একটু একটু বাড়ান, একদম 0.5 পর্যন্ত। আঁচড় কী হয় দেখুন, heart কী হয় দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The flat খাতা (5.2, 8.4): six flats, each measured twice, sq ft and sq m
//     (rounded). The model: ভাড়া = w₁ × sq ft + w₂ × sq m, fitted by
//     w = (XᵀX + λI)⁻¹ Xᵀy — computed here, honestly. λ = 0: w ≈ (+760,
//     −7,962), cancelling; a new flat's sq m written 93 or 94 swings its rent
//     by ~8,000 টাকা। λ = 1: (23, −31); λ = 10: (20, −1.4).

const X5_FLATS: [number, number, number][] = [538, 861, 1076, 1292, 700, 969].map((ft, i) => [ft, Math.round(ft / 10.76), [11000, 17500, 21000, 26000, 14500, 19500][i]]);
const X5_SLOTS = ["sq ft", "sq m", "ভাড়া (টাকা)"];
const X5_LAMS = [0, 1, 10, 100];
const X5_NEW = 1000;
const X5_XTX: Cols = [
  [X5_FLATS.reduce((s, r) => s + r[0] * r[0], 0), X5_FLATS.reduce((s, r) => s + r[0] * r[1], 0)],
  [X5_FLATS.reduce((s, r) => s + r[0] * r[1], 0), X5_FLATS.reduce((s, r) => s + r[1] * r[1], 0)],
];
const X5_XTY: XY = [X5_FLATS.reduce((s, r) => s + r[0] * r[2], 0), X5_FLATS.reduce((s, r) => s + r[1] * r[2], 0)];
const weights = (l: number): XY => apply(inv(plusI(X5_XTX, l)), X5_XTY);
const X5_MAX = 8000;

function WeightBar({ v, label }: { v: number; label: string }) {
  const frac = Math.min(1, Math.abs(v) / X5_MAX);
  const wild = Math.abs(v) > 200;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="w-16 shrink-0 text-right text-muted">{label}</span>
      <span className="relative h-3.5 w-[10rem] rounded-full bg-foreground/10">
        <span className="absolute inset-y-0 left-1/2 w-px bg-foreground/40" />
        <span
          className={`absolute inset-y-0 rounded-full transition-[width,left] duration-700 ease-out motion-reduce:transition-none ${wild ? "bg-danger" : "bg-accent"}`}
          style={{ left: v >= 0 ? "50%" : `${50 - frac * 50}%`, width: `${Math.max(1, frac * 50)}%` }}
        />
      </span>
      <span className={`w-14 font-mono font-bold ${wild ? "text-danger" : ""}`}>{taka(v)}</span>
    </div>
  );
}

export function WildWeights() {
  const pass = useGate();
  const [lam, setLam] = useSeed("lam", 0);
  const [sqm, setSqm] = useSeed("sqm", 93);
  const [seen, setSeen] = useSeed<string[]>("seen", ["0:93"]);
  const w = weights(lam);
  const [rent] = useTween([w[0] * X5_NEW + w[1] * sqm], 600);
  const note = (l: number, m: number) => {
    const key = `${l}:${m}`;
    const ns = seen.includes(key) ? seen : [...seen, key];
    setSeen(ns);
    const has = (l0: boolean) => [93, 94].every((mm) => ns.some((s) => s.endsWith(`:${mm}`) && (s.startsWith("0:") === l0)));
    if (has(true) && has(false)) pass("+λI মানে ridge: 3.5 এর knob এর fine.");
  };
  const done = [93, 94].every((mm) => seen.includes(`0:${mm}`)) && [93, 94].every((mm) => seen.some((s) => s.endsWith(`:${mm}`) && !s.startsWith("0:")));
  return (
    <>
      <div className="mx-auto grid max-w-xs grid-cols-6 gap-x-2 rounded-xl border border-border px-3 py-1 text-right text-xs">
        {[0, 1].map((h) => X5_SLOTS.map((sl) => (
          <span key={`${h}${sl}`} className="text-[0.65rem] text-muted">
            {sl === "ভাড়া (টাকা)" ? "ভাড়া" : sl}
          </span>
        )))}
        {X5_FLATS.map((r) =>
          r.map((v, j) => (
            <span key={`${r[0]}${j}`} title={X5_SLOTS[j]} className="cursor-help font-mono">
              {v}
            </span>
          )),
        )}
      </div>
      <div className="mt-2 flex flex-col items-center gap-1">
        <span className="text-xs text-muted">Model এর weight: প্রতি sq ft বা sq m এ কত টাকা</span>
        <WeightBar v={w[0]} label="প্রতি sq ft" />
        <WeightBar v={w[1]} label="প্রতি sq m" />
      </div>
      <div className="mt-2">
        <LamPills
          lams={X5_LAMS}
          lam={lam}
          onPick={(l) => {
            setLam(l);
            note(l, sqm);
          }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-sm">
        <span>নতুন flat: <span className="font-mono">1000</span> sq ft, sq m লেখা</span>
        {[93, 94].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setSqm(m);
              note(lam, m);
            }}
            className={`cursor-pointer rounded-full border-2 px-2 py-0.5 font-mono font-semibold transition-colors motion-reduce:transition-none ${sqm === m ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"}`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="mt-1 text-center text-sm">
        ভাড়া আসে <span className={`font-mono text-base font-bold ${lam === 0 ? "text-danger" : "text-accent-text"}`}>{taka(rent)}</span> টাকা
      </div>
      <Task done={done}>λ = 0 তে নতুন flat এর sq m 93 আর 94 দুইটাই দেখুন। তারপর λ বাড়িয়ে আবার দুইটা।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn. A second blur lens T = [[1.2, 1.1], [1.1, 1.2]] (squashes
//     across to a tenth), a heart painted with it, two specks. The reader picks
//     λ and throws. Pass: each scratch fits its dashed ring (semi-axis ≤ 0.3)
//     and the heart still covers the inner dashed heart (squashed ≥ half).
//     λ = 0.05 and 0.1 pass; less scratches, more squashes.

const X6_LAMS = [0, 0.025, 0.05, 0.1, 0.2, 0.4];
const X6_MU = 0.1;
const X6_SPECKS: Speck[] = [
  { q: [0.3, 0.72], d: 0.025, r: 0.04 },
  { q: [0.62, 0.36], d: -0.02, r: 0.04 },
];
const X6_RING = 0.3;
const X6F = patchFrame(-0.6, 2.5, -0.6, 2.5, 52); // 177 × 177
const X6_INNER = through(0.93, 0.45);
const x6Land = (s: Speck, l: number): XY => apply(inv(plusI(T, l)), speckAt(T, s));
const x6Judge = (l: number) => {
  const semi = X6_SPECKS[0].r / (X6_MU + l);
  const g = X6_MU / (X6_MU + l);
  return semi > X6_RING ? "scratch" : g < 0.45 ? "thin" : "ok";
};

export function YourLambda() {
  const pass = useGate();
  const [lam, setLam] = useSeed("lam", 0);
  const [thrown, setThrown] = useSeed<number | null>("thrown", null);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1400, 28);
  const go = () => {
    if (run.running) return;
    setThrown(lam);
    run.run(() => {
      if (x6Judge(lam) === "ok") pass("একটু, কিন্তু বেশি না: ঠিক মাপের λ।");
      else setMiss((m) => m + 1);
    });
  };
  const t = thrown === null ? 0 : run.running ? run.t : 1;
  const over = thrown !== null && !run.running;
  const verdict = thrown === null ? null : x6Judge(thrown);
  const L = thrown ?? lam;
  return (
    <>
      <Throw f={X6F} paint={T} undo={thrown === null ? null : inv(plusI(T, thrown))} t={t} specks={X6_SPECKS} label="দ্বিতীয় ঝাপসা lens দিয়ে আঁকা heart, দুইটা মাছির দাগ; ফেরালে আঁচড় গোল দাগের ভেতরে থাকতে হবে, আর heart ভেতরের দাগের চেয়ে সরু হওয়া যাবে না" className="mx-auto max-w-[11rem]">
        <path d={pathD(X6F, X6_INNER)} fill="none" stroke={BLUE} strokeWidth={1.2} strokeDasharray="2 3" className="pointer-events-none" />
        {X6_SPECKS.map((s, i) => (
          <path key={i} d={pathD(X6F, ring(x6Land(s, L), X6_RING))} fill="none" stroke={BLUE} strokeWidth={1} strokeDasharray="3 3" className="pointer-events-none transition-all motion-reduce:transition-none" />
        ))}
        {over && verdict === "ok" && <Chip f={X6F} at={[0.5, -0.45]} text="মিললো" tone={OK} />}
      </Throw>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className="text-xs text-muted">T</span>
        <Mat c={T} small />
      </div>
      <div className="mt-2">
        <LamPills
          lams={X6_LAMS}
          lam={lam}
          disabled={run.running}
          onPick={(l) => {
            setLam(l);
            setThrown(null);
          }}
        />
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={run.running || (over && verdict === "ok")} onClick={go}>
          এই λ দিয়ে ফেরান
        </button>
      </div>
      {over && verdict === "scratch" && <Nope key={miss}>আঁচড় গোল দাগ ছাড়িয়ে গেলো। সাদা কাঁচ আরেকটু বেশি লাগবে।</Nope>}
      {over && verdict === "thin" && <Nope key={miss}>আঁচড় ছোট, কিন্তু heart ভেতরের নীল দাগের চেয়েও চিকন। কাঁচ বেশি হয়ে গেলো।</Nope>}
      <Task done={over && verdict === "ok"}>λ বেছে ফেরান। দুইটা আঁচড়ই গোল দাগের ভেতরে থাকবে, আর heart ভেতরের নীল দাগ ঢেকে রাখবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it. Three paintings, each with the same speck a hair off: 0.5I
//     (det 0.25, the smallest), the thin [[2, 1.9], [1.9, 2]] (det 0.39), G
//     (det 3). Which throw-back will scratch? A wrong pick throws back clean
//     with a small dot; the thin one throws a scratch.

const X7_LENS: { c: Cols; d: string }[] = [
  { c: HALF, d: "0.25" },
  { c: THIN, d: "0.39" },
  { c: LENS_G, d: "3" },
];
const X7_RIGHT = 1;
const X7_SPECK: Speck = { q: [0.5, 0.55], d: 0.03, r: 0.04 };
const X7_NOPE = ["det সবচেয়ে ছোট, কিন্তু সব দিকে সমান ছোট। ফেরায় ফোঁটা 2 গুণ, heart ও 2 গুণ। দাগ ছোটই রইলো।", "", "মোটা ছবি। ফেরায় ফোঁটা বরং ছোট হলো।"];
const X7F = patchFrame(-0.7, 2, -0.7, 2, 44); // 135 × 135
const X7_ICON_F = makeFrame(-0.4, 4.2, -0.4, 4.2, 15, 3); // 75 × 75

function X7_Icon({ c }: { c: Cols }) {
  const f = X7_ICON_F;
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} width={64} height={64} role="img" aria-label="দেয়ালের ছবি, পাশে একটা মাছির দাগ" className="shrink-0 rounded-md bg-[#e9e4d8]">
      <path d={pathOf(f, (p) => apply(c, p), HEART_PTS, true)} fill={HEART} fillOpacity={0.85} stroke={PK.paintDark} strokeWidth={1.2} strokeLinejoin="round" />
      {(() => {
        const at = speckAt(c, X7_SPECK);
        return <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={2.2} fill={SPECK} />;
      })()}
    </svg>
  );
}

export function TryWhichLens() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1300, 26);
  const choose = (i: number) => {
    if (run.running || (ran && pick === X7_RIGHT)) return;
    setPick(i);
    setRan(false);
    run.run(() => {
      setRan(true);
      if (i === X7_RIGHT) pass("চ্যাপ্টা দিকটাই বিপদ, ছোট det না।");
      else setMiss((m) => m + 1);
    });
  };
  const t = run.running ? run.t : ran ? 1 : 0;
  const over = ran && !run.running;
  const L = pick === null ? null : X7_LENS[pick].c;
  return (
    <>
      <Throw f={X7F} paint={L ?? I2} bare={!L} undo={L ? inv(L) : null} t={t} specks={L ? [X7_SPECK] : []} label="বেছে নেওয়া ছবিটা দাগসহ ফেরানো, আসল heart এর দাগের উপর" className="mx-auto max-w-[9rem]">
        {over && pick === X7_RIGHT && <Chip f={X7F} at={[0.5, -0.45]} text="আঁচড়!" tone={BAD} />}
        {over && pick !== X7_RIGHT && <Chip f={X7F} at={[0.5, -0.45]} text="পরিষ্কার" tone={OK} />}
      </Throw>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X7_LENS.map((l, i) => (
          <Choice key={i} n={i} look={pick === i && over ? (i === X7_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={run.running || (over && pick === X7_RIGHT)} onClick={() => choose(i)}>
            <span className="flex flex-col items-center gap-1">
              <X7_Icon c={l.c} />
              <span className="font-mono text-xs">det {l.d}</span>
            </span>
          </Choice>
        ))}
      </div>
      {over && pick !== null && pick !== X7_RIGHT && <Nope key={miss}>ফিরে এলো পরিষ্কার। {X7_NOPE[pick]}</Nope>}
      <Task done={over && pick === X7_RIGHT}>তিনটা ছবির পাশেই একই মাছির দাগ। কোনটা ফেরালে আঁচড় পড়বে? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The bet opened. Each card is run on the real পলিথিন through S⁻¹ alone;
//     the card says what it bet, the throw says what happened. Then, all four
//     open, one last throw with λ = 0.05 of plain glass.

const X8_SAY = [
  "টিকলো না। Heart ঠিক, কিন্তু দাগ 20 গুণ লম্বা।",
  "ফোঁটা ফোঁটা থাকলো না। আঁচড় হয়ে গেলো।",
  "শুধু ফেরা lens এ ঠিক এটাই: heart এর উপর দিয়ে বিশাল আঁচড়।",
  "Heart তো এলো, পুরাটা। শুধু দাগটা বিপদ।",
];
const X8_RIGHT = 2;
const X8_LAM = 0.05;

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const [glass, setGlass] = useSeed("glass", false);
  const run = useLensRun(1300, 26);
  const tap = (i: number) => {
    if (run.running || glass) return;
    setOpen(open.includes(i) ? open : [...open, i]);
    setCur(i);
    run.run();
  };
  const withGlass = () => {
    if (run.running || glass) return;
    setGlass(true);
    setCur(null);
    run.run(() => pass("সাদা কাঁচে দাগ ছোট। দাম: heart চাপা।"));
  };
  const shown = cur !== null || glass;
  const t = !shown ? 0 : run.running ? run.t : 1;
  const U = glass ? inv(plusI(S, X8_LAM)) : shown ? inv(S) : null;
  const landed = shown && !run.running;
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <Throw f={X3F} paint={S} undo={U} t={t} specks={[SPECK_S]} label="রিনার পলিথিন ফেরানো: শুধু ফেরা lens এ heart এর উপর দিয়ে লম্বা আঁচড়; সাদা কাঁচ মিশালে আঁচড় ছোট, heart একটু চাপা" className="max-w-[9rem]" />
        <div className="flex w-[8rem] flex-col items-center gap-1 text-center text-xs">
          {landed ? (
            <span key={glass ? "g" : cur} className={`${FADE} ${glass ? "font-semibold text-accent-text" : cur === X8_RIGHT ? "font-semibold text-accent-text" : "text-danger"}`}>
              {glass ? "সাদা কাঁচ মিশিয়ে: আঁচড় অর্ধেক। Heart ও আড়াআড়ি চাপা।" : cur !== null ? X8_SAY[cur] : ""}
            </span>
          ) : (
            <span className="text-muted">একটা card খুলুন</span>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={open.includes(i) ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={run.running || glass} onClick={() => tap(i)}>
            <span className="flex items-center gap-2 text-sm leading-tight">
              <OutcomeCard kind={c.kind} size={36} />
              <span className="text-xs">{c.who}</span>
            </span>
          </Choice>
        ))}
      </div>
      {open.length === X1_CARDS.length && (
        <div className={`mt-2 flex justify-center ${FADE}`}>
          <button type="button" className={primaryBtn} disabled={run.running || glass} onClick={withGlass}>
            সাদা কাঁচ মিশিয়ে ফেরান
          </button>
        </div>
      )}
      <Task done={glass && !run.running}>চারটা card একটা একটা করে খুলুন। তারপর λ = 0.05 সাদা কাঁচ মিশিয়ে শেষবার ফেরান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Five things to carry forward (§9), tap to reveal; each opens with its
//     small picture.

const FT_THINGS: [string, string][] = [
  ["A⁻¹ মানে A এর ফেরা", "A এর পরে A⁻¹ চালালে সাদা কাঁচ, I। সব কিছু ঘরে ফেরে। I এর column গুলো e₁ আর e₂ ই, নড়ে না।"],
  ["ফেরা আছে det শূন্য না হলে", "আর lens square হতে হবে। det 0 মানে একটা দিক মুছে গেছে। মুছে যাওয়া খবর কেউ ফেরাতে পারে না।"],
  ["কোনা বদলাও, সাইন উল্টাও, det দিয়ে ভাগ", "2 × 2 এর নিয়ম। বড় lens এ adj(A)/det(A), 8.6 এর cofactor দিয়ে।"],
  ["শেষে লাগানো lens আগে খোলো", "(AB)⁻¹ = B⁻¹A⁻¹. আর ঘোরানো lens এর ফেরা: পাশ থেকে পড়ো, Aᵀ।"],
  ["কাজে inverse বানায় না", "Ax = b এর জন্য solve। প্রায় চ্যাপ্টা lens দাগ বাড়ায়। Ridge এর +λI সেটাই সারায়।"],
];

/** one small picture per thing, drawn on a white card */
function FT_Pic({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 64 40" className={`h-8 w-13 shrink-0 rounded bg-white ${POP}`} aria-hidden="true">
      {i === 0 && (
        <g>
          <path d="M6 32h12v-12h-12Z" fill={PK.glow} stroke={PK.lamp} />
          <path d="M22 26l12 -4l4 -12l-12 4Z" fill={HEART} fillOpacity={0.7} stroke={PK.paintDark} />
          <path d="M40 30q8 6 14 -2" stroke={INK} strokeWidth={1.2} fill="none" />
          <path d="M44 32h12v-12h-12Z" fill={PK.glow} stroke={PK.lamp} />
        </g>
      )}
      {i === 1 && (
        <g>
          <path d="M8 34L30 12" stroke={PK.lamp} strokeWidth={2.6} strokeLinecap="round" />
          <text x={40} y={27} fontSize={11} fontWeight={800} fontFamily={MONO} fill={BAD}>
            ÷0
          </text>
        </g>
      )}
      {i === 2 && (
        <g fontFamily={MONO} fontSize={10} fontWeight={800}>
          <text x={10} y={17} fill="#b45309">d</text>
          <text x={24} y={17} fill="#7c3aed">−b</text>
          <text x={10} y={31} fill="#7c3aed">−c</text>
          <text x={24} y={31} fill="#b45309">a</text>
          <text x={42} y={25} fill={INK}>÷det</text>
        </g>
      )}
      {i === 3 && (
        <g>
          <rect x={6} y={10} width={20} height={22} rx={2} fill="#78350f" />
          <rect x={10} y={14} width={12} height={14} rx={2} fill="#dc2626" />
          <path d="M32 21h10l-3 -3M42 21l-3 3" stroke={INK} strokeWidth={1.2} fill="none" />
          <text x={46} y={25} fontSize={9} fontWeight={800} fontFamily={MONO} fill={INK}>
            B⁻¹A⁻¹
          </text>
        </g>
      )}
      {i === 4 && (
        <g>
          <path d="M8 32L28 10" stroke={HEART} strokeWidth={2} strokeLinecap="round" />
          <circle cx={21} cy={20} r={2} fill={SPECK} />
          <text x={34} y={25} fontSize={10} fontWeight={800} fontFamily={MONO} fill={INK}>
            +λI
          </text>
        </g>
      )}
    </svg>
  );
}

export function FiveThings() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const tap = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === FT_THINGS.length) pass("Article 9 এর পাঁচটা কথা।");
  };
  return (
    <>
      <div className="grid gap-1.5">
        {FT_THINGS.map(([t, line], i) => {
          const shown = open.includes(i);
          return (
            <button
              key={t}
              type="button"
              onClick={() => tap(i)}
              disabled={shown}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-1.5 text-left text-sm transition-colors duration-300 disabled:cursor-default motion-reduce:transition-none ${shown ? "border-cat-blue/40 bg-cat-blue/5" : "border-border hover:border-cat-blue/60"}`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cat-blue/15 text-xs font-bold text-cat-blue">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{t}</span>
                {shown && <span className={`${FADE} block text-xs leading-snug text-muted`}>{line}</span>}
              </span>
              {shown ? <FT_Pic i={i} /> : <span className="text-xs text-muted">খুলুন</span>}
            </button>
          );
        })}
      </div>
      <Task done={open.length === FT_THINGS.length}>পাঁচটা card একটা একটা করে খুলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage bits for the story scenes: the উঠান on leaving day. The wall (light-
// kit's StageWall) carries the sliver by the window; the ভ্যান at the gate.

const SW: [number, number] = [8, 30]; // the stage wall's top-left
const onStage = (p: XY): [number, number] => [SW[0] + STAGE_WALL_F.sx(p[0]), SW[1] + STAGE_WALL_F.sy(p[1])];
const ST_AT: XY = [-2.6, -1.5];
const ST_S = 1.5;
const stMove: Move = (p) => {
  const q = apply(S, p);
  return [ST_AT[0] + q[0] * ST_S, ST_AT[1] + q[1] * ST_S];
};
const ST_SPECK = (() => {
  const w = speckAt(S, SPECK_S);
  return [ST_AT[0] + w[0] * ST_S, ST_AT[1] + w[1] * ST_S] as XY;
})();

/** the sliver (and the speck) on the stage wall, in wall units */
function St_Sliver({ speck = true }: { speck?: boolean }) {
  const f = STAGE_WALL_F;
  return (
    <g className="pointer-events-none">
      <path d={pathOf(f, stMove, HEART_PTS, true)} fill={HEART} stroke={HEART} strokeWidth={1.6} strokeLinejoin="round" />
      {speck && <circle cx={f.sx(ST_SPECK[0])} cy={f.sy(ST_SPECK[1])} r={1.8} fill={SPECK} />}
    </g>
  );
}

/** a মাছি: a dark body, two pale wings */
function St_Fly({ x, y, gone = false }: { x: number; y: number; gone?: boolean }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, opacity: gone ? 0 : 1 }} className="pointer-events-none transition-[transform,opacity] duration-[1400ms] ease-out motion-reduce:transition-none">
      <ellipse cx={-2} cy={-2.5} rx={2.4} ry={1.4} fill="#e0f2fe" opacity={0.9} transform="rotate(-30)" />
      <ellipse cx={2} cy={-2.5} rx={2.4} ry={1.4} fill="#e0f2fe" opacity={0.9} transform="rotate(30)" />
      <ellipse rx={2} ry={1.4} fill="#111827" />
    </g>
  );
}

/** a sheet of পলিথিন held up, the sliver traced on it in marker (and the speck) */
function St_Poly({ x, y, w = 26, speck = true }: { x: number; y: number; w?: number; speck?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - w / 2} y={y - w / 2} width={w} height={w} rx={1.5} fill="#e0f2fe" fillOpacity={0.75} stroke="#94a3b8" strokeWidth={0.7} />
      <path d={`M${x - w * 0.35} ${y + w * 0.35}L${x + w * 0.35} ${y - w * 0.35}`} stroke="#1e3a8a" strokeWidth={1.3} strokeLinecap="round" />
      {speck && <circle cx={x + w * 0.06} cy={y + 0.5} r={1.4} fill={SPECK} />}
    </g>
  );
}

/** the rickshaw-ভ্যান: a plank bed on two wheels, the driver's seat and handlebar in front (left); `load` puts the machine on it */
function St_Van({ x, load = "half" }: { x: number; load?: "half" | "all" }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={124} width={52} height={6} rx={1} fill="#a16207" stroke="#713f12" strokeWidth={0.8} />
      <circle cx={x + 12} cy={140} r={9} fill="none" stroke="#1f2937" strokeWidth={2} />
      <circle cx={x + 42} cy={140} r={9} fill="none" stroke="#1f2937" strokeWidth={2} />
      <circle cx={x - 14} cy={142} r={7} fill="none" stroke="#1f2937" strokeWidth={2} />
      <path d={`M${x} 128L${x - 14} 142M${x - 8} 128v-14M${x - 12} 114h8M${x - 14} 124l-4 -12h6`} stroke="#334155" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <rect x={x + 6} y={load === "all" ? 108 : 112} width={22} height={load === "all" ? 16 : 12} rx={2} fill="#334155" stroke={INK} strokeWidth={0.7} />
      {load === "all" && [0, 5, 10].map((d) => <path key={d} d={`M${x + 30 + d * 0.3} 124l14 -${10 - d * 0.4}`} stroke="#b08d3c" strokeWidth={2} strokeLinecap="round" />)}
      <rect x={x + 32} y={116} width={14} height={8} rx={1.5} fill="#78350f" />
    </g>
  );
}

/** a thin pane of plain glass, held up */
function St_Pane({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 8} y={y - 10} width={16} height={20} rx={1} fill="#e0f2fe" fillOpacity={0.55} stroke="#7dd3fc" strokeWidth={1} />
      <path d={`M${x - 5} ${y - 6}l5 -2M${x - 5} ${y - 1}l8 -3`} stroke="white" strokeWidth={1} />
    </g>
  );
}

/** Samin's phone, the খাতা's two columns on the screen */
function St_Phone({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 6} y={y - 10} width={12} height={20} rx={2} fill="#1f2937" />
      <rect x={x - 4.5} y={y - 8} width={9} height={15} rx={0.8} fill="#e0f2fe" />
      {[0, 1, 2, 3].map((r) => (
        <path key={r} d={`M${x - 3.5} ${y - 6 + r * 3.4}h3M${x + 0.8} ${y - 6 + r * 3.4}h2.6`} stroke={INK} strokeWidth={0.8} />
      ))}
    </g>
  );
}

/** আপা in her শাড়ি (8.7's look): the cast's আপা with a red আঁচল, her name under her feet */
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

/** the car (8.7's), front to the right at (x, y), no lights by day */
function St_Car({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x} ${y - 8}v-12q0 -4 4 -5l14 -2l12 -14h36l12 14h6q4 1 4 5v14Z`} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
      <path d={`M${x + 22} ${y - 27}l10 -11h32l9 11Z`} fill="#334155" />
      <circle cx={x + 22} cy={y - 5} r={6} fill="#1f2937" />
      <circle cx={x + 72} cy={y - 5} r={6} fill="#1f2937" />
    </g>
  );
}

/** the gate's two brick posts */
function St_Gate({ x }: { x: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 3} y={96} width={8} height={54} fill="#b45309" stroke="#78350f" strokeWidth={0.8} />
      <rect x={x - 5} y={92} width={12} height={5} fill="#92400e" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Leaving day, noon. The wall with the sliver by the window, a মাছি on
//      it; the ভ্যান at the gate, the machine half packed. The মাছি flies off,
//      a speck left behind. Rina traces the sliver onto পলিথিন। The লাইট ভাই,
//      in a hurry: ফেরা lens থাকলেই ফেরত।

export function VanAtGate({}: Story) {
  const s = useScene(3, [600, 1800, 2000, 2600]);
  const k = s.k;
  const [fx, fy] = onStage(ST_SPECK);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="চলে যাওয়ার দিন, দুপুর; দেয়ালে জানালার পাশে চিকন কোনাকুনি একটা ফালি, রিনার heart; তার উপর একটা মাছি উড়ে গেলো, রেখে গেলো ছোট দাগ; রিনা পলিথিনে ফালিটা দাগালো; গেটে ভ্যান, যন্ত্র অর্ধেক বাঁধা; লাইট ভাই বললেন ফেরা lens থাকলেই ফেরত আসে, এক ফোঁটাও এদিক ওদিক হবে না">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Sliver speck={k >= 1} />
        </StageWall>
        <St_Fly x={k >= 1 ? fx + 60 : fx} y={k >= 1 ? fy - 40 : fy - 2} gone={k >= 1} />
        <St_Gate x={236} />
        <St_Van x={262} />
        <Person who="rina" x={k >= 2 ? 96 : 150} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} walking={k === 2} label />
        {k >= 2 && (
          <g className={POP}>
            <St_Poly x={fx + 4} y={fy} />
          </g>
        )}
        <LightBhai x={206} y={150} facing={-1} arm={k >= 3 ? "point" : "down"} />
        {k >= 3 && <Bubble x={206} y={82} side="left" lines={["ফেরা lens থাকলেই ফেরত।", "এক ফোঁটাও এদিক ওদিক না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1b · Three more answers: Samin (the speck stays small), Som (big numbers,
//      big mark), Nasib (no heart at all).

export function SpeckGuesses({}: Story) {
  const s = useScene(3, [600, 2200, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সামিন বললো দাগ যেমন ছোট, card এও তেমন ছোট থাকবে; সোম বললো ফেরা lens এর সংখ্যা বিশাল, দাগও বিশাল হবে; নাসিব বললো এত চিকন ফালি থেকে heart আসবেই না">
        <Person who="samin" x={60} y={150} facing={1} arm={k === 1 ? "point" : "down"} label />
        <Person who="som" x={160} y={150} facing={1} arm={k === 2 ? "hold" : "down"} label />
        {k === 2 && <rect x={166} y={100} width={20} height={14} rx={1} fill="#fefce8" stroke="#a16207" strokeWidth={0.8} className={POP} />}
        <Person who="nasib" x={260} y={150} facing={-1} mood={k === 3 ? "smug" : "plain"} arm={k === 3 ? "wave" : "down"} label />
        {k === 1 && <Bubble x={60} y={84} side="right" lines={["দাগ ছোট। Card এও", "ছোটই থাকবে।"]} />}
        {k === 2 && <Bubble x={160} y={84} side="mid" lines={["ফেরা lens এর সংখ্যা", "বিশাল। দাগও বিশাল।"]} />}
        {k === 3 && <Bubble x={260} y={84} side="left" lines={["এত চিকন ফালি থেকে", "heart? আসবেই না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · Rina takes a second sheet and traces the sliver alone, no speck.

export function SecondSheet({}: Story) {
  const s = useScene(2, [600, 1800, 2000]);
  const k = s.k;
  const [fx, fy] = onStage(ST_SPECK);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="রিনা আরেকটা পলিথিন নিলো; এবার শুধু ফালিটা দাগালো, মাছির দাগ বাদ দিয়ে">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Sliver />
        </StageWall>
        <Person who="rina" x={k >= 1 ? 96 : 200} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} label />
        {k >= 1 && (
          <g className={POP}>
            <St_Poly x={fx + 4} y={fy} speck={false} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <circle cx={fx + 5} cy={fy + 0.5} r={4} fill="none" stroke={BAD} strokeWidth={1} strokeDasharray="1.5 1.5" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Som holds the speckled sheet up to the sun. A magnifier: the speck is
//      not on the line; a hair beside it.

export function HairOff({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সোম দাগওয়ালা পলিথিনটা রোদের দিকে ধরলো; কাছে দেখলে মাছির দাগ ফালির ঠিক উপরে না, এক চুল পাশে">
        <circle cx={270} cy={26} r={11} fill="#fde047" />
        <circle cx={270} cy={26} r={17} fill="#fde047" opacity={0.3} />
        <Person who="som" x={110} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 1 && (
          <g className={POP}>
            <St_Poly x={124} y={98} w={24} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <path d="M136 96L176 70" stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="2 2" />
            <circle cx={210} cy={80} r={36} fill="#f8fafc" stroke="#475569" strokeWidth={2} />
            <path d="M184 106L236 54" stroke="#1e3a8a" strokeWidth={4} strokeLinecap="round" />
            <circle cx={218} cy={84} r={5} fill={SPECK} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 4a · The লাইট ভাই comes back from the ভ্যান with a thin plain glass: mix a
//      little into S and the undo stays calm.

export function ThinGlass({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="লাইট ভাই ভ্যান থেকে একটা পাতলা সাদা কাঁচ নিয়ে ফিরলেন; বললেন S এর সাথে এইটা একটু মিশাই, কোনায় কোনায় একটু যোগ হবে, ফেরা তখন ঠান্ডা থাকবে">
        <St_Gate x={236} />
        <St_Van x={262} />
        <Person who="rina" x={80} y={150} facing={1} label />
        <Person who="som" x={124} y={150} facing={1} label />
        <LightBhai x={k >= 1 ? 184 : 250} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} />
        {k >= 1 && (
          <g className={POP}>
            <St_Pane x={166} y={104} />
          </g>
        )}
        {k === 2 && <Bubble x={184} y={78} side="left" lines={["S এর সাথে একটু", "সাদা কাঁচ মিশাই।"]} />}
        {k >= 3 && <Bubble x={184} y={78} side="left" lines={["কোনায় একটু যোগ।", "ফেরা ঠান্ডা থাকবো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · Samin takes out his phone: 8.4's flat খাতা, every flat measured twice.

export function SaminApp({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সামিন ফোন বের করলো; ফোনে দালাল ভাইয়ের খাতা, প্রতিটা flat এর মাপ দুইবার, sq ft এ আর sq m এ; সামিন বললো এইটা আমার app এও হয়">
        <Person who="samin" x={120} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 1 && (
          <g className={POP}>
            <St_Phone x={132} y={104} />
          </g>
        )}
        {k >= 1 && (
          <g className={POP}>
            <rect x={176} y={50} width={100} height={62} rx={6} fill="#f8fafc" stroke="#475569" strokeWidth={1.2} />
            <text x={200} y={64} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK} fontFamily={MONO}>
              sq ft
            </text>
            <text x={250} y={64} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK} fontFamily={MONO}>
              sq m
            </text>
            {X5_FLATS.slice(0, 4).map((r, i) => (
              <g key={r[0]} fontFamily={MONO} fontSize={8} fill={INK}>
                <text x={200} y={76 + i * 10} textAnchor="middle">
                  {r[0]}
                </text>
                <text x={250} y={76 + i * 10} textAnchor="middle">
                  {r[1]}
                </text>
              </g>
            ))}
          </g>
        )}
        {k >= 2 && <Bubble x={120} y={82} side="left" lines={["এইটা আমার app", "এও হয়।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 8a · The লাইট ভাই laughs at himself and hands Rina the thin glass.

export function GlassGift({}: Story) {
  const s = useScene(3, [600, 2000, 1800, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="লাইট ভাই নিজের কথায় নিজেই হাসলেন; পাতলা সাদা কাঁচটা রিনার হাতে দিলেন">
        <St_Gate x={236} />
        <St_Van x={262} />
        <Person who="rina" x={110} y={150} facing={1} arm={k >= 3 ? "hold" : "down"} label />
        <LightBhai x={180} y={150} facing={-1} arm={k >= 2 && k < 3 ? "hold" : k >= 1 ? "wave" : "down"} />
        {k === 1 && <Bubble x={180} y={80} side="left" lines={["এক ফোঁটাও এদিক ওদিক", "না! কী কইছিলাম। হা হা।"]} />}
        <g style={{ transform: `translate(${k >= 3 ? 124 : 164}px, 104px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
          {k >= 2 && <St_Pane x={0} y={0} />}
        </g>
        {k >= 3 && <Bubble x={180} y={80} side="left" lines={["রাইখা দাও। কাজে", "লাগবো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · The machine goes up on the ভ্যান। আপা with a খাতা of stencils walks to
//      the car at the gate.

export function VanLoaded({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="যন্ত্র ভ্যানে উঠলো; আপা stencil ভরা খাতা বুকে নিয়ে গেটের দিকে হাঁটলেন">
        <St_Gate x={186} />
        <St_Van x={250} load={k >= 1 ? "all" : "half"} />
        {k < 1 && <Projector x={150} y={150} facing={-1} lens="empty" />}
        <LightBhai x={k >= 1 ? 226 : 172} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} />
        <St_Apa x={k >= 3 ? 128 : k >= 2 ? 84 : 40} facing={1} arm="hold" walking={k >= 2} />
        <g style={{ transform: `translate(${k >= 3 ? 144 : k >= 2 ? 100 : 56}px, 112px)` }} className="transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
          <rect x={-8} y={-6} width={16} height={12} rx={1} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth={0.8} />
          <path d="M-6 -6v-2h5v2" fill="#b45309" />
        </g>
      </Stage>
    </StoryFrame>
  );
}

// 9b · The bridge to Article 10. Rina at the ভ্যান: next time a heart right
//      above the door — where on the stencil must it be drawn? The লাইট ভাই
//      doesn't answer. The ভ্যান goes; আপার গাড়ি behind it; Rina at the gate.

export function LastQuestion({}: Story) {
  const s = useScene(4, [600, 2200, 2400, 1800, 2000]);
  const k = s.k;
  const off = k >= 3 ? 120 : 0;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="রিনা ভ্যানের কাছে দৌড়ে গেলো; বললো পরের বার একটা heart ঠিক দরজার উপরে ফেলবো, stencil এর কোথায় আঁকলে ওখানে পড়বে; লাইট ভাই কিছু বললেন না; ভ্যান চলে গেলো, পেছনে আপার গাড়ি; রিনা গেটে দাঁড়িয়ে">
        <g style={{ transform: `translate(${off}px, 0px)` }} className="transition-transform duration-[1800ms] ease-in motion-reduce:transition-none">
          <St_Van x={236} load="all" />
          <LightBhai x={214} y={150} facing={-1} name={false} />
        </g>
        <g style={{ transform: `translate(${k >= 4 ? 200 : 0}px, 0px)` }} className="transition-transform duration-[2000ms] ease-in motion-reduce:transition-none">
          <St_Car x={100} y={150} />
        </g>
        <St_Gate x={60} />
        <Person who="rina" x={k >= 1 && k < 3 ? 176 : 44} y={150} facing={1} arm={k === 1 ? "point" : "down"} walking={k === 1 || k === 3} label />
        {k === 1 && <Bubble x={176} y={84} side="mid" lines={["পরের বার heart ঠিক", "দরজার উপরে ফেলবো।"]} />}
        {k === 2 && <Bubble x={176} y={84} side="mid" lines={["Stencil এর কোথায়", "আঁকলে ওখানে পড়বে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · The stake. What lands on the card is what Rina cuts. A dark dot on the
//      card is an extra hole in the stencil. The ভ্যান goes in an hour.

const X1B_SAY = ["Card এ যা পড়বে, রিনা কাঁচি দিয়ে ঠিক সেটাই কাটবে।", "Card এ একটা দাগ পড়লে?", "Stencil এ বাড়তি একটা ফুটো। আপার দেয়ালে heart এর পাশে একটা ফোঁটা।", "ভ্যান যাবে এক ঘণ্টা পরে। যন্ত্রও যাবে।"];
const X1B_F = makeFrame(-0.3, 1.3, -0.3, 1.3, 50, 6); // 92 × 92

export function SpeckStake() {
  const s = useScene(3, [600, 1600, 2200, 2200]);
  const k = s.k;
  const f = X1B_F;
  const cut = k >= 2;
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <div className="flex items-center justify-center gap-4">
        <svg viewBox={`0 0 ${f.W} ${f.H}`} className="h-auto w-full max-w-[6rem]" role="img" aria-label="stencil এর card: আলোর heart, পরে কেটে বের করা stencil">
          <rect x={2} y={2} width={f.W - 4} height={f.H - 4} rx={5} fill={cut ? "#b45309" : "white"} stroke={cut ? "#78350f" : "#94a3b8"} className="transition-colors duration-700 motion-reduce:transition-none" />
          <path d={pathD(f, HEART_PTS)} fill={cut ? "#fef3c7" : PK.glow} fillOpacity={cut ? 1 : 0.75} stroke={cut ? "#78350f" : PK.lamp} strokeWidth={1} className="transition-colors duration-700 motion-reduce:transition-none" />
          {k >= 1 && <circle key={cut ? "h" : "d"} cx={f.sx(1.12)} cy={f.sy(0.2)} r={4} fill={cut ? "#fef3c7" : SPECK} stroke={cut ? "#78350f" : "none"} className={POP} />}
        </svg>
        {k >= 3 && (
          <svg viewBox="0 0 80 60" className={`h-auto w-full max-w-[5rem] ${POP}`} role="img" aria-label="ভ্যান আর একটা ঘড়ি: এক ঘণ্টা">
            <circle cx={40} cy={18} r={14} fill="white" stroke={INK} strokeWidth={1.5} />
            <path d="M40 18V8M40 18h7" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
            <rect x={18} y={40} width={40} height={5} rx={1} fill="#a16207" />
            <circle cx={26} cy={52} r={6} fill="none" stroke="#1f2937" strokeWidth={1.8} />
            <circle cx={52} cy={52} r={6} fill="none" stroke="#1f2937" strokeWidth={1.8} />
            <rect x={24} y={30} width={16} height={10} rx={1.5} fill="#334155" />
          </svg>
        )}
      </div>
    </Scene>
  );
}

// 2½ · Why the big numbers don't wreck the sliver: a point on it, (0.3, 0.3).
//      The undo's first column takes it 3 ঘর right-down, the second almost
//      exactly back. What's left is the small true step: (0.15, 0.15).

const X2B_SAY = ["ফালির দাগের উপর একটা বিন্দু, (0.3, 0.3). দুই সংখ্যা সমান।", "ফেরা lens এর প্রথম column এর 0.3 গুণ: অনেক দূর, ডানে নিচে।", "দ্বিতীয় column এর 0.3 গুণ: প্রায় ততটাই, উল্টা দিকে।", "কাটাকাটি হয়ে থাকে ছোট্ট একটা পা: (0.15, 0.15). Heart এর ঠিক জায়গা।"];
const X2B_F = patchFrame(-0.6, 3.6, -3.4, 2.1, 24); // 117 × 148
const X2B_P: XY = [0.3, 0.3];

export function CancelFig() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const f = X2B_F;
  const U = inv(S);
  const a: XY = [U[0][0] * 0.3, U[0][1] * 0.3];
  const b: XY = apply(U, X2B_P);
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <div className="mx-auto w-[7.5rem]">
        <PatchWall f={f} label="ফালির উপরের একটা বিন্দু, ফেরা lens এর দুই বড় পা উল্টা দিকে, কাটাকাটি হয়ে ছোট একটা পা" className="max-w-none">
          <path d={pathOf(f, (p) => apply(S, p), HEART_PTS, true)} fill={HEART} fillOpacity={0.6} stroke={HEART} strokeWidth={1.2} className="pointer-events-none" />
          {k >= 1 && <Arrow f={f} from={[0, 0]} to={a} tone="coral" w={2.2} draw list="(3.08, −2.92)" />}
          {k >= 2 && <Arrow f={f} from={a} to={b} tone="violet" w={2.2} draw list="(−2.92, 3.08)" />}
          <circle cx={f.sx(X2B_P[0])} cy={f.sy(X2B_P[1])} r={3} fill={BLUE} className="pointer-events-none" />
          {k >= 3 && <circle cx={f.sx(b[0])} cy={f.sy(b[1])} r={3.5} fill={OK} stroke="white" strokeWidth={1} className={`pointer-events-none ${POP}`} />}
        </PatchWall>
      </div>
    </Scene>
  );
}

// 3½ · Why one direction matters. Left: the tiny lens 0.1I; right: S. Same
//      heart; the same-size speck compared to each painting; back through each
//      undo: a small dot on the left, a long scratch on the right.

const X3B_SAY = ["একই heart, দুইটা lens: 0.1I আর S।", "0.1I সব দিকে 10 ভাগের এক করে। S শুধু আড়াআড়ি 20 ভাগের এক।", "দুইটা ছবির পাশেই একটা ফোঁটা। ছবির মাপের তুলনায় সমান ছোট।", "ফেরায় 0.1I সব দিকে 10 গুণ: ফোঁটা ছোটই থাকে। S আড়াআড়ি 20 গুণ টানে: ফোঁটা হয়ে যায় আঁচড়।"];
const X3B_F = patchFrame(-0.7, 2.1, -0.7, 2.1, 34); // 111 × 111
const X3B_TINY = sym(0.1, 0);

export function SqueezeDir() {
  const s = useScene(3, [600, 1800, 2000, 2600]);
  const k = s.k;
  const f = X3B_F;
  const panel = (L: Cols, sp: Speck, name: string) => {
    const paintMove: Move = (p) => (k >= 1 && k < 3 ? apply(L, p) : p);
    const at = speckAt(L, sp);
    const back = k >= 3 ? ring(at, sp.r).map((w) => apply(inv(L), w)) : ring(at, sp.r);
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-[6.5rem]">
          <PatchWall f={f} label={`${name} দিয়ে heart, পাশে একটা ফোঁটা, তারপর ফেরা`} className="max-w-none">
            <path d={pathD(f, HEART_PTS)} fill="none" stroke={OK} strokeWidth={1} strokeDasharray="3 2" className="pointer-events-none" />
            <path key={k === 0 ? 0 : k < 3 ? 1 : 2} d={pathOf(f, paintMove, HEART_PTS, true)} fill={k >= 3 ? PK.glow : HEART} fillOpacity={0.8} stroke={k >= 3 ? PK.lamp : HEART} strokeWidth={1.4} className={`pointer-events-none ${FADE}`} />
            {k >= 2 && <path key={k} d={pathD(f, back)} fill={SPECK} className={`pointer-events-none ${POP}`} />}
            {k === 2 && <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={7} fill="none" stroke={BAD} strokeWidth={1} strokeDasharray="2 2" className={`pointer-events-none ${POP}`} />}
          </PatchWall>
        </div>
        <span className="font-mono text-xs font-bold">{name}</span>
      </div>
    );
  };
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <div className="flex justify-center gap-3">
        {panel(X3B_TINY, { q: [0.5, 0.55], d: 0.003, r: 0.004 }, "0.1I")}
        {panel(S, { q: [0.5, 0.55], d: 0.02, r: 0.03 }, "S")}
      </div>
    </Scene>
  );
}

// 4½ · det rising off zero. The lens itself, S + λI, as the patch one ঘর
//      becomes: a sliver fattening as λ grows; its det as a bar.

const X4B_L = [0, 0.05, 0.2, 0.5];
const X4B_SAY = ["λ = 0: S নিজে। এক ঘর হয় চিকন ফালি, det 0.0975.", "λ = 0.05: ফালি একটু মোটা। det 0.2, দ্বিগুণ।", "λ = 0.2: det 0.54.", "λ = 0.5: det 1.35. ফালি এখন মোটা একটা ছবি। শূন্য থেকে অনেক দূরে।"];
const X4B_F = patchFrame(-0.3, 2.3, -0.3, 2.3, 34); // 104 × 104

export function DetRises() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const L = plusI(S, X4B_L[k]);
  const f = X4B_F;
  const d = det(L);
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <div className="flex items-end justify-center gap-4">
        <div className="w-[6.5rem]">
          <PatchWall f={f} label="S এর সাথে λ সাদা কাঁচ: এক ঘর যে ছবি হয়, λ বাড়লে মোটা হয়" className="max-w-none">
            <path d={pathD(f, patchCorners(I2))} fill="none" stroke={INK} strokeWidth={1} strokeDasharray="3 2" className="pointer-events-none" />
            <path d={pathD(f, patchCorners(L))} fill={PK.glow} fillOpacity={0.7} stroke={PK.lamp} strokeWidth={1.3} className="pointer-events-none transition-all duration-700 motion-reduce:transition-none" />
          </PatchWall>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-[5.5rem] w-8 items-end rounded-md bg-foreground/5">
            <span className="w-full rounded-md bg-cat-blue transition-[height] duration-700 ease-out motion-reduce:transition-none" style={{ height: `${Math.max(3, (d / 1.4) * 100)}%` }} />
          </div>
          <span className="font-mono text-xs font-bold">det {fmt(d, 2)}</span>
        </div>
      </div>
    </Scene>
  );
}

// 5½ · From near-copied columns to a sliver. S's two columns, (1, 0.95) and
//      (0.95, 1), nearly one direction (8.4's NearCopy): one ঘর becomes a
//      sliver. The খাতা's sq ft and sq m columns do the same to XᵀX. +λI
//      opens the two columns apart; the sliver fattens.

const X5B_SAY = ["S এর দুই column: (1, 0.95) আর (0.95, 1). প্রায় একই দিকে।", "তাই এক ঘর হয়ে যায় চিকন ফালি। 8.4 এর প্রায় copy column এর মতো।", "খাতার sq ft আর sq m ও প্রায় copy। Model এর lens XᵀX তাই এমন ফালি।", "+λI: কোনায় একটু যোগ। Column দুইটা একটু ফাঁক হয়, ফালি মোটা হয়।"];
const X5B_F = patchFrame(-0.3, 2.4, -0.3, 2.4, 36); // 113 × 113

export function CopyToSliver() {
  const s = useScene(3, [600, 1600, 2200, 2200]);
  const k = s.k;
  const f = X5B_F;
  const L = k >= 3 ? plusI(S, 0.3) : S;
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <div className="mx-auto w-[7rem]">
        <PatchWall f={f} label="দুই column প্রায় একই দিকে, এক ঘর হয়ে যায় চিকন ফালি; কোনায় λ যোগ করলে ফালি মোটা হয়" className="max-w-none">
          {k >= 1 && <path d={pathD(f, patchCorners(L))} fill={PK.glow} fillOpacity={0.7} stroke={PK.lamp} strokeWidth={1.2} className={`pointer-events-none transition-all duration-700 motion-reduce:transition-none ${FADE}`} />}
          {k >= 2 && k < 3 && (
            <text x={f.sx(1.7)} y={f.sy(0.5)} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={INK} className={`pointer-events-none ${POP}`}>
              XᵀX
            </text>
          )}
          <Arrow f={f} from={[0, 0]} to={L[0]} tone="coral" w={2.2} />
          <Arrow f={f} from={[0, 0]} to={L[1]} tone="violet" w={2.2} />
        </PatchWall>
      </div>
    </Scene>
  );
}

// 9½ · Side quest: solve, not inv. inv(A) builds the undo for every b at once
//      (a whole grid of numbers, n × n); solve works out only this b's answer.

const X9B_SAY = ["Ax = b. প্রশ্ন একটাই: এই b টার x কত?", "inv(A): পুরা ফেরা lens বানায়। সব b এর উত্তর একসাথে, n × n টা সংখ্যা।", "solve(A, b): শুধু এই b এর x। কাজ প্রায় তিন ভাগের এক, গোল করার ভুলও কম জমে।"];
const X9B_N = 6;

export function SolveFig() {
  const s = useScene(2, [600, 2200, 2400]);
  const k = s.k;
  const cell = 9;
  return (
    <Scene scene={s} caption={say(X9B_SAY, k)}>
      <svg viewBox="0 0 220 84" className="mx-auto h-auto w-full max-w-[14rem]" role="img" aria-label="বাঁয়ে inv: পুরা n × n ঘর ভরা; ডানে solve: শুধু একটা column">
        <text x={50} y={12} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={INK}>
          inv(A)
        </text>
        <text x={170} y={12} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={INK}>
          solve(A, b)
        </text>
        {Array.from({ length: X9B_N * X9B_N }, (_, i) => {
          const r = Math.floor(i / X9B_N);
          const c = i % X9B_N;
          return <rect key={i} x={23 + c * cell} y={20 + r * cell} width={cell - 1.5} height={cell - 1.5} rx={1} fill={k >= 1 ? BAD : "#e2e8f0"} fillOpacity={k >= 1 ? 0.6 : 1} className="transition-colors duration-500 motion-reduce:transition-none" style={{ transitionDelay: `${i * 12}ms` }} />;
        })}
        {Array.from({ length: X9B_N }, (_, r) => (
          <rect key={r} x={166} y={20 + r * cell} width={cell - 1.5} height={cell - 1.5} rx={1} fill={k >= 2 ? OK : "#e2e8f0"} fillOpacity={k >= 2 ? 0.8 : 1} className="transition-colors duration-500 motion-reduce:transition-none" style={{ transitionDelay: `${r * 60}ms` }} />
        ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  SpeckBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 1, sealed: true } },
  CleanBack: { start: {}, made: { made: true }, ran: { made: true, ran: true } },
  DustBlows: { start: {}, guessed: { guess: 0 }, ran: { guess: 0, ran: true }, across: { guess: 2, ran: true, off: [0, 0.05], last: "across" }, along: { guess: 2, ran: true, off: [0.05, 0.05], last: "along" } },
  AddPlainGlass: { start: {}, l05: { lam: 0.05, seen: [0, 0.05] }, l5: { lam: 0.5, seen: [0, 0.05, 0.5] } },
  WildWeights: { start: {}, s94: { sqm: 94, seen: ["0:93", "0:94"] }, calm: { lam: 10, sqm: 94, seen: ["0:93", "0:94", "10:93", "10:94"] } },
  YourLambda: { start: {}, scratch: { lam: 0.025, thrown: 0.025 }, thin: { lam: 0.2, thrown: 0.2 }, right: { lam: 0.1, thrown: 0.1 } },
  TryWhichLens: { start: {}, wrong: { pick: 0, ran: true }, right: { pick: 1, ran: true } },
  BetOpen: { start: {}, light: { open: [0], cur: 0 }, som: { open: [0, 1, 2], cur: 2 }, all: { open: [0, 1, 2, 3], cur: 3 }, glass: { open: [0, 1, 2, 3], cur: null, glass: true } },
  FiveThings: { start: {}, two: { open: [0, 1] }, all: { open: [0, 1, 2, 3, 4] } },
  VanAtGate: { rest: { k: 0 }, fly: { k: 1 }, rina: { k: 2 }, done: {} },
  SpeckGuesses: { samin: { k: 1 }, som: { k: 2 }, done: {} },
  SecondSheet: { rest: { k: 0 }, done: {} },
  HairOff: { hold: { k: 1 }, done: {} },
  ThinGlass: { rest: { k: 0 }, two: { k: 2 }, done: {} },
  SaminApp: { rest: { k: 0 }, done: {} },
  GlassGift: { laugh: { k: 1 }, done: {} },
  VanLoaded: { rest: { k: 0 }, done: {} },
  LastQuestion: { ask: { k: 1 }, ask2: { k: 2 }, done: {} },
  SpeckStake: { rest: { k: 0 }, dot: { k: 1 }, cut: { k: 2 }, done: {} },
  CancelFig: { rest: { k: 0 }, one: { k: 1 }, done: {} },
  SqueezeDir: { rest: { k: 0 }, squeeze: { k: 1 }, speck: { k: 2 }, done: {} },
  DetRises: { rest: { k: 0 }, done: {} },
  CopyToSliver: { rest: { k: 0 }, xtx: { k: 2 }, done: {} },
  SolveFig: { inv: { k: 1 }, done: {} },
};
