"use client";

import { useMemo, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, POP, Ticks, pill, predictLook, primaryBtn, quietBtn, usePlay, useSeed, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, makeFrame, type XY } from "@/components/journey/plane";
import { bn } from "./figure-kit";

// Screens for "Math for AI 2.7 — অনেক dimension-এর তিনটা চমক".
//
// Three surprises of high dimensions, each found the same way: play a rule
// small enough to count by hand, spot the pattern, predict the big case, and
// only then see it. Written for a reader of twelve.
//
//   1 · Distances bunch up. Friends roll one die each and the totals are all
//       over the place; with a hundred dice each they all land near the same
//       total, because highs and lows cancel. A distance is such a sum too
//       (one "die" per column), so from any point the rest end up about
//       equally far.
//   2 · Random directions are nearly at 90°. An arrow is made of coin flips,
//       +1 or −1 per box. In 2D the reader finds the rule by hand: two
//       matches is 0°, one match and one miss is 90°, no matches is 180°.
//       With many coins matches and misses come out about even, so the needle
//       settles at 90°.
//   3 · Almost everything is on the skin. Peel the outer layer of a row of
//       ten tiles, a 10 × 10 floor, a 10 × 10 × 10 block of sugar cubes:
//       inside keeps 8 of every 10 per direction, 80% → 64% → 51%, and every
//       new direction multiplies by 0.8 again, like one more exam everyone
//       has to pass. The ball's dots crowd to its skin for the same reason.
//
// Tailwind only. Dice, coins and tiles are drawn objects with fixed ink.

/** mulberry32: the same "random" rolls on every visit */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const percent = (x: number) => {
  const p = x * 100;
  if (p >= 99.95) return "প্রায় 100%";
  if (p < 0.01) return "প্রায় 0%";
  return `${p < 10 ? p.toFixed(1) : Math.round(p)}%`;
};
const INK = "fill-[#0f1b2d]";

// ---------------------------------------------------------------------------
// Dice.

