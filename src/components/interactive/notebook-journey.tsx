"use client";

import { useId, useState, type ReactNode } from "react";

import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, Ticks, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Lit, Plane, clamp, listOf, makeFrame, sg, type Frame, type XY } from "@/components/journey/plane";

import { Alpana, ChalkGrid, FISH, ID, LOTUS_TIPS, PETALS, Pillar, RoadBed, Rope, apply, byCols, partway, turnCols, type Cols } from "./road-kit";

// Screens for "Math for AI 6.4 — The art sir's notebook, reading a matrix",
// told as a Journey. The plan is 06_journey_specs.md, block 6.4.
//
// Ten screens. 1 seals the bet: the art sir is sick, his notebook holds five
// grids of four numbers and five unlabelled sketches; which sketch is crossing
// 4's grid [[1,1],[0,1]]? 2 drags last night's two ropes until the live grid
// matches his page: each rope is a column. 3 writes the half turn's grid from
// where the ropes go, and plays it. 4 reads the same grid by rows: each row is
// the sum for one slot of the answer. 5 is a zoo of six grids that are *not*
// the crossings' (so the reader still has work at 8). 6 builds the quarter turn
// for the crossing where the road turns a corner. 7 turns a knob: any angle's
// grid, from the rope's two shadows. 8 matches all five grids to the sketches,
// unaided. 9 is the gate page, [[0,1],[1,0]]: tap where the lotus's centre
// goes. 10 settles the bet at night, by torchlight.
//
// Matrices are written rows first, as the article writes them; `colsOf` turns
// one into the two rope ends that road-kit's moves take.
//
// After the screens come the story scenes (numbered 1a, 2a, …) and the
// watch-only figures (1½, 2½, …). The art sir is off sick; he appears nowhere.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const AMB = "#b45309";
const TEA = "#0f766e";
const OK = "#0d9488";
const BAD = "#e11d48";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

type M2 = [[number, number], [number, number]];
const colsOf = (m: M2): Cols => [
  [m[0][0], m[1][0]],
  [m[0][1], m[1][1]],
];
const mOf = (c: Cols): M2 => [
  [c[0][0], c[1][0]],
  [c[0][1], c[1][1]],
];
const sameM = (a: M2, b: M2) => a[0][0] === b[0][0] && a[0][1] === b[0][1] && a[1][0] === b[1][0] && a[1][1] === b[1][1];
/** a matrix entry as text: two decimals at most, a real minus, never "−0" */
const num = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return r === 0 ? "0" : sg(r);
};
const tupN = (p: XY) => `(${num(p[0])}, ${num(p[1])})`;

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** The five crossings on the procession's route, in the notebook's order. */
const NB_CROSS: M2[] = [
  [
    [2, 0],
    [0, 2],
  ],
  [
    [1, 0],
    [0, -1],
  ],
  [
    [0, -1],
    [1, 0],
  ],
  [
    [1, 1],
    [0, 1],
  ],
  [
    [3, 0],
    [0, 1],
  ],
];
/** last night's page: the two ropes of 6.3 */
const NB_G: M2 = [
  [2, 1],
  [1, 2],
];
const NB_HALF: M2 = [
  [-1, 0],
  [0, -1],
];
const NB_QUARTER = NB_CROSS[2];
const NB_SWAP: M2 = [
  [0, 1],
  [1, 0],
];

// ---------------------------------------------------------------------------
// Shared pieces: a matrix in brackets, a sketch from the notebook, and the road
// with a camera that fits whatever the move does.

/** A 2 × 2 matrix in brackets (HTML). `tint` colours column 1 amber and column 2 teal, like the ropes. */
function NB_Mat({ m, tint = false, small = false }: { m: M2; tint?: boolean; small?: boolean }) {
  return (
    <span className="inline-flex items-stretch font-mono font-semibold" aria-label={`matrix ${m.map((r) => r.map(num).join(" ")).join(", ")}`}>
      <span className="w-1 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
      <span className={`grid grid-cols-2 px-1 leading-tight tabular-nums ${small ? "gap-x-1.5 text-xs" : "gap-x-3 text-base"}`}>
        {[m[0][0], m[0][1], m[1][0], m[1][1]].map((v, i) => (
          <span key={i} className={`text-center ${tint ? (i % 2 === 0 ? "text-cat-amber" : "text-cat-teal") : ""}`}>
            {num(v)}
          </span>
        ))}
      </span>
      <span className="w-1 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
    </span>
  );
}

/** A 2 × 2 matrix in brackets inside an SVG, top-left at (x, y); on white paper, so fixed ink. */
function NB_SvgMat({ x, y, m, tint = false, fs = 10, gap = 18, show = [true, true] }: { x: number; y: number; m: M2; tint?: boolean; fs?: number; gap?: number; show?: [boolean, boolean] }) {
  const h = fs * 2.6;
  const w = gap * 2;
  return (
    <g>
      <path d={`M${x + 4} ${y}h-4v${h}h4M${x + w - 4} ${y}h4v${h}h-4`} fill="none" stroke={INK} strokeWidth={1.2} />
      {[0, 1].map((c) =>
        show[c]
          ? [0, 1].map((r) => (
              <text key={`${r}${c}`} x={x + gap / 2 + c * gap} y={y + fs * 1.05 + r * fs * 1.2} textAnchor="middle" fontSize={fs} fontFamily={MONO} fontWeight={700} fill={tint ? (c === 0 ? AMB : TEA) : INK} className={FADE}>
                {num(m[r][c])}
              </text>
            ))
          : null,
      )}
    </g>
  );
}

/** A frame of W × H px that fits `pts` (paper units), centred. */
function nbFit(pts: XY[], W: number, H: number, pad: number): Frame {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [a, b, c, d] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const u = Math.min((W - 2 * pad) / Math.max(b - a, 1e-6), (H - 2 * pad) / Math.max(d - c, 1e-6));
  const cx = (a + b) / 2;
  const cy = (c + d) / 2;
  const hx = (W / 2 - pad) / u;
  const hy = (H / 2 - pad) / u;
  return makeFrame(cx - hx, cx + hx, cy - hy, cy + hy, u, pad);
}

const DESIGN: XY[] = [...PETALS.flat(), ...FISH];

/**
 * One of the art sir's sketches: the আলপনা after a move, on graph paper, with
 * the plain design faint underneath and the pillar as a red square, so size
 * and side can be read. Fitted to its own box.
 */
