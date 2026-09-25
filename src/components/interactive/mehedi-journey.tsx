"use client";

import { useId, useState, type ReactNode } from "react";

import { Tup } from "@/components/journey/box";
import { Bubble, Chest, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Stepper, pill, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, clamp, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { LensCard, LightBhai, Projector, WALL_SLOTS, WallBed, apply, byCols, det, partway, pathOf, projectorLens, useLensRun, type Cols, type Move } from "./light-kit";

// Screens for "Math for AI 8.3 — মেহেদির হাত, minus জায়গা", told as a Journey
// in the author's Bangla-English. The plan is 08_journey_specs.md, block 8.3.
// It pays the second half of 7.6's SquareQuestion: জায়গা minus হলে তার মানে কী?
//
// Afternoon, the week after বিদায়. Rina's second piece for the wall is আপার
// মেহেদি হাতের ছাপ: a cereal-box stencil, one chalk ঘর of light with আপার
// ডান হাত cut from the cardboard in the middle (so the wall shows a lit ঘর with
// the hand dark inside it, drawn in মেহেদি colour). The লাইট ভাই offers 7.3's Z
// to throw it bigger; Samin's formula (8.2) says −3. Karim, with a পলিথিন of
// four কৌটা: minus মানে জায়গা কমে, তিন কৌটা ফেরত দিয়ে আসি.
//
// Nine screens. 1 seals the bet (MinusBet). 2 the আয়না M = [[−1, 0], [0, 1]]
// (7.4's): same ঘর, the right hand is now a left hand (MirrorLens). 3 the
// book's g = (3, 2), l = (1, 2): which is on the right, before and after M
// (LeftOfRight). 4 predict: swap I's columns, plus or minus? (SwapColumns).
// 5 Z on the wall: cut and slide to 3 ঘর, then turn the picture fingers-up:
// a left hand (ZOnTheWall). 6 Nasib's [[−1, 0], [0, −1]]: a half turn fits
// it, no turn fits the mirror's (TurnIsNotFlip). 7 Your turn: four lenses,
// উল্টায় কি না + কতগুণ (YourSign)। 8 Try it: which picture does [[0, 2],
// [2, 0]] throw (TryWhichHand). 9 the bet opened (BetOpen).
//
// After the screens: the story scenes (MehediAfternoon, AynaLens, BackToZ,
// NasibTwoMinus, HandsFacing, BulbFuses) and the watch-only figures
// (MinusStake, PageFlip, ArrowsCross, TradePlaces, SpinVsMirror, MirrorTwice,
// TwoHandsMirror), each numbered after its screen.
//
// Wall pieces come from light-kit.tsx (read-only). The patch/count pieces the
// spec puts in a shared patch-kit.tsx are local here (H_…), since 8.1 was built
// in parallel; the coordinator may fold them into the kit.
//
// The hand: a right palm seen from the front, fingers up (along e₂), the thumb
// sticking out to the right (along e₁). A lens with det < 0 turns it into a
// left hand: turn the picture until the fingers point up and the thumb is on
// the left.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const CHALK = "#64748b";
const GLOW = "#fde047";
const LAMP = "#f59e0b";
const HENNA = "#9a3412";
const HENNA_DARK = "#7c2d12";
const HENNA_LINE = "#fdba74";
const OK = "#0d9488";
const BAD = "#e11d48";
const BLUE = "#2563eb";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

const sgn = (v: number) => (v < 0 ? `−${-v}` : `${v}`);

// ---------------------------------------------------------------------------
// The lenses, by columns (light-kit's Cols).

const I2: Cols = [
  [1, 0],
  [0, 1],
];
/** 7.4's আয়না M = [[−1, 0], [0, 1]]: det −1 */
const M: Cols = [
  [-1, 0],
  [0, 1],
];
/** 7.3's yellow spare Z = [[−1, 1], [2, 1]]: det −3 */
const Z: Cols = [
  [-1, 2],
  [1, 1],
];
/** Nasib's two minus signs [[−1, 0], [0, −1]]: det +1, a half turn */
const N: Cols = [
  [-1, 0],
  [0, -1],
];
/** I with its columns swapped, [[0, 1], [1, 0]]: det −1 */
const P: Cols = [
  [0, 1],
  [1, 0],
];

const ID_MOVE: Move = (p) => p;
/** a turn by `deg` anticlockwise about the nail */
const rot =
  (deg: number): Move =>
  (p) => {
    const a = (deg * Math.PI) / 180;
    return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  };
/** first m1, then m2 */
const then =
  (m1: Move, m2: Move): Move =>
  (p) =>
    m2(m1(p));
const shift =
  (d: XY): Move =>
  (p) => [p[0] + d[0], p[1] + d[1]];

// ---------------------------------------------------------------------------
// The stencil: one ঘর [0, 1]², আপার ডান হাত inside it (palm side, thumb right).

const SQ: XY[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];
const HAND: XY[] = [
  [0.25, 0.05],
  [0.2, 0.3],
  [0.17, 0.5],
  // little finger
  [0.14, 0.64],
  [0.16, 0.69],
  [0.21, 0.7],
  [0.25, 0.66],
  [0.28, 0.54],
  // ring finger
  [0.3, 0.56],
  [0.3, 0.79],
  [0.33, 0.83],
  [0.38, 0.83],
  [0.41, 0.79],
  [0.42, 0.56],
  // middle finger
  [0.44, 0.57],
  [0.44, 0.87],
  [0.47, 0.91],
  [0.52, 0.91],
  [0.55, 0.87],
  [0.56, 0.56],
  // index finger
  [0.58, 0.55],
  [0.58, 0.8],
  [0.61, 0.84],
  [0.66, 0.84],
  [0.69, 0.8],
  [0.69, 0.5],
  // the thumb, out to the right and up
  [0.73, 0.43],
  [0.83, 0.58],
  [0.88, 0.61],
  [0.93, 0.57],
  [0.92, 0.5],
  [0.81, 0.3],
  [0.73, 0.17],
  [0.68, 0.05],
];
/** the মেহেদি flower on the palm: a ring and a dot */
const RING: XY[] = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * 2 * Math.PI;
  return [0.45 + 0.1 * Math.cos(a), 0.3 + 0.1 * Math.sin(a)];
});
const DOT: XY[] = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * 2 * Math.PI;
  return [0.45 + 0.035 * Math.cos(a), 0.3 + 0.035 * Math.sin(a)];
});

/**
 * The stencil's light on the wall, carried by `move`: the lit ঘর (a patch once
 * a lens bends it) with the hand dark in the middle. `ghost` draws it as a
 * dashed outline in `tone` (a guess, a turned copy, where it was).
 */
function H_Print({ f, move = ID_MOVE, ghost = false, tone = BLUE, hand = true, soft = false }: { f: Frame; move?: Move; ghost?: boolean; tone?: string; hand?: boolean; soft?: boolean }) {
  const tile = pathOf(f, move, SQ, true);
  const palm = pathOf(f, move, HAND, true);
  if (ghost)
    return (
      <g className="pointer-events-none" opacity={soft ? 0.5 : 1}>
        <path d={tile} fill="none" stroke={tone} strokeWidth={1.4} strokeDasharray="4 3" />
        {hand && <path d={palm} fill={tone} fillOpacity={0.12} stroke={tone} strokeWidth={1.5} strokeDasharray="3 2" strokeLinejoin="round" />}
      </g>
    );
  return (
    <g className="pointer-events-none" opacity={soft ? 0.45 : 1}>
      <path d={tile} fill={GLOW} fillOpacity={0.3} stroke={GLOW} strokeOpacity={0.5} strokeWidth={4} strokeLinejoin="round" />
      <path d={tile} fill={GLOW} fillOpacity={0.6} stroke={LAMP} strokeWidth={1.2} strokeLinejoin="round" />
      {hand && (
        <>
          <path d={palm} fill={HENNA} stroke={HENNA_DARK} strokeWidth={0.8} strokeLinejoin="round" />
          <path d={pathOf(f, move, RING, true)} fill="none" stroke={HENNA_LINE} strokeWidth={Math.max(0.6, f.u * 0.02)} />
          <path d={pathOf(f, move, DOT, true)} fill={HENNA_LINE} />
        </>
      )}
    </g>
  );
}

