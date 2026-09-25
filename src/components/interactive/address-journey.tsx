"use client";

import { type ReactNode } from "react";

import { Bubble, Card as CastCard, Person, Stage, StoryFrame, Tree } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Stepper, predictLook, primaryBtn, usePlay, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, makeFrame, same, type Frame, type XY } from "@/components/journey/plane";
import { Tup } from "@/components/journey/box";
import { Shiku } from "./arrow-journey";
import { L_Home, L_Place, L_Roads, L_Squares, L_Trail } from "./lanes-kit";
import { LightBhai } from "./light-kit";

// Screens for "Math for AI 9.4 — দুলাভাইয়ের ঠিকানা, এক গুণে card", told as a
// Journey in the author's Bangla-English. The plan is 09_journey_specs.md,
// block 9.4.
//
// যাওয়ার দিন, সকাল, নানাবাড়ির বারান্দা। দুলাভাই drew his village last night
// (9.3's bridge): the বাজার at (0, 0), his বাড়ি at (5, 2) on the map's square
// paper. The village has only two roads: the পাকা রাস্তা (1, 0) and the
// slanting বাঁধ (1, 1). The ভ্যানওয়ালা wants a card, কয় ঘর সোজা, কয় ঘর বাঁধ।
// দুলাভাই: map এ যা, card এও তা। Nasib holds the লাইট ভাই's lens
// B = [[1, 1], [0, 1]] (its columns are the two roads): চালান, card বের হবে।
//
// Eight screens. 1 seals the bet on নানা's card: (5, 2) · (7, 2) · (2, 3) ·
// (3, 2) (CardBet). 2 Shiku walks দুলাভাই's card off the house to (7, 2),
// then the reader finds (3, 2) with the road steppers (WalkTheCard). 3
// predict: which way does the road lens go? Card (3, 2) in, map (5, 2) out;
// Nasib's map (5, 2) in, (7, 2) out: the house moved (LensMakesMap). 4 so the
// card is the undo: B⁻¹ by Som's recipe (9.2), map in, card out, Shiku walks
// it home (UndoWritesCard). 5 Your turn (Check Q6): four places, four cards
// (YourCards). 6 Try it: মামী's বাপের বাড়ি, roads (2, 0) and (0, 1), the
// house at (6, 3) (TryRoads). 7 the bet opened (BetOpen). 8 the end (MDX).
//
// After the screens: the story scenes (LeavingMorning, NasibLens, LensOnMap,
// SomsKhataAgain, WhoGoesWhere, MamiVillage, NanaPocket, CardStack, LastLens)
// and the watch-only figures (CardStake, TwoPapers, LensColumns, HouseMoved,
// WhyMinus, BookSlip), each numbered after its screen.
//
// The road map pieces (L_Roads, L_Squares, L_Place, L_Home, L_Trail) come from
// lanes-kit.tsx, Shiku from arrow-journey.tsx, the লাইট ভাই from light-kit.tsx,
// all read-only. 5.5's rickshaw is not here: in this village Shiku walks the
// paper map, and the ভ্যানওয়ালা drives the card. Som's recipe machine is a
// local copy of 9.2's (recipe-journey.tsx), trimmed to one lens.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const BLUE = "#2563eb";
const CORAL = "#e05a47";
const OK = "#0d9488";
const BAD = "#dc2626";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

const sg = (v: number) => (v < 0 ? `−${-v}` : `${v}`);
const tp = (v: readonly number[]) => `(${v.map(sg).join(", ")})`;
const isBn = (s: string) => /[ঀ-৿]/.test(s);

// ---------------------------------------------------------------------------
// The village. The map's own paper is square: east and north. The roads are
// the পাকা রাস্তা (1, 0) and the বাঁধ (1, 1)। A card is (ঘর সোজা, ঘর বাঁধ);
// the ভ্যান (and Shiku) goes along the পাকা রাস্তা first, then up the বাঁধ।

const O: XY = [0, 0];
const HOUSE: XY = [5, 2];
const CARD_HOME: XY = [3, 2];
const MAP_SLOTS = ["পূর্বে কত ঘর", "উত্তরে কত ঘর"];
const CARD_SLOTS = ["ঘর সোজা", "ঘর বাঁধ"];

/** the village map: বাজার at (0, 0), one ঘর per unit */
const V = makeFrame(-2.5, 9.5, -0.7, 4.6, 24, 10); // 308 × 147

/** where a card leaves Shiku on the map */
const landAt = (c: readonly number[], e1: XY = [1, 0], e2: XY = [1, 1]): XY => [c[0] * e1[0] + c[1] * e2[0], c[0] * e1[1] + c[1] * e2[1]];

/** A card's walk, one ঘর at a time: along the first road, then the second. */
function walkOf(c: readonly number[], e1: XY = [1, 0], e2: XY = [1, 1]): XY[] {
  const pts: XY[] = [O];
  let p = O;
  const s0 = Math.sign(c[0]);
  for (let i = 0; i < Math.abs(c[0]); i += 1) {
    p = [p[0] + s0 * e1[0], p[1] + s0 * e1[1]];
    pts.push(p);
  }
  const s1 = Math.sign(c[1]);
  for (let i = 0; i < Math.abs(c[1]); i += 1) {
    p = [p[0] + s1 * e2[0], p[1] + s1 * e2[1]];
    pts.push(p);
  }
  return pts;
}

/** A card on screen: (সোজা, বাঁধ), each number coloured as its road and naming its slot on hover. */
function CardT({ c, hit = false, plain = false }: { c: readonly number[]; hit?: boolean; plain?: boolean }) {
  return (
    <span className={`font-mono font-bold whitespace-nowrap ${hit ? "rounded bg-accent/15 px-0.5" : ""}`}>
      (
      {c.map((n, i) => (
        <span key={i}>
          {i > 0 && ", "}
          <span
            tabIndex={0}
            aria-label={`${sg(n)} ${CARD_SLOTS[i]}`}
            className={`group/tup relative cursor-help underline decoration-current/40 decoration-dotted underline-offset-2 outline-none ${plain ? "" : i ? "text-cat-coral" : "text-cat-blue"}`}
          >
            {sg(n)}
            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 font-sans text-[0.7rem] font-normal whitespace-nowrap text-background opacity-0 transition-opacity group-hover/tup:opacity-100 group-focus/tup:opacity-100 motion-reduce:transition-none">
              {CARD_SLOTS[i]}
            </span>
          </span>
        </span>
      ))}
      )
    </span>
  );
}

/** A map point on screen, each number naming its direction on hover. */
function MapT({ v }: { v: readonly number[] }) {
  return (
    <span className="font-mono font-bold">
      <Tup v={v} of={MAP_SLOTS} />
    </span>
  );
}

/** দুলাভাইয়ের বাড়ি: 5.5's house with its own name under it */
function V_House({ f, at = HOUSE, name = "বাড়ি", ghost = false }: { f: Frame; at?: XY; name?: string; ghost?: boolean }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  if (ghost)
    return (
      <g className="pointer-events-none">
        <path d={`M${x - 6.5} ${y + 5}V${y - 1.5}L${x} ${y - 7.5}L${x + 6.5} ${y - 1.5}V${y + 5}Z`} fill="#fecaca" fillOpacity={0.6} stroke={BAD} strokeWidth={1.3} strokeDasharray="2.5 2" />
      </g>
    );
  return (
    <g className="pointer-events-none">
      <L_Home f={f} at={at} name={false} />
      <text x={x} y={y + 16} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#5a6b7d">
        {name}
      </text>
    </g>
  );
}

/** the ঘাট: steps down to the water, a নৌকা tied */
function V_Ghat({ f, at }: { f: Frame; at: XY }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      <rect x={x - 9} y={y - 1} width={18} height={7} rx={2} fill="#bae6fd" />
      <path d={`M${x - 6} ${y + 1}q6 5 12 0Z`} fill="#92400e" />
      <path d={`M${x - 7} ${y - 1}h4v-2h4v-2h4`} fill="none" stroke="#78716c" strokeWidth={1.2} />
      <text x={x} y={y - 9} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#5a6b7d">
        ঘাট
      </text>
    </g>
  );
}

/** the দিঘি: a big square pond, its name beside */
function V_Dighi({ f, at }: { f: Frame; at: XY }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      <rect x={x - 8} y={y - 6} width={16} height={11} rx={3} fill="#7dd3fc" stroke="#0369a1" strokeWidth={0.8} />
      <text x={x + 11} y={y + 3} fontSize={8.5} fontWeight={700} fill="#5a6b7d">
        দিঘি
      </text>
    </g>
  );
}

/**
 * The village map as a sheet: the map's square paper, the two roads, the
 * বাজার at (0, 0) and (unless `house` is off) দুলাভাইয়ের বাড়ি at (5, 2)।
 */
