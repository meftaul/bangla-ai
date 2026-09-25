"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useId, useState } from "react";

import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, Ticks, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { type Frame, type XY, makeFrame, sg } from "@/components/journey/plane";
import { Alpana, ChalkGrid, FISH, ID, PETALS, Pillar, RoadBed, Rope, apply, byCols, partway, pathOf, type Cols, type Move } from "@/components/interactive/road-kit";

// Screens for "Math for AI 6.5 — The flat crossing, what can't be undone",
// told as a Journey. The plan is 06_journey_specs.md, block 6.5.
//
// Eight screens. 1 seals the bet: the magazine wants the five আলপনা back on
// paper, Nasib says "run it backwards" works for all five; the reader ticks
// the crossings that will come back. 2 runs two of them backwards by hand
// (halve the double, push the shear back). 3 is the fifth crossing, flattened
// onto one line: every spot on the line has a whole column of candidates.
// 4 is the শোভাযাত্রা's owl at noon: raise it and the shadow doesn't move
// (3 numbers → 2). 5 is the other way, the owl's cage: 2 in, 3 out, a 3 × 2
// built from where (1, 0) and (0, 1) go. 6 is the reader's own sort (the two
// crossings not yet tried, plus three of last year's), 7 the Try it: which
// line does [[1, 1], [1, 1]] press the road onto? 8 settles the bet.
//
// After the screens come the story scenes and the watch-only figures, each
// numbered after its screen (1a, 2½, …). The road, grid and আলপনা are the
// shared road-kit; the owl, its shadow and the frames are local (FC_…). The
// magazine boy তপু borrows Samin's look and the art sir Nana's, each with the
// name drawn under his feet.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const OK = "#0d9488";
const BAD = "#e11d48";
const AMBER = "#f59e0b";
const CHALK = "#f8fafc";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** Tap or Enter/Space on an SVG group that acts as a button. */
const press = (fn: () => void) => ({
  role: "button",
  tabIndex: 0,
  onClick: fn,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  },
});

// ---------------------------------------------------------------------------
// The five crossings on the route (6.4's notebook), as columns (where the two
// ropes land). The fifth was meant to be [[3, 0], [0, 1]]; Rina chalked
// [[1, 0], [0, 0]].

const FC_CROSS: { name: string; cols: Cols; back: boolean }[] = [
  { name: "দ্বিগুণ", cols: [[2, 0], [0, 2]], back: true },
  { name: "আয়না", cols: [[1, 0], [0, -1]], back: true },
  { name: "ঘোরানো", cols: [[0, 1], [-1, 0]], back: true },
  { name: "shear", cols: [[1, 0], [1, 1]], back: true },
  { name: "পাঁচ নম্বর", cols: [[1, 0], [0, 0]], back: false },
];
const FLAT: Cols = [
  [1, 0],
  [0, 0],
];
const rowsOfCols = (c: Cols) => [
  [c[0][0], c[1][0]],
  [c[0][1], c[1][1]],
];

/** every point of the design, and the pillar, for fitting a frame */
const FC_PTS: XY[] = [...PETALS.flat(), ...FISH, [0, 0]];

/** A frame exactly W × H units that holds the design under every move in `list`. */
function fitFrame(list: Cols[], W: number, H: number, pad = 6, margin = 0.7): Frame {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const c of list)
    for (const p of FC_PTS) {
      const q = apply(c, p);
      x0 = Math.min(x0, q[0]);
      x1 = Math.max(x1, q[0]);
      y0 = Math.min(y0, q[1]);
      y1 = Math.max(y1, q[1]);
    }
  const dx = Math.max(x1 - x0, 2) + 2 * margin;
  const dy = Math.max(y1 - y0, 2) + 2 * margin;
  const u = Math.min((W - 2 * pad) / dx, (H - 2 * pad) / dy);
  const hx = (W - 2 * pad) / u / 2;
  const hy = (H - 2 * pad) / u / 2;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return makeFrame(cx - hx, cx + hx, cy - hy, cy + hy, u, pad);
}

/** The road inside a frame, clipped to it: asphalt, the chalk grid and the আলপনা carried by `move`, the pillar. */
function FC_RoadG({
  f,
  move,
  ghost = false,
  design = true,
  streak = false,
  under,
  children,
}: {
  f: Frame;
  move: Move;
  ghost?: boolean;
  design?: boolean;
  /** a squashed design has no area left: trace it in its colours so the line shows */
  streak?: boolean;
  under?: ReactNode;
  children?: ReactNode;
}) {
  const id = `fc${useId().replace(/[^a-zA-Z0-9]/g, "")}w${Math.round(f.W)}h${Math.round(f.H)}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect width={f.W} height={f.H} rx={6} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <RoadBed f={f} />
        <ChalkGrid f={f} move={move} ghost={ghost} x0={-2} x1={8} y0={-2} y1={7} />
        {under}
        {design && <Alpana f={f} move={move} />}
        {design && streak && (
          <g className="pointer-events-none" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {PETALS.map((p, i) => (
              <path key={i} d={pathOf(f, move, p, true)} stroke="#f472b6" strokeWidth={3.2} />
            ))}
            <path d={pathOf(f, move, FISH, true)} stroke="#fbbf24" strokeWidth={3.2} />
          </g>
        )}
        <Pillar f={f} />
        {children}
      </g>
    </>
  );
}

function FC_Road({
  f,
  label,
  className = "max-w-[17rem]",
  ...rest
}: {
  f: Frame;
  move: Move;
  label: string;
  className?: string;
  ghost?: boolean;
  design?: boolean;
  streak?: boolean;
  under?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} role="img" aria-label={label} className={`mx-auto block h-auto w-full select-none ${className}`}>
      <FC_RoadG f={f} {...rest} />
    </svg>
  );
}

/** A white sheet of graph paper with the design on it (the magazine's page). */
function FC_Paper({ x, y, w, h, blank = false, q = false }: { x: number; y: number; w: number; h: number; blank?: boolean; q?: boolean }) {
  const f = makeFrame(0.2, 6.4, 0.4, 5.6, Math.min((w - 8) / 6.2, (h - 8) / 5.2), 4);
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={3} fill="white" stroke={INK} strokeOpacity={0.3} />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${((i + 1) * w) / 6} 3V${h - 3}M3 ${((i + 1) * h) / 6}H${w - 3}`} stroke="#93c5fd" strokeOpacity={0.5} strokeWidth={0.5} />
      ))}
      {!blank && (
        <g>
          {PETALS.map((p, i) => (
            <path key={i} d={pathOf(f, (v) => v, p, true)} fill="#f472b6" stroke="#be185d" strokeWidth={0.5} />
          ))}
          <path d={pathOf(f, (v) => v, FISH, true)} fill="#fbbf24" stroke="#b45309" strokeWidth={0.5} />
        </g>
      )}
      {q && (
        <text x={w / 2} y={h / 2 + 7} textAnchor="middle" fontSize={20} fontWeight={800} fill="#64748b">
          ?
        </text>
      )}
    </g>
  );
}

/** A matrix, rows first, in the page's ink; a 2 × 2's columns coloured like the two ropes. */
function FC_Mat({ rows, colour = true, className = "text-lg" }: { rows: number[][]; colour?: boolean; className?: string }) {
  const n = rows[0].length;
  const grid = n === 2 ? "grid-cols-2" : n === 3 ? "grid-cols-3" : "grid-cols-4";
  return (
    <span className={`inline-flex items-stretch font-mono font-semibold ${className}`}>
      <span className="w-1.5 rounded-l-sm border-y-2 border-l-2 border-current" />
      <span className={`grid gap-x-3 px-1.5 py-0.5 ${grid}`}>
        {rows.flatMap((r, i) =>
          r.map((v, j) => (
            <span key={`${i}-${j}`} className={`text-center ${colour && n === 2 ? (j === 0 ? "text-cat-amber" : "text-cat-teal") : ""}`}>
              {sg(v)}
            </span>
          )),
        )}
      </span>
      <span className="w-1.5 rounded-r-sm border-y-2 border-r-2 border-current" />
    </span>
  );
}

/** The same, drawn inside an SVG in fixed ink. */
function FC_SvgMat({ x, y, rows, fs = 9, tone = INK, hiCol }: { x: number; y: number; rows: number[][]; fs?: number; tone?: string; hiCol?: number }) {
  const n = rows[0].length;
  const m = rows.length;
  const cw = fs * 1.7;
  const rh = fs * 1.3;
  const w = n * cw + 6;
  const h = m * rh + 4;
  return (
    <g transform={`translate(${x} ${y})`}>
      {hiCol !== undefined && <rect x={3 + hiCol * cw} y={0} width={cw} height={h} rx={2} fill={BAD} fillOpacity={0.15} />}
      <path d={`M4 0H1V${h}H4M${w - 4} 0H${w - 1}V${h}H${w - 4}`} fill="none" stroke={tone} strokeWidth={1.2} />
      {rows.map((r, i) =>
        r.map((v, j) => (
          <text key={`${i}-${j}`} x={3 + cw * (j + 0.5)} y={2 + rh * (i + 0.78)} textAnchor="middle" fontSize={fs} fontWeight={700} fontFamily={MONO} fill={tone}>
            {sg(v)}
          </text>
        )),
      )}
    </g>
  );
}

