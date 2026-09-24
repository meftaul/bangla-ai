"use client";

import { useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  Draw,
  FADE,
  Nope,
  POP,
  Scene,
  Speech,
  Stepper,
  Ticks,
  predictLook,
  primaryBtn,
  quietBtn,
  usePlay,
  useScene,
  useSeed,
  type Fixtures,
} from "@/components/journey/kit";
import { Bubble, Card, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Label, Plane, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { Shiku } from "@/components/interactive/arrow-journey";

// Screens for "Calculus for AI 1.1 — Two dots and a straight road"
// (src/content/articles/calculus_for_ai/01a_bee_route.mdx; the plan is in
// 00_book_journey_map.md, journey 1.1).
//
// The spine: a bee flies straight from Moumachi Nana's box (1, 1) past the
// scarecrow (3, 5). Nana wants a water dish where the bee crosses the bamboo
// fence at column 9, and Samin's page stops at column 6. The reader seals a
// bet (FenceBet) and only answers it on screen 6 (FenceTurn), after finding
// the tilt: walk the grid from box to scarecrow (2 across, 4 up), climb it one
// column at a time (always 2 up: the slope), check that any two dots on the
// road give the same 2, and learn that the up alone doesn't say steepness.
// Then a new case at Karim's pond, and the dish goes on the fence.
//
// Screens 1a, 5a, 7a are watch-only story scenes for the setup words; 3½, 4½,
// 5½, 6½, 7½ are the watch-only figures inside the <Then> explanations.
//
// The road is y = 2x − 1 throughout. Tailwind only; drawn things are fixed ink.

type Story = { story?: boolean };

const ROAD = (x: number) => 2 * x - 1;
const BOX: XY = [1, 1];
const CROW: XY = [3, 5];
const FENCE = 9;
const FENCE_ROW = ROAD(FENCE); // 17

const AMBER = "#f59e0b";
const INK = "#0f1b2d";
const ROAD_CLS = "stroke-cat-amber";

// ---------------------------------------------------------------------------
// Small drawn things, in SVG units.

/** A honey bee, centred at (x, y). */
function Bee({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} className="pointer-events-none">
      <ellipse cx={-1} cy={-5} rx={3.2} ry={2.4} fill="white" stroke="#94a3b8" strokeWidth={0.5} opacity={0.95} />
      <ellipse cx={2.2} cy={-5.2} rx={2.8} ry={2.1} fill="white" stroke="#94a3b8" strokeWidth={0.5} opacity={0.95} />
      <ellipse cx={0} cy={0} rx={5.2} ry={3.4} fill="#facc15" stroke="#a16207" strokeWidth={0.6} />
      <path d="M-1.6 -3.2v6.4M1.4 -3.3v6.6" stroke={INK} strokeWidth={1.3} />
      <circle cx={5.2} cy={-0.4} r={1.9} fill={INK} />
    </g>
  );
}

/** Nana's honey box on its stand, bottom-centre at (x, y), in SVG units. */
function HiveBox({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-9 0v-6M9 0v-6" stroke="#78350f" strokeWidth={1.6} />
      <rect x={-11} y={-20} width={22} height={14} rx={1.5} fill="#d97706" stroke="#92400e" strokeWidth={0.8} />
      <path d="M-11 -13h22" stroke="#92400e" strokeWidth={0.7} />
      <rect x={-13} y={-23} width={26} height={3.5} rx={1} fill="#92400e" />
      <rect x={-3} y={-8.5} width={6} height={1.8} rx={0.8} fill={INK} />
    </g>
  );
}

/** A water dish (a clay bowl), bottom-centre at (x, y). */
function Dish({ x, y, s = 1, glow = false }: { x: number; y: number; s?: number; glow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      {glow && <circle cy={-3} r={10} className={`fill-accent/25 ${POP}`} />}
      <path d="M-8 -5h16q-1 5 -8 5t-8 -5Z" fill="#b45309" stroke="#78350f" strokeWidth={0.7} />
      <ellipse cy={-5} rx={8} ry={1.8} fill="#38bdf8" stroke="#78350f" strokeWidth={0.7} />
    </g>
  );
}

