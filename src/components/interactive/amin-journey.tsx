"use client";

import { type ReactNode } from "react";

import { Tup, num } from "@/components/journey/box";
import { Bubble, Person, Robot, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Lit, Plane, makeFrame, mix, type Frame, type XY } from "@/components/journey/plane";
import { Post, STAGE_WALL_F, StageWall, WallBed, WallClip, WallGrid, byCols, partway, useLensRun, type Cols } from "./light-kit";

// Screens for "Math for AI 8.2 — আমিনের মাপ, ad − bc", told as a Journey in the
// author's Bangla-English. The plan is 08_journey_specs.md, block 8.2.
//
// নানা is writing a plot of land to আপা as the wedding gift. The plot lies
// between two slanted আল: from the corner খুঁটি one side runs (3, 1) শিকল
// (east, north), the other (1, 2). The দলিল needs its area, and a field has no
// chalk ঘর to count. The আমিন comes with his শিকল. মামা: এক পাশ মাপো, আরেক
// পাশ মাপো, গুণ দাও.
//
// Nine screens. 1 seals the bet: 12 (করিম, the whole box) · 7 (মামা, side ×
// side) · 6 (নাসিব, half the box) · 5 (সামিন, counted roughly) (PlotBet).
// 2 Mama's rule: lean the plot, sides fixed; side × side stays 7.07 while the
// plot folds flat (SideTimesSide). 3 the আমিন's box: chain east 4, north 3,
// 12 ঘর (TheBox). 4 predict, then cut the six corner pieces off: 5 (CutCorners).
// 5 সোম's letters: (a + b)(c + d) − ac − bd − 2bc = ad − bc (LettersNotNumbers).
// 6 the formula on 8.1's three lenses on the light wall: 3, 4, ¼
// (BackToTheWall). 7 Your turn: the পুকুরপাড় plot, sides (3, 2) and (1, 4):
// 10 (YourPlot). 8 Try it: which of three old plots is 7? (TryPlot). 9 the
// finale (no widget).
//
// After the screens: the story scenes (AminPegs, ChainTaut, SomLetters,
// WallEvening, PukurPlot, DolilDay, SaminMinus) and the watch-only figures
// (DolilBlank, HeightDrops, HalfABox, SidesToLens, BetOpen, ThreeBars).
//
// The নকশা is Rina's chalk grid again, drawn on paper: one ঘর = one শিকল by one
// শিকল. East runs right, north runs up; the corner খুঁটি is (0, 0). The field
// pieces are local; the light wall on screen 6 comes from light-kit.tsx
// (read-only). The plot's first side is amber, the second teal, like the lens
// columns of 7.x/8.1.

const INK = "#0f1b2d";
const PAPER = "#fbf6e8";
const PENCIL = "#64748b";
const AL = "#8a6a3b";
const PLOT_HEX = "#bfe0a0";
const RED = "#e11d48";
const GREEN = "#0d9488";
const BLUE = "#2563eb";
const GLOW = "#fde047";
const STRAW = "#d8c38a";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** What the two numbers of a side count (for journey/box <Tup of>). */
const AJ_SLOTS = ["পূবে কত শিকল", "উত্তরে কত শিকল"] as const;

// ---------------------------------------------------------------------------
// Numbers.

/** আপার জমি: the two sides from the corner খুঁটি, (a, c) and (b, d). */
const APA_A: XY = [3, 1];
const APA_B: XY = [1, 2];

