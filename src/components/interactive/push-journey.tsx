"use client";

import type { KeyboardEvent } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Ticks, pill, predictLook, primaryBtn, useSeed, type Fixtures } from "@/components/journey/kit";
import { Arrow, Label, Plane, makeFrame, type Frame, type Tone, type XY } from "@/components/journey/plane";
import { bn } from "./figure-kit";
import { DotBox, dot, num, tupN } from "./haat-journey";
import { rng } from "./surprise-journey";

// Screens for "Math for AI 4.2 — পক্ষে না বিপক্ষে, কাদায় আটকানো ভ্যান", told as a Journey.
//
// On the way home from the হাট the van sinks in the mud, and five people push
// from all sides. মামা says every push helps a little. The reader seals a bet,
// then learns to read the box's number against the road: straight behind gives
// +25, straight in front −25; walking round the van on a ring of equal pushes,
// the sign follows the angle (under 90° plus, exactly 90° zero, past 90°
// minus); a strong push at a slant can beat a straight weak one, because the
// number mixes direction with strength; নাসিব's coin arrows from 2.7 show the
// box's 0 is the right angle even where nothing can be drawn. Last, the reader
// judges the five pushers from their numbers alone, sends the two useless ones
// round the back, and the van comes out.
//
// The box is 4.1's DotBox. Tailwind only; the sheets are journey/plane. Ink on
// the white sheet (the road, the van) is fixed.

const O: XY = [0, 0];
/** the road runs this way: 4 east for every 3 north */
const ROAD: XY = [4, 3];
const ROAD_DEG = (Math.atan2(ROAD[1], ROAD[0]) * 180) / Math.PI;
const DIRS = ["পূর্ব", "উত্তর"];
/** the angle between two arrows, in whole degrees */
const angle = (a: XY, b: XY) => Math.round((Math.acos(dot(a, b) / (Math.hypot(...a) * Math.hypot(...b))) * 180) / Math.PI);
/** a box number as a score, with its sign: +25, 0, −5 */
const signed = (n: number) => (n > 0 ? `+${num(n)}` : num(n));

const FILL: Record<Tone, string> = {
  blue: "fill-cat-blue",
  coral: "fill-cat-coral",
  teal: "fill-cat-teal",
  violet: "fill-cat-violet",
  amber: "fill-cat-amber",
  danger: "fill-danger",
  ink: "fill-[#0f1b2d]",
};
const TEXT: Record<Tone, string> = {
  blue: "text-cat-blue",
  coral: "text-cat-coral",
  teal: "text-cat-teal",
  violet: "text-cat-violet",
  amber: "text-cat-amber",
  danger: "text-danger",
  ink: "text-foreground",
};

/** the five pushers, each push as (east, north) */
const CREW: { name: string; v: XY; tone: Tone; dx: number; dy: number; anchor: "start" | "middle" | "end" }[] = [
  { name: "ফাহিম", v: [4, 3], tone: "blue", dx: -5, dy: -6, anchor: "end" },
  { name: "মামা", v: [6, 2], tone: "teal", dx: -2, dy: 15, anchor: "middle" },
  { name: "চাচা", v: [1, 4], tone: "amber", dx: 0, dy: -8, anchor: "middle" },
  { name: "মামী", v: [-3, 4], tone: "violet", dx: 0, dy: -8, anchor: "middle" },
  { name: "রফিক", v: [-5, 5], tone: "coral", dx: 0, dy: -8, anchor: "middle" },
];

/** The muddy road through the van, clipped to the sheet. */
function Road({ f }: { f: Frame }) {
  const k = ROAD[1] / ROAD[0];
  const t0 = Math.max(f.x0, f.y0 / k);
  const t1 = Math.min(f.x1, f.y1 / k);
  const d = `M${f.sx(t0)} ${f.sy(t0 * k)}L${f.sx(t1)} ${f.sy(t1 * k)}`;
  return (
    <g className="pointer-events-none">
      <path d={d} strokeWidth={f.u * 0.9} className="stroke-[#a16207]/20" />
      <path d={d} strokeWidth={1} strokeDasharray="4 5" className="stroke-[#a16207]/60" />
    </g>
  );
}