/** A scarecrow on the stage, feet at (x, y). */
function Scarecrow({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x} ${y}V${y - 52}M${x - 16} ${y - 38}H${x + 16}`} stroke="#78350f" strokeWidth={2.4} />
      <path d={`M${x - 7} ${y - 40}h14l-2 16h-10Z`} fill="#ea580c" />
      <circle cx={x} cy={y - 47} r={6} fill="#fde68a" stroke="#a16207" strokeWidth={0.8} />
      <path d={`M${x - 10} ${y - 51}h20l-5 -6h-10Z`} fill="#a16207" />
    </g>
  );
}

/** Mustard in flower along the bottom of the stage. */
function Mustard({ from = 0, to = 320 }: { from?: number; to?: number }) {
  const n = Math.floor((to - from) / 9);
  return (
    <g className="pointer-events-none">
      {Array.from({ length: n }, (_, i) => {
        const x = from + 4 + i * 9;
        const y = 158 + ((i * 7) % 3) * 5;
        return (
          <g key={i}>
            <path d={`M${x} ${y + 8}V${y}`} stroke="#4d7c0f" strokeWidth={1} />
            <circle cx={x} cy={y} r={2.6} fill="#facc15" />
          </g>
        );
      })}
    </g>
  );
}

/** A bamboo fence, its posts from x0 to x1, standing on y. */
function Fence({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  const posts = Array.from({ length: Math.floor((x1 - x0) / 8) + 1 }, (_, i) => x0 + i * 8);
  return (
    <g className="pointer-events-none">
      {posts.map((x) => (
        <path key={x} d={`M${x} ${y}V${y - 34}`} stroke="#a16207" strokeWidth={2.2} />
      ))}
      <path d={`M${x0 - 3} ${y - 26}H${x1 + 3}M${x0 - 3} ${y - 13}H${x1 + 3}`} stroke="#ca8a04" strokeWidth={1.6} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Samin's page: the khata's graph paper, one square a metre. The bee's road is
// drawn amber; the box and the scarecrow are the two dots.

const PAGE = makeFrame(0, 6, 0, 10, 24);

function Sheet({ f, label, w = "max-w-[10rem]", drag, children }: { f: Frame; label: string; w?: string; drag?: Parameters<typeof Plane>[0]["drag"]; children: ReactNode }) {
  return (
    <div className={`mx-auto w-full ${w}`}>
      <Plane f={f} label={label} ticks={1} drag={drag} className="my-0! max-w-none">
        {children}
      </Plane>
    </div>
  );
}

/** The bee's road on a frame, between two x's; dashed where nobody saw it. */
function Road({ f, x0, x1, slope = 2, start = -1, dashed = false, draw = false, cls = ROAD_CLS }: { f: Frame; x0: number; x1: number; slope?: number; start?: number; dashed?: boolean; draw?: boolean; cls?: string }) {
  const d = `M${f.sx(x0)} ${f.sy(slope * x0 + start)}L${f.sx(x1)} ${f.sy(slope * x1 + start)}`;
  if (draw) return <Draw d={d} strokeWidth={2.6} ms={900} className={cls} />;
  return <path d={d} strokeWidth={2.6} strokeLinecap="round" strokeDasharray={dashed ? "5 5" : undefined} className={`pointer-events-none fill-none ${cls}`} />;
}

/** The box at (1, 1) and the scarecrow at (3, 5), as labelled dots. */
function BoxAndCrow({ f }: { f: Frame }) {
  return (
    <>
      <HiveBox x={f.sx(BOX[0])} y={f.sy(BOX[1]) + 6} s={0.55} />
      <circle cx={f.sx(BOX[0])} cy={f.sy(BOX[1])} r={3.6} fill={INK} className="pointer-events-none" />
      <Label f={f} at={BOX} dx={7} dy={4} anchor="start" size={9}>
        box
      </Label>
      <circle cx={f.sx(CROW[0])} cy={f.sy(CROW[1])} r={3.6} fill={INK} className="pointer-events-none" />
      <Label f={f} at={CROW} dx={7} dy={4} anchor="start" size={9}>
        scarecrow
      </Label>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1a · The story scene for screen 1: Nana's box in the mustard field, a bee
// flying straight out past the scarecrow, Samin's two dots, Nana's wish for a
// water dish on the far fence, and Nasib's quick answer. No answer shown.

export function BoxToFence({}: Story) {
  const s = useScene(5, [600, 1500, 2200, 2400, 2400]);
  const k = s.k;
  const bee: XY = k === 0 ? [44, 112] : k === 1 ? [112, 86] : k === 2 ? [150, 70] : [340, 6];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="Nana's honey box in a mustard field. A bee flies straight out past a scarecrow, towards a bamboo fence far away.">
        <Mustard />
        <Fence x0={282} x1={314} y={152} />
        <HiveBox x={40} y={150} />
        <Scarecrow x={150} y={150} />
        {k >= 1 && k <= 2 && <path d="M44 124L150 72" stroke={AMBER} strokeWidth={1.4} strokeDasharray="3 3" className={FADE} />}
        <g style={{ transform: `translate(${bee[0]}px, ${bee[1]}px)` }} className="transition-transform duration-[1300ms] ease-in-out motion-reduce:transition-none">
          <Bee x={0} y={0} s={1.2} />
        </g>
        <Person who="nana" x={76} y={150} arm={k === 3 ? "point" : "down"} mood={k === 3 ? "plain" : "happy"} />
        <Person who="samin" x={k >= 2 ? 196 : 380} y={150} facing={-1} walking={k === 2} arm={k === 2 ? "hold" : "down"} />
        {k === 2 && (
          <>
            <Card x={40} y={92} text="(1, 1)" tone="amber" />
            <Card x={150} y={76} text="(3, 5)" tone="amber" />
          </>
        )}
        {k === 3 && <Bubble x={76} y={84} side="right" lines={["A water dish where", "it crosses the fence!"]} />}
        <Person who="nasib" x={k >= 4 ? 250 : 380} y={150} facing={-1} walking={k === 4} mood="smug" arm={k === 4 ? "wave" : "down"} />
        {k === 4 && <Bubble x={250} y={84} side="left" lines={["Easy. Row 9!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Samin's page shows the box, the scarecrow and the bit of
// road between them; the fence is 3 columns past the page's edge. Unmarked.

const BET = ["Row 9, like Nasib says.", "Row 29.", "Row 17."];

export function FenceBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const f = makeFrame(0, 6, 0, 6, 24);
  return (
    <>
      <Sheet f={f} label="Samin's page: the box at (1, 1), the scarecrow at (3, 5), and the bee's road between them." w="max-w-[11rem]">
        <Road f={f} x0={BOX[0]} x1={CROW[0]} />
        <BoxAndCrow f={f} />
        <Bee x={f.sx(CROW[0]) + 10} y={f.sy(CROW[1]) - 10} s={0.9} />
      </Sheet>
      <div className="mt-2 text-center text-sm text-muted">Samin&apos;s page stops at column 6. The fence is at column&nbsp;9.</div>
      <div className="mt-3 grid gap-2">
        {BET.map((o, i) => (
          <Choice
            key={o}
            n={i}
            look={bet === i ? "picked" : bet !== null ? "dim" : "idle"}
            disabled={bet !== null}
            onClick={() => {
              setBet(i);
              pass("Bet sealed. We'll check it at the fence.");
            }}
          >
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>Pick the row where you think the bee crosses the fence.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The simplest case by hand: Shiku can't fly, so it walks the grid lines
// from the box to the scarecrow, across or up. Overshooting stops it.

type Move = "a" | "u";

export function WalkToCrow() {
  const pass = useGate();
  const [moves, setMoves] = useSeed<Move[]>("moves", []);
  const f = makeFrame(0, 5, 0, 7, 24);
  const across = moves.filter((m) => m === "a").length;
  const up = moves.filter((m) => m === "u").length;
  const at: XY = [BOX[0] + across, BOX[1] + up];
  const past = at[0] > CROW[0] || at[1] > CROW[1];
  const there = at[0] === CROW[0] && at[1] === CROW[1];
  const cells: XY[] = [BOX];
  moves.reduce<XY>((p, m) => {
    const n: XY = m === "a" ? [p[0] + 1, p[1]] : [p[0], p[1] + 1];
    cells.push(n);
    return n;
  }, BOX);
  const go = (m: Move) => {
    const next = [...moves, m];
    setMoves(next);
    const a = next.filter((x) => x === "a").length;
    const u = next.length - a;
    if (a === 2 && u === 4) pass("Box to scarecrow: 2 across, 4 up.");
  };
  const path = cells.map((c, i) => `${i ? "L" : "M"}${f.sx(c[0])} ${f.sy(c[1])}`).join("");
  return (
    <>
      <Sheet f={f} label="Shiku walks the grid lines from the box towards the scarecrow." w="max-w-[10rem]">
        <Road f={f} x0={BOX[0]} x1={CROW[0]} dashed />
        <BoxAndCrow f={f} />
        {cells.length > 1 && <path d={path} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" className="pointer-events-none fill-none stroke-cat-violet/60" />}
        <Shiku f={f} at={at} />
      </Sheet>
      <div className="mt-3 flex justify-center gap-2">
        <button type="button" className={quietBtn} disabled={past || there} onClick={() => go("a")}>
          across +1
        </button>
        <button type="button" className={quietBtn} disabled={past || there} onClick={() => go("u")}>
          up +1
        </button>
      </div>
      <div className="mt-2 text-center font-mono text-lg font-semibold tabular-nums">
        across {across} · up {up}
      </div>
      {past && (
        <>
          <Nope>Shiku went past the scarecrow. Take it back to the box and try again.</Nope>
          <div className="mt-2 flex justify-center">
            <button type="button" className={quietBtn} onClick={() => setMoves([])}>
              Back to the box
            </button>
          </div>
        </>
      )}
      <Task done={there}>Walk Shiku from the box to the scarecrow.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · One column at a time. Each tap: Shiku steps one column across, then
// climbs until it is back on the bee's road. It is always 2 up. Four columns,
// from the box to (5, 9).

const stairTop = (n: number): XY => [BOX[0] + n, ROAD(BOX[0] + n)];

export function OneColumn() {
  const pass = useGate();
  const [n, setN] = useSeed("n", 0);
  const p = usePlay(450);
  const f = PAGE;
  const base = stairTop(n);
  const at: XY = p.running ? (p.k === 0 ? base : [base[0] + 1, base[1]]) : base;
  const climb = () =>
    p.play(2, () => {
      setN((m) => m + 1);
      if (n + 1 === 4) pass("Every column across: 2 up.");
    });
  return (
    <>
      <Sheet f={f} label="The bee's road on Samin's page. Shiku climbs it one column at a time.">
        <Road f={f} x0={0.5} x1={5.5} />
        <BoxAndCrow f={f} />
        {Array.from({ length: n }, (_, i) => {
          const a = stairTop(i);
          const b = stairTop(i + 1);
          return (
            <g key={i}>
              <path d={`M${f.sx(a[0])} ${f.sy(a[1])}H${f.sx(b[0])}V${f.sy(b[1])}`} strokeWidth={2.6} strokeLinejoin="round" className="pointer-events-none fill-none stroke-cat-violet/70" />
              <text x={f.sx(b[0]) + 5} y={f.sy(a[1] + 1) + 3} fontSize={9} fontWeight={700} className={`pointer-events-none fill-cat-violet ${POP}`}>
                +2
              </text>
            </g>
          );
        })}
        <Shiku f={f} at={at} />
      </Sheet>
      <div className="mt-3 flex justify-center">
        <button type="button" className={primaryBtn} disabled={p.running || n >= 4} onClick={climb}>
          One more column
        </button>
      </div>
      <div className="mt-2 flex min-h-7 flex-wrap justify-center gap-1.5">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className={`rounded-full bg-cat-violet/10 px-2.5 py-0.5 font-mono text-sm font-semibold text-cat-violet ${POP}`}>
            column {BOX[0] + i + 1}: up 2
          </span>
        ))}
      </div>
      <Task done={n >= 4}>Take Shiku up the road, one column at a time, four times.</Task>
    </>
  );
}

// 3½ · The figure for screen 3's explanation, no task: the big walk from the
// box to the scarecrow (2 across, 4 up) splits into two stairs of 1 across,
// 2 up, and the slope is built from it: 4 ÷ 2 = 2.

const S3_SAY = [
  "Box to scarecrow: 2 across, 4 up.",
  "Cut the walk into single columns.",
  "Each column: 1 across, 2 up.",
  "Up for one across. That's the slope.",
];

export function SlopeBuild() {
  const s = useScene(3, [600, 1400, 1800]);
  const k = s.k;
  const f = makeFrame(0, 4, 0, 6, 22);
  const mid = stairTop(1);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S3_SAY[k]}</span>}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-full max-w-[7.5rem]">
          <Plane f={f} label="The walk from the box to the scarecrow, as stairs." ticks={0} className="my-0! max-w-none">
            <Road f={f} x0={0.6} x1={3.4} />
            {k === 0 && <path d={`M${f.sx(1)} ${f.sy(1)}H${f.sx(3)}V${f.sy(5)}`} strokeWidth={2.6} className="fill-none stroke-cat-violet/70" />}
            {k >= 1 && (
              <path key="stairs" d={`M${f.sx(1)} ${f.sy(1)}H${f.sx(2)}V${f.sy(mid[1])}H${f.sx(3)}V${f.sy(5)}`} strokeWidth={2.6} strokeLinejoin="round" className={`fill-none stroke-cat-violet/70 ${FADE}`} />
            )}
            {k >= 2 && (
              <>
                <text x={f.sx(2) + 4} y={f.sy(2) + 3} fontSize={10} fontWeight={700} className={`fill-cat-violet ${POP}`}>
                  +2
                </text>
                <text x={f.sx(3) + 4} y={f.sy(4) + 3} fontSize={10} fontWeight={700} className={`fill-cat-violet ${POP}`}>
                  +2
                </text>
              </>
            )}
            <circle cx={f.sx(1)} cy={f.sy(1)} r={3.4} fill={INK} />
            <circle cx={f.sx(3)} cy={f.sy(5)} r={3.4} fill={INK} />
          </Plane>
        </div>
        <div className="min-w-[8.5rem] font-mono text-sm leading-relaxed">
          <div>across 2</div>
          <div>up 4</div>
          {k >= 3 && (
            <div key="slope" className={`mt-1 rounded-lg bg-cat-amber/15 px-2 py-1 font-semibold ${POP}`}>
              slope = 4 ÷ 2 = 2
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · Nasib's objection: "you picked the box and the scarecrow". Five dots on
// the road; the reader taps any two, a triangle shows across and up, and the
// sum comes out 2 every time. Three different pairs.

const DOTS_X = [1, 2, 3, 4, 5];

export function AnyTwoDots() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number[]>("pick", []);
  const [pairs, setPairs] = useSeed<string[]>("pairs", []);
  const f = PAGE;
  const tap = (x: number) => {
    if (pick.length === 1) {
      if (pick[0] === x) return;
      const key = [pick[0], x].sort().join("-");
      const next = pairs.includes(key) ? pairs : [...pairs, key];
      setPick([pick[0], x]);
      setPairs(next);
      if (next.length === 3 && pairs.length === 2) pass("Any two dots on the road: slope 2.");
    } else setPick([x]);
  };
  const [a, b] = pick.length === 2 ? [Math.min(...pick), Math.max(...pick)] : [0, 0];
  const across = b - a;
  const up = ROAD(b) - ROAD(a);
  return (
    <>
      <Speech who="Nasib" initial="N" tint="teal">
        You picked the box and the scarecrow. Pick other dots and you&apos;ll get another number.
      </Speech>
      <div className="mt-3">
        <Sheet f={f} label="Five dots on the bee's road. Tap two of them.">
          <Road f={f} x0={0.5} x1={5.5} />
          {pick.length === 2 && (
            <g key={pick.join("-")}>
              <Draw d={`M${f.sx(a)} ${f.sy(ROAD(a))}H${f.sx(b)}V${f.sy(ROAD(b))}`} strokeWidth={2.4} ms={700} className="stroke-cat-violet" />
              <text x={(f.sx(a) + f.sx(b)) / 2} y={f.sy(ROAD(a)) + 13} textAnchor="middle" fontSize={9} fontWeight={700} className={`fill-cat-violet ${FADE}`}>
                {across} across
              </text>
              <text x={f.sx(b) + 5} y={(f.sy(ROAD(a)) + f.sy(ROAD(b))) / 2 + 3} fontSize={9} fontWeight={700} className={`fill-cat-violet ${FADE}`}>
                {up} up
              </text>
            </g>
          )}
          {DOTS_X.map((x) => {
            const on = pick.includes(x);
            return (
              <g key={x} onClick={() => tap(x)} className="cursor-pointer">
                <circle cx={f.sx(x)} cy={f.sy(ROAD(x))} r={11} fill="transparent" />
                <circle cx={f.sx(x)} cy={f.sy(ROAD(x))} r={on ? 5.5 : 4} fill={on ? "#7c3aed" : INK} className="transition-all duration-200 motion-reduce:transition-none" />
              </g>
            );
          })}
        </Sheet>
      </div>
      <div className="mt-2 min-h-7 text-center font-mono text-base font-semibold tabular-nums">
        {pick.length === 2 ? (
          <span key={pick.join("-")} className={FADE}>
            up {up} ÷ across {across} = {up / across}
          </span>
        ) : pick.length === 1 ? (
          <span className="text-muted">now tap a second dot</span>
        ) : null}
      </div>
      <Ticks items={[0, 1, 2].map((i) => [`pair ${i + 1}`, pairs.length > i])} />
      <Task done={pairs.length >= 3}>Tap two dots on the road. Do it for three different pairs.</Task>
    </>
  );
}

// 4½ · The figure for screen 4's explanation, no task: one small stair grows
// to twice and three times its size. Same shape, so up ÷ across stays 2.

const S4_SAY = ["1 across, 2 up.", "Twice as far across: 4 up.", "Three times: 6 up.", "Bigger, same shape. Up ÷ across stays 2."];

export function SameShape() {
  const s = useScene(3, [600, 1300, 1300]);
  const k = s.k;
  const m = [1, 2, 3, 3][k];
  const f = makeFrame(0, 4, 0, 7, 22);
  const o: XY = [0.5, 0.5];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S4_SAY[k]}</span>}>
      <div className="mx-auto w-full max-w-[8rem]">
        <Plane f={f} label="A stair of 1 across and 2 up grows to 2 and 3 times its size." ticks={0} className="my-0! max-w-none">
          <Road f={f} x0={0.3} x1={3.7} slope={2} start={-0.5} />
          {[1, 2, 3].map((j) =>
            j <= m ? (
              <path
                key={j}
                d={`M${f.sx(o[0])} ${f.sy(o[1])}H${f.sx(o[0] + j)}V${f.sy(o[1] + 2 * j)}Z`}
                strokeWidth={j === m ? 2.4 : 1.2}
                className={`${FADE} ${j === m ? "fill-cat-violet/15 stroke-cat-violet" : "fill-none stroke-cat-violet/40"}`}
              />
            ) : null,
          )}
          <text x={f.sx(o[0] + m) + 4} y={f.sy(o[1] + m) + 3} fontSize={10} fontWeight={700} className="fill-cat-violet">
            {2 * m} up
          </text>
          <text x={(f.sx(o[0]) + f.sx(o[0] + m)) / 2} y={f.sy(o[1]) + 13} textAnchor="middle" fontSize={10} fontWeight={700} className="fill-cat-violet">
            {m} across
          </text>
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · The story scene for screen 5's setup: Nana's two other boxes further
// down the field. Rina and Karim say what their bees do, and Nasib calls it
// for Rina. No verdict shown.

export function TwoMoreBoxes({}: Story) {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="Two more honey boxes further down the mustard field. Rina and Karim each say what their bee does, and Nasib says Rina's is the steeper one.">
        <Mustard />
        <HiveBox x={52} y={150} s={0.95} />
        <HiveBox x={268} y={150} s={0.95} />
        <Bee x={56} y={116} s={1} />
        <Bee x={264} y={116} s={1} flip />
        <Person who="rina" x={96} y={150} arm={k === 1 ? "point" : "down"} mood="plain" />
        <Person who="karim" x={224} y={150} facing={-1} arm={k === 2 ? "point" : "down"} mood="plain" />
        {k >= 1 && k <= 2 && <Bubble x={96} y={84} side="right" lines={["My bee: 4 up", "for 2 across."]} />}
        {k === 2 && <Bubble x={224} y={84} side="left" lines={["Mine: 3 up", "for 1 across."]} />}
        <Person who="nasib" x={k >= 3 ? 160 : 380} y={150} facing={-1} walking={k === 3} mood="smug" />
        {k >= 3 && <Bubble x={160} y={84} lines={["4 beats 3. Rina's", "is the steep one."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · The second guess, where the obvious answer is wrong: Rina's bee goes
// 4 up for 2 across, Karim's 3 up for 1 across. "4 is more" picks Rina. Then
// both bees fly from the same corner and Karim's road is the steeper one.

const RACE = [
  { who: "Rina's bee", across: 2, up: 4, cls: "stroke-cat-coral", fill: "fill-cat-coral" },
  { who: "Karim's bee", across: 1, up: 3, cls: "stroke-cat-blue", fill: "fill-cat-blue" },
];
const S5_GUESS = ["Rina's bee. It goes 4 up.", "Karim's bee.", "Both are just as steep."];
const S5_RIGHT = 1;

export function WhichSteeper() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [flown, setFlown] = useSeed("flown", false);
  const f = makeFrame(0, 4, 0, 10, 20);
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className="w-full max-w-[6.5rem]">
          <Plane f={f} label="Two bees fly from the same corner: Rina's and Karim's." ticks={2} className="my-0! max-w-none">
            {flown &&
              RACE.map((r) => {
                const sl = r.up / r.across;
                const x1 = Math.min(4, 10 / sl);
                return <Draw key={r.who} d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(x1)} ${f.sy(sl * x1)}`} strokeWidth={2.8} ms={1100} className={r.cls} />;
              })}
            <HiveBox x={f.sx(0) + 8} y={f.sy(0) + 1} s={0.5} />
          </Plane>
        </div>
        <div className="grid gap-2">
          {RACE.map((r) => (
            <div key={r.who} className="rounded-lg border border-border px-2.5 py-1.5 text-sm">
              <div className="font-semibold">{r.who}</div>
              <div className="font-mono">
                {r.across} across, {r.up} up
              </div>
              {flown && (
                <div className={`font-mono text-xs ${FADE} ${r.fill.replace("fill-", "text-")}`}>
                  1 across: {r.up / r.across} up
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {guess !== null && !flown && (
        <div className={`mt-3 flex justify-center ${FADE}`}>
          <button
            type="button"
            className={primaryBtn}
            onClick={() => {
              setFlown(true);
              pass("One across decides it: 3 up beats 2 up.");
            }}
          >
            Fly both bees
          </button>
        </div>
      )}
      <div className="mt-3 text-sm font-medium text-muted">Whose bee climbs the steeper road?</div>
      <div className="mt-2 grid gap-2">
        {S5_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, flown, S5_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={flown}>Guess first, then fly both bees and see.</Task>
    </>
  );
}

// 5½ · The figure for screen 5's explanation, no task: both roads climb one
// column side by side, Rina's 2 up and Karim's 3 up.

const S5_SAY = ["Two roads from one corner.", "One column on Rina's road: 2 up.", "One column on Karim's: 3 up.", "More up for one across. Steeper."];

export function PerColumn() {
  const s = useScene(3, [600, 1400, 1400]);
  const k = s.k;
  const f = makeFrame(0, 2, 0, 5, 26);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <div className="mx-auto w-full max-w-[6.5rem]">
        <Plane f={f} label="Rina's and Karim's roads, one column each." ticks={0} className="my-0! max-w-none">
          <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(2)} ${f.sy(4)}`} strokeWidth={2.4} className="fill-none stroke-cat-coral" />
          <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(5 / 3)} ${f.sy(5)}`} strokeWidth={2.4} className="fill-none stroke-cat-blue" />
          {k >= 1 && <Draw key="r" d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(1)}V${f.sy(2)}`} strokeWidth={2.4} ms={700} className="stroke-cat-coral/70" />}
          {k >= 1 && (
            <text x={f.sx(1) + 4} y={f.sy(1) + 3} fontSize={10} fontWeight={700} className={`fill-cat-coral ${POP}`}>
              +2
            </text>
          )}
          {k >= 2 && <Draw key="k" d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(1)}V${f.sy(3)}`} strokeWidth={2.4} ms={700} className="stroke-cat-blue/70" />}
          {k >= 2 && (
            <text x={f.sx(1) + 4} y={f.sy(3) + 3} fontSize={10} fontWeight={700} className={`fill-cat-blue ${POP}`}>
              +3
            </text>
          )}
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn: the fence, off Samin's page. The reader sets the dish's row
// with a stepper and sends the bee. The big map has grid lines but no numbers
// on the fence, so a wrong dish only shows "higher" or "lower".

const BIG = makeFrame(0, 10, 0, 18, 12);
const FLY_TICKS = 24;
const FLY_END = 9.6;

export function FenceTurn() {
  const pass = useGate();
  const [row, setRow] = useSeed("row", 5);
  const [sent, setSent] = useSeed<number | null>("sent", null);
  const [miss, setMiss] = useState(0);
  const p = usePlay(60);
  const f = BIG;
  const t = p.running ? p.k / FLY_TICKS : sent !== null ? 1 : 0;
  const bx = BOX[0] + (FLY_END - BOX[0]) * t;
  const flying = p.running || sent !== null;
  const right = sent === FENCE_ROW && !p.running;
  const send = () => {
    const r = row;
    setSent(null);
    p.play(FLY_TICKS, () => {
      setSent(r);
      if (r === FENCE_ROW) pass("6 columns × 2 up, on top of row 5: row 17.");
      else setMiss((m) => m + 1);
    });
  };
  return (
    <>
      <div className="mx-auto w-full max-w-[9.5rem]">
        <Plane f={f} label="The whole field: Samin's page, the box, the scarecrow and the fence at column 9." grid={1} ticks={0} className="my-0! max-w-none">
          <rect x={f.sx(0)} y={f.sy(10)} width={6 * f.u} height={10 * f.u} className="pointer-events-none fill-cat-blue/8 stroke-cat-blue/40" strokeDasharray="3 3" />
          <text x={f.sx(0) + 3} y={f.sy(10) + 9} fontSize={7.5} className="pointer-events-none fill-cat-blue">
            Samin&apos;s page
          </text>
          <path d={`M${f.sx(FENCE)} ${f.sy(0)}V${f.sy(18)}`} strokeWidth={3} className="pointer-events-none stroke-[#a16207]" />
          <text x={f.sx(FENCE) - 3} y={f.sy(0) - 4} textAnchor="end" fontSize={7.5} fontWeight={700} className="pointer-events-none fill-[#a16207]">
            fence
          </text>
          <Road f={f} x0={BOX[0]} x1={CROW[0]} />
          {flying && <path d={`M${f.sx(BOX[0])} ${f.sy(BOX[1])}L${f.sx(bx)} ${f.sy(ROAD(bx))}`} strokeWidth={1.6} strokeDasharray="3 3" className="pointer-events-none fill-none stroke-cat-amber" />}
          <circle cx={f.sx(BOX[0])} cy={f.sy(BOX[1])} r={3} fill={INK} />
          <circle cx={f.sx(CROW[0])} cy={f.sy(CROW[1])} r={3} fill={INK} />
          <Dish x={f.sx(FENCE)} y={f.sy(row) + 5} s={0.9} glow={right} />
          <text x={f.sx(FENCE) + 9} y={f.sy(row) + 3} fontSize={8} fontWeight={700} className="pointer-events-none fill-[#0f1b2d]">
            {row}
          </text>
          {flying && <Bee x={f.sx(bx)} y={f.sy(ROAD(bx))} s={0.8} />}
        </Plane>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <Stepper value={row} onChange={setRow} min={0} max={30} label="dish row" />
        <button type="button" className={primaryBtn} disabled={p.running || right} onClick={send}>
          Send the bee
        </button>
      </div>
      {sent !== null && !p.running && sent !== FENCE_ROW && (
        <Nope key={miss}>
          {sent < FENCE_ROW ? "The bee crossed the fence higher than your dish." : "The bee crossed the fence lower than your dish."}
          {miss >= 2 && " From the scarecrow, how many columns to the fence? And how much up for each?"}
        </Nope>
      )}
      <Task done={right}>Set the row for Nana&apos;s dish, then send the bee.</Task>
    </>
  );
}

// 6½ · The figure for screen 6's explanation, no task: the fence row built
// slot by slot — start at the scarecrow's row, add columns × slope.

const S6_SAY = [
  "Start from a dot you know: the scarecrow, row 5.",
  "The fence is 6 columns further on.",
  "Each column is 2 up. 6 × 2 = 12 up.",
  "Row 5 + 12 = row 17.",
];

export function FenceSum() {
  const s = useScene(3, [600, 1600, 1800]);
  const k = s.k;
  const slot = (v: string, on: boolean, cls: string) => (
    <span className={`grid h-10 min-w-10 place-items-center rounded-lg px-2 font-mono text-lg font-bold ${on ? `${cls} ${POP}` : "border border-dashed border-border text-transparent"}`}>{on ? v : "?"}</span>
  );
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S6_SAY[k]}</span>}>
      <div className="flex flex-wrap items-center justify-center gap-1.5 py-3 text-lg font-semibold">
        {slot("5", true, "bg-foreground/5")}
        <span>+</span>
        {slot("6", k >= 1, "bg-cat-violet/15 text-cat-violet")}
        <span>×</span>
        {slot("2", k >= 2, "bg-cat-amber/20")}
        <span>=</span>
        {slot("17", k >= 3, "bg-accent text-accent-foreground")}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · The story scene for screen 7's setup: Karim's box by the pond, the two
