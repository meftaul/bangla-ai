"use client";

import { useState, type KeyboardEvent } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  Draw,
  FADE,
  LOOK,
  Nope,
  POP,
  Scene,
  Stepper,
  Ticks,
  pill,
  predictLook,
  primaryBtn,
  usePlay,
  useScene,
  useSeed,
  type Fixtures,
  type Look,
} from "@/components/journey/kit";
import { Bubble, Building, Card as CastCard, Gate, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Label, Plane, clamp, dist, makeFrame, same, tup, type Frame, type XY } from "@/components/journey/plane";
import { fitRange, land, type Key } from "./remote-journey";

// Screens for "Math for AI 5.5 — Same arrow, new numbers, the road to school",
// told as a Journey in plain English, 9 steps (the pathshala-journey skill).
//
// Fahim's first day at the new school. The map says the school is (2, 3) from
// home: 2 east, 3 north. But the new neighbourhood has only two kinds of road,
// the straight main road (1, 0) and the slanting lane (1, 1), and nothing goes
// north. The rickshaw mama wants the trip as a card: blocks straight, blocks
// slanting. The reader seals a bet on the card (SchoolBet), drives the rickshaw
// there (NoNorthRoad: 3 up the lane, 1 back), sees why the lane forces a minus
// (WhyMinus), gets the card on paper slot by slot (PeelEquations), flips the
// grid under an arrow that never moves (SameSchool), does Ammu's two errands
// unaided (YourErrand), catches Pythagoras failing on slanted roads
// (WrongTape), picks the road maps that reach everywhere (TryWhichGrid), and
// opens the bet at the school gate (BetOpened).
//
// Story scenes: FirstDay, AmmuErrands, TapeOut, BellRings. Every <Then> figure
// is watch-only (useScene): the road grid laid over the map, the card filling
// slot by slot, the lane count forced by north, the peel order, the assembly
// lines, the mosque's minus, the two tapes, the shadows on square roads, the
// three maps' reach, and the card named with its grid.
//
// The road buttons copy 5.1's ButtonRemote (L_Remote, a little wider). The
// rickshaw and its mama are drawn here.
// Tailwind only; the maps are journey/plane sheets, and ink on them is fixed.

const O: XY = [0, 0];
const SCHOOL: XY = [2, 3];
/** the school's road card: (blocks straight, blocks slanting) */
const CARD: XY = [-1, 3];

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** The two roads of the new neighbourhood, as buttons on 5.1's remote. */
const ROADS: Key[] = [
  { name: "straight", v: [1, 0], tone: "blue" },
  { name: "slanting", v: [1, 1], tone: "coral" },
];

/** A card's drive, one block at a time: up (or down) the lane first, then along the main road. */
function route(c: readonly number[]): XY[] {
  const pts: XY[] = [O];
  let p = O;
  const sl = Math.sign(c[1]);
  for (let i = 0; i < Math.abs(c[1]); i += 1) {
    p = [p[0] + sl, p[1] + sl];
    pts.push(p);
  }
  const st = Math.sign(c[0]);
  for (let i = 0; i < Math.abs(c[0]); i += 1) {
    p = [p[0] + st, p[1]];
    pts.push(p);
  }
  return pts;
}

/** The neighbourhood map: home at (0, 0), one block per unit. */
const M = makeFrame(-2, 5, -1, 4, 26, 12);

const on = (f: Frame, [x, y]: XY) => x >= f.x0 - 1e-9 && x <= f.x1 + 1e-9 && y >= f.y0 - 1e-9 && y <= f.y1 + 1e-9;

// ---------------------------------------------------------------------------
// The map pieces: the roads, the plain square grid, home, the places, the
// rickshaw, and a trip drawn block by block.

type RoadKind = "slant" | "square" | "twin";

/**
 * The roads on a map. "slant": main roads east (blue) and lanes north-east
 * (coral). "square": main roads east and roads north. "twin": two roads that
 * run side by side along one slanting line through home, and nothing else.
 */
function L_Roads({ f, kind = "slant", show = true, lanes = true, w = 3.2 }: { f: Frame; kind?: RoadKind; show?: boolean; lanes?: boolean; w?: number }) {
  const east: string[] = [];
  const other: string[] = [];
  if (kind !== "twin") for (let y = Math.ceil(f.y0); y <= Math.floor(f.y1); y += 1) east.push(`M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`);
  if (kind === "square") for (let x = Math.ceil(f.x0); x <= Math.floor(f.x1); x += 1) other.push(`M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`);
  if (kind === "slant" && lanes)
    for (let c = Math.floor(f.x0 - f.y1); c <= Math.ceil(f.x1 - f.y0); c += 1) {
      const ya = Math.max(f.y0, f.x0 - c);
      const yb = Math.min(f.y1, f.x1 - c);
      if (yb - ya > 0.05) other.push(`M${f.sx(ya + c)} ${f.sy(ya)}L${f.sx(yb + c)} ${f.sy(yb)}`);
    }
  const lo = Math.max(f.y0, f.x0);
  const hi = Math.min(f.y1, f.x1);
  const twin = `M${f.sx(lo)} ${f.sy(lo)}L${f.sx(hi)} ${f.sy(hi)}`;
  return (
    <g style={{ opacity: show ? 1 : 0 }} className="pointer-events-none transition-opacity duration-700 motion-reduce:transition-none">
      {kind === "twin" ? (
        <>
          <g transform="translate(-2.2 -2.2)">
            <path d={twin} strokeWidth={w} strokeLinecap="round" className="fill-none stroke-cat-blue/35" />
          </g>
          <g transform="translate(2.2 2.2)">
            <path d={twin} strokeWidth={w} strokeLinecap="round" className="fill-none stroke-cat-coral/35" />
          </g>
        </>
      ) : (
        <>
          <path d={other.join("")} strokeWidth={w} strokeLinecap="round" className={`fill-none ${kind === "square" ? "stroke-cat-teal/30" : "stroke-cat-coral/[0.17]"}`} />
          <path d={east.join("")} strokeWidth={w} strokeLinecap="round" className="fill-none stroke-cat-blue/[0.22]" />
        </>
      )}
    </g>
  );
}

/** The map's own thin square grid: east and north, as the paper is printed. */
function L_Squares({ f, show = true }: { f: Frame; show?: boolean }) {
  let d = "";
  for (let x = Math.ceil(f.x0); x <= Math.floor(f.x1); x += 1) d += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  for (let y = Math.ceil(f.y0); y <= Math.floor(f.y1); y += 1) d += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  return (
    <path
      d={d}
      strokeWidth={0.9}
      style={{ opacity: show ? 1 : 0 }}
      className="pointer-events-none fill-none stroke-[#64748b]/45 transition-opacity duration-700 motion-reduce:transition-none"
    />
  );
}

