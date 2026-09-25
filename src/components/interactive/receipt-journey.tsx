"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

import { Bubble, Person, Robot, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Plane, makeFrame, plus, snap, type Frame, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";

// Screens for "Math for AI 10.1 — ভেজা খাতা, দুই রসিদ এক দাম", told as a
// Journey in the author's Bangla-English. The plan is 10_journey_specs.md,
// block 10.1.
//
// ফিরানির পরের সকাল, নানাবাড়ি। The rain soaked মামার হিসাবের খাতা: the price
// of one ডেকচি পোলাও (p) and one ডেকচি রোস্ট (r) is smudged. Only the রসিদ
// survive, three pairs (হলুদ, বিয়ে, ফিরানি): how many ডেকচি, and the মোট। The
// বাবুর্চি says any pair gives the price. Prices in হাজার টাকা: p = 3, r = 2.
//   হলুদ:   2p + r = 8  · p + 2r = 7    (cross at (3, 2))
//   বিয়ে:    p + r = 5   · 2p + 2r = 10  (the same line twice)
//   ফিরানি:  p + r = 5   · 2p + 2r = 12  (parallel: the ছেলে wrote 12)
//
// The দামের কাগজ: মামা's graph paper, পোলাওর দাম → right, রোস্টের দাম ↑ up।
// A price guess is a dot (Shiku stands on it). Every রসিদ has a lamp that
// lights when the dot's prices give that রসিদের মোট; its money bar shows the
// pile of taka those prices make against the মোট। A রসিদ is the line of all
// dots that light its lamp. Kept LOCAL here (PricePaper, ReceiptLine, Lamp,
// ReceiptCard): the other 10.x journeys are built in parallel, and the
// coordinator folds the copies into one kit later.
//
// Nine screens. 1 seals the bet on which pairs give a price (PairBet). 2 one
// রসিদ: drag Shiku, lit spots leave pins, the pins stand in a line
// (OneReceipt). 3 the second হলুদের রসিদ: where do both lamps light?
// (TwoReceipts). 4 predict, then watch: the বিয়ের pair lies on top
// (CopyReceipt). 5 the ফিরানির pair: hunt, never both (WrongReceipt). 6 turn a
// second line: 1, 0 or সব, never 2 (OnlyThree). 7 Your turn: the দইওয়ালা's
// pair (YourPair). 8 Try it: three pairs into এক / নাই / অসীম (TryWhich).
// 9 the end, the bet opened (BetOpen, rest MDX).
//
// After the screens: the story scenes (MorningKhata, FahimPaper, SaminReads,
// BiyePair, BoyBrings, NasibTwo, DoiwalaGate, NotesCounted, MoyraGate,
// BoyScratches) and the watch-only figures (SmudgedPage, PinsToLine,
// BraceBoth, DoubleReceipt, SameSlant, TwoPinsOneLine, ThreeWays).

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const BAD = "#dc2626";
const LAMP = "#facc15";
/** the two রসিদ of a pair, by their line colour */
const R_COL = ["#2563eb", "#c026d3"] as const;
/** the ডেকচি blocks in a money bar */
const POLAO = "#eab308";
const ROAST = "#b45309";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

// ---------------------------------------------------------------------------
// The দামের কাগজ। A রসিদ is a·x + b·y = c: a of the right-hand thing, b of the
// up thing, মোট c.

type Rec = { name: string; a: number; b: number; c: number };
type Goods = { x: string; y: string; unit: string; money: (c: number) => string; price: (v: number) => string };

const DEKCHI: Goods = { x: "পোলাও", y: "রোস্ট", unit: "ডেকচি", money: (c) => `${c} হাজার`, price: (v) => `${v} হাজার` };
const DOI: Goods = { x: "টক দই", y: "মিষ্টি দই", unit: "হাঁড়ি", money: (c) => `${c * 100} টাকা`, price: (v) => `${v * 100} টাকা` };

const H1: Rec = { name: "হলুদের রসিদ 1", a: 2, b: 1, c: 8 };
const H2: Rec = { name: "হলুদের রসিদ 2", a: 1, b: 2, c: 7 };
const B1: Rec = { name: "বিয়ে, দুপুর", a: 1, b: 1, c: 5 };
const B2: Rec = { name: "বিয়ে, রাত", a: 2, b: 2, c: 10 };
const F1: Rec = { name: "ফিরানি 1", a: 1, b: 1, c: 5 };
const F2: Rec = { name: "ফিরানি 2", a: 2, b: 2, c: 12 };
const D1: Rec = { name: "দইয়ের রসিদ 1", a: 1, b: 3, c: 11 };
const D2: Rec = { name: "দইয়ের রসিদ 2", a: 2, b: 1, c: 7 };

const PAIRS = [
  { day: "হলুদ", of: "হলুদের", recs: [H1, H2] as const },
  { day: "বিয়ে", of: "বিয়ের", recs: [B1, B2] as const },
  { day: "ফিরানি", of: "ফিরানির", recs: [F1, F2] as const },
];

const pile = (r: Rec, p: XY) => r.a * p[0] + r.b * p[1];
const lights = (r: Rec, p: XY) => Math.abs(pile(r, p) - r.c) < 1e-9;
const keyOf = (p: XY) => `${p[0]},${p[1]}`;
const fromKey = (k: string): XY => k.split(",").map(Number) as XY;

/** where a·x + b·y = c crosses the sheet's box: the two ends to draw, or null */
function seg(a: number, b: number, c: number, f: Frame): [XY, XY] | null {
  const pts: XY[] = [];
  const e = 1e-9;
  if (b !== 0)
    for (const x of [f.x0, f.x1]) {
      const y = (c - a * x) / b;
      if (y >= f.y0 - e && y <= f.y1 + e) pts.push([x, y]);
    }
  if (a !== 0)
    for (const y of [f.y0, f.y1]) {
      const x = (c - b * y) / a;
      if (x >= f.x0 - e && x <= f.x1 + e) pts.push([x, y]);
    }
  let best: [XY, XY] | null = null;
  let far = 1e-6;
  for (const p of pts)
    for (const q of pts) {
      const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d > far) {
        far = d;
        best = [p, q];
      }
    }
  return best;
}
const segD = (f: Frame, s: [XY, XY]) => `M${f.sx(s[0][0]).toFixed(1)} ${f.sy(s[0][1]).toFixed(1)}L${f.sx(s[1][0]).toFixed(1)} ${f.sy(s[1][1]).toFixed(1)}`;

/** the whole-number prices on a রসিদের line, inside the sheet */
const spotsOn = (r: Rec, f: Frame): XY[] => {
  const out: XY[] = [];
  for (let x = Math.ceil(f.x0); x <= f.x1; x++)
    for (let y = Math.ceil(f.y0); y <= f.y1; y++) if (lights(r, [x, y])) out.push([x, y]);
  return out;
};

const PAPER_F = makeFrame(0, 7, 0, 8, 24, 28); // 224 × 248
const KEY_STEP: Record<string, XY> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };

/** the graph paper with its two price axes; `onDot` makes it draggable (tap or drag, arrow keys) */
function PricePaper({ f = PAPER_F, goods = DEKCHI, dot, onDot, label, children }: { f?: Frame; goods?: Goods; dot?: XY | null; onDot?: (p: XY) => void; label: string; children?: ReactNode }) {
  const put = (p: XY) => onDot?.(snap(p, f));
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const d = KEY_STEP[e.key];
    if (!d || !dot) return;
    e.preventDefault();
    put(plus(dot, d));
  };
  return (
    <Plane f={f} ticks={1} label={label} drag={onDot ? { down: put, move: put } : undefined} onKey={onDot ? key : undefined} className="my-0! max-w-none">
      <text x={f.sx(f.x1)} y={f.sy(f.y0) + 24} textAnchor="end" fontSize={8.5} fontWeight={700} fill={INK} className="pointer-events-none">
        {goods.x} এর দাম
      </text>
      <text x={f.sx(f.x0) - 2} y={f.sy(f.y1) - 9} fontSize={8.5} fontWeight={700} fill={INK} className="pointer-events-none">
        {goods.y} এর দাম
      </text>
      {children}
      {dot && <Shiku f={f} at={dot} />}
    </Plane>
  );
}

/** one রসিদের line across the sheet, drawing itself when it mounts */
function ReceiptLine({ f = PAPER_F, rec, color, width = 2.4, dash = false }: { f?: Frame; rec: Rec; color: string; width?: number; dash?: boolean }) {
  const s = seg(rec.a, rec.b, rec.c, f);
  if (!s) return null;
  return (
    <g stroke={color} strokeDasharray={dash ? "5 4" : undefined} opacity={0.85}>
      {dash ? <path d={segD(f, s)} strokeWidth={width} fill="none" className={`pointer-events-none ${FADE}`} /> : <Draw d={segD(f, s)} strokeWidth={width} ms={700} />}
    </g>
  );
}

/** a pin where a lamp lit; two colours = both lamps lit there */
function Pin({ f = PAPER_F, at, cols }: { f?: Frame; at: XY; cols: string[] }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className={`pointer-events-none ${POP}`}>
      {cols.length > 1 && <circle cx={x} cy={y} r={7.5} fill={LAMP} opacity={0.55} />}
      <circle cx={x} cy={y} r={4} fill={cols[0]} stroke="white" strokeWidth={1.2} />
      {cols[1] && <circle cx={x} cy={y} r={1.8} fill={cols[1]} />}
    </g>
  );
}

/** a রসিদের lamp: lit when the prices on the paper give its মোট */
function Lamp({ on, size = 20 }: { on: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 20 22" width={size} height={size * 1.1} aria-hidden="true" className="shrink-0">
      <circle cx={10} cy={9} r={9} fill={LAMP} opacity={on ? 0.45 : 0} className="transition-opacity duration-300 motion-reduce:transition-none" />
      <circle cx={10} cy={9} r={5.8} fill={on ? LAMP : "#e5e7eb"} stroke={on ? "#a16207" : "#64748b"} strokeWidth={1} className="transition-[fill] duration-300 motion-reduce:transition-none" />
      <rect x={7.2} y={14.5} width={5.6} height={4.5} rx={1} fill="#64748b" />
    </svg>
  );
}