// dots Samin wrote down, and Nana's three dishes on the pond's edge. Which
// dish the bee wants is left open.

/** The pond at the field's edge, drawn on the stage. */
function Pond() {
  return (
    <g className="pointer-events-none">
      <ellipse cx={264} cy={164} rx={52} ry={14} fill="#7dd3fc" stroke="#0284c7" strokeWidth={1} />
      <path d="M238 160h14M264 169h18" stroke="#0284c7" strokeWidth={1} strokeLinecap="round" />
    </g>
  );
}

export function PondDishes({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  const bee: XY = k >= 1 ? [96, 40] : [44, 124];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="Karim's honey box by the pond. Samin writes down two spots on the bee's road, and Nana puts three water dishes along the pond's edge.">
        <Mustard from={0} to={198} />
        <Pond />
        <HiveBox x={40} y={150} s={0.95} />
        <Person who="karim" x={76} y={150} mood="plain" />
        <g style={{ transform: `translate(${bee[0]}px, ${bee[1]}px)` }} className="transition-transform duration-[1400ms] ease-in-out motion-reduce:transition-none">
          <Bee x={0} y={0} s={1.1} />
        </g>
        <Person who="samin" x={k >= 2 ? 136 : 380} y={150} facing={-1} walking={k === 2} arm={k === 2 ? "hold" : "down"} />
        {k === 2 && (
          <>
            <Card x={136} y={74} text="(0, 1)" tone="amber" />
            <Card x={136} y={54} text="(1, 4)" tone="amber" />
          </>
        )}
        {k >= 3 && (
          <>
            <Dish x={228} y={158} s={0.85} />
            <Dish x={262} y={152} s={0.85} />
            <Dish x={296} y={158} s={0.85} />
          </>
        )}
        <Person who="nana" x={k >= 3 ? 196 : 380} y={150} facing={-1} walking={k === 3} mood="plain" />
        {k >= 3 && <Bubble x={196} y={84} side="left" lines={["Only one dish is", "on its road."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it, a new case: Karim's hive by the pond. A bee seen at (0, 1) and
// (1, 4), so slope 3; the pond's edge is column 3. Three dishes on the edge,
// at rows 7, 10 and 13. Tapping one flies the bee; a wrong dish is flown past.

const P7_DOTS: [XY, XY] = [
  [0, 1],
  [1, 4],
];
const P7_ROAD = (x: number) => 3 * x + 1;
const P7_EDGE = 3;
const P7_DISHES = [7, 10, 13];
const P7_RIGHT = 10;
const P7_TICKS = 20;

export function TryPond() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const p = usePlay(60);
  const f = makeFrame(0, 4, 0, 14, 17);
  const end = pick === P7_RIGHT ? P7_EDGE : 4.2;
  const t = p.running ? p.k / P7_TICKS : pick !== null ? 1 : 0;
  const bx = P7_DOTS[0][0] + (end - P7_DOTS[0][0]) * t;
  const done = pick === P7_RIGHT && !p.running;
  const choose = (r: number) => {
    if (p.running || done) return;
    setPick(r);
    p.play(P7_TICKS, () => {
      if (r === P7_RIGHT) pass("Slope 3: 2 more columns, 6 up. Row 10.");
      else setMiss((m) => m + 1);
    });
  };
  const wrong = pick !== null && pick !== P7_RIGHT && !p.running;
  return (
    <>
      <div className="mx-auto w-full max-w-[8.5rem]">
        <Plane f={f} label="Karim's pond: a bee seen at (0, 1) and (1, 4), and three dishes on the pond's edge at column 3." ticks={2} className="my-0! max-w-none">
          <rect x={f.sx(P7_EDGE)} y={f.sy(14)} width={1 * f.u} height={14 * f.u} className="pointer-events-none fill-sky-300/40" />
          <text x={f.sx(3.5)} y={f.sy(0.4)} textAnchor="middle" fontSize={7.5} fontWeight={700} className="pointer-events-none fill-sky-700">
            pond
          </text>
          <path d={`M${f.sx(0)} ${f.sy(1)}L${f.sx(1)} ${f.sy(4)}`} strokeWidth={2.6} className="pointer-events-none fill-none stroke-cat-amber" />
          {(p.running || pick !== null) && (
            <path d={`M${f.sx(0)} ${f.sy(1)}L${f.sx(bx)} ${f.sy(P7_ROAD(bx))}`} strokeWidth={1.6} strokeDasharray="3 3" className="pointer-events-none fill-none stroke-cat-amber" />
          )}
          {P7_DOTS.map((d) => (
            <circle key={d.join()} cx={f.sx(d[0])} cy={f.sy(d[1])} r={3.2} fill={INK} className="pointer-events-none" />
          ))}
          {P7_DISHES.map((r) => (
            <g key={r} onClick={() => choose(r)} className="cursor-pointer">
              <rect x={f.sx(P7_EDGE) - 11} y={f.sy(r) - 9} width={22} height={14} fill="transparent" />
              <Dish x={f.sx(P7_EDGE)} y={f.sy(r) + 4} s={0.85} glow={done && r === P7_RIGHT} />
              {pick === r && !p.running && r !== P7_RIGHT && <path d={`M${f.sx(P7_EDGE) - 6} ${f.sy(r) - 6}l12 9m0 -9l-12 9`} stroke="#dc2626" strokeWidth={1.6} />}
            </g>
          ))}
          {(p.running || pick !== null) && <Bee x={f.sx(bx)} y={f.sy(P7_ROAD(bx))} s={0.75} />}
        </Plane>
      </div>
      {wrong && (
        <Nope key={miss}>
          {pick! < P7_RIGHT
            ? "The bee flew over that dish, higher up. From (1, 4) there are 2 columns to the pond, not 1."
            : "The bee crossed below that dish. Count the columns from the second dot, (1, 4)."}
        </Nope>
      )}
      <Task done={done}>Tap the dish that sits on this bee&apos;s road.</Task>
    </>
  );
}

// 7½ · The figure for screen 7's explanation, no task: the pond row built from
// the second dot — 2 columns on, 3 up each, so row 4 + 6 = row 10.

const S7_SAY = [
  "Samin's two dots, and the road through them.",
  "Start from the second dot, row 4.",
  "The pond's edge is 2 columns on.",
  "Each column is 3 up, so 6 up.",
  "Row 4 + 6 = row 10.",
];

export function PondSum() {
  const s = useScene(4, [600, 1600, 1800, 1800, 2200]);
  const k = s.k;
  const f = makeFrame(0, 4, 0, 11, 16);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S7_SAY[k]}</span>}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-full max-w-[5.5rem]">
          <Plane f={f} label="Karim's road: from the dot at (1, 4), two columns on and three up each, to row 10." ticks={0} className="my-0! max-w-none">
            <rect x={f.sx(P7_EDGE) - 3} y={f.sy(11)} width={6} height={11 * f.u} className="pointer-events-none fill-sky-300/50" />
            <path d={`M${f.sx(0)} ${f.sy(P7_ROAD(0))}L${f.sx(3.3)} ${f.sy(P7_ROAD(3.3))}`} strokeWidth={2.4} className="pointer-events-none fill-none stroke-cat-amber" />
            {k >= 2 && <Draw key="a" d={`M${f.sx(1)} ${f.sy(4)}H${f.sx(3)}`} strokeWidth={2.6} ms={700} className="stroke-cat-violet" />}
            {k >= 3 && <Draw key="u" d={`M${f.sx(3)} ${f.sy(4)}V${f.sy(10)}`} strokeWidth={2.6} ms={700} className="stroke-cat-violet" />}
            {P7_DOTS.map((d) => (
              <circle key={d.join()} cx={f.sx(d[0])} cy={f.sy(d[1])} r={3.4} fill={INK} className="pointer-events-none" />
            ))}
            {k >= 1 && <circle cx={f.sx(1)} cy={f.sy(4)} r={5.5} fill="#7c3aed" className={`pointer-events-none ${POP}`} />}
            {k >= 4 && <Dish x={f.sx(P7_EDGE)} y={f.sy(10) + 4} s={0.8} glow />}
          </Plane>
        </div>
        <div className="min-w-[8rem] font-mono text-sm leading-relaxed">
          <div className={k >= 1 ? "" : "text-transparent"}>row 4</div>
          <div className={k >= 2 ? "" : "text-transparent"}>across 2</div>
          <div className={k >= 3 ? "" : "text-transparent"}>2 × 3 = 6 up</div>
          {k >= 4 && (
            <div key="row" className={`mt-1 rounded-lg bg-cat-amber/15 px-2 py-1 font-semibold ${POP}`}>
              4 + 6 = row 10
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · The closing scene: Nana carries the dish to the fence, puts it at row 17,
// and the bee comes straight to it. Nasib has nothing to say.

export function DishOnFence({}: Story) {
  const s = useScene(4, [600, 1500, 1500, 2200]);
  const k = s.k;
  const bee: XY = k >= 3 ? [250, 108] : [-20, 170];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="Nana puts the water dish on the fence at row 17, and the bee flies straight to it.">
        <Mustard />
        <Fence x0={250} x1={306} y={152} />
        {k >= 2 && <Dish x={262} y={120} s={1.4} glow={k >= 3} />}
        {k >= 2 && <Card x={274} y={84} text="row 17" tone="amber" />}
        {k >= 3 && <path d="M-10 175L244 112" stroke={AMBER} strokeWidth={1.2} strokeDasharray="3 3" className={FADE} />}
        <g style={{ transform: `translate(${bee[0]}px, ${bee[1]}px)` }} className="transition-transform duration-[1500ms] ease-out motion-reduce:transition-none">
          <Bee x={0} y={0} s={1.2} />
        </g>
        <Person who="nana" x={k >= 1 ? 226 : 90} y={150} walking={k === 1} arm={k === 1 ? "hold" : "down"} mood="happy" />
        {k === 1 && <Dish x={240} y={112} s={1.1} />}
        <Person who="nasib" x={140} y={150} mood={k >= 3 ? "puzzled" : "smug"} />
        {k >= 4 && <Bubble x={140} y={84} lines={["Row 17. Hmm."]} />}
        <Person who="samin" x={80} y={150} mood="happy" arm={k >= 4 ? "wave" : "down"} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are useSeed names).

export const fixtures: Fixtures = {
  BoxToFence: { start: { k: 0 }, dots: { k: 2 }, nasib: { k: 4 } },
  FenceBet: { start: {}, sealed: { bet: 0 } },
  WalkToCrow: { start: {}, mid: { moves: ["a", "u", "u"] }, past: { moves: ["a", "a", "a"] }, there: { moves: ["a", "u", "a", "u", "u", "u"] } },
  OneColumn: { start: {}, two: { n: 2 }, done: { n: 4 } },
  SlopeBuild: { first: { k: 0 }, done: {} },
  AnyTwoDots: { start: {}, one: { pick: [2] }, pair: { pick: [1, 4], pairs: ["1-4"] }, done: { pick: [2, 5], pairs: ["1-4", "2-3", "2-5"] } },
  SameShape: { first: { k: 0 }, done: {} },
  TwoMoreBoxes: { start: { k: 0 }, said: { k: 2 }, nasib: {} },
  WhichSteeper: { start: {}, guessed: { guess: 0 }, flown: { guess: 0, flown: true } },
  PerColumn: { first: { k: 0 }, done: {} },
  FenceTurn: { start: {}, low: { row: 9, sent: 9 }, right: { row: 17, sent: 17 } },
  FenceSum: { mid: { k: 1 }, done: {} },
  PondDishes: { start: { k: 0 }, dots: { k: 2 }, dishes: {} },
  TryPond: { start: {}, wrong: { pick: 7 }, right: { pick: 10 } },
  PondSum: { mid: { k: 2 }, done: {} },
  DishOnFence: { start: { k: 0 }, done: {} },
};