const FRIENDS = ["সোম", "সামিন", "ফাহিম", "নাসিব", "মিতু", "রাফি"];
const PIPS: Record<number, XY[]> = {
  1: [[0, 0]],
  2: [
    [-1, -1],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  4: [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  5: [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  6: [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
};

function DieFace({ v, size = 30 }: { v: number | null; size?: number }) {
  return (
    <svg viewBox="-12 -12 24 24" width={size} height={size} aria-label={v === null ? "ছক্কা" : `${v}`} className="shrink-0">
      <rect x={-11} y={-11} width={22} height={22} rx={5} strokeWidth={1.2} className="fill-white stroke-[#0f1b2d]/40" />
      {v === null ? (
        <text y={4} textAnchor="middle" fontSize={11} fontWeight={700} className={INK}>
          ?
        </text>
      ) : (
        PIPS[v].map(([x, y], i) => <circle key={i} cx={x * 5.5} cy={y * 5.5} r={2.2} className={INK} />)
      )}
    </svg>
  );
}

/** every friend's dice for one roll */
function rollAll(seed: number, count: number) {
  const r = rng(seed);
  return FRIENDS.map(() => Array.from({ length: count }, () => 1 + Math.floor(r() * 6)));
}

/** one bar per friend, as a share of the biggest total possible */
function TotalBars({ totals, most, marks }: { totals: number[]; most: number; marks: boolean }) {
  const lo = Math.min(...totals);
  const hi = Math.max(...totals);
  return (
    <div className="mx-auto grid max-w-md gap-1.5">
      {totals.map((t, i) => {
        const tone = marks && t === lo ? "bg-cat-coral" : marks && t === hi ? "bg-cat-teal" : "bg-cat-blue/60";
        return (
          <div key={FRIENDS[i]} className="grid grid-cols-[3.2rem_1fr_2.6rem] items-center gap-2 text-sm">
            <span className="truncate text-right">{FRIENDS[i]}</span>
            <span className="h-4 overflow-hidden rounded-full bg-foreground/5">
              <span style={{ width: `${(t / most) * 100}%` }} className={`block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${tone}`} />
            </span>
            <span className="font-mono tabular-nums">{t}</span>
          </div>
        );
      })}
    </div>
  );
}

/** "সোম", "সোম আর মিতু", "সোম, মিতু আর রাফি": everyone who got v */
function who(totals: number[], v: number) {
  const names = FRIENDS.filter((_, i) => totals[i] === v);
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} আর ${names[names.length - 1]}`;
}

/** who got the least and the most, and how close the two came */
function Spread({ totals }: { totals: number[] }) {
  const lo = Math.min(...totals);
  const hi = Math.max(...totals);
  const pct = Math.round((lo / hi) * 100);
  if (lo === hi) return <div className="mt-2 text-center text-[0.95rem]">সবাই পেল একই, {lo}! এমন কাকতাল রোজ রোজ হয় না।</div>;
  return (
    <div className="mt-2 text-center text-[0.95rem]">
      সবচেয়ে কম পেল {who(totals, lo)}, <b className="text-cat-coral">{lo}</b>। সবচেয়ে বেশি পেল {who(totals, hi)}, <b className="text-cat-teal">{hi}</b>।
      <div className="mt-0.5 text-sm text-muted">
        {pct < 50 ? `${lo} হলো ${hi}-এর মাত্র ${pct}%, বিস্তর ফারাক।` : pct < 80 ? `${lo} হলো ${hi}-এর ${pct}%।` : `${lo} হলো ${hi}-এর ${pct}%, প্রায় কাছাকাছি!`}
      </div>
    </div>
  );
}

// 1a · One die each. Totals are all over the place.

export function DiceOne() {
  const pass = useGate();
  const [roll, setRoll] = useSeed("roll", 0);
  const spin = usePlay(70);
  const settled = roll > 0 && !spin.running;
  const faces = rollAll(roll * 131 + 5, 1).map((d) => d[0]);
  const blur = rollAll(roll * 131 + 1000 + spin.k, 1).map((d) => d[0]);

  const go = () => {
    const n = roll + 1;
    setRoll(n);
    spin.play(8, () => {
      if (n === 3) pass("একটা করে ছক্কায় কারো ভাগ্যে 1, কারো 6। তাই কে কত পেল, তাতে বিস্তর ফারাক।");
    });
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {FRIENDS.map((name, i) => (
          <div key={name} className="flex flex-col items-center gap-1 text-sm">
            <DieFace v={roll === 0 ? null : spin.running ? blur[i] : faces[i]} size={36} />
            {name}
          </div>
        ))}
      </div>
      <div className="mt-4 min-h-40">
        {settled && (
          <>
            <TotalBars totals={faces} most={6} marks />
            <div key={roll} className={FADE}>
              <Spread totals={faces} />
            </div>
          </>
        )}
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={go} disabled={spin.running} className={primaryBtn}>
          {roll === 0 ? "সবাই ছক্কা চালো!" : `আবার চালো (এ পর্যন্ত ${bn(roll)} বার)`}
        </button>
      </div>
      <Task done={roll >= 3 && settled}>সবাইকে দিয়ে তিনবার ছক্কা চালান। খেয়াল করুন, সবচেয়ে কম আর সবচেয়ে বেশির মধ্যে ফারাক কতটা।</Task>
    </>
  );
}

// 1b · Many dice each. Predict, then watch the totals huddle.

const DICE_COUNTS = [1, 3, 10, 100];
const MANY_GUESS = ["ফারাক আরও বাড়বে, কেউ অনেক বেশি, কেউ অনেক কম", "সবার যোগফল প্রায় কাছাকাছি চলে আসবে", "আগের মতোই এলোমেলো থাকবে"];

export function DiceMany() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ci, setCi] = useSeed("ci", 0);
  const [roll, setRoll] = useSeed("roll", 0);
  const [hit, setHit] = useSeed("hit", false);
  const count = DICE_COUNTS[ci];
  const dice = useMemo(() => rollAll(777 + roll * 31 + count * 7, count), [roll, count]);
  const totals = dice.map((d) => d.reduce((s, x) => s + x, 0));
  const mine = dice[0];
  const low = mine.filter((x) => x <= 2).length;
  const high = mine.filter((x) => x >= 5).length;
  const mineSay =
    Math.abs(low - high) <= count * 0.1
      ? "প্রায় সমান সমান, তাই একটা বড় এসে একটা ছোটকে পুষিয়ে দেয়।"
      : low > high
        ? "এবার ছোটর পাল্লা ভারী, তাই সোমের যোগফল একটু কমের দিকে।"
        : "এবার বড়র পাল্লা ভারী, তাই সোমের যোগফল একটু বেশির দিকে।";

  const pick = (i: number) => {
    setCi(i);
    if (!hit && DICE_COUNTS[i] === 100) {
      setHit(true);
      pass("ছক্কা যত বেশি, বড় আর ছোট তত কাটাকাটি হয়ে যায়। তাই শেষমেশ সবার যোগফল প্রায় একই জায়গায়।");
    }
  };

  return (
    <>
      <div className="mt-5 text-sm font-medium text-muted">প্রত্যেকে 100টা করে ছক্কা চেলে যোগ করলে, সবার যোগফল কেমন হবে বলে মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {MANY_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, hit, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={FADE}>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted">প্রত্যেকে কয়টা করে ছক্কা চালবে?</span>
            {DICE_COUNTS.map((c, i) => (
              <button key={c} type="button" aria-pressed={i === ci} onClick={() => pick(i)} className={pill(i === ci)}>
                {c}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <TotalBars totals={totals} most={6 * count} marks />
            <div className="mt-1 text-center text-xs text-muted">দাগ পুরোটা ভরা মানে সবগুলো ছক্কায় 6 পড়েছে।</div>
            <div key={`${count}-${roll}`} className={FADE}>
              <Spread totals={totals} />
            </div>
          </div>
          {count >= 10 && (
            <div className={`${FADE} mx-auto mt-4 max-w-md rounded-2xl border border-border px-3 py-3`}>
              <div className="text-center text-sm">
                সোমের {bn(count)}টা ছক্কা। <span className="text-cat-coral">লালগুলোতে ছোট সংখ্যা (1 বা 2)</span>, <span className="text-cat-teal">সবুজগুলোতে বড় (5 বা 6)</span>।
              </div>
              <div className="mx-auto mt-2 flex max-w-[16rem] flex-wrap justify-center gap-[3px]">
                {mine.map((x, i) => (
                  <span key={i} className={`size-2.5 rounded-sm ${x <= 2 ? "bg-cat-coral" : x >= 5 ? "bg-cat-teal" : "bg-foreground/15"}`} />
                ))}
              </div>
              <div key={`${count}-${roll}`} className={`${FADE} mt-2 text-center text-sm`}>
                ছোট পড়েছে <b className="text-cat-coral">{bn(low)}</b>টা, বড় <b className="text-cat-teal">{bn(high)}</b>টা। {mineSay}
              </div>
            </div>
          )}
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={() => setRoll(roll + 1)} className={quietBtn}>
              আবার চালুন
            </button>
          </div>
        </div>
      )}
      <Task done={hit}>আগে একটা guess দিন। তারপর ছক্কা 1 থেকে বাড়াতে বাড়াতে 100-তে নিয়ে যান।</Task>
    </>
  );
}

// 1c · A distance is such a sum too: one "die" per column. From one random
//      point, the distance to every other, on a line scaled to the farthest.

const BUNCH_NS = [2, 3, 10, 30, 100, 300, 1000];
const BUNCH_COUNT = 150;
const BUNCH_GUESS = ["আরও ছড়িয়ে যাবে, কেউ খুব কাছে আর কেউ অনেক দূরে", "সবাই কাছাকাছি চলে আসবে"];
const bunchCache = new Map<number, number[]>();
function spread(n: number) {
  const hit = bunchCache.get(n);
  if (hit) return hit;
  const r = rng(1234 + n);
  const pts = Array.from({ length: BUNCH_COUNT }, () => Array.from({ length: n }, r));
  const q = pts[0];
  const ds = pts.slice(1).map((p) => Math.sqrt(p.reduce((s, x, i) => s + (x - q[i]) ** 2, 0)));
  bunchCache.set(n, ds);
  return ds;
}
const SX0 = 16;
const SX1 = 304;

export function DotsBunch() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ni, setNi] = useSeed("ni", 0);
  const [reached, setReached] = useSeed("reached", false);
  const n = BUNCH_NS[ni];
  const ds = useMemo(() => spread(n), [n]);
  const max = Math.max(...ds);
  const ratio = Math.min(...ds) / max;

  const pick = (i: number) => {
    setNi(i);
    if (!reached && BUNCH_NS[i] >= 300) {
      setReached(true);
      pass("ঠিক ছক্কার মতো! ঘর যত বেশি, তফাতগুলো তত কাটাকাটি, আর সবাই প্রায় সমান দূরে। “সবচেয়ে কাছের” কথাটার জোর কমে যায়।");
    }
  };
  const pct = Math.round(ratio * 100);

  return (
    <>
      <div className="mt-5 text-sm font-medium text-muted">Dimension যত বাড়বে, একটা point থেকে বাকিদের দূরত্বের কী হবে বলে মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {BUNCH_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, reached, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={FADE}>
          <div className="mt-5 text-center text-sm text-muted">এলোমেলো {bn(BUNCH_COUNT)}টা point নিলাম। একটা point থেকে বাকি সবাই কত দূরে, সেটা দাগের ওপর বসানো আছে।</div>
          <svg viewBox="0 0 320 96" role="img" aria-label={`distances in ${n} dimensions, nearest ${Math.round(ratio * 100)} percent of farthest`} className="mx-auto mt-2 block h-auto w-full max-w-md select-none">
            <path d={`M${SX0} 50H${SX1}`} strokeWidth={1.5} className="stroke-foreground/30" />
            <text x={SX0} y={80} fontSize={9} className="fill-muted">
              0
            </text>
            <text x={SX1} y={80} textAnchor="end" fontSize={9} className="fill-muted">
              সবচেয়ে দূরেরটা
            </text>
            <rect
              x={SX0 + ratio * (SX1 - SX0)}
              y={34}
              width={(1 - ratio) * (SX1 - SX0)}
              height={32}
              rx={6}
              className="fill-cat-amber/15 transition-[x,width] duration-700 motion-reduce:transition-none"
            />
            {ds.map((d, i) => (
              <circle
                key={i}
                r={3.2}
                style={{ transform: `translate(${SX0 + (d / max) * (SX1 - SX0)}px, ${50 + ((i % 7) - 3) * 3.4}px)` }}
                className="fill-cat-blue/70 transition-transform duration-700 ease-out motion-reduce:transition-none"
              />
            ))}
            <text x={Math.min(Math.max(SX0 + ratio * (SX1 - SX0), SX0 + 34), SX1 - 34)} y={24} textAnchor="middle" fontSize={9} fontWeight={600} className="fill-cat-amber">
              সবচেয়ে কাছেরটা
            </text>
          </svg>
          <div className="text-center">
            <div className="font-mono text-2xl font-bold">
              n = <span key={n} className={`${POP} inline-block`}>{n}</span>
            </div>
            <div key={n} className={`${FADE} mt-1 text-[0.95rem]`}>
              {pct < 30 ? "সবচেয়ে কাছের point-টা আছে সবচেয়ে দূরেরটার মাত্র " : "সবচেয়ে কাছেরটাও সবচেয়ে দূরেরটার "}
              <b className="font-mono">{pct}%</b> দূরে।
              <div className="text-sm text-muted">
                {pct < 30 ? "কে কাছে আর কে দূরে, একদম স্পষ্ট।" : pct < 60 ? "ফারাকটা কমে আসছে।" : pct < 80 ? "কাছে আর দূরে এখন প্রায় গায়ে গায়ে।" : "কে কাছে আর কে দূরে, বোঝাই মুশকিল!"}
              </div>
            </div>
          </div>
          <label className="mx-auto mt-4 flex max-w-sm items-center gap-3">
            <span className="shrink-0 text-sm text-muted">dimension</span>
            <input
              type="range"
              min={0}
              max={BUNCH_NS.length - 1}
              value={ni}
              aria-label="dimension"
              onChange={(e) => pick(Number(e.target.value))}
              className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
            />
          </label>
        </div>
      )}
      <Task done={reached}>আগে একটা guess দিন। তারপর slider টেনে dimension বাড়াতে থাকুন, অন্তত 300 পর্যন্ত।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Coins.

type Pair = [number, number];
const FC = makeFrame(-1.6, 1.6, -1.6, 1.6, 64);
/** the angle between two coin arrows in 2D, from matches: 2 → 0°, 1 → 90°, 0 → 180° */
const angle2 = (a: Pair, b: Pair) => Math.round((Math.acos((a[0] * b[0] + a[1] * b[1]) / 2) * 180) / Math.PI);
const RULE: { m: number; deg: number }[] = [
  { m: 2, deg: 0 },
  { m: 1, deg: 90 },
  { m: 0, deg: 180 },
];

function Coin({ v, tone, onClick, label }: { v: number; tone: "blue" | "coral"; onClick: () => void; label: string }) {
  const ring = tone === "blue" ? "border-cat-blue text-cat-blue" : "border-cat-coral text-cat-coral";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid size-11 cursor-pointer place-items-center rounded-full border-[3px] bg-[#fef3c7] font-mono text-sm font-bold transition-transform active:scale-90 ${ring}`}
    >
      <span key={v} className={`${POP} inline-block`}>
        {v > 0 ? "H" : "T"}
      </span>
    </button>
  );
}

/** the little arc between two directions, with its size in degrees */
function AngleArc({ f, a, b, deg }: { f: Frame2; a: Pair; b: Pair; deg: number }) {
  if (deg === 0) return null;
  const ta = Math.atan2(a[1], a[0]);
  let d = Math.atan2(b[1], b[0]) - ta;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  const r = 0.42;
  const p = (t: number): XY => [f.sx(r * Math.cos(t)), f.sy(r * Math.sin(t))];
  const [x1, y1] = p(ta);
  const [x2, y2] = p(ta + d);
  const mid = ta + d / 2;
  return (
    <g className="pointer-events-none">
      <path d={`M${x1} ${y1}A${r * f.u} ${r * f.u} 0 0 ${d > 0 ? 0 : 1} ${x2} ${y2}`} strokeWidth={2} className="fill-none stroke-cat-violet" />
      <text x={f.sx(0.72 * Math.cos(mid))} y={f.sy(0.72 * Math.sin(mid)) + 4} textAnchor="middle" fontSize={12} fontWeight={800} strokeWidth={3} className="fill-cat-violet stroke-white [paint-order:stroke]">
        {deg}°
      </text>
    </g>
  );
}
type Frame2 = typeof FC;

// 2a · Two coins per arrow, in 2D: find the rule by hand.

export function CoinArrows() {
  const pass = useGate();
  const [a, setA] = useSeed<Pair>("a", [1, 1]);
  const [b, setB] = useSeed<Pair>("b", [-1, 1]);
  const [tosses, setTosses] = useSeed("tosses", 0);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const deg = angle2(a, b);
  const matches = (a[0] === b[0] ? 1 : 0) + (a[1] === b[1] ? 1 : 0);

  const show = (na: Pair, nb: Pair) => {
    setA(na);
    setB(nb);
    const g = angle2(na, nb);
    if (seen.includes(g)) return;
    const next = [...seen, g];
    setSeen(next);
    if (next.length === RULE.length) pass("সব টসে দুইটা coin-এ একই জিনিস এলে arrow দুটো একই দিকে, সব বার different হলে একদম উল্টো দিকে। আর মিল-অমিল সমান সমান হলে একে অপরের সাথে লম্বালম্বি, অর্থাৎ 90 degree।।");
  };
  const toss = () => {
    const r = rng(tosses * 97 + 11);
    const c = () => (r() < 0.5 ? 1 : -1);
    setTosses(tosses + 1);
    show([c(), c()], [c(), c()]);
  };
  const flipA = (i: number) => show(i === 0 ? [-a[0], a[1]] : [a[0], -a[1]], b);
  const flipB = (i: number) => show(a, i === 0 ? [-b[0], b[1]] : [b[0], -b[1]]);

  return (
    <>
      <div className="mt-5 grid items-center gap-4 sm:grid-cols-[auto_1fr]">
        <div className="mx-auto">
          <table className="border-separate border-spacing-x-2 border-spacing-y-1.5 text-center text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th />
                <th className="font-normal">First Toss<br />ডানে/বাঁয়ে</th>
                <th className="font-normal">Second Toss<br />ওপরে/নিচে</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold text-cat-blue">নীল coin</td>
                <td>
                  <Coin v={a[0]} tone="blue" label="নীল arrow, ঘর ১ উল্টান" onClick={() => flipA(0)} />
                </td>
                <td>
                  <Coin v={a[1]} tone="blue" label="নীল arrow, ঘর ২ উল্টান" onClick={() => flipA(1)} />
                </td>
              </tr>
              <tr>
                <td className="font-semibold text-cat-coral">লাল coin</td>
                <td>
                  <Coin v={b[0]} tone="coral" label="লাল arrow, ঘর ১ উল্টান" onClick={() => flipB(0)} />
                </td>
                <td>
                  <Coin v={b[1]} tone="coral" label="লাল arrow, ঘর ২ উল্টান" onClick={() => flipB(1)} />
                </td>
              </tr>
              <tr className="text-sm font-semibold">
                <td />
                {[0, 1].map((i) => (
                  <td key={`${i}${a[i] === b[i]}`} className={`${POP} ${a[i] === b[i] ? "text-accent-text" : "text-danger"}`}>
                    {a[i] === b[i] ? "✓ মিল" : "✗ অমিল"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <Plane f={FC} label={`two arrows made of coin flips, ${deg} degrees apart`} className="max-w-[15rem]">
          <AngleArc f={FC} a={a} b={b} deg={deg} />
          <Arrow f={FC} from={[0, 0]} to={a} tone="blue" w={3} />
          <Arrow f={FC} from={[0, 0]} to={b} tone="coral" w={3} dashed={deg === 0} />
        </Plane>
      </div>
      <div key={matches} className={`${FADE} mt-1 text-center text-[0.95rem]`}>
        {matches === 2
          ? "দুই ঘরেই মিল, তাই arrow দুইটা একটার ওপর আরেকটা শুয়ে আছে।"
          : matches === 1
            ? "এক ঘরে মিল, আরেক ঘরে অমিল। Arrow দুইটা এবার কোন দিকে, দেখেছেন?"
            : "দুই ঘরেই অমিল, তাই arrow দুইটা একদম উল্টো দিকে মুখ করে আছে।"}
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={toss} className={primaryBtn}>
          চারটা coin-ই ছুড়ুন
        </button>
      </div>
      <div className="mx-auto mt-4 max-w-sm rounded-2xl border border-border px-4 py-3">
        <div className="text-center text-sm font-semibold">আপনার খুঁজে পাওয়া নিয়ম</div>
        {RULE.map((r) => {
          const found = seen.includes(r.deg);
          const now = matches === r.m;
          return (
            <div key={r.m} className={`mt-1.5 flex items-center justify-between rounded-lg px-2 py-1 font-mono text-sm ${now ? "bg-cat-violet/10" : ""}`}>
              <span className="font-sans">
                মিল {bn(r.m)}টা, অমিল {bn(2 - r.m)}টা
              </span>
              <b className={found ? "text-cat-violet" : "text-muted"}>{found ? `${r.deg}°` : "?"}</b>
            </div>
          );
        })}
      </div>
      <Task done={seen.length === RULE.length}>Coin ছুড়ে দেখুন, বা যেকোনো coin-এ tap করে উল্টে দিন। নিয়মের তিনটা ঘরই ভরাতে হবে।</Task>
    </>
  );
}

// 2b · Many coins per arrow: count matches, and read the angle off a dial.

const COIN_NS = [2, 10, 100, 1000];
const COIN_GUESS = ["প্রায় সবগুলোতেই মিল হবে", "মোটামুটি অর্ধেকে মিল, অর্ধেকে অমিল", "প্রায় কোনোটাতেই মিল হবে না"];
const DIAL_R = 92;
const DCX = 120;
const DCY = 122;

function coins(seed: number, n: number) {
  const r = rng(seed);
  const a = Array.from({ length: n }, () => (r() < 0.5 ? 1 : -1));
  const b = Array.from({ length: n }, () => (r() < 0.5 ? 1 : -1));
  const m = a.filter((x, i) => x === b[i]).length;
  return { a, b, m, deg: (Math.acos((2 * m - n) / n) * 180) / Math.PI };
}

function Dial({ deg, marks }: { deg: number; marks: number[] }) {
  const at = (d: number, r: number): XY => [DCX + r * Math.cos((d * Math.PI) / 180), DCY - r * Math.sin((d * Math.PI) / 180)];
  const t = (d: number) => {
    const [x1, y1] = at(d, DIAL_R - 6);
    const [x2, y2] = at(d, DIAL_R + 2);
    return `M${x1} ${y1}L${x2} ${y2}`;
  };
  return (
    <svg viewBox="0 0 240 156" role="img" aria-label={`angle ${Math.round(deg)} degrees`} className="mx-auto block h-auto w-full max-w-xs select-none">
      <path d={`M${DCX - DIAL_R} ${DCY}A${DIAL_R} ${DIAL_R} 0 0 1 ${DCX + DIAL_R} ${DCY}`} strokeWidth={10} className="fill-none stroke-foreground/10" />
      <path d={`M${at(100, DIAL_R)[0]} ${at(100, DIAL_R)[1]}A${DIAL_R} ${DIAL_R} 0 0 1 ${at(80, DIAL_R)[0]} ${at(80, DIAL_R)[1]}`} strokeWidth={10} className="fill-none stroke-cat-teal/40" />
      {[0, 45, 90, 135, 180].map((d) => (
        <path key={d} d={t(d)} strokeWidth={1.5} className="stroke-foreground/40" />
      ))}
      {marks.map((d, i) => {
        const [x, y] = at(d, DIAL_R + 9);
        return <circle key={i} cx={x} cy={y} r={2.2} className="fill-cat-violet/45" />;
      })}
      <text x={236} y={DCY + 14} textAnchor="end" fontSize={9} className="fill-muted">
        0° সব মিল
      </text>
      <text x={DCX} y={DCY - DIAL_R - 14} textAnchor="middle" fontSize={9} className="fill-muted">
        90° সমান সমান
      </text>
      <text x={4} y={DCY + 14} textAnchor="start" fontSize={9} className="fill-muted">
        180° সব অমিল
      </text>
      <g style={{ transform: `translate(${DCX}px, ${DCY}px) rotate(${-deg}deg)` }} className="transition-transform duration-700 ease-out motion-reduce:transition-none">
        <path d={`M0 0H${DIAL_R - 12}`} strokeWidth={3.5} strokeLinecap="round" className="stroke-cat-violet" />
      </g>
      <circle cx={DCX} cy={DCY} r={5} className="fill-cat-violet" />
      <text x={DCX} y={DCY + 26} textAnchor="middle" fontSize={16} fontWeight={800} className="fill-foreground font-mono">
        {Math.round(deg)}°
      </text>
    </svg>
  );
}

export function CoinMany() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ni, setNi] = useSeed("ni", 1);
  const [tosses, setTosses] = useSeed("tosses", 0);
  const [marks, setMarks] = useSeed<number[]>("marks", []);
  const [big, setBig] = useSeed("big", 0);
  const n = COIN_NS[ni];
  const c = useMemo(() => coins(tosses * 7919 + n, n), [tosses, n]);

  const toss = () => {
    const next = tosses + 1;
    const nc = coins(next * 7919 + n, n);
    setTosses(next);
    setMarks([...marks, nc.deg].slice(-40));
    if (n >= 100) {
      const nb = big + 1;
      setBig(nb);
      if (nb === 3) pass("হেড আর টেল প্রায় সমান সমান পড়ে, তাই মিল আর অমিলও প্রায় আধাআধি। কাঁটা তাই বারবার গিয়ে থামে 90°-এর আশেপাশে।");
    }
  };
  const pick = (i: number) => {
    setNi(i);
    setMarks([]);
  };

  return (
    <>
      <div className="mt-5 text-sm font-medium text-muted">দুইটা arrow, প্রত্যেকটায় 100টা coin। ঘর ঘর মেলালে কয়টা ঘরে মিল পাবেন বলে মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {COIN_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, big >= 3, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={FADE}>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted">প্রত্যেক arrow-এ কয়টা coin?</span>
            {COIN_NS.map((v, i) => (
              <button key={v} type="button" aria-pressed={i === ni} onClick={() => pick(i)} className={pill(i === ni)}>
                {v}
              </button>
            ))}
          </div>
          <div className="mt-4 min-h-24">
            {n <= 10 ? (
              <div className="overflow-x-auto">
                <table className="mx-auto border-separate border-spacing-1 text-center font-mono text-xs font-bold">
                  <tbody>
                    <tr>
                      {c.a.map((x, i) => (
                        <td key={i} className="size-7 rounded-full border-2 border-cat-blue bg-[#fef3c7] text-cat-blue">
                          {x > 0 ? "+" : "−"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      {c.b.map((x, i) => (
                        <td key={i} className="size-7 rounded-full border-2 border-cat-coral bg-[#fef3c7] text-cat-coral">
                          {x > 0 ? "+" : "−"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      {c.a.map((x, i) => (
                        <td key={i} className={x === c.b[i] ? "text-accent-text" : "text-danger"}>
                          {x === c.b[i] ? "✓" : "✗"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={`mx-auto flex flex-wrap justify-center gap-[2px] ${n > 100 ? "max-w-[20rem]" : "max-w-[12rem]"}`}>
                {c.a.map((x, i) => (
                  <span key={i} className={`${n > 100 ? "size-1.5" : "size-3"} rounded-[1px] ${x === c.b[i] ? "bg-cat-teal" : "bg-cat-coral"}`} />
                ))}
              </div>
            )}
          </div>
          <div key={`${n}-${tosses}`} className={`${FADE} text-center text-[0.95rem]`}>
            মিল হলো <b className="text-accent-text">{bn(c.m)}</b>টা ঘরে, অমিল <b className="text-danger">{bn(n - c.m)}</b>টায়।
          </div>
          <Dial deg={c.deg} marks={marks} />
          <div className="text-center text-xs text-muted">বেগুনি ফোঁটাগুলো আগের বারের কোণ। প্রতিবার ছোড়ার পর একটা করে জমে।</div>
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={toss} className={primaryBtn}>
              সবগুলো coin ছুড়ুন
            </button>
          </div>
        </div>
      )}
      <Ticks items={[[`100 বা 1000 coin নিয়ে ছোড়া হলো ${bn(Math.min(big, 3))} বার, দরকার ৩ বার`, big >= 3]]} />
      <Task done={big >= 3}>আগে একটা guess দিন। তারপর 100 বা 1000 coin নিয়ে অন্তত তিনবার ছুড়ে দেখুন, কাঁটাটা কোথায় গিয়ে থামে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tiles.

const TILE = "bg-[#eadcc3] border border-[#c6ad82]";
const SKIN = "bg-cat-amber/80 border border-cat-amber";
const FLOOR_GUESS = ["20টা", "36টা", "50টা"];

// 3a · Peel a row, then a floor. Inside keeps 8 of 10 per direction.

export function EdgeFloor() {
  const pass = useGate();
  const [rowPeeled, setRowPeeled] = useSeed("rowPeeled", false);
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [floorPeeled, setFloorPeeled] = useSeed("floorPeeled", false);
  const edge = (i: number) => i === 0 || i === 9;

  const peelFloor = () => {
    setFloorPeeled(true);
    pass("মেঝের ভেতরে থাকতে হলে ডানে-বাঁয়েও ভেতরে থাকতে হয়, ওপরে-নিচেও। তাই ভেতরে রইলো 8 সারিতে 8টা করে, 64টা।");
  };

  return (
    <>
      <div className="mt-5 text-center text-sm font-semibold">প্রথমে এক লাইনে 10টা tile, পাশাপাশি।</div>
      <div className="mx-auto mt-2 grid max-w-[18rem] grid-cols-10 gap-[3px]">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`aspect-square rounded-sm transition-colors duration-500 ${rowPeeled && edge(i) ? SKIN : TILE}`} />
        ))}
      </div>
      <div className="mt-2 min-h-8 text-center text-[0.95rem]">
        {rowPeeled ? (
          <span className={FADE}>
            দুই মাথার <b className="text-cat-amber">2</b>টা গেল খোসায়, ভেতরে রইলো <b>8</b>টা, মানে <b>80%</b>।
          </span>
        ) : (
          <button type="button" onClick={() => setRowPeeled(true)} className={primaryBtn}>
            খোসা ছাড়ান
          </button>
        )}
      </div>

      {rowPeeled && (
        <div className={FADE}>
          <div className="mt-5 text-center text-sm font-semibold">এবার পুরো মেঝে, 10 × 10। চারপাশের বাইরের সারিটাই এর খোসা।</div>
          <div className="mx-auto mt-2 grid max-w-[16rem] grid-cols-10 gap-[3px]">
            {Array.from({ length: 100 }, (_, k) => {
              const i = k % 10;
              const j = Math.floor(k / 10);
              const on = floorPeeled && (edge(i) || edge(j));
              return <span key={k} style={{ transitionDelay: `${on ? (i + j) * 25 : 0}ms` }} className={`aspect-square rounded-sm transition-colors duration-500 ${on ? SKIN : TILE}`} />;
            })}
          </div>
          {!floorPeeled && (
            <>
              <div className="mt-4 text-sm font-medium text-muted">খোসায় কয়টা tile পড়বে, আন্দাজ করুন তো?</div>
              <div className="mt-2 grid gap-2">
                {FLOOR_GUESS.map((o, i) => (
                  <Choice key={o} n={i} look={predictLook(i, guess, floorPeeled, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
                    {o}
                  </Choice>
                ))}
              </div>
              {guess !== null && (
                <div className="mt-3 flex justify-center">
                  <button type="button" onClick={peelFloor} className={`${primaryBtn} ${FADE}`}>
                    মেঝের খোসা ছাড়ান
                  </button>
                </div>
              )}
            </>
          )}
          {floorPeeled && (
            <div className={`${FADE} mx-auto mt-3 max-w-md rounded-2xl border border-border px-4 py-3 text-center text-[0.95rem]`}>
              খোসায় পড়লো <b className="text-cat-amber">36</b>টা, ভেতরে রইলো <b>64</b>টা, মানে <b>64%</b>।
              <div className="mt-1 text-sm text-muted">লাইনে ভেতরে ছিল 80%, মেঝেতে নেমে এলো 64%-এ।</div>
            </div>
          )}
        </div>
      )}
      <Task done={floorPeeled}>আগে লাইনের খোসা ছাড়ান। তারপর মেঝের খোসায় কয়টা tile পড়বে আন্দাজ করে, ওটাও ছাড়িয়ে ফেলুন।</Task>
    </>
  );
}

// 3b · A 10 × 10 × 10 block of sugar cubes. Predict, then lift off the skin.

const CU = 12.5;
const CX = 132;
const CY = 140;
const iso = (x: number, y: number, z: number): XY => [CX + (x - y) * CU * 0.866, CY + (x + y) * CU * 0.5 - z * CU];
const pp = (ps: XY[]) => ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const ln = (a: XY, b: XY) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
/** the three faces of a cube from lo to hi that face the viewer, each with a grid of `step` */
function cubeFaces(lo: number, hi: number) {
  const k = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  return {
    top: { poly: pp([iso(lo, lo, hi), iso(hi, lo, hi), iso(hi, hi, hi), iso(lo, hi, hi)]), grid: k.map((v) => ln(iso(v, lo, hi), iso(v, hi, hi)) + ln(iso(lo, v, hi), iso(hi, v, hi))).join("") },
    right: { poly: pp([iso(hi, lo, lo), iso(hi, hi, lo), iso(hi, hi, hi), iso(hi, lo, hi)]), grid: k.map((v) => ln(iso(hi, v, lo), iso(hi, v, hi)) + ln(iso(hi, lo, v), iso(hi, hi, v))).join("") },
    left: { poly: pp([iso(lo, hi, lo), iso(hi, hi, lo), iso(hi, hi, hi), iso(lo, hi, hi)]), grid: k.map((v) => ln(iso(v, hi, lo), iso(v, hi, hi)) + ln(iso(lo, hi, v), iso(hi, hi, v))).join("") },
  };
}
const OUTER = cubeFaces(0, 10);
const INNER = cubeFaces(1, 9);
const CUBE_GUESS = ["প্রায় 20%", "প্রায় 36%", "প্রায় অর্ধেক"];
/** where each outer face flies when the skin lifts off */
const FLY = { top: "translate(0px, -34px)", right: "translate(30px, 17px)", left: "translate(-30px, 17px)" };

export function SugarCube() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [peeled, setPeeled] = useSeed("peeled", false);
  const peel = () => {
    setPeeled(true);
    pass("1000টার মধ্যে 488টাই খোসায়, প্রায় অর্ধেক! ভেতরে থাকতে হলে এবার তিন দিকেই ভেতরে থাকতে হয়।");
  };
  const faceTone = { top: "fill-[#faf6ee]", right: "fill-[#ece2d2]", left: "fill-[#dfd2bd]" };

  return (
    <>
      <svg viewBox="0 0 264 290" role="img" aria-label={peeled ? "the outer layer of sugar cubes lifted off, showing an 8 by 8 by 8 cube inside" : "a 10 by 10 by 10 block of sugar cubes"} className="mx-auto my-5 block h-auto w-full max-w-[17rem] select-none">
        {(["top", "right", "left"] as const).map((k) => (
          <g key={`in-${k}`}>
            <polygon points={INNER[k].poly} className={faceTone[k]} />
            <path d={INNER[k].grid} strokeWidth={0.6} className="fill-none stroke-cat-teal/60" />
          </g>
        ))}
        {(["top", "right", "left"] as const).map((k) => (
          <g
            key={`out-${k}`}
            style={{ transform: peeled ? FLY[k] : "translate(0px, 0px)", opacity: peeled ? 0.28 : 1 }}
            className="transition-[transform,opacity] duration-1000 ease-in-out motion-reduce:transition-none"
          >
            <polygon points={OUTER[k].poly} strokeWidth={1} className={`${peeled ? "fill-cat-amber/60" : faceTone[k]} stroke-[#0f1b2d]/30 transition-colors duration-700`} />
            <path d={OUTER[k].grid} strokeWidth={0.5} className="fill-none stroke-[#0f1b2d]/25" />
          </g>
        ))}
      </svg>
      {!peeled ? (
        <>
          <div className="text-sm font-medium text-muted">মোট 1000টা চিনির কিউব। শুধু বাইরের এক স্তর, মানে খোসাটা তুলে ফেললে, তাতে কত ভাগ কিউব উঠে আসবে?</div>
          <div className="mt-2 grid gap-2">
            {CUBE_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, peeled, 2)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {guess !== null && (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={peel} className={`${primaryBtn} ${FADE}`}>
                খোসা তুলে ফেলুন
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={`${FADE} mx-auto max-w-md rounded-2xl border border-border px-4 py-3 text-center text-[0.95rem]`}>
          <div>
            ভেতরে রয়ে গেল <span className="font-mono">8 × 8 × 8 =</span> <b className="font-mono text-cat-teal">512</b>টা কিউব।
          </div>
          <div className="mt-1">
            খোসায় উঠে এলো বাকি <b className="text-cat-amber">488</b>টা, প্রায় <b>অর্ধেক!</b>
          </div>
          <div className="mt-2 text-sm text-muted">ভেতরে ছিল লাইনে 80%, মেঝেতে 64%, আর কিউবে 51%।</div>
        </div>
      )}
      <Task done={peeled}>আগে একটা guess দিন, তারপর খোসাটা তুলে দেখুন।</Task>
    </>
  );
}

// 3c · Keep adding directions: inside × 0.8 each time, like one more exam.

const SHRINK_GUESS = ["প্রায় 70%", "প্রায় 30%", "প্রায় 10%"];
const BW = 300;
const BH = 110;
const SHOW = 20;

export function InsideShrinks() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [n, setN] = useSeed("n", 3);
  const inside = 0.8 ** n;
  const say = inside >= 0.5 ? "এখনো অর্ধেকের বেশি ভেতরে।" : inside >= 0.05 ? "খোসাই এখন দলে ভারী।" : "ভেতরটা প্রায় ফাঁকা!";
  const bars = Math.min(n, SHOW);
  const w = BW / SHOW;

  const add = (to: number) => {
    setN(to);
    if (n < 10 && to >= 10) pass("প্রত্যেক নতুন দিক মানে আরেকটা পরীক্ষা, আর দশটা পরীক্ষায় একসাথে পাশ করা কঠিন। তাই বেশিরভাগ কিউবই গিয়ে পড়ে খোসায়।");
  };

  return (
    <>
      <div className="mt-5 text-sm font-medium text-muted">এবার 10 dimension-এর একটা কিউব, প্রত্যেক দিকে সেই 10টা করে। ভেতরে কত ভাগ টিকে থাকবে বলে মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {SHRINK_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, n >= 10, 2)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={FADE}>
          <svg viewBox={`0 0 ${BW} ${BH + 34}`} role="img" aria-label={`inside share by number of directions, now ${n}`} className="mx-auto mt-5 block h-auto w-full max-w-md select-none">
            <path d={`M0 ${BH}H${BW}`} strokeWidth={1} className="stroke-foreground/30" />
            {Array.from({ length: bars }, (_, k) => {
              const h = 0.8 ** (k + 1) * BH;
              const last = k === bars - 1;
              return (
                <g key={k}>
                  <rect x={k * w + 1.5} y={BH - h} width={w - 3} height={h} rx={2} className={`${POP} ${last ? "fill-cat-teal" : "fill-cat-teal/40"}`} />
                  <text x={k * w + w / 2} y={BH + 12} textAnchor="middle" fontSize={8} className="fill-muted font-mono">
                    {k + 1}
                  </text>
                </g>
              );
            })}
            <text x={BW / 2} y={BH + 28} textAnchor="middle" fontSize={9} className="fill-muted">
              কয়টা দিক (dimension)
            </text>
          </svg>
          <div className="mt-1 text-center">
            <div className="font-mono text-2xl font-bold">
              n = <span key={n} className={`${POP} inline-block`}>{n}</span>
            </div>
            <div className="text-[0.95rem]">
              ভেতরে টিকে আছে <b key={n} className={`${POP} inline-block font-mono text-cat-teal`}>{percent(inside)}</b>, খোসায়{" "}
              <b className="font-mono text-cat-amber">{percent(1 - inside)}</b>।
            </div>
            <div key={say} className={`${FADE} mt-0.5 text-sm text-muted`}>
              {say}
            </div>
          </div>
          <div className="mx-auto mt-3 max-w-md rounded-2xl border border-border px-3 py-2.5 text-center text-sm">
            <div>ভেতরে টিকে থাকতে হলে প্রত্যেক দিকের “পরীক্ষায়” পাশ করতে হয়। একেকটায় পাশ করে দশজনে আটজন।</div>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {Array.from({ length: Math.min(n, 30) }, (_, k) => (
                <span key={k} className={`${POP} rounded-md bg-cat-teal/15 px-1.5 py-0.5 text-xs text-cat-teal`}>
                  দিক {bn(k + 1)} ✓
                </span>
              ))}
              {n > 30 && <span className="px-1.5 py-0.5 text-xs text-muted">…আরও {bn(n - 30)}টা</span>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {n < SHOW && (
              <button type="button" onClick={() => add(n + 1)} className={primaryBtn}>
                + আরেকটা দিক যোগ করুন
              </button>
            )}
            {n >= 10 && n < 100 && (
              <button type="button" onClick={() => add(100)} className={quietBtn}>
                এক লাফে 100 dimension
              </button>
            )}
          </div>
        </div>
      )}
      <Task done={n >= 10}>আগে একটা guess দিন। তারপর একটা একটা করে দিক যোগ করে 10 পর্যন্ত যান।</Task>
    </>
  );
}

// 3d · The ball: the same thing. Points spread evenly through a ball, drawn
//      at their true distance from the centre (where they sit around the disc
//      is only for show), crowd to the skin as n grows.

const BALL_NS = [2, 3, 10, 30, 100];
const BALL_GUESS = ["মাঝখানে জড়ো হবে", "আগের মতোই সবখানে ছড়িয়ে থাকবে", "খোসার কাছে গিয়ে ভিড় করবে"];
const BALL = (() => {
  const r = rng(7);
  return Array.from({ length: 220 }, () => ({ t: r() * 2 * Math.PI, u: r() }));
})();

export function BallSkin() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ni, setNi] = useSeed("ni", 0);
  const [reached, setReached] = useSeed("reached", false);
  const n = BALL_NS[ni];
  const shell = 1 - 0.9 ** n;
  const say = shell < 0.5 ? "বেশিরভাগ point এখনো ভেতরের দিকে।" : shell < 0.9 ? "খোসার দিকে ভিড় বাড়ছে।" : "ভেতরটা প্রায় ফাঁকা, সবাই খোসায়!";
  const pick = (i: number) => {
    setNi(i);
    if (!reached && BALL_NS[i] >= 100) {
      setReached(true);
      pass("চিনির কিউবের সেই একই কাহিনি। Dimension যত বাড়ে, বলের ভেতরটা তত ফাঁকা, আর সবাই গিয়ে জমে খোসায়।");
    }
  };

  return (
    <>
      <div className="mt-5 text-sm font-medium text-muted">বলের ভেতরে সবখানে সমানভাবে এলোমেলো point ছিটিয়ে দিলাম। 100 dimension-এ গেলে point-গুলো বেশিরভাগ কোথায় পাওয়া যাবে?</div>
      <div className="mt-2 grid gap-2">
        {BALL_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, reached, 2)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={FADE}>
          <svg viewBox="0 0 160 122" role="img" aria-label={`points spread through a ball in ${n} dimensions; ${percent(shell)} lie in the outer tenth`} className="mx-auto mt-4 block h-auto w-full max-w-[17rem]">
            <circle cx={80} cy={56} r={50} strokeWidth={1} className="fill-cat-blue/5 stroke-foreground/30" />
            <circle cx={80} cy={56} r={47.5} strokeWidth={5} className="fill-none stroke-cat-amber/30" />
            {BALL.map((d, i) => {
              const rho = d.u ** (1 / n);
              return (
                <circle
                  key={i}
                  r={1.7}
                  style={{ transform: `translate(${80 + 50 * rho * Math.cos(d.t)}px, ${56 + 50 * rho * Math.sin(d.t)}px)` }}
                  className="fill-cat-blue/70 transition-transform duration-700 ease-out motion-reduce:transition-none"
                />
              );
            })}
            <text x={80} y={119} textAnchor="middle" fontSize={8.5} className="fill-cat-amber">
              হলুদ রিং-টাই খোসা, বাইরের 10%
            </text>
          </svg>
          <div className="text-center">
            <div className="font-mono text-2xl font-bold">
              n = <span key={n} className={`${POP} inline-block`}>{n}</span>
            </div>
            <div className="text-[0.95rem]">
              Point-গুলোর <b className="text-cat-amber">{percent(shell)}</b> এখন খোসায়।
            </div>
            <div key={say} className={`${FADE} mt-0.5 text-sm text-muted`}>
              {say}
            </div>
          </div>
          <label className="mx-auto mt-3 flex max-w-sm items-center gap-3">
            <span className="shrink-0 text-sm text-muted">dimension</span>
            <input
              type="range"
              min={0}
              max={BALL_NS.length - 1}
              value={ni}
              aria-label="dimension"
              onChange={(e) => pick(Number(e.target.value))}
              className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
            />
          </label>
        </div>
      )}
      <Task done={reached}>আগে একটা guess দিন। তারপর slider টেনে dimension 100 পর্যন্ত নিয়ে যান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// The three surprises, side by side, for the last screen.

function RecapCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border px-3 py-4 text-center">
      <div className="grid h-12 place-items-center">{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm leading-snug text-muted">{children}</div>
    </div>
  );
}

export function SurpriseRecap() {
  return (
    <div className="my-5 grid gap-3 sm:grid-cols-3">
      <RecapCard icon={<DieFace v={5} size={40} />} title="দূরত্ব গায়ে গায়ে">
        অনেক ঘরের তফাত যোগ হলে বড়-ছোট কাটাকাটি হয়ে যায়, তাই সবাই প্রায় সমান দূরে।
      </RecapCard>
      <RecapCard
        icon={
          <span className="grid size-10 place-items-center rounded-full border-[3px] border-cat-violet bg-[#fef3c7] font-mono text-xs font-bold text-cat-violet">90°</span>
        }
        title="দিক আড়াআড়ি"
      >
        মিল আর অমিল প্রায় আধাআধি, তাই এলোমেলো দুইটা দিক প্রায় 90°-এ।
      </RecapCard>
      <RecapCard icon={<span className="grid size-10 place-items-center rounded-md border-4 border-cat-amber bg-[#eadcc3]" />} title="সবাই খোসায়">
        প্রত্যেক দিক আরেকটা পরীক্ষা, সবগুলোতে পাশ করে ভেতরে টেকে খুব কমজন।
      </RecapCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot -- surprise-journey` (keys are the useSeed names).

export const fixtures: Fixtures = {
  DiceOne: { start: {}, rolled: { roll: 3 } },
  DiceMany: { guessed: { guess: 1 }, hundred: { guess: 1, ci: 3 } },
  DotsBunch: { low: { guess: 1 }, high: { guess: 1, ni: 5 } },
  CoinArrows: { right: {}, same: { a: [1, 1], b: [1, 1] }, opposite: { a: [1, -1], b: [-1, 1] } },
  CoinMany: { ten: { guess: 1 }, hundred: { guess: 1, ni: 2, marks: [84, 95, 88, 91, 97, 86] } },
  EdgeFloor: { row: { rowPeeled: true }, floor: { rowPeeled: true, guess: 1, floorPeeled: true } },
  SugarCube: { start: {}, peeled: { guess: 2, peeled: true } },
  InsideShrinks: { three: { guess: 2 }, twelve: { guess: 2, n: 12 } },
  BallSkin: { flat: { guess: 2 }, hundred: { guess: 2, ni: 4 } },
  SurpriseRecap: { start: {} },
};