/** Home, a small house on the point, with its name under it. */
function L_Home({ f, at = O, name = true }: { f: Frame; at?: XY; name?: boolean }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 6.5} ${y + 5}V${y - 1.5}L${x} ${y - 7.5}L${x + 6.5} ${y - 1.5}V${y + 5}Z`} fill="#fde68a" stroke="#92400e" strokeWidth={1.1} />
      <rect x={x - 1.8} y={y + 0.5} width={3.6} height={4.5} fill="#92400e" />
      {name && (
        <text x={x} y={y + 15} textAnchor="middle" fontSize={8} fontWeight={700} fill="#5a6b7d">
          home
        </text>
      )}
    </g>
  );
}

type PlaceKind = "school" | "bazaar" | "mosque";

/** A place on the map, its icon on the point and its name above it; ringed when the rickshaw has arrived. */
function L_Place({ f, at, kind, hit = false, name = true }: { f: Frame; at: XY; kind: PlaceKind; hit?: boolean; name?: boolean }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      {hit && <circle cx={x} cy={y} r={12} strokeWidth={2.2} className={`${POP} fill-none stroke-accent`} />}
      {kind === "school" && (
        <>
          <rect x={x - 7} y={y - 4} width={14} height={9} fill="#fecaca" stroke="#991b1b" strokeWidth={1} />
          <path d={`M${x - 8.5} ${y - 4}L${x} ${y - 9}L${x + 8.5} ${y - 4}Z`} fill="#dc2626" />
          <path d={`M${x} ${y - 9}V${y - 15}`} stroke="#334155" strokeWidth={0.9} />
          <path d={`M${x} ${y - 15}h5l-1.5 1.6l1.5 1.6h-5Z`} fill="#16a34a" />
          <rect x={x - 1.5} y={y + 0.5} width={3} height={4.5} fill="#991b1b" />
        </>
      )}
      {kind === "bazaar" && (
        <>
          <rect x={x - 7} y={y - 2} width={14} height={7} fill="#b45309" />
          <path d={`M${x - 8.5} ${y - 2}L${x - 6} ${y - 8}H${x + 6}L${x + 8.5} ${y - 2}Z`} fill="white" stroke="#b45309" strokeWidth={0.8} />
          <path d={`M${x - 5} ${y - 8}l-1.5 6M${x} ${y - 8}v6M${x + 5} ${y - 8}l1.5 6`} stroke="#ef4444" strokeWidth={2} />
        </>
      )}
      {kind === "mosque" && (
        <>
          <rect x={x - 6} y={y - 2} width={12} height={7} fill="#dcfce7" stroke="#166534" strokeWidth={0.9} />
          <path d={`M${x - 5} ${y - 2}Q${x - 5} ${y - 9} ${x} ${y - 10}Q${x + 5} ${y - 9} ${x + 5} ${y - 2}Z`} fill="#16a34a" />
          <path d={`M${x} ${y - 10}V${y - 13}M${x + 8} ${y + 5}V${y - 9}`} stroke="#166534" strokeWidth={1.4} />
          <circle cx={x + 8} cy={y - 10} r={1.4} fill="#16a34a" />
        </>
      )}
      {name && (
        <text x={x} y={y - (kind === "school" ? 18 : 14)} textAnchor="middle" fontSize={8} fontWeight={700} fill="#5a6b7d">
          {kind}
        </text>
      )}
    </g>
  );
}

/** The rickshaw on a map, centred on its point; it glides to a new point over `ms`. */
function L_Rickshaw({ f, at, ms = 300, facing = 1, s = 1 }: { f: Frame; at: XY; ms?: number; facing?: 1 | -1; s?: number }) {
  return (
    <g
      style={{ transform: `translate(${f.sx(at[0])}px, ${f.sy(at[1])}px)`, transitionDuration: `${ms}ms` }}
      className="pointer-events-none transition-transform ease-linear motion-reduce:transition-none"
    >
      <g transform={`scale(${facing * s} ${s})`}>
        <circle cx={-4} cy={3} r={3.6} fill="white" stroke="#0f1b2d" strokeWidth={1.3} />
        <circle cx={8} cy={4} r={2.6} fill="white" stroke="#0f1b2d" strokeWidth={1.2} />
        <path d="M-4 3L1 -3H6L8 4M6 -3L7.5 -8M6 -8H9.5" fill="none" stroke="#334155" strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round" />
        <rect x={-10} y={-5} width={9} height={3.5} rx={1} fill="#1d4ed8" />
        <path d="M-11 -4Q-11.5 -14 -4 -14Q-1 -14 -0.5 -9L-1 -4Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth={0.6} />
        <path d="M5 -3.5L6 -9" stroke="#16a34a" strokeWidth={3} strokeLinecap="round" />
        <circle cx={6.3} cy={-11.8} r={2.2} fill="#c68e5f" />
      </g>
    </g>
  );
}

/** A trip drawn block by block up to point `upto`: lane blocks coral, main-road blocks blue. */
function L_Trail({ f, pts, upto, w = 2.2, draw = false }: { f: Frame; pts: XY[]; upto?: number; w?: number; draw?: boolean }) {
  const n = Math.min(upto ?? pts.length - 1, pts.length - 1);
  return (
    <>
      {pts.slice(1, n + 1).map((p, i) => (
        <Arrow key={`${i}:${tup(pts[i])}>${tup(p)}`} f={f} from={pts[i]} to={p} tone={p[1] !== pts[i][1] ? "coral" : "blue"} w={w} draw={draw} />
      ))}
    </>
  );
}

/** which way the rickshaw faces after the last block of a trip */
const faceOf = (pts: XY[], k: number): 1 | -1 => (k > 0 && pts[k][0] < pts[k - 1][0] ? -1 : 1);

/** A road card as two coloured slots: (straight, slanting). */
function L_CardText({ c, hit = false }: { c: readonly (number | null)[]; hit?: boolean }) {
  const s = (n: number | null) => (n === null ? "?" : n < 0 ? `−${-n}` : `${n}`);
  return (
    <span className={`font-mono font-bold ${hit ? "text-accent-text" : ""}`}>
      (<span className="text-cat-blue">{s(c[0])}</span>, <span className="text-cat-coral">{s(c[1])}</span>)
    </span>
  );
}

/**
 * The two road buttons, as 5.1's remote: one row per road, − and + around its
 * count, and a button simply runs out before the rickshaw would leave the map.
 * (5.1's ButtonRemote, drawn a little wider so "slanting (1, 1)" fits on a line.)
 */
function L_Remote({ amt, onAmt, f }: { amt: number[]; onAmt: (i: number, n: number) => void; f: Frame }) {
  return (
    <div className="mx-auto w-full max-w-[17rem] rounded-2xl border border-border bg-surface px-3 py-1.5">
      {ROADS.map((key, i) => {
        const [lo, hi] = fitRange(ROADS, amt, i, f, -4, 5);
        return (
          <div key={key.name} className="flex items-center justify-between gap-2 py-1">
            <span className="text-sm whitespace-nowrap">
              <b className={i ? "text-cat-coral" : "text-cat-blue"}>{key.name}</b> <span className="font-mono text-[0.9rem]">{tup(key.v)}</span>
            </span>
            <Stepper value={amt[i]} onChange={(n) => onAmt(i, n)} min={lo} max={hi} label={key.name} />
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The big rickshaw for story scenes, wheels on the ground at (x, y), with the
// rickshaw mama on the saddle. He isn't in the cast, so he is drawn here.

function L_BigRick({ x, y, ms = 1600, rider = true }: { x: number; y: number; ms?: number; rider?: boolean }) {
  return (
    <g
      style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }}
      className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none"
    >
      <circle cx={-16} cy={-12} r={12} fill="none" stroke="#1f2937" strokeWidth={2.4} />
      <path d="M-16 -24V0M-28 -12H-4M-24.5 -20.5L-7.5 -3.5M-24.5 -3.5L-7.5 -20.5" stroke="#6b7280" strokeWidth={0.8} />
      <circle cx={30} cy={-9} r={9} fill="none" stroke="#1f2937" strokeWidth={2.2} />
      <path d="M30 -18V0M21 -9H39" stroke="#6b7280" strokeWidth={0.8} />
      <path d="M-16 -12L0 -24H19L30 -9M19 -24L29 -42M25 -42H34" fill="none" stroke="#334155" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      <rect x={-31} y={-35} width={27} height={9} rx={2} fill="#1d4ed8" />
      <path d="M-7 -26V-18H5" stroke="#334155" strokeWidth={2} fill="none" />
      <path d="M-34 -33Q-35 -64 -13 -64Q-4 -64 -3 -46L-4 -33Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth={1} />
      <path d="M-31 -52Q-19 -58 -7 -52M-30 -43Q-19 -48 -6 -43" stroke="#fde047" strokeWidth={2} fill="none" />
      <path d="M17 -27h8" stroke="#0f1b2d" strokeWidth={3} strokeLinecap="round" />
      {rider && (
        <g>
          <path d="M19 -28L25 -14L22 -2" stroke="#6b21a8" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M18 -30L20 -48" stroke="#15803d" strokeWidth={9} strokeLinecap="round" />
          <path d="M21 -45L30 -42" stroke="#a16207" strokeWidth={3.2} strokeLinecap="round" />
          <circle cx={21} cy={-56} r={6.5} fill="#a16207" />
          <path d="M14.5 -58Q21 -65 27.5 -58" stroke="#f8fafc" strokeWidth={3} fill="none" />
          <path d="M16 -58h11" stroke="#ef4444" strokeWidth={1} strokeDasharray="2 2" />
          <circle cx={23.5} cy={-56} r={0.9} fill="#0f1b2d" />
          <path d="M21 -52.5q2.5 1.3 4 0" stroke="#0f1b2d" strokeWidth={0.9} fill="none" />
        </g>
      )}
    </g>
  );
}

/** Ammu's map card: the place's name over a card, both in fixed ink. */
function L_NamedCard({ x, y, name, text, tone }: { x: number; y: number; name: string; text: string; tone: "teal" | "amber" | "blue" | "coral" }) {
  return (
    <g className={POP}>
      <text x={x} y={y - 12} textAnchor="middle" fontSize={8} fontWeight={700} fill="#0f1b2d" stroke="white" strokeWidth={2.5} paintOrder="stroke">
        {name}
      </text>
      <CastCard x={x} y={y} text={text} tone={tone} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the first morning. Fahim
//      comes out in his school uniform, Ammu reads the map's card (2, 3), and
//      the rickshaw mama at the gate asks for straight and slanting blocks.
//      The answer card is not shown: that is the bet.

export function FirstDay({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="morning outside the new flat: Fahim in his school uniform, Ammu with the map's card (2, 3), and the rickshaw mama asking how many blocks straight and how many slanting">
        <Building x={4} y={150} w={60} h={112} color="#e7d7c1" />
        <Person who="ammu" x={92} y={150} arm={k === 2 ? "wave" : "down"} mood="happy" />
        {k === 1 && <Bubble x={92} y={84} side="right" lines={["First day. Don't", "be late!"]} />}
        {k >= 2 && <L_NamedCard x={104} y={70} name="the map says" text="(2, 3)" tone="amber" />}
        <Person who="fahim" x={k >= 1 ? 146 : 44} y={150} walking={k === 1} ms={1600} mood={k >= 3 ? "puzzled" : "happy"} />
        <L_BigRick x={246} y={150} />
        {k >= 3 && <Bubble x={266} y={86} side="left" lines={["Straight or slanting?", "How many blocks?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The map with its two roads and no north; four cards for
//     Mama: (2, 3) · (2, 1) · (−1, 3) · "can't get there". Sealed unmarked:
//     BetOpened, eight screens later, is what settles it.

const BET = ["(2, 3)", "(2, 1)", "(−1, 3)", "Can't get there"];

export function SchoolBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);

  const seal = () => {
    setSealed(true);
    pass("Bet sealed. Let's get in the rickshaw.");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[12.5rem]">
        <Plane f={M} grid={0} axes={false} label="the neighbourhood map: home, the school at (2, 3), a straight road east and slanting lanes north-east, and no road north" className="my-0! max-w-none">
          <L_Roads f={M} />
          <path d={`M${M.sx(0)} ${M.sy(0.2)}V${M.sy(1.1)}`} strokeWidth={2} strokeDasharray="3 3" className="pointer-events-none stroke-[#94a3b8]" />
          <path d={`M${M.sx(0) - 5} ${M.sy(0.85) - 5}l10 10m0 -10l-10 10`} strokeWidth={2} className="pointer-events-none stroke-danger" />
          <Label f={M} at={[0, 1.2]} dy={-3} size={7.5} className="fill-[#5a6b7d]">
            no north road
          </Label>
          <Arrow f={M} from={O} to={[1, 0]} tone="blue" w={2.6} />
          <Arrow f={M} from={O} to={[1, 1]} tone="coral" w={2.6} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" />
          {sealed && bet !== null && (
            <g className={POP}>
              <rect x={M.sx(2.6)} y={M.sy(0.55)} width={62} height={20} rx={4} fill="white" stroke="#1d4ed8" strokeWidth={1.4} />
              <circle cx={M.sx(2.6) + 62} cy={M.sy(0.55)} r={5} fill="#dc2626" />
              <text x={M.sx(2.6) + 31} y={M.sy(0.55) + 13.5} textAnchor="middle" fontSize={bet === 3 ? 7.5 : 10} fontWeight={700} fill="#1d4ed8" fontFamily={bet === 3 ? undefined : "ui-monospace, monospace"}>
                {bet === 3 ? "can't get there" : BET[bet]}
              </text>
            </g>
          )}
        </Plane>
      </div>
      <div className="mt-1 text-center text-xs text-muted">
        A card is (<span className="text-cat-blue">blocks straight</span>, <span className="text-cat-coral">blocks slanting</span>). A minus means going the other way.
      </div>
      <div className="mt-2 text-sm font-medium text-muted">Which card should Fahim give Mama?</div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {BET.map((b, i) => (
          <Choice key={b} n={i} look={bet === i ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className={i < 3 ? "font-mono" : "text-sm"}>{b}</span>
          </Choice>
        ))}
      </div>
      {!sealed ? (
        bet !== null && (
          <div className={`${FADE} mt-2.5 flex justify-center`}>
            <button type="button" onClick={seal} className={primaryBtn}>
              Seal the bet
            </button>
          </div>
        )
      ) : (
        <div className={`${FADE} mt-2.5 text-center text-[0.95rem] text-muted`}>Sealed. The ride will tell.</div>
      )}
      <Task done={sealed}>Pick the card you would give Mama, then seal the bet.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the map's square grid
//      and the school's map card (2, 3); then the main roads, then the lanes
//      laid over it; the square grid fades, and the card is a "?".

const X1F = makeFrame(-1, 4, -1, 4, 22, 10);
const X1_SAY = [
  "On the map, the school is 2 blocks east and 3 north: (2, 3).",
  "The main roads all run east. One block straight is (1, 0).",
  "The lanes all slant north-east. One block up a lane is (1, 1).",
  "And no road runs north. So on these roads, what is the school's card?",
];

export function TwoGrids() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={X1F} grid={0} axes={false} label="the map's square grid, with the main roads and the slanting lanes laid over it" className="my-0! max-w-none">
            <L_Squares f={X1F} show={k < 3} />
            <L_Roads f={X1F} show={k >= 1} lanes={k >= 2} />
            <Arrow f={X1F} from={O} to={SCHOOL} tone="ink" w={2.2} dashed />
            {k >= 1 && <Arrow f={X1F} from={O} to={[1, 0]} tone="blue" w={2.6} draw />}
            {k >= 2 && <Arrow f={X1F} from={O} to={[1, 1]} tone="coral" w={2.6} draw />}
            <L_Home f={X1F} name={false} />
            <L_Place f={X1F} at={SCHOOL} kind="school" name={false} />
          </Plane>
        </div>
        <div className="min-w-0 text-center">
          <div className="text-xs text-muted">map card</div>
          <div className="font-mono text-lg font-bold">(2, 3)</div>
          <div className="mt-2 text-xs text-muted">road card</div>
          <div className="font-mono text-lg font-bold">
            {k >= 3 ? (
              <span className={`${POP} inline-block text-cat-violet`}>(?, ?)</span>
            ) : (
              <span className="text-muted/50">…</span>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2 · In the rickshaw. The reader drives with 5.1's remote (L_Remote): straight ± and
//     slanting ±, one block per press, and the rickshaw rolls there. The only
//     way to the school is 3 up the lane and 1 back on the main road.

export function NoNorthRoad() {
  const pass = useGate();
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0]);
  const [done, setDone] = useSeed("done", false);
  const [face, setFace] = useState<1 | -1>(1);
  const pos = land(ROADS, amt);
  const there = same(pos, SCHOOL);
  const trip = route(amt);

  const press = (i: number, n: number) => {
    const next = amt.map((a, j) => (j === i ? n : a));
    const to = land(ROADS, next);
    if (to[0] !== pos[0]) setFace(to[0] < pos[0] ? -1 : 1);
    setAmt(next);
    if (!done && same(to, SCHOOL)) {
      setDone(true);
      pass("No north road, but there's the school.");
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[13rem]">
        <Plane f={M} grid={0} axes={false} label={`the rickshaw at ${tup(pos)} on the map, card ${tup(amt)}`} className="my-0! max-w-none">
          <L_Roads f={M} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" hit={there} />
          <L_Trail f={M} pts={trip} />
          <L_Rickshaw f={M} at={pos} facing={face} />
        </Plane>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        Card <L_CardText c={amt} hit={there} /> <span className="text-muted">· on the map</span> <span className="font-mono font-bold">{tup(pos)}</span>
      </div>
      <div className="mt-2">
        <L_Remote amt={amt} onAmt={press} f={M} />
      </div>
      <Task done={done}>Press the road buttons until the rickshaw stops at the school.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the card fills slot by
//      slot. Three lane blocks go into slot 2; one block back on the main road
//      goes into slot 1 as −1; the minus is ringed: it only means "back".

const X2F = makeFrame(-1, 4, -1, 4, 20, 10);
const X2_SAY = [
  "Mama's card has two slots: straight first, slanting second.",
  "3 blocks up the lane. So slot 2 is 3.",
  "Then 1 block back along the main road. Back is written with a minus: −1.",
  "(−1, 3). The minus is not a mistake. It only means “the other way”.",
];

export function CardFills() {
  const s = useScene(3, [600, 1800, 2200, 2200]);
  const k = s.k;
  const trip = route(CARD);
  const upto = k >= 2 ? 4 : k >= 1 ? 3 : 0;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X2_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={X2F} grid={0} axes={false} label="the trip to school: 3 blocks up the lane, then 1 block back on the main road" className="my-0! max-w-none">
            <L_Roads f={X2F} />
            <L_Home f={X2F} name={false} />
            <L_Place f={X2F} at={SCHOOL} kind="school" name={false} hit={k >= 2} />
            <L_Trail f={X2F} pts={trip} upto={upto} draw />
            <L_Rickshaw f={X2F} at={trip[upto]} facing={faceOf(trip, upto)} ms={700} />
          </Plane>
        </div>
        <div className="font-mono text-2xl font-bold">
          (<span className="text-cat-blue">
            {k >= 2 ? (
              <span className={`${POP} inline-block rounded-full px-0.5 transition-shadow duration-500 motion-reduce:transition-none ${k >= 3 ? "ring-2 ring-cat-violet" : ""}`}>−1</span>
            ) : (
              "?"
            )}
          </span>
          , <span className="text-cat-coral">{k >= 1 ? <span className={`${POP} inline-block`}>3</span> : "?"}</span>)
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · Why back? The reader sends the rickshaw 3 blocks up the lane and
//     watches two bars: north and east, each against what the school needs.
//     North lands exactly; east overshoots by 1. Then the reader drags the
//     rickshaw back along the main road until east fits.

const WM_Y = 3;

function L_Bars({ north, east }: { north: number; east: number }) {
  const U = 20;
  const X0 = 40;
  const rows = [
    { name: "north", v: north, need: 3, fill: "fill-cat-coral" },
    { name: "east", v: east, need: 2, fill: "fill-cat-blue" },
  ];
  return (
    <svg viewBox="0 0 196 50" className="mx-auto block h-auto w-full max-w-[13rem]" role="img" aria-label={`north ${north} of 3, east ${east} of 2`}>
      {rows.map((r, i) => {
        const y = 4 + i * 24;
        const ok = r.v === r.need;
        return (
          <g key={r.name}>
            <text x={X0 - 5} y={y + 11} textAnchor="end" fontSize={10} fontWeight={600} className="fill-foreground">
              {r.name}
            </text>
            <rect x={X0} y={y} width={4 * U} height={15} rx={3} className="fill-foreground/5" />
            <rect
              x={X0}
              y={y}
              width={Math.min(r.v, r.need) * U}
              height={15}
              rx={3}
              className={`${r.fill} transition-[width] duration-300 motion-reduce:transition-none`}
            />
            <rect
              x={X0 + r.need * U}
              y={y}
              width={Math.max(0, r.v - r.need) * U}
              height={15}
              className="fill-danger transition-[width] duration-300 motion-reduce:transition-none"
            />
            <path d={`M${X0 + r.need * U} ${y - 2}V${y + 17}`} strokeWidth={1.6} strokeDasharray="2 2" className="stroke-foreground/70" />
            <text x={X0 + 4 * U + 6} y={y + 11} fontSize={9.5} className={ok ? "fill-accent-text font-bold" : "fill-muted"}>
              {r.v} · school {r.need}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function WhyMinus() {
  const pass = useGate();
  const [driven, setDriven] = useSeed("driven", false);
  const [x, setX] = useSeed("x", 3);
  const [fixed, setFixed] = useSeed("fixed", false);
  const play = usePlay(480);
  const lane = driven ? 3 : play.k;
  const pos: XY = driven ? [x, WM_Y] : [lane, lane];
  const trip = route([0, lane]);

  const drive = () => play.play(3, () => setDriven(true));
  const slide = (to: number) => {
    if (!driven || fixed) return;
    const nx = clamp(to, 0, 5);
    setX(nx);
    if (nx === SCHOOL[0]) {
      setFixed(true);
      pass("The lane pushes east too; −1 cuts it off.");
    }
  };
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowLeft") slide(x - 1);
    if (e.key === "ArrowRight") slide(x + 1);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[13rem]">
        <Plane
          f={M}
          grid={0}
          axes={false}
          label={`the rickshaw at ${tup(pos)}; drag it along the main road`}
          drag={driven && !fixed ? { down: (p) => slide(Math.round(p[0])), move: (p) => slide(Math.round(p[0])) } : undefined}
          onKey={driven && !fixed ? key : undefined}
          className="my-0! max-w-none"
        >
          <L_Roads f={M} />
          {driven && !fixed && <path d={`M${M.sx(0)} ${M.sy(WM_Y)}H${M.sx(5)}`} strokeWidth={7} strokeLinecap="round" className={`${FADE} pointer-events-none stroke-cat-blue/30`} />}
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" hit={fixed} />
          <L_Trail f={M} pts={trip} />
          {driven && x !== 3 && <Arrow f={M} from={[3, WM_Y]} to={[x, WM_Y]} tone="blue" w={2.4} />}
          <L_Rickshaw f={M} at={pos} facing={driven && x < 3 ? -1 : 1} ms={driven ? 200 : 450} />
        </Plane>
      </div>
      <div className="mt-2">
        <L_Bars north={lane} east={driven ? x : lane} />
      </div>
      {!driven && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={drive} disabled={play.running} className={primaryBtn}>
            Up the lane, 3 blocks
          </button>
        </div>
      )}
      {driven && !fixed && <div className={`${FADE} mt-1.5 text-center text-[0.95rem]`}>North fits. East is 1 too far. Drag the rickshaw along the main road.</div>}
      {fixed && (
        <div className={`${FADE} mt-1.5 text-center text-[0.95rem]`}>
          Card <L_CardText c={CARD} hit />: the lane for north, the minus for the extra east.
        </div>
      )}
      <Task done={fixed}>Send the rickshaw up the lane. Then drag it along the main road until east fits too.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the lane count is forced
//      by north. 2 lane blocks stop one short, 4 go one too high, 3 fit, and
//      then −1 on the main road trims the extra east.

const X3F = makeFrame(-1, 5, -1, 5, 17, 8);
const X3_SAY = [
  "Only the lane climbs north. So how many lane blocks?",
  "2 blocks: one short of north. And no road can add the missing one.",
  "4 blocks: one too high.",
  "3 blocks, exactly. Then −1 on the main road takes back the extra east.",
];

export function LaneForced() {
  const s = useScene(3, [600, 2000, 1800, 2400]);
  const k = s.k;
  const card: XY = k === 1 ? [0, 2] : k === 2 ? [0, 4] : k === 3 ? CARD : [0, 0];
  const trip = route(card);
  const end = trip[trip.length - 1];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <div className="mx-auto w-[9.5rem]">
        <Plane f={X3F} grid={0} axes={false} label="two, four and three blocks up the lane, against the school's row" className="my-0! max-w-none">
          <L_Roads f={X3F} />
          <path d={`M${X3F.sx(-1)} ${X3F.sy(3)}H${X3F.sx(5)}`} strokeWidth={1.2} strokeDasharray="3 3" className="pointer-events-none stroke-cat-violet" />
          <L_Home f={X3F} name={false} />
          <L_Place f={X3F} at={SCHOOL} kind="school" name={false} hit={k === 3} />
          <g key={k}>
            <L_Trail f={X3F} pts={trip} draw />
          </g>
          {(k === 1 || k === 2) && (
            <path
              d={`M${X3F.sx(end[0]) + 9} ${X3F.sy(end[1])}V${X3F.sy(3)}`}
              strokeWidth={2}
              className={`${FADE} pointer-events-none stroke-danger`}
              strokeDasharray="2 2"
            />
          )}
          <L_Rickshaw f={X3F} at={end} facing={faceOf(trip, trip.length - 1)} ms={600} s={0.85} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · On paper, slot by slot: a four-stage machine. Split the card sum into
//     an east line and a north line; the north line has only the lane in it,
//     so slanting = 3; carry it into the east line, straight = −1; check.
//     The small map draws each block as its number is found.

const PE_STAGE = ["Split it slot by slot", "Read the north slot", "Fill the east slot", "Check it"];

export function PeelEquations() {
  const pass = useGate();
  const [st, setSt] = useSeed("st", 0);
  const card: XY = [st >= 3 ? -1 : 0, st >= 2 ? 3 : 0];
  const trip = route(card);

  const next = () => {
    const n = st + 1;
    setSt(n);
    if (n === 4) pass("Slot 2 first, then fill slot 1.");
  };
  const row = (on: boolean) => `rounded-lg px-2 py-0.5 transition-colors duration-300 motion-reduce:transition-none ${on ? "bg-cat-violet/10" : ""}`;

  return (
    <>
      <div className="mx-auto w-full max-w-[10rem]">
        <Plane f={M} grid={0} axes={false} label={`the card so far ${tup(card)} drawn on the map`} className="my-0! max-w-none">
          <L_Roads f={M} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" hit={st >= 4} />
          <L_Trail f={M} pts={trip} draw />
        </Plane>
      </div>
      <div className="mt-2 space-y-0.5 text-center text-[0.95rem] tabular-nums">
        <div>
          (2, 3) = <span className="text-cat-blue">straight</span>·(1, 0) + <span className="text-cat-coral">slanting</span>·(1, 1)
        </div>
        {st >= 1 && (
          <div className={`${FADE} mx-auto grid max-w-xs grid-cols-[4.5rem_1fr] items-baseline text-left`}>
            <span className={`text-xs text-muted ${row(st === 3)}`}>east slot</span>
            <span className={row(st === 3)}>
              2 = <span className="text-cat-blue">straight</span> + <span className="text-cat-coral">{st >= 3 ? <b className={`${POP} inline-block`}>3</b> : "slanting"}</span>
            </span>
            <span className={`text-xs text-muted ${row(st === 2)}`}>north slot</span>
            <span className={row(st === 2)}>
              3 = <span className="text-cat-coral">slanting</span> <span className="text-xs text-muted">(straight adds no north)</span>
            </span>
          </div>
        )}
        {st >= 2 && (
          <div className={FADE}>
            <b className="text-cat-coral">slanting = 3</b>
            {st >= 3 && (
              <span className={FADE}>
                {" "}
                · <b className="text-cat-blue">straight = 2 − 3 = −1</b>
              </span>
            )}
          </div>
        )}
        {st >= 4 && (
          <div className={`${POP} font-semibold text-accent-text`}>
            −1·(1, 0) + 3·(1, 1) = (−1, 0) + (3, 3) = (2, 3)
          </div>
        )}
      </div>
      {st < 4 && (
        <div className="mt-2.5 flex justify-center">
          <button type="button" onClick={next} className={primaryBtn}>
            {st + 1} · {PE_STAGE[st]}
          </button>
        </div>
      )}
      <Task done={st >= 4}>Run the four steps and find the card without driving.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: why slot 2 first. Both
//      lines start with two unknowns; the main road's part of the north line
//      is struck out (it never goes north); one unknown is left, slanting = 3;
//      carried up, it leaves the east line one unknown too: straight = −1.

const X4_SAY = [
  "Two lines, and two unknowns in each? Not quite.",
  "The main road never goes north. So straight drops out of the north line.",
  "One unknown left there: slanting = 3.",
  "Carry the 3 up. Now the east line has one unknown too: straight = −1.",
];

function L_Box({ tone, value }: { tone: "blue" | "coral"; value: string | null }) {
  return (
    <span
      className={`inline-grid h-7 min-w-8 place-items-center rounded-md border-2 px-1 font-mono font-bold ${tone === "blue" ? "border-cat-blue text-cat-blue" : "border-cat-coral text-cat-coral"}`}
    >
      {value === null ? "" : <span className={`${POP} inline-block`}>{value}</span>}
    </span>
  );
}

export function PeelOrder() {
  const s = useScene(3, [600, 2200, 1800, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4_SAY[k]}</span>}>
      <div className="mx-auto grid w-fit grid-cols-[3.5rem_auto] items-center gap-x-2 gap-y-2 text-[1.05rem]">
        <span className="text-xs text-muted">east</span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono">2 =</span> <L_Box tone="blue" value={k >= 3 ? "−1" : null} /> + <L_Box tone="coral" value={k >= 3 ? "3" : null} />
        </span>
        <span className="text-xs text-muted">north</span>
        <span className="relative flex items-center gap-1.5">
          <span className="font-mono">3 =</span>
          <span className={`flex items-center gap-1.5 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-30" : ""}`}>
            <span className="font-mono text-sm">0·</span>
            <L_Box tone="blue" value={null} /> +
          </span>
          <L_Box tone="coral" value={k >= 2 ? "3" : null} />
          {k >= 1 && (
            <svg viewBox="0 0 60 20" className="pointer-events-none absolute top-1 left-7 h-5 w-[3.8rem]" aria-hidden="true">
              <Draw d="M2 16L58 4" strokeWidth={2.2} className="stroke-danger" />
            </svg>
          )}
        </span>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · Predict, then flip the grid. One arrow from home to the school; the