const add = (p: XY, q: XY): XY => [p[0] + q[0], p[1] + q[1]];
const poly = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0])} ${f.sy(p[1])}`).join("") + "Z";
const plotPts = (a: XY, b: XY): XY[] => [[0, 0], a, add(a, b), b];

type Kind = "ac" | "bd" | "bc";
const KIND_HEX: Record<Kind, string> = { ac: "#fcd34d", bd: "#99f6e4", bc: "#fda4af" };
const KIND_INK: Record<Kind, string> = { ac: "#b45309", bd: "#0f766e", bc: "#be123c" };

type Piece = { pts: XY[]; kind: Kind; area: number; out: XY };

/**
 * The six pieces between the plot and its box, for sides (a, c) and (b, d)
 * with the first side the flatter one: two long triangles (ac / 2 each), two
 * tall ones (bd / 2), two small rectangles (b × c). `out` is where a piece
 * lifts off to.
 */
const piecesOf = ([a, c]: XY, [b, d]: XY): Piece[] => [
  { pts: [[0, 0], [a, 0], [a, c]], kind: "ac", area: (a * c) / 2, out: [0, -1] },
  { pts: [[a, 0], [a + b, 0], [a + b, c], [a, c]], kind: "bc", area: b * c, out: [1, -1] },
  { pts: [[a, c], [a + b, c], [a + b, c + d]], kind: "bd", area: (b * d) / 2, out: [1, 0] },
  { pts: [[a + b, c + d], [b, c + d], [b, d]], kind: "ac", area: (a * c) / 2, out: [0, 1] },
  { pts: [[0, d], [b, d], [b, c + d], [0, c + d]], kind: "bc", area: b * c, out: [-1, 1] },
  { pts: [[0, 0], [b, d], [0, d]], kind: "bd", area: (b * d) / 2, out: [-1, 0] },
];
/** the order the আমিন lifts them in: long triangles, tall triangles, small rectangles */
const CUT_ORDER = [0, 3, 2, 5, 1, 4];

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

// ---------------------------------------------------------------------------
// Shared drawing: the নকশা (paper, pencil grid), the plot, the pegs, the শিকল.

function AJ_North({ f }: { f: Frame }) {
  const x = f.W - 11;
  return (
    <g className="pointer-events-none">
      <path d={`M${x} 24V9M${x - 3.5} 13L${x} 8L${x + 3.5} 13`} stroke={PENCIL} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x={x - 6} y={15} textAnchor="end" fontSize={8} fill={PENCIL}>
        উত্তর
      </text>
    </g>
  );
}

/** A bamboo peg at a corner of the plot; `n` writes a small number beside it. */
function AJ_Peg({ f, at, n }: { f: Frame; at: XY; n?: string }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={Math.max(2.6, f.u * 0.09)} fill="#b08d3c" stroke="#6b4f1d" strokeWidth={1} />
      {n && (
        <text x={x + 6} y={y - 5} fontSize={9} fontWeight={800} fill={INK}>
          {n}
        </text>
      )}
    </g>
  );
}

/** The আমিন's নকশা: cream paper, a pencil grid (one ঘর = one শিকল by one শিকল), the corner খুঁটি at (0, 0). */
function AJ_Naksha({ f, label, width = "max-w-[18rem]", nums = true, north = true, children }: { f: Frame; label: string; width?: string; nums?: boolean; north?: boolean; children?: ReactNode }) {
  let d = "";
  for (let x = Math.ceil(f.x0); x <= Math.floor(f.x1); x += 1) d += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  for (let y = Math.ceil(f.y0); y <= Math.floor(f.y1); y += 1) d += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  const fs = Math.max(6.5, Math.min(9, f.u * 0.22));
  const xs: number[] = [];
  for (let x = 1; x <= Math.floor(f.x1); x += 1) xs.push(x);
  const ys: number[] = [];
  for (let y = 1; y <= Math.floor(f.y1); y += 1) ys.push(y);
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} className={`my-0! ${width}`}>
      <rect width={f.W} height={f.H} rx={6} fill={PAPER} stroke="#e2d5b0" />
      <path d={d} stroke={PENCIL} strokeOpacity={0.3} strokeWidth={0.7} fill="none" className="pointer-events-none" />
      {nums && (
        <g className="pointer-events-none" fontSize={fs} fontFamily="ui-monospace, monospace" fill={PENCIL}>
          {xs.map((x) => (
            <text key={`x${x}`} x={f.sx(x)} y={f.sy(0) + fs + 3} textAnchor="middle">
              {x}
            </text>
          ))}
          {ys.map((y) => (
            <text key={`y${y}`} x={f.sx(0) - 4} y={f.sy(y) + fs * 0.35} textAnchor="end">
              {y}
            </text>
          ))}
        </g>
      )}
      {north && <AJ_North f={f} />}
      {children}
      <AJ_Peg f={f} at={[0, 0]} />
    </Plane>
  );
}

/** The plot: green stubble between its four আল. */
function AJ_Plot({ f, a, b, faint = false }: { f: Frame; a: XY; b: XY; faint?: boolean }) {
  return <path d={poly(f, plotPts(a, b))} fill={PLOT_HEX} fillOpacity={faint ? 0.35 : 0.9} stroke={AL} strokeWidth={faint ? 1.4 : 2.4} strokeLinejoin="round" className="pointer-events-none" />;
}

/** The plot's two sides from the corner খুঁটি, as tappable arrows (first amber, second teal). */
function AJ_Sides({ f, a, b, lists, w = 2.4 }: { f: Frame; a: XY; b: XY; lists?: [string, string]; w?: number }) {
  return (
    <>
      <Arrow f={f} from={[0, 0]} to={a} tone="amber" w={w} list={lists?.[0]} />
      <Arrow f={f} from={[0, 0]} to={b} tone="teal" w={w} list={lists?.[1]} />
    </>
  );
}

/** the আমিন's straight box around the plot, dashed */
function AJ_Box({ f, w, h }: { f: Frame; w: number; h: number }) {
  return <rect x={f.sx(0)} y={f.sy(h)} width={w * f.u} height={h * f.u} fill="none" stroke={AL} strokeWidth={1.6} strokeDasharray="5 3" className="pointer-events-none" />;
}

const centre = (pts: readonly XY[]): XY => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

/**
 * One corner piece. `gone` lifts it off outward and fades it; `lit` brightens
 * it; `label` pops its size at its middle and, for a triangle, draws the
 * rectangle it is half of, dashed.
 */
function AJ_Piece({ f, p, gone = false, lit = false, onClick }: { f: Frame; p: Piece; gone?: boolean; lit?: boolean; onClick?: () => void }) {
  const dx = p.out[0] * f.u * 0.8;
  const dy = -p.out[1] * f.u * 0.8;
  return (
    <g
      style={{ transform: gone ? `translate(${dx}px, ${dy}px)` : "translate(0px, 0px)", opacity: gone ? 0 : 1 }}
      className={`transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-none ${onClick && !gone ? "cursor-pointer" : "pointer-events-none"}`}
      onClick={onClick}
    >
      <path d={poly(f, p.pts)} fill={KIND_HEX[p.kind]} fillOpacity={lit ? 0.95 : 0.6} stroke={KIND_INK[p.kind]} strokeOpacity={0.6} strokeWidth={1} strokeLinejoin="round" />
    </g>
  );
}

/** A piece's size at its middle, over the plot; a triangle also shows, dashed, the rectangle it is half of. */
function AJ_PieceTag({ f, p }: { f: Frame; p: Piece }) {
  const [cx, cy] = centre(p.pts);
  const xs = p.pts.map((q) => q[0]);
  const ys = p.pts.map((q) => q[1]);
  const x0 = Math.min(...xs);
  const y1 = Math.max(...ys);
  const tri = p.pts.length === 3;
  return (
    <g className="pointer-events-none">
      {tri && (
        <rect
          x={f.sx(x0)}
          y={f.sy(y1)}
          width={(Math.max(...xs) - x0) * f.u}
          height={(y1 - Math.min(...ys)) * f.u}
          fill={KIND_HEX[p.kind]}
          fillOpacity={0.25}
          stroke={KIND_INK[p.kind]}
          strokeWidth={1.2}
          strokeDasharray="3 2"
          className={FADE}
        />
      )}
      <text x={f.sx(cx)} y={f.sy(cy) + 4} textAnchor="middle" fontSize={Math.max(9, f.u * 0.3)} fontWeight={800} fontFamily="ui-monospace, monospace" fill={KIND_INK[p.kind]} stroke="white" strokeWidth={2.5} paintOrder="stroke" className={POP}>
        {num(p.area)}
      </text>
    </g>
  );
}

/** Box + six pieces + the plot on top: `gone[i]` lifts piece i off. */
function AJ_BoxCut({ f, a, b, box = true, gone = [], lifting = -1, onPiece, glow = [] }: { f: Frame; a: XY; b: XY; box?: boolean; gone?: readonly boolean[]; lifting?: number; onPiece?: (i: number) => void; glow?: readonly number[] }) {
  const P = piecesOf(a, b);
  return (
    <>
      {box && <AJ_Box f={f} w={a[0] + b[0]} h={a[1] + b[1]} />}
      {box && P.map((p, i) => <AJ_Piece key={i} f={f} p={p} gone={!!gone[i]} lit={glow.includes(i) || lifting === i} onClick={onPiece ? () => onPiece(i) : undefined} />)}
      <AJ_Plot f={f} a={a} b={b} />
      {box && lifting >= 0 && <AJ_PieceTag key={lifting} f={f} p={P[lifting]} />}
    </>
  );
}

/** The শিকল laid from `from` towards `to`, drawn to fraction t, with a ring and a count at every whole শিকল. */
function AJ_Chain({ f, from, to, t = 1, off }: { f: Frame; from: XY; to: XY; t?: number; off: XY }) {
  const L = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const end = mix(from, to, t);
  const whole = Math.floor(L * t + 1e-6);
  const rings: number[] = [];
  for (let i = 1; i <= whole; i += 1) rings.push(i);
  return (
    <g className="pointer-events-none">
      <path d={`M${f.sx(from[0])} ${f.sy(from[1])}L${f.sx(end[0])} ${f.sy(end[1])}`} stroke="#57534e" strokeWidth={3} strokeDasharray="2.2 1.6" />
      {rings.map((i) => {
        const p = mix(from, to, i / L);
        return (
          <g key={i} className={POP}>
            <circle cx={f.sx(p[0])} cy={f.sy(p[1])} r={3.2} fill="#fbbf24" stroke="#78350f" strokeWidth={1} />
            <text x={f.sx(p[0]) + off[0]} y={f.sy(p[1]) + off[1]} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#78350f">
              {i}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** a small tick or cross, drawn (glyphs render as emoji on Linux) */
function AJ_Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <svg viewBox="0 0 12 12" className={`size-4 ${POP}`} aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke={GREEN} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" className={`size-4 ${POP}`} aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke={RED} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Four cards: করিম's 12 (the whole box), মামা's 7 (side ×
//     side), নাসিব's 6 (half the box), সামিন's 5 (half-ঘর pieces joined by eye).
//     A pick draws its idea on the নকশা; sealing writes the number into the
//     দলিল's blank with a "?". Never marked.

const NF = makeFrame(-0.7, 4.7, -0.7, 3.7, 50, 6);

const X1_CARDS = [
  { who: "করিম", n: "12", line: "চারদিক ঘিরে পুরাটা" },
  { who: "মামা", n: "7", line: "পাশ × পাশ" },
  { who: "নাসিব", n: "6", line: "পুরাটার অর্ধেক" },
  { who: "সামিন", n: "5", line: "আধা ঘর জোড়া দিয়ে গোনা" },
];

/** cell centres that fall inside আপার জমি (সামিন's rough count) */
const X1_CELLS: XY[] = [
  [0.6, 0.6],
  [1.5, 1.2],
  [2.5, 1.5],
  [1.6, 2],
  [3.4, 2.4],
];

function X1_Idea({ f, pick }: { f: Frame; pick: number | null }) {
  if (pick === 0)
    return (
      <g key="box" className={FADE}>
        <rect x={f.sx(0)} y={f.sy(3)} width={4 * f.u} height={3 * f.u} fill="#fcd34d" fillOpacity={0.25} stroke={AL} strokeWidth={1.8} strokeDasharray="5 3" />
        <text x={f.sx(2)} y={f.sy(3) - 5} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#92400e">
          4 × 3
        </text>
      </g>
    );
  if (pick === 1)
    return (
      <g key="sides" className={FADE}>
        <rect x={f.sx(0)} y={f.sy(2.24)} width={3.16 * f.u} height={2.24 * f.u} fill="#c4b5fd" fillOpacity={0.3} stroke="#7c3aed" strokeWidth={1.6} strokeDasharray="5 3" />
        <text x={f.sx(1.58)} y={f.sy(2.24) - 5} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#6d28d9">
          3.16 × 2.24
        </text>
      </g>
    );
  if (pick === 2)
    return (
      <g key="half" className={FADE}>
        <rect x={f.sx(0)} y={f.sy(3)} width={4 * f.u} height={3 * f.u} fill="none" stroke={AL} strokeWidth={1.4} strokeDasharray="5 3" />
        <path d={poly(f, [[0, 0], [4, 0], [4, 3]])} fill="#fda4af" fillOpacity={0.35} stroke="#be123c" strokeWidth={1.2} strokeDasharray="4 3" />
      </g>
    );
  if (pick === 3)
    return (
      <g key="count" className={FADE}>
        {X1_CELLS.map(([x, y], i) => (
          <circle key={i} cx={f.sx(x)} cy={f.sy(y)} r={4} fill={BLUE} fillOpacity={0.7} style={{ transitionDelay: `${i * 120}ms` }} className={POP} />
        ))}
      </g>
    );
  return null;
}

export function PlotBet() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(700);
  const k = !sealed ? 0 : act.running ? act.k : 2;
  const seal = () => {
    if (pick === null || sealed) return;
    setSealed(true);
    act.play(2, () => pass("বাজি সিল হলো. আগে মামার নিয়ম."));
  };
  return (
    <>
      <AJ_Naksha f={NF} width="max-w-[15rem]" label="আমিনের নকশা: কোনার খুঁটি থেকে আপার জমির এক পাশ পূবে 3, উত্তরে 1 শিকল; আরেক পাশ পূবে 1, উত্তরে 2; বেছে নেওয়া আন্দাজটা নকশার উপর আঁকা">
        <AJ_Plot f={NF} a={APA_A} b={APA_B} />
        <X1_Idea f={NF} pick={pick} />
        <AJ_Sides f={NF} a={APA_A} b={APA_B} />
      </AJ_Naksha>
      <div className="mx-auto mt-2 flex max-w-[15rem] items-center justify-center gap-1.5 rounded-md border border-[#d6c9a3] bg-[#fbf6e8] px-3 py-1.5 text-sm text-[#0f1b2d]">
        <span className="font-semibold">দলিল:</span>
        <span>জমির পরিমাণ</span>
        <span className="inline-block min-w-8 border-b border-dashed border-[#0f1b2d]/60 text-center font-mono font-bold">
          {k >= 1 && pick !== null ? <span className={`${POP} inline-block`}>{X1_CARDS[pick].n}</span> : " "}
        </span>
        <span>ঘর</span>
        {k >= 2 && <span className={`${POP} inline-block font-bold text-cat-blue`}>?</span>}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={pick === i ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => setPick(i)}>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm">
                <span className="font-semibold">{c.who}</span> <span className="font-mono font-bold">{c.n}</span>
              </span>
              {!(sealed && pick !== i) && <span className="text-xs text-muted">{c.line}</span>}
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" className={primaryBtn} disabled={pick === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 2}>আপার জমি কত ঘর? একটা আন্দাজ বেছে বাজি সিল করুন. উত্তর শেষে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Mama's rule. The plot's first side stays put; the second keeps its
//     length and leans. Upright it is a rectangle and side × side is right;
//     leaned, the plot folds flat and Mama's 7.07 never moves.

const LF = makeFrame(-1.1, 5.3, -0.6, 3.4, 44, 6);
const LEN_A = Math.hypot(...APA_A);
const LEN_B = Math.hypot(...APA_B);
const ANG_A = Math.atan2(APA_A[1], APA_A[0]);
/** the second side, `deg` degrees round from the first, same length */
const leanB = (deg: number): XY => [LEN_B * Math.cos(ANG_A + (deg * Math.PI) / 180), LEN_B * Math.sin(ANG_A + (deg * Math.PI) / 180)];

const X2_TH = [90, 45, 22, 6];
const X2_NAME = ["খাড়া", "আপার জমি", "আরো হেলানো", "প্রায় শোয়া"];

/** a small length tag at the middle of a side, pushed off it by `off` px */
function AJ_Len({ f, a, b, text, off, tone }: { f: Frame; a: XY; b: XY; text: string; off: XY; tone: string }) {
  const m = mix(a, b, 0.5);
  return (
    <text x={f.sx(m[0]) + off[0]} y={f.sy(m[1]) + off[1]} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill={tone} stroke={PAPER} strokeWidth={3} paintOrder="stroke" className="pointer-events-none">
      {text}
    </text>
  );
}

export function SideTimesSide() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 1);
  const [seen, setSeen] = useSeed<boolean[]>("seen", [false, true, false, false]);
  const play = usePlay(750);
  const [th] = useTween([X2_TH[at]], 700);
  const b = leanB(th);
  const go = (i: number) => {
    if (play.running) return;
    setAt(i);
    const ns = seen.map((v, j) => v || j === i);
    setSeen(ns);
    if (ns[0] && ns[3] && !(seen[0] && seen[3])) play.play(1, () => pass("হেলালে জায়গা কমে. মামার গুণ টের পায় না."));
    else play.play(1);
  };
  const done = seen[0] && seen[3];
  return (
    <>
      <AJ_Naksha f={LF} width="max-w-[19rem]" label="নকশায় আপার জমি; প্রথম পাশ স্থির, দ্বিতীয় পাশ একই লম্বা রেখে হেলানো যায়; পাশ দুইটার মাপ বদলায় না, জমি চ্যাপ্টা হয়">
        <AJ_Plot f={LF} a={APA_A} b={b} />
        <AJ_Len f={LF} a={[0, 0]} b={APA_A} text="3.16" off={[6, 13]} tone="#b45309" />
        <AJ_Len f={LF} a={[0, 0]} b={b} text="2.24" off={[-14, -4]} tone="#0f766e" />
        <Arrow f={LF} from={[0, 0]} to={APA_A} tone="amber" w={2.4} list="(3, 1)" />
        <Arrow f={LF} from={[0, 0]} to={b} tone="teal" w={2.4} />
      </AJ_Naksha>
      <div className="mt-2 text-center">
        <div className="text-xs text-muted">মামার গুণ, পাশ × পাশ</div>
        <div key={at} className={`${POP} inline-block font-mono text-lg font-bold text-cat-violet`}>
          3.16 × 2.24 = 7.07
        </div>
        {at === 3 && <div className={`${FADE} text-sm text-muted`}>জমি প্রায় একটা দাগ. মামার গুণ তবু 7.07.</div>}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {X2_NAME.map((n, i) => (
          <button key={n} type="button" onClick={() => go(i)} className={`cursor-pointer rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors motion-reduce:transition-none ${at === i ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"}`}>
            {n}
          </button>
        ))}
      </div>
      <Task done={done}>জমিটা একবার খাড়া করুন, একবার প্রায় শুইয়ে দিন. মামার গুণ কী করে, দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The আমিন's box. The শিকল is pulled east along the south edge, 4, then