/** a small picture of what a lens (or a move) does to the stencil; `span` fixes the scale so sizes compare */
function H_Icon({ cols, move, size = 44, span }: { cols?: Cols; move?: Move; size?: number; span?: number }) {
  const m = move ?? byCols(cols ?? I2);
  const c = SQ.map(m);
  const xs = c.map((p) => p[0]);
  const ys = c.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const S = span ?? Math.max(x1 - x0, y1 - y0);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const f = makeFrame(cx - S / 2, cx + S / 2, cy - S / 2, cy + S / 2, (size - 6) / S, 3);
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect x={0} y={0} width={f.W} height={f.H} rx={4} fill="#e9e4d8" />
      <H_Print f={f} move={m} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The wall (light-kit's WallBed, without door, window and tree: this corner of
// the wall is bare), Rina's chalk grid, the nail at (0, 0).

function H_Grid({ f }: { f: Frame }) {
  let d = "";
  for (let x = Math.ceil(f.x0); x <= f.x1; x += 1) d += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  for (let y = Math.ceil(f.y0); y <= f.y1; y += 1) d += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  return <path d={d} strokeWidth={0.7} stroke={CHALK} strokeOpacity={0.35} fill="none" className="pointer-events-none" />;
}

function H_Clip({ f, children }: { f: Frame; children: ReactNode }) {
  const id = `hc${useId().replace(/[^a-zA-Z0-9]/g, "")}w${Math.round(f.W)}h${Math.round(f.H)}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

function H_Nail({ f }: { f: Frame }) {
  return <circle cx={f.sx(0)} cy={f.sy(0)} r={Math.max(2.2, f.u * 0.06)} fill="#e5e7eb" stroke={INK} strokeWidth={0.9} className="pointer-events-none" />;
}

function H_Wall({ f, label, dim = 0, width = "max-w-[16rem]", children }: { f: Frame; label: string; dim?: number; width?: string; children?: ReactNode }) {
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} className={`my-0! ${width}`}>
      <H_Clip f={f}>
        <WallBed f={f} door={false} window={false} tree={false} />
      </H_Clip>
      <H_Grid f={f} />
      <H_Clip f={f}>{children}</H_Clip>
      <H_Nail f={f} />
      <rect x={0} y={0} width={f.W} height={f.H} rx={6} fill="#0f172a" opacity={dim} className="pointer-events-none transition-opacity duration-500 motion-reduce:transition-none" />
    </Plane>
  );
}

/** a small white chip with words on the wall, at a spot in wall units */
function H_Chip({ f, at, text, tone = INK, dy = 0 }: { f: Frame; at: XY; text: string; tone?: string; dy?: number }) {
  const bn = /[ঀ-৿]/.test(text);
  const w = text.length * (bn ? 5.4 : 6) + 10;
  const x = f.sx(at[0]);
  const y = f.sy(at[1]) + dy;
  return (
    <g className={`${POP} pointer-events-none`}>
      <rect x={x - w / 2} y={y - 8} width={w} height={14} rx={4} fill="white" fillOpacity={0.92} stroke={tone} strokeWidth={1} />
      <text x={x} y={y + 2.8} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={bn ? undefined : MONO} fill={tone}>
        {text}
      </text>
    </g>
  );
}

/** a paint কৌটা, feet at (x, y) */
function H_Tin({ x, y, s = 1, empty = false }: { x: number; y: number; s?: number; empty?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-6} y={-13} width={12} height={13} rx={1.5} fill={empty ? "#e7e5e4" : "#dc2626"} stroke="#7f1d1d" strokeWidth={0.8} />
      <rect x={-6} y={-9} width={12} height={4} fill={empty ? "#d6d3d1" : "#fde68a"} />
      <ellipse cx={0} cy={-13} rx={6} ry={1.8} fill={empty ? "#a8a29e" : "#b91c1c"} stroke="#7f1d1d" strokeWidth={0.6} />
    </g>
  );
}

/** Karim's পলিথিন: four কৌটা; `gone` of them walk off to the দোকান, `used` are empty */
function H_Bag({ gone = 0, used = 0, ring = false, q = false }: { gone?: number; used?: number; ring?: boolean; q?: boolean }) {
  return (
    <svg viewBox="0 0 150 52" className="h-auto w-full max-w-[9.5rem]" role="img" aria-label={`করিমের পলিথিনে চার কৌটা রং${gone ? `; তিন কৌটা দোকানে ফেরত` : ""}`}>
      <path d="M6 14q-2 30 6 34h60q8 -4 6 -34" fill="#e0f2fe" fillOpacity={0.5} stroke="#94a3b8" strokeWidth={1} />
      <path d="M22 14q4 -10 8 0M54 14q4 -10 8 0" fill="none" stroke="#94a3b8" strokeWidth={1} />
      {[0, 1, 2, 3].map((i) => {
        const away = i >= 4 - gone;
        return (
          <g key={i} style={{ transform: `translateX(${away ? 62 : 0}px)`, opacity: away ? 0.35 : 1 }} className="transition-[transform,opacity] duration-700 ease-in-out motion-reduce:transition-none">
            <H_Tin x={18 + i * 16} y={45} empty={i < used} />
          </g>
        );
      })}
      {ring && <rect x={4} y={26} width={72} height={24} rx={6} fill="none" stroke={BLUE} strokeWidth={1.6} className={POP} />}
      {gone > 0 && (
        <g className={POP}>
          <text x={128} y={20} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
            দোকান
          </text>
          <path d="M84 36h24" stroke={INK} strokeWidth={1.2} />
          <path d="M104 32l5 4l-5 4" fill="none" stroke={INK} strokeWidth={1.2} />
        </g>
      )}
      {q && (
        <text x={138} y={46} textAnchor="middle" fontSize={18} fontWeight={800} fill={BLUE} className={POP}>
          ?
        </text>
      )}
    </svg>
  );
}

/** Samin's phone with the formula's answer for Z */
function H_Phone({ struck = false, q = false }: { struck?: boolean; q?: boolean }) {
  return (
    <div className="relative shrink-0 rounded-xl bg-[#0f172a] px-2.5 py-1.5 text-white ring-2 ring-[#334155]">
      <LensCard cols={Z} small name={<span className="font-mono text-xs text-white/70">Z</span>} />
      <div className="mt-0.5 text-center font-mono text-xs">
        ad − bc = <span className="relative text-sm font-bold text-[#fde047]">−3</span>
      </div>
      {struck && (
        <svg viewBox="0 0 60 20" className={`absolute right-1 bottom-0.5 h-5 w-14 ${POP}`} aria-hidden="true">
          <path d="M34 16L56 4" stroke={BAD} strokeWidth={2.4} strokeLinecap="round" />
        </svg>
      )}
      {q && <span className={`absolute -top-2 -right-2 text-lg font-extrabold text-cat-blue ${POP}`}>?</span>}
    </div>
  );
}

/** a curved turn glyph, drawn (no emoji): dir +1 anticlockwise, −1 clockwise */
function TurnGlyph({ dir }: { dir: -1 | 1 }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
      <g transform={dir > 0 ? "translate(20 0) scale(-1 1)" : undefined}>
        <path d="M5 13A6 6 0 1 1 13 15.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        <path d="M13 11.5l0.5 4.5l-4.5 0.4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

const roundBtn =
  "grid size-10 cursor-pointer place-items-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-foreground/10 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent motion-reduce:transition-none";

/** "উল্টানো" / "সোজা" and "বাম হাত" / "ডান হাত", as a small badge */
function HandBadge({ d }: { d: number }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${d < 0 ? "bg-danger/10 text-danger" : "bg-accent/15 text-accent"} ${POP}`}>
      {d < 0 ? "বাম হাত: উল্টানো" : "ডান হাত: সোজা"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The stencil's light on the wall (one ঘর), Samin's phone
//     with Z's −3, Karim's পলিথিন of four কৌটা. Four cards; the pick is acted
//     out and sealed, never marked: three কৌটা walk to the দোকান, the wall
//     goes dark, the −3 is struck, or three কৌটা are ringed with a "?" on the
//     hand.

const X1_F = makeFrame(-1.5, 2.5, -0.4, 1.5, 48, 8); // 208 × 107
const X1_OPTS = ["করিম: 3 কৌটা ফেরত। Minus মানে জায়গা কমে।", "আলোই পড়বে না। দেয়াল অন্ধকার।", "Formula টাই ভুল। জায়গা minus হয় না।", "3 গুণ রং। সাথে অন্য কিছু একটা বদলায়।"];

export function MinusBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(700);
  const k = !sealed ? 0 : act.running ? act.k : 2;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(2, () => pass("বাজি সিল হলো। আগে সোজা আয়না।"));
  };
  const show = k >= 1 ? bet : null;
  const q = k >= 2;
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <H_Wall f={X1_F} label="দেয়ালে stencil এর আলো: এক ঘর, মাঝে আপার ডান হাত, মেহেদি রঙে" dim={show === 1 ? 0.6 : 0} width="max-w-[13rem]">
          <H_Print f={X1_F} />
          <H_Chip f={X1_F} at={[0.5, 0]} dy={10} text="1 ঘর" />
          {q && (bet === 1 || bet === 3) && (
            <text x={X1_F.sx(1.35)} y={X1_F.sy(1.05)} fontSize={20} fontWeight={800} fill={bet === 1 ? "#93c5fd" : BLUE} className={POP}>
              ?
            </text>
          )}
        </H_Wall>
        <div className="flex w-36 flex-col items-center gap-1">
          <H_Phone struck={show === 2} q={q && bet === 2} />
          <H_Bag gone={show === 0 ? 3 : 0} ring={show === 3} q={q && bet === 0} />
        </div>
      </div>
      <div className="mt-1.5 grid gap-1.5">
        {X1_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="text-sm leading-tight">{o}</span>
          </Choice>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={bet === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 2}>জায়গা minus হলে দেয়ালে কী হয়? একটা বেছে নিয়ে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The আয়না। Run M: the lit ঘর turns over like a page onto the other side
//     of the nail, still one ঘর. Then: which hand is it now? The picked hand
//     slides onto the picture; the right hand never sits (thumbs on opposite
//     sides), the left one does.

const X2_F = makeFrame(-2, 2, -0.45, 1.45, 52, 8); // 224 × 115
const X2_HANDS = ["ডান হাত", "বাম হাত"];
const X2_GHOST: Move[] = [(p) => [p[0] - 1, p[1]], (p) => [-p[0], p[1]]];

export function MirrorLens() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1400, 28);
  const slide = usePlay(55);
  const t = run.running ? run.t : ran ? 1 : 0;
  const go = () => {
    if (run.running || ran) return;
    run.run(() => setRan(true));
  };
  const choose = (i: number) => {
    if (!ran || slide.running || pick === 1) return;
    setPick(i);
    slide.play(14, () => (i === 1 ? pass("জায়গা একই। হাতটা উল্টে গেছে।") : setMiss((m) => m + 1)));
  };
  const dx = pick !== null && slide.running ? 2 * (1 - slide.k / 14) : 0;
  const settled = pick !== null && !slide.running;
  return (
    <>
      <H_Wall f={X2_F} label="দেয়ালে stencil এর আলো; আয়না lens চালালে ছবিটা খুঁটির দাগ বরাবর উল্টে বামে যায়" width="max-w-[17rem]">
        <path d={`M${X2_F.sx(0)} ${X2_F.sy(-0.45)}V${X2_F.sy(1.45)}`} stroke={CHALK} strokeWidth={1.2} strokeDasharray="4 3" />
        {ran && <H_Print f={X2_F} ghost soft tone={CHALK} />}
        <H_Print f={X2_F} move={partway(byCols(M), t)} />
        {pick !== null && <H_Print f={X2_F} ghost move={then(X2_GHOST[pick], shift([dx, 0]))} tone={settled ? (pick === 1 ? OK : BAD) : BLUE} />}
        <H_Chip f={X2_F} at={[ran ? -0.5 : 0.5, 0]} dy={11} text="1 ঘর" />
      </H_Wall>
      <div className="mt-1.5 flex items-center justify-center gap-3 text-sm">
        <LensCard cols={M} small name={<span className="text-xs text-muted">আয়না</span>} />
        <span className="text-muted">
          ঘর: <span className="font-mono font-semibold text-foreground">1</span> থেকে <span className="font-mono font-semibold text-foreground">{ran ? "1" : "?"}</span>
        </span>
      </div>
      {!ran && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={primaryBtn} disabled={run.running} onClick={go}>
            আয়না দিয়ে চালান
          </button>
        </div>
      )}
      {ran && (
        <div className={`mt-2 grid grid-cols-2 gap-2 ${FADE}`}>
          {X2_HANDS.map((h, i) => (
            <Choice key={h} n={i} look={settled && pick === i ? (i === 1 ? "right" : "wrong") : "idle"} disabled={slide.running || pick === 1} onClick={() => choose(i)}>
              <span className="flex items-center gap-2 text-sm">
                <H_Icon cols={i === 0 ? I2 : M} size={36} />
                {h}
              </span>
            </Choice>
          ))}
        </div>
      )}
      {settled && pick === 0 && <Nope key={miss}>ডান হাত বসালাম। চারকোনা মিললো, কিন্তু বুড়ো আঙুল পড়লো উল্টা পাশে।</Nope>}
      <Task done={settled && pick === 1}>আয়না দিয়ে চালান। তারপর বলুন, দেয়ালে এখন কোন হাত।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Left of right. The book's g = (3, 2) and l = (1, 2) from the nail. The
//     reader says which is on the right; each pick drops chalk lines from both
//     heads to the nail's row. Right pick → the আয়না runs, the arrows cross
//     over; asked again, l is now the right one.

const X3_F = makeFrame(-3.6, 3.6, -0.55, 2.6, 30, 8); // 232 × 111
const X3_V: XY[] = [
  [3, 2],
  [1, 2],
];
const X3_NAME = ["g", "l"];
const X3_TONE = ["coral", "violet"] as const;
const X3_HEX = ["#e8604c", "#7c5cd6"];
const X3_NOPE = ["l এর মাথা 1 ঘর ডানে, g এর মাথা 3 ঘর। বেশি ডানে কে?", "আয়নার পরে g এর মাথা −3 এ, l এর −1 এ। −1 বেশি ডানে।"];

export function LeftOfRight() {
  const pass = useGate();
  const [p1, setP1] = useSeed<number | null>("p1", null);
  const [p2, setP2] = useSeed<number | null>("p2", null);
  const [flipped, setFlipped] = useSeed("flipped", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1400, 28);
  const meas = usePlay(60);
  const t = run.running ? run.t : flipped ? 1 : 0;
  const pos = X3_V.map((v) => partway(byCols(M), t)(v));
  const phase = flipped ? 2 : 1;
  const pick = phase === 1 ? p1 : p2;
  const right = phase === 1 ? 0 : 1;
  const busy = run.running || meas.running;
  const choose = (i: number) => {
    if (busy) return;
    if (phase === 1) {
      if (p1 === 0) return;
      setP1(i);
      meas.play(10, () => (i === 0 ? run.run(() => setFlipped(true)) : setMiss((m) => m + 1)));
    } else {
      if (p2 === 1) return;
      setP2(i);
      meas.play(10, () => (i === 1 ? pass("ডানেরটা বামে গেলো: উল্টানো।") : setMiss((m) => m + 1)));
    }
  };
  const m = meas.running ? meas.k / 10 : 1;
  const showMeas = pick !== null && !run.running;
  const settled = pick !== null && !busy;
  return (
    <>
      <H_Wall f={X3_F} label="দেয়ালে পেরেক থেকে দুইটা তীর, g আর l; আয়না চালালে দুইটা পাশ বদলায়" width="max-w-[18rem]">
        <path d={`M${X3_F.sx(0)} ${X3_F.sy(-0.55)}V${X3_F.sy(2.6)}`} stroke={CHALK} strokeWidth={1} strokeDasharray="4 3" />
        {/* which way is right */}
        <g className="pointer-events-none">
          <path d={`M${X3_F.sx(2.1)} ${X3_F.sy(-0.25)}h${X3_F.u * 1.1}`} stroke={INK} strokeWidth={1.2} />
          <path d={`M${X3_F.sx(3.2) - 4} ${X3_F.sy(-0.25) - 3.5}l4 3.5l-4 3.5`} fill="none" stroke={INK} strokeWidth={1.2} />
          <text x={X3_F.sx(2.6)} y={X3_F.sy(-0.25) - 4} textAnchor="middle" fontSize={8.5} fill={INK}>
            ডান দিক
          </text>
        </g>
        {showMeas &&
          pos.map((p, i) => (
            <g key={i} className="pointer-events-none">
              <path d={`M${X3_F.sx(p[0])} ${X3_F.sy(p[1])}V${X3_F.sy(p[1] - p[1] * m)}`} stroke={X3_HEX[i]} strokeWidth={1.2} strokeDasharray="3 2" />
              {m >= 1 && (
                <text x={X3_F.sx(p[0])} y={X3_F.sy(0) + 11} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={X3_HEX[i]} className={POP}>
                  {sgn(Math.round(p[0]))}
                </text>
              )}
            </g>
          ))}
        {pos.map((p, i) => (
          <Arrow key={i} f={X3_F} from={[0, 0]} to={p} tone={X3_TONE[i]} w={pick === i && showMeas ? 3.4 : 2.6} />
        ))}
        {pos.map((p, i) => (
          <text key={`n${i}`} x={X3_F.sx(p[0]) + (i === 0 ? 1 : -1) * (p[0] >= 0 ? 7 : -7)} y={X3_F.sy(p[1]) - 5} textAnchor="middle" fontSize={12} fontWeight={800} fontFamily={MONO} fill={X3_HEX[i]} className="pointer-events-none">
            {X3_NAME[i]}
          </text>
        ))}
      </H_Wall>
      <div className="mt-1.5 flex items-center justify-center gap-3 font-mono text-sm">
        {pos.map((p, i) => (
          <span key={i} style={{ color: X3_HEX[i] }}>
            {X3_NAME[i]} = <Tup v={[Math.round(p[0]), Math.round(p[1])]} of={WALL_SLOTS} />
          </span>
        ))}
        {flipped && <LensCard cols={M} small />}
      </div>
      <div className="mt-2 text-center text-sm font-semibold">{phase === 1 ? "কোনটা ডানে?" : "আয়নার পরে, এখন কোনটা ডানে?"}</div>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {X3_NAME.map((nm, i) => (
          <Choice key={`${phase}${nm}`} n={i} look={settled && pick === i ? (i === right ? "right" : "wrong") : "idle"} disabled={busy} onClick={() => choose(i)}>
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 30 16" className="h-4 w-8" aria-hidden="true">
                <path d="M2 13L24 4" stroke={X3_HEX[i]} strokeWidth={2.4} strokeLinecap="round" />
                <path d="M27 3l-7 -1l3 6Z" fill={X3_HEX[i]} />
              </svg>
              <span className="font-mono text-base font-bold">{nm}</span>
            </span>
          </Choice>
        ))}
      </div>
      {settled && pick !== right && <Nope key={miss}>{X3_NOPE[phase - 1]}</Nope>}
      <Task done={flipped && p2 === 1 && !busy}>{phase === 1 ? "দুই তীরের কোনটা ডানে, বেছে নিন। তারপর আয়না চলবে।" : "আয়না চললো। এবার কোনটা ডানে?"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Predict: swap the two columns of the plain glass I. Plus or minus? The
//     guess runs the swap: the two columns slide past each other, the hand
//     turns over on the diagonal; ad − bc = −1, and held fingers-up it is a
//     left hand.

const X4_F = makeFrame(-0.45, 1.45, -0.35, 1.35, 70, 8); // 149 × 135
const X4_OPTS = ["+1. একই সংখ্যা, শুধু জায়গা বদল।", "−1.", "0. সরালে জায়গাই থাকে না।"];
const X4_ANSWER = 1;
const X4_NOPE = ["", "", "জায়গা হারায় নাই: দেয়ালে এখনো পুরা এক ঘর। শুধু হাত উল্টালো, তাই −1।"];
const X4_NOPE0 = "দেয়ালে হাত উল্টে গেলো। আঙুল এখন ডানে, বুড়ো আঙুল উপরে। সোজা করে ধরলে বাম হাত। তাই −1।";

/** the lens as two columns that can slide past each other (t 0 → 1) */
function X4_Columns({ t }: { t: number }) {
  const col = (v: XY, hex: string, dx: number) => (
    <span className="flex w-6 flex-col items-center font-mono text-sm font-bold" style={{ color: hex, transform: `translateX(${dx}px)` }}>
      <span>{v[0]}</span>
      <span>{v[1]}</span>
    </span>
  );
  return (
    <span className="inline-flex items-stretch" aria-label={t >= 1 ? "lens: প্রথম column (0, 1), দ্বিতীয় (1, 0)" : "lens: প্রথম column (1, 0), দ্বিতীয় (0, 1)"}>
      <span className="w-1 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
      {col([1, 0], "#d97706", t * 24)}
      {col([0, 1], "#0d9488", -t * 24)}
      <span className="w-1 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
    </span>
  );
}

export function SwapColumns() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);
  const run = useLensRun(1600, 32);
  const t = run.running ? run.t : ran ? 1 : 0;
  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    run.run(() => {
      setRan(true);
      pass("Column দুইটা অদলবদল করলেই minus।");
    });
  };
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <H_Wall f={X4_F} label="দেয়ালে stencil এর আলো; column অদলবদল করলে হাতটা কোনাকুনি দাগ বরাবর উল্টে যায়" width="max-w-[10rem]">
          <path d={`M${X4_F.sx(-0.35)} ${X4_F.sy(-0.35)}L${X4_F.sx(1.35)} ${X4_F.sy(1.35)}`} stroke={CHALK} strokeWidth={1} strokeDasharray="4 3" />
          <H_Print f={X4_F} move={partway(byCols(P), t)} />
        </H_Wall>
        <div className="flex flex-col items-center gap-1.5">
          <X4_Columns t={t} />
          {ran ? (
            <div className={`text-center ${FADE}`}>
              <div className="font-mono text-sm">
                0 · 0 − 1 · 1 = <span className="font-bold text-danger">−1</span>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted">
                আঙুল উপরে ধরলে <H_Icon cols={M} size={30} />
              </div>
              <HandBadge d={-1} />
            </div>
          ) : (
            <div className="text-xs text-muted">ad − bc = ?</div>
          )}
        </div>
      </div>
      <div className="mt-2 grid gap-1.5">
        {X4_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, ran, X4_ANSWER)} disabled={guess !== null} onClick={() => choose(i)}>
            <span className="text-sm leading-tight">{o}</span>
          </Choice>
        ))}
      </div>
      {ran && guess !== null && guess !== X4_ANSWER && <Nope>{guess === 0 ? X4_NOPE0 : X4_NOPE[guess]}</Nope>}
      <Task done={ran}>Column দুইটা অদলবদল করলে হিসাব plus না minus? আগে guess দিন, তারপর দেয়ালে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Z on the wall. Run Z: the lit ঘর becomes the patch (0, 0), (1, 1),