//     reader guesses whether it moves when the grid changes, then switches
//     between the map's square grid and the road grid. The grid cross-fades,
//     the arrow never moves, and its card flips between (2, 3) and (−1, 3).

const SS_GUESS = ["The arrow moves somewhere new", "The arrow stays; only its numbers change", "Nothing changes at all"];
const SS_RIGHT = 1;

export function SameSchool() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [grid, setGrid] = useSeed<"map" | "roads">("grid", "map");
  const [over, setOver] = useSeed("over", false);
  const roads = grid === "roads";

  const flip = (g: "map" | "roads") => {
    setGrid(g);
    if (g === "roads" && !over) {
      setOver(true);
      pass("The school didn't move. Only the grid did.");
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[11rem]">
        <Plane f={M} grid={0} axes={false} label={`the arrow from home to school, on the ${roads ? "road grid" : "map grid"}`} className="my-0! max-w-none">
          <L_Squares f={M} show={!roads} />
          <L_Roads f={M} show={roads} />
          <g style={{ opacity: roads ? 0 : 1 }} className="transition-opacity duration-700 motion-reduce:transition-none">
            <Arrow f={M} from={O} to={[1, 0]} tone="teal" w={2.4} />
            <Arrow f={M} from={O} to={[0, 1]} tone="teal" w={2.4} />
          </g>
          <g style={{ opacity: roads ? 1 : 0 }} className="transition-opacity duration-700 motion-reduce:transition-none">
            <Arrow f={M} from={O} to={[1, 0]} tone="blue" w={2.4} />
            <Arrow f={M} from={O} to={[1, 1]} tone="coral" w={2.4} />
          </g>
          <Arrow f={M} from={O} to={SCHOOL} tone="violet" w={3} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" />
        </Plane>
      </div>
      <div key={grid} className={`${FADE} mt-1 text-center text-[0.95rem]`}>
        {roads ? (
          <>
            Road grid: <L_CardText c={CARD} /> <span className="text-xs text-muted">straight, slanting</span>
          </>
        ) : (
          <>
            Map grid: <span className="font-mono font-bold text-cat-teal">(2, 3)</span> <span className="text-xs text-muted">east, north</span>
          </>
        )}
      </div>
      {guess !== null && (
        <div className={`${FADE} mt-2 flex justify-center gap-2`}>
          <button type="button" onClick={() => flip("map")} className={`${pill(!roads)} font-sans`}>
            Map grid
          </button>
          <button type="button" onClick={() => flip("roads")} className={`${pill(roads)} font-sans`}>
            Road grid
          </button>
        </div>
      )}
      <div className="mt-2.5 text-sm font-medium text-muted">When the grid changes, what happens to the arrow?</div>
      <div className="mt-1.5 grid gap-1.5">
        {SS_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, SS_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="text-[0.95rem]">{o}</span>
          </Choice>
        ))}
      </div>
      <Task done={over}>Guess first. Then switch to the road grid and watch the arrow.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: Fahim at two assembly
