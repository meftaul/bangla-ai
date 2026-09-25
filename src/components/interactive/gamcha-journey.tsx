"use client";

import { useState, type KeyboardEvent } from "react";

import { Tup } from "@/components/journey/box";
import { Bubble, Chest, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, predictLook, primaryBtn, usePlay, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { BIRD_COLS, BIRD_PX } from "./pixel-art";

// Screens for "Math for AI 7.6 — নানার গামছা, a grid from two threads", told as
// a Journey in the author's Bangla-English. The plan is 07_journey_specs.md,
// block 7.6. The last journey of Article 7.
//
// The বিয়ের রাত at নানাবাড়ি. নানা weaves the বর's গামছা on his old তাঁত. Every
// cell's colour is how dark its row's thread (পাশের সুতা) × how dark its
// column's thread (উপরের সুতা): one column × one row, a whole grid, the outer
// product. সোম wants আপার নামের প্রথম অক্ষর, T, woven in. নানা: একবারে একটা
// চেকই ওঠে; নাসিব: চেক দিয়ে অক্ষর কোনোদিন হয় না। How many checks does T need?
//
// The letter is a T on a 7 × 7 loom: row 2 full (columns 2–6), the stem in
// column 4 (rows 3–6). Its rows come in exactly two kinds, so it is rank 2:
// the bar (row 2 ⊗ columns 2–6) plus the stem (rows 3–6 ⊗ column 4), and no
// single check makes it. Two checks, one letter: honest.
//
// Nine screens. 1 seals the bet (GamchaBet). 2 one check, (1, 2) ⊗ (3, 4) =
// [[3, 4], [6, 8]] (OneCheck). 3 the same two into 4.1's box: 11, the grid's
// diagonal added (NumberOrGrid). 4 one check can't make T (OneLayerIsPlain).
// 5 7.3's W and Z as two checks: (0, 1) ⊗ (−1, 1) + (1, 1) ⊗ (2, 1) = G
// (TwoLayers). 6 Your turn: weave T with up to three checks (YourLetter).
// 7 Try it: which threads made Rina's old গামছা (TryWhichThreads). 8 the bet
// opened card by card on Nana's গামছা (BetCards). 9 the article's five things,
// tap by tap (FiveThings).
//
// After the screens: the story scenes (numbered "a") and the watch-only
// figures (numbered "½"), each after its screen.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const OK = "#0d9488";
const BAD = "#e11d48";
const RED = "#dc2626";
const MAROON = "#7f1d1d";
const BLUE = "#2563eb";
const GREEN = "#15803d";
const CREAM = "#fefce8";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

type Grid = number[][];
const outer = (u: readonly number[], v: readonly number[]): Grid => u.map((a) => v.map((b) => a * b));
const addG = (a: Grid, b: Grid): Grid => a.map((r, i) => r.map((x, j) => x + b[i][j]));
const sameG = (a: Grid, b: Grid) => a.every((r, i) => r.every((x, j) => x === b[i][j]));
const zeros = (n: number, m: number): Grid => Array.from({ length: n }, () => Array(m).fill(0));
const sg = (n: number) => (n < 0 ? `−${-n}` : `${n}`);

/** what each number in a thread list counts */
const U2 = ["row 1 এর সুতা", "row 2 এর সুতা"];
const V2 = ["column 1 এর সুতা", "column 2 এর সুতা"];

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ",\u00a0")}
  </span>
);

// ---------------------------------------------------------------------------
// The letter, and its two checks.

const N7 = 7;
const e7 = (...on: number[]): number[] => Array.from({ length: N7 }, (_, i) => (on.includes(i) ? 1 : 0));
type Check = { rows: number[]; cols: number[] };
/** the T's bar: row 2's thread × the threads of columns 2–6 */
const BAR: Check = { rows: e7(1), cols: e7(1, 2, 3, 4, 5) };
/** the T's stem: the threads of rows 3–6 × column 4's thread */
const STEM: Check = { rows: e7(2, 3, 4, 5), cols: e7(3) };
const weave = (c: Check) => outer(c.rows, c.cols);
const pile = (cs: Check[]) => cs.reduce((g, c) => addG(g, weave(c)), zeros(N7, N7));
const T: Grid = pile([BAR, STEM]);
const EMPTY: Check = { rows: e7(), cols: e7() };

// ---------------------------------------------------------------------------
// Shared drawing.

/** a cell's colour by its number: red for plus, blue for minus, deeper as it grows */
function tone(v: number, max: number) {
  if (v === 0) return { fill: "transparent", op: 1, ink: INK };
  const op = 0.22 + 0.78 * Math.min(1, Math.abs(v) / max);
  return { fill: v > 0 ? RED : BLUE, op, ink: op > 0.55 ? "white" : INK };
}

/**
 * A small woven grid, top-left of its cells at (x, y): the row threads' tabs
 * down the left (u), the column threads' tabs along the top (v), each row's
 * and column's thread running through, and the cells coloured by their
 * numbers. `shown` cells (row by row) are woven; the rest wait empty.
 */
function G_Weave({
  g,
  u,
  v,
  x = 0,
  y = 0,
  c = 26,
  max,
  shown,
  nums = true,
  ring,
  dim = false,
  skip,
}: {
  g: Grid;
  u?: readonly number[];
  v?: readonly number[];
  x?: number;
  y?: number;
  c?: number;
  max?: number;
  shown?: number;
  nums?: boolean;
  ring?: (boolean | null)[][] | null;
  dim?: boolean;
  /** cells drawn empty, whatever their number */
  skip?: (i: number, j: number) => boolean;
}) {
  const n = g.length;
  const m = g[0].length;
  const mx = max ?? Math.max(1, ...g.flat().map(Math.abs));
  const tmax = Math.max(1, ...(u ?? []).map(Math.abs), ...(v ?? []).map(Math.abs));
  const fs = c * 0.42;
  return (
    <g transform={`translate(${x} ${y})`} opacity={dim ? 0.35 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
      <rect width={m * c} height={n * c} fill={CREAM} stroke="#a8a29e" strokeWidth={0.8} />
      {u?.map((a, i) => (
        <path key={`ut${i}`} d={`M-4 ${(i + 0.5) * c}H${m * c}`} stroke={a < 0 ? BLUE : RED} strokeOpacity={a === 0 ? 0.12 : 0.25 + (0.5 * Math.abs(a)) / tmax} strokeWidth={2} />
      ))}
      {v?.map((b, j) => (
        <path key={`vt${j}`} d={`M${(j + 0.5) * c} -4V${n * c}`} stroke={b < 0 ? BLUE : RED} strokeOpacity={b === 0 ? 0.12 : 0.25 + (0.5 * Math.abs(b)) / tmax} strokeWidth={2} />
      ))}
      {g.map((r, i) =>
        r.map((val, j) => {
          if ((shown !== undefined && i * m + j >= shown) || skip?.(i, j)) return null;
          const t = tone(val, mx);
          return (
            <g key={`${i}.${j}`} className={POP}>
              <rect x={j * c + 1} y={i * c + 1} width={c - 2} height={c - 2} rx={2} fill={t.fill} fillOpacity={t.op} />
              {nums && (
                <text x={(j + 0.5) * c} y={(i + 0.5) * c + fs * 0.36} textAnchor="middle" fontSize={fs} fontFamily={MONO} fontWeight={700} fill={t.ink}>
                  {sg(val)}
                </text>
              )}
            </g>
          );
        }),
      )}
      {ring?.map((r, i) =>
        r.map((ok, j) =>
          ok === null || ok === undefined ? null : (
            <rect key={`r${i}.${j}`} x={j * c + 1.5} y={i * c + 1.5} width={c - 3} height={c - 3} rx={2} fill="none" stroke={ok ? OK : BAD} strokeWidth={2} className={POP} />
          ),
        ),
      )}
      {u?.map((a, i) => (
        <g key={`u${i}`}>
          <rect x={-c * 0.8 - 4} y={i * c + c * 0.18} width={c * 0.8} height={c * 0.64} rx={2} fill="white" stroke={a < 0 ? BLUE : RED} strokeWidth={1.2} />
          <text x={-c * 0.4 - 4} y={(i + 0.5) * c + fs * 0.34} textAnchor="middle" fontSize={fs * 0.9} fontFamily={MONO} fontWeight={700} fill={INK}>
            {sg(a)}
          </text>
        </g>
      ))}
      {v?.map((b, j) => (
        <g key={`v${j}`}>
          <rect x={j * c + c * 0.1} y={-c * 0.7 - 4} width={c * 0.8} height={c * 0.64} rx={2} fill="white" stroke={b < 0 ? BLUE : RED} strokeWidth={1.2} />
          <text x={(j + 0.5) * c} y={-c * 0.38 - 4 + fs * 0.34} textAnchor="middle" fontSize={fs * 0.9} fontFamily={MONO} fontWeight={700} fill={INK}>
            {sg(b)}
          </text>
        </g>
      ))}
    </g>
  );
}

/** a cell's colour on the 7 × 7 loom: one check red, two on top of each other deeper */
const LOOM_FILL = ["transparent", RED, MAROON, "#450a0a", "#1c0505"];

/**
 * The 7 × 7 loom: a thread tab per row (left) and per column (top), dark when
 * the thread is on; the cells show how many checks landed there; the T is a
 * dashed outline to aim at. Tabs are tappable when `onRow` / `onCol` are given.
 */
function G_Loom7({
  rows,
  cols,
  sum,
  ring,
  onRow,
  onCol,
  outline = true,
  label,
  className = "mx-auto block h-auto w-full max-w-[15rem]",
}: {
  rows?: readonly number[];
  cols?: readonly number[];
  sum: Grid;
  ring?: (boolean | null)[][] | null;
  onRow?: (i: number) => void;
  onCol?: (j: number) => void;
  outline?: boolean;
  label: string;
  className?: string;
}) {
  const c = 22;
  const o = 24;
  const tap = (f?: (i: number) => void, i = 0) =>
    f
      ? {
          role: "button",
          tabIndex: 0,
          onClick: () => f(i),
          onKeyDown: (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              f(i);
            }
          },
          className: "cursor-pointer outline-none",
        }
      : {};
  return (
    <svg viewBox={`0 0 ${o + N7 * c + 4} ${o + N7 * c + 4}`} role="img" aria-label={label} className={className}>
      <rect x={o} y={o} width={N7 * c} height={N7 * c} fill={CREAM} stroke="#a8a29e" strokeWidth={0.8} />
      {rows?.map((a, i) => (a ? <path key={`rt${i}`} d={`M${o - 2} ${o + (i + 0.5) * c}H${o + N7 * c}`} stroke={RED} strokeOpacity={0.35} strokeWidth={2.4} /> : null))}
      {cols?.map((b, j) => (b ? <path key={`ct${j}`} d={`M${o + (j + 0.5) * c} ${o - 2}V${o + N7 * c}`} stroke={RED} strokeOpacity={0.35} strokeWidth={2.4} /> : null))}
      {sum.map((r, i) =>
        r.map((val, j) => (
          <rect
            key={`${i}.${j}`}
            x={o + j * c + 1}
            y={o + i * c + 1}
            width={c - 2}
            height={c - 2}
            rx={2}
            style={{ fill: LOOM_FILL[Math.min(4, val)] }}
            className="transition-colors duration-300 motion-reduce:transition-none"
          />
        )),
      )}
      {outline &&
        T.map((r, i) =>
          r.map((val, j) =>
            val ? <rect key={`t${i}.${j}`} x={o + j * c + 2.5} y={o + i * c + 2.5} width={c - 5} height={c - 5} rx={1.5} fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={1} strokeDasharray="2.5 2" /> : null,
          ),
        )}
      {ring?.map((r, i) =>
        r.map((ok, j) =>
          ok === false ? <rect key={`x${i}.${j}`} x={o + j * c + 1} y={o + i * c + 1} width={c - 2} height={c - 2} rx={2} fill="none" stroke={BAD} strokeWidth={2.4} className={POP} /> : null,
        ),
      )}
      {rows?.map((a, i) => (
        <g key={`r${i}`} {...tap(onRow, i)}>
          <rect x={2} y={o + i * c + 3} width={o - 7} height={c - 6} rx={3} fill={a ? RED : "white"} stroke={a ? MAROON : "#94a3b8"} strokeWidth={1.2} className="transition-colors duration-200 motion-reduce:transition-none" />
        </g>
      ))}
      {cols?.map((b, j) => (
        <g key={`c${j}`} {...tap(onCol, j)}>
          <rect x={o + j * c + 3} y={2} width={c - 6} height={o - 7} rx={3} fill={b ? RED : "white"} stroke={b ? MAROON : "#94a3b8"} strokeWidth={1.2} className="transition-colors duration-200 motion-reduce:transition-none" />
        </g>
      ))}
    </svg>
  );
}