/** the pile of taka the paper's prices make on this রসিদ, against its মোট (a dashed mark) */
function MoneyBar({ rec, price, max = 14 }: { rec: Rec; price: XY; max?: number }) {
  const id = useId();
  const W = 112;
  const s = W / max;
  const blocks: { x: number; w: number; fill: string }[] = [];
  let at = 0;
  for (let i = 0; i < rec.a; i++) {
    blocks.push({ x: at, w: price[0] * s, fill: POLAO });
    at += price[0] * s;
  }
  for (let i = 0; i < rec.b; i++) {
    blocks.push({ x: at, w: price[1] * s, fill: ROAST });
    at += price[1] * s;
  }
  const over = pile(rec, price) > max;
  return (
    <svg viewBox="0 0 124 22" className="block h-auto w-full" aria-hidden="true">
      <defs>
        <clipPath id={`${id}c`}>
          <rect x={4} y={0} width={W} height={22} />
        </clipPath>
      </defs>
      <rect x={4} y={9} width={W} height={10} rx={2} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={0.6} />
      <g clipPath={`url(#${id}c)`}>
        {blocks.map((b, i) => (
          <rect key={i} x={4 + b.x} y={9} width={Math.max(0, b.w)} height={10} fill={b.fill} stroke="white" strokeWidth={0.8} className="transition-[x,width] duration-300 motion-reduce:transition-none" />
        ))}
      </g>
      {over && <path d={`M${4 + W} 9l4 2.5l-4 2.5l4 2.5`} fill="none" stroke={ROAST} strokeWidth={1} />}
      <path d={`M${4 + rec.c * s} 6.5V21.5`} stroke={INK} strokeWidth={1.2} strokeDasharray="2 1.5" />
      <text x={4 + rec.c * s} y={6} textAnchor="middle" fontSize={6.5} fontWeight={700} fontFamily={MONO} fill={INK}>
        {rec.c}
      </text>
    </svg>
  );
}

/** a রসিদ as a white slip: its counts and মোট, its lamp, and the money bar at the paper's prices */
function ReceiptCard({ rec, color, price, goods = DEKCHI, bar = true }: { rec: Rec; color: string; price: XY | null; goods?: Goods; bar?: boolean }) {
  const on = price !== null && lights(rec, price);
  const tone = price === null ? "" : on ? "মিললো" : pile(rec, price) < rec.c ? "টাকা কম" : "টাকা বেশি";
  return (
    <div className="w-full rounded-lg border-2 bg-white px-2 py-1.5 text-[#0f1b2d] shadow-sm" style={{ borderColor: color }}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[0.7rem] leading-tight font-bold" style={{ color }}>
          {rec.name}
        </span>
        <Lamp on={on} />
      </div>
      <div className="text-[0.72rem] leading-snug">
        {goods.x} {rec.a} {goods.unit} · {goods.y} {rec.b} {goods.unit}
      </div>
      <div className="text-[0.72rem] leading-snug font-semibold">মোট {goods.money(rec.c)}</div>
      {bar && price && (
        <>
          <MoneyBar rec={rec} price={price} />
          <div className={`text-center text-[0.65rem] leading-none ${on ? "font-semibold text-[#a16207]" : "text-[#64748b]"}`}>{tone}</div>
        </>
      )}
    </div>
  );
}

/** a রসিদ in one line, for pairs shown small */
function Slip({ rec, goods = DEKCHI, color }: { rec: Rec; goods?: Goods; color?: string }) {
  return (
    <span className="block rounded border bg-white px-1.5 py-0.5 text-[0.68rem] leading-tight text-[#0f1b2d]" style={{ borderColor: color ?? "#cbd5e1" }}>
      {goods.x} {rec.a} · {goods.y} {rec.b} · মোট {goods.money(rec.c)}
    </span>
  );
}

/** what the paper's dot means, in words */
function PriceSay({ p, goods = DEKCHI }: { p: XY; goods?: Goods }) {
  return (
    <div className="mt-1 text-center text-xs text-muted">
      Shiku এর দাম: {goods.x} {goods.price(p[0])} · {goods.y} {goods.price(p[1])}
    </div>
  );
}

