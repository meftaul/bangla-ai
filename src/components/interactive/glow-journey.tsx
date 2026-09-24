"use client";

import { useState, type ReactNode } from "react";

import { Bubble, Person, Stage, StoryFrame, type Who } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { type Frame, type XY } from "@/components/journey/plane";
import { LightBhai, Projector, STAGE_WALL_F, StageBeam, StageWall, byCols, det, partway, projectorLens, useLensRun, type Cols } from "./light-kit";
import { FLOWER_OUTLINE, LENS_G, LENS_H, LENS_L, PK, PatchWall, cellPoly, mapPts, patchCorners, patchFrame, planPatch } from "./patch-kit";

// Screens for "Math for AI 8.7 — বড় হলে আলো ফিকে", told as a Journey in the
// author's Bangla-English. The plan is 08_journey_specs.md, block 8.7. The
// last journey of Article 8: it closes the article (five things, the full
// notation table) and bridges to Article 9 (the inverse) in words only.
//
// ফিরানির রাত. The লাইট ভাই throws one heart through G and L together (8.5's
// stack, det 3 × 4 = 12) to fill the wall before আপা's car comes. সোম: এত
// বড় করলে আলো ফিকে হবে. The লাইট ভাই: বাতি বদলাই নাই, আলো যা ছিলো তাই
// থাকবো. How bright will the big heart be?
//
// Brightness is drawn as light-dots per ঘর (spec open question 4), never a
// slider. The stencil's one ঘর lets through 12 dots. A lens carries every dot
// along (the dots are points, mapped by the lens), so the count never
// changes; only the room they spread over does. The gate's মরিচ বাতি wash the
// wall with 2 dots per ঘর; a heart needs at least 3 per ঘর to show over them
// (invented, stated in the MDX).
//
// Eight screens. 1 seals the bet: একই · অর্ধেক · 12 ভাগের এক · 144 ভাগের এক
// (GlowBet). 2 one ঘর's 12 dots through G, count the whole ঘর in the middle:
// 4 (SameLightMoreWall). 3 predict, then H (48 per ঘর) and the আয়না M (12,
// same) (ShrinkBrightens). 4 the same in AI: a heap of 100 dots through three
// lenses, the middle's density ÷ |det|, the total stays 100 (ProbabilityIsLight).
// 5 Your turn: stack the kept lenses for the biggest heart that still shows,
// |det| = 4 (YourHeart). 6 Try it: a lens that doubles one way, which of three
// hearts (TryDim). 7 the bet opened on the 12× heart (GlowOpen). 8 the end:
// five things (FiveThings).
//
// After the screens: the story scenes (NightGate, ThreeGuesses, NasibSmall,
// SaminPhone, LensLedge, Headlights, Firani, LateNight) and the watch-only
// figures (GlowStake, SlideThree, TorchFig, DivideFig, FlowFig, BellFig,
// RecapGlow), each numbered after its screen.
//
// patch-kit.tsx (8.1) and light-kit.tsx are used read-only.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const GLOW = "#fde047";
const LAMP = "#f59e0b";
const PINK = "#ec4899";
const PINK_DARK = "#be185d";
const NIGHT_INK = "#f8fafc";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

// ---------------------------------------------------------------------------
// Numbers.

const I2: Cols = [
  [1, 0],
  [0, 1],
];
/** the আয়না M = [[−1, 0], [0, 1]] (7.4, 8.3) */
const MIRROR: Cols = [
  [-1, 0],
  [0, 1],
];
/** 7.3's violet spare W = [[0, 1], [1, 1]]: det −1 */
const LENS_W: Cols = [
  [0, 1],
  [1, 1],
];
/** 8.4's পুঁচকে lens, [[0.1, 0], [0, 0.1]]: Rina kept it */
const TINY: Cols = [
  [0.1, 0],
  [0, 0.1],
];
/** 8.4's crusher, the one Nasib pocketed: [[1, 1], [1, 1]] */
const CRUSH: Cols = [
  [1, 1],
  [1, 1],
];
/** a lens that doubles one way only: [[2, 0], [0, 1]] */
const WIDE: Cols = [
  [2, 0],
  [0, 1],
];

/** A after B, as one lens (B first): the columns of B carried by A */
const after = (A: Cols, B: Cols): Cols => [mapPts(A, [B[0]])[0], mapPts(A, [B[1]])[0]];
/** 8.5's stack for tonight: G, then L. det 3 × 4 = 12 */
const LG: Cols = after(LENS_L, LENS_G);

