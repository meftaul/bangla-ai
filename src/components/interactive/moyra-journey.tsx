"use client";

import { useId, useState, type ReactNode } from "react";

import { Tup } from "@/components/journey/box";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, LOOK, Nope, POP, Scene, Stepper, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, makeFrame, plus, same, snap, type Frame, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";
import { Heart, LightBhai, LitRegion, OLD_LENS, Post, WallBed, WallGrid, wallFrame } from "./light-kit";

// Screens for "Math for AI 10.2 — ময়রার রসিদ, মোট জানার আগেই", told as a
// Journey in the author's Bangla-English. The plan is 10_journey_specs.md,
// block 10.2.
//
// The ময়রা has come to be paid. Five pairs of his রসিদ dry on the চৌকি: the
// হাঁড়ি counts (রসগোল্লা, দই) read fine, the মোট is smudged. The rate per
// হাঁড়ি was in মামার ভেজা খাতা; the totals are in the ময়রা's দোকানের খাতা, and
// his son will phone them after জোহর। Which pairs will surely give one price,
// whatever the totals turn out to be? The quantities alone decide: det.
//
// Ten screens. 1 seals the bet (PairsBet). 2 pair ক, the totals slide and the
// crossing never goes (TotalsSlide). 3 predict, then pair খ: same slant,
// parallel or on top (SameSlant). 4 the three pieces A, x, b (MatrixForm). 5
// the মোটের কাগজ: walk the columns to b; for খ they stay on one line
// (ColumnPicture). 6 each pair's columns as a parallelogram, det
// (DetDecides). 7 the worst page, det 0: drag b on and off the line
// (DependsOnB). 8 Your turn: sort the five (YourPairs). 9 Try it: Rina's
// অংক খাতা, three pairs to pictures (TryDet). 10 the phone, the totals come
// (TotalsCome); the rest is MDX.
//
// After the screens: the story scenes (MoyraArrives, NasibClaim, WorstPage,
// RinaKhata, PhoneRings, MoyraLeaves, LightVanGate) and the watch-only
// figures (StakeFig, SlantFixed, CopySlant, Backwards, WallCallback,
// ChainTiles, NoSingle), each numbered after its screen.
//
// The দামের কাগজ (PricePaper, ReceiptLine, Lamp, ReceiptCard) is kept local:
// 10.1 builds the shared one in parallel; the coordinator folds them later.
// light-kit.tsx is used read-only (7.2's wall for the callback figure, the
// লাইট ভাই for the bridge).
//
// Numbers: the rate is রসগোল্লার হাঁড়ি 2 হাজার, দইয়ের হাঁড়ি 3 হাজার। Pairs
// (rows = রসিদ, [রসগোল্লা, দই]): ক [[2, 1], [1, 2]] det 3 · খ [[1, 2], [2, 4]]
// det 0 · গ [[3, 1], [1, 1]] det 2 · ঘ [[2, 2], [1, 1]] det 0 · ঙ [[1, 0],
// [0, 1]] det 1. The phoned totals: ক (7, 8), খ (8, 16) (a copy: অসীম), গ
// (9, 5), ঘ (12, 5) (the 12 should be 10: parallel, নাই), ঙ (2, 3). The worst
// page is the book's singular [[3, 1], [6, 2]], b = (2, 4) on the line, (1, 5)
// off it.

const INK = "#0f1b2d";
const AM = "#d97706"; // সকালের রসিদ
const TE = "#0d9488"; // রাতের রসিদ
const GLOW = "#fde047";
const LAMP = "#ca8a04";
const BAD = "#e11d48";
const OK = "#0d9488";
const MONO = "ui-monospace, monospace";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

const PRICE_SLOTS = ["রসগোল্লার হাঁড়ির দাম (হাজার)", "দইয়ের হাঁড়ির দাম (হাজার)"] as const;
const TOTAL_SLOTS = ["সকালের রসিদের মোট", "রাতের রসিদের মোট"] as const;

// ---------------------------------------------------------------------------
// Numbers. A pair is two রসিদ, each a row [রসগোল্লার হাঁড়ি, দইয়ের হাঁড়ি]।

type Rows = [XY, XY];
type Pair = { name: string; rows: Rows };
const PAIRS: Pair[] = [
  { name: "ক", rows: [[2, 1], [1, 2]] },
  { name: "খ", rows: [[1, 2], [2, 4]] },
  { name: "গ", rows: [[3, 1], [1, 1]] },
  { name: "ঘ", rows: [[2, 2], [1, 1]] },
  { name: "ঙ", rows: [[1, 0], [0, 1]] },
];
/** what the son reads out on the phone; ঘ's 12 should have been 10 */
const PHONED: XY[] = [
  [7, 8],
  [8, 16],
  [9, 5],
  [12, 5],
  [2, 3],
];
/** the worst page: the book's singular B = [[3, 1], [6, 2]] */
const WORST: Rows = [
  [3, 1],
  [6, 2],
];

const detOf = (r: Rows) => r[0][0] * r[1][1] - r[0][1] * r[1][0];
/** the two columns of a pair: what one হাজার more on রসগোল্লা (or দই) adds to (সকালের মোট, রাতের মোট) */
const colsOf = (r: Rows): [XY, XY] => [
  [r[0][0], r[1][0]],
  [r[0][1], r[1][1]],
];
/** where the two lines cross, or null (same slant) */
const cross = (r: Rows, t: readonly number[]): XY | null => {
  const [[a, b], [c, d]] = r;
  const D = a * d - b * c;
  if (Math.abs(D) < 1e-9) return null;
  return [(t[0] * d - b * t[1]) / D, (a * t[1] - c * t[0]) / D];
};
type Kind = "one" | "none" | "all";
const kindOf = (r: Rows, t: readonly number[]): Kind => {
  if (Math.abs(detOf(r)) > 1e-9) return "one";
  const ok = Math.abs(r[0][0] * t[1] - r[1][0] * t[0]) < 1e-6 && Math.abs(r[0][1] * t[1] - r[1][1] * t[0]) < 1e-6;
  return ok ? "all" : "none";
};
const onLine = (row: XY, t: number, p: XY) => Math.abs(row[0] * p[0] + row[1] * p[1] - t) < 1e-6;

// ---------------------------------------------------------------------------
// The দামের কাগজ (local copy; 10.1 owns the shared one). Right: রসগোল্লার
// হাঁড়ির দাম, up: দইয়ের হাঁড়ির দাম, in হাজার টাকা। A রসিদ is the line of every
// price dot that gives its মোট।