/** the paper on the left, the রসিদ cards stacked on the right */
function Board({ paper, cards }: { paper: ReactNode; cards: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="w-[11.4rem] shrink-0">{paper}</div>
      <div className="flex w-[8.3rem] flex-col gap-1.5">{cards}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The smudged page, and the three pairs on the মাদুর। The
//     reader ticks every pair that will give one price. Sealing acts it out:
//     a "দাম ?" tag pops beside each ticked day on the page, in turn.

export function PairBet() {
  const pass = useGate();
  const [ticked, setTicked] = useSeed<number[]>("ticked", []);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(500);
  const k = !sealed ? 0 : act.running ? act.k : 3;
  const flip = (i: number) => {
    if (sealed) return;
    setTicked(ticked.includes(i) ? ticked.filter((t) => t !== i) : [...ticked, i].sort());
  };
  const seal = () => {
    if (sealed) return;
    setSealed(true);
    act.play(3, () => pass("বাজি সিল হলো। আগে একটা রসিদ।"));
  };
  return (
    <>
      <svg viewBox="0 0 260 78" className="mx-auto block h-auto w-full max-w-[17rem]" role="img" aria-label="মামার খাতার ভেজা পাতা: এক ডেকচি পোলাও আর এক ডেকচি রোস্টের দাম ধুয়ে গেছে; পাশে তিন দিনের নাম">
        <rect x={2} y={2} width={256} height={74} rx={4} fill="#fefce8" stroke="#a16207" strokeWidth={0.8} />
        {[22, 44, 66].map((y) => (
          <path key={y} d={`M10 ${y}H250`} stroke="#bae6fd" strokeWidth={0.6} />
        ))}
        <text x={12} y={19} fontSize={10} fontWeight={600} fill={INK}>
          পোলাও, এক ডেকচি
        </text>
        <text x={12} y={41} fontSize={10} fontWeight={600} fill={INK}>
          রোস্ট, এক ডেকচি
        </text>
        {[14, 36].map((y) => (
          <g key={y} opacity={0.75}>
            <ellipse cx={120} cy={y} rx={16} ry={7} fill="#93c5fd" />
            <ellipse cx={128} cy={y + 2} rx={9} ry={5} fill="#60a5fa" />
          </g>
        ))}
        {PAIRS.map((p, i) => {
          const x = 160 + i * 34;
          const on = ticked.includes(i);
          return (
            <g key={p.day}>
              <text x={x} y={62} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
                {p.day}
              </text>
              {k > i && on && (
                <g className={POP}>
                  <rect x={x - 14} y={8} width={28} height={30} rx={4} fill="white" stroke="#2563eb" strokeWidth={1.2} />
                  <text x={x} y={20} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#2563eb">
                    দাম
                  </text>
                  <text x={x} y={34} textAnchor="middle" fontSize={13} fontWeight={800} fill="#2563eb">
                    ?
                  </text>
                </g>
              )}
              {k > i && !on && <path d={`M${x - 6} ${17}l12 12M${x + 6} ${17}l-12 12`} stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" className={POP} />}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-col gap-1.5">
        {PAIRS.map((p, i) => (
          <Choice key={p.day} n={i} look={ticked.includes(i) ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => flip(i)}>
            <span className="flex w-full items-center gap-2">
              <span className="w-12 shrink-0 text-sm leading-tight font-semibold">{p.of} জোড়া</span>
              <span className="flex flex-col gap-0.5">
                <Slip rec={p.recs[0]} />
                <Slip rec={p.recs[1]} />
              </span>
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 3}>কোন কোন জোড়া থেকে দাম বের হবে? যতগুলো মনে হয় tick দিন, তারপর সিল। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · One রসিদ: হলুদের রসিদ 1 (2p + r = 8)। The reader drags Shiku's price
//     dot; the money bar grows and shrinks; the lamp lights at (0, 8), (1, 6),
//     (2, 4), (3, 2), (4, 0); each lit spot leaves a pin. At four pins a
//     dashed line runs through them.

export function OneReceipt() {
  const pass = useGate();
  const [dot, setDot] = useSeed<XY>("dot", [0, 0]);
  const [pins, setPins] = useSeed<string[]>("pins", []);
  const done = pins.length >= 4;
  const move = (p: XY) => {
    setDot(p);
    if (!lights(H1, p) || pins.includes(keyOf(p))) return;
    const next = [...pins, keyOf(p)];
    setPins(next);
    if (next.length === 4) pass("একটা রসিদ: একটা লাইন ভরা দাম।");
  };
  return (
    <>
      <Board
        paper={
          <PricePaper dot={dot} onDot={move} label="দামের কাগজ: ডানে পোলাওর দাম, উপরে রোস্টের দাম; Shiku কে টেনে দাম বদলান; রসিদের বাতি জ্বললে সেখানে pin পড়ে">
            {done && <ReceiptLine rec={H1} color={R_COL[0]} dash width={1.6} />}
            {pins.map((k) => (
              <Pin key={k} at={fromKey(k)} cols={[R_COL[0]]} />
            ))}
          </PricePaper>
        }
        cards={
          <>
            <ReceiptCard rec={H1} color={R_COL[0]} price={dot} />
            <div className="px-1 text-center text-xs text-muted">
              pin: <span className="font-mono">{pins.length}</span> / 4
            </div>
          </>
        }
      />
      <PriceSay p={dot} />
      <Task done={done}>Shiku কে টেনে দাম বদলান। বাতি যেখানে জ্বলে, সেখানে pin পড়ে। 4টা pin ফেলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The second হলুদের রসিদ (p + 2r = 7). The first রসিদের line is known
//     now, with its pins; the second has only its lamp. Walk the pins: at
//     (3, 2) both lamps light, and the second line draws itself through.

export function TwoReceipts() {
  const pass = useGate();
  const [dot, setDot] = useSeed<XY>("dot", [0, 8]);
  const [found, setFound] = useSeed("found", false);
  const show = usePlay(900);
  const move = (p: XY) => {
    setDot(p);
    if (found || !lights(H1, p) || !lights(H2, p)) return;
    setFound(true);
    show.play(1, () => pass("দুই লাইন যেখানে কাটে, দাম সেইখানে।"));
  };
  return (
    <>
      <Board
        paper={
          <PricePaper dot={dot} onDot={move} label="দামের কাগজে হলুদের রসিদ 1 এর লাইন আর তার pin; দ্বিতীয় রসিদের শুধু বাতি; দুই বাতি একসাথে জ্বললে দ্বিতীয় লাইন আঁকা হয়">
            <ReceiptLine rec={H1} color={R_COL[0]} dash width={1.6} />
            {found && <ReceiptLine rec={H2} color={R_COL[1]} />}
            {spotsOn(H1, PAPER_F).map((p) => (
              <Pin key={keyOf(p)} at={p} cols={found && lights(H2, p) ? [R_COL[0], R_COL[1]] : [R_COL[0]]} />
            ))}
          </PricePaper>
        }
        cards={
          <>
            <ReceiptCard rec={H1} color={R_COL[0]} price={dot} />
            <ReceiptCard rec={H2} color={R_COL[1]} price={dot} />
          </>
        }
      />
      <PriceSay p={dot} />
      <Task done={found && !show.running}>এমন দাম খুঁজুন, যেখানে দুইটা বাতিই জ্বলে। প্রথম লাইনের pin গুলো ধরে হাঁটুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Predict first: the বিয়ের pair (p + r = 5 · 2p + 2r = 10). How many
//     spots light both lamps? The second line draws itself and lands on the
//     first; Shiku walks the six pins and both lamps light at every one.

const X4_SPOTS = spotsOn(B1, PAPER_F); // (0, 5) … (5, 0)
const X4_OPTS = ["এক জায়গায়", "কোথাও না", "লাইন ভরা, সবখানে"];
const X4_RIGHT = 2;

function X4_Mini({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 44 30" width={44} height={30} aria-hidden="true" className="shrink-0">
      <rect x={1} y={1} width={42} height={28} rx={3} fill="white" stroke="#cbd5e1" />
      <path d="M6 24L38 6" stroke={R_COL[0]} strokeWidth={1.6} />
      {i === 0 && <circle cx={22} cy={15} r={3.5} fill={LAMP} stroke="#a16207" />}
      {i === 1 && <text x={22} y={27} textAnchor="middle" fontSize={8} fontWeight={800} fill="#64748b">0</text>}
      {i === 2 && [8, 15, 22, 29, 36].map((x) => <circle key={x} cx={x} cy={24 - ((x - 6) * 18) / 32} r={2.4} fill={LAMP} stroke="#a16207" strokeWidth={0.6} />)}
    </svg>
  );
}

export function CopyReceipt() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);
  const walk = usePlay(420);
  const n = X4_SPOTS.length;
  // 0: line 2 draws, 1…n: Shiku on pin 1…n
  const k = !ran ? -1 : walk.running ? walk.k : n;
  const pick = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    setRan(true);
    walk.play(n, () => pass("দ্বিতীয় রসিদ নতুন কিছু বলে না।"));
  };
  const at: XY = k >= 1 ? X4_SPOTS[Math.min(k, n) - 1] : [0, 0];
  const over = ran && !walk.running;
  return (
    <>
      <Board
        paper={
          <PricePaper dot={k >= 1 ? at : null} label="দামের কাগজে বিয়ের দুপুরের রসিদের লাইন; রাতের রসিদের লাইন ঠিক তার উপরে পড়ে; Shiku ছয়টা pin ধরে হাঁটে">
            <ReceiptLine rec={B1} color={R_COL[0]} width={4} />
            {k >= 0 && <ReceiptLine rec={B2} color={R_COL[1]} width={1.6} />}
            {X4_SPOTS.map((p, i) => (
              <Pin key={keyOf(p)} at={p} cols={k > i ? [R_COL[0], R_COL[1]] : [R_COL[0]]} />
            ))}
          </PricePaper>
        }
        cards={
          <>
            <ReceiptCard rec={B1} color={R_COL[0]} price={k >= 1 ? at : null} />
            <ReceiptCard rec={B2} color={R_COL[1]} price={k >= 1 ? at : null} />
          </>
        }
      />
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X4_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, X4_RIGHT)} disabled={guess !== null} onClick={() => pick(i)}>
            <span className="flex flex-col items-start gap-0.5 text-xs leading-tight">
              <X4_Mini i={i} />
              {o}
            </span>
          </Choice>
        ))}
      </div>
      <Task done={over}>আগে guess: কয় জায়গায় দুইটা বাতি একসাথে জ্বলবে? তারপর দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The ফিরানির pair (p + r = 5 · 2p + 2r = 12). The reader hunts for a spot
//     that lights both. Each lit spot leaves a pin in its রসিদের colour; after
//     three pins each, both lines draw and the gap between them shades.

export function WrongReceipt() {
  const pass = useGate();
  const [dot, setDot] = useSeed<XY>("dot", [0, 0]);
  const [p1, setP1] = useSeed<string[]>("p1", []);
  const [p2, setP2] = useSeed<string[]>("p2", []);
  const [shown, setShown] = useSeed("shown", false);
  const show = usePlay(1000);
  const move = (p: XY) => {
    setDot(p);
    const n1 = lights(F1, p) && !p1.includes(keyOf(p)) ? [...p1, keyOf(p)] : p1;
    const n2 = lights(F2, p) && !p2.includes(keyOf(p)) ? [...p2, keyOf(p)] : p2;
    if (n1 !== p1) setP1(n1);
    if (n2 !== p2) setP2(n2);
    if (!shown && n1.length >= 3 && n2.length >= 3) {
      setShown(true);
      show.play(1, () => pass("সমান্তরাল: কোনো দাম দুইটাই মিলায় না।"));
    }
  };
  const f = PAPER_F;
  const gap = [...(seg(1, 1, 5, f) ?? []), ...(seg(1, 1, 6, f) ?? []).reverse()];
  return (
    <>
      <Board
        paper={
          <PricePaper dot={dot} onDot={move} label="দামের কাগজে ফিরানির দুই রসিদ; যেখানে যেই বাতি জ্বলে সেখানে তার রঙের pin; শেষে দুই লাইন পাশাপাশি, মাঝে ফাঁক">
            {shown && (
              <>
                <path d={`M${gap.map((q) => `${f.sx(q[0]).toFixed(1)} ${f.sy(q[1]).toFixed(1)}`).join("L")}Z`} fill={BAD} opacity={0.18} className={`pointer-events-none ${FADE}`} />
                <ReceiptLine rec={F1} color={R_COL[0]} />
                <ReceiptLine rec={F2} color={R_COL[1]} />
              </>
            )}
            {p1.map((k) => (
              <Pin key={`a${k}`} at={fromKey(k)} cols={[R_COL[0]]} />
            ))}
            {p2.map((k) => (
              <Pin key={`b${k}`} at={fromKey(k)} cols={[R_COL[1]]} />
            ))}
          </PricePaper>
        }
        cards={
          <>
            <ReceiptCard rec={F1} color={R_COL[0]} price={dot} />
            <ReceiptCard rec={F2} color={R_COL[1]} price={dot} />
          </>
        }
      />
      <Ticks
        items={[
          [`নীল pin ${Math.min(p1.length, 3)}/3`, p1.length >= 3],
          [`বেগুনি pin ${Math.min(p2.length, 3)}/3`, p2.length >= 3],
        ]}
      />
      <Task done={shown && !show.running}>দুইটা বাতি একসাথে জ্বালান। না পারলে, প্রত্যেক বাতি অন্তত 3 জায়গায় জ্বালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Only three ways. The বিয়ের দুপুরের রসিদ's line is fixed. A second line
//     runs through two handles the reader drags. The readout says where both
//     lamps light: one spot (it glows), nowhere, or the whole line. Never two.

type Kind = 0 | 1 | 2; // এক · নাই · সব
const KIND_SAY = ["এক জায়গায়", "কোথাও না", "লাইন ভরা, সবখানে"];

/** the second line through h1, h2 as a·x + b·y = c */
const lineThrough = (h1: XY, h2: XY): Rec => {
  const a = h2[1] - h1[1];
  const b = -(h2[0] - h1[0]);
  return { name: "", a, b, c: a * h1[0] + b * h1[1] };
};
function kindOf(r1: Rec, r2: Rec): { kind: Kind; at: XY | null } {
  const d = r1.a * r2.b - r1.b * r2.a;
  if (Math.abs(d) > 1e-9) return { kind: 0, at: [(r1.c * r2.b - r1.b * r2.c) / d, (r1.a * r2.c - r1.c * r2.a) / d] };
  // parallel: on top when a point of r2 lies on r1
  const p: XY = Math.abs(r2.b) > 1e-9 ? [0, r2.c / r2.b] : [r2.c / r2.a, 0];
  return { kind: lights(r1, p) ? 2 : 1, at: null };
}

export function OnlyThree() {
  const pass = useGate();
  const [h, setH] = useSeed<[XY, XY]>("h", [
    [0, 1],
    [6, 4],
  ]);
  const [seen, setSeen] = useSeed<Kind[]>("seen", [0]);
  const [hold, setHold] = useState<0 | 1 | null>(null);
  const f = PAPER_F;
  const tw = useTween([h[0][0], h[0][1], h[1][0], h[1][1]], 220);
  const r2 = lineThrough(h[0], h[1]);
  const { kind, at } = kindOf(B1, r2);
  const set = (i: 0 | 1, p: XY) => {
    const q = snap(p, f);
    const other = h[1 - i];
    if (q[0] === other[0] && q[1] === other[1]) return;
    const next: [XY, XY] = i === 0 ? [q, h[1]] : [h[0], q];
    setH(next);
    const kd = kindOf(B1, lineThrough(next[0], next[1])).kind;
    if (!seen.includes(kd)) {
      const s = [...seen, kd];
      setSeen(s);
      if (s.length === 3) pass("এক, শূন্য, নাহলে অসীম। দুই কখনো না।");
    }
  };
  const down = (p: XY) => {
    const d0 = Math.hypot(p[0] - h[0][0], p[1] - h[0][1]);
    const d1 = Math.hypot(p[0] - h[1][0], p[1] - h[1][1]);
    const i: 0 | 1 = d0 <= d1 ? 0 : 1;
    setHold(i);
    set(i, p);
  };
  // the tweened second line, stretched across the sheet
  const tr = lineThrough([tw[0], tw[1]], [tw[2], tw[3]]);
  const s2 = seg(tr.a, tr.b, tr.c, f);
  const inside = at && at[0] >= f.x0 && at[0] <= f.x1 && at[1] >= f.y0 && at[1] <= f.y1;
  return (
    <>
      <div className="mx-auto w-[13rem]">
        <Plane
          f={f}
          ticks={1}
          label="দামের কাগজে বিয়ের দুপুরের রসিদের লাইন; আরেকটা লাইন দুইটা হাতল দিয়ে ঘোরানো যায়; দুই বাতি কোথায় একসাথে জ্বলে তা দেখায়"
          drag={{ down, move: (p) => hold !== null && set(hold, p), up: () => setHold(null) }}
          className="my-0! max-w-none"
        >
          {kind === 2 && s2 && <path d={segD(f, s2)} stroke={LAMP} strokeWidth={9} strokeLinecap="round" opacity={0.6} className={`pointer-events-none ${FADE}`} />}
          <ReceiptLine rec={B1} color={R_COL[0]} width={3} />
          {s2 && <path d={segD(f, s2)} stroke={R_COL[1]} strokeWidth={1.8} strokeDasharray={kind === 2 ? "5 4" : undefined} fill="none" className="pointer-events-none" />}
          {kind === 0 && inside && at && (
            <g key={keyOf(at)} className={`pointer-events-none ${POP}`}>
              <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={8} fill={LAMP} opacity={0.6} />
              <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={3.5} fill={LAMP} stroke="#a16207" />
            </g>
          )}
          {[0, 1].map((i) => (
            <g key={i} className="pointer-events-none">
              <circle cx={f.sx(tw[i * 2])} cy={f.sy(tw[i * 2 + 1])} r={7} fill="white" stroke={R_COL[1]} strokeWidth={2} />
              <circle cx={f.sx(tw[i * 2])} cy={f.sy(tw[i * 2 + 1])} r={2.5} fill={R_COL[1]} />
            </g>
          ))}
        </Plane>
      </div>
      <div key={kind} className={`mt-1 text-center text-sm ${FADE}`}>
        দুই বাতি একসাথে জ্বলে: <b>{KIND_SAY[kind]}</b>
        {kind === 0 && !inside && <span className="text-muted"> (কাগজের বাইরে)</span>}
      </div>
      <Ticks items={KIND_SAY.map((s, i) => [s, seen.includes(i as Kind)] as [string, boolean])} />
      <Task done={seen.length === 3}>বেগুনি লাইনের হাতল টেনে ঘোরান। দুই বাতি ঠিক দুই জায়গায় জ্বালানো যায়? তিন রকম ফল খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn: the দইওয়ালা's two রসিদ (a + 3b = 11 · 2a + b = 7, in শ' টাকা)।
//     No lines, no pins: only the lamps. Once both light, pick what kind of
//     pair it is; the pick draws both lines. Right: (2, 3), এক।

function KindMini({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 40 28" width={40} height={28} aria-hidden="true" className="shrink-0">
      <rect x={1} y={1} width={38} height={26} rx={3} fill="white" stroke="#cbd5e1" />
      {i === 0 && (
        <>
          <path d="M5 22L35 6M5 8L35 22" stroke={INK} strokeWidth={1.4} />
          <circle cx={20} cy={14.5} r={3} fill={LAMP} stroke="#a16207" />
        </>
      )}
      {i === 1 && <path d="M5 20L30 5M10 24L35 9" stroke={INK} strokeWidth={1.4} />}
      {i === 2 && (
        <>
          <path d="M5 22L35 6" stroke={LAMP} strokeWidth={5} opacity={0.7} />
          <path d="M5 22L35 6" stroke={INK} strokeWidth={1.4} />
        </>
      )}
    </svg>
  );
}
const KIND_BTN = ["এক দাম", "দাম নাই", "অসীম দাম"];

export function YourPair() {
  const pass = useGate();
  const [dot, setDot] = useSeed<XY>("dot", [0, 0]);
  const [both, setBoth] = useSeed("both", false);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const draw = usePlay(900);
  const move = (p: XY) => {
    setDot(p);
    if (!both && lights(D1, p) && lights(D2, p)) setBoth(true);
  };
  const choose = (i: number) => {
    if (draw.running) return;
    setPick(i);
    draw.play(1, () => (i === 0 ? pass("দই: টক 200 টাকা, মিষ্টি 300 টাকা।") : setMiss((m) => m + 1)));
  };
  const settled = pick !== null && !draw.running;
  const right = settled && pick === 0;
  return (
    <>
      <Board
        paper={
          <PricePaper goods={DOI} dot={dot} onDot={move} label="দামের কাগজ: ডানে টক দইয়ের দাম, উপরে মিষ্টি দইয়ের দাম, এক ঘর 100 টাকা; দইওয়ালার দুই রসিদের বাতি">
            {pick !== null && (
              <g key={`${pick}-${miss}`}>
                <ReceiptLine rec={D1} color={R_COL[0]} />
                <ReceiptLine rec={D2} color={R_COL[1]} />
              </g>
            )}
            {right && <Pin at={[2, 3]} cols={[R_COL[0], R_COL[1]]} />}
          </PricePaper>
        }
        cards={
          <>
            <ReceiptCard rec={D1} color={R_COL[0]} price={dot} goods={DOI} />
            <ReceiptCard rec={D2} color={R_COL[1]} price={dot} goods={DOI} />
          </>
        }
      />
      <PriceSay p={dot} goods={DOI} />
      {both && (
        <div className={`mt-2 grid grid-cols-3 gap-1.5 ${FADE}`}>
          {KIND_BTN.map((b, i) => (
            <Choice key={b} n={i} look={pick === i && settled ? (i === 0 ? "right" : "wrong") : "idle"} disabled={right} onClick={() => choose(i)}>
              <span className="flex flex-col items-start gap-0.5 text-xs leading-tight">
                <KindMini i={i} />
                {b}
              </span>
            </Choice>
          ))}
        </div>
      )}
      {settled && pick === 1 && <Nope key={miss}>এইমাত্র দুই বাতি একসাথে জ্বললো। তাহলে দাম আছে। লাইন দুইটা দেখুন, কোথায় কাটলো।</Nope>}
      {settled && pick === 2 && <Nope key={miss}>লাইন দুইটা একবার কেটে দুই দিকে চলে গেলো। দুই বাতি জ্বলে শুধু ওই এক জায়গায়।</Nope>}
      <Task done={right}>{both ? "এই জোড়া কোন রকম? বেছে নিন।" : "দইওয়ালার দুই রসিদ। এমন দাম খুঁজুন যেখানে দুইটা বাতিই জ্বলে।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it: three new pairs from the বাবুর্চির ব্যাগ, written only as রসিদ।
//     Drop each into এক / নাই / অসীম। Every drop draws the two lines on a
//     small paper; a wrong one says what the lines just showed.

const X8_F = makeFrame(0, 6, 0, 6, 18, 26); // 160 × 160
const X8_PAIRS: { recs: [Rec, Rec]; kind: Kind; why: string[] }[] = [
  {
    recs: [
      { name: "", a: 3, b: 1, c: 6 },
      { name: "", a: 6, b: 2, c: 12 },
    ],
    kind: 2,
    why: ["লাইন দুইটা একটার উপর আরেকটা। দ্বিতীয় রসিদ প্রথমটার ডবল: 6 পোলাও 2 রোস্ট 12 হাজার।", "লাইন দুইটা আলাদা না, একটার উপর আরেকটা। পুরা লাইন জুড়ে দুই বাতি জ্বলে।"],
  },
  {
    recs: [
      { name: "", a: 1, b: 1, c: 4 },
      { name: "", a: 1, b: 3, c: 8 },
    ],
    kind: 0,
    why: ["", "লাইন দুইটা এক জায়গায় কাটলো। ওইখানে দুই বাতিই জ্বলে। দাম আছে।", "লাইন দুইটা একবারই কাটলো, তারপর আলাদা। সবখানে না।"],
  },
  {
    recs: [
      { name: "", a: 1, b: 2, c: 4 },
      { name: "", a: 2, b: 4, c: 12 },
    ],
    kind: 1,
    why: ["লাইন দুইটা পাশাপাশি, কোথাও কাটে না। কাটার জায়গা নাই, দামও নাই।", "", "দুই লাইন উপরে পড়লো না, পাশাপাশি চললো। প্রথমটার ডবল হলে মোট হতো 8, রসিদে 12।"],
  },
];

export function TryWhich() {
  const pass = useGate();
  const [idx, setIdx] = useSeed("idx", 0);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const draw = usePlay(1100);
  const pair = X8_PAIRS[idx];
  const choose = (i: number) => {
    if (draw.running) return;
    setPick(i);
    draw.play(1, () => {
      if (i !== pair.kind) {
        setMiss((m) => m + 1);
        return;
      }
      if (idx === X8_PAIRS.length - 1) pass("দুই রসিদ দেখেই: এক, নাই, নাহলে অসীম।");
      else {
        setIdx(idx + 1);
        setPick(null);
      }
    });
  };
  const settled = pick !== null && !draw.running;
  const allDone = settled && pick === pair.kind && idx === X8_PAIRS.length - 1;
  const cross = kindOf(pair.recs[0], pair.recs[1]);
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <div className="w-[8rem] shrink-0">
          <PricePaper f={X8_F} label="ছোট দামের কাগজ; জোড়ার দুই রসিদের লাইন আঁকা হয় বাছাইয়ের পরে">
            {pick !== null && (
              <g key={`${idx}-${pick}-${miss}`}>
                {pair.kind === 2 && <ReceiptLine f={X8_F} rec={pair.recs[0]} color={LAMP} width={8} />}
                <ReceiptLine f={X8_F} rec={pair.recs[0]} color={R_COL[0]} width={2.6} />
                <ReceiptLine f={X8_F} rec={pair.recs[1]} color={R_COL[1]} width={1.6} />
                {cross.at && <Pin f={X8_F} at={cross.at} cols={[R_COL[0], R_COL[1]]} />}
              </g>
            )}
          </PricePaper>
        </div>
        <div className="flex w-[11.6rem] flex-col gap-1">
          <span className="text-xs text-muted">
            জোড়া <span className="font-mono">{idx + 1}</span> / 3
          </span>
          <Slip rec={pair.recs[0]} color={R_COL[0]} />
          <Slip rec={pair.recs[1]} color={R_COL[1]} />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {KIND_BTN.map((b, i) => (
          <Choice key={b} n={i} look={pick === i && settled ? (i === pair.kind ? "right" : "wrong") : "idle"} disabled={allDone} onClick={() => choose(i)}>
            <span className="flex flex-col items-start gap-0.5 text-xs leading-tight">
              <KindMini i={i} />
              {b}
            </span>
          </Choice>
        ))}
      </div>
      {settled && pick !== pair.kind && <Nope key={miss}>{pair.why[pick]}</Nope>}
      <Task done={allDone}>প্রতিটা জোড়া কোন রকম, বেছে নিন। বাছলে লাইন দুইটা আঁকা হবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The bet opened. Tap each day: its two lines draw on the paper, and the
//     answer is said. Only the হলুদের pair gives a price.

const X9_F = makeFrame(0, 7, 0, 8, 16, 26); // 164 × 180
const X9_SAY = [
  "দুই লাইন এক জায়গায় কাটলো। পোলাও 3 হাজার, রোস্ট 2 হাজার।",
  "দুই লাইন একটার উপর আরেকটা। দাম লাইন ভরা, বাছা যায় না।",
  "দুই লাইন পাশাপাশি, কখনো কাটে না। একটা রসিদ ভুল।",
];

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const draw = usePlay(1000);
  const tap = (i: number) => {
    if (draw.running) return;
    const next = open.includes(i) ? open : [...open, i];
    setOpen(next);
    setCur(i);
    draw.play(1, () => {
      if (next.length === 3) pass("শুধু হলুদের জোড়া দাম দিলো।");
    });
  };
  const pair = cur === null ? null : PAIRS[cur];
  const landed = cur !== null && !draw.running;
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <div className="w-[8.9rem] shrink-0">
          <PricePaper f={X9_F} label="ছোট দামের কাগজ; যেই দিনের জোড়া খুলবেন, তার দুই রসিদের লাইন">
            {pair && cur !== null && (
              <g key={cur}>
                {cur === 1 && <ReceiptLine f={X9_F} rec={pair.recs[0]} color={LAMP} width={8} />}
                {cur === 2 && (
                  <path
                    d={`M${[...(seg(1, 1, 5, X9_F) ?? []), ...(seg(1, 1, 6, X9_F) ?? []).reverse()].map((q) => `${X9_F.sx(q[0]).toFixed(1)} ${X9_F.sy(q[1]).toFixed(1)}`).join("L")}Z`}
                    fill={BAD}
                    opacity={0.18}
                    className={`pointer-events-none ${FADE}`}
                  />
                )}
                <ReceiptLine f={X9_F} rec={pair.recs[0]} color={R_COL[0]} width={2.8} />
                <ReceiptLine f={X9_F} rec={pair.recs[1]} color={R_COL[1]} width={1.6} />
                {cur === 0 && landed && <Pin f={X9_F} at={[3, 2]} cols={[R_COL[0], R_COL[1]]} />}
              </g>
            )}
          </PricePaper>
        </div>
        <div className="flex w-[10rem] flex-col gap-1 text-sm">
          {landed && cur !== null ? (
            <span key={cur} className={`${FADE} ${cur === 0 ? "font-semibold text-accent-text" : "text-danger"}`}>
              {X9_SAY[cur]}
            </span>
          ) : (
            <span className="text-muted">একটা দিন খুলুন।</span>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {PAIRS.map((p, i) => (
          <Choice key={p.day} n={i} look={open.includes(i) ? (i === 0 ? "right" : "wrong") : "idle"} disabled={draw.running} onClick={() => tap(i)}>
            <span className="text-sm font-semibold">{p.day}</span>
          </Choice>
        ))}
      </div>
      <Task done={open.length === 3}>তিন দিনের জোড়াই খুলুন। আপনার বাজির সাথে মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage pieces for the story scenes (cast <Stage>, 320 × 180, ground 150).

function Name({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK} stroke="white" strokeOpacity={0.6} strokeWidth={2} paintOrder="stroke" className="pointer-events-none">
      {text}
    </text>
  );
}

/** The বাবুর্চি (7.x look): নানা's look, a white cap, his name. `pan` puts a পান in his hand. */
function Baburchi({ x, y, facing = 1, arm = "down", pan = false }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point"; pan?: boolean }) {
  return (
    <>
      <Person who="nana" x={x} y={y} facing={facing} arm={arm} />
      <path d={`M${x - 9} ${y - 57}q9 -11 18 0Z`} fill="white" stroke="#cbd5e1" strokeWidth={0.8} className="pointer-events-none" />
      {pan && arm === "hold" && <path d={`M${x + 17 * facing} ${y - 43}q${4 * facing} -5 ${8 * facing} 0q${-4 * facing} 5 ${-8 * facing} 0Z`} fill="#16a34a" stroke="#14532d" strokeWidth={0.5} className="pointer-events-none" />}
      <Name x={x} y={y} text="বাবুর্চি" />
    </>
  );
}

/** the বাবুর্চির ছেলে: করিম's look, smaller, a white cap */
function Chhele({ x, y, facing = 1, arm = "down" }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point" }) {
  return (
    <>
      <Person who="karim" x={x} y={y} facing={facing} arm={arm} scale={0.9} />
      <path d={`M${x - 8} ${y - 51}q8 -10 16 0Z`} fill="white" stroke="#cbd5e1" strokeWidth={0.8} className="pointer-events-none" />
      <Name x={x} y={y} text="বাবুর্চির ছেলে" />
    </>
  );
}

/** the ময়রা: মামা's look, a ঘি-stained গেঞ্জি, his name */
function Moyra({ x, y, facing = 1, arm = "down" }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point" }) {
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} arm={arm} />
      <path d={`M${x - 7} ${y - 38}h14v17h-14Z`} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={0.6} className="pointer-events-none" />
      <circle cx={x - 2} cy={y - 30} r={2} fill="#fde68a" opacity={0.9} className="pointer-events-none" />
      <circle cx={x + 3} cy={y - 25} r={1.4} fill="#fde68a" opacity={0.9} className="pointer-events-none" />
      <Name x={x} y={y} text="ময়রা" />
    </>
  );
}

/** the দইওয়ালা: মামা's look, a বাঁক on his shoulder with two হাঁড়ি */
function Doiwala({ x, y, facing = 1 }: { x: number; y: number; facing?: 1 | -1 }) {
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} />
      <g className="pointer-events-none">
        <path d={`M${x - 30} ${y - 46}L${x + 30} ${y - 50}`} stroke="#92400e" strokeWidth={2} />
        {[-26, 26].map((dx) => (
          <g key={dx}>
            <path d={`M${x + dx} ${y - 47}v12`} stroke="#78716c" strokeWidth={0.7} />
            <ellipse cx={x + dx} cy={y - 28} rx={8} ry={7} fill="#c2410c" stroke="#7c2d12" strokeWidth={0.7} />
            <ellipse cx={x + dx} cy={y - 34} rx={6} ry={1.6} fill="#fef3c7" />
          </g>
        ))}
      </g>
      <Name x={x} y={y} text="দইওয়ালা" />
    </>
  );
}

/** the house wall behind the রোয়াক, with its door */
function St_House() {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={60} width={320} height={82} fill="#e7d7c1" />
      <path d="M0 60H320" stroke="#a8a29e" strokeWidth={2} />
      <rect x={138} y={82} width={30} height={60} fill="#92400e" stroke="#78350f" />
      <rect x={0} y={134} width={320} height={16} fill="#d6c3a5" stroke="#a8a29e" strokeWidth={0.8} />
    </g>
  );
}

/** a মাদুর on the ground, from x0 to x1 */
function St_Madur({ x0, x1, y = 152 }: { x0: number; x1: number; y?: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x0} ${y}L${x1} ${y}L${x1 + 8} ${y + 20}L${x0 - 8} ${y + 20}Z`} fill="#fde68a" stroke="#ca8a04" strokeWidth={0.8} />
      {Array.from({ length: Math.floor((x1 - x0) / 10) }, (_, i) => (
        <path key={i} d={`M${x0 + 5 + i * 10} ${y}l${-2 + (i % 2)} 20`} stroke="#eab308" strokeWidth={0.5} />
      ))}
    </g>
  );
}

/** a small রসিদ slip lying at (x, y) */
function St_Slip({ x, y, tilt = 0, wet = false }: { x: number; y: number; tilt?: number; wet?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`} className="pointer-events-none">
      <rect x={-6} y={-4} width={12} height={8} fill="white" stroke="#64748b" strokeWidth={0.5} />
      <path d="M-4 -1.5h8M-4 0.5h6M-4 2.5h4" stroke="#475569" strokeWidth={0.5} />
      {wet && <circle cx={2} cy={2} r={2.5} fill="#93c5fd" opacity={0.8} />}
    </g>
  );
}

/** the wet খাতা, open, drying; `peel` lifts a page */
function St_WetKhata({ x, y, peel = false }: { x: number; y: number; peel?: boolean }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 22} ${y - 10}L${x} ${y - 8}L${x + 22} ${y - 10}L${x + 22} ${y + 8}L${x} ${y + 10}L${x - 22} ${y + 8}Z`} fill="#fefce8" stroke="#a16207" strokeWidth={0.8} />
      <path d={`M${x} ${y - 8}V${y + 10}`} stroke="#a16207" strokeWidth={0.6} />
      <ellipse cx={x - 10} cy={y} rx={7} ry={4} fill="#93c5fd" opacity={0.8} />
      <ellipse cx={x + 11} cy={y + 2} rx={6} ry={3.5} fill="#93c5fd" opacity={0.8} />
      {peel && <path d={`M${x} ${y - 8}Q${x + 14} ${y - 26} ${x + 26} ${y - 22}L${x + 22} ${y - 10}Z`} fill="#fffbeb" stroke="#a16207" strokeWidth={0.7} className={POP} />}
    </g>
  );
}

function St_Sun({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={15} fill="#fde047" opacity={0.3} />
      <circle cx={x} cy={y} r={9} fill="#fde047" />
    </g>
  );
}

/** a small graph paper with two axes, lying at (x, y) */
function St_Paper({ x, y, lines = 0 }: { x: number; y: number; lines?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y} width={44} height={36} fill="white" stroke="#94a3b8" strokeWidth={0.6} />
      {[1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M${x + i * 7} ${y}v36M${x} ${y + i * 6}h44`} stroke="#bfdbfe" strokeWidth={0.4} />
      ))}
      <path d={`M${x + 4} ${y + 2}V${y + 32}H${x + 42}`} stroke={INK} strokeWidth={0.9} fill="none" />
      {lines >= 1 && <path d={`M${x + 4} ${y + 6}L${x + 26} ${y + 32}`} stroke={R_COL[0]} strokeWidth={1.2} className={POP} />}
      {lines >= 2 && <path d={`M${x + 4} ${y + 18}L${x + 40} ${y + 32}`} stroke={R_COL[1]} strokeWidth={1.2} className={POP} />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Morning. The খাতা drying on the রোয়াক in the sun, pages stuck। মামা
//      peels a page: the prices washed away. Six রসিদ in pairs on the মাদুর।
//      The বাবুর্চি on a মোড়া with his পান: any two will do.

export function MorningKhata({}: Story) {
  const s = useScene(3, [600, 2000, 2000, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সকাল; রোয়াকে রোদে মামার ভেজা খাতা; মামা পাতা ছাড়াচ্ছেন, দাম ধুয়ে গেছে; মাদুরে ছয়টা রসিদ, জোড়ায় জোড়ায়; বাবুর্চির হাতে পান; পান মুখে দিয়ে বললেন, যেই দুইটা রসিদ ধরেন, দাম বাইর হইয়া যাইবো">
        <St_Sun x={290} y={24} />
        <St_House />
        <St_WetKhata x={92} y={126} peel={k >= 1} />
        <Person who="mama" x={60} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 2 && (
          <g className={FADE}>
            <St_Madur x0={120} x1={230} />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <St_Slip x={134 + i * 34} y={160} tilt={-6} wet={i === 2} />
                <St_Slip x={148 + i * 34} y={163} tilt={5} />
              </g>
            ))}
          </g>
        )}
        <Baburchi x={272} y={150} facing={-1} pan arm={k >= 3 ? "point" : "hold"} />
        {k >= 3 && <Bubble x={272} y={70} side="left" lines={["যেই দুইটা রসিদ ধরেন,", "দাম বাইর হইয়া যাইবো।", "হিসাব তো একটাই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · Fahim brings মামার graph কাগজ। He draws two lines along its edges:
//      পোলাওর দাম to the right, রোস্টের দাম up। Shiku climbs onto it.

export function FahimPaper({}: Story) {
  const s = useScene(3, [600, 1800, 2000, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ফাহিম মামার graph কাগজ মাদুরে রাখলো; নিচের দাগ বরাবর পোলাওর দাম, বাম দাগ বরাবর রোস্টের দাম; Shiku কাগজে উঠে দাঁড়ালো">
        <St_House />
        <St_Madur x0={90} x1={250} />
        <Person who="fahim" x={60} y={150} facing={1} arm={k >= 1 ? "point" : "hold"} label />
        <g transform="translate(118 96) scale(2)">
          <St_Paper x={0} y={0} />
        </g>
        {k >= 1 && (
          <g className={FADE}>
            <text x={206} y={176} textAnchor="end" fontSize={8.5} fontWeight={700} fill={INK} stroke="white" strokeWidth={2.5} paintOrder="stroke">
              পোলাওর দাম
            </text>
            <text x={122} y={91} fontSize={8.5} fontWeight={700} fill={INK} stroke="white" strokeWidth={2.5} paintOrder="stroke">
              রোস্টের দাম
            </text>
          </g>
        )}
        <Robot x={k >= 2 ? 170 : 280} y={k >= 2 ? 150 : 150} walking={k === 2} ms={1400} />
        {k >= 3 && <Bubble x={170} y={104} side="right" lines={["আমি যেখানে দাঁড়াই,", "সেইটাই একটা দাম।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Samin reads the second হলুদের রসিদ aloud.

export function SaminReads({}: Story) {
  const s = useScene(2, [600, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সামিন হলুদের দ্বিতীয় রসিদ হাতে নিয়ে পড়লো: পোলাও এক ডেকচি, রোস্ট দুই ডেকচি, মোট সাত হাজার">
        <St_House />
        <Person who="samin" x={110} y={150} facing={1} arm="hold" label />
        <g className="pointer-events-none" transform="translate(124 104)">
          <rect x={-2} y={-8} width={20} height={14} fill="white" stroke={R_COL[1]} strokeWidth={1} />
          <path d="M1 -4h14M1 -1h11M1 2h8" stroke="#475569" strokeWidth={0.6} />
        </g>
        <Baburchi x={250} y={150} facing={-1} pan arm="hold" />
        {k >= 1 && <Bubble x={110} y={84} side="right" lines={["পোলাও এক ডেকচি,", "রোস্ট দুই ডেকচি।"]} />}
        {k >= 2 && <Bubble x={250} y={84} side="left" lines={["মোট সাত হাজার।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · The বিয়ের pair. The বাবুর্চি: দুপুরে এক দফা, রাতে তার ডবল।

export function BiyePair({}: Story) {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বাবুর্চি বিয়ের দুইটা রসিদ তুলে ধরলেন; দুপুরে এক ডেকচি পোলাও এক ডেকচি রোস্ট; রাতে মেহমান বেশি, দুই দুই ডেকচি; নাসিব বললো, দুইটা রসিদ, দাম তো পাক্কা">
        <St_House />
        <Baburchi x={70} y={150} arm="hold" pan={false} />
        {k >= 1 && <St_Slip x={86} y={104} tilt={-8} />}
        {k >= 2 && <St_Slip x={100} y={100} tilt={6} />}
        <Person who="nasib" x={220} y={150} facing={-1} arm={k >= 3 ? "point" : "down"} mood={k >= 3 ? "smug" : "plain"} label />
        {k === 1 && <Bubble x={70} y={84} side="right" lines={["দুপুরে এক ডেকচি পোলাও,", "এক ডেকচি রোস্ট।"]} />}
        {k === 2 && <Bubble x={70} y={84} side="right" lines={["রাইতে মেহমান বেশি।", "দুই দুই ডেকচি।"]} />}
        {k >= 3 && <Bubble x={220} y={84} side="left" lines={["দুইটা রসিদ।", "দাম তো পাক্কা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · The ফিরানির pair. The বাবুর্চির ছেলে brings them; he wrote them.

export function BoyBrings({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বাবুর্চির ছেলে গেট থেকে দৌড়ে এলো; হাতে ফিরানির দুইটা রসিদ; বললো, ফিরানির দুইটা আমি লিখছিলাম">
        <St_House />
        <Baburchi x={80} y={150} pan arm="hold" />
        <Chhele x={k >= 1 ? 150 : 290} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && (
          <g className={POP}>
            <St_Slip x={134} y={108} tilt={-6} />
            <St_Slip x={128} y={112} tilt={4} />
          </g>
        )}
        {k >= 2 && <Bubble x={150} y={88} side="right" lines={["ফিরানির দুইটা", "আমি লিখছিলাম।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5½a · The boy looks at the two রসিদ and scratches his head: বারো
//       লিখছিলাম? দশ হইবো।

export function BoyScratches({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বাবুর্চির ছেলে রসিদ দুইটার দিকে তাকিয়ে মাথা চুলকালো; বললো, বারো লিখছিলাম? দশ হইবো; বাবুর্চি তার দিকে তাকিয়ে আছেন">
        <St_House />
        <Baburchi x={200} y={150} facing={-1} pan arm="hold" />
        <Chhele x={120} y={150} facing={1} arm={k >= 1 ? "wave" : "hold"} />
        {k === 0 && (
          <g className={POP}>
            <St_Slip x={134} y={108} tilt={-6} />
            <St_Slip x={138} y={112} tilt={5} />
          </g>
        )}
        {k >= 2 && <Bubble x={120} y={84} side="right" lines={["বারো লিখছিলাম?", "দশ হইবো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Nasib, not giving up: দুইটা দামও তো মিলতে পারে।

export function NasibTwo({}: Story) {
  const s = useScene(2, [600, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নাসিব একটা কঞ্চি নিয়ে কাগজের উপর রাখলো; বললো, এমন দুইটা রসিদ হইতে পারে না, যাতে দুইটা দাম মিলে? সোম কাগজের দিকে তাকিয়ে আছে">
        <St_House />
        <St_Madur x0={110} x1={230} />
        <g transform="translate(140 118) scale(1.4)">
          <St_Paper x={0} y={0} lines={1} />
        </g>
        <Person who="nasib" x={80} y={150} facing={1} arm={k >= 1 ? "point" : "hold"} label />
        {k >= 1 && <path d="M130 150L206 116" stroke="#a16207" strokeWidth={2.2} strokeLinecap="round" className={FADE} />}
        <Person who="som" x={262} y={150} facing={-1} label />
        {k >= 1 && <Bubble x={80} y={84} side="right" lines={["দুইটা দামও তো", "মিলতে পারে।"]} />}
        {k >= 2 && <Bubble x={262} y={84} side="left" tone="think" lines={["দুই জায়গায় কাটবে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · The দইওয়ালা at the gate with his বাঁক। His two রসিদ are wet too.

export function DoiwalaGate({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="গেট দিয়ে দইওয়ালা ঢুকলেন, কাঁধে বাঁক, দুই পাশে দইয়ের হাঁড়ি; মামা তার দুইটা রসিদ হাতে নিলেন">
        <St_House />
        <Person who="mama" x={80} y={150} facing={1} arm={k >= 2 ? "hold" : "down"} label />
        <Doiwala x={k >= 1 ? 190 : 290} y={150} facing={-1} />
        {k >= 2 && (
          <g className={POP}>
            <St_Slip x={98} y={104} tilt={-6} />
            <St_Slip x={104} y={108} tilt={5} />
          </g>
        )}
        {k >= 2 && <Bubble x={190} y={84} side="left" lines={["টক আর মিষ্টি,", "দুই হাঁড়ির দাম।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · মামা counts notes into the বাবুর্চি's hand; the বাবুর্চি folds them
//      into his ফতুয়ার পকেট।

export function NotesCounted({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const notes = Math.min(k, 2) * 3 + 1;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামা বাবুর্চির হাতে একটা একটা করে নোট গুনে দিলেন; বাবুর্চি নোট ভাঁজ করে ফতুয়ার পকেটে রাখলেন">
        <St_Sun x={290} y={24} />
        <St_House />
        <Person who="mama" x={120} y={150} facing={1} arm="hold" label />
        <Baburchi x={190} y={150} facing={-1} arm={k >= 3 ? "down" : "hold"} />
        {k < 3 &&
          Array.from({ length: notes }, (_, i) => (
            <rect key={i} x={146 + i * 1.6} y={104 - i * 1.2} width={14} height={7} rx={1} fill="#86efac" stroke="#15803d" strokeWidth={0.5} className={POP} />
          ))}
        {k >= 3 && <rect x={184} y={118} width={9} height={5} rx={1} fill="#86efac" stroke="#15803d" strokeWidth={0.5} className={POP} />}
        {k >= 3 && <Bubble x={190} y={84} side="left" lines={["হিসাব মিললো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9b · The bridge to 10.2. The ময়রা at the gate with his রসিদ বই। Every page
//      ভেজা: the quantities read, the মোট smudged.

export function MoyraGate({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বাবুর্চি বের হলেন; ঢুকলো ময়রা, হাতে রসিদ বই; সব পাতা ভেজা, মোটের জায়গা ধোয়া; বললো, মোট মিলামু দোকানে গিয়া, জোহরের পরে; মামা বললেন, কোন পাতায় কাজ হবে, এখনই জানতে চাই">
        <St_House />
        <Person who="mama" x={70} y={150} facing={1} label arm={k >= 3 ? "point" : "down"} />
        {k < 1 && <Baburchi x={200} y={150} facing={1} />}
        {k >= 1 && <Moyra x={220} y={150} facing={-1} arm="hold" />}
        {k >= 1 && (
          <g className={POP}>
            <rect x={196} y={100} width={18} height={14} rx={1} fill="#fef3c7" stroke="#a16207" strokeWidth={0.8} />
            <ellipse cx={206} cy={110} rx={5} ry={2.5} fill="#93c5fd" opacity={0.85} />
          </g>
        )}
        {k === 2 && <Bubble x={220} y={84} side="left" lines={["মোট মিলামু দোকানে গিয়া,", "জোহরের পরে।"]} />}
        {k >= 3 && <Bubble x={70} y={84} side="right" lines={["কোন পাতায় কাজ হবে,", "এখনই জানতে চাই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · The smudged page. The prices washed off; the folded রসিদ survived
//      (counts and মোট); both prices "?"; a graph paper instead of sums.

const X1B_SAY = [
  "মামার খাতার এই পাতায় দাম লেখা ছিলো। এক ডেকচি পোলাও কত, এক ডেকচি রোস্ট কত। বৃষ্টিতে কালি ধুয়ে গেছে।",
  "রসিদ গুলো ভাঁজ করা ছিলো, তাই বেঁচে গেছে। প্রতিটায় কয় ডেকচি, আর মোট কত টাকা।",
  "দাম দুইটাই অজানা। রসিদে শুধু মোট।",
  "বড় ক্লাসে এই অঙ্ক কষে বের করে। আমরা কষবো না। আঁকবো।",
];

export function SmudgedPage() {
  const s = useScene(3, [600, 2200, 2000, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <svg viewBox="0 0 240 110" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="মামার খাতার পাতা, দাম ধোয়া; নিচে ছয়টা রসিদ; দামের জায়গায় প্রশ্নবোধক; শেষে একটা graph কাগজ">
        <rect x={4} y={4} width={140} height={50} rx={3} fill="#fefce8" stroke="#a16207" strokeWidth={0.8} />
        <text x={10} y={22} fontSize={9} fontWeight={600} fill={INK}>
          পোলাও, এক ডেকচি
        </text>
        <text x={10} y={42} fontSize={9} fontWeight={600} fill={INK}>
          রোস্ট, এক ডেকচি
        </text>
        {[18, 38].map((y) =>
          k === 2 ? (
            <text key={y} x={112} y={y + 5} fontSize={15} fontWeight={800} fill="#2563eb" className={POP}>
              ?
            </text>
          ) : (
            <ellipse key={y} cx={116} cy={y} rx={14} ry={6} fill="#93c5fd" opacity={0.8} />
          ),
        )}
        {k >= 1 &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 120}ms` }}>
              <rect x={8 + i * 22 + Math.floor(i / 2) * 6} y={66} width={18} height={26} rx={1.5} fill="white" stroke={i % 2 ? R_COL[1] : R_COL[0]} strokeWidth={0.8} />
              <path d={`M${11 + i * 22 + Math.floor(i / 2) * 6} 72h12M${11 + i * 22 + Math.floor(i / 2) * 6} 77h10M${11 + i * 22 + Math.floor(i / 2) * 6} 86h12`} stroke="#475569" strokeWidth={0.7} />
            </g>
          ))}
        {k >= 1 &&
          ["হলুদ", "বিয়ে", "ফিরানি"].map((d, i) => (
            <text key={d} x={28 + i * 50} y={104} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK} className={FADE}>
              {d}
            </text>
          ))}
        {k >= 3 && (
          <g className={POP}>
            <rect x={160} y={10} width={74} height={80} fill="white" stroke="#94a3b8" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <path key={i} d={`M${160 + i * 10.5} 10v80M160 ${10 + i * 11.4}h74`} stroke="#bfdbfe" strokeWidth={0.5} />
            ))}
            <path d="M166 14V84H230" stroke={INK} strokeWidth={1} fill="none" />
            <circle cx={196} cy={56} r={3.5} fill="#7c3aed" />
            <text x={202} y={52} fontSize={10} fontWeight={800} fill="#2563eb">
              ?
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Pins to a line. The five pins; a কঞ্চি laid across them; between the
//     pins, half prices light too (2500 টাকা); the whole line is the রসিদ।

const X2B_F = makeFrame(0, 5, 0, 8, 15, 12); // 99 × 144
const X2B_SAY = [
  "এই পাঁচটা দামে বাতি জ্বলেছিলো।",
  "একটা কঞ্চি রাখলে পাঁচটাই তার গায়ে পড়ে। সোজা এক লাইন।",
  "মাঝেও জ্বলে। পোলাও আড়াই হাজার, রোস্ট তিন হাজার: দুই ডেকচি পোলাও 5 হাজার, রোস্ট 3, মোট 8।",
  "লাইনের প্রতিটা বিন্দু একটা দাম, যেটা এই রসিদ মেনে নেয়।",
];

export function PinsToLine() {
  const s = useScene(3, [600, 1800, 2400, 2200]);
  const k = s.k;
  const f = X2B_F;
  const mids: XY[] = [
    [2.5, 3],
    [0.5, 7],
    [3.5, 1],
  ];
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <div className="mx-auto w-[7rem]">
        <Plane f={f} ticks={0} label="হলুদের রসিদ 1 এর পাঁচটা pin; তাদের উপর একটা লাইন; মাঝের দামেও বাতি জ্বলে" className="my-0! max-w-none">
          {k >= 1 && <ReceiptLine f={f} rec={H1} color={k >= 3 ? R_COL[0] : "#a16207"} width={k >= 3 ? 3 : 2} />}
          {spotsOn(H1, f).map((p) => (
            <Pin key={keyOf(p)} f={f} at={p} cols={[R_COL[0]]} />
          ))}
          {k >= 2 &&
            mids.map((p) => (
              <g key={keyOf(p)} className={POP}>
                <circle cx={f.sx(p[0])} cy={f.sy(p[1])} r={5} fill={LAMP} opacity={0.6} />
                <circle cx={f.sx(p[0])} cy={f.sy(p[1])} r={2.4} fill={LAMP} stroke="#a16207" strokeWidth={0.7} />
              </g>
            ))}
        </Plane>
      </div>
    </Scene>
  );
}

// 3½ · Both at once. The two হলুদের রসিদ with a brace; each line in turn; the
//     crossing lights with both lamps.

const X3B_SAY = [
  "হলুদের দুই রসিদ। বইয়ে দুইটার সামনে একটা বাঁকা বন্ধনী দেয়: দুইটাই একসাথে সত্যি।",
  "প্রথম রসিদের লাইন।",
  "দ্বিতীয় রসিদের লাইন।",
  "একসাথে সত্যি শুধু কাটার জায়গায়: পোলাও 3 হাজার, রোস্ট 2 হাজার।",
];

export function BraceBoth() {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  const f = makeFrame(0, 7, 0, 8, 12, 10);
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <div className="mx-auto flex max-w-[16rem] items-center justify-center gap-2">
        <div className="flex items-center gap-1">
          <svg viewBox="0 0 12 60" width={10} height={50} aria-hidden="true">
            <path d="M10 2Q4 2 4 10V24Q4 30 1 30Q4 30 4 36V50Q4 58 10 58" fill="none" stroke={INK} strokeWidth={1.4} />
          </svg>
          <div className="flex w-[7rem] flex-col gap-1">
            <Slip rec={H1} color={R_COL[0]} />
            <Slip rec={H2} color={R_COL[1]} />
          </div>
        </div>
        <div className="w-[6.3rem] shrink-0">
          <Plane f={f} ticks={0} label="দুই রসিদের দুই লাইন, কাটার জায়গায় আলো" className="my-0! max-w-none">
            {k >= 1 && <ReceiptLine f={f} rec={H1} color={R_COL[0]} />}
            {k >= 2 && <ReceiptLine f={f} rec={H2} color={R_COL[1]} />}
            {k >= 3 && <Pin f={f} at={[3, 2]} cols={[R_COL[0], R_COL[1]]} />}
          </Plane>
        </div>
      </div>
    </Scene>
  );
}

// 4½ · The night's রসিদ is the day's, twice. Its bar is two copies of the
//      first; at any price, one reaches 5 and the other 10 together.

const X4B_SAY = [
  "দুপুরের রসিদ: এক পোলাও, এক রোস্ট, মোট 5 হাজার।",
  "রাতের রসিদ ঠিক দুপুরের দুই গুণ। দুইবার এক পোলাও এক রোস্ট, দুইবার 5 হাজার।",
  "দাম বদলালেও একই। দুপুরেরটা মিললে রাতেরটা আপনা আপনি মিলে।",
];
const X4B_PRICES: XY[] = [
  [2, 3],
  [2, 3],
  [4, 1],
];

export function DoubleReceipt() {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  const p = X4B_PRICES[k];
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <div className="mx-auto grid w-full max-w-[20rem] grid-cols-2 items-start gap-1.5">
        <ReceiptCard rec={B1} color={R_COL[0]} price={p} />
        {k >= 1 && (
          <div className={FADE}>
            <ReceiptCard rec={B2} color={R_COL[1]} price={p} />
          </div>
        )}
      </div>
    </Scene>
  );
}

// 5½ · Same slant, different মোট। At any price the second ফিরানির pile is
//      twice the first. When the first reaches 5, the second is at 10, short
//      of 12; push it to 12 and the first overshoots.

const X5B_SAY = [
  "প্রথম রসিদ মিললো: মোট 5। দ্বিতীয়টার টাকা তখন 10, রসিদে 12।",
  "অন্য দামেও একই। প্রথমটা মিললে দ্বিতীয়টা 2 হাজার কম।",
  "দ্বিতীয়টা মেলালাম, 12। এবার প্রথমটা 6, এক হাজার বেশি।",
];
const X5B_PRICES: XY[] = [
  [1, 4],
  [4, 1],
  [3, 3],
];

export function SameSlant() {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  const p = X5B_PRICES[k];
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <div className="mx-auto grid w-full max-w-[20rem] grid-cols-2 items-start gap-1.5">
        <ReceiptCard rec={F1} color={R_COL[0]} price={p} />
        <ReceiptCard rec={F2} color={R_COL[1]} price={p} />
      </div>
    </Scene>
  );
}

// 6½a · Two pins fix a কঞ্চি। Laid through the first pin it can point any
//       way; through both, only one.

const X6A_SAY = [
  "দুইটা pin।",
  "প্রথম pin দিয়ে কঞ্চি নানা দিকে রাখা যায়।",
  "এই দিকেও।",
  "দুইটা pin দিয়েই যেতে হলে কঞ্চি পড়ে একভাবে। আর কোনোভাবে না।",
];

export function TwoPinsOneLine() {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  const A: XY = [50, 80];
  const B: XY = [150, 40];
  const ang = [0, -5, -40, (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI][k];
  return (
    <Scene scene={s} caption={say(X6A_SAY, k)}>
      <svg viewBox="0 0 200 110" className="mx-auto block h-auto w-full max-w-[13rem]" role="img" aria-label="দুইটা pin; একটা কঞ্চি প্রথম pin ঘিরে ঘোরে; দুই pin দিয়ে যায় একভাবেই">
        <rect x={1} y={1} width={198} height={108} rx={4} fill="white" stroke="#cbd5e1" />
        {k >= 1 && (
          <g style={{ transform: `translate(${A[0]}px, ${A[1]}px) rotate(${ang}deg)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
            <path d="M-45 0H170" stroke="#a16207" strokeWidth={3} strokeLinecap="round" />
          </g>
        )}
        {[A, B].map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={5} fill={k >= 3 ? LAMP : R_COL[0]} stroke="white" strokeWidth={1.2} />
          </g>
        ))}
      </svg>
    </Scene>
  );
}

// 6½b · The three pictures (the book's Fig 4.19), the table as captions.

const X6B_SAY = ["কাটে একবার: এক দাম।", "পাশাপাশি, কখনো কাটে না: কোনো দাম না।", "একটার উপর আরেকটা: অসীম দাম, লাইন ভরা।", "দুই সোজা লাইনের আর কোনো উপায় নাই।"];
const X6B_F = makeFrame(0, 6, 0, 6, 9, 6);
const X6B_PAIRS: [Rec, Rec][] = [
  [
    { name: "", a: 1, b: 1, c: 4 },
    { name: "", a: 1, b: -1, c: 0 },
  ],
  [
    { name: "", a: 1, b: 1, c: 3 },
    { name: "", a: 1, b: 1, c: 5 },
  ],
  [
    { name: "", a: 1, b: 1, c: 4 },
    { name: "", a: 2, b: 2, c: 8 },
  ],
];

export function ThreeWays() {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  const f = X6B_F;
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <div className="mx-auto grid max-w-[16rem] grid-cols-3 gap-2">
        {X6B_PAIRS.map((pr, i) => (
          <div key={i} className={`flex flex-col items-center gap-0.5 ${k === i + 1 || k === 3 ? "" : "opacity-40"} transition-opacity duration-500 motion-reduce:transition-none`}>
            <Plane f={f} ticks={0} axes label={["এক জায়গায় কাটা দুই লাইন", "পাশাপাশি দুই লাইন", "একটার উপর আরেকটা"][i]} className="my-0! max-w-none">
              {k > i && (
                <>
                  {i === 2 && <ReceiptLine f={f} rec={pr[0]} color={LAMP} width={7} />}
                  <ReceiptLine f={f} rec={pr[0]} color={R_COL[0]} width={2.2} />
                  <ReceiptLine f={f} rec={pr[1]} color={R_COL[1]} width={1.4} />
                  {i === 0 && <Pin f={f} at={[2, 2]} cols={[R_COL[0], R_COL[1]]} />}
                </>
              )}
            </Plane>
            <span className="text-center text-[0.7rem] leading-tight font-semibold">{["এক দাম", "দাম নাই", "অসীম দাম"][i]}</span>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  PairBet: { start: {}, ticked: { ticked: [0, 1] }, sealed: { ticked: [0, 2], sealed: true } },
  OneReceipt: { start: {}, off: { dot: [4, 3] }, two: { dot: [2, 4], pins: ["1,6", "2,4"] }, done: { dot: [4, 0], pins: ["1,6", "2,4", "3,2", "4,0"] } },
  TwoReceipts: { start: {}, one: { dot: [2, 4] }, found: { dot: [3, 2], found: true } },
  CopyReceipt: { start: {}, ran: { guess: 0, ran: true } },
  WrongReceipt: { start: {}, some: { dot: [3, 3], p1: ["1,4", "2,3"], p2: ["3,3"] }, shown: { dot: [3, 3], p1: ["1,4", "2,3", "0,5"], p2: ["3,3", "4,2", "6,0"], shown: true } },
  OnlyThree: {
    start: {},
    parallel: { h: [[0, 6], [6, 0]], seen: [0, 1] },
    top: { h: [[1, 4], [4, 1]], seen: [0, 1, 2] },
  },
  YourPair: { start: {}, one: { dot: [5, 2] }, both: { dot: [2, 3], both: true }, wrong: { dot: [2, 3], both: true, pick: 2 }, right: { dot: [2, 3], both: true, pick: 0 } },
  TryWhich: { start: {}, wrong: { pick: 0 }, second: { idx: 1 }, third: { idx: 2, pick: 1 } },
  BetOpen: { start: {}, holud: { open: [0], cur: 0 }, firani: { open: [0, 1, 2], cur: 2 }, biye: { open: [0, 1], cur: 1 } },
  MorningKhata: { rest: { k: 0 }, peel: { k: 1 }, done: {} },
  FahimPaper: { rest: { k: 0 }, done: {} },
  SaminReads: { done: {} },
  BiyePair: { day: { k: 1 }, night: { k: 2 }, done: {} },
  BoyBrings: { done: {} },
  BoyScratches: { rest: { k: 0 }, done: {} },
  NasibTwo: { done: {} },
  DoiwalaGate: { done: {} },
  NotesCounted: { mid: { k: 2 }, done: {} },
  MoyraGate: { moyra: { k: 2 }, done: {} },
  SmudgedPage: { rest: { k: 0 }, slips: { k: 1 }, q: { k: 2 }, done: {} },
  PinsToLine: { rest: { k: 0 }, mid: { k: 2 }, done: {} },
  BraceBoth: { rest: { k: 0 }, done: {} },
  DoubleReceipt: { rest: { k: 0 }, done: {} },
  SameSlant: { rest: { k: 0 }, done: {} },
  TwoPinsOneLine: { turn: { k: 2 }, done: {} },
  ThreeWays: { one: { k: 1 }, done: {} },
};