/** A tick or a cross, drawn (not glyphs). */
function FC_Mark({ ok, x, y, s = 1 }: { ok: boolean; x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className={POP}>
      <circle r={8} fill="white" stroke={ok ? OK : BAD} strokeWidth={1.6} />
      {ok ? <path d="M-4 0l3 3.5l5 -7" fill="none" stroke={OK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M-3.5 -3.5l7 7m0 -7l-7 7" stroke={BAD} strokeWidth={2.2} strokeLinecap="round" />}
    </g>
  );
}

/** A beat counter the reader's tap starts; seeded, so a preview can show any beat. */
function useBeats(key: string, ms: number) {
  const [k, setK] = useSeed(key, 0);
  const [to, setTo] = useState(0);
  useEffect(() => {
    if (k >= to) return;
    const t = setTimeout(() => setK(k + 1), ms);
    return () => clearTimeout(t);
  }, [k, to, ms, setK]);
  const run = (end: number) => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTo(end);
    setK(calm ? end : 0);
  };
  return { k, run };
}

// ---------------------------------------------------------------------------
// 1 · The bet. Five crossings as they are on the road now; the reader ticks
//     the ones that will come back to paper and seals. The seal is acted
//     out: from each ticked road, one after another, a dashed way back curls
//     up to a blank sheet of graph paper with a "?" on it. Unmarked; the last
//     screen settles it.

const UB_TILE = FC_CROSS.map((c) => fitFrame([c.cols], 100, 76));

/** the bet on one tile: a way back drawn up from the road to a blank sheet with a "?" */
function UB_Lift({ f }: { f: Frame }) {
  const w = 26;
  const h = 21;
  const x = f.W - w - 4;
  const y = 4;
  return (
    <g className="pointer-events-none">
      <Draw d={`M${f.W * 0.42} ${f.H * 0.62}Q${f.W * 0.45} ${f.H * 0.2} ${x - 2} ${y + h / 2}`} ms={500} strokeWidth={1.6} className="stroke-[#fde047]" />
      <g className={POP} style={{ transitionDelay: "350ms" }}>
        <rect x={x} y={y} width={w} height={h} rx={2} fill="white" stroke={INK} strokeOpacity={0.4} />
        {[1, 2, 3].map((i) => (
          <path key={i} d={`M${x + (i * w) / 4} ${y + 2}V${y + h - 2}M${x + 2} ${y + (i * h) / 4}H${x + w - 2}`} stroke="#93c5fd" strokeOpacity={0.6} strokeWidth={0.5} />
        ))}
        <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={800} fill="#475569">
          ?
        </text>
      </g>
    </g>
  );
}

export function UndoBet() {
  const pass = useGate();
  const [ticks, setTicks] = useSeed<boolean[]>("ticks", [false, false, false, false, false]);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(650);
  const order = FC_CROSS.map((_, i) => i).filter((i) => ticks[i]);
  const toggle = (i: number) => setTicks(ticks.map((t, j) => (j === i ? !t : t)));
  const seal = () => {
    setSealed(true);
    act.play(order.length + 1, () => pass("বাজি সিল হলো। সহজটা দিয়ে শুরু।"));
  };
  // how many ticked roads have sent their "?" up so far
  const shown = !sealed ? 0 : act.running ? act.k : order.length + 1;
  return (
    <>
      <div className="mx-auto grid max-w-[21rem] grid-cols-3 gap-2">
        {FC_CROSS.map((c, i) => {
          const on = ticks[i];
          return (
            <button
              key={c.name}
              type="button"
              disabled={sealed}
              onClick={() => toggle(i)}
              aria-pressed={on}
              className={`relative cursor-pointer rounded-xl border-2 p-1 transition-[border-color,background-color,opacity] duration-200 disabled:cursor-default motion-reduce:transition-none ${
                on ? "border-cat-blue bg-cat-blue/10" : sealed ? "border-border opacity-50" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <svg viewBox={`0 0 ${UB_TILE[i].W} ${UB_TILE[i].H}`} className="block h-auto w-full" aria-hidden="true">
                <FC_RoadG f={UB_TILE[i]} move={byCols(c.cols)} streak={!c.back} />
                {sealed && on && shown > order.indexOf(i) && <UB_Lift f={UB_TILE[i]} />}
              </svg>
              <span className="mt-0.5 flex items-center justify-center gap-1.5 text-sm">
                <span className={`grid size-4 place-items-center rounded border ${on ? "border-cat-blue bg-cat-blue" : "border-muted"}`}>
                  {on && (
                    <svg viewBox="0 0 10 10" className="size-3" aria-hidden="true">
                      <path d="M2 5.2l2 2l4 -4.6" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                মোড় {i + 1}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          disabled={sealed}
          onClick={seal}
          className="grid cursor-pointer place-items-center rounded-xl border-2 border-cat-blue bg-cat-blue px-2 text-center font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-50"
        >
          {sealed ? "সিল হলো" : "বাজি সিল করুন"}
        </button>
      </div>
      <div className="mt-2 text-center text-sm text-muted">রাস্তায় এখন যা আছে। কোনগুলো উল্টা চালালে কাগজে ফিরবে?</div>
      <Task done={sealed && shown > order.length}>যে মোড়গুলো কাগজে ফিরবে বলে মনে হয়, সেগুলোতে tick দিন। তারপর সিল করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Run it backwards, by hand. Crossing 1 (everything doubled): divide each
//     slot until the design sits on its faint paper outline. Crossing 4 (the
//     shear): push every point back by its height. Both come home.

const RB_DOUBLE: Cols = [
  [2, 0],
  [0, 2],
];
const RB_F0 = fitFrame([RB_DOUBLE, ID], 260, 196);
const RB_F1 = fitFrame(
  [
    [
      [1, 0],
      [2, 1],
    ],
    [
      [1, 0],
      [-1, 1],
    ],
    ID,
  ],
  290,
  124,
);

export function RunBackwards() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [d, setD] = useSeed("d", 1);
  const [s, setS] = useSeed("s", 0);
  const cols: Cols =
    round === 0
      ? [
          [2 / d, 0],
          [0, 2 / d],
        ]
      : [
          [1, 0],
          [1 + s, 1],
        ];
  const [a, b, c, e] = useTween([cols[0][0], cols[0][1], cols[1][0], cols[1][1]], 650);
  const move = byCols([
    [a, b],
    [c, e],
  ]);
  const f = round === 0 ? RB_F0 : RB_F1;
  // the verdict waits until the design has glided to where the tap sent it
  const land = usePlay(700);
  const hit = (round === 0 ? d === 2 : s === -1) && !land.running;
  const done = round === 1 && s === -1 && !land.running;

  const onD = (v: number) => {
    setD(v);
    land.play(1);
  };
  const onS = (v: number) => {
    setS(v);
    land.play(1, v === -1 ? () => pass("দ্বিগুণ হলে অর্ধেক, ঠেলা হলে উল্টা ঠেলা।") : undefined);
  };

  return (
    <>
      <div key={round} className={FADE}>
        <FC_Road
          f={f}
          move={move}
          className={round === 0 ? "max-w-[16rem]" : "max-w-[20rem]"}
          label={round === 0 ? "এক নম্বর মোড়: আলপনা কাগজেরটার দ্বিগুণ; হালকা ছবিটা কাগজের মাপ" : "চার নম্বর মোড়: shear করা আলপনা; হালকা ছবিটা কাগজের মাপ"}
          under={<Alpana f={f} move={(p) => p} faint />}
        />
        <div className="mt-2 text-center text-sm text-muted">
          {round === 0 ? "রাস্তায় সব দ্বিগুণ। হালকা ছবিটা কাগজের মাপ।" : "Shear কি করেছিল? প্রত্যেক বিন্দুকে ডানে ঠেলেছিল। উচ্চতা যত, তত ঘর।"}
        </div>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm font-medium">
          {round === 0 ? (
            <>
              <span>প্রত্যেক slot কে ভাগ করুন</span>
              <span className="font-mono text-lg">÷</span>
              <Stepper value={d} onChange={onD} min={1} max={4} label="ভাগ" />
            </>
          ) : (
            <>
              <span>ঠেলুন: উচ্চতা ×</span>
              <Stepper value={s} onChange={onS} min={-2} max={1} label="ঠেলা" />
              <span>ঘর ডানে</span>
            </>
          )}
        </div>
        <div className="mt-2 flex min-h-11 items-center justify-center gap-3 text-sm">
          {hit ? (
            <>
              <span className={`font-semibold text-accent-text ${FADE}`}>{round === 0 ? "কাগজের মাপে ফিরলো।" : "মাইনাস মানে বামে। ফিরলো।"}</span>
              {round === 0 && (
                <button type="button" className={quietBtn} onClick={() => setRound(1)}>
                  চার নম্বর মোড় →
                </button>
              )}
            </>
          ) : (
            <span className="text-muted">{round === 0 ? "আলপনা টা হালকা ছবির উপর বসান।" : "মাইনাস দিলে ঠেলা যায় বামে।"}</span>
          )}
        </div>
      </div>
      <Ticks
        items={[
          ["মোড় 1", round > 0],
          ["মোড় 4", done],
        ]}
      />
      <Task done={done}>{round === 0 ? "এক নম্বর মোড়ের আলপনা কাগজের মাপে ফিরিয়ে আনুন।" : "এবার চার নম্বর মোড়: shear টা উল্টা চালান।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The fifth crossing. The whole road lies on one line. The reader taps a
//     spot on it and asks where it came from: a whole column of candidates
//     rises above it, (x, 1) … (x, 6) and on past the road to (x, 99).

const FL_F = makeFrame(-0.8, 7.8, -1.2, 7.2, 30, 8);

export function FlatCrossing() {
  const pass = useGate();
  const [taps, setTaps] = useSeed<number[]>("taps", []);
  const f = FL_F;
  const last = taps.length ? taps[taps.length - 1] : null;
  // the column draws itself and its candidates pop up before anything is said
  const rise = usePlay(850);
  const tap = (x: number) => {
    const next = taps.includes(x) ? [...taps.filter((t) => t !== x), x] : [...taps, x];
    setTaps(next);
    rise.play(1, next.length === 2 && taps.length === 1 ? () => pass("অনেকে এক জায়গায়: কে কোথা থেকে, বলা যায় না।") : undefined);
  };
  return (
    <>
      <svg viewBox={`0 0 ${f.W} ${f.H}`} role="group" aria-label="পাঁচ নম্বর মোড়: পুরা আলপনা একটা লাইনে; লাইনের যেকোনো জায়গায় tap করুন" className="mx-auto block h-auto w-full max-w-[17rem] select-none">
        <FC_RoadG f={f} move={byCols(FLAT)} ghost streak>
          {taps
            .filter((x) => x !== last)
            .map((x) => (
              <path key={`old${x}`} d={`M${f.sx(x)} ${f.sy(0)}V${f.sy(7.2)}`} stroke={AMBER} strokeOpacity={0.35} strokeDasharray="3 3" strokeWidth={1.2} />
            ))}
          {last !== null && (
            <g key={`col${last}-${taps.length}`}>
              <Draw d={`M${f.sx(last)} ${f.sy(0)}V${f.sy(7.2)}`} ms={600} strokeWidth={1.6} className="stroke-[#f59e0b]" />
              {[1, 2, 3, 4, 5, 6].map((y, i) => (
                <circle key={y} cx={f.sx(last)} cy={f.sy(y)} r={4} fill={AMBER} stroke={INK} strokeWidth={0.8} className={POP} style={{ transitionDelay: `${150 + i * 90}ms` }} />
              ))}
              {[1, 4].map((y) => (
                <text key={y} x={f.sx(last) + (last > 5 ? -8 : 8)} y={f.sy(y) + 3.5} textAnchor={last > 5 ? "end" : "start"} fontSize={10} fontWeight={700} fontFamily={MONO} fill={CHALK} className={FADE}>
                  ({last}, {y})
                </text>
              ))}
              <path d={`M${f.sx(last) - 5} ${f.sy(6.7)}l5 -7l5 7`} fill="none" stroke={AMBER} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
          {Array.from({ length: 8 }, (_, x) => (
            <g key={x} {...press(() => tap(x))} aria-label={`(${x}, 0)`} className="cursor-pointer outline-none">
              <rect x={f.sx(x - 0.5)} y={f.sy(0.9)} width={f.u} height={f.u * 1.8} fill="white" fillOpacity={0} />
              <circle cx={f.sx(x)} cy={f.sy(0)} r={x === last ? 5 : 3.4} fill={x === last ? AMBER : CHALK} stroke={INK} strokeWidth={0.8} />
            </g>
          ))}
        </FC_RoadG>
      </svg>
      <div className="mt-2 min-h-12 text-center text-sm">
        {last === null ? (
          <span className="text-muted">লাইনের উপর সাদা বিন্দুগুলোর যেকোনোটায় tap করুন।</span>
        ) : (
          <span key={last} className={FADE}>
            <span className="font-mono whitespace-nowrap">({last}, 0)</span> তে এসে পড়তে পারে <span className="font-mono whitespace-nowrap">({last}, 1)</span>, <span className="font-mono whitespace-nowrap">({last}, 4)</span>, এমনকি <span className="font-mono whitespace-nowrap">({last}, 99)</span>. কে ছিল আসলে?
          </span>
        )}
      </div>
      <Task done={taps.length >= 2 && !rise.running}>লাইনের দুইটা আলাদা জায়গায় tap করুন। প্রত্যেকবার জিজ্ঞেস করুন: তুমি কোথা থেকে এসেছিলে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The owl at noon. The owl sits on its bamboo at (3, 2, height); the sun
//     is straight overhead, so the shadow lies right under it. The reader
//     raises and lowers the owl: the shadow never moves. Heights already tried
//     stay as faint owls on the pole.

const OW = { x: 3, y: 2 };
/** oblique view of the road: x along, y across (into the picture), z up */
const P3 = (x: number, y: number, z: number): XY => [24 + 30 * x + 20 * y, 176 - 13 * y - 24 * z];

function FC_OwlSprite({ at, s = 1, faint = false }: { at: XY; s?: number; faint?: boolean }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]}) scale(${s})`} opacity={faint ? 0.25 : 1}>
      <path d="M-11 -26l2 -9l6 6ZM11 -26l-2 -9l-6 6Z" fill="#c2410c" />
      <ellipse cx={0} cy={-15} rx={12} ry={15} fill="#f97316" stroke="#7c2d12" strokeWidth={1} />
      <ellipse cx={0} cy={-8} rx={7} ry={7.5} fill="#fde68a" />
      <circle cx={-5} cy={-21} r={4.6} fill="#facc15" stroke="#7c2d12" strokeWidth={0.8} />
      <circle cx={5} cy={-21} r={4.6} fill="#facc15" stroke="#7c2d12" strokeWidth={0.8} />
      <circle cx={-5} cy={-21} r={2} fill={INK} />
      <circle cx={5} cy={-21} r={2} fill={INK} />
      <path d="M-2 -17l2 4l2 -4Z" fill="#7c2d12" />
    </g>
  );
}

/** The road in oblique view, the sun overhead, the pole, the owl(s) and the one shadow. */
function FC_OwlRoad({ z, ghosts = [], children }: { z: number; ghosts?: number[]; children?: ReactNode }) {
  const g = P3(OW.x, OW.y, 0);
  const top = P3(OW.x, OW.y, z);
  const road = [P3(0, 0, 0), P3(6, 0, 0), P3(6, 4, 0), P3(0, 4, 0)];
  let chalk = "";
  for (let x = 0; x <= 6; x++) chalk += `M${P3(x, 0, 0).join(" ")}L${P3(x, 4, 0).join(" ")}`;
  for (let y = 0; y <= 4; y++) chalk += `M${P3(0, y, 0).join(" ")}L${P3(6, y, 0).join(" ")}`;
  return (
    <>
      <circle cx={30} cy={22} r={11} fill="#fde047" stroke="#f59e0b" strokeWidth={1.5} />
      <path d={road.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join("") + "Z"} fill="#6b7280" />
      <path d={chalk} stroke={CHALK} strokeOpacity={0.35} strokeWidth={0.7} fill="none" />
      <ellipse cx={g[0]} cy={g[1]} rx={15} ry={5} fill="#0b1220" fillOpacity={0.6} />
      <path d={`M${g[0]} ${g[1]}L${top[0]} ${top[1]}`} stroke="#a16207" strokeWidth={3} strokeLinecap="round" />
      {ghosts.map((h) => (
        <FC_OwlSprite key={h} at={P3(OW.x, OW.y, h)} faint />
      ))}
      <path d={`M${top[0]} ${top[1] + 2}V${g[1] - 6}`} stroke="#fde047" strokeDasharray="2 3" strokeWidth={1} />
      <FC_OwlSprite at={top} />
      {children}
    </>
  );
}

export function OwlShadow() {
  const pass = useGate();
  const [z, setZ] = useSeed("z", 2);
  const [seen, setSeen] = useSeed<number[]>("seen", [2]);
  const [zz] = useTween([z], 600);
  const rise = usePlay(650);
  const change = (v: number) => {
    setZ(v);
    const next = seen.includes(v) ? seen : [...seen, v];
    if (next !== seen) setSeen(next);
    rise.play(1, next.length === 3 && seen.length === 2 ? () => pass("তিন সংখ্যা থেকে দুই: কিছু হারাবেই।") : undefined);
  };
  return (
    <>
      <svg viewBox="0 0 290 190" role="img" aria-label="দুপুরের রাস্তা, বাঁশের মাথায় পেঁচা, ঠিক নিচে তার ছায়া" className="mx-auto block h-auto w-full max-w-[19rem]">
        <FC_OwlRoad z={zz} ghosts={seen.filter((h) => h !== z)} />
      </svg>
      <div className="mt-1 flex items-center justify-center gap-2 text-sm font-medium">
        <span>পেঁচার উচ্চতা</span>
        <Stepper value={z} onChange={change} min={1} max={4} label="উচ্চতা" />
      </div>
      <div className="mt-2 text-center text-sm">
        পেঁচা <span className="font-mono">(3, 2, {z})</span> → ছায়া <span className="font-mono">(3, 2)</span>
      </div>
      <Ticks items={[1, 2, 3, 4].map((h): [string, boolean] => [`উচ্চতা ${h}`, seen.includes(h)])} />
      <Task done={seen.length >= 3 && !rise.running}>বাঁশটা উঠান-নামান। তিনটা আলাদা উচ্চতায় ছায়াটা দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Shape is a route. The owl's cage: 2 numbers in, 3 out, by the art
//     sir's rule H. The reader sends (1, 0) and (0, 1) through; each answer
//     drops into the matrix as a column. Then (2, 3) both ways: (14, 8, 5).

const SR_IN: XY[] = [
  [1, 0],
  [0, 1],
];
const SR_OUT = [
  [7, 1, 1],
  [0, 2, 1],
];

function FC_Cells({ x, y, vals, tone, w = 24, h = 18 }: { x: number; y: number; vals: (number | null)[]; tone: string; w?: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y - (vals.length * h) / 2})`}>
      {vals.map((v, i) => (
        <g key={i}>
          <rect y={i * h} width={w} height={h - 2} rx={3} fill="white" stroke={tone} strokeWidth={1.4} />
          {v !== null && (
            <text x={w / 2} y={i * h + h / 2 + 3} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={INK}>
              {v}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

export function ShapeIsRoute() {
  const pass = useGate();
  const [sent, setSent] = useSeed("sent", 0);
  const [checked, setChecked] = useSeed("checked", false);
  const b = useBeats("ph", 550);
  const cur = sent - 1;
  const inside = sent > 0 && b.k >= 1;
  const out = sent > 0 && b.k >= 2;
  const filled = (i: number) => sent > i && (i < cur || out);
  const send = () => {
    setSent(sent + 1);
    b.run(2);
  };
  // (2, 3) goes through the machine too: in, out as (14, 8, 5), then the two ways written under
  const chk = usePlay(700);
  const check = () => {
    setChecked(true);
    chk.play(3, () => pass("m × n: n টা সংখ্যা ঢোকে, m টা বের হয়।"));
  };
  const ck = !checked ? 0 : chk.running ? chk.k : 3;
  const tone = cur === 1 ? "#2dd4bf" : AMBER;
  return (
    <>
      <svg viewBox="0 0 280 96" role="img" aria-label="H এর machine: বামে দুই ঘরের input, মাঝে H, ডানে তিন ঘরের output" className="mx-auto block h-auto w-full max-w-[19rem]">
        <rect x={100} y={18} width={76} height={60} rx={10} fill="#e0e7ff" stroke="#4f46e5" strokeWidth={1.5} />
        <text x={138} y={46} textAnchor="middle" fontSize={16} fontWeight={800} fontFamily={MONO} fill="#312e81">
          H
        </text>
        <text x={138} y={64} textAnchor="middle" fontSize={8} fontWeight={600} fill="#312e81">
          2 ঢোকে · 3 বের হয়
        </text>
        <path d="M70 48H96M180 48H206" stroke={INK} strokeOpacity={0.35} strokeWidth={1.4} />
        {checked && (
          <g
            key="in23"
            className="transition-[translate,opacity] duration-500 motion-reduce:transition-none"
            style={{ translate: ck >= 1 ? "70px 0" : "0 0", opacity: ck >= 1 ? 0 : 1 }}
          >
            <FC_Cells x={30} y={48} vals={[2, 3]} tone="#6366f1" />
          </g>
        )}
        {checked && ck >= 2 && (
          <g key="out23" className={POP}>
            <FC_Cells x={216} y={48} vals={[14, 8, 5]} tone="#6366f1" />
          </g>
        )}
        {sent > 0 && !checked && (
          <g
            key={`in${sent}`}
            className="transition-[translate,opacity] duration-500 motion-reduce:transition-none"
            style={{ translate: inside ? "70px 0" : "0 0", opacity: inside ? 0 : 1 }}
          >
            <FC_Cells x={30} y={48} vals={[...SR_IN[cur]]} tone={tone} />
          </g>
        )}
        {sent === 0 && <FC_Cells x={30} y={48} vals={[1, 0]} tone={AMBER} />}
        {out && !checked && (
          <g key={`out${sent}`} className={POP}>
            <FC_Cells x={216} y={48} vals={SR_OUT[cur]} tone={tone} />
          </g>
        )}
      </svg>
      <div className="mt-1 flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="inline-flex items-stretch font-mono text-lg font-semibold">
            <span className="w-1.5 rounded-l-sm border-y-2 border-l-2 border-current" />
            <span className="grid grid-cols-2 gap-x-2 px-1.5 py-0.5">
              {[0, 1, 2].flatMap((r) =>
                [0, 1].map((c) => (
                  <span key={`${r}${c}`} className={`min-w-5 text-center ${c === 0 ? "text-cat-amber" : "text-cat-teal"}`}>
                    {filled(c) ? <span className={POP}>{SR_OUT[c][r]}</span> : <span className="text-muted/50">·</span>}
                  </span>
                )),
              )}
            </span>
            <span className="w-1.5 rounded-r-sm border-y-2 border-r-2 border-current" />
          </div>
          {filled(1) && <div className={`mt-0.5 font-mono text-sm font-semibold ${FADE}`}>3 × 2</div>}
        </div>
        <div className="grid gap-2">
          {sent < 2 ? (
            <button type="button" className={quietBtn} onClick={send} disabled={sent > 0 && !out}>
              <span className="font-mono">{sent === 0 ? "(1, 0)" : "(0, 1)"}</span> পাঠান
            </button>
          ) : !checked ? (
            <button type="button" className={quietBtn} onClick={check} disabled={!out}>
              <span className="font-mono">(2, 3)</span> দুইভাবে
            </button>
          ) : null}
        </div>
      </div>
      {checked && (
        <div className="mt-2 grid min-h-[4.25rem] gap-1 text-center text-sm">
          {ck >= 2 && (
            <div className={FADE}>
              নিয়ম দিয়ে: <span className="font-mono">(7×2, 2 + 2×3, 2 + 3) = (14, 8, 5)</span>
            </div>
          )}
          {ck >= 3 && (
            <div className={FADE}>
              Column দিয়ে: <span className="font-mono">2×(7, 1, 1) + 3×(0, 2, 1) = (14, 8, 5)</span>
            </div>
          )}
          {ck >= 3 && <div className={`font-semibold text-accent-text ${FADE}`}>দুই পথে একই উত্তর।</div>}
        </div>
      )}
      <Task done={checked && ck >= 3}>(1, 0) আর (0, 1) machine এ পাঠান। উত্তর দুইটা matrix এর column হবে। তারপর (2, 3) দিয়ে মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn. Five matrices: the two crossings not tried yet (the quarter
//     turn and the mirror) and three from last year's notebook. The reader
//     says "ফেরত আসে" / "আসে না"; either tap plays the move on a small road,
//     then either the way back or the points that now share one spot. A wrong
//     verdict is told what the picture showed.

type UItem = { rows: number[][]; back: boolean; cols?: Cols; tag: string };
const YU_ITEMS: UItem[] = [
  { rows: rowsOfCols(FC_CROSS[2].cols), cols: FC_CROSS[2].cols, back: true, tag: "মোড় 3" },
  { rows: [[1, -1], [-1, 1]], cols: [[1, -1], [-1, 1]], back: false, tag: "গত বছর" },
  { rows: [[2, 0], [0, 1]], cols: [[2, 0], [0, 1]], back: true, tag: "গত বছর" },
  { rows: [[1, 0, 1, 0], [0, 1, 0, 1]], back: false, tag: "গত বছর, 2 × 4" },
  { rows: rowsOfCols(FC_CROSS[1].cols), cols: FC_CROSS[1].cols, back: true, tag: "মোড় 2" },
];
const YU_F = YU_ITEMS.map((it) => (it.cols ? fitFrame([ID, it.cols], 170, 120) : null));
/** three paper points that land on one spot under [[1, −1], [−1, 1]] */
const YU_SAME: XY[] = [
  [2, 0],
  [3, 1],
  [4, 2],
];

function FC_Route({ k }: { k: number }) {
  const ins = ["(1, 2, 3, 4)", "(4, 6, 0, 0)"];
  return (
    <svg viewBox="0 0 170 120" role="img" aria-label="চার সংখ্যার দুইটা আলাদা list, 2 × 4 matrix থেকে দুইটাই বের হলো (4, 6)" className="block h-auto w-full">
      <rect width={170} height={120} rx={6} fill="white" stroke={INK} strokeOpacity={0.2} />
      <rect x={78} y={40} width={34} height={40} rx={6} fill="#e0e7ff" stroke="#4f46e5" />
      <text x={95} y={64} textAnchor="middle" fontSize={8.5} fontWeight={700} fontFamily={MONO} fill="#312e81">
        2×4
      </text>
      {ins.map((t, i) => (
        <g key={t} opacity={k >= i + 1 ? 1 : 0.35}>
          <text x={6} y={i ? 108 : 20} fontSize={9} fontWeight={700} fontFamily={MONO} fill={INK}>
            {t}
          </text>
          {k >= i + 1 && <Draw d={i ? "M40 96Q44 70 76 66" : "M40 26Q44 50 76 54"} strokeWidth={1.3} className="stroke-[#4f46e5]" />}
        </g>
      ))}
      {k >= 1 && (
        <g className={POP}>
          <Draw d="M114 60H124" strokeWidth={1.3} className="stroke-[#4f46e5]" />
          <text x={146} y={64} textAnchor="middle" fontSize={10} fontWeight={800} fontFamily={MONO} fill={k >= 2 ? BAD : INK}>
            (4, 6)
          </text>
        </g>
      )}
      {k >= 2 && (
        <text x={146} y={82} textAnchor="middle" fontSize={8} fontWeight={700} fill={BAD} className={FADE}>
          দুইটাই!
        </text>
      )}
    </svg>
  );
}

/** the two verdicts as pictures: paper → road and back again, or the way back broken */
function YU_Icon({ back }: { back: boolean }) {
  return (
    <svg viewBox="0 0 48 26" aria-hidden="true" className="h-auto w-9 shrink-0">
      <rect x={1} y={5} width={13} height={16} rx={1.5} fill="white" stroke={INK} strokeOpacity={0.45} />
      <circle cx={7.5} cy={13} r={2.6} fill="#f472b6" />
      <rect x={34} y={3} width={13} height={20} rx={2} fill="#6b7280" />
      <path d="M38 13h5" stroke="#f472b6" strokeWidth={2} strokeLinecap="round" />
      <path d="M17 8Q24 3 31 8" fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={1.3} />
      <path d="M28 5.6l3 2.4l-3.4 1.6" fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={1.3} strokeLinejoin="round" />
      <path d="M31 18Q24 23 17 18" fill="none" stroke={back ? OK : BAD} strokeWidth={1.5} strokeDasharray={back ? undefined : "2.5 2"} />
      {back ? <path d="M20 20.4l-3 -2.4l3.4 -1.6" fill="none" stroke={OK} strokeWidth={1.5} strokeLinejoin="round" /> : <path d="M21.5 17.5l5 5m0 -5l-5 5" stroke={BAD} strokeWidth={1.6} strokeLinecap="round" />}
    </svg>
  );
}

export function YourUndo() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [verdict, setVerdict] = useSeed<boolean | null>("verdict", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const b = useBeats("k", 750);
  const it = YU_ITEMS[Math.min(round, YU_ITEMS.length - 1)];
  const f = YU_F[Math.min(round, YU_ITEMS.length - 1)];
  const right = verdict !== null && verdict === it.back;
  const over = round >= YU_ITEMS.length;
  const t = verdict === null ? 0 : b.k >= 1 && !(it.back && b.k >= 2) ? 1 : 0;
  const [tt] = useTween([t], 650);

  // the last right verdict waits for its move (and the way back) to play out
  const fin = usePlay(750);
  const judge = (v: boolean) => {
    setVerdict(v);
    b.run(2);
    if (v === it.back) {
      if (round === YU_ITEMS.length - 1) fin.play(2, () => pass("দুই column এক লাইনে, বা সংখ্যা কমলে: ফেরে না।"));
    } else setMiss(miss + 1);
  };
  const next = () => {
    setVerdict(null);
    setRound(round + 1);
  };

  let nope: string | null = null;
  if (verdict !== null && !right) {
    if (it.back) nope = "দেখুন, উল্টা move চালাতেই আলপনা আগের জায়গায় ফিরে এলো। কিছুই হারায় নাই।";
    else if (!it.cols) nope = "4 টা সংখ্যা ঢুকে 2 টা বের হয়। দুইটা আলাদা list একই উত্তর দিলো। ফেরত পাঠাবেন কোনটায়?";
    else nope = "দেখুন: পুরা আলপনা একটা লাইনে বসে গেলো। তিনটা বিন্দু এক জায়গায়। উল্টা চালালে কোনটা কোথায় যাবে?";
  }

  return (
    <>
      <div key={round} className={`flex items-center gap-3 ${FADE}`}>
        <div className="grid w-28 shrink-0 justify-items-center gap-1 text-center">
          <FC_Mat rows={it.rows} className={it.rows[0].length > 2 ? "text-sm" : "text-lg"} />
          <span className="text-xs text-muted">{it.tag}</span>
        </div>
        <div className="min-w-0 flex-1">
          {it.cols && f ? (
            <FC_Road f={f} move={partway(byCols(it.cols), tt)} streak={!it.back && tt > 0.9} className="max-w-[12rem]" label="ছোট রাস্তায় এই matrix চালানো হচ্ছে">
              {!it.back && verdict !== null && b.k >= 2 && (
                <g className={FADE}>
                  {YU_SAME.map((p) => (
                    <g key={p.join()}>
                      <path d={`M${f.sx(p[0])} ${f.sy(p[1])}L${f.sx(2)} ${f.sy(-2)}`} stroke={AMBER} strokeDasharray="2 2" strokeWidth={1} />
                      <circle cx={f.sx(p[0])} cy={f.sy(p[1])} r={3} fill={AMBER} stroke={INK} strokeWidth={0.6} />
                    </g>
                  ))}
                  <circle cx={f.sx(2)} cy={f.sy(-2)} r={3.6} fill={BAD} stroke={CHALK} />
                </g>
              )}
            </FC_Road>
          ) : (
            <div className="mx-auto max-w-[12rem]">
              <FC_Route k={verdict === null ? 0 : b.k} />
            </div>
          )}
        </div>
      </div>
      {!over && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[true, false].map((v, i) => (
            <Choice key={String(v)} n={i} look={verdict === v ? (v === it.back ? "right" : "wrong") : right ? "dim" : "idle"} disabled={right} onClick={() => judge(v)}>
              <span className="flex items-center gap-1.5">
                <YU_Icon back={v} />
                <span className="whitespace-nowrap">{v ? "ফেরত আসে" : "আসে না"}</span>
              </span>
            </Choice>
          ))}
        </div>
      )}
      {nope && <Nope key={miss}>{nope}</Nope>}
      {right && round < YU_ITEMS.length - 1 && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={quietBtn} onClick={next}>
            পরেরটা →
          </button>
        </div>
      )}
      <Ticks items={YU_ITEMS.map((_, i): [string, boolean] => [`${i + 1}`, i < round || (i === round && right)])} />
      <Task done={round === YU_ITEMS.length - 1 && right && !fin.running}>পাঁচটা matrix, একটা একটা করে। প্রত্যেকটা কাগজে ফেরত আসে, না আসে না?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it. [[1, 1], [1, 1]]: which line does the whole road land on?
//     Three small pictures; any pick plays the squash on the road, with the
//     picked line drawn over it, green if it matches, red if not.

const TW_COLS: Cols = [
  [1, 1],
  [1, 1],
];
const TW_F = fitFrame([ID, TW_COLS], 250, 210, 6, 0.6);
const TW_LINES: [XY, XY][] = [
  [
    [-20, 0],
    [20, 0],
  ],
  [
    [-20, -20],
    [20, 20],
  ],
  [
    [0, -20],
    [0, 20],
  ],
];
const TW_RIGHT = 1;

export function TryWhichLine() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  // every pick: the road lifts back to plain, then presses down under the picked
  // line; the verdict comes when it lands
  const sq = usePlay(450);
  const [tt] = useTween([pick === null || (sq.running && sq.k === 0) ? 0 : 1], 700);
  const f = TW_F;
  const choose = (i: number) => {
    if (sq.running) return;
    setPick(i);
    if (i === TW_RIGHT) sq.play(3, () => pass("দুই column একই দিকে, তাই রাস্তা একটা লাইনে।"));
    else {
      setMiss(miss + 1);
      sq.play(3);
    }
  };
  const landed = pick !== null && !sq.running;
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <FC_Mat rows={rowsOfCols(TW_COLS)} />
        <div className="min-w-0 flex-1">
          <FC_Road f={f} move={partway(byCols(TW_COLS), tt)} streak={tt > 0.9} className="max-w-[13rem]" label="রাস্তায় [[1, 1], [1, 1]] চালানো হচ্ছে; বাছাই করা লাইন উপরে আঁকা">
            {pick !== null && (
              <path
                key={`${pick}-${miss}`}
                d={`M${f.sx(TW_LINES[pick][0][0])} ${f.sy(TW_LINES[pick][0][1])}L${f.sx(TW_LINES[pick][1][0])} ${f.sy(TW_LINES[pick][1][1])}`}
                stroke={!landed ? CHALK : pick === TW_RIGHT ? "#34d399" : BAD}
                strokeWidth={2}
                strokeDasharray="6 4"
                className={FADE}
              />
            )}
          </FC_Road>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {TW_LINES.map((l, i) => (
          <Choice key={i} n={i} look={pick === i ? (!landed ? "picked" : i === TW_RIGHT ? "right" : "wrong") : pick === TW_RIGHT && landed ? "dim" : "idle"} disabled={pick === TW_RIGHT} onClick={() => choose(i)}>
            <svg viewBox="-12 -12 24 24" className="h-auto w-10" aria-label={["শোয়ানো লাইন", "কোনাকুনি লাইন", "খাড়া লাইন"][i]}>
              <rect x={-11} y={-11} width={22} height={22} rx={3} fill="#6b7280" />
              <path d={`M${l[0][0] / 2} ${-l[0][1] / 2}L${l[1][0] / 2} ${-l[1][1] / 2}`} stroke={CHALK} strokeWidth={2} />
              <rect x={-2.5} y={-2.5} width={5} height={5} fill="#b91c1c" />
            </svg>
          </Choice>
        ))}
      </div>
      {landed && pick !== TW_RIGHT && (
        <Nope key={miss}>{pick === 0 ? "উঁহু, শোয়ানো লাইন ছিল পাঁচ নম্বর মোড়ে। এখানে দুই column ই (1, 1)। আলপনা কোনদিকে বসলো, দেখুন।" : "উঁহু, আলপনা বসলো অন্যদিকে। Column দুইটা কোনদিকে তাকিয়ে আছে?"}</Nope>
      )}
      <Task done={pick === TW_RIGHT && landed}>এই matrix পুরা রাস্তাকে কোন লাইনে চেপে বসাবে? ছবি দেখে বাছুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes.

function S_Name({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
      {text}
    </text>
  );
}

function S_Pillar({ x, y, h, pins = 0 }: { x: number; y: number; h: number; pins?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={16} height={h} fill="#b91c1c" />
      <rect x={x - 6} y={y - 6} width={28} height={8} fill="#7f1d1d" />
      {Array.from({ length: pins }, (_, i) => (
        <circle key={i} cx={x + 8} cy={y + 12 + i * 9} r={1.6} fill="#e5e7eb" stroke={INK} strokeWidth={0.4} />
      ))}
    </g>
  );
}

// 1a · Two days after Boishakh, the gate. Five bare pins on the pillar; the
//      faded আলপনা on the road. তপু arrives with graph paper; the art sir's
//      reply; Nasib's claim. Whether he is right is left to the screen.

export function GateSteps({}: Story) {
  const s = useScene(4, [600, 1600, 2400, 2600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={128} label="চৈত্রের শেষ দিন সকালে গেটের সামনে; pillar এ পাঁচটা খালি পিন; তপু graph paper নিয়ে এলো, বললো পাঁচটা আলপনাই ম্যাগাজিনে যাবে; আর্ট স্যার বললেন কাগজ তো নাই, রাস্তা আছে, খাতা আছে; নাসিব বললো উল্টা চালালেই তো হয়">
        <S_Pillar x={14} y={52} h={76} pins={5} />
        <g opacity={0.45}>
          <ellipse cx={120} cy={168} rx={16} ry={4} fill="#f472b6" />
          <ellipse cx={196} cy={172} rx={14} ry={3.5} fill="#f472b6" />
          <ellipse cx={270} cy={166} rx={12} ry={3.5} fill="#fbbf24" />
        </g>
        <Person who="nana" x={62} y={150} arm="hold" />
        <rect x={70} y={104} width={10} height={12} rx={1} fill="#1d4ed8" />
        <S_Name x={62} y={150} text="আর্ট স্যার" />
        <Person who="rina" x={112} y={150} label />
        <Person who="samin" x={k >= 1 ? 196 : 360} y={150} facing={-1} walking={k === 1} arm="hold" />
        <g transform={`translate(${k >= 1 ? 196 : 360} 0)`} className="transition-transform duration-[1200ms] motion-reduce:transition-none">
          <rect x={-26} y={102} width={14} height={9} fill="white" stroke={INK} strokeOpacity={0.4} />
          <rect x={-25} y={99} width={14} height={9} fill="white" stroke={INK} strokeOpacity={0.4} />
        </g>
        {k >= 1 && <S_Name x={196} y={150} text="তপু" />}
        <Person who="nasib" x={262} y={150} facing={-1} label mood={k >= 4 ? "smug" : "plain"} />
        {k === 2 && <Bubble x={196} y={84} lines={["পাঁচটা আলপনাই", "ম্যাগাজিনে যাবে।"]} />}
        {k === 3 && <Bubble x={62} y={84} side="right" lines={["কাগজ তো নাই।", "রাস্তা আছে, খাতা আছে।"]} />}
        {k >= 4 && <Bubble x={262} y={84} side="left" lines={["উল্টা চালালেই", "তো হয়।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · The fifth crossing: no lotus, no fish, one long pink streak. Nasib
//      walks up and stops; Rina's question, his answer.

export function FifthCrossing({}: Story) {
  const s = useScene(3, [600, 1600, 2200, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={120} label="পাঁচ নম্বর মোড়; রাস্তায় শুধু একটা লম্বা গোলাপি দাগ; নাসিব এসে থামলো; রিনা জিজ্ঞেস করলো ওটাও ফেরত আসবে কি-না; নাসিব বললো আসবে, দাঁড়াও">
        <rect x={0} y={120} width={320} height={60} fill="#6b7280" />
        <path d="M70 150H200" stroke="#f472b6" strokeWidth={4} strokeLinecap="round" />
        <path d="M200 150H240" stroke="#fbbf24" strokeWidth={4} strokeLinecap="round" />
        <circle cx={140} cy={150} r={3} fill="#fde047" />
        <Person who="rina" x={42} y={164} label arm="hold" />
        <rect x={50} y={116} width={12} height={10} rx={1} fill="#1d4ed8" />
        <Person who="nasib" x={k >= 1 ? 262 : 370} y={164} facing={-1} walking={k === 1} label />
        {k === 2 && <Bubble x={42} y={98} side="right" lines={["ওটাও ফেরত আসবে?"]} />}
        {k >= 3 && <Bubble x={262} y={98} side="left" lines={["আসবে। দাঁড়াও।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Noon. Fahim brings the paper owl out on its bamboo; its shadow lies
//      right under it; Nasib's second claim. What raising it does is the
//      screen's to find.

export function OwlNoon({}: Story) {
  const s = useScene(3, [600, 1600, 1400, 2400]);
  const k = s.k;
  const fx = k >= 1 ? 150 : -40;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={130} label="দুপুর বারোটা, সূর্য মাথার উপরে; ফাহিম বাঁশের মাথায় কাগজের পেঁচা নিয়ে এলো; রাস্তায় ঠিক নিচে গোল ছায়া; নাসিব বললো ছায়া দেখে বলে দিবে পেঁচা কত উঁচুতে">
        <circle cx={70} cy={22} r={10} fill="#fde047" stroke="#f59e0b" strokeWidth={1.5} />
        {k >= 2 && <ellipse cx={fx + 16} cy={160} rx={13} ry={4} fill="#0b1220" fillOpacity={0.5} className={FADE} />}
        <g className="transition-transform duration-[1200ms] ease-out motion-reduce:transition-none" style={{ transform: `translateX(${fx}px)` }}>
          <path d="M16 112V46" stroke="#a16207" strokeWidth={3} strokeLinecap="round" />
          <FC_OwlSprite at={[16, 48]} s={0.85} />
        </g>
        <ellipse cx={266} cy={151} rx={9} ry={2.5} fill="#0b1220" fillOpacity={0.45} />
        <ellipse cx={fx} cy={151} rx={9} ry={2.5} fill="#0b1220" fillOpacity={0.45} className="transition-[cx] duration-[1200ms] ease-out motion-reduce:transition-none" />
        <Person who="fahim" x={fx} y={150} walking={k === 1} arm="hold" label />
        <Person who="nasib" x={266} y={150} facing={-1} label mood={k >= 3 ? "smug" : "plain"} />
        {k >= 3 && <Bubble x={266} y={84} side="left" lines={["ছায়া দেখে বলে দিবো,", "পেঁচা কত উঁচুতে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 8a · Evening, the gate steps. Four papers done, the fifth blank. Rina takes
//      it and draws, petal by petal, then the fish; তপু waits; the art sir
//      looks and says one word.

const S8_F = makeFrame(0.4, 6.4, 0.6, 5.6, 14, 4);

export function RinaRedraws({}: Story) {
  const s = useScene(4, [600, 1400, 2400, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={138} label="সন্ধ্যা, গেটের সিঁড়ি; চারটা কাগজে আলপনা, পাঁচ নম্বরটা খালি; রিনা খালি কাগজে পাঁচটা পাপড়ি আর একটা মাছ আঁকলো; তপু পাশে বসে থাকলো; আর্ট স্যার বললেন হইছে">
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${176 + i * 22} 150)`}>
            <rect width={18} height={13} fill="white" stroke={INK} strokeOpacity={0.3} />
            <circle cx={9} cy={7} r={3} fill="#f472b6" />
          </g>
        ))}
        {k < 1 && <rect x={264} y={150} width={18} height={13} fill="white" stroke={INK} strokeOpacity={0.3} />}
        {k >= 1 && (
          <g transform="translate(112 22)" className={FADE}>
            <rect width={S8_F.W} height={S8_F.H} rx={3} fill="white" stroke={INK} strokeOpacity={0.35} />
            {k >= 2 &&
              PETALS.map((p, i) => (
                <Draw key={i} d={pathOf(S8_F, (v) => v, p, true)} delay={i * 350} ms={500} strokeWidth={1.2} className="stroke-[#db2777]" />
              ))}
            {k >= 3 && <Draw d={pathOf(S8_F, (v) => v, FISH, true)} ms={900} strokeWidth={1.2} className="stroke-[#b45309]" />}
            {k >= 3 && <circle cx={S8_F.sx(5.45)} cy={S8_F.sy(4.55)} r={1.4} fill={INK} className={POP} style={{ transitionDelay: "900ms" }} />}
          </g>
        )}
        <Person who="rina" x={84} y={150} label arm={k >= 1 ? "hold" : "down"} />
        <Person who="samin" x={40} y={150} />
        <S_Name x={40} y={150} text="তপু" />
        <Person who="nana" x={284} y={150} facing={-1} arm={k >= 4 ? "hold" : "down"} />
        <S_Name x={284} y={150} text="আর্ট স্যার" />
        {k >= 4 && <Bubble x={284} y={84} side="left" lines={["হইছে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1a′ · The night before. Rain on the gate pillar; the art sir's five papers
//      go soft and slide down; morning, five bare pins.

const S1_Y = [34, 52, 70, 88, 106];
/** where each wet paper ends up on the road: dx, dy, turn */
const S1_FALL: [number, number, number][] = [
  [-46, 118, -70],
  [-20, 104, 40],
  [22, 88, -20],
  [48, 72, 75],
  [-8, 52, -35],
];

export function RainNight({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const morning = k >= 3;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop={morning ? "street" : "night"} ground={128} label="রাতে বৃষ্টি; গেটের pillar এ পিন করা আর্ট স্যারের পাঁচটা কাগজ ভিজে খসে পড়লো; সকালে pillar এ শুধু পাঁচটা পিন">
        <rect y={128} width={320} height={52} fill={morning ? "#6b7280" : "#374151"} />
        <g opacity={0.4}>
          <ellipse cx={60} cy={166} rx={16} ry={4} fill="#f472b6" />
          <ellipse cx={250} cy={170} rx={14} ry={3.5} fill="#f472b6" />
          <ellipse cx={290} cy={160} rx={10} ry={3} fill="#fbbf24" />
        </g>
        <rect x={146} y={24} width={28} height={104} fill="#b91c1c" />
        <rect x={140} y={16} width={40} height={10} fill="#7f1d1d" />
        {S1_Y.map((y, i) => {
          const [dx, dy, rot] = S1_FALL[i];
          return (
            <g
              key={y}
              className="transition-[transform,opacity] duration-[1200ms] ease-in motion-reduce:transition-none"
              style={{ transform: k >= 2 ? `translate(${dx}px, ${dy}px) rotate(${rot}deg)` : "none", transformBox: "fill-box", transformOrigin: "center", opacity: morning ? 0.35 : 1 }}
            >
              <rect x={149} y={y} width={22} height={15} rx={1} fill={k >= 1 ? "#cbd5e1" : "white"} stroke={INK} strokeOpacity={0.3} className="transition-[fill] duration-1000 motion-reduce:transition-none" />
              <circle cx={160} cy={y + 8} r={3.4} fill="#f472b6" opacity={k >= 1 ? 0.35 : 1} className="transition-opacity duration-1000 motion-reduce:transition-none" />
            </g>
          );
        })}
        {S1_Y.map((y) => (
          <circle key={y} cx={160} cy={y + 2} r={1.6} fill="#e5e7eb" stroke={INK} strokeWidth={0.5} />
        ))}
        {k >= 1 && !morning && (
          <g className={FADE} stroke="#93c5fd" strokeOpacity={0.7} strokeWidth={1} strokeLinecap="round">
            {Array.from({ length: 34 }, (_, i) => {
              const x = (i * 97) % 330;
              const y = (i * 53) % 150;
              return <path key={i} d={`M${x} ${y}l-4 12`} />;
            })}
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 2a · Crossing 1. The doubled আলপনা on the road; Nasib walks up to it, the
//      notebook open at its matrix; তপু comes and waits with his blank graph
//      paper. How to get it back is the screen's.

const S2_F = makeFrame(-0.4, 12.4, -0.4, 10.4, 8, 0);
const S2_DOUBLE: Cols = [
  [2, 0],
  [0, 2],
];

/** the art sir's notebook, open, a matrix on its page */
function S_Khata({ x, y, rows, fs = 9 }: { x: number; y: number; rows: number[][]; fs?: number }) {
  const w = rows[0].length * fs * 1.7 + 18;
  const h = rows.length * fs * 1.3 + 14;
  return (
    <g>
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={2} fill="#1d4ed8" />
      <rect x={x} y={y} width={w} height={h} rx={1.5} fill="white" />
      <FC_SvgMat x={x + 6} y={y + 5} rows={rows} fs={fs} />
    </g>
  );
}

export function FirstCrossing({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const tx = k >= 3 ? 262 : 370;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={116} label="এক নম্বর মোড়; রাস্তায় কাগজেরটার দ্বিগুণ বড় আলপনা; নাসিব এসে বসলো, হাতে খাতা, তাতে এই মোড়ের matrix; তপু graph paper হাতে পাশে এসে বসলো">
        <rect y={116} width={320} height={64} fill="#6b7280" />
        <S_Pillar x={10} y={62} h={56} />
        <g transform="translate(112 118) scale(1 0.6)">
          <Alpana f={S2_F} move={byCols(S2_DOUBLE)} />
        </g>
        <Person who="nasib" x={k >= 1 ? 82 : -30} y={156} walking={k === 1} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 && (
          <g className={POP}>
            <S_Khata x={88} y={52} rows={rowsOfCols(S2_DOUBLE)} />
          </g>
        )}
        <Person who="samin" x={tx} y={156} facing={-1} walking={k === 3} arm="hold" />
        <g style={{ transform: `translateX(${tx}px)` }} className="transition-transform duration-[1200ms] motion-reduce:transition-none">
          <rect x={-30} y={105} width={18} height={14} fill="white" stroke={INK} strokeOpacity={0.4} />
          {[1, 2].map((i) => (
            <path key={i} d={`M${-30 + i * 6} 106V118M-29 ${105 + i * 4.7}H-13`} stroke="#93c5fd" strokeWidth={0.5} />
          ))}
        </g>
        {k >= 3 && <S_Name x={262} y={156} text="তপু" />}
      </Stage>
    </StoryFrame>
  );
}

// 3a′ · Last night, by torchlight. Rina at the fifth crossing; the notebook
//      says one matrix, she chalks another; the design goes on the road as one
//      long streak. Morning: the first rickshaw rolls over it, and on.

/** a cycle rickshaw, side on; glides to x */
function S_Rickshaw({ x }: { x: number }) {
  return (
    <g style={{ transform: `translate(${x}px, -8px)` }} className="pointer-events-none transition-transform duration-[1600ms] ease-in-out motion-reduce:transition-none">
      <circle cx={-18} cy={164} r={9} fill="none" stroke={INK} strokeWidth={2} />
      <circle cx={16} cy={164} r={9} fill="none" stroke={INK} strokeWidth={2} />
      <path d="M-18 164L0 150L16 164M0 150V132" stroke={INK} strokeWidth={1.6} fill="none" />
      <rect x={-8} y={128} width={20} height={8} rx={2} fill="#dc2626" />
      <path d="M-10 128q12 -26 26 0Z" fill="#1d4ed8" />
    </g>
  );
}

/** a notebook page with a small Bangla heading and a matrix */
function S_Page({ x, y, head, rows }: { x: number; y: number; head: string; rows: number[][] }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={48} height={40} rx={2} fill="white" stroke={INK} strokeOpacity={0.35} />
      <text x={24} y={10} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK}>
        {head}
      </text>
      <FC_SvgMat x={8} y={14} rows={rows} fs={8.5} />
    </g>
  );
}

export function RinaTorch({}: Story) {
  const s = useScene(4, [600, 1600, 2000, 1800, 1800]);
  const k = s.k;
  const morning = k >= 3;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop={morning ? "street" : "night"} ground={118} label="কাল রাতে টর্চের আলোয় রিনা পাঁচ নম্বর মোড় আঁকলো; খাতায় এক matrix, রিনা তুললো আরেকটা; রাস্তায় একটা লম্বা দাগ; সকালে প্রথম রিকশা ওটার উপর দিয়ে চলে গেলো">
        <rect y={118} width={320} height={62} fill={morning ? "#6b7280" : "#586170"} />
        {!morning && <path d="M52 108L96 178H262L252 138Z" fill="#fef9c3" opacity={0.22} />}
        {k >= 2 && (
          <g>
            <Draw d="M70 150H200" ms={900} strokeWidth={4} className="stroke-[#f472b6]" />
            <Draw d="M200 150H240" ms={400} delay={850} strokeWidth={4} className="stroke-[#fbbf24]" />
          </g>
        )}
        {!morning && (
          <>
            <Person who="rina" x={38} y={164} label arm="hold" />
            <rect x={45} y={115} width={10} height={6} rx={1.5} fill="#475569" />
            <circle cx={55} cy={118} r={2.4} fill="#fde047" />
          </>
        )}
        {k >= 1 && !morning && (
          <g className={POP}>
            <S_Page x={70} y={22} head="খাতায়" rows={[[3, 0], [0, 1]]} />
          </g>
        )}
        {k >= 2 && !morning && (
          <g className={POP}>
            <S_Page x={130} y={22} head="রিনা তুললো" rows={rowsOfCols(FLAT)} />
          </g>
        )}
        <S_Rickshaw x={k >= 4 ? 400 : k >= 3 ? 150 : -60} />
      </Stage>
    </StoryFrame>
  );
}

// 5a · The owl's sums. The art sir with his notebook; the owl drawn flat on
//      paper, where a point is two numbers; then the bamboo cage, where it
//      takes three. The sir's rule itself stays in the words.

function S_Cage({ x, y }: { x: number; y: number }) {
  const bam = "#a16207";
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={bam} strokeWidth={1.6} strokeLinejoin="round">
      <path d="M0 30V70" strokeWidth={3} strokeLinecap="round" />
      <path d="M-16 -22l3 -12l8 8M16 -22l-3 -12l-8 8" />
      <ellipse cx={0} cy={0} rx={22} ry={30} />
      <ellipse cx={0} cy={-12} rx={20} ry={5} strokeOpacity={0.7} />
      <ellipse cx={0} cy={4} rx={22} ry={6} strokeOpacity={0.7} />
      <ellipse cx={0} cy={18} rx={17} ry={5} strokeOpacity={0.7} />
      <path d="M0 -30V30M-11 -26Q-16 0 -11 26M11 -26Q16 0 11 26" strokeOpacity={0.7} />
    </g>
  );
}

export function OwlCage({}: Story) {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={150} label="আর্ট স্যারের খাতার শেষ পাতা; পেঁচা আগে কাগজে আঁকা, কাগজের বিন্দু দুইটা সংখ্যা; বাঁশের খাঁচায় সেই বিন্দু তিনটা সংখ্যা">
        <Person who="nana" x={34} y={150} arm="hold" />
        <rect x={42} y={104} width={12} height={10} rx={1} fill="#1d4ed8" />
        <S_Name x={34} y={150} text="আর্ট স্যার" />
        {k >= 1 && (
          <g className={FADE}>
            <rect x={70} y={36} width={70} height={70} rx={2} fill="white" stroke={INK} strokeOpacity={0.35} />
            {[1, 2, 3, 4].map((i) => (
              <path key={i} d={`M${70 + i * 14} 38V104M72 ${36 + i * 14}H138`} stroke="#93c5fd" strokeOpacity={0.5} strokeWidth={0.5} />
            ))}
            <FC_OwlSprite at={[105, 94]} s={1.5} />
            <circle cx={105} cy={76} r={2.6} fill={INK} className={POP} />
            <path d="M107 76L150 76" stroke={INK} strokeOpacity={0.5} strokeWidth={0.8} strokeDasharray="2 2" />
            <FC_Cells x={150} y={76} vals={[null, null]} tone={AMBER} w={16} h={14} />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <Draw d="M172 76H196" strokeWidth={1.4} className="stroke-[#0f1b2d]" />
            <path d="M192 72l5 4l-5 4" fill="none" stroke={INK} strokeWidth={1.3} />
            <S_Cage x={234} y={76} />
            <circle cx={234} cy={80} r={2.6} fill={INK} className={POP} />
            <path d="M236 80L276 80" stroke={INK} strokeOpacity={0.5} strokeWidth={0.8} strokeDasharray="2 2" />
            <FC_Cells x={276} y={80} vals={[null, null, null]} tone="#4f46e5" w={16} h={14} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 6a · The art sir goes to the almirah and brings out last year's notebook;
//      on its page, three more matrices. তপু waits.

export function OldKhata({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  const open = k >= 2;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={150} label="আর্ট স্যার আলমারি খুলে গত বছরের খাতা বের করলেন; পাতায় আরো তিনটা matrix; তপু পাশে দাঁড়িয়ে">
        <rect x={236} y={44} width={64} height={106} rx={2} fill="#7c2d12" />
        <rect x={242} y={60} width={52} height={3} fill="#451a03" />
        <rect x={242} y={100} width={52} height={3} fill="#451a03" />
        <rect x={246} y={80} width={6} height={20} fill="#1d4ed8" />
        <rect x={254} y={82} width={6} height={18} fill="#16a34a" />
        <rect x={262} y={78} width={6} height={22} fill="#dc2626" />
        {[0, 1].map((d) => (
          <rect
            key={d}
            x={236 + d * 32}
            y={44}
            width={32}
            height={106}
            fill="#9a3412"
            stroke="#451a03"
            strokeWidth={1}
            className="transition-transform duration-700 motion-reduce:transition-none"
            style={{ transformBox: "fill-box", transformOrigin: d ? "right" : "left", transform: k >= 1 ? "scaleX(0.18)" : "none" }}
          />
        ))}
        <Person who="samin" x={44} y={150} />
        <S_Name x={44} y={150} text="তপু" />
        <Person who="nana" x={k >= 1 ? 204 : 140} y={150} facing={k >= 2 ? -1 : 1} walking={k === 1} arm={open ? "hold" : "down"} ms={1000} />
        <S_Name x={k >= 1 ? 204 : 140} y={150} text="আর্ট স্যার" />
        {open && <rect x={184} y={104} width={12} height={10} rx={1} fill="#b45309" className={POP} />}
        {k >= 3 && (
          <g className={POP}>
            <rect x={66} y={30} width={138} height={48} rx={2} fill="white" stroke={INK} strokeOpacity={0.35} />
            <text x={135} y={41} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK}>
              গত বছর
            </text>
            <FC_SvgMat x={72} y={48} rows={[[1, -1], [-1, 1]]} fs={7} />
            <FC_SvgMat x={108} y={48} rows={[[2, 0], [0, 1]]} fs={7} />
            <FC_SvgMat x={144} y={48} rows={[[1, 0, 1, 0], [0, 1, 0, 1]]} fs={7} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The way there and the way back. Paper → (a matrix) → road; then an
//      arrow back with "?", to a blank page. Which crossings have that way
//      back is the bet, left open.

const X1_SAY = ["কাগজে design। আর্ট স্যারের খাতায় এক মোড়ের matrix।", "Matrix চালিয়ে design উঠলো রাস্তায়।", "তপুর দরকার উল্টা পথ: রাস্তা থেকে কাগজে।", "পাঁচ মোড়েই কি এই পথ আছে? এটাই বাজি।"];
const X1_F = fitFrame([FC_CROSS[1].cols], 76, 66);

export function BackToPaper() {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <svg viewBox="0 0 264 100" role="img" aria-label="কাগজের design, matrix চালিয়ে রাস্তায়; রাস্তা থেকে কাগজে ফেরার পথে প্রশ্নবোধক" className="mx-auto block h-auto w-full max-w-[17rem]">
        <FC_Paper x={2} y={16} w={72} h={60} />
        {k >= 1 && (
          <g className={FADE}>
            <Draw d="M78 36H92" strokeWidth={1.6} className="stroke-[#0f1b2d]" />
            <path d="M88 32l5 4l-5 4" fill="none" stroke={INK} strokeWidth={1.4} />
            <svg x={96} y={13} width={X1_F.W} height={X1_F.H} viewBox={`0 0 ${X1_F.W} ${X1_F.H}`}>
              <FC_RoadG f={X1_F} move={byCols(FC_CROSS[1].cols)} />
            </svg>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <Draw d="M134 82Q134 94 170 94Q206 94 212 82" strokeWidth={1.6} className="stroke-[#e11d48]" />
            <text x={172} y={90} textAnchor="middle" fontSize={11} fontWeight={800} fill={BAD}>
              ?
            </text>
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <FC_Paper x={186} y={16} w={72} h={60} blank q />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · The way back is a matrix too. The shear goes out and comes back; its
//      matrix and the undo matrix appear beside it.

const X2_SAY = ["চার নম্বর মোড়ের কাগজ।", "Shear: প্রত্যেক বিন্দু তার উচ্চতা যত, তত ঘর ডানে।", "উল্টা shear: উচ্চতা যত, তত ঘর বামে। ফেরত।", "উল্টা move টাও একটা matrix।"];
const X2_SHEAR = FC_CROSS[3].cols;
const X2_F = fitFrame([ID, X2_SHEAR], 170, 90);

export function UndoShear() {
  const s = useScene(3, [600, 1600, 1800, 2000]);
  const k = s.k;
  const [t] = useTween([k === 1 ? 1 : 0], 700);
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <svg viewBox="0 0 262 104" role="img" aria-label="shear করা আলপনা আবার উল্টা shear এ ফেরত; পাশে দুইটা matrix" className="mx-auto block h-auto w-full max-w-[17rem]">
        <svg x={0} y={7} width={X2_F.W} height={X2_F.H} viewBox={`0 0 ${X2_F.W} ${X2_F.H}`}>
          <FC_RoadG f={X2_F} move={partway(byCols(X2_SHEAR), t)} />
        </svg>
        {k >= 1 && <rect x={172} y={3} width={86} height={98} rx={6} fill="white" className={FADE} />}
        {k >= 1 && (
          <g className={FADE}>
            <text x={178} y={14} fontSize={8} fontWeight={700} fill={INK}>
              shear
            </text>
            <FC_SvgMat x={178} y={18} rows={[[1, 1], [0, 1]]} fs={11} />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <text x={178} y={62} fontSize={8} fontWeight={700} fill={OK}>
              উল্টা shear
            </text>
            <FC_SvgMat x={178} y={66} rows={[[1, -1], [0, 1]]} tone={OK} fs={11} />
          </g>
        )}
        {k >= 3 && <FC_Mark ok x={240} y={84} s={0.8} />}
      </svg>
    </Scene>
  );
}

// 3½ · The press. Two paper points (5, 1) and (5, 4); the second rope goes
//      to (0, 0); the grid presses down onto the line and the two points meet
//      at (5, 0); (5, 99) would too.

const X3_SAY = ["কাগজে দুইটা বিন্দু: (5, 1) আর (5, 4)।", "রিনার matrix: প্রথম দড়ি থাকে (1, 0) তে। দ্বিতীয়টা যাবে (0, 0) তে।", "পুরা grid চেপে বসলো একটা লাইনে। দুই বিন্দু এক জায়গায়, (5, 0)।", "(5, 99) হলেও আসতো এখানেই। কে ছিল, বলার উপায় নাই।"];
const X3_F = makeFrame(-0.8, 7, -1.2, 5.2, 24, 8);
const X3_PTS: XY[] = [
  [5, 1],
  [5, 4],
];

export function PressFlat() {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 1 : 0], 900);
  const move = partway(byCols(FLAT), t);
  const f = X3_F;
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <FC_Road f={f} move={move} design={false} ghost={k >= 2} className="max-w-[15rem]" label="দুইটা বিন্দু (5, 1) আর (5, 4); grid চেপে একটা লাইনে; দুইটাই (5, 0) তে">
        {k === 1 && (
          <>
            <Rope f={f} to={[1, 0]} which={1} />
            <Rope f={f} to={[0, 1]} which={2} />
            <path d={`M${f.sx(0) + 6} ${f.sy(1)}l0 ${f.u - 12}`} stroke="#2dd4bf" strokeWidth={1.5} strokeDasharray="2 2" />
          </>
        )}
        {X3_PTS.map((p) => {
          const q = move(p);
          return (
            <g key={p.join()}>
              <circle cx={f.sx(q[0])} cy={f.sy(q[1])} r={4.5} fill={p[1] === 1 ? "#fbbf24" : "#f472b6"} stroke={INK} strokeWidth={0.8} />
              {k < 2 && (
                <text x={f.sx(q[0]) + 7} y={f.sy(q[1]) + 3.5} fontSize={10} fontWeight={700} fontFamily={MONO} fill={CHALK}>
                  ({p[0]}, {p[1]})
                </text>
              )}
            </g>
          );
        })}
        {k >= 2 && (
          <text x={f.sx(5)} y={f.sy(0) + 16} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={CHALK} className={FADE}>
            (5, 0)
          </text>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <path d={`M${f.sx(5)} ${f.sy(0) - 8}V${f.sy(4.8)}`} stroke={AMBER} strokeDasharray="3 3" strokeWidth={1.4} />
            <path d={`M${f.sx(5) - 5} ${f.sy(4.6)}l5 -7l5 7`} fill="none" stroke={AMBER} strokeWidth={1.6} />
            <text x={f.sx(5) - 8} y={f.sy(4.2)} textAnchor="end" fontSize={10} fontWeight={700} fontFamily={MONO} fill={CHALK}>
              (5, 99)?
            </text>
          </g>
        )}
      </FC_Road>
    </Scene>
  );
}

// 4½ · Two owls, one shadow. Low owl, then high; both kept, one shadow; then
//      the 2 × 3 with its third column (height) marked: it goes nowhere.

const X4_SAY = ["পেঁচা (3, 2, 1) এ। ছায়া (3, 2)।", "পেঁচা উঠলো (3, 2, 4) এ। ছায়া এখনো (3, 2)।", "দুইটা আলাদা পেঁচা, একটা ছায়া।", "Matrix এর তৃতীয় column শূন্য। উচ্চতা কোথাও যায় না।"];

export function TwoOwls() {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  const [z] = useTween([k >= 1 ? 4 : 1], 800);
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <svg viewBox="0 0 290 190" role="img" aria-label="একই জায়গায় দুই উচ্চতার পেঁচা, একটাই ছায়া; পাশে 2 × 3 matrix" className="mx-auto block h-auto w-full max-w-[16rem]">
        <FC_OwlRoad z={z} ghosts={k >= 2 ? [1] : []}>
          {k >= 3 && (
            <g className={FADE}>
              <rect x={200} y={14} width={68} height={54} rx={6} fill="white" />
              <FC_SvgMat x={206} y={20} rows={[[1, 0, 0], [0, 1, 0]]} fs={10} hiCol={2} />
              <text x={234} y={62} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
                2 × 3
              </text>
            </g>
          )}
        </FC_OwlRoad>
      </svg>
    </Scene>
  );
}

// 5½ · A route of widths. Two cells widen to three through the 3 × 2, then
//      narrow to two through the shadow's 2 × 3; then a network layer's
//      768 → 512.

const X5_SAY = ["কাগজের একটা বিন্দু: দুইটা সংখ্যা।", "3 × 2 (পেঁচার খাঁচা): দুই ঢুকলো, তিন বের হলো।", "2 × 3 (ছায়া): তিন ঢুকলো, দুই বের হলো।", "AI এর একটা layer: 512 × 768. 768 ঢোকে, 512 বের হয়।"];

function X5_Stack({ x, n, tone }: { x: number; n: number; tone: string }) {
  return (
    <g className={POP}>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x} y={40 - (n * 14) / 2 + i * 14} width={16} height={12} rx={2} fill="white" stroke={tone} strokeWidth={1.4} />
      ))}
    </g>
  );
}

export function RouteWidth() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <svg viewBox="0 0 250 92" role="img" aria-label="দুই ঘর থেকে তিন ঘর, তারপর আবার দুই ঘর; নিচে 768 থেকে 512" className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect width={250} height={92} rx={8} fill="white" />
        <X5_Stack x={14} n={2} tone={AMBER} />
        {k >= 1 && (
          <g className={FADE}>
            <path d="M36 40H90" stroke={INK} strokeOpacity={0.4} strokeWidth={1.3} />
            <text x={63} y={34} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={INK}>
              3×2
            </text>
            <X5_Stack x={96} n={3} tone="#4f46e5" />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d="M118 40H172" stroke={INK} strokeOpacity={0.4} strokeWidth={1.3} />
            <text x={145} y={34} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={INK}>
              2×3
            </text>
            <X5_Stack x={178} n={2} tone="#0f766e" />
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <text x={125} y={82} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={MONO} fill={INK}>
              768 → [512×768] → 512
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 7½ · Both columns point the same way. Rope 1 to (1, 1), rope 2 to (1, 1)
//      on top of it; then the line y = x through them, and a few recipes'
//      landing spots on it.

const X7_SAY = ["দুই দড়ি, pillar থেকে।", "প্রথম column (1, 1): প্রথম দড়ি কোনাকুনি।", "দ্বিতীয় column ও (1, 1)। একই জায়গায়।", "যেকোনো recipe এ এদের যোগ পড়বে এই লাইনেই।"];
const X7_F = makeFrame(-1, 4, -1, 4, 30, 8);

export function ColumnsSameWay() {
  const s = useScene(3, [600, 1400, 1600, 2200]);
  const k = s.k;
  const f = X7_F;
  const [a, b, c, d] = useTween(k >= 2 ? [1, 1, 1, 1] : k >= 1 ? [1, 1, 0, 1] : [1, 0, 0, 1], 700);
  return (
    <Scene scene={s} caption={say(X7_SAY, k)}>
      <FC_Road f={f} move={(p) => p} design={false} className="max-w-[11rem]" label="দুই দড়ি একই জায়গায় (1, 1); তাদের সব যোগ একটা কোনাকুনি লাইনে">
        {k >= 3 && (
          <g className={FADE}>
            <path d={`M${f.sx(-1)} ${f.sy(-1)}L${f.sx(4)} ${f.sy(4)}`} stroke={CHALK} strokeWidth={1.4} strokeDasharray="5 4" />
            {[2, 3].map((v) => (
              <circle key={v} cx={f.sx(v)} cy={f.sy(v)} r={3.4} fill={CHALK} className={POP} />
            ))}
          </g>
        )}
        <Rope f={f} to={[c, d]} which={2} />
        <Rope f={f} to={[a, b]} which={1} />
      </FC_Road>
    </Scene>
  );
}

// 8½ · The bet settled, crossing by crossing: four ticks, one cross.

const X8_SAY = ["পাঁচ মোড়, পাঁচটা বাজি।", "দ্বিগুণ: অর্ধেক করলেই ফেরত।", "আয়না: আবার আয়না।", "ঘোরানো: উল্টা দিকে ঘোরানো।", "Shear: উল্টা ঠেলা।", "পাঁচ নম্বর: দুই column এক লাইনে। ফেরার পথ নাই।"];
const X8_F = FC_CROSS.map((c) => fitFrame([c.cols], 64, 52, 4, 0.5));

export function FiveBack() {
  const s = useScene(5, [600, 1400, 1400, 1400, 1400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X8_SAY, k)}>
      <svg viewBox="0 0 270 76" role="img" aria-label="পাঁচ মোড়ের হিসাব: চারটায় tick, পাঁচ নম্বরে cross" className="mx-auto block h-auto w-full max-w-[18rem]">
        {FC_CROSS.map((c, i) => (
          <g key={c.name}>
            <svg x={i * 54} y={2} width={X8_F[i].W * 0.78} height={X8_F[i].H * 0.78} viewBox={`0 0 ${X8_F[i].W} ${X8_F[i].H}`}>
              <FC_RoadG f={X8_F[i]} move={byCols(c.cols)} streak={!c.back} />
            </svg>
            {k >= i + 1 && <FC_Mark ok={c.back} x={i * 54 + 25} y={60} />}
          </g>
        ))}
      </svg>
    </Scene>
  );
}


// 3¾ · For the side note: the fifth crossing's matrix gets one number, the
//      determinant. The road presses onto a line and the number reads 0;
//      then the way back from the line is crossed out: no inverse.

const X3Z_SAY = ["যে matrix একটা দিক হারায়, Article 8 এ তার একটা সংখ্যা মাপা হবে: determinant।", "পুরা রাস্তা একটা লাইনে বসে গেলে ওই সংখ্যা শূন্য।", "Determinant শূন্য হলে উল্টা matrix, মানে inverse, থাকে না।"];
const X3Z_F = fitFrame([ID, FLAT], 170, 110);

export function ZeroLine() {
  const s = useScene(2, [600, 2200, 2400]);
  const k = s.k;
  const [t] = useTween([k >= 1 ? 1 : 0], 900);
  const f = X3Z_F;
  return (
    <Scene scene={s} caption={say(X3Z_SAY, k)}>
      <svg viewBox="0 0 264 110" role="img" aria-label="পাঁচ নম্বর মোড়ের রাস্তা একটা লাইনে বসলো; determinant শূন্য; লাইন থেকে ফেরার পথ কাটা" className="mx-auto block h-auto w-full max-w-[17rem]">
        <svg x={0} y={0} width={f.W} height={f.H} viewBox={`0 0 ${f.W} ${f.H}`}>
          <FC_RoadG f={f} move={partway(byCols(FLAT), t)} streak={t > 0.9} ghost={k >= 1} />
          {k >= 2 && (
            <g className={FADE}>
              <Draw d={`M${f.sx(3)} ${f.sy(0) - 6}Q${f.sx(3.6)} ${f.sy(2.4)} ${f.sx(4.4)} ${f.sy(3.6)}`} strokeWidth={1.8} className="stroke-[#e11d48]" />
              <FC_Mark ok={false} x={f.sx(3.6)} y={f.sy(2.2)} s={0.8} />
            </g>
          )}
        </svg>
        <text x={218} y={34} textAnchor="middle" fontSize={10} fontWeight={700} className="fill-foreground">
          determinant
        </text>
        <rect x={196} y={42} width={44} height={30} rx={6} fill="white" stroke={k >= 1 ? BAD : INK} strokeOpacity={k >= 1 ? 1 : 0.4} strokeWidth={1.4} />
        <text key={k >= 1 ? "z" : "q"} x={218} y={63} textAnchor="middle" fontSize={17} fontWeight={800} fontFamily={MONO} fill={k >= 1 ? BAD : "#64748b"} className={POP}>
          {k >= 1 ? "0" : "?"}
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  UndoBet: { start: {}, ticked: { ticks: [true, false, true, true, false] }, sealed: { ticks: [true, false, true, true, false], sealed: true } },
  RunBackwards: { start: {}, half: { d: 2 }, shear: { round: 1, d: 2 }, left2: { round: 1, d: 2, s: -2 }, done: { round: 1, d: 2, s: -1 } },
  FlatCrossing: { start: {}, one: { taps: [3] }, two: { taps: [3, 6] } },
  OwlShadow: { start: {}, high: { z: 4, seen: [2, 4] }, done: { z: 1, seen: [2, 4, 1] } },
  ShapeIsRoute: { start: {}, one: { sent: 1, ph: 2 }, two: { sent: 2, ph: 2 }, done: { sent: 2, ph: 2, checked: true } },
  YourUndo: {
    start: {},
    turnBack: { verdict: true, k: 1 },
    flatWrong: { round: 1, verdict: true, miss: 1, k: 2 },
    route: { round: 3, verdict: false, k: 2 },
    mirrorWrong: { round: 4, verdict: false, miss: 1, k: 2 },
    done: { round: 4, verdict: true, k: 2 },
  },
  TryWhichLine: { start: {}, wrong: { pick: 0, miss: 1 }, right: { pick: 1 } },
  // Story scenes and figures: `k` is the beat shown (no seed shows the last).
  GateSteps: { rest: { k: 0 }, topu: { k: 2 }, sir: { k: 3 }, done: {} },
  FifthCrossing: { rest: { k: 0 }, rina: { k: 2 }, done: {} },
  OwlNoon: { rest: { k: 0 }, done: {} },
  RinaRedraws: { paper: { k: 1 }, petals: { k: 2 }, done: {} },
  BackToPaper: { road: { k: 1 }, done: {} },
  UndoShear: { out: { k: 1 }, done: {} },
  PressFlat: { rest: { k: 0 }, ropes: { k: 1 }, done: {} },
  TwoOwls: { low: { k: 0 }, done: {} },
  RouteWidth: { mid: { k: 2 }, done: {} },
  ColumnsSameWay: { one: { k: 1 }, done: {} },
  FiveBack: { mid: { k: 3 }, done: {} },
  RainNight: { night: { k: 0 }, rain: { k: 1 }, fall: { k: 2 }, done: {} },
  FirstCrossing: { rest: { k: 0 }, khata: { k: 2 }, done: {} },
  RinaTorch: { rest: { k: 0 }, chalk: { k: 2 }, rickshaw: { k: 3 }, done: {} },
  OwlCage: { paper: { k: 1 }, done: {} },
  OldKhata: { rest: { k: 0 }, open: { k: 2 }, done: {} },
  ZeroLine: { rest: { k: 0 }, flat: { k: 1 }, done: {} },
};
