"use client";

import { useState, type ReactNode } from "react";

import { DotBox, Tup } from "@/components/journey/box";
import { Bubble, Person, Robot, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Stepper, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Arrow, Plane, same, type Frame, type XY } from "@/components/journey/plane";
import {
  Beam,
  GOOD_LENS,
  HEARTS,
  Heart,
  KNOB_HEX,
  LensCard,
  LightBhai,
  LightDot,
  LightGrid,
  Post,
  Projector,
  STAGE_WALL_F,
  StageBeam,
  StageWall,
  WALL_F,
  WALL_SLOTS,
  WallBed,
  WallClip,
  WallGrid,
  apply,
  byCols,
  partway,
  pathOf,
  projectorLens,
  rowsOf,
  useLensRun,
  wallFrame,
  type Cols,
  type Move,
} from "./light-kit";

// Screens for "Math for AI 7.3 — Two lenses, one lens", told as a Journey in
// the author's Bangla-English. The plan is 07_journey_specs.md, block 7.3.
//
// গায়ে হলুদের দুপুর at নানাবাড়ি। Last night's lens G = [[2, 1], [1, 2]] cracked
// in the dew (7.2's bridge). The লাইট ভাই has two small spares, Z = [[−1, 1],
// [2, 1]] and W = [[0, 1], [1, 1]], and the machine has one slot. বাজারের কাঁচের
// দোকান can cut one new lens before সন্ধ্যা from four numbers; the machine's
// app on Samin's phone shows what any four numbers would throw on the wall.
// Which four? Four cards: করিম W + Z, নাসিব entry by entry, সোম "one won't do",
// সামিন "there is a matrix, find it".
//
// Ten screens. 1 seals the bet (LensBet). 2 Z in the slot, W held in front by
// Rina: the dot (1, 1) → (0, 3) → (3, 3), where last night's lens put it; then
// the whole wall (ThroughBoth). 3 Karim's and Nasib's cards on the app: both
// land wrong (TryTheCards). 4 predict how few dots pin the move, then send e₁
// and e₂ through both: (2, 1) and (1, 2) (FollowTheRopes). 5 stand the two ends
// up as columns: WZ = G, the wall matches (LensByColumns). 6 the shortcut, one
// cell = W's row · Z's column, the 4.1 box (RowMeetsColumn). 7 three reasons
// the rule is right, each acted out (WhyThisRule). 8 Your turn: the 6.7 shear
// then a stretch, one lens by hand (YourOneLens). 9 Try it: one blank cell,
// judged by where e₁ lands (TryOneCell). 10 the finale (no widget).
//
// After the screens: the story scenes (NoonSpares, FourIdeas, HandHeld,
// SomNoAll, HoludShow, OtherOrder) and the watch-only figures (OneSlot,
// TwoStepsOneGrid, KarimAdds, RopesRecipe, ColsStandUp, RowIsReading,
// CellIsHeight, BetOpen), each numbered after its screen.
//
// The wall, the machine and the light grid come from light-kit.tsx (read-only,
// shared with 7.2 and 7.4). Z is drawn yellow and W violet, as in 7.2's
// CrackedLens.

const INK = "#0f1b2d";
const BLUE = "#2563eb";
const RED = "#e11d48";
const GREEN = "#0d9488";
const Z_HEX = "#fde68a";
const W_HEX = "#c4b5fd";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

const F = WALL_F;
const FIG_F = wallFrame(17, 6);

// ---------------------------------------------------------------------------
// Numbers. Lenses are stored by columns (road-kit's Cols), like light-kit.

/** the yellow spare Z = [[−1, 1], [2, 1]] */
const Z: Cols = [
  [-1, 2],
  [1, 1],
];
/** the violet spare W = [[0, 1], [1, 1]] */
const W: Cols = [
  [0, 1],
  [1, 1],
];
/** one lens that does `first`, then `second`: the two ropes' ends sent through both */
const onto = (second: Cols, first: Cols): Cols => [apply(second, first[0]), apply(second, first[1])];
/** WZ = [[2, 1], [1, 2]]: last night's lens, G */
const WZ = onto(W, Z);
/** Karim's card, W + Z = [[−1, 2], [3, 2]] */
const SUM: Cols = [
  [-1, 3],
  [2, 2],
];
/** Nasib's card, W and Z entry by entry = [[0, 1], [2, 1]] */
const CELL: Cols = [
  [0, 2],
  [1, 1],
];
/** Rina's chalk mark, the dot the reader runs */
const DOT0: XY = [1, 1];
const E1: XY = [1, 0];
const E2: XY = [0, 1];

const sameCols = (a: Cols, b: Cols) => same(a[0], b[0]) && same(a[1], b[1]);
const sg = (n: number) => (n < 0 ? `−${-n}` : `${n}`);

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

/** first, then second, as one glide: t 0 → 1 runs `first`, 1 → 2 runs `second` on top */
const twoStage =
  (first: Cols, second: Cols, t: number): Move =>
  (p) => {
    if (t <= 1) return partway(byCols(first), t)(p);
    const q = apply(first, p);
    const r = apply(second, q);
    const u = t - 1;
    return [q[0] + (r[0] - q[0]) * u, q[1] + (r[1] - q[1]) * u];
  };

// ---------------------------------------------------------------------------
// Shared drawing.

/** The wall on a Plane: lime, chalk grid, then `lit` (under the post), the post, then the rest. */
function LJ_Wall({ f = F, label, lit, width = "max-w-[22rem]", children }: { f?: Frame; label: string; lit?: ReactNode; width?: string; children?: ReactNode }) {
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} className={`my-0! ${width}`}>
      <WallBed f={f} />
      <WallGrid f={f} nums={f.u >= 18} />
      {lit}
      <Post f={f} />
      {children}
    </Plane>
  );
}

/** A lens's grid drawn dashed, as a target to match ("what both lenses do"); `t` grows it from the plain grid. */
function LJ_Ghost({ f = F, cols, t = 1, tone = BLUE, w = 1.1 }: { f?: Frame; cols: Cols; t?: number; tone?: string; w?: number }) {
  const m = partway(byCols(cols), t);
  let d = "";
  for (let x = -3; x <= 9; x += 1) d += pathOf(f, m, [[x, -2], [x, 6]]);
  for (let y = -2; y <= 6; y += 1) d += pathOf(f, m, [[-3, y], [9, y]]);
  return (
    <WallClip f={f}>
      <path d={d} stroke={tone} strokeWidth={w} strokeDasharray="4 3" strokeOpacity={0.8} fill="none" className="pointer-events-none" />
    </WallClip>
  );
}

/** the light dot, gliding to `at` */
function LJ_Glide({ f = F, at, beam = false, ms = 650 }: { f?: Frame; at: XY; beam?: boolean; ms?: number }) {
  const [x, y] = useTween(at, ms);
  return (
    <>
      {beam && <Beam f={f} to={[x, y]} />}
      <LightDot f={f} at={[x, y]} />
    </>
  );
}

/** a dashed ring round a wall spot, with a small label over it */
function LJ_Ring({ f = F, at, tone = BLUE, label }: { f?: Frame; at: XY; tone?: string; label?: string }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  const r = Math.max(6, f.u * 0.45);
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill="none" stroke="white" strokeWidth={3.6} strokeOpacity={0.8} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={tone} strokeWidth={2} strokeDasharray="3 2.5" />
      {label && (
        <text x={x} y={y - r - 3} textAnchor="middle" fontSize={Math.max(8, f.u * 0.4)} fontWeight={700} fill={tone} stroke="#e9e4d8" strokeWidth={2.5} paintOrder="stroke">
          {label}
        </text>
      )}
    </g>
  );
}

/** Rina's chalk ring at a spot */
function LJ_Chalk({ f = F, at }: { f?: Frame; at: XY }) {
  return <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={Math.max(4, f.u * 0.28)} fill="none" stroke="white" strokeWidth={1.8} className="pointer-events-none" />;
}

/** the red gap between where a lens put the dot and where it should be */
function LJ_Gap({ f = F, a, b }: { f?: Frame; a: XY; b: XY }) {
  return <path d={`M${f.sx(a[0])} ${f.sy(a[1])}L${f.sx(b[0])} ${f.sy(b[1])}`} stroke={RED} strokeWidth={2} strokeDasharray="4 3" className={`${FADE} pointer-events-none`} />;
}

/** a thin dashed hop from one spot to another (a lens carrying the dot) */
function LJ_Hop({ f = F, a, b, tone }: { f?: Frame; a: XY; b: XY; tone: string }) {
  const x1 = f.sx(a[0]);
  const y1 = f.sy(a[1]);
  const x2 = f.sx(b[0]);
  const y2 = f.sy(b[1]);
  const mx = (x1 + x2) / 2 - (y2 - y1) * 0.2;
  const my = (y1 + y2) / 2 + (x2 - x1) * 0.2;
  return <path d={`M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`} stroke={tone} strokeWidth={1.6} strokeDasharray="3 3" fill="none" className={`${FADE} pointer-events-none`} />;
}

/** A 2 × 2 drawn in SVG, centred at (x, y): column 1 amber, column 2 teal; `q` puts "?" in every cell. */
function LJ_Mat({ x, y, cols, s = 1, q = false, show = [true, true] }: { x: number; y: number; cols?: Cols; s?: number; q?: boolean; show?: [boolean, boolean] }) {
  const cw = 15 * s;
  const ch = 12 * s;
  const w = cw * 2 + 6 * s;
  const h = ch * 2 + 4 * s;
  const x0 = x - w / 2;
  const y0 = y - h / 2;
  const br = (side: -1 | 1) => {
    const bx = side < 0 ? x0 : x0 + w;
    const lip = bx - side * 3 * s;
    return `M${lip} ${y0}H${bx}V${y0 + h}H${lip}`;
  };
  return (
    <g className="pointer-events-none">
      <rect x={x0 - 3 * s} y={y0 - 2 * s} width={w + 6 * s} height={h + 4 * s} rx={3 * s} fill="white" />
      <path d={br(-1)} stroke={INK} strokeOpacity={0.6} strokeWidth={1.2 * s} fill="none" />
      <path d={br(1)} stroke={INK} strokeOpacity={0.6} strokeWidth={1.2 * s} fill="none" />
      {[0, 1].map((c) =>
        [0, 1].map((r) => (
          <text
            key={`${c}${r}`}
            x={x0 + 3 * s + cw * c + cw / 2}
            y={y0 + 2 * s + ch * r + ch * 0.78}
            textAnchor="middle"
            fontSize={10 * s}
            fontWeight={800}
            fontFamily="ui-monospace, monospace"
            fill={q || !show[c] ? BLUE : KNOB_HEX[(c + 1) as 1 | 2]}
          >
            {q || !cols || !show[c] ? "?" : sg(cols[c][r])}
          </text>
        )),
      )}
    </g>
  );
}