//     (0, 3), (−1, 2). Count it: cut along the post and slide, twice, into a
//     column of three whole ঘর. Then turn the picture (only turn) until the
//     fingers point up: the thumb is on the left. A left hand, three times the
//     size.

const X5_F = makeFrame(-2.6, 1.6, -0.4, 4.3, 38, 8); // 176 × 195
const X5_PIECES: { pts: XY[]; d1: XY; d2: XY }[] = [
  {
    pts: [
      [0, 0],
      [0, 3],
      [-1, 2],
    ],
    d1: [1, 1],
    d2: [0, 0],
  },
  {
    pts: [
      [0, 0],
      [1, 1],
      [0, 1],
    ],
    d1: [0, 0],
    d2: [0, 3],
  },
  {
    pts: [
      [0, 1],
      [1, 1],
      [0, 3],
    ],
    d1: [0, 0],
    d2: [0, 0],
  },
];
const X5_CUTS = `M0 0L0 3M0 1L1 1`;

export function ZOnTheWall() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const run = useLensRun(1400, 28);
  const cnt = usePlay(60);
  const turn = useLensRun(1200, 24);
  const tZ = run.running ? run.t : stage >= 1 ? 1 : 0;
  const ck = cnt.running ? cnt.k : stage >= 2 ? 30 : 0;
  const s1 = clamp((ck - 3) / 10, 0, 1);
  const s2 = clamp((ck - 15) / 9, 0, 1);
  const counting = cnt.running || stage === 2;
  const th = turn.running ? turn.t : stage >= 3 ? 1 : 0;
  const turning = turn.running || stage >= 3;
  const busy = run.running || cnt.running || turn.running;
  const act = () => {
    if (busy) return;
    if (stage === 0) run.run(() => setStage(1));
    else if (stage === 1) cnt.play(30, () => setStage(2));
    else if (stage === 2)
      turn.run(() => {
        setStage(3);
        pass("−3 মানে: তিনগুণ, উল্টানো।");
      });
  };
  const f = X5_F;
  const cut = X5_CUTS.replace(/([ML])(-?\d+) (-?\d+)/g, (_, c: string, x: string, y: string) => `${c}${f.sx(Number(x))} ${f.sy(Number(y))}`);
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <H_Wall f={f} label="Z দিয়ে stencil এর আলো একটা হেলানো patch; কেটে সরালে তিনটা পুরা ঘর; ঘুরিয়ে আঙুল উপরে আনলে বুড়ো আঙুল বামে" width="max-w-[11rem]">
          {stage >= 1 && <H_Print f={f} ghost soft tone={CHALK} />}
          {!counting && !turning && <H_Print f={f} move={partway(byCols(Z), tZ)} />}
          {counting && (
            <g className="pointer-events-none">
              {X5_PIECES.map((pc, i) => {
                const d: XY = [pc.d1[0] * s1 + pc.d2[0] * s2, pc.d1[1] * s1 + pc.d2[1] * s2];
                return <path key={i} d={pathOf(f, shift(d), pc.pts, true)} fill={GLOW} fillOpacity={0.6} stroke={LAMP} strokeWidth={1.2} strokeLinejoin="round" />;
              })}
              {ck < 4 && <path d={cut} stroke={BAD} strokeWidth={1.6} strokeDasharray="3 2" className={POP} />}
              {[1, 2, 3].map((n) =>
                ck >= 24 + n * 2 ? (
                  <text key={n} x={f.sx(0.5)} y={f.sy(n + 0.5) + 5} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily={MONO} fill={INK} className={POP}>
                    {n}
                  </text>
                ) : null,
              )}
            </g>
          )}
          {turning && (
            <>
              <H_Print f={f} move={byCols(Z)} ghost soft tone={LAMP} />
              <H_Print f={f} move={then(byCols(Z), rot(45 * th))} />
              {stage >= 3 && <H_Chip f={f} at={[-1.4, 3.3]} text="বুড়ো আঙুল বামে" tone={BAD} />}
            </>
          )}
        </H_Wall>
        <div className="flex w-28 flex-col items-center gap-2 text-sm">
          <LensCard cols={Z} name={<span className="font-mono text-xs text-muted">Z</span>} />
          <div className="text-center">
            <div className="text-xs text-muted">কত ঘর</div>
            <div className="font-mono text-lg font-bold">{stage >= 2 ? "3" : "?"}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted">কোন হাত</div>
            {stage >= 3 ? <HandBadge d={-3} /> : <div className="font-mono text-lg font-bold">?</div>}
          </div>
        </div>
      </div>
      {stage < 3 && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={stage === 0 ? primaryBtn : quietBtn} disabled={busy} onClick={act}>
            {stage === 0 ? "Z দিয়ে চালান" : stage === 1 ? "কেটে সরিয়ে গুনুন" : "ঘুরিয়ে আঙুল উপরে আনুন"}
          </button>
        </div>
      )}
      <Task done={stage >= 3}>Z চালান। তারপর ঘর গুনুন, আর ছবি ঘুরিয়ে দেখুন কোন হাত।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Turn is not flip. Nasib's lens [[−1, 0], [0, −1]]: the hand ends upside
