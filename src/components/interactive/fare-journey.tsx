"use client";

import { useId, useState, type ReactNode } from "react";

import { Tup } from "@/components/journey/box";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, LOOK, Nope, POP, Scene, Stepper, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Lit, Plane, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";

// Screens for "Math for AI 10.6 — ভ্যানের ভাড়া, সবচেয়ে কম গরমিল", told as a
// Journey in the author's Bangla-English. The plan is 10_journey_specs.md,
// block 10.6. The last journey of Article 10 and of Module 2.
//
// Leaving morning. The ভ্যানওয়ালা who takes the family to the bus stand
// carried people all wedding week; his খাতা has six trips as (কিলো, টাকা).
// His rule, he says, is simple: উঠলেই বিশ, কিলো দশ। No rule fits every trip
// (rain, bargaining, নানার বন্ধু). The bus stand, 6 কিলো, has no fare yet.
// Which rule should মামা pay by? The one whose misses, squared and added, are
// the least: least squares.
//
// Eleven screens. 1 seals the bet on four rule lines (RuleBet). 2 every trip
// is a রসিদ on the দামের কাগজ; two at a time they cross, all six never meet
// (PairsDisagree). 3 drag a rule on the ট্রিপের কাগজ: red miss bars, red
// squares, their total (MissSquares). 4 predict, then two trips and a
// rate-only rule: the column picture, the closest point is the shadow
// (ClosestReach). 5 from any start, "সবচেয়ে কম" settles on one line
// (BestLine). 6 one trip only: every rule fits, tomorrow's fare swings
// (FewReceipts). 7 Your turn: the brother's খাতা (YourFit). 8 Try it: three
// situations to three answers (TryWhich). 9 Module 2 in six tiles and one
// chain (ModuleChain). 10 the bet opened (BetOpen). 11 five things to carry
// forward (FiveThings); the rest is MDX.
//
// After the screens: the story scenes (VanwalaKhata, FourLines, KarimRule,
// BrotherVan, HowMuch, PayLaugh, VanOnBandh, BusGlass) and the watch-only
// figures (SixKmFig, NoiseFig, SquareWhy, ShadowDrop, BigTable, FanFig,
// LostDirection), each numbered after its screen.
//
// Numbers (checked with numpy). Trips (কিলো, টাকা): (1, 35) (3, 45) (4, 60)
// (5, 70) (7, 80) (8, 100). Least squares: উঠলেই 23, কিলো 9 (exactly), total
// of squared misses 100. The ভ্যানওয়ালা's (20, 10): 150, and it hits trips 3,
// 4, 6 exactly. Nasib's line through trips 1–2: (30, 5), 1450. Karim's
// through trips 5–6: (−60, 20), 10150. At the bus stand (6 কিলো): 60, 60, 80,
// 77. Rate-only rule on trips 1–2 (b = (35, 45), column (1, 3)): rate 17,
// miss 18.97 (15 → 20, 19 → 20). One trip (3 কিলো, 45): base + 3 × rate =
// 45, an 8 কিলো trip then costs 45…120; the smallest rule (4.5, 13.5). The
// brother's খাতা (2, 35) (4, 50) (5, 70) (6, 75) (8, 100): least squares
// (11, 11), total 50.
//
// The দামের কাগজ (right: উঠার টাকা, up: কিলোর রেট) and the ট্রিপের কাগজ (right:
// কিলো, up: টাকা) are local; the ভ্যানওয়ালা (9.4's look) and the ভ্যান are
// copied, not imported.

const INK = "#0f1b2d";
const MUTE = "#64748b";
const GLOW = "#fde047";
const BAD = "#e11d48";
const OK = "#0d9488";
const RULE = "#2563eb"; // the reader's rule line
const BEST = "#7c3aed"; // least squares (Samin's app line)
const VANC = "#b45309"; // the ভ্যানওয়ালা's rule
const MONO = "ui-monospace, monospace";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

const TRIP_SLOTS = ["কিলো", "টাকা"] as const;
const FARE2_SLOTS = ["ট্রিপ 1 এর ভাড়া", "ট্রিপ 2 এর ভাড়া"] as const;

// ---------------------------------------------------------------------------
// Numbers. A trip is (কিলো, টাকা); a rule is [উঠার টাকা, কিলোর রেট]।

type Trip = { km: number; fare: number };
type Rule = [number, number];
const TRIPS: Trip[] = [
  { km: 1, fare: 35 },
  { km: 3, fare: 45 },
  { km: 4, fare: 60 },
  { km: 5, fare: 70 },
  { km: 7, fare: 80 },
  { km: 8, fare: 100 },
];
/** the brother's খাতা (Your turn) */
const BRO: Trip[] = [
  { km: 2, fare: 35 },
  { km: 4, fare: 50 },
  { km: 5, fare: 70 },
  { km: 6, fare: 75 },
  { km: 8, fare: 100 },
];
const BUS_KM = 6;
const LS: Rule = [23, 9];
const VAN: Rule = [20, 10];
const BRO_LS: Rule = [11, 11];
const START: Rule = [40, 3];

const fareAt = (r: Rule, km: number) => r[0] + r[1] * km;
const sse = (r: Rule, trips: Trip[]) => trips.reduce((s, t) => s + (t.fare - fareAt(r, t.km)) ** 2, 0);
const fits = (r: Rule, t: Trip) => Math.abs(fareAt(r, t.km) - t.fare) < 1e-6;
const round1 = (n: number) => Math.round(n * 10) / 10;
const TRIP_NO = ["1", "2", "3", "4", "5", "6"];

/** the four bet lines: who drew each, and how */
const BETS: { who: string; say: string; rule: Rule; color: string }[] = [
  { who: "নাসিব", say: "প্রথম দুই ট্রিপের উপর দিয়ে", rule: [30, 5], color: OK },
  { who: "করিম", say: "শেষের দুই ট্রিপের উপর দিয়ে", rule: [-60, 20], color: "#db2777" },
  { who: "ভ্যানওয়ালা", say: "উঠলেই বিশ, কিলো দশ", rule: VAN, color: VANC },
  { who: "সামিন", say: "ফোনের app যা দিলো", rule: LS, color: BEST },
];

// ---------------------------------------------------------------------------
// The ট্রিপের কাগজ: right কিলো (0–9), up টাকা in tens (0–120)। A trip is a
// dot; a rule is a straight line; a miss is the red bar from the dot to the
// line, and its square hangs off the bar.

const SC_F = makeFrame(0, 9, 0, 12, 20, 16);
const ty = (fare: number) => fare / 10;

