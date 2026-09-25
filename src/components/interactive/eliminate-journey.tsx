"use client";

import { useId, useState, type ReactNode } from "react";

import { Tup } from "@/components/journey/box";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Plane, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";
import { LightBhai, Projector } from "./light-kit";

// Screens for "Math for AI 10.3 — রসিদ দিয়ে রসিদ কাটা", told as a Journey in
// the author's Bangla-English. The plan is 10_journey_specs.md, block 10.3.
//
// বিকাল, নানাবাড়ি। The লাইট ভাই is back for the ভাড়া of 20 বাড়তি চেয়ার from
// ফিরানির রাত (no রসিদ for that night)। One চেয়ারের ভাড়া was in মামার ভেজা
// খাতা। Two older রসিদ survive: 3 চেয়ার + 2 লাইট = 307, 4 চেয়ার + 1 লাইট =
// 271. On the দামের কাগজ their lines cross between the grid lines: (47, 83).
// Drawing bigger gets close, never exact. Adding two true রসিদ gives a third
// true রসিদ whose line runs through the same crossing; 2 × রসিদ ২ − রসিদ ১
// turns that line straight up: 5 চেয়ার = 235, চেয়ার 47. Back into রসিদ ১:
// লাইট 83। Then three রসিদ, three prices, a staircase.
//
// Nine screens. 1 seals the bet on one চেয়ারের ভাড়া (ChairBet). 2 redraw
// bigger (ZoomFails). 3 add two রসিদ (AddReceipts). 4 predict, then turn the
// combined line (TurnTheLine). 5 walk up the straight line (BackSub). 6 three
// রসিদ into a staircase (ThreeThings). 7 Your turn: the ময়রা's চিরকুট
// (YourElim). 8 Try it: which cut kills the দেশলাই (TryElim). 9 the bet
// opened on the paper (BetOpen); the end is MDX.
//
// After the screens: the story scenes (LightVanBack, FourGuesses, KarimAdds,
// SomIdea, SecondPage, ChirkutArrives, NotesCounted, RinaAtVan) and the
// watch-only figures (ChairStake, PencilFig, ScaleFig, CutBundles, PeelFig,
// AugFig, CostFig), each numbered after its screen.
//
// The দামের কাগজ (PricePaper pieces: Clip, RLine, PaperMarks, Lamp, Slip) is
// kept LOCAL here: 10.1 builds the shared hisab-kit in parallel, and the
// coordinator folds the copies later. light-kit (LightBhai, Projector) and
// arrow-journey (Shiku) are imported read-only.

const INK = "#0f1b2d";
const SOFT = "#5a6b7d";
const MONO = "ui-monospace, monospace";
const BLUE = "#2563eb";
const AMBER = "#d97706";
const TEAL = "#0d9488";
const OK = "#15803d";
const BAD = "#dc2626";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

const sg = (v: number) => (v < 0 ? `−${-v}` : `${v}`);
/** a short decimal with a real minus */
const fmt = (v: number, d = 1) => sg(Math.round(v * 10 ** d) / 10 ** d || 0);

// ---------------------------------------------------------------------------
// The দামের কাগজ, local। A রসিদ is a·x + b·y = t (x the first thing's price,
// y the second's). Its line is every price dot that lights its lamp.

type Rc = { a: number; b: number; t: number };
const R1: Rc = { a: 3, b: 2, t: 307 };
const R2: Rc = { a: 4, b: 1, t: 271 };
const ANS: XY = [47, 83];
const PRICE_SLOTS = ["এক চেয়ারের ভাড়া", "এক লাইটের ভাড়া"] as const;

/** u·p + v·q, a new রসিদ made of two */
const mix = (p: Rc, q: Rc, u: number, v: number): Rc => ({ a: u * p.a + v * q.a, b: u * p.b + v * q.b, t: u * p.t + v * q.t });
const holds = (r: Rc, p: XY) => Math.abs(r.a * p[0] + r.b * p[1] - r.t) < 1e-6;

const LINE = {
  c1: "stroke-[#2563eb]",
  c2: "stroke-[#d97706]",
  cm: "stroke-[#0d9488]",
  ghost: "stroke-[#94a3b8]",
  pen: "stroke-[#475569]",
} as const;
type LineTone = keyof typeof LINE;

/** the line of a রসিদ across a frame (long enough to cross it; clip it) */
function linePath(f: Frame, r: Rc) {
  const n2 = r.a * r.a + r.b * r.b;
  if (n2 < 1e-12) return "";
  const cx = (f.x0 + f.x1) / 2;
  const cy = (f.y0 + f.y1) / 2;
  const s = (r.a * cx + r.b * cy - r.t) / n2;
  const p: XY = [cx - s * r.a, cy - s * r.b];
  const n = Math.sqrt(n2);
  const L = Math.hypot(f.x1 - f.x0, f.y1 - f.y0);
  const d: XY = [(-r.b / n) * L, (r.a / n) * L];
  return `M${f.sx(p[0] - d[0]).toFixed(1)} ${f.sy(p[1] - d[1]).toFixed(1)}L${f.sx(p[0] + d[0]).toFixed(1)} ${f.sy(p[1] + d[1]).toFixed(1)}`;
}

function RLine({ f, r, tone, w = 2.4, draw = false, faint = false, delay = 0 }: { f: Frame; r: Rc; tone: LineTone; w?: number; draw?: boolean; faint?: boolean; delay?: number }) {
  const d = linePath(f, r);
  if (!d) return null;
  if (draw) return <Draw d={d} strokeWidth={w} delay={delay} ms={900} className={LINE[tone]} />;
  return <path d={d} strokeWidth={w} strokeLinecap="round" opacity={faint ? 0.35 : 1} className={`pointer-events-none fill-none ${LINE[tone]}`} />;
}

/** clips its children to the paper of frame f */
function Clip({ f, children }: { f: Frame; children: ReactNode }) {
  const id = `${useId()}c${f.x0}_${f.y1}_${f.u}`.replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

/** numbers along the bottom and left edges, and what each edge counts */
function PaperMarks({ f, step, names = ["চেয়ারের ভাড়া", "লাইটের ভাড়া"], d = 0 }: { f: Frame; step: number; names?: readonly [string, string]; d?: number }) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let x = Math.ceil(f.x0 / step - 1e-9) * step; x <= f.x1 + 1e-9; x += step) xs.push(x);
  for (let y = Math.ceil(f.y0 / step - 1e-9) * step; y <= f.y1 + 1e-9; y += step) ys.push(y);
  return (
    <g className="pointer-events-none">
      {xs.map((x) => (
        <text key={`x${x}`} x={f.sx(x)} y={f.sy(f.y0) + 11} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={SOFT}>
          {fmt(x, d)}
        </text>
      ))}
      {ys.map((y) => (
        <text key={`y${y}`} x={f.sx(f.x0) - 3} y={f.sy(y) + 3} textAnchor="end" fontSize={8} fontFamily={MONO} fill={SOFT}>
          {fmt(y, d)}
        </text>
      ))}
      <text x={f.sx(f.x1) - 3} y={f.sy(f.y0) - 4} textAnchor="end" fontSize={8} fontWeight={600} fill={SOFT} stroke="white" strokeWidth={2.5} paintOrder="stroke">
        {names[0]} →
      </text>
      <text x={f.sx(f.x0) + 3} y={f.sy(f.y1) + 10} fontSize={8} fontWeight={600} fill={SOFT} stroke="white" strokeWidth={2.5} paintOrder="stroke">
        ↑ {names[1]}
      </text>
    </g>
  );
}

/** a রসিদ's lamp: lit when the price dot makes its মোট */
function Lamp({ on, label, tone }: { on: boolean; label: string; tone: "c1" | "c2" | "cm" }) {
  const txt = { c1: "text-cat-blue", c2: "text-cat-amber", cm: "text-cat-teal" }[tone];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold">
      <svg viewBox="-8 -11 16 19" className="h-5 w-4" aria-hidden="true">
        {on && <circle key="g" cy={-3} r={7.6} fill="#fde047" opacity={0.5} className={POP} />}
        <circle cy={-3} r={5} fill={on ? "#facc15" : "#e5e7eb"} stroke={INK} strokeWidth={0.8} className="transition-[fill] duration-300 motion-reduce:transition-none" />
        <rect x={-2.6} y={2} width={5.2} height={4} rx={0.8} fill="#64748b" />
      </svg>
      <span className={txt}>{label}</span>
      <span className="sr-only">{on ? "জ্বলছে" : "নেভা"}</span>
    </span>
  );
}

/** a রসিদ as a paper slip: its two counts and its মোট */
function Slip({ r, name, tone, items = ["চেয়ার", "লাইট"], className = "" }: { r: Rc; name: ReactNode; tone: "c1" | "c2" | "cm"; items?: readonly [string, string]; className?: string }) {
  const edge = { c1: "border-l-[#2563eb]", c2: "border-l-[#d97706]", cm: "border-l-[#0d9488]" }[tone];
  const head = { c1: "text-[#2563eb]", c2: "text-[#b45309]", cm: "text-[#0f766e]" }[tone];
  const n = (v: number) => <b className="font-mono">{sg(Math.round(v))}</b>;
  return (
    <span className={`inline-flex flex-col rounded-md border border-l-4 border-[#cbd5e1] bg-white px-2 py-1 text-[#0f1b2d] shadow-sm ${edge} ${className}`}>
      <span className={`text-[0.68rem] font-bold ${head}`}>{name}</span>
      <span className="text-xs whitespace-nowrap">
        {n(r.a)} {items[0]} · {n(r.b)} {items[1]} · {n(r.t)} টাকা
      </span>
    </span>
  );
}