//     down. A dashed copy of the real stencil turns in quarter turns (only
//     turns); at a half turn it sits exactly. Then the আয়না's picture: the
//     copy goes all the way round and never sits (at a quarter turn the ঘর
//     matches, the hand doesn't).

const X6_F = makeFrame(-1.5, 1.5, -1.35, 1.35, 52, 8); // 172 × 156
const X6_NAMES = ["নাসিবের lens", "আয়না"];
const X6_LENS = [N, M];

export function TurnIsNotFlip() {
  const pass = useGate();
  const [tab, setTab] = useSeed<0 | 1>("tab", 0);
  const [ran, setRan] = useSeed<boolean[]>("ran", [false, false]);
  const [ang, setAng] = useSeed("ang", 0);
  const [tried, setTried] = useSeed<number[]>("tried", [0]);
  const [fitN, setFitN] = useSeed("fitN", false);
  const run = useLensRun(1400, 28);
  const [angT] = useTween([ang], 450);
  const t = run.running ? run.t : ran[tab] ? 1 : 0;
  const lensMove: Move = tab === 0 ? rot(180 * t) : partway(byCols(M), t);
  const norm = ((ang % 360) + 360) % 360;
  const fits = ran[tab] && tab === 0 && norm === 180;
  const done = tab === 1 && tried.length === 4;
  const go = () => {
    if (run.running || ran[tab]) return;
    run.run(() => setRan(ran.map((v, i) => v || i === tab)));
  };
  const turnBy = (d: number) => {
    if (!ran[tab] || run.running || done) return;
    const a = ang + d;
    const n = ((a % 360) + 360) % 360;
    setAng(a);
    if (tab === 0 && n === 180) setFitN(true);
    if (tab === 1 && !tried.includes(n)) {
      const nt = [...tried, n];
      setTried(nt);
      if (nt.length === 4) pass("ঘোরানো আর উল্টানো এক না।");
    }
  };
  const toMirror = () => {
    setTab(1);
    setAng(0);
  };
  const tileOnly = tab === 1 && ran[1] && norm === 90;
  return (
    <>
      <div className="mb-1.5 flex justify-center gap-2">
        {X6_NAMES.map((nm, i) => (
          <span key={nm} className={`${pill(tab === i)} cursor-default font-sans text-xs ${i === 1 && !fitN ? "opacity-40" : ""}`}>
            {nm}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <H_Wall f={X6_F} label={`${X6_NAMES[tab]} এর ছবি দেয়ালে; উপরে আসল stencil এর একটা ছায়া, শুধু ঘোরানো যায়`} width="max-w-[11rem]">
          <path d={`M${X6_F.sx(0)} ${X6_F.sy(-1.35)}V${X6_F.sy(1.35)}M${X6_F.sx(-1.5)} ${X6_F.sy(0)}H${X6_F.sx(1.5)}`} stroke={CHALK} strokeWidth={0.9} strokeDasharray="3 3" />
          <H_Print f={X6_F} move={lensMove} />
          {ran[tab] && <H_Print f={X6_F} ghost move={rot(angT)} tone={fits ? OK : BLUE} />}
        </H_Wall>
        <div className="flex w-28 flex-col items-center gap-1.5">
          <LensCard cols={X6_LENS[tab]} small />
          <div className="font-mono text-xs">
            det = <span className="font-bold">{tab === 0 ? "+1" : "−1"}</span>
          </div>
          {ran[tab] && (
            <div className={`flex items-center gap-1.5 ${FADE}`}>
              <button type="button" aria-label="ছায়াটা এক চতুর্থাংশ পাক বামে ঘুরান" className={roundBtn} disabled={run.running || done} onClick={() => turnBy(90)}>
                <TurnGlyph dir={1} />
              </button>
              <button type="button" aria-label="ছায়াটা এক চতুর্থাংশ পাক ডানে ঘুরান" className={roundBtn} disabled={run.running || done} onClick={() => turnBy(-90)}>
                <TurnGlyph dir={-1} />
              </button>
            </div>
          )}
          {tab === 1 && ran[1] && <div className="text-center text-xs text-muted">ঘুরিয়ে দেখা হলো {tried.length}/4 রকম</div>}
        </div>
      </div>
      <div className="mt-1.5 min-h-5 text-center text-sm">
        {fits && <span className={`font-semibold text-accent ${FADE}`}>আধা পাক ঘুরাতেই হুবহু বসে গেলো।</span>}
        {tileOnly && <span className={`text-muted ${FADE}`}>চারকোনা মিললো। হাত মেলে নাই।</span>}
        {done && <span className={`font-semibold ${FADE}`}>কোনো ঘোরানোতেই আয়নার ছবি বসে না।</span>}
      </div>
      <div className="mt-1.5 flex justify-center">
        {!ran[tab] && (
          <button type="button" className={primaryBtn} disabled={run.running} onClick={go}>
            {tab === 0 ? "নাসিবের lens চালান" : "আয়না চালান"}
          </button>
        )}
        {tab === 0 && fitN && ran[0] && (
          <button type="button" className={quietBtn} onClick={toMirror}>
            এবার আয়নার ছবি
          </button>
        )}
      </div>
      <Task done={done}>{tab === 0 ? "নাসিবের lens চালান। তারপর ছায়াটা ঘুরিয়ে ছবির উপর বসান।" : "আয়নার ছবিতেও ছায়াটা ঘুরিয়ে দেখুন, চার রকমই।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn. Four lenses from the লাইট ভাই's bag. For each the reader
//     sets উল্টায় / উল্টায় না and কতগুণ, then runs it: the stencil goes
//     through, the patch is labelled with its ঘর and its hand. A wrong pair of
//     answers bounces; change them and run again.

const X7_F = makeFrame(-1.5, 3.3, -1.4, 2.3, 36, 8); // 189 × 149
const X7_LENS: Cols[] = [
  [
    [1, 0],
    [0, -1],
  ],
  [
    [0, 1],
    [-1, 0],
  ],
  [
    [2, 0],
    [0, 2],
  ],
  [
    [1, 1],
    [2, 0],
  ],
];

export function YourSign() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [flip, setFlip] = useSeed<boolean | null>("flip", null);
  const [times, setTimes] = useSeed("times", 1);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1300, 26);
  const L = X7_LENS[at];
  const D = det(L);
  const right = flip === D < 0 && times === Math.abs(D);
  const t = run.running ? run.t : ran ? 1 : 0;
  const last = at === X7_LENS.length - 1;
  const go = () => {
    if (flip === null || run.running) return;
    run.run(() => {
      setRan(true);
      if (flip === D < 0 && times === Math.abs(D)) {
        if (last) pass("চিহ্ন বলে উল্টায় কি না। সংখ্যা বলে কতগুণ।");
      } else setMiss((m) => m + 1);
    });
  };
  const next = () => {
    setAt(at + 1);
    setFlip(null);
    setTimes(1);
    setRan(false);
  };
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    if (run.running) return;
    set(v);
    setRan(false);
  };
  const corners = SQ.map((p) => apply(L, p));
  const mid: XY = [corners.reduce((s, p) => s + p[0], 0) / 4, corners.reduce((s, p) => s + p[1], 0) / 4];
  return (
    <>
      <div className="mb-1 flex justify-center gap-1.5" aria-label={`চারটার মধ্যে lens ${at + 1}`}>
        {X7_LENS.map((_, i) => (
          <span key={i} className={`h-1.5 w-6 rounded-full ${i < at || (i === at && ran && right) ? "bg-accent" : i === at ? "bg-cat-blue" : "bg-border"}`} />
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <H_Wall f={X7_F} label={`lens ${at + 1} দিয়ে stencil এর আলো দেয়ালে`} width="max-w-[12rem]">
          {ran && <H_Print f={X7_F} ghost soft tone={CHALK} />}
          <H_Print f={X7_F} move={partway(byCols(L), t)} />
          {ran && !run.running && <H_Chip f={X7_F} at={mid} dy={-2} text={`${Math.abs(D)} ঘর`} />}
        </H_Wall>
        <div className="flex flex-col items-center gap-1.5">
          <LensCard cols={L} name={<span className="text-xs text-muted">lens {at + 1}</span>} />
          {ran && !run.running && <HandBadge d={D} />}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" className={`${pill(flip === v)} font-sans`} onClick={() => edit(setFlip)(v)}>
            {v ? "উল্টায়" : "উল্টায় না"}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted">জায়গা কতগুণ</span>
        <Stepper value={times} min={1} max={4} label="কতগুণ" onChange={edit(setTimes)} />
      </div>
      <div className="mt-2 flex justify-center">
        {ran && right && !last ? (
          <button type="button" className={primaryBtn} onClick={next}>
            পরের lens
          </button>
        ) : (
          <button type="button" className={primaryBtn} disabled={flip === null || run.running || (ran && right)} onClick={go}>
            চালিয়ে মিলান
          </button>
        )}
      </div>
      {ran && !run.running && !right && (
        <Nope key={miss}>
          দেয়ালে এলো {Math.abs(D)} ঘর, হাত {D < 0 ? "উল্টানো" : "সোজা"}. ad − bc হিসাব করে দেখুন: চিহ্ন আর সংখ্যা।
        </Nope>
      )}
      <Task done={last && ran && right}>প্রতিটা lens এর জন্য বলুন: হাত উল্টাবে কি না, জায়গা কতগুণ। তারপর চালিয়ে মিলান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it. Rina's lens for the door, [[0, 2], [2, 0]]: det −4. Three
//     pictures: a big right hand (fingers right, thumb down: [[0, 2], [−2, 0]],
//     det +4) · a big left hand (the lens) · a small left hand (P, det −1).
//     Each pick runs the lens on the stencil and lays the picked picture on
//     top.

const X8_T: Cols = [
  [0, 2],
  [2, 0],
];
const X8_OPTS: Cols[] = [
  [
    [0, -2],
    [2, 0],
  ],
  X8_T,
  P,
];
const X8_RIGHT = 1;
const X8_F = makeFrame(-0.5, 2.5, -2.3, 2.3, 30, 8); // 106 × 154
const X8_NOPE = [
  "আপনার ছবিতে বুড়ো আঙুল নিচে: ডান হাত। Lens এর ছবিতে বুড়ো আঙুল উপরে। 0 · 0 − 2 · 2 = −4: উল্টানো।",
  "",
  "হাত ঠিক, উল্টানো। কিন্তু মাপে ছোট: আপনারটা 1 ঘর, lens এর ছবি 4 ঘর।",
];

export function TryWhichHand() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1400, 28);
  const t = run.running ? run.t : ran ? 1 : 0;
  const choose = (i: number) => {
    if (run.running || (ran && pick === X8_RIGHT)) return;
    setPick(i);
    setRan(false);
    run.run(() => {
      setRan(true);
      if (i === X8_RIGHT) pass("−4: চারগুণ বড়, আর বাম হাত।");
      else setMiss((m) => m + 1);
    });
  };
  const settled = pick !== null && ran && !run.running;
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <H_Wall f={X8_F} label="রিনার lens দিয়ে stencil এর আলো দেয়ালে; উপরে বাছাই করা ছবির ছায়া" width="max-w-[7.5rem]">
          <H_Print f={X8_F} move={partway(byCols(X8_T), t)} />
          {settled && <H_Print f={X8_F} ghost move={byCols(X8_OPTS[pick])} tone={pick === X8_RIGHT ? OK : BAD} />}
        </H_Wall>
        <div className="flex flex-col items-center gap-1">
          <LensCard cols={X8_T} name={<span className="text-xs text-muted">রিনার lens</span>} />
          {settled && <span className="font-mono text-xs">ad − bc = −4</span>}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X8_OPTS.map((c, i) => (
          <Choice key={i} n={i} look={settled && pick === i ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={run.running || (ran && pick === X8_RIGHT)} onClick={() => choose(i)}>
            <H_Icon cols={c} size={66} span={2.2} />
          </Choice>
        ))}
      </div>
      {settled && pick !== X8_RIGHT && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={settled && pick === X8_RIGHT}>এই lens দেয়ালে কোন ছবিটা ফেলবে? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The bet opened, card by card. The evidence: Z's patch painted on the
//     wall (3 ঘর, a left hand), and the পলিথিন: three কৌটা empty, one left.

const X9_F = makeFrame(-1.3, 1.3, -0.3, 3.3, 26, 6); // 80 × 106
const X9_CARDS: [string, boolean, string][] = [
  ["করিম: 3 কৌটা ফেরত।", false, "ফেরত দিলে থাকতো 1 কৌটা। দেয়ালে লাগলো 3।"],
  ["আলোই পড়বে না।", false, "আলো পড়লো, 3 ঘর জুড়ে।"],
  ["Formula টাই ভুল।", false, "Formula ঠিক। Minus টা উল্টানোর information."],
  ["3 গুণ রং, সাথে অন্য কিছু বদলায়।", true, "3 গুণ রং। আর হাতটা উল্টানো: বাম হাত।"],
];

function X9_Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <svg viewBox="0 0 12 12" className={`size-5 shrink-0 ${POP}`} aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke={OK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" className={`size-5 shrink-0 ${POP}`} aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke={BAD} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [now, setNow] = useState<number | null>(null);
  const p = usePlay(250);
  const tap = (i: number) => {
    if (p.running || open.includes(i)) return;
    setNow(i);
    p.play(4, () => {
      const next = [...open, i];
      setOpen(next);
      setNow(null);
      if (next.length === X9_CARDS.length) pass("Minus মানে উল্টানো, কম না।");
    });
  };
  const shown = open.length > 0;
  return (
    <>
      <div className={`flex items-center justify-center gap-3 transition-opacity duration-500 motion-reduce:transition-none ${shown ? "" : "opacity-30"}`}>
        <H_Wall f={X9_F} label="দেয়ালে রং করা Z এর ছবি: তিন ঘর, বাম হাত" width="max-w-[5rem]">
          <H_Print f={X9_F} move={byCols(Z)} />
        </H_Wall>
        <div className="flex flex-col items-center gap-1 text-xs">
          <H_Bag used={3} />
          <span className="text-muted">3 কৌটা খালি, 1 টা বাকি</span>
        </div>
      </div>
      <div className="mt-2 grid gap-1.5">
        {X9_CARDS.map(([txt, ok, line], i) => {
          const on = open.includes(i);
          return (
            <button
              key={txt}
              type="button"
              onClick={() => tap(i)}
              disabled={p.running || on}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-1.5 text-left text-sm transition-colors duration-300 disabled:cursor-default motion-reduce:transition-none ${
                on ? (ok ? "border-accent bg-accent/10" : "border-border opacity-70") : now === i ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <span>
                <span className="font-semibold">{txt}</span>
                {on && <span className={`${FADE} block text-xs text-muted`}>{line}</span>}
              </span>
              {on ? <X9_Mark ok={ok} /> : <span className="shrink-0 text-xs text-muted">খুলুন</span>}
            </button>
          );
        })}
      </div>
      <Task done={open.length === X9_CARDS.length}>চারটা বাজি একটা একটা করে খুলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. A close-up of this corner of the wall at the stage's left
// (x −3…5, y −1…4.5, 18 units a ঘর, bigger than light-kit's StageWall so the
// hand reads), the people on the right.

const SF = makeFrame(-3, 5, -1, 4.5, 18, 0); // 144 × 99
const SWX = 14;
const SWY = 46;

function H_StageWall({ dim = 0, children }: { dim?: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${SWX} ${SWY})`}>
      <path d={`M-8 0L${SF.W + 8} 0L${SF.W - 4} -12L4 -12Z`} fill="#9f5a3a" />
      <WallBed f={SF} door={false} window={false} tree={false} />
      <rect x={0} y={SF.H} width={SF.W} height={150 - SWY - SF.H} fill="#a8a29e" />
      <H_Grid f={SF} />
      {dim > 0 && <rect x={0} y={0} width={SF.W} height={SF.H} fill="#0f172a" opacity={dim} />}
      <H_Nail f={SF} />
      {children}
    </g>
  );
}

/** the cereal-box stencil held up: a brown card, a ঘর-sized window, the hand cut from the card inside it */
function H_Card({ x, y, u = 13, light = false }: { x: number; y: number; u?: number; light?: boolean }) {
  const d = HAND.map((p, i) => `${i ? "L" : "M"}${(p[0] * u).toFixed(1)} ${(-p[1] * u).toFixed(1)}`).join("") + "Z";
  return (
    <g transform={`translate(${x - u / 2} ${y + u / 2})`} className="pointer-events-none">
      <rect x={-u * 0.3} y={-u * 1.3} width={u * 1.6} height={u * 1.6} rx={1.5} fill="#b45309" stroke="#78350f" strokeWidth={0.7} />
      <rect x={0} y={-u} width={u} height={u} fill={light ? "#fef9c3" : "#e0f2fe"} />
      <path d={d} fill="#b45309" />
      <text x={u * 0.5} y={-u * 1.34 + 3.2} textAnchor="middle" fontSize={3.2} fontWeight={700} fill="#fef3c7">
        CEREAL
      </text>
    </g>
  );
}

/** a lens held up or in the machine: a coloured glass with its letter */
function H_Glass({ x, y, letter, fill, r = 5.5 }: { x: number; y: number; letter: string; fill: string; r?: number }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={0.9} />
      <text x={x} y={y + r * 0.45} textAnchor="middle" fontSize={r * 1.3} fontWeight={800} fontFamily={MONO} fill={INK}>
        {letter}
      </text>
    </g>
  );
}
const Z_FILL = "#fde68a"; // 7.3's Z, yellow
const M_FILL = "#e5e7eb"; // the আয়না, silvery

/** Samin's phone at his hand, the answer on it */
function H_HeldPhone({ x, y, text }: { x: number; y: number; text?: string }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 5} y={y - 8} width={10} height={16} rx={1.6} fill="#0f172a" stroke="#475569" strokeWidth={0.7} />
      {text && (
        <text x={x} y={y + 2.5} textAnchor="middle" fontSize={5.5} fontWeight={800} fontFamily={MONO} fill={GLOW} className={POP}>
          {text}
        </text>
      )}
    </g>
  );
}

/** Karim's পলিথিন at his hand: n কৌটা in a clear bag */
function H_StageBag({ x, y, n = 4 }: { x: number; y: number; n?: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 11} ${y - 12}q-1 13 3 14h16q4 -1 3 -14`} fill="#e0f2fe" fillOpacity={0.6} stroke="#94a3b8" strokeWidth={0.8} />
      {Array.from({ length: n }, (_, i) => (
        <H_Tin key={i} x={x - 6 + (i % 2) * 11} y={y + 1 - Math.floor(i / 2) * 6} s={0.45} />
      ))}
    </g>
  );
}

// 1a · Afternoon. Rina holds the stencil up to the sun; the লাইট ভাই offers
//      Z; Samin's phone says −3; Karim, at the gate with his পলিথিন, claims.

export function MehediAfternoon({}: Story) {
  const s = useScene(3, [600, 2200, 2200, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বিকাল; রিনা cereal এর বাক্স কেটে বানানো stencil রোদের দিকে ধরেছে, মাঝে আপার ডান হাত; লাইট ভাই বললেন Z দিয়ে বড় করে ফেলি; সামিনের phone এ −3; গেটে করিম, পলিথিনে চার কৌটা রং, বললো minus মানে জায়গা কমে, তিন কৌটা ফেরত দিয়ে আসি">
        <circle cx={268} cy={26} r={11} fill="#fde047" />
        <circle cx={268} cy={26} r={17} fill="#fde047" opacity={0.3} />
        <H_StageWall />
        {/* the gate */}
        <rect x={300} y={96} width={5} height={54} fill="#57534e" />
        <rect x={312} y={96} width={5} height={54} fill="#57534e" />
        <LightBhai x={92} y={150} facing={1} arm={k === 1 ? "point" : "down"} />
        <Person who="rina" x={148} y={150} facing={1} arm="hold" label />
        <H_Card x={160} y={96} light />
        {k === 0 && <path d="M170 90L256 32M170 100L258 38" stroke="#fde047" strokeWidth={1} opacity={0.8} />}
        <Person who="samin" x={206} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 && <H_HeldPhone x={196} y={108} text="−3" />}
        <Person who="karim" x={284} y={150} facing={-1} arm="hold" label />
        <H_StageBag x={272} y={118} />
        {k === 1 && <Bubble x={92} y={84} side="right" lines={["এইটা বড় কইরা ফালাই।", "Z দিয়া।"]} />}
        {k === 2 && <Bubble x={206} y={84} side="mid" lines={["Z এর হিসাব:", "−3."]} />}
        {k === 3 && <Bubble x={284} y={84} side="left" lines={["Minus মানে জায়গা কমে।", "তিন কৌটা ফেরত দিয়ে আসি।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · The লাইট ভাই takes 7.4's আয়না from his bag and fits it; Rina slides
//      the stencil in. The machine stays off (the widget runs it).

export function AynaLens({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 1800]);
  const k = s.k;
  const PJ: [number, number] = [236, 150];
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="লাইট ভাই ব্যাগ থেকে 7.4 এর আয়না lens বের করলেন, যন্ত্রে লাগালেন; রিনা stencil টা যন্ত্রে ঢুকালো; যন্ত্র এখনো বন্ধ">
        <H_StageWall />
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        {k >= 2 && (
          <g className={POP}>
            <H_Glass x={lx} y={ly} letter="M" fill={M_FILL} />
          </g>
        )}
        <LightBhai x={290} y={150} facing={-1} arm={k === 1 ? "hold" : "down"} />
        <rect x={296} y={124} width={14} height={11} rx={2} fill="#78350f" />
        {k === 1 && (
          <g className={POP}>
            <H_Glass x={270} y={110} letter="M" fill={M_FILL} r={6} />
            <text x={258} y={98} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK}>
              আয়না
            </text>
          </g>
        )}
        <Person who="rina" x={k >= 3 ? 196 : 176} y={150} facing={1} arm={k >= 3 ? "hold" : "down"} label ms={900} />
        {k >= 3 ? <H_Card x={238} y={70} u={9} /> : <H_Card x={186} y={112} u={9} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · Back to Z: the আয়না out, the yellow Z in. Karim still at the gate.

export function BackToZ({}: Story) {
  const s = useScene(3, [600, 1600, 2000, 2000]);
  const k = s.k;
  const PJ: [number, number] = [214, 150];
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="লাইট ভাই আয়না খুলে রাখলেন, হলুদ Z লাগালেন; করিম গেটে পলিথিন হাতে জিজ্ঞেস করলো ফেরত দিতে যাবে কি না; রিনা বললো দাঁড়া">
        <H_StageWall />
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        {k === 0 && <H_Glass x={lx} y={ly} letter="M" fill={M_FILL} />}
        {k >= 1 && (
          <g className={POP}>
            <H_Glass x={lx} y={ly} letter="Z" fill={Z_FILL} />
          </g>
        )}
        {k >= 1 && <H_Glass x={250} y={108} letter="M" fill={M_FILL} r={4.5} />}
        <LightBhai x={252} y={150} facing={-1} arm={k === 0 ? "hold" : "down"} />
        <Person who="rina" x={170} y={150} facing={1} label />
        <rect x={300} y={96} width={5} height={54} fill="#57534e" />
        <rect x={312} y={96} width={5} height={54} fill="#57534e" />
        <Person who="karim" x={294} y={150} facing={-1} arm="hold" label />
        <H_StageBag x={282} y={118} />
        {k === 2 && <Bubble x={294} y={84} side="left" lines={["ফেরত দিতে যাবো?"]} />}
        {k === 3 && <Bubble x={170} y={84} side="mid" lines={["দাঁড়া।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Nasib chalks his own lens on the wall: two minus signs. His claim.

export function NasibTwoMinus({}: Story) {
  const s = useScene(3, [600, 1600, 2200, 2400]);
  const k = s.k;
  const cx = SWX + SF.sx(3);
  const cy = SWY + SF.sy(3);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব চক দিয়ে দেয়ালে নিজের lens লিখলো, দুই কোনায় −1; বললো একটা minus এ এক উল্টা, দুইটা minus, দুইবার উল্টাবে">
        <H_StageWall>
          <text x={SF.sx(-2)} y={SF.sy(3.4)} fontSize={9} fontWeight={700} fill={CHALK}>
            নাসিবের lens
          </text>
        </H_StageWall>
        {k >= 1 && (
          <g className={POP} fill="#f8fafc" stroke="#475569" strokeWidth={0.4}>
            <rect x={cx - 26} y={cy - 16} width={52} height={32} rx={3} fill="#334155" />
            <text x={cx - 10} y={cy - 3} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily={MONO} stroke="none">
              −1
            </text>
            <text x={cx + 12} y={cy - 3} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily={MONO} stroke="none">
              0
            </text>
            <text x={cx - 10} y={cy + 11} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily={MONO} stroke="none">
              0
            </text>
            <text x={cx + 12} y={cy + 11} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily={MONO} stroke="none">
              −1
            </text>
          </g>
        )}
        <Person who="nasib" x={186} y={150} facing={-1} arm={k >= 1 ? "point" : "down"} label />
        <Person who="som" x={246} y={150} facing={-1} label />
        <Person who="rina" x={296} y={150} facing={-1} label />
        {k === 2 && <Bubble x={186} y={84} side="right" lines={["একটা minus এ", "এক উল্টা।"]} />}
        {k === 3 && <Bubble x={186} y={84} side="right" lines={["দুইটা minus।", "দুইবার উল্টাবে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Before sundown. Z's picture painted on the wall, a left hand. Karim
//      sets the পলিথিন down, one কৌটা left in it. Rina presses her own মেহেদি
//      palm to the wall beside the painted one: two hands, facing.

export function HandsFacing({}: Story) {
  const s = useScene(3, [600, 1800, 2000, 2200]);
  const k = s.k;
  // Rina's real palm, a right hand, upright, at wall (3.4…4.4, 0.6…1.6)
  const palm: Move = (p) => [3.4 + p[0], 0.6 + p[1]];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যার আগে; দেয়ালে রং করা Z এর ছবি, হেলানো বড় হাত, বাম হাত; করিম পলিথিন নামিয়ে রাখলো, এক কৌটা বাকি; রিনা নিজের মেহেদি দেওয়া ডান হাতের তালু দেয়ালে চেপে ধরলো রং করা হাতের পাশে; দুইটা হাত মুখোমুখি">
        <H_StageWall>
          <H_Print f={SF} move={byCols(Z)} />
          {k >= 2 && (
            <g className={FADE}>
              <path d={pathOf(SF, palm, HAND, true)} fill="#e8b88f" stroke={HENNA_DARK} strokeWidth={0.7} strokeLinejoin="round" />
              <path d={pathOf(SF, palm, RING, true)} fill="none" stroke={HENNA} strokeWidth={0.9} />
              <path d={pathOf(SF, palm, DOT, true)} fill={HENNA} />
            </g>
          )}
          {k >= 3 && (
            <g className={POP}>
              <text x={SF.sx(0)} y={SF.sy(3.2)} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK}>
                রং করা: বাম
              </text>
              <text x={SF.sx(3.1)} y={SF.sy(2.1)} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK}>
                রিনার: ডান
              </text>
            </g>
          )}
        </H_StageWall>
        <Person who="rina" x={k >= 2 ? 166 : 186} y={150} facing={-1} arm={k >= 2 ? "point" : "down"} label ms={900} />
        <Person who="karim" x={250} y={150} facing={-1} arm={k === 0 ? "hold" : "down"} label />
        {k === 0 ? <H_StageBag x={238} y={118} n={1} /> : <H_StageBag x={230} y={150} n={1} />}
      </Stage>
    </StoryFrame>
  );
}

// 9c · The bridge to 8.4: evening; the machine's bulb fuses; the লাইট ভাই
//      opens his old lens box; one rim reads [[2, 4], [1, 2]]; "?".

export function BulbFuses() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const PJ: [number, number] = [150, 150];
  const [lx, ly] = projectorLens(PJ[0], PJ[1], 1);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="সন্ধ্যা; যন্ত্রের bulb ফট করে কেটে গেলো; লাইট ভাই পুরানো lens এর বাক্স খুললেন; একটা lens এর পাতে 2 4, 1 2; প্রশ্নবোধক">
        <Projector x={PJ[0]} y={PJ[1]} facing={1} on={k === 0} lens="good" />
        {k === 1 && (
          <g className={POP} stroke="#fde047" strokeWidth={1.2} strokeLinecap="round">
            <path d={`M${lx + 8} ${ly - 8}l5 -5M${lx + 10} ${ly}h7M${lx + 8} ${ly + 8}l5 5`} />
          </g>
        )}
        <LightBhai x={210} y={150} facing={-1} arm={k >= 3 ? "hold" : "down"} nameTone="#e2e8f0" />
        {k >= 2 && <Chest x={250} y={150} open />}
        {k >= 3 && (
          <g className={POP}>
            <circle cx={184} cy={106} r={12} fill="#bae6fd" fillOpacity={0.7} stroke="#e2e8f0" strokeWidth={1.2} />
            <text x={184} y={104} textAnchor="middle" fontSize={7} fontWeight={800} fontFamily={MONO} fill={INK}>
              2 4
            </text>
            <text x={184} y={112} textAnchor="middle" fontSize={7} fontWeight={800} fontFamily={MONO} fill={INK}>
              1 2
            </text>
            <text x={176} y={88} fontSize={18} fontWeight={800} fill="#93c5fd">
              ?
            </text>
          </g>
        )}
        <Person who="rina" x={90} y={150} facing={1} />
        <text x={90} y={161} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#e2e8f0">
          রিনা
        </text>
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Figures for the explanations.

// 1½ · The stake: the stencil's one ঘর = one কৌটা; Z says −3; Karim's
//      reading walks three কৌটা back to the দোকান; and if the wall needs more?

const X1B_SAY = [
  "Stencil এর আলো দেয়ালে এক ঘর। এক ঘরে এক কৌটা রং।",
  "Z এর হিসাব বললো −3।",
  "করিমের পড়া: 3 কম। তিন কৌটা দোকানে ফেরত।",
  "দেয়ালে যদি আসলে বেশি লাগে? পলিথিনে তখন এক কৌটা।",
];
const X1B_F = makeFrame(0, 1, 0, 1, 40, 0);

export function MinusStake() {
  const s = useScene(3, [600, 1600, 2000, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <svg viewBox="0 0 240 96" role="img" aria-label="এক ঘর আলো, এক কৌটা রং; Z এর হিসাব −3; তিন কৌটা দোকানে ফেরত; দেয়ালে বেশি লাগলে কী হবে, প্রশ্নবোধক" className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect x={0} y={0} width={240} height={96} rx={8} fill="#e9e4d8" />
        <g transform="translate(14 10)">
          <H_Print f={X1B_F} />
        </g>
        <text x={34} y={64} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          1 ঘর
        </text>
        <H_Tin x={34} y={86} />
        {k >= 1 && (
          <g className={POP}>
            <rect x={66} y={14} width={34} height={20} rx={4} fill="#0f172a" />
            <text x={83} y={28} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={GLOW}>
              −3
            </text>
          </g>
        )}
        <g>
          {[0, 1, 2, 3].map((i) => {
            const away = k >= 2 && i >= 1;
            return (
              <g key={i} style={{ transform: `translateX(${away ? 70 : 0}px)`, opacity: away ? 0.4 : 1 }} className="transition-[transform,opacity] duration-700 ease-in-out motion-reduce:transition-none">
                <H_Tin x={80 + i * 16} y={86} />
              </g>
            );
          })}
        </g>
        {k >= 2 && (
          <text x={206} y={58} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK} className={POP}>
            দোকান
          </text>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={120} y={10} width={70} height={40} rx={3} fill="none" stroke={BLUE} strokeWidth={1.4} strokeDasharray="4 3" />
            <text x={155} y={37} textAnchor="middle" fontSize={20} fontWeight={800} fill={BLUE}>
              ?
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · The page flip: the stencil's picture folds over the post's line like a
//      page and lands on the other side, the back of the hand showing: a left
//      hand, the same one ঘর.

const X2B_SAY = ["আসল ছাপ: আপার ডান হাত, বুড়ো আঙুল ডানে।", "আয়না ছবিটাকে খুঁটির দাগ বরাবর ভাঁজ করে।", "পাতার মতো উল্টে যাচ্ছে।", "উল্টো পিঠ: বাম হাত। জায়গা সেই এক ঘর।"];
const X2B_T = [0, 0.35, 0.7, 1];
const X2B_F = makeFrame(-1.35, 1.35, -0.25, 1.25, 64, 6); // 185 × 108

export function PageFlip() {
  const s = useScene(3, [600, 1400, 1400, 2200]);
  const k = s.k;
  const [t] = useTween([X2B_T[k]], 700);
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <div className="mx-auto max-w-[13rem]">
        <H_Wall f={X2B_F} label="stencil এর ছবি খুঁটির দাগ বরাবর পাতার মতো উল্টে বাম হাত হয়" width="max-w-none">
          <path d={`M${X2B_F.sx(0)} ${X2B_F.sy(-0.25)}V${X2B_F.sy(1.25)}`} stroke={CHALK} strokeWidth={1.2} strokeDasharray="4 3" />
          {k >= 1 && <H_Print f={X2B_F} ghost soft tone={CHALK} />}
          <H_Print f={X2B_F} move={partway(byCols(M), t)} />
        </H_Wall>
      </div>
    </Scene>
  );
}

// 3½ · Signed area: g and l with the slanted piece between them (4 ঘর). The
//      আয়না runs: halfway the two arrows lie on one line (0), then cross over:
//      4 ঘর again, the other side up: −4.

const X3B_SAY = [
  "g ডানে, l বামে। দুই তীরের মাঝের হেলানো জায়গা 4 ঘর।",
  "আয়না চলছে। মাঝপথে দুই তীর এক লাইনে। জায়গা শূন্য।",
  "ওপারে l ডানে, g বামে। জায়গা আবার 4 ঘর, উল্টো পিঠ।",
  "মাপ একই, পাশ উল্টা। তাই হিসাবে −4। একে বলে signed area.",
];
const X3B_T = [0, 0.5, 1, 1];
const X3B_F = makeFrame(-4.4, 4.4, -0.4, 4.4, 26, 6); // 241 × 137

export function ArrowsCross() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const [t] = useTween([X3B_T[k]], 800);
  const mv = partway(byCols(M), t);
  const g = mv(X3_V[0]);
  const l = mv(X3_V[1]);
  const area = g[0] * l[1] - l[0] * g[1];
  const flat = Math.abs(area) < 0.3;
  const par = pathOf(X3B_F, ID_MOVE, [[0, 0], g, [g[0] + l[0], g[1] + l[1]], l], true);
  const c: XY = [(g[0] + l[0]) / 2, (g[1] + l[1]) / 2];
  const label = k === 1 ? "0" : k === 0 ? "+4" : k === 2 ? "4" : "−4";
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <div className="mx-auto max-w-[16rem]">
        <H_Wall f={X3B_F} label="g আর l এর মাঝের হেলানো জায়গা; আয়নায় মাঝপথে শূন্য, ওপারে আবার 4 ঘর কিন্তু minus" width="max-w-none">
          {k >= 3 && <path d={pathOf(X3B_F, ID_MOVE, [[0, 0], X3_V[0], [4, 4], X3_V[1]], true)} fill="none" stroke={OK} strokeWidth={1.2} strokeDasharray="4 3" />}
          {!flat && <path d={par} fill={area > 0 ? OK : BAD} fillOpacity={0.22} stroke={area > 0 ? OK : BAD} strokeWidth={1.2} className="pointer-events-none" />}
          <Arrow f={X3B_F} from={[0, 0]} to={g} tone="coral" />
          <Arrow f={X3B_F} from={[0, 0]} to={l} tone="violet" />
          <text x={X3B_F.sx(g[0]) + (g[0] >= 0 ? 8 : -8)} y={X3B_F.sy(g[1]) - 4} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={X3_HEX[0]}>
            g
          </text>
          <text x={X3B_F.sx(l[0]) + (l[0] >= 0 ? -8 : 8)} y={X3B_F.sy(l[1]) - 4} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={X3_HEX[1]}>
            l
          </text>
          <H_Chip key={label} f={X3B_F} at={flat ? [0, 3] : c} text={label} tone={k === 1 ? INK : area > 0 ? OK : BAD} />
          {k >= 3 && <H_Chip f={X3B_F} at={[2, 2]} dy={-10} text="+4" tone={OK} />}
        </H_Wall>
      </div>
    </Scene>
  );
}

// 4½ · Trading places: the plain glass's two columns swap; the hand turns
//      over (−1); swap them again and it is the right hand again (+1).

const X4B_SAY = ["খালি কাঁচ: প্রথম column (1, 0), দ্বিতীয় (0, 1)। ডান হাত। +1.", "Column দুইটা জায়গা বদলালো। হাত উল্টালো। −1.", "আরেকবার অদলবদল। আবার ডান হাত, আবার +1।"];
const X4B_T = [0, 1, 0];
const X4B_F = makeFrame(-0.35, 1.35, -0.35, 1.35, 64, 6); // 121 × 121

export function TradePlaces() {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  const [t] = useTween([X4B_T[k]], 800);
  const mv = partway(byCols(P), t);
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <div className="mx-auto flex max-w-[15rem] items-center justify-center gap-3">
        <div className="w-32">
          <H_Wall f={X4B_F} label="খালি কাঁচের দুই column জায়গা বদলালে হাত উল্টায়, আবার বদলালে সোজা" width="max-w-none">
            <path d={`M${X4B_F.sx(-0.35)} ${X4B_F.sy(-0.35)}L${X4B_F.sx(1.35)} ${X4B_F.sy(1.35)}`} stroke={CHALK} strokeWidth={1} strokeDasharray="4 3" />
            <H_Print f={X4B_F} move={mv} />
            <Arrow f={X4B_F} from={[0, 0]} to={mv([1, 0])} tone="amber" w={2.2} />
            <Arrow f={X4B_F} from={[0, 0]} to={mv([0, 1])} tone="teal" w={2.2} />
          </H_Wall>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <X4_Columns t={t} />
          <span key={k} className={`font-mono text-lg font-bold ${k === 1 ? "text-danger" : "text-accent"} ${POP}`}>
            {k === 1 ? "−1" : "+1"}
          </span>
        </div>
      </div>
    </Scene>
  );
}

// 6½ · Spin vs mirror: the real stencil's shadow turns a quarter at a time
//      over both pictures; Nasib's fits at the half turn and stays; the
//      mirror's never does.

const X6B_SAY = [
  "বামে নাসিবের lens এর ছবি, ডানে আয়নার। উপরে আসল হাতের ছায়া।",
  "ছায়া ঘুরছে। আয়নার ছবিতে চারকোনা মিললো, হাত মেলে নাই।",
  "আধা পাকে নাসিবের ছবিতে হুবহু বসে গেলো।",
  "আয়নার ছবিতে এখনো মেলে না।",
  "পুরা এক পাক। আয়নার ছবিতে একবারও বসলো না।",
];
const X6B_A = [0, 90, 180, 270, 360];
const X6B_F = makeFrame(-1.3, 1.3, -1.3, 1.3, 40, 4); // 112 × 112

export function SpinVsMirror() {
  const s = useScene(4, [600, 1600, 1800, 1600, 2400]);
  const k = s.k;
  const [a, b] = useTween([X6B_A[k], Math.min(X6B_A[k], 180)], 700);
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <div className="mx-auto grid max-w-[15rem] grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="min-w-0">
            <div className="mb-0.5 text-center text-xs text-muted">{i === 0 ? "নাসিবের lens" : "আয়না"}</div>
            <H_Wall f={X6B_F} label={i === 0 ? "নাসিবের lens এর ছবি, আসল হাতের ছায়া আধা পাকে বসে যায়" : "আয়নার ছবি, আসল হাতের ছায়া কোনো পাকেই বসে না"} width="max-w-none">
              <H_Print f={X6B_F} move={byCols(i === 0 ? N : M)} />
              <H_Print f={X6B_F} ghost move={rot(i === 0 ? b : a)} tone={i === 0 && k >= 2 ? OK : BLUE} />
            </H_Wall>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// 6½b · Only a mirror undoes a mirror: আয়না once (a left hand), আয়না again
//       (the right hand back).

const X6C_SAY = ["আপার ডান হাত।", "আয়না একবার: বাম হাত।", "আয়না আরেকবার: আবার ডান হাত। উল্টানো ফেরায় আরেকটা উল্টানো।"];
const X6C_F = makeFrame(-1.35, 1.35, -0.25, 1.25, 56, 6); // 163 × 96

export function MirrorTwice() {
  const s = useScene(2, [600, 1600, 2400]);
  const k = s.k;
  const [t] = useTween([k], 800);
  const mv: Move = t <= 1 ? partway(byCols(M), t) : then(byCols(M), partway(byCols(M), t - 1));
  return (
    <Scene scene={s} caption={say(X6C_SAY, k)}>
      <div className="mx-auto max-w-[12rem]">
        <H_Wall f={X6C_F} label="আয়না দুইবার চালালে হাত আবার ডান হাত" width="max-w-none">
          <path d={`M${X6C_F.sx(0)} ${X6C_F.sy(-0.25)}V${X6C_F.sy(1.25)}`} stroke={CHALK} strokeWidth={1.2} strokeDasharray="4 3" />
          <H_Print f={X6C_F} move={mv} />
          <H_Chip key={k} f={X6C_F} at={[k === 1 ? -0.5 : 0.5, 0]} dy={9} text={k === 1 ? "−1" : k === 2 ? "(−1)(−1) = +1" : "+1"} tone={k === 1 ? BAD : OK} />
        </H_Wall>
      </div>
    </Scene>
  );
}

// 9½ · For the side quest: your two hands in the আয়না. A right hand before a
//      mirror; inside it, a left hand.

const X9B_SAY = ["আয়নার সামনে একটা ডান হাত।", "আয়নার ভেতরে যে হাত, সেটা বাম হাত।", "3D তে minus det ঠিক এটাই করে: ডান হাতকে বাম হাত বানায়।"];
const X9B_F = makeFrame(-2.2, 2.2, -0.2, 1.2, 50, 6); // 232 × 82

export function TwoHandsMirror() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const left: Move = (p) => [-1.8 + p[0], p[1]];
  const right: Move = (p) => [1.8 - p[0], p[1]];
  return (
    <Scene scene={s} caption={say(X9B_SAY, k)}>
      <svg viewBox={`0 0 ${X9B_F.W} ${X9B_F.H}`} role="img" aria-label="আয়নার সামনে ডান হাত, আয়নার ভেতরে বাম হাত" className="mx-auto block h-auto w-full max-w-[15rem]">
        <rect x={0} y={0} width={X9B_F.W} height={X9B_F.H} rx={8} fill="#f1f5f9" />
        <rect x={X9B_F.sx(0.05)} y={4} width={X9B_F.sx(2.2) - X9B_F.sx(0.05)} height={X9B_F.H - 8} rx={4} fill="#dbeafe" stroke="#94a3b8" />
        <rect x={X9B_F.sx(0.05) - 3} y={4} width={4} height={X9B_F.H - 8} fill="#64748b" />
        <path d={pathOf(X9B_F, left, HAND, true)} fill="#e8b88f" stroke={HENNA_DARK} strokeWidth={0.8} strokeLinejoin="round" />
        <path d={pathOf(X9B_F, left, RING, true)} fill="none" stroke={HENNA} strokeWidth={1} />
        {k >= 1 && (
          <g className={FADE}>
            <path d={pathOf(X9B_F, right, HAND, true)} fill="#e8b88f" fillOpacity={0.8} stroke={HENNA_DARK} strokeWidth={0.8} strokeLinejoin="round" />
            <path d={pathOf(X9B_F, right, RING, true)} fill="none" stroke={HENNA} strokeWidth={1} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <text x={X9B_F.sx(-1.3)} y={X9B_F.H - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
              ডান হাত
            </text>
            <text x={X9B_F.sx(1.3)} y={X9B_F.H - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
              বাম হাত
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  MinusBet: { start: {}, picked: { bet: 3 }, sealed: { bet: 0, sealed: true }, sealedDark: { bet: 1, sealed: true }, sealedFormula: { bet: 2, sealed: true } },
  MirrorLens: { start: {}, ran: { ran: true }, wrong: { ran: true, pick: 0 }, right: { ran: true, pick: 1 } },
  LeftOfRight: { start: {}, wrong: { p1: 1 }, flipped: { p1: 0, flipped: true }, wrong2: { p1: 0, flipped: true, p2: 0 }, right: { p1: 0, flipped: true, p2: 1 } },
  SwapColumns: { start: {}, wrong: { guess: 0, ran: true }, right: { guess: 1, ran: true } },
  ZOnTheWall: { start: {}, ran: { stage: 1 }, counted: { stage: 2 }, turned: { stage: 3 } },
  TurnIsNotFlip: {
    start: {},
    ran: { ran: [true, false] },
    fit: { ran: [true, false], ang: 180, fitN: true },
    mirror: { tab: 1, ran: [true, true], ang: 90, fitN: true, tried: [0, 90] },
    done: { tab: 1, ran: [true, true], ang: 270, fitN: true, tried: [0, 90, 180, 270] },
  },
  YourSign: { start: {}, set: { flip: true, times: 1 }, wrong: { at: 3, flip: false, times: 2, ran: true }, right: { at: 3, flip: true, times: 2, ran: true } },
  TryWhichHand: { start: {}, wrong: { pick: 0, ran: true }, small: { pick: 2, ran: true }, right: { pick: 1, ran: true } },
  BetOpen: { start: {}, one: { open: [0] }, done: { open: [0, 1, 2, 3] } },
  MehediAfternoon: { rest: { k: 0 }, bhai: { k: 1 }, samin: { k: 2 }, done: {} },
  AynaLens: { rest: { k: 0 }, held: { k: 1 }, done: {} },
  BackToZ: { rest: { k: 0 }, karim: { k: 2 }, done: {} },
  NasibTwoMinus: { rest: { k: 0 }, done: {} },
  HandsFacing: { rest: { k: 0 }, palm: { k: 2 }, done: {} },
  BulbFuses: { fuse: { k: 1 }, done: {} },
  MinusStake: { rest: { k: 0 }, back: { k: 2 }, done: {} },
  PageFlip: { mid: { k: 1 }, edge: { k: 2 }, done: {} },
  ArrowsCross: { rest: { k: 0 }, flat: { k: 1 }, done: {} },
  TradePlaces: { rest: { k: 0 }, swapped: { k: 1 }, done: {} },
  SpinVsMirror: { quarter: { k: 1 }, half: { k: 2 }, done: {} },
  MirrorTwice: { once: { k: 1 }, done: {} },
  TwoHandsMirror: { rest: { k: 0 }, done: {} },
};