/** a round spare lens, in SVG, with its letter */
function LJ_Glass({ x, y, which, r = 5 }: { x: number; y: number; which: "Z" | "W"; r?: number }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill={which === "Z" ? Z_HEX : W_HEX} stroke={INK} strokeWidth={0.9} />
      <text x={x} y={y + r * 0.45} textAnchor="middle" fontSize={r * 1.3} fontWeight={800} fontFamily="ui-monospace, monospace" fill={INK}>
        {which}
      </text>
    </g>
  );
}

/**
 * A 2 × 2 in HTML, rows first (`cells[i][j]`). `hiRow` tints a row blue, `hiCol`
 * a column amber; `colTone` colours column 1 amber and column 2 teal. A null
 * cell is blank: a "?" button when `onCell` is given.
 */
function LJ_M({
  cells,
  hiRow = -1,
  hiCol = -1,
  colTone = false,
  onCell,
  cur = -1,
  disabled = false,
  label,
}: {
  cells: (number | null)[][];
  hiRow?: number;
  hiCol?: number;
  colTone?: boolean;
  onCell?: (c: number) => void;
  cur?: number;
  disabled?: boolean;
  label?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {label && <div className="text-xs text-muted">{label}</div>}
      <div className="flex items-stretch font-mono text-base font-bold">
        <span className="w-1.5 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
        <div className="grid grid-cols-2 gap-0.5 p-0.5">
          {cells.flatMap((row, i) =>
            row.map((v, j) => {
              const c = i * 2 + j;
              const tone = colTone ? (j === 0 ? "text-cat-amber" : "text-cat-teal") : "";
              const tint = c === cur ? "bg-cat-blue/20 ring-2 ring-cat-blue" : i === hiRow ? "bg-cat-blue/15" : j === hiCol ? "bg-cat-amber/20" : "";
              const box = `grid h-8 w-9 place-items-center rounded-md transition-colors duration-300 motion-reduce:transition-none ${tone} ${tint}`;
              if (v === null && onCell)
                return (
                  <button key={c} type="button" disabled={disabled} onClick={() => onCell(c)} aria-label={`row ${i + 1}, column ${j + 1} এর ঘর`} className={`${box} cursor-pointer border-2 border-dashed border-cat-blue/50 text-cat-blue hover:bg-cat-blue/10 disabled:cursor-default`}>
                    ?
                  </button>
                );
              return (
                <span key={c} className={box}>
                  {v === null ? "" : <span key={v} className={`${POP} inline-block`}>{sg(v)}</span>}
                </span>
              );
            }),
          )}
        </div>
        <span className="w-1.5 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
      </div>
    </div>
  );
}