function NB_Sketch({ cols, w = 120, h = 60, label, at }: { cols: Cols; w?: number; h?: number; label: string; at?: XY }) {
  const f = nbFit([...DESIGN, ...DESIGN.map((p) => apply(cols, p)), [0, 0]], w, h, 5);
  let d = "";
  for (let x = Math.ceil(f.x0); x <= f.x1; x++) d += `M${f.sx(x).toFixed(1)} 0V${h}`;
  for (let y = Math.ceil(f.y0); y <= f.y1; y++) d += `M0 ${f.sy(y).toFixed(1)}H${w}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
      {...(at ? { x: at[0], y: at[1], width: w, height: h } : { className: "block h-auto w-full" })}
    >
      <rect width={w} height={h} rx={3} fill="white" />
      <path d={d} stroke="#93c5fd" strokeOpacity={0.55} strokeWidth={0.5} fill="none" />
      <Alpana f={f} move={(p) => p} faint />
      <Alpana f={f} move={byCols(cols)} />
      <rect x={f.sx(0) - 2.5} y={f.sy(0) - 2.5} width={5} height={5} rx={1} fill="#b91c1c" />
    </svg>
  );
}

/** the chalk grid's paper, corner to corner (road-kit's ChalkGrid defaults) */
const NB_PAPER: XY[] = [
  [-1, -1],
  [7, -1],
  [7, 6],
  [-1, 6],
];
const NB_W = 300;
const NB_H = 190;

/** A move played on the road: t runs 0 → 1, eased, over ~0.9 s, when `go` is called. */
const NB_N = 16;
function useRun() {
  const p = usePlay(55);
  const t = p.running ? 1 - (1 - p.k / NB_N) ** 3 : 1;
  return { t, running: p.running, go: (done?: () => void) => p.play(NB_N, done) };
}

/**
 * The road in front of the gate, the chalk grid and the আলপনা carried by
 * `show` (part-way by `t`), the two ropes at its columns, and `target` faint
 * underneath. The camera glides to fit the plain paper, the move and the target.
 */
function NB_Road({
  show,
  t,
  target,
  ropes = true,
  mark,
  label,
  h = NB_H,
  fit,
  extra = [],
  children,
}: {
  show: Cols;
  t: number;
  target?: Cols;
  ropes?: boolean;
  mark?: XY;
  label: string;
  h?: number;
  /** the moves the camera fits (default: the plain paper, `show` and `target`) */
  fit?: Cols[];
  /** more points (paper units) the camera must keep in view */
  extra?: XY[];
  /** drawn on top, in the road's frame */
  children?: (f: Frame, mv: (p: XY) => XY) => ReactNode;
}) {
  const goal = nbFit([...(fit ?? [ID, show, ...(target ? [target] : [])]).flatMap((c) => NB_PAPER.map((p) => apply(c, p))), ...extra], NB_W, h, 10);
  const [x0, y0, u] = useTween([goal.x0, goal.y0, goal.u], 450);
  const f = makeFrame(x0, x0 + (NB_W - 20) / u, y0, y0 + (h - 20) / u, u, 10);
  const mv = partway(byCols(show), t);
  const mk = mark ? mv(mark) : null;
  return (
    <div className="mx-auto w-full max-w-[20rem]">
      <Plane f={f} paper={false} grid={0} axes={false} label={label} className="my-0! max-w-none">
        <RoadBed f={f} />
        {target && <Alpana f={f} move={byCols(target)} faint />}
        <ChalkGrid f={f} move={mv} ghost />
        <Alpana f={f} move={mv} />
        <Pillar f={f} />
        {ropes && (
          <>
            <NB_Rope f={f} to={mv([1, 0])} which={1} />
            <NB_Rope f={f} to={mv([0, 1])} which={2} />
          </>
        )}
        {mk && (
          <g className="pointer-events-none">
            <circle cx={f.sx(mk[0])} cy={f.sy(mk[1])} r={5} fill="none" stroke="#fde047" strokeWidth={2} />
            <text x={f.sx(mk[0]) + 8} y={f.sy(mk[1]) - 6} fontSize={10} fontWeight={700} fontFamily={MONO} fill="#fde047" stroke={INK} strokeWidth={2.5} paintOrder="stroke">
              {tupN(mk)}
            </text>
          </g>
        )}
        {children?.(f, mv)}
      </Plane>
    </div>
  );
}

/** A small drawn tick (no emoji glyphs). */
function NB_Tick({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 12 12" className={`size-3.5 ${on ? "text-accent" : "text-transparent"}`} aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A rope that tells its list when tapped (plane's Lit): the rope is a vector
 * from the pillar, so a tap lights it and shows where its end is, (2, 1).
 */
function NB_Rope({ f, to, which, label }: { f: Frame; to: XY; which: 1 | 2; label?: ReactNode }) {
  return (
    <Lit a={[f.sx(0), f.sy(0)]} b={[f.sx(to[0]), f.sy(to[1])]} list={listOf([0, 0], to)} w={2.4} color={which === 1 ? "#f59e0b" : "#2dd4bf"}>
      <Rope f={f} to={to} which={which} label={label} />
    </Lit>
  );
}

/**
 * Only the tap target of a rope drawn elsewhere (inside a turning group): it
 * sits where the rope ends up, so a tap lights the rope and shows its list.
 */
function NB_RopeTap({ a, b, list, color }: { a: XY; b: XY; list: string; color: string }) {
  return (
    <Lit a={a} b={b} list={list} w={2.6} color={color}>
      <g />
    </Lit>
  );
}

// ---------------------------------------------------------------------------
// 1 · The bet. The notebook's page for crossing 4, [[1,1],[0,1]], and three
//     sketches: leaning up (the grid read by rows), leaning right (right), and
//     twice as big. The pick is acted out: the আলপনা on the road glides into
//     the picked sketch, and a "?" lands, since nobody has read the numbers
//     yet. Sealed unmarked; the last screen settles it.

const BET_OPTS: [M2, string][] = [
  [
    [
      [1, 0],
      [1, 1],
    ],
    "আলপনা উপরের দিকে হেলানো",
  ],
  [NB_CROSS[3], "আলপনা ডান দিকে হেলানো"],
  [NB_CROSS[0], "আলপনা দুই গুণ বড়"],
];

/** the "?" on the road's top-right corner: the pick is drawn, not judged */
function NB_Ask({ f }: { f: Frame }) {
  return (
    <g className={`${POP} pointer-events-none`}>
      <circle cx={f.W - 22} cy={22} r={13} fill="white" />
      <text x={f.W - 22} y={28.5} textAnchor="middle" fontSize={18} fontWeight={800} fill={INK}>
        ?
      </text>
    </g>
  );
}

export function NotebookBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const run = useRun();
  const seal = (i: number) => {
    setBet(i);
    run.go(() => pass("বাজি সিল হলো। আগে কালকের দড়িটা খুঁজি।"));
  };
  return (
    <>
      <div className="mx-auto flex max-w-[20rem] items-center justify-center gap-3 rounded-xl bg-[#fef3c7] px-4 py-2 text-[#0f1b2d]">
        <span className="text-sm font-semibold">খাতা, মোড় 4:</span>
        <NB_Mat m={NB_CROSS[3]} />
      </div>
      {bet !== null && (
        <div className="mt-2">
          <NB_Road h={140} ropes={false} show={colsOf(BET_OPTS[bet][0])} t={run.t} label={`মোড় 4 এ রাস্তার আলপনা, আপনার বাছা ছবির মত: ${BET_OPTS[bet][1]}; ঠিক কি-না, প্রশ্নবোধক`}>
            {(f) => !run.running && <NB_Ask f={f} />}
          </NB_Road>
        </div>
      )}
      <div className="mt-3 grid gap-2">
        {BET_OPTS.map(([m, a11y], i) => (
          <Choice key={i} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            <span className={`block ${bet !== null ? "w-14" : "w-28"}`}>
              <NB_Sketch cols={colsOf(m)} w={100} h={60} label={a11y} />
            </span>
          </Choice>
        ))}
      </div>
      <Task done={bet !== null && !run.running}>এই চারটা সংখ্যা কোন ছবির? একটা ছবিতে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Ropes in the grid. The two ropes start plain, at (1, 0) and (0, 1); the
//     reader drags their ends. A live grid under the road follows: the amber
//     rope's end is its left column, the teal's the right. Match the sir's page.
//     Last night's two chalk crosses are on the road, as in the story. Ropes on
//     the crosses but swapped: the columns swap too, and a Nope says so. Right:
//     both ends ring on their crosses, then pass().

const RG_F = makeFrame(-3.5, 3.5, -3.5, 3.5, 30, 10);
/** where last night's rope ends were: the columns of the sir's first page */
const NB_G_ENDS = colsOf(NB_G);

export function RopesInTheGrid() {
  const pass = useGate();
  const [e1, setE1] = useSeed<XY>("e1", [1, 0]);
  const [e2, setE2] = useSeed<XY>("e2", [0, 1]);
  const [done, setDone] = useSeed("done", false);
  const [held, setHeld] = useState<1 | 2 | null>(null);
  const ring = usePlay(900);
  const clip = useId();
  const f = RG_F;
  const m = mOf([e1, e2]);
  const swapped = !done && held === null && sameM(m, [
    [1, 2],
    [2, 1],
  ]);
  const moveTo = (which: 1 | 2, p: XY) => {
    if (done) return;
    const q: XY = [clamp(Math.round(p[0]), -3, 3), clamp(Math.round(p[1]), -3, 3)];
    const n1 = which === 1 ? q : e1;
    const n2 = which === 2 ? q : e2;
    if (which === 1) setE1(q);
    else setE2(q);
    if (sameM(mOf([n1, n2]), NB_G)) {
      setDone(true);
      setHeld(null);
      ring.play(1, () => pass("প্রথম column: e₁ যেখানে গেলো। দ্বিতীয়: e₂।"));
    }
  };
  const d = (a: XY, p: XY) => Math.hypot(a[0] - p[0], a[1] - p[1]);
  return (
    <>
      <div className="mx-auto w-full max-w-[15rem]">
        <Plane
          f={f}
          paper={false}
          grid={0}
          axes={false}
          label="গেটের খুঁটি থেকে দুইটা দড়ি, amber আর সবুজ; দড়ির মাথা টেনে সরানো যায়, chalk এর ঘর সাথে সাথে বদলায়"
          className="my-0! max-w-none"
          drag={{
            down: (p) => {
              const w = d(e1, p) <= d(e2, p) ? 1 : 2;
              setHeld(w);
              moveTo(w, p);
            },
            move: (p) => {
              if (held) moveTo(held, p);
            },
            up: () => setHeld(null),
          }}
        >
          <defs>
            <clipPath id={clip}>
              <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
            </clipPath>
          </defs>
          <RoadBed f={f} />
          <g clipPath={`url(#${clip})`}>
            <ChalkGrid f={f} move={byCols([e1, e2])} x0={-3} x1={3} y0={-3} y1={3} ghost />
          </g>
          {/* last night's two chalk crosses, still on the road */}
          {NB_G_ENDS.map(([x, y], i) => (
            <path key={i} d={`M${f.sx(x) - 5} ${f.sy(y) - 5}l10 10m0 -10l-10 10`} stroke={i === 0 ? "#f59e0b" : "#2dd4bf"} strokeWidth={2.2} strokeLinecap="round" opacity={0.75} className="pointer-events-none" />
          ))}
          <Pillar f={f} />
          <NB_Rope f={f} to={e1} which={1} label="e₁" />
          <NB_Rope f={f} to={e2} which={2} label="e₂" />
          {done &&
            [e1, e2].map((e, i) => (
              <circle key={i} cx={f.sx(e[0])} cy={f.sy(e[1])} r={11} fill="none" stroke={i === 0 ? "#f59e0b" : "#2dd4bf"} strokeWidth={2.5} className={`${POP} pointer-events-none`} style={{ transitionDelay: `${i * 250}ms` }} />
            ))}
          {!done &&
            [e1, e2].map((e, i) => (
              <circle key={i} cx={f.sx(e[0])} cy={f.sy(e[1])} r={10} fill="white" fillOpacity={0.12} stroke="white" strokeOpacity={0.7} strokeDasharray="3 3" className="pointer-events-none" />
            ))}
        </Plane>
      </div>
      <div className="mt-3 flex items-center justify-center gap-5 text-sm">
        <span className="flex flex-col items-center gap-1">
          <span className="text-muted">আপনার দড়ি</span>
          <NB_Mat m={m} tint />
        </span>
        <span className="flex flex-col items-center gap-1">
          <span className="text-muted">স্যারের পাতা</span>
          <span className={done ? "text-accent-text" : ""}>
            <NB_Mat m={NB_G} />
          </span>
        </span>
      </div>
      {swapped && <Nope>দড়ি দুইটা ক্রসে পৌঁছালো। তবে জায়গা বদল করে। তাই grid এর দুই column ও জায়গা বদল করলো। Amber দড়ি কাল কোথায় ছিল? (2, 1) এ।</Nope>}
      <Task done={done && !ring.running}>দড়ির মাথা দুইটা টেনে এমন জায়গায় নিন, যাতে বাম দিকের চারটা সংখ্যা স্যারের পাতার সাথে মেলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 and 6 · Build a grid. Four steppers, one column per rope; "চালান" plays the
//     reader's grid on the road, with the wanted result faint underneath. A
//     wrong grid plays honestly and the Nope says where e₁ went.

function GridBuilder({ goal, note, task, label, hint }: { goal: M2; note: string; task: string; label: string; hint: (shown: M2) => string }) {
  const pass = useGate();
  const [m, setM] = useSeed<M2>("m", [
    [1, 0],
    [0, 1],
  ]);
  const [shown, setShown] = useSeed<M2 | null>("shown", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const run = useRun();
  const won = shown !== null && sameM(shown, goal);
  const set = (r: number, c: number, v: number) => {
    const n: M2 = [
      [m[0][0], m[0][1]],
      [m[1][0], m[1][1]],
    ];
    n[r][c] = v;
    setM(n);
  };
  const go = () => {
    const now = m;
    setShown(now);
    run.go(() => {
      if (sameM(now, goal)) pass(note);
      else setMiss(miss + 1);
    });
  };
  return (
    <>
      <NB_Road show={colsOf(shown ?? ID)} t={shown ? run.t : 1} target={colsOf(goal)} label={label} />
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="flex items-stretch">
          <span className="w-1.5 rounded-l-sm border-y-2 border-l-2 border-foreground/50" />
          <div className="grid grid-cols-2 gap-x-1 gap-y-1 px-1 py-0.5">
            <span className="text-center text-xs font-semibold text-cat-amber">e₁ যায়</span>
            <span className="text-center text-xs font-semibold text-cat-teal">e₂ যায়</span>
            {[0, 1].flatMap((r) =>
              [0, 1].map((c) => <Stepper key={`${r}${c}`} value={m[r][c]} min={-2} max={2} disabled={won || run.running} label={`row ${r + 1}, column ${c + 1}`} onChange={(v) => set(r, c, v)} />),
            )}
          </div>
          <span className="w-1.5 rounded-r-sm border-y-2 border-r-2 border-foreground/50" />
        </div>
        <button type="button" onClick={go} disabled={won || run.running} className={`${primaryBtn} px-4!`}>
          চালান
        </button>
      </div>
      {shown && !won && !run.running && miss > 0 && <Nope key={miss}>{hint(shown)}</Nope>}
      <Task done={won}>{task}</Task>
    </>
  );
}

const wentTo = (s: M2) => `e₁ গেলো ${tupN([s[0][0], s[1][0]])}, e₂ গেলো ${tupN([s[0][1], s[1][1]])}.`;

export function BuildTheGrid() {
  return (
    <GridBuilder
      goal={NB_HALF}
      note="Rope কোথায় যায় জানলে grid লেখা যায়।"
      task="আধা পাক ঘুরলে e₁ আর e₂ কোথায় যায়, সেটা দিয়ে চারটা ঘর ভরুন। তারপর চালান।"
      label="রাস্তায় আলপনা; নিচে চারটা ঘর, চালালে আলপনা সেই grid মত সরে; আবছা করে আঁকা আধা পাক ঘোরানো আলপনা"
      hint={(s) => `উঁহু, আলপনা আবছা ছবির উপরে বসলো না। ${wentTo(s)} আধা পাক ঘুরলে e₁ কোথায় যাওয়ার কথা? খুঁটির ঠিক উল্টা পাশে।`}
    />
  );
}

export function MakeQuarterTurn() {
  return (
    <GridBuilder
      goal={NB_QUARTER}
      note="e₁ উপরে যায় (0, 1), e₂ বামে যায় (−1, 0)।"
      task="বাম দিকে এক কোণা ঘুরলে দড়ি দুইটা কোথায় যায়? চারটা ঘর ভরে চালান।"
      label="রাস্তায় আলপনা; নিচে চারটা ঘর; আবছা করে আঁকা বাম দিকে এক কোণা ঘোরানো আলপনা"
      hint={(s) =>
        sameM(s, [
          [0, 1],
          [-1, 0],
        ])
          ? "আলপনা ঘুরলো, কিন্তু উল্টা দিকে, ডানে। e₁ এর জায়গায় দেখুন: ওটা নিচে নামলো না উপরে উঠলো?"
          : `উঁহু। ${wentTo(s)} বাম দিকে এক কোণা ঘুরলে amber দড়ি সোজা উপরে দাঁড়ায়।`
      }
    />
  );
}

// ---------------------------------------------------------------------------
// 4 · Row reading. Last night's grid again, and the petal tip (2, 3). Tapping
//     a row plays its sum on the road's edge: row 1 lays a bar along the
//     bottom, 2 × 2 then 1 × 3, and stops at 7; row 2 stands one up the left
//     side, 1 × 2 then 2 × 3, to 8. Both rows done, the road plays and the tip
//     lands on (7, 8), 6.3's number, where the two bars' ends meet.

const RR_IN: XY = LOTUS_TIPS[1];
/** the two edges the rows' bars lie along: below the grid and left of it */
const RR_EDGE = -0.55;

/**
 * One row's sum as a bar on the road's edge: the first slot's part (amber, the
 * first column's number times the tip's x), then the second's (teal), and the
 * total at its end. `upto` 1: first part, 2: both, 3: the total too.
 */
function RR_Bar({ f, r, upto }: { f: Frame; r: 0 | 1; upto: number }) {
  const a = NB_G[r][0] * RR_IN[0];
  const b = NB_G[r][1] * RR_IN[1];
  const at = (v: number): XY => (r === 0 ? [v, RR_EDGE] : [RR_EDGE, v]);
  const seg = (v0: number, v1: number) => `M${f.sx(at(v0)[0])} ${f.sy(at(v0)[1])}L${f.sx(at(v1)[0])} ${f.sy(at(v1)[1])}`;
  const end = at(a + b);
  return (
    <g className="pointer-events-none">
      {upto >= 1 && <Draw d={seg(0, a)} strokeWidth={5} ms={450} className="stroke-[#f59e0b]" />}
      {upto >= 2 && <Draw d={seg(a, a + b)} strokeWidth={5} ms={450} className="stroke-[#2dd4bf]" />}
      {upto >= 3 && (
        <text
          x={f.sx(end[0]) + (r === 0 ? 0 : -7)}
          y={f.sy(end[1]) + (r === 0 ? 14 : 4)}
          textAnchor={r === 0 ? "middle" : "end"}
          fontSize={11}
          fontWeight={800}
          fontFamily={MONO}
          fill="#fde047"
          stroke={INK}
          strokeWidth={2.5}
          paintOrder="stroke"
          className={POP}
        >
          {a + b}
        </text>
      )}
    </g>
  );
}

export function RowReading() {
  const pass = useGate();
  const [rows, setRows] = useSeed<[boolean, boolean]>("rows", [false, false]);
  const [act, setAct] = useSeed<number | null>("act", null);
  const calc = usePlay(380);
  const run = useRun();
  const both = rows[0] && rows[1];
  const out = (r: number) => NB_G[r][0] * RR_IN[0] + NB_G[r][1] * RR_IN[1];
  const tap = (r: number) => {
    if (calc.running || run.running || rows[r]) return;
    setAct(r);
    calc.play(4, () => {
      const next: [boolean, boolean] = r === 0 ? [true, rows[1]] : [rows[0], true];
      setRows(next);
      if (next[0] && next[1]) run.go(() => pass("Column বলে ছবি, row বলে হিসাব।"));
    });
  };
  const k = act === null ? 0 : calc.running ? calc.k : 4;
  const r = act ?? 0;
  const parts = [`${NB_G[r][0]} × ${RR_IN[0]}`, " + ", `${NB_G[r][1]} × ${RR_IN[1]}`, ` = ${out(r)}`];
  return (
    <>
      <NB_Road
        show={colsOf(NB_G)}
        t={both ? run.t : 0}
        fit={both ? [ID, colsOf(NB_G)] : [ID]}
        extra={[
          [-1.2, -1.2],
          [8.4, 8.4],
        ]}
        mark={RR_IN}
        ropes={both}
        label="কালকের দড়িতে রাস্তা; পদ্মের একটা পাপড়ির আগা (2, 3) হলুদ দাগে; row 1 এর হিসাব নিচের কিনারে একটা দাগ হয়ে 7 এ থামে, row 2 এর হিসাব বাম কিনারে 8 এ; দুইটা শেষ হলে আলপনা সরে আর আগা (7, 8) এ পৌঁছায়"
      >
        {(f) => (
          <>
            {([0, 1] as const).map((i) => (
              <RR_Bar key={i} f={f} r={i} upto={rows[i] ? 3 : act === i && calc.running ? (calc.k >= 3 ? 2 : calc.k >= 1 ? 1 : 0) : 0} />
            ))}
            {both && !run.running && (
              <path
                d={`M${f.sx(7)} ${f.sy(RR_EDGE)}V${f.sy(8)}H${f.sx(RR_EDGE)}`}
                fill="none"
                stroke="#fde047"
                strokeOpacity={0.8}
                strokeWidth={1.2}
                strokeDasharray="3 3"
                className={`${FADE} pointer-events-none`}
              />
            )}
          </>
        )}
      </NB_Road>
      <div className="mt-3 flex items-center justify-center gap-3 font-mono text-base font-semibold">
        <span className="flex items-stretch">
          <span className="w-1.5 rounded-l-sm border-y-2 border-l-2 border-foreground/50" />
          <span className="grid gap-1 px-1">
            {[0, 1].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => tap(i)}
                disabled={rows[i]}
                className={`cursor-pointer rounded-lg border-2 px-2 py-0.5 tabular-nums transition-colors motion-reduce:transition-none ${
                  act === i && !rows[i] ? "border-cat-blue bg-cat-blue/10" : rows[i] ? "border-accent/50 bg-accent/10" : "border-border hover:border-cat-blue/60"
                }`}
              >
                {NB_G[i][0]}&nbsp;&nbsp;{NB_G[i][1]}
              </button>
            ))}
          </span>
          <span className="w-1.5 rounded-r-sm border-y-2 border-r-2 border-foreground/50" />
        </span>
        <span className="text-sm font-normal text-muted">আগা</span>
        <span>{tupN(RR_IN)}</span>
        <span className="text-muted">→</span>
        <span className="tabular-nums">
          ({rows[0] ? out(0) : "?"}, {rows[1] ? out(1) : "?"})
        </span>
      </div>
      <div className="mt-2 min-h-7 text-center font-mono text-base" aria-live="polite">
        {act !== null &&
          parts.slice(0, k).map((p, i) => (
            <span key={`${r}${i}`} className={`${FADE} ${i === 3 ? "font-bold text-cat-blue" : ""}`}>
              {p}
            </span>
          ))}
      </div>
      <Task done={both && !run.running}>দুইটা row তেই tap করুন। দেখুন কোন row থেকে কোন সংখ্যাটা বের হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The zoo. Six grids, none of them a crossing's: tap one and the ropes
//     swing to its columns and the road follows. One line under the road says
//     what the ropes did.

const ZOO: [M2, string][] = [
  [
    [
      [1, 0],
      [0, 1],
    ],
    "দড়ি দুইটা যেখানে ছিল সেখানেই। কিছুই নড়লো না।",
  ],
  [
    [
      [3, 0],
      [0, 3],
    ],
    "দুই দড়িই 3 গুণ লম্বা। পুরা আলপনা 3 গুণ বড়।",
  ],
  [
    [
      [1, 0],
      [0, 3],
    ],
    "শুধু e₂ লম্বা হলো। আলপনা খাড়া দিকে টেনে লম্বা।",
  ],
  [
    [
      [-1, 0],
      [0, 1],
    ],
    "e₁ উল্টা দিকে গেলো। আলপনা খুঁটির বাম পাশে, আয়নার মত।",
  ],
  [
    [
      [1, 0],
      [1, 1],
    ],
    "e₁ কাত হয়ে উপরে উঠলো। আলপনা উপরের দিকে হেলে গেলো।",
  ],
  [
    [
      [0.5, 0],
      [0, 0.5],
    ],
    "দুই দড়িই অর্ধেক। আলপনা ছোট হয়ে খুঁটির কাছে চলে এলো।",
  ],
];

export function ZooWalk() {
  const pass = useGate();
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const run = useRun();
  const tap = (i: number) => {
    if (run.running) return;
    setCur(i);
    run.go(() => {
      const next = seen.includes(i) ? seen : [...seen, i];
      setSeen(next);
      if (next.length === ZOO.length) pass("Column দুইটা দেখেই বোঝা যায়।");
    });
  };
  return (
    <>
      <NB_Road show={colsOf(cur === null ? ID : ZOO[cur][0])} t={cur === null ? 1 : run.t} label="রাস্তায় আলপনা আর দুই দড়ি; নিচের কোনো grid এ tap করলে দড়ি সেই grid এর column এ যায়, আলপনা সাথে সরে" />
      <div className="mx-auto mt-1 min-h-10 max-w-xs text-center text-sm leading-snug text-muted" aria-live="polite">
        {cur !== null && !run.running ? (
          <span key={cur} className={FADE}>
            {ZOO[cur][1]}
          </span>
        ) : null}
      </div>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {ZOO.map(([m], i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(i)}
            className={`flex cursor-pointer items-center justify-center gap-1 rounded-xl border-2 py-1.5 transition-colors motion-reduce:transition-none ${
              cur === i ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"
            }`}
          >
            <NB_Mat m={m} tint small />
            <NB_Tick on={seen.includes(i)} />
          </button>
        ))}
      </div>
      <Task done={seen.length === ZOO.length}>ছয়টা grid এই tap করুন। প্রতিবার আগে দেখুন দড়ি দুইটা কোথায় যায়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Any angle. A knob in 15° steps; the amber rope (1 long) turns to θ, its
//     shadow on the road's line (cos θ) and on the upright line (the other
//     shadow) drawn, the teal rope a corner ahead. The grid fills live.

const AA_F = makeFrame(-1.45, 1.45, -1.45, 1.45, 76, 8);

export function AnyAngle() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 0);
  const [seen, setSeen] = useSeed<number[]>("seen", [0]);
  const [g] = useTween([deg], 380);
  const f = AA_F;
  const r = (g * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const e1: XY = [c, s];
  const e2: XY = [-s, c];
  const cols = turnCols(deg);
  const got45 = seen.includes(45);
  const got90 = seen.includes(90);
  const turn = (d: number) => {
    const n = clamp(deg + d, 0, 180);
    setDeg(n);
    const next = seen.includes(n) ? seen : [...seen, n];
    setSeen(next);
    if (next.includes(45) && next.includes(90) && !(got45 && got90)) pass("যেকোনো angle এর grid, দুই ছায়া দিয়ে।");
  };
  return (
    <>
      <div className="mx-auto w-full max-w-[14rem]">
        <Plane f={f} paper={false} grid={0} axes={false} label="খুঁটি থেকে 1 লম্বা amber দড়ি θ কোণে; মেঝের লাইনে তার ছায়া, খাড়া লাইনে আরেকটা ছায়া" className="my-0! max-w-none">
          <RoadBed f={f} />
          <ChalkGrid f={f} move={byCols([e1, e2])} x0={-1} x1={1} y0={-1} y1={1} ghost />
          <circle cx={f.sx(0)} cy={f.sy(0)} r={f.u} fill="none" stroke="white" strokeOpacity={0.35} strokeDasharray="3 4" />
          {/* the two shadows of the amber rope's end */}
          <path d={`M${f.sx(c)} ${f.sy(s)}V${f.sy(0)}M${f.sx(c)} ${f.sy(s)}H${f.sx(0)}`} stroke="white" strokeOpacity={0.6} strokeDasharray="2 3" />
          <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(c)}`} stroke="#fde047" strokeWidth={4} strokeLinecap="round" />
          <path d={`M${f.sx(0)} ${f.sy(0)}V${f.sy(s)}`} stroke="#c4b5fd" strokeWidth={4} strokeLinecap="round" />
          <Pillar f={f} />
          <NB_Rope f={f} to={e1} which={1} label="e₁" />
          <NB_Rope f={f} to={e2} which={2} label="e₂" />
        </Plane>
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" className={`${quietBtn} h-9! px-3!`} disabled={deg <= 0} onClick={() => turn(-15)}>
          − 15°
        </button>
        <span className="w-16 text-center font-mono text-lg font-semibold tabular-nums">{deg}°</span>
        <button type="button" className={`${quietBtn} h-9! px-3!`} disabled={deg >= 180} onClick={() => turn(15)}>
          + 15°
        </button>
      </div>
      <div className="mt-2 flex items-center justify-center gap-3 text-sm">
        <span className="flex flex-col items-end gap-0.5 leading-tight">
          <span className="text-[#a16207] dark:text-[#fde047]">মেঝের ছায়া {num(Math.cos((deg * Math.PI) / 180))}</span>
          <span className="text-[#6d28d9] dark:text-[#c4b5fd]">অন্য ছায়া {num(Math.sin((deg * Math.PI) / 180))}</span>
        </span>
        <NB_Mat m={mOf(cols)} tint />
      </div>
      <Ticks
        items={[
          ["45° তে থামুন", got45],
          ["90° তে যান", got90],
        ]}
      />
      <Task done={got45 && got90}>দড়ি ঘুরিয়ে 45° তে একবার থামুন, তারপর 90° তে যান। Grid এর ঘরগুলো দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn: the whole notebook. Five grids, five sketches in another
//     order. Tap a grid, then the sketch you think is its; the picked sketch
//     lies faint on the road and the road plays the grid. A right pair lands
//     on its sketch and stays matched; a wrong one lands off it, and bounces.

const RN_ORDER = [3, 0, 4, 1, 2];

export function ReadTheNotebook() {
  const pass = useGate();
  const [done, setDone] = useSeed<number[]>("done", []);
  const [sel, setSel] = useSeed<number | null>("sel", null);
  const [tried, setTried] = useSeed<[number, number] | null>("tried", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const run = useRun();
  const wrong = tried !== null && RN_ORDER[tried[1]] !== tried[0];
  const pick = (slot: number) => {
    if (sel === null || run.running || done.includes(RN_ORDER[slot])) return;
    const g = sel;
    setTried([g, slot]);
    run.go(() => {
      if (RN_ORDER[slot] === g) {
        const next = [...done, g];
        setDone(next);
        setSel(null);
        if (next.length === NB_CROSS.length) pass("পাঁচ মোড়, পাঁচ ছবি। সব column থেকে।");
      } else setMiss(miss + 1);
    });
  };
  return (
    <>
      <NB_Road
        h={130}
        show={colsOf(tried ? NB_CROSS[tried[0]] : ID)}
        t={tried ? run.t : 1}
        target={tried ? colsOf(NB_CROSS[RN_ORDER[tried[1]]]) : undefined}
        label="রাস্তায় আলপনা; বাছা ছবিটা আবছা করে আঁকা; যে grid বেছে নেওয়া হয়েছে, আলপনা সেইমত সরে"
      />
      <div className="mt-3 text-center text-xs text-muted">খাতার পাঁচটা grid</div>
      <div className="mx-auto mt-1 grid max-w-[22rem] grid-cols-5 gap-1">
        {NB_CROSS.map((m, i) => (
          <button
            key={i}
            type="button"
            disabled={done.includes(i)}
            onClick={() => setSel(i)}
            className={`flex cursor-pointer flex-col items-center rounded-lg border-2 py-1 transition-colors disabled:cursor-default motion-reduce:transition-none ${
              done.includes(i) ? "border-accent/50 bg-accent/10" : sel === i ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"
            }`}
          >
            <span className="text-[0.65rem] text-muted">মোড় {i + 1}</span>
            <NB_Mat m={m} small />
          </button>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-muted">পাশের পাতার পাঁচটা ছবি</div>
      <div className="mx-auto mt-1 grid max-w-[20rem] grid-cols-3 gap-1">
        {RN_ORDER.map((g, slot) => (
          <button
            key={slot}
            type="button"
            disabled={done.includes(g)}
            onClick={() => pick(slot)}
            className={`relative cursor-pointer overflow-hidden rounded-lg border-2 p-0.5 transition-colors disabled:cursor-default motion-reduce:transition-none ${
              done.includes(g) ? "border-accent bg-accent/10" : tried && tried[1] === slot && wrong && !run.running ? "nudge border-danger/60" : "border-border hover:border-cat-blue/60"
            }`}
          >
            <NB_Sketch cols={colsOf(NB_CROSS[g])} w={100} h={52} label={`ছবি ${slot + 1}`} />
            {done.includes(g) && <span className="absolute top-0.5 left-1 rounded bg-accent px-1 text-[0.6rem] font-semibold text-accent-foreground">মোড় {g + 1}</span>}
          </button>
        ))}
      </div>
      {wrong && !run.running && miss > 0 && tried && (
        <Nope key={miss}>
          উঁহু। মোড় {tried[0] + 1} এর grid এ আলপনা আবছা ছবির উপরে বসলো না। Column দুইটা আবার পড়ুন: e₁ আর e₂ কোথায় যায়?
        </Nope>
      )}
      <Task done={done.length === NB_CROSS.length}>একটা grid এ tap করুন, তারপর যে ছবিটা ওর মনে হয় সেটাতে। পাঁচটাই মেলান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it: the gate page, [[0,1],[1,0]]. Tap the crossing where the
//     lotus's centre (3, 1) will land. Right: the whole আলপনা plays over.
//     Wrong: a red dot where the reader put it, the ropes appear at the
//     grid's columns, and the recipe walks 3 × e₁ then 1 × e₂ to (1, 3).

const TM_F = makeFrame(-1.2, 6.2, -1.2, 6.2, 28, 10);
const TM_C: XY = [3, 1];
const TM_RIGHT: XY = [1, 3];

export function TryMirror() {
  const pass = useGate();
  const [pick, setPick] = useSeed<XY | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const run = useRun();
  const f = TM_F;
  const right = pick !== null && pick[0] === TM_RIGHT[0] && pick[1] === TM_RIGHT[1];
  const cols = colsOf(NB_SWAP);
  const mv = right ? partway(byCols(cols), run.t) : (p: XY) => p;
  const tap = (p: XY) => {
    if (right || run.running) return;
    const q: XY = [clamp(Math.round(p[0]), -1, 6), clamp(Math.round(p[1]), -1, 6)];
    setPick(q);
    if (q[0] === TM_RIGHT[0] && q[1] === TM_RIGHT[1]) run.go(() => pass("দুই দড়ি জায়গা বদল করে: y = x এর আয়না।"));
    else setMiss(miss + 1);
  };
  const mid = mv(TM_C);
  return (
    <>
      <div className="mx-auto flex max-w-[20rem] items-center justify-center gap-3 rounded-xl bg-[#fef3c7] px-4 py-1.5 text-[#0f1b2d]">
        <span className="text-sm font-semibold">খাতার শেষ পাতা, গেট:</span>
        <NB_Mat m={NB_SWAP} />
      </div>
      <div className="mx-auto mt-2 w-full max-w-[15rem]">
        <Plane f={f} paper={false} grid={0} axes={false} label="রাস্তায় আলপনা; পদ্মের মাঝখান (3, 1) হলুদ দাগে; tap করে বলুন ওটা কোথায় যাবে" className="my-0! max-w-none" drag={{ down: tap }}>
          <RoadBed f={f} />
          <ChalkGrid f={f} move={mv} x0={-1} x1={6} y0={-1} y1={6} ghost />
          <Alpana f={f} move={mv} />
          <Pillar f={f} />
          <circle cx={f.sx(mid[0])} cy={f.sy(mid[1])} r={6} fill="none" stroke="#fde047" strokeWidth={2} className="pointer-events-none" />
          {pick && !right && (
            <g className="pointer-events-none">
              <NB_Rope f={f} to={cols[0]} which={1} label="e₁" />
              <NB_Rope f={f} to={cols[1]} which={2} label="e₂" />
              <circle key={`${pick}`} cx={f.sx(pick[0])} cy={f.sy(pick[1])} r={5} fill={BAD} stroke="white" className={POP} />
              <Draw key={`a${miss}`} d={`M${f.sx(0)} ${f.sy(0)}V${f.sy(3)}`} strokeWidth={3} ms={700} className="stroke-[#f59e0b]" />
              <Draw key={`b${miss}`} d={`M${f.sx(0)} ${f.sy(3)}H${f.sx(1)}`} strokeWidth={3} ms={400} delay={800} className="stroke-[#2dd4bf]" />
              <circle key={`c${miss}`} cx={f.sx(1)} cy={f.sy(3)} r={4} fill="#fde047" className={POP} style={{ transitionDelay: "1200ms" }} />
            </g>
          )}
          {right && <circle cx={f.sx(1)} cy={f.sy(3)} r={4} fill="#fde047" className="pointer-events-none" />}
        </Plane>
      </div>
      {pick && !right && (
        <Nope key={miss}>
          উঁহু, {tupN(pick)} না। প্রথম column (0, 1): amber দড়ি এখন সোজা উপরে। 3 বার ওটা, তারপর 1 বার সবুজটা, (1, 0)। কোথায় পৌঁছায়?
        </Nope>
      )}
      <Task done={right}>পদ্মের মাঝখান (3, 1) এই grid এ কোথায় যাবে? রাস্তার সেই ঘরে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. The school steps in the morning, the road by the gate, and
// the crossing at night. Local props: the steps, the notebook, the chair.

function S_Steps() {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={60} width={120} height={90} fill="#e7d7c1" />
      <rect x={14} y={78} width={22} height={30} fill="#94a3b8" />
      <rect x={52} y={78} width={22} height={30} fill="#94a3b8" />
      <rect x={0} y={130} width={140} height={7} fill="#d6d3d1" />
      <rect x={0} y={137} width={150} height={7} fill="#e7e5e4" />
      <rect x={0} y={144} width={160} height={6} fill="#d6d3d1" />
    </g>
  );
}

function S_Pillar({ x, y = 150 }: { x: number; y?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 7} y={y - 80} width={14} height={80} fill="#b91c1c" />
      <rect x={x - 11} y={y - 86} width={22} height={8} fill="#7f1d1d" />
    </g>
  );
}

function S_Chair({ x, y = 150 }: { x: number; y?: number }) {
  return (
    <g className="pointer-events-none" stroke="#78350f" strokeWidth={2.4} strokeLinecap="round">
      <path d={`M${x} ${y}V${y - 22}H${x + 18}V${y}M${x + 18} ${y - 22}V${y - 44}`} fill="none" />
      <path d={`M${x + 18} ${y - 34}H${x + 16}`} />
    </g>
  );
}

/** the notebook, closed, in someone's hands: brown cover */
function S_Book({ x, y }: { x: number; y: number }) {
  return (
    <g className={POP}>
      <rect x={x - 9} y={y - 6} width={18} height={12} rx={1} fill="#92400e" />
      <path d={`M${x + 5} ${y - 6}l4 4v-4Z`} fill="#fef3c7" />
    </g>
  );
}

/** an open notebook page held up, with tiny 2 × 2 grids; `flip` turns it upside down */
function S_Page({ x, y, grids, flip = false, w = 96, fs = 6.5 }: { x: number; y: number; grids: M2[]; flip?: boolean; w?: number; fs?: number }) {
  const h = fs * 2.6 + 16;
  const g = fs * 1.25;
  const step = (w - 8) / grids.length;
  return (
    <g className={POP}>
      <g className="transition-transform duration-700 motion-reduce:transition-none" style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box", transform: flip ? "rotate(180deg)" : "none" }}>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={2} fill="#fffbeb" stroke={INK} strokeOpacity={0.35} />
        {grids.map((m, i) => (
          <NB_SvgMat key={i} x={x - w / 2 + 4 + i * step + (step - 2 * g) / 2} y={y - fs * 1.3} m={m} fs={fs} gap={g} />
        ))}
      </g>
    </g>
  );
}

// 1a · Morning on the school steps. Rina with the chalk box, Som beside her,
//      the art sir's chair empty by the gate pillar. The notebook comes; it is
//      five grids; Som turns it upside down, back again, then says his line.

export function SickMorning({}: Story) {
  const s = useScene(4, [600, 1500, 1800, 1600, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="সকালে স্কুলের সিঁড়ি; রিনার কোলে chalk এর বাক্স, পাশে সোম; গেটের খুঁটির পাশে আর্ট স্যারের চেয়ার খালি; খাতা এলো, ভেতরে পাঁচটা ছোট grid; সোম খাতা উল্টো করে ধরে বললো চারটা সংখ্যা, এর থেকে ছবি বের করা যায় না">
        <S_Steps />
        <S_Pillar x={290} />
        <S_Chair x={250} />
        <Person who="rina" x={70} y={137} label arm="hold" />
        <rect x={74} y={104} width={14} height={9} rx={1} fill="#f8fafc" stroke={INK} strokeOpacity={0.4} />
        <Person who="som" x={130} y={150} facing={-1} label arm={k >= 1 ? "hold" : "down"} mood={k >= 4 ? "puzzled" : "plain"} />
        {k === 1 && <S_Book x={122} y={112} />}
        {k >= 2 && <S_Page x={218} y={36} w={170} fs={8} grids={NB_CROSS} flip={k === 3} />}
        {k >= 4 && <Bubble x={130} y={86} side="right" lines={["চারটা সংখ্যা।", "ছবি বের হয় না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · The notebook's first page, last night's date: 2, 1, 1, 2. By the gate
//      pillar, last night's two chalk crosses are still on the road. Fahim's
//      line. Which number goes with which cross is the screen's job.

export function LastNightPage({}: Story) {
  const s = useScene(2, [600, 1500, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={118} label="খাতার প্রথম পাতায় চারটা সংখ্যা 2, 1, 1, 2; রাস্তায় খুঁটির পাশে কালকের দুইটা chalk এর ক্রস; ফাহিম বললো সংখ্যাও চারটা, ক্রসের সংখ্যাও চারটা">
        <rect x={0} y={118} width={320} height={62} fill="#6b7280" />
        <S_Pillar x={180} y={132} />
        {k >= 1 &&
          [
            [214, 150],
            [200, 164],
          ].map(([x, y], i) => (
            <path key={i} d={`M${x - 5} ${y - 4}l10 8m0 -8l-10 8`} stroke={i === 0 ? "#f59e0b" : "#2dd4bf"} strokeWidth={2.4} strokeLinecap="round" className={POP} />
          ))}
        <Person who="rina" x={60} y={160} label arm="hold" />
        <S_Page x={60} y={62} grids={[NB_G]} w={44} fs={11} />
        <Person who="fahim" x={124} y={160} facing={1} label arm={k >= 2 ? "point" : "down"} />
        {k >= 2 && <Bubble x={124} y={94} side="right" lines={["সংখ্যাও চারটা।", "ক্রসের সংখ্যাও চারটা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · The page for the first day's half turn is blank. Rina holds it open;
//      Som's line.

export function BlankPage({}: Story) {
  const s = useScene(2, [600, 1500, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="রিনা খাতা খুলে ধরলো; প্রথম দিনের আধা পাক ঘোরানোর পাতা খালি; সোম বললো লিখে ফেলি তাহলে">
        <S_Pillar x={290} />
        <Person who="rina" x={90} y={150} label arm="hold" />
        <g className={k >= 1 ? POP : "opacity-0"}>
          <rect x={80} y={64} width={50} height={30} rx={2} fill="#fffbeb" stroke={INK} strokeOpacity={0.35} />
          <text x={105} y={83} textAnchor="middle" fontSize={11} fontWeight={700} fill="#94a3b8">
            ?
          </text>
        </g>
        <Person who="som" x={170} y={150} facing={-1} label arm={k >= 2 ? "point" : "down"} />
        {k >= 2 && <Bubble x={170} y={84} side="right" lines={["লিখে ফেলি তাহলে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Som reads the page like a chessboard, left to right, a line at a time.
//      Row 1 lights; his line; Rina's question; he points at a petal tip,
//      chalked on the road, (2, 3).

export function SomReadsRows({}: Story) {
  const s = useScene(4, [600, 1500, 2400, 2000, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="সোম খাতার পাতা লাইন ধরে পড়ছে, বাম থেকে ডানে; প্রথম লাইনে 2 আর 1; সোম বললো এটা একটা হিসাব; রিনা জিজ্ঞেস করলো কীসের হিসাব">
        <S_Steps />
        <g>
          <rect x={140} y={96} width={64} height={42} rx={2} fill="#fffbeb" stroke={INK} strokeOpacity={0.35} />
          {k >= 1 && <rect x={148} y={101} width={48} height={16} rx={3} fill="#fde047" fillOpacity={0.6} className={FADE} />}
          <NB_SvgMat x={153} y={101} m={NB_G} fs={12} gap={19} />
        </g>
        <Person who="som" x={112} y={150} label arm={k >= 4 ? "point" : "hold"} mood={k >= 2 ? "smug" : "plain"} />
        <Person who="rina" x={236} y={150} facing={-1} label arm="hold" />
        {k === 2 && <Bubble x={112} y={84} side="right" lines={["প্রথম লাইনে 2 আর 1।", "এটা একটা হিসাব।"]} />}
        {k === 3 && <Bubble x={236} y={84} side="left" lines={["কীসের হিসাব?"]} />}
        {k >= 4 && (
          <g className={POP}>
            <path d="M160 166l9 -7l9 7l-9 7Z" fill="#f472b6" />
            <circle cx={169} cy={159} r={2.2} fill="#fde047" />
            <text x={169} y={153} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={INK}>
              (2, 3)
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

/** the procession's route on a paper map: gate, five crossings, the turn at 3 */
const MAP_ROUTE = "M18 118H78L108 118V60H168L208 60L234 86H300";
const MAP_X: XY[] = [
  [52, 118],
  [108, 118],
  [108, 60],
  [168, 60],
  [262, 86],
];

// 6a · The route map. Crossing 3 is where the road turns left, a full corner.
//      Nasib claims it.

export function CornerMap({}: Story) {
  const s = useScene(2, [600, 1600, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="শোভাযাত্রার রাস্তার ম্যাপ; গেট থেকে বের হয়ে পাঁচটা মোড়; তিন নম্বর মোড়ে রাস্তা বাঁয়ে এক কোণা ঘুরেছে; নাসিব বললো এইটা আমি লিখবো">
        <g transform="translate(6 14) scale(0.76)">
        <rect x={10} y={20} width={300} height={120} rx={3} fill="#fffbeb" stroke={INK} strokeOpacity={0.25} />
        <path d={MAP_ROUTE} fill="none" stroke="#9ca3af" strokeWidth={8} strokeLinejoin="round" />
        <rect x={10} y={112} width={10} height={12} fill="#b91c1c" />
        {MAP_X.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={7} fill={i === 2 && k >= 1 ? "#fde047" : "white"} stroke={INK} strokeOpacity={0.5} />
            <text x={x} y={y + 3} textAnchor="middle" fontSize={8} fontWeight={700} fontFamily={MONO} fill={INK}>
              {i + 1}
            </text>
          </g>
        ))}
        {k >= 1 && <Draw d="M122 112V74M116 80l6 -6l6 6" strokeWidth={2} className="stroke-[#e11d48]" />}
        </g>
        <Person who="nasib" x={278} y={150} facing={-1} label arm={k >= 2 ? "point" : "down"} mood={k >= 2 ? "smug" : "plain"} />
        {k >= 2 && <Bubble x={278} y={84} side="left" lines={["এইটা আমি লিখবো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · The same map. Near the bazaar the road bends only half a corner, and
//      there's no crossing there. Fahim's question.

export function BendInRoad({}: Story) {
  const s = useScene(2, [600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ম্যাপে বাজারের কাছে রাস্তা একটু বাঁকা, আধা কোণা; ফাহিম জিজ্ঞেস করলো ওইখানে মোড় থাকলে স্যার কী লিখতেন">
        <g transform="translate(6 14) scale(0.76)">
        <rect x={10} y={20} width={300} height={120} rx={3} fill="#fffbeb" stroke={INK} strokeOpacity={0.25} />
        <path d={MAP_ROUTE} fill="none" stroke="#9ca3af" strokeWidth={8} strokeLinejoin="round" />
        <rect x={188} y={30} width={40} height={16} rx={2} fill="#fed7aa" />
        <text x={208} y={41} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
          বাজার
        </text>
        {k >= 1 && <circle cx={220} cy={72} r={14} fill="none" stroke="#e11d48" strokeWidth={2} strokeDasharray="4 3" className={POP} />}
        </g>
        <Person who="fahim" x={278} y={150} facing={-1} label arm={k >= 1 ? "point" : "down"} mood={k >= 2 ? "puzzled" : "plain"} />
        {k >= 2 && <Bubble x={278} y={84} side="left" lines={["ওইখানে মোড় থাকলে", "স্যার কী লিখতেন?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · The notebook's last page: 0, 1, 1, 0, and "গেট" in pencil. Rina puts a
//      finger on the lotus's centre.

export function GatePage({}: Story) {
  const s = useScene(2, [600, 1400, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="খাতার শেষ পাতায় চারটা সংখ্যা 0, 1, 1, 0, নিচে পেন্সিলে লেখা গেট; রিনা পদ্মের মাঝখানে আঙুল রাখলো">
        <S_Pillar x={40} />
        <g className={POP}>
          <rect x={120} y={30} width={80} height={58} rx={2} fill="#fffbeb" stroke={INK} strokeOpacity={0.35} />
          <NB_SvgMat x={142} y={38} m={NB_SWAP} fs={13} gap={18} />
          <text x={160} y={80} textAnchor="middle" fontSize={9} fill="#64748b">
            গেট
          </text>
        </g>
        <Person who="rina" x={236} y={150} facing={-1} label arm={k >= 1 ? "point" : "down"} />
        {k >= 1 && (
          <g className={POP}>
            <path d="M190 140l7 -5l7 5l-7 5Z" fill="#f472b6" />
            <circle cx={197} cy={140} r={2} fill="#fde047" />
          </g>
        )}
        {k >= 2 && <text x={197} y={132} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={INK} className={FADE}>(3, 1)</text>}
      </Stage>
    </StoryFrame>
  );
}

// 10a · Night, crossing 5. Som holds the torch, Fahim reads, Rina chalks.
//       Fahim reads out the grid; Rina says "long fish" without looking up;
//       the long fish appears in chalk; Som moves the torch and says nothing.

export function NightChalk({}: Story) {
  const s = useScene(4, [600, 1400, 2200, 2200, 1800]);
  const k = s.k;
  const torch = k >= 4 ? 190 : 150;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাতে পাঁচ নম্বর মোড়; সোম টর্চ ধরে আছে, ফাহিম খাতা থেকে পড়ছে 3, 0, 0, 1; রিনা বললো লম্বা মাছ, আর chalk দিয়ে লম্বা একটা মাছ আঁকলো; সোম টর্চ একটু সরালো, কিছু বললো না">
        <rect x={0} y={150} width={320} height={30} fill="#374151" />
        {k >= 1 && <path d={`M96 92L${torch - 40} 172H${torch + 60}Z`} fill="#fef9c3" fillOpacity={0.28} className="transition-all duration-700 motion-reduce:transition-none" />}
        <Person who="som" x={80} y={150} label arm="point" />
        <Person who="fahim" x={34} y={150} label arm="hold" />
        <Person who="rina" x={250} y={150} facing={-1} label arm="point" />
        {k >= 3 && (
          <g>
            <Draw d="M130 166q30 -10 60 0q18 3 28 0q-10 -3 -28 0M130 166q30 10 60 0M130 166l-8 -5v10Z" strokeWidth={1.6} ms={1100} className="stroke-white" />
          </g>
        )}
        {k === 2 && <Bubble x={34} y={84} side="right" lines={["3, 0, 0, 1."]} />}
        {k === 3 && <Bubble x={250} y={84} side="left" lines={["লম্বা মাছ।"]} />}
      </Stage>
    </StoryFrame>
  );
}

/** a strip of paper with small 2 × 2 grids in a row, left edge at x */
function S_Strip({ x, y, w, grids, fs = 7, gap = 12, tone = "#fffbeb" }: { x: number; y: number; w: number; grids: M2[]; fs?: number; gap?: number; tone?: string }) {
  const h = fs * 2.6 + 12;
  const step = w / grids.length;
  return (
    <g className={POP}>
      <rect x={x} y={y} width={w} height={h} rx={2} fill={tone} stroke={INK} strokeOpacity={0.35} />
      {grids.map((m, i) => (
        <NB_SvgMat key={i} x={x + i * step + (step - 2 * gap) / 2} y={y + 6} m={m} fs={fs} gap={gap} />
      ))}
    </g>
  );
}

// 5a · Fahim writes six grids in his own notebook. Then the sir's page beside
//      it: none of the six is one of the sir's five.

export function FahimSix({}: Story) {
  const s = useScene(2, [600, 1800, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="ফাহিম নিজের খাতায় ছয়টা ঘর লিখলো; পাশে স্যারের খাতার পাঁচটা ঘর; কোনোটার সাথে কোনোটা মেলে না">
        <S_Steps />
        <Person who="fahim" x={42} y={150} label arm="hold" />
        {k === 0 && <S_Book x={52} y={112} />}
        {k >= 1 && (
          <>
            <S_Strip x={82} y={34} w={234} grids={ZOO.map(([m]) => m)} fs={6.5} gap={14} />
            <text x={86} y={29} fontSize={8} fill="#334155">
              ফাহিমের খাতা
            </text>
          </>
        )}
        {k >= 2 && (
          <>
            <S_Strip x={98} y={96} w={200} grids={NB_CROSS} tone="#fef3c7" />
            <text x={102} y={91} fontSize={8} fill="#334155">
              স্যারের খাতা
            </text>
            <g className={POP} stroke="#e11d48" strokeWidth={2} strokeLinecap="round">
              <path d="M190 72h14M190 78h14M200 68l-6 14" />
            </g>
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 8a · Dusk. Rina's chalk box, full. It opens: the colours. Then the open
//      notebook: five grids on one page, five sketches on the other.

const S8_CHALK = ["#f472b6", "#fde047", "#f8fafc", "#60a5fa", "#4ade80"];

export function EveningBox({}: Story) {
  const s = useScene(2, [600, 1500, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যা; রিনার chalk এর বাক্স ভরা, খুললে পাঁচ রঙের chalk; খাতা খোলা: এক পাতায় পাঁচটা ঘর, আরেক পাতায় পাঁচটা ছবি">
        <Person who="rina" x={56} y={150} label arm="hold" />
        <rect x={40} y={110} width={34} height={14} rx={1.5} fill="#92400e" />
        {k === 0 && <rect x={40} y={106} width={34} height={5} rx={1} fill="#b45309" />}
        {k >= 1 &&
          S8_CHALK.map((c, i) => (
            <rect key={i} x={43 + i * 6} y={103} width={4} height={10} rx={1.5} fill={c} stroke={INK} strokeOpacity={0.3} strokeWidth={0.5} className={POP} style={{ transitionDelay: `${i * 90}ms` }} />
          ))}
        {k >= 2 && (
          <>
            <S_Strip x={96} y={22} w={218} grids={NB_CROSS} />
            <g className={POP}>
              <rect x={96} y={62} width={218} height={44} rx={2} fill="#fffbeb" stroke={INK} strokeOpacity={0.35} />
              {RN_ORDER.map((g, i) => (
                <NB_Sketch key={i} cols={colsOf(NB_CROSS[g])} w={40} h={36} label={`ছবি ${i + 1}`} at={[99 + i * 42.6, 66]} />
              ))}
            </g>
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 10b · The morning after. Night, crossing 5, nobody on the road. Morning.
//       On the road no fish, no lotus: one long streak, pink and yellow. Then
//       the page Rina ran by torchlight, 1, 0, 0, 0, and a "?" (the next
//       journey's question; nothing here answers it).

const S10_ONE: M2 = [
  [1, 0],
  [0, 0],
];

export function MorningLine({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop={k >= 1 ? "street" : "night"} label="রাতে পাঁচ নম্বর মোড় খালি; সকালে রোদ; রাস্তায় মাছ নাই, পদ্ম নাই, একটা লম্বা গোলাপি আর হলুদ দাগ; খাতার পাতায় 1, 0, 0, 0, আর একটা প্রশ্নবোধক">
        {k >= 1 && <circle cx={286} cy={30} r={13} fill="#fde047" className={FADE} />}
        <rect x={0} y={150} width={320} height={30} fill={k >= 1 ? "#6b7280" : "#374151"} className="transition-colors duration-700 motion-reduce:transition-none" />
        <S_Pillar x={36} />
        {k >= 2 && (
          <g>
            <Draw d="M70 166H190" strokeWidth={4} ms={900} className="stroke-[#f472b6]" />
            <Draw d="M170 166H290" strokeWidth={4} ms={900} delay={500} className="stroke-[#fbbf24]" />
          </g>
        )}
        {k >= 3 && (
          <>
            <g className={POP}>
              <rect x={128} y={62} width={60} height={46} rx={2} fill="#fffbeb" stroke={INK} strokeOpacity={0.35} />
              <NB_SvgMat x={142} y={72} m={S10_ONE} fs={12} gap={16} />
            </g>
            <g className={POP} style={{ transitionDelay: "500ms" }}>
              <circle cx={214} cy={84} r={13} fill="white" />
              <text x={214} y={90.5} textAnchor="middle" fontSize={18} fontWeight={800} fill={INK}>
                ?
              </text>
            </g>
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows. On a white sheet,
// so the ink is fixed in both themes.

function Sheet({ w, h, children, label, narrow = false }: { w: number; h: number; children: ReactNode; label: string; narrow?: boolean }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className={`mx-auto block h-auto w-full ${narrow ? "max-w-[7rem]" : "max-w-[19rem]"}`}>
      <rect width={w} height={h} rx={6} fill="white" />
      {children}
    </svg>
  );
}

// 1½ · The route: the gate, five crossings, a grid of four numbers at each,
//      and a "?" where the picture should be.

/** where each crossing's grid sits on the route figure (top-left) */
const RM_AT: XY[] = [
  [18, 104],
  [120, 112],
  [56, 50],
  [150, 44],
  [232, 70],
];
const X1_SAY = ["গেট থেকে শোভাযাত্রার রাস্তা।", "রাস্তায় পাঁচটা মোড়।", "প্রতিটা মোড়ের জন্য খাতায় চারটা সংখ্যা।", "কোন ছবি কোন মোড়ের, লেখা নাই।"];

export function RouteMap() {
  const s = useScene(3, [600, 1300, 1800, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <Sheet w={320} h={150} label="গেট থেকে রাস্তা, পাঁচটা মোড়, প্রতিটার পাশে চারটা সংখ্যা আর একটা প্রশ্নবোধক">
        <path d={MAP_ROUTE} transform="translate(0 20)" fill="none" stroke="#9ca3af" strokeWidth={8} strokeLinejoin="round" />
        <rect x={10} y={132} width={10} height={12} fill="#b91c1c" />
        {k >= 1 &&
          MAP_X.map(([x, y], i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 120}ms` }}>
              <circle cx={x} cy={y + 20} r={7} fill="white" stroke={INK} strokeOpacity={0.5} />
              <text x={x} y={y + 23} textAnchor="middle" fontSize={8} fontWeight={700} fontFamily={MONO} fill={INK}>
                {i + 1}
              </text>
            </g>
          ))}
        {k >= 2 && RM_AT.map(([x, y], i) => <NB_SvgMat key={i} x={x} y={y} m={NB_CROSS[i]} fs={9.5} gap={12} />)}
        {k >= 3 &&
          RM_AT.map(([x, y], i) => (
            <g key={i} className={POP}>
              <rect x={x + 27} y={y + 2} width={16} height={20} rx={2} fill="white" stroke="#64748b" strokeDasharray="2 2" />
              <text x={x + 35} y={y + 16} textAnchor="middle" fontSize={11} fontWeight={800} fill="#64748b">
                ?
              </text>
            </g>
          ))}
      </Sheet>
    </Scene>
  );
}