function V_Map({ f = V, label, house = true, roads = true, children, className = "max-w-[22rem]" }: { f?: Frame; label: string; house?: boolean; roads?: boolean; children?: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full ${className}`}>
      <Plane f={f} grid={0} axes={false} label={label} className="my-0! max-w-none">
        <L_Squares f={f} />
        <L_Roads f={f} show={roads} />
        <L_Place f={f} at={O} kind="bazaar" />
        {house && <V_House f={f} />}
        {children}
      </Plane>
    </div>
  );
}

/** a card lying on the map, centred at (x, y) in sheet units */
function V_CardChip({ x, y, c }: { x: number; y: number; c: readonly (number | null)[] }) {
  const n = (v: number | null) => (v === null ? "?" : sg(v));
  const t = `(${n(c[0])}, ${n(c[1])})`;
  const w = t.length * 6 + 12;
  return (
    <g className={`${POP} pointer-events-none`}>
      <rect x={x - w / 2} y={y - 9} width={w} height={18} rx={3} fill="white" stroke={INK} strokeWidth={1.2} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fontFamily={MONO}>
        <tspan fill="#475569">(</tspan>
        <tspan fill={BLUE}>{n(c[0])}</tspan>
        <tspan fill="#475569">, </tspan>
        <tspan fill={CORAL}>{n(c[1])}</tspan>
        <tspan fill="#475569">)</tspan>
      </text>
    </g>
  );
}

/** a small "?" hanging over a point */
function V_Q({ f, at }: { f: Frame; at: XY }) {
  return (
    <text x={f.sx(at[0]) + 11} y={f.sy(at[1]) - 7} fontSize={17} fontWeight={800} fill={BLUE} className={POP}>
      ?
    </text>
  );
}

/** Shiku's walk on a map, with each stop's dot; `upto` stops shown so far */
function V_Walk({ f, pts, upto, faint = false }: { f: Frame; pts: XY[]; upto: number; faint?: boolean }) {
  const n = Math.min(upto, pts.length - 1);
  return (
    <g opacity={faint ? 0.3 : 1}>
      <L_Trail f={f} pts={pts} upto={n} />
      {!faint && pts.slice(1, n + 1).map((p, i) => <circle key={i} cx={f.sx(p[0])} cy={f.sy(p[1])} r={1.8} fill={INK} className="pointer-events-none" />)}
    </g>
  );
}

/**
 * One card walked by Shiku on a map. Seeds the card as "walked"; `go` plays
 * the walk one ঘর per tick and calls `done` when she stops.
 */
function useCardWalk(ms = 220, e1: XY = [1, 0], e2: XY = [1, 1], key = "walked") {
  const [walked, setWalked] = useSeed<XY | null>(key, null);
  const play = usePlay(ms);
  const pts = walked ? walkOf(walked, e1, e2) : [O];
  const i = play.running ? play.k : pts.length - 1;
  const go = (c: XY, done?: () => void) => {
    if (play.running) return;
    setWalked(c);
    const n = walkOf(c, e1, e2).length - 1;
    if (n < 1) {
      play.play(0);
      done?.();
    } else play.play(n, done);
  };
  return { walked, pts, i, here: pts[i], running: play.running, go, landed: walked !== null && !play.running };
}

// ---------------------------------------------------------------------------
// The road lens and Som's recipe (a local copy of 9.2's machine, for one lens).
// B = [[1, 1], [0, 1]], written by rows; its columns are the two roads.

type Cells = [[string, string], [string, string]];
const B_CELLS: Cells = [
  ["1", "1"],
  ["0", "1"],
];
const BINV_CELLS: Cells = [
  ["1", "−1"],
  ["0", "1"],
];

function Bracket({ side }: { side: "l" | "r" }) {
  return <span className={`w-1.5 self-stretch border-y-2 border-current opacity-60 ${side === "l" ? "rounded-l-sm border-l-2" : "rounded-r-sm border-r-2"}`} />;
}

/** A 2 × 2 of strings, rows first. `cols` colours the first column blue, the second coral (the two roads). */
function Mat({ cells, cols = false, small = false }: { cells: Cells; cols?: boolean; small?: boolean }) {
  const tone = (c: number) => (!cols ? "" : c === 0 ? "text-cat-blue" : "text-cat-coral");
  return (
    <span className={`inline-flex items-stretch font-mono font-bold ${small ? "text-xs" : "text-sm"}`}>
      <Bracket side="l" />
      <span className="grid grid-cols-2 gap-x-1 px-0.5">
        {[0, 1].map((r) =>
          [0, 1].map((c) => (
            <span key={`${r}${c}`} className={`${small ? "min-w-5" : "min-w-7"} text-center ${tone(c)}`}>
              {cells[r][c]}
            </span>
          )),
        )}
      </span>
      <Bracket side="r" />
    </span>
  );
}

const CW = 38;
const CH = 26;
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

/** The recipe box: B's four numbers moving through Som's three moves (stage 0…3). det is 1. */
function RecipeBox({ stage }: { stage: number }) {
  const vals = [1, 1, 0, 1].map((v, i) => (stage >= 2 && (i === 1 || i === 2) ? -v : v));
  const at = stage >= 1 ? AT_SWAPPED : AT_PLAIN;
  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="inline-flex items-stretch font-mono text-sm font-bold">
        <Bracket side="l" />
        <span className="relative" style={{ width: CW * 2, height: CH * 2 }}>
          {vals.map((v, i) => (
            <span
              key={i}
              className={`absolute top-0 left-0 grid place-items-center transition-transform duration-700 ease-in-out motion-reduce:transition-none ${i === 0 || i === 3 ? "text-[#b45309] dark:text-[#fbbf24]" : "text-[#7c3aed] dark:text-[#c4b5fd]"}`}
              style={{ width: CW, height: CH, transform: `translate(${at[i][1] * CW}px, ${at[i][0] * CH}px)` }}
            >
              <span key={`${stage >= 2 && (i === 1 || i === 2) ? "f" : "p"}${stage >= 3 ? "d" : ""}`} className={stage >= 2 ? POP : ""}>
                {v === 0 ? "0" : sg(v)}
              </span>
            </span>
          ))}
        </span>
        <Bracket side="r" />
      </span>
      {stage === 2 && <span className={`font-mono text-sm font-bold whitespace-nowrap text-muted ${POP}`}>÷ 1</span>}
    </div>
  );
}

const STEP_BTN = ["কোনা দুইটা অদলবদল", "বাকি দুইটার সাইন উল্টান", "det দিয়ে ভাগ করুন"];
const STEP_DONE = ["কোনার 1 আর 1 জায়গা বদলালো। দেখতে একই।", "বাকি দুইটা: 1 হলো −1, 0 থাকলো 0।", "det 1·1 − 1·0 = 1. 1 দিয়ে ভাগে কিছু বদলায় না।"];

/** a small drawn arrow for rows of steps (no glyph) */
function RowArrow() {
  return (
    <svg viewBox="0 0 16 10" className="h-2.5 w-4 shrink-0 text-muted" aria-hidden="true">
      <path d="M1 5H13M9 1.5L13 5L9 8.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** a curled "ফেরা" arrow, drawn: the undo lens's mark */
function FeraMark({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" className="shrink-0">
      <path d="M15 12A6 6 0 1 1 13 5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="M9.5 3.5l3.8 1.4l-1.2 3.8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The road lens as a glass disc with its two roads drawn in it, and its numbers beside. `fera` marks the undo lens. */
function LensTag({ cells, fera = false, lit = false }: { cells: Cells; fera?: boolean; lit?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2 py-1 transition-shadow duration-300 motion-reduce:transition-none ${lit ? "border-accent shadow-[0_0_0_3px_rgba(253,224,71,0.6)]" : "border-border"} bg-surface`}>
      <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true" className="shrink-0">
        <circle cx={12} cy={12} r={10.5} fill="#e0f2fe" stroke={INK} strokeOpacity={0.5} strokeWidth={1.4} />
        <path d="M5 16H19" stroke={BLUE} strokeWidth={2} strokeLinecap="round" />
        <path d="M7 16L15 7" stroke={CORAL} strokeWidth={2} strokeLinecap="round" />
      </svg>
      {fera && (
        <span className="text-muted">
          <FeraMark />
        </span>
      )}
      <Mat cells={cells} cols={!fera} small />
    </span>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The village map, four cards for নানা। Sealing acts it
//     out: the picked card lands on the map at the বাজার, a "?" over the
//     বাড়ি। Never judged here; opened on screen 7.

const X1_CARDS: { who: string; line: string; c: XY }[] = [
  { who: "দুলাভাই", line: "map এ যা, card এও তা", c: [5, 2] },
  { who: "নাসিব", line: "road lens দিয়ে চালানো", c: [7, 2] },
  { who: "করিম", line: "বাঁধেই বেশি হাঁটা", c: [2, 3] },
  { who: "সামিন", line: "চুপচাপ লিখলো", c: [3, 2] },
];

export function CardBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(650);
  const k = !sealed ? 0 : act.running ? act.k : 2;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(2, () => pass("বাজি সিল হলো। Shiku কে হাঁটাই।"));
  };
  return (
    <>
      <V_Map label="দুলাভাইয়ের গ্রামের map: বাজার (0, 0), বাড়ি (5, 2); পাকা রাস্তা সোজা পূর্বে, বাঁধ হেলানো; বাজির card বাজারে রাখা, বাড়ির উপর প্রশ্নবোধক">
        {k >= 1 && bet !== null && <V_CardChip x={V.sx(-1.2)} y={V.sy(1.2)} c={X1_CARDS[bet].c} />}
        {k >= 2 && <V_Q f={V} at={HOUSE} />}
      </V_Map>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex flex-col gap-0.5 leading-tight">
              <CardT c={c.c} />
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
      <Task done={k >= 2}>নানার card এ কী লেখা হবে? একটা বেছে নিয়ে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Shiku walks a card. First দুলাভাই's (5, 2): 5 along the পাকা রাস্তা,
//     2 up the বাঁধ, and she stops at (7, 2), past the house. Then the reader
//     sets সোজা and বাঁধ with ± (each press re-walks from the বাজার) until
//     she stops at the door: (3, 2).

export function WalkTheCard() {
  const pass = useGate();
  const [amt, setAmt] = useSeed<XY>("amt", [5, 2]);
  const [tried, setTried] = useSeed("tried", false);
  const [done, setDone] = useSeed("done", false);
  const w = useCardWalk(210);
  const pts = tried || w.running ? w.pts : [O];
  const here = tried || w.running ? w.here : O;
  const first = () => w.go([5, 2], () => setTried(true));
  const press = (j: number, n: number) => {
    const next: XY = j === 0 ? [n, amt[1]] : [amt[0], n];
    setAmt(next);
    w.go(next, () => {
      if (!done && same(landAt(next), HOUSE)) {
        setDone(true);
        pass("3 ঘর সোজা, 2 ঘর বাঁধ: বাড়ি।");
      }
    });
  };
  const at = landAt(amt);
  const home = tried && !w.running && same(at, HOUSE);
  return (
    <>
      <V_Map label={`Shiku বাজার থেকে card ${tp(amt)} ধরে হাঁটলো, থামলো map এর ${tp(here)} এ`}>
        {tried && !same(amt, [5, 2]) && <V_Walk f={V} pts={walkOf([5, 2])} upto={9} faint />}
        <V_Walk f={V} pts={pts} upto={w.running ? w.i : pts.length - 1} />
        {home && <circle cx={V.sx(5)} cy={V.sy(2)} r={12} strokeWidth={2.2} className={`${POP} fill-none stroke-accent`} />}
        <Shiku f={V} at={here} />
      </V_Map>
      <div className="mt-1 text-center text-[0.95rem]">
        Card <CardT c={tried ? amt : [5, 2]} hit={home} /> <span className="text-muted">· Shiku map এর</span> <MapT v={here} /> <span className="text-muted">এ</span>
      </div>
      {!tried ? (
        <div className="mt-2 flex justify-center">
          <button type="button" className={primaryBtn} disabled={w.running} onClick={first}>
            দুলাভাইয়ের card দিয়ে হাঁটান
          </button>
        </div>
      ) : (
        <>
          {same(amt, [5, 2]) && !w.running && <div className={`${FADE} mt-1 text-center text-sm text-danger`}>Shiku থামলো (7, 2) এ। বাড়ি ছাড়িয়ে আরো 2 ঘর পূর্বে।</div>}
          <div className="mx-auto mt-2 w-full max-w-[17rem] rounded-2xl border border-border bg-surface px-3 py-1.5">
            {(["সোজা", "বাঁধ"] as const).map((name, j) => (
              <div key={name} className="flex items-center justify-between gap-2 py-1">
                <span className="text-sm whitespace-nowrap">
                  <b className={j ? "text-cat-coral" : "text-cat-blue"}>{name}</b> <span className="font-mono text-[0.9rem]">{j ? "(1, 1)" : "(1, 0)"}</span>
                </span>
                <Stepper
                  value={amt[j]}
                  onChange={(n) => press(j, n)}
                  min={j ? 0 : -2 - amt[1]}
                  max={j ? Math.min(4, 9 - amt[0]) : 9 - amt[1]}
                  disabled={done || w.running}
                  label={name}
                />
              </div>
            ))}
          </div>
        </>
      )}
      <Task done={done}>{tried ? "সোজা আর বাঁধের ঘর বদলে বদলে Shiku কে বাড়ির দরজায় থামান।" : "আগে দুলাভাইয়ের card (5, 2) দিয়ে Shiku কে হাঁটান।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict first: the road lens takes one kind of number and gives the
//     other. Which way? Then two runs, each drawn as the lens's two columns
//     laid end to end on the map: card (3, 2) in → (5, 2) out, the house;
//     Nasib's map (5, 2) in → (7, 2) out, and the house slides there: the
//     lens moved it (6.7's active move).

const X3_RIGHT = 1;

/** a tiny picture of what goes in and out of the lens: a card, a map with a pin */
function X3_Icon({ kind }: { kind: "card" | "map" }) {
  return kind === "card" ? (
    <g>
      <rect x={-9} y={-6} width={18} height={12} rx={1.5} fill="white" stroke={INK} strokeWidth={1} />
      <path d="M-5 0h4" stroke={BLUE} strokeWidth={2.2} strokeLinecap="round" />
      <path d="M2 0h4" stroke={CORAL} strokeWidth={2.2} strokeLinecap="round" />
    </g>
  ) : (
    <g>
      <rect x={-9} y={-6} width={18} height={12} rx={1.5} fill="#f8fafc" stroke={INK} strokeWidth={1} />
      <path d="M-9 -2H9M-9 2H9M-3 -6V6M3 -6V6" stroke="#94a3b8" strokeWidth={0.5} />
      <circle cx={2} cy={-1} r={2.4} fill={BAD} />
    </g>
  );
}

function X3_Pic({ from, to, both = false }: { from: "card" | "map"; to: "card" | "map"; both?: boolean }) {
  return (
    <svg viewBox="0 0 92 24" className="h-auto w-[5.75rem]" aria-hidden="true">
      <g transform="translate(12 12)">
        <X3_Icon kind={from} />
      </g>
      <path d="M24 12H33M30 9L33 12L30 15" fill="none" stroke="#64748b" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={46} cy={12} r={8} fill="#e0f2fe" stroke={INK} strokeOpacity={0.5} />
      <path d="M41 15H51M42.5 15L48.5 8.5" stroke={INK} strokeOpacity={0.6} strokeWidth={1.2} />
      <path d="M58 12H67M64 9L67 12L64 15" fill="none" stroke="#64748b" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
      {both && <path d="M67 18H58M61 15L58 18L61 21" fill="none" stroke="#64748b" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />}
      <g transform="translate(80 12)">
        <X3_Icon kind={to} />
      </g>
    </svg>
  );
}

const X3_OPTS: { from: "card" | "map"; to: "card" | "map"; both?: boolean; say: string }[] = [
  { from: "map", to: "card", say: "map দিলে card (নাসিব)" },
  { from: "card", to: "map", say: "card দিলে map" },
  { from: "card", to: "map", both: true, say: "দুই দিকেই একই" },
];
const X3_IN: XY[] = [
  [3, 2],
  [5, 2],
];

export function LensMakesMap() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [runs, setRuns] = useSeed("runs", 0);
  const play = usePlay(230);
  const r = runs - 1; // the run on screen: 0 card, 1 Nasib's map
  const input = r >= 0 ? X3_IN[r] : null;
  const pts = input ? walkOf(input) : [O];
  const i = play.running ? play.k : pts.length - 1;
  const landed = runs > 0 && !play.running;
  const over = runs >= 2 && !play.running;
  const feed = () => {
    if (play.running || runs >= 2) return;
    const n = runs + 1;
    setRuns(n);
    play.play(walkOf(X3_IN[n - 1]).length - 1, () => {
      if (n === 2) pass("Road lens: card থেকে map.");
    });
  };
  const moved = over; // the house slides to where Nasib's run landed
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {X3_OPTS.map((o, j) => (
          <Choice key={j} n={j} look={predictLook(j, guess, over, X3_RIGHT)} disabled={guess !== null} onClick={() => setGuess(j)}>
            <span className="flex flex-col items-center gap-0.5">
              <X3_Pic from={o.from} to={o.to} both={o.both} />
              <span className="text-center text-[0.7rem] leading-tight">{o.say}</span>
            </span>
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={FADE}>
          <div className="mt-2 flex min-h-9 items-center justify-center gap-1.5 text-sm">
            {input ? (
              <span key={r} className={POP}>
                {r === 0 ? <CardT c={input} /> : <MapT v={input} />}
              </span>
            ) : (
              <span className="text-muted">?</span>
            )}
            <RowArrow />
            <LensTag cells={B_CELLS} lit={play.running} />
            <RowArrow />
            {landed ? (
              <span key={`o${r}`} className={`${POP} ${r === 1 ? "text-danger" : ""}`}>
                <MapT v={pts[pts.length - 1]} />
              </span>
            ) : (
              <span className="text-muted">?</span>
            )}
          </div>
          <V_Map label="road lens এ card (3, 2) দিলে বের হয় map এর (5, 2), বাড়ি; map এর (5, 2) দিলে বের হয় (7, 2), বাড়িটাই সরে যায়" house={!moved} className="max-w-[17rem]">
            {moved && (
              <>
                <V_House f={V} ghost />
                <g style={{ transform: `translate(${V.sx(7) - V.sx(5)}px, 0px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
                  <V_House f={V} name="সরানো বাড়ি" />
                </g>
              </>
            )}
            {input && <V_Walk f={V} pts={pts} upto={i} />}
            {input && <circle cx={V.sx(pts[i][0])} cy={V.sy(pts[i][1])} r={4} fill="#facc15" stroke={INK} strokeWidth={1} className="pointer-events-none" />}
          </V_Map>
          <div className="mt-1 min-h-[2.5rem] text-center text-sm">
            {landed && r === 0 && <span className={FADE}>Card (3, 2) দিলাম। Lens দিলো map এর (5, 2): ঠিক বাড়ি।</span>}
            {landed && r === 1 && <span className={`${FADE} text-danger`}>Map (5, 2) দিলাম। বের হলো (7, 2)। Lens বাড়িটাকেই সরিয়ে দিলো। এটা card না।</span>}
          </div>
          <div className="flex justify-center">
            {runs < 2 && (
              <button type="button" className={primaryBtn} disabled={play.running} onClick={feed}>
                {runs === 0 ? "Card (3, 2) lens এ দিন" : "নাসিবের মতো map (5, 2) দিন"}
              </button>
            )}
          </div>
        </div>
      )}
      <Task done={over}>{guess === null ? "Road lens কোন দিকে চলে? আগে একটা ছবি বেছে নিন।" : "দুইটা জিনিসই lens এ দিয়ে দেখুন: আগে card, তারপর map।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The card is the undo. B through Som's machine (9.2): swap the corners,
//     flip the other two, ÷ det (1). Out comes B⁻¹ = [[1, −1], [0, 1]]. Then
//     the map (5, 2) goes in and the card (3, 2) comes out; Shiku walks it to
//     the door.

export function UndoWritesCard() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const [fed, setFed] = useSeed("fed", false);
  const step = usePlay(750);
  const w = useCardWalk(230);
  const next = () => {
    if (step.running || stage >= 3) return;
    setStage(stage + 1);
    step.play(1);
  };
  const feed = () => {
    if (w.running || fed) return;
    setFed(true);
    step.play(2, () => w.go(CARD_HOME, () => pass("Map কে ফেরার lens দিয়ে চালাও: card।")));
  };
  const out = fed && !(step.running && step.k < 1);
  const walking = fed && w.walked !== null;
  const home = w.landed && fed;
  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-muted">{stage < 3 ? "সোমের যন্ত্রে road lens" : "বের হলো road lens এর ফেরা, B⁻¹"}</span>
        {stage < 3 ? <RecipeBox stage={stage} /> : !fed ? <span className={POP}><LensTag cells={BINV_CELLS} fera /></span> : null}
        {fed && (
          <div className={`flex items-center justify-center gap-1.5 text-sm ${FADE}`}>
            <MapT v={HOUSE} />
            <RowArrow />
            <LensTag cells={BINV_CELLS} fera lit={step.running} />
            <RowArrow />
            {out ? (
              <span className={POP}>
                <CardT c={CARD_HOME} hit={home} />
              </span>
            ) : (
              <span className="text-muted">?</span>
            )}
          </div>
        )}
        <div className="min-h-5 text-center text-sm">
          {stage > 0 && stage <= 3 && !fed && (
            <span key={stage} className={FADE}>
              {STEP_DONE[stage - 1]}
            </span>
          )}
          {home && <span className={`${FADE} font-semibold text-accent-text`}>Shiku বাড়ির দরজায়।</span>}
        </div>
      </div>
      {stage >= 3 && (
        <V_Map label="ফেরার lens এ map (5, 2) দিলে card (3, 2) বের হয়; Shiku সেই card ধরে বাজার থেকে বাড়ি পৌঁছায়" className="max-w-[16rem]">
          {walking && <V_Walk f={V} pts={w.pts} upto={w.i} />}
          {home && <circle cx={V.sx(5)} cy={V.sy(2)} r={12} strokeWidth={2.2} className={`${POP} fill-none stroke-accent`} />}
          <Shiku f={V} at={walking ? w.here : O} />
        </V_Map>
      )}
      <div className="mt-2 flex justify-center">
        {stage < 3 ? (
          <button type="button" className={primaryBtn} disabled={step.running} onClick={next}>
            {STEP_BTN[stage]}
          </button>
        ) : (
          !fed && (
            <button type="button" className={primaryBtn} onClick={feed}>
              বাড়ির map (5, 2) দিন
            </button>
          )
        )}
      </div>
      <Task done={home}>{stage < 3 ? "সোমের নিয়মে road lens এর ফেরা বানান: তিনটা কাজ, একটা একটা করে।" : "এবার ফেরার lens এ বাড়ির map দিন।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Your turn (Check Q6). Four people, four places, all from the বাজার:
//     মামা the ঘাট (4, 1), নানা the মসজিদ (2, 3), করিম the স্কুল (0, 2),
//     আম্মু the দিঘি (6, 4)। The reader writes each card and walks Shiku on
//     it; a wrong card stops her somewhere else and the place stays open.

const X5_PLACES: { who: string; name: string; to: string; at: XY }[] = [
  { who: "মামা", name: "ঘাট", to: "ঘাটে", at: [4, 1] },
  { who: "নানা", name: "মসজিদ", to: "মসজিদে", at: [2, 3] },
  { who: "করিম", name: "স্কুল", to: "স্কুল মাঠে", at: [0, 2] },
  { who: "আম্মু", name: "দিঘি", to: "দিঘির পাড়ে", at: [6, 4] },
];
const cardFor = (p: XY): XY => [p[0] - p[1], p[1]];

function X5_Places({ f, lit }: { f: Frame; lit: number | null }) {
  return (
    <>
      <V_Ghat f={f} at={X5_PLACES[0].at} />
      <L_Place f={f} at={X5_PLACES[1].at} kind="mosque" />
      <L_Place f={f} at={X5_PLACES[2].at} kind="school" />
      <V_Dighi f={f} at={X5_PLACES[3].at} />
      {lit !== null && <circle key={lit} cx={f.sx(X5_PLACES[lit].at[0])} cy={f.sy(X5_PLACES[lit].at[1])} r={11} strokeWidth={1.6} strokeDasharray="3 2.5" className={`${POP} pointer-events-none fill-none stroke-cat-blue`} />}
    </>
  );
}

export function YourCards() {
  const pass = useGate();
  const [cur, setCur] = useSeed("cur", 0);
  const [amt, setAmt] = useSeed<XY>("amt", [0, 0]);
  const [done, setDone] = useSeed<number[]>("done", []);
  const [miss, setMiss] = useSeed("miss", 0);
  const [triedAt, setTriedAt] = useSeed<number | null>("triedAt", null);
  const w = useCardWalk(200);
  const place = X5_PLACES[cur];
  const all = done.length === X5_PLACES.length;
  const walk = () => {
    if (w.running || all) return;
    const c = amt;
    const target = place.at;
    setTriedAt(cur);
    w.go(c, () => {
      if (same(landAt(c), target)) {
        const nd = [...done, cur];
        setDone(nd);
        if (nd.length === X5_PLACES.length) pass("যেকোনো ঠিকানা, এক গুণে card।");
        else {
          setCur(X5_PLACES.findIndex((_, j) => !nd.includes(j)));
          setAmt([0, 0]);
        }
      } else setMiss(miss + 1);
    });
  };
  const at = w.walked ? landAt(w.walked) : null;
  const wrong = w.landed && at !== null && triedAt === cur && !done.includes(cur) && !same(at, place.at);
  const set = (j: number, n: number) => setAmt(j === 0 ? [n, amt[1]] : [amt[0], n]);
  return (
    <>
      <V_Map label="দুলাভাইয়ের গ্রামের map: বাজার, বাড়ি, ঘাট (4, 1), মসজিদ (2, 3), স্কুল (0, 2), দিঘি (6, 4); Shiku card ধরে বাজার থেকে হাঁটে">
        <X5_Places f={V} lit={all ? null : cur} />
        {w.walked && <V_Walk f={V} pts={w.pts} upto={w.i} />}
        <Shiku f={V} at={w.walked ? w.here : O} />
      </V_Map>
      <div className="mt-1.5 grid grid-cols-4 gap-1">
        {X5_PLACES.map((p, j) => (
          <button
            key={p.name}
            type="button"
            disabled={w.running || done.includes(j)}
            onClick={() => {
              setCur(j);
              setAmt([0, 0]);
            }}
            className={`flex cursor-pointer flex-col items-center rounded-lg border-2 px-1 py-0.5 text-xs leading-tight transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${done.includes(j) ? "border-accent bg-accent/10" : j === cur ? "border-cat-blue bg-cat-blue/10" : "border-border"}`}
          >
            <span className="font-semibold">{p.name}</span>
            <span className="text-muted">{p.who}</span>
            <span className="font-mono">{done.includes(j) ? <CardT c={cardFor(p.at)} /> : tp(p.at)}</span>
          </button>
        ))}
      </div>
      {!all && (
        <div className="mx-auto mt-2 flex w-full max-w-[20rem] items-center justify-center gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <b className="text-xs text-cat-blue">সোজা</b>
            <Stepper value={amt[0]} onChange={(n) => set(0, n)} min={-2 - amt[1]} max={9 - amt[1]} disabled={w.running} label="সোজা" />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <b className="text-xs text-cat-coral">বাঁধ</b>
            <Stepper value={amt[1]} onChange={(n) => set(1, n)} min={0} max={Math.min(4, 9 - amt[0])} disabled={w.running} label="বাঁধ" />
          </div>
          <button type="button" className={`${primaryBtn} self-end px-4!`} disabled={w.running} onClick={walk}>
            হাঁটান
          </button>
        </div>
      )}
      {wrong && at && (
        <Nope key={miss}>
          Shiku থামলো {tp(at)} এ। {place.name} তো {tp(place.at)} এ।{" "}
          {at[1] !== place.at[1] ? "উত্তরে যায় শুধু বাঁধ: বাঁধ কয় ঘর লাগবে?" : "উত্তরে ঠিক আছে। কিন্তু বাঁধও পূর্বে নেয়: সোজা থেকে সেটা বাদ দিন।"}
        </Nope>
      )}
      <Task done={all && !w.running}>
        {all ? "চারটা card লেখা হলো।" : `${place.who} যাবেন ${place.to}, map এ ${tp(place.at)}. Card লিখে Shiku কে হাঁটান।`}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Try it. মামী's বাপের বাড়ি: roads (2, 0) east (one ঘর of road is two of
//     the map) and (0, 1) north. The house at (6, 3). Three cards; each walks
//     Shiku on those roads. (12, 3) runs off the map; (6, 3) stops at (12, 3);
//     (3, 3) is the door.

const T = makeFrame(-0.5, 13.5, -0.6, 4, 21, 10); // 314 × 117
const T_E1: XY = [2, 0];
const T_E2: XY = [0, 1];
const T_HOUSE: XY = [6, 3];
const X6_CARDS: XY[] = [
  [12, 3],
  [3, 3],
  [6, 3],
];
const X6_RIGHT = 1;
const X6_NOPE = [
  "Shiku সোজা 12 বার গেলো। পূর্বের রাস্তার প্রতিটা ঘর map এর 2 ঘর। 24 ঘর পূর্বে, map ছাড়িয়ে।",
  "",
  "Shiku থামলো (12, 3) এ, দুইগুণ দূরে। এখানে সোজার এক ঘর map এর দুই ঘর।",
];

function T_Roads({ f }: { f: Frame }) {
  let east = "";
  for (let y = 0; y <= 4; y += 1) east += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  let north = "";
  for (let x = 0; x <= 13; x += 2) north += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  const dots: XY[] = [];
  for (let x = 0; x <= 13; x += 2) for (let y = 0; y <= 4; y += 1) dots.push([x, y]);
  return (
    <g className="pointer-events-none">
      <path d={north} strokeWidth={3.2} strokeLinecap="round" className="fill-none stroke-cat-coral/[0.2]" />
      <path d={east} strokeWidth={3.2} strokeLinecap="round" className="fill-none stroke-cat-blue/[0.22]" />
      {dots.map(([x, y]) => (
        <circle key={`${x}:${y}`} cx={f.sx(x)} cy={f.sy(y)} r={1.3} fill="#94a3b8" />
      ))}
    </g>
  );
}

export function TryRoads() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const w = useCardWalk(170, T_E1, T_E2);
  const choose = (j: number) => {
    if (w.running) return;
    setPick(j);
    w.go(X6_CARDS[j], () => (j === X6_RIGHT ? pass("রাস্তা দুই ঘর লম্বা, card এ অর্ধেক।") : setMiss(miss + 1)));
  };
  // the walk is cut where it leaves the map
  const shown = w.pts.filter((p) => p[0] <= 13);
  const off = shown.length < w.pts.length;
  const i = Math.min(w.i, shown.length - 1);
  const settled = pick !== null && !w.running;
  const right = settled && pick === X6_RIGHT;
  return (
    <>
      <div className="mx-auto w-full max-w-[20rem]">
        <Plane f={T} grid={0} axes={false} label="মামীর বাপের বাড়ির গ্রাম: পূর্বের রাস্তার এক ঘর map এর দুই ঘর, উত্তরের রাস্তা এক ঘর; বাড়ি (6, 3)" className="my-0! max-w-none">
          <L_Squares f={T} />
          <T_Roads f={T} />
          <L_Place f={T} at={O} kind="bazaar" />
          <V_House f={T} at={T_HOUSE} name="মামীর বাপের বাড়ি" />
          {pick !== null && <V_Walk f={T} pts={shown} upto={i} />}
          {right && <circle cx={T.sx(6)} cy={T.sy(3)} r={12} strokeWidth={2.2} className={`${POP} fill-none stroke-accent`} />}
          {settled && off && (
            <g className={POP}>
              <path d={`M${T.sx(13.1)} ${T.sy(0)}h10M${T.sx(13.1) + 6} ${T.sy(0) - 4}l4 4l-4 4`} fill="none" stroke={BAD} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
          <Shiku f={T} at={pick === null ? O : shown[i]} />
        </Plane>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X6_CARDS.map((c, j) => (
          <Choice key={j} n={j} look={pick === j && settled ? (j === X6_RIGHT ? "right" : "wrong") : "idle"} disabled={w.running || right} onClick={() => choose(j)}>
            <CardT c={c} plain={right && j === X6_RIGHT} />
          </Choice>
        ))}
      </div>
      {settled && pick !== X6_RIGHT && <Nope key={miss}>{X6_NOPE[pick]}</Nope>}
      <Task done={right}>মামীর বাপের বাড়ির card কোনটা? একটা বেছে নিলে Shiku সেটা ধরে হাঁটবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The bet opened. Each card is walked from the বাজার: দুলাভাই's (5, 2)
//     stops at (7, 2), Nasib's (7, 2) at (9, 2), Karim's (2, 3) at (5, 3),
//     Samin's (3, 2) at the door.

const X7_SAY = ["Shiku থামলো (7, 2) এ। বাড়ি ছাড়িয়ে 2 ঘর।", "আরো দূরে, (9, 2) এ। Lens উল্টা দিকে চালানো হয়েছিলো।", "উঠে গেলো (5, 3) এ। বাড়ির এক ঘর উত্তরে, ধানক্ষেতে।", "বাড়ির দরজায়। 3 ঘর সোজা, 2 ঘর বাঁধ।"];
const X7_RIGHT = 3;

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const w = useCardWalk(190);
  const tap = (j: number) => {
    if (w.running) return;
    const no = open.includes(j) ? open : [...open, j];
    setOpen(no);
    setCur(j);
    w.go(X1_CARDS[j].c, () => {
      if (no.length === X1_CARDS.length) pass("ঠিক card এ Shiku বাড়ির দরজায়।");
    });
  };
  const landed = cur !== null && w.landed;
  return (
    <>
      <V_Map label="বাজির চারটা card, প্রতিটা ধরে Shiku বাজার থেকে হাঁটে; যে card খুলবেন তার হাঁটা">
        {w.walked && <V_Walk f={V} pts={w.pts} upto={w.i} />}
        {landed && cur === X7_RIGHT && <circle cx={V.sx(5)} cy={V.sy(2)} r={12} strokeWidth={2.2} className={`${POP} fill-none stroke-accent`} />}
        <Shiku f={V} at={w.walked ? w.here : O} />
      </V_Map>
      <div className="mt-1 min-h-[2.5rem] text-center text-sm">
        {landed && cur !== null ? (
          <span key={cur} className={`${FADE} ${cur === X7_RIGHT ? "font-semibold text-accent-text" : "text-danger"}`}>
            {X7_SAY[cur]}
          </span>
        ) : (
          <span className="text-muted">একটা card খুলুন</span>
        )}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, j) => (
          <Choice key={c.who} n={j} look={open.includes(j) ? (j === X7_RIGHT ? "right" : "wrong") : "idle"} disabled={w.running} onClick={() => tap(j)}>
            <span className="flex flex-col gap-0.5 leading-tight">
              <CardT c={c.c} plain={open.includes(j) && j === X7_RIGHT} />
              <span className={`text-xs ${open.includes(j) && j === X7_RIGHT ? "" : "text-muted"}`}>{c.who}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={open.length === X1_CARDS.length && !w.running}>বাজির চারটা card একটা একটা করে খুলুন। প্রতিটা ধরে Shiku বাজার থেকে হাঁটবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage bits for the story scenes.

const DAY_INK = "#0f1b2d";

function Name({ x, y = 161, children, tone = DAY_INK }: { x: number; y?: number; children: ReactNode; tone?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={tone} className="pointer-events-none">
      {children}
    </text>
  );
}

/** দুলাভাই: মামার look in a cream পাঞ্জাবি (8.7), his name under his feet. */
function St_Dulabhai({ x, y = 150, facing = 1, arm = "down", walking = false }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "hold" | "point" | "wave"; walking?: boolean }) {
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} arm={arm} walking={walking} />
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

/** the ভ্যানওয়ালা: মামার look in a checked লুঙ্গি, a গামছা on the shoulder */
function St_Vanwala({ x, y = 150, facing = 1, arm = "down" }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "hold" | "point" | "wave" }) {
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} arm={arm} />
      <g transform={`translate(${x} ${y})`} className="pointer-events-none">
        <rect x={-7.5} y={-21} width={15} height={19} rx={1.5} fill="#1e40af" />
        <path d="M-7.5 -16h15M-7.5 -10h15M-7.5 -4h15M-3 -21v19M3 -21v19" stroke="#60a5fa" strokeWidth={0.7} />
        <path d={`M${-facing * 8} -40q${facing * 6} 4 ${facing * 14} -1l${facing * 1} 5q${-facing * 8} 4 ${-facing * 15} 0Z`} fill="#dc2626" />
        <Name x={0} y={11}>
          ভ্যানওয়ালা
        </Name>
      </g>
    </>
  );
}

/** a ভ্যান, flat bed, three wheels; front (handlebar) at x0 when `facing` is −1 */
function St_Van({ x, y = 150, facing = -1 }: { x: number; y?: number; facing?: 1 | -1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${facing} 1)`} className="pointer-events-none">
      <rect x={-6} y={-17} width={44} height={4} rx={1} fill="#a16207" />
      <path d="M-6 -13L-12 -4M-12 -4L-16 -22M-19 -22h6" fill="none" stroke="#334155" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={-14} cy={-5} r={5} fill="white" stroke={INK} strokeWidth={1.3} />
      <circle cx={6} cy={-6} r={6} fill="white" stroke={INK} strokeWidth={1.3} />
      <circle cx={30} cy={-6} r={6} fill="white" stroke={INK} strokeWidth={1.3} />
    </g>
  );
}

/** the বারান্দা: a raised floor, a pillar, the edge of the roof */
function St_Veranda({ x0 = 0, x1 = 200 }: { x0?: number; x1?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x0} y={20} width={x1 - x0} height={8} fill="#b45309" />
      <rect x={x0} y={146} width={x1 - x0} height={10} fill="#d6d3d1" />
      <rect x={x1 - 8} y={28} width={6} height={118} fill="#e7e5e4" stroke="#a8a29e" strokeWidth={0.6} />
    </g>
  );
}

/** a low table with the village map on it */
function St_Table({ x, y = 150, map = true }: { x: number; y?: number; map?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 22} y={y - 24} width={44} height={4} fill="#92400e" />
      <path d={`M${x - 19} ${y - 20}V${y - 4}M${x + 19} ${y - 20}V${y - 4}`} stroke="#92400e" strokeWidth={2.4} />
      {map && (
        <g>
          <path d={`M${x - 17} ${y - 24}l4 -5h28l-4 5Z`} fill="white" stroke="#94a3b8" strokeWidth={0.6} />
          <path d={`M${x - 14} ${y - 25.5}h22M${x - 11} ${y - 25.5}l5 -3`} stroke={BLUE} strokeWidth={0.8} />
        </g>
      )}
    </g>
  );
}

/** the road lens: a glass disc with its two roads drawn in it */
function St_Lens({ x, y, r = 8, fera = false }: { x: number; y: number; r?: number; fera?: boolean }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill="#e0f2fe" fillOpacity={0.9} stroke={INK} strokeOpacity={0.55} strokeWidth={1.2} />
      <path d={`M${x - r * 0.65} ${y + r * 0.35}H${x + r * 0.65}`} stroke={BLUE} strokeWidth={1.6} strokeLinecap="round" />
      <path d={`M${x - r * 0.45} ${y + r * 0.35}L${x + r * 0.3} ${y - r * 0.5}`} stroke={CORAL} strokeWidth={1.6} strokeLinecap="round" />
      {fera && <path d={`M${x + r * 0.9} ${y - r * 0.5}a${r} ${r} 0 0 1 ${-r * 0.4} ${r * 1.2}`} fill="none" stroke={INK} strokeWidth={1.1} />}
    </g>
  );
}

/** a small white card with Bangla (the cast's Card is monospace) */
function St_Note({ x, y, text, w = 46 }: { x: number; y: number; text: string; w?: number }) {
  return (
    <g className={POP}>
      <rect x={x - w / 2} y={y - 9} width={w} height={17} rx={3} fill="white" stroke="#64748b" strokeWidth={1} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK} fontFamily={isBn(text) ? undefined : MONO}>
        {text}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · যাওয়ার দিন, সকাল। The বারান্দা: দুলাভাই with his cards, the map on the
//      table. At the gate the ভ্যানওয়ালা with his ভ্যান, come early for the
//      machine: ম্যাপ আমি বুঝি না। কয় ঘর সোজা, কয় ঘর বাঁধ ধইরা, এইটা লেইখা দেন।
//      দুলাভাই: map এ যা, card এও তা। (5, 2).

export function LeavingMorning({}: Story) {
  const s = useScene(4, [600, 1800, 2400, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="যাওয়ার দিন সকাল; বারান্দায় দুলাভাই, হাতে card, টেবিলে গ্রামের map; গেটে ভ্যানওয়ালা বললেন, ম্যাপ আমি বুঝি না, কয় ঘর সোজা, কয় ঘর বাঁধ ধইরা, লেইখা দেন; দুলাভাই বললেন, map এ যা, card এও তা, (5, 2)">
        <St_Veranda x0={0} x1={170} />
        <St_Table x={60} />
        <St_Dulabhai x={112} facing={1} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && k < 4 && <rect x={117} y={97} width={22} height={14} rx={1.5} fill="white" stroke="#1d4ed8" strokeWidth={1} className={POP} />}
        {k >= 4 && <CastCard x={128} y={104} text="(5, 2)" tone="blue" />}
        <Tree x={300} y={150} s={0.9} />
        <path d="M232 150V112M240 150V112" stroke="#57534e" strokeWidth={3} />
        <St_Van x={282} facing={-1} />
        <St_Vanwala x={214} facing={-1} arm={k >= 2 && k < 4 ? "point" : "down"} />
        {k === 2 && <Bubble x={214} y={84} side="left" lines={["ম্যাপ আমি", "বুঝি না, দুলাভাই।"]} />}
        {k === 3 && <Bubble x={214} y={84} side="left" lines={["কয় ঘর সোজা, কয় ঘর", "বাঁধ ধইরা, লেইখা দেন।"]} />}
        {k >= 4 && <Bubble x={112} y={84} side="right" lines={["map এ যা,", "card এও তা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1b · Nasib picks the লাইট ভাই's হেলানো lens off the table; in it, the two
//      roads. roads এর lens তো এইটাই। Map এর সংখ্যা চালান, card বের হবে।

export function NasibLens({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  const up = k >= 1;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব টেবিল থেকে লাইট ভাইয়ের হেলানো lens তুললো; lens এর ভেতরে দুইটা রাস্তা, সোজা আর হেলানো; নাসিব বললো roads এর lens তো এইটাই, map এর সংখ্যা চালান, card বের হবে">
        <St_Veranda x0={0} x1={240} />
        <St_Table x={150} />
        {!up && <St_Lens x={140} y={122} r={6} />}
        <Person who="nasib" x={100} y={150} facing={1} arm={up ? "hold" : "down"} mood={k >= 2 ? "smug" : "plain"} label />
        {up && (
          <g className={POP}>
            <St_Lens x={112} y={104} r={k >= 2 ? 13 : 8} />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <text x={128} y={114} fontSize={7.5} fontWeight={700} fill={BLUE}>
              পাকা রাস্তা
            </text>
            <text x={126} y={96} fontSize={7.5} fontWeight={700} fill={CORAL}>
              বাঁধ
            </text>
          </g>
        )}
        <St_Dulabhai x={215} facing={-1} />
        {k === 2 && <Bubble x={100} y={84} side="right" lines={["roads এর lens", "তো এইটাই।"]} />}
        {k >= 3 && <Bubble x={100} y={84} side="right" lines={["Map এর সংখ্যা চালান,", "card বের হবে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Nasib holds the lens over the map on the table. Som sits down beside
//      him: lens টা কোন দিকে চলে, আগে দেখো। Card দিলে কী বের হয়?

export function LensOnMap({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব lens টা map এর উপর ধরে আছে; সোম পাশে এসে বসলো; বললো, lens টা কোন দিকে চলে আগে দেখো, card দিলে কী বের হয়">
        <St_Veranda x0={0} x1={300} />
        <St_Table x={150} />
        <Person who="nasib" x={110} y={150} facing={1} arm="hold" label />
        <g style={{ transform: `translate(0px, ${k >= 1 ? 8 : 0}px)` }} className="transition-transform duration-700 motion-reduce:transition-none">
          <St_Lens x={134} y={108} r={9} />
        </g>
        <Person who="som" x={k >= 1 ? 200 : 290} y={150} facing={-1} walking={k === 1} arm={k >= 3 ? "point" : "down"} label />
        {k === 2 && <Bubble x={200} y={84} side="left" lines={["lens টা কোন দিকে", "চলে, আগে দেখো।"]} />}
        {k >= 3 && <Bubble x={200} y={84} side="left" lines={["Card দিলে", "কী বের হয়?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Som turns his খাতা back to yesterday's page: the recipe, three lines.
//      He lays the road lens beside it.

export function SomsKhataAgain({}: Story) {
  const s = useScene(3, [600, 1600, 2600, 2000]);
  const k = s.k;
  const lines = ["কোনা বদলাও", "সাইন উল্টাও", "det দিয়ে ভাগ"];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সোম খাতা উল্টালো; গতকালের পাতা: কোনা বদলাও, সাইন উল্টাও, det দিয়ে ভাগ; পাশে road lens">
        <St_Veranda x0={0} x1={300} />
        <Person who="som" x={70} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} label />
        <St_Table x={170} map={false} />
        <g className="pointer-events-none">
          {k === 0 && <rect x={148} y={117} width={40} height={9} rx={1.5} fill="#1d4ed8" />}
          {k >= 1 && (
            <g className={POP}>
              <rect x={118} y={60} width={104} height={62} rx={3} fill="white" stroke="#94a3b8" />
              <path d="M170 60V122" stroke="#cbd5e1" />
              {lines.map(
                (l, i) =>
                  k >= 2 && (
                    <text key={l} x={124} y={76 + i * 15} fontSize={8} fontWeight={700} fill={INK} className={FADE}>
                      {l}
                    </text>
                  ),
              )}
            </g>
          )}
          {k >= 3 && (
            <g className={POP}>
              <St_Lens x={198} y={92} r={13} />
            </g>
          )}
        </g>
      </Stage>
    </StoryFrame>
  );
}

// 5a · Everyone wants a card now. মামা the ঘাট, নানা the মসজিদ (জুম্মা),
//      করিম the স্কুল মাঠ, আম্মু the দিঘি। Each one's place pops over them.

const S5_WHO: { who: "mama" | "nana" | "karim" | "ammu"; place: string }[] = [
  { who: "mama", place: "ঘাট" },
  { who: "nana", place: "মসজিদ" },
  { who: "karim", place: "স্কুল মাঠ" },
  { who: "ammu", place: "দিঘি" },
];

export function WhoGoesWhere({}: Story) {
  const s = useScene(4, [600, 1300, 1300, 1300, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সবাই card চায়: মামা ঘাটে, নানা মসজিদে, করিম স্কুল মাঠে, আম্মু দিঘির পাড়ে; সবাই শুরু করবেন বাজার থেকে">
        <St_Veranda x0={0} x1={320} />
        {S5_WHO.map((p, i) => (
          <g key={p.who}>
            <Person who={p.who} x={50 + i * 72} y={150} facing={i < 2 ? 1 : -1} arm={k > i ? "wave" : "down"} label />
            {k > i && <St_Note x={50 + i * 72} y={70} text={p.place} w={p.place.length * 6 + 14} />}
          </g>
        ))}
      </Stage>
    </StoryFrame>
  );
}

// 6a · মামী: আমার বাপের বাড়ির রাস্তা আরো সোজা। She draws it: the east road
//      (its ঘর twice the map's) and a road straight north.

export function MamiVillage({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামী বললেন, আমার বাপের বাড়ির রাস্তা আরো সোজা; পূর্বের রাস্তার এক ঘর map এ দুই ঘর; উত্তরের রাস্তা map এর মতোই">
        <St_Veranda x0={0} x1={320} />
        <Person who="mami" x={90} y={150} facing={1} arm={k >= 1 ? "point" : "down"} label />
        {k === 1 && <Bubble x={90} y={84} side="right" lines={["আমার বাপের বাড়ির", "রাস্তা আরো সোজা।"]} />}
        {k >= 2 && <Bubble x={90} y={84} side="right" lines={["পূর্বের রাস্তার এক ঘর,", "map এ দুই ঘর।"]} />}
        {k >= 3 && (
          <g className={POP}>
            <rect x={170} y={70} width={120} height={66} rx={3} fill="white" stroke="#94a3b8" />
            {[0, 1, 2, 3].map((j) => (
              <path key={`e${j}`} d={`M176 ${126 - j * 16}H284`} stroke={BLUE} strokeWidth={2} strokeOpacity={0.5} />
            ))}
            {[0, 1, 2, 3].map((j) => (
              <path key={`n${j}`} d={`M${184 + j * 32} 76V130`} stroke={CORAL} strokeWidth={2} strokeOpacity={0.5} />
            ))}
            <path d="M184 126h32" stroke={BLUE} strokeWidth={3} />
            <text x={200} y={121} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={BLUE}>
              এক ঘর
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 7a · নানা takes the card, reads it with his glasses pushed down, folds it,
//      puts it in his পাঞ্জাবির পকেট and pats the pocket once.

export function NanaPocket({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নানা card টা হাতে নিলেন, চশমা নামিয়ে পড়লেন, ভাঁজ করে পাঞ্জাবির পকেটে রাখলেন, পকেটের উপর হাত বুলালেন">
        <St_Veranda x0={0} x1={320} />
        <St_Dulabhai x={220} facing={-1} />
        <Person who="nana" x={130} y={150} facing={1} arm={k <= 2 ? "hold" : "down"} label />
        {/* glasses */}
        <g transform={`translate(130 ${k >= 1 ? 102 : 99})`} className="pointer-events-none">
          <circle cx={-3.4} cy={0} r={2.6} fill="none" stroke={INK} strokeWidth={0.9} />
          <circle cx={3.4} cy={0} r={2.6} fill="none" stroke={INK} strokeWidth={0.9} />
        </g>
        {k <= 1 && <CastCard x={160} y={112} text="(3, 2)" tone="blue" />}
        {k === 2 && (
          <g className={POP}>
            <rect x={142} y={106} width={12} height={9} rx={1} fill="white" stroke="#1d4ed8" />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={132} y={124} width={8} height={7} rx={1} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.6} />
            <path d="M126 127l6 1" stroke="#c68e5f" strokeWidth={3} strokeLinecap="round" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 8a · The end. দুলাভাই squares six cards into a stack, a রাবার ব্যান্ড round
//      it, and hands the stack to নানা।

export function CardStack({}: Story) {
  const s = useScene(3, [600, 1800, 1400, 1800]);
  const k = s.k;
  const n = k >= 1 ? 6 : 3;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="দুলাভাই ছয়টা card একসাথে করলেন, উপরে রাবার ব্যান্ড, তাড়াটা নানার হাতে দিলেন">
        <St_Veranda x0={0} x1={320} />
        <St_Dulabhai x={130} facing={1} arm="hold" />
        <Person who="nana" x={210} y={150} facing={-1} arm={k >= 3 ? "hold" : "down"} label />
        <g style={{ transform: `translate(${k >= 3 ? 44 : 0}px, 0px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
          {Array.from({ length: n }, (_, i) => (
            <rect key={i} x={138 + (k >= 1 ? 0 : i * 7)} y={110 - (k >= 1 ? i * 1.6 : 0)} width={20} height={13} rx={1.5} fill="white" stroke="#1d4ed8" strokeWidth={0.8} className="transition-[x,y] duration-700 motion-reduce:transition-none" />
          ))}
          {k >= 2 && <path d="M146 99V125" stroke="#b91c1c" strokeWidth={2} className={POP} />}
        </g>
      </Stage>
    </StoryFrame>
  );
}

// 8b · The bridge to 9.5. In the উঠান the লাইট ভাই wraps his lenses one by
//      one. The last one he holds up: a ঝাপসা glass. Rina points at the
//      wall: her heart, a thin slanted sliver, and on it the মাছি's speck.

export function LastLens({}: Story) {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="উঠানে লাইট ভাই lens গুলো কাপড়ে মুড়ে বাক্সে রাখছেন; শেষ lens টা ঝাপসা, প্রায় চ্যাপ্টা; রিনা দেয়ালের দিকে দেখালো, এইটা দিয়েই তার heart আঁকা; heart এর উপর মাছির ছোট দাগ">
        <rect x={8} y={36} width={112} height={114} fill="#f5f5f4" stroke="#d6d3d1" />
        <path d="M30 118L98 72L102 78L34 124Z" fill="#f9a8d4" stroke="#db2777" strokeWidth={0.8} />
        {k >= 3 && <circle cx={70} cy={96} r={2} fill="#1c1917" className={POP} />}
        {k >= 3 && <circle cx={70} cy={96} r={7} fill="none" stroke="#b91c1c" strokeWidth={1.2} strokeDasharray="2 2" className={POP} />}
        <rect x={228} y={130} width={36} height={20} fill="#a16207" />
        <path d="M228 130h36" stroke="#78350f" strokeWidth={1.4} />
        {k === 0 && <St_Lens x={246} y={124} r={6} />}
        <LightBhai x={200} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && (
          <g className={POP}>
            <ellipse cx={186} cy={106} rx={13} ry={4} fill="#cbd5e1" fillOpacity={0.85} stroke={INK} strokeOpacity={0.5} />
          </g>
        )}
        {k >= 2 && <Person who="rina" x={140} y={150} facing={-1} arm="point" label />}
        {k === 2 && <Bubble x={140} y={84} side="mid" lines={["এইটা দিয়েই তো", "আমার heart টা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · The stake. নানা at the বাজার with a card; only two roads; a wrong card
//      leaves him in the middle of a ধানক্ষেত। Stops at "?" (no walk: that
//      is screen 2's).

const X1B_SAY = ["দুলাভাইয়ের গ্রাম। বাজার থেকে বাড়ি।", "নানা বাসে এসে নামবেন বাজারে। হাতে card।", "রাস্তা মাত্র দুইটা: পাকা রাস্তা আর বাঁধ।", "Card ভুল হলে ভ্যান থামবে ধানক্ষেতের আলে। ঠিক card কোনটা?"];

export function CardStake() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <V_Map label="দুলাভাইয়ের গ্রাম: বাজার আর বাড়ি; নানা বাজারে, হাতে card; রাস্তা দুইটা; ভুল card এ ধানক্ষেত" roads={k >= 2} className="max-w-[17rem]">
        {k >= 1 && (
          <g className={POP}>
            <V_CardChip x={V.sx(-1.2)} y={V.sy(1.5)} c={[null, null]} />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            {[0, 1, 2].map((j) => (
              <path key={j} d={`M${V.sx(7.2 + j * 0.5)} ${V.sy(3.6)}v-8M${V.sx(7.2 + j * 0.5) - 3} ${V.sy(3.6) - 5}l3 -3l3 3`} stroke="#65a30d" strokeWidth={1.2} fill="none" />
            ))}
            <text x={V.sx(7.7)} y={V.sy(3.6) + 12} textAnchor="middle" fontSize={8} fontWeight={700} fill="#5a6b7d">
              ধানক্ষেত
            </text>
            <V_Q f={V} at={HOUSE} />
          </g>
        )}
      </V_Map>
    </Scene>
  );
}

// 2½ · Two papers, one house. The map's square paper: (5, 2), 5 east, 2
//      north. The roads laid over it: along them the same house reads 3
//      সোজা, 2 বাঁধ। One house, two names.

const X2B_SAY = ["Map এর কাগজে বাড়ি (5, 2): 5 ঘর পূর্বে, 2 ঘর উত্তরে।", "এবার একই কাগজে রাস্তা দুইটা।", "রাস্তা ধরে: 3 ঘর সোজা, তারপর 2 ঘর বাঁধ।", "বাড়ি একটাই। নাম দুইটা: map এ (5, 2), card এ (3, 2)।"];

export function TwoPapers() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <V_Map label="বাড়ি map এর কাগজে (5, 2); রাস্তার কাগজে (3, 2)" roads={k >= 1} className="max-w-[17rem]">
        {k === 0 && (
          <>
            <Arrow f={V} from={O} to={[5, 0]} tone="ink" w={2} draw />
            <Arrow f={V} from={[5, 0]} to={HOUSE} tone="teal" w={2} draw delay={500} />
          </>
        )}
        {k >= 2 && (
          <>
            <Arrow f={V} from={O} to={[3, 0]} tone="blue" w={2.4} draw />
            <Arrow f={V} from={[3, 0]} to={HOUSE} tone="coral" w={2.4} draw delay={600} />
          </>
        )}
        {k >= 1 && k < 2 && <Arrow f={V} from={[5, 0]} to={HOUSE} tone="teal" w={2} faint />}
      </V_Map>
    </Scene>
  );
}

// 3½a · The lens's columns are the roads. B = [[1, 1], [0, 1]]: column 1 is
//       (1, 0), one ঘর of পাকা রাস্তা; column 2 is (1, 1), one ঘর of বাঁধ।
//       Card (3, 2): the first three times, the second twice: map (5, 2).

const X3B_SAY = ["Road lens এর সংখ্যা। দুইটা column.", "প্রথম column (1, 0): পাকা রাস্তার এক ঘর।", "দ্বিতীয় column (1, 1): বাঁধের এক ঘর।", "Card (3, 2): প্রথমটা 3 বার, দ্বিতীয়টা 2 বার। পৌঁছায় map এর (5, 2) এ।"];
const X3B_F = makeFrame(-0.5, 5.8, -0.5, 2.8, 24, 8); // 167 × 95

export function LensColumns() {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  const f = X3B_F;
  const ring = (c: number) => (k === c + 1 ? "rounded-md bg-[#fde047]/50" : "");
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <div className="flex items-center justify-center gap-2">
        <span className="inline-flex items-stretch font-mono text-sm font-bold">
          <Bracket side="l" />
          <span className="grid grid-cols-2 gap-x-1 px-0.5">
            {[0, 1].map((c) => (
              <span key={c} className={`flex flex-col items-center px-1 transition-colors duration-300 motion-reduce:transition-none ${ring(c)} ${c ? "text-cat-coral" : "text-cat-blue"}`}>
                <span>{B_CELLS[0][c]}</span>
                <span>{B_CELLS[1][c]}</span>
              </span>
            ))}
          </span>
          <Bracket side="r" />
        </span>
        <div className="w-full max-w-[11rem]">
          <Plane f={f} grid={0} axes={false} label="lens এর দুই column দুইটা রাস্তা; card (3, 2) মানে প্রথমটা 3 বার, দ্বিতীয়টা 2 বার, পৌঁছায় (5, 2)" className="my-0! max-w-none">
            <L_Squares f={f} />
            <L_Roads f={f} />
            <V_House f={f} name="" />
            {k === 1 && <Arrow f={f} from={O} to={[1, 0]} tone="blue" w={2.6} draw />}
            {k === 2 && <Arrow f={f} from={O} to={[1, 1]} tone="coral" w={2.6} draw />}
            {k >= 3 &&
              walkOf(CARD_HOME)
                .slice(1)
                .map((p, i, a) => {
                  const from = i === 0 ? O : a[i - 1];
                  return <Arrow key={i} f={f} from={from} to={p} tone={p[1] !== from[1] ? "coral" : "blue"} w={2} draw delay={i * 250} />;
                })}
          </Plane>
        </div>
      </div>
    </Scene>
  );
}

// 3½b · Nasib's (7, 2): the house moved. The map (5, 2) put in as if it
//       were a card: 5 পাকা রাস্তা, 2 বাঁধ, landing at (7, 2); a copy of
//       the house slides there. The real house stays: it needed a new name,
//       not a new place (6.7: active vs passive).

const X3C_SAY = ["বাড়ি map এর (5, 2) এ।", "নাসিব (5, 2) কেই card ধরে lens এ দিলো: 5 ঘর সোজা, 2 ঘর বাঁধ।", "পৌঁছালো (7, 2)। Lens বাড়িটাকে সরিয়ে এখানে আনতো। 6.7 এর active move.", "আসল বাড়ি নড়ে নাই। তার দরকার ছিলো নতুন নাম। Passive."];

export function HouseMoved() {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  const f = V;
  return (
    <Scene scene={s} caption={say(X3C_SAY, k)}>
      <V_Map label="নাসিবের পথ: map এর (5, 2) কে card ধরে চালালে পৌঁছায় (7, 2); বাড়ির একটা কপি সেখানে সরে যায়; আসল বাড়ি জায়গায় থাকে" className="max-w-[17rem]">
        {k >= 1 && <V_Walk f={f} pts={walkOf(HOUSE)} upto={9} />}
        {k === 2 && (
          <g className={`${POP} pointer-events-none`}>
            <g opacity={0.8}>
              <L_Home f={f} at={[7, 2]} name={false} />
            </g>
            <text x={f.sx(7)} y={f.sy(2) - 12} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={BAD}>
              সরানো বাড়ি?
            </text>
          </g>
        )}
        {k >= 3 && <circle cx={f.sx(5)} cy={f.sy(2)} r={12} strokeWidth={2} className={`${POP} fill-none stroke-accent`} />}
      </V_Map>
    </Scene>
  );
}

// 4½ · Why the undo lens works, on the roads. North only comes from the
//      বাঁধ: 2 north means 2 বাঁধ। But each বাঁধ ঘর also goes one east: 2
//      of the 5 east are already done. So সোজা 5 − 2 = 3।

const X4B_SAY = ["বাড়ি (5, 2)। উত্তরে 2 ঘর উঠতে হবে।", "উত্তরে যায় শুধু বাঁধ। তাই বাঁধ 2 ঘর।", "কিন্তু বাঁধ 2 ঘর পূর্বেও নিয়ে যায়।", "তাই সোজা বাকি 5 − 2 = 3। Card (3, 2)."];

export function WhyMinus() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const f = V;
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <V_Map label="বাড়ি (5, 2); উত্তরে 2 মানে বাঁধ 2; বাঁধ 2 ঘর পূর্বেও নেয়; তাই সোজা 5 − 2 = 3" className="max-w-[17rem]">
        {k === 0 && (
          <g className={FADE}>
            <path d={`M${f.sx(5.7)} ${f.sy(0)}V${f.sy(2)}`} stroke="#0d9488" strokeWidth={1.6} strokeDasharray="3 2" />
            <text x={f.sx(5.9)} y={f.sy(1) + 3} fontSize={9} fontWeight={700} fontFamily={MONO} fill={OK}>
              2
            </text>
          </g>
        )}
        {k >= 1 && (
          <>
            <Arrow f={f} from={[3, 0]} to={[4, 1]} tone="coral" w={2.4} draw />
            <Arrow f={f} from={[4, 1]} to={HOUSE} tone="coral" w={2.4} draw delay={350} />
          </>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d={`M${f.sx(3)} ${f.sy(-0.35)}H${f.sx(5)}M${f.sx(3)} ${f.sy(-0.35) - 3}v6M${f.sx(5)} ${f.sy(-0.35) - 3}v6`} stroke={CORAL} strokeWidth={1.3} />
            <text x={f.sx(4)} y={f.sy(-0.35) + 11} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={CORAL}>
              2
            </text>
          </g>
        )}
        {k >= 3 && <Arrow f={f} from={O} to={[3, 0]} tone="blue" w={2.4} draw />}
      </V_Map>
    </Scene>
  );
}

// 8½ · For the side quest "বইয়েরও ভুল হয়". The book's (2, 3) on 5.5's road:
//      the shear moves it to (5, 3) (what the book calls the new
//      coordinates); the card, B⁻¹(2, 3), is (−1, 3), and the point never
//      moved.

const X8_SAY = ["বইয়ের point (2, 3)। একই দুই রাস্তা।", "Lens দিয়ে চালালে point সরে যায় (5, 3) এ। বই এটাকেই নতুন ঠিকানা বলেছে।", "আসল card: 3 ঘর বাঁধ, তারপর 1 ঘর পিছনে। (−1, 3). Point নড়ে নাই।"];
const X8F = makeFrame(-2.5, 6.5, -0.5, 3.8, 24, 8); // 232 × 119

export function BookSlip() {
  const s = useScene(2, [600, 2400, 2600]);
  const k = s.k;
  const f = X8F;
  const P: XY = [2, 3];
  return (
    <Scene scene={s} caption={say(X8_SAY, k)}>
      <div className="mx-auto w-full max-w-[15rem]">
        <Plane f={f} grid={0} axes={false} label="বইয়ের point (2, 3); lens দিয়ে সরালে (5, 3); আসল card (−1, 3), point নড়ে না" className="my-0! max-w-none">
          <L_Squares f={f} />
          <L_Roads f={f} />
          <circle cx={f.sx(2)} cy={f.sy(3)} r={4} fill={OK} />
          <text x={f.sx(2) - 8} y={f.sy(3) + 3} textAnchor="end" fontSize={8.5} fontWeight={700} fontFamily={MONO} fill={OK}>
            (2, 3)
          </text>
          {k === 1 && (
            <>
              <Arrow f={f} from={P} to={[5, 3]} tone="danger" w={2} dashed />
              <circle cx={f.sx(5)} cy={f.sy(3)} r={4} fill={BAD} className={POP} />
              <text x={f.sx(5)} y={f.sy(3) + 14} textAnchor="middle" fontSize={8.5} fontWeight={700} fontFamily={MONO} fill={BAD}>
                (5, 3)
              </text>
            </>
          )}
          {k >= 2 && (
            <>
              <Arrow f={f} from={O} to={[3, 3]} tone="coral" w={2.2} draw />
              <Arrow f={f} from={[3, 3]} to={P} tone="blue" w={2.2} draw delay={600} />
            </>
          )}
          <L_Place f={f} at={O} kind="bazaar" name={false} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  CardBet: { start: {}, picked: { bet: 1 }, sealed: { bet: 3, sealed: true } },
  WalkTheCard: { start: {}, overshoot: { tried: true, walked: [5, 2] }, near: { tried: true, amt: [4, 2], walked: [4, 2] }, home: { tried: true, amt: [3, 2], walked: [3, 2], done: true } },
  LensMakesMap: { start: {}, guessed: { guess: 0 }, card: { guess: 0, runs: 1 }, both: { guess: 0, runs: 2 } },
  UndoWritesCard: { start: {}, swapped: { stage: 1 }, made: { stage: 3 }, home: { stage: 3, fed: true, walked: [3, 2] } },
  YourCards: { start: {}, wrong: { amt: [4, 1], walked: [4, 1], miss: 1, triedAt: 0 }, some: { cur: 2, done: [0, 1], amt: [-2, 2] }, all: { cur: 3, done: [0, 1, 2, 3], walked: [2, 4] } },
  TryRoads: { start: {}, off: { pick: 0, walked: [12, 3] }, far: { pick: 2, walked: [6, 3] }, right: { pick: 1, walked: [3, 3] } },
  BetOpen: { start: {}, wrong: { open: [0], cur: 0, walked: [5, 2] }, right: { open: [0, 1, 2, 3], cur: 3, walked: [3, 2] } },
  LeavingMorning: { mid: { k: 3 }, done: {} },
  NasibLens: { done: {} },
  LensOnMap: { done: {} },
  SomsKhataAgain: { done: {} },
  WhoGoesWhere: { done: {} },
  MamiVillage: { mid: { k: 2 }, done: {} },
  NanaPocket: { read: { k: 1 }, done: {} },
  CardStack: { done: {} },
  LastLens: { rina: { k: 2 }, done: {} },
  CardStake: { done: {} },
  TwoPapers: { first: { k: 0 }, done: {} },
  LensColumns: { col: { k: 1 }, done: {} },
  HouseMoved: { moved: { k: 2 }, done: {} },
  WhyMinus: { done: {} },
  BookSlip: { moved: { k: 1 }, done: {} },
};