/** a lens card with a label, for chips above the wall */
function LJ_Chip({ label, cols, on = false, tint }: { label: ReactNode; cols: Cols; on?: boolean; tint: string }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-xl border-2 px-2 py-1 transition-colors duration-300 motion-reduce:transition-none ${on ? "border-cat-blue bg-cat-blue/10" : "border-border"}`}>
      <span className="size-3 shrink-0 rounded-full ring-1 ring-black/30" style={{ background: tint }} />
      <span className="text-xs text-muted">{label}</span>
      <LensCard cols={cols} small />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Four cards: Karim's W + Z, Nasib's entry by entry, Som's
//     "one won't do" (two lenses), Samin's "there is a matrix" (a grid of "?").
//     Sealing acts it out: the picked card flies into the machine's one slot,
//     the machine lights, and a "?" lands on the wall. Never marked.

const X1_CARDS: { who: string; line: string; face: Cols | "two" | "?" }[] = [
  { who: "করিম", line: "W + Z, যোগ করে দাও", face: SUM },
  { who: "নাসিব", line: "ঘরে ঘরে গুণ", face: CELL },
  { who: "সোম", line: "একটায় হবে না", face: "two" },
  { who: "সামিন", line: "একটা matrix আছে", face: "?" },
];

function X1_Face({ face }: { face: Cols | "two" | "?" }) {
  if (face === "two")
    return (
      <svg viewBox="0 0 44 22" className="h-6 w-auto" aria-hidden="true">
        <LJ_Glass x={11} y={11} which="Z" r={8} />
        <LJ_Glass x={31} y={11} which="W" r={8} />
      </svg>
    );
  if (face === "?")
    return (
      <svg viewBox="0 0 44 30" className="h-7 w-auto" aria-hidden="true">
        <LJ_Mat x={22} y={15} q />
      </svg>
    );
  return <LensCard cols={face} small />;
}

const X1_PJ: [number, number] = [262, 126];

function X1_SlotPic({ pick, k }: { pick: number | null; k: number }) {
  const [lx, ly] = projectorLens(X1_PJ[0], X1_PJ[1]);
  const q: [number, number] = [12 + STAGE_WALL_F.sx(4), 14 + STAGE_WALL_F.sy(4.4)];
  const face = pick === null ? null : X1_CARDS[pick].face;
  const move = (rest: [number, number], slot: [number, number], s0: number, s1: number) => ({
    transform: `translate(${k >= 1 ? slot[0] : rest[0]}px, ${k >= 1 ? slot[1] : rest[1]}px) scale(${k >= 1 ? s1 : s0})`,
  });
  const cls = "transition-transform duration-700 ease-in-out motion-reduce:transition-none";
  return (
    <svg viewBox="0 0 320 130" role="img" aria-label="দেয়াল, লাইট ভাইয়ের যন্ত্র আর তার একটা খালি খোপ; বেছে নেওয়া card খোপে ঢুকে দেয়ালে আলো ফেলে, সেখানে প্রশ্নবোধক" className="mx-auto block h-auto w-full max-w-[20rem]">
      <rect width={320} height={130} rx={10} fill="#bfe3ff" />
      <rect y={126} width={320} height={4} fill="#86c06c" />
      <StageWall x={12} y={14} grid={false} />
      {k >= 2 && <StageBeam from={[lx, ly]} to={q} w={6} />}
      <Projector x={X1_PJ[0]} y={X1_PJ[1]} lens="empty" on={k >= 2} />
      {face === "two" && (
        <>
          <g style={move([272, 22], [lx, ly], 1, 1)} className={cls}>
            <LJ_Glass x={0} y={0} which="Z" r={6} />
          </g>
          <g style={move([292, 22], [lx + 10, ly - 20], 1, 1)} className={cls}>
            <LJ_Glass x={0} y={0} which="W" r={6} />
          </g>
        </>
      )}
      {face !== null && face !== "two" && (
        <g style={move([284, 22], [lx, ly], 1, 0.4)} className={cls}>
          {face === "?" ? <LJ_Mat x={0} y={0} q /> : <LJ_Mat x={0} y={0} cols={face} />}
        </g>
      )}
      {k >= 2 && (
        <text x={q[0]} y={q[1] + 9} textAnchor="middle" fontSize={26} fontWeight={800} fill={BLUE} className={POP}>
          ?
        </text>
      )}
    </svg>
  );
}

export function LensBet() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(800);
  const k = !sealed ? 0 : act.running ? act.k : 3;
  const seal = () => {
    if (pick === null || sealed) return;
    setSealed(true);
    act.play(3, () => pass("বাজি সিল হলো। আগে দুই lens পরপর চালাই।"));
  };
  return (
    <>
      <X1_SlotPic pick={pick} k={k} />
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={pick === i ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => setPick(i)}>
            <span className="flex flex-col items-start gap-1 text-sm leading-tight">
              <span className="font-semibold">{c.who}</span>
              {!(sealed && pick !== i) && <X1_Face face={c.face} />}
              <span className="text-xs text-muted">{c.line}</span>
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" className={primaryBtn} disabled={pick === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 3}>কার কথা ঠিক? একটা card বেছে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Through both. Z sits in the slot, Rina holds W in front of it. The dot on
//     Rina's chalk mark (1, 1) goes through Z to (0, 3), then through W to
//     (3, 3): the ring where last night's lens put it (7.2). Then the whole
//     wall: the light grid bends twice, the dot riding it.

const X2_STOPS: XY[] = [DOT0, apply(Z, DOT0), apply(W, apply(Z, DOT0))];

export function ThroughBoth() {
  const pass = useGate();
  const [phase, setPhase] = useSeed("phase", 0); // 0 at (1, 1) · 1 through Z · 2 through W · 3 the whole wall
  const hop = usePlay(700);
  const run = useLensRun(2400, 48);
  const go = () => {
    if (hop.running || run.running) return;
    if (phase < 2) {
      setPhase(phase + 1);
      hop.play(1);
    } else
      run.run(() => {
        if (phase < 3) {
          setPhase(3);
          pass("দুই lens পরপর = আগের G এর কাজ।");
        }
      });
  };
  const gridT = run.running ? run.t * 2 : phase === 3 ? 2 : -1;
  const at: XY = gridT >= 0 ? twoStage(Z, W, gridT)(DOT0) : X2_STOPS[Math.min(phase, 2)];
  const inZ = run.running ? run.t < 0.5 : phase === 1;
  const inW = run.running ? run.t >= 0.5 : phase === 2;
  return (
    <>
      <div className="mb-2 flex flex-wrap justify-center gap-1.5">
        <LJ_Chip label="Z, খোপে" cols={Z} tint={Z_HEX} on={inZ} />
        <LJ_Chip label="W, রিনার হাতে" cols={W} tint={W_HEX} on={inW} />
      </div>
      <LJ_Wall label="দেয়ালে রিনার চকের দাগ (1, 1); আলো আগে Z, তারপর W এর ভেতর দিয়ে যায়; (3, 3) এ কাল রাতের lens এর দাগ" lit={gridT >= 0 ? <LightGrid f={F} move={twoStage(Z, W, gridT)} t={1} /> : null}>
        <LJ_Chalk at={DOT0} />
        <LJ_Ring at={[3, 3]} label="কাল রাতে" />
        {phase >= 1 && gridT < 0 && <LJ_Hop a={X2_STOPS[0]} b={X2_STOPS[1]} tone="#b45309" />}
        {phase >= 2 && gridT < 0 && <LJ_Hop a={X2_STOPS[1]} b={X2_STOPS[2]} tone="#7c3aed" />}
        {gridT >= 0 ? <LightDot f={F} at={at} /> : <LJ_Glide at={at} beam={hop.running} />}
      </LJ_Wall>
      <div className="mt-2 flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="text-xs text-muted">dot, দেয়ালের ঘরে</div>
          <div className="font-mono text-base font-bold text-cat-amber">
            <Tup v={phase >= 3 ? X2_STOPS[2] : X2_STOPS[Math.min(phase, 2)]} of={WALL_SLOTS} />
          </div>
        </div>
        <button type="button" className={phase === 3 ? quietBtn : primaryBtn} disabled={hop.running || run.running} onClick={go}>
          {phase === 0 ? "Z দিয়ে চালান" : phase === 1 ? "এবার W দিয়ে" : phase === 2 ? "পুরা দেয়াল চালান" : "আবার দেখুন"}
        </button>
      </div>
      <Task done={phase === 3}>
        {phase < 2 ? "রিনার দাগের dot টা আগে Z, তারপর W দিয়ে চালান। কোথায় থামে দেখুন।" : "এবার শুধু একটা dot না, পুরা দেয়ালের grid চালান।"}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Karim's and Nasib's cards on the app. The dashed blue grid and the ring
//     at (3, 3) are what the two lenses do together; a card's grid runs over
//     it and Rina's dot lands off the ring, a red gap to it. Both must be tried.

const X3_CARDS: { who: string; cols: Cols }[] = [
  { who: "করিমের W + Z", cols: SUM },
  { who: "নাসিবের ঘরে ঘরে গুণ", cols: CELL },
];
const X3_NOPE = [
  "করিমের lens dot টা পাঠালো (1, 5) এ। দুই lens পরপর পাঠায় (3, 3) এ। পুরা grid ও অন্য দিকে হেলে গেলো।",
  "নাসিবের lens dot টা পাঠালো (1, 3) এ। (3, 3) থেকে দুই ঘর বামে। Grid ও মিললো না।",
];

export function TryTheCards() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [tried, setTried] = useSeed<boolean[]>("tried", [false, false]);
  const run = useLensRun(1500, 30);
  const choose = (i: number) => {
    if (run.running) return;
    setPick(i);
    run.run(() => {
      const nt = tried.map((v, j) => v || j === i);
      setTried(nt);
      if (nt.every(Boolean) && !tried.every(Boolean)) pass("যোগও না, ঘরে ঘরে গুণও না।");
    });
  };
  const cols = pick === null ? null : X3_CARDS[pick].cols;
  const t = run.running ? run.t : pick !== null ? 1 : 0;
  const at: XY = cols ? partway(byCols(cols), t)(DOT0) : DOT0;
  const settled = cols && !run.running;
  return (
    <>
      <LJ_Wall label="নীল দাগের grid: দুই lens পরপর যা করে; card এর lens চালালে তার grid আর রিনার dot কোথায় যায়" lit={cols ? <LightGrid f={F} move={byCols(cols)} t={t} /> : null}>
        <LJ_Ghost cols={WZ} />
        <LJ_Chalk at={DOT0} />
        <LJ_Ring at={[3, 3]} label="দুই lens পরপর" />
        {settled && <LJ_Gap a={at} b={[3, 3]} />}
        <LightDot f={F} at={at} />
      </LJ_Wall>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {X3_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={tried[i] && !(run.running && pick === i) ? "wrong" : pick === i ? "picked" : "idle"} disabled={run.running} onClick={() => choose(i)}>
            <span className="flex flex-col items-start gap-1 text-sm leading-tight">
              <LensCard cols={c.cols} small />
              <span className="text-xs">{c.who}</span>
            </span>
          </Choice>
        ))}
      </div>
      {settled && pick !== null && <Nope key={`${pick}${tried.join()}`}>{X3_NOPE[pick]}</Nope>}
      <Task done={tried.every(Boolean)}>দুইটা card ই app এ চালান। নীল দাগের সাথে মিলে কি না দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Predict, then follow the ropes. How few dots pin the whole one-lens
//     move? One dot, (1, 1): two different grids both take it to (3, 3), so
//     it can't tell them apart. Every square: works, but the count runs up.
//     e₁ and e₂ (6.3's ropes): right. Then the reader sends each rope's end
//     through Z, then W: e₁ → (−1, 2) → (2, 1), e₂ → (1, 1) → (1, 2).

const X4_OPTS = ["একটা dot, (1, 1)", "দুইটা: e₁ আর e₂", "সব ঘরের dot"];
const X4_RIGHT = 1;
/** another lens that also takes (1, 1) to (3, 3): three times bigger */
const X4_OTHER: Cols = [
  [3, 0],
  [0, 3],
];
const X4_ALL: XY[] = (() => {
  const out: XY[] = [];
  for (let y = -2; y <= 6; y += 1)
    for (let x = -3; x <= 9; x += 1) {
      const p = apply(WZ, [x, y]);
      if (p[0] >= -3 && p[0] <= 9 && p[1] >= -2 && p[1] <= 6) out.push(p);
    }
  return out;
})();
const X4_NOPE = [
  "একটা dot এ হয় না। নীল grid আর লাল grid, দুইটাই (1, 1) কে (3, 3) এ পাঠায়। বাকি দেয়াল দুই রকম। কোনটা ঠিক, এক dot বলতে পারে না।",
  "",
  `হলো ঠিকই। কিন্তু ${X4_ALL.length} টা dot চালাতে হলো। এত লাগে না। 6.3 এ দুইটা দড়ি দিয়েই পুরা আলপনা বসেছিল।`,
];
const X4_ROPES: { e: XY; name: string; tone: "amber" | "teal" }[] = [
  { e: E1, name: "e₁", tone: "amber" },
  { e: E2, name: "e₂", tone: "teal" },
];

function X4_Icon({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 40 30" className="h-7 w-auto shrink-0" aria-hidden="true">
      <rect x={0} y={0} width={40} height={30} rx={3} fill="#e9e4d8" />
      {i === 0 && <circle cx={20} cy={14} r={3} fill="#fde047" stroke="#f59e0b" />}
      {i === 1 && (
        <>
          <path d="M8 24H22" stroke={KNOB_HEX[1]} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M8 24V10" stroke={KNOB_HEX[2]} strokeWidth={2.6} strokeLinecap="round" />
        </>
      )}
      {i === 2 &&
        [6, 14, 22, 30].flatMap((x) => [7, 15, 23].map((y) => <circle key={`${x}${y}`} cx={x + 2} cy={y} r={1.6} fill="#f59e0b" />))}
    </svg>
  );
}

export function FollowTheRopes() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ok, setOk] = useSeed("ok", false);
  const [sent, setSent] = useSeed<boolean[]>("sent", [false, false]);
  const [cur, setCur] = useState<number | null>(null);
  const [miss, setMiss] = useState(0);
  const act = usePlay(90);
  const rope = usePlay(750);
  const N = guess === 2 ? 24 : 12;
  const choose = (i: number) => {
    if (act.running || ok) return;
    setGuess(i);
    act.play(i === 2 ? 24 : 12, () => (i === X4_RIGHT ? setOk(true) : setMiss((m) => m + 1)));
  };
  const send = (j: number) => {
    if (rope.running || sent[j]) return;
    setCur(j);
    rope.play(2, () => {
      const ns = sent.map((v, q) => v || q === j);
      setSent(ns);
      setCur(null);
      if (ns.every(Boolean)) pass("দুই দড়ির মাথা দুইবার সরালেই পুরা move।");
    });
  };
  const t = guess === null ? 0 : act.running ? act.k / N : 1;
  const wrong = guess !== null && guess !== X4_RIGHT && !act.running;
  const stage = (j: number) => (sent[j] ? 2 : cur === j ? rope.k : -1);
  return (
    <>
      <LJ_Wall label="দেয়াল; খুঁটির পেরেক থেকে দুইটা দড়ি, e₁ ডানে এক ঘর, e₂ উপরে এক ঘর; দড়ির মাথা আগে Z, তারপর W দিয়ে সরে">
        {!ok && guess === 0 && (
          <>
            <LJ_Ghost cols={GOOD_LENS} t={t} />
            <LJ_Ghost cols={X4_OTHER} t={t} tone={RED} />
            <LJ_Ring at={[3, 3]} />
            <LightDot f={F} at={partway(byCols(GOOD_LENS), t)(DOT0)} />
          </>
        )}
        {!ok && guess === 2 && (
          <>
            {X4_ALL.slice(0, Math.round(t * X4_ALL.length)).map((p) => (
              <circle key={`${p[0]},${p[1]}`} cx={F.sx(p[0])} cy={F.sy(p[1])} r={2.6} fill="#f59e0b" className="pointer-events-none" />
            ))}
            <text x={F.sx(-2.6)} y={F.sy(5.2)} fontSize={13} fontWeight={800} fontFamily="ui-monospace, monospace" fill={INK}>
              {Math.round(t * X4_ALL.length)}
            </text>
          </>
        )}
        {(ok || (guess === X4_RIGHT && act.running)) &&
          X4_ROPES.map((r, j) => {
            const st = stage(j);
            const a = r.e;
            const b = apply(Z, r.e);
            const c = apply(W, b);
            return (
              <g key={r.name}>
                <Arrow f={F} from={[0, 0]} to={a} tone={r.tone} w={st >= 1 ? 1.6 : 2.8} faint={st >= 1} draw={!ok} />
                {st >= 1 && <LJ_Hop a={a} b={b} tone="#b45309" />}
                {st === 1 && <Arrow key="z" f={F} from={[0, 0]} to={b} tone={r.tone} w={2.8} draw />}
                {st >= 2 && (
                  <>
                    <circle cx={F.sx(b[0])} cy={F.sy(b[1])} r={2.4} fill={KNOB_HEX[(j + 1) as 1 | 2]} opacity={0.6} className="pointer-events-none" />
                    <LJ_Hop a={b} b={c} tone="#7c3aed" />
                    <Arrow key="w" f={F} from={[0, 0]} to={c} tone={r.tone} w={2.8} draw={cur === j} />
                  </>
                )}
              </g>
            );
          })}
      </LJ_Wall>
      {!ok ? (
        <>
          <div className="mt-2 text-center text-sm">সবচেয়ে কম কয়টা dot চালালে এক lens এর পুরা move জানা যায়?</div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {X4_OPTS.map((o, i) => (
              <Choice key={o} n={i} look={guess === i && !act.running ? (i === X4_RIGHT ? "right" : "wrong") : guess === i ? "picked" : "idle"} disabled={act.running} onClick={() => choose(i)}>
                <span className="flex flex-col items-start gap-1 text-xs leading-tight">
                  <X4_Icon i={i} />
                  {o}
                </span>
              </Choice>
            ))}
          </div>
          {wrong && <Nope key={miss}>{X4_NOPE[guess]}</Nope>}
        </>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {X4_ROPES.map((r, j) => {
            const st = stage(j);
            const b = apply(Z, r.e);
            const c = apply(W, b);
            return (
              <div key={r.name} className="flex flex-col items-center gap-1">
                <button type="button" className={sent[j] ? quietBtn : primaryBtn} disabled={sent[j] || rope.running} onClick={() => send(j)}>
                  {r.name} পাঠান
                </button>
                <div className={`h-5 font-mono text-xs ${r.tone === "amber" ? "text-cat-amber" : "text-cat-teal"}`}>
                  <Tup v={r.e} of={WALL_SLOTS} />
                  {st >= 1 && (
                    <span className={FADE}>
                      {" → "}
                      <Tup v={b} of={WALL_SLOTS} />
                    </span>
                  )}
                  {st >= 2 && (
                    <span className={FADE}>
                      {" → "}
                      <b>
                        <Tup v={c} of={WALL_SLOTS} />
                      </b>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Task done={sent.every(Boolean)}>
        {ok ? "দুইটা দড়ির মাথাই পাঠান: আগে Z, তারপর W। কোথায় থামে দেখুন।" : "আগে guess: কম করে কয়টা dot চালালেই চলে? বেছে নিন।"}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Stand the ends up as columns. The two rope ends, (2, 1) amber and (1, 2)
//     teal, are chips; tapping one drops it into the next empty column of the
//     one lens. Then run it over the dashed "both lenses" grid: the right order
//     matches line for line; the swapped order runs a grid that misses.

const X5_ENDS: { v: XY; name: string; tone: 1 | 2 }[] = [
  { v: apply(W, apply(Z, E1)), name: "e₁ এর মাথা", tone: 1 },
  { v: apply(W, apply(Z, E2)), name: "e₂ এর মাথা", tone: 2 },
];

export function LensByColumns() {
  const pass = useGate();
  const [placed, setPlaced] = useSeed<number[]>("placed", []);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1500, 30);
  const lens: Cols | null = placed.length === 2 ? [X5_ENDS[placed[0]].v, X5_ENDS[placed[1]].v] : null;
  const right = lens !== null && sameCols(lens, WZ);
  const put = (i: number) => {
    if (run.running || ran || placed.includes(i) || placed.length >= 2) return;
    setPlaced([...placed, i]);
  };
  const go = () => {
    if (!lens || run.running) return;
    run.run(() => {
      setRan(true);
      if (sameCols(lens, WZ)) pass("WZ এর column = Z এর column, W দিয়ে চালানো।");
      else setMiss((m) => m + 1);
    });
  };
  const again = () => {
    setPlaced([]);
    setRan(false);
  };
  const t = run.running ? run.t : ran ? 1 : 0;
  return (
    <>
      <LJ_Wall label="নীল দাগের grid: দুই lens পরপর; দুই দড়ির মাথা (2, 1) আর (1, 2); বানানো lens চালালে তার grid" lit={lens && t > 0 ? <LightGrid f={F} move={byCols(lens)} t={t} /> : null}>
        <LJ_Ghost cols={WZ} />
        {X5_ENDS.map((e) => (
          <Arrow key={e.name} f={F} from={[0, 0]} to={e.v} tone={e.tone === 1 ? "amber" : "teal"} w={2.6} />
        ))}
      </LJ_Wall>
      <div className="mt-2 flex items-center justify-center gap-3">
        <div className="flex flex-col gap-1.5">
          {X5_ENDS.map((e, i) => (
            <button
              key={e.name}
              type="button"
              disabled={placed.includes(i) || run.running || ran}
              onClick={() => put(i)}
              className={`cursor-pointer rounded-lg border-2 px-2 py-1 text-xs transition-opacity duration-300 disabled:cursor-default disabled:opacity-30 motion-reduce:transition-none ${e.tone === 1 ? "border-cat-amber text-cat-amber" : "border-cat-teal text-cat-teal"}`}
            >
              {e.name} <span className="font-mono font-bold">{`(${e.v[0]}, ${e.v[1]})`}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center">
          <div className="text-xs text-muted">এক lens</div>
          <div className="flex items-stretch font-mono text-base font-bold">
            <span className="w-1.5 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
            {[0, 1].map((c) => {
              const i = placed[c];
              const e = i === undefined ? null : X5_ENDS[i];
              return (
                <span key={c} className={`mx-0.5 flex w-8 flex-col items-center rounded-md ${e ? (e.tone === 1 ? "text-cat-amber" : "text-cat-teal") : "border-2 border-dashed border-cat-blue/40 text-cat-blue/60"}`}>
                  {e ? (
                    <span key={i} className={`${POP} flex flex-col items-center`}>
                      <span>{e.v[0]}</span>
                      <span>{e.v[1]}</span>
                    </span>
                  ) : (
                    <>
                      <span>?</span>
                      <span>?</span>
                    </>
                  )}
                </span>
              );
            })}
            <span className="w-1.5 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
          </div>
          <div className="text-[0.7rem] text-muted">column 1 · column 2</div>
        </div>
        {ran && !right ? (
          <button type="button" className={quietBtn} onClick={again}>
            আবার বসান
          </button>
        ) : (
          <button type="button" className={primaryBtn} disabled={!lens || run.running || ran} onClick={go}>
            চালান
          </button>
        )}
      </div>
      {ran && !right && <Nope key={miss}>Grid মিললো না। Amber আর সবুজ লাইন উল্টা দিকে গেলো। প্রথম column এ বসে e₁ এর মাথা।</Nope>}
      <Task done={ran && right}>দুই দড়ির মাথা এক lens এর দুই column এ বসান। তারপর চালিয়ে নীল দাগের সাথে মেলান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Row meets column. W (rows) and Z (columns) side by side, WZ blank. Tap a
//     blank cell: W's row i lights blue, Z's column j amber, and the 4.1 box
//     runs row · column into the cell. All four fill: [[2, 1], [1, 2]].

const X6_WR = rowsOf(W);
const X6_ZR = rowsOf(Z);
const X6_WZR = rowsOf(WZ);

export function RowMeetsColumn() {
  const pass = useGate();
  const [filled, setFilled] = useSeed<boolean[]>("filled", [false, false, false, false]);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const box = usePlay(700);
  const tap = (c: number) => {
    if (box.running || filled[c]) return;
    setCur(c);
    box.play(3, () => {
      const nf = filled.map((v, q) => v || q === c);
      setFilled(nf);
      if (nf.every(Boolean)) pass("ঘর (i, j) = W এর row i · Z এর column j.");
    });
  };
  const i = cur === null ? -1 : Math.floor(cur / 2);
  const j = cur === null ? -1 : cur % 2;
  const k = cur === null ? 0 : box.running ? box.k : 3;
  const cells = X6_WZR.map((row, r) => row.map((v, c) => (filled[r * 2 + c] ? v : null)));
  return (
    <>
      <div className="flex items-center justify-center gap-1.5">
        <LJ_M cells={X6_WR} hiRow={i} label="W" />
        <span className="text-lg text-muted">·</span>
        <LJ_M cells={X6_ZR} hiCol={j} colTone label="Z" />
        <span className="text-lg text-muted">=</span>
        <LJ_M cells={cells} onCell={tap} cur={cur ?? -1} disabled={box.running} label="WZ" />
      </div>
      <div className="mt-3 h-5 text-center text-sm">
        {cur !== null && (
          <span key={cur} className={FADE}>
            W এর <b className="text-cat-blue">row {i + 1}</b> · Z এর <b className="text-cat-amber">column {j + 1}</b>
          </span>
        )}
      </div>
      <div className="mt-2 min-h-24">{cur !== null && <DotBox key={cur} a={X6_WR[i]} b={Z[j]} k={k} dense={false} />}</div>
      <Task done={filled.every(Boolean)}>WZ এর একটা ফাঁকা ঘরে tap করুন। W এর row আর Z এর column মিলে ঘরটা ভরবে। চারটা ঘরই ভরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Why this rule. Three tiles; each tap acts one reason out in the picture
//     above: (a) the one lens does both — two hops and one hop land together;
//     (b) Z's output is W's input — two numbers out, two numbers in; (c) each
//     cell is a row · column — the cells light one by one.

const X7_TILES = ["দুইটা কাজ, এক lens", "Z যা দেয়, W তা নেয়", "প্রতিটা ঘর row · column"];
const X7_SAY = [
  ["রিনার dot, (1, 1)।", "Z এর পরে (0, 3)।", "W এর পরে (3, 3)।", "WZ এক লাফেই (3, 3)। দুইটা কাজ একসাথে।"],
  ["Z আর W, দুইটা বাক্স।", "(1, 1) ঢুকলো Z এ।", "Z বের করলো দুইটা সংখ্যা, (0, 3)। W এর মুখও দুইটা।", "W দিলো (3, 3)। মাপ মিললো বলেই জোড়া লাগলো।"],
  ["WZ, চারটা ঘর।", "row 1 · column 1 = 2.", "row 2 · column 1 = 1.", "বাকি দুইটাও একই ভাবে। এর বাইরে কিছু নাই।"],
];

function X7_Pipe({ k }: { k: number }) {
  const txt = (x: number, y: number, s: string, show: boolean, tone: string) =>
    show ? (
      <text x={x} y={y} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily="ui-monospace, monospace" fill={tone} className={POP}>
        {s}
      </text>
    ) : null;
  return (
    <svg viewBox="0 0 260 90" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="Z আর W দুইটা বাক্স; Z থেকে দুইটা তার W তে ঢোকে">
      <rect width={260} height={90} rx={8} fill="white" />
      {[36, 54].map((y) => (
        <g key={y}>
          <path d={`M10 ${y}H70`} stroke="#94a3b8" strokeWidth={2} />
          <path d={`M110 ${y}H150`} stroke={k >= 2 ? "#f59e0b" : "#94a3b8"} strokeWidth={2.4} className="transition-colors duration-500 motion-reduce:transition-none" />
          <path d={`M190 ${y}H250`} stroke="#94a3b8" strokeWidth={2} />
        </g>
      ))}
      <rect x={70} y={24} width={40} height={42} rx={6} fill={Z_HEX} stroke={INK} />
      <text x={90} y={50} textAnchor="middle" fontSize={15} fontWeight={800} fill={INK}>
        Z
      </text>
      <rect x={150} y={24} width={40} height={42} rx={6} fill={W_HEX} stroke={INK} />
      <text x={170} y={50} textAnchor="middle" fontSize={15} fontWeight={800} fill={INK}>
        W
      </text>
      {txt(38, 20, "(1, 1)", k >= 1, INK)}
      {txt(130, 20, "(0, 3)", k >= 2, "#b45309")}
      {txt(222, 20, "(3, 3)", k >= 3, BLUE)}
      {k >= 2 && (
        <text x={130} y={80} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={INK} className={FADE}>
          দুইটা তার
        </text>
      )}
    </svg>
  );
}

function X7_Picture({ tile, k }: { tile: number; k: number }) {
  if (tile === 0)
    return (
      <LJ_Wall f={FIG_F} label="রিনার dot দুই lens এ দুই লাফে (3, 3) এ; WZ এক লাফে একই জায়গায়" width="max-w-[15rem]">
        <LJ_Chalk f={FIG_F} at={DOT0} />
        {k >= 1 && <LJ_Hop f={FIG_F} a={DOT0} b={[0, 3]} tone="#b45309" />}
        {k >= 2 && <LJ_Hop f={FIG_F} a={[0, 3]} b={[3, 3]} tone="#7c3aed" />}
        {k >= 3 && <Arrow f={FIG_F} from={DOT0} to={[3, 3]} tone="blue" w={2.4} draw />}
        <LJ_Glide f={FIG_F} at={k === 0 ? DOT0 : k === 1 ? [0, 3] : [3, 3]} />
      </LJ_Wall>
    );
  if (tile === 1) return <X7_Pipe k={k} />;
  const order = [0, 2, 1, 3];
  const shown = k === 0 ? 0 : k === 1 ? 1 : k === 2 ? 2 : 4;
  const cur = k >= 1 && k <= 2 ? order[k - 1] : -1;
  const cells = X6_WZR.map((row, r) => row.map((v, c) => (order.slice(0, shown).includes(r * 2 + c) ? v : null)));
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      <LJ_M cells={X6_WR} hiRow={cur < 0 ? -1 : Math.floor(cur / 2)} label="W" />
      <span className="text-lg text-muted">·</span>
      <LJ_M cells={X6_ZR} hiCol={cur < 0 ? -1 : cur % 2} colTone label="Z" />
      <span className="text-lg text-muted">=</span>
      <LJ_M cells={cells} cur={cur} label="WZ" />
    </div>
  );
}

export function WhyThisRule() {
  const pass = useGate();
  const [seen, setSeen] = useSeed<boolean[]>("seen", [false, false, false]);
  const [open, setOpen] = useSeed<number | null>("open", null);
  const act = usePlay(1100);
  const tap = (i: number) => {
    if (act.running) return;
    setOpen(i);
    act.play(3, () => {
      const ns = seen.map((v, q) => v || q === i);
      setSeen(ns);
      if (ns.every(Boolean) && !seen.every(Boolean)) pass("Rule টা বানানো হয়নি, বের হয়ে এসেছে।");
    });
  };
  const k = open === null ? 0 : act.running ? act.k : 3;
  return (
    <>
      <div className="min-h-[11rem]">
        {open === null ? (
          <div className="grid h-[11rem] place-items-center text-sm text-muted">নিচের তিনটা কারণ, একটা একটা করে খুলুন।</div>
        ) : (
          <div key={open} className={FADE}>
            <X7_Picture tile={open} k={k} />
            <div className="mx-auto mt-2 min-h-10 max-w-xs text-center text-sm leading-snug text-muted">{say(X7_SAY[open], k)}</div>
          </div>
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X7_TILES.map((o, i) => (
          <Choice key={o} n={i} look={open === i ? "picked" : seen[i] ? "right" : "idle"} disabled={act.running} onClick={() => tap(i)}>
            <span className="text-xs leading-tight">{o}</span>
          </Choice>
        ))}
      </div>
      <Task done={seen.every(Boolean)}>এত ঝামেলার নিয়মটাই কেন? তিনটা কারণই tap করে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn. New spares: S, the 6.7 shear [[1, 1], [0, 1]], goes first;
//     D, twice as wide [[2, 0], [0, 1]], after. The reader dials the one lens
//     (four steppers, laid out as the matrix) and runs it: the two lenses'
//     grid appears dashed alongside. Right: DS = [[2, 2], [0, 1]]. Wrong: the
//     rope ends that miss get a ring where they should be, and a Nope.

const S_LENS: Cols = [
  [1, 0],
  [1, 1],
];
const D_LENS: Cols = [
  [2, 0],
  [0, 1],
];
const DS = onto(D_LENS, S_LENS);

export function YourOneLens() {
  const pass = useGate();
  const [m, setM] = useSeed<number[]>("m", [1, 0, 0, 1]); // column 1 (x, y), column 2 (x, y)
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1600, 32);
  const lens: Cols = [
    [m[0], m[1]],
    [m[2], m[3]],
  ];
  const ok = ran && sameCols(lens, DS);
  const set = (i: number, v: number) => {
    if (run.running || ok) return;
    setM(m.map((q, j) => (j === i ? v : q)));
    setRan(false);
  };
  const go = () => {
    if (run.running || ok) return;
    setRan(false);
    run.run(() => {
      setRan(true);
      if (sameCols(lens, DS)) pass("দড়ি ধরে এক lens: আগে S, তারপর D।");
      else setMiss((q) => q + 1);
    });
  };
  const t = run.running ? run.t : ran ? 1 : 0;
  const bad = [!same(lens[0], DS[0]), !same(lens[1], DS[1])];
  const nope = bad[0] && bad[1] ? "দুইটা লাইনের কোনোটাই মিললো না। দুই দড়ির মাথা আগে S, তারপর D দিয়ে পাঠিয়ে দেখুন, কোথায় থামে।" : bad[0] ? "Amber লাইন মিললো না। e₁ এর মাথা যেখানে থামার কথা, সেখানে নীল গোল দাগ। Column 1 ঠিক করুন।" : "সবুজ লাইন মিললো না। e₂ এর মাথা যেখানে থামার কথা, সেখানে নীল গোল দাগ। Column 2 ঠিক করুন।";
  return (
    <>
      <div className="mb-2 flex flex-wrap justify-center gap-1.5">
        <LJ_Chip label="আগে S, হেলানো" cols={S_LENS} tint={Z_HEX} />
        <LJ_Chip label="পরে D, চওড়া" cols={D_LENS} tint={W_HEX} />
      </div>
      <LJ_Wall label="আপনার এক lens এর grid; পাশে নীল দাগে দুই lens পরপর যা করে" lit={t > 0 ? <LightGrid f={F} move={byCols(lens)} t={t} /> : null}>
        {t > 0 && <LJ_Ghost cols={DS} t={t} />}
        {ran && !ok && bad[0] && <LJ_Ring at={DS[0]} />}
        {ran && !ok && bad[1] && <LJ_Ring at={DS[1]} />}
      </LJ_Wall>
      <div className="mt-2 flex items-center justify-center gap-2">
        <div className="flex items-stretch">
          <span className="w-1.5 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
          <div className="grid grid-cols-2 gap-x-1 gap-y-1 p-1">
            {[0, 2, 1, 3].map((i) => (
              <div key={i} className={`rounded-full ${i < 2 ? "ring-2 ring-cat-amber/50" : "ring-2 ring-cat-teal/50"}`}>
                <Stepper value={m[i]} onChange={(v) => set(i, v)} min={-3} max={4} disabled={run.running || ok} label={`column ${i < 2 ? 1 : 2} এর ${i % 2 ? "নিচের" : "উপরের"} সংখ্যা`} />
              </div>
            ))}
          </div>
          <span className="w-1.5 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
        </div>
        <button type="button" className={primaryBtn} disabled={run.running || ok} onClick={go}>
          চালান
        </button>
      </div>
      {ran && !ok && <Nope key={miss}>{nope}</Nope>}
      <Task done={ok}>আগে S, তারপর D। দুইটার কাজ একটা lens এ লিখুন, তারপর চালিয়ে নীল দাগের সাথে মেলান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it. First lens A = [[1, 0], [2, 1]], then B = [[1, 1], [0, 2]]; the
//     one lens BA = [[3, 1], [?, 2]]. Three picks for the blank: 2, 4, 0. A
//     pick draws the one lens's e₁ to (3, pick); then the two lenses carry e₁
//     for real, (1, 0) → (1, 2) → (3, 4). Match: a green ring. Miss: a red gap.

const A_LENS: Cols = [
  [1, 2],
  [0, 1],
];
const B_LENS: Cols = [
  [1, 0],
  [1, 2],
];
const BA = onto(B_LENS, A_LENS); // [[3, 1], [4, 2]]
const X9_ROWS = rowsOf(BA);
const X9_OPTS = [2, 4, 0];
const X9_RIGHT = 1;
const X9_NOPE = [
  "Dot থামলো (3, 2) এ। কিন্তু দুই lens পরপর e₁ কে নিলো (3, 4) এ। ঘরটা row 2, column 1 এর: B এর row 2, A এর column 1.",
  "",
  "Dot থামলো (3, 0) এ, পেরেকের সারিতে। 0 আসে ঘরে ঘরে গুণ করলে, 0 × 2। দুই lens পরপর e₁ যায় (3, 4) এ।",
];
const X9_MID = apply(A_LENS, E1);
const X9_END = apply(B_LENS, X9_MID);

export function TryOneCell() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(90);
  const choose = (i: number) => {
    if (play.running || pick === X9_RIGHT) return;
    setPick(i);
    play.play(20, () => (i === X9_RIGHT ? pass("ঘরটা B এর row 2 · A এর column 1.") : setMiss((q) => q + 1)));
  };
  const k = pick === null ? 0 : play.running ? play.k : 20;
  const mine: XY | null = pick === null ? null : [3, X9_OPTS[pick]];
  const u = Math.min(1, k / 7);
  const tip: XY | null = mine ? [mine[0] * u, mine[1] * u] : null;
  const done = pick !== null && !play.running;
  return (
    <>
      <div className="flex items-center justify-center gap-1.5">
        <LJ_M cells={rowsOf(B_LENS)} label="পরে B" />
        <span className="text-lg text-muted">·</span>
        <LJ_M cells={rowsOf(A_LENS)} colTone label="আগে A" />
        <span className="text-lg text-muted">=</span>
        <LJ_M cells={X9_ROWS.map((row, r) => row.map((v, c) => (r === 1 && c === 0 ? (pick === null ? null : X9_OPTS[pick]) : v)))} cur={2} label="এক lens" />
      </div>
      <div className="mt-2">
        <LJ_Wall label="আপনার সংখ্যা দিলে এক lens e₁ কে যেখানে নেয়; তারপর দুই lens পরপর e₁ কে যেখানে নেয়">
          {mine && tip && (tip[0] !== 0 || tip[1] !== 0) && <Arrow f={F} from={[0, 0]} to={tip} tone="violet" w={2.6} list={`(3, ${sg(mine[1])})`} />}
          {k >= 8 && <Arrow f={F} from={[0, 0]} to={E1} tone="amber" w={2.2} />}
          {k >= 11 && <LJ_Hop a={E1} b={X9_MID} tone="#b45309" />}
          {k >= 15 && <LJ_Hop a={X9_MID} b={X9_END} tone="#7c3aed" />}
          {k >= 8 && <LightDot f={F} at={k < 11 ? E1 : k < 15 ? X9_MID : X9_END} />}
          {done && mine && (same(mine, X9_END) ? <LJ_Ring at={X9_END} tone={GREEN} /> : <LJ_Gap a={mine} b={X9_END} />)}
        </LJ_Wall>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X9_OPTS.map((v, i) => {
          const look: Look = pick === i && !play.running ? (i === X9_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle";
          return (
            <Choice key={v} n={i} look={look} disabled={play.running || pick === X9_RIGHT} onClick={() => choose(i)}>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-lg font-bold">{v}</span>
                <svg viewBox="0 0 26 26" className="h-6 w-auto" aria-hidden="true">
                  <path d="M3 23H23M3 23V3" stroke="#cbd5e1" strokeWidth={1} />
                  <path d={`M3 23L${3 + 3 * 4.5} ${23 - v * 4.5}`} stroke="#7c3aed" strokeWidth={2.2} strokeLinecap="round" />
                </svg>
              </span>
            </Choice>
          );
        })}
      </div>
      {done && pick !== X9_RIGHT && pick !== null && <Nope key={miss}>{X9_NOPE[pick]}</Nope>}
      <Task done={done && pick === X9_RIGHT}>ফাঁকা ঘরে কোন সংখ্যা? বেছে নিন। Dot যেখানে থামে, দুই lens ও কি e₁ কে সেখানে নেয়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. Noon in the উঠান; the wall at the left (StageWall at (16, 30))
// where a scene needs it, the machine on its stand at the right.

const SW: [number, number] = [16, 30];
const onStage = (p: XY): [number, number] => [SW[0] + STAGE_WALL_F.sx(p[0]), SW[1] + STAGE_WALL_F.sy(p[1])];
const PJ: [number, number] = [262, 150];

/** the half-built হলুদের মঞ্চ: bamboo poles, a yellow cloth half hung, a low platform */
function LJ_Mancha({ x, done = false }: { x: number; done?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={138} width={96} height={12} fill="#a16207" />
      {[0, 94].map((dx) => (
        <path key={dx} d={`M${x + dx + 1} 138V70`} stroke="#b08d3c" strokeWidth={3} strokeLinecap="round" />
      ))}
      <path d={`M${x} 72H${x + 96}`} stroke="#b08d3c" strokeWidth={3} strokeLinecap="round" />
      <path d={done ? `M${x + 2} 73H${x + 94}V100Q${x + 48} 112 ${x + 2} 100Z` : `M${x + 2} 73H${x + 50}V96Q${x + 26} 106 ${x + 2} 96Z`} fill="#facc15" opacity={0.9} />
      {done &&
        [12, 30, 48, 66, 84].map((dx) => (
          <g key={dx}>
            <path d={`M${x + dx} 74V${92 + (dx % 3) * 4}`} stroke="#f97316" strokeWidth={1.2} />
            <circle cx={x + dx} cy={93 + (dx % 3) * 4} r={2.6} fill="#f97316" />
          </g>
        ))}
    </g>
  );
}

/** a মাদুর with হলুদের বাটি on it */
function LJ_Madur({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 26} ${y + 2}L${x - 20} ${y - 8}H${x + 20}L${x + 26} ${y + 2}Z`} fill="#d6b98c" stroke="#a16207" strokeWidth={0.6} />
      {[-12, 0, 12].map((dx) => (
        <g key={dx}>
          <path d={`M${x + dx - 5} ${y - 7}Q${x + dx} ${y - 1} ${x + dx + 5} ${y - 7}Z`} fill="#e7e5e4" stroke="#78716c" strokeWidth={0.5} />
          <ellipse cx={x + dx} cy={y - 7} rx={4.5} ry={1.2} fill="#eab308" />
        </g>
      ))}
    </g>
  );
}