const pathD = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}`).join("") + "Z";
const shift = (pts: readonly XY[], d: XY): XY[] => pts.map((p) => [p[0] + d[0], p[1] + d[1]]);
/** the points carried partway by the lens (t 0 = where they were) */
const carry = (c: Cols, pts: readonly XY[], t: number): XY[] => pts.map(partway(byCols(c), t));
/** |det| of the lens carried partway (the room the dots are spread over, per ঘর) */
const areaAt = (c: Cols, t: number) => {
  const m = partway(byCols(c), t);
  const a = m([1, 0]);
  const b = m([0, 1]);
  return Math.abs(a[0] * b[1] - a[1] * b[0]);
};

/** Is p inside the polygon (ray casting)? */
const inPoly = (p: XY, P: readonly XY[]) => {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i];
    const b = P[j];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
};

/** Dots spread d per ঘর (a square lattice), those inside the polygon. */
const latticeIn = (P: readonly XY[], d: number, off = 0.5): XY[] => {
  if (d <= 0) return [];
  const s = 1 / Math.sqrt(d);
  const xs = P.map((p) => p[0]);
  const ys = P.map((p) => p[1]);
  const out: XY[] = [];
  for (let y = Math.floor(Math.min(...ys) / s) * s + off * s; y < Math.max(...ys); y += s)
    for (let x = Math.floor(Math.min(...xs) / s) * s + off * s; x < Math.max(...xs); x += s) if (inPoly([x, y], P)) out.push([x, y]);
  return out;
};

/** a toggle button for Bangla labels (kit's pill is monospace, which has no Bangla glyphs) */
const tab = (on: boolean) =>
  `cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors motion-reduce:transition-none disabled:cursor-default disabled:opacity-40 ${
    on ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"
  }`;

const fmt = (v: number) => {
  const a = Math.abs(v);
  const s = a === 0.25 ? "¼" : a === 0.5 ? "½" : Number.isInteger(a) ? `${a}` : a >= 1 ? a.toFixed(1).replace(/\.0$/, "") : `${+a.toFixed(2)}`;
  return v < 0 ? `−${s}` : s;
};

/**
 * The লাইট ভাই's heart stencil: the classic heart curve, about one ঘর across
 * (area ≈ 0.83 ঘর), its dip over (0.5, …). HEART_DOTS are the light-dots it
 * lets through: 12 per ঘর.
 */
const HEART0: XY[] = Array.from({ length: 60 }, (_, i) => {
  const t = (i / 60) * 2 * Math.PI;
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [0.5 + x / 26, 0.5 + (y + 2.5) / 26] as XY;
});
const HEART_DOTS: XY[] = (() => {
  const out: XY[] = [];
  for (let j = -2; j < 6; j += 1)
    for (let i = -3; i < 8; i += 1) {
      const p: XY = [(i + 0.5 + (j % 2 ? 0.5 : 0)) / 4, (j + 0.5) / 3];
      if (inPoly(p, HEART0)) out.push(p);
    }
  return out;
})();

/**
 * The stencil's one ঘর of light: 12 dots. They sit where G sends them onto
 * the quarter-points of the chalk grid (x.25, x.75), so on the wall every
 * whole ঘর of the patch holds exactly 4 of them. Here they are before the
 * lens: 12 spots, evenly spread over the ঘর.
 */
const UNIT_DOTS: XY[] = (() => {
  const P = patchCorners(LENS_G);
  const out: XY[] = [];
  for (let i = 0; i < 14; i += 1)
    for (let j = 0; j < 14; j += 1) {
      const x = 0.25 + i / 2;
      const y = 0.25 + j / 2;
      if (inPoly([x, y], P)) out.push([(2 * x - y) / 3, (2 * y - x) / 3]);
    }
  return out;
})();

/** The gate's মরিচ বাতি on the wall: 2 faint dots per ঘর. */
const gateDots = (x0: number, x1: number, y0: number, y1: number): XY[] => {
  const out: XY[] = [];
  for (let x = Math.floor(x0); x < x1; x += 1)
    for (let y = Math.floor(y0); y < y1; y += 1) {
      out.push([x + 0.25, y + 0.3]);
      out.push([x + 0.75, y + 0.8]);
    }
  return out;
};

// ---------------------------------------------------------------------------
// Wall pieces (inside a <PatchWall dark>).

/** Light-dots: a soft glow and a bright core each. `tone` "gate" for the মরিচ বাতি's faint white ones. */
function Dots({ f, pts, r = 2.1, tone = "light", className }: { f: Frame; pts: readonly XY[]; r?: number; tone?: "light" | "gate" | "pink"; className?: string }) {
  if (tone === "gate")
    return (
      <g className="pointer-events-none">
        {pts.map((p, i) => (
          <circle key={i} cx={f.sx(p[0])} cy={f.sy(p[1])} r={r * 0.7} fill="#cbd5e1" opacity={0.45} />
        ))}
      </g>
    );
  const core = tone === "pink" ? "#fbcfe8" : "white";
  const halo = tone === "pink" ? PINK : GLOW;
  return (
    <g className={`pointer-events-none ${className ?? ""}`}>
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={f.sx(p[0])} cy={f.sy(p[1])} r={r * 2.2} fill={halo} opacity={0.3} />
          <circle cx={f.sx(p[0])} cy={f.sy(p[1])} r={r} fill={core} stroke={tone === "pink" ? PINK_DARK : LAMP} strokeWidth={0.7} />
        </g>
      ))}
    </g>
  );
}

/** A heart of light: its glow as bright as its dots are dense (d per ঘর), outline dashed while it's only a guess. */
function HeartGlow({ f, poly, d, ghost = false, tone = "light" }: { f: Frame; poly: readonly XY[]; d: number; ghost?: boolean; tone?: "light" | "pink" }) {
  const o = Math.max(0, Math.min(0.8, (d / 12) * 0.62));
  return (
    <path
      d={pathD(f, poly)}
      fill={tone === "pink" ? PINK : GLOW}
      fillOpacity={ghost ? 0 : o}
      stroke={tone === "pink" ? PINK : ghost ? PINK : LAMP}
      strokeWidth={1.2}
      strokeDasharray={ghost ? "4 3" : undefined}
      strokeOpacity={ghost ? 0.9 : 0.5 + o * 0.5}
      className="pointer-events-none transition-[fill-opacity] duration-500 motion-reduce:transition-none"
    />
  );
}

/** A small label on the night wall. */
function WallText({ x, y, children, size = 11, anchor = "middle", tone = NIGHT_INK }: { x: number; y: number; children: ReactNode; size?: number; anchor?: "start" | "middle" | "end"; tone?: string }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={700} fill={tone} className="pointer-events-none">
      {children}
    </text>
  );
}

/** A lens as a matrix, columns side by side (knob 1 amber, knob 2 teal). */
function G_Lens({ cols, name, small = false }: { cols: Cols; name?: ReactNode; small?: boolean }) {
  const tone = ["text-cat-amber", "text-cat-teal"];
  const cell = small ? "min-w-4 text-xs" : "min-w-5 text-sm";
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {name && <span className="text-sm">{name}</span>}
      <span className={`inline-flex items-stretch font-mono font-bold ${small ? "text-xs" : "text-sm"}`}>
        <span className="w-1 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
        {[0, 1].map((c) => (
          <span key={c} className={`flex flex-col items-center px-0.5 ${tone[c]}`}>
            <span className={`${cell} text-center`}>{fmt(cols[c][0])}</span>
            <span className={`${cell} text-center`}>{fmt(cols[c][1])}</span>
          </span>
        ))}
        <span className="w-1 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. On the night wall: last night's small heart (plain
//     glass, 12 dots per ঘর) and the dashed outline the G + L stack will
//     throw, 12 × the room. A card's pick fills the outline with that card's
//     brightness (its dots per ঘর); sealing hangs a "?" on it.

const X1_CARDS = [
  { who: "লাইট ভাই", d: 12, name: "একই উজ্জ্বল", line: "বাতি তো একই" },
  { who: "নাসিব", d: 6, name: "অর্ধেক", line: "একটু তো কমবেই" },
  { who: "সামিন", d: 1, name: "12 ভাগের এক", line: "জায়গা 12 গুণ" },
  { who: "করিম", d: 1 / 12, name: "144 ভাগের এক", line: "লম্বায় 12, চওড়ায় 12" },
];
const X1F = patchFrame(-3.1, 6.6, -0.7, 6.5, 24); // 241 × 181
const X1_SMALL_AT: XY = [-2.6, 4.4];
const X1_SMALL = shift(HEART0, X1_SMALL_AT);
const X1_BIG = mapPts(LG, HEART0);
/** a card's brightness drawn on the big heart: d dots per ঘর; under 1 (Karim's 1/12, less than one dot in the whole heart), one dim dot */
const claimDots = (d: number): XY[] => (d < 1 ? [mapPts(LG, [[0.5, 0.45]])[0]] : latticeIn(X1_BIG, d));

export function GlowBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(700);
  const k = !sealed ? 0 : act.running ? act.k : 2;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(2, () => pass("বাজি সিল হলো. আগে এক ঘরের আলো."));
  };
  const d = bet === null ? 0 : X1_CARDS[bet].d;
  const guess = bet === null ? [] : claimDots(d);
  return (
    <>
      <PatchWall f={X1F} dark label="রাতের দেয়াল; বাঁয়ে উপরে কালকের ছোট heart, ঘন আলোর ফোঁটা; ডানে বড় heart এর দাগ, যত বড় হবে; বাছাই করা বাজির মতো ফোঁটা তাতে; প্রশ্নবোধক" className="max-w-[16rem]" pin={false}>
        <HeartGlow f={X1F} poly={X1_SMALL} d={12} />
        <Dots f={X1F} pts={shift(HEART_DOTS, X1_SMALL_AT)} r={1.7} />
        <WallText x={X1F.sx(-2.05)} y={X1F.sy(3.8)} size={9}>
          কালকের heart
        </WallText>
        <HeartGlow f={X1F} poly={X1_BIG} d={d} ghost={bet === null} tone={bet === null ? "light" : "pink"} />
        {bet !== null && <Dots key={bet} f={X1F} pts={guess} r={1.9} tone="pink" className={FADE} />}
        {k >= 1 && (
          <WallText x={X1F.sx(3)} y={X1F.sy(-0.25)} size={10} tone="#fbcfe8">
            {`ঘরে ${d >= 1 ? d : "1/12"} ফোঁটা`}
          </WallText>
        )}
        {k >= 2 && (
          <text x={X1F.sx(5.5)} y={X1F.sy(1.2)} fontSize={26} fontWeight={800} fill="#60a5fa" className={POP}>
            ?
          </text>
        )}
      </PatchWall>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex flex-col text-sm leading-tight">
              <span>
                <b>{c.name}</b> · {c.who}
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
      <Task done={k >= 2}>বড় heart কতটা উজ্জ্বল হবে? একটা বেছে নিয়ে বাজি সিল করুন. উত্তর শেষে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Same light, more wall. The stencil's one ঘর: 12 dots. "আলো ফেলুন"
//     carries every dot through G (the ঘর becomes 8.1's patch, its glow
//     fading as it grows). Then the whole ঘর in the middle of the patch is
//     tapped: its dots light one by one, 1 … 4.

const X2F = patchFrame(-0.6, 3.6, -0.6, 3.6, 44); // 201 × 201
const X2_END = carry(LENS_G, UNIT_DOTS, 1);
const X2_CELL: XY = [1, 1];
const X2_IN = X2_END.map((p, i) => (Math.floor(p[0]) === X2_CELL[0] && Math.floor(p[1]) === X2_CELL[1] ? i : -1)).filter((i) => i >= 0);

export function SameLightMoreWall() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const [counted, setCounted] = useSeed("counted", false);
  const run = useLensRun(1300, 26);
  const tick = usePlay(420);
  const t = !ran ? 0 : run.running ? run.t : 1;
  const pts = carry(LENS_G, UNIT_DOTS, t);
  const area = areaAt(LENS_G, t);
  const shown = !counted ? 0 : tick.running ? tick.k : X2_IN.length;
  const fire = () => {
    if (run.running) return;
    setRan(true);
    setCounted(false);
    run.run();
  };
  const count = () => {
    if (!ran || run.running || tick.running) return;
    setCounted(true);
    tick.play(X2_IN.length, () => pass("আলো একই, জায়গা তিনগুণ: ঘরে তিন ভাগের এক."));
  };
  const landed = ran && !run.running;
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <PatchWall f={X2F} dark label="রাতের দেয়ালে stencil এর এক ঘরের আলো, 12 টা ফোঁটা; G পার হয়ে হেলানো ছোপ, ফোঁটা ছড়িয়ে গেছে; মাঝের পুরা ঘরটা tap করলে তার ফোঁটা গোনা হয়" className="max-w-[12.5rem]">
          <path d={pathD(X2F, carry(LENS_G, cellPoly([0, 0]), t))} fill={GLOW} fillOpacity={0.42 / area} stroke={LAMP} strokeWidth={1.3} strokeLinejoin="round" className="pointer-events-none" />
          <Dots f={X2F} pts={pts} r={2.3} />
          {landed && (
            <g
              role="button"
              tabIndex={0}
              aria-label="মাঝের পুরা ঘরটা: tap করে ফোঁটা গুনুন"
              className="cursor-pointer"
              onClick={count}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  count();
                }
              }}
            >
              <rect x={X2F.sx(1)} y={X2F.sy(2)} width={X2F.u} height={X2F.u} fill="white" fillOpacity={0.01} stroke={counted ? "#60a5fa" : "#e2e8f0"} strokeWidth={counted ? 2.2 : 1.6} strokeDasharray={counted ? undefined : "4 3"} className={counted ? undefined : POP} />
            </g>
          )}
          {X2_IN.slice(0, shown).map((i, n) => (
            <g key={i} className={POP}>
              <circle cx={X2F.sx(X2_END[i][0])} cy={X2F.sy(X2_END[i][1])} r={7} fill="none" stroke="#60a5fa" strokeWidth={1.6} />
              <text x={X2F.sx(X2_END[i][0]) + 8} y={X2F.sy(X2_END[i][1]) - 5} fontSize={10} fontWeight={800} fontFamily={MONO} fill="#bfdbfe">
                {n + 1}
              </text>
            </g>
          ))}
        </PatchWall>
        <div className="flex w-24 shrink-0 flex-col gap-2 text-center text-xs text-muted">
          <div>
            stencil এর এক ঘরে
            <div className="font-mono text-lg font-bold text-foreground">12</div>
          </div>
          <div>
            জায়গা
            <div className="font-mono text-lg font-bold text-foreground">{`${fmt(+area.toFixed(1))} ঘর`}</div>
          </div>
          <div>
            মাঝের ঘরে
            <div key={shown} className={`font-mono text-lg font-bold text-cat-blue ${POP}`}>
              {counted ? shown : "?"}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={run.running} onClick={fire}>
          {ran ? "আবার আলো ফেলুন" : "আলো ফেলুন"}
        </button>
      </div>
      <Task done={counted && !tick.running}>আলো ফেলুন. তারপর ছোপের মাঝের পুরা ঘরটা tap করে ফোঁটা গুনুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict, then H and the আয়না. Guess: brighter · same · fainter (Nasib).
//     H crowds the 12 dots into ¼ ঘর; the other three quarters come up as
//     dashed copies: a whole ঘর would hold 48. M flips the ঘর: 12 in one ঘর.

const X3F = patchFrame(-1.3, 1.3, -0.35, 1.3, 72); // 203 × 135
const X3_GUESS = [
  { name: "আরো উজ্জ্বল", who: "" },
  { name: "একই", who: "" },
  { name: "আরো ফিকে", who: "নাসিব" },
];
const X3_LENSES = [
  { name: "H", cols: LENS_H },
  { name: "আয়না M", cols: MIRROR },
];

export function ShrinkBrightens() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [which, setWhich] = useSeed<0 | 1>("which", 0);
  const [done, setDone] = useSeed<[boolean, boolean]>("done", [false, false]);
  const run = useLensRun(1200, 24);
  const [miss, setMiss] = useState(0);
  const go = (i: 0 | 1) => {
    if (guess === null || run.running) return;
    setWhich(i);
    run.run(() => {
      const nd: [boolean, boolean] = i === 0 ? [true, done[1]] : [done[0], true];
      setDone(nd);
      if (i === 0 && guess !== 0) setMiss((m) => m + 1);
      if (nd[0] && nd[1]) pass("ছোট করলে ঘন. উল্টালে একই.");
    });
  };
  const cols = X3_LENSES[which].cols;
  const t = run.running ? run.t : done[which] ? 1 : 0;
  const pts = carry(cols, UNIT_DOTS, t);
  const area = areaAt(cols, t);
  const settled = done[which] && !run.running;
  return (
    <>
      <PatchWall f={X3F} dark label="রাতের দেয়ালে এক ঘরের আলো, 12 ফোঁটা; H দিয়ে গেলে চার ভাগের এক ঘরে গাদাগাদি, পাশে আরো তিনটা এমন টুকরা দাগ দিয়ে দেখানো, মিলে এক ঘর; আয়না দিয়ে গেলে ঘরটা বাঁ দিকে উল্টে যায়, ফোঁটা একই" className="max-w-[13rem]">
        <path d={pathD(X3F, cellPoly([0, 0]))} fill="none" stroke="#e2e8f0" strokeOpacity={0.35} strokeWidth={1} strokeDasharray="3 3" className="pointer-events-none" />
        <path d={pathD(X3F, carry(cols, cellPoly([0, 0]), t))} fill={GLOW} fillOpacity={Math.min(0.85, 0.42 / Math.max(area, 0.05))} stroke={LAMP} strokeWidth={1.3} className="pointer-events-none" />
        {settled &&
          which === 0 &&
          ([
            [0.5, 0],
            [0, 0.5],
            [0.5, 0.5],
          ] as XY[]).map((d, i) => (
            <g key={i} className={FADE}>
              <path d={pathD(X3F, shift(carry(LENS_H, cellPoly([0, 0]), 1), d))} fill="none" stroke={GLOW} strokeOpacity={0.6} strokeWidth={1} strokeDasharray="3 2" />
              <Dots f={X3F} pts={shift(carry(LENS_H, UNIT_DOTS, 1), d)} r={1.4} className="opacity-35" />
            </g>
          ))}
        <Dots f={X3F} pts={pts} r={which === 0 ? 1.7 : 2.2} />
        {settled && (
          <WallText x={which === 0 ? X3F.sx(0.5) : X3F.sx(-0.5)} y={X3F.sy(1.12)} size={11} tone="#fde68a">
            {which === 0 ? "এক ঘরে 48" : "এক ঘরে 12"}
          </WallText>
        )}
      </PatchWall>
      {guess === null ? (
        <div className="mt-2 grid gap-1.5">
          <div className="text-center text-sm text-muted">H দিয়ে গেলে এক ঘরের আলো কেমন হবে?</div>
          {X3_GUESS.map((g, i) => (
            <Choice key={g.name} n={i} look="idle" disabled={false} onClick={() => setGuess(i)}>
              <span className="text-sm">
                <b>{g.name}</b>
                {g.who && <span className="text-muted"> · {g.who}</span>}
              </span>
            </Choice>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {X3_GUESS.map((g, i) => (
              <Choice key={g.name} n={i} look={predictLook(i, guess, done[0], 0)} disabled onClick={() => {}}>
                <span className="text-xs leading-tight">{g.name}</span>
              </Choice>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            {X3_LENSES.map((l, i) => (
              <button key={l.name} type="button" className={tab(which === i && (run.running || done[i]))} disabled={run.running || (i === 1 && !done[0])} onClick={() => go(i as 0 | 1)}>
                {l.name} দিয়ে চালান
              </button>
            ))}
          </div>
          <div className="mt-1.5 min-h-5 text-center text-sm text-muted">
            {settled && which === 0 && (
              <span className={FADE}>
                ¼ ঘরে 12 টা ফোঁটা. পুরা এক ঘরে হতো <b className="font-mono text-foreground">48</b>: চারগুণ উজ্জ্বল.
              </span>
            )}
            {settled && which === 1 && (
              <span className={FADE}>
                এক ঘরেই 12 টা. শুধু উল্টো দিকে. <b>উজ্জ্বল একই.</b>
              </span>
            )}
          </div>
        </>
      )}
      {guess !== null && guess !== 0 && done[0] && which === 0 && !run.running && <Nope key={miss}>{guess === 2 ? "আলো কমে নাই. 12 টা ফোঁটাই আছে, শুধু গাদাগাদি করে." : "ফোঁটা একই, কিন্তু জায়গা ¼. প্রতি ঘরে চারগুণ."}</Nope>}
      <Task done={done[0] && done[1] && !run.running}>আগে guess দিন. তারপর H আর আয়না, দুইটা দিয়েই এক ঘরের আলো চালান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Probability is light. A heap of 100 dots (a model's whole 1, each dot
//     one ভাগ), thick in the middle. Three lenses: পাশে দুইগুণ (2), G (3), H
//     (¼). Each run carries every dot; the bar is the middle's thickness
//     (16 per ঘর at the start, ÷ |det|); the total stays 100.

const X4F = patchFrame(-6, 6, -5.2, 5.2, 16); // 208 × 182
const X4_HEAP: XY[] = (() => {
  let s = 11;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const out: XY[] = [];
  for (let i = 0; i < 100; i += 1) {
    const r = Math.sqrt(-2 * Math.log(1 - rnd()));
    const a = 2 * Math.PI * rnd();
    out.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return out;
})();
const X4_LENSES = [
  { name: "পাশে দুইগুণ", cols: WIDE },
  { name: "G", cols: LENS_G },
  { name: "H", cols: LENS_H },
];
/** the heap's thickness in its middle, dots per ঘর: 100 / 2π ≈ 16 */
const X4_MID = 16;

export function ProbabilityIsLight() {
  const pass = useGate();
  const [which, setWhich] = useSeed<number | null>("which", null);
  const [tried, setTried] = useSeed<boolean[]>("tried", [false, false, false]);
  const run = useLensRun(1300, 26);
  const go = (i: number) => {
    if (run.running) return;
    setWhich(i);
    run.run(() => {
      const nt = tried.map((v, j) => v || j === i);
      setTried(nt);
      if (nt.every(Boolean)) pass("জায়গা বাড়লে ঘনত্ব কমে, মোট একই.");
    });
  };
  const cols = which === null ? I2 : X4_LENSES[which].cols;
  const t = which === null ? 0 : run.running ? run.t : 1;
  const pts = carry(cols, X4_HEAP, t);
  const mid = X4_MID / Math.max(areaAt(cols, t), 0.05);
  const bar = Math.min(1, mid / 64);
  return (
    <>
      <div className="flex items-end justify-center gap-3">
        <PatchWall f={X4F} dark label="একশটা আলোর ফোঁটার একটা স্তূপ, মাঝখানে ঘন; lens দিয়ে চালালে ছড়ায় বা গুটায়; পাশে মাঝের ঘনত্বের দাগ, নিচে মোট একশ" className="max-w-[13rem]">
          <Dots f={X4F} pts={pts} r={1.5} />
        </PatchWall>
        <div className="flex w-20 shrink-0 flex-col items-center gap-1 text-center text-xs text-muted">
          <span>মাঝের ঘরে</span>
          <span key={Math.round(mid)} className="font-mono text-base font-bold text-foreground">
            {mid >= 10 ? Math.round(mid) : mid.toFixed(1)}
          </span>
          <svg viewBox="0 0 30 100" className="h-24 w-7" aria-hidden="true">
            <rect x={6} y={0} width={18} height={100} rx={3} fill="none" stroke="currentColor" strokeOpacity={0.3} />
            <rect x={6} y={100 - bar * 100} width={18} height={bar * 100} rx={3} fill={LAMP} />
            <path d={`M2 ${100 - (X4_MID / 64) * 100}H28`} stroke="currentColor" strokeOpacity={0.6} strokeDasharray="2 2" />
          </svg>
          <span>ফোঁটা</span>
        </div>
      </div>
      <div className="mt-1 text-center text-sm">
        মোট: <b className="font-mono">100</b> ফোঁটা, মানে পুরা <b className="font-mono">1</b>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {X4_LENSES.map((l, i) => (
          <button key={l.name} type="button" className={tab(which === i)} disabled={run.running} onClick={() => go(i)}>
            {l.name}
            {tried[i] && <span className="ml-1 font-mono text-xs opacity-70">{`|det| ${fmt(Math.abs(det(l.cols)))}`}</span>}
          </button>
        ))}
      </div>
      <Task done={tried.every(Boolean) && !run.running}>তিনটা lens দিয়েই স্তূপটা চালান. মাঝের ঘনত্ব আর মোট, দুইটাই দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Your turn. The lenses on the ledge: Rina's G and পুঁচকে (8.4), the
//     লাইট ভাই's L, 7.3's W, and Nasib's pocket lens [[1, 1], [1, 1]]. Up to
//     three in the machine. "চালান" throws the heart: every dot carried, the
//     gate's 2 dots per ঘর behind it. It shows only with 3 or more per ঘর:
//     |det| ≤ 4. The biggest that shows: |det| = 4.

const X5F = patchFrame(-2.2, 7, -1.2, 6.8, 22); // 218 × 192
const X5_LENSES = [
  { name: "G", note: "রিনার", cols: LENS_G },
  { name: "পুঁচকে", note: "রিনার", cols: TINY },
  { name: "L", note: "লাইট ভাইয়ের", cols: LENS_L },
  { name: "W", note: "7.3 এর", cols: LENS_W },
  { name: "নাসিবের", note: "পকেটের", cols: CRUSH },
];
const X5_GATE = gateDots(-2.2, 7, -1.2, 6.8);

const stackOf = (ids: readonly number[]) => ids.reduce<Cols>((m, i) => after(X5_LENSES[i].cols, m), I2);

export function YourHeart() {
  const pass = useGate();
  const [stack, setStack] = useSeed<number[]>("stack", []);
  const [thrown, setThrown] = useSeed<number[] | null>("thrown", null);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1300, 26);
  const cols = thrown ? stackOf(thrown) : I2;
  const t = thrown === null ? 1 : run.running ? run.t : 1;
  const D = Math.abs(det(cols));
  const dens = D < 1e-9 ? Infinity : 12 / D;
  const settled = thrown !== null && !run.running;
  const verdict = !settled ? null : D < 1e-9 ? "flat" : D > 4 + 1e-9 ? "faint" : D < 4 - 1e-9 ? "small" : "right";
  const add = (i: number) => {
    if (run.running || stack.length >= 3) return;
    setStack([...stack, i]);
    setThrown(null);
  };
  const drop = (j: number) => {
    if (run.running) return;
    setStack(stack.filter((_, n) => n !== j));
    setThrown(null);
  };
  const fire = () => {
    if (run.running || !stack.length) return;
    const s = [...stack];
    setThrown(s);
    const Dn = Math.abs(det(stackOf(s)));
    run.run(() => {
      if (Math.abs(Dn - 4) < 1e-9) pass("4 গুণ বড়, ঘরে 3 ফোঁটা. এর বেশি না.");
      else setMiss((m) => m + 1);
    });
  };
  const heart = carry(cols, HEART0, t);
  const dots = carry(cols, HEART_DOTS, t);
  const dAt = 12 / Math.max(areaAt(cols, t), 0.02);
  return (
    <>
      <PatchWall f={X5F} dark label="রাতের দেয়াল, গেটের বাতির হালকা সাদা ফোঁটা সবখানে, ঘরে দুইটা করে; lens এর stack দিয়ে heart ফেললে তার আলোর ফোঁটা; ঘরে তিনটার কম হলে heart গেটের আলোয় মিশে যায়" className="max-w-[13rem]">
        <Dots f={X5F} pts={X5_GATE} tone="gate" r={2} />
        {thrown !== null && (
          <>
            <HeartGlow f={X5F} poly={heart} d={verdict === "faint" ? dAt * 0.4 : dAt} />
            <Dots f={X5F} pts={dots} r={verdict === "faint" ? 1.5 : 2} className={verdict === "faint" ? "opacity-50" : undefined} />
          </>
        )}
        {thrown === null && (
          <text x={X5F.sx(2.4)} y={X5F.sy(2.6)} textAnchor="middle" fontSize={11} fill="#94a3b8">
            lens বেছে চালান
          </text>
        )}
      </PatchWall>
      <div className="mt-1.5 flex min-h-9 flex-wrap items-center justify-center gap-1.5 text-sm">
        <span className="text-muted">যন্ত্রে:</span>
        {stack.length === 0 && <span className="text-muted">খালি</span>}
        {stack.map((i, j) => (
          <button key={`${i}-${j}`} type="button" aria-label={`${X5_LENSES[i].name} বের করুন`} className={`${tab(true)} ${POP}`} onClick={() => drop(j)}>
            {X5_LENSES[i].name} <span aria-hidden="true">×</span>
          </button>
        ))}
        {settled && (
          <span className="font-mono text-xs text-muted">{D < 1e-9 ? "|det| 0" : `|det| ${fmt(+D.toFixed(2))} · ঘরে ${fmt(+dens.toFixed(2))}`}</span>
        )}
      </div>
      <div className="mt-1 flex flex-nowrap justify-center gap-1">
        {X5_LENSES.map((l, i) => (
          <button key={l.name} type="button" aria-label={`${l.name}, ${l.note}: যন্ত্রে দিন`} disabled={run.running || stack.length >= 3} onClick={() => add(i)} className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-border px-1.5 py-0.5 transition-colors hover:border-cat-blue/60 disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none">
            <G_Lens cols={l.cols} small />
            <span className="text-xs">{l.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={run.running || !stack.length} onClick={fire}>
          heart ফেলুন
        </button>
      </div>
      {verdict === "flat" && <Nope key={miss}>Heart চ্যাপ্টা হয়ে একটা দাগ. নাসিবের lens এর det 0, জায়গাই নাই.</Nope>}
      {verdict === "faint" && <Nope key={miss}>{`ঘরে ${fmt(+dens.toFixed(2))} ফোঁটা, 3 এর কম. Heart গেটের আলোয় মিশে গেলো. |det| কমান.`}</Nope>}
      {verdict === "small" && <Nope key={miss}>{`দেখা যায়, ঘরে ${fmt(+dens.toFixed(2))} ফোঁটা. কিন্তু আরো বড় করা যায়. ঘরে 3 হলেও চলে.`}</Nope>}
      <Task done={verdict === "right"}>Lens বেছে যন্ত্রে দিন, তিনটা পর্যন্ত. Heart যত বড় পারেন, কিন্তু ঘরে অন্তত 3 ফোঁটা থাকতে হবে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Try it. A lens that doubles one way, [[2, 0], [0, 1]]. Three wide
//     hearts: 12 per ঘর (the dots doubled), 6 (right: the same dots), 3 (half
//     of them gone). A pick runs the lens on the wall and counts the dots
//     against the stencil's.

const X6F = patchFrame(-0.4, 2.6, -0.3, 1.4, 64); // 208 × 125
const X6_HEART = mapPts(WIDE, HEART0);
const X6_TRUE = mapPts(WIDE, HEART_DOTS);
const X6_OPTS: { d: number; pts: XY[] }[] = [
  { d: 12, pts: [...X6_TRUE, ...shift(X6_TRUE, [0.25, 0])].filter((p) => inPoly(p, X6_HEART)) },
  { d: 6, pts: X6_TRUE },
  { d: 3, pts: X6_TRUE.filter((_, i) => i % 2 === 0) },
];
const X6_RIGHT = 1;
const X6_OF = [2, 0, 1]; // the order the three pictures are shown in
const X6_NOPE: Record<number, string> = {
  0: "এই ছবিতে ফোঁটা stencil এর চেয়ে বেশি. বাড়তি আলো আসলো কোথা থেকে? বাতি তো একটাই.",
  2: "এই ছবিতে ফোঁটা stencil এর চেয়ে কম. বাকি আলো গেলো কোথায়? কাঁচ আলো খায় না.",
};
const X6_SF = patchFrame(-0.2, 2.35, -0.15, 1.2, 30); // small picture: 93 × 57

export function TryDim() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1100, 22);
  const choose = (i: number) => {
    if (run.running) return;
    setPick(i);
    run.run(() => (i === X6_RIGHT ? pass("জায়গা দুইগুণ, ঘরে অর্ধেক ফোঁটা.") : setMiss((m) => m + 1)));
  };
  const t = pick === null ? 0 : run.running ? run.t : 1;
  const settled = pick !== null && !run.running;
  const n = HEART_DOTS.length;
  return (
    <>
      <PatchWall f={X6F} dark label="রাতের দেয়ালে stencil এর heart, lens দিয়ে পাশে দুইগুণ চওড়া হয়; ফোঁটা গোনা হয়" className="max-w-[13rem]" pin={false}>
        <HeartGlow f={X6F} poly={carry(WIDE, HEART0, t)} d={12 / areaAt(WIDE, t)} />
        <Dots f={X6F} pts={carry(WIDE, HEART_DOTS, t)} r={2.2} />
        {settled && pick !== X6_RIGHT && <path d={pathD(X6F, X6_HEART)} fill="none" stroke={PINK} strokeWidth={1.4} strokeDasharray="4 3" className="pointer-events-none" />}
      </PatchWall>
      <div className="mt-1 text-center text-sm text-muted">
        {settled ? (
          <span className={FADE}>
            stencil এ <b className="font-mono text-foreground">{n}</b> ফোঁটা. দেয়ালে <b className="font-mono text-foreground">{n}</b>. আপনার ছবিতে{" "}
            <b className={`font-mono ${pick === X6_RIGHT ? "text-accent-text" : "text-danger"}`}>{X6_OPTS[pick].pts.length}</b>.
          </span>
        ) : (
          <span>lens: পাশে দুইগুণ, উপরে একই.</span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X6_OF.map((o, i) => (
          <Choice key={o} n={i} look={settled && pick === o ? (o === X6_RIGHT ? "right" : "wrong") : "idle"} disabled={run.running || (settled && pick === X6_RIGHT)} onClick={() => choose(o)}>
            <span className="flex flex-col items-center gap-0.5">
              <svg viewBox={`0 0 ${X6_SF.W} ${X6_SF.H}`} className="h-auto w-full max-w-[5.5rem] rounded bg-[#1e293b]" aria-label={`চওড়া heart, ঘরে ${X6_OPTS[o].d} ফোঁটা`}>
                <HeartGlow f={X6_SF} poly={X6_HEART} d={X6_OPTS[o].d} />
                <Dots f={X6_SF} pts={X6_OPTS[o].pts} r={1.3} />
              </svg>
              <span className="text-xs">ঘরে {X6_OPTS[o].d}</span>
            </span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X6_RIGHT && <Nope key={miss}>{X6_NOPE[pick]}</Nope>}
      <Task done={settled && pick === X6_RIGHT}>এই lens heart টাকে কোন ছবি বানাবে? বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The bet opened. G + L on the machine: the heart 12 × the room, every
//     dot carried, 1 per ঘর, lost among the gate's 2. Each card opened lays
//     its claim over it in pink, with what it would need.

const X7F = X1F;
const X7_GATE = gateDots(-3.1, 6.6, -0.7, 6.5);
const X7_TRUE = mapPts(LG, HEART_DOTS);
const X7_SAY = [
  "ঘরে 12 হলে পুরা heart এ 12 গুণ আলো লাগতো. বাতি তো একটাই.",
  "ঘরে 6 হলেও মোট আলো 6 গুণ. এত আলো আসবে কোথা থেকে?",
  "ঘরে 1. মোট ফোঁটা stencil এর সমান. এটাই হলো.",
  "144 ভাগের এক হলে পুরা heart মিলে এক ফোঁটাও হয় না. বাকি আলো গেলো কোথায়?",
];

export function GlowOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const run = useLensRun(1400, 28);
  const [ran, setRan] = useSeed("ran", false);
  const t = !ran ? 0 : run.running ? run.t : 1;
  const fire = () => {
    if (run.running || ran) return;
    setRan(true);
    run.run();
  };
  const tap = (i: number) => {
    if (!ran || run.running) return;
    setCur(i);
    const next = open.includes(i) ? open : [...open, i];
    setOpen(next);
    if (next.length === X1_CARDS.length && open.length < X1_CARDS.length) pass("12 গুণ জায়গা, 12 ভাগের এক আলো.");
  };
  const claim = cur === null ? [] : claimDots(X1_CARDS[cur].d);
  return (
    <>
      <PatchWall f={X7F} dark label="রাতের দেয়াল জুড়ে বড় heart, G আর L দিয়ে; ঘরে একটা করে ফোঁটা, গেটের বাতির দুইটা ফোঁটার মাঝে হারিয়ে যায়; বাজির card খুললে তার দাবি গোলাপি ফোঁটায়" className="max-w-[16rem]" pin={false}>
        <Dots f={X7F} pts={X7_GATE} tone="gate" r={1.9} />
        <HeartGlow f={X7F} poly={carry(LG, HEART0, t)} d={ran ? 12 / areaAt(LG, t) : 12} />
        <Dots f={X7F} pts={carry(LG, HEART_DOTS, t)} r={1.9} />
        {cur !== null && cur !== 2 && <Dots key={cur} f={X7F} pts={claim} r={1.7} tone="pink" className={FADE} />}
        {cur === 2 &&
          X7_TRUE.map((p, i) => (
            <circle key={i} cx={X7F.sx(p[0])} cy={X7F.sy(p[1])} r={6} fill="none" stroke="#60a5fa" strokeWidth={1.4} className={POP} />
          ))}
      </PatchWall>
      <div className="mt-1 min-h-10 text-center text-sm text-muted">
        {cur !== null ? (
          <span key={cur} className={FADE}>
            {X7_SAY[cur]}
          </span>
        ) : ran ? (
          <span>ঘরে 1 ফোঁটা. গেটের আলো ঘরে 2.</span>
        ) : null}
      </div>
      {!ran ? (
        <div className="mt-1 flex justify-center">
          <button type="button" className={primaryBtn} onClick={fire}>
            G আর L দিয়ে heart ফেলুন
          </button>
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          {X1_CARDS.map((c, i) => (
            <Choice key={c.who} n={i} look={open.includes(i) ? (i === 2 ? "right" : "wrong") : "idle"} disabled={run.running} onClick={() => tap(i)}>
              <span className="flex flex-col text-sm leading-tight">
                <b>{c.name}</b>
                <span className="text-xs text-muted">{c.who}</span>
              </span>
            </Choice>
          ))}
        </div>
      )}
      <Task done={open.length === X1_CARDS.length}>G আর L দিয়ে heart ফেলুন. তারপর বাজির চারটা card একটা একটা করে খুলুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Five things to carry forward (§10), tap to reveal; each opens with its
//     small picture.

const FT_THINGS: [string, string][] = [
  ["det মানে জায়গা কতগুণ", "এক ঘর lens পার হয়ে যত ঘর, det তত. সব ছবি একই গুণে বাড়ে."],
  ["2 × 2 এ ad − bc", "হেলানো ছোপের জায়গা: বাক্স থেকে কোনা বাদ. আমিনের কায়দা."],
  ["Minus মানে উল্টানো", "সংখ্যাটা বলে জায়গা কতগুণ. চিহ্ন বলে ছবি উল্টালো কিনা."],
  ["শূন্যই আসল কথা", "Column এক লাইনে, জায়গা চ্যাপ্টা, আর ফেরানো যায় না. সব একই ঘটনা."],
  ["det(AB) = det(A) det(B)", "Lens পরপর চালালে গুণ গুণ হয়. মাঝে একটা শূন্য থাকলে সব শূন্য."],
];

/** one small picture per thing, drawn on a white card */
function FT_Pic({ i }: { i: number }) {
  const sq = "M6 34h14v-14h-14Z";
  return (
    <svg viewBox="0 0 64 40" className={`h-8 w-13 shrink-0 rounded bg-white ${POP}`} aria-hidden="true">
      {i === 0 && (
        <g>
          <path d={sq} fill={GLOW} stroke={LAMP} />
          <path d="M26 27h6l-2 -2M32 27l-2 2" stroke={INK} strokeWidth={1} fill="none" />
          <path d="M36 36l14 -7l7 -14l-14 7Z" fill={PK.paint} fillOpacity={0.8} stroke={PK.paintDark} />
        </g>
      )}
      {i === 1 && (
        <g>
          <rect x={10} y={6} width={44} height={30} fill="none" stroke={INK} strokeWidth={1} />
          <path d="M10 36L43 26L54 6L21 16Z" fill={PK.paint} fillOpacity={0.8} stroke={PK.paintDark} />
          <path d="M10 36L43 26L54 36ZM54 6L21 16L10 6Z" fill="#94a3b8" fillOpacity={0.35} />
        </g>
      )}
      {i === 2 && (
        <g>
          <path d="M14 34V10h10M14 20h7" stroke={INK} strokeWidth={2.4} fill="none" />
          <path d="M32 4V38" stroke="#94a3b8" strokeDasharray="2 2" />
          <path d="M50 34V10h-10M50 20h-7" stroke={PK.bad} strokeWidth={2.4} fill="none" />
        </g>
      )}
      {i === 3 && (
        <g>
          <path d={sq} fill={GLOW} stroke={LAMP} />
          <path d="M26 27h6l-2 -2M32 27l-2 2" stroke={INK} strokeWidth={1} fill="none" />
          <path d="M36 34L58 12" stroke={LAMP} strokeWidth={2.6} strokeLinecap="round" />
          <text x={50} y={33} fontSize={9} fontWeight={800} fontFamily={MONO} fill={INK}>
            0
          </text>
        </g>
      )}
      {i === 4 && (
        <text x={32} y={25} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK}>
          3 × 4 = 12
        </text>
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
    if (next.length === FT_THINGS.length) pass("Article 8 এর পাঁচটা কথা.");
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
      <Task done={open.length === FT_THINGS.length}>পাঁচটা card একটা একটা করে খুলুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage bits for the story scenes: the night উঠান. The wall (light-kit's
// StageWall) carries the week's paintings: 8.1's ফুল, 8.3's two মেহেদি
// hands, 8.5's door piece; the heart of light is thrown on it.

const SW: [number, number] = [8, 30]; // the stage wall's top-left
const PJ: [number, number] = [206, 150]; // the machine's feet
const onStage = (p: XY): [number, number] => [SW[0] + STAGE_WALL_F.sx(p[0]), SW[1] + STAGE_WALL_F.sy(p[1])];

/** the ফুল through G, drawn small (0.42 of true size) at `at` on the stage wall */
const small = (pts: readonly XY[], s: number, at: XY): XY[] => pts.map((p) => [p[0] * s + at[0], p[1] * s + at[1]]);
const ST_FLOWER = small(mapPts(LENS_G, FLOWER_OUTLINE), 0.42, [-2.6, -1.3]);
const ST_DOOR = small(mapPts(LENS_G, FLOWER_OUTLINE), 0.36, [5.5, 3.1]);
/** a hand, palm up, fingers along +y, thumb out to +x (8.3's মেহেদি hand, simplified), about 1 × 1.3 */
const HAND: XY[] = [
  [0, 0],
  [0.8, 0],
  [0.9, 0.5],
  [1.35, 0.75],
  [1.3, 0.9],
  [0.85, 0.75],
  [0.85, 1.3],
  [0.7, 1.3],
  [0.65, 0.85],
  [0.55, 1.4],
  [0.4, 1.4],
  [0.4, 0.85],
  [0.3, 1.3],
  [0.15, 1.3],
  [0.15, 0.85],
  [0.05, 1.1],
  [-0.08, 1.05],
  [0, 0.5],
];
const ST_HAND_BIG = small(
  HAND.map(([x, y]) => [-x, y] as XY),
  1,
  [3.55, 0.1],
);
const ST_HAND_RINA = small(HAND, 0.55, [3.9, 0.3]);
/** the heart of light at `at`, scale s, in wall units */
const stHeart = (s: number, at: XY) => small(HEART0, s, at);

/** The week's paintings on the stage wall (inside <StageWall>). */
function St_Paintings() {
  const f = STAGE_WALL_F;
  return (
    <g className="pointer-events-none">
      {/* night on the lime */}
      <rect x={0} y={0} width={f.W} height={f.H} rx={6} fill="#0f172a" opacity={0.42} />
      <path d={pathD(f, ST_FLOWER)} fill={PK.paint} fillOpacity={0.9} stroke={PK.paintDark} strokeWidth={0.6} />
      <path d={pathD(f, ST_DOOR)} fill={PK.paint} fillOpacity={0.9} stroke={PK.paintDark} strokeWidth={0.6} />
      <path d={pathD(f, ST_HAND_BIG)} fill="#9a3412" fillOpacity={0.85} stroke="#7c2d12" strokeWidth={0.5} />
      <path d={pathD(f, ST_HAND_RINA)} fill="#c2410c" fillOpacity={0.85} stroke="#7c2d12" strokeWidth={0.5} />
    </g>
  );
}

/** A heart of light on the stage wall: `d` sets how bright (dots per ঘর, 12 = the stencil's). */
function St_Heart({ s, at, d }: { s: number; at: XY; d: number }) {
  const f = STAGE_WALL_F;
  const poly = stHeart(s, at);
  const dots = latticeIn(poly, Math.min(d, 12) * 1.2);
  const o = Math.min(0.75, (d / 12) * 0.62);
  return (
    <g className={`pointer-events-none ${FADE}`}>
      <path d={pathD(f, poly)} fill={GLOW} fillOpacity={o} stroke={GLOW} strokeOpacity={0.45 + o * 0.5} strokeWidth={0.9} />
      {dots.map((p, i) => (
        <circle key={i} cx={f.sx(p[0])} cy={f.sy(p[1])} r={1} fill="white" opacity={0.5 + o * 0.6} />
      ))}
    </g>
  );
}

/** The gate: two pillars, a string of মরিচ বাতি and the red-yellow cloth; `on` lights the bulbs. */
function St_Gate({ x, on = true }: { x: number; on?: boolean }) {
  const bulbs = Array.from({ length: 9 }, (_, i) => i);
  return (
    <g className="pointer-events-none">
      <rect x={x - 26} y={66} width={7} height={84} fill="#a8a29e" />
      <rect x={x + 19} y={66} width={7} height={84} fill="#a8a29e" />
      <path d={`M${x - 24} 70Q${x} 84 ${x + 24} 70`} fill="none" stroke="#dc2626" strokeWidth={3} />
      <path d={`M${x - 24} 74Q${x} 90 ${x + 24} 74`} fill="none" stroke="#facc15" strokeWidth={2.4} />
      {bulbs.map((i) => {
        const u = i / 8;
        const bx = x - 24 + 48 * u;
        const by = 66 + 10 * (1 - (2 * u - 1) ** 2);
        const c = ["#f87171", "#facc15", "#4ade80", "#60a5fa"][i % 4];
        return (
          <g key={i}>
            {on && <circle cx={bx} cy={by} r={4} fill={c} opacity={0.3} />}
            <circle cx={bx} cy={by} r={1.4} fill={on ? c : "#57534e"} />
          </g>
        );
      })}
    </g>
  );
}

/** A name under someone's feet, light on the night ground. */
function Name({ x, y = 161, children }: { x: number; y?: number; children: ReactNode }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={NIGHT_INK} className="pointer-events-none">
      {children}
    </text>
  );
}

/** A cast member at night: Person, and the name in light ink. */
function NightPerson({ who, x, y = 150, name, facing = 1, arm = "down", walking = false, mood }: { who: Who; x: number; y?: number; name: string; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point"; walking?: boolean; mood?: "plain" | "happy" | "puzzled" | "smug" | "sad" | "shout" }) {
  return (
    <>
      <Person who={who} x={x} y={y} facing={facing} arm={arm} walking={walking} mood={mood} />
      <g style={{ transform: `translate(${x}px, 0px)` }} className="transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
        <Name x={0} y={y + 11}>
          {name}
        </Name>
      </g>
    </>
  );
}

/** আপা in her শাড়ি: the cast's আপা with a red আঁচল over the shoulder and head. */
function St_Apa({ x, y = 150, facing = 1, arm = "down", walking = false }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "hold" | "point"; walking?: boolean }) {
  return (
    <>
      <Person who="apa" x={x} y={y} facing={facing} arm={arm} walking={walking} />
      <g style={{ transform: `translate(${x}px, ${y}px)` }} className="pointer-events-none transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
        <path d="M-10 -40h20l3 26h-26Z" fill="#dc2626" />
        <path d="M-10 -52q0 -13 10 -13t10 13l-2 14h-3l1 -12q-6 -5 -12 0l1 12h-3Z" fill="#b91c1c" />
        <path d="M-10 -34l20 12" stroke="#facc15" strokeWidth={1.4} />
        <Name x={0} y={11}>
          আপা
        </Name>
      </g>
    </>
  );
}

/** দুলাভাই: মামার look in a cream পাঞ্জাবি, his name under his feet. */
function St_Dulabhai({ x, y = 150, facing = 1, walking = false }: { x: number; y?: number; facing?: 1 | -1; walking?: boolean }) {
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} walking={walking} />
      <g style={{ transform: `translate(${x}px, ${y}px)` }} className="pointer-events-none transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
        <rect x={-9} y={-40} width={18} height={26} rx={4} fill="#fef3c7" />
        <path d="M0 -40v10" stroke="#d97706" strokeWidth={1} />
        <Name x={0} y={11}>
          দুলাভাই
        </Name>
      </g>
    </>
  );
}

/** the car with its headlights, front at (x, y); `lights` throws the beams ahead (to the left) */
function St_Car({ x, y, lights = true }: { x: number; y: number; lights?: boolean }) {
  return (
    <g className="pointer-events-none">
      {lights && <path d={`M${x} ${y - 16}L${x - 70} ${y - 30}L${x - 70} ${y + 2}Z`} fill={GLOW} opacity={0.25} />}
      <path d={`M${x} ${y - 8}v-12q0 -4 4 -5l14 -2l12 -14h36l12 14h6q4 1 4 5v14Z`} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
      <path d={`M${x + 22} ${y - 27}l10 -11h32l9 11Z`} fill="#334155" />
      <circle cx={x + 2} cy={y - 16} r={2.4} fill={lights ? "#fef9c3" : "#94a3b8"} />
      <circle cx={x + 22} cy={y - 5} r={6} fill="#1f2937" />
      <circle cx={x + 72} cy={y - 5} r={6} fill="#1f2937" />
      {Array.from({ length: 6 }, (_, i) => (
        <circle key={i} cx={x + 12 + i * 13} cy={y - 21} r={2} fill={["#f97316", "#facc15", "#ef4444"][i % 3]} />
      ))}
    </g>
  );
}

/** the boundary wall's ledge on the right, with Fahim sitting on it */
function St_Ledge({ x }: { x: number }) {
  return <rect x={x - 18} y={122} width={36} height={28} fill="#78716c" stroke="#57534e" strokeWidth={1} className="pointer-events-none" />;
}

// ---------------------------------------------------------------------------
// 1a · ফিরানির রাত. The wall with the week's paintings; the gate lit; Fahim
//      on the ledge by the gate, looking down the road. The machine throws
//      last night's small heart. The লাইট ভাই holds up G and L: the heart as
//      big as the wall. Som: ফিকে. The লাইট ভাই: বাতি বদলাই নাই.

export function NightGate({}: Story) {
  const s = useScene(4, [600, 1600, 2400, 2400, 2600]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="ফিরানির রাত; দেয়ালে সপ্তাহের রং করা ফুল, মেহেদি হাত, দরজার উপরের ফুল; গেটে মরিচ বাতি; ফাহিম গেটের পাশের দেয়ালে বসে রাস্তা দেখছে; যন্ত্র ছোট একটা heart ফেললো; লাইট ভাই দুইটা lens তুলে ধরলেন, দেয়াল জুড়ে heart হবে; সোম বললো এত বড় করলে আলো ফিকে হবে; লাইট ভাই বললেন বাতি বদলাই নাই, আলো যা ছিলো তাই থাকবো">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Paintings />
          {k >= 1 && <St_Heart s={0.9} at={[-2.3, 3.4]} d={12} />}
        </StageWall>
        {k >= 1 && <StageBeam from={[lx, ly]} to={onStage([-1.8, 3.9])} w={6} />}
        <Projector x={PJ[0]} y={PJ[1]} on={k >= 1} lens="good" />
        <St_Gate x={262} />
        <St_Ledge x={300} />
        <NightPerson who="fahim" x={302} y={120} name="" facing={1} />
        <LightBhai x={156} y={150} facing={1} arm={k >= 2 ? "hold" : "down"} nameTone={NIGHT_INK} />
        {k >= 2 && (
          <g className={POP}>
            <circle cx={168} cy={104} r={5} fill="#a7f3d0" stroke={INK} strokeWidth={0.8} />
            <circle cx={176} cy={106} r={5} fill="#bae6fd" stroke={INK} strokeWidth={0.8} />
          </g>
        )}
        <NightPerson who="som" x={234} name="সোম" facing={-1} arm={k >= 3 ? "point" : "down"} />
        {k === 2 && <Bubble x={156} y={84} side="mid" lines={["দেয়াল জুড়া", "heart দিমু."]} />}
        {k === 3 && <Bubble x={232} y={84} side="left" lines={["এত বড় করলে", "আলো ফিকে হবে."]} />}
        {k >= 4 && <Bubble x={156} y={84} side="mid" lines={["বাতি বদলাই নাই.", "আলো যা ছিলো, তাই থাকবো."]} />}
        <Name x={302} y={131}>
          ফাহিম
        </Name>
      </Stage>
    </StoryFrame>
  );
}

// 1b · Three more answers: Nasib (অর্ধেক), Samin (12 ভাগের এক: জায়গা 12
//      গুণ), Karim (144: 12 লম্বায়, 12 চওড়ায়).

const TG_SAY: { who: Who; name: string; x: number; lines: string[]; side: "left" | "mid" | "right" }[] = [
  { who: "nasib", name: "নাসিব", x: 70, lines: ["একটু তো কমবেই.", "ধরেন অর্ধেক."], side: "right" },
  { who: "samin", name: "সামিন", x: 150, lines: ["জায়গা 12 গুণ.", "আলো 12 ভাগের এক."], side: "mid" },
  { who: "karim", name: "করিম", x: 230, lines: ["লম্বায় 12, চওড়ায় 12.", "144 ভাগের এক."], side: "left" },
];

export function ThreeGuesses({}: Story) {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="উঠানে তিনজন; নাসিব বললো একটু তো কমবেই, ধরেন অর্ধেক; সামিন বললো জায়গা 12 গুণ, আলো 12 ভাগের এক; করিম বললো লম্বায় 12, চওড়ায় 12, 144 ভাগের এক">
        <St_Gate x={300} />
        {TG_SAY.map((p, i) => (
          <NightPerson key={p.who} who={p.who} name={p.name} x={p.x} facing={i < 1 ? 1 : -1} arm={k === i + 1 ? "point" : "down"} />
        ))}
        {k >= 1 && <Bubble key={k} x={TG_SAY[k - 1].x} y={84} side={TG_SAY[k - 1].side} lines={TG_SAY[k - 1].lines} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Nasib picks H off the ledge: a small lens lets in less light.

export function NasibSmall({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="নাসিব কার্নিশ থেকে H lens টা তুললো; বললো বড় করলে ফিকে হলে, ছোট lens এ আলোও তো কম ঢুকবে">
        <rect x={150} y={118} width={120} height={32} fill="#78716c" stroke="#57534e" />
        <circle cx={230} cy={113} r={5} fill="#bae6fd" stroke={INK} strokeWidth={0.8} />
        <NightPerson who="nasib" x={k >= 1 ? 190 : 120} name="নাসিব" facing={1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} />
        {k >= 1 && (
          <g className={POP}>
            <circle cx={202} cy={106} r={5} fill="#e0f2fe" stroke={INK} strokeWidth={0.8} />
            <text x={202} y={109} textAnchor="middle" fontSize={6} fontWeight={800} fontFamily={MONO} fill={INK}>
              H
            </text>
          </g>
        )}
        <NightPerson who="som" x={70} name="সোম" facing={1} />
        {k >= 2 && <Bubble x={190} y={84} side="mid" lines={["ছোট lens এ", "আলোও তো কম ঢুকবে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Samin looks up from his phone: the picture-making AI on it does this
//      same sum.

export function SaminPhone({}: Story) {
  const s = useScene(2, [600, 1800, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="সামিন ফোন থেকে চোখ তুললো; ফোনে AI দিয়ে বানানো একটা ছবি; বললো, ছবি বানানোর AI ও এই হিসাবটা করে, না করলে ভুল ছবি বানায়">
        <NightPerson who="samin" x={130} name="সামিন" facing={1} arm="hold" />
        <g>
          <rect x={138} y={96} width={12} height={20} rx={2} fill="#0f172a" stroke="#475569" />
          <rect x={139.5} y={98} width={9} height={15} fill={k >= 1 ? "#fbbf24" : "#1e293b"} className="transition-colors duration-500 motion-reduce:transition-none" />
          {k >= 1 && <path d="M141 110q3 -8 6 0" fill="#ec4899" className={FADE} />}
        </g>
        <NightPerson who="fahim" x={210} name="ফাহিম" facing={-1} />
        {k >= 2 && <Bubble x={130} y={84} side="right" lines={["ছবি বানানোর AI ও", "এই হিসাবটা করে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · The lenses on the ledge: Rina puts down her two (G, the পুঁচকে), the
//      লাইট ভাই his L and W; Nasib, last, his pocket lens.

export function LensLedge({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const glass = (x: number, c: string) => <circle cx={x} cy={113} r={5} fill={c} stroke={INK} strokeWidth={0.8} className={POP} />;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="গেটের পাশের কার্নিশে lens সাজানো হলো; রিনা রাখলো তার দুইটা, G আর পুঁচকে; লাইট ভাই রাখলেন L আর W; শেষে নাসিব পকেট থেকে তার চার এক এর lens টা বের করে রাখলো">
        <rect x={90} y={118} width={150} height={32} fill="#78716c" stroke="#57534e" />
        <St_Gate x={290} />
        <NightPerson who="rina" x={60} name="রিনা" facing={1} arm={k === 1 ? "hold" : "down"} />
        <LightBhai x={176} y={150} facing={-1} arm={k === 2 ? "hold" : "down"} nameTone={NIGHT_INK} />
        <NightPerson who="nasib" x={236} name="নাসিব" facing={-1} arm={k >= 3 ? "hold" : "down"} />
        {k >= 1 && glass(104, "#a7f3d0")}
        {k >= 1 && glass(118, "#fef9c3")}
        {k >= 2 && glass(142, "#bae6fd")}
        {k >= 2 && glass(156, "#ddd6fe")}
        {k >= 3 && glass(214, "#d6d3d1")}
      </Stage>
    </StoryFrame>
  );
}

// 7a · The car's headlights on the road. The লাইট ভাই puts G and L in and
//      throws the heart: as big as the wall, and faint under the gate's
//      bulbs. Fahim on the ledge: গাড়ি.

export function Headlights({}: Story) {
  const s = useScene(3, [600, 1800, 2000, 2200]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="দূরে রাস্তায় গাড়ির হেডলাইট; লাইট ভাই G আর L দুইটা lens দিয়ে heart ফেললেন, দেয়াল জুড়ে বড়, কিন্তু আবছা; ফাহিম কার্নিশ থেকে বললো, গাড়ি">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Paintings />
          {k >= 2 && <St_Heart s={3.4} at={[-1.9, 0.3]} d={1} />}
        </StageWall>
        {k >= 2 && <StageBeam from={[lx, ly]} to={onStage([-0.2, 2])} w={24} />}
        <Projector x={PJ[0]} y={PJ[1]} on={k >= 2} lens="good" />
        <LightBhai x={156} y={150} facing={1} arm={k >= 2 ? "point" : "down"} nameTone={NIGHT_INK} />
        <St_Gate x={262} />
        {k >= 1 && (
          <g className={FADE}>
            <circle cx={316} cy={112} r={2.4} fill="#fef9c3" />
            <circle cx={310} cy={113} r={2.4} fill="#fef9c3" />
            <path d="M320 100L296 112L320 124Z" fill={GLOW} opacity={0.18} />
          </g>
        )}
        <St_Ledge x={300} />
        <NightPerson who="fahim" x={302} y={120} name="" facing={1} arm={k >= 3 ? "point" : "down"} />
        <Name x={302} y={131}>
          ফাহিম
        </Name>
        {k >= 3 && <Bubble x={302} y={56} side="left" lines={["গাড়ি!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 8a · ফিরানি. The car at the gate. আপা gets out, দুলাভাই behind. She walks
//      to the wall: the ফুল, the মেহেদি hands, the door piece, the heart
//      (now through L alone, bright over the gate's bulbs). She puts her palm
//      on the painted hand. It is three times her hand, and the other way.

export function Firani({}: Story) {
  const s = useScene(4, [600, 1800, 2000, 2200, 2400]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  const apaX = k >= 3 ? 112 : k >= 2 ? 190 : 250;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="ফিরানি; গেটে গাড়ি থামলো; আপা নামলেন, পেছনে দুলাভাই; আপা দেয়ালের দিকে হেঁটে গেলেন; রং করা ফুল, দুইটা মেহেদি হাত, দরজার উপরের ফুল, আলোর heart; আপা তার হাতটা রং করা হাতের উপর রাখলেন; দেয়ালের হাত তিনগুণ বড়, আর উল্টা">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Paintings />
          <St_Heart s={2} at={[-2.6, 2.1]} d={3} />
        </StageWall>
        <StageBeam from={[lx, ly]} to={onStage([-1.6, 3.2])} w={12} />
        <Projector x={PJ[0]} y={PJ[1]} on lens="good" />
        <St_Gate x={290} />
        <g style={{ transform: `translateX(${k >= 1 ? 0 : 60}px)` }} className="transition-transform duration-[1400ms] ease-out motion-reduce:transition-none">
          <St_Car x={250} y={150} lights={k < 1} />
        </g>
        {k >= 1 && <St_Apa x={apaX} facing={-1} walking={k === 2 || k === 3} arm={k >= 4 ? "point" : "down"} />}
        {k >= 1 && <St_Dulabhai x={k >= 3 ? 158 : k >= 2 ? 236 : 280} facing={-1} walking={k === 2 || k === 3} />}
      </Stage>
    </StoryFrame>
  );
}

// 8b · The bridge to Article 9: late at night, the machine still on. Samin
//      asks the লাইট ভাই: can the painting be thrown back into Rina's small
//      stencil? He: some lenses yes, some never.

export function LateNight({}: Story) {
  const s = useScene(3, [600, 2200, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="অনেক রাত; যন্ত্র তখনো চলছে; সামিন লাইট ভাইকে জিজ্ঞেস করলো, দেয়ালের ছবিটা উল্টা দিকে চালিয়ে রিনার ছোট stencil টা আবার পাওয়া যায়; লাইট ভাই বললেন, কোনো lens এ পারি, কোনোটায় জিন্দেগিতেও না">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Paintings />
        </StageWall>
        <Projector x={PJ[0]} y={PJ[1]} on={false} lens="good" />
        <NightPerson who="samin" x={236} name="সামিন" facing={-1} arm={k === 1 ? "point" : "down"} />
        <LightBhai x={176} y={150} facing={1} nameTone={NIGHT_INK} />
        {k === 1 && <Bubble x={236} y={84} side="left" lines={["উল্টা চালালে রিনার", "ছোট stencil ফেরত আসে?"]} />}
        {k === 2 && <Bubble x={176} y={84} side="mid" lines={["কোনো lens এ পারি."]} />}
        {k >= 3 && <Bubble x={176} y={84} side="mid" lines={["কোনোটায়", "জিন্দেগিতেও না."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The stake: the gate's bulbs throw their own faint light on the wall.
//      A bright heart shows over it; a faint one of the same size is lost.
//      The big one? Stopped at "?".

const S1_SAY = ["গেটে মরিচ বাতি. তার আলোও দেয়ালে পড়ে, ঘরে দুই ফোঁটা.", "উজ্জ্বল heart সেই আলোর উপরেও চোখে পড়ে.", "ফিকে heart গেটের আলোয় মিশে যায়. গাড়ি থেকে নেমে আপা দেখবেনই না.", "দেয়াল জুড়ে বড় heart টা কোনটা হবে?"];
const S1F = patchFrame(-1.5, 6.5, -0.4, 4.4, 24); // 208 × 131
const S1_GATE = gateDots(-1.5, 6.5, -0.4, 4.4);
const S1_H = small(HEART0, 2.6, [1.1, 0.8]);

export function GlowStake() {
  const s = useScene(3, [600, 2200, 2400, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S1_SAY, k)}>
      <PatchWall f={S1F} dark pin={false} label="রাতের দেয়ালে গেটের বাতির হালকা ফোঁটা; একটা উজ্জ্বল heart চোখে পড়ে; একই মাপের আবছা heart মিশে যায়; বড় heart এর দাগ, প্রশ্নবোধক" className="max-w-[14rem]">
        <Dots f={S1F} pts={S1_GATE} tone="gate" r={2} />
        {k === 1 && (
          <g className={FADE}>
            <HeartGlow f={S1F} poly={S1_H} d={12} />
            <Dots f={S1F} pts={latticeIn(S1_H, 12)} r={1.6} />
          </g>
        )}
        {k === 2 && (
          <g className={FADE}>
            <HeartGlow f={S1F} poly={S1_H} d={0.4} />
            <Dots f={S1F} pts={latticeIn(S1_H, 1)} r={1.4} className="opacity-50" />
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <HeartGlow f={S1F} poly={small(HEART0, 4, [0.5, 0])} d={0} ghost />
            <text x={S1F.sx(5.5)} y={S1F.sy(3.4)} fontSize={24} fontWeight={800} fill="#60a5fa" className={POP}>
              ?
            </text>
          </g>
        )}
      </PatchWall>
    </Scene>
  );
}

// 2½a · Cut and slide, with the dots riding along: G's patch cut on the chalk
//       lines, the pieces slid into three whole ঘর (8.1), each ঘর holding 4.
//       4 + 4 + 4 = 12: not one dot lost.

const S2F = patchFrame(-0.4, 3.4, -0.4, 3.4, 40); // 168 × 168
const S2_PLAN = planPatch(LENS_G);
const S2_DOTS = X2_END.map((p) => {
  const i = S2_PLAN.pieces.findIndex((q) => q.cell[0] === Math.floor(p[0]) && q.cell[1] === Math.floor(p[1]));
  return { p, piece: i };
});
const S2_SAY = ["G এর ছোপ, 12 টা ফোঁটা নিয়ে.", "চকের দাগে কাটি. প্রতিটা টুকরা তার ফোঁটা নিয়ে যায়.", "8.1 এর মতো টুকরা সরিয়ে তিনটা পুরা ঘর.", "প্রতি ঘরে 4. তিন ঘরে 12. একটা ফোঁটাও হারায় নাই."];

export function SlideThree() {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const counts = S2_PLAN.targets.map((_, ti) => S2_DOTS.filter((d) => S2_PLAN.pieces[d.piece]?.target === ti).length);
  return (
    <Scene scene={s} caption={say(S2_SAY, k)}>
      <PatchWall f={S2F} dark label="G এর ছোপ চকের দাগে কাটা, টুকরাগুলো সরে তিনটা পুরা ঘর; প্রতি ঘরে চারটা ফোঁটা, মোট বারো" className="max-w-[11rem]">
        {S2_PLAN.pieces.map((q, i) => {
          const slid = k >= 2;
          const dx = slid ? q.shift[0] * S2F.u : 0;
          const dy = slid ? -q.shift[1] * S2F.u : 0;
          return (
            <g key={i} style={{ transform: `translate(${dx}px, ${dy}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
              <path d={pathD(S2F, q.poly)} fill={GLOW} fillOpacity={0.16} stroke={k >= 1 ? "#e2e8f0" : LAMP} strokeOpacity={k >= 1 ? 0.6 : 0.8} strokeWidth={1} strokeDasharray={k >= 1 ? "3 2" : undefined} />
              <Dots f={S2F} pts={S2_DOTS.filter((d) => d.piece === i).map((d) => d.p)} r={2.2} />
            </g>
          );
        })}
        {k >= 3 &&
          S2_PLAN.targets.map((c, ti) => (
            <g key={ti} className={POP}>
              <rect x={S2F.sx(c[0])} y={S2F.sy(c[1] + 1)} width={S2F.u} height={S2F.u} fill="none" stroke="#60a5fa" strokeWidth={1.6} />
              <text x={S2F.sx(c[0] + 0.5)} y={S2F.sy(c[1] + 1) - 3} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill="#bfdbfe">
                {counts[ti]}
              </text>
            </g>
          ))}
      </PatchWall>
    </Scene>
  );
}