//      lines. Last year's line: he is the tallest, at the end. Today's line:
//      he stands in the middle. A dashed line at his height runs across both.

const X5_OLD: { who: "som" | "samin" | "rina" | "fahim"; x: number; s: number }[] = [
  { who: "som", x: 22, s: 0.78 },
  { who: "rina", x: 52, s: 0.84 },
  { who: "samin", x: 82, s: 0.9 },
  { who: "fahim", x: 114, s: 1 },
];
const X5_NEW: { who: "nasib" | "karim" | "fahim"; x: number; s: number }[] = [
  { who: "nasib", x: 206, s: 0.93 },
  { who: "fahim", x: 240, s: 1 },
  { who: "karim", x: 276, s: 1.14 },
];
const X5_SAY = [
  "Last year, at the old school's assembly, lined up by height. Fahim came last: the tallest.",
  "This morning, at the new school. Same Fahim, and now he's in the middle.",
  "His height didn't change. Not a hair. Only the line did.",
];

export function AssemblyLines() {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  const head = 150 - 63;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5_SAY[k]}</span>}>
      <div className="mx-auto max-w-[17rem] overflow-hidden rounded-xl">
        <Stage backdrop="field" label="two assembly lines by height: in last year's line Fahim is the tallest; in the new school's line he is in the middle">
          <text x={70} y={22} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0f1b2d">
            old school
          </text>
          <text x={242} y={22} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0f1b2d">
            new school
          </text>
          <path d="M160 34V150" stroke="white" strokeWidth={2} strokeDasharray="4 4" />
          {X5_OLD.map((p) => (
            <Person key={`o${p.who}`} who={p.who} x={p.x} y={150} scale={p.s} mood={p.who === "fahim" ? "happy" : "plain"} />
          ))}
          {k === 0 && (
            <g className={POP}>
              <path d={`M114 ${head - 16}v10`} stroke="#b45309" strokeWidth={2} />
              <path d={`M110 ${head - 10}l4 5l4 -5`} fill="none" stroke="#b45309" strokeWidth={2} />
              <text x={114} y={head - 19} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#b45309">
                tallest
              </text>
            </g>
          )}
          {X5_NEW.map((p) => (
            <Person key={`n${p.who}`} who={p.who} x={k >= 1 ? p.x : p.x + 150} y={150} scale={p.s} walking={k === 1} ms={1400} mood={p.who === "fahim" ? "puzzled" : "plain"} />
          ))}
          {k >= 1 && (
            <text x={240} y={head - 8} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#1d4ed8" className={FADE}>
              middle
            </text>
          )}
          {k >= 2 && <Draw d={`M10 ${head}H310`} strokeWidth={1.6} ms={900} className="stroke-[#7c3aed] [stroke-dasharray:6_4]" />}
        </Stage>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: back at the gate this
