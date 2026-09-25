"use client";

import { useId, useState, type PointerEvent, type ReactNode } from "react";

import { Tup } from "@/components/journey/box";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Stepper, primaryBtn, quietBtn, usePlay, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { Arrow, Lit, Plane, makeFrame, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";

// Screens for "Math for AI 10.5 — বোরহানি, রসিদ যা দেখে না", told as a
// Journey in the author's Bangla-English. The plan is 10_journey_specs.md,
// block 10.5.
//
// রাত, load-shedding, নানাবাড়ির বারান্দায় হারিকেন। The বাবুর্চি is back with a
// second bundle: the বিয়ের খাবার। Three things (প্লেট বিরিয়ানি, গ্লাস বোরহানি,
// বাটি জর্দা), four রসিদ, and at this বাবুর্চি every plate goes with exactly
// two glasses. মামা wants the price of a plate alone (next month's দাওয়াত
// makes its own বোরহানি). Nasib: চারটা রসিদ, তিনটা দাম, বের হবেই।
//   রসিদ 1 (1, 2, 0) 160 · রসিদ 2 (1, 2, 1) 200 · রসিদ 3 (2, 4, 1) 360 ·
//   রসিদ 4 (3, 6, 0) 480। True prices (120, 20, 40). rank 2 (3 = 1 + 2,
//   4 = 3 × 1; glass column = 2 × plate column), nullspace (−2, 1, 0).
//
// No দামের কাগজ for three prices: three price sliders and a lamp per রসিদ
// (the plan's default). The lamp, money bar and রসিদ card are local copies of
// 10.1's (receipt-journey.tsx), grown to any number of things.
//
// Screens. 1 seals the bet: how many prices do the four রসিদ pin? (HowManyBet)
// 2 find prices that light all four lamps (FindOne). 3 predict, then press
// the coupled move, plate −20 and glass +10: no lamp goes out (GhostMove).
// 4 the move alone, (−2, 1, 0), through each রসিদ: the change is 0
// (WhyBlind). 5 fold the রসিদ that are made of others: two stay
// (HonestCount). 6 the নাশতা bill: one fact, two blind moves (SeenPlusBlind).
// 7 Your turn: the ময়রার pair on the দামের কাগজ, build the blind move
// (YourBlind). 8 Try it: which old bill has a blind move (TryBlind). 9 the
// fix: রসিদ 5, বোরহানি একা, pins the price (PinIt). 10 the end (MDX only).
//
// After the screens: the story scenes (NightBundle, SaminNotices, SomStacks,
// NastaPage, RinaSlips, BorhaniEka, KhataClosed, VanwalaGate) and the
// watch-only figures (PlateAlone, ThreeAxes, TrayFig, CrushFig, ColumnsCopy,
// SlotsFig, ThreeAnswers, BookSlip).

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const LAMP = "#facc15";
const BAD = "#dc2626";
const GOOD = "#16a34a";
/** the রসিদ, by their card colour */
const REC_COL = ["#2563eb", "#c026d3", "#0d9488", "#d97706", "#475569"] as const;

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

// ---------------------------------------------------------------------------
// The হিসাব। A রসিদ says how many of each thing (n) and the মোট (c). A price
// set p lights its lamp when the pile n·p is exactly c.

type Item = { k: string; col: string };
type Rec = { name: string; n: readonly number[]; c: number };

const FOOD: Item[] = [
  { k: "প্লেট", col: "#b45309" },
  { k: "গ্লাস", col: "#4ade80" },
  { k: "বাটি", col: "#f97316" },
];
/** what each number in a (প্লেট, গ্লাস, বাটি) list counts */
const FOOD_SLOTS = ["বিরিয়ানির প্লেট", "বোরহানির গ্লাস", "জর্দার বাটি"] as const;

const RECS: Rec[] = [
  { name: "রসিদ 1", n: [1, 2, 0], c: 160 },
  { name: "রসিদ 2", n: [1, 2, 1], c: 200 },
  { name: "রসিদ 3", n: [2, 4, 1], c: 360 },
  { name: "রসিদ 4", n: [3, 6, 0], c: 480 },
];
const R5: Rec = { name: "রসিদ 5", n: [0, 5, 0], c: 100 };
const TRUE3 = [120, 20, 40];
/** the move the রসিদ can't see, as the widget presses it: plate −20, glass +10 */
const GHOST = [-20, 10, 0];
const FOOD_MAX = [200, 80, 80];

const pile = (r: Rec, p: readonly number[]) => r.n.reduce((s, x, i) => s + x * p[i], 0);
const lights = (r: Rec, p: readonly number[]) => Math.abs(pile(r, p) - r.c) < 1e-6;
const add = (a: readonly number[], b: readonly number[], t = 1) => a.map((x, i) => x + b[i] * t);

/** a রসিদের lamp: lit when the prices give its মোট */
function Lamp({ on, size = 18 }: { on: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 20 22" width={size} height={size * 1.1} aria-hidden="true" className="shrink-0">
      <circle cx={10} cy={9} r={9} fill={LAMP} opacity={on ? 0.45 : 0} className="transition-opacity duration-300 motion-reduce:transition-none" />
      <circle cx={10} cy={9} r={5.8} fill={on ? LAMP : "#e5e7eb"} stroke={on ? "#a16207" : "#64748b"} strokeWidth={1} className="transition-[fill] duration-300 motion-reduce:transition-none" />
      <rect x={7.2} y={14.5} width={5.6} height={4.5} rx={1} fill="#64748b" />
    </svg>
  );
}

/** the pile of taka the prices make on this রসিদ, one block per thing, against its মোট (a dashed mark) */
function MoneyBar({ rec, price, items }: { rec: Rec; price: readonly number[]; items: Item[] }) {
  const id = useId();
  const W = 112;
  const s = W / (rec.c * 1.5);
  const blocks: { x: number; w: number; fill: string }[] = [];
  let at = 0;
  rec.n.forEach((count, i) => {
    for (let j = 0; j < count; j++) {
      blocks.push({ x: at, w: price[i] * s, fill: items[i].col });
      at += price[i] * s;
    }
  });
  const over = at > W;
  return (
    <svg viewBox="0 0 124 20" className="block h-auto w-full" aria-hidden="true">
      <defs>
        <clipPath id={`${id}c`}>
          <rect x={4} y={0} width={W} height={22} />
        </clipPath>
      </defs>
      <rect x={4} y={9} width={W} height={10} rx={2} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={0.6} />
      <g clipPath={`url(#${id}c)`}>
        {blocks.map((b, i) => (
          <rect key={i} x={4 + b.x} y={9} width={Math.max(0, b.w)} height={10} fill={b.fill} stroke="white" strokeWidth={0.8} className="transition-[x,width] duration-500 motion-reduce:transition-none" />
        ))}
      </g>
      {over && <path d={`M${4 + W} 9l4 2.5l-4 2.5l4 2.5`} fill="none" stroke={BAD} strokeWidth={1} />}
      <path d={`M${4 + rec.c * s} 6.5V21.5`} stroke={INK} strokeWidth={1.2} strokeDasharray="2 1.5" />
      <text x={4 + rec.c * s} y={6} textAnchor="middle" fontSize={6.5} fontWeight={700} fontFamily={MONO} fill={INK}>
        {rec.c}
      </text>
    </svg>
  );
}

/** a রসিদ as a white slip: its counts and মোট, its lamp, and (bar) the money bar at these prices */
function RecCard({ rec, color, price, items, bar = true, note, compact = false }: { rec: Rec; color: string; price: readonly number[]; items: Item[]; bar?: boolean; note?: string; compact?: boolean }) {
  const on = lights(rec, price);
  const tone = on ? "মিললো" : pile(rec, price) < rec.c ? "টাকা কম" : "টাকা বেশি";
  return (
    <div className="w-full rounded-lg border-2 bg-white px-1.5 py-1 text-[#0f1b2d] shadow-sm" style={{ borderColor: color }}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[0.7rem] leading-tight font-bold" style={{ color }}>
          {rec.name}
          {compact && <span className="font-normal text-[#0f1b2d]"> · {items.map((it, i) => `${it.k} ${rec.n[i]}`).join(", ")}</span>}
        </span>
        <Lamp on={on} />
      </div>
      {!compact && (
        <>
          <div className="text-[0.66rem] leading-snug">{items.map((it, i) => `${it.k} ${rec.n[i]}`).join(" · ")}</div>
          <div className="text-[0.68rem] leading-snug font-semibold">
            মোট {rec.c} টাকা{note && <span className="font-normal text-[#64748b]"> · {note}</span>}
          </div>
        </>
      )}
      {bar && (
        <>
          <MoneyBar rec={rec} price={price} items={items} />
          {!compact && <div className={`text-center text-[0.62rem] leading-none ${on ? "font-semibold text-[#a16207]" : "text-[#64748b]"}`}>{tone}</div>}
        </>
      )}
    </div>
  );
}

/** one price as a slider: the knob glides to its value; tap or drag the track, or − / + */
function PriceRow({ item, value, max, step = 10, onChange, tag }: { item: Item; value: number; max: number; step?: number; onChange?: (v: number) => void; tag?: ReactNode }) {
  const pick = (e: PointerEvent<HTMLDivElement>) => {
    if (!onChange) return;
    const r = e.currentTarget.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - r.left - 8) / (r.width - 16)));
    onChange(Math.round((t * max) / step) * step);
  };
  const pct = (Math.max(0, Math.min(value, max)) / max) * 100;
  const btn = "grid size-6 shrink-0 cursor-pointer place-items-center rounded-full border border-border text-sm font-bold text-muted hover:text-foreground disabled:cursor-default disabled:opacity-30";
  const glide = "transition-all duration-500 motion-reduce:transition-none";
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-12 shrink-0 text-xs leading-tight font-semibold">{item.k}</span>
      <div
        aria-hidden="true"
        className={`relative h-6 min-w-0 flex-1 touch-none ${onChange ? "cursor-pointer" : ""}`}
        onPointerDown={(e) => {
          if (!onChange) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons) pick(e);
        }}
      >
        <div className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#cbd5e1]">
          <div className={`h-full rounded-full ${glide}`} style={{ width: `${pct}%`, background: item.col }} />
          <div className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-white ${glide}`} style={{ left: `${pct}%`, borderColor: item.col }} />
        </div>
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">{value}</span>
      {onChange && (
        <>
          <button type="button" className={btn} aria-label={`${item.k} ${step} টাকা কম`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - step))}>
            −
          </button>
          <button type="button" className={btn} aria-label={`${item.k} ${step} টাকা বেশি`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
            +
          </button>
        </>
      )}
      {tag}
    </div>
  );
}

/** the three food things as small drawings, feet at (x, y) */
function IcPlate({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <ellipse cx={0} cy={-3} rx={15} ry={5} fill="white" stroke="#94a3b8" strokeWidth={0.8} />
      <path d="M-10 -5q10 -12 20 0Z" fill="#fbbf24" stroke="#b45309" strokeWidth={0.6} />
      <circle cx={-2} cy={-9} r={2} fill="#b45309" />
      <circle cx={4} cy={-7} r={1.6} fill="#92400e" />
    </g>
  );
}
function IcGlass({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-5 -18h10l-1.5 18h-7Z" fill="#dcfce7" stroke="#16a34a" strokeWidth={0.8} />
      <path d="M-4.4 -12h8.8l-1 12h-6.8Z" fill="#86efac" />
    </g>
  );
}
function IcBowl({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-10 -9h20q-2 9 -10 9q-8 0 -10 -9Z" fill="white" stroke="#94a3b8" strokeWidth={0.8} />
      <ellipse cx={0} cy={-9} rx={10} ry={2.6} fill="#f97316" />
      <circle cx={-3} cy={-10} r={1} fill="#fef08a" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The three things with a "?" on each price; four cards:
//     how many prices will the four রসিদ pin? Sealing acts it out: that many
//     "পাক্কা" stamps drop into মামার খাতার line, the rest stay "?".

const X1_CARDS = [
  { n: 3, say: "তিনটাই", who: "নাসিব" },
  { n: 2, say: "দুইটা", who: "" },
  { n: 1, say: "একটা", who: "" },
  { n: 0, say: "একটাও না", who: "" },
];

export function HowManyBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(450);
  const k = !sealed ? 0 : act.running ? act.k : 3;
  const n = bet === null ? 0 : X1_CARDS[bet].n;
  const seal = () => {
    if (sealed || bet === null) return;
    setSealed(true);
    act.play(3, () => pass("বাজি সিল হলো। আগে একটা দাম মিলাই।"));
  };
  return (
    <>
      <svg viewBox="0 0 280 104" className="mx-auto block h-auto w-full max-w-[18rem]" role="img" aria-label="তিনটা জিনিস, বিরিয়ানির প্লেট, বোরহানির গ্লাস, জর্দার বাটি; প্রতিটার দাম প্রশ্নবোধক; নিচে মামার খাতার লাইন: পাক্কা দাম কয়টা">
        <rect x={2} y={2} width={276} height={100} rx={6} fill="#fefce8" stroke="#a16207" strokeWidth={0.8} />
        {[
          { x: 50, el: <IcPlate x={50} y={40} s={1.3} />, name: "প্লেট" },
          { x: 140, el: <IcGlass x={140} y={40} s={1.3} />, name: "গ্লাস" },
          { x: 230, el: <IcBowl x={230} y={40} s={1.3} />, name: "বাটি" },
        ].map((t) => (
          <g key={t.name}>
            {t.el}
            <text x={t.x} y={54} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
              {t.name}
            </text>
            <rect x={t.x + 18} y={14} width={26} height={16} rx={3} fill="white" stroke="#94a3b8" strokeWidth={0.7} />
            <text x={t.x + 31} y={26} textAnchor="middle" fontSize={11} fontWeight={800} fill="#64748b">
              ?
            </text>
          </g>
        ))}
        <path d="M12 66H268" stroke="#bae6fd" strokeWidth={0.6} />
        <text x={16} y={86} fontSize={10} fontWeight={700} fill={INK}>
          পাক্কা দাম:
        </text>
        {[0, 1, 2].map((i) => {
          const x = 116 + i * 52;
          return (
            <g key={i}>
              <circle cx={x} cy={82} r={15} fill="none" stroke="#cbd5e1" strokeDasharray="3 2" />
              {k > i && i < n && (
                <g className={POP}>
                  <circle cx={x} cy={82} r={15} fill="#dbeafe" stroke="#2563eb" strokeWidth={1.5} />
                  <text x={x} y={85} textAnchor="middle" fontSize={8} fontWeight={800} fill="#2563eb">
                    পাক্কা
                  </text>
                </g>
              )}
              {k > i && i >= n && (
                <text x={x} y={87} textAnchor="middle" fontSize={14} fontWeight={800} fill="#94a3b8" className={POP}>
                  ?
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.say} n={i} look={bet === i ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{c.say}</span>
              {c.who && <span className="text-xs text-muted">{c.who} বলে</span>}
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={sealed || bet === null} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 3}>চারটা রসিদ থেকে কয়টা দাম পাক্কা বের হবে? একটা বেছে সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Find one price set that lights all four lamps. Three sliders (প্লেট
//     0–200, গ্লাস 0–80, বাটি 0–80, in steps of 10), four রসিদ cards with
//     their money bars.

function FoodBoard({ p, onSet, recs = RECS, tags, compact = false }: { p: readonly number[]; onSet?: (i: number, v: number) => void; recs?: Rec[]; tags?: ReactNode[]; compact?: boolean }) {
  return (
    <>
      <div className="flex flex-col gap-1">
        {FOOD.map((it, i) => (
          <PriceRow key={it.k} item={it} value={p[i]} max={FOOD_MAX[i]} onChange={onSet ? (v) => onSet(i, v) : undefined} tag={tags?.[i]} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {recs.map((r, i) => (
          <RecCard key={r.name} rec={r} color={REC_COL[i]} price={p} items={FOOD} compact={compact} />
        ))}
      </div>
    </>
  );
}

export function FindOne() {
  const pass = useGate();
  const [p, setP] = useSeed<number[]>("p", [100, 40, 0]);
  const [done, setDone] = useSeed("done", false);
  const lit = RECS.filter((r) => lights(r, p)).length;
  const set = (i: number, v: number) => {
    const next = p.map((x, j) => (j === i ? v : x));
    setP(next);
    if (!done && RECS.every((r) => lights(r, next))) {
      setDone(true);
      pass("চারটা বাতিই জ্বললো।");
    }
  };
  return (
    <>
      <FoodBoard p={p} onSet={set} />
      <div className="mt-1.5 text-center text-xs text-muted">
        জ্বলছে: <span className="font-mono">{lit}</span> / 4
      </div>
      <Task done={done}>তিনটা দাম টেনে এমন জায়গায় আনুন, যেখানে চারটা বাতিই জ্বলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict first, then press. From (120, 20, 40), all four lit: plate −20
//     and glass +10 together. The guess is three lamp rows (all out, some
//     out, none out); then the reader presses the move: the two knobs glide
//     together, the plate blocks shrink as the glass blocks grow, the lamps
//     stay lit.

const X3_ANS = 2;
const X3_PICS = [
  { lit: [false, false, false, false], say: "চারটাই নিভবে" },
  { lit: [true, false, true, false], say: "কয়েকটা নিভবে" },
  { lit: [true, true, true, true], say: "একটাও না" },
];

export function GhostMove() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [shift, setShift] = useSeed("shift", 0);
  const [presses, setPresses] = useSeed("presses", 0);
  const land = usePlay(650);
  const p = add(TRUE3, GHOST, shift);
  const go = (d: number) => {
    const s = shift + d;
    if (guess === null || s < -2 || s > 6) return;
    setShift(s);
    const n = presses + 1;
    setPresses(n);
    if (n === 3) land.play(1, () => pass("এই দিকে দাম সরালে কোনো রসিদ টেরই পায় না।"));
  };
  return (
    <>
      <FoodBoard p={p} compact />
      {guess === null ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {X3_PICS.map((c, i) => (
            <button key={c.say} type="button" onClick={() => setGuess(i)} className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-border px-1 py-1.5 hover:border-cat-blue/60">
              <span className="flex gap-0.5">
                {c.lit.map((on, j) => (
                  <Lamp key={j} on={on} size={14} />
                ))}
              </span>
              <span className="text-xs leading-tight font-semibold">{c.say}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex flex-col items-center gap-1.5">
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className={primaryBtn} disabled={shift >= 6} onClick={() => go(1)}>
              প্লেট −20, গ্লাস +10
            </button>
            <button type="button" className={quietBtn} disabled={shift <= -2} onClick={() => go(-1)}>
              উল্টা
            </button>
          </div>
          <div className="text-xs text-muted">
            আপনার guess: <span className="font-semibold">{X3_PICS[guess].say}</span> · সরানো: <span className="font-mono">{presses}</span> বার
          </div>
          {presses > 0 && guess !== X3_ANS && <Nope>একটা বাতিও নিভলো না। বার দেখুন: প্লেট যতটা ছোট, দুই গ্লাস মিলে ততটা বড়।</Nope>}
        </div>
      )}
      <Task done={presses >= 3 && !land.running}>আগে guess করুন, কয়টা বাতি নিভবে। তারপর দাম তিনবার সরান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The move alone, (−2, 1, 0): 2 টাকা off each plate, 1 টাকা on each
//     glass. Tap a রসিদ: red blocks (the plates' loss) grow left, green
//     blocks (the glasses' gain) grow right, then they cancel to 0 and the
//     lamp stays lit.

const X4_MOVE = [-2, 1, 0];

/** a move's change on one রসিদ, as blocks: each thing's loss red to the left, gain green to the right; phase 2 shows the net */
function ChangeBar({ rec, move, phase, u = 7 }: { rec: Rec; move: readonly number[]; phase: number; u?: number }) {
  const net = pile(rec, move);
  const left: number[] = [];
  const right: number[] = [];
  rec.n.forEach((count, i) => {
    for (let j = 0; j < count; j++) {
      if (move[i] < 0) left.push(-move[i]);
      if (move[i] > 0) right.push(move[i]);
    }
  });
  const C = 62;
  let at = 0;
  let bt = 0;
  return (
    <svg viewBox="0 0 124 30" className="block h-auto w-full" aria-hidden="true">
      <path d={`M${C} 3V25`} stroke={INK} strokeWidth={0.8} />
      <g opacity={phase >= 2 && net === 0 ? 0.18 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
        {left.map((w, i) => {
          at += w * u;
          return phase >= 1 ? <rect key={`l${i}`} x={C - at} y={8} width={w * u} height={10} fill="#fca5a5" stroke={BAD} strokeWidth={0.7} className={POP} style={{ transitionDelay: `${i * 90}ms` }} /> : null;
        })}
        {right.map((w, i) => {
          const x = C + bt;
          bt += w * u;
          return phase >= 1 ? <rect key={`r${i}`} x={x} y={8} width={w * u} height={10} fill="#86efac" stroke={GOOD} strokeWidth={0.7} className={POP} style={{ transitionDelay: `${i * 90}ms` }} /> : null;
        })}
      </g>
      {phase >= 1 && (
        <>
          <text x={C - 3} y={27} textAnchor="end" fontSize={6.5} fontWeight={700} fill={BAD}>
            কমলো
          </text>
          <text x={C + 3} y={27} fontSize={6.5} fontWeight={700} fill={GOOD}>
            বাড়লো
          </text>
        </>
      )}
      {phase >= 2 && (
        <g className={POP}>
          <rect x={(net === 0 ? C : 104) - 16} y={5} width={32} height={16} rx={4} fill="white" stroke={net === 0 ? INK : BAD} strokeWidth={1} />
          <text x={net === 0 ? C : 104} y={16.5} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily={MONO} fill={net === 0 ? INK : BAD}>
            {net === 0 ? "0" : net < 0 ? `−${-net}` : `+${net}`}
          </text>
        </g>
      )}
    </svg>
  );
}

export function WhyBlind() {
  const pass = useGate();
  const [ran, setRan] = useSeed<number[]>("ran", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const play = usePlay(800);
  const run = (i: number) => {
    if (play.running || ran.includes(i)) return;
    setCur(i);
    play.play(2, () => {
      const next = [...ran, i];
      setRan(next);
      if (next.length === 4) pass("যে বদল A পুরা শূন্য বানায়, রসিদ তা দেখে না।");
    });
  };
  const phase = (i: number) => (ran.includes(i) ? 2 : cur === i && play.running ? play.k + 1 : 0);
  return (
    <>
      <div className="text-center text-sm">
        বদল: <span className="font-mono font-semibold"><Tup v={X4_MOVE} of={FOOD_SLOTS} /></span> টাকা
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {RECS.map((r, i) => (
          <button key={r.name} type="button" onClick={() => run(i)} className="cursor-pointer rounded-lg border-2 bg-white px-1.5 py-1 text-left text-[#0f1b2d] shadow-sm disabled:cursor-default" style={{ borderColor: REC_COL[i] }} disabled={ran.includes(i)}>
            <span className="flex items-center justify-between">
              <span className="text-[0.7rem] font-bold" style={{ color: REC_COL[i] }}>
                {r.name}
              </span>
              <Lamp on />
            </span>
            <span className="block text-[0.66rem] leading-snug">{FOOD.map((it, j) => `${it.k} ${r.n[j]}`).join(" · ")}</span>
            <ChangeBar rec={r} move={X4_MOVE} phase={phase(i)} />
            <span className={`block text-center text-[0.62rem] leading-tight ${phase(i) >= 2 ? "font-semibold text-[#a16207]" : "text-[#64748b]"}`}>{phase(i) >= 2 ? "মোট বদল 0, বাতি জ্বলেই আছে" : "tap করে চালান"}</span>
          </button>
        ))}
      </div>
      <Task done={ran.length === 4 && !play.running}>বদলটা চারটা রসিদেই চালান। প্রতিটায় মোট কত বদলায়, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · How many facts? Tap a রসিদ and a copy goes into the মিশানো রসিদ। When
//     the mix is exactly another রসিদ, that রসিদ folds away (it says nothing
//     new). রসিদ 3 = 1 + 2, রসিদ 4 = 1 × 3; 1 and 2 never fold.

/** a রসিদের counts as little blocks, one per thing */
function Blocks({ n, items, size = 7 }: { n: readonly number[]; items: Item[]; size?: number }) {
  const cells: string[] = [];
  n.forEach((count, i) => {
    for (let j = 0; j < count; j++) cells.push(items[i].col);
  });
  return (
    <span className="flex flex-wrap gap-[2px]" aria-hidden="true">
      {cells.map((c, i) => (
        <span key={i} className="block rounded-[2px] border border-black/20" style={{ width: size, height: size, background: c }} />
      ))}
    </span>
  );
}

const X5_MAX = 4;

export function HonestCount() {
  const pass = useGate();
  const [mix, setMix] = useSeed<number[]>("mix", [0, 0, 0, 0]);
  const [gone, setGone] = useSeed<number[]>("gone", []);
  const [how, setHow] = useSeed<Record<number, string>>("how", {});
  const [match, setMatch] = useSeed<number | null>("match", null);
  const [full, setFull] = useState(false);
  const fold = usePlay(900);
  const sum = RECS.reduce((s, r, i) => add(s, r.n, mix[i]), [0, 0, 0]);
  const total = RECS.reduce((s, r, i) => s + r.c * mix[i], 0);
  const copies = mix.reduce((s, x) => s + x, 0);
  const words = (m: number[]) =>
    m
      .map((x, i) => (x === 0 ? "" : x === 1 ? RECS[i].name : `${RECS[i].name} × ${x}`))
      .filter(Boolean)
      .join(" + ");
  const tap = (i: number) => {
    if (fold.running || gone.includes(i)) return;
    if (copies >= X5_MAX) {
      setFull(true);
      return;
    }
    setFull(false);
    const next = mix.map((x, j) => (j === i ? x + 1 : x));
    const s = RECS.reduce((acc, r, j) => add(acc, r.n, next[j]), [0, 0, 0]);
    const t = RECS.reduce((acc, r, j) => acc + r.c * next[j], 0);
    setMix(next);
    const j = RECS.findIndex((r, jj) => !gone.includes(jj) && next[jj] === 0 && r.c === t && r.n.every((x, q) => x === s[q]));
    if (j < 0) return;
    setMatch(j);
    fold.play(1, () => {
      const g = [...gone, j];
      setGone(g);
      setHow({ ...how, [j]: words(next) });
      setMix([0, 0, 0, 0]);
      setMatch(null);
      if (g.length === 2) pass("চারটা রসিদ, খবর দুইটা।");
    });
  };
  return (
    <>
      <div className="flex flex-col gap-1">
        {RECS.map((r, i) => {
          const out = gone.includes(i);
          return (
            <button
              key={r.name}
              type="button"
              disabled={out}
              onClick={() => tap(i)}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border-2 bg-white px-2 text-left text-[#0f1b2d] transition-[opacity,padding] duration-500 disabled:cursor-default motion-reduce:transition-none ${out ? "py-0.5 opacity-45" : "py-1"} ${match === i ? "ring-2 ring-[#facc15]" : ""}`}
              style={{ borderColor: REC_COL[i] }}
            >
              <span className="w-12 shrink-0 text-[0.72rem] font-bold" style={{ color: REC_COL[i] }}>
                {r.name}
              </span>
              {out ? (
                <span className={`text-[0.7rem] ${FADE}`}>= {how[i]} · নতুন কিছু না</span>
              ) : (
                <>
                  <span className="min-w-0 flex-1">
                    <Blocks n={r.n} items={FOOD} />
                  </span>
                  <span className="shrink-0 font-mono text-[0.72rem] font-semibold">{r.c}</span>
                  {mix[i] > 0 && <span className="shrink-0 rounded-full bg-[#0f1b2d] px-1.5 font-mono text-[0.65rem] text-white">×{mix[i]}</span>}
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 rounded-xl border-2 border-dashed border-border px-2 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold">মিশানো রসিদ</span>
          <button type="button" className="cursor-pointer text-xs text-cat-blue underline disabled:opacity-40" disabled={copies === 0 || fold.running} onClick={() => setMix([0, 0, 0, 0])}>
            খালি করুন
          </button>
        </div>
        <div className="mt-1 flex min-h-6 items-center gap-2">
          <span className="min-w-0 flex-1">{copies ? <Blocks n={sum} items={FOOD} size={8} /> : <span className="text-xs text-muted">রসিদে tap করুন</span>}</span>
          {copies > 0 && (
            <span className="shrink-0 text-xs">
              <Tup v={sum} of={FOOD_SLOTS} /> · <span className="font-mono font-semibold">{total}</span>
            </span>
          )}
        </div>
        {match !== null && <div className={`mt-0.5 text-center text-xs font-semibold text-[#a16207] ${FADE}`}>হুবহু {RECS[match].name}!</div>}
      </div>
      <div className="mt-1.5 text-center text-sm">
        খবর: <span key={gone.length} className={`inline-block font-mono text-lg font-bold ${POP}`}>{4 - gone.length}</span>
      </div>
      {full && <Nope>মিশানো রসিদে অনেক কপি জমেছে। খালি করে আবার শুরু করুন।</Nope>}
      <Task done={gone.length === 2 && !fold.running}>রসিদে tap করে মিশান। কোন রসিদ বাকিগুলো দিয়েই বানানো যায়? এমন রসিদ গুটিয়ে যাবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The নাশতা bill (Check Q6's [[1, 2, 3], [2, 4, 6]]): পিঠা, সিঙ্গারা, চা।
//     Prices (20, 10, 10), both lit. Three moves to try: two keep both lamps
//     lit (5 × (−2, 1, 0) and 2 × (0, −3, 2)), one doesn't. The count reads
//     3 দাম = 1 খবর + the blind ones found.

const NASTA: Item[] = [
  { k: "পিঠা", col: "#92400e" },
  { k: "সিঙ্গারা", col: "#eab308" },
  { k: "চা", col: "#b91c1c" },
];
const NASTA_SLOTS = ["পিঠা", "সিঙ্গারা", "চা"] as const;
const NRECS: Rec[] = [
  { name: "রসিদ 1", n: [1, 2, 3], c: 70 },
  { name: "রসিদ 2", n: [2, 4, 6], c: 140 },
];
const NBASE = [20, 10, 10];
const NMAX = [40, 20, 20];
const X6_MOVES = [
  { v: [-10, 5, 0], blind: true },
  { v: [-5, 0, 5], blind: false },
  { v: [0, -6, 4], blind: true },
];

export function SeenPlusBlind() {
  const pass = useGate();
  const [at, setAt] = useSeed<number | null>("at", null);
  const [found, setFound] = useSeed<number[]>("found", []);
  const land = usePlay(700);
  const p = at === null ? NBASE : add(NBASE, X6_MOVES[at].v);
  const shown = land.running ? NBASE : p;
  const press = (m: number) => {
    if (land.running) return;
    setAt(m);
    land.play(1, () => {
      if (!X6_MOVES[m].blind || found.includes(m)) return;
      const f = [...found, m];
      setFound(f);
      if (f.length === 2) pass("দেখা 1, অন্ধ 2। মোট 3, দামের সংখ্যা।");
    });
  };
  const miss = at !== null && !land.running && !X6_MOVES[at].blind;
  return (
    <>
      <div className="flex flex-col gap-1">
        {NASTA.map((it, i) => (
          <PriceRow key={it.k} item={it} value={p[i]} max={NMAX[i]} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {NRECS.map((r, i) => (
          <RecCard key={r.name} rec={r} color={REC_COL[i]} price={shown} items={NASTA} note={i === 1 ? "রসিদ 1 এর ডবল" : undefined} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X6_MOVES.map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => press(i)}
            className={`cursor-pointer rounded-xl border-2 px-1 py-1.5 text-center text-xs transition-colors duration-300 motion-reduce:transition-none ${found.includes(i) ? "border-accent bg-accent/10" : at === i && miss ? "border-danger/50 bg-danger/5" : "border-border hover:border-cat-blue/60"}`}
          >
            <span className="block text-[0.65rem] text-muted">বদল {i + 1}</span>
            <span className="font-mono font-semibold">
              <Tup v={m.v} of={NASTA_SLOTS} />
            </span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-sm">
        <span>দাম 3 = খবর 1 + অন্ধ</span>
        <span key={found.length} className={`inline-block font-mono text-lg font-bold ${POP}`}>
          {found.length}
        </span>
      </div>
      {miss && <Nope key={`m${at}`}>দুইটা বাতিই নিভলো। চা 3 কাপ, পিঠা 1টা: পিঠায় যা কমলো, চায়ে তার তিনগুণ বাড়লো।</Nope>}
      <Task done={found.length === 2 && !land.running}>তিনটা বদল চালান। কোন কোন বদলে দুইটা বাতিই জ্বলে থাকে? সবগুলো খুঁজুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn (Check Q5, [[1, 2], [2, 4]]): the ময়রার two রসিদ on the
//     দামের কাগজ, রসগোল্লা → right, সন্দেশ ↑ up, one ঘর = 5 টাকা। Shiku at
//     (20, 10). The reader sets a move (two Steppers, in ঘর); its arrow draws
//     from Shiku; হাঁটান walks Shiku +move, back, −move, back; a wrong move
//     steps off the line and both lamps go out.

const SWEET: Item[] = [
  { k: "রসগোল্লা", col: "#fbbf24" },
  { k: "সন্দেশ", col: "#a16207" },
];
const MRECS: Rec[] = [
  { name: "রসিদ 1", n: [1, 2], c: 40 },
  { name: "রসিদ 2", n: [2, 4], c: 80 },
];
const X7_F = makeFrame(0, 8, 0, 5, 22);
const X7_BASE: XY = [4, 2];
const X7_STOPS = [1, 0, -1, 0];
const taka = (p: XY) => [p[0] * 5, p[1] * 5];

export function YourBlind() {
  const pass = useGate();
  const [d, setD] = useSeed<XY>("d", [0, 0]);
  const [tried, setTried] = useSeed<XY | null>("tried", null);
  const [miss, setMiss] = useState(0);
  const walk = usePlay(650);
  const good = (m: XY) => (m[0] !== 0 || m[1] !== 0) && m[0] + 2 * m[1] === 0;
  // mid-walk: the stop reached; after a wrong walk Shiku stays off the line
  const t = walk.running ? (walk.k > 0 ? X7_STOPS[walk.k - 1] : 0) : tried && !good(tried) ? 1 : 0;
  const move = tried ?? d;
  const at: XY = [X7_BASE[0] + move[0] * t, X7_BASE[1] + move[1] * t];
  const go = () => {
    if (d[0] === 0 && d[1] === 0) return;
    const m: XY = [d[0], d[1]];
    setTried(m);
    walk.play(4, () => (good(m) ? pass("এই দিকে হাঁটলে কোনো রসিদ টের পায় না।") : setMiss((x) => x + 1)));
  };
  const change = (i: number, v: number) => {
    if (walk.running) return;
    setTried(null);
    setD(i === 0 ? [v, d[1]] : [d[0], v]);
  };
  const f = X7_F;
  const done = tried !== null && !walk.running && good(tried);
  return (
    <>
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-[11.4rem] shrink-0">
          <Plane f={f} label="ময়রার দামের কাগজ: ডানে রসগোল্লার দাম, উপরে সন্দেশের দাম; দুই রসিদের লাইন একটাই; Shiku দাঁড়িয়ে 20, 10 এ; বদলের arrow Shiku থেকে" className="my-0! max-w-none">
            {[2, 4, 6, 8].map((x) => (
              <text key={x} x={f.sx(x)} y={f.sy(0) + 8.5} textAnchor="middle" fontSize={6.5} fontFamily={MONO} className="fill-foreground">
                {x * 5}
              </text>
            ))}
            {[2, 4].map((y) => (
              <text key={y} x={f.sx(0) - 3} y={f.sy(y) + 2.5} textAnchor="end" fontSize={7} fontFamily={MONO} className="fill-foreground">
                {y * 5}
              </text>
            ))}
            <text x={f.sx(8)} y={f.sy(0) + 17} textAnchor="end" fontSize={7.5} fontWeight={700} className="fill-foreground">
              রসগোল্লার দাম
            </text>
            <text x={f.sx(0) - 2} y={f.sy(5) - 6} fontSize={8} fontWeight={700} className="fill-foreground">
              সন্দেশের দাম
            </text>
            <path d={`M${f.sx(8)} ${f.sy(0)}L${f.sx(0)} ${f.sy(4)}`} stroke={REC_COL[0]} strokeWidth={3} opacity={0.8} />
            <path d={`M${f.sx(8)} ${f.sy(0)}L${f.sx(0)} ${f.sy(4)}`} stroke={REC_COL[1]} strokeWidth={1.4} strokeDasharray="5 4" />
            {(d[0] !== 0 || d[1] !== 0) && <Arrow f={f} from={X7_BASE} to={[X7_BASE[0] + d[0], X7_BASE[1] + d[1]]} tone="violet" w={2.2} />}
            <Shiku f={f} at={at} />
          </Plane>
        </div>
        <div className="flex w-[8.3rem] flex-col gap-1.5">
          {MRECS.map((r, i) => (
            <RecCard key={r.name} rec={r} color={REC_COL[i]} price={taka(at)} items={SWEET} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs">
        <span className="flex items-center gap-1">
          রসগোল্লা <Stepper value={d[0]} onChange={(v) => change(0, v)} min={-4} max={4} disabled={walk.running} label="রসগোল্লার ঘর" />
        </span>
        <span className="flex items-center gap-1">
          সন্দেশ <Stepper value={d[1]} onChange={(v) => change(1, v)} min={-2} max={2} disabled={walk.running} label="সন্দেশের ঘর" />
        </span>
        <button type="button" className={primaryBtn} disabled={walk.running || (d[0] === 0 && d[1] === 0)} onClick={go}>
          হাঁটান
        </button>
      </div>
      {tried !== null && !walk.running && !good(tried) && (
        <Nope key={miss}>Shiku লাইন ছেড়ে নামলো, দুইটা বাতিই নিভলো। এক ঘর ডানে গেলে টাকা কতটা বাড়ে? সন্দেশ দুইটা, তাই সন্দেশে কতটা কমাতে হবে?</Nope>
      )}
      <Task done={done}>এমন একটা বদল বানান, যেদিকে Shiku হাঁটলে কোনো বাতি নিভে না। তারপর হাঁটান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it: three old bills from the বাবুর্চির ব্যাগ, each a small table
//     with a lamp per row, all lit at the bill's prices. Tapping a bill tries
//     a move on it: a bill with a blind move keeps every lamp lit; the others
//     lose a lamp. A: full rank 3 × 3. B: মুড়ি and চানাচুর always together
//     (a copied column), blind. C: two prices, a copied row, but its third
//     row sees the move.

const X8_BILLS = [
  { items: ["চা", "বিস্কুট", "কলা"], rows: [[1, 0, 1], [0, 1, 1], [1, 1, 0]], move: [1, -1, 0] },
  { items: ["মুড়ি", "চানাচুর", "চা"], rows: [[1, 1, 0], [2, 2, 1], [3, 3, 2]], move: [1, -1, 0] },
  { items: ["পান", "সুপারি"], rows: [[1, 2], [2, 4], [1, 1]], move: [-2, 1] },
];
const X8_RIGHT = 1;
const X8_NOPE = [
  "বদল (1, −1, 0) চালালাম। রসিদ 1 আর 2 এর বাতি নিভলো। তিনটা রসিদ তিনটা আলাদা খবর, অন্ধ দিক নাই।",
  "",
  "রসিদ 2 তো রসিদ 1 এর ডবল, তাই দুইটাই চুপ। কিন্তু রসিদ 3 এর বাতি নিভলো। দাম দুইটা, খবরও দুইটা। অন্ধ দিক নাই।",
];

export function TryBlind() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(900);
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    play.play(1, () => (i === X8_RIGHT ? pass("মুড়ি আর চানাচুর সবসময় জোড়ায়: অন্ধ।") : setMiss((m) => m + 1)));
  };
  const settled = pick !== null && !play.running;
  return (
    <>
      <div className="flex flex-col gap-1.5">
        {X8_BILLS.map((b, i) => {
          const tried = pick === i && settled;
          return (
            <Choice key={i} n={i} look={tried ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={play.running} onClick={() => choose(i)}>
              <span className="flex w-full items-start gap-3">
                <span className="grid gap-x-2 text-[0.72rem] leading-snug" style={{ gridTemplateColumns: `auto repeat(${b.items.length}, auto) auto` }}>
                  <span />
                  {b.items.map((it) => (
                    <span key={it} className="font-semibold">
                      {it}
                    </span>
                  ))}
                  <span />
                  {b.rows.map((r, j) => {
                    const on = !tried || r.reduce((s, x, q) => s + x * b.move[q], 0) === 0;
                    return [
                      <span key={`n${j}`} className="text-[0.62rem] text-muted">
                        রসিদ {j + 1}
                      </span>,
                      ...r.map((x, q) => (
                        <span key={`${j}${q}`} className="text-center font-mono">
                          {x}
                        </span>
                      )),
                      <Lamp key={`l${j}`} on={on} size={13} />,
                    ];
                  })}
                </span>
                {pick === i && (
                  <span className={`text-[0.7rem] ${FADE}`}>
                    বদল <span className="font-mono">
                      <Tup v={b.move} of={b.items} />
                    </span>
                  </span>
                )}
              </span>
            </Choice>
          );
        })}
      </div>
      {settled && pick !== X8_RIGHT && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={settled && pick === X8_RIGHT}>কোন বিলে অন্ধ দিক আছে? বিলে tap করলে একটা বদল চালিয়ে দেখাবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The fix. Prices at (120, 20, 40); the four রসিদ as small lit slips.
//     "অন্ধ দিকে সরান" wiggles plate −20 / glass +10 and back: nothing goes
//     out. "রসিদ 5 আনুন" brings বোরহানি একা (5 গ্লাস, 100 টাকা)। Now the
//     wiggle puts রসিদ 5 out; the knobs spring back and lock.

export function PinIt() {
  const pass = useGate();
  const [added, setAdded] = useSeed("added", false);
  const [locked, setLocked] = useSeed("locked", false);
  const wig = usePlay(1000);
  const out = wig.running && wig.k === 0;
  const p = out ? add(TRUE3, GHOST) : TRUE3;
  const wiggle = () => {
    if (wig.running) return;
    const withFive = added;
    wig.play(2, () => {
      if (!withFive) return;
      setLocked(true);
      pass("নতুন রসিদ অন্ধ দিকটা ধরে ফেললো।");
    });
  };
  const chip = (sure: boolean) => (
    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.62rem] font-semibold ${sure ? "bg-accent/15 text-accent-text" : "bg-foreground/10 text-muted"}`}>{sure ? "পাক্কা" : "দোলে"}</span>
  );
  return (
    <>
      <div className="flex flex-col gap-1">
        {FOOD.map((it, i) => (
          <PriceRow key={it.k} item={it} value={p[i]} max={FOOD_MAX[i]} tag={chip(i === 2 || locked)} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {RECS.map((r, i) => (
          <div key={r.name} className="flex items-center justify-between rounded-md border-2 bg-white px-1.5 py-0.5 text-[0.68rem] text-[#0f1b2d]" style={{ borderColor: REC_COL[i] }}>
            <span>
              <span className="font-bold" style={{ color: REC_COL[i] }}>
                {r.name}
              </span>{" "}
              · {r.c}
            </span>
            <Lamp on={lights(r, p)} size={15} />
          </div>
        ))}
      </div>
      {added && (
        <div className={`mx-auto mt-1.5 w-[11rem] ${POP}`}>
          <RecCard rec={R5} color={REC_COL[4]} price={p} items={FOOD} note="বোরহানি একা" />
        </div>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button type="button" className={quietBtn} disabled={wig.running} onClick={wiggle}>
          অন্ধ দিকে সরান
        </button>
        <button type="button" className={primaryBtn} disabled={added || wig.running} onClick={() => setAdded(true)}>
          রসিদ 5 আনুন
        </button>
      </div>
      <Task done={locked && !wig.running}>রসিদ 5 আনুন। তারপর দাম আবার অন্ধ দিকে সরিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage pieces for the story scenes (cast <Stage>, 320 × 180, ground 150).

function Name({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK} stroke="white" strokeOpacity={0.6} strokeWidth={2} paintOrder="stroke" className="pointer-events-none">
      {text}
    </text>
  );
}

/** The বাবুর্চি (7.x look): নানা's look, a white cap, his name. `bundle` puts a tied stack of রসিদ in his hand. */
function Baburchi({ x, y, facing = 1, arm = "down", bundle = false }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point"; bundle?: boolean }) {
  return (
    <>
      <Person who="nana" x={x} y={y} facing={facing} arm={arm} />
      <path d={`M${x - 9} ${y - 57}q9 -11 18 0Z`} fill="white" stroke="#cbd5e1" strokeWidth={0.8} className="pointer-events-none" />
      {bundle && arm === "hold" && (
        <g className="pointer-events-none">
          <rect x={x + 12 * facing - 6} y={y - 50} width={13} height={9} fill="white" stroke="#64748b" strokeWidth={0.6} />
          <path d={`M${x + 12 * facing} ${y - 50}v9`} stroke="#b91c1c" strokeWidth={1} />
        </g>
      )}
      <Name x={x} y={y} text="বাবুর্চি" />
    </>
  );
}

/** the ভ্যানওয়ালা (9.4's look): মামা's look, a checked লুঙ্গি, a red গামছা */
function Vanwala({ x, y, facing = 1, arm = "down" }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point" }) {
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} arm={arm} />
      <g className="pointer-events-none">
        <rect x={x - 7} y={y - 22} width={14} height={16} fill="#1e3a8a" />
        <path d={`M${x - 7} ${y - 17}h14M${x - 7} ${y - 11}h14M${x - 2} ${y - 22}v16M${x + 3} ${y - 22}v16`} stroke="#93c5fd" strokeWidth={0.8} />
        <path d={`M${x - 8} ${y - 44}q8 6 16 0l-2 5q-6 4 -12 0Z`} fill={BAD} />
      </g>
      <Name x={x} y={y} text="ভ্যানওয়ালা" />
    </>
  );
}

/** the বারান্দা at night: a dark wall with a door, a lit floor */
function St_Veranda() {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={44} width={320} height={106} fill="#3f3a36" />
      <path d="M0 44H320" stroke="#57534e" strokeWidth={2} />
      <rect x={250} y={74} width={30} height={76} fill="#1c1917" stroke="#57534e" />
      <rect x={0} y={150} width={320} height={30} fill="#b89b72" />
    </g>
  );
}

/** the হারিকেন, base at (x, y): a warm glow, the glass, the flame */
function St_Hariken({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y - 14} r={46} fill="#fde68a" opacity={0.14} />
      <circle cx={x} cy={y - 14} r={24} fill="#fde68a" opacity={0.18} />
      <rect x={x - 6} y={y - 4} width={12} height={4} rx={1} fill="#b91c1c" />
      <path d={`M${x - 5} ${y - 4}q-2 -8 0 -16h10q2 8 0 16Z`} fill="#fef9c3" fillOpacity={0.85} stroke="#b91c1c" strokeWidth={0.8} />
      <path d={`M${x} ${y - 8}q-2.5 -3 0 -7q2.5 3 0 7`} fill="#f97316" />
      <path d={`M${x - 6} ${y - 20}h12M${x} ${y - 20}v-4`} stroke="#b91c1c" strokeWidth={1.2} />
    </g>
  );
}

/** a low চৌকি, its top at y, from x0 to x1 */
function St_Chouki({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x0} y={y} width={x1 - x0} height={6} fill="#92400e" stroke="#78350f" strokeWidth={0.8} />
      <rect x={x0 + 3} y={y + 6} width={4} height={150 - y - 6} fill="#78350f" />
      <rect x={x1 - 7} y={y + 6} width={4} height={150 - y - 6} fill="#78350f" />
    </g>
  );
}

/** a small রসিদ slip lying at (x, y) */
function St_Slip({ x, y, tilt = 0, color = "#64748b" }: { x: number; y: number; tilt?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`} className="pointer-events-none">
      <rect x={-6} y={-4} width={12} height={8} fill="white" stroke={color} strokeWidth={0.7} />
      <path d="M-4 -1.5h8M-4 0.5h6M-4 2.5h4" stroke="#475569" strokeWidth={0.5} />
    </g>
  );
}

/** মামার খাতা, open, at (x, y) */
function St_Khata({ x, y, lines = 2 }: { x: number; y: number; lines?: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 20} ${y - 9}L${x} ${y - 7}L${x + 20} ${y - 9}L${x + 20} ${y + 7}L${x} ${y + 9}L${x - 20} ${y + 7}Z`} fill="#fefce8" stroke="#a16207" strokeWidth={0.8} />
      <path d={`M${x} ${y - 7}V${y + 9}`} stroke="#a16207" strokeWidth={0.6} />
      {Array.from({ length: lines }, (_, i) => (
        <path key={i} d={`M${x + 4} ${y - 3 + i * 4}h12`} stroke="#1e3a8a" strokeWidth={0.8} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Night, load-shedding, the হারিকেন on the চৌকি। The বাবুর্চি comes back
//      with a second bundle; four রসিদ on the চৌকি। মামা asks the price of a
//      plate alone; the বাবুর্চি sells no plate alone; Nasib counts.

export function NightBundle({}: Story) {
  const s = useScene(4, [600, 2000, 2600, 2600, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাতে বারান্দার চৌকিতে হারিকেন; বাবুর্চি আরেকটা বান্ডিল রাখলেন, চারটা রসিদ; মামা জিজ্ঞেস করলেন, বোরহানি বাসায় বানাবো, এক প্লেট কত; বাবুর্চি বললেন, প্লেট আলাদা বেচি না; নাসিব বললো, চারটা রসিদ তিনটা দাম, বের হবেই">
        <St_Veranda />
        <St_Chouki x0={96} x1={196} y={122} />
        <St_Hariken x={112} y={122} />
        {k >= 1 &&
          [0, 1, 2, 3].map((i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 120}ms` }}>
              <St_Slip x={140 + i * 14} y={118} tilt={i % 2 ? 5 : -6} />
            </g>
          ))}
        <Person who="mama" x={60} y={150} facing={1} arm={k === 2 ? "point" : "down"} label />
        <Baburchi x={k >= 1 ? 222 : 300} y={150} facing={-1} arm={k >= 1 ? "down" : "hold"} bundle />
        <Person who="nasib" x={276} y={150} facing={-1} arm={k >= 4 ? "point" : "down"} mood={k >= 4 ? "smug" : "plain"} label />
        {k === 2 && <Bubble x={60} y={84} side="right" lines={["বোরহানি বাসায় বানাবো।", "এক প্লেট কত পড়বে?"]} />}
        {k === 3 && <Bubble x={222} y={84} side="left" lines={["প্লেট আলাদা বেচি না।", "সাথে দুই গ্লাস বোরহানি।"]} />}
        {k >= 4 && <Bubble x={276} y={84} side="left" lines={["চারটা রসিদ, তিনটা দাম।", "বাইর হইবোই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Samin lays the four রসিদ side by side and points at the glass column:
//      every রসিদ has twice as many glasses as plates. The বাবুর্চি: that's
//      the rule here.

export function SaminNotices({}: Story) {
  const s = useScene(3, [600, 2000, 2600, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="সামিন চারটা রসিদ চৌকিতে পাশাপাশি রাখলো; আঙুল দিয়ে গ্লাসের ঘর দেখালো; বললো, প্রতিটা রসিদে গ্লাস প্লেটের দ্বিগুণ; বাবুর্চি বললেন, এক প্লেট মানেই দুই গ্লাস">
        <St_Veranda />
        <St_Chouki x0={100} x1={220} y={122} />
        <St_Hariken x={206} y={122} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} style={{ transform: `translateX(${k >= 1 ? i * 20 : i * 6}px)` }} className="transition-transform duration-700 motion-reduce:transition-none">
            <St_Slip x={120} y={116} color={REC_COL[i]} />
          </g>
        ))}
        {k >= 1 && <path d="M118 110h66" stroke="#4ade80" strokeWidth={2} strokeLinecap="round" opacity={0.8} className={FADE} />}
        <Person who="samin" x={70} y={150} facing={1} arm={k >= 1 ? "point" : "down"} label />
        <Baburchi x={262} y={150} facing={-1} />
        {k === 2 && <Bubble x={70} y={84} side="right" lines={["প্রতিটা রসিদে গ্লাস", "প্লেটের দ্বিগুণ।"]} />}
        {k >= 3 && <Bubble x={262} y={84} side="left" lines={["এক প্লেট মানেই", "দুই গ্লাস।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · Som holds রসিদ 3 up to the হারিকেন; রসিদ 1 and 2 slide over it and
//      fit: এইটা তো রসিদ 1 আর 2 একসাথে।

export function SomStacks({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2600]);
  const k = s.k;
  const big = (x: number, y: number, c: string, n: string) => (
    <g className="pointer-events-none">
      <rect x={x - 11} y={y - 7} width={22} height={14} fill="white" stroke={c} strokeWidth={1.2} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily={MONO} fill={c}>
        {n}
      </text>
    </g>
  );
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="সোম রসিদ 3 হারিকেনের সামনে ধরলো; রসিদ 1 আর রসিদ 2 পাশাপাশি রাখলো; দুইটা মিলে হুবহু রসিদ 3; সোম বললো, এইটা তো রসিদ 1 আর 2 একসাথে">
        <St_Veranda />
        <St_Chouki x0={150} x1={250} y={122} />
        <St_Hariken x={236} y={122} />
        <Person who="som" x={110} y={150} facing={1} arm="hold" label />
        {big(140, 92, REC_COL[2], "3")}
        <g style={{ transform: `translate(${k >= 1 ? 0 : 40}px, ${k >= 1 ? 0 : 26}px)` }} className="transition-transform duration-700 motion-reduce:transition-none">
          {big(182, 92, REC_COL[0], "1")}
        </g>
        {k >= 2 && (
          <g className={FADE}>
            {big(224, 92, REC_COL[1], "2")}
            <text x={203} y={92 + 4} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fde68a">
              +
            </text>
            <text x={161} y={92 + 4} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fde68a">
              =
            </text>
          </g>
        )}
        {k >= 3 && <Bubble x={110} y={58} side="right" lines={["এইটা তো রসিদ 1", "আর 2 একসাথে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Karim pulls one more page out of the বাবুর্চির ব্যাগ: গায়ে হলুদের
//      বিকালের নাশতা, two রসিদ। He reads the first; the second is all double.

export function NastaPage({}: Story) {
  const s = useScene(3, [600, 1800, 2600, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="করিম বাবুর্চির ব্যাগ থেকে আরেকটা পাতা বের করলো; গায়ে হলুদের বিকালের নাশতা; পড়লো, এক পিঠা, দুই সিঙ্গারা, তিন কাপ চা, সত্তর টাকা; পরেরটায় সব ডবল">
        <St_Veranda />
        <St_Hariken x={160} y={150} />
        <g className="pointer-events-none">
          <path d="M214 150l6 -26h26l6 26Z" fill="#a16207" stroke="#78350f" strokeWidth={0.8} />
          <path d="M222 124q11 -10 22 0" fill="none" stroke="#78350f" strokeWidth={1.5} />
        </g>
        <Person who="karim" x={k >= 1 ? 110 : 190} y={150} facing={k >= 1 ? 1 : -1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} label />
        {k >= 1 && (
          <g className={POP}>
            <St_Slip x={124} y={104} tilt={-5} />
            <St_Slip x={130} y={110} tilt={6} />
          </g>
        )}
        {k === 2 && <Bubble x={110} y={76} side="right" lines={["এক পিঠা, দুই সিঙ্গারা,", "তিন কাপ চা। সত্তর টাকা।"]} />}
        {k >= 3 && <Bubble x={110} y={76} side="right" lines={["পরেরটায় সব ডবল।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · Rina brings the ময়রার two রসিদ, found in মামার পাঞ্জাবির পকেট।

export function RinaSlips({}: Story) {
  const s = useScene(2, [600, 1800, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রিনা ঘর থেকে বের হয়ে এলো; হাতে ময়রার দুইটা রসিদ; বললো, মামার পাঞ্জাবির পকেটে ছিলো">
        <St_Veranda />
        <St_Hariken x={150} y={150} />
        <Person who="mama" x={70} y={150} facing={1} label />
        <Person who="rina" x={k >= 1 ? 200 : 265} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} label />
        {k >= 1 && (
          <g className={POP}>
            <St_Slip x={186} y={104} tilt={-6} />
            <St_Slip x={190} y={109} tilt={5} />
          </g>
        )}
        {k >= 2 && <Bubble x={200} y={80} side="left" lines={["ময়রার দুইটা রসিদ।", "পাঞ্জাবির পকেটে ছিলো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · মামা: বোরহানি কখনো আলাদা দেন নাই? The বাবুর্চি remembers: ফিরানির
//      রাতে মামী আলাদা পাঁচ গ্লাস নিছিলেন। He writes a new রসিদ under the
//      হারিকেন।

export function BorhaniEka({}: Story) {
  const s = useScene(3, [600, 2400, 2600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="মামা জিজ্ঞেস করলেন, বোরহানি কখনো আলাদা দেন নাই; বাবুর্চি একটু চুপ থেকে বললেন, ফিরানির রাতে মামী আলাদা পাঁচ গ্লাস নিছিলেন; হারিকেনের আলোয় নতুন রসিদ লিখলেন: বোরহানি একা, পাঁচ গ্লাস, একশো টাকা">
        <St_Veranda />
        <St_Chouki x0={120} x1={220} y={122} />
        <St_Hariken x={136} y={122} />
        <Person who="mama" x={70} y={150} facing={1} arm={k === 1 ? "point" : "down"} label />
        <Baburchi x={250} y={150} facing={-1} arm={k >= 3 ? "hold" : "down"} />
        {k >= 3 && (
          <g className={POP}>
            <rect x={170} y={104} width={36} height={16} fill="white" stroke={REC_COL[4]} strokeWidth={1} />
            <IcGlass x={180} y={118} s={0.6} />
            <text x={198} y={115} textAnchor="middle" fontSize={7} fontWeight={800} fontFamily={MONO} fill={INK}>
              ×5
            </text>
          </g>
        )}
        {k === 1 && <Bubble x={70} y={84} side="right" lines={["বোরহানি কখনো", "আলাদা দেন নাই?"]} />}
        {k === 2 && <Bubble x={250} y={84} side="left" lines={["ফিরানির রাতে মামী", "আলাদা পাঁচ গ্লাস নিছিলেন।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 10a · মামা writes the prices into his খাতা under the হারিকেন। The বাবুর্চি
//       ties his bundle and goes. The current comes back.

export function KhataClosed({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="মামা হারিকেনের আলোয় খাতায় দাম লিখলেন; বাবুর্চি বান্ডিল বেঁধে গেট দিয়ে বের হলেন; কারেন্ট চলে এলো">
        <St_Veranda />
        {k >= 3 && <rect x={0} y={44} width={320} height={106} fill="#fef9c3" opacity={0.18} className={FADE} />}
        {k >= 3 && (
          <g className={FADE}>
            <circle cx={160} cy={52} r={16} fill="#fef9c3" opacity={0.35} />
            <rect x={150} y={48} width={20} height={4} rx={2} fill="#fefce8" />
          </g>
        )}
        <St_Chouki x0={60} x1={160} y={122} />
        <St_Hariken x={146} y={122} />
        <St_Khata x={100} y={114} lines={Math.min(k + 1, 3)} />
        <Person who="mama" x={50} y={150} facing={1} arm="hold" label />
        <Baburchi x={k >= 2 ? 330 : 230} y={150} facing={k >= 2 ? 1 : -1} arm={k >= 1 ? "hold" : "down"} bundle />
      </Stage>
    </StoryFrame>
  );
}

// 10b · The bridge to 10.6. Morning of the leaving day; the ভ্যানওয়ালা at the
//       gate with his own খাতা, fourteen trips। মামা: তোর নিয়মটা কী?

export function VanwalaGate({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="যাওয়ার দিনের সকাল; গেটে ভ্যানওয়ালা, হাতে নিজের খাতা, বিয়ের সপ্তাহের ছয়টা ট্রিপ; বললো, সবগুলার ভাড়া একসাথে; মামা বললেন, তোর নিয়মটা কী">
        <g className="pointer-events-none">
          <rect x={214} y={96} width={8} height={54} fill="#78716c" />
          <rect x={300} y={96} width={8} height={54} fill="#78716c" />
          <path d="M214 96h94" stroke="#57534e" strokeWidth={3} />
          <rect x={232} y={130} width={56} height={6} fill="#92400e" />
          <circle cx={240} cy={144} r={6} fill="none" stroke="#1f2937" strokeWidth={2} />
          <circle cx={280} cy={144} r={6} fill="none" stroke="#1f2937" strokeWidth={2} />
        </g>
        <Person who="mama" x={80} y={150} facing={1} arm={k >= 3 ? "point" : "down"} label />
        <Vanwala x={k >= 1 ? 170 : 260} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && <St_Khata x={150} y={116} lines={3} />}
        {k === 2 && <Bubble x={170} y={80} side="left" lines={["ছয়টা ট্রিপ।", "সবগুলার ভাড়া একসাথে।"]} />}
        {k >= 3 && <Bubble x={80} y={84} side="right" lines={["তোর নিয়মটা কী?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · The stake. The বাবুর্চির package: a plate and two glasses. Next month's
//      দাওয়াত makes its own বোরহানি: the glasses leave; the plate stands
//      alone with a "?" where মামা must write its price.

const X1B_SAY = [
  "বাবুর্চির হিসাবে এক প্লেট মানে প্লেট, সাথে দুই গ্লাস বোরহানি।",
  "সামনের মাসের দাওয়াতে বোরহানি বানানো হবে বাসায়।",
  "থাকবে শুধু প্লেট। তার দাম মামার খাতায় লিখতে হবে। কত?",
];

export function PlateAlone() {
  const s = useScene(2, [600, 1600, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <svg viewBox="0 0 240 100" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="একটা ট্রে: বিরিয়ানির প্লেট আর দুই গ্লাস বোরহানি; গ্লাস দুইটা সরে গেলো; প্লেট একা, দামের ঘরে প্রশ্নবোধক">
        <rect x={30} y={70} width={120} height={8} rx={3} fill="#a8a29e" />
        <IcPlate x={70} y={70} s={1.6} />
        {[0, 1].map((i) => (
          <g key={i} style={{ transform: `translateX(${k >= 1 ? 90 : 0}px)`, opacity: k >= 1 ? 0.35 : 1, transitionDelay: `${i * 120}ms` }} className="transition-[transform,opacity] duration-700 motion-reduce:transition-none">
            <IcGlass x={112 + i * 22} y={70} s={1.4} />
          </g>
        ))}
        {k >= 1 && (
          <text x={222} y={92} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK} className={FADE}>
            বাসায়
          </text>
        )}
        {k >= 2 && (
          <g className={POP}>
            <rect x={48} y={14} width={46} height={22} rx={4} fill="white" stroke="#2563eb" strokeWidth={1.3} />
            <text x={71} y={30} textAnchor="middle" fontSize={13} fontWeight={800} fill="#2563eb">
              ?
            </text>
            <path d="M71 36v12" stroke="#2563eb" strokeWidth={1} strokeDasharray="2 2" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Why sliders. 10.1's paper: two prices, two directions, one dot. A
//      third price would need a third direction, out of the paper. The three
//      directions become three slider tracks.

const X2B_SAY = [
  "10.1 এর কাগজ। দাম দুইটা, দিকও দুইটা। একটা বিন্দু মানে একজোড়া দাম।",
  "তৃতীয় দামের জন্য লাগতো আরেকটা দিক। কাগজ ফুঁড়ে সোজা উপরে।",
  "কাগজে সেটা আঁকা যায় না। তাই তিনটা slider। তিনটা মিলে একটা বিন্দু।",
];

export function ThreeAxes() {
  const s = useScene(2, [600, 1800, 2000]);
  const k = s.k;
  const O: XY = [70, 90];
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="দুইটা দামের দুইটা দিক, তৃতীয় দামের দিক কাগজ ফুঁড়ে; তারপর তিনটা slider">
        {k < 2 && (
          <g>
            <path d="M40 100L200 100L230 60L70 60Z" fill="white" stroke="#94a3b8" strokeWidth={0.7} opacity={0.9} />
            <Lit a={O} b={[190, 90]} list="(1, 0, 0)" w={2} color={FOOD[0].col}>
              <path d={`M${O[0]} ${O[1]}L190 90`} stroke={FOOD[0].col} strokeWidth={2.2} />
            </Lit>
            <Lit a={O} b={[100, 64]} list="(0, 1, 0)" w={2} color="#16a34a">
              <path d={`M${O[0]} ${O[1]}L100 64`} stroke="#16a34a" strokeWidth={2.2} />
            </Lit>
            <text x={190} y={86} textAnchor="end" fontSize={8} fontWeight={700} fill={INK}>
              প্লেট
            </text>
            <text x={104} y={70} fontSize={8} fontWeight={700} fill={INK}>
              গ্লাস
            </text>
            <circle cx={150} cy={76} r={3.5} fill="#7c3aed" />
            {k >= 1 && (
              <g className={FADE}>
                <Lit a={O} b={[70, 12]} list="(0, 0, 1)" w={2} color={FOOD[2].col}>
                  <path d={`M${O[0]} ${O[1]}L70 12`} stroke={FOOD[2].col} strokeWidth={2.2} strokeDasharray="4 3" />
                </Lit>
                <text x={76} y={18} fontSize={8} fontWeight={700} fill={INK}>
                  বাটি
                </text>
              </g>
            )}
          </g>
        )}
        {k >= 2 &&
          FOOD.map((it, i) => (
            <g key={it.k} className={FADE} style={{ transitionDelay: `${i * 150}ms` }}>
              <text x={20} y={32 + i * 28} fontSize={9} fontWeight={700} fill={INK}>
                {it.k}
              </text>
              <rect x={60} y={27 + i * 28} width={150} height={4} rx={2} fill="#cbd5e1" />
              <rect x={60} y={27 + i * 28} width={[90, 38, 75][i]} height={4} rx={2} fill={it.col} />
              <circle cx={60 + [90, 38, 75][i]} cy={29 + i * 28} r={6} fill="white" stroke={it.col} strokeWidth={2.2} />
            </g>
          ))}
      </svg>
    </Scene>
  );
}

// 3½ · Why nothing changed. One plate and two glasses on a tray, tagged 120,
//      20, 20, মোট 160। A 20 টাকা coin leaves the plate, splits into two 10s,
//      one onto each glass. The tray's মোট stays 160.

const X3B_SAY = [
  "এক প্লেট, দুই গ্লাস। 120 আর 20, 20। মোট 160।",
  "প্লেট থেকে 20 টাকা উঠে গেলো। প্লেট এখন 100।",
  "সেই 20 ভাগ হয়ে দুই গ্লাসে 10 করে। গ্লাস এখন 30, 30।",
  "মোট আবার 160। যা গেলো, তাই ফিরলো। রসিদ কিছুই টের পেলো না।",
];

export function TrayFig() {
  const s = useScene(3, [600, 1600, 1800, 2000]);
  const k = s.k;
  const plate = k >= 1 ? 100 : 120;
  const glass = k >= 2 ? 30 : 20;
  const tag = (x: number, v: number, c: string) => (
    <g>
      <rect x={x - 15} y={16} width={30} height={15} rx={3} fill="white" stroke={c} strokeWidth={1} />
      <text key={v} x={x} y={27} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily={MONO} fill={INK} className={FADE}>
        {v}
      </text>
    </g>
  );
  const coin = (x: number, y: number, v: number) => (
    <g style={{ transform: `translate(${x}px, ${y}px)` }} className="transition-transform duration-700 motion-reduce:transition-none">
      <circle r={8} fill="#fde047" stroke="#a16207" strokeWidth={1} />
      <text y={3} textAnchor="middle" fontSize={7} fontWeight={800} fontFamily={MONO} fill={INK}>
        {v}
      </text>
    </g>
  );
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <svg viewBox="0 0 240 104" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="ট্রেতে এক প্লেট আর দুই গ্লাস; প্লেট থেকে 20 টাকা দুই গ্লাসে 10 করে গেলো; মোট একই">
        <rect x={40} y={80} width={156} height={7} rx={3} fill="#a8a29e" />
        <IcPlate x={75} y={80} s={1.5} />
        <IcGlass x={134} y={80} s={1.3} />
        <IcGlass x={172} y={80} s={1.3} />
        {tag(75, plate, FOOD[0].col)}
        {tag(134, glass, "#16a34a")}
        {tag(172, glass, "#16a34a")}
        {k === 1 && coin(104, 44, 20)}
        {k >= 2 && (
          <>
            {coin(134, 46, 10)}
            {coin(172, 46, 10)}
          </>
        )}
        <g>
          <text x={220} y={60} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK}>
            মোট
          </text>
          <text x={220} y={76} textAnchor="middle" fontSize={12} fontWeight={800} fontFamily={MONO} fill={k >= 3 ? GOOD : INK}>
            160
          </text>
        </g>
      </svg>
    </Scene>
  );
}

// 4½ · 6.5's fifth মোড়, columns (1, 0) and (0, 0). The alpana's dots drop
//      onto the lying line; the standing arrow (0, 1) shrinks to the origin;
//      the whole standing line lights up: that মোড়ের nullspace.

const X4B_SAY = [
  "6.5 এর পাঁচ নম্বর মোড়। matrix এর column দুইটা: (1, 0) আর (0, 0)।",
  "মোড় পার হলে আলপনার সব বিন্দু নেমে এলো শোয়ানো লাইনে। উপর-নিচ হারিয়ে গেলো।",
  "খাড়া arrow (0, 1) গিয়ে পড়লো শূন্যে। মোড় ওকে দেখেই না।",
  "খাড়া লাইনের সব arrow শূন্যে যায়। এই লাইনটাই ওই মোড়ের nullspace।",
];

export function CrushFig() {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;
  const O: XY = [120, 96];
  const u = 22;
  const dots: XY[] = [];
  for (let x = -3; x <= 3; x++) for (let y = 1; y <= 3; y++) if ((x + y) % 2 === 0) dots.push([x, y]);
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="আলপনার বিন্দুগুলো শোয়ানো লাইনে নেমে এলো; খাড়া arrow শূন্যে গেলো; খাড়া লাইন nullspace">
        <rect x={0} y={0} width={240} height={110} rx={6} fill="white" />
        <path d={`M10 ${O[1]}H230M${O[0]} 8V106`} stroke="#94a3b8" strokeWidth={0.8} />
        {k >= 3 && <path d={`M${O[0]} 6V106`} stroke={BAD} strokeWidth={4} opacity={0.3} className={FADE} />}
        {dots.map(([x, y], i) => (
          <circle key={i} cx={O[0] + x * u} cy={O[1] - y * u} r={3.2} fill="#c026d3" style={{ transform: `translateY(${k >= 1 ? y * u : 0}px)` }} className="transition-transform duration-700 motion-reduce:transition-none" />
        ))}
        <Lit a={O} b={[O[0] + u, O[1]]} list="(1, 0)" w={2.4} color="#2563eb">
          <path d={`M${O[0]} ${O[1]}H${O[0] + u - 5}`} stroke="#2563eb" strokeWidth={2.4} />
          <path d={`M${O[0] + u} ${O[1]}l-6 -3.5v7Z`} fill="#2563eb" />
        </Lit>
        {k < 2 ? (
          <Lit a={O} b={[O[0], O[1] - u]} list="(0, 1)" w={2.4} color={BAD}>
            <path d={`M${O[0]} ${O[1]}V${O[1] - u + 5}`} stroke={BAD} strokeWidth={2.4} />
            <path d={`M${O[0]} ${O[1] - u}l-3.5 6h7Z`} fill={BAD} />
          </Lit>
        ) : (
          <circle cx={O[0]} cy={O[1]} r={4} fill={BAD} className={POP} />
        )}
        {k >= 3 && (
          <text x={O[0] + 6} y={16} fontSize={9} fontWeight={700} fill={BAD} className={FADE}>
            nullspace
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 5½ · Columns too. The four রসিদ as a table; the plate column ×2 lands on
//      the glass column, row by row; the glass column greys out.

const X5B_SAY = [
  "চারটা রসিদ, তিনটা column: প্লেট, গ্লাস, বাটি।",
  "গ্লাস column প্লেট column এর দ্বিগুণ। প্রতিটা row এ।",
  "তাই column এও নতুন খবর দুইটা: প্লেট আর বাটি।",
];

export function ColumnsCopy() {
  const s = useScene(2, [600, 2000, 2000]);
  const k = s.k;
  const cx = [70, 140, 200];
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <svg viewBox="0 0 240 118" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="চার রসিদের table; গ্লাস column প্লেট column এর দ্বিগুণ">
        <rect x={0} y={0} width={240} height={118} rx={6} fill="white" />
        {FOOD.map((it, j) => (
          <text key={it.k} x={cx[j]} y={16} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
            {it.k}
          </text>
        ))}
        {RECS.map((r, i) => (
          <g key={r.name}>
            <text x={16} y={38 + i * 20} fontSize={8} fontWeight={700} fill={REC_COL[i]}>
              {r.name}
            </text>
            {r.n.map((x, j) => (
              <text key={j} x={cx[j]} y={38 + i * 20} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={INK} opacity={k >= 2 && j === 1 ? 0.3 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
                {x}
              </text>
            ))}
          </g>
        ))}
        {k >= 1 && (
          <g className={FADE}>
            <rect x={cx[0] - 14} y={24} width={28} height={84} rx={5} fill="none" stroke={FOOD[0].col} strokeWidth={1.5} />
            <rect x={cx[1] - 14} y={24} width={28} height={84} rx={5} fill="none" stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4 3" />
            <path d={`M${cx[0] + 15} 66H${cx[1] - 17}`} stroke={INK} strokeWidth={1} />
            <path d={`M${cx[1] - 15} 66l-5 -3v6Z`} fill={INK} />
            <rect x={(cx[0] + cx[1]) / 2 - 9} y={56} width={18} height={11} rx={3} fill="white" />
            <text x={(cx[0] + cx[1]) / 2} y={64.5} textAnchor="middle" fontSize={8} fontWeight={800} fontFamily={MONO} fill={INK}>
              ×2
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 6½ · The count, three times. Each bill a row of price slots: lit = দেখা,
//      dark = অন্ধ। 10.1 হলুদ: 2 = 2 + 0। বিরিয়ানি: 3 = 2 + 1। নাশতা: 3 = 1 + 2।

const X6B_ROWS = [
  { name: "হলুদের জোড়া", seen: 2, all: 2 },
  { name: "বিরিয়ানি", seen: 2, all: 3 },
  { name: "নাশতা", seen: 1, all: 3 },
];
const X6B_SAY = [
  "10.1 এর হলুদের জোড়া: দাম 2টা। দুইটাই দেখা যায়।",
  "বিরিয়ানির হিসাব: দাম 3টা। দেখা 2, অন্ধ 1।",
  "নাশতার হিসাব: দাম 3টা। দেখা 1, অন্ধ 2।",
  "দেখা আর অন্ধ যোগ করলে প্রতিবার দামের সংখ্যা।",
];

export function SlotsFig() {
  const s = useScene(3, [600, 1600, 1600, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <svg viewBox="0 0 240 100" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="তিনটা হিসাবের দামের ঘর: জ্বলা মানে দেখা, অন্ধকার মানে অন্ধ">
        <rect x={0} y={0} width={240} height={100} rx={6} fill="white" />
        {X6B_ROWS.map((r, i) =>
          k >= i ? (
            <g key={r.name} className={FADE}>
              <text x={12} y={26 + i * 28} fontSize={9} fontWeight={700} fill={INK}>
                {r.name}
              </text>
              {Array.from({ length: r.all }, (_, j) => (
                <rect key={j} x={92 + j * 26} y={13 + i * 28} width={20} height={18} rx={4} fill={j < r.seen ? LAMP : "#1f2937"} stroke={j < r.seen ? "#a16207" : "#1f2937"} strokeWidth={1} />
              ))}
              <text x={178} y={26 + i * 28} fontSize={9} fontWeight={700} fontFamily={MONO} fill={INK} opacity={k >= 3 ? 1 : 0} className="transition-opacity duration-500 motion-reduce:transition-none">
                {`${r.all} = ${r.seen} + ${r.all - r.seen}`}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </Scene>
  );
}

// 9½ · Why anyone wants the nullspace. Three price sets on the blind line,
//      each lighting all four রসিদ; asked about a plate alone, they answer
//      160, 120 and 80.

const X9B_SETS = [
  [160, 0, 40],
  [120, 20, 40],
  [80, 40, 40],
];
const X9B_SAY = [
  "তিনটা দাম-set। চারটা রসিদই তিনটায় মিলে।",
  "এবার প্রশ্ন: বোরহানি ছাড়া এক প্লেট কত?",
  "তিন set, তিন উত্তর। রসিদ কোনোটাকেই ভুল বলতে পারে না।",
];

export function ThreeAnswers() {
  const s = useScene(2, [600, 1800, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X9B_SAY, k)}>
      <svg viewBox="0 0 240 104" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="তিনটা দাম-set, সবগুলোতে চারটা বাতি জ্বলে; এক প্লেটের দাম তিনটায় তিন রকম">
        <rect x={0} y={0} width={240} height={104} rx={6} fill="white" />
        {X9B_SETS.map((p, i) => {
          const x = 44 + i * 76;
          return (
            <g key={i}>
              <text x={x} y={18} textAnchor="middle" fontSize={8.5} fontWeight={700} fontFamily={MONO} fill={INK}>
                {`(${p.join(", ")})`}
              </text>
              {RECS.map((r, j) => (
                <circle key={j} cx={x - 18 + j * 12} cy={32} r={4.5} fill={lights(r, p) ? LAMP : "#e5e7eb"} stroke="#a16207" strokeWidth={0.8} />
              ))}
              {k >= 1 && <IcPlate x={x} y={72} s={1.2} />}
              {k >= 2 && (
                <g className={POP} style={{ transitionDelay: `${i * 200}ms` }}>
                  <rect x={x - 18} y={78} width={36} height={16} rx={4} fill="white" stroke="#2563eb" strokeWidth={1.2} />
                  <text x={x} y={90} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily={MONO} fill="#2563eb">
                    {p[0]}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// 10½ · The book's slip (side quest). (1, −2, 0) run on রসিদ 1: −3, the lamp
//       goes out. (−2, 1, 0): 0.

const X10B_SAY = [
  "বই লিখেছে, nullspace এ আছে (1, −2, 0)। রসিদ 1 এ চালাই।",
  "প্লেটে 1 বেশি। দুই গ্লাসে 2 করে কম। মোট বদল −3। বাতি নিভলো।",
  "ঠিকটা (−2, 1, 0)। প্লেটে 2 কম, দুই গ্লাসে 1 করে বেশি। বদল 0।",
];

export function BookSlip() {
  const s = useScene(2, [600, 1800, 2000]);
  const k = s.k;
  const move = k >= 2 ? [-2, 1, 0] : [1, -2, 0];
  const net = pile(RECS[0], move);
  return (
    <Scene scene={s} caption={say(X10B_SAY, k)}>
      <div className="mx-auto w-[11rem] rounded-lg border-2 bg-white px-1.5 py-1 text-[#0f1b2d]" style={{ borderColor: REC_COL[0] }}>
        <div className="flex items-center justify-between">
          <span className="text-[0.7rem] font-bold" style={{ color: REC_COL[0] }}>
            রসিদ 1 · <span className="font-mono">{`(${move.map((x) => (x < 0 ? `−${-x}` : x)).join(", ")})`}</span>
          </span>
          <Lamp on={k === 0 || net === 0} />
        </div>
        <ChangeBar key={k >= 2 ? "b" : "a"} rec={RECS[0]} move={move} phase={k === 0 ? 0 : 2} />
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  HowManyBet: { start: {}, picked: { bet: 0 }, sealed: { bet: 2, sealed: true } },
  FindOne: { start: {}, some: { p: [140, 20, 40] }, done: { p: [120, 20, 40], done: true } },
  GhostMove: { start: {}, guessed: { guess: 0 }, moved: { guess: 0, shift: 2, presses: 2 }, done: { guess: 2, shift: 3, presses: 3 } },
  WhyBlind: { start: {}, two: { ran: [0, 3] }, done: { ran: [0, 1, 2, 3] } },
  HonestCount: { start: {}, mixing: { mix: [1, 1, 0, 0] }, one: { gone: [2], how: { 2: "রসিদ 1 + রসিদ 2" }, mix: [2, 0, 0, 0] }, done: { gone: [2, 3], how: { 2: "রসিদ 1 + রসিদ 2", 3: "রসিদ 1 × 3" } } },
  SeenPlusBlind: { start: {}, miss: { at: 1 }, done: { at: 2, found: [0, 2] } },
  YourBlind: { start: {}, set: { d: [-2, 1] }, wrong: { d: [2, 1], tried: [2, 1] }, right: { d: [-2, 1], tried: [-2, 1] } },
  TryBlind: { start: {}, wrong: { pick: 2 }, right: { pick: 1 } },
  PinIt: { start: {}, added: { added: true }, locked: { added: true, locked: true } },
  NightBundle: { claim: { k: 2 } },
  ThreeAxes: { mid: { k: 1 } },
  TrayFig: { coin: { k: 1 } },
  CrushFig: { mid: { k: 1 } },
  BookSlip: { slip: { k: 1 } },
};
