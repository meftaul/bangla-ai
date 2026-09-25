"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useState } from "react";

import { Bubble, Card, Loop, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, Ticks, predictLook, quietBtn, usePlay, useScene, useSeed, useSeeded, useTween, type Fixtures } from "@/components/journey/kit";

// Screens for "Math for AI 6.1 — The team register, a table that is one thing",
// told as a Journey. The plan is 06_journey_specs.md, block 6.1.
//
// Ten screens. 1 seals the bet: the club's app asks for the register's shape,
// and four friends give four answers (3 × 8, 8 × 3, 8 × 4 with the হ্যাঁ/না
// column, "anything"). 2 spills the register's eight slips on the table; reading
// everyone's weight slip by slip is slow, stacking them makes one table.
// 3 reads a row (one person) and a column (one feature). 4 calls "row 2,
// column 3": row first, always. 5 frames the numbers, 8 × 3. 6 is Som's হ্যাঁ/না
// column: it can't be averaged until it becomes 1/0, and then it steps out as y.
// 7 is Nasib's 3 × 8, the same table turned over its diagonal (transpose), which
// the app reads as three students. 8 is the reader's own three tables, 9 the
// class-eight register that isn't a matrix yet, 10 settles the bet and walks out
// to the gate, where the art sir is chalking a grid on the road (6.2).
//
// After the screens come the story scenes (the teachers' room, the slips, the
// call, Som's page, the notice board, the class-seven boy's three papers, class
// eight's note, the bell, the art sir at the gate) and the
// watch-only figures, each numbered after its screen (1a, 2½, …).
//
// The register is drawn as a white sheet in fixed ink. The PT sir (খেলার স্যার)
// and the art sir aren't in the cast: they borrow Mama's and Nana's looks and get
// their own names drawn under their feet.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const HI = "#f59e0b";
const OK = "#0d9488";
const BAD = "#e11d48";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

// ---------------------------------------------------------------------------
// The register: eight students at the trials, three numbers each.

export const R_NAMES = ["রাফি", "তানভীর", "রিনা", "করিম", "সাকিব", "জুয়েল", "মিতু", "শুভ"];
export const R_HEAD = ["height", "weight", "বুকডন"];
export const R_DATA = [
  [1.52, 45, 22],
  [1.58, 52, 30],
  [1.49, 41, 18],
  [1.61, 63, 25],
  [1.55, 48, 35],
  [1.63, 58, 28],
  [1.5, 44, 20],
  [1.57, 55, 32],
];
/** the PT sir's trial column: taken for the team or not */
export const R_TEAM = [false, true, false, true, true, true, false, true];

export const fmt = (c: number, v: number) => (c === 0 ? v.toFixed(2) : String(v));
const cells = (data: number[][]) => data.map((row) => row.map((v, c) => fmt(c, v)));

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

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

type Geo = { nw: number; cw: number; rh: number; hh: number };
const G0: Geo = { nw: 38, cw: 32, rh: 13, hh: 15 };

/**
 * A register sheet, drawn into a parent <svg> at its origin: an optional row of
 * headers, an optional column of names, and the numbers. Headers and names can
 * be tapped (onCol, onRow). A highlighted row or column glides between places.
 */
function Sheet({
  data,
  head = R_HEAD,
  names = R_NAMES,
  g = G0,
  showNames = true,
  numbered = false,
  hiRow = null,
  hiCol = null,
  tone = HI,
  onRow,
  onCol,
  children,
}: {
  data: string[][];
  head?: string[];
  names?: string[];
  g?: Geo;
  showNames?: boolean;
  numbered?: boolean;
  hiRow?: number | null;
  hiCol?: number | null;
  tone?: string;
  onRow?: (r: number) => void;
  onCol?: (c: number) => void;
  children?: ReactNode;
}) {
  const rows = data.length;
  const cols = data[0].length;
  const left = showNames ? g.nw : 4;
  const w = left + cols * g.cw + 4;
  const h = g.hh + rows * g.rh + 4;
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} rx={4} fill="white" stroke={INK} strokeOpacity={0.3} />
      {hiRow !== null && (
        <rect
          x={2}
          y={0}
          width={w - 4}
          height={g.rh}
          rx={2}
          fill={tone}
          fillOpacity={0.22}
          style={{ transform: `translateY(${g.hh + hiRow * g.rh}px)` }}
          className="transition-transform duration-500 motion-reduce:transition-none"
        />
      )}
      {hiCol !== null && (
        <rect
          x={0}
          y={2}
          width={g.cw}
          height={h - 4}
          rx={2}
          fill={tone}
          fillOpacity={0.22}
          style={{ transform: `translateX(${left + hiCol * g.cw}px)` }}
          className="transition-transform duration-500 motion-reduce:transition-none"
        />
      )}
      <path d={`M2 ${g.hh}H${w - 2}`} stroke={INK} strokeOpacity={0.25} />
      {showNames && <path d={`M${g.nw} 2V${h - 2}`} stroke={INK} strokeOpacity={0.25} />}
      {head.slice(0, cols).map((t, c) => (
        <g key={t} {...(onCol ? press(() => onCol(c)) : {})} className={onCol ? "cursor-pointer outline-none" : undefined} aria-label={onCol ? `${t} column` : undefined}>
          <rect x={left + c * g.cw} y={0} width={g.cw} height={g.hh} fill="transparent" />
          <text x={left + c * g.cw + g.cw / 2} y={g.hh / 2 + 3} textAnchor="middle" fontSize={Math.min(7.5, g.cw / 4.3)} fontWeight={700} fill={INK}>
            {t}
          </text>
          {numbered && (
            <text x={left + c * g.cw + g.cw / 2} y={-3} textAnchor="middle" fontSize={7} fontWeight={700} fontFamily={MONO} fill="#64748b">
              {c + 1}
            </text>
          )}
        </g>
      ))}
      {showNames &&
        names.slice(0, rows).map((n, r) => (
          <g key={n} {...(onRow ? press(() => onRow(r)) : {})} className={onRow ? "cursor-pointer outline-none" : undefined} aria-label={onRow ? `${n} এর row` : undefined}>
            <rect x={0} y={g.hh + r * g.rh} width={g.nw} height={g.rh} fill="transparent" />
            <text x={g.nw - 4} y={g.hh + r * g.rh + g.rh / 2 + 3} textAnchor="end" fontSize={7.5} fontWeight={600} fill={INK}>
              {n}
            </text>
            {numbered && (
              <text x={-4} y={g.hh + r * g.rh + g.rh / 2 + 3} textAnchor="end" fontSize={7} fontWeight={700} fontFamily={MONO} fill="#64748b">
                {r + 1}
              </text>
            )}
          </g>
        ))}
      {data.map((row, r) =>
        row.map((v, c) => (
          <text
            key={`${r}-${c}`}
            x={left + c * g.cw + g.cw / 2}
            y={g.hh + r * g.rh + g.rh / 2 + 3}
            textAnchor="middle"
            fontSize={7.5}
            fontFamily={/[ঀ-৿]/.test(v) ? undefined : MONO}
            fill={INK}
          >
            {v}
          </text>
        )),
      )}
      {children}
    </g>
  );
}

/** where a sheet's data cell sits, for overlays */
const cellX = (c: number, g = G0, names = true) => (names ? g.nw : 4) + c * g.cw;
const cellY = (r: number, g = G0) => g.hh + r * g.rh;

/** A small laptop on the table, with one or two lines on its screen. */
function R_Laptop({ x, y, lines, tone = "plain" }: { x: number; y: number; lines: string[]; tone?: "plain" | "ok" | "bad" }) {
  const ink = { plain: "#e2e8f0", ok: "#6ee7b7", bad: "#fca5a5" }[tone];
  return (
    <g>
      <rect x={x} y={y} width={78} height={50} rx={4} fill="#0f172a" />
      <rect x={x + 3} y={y + 3} width={72} height={8} rx={2} fill="#1e293b" />
      <text x={x + 8} y={y + 9.5} fontSize={5.5} fontFamily={MONO} fill="#94a3b8">
        team-picker
      </text>
      {lines.map((l, i) => (
        <text key={`${i}${l}`} x={x + 7} y={y + 23 + i * 11} fontSize={7.5} fontFamily={/[ঀ-৿]/.test(l) ? undefined : MONO} fill={ink} className={FADE}>
          {l}
        </text>
      ))}
      <path d={`M${x - 6} ${y + 53}H${x + 84}l-4 -3H${x - 2}Z`} fill="#334155" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1 · The bet. The register sheet and the app's question, "shape = ?". Four
//     answers from four friends; the reader seals one. Unmarked; the last
//     screen settles it.

const SB_OPTS = ["3 × 8 — নাসিব", "8 × 3 — সামিন", "8 × 4, হ্যাঁ/না সহ — সোম", "যেটাই দাও, app বুঝে নিবে — করিম"];
const SB_G: Geo = { nw: 34, cw: 26, rh: 10.5, hh: 13 };
/** each answer as a picture: its rows × columns as a block of little cells (Som's 4th column amber); Karim's a loose pile */
const SB_PIC: [rows: number, cols: number][] = [
  [3, 8],
  [8, 3],
  [8, 4],
  [0, 0],
];
/** what the picked card says once it lands on the laptop's screen */
const SB_CARD = ["3 × 8", "8 × 3", "8 × 4", "যেটাই"];

function SB_Pic({ i }: { i: number }) {
  const [rows, cols] = SB_PIC[i];
  const s = 4.4;
  const w = cols * s;
  const h = rows * s;
  return (
    <svg viewBox="0 0 40 38" role="img" aria-label={rows ? `${rows} row, ${cols} column` : "ছড়ানো slip"} className="block h-auto w-[2.8rem] shrink-0">
      {rows ? (
        Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => (
            <rect key={`${r}-${c}`} x={20 - w / 2 + c * s + 0.5} y={19 - h / 2 + r * s + 0.5} width={s - 1} height={s - 1} rx={0.6} fill={c === 3 ? "#d97706" : undefined} className={c === 3 ? undefined : "fill-current opacity-60"} />
          )),
        )
      ) : (
        <g>
          {[
            [6, 8, -14],
            [16, 20, 10],
            [4, 26, 6],
            [18, 6, 18],
          ].map(([x, y, r]) => (
            <rect key={`${x}${y}`} x={x} y={y} width={16} height={5} rx={1} transform={`rotate(${r} ${x + 8} ${y + 2.5})`} className="fill-none stroke-current opacity-70" />
          ))}
          <text x={34} y={36} textAnchor="middle" fontSize={11} fontWeight={800} className="fill-current">
            ?
          </text>
        </g>
      )}
    </svg>
  );
}