//      morning. Ammu holds up her afternoon list, the bazaar (4, 1) and the
//      mosque (0, 2), and the rickshaw mama wants a card for each.

export function AmmuErrands({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 2000]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="Ammu at the gate with her afternoon list: the bazaar at (4, 1) and the mosque at (0, 2), and the rickshaw mama asking for two cards">
        <Building x={4} y={150} w={56} h={112} color="#e7d7c1" />
        <Person who="ammu" x={84} y={150} arm={k >= 1 ? "hold" : "down"} mood="happy" />
        {k === 1 && <Bubble x={84} y={84} side="right" lines={["The bazaar for me,", "this afternoon."]} />}
        {k === 2 && <Bubble x={84} y={84} side="right" lines={["And the mosque", "for Abbu, at Asr."]} />}
        {k >= 1 && <L_NamedCard x={166} y={48} name="bazaar" text="(4, 1)" tone="amber" />}
        {k >= 2 && <L_NamedCard x={166} y={82} name="mosque" text="(0, 2)" tone="teal" />}
        <Person who="fahim" x={128} y={150} mood={k >= 3 ? "puzzled" : "plain"} />
        <L_BigRick x={250} y={150} />
        {k >= 3 && <Bubble x={270} y={86} side="left" lines={["A road card", "for each, please!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn. Ammu's two errands, both counted from home: the bazaar at
//     (4, 1) and the mosque at (0, 2). The reader dials a road card by hand,
//     then Mama drives it block by block. A wrong card drives to the wrong
//     corner and the Nope says which slot is off; wrong tries bounce.

const ERRANDS: { at: XY; kind: "bazaar" | "mosque" }[] = [
  { at: [4, 1], kind: "bazaar" },
  { at: [0, 2], kind: "mosque" },
];
const EF = makeFrame(-3, 6, -1, 4, 22, 10);

function clipTrip(pts: XY[]): { pts: XY[]; off: boolean } {
  const i = pts.findIndex((p) => !on(EF, p));
  return i < 0 ? { pts, off: false } : { pts: pts.slice(0, i), off: true };
}

export function YourErrand() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [card, setCard] = useSeed<number[]>("card", [0, 0]);
  const [driven, setDriven] = useSeed<number[] | null>("driven", null);
  const [solved, setSolved] = useSeed<boolean[]>("solved", [false, false]);
  const [miss, setMiss] = useState(0);
  const play = usePlay(320);
  const goal = ERRANDS[at];
  const trip = driven ? clipTrip(route(driven)) : null;
  const k = trip ? (play.running ? play.k : trip.pts.length - 1) : 0;
  const pos = trip ? trip.pts[k] : O;
  const end = trip && !play.running ? trip.pts[trip.pts.length - 1] : null;
  const right = !!trip && !!end && !trip.off && same(end, goal.at);

  const dial = (i: number, n: number) => {
    setCard(card.map((c, j) => (j === i ? n : c)));
    setDriven(null);
  };
  const drive = () => {
    const c = [...card];
    const t = clipTrip(route(c));
    const ok = !t.off && same(t.pts[t.pts.length - 1], goal.at);
    setDriven(c);
    const finish = () => {
      if (!ok) {
        setMiss((m) => m + 1);
        return;
      }
      const s = solved.map((v, j) => v || j === at);
      setSolved(s);
      if (s.every(Boolean)) pass("Bazaar (3, 1), mosque (−2, 2).");
    };
    if (t.pts.length > 1) play.play(t.pts.length - 1, finish);
    else finish();
  };
  const nextErrand = () => {
    setAt(1);
    setCard([0, 0]);
    setDriven(null);
  };

  const nope = () => {
    if (!trip || !end) return "";
    if (trip.off) return "That card drives Mama off the map. Try smaller numbers.";
    const where = `Mama stopped at ${tup(end)}. The ${goal.kind} is at ${tup(goal.at)}.`;
    return end[1] !== goal.at[1] ? `${where} North is off, so fix the slanting slot first.` : `${where} North is right. Now fix the straight slot.`;
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[13.5rem]">
        <Plane f={EF} grid={0} axes={false} label={`the rickshaw at ${tup(pos)}; the ${goal.kind} is at ${tup(goal.at)} on the map`} className="my-0! max-w-none">
          <L_Roads f={EF} />
          <L_Home f={EF} />
          {ERRANDS.map((e, i) => (
            <g key={e.kind} opacity={i === at || solved[i] ? 1 : 0.35}>
              <L_Place f={EF} at={e.at} kind={e.kind} hit={solved[i] && (i === at ? !play.running : true)} />
            </g>
          ))}
          {trip && <L_Trail f={EF} pts={trip.pts} upto={k} />}
          <L_Rickshaw f={EF} at={pos} facing={trip ? faceOf(trip.pts, k) : 1} />
        </Plane>
      </div>
      <div className="mt-1 text-center text-sm">
        The {goal.kind} on the map: <b className="font-mono">{tup(goal.at)}</b>
      </div>
      {!solved[at] ? (
        <>
          <div className="mt-1.5 flex items-center justify-center gap-1 font-mono text-lg">
            (<Stepper value={card[0]} onChange={(n) => dial(0, n)} min={-3} max={3} disabled={play.running} label="straight" />,
            <Stepper value={card[1]} onChange={(n) => dial(1, n)} min={-1} max={3} disabled={play.running} label="slanting" />)
          </div>
          <div className="mt-0.5 text-center text-xs">
            <span className="text-cat-blue">straight</span>, <span className="text-cat-coral">slanting</span>
          </div>
          <div className="mt-2 flex justify-center">
            <button type="button" onClick={drive} disabled={play.running} className={primaryBtn}>
              Mama, drive it
            </button>
          </div>
        </>
      ) : (
        <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>
          <L_CardText c={goal.at[1] === 1 ? [3, 1] : [-2, 2]} hit /> takes Mama to the {goal.kind}.
          {at === 0 && (
            <div className="mt-2 flex justify-center">
              <button type="button" onClick={nextErrand} className={primaryBtn}>
                Now the mosque
              </button>
            </div>
          )}
        </div>
      )}
      {end && !right && !play.running && <Nope key={miss}>{nope()}</Nope>}
      <Ticks
        items={[
          ["bazaar", solved[0]],
          ["mosque", solved[1]],
        ]}
      />
      <Task done={solved.every(Boolean)}>Work out each card slot by slot, dial it in, then let Mama drive it.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the mosque is straight
//      north of home, 2 blocks. Up the lane 2 blocks lands 2 too far east;
//      back 2 on the main road: card (−2, 2).

const X6F = makeFrame(-1, 3, -1, 3, 22, 10);
const X6_SAY = [
  "The mosque is straight north of home, 2 blocks. But there's no north road.",
  "Up the lane 2 blocks. North is right, but it's 2 blocks too far east.",
  "Back 2 on the main road. Card (−2, 2).",
];

export function MosqueMinus() {
  const s = useScene(2, [600, 2000, 2000]);
  const k = s.k;
  const trip = route([-2, 2]);
  const upto = k >= 2 ? 4 : k >= 1 ? 2 : 0;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={X6F} grid={0} axes={false} label="the mosque at (0, 2): two blocks up the lane, then two back" className="my-0! max-w-none">
            <L_Roads f={X6F} />
            <path d={`M${X6F.sx(0)} ${X6F.sy(0.3)}V${X6F.sy(1.7)}`} strokeWidth={1.6} strokeDasharray="3 3" className="pointer-events-none stroke-[#94a3b8]" />
            <L_Home f={X6F} name={false} />
            <L_Place f={X6F} at={[0, 2]} kind="mosque" name={false} hit={k >= 2} />
            <L_Trail f={X6F} pts={trip} upto={upto} draw />
            <L_Rickshaw f={X6F} at={trip[upto]} facing={faceOf(trip, upto)} ms={900} s={0.9} />
          </Plane>
        </div>
        <div className="font-mono text-2xl font-bold">
          (<span className="text-cat-blue">{k >= 2 ? <span className={`${POP} inline-block`}>−2</span> : "?"}</span>,{" "}
          <span className="text-cat-coral">{k >= 1 ? <span className={`${POP} inline-block`}>2</span> : "?"}</span>)
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: at the school gate, a few
//      minutes before the bell. Fahim pulls out 3.4's tape and wonders how far
//      the ride really was; then he's sure Pythagoras on the card will do.

export function TapeOut({}: Story) {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="at the school gate, Fahim pulls out his measuring tape and thinks about the card (−1, 3)">
        <Building x={20} y={150} w={136} h={96} color="#fecaca" />
        <Gate x={96} y={150} text="School" />
        <L_BigRick x={272} y={150} />
        <Person who="fahim" x={196} y={150} arm={k >= 1 ? "hold" : "down"} mood={k >= 2 ? "smug" : "plain"} />
        {k >= 1 && (
          <g className={POP}>
            <rect x={203} y={100} width={12} height={11} rx={2.5} fill="#facc15" stroke="#a16207" strokeWidth={1} />
            <circle cx={209} cy={105.5} r={2.4} fill="#a16207" />
            <Draw d="M215 108H246" strokeWidth={2.4} ms={900} className="stroke-[#eab308]" />
          </g>
        )}
        {k === 1 && <Bubble x={196} y={84} side="mid" tone="think" lines={["How far was that", "ride, really?"]} />}
        {k >= 2 && <Bubble x={196} y={84} side="mid" tone="think" lines={["Card (−1, 3).", "Pythagoras, easy!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · The trap. First Fahim's sum on the road card: √((−1)² + 3²) = 3.16,
//     line by line. Then the reader pulls the real tape from home to the
//     school on the map: 3.61. The two numbers don't agree.

const WT_SUM = ["√((−1)² + 3²)", "= √(1 + 9) = √10", "= 3.16 blocks"];

export function WrongTape() {
  const pass = useGate();
  const [summed, setSummed] = useSeed("summed", false);
  const [end, setEnd] = useSeed<XY>("end", O);
  const [measured, setMeasured] = useSeed("measured", false);
  const play = usePlay(650);
  const lines = summed ? 3 : play.k;
  const len = dist(O, end);

  const sum = () => play.play(3, () => setSummed(true));
  const pull = (p: XY) => {
    if (!summed || measured) return;
    const t: XY = [clamp(p[0], M.x0, M.x1), clamp(p[1], M.y0, M.y1)];
    if (dist(t, SCHOOL) < 0.45) {
      setEnd(SCHOOL);
      setMeasured(true);
      pass("Pythagoras needs square roads.");
    } else setEnd(t);
  };
  const key = () => pull(SCHOOL);
  const trip = route(CARD);

  return (
    <>
      <div className="mx-auto w-full max-w-[12.5rem]">
        <Plane
          f={M}
          grid={0}
          axes={false}
          label={`the tape from home, ${len.toFixed(2)} blocks long`}
          drag={summed && !measured ? { down: pull, move: pull } : undefined}
          onKey={summed && !measured ? key : undefined}
          className="my-0! max-w-none"
        >
          <L_Roads f={M} />
          <g opacity={0.45}>
            <L_Trail f={M} pts={trip} w={1.8} />
          </g>
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" hit={measured} />
          {len > 0.05 && (
            <>
              <path d={`M${M.sx(0)} ${M.sy(0)}L${M.sx(end[0])} ${M.sy(end[1])}`} strokeWidth={4.5} strokeLinecap="round" className="pointer-events-none stroke-[#eab308]" />
              <path d={`M${M.sx(0)} ${M.sy(0)}L${M.sx(end[0])} ${M.sy(end[1])}`} strokeWidth={4.5} strokeDasharray="1.2 5" className="pointer-events-none stroke-[#a16207]" />
              <circle cx={M.sx(end[0])} cy={M.sy(end[1])} r={4.5} className="pointer-events-none fill-[#facc15] stroke-[#a16207]" strokeWidth={1.2} />
            </>
          )}
          {summed && !measured && len < 0.05 && <circle cx={M.sx(0)} cy={M.sy(0)} r={11} strokeWidth={2} className={`${POP} pointer-events-none fill-none stroke-[#eab308]`} />}
        </Plane>
      </div>
      <div className="mx-auto mt-2 grid max-w-xs grid-cols-2 gap-2 text-center">
        <div className={`rounded-xl border px-2 py-1.5 ${measured ? "border-danger/50 bg-danger/5" : "border-border"}`}>
          <div className="text-xs text-muted">Fahim&apos;s sum</div>
          {WT_SUM.slice(0, lines).map((l, i) => (
            <div key={l} className={`${FADE} font-mono text-sm ${i === 2 ? "font-bold" : ""}`}>
              {l}
            </div>
          ))}
          {lines === 0 && <div className="font-mono text-sm text-muted">?</div>}
        </div>
        <div className={`rounded-xl border px-2 py-1.5 ${measured ? "border-accent bg-accent/10" : "border-border"}`}>
          <div className="text-xs text-muted">the real tape</div>
          <div className={`font-mono text-lg font-bold ${measured ? "text-accent-text" : ""}`}>{summed ? `${len.toFixed(2)}` : "?"}</div>
          <div className="text-xs text-muted">blocks</div>
        </div>
      </div>
      {!summed && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={sum} disabled={play.running} className={primaryBtn}>
            Work out Fahim&apos;s sum
          </button>
        </div>
      )}
      {measured && <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>3.16 and 3.61. Same ride, two answers. One of them is wrong.</div>}
      <Task done={measured}>{summed ? "Now drag the tape from home to the school." : "Work out Fahim's sum first."}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: two small maps, one
//      tape. On the square grid the legs 2 and 3 meet square, and Pythagoras
//      gives the tape's 3.61. On the road grid the corner isn't square and a
//      lane block is 1.41 long, so √(1² + 3²) = 3.16 misses.

const X7F = makeFrame(-1, 3.5, -0.5, 3.5, 20, 7);

function L_Tick({ x, y, ok }: { x: number; y: number; ok: boolean }) {
  return ok ? (
    <path d={`M${x - 4} ${y}l3 3.5l6 -7`} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={`${POP} fill-none stroke-[#15803d]`} />
  ) : (
    <path d={`M${x - 3.5} ${y - 3.5}l7 7m0 -7l-7 7`} strokeWidth={2.2} strokeLinecap="round" className={`${POP} fill-none stroke-[#dc2626]`} />
  );
}

const X7_SAY = [
  "Same school, same tape: 3.61 blocks.",
  "On the map grid the two legs, 2 and 3, meet square. Pythagoras gives 3.61. It matches.",
  "On the road grid the roads meet at a slant. Pythagoras says 3.16. Wrong.",
  "And one lane block isn't 1 long. It's 1.41.",
];

export function TwoTapes() {
  const s = useScene(3, [600, 2200, 2400, 2000]);
  const k = s.k;
  const tape = (
    <path d={`M${X7F.sx(0)} ${X7F.sy(0)}L${X7F.sx(2)} ${X7F.sy(3)}`} strokeWidth={3.5} strokeLinecap="round" className="pointer-events-none stroke-[#eab308]" />
  );

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X7_SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[17rem] justify-center gap-2">
        <div className="w-1/2 text-center">
          <Plane f={X7F} grid={0} axes={false} label="square grid: legs 2 and 3 meet at a right angle" className="my-0! max-w-none">
            <L_Squares f={X7F} />
            {tape}
            {k >= 1 && (
              <g className={FADE}>
                <Arrow f={X7F} from={O} to={[2, 0]} tone="teal" w={2} />
                <Arrow f={X7F} from={[2, 0]} to={[2, 3]} tone="teal" w={2} />
                <path d={`M${X7F.sx(2) - 7} ${X7F.sy(0)}v-7h7`} strokeWidth={1.2} className="pointer-events-none fill-none stroke-[#0f1b2d]" />
              </g>
            )}
            <L_Place f={X7F} at={SCHOOL} kind="school" name={false} />
          </Plane>
          <div className="mt-0.5 text-xs text-muted">map grid</div>
          <div className="flex h-5 items-center justify-center gap-1 font-mono text-[0.68rem] whitespace-nowrap">
            {k >= 1 && (
              <>
                <span className={FADE}>√(2² + 3²) = 3.61</span>
                <svg viewBox="-6 -6 12 12" className="h-3 w-3 shrink-0" aria-hidden="true">
                  <L_Tick x={0} y={0} ok />
                </svg>
              </>
            )}
          </div>
        </div>
        <div className="w-1/2 text-center">
          <Plane f={X7F} grid={0} axes={false} label="road grid: three lane blocks and one back; the corner is not square" className="my-0! max-w-none">
            <L_Roads f={X7F} w={2.6} />
            {tape}
            {k >= 2 && (
              <g className={FADE}>
                <L_Trail f={X7F} pts={route(CARD)} w={2} />
              </g>
            )}
            <L_Place f={X7F} at={SCHOOL} kind="school" name={false} />
            {k >= 2 && (
              <path
                d={`M${X7F.sx(0) + 13} ${X7F.sy(0)}A13 13 0 0 0 ${X7F.sx(0) + 9.2} ${X7F.sy(0) - 9.2}`}
                strokeWidth={2}
                className={`${POP} pointer-events-none fill-none stroke-[#7c3aed]`}
              />
            )}
            {k >= 3 &&
              [0, 1, 2].map((i) => (
                <text key={i} x={X7F.sx(i + 0.5) - 5} y={X7F.sy(i + 0.5) - 3} textAnchor="end" fontSize={7} fontWeight={700} fill="#be123c" stroke="white" strokeWidth={2} paintOrder="stroke" className={POP}>
                  1.41
                </text>
              ))}
          </Plane>
          <div className="mt-0.5 text-xs text-muted">road grid</div>
          <div className="flex h-5 items-center justify-center gap-1 font-mono text-[0.68rem] whitespace-nowrap">
            {k >= 2 && (
              <>
                <span className={FADE}>√(1² + 3²) = 3.16</span>
                <svg viewBox="-6 -6 12 12" className="h-3 w-3 shrink-0" aria-hidden="true">
                  <L_Tick x={0} y={0} ok={false} />
                </svg>
              </>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A figure for screen 7's side quest, no task: on square roads, 1 block
//      long, the card needs no solving. Light the school's arrow onto each
//      road, as 4.3's torches did: the shadows are 2 and 3, the card itself.

const X8F = makeFrame(-0.5, 3.5, -0.5, 3.5, 24, 10);
const X8_SAY = [
  "Square roads, each block 1 long: the map's own grid.",
  "Shine a torch down on the east road. The shadow is 2 blocks.",
  "Shine one across onto the north road. The shadow is 3 blocks.",
  "The shadows are the card. On slanted roads they aren't. There you solve.",
];

export function ShadowRoads() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const f = X8F;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X8_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={f} grid={0} axes={false} label="the school's arrow on square roads, with its shadows 2 and 3 on the two roads" className="my-0! max-w-none">
            <L_Roads f={f} kind="square" w={2.6} />
            {k >= 1 && (
              <g className={FADE}>
                <path d={`M${f.sx(2)} ${f.sy(3)}V${f.sy(0)}`} strokeWidth={1.2} strokeDasharray="3 3" className="pointer-events-none stroke-[#d97706]" />
                <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(2)}`} strokeWidth={6} strokeLinecap="round" className="pointer-events-none stroke-[#0f1b2d]/55" />
              </g>
            )}
            {k >= 2 && (
              <g className={FADE}>
                <path d={`M${f.sx(2)} ${f.sy(3)}H${f.sx(0)}`} strokeWidth={1.2} strokeDasharray="3 3" className="pointer-events-none stroke-[#d97706]" />
                <path d={`M${f.sx(0)} ${f.sy(0)}V${f.sy(3)}`} strokeWidth={6} strokeLinecap="round" className="pointer-events-none stroke-[#0f1b2d]/55" />
              </g>
            )}
            <Arrow f={f} from={O} to={SCHOOL} tone="violet" w={2.6} />
            <L_Home f={f} name={false} />
          </Plane>
        </div>
        <div className="font-mono text-2xl font-bold">
          (<span className="text-cat-teal">{k >= 1 ? <span className={`${POP} inline-block`}>2</span> : "?"}</span>,{" "}
          <span className="text-cat-teal">{k >= 2 ? <span className={`${POP} inline-block`}>3</span> : "?"}</span>)
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it: three road maps as pictures, slanted roads · two parallel roads
//     · square roads. The reader taps every map that can take a rickshaw
//     anywhere, then sends the rickshaws. The parallel one runs along its one
//     line and never reaches the school; a missed good map drives there
//     anyway. Wrong tries bounce.

const TF = makeFrame(-1, 4, -1, 4, 14, 6);
const TW: { kind: RoadKind; name: string; keys: [XY, XY]; trip: XY[]; reach: boolean }[] = [
  { kind: "slant", name: "slanted roads", keys: [[1, 0], [1, 1]], trip: route(CARD), reach: true },
  { kind: "twin", name: "two parallel roads", keys: [[1, 1], [2, 2]], trip: [O, [1, 1], [2, 2], [3, 3]], reach: false },
  {
    kind: "square",
    name: "square roads",
    keys: [[1, 0], [0, 1]],
    trip: [O, [1, 0], [2, 0], [2, 1], [2, 2], [2, 3]],
    reach: true,
  },
];
const TW_RIGHT = [0, 2];

function L_Mini({ i, k, show, paint = false }: { i: number; k: number; show: boolean; paint?: boolean }) {
  const m = TW[i];
  const t = Math.min(k, m.trip.length - 1);
  const end = m.trip[t];
  const lo = Math.max(TF.x0, TF.y0);
  const hi = Math.min(TF.x1, TF.y1);
  return (
    <Plane f={TF} grid={0} axes={false} label={`${m.name}${paint ? (m.reach ? ": they reach everywhere" : ": they reach only one line") : ""}`} className="my-0! max-w-none">
      {paint &&
        (m.reach ? (
          <rect x={TF.sx(TF.x0)} y={TF.sy(TF.y1)} width={(TF.x1 - TF.x0) * TF.u} height={(TF.y1 - TF.y0) * TF.u} className={`${FADE} fill-cat-violet/20`} />
        ) : (
          <path d={`M${TF.sx(lo)} ${TF.sy(lo)}L${TF.sx(hi)} ${TF.sy(hi)}`} strokeWidth={11} className={`${FADE} fill-none stroke-cat-violet/30`} />
        ))}
      <L_Roads f={TF} kind={m.kind} w={2.4} />
      <Arrow f={TF} from={O} to={m.keys[1]} tone="coral" w={2} />
      <Arrow f={TF} from={O} to={m.keys[0]} tone="blue" w={2} />
      <L_Place f={TF} at={SCHOOL} kind="school" name={false} hit={show && !paint && same(end, SCHOOL)} />
      {show && !paint && <L_Trail f={TF} pts={m.trip} upto={t} w={1.6} />}
      {show && !paint && <L_Rickshaw f={TF} at={end} s={0.6} facing={faceOf(m.trip, t)} ms={260} />}
      {show && !paint && !m.reach && t === m.trip.length - 1 && (
        <path d={`M${TF.sx(3) + 5} ${TF.sy(3) - 12}l7 7m0 -7l-7 7`} strokeWidth={2} strokeLinecap="round" className={`${POP} fill-none stroke-danger`} />
      )}
      <L_Home f={TF} name={false} />
    </Plane>
  );
}

export function TryWhichGrid() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<number[]>("picks", []);
  const [checked, setChecked] = useSeed("checked", false);
  const [miss, setMiss] = useState(0);
  const play = usePlay(260);
  const right = picks.length === 2 && TW_RIGHT.every((i) => picks.includes(i));
  const k = play.running ? play.k : 9;
  const settled = checked && !play.running;
  const shown = (i: number) => checked && (picks.includes(i) || TW[i].reach);

  const toggle = (i: number) => {
    if (play.running) return;
    setChecked(false);
    setPicks(picks.includes(i) ? picks.filter((p) => p !== i) : [...picks, i].sort());
  };
  const send = () => {
    const ok = right;
    setChecked(true);
    play.play(5, () => (ok ? pass("Any two non-parallel roads make a basis.") : setMiss((m) => m + 1)));
  };
  const look = (i: number): Look => {
    if (!settled) return picks.includes(i) ? "picked" : "idle";
    if (picks.includes(i)) return TW[i].reach ? "right" : "wrong";
    return TW[i].reach ? "wrong" : "dim";
  };
  const nope = [
    picks.includes(1) && "On the parallel roads the rickshaw only runs along one line. The school isn't on it.",
    !picks.includes(0) && "You left out the slanted roads. They took Fahim to school this morning.",
    !picks.includes(2) && "You left out the square roads: plain east and north. They reach everywhere too.",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {TW.map((m, i) => (
          <button
            key={m.name}
            type="button"
            onClick={() => toggle(i)}
            aria-pressed={picks.includes(i)}
            className={`cursor-pointer rounded-xl border-2 p-1 text-center transition-[border-color,background-color,opacity] duration-200 ${LOOK[look(i)]}`}
          >
            <L_Mini i={i} k={k} show={shown(i)} />
            <div className="mt-0.5 text-xs leading-tight font-semibold">{m.name}</div>
          </button>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-muted">Home is the house. The school is at (2, 3) on every map.</div>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={send} disabled={!picks.length || play.running || (settled && right)} className={primaryBtn}>
          Send the rickshaws
        </button>
      </div>
      {settled && !right && <Nope key={miss}>{nope}</Nope>}
      {settled && right && <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>Both reach the school. And from there, anywhere.</div>}
      <Task done={settled && right}>Tap every map where a rickshaw can get anywhere, then send the rickshaws.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for the exercise's explanation, no task: each map's reach,
//      painted. The slanted roads paint the whole map, the square roads too;
//      the parallel roads paint one line, and the school is off it.

const X9_SAY = [
  "Three maps. Paint everywhere each one can reach.",
  "Slanted roads: the whole map.",
  "Square roads: the whole map too.",
  "Parallel roads: one line. The school is off it.",
];

export function ReachPaint() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const order = [0, 2, 1];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X9_SAY[k]}</span>}>
      <div className="mx-auto grid max-w-[17rem] grid-cols-3 gap-1.5">
        {TW.map((m, i) => (
          <div key={m.name} className="text-center">
            <L_Mini i={i} k={0} show={false} paint={k > order.indexOf(i)} />
            <div className="text-[0.7rem] leading-tight text-muted">{m.name}</div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for the finale's setup, no task: the rickshaw pulls up
//      at the school gate, Fahim jumps down and runs in, the bell rings.

export function BellRings({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="the rickshaw pulls up at the school gate, Fahim runs in, and the school bell rings">
        <Building x={150} y={150} w={166} h={100} color="#fecaca" />
        <Gate x={206} y={150} text="School" />
        <g className="pointer-events-none">
          <path d="M268 50V58" stroke="#57534e" strokeWidth={1.6} />
          <path d="M261 72Q261 58 268 58Q275 58 275 72Z" fill="#d97706" stroke="#92400e" strokeWidth={1} />
          <circle cx={268} cy={74} r={2} fill="#92400e" />
          {k >= 3 && (
            <g className={POP}>
              <path d="M255 60l-6 -4M254 68h-8M281 60l6 -4M282 68h8" stroke="#b45309" strokeWidth={1.8} strokeLinecap="round" />
            </g>
          )}
        </g>
        <L_BigRick x={k >= 1 ? 96 : -70} y={150} />
        {k >= 1 && <Person who="fahim" x={k >= 2 ? 214 : 130} y={150} walking={k === 2} ms={1300} mood={k >= 3 ? "happy" : "plain"} />}
        {k >= 3 && <Bubble x={116} y={86} side="right" lines={["Just in time!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9 · The finale. The four sealed cards, and Mama drives each one on the
//     road grid: (2, 3) ends at (5, 3), (2, 1) at (3, 1), (−1, 3) at the
//     school, and "can't get there" is answered by this morning's ride.

const BO_CARDS: XY[] = [
  [2, 3],
  [2, 1],
  [-1, 3],
  [-1, 3],
];
const BO_SAY = [
  "(2, 3) are the map's numbers, read on the roads. Mama ends up at (5, 3), 3 blocks past the school.",
  "(2, 1) ends at (3, 1). Wrong street altogether.",
  "(−1, 3) ends right at the school gate.",
  "“Can't get there”? Mama got there this morning, with (−1, 3). No north road doesn't mean no way north.",
];

export function BetOpened() {
  const pass = useGate();
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const play = usePlay(300);
  const trip = pick === null ? [O] : route(BO_CARDS[pick]);
  const k = play.running ? play.k : trip.length - 1;
  const end = trip[k];

  const drive = (i: number) => {
    if (play.running) return;
    setPick(i);
    const next = tried.includes(i) ? tried : [...tried, i];
    play.play(route(BO_CARDS[i]).length - 1, () => {
      setTried(next);
      if (next.length === 4 && tried.length < 4) pass("The bet: (−1, 3) wins.");
    });
  };
  const look = (i: number): Look => (!tried.includes(i) ? (pick === i ? "picked" : "idle") : i === 2 ? "right" : "wrong");

  return (
    <>
      <div className="mx-auto w-full max-w-[12.5rem]">
        <Plane f={M} grid={0} axes={false} label={pick === null ? "the road map, the rickshaw at home" : `card ${BET[pick]}: the rickshaw at ${tup(end)}`} className="my-0! max-w-none">
          <L_Roads f={M} />
          <L_Home f={M} />
          <L_Place f={M} at={SCHOOL} kind="school" hit={!play.running && pick !== null && same(end, SCHOOL)} />
          <L_Trail f={M} pts={trip} upto={k} />
          <L_Rickshaw f={M} at={end} facing={faceOf(trip, k)} />
        </Plane>
      </div>
      <div className="mt-1 min-h-10 text-center text-[0.95rem]">
        {pick !== null && !play.running && tried.includes(pick) ? (
          <span key={pick} className={FADE}>
            {BO_SAY[pick]}
          </span>
        ) : (
          <span className="text-muted">Tap a card, and Mama drives it on the roads.</span>
        )}
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {BET.map((b, i) => (
          <Choice key={b} n={i} look={look(i)} disabled={play.running} onClick={() => drive(i)}>
            <span className={i < 3 ? "font-mono" : "text-sm"}>{b}</span>
          </Choice>
        ))}
      </div>
      <Task done={tried.length === 4}>Open the bet: let Mama drive all four cards.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for the finale's explanation, no task: the card named with
//      its grid. The arrow v alone; on the map grid (e₁, e₂) its card is
//      (2, 3); on the road grid B = {w, z} it is (−1, 3), written [v]_B.

const XAF = makeFrame(-1, 4, -1, 4, 20, 8);
const XA_SAY = [
  "The arrow from home to the school. Call it v.",
  "On the map grid, e₁ and e₂, its card is (2, 3).",
  "On the road grid, w = (1, 0) and z = (1, 1), its card is (−1, 3).",
  "One arrow, two cards. A card means nothing without its grid.",
];

export function NameTheCard() {
  const s = useScene(3, [600, 1800, 2200, 2200]);
  const k = s.k;
  const roads = k >= 2;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{XA_SAY[k]}</span>}>
      <div className="mx-auto flex items-center justify-center gap-3">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={XAF} grid={0} axes={false} label="the arrow v from home to school, on the map grid and then on the road grid" className="my-0! max-w-none">
            <L_Squares f={XAF} show={k === 1} />
            <L_Roads f={XAF} show={roads} w={2.6} />
            {k === 1 && (
              <g className={FADE}>
                <Arrow f={XAF} from={O} to={[1, 0]} tone="teal" w={2.2} />
                <Arrow f={XAF} from={O} to={[0, 1]} tone="teal" w={2.2} />
              </g>
            )}
            {roads && (
              <g className={FADE}>
                <Arrow f={XAF} from={O} to={[1, 0]} tone="blue" w={2.2} />
                <Arrow f={XAF} from={O} to={[1, 1]} tone="coral" w={2.2} />
              </g>
            )}
            <Arrow f={XAF} from={O} to={SCHOOL} tone="violet" w={2.8} />
            <Label f={XAF} at={[1, 1.5]} dx={-7} size={10} className="fill-cat-violet font-mono">
              v
            </Label>
            <L_Home f={XAF} name={false} />
          </Plane>
        </div>
        <div className="min-w-0 space-y-1.5 text-left">
          {k >= 1 && (
            <div className={`${FADE} ${k === 2 ? "opacity-50" : ""}`}>
              <div className="text-xs text-muted">map grid</div>
              <div className="font-mono text-base font-bold text-cat-teal">v = (2, 3)</div>
            </div>
          )}
          {k >= 2 && (
            <div className={FADE}>
              <div className="text-xs text-muted">road grid B = &#x7B;w, z&#x7D;</div>
              <div className="font-mono text-base font-bold text-cat-violet">
                [v]<sub>B</sub> = (−1, 3)
              </div>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  FirstDay: { start: { k: 0 }, ammu: { k: 1 }, card: { k: 2 }, end: {} },
  SchoolBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 3, sealed: true } },
  TwoGrids: { start: { k: 0 }, main: { k: 1 }, lanes: { k: 2 }, end: {} },
  NoNorthRoad: { start: {}, lane: { amt: [0, 3] }, done: { amt: [-1, 3], done: true } },
  CardFills: { start: { k: 0 }, lane: { k: 1 }, back: { k: 2 }, end: {} },
  WhyMinus: { start: {}, driven: { driven: true }, fixed: { driven: true, x: 2, fixed: true } },
  LaneForced: { start: { k: 0 }, two: { k: 1 }, four: { k: 2 }, end: {} },
  PeelEquations: { start: {}, split: { st: 1 }, north: { st: 2 }, east: { st: 3 }, done: { st: 4 } },
  PeelOrder: { start: { k: 0 }, strike: { k: 1 }, three: { k: 2 }, end: {} },
  SameSchool: { start: {}, guessed: { guess: 0 }, roads: { guess: 0, grid: "roads", over: true } },
  AssemblyLines: { start: { k: 0 }, new: { k: 1 }, end: {} },
  AmmuErrands: { start: { k: 0 }, bazaar: { k: 1 }, mosque: { k: 2 }, end: {} },
  YourErrand: {
    start: {},
    wrong: { card: [4, 1], driven: [4, 1] },
    bazaar: { card: [3, 1], driven: [3, 1], solved: [true, false] },
    mosqueWrong: { at: 1, card: [0, 2], driven: [0, 2], solved: [true, false] },
    done: { at: 1, card: [-2, 2], driven: [-2, 2], solved: [true, true] },
  },
  MosqueMinus: { start: { k: 0 }, lane: { k: 1 }, end: {} },
  TapeOut: { start: { k: 0 }, tape: { k: 1 }, end: {} },
  WrongTape: { start: {}, summed: { summed: true }, pulling: { summed: true, end: [1.4, 2.2] }, done: { summed: true, end: [2, 3], measured: true } },
  TwoTapes: { start: { k: 0 }, square: { k: 1 }, road: { k: 2 }, end: {} },
  ShadowRoads: { start: { k: 0 }, east: { k: 1 }, end: {} },
  TryWhichGrid: { start: {}, picked: { picks: [0, 1] }, wrong: { picks: [1, 2], checked: true }, missed: { picks: [2], checked: true }, right: { picks: [0, 2], checked: true } },
  ReachPaint: { start: { k: 0 }, slant: { k: 1 }, end: {} },
  BellRings: { start: { k: 0 }, arrive: { k: 1 }, run: { k: 2 }, end: {} },
  BetOpened: { start: {}, first: { pick: 0, tried: [0] }, right: { pick: 2, tried: [0, 2] }, done: { pick: 3, tried: [0, 1, 2, 3] } },
  NameTheCard: { start: { k: 0 }, map: { k: 1 }, roads: { k: 2 }, end: {} },
};