/** a small চেয়ার, feet at (x, y) */
function ChairIcon({ x, y, s = 1, tone = INK }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <rect x={-4} y={-15} width={8} height={7} rx={1} fill="none" stroke={tone} strokeWidth={1.4} />
      <path d="M-5.5 -7h11M-4 -7v7M4 -7v7" stroke={tone} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** a small লাইট (a bulb), base at (x, y) */
function BulbIcon({ x, y, s = 1, lit = true }: { x: number; y: number; s?: number; lit?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <circle cy={-8} r={4.4} fill={lit ? "#facc15" : "#e5e7eb"} stroke={INK} strokeWidth={0.7} />
      <rect x={-2.2} y={-4} width={4.4} height={3.4} rx={0.6} fill="#64748b" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The দামের কাগজ with the two রসিদ's lines, crossing
//     between the grid lines with a "?". Four cards for one চেয়ারের ভাড়া; a
//     pick drops a dashed line up from its price on the চেয়ার edge to the
//     crossing's height; sealing hangs a "?" on it. Never judged here.

const X1_CARDS = [
  { who: "নাসিব", line: "স্কেলে মাপলাম", v: 45 },
  { who: "সামিন", line: "আমি তো দেখি", v: 48 },
  { who: "মামা", line: "গোল সংখ্যাই হবে", v: 50 },
  { who: "লাইট ভাই", line: "আমার মনে আছে", v: 47 },
];
const X1F = makeFrame(0, 100, 0, 120, 1.7, 20);

export function ChairBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(500);
  const k = !sealed ? 0 : act.running ? act.k : 2;
  const [x] = useTween([bet === null ? 0 : X1_CARDS[bet].v], 500);
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(2, () => pass("বাজি সিল হলো। আগে কাগজটা বড় করি।"));
  };
  const f = X1F;
  return (
    <>
      <div className="mx-auto w-full max-w-[11.5rem]">
        <Plane f={f} grid={10} axes={false} label="দামের কাগজ: ডানে চেয়ারের ভাড়া, উপরে লাইটের ভাড়া; রসিদ ১ আর রসিদ ২ এর লাইন কাটে দুই দাগের মাঝখানে, সেখানে একটা প্রশ্নবোধক" className="my-0! max-w-none">
          <Clip f={f}>
            <RLine f={f} r={R1} tone="c1" w={2} />
            <RLine f={f} r={R2} tone="c2" w={2} />
            {bet !== null && (
              <g>
                <path d={`M${f.sx(x)} ${f.sy(0)}V${f.sy(ANS[1])}`} strokeWidth={1.6} strokeDasharray="3 3" stroke={TEAL} />
                <circle cx={f.sx(x)} cy={f.sy(0)} r={3} fill={TEAL} />
              </g>
            )}
          </Clip>
          <PaperMarks f={f} step={20} />
          <circle cx={f.sx(ANS[0])} cy={f.sy(ANS[1])} r={8} fill="none" stroke={INK} strokeWidth={1} strokeDasharray="2 2" />
          <text x={f.sx(ANS[0]) + 11} y={f.sy(ANS[1]) - 7} fontSize={11} fontWeight={700} fill={INK}>
            ?
          </text>
          {bet !== null && (
            <g key={bet} className={POP}>
              <rect x={f.sx(x) - 12} y={f.sy(0) - 20} width={24} height={13} rx={3} fill="white" stroke={TEAL} strokeWidth={1.2} />
              <text x={f.sx(x)} y={f.sy(0) - 10.5} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill="#0f766e">
                {X1_CARDS[bet].v}
              </text>
            </g>
          )}
          {k >= 1 && bet !== null && (
            <g className={POP}>
              <circle cx={f.sx(x) + 16} cy={f.sy(0) - 14} r={6} fill="#fef3c7" stroke={AMBER} strokeWidth={1} />
              <text x={f.sx(x) + 16} y={f.sy(0) - 10.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#92400e">
                ?
              </text>
            </g>
          )}
        </Plane>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex items-center gap-2 leading-tight">
              <span className="font-mono text-lg font-bold">{c.v}</span>
              <span className="flex flex-col">
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
      <Task done={k >= 2}>এক চেয়ারের ভাড়া কত টাকা? একটা card বেছে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Nasib's way: draw it bigger. Each tap redraws the crossing 5 times
//     bigger (a dashed box shows where). The pencil stays the same pencil, so
//     each line is a band of graphite 3.2px wide; where the bands cross is a
//     small dark diamond, never a point. The readout gives the range of চেয়ার
//     prices inside the diamond, and how big the paper had to get.

const X2_Z = [
  { f: makeFrame(0, 100, 0, 120, 1.9, 20), grid: 10, tick: 20, d: 0, paper: "1 হাত" },
  { f: makeFrame(37, 57, 73, 93, 10, 20), grid: 2, tick: 4, d: 0, paper: "5 হাত" },
  { f: makeFrame(45, 49, 81, 85, 50, 20), grid: 0.5, tick: 1, d: 0, paper: "25 হাত" },
];
const X2_PEN = 3.2;

/** the dark diamond where two pencil bands cross, in data units, and its চেয়ার range */
function diamond(p: Rc, q: Rc, w: number) {
  const h1 = (w / 2) * Math.hypot(p.a, p.b);
  const h2 = (w / 2) * Math.hypot(q.a, q.b);
  const D = p.a * q.b - q.a * p.b;
  const at = (s1: number, s2: number): XY => {
    const T1 = p.t + s1 * h1;
    const T2 = q.t + s2 * h2;
    return [(q.b * T1 - p.b * T2) / D, (p.a * T2 - q.a * T1) / D];
  };
  const pts = [at(1, 1), at(1, -1), at(-1, -1), at(-1, 1)];
  const xs = pts.map((v) => v[0]);
  return { pts, lo: Math.min(...xs), hi: Math.max(...xs) };
}

export function ZoomFails() {
  const pass = useGate();
  const [z, setZ] = useSeed("z", 0);
  const play = usePlay(700);
  const zoom = () => {
    if (z >= 2 || play.running) return;
    const next = z + 1;
    setZ(next);
    play.play(1, next === 2 ? () => pass("আঁকা দিয়ে কাছাকাছি আসে, ঠিকটা আসে না।") : undefined);
  };
  const { f, grid, tick, d } = X2_Z[z];
  const w = X2_PEN / f.u;
  const dia = diamond(R1, R2, w);
  const nx = z < 2 ? X2_Z[z + 1].f : null;
  const landed = !play.running;
  return (
    <>
      <div className="mx-auto w-full max-w-[13rem]">
        <div key={z} className="transition-[scale,opacity] duration-700 motion-reduce:transition-none starting:scale-50 starting:opacity-0">
          <Plane f={f} grid={grid} axes={false} label={`মামার কাগজ ${X2_Z[z].paper}: দুই লাইন pencil এর মোটা দাগ, কাটার জায়গাটা ছোট একটা কালো ঘর`} className="my-0! max-w-none">
            <Clip f={f}>
              <path d={linePath(f, R1)} strokeWidth={X2_PEN} opacity={0.55} className="fill-none stroke-[#2563eb]" />
              <path d={linePath(f, R2)} strokeWidth={X2_PEN} opacity={0.55} className="fill-none stroke-[#d97706]" />
              <path d={dia.pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0]).toFixed(2)} ${f.sy(p[1]).toFixed(2)}`).join("") + "Z"} fill={INK} opacity={0.8} />
              {nx && (
                <rect x={f.sx(nx.x0)} y={f.sy(nx.y1)} width={(nx.x1 - nx.x0) * f.u} height={(nx.y1 - nx.y0) * f.u} fill="none" stroke={TEAL} strokeWidth={1.4} strokeDasharray="4 3" />
              )}
            </Clip>
            <PaperMarks f={f} step={tick} d={d} />
          </Plane>
        </div>
      </div>
      <div className="mt-2 flex flex-col items-center gap-0.5 text-sm">
        {X2_Z.slice(0, z + 1).map((lv, i) => {
          const r = diamond(R1, R2, X2_PEN / lv.f.u);
          const now = i === z;
          if (now && !landed) return null;
          return (
            <span key={i} className={`${FADE} ${now ? "font-semibold" : "text-muted"}`}>
              কাগজ {lv.paper}: চেয়ার {fmt(r.lo, i === 2 ? 2 : 1)} থেকে {fmt(r.hi, i === 2 ? 2 : 1)} এর মাঝে
            </span>
          );
        })}
        {z === 2 && landed && <span className={`${FADE} text-xs text-muted`}>47 এর খুব কাছে। কিন্তু 47 নাকি 47.05, দাগ বলে না।</span>}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={z >= 2 || play.running} onClick={zoom}>
          5 গুণ বড় করে আঁকুন
        </button>
      </div>
      <Task done={z >= 2 && landed}>কাগজ দুইবার 5 গুণ বড় করে আঁকুন। চেয়ারের দাম কতটা ধরা পড়ে, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Karim's idea: add the two রসিদ। Shiku stands at the crossing, both
//     lamps lit. One tap: the second slip slides onto the first, the counts
//     run up to 7 চেয়ার, 3 লাইট, 578 টাকা, the new রসিদ's line draws itself
//     and runs through Shiku; its lamp lights too.

const R3: Rc = { a: 7, b: 3, t: 578 };
const X3F = makeFrame(0, 100, 0, 120, 1.9, 20);

export function AddReceipts() {
  const pass = useGate();
  const [added, setAdded] = useSeed("added", false);
  const play = usePlay(650);
  const k = !added ? 0 : play.running ? play.k : 3;
  const n = useTween(k >= 1 ? [7, 3, 578] : [3, 2, 307], 1000);
  const add = () => {
    if (added) return;
    setAdded(true);
    play.play(3, () => pass("দুই সত্যি রসিদের যোগ: আরেকটা সত্যি রসিদ।"));
  };
  const f = X3F;
  return (
    <>
      <div className="mx-auto w-full max-w-[12rem]">
        <Plane f={f} grid={10} axes={false} label="দামের কাগজে রসিদ ১ আর রসিদ ২ এর লাইন; কাটার জায়গায় Shiku; যোগ করা রসিদের লাইনও ঠিক Shiku এর উপর দিয়ে যায়" className="my-0! max-w-none">
          <Clip f={f}>
            <RLine f={f} r={R1} tone="c1" w={2} />
            <RLine f={f} r={R2} tone="c2" w={2} />
            {k >= 2 && <RLine f={f} r={R3} tone="cm" w={2.8} draw />}
          </Clip>
          <PaperMarks f={f} step={20} />
          {k >= 3 && <circle cx={f.sx(ANS[0])} cy={f.sy(ANS[1])} r={11} fill="none" stroke={TEAL} strokeWidth={1.6} className={POP} />}
          <Shiku f={f} at={ANS} />
        </Plane>
      </div>
      <div className="mt-1.5 flex flex-wrap justify-center gap-x-3">
        <Lamp on label="রসিদ ১" tone="c1" />
        <Lamp on label="রসিদ ২" tone="c2" />
        {added && <Lamp on={k >= 3} label="যোগের রসিদ" tone="cm" />}
      </div>
      <div className="relative mt-2 flex min-h-12 items-center justify-center gap-2">
        {k === 0 ? (
          <>
            <Slip r={R1} name="রসিদ ১" tone="c1" />
            <span className="font-bold text-muted">+</span>
            <Slip r={R2} name="রসিদ ২" tone="c2" />
          </>
        ) : (
          <Slip key="sum" r={{ a: n[0], b: n[1], t: n[2] }} name="রসিদ ১ + রসিদ ২" tone="cm" className={POP} />
        )}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={added} onClick={add}>
          দুইটা রসিদ যোগ করুন
        </button>
      </div>
      <Task done={k >= 3}>দুইটা রসিদ যোগ করুন। নতুন রসিদের লাইন কোথা দিয়ে যায়, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Predict, then turn the line. "k × রসিদ ২ − রসিদ ১": the reader dials k
//     and the combined line spins around the crossing (the tween glides k, so
//     every in-between line passes through it too). At k = 2 the লাইট count
//     is 0 and the line stands straight up at 47: 5 চেয়ার = 235, and five
//     chairs share the 235.

const X4_OPTS = [
  { text: "যাবে। লাইন খাড়া হবে, crossing এর উপর দিয়েই", pic: "up" },
  { text: "যাবে না। লাইট কমবে, শূন্য হবে না", pic: "slant" },
  { text: "যাবে, কিন্তু লাইন crossing ছেড়ে সরে যাবে", pic: "off" },
] as const;
const X4_RIGHT = 0;
const X4F = makeFrame(0, 100, 0, 120, 1.9, 20);

function X4_Pic({ pic }: { pic: "up" | "slant" | "off" }) {
  return (
    <svg viewBox="0 0 48 36" className="h-8 w-11 shrink-0" aria-hidden="true">
      <rect x={1} y={1} width={46} height={34} rx={3} fill="white" stroke="#cbd5e1" />
      <path d="M8 6L40 30" stroke={BLUE} strokeWidth={1.4} opacity={0.5} />
      <path d="M16 4L32 32" stroke={AMBER} strokeWidth={1.4} opacity={0.5} />
      {pic === "up" && <path d="M24 3V33" stroke={TEAL} strokeWidth={2.4} />}
      {pic === "slant" && <path d="M6 22L42 14" stroke={TEAL} strokeWidth={2.4} />}
      {pic === "off" && <path d="M36 3V33" stroke={TEAL} strokeWidth={2.4} />}
      <circle cx={24} cy={18} r={2} fill={INK} />
    </svg>
  );
}

export function TurnTheLine() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [k, setK] = useSeed("kk", 1);
  const [found, setFound] = useSeed("found", false);
  const show = usePlay(600);
  const [kt] = useTween([k], 700);
  const r = mix(R2, R1, kt, -1);
  const card = mix(R2, R1, k, -1);
  const turn = (v: number) => {
    setK(v);
    if (v === 2 && !found) {
      setFound(true);
      show.play(2, () => pass("লাইট উধাও: 5 চেয়ার = 235, চেয়ার 47।"));
    }
  };
  const straight = k === 2 && Math.abs(kt - 2) < 0.02;
  const beats = !found ? 0 : show.running ? show.k : 2;
  const f = X4F;
  return (
    <>
      <div className="mx-auto w-full max-w-[10rem]">
        <Plane f={f} grid={10} axes={false} label="দামের কাগজে রসিদ ১ আর ২ হালকা; মিলানো রসিদের লাইন crossing ঘিরে ঘোরে; রসিদ ২ দুইবার নিলে লাইন খাড়া, চেয়ার 47 এর উপর" className="my-0! max-w-none">
          <Clip f={f}>
            <RLine f={f} r={R1} tone="c1" w={1.8} faint />
            <RLine f={f} r={R2} tone="c2" w={1.8} faint />
            {guess !== null && <RLine f={f} r={r} tone="cm" w={3} />}
          </Clip>
          <PaperMarks f={f} step={20} />
          <circle cx={f.sx(ANS[0])} cy={f.sy(ANS[1])} r={3.2} fill={INK} />
          {straight && beats >= 1 && (
            <g className={POP}>
              <rect x={f.sx(47) - 12} y={f.sy(0) - 18} width={24} height={13} rx={3} fill="white" stroke={TEAL} strokeWidth={1.2} />
              <text x={f.sx(47)} y={f.sy(0) - 8.5} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill="#0f766e">
                47
              </text>
            </g>
          )}
        </Plane>
      </div>
      {guess === null ? (
        <div className="mt-2 flex flex-col gap-1.5">
          {X4_OPTS.map((o, i) => (
            <Choice key={o.pic} n={i} look="idle" disabled={false} onClick={() => setGuess(i)}>
              <span className="flex items-center gap-2 text-sm leading-tight">
                <X4_Pic pic={o.pic} />
                {o.text}
              </span>
            </Choice>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-1.5 flex justify-center">
            <Slip r={card} name={`${k} × রসিদ ২ − রসিদ ১`} tone="cm" />
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-2 text-sm">
            <span className="text-muted">রসিদ ২ কয়বার</span>
            <Stepper value={k} onChange={turn} min={0} max={3} label="রসিদ ২ কয়বার" />
          </div>
          {straight && beats >= 2 && (
            <div className={`${FADE} mt-1 flex items-center justify-center gap-2`}>
              <svg viewBox="0 0 150 30" className="h-auto w-full max-w-[7.5rem]" aria-label="5 টা চেয়ার, প্রতিটার নিচে 47">
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i} className={POP} style={{ transitionDelay: `${i * 120}ms` }}>
                    <ChairIcon x={15 + i * 30} y={14} tone="#0f766e" />
                    <text x={15 + i * 30} y={27} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} className="fill-cat-teal">
                      47
                    </text>
                  </g>
                ))}
              </svg>
              <span className="text-sm leading-tight font-semibold text-accent-text">5 চেয়ার = 235 টাকা। এক চেয়ার 47।</span>
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-center gap-2 text-xs leading-tight">
            <X4_Pic pic={X4_OPTS[guess].pic} />
            <span>
              <span className="text-muted">আপনার guess: </span>
              <span className={found && !show.running ? (guess === X4_RIGHT ? "font-semibold text-accent-text" : "text-danger") : ""}>{X4_OPTS[guess].text}</span>
              {found && !show.running && <span className={FADE}>{guess === X4_RIGHT ? ". মিললো।" : ". টিকলো না: লাইন খাড়া হলো, crossing এর উপরেই।"}</span>}
            </span>
          </div>
        </>
      )}
      <Task done={found && !show.running}>{guess === null ? "আগে guess: লাইট শূন্য, এমন রসিদ বানানো যাবে?" : "রসিদ ২ কয়বার নিবেন, বদলান। লাইট কখন উধাও হয়, দেখুন।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Back-substitution, walked. The straight line চেয়ার = 47 stands on the
//     paper. Shiku starts at its foot; ±1 / ±10 walk him up and down it, one
//     taka a frame. A bar fills with রসিদ ১'s মোট for the spot he's on; at
//     লাইট 83 it meets 307 and both lamps light.

const X5F = makeFrame(0, 100, 0, 120, 1.9, 20);
const X5_STEP = [-10, -1, 1, 10];
const X5_V: Rc = { a: 1, b: 0, t: 47 };

export function BackSub() {
  const pass = useGate();
  const [l, setL] = useSeed("l", 0);
  const [from, setFrom] = useState(l);
  const walk = usePlay(30);
  const cur = walk.running ? from + Math.sign(l - from) * walk.k : l;
  const go = (d: number) => {
    const next = Math.max(0, Math.min(120, l + d));
    if (next === l) return;
    setFrom(cur);
    setL(next);
    walk.play(Math.abs(next - cur), () => {
      if (next === ANS[1]) pass("একটা পেলে, অন্যটা এক ধাপে।");
    });
  };
  const at: XY = [47, cur];
  const total = 3 * 47 + 2 * cur;
  const on1 = holds(R1, at);
  const on2 = holds(R2, at);
  const f = X5F;
  const btn =
    "grid h-9 min-w-11 cursor-pointer place-items-center rounded-full border-2 border-cat-blue px-2 font-mono text-sm font-semibold text-cat-blue transition-colors hover:bg-cat-blue/10 disabled:cursor-default disabled:opacity-40";
  return (
    <>
      <div className="mx-auto w-full max-w-[11.5rem]">
        <Plane f={f} grid={10} axes={false} label="দামের কাগজে খাড়া লাইন চেয়ার 47; Shiku সেই লাইন ধরে উপরে হাঁটে; লাইট 83 তে রসিদ ১ আর রসিদ ২ দুইটার lamp জ্বলে" className="my-0! max-w-none">
          <Clip f={f}>
            <RLine f={f} r={R1} tone="c1" w={1.8} />
            <RLine f={f} r={R2} tone="c2" w={1.8} />
            <RLine f={f} r={X5_V} tone="cm" w={2.6} />
            <path d={`M${f.sx(47)} ${f.sy(0)}V${f.sy(cur)}`} strokeWidth={3} strokeDasharray="2 3" className="fill-none stroke-cat-violet/60" />
          </Clip>
          <PaperMarks f={f} step={20} />
          {on1 && <circle cx={f.sx(47)} cy={f.sy(cur)} r={12} fill="none" stroke={OK} strokeWidth={1.6} className={POP} />}
          <Shiku f={f} at={at} />
        </Plane>
      </div>
      <div className="mt-1 text-center text-sm">
        Shiku: <span className="font-mono">
          <Tup v={at} of={PRICE_SLOTS} />
        </span>
      </div>
      <div className="mx-auto mt-1 w-full max-w-[15rem]">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-cat-blue">রসিদ ১ এর মোট, এই দামে</span>
          <span className="font-mono font-semibold">{total} / 307</span>
        </div>
        <div className="relative mt-0.5 h-3 rounded-full bg-foreground/10">
          <div className={`h-3 rounded-full ${on1 ? "bg-[#15803d]" : total > 307 ? "bg-[#dc2626]" : "bg-[#2563eb]"}`} style={{ width: `${Math.min(100, (total / 400) * 100)}%` }} />
          <div className="absolute top-[-3px] h-[18px] w-0.5 bg-foreground" style={{ left: `${(307 / 400) * 100}%` }} />
        </div>
      </div>
      <div className="mt-1.5 flex justify-center gap-3">
        <Lamp on={on1} label="রসিদ ১" tone="c1" />
        <Lamp on={on2} label="রসিদ ২" tone="c2" />
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {X5_STEP.map((d) => (
          <button key={d} type="button" className={btn} disabled={(d < 0 && l <= 0) || (d > 0 && l >= 120)} onClick={() => go(d)} aria-label={`লাইটের দাম ${Math.abs(d)} ${d < 0 ? "কম" : "বেশি"}`}>
            {d > 0 ? `+${d}` : `−${-d}`}
          </button>
        ))}
      </div>
      <Task done={on1 && on2 && !walk.running}>খাড়া লাইন ধরে Shiku কে হাঁটান। দুইটা lamp কখন জ্বলে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Three রসিদ, three prices (চেয়ার, লাইট, স্পিকার): 47, 83, 150। Tap the
//     রসিদ to cut, then a রসিদ above it to cut with; the multiple is the one
//     that kills the cut রসিদ's leftmost thing. The ghost of m × that রসিদ
//     slides in under the row, the row's numbers change, the killed cell goes
//     grey. Once the staircase stands, peel from the bottom: স্পিকার 150,
//     লাইট 83, চেয়ার 47।

type Row = [number, number, number, number];
const X6_START: Row[] = [
  [1, 1, 1, 280],
  [2, 3, 3, 793],
  [1, 2, 4, 813],
];
const X6_NAMES = ["চেয়ার", "লাইট", "স্পিকার"] as const;
const X6_RN = ["১", "২", "৩"] as const;
const lead = (r: Row) => [0, 1, 2].find((i) => r[i] !== 0) ?? 3;
const stair = (rows: Row[]) => rows[1][0] === 0 && rows[2][0] === 0 && rows[2][1] === 0;
const peelOf = (rows: Row[]) => {
  const s = rows[2][3] / rows[2][2];
  const l = (rows[1][3] - rows[1][2] * s) / rows[1][1];
  const c = (rows[0][3] - rows[0][1] * l - rows[0][2] * s) / rows[0][0];
  return [c, l, s];
};

export function ThreeThings() {
  const pass = useGate();
  const [rows, setRows] = useSeed<Row[]>("rows", X6_START);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [cut, setCut] = useState<{ t: number; s: number; m: number } | null>(null);
  const [nope, setNope] = useState<string | null>(null);
  const [miss, setMiss] = useState(0);
  const [peeled, setPeeled] = useSeed("peeled", false);
  const run = usePlay(650);
  const peel = usePlay(750);
  const busy = run.running || peel.running;
  const no = (s: string) => {
    setNope(s);
    setMiss((m) => m + 1);
  };
  const tap = (i: number) => {
    if (busy || stair(rows)) return;
    setNope(null);
    if (pick === null) {
      if (i === 0) return no("সবার উপরের রসিদটা থাকুক। নিচের একটা বাছুন, যেটা কাটবেন।");
      if (lead(rows[i]) >= i) return no(`এই রসিদ আগেই কাটা। বাকি রসিদ বাছুন।`);
      setPick(i);
      return;
    }
    if (i === pick) {
      setPick(null);
      return;
    }
    if (i > pick) return no("যেটা দিয়ে কাটবেন, সেটা উপরের একটা রসিদ।");
    const L = lead(rows[pick]);
    const Ls = lead(rows[i]);
    if (Ls > L) return no(`এই রসিদে ${X6_NAMES[L]} আছে, ওই রসিদে নাই। ওটা দিয়ে ${X6_NAMES[L]} কাটবে না।`);
    if (Ls < L) return no(`এই রসিদে ${X6_NAMES[Ls]} আগেই উধাও। ওটা দিয়ে কাটলে ${X6_NAMES[Ls]} আবার ফিরে আসবে।`);
    const m = rows[pick][L] / rows[i][L];
    if (!Number.isInteger(m)) return no("আধা রসিদ লাগবে। আরেকটা রসিদ দিয়ে কাটুন।");
    const t = pick;
    setCut({ t, s: i, m });
    run.play(2, () => {
      const next = rows.map((r, j) => (j === t ? (r.map((v, c) => v - m * rows[i][c]) as Row) : r));
      setRows(next);
      setCut(null);
      setPick(null);
    });
  };
  const open = () => {
    if (busy || peeled) return;
    setPeeled(true);
    peel.play(3, () => pass("একটা একটা করে উধাও, তারপর নিচ থেকে উপরে।"));
  };
  const done = stair(rows);
  const prices = peelOf(rows);
  const shownP = !peeled ? 0 : peel.running ? peel.k : 3;
  const cell = "grid h-8 place-items-center font-mono text-sm tabular-nums";
  return (
    <>
      <div className="mx-auto w-full max-w-[21rem] overflow-hidden rounded-lg border border-[#cbd5e1] bg-white text-[#0f1b2d]">
        <div className="grid grid-cols-[3.4rem_1fr_1fr_1fr_1.35fr] border-b border-[#cbd5e1] bg-[#f1f5f9] text-center text-[0.7rem] font-semibold">
          <span />
          {X6_NAMES.map((n) => (
            <span key={n} className="py-1">
              {n}
            </span>
          ))}
          <span className="border-l-2 border-[#0f1b2d]/40 py-1">টাকা</span>
        </div>
        {rows.map((r, i) => {
          const cutting = cut && cut.t === i && run.running;
          const shown = cutting && run.k >= 1 ? (r.map((v, c) => v - cut.m * rows[cut.s][c]) as Row) : r;
          const sel = pick === i;
          const src = cut && cut.s === i && run.running;
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => tap(i)}
                disabled={busy || done}
                className={`grid w-full cursor-pointer grid-cols-[3.4rem_1fr_1fr_1fr_1.35fr] items-center border-b border-[#e2e8f0] text-center transition-colors duration-300 motion-reduce:transition-none disabled:cursor-default ${
                  sel ? "bg-[#dbeafe]" : src ? "bg-[#ccfbf1]" : "hover:bg-[#f8fafc]"
                }`}
              >
                <span className="text-[0.7rem] font-semibold">রসিদ {X6_RN[i]}</span>
                {shown.map((v, c) => (
                  <span key={`${c}-${v}`} className={`${cell} ${c === 3 ? "border-l-2 border-[#0f1b2d]/40 font-semibold" : ""} ${v === 0 && c < 3 ? "text-[#94a3b8]" : ""} ${cutting && run.k >= 1 ? POP : ""}`}>
                    {v === 0 && c < 3 ? <span className="rounded bg-[#e2e8f0] px-1.5">0</span> : sg(v)}
                  </span>
                ))}
              </button>
              {cutting && run.k === 0 && (
                <div className={`grid grid-cols-[3.4rem_1fr_1fr_1fr_1.35fr] bg-[#f0fdfa] text-center text-[#0f766e] transition duration-500 motion-reduce:transition-none starting:-translate-y-3 starting:opacity-0`}>
                  <span className="text-[0.65rem] font-semibold">
                    − {cut.m} × রসিদ {X6_RN[cut.s]}
                  </span>
                  {rows[cut.s].map((v, c) => (
                    <span key={c} className={`${cell} ${c === 3 ? "border-l-2 border-[#0f1b2d]/40" : ""}`}>
                      {sg(cut.m * v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {nope && <Nope key={miss}>{nope}</Nope>}
      {!done && !nope && (
        <div className="mt-2 text-center text-xs text-muted">{pick === null ? "যেই রসিদ কাটবেন, tap করুন।" : `রসিদ ${X6_RN[pick]} কাটবেন। এবার উপরের যেই রসিদ দিয়ে কাটবেন, সেটা tap করুন।`}</div>
      )}
      {done && (
        <div className={`${FADE} mt-2 flex flex-col items-center gap-1.5`}>
          <span className="text-xs font-semibold text-accent-text">সিঁড়ি হয়ে গেছে: প্রতি রসিদে বাম থেকে এক ঘর বেশি শূন্য।</span>
          <div className="flex gap-1.5">
            {X6_NAMES.map((n, c) => {
              const show = shownP >= 3 - c;
              return (
                <span key={n} className={`inline-flex min-w-[4.6rem] flex-col items-center rounded-lg border-2 px-2 py-0.5 ${show ? "border-accent bg-accent/10" : "border-border"}`}>
                  <span className="text-xs">{n}</span>
                  <span key={show ? "v" : "q"} className={`font-mono font-bold ${show ? POP : "text-muted"}`}>
                    {show ? Math.round(prices[c]) : "?"}
                  </span>
                </span>
              );
            })}
          </div>
          {!peeled && (
            <button type="button" className={primaryBtn} onClick={open}>
              নিচ থেকে খুলুন
            </button>
          )}
        </div>
      )}
      <Task done={peeled && !peel.running}>নিচের দুইটা রসিদ কেটে সিঁড়ি বানান। তারপর নিচ থেকে দাম খুলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn (Check Q2). The ময়রা's চিরকুট: 2 রসগোল্লা + 1 সন্দেশ = 50;
//     1 রসগোল্লা − 1 সন্দেশ = 10। "রসিদ ১ + k × রসিদ ২": the line spins; the
//     reader commits a k; a slant bounces. k = 1 stands it up (3 রসগোল্লা =
//     60), k = −2 lays it flat (3 সন্দেশ = 30); either works. Then Shiku walks
//     that line with a Stepper until both lamps light at (20, 10).

const Q1: Rc = { a: 2, b: 1, t: 50 };
const Q2: Rc = { a: 1, b: -1, t: 10 };
const X7F = makeFrame(0, 30, 0, 30, 6.4, 20);
const X7_ITEMS = ["রসগোল্লা", "সন্দেশ"] as const;
const SWEET_SLOTS = ["এক রসগোল্লার দাম", "এক সন্দেশের দাম"] as const;

export function YourElim() {
  const pass = useGate();
  const [k, setK] = useSeed("kk", 0);
  const [kept, setKept] = useSeed<number | null>("kept", null);
  const [other, setOther] = useSeed("other", 0);
  const [miss, setMiss] = useState(0);
  const [tried, setTried] = useState<number | null>(null);
  const [kt] = useTween([k], 600);
  const r = mix(Q1, Q2, 1, kt);
  const card = mix(Q1, Q2, 1, k);
  const commit = () => {
    if (kept !== null) return;
    if (card.a === 0 || card.b === 0) {
      setKept(k);
      setOther(0);
    } else {
      setTried(k);
      setMiss((m) => m + 1);
    }
  };
  const kc = kept === null ? null : mix(Q1, Q2, 1, kept);
  // the price the cut gave, and which axis it sits on
  const upright = kc !== null && kc.b === 0;
  const known = kc === null ? 0 : upright ? kc.t / kc.a : kc.t / kc.b;
  const at: XY = kc === null ? [0, 0] : upright ? [known, other] : [other, known];
  const on1 = kc !== null && holds(Q1, at);
  const on2 = kc !== null && holds(Q2, at);
  const move = (v: number) => {
    setOther(v);
    const p: XY = upright ? [known, v] : [v, known];
    if (holds(Q1, p) && holds(Q2, p)) pass("রসগোল্লা 20, সন্দেশ 10।");
  };
  const f = X7F;
  return (
    <>
      <div className="mx-auto w-full max-w-[11.5rem]">
        <Plane f={f} grid={2} axes={false} label="মিষ্টির দামের কাগজ: ডানে রসগোল্লা, উপরে সন্দেশ; চিরকুটের দুই লাইন; মিলানো লাইন ঘোরে" className="my-0! max-w-none">
          <Clip f={f}>
            <RLine f={f} r={Q1} tone="c1" w={1.8} faint={kept === null} />
            <RLine f={f} r={Q2} tone="c2" w={1.8} faint={kept === null} />
            <RLine f={f} r={kc ?? r} tone="cm" w={2.8} />
          </Clip>
          <PaperMarks f={f} step={10} names={["রসগোল্লা", "সন্দেশ"]} />
          {kc !== null && <Shiku f={f} at={at} />}
        </Plane>
      </div>
      {kc === null ? (
        <>
          <div className="mt-1.5 flex justify-center">
            <Slip r={card} name={`রসিদ ১ + ${k < 0 ? `(${sg(k)})` : k} × রসিদ ২`} tone="cm" items={X7_ITEMS} />
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-2 text-sm">
            <span className="text-muted">k</span>
            <Stepper value={k} onChange={setK} min={-3} max={3} label="k" />
            <button type="button" className={primaryBtn} onClick={commit}>
              এইটা দিয়ে কাটুন
            </button>
          </div>
          {tried !== null && tried === k && <Nope key={miss}>লাইন এখনো হেলানো। রসগোল্লা আর সন্দেশ দুইটাই রয়ে গেছে।</Nope>}
        </>
      ) : (
        <>
          <div className={`${FADE} mt-1.5 text-center text-sm font-semibold text-accent-text`}>
            {upright ? `${kc.a} রসগোল্লা = ${kc.t} টাকা। এক রসগোল্লা ${known}.` : `${kc.b} সন্দেশ = ${kc.t} টাকা। এক সন্দেশ ${known}.`}
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-2 text-sm">
            <span className="text-muted">{upright ? "সন্দেশ" : "রসগোল্লা"}</span>
            <Stepper value={other} onChange={move} min={0} max={30} label={upright ? "সন্দেশের দাম" : "রসগোল্লার দাম"} />
            <span className="font-mono text-xs">
              <Tup v={at} of={SWEET_SLOTS} />
            </span>
          </div>
          <div className="mt-1.5 flex justify-center gap-3">
            <Lamp on={on1} label="রসিদ ১" tone="c1" />
            <Lamp on={on2} label="রসিদ ২" tone="c2" />
          </div>
        </>
      )}
      <Task done={on1 && on2}>{kc === null ? "k বদলে একটা জিনিস উধাও করুন, তারপর কাটুন।" : "এবার অন্য দামটা: Shiku কে লাইন ধরে হাঁটান, দুইটা lamp জ্বলা পর্যন্ত।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it. মামার খাতার শেষ পাতা: 5 মোমবাতি + 2 দেশলাই = 24, 3 মোমবাতি + 4
//     দেশলাই = 20। Three cuts; each tap spins রসিদ ১'s line into the cut's
//     line (it stays on the crossing all the way). Only 2 × রসিদ ১ − রসিদ ২
//     stands straight up: 7 মোমবাতি = 28.

const T1: Rc = { a: 5, b: 2, t: 24 };
const T2: Rc = { a: 3, b: 4, t: 20 };
const X8F = makeFrame(0, 8, 0, 8, 24, 20);
const X8_MOVES = [
  { label: "রসিদ ১ − রসিদ ২", u: 1, v: -1, nope: "2 মোমবাতি − 2 দেশলাই = 4। দেশলাই রয়ে গেলো, লাইন হেলানো।" },
  { label: "2 × রসিদ ১ − রসিদ ২", u: 2, v: -1, nope: "" },
  { label: "রসিদ ১ + রসিদ ২", u: 1, v: 1, nope: "8 মোমবাতি + 6 দেশলাই = 44। যোগে দেশলাই আরো বাড়লো।" },
];
const X8_RIGHT = 1;
const X8_N = 24;

export function TryElim() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const spin = usePlay(40);
  const choose = (i: number) => {
    setPick(i);
    spin.play(X8_N, () => (i === X8_RIGHT ? pass("দেশলাই উধাও: মোমবাতি 4 টাকা।") : setMiss((m) => m + 1)));
  };
  const t = pick === null ? 0 : spin.running ? spin.k / X8_N : 1;
  const e = 1 - (1 - t) ** 3;
  const mv = pick === null ? null : X8_MOVES[pick];
  const r = mv ? mix(T1, T2, 1 + (mv.u - 1) * e, mv.v * e) : T1;
  const landed = pick !== null && !spin.running;
  const f = X8F;
  return (
    <>
      <div className="mx-auto w-full max-w-[11rem]">
        <Plane f={f} grid={1} axes={false} label="মোমবাতি আর দেশলাইয়ের দামের কাগজ; রসিদ ১ এর লাইন ঘুরে বাছাই করা কাটার লাইনে যায়" className="my-0! max-w-none">
          <Clip f={f}>
            <RLine f={f} r={T1} tone="c1" w={1.6} faint />
            <RLine f={f} r={T2} tone="c2" w={1.6} faint />
            <RLine f={f} r={r} tone="cm" w={2.8} />
          </Clip>
          <PaperMarks f={f} step={2} names={["মোমবাতি", "দেশলাই"]} />
          <circle cx={f.sx(4)} cy={f.sy(2)} r={3} fill={INK} />
          {landed && pick === X8_RIGHT && (
            <g className={POP}>
              <rect x={f.sx(4) - 9} y={f.sy(0) - 18} width={18} height={13} rx={3} fill="white" stroke={TEAL} strokeWidth={1.2} />
              <text x={f.sx(4)} y={f.sy(0) - 8.5} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill="#0f766e">
                4
              </text>
            </g>
          )}
        </Plane>
      </div>
      <div className="mt-1 flex justify-center gap-1.5">
        <Slip r={T1} name="রসিদ ১" tone="c1" items={["মোমবাতি", "দেশলাই"]} />
        <Slip r={T2} name="রসিদ ২" tone="c2" items={["মোমবাতি", "দেশলাই"]} />
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {X8_MOVES.map((m, i) => (
          <Choice key={m.label} n={i} look={pick === i && landed ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={spin.running || (landed && pick === X8_RIGHT)} onClick={() => choose(i)}>
            <span className="text-sm">{m.label}</span>
          </Choice>
        ))}
      </div>
      {landed && mv && pick !== X8_RIGHT && <Nope key={miss}>{mv.nope}</Nope>}
      {landed && pick === X8_RIGHT && <div className={`${FADE} mt-2 text-center text-sm font-semibold text-accent-text`}>7 মোমবাতি = 28 টাকা। এক মোমবাতি 4।</div>}
      <Task done={landed && pick === X8_RIGHT}>কোন কাটাকাটিতে দেশলাই উধাও হয়? একটা বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The bet opened. The paper zoomed near the crossing. Each card puts Shiku
//     on রসিদ ১'s line at that চেয়ার price (so রসিদ ১'s lamp is lit); only 47
//     lights রসিদ ২'s lamp too. The readout says how far off রসিদ ২ is.

const X9F = makeFrame(40, 54, 74, 92, 12, 20);

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const walk = usePlay(900);
  const spot = (i: number): XY => {
    const v = X1_CARDS[i].v;
    return [v, (307 - 3 * v) / 2];
  };
  const target: XY = cur === null ? [44, (307 - 132) / 2] : spot(cur);
  const [sx, sy] = useTween(target, 900);
  const tap = (i: number) => {
    const next = open.includes(i) ? open : [...open, i];
    setOpen(next);
    setCur(i);
    walk.play(1, next.length === X1_CARDS.length ? () => pass("47 এ দুইটা lamp ই জ্বললো।") : undefined);
  };
  const landed = cur !== null && !walk.running;
  const p = cur === null ? null : spot(cur);
  const r2 = p ? 4 * p[0] + p[1] : 0;
  const on2 = landed && p !== null && holds(R2, p);
  const f = X9F;
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <div className="w-full max-w-[10rem]">
          <Plane f={f} grid={1} axes={false} label="crossing এর কাছের দামের কাগজ; প্রতিটা বাজির দামে Shiku রসিদ ১ এর লাইনে দাঁড়ায়; শুধু 47 এ রসিদ ২ এর লাইনও" className="my-0! max-w-none">
            <Clip f={f}>
              <RLine f={f} r={R1} tone="c1" w={2} />
              <RLine f={f} r={R2} tone="c2" w={2} />
            </Clip>
            <PaperMarks f={f} step={4} />
            {open.map((i) => {
              const q = spot(i);
              const good = holds(R2, q);
              return <circle key={i} cx={f.sx(q[0])} cy={f.sy(q[1])} r={3.4} fill={good ? OK : BAD} opacity={0.85} className={POP} />;
            })}
            {cur !== null && <Shiku f={f} at={[sx, sy]} />}
          </Plane>
        </div>
        <div className="flex w-[8.5rem] flex-col items-start gap-1 text-xs">
          <Lamp on={landed} label="রসিদ ১" tone="c1" />
          <Lamp on={on2} label="রসিদ ২" tone="c2" />
          {landed && p ? (
            <span key={cur} className={`${FADE} mt-1 leading-snug ${on2 ? "font-semibold text-accent-text" : "text-danger"}`}>
              চেয়ার {p[0]}, লাইট {fmt(p[1])}. রসিদ ২ হয় {fmt(r2)} টাকা{on2 ? ": মিললো।" : `, ${fmt(Math.abs(r2 - 271))} টাকা ${r2 < 271 ? "কম" : "বেশি"}.`}
            </span>
          ) : (
            <span className="mt-1 text-muted">একটা card খুলুন</span>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={open.includes(i) && !(cur === i && walk.running) ? (holds(R2, spot(i)) ? "right" : "wrong") : "idle"} disabled={walk.running} onClick={() => tap(i)}>
            <span className="flex items-center gap-2 leading-tight">
              <span className="font-mono text-lg font-bold">{c.v}</span>
              <span className="text-xs">{c.who}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={open.length === X1_CARDS.length && !walk.running}>চারটা card একটা একটা করে খুলুন। কোন দামে দুইটা lamp জ্বলে?</Task>
    </>
  );
}

// ===========================================================================
// Story scenes. Stage 320 × 180, ground 150.

/** the গেট's two brick posts */
function St_Gate({ x }: { x: number }) {
  return (
    <g className="pointer-events-none">
      {[0, 30].map((d) => (
        <g key={d}>
          <rect x={x + d - 3} y={96} width={8} height={54} fill="#b45309" stroke="#78350f" strokeWidth={0.8} />
          <rect x={x + d - 5} y={92} width={12} height={5} fill="#92400e" />
        </g>
      ))}
    </g>
  );
}

/** the ভ্যান at x, the machine tied on it (`machine` false: set down elsewhere) */
function St_Van({ x, machine = true, rope = false }: { x: number; machine?: boolean; rope?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={124} width={52} height={6} rx={1} fill="#a16207" stroke="#713f12" strokeWidth={0.8} />
      <circle cx={x + 12} cy={140} r={9} fill="none" stroke="#1f2937" strokeWidth={2} />
      <circle cx={x + 42} cy={140} r={9} fill="none" stroke="#1f2937" strokeWidth={2} />
      <circle cx={x - 14} cy={142} r={7} fill="none" stroke="#1f2937" strokeWidth={2} />
      <path d={`M${x} 128L${x - 14} 142M${x - 8} 128v-14M${x - 12} 114h8`} stroke="#334155" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      {machine && (
        <g>
          <rect x={x + 8} y={106} width={24} height={18} rx={2} fill="#334155" stroke={INK} strokeWidth={0.7} />
          {[0, 5, 10].map((d) => (
            <path key={d} d={`M${x + 34 + d * 0.3} 124l14 -${10 - d * 0.4}`} stroke="#b08d3c" strokeWidth={2} strokeLinecap="round" />
          ))}
          <path d={`M${x + 6} 112h30M${x + 6} 119h30`} stroke={rope ? "#f59e0b" : "#d6d3d1"} strokeWidth={rope ? 1.8 : 1.2} />
        </g>
      )}
    </g>
  );
}

/** a small white রসিদ slip, held or lying, centred at (x, y) */
function St_Slip({ x, y, tone = BLUE, r = 0 }: { x: number; y: number; tone?: string; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`} className="pointer-events-none">
      <rect x={-6} y={-8} width={12} height={16} rx={1} fill="white" stroke="#94a3b8" strokeWidth={0.7} />
      <path d="M-4 -4h8M-4 0h6M-4 4h8" stroke={tone} strokeWidth={0.9} />
    </g>
  );
}

/** মামার দামের কাগজ, held up at (x, y): grid and two crossing lines */
function St_Paper({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <rect x={-14} y={-16} width={28} height={32} rx={1} fill="white" stroke="#94a3b8" strokeWidth={0.7} />
      {[-8, -2, 4, 10].map((d) => (
        <path key={d} d={`M${d} -16v32M-14 ${d}h28`} stroke="#bfdbfe" strokeWidth={0.5} />
      ))}
      <path d="M-12 -14L12 12" stroke={BLUE} strokeWidth={1.2} />
      <path d="M-6 -15L6 15" stroke={AMBER} strokeWidth={1.2} />
    </g>
  );
}

/** the ভেজা খাতা, open, blue ink run into smudges */
function St_Khata({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 16} ${y - 10}h15v22h-15ZM${x + 1} ${y - 10}h15v22h-15Z`} fill="#fefce8" stroke="#a16207" strokeWidth={0.8} />
      {[0, 5, 10].map((d) => (
        <path key={d} d={`M${x - 13} ${y - 5 + d}h9M${x + 4} ${y - 5 + d}h9`} stroke="#93c5fd" strokeWidth={1} />
      ))}
      <ellipse cx={x - 7} cy={y + 1} rx={6} ry={5} fill="#60a5fa" opacity={0.35} />
      <ellipse cx={x + 9} cy={y - 2} rx={5} ry={6} fill="#60a5fa" opacity={0.3} />
    </g>
  );
}

/** a small bundle of taka notes, centred at (x, y) */
function St_Notes({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x - 8 + i} y={y - 4 - i * 1.4} width={16} height={8} rx={1} fill="#86efac" stroke="#15803d" strokeWidth={0.6} />
      ))}
    </g>
  );
}

/**
 * The লাইট ভাই (light-kit's LightBhai: মামার look, the cigarette, his name)
 * in a slate ফতুয়া over it, so he and মামা can stand on one stage.
 */
function St_LightBhai({ x, y = 150, facing = 1, arm = "down", walking = false }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point"; walking?: boolean }) {
  return (
    <>
      <LightBhai x={x} y={y} facing={facing} arm={arm} walking={walking} />
      <g style={{ transform: `translate(${x}px, ${y}px)` }} className="pointer-events-none transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
        <rect x={-9} y={-40} width={18} height={20} rx={5} fill="#475569" />
        <path d="M-2 -40v12M2 -36h4" stroke="#cbd5e1" strokeWidth={0.8} />
      </g>
    </>
  );
}

/** the ময়রার ছেলে: a smaller boy in a white গেঞ্জি, his name under his feet */
function St_MoyraBoy({ x, y = 150, facing = 1, arm = "down", walking = false }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point"; walking?: boolean }) {
  return (
    <>
      <Person who="karim" x={x} y={y} facing={facing} arm={arm} walking={walking} scale={0.82} />
      <g style={{ transform: `translate(${x}px, ${y}px)` }} className="pointer-events-none transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
        <rect x={-7.4} y={-32.8} width={14.8} height={16.4} rx={4} fill="#f8fafc" />
        <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          ময়রার ছেলে
        </text>
      </g>
    </>
  );
}

// 1a · Afternoon. The ভ্যান at the gate, the machine tied on it. The লাইট
//      ভাই walks in: ফিরানির 20 চেয়ারের ভাড়া বাকি। মামা opens the ভেজা
//      খাতা। Then he holds up the দামের কাগজ, the two রসিদ beside it.

export function LightVanBack({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বিকাল; গেটে লাইট ভাইয়ের ভ্যান, যন্ত্র দড়ি দিয়ে বাঁধা; লাইট ভাই এসে বললেন ফিরানির 20 চেয়ারের ভাড়া বাকি; মামা খুললেন ভেজা খাতা; তারপর দামের কাগজ তুলে ধরলেন, পাশে দুইটা রসিদ">
        <St_Gate x={218} />
        <St_Van x={262} />
        <Person who="mama" x={100} y={150} facing={1} arm={k >= 2 ? "hold" : "down"} mood={k === 2 ? "puzzled" : "plain"} label />
        {k === 2 && (
          <g className={POP}>
            <St_Khata x={122} y={106} />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <St_Paper x={122} y={100} />
            <St_Slip x={142} y={112} tone={BLUE} r={-8} />
            <St_Slip x={152} y={114} tone={AMBER} r={6} />
          </g>
        )}
        <St_LightBhai x={k >= 1 ? 190 : 236} facing={-1} arm={k === 1 ? "point" : "down"} walking={k === 1} />
        {k === 1 && <Bubble x={190} y={82} side="left" lines={["ফিরানির 20 চেয়ারের", "ভাড়াটা বাকি।"]} />}
        {k === 2 && <Bubble x={100} y={82} side="right" lines={["দাম লেখা ছিলো খাতায়।", "খাতা তো ভিজা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1b · Four answers, one after another: নাসিব with his স্কেল, সামিন, মামা,
//      the লাইট ভাই।

export function FourGuesses({}: Story) {
  const s = useScene(3, [600, 2200, 2200, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব স্কেল হাতে বললো একটু বড় করে আঁকলে পঁয়তাল্লিশ; সামিন বললো আটচল্লিশ; মামা বললেন গোল সংখ্যাই হবে, পঞ্চাশ; লাইট ভাই বললেন সাতচল্লিশ, তার মনে আছে">
        <Person who="nasib" x={48} y={150} facing={1} arm="hold" mood={k === 0 ? "smug" : "plain"} label />
        <path d="M58 108l24 -6" stroke="#ca8a04" strokeWidth={3} strokeLinecap="round" />
        <Person who="samin" x={118} y={150} facing={1} arm={k === 1 ? "point" : "down"} label />
        <Person who="mama" x={196} y={150} facing={-1} arm={k === 2 ? "wave" : "down"} label />
        <St_LightBhai x={268} facing={-1} arm={k === 3 ? "point" : "down"} />
        {k === 0 && <Bubble x={48} y={82} side="right" lines={["একটু বড় কইরা আঁকি।", "পঁয়তাল্লিশ।"]} />}
        {k === 1 && <Bubble x={118} y={82} side="mid" lines={["আমি তো দেখি", "আটচল্লিশ।"]} />}
        {k === 2 && <Bubble x={196} y={82} side="mid" lines={["গোল সংখ্যাই হবে।", "পঞ্চাশ।"]} />}
        {k === 3 && <Bubble x={268} y={82} side="left" lines={["সাতচল্লিশ।", "আমার মনে আছে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Karim takes both রসিদ and lays one on the other: যোগ কইরা দাও।
//      সামিন shakes his head: দুইটা অজানাই থাকে।

export function KarimAdds({}: Story) {
  const s = useScene(2, [600, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="করিম দুইটা রসিদ হাতে নিলো, একটার উপর আরেকটা রাখলো, বললো যোগ করে দাও; সামিন বললো যোগ করলে তো দুইটা অজানাই থাকে">
        <Person who="karim" x={120} y={150} facing={1} arm="hold" label />
        <St_Slip x={k >= 1 ? 139 : 131} y={105} tone={BLUE} r={-6} />
        <g style={{ transform: `translate(${k >= 1 ? 141 : 149}px, ${k >= 1 ? 104 : 108}px)` }} className="transition-transform duration-700 motion-reduce:transition-none">
          <St_Slip x={0} y={0} tone={AMBER} r={5} />
        </g>
        <Person who="samin" x={220} y={150} facing={-1} arm={k >= 2 ? "point" : "down"} mood={k >= 2 ? "puzzled" : "plain"} label />
        {k === 1 && <Bubble x={120} y={82} side="right" lines={["যোগ কইরা দাও।"]} />}
        {k >= 2 && <Bubble x={220} y={82} side="left" lines={["যোগ করলে তো", "দুইটা অজানাই থাকে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Som looks at the added রসিদ a long time: লাইট যদি একদম শূন্য করা যায়?
//      A bulb with a "?" over the slip.

export function SomIdea({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সোম যোগ করা রসিদটার দিকে অনেকক্ষণ তাকিয়ে থাকলো; তারপর বললো, যোগ করলে লাইট বাড়ে, বাদ দিলে কমে; লাইট যদি একদম শূন্য করা যায়?">
        <Person who="som" x={k >= 1 ? 150 : 230} y={150} facing={-1} walking={k === 1} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 1 && (
          <g className={POP}>
            <St_Slip x={133} y={106} tone={TEAL} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <BulbIcon x={96} y={70} s={1.8} lit={false} />
            <text x={112} y={58} fontSize={14} fontWeight={700} fill={INK}>
              ?
            </text>
            <Bubble x={150} y={82} side="right" lines={["লাইট যদি একদম", "শূন্য করা যায়?"]} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 6a · The লাইট ভাই takes a folded page out of his pocket: last month's three
//      রসিদ, চেয়ার, লাইট, স্পিকার। স্পিকারের ভাড়াটা ভুইলা গেছি।

export function SecondPage({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="লাইট ভাই পকেট থেকে একটা ভাঁজ করা পাতা বের করলেন; গত মাসের তিনটা রসিদ, চেয়ার, লাইট আর স্পিকার; বললেন স্পিকারের ভাড়াটা ভুলে গেছেন">
        <Person who="mama" x={96} y={150} facing={1} arm={k >= 2 ? "hold" : "down"} label />
        <St_LightBhai x={190} facing={-1} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && (
          <g className={POP}>
            <rect x={k >= 2 ? 104 : 158} y={98} width={22} height={24} rx={1} fill="white" stroke="#94a3b8" strokeWidth={0.7} className="transition-[x] duration-700 motion-reduce:transition-none" />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${(k >= 2 ? 104 : 158) + 3} ${104 + i * 6}h16`} stroke={[BLUE, AMBER, TEAL][i]} strokeWidth={1.1} />
            ))}
          </g>
        )}
        {k >= 2 && <Bubble x={190} y={82} side="left" lines={["স্পিকারের ভাড়াটা", "ভুইলা গেছি।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · The ময়রার ছেলে runs to the gate with a চিরকুট: বাবা পাঠাইছে। মামা
//      reads it: two lines, a ধাঁধা।

export function ChirkutArrives({}: Story) {
  const s = useScene(2, [600, 1800, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ময়রার ছেলে দৌড়ে গেটে এলো, হাতে চিরকুট, বললো বাবা পাঠিয়েছে; মামা চিরকুট পড়লেন: 2 রসগোল্লা আর 1 সন্দেশ 50 টাকা; রসগোল্লা সন্দেশের চেয়ে 10 টাকা বেশি">
        <St_Gate x={236} />
        <Person who="mama" x={100} y={150} facing={1} arm={k >= 2 ? "hold" : "down"} label />
        <St_MoyraBoy x={k >= 1 ? 160 : 290} facing={-1} walking={k === 1} arm={k === 1 ? "hold" : "down"} />
        {k === 1 && (
          <g>
            <St_Slip x={146} y={116} tone={AMBER} />
            <Bubble x={160} y={90} side="left" lines={["বাবা পাঠাইছে।"]} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <St_Slip x={117} y={106} tone={AMBER} />
            <rect x={130} y={16} width={150} height={40} rx={4} fill="#fefce8" stroke="#a16207" strokeWidth={0.8} />
            <text x={205} y={32} textAnchor="middle" fontSize={9} fill={INK}>
              2 রসগোল্লা + 1 সন্দেশ = 50 টাকা
            </text>
            <text x={205} y={47} textAnchor="middle" fontSize={9} fill={INK}>
              রসগোল্লা, সন্দেশের চেয়ে 10 টাকা বেশি
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Before মাগরিব। মামা counts the notes into the লাইট ভাই's hand; he
//      folds them into his বুক পকেট, then goes to the ভ্যান and checks the
//      rope on the machine.

export function NotesCounted({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="মাগরিবের আগে; মামা নোট গুনে লাইট ভাইয়ের হাতে দিলেন; লাইট ভাই নোট ভাঁজ করে বুক পকেটে রাখলেন; তারপর ভ্যানে গিয়ে যন্ত্রের দড়ি দেখলেন">
        <St_Gate x={214} />
        <St_Van x={262} rope={k >= 3} />
        <Person who="mama" x={96} y={150} facing={1} arm={k <= 1 ? "hold" : "down"} label />
        {k === 0 && <St_Notes x={114} y={107} />}
        {k === 1 && (
          <g className="transition-transform duration-700 motion-reduce:transition-none" style={{ transform: "translate(40px, 0px)" }}>
            <St_Notes x={114} y={107} />
          </g>
        )}
        <St_LightBhai x={k >= 3 ? 246 : 168} facing={k >= 3 ? 1 : -1} arm={k === 1 ? "hold" : k >= 3 ? "point" : "down"} walking={k === 3} />
        {k === 2 && (
          <g className={POP}>
            <rect x={162} y={104} width={6} height={4} rx={0.6} fill="#86efac" stroke="#15803d" strokeWidth={0.5} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 9b · The bridge to 10.4. Rina comes with a new stencil card and the thin
//      glass: লাইট ভাই, আমার প্রশ্ন? দরজার উপরে heart। He takes the machine
//      off the ভ্যান and sets it on its stand: আধা ঘণ্টা আছে।

export function RinaAtVan({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="রিনা এলো, হাতে নতুন stencil card আর পাতলা সাদা কাঁচ; বললো লাইট ভাই, আমার প্রশ্ন? দরজার উপরে heart; লাইট ভাই যন্ত্র ভ্যান থেকে নামিয়ে স্ট্যান্ডে বসালেন; বললেন আধা ঘণ্টা আছে">
        <St_Gate x={214} />
        <St_Van x={262} machine={k < 3} />
        {k >= 3 && (
          <g className={POP}>
            <Projector x={170} y={150} facing={-1} />
          </g>
        )}
        <Person who="rina" x={k >= 1 ? 100 : 30} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} label />
        {k >= 1 && (
          <g className={POP}>
            <rect x={112} y={100} width={14} height={16} rx={1} fill="#fde68a" stroke="#a16207" strokeWidth={0.7} />
            <rect x={128} y={102} width={10} height={13} rx={1} fill="#e0f2fe" fillOpacity={0.6} stroke="#7dd3fc" strokeWidth={0.8} />
          </g>
        )}
        <St_LightBhai x={k >= 3 ? 204 : 236} facing={-1} arm={k === 3 ? "point" : "down"} />
        {k === 2 && <Bubble x={100} y={82} side="right" lines={["লাইট ভাই, আমার প্রশ্ন?", "দরজার উপরে heart।"]} />}
        {k >= 3 && <Bubble x={204} y={82} side="left" lines={["আধা ঘণ্টা আছে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ===========================================================================
// Watch-only figures for the explanations.

// 1½ · The stake. The small paper, a lens over the crossing: it sits inside
//      the 40–50 × 80–90 ঘর। Then 20 চেয়ার, each 1 taka off: 20 টাকা।

const X1B_SAY = [
  "মামার কাগজে দুই লাইন। কাটলো ঠিকই।",
  "কিন্তু দুই দাগের মাঝখানে। চেয়ার 40 এর বেশি, 50 এর কম। ঠিক কত?",
  "এক চেয়ারে 1 টাকা ভুল হলে, ফিরানির 20 চেয়ারে 20 টাকা।",
];
const X1B_SMALL = makeFrame(0, 100, 0, 120, 0.85, 0);
const X1B_ZOOM = makeFrame(38, 52, 76, 90, 6.4, 0);

export function ChairStake() {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const f = X1B_SMALL;
  const z = X1B_ZOOM;
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <svg viewBox="0 0 240 150" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="ছোট দামের কাগজে দুই লাইন কাটে; কাছে গেলে দেখা যায় কাটার জায়গা চেয়ার 40 আর 50 এর মাঝের ঘরে; নিচে 20 টা চেয়ার">
        <defs>
          <clipPath id={`${id}s`}>
            <rect x={0} y={0} width={85} height={102} />
          </clipPath>
          <clipPath id={`${id}z`}>
            <circle cx={44.8} cy={44.8} r={44} />
          </clipPath>
        </defs>
        <g transform="translate(14 8)">
          <rect width={85} height={102} rx={2} fill="white" stroke="#cbd5e1" />
          <g clipPath={`url(#${id}s)`}>
            {Array.from({ length: 11 }, (_, i) => (
              <path key={i} d={`M${f.sx(i * 10)} 0V102M0 ${f.sy(i * 10)}H85`} stroke="#bfdbfe" strokeWidth={0.4} />
            ))}
            <path d={linePath(f, R1)} stroke={BLUE} strokeWidth={1.4} />
            <path d={linePath(f, R2)} stroke={AMBER} strokeWidth={1.4} />
          </g>
          {k >= 1 && <rect x={f.sx(40)} y={f.sy(90)} width={8.5} height={8.5} fill="none" stroke={TEAL} strokeWidth={1.2} className={POP} />}
        </g>
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M${14 + f.sx(48.5)} ${8 + f.sy(90)}L${126} 16M${14 + f.sx(48.5)} ${8 + f.sy(81.5)}L${126} 92`} stroke={TEAL} strokeWidth={0.8} strokeDasharray="2 2" />
            <g transform="translate(126 8)">
              <circle cx={44.8} cy={44.8} r={44} fill="white" stroke={TEAL} strokeWidth={1.6} />
              <g clipPath={`url(#${id}z)`}>
                {[40, 50].map((v) => (
                  <path key={v} d={`M${z.sx(v)} 0V90`} stroke="#93c5fd" strokeWidth={1} />
                ))}
                {[80, 90].map((v) => (
                  <path key={v} d={`M0 ${z.sy(v)}H90`} stroke="#93c5fd" strokeWidth={1} />
                ))}
                <path d={linePath(z, R1)} stroke={BLUE} strokeWidth={2} />
                <path d={linePath(z, R2)} stroke={AMBER} strokeWidth={2} />
              </g>
              <text x={z.sx(40)} y={z.sy(76) - 4} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={SOFT}>
                40
              </text>
              <text x={z.sx(50)} y={z.sy(76) - 4} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={SOFT}>
                50
              </text>
              <text x={z.sx(ANS[0]) + 8} y={z.sy(ANS[1]) - 5} fontSize={12} fontWeight={700} fill={INK}>
                ?
              </text>
            </g>
          </g>
        )}
        {k >= 2 &&
          Array.from({ length: 20 }, (_, i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 50}ms` }}>
              <ChairIcon x={12 + i * 11.4} y={136} s={0.7} tone={SOFT} />
              <text x={12 + i * 11.4} y={146} textAnchor="middle" fontSize={6} fontFamily={MONO} fill={BAD}>
                +1
              </text>
            </g>
          ))}
      </svg>
    </Scene>
  );
}

// 2½ · Why drawing can't settle it. Far off, two lines cross at a point.
//      Close up they are pencil ribbons; they cross in a small diamond; three
//      dots sit inside it, 46.7, 47, 47.3: which one is the price?

const X2B_SAY = [
  "দূর থেকে দুই লাইন একটা বিন্দুতে কাটে।",
  "কাছে গেলে দেখা যায়, pencil এর দাগ আসলে ফিতা। দুই ফিতা কাটে একটা ছোট ঘরে।",
  "ঘরের ভেতরে 46.7 ও আছে, 47 ও, 47.3 ও। কোনটা দাম, দাগ বলে না।",
];
const X2B = makeFrame(45, 49, 81, 85, 30, 0);
const X2B_W = 0.6;
const X2B_DOTS: [XY, string][] = [
  [[46.7, 83.45], "46.7"],
  [[47, 83], "47"],
  [[47.3, 82.55], "47.3"],
];

export function PencilFig() {
  const s = useScene(2, [600, 2200, 2600]);
  const k = s.k;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const f = X2B;
  const dia = diamond(R1, R2, X2B_W);
  const wpx = k >= 1 ? X2B_W * f.u : 1.6;
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <svg viewBox="0 0 240 130" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="দুই লাইন কাছে গেলে দুইটা ফিতা; কাটার জায়গা একটা ছোট ঘর; ভেতরে তিনটা বিন্দু, 46.7, 47, 47.3">
        <defs>
          <clipPath id={id}>
            <rect x={0} y={0} width={120} height={120} />
          </clipPath>
        </defs>
        <g transform="translate(60 5)">
          <rect width={120} height={120} rx={3} fill="white" stroke="#cbd5e1" />
          <g clipPath={`url(#${id})`}>
            {[45, 46, 47, 48, 49].map((v) => (
              <path key={v} d={`M${f.sx(v)} 0V120`} stroke="#dbeafe" strokeWidth={0.6} />
            ))}
            <path d={linePath(f, R1)} style={{ strokeWidth: wpx }} opacity={k >= 1 ? 0.45 : 1} className="fill-none stroke-[#2563eb] transition-[stroke-width,opacity] duration-700 motion-reduce:transition-none" />
            <path d={linePath(f, R2)} style={{ strokeWidth: wpx }} opacity={k >= 1 ? 0.45 : 1} className="fill-none stroke-[#d97706] transition-[stroke-width,opacity] duration-700 motion-reduce:transition-none" />
            {k >= 1 && <path d={dia.pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}`).join("") + "Z"} fill={INK} opacity={0.55} className={FADE} />}
            {k >= 2 &&
              X2B_DOTS.map(([p], i) => <circle key={i} cx={f.sx(p[0])} cy={f.sy(p[1])} r={2.2} fill="white" stroke={TEAL} strokeWidth={1.2} className={POP} style={{ transitionDelay: `${i * 200}ms` }} />)}
          </g>
        </g>
        {k >= 2 &&
          X2B_DOTS.map(([p, t], i) => {
            const dx = 60 + f.sx(p[0]);
            const dy = 5 + f.sy(p[1]);
            const lx = i === 0 ? 40 : 200;
            const ly = [dy - 14, dy, dy + 14][i];
            return (
              <g key={t} className={FADE}>
                <path d={`M${dx} ${dy}L${i === 0 ? lx + 6 : lx - 6} ${ly - 3}`} stroke="#0f766e" strokeWidth={0.6} strokeDasharray="2 1.5" />
                <text x={lx} y={ly} textAnchor={i === 0 ? "end" : "start"} fontSize={9} fontFamily={MONO} fontWeight={700} fill="#0f766e">
                  {t}?
                </text>
              </g>
            );
          })}
      </svg>
    </Scene>
  );
}

// 3½ · Why adding keeps a রসিদ true: two balanced দাঁড়িপাল্লা; the loads of
//      the second go onto the first, চেয়ার-লাইটের দিকে চেয়ার-লাইট, টাকার
//      দিকে টাকা; it stays level.

const X3B_SAY = [
  "রসিদ ১ একটা সমান পাল্লা: এক দিকে 3 চেয়ার, 2 লাইট। আরেক দিকে 307 টাকা। রসিদ ২ ও তাই।",
  "রসিদ ২ এর মাল তুলে দিন রসিদ ১ এর পাল্লায়। জিনিসের দিকে জিনিস, টাকার দিকে টাকা।",
  "পাল্লা সমানই থাকলো: 7 চেয়ার, 3 লাইট সমান 578 টাকা।",
];

function X3B_Scale({ x, left, right, tone }: { x: number; left: readonly string[]; right: string; tone: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M0 96V30M-14 96h28" stroke="#78350f" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M-34 30H34" stroke="#78350f" strokeWidth={2.4} strokeLinecap="round" />
      <circle cy={30} r={3} fill="#78350f" />
      {[-30, 30].map((d) => (
        <g key={d}>
          <path d={`M${d} 30L${d - 12} 66M${d} 30L${d + 12} 66`} stroke="#a8a29e" strokeWidth={0.8} />
          <path d={`M${d - 16} 66q16 11 32 0Z`} fill="#fde68a" stroke="#a16207" strokeWidth={0.8} />
        </g>
      ))}
      <g key={left.join()} className={POP}>
        {left.map((l, i) => (
          <text key={l} x={-30} y={54 + i * 9} textAnchor="middle" fontSize={8} fontWeight={700} fill={tone} stroke="white" strokeWidth={2} paintOrder="stroke">
            {l}
          </text>
        ))}
      </g>
      <text key={right} x={30} y={62} textAnchor="middle" fontSize={8} fontWeight={700} fill={tone} stroke="white" strokeWidth={2} paintOrder="stroke" className={POP}>
        {right}
      </text>
    </g>
  );
}

export function ScaleFig() {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <svg viewBox="0 0 240 104" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="দুইটা সমান দাঁড়িপাল্লা; দ্বিতীয়টার মাল প্রথমটায় তুলে দিলে পাল্লা সমানই থাকে">
        <X3B_Scale x={k >= 1 ? 120 : 62} left={k >= 1 ? ["7 চেয়ার", "3 লাইট"] : ["3 চেয়ার", "2 লাইট"]} right={k >= 1 ? "578 টাকা" : "307 টাকা"} tone={k >= 1 ? "#0f766e" : BLUE} />
        {k === 0 && <X3B_Scale x={178} left={["4 চেয়ার", "1 লাইট"]} right="271 টাকা" tone="#b45309" />}
        {k >= 2 && (
          <g className={POP}>
            <rect x={96} y={4} width={48} height={14} rx={7} fill="#dcfce7" stroke={OK} strokeWidth={1} />
            <text x={120} y={14} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={OK}>
              সমান
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · The cut, as bundles. 2 × রসিদ ২ (8 চেয়ার, 2 লাইট, 542) over রসিদ ১
//      (3 চেয়ার, 2 লাইট, 307); রসিদ ১ comes off: three chairs and both
//      bulbs go; 5 চেয়ার, 235 টাকা stay; 235 shared by 5: 47.

const X4B_SAY = [
  "রসিদ ২ দুইবার: 8 চেয়ার, 2 লাইট, 542 টাকা। নিচে রসিদ ১।",
  "রসিদ ১ বাদ: 3 চেয়ার, 2 লাইট, 307 টাকা সরে গেলো।",
  "লাইট দুইটা দুইটা, কাটাকাটি। থাকে 5 চেয়ার, 235 টাকা।",
  "235 টাকা 5 চেয়ারে সমান ভাগ: এক চেয়ার 47।",
];

export function CutBundles() {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;
  const gone = (i: number) => k >= 1 && i < 3;
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <svg viewBox="0 0 240 110" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="উপরে রসিদ ২ দুইবার, 8 চেয়ার 2 লাইট 542 টাকা; রসিদ ১ বাদ দিলে 3 চেয়ার আর 2 লাইট চলে যায়; থাকে 5 চেয়ার 235 টাকা; এক চেয়ার 47">
        <text x={4} y={12} fontSize={8} fontWeight={700} fill="#b45309">
          2 × রসিদ ২
        </text>
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i} opacity={gone(i) ? 0.25 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
            <ChairIcon x={10 + i * 16} y={34} tone={AMBER} />
            {k >= 3 && i >= 3 && (
              <text x={10 + i * 16} y={45} textAnchor="middle" fontSize={7} fontWeight={700} fontFamily={MONO} fill="#0f766e" className={POP}>
                47
              </text>
            )}
          </g>
        ))}
        {[0, 1].map((i) => (
          <g key={i} opacity={k >= 1 ? 0.2 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
            <BulbIcon x={146 + i * 14} y={34} lit={k < 1} />
          </g>
        ))}
        <text x={236} y={30} textAnchor="end" fontSize={11} fontWeight={700} fontFamily={MONO} fill={k >= 2 ? "#0f766e" : "#b45309"} key={k >= 2 ? "235" : "542"} className={POP}>
          {k >= 2 ? "235" : "542"}
        </text>
        {k >= 1 && (
          <g className={POP}>
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${4 + i * 16} 20l12 16M${16 + i * 16} 20l-12 16`} stroke={BAD} strokeWidth={1.2} />
            ))}
            {[0, 1].map((i) => (
              <path key={`b${i}`} d={`M${140 + i * 14} 20l12 16M${152 + i * 14} 20l-12 16`} stroke={BAD} strokeWidth={1.2} />
            ))}
          </g>
        )}
        <g style={{ transform: `translate(0px, ${k >= 1 ? -12 : 0}px)`, opacity: k >= 1 ? 0 : 1 }} className="transition-[transform,opacity] duration-700 motion-reduce:transition-none">
          <text x={4} y={70} fontSize={8} fontWeight={700} fill={BLUE}>
            রসিদ ১
          </text>
          {[0, 1, 2].map((i) => (
            <ChairIcon key={i} x={10 + i * 16} y={92} tone={BLUE} />
          ))}
          {[0, 1].map((i) => (
            <BulbIcon key={i} x={146 + i * 14} y={92} />
          ))}
          <text x={236} y={88} textAnchor="end" fontSize={11} fontWeight={700} fontFamily={MONO} fill={BLUE}>
            307
          </text>
        </g>
        {k >= 2 && (
          <text x={120} y={80} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0f766e" className={POP}>
            5 চেয়ার = 235 টাকা
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 5½ · Back-substitution as 5.5's peel: the cut রসিদ (one unknown) opens
//      first, its 47 climbs into রসিদ ১, which then has one unknown too.

const X5B_SAY = [
  "নিচের রসিদে অজানা একটা, চেয়ার। উপরেরটায় দুইটা।",
  "নিচেরটা আগে খুলে যায়: চেয়ার 47।",
  "47 উপরে নিয়ে যান। উপরের রসিদেও এখন অজানা একটা।",
  "2 লাইট 166 টাকা। লাইট 83। নিচ থেকে উপরে, একটা একটা করে।",
];

export function PeelFig() {
  const s = useScene(3, [600, 2000, 2200, 2400]);
  const k = s.k;
  const box = (x: number, y: number, v: string | null, tone: string) => (
    <g>
      <rect x={x} y={y - 12} width={24} height={16} rx={3} fill="white" stroke={tone} strokeWidth={1.4} />
      {v !== null && (
        <text key={v} x={x + 12} y={y} textAnchor="middle" fontSize={9.5} fontWeight={700} fontFamily={MONO} fill={tone} className={POP}>
          {v}
        </text>
      )}
    </g>
  );
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <svg viewBox="0 0 240 92" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="উপরে রসিদ ১: 3 চেয়ার আর 2 লাইট 307; নিচে 5 চেয়ার 235; নিচের থেকে চেয়ার 47 উপরে উঠে যায়, তারপর লাইট 83">
        <text x={4} y={30} fontSize={8} fontWeight={700} fill={BLUE}>
          রসিদ ১
        </text>
        <text x={44} y={30} fontSize={9.5} fill={INK}>
          3 ×
        </text>
        {box(60, 30, k >= 2 ? "47" : null, TEAL)}
        <text x={88} y={30} fontSize={9.5} fill={INK}>
          + 2 ×
        </text>
        {box(114, 30, k >= 3 ? "83" : null, "#7c3aed")}
        <text x={142} y={30} fontSize={9.5} fill={INK}>
          = 307
        </text>
        <text x={4} y={74} fontSize={8} fontWeight={700} fill="#0f766e">
          কাটা রসিদ
        </text>
        <text x={44} y={74} fontSize={9.5} fill={INK}>
          5 ×
        </text>
        {box(60, 74, k >= 1 ? "47" : null, TEAL)}
        <text x={88} y={74} fontSize={9.5} fill={INK}>
          = 235
        </text>
        <text x={72} y={44} textAnchor="middle" fontSize={7} fill={SOFT}>
          চেয়ার
        </text>
        <text x={126} y={44} textAnchor="middle" fontSize={7} fill={SOFT}>
          লাইট
        </text>
        {k >= 2 && <Draw d="M72 60Q54 50 72 36" strokeWidth={1.4} className="stroke-cat-teal" />}
        {k >= 3 && (
          <g className={POP}>
            <circle cx={214} cy={50} r={9} fill="#dcfce7" stroke={OK} strokeWidth={1.2} />
            <path d="M209 50l3.5 3.5l6 -7" stroke={OK} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 6½ · [A | b]. Three রসিদ in words → only the numbers, in place → a bar
//      before the টাকা, A and b named → one whole row cut, total included.

const X6B_SAY = [
  "তিনটা রসিদ, কথায় লেখা।",
  "কথা বাদ। সংখ্যা থাকলো জায়গামতো: চেয়ারের নিচে চেয়ার, টাকার নিচে টাকা।",
  "টাকার আগে একটা দাগ। দাগের বাঁয়ে A, ডানে b। পুরাটা মিলে [A | b]।",
  "কাটলে পুরা row কাটেন, দাগের ওপারের টাকাসহ।",
];
const X6B_ROWS: Row[] = [
  [1, 1, 1, 280],
  [2, 3, 3, 793],
  [1, 2, 4, 813],
];

export function AugFig() {
  const s = useScene(3, [600, 2000, 2400, 2400]);
  const k = s.k;
  const rows = X6B_ROWS.map((r, i) => (k >= 3 && i === 1 ? ([0, 1, 1, 233] as Row) : r));
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <svg viewBox="0 0 240 100" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="তিনটা রসিদ কথায়; তারপর শুধু সংখ্যা, টাকার আগে একটা দাগ: augmented matrix; একটা পুরা row কাটা হলো টাকাসহ">
        {k === 0 &&
          X6B_ROWS.map((r, i) => (
            <text key={i} x={120} y={24 + i * 24} textAnchor="middle" fontSize={9} fill={INK} className={FADE}>
              {r[0]} চেয়ার + {r[1]} লাইট + {r[2]} স্পিকার = {r[3]} টাকা
            </text>
          ))}
        {k >= 1 && (
          <g className={FADE}>
            <path d="M58 8h-6v68h6M182 8h6v68h-6" stroke={INK} strokeWidth={1.4} fill="none" />
            {rows.map((r, i) => (
              <g key={i}>
                {k >= 3 && i === 1 && <rect x={54} y={16 + i * 22} width={130} height={20} rx={3} fill="#ccfbf1" className={FADE} />}
                {r.map((v, c) => (
                  <text key={`${c}-${v}`} x={c < 3 ? 76 + c * 26 : 160} y={30 + i * 22} textAnchor="middle" fontSize={10} fontWeight={600} fontFamily={MONO} fill={v === 0 ? "#94a3b8" : INK} className={k >= 3 && i === 1 ? POP : ""}>
                    {v}
                  </text>
                ))}
              </g>
            ))}
            {k >= 2 && (
              <g className={FADE}>
                <path d="M138 10V74" stroke={INK} strokeWidth={1.4} />
                <text x={102} y={92} textAnchor="middle" fontSize={10} fontWeight={700} fill={BLUE}>
                  A
                </text>
                <text x={160} y={92} textAnchor="middle" fontSize={10} fontWeight={700} fill={AMBER}>
                  b
                </text>
              </g>
            )}
            {k >= 3 && (
              <text x={48} y={56} textAnchor="end" fontSize={7.5} fontWeight={700} fill="#0f766e" className={POP}>
                − 2 × row 1
              </text>
            )}
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 6¾ · About n³. A cube n ঘর on a side: 2 → 8, 3 → 27, 10 → 1,000; 300
//      runs off the frame.

const X6C_SAY = [
  "2 টা দাম: মোটামুটি 2 × 2 × 2 = 8 টা গুণ-বিয়োগ।",
  "3 টা দাম: 27।",
  "10 টা দাম: 1,000।",
  "300 টা দাম: 2.7 কোটি। Computer এর কাছে চোখের পলক।",
];

function X6C_Cube({ x, y, s, n, tone }: { x: number; y: number; s: number; n: number; tone: string }) {
  const c = 0.866 * s;
  const h = 0.5 * s;
  const P = (a: number, b: number, z: number): [number, number] => [x + (a - b) * c, y - (a + b) * h - z * s];
  const pt = (p: [number, number]) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  const face = (ps: [number, number][]) => `M${ps.map(pt).join("L")}Z`;
  const lines: string[] = [];
  if (n <= 10)
    for (let i = 1; i < n; i++) {
      const t = i / n;
      lines.push(`M${pt(P(t, 0, 0))}L${pt(P(t, 0, 1))}`, `M${pt(P(0, t, 0))}L${pt(P(0, t, 1))}`);
      lines.push(`M${pt(P(1, 0, t))}L${pt(P(0, 0, t))}L${pt(P(0, 1, t))}`);
      lines.push(`M${pt(P(t, 0, 1))}L${pt(P(t, 1, 1))}`, `M${pt(P(0, t, 1))}L${pt(P(1, t, 1))}`);
    }
  return (
    <g className={POP}>
      <path d={face([P(0, 0, 0), P(1, 0, 0), P(1, 0, 1), P(0, 0, 1)])} fill={tone} fillOpacity={0.35} stroke={INK} strokeWidth={0.7} />
      <path d={face([P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)])} fill={tone} fillOpacity={0.55} stroke={INK} strokeWidth={0.7} />
      <path d={face([P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)])} fill={tone} fillOpacity={0.2} stroke={INK} strokeWidth={0.7} />
      <path d={lines.join("")} stroke={INK} strokeWidth={0.35} opacity={0.6} />
    </g>
  );
}

export function CostFig() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X6C_SAY, k)}>
      <svg viewBox="0 0 240 110" className="mx-auto h-auto w-full max-w-[15rem] overflow-hidden" role="img" aria-label="ঘনক: পাশে 2 ঘর মানে 8, 3 ঘর মানে 27, 10 ঘর মানে 1000; 300 ঘরের ঘনক ছবিতে ধরে না">
        <X6C_Cube x={24} y={100} s={10} n={2} tone={BLUE} />
        <text x={24} y={62} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={SOFT}>
          8
        </text>
        {k >= 1 && (
          <>
            <X6C_Cube x={66} y={100} s={15} n={3} tone={AMBER} />
            <text x={66} y={52} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={SOFT} className={FADE}>
              27
            </text>
          </>
        )}
        {k >= 2 && (
          <>
            <X6C_Cube x={150} y={104} s={42} n={10} tone={TEAL} />
            <text x={150} y={10} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={SOFT} className={FADE}>
              1,000
            </text>
          </>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <text x={4} y={14} fontSize={8.5} fontWeight={700} fill={BAD}>
              300 ঘরের cube:
            </text>
            <text x={4} y={26} fontSize={8.5} fontWeight={700} fill={BAD}>
              এই ছবিতে ধরে না
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
  ChairBet: { start: {}, picked: { bet: 0 }, sealed: { bet: 3, sealed: true } },
  ZoomFails: { start: {}, z1: { z: 1 }, z2: { z: 2 } },
  AddReceipts: { start: {}, added: { added: true } },
  TurnTheLine: { start: {}, guessed: { guess: 1 }, k3: { guess: 1, kk: 3 }, found: { guess: 1, kk: 2, found: true } },
  BackSub: { start: {}, l60: { l: 60 }, found: { l: 83 } },
  ThreeThings: {
    start: {},
    picked: { pick: 1 },
    one: {
      rows: [
        [1, 1, 1, 280],
        [0, 1, 1, 233],
        [1, 2, 4, 813],
      ],
    },
    stair: {
      rows: [
        [1, 1, 1, 280],
        [0, 1, 1, 233],
        [0, 0, 2, 300],
      ],
    },
    peeled: {
      rows: [
        [1, 1, 1, 280],
        [0, 1, 1, 233],
        [0, 0, 2, 300],
      ],
      peeled: true,
    },
  },
  YourElim: { start: {}, k2: { kk: 2 }, kept: { kk: 1, kept: 1, other: 4 }, flat: { kk: -2, kept: -2, other: 20 }, right: { kk: 1, kept: 1, other: 10 } },
  TryElim: { start: {}, wrong: { pick: 0 }, sum: { pick: 2 }, right: { pick: 1 } },
  BetOpen: { start: {}, nasib: { open: [0], cur: 0 }, light: { open: [0, 1, 3], cur: 3 }, all: { open: [0, 1, 2, 3], cur: 2 } },
  LightVanBack: { rest: { k: 0 }, claim: { k: 1 }, khata: { k: 2 }, done: {} },
  FourGuesses: { nasib: { k: 0 }, samin: { k: 1 }, mama: { k: 2 }, done: {} },
  KarimAdds: { rest: { k: 0 }, karim: { k: 1 }, done: {} },
  SomIdea: { rest: { k: 0 }, done: {} },
  SecondPage: { rest: { k: 0 }, out: { k: 1 }, done: {} },
  ChirkutArrives: { rest: { k: 0 }, boy: { k: 1 }, done: {} },
  NotesCounted: { rest: { k: 0 }, notes: { k: 1 }, pocket: { k: 2 }, done: {} },
  RinaAtVan: { rest: { k: 0 }, ask: { k: 2 }, done: {} },
  ChairStake: { rest: { k: 0 }, lens: { k: 1 }, done: {} },
  PencilFig: { rest: { k: 0 }, ribbon: { k: 1 }, done: {} },
  ScaleFig: { rest: { k: 0 }, done: {} },
  CutBundles: { rest: { k: 0 }, cut: { k: 1 }, left: { k: 2 }, done: {} },
  PeelFig: { rest: { k: 0 }, up: { k: 2 }, done: {} },
  AugFig: { rest: { k: 0 }, nums: { k: 1 }, bar: { k: 2 }, done: {} },
  CostFig: { rest: { k: 0 }, ten: { k: 2 }, done: {} },
};