/** A small van sitting on the road, facing along it. */
function Van({ f }: { f: Frame }) {
  return (
    <g transform={`translate(${f.sx(0)} ${f.sy(0)}) rotate(${-ROAD_DEG})`} className="pointer-events-none">
      <rect x={-15} y={-7} width={22} height={14} rx={2} className="fill-[#b45309]" />
      <rect x={8} y={-4} width={8} height={8} rx={2} className="fill-[#0f1b2d]" />
      <circle cx={-9} cy={-8} r={2.6} className="fill-[#0f1b2d]" />
      <circle cx={-9} cy={8} r={2.6} className="fill-[#0f1b2d]" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1 · The van in the mud. The road, the van and five push arrows. By eye মামী
//     and রফিক both push "from the side". The reader seals a bet on মামার
//     কথা; it is settled only by FixTheCrew (screen 6).

const FV = makeFrame(-6, 7, -1.5, 6, 24);
const VAN_BET = ["পাঁচজনই কিছু না কিছু সাহায্য করছে", "কেউ কেউ কোনো কাজেই আসছে না, তবে ক্ষতি কেউ করছে না", "কেউ একজন উল্টো ভ্যানটাকে পেছনে ঠেলছে"];

export function VanStuck() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি সিল হলো। মাপার যন্ত্র লাগবে।");
  };

  return (
    <>
      <Plane f={FV} label="কাদার রাস্তায় ভ্যান, পাঁচজন পাঁচ দিক থেকে ঠেলছে" className="max-w-[22rem]">
        <Road f={FV} />
        <Van f={FV} />
        {CREW.map((c) => (
          <g key={c.name}>
            <Arrow f={FV} from={O} to={c.v} tone={c.tone} w={2.4} />
            <Label f={FV} at={c.v} dx={c.dx} dy={c.dy} anchor={c.anchor} className={FILL[c.tone]}>
              {c.name}
            </Label>
          </g>
        ))}
        <Label f={FV} at={[5.6, 4.2]} dx={-2} dy={-8} anchor="end" size={9} weight={500} className="fill-[#a16207]">
          রাস্তা
        </Label>
      </Plane>
      <div className="-mt-2 grid grid-cols-5 gap-1 text-center">
        {CREW.map((c) => (
          <div key={c.name} className="rounded-lg bg-surface py-1">
            <div className={`text-xs font-semibold ${TEXT[c.tone]}`}>{c.name}</div>
            <div className="font-mono text-[0.7rem]">{tupN(c.v)}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm font-medium text-muted">মামা বলছেন, “ঠেলা তো ঠেলাই।” আপনার কী মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {VAN_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>ছবিটা দেখে একটাতে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The simplest case by hand. ফাহিম pushes from straight behind, (4, 3):
//     the box against the road gives +25. Predict what it gives when he goes
//     round the front and pushes back, (−4, −3), then run it: −25.

const FS = makeFrame(-5, 5, -4, 4, 18);
const BEHIND: XY = [4, 3];
const FRONT: XY = [-4, -3];
const FRONT_GUESS = ["+25", "0", "−25"];

export function StraightPush() {
  const pass = useGate();
  const [side, setSide] = useSeed<0 | 1 | null>("side", null);
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [front, setFront] = useSeed("front", false);
  const push = side === 1 ? FRONT : BEHIND;

  const runFront = () => {
    setSide(1);
    setFront(true);
    pass("চিহ্ন বলে ঠেলা পক্ষে না বিপক্ষে।");
  };

  return (
    <>
      <Plane f={FS} label={`রাস্তা (4, 3), ফাহিমের ঠেলা ${tupN(push)}`} className="max-w-[14rem]">
        <Road f={FS} />
        <Van f={FS} />
        {side !== null && <Arrow key={side} f={FS} from={O} to={push} tone={side === 1 ? "coral" : "blue"} w={2.6} draw />}
      </Plane>
      {side === null ? (
        <div className="flex justify-center">
          <button type="button" onClick={() => setSide(0)} className={primaryBtn}>
            ফাহিম পেছন থেকে ঠেলুক
          </button>
        </div>
      ) : (
        <div className={FADE}>
          <DotBox a={ROAD} b={push} k={3} names={DIRS} />
          {!front && (
            <>
              <div className="mt-3 text-sm font-medium text-muted">এবার ফাহিম সামনে গিয়ে উল্টো দিকে ঠেলবে, (−4, −3)। box কী দেবে?</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {FRONT_GUESS.map((o, i) => (
                  <Choice key={o} n={i} look={predictLook(i, guess, false, 2)} disabled={guess !== null} onClick={() => setGuess(i)}>
                    <span className="font-mono">{o}</span>
                  </Choice>
                ))}
              </div>
              {guess !== null && (
                <div className={`${FADE} mt-3 flex justify-center`}>
                  <button type="button" onClick={runFront} className={primaryBtn}>
                    সামনে থেকে ঠেলুক
                  </button>
                </div>
              )}
            </>
          )}
          {front && (
            <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
              {guess === 2 ? "ঠিক ধরেছেন।" : "উঁহু, −25।"} দুইটা ঘরেই গুণফল minus, তাই যোগফলও minus, আর ভ্যান পেছনে চাপ খেলো।
            </div>
          )}
        </div>
      )}
      <Ticks
        items={[
          ["পেছন থেকে", side !== null],
          ["সামনে থেকে", front],
        ]}
      />
      <Task done={front}>ফাহিমকে আগে পেছন থেকে ঠেলতে দিন। তারপর guess করুন সামনে থেকে ঠেললে box কী দেবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Round the van. ফাহিম pushes with the same strength (5) from any of 12
//     spots on a ring. The reader taps spots: the angle to the road and the
//     box's number update. Find the biggest, a zero and the most negative; a
//     sign table fills as each kind of angle is met.

const FR = makeFrame(-6.5, 6.5, -6.5, 6.5, 15);
const RING: XY[] = [
  [5, 0],
  [4, 3],
  [3, 4],
  [0, 5],
  [-3, 4],
  [-4, 3],
  [-5, 0],
  [-4, -3],
  [-3, -4],
  [0, -5],
  [3, -4],
  [4, -3],
];
const MAX = 1;
const MIN = 7;
const ZEROS = [4, 10];
const SIGN_ROWS = [
  { when: "কোণ 90°-এর কম", say: "+, পক্ষে" },
  { when: "কোণ ঠিক 90°", say: "0, কোনো কাজে না" },
  { when: "কোণ 90°-এর বেশি", say: "−, বিপক্ষে" },
];
const kind = (n: number) => (n > 0 ? 0 : n === 0 ? 1 : 2);

/** The angle between the road and the push, as an arc with its degrees. */
function AngleArc({ f, to }: { f: Frame; to: XY }) {
  const a1 = Math.atan2(ROAD[1], ROAD[0]);
  const a2 = Math.atan2(to[1], to[0]);
  let d = a2 - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  if (Math.abs(d) < 1e-6) return null;
  const r = 1.6;
  const p = (a: number): [number, number] => [f.sx(r * Math.cos(a)), f.sy(r * Math.sin(a))];
  const [x1, y1] = p(a1);
  const [x2, y2] = p(a2);
  const mid = a1 + d / 2;
  const lx = f.sx(2.6 * Math.cos(mid));
  const ly = f.sy(2.6 * Math.sin(mid)) + 3;
  return (
    <g className="pointer-events-none">
      <path d={`M${x1} ${y1}A${r * f.u} ${r * f.u} 0 0 ${d > 0 ? 0 : 1} ${x2} ${y2}`} strokeWidth={1.4} className="fill-none stroke-[#0f1b2d]/60" />
      <text x={lx} y={ly} textAnchor="middle" fontSize={9} fontWeight={600} className="fill-[#0f1b2d] font-mono">
        {angle(ROAD, to)}°
      </text>
    </g>
  );
}

export function PushRing() {
  const pass = useGate();
  const [at, setAt] = useSeed<number | null>("at", null);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const push = at === null ? null : RING[at];
  const score = push ? dot(ROAD, push) : 0;
  const kinds = new Set<number>(seen.map((i) => kind(dot(ROAD, RING[i]))));
  const found = { max: seen.includes(MAX), zero: ZEROS.some((z) => seen.includes(z)), min: seen.includes(MIN) };
  const done = found.max && found.zero && found.min;

  const go = (i: number) => {
    setAt(i);
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.includes(MAX) && next.includes(MIN) && ZEROS.some((z) => next.includes(z)))
      pass("সোজা কোণে 0, 90° পেরোলেই minus।");
  };
  /** the ring spot nearest the tap, by compass bearing, so a tap anywhere in its slice counts */
  const pick = (p: XY) => {
    const a = Math.atan2(p[1], p[0]);
    const gap = (q: XY) => {
      const d = Math.atan2(q[1], q[0]) - a;
      return Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
    };
    go(RING.reduce((best, q, i) => (gap(q) < gap(RING[best]) ? i : best), 0));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = e.key === "ArrowLeft" ? 1 : RING.length - 1;
    go(((at ?? 0) + step) % RING.length);
  };

  return (
    <>
      <Plane f={FR} label="ভ্যানের চারপাশে ঠেলার বারোটা জায়গা" drag={{ down: pick }} onKey={onKey} className="max-w-[15rem]">
        <Road f={FR} />
        <Van f={FR} />
        {RING.map((q, i) => (
          <circle
            key={i}
            cx={FR.sx(q[0])}
            cy={FR.sy(q[1])}
            r={at === i ? 0 : 5}
            className={`pointer-events-none ${seen.includes(i) ? "fill-cat-blue/40" : "fill-white stroke-cat-blue/60"}`}
            strokeWidth={1.2}
          />
        ))}
        {push && (
          <>
            <AngleArc f={FR} to={push} />
            <Arrow f={FR} from={O} to={push} tone={score > 0 ? "blue" : score < 0 ? "coral" : "violet"} w={2.6} />
          </>
        )}
      </Plane>
      <div className="-mt-2 text-center">
        {push ? (
          <span className="font-mono text-[0.95rem]">
            (4, 3) · {tupN(push)} ={" "}
            <b key={at} className={`${POP} inline-block text-lg`}>
              {signed(score)}
            </b>
          </span>
        ) : (
          <span className="text-sm text-muted">বৃত্তের যেকোনো একটা জায়গায় tap করুন।</span>
        )}
      </div>
      <div className="mx-auto mt-3 grid max-w-sm gap-1">
        {SIGN_ROWS.map((r, i) => (
          <div key={r.when} className="grid grid-cols-2 gap-2 rounded-lg bg-surface px-3 py-1 text-sm">
            <span className="text-muted">{r.when}</span>
            <span className={kinds.has(i) ? `${FADE} font-semibold` : "text-muted/50"}>{kinds.has(i) ? r.say : "?"}</span>
          </div>
        ))}
      </div>
      <Ticks
        items={[
          ["সবচেয়ে বেশি", found.max],
          ["শূন্য", found.zero],
          ["সবচেয়ে কম", found.min],
        ]}
      />
      <Task done={done}>ফাহিমকে বৃত্তের বিভিন্ন জায়গায় দাঁড় করান। box এর সবচেয়ে বড় নম্বর, একটা শূন্য আর সবচেয়ে ছোট নম্বর খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Strength gets mixed in. A হাটের কুলি, twice ফাহিম's strength, pushes at a
//     slant, (0, 10), against ফাহিম straight behind, (4, 3). The trap is to
//     pick the straight one: 25 against 30.

const FK = makeFrame(-1, 6, -1, 10.5, 16);
const KULI: XY = [0, 10];
const STRONG = [
  { name: "ফাহিম", v: BEHIND, tone: "blue" as Tone, note: "জোর 5, রাস্তা বরাবর" },
  { name: "কুলি", v: KULI, tone: "coral" as Tone, note: "জোর 10, বাঁকা, 53°" },
];
const STRONG_GUESS = ["ফাহিম, সোজা ঠেলছে বলে", "কুলি, গায়ে জোর বেশি বলে", "দুইজন সমান"];

export function StrongPush() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);

  const run = () => {
    setRan(true);
    pass("box এ  দিক আর জোর, দুইটাই মেশে।");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Plane f={FK} label="ফাহিম (4, 3) আর কুলি (0, 10)" className="max-w-[9.5rem] shrink-0">
          <Road f={FK} />
          <Van f={FK} />
          {STRONG.map((s) => (
            <Arrow key={s.name} f={FK} from={O} to={s.v} tone={s.tone} w={2.6} />
          ))}
          <Label f={FK} at={KULI} dx={6} dy={4} anchor="start" className={FILL.coral}>
            কুলি
          </Label>
          <Label f={FK} at={BEHIND} dx={4} dy={12} anchor="start" className={FILL.blue}>
            ফাহিম
          </Label>
        </Plane>
        <div className="grid min-w-0 flex-1 gap-2">
          {STRONG.map((s) => (
            <div key={s.name} className="rounded-xl border-2 border-border bg-surface px-2 py-1.5 text-center">
              <div className={`text-sm font-semibold ${TEXT[s.tone]}`}>
                {s.name} <span className="font-mono">{tupN(s.v)}</span>
              </div>
              <div className="text-xs text-muted">{s.note}</div>
              {ran && (
                <div className="mt-1">
                  <DotBox a={ROAD} b={s.v} k={3} dense />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {guess !== null && !ran && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={run} className={primaryBtn}>
            দুইজনকেই box এ  দিন
          </button>
        </div>
      )}
      <div className="mt-2 text-sm font-medium text-muted">ভ্যানের কাজে কার ঠেলা বেশি লাগবে?</div>
      <div className="mt-2 grid gap-2">
        {STRONG_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, ran, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={ran}>আগে guess করুন কার ঠেলা বেশি কাজে লাগবে, তারপর দুইজনকেই রাস্তার সাথে box এ  দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · নাসিবের coins from 2.7, as ±1 lists (head +1, tail −1). The reader runs
//     the box a pair at a time: a match gives +1, a mismatch −1, and 2 each
//     sum to 0, which 2.7 called 90°. Then 100 tosses (seeded, so every visit
//     sees the same ones): 52 matches, 48 mismatches, the box says 4 of a
//     possible 100. No picture anywhere, yet the box still finds the angle.

const BLUE = [1, -1, 1, 1];
const RED = [1, 1, -1, 1];
const COIN_ANGLE = ["0°", "90°", "180°"];
const [BLUE100, RED100] = (() => {
  const r = rng(16);
  const a: number[] = [];
  const b: number[] = [];
  for (let i = 0; i < 100; i++) {
    a.push(r() < 0.5 ? 1 : -1);
    b.push(r() < 0.5 ? 1 : -1);
  }
  return [a, b];
})();
const MATCH100 = BLUE100.filter((x, i) => x === RED100[i]).length;

function Coin({ v, tone }: { v: number; tone: "blue" | "coral" }) {
  return (
    <span
      className={`grid size-9 place-items-center rounded-full border-2 font-mono text-xs font-bold ${
        tone === "blue" ? "border-cat-blue/60 bg-cat-blue/10 text-cat-blue" : "border-cat-coral/60 bg-cat-coral/10 text-cat-coral"
      }`}
    >
      {v > 0 ? "+1" : "−1"}
    </span>
  );
}

export function CoinBox() {
  const pass = useGate();
  const [k, setK] = useSeed("k", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const [named, setNamed] = useSeed("named", false);
  const [hundred, setHundred] = useSeed("hundred", false);
  const summed = k > BLUE.length;

  const name = (i: number) => {
    if (i !== 1) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setNamed(true);
  };
  const toss = () => {
    setHundred(true);
    pass("মিল-অমিল সমান হলে 0, মানে সোজা কোণ।");
  };

  return (
    <>
      {!hundred ? (
        <>
          <div className="mx-auto mt-2 grid w-fit grid-cols-[auto_repeat(4,auto)] items-center gap-x-2 gap-y-1.5">
            <span className="text-sm font-semibold text-cat-blue">নীল</span>
            {BLUE.map((v, i) => (
              <Coin key={i} v={v} tone="blue" />
            ))}
            <span className="text-sm font-semibold text-cat-coral">লাল</span>
            {RED.map((v, i) => (
              <Coin key={i} v={v} tone="coral" />
            ))}
            <span className="text-sm text-muted">গুণ</span>
            {BLUE.map((v, i) => (
              <span key={i} className={`text-center font-mono font-bold ${i < k ? `${FADE} ${v * RED[i] > 0 ? "text-accent-text" : "text-danger"}` : "text-muted/40"}`}>
                {i < k ? (v * RED[i] > 0 ? "+1" : "−1") : "?"}
              </span>
            ))}
          </div>
          {summed && (
            <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>
              দুইটা মিল, দুইটা অমিল: box এ  <b className="font-mono">0</b>
            </div>
          )}
          {!summed ? (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={() => setK(k + 1)} className={primaryBtn}>
                {k === 0 ? "প্রথম জোড়া গুণ করুন" : k < BLUE.length ? "পরের জোড়া" : "সব যোগ করুন"}
              </button>
            </div>
          ) : (
            <div className={FADE}>
              <div className="mt-3 text-sm font-medium text-muted">২.৭-এ দুই coin-এর arrow-এর মাঝে কোণ কত ছিল, যখন মিল আর অমিল সমান?</div>
              <div className="mt-2 flex justify-center gap-2">
                {COIN_ANGLE.map((o, i) => (
                  <button key={o} type="button" disabled={named} onClick={() => name(i)} className={pill(named && i === 1)}>
                    {o}
                  </button>
                ))}
              </div>
              {miss !== null && <Nope key={miss}>উঁহু। 0° মানে সব মিল, 180° মানে সব অমিল। মাঝামাঝি হলে?</Nope>}
              {named && (
                <div className={`${FADE} mt-3 flex justify-center`}>
                  <button type="button" onClick={toss} className={primaryBtn}>
                    এবার দুইটা coin 100 বার করে
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className={FADE}>
          <div className="mt-2 text-center text-sm text-accent-text">✓ চার ঘরে দুই মিল, দুই অমিল: box এ  0, কোণ 90°।</div>
          <div className="mx-auto mt-3 grid w-fit grid-cols-10 gap-1" aria-label={`একশো জোড়ার ${bn(MATCH100)}টা মিল`}>
            {BLUE100.map((v, i) => (
              <span key={i} className={`size-4 rounded-sm ${v === RED100[i] ? "bg-accent/70" : "bg-danger/60"}`} />
            ))}
          </div>
          <div className="mt-3 text-center text-[0.95rem]">
            মিল <b className="font-mono">{MATCH100}</b>, অমিল <b className="font-mono">{100 - MATCH100}</b>, box এ {" "}
            <b className="font-mono">{num(dot(BLUE100, RED100))}</b>। সব মিললে হতো 100।
          </div>
        </div>
      )}
      <Task done={hundred}>আগে চার জোড়া coin box এ  দিন, তারপর কোণটা বলুন, শেষে 100 বার toss করে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · এবার আপনার পালা. The five pushers again, numbers only, one card at a
//     time: পক্ষে, কাজে আসছে না, or বিপক্ষে, worked out in the head. Wrong tries
//     bounce. Their numbers add to 66 and the van needs 80. Sending মামী and
//     রফিক round the back makes it 121, and the van comes out.

const VERDICTS = ["পক্ষে", "কাজে আসছে না", "বিপক্ষে"];
const NEED = 80;
const METER_MAX = 130;

export function FixTheCrew() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const [fixed, setFixed] = useSeed("fixed", false);
  const all = done === CREW.length;
  const crew = CREW.map((c) => (fixed && dot(ROAD, c.v) <= 0 ? { ...c, v: BEHIND } : c));
  const total = crew.slice(0, done).reduce((s, c) => s + dot(ROAD, c.v), 0);
  const card = CREW[done];

  const judge = (i: number) => {
    if (all) return;
    if (i !== kind(dot(ROAD, card.v))) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setDone(done + 1);
  };
  const fix = () => {
    setFixed(true);
    pass("উল্টো ঠেলা minus, অকাজের ঠেলা 0।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border border-border bg-surface px-3 py-1 text-sm">
        রাস্তা <b className="font-mono">(4, 3)</b>
      </div>
      <div className="mt-3 min-h-16">
        {!all ? (
          <div key={done} className={`${POP} mx-auto w-fit rounded-2xl border-2 border-cat-violet/40 bg-surface px-5 py-2 text-center`}>
            <div className={`text-sm font-semibold ${TEXT[card.tone]}`}>{card.name}-এর ঠেলা</div>
            <div className="font-mono text-lg font-bold">{tupN(card.v)}</div>
          </div>
        ) : (
          <div className={`${FADE} text-center text-[0.95rem]`}>{fixed ? "ভ্যান কাদা থেকে উঠে গেল!" : "পাঁচজনই বিচার করা হলো। ভ্যান কি উঠবে?"}</div>
        )}
        {miss !== null && !all && (
          <Nope key={miss}>
            উঁহু। মনে মনে boxটা চালান: 4 গুণ প্রথম সংখ্যা, 3 গুণ দ্বিতীয় সংখ্যা, তারপর যোগ। উত্তর plus, শূন্য না minus?
          </Nope>
        )}
      </div>
      {!all && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {VERDICTS.map((v, i) => (
            <button
              key={v}
              type="button"
              onClick={() => judge(i)}
              className="cursor-pointer rounded-xl border-2 border-border px-1 py-2 text-sm font-semibold transition-colors hover:border-cat-blue/60 motion-reduce:transition-none"
            >
              {v}
            </button>
          ))}
        </div>
      )}
      <div className="mx-auto mt-3 grid max-w-sm gap-0.5">
        {crew.slice(0, done).map((c) => {
          const s = dot(ROAD, c.v);
          return (
            <div key={c.name} className={`${FADE} flex items-baseline justify-between gap-2 text-sm`}>
              <span className={`font-semibold ${TEXT[c.tone]}`}>{c.name}</span>
              <span className="font-mono text-[0.8rem] text-muted">
                4 × {num(c.v[0])} + 3 × {num(c.v[1])} ={" "}
                <b className={s > 0 ? "text-foreground" : s < 0 ? "text-danger" : "text-cat-violet"}>{signed(s)}</b>
              </span>
            </div>
          );
        })}
      </div>
      {all && (
        <div className={`${FADE} mt-3`}>
          <div className="relative mx-auto h-4 max-w-sm rounded-full bg-foreground/10">
            <div
              className={`h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${total >= NEED ? "bg-accent" : "bg-cat-amber"}`}
              style={{ width: `${Math.min(100, (total / METER_MAX) * 100)}%` }}
            />
            <span className="absolute -top-1 h-6 w-0.5 bg-foreground/60" style={{ left: `${(NEED / METER_MAX) * 100}%` }} aria-hidden="true" />
          </div>
          <div className="mx-auto mt-1 flex max-w-sm justify-between text-xs text-muted">
            <span>
              মোট <b className="font-mono text-foreground">{total}</b>
            </span>
            <span>ভ্যান উঠতে লাগবে {NEED}</span>
          </div>
          {!fixed && (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={fix} className={primaryBtn}>
                মামী আর রফিককে পেছনে পাঠান
              </button>
            </div>
          )}
        </div>
      )}
      <Task done={fixed}>
        প্রতিজনের ঠেলা রাস্তার সাথে মনে মনে box এ  দিয়ে বিচার করুন ({bn(done)}/{bn(CREW.length)})। তারপর ভ্যানটাকে কাদা থেকে তুলুন।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  VanStuck: { start: {}, bet: { bet: 0 } },
  StraightPush: { start: {}, behind: { side: 0 }, guessed: { side: 0, guess: 1 }, front: { side: 1, guess: 2, front: true } },
  PushRing: { start: {}, zero: { at: 4, seen: [1, 4] }, done: { at: 7, seen: [1, 2, 4, 5, 7] } },
  StrongPush: { start: {}, ran: { guess: 0, ran: true } },
  CoinBox: { start: {}, summed: { k: 5 }, named: { k: 5, named: true }, hundred: { k: 5, named: true, hundred: true } },
  FixTheCrew: { start: {}, miss: { done: 3, miss: 1 }, judged: { done: 5 }, fixed: { done: 5, fixed: true } },
};