export function ShapeBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const seeded = useSeeded();
  // 0 the card still on the table, 1 it flies to the laptop, 2 the screen reads it and a "?" goes up.
  const p = usePlay(750);
  const k = bet === null ? 0 : seeded ? 2 : p.k;
  const seal = (i: number) => {
    if (bet !== null) return;
    setBet(i);
    p.play(2, () => pass("বাজি ধরা হয়ে গেলো। শেষে মিলিয়ে দেখবো।"));
  };
  const card = bet === null ? "" : SB_CARD[bet];
  const bn = /[ঀ-৿]/.test(card);
  return (
    <>
      <svg viewBox="0 0 250 104" role="img" aria-label="খেলার স্যারের register, আটজনের height, weight আর বুকডন; পাশে laptop এ app জিজ্ঞেস করছে shape কত" className="mx-auto block h-auto w-full max-w-[19rem]">
        <Sheet data={cells(R_DATA)} g={SB_G} />
        <R_Laptop x={140} y={22} lines={["register পেলাম।", k >= 2 ? `shape = ${card}` : "shape = ?"]} />
        {bet !== null && k < 2 && (
          <g
            className="transition-transform duration-700 ease-in-out motion-reduce:transition-none"
            style={{ transform: k >= 1 ? "translate(180px, 52px) scale(0.7)" : "translate(180px, 112px) scale(1)" }}
          >
            <rect x={-22} y={-8} width={44} height={15} rx={3} fill="white" stroke="#2563eb" strokeWidth={1.4} />
            <text y={3} textAnchor="middle" fontSize={8.5} fontWeight={700} fontFamily={bn ? undefined : MONO} fill={INK}>
              {card}
            </text>
          </g>
        )}
        {k >= 2 && (
          <text x={236} y={30} textAnchor="middle" fontSize={20} fontWeight={800} fill="#2563eb" className={POP}>
            ?
          </text>
        )}
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {SB_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            <span className="flex items-center gap-2 text-[0.85rem] leading-snug">
              <SB_Pic i={i} />
              <span>{o}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={bet !== null && k >= 2}>App কোন shape টা নেবে? একটার উপরে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Loose slips. The register is eight paper slips, one per student, strewn
//     on the table. Karim wants everyone's weight: tapping slip after slip reads
//     one weight at a time. After three, the reader may stack them; the slips
//     glide into rows, the headers appear, and the weight column is simply there.

const LC_SCATTER: [number, number, number][] = [
  [10, 24, -8],
  [160, 14, 6],
  [20, 58, 5],
  [165, 62, -7],
  [8, 100, 7],
  [160, 104, -5],
  [30, 146, -6],
  [165, 136, 6],
];
const LC_W = 124;
const LC_H = 13;

export function LooseCards() {
  const pass = useGate();
  const [read, setRead] = useSeed<number[]>("read", []);
  const [stacked, setStacked] = useSeed("stacked", false);
  // the stack glides in over ~1.3s (eight slips, 70ms apart); pass once it has landed
  const land = usePlay(1300);

  const tap = (i: number) => {
    if (stacked || read.includes(i)) return;
    setRead([...read, i]);
  };
  const stack = () => {
    if (stacked) return;
    setStacked(true);
    land.play(1, () => pass("একটা slip একটা row। সব slip গাদা করলে একটাই জিনিস, একটা table।"));
  };

  return (
    <>
      <svg viewBox="0 0 300 176" role="img" aria-label={stacked ? "আটটা slip একটার নিচে একটা সাজানো, weight এর column টা আলাদা করে চোখে পড়ছে" : "টেবিলে আটটা slip ছড়ানো, প্রতিটায় একজনের নাম আর তিনটা number"} className="mx-auto block h-auto w-full max-w-[21rem]">
        <rect x={0} y={0} width={300} height={176} rx={8} fill="#c8a27a" opacity={0.35} />
        {R_NAMES.map((n, i) => {
          const [sx, sy, rot] = LC_SCATTER[i];
          const lit = read.includes(i);
          // a slip being read is picked up: it straightens and lifts a little off the pile
          const [x, y, r] = stacked ? [88, 25 + i * (LC_H + 1), 0] : lit ? [sx, sy - 3, 0] : [sx, sy, rot];
          return (
            <g
              key={n}
              {...press(() => tap(i))}
              aria-label={`${n} এর slip`}
              className={`${stacked ? "" : "cursor-pointer"} outline-none transition-transform duration-700 ease-in-out motion-reduce:transition-none`}
              style={{ transform: `translate(${x}px, ${y}px) rotate(${r}deg)`, transitionDelay: stacked ? `${i * 70}ms` : "0ms" }}
            >
              <rect width={LC_W} height={LC_H} rx={2} fill="white" stroke={INK} strokeOpacity={0.35} />
              <text x={5} y={9.5} fontSize={7.5} fontWeight={600} fill={INK}>
                {n}
              </text>
              {R_DATA[i].map((v, c) => (
                <g key={c}>
                  {c === 1 && lit && !stacked && <rect x={44 + c * 28 - 11} y={1.5} width={22} height={10} rx={2} fill={HI} fillOpacity={0.35} />}
                  <text x={44 + c * 28} y={9.5} textAnchor="middle" fontSize={7.5} fontFamily={MONO} fill={INK}>
                    {fmt(c, v)}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
        {stacked && (
          <g className={FADE} style={{ transitionDelay: "700ms" }}>
            {R_HEAD.map((t, c) => (
              <text key={t} x={88 + 44 + c * 28} y={20} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK}>
                {t}
              </text>
            ))}
            <rect x={88 + 64} y={24} width={24} height={8 * (LC_H + 1) + 2} rx={3} fill={HI} fillOpacity={0.2} stroke={HI} />
          </g>
        )}
      </svg>
      <div className="mt-1 min-h-6 text-center font-mono text-sm">
        {stacked ? (
          <span className={FADE}>weight: {R_DATA.map((d) => d[1]).join(", ")}</span>
        ) : read.length ? (
          <span>
            weight: {read.map((i) => R_DATA[i][1]).join(", ")}
            <span className="font-sans text-muted"> · আরো {8 - read.length} টা বাকি</span>
          </span>
        ) : null}
      </div>
      {read.length >= 3 && !stacked && (
        <div className={`mt-2 flex justify-center ${FADE}`}>
          <button type="button" className={quietBtn} onClick={stack}>
            Slip গুলো একটার নিচে একটা রাখুন
          </button>
        </div>
      )}
      <Task done={stacked}>করিম সবার weight জানতে চায়। একটা একটা slip এ tap করে weight পড়ুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Row or column. Two jobs on the table: all of Rina's numbers (a row) and
//     everyone's height (a column). Names and headers are tappable; every tap
//     lights that slice and a finger reads it cell by cell, the readout filling
//     as it goes (3 numbers along a row, 8 down a column). A wrong tap reads out
//     that other slice honestly, then says whose it is.

export function RowOrColumn() {
  const pass = useGate();
  const [hit, setHit] = useSeed<[boolean, boolean]>("hit", [false, false]);
  const [last, setLast] = useSeed<{ kind: "row" | "col"; i: number } | null>("last", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const seeded = useSeeded();
  const read = usePlay(260);

  const cellsOf = (l: { kind: "row" | "col"; i: number }): [number, number][] =>
    l.kind === "row" ? R_HEAD.map((_, c) => [l.i, c]) : R_NAMES.map((_, r) => [r, l.i]);
  const isGood = (l: { kind: "row" | "col"; i: number }) => (l.kind === "row" ? l.i === 2 : l.i === 0);

  const pick = (kind: "row" | "col", i: number) => {
    const l = { kind, i };
    setLast(l);
    const good = isGood(l);
    read.play(cellsOf(l).length, () => {
      if (!good) return setMiss((m) => m + 1);
      const next: [boolean, boolean] = kind === "row" ? [true, hit[1]] : [hit[0], true];
      setHit(next);
      if (next[0] && next[1]) pass("Row মানে একজন মানুষ। Column মানে একটা feature, সবার জন্য।");
    });
  };
  const good = last !== null && isGood(last);
  const path = last ? cellsOf(last) : [];
  const reading = read.running && !seeded;
  // how many of the slice's numbers the finger has read so far
  const n = reading ? read.k + 1 : path.length;
  const [fr, fc] = path[Math.min(reading ? read.k : path.length - 1, path.length - 1)] ?? [0, 0];
  const [fx, fy] = useTween([cellX(fc) + G0.cw / 2, cellY(fr) + G0.rh / 2], 200);
  const slice =
    last === null
      ? null
      : last.kind === "row"
        ? `${R_NAMES[last.i]}: (${R_DATA[last.i]
            .slice(0, n)
            .map((v, c) => fmt(c, v))
            .join(", ")}${n < 3 ? ", …" : ""})`
        : `${R_HEAD[last.i]}: ${R_DATA.slice(0, n)
            .map((d) => fmt(last.i, d[last.i]))
            .join(", ")}${n < 8 ? ", …" : ""}`;

  return (
    <>
      <svg viewBox="-2 -2 142 126" role="img" aria-label="আটজনের register; নামে tap করলে row, column এর মাথায় tap করলে column" className="mx-auto block h-auto w-full max-w-[16rem]">
        <Sheet
          data={cells(R_DATA)}
          hiRow={last?.kind === "row" ? last.i : null}
          hiCol={last?.kind === "col" ? last.i : null}
          tone={reading ? HI : good ? OK : last ? BAD : HI}
          onRow={(r) => pick("row", r)}
          onCol={(c) => pick("col", c)}
        >
          {reading && <circle cx={fx} cy={fy} r={5.5} fill={HI} fillOpacity={0.3} stroke={HI} strokeWidth={1.2} className="pointer-events-none" />}
        </Sheet>
      </svg>
      <div className="mt-1 min-h-6 text-center font-mono text-sm">{slice}</div>
      <Ticks
        items={[
          ["রিনার সব number", hit[0]],
          ["সবার height", hit[1]],
        ]}
      />
      {last && !good && !reading && (
        <Nope key={miss}>
          {last.kind === "row" ? `এটা ${R_NAMES[last.i]} এর row। রিনাকে খুঁজুন।` : `এটা সবার ${R_HEAD[last.i]}. Height এর column টা খুঁজুন।`}
        </Nope>
      )}
      <Task done={hit[0] && hit[1]}>দুইটা কাজ: রিনার সব number, আর সবার height। নামে বা column এর মাথায় tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · "Row 2, column 3." Guess the number first; the guess is ringed where it
//     sits on the sheet, then a finger walks it: down to row 2 along the names,
//     then across to column 3. The answer is 30 (Tanvir's বুকডন). A wrong guess
//     stays ringed in red with its own address: 41 is Nasib's reading (column
//     first: Rina's weight, row 3, column 2).

const CC_OPTS = ["30", "41", "52", "1.49"];
/** where each option sits on the sheet, [row, column] from 0 */
const CC_AT: [number, number][] = [
  [1, 2],
  [2, 1],
  [1, 1],
  [2, 0],
];
const CC_PATH: [number, number][] = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [1, 2],
];

export function CallTheCell() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [over, setOver] = useSeed("over", false);
  const walk = usePlay(520);
  const k = over ? CC_PATH.length - 1 : walk.k;
  const [r, c] = CC_PATH[Math.min(k, CC_PATH.length - 1)];
  const [fx, fy] = useTween([c < 0 ? G0.nw / 2 : cellX(c) + G0.cw / 2, cellY(r) + G0.rh / 2], 420);

  const choose = (i: number) => {
    setGuess(i);
    walk.play(CC_PATH.length - 1, () => {
      setOver(true);
      pass("আগে row, পরে column। সবসময়।");
    });
  };
  const started = guess !== null;
  const [gr, gc] = guess === null ? [0, 0] : CC_AT[guess];
  const wrong = over && guess !== null && guess !== 0;

  return (
    <>
      <svg viewBox="-12 -12 152 134" role="img" aria-label="register, row আর column এর number লেখা; আঙুল row 2 তে নেমে column 3 পর্যন্ত যায়" className="mx-auto block h-auto w-full max-w-[15rem]">
        <Sheet data={cells(R_DATA)} numbered>
          {started && guess !== 0 && (
            <rect key={`g${guess}`} x={cellX(gc) + 1} y={cellY(gr) + 0.5} width={G0.cw - 2} height={G0.rh - 1} rx={3} fill={wrong ? BAD : "#2563eb"} fillOpacity={0.12} stroke={wrong ? BAD : "#2563eb"} strokeWidth={1.3} strokeDasharray={wrong ? undefined : "2 1.5"} className={POP} />
          )}
          {over && <rect x={cellX(2)} y={cellY(1)} width={G0.cw} height={G0.rh} rx={2} fill="none" stroke={OK} strokeWidth={1.6} className={POP} />}
          {started && (
            <g className="pointer-events-none">
              <circle cx={fx} cy={fy} r={5} fill={HI} fillOpacity={0.35} stroke={HI} />
            </g>
          )}
        </Sheet>
      </svg>
      <div className="text-center text-sm font-medium text-muted">
        {wrong ? (
          <span className={`text-danger ${FADE}`}>
            আপনার {CC_OPTS[guess]} আছে row {gr + 1}, column {gc + 1} এ।
          </span>
        ) : (
          "খেলার স্যার বললেন, row 2, column 3। ওইটা কত?"
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {CC_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, 0)} disabled={started} onClick={() => choose(i)}>
            <span className="font-mono">{o}</span>
          </Choice>
        ))}
      </div>
      <Task done={over}>আগে আন্দাজ করুন, তারপর আঙুলটা কোথায় যায় দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The shape. A frame sits on the numbers' corner; two steppers size it,
//     rows × columns. It turns teal when it covers exactly the numbers: 8 × 3.
//     The names stay outside: they label the rows, they aren't numbers.

export function CountTheShape() {
  const pass = useGate();
  const [rows, setRows] = useSeed("rows", 2);
  const [cols, setCols] = useSeed("cols", 2);
  const done = rows === 8 && cols === 3;
  const [w, h] = useTween([cols * G0.cw, rows * G0.rh], 400);
  // the frame glides to its new size; the gate opens once it has settled on the numbers
  const settle = usePlay(420);

  const set = (r: number, c: number) => {
    setRows(r);
    setCols(c);
    settle.play(1, () => {
      if (r === 8 && c === 3) pass("মানুষ কয়জন × feature কয়টা: 8 × 3।");
    });
  };

  return (
    <>
      <svg viewBox="-2 -2 214 150" role="img" aria-label={`register এর number গুলোর উপরে ${rows} × ${cols} এর একটা frame`} className="mx-auto block h-auto w-full max-w-[18rem]">
        <Sheet data={cells(R_DATA)} />
        <rect x={cellX(0)} y={cellY(0)} width={w} height={h} rx={3} fill={done ? OK : HI} fillOpacity={0.12} stroke={done ? OK : HI} strokeWidth={1.8} />
        <text x={Math.min(cellX(0) + w + 4, 180)} y={Math.min(cellY(0) + h + 1, 140)} fontSize={9} fontWeight={700} fontFamily={MONO} fill={done ? OK : "#b45309"}>
          {rows} × {cols}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-2">
          row <Stepper value={rows} min={1} max={9} label="row" onChange={(v) => set(v, cols)} />
        </span>
        <span className="inline-flex items-center gap-2">
          column <Stepper value={cols} min={1} max={4} label="column" onChange={(v) => set(rows, v)} />
        </span>
      </div>
      <Task done={done}>Frame টা এমন করুন যেন ঠিক সবগুলো number ঢাকে। নাম বাদ।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Som's হ্যাঁ/না column. Three moves, each played on the sheet beside a
//     small 0-to-1 line (the place an average would land): ask the app to
//     average it (the words fly to the line, find no place on it, and fall back:
//     "?"), code it হ্যাঁ → 1, না → 0 (now every value drops onto the line, five
//     at 1 and three at 0, and the average settles at 0.625), then split it
//     off: the three columns become X, the last one y.

const YN_LX = 228;
const YN_TOP = 22;
const YN_BOT = 114;
const yn_y = (v: number) => YN_BOT - v * (YN_BOT - YN_TOP);

export function YesNoColumn() {
  const pass = useGate();
  const [tried, setTried] = useSeed("tried", false);
  const [coded, setCoded] = useSeed("coded", false);
  const [split, setSplit] = useSeed("split", false);
  const seeded = useSeeded();
  const p = usePlay(750);
  const g = G0;
  const x4 = g.nw + 3 * g.cw;
  // beats of the stage being played; a finished stage shows its end
  const tk = coded || seeded ? 2 : p.k;
  const ck = split || seeded ? 2 : p.k;
  const shift = split ? 22 : 0;
  const cx = x4 + g.cw / 2 + 2 + shift;
  const cy = (r: number) => g.hh + r * g.rh + g.rh / 2 + 3;
  // where each coded value lands on the line: the ones side by side at 1, the zeros at 0
  const landX = R_TEAM.map((t, r) => YN_LX - 7 - R_TEAM.slice(0, r).filter((u) => u === t).length * 6);

  const act = (step: "try" | "code" | "split") => {
    if (step === "try") {
      setTried(true);
      p.play(2);
    } else if (step === "code") {
      setCoded(true);
      p.play(2);
    } else {
      setSplit(true);
      p.play(1, () => pass("Matrix এ শুধু number। আর যেটা বের করতে চাই, ওটা আলাদা থাকে: X আর y।"));
    }
  };

  return (
    <>
      <svg viewBox="-2 -20 252 142" role="img" aria-label={split ? "তিনটা column এর নাম X, আলাদা করে রাখা শেষ column এর নাম y" : "register এর শেষে দলে নেওয়া হবে কি-না, হ্যাঁ আর না; পাশে 0 থেকে 1 এর একটা লাইন"} className="mx-auto block h-auto w-full max-w-[21rem]">
        <Sheet data={cells(R_DATA)} />
        <g className="transition-transform duration-700 ease-in-out motion-reduce:transition-none" style={{ transform: `translateX(${shift}px)` }}>
          <rect x={x4} y={0} width={g.cw + 4} height={g.hh + 8 * g.rh + 4} rx={4} fill="white" stroke={INK} strokeOpacity={0.3} />
          {tried && !coded && tk >= 2 && <rect x={x4 + 2} y={2} width={g.cw} height={g.hh + 8 * g.rh} rx={2} fill={BAD} fillOpacity={0.12} className={FADE} />}
          <text x={x4 + g.cw / 2 + 2} y={g.hh / 2 + 3} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK}>
            দলে?
          </text>
          {R_TEAM.map((t, r) => (
            <text key={`${r}${coded}`} x={x4 + g.cw / 2 + 2} y={cy(r)} textAnchor="middle" fontSize={7.5} fontFamily={coded ? MONO : undefined} fill={INK} className={coded ? POP : undefined} style={{ transitionDelay: `${r * 60}ms` }}>
              {coded ? (t ? "1" : "0") : t ? "হ্যাঁ" : "না"}
            </text>
          ))}
          {split && (
            <text x={x4 + g.cw / 2 + 2} y={-4} textAnchor="middle" fontSize={11} fontWeight={800} fontStyle="italic" fill={OK} className={FADE}>
              y
            </text>
          )}
        </g>
        {/* the line an average lands on: 0 at the bottom, 1 at the top */}
        <path d={`M${YN_LX} ${YN_TOP}V${YN_BOT}M${YN_LX - 3} ${YN_TOP}h6M${YN_LX - 3} ${YN_BOT}h6`} stroke={INK} strokeOpacity={0.45} />
        <text x={YN_LX + 6} y={YN_TOP + 3} fontSize={7} fontFamily={MONO} fill="#64748b">
          1
        </text>
        <text x={YN_LX + 6} y={YN_BOT + 3} fontSize={7} fontFamily={MONO} fill="#64748b">
          0
        </text>
        {/* the words try the line: out to it, no place to sit, back */}
        {tried && !coded && tk < 2 &&
          R_TEAM.map((t, r) => (
            <g key={`w${r}`} className="transition-transform duration-500 ease-in-out motion-reduce:transition-none" style={{ transform: tk >= 1 ? `translate(${YN_LX - 14}px, ${cy(r)}px)` : `translate(${cx}px, ${cy(r)}px)`, transitionDelay: `${r * 40}ms` }}>
              <text textAnchor="middle" fontSize={7.5} fontWeight={700} fill={tk >= 1 ? BAD : INK}>
                {t ? "হ্যাঁ" : "না"}
              </text>
            </g>
          ))}
        {tried && !coded && tk >= 2 && (
          <text x={YN_LX - 12} y={(YN_TOP + YN_BOT) / 2 + 7} textAnchor="middle" fontSize={20} fontWeight={800} fill={BAD} className={POP}>
            ?
          </text>
        )}
        {/* the coded values drop onto the line, then the average settles among them */}
        {coded &&
          R_TEAM.map((t, r) => (
            <g key={`n${r}`} className="transition-transform duration-500 ease-in-out motion-reduce:transition-none" style={{ transform: ck >= 1 ? `translate(${landX[r]}px, ${yn_y(t ? 1 : 0) + 3}px)` : `translate(${x4 + g.cw / 2 + 2}px, ${cy(r)}px)`, transitionDelay: `${r * 50}ms` }}>
              <text textAnchor="middle" fontSize={7.5} fontWeight={700} fontFamily={MONO} fill={OK}>
                {t ? "1" : "0"}
              </text>
            </g>
          ))}
        {coded && ck >= 2 && (
          <g className={FADE}>
            <path d={`M${YN_LX - 5} ${yn_y(0.625)}h10`} stroke={HI} strokeWidth={2.4} strokeLinecap="round" />
            <text x={YN_LX - 8} y={yn_y(0.625) + 2.5} textAnchor="end" fontSize={7} fontWeight={700} fontFamily={MONO} fill="#b45309">
              0.625
            </text>
          </g>
        )}
        {split && (
          <g className={FADE}>
            <path d={`M${g.nw} -2V-6H${x4 - 2}V-2`} fill="none" stroke={OK} strokeWidth={1.2} />
            <text x={(g.nw + x4) / 2} y={-8} textAnchor="middle" fontSize={11} fontWeight={800} fill={OK}>
              X
            </text>
          </g>
        )}
      </svg>
      <div className="mt-1 min-h-6 text-center text-sm">
        {tried && !coded && tk >= 2 && (
          <span className={`font-mono text-danger ${FADE}`}>
            average = হ্যাঁ + না + … ? <span className="font-sans">App আটকে গেলো।</span>
          </span>
        )}
        {coded && ck >= 2 && (
          <span className={`font-mono ${FADE}`}>
            average = 5 ÷ 8 = 0.625 <span className="font-sans text-muted">(আটজনে পাঁচজন)</span>
          </span>
        )}
      </div>
      <div className="mt-2 flex min-h-11 flex-wrap justify-center gap-2">
        {!tried && (
          <button type="button" className={quietBtn} onClick={() => act("try")}>
            দলে? column এর average
          </button>
        )}
        {tried && !coded && tk >= 2 && (
          <button type="button" className={`${quietBtn} ${FADE}`} onClick={() => act("code")}>
            হ্যাঁ → 1, না → 0
          </button>
        )}
        {coded && !split && ck >= 2 && (
          <button type="button" className={`${quietBtn} ${FADE}`} onClick={() => act("split")}>
            শেষ column টা আলাদা করুন
          </button>
        )}
      </div>
      <Ticks
        items={[
          ["average চেয়ে দেখা", tried],
          ["number বানানো", coded],
          ["আলাদা করা", split],
        ]}
      />
      <Task done={split && !p.running}>সোমের column টা app কে দিন। যেখানে আটকায়, ঠিক করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Nasib's 3 × 8. Square cells, so the flip is a real mirror over the
//     diagonal: every number (r, c) glides to (c, r), names go to the top and
//     the headers to the side. Feed either version to the app: it reads row by
//     row, one student a row, a bar sweeping down as it counts; the straight
//     one counts 8, the flipped one only 3, with eight features each.

const FS = 18;
const FS_L = 36;
const FS_T = 34;

function FS_Label({ text, i, top }: { text: string; i: number; top: boolean }) {
  const x = top ? FS_L + i * FS + FS / 2 + 2 : FS_L - 3;
  const y = top ? FS_T - 3 : FS_T + i * FS + FS / 2 + 3;
  return (
    <g className="transition-transform duration-700 ease-in-out motion-reduce:transition-none" style={{ transform: `translate(${x}px, ${y}px) rotate(${top ? 60 : 0}deg)` }}>
      <text textAnchor="end" fontSize={7} fontWeight={600} fill={INK}>
        {text}
      </text>
    </g>
  );
}

export function FlipSideways() {
  const pass = useGate();
  const [flipped, setFlipped] = useSeed("flipped", false);
  const [fed, setFed] = useSeed<boolean | null>("fed", null);
  const [both, setBoth] = useSeed<[boolean, boolean]>("both", [false, false]);
  const seeded = useSeeded();
  // the app reads the table row by row, one student a row, counting as it goes
  const count = usePlay(300);
  const rows = flipped ? 3 : 8;
  const counting = count.running && !seeded;

  const feed = () => {
    setFed(null);
    const was = flipped;
    count.play(was ? 3 : 8, () => {
      setFed(was);
      const next: [boolean, boolean] = was ? [both[0], true] : [true, both[1]];
      setBoth(next);
      if (was) pass("নাসিবের table ভুল না, কাত করা। নাম transpose.");
    });
  };
  const flip = () => {
    if (counting) return;
    setFed(null);
    setFlipped(!flipped);
  };

  return (
    <>
      <svg viewBox="0 0 186 186" role="img" aria-label={flipped ? "table টা কাত করা: নাম উপরে, feature পাশে, 3 × 8" : "register, নাম পাশে, feature উপরে, 8 × 3"} className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect x={FS_L} y={FS_T} width={(flipped ? 8 : 3) * FS} height={(flipped ? 3 : 8) * FS} fill="white" stroke={INK} strokeOpacity={0.3} className="transition-[width,height] duration-700 motion-reduce:transition-none" />
        <path d={`M${FS_L} ${FS_T}L${FS_L + 3 * FS + 12} ${FS_T + 3 * FS + 12}`} stroke="#64748b" strokeDasharray="3 3" strokeWidth={1} />
        {counting && (
          <rect
            x={FS_L + 1}
            y={FS_T + Math.min(count.k, rows - 1) * FS + 1}
            width={(flipped ? 8 : 3) * FS - 2}
            height={FS - 2}
            rx={2}
            fill={HI}
            fillOpacity={0.28}
            className="transition-[y] duration-200 motion-reduce:transition-none"
          />
        )}
        {R_DATA.map((row, r) =>
          row.map((v, c) => {
            const [col, rw] = flipped ? [r, c] : [c, r];
            return (
              <g key={`${r}-${c}`} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none" style={{ transform: `translate(${FS_L + col * FS + FS / 2}px, ${FS_T + rw * FS + FS / 2 + 2.5}px)` }}>
                <text textAnchor="middle" fontSize={6.5} fontFamily={MONO} fill={r === c ? OK : INK} fontWeight={r === c ? 700 : 400}>
                  {fmt(c, v)}
                </text>
              </g>
            );
          }),
        )}
        {R_NAMES.map((n, r) => (
          <FS_Label key={n} text={n} i={r} top={flipped} />
        ))}
        {R_HEAD.map((h, c) => (
          <FS_Label key={h} text={h} i={c} top={!flipped} />
        ))}
      </svg>
      <div className="mx-auto mt-1 min-h-10 max-w-xs rounded-lg px-3 py-1.5 text-center font-mono text-[0.8rem] leading-snug" style={{ backgroundColor: "#0f172a", color: fed === null ? "#94a3b8" : fed ? "#fca5a5" : "#6ee7b7" }}>
        {counting ? `student গুনছি: ${Math.min(count.k + 1, rows)} জন…` : fed === null ? "team-picker: table দিন" : fed ? "3 জন student, প্রত্যেকের 8 টা feature? রাফি কি একটা feature?" : "8 জন student, 3 টা feature। ঠিক আছে।"}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button type="button" className={quietBtn} onClick={flip} disabled={counting}>
          {flipped ? "আবার সোজা করুন" : "কাত করুন"}
        </button>
        <button type="button" className={quietBtn} onClick={feed} disabled={counting}>
          App কে দিন
        </button>
      </div>
      <Task done={both[1]}>Table টা কাত করে নাসিবের 3 × 8 বানান। তারপর app কে দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn: three tables. Every answer plays on the table before it is
//     judged. The mela's stalls: the shapes are picked as pictures, and the
//     picked frame grows over the numbers (5 × 3 fits; 3 × 5 sticks out past
//     the table, 15 runs off the edge). A blank 4 × 7: tap a cell and a finger
//     walks to it, down the rows first, then across, and the cell says its own
//     name (a₂₅ is right). The kabaddi team: what is one row? The pick is
//     outlined on the sheet: a player's row, a column, or the whole table.

const YT_STALLS = ["চটপটি", "ফুচকা", "জিলাপি", "বই", "পুতুল"];
const YT_STALL_DATA = [
  [40, 30, 6],
  [65, 20, 6],
  [30, 50, 4],
  [12, 80, 8],
  [20, 60, 8],
];
const YT_SHAPES: [string, number, number][] = [
  ["5 × 3", 5, 3],
  ["3 × 5", 3, 5],
  ["15", 1, 15],
];
const YT_KABADDI = ["মিঠু", "রবিন", "আলিফ", "সজল", "নয়ন", "তপু", "ইমন"];
const YT_KABADDI_DATA = [
  [1.6, 50],
  [1.64, 55],
  [1.58, 47],
  [1.7, 61],
  [1.62, 52],
  [1.66, 58],
  [1.6, 49],
];
const YT_ROW = ["একজন খেলোয়াড়", "একটা feature, সবার জন্য", "পুরা team"];
const YT_G: Geo = { nw: 36, cw: 30, rh: 12, hh: 14 };
/** the kabaddi pick outlined on its sheet: one player's row, the height column, the whole table */
const YT_OUTLINE: [number, number, number, number][] = [
  [2, YT_G.hh, YT_G.nw + 2 * YT_G.cw, YT_G.rh],
  [YT_G.nw, 2, YT_G.cw, YT_G.hh + 7 * YT_G.rh],
  [0.5, 0.5, YT_G.nw + 2 * YT_G.cw + 3, YT_G.hh + 7 * YT_G.rh + 3],
];

/** a shape as a small block of cells, for a Choice (ink follows the Choice) */
function R_Block({ rows, cols }: { rows: number; cols: number }) {
  const s = Math.min(4.4, 36 / Math.max(rows, cols));
  const w = cols * s;
  const h = rows * s;
  return (
    <svg viewBox="0 0 40 38" role="img" aria-label={`${rows} row, ${cols} column`} className="block h-auto w-[2.4rem] shrink-0">
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <rect key={`${r}-${c}`} x={20 - w / 2 + c * s + 0.4} y={19 - h / 2 + r * s + 0.4} width={s - 0.8} height={s - 0.8} rx={0.5} className="fill-current opacity-60" />
        )),
      )}
    </svg>
  );
}

/** the finger's route to a cell of the blank 4 × 7: down the row numbers first, then across */
const yt_route = (r: number, c: number): [number, number][] => [
  ...Array.from({ length: r + 1 }, (_, i): [number, number] => [i, -1]),
  ...Array.from({ length: c + 1 }, (_, j): [number, number] => [r, j]),
];

export function YourTables() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [cell, setCell] = useSeed<[number, number] | null>("cell", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const seeded = useSeeded();
  const p = usePlay(240);
  const playing = p.running && !seeded;

  const next = () => {
    setPick(null);
    setCell(null);
    if (round === 2) pass("জিনিস × feature. Shape পড়া হয়ে গেলো।");
    setRound(round + 1);
  };
  // a pick plays for `ticks` × 240ms; a right one then moves on, a wrong one is counted
  const choose = (i: number, right: number, ticks: number) => {
    if (playing) return;
    setPick(i);
    p.play(ticks, () => (i === right ? next() : setMiss((m) => m + 1)));
  };
  const tapCell = (r: number, c: number) => {
    if (playing) return;
    setCell([r, c]);
    const right = r === 1 && c === 4;
    // the walk, then a short look at the cell's name
    p.play(yt_route(r, c).length - 1 + (right ? 4 : 2), () => (right ? next() : setMiss((m) => m + 1)));
  };

  const doneRounds: [string, boolean][] = [
    ["মেলার stall", round > 0],
    ["a₂₅", round > 1],
    ["কাবাডি team", round > 2],
  ];

  // round 0: the picked frame's size, grown from nothing
  const [, fr, fc] = round >= 3 ? YT_SHAPES[0] : pick !== null && round === 0 ? YT_SHAPES[pick] : ["", 0, 0];
  const [fw, fh] = useTween([fc * YT_G.cw, fr * YT_G.rh], 650);
  // round 1: where the finger is on its walk
  const route = cell ? yt_route(cell[0], cell[1]) : [[0, -1] as [number, number]];
  const at = route[Math.min(playing ? p.k : route.length - 1, route.length - 1)];
  const [gx, gy] = useTween([at[1] < 0 ? -6 : at[1] * 18 + 8.5, at[0] * 14 + 6.5], 200);
  const landed = cell !== null && (!playing || p.k >= route.length - 1);

  let body: ReactNode = null;
  if (round === 0 || round >= 3) {
    const good = pick === 0 || round >= 3;
    body = (
      <>
        <svg viewBox="-2 -2 192 84" role="img" aria-label="বৈশাখী মেলার পাঁচটা stall: কয়টা বিক্রি, দাম, কয় ঘণ্টা খোলা" className="mx-auto block h-auto w-full max-w-[19rem]">
          <Sheet data={YT_STALL_DATA.map((r) => r.map(String))} names={YT_STALLS} head={["বিক্রি", "দাম", "ঘণ্টা"]} g={YT_G} />
          {fw > 0.5 && <rect x={YT_G.nw} y={YT_G.hh} width={fw} height={fh} rx={3} fill={good ? OK : BAD} fillOpacity={0.12} stroke={good ? OK : BAD} strokeWidth={1.6} />}
        </svg>
        {round === 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {YT_SHAPES.map(([t, r, c], i) => (
              <Choice key={t} n={i} look={pick === i && !playing ? (i === 0 ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={playing} onClick={() => choose(i, 0, 4)}>
                <span className="flex flex-col items-center gap-0.5">
                  <R_Block rows={r} cols={c} />
                  <span className="font-mono text-sm">{t}</span>
                </span>
              </Choice>
            ))}
          </div>
        )}
        {round === 0 && pick !== null && pick !== 0 && !playing && (
          <Nope key={miss}>{pick === 1 ? "Frame টা কাত হয়ে গেলো। Stall কয়টা, আর প্রতিটার কয়টা number?" : "15 টা number ঠিকই। কিন্তু shape বলে কী? কয়টা row, কয়টা column।"}</Nope>
        )}
      </>
    );
  } else if (round === 1) {
    const right = cell !== null && cell[0] === 1 && cell[1] === 4;
    body = (
      <>
        <svg viewBox="-12 -12 150 76" role="img" aria-label="4 row আর 7 column এর একটা খালি ছক" className="mx-auto block h-auto w-full max-w-[17rem]">
          {Array.from({ length: 7 }, (_, c) => (
            <text key={`c${c}`} x={c * 18 + 9} y={-3} textAnchor="middle" fontSize={7} fontWeight={700} fontFamily={MONO} fill="#64748b">
              {c + 1}
            </text>
          ))}
          {Array.from({ length: 4 }, (_, r) => (
            <text key={`r${r}`} x={-4} y={r * 14 + 10} textAnchor="end" fontSize={7} fontWeight={700} fontFamily={MONO} fill="#64748b">
              {r + 1}
            </text>
          ))}
          {Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 7 }, (_, c) => {
              const on = cell !== null && landed && cell[0] === r && cell[1] === c;
              return (
                <g key={`${r}-${c}`} {...press(() => tapCell(r, c))} aria-label={`row ${r + 1}, column ${c + 1}`} className="cursor-pointer outline-none">
                  <rect x={c * 18} y={r * 14} width={17} height={13} rx={2} fill={on ? (right ? OK : BAD) : "white"} fillOpacity={on ? 0.25 : 1} stroke={INK} strokeOpacity={0.3} />
                  {on && (
                    <text x={c * 18 + 8.5} y={r * 14 + 9.5} textAnchor="middle" fontSize={6.5} fontWeight={700} fontFamily={MONO} fill={right ? OK : BAD} className={POP}>
                      a{r + 1}
                      {c + 1}
                    </text>
                  )}
                </g>
              );
            }),
          )}
          {cell && playing && <circle cx={gx} cy={gy} r={5} fill={HI} fillOpacity={0.35} stroke={HI} className="pointer-events-none" />}
        </svg>
        <div className="text-center text-sm font-medium text-muted">4 × 7 এর একটা matrix। a₂₅ কোন ঘরটা? Tap করুন।</div>
        {cell && !right && !playing && (
          <Nope key={miss}>
            এটা a{cell[0] + 1}
            {cell[1] + 1}: row {cell[0] + 1}, column {cell[1] + 1}. আগে row।
          </Nope>
        )}
      </>
    );
  } else {
    const box = pick === null ? null : YT_OUTLINE[pick];
    body = (
      <>
        <svg viewBox="-2 -2 110 106" role="img" aria-label="কাবাডি team এর সাতজন, প্রত্যেকের height আর weight" className="mx-auto block h-auto w-full max-w-[12rem]">
          <Sheet data={YT_KABADDI_DATA.map((r) => r.map((v, c) => fmt(c, v)))} names={YT_KABADDI} g={YT_G} />
          {box && (
            <g key={`${pick}${miss}`}>
              <rect x={box[0]} y={box[1]} width={box[2]} height={box[3]} rx={3} fill={pick === 0 ? OK : BAD} fillOpacity={0.14} className={FADE} />
              <Draw d={`M${box[0]} ${box[1]}h${box[2]}v${box[3]}h${-box[2]}Z`} strokeWidth={1.6} ms={700} className={pick === 0 ? "stroke-[#0d9488]" : "stroke-[#e11d48]"} />
            </g>
          )}
        </svg>
        <div className="grid gap-1.5">
          {YT_ROW.map((t, i) => (
            <Choice key={t} n={i} look={pick === i && !playing ? (i === 0 ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={playing} onClick={() => choose(i, 0, 4)}>
              {t}
            </Choice>
          ))}
        </div>
        {pick !== null && pick !== 0 && !playing && <Nope key={miss}>{pick === 1 ? "ওটা একটা column। সবার height. Row টা পড়ে পাশাপাশি।" : "পুরা team হলো পুরা table টা। একটা row তার চেয়ে ছোট।"}</Nope>}
      </>
    );
  }

  return (
    <>
      <div key={round} className={FADE}>
        {body}
      </div>
      <Ticks items={doneRounds} />
      <Task done={round >= 3}>তিনটা table, একটা একটা করে। {round === 2 ? "কাবাডি team: একটা row মানে কী?" : round === 0 ? "মেলার stall: shape কত?" : ""}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it: class eight's register, not yet a matrix. Tap every column that
//     must change. নাম steps out to the side as row labels; দলে? turns into 1/0
//     and steps out as y. A number column shakes: it is fine already. When both
//     are out, a frame draws round what is left: the matrix.

const TM_NAMES = ["জামিল", "অর্ণব", "তুহিন", "রাসেল"];
const TM_DATA = [
  [1.66, 60],
  [1.7, 66],
  [1.62, 57],
  [1.68, 70],
];
const TM_YES = [true, false, true, true];
const TM_W = 34;
const TM_RH = 14;
const TM_HH = 15;

export function TryIsItAMatrix() {
  const pass = useGate();
  const [names, setNames] = useSeed("names", false);
  const [yes, setYes] = useSeed("yes", false);
  const [bad, setBad] = useSeed<number | null>("bad", null);
  const [miss, setMiss] = useSeed("miss", 0);
  // the column's glide (700ms) and then the frame drawing round the matrix (800ms)
  const close = usePlay(1500);
  const done_ = () => close.play(1, () => pass("নাম পাশে, হ্যাঁ/না এখন 1/0। এবার matrix."));

  const tap = (col: number) => {
    if (col === 0 && !names) {
      setNames(true);
      if (yes) done_();
    } else if (col === 3 && !yes) {
      setYes(true);
      if (names) done_();
    } else if (col === 1 || col === 2) {
      setBad(col);
      setMiss(miss + 1);
    }
  };
  const colX = (c: number) => 44 + c * TM_W + (c === 0 && names ? -40 : 0) + (c === 3 && yes ? 14 : 0);
  const done = names && yes;
  const heads = ["নাম", "height", "weight", "দলে?"];

  return (
    <>
      <svg viewBox="0 -14 230 96" role="img" aria-label="ক্লাস এইটের register: নাম, height, weight, দলে কি-না" className="mx-auto block h-auto w-full max-w-[19rem]">
        {heads.map((h, c) => (
          <g
            key={h}
            {...press(() => tap(c))}
            aria-label={`${h} column`}
            className="cursor-pointer outline-none transition-transform duration-700 ease-in-out motion-reduce:transition-none"
            style={{ transform: `translateX(${colX(c)}px)` }}
          >
            <rect
              x={0}
              y={0}
              width={TM_W}
              height={TM_HH + 4 * TM_RH + 2}
              rx={3}
              fill={bad === c ? BAD : "white"}
              fillOpacity={bad === c ? 0.12 : 1}
              stroke={INK}
              strokeOpacity={(c === 0 && names) || (c === 3 && yes) ? 0.15 : 0.3}
              className={bad === c ? "nudge" : undefined}
              key={bad === c ? miss : 0}
            />
            <text x={TM_W / 2} y={10} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={c === 0 && names ? "#64748b" : INK}>
              {c === 3 && yes ? "y" : h}
            </text>
            {TM_NAMES.map((n, r) => {
              const v = c === 0 ? n : c === 3 ? (yes ? (TM_YES[r] ? "1" : "0") : TM_YES[r] ? "হ্যাঁ" : "না") : fmt(c - 1, TM_DATA[r][c - 1]);
              return (
                <text key={`${r}${v}`} x={TM_W / 2} y={TM_HH + r * TM_RH + 10} textAnchor="middle" fontSize={7.5} fontFamily={/[ঀ-৿]/.test(v) ? undefined : MONO} fill={c === 0 && names ? "#64748b" : INK} className={c === 3 && yes ? POP : undefined}>
                  {v}
                </text>
              );
            })}
          </g>
        ))}
        {done && (
          <g>
            <Draw d={`M${44 + TM_W - 2} -3H${44 + 3 * TM_W + 2}V${TM_HH + 4 * TM_RH + 5}H${44 + TM_W - 2}Z`} strokeWidth={1.8} ms={800} delay={700} className="stroke-[#0d9488]" />
            <text x={44 + 2 * TM_W} y={-6} textAnchor="middle" fontSize={9} fontWeight={800} fill={OK} className={FADE}>
              X
            </text>
          </g>
        )}
      </svg>
      {bad !== null && !done && <Nope key={miss}>এগুলো তো number-ই আছে। সমস্যা অন্য column এ।</Nope>}
      <Task done={done}>App এটা নেবে না। যে column গুলো বদলাতে হবে, সেগুলোতে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. Watch-only, driven by the reader (useScene). The teachers'
// room: a table with the register and the club's laptop. The PT sir borrows
// Mama's look, the art sir Nana's; each gets his own name drawn as text.

function S_Table({ x = 100, w = 130 }: { x?: number; w?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={118} width={w} height={6} rx={1} fill="#92400e" />
      <rect x={x + 6} y={124} width={4} height={26} fill="#78350f" />
      <rect x={x + w - 10} y={124} width={4} height={26} fill="#78350f" />
    </g>
  );
}

function S_Laptop({ x, text }: { x: number; text?: string }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={98} width={30} height={20} rx={2} fill="#0f172a" />
      <path d={`M${x - 3} 118H${x + 33}`} stroke="#334155" strokeWidth={2} />
      {text && (
        <text x={x + 15} y={111} textAnchor="middle" fontSize={5.5} fontFamily={MONO} fill="#e2e8f0" className={FADE}>
          {text}
        </text>
      )}
    </g>
  );
}

function S_Register({ x }: { x: number }) {
  return (
    <g className={POP}>
      <rect x={x} y={110} width={26} height={8} rx={1} fill="#1d4ed8" />
      <rect x={x + 10} y={108} width={6} height={3} rx={1} fill="#94a3b8" />
    </g>
  );
}

function S_Name({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
      {text}
    </text>
  );
}

// 1a · The teachers' room before tiffin. The friends round the laptop; the
//      PT sir comes in, drops the register, says his line; the app asks the
//      shape; four answers go up. Which is right is left to the screen.

export function TeachersRoom({}: Story) {
  const s = useScene(4, [600, 1600, 2400, 1600, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="টিচার্স কমনরুম; খেলার স্যার register রেখে বললেন লিস্ট দিয়া দাও, যন্ত্র বাকিটা বুঝবো; app জিজ্ঞেস করলো shape কত; চারজন চার রকম উত্তর দিলো">
        <rect x={20} y={30} width={60} height={40} rx={2} fill="#e7d7c1" stroke={INK} strokeOpacity={0.2} />
        <S_Table />
        <S_Laptop x={150} text={k >= 3 ? "shape = ?" : undefined} />
        {k >= 1 && <S_Register x={112} />}
        <Person who="nasib" x={42} y={150} label mood={k >= 4 ? "smug" : "plain"} />
        <Person who="som" x={96} y={150} label />
        <Person who="samin" x={166} y={150} facing={-1} label arm={k >= 3 ? "point" : "down"} />
        <Person who="karim" x={222} y={150} facing={-1} label mood={k >= 4 ? "happy" : "plain"} />
        <Person who="mama" x={k >= 1 ? 280 : 360} y={150} facing={-1} walking={k === 1} />
        {k >= 1 && <S_Name x={280} y={150} text="খেলার স্যার" />}
        {k === 2 && <Bubble x={280} y={84} side="left" lines={["লিস্ট দিয়া দাও।", "যন্ত্র বাকিটা বুঝবো।"]} />}
        {k >= 4 && (
          <>
            <Card x={42} y={72} text="3 × 8" tone="coral" />
            <Card x={96} y={72} text="8 × 4" tone="amber" />
            <Card x={166} y={72} text="8 × 3" tone="teal" />
            <Bubble x={222} y={84} side="right" lines={["যেটাই দাও।"]} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 2a · The register opens: it's eight slips under a clip. They spill across
//      the table, and Karim asks whose weight is highest.

export function CardsSpill({}: Story) {
  const s = useScene(2, [600, 1400, 2400]);
  const k = s.k;
  const slips = [104, 118, 132, 146, 160, 174, 188, 202];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="register টা আসলে আটটা slip, একটা clip দিয়ে আটকানো; clip খুলতেই slip গুলো টেবিলে ছড়িয়ে গেলো; করিম জিজ্ঞেস করলো কার weight সবচেয়ে বেশি">
        <S_Table x={90} w={150} />
        {slips.map((x, i) => (
          <rect
            key={x}
            x={0}
            y={0}
            width={16}
            height={5}
            rx={1}
            fill="white"
            stroke={INK}
            strokeOpacity={0.4}
            className="transition-transform duration-700 ease-out motion-reduce:transition-none"
            style={{ transform: k >= 1 ? `translate(${x}px, ${112 - (i % 3) * 2}px) rotate(${((i * 37) % 25) - 12}deg)` : `translate(150px, ${110 - i * 0.6}px)` }}
          />
        ))}
        {k < 1 && <rect x={156} y={106} width={5} height={4} rx={1} fill="#94a3b8" />}
        <Person who="samin" x={70} y={150} label arm={k === 0 ? "hold" : "down"} />
        <Person who="karim" x={262} y={150} facing={-1} label mood={k >= 2 ? "puzzled" : "plain"} arm={k >= 2 ? "point" : "down"} />
        {k >= 2 && <Bubble x={262} y={84} side="left" lines={["কার weight", "সবচেয়ে বেশি?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · The PT sir calls a cell. Nasib and Samin each put a finger down, in
//      two different places. Whose is right is left to the screen.

export function SirCalls({}: Story) {
  const s = useScene(2, [600, 2400, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="খেলার স্যার বললেন row 2, column 3; নাসিব আর সামিন দুই জায়গায় আঙুল রাখলো">
        <Person who="mama" x={160} y={150} facing={-1} />
        <S_Name x={160} y={150} text="খেলার স্যার" />
        <S_Table x={96} w={130} />
        <rect x={130} y={112} width={60} height={6} rx={1} fill="white" stroke={INK} strokeOpacity={0.4} />
        <Person who="nasib" x={80} y={150} label arm={k >= 2 ? "point" : "down"} />
        <Person who="samin" x={244} y={150} facing={-1} label arm={k >= 2 ? "point" : "down"} />
        {k >= 1 && <Bubble x={160} y={84} lines={["row 2, column 3.", "ওইটা কত?"]} />}
        {k >= 2 && (
          <>
            <circle cx={144} cy={115} r={3} fill={HI} className={POP} />
            <circle cx={180} cy={115} r={3} fill={OK} className={POP} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Som turns to the register's last page, where the PT sir marked each
//      name হ্যাঁ or না after the trials, and wants it given to the app too.

export function SomsColumn({}: Story) {
  const s = useScene(2, [600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সোম খাতার শেষ পাতা উল্টালো; সেখানে প্রত্যেকের পাশে হ্যাঁ বা না লেখা; সোম বললো এই column টাও দিতে হবে">
        <S_Table x={100} w={130} />
        <S_Laptop x={180} />
        {k >= 1 && (
          <g className={POP}>
            <rect x={116} y={60} width={50} height={56} rx={2} fill="white" stroke={INK} strokeOpacity={0.4} />
            {R_TEAM.slice(0, 6).map((t, i) => (
              <text key={i} x={141} y={71 + i * 8} textAnchor="middle" fontSize={6.5} fontWeight={600} fill={t ? OK : BAD}>
                {t ? "হ্যাঁ" : "না"}
              </text>
            ))}
          </g>
        )}
        <Person who="som" x={76} y={150} label arm={k >= 1 ? "hold" : "down"} mood={k >= 2 ? "smug" : "plain"} />
        <Person who="samin" x={262} y={150} facing={-1} label />
        {k >= 2 && <Bubble x={76} y={84} side="right" lines={["এই column টাও", "দিতে হবে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · Nasib points at the school notice board, where lists run across: names
//      along the top, in one line.

export function NasibsBoard({}: Story) {
  const s = useScene(2, [600, 1400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="দেয়ালে স্কুলের notice board, সেখানে নাম পাশাপাশি এক লাইনে; নাসিব দেখিয়ে বললো আমি ওইভাবেই গুনেছি, 3 × 8">
        <rect x={168} y={26} width={146} height={70} rx={3} fill="#a16207" />
        <rect x={173} y={31} width={136} height={60} rx={2} fill="#fef3c7" />
        {k >= 1 &&
          R_NAMES.map((n, i) => (
            <g key={n} className={FADE} style={{ transitionDelay: `${i * 90}ms` }}>
              <rect x={176 + i * 16.5} y={38} width={15} height={48} rx={1} fill="white" stroke={INK} strokeOpacity={0.2} />
              <text x={0} y={0} fontSize={5.5} fontWeight={600} fill={INK} transform={`translate(${182 + i * 16.5} 42) rotate(90)`}>
                {n}
              </text>
            </g>
          ))}
        <Person who="nasib" x={110} y={150} label arm={k >= 1 ? "point" : "down"} mood={k >= 2 ? "smug" : "plain"} />
        {k >= 2 && <Bubble x={110} y={84} lines={["নাম উপরে,", "তাই 3 × 8।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 10a · The bell. The laptop works a moment and prints the team; Karim reads
//       it, his own name first.

export function BellRings({}: Story) {
  const s = useScene(3, [600, 1400, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="টিফিনের ঘণ্টা পড়লো; app আটজনের পাশে হ্যাঁ না বসিয়ে দিলো; করিম লিস্ট পড়লো, নিজের নাম সবার আগে">
        <g className="pointer-events-none">
          <path d="M40 20V34" stroke="#78350f" strokeWidth={1.5} />
          <circle cx={40} cy={44} r={11} fill="#ca8a04" stroke="#854d0e" />
          {k >= 1 &&
            [16, 22, 28].map((r, i) => (
              <circle key={r} cx={40} cy={44} r={r} fill="none" stroke="#ca8a04" strokeOpacity={0.5 - i * 0.12} className={FADE} style={{ transitionDelay: `${i * 150}ms` }} />
            ))}
        </g>
        <S_Table x={100} w={130} />
        <S_Laptop x={150} text={k >= 2 ? "team ✓" : k >= 1 ? "…" : undefined} />
        <Person who="samin" x={120} y={150} label />
        <Person who="karim" x={236} y={150} facing={-1} label arm={k >= 3 ? "hold" : "down"} mood={k >= 3 ? "happy" : "plain"} />
        {k >= 3 && (
          <>
            <rect x={238} y={100} width={14} height={18} rx={1} fill="white" stroke={INK} strokeOpacity={0.4} className={POP} />
            <Bubble x={236} y={84} side="left" lines={["এক নম্বরে: করিম।"]} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 10b · After school, the gate. The art sir chalks an even grid on the road;
//       Rina holds a small graph paper with a fish and a lotus; the art sir's
//       line. What the grid will do is the next journey.

export function ArtSirRoad({}: Story) {
  const s = useScene(3, [600, 1800, 1400, 2800]);
  const k = s.k;
  const xs = [150, 175, 200, 225, 250, 275, 300];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={120} label="ছুটির পর গেটের সামনে; আর্ট স্যার রাস্তায় chalk দিয়ে সমান সমান ঘর কাটছেন; রিনার হাতে graph paper এ একটা মাছ আর একটা পদ্ম; আর্ট স্যার বললেন এই ঘর দিয়াই পুরা আলপনা তুইল্যা নিমু">
        <rect x={26} y={50} width={14} height={70} fill="#b91c1c" />
        <rect x={20} y={44} width={26} height={8} fill="#7f1d1d" />
        {k >= 1 && (
          <g>
            {[132, 148, 164].map((y, i) => (
              <Draw key={y} d={`M140 ${y}H310`} strokeWidth={1.2} ms={700} delay={i * 150} className="stroke-white" />
            ))}
            {xs.map((x, i) => (
              <Draw key={x} d={`M${x} 124V172`} strokeWidth={1.2} ms={500} delay={400 + i * 90} className="stroke-white" />
            ))}
          </g>
        )}
        <Person who="nana" x={112} y={160} facing={1} arm={k >= 1 ? "point" : "down"} />
        <S_Name x={112} y={160} text="আর্ট স্যার" />
        <Person who="rina" x={66} y={160} label arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && (
          <g className={POP}>
            <rect x={70} y={104} width={22} height={18} fill="white" stroke="#0284c7" strokeOpacity={0.6} />
            <path d="M74 114q5 -5 10 0q-5 5 -10 0Z" fill="#0284c7" />
            <circle cx={87} cy={110} r={2.5} fill="#db2777" />
          </g>
        )}
        {k >= 3 && <Bubble x={112} y={94} side="right" lines={["এই ঘর দিয়াই পুরা", "আলপনা তুইল্যা নিমু।"]} />}
      </Stage>
    </StoryFrame>
  );
}

/** Whether the reader asked for less motion (cast's own check, copied: it isn't exported). */
function R_useCalm() {
  const [calm, setCalm] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser's motion setting, which the server render cannot see
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return calm;
}

/** a sheet of paper in a story scene, with a small label over it */
function S_Paper({ x, y, label, rot = 0, children }: { x: number; y: number; label?: string; rot?: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} className={POP}>
      <rect x={-13} y={-16} width={26} height={32} rx={1.5} fill="white" stroke={INK} strokeOpacity={0.45} />
      {children}
      {label && (
        <text y={-20} textAnchor="middle" fontSize={7} fontWeight={700} fontFamily={/[ঀ-৿]/.test(label) ? undefined : MONO} fill={INK}>
          {label}
        </text>
      )}
    </g>
  );
}

// 8a · Ten minutes to the bell. A class-seven boy comes to the door with three
//      papers: the mela's stall accounts, the maths sir's blank 4 × 7, the
//      kabaddi team. He isn't in the cast: he borrows Fahim's look (Fahim is in
//      no other scene of 6.1) and gets his own words drawn under his feet.

export function ThreePapers({}: Story) {
  const s = useScene(2, [600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ঘণ্টা পড়তে আর দশ মিনিট; দরজায় ক্লাস সেভেনের একজন এসে দাঁড়ালো, হাতে তিনটা কাগজ: মেলার stall এর হিসাব, খালি 4 × 7 ছক, কাবাডি team">
        {/* the door */}
        <rect x={10} y={46} width={52} height={104} fill="#92400e" />
        <rect x={15} y={51} width={42} height={99} fill="#3f2a1d" />
        {/* the wall clock, ten to the hour */}
        <g className="pointer-events-none">
          <circle cx={170} cy={40} r={13} fill="white" stroke={INK} strokeOpacity={0.5} strokeWidth={1.5} />
          <path d="M170 40V31" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
          <path d="M170 40l-7.5 -4.3" stroke={INK} strokeWidth={1} strokeLinecap="round" />
        </g>
        <S_Table x={176} w={120} />
        <S_Laptop x={240} />
        <Person who="som" x={214} y={150} facing={-1} label />
        <Person who="samin" x={292} y={150} facing={-1} label />
        <Person who="fahim" x={k >= 1 ? 88 : -24} y={150} walking={k === 1} arm={k >= 2 ? "hold" : "down"} />
        {k >= 1 && <S_Name x={88} y={150} text="সেভেনের একজন" />}
        {k >= 2 && (
          <g>
            <S_Paper x={78} y={80} rot={-8} label="মেলা">
              {[0, 1, 2, 3].map((r) => (
                <path key={r} d={`M-9 ${-9 + r * 6}h18`} stroke={INK} strokeOpacity={0.35} />
              ))}
            </S_Paper>
            <g style={{ transitionDelay: "250ms" }} className={FADE}>
              <S_Paper x={112} y={74} rot={3} label="4 × 7">
                {Array.from({ length: 4 }, (_, r) =>
                  Array.from({ length: 7 }, (_, c) => <rect key={`${r}-${c}`} x={-10.5 + c * 3} y={-8 + r * 4} width={2.6} height={3.4} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={0.4} />),
                )}
              </S_Paper>
            </g>
            <g style={{ transitionDelay: "500ms" }} className={FADE}>
              <S_Paper x={146} y={82} rot={9} label="কাবাডি">
                {[0, 1, 2, 3, 4].map((r) => (
                  <path key={r} d={`M-9 ${-10 + r * 5}h${r % 2 ? 12 : 16}`} stroke={INK} strokeOpacity={0.35} />
                ))}
              </S_Paper>
            </g>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Class eight's register arrives with a note: আমাদেরটাও app এ দিও. Samin
//      looks at the paper once and shakes his head. What is wrong with it is
//      the screen's question.

export function EightsNote({}: Story) {
  const s = useScene(3, [600, 1400, 2200, 1800]);
  const k = s.k;
  const calm = R_useCalm();
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ক্লাস এইট নিজেদের register পাঠিয়েছে, সাথে চিরকুট: আমাদেরটাও app এ দিও; সামিন কাগজটা একবার দেখে মাথা নাড়লো">
        <S_Table x={120} w={150} />
        <S_Laptop x={128} />
        {/* the register slides in along the table, the note on top of it */}
        <g className="transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: k >= 1 ? "translate(0px, 0px)" : "translate(140px, 0px)" }}>
          <rect x={186} y={110} width={44} height={8} rx={1} fill="white" stroke={INK} strokeOpacity={0.45} />
          {[196, 206, 216].map((x) => (
            <path key={x} d={`M${x} 111V117`} stroke={INK} strokeOpacity={0.3} />
          ))}
          <rect x={214} y={104} width={12} height={7} rx={1} fill="#fde68a" stroke="#a16207" strokeOpacity={0.6} />
        </g>
        {k >= 2 && (
          <g className={POP}>
            <path d="M216 70L220 103" stroke="#a16207" strokeOpacity={0.5} strokeDasharray="2 2" />
            <rect x={176} y={40} width={66} height={30} rx={2} fill="#fef3c7" stroke="#a16207" strokeOpacity={0.6} />
            <text x={209} y={53} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
              আমাদেরটাও
            </text>
            <text x={209} y={64} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
              app এ দিও।
            </text>
          </g>
        )}
        <g>
          <Loop on={k >= 3 && !calm} run={`${k}`} ms={1200} type="translate" values="0 0;-1.6 0;1.6 0;-1.6 0;0 0" dur={0.6} />
          <Person who="samin" x={96} y={150} label arm={k >= 2 ? "point" : "down"} />
        </g>
        {k >= 3 && (
          <g className={FADE}>
            <path d="M82 94q-3 4 0 8M110 94q3 4 0 8" fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={1.1} strokeLinecap="round" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · Two faces. A vector was a list and an arrow; a table of numbers has a
//      name too, and a second face, left as "?".

const X1_SAY = ["2.1 আর 2.2: একই vector, একবার list.", "আরেকবার arrow। দুই চেহারা।", "আজকের জিনিসটা number এর একটা table।", "এরও দ্বিতীয় একটা চেহারা আছে। ওটা পরে।"];

export function TwoFaces() {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <svg viewBox="0 0 240 96" role="img" aria-label="vector এর দুই চেহারা list আর arrow; matrix এর এক চেহারা table, আরেকটা প্রশ্নবোধক" className="mx-auto block h-auto w-full max-w-[16rem]">
        <text x={30} y={30} textAnchor="middle" fontSize={11} fontFamily={MONO} fontWeight={700} fill={INK}>
          (3, 2)
        </text>
        {k >= 1 && (
          <g>
            <path d="M14 82H70M14 82V44" stroke={INK} strokeOpacity={0.25} />
            <Draw d="M14 82L56 56" strokeWidth={2.2} className="stroke-[#2563eb]" />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d="M104 6V90" stroke={INK} strokeOpacity={0.15} />
            <rect x={120} y={14} width={48} height={46} rx={3} fill="white" stroke={INK} strokeOpacity={0.4} />
            {[0, 1, 2].map((r) => (
              <text key={r} x={144} y={28 + r * 13} textAnchor="middle" fontSize={7.5} fontFamily={MONO} fill={INK}>
                {R_DATA[r].map((v, c) => fmt(c, v)).join("  ")}
              </text>
            ))}
            <text x={144} y={74} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK}>
              table
            </text>
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={184} y={14} width={46} height={46} rx={6} fill="none" stroke="#64748b" strokeDasharray="4 3" />
            <text x={207} y={44} textAnchor="middle" fontSize={20} fontWeight={800} fill="#64748b">
              ?
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Small v, big X. The whole stack is X; one row slides out and is a
//      vector again, written small.

const X2_SAY = ["পুরা table টা একটা জিনিস। নাম বড় হাতের X।", "একটা row টেনে বের করলে আবার একটা vector।", "vector এর নাম ছোট হাতের: v। দেখেই বোঝা যায় কোনটা কী।"];

export function SmallVBigX() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const g: Geo = { nw: 34, cw: 26, rh: 10, hh: 12 };
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <svg viewBox="-16 -2 254 100" role="img" aria-label="পুরা table এর নাম X; একটা row বের করে আনলে ওটা vector v" className="mx-auto block h-auto w-full max-w-[17rem]">
        <text x={-8} y={50} textAnchor="middle" fontSize={16} fontWeight={800} fill={OK}>
          X
        </text>
        <Sheet data={cells(R_DATA)} g={g} />
        <g className="transition-transform duration-700 ease-in-out motion-reduce:transition-none" style={{ transform: k >= 1 ? "translate(122px, 18px)" : "translate(0px, 0px)" }}>
          {k >= 1 && <rect x={2} y={g.hh + 2 * g.rh} width={g.nw + 3 * g.cw} height={g.rh} rx={2} fill="white" />}
          <rect x={2} y={g.hh + 2 * g.rh} width={g.nw + 3 * g.cw} height={g.rh} rx={2} fill={HI} fillOpacity={0.3} stroke={k >= 1 ? HI : "none"} />
          {k >= 1 && (
            <text x={g.nw + 1.5 * g.cw} y={g.hh + 2 * g.rh + 7.5} textAnchor="middle" fontSize={7.5} fontFamily={MONO} fill={INK}>
              (1.49, 41, 18)
            </text>
          )}
        </g>
        {k >= 2 && (
          <text x={178} y={82} textAnchor="middle" fontSize={16} fontWeight={800} fontStyle="italic" fill="#b45309" className={POP}>
            v
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 3½ · One column, measured. The height column lifts out and its eight values
//      fall onto a number line; the spread 3.7 measured is that line's width.

const X3_SAY = ["Height এর column টা।", "আটটা height, একটা লাইনের উপরে।", "3.7 এ এই ছড়ানোটাই মেপেছিলেন। ওটা ছিল একটা column।"];

export function HeightColumn() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const hs = R_DATA.map((d) => d[0]);
  const lx = (h: number) => 60 + ((h - 1.46) / 0.2) * 160;
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <svg viewBox="0 0 240 110" role="img" aria-label="height এর column থেকে আটটা মান একটা number line এ পড়লো; ছড়ানোর চওড়াটা দাগানো" className="mx-auto block h-auto w-full max-w-[17rem]">
        <rect x={8} y={4} width={36} height={102} rx={3} fill="white" stroke={HI} />
        <text x={26} y={14} textAnchor="middle" fontSize={7} fontWeight={700} fill={INK}>
          height
        </text>
        {hs.map((h, i) => (
          <text key={i} x={26} y={26 + i * 10.5} textAnchor="middle" fontSize={7} fontFamily={MONO} fill={INK}>
            {h.toFixed(2)}
          </text>
        ))}
        {k >= 1 && (
          <g>
            <path d="M56 70H228" stroke={INK} strokeOpacity={0.4} />
            {hs.map((h, i) => (
              <circle key={i} cx={lx(h)} cy={70 - (i % 2) * 6} r={3} fill={HI} className={POP} style={{ transitionDelay: `${i * 80}ms` }} />
            ))}
            <text x={lx(1.49)} y={86} textAnchor="middle" fontSize={6.5} fontFamily={MONO} fill="#64748b">
              1.49
            </text>
            <text x={lx(1.63)} y={86} textAnchor="middle" fontSize={6.5} fontFamily={MONO} fill="#64748b">
              1.63
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d={`M${lx(1.49)} 52H${lx(1.63)}M${lx(1.49)} 48V56M${lx(1.63)} 48V56`} stroke={OK} strokeWidth={1.5} />
            <text x={(lx(1.49) + lx(1.63)) / 2} y={44} textAnchor="middle" fontSize={8} fontWeight={700} fill={OK}>
              spread
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · Row first. A finger goes down to row 2, then across to column 3, and
//      the cell's name a₂₃ is built. Then Nasib's route, column first, ends on
//      41: row 3, column 2.

const X4_SAY = ["Table এর নাম A.", "আগে নিচে নামুন: row 2। R আগে।", "তারপর পাশে যান: column 3। C পরে।", "ঘরটার নাম a₂₃। ছোট a, আগে row, পরে column.", "নাসিব আগে column গুনেছিল। তাই পৌঁছেছে row 3, column 2 তে: 41।"];

export function RowThenColumn() {
  const s = useScene(4, [600, 1600, 1600, 2400, 2600]);
  const k = s.k;
  const g: Geo = { nw: 34, cw: 26, rh: 11, hh: 13 };
  const pos: [number, number][] = [
    [0, -1],
    [1, -1],
    [1, 2],
    [1, 2],
    [1, 2],
  ];
  const [r, c] = pos[k];
  const [fx, fy] = useTween([c < 0 ? g.nw / 2 : g.nw + c * g.cw + g.cw / 2, g.hh + r * g.rh + g.rh / 2], 700);
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <svg viewBox="-10 -12 200 116" role="img" aria-label="table A; আঙুল আগে row 2 তে নামে, তারপর column 3 এ যায়; ঘরের নাম a দুই তিন; নাসিবের পথ আগে column" className="mx-auto block h-auto w-full max-w-[16rem]">
        <Sheet data={cells(R_DATA)} g={g} numbered />
        {k >= 1 && <circle cx={fx} cy={fy} r={4.5} fill={HI} fillOpacity={0.35} stroke={HI} />}
        {k >= 3 && (
          <text x={150} y={34} fontSize={13} fontWeight={700} fill={OK} className={POP}>
            a<tspan fontSize={8} dy={3}>23</tspan>
          </text>
        )}
        {k >= 4 && (
          <g>
            <Draw d={`M${g.nw + g.cw / 2} ${g.hh - 2}H${g.nw + 1.5 * g.cw}V${g.hh + 2.5 * g.rh}`} strokeWidth={1.6} className="stroke-[#e11d48]" />
            <rect x={g.nw + g.cw} y={g.hh + 2 * g.rh} width={g.cw} height={g.rh} rx={2} fill="none" stroke={BAD} className={FADE} />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 5½ · Shapes, big and mismatched. The 8 × 3 frame shrinks to a speck inside a
//      10000 × 300 table of emails; then an 8 × 3 and a 3 × 8 fail to line up.

const X5_SAY = ["আমাদের table: 8 × 3।", "10,000 email, প্রত্যেকটার 300 feature: 10000 × 300.", "8 × 3 আর 3 × 8 মিলছে না। Program বলে: shape mismatch."];

export function ShapeZoom() {
  const s = useScene(2, [600, 2200, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <svg viewBox="0 0 240 110" role="img" aria-label="8 বাই 3 এর table ছোট হয়ে 10000 বাই 300 এর বিশাল table এর কোণে; তারপর 8 বাই 3 আর 3 বাই 8 পাশাপাশি মিলছে না" className="mx-auto block h-auto w-full max-w-[16rem]">
        {k < 2 && (
          <g>
            <rect
              x={20}
              y={8}
              width={k >= 1 ? 3 : 30}
              height={k >= 1 ? 8 : 80}
              fill={OK}
              fillOpacity={0.2}
              stroke={OK}
              className="transition-[width,height] duration-700 motion-reduce:transition-none"
            />
            {k === 0 && (
              <text x={60} y={52} fontSize={10} fontWeight={700} fontFamily={MONO} fill={OK}>
                8 × 3
              </text>
            )}
            {k >= 1 && (
              <g className={FADE}>
                <rect x={20} y={8} width={200} height={96} fill="none" stroke={INK} strokeOpacity={0.5} />
                <text x={120} y={60} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily={MONO} fill={INK}>
                  10000 × 300
                </text>
              </g>
            )}
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <rect x={40} y={10} width={30} height={80} fill={OK} fillOpacity={0.2} stroke={OK} />
            <rect x={80} y={10} width={80} height={30} fill={HI} fillOpacity={0.2} stroke={HI} />
            <text x={55} y={102} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={INK}>
              8 × 3
            </text>
            <text x={120} y={52} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={INK}>
              3 × 8
            </text>
            <path d="M166 24l10 10m0 -10l-10 10" stroke={BAD} strokeWidth={2} />
            <text x={196} y={34} textAnchor="middle" fontSize={7} fontWeight={700} fill={BAD}>
              mismatch
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 6½ · X and y. The three columns go into the app; y stays beside it as the
//      answers the app has to learn to give.

const X6_SAY = ["X: app যেটা দেখে। y: app যেটা বের করতে চায়।", "X ঢোকে app এ।", "App এর উত্তর y এর সাথে মেলানো হয়। এভাবেই শেখে।"];

export function XAndY() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      <svg viewBox="0 0 240 96" role="img" aria-label="X নামের তিন column এর block app এ ঢোকে; app এর উত্তর y এর সাথে মেলানো হয়" className="mx-auto block h-auto w-full max-w-[16rem]">
        <g className="transition-transform duration-700 ease-in-out motion-reduce:transition-none" style={{ transform: k >= 1 ? "translateX(84px) scale(0.6)" : "none", transformOrigin: "20px 48px" }}>
          <rect x={10} y={10} width={48} height={76} rx={3} fill={OK} fillOpacity={0.15} stroke={OK} />
          <text x={34} y={54} textAnchor="middle" fontSize={16} fontWeight={800} fill={OK}>
            X
          </text>
        </g>
        <rect x={112} y={26} width={56} height={40} rx={4} fill="#0f172a" />
        <text x={140} y={50} textAnchor="middle" fontSize={7} fontFamily={MONO} fill="#e2e8f0">
          app
        </text>
        {k >= 2 && (
          <g className={FADE}>
            <Draw d="M170 46H190" strokeWidth={1.5} className="stroke-[#0f1b2d]" />
            <rect x={192} y={10} width={16} height={76} rx={2} fill="white" stroke={INK} strokeOpacity={0.4} />
            {[1, 0, 1, 1, 0, 1].map((v, i) => (
              <text key={i} x={200} y={24 + i * 11} textAnchor="middle" fontSize={7} fontFamily={MONO} fill={INK}>
                {v}
              </text>
            ))}
            <rect x={190} y={60} width={44} height={10} rx={2} fill="none" stroke={BAD} />
          </g>
        )}
        <rect x={216} y={10} width={16} height={76} rx={2} fill="white" stroke="#b45309" />
        {[1, 0, 1, 1, 1, 1].map((v, i) => (
          <text key={i} x={224} y={24 + i * 11} textAnchor="middle" fontSize={7} fontFamily={MONO} fill={INK}>
            {v}
          </text>
        ))}
        <text x={224} y={7} textAnchor="middle" fontSize={9} fontWeight={800} fontStyle="italic" fill="#b45309">
          y
        </text>
        {k >= 2 && (
          <text x={212} y={94} textAnchor="middle" fontSize={7} fontWeight={700} fill={BAD} className={FADE}>
            এখানে ভুল
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 7½ · The transpose, small. A 2 × 3 matrix, the diagonal drawn, every number
//      swinging to its mirror place: a 3 × 2, named Aᵀ.

const X7_A = [
  [1, 2, 3],
  [4, 5, 6],
];
const X7_SAY = ["A: 2 × 3.", "Diagonal টা, কোণ থেকে কোনাকুনি।", "প্রতিটা number diagonal এর ওপারে তার আয়নার জায়গায়।", "3 × 2. নাম Aᵀ।"];

export function DiagonalFlip() {
  const s = useScene(3, [600, 1400, 1800, 2200]);
  const k = s.k;
  const S = 20;
  return (
    <Scene scene={s} caption={say(X7_SAY, k)}>
      <svg viewBox="0 0 150 90" role="img" aria-label="2 বাই 3 এর matrix diagonal বরাবর উল্টে 3 বাই 2 হয়ে গেলো" className="mx-auto block h-auto w-full max-w-[12rem]">
        <g transform="translate(30 10)">
          {k >= 1 && <Draw d={`M-6 -6L${3 * S + 6} ${3 * S + 6}`} strokeWidth={1} className="stroke-[#64748b]" />}
          {X7_A.map((row, r) =>
            row.map((v, c) => {
              const [x, y] = k >= 2 ? [r, c] : [c, r];
              return (
                <g key={v} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none" style={{ transform: `translate(${x * S + S / 2}px, ${y * S + S / 2 + 3}px)` }}>
                  <text textAnchor="middle" fontSize={9} fontFamily={MONO} fontWeight={r === c ? 800 : 500} fill={r === c ? OK : INK}>
                    {v}
                  </text>
                </g>
              );
            }),
          )}
          <text x={-14} y={24} textAnchor="middle" fontSize={11} fontWeight={800} fill={INK}>
            A
          </text>
          {k >= 3 && (
            <text x={86} y={34} fontSize={11} fontWeight={800} fill={OK} className={POP}>
              Aᵀ
            </text>
          )}
        </g>
      </svg>
    </Scene>
  );
}

// 7¾ · A figure for screen 7's side quest: a square matrix that is its own
//      transpose. 3 × 3, the diagonal drawn, every number swings to its mirror
//      place and the table reads the same: symmetric. Each pair shares a colour.

const X7S_A = [
  [2, 5, 7],
  [5, 1, 4],
  [7, 4, 3],
];
const X7S_TONE: Record<number, string> = { 5: "#b45309", 7: "#2563eb", 4: "#e11d48" };
const X7S_SAY = ["3 row, 3 column. সমান, তাই square।", "Diagonal টা, কোণ থেকে কোনাকুনি।", "প্রতিটা number তার আয়নার জায়গায় গেলো।", "কাত করার পরও table একই। এটা symmetric."];

export function SymmetricFlip() {
  const s = useScene(3, [600, 1400, 1800, 2200]);
  const k = s.k;
  const S = 20;
  return (
    <Scene scene={s} caption={say(X7S_SAY, k)}>
      <svg viewBox="0 0 150 80" role="img" aria-label="3 বাই 3 এর একটা matrix diagonal বরাবর উল্টানো হলো, কিন্তু একই থাকলো" className="mx-auto block h-auto w-full max-w-[12rem]">
        <g transform="translate(44 10)">
          <rect x={-3} y={-3} width={3 * S + 6} height={3 * S + 6} rx={4} fill="white" stroke={INK} strokeOpacity={0.3} />
          {k >= 1 && <Draw d={`M-2 -2L${3 * S + 2} ${3 * S + 2}`} strokeWidth={1} className="stroke-[#64748b]" />}
          {X7S_A.map((row, r) =>
            row.map((v, c) => {
              const [x, y] = k >= 2 ? [r, c] : [c, r];
              return (
                <g key={`${r}-${c}`} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none" style={{ transform: `translate(${x * S + S / 2}px, ${y * S + S / 2 + 3}px)` }}>
                  <text textAnchor="middle" fontSize={9} fontFamily={MONO} fontWeight={r === c ? 800 : 600} fill={r === c ? OK : X7S_TONE[v]}>
                    {v}
                  </text>
                </g>
              );
            }),
          )}
          {k >= 3 && (
            <text x={3 * S + 12} y={3 * S / 2 + 4} fontSize={9} fontWeight={800} fill={OK} className={POP}>
              Aᵀ = A
            </text>
          )}
        </g>
      </svg>
    </Scene>
  );
}

// 9½ · An array with no meaning. Heights times roll numbers: the laptop
//      multiplies without a complaint, and the answer means nothing.

const X9_SAY = ["এক দিকে height। আরেক দিকে roll number.", "Computer গুণ করে দিলো। কোনো আপত্তি নাই।", "কিন্তু height × roll এর কোনো মানে নাই। মানে দেয় মানুষ।"];

export function ArrayNoMeaning() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const h = [1.52, 1.58, 1.49];
  const roll = [12, 7, 31];
  return (
    <Scene scene={s} caption={say(X9_SAY, k)}>
      <svg viewBox="0 0 220 76" role="img" aria-label="height আর roll number গুণ করা হলো; উত্তর এলো কিন্তু তার মানে নাই" className="mx-auto block h-auto w-full max-w-[15rem]">
        {[h.map((v) => v.toFixed(2)), roll.map(String)].map((col, j) => (
          <g key={j} transform={`translate(${14 + j * 50} 8)`}>
            <rect width={36} height={48} rx={3} fill="white" stroke={INK} strokeOpacity={0.4} />
            {col.map((v, i) => (
              <text key={i} x={18} y={14 + i * 14} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={INK}>
                {v}
              </text>
            ))}
            <text x={18} y={66} textAnchor="middle" fontSize={7} fontWeight={600} fill="#64748b">
              {j === 0 ? "height" : "roll"}
            </text>
          </g>
        ))}
        <text x={57} y={36} textAnchor="middle" fontSize={10} fontWeight={700} fill={INK}>
          ×
        </text>
        {k >= 1 && (
          <g className={FADE}>
            <text x={112} y={36} textAnchor="middle" fontSize={10} fontWeight={700} fill={INK}>
              =
            </text>
            <rect x={126} y={8} width={40} height={48} rx={3} fill="#0f172a" />
            {h.map((v, i) => (
              <text key={i} x={146} y={22 + i * 14} textAnchor="middle" fontSize={8} fontFamily={MONO} fill="#6ee7b7">
                {(v * roll[i]).toFixed(2)}
              </text>
            ))}
          </g>
        )}
        {k >= 2 && (
          <text x={194} y={38} textAnchor="middle" fontSize={20} fontWeight={800} fill={BAD} className={POP}>
            ?
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 10½ · The bet settled, card by card: Karim's "anything" out, Nasib's table
//       turned on its side, Som half right, Samin's 8 × 3 taken.

const X10_BETS: [string, string, "no" | "half" | "yes"][] = [
  ["করিম", "যেটাই দাও", "no"],
  ["নাসিব", "3 × 8", "half"],
  ["সোম", "8 × 4", "half"],
  ["সামিন", "8 × 3", "yes"],
];
const X10_SAY = ["চারটা বাজি।", "করিম: app কিছু বুঝে নেয় না।", "নাসিব: table ঠিক, শুধু কাত করা।", "সোম: column লাগে, তবে আলাদা করে, y হয়ে।", "সামিন: 8 × 3। App এটাই নিলো।"];

function X10_Mark({ kind }: { kind: "no" | "half" | "yes" }) {
  if (kind === "yes") return <path d="M-5 0l3.5 4l7 -8" fill="none" stroke={OK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />;
  if (kind === "no") return <path d="M-4 -4l8 8m0 -8l-8 8" stroke={BAD} strokeWidth={2.4} strokeLinecap="round" />;
  return <path d="M-5 0h10" stroke={HI} strokeWidth={2.4} strokeLinecap="round" />;
}

export function BetSettled() {
  const s = useScene(4, [600, 1800, 2000, 2200, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X10_SAY, k)}>
      <svg viewBox="0 0 240 70" role="img" aria-label="চারটা বাজির হিসাব: করিম হারলো, নাসিব আর সোম অর্ধেক, সামিন জিতলো" className="mx-auto block h-auto w-full max-w-[17rem]">
        {X10_BETS.map(([who, t, kind], i) => (
          <g key={who} transform={`translate(${8 + i * 58} 8)`}>
            <rect width={52} height={40} rx={5} fill="white" stroke={INK} strokeOpacity={0.3} />
            <text x={26} y={14} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK}>
              {who}
            </text>
            <text x={26} y={29} textAnchor="middle" fontSize={7.5} fontFamily={/[ঀ-৿]/.test(t) ? undefined : MONO} fill={INK}>
              {t}
            </text>
            {k >= i + 1 && (
              <g transform="translate(26 56)" className={POP}>
                <X10_Mark kind={kind} />
              </g>
            )}
          </g>
        ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  ShapeBet: { start: {}, bet: { bet: 1 }, karim: { bet: 3 } },
  LooseCards: { start: {}, three: { read: [0, 3, 5] }, stacked: { read: [0, 3, 5], stacked: true } },
  RowOrColumn: { start: {}, wrong: { last: { kind: "row", i: 4 }, miss: 1 }, half: { last: { kind: "row", i: 2 }, hit: [true, false] }, done: { last: { kind: "col", i: 0 }, hit: [true, true] } },
  CallTheCell: { start: {}, over: { guess: 1, over: true }, right: { guess: 0, over: true }, far: { guess: 3, over: true } },
  CountTheShape: { start: {}, swapped: { rows: 3, cols: 8 }, right: { rows: 8, cols: 3 } },
  YesNoColumn: { start: {}, tried: { tried: true }, coded: { tried: true, coded: true }, split: { tried: true, coded: true, split: true } },
  FlipSideways: { start: {}, straight: { fed: false, both: [true, false] }, flipped: { flipped: true }, fed: { flipped: true, fed: true, both: [false, true] } },
  YourTables: { start: {}, wrong: { pick: 1, miss: 1 }, fifteen: { pick: 2, miss: 1 }, right: { pick: 0 }, cell: { round: 1, cell: [3, 1], miss: 1 }, cellRight: { round: 1, cell: [1, 4] }, kabaddi: { round: 2, pick: 1, miss: 1 }, team: { round: 2, pick: 2, miss: 1 }, row: { round: 2, pick: 0 }, done: { round: 3 } },
  TryIsItAMatrix: { start: {}, bad: { bad: 1, miss: 1 }, half: { names: true }, done: { names: true, yes: true } },
  // Story scenes and figures: `k` is the beat shown (no seed shows the last).
  TeachersRoom: { rest: { k: 0 }, sir: { k: 2 }, done: {} },
  CardsSpill: { rest: { k: 0 }, done: {} },
  SirCalls: { call: { k: 1 }, done: {} },
  SomsColumn: { rest: { k: 1 }, done: {} },
  NasibsBoard: { done: {} },
  BellRings: { ring: { k: 1 }, done: {} },
  ArtSirRoad: { grid: { k: 1 }, done: {} },
  ThreePapers: { rest: { k: 0 }, door: { k: 1 }, done: {} },
  EightsNote: { rest: { k: 0 }, slid: { k: 1 }, note: { k: 2 }, done: {} },
  SymmetricFlip: { rest: { k: 0 }, line: { k: 1 }, done: {} },
  TwoFaces: { arrow: { k: 1 }, done: {} },
  SmallVBigX: { rest: { k: 0 }, done: {} },
  HeightColumn: { line: { k: 1 }, done: {} },
  RowThenColumn: { down: { k: 1 }, name: { k: 3 }, done: {} },
  ShapeZoom: { rest: { k: 0 }, zoom: { k: 1 }, done: {} },
  XAndY: { rest: { k: 0 }, done: {} },
  DiagonalFlip: { rest: { k: 0 }, done: {} },
  ArrayNoMeaning: { done: {} },
  BetSettled: { half: { k: 2 }, done: {} },
};
