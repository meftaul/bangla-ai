"use client";

import { type ReactNode } from "react";

import { Bubble, Card, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, Ticks, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { DotBox, Tup, dot } from "@/components/journey/box";
import { Arrow, Lit, Plane, clamp, makeFrame, same, tup, type Frame, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";
import { LightBhai } from "./light-kit";

// Screens for "Math for AI 7.1 — বাজারের list, গুণ করার দুই রাস্তা", told as a
// Journey in the author's Bangla-English. The plan is 07_journey_specs.md,
// block 7.1. It opens Article 7 (matrix multiplication).
//
// The day before গায়ে হলুদ, আপার বিয়ে at নানাবাড়ি. The বাবুর্চি wants 3 ডেকচি
// পোলাও and 2 ডেকচি কাচ্চি and counts by ডেকচি: one ডেকচি পোলাও is চাল 2, মাংস 1;
// one কাচ্চি is চাল 1, মাংস 2 (কেজি). মামা, going to the বাজার once, counts by
// item. Nasib: the two counts won't match, one will come out bigger.
//
// Ten steps. 1 seals the bet (ListBet). 2 walks the বাবুর্চি's way: Shiku hops
// one ডেকচি-arrow per ডেকচি and stops on the list, (8, 7) (DekchiWalk). 3 is
// মামার way: each row of the table sits on the order and a box gives one item
// (BazarRows). 4 runs both on any order; they always land together
// (TwoWaysOneList). 5 grows a ঘি row: 2 numbers in, 3 out; a third dish jams
// (ThirdItem). 6 is the copied row written কাচ্চি-first: (1, 1) hides it,
// (2, 3) shows it (WrongRow). 7 your turn, জর্দা and ফিরনি (YourList). 8 try it,
// রেজালা and আলু-গোশত, Check Q1's numbers (TryNewDekchi). 9 unpacks the bag
// into the ডেকচি and settles the bet (WhoWasRight). 10 closes, no widget.
//
// After the screens: the story scenes (UthanDawn, BaburchiKhata, MamaShop,
// NasibLuck, MamiGhee, KhataCopy, SweetList, RezalaNight, NoonUnpack,
// FirstFire, LightVan) and the watch-only figures (StakeFig, ColumnsStand,
// RowOnOrder, FourHeaps, ManyRows, ShapesClick, XaNo, OneOneHides,
// FourHeapsRezala), each numbered after its screen.
//
// The বাবুর্চি borrows নানা's look with a white cap and his name drawn; the
// লাইট ভাই is 7.2's own (LightBhai from light-kit.tsx, read-only).

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const OK = "#0d9488";
const BAD = "#e11d48";
const AMBER = "#f59e0b";
const CORAL = "#f43f5e";
const BLUE = "#3b82f6";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** One slot name per kind of list, for Tup. */
const DISH = ["পোলাও", "কাচ্চি"];
const DISH3 = ["পোলাও", "কাচ্চি", "জর্দা"];
const ITEM = ["চাল", "মাংস"];
const ITEM3 = ["চাল", "মাংস", "ঘি"];
const SWEET = ["জর্দা", "ফিরনি"];
const SWEET_ITEM = ["চাল", "চিনি"];
const CURRY = ["রেজালা", "আলু-গোশত"];
const CURRY_ITEM = ["পেঁয়াজ", "আলু"];

/** The বাবুর্চি's khata as columns: one ডেকচি পোলাও, one ডেকচি কাচ্চি (চাল, মাংস). */
const G_COLS: XY[] = [
  [2, 1],
  [1, 2],
];
/** the same table read by rows: চাল (পোলাও, কাচ্চি), মাংস (পোলাও, কাচ্চি) */
const G_ROWS: XY[] = [
  [2, 1],
  [1, 2],
];
const ORDER: XY = [3, 2];

/** Where a list of ডেকচি takes you: each column times its count, added. */
const lin = (cols: readonly XY[], amt: readonly number[]): XY => [
  cols.reduce((s, c, j) => s + c[0] * (amt[j] ?? 0), 0),
  cols.reduce((s, c, j) => s + c[1] * (amt[j] ?? 0), 0),
];
/** The walk, one hop per ডেকচি: all of the first dish, then all of the second. */
type Hop = { from: XY; to: XY; j: number };
const hops = (cols: readonly XY[], amt: readonly number[]): Hop[] => {
  const out: Hop[] = [];
  let p: XY = [0, 0];
  cols.forEach((c, j) => {
    for (let n = 0; n < (amt[j] ?? 0); n += 1) {
      const q: XY = [p[0] + c[0], p[1] + c[1]];
      out.push({ from: p, to: q, j });
      p = q;
    }
  });
  return out;
};
/** rows · order, one number per row */
const byRows = (rows: readonly (readonly number[])[], amt: readonly number[]) => rows.map((r) => dot(r, amt));

const TONES = ["amber", "coral", "violet"] as const;
const COL_TEXT = ["text-cat-amber", "text-cat-coral", "text-cat-violet"];

/** a tuple never breaks across lines */
const nb = (s: string) => s.replace(/, (?=[\d−?])/g, ", ");

// ---------------------------------------------------------------------------
// Shared pieces: the graph paper with named axes, the ডেকচি walk, the table,
// the order, মামার list.

function B_Sheet({ f, x, y, label, max = "max-w-[15rem]", drag, children }: { f: Frame; x: string; y: string; label: string; max?: string; drag?: { down: (p: XY) => void }; children?: ReactNode }) {
  return (
    <div className={`mx-auto w-full ${max}`}>
      <Plane f={f} label={label} ticks={1} drag={drag} className="my-0! max-w-none">
        <g className="pointer-events-none">
          <text x={f.sx(f.x1)} y={f.sy(0) + 23} textAnchor="end" fontSize={9} fontWeight={700} fill={INK}>
            {x} (কেজি)
          </text>
          <text x={f.sx(0) + 5} y={f.sy(f.y1) - 5} fontSize={9} fontWeight={700} fill={INK}>
            {y} (কেজি)
          </text>
        </g>
        {children}
      </Plane>
    </div>
  );
}

/** Shiku's hops so far: one arrow per ডেকচি, in its dish's colour, and Shiku at the last stop. */
function B_Walk({ f, cols, amt, k }: { f: Frame; cols: readonly XY[]; amt: readonly number[]; k: number }) {
  const hs = hops(cols, amt);
  const n = Math.min(k, hs.length);
  const at: XY = n === 0 ? [0, 0] : hs[n - 1].to;
  return (
    <>
      {hs.slice(0, n).map((h, i) => (
        <Arrow key={i} f={f} from={h.from} to={h.to} tone={TONES[h.j]} w={2.4} draw />
      ))}
      <Shiku f={f} at={at} />
    </>
  );
}

/** A ring on the paper where a list says it should land. */
function B_Ring({ f, at, tone = OK, name }: { f: Frame; at: XY; tone?: string; name?: string }) {
  return (
    <g className="pointer-events-none">
      <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={11} fill={tone} fillOpacity={0.1} stroke={tone} strokeWidth={2} strokeDasharray="4 3" />
      {name && (
        <text x={f.sx(at[0]) + (at[0] > f.x1 - 4 ? -14 : 14)} y={f.sy(at[1]) + (at[0] > f.x1 - 4 ? 20 : 3)} textAnchor={at[0] > f.x1 - 4 ? "end" : "start"} fontSize={8} fontWeight={700} fill={tone}>
          {name}
        </text>
      )}
    </g>
  );
}

/**
 * The khata's table: one column per dish, one row per item. `onRow` or
 * `onCell` make the cells tappable; `lit` tints a row, `bad` marks one red,
 * `pop` makes a row arrive, `extra` adds a dish the table has no column for.
 */
function B_Table({
  rows,
  rowNames,
  colNames,
  lit = null,
  bad = null,
  pop = null,
  extra,
  onRow,
  onCell,
  disabled = false,
}: {
  rows: readonly (readonly number[])[];
  rowNames: readonly string[];
  colNames: readonly string[];
  lit?: number | null;
  bad?: number | null;
  pop?: number | null;
  extra?: string;
  onRow?: (r: number) => void;
  onCell?: (r: number, c: number) => void;
  disabled?: boolean;
}) {
  const n = colNames.length + (extra ? 1 : 0);
  const tap = onRow || onCell;
  return (
    <div className="inline-grid items-center gap-x-1 gap-y-1 rounded-xl border border-border bg-surface px-2 py-1.5 text-sm" style={{ gridTemplateColumns: `auto repeat(${n}, minmax(2.9rem, auto))` }}>
      <span />
      {colNames.map((c, j) => (
        <span key={c} className={`text-center text-xs font-semibold ${COL_TEXT[j]}`}>
          {c}
        </span>
      ))}
      {extra && <span className="text-center text-xs font-semibold text-danger">{extra}</span>}
      {rows.map((row, i) => {
        const tint = bad === i ? "bg-danger/10 text-danger" : lit === i ? "bg-cat-blue/15" : "";
        const cell = `rounded-md px-1 py-1 text-center font-mono transition-colors duration-300 motion-reduce:transition-none ${tint}`;
        return (
          <div key={rowNames[i]} className={`contents ${pop === i ? FADE : ""}`}>
            <span className={`pr-1 text-xs font-semibold ${bad === i ? "text-danger" : ""}`}>{rowNames[i]}</span>
            {row.map((v, j) =>
              tap ? (
                <button
                  key={j}
                  type="button"
                  disabled={disabled}
                  onClick={() => (onCell ? onCell(i, j) : onRow?.(i))}
                  aria-label={`${rowNames[i]}, ${colNames[j]}: ${v}`}
                  className={`${cell} cursor-pointer border border-border hover:border-cat-blue/60 disabled:cursor-default disabled:hover:border-border`}
                >
                  {v}
                </button>
              ) : (
                <span key={j} className={cell}>
                  {v}
                </span>
              ),
            )}
            {extra && <span className="rounded-md border border-dashed border-danger/60 py-1 text-center font-mono text-danger">?</span>}
          </div>
        );
      })}
    </div>
  );
}

/** The order: how many ডেকচি of each dish. */
function B_Order({ v, of }: { v: readonly number[]; of: readonly string[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-2.5 py-1.5 text-center">
      <div className="text-xs text-muted">order, কয় ডেকচি</div>
      <div className="font-mono text-base font-semibold">
        <Tup v={v} of={of} />
      </div>
    </div>
  );
}

/** মামার list: a white slip, one line per item, filled as each is worked out. */
function B_Slip({ names, vals, grey = false }: { names: readonly string[]; vals: readonly (number | null)[]; grey?: boolean }) {
  return (
    <div className={`mx-auto w-full max-w-[12rem] rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-[#0f1b2d] shadow-sm ${grey ? "opacity-45" : ""}`}>
      <div className="text-center text-xs font-semibold">মামার list</div>
      {names.map((nm, i) => (
        <div key={nm} className="flex items-baseline justify-between border-b border-dotted border-[#94a3b8] py-0.5 text-sm last:border-0">
          <span>{nm}</span>
          {vals[i] === null ? (
            <span className="text-[#94a3b8]">?</span>
          ) : (
            <b key={`${nm}${vals[i]}`} className={`${POP} inline-block font-mono`}>
              {vals[i]} <span className="font-sans text-xs font-normal">কেজি</span>
            </b>
          )}
        </div>
      ))}
    </div>
  );
}

/** Two dishes and their steppers, each in its column's colour. */
function B_Dials({ names, cols, amt, onAmt, max = 3, disabled = false }: { names: readonly string[]; cols: readonly XY[]; amt: XY; onAmt: (v: XY) => void; max?: number; disabled?: boolean }) {
  return (
    <div className="mx-auto mt-2 flex w-full max-w-[21rem] items-center justify-around gap-1 rounded-2xl border border-border bg-surface px-1.5 py-1">
      {names.map((nm, i) => (
        <div key={nm} className="flex items-center gap-1">
          <span className="flex flex-col items-center text-sm leading-tight">
            <b className={COL_TEXT[i]}>{nm}</b> <span className="font-mono text-[0.65rem] text-muted">{tup(cols[i])}</span>
          </span>
          <Stepper value={amt[i]} min={0} max={max} disabled={disabled} label={`${nm} ডেকচি`} onChange={(v) => onAmt(i === 0 ? [v, amt[1]] : [amt[0], v])} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawn things: a ডেকচি, the jute bag, the বাবুর্চি's cap, a name under the feet.

/** A ডেকচি, bottom centre at (x, y): aluminium body, rim, `lid` colour, filled to `fill` (0…1). */
function Pot({ x, y, s = 1, lid, fill = 0, stuff = "#fde68a", steam = false }: { x: number; y: number; s?: number; lid?: string; fill?: number; stuff?: string; steam?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-15 -20Q-17 -2 -10 0H10Q17 -2 15 -20Z" fill="#9ca3af" stroke="#4b5563" strokeWidth={1} />
      <path d="M-15 -14h-4M15 -14h4" stroke="#4b5563" strokeWidth={2} strokeLinecap="round" />
      {fill > 0 && (
        <rect
          x={-12}
          width={24}
          y={-2 - 16 * fill}
          height={16 * fill}
          rx={2}
          fill={stuff}
          className="transition-[y,height] duration-700 motion-reduce:transition-none"
        />
      )}
      <ellipse cy={-20} rx={16} ry={3.4} fill="#d1d5db" stroke="#4b5563" strokeWidth={1} />
      {lid && <ellipse cy={-21} rx={13} ry={2.6} fill={lid} />}
      {steam && <path d="M-5 -26q-3 -5 0 -9t0 -9M5 -26q-3 -5 0 -9t0 -9" fill="none" stroke="#94a3b8" strokeWidth={1.2} strokeLinecap="round" className={FADE} />}
    </g>
  );
}

/** The চটের ব্যাগ, bottom centre at (x, y). */
function Bag({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-13 0Q-18 -15 -10 -26H10Q18 -15 13 0Z" fill="#c8a26b" stroke="#8a6a3b" strokeWidth={1} />
      <path d="M-10 -26q10 -7 20 0" fill="none" stroke="#8a6a3b" strokeWidth={1.4} />
      <path d="M-9 -8h18M-10 -15h20" stroke="#8a6a3b" strokeOpacity={0.4} strokeWidth={0.8} />
    </g>
  );
}

/** The বাবুর্চি: নানা's look, a white cap, and his name. */
function Baburchi({ x, y, facing = 1, arm = "down" }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point" }) {
  return (
    <>
      <Person who="nana" x={x} y={y} facing={facing} arm={arm} />
      <path d={`M${x - 9} ${y - 57}q9 -11 18 0Z`} fill="white" stroke="#cbd5e1" strokeWidth={0.8} className="pointer-events-none" />
      <Name x={x} y={y} text="বাবুর্চি" />
    </>
  );
}

function Name({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK} stroke="white" strokeOpacity={0.6} strokeWidth={2} paintOrder="stroke" className="pointer-events-none">
      {text}
    </text>
  );
}

/** a word written on the stage in the story's own ink */
function Word({ x, y, text, size = 8, fill = INK, anchor = "middle" }: { x: number; y: number; text: string; size?: number; fill?: string; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={600} fill={fill} className="pointer-events-none">
      {text}
    </text>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Two bags side by side, the বাবুর্চি's count and মামার
//     list. The reader picks which comes out bigger (or neither); the bags
//     swell to the pick, a "?" hangs over them, sealed. Settled on screen 9.

const B1_OPTS = ["বাবুর্চির হিসাবে বেশি আসবে", "মামার হিসাবে বেশি আসবে", "দুই হিসাবে সমান আসবে"];
/** bag sizes each pick draws: [বাবুর্চির, মামার] */
const B1_SIZE: [number, number][] = [
  [1.3, 0.8],
  [0.8, 1.3],
  [1, 1],
];

function B1_Bags({ size, q }: { size: [number, number]; q: boolean }) {
  const [l, r] = useTween(size, 700);
  return (
    <svg viewBox="0 0 240 104" role="img" aria-label="বাবুর্চির হিসাবের ব্যাগ আর মামার list এর ব্যাগ, পাশাপাশি" className="mx-auto block h-auto w-full max-w-[15rem]">
      <rect x={1} y={1} width={238} height={102} rx={8} fill="white" stroke="#cbd5e1" />
      <Bag x={70} y={78} s={l * 1.4} />
      <Bag x={170} y={78} s={r * 1.4} />
      <text x={70} y={94} textAnchor="middle" fontSize={9} fontWeight={700} fill="#b45309">
        বাবুর্চির হিসাব
      </text>
      <text x={170} y={94} textAnchor="middle" fontSize={9} fontWeight={700} fill="#1d4ed8">
        মামার list
      </text>
      {q && (
        <text x={120} y={40} textAnchor="middle" fontSize={26} fontWeight={800} fill={BLUE} className={POP}>
          ?
        </text>
      )}
    </svg>
  );
}

function B1_Icon({ i }: { i: number }) {
  const [a, b] = B1_SIZE[i];
  return (
    <svg viewBox="0 0 44 26" aria-hidden="true" className="h-6 w-auto shrink-0">
      <Bag x={12} y={25} s={a * 0.75} />
      <Bag x={32} y={25} s={b * 0.75} />
    </svg>
  );
}

export function ListBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const act = usePlay(750);
  const seal = (i: number) => {
    setBet(i);
    act.play(3, () => pass("বাজি সিল হলো। আগে এক ডেকচি করে দেখি।"));
  };
  // beats of the acted bet: 1 the bags swell to the pick, 2 its "?", 3 sealed
  const k = bet === null ? 0 : act.running ? act.k : 3;
  return (
    <>
      <div className="mb-1 text-center text-sm">
        বাবুর্চির order: পোলাও <b className="font-mono">3</b> ডেকচি, কাচ্চি <b className="font-mono">2</b> ডেকচি।
      </div>
      <B1_Bags size={bet !== null && k >= 1 ? B1_SIZE[bet] : [1, 1]} q={k >= 2} />
      <div className="mt-3 grid gap-2">
        {B1_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            <span className="flex items-center gap-2 text-sm leading-tight">
              {bet === null && <B1_Icon i={i} />}
              <span>{o}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={bet !== null && k >= 3}>কার হিসাবে বেশি আসবে? একটার উপর বাজি ধরুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The বাবুর্চি's way, on the paper. চাল to the right, মাংস up. One ডেকচি
//     পোলাও is the arrow (2, 1), one কাচ্চি (1, 2). The reader dials the ডেকচি
//     and Shiku hops one arrow per ডেকচি: 1 + 1 stops at (3, 3), the real
//     order 3 + 2 at (8, 7).

const F2 = makeFrame(-0.5, 9.5, -0.9, 9.5, 18, 14);

export function DekchiWalk() {
  const pass = useGate();
  const [amt, setAmt] = useSeed<XY>("amt", [1, 1]);
  const [last, setLast] = useSeed<XY | null>("last", null);
  const [got, setGot] = useSeed<[boolean, boolean]>("got", [false, false]);
  const walk = usePlay(380);
  const n = last ? hops(G_COLS, last).length : 0;
  const k = walk.running ? walk.k : n;
  const land = last ? lin(G_COLS, last) : null;
  const go = () => {
    if (amt[0] + amt[1] === 0) return;
    const a: XY = [amt[0], amt[1]];
    setLast(a);
    walk.play(hops(G_COLS, a).length, () => {
      const g: [boolean, boolean] = [got[0] || same(a, [1, 1]), got[1] || same(a, [3, 2])];
      setGot(g);
      if (g[0] && g[1] && !(got[0] && got[1])) pass("যত ডেকচি, তত বার হাঁটা। থামলেই list।");
    });
  };
  const dial = (v: XY) => {
    if (walk.running) return;
    setAmt(v);
    setLast(null);
  };
  return (
    <>
      <B_Sheet f={F2} x="চাল" y="মাংস" label={`ডেকচি ধরে হাঁটা: পোলাও ${amt[0]}, কাচ্চি ${amt[1]}`}>
        {!last && (
          <>
            <Arrow f={F2} from={[0, 0]} to={G_COLS[0]} tone="amber" w={2.4} />
            <Arrow f={F2} from={[0, 0]} to={G_COLS[1]} tone="coral" w={2.4} />
          </>
        )}
        {last && <B_Walk key={`${last[0]},${last[1]}`} f={F2} cols={G_COLS} amt={last} k={k} />}
        {!last && <Shiku f={F2} at={[0, 0]} />}
      </B_Sheet>
      <B_Dials names={DISH} cols={G_COLS} amt={amt} onAmt={dial} disabled={walk.running} />
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" className={primaryBtn} onClick={go} disabled={walk.running || amt[0] + amt[1] === 0}>
          Shiku কে হাঁটান
        </button>
      </div>
      <div className="mt-1 min-h-6 text-center text-sm">
        {land && !walk.running && (
          <span className={FADE}>
            থামলো <b className="font-mono"><Tup v={land} of={ITEM} /></b>: চাল {land[0]} কেজি, মাংস {land[1]} কেজি।
          </span>
        )}
      </div>
      <Ticks
        items={[
          ["1 পোলাও + 1 কাচ্চি", got[0]],
          ["3 পোলাও + 2 কাচ্চি", got[1]],
        ]}
      />
      <Task done={got[0] && got[1]}>ডেকচি ঠিক করে Shiku কে হাঁটান। আগে 1 + 1, তারপর বাবুর্চির order, 3 + 2।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · মামার way। The table, the order (3, 2), মামার list. Tap a row: it sits
//     on the order, the box pairs পোলাও with পোলাও and কাচ্চি with কাচ্চি,
//     multiplies, adds, and the item's number drops into the list.

export function BazarRows() {
  const pass = useGate();
  const [done, setDone] = useSeed<[boolean, boolean]>("done", [false, false]);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const run = usePlay(700);
  const tap = (r: number) => {
    if (run.running || done[r]) return;
    setCur(r);
    run.play(3, () => {
      const d: [boolean, boolean] = r === 0 ? [true, done[1]] : [done[0], true];
      setDone(d);
      if (d[0] && d[1]) pass("এক row, এক জিনিস। হিসাবটা dot product.");
    });
  };
  const k = run.running ? run.k : 3;
  const vals = [0, 1].map((i) => (done[i] || (cur === i && !run.running) ? dot(G_ROWS[i], ORDER) : null));
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <B_Table rows={G_ROWS} rowNames={ITEM} colNames={DISH} lit={cur} onRow={tap} disabled={run.running} />
        <B_Order v={ORDER} of={DISH} />
      </div>
      <div className="mt-3 min-h-[7.5rem]">
        {cur !== null && (
          <div key={cur} className={FADE}>
            <div className="mb-1 text-center text-xs text-muted">
              <b className="text-foreground">{ITEM[cur]}</b> এর row <span className="font-mono">{tup(G_ROWS[cur])}</span> বসলো order <span className="font-mono">(3, 2)</span> এর উপর
            </div>
            <DotBox a={G_ROWS[cur]} b={ORDER} k={k} names={DISH} />
          </div>
        )}
      </div>
      <div className="mt-2">
        <B_Slip names={ITEM} vals={vals} />
      </div>
      <Task done={done[0] && done[1]}>চাল এর row এ tap করুন, তারপর মাংসের row এ। দেখুন মামার list এ কী ওঠে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Lucky, or always? Predict first. Then any order: Shiku walks the
//     বাবুর্চি's way, and the rows' answer rings the spot on the paper. Three
//     different orders; every time Shiku stops inside the ring.

const F4 = makeFrame(-0.5, 9.5, -0.9, 9.5, 18, 14);
const B4_OPTS = ["যেকোনো order এ মিলবে", "অন্য order এ মিলবে না"];

export function TwoWaysOneList() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [amt, setAmt] = useSeed<XY>("amt", [1, 3]);
  const [last, setLast] = useSeed<XY | null>("last", null);
  const [runs, setRuns] = useSeed<string[]>("runs", []);
  const walk = usePlay(320);
  const over = runs.length >= 3;
  const n = last ? hops(G_COLS, last).length : 0;
  const k = walk.running ? walk.k : n;
  const go = () => {
    if (guess === null || amt[0] + amt[1] === 0) return;
    const a: XY = [amt[0], amt[1]];
    setLast(a);
    walk.play(hops(G_COLS, a).length, () => {
      const key = `${a[0]},${a[1]}`;
      if (runs.includes(key)) return;
      const next = [...runs, key];
      setRuns(next);
      if (next.length === 3) pass("একই গুণ, একই যোগ। শুধু গোছানো আলাদা।");
    });
  };
  const dial = (v: XY) => {
    if (walk.running) return;
    setAmt(v);
    setLast(null);
  };
  const ring = last ? (byRows(G_ROWS, last) as XY) : null;
  const stop = last ? lin(G_COLS, last) : null;
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {B4_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, 0)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="text-sm leading-tight">{o}</span>
          </Choice>
        ))}
      </div>
      <div className="mt-2">
        <B_Sheet f={F4} x="চাল" y="মাংস" label="বাবুর্চির পথে Shiku হাঁটে; মামার list এর দাগ গোল করে দেওয়া" max="max-w-[13.5rem]">
          {last ? <B_Walk key={`${last[0]},${last[1]}`} f={F4} cols={G_COLS} amt={last} k={k} /> : <Shiku f={F4} at={[0, 0]} />}
          {ring && !walk.running && <B_Ring f={F4} at={ring} tone={BLUE} name="মামার list" />}
        </B_Sheet>
      </div>
      <B_Dials names={DISH} cols={G_COLS} amt={amt} onAmt={dial} disabled={walk.running || guess === null} />
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" className={primaryBtn} onClick={go} disabled={guess === null || walk.running || amt[0] + amt[1] === 0}>
          দুই হিসাব চালান
        </button>
        <span className="text-sm text-muted tabular-nums">{Math.min(runs.length, 3)} / 3 order</span>
      </div>
      {ring && stop && !walk.running && (
        <div className={`mt-1 text-center text-sm ${FADE}`}>
          Shiku থামলো <b className="font-mono"><Tup v={stop} of={ITEM} /></b>, মামার list <b className="font-mono"><Tup v={ring} of={ITEM} /></b>.
        </div>
      )}
      <Task done={over}>আগে একটা বেছে নিন। তারপর তিনটা আলাদা order দিয়ে দুই হিসাব চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · ঘি। The table grows a third row; the same order (3, 2) now gives three
//     numbers, each item's count laid out as squares, one per কেজি. Then a
//     third dish, জর্দা: the table has no column for it and the box jams.

const T5_ROWS = [
  [2, 1],
  [1, 2],
  [1, 1],
];

/** each item as a row of squares, one per কেজি, filled up to `upto` rows */
function B_Squares({ names, vals, upto, grey = false }: { names: readonly string[]; vals: readonly number[]; upto: number; grey?: boolean }) {
  return (
    <div className={`mx-auto w-full max-w-[16rem] rounded-xl border border-[#cbd5e1] bg-white px-3 py-1.5 text-[#0f1b2d] transition-opacity duration-500 motion-reduce:transition-none ${grey ? "opacity-40" : ""}`}>
      <div className="text-center text-xs font-semibold">মামার list</div>
      {names.map((nm, i) => (
        <div key={nm} className="flex items-center gap-2 py-0.5">
          <span className="w-8 text-xs font-semibold">{nm}</span>
          <svg viewBox="0 0 120 10" aria-hidden="true" className="h-2.5 flex-1">
            {i < upto &&
              Array.from({ length: vals[i] }, (_, s) => (
                <rect key={s} x={s * 12} y={0} width={10} height={10} rx={1.5} fill={["#fbbf24", "#f87171", "#a3e635"][i]} className={POP} style={{ transitionDelay: `${s * 50}ms` }} />
              ))}
          </svg>
          <span className="w-6 text-right font-mono text-sm font-bold">{i < upto ? vals[i] : "?"}</span>
        </div>
      ))}
    </div>
  );
}

export function ThirdItem() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const run = usePlay(650);
  const vals = byRows(T5_ROWS, ORDER);
  const go = () => {
    if (run.running) return;
    run.play(3, () => setStage(1));
  };
  const jam = () => {
    if (run.running) return;
    setStage(2);
    run.play(4, () => pass("Column কয়টা, order এ কয়টা: সমান হতেই হবে।"));
  };
  const upto = stage >= 1 ? 3 : run.running ? run.k : 0;
  const lit = stage === 0 && run.running && run.k > 0 ? run.k - 1 : null;
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <B_Table rows={T5_ROWS} rowNames={ITEM3} colNames={DISH} pop={2} lit={lit} bad={stage === 2 ? 0 : null} extra={stage === 2 ? "জর্দা" : undefined} />
        <B_Order v={stage === 2 ? [3, 2, 2] : ORDER} of={stage === 2 ? DISH3 : DISH} />
      </div>
      <div className="mt-3">
        <B_Squares names={ITEM3} vals={vals} upto={upto} grey={stage === 2} />
      </div>
      {stage === 2 && (
        <div className={`mt-2 ${FADE}`}>
          <div className="mb-1 text-center text-xs text-danger">চাল এর row এ ঘর 2 টা, order এ সংখ্যা 3 টা</div>
          <DotBox a={T5_ROWS[0]} b={[3, 2, 2]} k={run.running ? Math.min(run.k, 3) : 3} names={DISH3} />
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {stage === 0 && (
          <button type="button" className={primaryBtn} onClick={go} disabled={run.running}>
            মামার list চালান
          </button>
        )}
        {stage === 1 && (
          <button type="button" className={primaryBtn} onClick={jam}>
            জর্দাও 2 ডেকচি দিন
          </button>
        )}
      </div>
      {stage === 1 && (
        <div className={`mt-1 text-center text-sm ${FADE}`}>
          ঢুকলো 2 টা সংখ্যা, বের হলো 3 টা: <b className="font-mono"><Tup v={vals} of={ITEM3} /></b>
        </div>
      )}
      <Task done={stage === 2 && !run.running}>ঘি সহ মামার list চালান। তারপর order এ জর্দাও 2 ডেকচি দিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The copied row. Samin's table has the মাংস row as the khata writes it,
//     কাচ্চি first: (2, 1)। Check with (1, 1): Shiku (the বাবুর্চি's ডেকচি)
//     and Samin's ring agree. Check with (2, 3): Shiku stops at মাংস 8, the
//     ring says 7. The reader taps the wrong row's cell; it flips; they agree.

const F6 = makeFrame(-0.5, 9.5, -0.9, 9.5, 18, 14);
const W6_BAD = [
  [2, 1],
  [2, 1],
];
const W6_CHECKS: XY[] = [
  [1, 1],
  [2, 3],
];

export function WrongRow() {
  const pass = useGate();
  // 0 nothing checked · 1 (1, 1) checked · 2 (2, 3) checked, wrong · 3 fixed
  const [stage, setStage] = useSeed("stage", 0);
  const [miss, setMiss] = useSeed("miss", 0);
  const walk = usePlay(380);
  const fix = usePlay(450);
  const fixed = stage >= 3;
  const rows = fixed ? G_ROWS : W6_BAD;
  const amt: XY | null = stage === 0 && !walk.running ? null : stage === 0 || (stage === 1 && !walk.running) ? W6_CHECKS[0] : W6_CHECKS[1];
  const n = amt ? hops(G_COLS, amt).length : 0;
  const k = walk.running ? walk.k : n;
  const ringT = amt ? (byRows(rows, amt) as XY) : ([0, 0] as XY);
  const [rx, ry] = useTween(ringT, 600);
  const shiku = amt ? lin(G_COLS, amt) : null;
  const agree = !!amt && same(ringT, lin(G_COLS, amt));
  const check = (i: number) => {
    if (walk.running) return;
    setStage(i === 0 ? 0 : 1);
    walk.play(hops(G_COLS, W6_CHECKS[i]).length, () => setStage(i === 0 ? 1 : 2));
  };
  const tapCell = (r: number) => {
    if (stage !== 2 || walk.running) return;
    if (r === 0) {
      setMiss(miss + 1);
      return;
    }
    setStage(3);
    fix.play(2, () => pass("(1, 1) উল্টা ধরে না। মিলান অসমান সংখ্যায়।"));
  };
  return (
    <>
      <div className="flex items-start justify-center gap-2">
        <div className="text-center">
          <div className="mb-0.5 text-xs text-muted">সামিনের table</div>
          <B_Table rows={rows} rowNames={ITEM} colNames={DISH} onCell={stage === 2 ? (r) => tapCell(r) : undefined} />
        </div>
        <div className="w-[11.5rem]">
          <B_Sheet f={F6} x="চাল" y="মাংস" label="Shiku বাবুর্চির ডেকচি ধরে হাঁটে; সামিনের table এর হিসাব গোল দাগে" max="max-w-none">
            {amt && !walk.running && stage !== 3 && <B_Ring f={F6} at={[rx, ry]} tone={agree ? OK : BAD} />}
            {stage === 3 && <B_Ring f={F6} at={[rx, ry]} tone={fix.running ? BAD : OK} />}
            {amt ? <B_Walk key={`${amt[0]},${amt[1]}`} f={F6} cols={G_COLS} amt={amt} k={k} /> : <Shiku f={F6} at={[0, 0]} />}
            {stage === 2 && shiku && !walk.running && (
              <path d={`M${F6.sx(shiku[0])} ${F6.sy(shiku[1])}V${F6.sy(ringT[1])}`} stroke={BAD} strokeWidth={2} strokeDasharray="3 2" className={FADE} />
            )}
          </B_Sheet>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button type="button" className={primaryBtn} onClick={() => check(0)} disabled={walk.running || stage >= 2}>
          (1, 1) দিয়ে মিলান
        </button>
        <button type="button" className={primaryBtn} onClick={() => check(1)} disabled={walk.running || stage < 1 || stage >= 2}>
          (2, 3) দিয়ে
        </button>
      </div>
      {stage === 1 && !walk.running && <div className={`mt-2 text-center text-sm text-accent-text ${FADE}`}>Shiku ঠিক দাগের ভেতরে: চাল 3, মাংস 3।</div>}
      {stage === 2 && !walk.running && miss === 0 && (
        <Nope>
          Shiku থামলো মাংস <b>8</b> এ। সামিনের table বলে <b>7</b>. চাল দুইটাতেই 7। সামিনের table এর ভুল ঘরে tap করুন।
        </Nope>
      )}
      {stage === 2 && miss > 0 && <Nope key={miss}>চাল এর row ঠিক আছে, দুই হিসাবেই চাল 7। ফারাক শুধু উপর-নিচে, মানে মাংসে।</Nope>}
      {stage === 3 && !fix.running && <div className={`mt-2 text-center text-sm text-accent-text ${FADE}`}>মাংসের row এখন (1, 2): আগে পোলাও, পরে কাচ্চি। চাল 7, মাংস 8।</div>}
      <Ticks
        items={[
          ["(1, 1)", stage >= 1],
          ["(2, 3)", stage >= 3],
        ]}
      />
      <Task done={stage === 3 && !fix.running}>আগে (1, 1) দিয়ে মিলান, তারপর (2, 3)। না মিললে সামিনের table এর ভুল ঘরে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn. জর্দা (চাল 1, চিনি 2) and ফিরনি (চাল 1, চিনি 1), order 3 and 2.
//     The reader writes মামার list with two steppers; the ring sits there.
//     Shiku walks the ডেকচি and must stop inside it: (5, 8).

const F7 = makeFrame(-0.5, 9.5, -0.9, 9.5, 18, 14);
const Y7_COLS: XY[] = [
  [1, 2],
  [1, 1],
];
const Y7_ROWS = [
  [1, 1],
  [2, 1],
];
const Y7_ORDER: XY = [3, 2];
const Y7_RIGHT: XY = [5, 8];

export function YourList() {
  const pass = useGate();
  const [list, setList] = useSeed<XY>("list", [0, 0]);
  const [tried, setTried] = useSeed("tried", false);
  const [miss, setMiss] = useSeed("miss", 0);
  const [won, setWon] = useSeed("won", false);
  const walk = usePlay(340);
  const n = hops(Y7_COLS, Y7_ORDER).length;
  const k = walk.running ? walk.k : tried ? n : 0;
  const [rx, ry] = useTween(list, 350);
  const go = () => {
    if (walk.running || won) return;
    const mine: XY = [list[0], list[1]];
    setTried(true);
    walk.play(n, () => {
      if (same(mine, Y7_RIGHT)) {
        setWon(true);
        pass("চাল 5, চিনি 8। Row ধরেও, হেঁটেও।");
      } else setMiss(miss + 1);
    });
  };
  const set = (v: XY) => {
    if (walk.running || won) return;
    setList(v);
  };
  const wrong = tried && !walk.running && !won;
  const off = [list[0] !== Y7_RIGHT[0], list[1] !== Y7_RIGHT[1]];
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <B_Table rows={Y7_ROWS} rowNames={SWEET_ITEM} colNames={SWEET} />
        <B_Order v={Y7_ORDER} of={SWEET} />
      </div>
      <div className="mt-2">
        <B_Sheet f={F7} x="চাল" y="চিনি" label="আপনার list এর দাগ; Shiku জর্দা আর ফিরনির ডেকচি ধরে হাঁটে" max="max-w-[13rem]">
          <B_Ring f={F7} at={[rx, ry]} tone={won ? OK : BLUE} name="আপনার list" />
          <B_Walk f={F7} cols={Y7_COLS} amt={Y7_ORDER} k={k} />
        </B_Sheet>
      </div>
      <div className="mx-auto mt-2 flex w-full max-w-[17rem] items-center justify-around rounded-2xl border border-border bg-surface px-2 py-1">
        {SWEET_ITEM.map((nm, i) => (
          <span key={nm} className="flex items-center gap-1 text-sm">
            <b>{nm}</b>
            <Stepper value={list[i]} min={0} max={9} disabled={walk.running || won} label={nm} onChange={(v) => set(i === 0 ? [v, list[1]] : [list[0], v])} />
          </span>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} onClick={go} disabled={walk.running || won}>
          Shiku কে দিয়ে মিলান
        </button>
      </div>
      {wrong && (
        <Nope key={miss}>
          Shiku থামলো চাল 5, চিনি 8 এ। আপনার list এ{off[0] ? ` চাল ${list[0]}` : ""}
          {off[0] && off[1] ? "," : ""}
          {off[1] ? ` চিনি ${list[1]}` : ""}. {off[1] ? "চিনির row: জর্দা প্রতি 2, ফিরনি প্রতি 1।" : "চাল এর row: জর্দা প্রতি 1, ফিরনি প্রতি 1।"}
        </Nope>
      )}
      <Task done={won}>মামার list বানান: চাল কত, চিনি কত। তারপর Shiku কে দিয়ে মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it (Check Q1). রেজালা (পেঁয়াজ 3, আলু 0) and আলু-গোশত (পেঁয়াজ 1,
//     আলু 2), order 4 and 5. The reader taps where the list lands. Every tap
//     walks the ডেকচি; a wrong one leaves a red dot and a dashed gap to Shiku.

const F8 = makeFrame(-0.5, 18.5, -0.9, 11.5, 13, 14);
const T8_COLS: XY[] = [
  [3, 0],
  [1, 2],
];
const T8_ROWS = [
  [3, 1],
  [0, 2],
];
const T8_ORDER: XY = [4, 5];
const T8_RIGHT: XY = [17, 10];

export function TryNewDekchi() {
  const pass = useGate();
  const [pick, setPick] = useSeed<XY | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const walk = usePlay(210);
  const n = hops(T8_COLS, T8_ORDER).length;
  const right = pick !== null && same(pick, T8_RIGHT);
  const tap = (p: XY) => {
    if (walk.running || right) return;
    const q: XY = [clamp(Math.round(p[0]), 0, 18), clamp(Math.round(p[1]), 0, 11)];
    setPick(q);
    if (same(q, T8_RIGHT)) walk.play(n, () => pass("(17, 10). দুই পথেই।"));
    else {
      setMiss(miss + 1);
      walk.play(n);
    }
  };
  const k = pick === null ? 0 : walk.running ? walk.k : n;
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <B_Table rows={T8_ROWS} rowNames={CURRY_ITEM} colNames={CURRY} />
        <B_Order v={T8_ORDER} of={CURRY} />
      </div>
      <div className="mt-2">
        <B_Sheet f={F8} x="পেঁয়াজ" y="আলু" label="মামার list কোথায় পড়বে, সেখানে tap করুন" max="max-w-[20rem]" drag={{ down: tap }}>
          {pick && !right && !walk.running && <path d={`M${F8.sx(pick[0])} ${F8.sy(pick[1])}L${F8.sx(17)} ${F8.sy(10)}`} stroke={BAD} strokeWidth={1.6} strokeDasharray="3 3" className={FADE} />}
          <B_Walk key={miss} f={F8} cols={T8_COLS} amt={T8_ORDER} k={k} />
          {pick && <circle key={`${pick[0]},${pick[1]}`} cx={F8.sx(pick[0])} cy={F8.sy(pick[1])} r={5.5} fill={right ? OK : BAD} stroke="white" strokeWidth={1.4} className={POP} />}
        </B_Sheet>
      </div>
      {pick && !right && !walk.running && (
        <Nope key={miss}>
          আপনার দাগ <span className="font-mono">{tup(pick)}</span> এ। Shiku ডেকচি ধরে হেঁটে থামলো অন্য জায়গায়।{" "}
          {pick[0] !== 17 ? "পেঁয়াজ: রেজালার 4 ডেকচিতে 3 করে, আলু-গোশতের 5 ডেকচিতে 1 করে।" : "আলু: রেজালায় আলু নাই, আলু-গোশতের 5 ডেকচিতে 2 করে।"}
        </Nope>
      )}
      {right && !walk.running && <div className={`mt-2 text-center text-sm font-semibold text-accent-text ${FADE}`}>পেঁয়াজ 17 কেজি, আলু 10 কেজি।</div>}
      <Task done={right && !walk.running}>মামার list কাগজের কোথায় পড়বে? সেখানে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The bag, unpacked. চাল 8 and মাংস 7 on the মাদুর as squares, one per
//     কেজি; five ডেকচি, three পোলাও and two কাচ্চি. Each tap fills one the
//     বাবুর্চি's way and takes its squares off the heap. The last one empties
//     the heap exactly; then the three bet cards are marked.

const W9_DISH = [0, 0, 0, 1, 1];

function W9_Heap({ name, total, left, color }: { name: string; total: number; left: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs font-semibold">{name}</span>
      <svg viewBox="0 0 96 10" aria-hidden="true" className="h-2.5 flex-1">
        {Array.from({ length: total }, (_, s) => (
          <rect
            key={s}
            x={s * 12}
            y={0}
            width={10}
            height={10}
            rx={1.5}
            fill={s < left ? color : "none"}
            stroke={s < left ? "none" : "#cbd5e1"}
            strokeDasharray="2 2"
            className="transition-[fill] duration-500 motion-reduce:transition-none"
          />
        ))}
      </svg>
      <span className="w-5 text-right font-mono text-sm font-bold">{left}</span>
    </div>
  );
}

function W9_Verdict() {
  const cards: [string, boolean][] = [
    ["বাবুর্চির হিসাবে বেশি", false],
    ["মামার হিসাবে বেশি", false],
    ["দুই হিসাবে সমান", true],
  ];
  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {cards.map(([t, ok], i) => (
        <div key={t} className={`relative rounded-lg border px-1.5 py-1 text-center text-xs leading-tight ${ok ? "border-accent bg-accent/10 font-semibold" : "border-border text-muted"} ${FADE}`}>
          {t}
          <svg viewBox="0 0 60 24" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            {ok ? (
              <Draw d="M30 1C52 1 59 7 59 12C59 19 49 23 30 23C10 23 1 19 1 12C1 5 11 1 28 2" strokeWidth={1.6} ms={600} delay={i * 200} className="stroke-accent" />
            ) : (
              <Draw d="M4 20L56 4" strokeWidth={1.8} ms={450} delay={i * 200} className="stroke-danger" />
            )}
          </svg>
        </div>
      ))}
    </div>
  );
}

export function WhoWasRight() {
  const pass = useGate();
  const [filled, setFilled] = useSeed<boolean[]>("filled", [false, false, false, false, false]);
  const pour = usePlay(450);
  const used = (item: 0 | 1) => filled.reduce((s, f, i) => s + (f ? G_COLS[W9_DISH[i]][item] : 0), 0);
  const all = filled.every(Boolean);
  const tap = (i: number) => {
    if (filled[i] || pour.running) return;
    const next = filled.map((f, j) => f || j === i);
    setFilled(next);
    if (next.every(Boolean)) pour.play(2, () => pass("দুইজনের হিসাব একই। দুই দিক থেকে গোনা।"));
    else pour.play(1);
  };
  return (
    <>
      <div className="mx-auto w-full max-w-[16rem] rounded-xl border border-[#cbd5e1] bg-[#fef3c7] px-3 py-1.5 text-[#0f1b2d]">
        <div className="text-center text-xs font-semibold">মাদুরে, মামার ব্যাগ থেকে</div>
        <W9_Heap name="চাল" total={8} left={8 - used(0)} color="#fbbf24" />
        <W9_Heap name="মাংস" total={7} left={7 - used(1)} color="#f87171" />
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1">
        {W9_DISH.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(i)}
            disabled={filled[i] || pour.running}
            aria-label={`${DISH[d]} এর ডেকচি${filled[i] ? ", ভরা" : ""}`}
            className={`flex cursor-pointer flex-col items-center rounded-xl border-2 py-1 transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${filled[i] ? "border-accent/60 bg-accent/5" : "border-border hover:border-cat-blue/60"}`}
          >
            <svg viewBox="-22 -38 44 40" aria-hidden="true" className="h-11 w-full">
              <Pot x={0} y={0} fill={filled[i] ? 0.9 : 0} stuff={d === 0 ? "#fde68a" : "#fdba74"} steam={filled[i]} />
            </svg>
            <span className={`text-xs font-semibold ${COL_TEXT[d]}`}>{DISH[d]}</span>
            <span className="font-mono text-[0.65rem] text-muted">{tup(G_COLS[d])}</span>
          </button>
        ))}
      </div>
      {all && !pour.running && (
        <div className={FADE}>
          <div className="mt-2 text-center text-sm font-semibold text-accent-text">পাঁচ ডেকচি ভরলো। মাদুরে একটা দানাও বাকি নাই, কিছু কমও পড়লো না।</div>
          <W9_Verdict />
        </div>
      )}
      <Task done={all && !pour.running}>প্রত্যেক ডেকচিতে tap করুন। বাবুর্চির খাতা মতো জিনিস উঠবে। দেখুন মাদুরে কী থাকে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. Watch-only, driven by the reader (useScene). The নানাবাড়ি
// উঠান: the tin-roofed house at the back, the packed-earth yard.

function S_House({ door = true }: { door?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={70} width={320} height={80} fill="#d9c4a1" />
      <path d="M-4 72L0 50H320L324 72Z" fill="#94a3b8" />
      <path d="M0 58H320M0 64H320" stroke="#64748b" strokeOpacity={0.5} strokeWidth={0.8} />
      {door && <rect x={150} y={96} width={26} height={54} fill="#7c4a1e" />}
    </g>
  );
}

function S_Yard() {
  return <rect x={0} y={150} width={320} height={30} fill="#c9a77a" className="pointer-events-none" />;
}

/** a bicycle, rear wheel at x − 14, front at x + 14, ground at y, bag on the handle */
function S_Cycle({ x, y, bag = true }: { x: number; y: number; bag?: boolean }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x - 14} cy={y - 9} r={9} fill="none" stroke="#334155" strokeWidth={1.6} />
      <circle cx={x + 14} cy={y - 9} r={9} fill="none" stroke="#334155" strokeWidth={1.6} />
      <path d={`M${x - 14} ${y - 9}L${x - 3} ${y - 22}L${x + 10} ${y - 22}L${x + 14} ${y - 9}M${x - 3} ${y - 22}L${x + 2} ${y - 9}L${x - 14} ${y - 9}M${x + 10} ${y - 22}L${x + 9} ${y - 30}h5`} fill="none" stroke="#16a34a" strokeWidth={1.8} />
      {bag && <Bag x={x + 13} y={y - 14} s={0.55} />}
    </g>
  );
}

/** an open khata, centred at (x, y) */
function S_Khata({ x, y, w = 30, lines = 3 }: { x: number; y: number; w?: number; lines?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - w / 2} y={y - 10} width={w} height={20} fill="white" stroke={INK} strokeOpacity={0.4} />
      <path d={`M${x} ${y - 10}V${y + 10}`} stroke={INK} strokeOpacity={0.3} />
      {Array.from({ length: lines }, (_, i) => (
        <path key={i} d={`M${x - w / 2 + 3} ${y - 5 + i * 5}h${w / 2 - 6}M${x + 3} ${y - 5 + i * 5}h${w / 2 - 6}`} stroke="#64748b" strokeWidth={0.8} />
      ))}
    </g>
  );
}

// 1a · Dawn in the উঠান. Four empty ডেকচি by the বাবুর্চি; Karim rolls in the
//      fifth. মামা one foot on the pedal, the bag on the handle. The
//      বাবুর্চি's line, মামার reply, Nasib's claim.

export function UthanDawn({}: Story) {
  const s = useScene(4, [600, 1600, 2400, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ভোরে নানাবাড়ির উঠান; বাবুর্চি খালি ডেকচির পাশে খাতা হাতে; করিম একটা ডেকচি গড়িয়ে আনছে; মামা সাইকেলে; বাবুর্চি বললেন তিনি ডেকচি ধরে গোনেন, মামা বললেন চাল কত মাংস কত বলেন; নাসিব বললো দুইজনের হিসাব মিলবে না">
        <S_House door={false} />
        <S_Yard />
        {[84, 108, 132, 156].map((x) => (
          <Pot key={x} x={x} y={162} s={0.75} />
        ))}
        <Pot x={k >= 1 ? 180 : 330} y={162} s={0.75} />
        <Person who="karim" x={k >= 1 ? 204 : 350} y={160} facing={-1} walking={k === 1} arm="point" label />
        <Baburchi x={54} y={160} arm="hold" />
        <S_Khata x={64} y={118} w={22} />
        <S_Cycle x={296} y={162} />
        <Person who="mama" x={274} y={160} facing={-1} label />
        {k === 2 && <Bubble x={54} y={94} side="right" lines={["পোলাও তিন ডেগ, কাচ্চি দুই।", "আমি ডেকচি ধইরা গুনি।"]} />}
        {k === 3 && <Bubble x={274} y={94} side="left" lines={["আমাকে বলেন,", "চাল কত, মাংস কত।"]} />}
        {k >= 4 && (
          <>
            <Person who="nasib" x={240} y={160} facing={-1} label mood="smug" />
            <Bubble x={240} y={94} side="left" lines={["দুইজনের হিসাব মিলবে না।", "একজন বেশি কেনাবে।"]} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 2a · The বাবুর্চি opens the khata over two ডেকচি, one পোলাও, one কাচ্চি; a
//      card pops over each with what one ডেকচি takes. Fahim draws the grid.

export function BaburchiKhata({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বাবুর্চি খাতা মেলে ধরলেন; এক ডেকচি পোলাওয়ে চাল 2 মাংস 1, এক ডেকচি কাচ্চিতে চাল 1 মাংস 2; ফাহিম খাতার পিছনে grid আঁকলো">
        <S_House door={false} />
        <S_Yard />
        <Baburchi x={60} y={160} arm={k >= 1 ? "point" : "hold"} />
        <Pot x={130} y={164} />
        <Pot x={190} y={164} />
        <Word x={130} y={176} text="পোলাও" fill="#b45309" />
        <Word x={190} y={176} text="কাচ্চি" fill="#be123c" />
        {k >= 1 && <Card x={130} y={122} text="(2, 1)" tone="amber" />}
        {k >= 2 && <Card x={190} y={122} text="(1, 2)" tone="coral" />}
        {k === 1 && <Bubble x={60} y={94} side="right" lines={["পোলাওয়ে চাইল দুই কেজি,", "গোস্ত এক কেজি।"]} />}
        {k === 2 && <Bubble x={60} y={94} side="right" lines={["কাচ্চিতে উল্টা।"]} />}
        <Person who="fahim" x={262} y={160} facing={-1} label arm={k >= 3 ? "hold" : "down"} />
        {k >= 3 && (
          <g className={POP}>
            <rect x={228} y={96} width={26} height={22} fill="white" stroke={INK} strokeOpacity={0.4} />
            <path d="M232 114h18M232 114v-15M232 114l8 -4M232 114l4 -8" stroke="#64748b" strokeWidth={0.9} />
            <path d="M232 114l8 -4" stroke={AMBER} strokeWidth={1.6} />
            <path d="M232 114l4 -8" stroke={CORAL} strokeWidth={1.6} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 3a · The বাজার: the চালের দোকান, sacks at the front. মামা walks up with the
//      bag; the দোকানদার asks only how much. মামা thinks: কেজি, not ডেকচি.

export function MamaShop({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="বাজারে চালের দোকান; মামা ব্যাগ নিয়ে এলেন; দোকানদার জিজ্ঞেস করলো কয় কেজি; মামা ভাবলেন ডেকচি না, কেজি লাগবে">
        <rect x={0} y={150} width={320} height={30} fill="#d6b98c" />
        <path d="M42 94V150M138 94V150" stroke="#78350f" strokeWidth={3} />
        <circle cx={90} cy={104} r={8} fill="#c68e5f" />
        <path d="M84 102q6 -10 12 0Z" fill="#1c1917" />
        <path d="M81 114h18v4h-18Z" fill="#475569" />
        <rect x={40} y={116} width={100} height={34} fill="#b45309" />
        <path d="M34 94L42 76H138L146 94Z" fill="white" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${34 + i * 22.4} 94l5 -18h11l-5 18Z`} fill="#ef4444" />
        ))}
        <Word x={90} y={140} text="চাল" size={11} fill="#fef3c7" />
        {[58, 122].map((x) => (
          <g key={x}>
            <path d={`M${x - 11} 150q-2 -16 3 -22h16q5 6 3 22Z`} fill="#e7d7c1" stroke="#a8a29e" />
            <ellipse cx={x} cy={128} rx={8} ry={2.5} fill="#fafaf9" />
          </g>
        ))}
        <Person who="mama" x={k >= 1 ? 190 : 350} y={160} facing={-1} walking={k === 1} arm="hold" label />
        {k >= 1 && <Bag x={176} y={126} s={0.6} />}
        {k === 2 && <Bubble x={96} y={92} side="right" lines={["চাইল কয় কেজি দিমু?"]} />}
        {k >= 3 && <Bubble x={190} y={94} side="left" tone="think" lines={["ডেকচি না,", "কেজি লাগবে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Nasib holds two cards, both (8, 7): the walk's and the rows'. He calls
//      it luck and asks for another order.

export function NasibLuck({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব দুইটা card ধরলো, দুইটাতেই (8, 7); বললো এটা কপালে মিলছে, order বদলালে মিলবে না">
        <S_House />
        <S_Yard />
        <Person who="fahim" x={70} y={160} label />
        <Person who="nasib" x={160} y={160} label arm={k >= 1 ? "hold" : "down"} mood={k >= 2 ? "smug" : "plain"} />
        {k >= 1 && (
          <>
            <Card x={124} y={104} text="(8, 7)" tone="amber" />
            <Card x={196} y={104} text="(8, 7)" tone="blue" />
          </>
        )}
        <Person who="som" x={250} y={160} facing={-1} label />
        {k === 2 && <Bubble x={160} y={74} lines={["দুইবারই (8, 7)।", "এটা কপালে মিলছে।"]} />}
        {k >= 3 && <Bubble x={160} y={74} lines={["order বদলাও,", "দেখবা মিলবে না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · মামী at the kitchen door: nobody said ঘি. One কেজি each. The
//      বাবুর্চি nods and writes a third line in the khata.

export function MamiGhee({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="রান্নাঘরের দরজা থেকে মামী বললেন ঘির কথা কেউ বলে নাই; পোলাওয়ে এক কেজি, কাচ্চিতেও এক কেজি; বাবুর্চি খাতায় আরেকটা লাইন লিখলেন">
        <S_House />
        <S_Yard />
        <Person who="mami" x={163} y={150} facing={-1} label arm={k >= 1 ? "point" : "down"} />
        <Baburchi x={70} y={160} arm="hold" />
        <S_Khata x={80} y={118} w={24} lines={k >= 3 ? 3 : 2} />
        {k >= 3 && <path d="M70 118h8M83 118h8" stroke={BLUE} strokeWidth={1.2} className={POP} />}
        <Person who="mama" x={262} y={160} facing={-1} label />
        {k === 1 && <Bubble x={163} y={84} lines={["ঘির কথা", "কেউ বলছে?"]} />}
        {k === 2 && <Bubble x={163} y={84} lines={["পোলাওয়ে এক কেজি।", "কাচ্চিতেও এক কেজি।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Samin copies the khata into his phone. The চাল line: পোলাও 2, কাচ্চি 1.
//      The মাংস line is written কাচ্চি first. He types the numbers as they
//      come: 2, 1.

export function KhataCopy({}: Story) {
  const s = useScene(3, [600, 2200, 2400, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সামিন বাবুর্চির খাতা থেকে table ফোনে তুলছে; চাল: পোলাও 2, কাচ্চি 1; মাংস: কাচ্চি 2, পোলাও 1; সামিন যেভাবে লেখা সেভাবে তুললো, মাংস 2, 1">
        <S_House door={false} />
        <S_Yard />
        <g>
          <rect x={96} y={8} width={150} height={52} rx={2} fill="white" stroke={INK} strokeOpacity={0.4} />
          {k >= 1 && <rect x={100} y={13} width={142} height={16} rx={2} fill={AMBER} fillOpacity={0.18} className={FADE} />}
          {k >= 2 && <rect x={100} y={37} width={142} height={16} rx={2} fill={CORAL} fillOpacity={0.18} className={FADE} />}
          <Word x={106} y={25} text="চাল: পোলাও 2, কাচ্চি 1" size={10} anchor="start" fill="#1e3a8a" />
          <Word x={106} y={49} text="মাংস: কাচ্চি 2, পোলাও 1" size={10} anchor="start" fill="#1e3a8a" />
        </g>
        <Person who="samin" x={240} y={160} facing={-1} label arm="hold" />
        <g>
          <rect x={218} y={106} width={14} height={22} rx={2} fill="#1e293b" />
          <rect x={220} y={109} width={10} height={15} fill="#e2e8f0" />
          {k >= 1 && <text x={225} y={115} textAnchor="middle" fontSize={4.5} fontFamily={MONO} fill={INK}>2 1</text>}
          {k >= 3 && (
            <text x={225} y={121} textAnchor="middle" fontSize={4.5} fontFamily={MONO} fill={BAD} className={POP}>
              2 1
            </text>
          )}
        </g>
        <Baburchi x={50} y={160} />
        {k === 2 && <Bubble x={50} y={94} side="right" lines={["যেমনে লেখছি,", "তেমনে তুলো।"]} />}
        {k >= 3 && <Bubble x={240} y={94} side="left" lines={["মাংস: 2, 1।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · Afternoon. The বাবুর্চি gives tomorrow's sweets: two ডেকচি, জর্দা and
//      ফিরনি, a card over each. মামা will go in the morning.

export function SweetList({}: Story) {
  const s = useScene(3, [600, 2400, 2000, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="বিকালে বাবুর্চি কালকের মিষ্টির হিসাব দিলেন; জর্দা তিন ডেকচি, ফিরনি দুই ডেকচি; এক ডেকচি জর্দায় চাল 1 চিনি 2, ফিরনিতে চাল 1 চিনি 1; মামা যাবেন কাল সকালে">
        <S_House door={false} />
        <S_Yard />
        <Baburchi x={60} y={160} arm={k >= 1 ? "point" : "down"} />
        <Pot x={130} y={164} lid="#facc15" />
        <Pot x={190} y={164} lid="#fef3c7" />
        <Word x={130} y={176} text="জর্দা" fill="#b45309" />
        <Word x={190} y={176} text="ফিরনি" fill="#be123c" />
        {k >= 2 && (
          <>
            <Card x={130} y={122} text="(1, 2)" tone="amber" />
            <Card x={190} y={122} text="(1, 1)" tone="coral" />
          </>
        )}
        {k === 1 && <Bubble x={60} y={94} side="right" lines={["জর্দা তিন ডেগ,", "ফিরনি দুই ডেগ।"]} />}
        <Person who="mama" x={262} y={160} facing={-1} label />
        {k >= 3 && <Bubble x={262} y={94} side="left" lines={["কাল সকালে যাবো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 8a · Night, a হারিকেন. The বাবুর্চি writes the curry page: রেজালা and
//      আলু-গোশত, a card over each ডেকচি. No আলু in রেজালা.

export function RezalaNight({}: Story) {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাতে হারিকেনের আলোয় বাবুর্চি তরকারির পাতা লিখলেন; রেজালা চার ডেকচি, আলু-গোশত পাঁচ ডেকচি; রেজালায় আলু দেয় না">
        <rect x={0} y={150} width={320} height={30} fill="#8a7152" />
        <g>
          <circle cx={104} cy={128} r={28} fill="#fde047" opacity={0.25} />
          <path d="M100 118q4 -5 8 0" fill="none" stroke="#e5e7eb" strokeWidth={1.2} />
          <rect x={100} y={120} width={8} height={12} rx={3} fill="#fef08a" stroke="#44403c" strokeWidth={1} />
          <rect x={99} y={132} width={10} height={3} fill="#44403c" />
        </g>
        <Baburchi x={60} y={160} arm="hold" />
        <S_Khata x={72} y={116} w={24} />
        <Pot x={160} y={164} />
        <Pot x={230} y={164} />
        <Word x={160} y={176} text="রেজালা" fill="#fde68a" />
        <Word x={230} y={176} text="আলু-গোশত" fill="#fecdd3" />
        {k >= 1 && <Card x={160} y={122} text="(3, 0)" tone="amber" />}
        {k >= 2 && <Card x={230} y={122} text="(1, 2)" tone="coral" />}
        {k >= 3 && <Bubble x={60} y={94} side="right" lines={["রেজালায় আলু", "দেয় না কেউ।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Two in the afternoon. মামা rides in; the মাদুর is spread and the bag
//      tipped out into two heaps. The বাবুর্চি will count by ডেকচি, মামা by
//      item. The count is the reader's.

export function NoonUnpack({}: Story) {
  const s = useScene(4, [600, 1600, 1800, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="দুপুরে মামা সাইকেলে ফিরলেন; উঠানে মাদুর পাতা হলো; ব্যাগ উপুড় করে চাল আর মাংস দুই স্তূপ; বাবুর্চি ডেকচি ধরে গুনবেন, মামা জিনিস ধরে">
        <S_House door={false} />
        <S_Yard />
        <path d="M110 170L126 150H214L230 170Z" fill="#e9c46a" stroke="#b08900" strokeWidth={0.8} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${118 + i * 18} 170l${16 - i * 0.6} -20`} stroke="#b08900" strokeWidth={0.5} opacity={0.6} />
        ))}
        {k >= 2 && (
          <g className={POP}>
            <path d="M136 164q14 -18 28 0Z" fill="#fef3c7" stroke="#d6d3d1" />
            <path d="M178 164q13 -16 26 0Z" fill="#f87171" stroke="#b91c1c" strokeWidth={0.6} />
          </g>
        )}
        {k < 2 ? <Bag x={170} y={162} s={0.8} /> : <Bag x={216} y={160} s={0.5} />}
        <S_Cycle x={k >= 1 ? 290 : 380} y={162} bag={false} />
        <Person who="mama" x={k >= 1 ? 262 : 360} y={160} facing={-1} walking={k === 1} label />
        <Baburchi x={60} y={160} arm={k >= 3 ? "point" : "down"} />
        {k === 3 && <Bubble x={60} y={94} side="right" lines={["ডেগ ধইরা গুনমু।"]} />}
        {k >= 4 && <Bubble x={262} y={94} side="left" lines={["আমি গুনি", "জিনিস ধরে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 10a · Evening. The চুলা lit, the first ডেকচি on it, steam; the বাবুর্চি
//       with the খুন্তি, মামা by him. Nobody says anything.

export function FirstFire({}: Story) {
  const s = useScene(2, [600, 1400, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যায় উঠানে চুলা জ্বলছে; প্রথম ডেকচি চড়েছে; বাবুর্চি খুন্তি হাতে; মামা পাশে">
        <S_House door={false} />
        <S_Yard />
        <path d="M112 164h56l-6 -14h-44Z" fill="#a16207" />
        {k >= 1 && (
          <g className={FADE}>
            <path d="M126 152q4 -12 8 -2q3 -10 7 0q4 -12 8 0q3 -8 6 2Z" fill="#f97316" />
            <path d="M132 152q3 -7 6 0q3 -8 6 0q3 -6 5 0Z" fill="#fde047" />
          </g>
        )}
        <Pot x={140} y={150} steam={k >= 2} />
        <Baburchi x={88} y={160} arm="point" />
        <path d="M104 118l24 18" stroke="#78716c" strokeWidth={1.6} strokeLinecap="round" />
        <Person who="mama" x={206} y={160} facing={-1} label />
      </Stage>
    </StoryFrame>
  );
}

// 10b · The bridge. The লাইট ভাই sets the old machine by the wall; two knobs.
//       Rina points high on the wall: a heart there. The light runs toward it
//       and stops short on a "?". 7.2 answers it.

export function LightVan({}: Story) {
  const s = useScene(4, [600, 1600, 2200, 1600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="লাইট ভাই পুরানো লাইট মেশিন দেয়ালের সামনে বসালেন; মেশিনে দুইটা knob; রিনা দেয়ালের উপরের একটা কোণা দেখালো, ওখানে একটা হার্ট চাই; ওখানে আলো পৌঁছাবে কিনা, প্রশ্ন">
        <rect x={120} y={20} width={200} height={130} fill="#d9c4a1" />
        <path d="M120 20V150" stroke="#a8a29e" />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${140 + i * 20} 24V148`} stroke="#a8a29e" strokeOpacity={0.35} strokeWidth={0.6} />
        ))}
        <S_Yard />
        <LightBhai x={k >= 1 ? 50 : -30} y={160} walking={k === 1} arm="hold" />
        {k >= 1 && (
          <g className={POP}>
            <rect x={78} y={132} width={34} height={20} rx={3} fill="#334155" />
            <circle cx={112} cy={136} r={4} fill="#94a3b8" />
            <circle cx={86} cy={145} r={3} fill="#fbbf24" />
            <circle cx={96} cy={145} r={3} fill="#fbbf24" />
            <path d="M92 152v8" stroke="#334155" strokeWidth={2} />
          </g>
        )}
        <Person who="rina" x={290} y={160} facing={-1} label arm={k >= 2 ? "wave" : "down"} />
        {k >= 2 && <path d="M250 44c-6 -8 -18 -2 -10 8l10 10l10 -10c8 -10 -4 -16 -10 -8Z" fill="none" stroke="#db2777" strokeWidth={1.6} strokeDasharray="3 2" className={POP} />}
        {k === 2 && <Bubble x={290} y={94} side="left" lines={["হার্টটা", "ওইখানে চাই।"]} />}
        {k >= 3 && <Draw d="M116 136L214 80" strokeWidth={3} ms={800} className="stroke-[#f59e0b]/80" />}
        {k >= 4 && (
          <text x={228} y={84} textAnchor="middle" fontSize={22} fontWeight={800} fill="#b45309" className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Figures for the <Then>s. Watch-only; each on a white sheet, fixed ink.

function Sheet({ w, h, label, children }: { w: number; h: number; label: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="mx-auto block h-auto w-full max-w-[17rem]">
      <rect x={1} y={1} width={w - 2} height={h - 2} rx={8} fill="white" stroke="#cbd5e1" />
      {children}
    </svg>
  );
}

const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {nb(lines[k])}
  </span>
);

// 1½ · The stake: five empty ডেকচি, the khata's order by ডেকচি, মামার list
//      by item still blank, one trip to the বাজার.

const C1 = [
  "উঠানে পাঁচটা খালি ডেকচি। তিনটা পোলাওয়ের, দুইটা কাচ্চির।",
  "বাবুর্চির খাতা ডেকচি ধরে: পোলাও 3, কাচ্চি 2।",
  "মামার list জিনিস ধরে: চাল কত, মাংস কত। এখনো ফাঁকা।",
  "বাজারে যাওয়া একবারই। কম আনলে ডেকচি খালি থাকবে।",
];

export function StakeFig() {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(C1, k)}>
      <Sheet w={260} h={120} label="পাঁচটা খালি ডেকচি, বাবুর্চির খাতা, মামার ফাঁকা list, একটা ব্যাগ">
        {[30, 58, 86].map((x) => (
          <Pot key={x} x={x} y={112} s={0.8} lid="#fde68a" />
        ))}
        {[114, 142].map((x) => (
          <Pot key={x} x={x} y={112} s={0.8} lid="#fdba74" />
        ))}
        {k >= 1 && (
          <g className={POP}>
            <rect x={14} y={12} width={100} height={40} fill="#fffbeb" stroke="#d6d3d1" />
            <Word x={64} y={26} text="বাবুর্চির খাতা" size={8} />
            <Word x={64} y={42} text="পোলাও 3, কাচ্চি 2" size={9} fill="#b45309" />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <rect x={140} y={12} width={104} height={46} fill="white" stroke="#94a3b8" />
            <Word x={192} y={25} text="মামার list" size={8} />
            <Word x={150} y={38} text="চাল ........ ?" size={9} anchor="start" fill="#1d4ed8" />
            <Word x={150} y={51} text="মাংস ....... ?" size={9} anchor="start" fill="#1d4ed8" />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <Bag x={210} y={110} s={1.1} />
            <text x={234} y={90} fontSize={18} fontWeight={800} fill={BLUE}>
              ?
            </text>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// 2½ · The two ডেকচি arrows stand up as the two columns of a table, and the
//      table gets its row names: the matrix.

const C2 = [
  "এক ডেকচি পোলাও (2, 1), এক ডেকচি কাচ্চি (1, 2)। দুইটা arrow।",
  "পোলাওয়ের arrow খাড়া হয়ে বসলো: প্রথম column।",
  "কাচ্চিরটা পাশে: দ্বিতীয় column।",
  "দুই column মিলে একটা table, মানে matrix। পাশে লেখা কোন row কোন জিনিসের।",
];

export function ColumnsStand() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const O: XY = [24, 108];
  const u = 20;
  const P = (x: number, y: number): XY => [O[0] + x * u, O[1] - y * u];
  let grid = "";
  for (let i = 0; i <= 4; i += 1) grid += `M${P(i, 0)[0]} ${P(0, 0)[1]}V${P(0, 4)[1]}M${P(0, 0)[0]} ${P(0, i)[1]}H${P(4, 0)[0]}`;
  const arrow = (to: XY, color: string, list: string) => {
    const b = P(to[0], to[1]);
    const len = Math.hypot(b[0] - O[0], b[1] - O[1]);
    const ux = (b[0] - O[0]) / len;
    const uy = (b[1] - O[1]) / len;
    return (
      <Lit a={O} b={b} list={list} w={2.4} color={color}>
        <path d={`M${O[0]} ${O[1]}L${b[0] - ux * 7} ${b[1] - uy * 7}`} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
        <path d={`M${b[0]} ${b[1]}L${b[0] - ux * 8 - uy * 4} ${b[1] - uy * 8 + ux * 4}L${b[0] - ux * 8 + uy * 4} ${b[1] - uy * 8 - ux * 4}Z`} fill={color} />
      </Lit>
    );
  };
  return (
    <Scene scene={s} caption={say(C2, k)}>
      <Sheet w={260} h={124} label="দুইটা ডেকচির arrow table এর দুইটা column হয়ে বসলো">
        <path d={grid} stroke="#93c5fd" strokeOpacity={0.5} strokeWidth={0.6} />
        <path d={`M${O[0]} ${O[1]}H${P(4.3, 0)[0]}M${O[0]} ${O[1]}V${P(0, 4.3)[1]}`} stroke={INK} strokeOpacity={0.5} strokeWidth={1} />
        {arrow([2, 1], AMBER, "(2, 1)")}
        {arrow([1, 2], CORAL, "(1, 2)")}
        {k >= 1 && (
          <g className={POP}>
            <Word x={176} y={30} text="পোলাও" size={9} fill="#b45309" />
            <text x={176} y={60} textAnchor="middle" fontSize={14} fontWeight={700} fontFamily={MONO} fill="#b45309">
              2
            </text>
            <text x={176} y={86} textAnchor="middle" fontSize={14} fontWeight={700} fontFamily={MONO} fill="#b45309">
              1
            </text>
          </g>
        )}
        {k >= 1 && <Draw d={`M${P(2, 1)[0] + 4} ${P(2, 1)[1]}Q140 70 164 70`} strokeWidth={1} ms={600} className="stroke-[#f59e0b]" />}
        {k >= 2 && (
          <g className={POP}>
            <Word x={218} y={30} text="কাচ্চি" size={9} fill="#be123c" />
            <text x={218} y={60} textAnchor="middle" fontSize={14} fontWeight={700} fontFamily={MONO} fill="#be123c">
              1
            </text>
            <text x={218} y={86} textAnchor="middle" fontSize={14} fontWeight={700} fontFamily={MONO} fill="#be123c">
              2
            </text>
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <path d="M162 42h-5v52h5M232 42h5v52h-5" fill="none" stroke={INK} strokeWidth={1.6} />
            <Word x={146} y={59} text="চাল" size={8} anchor="end" />
            <Word x={146} y={85} text="মাংস" size={8} anchor="end" />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// 3½ · One row on the order: the চাল row comes down onto (3, 2), pairs up,
//      multiplies, adds; the 8 drops into মামার list. The হাট's bill, again.

const C3 = [
  "চাল এর row: পোলাও প্রতি 2, কাচ্চি প্রতি 1। নিচে order: 3 আর 2।",
  "Row নেমে order এর উপর বসলো। পোলাওয়ের উপর পোলাও, কাচ্চির উপর কাচ্চি।",
  "ঘরে ঘরে গুণ: 2 × 3 = 6, 1 × 2 = 2।",
  "যোগ করে 8। মামার list এ চাল 8। হাটের বিলও এভাবেই হয়: দাম গুণ কয়টা, তারপর যোগ।",
];

export function RowOnOrder() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const box = (x: number, y: number, v: number, c: string) => (
    <g>
      <rect x={x - 13} y={y - 12} width={26} height={22} rx={3} fill="white" stroke={c} strokeWidth={1.4} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fontFamily={MONO} fill={c}>
        {v}
      </text>
    </g>
  );
  return (
    <Scene scene={s} caption={say(C3, k)}>
      <Sheet w={260} h={124} label="চাল এর row order এর উপর বসে, গুণ করে যোগ হয়ে 8">
        <Word x={30} y={30} text="চাল এর row" size={8} anchor="start" />
        <Word x={30} y={86} text="order" size={8} anchor="start" />
        <g style={{ transform: `translateY(${k >= 1 ? 32 : 0}px)` }} className="transition-transform duration-700 motion-reduce:transition-none">
          {box(100, 28, 2, "#b45309")}
          {box(134, 28, 1, "#be123c")}
        </g>
        {box(100, 86, 3, "#b45309")}
        {box(134, 86, 2, "#be123c")}
        {k >= 2 && (
          <g className={POP}>
            <text x={100} y={114} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily={MONO} fill={INK}>
              6
            </text>
            <text x={134} y={114} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily={MONO} fill={INK}>
              2
            </text>
          </g>
        )}
        <rect x={180} y={30} width={66} height={56} fill="white" stroke="#94a3b8" />
        <Word x={213} y={44} text="মামার list" size={8} />
        <Word x={188} y={62} text="চাল" size={9} anchor="start" />
        <Word x={188} y={78} text="মাংস" size={9} anchor="start" fill="#94a3b8" />
        {k >= 3 && (
          <text x={236} y={63} textAnchor="end" fontSize={12} fontWeight={800} fontFamily={MONO} fill={OK} className={POP}>
            8
          </text>
        )}
        {k >= 3 && <Draw d="M144 110Q170 110 226 66" strokeWidth={1.2} ms={500} className="stroke-[#0d9488]" />}
      </Sheet>
    </Scene>
  );
}

// 4½ · The four heaps. (dish × count) gives four little heaps of squares, one
//      per কেজি। The বাবুর্চি gathers them by column, মামা by row: the same
//      four, so the same list.

function B_Heaps({ label, rowNames, colNames, cols, amt, caps }: { label: string; rowNames: readonly string[]; colNames: readonly string[]; cols: readonly XY[]; amt: XY; caps: readonly string[] }) {
  const s = useScene(4, [600, 1600, 2200, 2200, 2200]);
  const k = s.k;
  const cx = [118, 196];
  const cy = [52, 102];
  const fills = [
    ["#fbbf24", "#fbbf24"],
    ["#f87171", "#f87171"],
  ];
  const heap = (i: number, j: number) => {
    const n = cols[j][i] * amt[j];
    return Array.from({ length: n }, (_, q) => {
      const col = q % 6;
      const row = Math.floor(q / 6);
      return <rect key={q} x={cx[j] - 26 + col * 9} y={cy[i] + 8 - row * 9} width={7} height={7} rx={1} fill={fills[i][j]} className={POP} style={{ transitionDelay: `${q * 30}ms` }} />;
    });
  };
  const lin2 = lin(cols, amt);
  return (
    <Scene scene={s} caption={say(caps, k)}>
      <Sheet w={260} h={150} label={label}>
        <Word x={cx[0]} y={20} text={`${colNames[0]} × ${amt[0]}`} size={8.5} fill="#b45309" />
        <Word x={cx[1]} y={20} text={`${colNames[1]} × ${amt[1]}`} size={8.5} fill="#be123c" />
        <Word x={52} y={cy[0] + 10} text={rowNames[0]} size={9} anchor="end" />
        <Word x={52} y={cy[1] + 10} text={rowNames[1]} size={9} anchor="end" />
        {[0, 1].map((i) => [0, 1].map((j) => <rect key={`c${i}${j}`} x={cx[j] - 32} y={cy[i] - 16} width={64} height={38} rx={4} fill="none" stroke="#e2e8f0" />))}
        {k >= 1 && [0, 1].map((i) => [0, 1].map((j) => <g key={`h${i}${j}`}>{heap(i, j)}</g>))}
        {k === 2 &&
          [0, 1].map((j) => (
            <g key={`col${j}`} className={FADE}>
              <rect x={cx[j] - 36} y={cy[0] - 20} width={72} height={96} rx={8} fill="none" stroke={j === 0 ? AMBER : CORAL} strokeWidth={2} />
              <text x={cx[j]} y={142} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={j === 0 ? "#b45309" : "#be123c"}>
                {tup([cols[j][0] * amt[j], cols[j][1] * amt[j]])}
              </text>
            </g>
          ))}
        {k >= 3 &&
          [0, 1].map((i) => (
            <g key={`row${i}`} className={FADE}>
              <rect x={cx[0] - 38} y={cy[i] - 18} width={cx[1] - cx[0] + 76} height={42} rx={8} fill="none" stroke={BLUE} strokeWidth={2} />
              <text x={250} y={cy[i] + 8} textAnchor="end" fontSize={11} fontWeight={800} fontFamily={MONO} fill="#1d4ed8">
                {lin2[i]}
              </text>
            </g>
          ))}
        {k >= 4 && (
          <text x={14} y={142} fontSize={10} fontWeight={700} fontFamily={MONO} fill={OK} className={POP}>
            {tup(lin2)}
          </text>
        )}
      </Sheet>
    </Scene>
  );
}

export function FourHeaps() {
  return (
    <B_Heaps
      label="চারটা স্তূপ: বাবুর্চি column ধরে গোনেন, মামা row ধরে; যোগফল একই"
      rowNames={ITEM}
      colNames={DISH}
      cols={G_COLS}
      amt={ORDER}
      caps={[
        "(3, 2) order এ চারটা ছোট স্তূপ হয়। প্রতি কেজি একটা ঘর।",
        "পোলাওয়ের চাল 6, কাচ্চির চাল 2। পোলাওয়ের মাংস 3, কাচ্চির মাংস 4।",
        "বাবুর্চি গোনেন column ধরে: পোলাওয়ের ডেকচিতে (6, 3), কাচ্চির ডেকচিতে (2, 4)।",
        "মামা গোনেন row ধরে: চাল 6 + 2 = 8, মাংস 3 + 4 = 7।",
        "স্তূপ একই চারটা। তাই দুই দিকেই (8, 7)।",
      ]}
    />
  );
}

// 8½ · The same four heaps for the curry page: রেজালার আলু heap is empty.

export function FourHeapsRezala() {
  return (
    <B_Heaps
      label="রেজালা আর আলু-গোশতের চারটা স্তূপ; রেজালার আলুর ঘর খালি"
      rowNames={CURRY_ITEM}
      colNames={CURRY}
      cols={T8_COLS}
      amt={T8_ORDER}
      caps={[
        "রেজালা 4 ডেকচি, আলু-গোশত 5 ডেকচি। চারটা ঘর।",
        "রেজালার পেঁয়াজ 12, আলু-গোশতের পেঁয়াজ 5। রেজালার আলু 0, আলু-গোশতের আলু 10।",
        "Column ধরে: রেজালার ডেকচিতে (12, 0), আলু-গোশতের ডেকচিতে (5, 10)।",
        "Row ধরে: পেঁয়াজ 12 + 5 = 17, আলু 0 + 10 = 10।",
        "খালি ঘরটাও একটা ঘর। দুই দিকেই (17, 10)।",
      ]}
    />
  );
}

// 4½b · For the side quest: a bigger table, four rows and three columns. Each
//       row lands on the order in turn and drops one number into the list.

const M4_ROWS = [
  [1, 0, 2],
  [2, 1, 0],
  [0, 3, 1],
  [1, 1, 1],
];
const M4_X = [1, 2, 1];
const C4b = [
  "চারটা জিনিস, তিনটা dish। Order এ তিনটা সংখ্যা: (1, 2, 1)।",
  "Row 1 order এর উপর: 1×1 + 0×2 + 2×1 = 3. List এর ঘর 1।",
  "Row 2: 2×1 + 1×2 + 0×1 = 4. ঘর 2।",
  "Row 3: 0×1 + 3×2 + 1×1 = 7. ঘর 3।",
  "Row 4: 1 + 2 + 1 = 4. Row যতগুলো, list এ ঘর ততগুলো।",
];

export function ManyRows() {
  const s = useScene(4, [600, 1800, 1800, 1800, 2200]);
  const k = s.k;
  const out = byRows(M4_ROWS, M4_X);
  return (
    <Scene scene={s} caption={say(C4b, k)}>
      <Sheet w={260} h={124} label="চার row, তিন column এর table; প্রত্যেক row থেকে list এর একটা ঘর">
        {M4_ROWS.map((r, i) => (
          <g key={i}>
            <rect x={36} y={16 + i * 24} width={96} height={20} rx={3} fill={k === i + 1 ? "#dbeafe" : "none"} className="transition-colors duration-300 motion-reduce:transition-none" />
            {r.map((v, j) => (
              <text key={j} x={52 + j * 32} y={30 + i * 24} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily={MONO} fill={INK}>
                {v}
              </text>
            ))}
            {k >= i + 1 && (
              <text x={226} y={30 + i * 24} textAnchor="middle" fontSize={12} fontWeight={800} fontFamily={MONO} fill={OK} className={POP}>
                {out[i]}
              </text>
            )}
          </g>
        ))}
        <path d="M34 14h-4v98h4M134 14h4v98h-4" fill="none" stroke={INK} strokeWidth={1.3} />
        {M4_X.map((v, j) => (
          <text key={j} x={166} y={42 + j * 24} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily={MONO} fill={BLUE}>
            {v}
          </text>
        ))}
        <path d="M156 26h-3v74h3M176 26h3v74h-3" fill="none" stroke={BLUE} strokeWidth={1.2} />
        <text x={196} y={66} textAnchor="middle" fontSize={12} fill={INK}>
          =
        </text>
        <path d="M214 14h-3v98h3M238 14h3v98h-3" fill="none" stroke={OK} strokeWidth={1.2} />
      </Sheet>
    </Scene>
  );
}

// 5½ · Shapes: the 3 × 2 table and the 2 × 1 order click where their inner
//      2s meet, and a 3 × 1 list comes out. Below, a 3 × 1 order won't click.

function Block({ x, y, r, c, color }: { x: number; y: number; r: number; c: number; color: string }) {
  let d = "";
  for (let i = 0; i <= r; i += 1) d += `M${x} ${y + i * 9}h${c * 9}`;
  for (let j = 0; j <= c; j += 1) d += `M${x + j * 9} ${y}v${r * 9}`;
  return <path d={d} stroke={color} strokeWidth={1.2} fill="none" />;
}

const C5 = [
  "Table এর shape 3 × 2: তিনটা row, দুইটা column. Order 2 × 1.",
  "মাঝের দুইটা 2 মিলে গেলো: column দুইটা, order এর সংখ্যাও দুইটা।",
  "মিলে গিয়ে মুছে যায়। বাকি থাকে 3 × 1: তিনটা জিনিসের list।",
  "Order এ তিনটা dish দিলে 3 × 1। মাঝে 2 আর 3। মেলে না, গুণও হয় না।",
];

export function ShapesClick() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const t = (x: number, y: number, str: string, fill = INK, cls = "") => (
    <text x={x} y={y} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily={MONO} fill={fill} className={cls}>
      {str}
    </text>
  );
  return (
    <Scene scene={s} caption={say(C5, k)}>
      <Sheet w={260} h={128} label="shape এর নিয়ম: 3 × 2 আর 2 × 1 মিলে 3 × 1; 3 × 2 আর 3 × 1 মেলে না">
        <Block x={24} y={12} r={3} c={2} color={INK} />
        <Block x={92} y={16} r={2} c={1} color={BLUE} />
        {t(33, 58, "3 × 2")}
        {t(97, 58, "2 × 1", BLUE)}
        {k >= 1 && k < 3 && <rect x={39} y={46} width={52} height={16} rx={4} fill="none" stroke={OK} strokeWidth={1.6} className={POP} />}
        {k >= 2 && (
          <g className={FADE}>
            {t(150, 34, "→")}
            <Block x={180} y={12} r={3} c={1} color={OK} />
            {t(185, 58, "3 × 1", OK)}
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <Block x={24} y={72} r={3} c={2} color={INK} />
            <Block x={92} y={72} r={3} c={1} color={BAD} />
            {t(33, 120, "3 × 2")}
            {t(97, 120, "3 × 1", BAD)}
            <rect x={39} y={108} width={52} height={16} rx={4} fill="none" stroke={BAD} strokeWidth={1.6} />
            <path d="M143 84l14 14m0 -14l-14 14" stroke={BAD} strokeWidth={2.2} strokeLinecap="round" />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// 5½b · For the side quest: the order laid before the table, x A. A 1 × 2 row
//       against a 3 × 2 table: the inner 2 and 3 don't meet.

const C5b = ["Order কে table এর বাঁ পাশে শুইয়ে দিলে: 1 × 2, তারপর 3 × 2।", "মাঝে 2 আর 3। মেলে না। এই গুণের কোনো মানেই হয় না।"];

export function XaNo() {
  const s = useScene(1, [600, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(C5b, k)}>
      <Sheet w={200} h={80} label="order বাঁ পাশে: 1 × 2 আর 3 × 2 মেলে না">
        <Block x={24} y={22} r={1} c={2} color={BLUE} />
        <Block x={96} y={14} r={3} c={2} color={INK} />
        <text x={33} y={62} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily={MONO} fill={BLUE}>
          1 × 2
        </text>
        <text x={105} y={62} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily={MONO} fill={INK}>
          3 × 2
        </text>
        {k >= 1 && (
          <g className={FADE}>
            <rect x={38} y={50} width={62} height={16} rx={4} fill="none" stroke={BAD} strokeWidth={1.6} />
            <path d="M136 30l16 16m0 -16l-16 16" stroke={BAD} strokeWidth={2.2} strokeLinecap="round" />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// 6½ · Why (1, 1) hid the swap. The মাংস count as squares, coloured by the
//      dish they come from: the real row (1, 2) and Samin's (2, 1). With
//      (1, 1) both make 3; with (2, 3) the real one makes 8, the copy 7.

const C6 = [
  "মাংসের দুইটা row: আসলটা (1, 2), সামিনেরটা (2, 1)। হলুদ ঘর পোলাও থেকে, লাল কাচ্চি থেকে।",
  "(1, 1) এ: আসলটায় 1 + 2, সামিনেরটায় 2 + 1। দুইটাই 3। উল্টালেও টের পাওয়া যায় না।",
  "(2, 3) এ: আসলটায় 2 + 6 = 8। সামিনেরটায় 4 + 3 = 7।",
  "এক কেজি মাংস কম। বাজারে গেলে কাচ্চির ডেকচি খালি থাকতো।",
];

export function OneOneHides() {
  const s = useScene(3, [600, 2200, 2200, 2200]);
  const k = s.k;
  const amt: XY = k >= 2 ? [2, 3] : [1, 1];
  const bar = (row: XY, y: number) => {
    const a = row[0] * amt[0];
    const b = row[1] * amt[1];
    return (
      <g key={`${y}${amt[0]}`}>
        {Array.from({ length: a + b }, (_, q) => (
          <rect key={q} x={92 + q * 17} y={y} width={14} height={14} rx={2} fill={q < a ? "#fbbf24" : "#f87171"} className={POP} style={{ transitionDelay: `${q * 40}ms` }} />
        ))}
        <text x={250} y={y + 11} textAnchor="end" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK}>
          {a + b}
        </text>
      </g>
    );
  };
  return (
    <Scene scene={s} caption={say(C6, k)}>
      <Sheet w={260} h={96} label="মাংসের আসল row আর সামিনের row: (1, 1) এ দুইটাই 3, (2, 3) এ 8 আর 7">
        <Word x={14} y={22} text={k >= 1 ? `order ${tup(amt)}` : "order"} size={8} anchor="start" fill="#1d4ed8" />
        <Word x={14} y={50} text="আসল (1, 2)" size={8.5} anchor="start" />
        <Word x={14} y={78} text="সামিন (2, 1)" size={8.5} anchor="start" fill={BAD} />
        {k >= 1 && bar([1, 2], 38)}
        {k >= 1 && bar([2, 1], 66)}
        {k >= 3 && <rect x={92 + 7 * 17} y={66} width={14} height={14} rx={2} fill="none" stroke={BAD} strokeWidth={1.6} strokeDasharray="3 2" className={POP} />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// bottom of the file: states for `npm run shot` (keys = useSeed names)

export const fixtures: Fixtures = {
  ListBet: { start: {}, sealed: { bet: 2 }, baburchi: { bet: 0 } },
  DekchiWalk: { start: {}, one: { amt: [1, 1], last: [1, 1], got: [true, false] }, done: { amt: [3, 2], last: [3, 2], got: [true, true] } },
  BazarRows: { start: {}, rice: { cur: 0, done: [true, false] }, done: { cur: 1, done: [true, true] } },
  TwoWaysOneList: { start: {}, guessed: { guess: 1 }, ran: { guess: 1, amt: [1, 3], last: [1, 3], runs: ["1,3"] }, done: { guess: 0, amt: [3, 3], last: [3, 3], runs: ["1,3", "2,0", "3,3"] } },
  ThirdItem: { start: {}, ran: { stage: 1 }, jam: { stage: 2 } },
  WrongRow: { start: {}, one: { stage: 1 }, gap: { stage: 2 }, miss: { stage: 2, miss: 1 }, fixed: { stage: 3 } },
  YourList: { start: {}, wrong: { list: [5, 7], tried: true, miss: 1 }, right: { list: [5, 8], tried: true, won: true } },
  TryNewDekchi: { start: {}, wrong: { pick: [12, 10], miss: 1 }, right: { pick: [17, 10] } },
  WhoWasRight: { start: {}, mid: { filled: [true, false, true, false, true] }, done: { filled: [true, true, true, true, true] } },
  UthanDawn: { rest: { k: 0 }, baburchi: { k: 2 }, mama: { k: 3 }, done: {} },
  BaburchiKhata: { polao: { k: 1 }, kacchi: { k: 2 }, done: {} },
  MamaShop: { rest: { k: 0 }, ask: { k: 2 }, done: {} },
  NasibLuck: { cards: { k: 2 }, done: {} },
  MamiGhee: { ask: { k: 1 }, ghee: { k: 2 }, done: {} },
  KhataCopy: { rice: { k: 1 }, meat: { k: 2 }, done: {} },
  SweetList: { ask: { k: 1 }, done: {} },
  RezalaNight: { rest: { k: 1 }, done: {} },
  NoonUnpack: { rest: { k: 0 }, heaps: { k: 2 }, baburchi: { k: 3 }, done: {} },
  FirstFire: { fire: { k: 1 }, done: {} },
  LightVan: { ask: { k: 2 }, done: {} },
  StakeFig: { rest: { k: 0 }, done: {} },
  ColumnsStand: { rest: { k: 0 }, one: { k: 1 }, done: {} },
  RowOnOrder: { down: { k: 1 }, done: {} },
  FourHeaps: { heaps: { k: 1 }, cols: { k: 2 }, rows: { k: 3 }, done: {} },
  FourHeapsRezala: { cols: { k: 2 }, done: {} },
  ManyRows: { two: { k: 2 }, done: {} },
  ShapesClick: { click: { k: 1 }, out: { k: 2 }, done: {} },
  XaNo: { done: {} },
  OneOneHides: { one: { k: 1 }, done: {} },
};