/** N little checks, overlapping like cloth laid on cloth; `none` crosses one out */
function G_Chips({ n, none = false, className = "block h-6 w-auto" }: { n: number; none?: boolean; className?: string }) {
  const w = 16;
  const count = none ? 1 : n;
  return (
    <svg viewBox={`0 0 ${w + (count - 1) * 9 + 2} 20`} aria-hidden="true" className={className}>
      {Array.from({ length: count }, (_, i) => (
        <g key={i} transform={`translate(${1 + i * 9} 2)`}>
          <rect width={w} height={16} rx={2} fill={CREAM} stroke={MAROON} strokeWidth={0.8} />
          <path d="M0 5h16M0 11h16M5 0v16M11 0v16" stroke={RED} strokeWidth={1.6} strokeOpacity={0.8} />
        </g>
      ))}
      {none && <path d="M2 2l15 16M17 2L2 18" stroke={BAD} strokeWidth={2} strokeLinecap="round" />}
    </svg>
  );
}

/** a drawn tick or cross (✓ ✕ glyphs turn into emoji on Linux) */
function G_Mark({ ok, className = "size-4" }: { ok: boolean; className?: string }) {
  return ok ? (
    <svg viewBox="0 0 12 12" className={`${className} ${POP}`} aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke={OK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" className={`${className} ${POP}`} aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke={BAD} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/** a 2 × 2 (or any) matrix written out in brackets; `hiCol` / `hiRow` light one */
function G_Mat({ g, hiCol, hiRow, name }: { g: Grid; hiCol?: number; hiRow?: number; name?: string }) {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {name && <span className="font-mono text-sm font-bold">{name}</span>}
      <span aria-hidden="true" className="h-10 w-1.5 rounded-l-sm border-y-2 border-l-2 border-foreground/60" />
      <span className="grid gap-x-1 font-mono text-sm font-semibold" style={{ gridTemplateColumns: `repeat(${g[0].length}, minmax(0, 1fr))` }}>
        {g.flatMap((r, i) =>
          r.map((val, j) => (
            <span
              key={`${i}.${j}`}
              className={`rounded px-1 text-center transition-colors duration-300 motion-reduce:transition-none ${hiCol === j || hiRow === i ? "bg-cat-blue/20 text-cat-blue" : ""}`}
            >
              {sg(val)}
            </span>
          )),
        )}
      </span>
      <span aria-hidden="true" className="h-10 w-1.5 rounded-r-sm border-y-2 border-r-2 border-foreground/60" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Four claims, each a small picture of checks (one · two
//     · five · a crossed-out one). The pick is acted out beside the empty
//     loom: that many checks drop in, a "?" hangs on them, and it is sealed.
//     The loom stays empty; BetCards opens it.

const B1_OPTS: [string, number, boolean][] = [
  ["1 টা চেক", 1, false],
  ["2 টা চেক", 2, false],
  ["5 টা চেক", 5, false],
  ["চেক দিয়ে অক্ষর হয়ই না", 1, true],
];

export function GamchaBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const act = usePlay(800);
  const seal = (i: number) => {
    setBet(i);
    act.play(3, () => pass("বাজি সিল হলো। আগে একটা চেক বুনি।"));
  };
  // beats of the acted bet: 1 the checks drop in, 2 the "?", 3 sealed
  const k = bet === null ? 0 : act.running ? act.k : 3;
  const pick = bet === null ? null : B1_OPTS[bet];
  return (
    <>
      <div className="mx-auto flex max-w-[20rem] items-center justify-center gap-3">
        <G_Loom7 sum={zeros(N7, N7)} label="খালি তাঁত, T এর দাগ কাটা; কয়টা চেক লাগবে জানা নাই" className="block h-auto w-36" />
        <div className="flex min-h-24 w-24 flex-col items-center justify-center gap-1">
          {pick && k >= 1 && (
            <span className={POP}>
              <G_Chips n={pick[1]} none={pick[2]} className="block h-8 w-auto" />
            </span>
          )}
          {pick && k >= 2 && <span className={`${POP} text-2xl font-extrabold text-cat-violet`}>?</span>}
        </div>
      </div>
      <div className="mt-1 h-5 text-center text-sm text-muted">{pick && k >= 1 ? <span className={FADE}>{pick[2] ? "চেক দিয়ে T? কোনোদিন না?" : `${pick[1]} টা চেক উপর উপর?`}</span> : "দাগ কাটা ঘরগুলো লাল হলে T।"}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {B1_OPTS.map(([o, n, none], i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            <span className="flex flex-col items-start gap-1 text-sm leading-tight">
              {bet === null && <G_Chips n={n} none={none} />}
              <span>{o}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={bet !== null && k >= 3}>T বুনতে কয়টা চেক লাগবে? একটায় বাজি ধরুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · One check on a 2 × 2 loom. The reader dials the row threads (left) and
//     the column threads (top), then weaves: the shuttle passes row by row
//     and each cell darkens by its row's thread × its column's thread. The
//     task is (1, 2) and (3, 4); any other threads weave too.

const OC_U = [1, 2];
const OC_V = [3, 4];

export function OneCheck() {
  const pass = useGate();
  const [u, setU] = useSeed("u", [1, 1]);
  const [v, setV] = useSeed("v", [1, 1]);
  const [woven, setWoven] = useSeed<{ u: number[]; v: number[] } | null>("woven", null);
  const p = usePlay(450);
  const hit = (w: { u: number[]; v: number[] } | null) => !!w && w.u.join() === OC_U.join() && w.v.join() === OC_V.join();
  const run = () => {
    const w = { u: [...u], v: [...v] };
    setWoven(w);
    p.play(4, () => {
      if (hit(w)) pass("এক column × এক row = পুরা একটা grid।");
    });
  };
  const setAt = (arr: number[], set: (a: number[]) => void, i: number) => (val: number) => set(arr.map((a, j) => (j === i ? val : a)));
  const stale = woven && (woven.u.join() !== u.join() || woven.v.join() !== v.join());
  const shown = woven ? (p.running ? p.k : 4) : 0;
  const g = woven ? outer(woven.u, woven.v) : zeros(2, 2);
  return (
    <>
      <svg viewBox="-38 -38 126 122" role="img" aria-label="2 × 2 এর তাঁত: বামে দুই row এর সুতা, উপরে দুই column এর সুতা; প্রতিটা ঘর = তার row এর সুতা × তার column এর সুতা" className="mx-auto block h-auto w-full max-w-[13rem]">
        <G_Weave g={g} u={woven && !p.running ? woven.u : u} v={woven && !p.running ? woven.v : v} c={40} max={16} shown={shown} dim={!!stale} />
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs text-muted">
        <div>
          পাশের সুতা, row ধরে
          <div className="mt-1 flex flex-col items-center gap-1">
            {u.map((a, i) => (
              <Stepper key={i} value={a} min={0} max={4} label={`row ${i + 1} এর সুতা`} disabled={p.running} onChange={setAt(u, setU, i)} />
            ))}
          </div>
        </div>
        <div>
          উপরের সুতা, column ধরে
          <div className="mt-1 flex flex-col items-center gap-1">
            {v.map((b, j) => (
              <Stepper key={j} value={b} min={0} max={4} label={`column ${j + 1} এর সুতা`} disabled={p.running} onChange={setAt(v, setV, j)} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button type="button" className={primaryBtn} disabled={p.running} onClick={run}>
          বুনুন
        </button>
        <span className="font-mono text-sm">
          <Tup v={u} of={U2} /> ⊗ <Tup v={v} of={V2} />
        </span>
      </div>
      {woven && !p.running && !hit(woven) && <div className={`${FADE} mt-2 text-center text-sm text-muted`}>বোনা হলো। এবার পাশে (1, 2), উপরে (3, 4) দিয়ে বুনুন।</div>}
      <Task done={hit(woven) && !p.running}>পাশের সুতা (1, 2), উপরের সুতা (3, 4) করে বুনুন। দেখুন প্রতিটা ঘর কত গাঢ় হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The same two lists into 4.1's box. Predict first (a grid · one number ·
//     two numbers, each a small picture). The run lays the loom's grid out,
//     fades the two cells whose threads don't match, and slides the matching
//     pair, 3 and 8, together into one number: 11.

const NG_OPTS = ["একটা grid, 4 টা ঘর", "একটা number", "দুইটা number"];
const NG_RIGHT = 1;
const NG_NOPE = [
  "Grid টা এসেছিল, কিন্তু dot product দুইটা ঘর ফেলে দিলো। বাকি দুইটা যোগ হয়ে একটা number হলো: 11।",
  "",
  "দুইটা number থাকলো না। 3 আর 8 যোগ হয়ে গেলো। Dot product শেষে সব যোগ করে, তাই একটা number।",
];

function NG_Icon({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 40 24" aria-hidden="true" className="block h-6 w-auto">
      {i === 0 && [0, 1, 2, 3].map((q) => <rect key={q} x={9 + (q % 2) * 11} y={1 + Math.floor(q / 2) * 11} width={10} height={10} rx={1.5} fill={RED} fillOpacity={0.3 + q * 0.18} />)}
      {i === 1 && <rect x={13} y={4} width={14} height={16} rx={2} fill="white" stroke={INK} strokeWidth={1.2} />}
      {i === 2 && [0, 1].map((q) => <rect key={q} x={5 + q * 16} y={4} width={14} height={16} rx={2} fill="white" stroke={INK} strokeWidth={1.2} />)}
    </svg>
  );
}

export function NumberOrGrid() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);
  const p = usePlay(900);
  const run = () => {
    if (p.running) return;
    p.play(4, () => {
      setRan(true);
      pass("Dot product এ একটা number। তাঁতে পুরা grid।");
    });
  };
  const beat = ran ? 4 : p.k;
  const g = outer(OC_U, OC_V);
  const c = 34;
  // the matching pair's resting places: their cells, then side by side under the grid, then one
  const at = (i: number): [number, number] => (beat >= 3 ? [c + (i === 0 ? -14 : 14) * (beat >= 4 ? 0 : 1), 2 * c + 30] : [(i + 0.5) * c, (i + 0.5) * c]);
  return (
    <>
      <svg viewBox="-34 -34 128 150" role="img" aria-label="(1, 2) আর (3, 4): তাঁতের grid এর কোনাকুনি দুই ঘর 3 আর 8 থাকে, বাকি দুইটা বাদ; 3 আর 8 যোগ হয়ে 11" className="mx-auto block h-auto w-full max-w-[9.5rem]">
        <G_Weave g={g} u={OC_U} v={OC_V} c={c} max={16} shown={beat >= 1 ? 4 : 0} skip={(i, j) => i === j} dim={beat >= 2} />
        {beat >= 1 &&
          [0, 1].map((i) => {
            const [x, y] = at(i);
            return (
              <g key={i} style={{ transform: `translate(${x}px, ${y}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
                {beat < 4 && <rect x={-c / 2 + 1} y={-c / 2 + 1} width={c - 2} height={c - 2} rx={2} fill={RED} fillOpacity={0.3 + (0.7 * g[i][i]) / 16} stroke={beat >= 2 ? OK : "none"} strokeWidth={2} />}
                {beat < 4 && (
                  <text y={5} textAnchor="middle" fontSize={14} fontFamily={MONO} fontWeight={700} fill={g[i][i] > 6 ? "white" : INK}>
                    {g[i][i]}
                  </text>
                )}
              </g>
            );
          })}
        {beat === 3 && (
          <text x={c} y={2 * c + 35} textAnchor="middle" fontSize={13} fontFamily={MONO} fontWeight={700} fill={INK} className={FADE}>
            +
          </text>
        )}
        {beat >= 4 && (
          <g className={POP}>
            <rect x={c - 18} y={2 * c + 16} width={36} height={28} rx={3} fill="white" stroke={INK} strokeWidth={1.6} />
            <text x={c} y={2 * c + 36} textAnchor="middle" fontSize={16} fontFamily={MONO} fontWeight={800} fill={INK}>
              11
            </text>
          </g>
        )}
      </svg>
      <div className="mt-1 h-5 text-center text-xs text-muted">
        {beat >= 4 ? "একটা number: 11." : beat >= 3 ? "মিলে যাওয়া জোড়া দুইটা এক জায়গায়।" : beat >= 2 ? "Dot product শুধু প্রথমের সাথে প্রথম, দ্বিতীয়র সাথে দ্বিতীয়।" : beat >= 1 ? "আগে তাঁতের মতো সব জোড়া।" : "(1, 2) আর (3, 4), dot product এর জন্য।"}
      </div>
      <div className="mt-2 grid gap-1.5">
        {NG_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, ran, NG_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="flex items-center gap-2.5 text-sm">
              <NG_Icon i={i} />
              {o}
            </span>
          </Choice>
        ))}
      </div>
      {guess !== null && !ran && (
        <div className="mt-3 flex justify-center">
          <button type="button" className={primaryBtn} disabled={p.running} onClick={run}>
            Dot product নিন
          </button>
        </div>
      )}
      {ran && guess !== null && guess !== NG_RIGHT && <Nope>{NG_NOPE[guess]}</Nope>}
      <Task done={ran}>আগে guess দিন। তারপর (1, 2) আর (3, 4) এর dot product নিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · One check, trying for T. Tap a thread's tab to make it dark (1) or
//     white (0); the cells follow at once. "মিলিয়ে দেখুন" sweeps the loom row
//     by row and rings every cell that doesn't match T in red. It never
//     matches: the screen passes after the first try.

const L4_NOPE = (n: number) => `${n} টা ঘর মিললো না। যে row এর সুতা গাঢ়, সেখানে উপরের গাঢ় সুতাগুলোর ছাঁদটাই বসে। সব row এ একই ছাঁদ।`;

const mismatch = (g: Grid): (boolean | null)[][] => g.map((r, i) => r.map((val, j) => (val === T[i][j] ? null : false)));
const misses = (g: Grid) => g.flat().filter((val, i) => val !== T.flat()[i]).length;

export function OneLayerIsPlain() {
  const pass = useGate();
  const [rows, setRows] = useSeed("rows", e7());
  const [cols, setCols] = useSeed("cols", e7());
  const [tries, setTries] = useSeed("tries", 0);
  const [judged, setJudged] = useSeed("judged", false);
  const p = usePlay(110);
  const sum = weave({ rows, cols });
  const flip = (arr: number[], set: (a: number[]) => void) => (i: number) => {
    if (p.running) return;
    setJudged(false);
    set(arr.map((a, j) => (j === i ? 1 - a : a)));
  };
  const check = () => {
    setJudged(true);
    p.play(N7, () => {
      setTries((t) => t + 1);
      if (tries === 0) pass("এক চেকে সব row একই ছাঁদের।");
    });
  };
  const shownRows = p.running ? p.k : N7;
  const ring = judged ? mismatch(sum).map((r, i) => (i < shownRows ? r : r.map(() => null))) : null;
  const n = misses(sum);
  return (
    <>
      <G_Loom7 rows={rows} cols={cols} sum={sum} ring={ring} onRow={flip(rows, setRows)} onCol={flip(cols, setCols)} label="7 × 7 এর তাঁত, এক চেক: বামে row এর সুতা, উপরে column এর সুতা, tap করলে গাঢ় বা সাদা; দাগ কাটা ঘরে T" />
      <div className="mt-1 h-5 text-center text-xs text-muted">বামের আর উপরের সুতার মাথায় tap করুন।</div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={p.running} onClick={check}>
          T এর সাথে মিলিয়ে দেখুন
        </button>
      </div>
      {judged && !p.running && n > 0 && <Nope key={tries}>{L4_NOPE(n)}</Nope>}
      <Task done={tries > 0}>এক চেকে T বানানোর চেষ্টা করুন। তারপর মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · 7.3's two lenses as two checks. W = [[0, 1], [1, 1]], Z = [[−1, 1],
//     [2, 1]]. W's column 1 goes to the left of the first check; the reader
//     picks which of Z's rows goes on top. Then W's column 2 with the other
//     row. The play weaves check 1, weaves check 2, lays them on each other
//     and rings each cell against G = [[2, 1], [1, 2]]. The wrong pairing
//     gives [[−1, 1], [1, 2]]: two red rings.

const W: Grid = [
  [0, 1],
  [1, 1],
];
const Z: Grid = [
  [-1, 1],
  [2, 1],
];
const G: Grid = [
  [2, 1],
  [1, 2],
];
const colOf = (m: Grid, j: number) => m.map((r) => r[j]);
const TL_NOPE = "দুই চেক মিলে G হলো না। লাল ঘরটা দেখুন। W এর column 1 এর জুড়ি হলো Z এর row 1। Column 2 এর জুড়ি row 2.";

export function TwoLayers() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const p = usePlay(900);
  const choose = (r: number) => {
    if (p.running) return;
    setPick(r);
    p.play(4, () => (r === 0 ? pass("দুই matrix এর গুণ = কয়েকটা চেকের যোগ।") : setMiss((m) => m + 1)));
  };
  const beat = pick === null ? 0 : p.running ? p.k : 4;
  const r1 = pick ?? 0;
  const r2 = 1 - r1;
  const c1 = outer(colOf(W, 0), Z[r1]);
  const c2 = outer(colOf(W, 1), Z[r2]);
  const s = addG(c1, c2);
  const ring = beat >= 4 ? s.map((r, i) => r.map((val, j) => val === G[i][j])) : null;
  const c = 24;
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <G_Mat g={W} name="W" hiCol={beat >= 1 ? (beat >= 2 ? 1 : 0) : undefined} />
        <G_Mat g={Z} name="Z" hiRow={pick === null ? undefined : beat >= 2 ? r2 : r1} />
        <span className="font-mono text-sm">=</span>
        <G_Mat g={G} name="G" />
      </div>
      <svg viewBox="-24 -26 242 80" role="img" aria-label="চেক 1 = W এর column 1 ⊗ Z এর একটা row; চেক 2 = W এর column 2 ⊗ বাকি row; দুইটা উপর উপর, ঘরে ঘরে যোগ; মিলিয়ে দেখা G এর সাথে" className="mx-auto mt-2 block h-auto w-full max-w-[18rem]">
        {beat >= 1 ? <G_Weave g={c1} u={colOf(W, 0)} v={Z[r1]} c={c} max={2} /> : <G_Weave g={zeros(2, 2)} c={c} />}
        <text x={2 * c + 12} y={c + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={INK}>
          +
        </text>
        {beat >= 2 ? <G_Weave g={c2} u={colOf(W, 1)} v={Z[r2]} x={2 * c + 44} c={c} max={2} /> : <G_Weave g={zeros(2, 2)} x={2 * c + 44} c={c} />}
        <text x={4 * c + 56} y={c + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={INK}>
          =
        </text>
        {beat >= 3 ? <G_Weave g={s} x={4 * c + 68} c={c} max={2} ring={ring} /> : <G_Weave g={zeros(2, 2)} x={4 * c + 68} c={c} />}
      </svg>
      <div className="mt-1 h-5 text-center text-xs text-muted">
        {beat >= 4 ? (pick === 0 ? "দুই চেক মিলে ঠিক G।" : "উপরের বামের ঘর মিললো না।") : beat >= 3 ? "দুই চেক উপর উপর: ঘরে ঘরে যোগ।" : beat >= 2 ? "চেক 2: W এর column 2, Z এর বাকি row।" : beat >= 1 ? "চেক 1: W এর column 1 পাশে।" : "নীল ঘর মানে minus।"}
      </div>
      {(pick === null || (pick !== 0 && !p.running)) && <div className="mt-2 text-sm font-medium text-muted">W এর column 1 এর সাথে, উপরে Z এর কোন row?</div>}
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {[0, 1].map((r) => (
          <Choice
            key={r}
            n={r}
            look={pick === r && !p.running ? (r === 0 ? "right" : "wrong") : "idle"}
            disabled={p.running || pick === 0}
            onClick={() => choose(r)}
          >
            <span className="flex flex-col text-sm leading-tight">
              <span>Z এর row {r + 1}</span>
              <span className="font-mono whitespace-nowrap">({Z[r].map(sg).join(", ")})</span>
            </span>
          </Choice>
        ))}
      </div>
      {pick === 1 && !p.running && <Nope key={miss}>{TL_NOPE}</Nope>}
      <Task done={pick === 0 && !p.running}>W এর column দুইটা আর Z এর row দুইটা দিয়ে দুইটা চেক বুনুন। যোগ করে G ওঠে কিনা দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn: weave T. Up to three checks, each with its own threads; the
//     loom shows them all on each other (a cell two checks hit goes deeper).
//     "মিলিয়ে দেখুন" sweeps row by row and rings the misses. Passes on a match.

const YL_TWO = "T উঠলো। দুই রকম row, দুই চেক।";
const YL_MORE = "T উঠলো। তবে 2 চেকেই হয়।";
const YL_TRIES_NOPE = (n: number) => `${n} টা ঘর মিললো না। লাল দাগ দেখুন। দুই চেক একই ঘরে পড়লে ঘর দ্বিগুণ গাঢ় হয়, সেটাও ভুল।`;

export function YourLetter() {
  const pass = useGate();
  const [layers, setLayers] = useSeed<Check[]>("layers", [EMPTY, EMPTY, EMPTY]);
  const [now, setNow] = useSeed("now", 0);
  const [tries, setTries] = useSeed("tries", 0);
  const [judged, setJudged] = useSeed("judged", false);
  const p = usePlay(110);
  const used = layers.filter((l) => l.rows.some(Boolean) && l.cols.some(Boolean)).length;
  const sum = pile(layers);
  const done = judged && !p.running && sameG(sum, T);
  const edit = (key: "rows" | "cols") => (i: number) => {
    if (p.running || done) return;
    setJudged(false);
    setLayers(layers.map((l, n) => (n === now ? { ...l, [key]: l[key].map((a, j) => (j === i ? 1 - a : a)) } : l)));
  };
  const check = () => {
    setJudged(true);
    const ok = sameG(sum, T);
    const count = used;
    p.play(N7, () => {
      setTries((t) => t + 1);
      if (ok) pass(count === 2 ? YL_TWO : YL_MORE);
    });
  };
  const shownRows = p.running ? p.k : N7;
  const ring = judged ? mismatch(sum).map((r, i) => (i < shownRows ? r : r.map(() => null))) : null;
  const cur = layers[now];
  return (
    <>
      <G_Loom7 rows={cur.rows} cols={cur.cols} sum={sum} ring={ring} onRow={edit("rows")} onCol={edit("cols")} label="7 × 7 এর তাঁত, তিনটা চেক পর্যন্ত: যে চেক বাছাই করা, তার সুতা বামে আর উপরে; ঘরে সব চেক উপর উপর" />
      <div className="mt-2 flex justify-center gap-2">
        {layers.map((l, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setNow(i)}
            disabled={p.running}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl border-2 px-2 py-1 text-xs font-semibold transition-colors motion-reduce:transition-none ${now === i ? "border-cat-blue bg-cat-blue/10" : "border-border"}`}
          >
            <svg viewBox="0 0 7 7" aria-hidden="true" className="size-5 rounded-sm bg-[#fefce8]">
              {weave(l).map((r, a) => r.map((val, b) => (val ? <rect key={`${a}${b}`} x={b} y={a} width={1} height={1} fill={RED} /> : null)))}
            </svg>
            চেক {i + 1}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" className={primaryBtn} disabled={p.running || done} onClick={check}>
          T এর সাথে মিলিয়ে দেখুন
        </button>
      </div>
      {judged && !p.running && !sameG(sum, T) && <Nope key={tries}>{YL_TRIES_NOPE(misses(sum))}</Nope>}
      <Task done={done}>চেক বেছে নিয়ে তার সুতা গাঢ় করুন। T বুনুন, যত কম চেকে পারেন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it: Rina's old গামছা, a 3 × 3 check. Three thread pairs, each a
//     small picture of its tabs. A pick weaves its own check beside the old
//     one, cell by cell, and rings every cell against it. The swapped pair
//     weaves the old check turned on its side; the near pair gets one column
//     wrong.

const TW_U = [2, 0, 1];
const TW_V = [1, 2, 1];
const TW_OLD = outer(TW_U, TW_V);
const TW_OPTS: [number[], number[]][] = [
  [TW_V, TW_U],
  [TW_U, TW_V],
  [TW_U, [1, 1, 2]],
];
const TW_RIGHT = 1;
const TW_NOPE = [
  "গামছাটা কাত হয়ে গেলো: row গুলো column হয়ে বসেছে। পাশের সুতা আর উপরের সুতা অদলবদল হয়ে আছে।",
  "",
  "প্রথম row টা দেখুন। পুরানো গামছায় মাঝের ঘর সবচেয়ে গাঢ়। এখানে ডানের ঘর। উপরের সুতা মিলছে না।",
];

function TW_Pic({ u, v }: { u: readonly number[]; v: readonly number[] }) {
  return (
    <svg viewBox="-16 -16 58 58" aria-hidden="true" className="block h-16 w-auto">
      <G_Weave g={zeros(3, 3)} u={u} v={v} c={13} />
    </svg>
  );
}

export function TryWhichThreads() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const p = usePlay(160);
  const choose = (i: number) => {
    if (p.running || pick === TW_RIGHT) return;
    setPick(i);
    p.play(9, () => (i === TW_RIGHT ? pass("(2, 0, 1) পাশে, (1, 2, 1) উপরে।") : setMiss((m) => m + 1)));
  };
  const shown = pick === null ? 0 : p.running ? p.k : 9;
  const opt = pick === null ? null : TW_OPTS[pick];
  const g = opt ? outer(opt[0], opt[1]) : zeros(3, 3);
  const ring = opt && !p.running ? g.map((r, i) => r.map((val, j) => val === TW_OLD[i][j])) : null;
  const c = 26;
  return (
    <>
      <svg viewBox="-26 -26 232 108" role="img" aria-label="বামে রিনার পুরানো গামছার চেক, 3 × 3; ডানে বাছাই করা সুতায় বোনা চেক" className="mx-auto block h-auto w-full max-w-[19rem]">
        <G_Weave g={TW_OLD} c={c} max={4} />
        <text x={1.5 * c} y={3 * c + 14} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
          পুরানো গামছা
        </text>
        {opt ? <G_Weave g={g} u={opt[0]} v={opt[1]} x={3 * c + 50} c={c} max={4} shown={shown} ring={ring} /> : <G_Weave g={zeros(3, 3)} x={3 * c + 50} c={c} />}
        <text x={4.5 * c + 50} y={3 * c + 14} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
          নতুন বোনা
        </text>
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {TW_OPTS.map(([u, v], i) => (
          <Choice
            key={i}
            n={i}
            look={pick === i && !p.running ? (i === TW_RIGHT ? "right" : "wrong") : "idle"}
            disabled={p.running || pick === TW_RIGHT}
            onClick={() => choose(i)}
          >
            <TW_Pic u={u} v={v} />
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== TW_RIGHT && !p.running && <Nope key={miss}>{TW_NOPE[pick]}</Nope>}
      <Task done={pick === TW_RIGHT && !p.running}>কোন জোড়া সুতায় রিনার পুরানো গামছা বোনা? বেছে নিন, তাঁতে বুনে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The bet opened on Nana's গামছা. Four cards; a tap weaves that card's
//     checks one by one onto the letter's square (1: the bar only; 2: bar,
//     then stem; 5: the bar and the stem cell by cell; "হয়ই না": two checks,
//     and there it is), then marks the card.

const ONE_CELL = (r: number): Check => ({ rows: e7(r), cols: e7(3) });
const BC_CARDS: [string, Check[], boolean, string][] = [
  ["1 টা চেক", [BAR], false, "এক চেকে শুধু মাথার দাগ। খুঁটি নাই।"],
  ["2 টা চেক", [BAR, STEM], true, "মাথার দাগ, তারপর খুঁটি। T."],
  ["5 টা চেক", [BAR, ONE_CELL(2), ONE_CELL(3), ONE_CELL(4), ONE_CELL(5)], false, "5 টাতেও ওঠে। কিন্তু লাগে 2 টাই।"],
  ["চেক দিয়ে অক্ষর হয়ই না", [BAR, STEM], false, "হয়। দুই চেকেই উঠলো।"],
];

export function BetCards() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [now, setNow] = useState<number | null>(null);
  const p = usePlay(650);
  const tap = (i: number) => {
    if (p.running || open.includes(i)) return;
    setNow(i);
    p.play(BC_CARDS[i][1].length, () => {
      const next = [...open, i];
      setOpen(next);
      if (next.length === BC_CARDS.length) pass("দুই চেক, এক অক্ষর।");
    });
  };
  const showing = now ?? (open.length ? open[open.length - 1] : null);
  const layers = showing === null ? [] : BC_CARDS[showing][1].slice(0, p.running ? p.k : undefined);
  return (
    <>
      <div className="mx-auto w-44 rounded-lg bg-[#15803d] p-2">
        <G_Loom7 sum={pile(layers)} outline={false} label="নানার গামছার কোণা: বাছাই করা card এর চেক গুলো একটা একটা করে বোনা হয়" className="block h-auto w-full rounded" />
      </div>
      <div className="mt-1 text-center text-xs text-muted">{showing === null ? "একটা card tap করুন।" : `চেক: ${layers.length} টা`}</div>
      <div className="mt-2 grid gap-1.5">
        {BC_CARDS.map(([t, , ok, line], i) => {
          const shown = open.includes(i);
          return (
            <button
              key={t}
              type="button"
              onClick={() => tap(i)}
              disabled={p.running || shown}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-1.5 text-left text-sm transition-colors duration-300 disabled:cursor-default motion-reduce:transition-none ${
                shown ? (ok ? "border-accent bg-accent/10" : "border-border opacity-70") : now === i && p.running ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <span>
                <span className="font-semibold">{t}</span>
                {shown && <span className={`${FADE} block text-xs text-muted`}>{line}</span>}
              </span>
              {shown ? <G_Mark ok={ok} className="size-5 shrink-0" /> : <span className="text-xs text-muted">খুলুন</span>}
            </button>
          );
        })}
      </div>
      <Task done={open.length === BC_CARDS.length}>চারটা বাজি একটা একটা করে খুলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The finale's widget: Article 7's five things, as five cards. A tap
//     turns a card over; its little picture draws itself.

const FT_THINGS: [string, string][] = [
  ["Ax দুইভাবে", "Ax মানে A এর column গুলো x এর মাপে হাঁটা। আবার প্রতিটা row এর সাথে x এর dot product। একই হিসাব, দুই রকম গোছানো।"],
  ["Shape এর নিয়ম", "(m × n)(n × p) → (m × p). ভেতরের দুইটা মিলতে হবে, তারপর গায়েব।"],
  ["AB মানে আগে B", "AB মানে দুই move পরপর: আগে B, তারপর A। তাই সাধারণত AB\u00a0≠\u00a0BA।"],
  ["Column space", "Ax যেখানেই যাক, থাকে A এর column গুলোর span এ। Column এক লাইনে থাকলে একটা দিক পুরাই হারায়।"],
  ["Layer জোড়া লাগে", "W₂(W₁x) = (W₂W₁)x. মাঝে বাঁক না থাকলে 50 layer আসলে 1 টা।"],
];

/** a small picture per thing, drawn when its card opens */
function FT_Pic({ i }: { i: number }) {
  const d = [
    "M4 26l12 -6M16 20l8 -12M4 26l20 -18",
    "M3 8h10v16h-10ZM15 8h14v10h-14Z",
    "M4 16h8M20 16h8M12 10h8v12h-8Z",
    "M4 28L28 4",
    "M4 6h4v20h-4ZM10 6h4v20h-4ZM20 16h8",
  ][i];
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0">
      <Draw d={d} ms={700} strokeWidth={2} className={["stroke-[#b45309]", "stroke-[#0d9488]", "stroke-[#7c3aed]", "stroke-[#2563eb]", "stroke-[#dc2626]"][i]} />
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
    if (next.length === FT_THINGS.length) pass("Article 7 এর পাঁচটা কথা।");
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
// Story scenes. The veranda at night (a post, the roof's edge, the floor),
// Nana's old তাঁত, a হারিকেন.

function G_Veranda() {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={24} width={320} height={6} fill="#57534e" />
      <path d="M0 24L20 14H300L320 24Z" fill="#78716c" />
      <rect x={8} y={30} width={7} height={120} fill="#a16207" />
      <rect x={305} y={30} width={7} height={120} fill="#a16207" />
      <rect x={0} y={150} width={320} height={30} fill="#a8a29e" />
      <path d="M0 150H320" stroke="#78716c" strokeWidth={1} />
    </g>
  );
}

/** the হারিকেন, base at (x, y): a warm glow, the glass, the flame; `low` when the oil is nearly gone */
function G_Lamp({ x, y, low = false }: { x: number; y: number; low?: boolean }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y - 14} r={low ? 14 : 26} fill="#fde68a" opacity={low ? 0.1 : 0.16} />
      <rect x={x - 6} y={y - 4} width={12} height={4} rx={1} fill="#b91c1c" />
      <path d={`M${x - 5} ${y - 4}q-2 -8 0 -16h10q2 8 0 16Z`} fill="#fef9c3" fillOpacity={0.8} stroke="#b91c1c" strokeWidth={0.8} />
      <path d={`M${x} ${y - 8}q-2.5 -3 0 ${low ? -4 : -7}q2.5 3 0 ${low ? 4 : 7}`} fill="#f97316" />
      <path d={`M${x - 6} ${y - 20}h12M${x} ${y - 20}v-4`} stroke="#b91c1c" strokeWidth={1.2} />
    </g>
  );
}

/**
 * Nana's তাঁত, feet at (x, y): two posts, the top beam, the long threads
 * running down to the cloth, the cloth rolled at the front. `cloth` is how
 * much cloth there is (0–1); `letter` puts a small T in its corner.
 */
function G_Loom({ x, y, cloth = 0.5, letter = false }: { x: number; y: number; cloth?: number; letter?: boolean }) {
  const top = y - 72;
  const front = y - 30;
  const h = 4 + 14 * cloth;
  let warp = "";
  for (let i = 0; i <= 12; i += 1) warp += `M${x - 30 + i * 5} ${top + 4}V${front - h}`;
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 40} ${y}V${top}M${x + 40} ${y}V${top}`} stroke="#78350f" strokeWidth={4} />
      <rect x={x - 42} y={top - 3} width={84} height={6} rx={2} fill="#92400e" />
      <path d={warp} stroke="#fca5a5" strokeWidth={0.8} />
      <rect x={x - 32} y={front - h} width={64} height={h} fill={GREEN} />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M${x - 32 + 5 + i * 11} ${front - h}v${h}`} stroke={RED} strokeWidth={2} />
      ))}
      {h > 10 && <path d={`M${x - 32} ${front - h + 5}h64`} stroke={RED} strokeWidth={2} />}
      {letter && <path d={`M${x + 16} ${front - h + 3}h9M${x + 20.5} ${front - h + 3}v8`} stroke={CREAM} strokeWidth={1.6} className={POP} />}
      <rect x={x - 36} y={front} width={72} height={5} rx={2} fill="#92400e" />
      <path d={`M${x - 36} ${y}l6 -25M${x + 36} ${y}l-6 -25`} stroke="#78350f" strokeWidth={3} />
    </g>
  );
}

/** Som's paper, centred at (x, y): a big T in red */
function G_Paper({ x, y }: { x: number; y: number }) {
  return (
    <g className={POP}>
      <rect x={x - 11} y={y - 13} width={22} height={26} rx={1} fill="white" stroke="#a8a29e" strokeWidth={0.6} />
      <path d={`M${x - 7} ${y - 7}h14M${x} ${y - 7}v15`} stroke={RED} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

// 1a · The veranda at night. Nana at his loom, the হারিকেন on the floor, Rina
//      holding the red and green threads. Som walks up with his paper T and
//      asks; Nana answers without looking up; Nasib has his say.

export function LoomNight({}: Story) {
  const s = useScene(5, [600, 1600, 2200, 2400, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="বিয়ের রাত, বারান্দায় নানার তাঁত, পাশে হারিকেন; রিনা লাল আর সবুজ সুতার গোছা ধরে আছে; সোম একটা কাগজে বড় করে T নিয়ে এলো, গামছায় বুনে দিতে বললো; নানা চোখ না তুলে বললেন একবারে একটা চেকই ওঠে, দুই-তিনটা উপর উপর বসাইলে যা খুশি উঠে; নাসিব বললো চেক দিয়ে অক্ষর কোনোদিন হয় না">
        <G_Veranda />
        <G_Lamp x={32} y={150} />
        <G_Loom x={104} y={150} cloth={0.6} />
        <Person who="rina" x={52} y={150} arm="hold" label />
        <path d="M60 107l6 4M62 105l6 5" stroke={RED} strokeWidth={2} />
        <path d="M61 110l6 4" stroke={GREEN} strokeWidth={2} />
        <Person who="nana" x={160} y={150} facing={-1} arm="hold" label />
        <Person who="som" x={k >= 1 ? 214 : 360} y={150} facing={-1} walking={k === 1} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 1 && <G_Paper x={200} y={104} />}
        <Person who="nasib" x={276} y={150} facing={-1} label />
        {k === 2 && <Bubble x={214} y={84} side="left" lines={["নানা, গামছায়", "এইটা বুনে দেন।"]} />}
        {k === 3 && <Bubble x={160} y={84} lines={["একবারে একটা", "চেকই ওঠে।"]} />}
        {k === 4 && <Bubble x={160} y={84} lines={["দুই-তিনটা উপর উপর", "বসাইলে যা খুশি উঠে।"]} />}
        {k >= 5 && <Bubble x={276} y={84} side="left" lines={["চেক দিয়ে অক্ষর?", "কোনোদিন হয় না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · Nana stops, takes two threads from Rina: one pulled across, one from
//      top to bottom. Where they lie on each other, the colour is deeper. His
//      one line.

export function NanaTwoThreads({}: Story) {
  const s = useScene(4, [600, 1400, 1400, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="নানা রিনার হাত থেকে দুইটা সুতা নিলেন; একটা পাশে টানলেন, আরেকটা উপর থেকে নিচে; যেখানে দুইটা একটার উপর আরেকটা পড়লো, সেখানে রং গাঢ়; নানা বললেন দুই সুতা যত গাঢ়, ঘর তত গাঢ়">
        <G_Veranda />
        <G_Lamp x={32} y={150} />
        <Person who="rina" x={62} y={150} label />
        <Person who="nana" x={112} y={150} arm={k >= 1 ? "hold" : "down"} label />
        {/* the cloth up close */}
        <rect x={170} y={42} width={110} height={96} rx={3} fill={CREAM} stroke="#a8a29e" />
        {k >= 1 && <Draw d="M170 76H280" strokeWidth={6} className="stroke-[#dc2626]/70" />}
        {k >= 2 && <Draw d="M236 42V138" strokeWidth={6} className="stroke-[#dc2626]/70" />}
        {k >= 3 && <rect x={233} y={73} width={6} height={6} fill={MAROON} className={POP} />}
        {k >= 3 && <circle cx={236} cy={76} r={10} fill="none" stroke="#fde047" strokeWidth={1.4} className={POP} />}
        {k >= 4 && <Bubble x={112} y={84} side="right" lines={["দুই সুতা যত গাঢ়,", "ঘর তত গাঢ়।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Nasib steps up to the loom: his line. Nana says nothing and moves aside.

export function NasibAtLoom({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="নাসিব তাঁতের সামনে এসে দাঁড়ালো, বললো দেখি এক চেকে T ওঠে কিনা; নানা কিছু বললেন না, সরে দাঁড়ালেন">
        <G_Veranda />
        <G_Lamp x={32} y={150} />
        <G_Loom x={104} y={150} cloth={0.6} />
        <Person who="nana" x={k >= 3 ? 220 : 160} y={150} facing={-1} walking={k === 3} label />
        <Person who="nasib" x={k >= 1 ? 160 : 280} y={150} facing={-1} walking={k === 1} arm={k >= 2 ? "hold" : "down"} label />
        {k === 2 && <Bubble x={160} y={84} side="right" lines={["দেখি এক চেকে", "T ওঠে কিনা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

/** Samin's phone, bottom-centre at (x, y), the light machine's app open: two 2 × 2 grids, W and Z */
function G_Phone({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <g>
      <rect x={x - 14} y={y - 26} width={28} height={26} rx={3} fill="#1e293b" />
      <rect x={x - 12} y={y - 24} width={24} height={22} rx={1.5} fill={on ? "#0f172a" : "#334155"} />
      {on &&
        [0, 1].map((m) => (
          <g key={m} className={FADE}>
            {[0, 1, 2, 3].map((q) => (
              <rect key={q} x={x - 10 + m * 11 + (q % 2) * 4.5} y={y - 18 + Math.floor(q / 2) * 4.5} width={4} height={4} fill={m ? "#60a5fa" : "#fbbf24"} opacity={0.5 + 0.15 * q} />
            ))}
            <text x={x - 6 + m * 11} y={y - 4} textAnchor="middle" fontSize={4} fontFamily={MONO} fill="#e2e8f0">
              {m ? "Z" : "W"}
            </text>
          </g>
        ))}
    </g>
  );
}

// 5a · Samin, who has been watching, takes out his phone: the light machine's
//      app still has last night's two lenses saved, W and Z. His two lines.

export function SaminLenses({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="সামিন ফোন বের করলো; লাইট ভাইয়ের app এ কালকের দুইটা lens এখনো save করা, W আর Z; সামিন বললো কালকের lens দুইটাও তো grid, ওদের গুণও কি চেক দিয়ে হয়">
        <G_Veranda />
        <G_Lamp x={32} y={150} />
        <G_Loom x={104} y={150} cloth={0.7} />
        <Person who="nana" x={160} y={150} facing={-1} arm="hold" label />
        <Person who="samin" x={236} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 1 && <G_Phone x={250} y={112} on />}
        {k === 2 && <Bubble x={236} y={80} side="left" lines={["কালকের lens দুইটাও", "তো grid."]} />}
        {k >= 3 && <Bubble x={236} y={80} side="left" lines={["ওদের গুণও কি", "চেক দিয়ে হয়?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · Rina opens Nana's trunk and takes out an old গামছা: a small 3 × 3
//      check. Her question; Nana's answer.

export function RinaTrunk({}: Story) {
  const s = useScene(4, [600, 1400, 1600, 2400, 2000]);
  const k = s.k;
  const cloth = TW_OLD;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রিনা নানার ট্রাঙ্ক খুলে একটা পুরানো গামছা বের করলো, ছোট একটা চেক, তিন row তিন column; রিনা জিজ্ঞেস করলো এইটা কোন সুতায়; নানা বললেন তুই বল">
        <G_Veranda />
        <G_Lamp x={32} y={150} />
        <Chest x={100} y={150} open={k >= 1} />
        <Person who="rina" x={130} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} label />
        <Person who="nana" x={220} y={150} facing={-1} label />
        {k >= 2 && (
          <g className={POP}>
            {cloth.map((r, i) =>
              r.map((val, j) => <rect key={`${i}${j}`} x={140 + j * 9} y={92 + i * 9} width={9} height={9} fill={val ? RED : CREAM} fillOpacity={val ? 0.25 + val * 0.18 : 1} stroke="#a8a29e" strokeWidth={0.3} />),
            )}
          </g>
        )}
        {k === 3 && <Bubble x={130} y={84} side="right" lines={["নানা, এইটা", "কোন সুতায়?"]} />}
        {k >= 4 && <Bubble x={220} y={84} side="left" lines={["তুই বল।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 8a · Four at dawn. The lamp almost out; Som asleep against the post; Nasib
//      awake. Nana pulls the last thread, cuts the cloth off the loom, folds it
//      once. No words.

export function NanaDawn({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="ভোর চারটা, হারিকেনের তেল প্রায় শেষ; সোম খুঁটিতে হেলান দিয়ে ঘুমিয়ে; নাসিব জেগে; নানা শেষ সুতাটা টানলেন, গামছাটা কেটে নিলেন, একবার ভাঁজ করলেন">
        <G_Veranda />
        <G_Lamp x={34} y={150} low />
        <G_Loom x={110} y={150} cloth={k >= 2 ? 0 : 1} letter={k === 1} />
        <Person who="som" x={290} y={150} facing={-1} label />
        <text x={276} y={78} fontSize={8} fill="#57534e">
          z z
        </text>
        <Person who="nasib" x={236} y={150} facing={-1} label />
        <Person who="nana" x={170} y={150} facing={-1} arm={k >= 2 ? "hold" : k >= 1 ? "point" : "down"} label />
        {k >= 2 && (
          <g className={POP}>
            <rect x={k >= 3 ? 146 : 136} y={110} width={k >= 3 ? 16 : 30} height={10} fill={GREEN} stroke={MAROON} strokeWidth={0.5} />
            <path d={`M${k >= 3 ? 150 : 142} 110v10`} stroke={RED} strokeWidth={1.5} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

/** the decorated car, its front bumper at (x, y): Apa and the বর in the window, the গামছা on his shoulder */
function G_Car({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 96} ${y - 8}v-18q0 -4 4 -5l16 -2l14 -16h40l14 16h6q4 1 4 5v20Z`} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
      <path d={`M${x - 70} ${y - 33}l12 -13h36l10 13Z`} fill="#bae6fd" />
      {/* Apa: a head under a red orna */}
      <circle cx={x - 54} cy={y - 38} r={4} fill="#c68642" />
      <path d={`M${x - 59} ${y - 37}q5 -10 10 0`} fill={RED} />
      {/* the বর: a টোপর, and Nana's গামছা on his shoulder */}
      <circle cx={x - 36} cy={y - 37} r={4} fill="#c68642" />
      <path d={`M${x - 40} ${y - 40}l4 -8l4 8Z`} fill="#fde047" />
      <path d={`M${x - 42} ${y - 33}h12`} stroke={GREEN} strokeWidth={3} />
      <path d={`M${x - 38} ${y - 33}v0.1M${x - 34} ${y - 33}v0.1`} stroke={RED} strokeWidth={3} strokeLinecap="round" />
      <circle cx={x - 76} cy={y - 6} r={7} fill="#1f2937" />
      <circle cx={x - 18} cy={y - 6} r={7} fill="#1f2937" />
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx={x - 88 + i * 13} cy={y - 26} r={2.2} fill={["#f97316", "#facc15", "#ef4444"][i % 3]} />
      ))}
    </g>
  );
}

// 9a · বিদায়। Morning; the car at the gate, Apa and the বর inside, the গামছা
//      on his shoulder. The light machine still throws its pattern on the
//      wall, faint in daylight. The car goes. Nana stays at the gate.

export function Bidai({}: Story) {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;
  const carX = k >= 2 ? 460 : k >= 1 ? 300 : 250;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সকাল, গেটে ফুল দিয়ে সাজানো গাড়ি; আপা আর বর ভেতরে, বরের কাঁধে নানার গামছা; দেয়ালে light machine তখনো চলছে, নকশা আবছা; গাড়ি চলে গেলো; নানা গেটে দাঁড়িয়ে রইলেন">
        {/* the house wall, with the light machine's faint pattern still on it */}
        <rect x={0} y={40} width={70} height={110} fill="#f5f5f4" stroke="#d6d3d1" />
        <g opacity={0.35}>
          {[0, 1, 2].map((i) => (
            <path key={`${i}${k}`} d={`M${12 + i * 16} ${60 + (k % 2) * 6}l14 ${10 - i * 3}l-10 20Z`} fill={["#f472b6", "#facc15", "#60a5fa"][(i + k) % 3]} className={FADE} />
          ))}
        </g>
        <rect x={48} y={128} width={6} height={22} fill="#57534e" />
        <path d="M51 128l-14 -40" stroke="#fde047" strokeOpacity={0.3} strokeWidth={6} />
        {/* the gate: two pillars and a string of marigolds */}
        <rect x={100} y={70} width={8} height={80} fill="#d6d3d1" />
        <rect x={150} y={70} width={8} height={80} fill="#d6d3d1" />
        <path d="M104 74Q129 88 154 74" fill="none" stroke="#f97316" strokeWidth={2.6} strokeDasharray="0.1 4" strokeLinecap="round" />
        <Person who="nana" x={124} y={150} facing={1} />
        <text x={124} y={161} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
          নানা
        </text>
        <g style={{ transform: `translateX(${carX - 250}px)` }} className="transition-transform duration-[1600ms] ease-in motion-reduce:transition-none">
          <G_Car x={290} y={150} />
        </g>
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The stake: the empty loom, Som's paper T laid next to it, dawn coming.
//      Stopped at "?".

const X1_SAY = ["নানার তাঁত। এখনো খালি।", "সোমের কাগজ: T।", "ভোরে বিদায়। তার আগে গামছা।", "কয়টা চেক? বাজি শেষে খুলবে।"];

export function EmptyLoom() {
  const s = useScene(3, [600, 1400, 1800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <svg viewBox="0 0 240 100" role="img" aria-label="খালি তাঁত, পাশে T লেখা কাগজ, ভোরের আগে; কয়টা চেক, ?" className="mx-auto block h-auto w-full max-w-[16rem] rounded-lg bg-[#1e293b]">
        <G_Loom x={70} y={96} cloth={0} />
        {k >= 1 && <G_Paper x={140} y={60} />}
        {k >= 2 && (
          <g className={FADE}>
            <circle cx={210} cy={30} r={12} fill="#fdba74" opacity={0.8} />
            <path d="M190 42h40" stroke="#fdba74" strokeWidth={1} />
          </g>
        )}
        {k >= 3 && (
          <text x={176} y={70} textAnchor="middle" fontSize={24} fontWeight={800} fill="#fde047" className={POP}>
            ?
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · A bigger loom: three row threads, four column threads. The rows go
//      in, then the columns; every crossing darkens; 3 × 4 lands, then the
//      name.

const X2_U = [1, 2, 1];
const X2_V = [2, 1, 0, 2];
const X2_SAY = ["পাশে 3 টা সুতা।", "উপরে 4 টা।", "প্রতিটা মোড়ে একটা গুণ। 12 টা ঘর।", "3 টা আর 4 টা: 3 × 4 এর grid। u ⊗ v, outer product."];

export function ThreadsCross() {
  const s = useScene(3, [600, 1200, 1400, 2400]);
  const k = s.k;
  const c = 22;
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <svg viewBox="-22 -22 118 104" role="img" aria-label="পাশে 3 টা সুতা, উপরে 4 টা; প্রতিটা মোড়ে গুণ; 3 × 4 এর grid" className="mx-auto block h-auto w-full max-w-[13rem]">
        <G_Weave g={outer(X2_U, X2_V)} u={X2_U} v={k >= 1 ? X2_V : undefined} c={c} max={4} shown={k >= 2 ? 12 : 0} nums={false} />
        {k >= 3 && (
          <text x={2 * c} y={3 * c + 14} textAnchor="middle" fontSize={9} fontFamily={MONO} fontWeight={700} fill={INK} className={FADE}>
            3 × 4
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 3½ · Inner and outer, as shapes. A lying row times a standing column: one
//      number. A standing column times a lying row: a grid. 7.5's shape rule
//      under each.

const X3_SAY = [
  "একই দুইটা list। শুধু কে শোয়া, কে দাঁড়ানো।",
  "শোয়া row আগে, দাঁড়ানো column পরে: uᵀv।",
  "(1 × 2)(2 × 1) → 1 × 1. একটা number.",
  "দাঁড়ানো আগে, শোয়া পরে: uvᵀ।",
  "(2 × 1)(1 × 2) → 2 × 2. পুরা grid।",
];

function X3_Cells({ x, y, v, down }: { x: number; y: number; v: number[]; down: boolean }) {
  return (
    <g>
      {v.map((n, i) => (
        <g key={i}>
          <rect x={x + (down ? 0 : i * 17)} y={y + (down ? i * 17 : 0)} width={16} height={16} rx={2} fill="white" stroke={INK} strokeWidth={0.9} />
          <text x={x + (down ? 0 : i * 17) + 8} y={y + (down ? i * 17 : 0) + 11.5} textAnchor="middle" fontSize={10} fontFamily={MONO} fontWeight={700} fill={INK}>
            {n}
          </text>
        </g>
      ))}
    </g>
  );
}

function X3_To({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y}h11`} stroke={INK} strokeWidth={1.2} />
      <path d={`M${x + 12} ${y}l-3.5 -2.4v4.8Z`} fill={INK} />
    </g>
  );
}

export function InnerOuter() {
  const s = useScene(4, [600, 1600, 2200, 1600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <svg viewBox="0 0 236 88" role="img" aria-label="শোয়া row গুণ দাঁড়ানো column: একটা number 11; দাঁড়ানো column গুণ শোয়া row: 2 × 2 এর grid" className="mx-auto block h-auto w-full max-w-[18rem]">
        <g opacity={k >= 3 ? 0.4 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
          <X3_Cells x={2} y={32} v={[1, 2]} down={false} />
          <X3_Cells x={40} y={23} v={[3, 4]} down />
          {k >= 1 && (
            <g className={POP}>
              <X3_To x={62} y={40} />
              <rect x={80} y={29} width={24} height={22} rx={2} fill="white" stroke={INK} strokeWidth={1.5} />
              <text x={92} y={44.5} textAnchor="middle" fontSize={11} fontFamily={MONO} fontWeight={800} fill={INK}>
                11
              </text>
            </g>
          )}
          {k >= 2 && (
            <text x={54} y={80} textAnchor="middle" fontSize={10} fontFamily={MONO} fontWeight={700} fill={INK} className={FADE}>
              1 × 1
            </text>
          )}
        </g>
        {k >= 3 && (
          <g className={FADE}>
            <X3_Cells x={124} y={23} v={[1, 2]} down />
            <X3_Cells x={143} y={4} v={[3, 4]} down={false} />
            <X3_To x={180} y={40} />
            <G_Weave g={outer([1, 2], [3, 4])} x={198} y={23} c={17} max={16} />
          </g>
        )}
        {k >= 4 && (
          <text x={180} y={80} textAnchor="middle" fontSize={10} fontFamily={MONO} fontWeight={700} fill={INK} className={FADE}>
            2 × 2
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · One check, row by row. The column threads' pattern lights on top;
//      then each row lights in turn: a copy, an empty row, a deeper copy.

const X4_U = [1, 0, 2, 1, 0];
const X4_V = [0, 1, 1, 0, 1];
const X4_SAY = [
  "একটা চেক, 5 × 5।",
  "উপরের সুতার ছাঁদ: খালি, গাঢ়, গাঢ়, খালি, গাঢ়।",
  "Row 1: সেই ছাঁদ।",
  "Row 2: সুতা সাদা, row খালি।",
  "Row 3: একই ছাঁদ, দ্বিগুণ গাঢ়।",
  "সব row একই ছাঁদের। আলাদা ছাঁদ মাত্র একটা: rank 1।",
];

export function PlaidRows() {
  const s = useScene(5, [600, 1600, 1400, 1400, 1600, 2400]);
  const k = s.k;
  const c = 20;
  const lit = k >= 2 && k <= 4 ? k - 2 : null;
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <svg viewBox="-20 -20 124 124" role="img" aria-label="একটা চেকের প্রতিটা row উপরের সুতার একই ছাঁদ, কোনোটা খালি, কোনোটা গাঢ়" className="mx-auto block h-auto w-full max-w-[11rem]">
        <G_Weave g={outer(X4_U, X4_V)} u={X4_U} v={X4_V} c={c} max={2} nums={false} />
        {k === 1 && <rect x={0} y={-17} width={5 * c} height={15} rx={2} fill="none" stroke="#7c3aed" strokeWidth={1.6} className={POP} />}
        {lit !== null && <rect key={lit} x={-1} y={lit * c - 1} width={5 * c + 2} height={c + 2} rx={2} fill="none" stroke="#7c3aed" strokeWidth={2} className={POP} />}
        {k >= 5 && [0, 2, 3].map((r) => <rect key={r} x={-1} y={r * c - 1} width={5 * c + 2} height={c + 2} rx={2} fill="none" stroke="#7c3aed" strokeWidth={1.2} strokeDasharray="3 2" className={FADE} />)}
      </svg>
    </Scene>
  );
}

// 5½ · Three roads to G. Cell by cell: W's row 1 meets Z's column 1 over one
//      cell. Column by column: Z's column 1 goes through W and stands up as
//      G's column 1. A pile of checks: the two checks lie on each other.

const X5_SAY = [
  "W আর Z। গুণ করলে G।",
  "ঘরে ঘরে: W এর row 1 · Z এর column 1 = 2.",
  "Column ধরে: Z এর column 1 কে W চালালো, (2, 1). G এর column 1.",
  "চেকের যোগ: দুইটা চেক উপর উপর।",
  "তিন রাস্তা, একই G।",
];

export function ThreeViews() {
  const s = useScene(4, [600, 2400, 2600, 2400, 2200]);
  const k = s.k;
  const c1 = outer(colOf(W, 0), Z[0]);
  const c2 = outer(colOf(W, 1), Z[1]);
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          <G_Mat g={W} name="W" hiRow={k === 1 ? 0 : undefined} />
          <G_Mat g={Z} name="Z" hiCol={k === 1 || k === 2 ? 0 : undefined} />
          <span className="font-mono">=</span>
          <G_Mat g={G} name="G" hiCol={k === 2 ? 0 : undefined} />
        </div>
        <div className="h-[4.5rem]">
          {k === 1 && (
            <div className={`${FADE} flex items-center gap-2 font-mono text-sm`}>
              <span className="rounded bg-cat-blue/15 px-1.5">(0, 1)</span>·<span className="rounded bg-cat-blue/15 px-1.5">(−1, 2)</span>→<span className="rounded border border-foreground/40 px-2">2</span>
            </div>
          )}
          {k === 2 && (
            <div className={`${FADE} flex items-center gap-2 font-mono text-sm`}>
              <span className="rounded bg-cat-blue/15 px-1.5">(−1, 2)</span>
              <span className="font-sans text-xs">W চালানো</span>→<span className="rounded bg-cat-blue/15 px-1.5">(2, 1)</span>
            </div>
          )}
          {k >= 3 && (
            <svg viewBox="-20 -20 190 70" aria-hidden="true" className={`${FADE} block h-[4.5rem] w-auto`}>
              <G_Weave g={c1} c={20} max={2} />
              <text x={50} y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK}>
                +
              </text>
              <G_Weave g={c2} x={62} c={20} max={2} />
              <text x={112} y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK}>
                =
              </text>
              <G_Weave g={G} x={124} c={20} max={2} ring={k >= 4 ? G.map((r) => r.map(() => true)) : null} />
            </svg>
          )}
        </div>
      </div>
    </Scene>
  );
}

// 6½ · Why two: T's rows lit by kind. The bar's row; the four stem rows;
//      then the T split into its two checks side by side.

const X6_SAY = ["T এর row গুলো।", "এক রকম: লম্বা দাগ। একটাই row।", "আরেক রকম: মাঝে এক ঘর। চারটা row।", "দুই রকম ছাঁদ, তাই কম করে দুই চেক: মাথা আর খুঁটি।"];

export function TwoKindsOfRows() {
  const s = useScene(3, [600, 1800, 1800, 2600]);
  const k = s.k;
  const c = 22;
  const o = 24;
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      {k < 3 ? (
        <svg viewBox="0 0 184 184" role="img" aria-label="T এর row: উপরের row লম্বা দাগ, নিচের চারটা row তে মাঝে এক ঘর" className="mx-auto block h-auto w-full max-w-[10rem]">
          <G_Loom7 sum={T} outline={false} label="" className="block h-auto w-full" />
          {k === 1 && <rect x={o - 2} y={o + c - 2} width={N7 * c + 4} height={c + 4} rx={3} fill="none" stroke="#7c3aed" strokeWidth={2.4} className={POP} />}
          {k === 2 && <rect x={o - 2} y={o + 2 * c - 2} width={N7 * c + 4} height={4 * c + 4} rx={3} fill="none" stroke="#0d9488" strokeWidth={2.4} className={POP} />}
        </svg>
      ) : (
        <div className={`${FADE} flex items-center justify-center gap-1.5`}>
          <G_Loom7 rows={BAR.rows} cols={BAR.cols} sum={weave(BAR)} outline={false} label="চেক 1: মাথার দাগ" className="block h-auto w-24" />
          <span className="font-bold">+</span>
          <G_Loom7 rows={STEM.rows} cols={STEM.cols} sum={weave(STEM)} outline={false} label="চেক 2: খুঁটি" className="block h-auto w-24" />
        </div>
      )}
    </Scene>
  );
}

// 6½b · For the side quest: 1.1's bird, 40 × 40 numbers, woven from its most
//       important checks first (the SVD, worked out here by repeated
//       multiplying): 1 check, 3, 8, 20.

type Layer = { s: number; u: number[]; v: number[] };
function topChecks(A: Grid, count: number): Layer[] {
  const n = A.length;
  const m = A[0].length;
  const R = A.map((r) => r.slice());
  const out: Layer[] = [];
  for (let t = 0; t < count; t += 1) {
    let v = Array.from({ length: m }, (_, j) => 1 + ((j * 7) % 5) * 0.1 + t * 0.01 * j);
    let u = Array(n).fill(0);
    let sv = 0;
    for (let it = 0; it < 80; it += 1) {
      u = R.map((r) => r.reduce((a, x, j) => a + x * v[j], 0));
      const nu = Math.hypot(...u) || 1;
      u = u.map((x) => x / nu);
      v = Array.from({ length: m }, (_, j) => R.reduce((a, r, i) => a + r[j] * u[i], 0));
      sv = Math.hypot(...v) || 1;
      v = v.map((x) => x / sv);
    }
    out.push({ s: sv, u, v });
    for (let i = 0; i < n; i += 1) for (let j = 0; j < m; j += 1) R[i][j] -= sv * u[i] * v[j];
  }
  return out;
}
const BIRD: Grid = Array.from({ length: BIRD_COLS }, (_, r) => BIRD_PX.slice(r * BIRD_COLS, (r + 1) * BIRD_COLS));
const X6B_KS = [1, 3, 8, 20];
let birdCache: Grid[] | null = null;
/** the bird woven from its first 1, 3, 8 and 20 checks (worked out once, on first use) */
function birdApprox(): Grid[] {
  if (birdCache) return birdCache;
  const layers = topChecks(BIRD, X6B_KS[X6B_KS.length - 1]);
  birdCache = X6B_KS.map((k) => {
    const g = zeros(BIRD_COLS, BIRD_COLS);
    for (let t = 0; t < k; t += 1) {
      const { s, u, v } = layers[t];
      for (let i = 0; i < BIRD_COLS; i += 1) for (let j = 0; j < BIRD_COLS; j += 1) g[i][j] += s * u[i] * v[j];
    }
    return g;
  });
  return birdCache;
}
const X6B_SAY = ["1.1 এর পাখি। 40 × 40 টা number.", "সবচেয়ে কাজের চেক, মাত্র 1 টা: শুধু আলো-অন্ধকারের আন্দাজ।", "3 টা চেক: একটা কিছু বসে আছে।", "8 টা: পাখি।", "20 টা: প্রায় আসলটা। 1,600 টার বদলে 20 জোড়া সুতা।"];

function X6B_Pic({ g }: { g: Grid }) {
  return (
    <svg viewBox={`0 0 ${BIRD_COLS} ${BIRD_COLS}`} aria-hidden="true" className="block h-auto w-full rounded" shapeRendering="crispEdges">
      {g.map((r, i) =>
        r.map((val, j) => {
          const b = Math.max(0, Math.min(255, Math.round(val)));
          return <rect key={`${i}.${j}`} x={j} y={i} width={1.02} height={1.02} fill={`rgb(${b} ${b} ${b})`} />;
        }),
      )}
    </svg>
  );
}

export function BirdByChecks() {
  const s = useScene(4, [600, 2200, 1800, 1600, 2400]);
  const k = s.k;
  const g = k === 0 ? BIRD : birdApprox()[k - 1];
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <div className="mx-auto w-36">
        <X6B_Pic key={k} g={g} />
      </div>
    </Scene>
  );
}

// 7½ · Swapped threads, a turned check. Rina's check; the threads trade
//      sides; the new check is the old one's rows stood up as columns; the
//      diagonal stays put.

const X7_SAY = ["রিনার গামছা: (2, 0, 1) পাশে, (1, 2, 1) উপরে।", "সুতা অদলবদল: (1, 2, 1) পাশে, (2, 0, 1) উপরে।", "Row গুলো column হয়ে গেলো।", "কোনাকুনি ঘর নড়ে না। v ⊗ u = (u ⊗ v)ᵀ."];

export function FlipCheck() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const c = 20;
  const back = outer(TW_V, TW_U);
  return (
    <Scene scene={s} caption={say(X7_SAY, k)}>
      <svg viewBox="-22 -22 190 88" role="img" aria-label="রিনার চেক আর সুতা অদলবদল করা চেক; row গুলো column হয়ে যায়, কোনাকুনি ঘর একই" className="mx-auto block h-auto w-full max-w-[17rem]">
        <G_Weave g={TW_OLD} u={TW_U} v={TW_V} c={c} max={4} />
        {k >= 1 && <G_Weave g={k >= 2 ? back : zeros(3, 3)} u={TW_V} v={TW_U} x={3 * c + 44} c={c} max={4} />}
        {k >= 3 &&
          [0, 1, 2].map((i) => (
            <g key={i} className={POP}>
              <rect x={i * c + 1} y={i * c + 1} width={c - 2} height={c - 2} rx={2} fill="none" stroke="#7c3aed" strokeWidth={1.8} />
              <rect x={3 * c + 44 + i * c + 1} y={i * c + 1} width={c - 2} height={c - 2} rx={2} fill="none" stroke="#7c3aed" strokeWidth={1.8} />
            </g>
          ))}
      </svg>
    </Scene>
  );
}

// 9½ · The recap: T is two checks; G is two checks; any product, a few.

const X9_SAY = ["T = দুইটা চেক।", "7.3 এর G = দুইটা চেক।", "যেকোনো গুণ = কয়েকটা চেকের যোগ।"];

export function CheckRecap() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X9_SAY, Math.max(0, k - 1))}>
      <div className="flex flex-col items-center gap-2">
        <div className={`flex items-center gap-1.5 ${k >= 1 ? "" : "opacity-40"}`}>
          <G_Loom7 sum={weave(BAR)} outline={false} label="মাথার দাগ" className="block h-auto w-14" />
          <span className="text-sm font-bold">+</span>
          <G_Loom7 sum={weave(STEM)} outline={false} label="খুঁটি" className="block h-auto w-14" />
          <span className="text-sm font-bold">=</span>
          <G_Loom7 sum={T} outline={false} label="T" className="block h-auto w-14" />
        </div>
        {k >= 2 && (
          <svg viewBox="-4 -4 190 56" aria-hidden="true" className={`${FADE} block h-12 w-auto`}>
            <G_Weave g={outer(colOf(W, 0), Z[0])} c={22} max={2} />
            <text x={54} y={27} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK}>
              +
            </text>
            <G_Weave g={outer(colOf(W, 1), Z[1])} x={64} c={22} max={2} />
            <text x={118} y={27} textAnchor="middle" fontSize={12} fontWeight={700} fill={INK}>
              =
            </text>
            <G_Weave g={G} x={128} c={22} max={2} ring={k >= 3 ? G.map((r) => r.map(() => true)) : null} />
          </svg>
        )}
      </div>
    </Scene>
  );
}

// 9½b · For the side quest: A @ B and A * B on the same two grids. @ goes
//       row · column; * goes cell by cell. Two different answers.

const X9B_A: Grid = [
  [1, 2],
  [3, 4],
];
const X9B_B: Grid = [
  [0, 1],
  [1, 0],
];
const X9B_AT: Grid = [
  [2, 1],
  [4, 3],
];
const X9B_STAR: Grid = X9B_A.map((r, i) => r.map((x, j) => x * X9B_B[i][j]));
const X9B_SAY = ["A আর B।", "A @ B: row · column. এই article এর গুণ।", "A * B: ঘরে ঘরে গুণ।", "একই দুইটা grid, দুই রকম উত্তর। Code এ একটা চিহ্নের তফাত।"];

export function AtOrStar() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X9B_SAY, k)}>
      <div className="flex flex-col items-center gap-2 text-sm">
        <div className="flex items-center gap-2">
          <G_Mat g={X9B_A} name="A" />
          <G_Mat g={X9B_B} name="B" />
        </div>
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1 ${k >= 1 ? FADE : "invisible"}`}>
            <span className="font-mono font-bold">@</span>
            <G_Mat g={X9B_AT} />
          </span>
          <span className={`flex items-center gap-1 ${k >= 2 ? FADE : "invisible"}`}>
            <span className="font-mono font-bold">*</span>
            <G_Mat g={X9B_STAR} />
          </span>
        </div>
      </div>
    </Scene>
  );
}

// 9½c · The bridge: the light machine throws a square of light; through the
//       good lens it lands as a slanted, bigger patch. How much bigger? And a
//       minus area? Stopped at "?".

const X9C_SAY = ["দেয়ালে একটা চারকোনা আলো।", "Lens এর ভেতর দিয়ে গেলে: হেলানো, বড় একটা ছোপ।", "জায়গা কতগুণ বাড়লো?", "আর জায়গা যদি minus হয়? Article 8 এ।"];

export function SquareQuestion() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const u = 26;
  const X = (x: number) => 20 + x * u;
  const Y = (y: number) => 100 - y * u;
  const sq = `M${X(0)} ${Y(0)}L${X(1)} ${Y(0)}L${X(1)} ${Y(1)}L${X(0)} ${Y(1)}Z`;
  const par = `M${X(0)} ${Y(0)}L${X(2)} ${Y(1)}L${X(3)} ${Y(3)}L${X(1)} ${Y(2)}Z`;
  let grid = "";
  for (let i = 0; i <= 5; i += 1) grid += `M${X(i)} ${Y(0)}V${Y(3.4)}M${X(0)} ${Y(i > 3 ? 3.4 : i)}H${X(5)}`;
  return (
    <Scene scene={s} caption={say(X9C_SAY, k)}>
      <svg viewBox="0 0 200 112" role="img" aria-label="দেয়ালে চারকোনা আলো; lens এর ভেতর দিয়ে গিয়ে হেলানো বড় ছোপ; জায়গা কতগুণ, ?" className="mx-auto block h-auto w-full max-w-[15rem] rounded-lg bg-[#1e293b]">
        <path d={grid} stroke="white" strokeOpacity={0.12} strokeWidth={0.8} />
        <path d={sq} fill="#fde047" fillOpacity={k >= 1 ? 0.25 : 0.8} stroke="#fde047" strokeWidth={1} />
        {k >= 1 && <path d={par} fill="#fde047" fillOpacity={0.55} stroke="#fde047" strokeWidth={1.2} className={FADE} />}
        {k >= 2 && (
          <text x={170} y={50} textAnchor="middle" fontSize={22} fontWeight={800} fill="#c4b5fd" className={POP}>
            ?
          </text>
        )}
        {k >= 3 && (
          <text x={170} y={86} textAnchor="middle" fontSize={13} fontFamily={MONO} fontWeight={800} fill="#fda4af" className={POP}>
            −?
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  GamchaBet: { start: {}, two: { bet: 1 }, never: { bet: 3 } },
  OneCheck: { start: {}, other: { u: [2, 1], v: [1, 3], woven: { u: [2, 1], v: [1, 3] } }, done: { u: OC_U, v: OC_V, woven: { u: OC_U, v: OC_V } } },
  NumberOrGrid: { start: {}, guessed: { guess: 0 }, wrong: { guess: 0, ran: true }, right: { guess: 1, ran: true } },
  OneLayerIsPlain: { start: {}, tried: { rows: e7(1, 2, 3, 4, 5), cols: e7(1, 2, 3, 4, 5), tries: 1, judged: true } },
  TwoLayers: { start: {}, wrong: { pick: 1 }, right: { pick: 0 } },
  YourLetter: {
    start: {},
    overlap: { layers: [{ rows: e7(1), cols: e7(1, 2, 3, 4, 5) }, { rows: e7(1, 2, 3, 4, 5), cols: e7(3) }, EMPTY], now: 1, tries: 1, judged: true },
    done: { layers: [BAR, STEM, EMPTY], now: 1, tries: 1, judged: true },
  },
  TryWhichThreads: { start: {}, swapped: { pick: 0 }, near: { pick: 2 }, right: { pick: 1 } },
  BetCards: { start: {}, one: { open: [0] }, done: { open: [0, 1, 2, 3] } },
  FiveThings: { start: {}, two: { open: [0, 1] }, done: { open: [0, 1, 2, 3, 4] } },
  LoomNight: { rest: { k: 0 }, som: { k: 2 }, nana: { k: 4 }, done: {} },
  NanaTwoThreads: { one: { k: 1 }, done: {} },
  NasibAtLoom: { line: { k: 2 }, done: {} },
  SaminLenses: { phone: { k: 2 }, done: {} },
  RinaTrunk: { ask: { k: 3 }, done: {} },
  NanaDawn: { last: { k: 1 }, cut: { k: 2 }, done: {} },
  Bidai: { gate: { k: 0 }, going: { k: 1 }, done: {} },
  EmptyLoom: { paper: { k: 1 }, done: {} },
  ThreadsCross: { rows: { k: 1 }, done: {} },
  InnerOuter: { inner: { k: 2 }, done: {} },
  PlaidRows: { top: { k: 1 }, row3: { k: 4 }, done: {} },
  ThreeViews: { cell: { k: 1 }, col: { k: 2 }, done: {} },
  TwoKindsOfRows: { bar: { k: 1 }, stem: { k: 2 }, done: {} },
  BirdByChecks: { bird: { k: 0 }, one: { k: 1 }, three: { k: 2 }, done: {} },
  FlipCheck: { swap: { k: 1 }, done: {} },
  CheckRecap: { t: { k: 1 }, done: {} },
  AtOrStar: { at: { k: 1 }, done: {} },
  SquareQuestion: { lens: { k: 1 }, done: {} },
};