/** Samin's phone, at his hand */
function LJ_Phone({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 3.5} y={y - 6} width={7} height={11} rx={1.2} fill="#1e293b" />
      <rect x={x - 2.5} y={y - 5} width={5} height={8} rx={0.6} fill="#93c5fd" />
    </g>
  );
}

// 1a · Noon on the day of গায়ে হলুদ. The half-built stage, the হলুদের বাটি on
//      the মাদুর, the machine with its slot empty. The লাইট ভাই holds the two
//      spares up to the sun, and says it can't be done.

export function NoonSpares({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="গায়ে হলুদের দুপুর; উঠানে আধা বানানো মঞ্চ, মাদুরে হলুদের বাটি; যন্ত্রের খোপ খালি; লাইট ভাই দুইটা ছোট কাঁচ রোদের দিকে তুলে ধরলেন; বললেন দুইটা কাঁচ, এক খোপ, দুইটার কাজ একটায় হয় না">
        <LJ_Mancha x={14} />
        <LJ_Madur x={140} y={152} />
        <Projector x={214} y={150} lens="empty" />
        <LightBhai x={280} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && (
          <g className={POP}>
            <LJ_Glass x={258} y={104} which="Z" r={5.5} />
            <LJ_Glass x={268} y={96} which="W" r={5.5} />
          </g>
        )}
        {k === 2 && <Bubble x={280} y={84} side="left" lines={["দুইটা কাঁচ,", "এক খোপ।"]} />}
        {k >= 3 && <Bubble x={280} y={84} side="left" lines={["দুইটার কাজ", "একটায় হয় না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1b · Four answers, one after the other: Karim, Nasib, Som, Samin (phone in
//      hand, the machine's app open).

const FI_SAY: { who: "karim" | "nasib" | "som" | "samin"; x: number; lines: string[]; side: "left" | "mid" | "right" }[] = [
  { who: "karim", x: 44, lines: ["W + Z.", "যোগ করে দাও।"], side: "right" },
  { who: "nasib", x: 110, lines: ["ঘরে ঘরে গুণ।"], side: "mid" },
  { who: "som", x: 176, lines: ["একটায় হবে না।", "দুইটা লাগবেই।"], side: "mid" },
  { who: "samin", x: 250, lines: ["একটা matrix আছে।", "খুঁজে বের করতে হবে।"], side: "left" },
];

export function FourIdeas({}: Story) {
  const s = useScene(4, [600, 2200, 2200, 2400, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="উঠানে চারজন; করিম বললো W যোগ Z, নাসিব বললো ঘরে ঘরে গুণ, সোম বললো একটায় হবে না, সামিন ফোন হাতে বললো একটা matrix আছে, খুঁজে বের করতে হবে">
        <LJ_Madur x={290} y={152} />
        {FI_SAY.map((p, i) => (
          <Person key={p.who} who={p.who} x={p.x} y={150} facing={i < 2 ? 1 : -1} label arm={k === i + 1 ? "point" : p.who === "samin" ? "hold" : "down"} />
        ))}
        <LJ_Phone x={241} y={105} />
        {k >= 1 && <Bubble key={k} x={FI_SAY[k - 1].x} y={84} side={FI_SAY[k - 1].side} lines={FI_SAY[k - 1].lines} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · Z into the slot. Rina comes and holds W in front of the lens. The
//      light goes on; the লাইট ভাই asks who will hold it all night.

export function HandHeld({}: Story) {
  const s = useScene(4, [600, 1600, 1800, 1800, 2600]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="লাইট ভাই Z খোপে লাগালেন; রিনা W হাতে ধরে যন্ত্রের সামনে দাঁড়ালো; আলো জ্বললো; লাইট ভাই বললেন, সারা রাত কে ধরে রাখবে">
        <StageWall x={SW[0]} y={SW[1]}>{k >= 3 && <LightDot f={STAGE_WALL_F} at={[0, 0]} r={2.4} />}</StageWall>
        {k >= 3 && <StageBeam from={[lx - 12, ly]} to={onStage([0, 0])} />}
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" on={k >= 3} />
        {k >= 1 && k < 3 && (
          <g className={POP}>
            <LJ_Glass x={lx} y={ly} which="Z" r={5.5} />
          </g>
        )}
        <Person who="rina" x={k >= 2 ? 216 : 150} y={150} facing={1} walking={k === 2} label arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && (
          <g className={POP}>
            <LJ_Glass x={lx - 12} y={ly + 4} which="W" r={5.5} />
          </g>
        )}
        <LightBhai x={298} y={150} facing={-1} arm={k === 1 ? "hold" : "down"} />
        {k >= 4 && <Bubble x={298} y={84} side="left" lines={["সারা রাইত", "কে ধইরা রাখবো?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Rina with the chalk at the wall: every square would take till evening.
//      Som says not all of them.

export function SomNoAll({}: Story) {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="রিনা চক হাতে দেয়ালের সামনে; বললো সব ঘর চালাতে সন্ধ্যা হয়ে যাবে; সোম বললো সব লাগবে না">
        <StageWall x={SW[0]} y={SW[1]}>
          {[
            [1, 1],
            [2, 1],
            [3, 2],
          ].map((p) => (
            <circle key={`${p[0]}${p[1]}`} cx={STAGE_WALL_F.sx(p[0])} cy={STAGE_WALL_F.sy(p[1])} r={2.2} fill="none" stroke="white" strokeWidth={1.2} />
          ))}
        </StageWall>
        <Person who="rina" x={150} y={150} facing={-1} label arm="point" />
        <Person who="som" x={222} y={150} facing={-1} label arm={k >= 2 ? "point" : "down"} />
        <Projector x={286} y={150} lens="empty" />
        {k === 1 && <Bubble x={150} y={84} side="mid" lines={["সব ঘর চালাতে", "সন্ধ্যা হয়ে যাবে।"]} />}
        {k >= 2 && <Bubble x={222} y={84} side="mid" lines={["সব লাগবে না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 10a · সন্ধ্যা। The shop's new lens in the slot; the light grid and আপার three
//      hearts on the wall; the stage finished; আপা in yellow steps up.

export function HoludShow({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যা; দোকানের নতুন lens খোপে; দেয়ালে আলোর grid আর তিনটা heart; মঞ্চ তৈরি; হলুদ শাড়িতে আপা মঞ্চে উঠলো">
        <StageWall x={SW[0]} y={SW[1]} grid={false}>
          {k >= 1 && <LightGrid f={STAGE_WALL_F} move={byCols(GOOD_LENS)} />}
          {k >= 2 && (["door", "window", "tree"] as const).map((key) => <Heart key={key} f={STAGE_WALL_F} at={HEARTS[key]} lit />)}
        </StageWall>
        {k >= 1 && <StageBeam from={[lx, ly]} to={onStage([3, 2])} w={10} />}
        <Projector x={PJ[0]} y={PJ[1]} lens="good" on={k >= 1} />
        <rect x={40} y={140} width={110} height={10} fill="#a16207" />
        {k >= 3 && (
          <g className={POP}>
            <Person who="apa" x={96} y={140} />
            <path d="M88 118l8 -4l8 4l2 22h-20Z" fill="#facc15" opacity={0.85} />
          </g>
        )}
        <LightBhai x={298} y={150} facing={-1} />
        <Robot x={196} y={150} />
      </Stage>
    </StoryFrame>
  );
}

// 10b · The bridge to 7.4: late at night the লাইট ভাই, packing up, tries the
//      two spares the other way round: W in the slot, Z in front. The beam
//      stops on "?".

export function OtherOrder({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="অনেক রাত; লাইট ভাই কাঁচ দুইটা উল্টা করে লাগালেন, W খোপে, Z সামনে; দেয়ালে কী আসবে, প্রশ্নবোধক">
        <StageWall x={SW[0]} y={SW[1]} grid={false} />
        <rect x={SW[0]} y={SW[1]} width={STAGE_WALL_F.W} height={STAGE_WALL_F.H} fill="#0f172a" opacity={0.5} />
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" on={k >= 3} />
        {k >= 1 && (
          <g className={POP}>
            <LJ_Glass x={lx} y={ly} which="W" r={5.5} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <LJ_Glass x={lx - 12} y={ly + 4} which="Z" r={5.5} />
          </g>
        )}
        {k >= 3 && <StageBeam from={[lx - 12, ly]} to={onStage([3, 2.5])} w={8} />}
        {k >= 3 && (
          <text x={onStage([3, 2.5])[0]} y={onStage([3, 2.5])[1] + 8} textAnchor="middle" fontSize={24} fontWeight={800} fill="#93c5fd" className={POP}>
            ?
          </text>
        )}
        <LightBhai x={298} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} nameTone="#e2e8f0" />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The stake: last night's lens cracked; two small spares; they both go
//      for the one slot and only one fits; the shop wants four numbers, "?".

const X1B_SAY = ["কাল রাতের lens। মাঝখান দিয়ে চিড়।", "চিড় খাওয়া lens বাদ। হাতে Z আর W।", "খোপ একটাই। দুইটা একসাথে ঢোকে না।", "দোকান চায় চারটা সংখ্যা। সন্ধ্যার আগে। কোন চারটা?"];

export function OneSlot() {
  const s = useScene(3, [600, 1600, 1800, 2600]);
  const k = s.k;
  const PX = 160;
  const PY = 112;
  const [lx, ly] = projectorLens(PX, PY);
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <svg viewBox="30 24 180 96" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="লাইট ভাইয়ের যন্ত্র; চিড় খাওয়া lens বের হলো; Z আর W দুইটাই খোপের দিকে, একটাই ঢোকে; দোকানের চিরকুটে চারটা প্রশ্নবোধক">
        <rect x={30} y={24} width={180} height={96} rx={8} fill="#eaf6ff" />
        <rect x={30} y={112} width={180} height={8} fill="#86c06c" />
        <Projector x={PX} y={PY} lens={k === 0 ? "cracked" : "empty"} />
        {k >= 1 && (
          <g className={FADE}>
            <circle cx={196} cy={104} r={5.5} fill="#a7f3d0" stroke={INK} strokeWidth={0.9} opacity={0.6} />
            <path d="M192 101l3 2l-1 3l3 2" stroke={INK} strokeWidth={0.9} fill="none" />
          </g>
        )}
        {k >= 1 && (
          <>
            <g style={{ transform: `translate(${k >= 2 ? lx : 70}px, ${k >= 2 ? ly : 44}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
              <LJ_Glass x={0} y={0} which="Z" r={6.5} />
            </g>
            <g style={{ transform: `translate(${k >= 2 ? lx - 8 : 94}px, ${k >= 2 ? ly - 22 : 44}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
              <LJ_Glass x={0} y={0} which="W" r={6.5} />
            </g>
          </>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={40} y={62} width={66} height={42} rx={3} fill="white" stroke="#a8a29e" />
            <text x={73} y={74} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK}>
              দোকানের চিরকুট
            </text>
            <LJ_Mat x={73} y={90} q s={0.8} />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Two steps, one grid: the plain grid, bent by Z, then by W; last night's
//      lens's grid drops on top, dashed, line for line.

const X2B_SAY = ["সোজা grid। খোপে Z, হাতে W।", "Z এর পরে grid এক রকম বাঁকা।", "তারপর W। আরেকবার বাঁকা।", "নীল দাগ: কাল রাতের lens এর grid। একটা দাগও আলাদা না।"];

export function TwoStepsOneGrid() {
  const s = useScene(3, [600, 1600, 1600, 2600]);
  const k = s.k;
  const [t] = useTween([k === 0 ? 0 : k === 1 ? 1 : 2], 900);
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <LJ_Wall f={FIG_F} label="আলোর grid আগে Z, তারপর W দিয়ে বাঁকে; শেষে কাল রাতের lens এর grid নীল দাগে ঠিক উপরে পড়ে" lit={<LightGrid f={FIG_F} move={twoStage(Z, W, t)} t={1} />} width="max-w-[15rem]">
        {k >= 3 && (
          <g className={FADE}>
            <LJ_Ghost f={FIG_F} cols={GOOD_LENS} w={1.3} />
          </g>
        )}
      </LJ_Wall>
    </Scene>
  );
}

// 3½ · Karim's sum, acted out: Z looks at (1, 1) and sends it to (0, 3); W
//      also looks at (1, 1), (1, 2); added tip to tail, (1, 5). But W really
//      looks at Z's light, (0, 3), and sends it to (3, 3).

const X3B_SAY = ["রিনার dot, (1, 1)।", "Z দেখে (1, 1)। পাঠায় (0, 3) এ।", "W ও দেখে সেই (1, 1)। পাঠায় (1, 2) এ।", "দুইটা যোগ: (1, 5)। করিমের lens এর dot।", "কিন্তু আসলে W দেখে Z এর আলো, (0, 3)। পাঠায় (3, 3) এ।"];

export function KarimAdds() {
  const s = useScene(4, [600, 1800, 1800, 2200, 2800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <LJ_Wall f={FIG_F} label="করিমের যোগ: Z আর W দুইজনই (1, 1) দেখে, উত্তর যোগ করলে (1, 5); আসলে W দেখে Z এর আলো, তাই (3, 3)" width="max-w-[15rem]">
        <LJ_Chalk f={FIG_F} at={DOT0} />
        {k >= 1 && k <= 3 && <Arrow f={FIG_F} from={[0, 0]} to={[0, 3]} tone="amber" w={2.2} draw />}
        {k === 2 && <Arrow f={FIG_F} from={[0, 0]} to={[1, 2]} tone="violet" w={2.2} draw />}
        {k === 3 && <Arrow f={FIG_F} from={[0, 3]} to={[1, 5]} tone="violet" w={2.2} draw />}
        {k === 3 && <LJ_Ring f={FIG_F} at={[1, 5]} tone={RED} />}
        {k >= 4 && (
          <>
            <LJ_Hop f={FIG_F} a={DOT0} b={[0, 3]} tone="#b45309" />
            <LJ_Hop f={FIG_F} a={[0, 3]} b={[3, 3]} tone="#7c3aed" />
            <LJ_Ring f={FIG_F} at={[1, 5]} tone={RED} />
          </>
        )}
        <LJ_Glide f={FIG_F} at={k === 0 ? DOT0 : k === 1 ? [0, 3] : k === 2 ? [0, 3] : k === 3 ? [1, 5] : [3, 3]} />
      </LJ_Wall>
    </Scene>
  );
}

// 4½ · Same recipe, new ingredients (6.3): (1, 1) is one e₁ and one e₂; after
//      both lenses e₁ stands at (2, 1), e₂ at (1, 2); put them tip to tail and
//      the dot lands at (3, 3).

const X4B_SAY = ["(1, 1) মানে একবার e₁, তারপর একবার e₂।", "দুই lens এর পরে e₁ দাঁড়ায় (2, 1) এ।", "e₂ দাঁড়ায় (1, 2) এ। ওকে জুড়ে দিলাম e₁ এর মাথায়।", "(3, 3). রান্না একই, উপকরণ নতুন।"];

export function RopesRecipe() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <LJ_Wall f={FIG_F} label="(1, 1) হলো একবার e₁ আর একবার e₂; দুই lens এর পরে e₁ (2, 1), e₂ (1, 2); জুড়ে দিলে (3, 3)" lit={k >= 1 ? <LightGrid f={FIG_F} move={byCols(WZ)} /> : null} width="max-w-[15rem]">
        {k === 0 && (
          <>
            <Arrow f={FIG_F} from={[0, 0]} to={E1} tone="amber" w={2.4} draw />
            <Arrow f={FIG_F} from={E1} to={DOT0} tone="teal" w={2.4} draw delay={500} />
          </>
        )}
        {k >= 1 && <Arrow key="e1" f={FIG_F} from={[0, 0]} to={WZ[0]} tone="amber" w={2.4} draw />}
        {k >= 2 && <Arrow key="e2" f={FIG_F} from={WZ[0]} to={[3, 3]} tone="teal" w={2.4} draw />}
        {k >= 3 && <LightDot f={FIG_F} at={[3, 3]} />}
      </LJ_Wall>
    </Scene>
  );
}

// 5½ · Z's columns go through W and stand up as WZ's columns.

const X5B_SAY = ["Z এর দুইটা column: (−1, 2) আর (1, 1)।", "প্রথমটা গেলো W এর ভেতর দিয়ে। বের হলো (2, 1)।", "দ্বিতীয়টা: (1, 1) থেকে (1, 2)।", "দুইটা পাশাপাশি দাঁড় করালেই WZ। কাল রাতের lens।"];

export function ColsStandUp() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const flow = k === 1 || k === 2 ? (k - 1) as 0 | 1 : null;
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <svg viewBox="0 0 260 92" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="Z এর দুইটা column W এর ভেতর দিয়ে গিয়ে WZ এর দুইটা column হয়ে দাঁড়ায়">
        <rect width={260} height={92} rx={8} fill="white" />
        <LJ_Mat x={36} y={46} cols={Z} s={1.3} />
        <text x={36} y={84} textAnchor="middle" fontSize={10} fontWeight={700} fill={INK}>
          Z
        </text>
        <rect x={108} y={30} width={40} height={32} rx={6} fill={W_HEX} stroke={INK} />
        <text x={128} y={51} textAnchor="middle" fontSize={15} fontWeight={800} fill={INK}>
          W
        </text>
        <path d="M66 46H104M152 46H190" stroke="#94a3b8" strokeWidth={1.4} strokeDasharray="3 3" />
        {flow !== null && (
          <g key={flow} className={FADE}>
            <text x={86} y={24} textAnchor="middle" fontSize={9.5} fontWeight={800} fontFamily="ui-monospace, monospace" fill={KNOB_HEX[(flow + 1) as 1 | 2]}>
              {`(${sg(Z[flow][0])}, ${sg(Z[flow][1])})`}
            </text>
            <text x={170} y={24} textAnchor="middle" fontSize={9.5} fontWeight={800} fontFamily="ui-monospace, monospace" fill={KNOB_HEX[(flow + 1) as 1 | 2]} className={POP}>
              {`(${WZ[flow][0]}, ${WZ[flow][1]})`}
            </text>
          </g>
        )}
        <LJ_Mat x={220} y={46} cols={WZ} show={[k >= 1, k >= 2]} s={1.3} />
        <text x={220} y={84} textAnchor="middle" fontSize={10} fontWeight={700} fill={INK}>
          WZ
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½ and 9½ · A cell is a reading of where a column lands. A column of the
//      first lens goes through the second; the landing's "ডানে কত ঘর" grows as
//      a bar along the pin's row (row 1 · column), then "উপরে কত ঘর" up
//      (row 2 · column).

function LJ_ReadCol({ col, second, lines, label, s }: { col: XY; second: Cols; lines: readonly string[]; label: string; s: ReturnType<typeof useScene> }) {
  const k = s.k;
  const L = apply(second, col);
  return (
    <Scene scene={s} caption={say(lines, k)}>
      <LJ_Wall f={FIG_F} label={label} width="max-w-[15rem]">
        <Arrow f={FIG_F} from={[0, 0]} to={col} tone="amber" w={k >= 1 ? 1.4 : 2.4} faint={k >= 1} />
        {k >= 1 && <LJ_Hop f={FIG_F} a={col} b={L} tone="#7c3aed" />}
        {k >= 1 && <Arrow key="l" f={FIG_F} from={[0, 0]} to={L} tone="amber" w={2.4} draw />}
        {k >= 2 && <path d={`M${FIG_F.sx(0)} ${FIG_F.sy(0)}H${FIG_F.sx(L[0])}`} stroke={BLUE} strokeWidth={4} strokeLinecap="round" opacity={0.7} className={FADE} />}
        {k >= 2 && (
          <text x={FIG_F.sx(L[0] / 2)} y={FIG_F.sy(0) + 13} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill={BLUE} className={POP}>
            {L[0]}
          </text>
        )}
        {k >= 3 && <path d={`M${FIG_F.sx(L[0])} ${FIG_F.sy(0)}V${FIG_F.sy(L[1])}`} stroke={RED} strokeWidth={4} strokeLinecap="round" opacity={0.7} className={FADE} />}
        {k >= 3 && (
          <text x={FIG_F.sx(L[0]) + 8} y={FIG_F.sy(L[1] / 2) + 4} fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill={RED} className={POP}>
            {L[1]}
          </text>
        )}
      </LJ_Wall>
    </Scene>
  );
}

const X6B_SAY = [
  "Z এর column 1, (−1, 2)। দেয়ালে একটা arrow।",
  "W এর ভেতর দিয়ে গেলো। থামলো (2, 1) এ।",
  "কত ঘর ডানে? 2. W এর row 1 · Z এর column 1 ও 2.",
  "কত ঘর উপরে? 1. row 2 · column 1 ও 1। দুইটাই WZ এর column 1।",
];

export function RowIsReading() {
  const s = useScene(3, [600, 1800, 2400, 2600]);
  return <LJ_ReadCol s={s} col={Z[0]} second={W} lines={X6B_SAY} label="Z এর column 1 W দিয়ে গিয়ে (2, 1) এ; ডানে 2 ঘর, উপরে 1 ঘর: WZ এর column 1" />;
}

const X9B_SAY = [
  "A এর column 1, (1, 2)। মানে e₁ প্রথম lens এর পরে।",
  "B এর ভেতর দিয়ে গেলো। থামলো (3, 4) এ।",
  "কত ঘর ডানে? 3. উপরের ঘরটা।",
  "কত ঘর উপরে? 4. B এর row 2 · A এর column 1। ফাঁকা ঘরটা।",
];

export function CellIsHeight() {
  const s = useScene(3, [600, 1800, 2000, 2600]);
  return <LJ_ReadCol s={s} col={A_LENS[0]} second={B_LENS} lines={X9B_SAY} label="A এর column 1 B দিয়ে গিয়ে (3, 4) এ; ডানে 3 ঘর, উপরে 4 ঘর" />;
}

// 10½ · The bet opened, card by card.

const BO_ROWS: [string, boolean][] = [
  ["করিম: W + Z", false],
  ["নাসিব: ঘরে ঘরে গুণ", false],
  ["সোম: একটায় হবে না", false],
  ["সামিন: একটা matrix আছে", true],
];
const BO_SAY = [
  "চারটা card।",
  "করিমের যোগ dot টা নিলো (1, 5) এ। মিললো না।",
  "নাসিবের ঘরে ঘরে গুণ নিলো (1, 3) এ। মিললো না।",
  "সোম বলেছিল একটায় হবে না। হলো। এক কাঁচেই।",
  "সামিনের matrix: দড়ি ধরে পাওয়া WZ। জিতলো।",
];

function LJ_Mark({ ok }: { ok: boolean }) {
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

export function BetOpen({}: Story) {
  const s = useScene(4, [600, 1800, 1800, 1800, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(BO_SAY, k)}>
      <div className="mx-auto grid max-w-[18rem] gap-1.5">
        {BO_ROWS.map(([t, ok], i) => (
          <div
            key={t}
            className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm transition-colors duration-500 motion-reduce:transition-none ${
              k > i ? (ok ? "border-accent bg-accent/10" : "border-border opacity-60") : "border-border"
            }`}
          >
            <span>{t}</span>
            {k > i && <LJ_Mark ok={ok} />}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  LensBet: { start: {}, picked: { pick: 3 }, sealed: { pick: 3, sealed: true }, som: { pick: 2, sealed: true } },
  ThroughBoth: { start: {}, z: { phase: 1 }, w: { phase: 2 }, done: { phase: 3 } },
  TryTheCards: { start: {}, karim: { pick: 0, tried: [true, false] }, done: { pick: 1, tried: [true, true] } },
  FollowTheRopes: { start: {}, one: { guess: 0 }, all: { guess: 2 }, ok: { guess: 1, ok: true }, half: { guess: 1, ok: true, sent: [true, false] }, done: { guess: 1, ok: true, sent: [true, true] } },
  LensByColumns: { start: {}, one: { placed: [0] }, wrong: { placed: [1, 0], ran: true }, done: { placed: [0, 1], ran: true } },
  RowMeetsColumn: { start: {}, one: { cur: 0, filled: [true, false, false, false] }, done: { cur: 3, filled: [true, true, true, true] } },
  WhyThisRule: { start: {}, a: { open: 0, seen: [true, false, false] }, b: { open: 1, seen: [true, true, false] }, c: { open: 2, seen: [true, true, true] } },
  YourOneLens: { start: {}, wrong: { m: [2, 0, 1, 1], ran: true }, done: { m: [2, 0, 2, 1], ran: true } },
  TryOneCell: { start: {}, wrong: { pick: 2 }, done: { pick: 1 } },
  NoonSpares: { rest: { k: 0 }, claim: { k: 2 }, done: {} },
  FourIdeas: { karim: { k: 1 }, som: { k: 3 }, done: {} },
  HandHeld: { z: { k: 1 }, rina: { k: 2 }, done: {} },
  SomNoAll: { rina: { k: 1 }, done: {} },
  HoludShow: { on: { k: 1 }, done: {} },
  OtherOrder: { w: { k: 2 }, done: {} },
  OneSlot: { rest: { k: 0 }, two: { k: 2 }, done: {} },
  TwoStepsOneGrid: { z: { k: 1 }, done: {} },
  KarimAdds: { sum: { k: 3 }, done: {} },
  RopesRecipe: { start: { k: 0 }, done: {} },
  ColsStandUp: { one: { k: 1 }, done: {} },
  RowIsReading: { mid: { k: 2 }, done: {} },
  CellIsHeight: { done: {} },
  BetOpen: { mid: { k: 2 }, done: {} },
};