// 2½ · The ropes stand up in the grid: the amber end (2, 1) becomes column 1,
//      the teal end (1, 2) column 2. Then (3, 0): three amber ropes end to end.

const X2_F = makeFrame(-0.5, 6.8, -0.5, 3.6, 22, 8);
const X2_SAY = ["কালকের দুই দড়ি।", "Amber দড়ির মাথা (2, 1) খাড়া হয়ে বসলো প্রথম column এ।", "সবুজ দড়ির মাথা (1, 2) দ্বিতীয় column এ।", "(3, 0) মানে তিনবার amber দড়ি: 3 × (2, 1) = (6, 3)।"];

export function RopesStandUp() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const f = X2_F;
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <svg viewBox={`0 0 ${f.W + 70} ${f.H}`} role="img" aria-label="দুই দড়ির মাথা grid এর দুই column; তিনবার amber দড়ি হেঁটে (6, 3)" className="mx-auto block h-auto w-full max-w-[18rem]">
        <RoadBed f={f} />
        <ChalkGrid f={f} move={(p) => p} x0={0} x1={6} y0={0} y1={3} />
        <Pillar f={f} />
        {k >= 3 &&
          [0, 1, 2].map((i) => (
            <path key={i} d={`M${f.sx(2 * i)} ${f.sy(i)}L${f.sx(2 * i + 2)} ${f.sy(i + 1)}`} stroke="#f59e0b" strokeWidth={2.4} strokeDasharray="5 3" className={FADE} style={{ transitionDelay: `${i * 300}ms` }} />
          ))}
        {k >= 3 && <circle cx={f.sx(6)} cy={f.sy(3)} r={4.5} fill="#fde047" className={POP} style={{ transitionDelay: "900ms" }} />}
        <NB_Rope f={f} to={[2, 1]} which={1} />
        <NB_Rope f={f} to={[1, 2]} which={2} />
        {k >= 1 && <rect x={f.W + 4} y={f.H / 2 - 24} width={62} height={48} rx={4} fill="white" />}
        {k >= 1 && <NB_SvgMat x={f.W + 12} y={f.H / 2 - 14} m={NB_G} tint fs={12} gap={23} show={[k >= 1, k >= 2]} />}
      </svg>
    </Scene>
  );
}