//     north up the east edge, 3; the box's ঘর light up one by one to 12; then
//     the six pieces round the plot tint.

export function TheBox() {
  const pass = useGate();
  const [phase, setPhase] = useSeed("phase", 0); // 0 · 1 east pulled · 2 north pulled · 3 counted
  const play = usePlay(190);
  const go = () => {
    if (play.running || phase >= 3) return;
    const n = phase + 1;
    setPhase(n);
    play.play(n === 1 ? 4 : n === 2 ? 3 : 12, n === 3 ? () => pass("বাক্স মাপা সোজা: লম্বা × চওড়া.") : undefined);
  };
  const east = phase === 1 && play.running ? play.k / 4 : phase >= 1 ? 1 : 0;
  const north = phase === 2 && play.running ? play.k / 3 : phase >= 2 ? 1 : 0;
  const cells = phase === 3 ? (play.running ? play.k : 12) : 0;
  const counted = phase === 3 && !play.running;
  const cellList: XY[] = [];
  for (let y = 0; y < 3; y += 1) for (let x = 0; x < 4; x += 1) cellList.push([x, y]);
  return (
    <>
      <AJ_Naksha f={NF} nums={false} width="max-w-[17rem]" label="আমিন শিকল টানলেন পূবে 4, তারপর উত্তরে 3; জমির চারপাশে একটা সোজা বাক্স, তার 12টা ঘর; বাক্সের ভেতরে জমি, চারপাশে ছয়টা টুকরা">
        {counted ? (
          <AJ_BoxCut f={NF} a={APA_A} b={APA_B} glow={[0, 1, 2, 3, 4, 5]} />
        ) : (
          <>
            {phase >= 2 && <AJ_Box f={NF} w={4} h={3} />}
            {cellList.slice(0, cells).map(([x, y]) => (
              <rect key={`${x}${y}`} x={NF.sx(x) + 1.5} y={NF.sy(y + 1) + 1.5} width={NF.u - 3} height={NF.u - 3} rx={3} fill="#fcd34d" fillOpacity={0.45} className={POP} />
            ))}
            <AJ_Plot f={NF} a={APA_A} b={APA_B} faint={cells > 0} />
          </>
        )}
        {east > 0 && <AJ_Chain f={NF} from={[0, 0]} to={[4, 0]} t={east} off={[0, 15]} />}
        {north > 0 && <AJ_Chain f={NF} from={[4, 0]} to={[4, 3]} t={north} off={[11, 4]} />}
        {[APA_A, add(APA_A, APA_B), APA_B].map((p) => (
          <AJ_Peg key={`${p}`} f={NF} at={p} />
        ))}
      </AJ_Naksha>
      <div className="mt-2 flex items-center justify-center gap-4 font-mono text-sm font-bold">
        <span className="text-[#92400e]">পূবে {phase >= 1 ? Math.round(east * 4) : "?"}</span>
        <span className="text-[#92400e]">উত্তরে {phase >= 2 ? Math.round(north * 3) : "?"}</span>
        <span className="text-cat-blue">{phase === 3 ? (counted ? "4 × 3 = 12 ঘর" : `${cells} ঘর`) : "বাক্স ?"}</span>
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={play.running || phase >= 3} onClick={go}>
          {phase === 0 ? "পূবে শিকল টানুন" : phase === 1 ? "এবার উত্তরে টানুন" : "বাক্সের ঘর গুনুন"}
        </button>
      </div>
      <Task done={counted}>আমিনের মতো শিকল টানুন: আগে পূবে, তারপর উত্তরে. তারপর বাক্সের ঘর গুনুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Predict, then cut the corners. Guess what is left; then tap each piece:
//     it shows its size (a triangle shows the rectangle it is half of) and
//     lifts off; the count runs 12 → 5.

const X4_OPTS = [
  { n: "6 ঘর", why: "ছয় টুকরা, এক ঘর করে বাদ" },
  { n: "7 ঘর", why: "মামার গুণের সমান" },
  { n: "5 ঘর", why: "তার চেয়েও কম" },
];
const X4_RIGHT = 2;
const X4_NOPE = [
  "6 ধরেছিলেন: ছয় টুকরা, ছয় ঘর. কিন্তু নিচের আর উপরের লম্বা ত্রিকোণ দেড় ঘর করে. বাদ গেলো 7.",
  "7 ধরেছিলেন, মামার গুণ. কিন্তু বাক্স 12, কোনা মিলে 7. জমি থাকলো 5.",
  "",
];
const APA_PIECES = piecesOf(APA_A, APA_B);

export function CutCorners() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [gone, setGone] = useSeed<boolean[]>("gone", [false, false, false, false, false, false]);
  const [lift, setLift] = useSeed("lift", -1);
  const play = usePlay(900);
  const tap = (i: number) => {
    if (guess === null || gone[i] || play.running) return;
    setLift(i);
    const ng = gone.map((v, j) => v || j === i);
    play.play(1, () => {
      setGone(ng);
      setLift(-1);
      if (ng.every(Boolean)) pass("বাক্স থেকে কোনা বাদ: 5 ঘর.");
    });
  };
  const cut = APA_PIECES.reduce((s, p, i) => s + (gone[i] ? p.area : 0), 0);
  const [left] = useTween([12 - cut], 500);
  const over = gone.every(Boolean);
  return (
    <>
      <div className="grid gap-1.5">
        {X4_OPTS.map((o, i) => (
          <Choice key={o.n} n={i} look={predictLook(i, guess, over, X4_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="text-sm">
              <span className="font-mono font-bold">{o.n}</span> <span className="text-muted">· {o.why}</span>
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-2">
        <AJ_Naksha f={NF} width="max-w-[16rem]" label="বাক্সের ভেতরে আপার জমি; চারপাশে ছয়টা টুকরা, দুইটা লম্বা ত্রিকোণ, দুইটা খাড়া ত্রিকোণ, দুইটা ছোট ঘর; tap করলে টুকরার মাপ দেখায়, তারপর উঠে যায়">
          <AJ_BoxCut f={NF} a={APA_A} b={APA_B} gone={gone} lifting={lift} onPiece={guess === null ? undefined : tap} glow={guess === null ? [] : [0, 1, 2, 3, 4, 5]} />
        </AJ_Naksha>
      </div>
      <div className="mt-1 text-center">
        <span className="text-sm text-muted">বাক্সে বাকি </span>
        <span className="font-mono text-lg font-bold text-cat-blue">{num(Math.round(left * 10) / 10)}</span>
        <span className="text-sm text-muted"> ঘর</span>
      </div>
      {over && guess !== null && guess !== X4_RIGHT && <Nope>{X4_NOPE[guess]}</Nope>}
      <Task done={over}>{guess === null ? "আগে guess: কোনা বাদ দিলে কত ঘর থাকবে?" : "এবার টুকরাগুলোয় একটা একটা করে tap করুন. বাক্স থেকে বাদ যাবে."}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · সোম's letters. The same box, with a, b along the bottom and c, d up the
//     side. Four taps: open the box (ac + ad + bc + bd), lift the long
//     triangles (− ac), the tall ones (− bd), the small rectangles (− 2bc);
//     the chips cancel in colour and ad − bc is left.

const X5_BTN = ["বাক্স খুলুন: লম্বা × চওড়া", "লম্বা ত্রিকোণ দুইটা বাদ", "খাড়া ত্রিকোণ দুইটা বাদ", "ছোট ঘর দুইটা বাদ"];
const X5_GROUP: number[][] = [[], [], [0, 3], [2, 5], [1, 4]];

function X5_Chip({ t, tone, struck = false, pop = true }: { t: string; tone: string; struck?: boolean; pop?: boolean }) {
  return (
    <span
      className={`${pop ? POP : ""} inline-block rounded-md px-1.5 py-0.5 font-mono text-sm font-bold transition-opacity duration-500 motion-reduce:transition-none ${struck ? "line-through decoration-2 opacity-40" : ""}`}
      style={{ color: tone, background: `${tone}1f` }}
    >
      {t}
    </span>
  );
}

function X5_Letter({ f, at, t, tone = INK }: { f: Frame; at: XY; t: string; tone?: string }) {
  return (
    <text x={f.sx(at[0])} y={f.sy(at[1]) + 4} textAnchor="middle" fontSize={13} fontWeight={800} fontStyle="italic" fontFamily="ui-monospace, monospace" fill={tone} stroke={PAPER} strokeWidth={3} paintOrder="stroke" className="pointer-events-none">
      {t}
    </text>
  );
}

export function LettersNotNumbers() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const play = usePlay(900);
  const go = () => {
    if (play.running || stage >= 4) return;
    const n = stage + 1;
    setStage(n);
    play.play(1, n === 4 ? () => pass("হেলানো জমি = ad − bc.") : undefined);
  };
  const gone = [0, 1, 2, 3, 4, 5].map((i) => X5_GROUP.slice(0, stage + 1).some((g) => g.includes(i)));
  const next = stage < 4 ? X5_GROUP[stage + 1] : [];
  const AC = KIND_INK.ac;
  const BD = KIND_INK.bd;
  const BC = KIND_INK.bc;
  const AD = "#15803d";
  const done = stage >= 4 && !play.running;
  return (
    <>
      <AJ_Naksha f={NF} nums={false} width="max-w-[16rem]" label="একই বাক্স, সংখ্যার বদলে অক্ষর: নিচে a আর b, পাশে d আর c; বাক্স খুললে ac, ad, bc, bd; ত্রিকোণ আর ছোট ঘর বাদ দিলে থাকে ad − bc">
        <AJ_BoxCut f={NF} a={APA_A} b={APA_B} gone={gone} glow={next} />
        {stage === 1 && (
          <g className={FADE}>
            <path d={`M${NF.sx(3)} ${NF.sy(0)}V${NF.sy(3)}M${NF.sx(0)} ${NF.sy(1)}H${NF.sx(4)}`} stroke={INK} strokeOpacity={0.5} strokeWidth={1.2} strokeDasharray="4 3" className="pointer-events-none" />
            <X5_Letter f={NF} at={[1.5, 0.45]} t="ac" tone={AC} />
            <X5_Letter f={NF} at={[3.5, 0.45]} t="bc" tone={BC} />
            <X5_Letter f={NF} at={[1.5, 2]} t="ad" tone={AD} />
            <X5_Letter f={NF} at={[3.5, 2]} t="bd" tone={BD} />
          </g>
        )}
        <AJ_Sides f={NF} a={APA_A} b={APA_B} lists={["(a, c)", "(b, d)"]} />
        <X5_Letter f={NF} at={[1.5, -0.38]} t="a" />
        <X5_Letter f={NF} at={[3.5, -0.38]} t="b" />
        <X5_Letter f={NF} at={[-0.32, 1]} t="d" />
        <X5_Letter f={NF} at={[-0.32, 2.5]} t="c" />
      </AJ_Naksha>
      <div className="mt-2 flex min-h-16 flex-wrap items-center justify-center gap-1">
        {stage === 0 ? (
          <X5_Chip t="বাক্স = (a + b)(c + d)" tone={INK} pop={false} />
        ) : (
          <>
            <X5_Chip t="ac" tone={AC} struck={stage >= 2} pop={false} />
            <X5_Chip t="+ ad" tone={AD} pop={false} />
            <X5_Chip t="+ bc" tone={BC} struck={stage >= 4} pop={false} />
            <X5_Chip t="+ bd" tone={BD} struck={stage >= 3} pop={false} />
            {stage >= 2 && <X5_Chip t="− ac" tone={AC} struck />}
            {stage >= 3 && <X5_Chip t="− bd" tone={BD} struck />}
            {stage >= 4 && <X5_Chip t="− 2bc" tone={BC} struck />}
            {stage >= 4 && <X5_Chip t="− bc" tone={BC} />}
          </>
        )}
      </div>
      {done && (
        <div className={`${POP} mt-1 text-center font-mono text-lg font-bold`}>
          <span className="font-sans text-base">জমি</span> = <span style={{ color: AD }}>ad</span> <span style={{ color: BC }}>− bc</span>
        </div>
      )}
      {stage < 4 && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={primaryBtn} disabled={play.running} onClick={go}>
            {X5_BTN[stage]}
          </button>
        </div>
      )}
      <Task done={done}>অক্ষর দিয়ে আমিনের কাটা চালান: আগে বাক্স, তারপর টুকরাগুলো. কী বাকি থাকে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Back to the wall. 8.1's three lenses, G, L and H. A tap runs the one
//     ঘর of light through the lens into its patch (the count Rina chalked in
//     8.1 hangs on it), then works ad − bc on the lens's four numbers, main
//     diagonal, then the other; the two agree.

const WF = makeFrame(-0.8, 3.6, -0.6, 3.5, 46, 6);

const X6_LENSES: { name: string; cols: Cols; cells: string[][]; ad: string; bc: string; out: string }[] = [
  { name: "G", cols: [[2, 1], [1, 2]], cells: [["2", "1"], ["1", "2"]], ad: "2·2", bc: "1·1", out: "3" },
  { name: "L", cols: [[2, 0], [0, 2]], cells: [["2", "0"], ["0", "2"]], ad: "2·2", bc: "0·0", out: "4" },
  { name: "H", cols: [[0.5, 0], [0, 0.5]], cells: [["½", "0"], ["0", "½"]], ad: "½·½", bc: "0·0", out: "¼" },
];
const UNIT: XY[] = [[0, 0], [1, 0], [1, 1], [0, 1]];

/** a 2 × 2 in HTML, rows first; `hi` 1 lights the a–d diagonal, 2 the b–c one */
function AJ_Mat({ cells, hi = 0 }: { cells: string[][]; hi?: 0 | 1 | 2 }) {
  return (
    <span className="inline-flex items-stretch font-mono text-sm font-bold">
      <span className="w-1 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
      <span className="grid grid-cols-2 gap-0.5 p-0.5">
        {cells.flatMap((row, i) =>
          row.map((v, j) => {
            const main = i === j;
            const on = (hi === 1 && main) || (hi === 2 && !main);
            return (
              <span key={`${i}${j}`} className={`grid h-6 w-6 place-items-center rounded transition-colors duration-300 motion-reduce:transition-none ${on ? (main ? "bg-[#15803d]/20 text-[#15803d]" : "bg-[#be123c]/15 text-[#be123c]") : ""}`}>
                {v}
              </span>
            );
          }),
        )}
      </span>
      <span className="w-1 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
    </span>
  );
}

export function BackToTheWall() {
  const pass = useGate();
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const [done, setDone] = useSeed<boolean[]>("done", [false, false, false]);
  const run = useLensRun(1100, 22);
  const strip = usePlay(650);
  const choose = (i: number) => {
    if (run.running || strip.running) return;
    setCur(i);
    const nd = done.map((v, j) => v || j === i);
    run.run(() =>
      strip.play(3, () => {
        setDone(nd);
        if (nd.every(Boolean) && !done.every(Boolean)) pass("গুনতে হলো না. চারটা সংখ্যাই যথেষ্ট.");
      }),
    );
  };
  const L = cur === null ? null : X6_LENSES[cur];
  const t = run.running ? run.t : cur !== null ? 1 : 0;
  const sk = cur === null ? 0 : run.running ? 0 : strip.running ? strip.k : done[cur] ? 3 : 0;
  const patch = L ? UNIT.map((p) => partway(byCols(L.cols), t)(p)) : UNIT;
  const mid = centre(patch);
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <Plane f={WF} grid={0} axes={false} paper={false} label="চুনকাম করা দেয়াল, রিনার চকের grid; সাদা দাগে এক ঘর; lens চালালে ঘরের আলো patch হয়ে পড়ে, 8.1 এ গোনা সংখ্যা তার উপর" className="my-0! max-w-[12.5rem]">
          <WallClip f={WF}>
            <WallBed f={WF} door={false} window={false} tree={false} />
            <WallGrid f={WF} nums={false} />
          </WallClip>
          <Post f={WF} />
          {L && <path d={poly(WF, patch)} fill={GLOW} fillOpacity={0.7} stroke="#ca8a04" strokeWidth={1.4} className="pointer-events-none" />}
          <path d={poly(WF, UNIT)} fill="none" stroke="white" strokeWidth={2} strokeDasharray="4 3" className="pointer-events-none" />
          {L && !run.running && (
            <text key={cur} x={cur === 2 ? WF.sx(1.15) : WF.sx(mid[0])} y={WF.sy(mid[1]) + 4} textAnchor={cur === 2 ? "start" : "middle"} fontSize={11} fontWeight={800} fill={INK} stroke="#fef9c3" strokeWidth={3} paintOrder="stroke" className={`${POP} pointer-events-none`}>
              গুনে {L.out}
            </text>
          )}
        </Plane>
        <div className="flex flex-col gap-1.5">
          {X6_LENSES.map((l, i) => (
            <button
              key={l.name}
              type="button"
              disabled={run.running || strip.running}
              onClick={() => choose(i)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl border-2 px-2 py-1 transition-colors motion-reduce:transition-none disabled:cursor-default ${cur === i ? "border-cat-blue bg-cat-blue/10" : done[i] ? "border-accent/60" : "border-border hover:border-cat-blue/60"}`}
            >
              <span className="font-mono text-sm font-bold">{l.name}</span>
              <AJ_Mat cells={l.cells} />
              {done[i] && <AJ_Mark ok />}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex min-h-12 items-center justify-center gap-2">
        {L ? (
          <>
            <AJ_Mat cells={L.cells} hi={sk === 1 ? 1 : sk === 2 ? 2 : 0} />
            <span className="font-mono text-base font-bold">
              {sk >= 1 && <span className={`${POP} inline-block text-[#15803d]`}>{L.ad}</span>}
              {sk >= 2 && <span className={`${POP} inline-block text-[#be123c]`}>&nbsp;−&nbsp;{L.bc}</span>}
              {sk >= 3 && <span className={`${POP} inline-block text-cat-blue`}>&nbsp;=&nbsp;{L.out}</span>}
            </span>
            {sk >= 3 && <AJ_Mark ok />}
          </>
        ) : (
          <span className="text-sm text-muted">একটা lens বেছে নিন.</span>
        )}
      </div>
      <Task done={done.every(Boolean)}>তিনটা lens ই চালান. দেয়ালে গোনা সংখ্যা আর ad − bc মিলে কি না দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn. The পুকুরপাড় plot: pegs 1 at (3, 2), 2 at (1, 4), the far
//     one at (4, 6). The reader reads the two sides off the নকশা into four
//     steppers and runs the আমিন's measure. Right: ad − bc = 10, then the box
//     (24) and its six pieces lift off to 10. Wrong: the sides drawn from the
//     reader's numbers miss the pegs, a red gap to each.

const YF = makeFrame(-0.6, 4.6, -0.6, 6.6, 28, 6);
const PK_A: XY = [3, 2];
const PK_B: XY = [1, 4];

export function YourPlot() {
  const pass = useGate();
  const [m, setM] = useSeed<number[]>("m", [0, 0, 0, 0]); // a, c, b, d
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useSeed("miss", 0);
  const play = usePlay(420);
  const a: XY = [m[0], m[1]];
  const b: XY = [m[2], m[3]];
  const right = a[0] === PK_A[0] && a[1] === PK_A[1] && b[0] === PK_B[0] && b[1] === PK_B[1];
  const set = (i: number, v: number) => {
    if (play.running) return;
    setM(m.map((x, j) => (j === i ? v : x)));
    setRan(false);
  };
  const measure = () => {
    if (play.running) return;
    setRan(true);
    if (right) play.play(8, () => pass("পুকুরপাড়ের জমি: 10 ঘর."));
    else {
      setMiss(miss + 1);
      play.play(2);
    }
  };
  const k = !ran ? 0 : play.running ? play.k : 8;
  const showCut = ran && right;
  const gone = [0, 1, 2, 3, 4, 5].map((i) => k >= 3 + CUT_ORDER.indexOf(i));
  const cut = piecesOf(PK_A, PK_B).reduce((s, p, i) => s + (gone[i] ? p.area : 0), 0);
  const settled = ran && !play.running;
  const gaps: [XY, XY][] = [
    [a, PK_A],
    [b, PK_B],
    [add(a, b), add(PK_A, PK_B)],
  ];
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <AJ_Naksha f={YF} north={false} width="max-w-[10.5rem]" label="পুকুরপাড়ের জমির নকশা: কোনার খুঁটি, খুঁটি 1, খুঁটি 2 আর দূরের কোনা; দুই পাশের সংখ্যা বসিয়ে মাপ চালালে পাশ দুইটা আঁকা হয়">
          {showCut && k >= 2 ? <AJ_BoxCut f={YF} a={PK_A} b={PK_B} gone={gone} /> : <AJ_Plot f={YF} a={PK_A} b={PK_B} faint={ran && !right} />}
          {ran && !right && settled && gaps.map(([p, q], i) => (p[0] === q[0] && p[1] === q[1] ? null : <path key={i} d={`M${YF.sx(p[0])} ${YF.sy(p[1])}L${YF.sx(q[0])} ${YF.sy(q[1])}`} stroke={RED} strokeWidth={2} strokeDasharray="3 2.5" className={`${FADE} pointer-events-none`} />))}
          {ran && (a[0] || a[1] || b[0] || b[1]) ? <AJ_Sides f={YF} a={a} b={b} w={2.2} /> : null}
          <AJ_Peg f={YF} at={PK_A} n="1" />
          <AJ_Peg f={YF} at={PK_B} n="2" />
          <AJ_Peg f={YF} at={add(PK_A, PK_B)} />
        </AJ_Naksha>
        <div className="flex flex-col gap-1 text-sm">
          <div className="font-semibold text-cat-amber">খুঁটি 1 এর আল</div>
          <div className="flex items-center gap-1">
            <span className="w-11 text-xs leading-tight text-muted">পূবে a</span>
            <Stepper value={m[0]} onChange={(v) => set(0, v)} min={0} max={4} label="a" disabled={play.running} />
          </div>
          <div className="flex items-center gap-1">
            <span className="w-11 text-xs leading-tight text-muted">উত্তরে c</span>
            <Stepper value={m[1]} onChange={(v) => set(1, v)} min={0} max={6} label="c" disabled={play.running} />
          </div>
          <div className="mt-1 font-semibold text-cat-teal">খুঁটি 2 এর আল</div>
          <div className="flex items-center gap-1">
            <span className="w-11 text-xs leading-tight text-muted">পূবে b</span>
            <Stepper value={m[2]} onChange={(v) => set(2, v)} min={0} max={4} label="b" disabled={play.running} />
          </div>
          <div className="flex items-center gap-1">
            <span className="w-11 text-xs leading-tight text-muted">উত্তরে d</span>
            <Stepper value={m[3]} onChange={(v) => set(3, v)} min={0} max={6} label="d" disabled={play.running} />
          </div>
        </div>
      </div>
      <div className="mt-2 flex min-h-12 flex-col items-center justify-center">
        {showCut && k >= 1 && (
          <div className={`${POP} font-mono text-base font-bold`}>
            ad − bc = <span className="text-[#15803d]">3·4</span> <span className="text-[#be123c]">− 1·2</span> = <span className="text-cat-blue">10</span>
          </div>
        )}
        {showCut && k >= 2 && (
          <div className="text-sm text-muted">
            আমিনের বাক্স: <span className="font-mono font-bold text-foreground">24 − {num(cut)} = {num(24 - cut)}</span> ঘর
          </div>
        )}
      </div>
      {settled && !right && (
        <Nope key={miss}>
          আপনার আল গিয়ে থামলো <Tup v={a} of={AJ_SLOTS} /> আর <Tup v={b} of={AJ_SLOTS} /> এ. লাল দাগ দেখায় খুঁটি কত দূরে. কোনার খুঁটি থেকে খুঁটি 1 পূবে কত ঘর, উত্তরে কত, নকশায় গুনে দেখুন.
        </Nope>
      )}
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={play.running || (ran && right)} onClick={measure}>
          আমিনের মাপ চালান
        </button>
      </div>
      <Task done={ran && right && !play.running}>নকশা থেকে দুই আলের চারটা সংখ্যা বসান. তারপর মাপ চালান: জমি কত ঘর?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it (step 8). The old দলিল says one plot is 7 ঘর. Three plots from the
//     আমিন's খাতা; a pick boxes it and cuts the corners, the count ending on
//     its size. The tempting one has sides whose product is about 7 (Mama's
//     rule) but holds 5.

const TF = makeFrame(-0.4, 4.4, -0.4, 5.4, 26, 6);
const MF = makeFrame(-0.2, 4.2, -0.2, 5.2, 13, 3);
const X8_PLOTS: { a: XY; b: XY }[] = [
  { a: [3, 1], b: [1, 3] },
  { a: [2, 1], b: [1, 3] },
  { a: [2, 1], b: [1, 4] },
];
const X8_RIGHT = 2;
const X8_NOPE = [
  "বাক্স 4 × 4 = 16. কোনা মিলে 8. এই জমি 8 ঘর, 7 না.",
  "এই জমির দুই পাশ গুণ দিলে প্রায় 7 আসে, মামার নিয়মে. কিন্তু বাক্স 12, কোনা 7. জমি 5.",
  "",
];

export function TryPlot() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const play = usePlay(330);
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    play.play(8, () => (i === X8_RIGHT ? pass("বাক্স থেকে কোনা বাদ দিলেই 7.") : setMiss((x) => x + 1)));
  };
  const k = pick === null ? 0 : play.running ? play.k : 8;
  const P = pick === null ? null : X8_PLOTS[pick];
  const gone = [0, 1, 2, 3, 4, 5].map((i) => k >= 2 + CUT_ORDER.indexOf(i) + 1);
  const box = P ? (P.a[0] + P.b[0]) * (P.a[1] + P.b[1]) : 0;
  const cut = P ? piecesOf(P.a, P.b).reduce((s, p, i) => s + (gone[i] ? p.area : 0), 0) : 0;
  const settled = pick !== null && !play.running;
  return (
    <>
      <div className="mx-auto flex max-w-[15rem] items-center justify-center gap-2 rounded-md border border-[#d6c9a3] bg-[#fbf6e8] px-3 py-1.5 text-sm text-[#0f1b2d]">
        <span className="font-semibold">পুরানো দলিল:</span>
        <span>
          এই জমি <span className="font-mono font-bold">7</span> ঘর
        </span>
      </div>
      {P && (
        <div className="mt-2 flex items-center justify-center gap-3">
          <AJ_Naksha key={pick} f={TF} north={false} width="max-w-[9rem]" label="বেছে নেওয়া জমি; চারপাশে বাক্স, কোনা বাদ, যা থাকে সেটা জমির মাপ">
            {k >= 1 ? <AJ_BoxCut f={TF} a={P.a} b={P.b} gone={gone} /> : <AJ_Plot f={TF} a={P.a} b={P.b} />}
            <AJ_Sides f={TF} a={P.a} b={P.b} w={2} />
          </AJ_Naksha>
          <div className="w-20 shrink-0 text-center">
            <div className="text-xs text-muted">বাক্স − কোনা</div>
            <div className="font-mono text-base font-bold">
              {k >= 1 ? `${box} − ${num(cut)}` : "?"}
            </div>
            <div className={`font-mono text-2xl font-bold ${settled ? (pick === X8_RIGHT ? "text-accent-text" : "text-danger") : "text-cat-blue"}`}>{k >= 1 ? num(box - cut) : ""}</div>
          </div>
        </div>
      )}
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X8_PLOTS.map((p, i) => (
          <Choice key={i} n={i} look={settled && pick === i ? (i === X8_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={play.running || (settled && pick === X8_RIGHT)} onClick={() => choose(i)}>
            <svg viewBox={`0 0 ${MF.W} ${MF.H}`} className="h-auto w-full max-w-[2.7rem]" aria-label={`জমি: এক পাশ (${p.a.join(", ")}), আরেক পাশ (${p.b.join(", ")})`}>
              <rect width={MF.W} height={MF.H} rx={4} fill={PAPER} />
              <AJ_Plot f={MF} a={p.a} b={p.b} />
            </svg>
          </Choice>
        ))}
      </div>
      {settled && pick !== null && pick !== X8_RIGHT && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={settled && pick === X8_RIGHT}>কোন নকশাটা 7 ঘরের জমি? একটায় tap করুন, আমিন মেপে দেখাবেন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. The field after the harvest, seen from the south-west: east
// runs right, north runs up into the distance (fp), ground at 110.

const fp = (p: XY, s = 1, o: [number, number] = [50, 160]): [number, number] => [o[0] + 44 * s * p[0] + 20 * s * p[1], o[1] - 13 * s * p[1]];
const fpath = (pts: readonly XY[], s = 1, o?: [number, number]) => pts.map((p, i) => `${i ? "L" : "M"}${fp(p, s, o).join(" ")}`).join("") + "Z";

/** the harvested field: straw ground with rows of stubble */
function AJ_Stubble({ y0 = 110 }: { y0?: number }) {
  let d = "";
  for (let y = y0 + 5; y < 180; y += 7) for (let x = ((y * 3) % 11) + 2; x < 320; x += 12) d += `M${x} ${y}l1 -3.5M${x + 3} ${y}l-0.6 -3.2`;
  return (
    <g className="pointer-events-none">
      <rect y={y0} width={320} height={180 - y0} fill={STRAW} />
      <path d={d} stroke="#a3894a" strokeWidth={0.8} />
    </g>
  );
}

/** a bamboo peg driven into the ground at (x, y) */
function AJ_StagePeg({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x} ${y}V${y - 12}`} stroke="#b08d3c" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={x} cy={y - 12} r={1.6} fill="#7c5e1e" />
    </g>
  );
}

/**
 * The আমিন: নানার look (old, white beard) with a brown ফতুয়া, a white টুপি, the
 * শিকল coiled on his shoulder, a black umbrella (open, closed or none), and
 * his name under his feet.
 */
function AJ_Amin({ x, y, facing = 1, arm = "hold", walking = false, ms = 1200, umbrella = "open", coil = true }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point"; walking?: boolean; ms?: number; umbrella?: "open" | "closed" | "none"; coil?: boolean }) {
  return (
    <>
      <Person who="nana" x={x} y={y} facing={facing} arm={arm} walking={walking} ms={ms} />
      <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
        <g transform={`scale(${facing} 1)`}>
          <path d="M-8.5 -39.5h17v14q-8.5 3 -17 0Z" fill="#78716c" />
          <path d="M0 -39.5v13" stroke="#57534e" strokeWidth={0.8} />
          <path d="M-8.6 -58.2q8.6 -8 17.2 0Z" fill="white" stroke="#cbd5e1" strokeWidth={0.6} />
          {coil && <ellipse cx={-5} cy={-37} rx={5.5} ry={4} fill="none" stroke="#a16207" strokeWidth={1.6} strokeDasharray="1.6 1" />}
          {umbrella === "open" && (
            <g>
              <path d="M17 -43L12 -82" stroke="#1f2937" strokeWidth={1.4} />
              <path d="M-10 -80Q12 -101 34 -80Q28.5 -84 23 -80Q17.5 -84 12 -80Q6.5 -84 1 -80Q-4.5 -84 -10 -80Z" fill="#111827" />
            </g>
          )}
          {umbrella === "closed" && <path d="M17 -43L21 -4" stroke="#111827" strokeWidth={3.2} strokeLinecap="round" />}
        </g>
        <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          আমিন
        </text>
      </g>
    </>
  );
}

/** the নকশা as a small sheet of paper in a hand, centred at (x, y); `flip` holds it upside down */
function AJ_Sheet({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px) rotate(${flip ? 180 : 0}deg)` }} className="pointer-events-none transition-transform duration-700 ease-in-out motion-reduce:transition-none">
      <rect x={-13} y={-9} width={26} height={18} rx={1.5} fill={PAPER} stroke="#a8a29e" strokeWidth={0.8} />
      <path d="M-8 5L3 1.5L7 -5L-4 -1.5Z" fill={PLOT_HEX} stroke={AL} strokeWidth={0.8} />
      <path d="M10 -2V-7M8.5 -5.5L10 -7.5L11.5 -5.5" stroke={PENCIL} strokeWidth={0.7} fill="none" />
    </g>
  );
}

// 1a · নানার মাঠ after the harvest. The আমিন drives the corner peg; মামা turns
//      the নকশা the wrong way up; Shiku on the আল; মামা's claim.

export function AminPegs({}: Story) {
  const s = useScene(4, [600, 1600, 1600, 2400, 2600]);
  const k = s.k;
  const [cx, cy] = fp([0, 0]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={110} label="ধান কাটা মাঠ; ছাতা মাথায় আমিন কোনার খুঁটি পুঁতলেন; মামা নকশা উল্টা ধরে দেখছেন; আলের উপর Shiku; মামা বললেন, এক পাশ মাপো, আরেক পাশ মাপো, গুণ দাও, জমি মাপা আবার কঠিন কী">
        <AJ_Stubble />
        <path d={fpath(plotPts(APA_A, APA_B))} fill="#c9d98f" fillOpacity={0.55} stroke={AL} strokeWidth={2.6} strokeLinejoin="round" />
        {k >= 1 && (
          <g className={POP}>
            <AJ_StagePeg x={cx} y={cy} />
          </g>
        )}
        <AJ_Amin x={cx + 14} y={cy + 4} arm={k === 1 ? "point" : "hold"} />
        <Person who="mama" x={150} y={162} facing={-1} arm="hold" label />
        <AJ_Sheet x={133} y={120} flip={k >= 2} />
        <Robot x={272} y={124} />
        {k === 3 && <Bubble x={150} y={96} side="mid" lines={["এক পাশ মাপো,", "আরেক পাশ মাপো."]} />}
        {k >= 4 && <Bubble x={150} y={96} side="mid" lines={["গুণ দাও. জমি মাপা", "আবার কঠিন কী."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · The আমিন pulls the শিকল taut: করিম holds the end at the corner খুঁটি;
//      the আমিন walks east to the far corner (4), then north (3); the box
//      closes on the ground round the plot.

export function ChainTaut({}: Story) {
  const s = useScene(3, [600, 2000, 2000, 2200]);
  const k = s.k;
  const O = fp([0, 0]);
  const E = fp([4, 0]);
  const N = fp([4, 3]);
  const amin = k >= 2 ? N : k >= 1 ? E : [O[0] + 22, O[1]];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={110} label="করিম কোনার খুঁটিতে শিকলের মাথা ধরে আছে; আমিন শিকল টেনে পূবে হাঁটলেন 4 শিকল, তারপর উত্তরে 3; মাটিতে জমির চারপাশে একটা সোজা বাক্স">
        <AJ_Stubble />
        <path d={fpath(plotPts(APA_A, APA_B))} fill="#c9d98f" fillOpacity={0.55} stroke={AL} strokeWidth={2.6} strokeLinejoin="round" />
        {k >= 3 && <path d={fpath([[0, 0], [4, 0], [4, 3], [0, 3]])} fill="none" stroke="#78350f" strokeWidth={1.4} strokeDasharray="5 3" className={FADE} />}
        {k >= 1 && <Draw d={`M${O[0]} ${O[1] - 2}L${E[0]} ${E[1] - 2}`} strokeWidth={2.6} ms={1200} className="stroke-[#57534e]" />}
        {k >= 2 && <Draw d={`M${E[0]} ${E[1] - 2}L${N[0]} ${N[1] - 2}`} strokeWidth={2.6} ms={1200} className="stroke-[#57534e]" />}
        {k >= 1 && (
          <text x={(O[0] + E[0]) / 2} y={O[1] + 12} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#78350f" className={POP} style={{ transitionDelay: "900ms" }}>
            4
          </text>
        )}
        {k >= 2 && (
          <text x={(E[0] + N[0]) / 2 - 12} y={(E[1] + N[1]) / 2 + 2} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#78350f" className={POP} style={{ transitionDelay: "900ms" }}>
            3
          </text>
        )}
        <AJ_StagePeg x={O[0]} y={O[1]} />
        <Person who="karim" x={O[0] - 14} y={O[1] + 4} arm="hold" label />
        <AJ_Amin x={amin[0]} y={amin[1] + 4} facing={k >= 2 ? -1 : 1} walking={k === 1 || k === 2} ms={1600} />
      </Stage>
    </StoryFrame>
  );
}

// 5a · সোম on the আল with the নকশা: he strikes the numbers out and writes
//      letters on the two sides.

const SF = makeFrame(-0.4, 4.4, -0.4, 3.4, 26, 4);

export function SomLetters({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সোম আলের উপর নকশা হাতে; পাশের সংখ্যাগুলো কেটে অক্ষর লিখলো, a c আর b d; বললো, অক্ষরে করলে যেকোনো হেলানো জমিতে খাটবে">
        <Person who="som" x={70} y={150} arm="hold" label />
        <g transform="translate(152 36)">
          <rect width={SF.W} height={SF.H} rx={3} fill={PAPER} stroke="#a8a29e" />
          <path d={poly(SF, plotPts(APA_A, APA_B))} fill={PLOT_HEX} stroke={AL} strokeWidth={1.6} />
          <Arrow f={SF} from={[0, 0]} to={APA_A} tone="amber" w={1.8} list={k >= 2 ? "(a, c)" : "(3, 1)"} />
          <Arrow f={SF} from={[0, 0]} to={APA_B} tone="teal" w={1.8} list={k >= 2 ? "(b, d)" : "(1, 2)"} />
          {[
            { at: [1.1, -0.2] as XY, n: "(3, 1)", l: "(a, c)", tone: "#b45309" },
            { at: [0, 2.7] as XY, n: "(1, 2)", l: "(b, d)", tone: "#0f766e" },
          ].map((q) => (
            <g key={q.n}>
              <text x={SF.sx(q.at[0])} y={SF.sy(q.at[1])} fontSize={8} fontWeight={800} fontFamily="ui-monospace, monospace" fill={q.tone} opacity={k >= 1 ? 0.45 : 1}>
                {q.n}
              </text>
              {k >= 1 && <Draw d={`M${SF.sx(q.at[0]) - 1} ${SF.sy(q.at[1]) - 3}h28`} strokeWidth={1.2} className="stroke-[#0f1b2d]" />}
              {k >= 2 && (
                <text x={SF.sx(q.at[0]) + 36} y={SF.sy(q.at[1])} fontSize={9.5} fontWeight={800} fontStyle="italic" fontFamily="ui-monospace, monospace" fill={q.tone} className={POP}>
                  {q.l}
                </text>
              )}
            </g>
          ))}
        </g>
        {k >= 3 && <Bubble x={70} y={84} side="right" lines={["অক্ষরে করলে", "সব জমিতে খাটবে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Evening at home. Rina's painted G patch on the wall and her chalk notes
//      (G 3, L 4, H ¼); সামিন comes with his phone: this time, no counting.

export function WallEvening({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const W = STAGE_WALL_F;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যা; উঠানের দেয়ালে রিনার রং করা G এর patch, পাশে চকে লেখা G 3, L 4, H ¼; সামিন ফোন হাতে এসে বললো, এবার গুনবো না">
        <StageWall x={16} y={30}>
          <path d={poly(W, [[0, 0], [2, 1], [3, 3], [1, 2]])} fill="#facc15" fillOpacity={0.85} stroke="#ca8a04" strokeWidth={1} />
          {["G 3", "L 4", "H ¼"].map((t, i) => (
            <text key={t} x={W.sx(3.6)} y={W.sy(5.2 - i * 1.1)} fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#475569">
              {t}
            </text>
          ))}
        </StageWall>
        <Person who="rina" x={200} y={150} facing={-1} label />
        <Person who="samin" x={k >= 1 ? 250 : 330} y={150} facing={-1} arm="hold" walking={k === 1} label />
        {k >= 2 && <Bubble x={250} y={84} side="left" lines={["গুনে পেয়েছিলাম.", "এবার গুনবো না."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · Next morning, by the পুকুর. নানা shows the second plot, for মামী; the
//      আমিন drives its four pegs.

const PK_O: [number, number] = [70, 172];

export function PukurPlot({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 1800]);
  const k = s.k;
  const pegs = [[0, 0], PK_A, add(PK_A, PK_B), PK_B] as XY[];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={110} label="পুকুরপাড়; নানা হাত দিয়ে দেখালেন আরেকটা জমি, মামীর নামে লেখা হবে; আমিন চারটা খুঁটি পুঁতলেন, জমি আবার হেলানো">
        <AJ_Stubble />
        <ellipse cx={272} cy={126} rx={46} ry={12} fill="#60a5fa" stroke="#1d4ed8" strokeOpacity={0.4} />
        <path d="M236 124q10 -3 20 0M270 130q10 -3 20 0" stroke="white" strokeOpacity={0.7} strokeWidth={1} fill="none" />
        <path d={fpath(pegs, 0.55, PK_O)} fill="#c9d98f" fillOpacity={0.5} stroke={AL} strokeWidth={2} strokeDasharray={k >= 3 ? undefined : "4 3"} strokeLinejoin="round" />
        {k >= 3 &&
          pegs.map((p, i) => {
            const [x, y] = fp(p, 0.55, PK_O);
            return (
              <g key={i} className={POP} style={{ transitionDelay: `${i * 200}ms` }}>
                <AJ_StagePeg x={x} y={y} />
              </g>
            );
          })}
        <Person who="nana" x={k >= 1 ? 176 : 214} y={166} facing={-1} arm={k >= 1 ? "point" : "down"} walking={k === 1} label />
        <AJ_Amin x={52} y={170} arm={k >= 3 ? "point" : "hold"} />
        {k >= 2 && <Bubble x={176} y={100} side="mid" lines={["এইটা লেখা হবে", "মামীর নামে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · The দলিল at নানার বারান্দা: the paper on the জলচৌকি; নানা writes the
//      size in; the আমিন closes his umbrella.

export function DolilDay({}: Story) {
  const s = useScene(2, [600, 2200, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="নানার বারান্দা; জলচৌকির উপর দলিল; নানা জমির পরিমাণ লিখলেন, 50 শতাংশ; আমিন ছাতা বন্ধ করলেন">
        <rect x={0} y={0} width={320} height={12} fill="#9f5a3a" />
        {[24, 296].map((x) => (
          <rect key={x} x={x - 4} y={12} width={8} height={138} fill="#a47148" />
        ))}
        <rect x={112} y={132} width={96} height={6} rx={1} fill="#7c4a24" />
        {[118, 202].map((x) => (
          <rect key={x} x={x - 2} y={138} width={4} height={12} fill="#57331a" />
        ))}
        <g>
          <rect x={126} y={110} width={68} height={22} rx={1.5} fill="white" stroke="#a8a29e" strokeWidth={0.8} />
          <text x={160} y={119} textAnchor="middle" fontSize={7} fontWeight={700} fill={INK}>
            দলিল
          </text>
          <text x={131} y={128} fontSize={6.5} fill={INK}>
            জমি:
          </text>
          {k >= 1 ? (
            <text x={150} y={128} fontSize={7} fontWeight={800} fill="#1d4ed8" className={POP}>
              50 শতাংশ
            </text>
          ) : (
            <path d="M150 128.5h36" stroke={INK} strokeOpacity={0.5} strokeDasharray="2 1.5" strokeWidth={0.8} />
          )}
        </g>
        <Person who="nana" x={96} y={150} arm={k >= 1 ? "point" : "down"} label />
        <AJ_Amin x={250} y={150} facing={-1} arm={k >= 2 ? "down" : "hold"} umbrella={k >= 2 ? "closed" : "open"} />
      </Stage>
    </StoryFrame>
  );
}

// 9b · The bridge to 8.3. Night. সামিন types 7.3's spare Z = [[−1, 1], [2, 1]]
//      into the formula; the phone says −3; he shows সোম.

export function SaminMinus({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাত; সামিন ফোনে Z এর চারটা সংখ্যা বসালো, −1, 1, 2, 1; ফোন দেখালো −1·1 − 1·2 = −3; সামিন সোমকে দেখালো, জায়গা minus?">
        <Person who="samin" x={84} y={150} arm="hold" />
        <Person who="som" x={284} y={150} facing={-1} />
        {[
          [84, "সামিন"],
          [284, "সোম"],
        ].map(([x, n]) => (
          <text key={n} x={x} y={162} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#e2e8f0">
            {n}
          </text>
        ))}
        <g>
          <rect x={150} y={30} width={80} height={116} rx={9} fill="#1e293b" />
          <rect x={155} y={38} width={70} height={100} rx={4} fill="#e0f2fe" />
          <text x={190} y={52} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK}>
            ad − bc
          </text>
          {k >= 1 && (
            <g className={FADE} fontFamily="ui-monospace, monospace" fontWeight={800} fontSize={10}>
              <text x={165} y={70} fill={INK}>
                Z
              </text>
              <path d="M178 60h-2v26h2M214 60h2v26h-2" stroke={INK} strokeWidth={1} fill="none" />
              <text x={186} y={71} textAnchor="middle" fill="#b45309">
                −1
              </text>
              <text x={205} y={71} textAnchor="middle" fill="#0f766e">
                1
              </text>
              <text x={186} y={83} textAnchor="middle" fill="#b45309">
                2
              </text>
              <text x={205} y={83} textAnchor="middle" fill="#0f766e">
                1
              </text>
            </g>
          )}
          {k >= 2 && (
            <text x={190} y={104} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily="ui-monospace, monospace" fill={INK} className={POP}>
              −1·1 − 1·2
            </text>
          )}
          {k >= 3 && (
            <text x={190} y={126} textAnchor="middle" fontSize={16} fontWeight={800} fontFamily="ui-monospace, monospace" fill={RED} className={POP}>
              = −3
            </text>
          )}
        </g>
        {k >= 3 && <Bubble x={84} y={84} side="right" lines={["জায়গা minus?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The stake: the plot on the নকশা, the দলিল with its blank; less written
//      and আপার জমি shrinks on paper, more and it spills into the neighbour's
//      (a মামলা); so the one right number, "?".

const DF = makeFrame(-0.3, 4.3, -0.3, 3.3, 22, 4);
const X1B_SAY = [
  "আপার জমি, নকশায়. দুইটা হেলানো আল.",
  "দলিলে একটা ঘর ফাঁকা: জমির পরিমাণ.",
  "কম লিখলে কাগজে আপার জমি ছোট হয়ে গেলো.",
  "বেশি লিখলে কাগজের জমি পাশের জমিতে ঢুকলো. পরে মামলা.",
  "তাই আন্দাজ না. ঠিক সংখ্যাটা লাগবে: ?",
];

export function DolilBlank() {
  const s = useScene(4, [600, 1600, 2200, 2400, 2400]);
  const k = s.k;
  const shrink: XY[] = [[0.6, 0.4], [2.6, 1.05], [3.3, 2.55], [1.3, 1.95]];
  const grow: XY[] = [[-0.3, -0.25], [3.4, 0.8], [4.3, 3.3], [0.8, 2.35]];
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <svg viewBox="0 0 240 104" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="নকশায় আপার জমি আর দলিলের ফাঁকা ঘর; কম লিখলে জমি ছোট, বেশি লিখলে পাশের জমিতে ঢোকে; তাই ঠিক সংখ্যা লাগবে">
        <g transform="translate(4 8)">
          <rect width={DF.W} height={DF.H} rx={4} fill={PAPER} stroke="#e2d5b0" />
          {k === 3 && <rect x={DF.sx(3.2)} y={0} width={DF.W - DF.sx(3.2)} height={DF.H} fill="#fecaca" opacity={0.6} className={FADE} />}
          {k === 3 && (
            <text x={DF.W - 4} y={DF.H - 4} textAnchor="end" fontSize={7} fill="#9f1239" className={FADE}>
              পাশের জমি
            </text>
          )}
          <path d={poly(DF, plotPts(APA_A, APA_B))} fill={PLOT_HEX} stroke={AL} strokeWidth={1.8} strokeLinejoin="round" />
          {k === 2 && <path d={poly(DF, shrink)} fill="none" stroke={RED} strokeWidth={1.6} strokeDasharray="3 2" className={FADE} />}
          {k === 3 && <path d={poly(DF, grow)} fill="none" stroke={RED} strokeWidth={1.6} strokeDasharray="3 2" className={FADE} />}
        </g>
        {k >= 1 && (
          <g className={FADE}>
            <rect x={132} y={10} width={102} height={84} rx={3} fill="white" stroke="#a8a29e" />
            <text x={183} y={24} textAnchor="middle" fontSize={10} fontWeight={800} fill={INK}>
              দলিল
            </text>
            {[34, 42, 50].map((y) => (
              <path key={y} d={`M140 ${y}h86`} stroke="#cbd5e1" strokeWidth={1.4} />
            ))}
            <text x={140} y={68} fontSize={8} fill={INK}>
              জমির পরিমাণ
            </text>
            <rect x={140} y={73} width={40} height={14} rx={2} fill="none" stroke={INK} strokeOpacity={0.5} strokeDasharray="2 1.5" />
            {k === 2 && (
              <text x={160} y={84} textAnchor="middle" fontSize={9} fontWeight={800} fill={RED} className={POP}>
                কম
              </text>
            )}
            {k === 3 && (
              <text x={160} y={84} textAnchor="middle" fontSize={9} fontWeight={800} fill={RED} className={POP}>
                বেশি
              </text>
            )}
            {k >= 4 && (
              <text x={160} y={85} textAnchor="middle" fontSize={12} fontWeight={800} fill={BLUE} className={POP}>
                ?
              </text>
            )}
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Why side × side misses: the first side lies flat; the second keeps its
//      2.24 and leans; the height of the far আল above the first falls. Mama's
//      product only sees the sides.

const HF = makeFrame(-0.4, 5.5, -0.4, 2.7, 38, 6);
const X2B_SAY = [
  "খাড়া জমি. উল্টা দিকের আল প্রথম আল থেকে 2.24 শিকল উঁচুতে.",
  "হেলালাম. পাশ এখনো 2.24. কিন্তু উল্টা দিকের আল নেমে এলো.",
  "আরো হেলালে আরো নিচে. জমি চ্যাপ্টা.",
  "মামার গুণ দেখে শুধু পাশ দুইটা. আল কতটা নেমে এলো, সেটা দেখে না.",
];

export function HeightDrops() {
  const s = useScene(3, [600, 1800, 1800, 2600]);
  const k = s.k;
  const [th] = useTween([k === 0 ? 90 : k === 1 ? 45 : 22], 900);
  const r = (th * Math.PI) / 180;
  const b: XY = [LEN_B * Math.cos(r), LEN_B * Math.sin(r)];
  const a: XY = [LEN_A, 0];
  const far = add(a, b);
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <svg viewBox={`0 0 ${HF.W} ${HF.H}`} className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="প্রথম আল শোয়ানো; দ্বিতীয় পাশ একই লম্বা রেখে হেলে; উল্টা দিকের আলের উচ্চতা কমতে থাকে; মামার গুণ একই থাকে">
        <rect width={HF.W} height={HF.H} rx={6} fill={PAPER} />
        <path d={poly(HF, [[0, 0], a, far, b])} fill={PLOT_HEX} stroke={AL} strokeWidth={2} strokeLinejoin="round" />
        <path d={`M${HF.sx(far[0])} ${HF.sy(far[1])}V${HF.sy(0)}`} stroke={BLUE} strokeWidth={2} strokeDasharray="4 3" />
        <path d={`M${HF.sx(-0.3)} ${HF.sy(0)}H${HF.sx(5.4)}`} stroke={AL} strokeOpacity={0.35} strokeWidth={1} />
        <text x={HF.sx(far[0]) + 5} y={HF.sy(far[1] / 2) + 4} fontSize={9} fontWeight={700} fill={BLUE}>
          উঁচু
        </text>
        <text x={HF.sx(b[0] / 2) - 5} y={HF.sy(b[1] / 2)} textAnchor="end" fontSize={9.5} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#0f766e" stroke={PAPER} strokeWidth={3} paintOrder="stroke">
          2.24
        </text>
        <text x={HF.sx(LEN_A / 2)} y={HF.sy(0) + 12} textAnchor="middle" fontSize={9.5} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#b45309">
          3.16
        </text>
        {k >= 3 && (
          <text x={HF.W - 8} y={14} textAnchor="end" fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#6d28d9" className={POP}>
            3.16 × 2.24 = 7.07
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · A triangle is half of a box: the long triangle (east 3, north 1) and
//      its twin turned round make a 3 × 1 box, 3 ঘর, so one is 1.5; the tall
//      one (1 × 2) is 1.

const QF = makeFrame(-0.3, 5.3, -0.3, 2.3, 40, 6);
const X4B_SAY = [
  "বাক্সের নিচের ত্রিকোণ. পূবে 3, উত্তরে 1.",
  "একই রকম আরেকটা, উল্টা করে পাশে বসালাম.",
  "দুইটা মিলে একটা সোজা ঘর: 3 × 1, মানে 3 ঘর.",
  "তাই একটা ত্রিকোণ তার অর্ধেক: 1.5 ঘর.",
  "খাড়া ত্রিকোণ একই ভাবে 1 × 2 এর অর্ধেক: 1 ঘর.",
];

export function HalfABox() {
  const s = useScene(4, [600, 1600, 1800, 2200, 2400]);
  const k = s.k;
  const cellsA: number[] = [0, 1, 2];
  const T: XY = [4, 0];
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <svg viewBox={`0 0 ${QF.W} ${QF.H}`} className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="নিচের লম্বা ত্রিকোণ আর তার উল্টা যমজ মিলে 3 × 1 এর সোজা ঘর, তাই ত্রিকোণটা 1.5; খাড়া ত্রিকোণ 1 × 2 এর অর্ধেক, 1">
        <rect width={QF.W} height={QF.H} rx={6} fill={PAPER} />
        {k >= 2 &&
          cellsA.map((x) => (
            <g key={x} className={POP} style={{ transitionDelay: `${x * 180}ms` }}>
              <rect x={QF.sx(x) + 2} y={QF.sy(1) + 2} width={QF.u - 4} height={QF.u - 4} rx={3} fill="none" stroke="#b45309" strokeWidth={1} strokeDasharray="2 2" />
            </g>
          ))}
        <path d={poly(QF, [[0, 0], [3, 0], [3, 1]])} fill={KIND_HEX.ac} fillOpacity={0.85} stroke={KIND_INK.ac} strokeWidth={1.2} strokeLinejoin="round" />
        {k >= 1 && <path d={poly(QF, [[0, 0], [3, 1], [0, 1]])} fill={KIND_HEX.ac} fillOpacity={0.4} stroke={KIND_INK.ac} strokeWidth={1.2} strokeDasharray="3 2" className={POP} />}
        {k >= 2 &&
          cellsA.map((x) => (
            <text key={x} x={QF.sx(x + 0.5)} y={QF.sy(0.62) + 4} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#92400e" stroke="white" strokeWidth={2.5} paintOrder="stroke" className={POP} style={{ transitionDelay: `${x * 180}ms` }}>
              {x + 1}
            </text>
          ))}
        {k >= 3 && (
          <text x={QF.sx(2.2)} y={QF.sy(0.18) + 3} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily="ui-monospace, monospace" fill={KIND_INK.ac} stroke="white" strokeWidth={2.5} paintOrder="stroke" className={POP}>
            1.5
          </text>
        )}
        {k >= 4 && (
          <g className={FADE}>
            <path d={poly(QF, [T, add(T, [1, 2]), add(T, [0, 2])])} fill={KIND_HEX.bd} fillOpacity={0.9} stroke={KIND_INK.bd} strokeWidth={1.2} strokeLinejoin="round" />
            <path d={poly(QF, [T, add(T, [1, 0]), add(T, [1, 2])])} fill={KIND_HEX.bd} fillOpacity={0.35} stroke={KIND_INK.bd} strokeWidth={1.2} strokeDasharray="3 2" />
            <text x={QF.sx(4.3)} y={QF.sy(1.4) + 4} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily="ui-monospace, monospace" fill={KIND_INK.bd} stroke="white" strokeWidth={2.5} paintOrder="stroke">
              1
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 5½ · The plot's two sides stand up as the two columns of a 2 × 2 (8.1's
//      OnlyTheColumns); one diagonal a·d, the other b·c, ad − bc.

const CF = makeFrame(-0.3, 4.3, -0.3, 3.3, 20, 3);
const X5B_SAY = [
  "জমির দুই পাশ: (a, c) আর (b, d).",
  "প্রথম পাশ দাঁড়ালো প্রথম column হয়ে.",
  "দ্বিতীয় পাশ দ্বিতীয় column.",
  "এক কোনাকুনি: a আর d. গুণ, ad.",
  "আরেক কোনাকুনি: b আর c. বাদ দিলে ad − bc.",
];

export function SidesToLens() {
  const s = useScene(4, [600, 1600, 1600, 1800, 2400]);
  const k = s.k;
  const mx = [176, 212];
  const my = [40, 68];
  const cell = (t: string, x: number, y: number, tone: string, on: boolean) =>
    on && (
      <text x={x} y={y + 5} textAnchor="middle" fontSize={16} fontWeight={800} fontStyle="italic" fontFamily="ui-monospace, monospace" fill={tone} stroke="white" strokeWidth={4} paintOrder="stroke" className={POP}>
        {t}
      </text>
    );
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <svg viewBox="0 0 260 104" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="জমির দুই পাশ (a, c) আর (b, d) একটা 2 × 2 এর দুই column হয়ে বসে; a আর d এক কোনাকুনি, b আর c আরেক; ad − bc">
        <rect width={260} height={104} rx={8} fill="white" />
        <g transform="translate(6 12)">
          <rect width={CF.W} height={CF.H} rx={4} fill={PAPER} />
          <path d={poly(CF, plotPts(APA_A, APA_B))} fill={PLOT_HEX} stroke={AL} strokeWidth={1.4} strokeLinejoin="round" />
          <Arrow f={CF} from={[0, 0]} to={APA_A} tone="amber" w={2} list="(a, c)" />
          <Arrow f={CF} from={[0, 0]} to={APA_B} tone="teal" w={2} list="(b, d)" />
        </g>
        <path d={`M${mx[0] - 14} 26h-4v56h4M${mx[1] + 14} 26h4v56h-4`} stroke={INK} strokeOpacity={0.6} strokeWidth={1.4} fill="none" />
        {k === 1 && <Draw d="M88 70Q130 80 168 58" strokeWidth={1.2} className="stroke-[#b45309]" />}
        {k === 2 && <Draw d="M40 30Q120 0 206 30" strokeWidth={1.2} className="stroke-[#0f766e]" />}
        {k >= 3 && <Draw d={`M${mx[0] - 10} ${my[0] - 10}L${mx[1] + 10} ${my[1] + 10}`} strokeWidth={2} className="stroke-[#15803d]/60" />}
        {k >= 4 && <Draw d={`M${mx[1] + 10} ${my[0] - 10}L${mx[0] - 10} ${my[1] + 10}`} strokeWidth={2} className="stroke-[#be123c]/60" />}
        {cell("a", mx[0], my[0], "#b45309", k >= 1)}
        {cell("c", mx[0], my[1], "#b45309", k >= 1)}
        {cell("b", mx[1], my[0], "#0f766e", k >= 2)}
        {cell("d", mx[1], my[1], "#0f766e", k >= 2)}
        {k >= 3 && (
          <text x={194} y={98} textAnchor="middle" fontSize={12} fontWeight={800} fontFamily="ui-monospace, monospace" className={POP}>
            <tspan fill="#15803d">ad</tspan>
            {k >= 4 && <tspan fill="#be123c"> − bc</tspan>}
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 9½ · The bet opened, card by card.

const BO_ROWS: [string, boolean][] = [
  ["করিম: 12, পুরা বাক্স", false],
  ["মামা: 7, পাশ × পাশ", false],
  ["নাসিব: 6, অর্ধেক", false],
  ["সামিন: 5", true],
];
const BO_SAY = [
  "চারটা card.",
  "করিমের 12 পুরা বাক্স. কোনাগুলো আপার না.",
  "মামার 7 শুধু পাশ দেখে, হেলানো দেখে না.",
  "নাসিবের 6 আন্দাজ. কোনা বাদ গেলো 7, 6 না.",
  "সামিনের 5. বাক্স থেকে কোনা বাদ, 12 − 7 = 5.",
];

export function BetOpen({}: Story) {
  const s = useScene(4, [600, 1800, 1800, 1800, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(BO_SAY, k)}>
      <div className="mx-auto grid max-w-[18rem] gap-1.5">
        {BO_ROWS.map(([t, ok], i) => (
          <div key={t} className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm transition-colors duration-500 motion-reduce:transition-none ${k > i ? (ok ? "border-accent bg-accent/10" : "border-border opacity-60") : "border-border"}`}>
            <span>{t}</span>
            {k > i && <AJ_Mark ok={ok} />}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// 9¾ · Side quest: three jobs for the bars. |A| round a matrix is its
//      determinant (আপার জমির lens, 5); |−3| round a number drops the minus;
//      ‖v‖, double bars round an arrow, is its length (3.x).

const X9Q_SAY = [
  "দুই পাশে খাড়া দাগ, ভেতরে matrix: determinant.",
  "আপার জমির lens: 3·2 − 1·1 = 5.",
  "দাগের ভেতরে একটা সংখ্যা: minus টা ফেলে দাও. 3.",
  "দুইটা করে দাগ, ভেতরে arrow: arrow কত লম্বা. 3.16.",
];

export function ThreeBars() {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  const mono = { fontFamily: "ui-monospace, monospace", fontWeight: 800 } as const;
  const ax = 150;
  const ay = 100;
  const hx = ax + 3.16 * 16 * 0.95;
  const hy = ay - 3.16 * 16 * 0.3;
  return (
    <Scene scene={s} caption={say(X9Q_SAY, k)}>
      <svg viewBox="0 0 250 116" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="তিন রকম দাগ: matrix এর দুই পাশে দাগ মানে determinant, 5; সংখ্যার দুই পাশে দাগ মানে minus বাদ, 3; arrow এর দুই পাশে দুইটা করে দাগ মানে তার length, 3.16">
        <rect width={250} height={116} rx={8} fill="white" />
        <g {...mono} fontSize={12} fill={INK}>
          <path d="M20 10V42M58 10V42" stroke={INK} strokeWidth={1.6} />
          <text x={32} y={23} textAnchor="middle" fill="#b45309">3</text>
          <text x={48} y={23} textAnchor="middle" fill="#0f766e">1</text>
          <text x={32} y={38} textAnchor="middle" fill="#b45309">1</text>
          <text x={48} y={38} textAnchor="middle" fill="#0f766e">2</text>
          {k >= 1 && (
            <text x={66} y={31} fill={BLUE} className={POP}>
              = 5
            </text>
          )}
          {k >= 2 && (
            <g className={FADE}>
              <text x={20} y={74}>|−3|</text>
              <text x={58} y={74} fill={BLUE}>
                = 3
              </text>
            </g>
          )}
          {k >= 3 && (
            <g className={FADE}>
              <text x={20} y={104}>‖(3, 1)‖</text>
              <text x={84} y={104} fill={BLUE}>
                = 3.16
              </text>
            </g>
          )}
        </g>
        {k >= 3 && (
          <g className={FADE}>
            <Lit a={[ax, ay]} b={[hx, hy]} list="(3, 1)" w={2.4} color="#b45309">
              <path d={`M${ax} ${ay}L${hx} ${hy}`} stroke="#b45309" strokeWidth={2.4} strokeLinecap="round" />
              <path d={`M${hx} ${hy}l-7 -1.5l2.5 6Z`} fill="#b45309" />
            </Lit>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  PlotBet: { start: {}, picked: { pick: 1 }, sealed: { pick: 3, sealed: true } },
  SideTimesSide: { start: {}, upright: { at: 0, seen: [true, true, false, false] }, flat: { at: 3, seen: [true, true, false, true] } },
  TheBox: { start: {}, east: { phase: 1 }, north: { phase: 2 }, done: { phase: 3 } },
  CutCorners: { start: {}, guessed: { guess: 0 }, lifting: { guess: 0, lift: 0 }, half: { guess: 0, gone: [true, false, false, true, false, false] }, done: { guess: 0, gone: [true, true, true, true, true, true] } },
  LettersNotNumbers: { start: {}, open: { stage: 1 }, two: { stage: 3 }, done: { stage: 4 } },
  BackToTheWall: { start: {}, g: { cur: 0, done: [true, false, false] }, h: { cur: 2, done: [true, true, true] } },
  YourPlot: { start: {}, wrong: { m: [2, 3, 1, 4], ran: true }, done: { m: [3, 2, 1, 4], ran: true } },
  TryPlot: { start: {}, wrong: { pick: 1 }, done: { pick: 2 } },
  AminPegs: { rest: { k: 0 }, flip: { k: 2 }, done: {} },
  ChainTaut: { east: { k: 1 }, done: {} },
  SomLetters: { strike: { k: 1 }, done: {} },
  WallEvening: { rest: { k: 0 }, done: {} },
  PukurPlot: { say: { k: 2 }, done: {} },
  DolilDay: { rest: { k: 0 }, done: {} },
  SaminMinus: { mid: { k: 2 }, done: {} },
  DolilBlank: { less: { k: 2 }, more: { k: 3 }, done: {} },
  HeightDrops: { upright: { k: 0 }, done: {} },
  HalfABox: { twin: { k: 2 }, done: {} },
  SidesToLens: { one: { k: 1 }, done: {} },
  BetOpen: { mid: { k: 2 }, done: {} },
  ThreeBars: { one: { k: 1 }, done: {} },
};