/** the part of the line a·x + b·y = t that lies on the sheet */
function segOf(f: Frame, row: XY, t: number): [XY, XY] | null {
  const [a, b] = row;
  const pts: XY[] = [];
  if (Math.abs(b) > 1e-9)
    for (const x of [f.x0, f.x1]) {
      const y = (t - a * x) / b;
      if (y >= f.y0 - 1e-9 && y <= f.y1 + 1e-9) pts.push([x, y]);
    }
  if (Math.abs(a) > 1e-9)
    for (const y of [f.y0, f.y1]) {
      const x = (t - b * y) / a;
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

/** one রসিদ on the paper: its line, in the রসিদ's colour; `draw` makes it draw itself */
function ReceiptLine({ f, row, t, which, dashed = false, draw = false, faint = false }: { f: Frame; row: XY; t: number; which: 0 | 1; dashed?: boolean; draw?: boolean; faint?: boolean }) {
  const s = segOf(f, row, t);
  if (!s) return null;
  const color = which ? TE : AM;
  if (draw) return <Draw d={segD(f, s)} strokeWidth={2.6} ms={700} className={which ? "stroke-[#0d9488]" : "stroke-[#d97706]"} />;
  return <path d={segD(f, s)} stroke={color} strokeWidth={dashed ? 2 : 2.6} strokeDasharray={dashed ? "5 4" : undefined} strokeLinecap="round" opacity={faint ? 0.35 : 1} className="pointer-events-none" />;
}

/** clip children to the sheet */
function Clip({ f, children }: { f: Frame; children: ReactNode }) {
  const id = `mc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
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

/** a sheet of মামার graph paper, its two axes named above and below it; `w` sets its width */
function Paper({
  f,
  label,
  xName,
  yName,
  ticks = 2,
  w = "w-[12.5rem]",
  drag,
  children,
}: {
  f: Frame;
  label: string;
  xName: string;
  yName: string;
  ticks?: number;
  w?: string;
  drag?: { down?: (p: XY) => void; move?: (p: XY) => void };
  children?: ReactNode;
}) {
  return (
    <div className={`flex shrink-0 flex-col ${w}`}>
      <span className="text-[0.62rem] leading-tight font-semibold text-muted">{yName}</span>
      <Plane f={f} label={label} ticks={ticks} className="my-0.5! max-w-none" drag={drag}>
        {children}
      </Plane>
      <span className="self-end text-[0.62rem] leading-tight font-semibold text-muted">{xName}</span>
    </div>
  );
}
const PricePaper = (p: Omit<Parameters<typeof Paper>[0], "xName" | "yName">) => <Paper {...p} xName="রসগোল্লার দাম" yName="দইয়ের দাম" />;
const TotalsPaper = (p: Omit<Parameters<typeof Paper>[0], "xName" | "yName">) => <Paper {...p} xName="সকালের মোট" yName="রাতের মোট" />;

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

/** the মোট where the ink ran */
function Smudge({ w = "w-7" }: { w?: string }) {
  return <span aria-label="মোট ভেজা, পড়া যায় না" className={`inline-block h-3.5 ${w} rounded-full bg-[#64748b]/45 blur-[1.5px]`} />;
}

/** a count on a রসিদ */
const Q = ({ n }: { n: number }) => <b className="font-mono">{n}</b>;

/** one রসিদ as a slip of paper: its lamp, which one (সকাল / রাত), the হাঁড়ি, the মোট */
function ReceiptCard({ which, row, total, lit, children }: { which: 0 | 1; row: XY; total: ReactNode | null; lit?: boolean; children?: ReactNode }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg border border-l-4 border-[#cbd5e1] bg-white py-1 pr-1.5 pl-1.5 text-[0.8rem] leading-tight text-[#0f1b2d] ${which ? "border-l-[#0d9488]" : "border-l-[#d97706]"}`}>
      {lit !== undefined && <Lamp on={lit} />}
      <span className="min-w-0 flex-1">
        <span className="text-[0.68rem] text-[#64748b]">{which ? "রাত" : "সকাল"}</span> <Q n={row[0]} /> রসগোল্লা, <Q n={row[1]} /> দই
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <span className="text-[0.68rem] text-[#64748b]">মোট</span>
        {total === null ? <Smudge /> : total}
      </span>
      {children}
    </div>
  );
}

/** a pair's two রসিদ, small, for lists */
function PairRows({ p, totals, small = false }: { p: Pair; totals?: XY | null; small?: boolean }) {
  return (
    <span className={`flex flex-col gap-0.5 leading-tight ${small ? "text-[0.68rem]" : "text-[0.75rem]"}`}>
      {p.rows.map((r, i) => (
        <span key={i} className="flex items-center gap-1 whitespace-nowrap">
          <span className={`inline-block h-2.5 w-1 shrink-0 rounded-sm ${i ? "bg-[#0d9488]" : "bg-[#d97706]"}`} />
          <Q n={r[0]} /> রসগোল্লা, <Q n={r[1]} /> দই
          {totals ? (
            <b key={totals[i]} className={`font-mono ${POP}`}>
              · {totals[i]}
            </b>
          ) : (
            <Smudge w="w-5" />
          )}
        </span>
      ))}
    </span>
  );
}

/** a drawn tick (no glyph) */
function Tick({ className = "text-accent-text" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`size-4 shrink-0 ${className} ${POP}`} aria-hidden="true">
      <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** a small drawn arrow for rows of steps (no glyph) */
function RowArrow() {
  return (
    <svg viewBox="0 0 16 10" className="h-2.5 w-4 shrink-0 text-muted" aria-hidden="true">
      <path d="M1 5H13M9 1.5L13 5L9 8.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** the three ways two lines can be, as a small picture: cross once, side by side, on top */
function LinesPic({ kind, size = 56, slide = false }: { kind: Kind; size?: number; slide?: boolean }) {
  return (
    <svg viewBox="0 0 56 44" width={size} height={(size * 44) / 56} role="img" aria-label={kind === "one" ? "দুই লাইন এক জায়গায় কাটে" : kind === "none" ? "দুই লাইন পাশাপাশি, কখনো মেলে না" : "দুই লাইন একটার উপর আরেকটা"} className="shrink-0">
      <rect x={1} y={1} width={54} height={42} rx={4} fill="white" stroke="#cbd5e1" />
      {kind === "one" && (
        <>
          <path d="M6 36L50 10" stroke={AM} strokeWidth={2.4} strokeLinecap="round" />
          <path d="M6 12L50 34" stroke={TE} strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={28} cy={23} r={3.2} fill="#7c3aed" />
        </>
      )}
      {kind === "none" && (
        <>
          <path d="M6 30L50 8" stroke={AM} strokeWidth={2.4} strokeLinecap="round" />
          <path d="M6 40L50 18" stroke={TE} strokeWidth={2.4} strokeLinecap="round" />
        </>
      )}
      {kind === "all" && (
        <>
          {slide && <path d="M6 40L50 18" stroke={TE} strokeWidth={1.6} strokeDasharray="3 3" strokeLinecap="round" opacity={0.6} />}
          {slide && <path d="M40 28l-2 -6" stroke="#64748b" strokeWidth={1.2} strokeLinecap="round" />}
          <path d="M6 30L50 8" stroke={AM} strokeWidth={3.6} strokeLinecap="round" />
          <path d="M6 30L50 8" stroke={TE} strokeWidth={1.8} strokeDasharray="4 3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The five pairs on the চৌকি, counts readable, totals
//     smudged. The reader ticks the pairs that will surely give one price
//     whatever the totals. Sealing stamps a single "?" dot on each ticked
//     pair's little paper, one after another; nothing is judged.

function MiniPaper({ mark }: { mark: boolean }) {
  return (
    <svg viewBox="0 0 34 34" width={34} height={34} role="img" aria-label={mark ? "বাজি: এক দাম?" : "দামের কাগজ"} className="shrink-0">
      <rect x={1} y={1} width={32} height={32} rx={3} fill="white" stroke="#cbd5e1" />
      <path d="M9 1V33M17 1V33M25 1V33M1 9H33M1 17H33M1 25H33" stroke="#2563eb" strokeOpacity={0.18} strokeWidth={0.8} />
      <path d="M5 1V29H33" stroke={INK} strokeOpacity={0.4} strokeWidth={1} fill="none" />
      {mark && (
        <g className={POP}>
          <circle cx={17} cy={15} r={3.6} fill="#7c3aed" />
          <text x={24} y={13} fontSize={11} fontWeight={800} fill="#2563eb">
            ?
          </text>
        </g>
      )}
    </svg>
  );
}

export function PairsBet() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<boolean[]>("picks", [false, false, false, false, false]);
  const [touched, setTouched] = useSeed("touched", false);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(380);
  const shown = !sealed ? 0 : act.running ? act.k : 5;
  const toggle = (i: number) => {
    if (sealed) return;
    setTouched(true);
    setPicks(picks.map((v, j) => (j === i ? !v : v)));
  };
  const seal = () => {
    if (sealed || !touched) return;
    setSealed(true);
    act.play(5, () => pass("বাজি সিল হলো। আগে মোট নিয়ে খেলি।"));
  };
  return (
    <>
      <div className="mx-auto flex max-w-[21rem] flex-col gap-1.5">
        {PAIRS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            disabled={sealed}
            onClick={() => toggle(i)}
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-2.5 py-1 text-left transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[picks[i] ? "picked" : sealed ? "dim" : "idle"]}`}
          >
            <span className={`grid size-5 shrink-0 place-items-center rounded border-2 ${picks[i] ? "border-cat-blue bg-cat-blue text-white" : "border-muted/50"}`}>{picks[i] && <Tick className="text-white" />}</span>
            <b className="w-4 shrink-0 text-base">{p.name}</b>
            <span className="min-w-0 flex-1">
              <PairRows p={p} />
            </span>
            <MiniPaper mark={sealed && picks[i] && shown > i} />
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center">
        <button type="button" className={primaryBtn} disabled={!touched || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={sealed && !act.running}>কোন জোড়াগুলো যেকোনো মোটে ঠিক এক দাম দেবে? টিক দিয়ে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Pair ক। The two totals are the reader's to set (steppers under the
//     smudges). Each change glides the lines: they shift, never turn, and the
//     crossing — Shiku, both lamps lit — moves with them but never goes.

const PAPER_F = makeFrame(-0.8, 6.8, -0.8, 6.8, 25, 6);
const X2_START: XY = [6, 6];

export function TotalsSlide() {
  const pass = useGate();
  const [tot, setTot] = useSeed<XY>("tot", X2_START);
  const [seen, setSeen] = useSeed<string[]>("seen", [X2_START.join(",")]);
  const [t1, t2] = useTween(tot, 550);
  const rows = PAIRS[0].rows;
  const at = cross(rows, [t1, t2]);
  const final = cross(rows, tot);
  const xs = new Set(seen.map((s) => s.split(",")[0]));
  const ys = new Set(seen.map((s) => s.split(",")[1]));
  const done = seen.length >= 4 && xs.size >= 2 && ys.size >= 2;
  const set = (i: 0 | 1, v: number) => {
    const next: XY = i === 0 ? [v, tot[1]] : [tot[0], v];
    setTot(next);
    const key = next.join(",");
    const s = seen.includes(key) ? seen : [...seen, key];
    setSeen(s);
    const a = new Set(s.map((q) => q.split(",")[0]));
    const b = new Set(s.map((q) => q.split(",")[1]));
    if (s.length >= 4 && a.size >= 2 && b.size >= 2) pass("মোট বদলালে লাইন সরে, ঘোরে না।");
  };
  return (
    <>
      <div className="flex justify-center">
        <PricePaper f={PAPER_F} label="দামের কাগজ: জোড়া ক এর দুই রসিদের দুই লাইন, কাটার জায়গায় Shiku" w="w-[12.5rem]">
          <Clip f={PAPER_F}>
            <ReceiptLine f={PAPER_F} row={rows[0]} t={t1} which={0} />
            <ReceiptLine f={PAPER_F} row={rows[1]} t={t2} which={1} />
          </Clip>
          {at && (
            <>
              <circle cx={PAPER_F.sx(at[0])} cy={PAPER_F.sy(at[1])} r={9} fill={GLOW} opacity={0.55} className="pointer-events-none" />
              <Shiku f={PAPER_F} at={at} />
            </>
          )}
        </PricePaper>
      </div>
      <div className="mx-auto mt-1 min-h-6 text-center text-sm">
        দাম {final && <Tup v={[Math.round(final[0] * 100) / 100, Math.round(final[1] * 100) / 100]} of={PRICE_SLOTS} />}
      </div>
      <div className="mx-auto mt-1 flex max-w-[21rem] flex-col gap-1.5">
        {rows.map((r, i) => (
          <ReceiptCard key={i} which={i as 0 | 1} row={r} lit total={<Stepper value={tot[i]} min={4} max={11} label={i ? "রাতের মোট" : "সকালের মোট"} onChange={(v) => set(i as 0 | 1, v)} />} />
        ))}
      </div>
      <Task done={done}>মোট জানা নাই। দুই রসিদের মোট নিজেই বাড়িয়ে কমিয়ে দেখুন। কাটার জায়গাটা কি কখনো হারায়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict, then pair খ (rows (1, 2) and (2, 4)). Three pictures: cross
//     somewhere · side by side, on top at one total · side by side, never.
//     The steppers unlock after the guess. The lines stay parallel; at the
//     one total where রাত = 2 × সকাল they land on top, and Shiku walks the
//     whole line with both lamps lit.

const X3_OPTS: { kind: Kind; say: string; slide?: boolean }[] = [
  { kind: "one", say: "কোথাও না কোথাও কাটবে" },
  { kind: "all", say: "পাশাপাশি, এক মোটে একদম উপরে", slide: true },
  { kind: "none", say: "পাশাপাশি, কখনো মেলে না" },
];
const X3_RIGHT = 1;
const X3_NOPE = ["মোট যতই বদলালেন, লাইন দুইটা কোথাও কাটলো না। পাশাপাশিই চললো।", "", "একটা মোটে মিলে গেলো: রাতের মোট যখন সকালের ঠিক দ্বিগুণ।"];
const X3_WALK = 10;

export function SameSlant() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [tot, setTot] = useSeed<XY>("tot", [6, 8]);
  const [found, setFound] = useSeed("found", false);
  const [moves, setMoves] = useSeed("moves", 0);
  const walk = usePlay(110);
  const [t1, t2] = useTween(tot, 550);
  const rows = PAIRS[1].rows;
  const merged = tot[1] === 2 * tot[0];
  const set = (i: 0 | 1, v: number) => {
    if (guess === null) return;
    const next: XY = i === 0 ? [v, tot[1]] : [tot[0], v];
    setTot(next);
    setMoves(moves + 1);
    if (next[1] === 2 * next[0])
      walk.play(X3_WALK, () => {
        if (!found) {
          setFound(true);
          pass("ঢাল এক হলে: দাম নাই, নাহলে অসীম।");
        }
      });
  };
  // Shiku on the merged line, walking it end to end
  const s = merged ? segOf(PAPER_F, rows[0], tot[0]) : null;
  const u = walk.running ? walk.k / X3_WALK : 1;
  const shikuAt: XY | null = s && Math.abs(t2 - tot[1]) < 0.02 ? [s[0][0] + (s[1][0] - s[0][0]) * (0.15 + 0.7 * u), s[0][1] + (s[1][1] - s[0][1]) * (0.15 + 0.7 * u)] : null;
  const lit = merged && shikuAt !== null;
  return (
    <>
      <div className="flex justify-center">
        <PricePaper f={PAPER_F} label="দামের কাগজ: জোড়া খ এর দুই রসিদের লাইন, একই ঢালে" w="w-[11.5rem]">
          <Clip f={PAPER_F}>
            <ReceiptLine f={PAPER_F} row={rows[0]} t={t1} which={0} />
            <ReceiptLine f={PAPER_F} row={rows[1]} t={t2} which={1} dashed={merged} />
          </Clip>
          {shikuAt && <Shiku f={PAPER_F} at={shikuAt} />}
        </PricePaper>
      </div>
      <div className="mx-auto mt-1.5 flex max-w-[21rem] flex-col gap-1">
        {rows.map((r, i) => (
          <ReceiptCard
            key={i}
            which={i as 0 | 1}
            row={r}
            lit={lit}
            total={<Stepper value={tot[i]} min={i ? 4 : 2} max={i ? 16 : 8} disabled={guess === null} label={i ? "রাতের মোট" : "সকালের মোট"} onChange={(v) => set(i as 0 | 1, v)} />}
          />
        ))}
      </div>
      {guess === null || !found ? (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {X3_OPTS.map((o, i) => (
            <Choice key={o.kind} n={i} look={predictLook(i, guess, false, X3_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
              <span className="flex flex-col items-center gap-1 text-[0.7rem] leading-tight">
                <LinesPic kind={o.kind} slide={o.slide} size={50} />
                {o.say}
              </span>
            </Choice>
          ))}
        </div>
      ) : guess === X3_RIGHT ? (
        <div className={`mt-2 text-center text-sm text-accent-text ${FADE}`}>ঠিক ধরেছেন। পাশাপাশি, শুধু এক মোটে একটার উপর আরেকটা।</div>
      ) : (
        <Nope>{X3_NOPE[guess]}</Nope>
      )}
      <Task done={found && !walk.running}>{guess === null ? "মোট বদলালে খ এর লাইন দুইটা কী করবে? আগে guess দিন।" : "এবার মোট বদলান। এমন মোট খুঁজুন যেখানে দুই lamp একসাথে জ্বলে।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Pair ক as three things. Taps lift the হাঁড়ি counts into a box (A), set
//     the two unknown prices as a list (x) and the two smudged totals as a
//     list (b). Then each row of A is run along x, 7.1's row way: the cells
//     light in turn and the রসিদ is written back underneath. Ax = b.

const X4_BTN = ["হাঁড়ির সংখ্যা তুলুন", "দামের list বসান", "মোটের list বসান", "সকালের সারি গুণ করুন", "রাতের সারি গুণ করুন"];
const X4_SWEEP = 8;

function Bracket({ side }: { side: "l" | "r" }) {
  return <span className={`w-1.5 self-stretch border-y-2 border-current opacity-60 ${side === "l" ? "rounded-l-sm border-l-2" : "rounded-r-sm border-r-2"}`} />;
}

function Cell({ on, glow, title, children }: { on: boolean; glow: boolean; title: string; children: ReactNode }) {
  return (
    <span title={title} className={`grid h-7 min-w-7 place-items-center rounded-md px-1 font-mono text-base font-bold transition-colors duration-200 motion-reduce:transition-none ${glow ? "bg-[#fde047]/70" : ""} ${on ? "" : "text-transparent"}`}>
      {on ? <span className={POP}>{children}</span> : "·"}
    </span>
  );
}

export function MatrixForm() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const sweep = usePlay(170);
  const rows = PAIRS[0].rows;
  const row = sweep.running ? stage - 3 : -1;
  const col = sweep.k < X4_SWEEP / 2 ? 0 : 1;
  const next = () => {
    if (sweep.running || stage >= 5) return;
    if (stage < 3) return setStage(stage + 1);
    sweep.play(X4_SWEEP, () => {
      setStage(stage + 1);
      if (stage === 4) pass("দুইটা রসিদ, তিনটা চিহ্ন: Ax = b।");
    });
  };
  const box = "flex flex-col items-center gap-0.5";
  const tag = "text-xs font-semibold text-muted";
  return (
    <>
      <div className="mx-auto flex max-w-[21rem] flex-col gap-1">
        {rows.map((r, i) => (
          <ReceiptCard key={i} which={i as 0 | 1} row={r} total={null} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className={box}>
          <span className="inline-flex items-stretch text-[#b45309] dark:text-[#fbbf24]">
            <Bracket side="l" />
            <span className="grid grid-cols-2 gap-x-0.5">
              {rows.flatMap((r, i) =>
                r.map((v, j) => (
                  <Cell key={`${i}${j}`} on={stage >= 1} glow={row === i && col === j} title={`${i ? "রাতের" : "সকালের"} রসিদে ${j ? "দই" : "রসগোল্লা"}র হাঁড়ি`}>
                    {v}
                  </Cell>
                )),
              )}
            </span>
            <Bracket side="r" />
          </span>
          <span className={tag}>A: হাঁড়ির ছক</span>
        </div>
        <div className={box}>
          <span className="inline-flex items-stretch text-[#7c3aed] dark:text-[#c4b5fd]">
            <Bracket side="l" />
            <span className="grid grid-cols-1">
              {[0, 1].map((j) => (
                <Cell key={j} on={stage >= 2} glow={row >= 0 && col === j} title={PRICE_SLOTS[j]}>
                  ?
                </Cell>
              ))}
            </span>
            <Bracket side="r" />
          </span>
          <span className={tag}>x: দাম</span>
        </div>
        <span className="font-mono text-lg font-bold">=</span>
        <div className={box}>
          <span className="inline-flex items-stretch text-foreground">
            <Bracket side="l" />
            <span className="grid grid-cols-1">
              {[0, 1].map((i) => (
                <span key={i} title={TOTAL_SLOTS[i]} className={`grid h-7 min-w-9 place-items-center rounded-md transition-colors duration-200 motion-reduce:transition-none ${row === i && sweep.k >= X4_SWEEP - 1 ? "bg-[#fde047]/70" : ""}`}>
                  {stage >= 3 ? (
                    <span className={POP}>
                      <Smudge w="w-6" />
                    </span>
                  ) : (
                    <span className="text-transparent">·</span>
                  )}
                </span>
              ))}
            </span>
            <Bracket side="r" />
          </span>
          <span className={tag}>b: মোট</span>
        </div>
      </div>
      <div className="mx-auto mt-2 flex min-h-[3.2rem] max-w-[21rem] flex-col gap-0.5 text-[0.8rem] leading-snug">
        {rows.map(
          (r, i) =>
            stage >= 4 + i && (
              <span key={i} className={`${FADE} flex items-center gap-1`}>
                <span className={`inline-block h-3 w-1 shrink-0 rounded-sm ${i ? "bg-[#0d9488]" : "bg-[#d97706]"}`} />
                <span>
                  <Q n={r[0]} /> × রসগোল্লার দাম + <Q n={r[1]} /> × দইয়ের দাম = {i ? "রাতের" : "সকালের"} মোট
                </span>
              </span>
            ),
        )}
      </div>
      <div className="mt-2 flex justify-center">
        {stage < 5 ? (
          <button type="button" className={primaryBtn} disabled={sweep.running} onClick={next}>
            {X4_BTN[stage]}
          </button>
        ) : (
          <span className={`rounded-full bg-foreground/5 px-4 py-1.5 font-mono text-lg font-bold ${POP}`}>Ax = b</span>
        )}
      </div>
      <Task done={stage >= 5 && !sweep.running}>রসিদ থেকে তিনটা জিনিস তুলে আনুন। তারপর দুই সারি গুণ করে দেখুন, রসিদ ফেরত আসে কি না।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The মোটের কাগজ (right: সকালের মোট, up: রাতের মোট)। One হাজার on
//     রসগোল্লা is a jump of column 1, one on দই a jump of column 2. The reader
//     sets two prices and Shiku walks the jumps, one by one. For ক, (2, 1)
//     reaches b = (5, 4). Then খ: its jumps (1, 2) and (2, 4) keep Shiku on
//     one line whatever the prices; after three tries that line lights.

const X5F = makeFrame(-0.5, 9.5, -0.5, 12.5, 16.5, 6);
const X5_B: XY = [5, 4];
const X5_TRIES = 3;

export function ColumnPicture() {
  const pass = useGate();
  const [pair, setPair] = useSeed<0 | 1>("pair", 0);
  const [pq, setPq] = useSeed<XY>("pq", [0, 0]);
  const [landed, setLanded] = useSeed<XY | null>("landed", null);
  const [reached, setReached] = useSeed("reached", false);
  const [tries, setTries] = useSeed<string[]>("tries", []);
  const walk = usePlay(300);
  const cols = colsOf(PAIRS[pair].rows);
  const pts: XY[] = [[0, 0]];
  for (let i = 0; i < pq[0]; i++) pts.push(plus(pts[pts.length - 1], cols[0]));
  for (let j = 0; j < pq[1]; j++) pts.push(plus(pts[pts.length - 1], cols[1]));
  const n = pts.length - 1;
  const shown = walk.running ? walk.k : landed ? n : 0;
  const at = pts[Math.min(shown, n)];
  const land = (end: XY) => {
    setLanded(end);
    if (pair === 0) {
      if (same(end, X5_B)) setReached(true);
      return;
    }
    const key = end.join(",");
    const t = tries.includes(key) ? tries : [...tries, key];
    setTries(t);
    if (t.length >= X5_TRIES) pass("b column এর span এ থাকলে তবেই দাম।");
  };
  const go = () => {
    if (walk.running) return;
    setLanded(null);
    if (n === 0) return land([0, 0]);
    walk.play(n, () => land(pts[n]));
  };
  const setP = (i: 0 | 1, v: number) => {
    if (walk.running) return;
    setPq(i === 0 ? [v, pq[1]] : [pq[0], v]);
    setLanded(null);
  };
  const toKha = () => {
    setPair(1);
    setPq([0, 0]);
    setLanded(null);
  };
  const lineLit = pair === 1 && tries.length >= X5_TRIES;
  const hit = landed && same(landed, X5_B);
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <TotalsPaper f={X5F} label="মোটের কাগজ: b = (5, 4) এ একটা তারা, Shiku দুই রকম লাফ দিয়ে হাঁটে" w="w-[11rem]">
          <Clip f={X5F}>
            {lineLit && (
              <g className={POP}>
                <path d={`M${X5F.sx(0)} ${X5F.sy(0)}L${X5F.sx(7)} ${X5F.sy(14)}`} stroke={GLOW} strokeWidth={9} strokeOpacity={0.6} strokeLinecap="round" />
                <path d={`M${X5F.sx(0)} ${X5F.sy(0)}L${X5F.sx(7)} ${X5F.sy(14)}`} stroke={LAMP} strokeWidth={1.2} />
              </g>
            )}
            {shown === 0 && (
              <>
                <Arrow f={X5F} from={[0, 0]} to={cols[0]} tone="amber" w={2.2} faint />
                <Arrow f={X5F} from={[0, 0]} to={cols[1]} tone="teal" w={2.2} faint />
              </>
            )}
            {pts.slice(1, shown + 1).map((p, i) => (
              <Arrow key={`${pair}${i}`} f={X5F} from={pts[i]} to={p} tone={i < pq[0] ? "amber" : "teal"} w={2.2} />
            ))}
          </Clip>
          <g className="pointer-events-none">
            <circle cx={X5F.sx(X5_B[0])} cy={X5F.sy(X5_B[1])} r={7} fill={hit ? GLOW : "white"} stroke={hit ? LAMP : "#2563eb"} strokeWidth={1.6} />
            <text x={X5F.sx(X5_B[0]) + 9} y={X5F.sy(X5_B[1]) + 4} fontSize={11} fontWeight={800} fill="#2563eb">
              b
            </text>
            {lineLit && <path d={`M${X5F.sx(5) - 5} ${X5F.sy(4) - 5}l10 10m0 -10l-10 10`} stroke={BAD} strokeWidth={1.8} strokeLinecap="round" className={POP} />}
          </g>
          <Shiku f={X5F} at={at} />
        </TotalsPaper>
        <div className="flex w-[8.8rem] flex-col gap-1.5 text-[0.75rem]">
          <span className="font-semibold">
            জোড়া {PAIRS[pair].name}: লাফ <Tup v={cols[0]} of={TOTAL_SLOTS} />, <Tup v={cols[1]} of={TOTAL_SLOTS} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[#b45309] dark:text-[#fbbf24]">রসগোল্লার দাম</span>
            <Stepper value={pq[0]} min={0} max={3} disabled={walk.running || (pair === 0 && reached)} label="রসগোল্লার দাম" onChange={(v) => setP(0, v)} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[#0f766e] dark:text-[#5eead4]">দইয়ের দাম</span>
            <Stepper value={pq[1]} min={0} max={3} disabled={walk.running || (pair === 0 && reached)} label="দইয়ের দাম" onChange={(v) => setP(1, v)} />
          </span>
          <span className="min-h-8">
            {landed && !walk.running && (
              <span key={landed.join()} className={FADE}>
                থামলো <Tup v={landed} of={TOTAL_SLOTS} />. {hit ? "b তে!" : "b তে না।"}
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-2">
        {pair === 0 && reached ? (
          <button type="button" className={primaryBtn} onClick={toKha}>
            এবার জোড়া খ
          </button>
        ) : (
          <button type="button" className={primaryBtn} disabled={walk.running} onClick={go}>
            Shiku কে হাঁটান
          </button>
        )}
      </div>
      {pair === 1 && tries.length > 0 && !lineLit && !walk.running && <Nope key={tries.length}>যত দামই দেন, Shiku থামে একই হেলানো লাইনে। আরো দাম দিয়ে দেখুন ({tries.length}/{X5_TRIES}).</Nope>}
      <Task done={lineLit && !walk.running}>{pair === 0 ? "দুই দাম বেছে Shiku কে b তে পৌঁছান।" : "জোড়া খ দিয়ে b তে পৌঁছানোর চেষ্টা করুন। তিন রকম দাম দিয়ে দেখুন।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · det decides. Each pair's two columns (jumps) as arrows from the corner;
//     the parallelogram between them grows. With room in it, faint copies
//     tile the whole মোটের কাগজ; flat, it is a line. det beside it.

const X6F = makeFrame(-0.5, 4.5, -0.5, 6.5, 24, 6);
const X6_FRAMES = 12;

export function DetDecides() {
  const pass = useGate();
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const [seen, setSeen] = useSeed<boolean[]>("seen", [false, false, false, false, false]);
  const grow = usePlay(55);
  const t = cur === null ? 0 : grow.running ? grow.k / X6_FRAMES : 1;
  const tap = (i: number) => {
    setCur(i);
    const next = seen.map((s, j) => s || j === i);
    grow.play(X6_FRAMES, () => {
      setSeen(next);
      if (next.every(Boolean) && !seen.every(Boolean)) pass("det ≠ 0 হলে যেকোনো মোটে এক দাম।");
    });
  };
  const p = cur === null ? null : PAIRS[cur];
  const cols = p ? colsOf(p.rows) : null;
  const D = p ? detOf(p.rows) : 0;
  const f = X6F;
  const quad = (c: [XY, XY], s: number, o: XY = [0, 0]) =>
    [o, plus(o, [c[0][0] * s, c[0][1] * s]), plus(o, [(c[0][0] + c[1][0]) * s, (c[0][1] + c[1][1]) * s]), plus(o, [c[1][0] * s, c[1][1] * s])].map((q, i) => `${i ? "L" : "M"}${f.sx(q[0]).toFixed(1)} ${f.sy(q[1]).toFixed(1)}`).join("") + "Z";
  const tiles: XY[] = [];
  if (cols && D !== 0 && t >= 1)
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) if (i || j) tiles.push([i * cols[0][0] + j * cols[1][0], i * cols[0][1] + j * cols[1][1]]);
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <TotalsPaper f={f} label="মোটের কাগজ: জোড়ার দুই লাফ আর তাদের হেলানো ছোপ" w="w-[8.5rem]" ticks={2}>
          <Clip f={f}>
            {cols &&
              tiles.map((o, i) => (
                <path key={`${cur}${i}`} d={quad(cols, 1, o)} fill={GLOW} fillOpacity={0.22} stroke={LAMP} strokeOpacity={0.35} strokeWidth={0.8} className={FADE} />
              ))}
            {cols && <path d={quad(cols, t)} fill={D ? GLOW : "none"} fillOpacity={0.75} stroke={D ? LAMP : BAD} strokeWidth={D ? 1.2 : 3} strokeLinejoin="round" className="pointer-events-none" />}
          </Clip>
          {cols && (
            <>
              <Arrow key={`a${cur}`} f={f} from={[0, 0]} to={cols[0]} tone="amber" w={2.2} draw />
              <Arrow key={`b${cur}`} f={f} from={[0, 0]} to={cols[1]} tone="teal" w={2.2} draw delay={150} />
            </>
          )}
        </TotalsPaper>
        <div className="flex w-[8.5rem] flex-col items-start gap-1 text-[0.78rem] leading-snug">
          {p && cols ? (
            <>
              <span className="font-semibold">
                জোড়া {p.name}: <Tup v={cols[0]} of={TOTAL_SLOTS} />, <Tup v={cols[1]} of={TOTAL_SLOTS} />
              </span>
              {!grow.running && (
                <span key={cur} className={`flex flex-col gap-0.5 ${FADE}`}>
                  <span className={`font-mono text-xl font-bold ${D ? "text-[#b45309] dark:text-[#fbbf24]" : "text-danger"}`}>det {D}</span>
                  <span className="text-muted">{D ? "দুই লাফ আলাদা দিকে। পুরা কাগজ ভরে যায়।" : "দুই লাফ একই দিকে। শুধু এক লাইন।"}</span>
                </span>
              )}
            </>
          ) : (
            <span className="text-muted">একটা জোড়ায় tap করুন।</span>
          )}
        </div>
      </div>
      <div className="mx-auto mt-2 grid max-w-[21rem] grid-cols-5 gap-1">
        {PAIRS.map((q, i) => (
          <button
            key={q.name}
            type="button"
            onClick={() => tap(i)}
            className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-1 py-1 transition-colors motion-reduce:transition-none ${cur === i ? "border-cat-blue bg-cat-blue/10" : seen[i] ? "border-accent/50" : "border-border hover:border-cat-blue/60"}`}
          >
            <b>{q.name}</b>
            <span className="font-mono text-[0.62rem] leading-tight text-muted">
              {q.rows[0].join(" ")}
              <br />
              {q.rows[1].join(" ")}
            </span>
            {seen[i] && <span className={`font-mono text-[0.65rem] font-bold ${POP}`}>det {detOf(q.rows)}</span>}
          </button>
        ))}
      </div>
      <Task done={seen.every(Boolean) && !grow.running}>পাঁচ জোড়াই tap করুন। কোনটার ছোপে জায়গা আছে, কোনটা চ্যাপ্টা?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The worst page, [[3, 1], [6, 2]], det 0. Left, the মোটের কাগজ with its
//     lit line (the column space, রাতের মোট = 2 × সকালের); the reader drags b.
//     Right, the দামের কাগজ: the two রসিদ lines glide with b — on top of each
//     other when b is on the lit line (অসীম), side by side when it is off
//     (নাই)।

const X7T = makeFrame(-0.5, 6.5, -0.5, 6.5, 20, 6);
const X7P = makeFrame(-0.4, 2.4, -0.4, 6.4, 22, 6);
const X7_START: XY = [1, 5];

export function DependsOnB() {
  const pass = useGate();
  const [b, setB] = useSeed<XY>("b", X7_START);
  const [seen, setSeen] = useSeed<{ on: boolean; off: boolean; moved: boolean }>("seen", { on: false, off: true, moved: false });
  const [t1, t2] = useTween(b, 450);
  const kind = kindOf(WORST, b);
  const move = (p: XY) => {
    const q = snap(p, X7T);
    if (same(q, b)) return;
    setB(q);
    const k = kindOf(WORST, q);
    const next = { on: seen.on || k === "all", off: seen.off || k === "none", moved: true };
    setSeen(next);
    if (next.on && next.off && next.moved && !(seen.on && seen.off && seen.moved)) pass("det 0: b দেখে, নাই নাহলে অসীম।");
  };
  const done = seen.on && seen.off && seen.moved;
  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <TotalsPaper f={X7T} label="মোটের কাগজ: আলোর লাইন, আর b যেটা টেনে সরানো যায়" w="w-[9.5rem]" drag={{ down: move, move }}>
            <Clip f={X7T}>
              <path d={`M${X7T.sx(0)} ${X7T.sy(0)}L${X7T.sx(3.5)} ${X7T.sy(7)}`} stroke={GLOW} strokeWidth={9} strokeOpacity={0.6} strokeLinecap="round" className="pointer-events-none" />
              <path d={`M${X7T.sx(0)} ${X7T.sy(0)}L${X7T.sx(3.5)} ${X7T.sy(7)}`} stroke={LAMP} strokeWidth={1.2} className="pointer-events-none" />
            </Clip>
            <g style={{ transform: `translate(${X7T.sx(t1)}px, ${X7T.sy(t2)}px)` }} className="pointer-events-none">
              <circle r={10} fill="#2563eb" fillOpacity={0.12} />
              <circle r={5.5} fill={kind === "all" ? GLOW : "white"} stroke="#2563eb" strokeWidth={2} />
              <text x={8} y={-7} fontSize={11} fontWeight={800} fill="#2563eb">
                b
              </text>
            </g>
          </TotalsPaper>
          <span className="text-xs">
            b = <Tup v={b} of={TOTAL_SLOTS} />
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <PricePaper f={X7P} label="দামের কাগজ: সবচেয়ে ভেজা পাতার দুই রসিদের লাইন" w="w-[5.5rem]" ticks={2}>
            <Clip f={X7P}>
              <ReceiptLine f={X7P} row={WORST[0]} t={t1} which={0} />
              <ReceiptLine f={X7P} row={WORST[1]} t={t2} which={1} dashed={kind === "all"} />
            </Clip>
          </PricePaper>
          <span key={kind} className={`text-center text-xs font-semibold ${FADE} ${kind === "all" ? "text-accent-text" : "text-danger"}`}>
            {kind === "all" ? "একটার উপর আরেকটা: অসীম দাম" : "পাশাপাশি: কোনো দাম নাই"}
          </span>
        </div>
      </div>
      <div className="mx-auto mt-2 flex max-w-[21rem] flex-col gap-1">
        {WORST.map((r, i) => (
          <ReceiptCard key={i} which={i as 0 | 1} row={r} total={<b className="font-mono">{b[i]}?</b>} />
        ))}
      </div>
      <Task done={done}>মোটের কাগজে b টেনে সরান। একবার আলোর লাইনের উপরে, একবার বাইরে। দামের কাগজে কী হয়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn. The five pairs again; each goes to "যেকোনো মোটে এক দাম" or
//     "মোট দেখে". Every drop plays: that pair's totals change three times on
//     the paper, the lines glide, Shiku sits on each crossing (or there is
//     none). Then it is judged; a wrong drop bounces.

const X8F = makeFrame(-0.5, 6.5, -0.5, 6.5, 19, 6);
const X8_SLIDE: XY[][] = [
  [[6, 6], [8, 7], [5, 7]],
  [[4, 12], [6, 8], [5, 10]],
  [[9, 5], [6, 4], [10, 4]],
  [[8, 5], [10, 3], [8, 4]],
  [[2, 3], [4, 1], [1, 5]],
];
const X8_BINS = ["যেকোনো মোটে এক দাম", "মোট দেখে"];
const X8_NOPE = [
  "মোট তিনবার বদলালো। প্রতিবার লাইন দুইটা কাটলো, ঠিক এক জায়গায়। মোট দেখার দরকার পড়লো না।",
  "মোট তিনবার বদলালো। একবারও এক জায়গায় কাটলো না: কখনো পাশাপাশি, কখনো একটার উপর আরেকটা।",
];

export function YourPairs() {
  const pass = useGate();
  const [done, setDone] = useSeed<boolean[]>("done", [false, false, false, false, false]);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(750);
  const step = cur === null ? 0 : play.running ? Math.max(0, play.k - 1) : 2;
  const tot = cur === null ? ([-20, -20] as XY) : X8_SLIDE[cur][step];
  const [t1, t2] = useTween(tot, 500);
  const rows = cur === null ? null : PAIRS[cur].rows;
  const drop = (i: number, bin: number) => {
    if (play.running || done[i]) return;
    setCur(i);
    setPick(bin);
    play.play(3, () => {
      const right = (detOf(PAIRS[i].rows) !== 0 ? 0 : 1) === bin;
      if (!right) return setMiss((m) => m + 1);
      const next = done.map((d, j) => d || j === i);
      setDone(next);
      if (next.every(Boolean)) pass("হাঁড়ির সংখ্যাই বলে দেয়, মোট লাগে না।");
    });
  };
  const at = rows ? cross(rows, [t1, t2]) : null;
  const kind = rows ? kindOf(rows, tot) : "one";
  const wrong = cur !== null && pick !== null && !play.running && !done[cur];
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <PricePaper f={X8F} label="দামের কাগজ: বেছে নেওয়া জোড়ার লাইন, মোট তিনবার বদলায়" w="w-[7.5rem]">
          {rows && (
            <Clip f={X8F}>
              <ReceiptLine f={X8F} row={rows[0]} t={t1} which={0} />
              <ReceiptLine f={X8F} row={rows[1]} t={t2} which={1} dashed={kind === "all"} />
            </Clip>
          )}
          {at && at[0] > -0.5 && at[1] > -0.5 && <Shiku f={X8F} at={at} />}
        </PricePaper>
        <div className="w-[7.5rem] text-[0.75rem] leading-snug">
          {cur === null ? (
            <span className="text-muted">একটা জোড়া একটা ভাগে দিন। তার মোট নিজে নিজে বদলাবে।</span>
          ) : (
            <span key={`${cur}${step}`} className={FADE}>
              জোড়া {PAIRS[cur].name}, মোট <Tup v={tot} of={TOTAL_SLOTS} />: {kind === "one" ? "এক দাম" : kind === "all" ? "অসীম" : "নাই"}
            </span>
          )}
        </div>
      </div>
      <div className="mx-auto mt-1.5 flex max-w-[21rem] flex-col gap-1">
        {PAIRS.map((p, i) => (
          <div key={p.name} className={`flex items-center gap-1.5 rounded-xl border-2 px-2 py-0.5 ${cur === i ? "border-cat-blue/60" : "border-border"}`}>
            <b className="w-4 shrink-0">{p.name}</b>
            <span className="min-w-0 flex-1">
              <PairRows p={p} small />
            </span>
            {done[i] ? (
              <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-accent-text">
                <Tick />
                {X8_BINS[detOf(p.rows) !== 0 ? 0 : 1]}
              </span>
            ) : (
              X8_BINS.map((bin, j) => (
                <button key={bin} type="button" disabled={play.running} onClick={() => drop(i, j)} className={`cursor-pointer rounded-lg border px-1.5 py-1 text-[0.66rem] leading-tight transition-colors disabled:cursor-default motion-reduce:transition-none ${cur === i && pick === j ? (wrong ? "border-danger/60 bg-danger/5 text-danger" : "border-cat-blue bg-cat-blue/10") : "border-border hover:border-cat-blue/60"}`}>
                  {bin}
                </button>
              ))
            )}
          </div>
        ))}
      </div>
      {wrong && pick !== null && <Nope key={miss}>{X8_NOPE[pick === 1 ? 0 : 1]}</Nope>}
      <Task done={done.every(Boolean) && !play.running}>পাঁচ জোড়াই ঠিক ভাগে দিন: যেকোনো মোটে এক দাম, নাকি মোট দেখে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it (Check Q1, Q4). Rina's অংক খাতা: three pairs, one at a time.
//     The reader picks a picture; the pair's lines draw themselves on the
//     paper; the pick is judged against them.

const X9F = makeFrame(-1, 4, -1, 5.5, 24, 6);
const X9_CARDS: { eq: [string, string]; rows: Rows; t: XY; kind: Kind }[] = [
  { eq: ["x + y = 1", "2x + 2y = 5"], rows: [[1, 1], [2, 2]], t: [1, 5], kind: "none" },
  { eq: ["x + y = 1", "2x + 2y = 2"], rows: [[1, 1], [2, 2]], t: [1, 2], kind: "all" },
  { eq: ["2x + y = 5", "x − y = 1"], rows: [[2, 1], [1, -1]], t: [5, 1], kind: "one" },
];
const X9_OPTS: { kind: Kind; say: string }[] = [
  { kind: "one", say: "এক উত্তর" },
  { kind: "none", say: "উত্তর নাই" },
  { kind: "all", say: "অসীম উত্তর" },
];
const X9_SAY: Record<Kind, string> = {
  one: "লাইন দুইটা এক জায়গায় কাটলো।",
  none: "লাইন দুইটা পাশাপাশি। কোথাও মিললো না।",
  all: "দ্বিতীয় লাইন এসে বসলো প্রথমটার উপরে।",
};

export function TryDet() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(700);
  const card = X9_CARDS[Math.min(at, 2)];
  const over = at >= 3;
  const choose = (i: number) => {
    if (play.running || over) return;
    setPick(i);
    play.play(2, () => {
      if (X9_OPTS[i].kind !== card.kind) return setMiss((m) => m + 1);
      if (at === 2) {
        setAt(3);
        pass("det দেখেই চেনা যায়, আঁকার আগে।");
      }
    });
  };
  const nextCard = () => {
    setAt(at + 1);
    setPick(null);
  };
  const drawn = pick !== null;
  const right = drawn && !play.running && X9_OPTS[pick].kind === card.kind;
  const D = detOf(card.rows);
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <Paper f={X9F} label="রিনার খাতার কাগজ: বেছে নেওয়ার পর জোড়ার দুই লাইন আঁকা হয়" xName="x" yName="y" w="w-[8.5rem]">
          {drawn && (
            <Clip f={X9F}>
              <g key={`${at}${pick}${miss}`}>
                <ReceiptLine f={X9F} row={card.rows[0]} t={card.t[0]} which={0} draw />
                {play.k >= 1 || !play.running ? <ReceiptLine f={X9F} row={card.rows[1]} t={card.t[1]} which={1} draw /> : null}
              </g>
            </Clip>
          )}
        </Paper>
        <div className="flex w-[8.5rem] flex-col gap-1">
          <span className="text-xs text-muted">রিনার খাতা, অংক {Math.min(at, 2) + 1} / 3</span>
          <span key={at} className={`rounded-lg border border-[#cbd5e1] bg-[#fefce8] px-2 py-1 font-mono text-sm leading-snug text-[#0f1b2d] ${POP}`}>
            <span className="block text-[#b45309]">{card.eq[0]}</span>
            <span className="block text-[#0f766e]">{card.eq[1]}</span>
          </span>
          {right && <span className={`text-xs text-accent-text ${FADE}`}>{X9_SAY[card.kind]} det {D < 0 ? `−${-D}` : D}.</span>}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X9_OPTS.map((o, i) => (
          <Choice key={o.kind} n={i} look={pick === i && !play.running ? (o.kind === card.kind ? "right" : "wrong") : "idle"} disabled={play.running || right || over} onClick={() => choose(i)}>
            <span className="flex flex-col items-center gap-1 text-[0.72rem] leading-tight">
              <LinesPic kind={o.kind} size={48} />
              {o.say}
            </span>
          </Choice>
        ))}
      </div>
      {drawn && !play.running && !right && <Nope key={miss}>{X9_SAY[card.kind]} আপনার ছবির সাথে মিললো? এই জোড়ার det {D === 0 ? "0" : D < 0 ? `−${-D}` : D}.</Nope>}
      {right && at < 2 && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={quietBtn} onClick={nextCard}>
            পরের অংক
          </button>
        </div>
      )}
      <Task done={over}>রিনার তিনটা অংক। প্রতিটার দুই লাইন কেমন হবে? ছবি বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · The phone. The son reads the totals out; the reader writes each pair's
//      in. The smudge becomes a number, the two lines draw themselves, and
//      Shiku walks to the crossing (both lamps light) — or along the one line
//      (অসীম), or there is no place to go (ঘ: a wrong total).

const X10F = makeFrame(-0.5, 6.5, -0.5, 6.5, 21, 6);
const X10_WALK = 8;

export function TotalsCome() {
  const pass = useGate();
  const [open, setOpen] = useSeed<boolean[]>("open", [false, false, false, false, false]);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const walk = usePlay(120);
  const tap = (i: number) => {
    if (walk.running) return;
    setCur(i);
    const next = open.map((o, j) => o || j === i);
    walk.play(X10_WALK, () => {
      setOpen(next);
      if (next.every(Boolean) && !open.every(Boolean)) pass("মোট আসার আগেই det বলে দিয়েছিলো।");
    });
  };
  const rows = cur === null ? null : PAIRS[cur].rows;
  const tot = cur === null ? null : PHONED[cur];
  const kind = rows && tot ? kindOf(rows, tot) : null;
  const u = walk.running ? walk.k / X10_WALK : 1;
  let shiku: XY | null = null;
  if (rows && tot && kind === "one") {
    const c = cross(rows, tot)!;
    shiku = [c[0] * u, c[1] * u];
  } else if (rows && tot && kind === "all") {
    const s = segOf(X10F, rows[0], tot[0]);
    if (s) shiku = [s[0][0] + (s[1][0] - s[0][0]) * (0.1 + 0.8 * u), s[0][1] + (s[1][1] - s[0][1]) * (0.1 + 0.8 * u)];
  }
  const lit = (i: 0 | 1) => !!(rows && tot && shiku && !walk.running && onLine(rows[i], tot[i], shiku));
  const verdict = (i: number) => {
    const k = kindOf(PAIRS[i].rows, PHONED[i]);
    if (k === "one") return <Tup v={cross(PAIRS[i].rows, PHONED[i])!} of={PRICE_SLOTS} />;
    return k === "all" ? "অসীম" : "নাই";
  };
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <PricePaper f={X10F} label="দামের কাগজ: ফোনে আসা মোটে জোড়ার দুই লাইন" w="w-[9.5rem]">
          {rows && tot && (
            <Clip f={X10F}>
              <g key={cur}>
                <ReceiptLine f={X10F} row={rows[0]} t={tot[0]} which={0} draw />
                <ReceiptLine f={X10F} row={rows[1]} t={tot[1]} which={1} draw dashed={kind === "all"} />
              </g>
            </Clip>
          )}
          {shiku && <Shiku f={X10F} at={shiku} />}
        </PricePaper>
        <div className="flex w-[7rem] flex-col gap-1">
          {rows && (
            <>
              <span className="flex items-center gap-1 text-xs">
                <Lamp on={lit(0)} size={16} /> সকাল
              </span>
              <span className="flex items-center gap-1 text-xs">
                <Lamp on={lit(1)} size={16} /> রাত
              </span>
            </>
          )}
          {cur !== null && !walk.running && (
            <span key={cur} className={`text-xs leading-snug ${FADE} ${kind === "one" ? "text-accent-text" : "text-danger"}`}>
              {kind === "one" ? "দুই lamp এক জায়গায়। এক দাম।" : kind === "all" ? "লাইন একটার উপর আরেকটা। দাম বলা যায় না।" : "লাইন পাশাপাশি। একটা মোট ভুল।"}
            </span>
          )}
        </div>
      </div>
      <div className="mx-auto mt-1.5 flex max-w-[21rem] flex-col gap-1">
        {PAIRS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            disabled={walk.running}
            onClick={() => tap(i)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl border-2 px-2 py-0.5 text-left transition-colors disabled:cursor-default motion-reduce:transition-none ${cur === i ? "border-cat-blue bg-cat-blue/10" : open[i] ? "border-accent/40" : "border-border hover:border-cat-blue/60"}`}
          >
            <b className="w-4 shrink-0">{p.name}</b>
            <span className="min-w-0 flex-1">
              <PairRows p={p} small totals={open[i] || (cur === i && walk.running) ? PHONED[i] : null} />
            </span>
            <span className="w-11 shrink-0 font-mono text-[0.65rem] text-muted">det {detOf(p.rows)}</span>
            <span className="w-[4.6rem] shrink-0 text-right text-[0.7rem] font-semibold">{open[i] ? verdict(i) : ""}</span>
          </button>
        ))}
      </div>
      <Task done={open.every(Boolean) && !walk.running}>ফোনে মোট এসেছে। একটা একটা জোড়ায় tap করে মোট বসান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story props, drawn locally.

/**
 * The ময়রা: মামার look, a white গেঞ্জি with a ঘি stain over the shirt, his
 * name under his feet. The arms are drawn again over the গেঞ্জি (so he is
 * never walked with arm "down", whose swing the redraw wouldn't follow).
 */
function Moyra({ x, y, facing = 1, arm = "down", walking = false, ms = 1200 }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "hold" | "point" | "wave"; walking?: boolean; ms?: number }) {
  const armR = arm === "wave" ? "M8 -38l9 -14" : arm === "hold" ? "M8 -37l9 -6" : arm === "point" ? "M8 -37l13 -3" : "M8 -38l3 14";
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} arm={arm} walking={walking} ms={ms} />
      <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
        <g transform={`scale(${facing} 1)`}>
          <path d="M-9 -35q0 -5 3 -5h1.5q1 4 4.5 4t4.5 -4H6q3 0 3 5v13q0 2 -2 2H-7q-2 0 -2 -2Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth={0.7} />
          <ellipse cx={3} cy={-27} rx={3} ry={2.2} fill="#facc15" opacity={0.55} />
          <ellipse cx={-4} cy={-23.5} rx={1.8} ry={1.3} fill="#facc15" opacity={0.45} />
          <path d="M-8 -38l-3 14" strokeWidth={4} strokeLinecap="round" stroke="#c68e5f" />
          <path d={armR} strokeWidth={4} strokeLinecap="round" stroke="#c68e5f" />
        </g>
        <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          ময়রা
        </text>
      </g>
    </>
  );
}

/** a মাটির হাঁড়ি, bottom-centre at (x, y); `cloth` ties a white cloth over the mouth (full) */
function Haari({ x, y, s = 1, cloth = true, tilt = 0 }: { x: number; y: number; s?: number; cloth?: boolean; tilt?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${tilt})`} className="pointer-events-none">
      <ellipse cx={0} cy={-8} rx={10} ry={8.5} fill="#b45309" />
      <ellipse cx={-3} cy={-10} rx={3} ry={4} fill="#d97706" opacity={0.6} />
      <rect x={-5.5} y={-18} width={11} height={3.5} rx={1.2} fill="#92400e" />
      {cloth && <path d="M-7 -17.5q7 -6 14 0l-1.5 2.5h-11Z" fill="white" stroke="#cbd5e1" strokeWidth={0.6} />}
    </g>
  );
}

/** the চৌকি, its top at y − 22, centred at x */
function Chouki({ x, y, w = 96 }: { x: number; y: number; w?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - w / 2} y={y - 24} width={w} height={6} rx={1.5} fill="#a16207" />
      <rect x={x - w / 2 + 4} y={y - 18} width={4} height={18} fill="#78350f" />
      <rect x={x + w / 2 - 8} y={y - 18} width={4} height={18} fill="#78350f" />
    </g>
  );
}

/** a রসিদ slip lying on something, centred at (x, y); `wet` smudges its bottom */
function Slip({ x, y, rot = 0, wet = true, dark = false }: { x: number; y: number; rot?: number; wet?: boolean; dark?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} className="pointer-events-none">
      <rect x={-5} y={-6.5} width={10} height={13} rx={0.8} fill={dark ? "#e7e5e4" : "white"} stroke="#94a3b8" strokeWidth={0.5} />
      <path d="M-3 -3.5h6M-3 -1h4.5" stroke="#475569" strokeWidth={0.7} />
      {wet && <ellipse cx={0.5} cy={3.2} rx={3.6} ry={1.8} fill="#64748b" opacity={dark ? 0.7 : 0.45} />}
    </g>
  );
}

/** the বারান্দা's eave and two posts */
function Veranda() {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={0} width={320} height={12} fill="#a8a29e" />
      <rect x={0} y={12} width={320} height={3} fill="#78716c" />
      <rect x={14} y={15} width={6} height={135} fill="#d6d3d1" />
      <rect x={300} y={15} width={6} height={135} fill="#d6d3d1" />
    </g>
  );
}

/** a phone in a hand or on its own, centred at (x, y); `ring` draws the buzz */
function Phone({ x, y, ring = false }: { x: number; y: number; ring?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 3} y={y - 5.5} width={6} height={11} rx={1.4} fill="#1f2937" />
      <rect x={x - 2} y={y - 4} width={4} height={7} rx={0.6} fill="#93c5fd" />
      {ring && (
        <g className={POP} stroke="#1f2937" strokeWidth={1} strokeLinecap="round" fill="none">
          <path d={`M${x - 6} ${y - 4}q-2 4 0 8M${x + 6} ${y - 4}q2 4 0 8`} />
          <path d={`M${x - 9} ${y - 6}q-3 6 0 12M${x + 9} ${y - 6}q3 6 0 12`} />
        </g>
      )}
    </g>
  );
}

/** the লাইট ভাই's ভ্যান, rear wheel at (x, y) */
function Van({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 14} y={y - 20} width={50} height={5} rx={1} fill="#a16207" />
      <rect x={x - 6} y={y - 36} width={22} height={16} rx={2} fill="#334155" />
      <circle cx={x + 5} cy={y - 30} r={4} fill="#e0f2fe" stroke="#1e293b" strokeWidth={1} />
      <circle cx={x} cy={y - 7} r={7} fill="none" stroke="#1f2937" strokeWidth={2} />
      <circle cx={x + 30} cy={y - 7} r={7} fill="none" stroke="#1f2937" strokeWidth={2} />
      <path d={`M${x + 36} ${y - 15}l6 -14h6`} stroke="#1f2937" strokeWidth={1.8} fill="none" strokeLinecap="round" />
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

// ---------------------------------------------------------------------------
// 1a · Late morning on the বারান্দা। Five pairs of রসিদ drying on the চৌকি;
//      Samin reads one. The ময়রা walks in with a হাঁড়ি of রসগোল্লা, sets it
//      down, and says it: the totals first, then anything.

const S1_SLIPS: [number, number][] = [
  [128, -4],
  [146, 5],
  [164, -6],
  [182, 3],
  [200, -3],
];

export function MoyraArrives({}: Story) {
  const s = useScene(4, [600, 1600, 2400, 2400, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বারান্দায় চৌকির উপর পাঁচ জোড়া রসিদ শুকাচ্ছে; সামিন একটা পড়ছে; ময়রা একটা রসগোল্লার হাঁড়ি হাতে এসে চৌকিতে রাখলেন; বললেন মোট না জেনে কিছুই বলা যায় না, আগে ফোন আসুক">
        <Veranda />
        <Chouki x={165} y={150} w={100} />
        {S1_SLIPS.map(([sx, r], i) => (
          <g key={i}>
            <Slip x={sx - 3} y={120} rot={r} />
            <Slip x={sx + 3} y={121} rot={-r} />
          </g>
        ))}
        {k >= 2 && <Haari x={206} y={126} />}
        <Person who="samin" x={80} y={150} facing={1} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 && <Slip x={97} y={106} wet />}
        <Moyra x={k >= 1 ? 250 : 350} y={150} facing={-1} arm={k >= 2 ? "down" : "hold"} walking={k === 1} ms={1400} />
        {k <= 1 && (
          <g style={{ transform: `translate(${k >= 1 ? 233 : 333}px, 107px)`, transitionDuration: "1400ms" }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
            <Haari x={0} y={0} s={0.9} />
          </g>
        )}
        {k === 2 && <Bubble x={80} y={84} side="right" lines={["2 হাঁড়ি রসগোল্লা,", "1 হাঁড়ি দই। মোট…"]} />}
        {k === 3 && <Bubble x={250} y={84} side="left" lines={["মোট না জাইনা", "কিছুই কওয়া যায় না।"]} />}
        {k === 4 && <Bubble x={250} y={84} side="left" lines={["আগে ফোন আসুক।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Nasib at the paper: turn the totals enough, the lines must meet.

export function NasibClaim({}: Story) {
  const s = useScene(2, [600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব দামের কাগজের দিকে আঙুল দেখিয়ে বললো, মোট বদলাইতে থাকেন, কোথাও না কোথাও কাটবেই">
        <Veranda />
        <Chouki x={160} y={150} w={100} />
        <g className="pointer-events-none">
          <rect x={138} y={108} width={44} height={20} rx={1.5} fill="white" stroke="#cbd5e1" />
          <path d="M142 126L178 116" stroke={AM} strokeWidth={1.6} />
          <path d="M142 120L178 110" stroke={TE} strokeWidth={1.6} />
        </g>
        <Person who="fahim" x={90} y={150} facing={1} label />
        <Person who="nasib" x={228} y={150} facing={-1} mood={k >= 2 ? "smug" : "plain"} arm={k >= 1 ? "point" : "down"} label />
        {k >= 2 && <Bubble x={228} y={84} side="left" lines={["মোট বদলাইতে থাকেন।", "কোথাও না কোথাও কাটবেই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · The ময়রা takes the last page out of his ফতুয়ার পকেট, the wettest.
//      Samin reads: 3 and 1, 6 and 2. The ময়রা doesn't remember its total.

export function WorstPage({}: Story) {
  const s = useScene(3, [600, 1600, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ময়রা পকেট থেকে সবচেয়ে ভেজা পাতাটা বের করলেন; সামিন পড়লো, সকালে 3 আর 1, রাতে 6 আর 2; ময়রা বললেন এইটার মোট তারও মনে নাই">
        <Veranda />
        <Chouki x={165} y={150} w={100} />
        <Person who="samin" x={80} y={150} facing={1} arm={k >= 2 ? "hold" : "down"} label />
        <Moyra x={k >= 2 ? 200 : 240} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} ms={900} />
        {k === 1 && <Slip x={223} y={107} wet dark />}
        {k >= 2 && <Slip x={97} y={106} wet dark />}
        {k === 2 && <Bubble x={80} y={84} side="right" lines={["সকালে 3 আর 1।", "রাতে 6 আর 2।"]} />}
        {k === 3 && <Bubble x={200} y={84} side="left" lines={["এইটার মোট আমারও", "মনে নাই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Rina comes with her অংক খাতা: three pairs, x and y.

export function RinaKhata({}: Story) {
  const s = useScene(2, [600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="রিনা তার অংক খাতা নিয়ে এলো; বললো স্যার তিনটা অংক দিয়েছেন, x আর y দিয়ে">
        <Veranda />
        <Chouki x={150} y={150} w={100} />
        <Person who="fahim" x={80} y={150} facing={1} label />
        <Person who="rina" x={k >= 1 ? 210 : 300} y={150} facing={-1} arm="hold" walking={k === 1} label />
        <g style={{ transform: `translate(${k >= 1 ? 193 : 283}px, 104px)`, transitionDuration: "1200ms" }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
          <rect x={-8} y={-6} width={16} height={12} rx={1} fill="#fefce8" stroke="#a16207" strokeWidth={0.8} />
          <path d="M0 -6V6" stroke="#a16207" strokeWidth={0.6} />
        </g>
        {k >= 2 && <Bubble x={210} y={84} side="left" lines={["স্যার তিনটা অংক দিছে।", "x আর y দিয়া।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 10a · After জোহর। The ময়রা's phone buzzes; he listens; Samin, pencil up,
//       waits to write.

export function PhoneRings({}: Story) {
  const s = useScene(3, [600, 1400, 2000, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="জোহরের পর ময়রার ফোন বাজলো; তিনি ফোন কানে নিয়ে বললেন, হ, কও; সামিন পেন্সিল নিয়ে লেখার জন্য তৈরি">
        <Veranda />
        <circle cx={160} cy={30} r={9} fill="#fde047" opacity={0.9} className="pointer-events-none" />
        <Chouki x={150} y={150} w={100} />
        {S1_SLIPS.map(([sx, r], i) => (
          <Slip key={i} x={sx - 15} y={120} rot={r} />
        ))}
        <Person who="samin" x={80} y={150} facing={1} arm={k >= 3 ? "hold" : "down"} label />
        {k >= 3 && <path d="M96 106l6 -8" stroke="#a16207" strokeWidth={1.6} strokeLinecap="round" className={POP} />}
        <Moyra x={240} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} />
        {k === 1 && <Phone x={243} y={126} ring />}
        {k >= 2 && <Phone x={224} y={108} />}
        {k === 2 && <Bubble x={240} y={84} side="left" lines={["হ, কও।"]} />}
        {k === 3 && <Bubble x={80} y={84} side="right" lines={["বলেন, লিখছি।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 10b · The ময়রা leaves, the empty হাঁড়ি under his arm; মামা at the বারান্দা।

export function MoyraLeaves() {
  const s = useScene(2, [600, 1600, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামা ময়রার হাতে টাকা দিলেন; ময়রা খালি হাঁড়ি বগলে নিয়ে গেটের দিকে হেঁটে গেলেন">
        <BambooGate x={290} />
        <Person who="mama" x={80} y={150} facing={1} arm={k === 0 ? "hold" : k === 2 ? "wave" : "down"} label />
        {k === 0 && <rect x={94} y={103} width={9} height={5} rx={0.8} fill="#86efac" stroke="#15803d" strokeWidth={0.5} className="pointer-events-none" />}
        <Moyra x={k === 0 ? 130 : k === 1 ? 210 : 262} y={150} facing={k === 0 ? -1 : 1} arm="hold" walking={k >= 1} ms={1500} />
        <g style={{ transform: `translate(${k === 0 ? 113 : k === 1 ? 227 : 279}px, 112px)`, transitionDuration: "1500ms" }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
          <Haari x={0} y={0} s={0.75} cloth={false} tilt={k === 0 ? 0 : 25} />
        </g>
      </Stage>
    </StoryFrame>
  );
}

// 10c · The bridge to 10.3: afternoon, the লাইট ভাই's ভ্যান at the gate; he
//       holds up his two রসিদ, back for the বাকি টাকা।

export function LightVanGate() {
  const s = useScene(2, [600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="বিকালে গেটে লাইট ভাইয়ের ভ্যান; লাইট ভাই দুইটা রসিদ হাতে এগিয়ে এলেন, বললেন বাকি টাকাটা নিতে আসলাম">
        <BambooGate x={250} />
        <Van x={262} y={150} />
        <Person who="mama" x={70} y={150} facing={1} label />
        <LightBhai x={k >= 1 ? 150 : 222} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} />
        {k >= 1 && (
          <g className={POP}>
            <Slip x={130} y={106} rot={-6} wet={false} />
            <Slip x={137} y={108} rot={5} wet={false} />
          </g>
        )}
        {k >= 2 && <Bubble x={150} y={84} side="left" lines={["বাকি টাকাটা", "নিতে আসলাম।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · The stake. Five pairs, counts readable, totals smudged. The totals are
//      in the দোকানের খাতা: thick, the son alone at the shop, all pages by
//      evening. So which pages first? A "?" over each pair.

const X1B_SAY = [
  "চৌকিতে পাঁচ জোড়া রসিদ। হাঁড়ির সংখ্যা পড়া যায়, মোট না।",
  "মোট আছে দোকানের খাতায়। খাতা মোটা। সব পাতা খুঁজতে সন্ধ্যা হবে।",
  "জোহরের পর ছেলে ফোন করবে। তার আগে বলে দিতে হবে কোন পাতা আগে খুঁজবে।",
  "যেগুলোর মোট আসলে দাম নিশ্চিত বের হবে। কোনগুলো?",
];

export function StakeFig() {
  const s = useScene(3, [600, 1800, 2200, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <svg viewBox="0 0 280 130" className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label="পাঁচ জোড়া রসিদ, মোট ভেজা; দোকানের মোটা খাতা, একটা ঘড়ি, একটা ফোন; প্রতিটা জোড়ার উপর প্রশ্নবোধক চিহ্ন">
        <rect x={0} y={0} width={280} height={130} rx={8} fill="#fef3c7" />
        {PAIRS.map((p, i) => {
          const x = 30 + i * 55;
          return (
            <g key={p.name}>
              <g transform={`translate(${x - 6} 44) scale(2.1)`}>
                <Slip x={0} y={0} rot={-5} />
              </g>
              <g transform={`translate(${x + 6} 46) scale(2.1)`}>
                <Slip x={0} y={0} rot={4} />
              </g>
              <text x={x} y={18} textAnchor="middle" fontSize={11} fontWeight={800} fill={INK}>
                {p.name}
              </text>
              {k >= 3 && (
                <text x={x + 14} y={28} fontSize={16} fontWeight={800} fill="#2563eb" className={POP}>
                  ?
                </text>
              )}
            </g>
          );
        })}
        {k >= 1 && (
          <g className={POP}>
            <rect x={40} y={92} width={56} height={26} rx={2} fill="#7c2d12" />
            <rect x={43} y={95} width={50} height={20} rx={1} fill="#fef9c3" />
            <path d="M68 95V115" stroke="#7c2d12" strokeWidth={1} />
            <text x={68} y={127} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK}>
              দোকানের খাতা
            </text>
            <circle cx={140} cy={105} r={13} fill="white" stroke={INK} strokeWidth={1.4} />
            <path d="M140 105V96" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
            <path d="M140 105V115" stroke={BAD} strokeWidth={1.4} strokeLinecap="round" style={{ transform: `rotate(${k >= 2 ? 0 : -150}deg)`, transformOrigin: "140px 105px" }} className="transition-transform duration-1000 motion-reduce:transition-none" />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <path d="M100 105H186" stroke="#64748b" strokeWidth={1.2} strokeDasharray="3 3" />
            <Phone x={200} y={105} ring />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Why the line never turns. সকালের রসিদ (2 রসগোল্লা, 1 দই), total 6।
//      Shiku on it, lamp lit; one হাজার more on রসগোল্লা and the total runs 2
//      over, lamp out; two less on দই and it's back, lamp lit: the slant is
//      the হাঁড়ি। Then the total changes and the line only slides.

const X2B_F = makeFrame(-0.5, 5.5, -0.5, 6.5, 20, 6);
const X2B_AT: XY[] = [
  [1, 4],
  [2, 4],
  [2, 2],
  [2, 2],
];
const X2B_SAY = [
  "সকালের রসিদ, মোট ধরেন 6। Shiku লাইনের উপর, lamp জ্বলছে।",
  "রসগোল্লার দাম 1 বাড়লো। সকালে 2 হাঁড়ি, তাই মোট বাড়লো 2। Lamp নিভলো।",
  "দইয়ের দাম 2 কমলো। মোট আবার 6, lamp জ্বললো। ডানে 1, নিচে 2: এটাই লাইনের ঢাল।",
  "মোট 8 হলে? ঢাল একই। লাইনটা শুধু সরে গেলো।",
];

export function SlantFixed() {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  const f = X2B_F;
  const p = X2B_AT[k];
  const lit = k === 0 || k === 2;
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <div className="flex items-center justify-center gap-2">
        <PricePaper f={f} label="দামের কাগজে সকালের রসিদের লাইন, Shiku তার উপরে আর পাশে" w="w-[9rem]">
          <Clip f={f}>
            {k >= 3 && <ReceiptLine f={f} row={[2, 1]} t={6} which={0} faint dashed />}
            <g style={{ transform: `translateX(${k >= 3 ? f.u : 0}px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
              <ReceiptLine f={f} row={[2, 1]} t={6} which={0} />
            </g>
          </Clip>
          {k >= 1 && k <= 2 && <path d={`M${f.sx(1)} ${f.sy(4)}H${f.sx(2)}${k >= 2 ? `V${f.sy(2)}` : ""}`} stroke="#7c3aed" strokeWidth={1.4} strokeDasharray="3 2" fill="none" className="pointer-events-none" />}
          <Shiku f={f} at={k >= 3 ? [3, 2] : p} />
        </PricePaper>
        <Lamp on={lit || k === 3} size={30} />
      </div>
    </Scene>
  );
}

// 3½ · Why খ's lines never cross: রাতের রসিদ is সকালের twice over. Same
//      slant, side by side; at the one total that is exactly double, the
//      রাতের line slides onto the সকালের।

const X3B_F = makeFrame(-0.5, 6.5, -0.5, 4.5, 20, 6);
const X3B_SAY = [
  "খ: সকালে 1 রসগোল্লা, 2 দই। রাতে 2 রসগোল্লা, 4 দই।",
  "রাতের অর্ডার সকালেরটা দুইবার। দুইবার অর্ডার, দুইগুণ টাকা।",
  "তাই রাতের লাইনের ঢালও একই। দুই লাইন পাশাপাশি চলে।",
  "রাতের মোট ঠিক সকালের দ্বিগুণ হলে, রাতের লাইন সরে এসে বসে সকালেরটার উপর।",
];

export function CopySlant() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const f = X3B_F;
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <div className="flex flex-col gap-1 text-[0.72rem] leading-tight">
          <span className="flex items-center gap-1 rounded border border-l-4 border-[#cbd5e1] border-l-[#d97706] bg-white px-1.5 py-0.5 text-[#0f1b2d]">
            <Q n={1} /> রসগোল্লা, <Q n={2} /> দই
          </span>
          {k >= 1 && (
            <span className={`self-center rounded-full bg-foreground/10 px-2 font-mono text-xs font-bold ${POP}`}>× 2</span>
          )}
          <span className="flex items-center gap-1 rounded border border-l-4 border-[#cbd5e1] border-l-[#0d9488] bg-white px-1.5 py-0.5 text-[#0f1b2d]">
            <Q n={2} /> রসগোল্লা, <Q n={4} /> দই
          </span>
        </div>
        <PricePaper f={f} label="খ এর দুই লাইন: একই ঢাল, পাশাপাশি; শেষে একটার উপর আরেকটা" w="w-[9.5rem]" ticks={2}>
          <Clip f={f}>
            <ReceiptLine f={f} row={[1, 2]} t={4} which={0} />
            {k >= 2 && (
              <g style={{ transform: `translateX(${k >= 3 ? -2 * f.u : 0}px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
                <g className={FADE}>
                  <ReceiptLine f={f} row={[1, 2]} t={6} which={1} dashed={k >= 3} />
                </g>
              </g>
            )}
          </Clip>
        </PricePaper>
      </div>
    </Scene>
  );
}

// 4½ · Forwards and backwards. Every article so far: x in, A, Ax out. Today
//      b is known and A is known; the arrow turns round with a "?" on x. It is
//      Rina's 9.5 question: lens A, the spot over the door b, the stencil x.

const X4B_SAY = [
  "এতদিন: x দিলাম, A দিয়ে গুণ, হাতে এলো Ax।",
  "আজ b জানা, ফোনে আসবে। A ও জানা, রসিদে লেখা।",
  "অজানা শুধু x। কোন x কে A ঠিক b তে পাঠায়?",
  "রিনার 9.5 এর প্রশ্নও এটাই: lens A, দরজার উপরে b, stencil এর কোথায় x?",
];

export function Backwards() {
  const s = useScene(3, [600, 1800, 2000, 2600]);
  const k = s.k;
  const back = k >= 2;
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <svg viewBox="0 0 270 118" className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label="x থেকে A হয়ে b; তারপর উল্টা দিকে, b থেকে x এর দিকে প্রশ্ন; নিচে lens, দরজা আর stencil">
        <rect x={10} y={20} width={50} height={34} rx={8} fill={back ? "#ede9fe" : "white"} stroke="#7c3aed" strokeWidth={1.6} />
        <text x={35} y={43} textAnchor="middle" fontSize={16} fontWeight={800} fontFamily={MONO} fill="#7c3aed">
          {back ? "?" : "x"}
        </text>
        <rect x={110} y={16} width={50} height={42} rx={10} fill={k >= 1 ? "#fef3c7" : "white"} stroke="#b45309" strokeWidth={1.6} className="transition-colors duration-500 motion-reduce:transition-none" />
        <text x={135} y={43} textAnchor="middle" fontSize={17} fontWeight={800} fontFamily={MONO} fill="#b45309">
          A
        </text>
        <rect x={210} y={20} width={50} height={34} rx={8} fill={k >= 1 ? "#ccfbf1" : "white"} stroke={OK} strokeWidth={1.6} className="transition-colors duration-500 motion-reduce:transition-none" />
        <text x={235} y={43} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily={MONO} fill={OK}>
          {k >= 1 ? "b" : "Ax"}
        </text>
        {!back ? (
          <g key="f" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Draw d="M62 37H106" strokeWidth={1.6} className="stroke-[#0f1b2d]" />
            <Draw d="M162 37H206" strokeWidth={1.6} delay={300} className="stroke-[#0f1b2d]" />
            <path d="M100 32l6 5l-6 5M200 32l6 5l-6 5" />
          </g>
        ) : (
          <g key="b" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Draw d="M208 64Q135 92 62 64" strokeWidth={1.8} className="stroke-[#e11d48]" />
            <path d="M70 58l-8 6l9 3" stroke={BAD} strokeWidth={1.8} className={POP} />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={20} y={92} width={30} height={20} rx={2} fill="#b45309" />
            <path d="M35 108c-7 -5 -8 -9 -5 -11c2 -1 4 0 5 2c1 -2 3 -3 5 -2c3 2 2 6 -5 11Z" fill="#fef3c7" />
            <circle cx={135} cy={102} r={11} fill="#e0f2fe" stroke="#334155" strokeWidth={1.5} />
            <rect x={222} y={88} width={26} height={28} rx={1} fill="#7c4a24" />
            <path d="M235 84c-5 -3.5 -6 -6.5 -3.5 -8c1.5 -0.8 3 0 3.5 1.4c0.5 -1.4 2 -2.2 3.5 -1.4c2.5 1.5 1.5 4.5 -3.5 8Z" fill="#ec4899" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 5½ · The callback: 7.2's wall. The old lens lit only one line; the heart on
//      it lit, the one off it never did. Same picture as today's মোটের কাগজ।

const X5B_F = wallFrame(14, 6);
const X5B_SAY = [
  "7.2 এর দেয়াল। পুরানো lens এর আলো পড়তো শুধু এই লাইনে।",
  "দরজার উপরের heart লাইনের উপর। আলো পৌঁছালো।",
  "জানালার উপরেরটা লাইনের বাইরে। কোনো পাকেই না।",
  "আজকের মোটের কাগজ সেই দেয়াল। আলোর লাইন column space, heart টা b.",
];

export function WallCallback() {
  const s = useScene(3, [600, 1800, 1800, 2600]);
  const k = s.k;
  const f = X5B_F;
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <Plane f={f} label="7.2 এর দেয়াল: পুরানো lens এর আলোর লাইন, দরজার উপরের heart জ্বলে, জানালার উপরেরটা জ্বলে না" grid={0} axes={false} paper={false} className="my-0! max-w-[13rem]">
        <WallBed f={f} tree={false} />
        <WallGrid f={f} nums={false} />
        <Post f={f} />
        <LitRegion f={f} cols={OLD_LENS} />
        <Heart f={f} at={[6, 3]} lit={k >= 1} />
        <Heart f={f} at={[2, 4]} mark={k >= 2 ? "x" : undefined} />
        {k >= 3 && (
          <g className={POP}>
            <rect x={f.sx(6) - 8} y={f.sy(3) - 26} width={16} height={13} rx={3} fill="white" stroke="#2563eb" />
            <text x={f.sx(6)} y={f.sy(3) - 16} textAnchor="middle" fontSize={10} fontWeight={800} fill="#2563eb">
              b
            </text>
          </g>
        )}
      </Plane>
    </Scene>
  );
}

// 6½ · The chain, one tile at a time: two directions (5) → the whole paper
//      (7) → det ≠ 0 (8) → an undo lens (9) → one answer, x = A⁻¹b.

const X6B_TILES: { say: string; from: string }[] = [
  { say: "দুই লাফ আলাদা দিকে", from: "Article 5" },
  { say: "পুরা কাগজ ভরে", from: "Article 7" },
  { say: "det ≠ 0", from: "Article 8" },
  { say: "ফেরার lens আছে", from: "Article 9" },
  { say: "এক দাম: x = A⁻¹b", from: "আজ" },
];
const X6B_SAY = [
  "det শূন্য না হলে কী কী সত্যি, একটার পর একটা।",
  "দুই লাফ আলাদা দিকে। একটা আরেকটার copy না।",
  "তাই দুই লাফ মিলে পুরা মোটের কাগজ ভরে।",
  "ছোপে জায়গা আছে: det ≠ 0।",
  "তাই ফেরার lens আছে, A⁻¹।",
  "তাই যেকোনো b এর জন্য ঠিক এক x: x = A⁻¹b।",
];

function ChainIcon({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 40 30" className="h-7 w-9" aria-hidden="true">
      {i === 0 && (
        <>
          <path d="M6 26L30 18" stroke={AM} strokeWidth={2.4} strokeLinecap="round" />
          <path d="M6 26L16 4" stroke={TE} strokeWidth={2.4} strokeLinecap="round" />
        </>
      )}
      {i === 1 && <rect x={4} y={3} width={32} height={24} rx={2} fill={GLOW} fillOpacity={0.7} stroke={LAMP} />}
      {i === 2 && <path d="M6 26L28 20L36 4L14 10Z" fill={GLOW} fillOpacity={0.8} stroke={LAMP} strokeWidth={1.2} />}
      {i === 3 && (
        <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M27 18A9 9 0 1 1 24 7" />
          <path d="M19 4.5l5.5 2l-1.8 5.4" />
        </g>
      )}
      {i === 4 && (
        <>
          <path d="M4 24L36 8M4 8L36 24" stroke="#94a3b8" strokeWidth={1.6} />
          <circle cx={20} cy={16} r={4} fill="#7c3aed" />
        </>
      )}
    </svg>
  );
}

export function ChainTiles() {
  const s = useScene(5, [600, 1600, 1600, 1600, 1600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <div className="mx-auto flex max-w-[20rem] flex-wrap items-center justify-center gap-x-1 gap-y-1.5">
        {X6B_TILES.map((t, i) => (
          <span key={t.say} className="flex items-center gap-1">
            <span className={`flex w-[4.4rem] flex-col items-center rounded-lg border px-1 py-1 text-center text-[0.62rem] leading-tight transition-[opacity,background-color,border-color] duration-500 motion-reduce:transition-none ${i < k ? "border-accent/60 bg-accent/10 opacity-100" : "border-border opacity-35"}`}>
              <ChainIcon i={i} />
              <b className={i === 2 ? "font-mono" : ""}>{t.say}</b>
              <span className="text-muted">{t.from}</span>
            </span>
            {i < X6B_TILES.length - 1 && <RowArrow />}
          </span>
        ))}
      </div>
    </Scene>
  );
}

// 7½ · The three pictures, and where det sends you: det ≠ 0 always the
//      first; det = 0 one of the other two, and b says which. The tempting
//      misreading ("det 0 = no answer") crossed out on the middle one.

const X7B_SAY = [
  "দুই রসিদ, দুই লাইন। ছবি হতে পারে তিন রকম।",
  "det ≠ 0: সবসময় প্রথমটা। এক দাম।",
  "det = 0: বাকি দুইটার একটা। কোনটা, সেটা বলে b।",
  "det 0 মানে উত্তর নাই? না। মাঝেরটায় উত্তর অসীম। det 0 মানে এক উত্তর নাই।",
];

export function NoSingle() {
  const s = useScene(3, [600, 1600, 2000, 2600]);
  const k = s.k;
  const pics: { kind: Kind; say: string }[] = [
    { kind: "one", say: "এক দাম" },
    { kind: "all", say: "অসীম" },
    { kind: "none", say: "নাই" },
  ];
  return (
    <Scene scene={s} caption={say(X7B_SAY, k)}>
      <div className="mx-auto flex max-w-[18rem] justify-center gap-2">
        {pics.map((p, i) => (
          <span key={p.kind} className={`relative flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 transition-colors duration-500 motion-reduce:transition-none ${(k === 1 && i === 0) || (k >= 2 && i > 0) ? "bg-cat-blue/10" : ""}`}>
            <LinesPic kind={p.kind} size={64} />
            <span className="text-xs font-semibold">{p.say}</span>
            {k >= 3 && i === 1 && (
              <span className={`absolute -top-1 left-1/2 -translate-x-1/2 text-xs text-danger ${POP}`}>
                <s>নাই</s>
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="mx-auto mt-1 flex max-w-[18rem] justify-center gap-2 text-center font-mono text-xs font-bold">
        <span className={`w-[4.5rem] transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-0"}`}>det ≠ 0</span>
        <span className={`w-[9.5rem] rounded-b-md border-x-2 border-b-2 border-danger/50 transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "opacity-100" : "opacity-0"}`}>det = 0</span>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  PairsBet: { start: {}, picked: { picks: [true, false, true, false, true], touched: true }, sealed: { picks: [true, true, false, false, true], touched: true, sealed: true } },
  TotalsSlide: { start: {}, moved: { tot: [9, 5], seen: ["6,6", "9,6", "9,5"] }, done: { tot: [4, 10], seen: ["6,6", "9,6", "9,5", "4,10"] } },
  SameSlant: { start: {}, guessed: { guess: 0, tot: [6, 10], moves: 1 }, merged: { guess: 1, tot: [6, 12], moves: 2, found: true }, wrong: { guess: 2, tot: [6, 12], moves: 2, found: true } },
  MatrixForm: { start: {}, three: { stage: 3 }, one: { stage: 4 }, done: { stage: 5 } },
  ColumnPicture: { start: {}, reached: { pq: [2, 1], landed: [5, 4], reached: true }, kha: { pair: 1, pq: [1, 1], landed: [3, 6], tries: ["3,6"] }, lit: { pair: 1, pq: [1, 1], landed: [3, 6], tries: ["3,6", "2,4", "5,10"] } },
  DetDecides: { start: {}, ka: { cur: 0, seen: [true, false, false, false, false] }, kha: { cur: 1, seen: [true, true, false, false, false] }, done: { cur: 4, seen: [true, true, true, true, true] } },
  DependsOnB: { start: {}, on: { b: [2, 4], seen: { on: true, off: true, moved: true } } },
  YourPairs: { start: {}, wrong: { cur: 0, pick: 1 }, some: { cur: 1, pick: 1, done: [true, true, false, false, false] }, done: { cur: 4, pick: 0, done: [true, true, true, true, true] } },
  TryDet: { start: {}, wrong: { at: 0, pick: 0 }, right: { at: 0, pick: 1 }, last: { at: 2, pick: 0 }, done: { at: 3, pick: 0 } },
  TotalsCome: { start: {}, ka: { cur: 0, open: [true, false, false, false, false] }, kha: { cur: 1, open: [true, true, false, false, false] }, gha: { cur: 3, open: [true, true, true, true, false] }, done: { cur: 4, open: [true, true, true, true, true] } },
  MoyraArrives: { rest: { k: 0 }, walk: { k: 1 }, samin: { k: 2 }, claim: { k: 3 }, done: {} },
  NasibClaim: { done: {} },
  WorstPage: { page: { k: 1 }, read: { k: 2 }, done: {} },
  RinaKhata: { done: {} },
  PhoneRings: { ring: { k: 1 }, ear: { k: 2 }, done: {} },
  MoyraLeaves: { rest: { k: 0 }, done: {} },
  LightVanGate: { done: {} },
  StakeFig: { rest: { k: 0 }, khata: { k: 1 }, done: {} },
  SlantFixed: { rest: { k: 0 }, off: { k: 1 }, back: { k: 2 }, done: {} },
  CopySlant: { rest: { k: 0 }, two: { k: 2 }, done: {} },
  Backwards: { rest: { k: 0 }, back: { k: 2 }, done: {} },
  WallCallback: { rest: { k: 0 }, done: {} },
  ChainTiles: { two: { k: 2 }, done: {} },
  NoSingle: { one: { k: 1 }, done: {} },
};