// 3½ · Half a turn, from the ropes: they swing round the pillar to (−1, 0)
//      and (0, −1), the columns fill, and (2, 3) crosses to (−2, −3).

const X3_F = makeFrame(-3.4, 3.4, -3.4, 3.4, 17, 8);
const X3_SAY = ["e₁ আর e₂, খুঁটি থেকে।", "আধা পাক: e₁ গেলো (−1, 0), e₂ গেলো (0, −1)।", "দুই column বসালেই grid.", "(2, 3) গেলো খুঁটির ঠিক উল্টা পাশে, (−2, −3)।"];

export function HalfTurnCols() {
  const s = useScene(3, [600, 1800, 1600, 2200]);
  const k = s.k;
  const f = X3_F;
  const cx = f.sx(0);
  const cy = f.sy(0);
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <svg viewBox={`0 0 ${f.W + 70} ${f.H}`} role="img" aria-label="দুই দড়ি খুঁটির চারপাশে আধা পাক ঘুরলো; grid হলো −1 0, 0 −1; (2, 3) গেলো (−2, −3)" className="mx-auto block h-auto w-full max-w-[16rem]">
        <RoadBed f={f} />
        <ChalkGrid f={f} move={(p) => p} x0={-3} x1={3} y0={-3} y1={3} />
        <g className="transition-transform duration-1000 ease-out motion-reduce:transition-none" style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box", transform: k >= 1 ? "rotate(180deg)" : "none" }}>
          <Rope f={f} to={[1, 0]} which={1} />
          <Rope f={f} to={[0, 1]} which={2} />
        </g>
        {([k >= 1 ? [-1, 0] : [1, 0], k >= 1 ? [0, -1] : [0, 1]] as XY[]).map((e, i) => (
          <NB_RopeTap key={`${i}${k >= 1}`} a={[cx, cy]} b={[f.sx(e[0]), f.sy(e[1])]} list={listOf([0, 0], e)} color={i === 0 ? "#f59e0b" : "#2dd4bf"} />
        ))}
        <Pillar f={f} />
        {k >= 3 && (
          <g>
            <Draw d={`M${f.sx(2)} ${f.sy(3)}L${f.sx(-2)} ${f.sy(-3)}`} strokeWidth={1.4} ms={900} className="stroke-[#fde047]" />
            <circle cx={f.sx(2)} cy={f.sy(3)} r={4} fill="#fde047" />
            <circle cx={f.sx(-2)} cy={f.sy(-3)} r={4} fill="#fde047" className={POP} style={{ transitionDelay: "800ms" }} />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <rect x={f.W + 4} y={f.H / 2 - 24} width={62} height={48} rx={4} fill="white" />
            <NB_SvgMat x={f.W + 12} y={f.H / 2 - 14} m={NB_HALF} tint fs={12} gap={23} />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · A row is a box. Row 1 and the tip (2, 3) side by side, slot times slot,
//      added: 7. Row 2: 8. Then the label: every row is one of 4.x's boxes.

const X4_SAY = ["Row 1: (2, 1). Petal এর আগা: (2, 3)।", "Slot এর সাথে slot গুণ, তারপর যোগ: 4 + 3 = 7।", "Row 2 একই কাজ করে: 2 + 6 = 8।", "দুইটা row, দুইটা dot product। উত্তর (7, 8)।"];

export function RowSlide() {
  const s = useScene(3, [600, 2000, 2000, 2200]);
  const k = s.k;
  const line = (y: number, row: [number, number], sum: number, on: boolean, show: boolean) => (
    <g opacity={on ? 1 : 0.35}>
      <text x={20} y={y} fontSize={13} fontFamily={MONO} fontWeight={700} fill={INK}>
        ({row[0]}, {row[1]})
      </text>
      <text x={78} y={y} fontSize={11} fill="#64748b">
        ·
      </text>
      <text x={90} y={y} fontSize={13} fontFamily={MONO} fontWeight={700} fill={INK}>
        (2, 3)
      </text>
      {show && (
        <text x={148} y={y} fontSize={12} fontFamily={MONO} fill={INK} className={FADE}>
          = {row[0]}×2 + {row[1]}×3 = <tspan fontWeight={800} fill="#1d4ed8">{sum}</tspan>
        </text>
      )}
    </g>
  );
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <Sheet w={300} h={96} label="grid এর প্রতিটা row petal এর আগা (2, 3) এর সাথে dot product: 2×2 + 1×3 = 7, 1×2 + 2×3 = 8">
        {line(30, [2, 1], 7, k !== 2, k >= 1)}
        {line(58, [1, 2], 8, k >= 2, k >= 2)}
        {k >= 3 && (
          <g className={POP}>
            <rect x={20} y={70} width={260} height={18} rx={4} fill="#dbeafe" />
            <text x={150} y={83} textAnchor="middle" fontSize={10} fontWeight={700} fill="#1d4ed8">
              প্রতিটা row = 4.x এর একটা dot product
            </text>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// 5½ · The grams trap. Three people as dots; A's nearest is B. The grid
//      [[1,0],[0,3]] stretches only the upright line, and A's nearest becomes C.

const X5_SAY = ["তিনজন মানুষ, দুইটা feature। A এর twin B.", "[[1,0],[0,3]]: শুধু খাড়া দিকটা 3 গুণ, unit বদলানোর মত।", "এবার A এর twin C। মানুষ একই, map বদলে গেছে।"];
const X5_PTS: [string, XY][] = [
  ["A", [1, 1]],
  ["B", [1, 1.6]],
  ["C", [2, 1]],
];

export function StretchTrap() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const f = makeFrame(0, 3, 0, 5.2, 34, 12);
  const sy = (y: number) => f.sy(k >= 1 ? y * 3 : y);
  const near = k >= 2 ? 2 : 1;
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <Sheet narrow w={f.W} h={f.H} label="তিনটা dot; খাড়া দিক 3 গুণ টানলে A এর সবচেয়ে কাছের dot B থেকে C হয়ে যায়">
        <g className="transition-transform duration-1000 motion-reduce:transition-none">
          {[0, 1, 2, 3, 4, 5].map((y) => (
            <path key={y} d={`M${f.sx(0)} ${sy(y)}H${f.sx(3)}`} stroke="#93c5fd" strokeOpacity={0.6} strokeWidth={0.6} className="transition-all duration-1000 motion-reduce:transition-none" />
          ))}
          {[0, 1, 2, 3].map((x) => (
            <path key={x} d={`M${f.sx(x)} ${f.sy(0)}V${f.sy(5.2)}`} stroke="#93c5fd" strokeOpacity={0.6} strokeWidth={0.6} />
          ))}
        </g>
        <path d={`M${f.sx(X5_PTS[0][1][0])} ${sy(X5_PTS[0][1][1])}L${f.sx(X5_PTS[near][1][0])} ${sy(X5_PTS[near][1][1])}`} stroke={OK} strokeWidth={2} strokeDasharray="4 3" className="transition-all duration-1000 motion-reduce:transition-none" />
        {X5_PTS.map(([n, p]) => (
          <g key={n}>
            <circle cx={f.sx(p[0])} cy={sy(p[1])} r={5} fill={n === "A" ? "#1d4ed8" : "#64748b"} className="transition-all duration-1000 motion-reduce:transition-none" />
            <text x={f.sx(p[0]) + 8} y={sy(p[1]) + 4} fontSize={11} fontWeight={700} fill={INK} className="transition-all duration-1000 motion-reduce:transition-none">
              {n}
            </text>
          </g>
        ))}
      </Sheet>
    </Scene>
  );
}

// 6½ · The quarter turn. The ropes swing a quarter left; columns fill with
//      (0, 1) and (−1, 0). Then the grid read by rows, [[0,1],[−1,0]], swings
//      the other way, in red.

const X6_F = makeFrame(-1.8, 1.8, -1.8, 1.8, 36, 8);
const X6_SAY = ["e₁ আর e₂, খুঁটি থেকে।", "বাম দিকে এক কোণা: e₁ গেলো উপরে (0, 1), e₂ গেলো বামে (−1, 0)।", "Column বসালে [[0,−1],[1,0]].", "Row ধরে উল্টা লিখলে [[0,1],[−1,0]]: দড়ি ঘোরে ডানে।"];

export function QuarterSwing() {
  const s = useScene(3, [600, 1800, 1600, 2400]);
  const k = s.k;
  const f = X6_F;
  const cx = f.sx(0);
  const cy = f.sy(0);
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      <svg viewBox={`0 0 ${f.W + 70} ${f.H}`} role="img" aria-label="দুই দড়ি বাম দিকে এক কোণা ঘুরলো; grid 0 −1, 1 0; উল্টা লেখা grid দড়ি ডানে ঘোরায়" className="mx-auto block h-auto w-full max-w-[16rem]">
        <RoadBed f={f} />
        <ChalkGrid f={f} move={(p) => p} x0={-1} x1={1} y0={-1} y1={1} />
        <g className="transition-transform duration-1000 ease-out motion-reduce:transition-none" style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box", transform: k >= 1 ? "rotate(-90deg)" : "none" }}>
          <Rope f={f} to={[1, 0]} which={1} />
          <Rope f={f} to={[0, 1]} which={2} />
        </g>
        {([k >= 1 ? [0, 1] : [1, 0], k >= 1 ? [-1, 0] : [0, 1]] as XY[]).map((e, i) => (
          <NB_RopeTap key={`${i}${k >= 1}`} a={[cx, cy]} b={[f.sx(e[0]), f.sy(e[1])]} list={listOf([0, 0], e)} color={i === 0 ? "#f59e0b" : "#2dd4bf"} />
        ))}
        {k >= 3 && (
          <g className={FADE}>
            <path d={`M${cx} ${cy}L${f.sx(0)} ${f.sy(-1)}M${cx} ${cy}L${f.sx(1)} ${f.sy(0)}`} stroke={BAD} strokeWidth={2} strokeDasharray="4 3" />
            <path d={`M${f.sx(0.75)} ${f.sy(0.75)}A${f.u} ${f.u} 0 0 1 ${f.sx(0.75)} ${f.sy(-0.75)}`} fill="none" stroke={BAD} strokeWidth={1.4} />
          </g>
        )}
        <Pillar f={f} />
        {k >= 2 && <rect x={f.W + 4} y={f.H / 2 - 24} width={62} height={48} rx={4} fill="white" />}
        {k >= 2 && k < 3 && <NB_SvgMat x={f.W + 12} y={f.H / 2 - 14} m={NB_QUARTER} tint fs={12} gap={23} />}
        {k >= 3 && (
          <g>
            <NB_SvgMat x={f.W + 12} y={f.H / 2 - 14} m={[[0, 1], [-1, 0]]} fs={12} gap={23} />
            <path d={`M${f.W + 8} ${f.H / 2 + 20}H${f.W + 62}`} stroke={BAD} strokeWidth={1.5} />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 7½ · The rope's end on a circle. At 0°, 30°, 60°, 90° the rope stands at θ;
//      its floor shadow shrinks from 1 to 0 and the other shadow grows 0 → 1.

const X7_F = makeFrame(-0.3, 1.3, -0.3, 1.3, 90, 10);
const X7_DEG = [0, 30, 60, 90];
const X7_SAY = ["θ = 0°: মেঝের ছায়া 1, অন্য ছায়া 0।", "θ = 30°: মেঝের ছায়া 0.87, অন্য ছায়া 0.5.", "θ = 60°: 0.5 আর 0.87. দুইটা জায়গা বদল করলো।", "θ = 90°: মেঝের ছায়া 0, অন্য ছায়া 1। cos 90° আর sin 90°."];

export function ShadowCircle() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const f = X7_F;
  const d = X7_DEG[k];
  const r = (d * Math.PI) / 180;
  const c = Math.cos(r);
  const sn = Math.sin(r);
  const tr = "transition-all duration-700 motion-reduce:transition-none";
  return (
    <Scene scene={s} caption={say(X7_SAY, k)}>
      <Sheet w={f.W + 60} h={f.H} label="1 লম্বা দড়ি θ কোণে; মেঝেতে ছায়া cos θ, খাড়া দিকে ছায়া sin θ">
        <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(1.25)}M${f.sx(0)} ${f.sy(0)}V${f.sy(1.25)}`} stroke={INK} strokeOpacity={0.4} />
        <path d={`M${f.sx(1)} ${f.sy(0)}A${f.u} ${f.u} 0 0 0 ${f.sx(0)} ${f.sy(1)}`} fill="none" stroke="#94a3b8" strokeDasharray="3 3" />
        <g style={{ transform: `translate(${f.sx(0)}px, ${f.sy(0)}px)` }}>
          <line x1={0} y1={0} x2={f.u} y2={0} stroke="#ca8a04" strokeWidth={6} strokeLinecap="round" className={tr} style={{ transform: `scaleX(${c})` }} />
          <line x1={0} y1={0} x2={0} y2={-f.u} stroke="#7c3aed" strokeWidth={6} strokeLinecap="round" className={tr} style={{ transform: `scaleY(${sn})` }} />
          <line x1={0} y1={0} x2={f.u} y2={0} stroke="#f59e0b" strokeWidth={2.6} strokeLinecap="round" className={tr} style={{ transform: `rotate(${-d}deg)` }} />
        </g>
        <NB_RopeTap key={d} a={[f.sx(0), f.sy(0)]} b={[f.sx(c), f.sy(sn)]} list={`(${num(c)}, ${num(sn)})`} color="#f59e0b" />
        <path d={`M${f.sx(c)} ${f.sy(sn)}V${f.sy(0)}M${f.sx(c)} ${f.sy(sn)}H${f.sx(0)}`} stroke={INK} strokeOpacity={0.35} strokeDasharray="2 3" />
        <rect x={f.sx(0) - 5} y={f.sy(0) - 5} width={10} height={10} rx={2} fill="#b91c1c" />
        <text x={f.W + 4} y={f.sy(0.2)} fontSize={10} fontWeight={700} fill="#a16207">
          cos θ
        </text>
        <text x={f.W + 4} y={f.sy(0.2) + 14} fontSize={10} fontFamily={MONO} fill="#a16207">
          {num(c)}
        </text>
        <text x={f.W + 4} y={f.sy(1)} fontSize={10} fontWeight={700} fill="#6d28d9">
          {k >= 3 ? "sin θ" : "অন্য ছায়া"}
        </text>
        <text x={f.W + 4} y={f.sy(1) + 14} fontSize={10} fontFamily={MONO} fill="#6d28d9">
          {num(sn)}
        </text>
      </Sheet>
    </Scene>
  );
}

// 7¾ · R(θ) built from the two ropes. The amber rope at some angle θ, its end
//      marked (cos θ, sin θ); the teal one a corner ahead, (−sin θ, cos θ);
//      the two columns drop into brackets and R(θ) lands last. Then θ = 90°:
//      both ropes swing, and crossing 3's grid comes back.

const X7B_F = makeFrame(-1.35, 1.35, -0.25, 1.3, 70, 8);
const X7B_TH = 35;
const X7B_SAY = ["তাহলে e₁ যায় (cos θ, sin θ) তে।", "e₂ সবসময় e₁ থেকে এক কোণা এগিয়ে, তাই (−sin θ, cos θ)।", "দুই column বসালে যেকোনো angle এর grid: R(θ)।", "θ = 90° দিলে তিন নম্বর মোড়ের grid ই ফেরত আসে।"];

export function RotorBuild() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  const f = X7B_F;
  const d = k >= 3 ? 90 : X7B_TH;
  const at = (deg: number, r = 1): XY => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
  const tr = "transition-transform duration-1000 ease-out motion-reduce:transition-none";
  const ox = f.sx(0);
  const oy = f.sy(0);
  // a rope end's label rides with it (a CSS transform, so it glides)
  const tag = (deg: number, r: number, text: string, fill: string, show: boolean) => {
    const [x, y] = at(deg, r);
    return show ? (
      <g className={tr} style={{ transform: `translate(${f.sx(x)}px, ${f.sy(y)}px)` }}>
        <text textAnchor="middle" y={4} fontSize={10.5} fontWeight={700} fill={fill} stroke="white" strokeWidth={3} paintOrder="stroke" className={FADE}>
          {text}
        </text>
      </g>
    ) : null;
  };
  const mx = f.W + 8;
  const my = f.H / 2 - 22;
  const cell = (c: number, r: number, text: string) => (
    <text x={mx + 34 + c * 46} y={my + 16 + r * 18} textAnchor="middle" fontSize={11} fontWeight={700} fill={c === 0 ? AMB : TEA} className={FADE}>
      {text}
    </text>
  );
  const nine = k >= 3;
  return (
    <Scene scene={s} caption={say(X7B_SAY, k)}>
      <Sheet w={f.W + 118} h={f.H} label="1 লম্বা দুই দড়ি; amber দড়ির মাথা (cos θ, sin θ), সবুজটা এক কোণা এগিয়ে (−sin θ, cos θ); দুই column মিলে R(θ); θ = 90° দিলে 0, −1, 1, 0">
        <path d={`M${f.sx(-1.25)} ${oy}H${f.sx(1.25)}M${ox} ${oy}V${f.sy(1.25)}`} stroke={INK} strokeOpacity={0.35} />
        <path d={`M${f.sx(1)} ${oy}A${f.u} ${f.u} 0 0 0 ${f.sx(-1)} ${oy}`} fill="none" stroke="#94a3b8" strokeDasharray="3 3" />
        <g style={{ transform: `translate(${ox}px, ${oy}px)` }}>
          <line x1={0} y1={0} x2={f.u} y2={0} stroke="#f59e0b" strokeWidth={3} strokeLinecap="round" className={tr} style={{ transform: `rotate(${-d}deg)` }} />
          {k >= 1 && <line x1={0} y1={0} x2={f.u} y2={0} stroke="#14b8a6" strokeWidth={3} strokeLinecap="round" className={tr} style={{ transform: `rotate(${-(d + 90)}deg)` }} />}
        </g>
        <NB_RopeTap key={`a${d}`} a={[ox, oy]} b={[f.sx(at(d)[0]), f.sy(at(d)[1])]} list={nine ? "(0, 1)" : "(cos θ, sin θ)"} color="#f59e0b" />
        {k >= 1 && <NB_RopeTap key={`b${d}`} a={[ox, oy]} b={[f.sx(at(d + 90)[0]), f.sy(at(d + 90)[1])]} list={nine ? "(−1, 0)" : "(−sin θ, cos θ)"} color="#14b8a6" />}
        {!nine && <path d={`M${f.sx(0.32)} ${oy}A${f.u * 0.32} ${f.u * 0.32} 0 0 0 ${f.sx(at(X7B_TH, 0.32)[0])} ${f.sy(at(X7B_TH, 0.32)[1])}`} fill="none" stroke={INK} strokeOpacity={0.5} />}
        {!nine && (
          <text x={f.sx(0.42)} y={f.sy(0.1)} fontSize={9} fill={INK} fillOpacity={0.7}>
            θ
          </text>
        )}
        <rect x={ox - 5} y={oy - 5} width={10} height={10} rx={2} fill="#b91c1c" />
        {tag(d, 1.2, nine ? "(0, 1)" : "(cos θ, sin θ)", AMB, true)}
        {tag(d + 90, 1.2, nine ? "(−1, 0)" : "(−sin θ, cos θ)", TEA, k >= 1)}
        {k >= 2 && (
          <g className={FADE}>
            <path d={`M${mx + 12} ${my}h-4v${44}h4M${mx + 102} ${my}h4v${44}h-4`} fill="none" stroke={INK} strokeWidth={1.2} />
            {nine ? (
              <g key="n">
                {cell(0, 0, "0")}
                {cell(0, 1, "1")}
                {cell(1, 0, "−1")}
                {cell(1, 1, "0")}
              </g>
            ) : (
              <g key="t">
                {cell(0, 0, "cos θ")}
                {cell(0, 1, "sin θ")}
                {cell(1, 0, "−sin θ")}
                {cell(1, 1, "cos θ")}
              </g>
            )}
            <text x={mx + 55} y={my - 8} textAnchor="middle" fontSize={12} fontWeight={800} fill={INK} className={POP}>
              {nine ? "R(90°)" : "R(θ)"}
            </text>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// 9½ · The swap. The two ropes trade places; the diagonal y = x is drawn;
//      (5, 2) crosses it to (2, 5) and (2, 2) stays put.

const X9_F = makeFrame(-0.5, 5.6, -0.5, 5.6, 26, 8);
const X9_SAY = ["e₁ (1, 0), e₂ (0, 1).", "Grid [[0,1],[1,0]]: দুই দড়ি জায়গা বদল করলো।", "কোনাকুনি y = x লাইনটা আয়না।", "(5, 2) গেলো (2, 5)। লাইনের উপরের (2, 2) নড়লো না।"];

export function SwapRopes() {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  const f = X9_F;
  return (
    <Scene scene={s} caption={say(X9_SAY, k)}>
      <svg viewBox={`0 0 ${f.W} ${f.H}`} role="img" aria-label="দুই দড়ি জায়গা বদল করে; y = x লাইন আয়না; (5, 2) যায় (2, 5)" className="mx-auto block h-auto w-full max-w-[12rem]">
        <RoadBed f={f} />
        <ChalkGrid f={f} move={(p) => p} x0={0} x1={5} y0={0} y1={5} />
        {k >= 2 && <Draw d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(5.4)} ${f.sy(5.4)}`} strokeWidth={2} className="stroke-[#fde047]" />}
        {k >= 1 && (
          <>
            <path d={`M${f.sx(1)} ${f.sy(0)}L${f.sx(0)} ${f.sy(1)}`} stroke="white" strokeOpacity={0.5} strokeDasharray="2 2" />
          </>
        )}
        <NB_Rope f={f} to={k >= 1 ? [0, 1] : [1, 0]} which={1} />
        <NB_Rope f={f} to={k >= 1 ? [1, 0] : [0, 1]} which={2} />
        <Pillar f={f} />
        {k >= 3 && (
          <g>
            <circle cx={f.sx(5)} cy={f.sy(2)} r={4} fill="white" />
            <Draw d={`M${f.sx(5)} ${f.sy(2)}L${f.sx(2)} ${f.sy(5)}`} strokeWidth={1.4} ms={800} className="stroke-white [stroke-dasharray:3_3]" />
            <circle cx={f.sx(2)} cy={f.sy(5)} r={4.5} fill="#fde047" className={POP} style={{ transitionDelay: "700ms" }} />
            <circle cx={f.sx(2)} cy={f.sy(2)} r={4} fill="#f472b6" stroke="white" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 10½ · The bet settled: five grids on the left, five sketches on the right,
//       joined one by one. Crossing 4 (the bet) last, and marked.

const X10_SAY = ["পাঁচটা grid, পাঁচটা ছবি।", "মোড় 1: দুই দড়িই 2 গুণ। সব 2 গুণ বড়।", "মোড় 2: e₂ নিচে। আয়নায় উল্টা।", "মোড় 3: e₁ উপরে, e₂ বামে। এক কোণা ঘোরা।", "মোড় 5: e₁ 3 গুণ। লম্বা মাছ।", "মোড় 4, বাজির ঘর: e₂ গেলো (1, 1)। ডানে হেলানো।"];
const X10_ORDER = [0, 1, 2, 4, 3];

export function BetSettled() {
  const s = useScene(5, [600, 1400, 1400, 1400, 1400, 2400]);
  const k = s.k;
  const linked = X10_ORDER.slice(0, k);
  const colX = (i: number) => 4 + i * 63;
  return (
    <Scene scene={s} caption={say(X10_SAY, k)}>
      <Sheet w={320} h={150} label="পাঁচটা grid আর পাঁচটা ছবি দাগ দিয়ে মেলানো; চার নম্বর মোড়ের grid ডানে হেলানো ছবির সাথে">
        {NB_CROSS.map((m, i) => (
          <g key={i}>
            <text x={colX(i) + 29} y={12} textAnchor="middle" fontSize={8} fill="#64748b">
              মোড় {i + 1}
            </text>
            <NB_SvgMat x={colX(i) + 13} y={17} m={m} tint fs={10} gap={16} />
          </g>
        ))}
        {RN_ORDER.map((g, slot) => (
          <g key={slot}>
            <NB_Sketch cols={colsOf(NB_CROSS[g])} w={58} h={48} label={`ছবি ${slot + 1}`} at={[colX(slot), 98]} />
            <rect x={colX(slot) - 1} y={97} width={60} height={50} rx={3} fill="none" stroke={linked.includes(g) ? (g === 3 ? "#1d4ed8" : OK) : "#cbd5e1"} strokeWidth={linked.includes(g) ? 1.8 : 0.8} />
          </g>
        ))}
        {linked.map((g) => (
          <Draw key={g} d={`M${colX(g) + 29} 46L${colX(RN_ORDER.indexOf(g)) + 29} 95`} strokeWidth={g === 3 ? 2.6 : 1.4} ms={600} className={g === 3 ? "stroke-[#1d4ed8]" : "stroke-[#0d9488]"} />
        ))}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  NotebookBet: { start: {}, bet: { bet: 1 }, up: { bet: 0 } },
  RopesInTheGrid: { start: {}, half: { e1: [2, 1] }, swapped: { e1: [1, 2], e2: [2, 1] }, done: { e1: [2, 1], e2: [1, 2], done: true } },
  BuildTheGrid: { start: {}, wrong: { m: [[-1, 0], [0, 1]], shown: [[-1, 0], [0, 1]], miss: 1 }, right: { m: NB_HALF, shown: NB_HALF } },
  RowReading: { start: {}, one: { rows: [true, false], act: 0 }, done: { rows: [true, true], act: 1 } },
  ZooWalk: { start: {}, triple: { cur: 1, seen: [0, 1] }, shear: { cur: 4, seen: [0, 1, 2, 3, 4] }, done: { cur: 5, seen: [0, 1, 2, 3, 4, 5] } },
  MakeQuarterTurn: { start: {}, clockwise: { m: [[0, 1], [-1, 0]], shown: [[0, 1], [-1, 0]], miss: 1 }, right: { m: NB_QUARTER, shown: NB_QUARTER } },
  AnyAngle: { start: {}, d30: { deg: 30, seen: [0, 15, 30] }, done: { deg: 90, seen: [0, 15, 30, 45, 60, 75, 90] } },
  ReadTheNotebook: { start: {}, sel: { sel: 3 }, wrong: { sel: 3, tried: [3, 1], miss: 1 }, some: { done: [0, 3], tried: [3, 0] }, done: { done: [0, 1, 2, 3, 4], tried: [4, 2] } },
  TryMirror: { start: {}, wrong: { pick: [3, 1], miss: 1 }, right: { pick: [1, 3] } },
  // Story scenes and figures: `k` is the beat shown (no seed shows the last).
  SickMorning: { rest: { k: 0 }, page: { k: 2 }, flip: { k: 3 }, done: {} },
  LastNightPage: { rest: { k: 0 }, done: {} },
  BlankPage: { done: {} },
  SomReadsRows: { som: { k: 2 }, rina: { k: 3 }, done: {} },
  FahimSix: { mine: { k: 1 }, done: {} },
  EveningBox: { shut: { k: 0 }, open: { k: 1 }, done: {} },
  MorningLine: { night: { k: 0 }, streak: { k: 2 }, done: {} },
  RotorBuild: { e1: { k: 0 }, e2: { k: 1 }, built: { k: 2 }, done: {} },
  CornerMap: { done: {} },
  BendInRoad: { done: {} },
  GatePage: { done: {} },
  NightChalk: { read: { k: 2 }, fish: { k: 3 }, done: {} },
  RouteMap: { grids: { k: 2 }, done: {} },
  RopesStandUp: { col: { k: 1 }, done: {} },
  HalfTurnCols: { rest: { k: 0 }, done: {} },
  RowSlide: { one: { k: 1 }, done: {} },
  StretchTrap: { rest: { k: 0 }, done: {} },
  QuarterSwing: { cols: { k: 2 }, done: {} },
  ShadowCircle: { d30: { k: 1 }, done: {} },
  SwapRopes: { swap: { k: 1 }, done: {} },
  BetSettled: { rest: { k: 0 }, done: {} },
};