/** clip children to the sheet */
function Clip({ f, children }: { f: Frame; children: ReactNode }) {
  // The frame is in the id too: `npm run shot` renders screens side by side, each
  // its own root, so useId repeats across one page.
  const id = `fc${useId().replace(/[^a-zA-Z0-9]/g, "")}${Math.round(f.W)}x${Math.round(f.H)}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} rx={3} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

/** a sheet of graph paper with its two axes named above and below it */
function Paper({
  f,
  label,
  xName,
  yName,
  w,
  drag,
  children,
}: {
  f: Frame;
  label: string;
  xName: string;
  yName: string;
  w: string;
  drag?: { down?: (p: XY) => void; move?: (p: XY) => void; up?: () => void };
  children?: ReactNode;
}) {
  return (
    <div className={`flex shrink-0 flex-col ${w}`}>
      <span className="text-[0.62rem] leading-tight font-semibold text-muted">{yName}</span>
      <Plane f={f} label={label} className="my-0.5! max-w-none" drag={drag}>
        {children}
      </Plane>
      <span className="self-end text-[0.62rem] leading-tight font-semibold text-muted">{xName}</span>
    </div>
  );
}

/** the edge numbers of the ট্রিপের কাগজ: কিলো every 1, টাকা every 20 */
function TripMarks({ f = SC_F, step = 2 }: { f?: Frame; step?: number }) {
  const xs = Array.from({ length: Math.floor(f.x1) + 1 }, (_, i) => i).filter((x) => x > 0 && (x % 2 === 0 || f.x1 < 10));
  const ys = Array.from({ length: Math.floor(f.y1 / step) + 1 }, (_, i) => i * step).filter((y) => y > 0);
  return (
    <g className="pointer-events-none" fontFamily={MONO} fontSize={8} fill={MUTE}>
      {xs.map((x) => (
        <text key={`x${x}`} x={f.sx(x)} y={f.sy(0) + 10} textAnchor="middle">
          {x}
        </text>
      ))}
      {ys.map((y) => (
        <text key={`y${y}`} x={f.sx(0) - 3} y={f.sy(y) + 3} textAnchor="end">
          {y * 10}
        </text>
      ))}
    </g>
  );
}

/** a rule as a line across the ট্রিপের কাগজ (clip it yourself) */
function RuleLine({ f = SC_F, r, color, w = 2.4, dashed = false, draw = false, faint = false }: { f?: Frame; r: Rule; color: string; w?: number; dashed?: boolean; draw?: boolean; faint?: boolean }) {
  const d = `M${f.sx(f.x0)} ${f.sy(ty(fareAt(r, f.x0)))}L${f.sx(f.x1)} ${f.sy(ty(fareAt(r, f.x1)))}`;
  if (draw)
    return (
      <g stroke={color}>
        <Draw d={d} strokeWidth={w} ms={700} />
      </g>
    );
  return <path d={d} stroke={color} strokeWidth={w} strokeDasharray={dashed ? "5 4" : undefined} strokeLinecap="round" opacity={faint ? 0.35 : 1} fill="none" className="pointer-events-none" />;
}

/** each trip's miss from rule r: a red bar, and (if `squares`) its red square */
function Misses({ f = SC_F, r, trips, squares = true, big = -1 }: { f?: Frame; r: Rule; trips: Trip[]; squares?: boolean; big?: number }) {
  return (
    <g className="pointer-events-none">
      {trips.map((t, i) => {
        const m = t.fare - fareAt(r, t.km);
        if (Math.abs(m) < 1e-6) return null;
        const s = (Math.abs(m) / 10) * f.u;
        const top = Math.min(f.sy(ty(t.fare)), f.sy(ty(fareAt(r, t.km))));
        return (
          <g key={i}>
            {squares && <rect x={f.sx(t.km)} y={top} width={s} height={s} fill={BAD} fillOpacity={i === big ? 0.34 : 0.16} stroke={BAD} strokeWidth={i === big ? 1.6 : 0.9} />}
            <path d={`M${f.sx(t.km)} ${f.sy(ty(t.fare))}V${f.sy(ty(fareAt(r, t.km)))}`} stroke={BAD} strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
}

/** the trips as dots; `lit` marks the ones a rule hits exactly */
function TripDots({ f = SC_F, trips, lit, names = false }: { f?: Frame; trips: Trip[]; lit?: boolean[]; names?: boolean }) {
  return (
    <g className="pointer-events-none">
      {trips.map((t, i) => (
        <g key={i}>
          {lit?.[i] && <circle cx={f.sx(t.km)} cy={f.sy(ty(t.fare))} r={7} fill={GLOW} opacity={0.7} className={POP} />}
          <circle cx={f.sx(t.km)} cy={f.sy(ty(t.fare))} r={3.6} fill={INK} stroke="white" strokeWidth={1} />
          {names && (
            <text x={f.sx(t.km) - 5} y={f.sy(ty(t.fare)) - 6} fontSize={7.5} fontWeight={700} fill={MUTE} textAnchor="end">
              {TRIP_NO[i]}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

/** the whole ট্রিপের কাগজ, with its marks, trips and whatever goes on it */
function TripPaper({ f = SC_F, trips, label, w = "w-[12rem]", names = true, lit, drag, children, over }: { f?: Frame; trips: Trip[]; label: string; w?: string; names?: boolean; lit?: boolean[]; drag?: Parameters<typeof Paper>[0]["drag"]; children?: ReactNode; over?: ReactNode }) {
  return (
    <Paper f={f} label={label} xName="কিলো →" yName="↑ টাকা" w={w} drag={drag}>
      <TripMarks f={f} />
      <Clip f={f}>{children}</Clip>
      <TripDots f={f} trips={trips} lit={lit} names={names} />
      {over}
    </Paper>
  );
}

/** a rule's two handles: উঠার টাকা at km 0, the turn at the sheet's right edge */
function Handles({ f = SC_F, r, color = RULE }: { f?: Frame; r: Rule; color?: string }) {
  const yR = Math.min(f.y1, Math.max(f.y0, ty(fareAt(r, f.x1))));
  const y0 = Math.min(f.y1, Math.max(f.y0, ty(r[0])));
  return (
    <g className="pointer-events-none">
      <circle cx={f.sx(0)} cy={f.sy(y0)} r={6} fill="white" stroke={color} strokeWidth={2.2} />
      <path d={`M${f.sx(0)} ${f.sy(y0) - 3}v6`} stroke={color} strokeWidth={1.6} />
      <circle cx={f.sx(f.x1)} cy={f.sy(yR)} r={6} fill="white" stroke={color} strokeWidth={2.2} />
      <path d={`M${f.sx(f.x1) - 2.5} ${f.sy(yR) + 2}a3 3 0 1 1 5 0`} stroke={color} strokeWidth={1.4} fill="none" />
    </g>
  );
}

/**
 * Drag a rule on the ট্রিপের কাগজ: grab near the left edge to lift the whole
 * line (উঠার টাকা), anywhere else to turn it about its left end (the rate is
 * whatever puts the line through the finger). Snapped to whole taka.
 */
function useRuleDrag(r: Rule, set: (r: Rule) => void, max: Rule = [60, 20]) {
  const [which, setWhich] = useState<0 | 1>(0);
  const apply = (p: XY, w: 0 | 1) => {
    const y = p[1] * 10;
    if (w === 0) set([Math.max(0, Math.min(max[0], Math.round(y - r[1] * Math.max(p[0], 0)))), r[1]]);
    else set([r[0], Math.max(0, Math.min(max[1], Math.round((y - r[0]) / Math.max(p[0], 1))))]);
  };
  return {
    down: (p: XY) => {
      const w: 0 | 1 = p[0] < 2 ? 0 : 1;
      setWhich(w);
      apply(p, w);
    },
    move: (p: XY) => apply(p, which),
  };
}

/** the rule written out, its two numbers naming themselves */
function RuleSays({ r, color = RULE, swatch = true }: { r: Rule; color?: string; swatch?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      {swatch && <span className="inline-block h-1 w-4 rounded-full" style={{ background: color }} />}
      <span>
        উঠলেই <b className="font-mono">{r[0] < 0 ? `−${-r[0]}` : r[0]}</b>, কিলো <b className="font-mono">{r[1]}</b>
      </span>
    </span>
  );
}

/** the red total as a number and a bar that shrinks with it */
function RedTotal({ v, max = 2000, best, label = "লাল বর্গের মোট" }: { v: number; max?: number; best?: number; label?: string }) {
  const w = Math.min(1, v / max);
  return (
    <div className="mx-auto w-full max-w-[18rem]">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">{label}</span>
        <b className="font-mono text-danger tabular-nums">{Math.round(v)}</b>
      </div>
      <div className="relative mt-0.5 h-2.5 overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full rounded-full bg-danger/70" style={{ width: `${w * 100}%` }} />
        {best !== undefined && <div className="absolute top-0 h-full w-0.5 bg-[#7c3aed]" style={{ left: `${Math.min(1, best / max) * 100}%` }} />}
      </div>
    </div>
  );
}

/** a small drawn arrow for rows of steps (no glyph) */
function RowArrow({ both = false }: { both?: boolean }) {
  return (
    <svg viewBox="0 0 16 10" className="h-2.5 w-4 shrink-0 text-muted" aria-hidden="true">
      <path d={both ? "M3 5H13M9 1.5L13 5L9 8.5M7 1.5L3 5L7 8.5" : "M1 5H13M9 1.5L13 5L9 8.5"} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** a রসিদ's lamp: lights when the price dot gives that রসিদের মোট */
function Lamp({ on, size = 18 }: { on: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} role="img" aria-label={on ? "lamp জ্বলছে" : "lamp নেভা"} className="shrink-0">
      {on && <circle cx={10} cy={8} r={9.5} fill={GLOW} opacity={0.5} className={POP} />}
      <path d="M10 1.5a5.8 5.8 0 0 0-3.4 10.5v2.3h6.8v-2.3A5.8 5.8 0 0 0 10 1.5Z" fill={on ? "#facc15" : "#e2e8f0"} stroke={on ? "#a16207" : "#94a3b8"} strokeWidth={1.2} className="transition-colors duration-300 motion-reduce:transition-none" />
      <path d="M7.4 16.4h5.2M8.4 18.4h3.2" stroke="#64748b" strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );
}

/** a tiny picture of a rule line over the six dots, for the bet cards */
function MiniRule({ r, color, size = 44 }: { r: Rule; color: string; size?: number }) {
  const f = makeFrame(0, 9, 0, 12, 3, 2);
  const d = `M${f.sx(0)} ${f.sy(ty(fareAt(r, 0)))}L${f.sx(9)} ${f.sy(ty(fareAt(r, 9)))}`;
  const id = `mr${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} width={size} height={(size * f.H) / f.W} aria-hidden="true" className="shrink-0 rounded bg-white">
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={f.W} height={f.H} />
        </clipPath>
      </defs>
      <path d={d} stroke={color} strokeWidth={1.6} clipPath={`url(#${id})`} />
      {TRIPS.map((t, i) => (
        <circle key={i} cx={f.sx(t.km)} cy={f.sy(ty(t.fare))} r={1.4} fill={INK} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The six trips on the ট্রিপের কাগজ; four people, four
//     lines. Tapping a card draws its line; sealing drops a dashed line up
//     from 6 কিলো (the bus stand) and pops a "?" where the picked line meets
//     it. Nothing is judged.

export function RuleBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(450);
  const beat = !sealed ? 0 : act.running ? act.k : 3;
  const pick = (i: number) => {
    if (sealed) return;
    setBet(i);
  };
  const seal = () => {
    if (sealed || bet === null) return;
    setSealed(true);
    act.play(3, () => pass("বাজি সিল হলো। আগে দুইটা ট্রিপ।"));
  };
  const r = bet === null ? null : BETS[bet].rule;
  return (
    <>
      <div className="flex justify-center">
        <TripPaper
          trips={TRIPS}
          w="w-[10rem]"
          label="ট্রিপের কাগজ: খাতার ছয়টা ট্রিপ বিন্দু হয়ে; বাছাই করা লাইনটা আঁকা"
          over={
            beat >= 1 && r ? (
              <g className="pointer-events-none">
                <path d={`M${SC_F.sx(BUS_KM)} ${SC_F.sy(0)}V${SC_F.sy(12)}`} stroke={MUTE} strokeWidth={1.4} strokeDasharray="4 3" className={FADE} />
                {beat >= 2 && (
                  <g className={POP}>
                    <circle cx={SC_F.sx(BUS_KM)} cy={SC_F.sy(ty(fareAt(r, BUS_KM)))} r={5} fill="white" stroke={BETS[bet ?? 0].color} strokeWidth={2} />
                    <text x={SC_F.sx(BUS_KM) + 8} y={SC_F.sy(ty(fareAt(r, BUS_KM))) - 6} fontSize={14} fontWeight={800} fill="#2563eb">
                      ?
                    </text>
                  </g>
                )}
                {beat >= 3 && (
                  <text x={SC_F.sx(BUS_KM)} y={SC_F.sy(12) - 4} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK} className={FADE}>
                    বাসস্ট্যান্ড
                  </text>
                )}
              </g>
            ) : null
          }
        >
          {r && <RuleLine key={bet} r={r} color={BETS[bet ?? 0].color} draw />}
        </TripPaper>
      </div>
      <div className="mx-auto mt-1.5 grid max-w-[22rem] grid-cols-2 gap-1.5">
        {BETS.map((b, i) => (
          <button
            key={b.who}
            type="button"
            disabled={sealed}
            onClick={() => pick(i)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl border-2 px-2 py-1 text-left leading-tight transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default motion-reduce:transition-none ${
              bet === i ? "border-cat-blue bg-cat-blue/10" : sealed ? "border-border opacity-50" : "border-border hover:border-cat-blue/60"
            }`}
          >
            <MiniRule r={b.rule} color={b.color} size={34} />
            <span className="min-w-0">
              <b className="block text-[0.8rem]">{b.who}</b>
              <span className="block text-[0.7rem] text-muted">{b.say}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={bet === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={sealed && !act.running}>কার লাইন এই খাতার সাথে সবচেয়ে ভালো মিলে? একটা বেছে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// The দামের কাগজ for this journey: right উঠার টাকা (0–50, a ঘর = 5), up কিলোর
// রেট (0–16, a ঘর = 2)। A trip (km, fare) is a রসিদ: উঠার টাকা + km × রেট =
// fare, so it is a line here, the line of every rule that gets that trip
// right. In sheet units X = base / 5, Y = rate / 2: 5X + 2·km·Y = fare.

const PP_F = makeFrame(0, 10, 0, 8, 21, 14);
const TRIP_C = ["#2563eb", "#d97706", "#0d9488", "#7c3aed", "#db2777", "#65a30d"];
const toPP = (r: Rule): XY => [r[0] / 5, r[1] / 2];
const rowOf = (t: Trip): XY => [5, 2 * t.km];

/** the part of the line a·x + b·y = c that lies on the sheet */
function segOf(f: Frame, row: XY, c: number): [XY, XY] | null {
  const [a, b] = row;
  const pts: XY[] = [];
  if (Math.abs(b) > 1e-9)
    for (const x of [f.x0, f.x1]) {
      const y = (c - a * x) / b;
      if (y >= f.y0 - 1e-9 && y <= f.y1 + 1e-9) pts.push([x, y]);
    }
  if (Math.abs(a) > 1e-9)
    for (const y of [f.y0, f.y1]) {
      const x = (c - b * y) / a;
      if (x >= f.x0 - 1e-9 && x <= f.x1 + 1e-9) pts.push([x, y]);
    }
  if (pts.length < 2) return null;
  let best: [XY, XY] = [pts[0], pts[1]];
  let bd = -1;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
      if (d > bd) {
        bd = d;
        best = [pts[i], pts[j]];
      }
    }
  return best;
}
const segD = (f: Frame, s: [XY, XY]) => `M${f.sx(s[0][0]).toFixed(1)} ${f.sy(s[0][1]).toFixed(1)}L${f.sx(s[1][0]).toFixed(1)} ${f.sy(s[1][1]).toFixed(1)}`;

/** one trip's রসিদ-line on the দামের কাগজ */
function TripLine({ f = PP_F, t, color, draw = false, faint = false, w = 2.2 }: { f?: Frame; t: Trip; color: string; draw?: boolean; faint?: boolean; w?: number }) {
  const s = segOf(f, rowOf(t), t.fare);
  if (!s) return null;
  if (draw)
    return (
      <g stroke={color}>
        <Draw d={segD(f, s)} strokeWidth={w} ms={650} />
      </g>
    );
  return <path d={segD(f, s)} stroke={color} strokeWidth={w} strokeLinecap="round" opacity={faint ? 0.45 : 1} className="pointer-events-none" />;
}

/** edge numbers of the দামের কাগজ: উঠার টাকা every 10, রেট every 4 */
function PriceMarks({ f = PP_F }: { f?: Frame }) {
  return (
    <g className="pointer-events-none" fontFamily={MONO} fontSize={8} fill={MUTE}>
      {[2, 4, 6, 8, 10].filter((x) => x <= f.x1).map((x) => (
        <text key={`x${x}`} x={f.sx(x)} y={f.sy(0) + 10} textAnchor="middle">
          {x * 5}
        </text>
      ))}
      {[2, 4, 6, 8].filter((y) => y <= f.y1).map((y) => (
        <text key={`y${y}`} x={f.sx(0) - 3} y={f.sy(y) + 3} textAnchor="end">
          {y * 2}
        </text>
      ))}
    </g>
  );
}

/** where the lines of trips i and j cross: the one rule that gets both right */
const pairRule = (a: Trip, b: Trip): Rule => {
  const rate = (b.fare - a.fare) / (b.km - a.km);
  return [a.fare - rate * a.km, rate];
};
const onPP = (r: Rule) => r[0] >= 0 && r[0] <= 50 && r[1] >= 0 && r[1] <= 16;
const fmt = (n: number) => {
  const v = Math.round(n * 100) / 100;
  return v < 0 ? `−${-v}` : `${v}`;
};

// ---------------------------------------------------------------------------
// 2 · Every trip is a রসিদ। The reader taps two trip lamps: both lines draw,
//     Shiku walks to their crossing (the one rule that gets both trips
//     right), and every lamp that rule gets right lights. Another pair,
//     another crossing. After three pairs, "সব লাইন একসাথে": all six lines
//     and every crossing, a cloud; no spot lights all six.

export function PairsDisagree() {
  const pass = useGate();
  const [sel, setSel] = useSeed<number[]>("sel", []);
  const [tried, setTried] = useSeed<string[]>("tried", []);
  const [all, setAll] = useSeed("all", false);
  const pair = sel.length === 2 ? pairRule(TRIPS[sel[0]], TRIPS[sel[1]]) : null;
  const target: XY = pair && onPP(pair) ? toPP(pair) : [2, 2];
  const [sx, sy] = useTween(target, 700);
  const there = Math.abs(sx - target[0]) < 0.01 && Math.abs(sy - target[1]) < 0.01;
  const lit = TRIPS.map((t) => !!pair && there && onPP(pair) && fits(pair, t));
  const tap = (i: number) => {
    if (all) return;
    const next = sel.length >= 2 || sel.includes(i) ? [i] : [...sel, i];
    setSel(next);
    if (next.length === 2) {
      const key = [...next].sort().join("-");
      if (!tried.includes(key)) setTried([...tried, key]);
    }
  };
  const showAll = () => {
    setAll(true);
    setSel([]);
    pass("দুইটা করে মিলে, সবগুলো একসাথে মিলে না।");
  };
  const crossings: Rule[] = [];
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) crossings.push(pairRule(TRIPS[i], TRIPS[j]));
  return (
    <>
      <div className="flex justify-center">
        <Paper f={PP_F} label="দামের কাগজ: ডানে উঠার টাকা, উপরে কিলোর রেট; প্রতিটা ট্রিপ একটা লাইন" xName="উঠার টাকা →" yName="↑ কিলোর রেট" w="w-[14rem]">
          <PriceMarks />
          <Clip f={PP_F}>
            {all && TRIPS.map((t, i) => <TripLine key={`a${i}`} t={t} color={TRIP_C[i]} draw w={1.8} />)}
            {!all && sel.map((i) => <TripLine key={`s${i}-${sel.join()}`} t={TRIPS[i]} color={TRIP_C[i]} draw />)}
          </Clip>
          {all &&
            crossings.filter(onPP).map((c, i) => {
              const p = toPP(c);
              return <circle key={i} cx={PP_F.sx(p[0])} cy={PP_F.sy(p[1])} r={2.6} fill={INK} className={POP} style={{ transitionDelay: `${700 + i * 60}ms` }} />;
            })}
          {!all && pair && onPP(pair) && (
            <>
              {there && <circle cx={PP_F.sx(target[0])} cy={PP_F.sy(target[1])} r={9} fill={GLOW} opacity={0.55} className="pointer-events-none" />}
              <Shiku f={PP_F} at={[sx, sy]} />
            </>
          )}
        </Paper>
      </div>
      <div className="mx-auto mt-1 min-h-10 max-w-[21rem] text-center text-sm leading-snug">
        {all ? (
          <span className={FADE}>
            ছয় লাইন, 15 টা কাটাকাটি। ছয়টা বাতি একসাথে জ্বলে, এমন কোনো বিন্দু নাই।
          </span>
        ) : pair ? (
          onPP(pair) ? (
            <span>
              ট্রিপ {TRIP_NO[sel[0]]} আর {TRIP_NO[sel[1]]} এর নিয়ম: <RuleSays r={[Math.round(pair[0] * 100) / 100, Math.round(pair[1] * 100) / 100]} swatch={false} />
            </span>
          ) : (
            <span>
              কাটে কাগজের বাইরে: উঠলেই <b className="font-mono">{fmt(pair[0])}</b>, কিলো <b className="font-mono">{fmt(pair[1])}</b>
            </span>
          )
        ) : (
          <span className="text-muted">দুইটা ট্রিপ বেছে নিন।</span>
        )}
      </div>
      <div className="mx-auto mt-1 grid max-w-[21rem] grid-cols-6 gap-1">
        {TRIPS.map((t, i) => (
          <button
            key={i}
            type="button"
            disabled={all}
            onClick={() => tap(i)}
            className={`flex cursor-pointer flex-col items-center rounded-lg border-2 bg-white px-0.5 py-0.5 text-[0.62rem] leading-tight text-[#0f1b2d] transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${sel.includes(i) ? "border-cat-blue" : "border-[#cbd5e1]"}`}
          >
            <span className="flex items-center gap-0.5">
              <span className="inline-block h-2.5 w-1 rounded-sm" style={{ background: TRIP_C[i] }} />
              <Lamp on={all ? false : lit[i]} size={16} />
            </span>
            <span className="font-semibold">ট্রিপ {TRIP_NO[i]}</span>
            <Tup v={[t.km, t.fare]} of={TRIP_SLOTS} />
          </button>
        ))}
      </div>
      {tried.length >= 3 && !all && (
        <div className={`mt-2 flex justify-center ${FADE}`}>
          <button type="button" className={quietBtn} onClick={showAll}>
            সব লাইন একসাথে
          </button>
        </div>
      )}
      <Task done={all}>দুইটা করে ট্রিপ বেছে নিন। তিন জোড়া দেখুন, তারপর সবগুলো একসাথে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Back on the ট্রিপের কাগজ। The reader drags a rule line (left edge lifts
//     it, anywhere else turns it; steppers too). Each trip's miss is a red
//     bar and a red square hanging off it; the total of the squares reads
//     live and its bar shrinks. Pass when the total is under 200.

const X3_GOAL = 200;

/** a rule the reader moves: the paper with drag, and two steppers under it */
function RuleDragPaper({ r, set, trips, label, w = "w-[11rem]", ghost, big = -1 }: { r: Rule; set: (r: Rule) => void; trips: Trip[]; label: string; w?: string; ghost?: Rule | null; big?: number }) {
  const [b, k] = useTween(r, 220);
  const drag = useRuleDrag(r, set);
  const now: Rule = [b, k];
  return (
    <>
      <div className="flex justify-center">
        <TripPaper trips={trips} label={label} w={w} drag={drag} over={<Handles r={now} />}>
          {ghost && <RuleLine r={ghost} color={BEST} dashed w={2} />}
          <Misses r={now} trips={trips} big={big} />
          <RuleLine r={now} color={RULE} />
        </TripPaper>
      </div>
      <div className="mt-1 flex items-center justify-center gap-2 text-xs text-muted">
        <span className="flex items-center gap-1">
          উঠলেই
          <Stepper value={r[0]} min={0} max={60} label="উঠার টাকা" onChange={(v) => set([v, r[1]])} />
        </span>
        <span className="flex items-center gap-1">
          কিলো
          <Stepper value={r[1]} min={0} max={20} label="কিলোর রেট" onChange={(v) => set([r[0], v])} />
        </span>
      </div>
    </>
  );
}

export function MissSquares() {
  const pass = useGate();
  const [r, setR] = useSeed<Rule>("r", START);
  const [b, k] = useTween(r, 220);
  const total = sse([b, k], TRIPS);
  const set = (n: Rule) => {
    setR(n);
    if (sse(n, TRIPS) <= X3_GOAL) pass("বর্গের যোগ যত ছোট, লাইন তত ভালো।");
  };
  const done = sse(r, TRIPS) <= X3_GOAL;
  return (
    <>
      <RuleDragPaper r={r} set={set} trips={TRIPS} label="ট্রিপের কাগজ: একটা নিয়মের লাইন; প্রতিটা ট্রিপের গরমিল লাল দাগ, তার বর্গ লাল ঘর" />
      <div className="mt-1.5">
        <RedTotal v={total} max={2000} />
      </div>
      <Task done={done}>লাইনটা টেনে বা ঘুরিয়ে লাল বর্গগুলো ছোট করুন। মোট {X3_GOAL} এর নিচে নামান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The column picture, small enough to draw. Two trips (1 কিলো 35, 3 কিলো
//     45) and Karim's rule, রেট only. The মোটের কাগজ: right ট্রিপ 1 এর ভাড়া, up
//     ট্রিপ 2 এর। Every রেট lands on one line, rate × (1, 3); the খাতা's b =
//     (35, 45) is off it. Predict first (three drops from b: straight left,
//     at a right angle, leaning up), then the reader walks the রেট; the red
//     miss is shortest at 17, where it meets the line square.

const CR_F = makeFrame(0, 10, 0, 12, 18, 14);
const CR_B: XY = [7, 9]; // (35, 45) in fives
const crAt = (rate: number): XY => [rate / 5, (3 * rate) / 5];
const crMiss = (rate: number) => Math.hypot(35 - rate, 45 - 3 * rate);
const X4_OPTS: { rate: number; say: string }[] = [
  { rate: 15, say: "b থেকে সোজা বামে" },
  { rate: 17, say: "লাইনের সাথে খাড়া কোণে" },
  { rate: 20, say: "উপরের দিকে হেলে" },
];
const X4_RIGHT = 1;
const X4_NOPE = ["সোজা বামে গেলে ট্রিপ 2 ঠিক মিলে, কিন্তু দূরত্ব 20। রেট 17 তে দূরত্ব আরো কম, 18.97.", "", "উপরে হেলে গেলে দূরত্ব 21.2. সবচেয়ে কম 17 তে, যেখানে লাল দাগ লাইনের সাথে খাড়া।"];

/** the reachable line, b, and a drop from b to the line at `rate` */
function CrPic({ rate, size = 58 }: { rate: number; size?: number }) {
  const f = makeFrame(0, 10, 0, 12, 4, 3);
  const p = crAt(rate);
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} width={size} height={(size * f.H) / f.W} aria-hidden="true" className="shrink-0 rounded bg-white">
      <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(4)} ${f.sy(12)}`} stroke={OK} strokeWidth={2} />
      <path d={`M${f.sx(CR_B[0])} ${f.sy(CR_B[1])}L${f.sx(p[0])} ${f.sy(p[1])}`} stroke={BAD} strokeWidth={1.8} strokeDasharray="3 2" />
      <circle cx={f.sx(CR_B[0])} cy={f.sy(CR_B[1])} r={2.8} fill={INK} />
      <circle cx={f.sx(p[0])} cy={f.sy(p[1])} r={2.4} fill={OK} />
    </svg>
  );
}

/** the right-angle mark where the drop meets the line (at rate 17) */
function SquareMark({ f, at, size = 7 }: { f: Frame; at: XY; size?: number }) {
  // unit vectors along the line (1, 3) and back toward b (3, −1), in screen space
  const L = Math.hypot(1, 3);
  const u: XY = [1 / L, -3 / L];
  const v: XY = [3 / L, 1 / L];
  const o: XY = [f.sx(at[0]), f.sy(at[1])];
  const a: XY = [o[0] + u[0] * size, o[1] + u[1] * size];
  const c: XY = [o[0] + v[0] * size, o[1] + v[1] * size];
  const m: XY = [a[0] + v[0] * size, a[1] + v[1] * size];
  return <path d={`M${a[0]} ${a[1]}L${m[0]} ${m[1]}L${c[0]} ${c[1]}`} fill="none" stroke={INK} strokeWidth={1.2} className={POP} />;
}

export function ClosestReach() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [rate, setRate] = useSeed("rate", 11);
  const [found, setFound] = useSeed("found", false);
  const [t] = useTween([rate], 300);
  const p = crAt(t);
  const set = (v: number) => {
    if (guess === null) return;
    const n = Math.max(10, Math.min(20, v));
    setRate(n);
    if (n === 17 && !found) {
      setFound(true);
      pass("যেখানে ছায়া পড়ে, সেইখানে সবচেয়ে কাছে।");
    }
  };
  const drag = {
    down: (q: XY) => set(Math.round((5 * (q[0] + 3 * q[1])) / 10)),
    move: (q: XY) => set(Math.round((5 * (q[0] + 3 * q[1])) / 10)),
  };
  const settled = Math.abs(t - rate) < 0.01;
  return (
    <>
      <div className="flex items-start justify-center gap-2">
        <Paper f={CR_F} label="মোটের কাগজ: ডানে ট্রিপ 1 এর ভাড়া, উপরে ট্রিপ 2 এর; রেট দিয়ে পৌঁছানো যায় শুধু একটা লাইনে; b লাইনের বাইরে" xName="ট্রিপ 1 এর ভাড়া →" yName="↑ ট্রিপ 2 এর ভাড়া" w="w-[11rem]" drag={guess === null ? undefined : drag}>
          <g className="pointer-events-none" fontFamily={MONO} fontSize={8} fill={MUTE}>
            {[2, 4, 6, 8, 10].map((x) => (
              <text key={x} x={CR_F.sx(x)} y={CR_F.sy(0) + 10} textAnchor="middle">
                {x * 5}
              </text>
            ))}
            {[2, 4, 6, 8, 10, 12].map((y) => (
              <text key={y} x={CR_F.sx(0) - 3} y={CR_F.sy(y) + 3} textAnchor="end">
                {y * 5}
              </text>
            ))}
          </g>
          <path d={`M${CR_F.sx(0)} ${CR_F.sy(0)}L${CR_F.sx(4)} ${CR_F.sy(12)}`} stroke={OK} strokeWidth={2.6} strokeLinecap="round" className="pointer-events-none" />
          <text x={CR_F.sx(4.4)} y={CR_F.sy(11.2)} fontSize={8} fontWeight={700} fill={OK} className="pointer-events-none">
            রেট × (1, 3)
          </text>
          {found && settled && <SquareMark f={CR_F} at={crAt(17)} />}
          <path d={`M${CR_F.sx(CR_B[0])} ${CR_F.sy(CR_B[1])}L${CR_F.sx(p[0])} ${CR_F.sy(p[1])}`} stroke={BAD} strokeWidth={2.2} strokeDasharray={found && settled && rate === 17 ? undefined : "4 3"} className="pointer-events-none" />
          <circle cx={CR_F.sx(p[0])} cy={CR_F.sy(p[1])} r={4.5} fill={OK} stroke="white" strokeWidth={1.2} className="pointer-events-none" />
          <circle cx={CR_F.sx(CR_B[0])} cy={CR_F.sy(CR_B[1])} r={4.5} fill={INK} className="pointer-events-none" />
          <text x={CR_F.sx(CR_B[0]) + 7} y={CR_F.sy(CR_B[1]) + 3} fontSize={10} fontWeight={800} fill={INK} className="pointer-events-none">
            b
          </text>
        </Paper>
        <div className="flex w-[8.5rem] flex-col gap-1 pt-3 text-xs leading-snug">
          <span className="text-muted">খাতায়</span>
          <Tup v={[35, 45]} of={FARE2_SLOTS} />
          <span className="mt-1 text-muted">রেট {Math.round(t)} দিলে</span>
          <Tup v={[Math.round(t), Math.round(3 * t)]} of={FARE2_SLOTS} />
          <span className="mt-1 text-muted">b থেকে দূরত্ব</span>
          <b className="font-mono text-base text-danger">{crMiss(t).toFixed(2)}</b>
          <Stepper value={rate} min={10} max={20} disabled={guess === null} label="রেট" onChange={set} />
        </div>
      </div>
      <div className="mx-auto mt-1.5 grid max-w-[22rem] grid-cols-3 gap-1.5">
        {X4_OPTS.map((o, i) => (
          <button
            key={i}
            type="button"
            disabled={guess !== null}
            onClick={() => setGuess(i)}
            className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-1 text-center text-[0.72rem] leading-tight transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[predictLook(i, guess, found, X4_RIGHT)]}`}
          >
            <CrPic rate={o.rate} size={40} />
            {o.say}
          </button>
        ))}
      </div>
      {found && guess !== null && guess !== X4_RIGHT && <Nope>{X4_NOPE[guess]}</Nope>}
      <Task done={found}>{guess === null ? "লাইনের কোন বিন্দু b এর সবচেয়ে কাছে? আগে guess দিন।" : "রেট বদলে সবুজ বিন্দুটা লাইন ধরে হাঁটান। লাল দূরত্ব কোথায় সবচেয়ে কম?"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · All six trips again. The reader puts the line anywhere, then taps
//     "সবচেয়ে কম": the line glides into place, every square shrinking with
//     it, and stops at উঠলেই 23, কিলো 9. From a second, different start it
//     stops at the same line. Pass after two settles from two starts.

export function BestLine() {
  const pass = useGate();
  const [r, setR] = useSeed<Rule>("r", START);
  const [starts, setStarts] = useSeed<string[]>("starts", []);
  const glide = usePlay(1500);
  const [b, k] = useTween(r, glide.running ? 1400 : 220);
  const now: Rule = [b, k];
  const drag = useRuleDrag(r, (n) => !glide.running && setR(n));
  const atBest = r[0] === LS[0] && r[1] === LS[1];
  const settle = () => {
    if (glide.running || atBest) return;
    const key = r.join(",");
    const next = starts.includes(key) ? starts : [...starts, key];
    setStarts(next);
    setR(LS);
    glide.play(1, () => next.length >= 2 && pass("যেখান থেকেই শুরু, একই লাইনে থামে।"));
  };
  const settledTwice = starts.length >= 2 && atBest && !glide.running;
  return (
    <>
      <div className="flex justify-center">
        <TripPaper trips={TRIPS} label="ট্রিপের কাগজ: লাইনটা যেকোনো জায়গায় রেখে সবচেয়ে কম চাপলে লাইন নিজে নিজে সরে এক জায়গায় থামে" drag={glide.running ? undefined : drag} over={<Handles r={now} color={atBest && !glide.running ? BEST : RULE} />}>
          <Misses r={now} trips={TRIPS} />
          <RuleLine r={now} color={atBest && !glide.running ? BEST : RULE} />
        </TripPaper>
      </div>
      <div className="mt-1 flex items-center justify-center gap-3">
        <RuleSays r={[Math.round(b), Math.round(k)]} color={atBest && !glide.running ? BEST : RULE} />
        <button type="button" className={primaryBtn} disabled={glide.running || atBest} onClick={settle}>
          সবচেয়ে কম
        </button>
      </div>
      <div className="mt-1.5">
        <RedTotal v={sse(now, TRIPS)} max={2000} />
      </div>
      <Task done={settledTwice}>{starts.length === 0 || settledTwice ? "লাইনটা যেখানে খুশি রাখুন, তারপর সবচেয়ে কম চাপুন।" : "আরেকবার: লাইন অন্য কোথাও টেনে নিন, আবার সবচেয়ে কম চাপুন।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The other way round: one trip only, 3 কিলো 45 টাকা। On the দামের কাগজ
//     it is one line; the reader walks Shiku along it (রেট stepper or drag),
//     its lamp never goes out. Beside it, the ট্রিপের কাগজ: the rule swings
//     about the one dot, and tomorrow's 8 কিলো trip costs anything from 45
//     to 120. Pass once the reader has seen fares 50 apart.

const FR_F = makeFrame(0, 10, 0, 8, 12.5, 10);
const FS_F = makeFrame(0, 9, 0, 13, 11, 10);
const ONE: Trip = { km: 3, fare: 45 };
const oneRule = (rate: number): Rule => [45 - 3 * rate, rate];

export function FewReceipts() {
  const pass = useGate();
  const [rate, setRate] = useSeed("rate", 5);
  const [seen, setSeen] = useSeed<number[]>("seen", [5]);
  const [t] = useTween([rate], 350);
  const r = oneRule(t);
  const tomorrow = fareAt(r, 8);
  const fares = seen.map((x) => fareAt(oneRule(x), 8));
  const lo = Math.min(...fares);
  const hi = Math.max(...fares);
  const set = (v: number) => {
    const n = Math.max(0, Math.min(15, v));
    setRate(n);
    const s = seen.includes(n) ? seen : [...seen, n];
    setSeen(s);
    const f = s.map((x) => fareAt(oneRule(x), 8));
    if (Math.max(...f) - Math.min(...f) >= 50) pass("Data কম হলে সব নিয়মই মিলে, নতুন ট্রিপে আলাদা।");
  };
  const drag = { down: (q: XY) => set(Math.round(q[1] * 2)), move: (q: XY) => set(Math.round(q[1] * 2)) };
  const done = hi - lo >= 50;
  return (
    <>
      <div className="flex items-start justify-center gap-1.5">
        <Paper f={FR_F} label="দামের কাগজ: একটা ট্রিপ, একটা লাইন; Shiku লাইন ধরে হাঁটে" xName="উঠার টাকা →" yName="↑ কিলোর রেট" w="w-[10.5rem]" drag={drag}>
          <PriceMarks f={FR_F} />
          <Clip f={FR_F}>
            <TripLine f={FR_F} t={ONE} color={TRIP_C[1]} />
          </Clip>
          <circle cx={FR_F.sx(r[0] / 5)} cy={FR_F.sy(r[1] / 2)} r={8} fill={GLOW} opacity={0.55} className="pointer-events-none" />
          <Shiku f={FR_F} at={[r[0] / 5, r[1] / 2]} />
        </Paper>
        <Paper f={FS_F} label="ট্রিপের কাগজ: একটা মাত্র ট্রিপ; নিয়মের লাইন সেই বিন্দু ঘিরে ঘোরে; কালকের 8 কিলোর ভাড়া" xName="কিলো →" yName="↑ টাকা" w="w-[8.5rem]">
          <TripMarks f={FS_F} />
          <Clip f={FS_F}>
            {seen.map((x) => (
              <RuleLine key={x} f={FS_F} r={oneRule(x)} color={RULE} w={1} faint />
            ))}
            <RuleLine f={FS_F} r={r} color={RULE} />
          </Clip>
          <path d={`M${FS_F.sx(8)} ${FS_F.sy(ty(lo))}V${FS_F.sy(ty(hi))}`} stroke={BAD} strokeWidth={4} strokeLinecap="round" opacity={0.35} className="pointer-events-none" />
          <circle cx={FS_F.sx(8)} cy={FS_F.sy(ty(tomorrow))} r={4} fill="white" stroke={BAD} strokeWidth={2} className="pointer-events-none" />
          <circle cx={FS_F.sx(3)} cy={FS_F.sy(4.5)} r={3.6} fill={INK} className="pointer-events-none" />
          <circle cx={FS_F.sx(3)} cy={FS_F.sy(4.5)} r={7} fill={GLOW} opacity={0.6} className="pointer-events-none" />
        </Paper>
      </div>
      <div className="mt-1 flex items-center justify-center gap-2 text-sm">
        <Lamp on />
        <RuleSays r={[round1(r[0]), round1(r[1])]} />
      </div>
      <div className="mt-1 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted">কিলোর রেট</span>
        <Stepper value={rate} min={0} max={15} label="কিলোর রেট" onChange={set} />
      </div>
      <div className="mt-1 text-center text-sm">
        কালকের 8 কিলো: <b className="font-mono text-danger">{Math.round(tomorrow)}</b> টাকা
        {hi > lo && (
          <span className="text-muted">
            {" "}
            · এ পর্যন্ত <span className="font-mono">{lo}</span> থেকে <span className="font-mono">{hi}</span>
          </span>
        )}
      </div>
      <Task done={done}>রেট বাড়িয়ে কমিয়ে দেখুন। বাতি কি কখনো নেভে? কালকের 8 কিলোর ভাড়া কী হয়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn. The brother's খাতা, five trips. No hints on the paper: the
//     reader drags the line and taps "মিলিয়ে দেখি". Within 30 of the least
//     total (50) passes and the least-squares line shows up beside theirs;
//     further off, the biggest red square darkens and a Nope points at it.

const X7_OK = 80;

export function YourFit() {
  const pass = useGate();
  const [r, setR] = useSeed<Rule>("r", [50, 4]);
  const [checks, setChecks] = useSeed("checks", 0);
  const [ok, setOk] = useSeed("ok", false);
  const [b, k] = useTween(r, 220);
  const total = sse([b, k], BRO);
  const misses = BRO.map((t) => Math.abs(t.fare - fareAt(r, t.km)));
  const big = misses.indexOf(Math.max(...misses));
  const check = () => {
    if (ok) return;
    setChecks(checks + 1);
    if (sse(r, BRO) <= X7_OK) {
      setOk(true);
      pass("ভাইয়ের খাতাও মিললো, প্রায় সবচেয়ে কমে।");
    }
  };
  return (
    <>
      <RuleDragPaper r={r} set={(n) => !ok && setR(n)} trips={BRO} label="ট্রিপের কাগজ: ভাইয়ের খাতার পাঁচটা ট্রিপ; একটা নিয়মের লাইন আর লাল বর্গ" ghost={ok ? BRO_LS : null} big={checks > 0 && !ok ? big : -1} />
      <div className="mt-1.5">
        <RedTotal v={total} max={1200} best={ok ? sse(BRO_LS, BRO) : undefined} />
      </div>
      {ok && (
        <div className={`mt-1 flex justify-center ${FADE}`}>
          <span className="text-sm">
            সবচেয়ে কম: <RuleSays r={BRO_LS} color={BEST} />, মোট <b className="font-mono">{sse(BRO_LS, BRO)}</b>
          </span>
        </div>
      )}
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={ok} onClick={check}>
          মিলিয়ে দেখি
        </button>
      </div>
      {checks > 0 && !ok && (
        <Nope key={checks}>
          লাল বর্গ এখনো মোট {Math.round(sse(r, BRO))}. সবচেয়ে বড়টা ট্রিপ {TRIP_NO[big]} এ, গাঢ় করে দেখানো। লাইনটা ওই বিন্দুর দিকে নিন।
        </Nope>
      )}
      <Task done={ok}>ভাইয়ের খাতার জন্য লাইনটা এমন জায়গায় আনুন, যেন লাল বর্গের মোট সবচেয়ে কম হয়। তারপর মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it (Check Q7). Three situations, one at a time; each goes to one of
//     three answers. Whatever is picked, the situation's own lines draw on a
//     small paper: a cloud that never meets, two lines that cross, one line
//     full of answers. A right pick then shows its mark (the closest dot, the
//     crossing, the smallest pick); a wrong one gets a Nope.

type Row3 = [number, number, number]; // a·x + b·y = c
const X8_CLOUD: Row3[] = [
  [1, 1, 5.6],
  [2, 1, 9.6],
  [1, 2, 8.4],
  [3, 1, 11.2],
  [1, 3, 12.8],
  [1, 0.4, 4.6],
  [0.4, 1, 3.8],
];
/** least squares for a·x + b·y ≈ c over the rows (2 × 2 normal equations) */
function lsq(rows: Row3[]): XY {
  let aa = 0,
    ab = 0,
    bb = 0,
    ac = 0,
    bc = 0;
  for (const [a, b, c] of rows) {
    aa += a * a;
    ab += a * b;
    bb += b * b;
    ac += a * c;
    bc += b * c;
  }
  const D = aa * bb - ab * ab;
  return [(ac * bb - ab * bc) / D, (aa * bc - ab * ac) / D];
}
const X8_SIT: { title: string; sub: string; rows: Row3[]; right: number }[] = [
  { title: "1000 টা ট্রিপ, 50 টা অজানা দাম", sub: "রসিদ দামের চেয়ে অনেক বেশি, সবগুলোতে একটু একটু গরমিল", rows: X8_CLOUD, right: 1 },
  { title: "2 টা রসিদ, 2 টা দাম", sub: "det শূন্য না (10.1 এর হলুদের জোড়া)", rows: [[2, 1, 8], [1, 2, 7]], right: 0 },
  { title: "1 টা রসিদ, 2 টা দাম", sub: "বিয়ের প্রথম দিন, খাতায় একটাই ট্রিপ", rows: [[1, 1, 4]], right: 2 },
];
const X8_BINS = ["এক উত্তর", "সবচেয়ে কাছেরটা", "অসীম, ছোটটা নাও"];
const X8_NOPE: string[][] = [
  ["", "", ""],
  ["লাইনগুলো কোনো এক বিন্দুতে মিললো না। ঠিক উত্তর নাই, তাই এক উত্তরও না।", "", "লাইনগুলো কোথাও একসাথে মিলে না। অসীম তো দূরের কথা, একটাও নাই।"],
  ["", "দুই লাইন ঠিক এক বিন্দুতে কাটলো। সঠিক উত্তরই আছে, কাছেরটা খোঁজার দরকার নাই।", "দুই লাইন কাটলো একবার, মাত্র এক বিন্দুতে। অসীম না।"],
  ["একটাই লাইন। লাইনের প্রতিটা বিন্দুতে বাতি জ্বলে, এক উত্তর না।", "একটাই লাইন, আর তার সব বিন্দুই ঠিক। কাছের খোঁজার কিছু নাই, ঠিক উত্তর অসীম।", ""],
];
const X8_F = makeFrame(0, 6, 0, 6, 17, 8);

function SitPic({ s, mark }: { s: number; mark: boolean }) {
  const f = X8_F;
  const rows = X8_SIT[s].rows;
  const star = s === 0 ? lsq(rows) : s === 1 ? ([3, 2] as XY) : ([2, 2] as XY);
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} className="h-auto w-[8.5rem] shrink-0" role="img" aria-label="ছোট কাগজে এই অবস্থার লাইনগুলো">
      <rect x={f.sx(0)} y={f.sy(6)} width={6 * f.u} height={6 * f.u} rx={3} fill="white" stroke="#cbd5e1" />
      <path d={Array.from({ length: 5 }, (_, i) => `M${f.sx(i + 1)} ${f.sy(0)}V${f.sy(6)}M${f.sx(0)} ${f.sy(i + 1)}H${f.sx(6)}`).join("")} stroke="#2563eb" strokeOpacity={0.15} strokeWidth={0.7} />
      <Clip f={f}>
        {rows.map((row, i) => {
          const sg = segOf(f, [row[0], row[1]], row[2]);
          return sg ? (
            <g key={i} stroke={TRIP_C[i % 6]}>
              <Draw d={segD(f, sg)} strokeWidth={1.8} ms={500} delay={i * 120} />
            </g>
          ) : null;
        })}
      </Clip>
      {mark && s === 2 && <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(2)} ${f.sy(2)}`} stroke={MUTE} strokeWidth={1.2} strokeDasharray="3 2" className={FADE} />}
      {mark && <circle cx={f.sx(star[0])} cy={f.sy(star[1])} r={5.5} fill={s === 0 ? BEST : GLOW} stroke={INK} strokeWidth={1} className={POP} />}
    </svg>
  );
}

function BinPic({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 40 30" width={34} height={26} aria-hidden="true" className="shrink-0 rounded bg-white">
      {i === 0 && (
        <g strokeWidth={1.6}>
          <path d="M4 26L36 6" stroke="#2563eb" />
          <path d="M4 8L36 24" stroke="#d97706" />
          <circle cx={20} cy={16} r={2.6} fill={INK} />
        </g>
      )}
      {i === 1 && (
        <g strokeWidth={1.2}>
          <path d="M4 24L36 8M4 10L36 22M8 4L28 28M4 18L36 14" stroke="#94a3b8" />
          <circle cx={19.5} cy={16} r={2.8} fill={BEST} />
        </g>
      )}
      {i === 2 && (
        <g>
          <path d="M4 26L36 4" stroke="#2563eb" strokeWidth={1.6} />
          {[8, 14, 20, 26, 32].map((x) => (
            <circle key={x} cx={x} cy={26 - ((x - 4) * 22) / 32} r={1.6} fill={GLOW} stroke="#a16207" strokeWidth={0.5} />
          ))}
        </g>
      )}
    </svg>
  );
}

export function TryWhich() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const show = usePlay(450);
  const s = Math.min(at, X8_SIT.length - 1);
  const sit = X8_SIT[s];
  const playing = show.running;
  const right = pick === sit.right && !playing;
  const choose = (i: number) => {
    if (playing || right) return;
    setPick(i);
    show.play(2, () => {
      if (i === sit.right) {
        if (s === X8_SIT.length - 1) {
          setAt(X8_SIT.length);
          pass("বেশি রসিদে কাছেরটা, কমে ছোটটা।");
        }
      } else setMiss((m) => m + 1);
    });
  };
  const next = () => {
    setAt(s + 1);
    setPick(null);
  };
  const done = at >= X8_SIT.length;
  return (
    <>
      <div className="mx-auto flex max-w-[22rem] items-center gap-2.5">
        <SitPic key={`${s}-${pick}-${miss}`} s={s} mark={right || done} />
        <div className="min-w-0 text-sm leading-snug">
          <div className="text-xs text-muted">
            অবস্থা {s + 1} / {X8_SIT.length}
          </div>
          <b className="block">{sit.title}</b>
          <span className="block text-xs text-muted">{sit.sub}</span>
        </div>
      </div>
      <div className="mx-auto mt-2 flex max-w-[22rem] flex-col gap-1">
        {X8_BINS.map((b, i) => (
          <Choice key={i} n={i} look={pick === i && !playing ? (i === sit.right ? "right" : "wrong") : "idle"} disabled={playing || right || done} onClick={() => choose(i)}>
            <span className="flex items-center gap-2 text-sm">
              <BinPic i={i} />
              {b}
            </span>
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== sit.right && !playing && <Nope key={miss}>{X8_NOPE[s + 1][pick]}</Nope>}
      {right && !done && (
        <div className={`mt-2 flex justify-center ${FADE}`}>
          <button type="button" className={quietBtn} onClick={next}>
            পরেরটা
          </button>
        </div>
      )}
      <Task done={done}>প্রতিটা অবস্থা কোন উত্তরে যায়? বেছে নিন, ছোট কাগজে লাইনগুলো আঁকা হবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Module 2 in one page. Six tiles, Articles 5–10; tapping one turns it
//     over to its question, with its small picture. When all six are open,
//     the one thread lights link by link.

const X9_TILES: { n: number; name: string; q: string }[] = [
  { n: 5, name: "span, basis", q: "এই arrow গুলো দিয়ে কী কী বানানো যায়? কোনটা বাড়তি?" },
  { n: 6, name: "matrix", q: "একটা matrix আসলে কী করে?" },
  { n: 7, name: "Ax", q: "Ax কীভাবে বের হয়, আর কেন এই নিয়মে?" },
  { n: 8, name: "det", q: "কাগজ কতটা বড় হয়? চ্যাপ্টা হয় কি না?" },
  { n: 9, name: "inverse", q: "উল্টা চালিয়ে ফেরানো যায়?" },
  { n: 10, name: "Ax = b", q: "কোন x গিয়ে b তে পড়ে? আদৌ আছে?" },
];
const X9_CHAIN = ["column গুলো আলাদা দিকে", "det ≠ 0", "full rank", "nullspace এ শুধু 0", "ফেরার lens আছে", "Ax = b এর ঠিক এক উত্তর"];

function TileIcon({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 40 28" width={40} height={28} aria-hidden="true" className={`shrink-0 ${POP}`}>
      <rect x={0.5} y={0.5} width={39} height={27} rx={3} fill="white" stroke="#cbd5e1" />
      {n === 5 && (
        <g strokeWidth={1.8} strokeLinecap="round">
          <path d="M6 22L18 18" stroke="#2563eb" />
          <path d="M6 22L10 8" stroke="#d97706" />
          <path d="M18 18L22 4M10 8L22 4" stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="2 2" />
          <circle cx={22} cy={4} r={1.8} fill={INK} />
        </g>
      )}
      {n === 6 && (
        <g fontFamily={MONO} fontSize={8} fontWeight={800} fill={INK}>
          <path d="M8 4h-2v20h2M32 4h2v20h-2" stroke={INK} fill="none" />
          <text x={11} y={12}>2 1</text>
          <text x={11} y={22}>1 2</text>
        </g>
      )}
      {n === 7 && (
        <g strokeWidth={1.8} strokeLinecap="round" fill="none">
          <path d="M5 20L13 14" stroke="#2563eb" />
          <rect x={16} y={8} width={8} height={12} rx={1.5} stroke={INK} strokeWidth={1.2} />
          <path d="M27 20L35 8" stroke="#7c3aed" />
        </g>
      )}
      {n === 8 && <path d="M6 22L18 19L34 7L22 10Z" fill="#fde68a" stroke="#a16207" strokeWidth={1.2} />}
      {n === 9 && (
        <g strokeWidth={1.6} fill="none" strokeLinecap="round">
          <path d="M8 18q12 -14 24 0" stroke="#0d9488" />
          <path d="M28 14l4 4l-5 1" stroke="#0d9488" />
          <path d="M32 22q-12 6 -24 0" stroke="#db2777" strokeDasharray="3 2" />
        </g>
      )}
      {n === 10 && (
        <g strokeWidth={1.6}>
          <path d="M5 23L35 6" stroke="#2563eb" />
          <path d="M5 8L35 22" stroke="#d97706" />
          <circle cx={20} cy={14.5} r={2.4} fill={INK} />
        </g>
      )}
    </svg>
  );
}

export function ModuleChain() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [lit, setLit] = useSeed("lit", false);
  const chain = usePlay(500);
  const shown = !lit ? 0 : chain.running ? chain.k : X9_CHAIN.length;
  const tap = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === X9_TILES.length) {
      setLit(true);
      chain.play(X9_CHAIN.length, () => pass("হয় সব দিক থাকে, নয় কিছু হারায়।"));
    }
  };
  return (
    <>
      <div className="mx-auto grid max-w-[22rem] grid-cols-3 gap-1.5">
        {X9_TILES.map((t, i) => {
          const on = open.includes(i);
          return (
            <button
              key={t.n}
              type="button"
              onClick={() => tap(i)}
              disabled={on}
              className={`flex min-h-[5.6rem] cursor-pointer flex-col items-start gap-0.5 rounded-xl border-2 px-1.5 py-1 text-left leading-tight transition-colors duration-300 disabled:cursor-default motion-reduce:transition-none ${on ? "border-cat-blue/40 bg-cat-blue/5" : "border-border hover:border-cat-blue/60"}`}
            >
              <span className="flex w-full items-center justify-between gap-1">
                <b className="text-[0.72rem]">
                  <span className="font-mono">{t.n}</span> · {t.name}
                </b>
              </span>
              {on ? (
                <>
                  <TileIcon n={t.n} />
                  <span className={`${FADE} text-[0.68rem] text-muted`}>{t.q}</span>
                </>
              ) : (
                <span className="mt-auto text-[0.68rem] text-muted">খুলুন</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mx-auto mt-2 flex max-w-[22rem] flex-wrap items-center justify-center gap-x-1 gap-y-1">
        {X9_CHAIN.map((c, i) => (
          <span key={c} className="flex items-center gap-1">
            {i > 0 && <RowArrow both />}
            <span className={`rounded-full border px-2 py-0.5 text-[0.72rem] transition-colors duration-300 motion-reduce:transition-none ${shown > i ? "border-[#7c3aed] bg-[#7c3aed]/10 font-semibold" : "border-border text-muted"}`}>{c}</span>
          </span>
        ))}
      </div>
      <Task done={lit && !chain.running}>ছয়টা article এর ছয়টা card। একটা একটা করে খুলুন, প্রত্যেকটা কোন প্রশ্নের উত্তর দিলো।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · The bet opened. Tap each of the four bet lines: it draws on the
//      ট্রিপের কাগজ, its red squares pop, the total counts up, and its fare
//      at 6 কিলো shows. The bet itself is not recalled.

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const r = cur === null ? null : BETS[cur].rule;
  const [tot] = useTween([r ? sse(r, TRIPS) : 0], 900);
  const tap = (i: number) => {
    setCur(i);
    const next = open.includes(i) ? open : [...open, i];
    setOpen(next);
    if (next.length === BETS.length) pass("চারটা লাইন, চারটা লাল মোট।");
  };
  return (
    <>
      <div className="flex justify-center">
        <TripPaper
          trips={TRIPS}
          w="w-[10rem]"
          label="ট্রিপের কাগজ: বাছাই করা বাজির লাইন, তার লাল বর্গ আর 6 কিলোতে ভাড়া"
          lit={r ? TRIPS.map((t) => fits(r, t)) : undefined}
          over={
            r ? (
              <g key={cur} className="pointer-events-none">
                <path d={`M${SC_F.sx(BUS_KM)} ${SC_F.sy(0)}V${SC_F.sy(12)}`} stroke={MUTE} strokeWidth={1.2} strokeDasharray="4 3" />
                <circle cx={SC_F.sx(BUS_KM)} cy={SC_F.sy(ty(fareAt(r, BUS_KM)))} r={4.5} fill="white" stroke={BETS[cur ?? 0].color} strokeWidth={2} className={POP} />
              </g>
            ) : null
          }
        >
          {r && (
            <g key={cur}>
              <g className={FADE} style={{ transitionDelay: "500ms" }}>
                <Misses r={r} trips={TRIPS} />
              </g>
              <RuleLine r={r} color={BETS[cur ?? 0].color} draw />
            </g>
          )}
        </TripPaper>
      </div>
      <div className="mt-1 min-h-5 text-center text-sm">{r && <RedTotal v={tot} max={2000} />}</div>
      <div className="mx-auto mt-1.5 grid max-w-[22rem] grid-cols-2 gap-1.5">
        {BETS.map((b, i) => {
          const seen = open.includes(i);
          return (
            <button
              key={b.who}
              type="button"
              onClick={() => tap(i)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl border-2 px-2 py-1 text-left leading-tight transition-colors duration-200 motion-reduce:transition-none ${cur === i ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"}`}
            >
              <MiniRule r={b.rule} color={b.color} size={36} />
              <span className="min-w-0 text-[0.72rem]">
                <b className="block text-[0.8rem]">{b.who}</b>
                {seen ? (
                  <span className={`block ${FADE}`}>
                    লাল <b className="font-mono text-danger">{sse(b.rule, TRIPS)}</b>
                    <br />
                    বাসস্ট্যান্ড <b className="font-mono">{fareAt(b.rule, BUS_KM)}</b>
                  </span>
                ) : (
                  <span className="block text-muted">খুলুন</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <Task done={open.length === BETS.length}>চারটা লাইন একটা একটা করে খুলুন। কার লাল বর্গের মোট সবচেয়ে কম?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11 · Five things to carry forward (§11), tap to reveal; each opens with
//      its small picture.

const FT_THINGS: [string, string][] = [
  ["Ax = b মানে A কে উল্টা দিকে চালানো", "কোথায় পৌঁছাতে হবে জানা। কোথা থেকে শুরু, সেটা খোঁজা। মানে A এর column কতটুকু করে মিশালে b হয়।"],
  ["উত্তর আছে, যদি b থাকে column space এ", "আর উত্তর একটাই, যদি column গুলো আলাদা দিকে: det ≠ 0, full rank, nullspace এ শুধু 0।"],
  ["উত্তর হয় এক, নাই, নাহলে অসীম", "দুইটা বা তিনটা উত্তর কখনো হয় না।"],
  ["Elimination দিয়ে solve, Cramer দিয়ে বোঝা", "রসিদ দিয়ে রসিদ কাটে computer। আর Cramer বলে, প্রতিটা ঠিকানা আসলে দুইটা জায়গার ভাগ।"],
  ["rank + nullity = column এর সংখ্যা", "প্রতিটা দিক হয় টিকে থাকে, নয় মুছে যায়। data তে আসলে কতটুকু খবর আছে, সেটার সৎ হিসাব rank।"],
];

function FT_Pic({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 64 40" className={`h-8 w-13 shrink-0 rounded bg-white ${POP}`} aria-hidden="true">
      {i === 0 && (
        <g strokeWidth={2} strokeLinecap="round" fill="none">
          <path d="M8 32L20 24" stroke="#2563eb" />
          <rect x={26} y={14} width={12} height={16} rx={2} stroke={INK} strokeWidth={1.2} />
          <path d="M44 30L56 10" stroke="#7c3aed" />
          <path d="M40 8q-10 -6 -20 2" stroke={BAD} strokeWidth={1.2} strokeDasharray="3 2" />
        </g>
      )}
      {i === 1 && (
        <g>
          <path d="M6 36L58 6" stroke={OK} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
          <circle cx={32} cy={21} r={3} fill={INK} />
          <circle cx={46} cy={30} r={3} fill={BAD} />
          <path d="M42 26l8 8M50 26l-8 8" stroke={BAD} strokeWidth={1.2} />
        </g>
      )}
      {i === 2 && (
        <g strokeWidth={1.5}>
          <path d="M2 34L20 6M2 8L20 32" stroke="#2563eb" />
          <path d="M24 30L40 6M28 34L44 10" stroke="#d97706" />
          <path d="M46 30L62 8" stroke="#0d9488" strokeWidth={3} />
          <path d="M46 30L62 8" stroke="#7c3aed" strokeDasharray="3 3" />
        </g>
      )}
      {i === 3 && (
        <g>
          <path d="M6 30L30 30L30 10Z" fill="#fde68a" stroke="#a16207" />
          <text x={36} y={25} fontSize={10} fontWeight={800} fontFamily={MONO} fill={INK}>
            ÷det
          </text>
        </g>
      )}
      {i === 4 && (
        <g>
          {[0, 1, 2, 3, 4].map((k) => (
            <rect key={k} x={6 + k * 11} y={10} width={9} height={20} rx={2} fill={k < 3 ? "#7c3aed" : "#e2e8f0"} opacity={k < 3 ? 0.8 : 1} />
          ))}
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
    if (next.length === FT_THINGS.length) pass("Article 10 এর পাঁচটা কথা।");
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
// Story props, drawn locally (copied from 9.4 / 9.5, not imported).

/** a name under someone's feet */
function Name({ x, y = 161, children }: { x: number; y?: number; children: ReactNode }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK} className="pointer-events-none">
      {children}
    </text>
  );
}

/** the ভ্যানওয়ালা (9.4's look): মামার look in a checked লুঙ্গি, a গামছা on the shoulder; his brother wears a green one */
function Vanwala({ x, y = 150, facing = 1, arm = "down", mood = "plain", walking = false, ms = 1200, brother = false }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "hold" | "point" | "wave"; mood?: "plain" | "happy"; walking?: boolean; ms?: number; brother?: boolean }) {
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} arm={arm} mood={mood} walking={walking} ms={ms} />
      <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
        <rect x={-7.5} y={-21} width={15} height={19} rx={1.5} fill={brother ? "#166534" : "#1e40af"} />
        <path d="M-7.5 -16h15M-7.5 -10h15M-7.5 -4h15M-3 -21v19M3 -21v19" stroke={brother ? "#86efac" : "#60a5fa"} strokeWidth={0.7} />
        <path d={`M${-facing * 8} -40q${facing * 6} 4 ${facing * 14} -1l${facing * 1} 5q${-facing * 8} 4 ${-facing * 15} 0Z`} fill={brother ? "#16a34a" : "#dc2626"} />
        <Name x={0} y={11}>
          {brother ? "ভ্যানওয়ালার ভাই" : "ভ্যানওয়ালা"}
        </Name>
      </g>
    </>
  );
}

/** a ভ্যান with its bed at x…x+52; `load` stacks bags on it */
function Van({ x, load = true }: { x: number; load?: boolean }) {
  return (
    <g className="pointer-events-none">
      {load && (
        <g>
          <rect x={x + 4} y={108} width={20} height={16} rx={2} fill="#334155" stroke={INK} strokeWidth={0.7} />
          <rect x={x + 26} y={112} width={16} height={12} rx={2} fill="#9f1239" stroke={INK} strokeWidth={0.7} />
          <rect x={x + 10} y={100} width={12} height={8} rx={1.5} fill="#ca8a04" stroke={INK} strokeWidth={0.6} />
          <path d={`M${x + 44} 124q4 -10 8 0`} fill="#fef3c7" stroke="#a16207" strokeWidth={0.8} />
        </g>
      )}
      <rect x={x} y={124} width={52} height={6} rx={1} fill="#a16207" stroke="#713f12" strokeWidth={0.8} />
      <circle cx={x + 12} cy={140} r={9} fill="none" stroke="#1f2937" strokeWidth={2} />
      <circle cx={x + 42} cy={140} r={9} fill="none" stroke="#1f2937" strokeWidth={2} />
      <circle cx={x - 14} cy={142} r={7} fill="none" stroke="#1f2937" strokeWidth={2} />
      <path d={`M${x} 128L${x - 14} 142M${x - 8} 128v-14M${x - 12} 114h8M${x - 14} 124l-4 -12h6`} stroke="#334155" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** a gate of bamboo, posts at x ± 18 */
function BambooGate({ x }: { x: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 20} y={80} width={4} height={70} fill="#a3a33a" />
      <rect x={x + 16} y={80} width={4} height={70} fill="#a3a33a" />
      <rect x={x - 24} y={78} width={48} height={4} rx={1} fill="#84843a" />
    </g>
  );
}

/** the ভ্যানওয়ালা's খাতা lying open, centred at (x, y) */
function Khata({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-13 0L-12 -9L0 -8L12 -9L13 0L0 1Z" fill="#fefce8" stroke="#a16207" strokeWidth={0.8} />
      <path d="M0 -8V1" stroke="#a16207" strokeWidth={0.6} />
      <path d="M-10 -6h8M-10 -4h7M-10 -2h8M2 -6h8M2 -4h6M2 -2h8" stroke="#475569" strokeWidth={0.6} />
    </g>
  );
}

/** a sheet of graph paper held or lying, centred at (x, y) */
function Sheet({ x, y, line = true }: { x: number; y: number; line?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 11} y={y - 8} width={22} height={16} rx={1} fill="white" stroke="#94a3b8" strokeWidth={0.6} />
      <path d={`M${x - 11} ${y - 3}h22M${x - 11} ${y + 2}h22M${x - 5} ${y - 8}v16M${x + 3} ${y - 8}v16`} stroke="#93c5fd" strokeWidth={0.4} />
      {[
        [-8, 5],
        [-4, 3],
        [0, 0],
        [4, -1],
        [7, -4],
      ].map(([dx, dy], i) => (
        <circle key={i} cx={x + dx} cy={y + dy} r={0.9} fill={INK} />
      ))}
      {line && <path d={`M${x - 10} ${y + 6}L${x + 10} ${y - 6}`} stroke={BEST} strokeWidth={0.9} />}
    </g>
  );
}

/** a phone, centred at (x, y) */
function Phone({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 3.5} y={y - 6} width={7} height={12} rx={1.4} fill="#1f2937" />
      <rect x={x - 2.5} y={y - 4.5} width={5} height={8} rx={0.6} fill="#e0f2fe" />
      <path d={`M${x - 2} ${y + 2.5}L${x + 2} ${y - 3.5}`} stroke={BEST} strokeWidth={0.8} />
    </g>
  );
}

/** a taka note in a hand */
function Note({ x, y }: { x: number; y: number }) {
  return <rect x={x - 5} y={y - 3} width={10} height={6} rx={0.8} fill="#86efac" stroke="#15803d" strokeWidth={0.6} className="pointer-events-none" />;
}

// ---------------------------------------------------------------------------
// 1a · Leaving morning. The ভ্যান at the gate, loaded with bags; নানা at the
//      gate. The ভ্যানওয়ালা opens his খাতা on the পাটাতন। মামা: তোর নিয়মটা
//      কী? He says it; then: খাতা মিলায় দেখেন। নানা: ছেলেটা ঠকায় না।

export function VanwalaKhata({}: Story) {
  const s = useScene(5, [600, 1600, 2200, 2400, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সকালে গেটে ব্যাগ ভরা ভ্যান, নানা গেটে; ভ্যানওয়ালা পাটাতনে খাতা খুললেন; মামা জিজ্ঞেস করলেন তোর নিয়মটা কী; ভ্যানওয়ালা বললেন উঠলেই বিশ, কিলো দশ, খাতা মিলায় দেখেন; নানা বললেন ছেলেটা ঠকায় না">
        <BambooGate x={292} />
        <Van x={178} />
        {k >= 1 && (
          <g className={POP}>
            <Khata x={190} y={122} />
          </g>
        )}
        <Person who="nana" x={292} y={150} facing={-1} arm={k >= 5 ? "point" : "down"} label />
        <Person who="mama" x={48} y={150} facing={1} arm={k >= 2 ? "point" : "down"} label />
        <Vanwala x={122} facing={k === 1 ? 1 : -1} arm={k === 1 ? "point" : k >= 3 && k <= 4 ? "point" : "down"} />
        {k === 2 && <Bubble x={48} y={84} side="right" lines={["তোর নিয়মটা কী?"]} />}
        {k === 3 && <Bubble x={122} y={84} side="mid" lines={["উঠলেই বিশ।", "কিলো দশ।"]} />}
        {k === 4 && <Bubble x={122} y={84} side="mid" lines={["খাতা মিলায় দেখেন।"]} />}
        {k === 5 && <Bubble x={292} y={84} side="left" lines={["ছেলেটা ঠকায় না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1b · Three more lines on the paper: Nasib (the first two trips), Karim (the
//      last two), Samin (whatever his phone app draws).

export function FourLines({}: Story) {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব বললো প্রথম দুইটা ট্রিপ ধরলেই হয়; করিম বললো শেষের দুইটা ধরো, ওগুলা নতুন; সামিন ফোনের app এ ছয়টা ট্রিপ দিলো, app একটা লাইন দিলো">
        <Van x={250} />
        <Khata x={262} y={122} />
        <Person who="nasib" x={50} y={150} facing={1} arm={k === 1 ? "point" : "down"} mood={k === 1 ? "smug" : "plain"} label />
        <Person who="karim" x={130} y={150} facing={1} arm={k === 2 ? "point" : "down"} label />
        <Person who="samin" x={206} y={150} facing={-1} arm={k >= 3 ? "hold" : "down"} label />
        {k >= 3 && <Phone x={190} y={112} />}
        {k === 1 && <Bubble x={50} y={84} side="right" lines={["প্রথম দুইটা ট্রিপ।", "দুই রসিদে দাম, ব্যস।"]} />}
        {k === 2 && <Bubble x={130} y={84} side="mid" lines={["শেষের দুইটা ধরো।", "ওগুলা নতুন।"]} />}
        {k === 3 && <Bubble x={206} y={84} side="left" lines={["app এ ছয়টা দিলাম।", "এই লাইন দিলো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Karim: উঠার টাকা আবার কী? কিলো হিসাবে দাও।

export function KarimRule({}: Story) {
  const s = useScene(2, [600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="করিম দুইটা ট্রিপের দিকে আঙুল দিয়ে বললো, উঠার টাকা আবার কী, কিলো হিসাবে দাও">
        <Van x={236} />
        <Khata x={248} y={122} />
        <Person who="fahim" x={70} y={150} facing={1} label />
        <Person who="karim" x={150} y={150} facing={1} arm={k >= 1 ? "point" : "down"} mood={k >= 2 ? "shout" : "plain"} label />
        {k >= 2 && <Bubble x={150} y={84} side="mid" lines={["উঠার টাকা আবার কী?", "কিলো হিসাবে দাও।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · The brother's ভ্যান comes up the path with the big trunks; he holds up
//      his own খাতা।

export function BrotherVan({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ভ্যানওয়ালার ভাই আরেকটা ভ্যানে মালপত্র নিয়ে এলো; হাতে নিজের খাতা; বললো আমার খাতাও মিলায় দেন">
        <Person who="fahim" x={46} y={150} facing={1} label />
        <g style={{ transform: `translate(${k >= 1 ? 0 : 140}px, 0px)` }} className="transition-transform duration-[1600ms] ease-out motion-reduce:transition-none">
          <Van x={214} />
          <Vanwala x={170} facing={-1} arm={k >= 2 ? "hold" : "down"} brother />
          {k >= 2 && <Khata x={154} y={108} s={0.9} />}
        </g>
        {k >= 2 && <Bubble x={170} y={84} side="left" lines={["আমার খাতাও", "মিলায় দেন।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 10a · The ভ্যানওয়ালা: তাইলে কত দিবেন? মামা looks at the paper.

export function HowMuch({}: Story) {
  const s = useScene(2, [600, 1800, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ভ্যানওয়ালা বললেন, তাইলে কত দিবেন; মামা কাগজটা হাতে নিলেন">
        <BambooGate x={292} />
        <Van x={196} />
        <Person who="mama" x={70} y={150} facing={1} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 && (
          <g className={POP}>
            <Sheet x={90} y={108} line={false} />
          </g>
        )}
        <Vanwala x={148} facing={-1} arm={k >= 1 ? "point" : "down"} />
        {k === 1 && <Bubble x={148} y={84} side="mid" lines={["তাইলে কত দিবেন?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 11a · মামা reads the fare off the line: ছয় কিলো, সাতাত্তর। The ভ্যানওয়ালা
//       laughs: আশি দেন, গোল হিসাব। মামা hands over the note। নানা: কইছিলাম না।

export function PayLaugh({}: Story) {
  const s = useScene(4, [600, 2200, 2400, 1600, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামা বললেন ছয় কিলো, সাতাত্তর টাকা; ভ্যানওয়ালা হেসে বললেন আশি দেন, গোল হিসাব; মামা আশি টাকা দিলেন; নানা বললেন কইছিলাম না">
        <BambooGate x={292} />
        <Van x={196} />
        <Person who="nana" x={292} y={150} facing={-1} arm={k >= 4 ? "point" : "down"} label />
        <Person who="mama" x={70} y={150} facing={1} arm={k === 1 || k === 3 ? "hold" : "down"} mood={k >= 3 ? "happy" : "plain"} label />
        {k === 1 && <Sheet x={90} y={108} />}
        {k === 3 && <Note x={112} y={112} />}
        <Vanwala x={140} facing={-1} arm={k === 3 ? "hold" : "down"} mood={k >= 2 ? "happy" : "plain"} />
        {k === 1 && <Bubble x={70} y={84} side="right" lines={["ছয় কিলো।", "সাতাত্তর টাকা।"]} />}
        {k === 2 && <Bubble x={140} y={84} side="mid" lines={["আশি দেন।", "গোল হিসাব।"]} />}
        {k === 4 && <Bubble x={292} y={84} side="left" lines={["কইছিলাম না?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 11b · The ভ্যান on the বাঁধ, ফাহিম and আম্মু on the bags; নানা at the gate,
//       his hand up, getting smaller.

export function VanOnBandh({}: Story) {
  const s = useScene(2, [600, 1800, 2000]);
  const k = s.k;
  const off = k === 0 ? 0 : k === 1 ? -100 : -200;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ভ্যান বাঁধের উপর দিয়ে চললো; ফাহিম আর আম্মু ব্যাগের উপর বসে পেছনে তাকিয়ে; নানা গেটে হাত তুলে দাঁড়িয়ে">
        <path d="M0 150L0 138Q160 128 320 138L320 150Z" fill="#6b8f4e" className="pointer-events-none" />
        <BambooGate x={286} />
        <Person who="nana" x={286} y={150} facing={-1} arm={k >= 1 ? "wave" : "down"} label />
        <g style={{ transform: `translate(${off}px, -10px)` }} className="transition-transform duration-[1800ms] ease-in-out motion-reduce:transition-none">
          <Van x={200} load={false} />
          <rect x={228} y={112} width={16} height={12} rx={2} fill="#334155" className="pointer-events-none" />
          <Person who="fahim" x={210} y={124} facing={1} scale={0.7} arm={k >= 1 ? "wave" : "down"} />
          <Person who="ammu" x={226} y={124} facing={1} scale={0.7} />
          <Vanwala x={174} facing={-1} />
        </g>
      </Stage>
    </StoryFrame>
  );
}

// 11c · The bridge to Article 11. On the bus, Rina holds the thin glass (9.5)
//       to the window. Through it, 6.3's G = [[2, 1], [1, 2]]: (1, 0) turns
//       to (2, 1), (1, 1) only grows to (3, 3), (1, −1) stays. Her question.

export function BusGlass({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2600]);
  const k = s.k;
  const gx = 196;
  const gy = 70;
  const u = 8; // one arrow unit on the glass
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="বাসে রিনা পাতলা কাঁচটা জানালায় ধরলো; কাঁচের ভেতর একটা arrow ঘুরে গেলো, আরেকটা শুধু লম্বা হলো; রিনা জিজ্ঞেস করলো কোন arrow শুধু লম্বা হয়, ঘোরে না">
        <rect x={150} y={24} width={150} height={96} rx={8} fill="#bfe3ff" stroke="#475569" strokeWidth={4} className="pointer-events-none" />
        <path d="M150 104Q225 96 300 104V120H150Z" fill="#86c06c" className="pointer-events-none" />
        <rect x={10} y={112} width={120} height={38} rx={4} fill="#94a3b8" className="pointer-events-none" />
        <Person who="rina" x={150} y={150} facing={1} arm="hold" label />
        <rect x={gx - 30} y={gy - 34} width={70} height={66} rx={2} fill="#e0f2fe" fillOpacity={0.55} stroke="#7dd3fc" strokeWidth={1.2} className="pointer-events-none" />
        <g transform={`translate(${gx - 16} ${gy + 14})`}>
          {k >= 1 && (
            <Lit a={[0, 0]} b={k >= 2 ? [3 * u, -3 * u] : [u, -u]} list={k >= 2 ? "(3, 3)" : "(1, 1)"} w={2.4} color={BEST}>
              <path d={`M0 0L${k >= 2 ? 3 * u : u} ${k >= 2 ? -3 * u : -u}`} stroke={BEST} strokeWidth={2.4} strokeLinecap="round" className="transition-all duration-700 motion-reduce:transition-none" />
            </Lit>
          )}
          {k >= 1 && (
            <Lit a={[0, 0]} b={[u, u]} list="(1, −1)" w={2.4} color={OK}>
              <path d={`M0 0L${u} ${u}`} stroke={OK} strokeWidth={2.4} strokeLinecap="round" />
            </Lit>
          )}
          {k >= 1 && (
            <Lit a={[0, 0]} b={k >= 2 ? [2 * u, -u] : [u, 0]} list={k >= 2 ? "(2, 1)" : "(1, 0)"} w={2} color={VANC}>
              <path d={`M0 0L${k >= 2 ? 2 * u : u} ${k >= 2 ? -u : 0}`} stroke={VANC} strokeWidth={2} strokeLinecap="round" className="transition-all duration-700 motion-reduce:transition-none" />
            </Lit>
          )}
        </g>
        {k >= 3 && <Bubble x={150} y={84} side="left" lines={["কোন arrow শুধু লম্বা", "হয়, ঘোরে না?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · The stake. The bus stand is 6 কিলো, and no trip in the খাতা is 6 কিলো।
//      The four bet lines read three fares there: 60, 77, 80.

export function SixKmFig() {
  const s = useScene(2, [600, 2200, 2200]);
  const k = s.k;
  const f = SC_F;
  const CAP = ["খাতায় 6 কিলোর কোনো ট্রিপ নাই। বাসস্ট্যান্ড ঠিক 6 কিলো।", "চার লাইন, 6 কিলোতে তিন রকম ভাড়া: 60, 77, 80।", "কোন নিয়মে দিবেন, তার উপর আজকের ভাড়া। ফারাক 20 টাকা।"];
  return (
    <Scene scene={s} caption={say(CAP, k)}>
      <svg viewBox={`0 0 ${f.W} ${f.H}`} className="mx-auto h-auto w-full max-w-[11rem]" role="img" aria-label="ট্রিপের কাগজে চারটা লাইন; 6 কিলোতে তাদের ভাড়া 60, 77, 80">
        <rect x={f.sx(0)} y={f.sy(12)} width={9 * f.u} height={12 * f.u} rx={3} fill="white" stroke="#cbd5e1" />
        <TripMarks f={f} />
        <Clip f={f}>
          {BETS.map((b) => (
            <RuleLine key={b.who} r={b.rule} color={b.color} w={1.6} faint={k < 1} />
          ))}
        </Clip>
        <TripDots trips={TRIPS} />
        <path d={`M${f.sx(BUS_KM)} ${f.sy(0)}V${f.sy(12)}`} stroke={MUTE} strokeWidth={1.2} strokeDasharray="4 3" />
        {k >= 1 &&
          [60, 77, 80].map((v, i) => (
            <g key={v} className={POP} style={{ transitionDelay: `${i * 200}ms` }}>
              <circle cx={f.sx(BUS_KM)} cy={f.sy(ty(v))} r={3.4} fill="white" stroke={INK} strokeWidth={1.4} />
              <text x={f.sx(BUS_KM) + (i === 1 ? 6 : -6)} y={f.sy(ty(v)) + (i === 2 ? -4 : 4)} fontSize={9} fontWeight={800} fontFamily={MONO} fill={INK} textAnchor={i === 1 ? "start" : "end"}>
                {v}
              </text>
            </g>
          ))}
        {k >= 2 && <path d={`M${f.sx(BUS_KM) + 26} ${f.sy(6)}V${f.sy(8)}`} stroke={BAD} strokeWidth={3} strokeLinecap="round" className={FADE} />}
      </svg>
    </Scene>
  );
}

// 2½ · Why no line gets every trip. The ভ্যানওয়ালা's own rule, and the trips
//      as it would have them; then each trip slides to what was really paid,
//      with its reason: rain, bargaining, নানার বন্ধু।

const S2_RULE_FARE = TRIPS.map((t) => fareAt(VAN, t.km));
const S2_CAP = ["ভ্যানওয়ালার নিয়মে ছয় ট্রিপের ভাড়া। সব এক লাইনে।", "ট্রিপ 1: বৃষ্টির দিন। 5 টাকা বেশি।", "ট্রিপ 2: দরদাম। 5 টাকা কম।", "ট্রিপ 5: নানার বন্ধু। 10 টাকা কম।", "মানুষের ভাড়া নিয়মে চলে না। একটু এদিক, একটু ওদিক।"];
const S2_MOVE = [1, 2, -1, -1, 3, -1]; // the beat on which each trip slides

export function NoiseFig() {
  const s = useScene(4, [600, 1800, 1800, 1800, 2200]);
  const k = s.k;
  const f = SC_F;
  return (
    <Scene scene={s} caption={say(S2_CAP, k)}>
      <svg viewBox={`0 0 ${f.W} ${f.H}`} className="mx-auto h-auto w-full max-w-[11rem]" role="img" aria-label="ভ্যানওয়ালার নিয়মের লাইন; তিনটা ট্রিপ তার কারণসহ লাইন থেকে সরে গেলো">
        <rect x={f.sx(0)} y={f.sy(12)} width={9 * f.u} height={12 * f.u} rx={3} fill="white" stroke="#cbd5e1" />
        <TripMarks f={f} />
        <Clip f={f}>
          <RuleLine r={VAN} color={VANC} w={2} />
        </Clip>
        {TRIPS.map((t, i) => {
          const moved = S2_MOVE[i] > 0 && k >= S2_MOVE[i];
          const dy = moved ? (f.sy(ty(t.fare)) - f.sy(ty(S2_RULE_FARE[i]))) : 0;
          return (
            <g key={i}>
              {moved && <path d={`M${f.sx(t.km)} ${f.sy(ty(S2_RULE_FARE[i]))}V${f.sy(ty(t.fare))}`} stroke={BAD} strokeWidth={1.6} strokeDasharray="2 2" className={FADE} />}
              <circle cx={f.sx(t.km)} cy={f.sy(ty(S2_RULE_FARE[i]))} r={3.6} fill={INK} stroke="white" strokeWidth={1} style={{ transform: `translateY(${dy}px)` }} className="transition-transform duration-700 motion-reduce:transition-none" />
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// 3½ · Why squares. Two trips, one 10 over the line, one 10 under: the misses
//      add to 0, as if the line were perfect. Squared, 100 + 100. And a miss of
//      20 counts 400: a big miss counts more.

const S3_F = makeFrame(0, 6, 0, 8, 22, 12);
const S3_CAP = ["একটা ট্রিপ লাইনের 10 টাকা উপরে, আরেকটা 10 টাকা নিচে।", "শুধু যোগ করলে +10 আর −10 মিলে 0। যেন কোনো গরমিলই নাই!", "বর্গ করলে দুইটাই 100। মোট 200। গরমিল আর লুকায় না।", "20 টাকার গরমিলের বর্গ 400। বড় গরমিল অনেক বেশি গোনা হয়।"];

export function SquareWhy() {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;
  const f = S3_F;
  const up = k >= 3 ? 2 : 1; // the top trip's miss, in tens
  const sq = (x: number, y0: number, m: number) => {
    const side = Math.abs(m) * f.u;
    return <rect x={f.sx(x)} y={Math.min(f.sy(y0), f.sy(y0 + m))} width={side} height={side} fill={BAD} fillOpacity={0.18} stroke={BAD} strokeWidth={1} className={POP} />;
  };
  return (
    <Scene scene={s} caption={say(S3_CAP, k)}>
      <svg viewBox={`0 0 ${f.W} ${f.H}`} className="mx-auto h-auto w-full max-w-[10rem]" role="img" aria-label="একটা সোজা লাইন; একটা বিন্দু উপরে, একটা নিচে; গরমিলের বর্গ">
        <rect x={f.sx(0)} y={f.sy(8)} width={6 * f.u} height={8 * f.u} rx={3} fill="white" stroke="#cbd5e1" />
        <path d={`M${f.sx(0)} ${f.sy(4)}H${f.sx(6)}`} stroke={RULE} strokeWidth={2.2} />
        {k >= 2 && sq(1.5, 4, up)}
        {k >= 2 && sq(3.5, 4, -1)}
        <path d={`M${f.sx(1.5)} ${f.sy(4)}V${f.sy(4 + up)}`} stroke={BAD} strokeWidth={2} className="transition-all duration-500 motion-reduce:transition-none" />
        <path d={`M${f.sx(3.5)} ${f.sy(4)}V${f.sy(3)}`} stroke={BAD} strokeWidth={2} />
        <circle cx={f.sx(1.5)} cy={f.sy(4 + up)} r={3.6} fill={INK} className="transition-all duration-500 motion-reduce:transition-none" />
        <circle cx={f.sx(3.5)} cy={f.sy(3)} r={3.6} fill={INK} />
        <g fontFamily={MONO} fontSize={9} fontWeight={800} fill={BAD}>
          {k === 1 && (
            <>
              <text x={f.sx(1.5) - 4} y={f.sy(4.5)} textAnchor="end" className={FADE}>
                +10
              </text>
              <text x={f.sx(3.5) - 4} y={f.sy(3.4)} textAnchor="end" className={FADE}>
                −10
              </text>
            </>
          )}
          {k >= 2 && (
            <>
              <text x={f.sx(1.5) + (up * f.u) / 2} y={f.sy(4 + up / 2) + 3} textAnchor="middle">
                {up === 2 ? 400 : 100}
              </text>
              <text x={f.sx(4)} y={f.sy(3.5) + 3} textAnchor="middle">
                100
              </text>
            </>
          )}
        </g>
        {k === 1 && (
          <text x={f.sx(3)} y={f.sy(7.2)} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK} className={FADE}>
            +10 − 10 = 0
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · The shadow. 4.3's noon sun, now right above the line: b's shadow falls
//      on the line where the drop meets it square, at রেট 17. Then the sum:
//      dot product ÷ the line's own length squared.

const S4_CAP = ["রেটের লাইন, আর তার বাইরে খাতার b।", "4.3 এর দুপুরের রোদ। এবার সূর্য লাইনের ঠিক মাথার উপরে।", "b এর ছায়া পড়লো লাইনে, খাড়া কোণে। রেট 17।", "হিসাবে: (1 × 35 + 3 × 45) ÷ (1 × 1 + 3 × 3) = 170 ÷ 10 = 17।"];

export function ShadowDrop() {
  const s = useScene(3, [600, 1800, 2000, 2600]);
  const k = s.k;
  const f = CR_F;
  const foot = crAt(17);
  const sun: XY = [9.4, 8.2];
  return (
    <Scene scene={s} caption={say(S4_CAP, k)}>
      <svg viewBox={`0 0 ${f.W} ${f.H}`} className="mx-auto h-auto w-full max-w-[10rem]" role="img" aria-label="রেটের লাইন, b, সূর্য লাইনের উপর থেকে; b এর ছায়া লাইনে খাড়া কোণে পড়ে রেট 17 তে">
        <rect x={f.sx(0)} y={f.sy(12)} width={10 * f.u} height={12 * f.u} rx={3} fill="white" stroke="#cbd5e1" />
        <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(4)} ${f.sy(12)}`} stroke={OK} strokeWidth={2.6} strokeLinecap="round" />
        {k >= 1 && (
          <g className={FADE}>
            <circle cx={f.sx(sun[0])} cy={f.sy(sun[1])} r={7} fill="#facc15" stroke="#ca8a04" />
            {[-1, 0, 1].map((d) => (
              <path key={d} d={`M${f.sx(sun[0] - 0.8 + d * 0.5)} ${f.sy(sun[1] + 0.25 + d * 1.5)}l${-4.2 * f.u} ${-1.4 * f.u}`} stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" />
            ))}
          </g>
        )}
        {k >= 2 && (
          <>
            <Draw d={`M${f.sx(CR_B[0])} ${f.sy(CR_B[1])}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={2} className="stroke-[#e11d48]" />
            <SquareMark f={f} at={foot} />
            <circle cx={f.sx(foot[0])} cy={f.sy(foot[1])} r={4.2} fill={OK} stroke="white" className={POP} />
          </>
        )}
        <circle cx={f.sx(CR_B[0])} cy={f.sy(CR_B[1])} r={4.2} fill={INK} />
        <text x={f.sx(CR_B[0]) + 6} y={f.sy(CR_B[1]) + 12} fontSize={10} fontWeight={800} fill={INK}>
          b
        </text>
      </svg>
    </Scene>
  );
}

// 5½ · The same question, bigger. The খাতা's table (6 সারি, 2 অজানা) grows
//      to 10,000 সারি, then 300 column; the question stays.

const S5_CAP = ["ভ্যানের খাতা: 6 টা ট্রিপ, 2 টা অজানা।", "10,000 টা ট্রিপ হলে? লাইন আর আঁকা যায় না। প্রশ্ন একই।", "300 টা column হলেও। লাল বর্গের মোট সবচেয়ে কম কোথায়?"];

export function BigTable() {
  const s = useScene(2, [600, 2000, 2200]);
  const k = s.k;
  const rows = k === 0 ? 6 : 30;
  const cols = k < 2 ? 2 : 20;
  const tw = k < 2 ? 40 : 150;
  const th = k === 0 ? 66 : 96;
  const x0 = 30;
  const y0 = 8;
  let grid = "";
  for (let i = 1; i < rows; i++) grid += `M${x0} ${y0 + (i * th) / rows}h${tw}`;
  for (let j = 1; j < cols; j++) grid += `M${x0 + (j * tw) / cols} ${y0}v${th}`;
  return (
    <Scene scene={s} caption={say(S5_CAP, k)}>
      <svg viewBox="0 0 200 124" className="mx-auto h-auto w-full max-w-[13rem]" role="img" aria-label="খাতার ছক: 6 সারি 2 column থেকে 10000 সারি 300 column">
        <rect x={x0} y={y0} width={tw} height={th} fill="#ede9fe" stroke="#7c3aed" strokeWidth={1} className="transition-all duration-700 motion-reduce:transition-none" />
        <path key={k} d={grid} stroke="white" strokeWidth={k === 0 ? 1.2 : 0.5} className={FADE} />
        <text x={x0 - 4} y={y0 + th / 2} fontSize={8} fontFamily={MONO} fill={MUTE} textAnchor="end">
          {k === 0 ? "6" : "10000"}
        </text>
        <text x={x0 + tw / 2} y={y0 + th + 11} fontSize={8} fontFamily={MONO} fill={MUTE} textAnchor="middle">
          {k < 2 ? "2" : "300"}
        </text>
      </svg>
    </Scene>
  );
}

// 6½ · Too few. A fan of rules through the one trip, every one exact; then
//      the usual pick, the smallest: on the দামের কাগজ, the point of the
//      trip's line nearest the corner. The shadow again.

const S6_CAP = ["একটা ট্রিপের উপর দিয়ে কত লাইন! সবগুলোই ঠিক।", "কোনটা নেবেন? এটা আর অংক বলে দেয় না।", "অনেকে নেয় সবচেয়ে ছোটটা: দামের কাগজে কোনার সবচেয়ে কাছের দাম। আবার সেই ছায়া।"];

export function FanFig() {
  const s = useScene(2, [600, 2200, 2600]);
  const k = s.k;
  const f = FS_F;
  // equal scale both ways (a ঘর = 5 টাকা), so the shortest drop looks square
  const g = makeFrame(0, 10, 0, 4, 12, 8);
  const small: XY = [4.5 / 5, 13.5 / 5];
  return (
    <Scene scene={s} caption={say(S6_CAP, k)}>
      <div className="flex items-end justify-center gap-2">
        <svg viewBox={`0 0 ${f.W} ${f.H}`} className="h-auto w-full max-w-[8.5rem]" role="img" aria-label="একটা ট্রিপের বিন্দু ঘিরে অনেকগুলো লাইন">
          <rect x={f.sx(0)} y={f.sy(13)} width={9 * f.u} height={13 * f.u} rx={3} fill="white" stroke="#cbd5e1" />
          <Clip f={f}>
            {[0, 3, 6, 9, 12, 15].map((rt, i) => (
              <g key={rt} stroke={TRIP_C[i]}>
                <Draw d={`M${f.sx(0)} ${f.sy(ty(45 - 3 * rt))}L${f.sx(9)} ${f.sy(ty(45 + 6 * rt))}`} strokeWidth={1.4} delay={i * 150} />
              </g>
            ))}
          </Clip>
          <circle cx={f.sx(3)} cy={f.sy(4.5)} r={3.6} fill={INK} />
        </svg>
        {k >= 2 && (
          <svg viewBox={`0 0 ${g.W} ${g.H}`} className={`h-auto w-full max-w-[8.5rem] ${FADE}`} role="img" aria-label="দামের কাগজে ট্রিপের লাইন; কোনা থেকে লাইনের সবচেয়ে কাছের বিন্দু, খাড়া কোণে">
            <rect x={g.sx(0)} y={g.sy(4)} width={10 * g.u} height={4 * g.u} rx={3} fill="white" stroke="#cbd5e1" />
            <path d={`M${g.sx(9)} ${g.sy(0)}L${g.sx(0)} ${g.sy(3)}`} stroke={TRIP_C[1]} strokeWidth={2} />
            <text x={g.sx(10)} y={g.sy(0) + 9} fontSize={7} fill={MUTE} textAnchor="end">
              উঠার টাকা →
            </text>
            <text x={g.sx(0) + 2} y={g.sy(4) - 2} fontSize={7} fill={MUTE}>
              ↑ রেট
            </text>
            <Draw d={`M${g.sx(0)} ${g.sy(0)}L${g.sx(small[0])} ${g.sy(small[1])}`} strokeWidth={1.4} className="stroke-[#64748b]" />
            <circle cx={g.sx(small[0])} cy={g.sy(small[1])} r={4} fill={GLOW} stroke={INK} strokeWidth={1} className={POP} />
            <circle cx={g.sx(0)} cy={g.sy(0)} r={2.4} fill={INK} />
          </svg>
        )}
      </div>
    </Scene>
  );
}

// 9½ · What can't come back. A det-0 lens [[1, 1], [0.5, 0.5]] flattens a
//      3 × 3 grid of dots onto one line; dots land on the same spot. Back the
//      other way, which came from where? Nobody can say. And a b off the line
//      is reached by no one; the closest is its shadow.

const S9_F = makeFrame(0, 4.4, 0, 3, 34, 10);
const S9_CAP = ["ন'টা বিন্দু, আলাদা আলাদা জায়গায়।", "det 0 এর lens। একটা দিক মুছে গেলো। সব বিন্দু পড়লো এক লাইনে, কয়েকটা একই জায়গায়।", "উল্টা পথে, কে কোথা থেকে এসেছিলো? বলার উপায় নাই।", "লাইনের বাইরের b তে কেউ পৌঁছায় না। সবচেয়ে কাছে যায় তার ছায়া।"];

export function LostDirection() {
  const s = useScene(3, [600, 2000, 2200, 2400]);
  const k = s.k;
  const f = S9_F;
  const pts: XY[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) pts.push([0.4 + i * 0.8, 0.4 + j * 0.8]);
  const flat = (p: XY): XY => {
    const t = p[0] + p[1] - 0.8;
    return [0.2 + t, (0.2 + t) / 2];
  };
  const b: XY = [2.2, 2.4];
  // shadow of b on the line y = x / 2 (direction (2, 1))
  const tb = (b[0] * 2 + b[1]) / 5;
  const foot: XY = [2 * tb, tb];
  return (
    <Scene scene={s} caption={say(S9_CAP, k)}>
      <svg viewBox={`0 0 ${f.W} ${f.H}`} className="mx-auto h-auto w-full max-w-[12rem]" role="img" aria-label="ন'টা বিন্দু এক লাইনে চ্যাপ্টা হলো; লাইনের বাইরের b এর ছায়া লাইনে">
        <rect x={f.sx(0)} y={f.sy(3)} width={4.4 * f.u} height={3 * f.u} rx={3} fill="white" stroke="#cbd5e1" />
        {k >= 1 && <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(4.4)} ${f.sy(2.2)}`} stroke={OK} strokeWidth={2} opacity={0.6} className={FADE} />}
        {pts.map((p, i) => {
          const q = k >= 1 ? flat(p) : p;
          return <circle key={i} cx={f.sx(p[0])} cy={f.sy(p[1])} r={3.4} fill={TRIP_C[i % 6]} stroke="white" strokeWidth={0.8} style={{ transform: `translate(${(q[0] - p[0]) * f.u}px, ${-(q[1] - p[1]) * f.u}px)` }} className="transition-transform duration-1000 motion-reduce:transition-none" />;
        })}
        {k === 2 &&
          [0.2, 1.0, 1.8, 2.6, 3.4].map((x, i) => (
            <text key={i} x={f.sx(x)} y={f.sy(x / 2) - 8} fontSize={10} fontWeight={800} fill="#2563eb" textAnchor="middle" className={POP}>
              ?
            </text>
          ))}
        {k >= 3 && (
          <>
            <circle cx={f.sx(b[0])} cy={f.sy(b[1])} r={3.6} fill={INK} className={POP} />
            <text x={f.sx(b[0]) + 6} y={f.sy(b[1]) + 3} fontSize={9} fontWeight={800} fill={INK}>
              b
            </text>
            <Draw d={`M${f.sx(b[0])} ${f.sy(b[1])}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={1.6} className="stroke-[#e11d48]" delay={300} />
            <circle cx={f.sx(foot[0])} cy={f.sy(foot[1])} r={3.2} fill={GLOW} stroke={INK} strokeWidth={0.8} className={POP} />
          </>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  RuleBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 3, sealed: true } },
  PairsDisagree: { start: {}, pair: { sel: [0, 1], tried: ["0-1"] }, three: { sel: [2, 3], tried: ["0-1", "4-5", "2-3"] }, off: { sel: [4, 5], tried: ["4-5"] }, all: { all: true, tried: ["0-1", "4-5", "2-3"] } },
  MissSquares: { start: {}, near: { r: [25, 9] }, done: { r: [23, 9] } },
  ClosestReach: { start: {}, guessed: { guess: 0, rate: 15 }, found: { guess: 0, rate: 17, found: true }, right: { guess: 1, rate: 17, found: true } },
  BestLine: { start: {}, moved: { r: [10, 14], starts: ["40,3"] }, done: { r: [23, 9], starts: ["40,3", "10,14"] } },
  FewReceipts: { start: {}, done: { rate: 15, seen: [5, 0, 15] } },
  YourFit: { start: {}, wrong: { r: [30, 8], checks: 1 }, done: { r: [12, 11], checks: 2, ok: true } },
  TryWhich: { start: {}, wrong: { at: 0, pick: 0 }, right: { at: 0, pick: 1 }, two: { at: 1, pick: 1 }, last: { at: 2, pick: 2 } },
  ModuleChain: { start: {}, some: { open: [0, 3] }, done: { open: [0, 1, 2, 3, 4, 5], lit: true } },
  BetOpen: { start: {}, van: { cur: 2, open: [0, 2] }, done: { cur: 3, open: [0, 1, 2, 3] } },
  FiveThings: { start: {}, done: { open: [0, 1, 2, 3, 4] } },
  VanwalaKhata: { khata: { k: 1 }, mama: { k: 2 }, rule: { k: 3 }, done: {} },
  FourLines: { nasib: { k: 1 }, karim: { k: 2 }, done: {} },
  KarimRule: { done: {} },
  BrotherVan: { rest: { k: 0 }, done: {} },
  HowMuch: { ask: { k: 1 }, done: {} },
  PayLaugh: { mama: { k: 1 }, laugh: { k: 2 }, pay: { k: 3 }, done: {} },
  VanOnBandh: { rest: { k: 0 }, mid: { k: 1 }, done: {} },
  BusGlass: { rest: { k: 1 }, done: {} },
  SixKmFig: { rest: { k: 0 }, done: {} },
  NoiseFig: { rest: { k: 0 }, done: {} },
  SquareWhy: { zero: { k: 1 }, sq: { k: 2 }, done: {} },
  ShadowDrop: { sun: { k: 1 }, done: {} },
  BigTable: { rest: { k: 0 }, rows: { k: 1 }, done: {} },
  FanFig: { rest: { k: 1 }, done: {} },
  LostDirection: { flat: { k: 1 }, done: {} },
};