// 2½b · Som's torch: held close, a small bright circle; stepped back, a big
//       faint one. The same 12 dots.

const S2B_SAY = ["সোমের টর্চ, দেয়ালের একদম কাছে. ছোট গোল আলো, খুব উজ্জ্বল.", "সোম দুই পা পিছালো. গোলটা বড় হলো.", "ফোঁটা সেই 12 টাই. ছড়িয়েছে বেশি জায়গায়, তাই প্রতি ঘরে কম."];
const S2B_UNIT: XY[] = Array.from({ length: 12 }, (_, i) => {
  const r = Math.sqrt((i + 0.5) / 12);
  const a = i * 2.39996;
  return [r * Math.cos(a), r * Math.sin(a)];
});

export function TorchFig() {
  const s = useScene(2, [600, 2000, 2400]);
  const k = s.k;
  const [R, tx] = useTween(k >= 1 ? [44, 196] : [18, 150], 900);
  const o = Math.min(0.8, (18 / R) ** 2 * 0.7);
  return (
    <Scene scene={s} caption={say(S2B_SAY, k)}>
      <svg viewBox="0 0 240 110" role="img" aria-label="সোমের টর্চ দেয়ালের কাছে, ছোট উজ্জ্বল গোল; পিছালে বড় আবছা গোল; ফোঁটা সেই বারোটাই" className="mx-auto block h-auto w-full max-w-[16rem] rounded-lg bg-[#1e293b]">
        <circle cx={70} cy={55} r={R} fill={GLOW} opacity={o} />
        {S2B_UNIT.map((p, i) => (
          <g key={i}>
            <circle cx={70 + p[0] * R * 0.9} cy={55 + p[1] * R * 0.9} r={3.4} fill={GLOW} opacity={0.3} />
            <circle cx={70 + p[0] * R * 0.9} cy={55 + p[1] * R * 0.9} r={1.6} fill="white" />
          </g>
        ))}
        {/* the torch, pointing left at the wall */}
        <g transform={`translate(${tx} 55)`}>
          <path d={`M0 0L${-(tx - 70) + R} ${-R * 0.95}L${-(tx - 70) + R} ${R * 0.95}Z`} fill={GLOW} opacity={0.08} />
          <rect x={0} y={-5} width={24} height={10} rx={2} fill="#475569" />
          <rect x={-5} y={-7} width={6} height={14} rx={1} fill="#94a3b8" />
          <text x={12} y={20} textAnchor="middle" fontSize={8} fontWeight={700} fill={NIGHT_INK}>
            সোম
          </text>
        </g>
        {k >= 2 && (
          <text x={70} y={106} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily={MONO} fill="#fde68a" className={POP}>
            12
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 3½ · The rule, three lenses side by side: one ঘর of the wall under G (4),
//      H (48), M (12); then "÷ |det|" lands: 12 ÷ 3, 12 ÷ ¼, 12 ÷ 1.

const S3_SAY = ["G: জায়গা 3 গুণ. ঘরে 12 ÷ 3 = 4.", "H: জায়গা ¼. ঘরে 12 ÷ ¼ = 48.", "আয়না: det −1. ঘরে 12 ÷ 1 = 12. ফোঁটা তো minus হয় না.", "দেয়ালের ঘনত্ব = stencil এর ঘনত্ব ÷ |det|."];
const S3_PANELS = [
  { name: "G", n: 4, sum: "12 ÷ 3" },
  { name: "H", n: 48, sum: "12 ÷ ¼" },
  { name: "M", n: 12, sum: "12 ÷ |−1|" },
];

export function DivideFig() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S3_SAY, k)}>
      <svg viewBox="0 0 270 116" role="img" aria-label="তিনটা lens এর পরে দেয়ালের এক ঘর: G তে চার ফোঁটা, H এ আটচল্লিশ, আয়নায় বারো; ঘনত্ব ভাগ det এর মান" className="mx-auto block h-auto w-full max-w-[17rem]">
        {S3_PANELS.map((p, i) => {
          const x0 = 10 + i * 90;
          const side = Math.ceil(Math.sqrt(p.n));
          const rows = Math.ceil(p.n / side);
          const shown = k >= i;
          return (
            <g key={p.name} opacity={shown ? 1 : 0.25} className="transition-opacity duration-500 motion-reduce:transition-none">
              <rect x={x0} y={4} width={70} height={70} rx={4} fill="#1e293b" />
              {shown &&
                Array.from({ length: p.n }, (_, j) => {
                  const cx = x0 + ((j % side) + 0.5) * (70 / side);
                  const cy = 4 + (Math.floor(j / side) + 0.5) * (70 / rows);
                  return <circle key={j} cx={cx} cy={cy} r={p.n > 20 ? 1.6 : 2.4} fill="white" stroke={LAMP} strokeWidth={0.6} className={FADE} />;
                })}
              <text x={x0 + 35} y={88} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} className="fill-foreground">
                {p.name}
              </text>
              {shown && (
                <text x={x0 + 35} y={104} textAnchor="middle" fontSize={10} fontFamily={MONO} className={`fill-muted ${FADE}`}>
                  {`${p.sum} = ${p.n}`}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// 4½ · A flow: a model starts from a plain round heap and reshapes it lens
//      by lens; after each, the middle's thickness is divided by that lens's
//      |det|. The total stays 1.

const S4_SAY = ["Model শুরু করে একটা সোজা, গোল স্তূপ দিয়ে. মাঝে ঘরে 16.", "এক lens: পাশে দুইগুণ. |det| 2, মাঝে 16 ÷ 2 = 8.", "আরেকটা: হেলানো. |det| 1, মাঝে সেই 8.", "আরেকটা: G. |det| 3, মাঝে 8 ÷ 3, প্রায় 2.7. মোট তবু 1."];
const S4F = patchFrame(-5, 7, -3.4, 5, 15); // 196 × 142
const SHEAR: Cols = [
  [1, 0],
  [1, 1],
];
const S4_CHAIN: Cols[] = [I2, WIDE, after(SHEAR, WIDE), after(LENS_G, after(SHEAR, WIDE))];
const S4_MID = ["16", "8", "8", "2.7"];

export function FlowFig() {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;
  const [a, b, c, d] = useTween(S4_CHAIN[k].flat(), 900);
  const cols: Cols = [
    [a, b],
    [c, d],
  ];
  return (
    <Scene scene={s} caption={say(S4_SAY, k)}>
      <div className="flex items-center justify-center gap-2">
        <PatchWall f={S4F} dark label="একশ ফোঁটার গোল স্তূপ; পরপর তিনটা lens এ চওড়া হয়, হেলে যায়, আরো ছড়ায়; প্রতিবার মাঝের ঘনত্ব det দিয়ে ভাগ হয়" className="max-w-[12rem]">
          <Dots f={S4F} pts={mapPts(cols, X4_HEAP)} r={1.3} />
        </PatchWall>
        <div className="flex w-16 shrink-0 flex-col items-center text-center text-xs text-muted">
          মাঝে
          <span key={k} className={`font-mono text-lg font-bold text-foreground ${POP}`}>
            {S4_MID[k]}
          </span>
          মোট <span className="font-mono font-bold text-foreground">1</span>
        </div>
      </div>
    </Scene>
  );
}

// 4½b · Side quest: the bell curve. Side view: a narrow tall bell; twice as
//       wide, half as tall (same area); in two directions, √det Σ is that
//       spread's room, and the height is divided by it.

const S4B_SAY = ["পাশ থেকে দেখা একটা bell curve. নিচের জায়গা মোট 1.", "দুইগুণ চওড়া হলে উঁচু অর্ধেক. জায়গা সেই 1.", "অনেক দিকে ছড়ালে ছড়ানোর মাপ Σ. তার জায়গা √det Σ, তাই সামনে 1/√det Σ."];
const bell = (sig: number) => {
  let d = "";
  for (let i = 0; i <= 60; i += 1) {
    const x = -3.2 + (i / 60) * 6.4;
    const y = Math.exp(-(x * x) / (2 * sig * sig)) / sig;
    d += `${i ? "L" : "M"}${(120 + x * 30).toFixed(1)} ${(92 - y * 70).toFixed(1)}`;
  }
  return d;
};

export function BellFig() {
  const s = useScene(2, [600, 2000, 2600]);
  const k = s.k;
  const [sig] = useTween([k >= 1 ? 1.6 : 0.8], 900);
  return (
    <Scene scene={s} caption={say(S4B_SAY, k)}>
      <svg viewBox="0 0 240 110" role="img" aria-label="সরু উঁচু bell curve; দুইগুণ চওড়া হলে উচ্চতা অর্ধেক, নিচের জায়গা একই; সামনে এক ভাগ root det Sigma" className="mx-auto block h-auto w-full max-w-[16rem]">
        <path d="M20 92H220" className="stroke-muted" strokeWidth={1} />
        <path d={bell(0.8)} fill="none" className="stroke-muted" strokeWidth={1} strokeDasharray="3 2" opacity={k >= 1 ? 0.8 : 0} />
        <path d={`${bell(sig)}L${120 + 3.2 * 30} 92L${120 - 3.2 * 30} 92Z`} fill={LAMP} fillOpacity={0.3} stroke={LAMP} strokeWidth={1.6} />
        {k >= 2 && (
          <text x={200} y={30} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} className={`fill-foreground ${POP}`}>
            1/√det Σ
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 8½ · The recap: last night's small heart, 12 per ঘর; through L, 4 × the
//      room, 3 per ঘর, over the gate's 2; the dots the same.

const S8_SAY = ["কালকের ছোট heart. ঘরে 12 ফোঁটা.", "L দিয়ে: জায়গা 4 গুণ. ঘরে 12 ÷ 4 = 3.", "গেটের আলো ঘরে 2. Heart চোখে পড়ে.", "জায়গা det গুণ হলে, ঘনত্ব det ভাগ. ফোঁটা সেই কয়টাই."];
const S8F = patchFrame(-1.6, 3.2, -0.5, 2.6, 36); // 189 × 128
const S8_GATE = gateDots(-1.6, 3.2, -0.5, 2.6);

export function RecapGlow({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const [t] = useTween([k >= 1 ? 1 : 0], 900);
  return (
    <Scene scene={s} caption={say(S8_SAY, k)}>
      <PatchWall f={S8F} dark pin={false} label="ছোট heart ঘরে বারো ফোঁটা; L দিয়ে চারগুণ জায়গা, ঘরে তিন ফোঁটা; গেটের আলো ঘরে দুই; heart চোখে পড়ে" className="max-w-[12rem]">
        {k >= 2 && <Dots f={S8F} pts={S8_GATE} tone="gate" r={2} />}
        <HeartGlow f={S8F} poly={carry(LENS_L, HEART0, t)} d={12 / areaAt(LENS_L, t)} />
        <Dots f={S8F} pts={carry(LENS_L, HEART_DOTS, t)} r={2} />
      </PatchWall>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  GlowBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 0, sealed: true }, karim: { bet: 3, sealed: true } },
  SameLightMoreWall: { start: {}, ran: { ran: true }, counted: { ran: true, counted: true } },
  ShrinkBrightens: { start: {}, guessed: { guess: 2 }, h: { guess: 2, done: [true, false] }, m: { guess: 0, which: 1, done: [true, true] } },
  ProbabilityIsLight: { start: {}, wide: { which: 0, tried: [true, false, false] }, g: { which: 1, tried: [true, true, false] }, h: { which: 2, tried: [true, true, true] } },
  YourHeart: {
    start: {},
    stacked: { stack: [0, 2] },
    faint: { stack: [0, 2], thrown: [0, 2] },
    small: { stack: [0], thrown: [0] },
    flat: { stack: [4], thrown: [4] },
    right: { stack: [2], thrown: [2] },
  },
  TryDim: { start: {}, more: { pick: 0 }, less: { pick: 2 }, right: { pick: 1 } },
  GlowOpen: { start: {}, ran: { ran: true }, same: { ran: true, open: [0], cur: 0 }, right: { ran: true, open: [0, 1, 2], cur: 2 }, done: { ran: true, open: [0, 1, 2, 3], cur: 3 } },
  FiveThings: { start: {}, two: { open: [0, 1] }, all: { open: [0, 1, 2, 3, 4] } },
  NightGate: { rest: { k: 0 }, heart: { k: 1 }, lenses: { k: 2 }, som: { k: 3 }, done: {} },
  ThreeGuesses: { nasib: { k: 1 }, samin: { k: 2 }, done: {} },
  NasibSmall: { rest: { k: 0 }, done: {} },
  SaminPhone: { rest: { k: 0 }, done: {} },
  LensLedge: { rina: { k: 1 }, done: {} },
  Headlights: { car: { k: 1 }, heart: { k: 2 }, done: {} },
  Firani: { car: { k: 0 }, out: { k: 1 }, walk: { k: 2 }, wall: { k: 3 }, done: {} },
  LateNight: { ask: { k: 1 }, one: { k: 2 }, done: {} },
  GlowStake: { rest: { k: 0 }, bright: { k: 1 }, faint: { k: 2 }, done: {} },
  SlideThree: { rest: { k: 0 }, cut: { k: 1 }, slid: { k: 2 }, done: {} },
  TorchFig: { close: { k: 0 }, done: {} },
  DivideFig: { g: { k: 0 }, done: {} },
  FlowFig: { rest: { k: 0 }, done: {} },
  BellFig: { rest: { k: 0 }, done: {} },
  RecapGlow: { rest: { k: 0 }, done: {} },
};
