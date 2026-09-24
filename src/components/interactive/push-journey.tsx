"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

import { Bubble, Card, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { BoxRun } from "@/components/journey/box";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, LOOK, Nope, POP, Scene, Ticks, pill, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Arrow, Dot, Label, Plane, makeFrame, type Frame, type Tone, type XY } from "@/components/journey/plane";
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
// The box is 4.1's DotBox. The setups that tell a scene get a story scene on
// the stage (1a the van sinking, 4a the কুলি arriving, 5a নাসিবের coins
// remembered, 6a চাচা's 80, 12½ the van coming out, 12a the dinner bet), and
// every <Then> gets one or two figures (1½, 2½, 2¾, 3½, 3¾, 4¼, 4½, 4¾, 5½,
// 5¾, 6½, 6¾) — all watch-only but 4¼, which the reader breaks apart and
// swings. Tailwind only; the
// sheets are journey/plane. Ink on the white sheet (the road, the van) is
// fixed.

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
      <div className="mt-3 text-sm font-medium text-muted">মামা বলছেন, “ধাক্কা তো ধাক্কাই।” আপনার কী মনে হয়?</div>
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
    pass("plus, minus বলে দেয় পক্ষে নাকি বিপক্ষে।");
  };

  return (
    <>
      <Plane f={FS} label={`রাস্তা (4, 3), ফাহিমের ধাক্কা ${tupN(push)}`} className="max-w-[14rem]">
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
          <DotBox a={ROAD} b={push} names={DIRS} />
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
              {guess === 2 ? "ঠিক ধরেছেন।" : "উঁহু, −25।"} দুইটা ঘরেই গুণফল minus। তাই যোগফলও minus। ভ্যান চাপ খেলো পেছনে।
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
      <Task done={front}>ফাহিমকে আগে পেছন থেকে ঠেলতে দিন। তারপর guess করুন, সামনে থেকে ঠেললে box কী দেবে।</Task>
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
      pass("৯০ degree কোণে 0, 90° পেরোলেই minus।");
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
      <Plane f={FR} label="ভ্যানের চারপাশে ধাক্কার বারোটা জায়গা" drag={{ down: pick }} onKey={onKey} className="max-w-[15rem]">
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
            {tupN(ROAD)} · {tupN(push)} = <BoxRun a={ROAD} b={push} inline live />
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
    pass("box এ দিক আর জোর, দুইটাই মেশে।");
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
                  <DotBox a={ROAD} b={s.v} dense />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {guess !== null && !ran && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={run} className={primaryBtn}>
            দুইজনকেই box এ দিন
          </button>
        </div>
      )}
      <div className="mt-2 text-sm font-medium text-muted">ভ্যানকে কে বেশি জোরে ঠেলছে?</div>
      <div className="mt-2 grid gap-2">
        {STRONG_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, ran, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={ran}>আগে guess করুন, কার ধাক্কা বেশি কাজে লাগবে। তারপর দুইজনকেই রাস্তার সাথে box এ দিন।</Task>
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
    pass("মিল-অমিল সমান হলে 0, মানে ৯০ degree কোণ।");
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
              দুইটা মিল, দুইটা অমিল: box এ <b className="font-mono">0</b>
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
          <div className="mt-2 text-center text-sm text-accent-text">✓ চার ঘরে দুই মিল, দুই অমিল: box এ 0, কোণ 90°।</div>
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
      <Task done={hundred}>আগে চার জোড়া coin box এ দিন। তারপর কোণটা বলুন। শেষে 100 বার toss করে দেখুন।</Task>
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
    pass("উল্টো ধাক্কা minus, অকাজের ধাক্কা 0।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border border-border bg-surface px-3 py-1 text-sm">
        রাস্তা <b className="font-mono">(4, 3)</b>
      </div>
      <div className="mt-3 min-h-16">
        {!all ? (
          <div key={done} className={`${POP} mx-auto w-fit rounded-2xl border-2 border-cat-violet/40 bg-surface px-5 py-2 text-center`}>
            <div className={`text-sm font-semibold ${TEXT[card.tone]}`}>{card.name}-এর ধাক্কা</div>
            <div className="font-mono text-lg font-bold">{tupN(card.v)}</div>
          </div>
        ) : (
          <div className={`${FADE} text-center text-[0.95rem]`}>{fixed ? "ভ্যান কাদা থেকে উঠে গেল!" : "পাঁচজনই বিচার করা হলো। ভ্যান কি উঠবে?"}</div>
        )}
        {miss !== null && !all && (
          <Nope key={miss}>
            উঁহু। মনে মনে boxটা চালান। 4 গুণ প্রথম সংখ্যা। 3 গুণ দ্বিতীয় সংখ্যা। তারপর যোগ। কী এলো? plus, শূন্য না minus?
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
              <span className={`font-mono text-[0.8rem] ${s > 0 ? "text-foreground" : s < 0 ? "text-danger" : "text-cat-violet"}`}>
                <BoxRun a={ROAD} b={c.v} inline />
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
        প্রতিজনের ধাক্কা রাস্তার সাথে মনে মনে box এ দিন। বিচার করুন ({bn(done)}/{bn(CREW.length)})। তারপর ভ্যানটাকে কাদা থেকে তুলুন।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared bits for the story scenes and figures below.

/** the ground line of a Stage */
const PG = 150;
/** the ink drawn on a Stage or a white sheet */
const P_INK = "#0f1b2d";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** Something that glides to (x, y) over `ms`, the way a Person does: draw it around (0, 0). */
function P_Carry({ x, y, ms = 1200, children }: { x: number; y: number; ms?: number; children: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {children}
    </g>
  );
}

/** The name under someone who isn't in the cast; it glides with them. */
function P_Name({ x, y = PG, text, ms = 1200 }: { x: number; y?: number; text: string; ms?: number }) {
  return (
    <P_Carry x={x} y={y} ms={ms}>
      <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={P_INK}>
        {text}
      </text>
    </P_Carry>
  );
}

/** The red mark of someone pushing, beside their feet at (x, y), pointing `facing`. */
function P_Push({ x, y = PG, facing }: { x: number; y?: number; facing: 1 | -1 }) {
  return <path d={`M${x + facing * 14} ${y - 38}h${facing * 9}m${-facing * 3} -3l${facing * 3} 3l${-facing * 3} 3`} fill="none" stroke="#dc2626" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />;
}

/** A cycle van, the left end of its bed over (x, y) — 4.1's van, on the stage. */
function P_Van({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y - 32} width={70} height={6} rx={1} fill="#92400e" />
      <path d={`M${x} ${y - 32}v-7M${x + 70} ${y - 32}v-7M${x} ${y - 37}h70`} stroke="#78350f" strokeWidth={1.6} />
      <circle cx={x + 16} cy={y - 11} r={11} fill="none" stroke={P_INK} strokeWidth={2.2} />
      <circle cx={x + 54} cy={y - 11} r={11} fill="none" stroke={P_INK} strokeWidth={2.2} />
      <path d={`M${x + 70} ${y - 28}L${x + 88} ${y - 30}L${x + 94} ${y - 9}M${x + 84} ${y - 30}l-2 -12h-5M${x + 90} ${y - 44}l4 -1`} fill="none" stroke={P_INK} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={x + 94} cy={y - 9} r={9} fill="none" stroke={P_INK} strokeWidth={2.2} />
    </g>
  );
}

/** A tape roll with its end hanging loose, centred at (0, 0). */
function P_Tape() {
  return (
    <g className="pointer-events-none">
      <rect x={-7} y={-5} width={14} height={10} rx={2} fill="#fbbf24" stroke="#b45309" strokeWidth={1} />
      <circle r={2.2} fill="#fff7ed" stroke="#b45309" strokeWidth={0.8} />
      <path d="M-7 3q-6 4 -9 9" fill="none" stroke="#f59e0b" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

/** A চাঁদা (half-circle protractor), flat side down, centred at (0, 0). */
function P_Protractor() {
  return (
    <g className="pointer-events-none">
      <path d="M-9 0A9 9 0 0 1 9 0Z" fill="#e0f2fe" stroke="#0369a1" strokeWidth={1} />
      <path d="M-9 0H9" stroke="#0369a1" strokeWidth={0.8} />
      {[-6, -3, 0, 3, 6].map((t) => {
        const y = -Math.sqrt(81 - t * t);
        return <line key={t} x1={t} y1={y} x2={t} y2={y + 2.2} stroke="#0369a1" strokeWidth={0.7} />;
      })}
      <circle r={1} fill="#0369a1" />
    </g>
  );
}

/** A caption that fades in afresh on every beat. */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** the little square that marks a right angle at the origin, between the road and `to` */
function RightAngle({ f, to }: { f: Frame; to: XY }) {
  const n = Math.hypot(...to);
  const r: XY = [ROAD[0] / 5, ROAD[1] / 5];
  const u: XY = [to[0] / n, to[1] / n];
  const a = 1.1;
  const p = (x: number, y: number) => `${f.sx(x)} ${f.sy(y)}`;
  return (
    <path
      d={`M${p(a * r[0], a * r[1])}L${p(a * (r[0] + u[0]), a * (r[1] + u[1]))}L${p(a * u[0], a * u[1])}`}
      fill="none"
      stroke={P_INK}
      strokeOpacity={0.55}
      strokeWidth={1.3}
      className="pointer-events-none"
    />
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, first paragraph: the same push
//      from behind and from the front. The number is the same 25, only the
//      sign flips — the box telling the road which team the push is on.

const X2T_SAY = [
  "পেছন থেকে ঠেললে (4, 3): box এ +25।",
  "সামনে থেকে সেই একই ধাক্কা (−4, −3): −25।",
  "সংখ্যা একই। শুধু চিহ্ন উল্টা। দুইটা informationই box দেয় একদম ঠিক।",
];
const X2T_ROWS = [
  { head: "পেছন থেকে", tup: "(4, 3)", out: "+25", team: "ভ্যানের দলে", ink: "text-cat-blue", edge: "border-cat-blue/40", chip: "bg-cat-blue/10 text-cat-blue" },
  { head: "সামনে থেকে", tup: "(−4, −3)", out: "−25", team: "ভ্যানের against-এ", ink: "text-cat-coral", edge: "border-cat-coral/40", chip: "bg-cat-coral/10 text-cat-coral" },
];

export function TeamSign() {
  const s = useScene(2, [600, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X2T_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[9.5rem] shrink-0">
          <Plane f={FS} label="একই ধাক্কা — পেছন থেকে (4, 3) আর সামনে থেকে (−4, −3)" className="my-0! max-w-none">
            <Road f={FS} />
            <Van f={FS} />
            <Arrow f={FS} from={O} to={BEHIND} tone="blue" w={2.6} />
            {k >= 1 && <Arrow f={FS} from={O} to={FRONT} tone="coral" w={2.6} draw />}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {X2T_ROWS.map((r, i) => (
            <div key={r.head} className={`rounded-xl border-2 bg-surface px-2.5 py-1.5 ${r.edge} ${i === 0 ? "" : k >= 1 ? FADE : "hidden"}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-xs font-semibold ${r.ink}`}>{r.head}</span>
                <span className="font-mono text-[0.7rem] text-muted">{r.tup}</span>
                <span className={`font-mono text-lg font-bold ${r.ink}`}>{r.out}</span>
              </div>
              {k >= 2 && (
                <div className={`mt-0.5 text-center text-xs font-semibold ${r.chip} ${POP} inline-block rounded-full px-2 py-0.5`}>
                  {r.team}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2¾ · A figure for screen 2's explanation, the honest aside: the road's own
//      arrow (4, 3) is 5 long, so every number out of the box is 5 times the
//      real push. The tape measures it; the sum names it. Why 5 is 4.3's story.

const F2F = makeFrame(-0.6, 4.8, -0.6, 3.9, 24);
const X2F_SAY = [
  "রাস্তার arrow (4, 3) নিজে কত লম্বা?",
  "ফিতা দিয়ে মাপা যায়: ঠিক 5।",
  "তাই box এর নম্বর আসল ধাক্কার 5 গুণ: 25 = 5 × 5।",
];

export function FiveTimes() {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X2F_SAY, k)}>
      <div className="mx-auto w-full max-w-[10rem]">
        <Plane f={F2F} label="রাস্তার arrow (4, 3), ফিতা দিয়ে মাপা — 5" className="my-0! max-w-none">
          <Road f={F2F} />
          <Van f={F2F} />
          <Arrow f={F2F} from={O} to={BEHIND} tone="blue" w={2.6} />
          {k >= 1 && (
            <>
              <Draw d={`M${F2F.sx(0.15)} ${F2F.sy(-0.2)}L${F2F.sx(4.15)} ${F2F.sy(2.8)}`} strokeWidth={6} className="stroke-cat-teal/30" />
              <Label f={F2F} at={[2.4, 1.6]} dx={4} dy={4} anchor="start" className={`${FILL.teal} font-mono`}>
                5
              </Label>
            </>
          )}
        </Plane>
        {k >= 2 && (
          <div className={`${POP} mt-2 text-center font-mono text-[0.95rem] font-bold`}>
            25 <span className="font-sans font-medium text-muted">মানে</span> 5 × 5
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation: walk the ring with the same
//      strength and the number follows the angle — 25, 24, 20, 15 down to 0 at
//      the right angle, then minus. Every spot is one the widget's ring holds.

const F3F = makeFrame(-5.6, 5.6, -4.6, 5.8, 13);
const X3_SPOTS: { v: XY; n: string; tone: Tone; dx: number; dy: number; anchor: "start" | "middle" | "end"; at: number }[] = [
  { v: [4, 3], n: "+25", tone: "blue", dx: -3, dy: -6, anchor: "end", at: 0 },
  { v: [3, 4], n: "+24", tone: "blue", dx: 0, dy: -8, anchor: "middle", at: 1 },
  { v: [5, 0], n: "+20", tone: "blue", dx: 4, dy: -7, anchor: "start", at: 1 },
  { v: [0, 5], n: "+15", tone: "blue", dx: 0, dy: -8, anchor: "middle", at: 2 },
  { v: [-3, 4], n: "0", tone: "violet", dx: 0, dy: -8, anchor: "middle", at: 3 },
  { v: [-4, 3], n: "−7", tone: "coral", dx: -3, dy: -6, anchor: "end", at: 4 },
];
const X3_SAY = [
  "রাস্তা বরাবর দাঁড়িয়ে ঠেললে নম্বর সবচেয়ে বড়: 25।",
  "দিক রাস্তা থেকে সরে। নম্বর ছোট হয়: 24, তারপর 20।",
  "আরেকটু সরে 15।",
  "ঠিক ৯০ degree কোণে? নম্বর একদম 0। ভ্যান শুধু পাশে চাপে।",
  "আর 90° পেরোলেই নম্বর minus: −7।",
];

export function AngleFan() {
  const s = useScene(4, [600, 2000, 2000, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <div className="mx-auto w-[9.5rem]">
        <Plane f={F3F} label="ভ্যানের চারপাশে একই জোরে ছয়টা দিক, প্রতিটার নম্বর" className="my-0! max-w-none">
          <Road f={F3F} />
          <Van f={F3F} />
          {X3_SPOTS.map((sp) =>
            k >= sp.at ? (
              <g key={sp.n}>
                <Arrow f={F3F} from={O} to={sp.v} tone={sp.tone} w={sp.at === 0 ? 2.6 : 2.2} draw={sp.at > 0} />
                <Label f={F3F} at={sp.v} dx={sp.dx} dy={sp.dy} anchor={sp.anchor} size={sp.at === 0 ? 11 : 10} className={`${FILL[sp.tone]} font-mono`}>
                  {sp.n}
                </Label>
              </g>
            ) : null,
          )}
          {k >= 3 && <RightAngle f={F3F} to={[-3, 4]} />}
          <Label f={F3F} at={[4.2, 3.15]} dx={0} dy={12} anchor="middle" size={9} weight={500} className="fill-[#a16207]">
            রাস্তা
          </Label>
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: the কুলি runs in from the
//      হাট, twice ফাহিম's strength, and plants himself at a bad slant. Only
//      মামা, ফাহিম and চাচা are drawn — the paragraph is about him. No verdict.

export function KoolyArrives({}: Story) {
  const s = useScene(4, [600, 1800, 2200, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="কুলি দৌড়ে এসে বাঁকা হয়ে দাঁড়ালেন; ভ্যান তবু কাদায়">
        <ellipse cx={70} cy={32} rx={26} ry={8} fill="#94a3b8" opacity={0.45} />
        <ellipse cx={238} cy={24} rx={20} ry={6} fill="#94a3b8" opacity={0.45} />
        <rect y={PG - 3} width={320} height={12} fill="#d6c08f" />
        <ellipse cx={156} cy={PG + 2} rx={62} ry={7} fill="#6b4f2a" />
        <g transform="translate(0 4)">
          <P_Van x={100} y={PG} />
        </g>
        <Person who="mama" x={30} y={PG} facing={1} mood={k >= 3 ? "shout" : "plain"} label />
        <P_Push x={30} facing={1} />
        <Person who="fahim" x={76} y={PG} facing={1} mood={k >= 3 ? "shout" : "plain"} label />
        <P_Push x={76} facing={1} />
        <Person who="karim" x={226} y={PG} facing={-1} mood={k >= 3 ? "shout" : "plain"} />
        <P_Name x={226} text="চাচা" />
        <P_Push x={226} facing={-1} />
        <P_Carry x={k >= 1 ? 288 : 366} y={PG} ms={1500}>
          <Person who="som" x={0} y={0} scale={1.15} facing={-1} walking={k === 1} arm={k >= 2 ? "point" : "down"} mood={k >= 3 ? "shout" : "plain"} />
        </P_Carry>
        <P_Name x={k >= 1 ? 288 : 366} text="কুলি" ms={1500} />
        {k >= 2 && (
          <g className={FADE}>
            <path d="M276 116L248 102m9 -3l-8 3l4 8" fill="none" stroke="#dc2626" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <rect x={252} y={76} width={62} height={13} rx={6.5} fill="white" stroke="#dc2626" strokeWidth={1} />
            <text x={283} y={85.5} textAnchor="middle" fontSize={8} fontWeight={700} fill={P_INK}>
              জোর দ্বিগুণ!
            </text>
          </g>
        )}
        {k >= 3 && <path d="M96 146q-5 -7 -11 -6M198 146q5 -7 11 -6" fill="none" stroke="#6b4f2a" strokeWidth={2} strokeLinecap="round" className={FADE} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4¼ · A figure for screen 4's explanation, before 4½: a slanted push is two
//      pushes at once. The reader breaks the কুলি's 10 into a road-ward piece
//      and a sideways piece, then swings the push and watches the two trade
//      length — flat on the road the side piece dies, square to it the road
//      piece does. No numbers until the reader's own aim makes them.

const FBREAK = makeFrame(-7, 8.8, -1.2, 11, 12);
/** the road's way, one unit long */
const RHAT: XY = [0.8, 0.6];
/** straight across the road, one unit long */
const UHAT: XY = [-0.6, 0.8];
/** where the কুলি stands, (0, 10), in degrees off the road */
const KULI_SLANT = 53;

export function BreakThePush() {
  const [broke, setBroke] = useSeed("broke", false);
  const [th, setTh] = useSeed("th", KULI_SLANT);
  const [deg] = useTween([th], 400);
  const rad = (deg * Math.PI) / 180;
  const along = 10 * Math.cos(rad);
  const across = 10 * Math.sin(rad);
  const foot: XY = [along * RHAT[0], along * RHAT[1]];
  const whole: XY = [foot[0] + across * UHAT[0], foot[1] + across * UHAT[1]];

  /** any tap or drag re-aims the push: only its slant off the road matters, so it folds into 0…90° */
  const aim = (p: XY) => {
    if (Math.hypot(...p) < 1) return;
    const d = Math.atan2(p[1], p[0]) - Math.atan2(RHAT[1], RHAT[0]);
    setTh(Math.min(90, Math.abs((d * 180) / Math.PI)));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setTh(Math.max(0, Math.min(90, th + (e.key === "ArrowLeft" ? 5 : -5))));
  };

  return (
    <>
      <Plane f={FB} label="কুলির বাঁকা ধাক্কা আর তার দুই টুকরো" drag={{ down: aim, move: aim }} onKey={onKey} className="max-w-[17rem]">
        <Road f={FB} />
        <Van f={FB} />
        {broke && (
          <>
            <Arrow f={FB} from={O} to={foot} tone="teal" w={2.6} draw />
            <Arrow f={FB} from={foot} to={whole} tone="violet" w={2.6} draw delay={450} />
            {along > 1 && across > 1 && (
              <path
                d={`M${FBREAK.sx(foot[0] + 0.55 * UHAT[0])} ${FBREAK.sy(foot[1] + 0.55 * UHAT[1])}L${FBREAK.sx(foot[0] + 0.55 * (UHAT[0] + RHAT[0]))} ${FBREAK.sy(foot[1] + 0.55 * (UHAT[1] + RHAT[1]))}L${FBREAK.sx(foot[0] + 0.55 * RHAT[0])} ${FBREAK.sy(foot[1] + 0.55 * RHAT[1])}`}
                fill="none"
                strokeWidth={1.3}
                className={`${FADE} stroke-[#0f1b2d]/40`}
              />
            )}
            {along > 1 && (
              <Label f={FB} at={[foot[0] / 2, foot[1] / 2]} dx={0} dy={13} className={`${FILL.teal} font-mono`}>
                {Math.round(along)}
              </Label>
            )}
            {across > 1 && (
              <Label f={FB} at={[foot[0] + (across / 2) * UHAT[0], foot[1] + (across / 2) * UHAT[1]]} dx={-6} dy={0} anchor="end" className={`${FILL.violet} font-mono`}>
                {Math.round(across)}
              </Label>
            )}
          </>
        )}
        <Arrow f={FB} from={O} to={whole} tone="coral" w={2.6} />
        {/* the whole 10 needs no tag of its own where a piece already is the whole 10 */}
        {(!broke || (along < 9.6 && across < 9.6)) && (
          <Label f={FB} at={[whole[0] / 2, whole[1] / 2]} dx={-5} dy={0} anchor="end" className={`${FILL.coral} font-mono`}>
            10
          </Label>
        )}
        <Label f={FB} at={whole} dx={0} dy={-7} anchor="middle" className={FILL.coral}>
          কুলি
        </Label>
      </Plane>
      {!broke ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={() => setBroke(true)} className={primaryBtn}>
            ধাক্কাটা ভাঙা যায় দুই টুকরোয়
          </button>
        </div>
      ) : (
        <>
          <div className="mx-auto mt-3 grid max-w-xs gap-1.5">
            <div className={`${FADE} flex items-center gap-1.5`}>
              <span className="w-[5.5rem] shrink-0 text-[0.65rem] leading-tight text-muted">রাস্তা বরাবর</span>
              <span className="h-2.5 rounded-full bg-cat-teal/70" style={{ width: along * 9.5 }} />
              <b className="font-mono text-sm text-cat-teal">{Math.round(along)}</b>
            </div>
            <div className={`${FADE} flex items-center gap-1.5`}>
              <span className="w-[5.5rem] shrink-0 text-[0.65rem] leading-tight text-muted">সোজা পাশে</span>
              <span className="h-2.5 rounded-full bg-cat-violet/70" style={{ width: across * 9.5 }} />
              <b className="font-mono text-sm text-cat-violet">{Math.round(across)}</b>
            </div>
          </div>
          <div className="mt-2 text-center text-sm text-muted">ধাক্কাটা ধরে ঘুরিয়ে দেখুন। রাস্তার টুকরো কখন পুরো 10? কখন শূন্য?</div>
        </>
      )}
      {!broke && <div className="mt-2 text-center text-sm text-muted">চাইলে ছবিতেই tap করে ধাক্কাটা অন্যদিকে ঘোরান।</div>}
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation: where a slanted push's strength
//      goes. The dashed line is the part that doesn't push the road; the piece
//      under it, on the road, is 6 — longer than ফাহিম's whole 5. That is how
//      the box mixes direction with strength.

const F4F = makeFrame(-0.6, 6.4, -0.6, 10.6, 13);
const KULI_FOOT: XY = [4.8, 3.6];
const X4_SAY = [
  "ফাহিম (4, 3): ঠিক রাস্তা বরাবর, জোর 5। কুলি (0, 10): রাস্তার সাথে 53° angle করে, জোর 10।",
  "কুলির ধাক্কার একটা অংশ রাস্তার কোনো কাজে লাগে না। ওই dot dot রেখাটা।",
  "রাস্তা সেটার কত অংশ পেলো? 6। ফাহিমের পুরো ধাক্কাও 5।",
];

export function RoadShadow() {
  const s = useScene(2, [600, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={F4F} label="কুলির বাঁকা ধাক্কা (0, 10) আর ফাহিমের সোজা ধাক্কা (4, 3)" className="my-0! max-w-none">
            <Road f={F4F} />
            <Van f={F4F} />
            <Arrow f={F4F} from={O} to={BEHIND} tone="blue" w={2.6} />
            <Arrow f={F4F} from={O} to={KULI} tone="coral" w={2.6} />
            <Label f={F4F} at={KULI} dx={0} dy={-7} anchor="middle" className={FILL.coral}>
              কুলি
            </Label>
            <Label f={F4F} at={[0, 5]} dx={-3} dy={0} anchor="end" className={`${FILL.coral} font-mono`}>
              10
            </Label>
            <Label f={F4F} at={BEHIND} dx={4} dy={12} anchor="start" className={FILL.blue}>
              ফাহিম
            </Label>
            <Label f={F4F} at={[2, 1.5]} dx={3} dy={4} anchor="start" className={`${FILL.blue} font-mono`}>
              5
            </Label>
            {k >= 1 && (
              <>
                <path d={`M${F4F.sx(KULI[0])} ${F4F.sy(KULI[1])}L${F4F.sx(KULI_FOOT[0])} ${F4F.sy(KULI_FOOT[1])}`} strokeDasharray="4 4" strokeWidth={1.3} className={`${FADE} stroke-[#0f1b2d]/40 fill-none`} />
                <Dot f={F4F} at={KULI_FOOT} r={2.6} className="fill-[#0f1b2d]/60" />
              </>
            )}
            {k >= 2 && (
              <>
                <Draw d={`M${F4F.sx(0.15)} ${F4F.sy(-0.2)}L${F4F.sx(KULI_FOOT[0] + 0.12)} ${F4F.sy(KULI_FOOT[1] - 0.09)}`} strokeWidth={5} className="stroke-cat-teal/40" />
                <Label f={F4F} at={KULI_FOOT} dx={5} dy={11} anchor="start" className={`${FILL.teal} font-mono`}>
                  6
                </Label>
              </>
            )}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {k >= 2 && (
            <>
              <div className={`${FADE} flex items-center gap-1.5`}>
                <span className="w-[5.5rem] shrink-0 text-[0.65rem] leading-tight text-muted">কুলির কাজের অংশ</span>
                <span className="h-2.5 rounded-full bg-cat-teal/70" style={{ width: 66 }} />
                <b className="font-mono text-sm text-cat-teal">6</b>
              </div>
              <div className={`${FADE} flex items-center gap-1.5`}>
                <span className="w-[5.5rem] shrink-0 text-[0.65rem] leading-tight text-muted">ফাহিমের পুরো ধাক্কা</span>
                <span className="h-2.5 rounded-full bg-cat-blue/70" style={{ width: 55 }} />
                <b className="font-mono text-sm text-cat-blue">5</b>
              </div>
            </>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation: the box on ±1 lists is a tug of
//      war. Each pair pulls its side — মিল right, অমিল left — and the knot sits
//      where the pulls balance. Equal means 0 means 90°; the 100 tosses pull
//      almost equally, so almost 90°.

const X5_PAIRS = [0, 1, 2, 3].map((i) => BLUE[i] * RED[i]);
const X5_INK = { pos: "#0d9488", neg: "#e11d48" };
const X5_SAY = [
  "নীল আর লাল coin-এর চার জোড়া: প্রতি জোড়া হয় মিল, নয় অমিল।",
  "মিল হলে +1। সেই জোড়া টানে ডান দিকে।",
  "অমিল হলে −1। ওরা টানে বাঁ দিকে।",
  "দুই দিকের টান সমান। ফাঁস জায়গায়। box এ 0, কোণ ঠিক 90°।",
  `এবার 100 জোড়া: মিল ${MATCH100}, অমিল ${100 - MATCH100}।`,
  "টান প্রায় সমান। box এ 4। তাই কোণ প্রায় 90°।",
];

export function CoinTug() {
  const s = useScene(5, [600, 1600, 1400, 2600, 2200, 2400]);
  const k = s.k;
  const [knot] = useTween([k === 1 ? 26 : k >= 4 ? (MATCH100 - (100 - MATCH100)) * 0.52 : 0], 800);
  /** a pair has left the rest row: the মিল ones at beat 1, the অমিল ones at beat 2 */
  const gone = (i: number) => k >= (X5_PAIRS[i] > 0 ? 1 : 2);
  /** each pair's place: above the rope at rest, then the n-th of its side stacks down that side */
  const x = (i: number) => {
    if (!gone(i)) return 96 + i * 36;
    const rank = X5_PAIRS.slice(0, i).filter((p) => (p > 0) === (X5_PAIRS[i] > 0)).length;
    return X5_PAIRS[i] > 0 ? 226 + rank * 20 : 74 - rank * 20;
  };
  const y = (i: number) => (!gone(i) ? 38 : 56 + (i % 2) * 20);
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <svg viewBox="0 0 300 132" aria-label="coin-এর জোড়া দুই দিকে টানে; টান সমান হলে ফাঁস মাঝে" className="mx-auto h-auto w-full max-w-[15rem] text-foreground">
        <line x1={22} x2={278} y1={84} y2={84} stroke="currentColor" strokeOpacity={0.3} strokeWidth={2} />
        {[-52, -26, 0, 26, 52].map((t) => (
          <line key={t} x1={150 + t} x2={150 + t} y1={80} y2={88} stroke="currentColor" strokeOpacity={0.35} strokeWidth={1} />
        ))}
        <text x={150} y={100} textAnchor="middle" fontSize={8} fill="currentColor" fillOpacity={0.6}>
          0
        </text>
        <g>
          <rect x={250} y={54} width={40} height={15} rx={7.5} fill="#0d9488" />
          <text x={270} y={64.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">
            মিল
          </text>
          <rect x={10} y={54} width={40} height={15} rx={7.5} fill="#e11d48" />
          <text x={30} y={64.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">
            অমিল
          </text>
        </g>
        <circle cx={150 + knot} cy={84} r={5.5} fill="#7c3aed" />
        {X5_PAIRS.map((p, i) => (
          <g key={i} style={{ transform: `translate(${x(i)}px, ${y(i)}px)`, transitionDuration: "800ms" }} className="transition-transform ease-in-out motion-reduce:transition-none">
            <circle r={8.5} fill={p > 0 ? X5_INK.pos : X5_INK.neg} opacity={k >= 4 ? 0.25 : 1} className="transition-opacity motion-reduce:transition-none" />
            <text y={3} textAnchor="middle" fontSize={9} fontWeight={700} fill="white" className="font-mono" opacity={k >= 4 ? 0.25 : 1}>
              {p > 0 ? "+1" : "−1"}
            </text>
          </g>
        ))}
        {k >= 4 && (
          <g className={POP}>
            <rect x={196} y={30} width={62} height={15} rx={7.5} fill="white" stroke="#0d9488" />
            <text x={227} y={40.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#0d9488">
              মিল {MATCH100}
            </text>
            <rect x={42} y={30} width={62} height={15} rx={7.5} fill="white" stroke="#e11d48" />
            <text x={73} y={40.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#e11d48">
              অমিল {100 - MATCH100}
            </text>
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={87} y={4} width={126} height={18} rx={9} fill="white" stroke="#7c3aed" />
            <text x={150} y={16.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={P_INK}>
              {k >= 5 ? `${MATCH100} − ${100 - MATCH100} = ${MATCH100 - (100 - MATCH100)}, প্রায় 90°` : k === 4 ? "মিল − অমিল = ?" : "মিল − অমিল = 0, কোণ ঠিক 90°"}
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5¾ · A figure for screen 5's review <Then>: perpendicularity needs no
//      picture. The drawn pair shows its right angle; নাসিব's four-slot coins
//      can't be drawn, but the box runs — and 0 means the right angle at any
//      size. The name lands last.

const F9F = makeFrame(-1.5, 3.6, -0.5, 3.5, 26);
const X9_SAY = [
  "আঁকা যায় এমন দুইটা arrow। কোণটা চোখেই পড়ে। ৯০ degree।",
  "নাসিবের চার ঘরের coin arrow আঁকা যায় না। কিন্তু box চলে: +1 − 1 − 1 + 1 = 0।",
  "একশো ঘরের arrow-ও আঁকা যায় না। কিন্তু box তো চলেই। উত্তর 0 মানেই ৯০ degree কোণ।",
  "এই পরীক্ষার নাম? u ⊥ v। মানে u perpendicular to v।",
];
const X9_PRODUCTS = ["+1", "−1", "−1", "+1"];

export function AnySize() {
  const s = useScene(3, [600, 2200, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X9_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={F9F} label="দুইটা arrow, কোণটা ৯০ degree কোণ" className={`my-0! max-w-none ${k >= 1 ? "opacity-40" : ""} transition-opacity motion-reduce:transition-none`}>
            <Arrow f={F9F} from={O} to={[3, 1]} tone="blue" w={2.6} />
            <Arrow f={F9F} from={O} to={[-1, 3]} tone="coral" w={2.6} />
            <Label f={F9F} at={[3, 1]} dx={3} dy={4} anchor="start" className={`${FILL.blue} font-mono`}>
              u
            </Label>
            <Label f={F9F} at={[-1, 3]} dx={0} dy={-6} anchor="middle" className={`${FILL.coral} font-mono`}>
              v
            </Label>
          </Plane>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 text-center">
          {k >= 1 && (
            <div className={`${FADE} rounded-xl border-2 border-border bg-surface px-2 py-1.5`}>
              <div className="font-mono text-[0.65rem] text-muted">(1, −1, 1, 1) · (1, 1, −1, 1)</div>
              <div className="mt-0.5 flex justify-center gap-1 font-mono text-sm font-bold">
                {X9_PRODUCTS.map((p, i) => (
                  <span key={i} className={BLUE[i] * RED[i] > 0 ? "text-accent-text" : "text-danger"}>
                    {p}
                  </span>
                ))}
                <span className="text-foreground">= 0</span>
              </div>
            </div>
          )}
          {k >= 2 && (
            <div className={`${FADE} rounded-xl border-2 border-border bg-surface px-2 py-1 text-xs`}>
              যত ঘরই হোক — <b className="font-mono">box চলে</b>
            </div>
          )}
          {k >= 3 && (
            <div className={`${POP} rounded-xl border-2 border-cat-violet/40 bg-surface px-2 py-1.5`}>
              <div className="font-mono text-sm font-bold text-cat-violet">u ⊥ v ⟺ u · v = 0</div>
              <div className="text-[0.65rem] text-muted">perpendicular · orthogonal</div>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, first half: মামী stood at exactly
//      90°, so all her sweat only squeezed the van sideways — the box said 0.
//      রফিক leaned past 90°, to 98°, and was quietly pushing it back.

const F6F = makeFrame(-6, 5.2, -1.2, 5.6, 17);
const X6_SAY = [
  "মামী ছিলেন ঠিক 90° কোণে: 4 × (−3) + 3 × 4 = 0।",
  "ঘাম ঝরিয়েছেন ঠিকই। কিন্তু ভ্যানটাকে চেপেছেন শুধু পাশে।",
  "রফিক 98°-এ। 90° পেরিয়ে গেছে। তাই একটু একটু পেছনে ঠেলছিল, −5।",
];

export function SidePress() {
  const s = useScene(2, [600, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      <div className="mx-auto w-[11.5rem]">
        <Plane f={F6F} label="মামীর ধাক্কা (−3, 4) আর রফিকের ধাক্কা (−5, 5), রাস্তার সাথে" className="my-0! max-w-none">
          <Road f={F6F} />
          <Van f={F6F} />
          <Arrow f={F6F} from={O} to={[-3, 4]} tone="violet" w={2.6} />
          <Label f={F6F} at={[-3, 4]} dx={0} dy={-8} anchor="middle" className={FILL.violet}>
            মামী
          </Label>
          <Label f={F6F} at={[-3, 4]} dx={0} dy={12} anchor="middle" className={`${FILL.violet} font-mono`}>
            0
          </Label>
          {k >= 1 && (
            <>
              <RightAngle f={F6F} to={[-3, 4]} />
              <g transform={`translate(${F6F.sx(0)} ${F6F.sy(0)}) rotate(${-ROAD_DEG})`} className={`${FADE} pointer-events-none`}>
                <path d="M-17 -6q5 3 10 0M-17 6q5 -3 10 0" fill="none" stroke="#7c3aed" strokeWidth={1.6} strokeLinecap="round" />
              </g>
              <Label f={F6F} at={[-1.7, 2.6]} dx={0} dy={-4} anchor="middle" size={8.5} className={FILL.violet}>
                পাশে চাপ
              </Label>
            </>
          )}
          {k >= 2 && (
            <>
              <Arrow f={F6F} from={O} to={[-5, 5]} tone="coral" w={2.6} draw />
              <AngleArc f={F6F} to={[-5, 5]} />
              <Label f={F6F} at={[-5, 5]} dx={-2} dy={-7} anchor="middle" className={FILL.coral}>
                রফিক
              </Label>
              <Label f={F6F} at={[-5, 5]} dx={-2} dy={12} anchor="middle" className={`${FILL.coral} font-mono`}>
                −5
              </Label>
              <Arrow f={F6F} from={[1.05, 0.79]} to={[0.25, 0.19]} tone="coral" w={1.8} faint draw />
              <Label f={F6F} at={[1.05, 0.79]} dx={2} dy={-2} anchor="start" size={8} className={FILL.coral}>
                একটু পেছনে
              </Label>
            </>
          )}
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 6¾ · A figure for screen 6's explanation, second half: add the five pushes
//      tip-to-tail (৩.১) and the total arrow (3, 18) lands far off the road —
//      yet its box with the road is the same 66 as the five numbers added one
//      by one. First add then box, or first box then add: same answer.

const F7F = makeFrame(-3.5, 11.5, -0.8, 18.4, 8.4);
const X7_CHAIN: XY[] = (() => {
  let x = 0;
  let y = 0;
  return [O, ...CREW.map((c) => ((x += c.v[0]), (y += c.v[1]), [x, y] as XY))];
})();
const X7_SAY = [
  "পাঁচজনের ধাক্কা প্রথমে লাগছে একই বিন্দুতে। দেখুন, সব arrow একই জায়গায়।",
  "এবার যোগ, ৩.১-এর মতো। একটার ঘাড়ে আরেকটা বসাই। arrow-গুলো একটার পর একটা stack হচ্ছে।",
  "শেষে পৌঁছানো গেল (3, 18)-এ। শুরু থেকে শেষ, এটাই final arrow। সব arrow-এর যোগফল।",
  "মোট arrow-টা রাস্তার সাথে box এ: 12 + 54 = 66।",
  "আলাদা আলাদা নম্বরগুলোর যোগফল? সেটাও 66। আগে যোগ পরে box, উত্তর একই।",
];

export function SumThenBox() {
  const s = useScene(5, [600, 2000, 2000, 2000, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X7_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={F7F} label="একই বিন্দু থেকে arrow-গুলো একটার ঘাড়ে আরেকটা বসিয়ে যোগ, final arrow (3, 18)" className="my-0! max-w-none" grid={0}>
            <Road f={F7F} />
            <Van f={F7F} />
            {k === 0 && (
              <>
                {CREW.map((c) => (
                  <Arrow key={`base-${c.name}`} f={F7F} from={O} to={c.v} tone={c.tone} w={2.4} />
                ))}
              </>
            )}
            {k >= 1 && (
              <>
                {CREW.map((c, i) =>
                  i < 2 || k >= 2 ? (
                    <Arrow key={`chain-${c.name}`} f={F7F} from={X7_CHAIN[i]} to={X7_CHAIN[i + 1]} tone={c.tone} w={2.4} draw={i >= 2} />
                  ) : null,
                )}
              </>
            )}
            {k >= 3 && (
              <>
                <Arrow f={F7F} from={O} to={X7_CHAIN[5]} tone="violet" w={3.4} draw />
                <Label f={F7F} at={X7_CHAIN[5]} dx={2} dy={-5} anchor="start" className={`${FILL.violet} font-mono`}>
                  (3, 18)
                </Label>
                <Label f={F7F} at={[1.5, 9]} dx={0} dy={0} anchor="middle" size={8.5} className={`${FILL.violet} font-mono`}>
                  ফাইনাল যোগফল
                </Label>
              </>
            )}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          {k >= 3 && (
            <div className={`${FADE} rounded-xl border-2 border-cat-violet/40 bg-surface px-2 py-1.5 text-center`}>
              <div className="text-[0.65rem] text-muted">মোট arrow দিয়ে</div>
              <div className="font-mono text-xs font-bold">(4, 3) · (3, 18)</div>
              <div className="font-mono text-xs">= 12 + 54 = 66</div>
            </div>
          )}
          {k >= 4 && (
            <div className={`${FADE} rounded-xl border-2 border-border bg-surface px-2 py-1.5 text-center`}>
              <div className="text-[0.65rem] text-muted">আলাদা করে</div>
              <div className="font-mono text-xs">25 + 30 + 16 + 0 − 5</div>
              <div className="font-mono text-xs font-bold">= 66</div>
            </div>
          )}
          {k >= 4 && (
            <div className={`${POP} mx-auto w-fit rounded-full bg-accent/15 px-2.5 py-0.5 text-center text-xs font-semibold text-accent-text`}>
              উত্তর একই
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 12a · A story scene for the finale's last paragraphs, no task: dinner, and
//      মামী's needle — the sign tells the angle, but why? There's no
//      protractor inside the box. মামা smiles: a tape and a protractor will do
//      it, tomorrow noon on the roof. ফাহিম doesn't believe him. 4.3's bet.

export function DinnerBet({}: Story) {
  const s = useScene(4, [600, 2400, 2400, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="রাতের খাবারে মামী খোঁচা দিলেন; মামা ফিতা আর চাঁদার বাজি ধরলেন">
        <path d="M160 0V18" stroke={P_INK} strokeWidth={1.2} />
        <circle cx={160} cy={25} r={5} fill="#fde047" />
        <circle cx={160} cy={25} r={9} fill="#fde047" opacity={0.25} />
        <Person who="mami" x={116} y={PG} arm={k >= 1 && k < 3 ? "point" : "down"} mood={k >= 3 ? "happy" : "plain"} label />
        <Person who="mama" x={164} y={PG} arm={k >= 3 ? "hold" : "down"} mood={k >= 3 ? "happy" : "plain"} label />
        <Person who="fahim" x={212} y={PG} mood={k >= 3 ? "puzzled" : "plain"} label />
        <rect x={88} y={PG - 30} width={144} height={4} rx={1} fill="#92400e" />
        <rect x={94} y={PG - 26} width={3} height={26} fill="#78350f" />
        <rect x={223} y={PG - 26} width={3} height={26} fill="#78350f" />
        {[116, 164, 212].map((px) => (
          <ellipse key={px} cx={px} cy={PG - 33} rx={8} ry={2.4} fill="white" stroke="#94a3b8" strokeWidth={0.7} />
        ))}
        {k >= 3 && (
          <>
            <g className={POP}>
              <g transform="translate(190 120)">
                <P_Protractor />
              </g>
            </g>
            <P_Carry x={176} y={PG - 46} ms={700}>
              <g className={POP}>
                <P_Tape />
              </g>
            </P_Carry>
          </>
        )}
        {k >= 1 && k < 3 && <Bubble x={116} y={PG - 66} side="right" lines={k === 1 ? ["০ এর বড় না ছোট তো কোণের information দেয়।", "কিন্তু কেন?"] : ["কোণের information আসবে কোথা থেকে?", "box এ তো কোনো চাঁদাই নাই!"]} />}
        {k >= 3 && <Bubble x={164} y={PG - 66} side="left" lines={["ফিতা আর একটা চাঁদাই হবে।", "কাল দুপুরে ছাদে!"]} />}
        {k >= 3 && (
          <text x={212} y={PG - 78} textAnchor="middle" fontSize={24} fontWeight={800} fill={P_INK} className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Shared bits for the new stage scenes below: the evening sky's clouds, the
// mud patch, and the storm cloud that gathers as the van sinks.

/** the two light clouds of an evening stage */
function P_Clouds() {
  return (
    <g className="pointer-events-none">
      <ellipse cx={70} cy={32} rx={26} ry={8} fill="#94a3b8" opacity={0.45} />
      <ellipse cx={238} cy={24} rx={20} ry={6} fill="#94a3b8" opacity={0.45} />
    </g>
  );
}

/** the muddy road, with the patch of mud centred at `cx` */
function P_Mud({ cx }: { cx: number }) {
  return (
    <g className="pointer-events-none">
      <rect y={PG - 3} width={320} height={12} fill="#d6c08f" />
      <ellipse cx={cx} cy={PG + 2} rx={64} ry={7} fill="#6b4f2a" />
    </g>
  );
}

/** mud closing over the van's three wheels, the left end of its bed at x */
function P_Sunk({ x }: { x: number }) {
  return (
    <g className={`${FADE} pointer-events-none`}>
      {[16, 54, 94].map((dx) => (
        <ellipse key={dx} cx={x + dx} cy={PG + 3} rx={12} ry={4.5} fill="#5b4122" />
      ))}
    </g>
  );
}

/** a dark storm cloud, with a lightning bolt when `bolt` */
function P_Storm({ bolt = false }: { bolt?: boolean }) {
  return (
    <g className={`${FADE} pointer-events-none`}>
      <ellipse cx={150} cy={30} rx={40} ry={11} fill="#475569" opacity={0.8} />
      <ellipse cx={128} cy={34} rx={22} ry={8} fill="#334155" opacity={0.8} />
      {bolt && <path d="M150 40l-7 14h7l-5 14" fill="none" stroke="#fde047" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={FADE} />}
    </g>
  );
}

/** the little strain marks by the wheels when a push doesn't move the van */
function P_Strain({ x }: { x: number }) {
  return <path d={`M${x - 4} ${PG - 4}q-5 -7 -11 -6M${x + 98} ${PG - 4}q5 -7 11 -6`} fill="none" stroke="#6b4f2a" strokeWidth={2} strokeLinecap="round" className={FADE} />;
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the van leaves the হাট
//      with everyone on it, sinks in the mud halfway, মামা jumps down and
//      shouts, and five people push from all round. The van doesn't move.
//      Nobody's push is judged here; that is the whole journey's bet.

/** riders on the van's bed, by their offset from its left end */
const S1_RIDE: { who: "mama" | "fahim" | "mami" | "samin"; dx: number }[] = [
  { who: "mama", dx: 12 },
  { who: "fahim", dx: 28 },
  { who: "mami", dx: 44 },
  { who: "samin", dx: 60 },
];

export function VanSinks({}: Story) {
  const s = useScene(4, [600, 1800, 1400, 2800]);
  const k = s.k;
  const vx = k >= 1 ? 110 : -4;
  const vy = PG + (k >= 2 ? 5 : 0);
  const ms = 1600;
  /** where each rider is: on the bed until they get down (মামা at beat 3, the rest at 4) */
  const at = (who: string, down: XY, dx: number): { x: number; y: number; scale: number } =>
    k >= (who === "mama" ? 3 : 4) ? { x: down[0], y: down[1], scale: 1 } : { x: vx + dx, y: vy - 32, scale: 0.55 };
  const down: Record<string, XY> = { mama: [36, PG], fahim: [80, PG], mami: [146, PG + 6], samin: [184, PG + 6] };
  const chacha = k >= 4 ? { x: 226, y: PG, scale: 1 } : { x: vx + 80, y: vy - 40, scale: 0.55 };
  const push = k >= 4;
  const side = S1_RIDE.filter((r) => r.who === "mami" || r.who === "samin").map((r) => {
    const p = at(r.who, down[r.who], r.dx);
    return <Person key={r.who} who={r.who} x={p.x} y={p.y} scale={p.scale} ms={900} facing={r.who === "samin" && push ? -1 : 1} mood={push ? "shout" : "plain"} />;
  });
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="হাট থেকে ফেরার ভ্যান কাদায় বসে গেল; মামা নেমে সবাইকে ঠেলতে বললেন, পাঁচজন ঠেলছে, ভ্যান নড়ে না">
        <P_Clouds />
        {k >= 2 && <P_Storm />}
        <P_Mud cx={160} />
        {/* মামী and রফিক ride behind the bed's rail, then push from the near side, in front of it */}
        {!push && side}
        <P_Carry x={vx} y={vy} ms={ms}>
          <P_Van x={0} y={0} />
        </P_Carry>
        {k >= 2 && <P_Sunk x={vx} />}
        {push && side}
        {S1_RIDE.filter((r) => r.who === "mama" || r.who === "fahim").map((r) => {
          const p = at(r.who, down[r.who], r.dx);
          const off = k >= (r.who === "mama" ? 3 : 4);
          return <Person key={r.who} who={r.who} x={p.x} y={p.y} scale={p.scale} ms={off ? 900 : ms} mood={k >= 3 && r.who === "mama" ? "shout" : push ? "shout" : "plain"} arm={k === 3 && r.who === "mama" ? "wave" : "down"} label={off} />;
        })}
        <Person who="karim" x={chacha.x} y={chacha.y} scale={chacha.scale} ms={900} facing={push ? -1 : 1} mood={push ? "shout" : "plain"} />
        {push && (
          <>
            <P_Name x={226} text="চাচা" />
            <P_Name x={146} y={PG + 6} text="মামী" />
            <P_Name x={184} y={PG + 6} text="রফিক" />
            <P_Push x={36} facing={1} />
            <P_Push x={80} facing={1} />
            <P_Push x={226} facing={-1} />
            <P_Strain x={vx} />
          </>
        )}
        {k === 3 && <Bubble x={36} y={PG - 66} side="right" lines={["সবাই ঠেলো! যে যেদিক", "থেকে পারো ঠেলো!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: মামী and রফিক both push
//      "from the side", and by eye nobody can say whose push is worth what.
//      But the road's arrow and a push's arrow are both lists, and the box
//      turns two lists into one number. Which number stays a "?" — screen 2
//      tries it on the simplest case first.

const FB = makeFrame(-6, 5, -1, 6, 14);
const X1_MAMI = CREW[3];
const X1_RAFIQ = CREW[4];
const X1_SAY = [
  "মামী আর রফিক, দুইজনই মোটামুটি পাশ থেকে ঠেলছে।",
  "কার ধাক্কা কতটা কাজের? চোখে দেখে বলা মুশকিল।",
  "রাস্তার arrow আর কারো ধাক্কার arrow, দুইটাই তো list।",
  "box এ দিলে বের হবে একটা সংখ্যা। সেটা দিয়ে কি ধাক্কাটা মাপা যায়?",
];

export function PushToBox() {
  const s = useScene(3, [600, 2200, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[9rem] shrink-0">
          <Plane f={FB} label="কাদার রাস্তায় ভ্যান; মামী আর রফিকের ধাক্কা পাশ থেকে" className="my-0! max-w-none">
            <Road f={FB} />
            <Van f={FB} />
            {CREW.slice(0, 3).map((c) => (
              <Arrow key={c.name} f={FB} from={O} to={c.v} tone={c.tone} w={1.8} faint />
            ))}
            {[X1_MAMI, X1_RAFIQ].map((c) => (
              <g key={c.name}>
                <Arrow f={FB} from={O} to={c.v} tone={c.tone} w={2.6} />
                <Label f={FB} at={c.v} dx={0} dy={-8} anchor="middle" className={FILL[c.tone]}>
                  {c.name}
                </Label>
                {k >= 1 && (
                  <Label f={FB} at={c.v} dx={c === X1_RAFIQ ? -12 : 12} dy={8} anchor="middle" size={14} weight={800} className={`${POP} fill-[#0f1b2d]`}>
                    ?
                  </Label>
                )}
              </g>
            ))}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 text-center">
          {k === 2 && (
            <>
              <div className={`${FADE} rounded-xl border-2 border-[#a16207]/40 bg-surface px-2 py-1`}>
                <div className="text-[0.65rem] text-muted">রাস্তা</div>
                <div className="font-mono text-sm font-bold">{tupN(ROAD)}</div>
              </div>
              <div className={`${FADE} rounded-xl border-2 border-cat-coral/40 bg-surface px-2 py-1`}>
                <div className="text-[0.65rem] text-cat-coral">{X1_RAFIQ.name}</div>
                <div className="font-mono text-sm font-bold">{tupN(X1_RAFIQ.v)}</div>
              </div>
            </>
          )}
          {k >= 3 && (
            <div className={`${POP} rounded-2xl border-2 border-cat-amber/40 bg-cat-amber/5 px-2 py-2`}>
              <div className="text-[0.65rem] text-muted">box</div>
              <div className="font-mono text-xs">
                {tupN(ROAD)} · {tupN(X1_RAFIQ.v)}
              </div>
              <div className="mt-1 font-mono text-xl font-bold">= ?</div>
              <div className="text-[0.65rem] text-muted">একটা সংখ্যা</div>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation, the last paragraph: plus doesn't
//      mean "exactly the same way". The push swings 53° off the road and the
//      number only shrinks, 25 to 15, still plus; then the whole side within
//      90° of the road lights up — anywhere in it, plus.

/** the part of the sheet within 90° of the road (where the box says plus), as a path */
function plusSide(f: Frame) {
  const c: XY[] = [
    [f.x0, f.y0],
    [f.x1, f.y0],
    [f.x1, f.y1],
    [f.x0, f.y1],
  ];
  const g = (p: XY) => dot(ROAD, p);
  const out: XY[] = [];
  c.forEach((p, i) => {
    const q = c[(i + 1) % 4];
    if (g(p) >= 0) out.push(p);
    if (g(p) >= 0 !== g(q) >= 0) {
      const t = g(p) / (g(p) - g(q));
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  });
  return out.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0])} ${f.sy(p[1])}`).join("") + "Z";
}

const X3P_SAY = [
  "রাস্তা বরাবর ঠেললে নম্বর +25।",
  "এবার রাস্তা থেকে 53° সরে দাঁড়ালাম। নম্বর কমলো, তবু plus: 15।",
  "Plus মানে শুধু “মোটামুটি একই দিকে”। 90°-এর ভেতরে যেকোনো জায়গা, পুরোটাই plus।",
];

export function PlusSide() {
  const s = useScene(2, [600, 2600]);
  const k = s.k;
  const [th] = useTween([k >= 1 ? 90 : ROAD_DEG], 1400);
  const r = (th * Math.PI) / 180;
  const v: XY = [5 * Math.cos(r), 5 * Math.sin(r)];
  const n = Math.round(dot(ROAD, v));
  const off = Math.round(th - ROAD_DEG);
  return (
    <Scene scene={s} caption={say(X3P_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[9rem] shrink-0">
          <Plane f={F3F} label="একই জোরের ধাক্কা রাস্তা থেকে 53° সরে গেল; রাস্তার 90°-এর ভেতরের পুরো দিকটা plus" className="my-0! max-w-none">
            {k >= 2 && (
              <>
                <path d={plusSide(F3F)} className={`${FADE} fill-cat-teal/15`} />
                <path
                  d={`M${F3F.sx(-3.3)} ${F3F.sy(4.4)}L${F3F.sx(3.3)} ${F3F.sy(-4.4)}`}
                  strokeWidth={1.3}
                  strokeDasharray="4 4"
                  className={`${FADE} fill-none stroke-[#0f1b2d]/45`}
                />
                <Label f={F3F} at={[3.4, -3.3]} dx={0} dy={0} anchor="middle" size={10} weight={700} className={`${FADE} fill-[#0f766e]`}>
                  plus
                </Label>
              </>
            )}
            <Road f={F3F} />
            <Van f={F3F} />
            {k >= 1 && <Arrow f={F3F} from={O} to={ROAD} tone="blue" w={1.8} faint />}
            <Arrow f={F3F} from={O} to={v} tone="blue" w={2.6} />
            {k >= 1 && off > 50 && <AngleArc f={F3F} to={[0, 5]} />}
          </Plane>
        </div>
        <div className="w-[5.5rem] shrink-0 text-center">
          <div className="text-[0.65rem] text-muted">box এ</div>
          <div className="font-mono text-2xl font-bold text-cat-blue tabular-nums">{signed(n)}</div>
          <div className="text-[0.65rem] text-muted">
            রাস্তা থেকে <span className="font-mono">{off}°</span>
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's explanation, the movie-club callback (৩.৬):
//      মামা (2, 5) loves comedy, Mr. Bean (1, 4) leans his way, Titanic (5, 2)
//      looks elsewhere but is long. The box still gives 22 against 20: Titanic
//      nearly won on strength alone. How to trim the strength off is left open.

const FT = makeFrame(-0.4, 5.8, -0.4, 5.8, 17);
const X4T_FILMS: { name: string; v: XY; tone: Tone; n: number; dx: number; dy: number; anchor: "start" | "middle" | "end" }[] = [
  { name: "মামা", v: [2, 5], tone: "teal", n: 0, dx: 4, dy: 4, anchor: "start" },
  { name: "Mr. Bean", v: [1, 4], tone: "blue", n: 22, dx: -3, dy: 0, anchor: "end" },
  { name: "Titanic", v: [5, 2], tone: "coral", n: 20, dx: 0, dy: -7, anchor: "end" },
];
const X4T_SAY = [
  "৩.৬-এর movie club। মামার পছন্দ (2, 5), পাশেই Mr. Bean (1, 4)।",
  "Titanic (5, 2) তাকিয়ে আছে অন্য দিকে, কিন্তু দুইটা score-ই বড় বড়।",
  "তবু box এ Mr. Bean 22, Titanic 20। প্রায় জিতে যাচ্ছিল, শুধু জোরের জোরে।",
  "ছবি বাছতে চাই শুধু “কতটা একই দিকে”। জোরটা ছেঁটে ফেলবো কীভাবে? সেটা সামনের journey-র কাজ।",
];

export function TitanicStrength() {
  const s = useScene(3, [600, 2000, 2400, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X4T_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8rem] shrink-0">
          <Plane f={FT} label="মামার পছন্দ (2, 5), Mr. Bean (1, 4), Titanic (5, 2); ঘর দুইটা drama আর comedy" className="my-0! max-w-none">
            <Label f={FT} at={[5.6, 0]} dx={0} dy={11} anchor="end" size={8} weight={500} className="fill-[#0f1b2d]/60">
              drama
            </Label>
            <Label f={FT} at={[0, 5.6]} dx={4} dy={2} anchor="start" size={8} weight={500} className="fill-[#0f1b2d]/60">
              comedy
            </Label>
            {X4T_FILMS.map((m, i) =>
              i < 2 || k >= 1 ? (
                <g key={m.name}>
                  <Arrow f={FT} from={O} to={m.v} tone={m.tone} w={2.6} draw={i === 2} />
                  <Label f={FT} at={m.v} dx={m.dx} dy={m.dy} anchor={m.anchor} size={9} className={FILL[m.tone]}>
                    {m.name}
                  </Label>
                </g>
              ) : null,
            )}
            {k >= 3 && (
              <Label f={FT} at={[3.4, 1.36]} dx={2} dy={14} anchor="middle" size={13} weight={800} className={`${POP} fill-[#0f1b2d]`}>
                ?
              </Label>
            )}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {k >= 2 &&
            X4T_FILMS.slice(1).map((m) => (
              <div key={m.name} className={`${FADE} ${k >= 3 && m.n === 20 ? "" : k >= 3 ? "opacity-50" : ""} transition-opacity motion-reduce:transition-none`}>
                <div className={`text-[0.65rem] font-semibold ${TEXT[m.tone]}`}>{m.name}</div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 rounded-full ${m.tone === "blue" ? "bg-cat-blue/70" : "bg-cat-coral/70"}`} style={{ width: m.n * 3.4 }} />
                  <b className="font-mono text-sm">{m.n}</b>
                </div>
              </div>
            ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: চাচা catches his breath,
//      and ফাহিম remembers নাসিব tossing two coins (2.7) — head +1, tail −1,
//      four tosses, two four-slot arrows. He can't draw them. Whether the box
//      can still find the angle is the screen's question; nothing answers it.

export function CoinMemory({}: Story) {
  const s = useScene(3, [600, 2000, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="চাচা দম নিচ্ছেন; ফাহিমের মনে পড়লো নাসিবের দুইটা coin, চার ঘরের দুইটা arrow, যা কাগজে আঁকা যায় না">
        <P_Clouds />
        <P_Mud cx={60} />
        <g transform="translate(0 5)">
          <P_Van x={8} y={PG} />
        </g>
        <P_Sunk x={8} />
        <Person who="karim" x={128} y={PG} facing={-1} mood="sad" />
        <P_Name x={128} text="চাচা" />
        <g fill="#38bdf8" className="pointer-events-none">
          <path d="M116 86q-2 4 0 5q2 -1 0 -5Z" />
          <path d="M141 90q-2 4 0 5q2 -1 0 -5Z" />
        </g>
        <Person who="fahim" x={176} y={PG} mood={k >= 3 ? "puzzled" : "plain"} arm={k >= 3 ? "hold" : "down"} label />
        {k >= 1 && (
          <g className={FADE}>
            <circle cx={192} cy={92} r={2.2} fill="white" stroke={P_INK} strokeOpacity={0.35} />
            <circle cx={200} cy={84} r={3} fill="white" stroke={P_INK} strokeOpacity={0.35} />
            <rect x={206} y={40} width={108} height={112} rx={14} fill="white" fillOpacity={0.6} stroke={P_INK} strokeOpacity={0.35} strokeDasharray="3 2" />
            <Person who="nasib" x={236} y={144} scale={0.75} arm="wave" mood="happy" />
            <text x={236} y={152} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={P_INK}>
              নাসিব
            </text>
          </g>
        )}
        {k === 1 && (
          <g className={POP}>
            <circle cx={268} cy={76} r={8} fill="#2563eb" />
            <text x={268} y={79} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white" fontFamily="ui-monospace, monospace">
              +1
            </text>
            <circle cx={292} cy={100} r={8} fill="#e11d48" />
            <text x={292} y={103} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white" fontFamily="ui-monospace, monospace">
              −1
            </text>
          </g>
        )}
        {k >= 2 && (
          <>
            <Card x={260} y={58} text={`(${BLUE.map(num).join(", ")})`} tone="blue" />
            <Card x={260} y={80} text={`(${RED.map(num).join(", ")})`} tone="coral" />
          </>
        )}
        {k >= 3 && (
          <>
            <g className={POP}>
              <rect x={181} y={94} width={22} height={18} rx={1.5} fill="white" stroke={P_INK} strokeOpacity={0.5} />
              <path d="M184 106h16M188 97v13" stroke={P_INK} strokeOpacity={0.4} strokeWidth={0.8} />
              <text x={195} y={105} textAnchor="middle" fontSize={10} fontWeight={800} fill="#dc2626">
                ?
              </text>
            </g>
            <Bubble x={170} y={PG - 66} side="left" tone="think" lines={["চার ঘরের arrow", "আঁকবো কীভাবে?"]} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: চাচা has his breath back,
//      the sky rumbles, and he sets the bar — all the pushes together need at
//      least 80. The road's (4, 3) goes up, and a "?" over each of the five:
//      judging them is the reader's job. No verdict here.

const S6_CREW: { who: "mama" | "fahim" | "mami" | "samin" | "karim"; name: string; x: number; y: number; facing: 1 | -1 }[] = [
  { who: "mami", name: "মামী", x: 146, y: PG + 6, facing: 1 },
  { who: "samin", name: "রফিক", x: 184, y: PG + 6, facing: -1 },
  { who: "mama", name: "মামা", x: 36, y: PG, facing: 1 },
  { who: "fahim", name: "ফাহিম", x: 80, y: PG, facing: 1 },
  { who: "karim", name: "চাচা", x: 236, y: PG, facing: -1 },
];

export function EightyNeeded({}: Story) {
  const s = useScene(3, [600, 1600, 2600]);
  const k = s.k;
  const person = (c: (typeof S6_CREW)[number]) => (
    <g key={c.who}>
      <Person
        who={c.who}
        x={c.x}
        y={c.y}
        facing={c.facing}
        mood={c.who === "karim" && k === 0 ? "sad" : k === 1 ? "puzzled" : "plain"}
        arm={c.who === "karim" && k === 2 ? "wave" : "down"}
      />
      <P_Name x={c.x} y={c.y} text={c.name} />
      {k >= 3 && (
        <text x={c.x} y={c.y - 72} textAnchor="middle" fontSize={15} fontWeight={800} fill={P_INK} className={POP}>
          ?
        </text>
      )}
    </g>
  );
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="আকাশে মেঘ ডাকছে; চাচা বলছেন সবার ধাক্কা মিলে অন্তত 80 লাগবে; রাস্তা (4, 3), পাঁচজনের মাথায় প্রশ্ন">
        <P_Clouds />
        {k >= 1 && <P_Storm bolt={k < 3} />}
        <P_Mud cx={160} />
        <g transform="translate(0 5)">
          <P_Van x={110} y={PG} />
        </g>
        <P_Sunk x={110} />
        {S6_CREW.map(person)}
        {k === 2 && <Bubble x={236} y={PG - 66} side="left" lines={["সবার ধাক্কা মিলে", "অন্তত 80 লাগবে!"]} />}
        {k >= 3 && (
          <>
            <text x={143} y={59.5} textAnchor="end" fontSize={9} fontWeight={700} fill="#a16207" className={FADE}>
              রাস্তা
            </text>
            <Card x={170} y={56} text="(4, 3)" tone="amber" />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 12½ · A story scene for the finale's first paragraph: মামী pushing at the
//       side (0) and রফিক from the front (−5), as the numbers said. Both go
//       round the back, everyone pushes, and the van comes out of the mud.

const S12_BEFORE: Record<string, number> = { mama: 30, fahim: 70, karim: 110, mami: 196, samin: 280 };
const S12_BEHIND: Record<string, number> = { mama: 20, fahim: 48, karim: 76, mami: 104, samin: 130 };
const S12_WHO: ("mama" | "fahim" | "karim" | "mami" | "samin")[] = ["mama", "fahim", "karim", "mami", "samin"];

export function VanOut({}: Story) {
  const s = useScene(3, [600, 2000, 1800]);
  const k = s.k;
  const vx = k >= 2 ? 216 : 150;
  const x = (w: string) => (k === 0 ? S12_BEFORE[w] : S12_BEHIND[w] + (k >= 2 ? 58 : 0));
  const y = (w: string) => (k === 0 && w === "mami" ? PG + 6 : PG);
  const guy = (w: (typeof S12_WHO)[number]) => (
    <Person
      key={w}
      who={w}
      x={x(w)}
      y={y(w)}
      facing={k === 0 && w === "samin" ? -1 : 1}
      walking={(k === 1 && (w === "mami" || w === "samin")) || k === 2}
      ms={1600}
      mood={k >= 3 ? "happy" : k >= 1 ? "shout" : "plain"}
      arm={k >= 3 && (w === "mama" || w === "fahim") ? "wave" : "down"}
    />
  );
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="মামী আর রফিক পেছনে গিয়ে সবার সাথে ঠেললেন; ভ্যান কাদা থেকে উঠে গেল">
        <P_Clouds />
        <P_Mud cx={176} />
        <P_Carry x={vx} y={PG + (k >= 2 ? 0 : 5)} ms={1600}>
          <P_Van x={0} y={0} />
        </P_Carry>
        {k < 2 && <P_Sunk x={150} />}
        {S12_WHO.map(guy)}
        {k === 0 && (
          <>
            {["mama", "fahim", "karim"].map((w) => (
              <P_Push key={w} x={S12_BEFORE[w]} facing={1} />
            ))}
            <P_Push x={280} facing={-1} />
            <g className={POP}>
              <rect x={186} y={80} width={20} height={14} rx={7} fill="white" stroke="#7c3aed" strokeWidth={1.2} />
              <text x={196} y={90} textAnchor="middle" fontSize={9} fontWeight={700} fill="#7c3aed" fontFamily="ui-monospace, monospace">
                0
              </text>
            </g>
            <Card x={280} y={74} text="−5" tone="coral" />
          </>
        )}
        {k === 1 && <P_Push x={S12_BEHIND.samin} facing={1} />}
        {k === 2 && <path d={`M${vx - 8} ${PG - 6}q-7 -6 -14 -4M${vx - 6} ${PG - 16}q-8 -4 -14 0`} fill="none" stroke="#6b4f2a" strokeWidth={1.6} strokeLinecap="round" className={FADE} />}
        {k === 0 && S12_WHO.map((w) => <P_Name key={w} x={x(w)} y={y(w)} text={w === "samin" ? "রফিক" : w === "karim" ? "চাচা" : w === "mami" ? "মামী" : w === "mama" ? "মামা" : "ফাহিম"} ms={1600} />)}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// The review questions, rebuilt as visual exercises (each was a text <Check>):
// 0 the warm-up box, 2b the table, 4b the coin needle, 5b the hundred-slot
// arrows, 6b the three-slot arrows. Every pick plays out what it would mean,
// a wrong one honestly, and the right one passes from the play's end. Each
// has a figure for its <Then> beside it (0½, 2b½, 4b½, 6b½).

/** a thing that drops into place when it mounts */
const P_DROP = "inline-block transition duration-500 motion-reduce:transition-none starting:-translate-y-3 starting:opacity-0";
const P_OK = "#0d9488";
const P_BAD = "#e11d48";

/**
 * A pick that plays out in beats 1…end after the tap (at once under reduced
 * motion). A preview seeded with `pick` opens on the last beat. `over` is true
 * once the play has landed, which is when the verdict shows.
 */
function useP_Pick(end: number, ms: number) {
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const p = usePlay(ms);
  const beat = p.running || p.k > 0 ? p.k : pick !== null ? end : 0;
  const go = (i: number, right: number, win: () => void) => {
    setPick(i);
    const done = () => (i === right ? win() : setMiss((m) => m + 1));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      p.play(end, undefined, end);
      done();
    } else p.play(end, done);
  };
  const look = (i: number, right: number): Look => (pick !== i ? "idle" : beat < end ? "picked" : i === right ? "right" : "wrong");
  return { pick, beat, miss, over: pick !== null && beat >= end, go, look };
}

/** A compact picture/number option for a row of three (Choice's letter badge leaves no room there). */
function P_Opt({ look, disabled, onClick, children }: { look: Look; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-11 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-1.5 py-1.5 text-center transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look]}`}
    >
      {children}
    </button>
  );
}

/** A question heading over an exercise, in the page's own size. */
function P_Ask({ children }: { children: ReactNode }) {
  return <div className="text-center text-lg leading-snug font-semibold text-balance">{children}</div>;
}

/** A plain arrow on a stage or sheet, from (x1, y1) to (x2, y2). */
function P_Line({ x1, y1, x2, y2, ink, w = 2.4, dashed = false, className = "" }: { x1: number; y1: number; x2: number; y2: number; ink: string; w?: number; dashed?: boolean; className?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 5 + w;
  const p = (t: number) => `${x2 - h * Math.cos(a + t)} ${y2 - h * Math.sin(a + t)}`;
  return (
    <g className={`pointer-events-none ${className}`}>
      <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={ink} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? "4 3" : undefined} />
      <path d={`M${p(0.45)}L${x2} ${y2}L${p(-0.45)}`} fill="none" stroke={ink} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 0 · The warm-up at the হাট, before the van: (1, 3) · (2, 2). The reader picks
//     an answer and the box runs the way that answer would have it: slot by
//     slot then add (8), slot by slot and stop ((2, 6)), or add first (16).

const W0_A = [1, 3];
const W0_B = [2, 2];
const W0_OPTS = ["(2, 6)", "16", "8"];
const W0_RIGHT = 2;
type W0Mode = "right" | "stop" | "add";
const W0_MODE: W0Mode[] = ["stop", "add", "right"];

/** The warm-up box at beat k (0…3) of one way of running it. */
function P_WarmBox({ mode, k }: { mode: W0Mode; k: number }) {
  const add = mode === "add";
  const on = (row: number, col: number) => (add ? k === row + 1 && k < 3 : k === col + 1 && k < 3);
  const slot = (v: number, row: number, col: number) => (
    <span
      className={`grid h-8 place-items-center rounded-lg border-2 font-mono font-bold transition-[background-color,scale] duration-300 motion-reduce:transition-none ${
        row === 0 ? "border-cat-blue/40 text-cat-blue" : "border-cat-coral/40 text-cat-coral"
      } ${on(row, col) ? "scale-110 bg-cat-amber/30" : "bg-surface"}`}
    >
      {v}
    </span>
  );
  const end = k >= 3;
  const ring = !end ? "border-cat-amber/40 bg-cat-amber/5" : mode === "right" ? "border-accent bg-accent/10" : "border-danger/50 bg-danger/5";
  return (
    <div className={`mx-auto w-fit rounded-2xl border-2 px-3 py-2 transition-colors duration-300 motion-reduce:transition-none ${ring}`}>
      <div className="grid grid-cols-[2.6rem_2.6rem_3rem] items-center gap-x-2 gap-y-1.5">
        {slot(W0_A[0], 0, 0)}
        {slot(W0_A[1], 0, 1)}
        <span className="font-mono text-sm font-bold text-cat-blue">{add && k >= 1 && <span className={P_DROP}>= 4</span>}</span>
        {slot(W0_B[0], 1, 0)}
        {slot(W0_B[1], 1, 1)}
        <span className="font-mono text-sm font-bold text-cat-coral">{add && k >= 2 && <span className={P_DROP}>= 4</span>}</span>
        {[0, 1].map((c) => (
          <span key={c} className="h-6 text-center font-mono font-bold">
            {!add && k >= c + 1 && <span className={P_DROP}>{W0_A[c] * W0_B[c]}</span>}
          </span>
        ))}
        <span className="text-[0.65rem] text-muted">{!add && k >= 1 && "গুণ"}</span>
      </div>
      <div className="mt-1 h-7 border-t border-current/15 pt-1 text-center font-mono font-bold">
        {end && mode === "right" && <span className={`${POP} text-accent-text`}>2 + 6 = 8</span>}
        {end && mode === "stop" && (
          <span className={`${POP} text-danger`}>
            (2, 6) <span className="font-sans text-xs font-semibold">যোগ বাকি</span>
          </span>
        )}
        {end && mode === "add" && (
          <span className={`${POP} text-danger`}>
            4 × 4 = 16 <span className="font-sans text-xs font-semibold">আগে যোগ হলো</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function BoxWarmup() {
  const pass = useGate();
  const s = useP_Pick(3, 650);
  const won = s.over && s.pick === W0_RIGHT;
  return (
    <>
      <P_Ask>
        <span className="font-mono">(1, 3) · (2, 2) = ?</span>
      </P_Ask>
      <div className="mt-3">
        <P_WarmBox mode={s.pick === null ? "right" : W0_MODE[s.pick]} k={s.beat} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {W0_OPTS.map((o, i) => (
          <P_Opt key={o} look={s.look(i, W0_RIGHT)} disabled={won} onClick={() => s.go(i, W0_RIGHT, () => pass("ঘরে ঘরে গুণ, তারপর যোগ: 8।"))}>
            <span className="font-mono text-lg font-semibold">{o}</span>
          </P_Opt>
        ))}
      </div>
      {s.over && s.pick === 0 && <Nope key={s.miss}>উঁহু, box গুণ করে থেমে গেল। ঘরে ঘরে গুণ, তারপর যোগ।</Nope>}
      {s.over && s.pick === 1 && <Nope key={s.miss}>উঁহু, এখানে আগে যোগ হলো, পরে গুণ। ঘরে ঘরে গুণ, তারপর যোগ।</Nope>}
      <Task done={won}>একটা উত্তর tap করুন। box সেই উত্তরের নিয়মে চলবে। দেখুন কোনটা মেলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 0½ · A figure for the warm-up's explanation: the three ways, in the order
//      the paragraph tells them — slot by slot and add (8), stopping after
//      the multiply ((2, 6)), and adding first (16).

const X0_SAY = [
  "হাটের box, দুইটা list: (1, 3) আর (2, 2)।",
  "ঘরে ঘরে গুণ: 1 × 2 = 2, 3 × 2 = 6।",
  "তারপর যোগ: 8।",
  "(2, 6)? গুণ করে থেমে যাওয়া। যোগটা এখনো বাকি।",
  "আর 16 হলো আগে যোগ, পরে গুণ। box এর নিয়ম মানে না ওটা।",
];
const X0_AT: [W0Mode, number][] = [
  ["right", 0],
  ["right", 2],
  ["right", 3],
  ["stop", 3],
  ["add", 3],
];

export function WarmupWays() {
  const s = useScene(4, [600, 1800, 1400, 2400, 2400]);
  const [mode, k] = X0_AT[s.k];
  return (
    <Scene scene={s} caption={say(X0_SAY, s.k)}>
      <P_WarmBox key={mode} mode={mode} k={k} />
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2b · The table: two people push it from opposite sides with the same
//      strength. A pick plays out: দ্বিগুণ or একজনের সমান sends a dashed "what
//      if" arrow out along the strip, but the table stays put; শূন্য joins the
//      two pushes tip to tail, and they end where they began.

const T2_OPTS = ["দ্বিগুণ", "শূন্য", "একজনের সমান"];
const T2_RIGHT = 1;
/** the strip above the table where pushes are laid tip to tail: 0 at x = 160, one push = 40 */
const T2_Y = 58;

/** A table seen from the side, its top centred at x. */
function P_Table({ x }: { x: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 30} y={PG - 30} width={60} height={5} rx={1} fill="#92400e" />
      <path d={`M${x - 25} ${PG - 25}V${PG}M${x + 25} ${PG - 25}V${PG}`} stroke="#78350f" strokeWidth={3} />
    </g>
  );
}

/** The strip's zero mark, where the table stands. */
function P_Zero() {
  return (
    <g className="pointer-events-none">
      <path d={`M60 ${T2_Y + 8}H260`} stroke={P_INK} strokeOpacity={0.2} strokeDasharray="3 3" />
      <path d={`M160 ${T2_Y + 3}v10`} stroke={P_INK} strokeOpacity={0.45} strokeWidth={1.2} />
    </g>
  );
}

/** Two people at the table, pushing once `push`; `som` stands at x (right side, facing left, unless moved round). */
function P_TableCrew({ push, som = 220, somFacing = -1, walking = false, ms = 1200 }: { push: boolean; som?: number; somFacing?: 1 | -1; walking?: boolean; ms?: number }) {
  return (
    <>
      <Person who="fahim" x={100} y={PG} mood={push ? "shout" : "plain"} arm={push ? "point" : "down"} />
      {push && <P_Push x={100} facing={1} />}
      <Person who="som" x={som} y={PG} facing={somFacing} walking={walking} ms={ms} mood={push ? "shout" : "plain"} arm={push ? "point" : "down"} />
      {push && !walking && <P_Push x={som} facing={somFacing} />}
    </>
  );
}

export function TableTug() {
  const pass = useGate();
  const s = useP_Pick(3, 700);
  const won = s.over && s.pick === T2_RIGHT;
  const k = s.beat;
  const ghost = s.pick === 0 ? 80 : 40;
  return (
    <>
      <P_Ask>টেবিলের দুই পাশ থেকে দুইজন ঠেলছে, same শক্তি নিয়ে। কী হবে, বলুন তো?</P_Ask>
      <div className="mx-auto mt-3 max-w-[20rem] overflow-hidden rounded-2xl ring-1 ring-black/10">
        <Stage backdrop="room" label="টেবিলের দুই পাশ থেকে দুইজন সমান শক্তিতে ঠেলছে">
          <P_Zero />
          <P_Table x={160} />
          <P_TableCrew push={k >= 1} />
          {s.pick === T2_RIGHT && k >= 2 && <P_Line x1={160} y1={T2_Y} x2={200} y2={T2_Y} ink="#2563eb" className={FADE} />}
          {s.pick === T2_RIGHT && k >= 3 && (
            <>
              <P_Line x1={200} y1={T2_Y + 8} x2={160} y2={T2_Y + 8} ink={P_BAD} className={FADE} />
              <circle cx={160} cy={T2_Y + 8} r={3.5} fill="#7c3aed" className={POP} />
              <Card x={160} y={T2_Y - 16} text="0" tone="teal" />
            </>
          )}
          {s.pick !== null && s.pick !== T2_RIGHT && k >= 2 && (
            <g className={`${FADE} transition-opacity duration-500 motion-reduce:transition-none`} opacity={k >= 3 ? 0.35 : 1}>
              <P_Line x1={160} y1={T2_Y} x2={160 + ghost} y2={T2_Y} ink="#7c3aed" dashed />
              <text x={160 + ghost / 2} y={T2_Y - 7} textAnchor="middle" fontSize={9} fontWeight={700} fill="#7c3aed">
                {T2_OPTS[s.pick]}?
              </text>
            </g>
          )}
          {s.pick !== null && s.pick !== T2_RIGHT && k >= 3 && (
            <>
              <path d={`M${154 + ghost} ${T2_Y - 6}l12 12m0 -12l-12 12`} stroke={P_BAD} strokeWidth={2.2} strokeLinecap="round" className={POP} />
              <path d={`M126 ${PG - 3}q-5 -7 -11 -6M194 ${PG - 3}q5 -7 11 -6`} fill="none" stroke="#6b4f2a" strokeWidth={2} strokeLinecap="round" className={FADE} />
            </>
          )}
        </Stage>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {T2_OPTS.map((o, i) => (
          <P_Opt key={o} look={s.look(i, T2_RIGHT)} disabled={won} onClick={() => s.go(i, T2_RIGHT, () => pass("উল্টো দিকের সমান ধাক্কা মিলে শূন্য।"))}>
            <span className="text-[0.95rem] font-semibold">{o}</span>
          </P_Opt>
        ))}
      </div>
      {s.over && s.pick !== T2_RIGHT && <Nope key={s.miss}>উঁহু, টেবিল তো নড়লোই না। দুইটা arrow ঠিক উল্টো দিকে।</Nope>}
      <Task done={won}>একটা উত্তর tap করুন। তারপর দেখুন, দুইজন ঠেললে টেবিলের কী হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2b½ · A figure for the table's explanation: equal and opposite, the two
//       pushes laid tip to tail come back to the start — zero. Then one walks
//       round to the other's side, same strength, and now they add: strength
//       alone isn't enough, the direction matters too.

const X2B_SAY = [
  "দুইজন সমান শক্তিতে ঠেলছে। একে অপরের opposite-এ।",
  "দুই ধাক্কা জোড়া দিলে? ফিরে আসে শুরুতেই। কাটাকাটি হয়ে শূন্য।",
  "এবার সোম ঘুরে এসে ফাহিমের পাশে দাঁড়ালো। শক্তি সেই একই।",
  "একই দিকে দুই ধাক্কা। টেবিল সরে গেল। শুধু জোর না, দিকটাও লাগে।",
];

export function TableCancel() {
  const s = useScene(3, [600, 2200, 2000, 2200]);
  const k = s.k;
  const shift = k >= 3 ? 80 : 0;
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <div className="mx-auto w-full max-w-[18rem] overflow-hidden rounded-xl ring-1 ring-black/10">
        <Stage backdrop="room" label="সমান আর উল্টো দুই ধাক্কা মিলে শূন্য; একই দিকে হলে টেবিল সরে">
          <P_Zero />
          <P_Carry x={shift} y={0} ms={1400}>
            <P_Table x={160} />
          </P_Carry>
          <P_Carry x={shift} y={0} ms={1400}>
            <P_TableCrew push={k !== 2} som={k >= 2 ? 62 : 220} somFacing={k >= 2 ? 1 : -1} walking={k === 2} ms={1600} />
          </P_Carry>
          {k === 1 && (
            <>
              <P_Line x1={160} y1={T2_Y} x2={200} y2={T2_Y} ink="#2563eb" className={FADE} />
              <P_Line x1={200} y1={T2_Y + 8} x2={160} y2={T2_Y + 8} ink={P_BAD} className={FADE} />
              <Card x={160} y={T2_Y - 16} text="0" tone="teal" />
            </>
          )}
          {k >= 3 && (
            <>
              <P_Line x1={160} y1={T2_Y} x2={200} y2={T2_Y} ink="#2563eb" className={FADE} />
              <P_Line x1={200} y1={T2_Y} x2={240} y2={T2_Y} ink="#2563eb" className={FADE} />
            </>
          )}
        </Stage>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4b · The coin needle, from 2.7. A pick tosses নাসিবের two coins ten times
//      (the first ten of 5's seeded hundred), marks each pair মিল or অমিল and
//      swings the needle. 0° or 180° swings it there and lights the pairs that
//      would have to change; near 90° lands where the ten tosses really put it.

const C4_A = BLUE100.slice(0, 10);
const C4_B = RED100.slice(0, 10);
const C4_MATCH = C4_A.filter((x, i) => x === C4_B[i]).length;
/** the angle of two ±1 arrows: all মিল 0°, half 90°, none 180° */
const coinDeg = (m: number, n: number) => Math.round((Math.acos((2 * m - n) / n) * 180) / Math.PI);
const C4_OPTS = ["90°-এর কাছে", "0°-এর কাছে", "180°-এর কাছে"];
const C4_DEG = [coinDeg(C4_MATCH, 10), 0, 180];
const C4_RIGHT = 0;

/** A half dial at (cx, cy): 0° to the right, 90° up, 180° to the left. */
function P_Dial({ cx, cy, r, labels = true }: { cx: number; cy: number; r: number; labels?: boolean }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`} fill="#e0f2fe" stroke="#0369a1" strokeWidth={1} />
      {[0, 45, 90, 135, 180].map((t) => {
        const a = (t * Math.PI) / 180;
        return <line key={t} x1={cx + r * Math.cos(a)} y1={cy - r * Math.sin(a)} x2={cx + (r - 4) * Math.cos(a)} y2={cy - (r - 4) * Math.sin(a)} stroke="#0369a1" strokeWidth={1} />;
      })}
      {labels && (
        <g fontSize={7.5} fontWeight={600} fill="#0369a1" fontFamily="ui-monospace, monospace">
          <text x={cx + r + 2} y={cy + 9} textAnchor="middle">
            0°
          </text>
          <text x={cx} y={cy - r - 3} textAnchor="middle">
            90°
          </text>
          <text x={cx - r - 2} y={cy + 9} textAnchor="middle">
            180°
          </text>
        </g>
      )}
    </g>
  );
}

/** The dial's needle at `deg`. */
function P_Needle({ cx, cy, r, deg, ink = P_INK, opacity = 1 }: { cx: number; cy: number; r: number; deg: number; ink?: string; opacity?: number }) {
  const a = (deg * Math.PI) / 180;
  return (
    <g className="pointer-events-none" opacity={opacity}>
      <line x1={cx} y1={cy} x2={cx + (r - 3) * Math.cos(a)} y2={cy - (r - 3) * Math.sin(a)} stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={2.6} fill={ink} />
    </g>
  );
}

/** Ten toss pairs, blue over red, from x0: face down until `up`, then মিল/অমিল marks once `marked`; `flag` rings the pairs that are (true) or aren't (false) a match. */
function P_Tosses({ a, b, x0, up, marked, flag }: { a: readonly number[]; b: readonly number[]; x0: number; up: boolean; marked: boolean; flag?: boolean }) {
  return (
    <g className="pointer-events-none">
      {a.map((v, i) => {
        const x = x0 + i * 15;
        const same = v === b[i];
        return (
          <g key={i}>
            {[v, b[i]].map((c, j) => (
              <g key={j}>
                <circle cx={x} cy={24 + j * 17} r={6.5} fill={!up ? "#cbd5e1" : j === 0 ? "#2563eb" : P_BAD} className="transition-[fill] duration-300 motion-reduce:transition-none" style={{ transitionDelay: `${i * 50}ms` }} />
                {up && (
                  <text x={x} y={26.5 + j * 17} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="white" fontFamily="ui-monospace, monospace" className={FADE}>
                    {c > 0 ? "+1" : "−1"}
                  </text>
                )}
              </g>
            ))}
            {marked && (
              <rect x={x - 3.5} y={54} width={7} height={7} rx={1.5} fill={same ? P_OK : P_BAD} className={FADE} style={{ transitionDelay: `${i * 40}ms` }} />
            )}
            {flag !== undefined && same === flag && <rect x={x - 8.5} y={15} width={17} height={50} rx={5} fill="none" stroke={P_BAD} strokeWidth={1.6} className={POP} />}
          </g>
        );
      })}
    </g>
  );
}

export function CoinNeedle() {
  const pass = useGate();
  const s = useP_Pick(3, 700);
  const won = s.over && s.pick === C4_RIGHT;
  const k = s.beat;
  const target = s.pick === null ? 90 : C4_DEG[s.pick];
  const rest = target > 90 ? 0 : 180;
  const [deg] = useTween([k >= 3 ? target : rest], 700);
  const flag = s.over && s.pick === 1 ? false : s.over && s.pick === 2 ? true : undefined;
  return (
    <>
      <P_Ask>দুইটা random coin-এর arrow-এর কোণ বারবার কোথায় গিয়ে থামছিল?</P_Ask>
      <svg viewBox="0 0 300 112" role="img" aria-label="নাসিবের দুইটা coin দশবার toss, মিল আর অমিল, আর কোণের কাঁটা" className="mx-auto mt-2 block h-auto w-full max-w-[20rem] rounded-xl bg-white ring-1 ring-black/10">
        <P_Tosses a={C4_A} b={C4_B} x0={16} up={k >= 1} marked={k >= 2} flag={flag} />
        {k >= 2 && (
          <text x={83} y={80} textAnchor="middle" fontSize={9} fontWeight={700} fill={P_INK} className={FADE}>
            মিল {C4_MATCH}, অমিল {10 - C4_MATCH}
          </text>
        )}
        {s.over && s.pick !== C4_RIGHT && (
          <text x={83} y={98} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={P_BAD} className={FADE}>
            {s.pick === 1 ? "0° হলে সব জোড়া মিলতো" : "180° হলে সব জোড়া অমিল হতো"}
          </text>
        )}
        <P_Dial cx={236} cy={80} r={44} />
        {k >= 3 ? <P_Needle cx={236} cy={80} r={44} deg={deg} ink={s.pick === C4_RIGHT ? P_OK : P_BAD} /> : (
          <text x={236} y={70} textAnchor="middle" fontSize={16} fontWeight={800} fill={P_INK}>
            ?
          </text>
        )}
        {won && (
          <text x={236} y={100} textAnchor="middle" fontSize={9} fontWeight={700} fill={P_OK} fontFamily="ui-monospace, monospace" className={FADE}>
            {C4_DEG[0]}°
          </text>
        )}
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {C4_OPTS.map((o, i) => (
          <P_Opt key={o} look={s.look(i, C4_RIGHT)} disabled={won} onClick={() => s.go(i, C4_RIGHT, () => pass("Random দুই arrow থামে 90°-এর কাছে।"))}>
            <svg viewBox="0 0 60 34" aria-hidden="true" className="h-auto w-14">
              <P_Dial cx={30} cy={30} r={26} labels={false} />
              <P_Needle cx={30} cy={30} r={26} deg={[90, 0, 180][i]} />
            </svg>
            <span className="text-xs leading-tight font-semibold">{o}</span>
          </P_Opt>
        ))}
      </div>
      {s.over && s.pick !== C4_RIGHT && <Nope key={s.miss}>উঁহু, লাল দাগের জোড়াগুলো মেলেনি। Head আর tail প্রায় সমান সমান পড়ে।</Nope>}
      <Task done={won}>একটা কাঁটা বেছে নিন। coin দুইটা toss হবে। দেখুন কাঁটা আসলে কোথায় থামে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4b½ · A figure for the coin needle's explanation: toss the two coins ten
//       times, again and again. মিল and অমিল come out nearly half and half
//       each round, so the needle keeps landing round 90° (102°, 78°, 90°).

const X4B_ROUNDS = (() => {
  const r = rng(28);
  return [0, 1, 2].map(() => {
    const a: number[] = [];
    const b: number[] = [];
    for (let i = 0; i < 10; i++) {
      a.push(r() < 0.5 ? 1 : -1);
      b.push(r() < 0.5 ? 1 : -1);
    }
    const m = a.filter((x, i) => x === b[i]).length;
    return { a, b, m, deg: coinDeg(m, 10) };
  });
})();
const X4B_SAY = [
  "নাসিবের দুইটা coin, দশবার করে toss।",
  ...X4B_ROUNDS.map((r, i) => `${i === 0 ? "প্রথমবার" : "আবার"}: মিল ${r.m}, অমিল ${10 - r.m}। কাঁটা ${r.deg}°।`),
  "হেড আর টেল প্রায় সমান সমান পড়ে। তাই কাঁটা বারবার থামে 90°-এর আশেপাশে।",
];

export function CoinRounds() {
  const s = useScene(4, [600, 1800, 1800, 1800, 2400]);
  const k = s.k;
  const round = X4B_ROUNDS[Math.min(2, Math.max(0, k - 1))];
  const [deg] = useTween([k >= 1 ? X4B_ROUNDS[Math.min(2, k - 1)].deg : 180], 700);
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <svg viewBox="0 0 300 100" aria-label="দুইটা coin বারবার toss করলে কাঁটা থামে 90°-এর আশেপাশে" className="mx-auto block h-auto w-full max-w-[18rem] rounded-xl bg-white ring-1 ring-black/10">
        <g key={Math.min(k, 3)} className={FADE}>
          <P_Tosses a={round.a} b={round.b} x0={16} up={k >= 1} marked={k >= 1} />
        </g>
        {k >= 1 && k <= 3 && (
          <text key={k} x={83} y={80} textAnchor="middle" fontSize={9} fontWeight={700} fill={P_INK} className={FADE}>
            মিল {round.m}, অমিল {10 - round.m}
          </text>
        )}
        <P_Dial cx={236} cy={80} r={44} />
        {k >= 4 && <path d={`M236 80L${236 + 41 * Math.cos((105 * Math.PI) / 180)} ${80 - 41 * Math.sin((105 * Math.PI) / 180)}A41 41 0 0 1 ${236 + 41 * Math.cos((75 * Math.PI) / 180)} ${80 - 41 * Math.sin((75 * Math.PI) / 180)}Z`} fill={P_OK} fillOpacity={0.2} className={FADE} />}
        {X4B_ROUNDS.slice(0, Math.max(0, k - 1)).map((r, i) => (
          <P_Needle key={i} cx={236} cy={80} r={44} deg={r.deg} opacity={0.3} />
        ))}
        {k >= 1 && k <= 3 && <P_Needle cx={236} cy={80} r={44} deg={deg} />}
        {k >= 4 && <P_Needle cx={236} cy={80} r={44} deg={X4B_ROUNDS[2].deg} opacity={0.3} />}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5b · A hundred slots, nothing to draw. Two ±1 arrows of 100 slots (the first
//      is 5's blue hundred; the second is seeded to match it in exactly 50).
//      A pick plays out: the box scans both and lands on 0, the right angle;
//      "no way to tell" tries a sheet of paper and runs out of room at slot 3;
//      matching lengths finds 10 and 10, and two equal arrows swing to any angle.

const D5_A = BLUE100;
const D5_B = (() => {
  const r = rng(8);
  return D5_A.map(() => (r() < 0.5 ? 1 : -1));
})();
const D5_OPTS = ["box চালিয়ে, উত্তর 0 হলে ৯০ degree কোণে।", "আঁকতে না পারলে বোঝার উপায় নাই।", "দুইটার length মিলিয়ে।"];
const D5_RIGHT = 0;
const D5_MATCH = D5_A.filter((x, i) => x === D5_B[i]).length;

/** Two 100-slot strips, blue over red; `prod` adds the slot-by-slot products under them. */
function P_Strips({ prod = false, scan }: { prod?: boolean; scan?: number }) {
  const x = (i: number) => 20 + i * 2.6;
  return (
    <g className="pointer-events-none">
      {D5_A.map((v, i) => (
        <rect key={`a${i}`} x={x(i)} y={8} width={2.1} height={9} fill="#2563eb" fillOpacity={v > 0 ? 1 : 0.35} />
      ))}
      {D5_B.map((v, i) => (
        <rect key={`b${i}`} x={x(i)} y={20} width={2.1} height={9} fill={P_BAD} fillOpacity={v > 0 ? 1 : 0.35} />
      ))}
      <text x={20} y={39} fontSize={7} fill={P_INK} fillOpacity={0.6}>
        ঘর 1
      </text>
      <text x={280} y={39} textAnchor="end" fontSize={7} fill={P_INK} fillOpacity={0.6}>
        ঘর 100
      </text>
      {prod &&
        D5_A.map((v, i) =>
          scan === undefined || x(i) <= scan ? <rect key={`p${i}`} x={x(i)} y={44} width={2.1} height={9} fill={v === D5_B[i] ? P_OK : P_BAD} /> : null,
        )}
      {scan !== undefined && scan < 279 && <rect x={scan - 1} y={5} width={4} height={50} rx={1} fill="#f59e0b" fillOpacity={0.5} />}
    </g>
  );
}

/** A sheet with room for two slots only, at beat k (1 sheet, 2 the extra slots have nowhere to go, 3 stamped). */
function P_NoRoom({ k, extra, y0 = 44 }: { k: number; extra: string[]; y0?: number }) {
  if (k < 1) return null;
  const ox = 224;
  const oy = y0 + 56;
  return (
    <g className="pointer-events-none">
      <g className={FADE}>
        <rect x={190} y={y0} width={100} height={66} rx={3} fill="white" stroke={P_INK} strokeOpacity={0.35} />
        <path d={`M${ox} ${oy}H282M${ox} ${oy}V${y0 + 6}`} stroke={P_INK} strokeOpacity={0.5} strokeWidth={1} />
        <text x={280} y={oy - 3} textAnchor="end" fontSize={6.5} fill={P_INK} fillOpacity={0.6}>
          ঘর 1
        </text>
        <text x={ox + 3} y={y0 + 12} fontSize={6.5} fill={P_INK} fillOpacity={0.6}>
          ঘর 2
        </text>
        <P_Line x1={ox} y1={oy} x2={ox + 30} y2={oy - 26} ink="#2563eb" w={1.8} />
      </g>
      {k >= 2 &&
        extra.map((t, i) => (
          <g key={t} className={POP} style={{ transitionDelay: `${i * 120}ms` }}>
            <rect x={140} y={y0 + 4 + i * 20} width={42} height={15} rx={7.5} fill="white" stroke={P_BAD} strokeWidth={1.2} />
            <text x={161} y={y0 + 14.5 + i * 20} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={P_BAD}>
              {t}
            </text>
          </g>
        ))}
      {k >= 3 && (
        <g className={POP}>
          <g transform={`rotate(-12 240 ${y0 + 33})`}>
            <rect x={200} y={y0 + 24} width={80} height={18} rx={3} fill="white" fillOpacity={0.85} stroke={P_BAD} strokeWidth={1.6} />
            <text x={240} y={y0 + 36.5} textAnchor="middle" fontSize={9} fontWeight={800} fill={P_BAD}>
              আঁকা গেল না
            </text>
          </g>
        </g>
      )}
    </g>
  );
}

export function HundredSlots() {
  const pass = useGate();
  const s = useP_Pick(3, 750);
  const won = s.over && s.pick === D5_RIGHT;
  const k = s.beat;
  const [scan] = useTween([s.pick === D5_RIGHT && k >= 1 ? 280 : 20], 700);
  const [swing] = useTween([s.pick === 2 && k >= 3 ? 150 : 60], 800);
  const sw = (swing * Math.PI) / 180;
  return (
    <>
      <P_Ask>একশো ঘরের দুইটা arrow। কাগজে আঁকার উপায় নাই। ওরা ৯০ degree কোণে কিনা, বুঝবেন কীভাবে?</P_Ask>
      <svg viewBox="0 0 300 116" role="img" aria-label="একশো ঘরের দুইটা arrow, নীল আর লাল" className="mx-auto mt-2 block h-auto w-full max-w-[20rem] rounded-xl bg-white ring-1 ring-black/10">
        <P_Strips prod={s.pick === D5_RIGHT && k >= 1} scan={s.pick === D5_RIGHT && k >= 1 ? scan : undefined} />
        {s.pick === D5_RIGHT && k >= 2 && (
          <text x={150} y={70} textAnchor="middle" fontSize={9} fontWeight={700} fill={P_INK} className={FADE}>
            মিল {D5_MATCH}, অমিল {100 - D5_MATCH}
          </text>
        )}
        {s.pick === D5_RIGHT && k >= 3 && (
          <g className={POP}>
            <rect x={96} y={80} width={108} height={22} rx={11} fill="white" stroke={P_OK} strokeWidth={1.6} />
            <text x={150} y={94.5} textAnchor="middle" fontSize={10} fontWeight={800} fill={P_OK}>
              box এ 0, ৯০ degree
            </text>
          </g>
        )}
        {s.pick === 1 && <P_NoRoom k={k} extra={["ঘর 3?", "ঘর 4?", "… 100?"]} />}
        {s.pick === 2 && k >= 1 && (
          <g className={FADE}>
            {[0, 1].map((j) => (
              <g key={j}>
                <rect x={20} y={48 + j * 13} width={100} height={8} rx={4} fill={j === 0 ? "#2563eb" : P_BAD} fillOpacity={0.7} />
                <text x={126} y={55 + j * 13} fontSize={8} fontWeight={700} fill={P_INK} fontFamily="ui-monospace, monospace">
                  10
                </text>
              </g>
            ))}
            <text x={20} y={90} fontSize={8.5} fontWeight={600} fill={P_INK}>
              দুইটারই length 10
            </text>
          </g>
        )}
        {s.pick === 2 && k >= 2 && (
          <g className={FADE}>
            <P_Line x1={210} y1={104} x2={210 + 40 * Math.cos((20 * Math.PI) / 180)} y2={104 - 40 * Math.sin((20 * Math.PI) / 180)} ink="#2563eb" />
            <P_Line x1={210} y1={104} x2={210 + 40 * Math.cos(sw)} y2={104 - 40 * Math.sin(sw)} ink={P_BAD} />
            {k >= 3 && (
              <text x={20} y={104} fontSize={8.5} fontWeight={700} fill={P_BAD} className={FADE}>
                length একই, কোণ যা খুশি
              </text>
            )}
          </g>
        )}
      </svg>
      <div className="mt-3 grid gap-1.5">
        {D5_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={s.look(i, D5_RIGHT)} disabled={won} onClick={() => s.go(i, D5_RIGHT, () => pass("box এ 0 মানে ৯০ degree কোণ, যত ঘরেই।"))}>
            <span className="text-[0.95rem] leading-snug">{o}</span>
          </Choice>
        ))}
      </div>
      {s.over && s.pick !== D5_RIGHT && <Nope key={s.miss}>Coin-এর বেলায় ছবি ছাড়াই কোণটা কে বলে দিলো? মিল আর অমিল সমান হলে box এ কত আসে?</Nope>}
      <Task done={won}>একটা উপায় বেছে নিন। দেখুন সেটা দিয়ে কোণটা ধরা যায় কিনা।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6b · একটু ঝালিয়ে নিন: (3, −2, 5) and (4, 1, −2). A pick plays out: the box
//      runs slot by slot to 12 − 2 − 10 = 0; "20" runs it with the minus
//      signs falling off; "can't tell without drawing" tries the sheet and
//      runs out of room at the third slot.

const E6_A = [3, -2, 5];
const E6_B = [4, 1, -2];
const E6_OPTS = ["হ্যাঁ, box এ 0", "না, box এ 20", "আঁকা ছাড়া বলা যায় না"];
const E6_RIGHT = 0;

/** The three-slot box at beat k (0…4): a product per beat, the sum at 4. `drop` lets the minus signs fall off. */
function P_ThreeBox({ k, drop = false }: { k: number; drop?: boolean }) {
  const end = k >= 4;
  const ring = !end ? "border-cat-amber/40 bg-cat-amber/5" : drop ? "border-danger/50 bg-danger/5" : "border-accent bg-accent/10";
  const slot = (v: number, row: number, col: number) => (
    <span
      key={`${row}-${col}`}
      className={`grid h-8 place-items-center rounded-lg border-2 font-mono font-bold transition-[background-color,scale] duration-300 motion-reduce:transition-none ${
        row === 0 ? "border-cat-blue/40 text-cat-blue" : "border-cat-coral/40 text-cat-coral"
      } ${k === col + 1 ? "scale-110 bg-cat-amber/30" : "bg-surface"}`}
    >
      {num(v)}
    </span>
  );
  return (
    <div className={`mx-auto w-fit rounded-2xl border-2 px-3 py-2 transition-colors duration-300 motion-reduce:transition-none ${ring}`}>
      <div className="grid grid-cols-[2.8rem_2.8rem_2.8rem] gap-x-2 gap-y-1.5">
        {E6_A.map((v, c) => slot(v, 0, c))}
        {E6_B.map((v, c) => slot(v, 1, c))}
        {E6_A.map((v, c) => {
          const p = v * E6_B[c];
          return (
            <span key={c} className="h-6 text-center font-mono font-bold">
              {k >= c + 1 && (
                <span className={P_DROP}>
                  {p < 0 && (
                    <span className={`inline-block text-danger transition duration-700 motion-reduce:transition-none ${drop && end ? "translate-y-4 rotate-45 opacity-0" : ""}`}>−</span>
                  )}
                  {Math.abs(p)}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <div className="mt-1 h-7 border-t border-current/15 pt-1 text-center font-mono font-bold">
        {end && !drop && <span className={`${POP} text-accent-text`}>12 − 2 − 10 = 0</span>}
        {end && drop && <span className={`${POP} text-danger`}>12 + 2 + 10 = 20</span>}
      </div>
    </div>
  );
}

export function ThreeSlots() {
  const pass = useGate();
  const s = useP_Pick(4, 600);
  const won = s.over && s.pick === E6_RIGHT;
  const k = s.beat;
  return (
    <>
      <P_Ask>(3, −2, 5) আর (4, 1, −2): এই দুইটা arrow কি লম্বালম্বি ভাবে আছে?</P_Ask>
      <div className="mt-3 flex min-h-[8.5rem] items-center justify-center">
        {s.pick === 2 ? (
          <svg viewBox="130 40 170 76" role="img" aria-label="কাগজে দুইটা ঘরের জায়গা আছে, তিন নম্বর ঘরের জায়গা নাই" className="block h-auto w-full max-w-[15rem] rounded-xl bg-white ring-1 ring-black/10">
            <P_NoRoom k={k >= 4 ? 3 : k >= 2 ? 2 : k >= 1 ? 1 : 0} extra={["ঘর 3?"]} />
          </svg>
        ) : (
          <P_ThreeBox k={s.pick === null ? 0 : k} drop={s.pick === 1} />
        )}
      </div>
      <div className="mt-3 grid gap-1.5">
        {E6_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={s.look(i, E6_RIGHT)} disabled={won} onClick={() => s.go(i, E6_RIGHT, () => pass(<>ঠিক ধরেছেন!</>))}>
            <span className="text-[0.95rem]">{o}</span>
          </Choice>
        ))}
      </div>
      {s.over && s.pick === 1 && <Nope key={s.miss}>উঁহু, minus-গুলো পড়ে গেল। ঘরে ঘরে গুণ করে যোগ করুন। minus-গুলো সাবধানে।</Nope>}
      {s.over && s.pick === 2 && <Nope key={s.miss}>তিন ঘরের arrow আঁকা যায় না, ঠিক। কিন্তু box তো চলে।</Nope>}
      <Task done={won}>একটা উত্তর tap করুন। box বা কাগজ, যেটা বেছে নেন সেটাই চলবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6b½ · A figure for 6b's explanation: the careful run to 0, the same run
//       with the minus signs dropped to 20, and then the protractor set
//       aside — the box alone said ৯০ degree.

const X6B_SAY = [
  "(3 × 4) + (−2 × 1) + (5 × −2)।",
  "ঘরে ঘরে গুণ করে যোগ: 12 − 2 − 10 = 0।",
  "minus-গুলো বাদ দিলে হয়ে যায় 12 + 2 + 10 = 20।",
  "box এ 0 মানে ৯০ degree কোণ। কোণ মাপতে চাঁদা লাগে না। boxই যথেষ্ট।",
];

export function MinusCare() {
  const s = useScene(3, [600, 2200, 2400, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <P_ThreeBox k={k === 0 ? 0 : 4} drop={k === 2} />
        {k >= 3 && (
          <svg viewBox="-14 -14 28 20" aria-hidden="true" className={`${POP} h-auto w-14`}>
            <P_Protractor />
            <path d="M-11 -11L11 4M11 -11L-11 4" stroke={P_BAD} strokeWidth={1.8} strokeLinecap="round" />
          </svg>
        )}
      </div>
    </Scene>
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
  // the story scenes and figures: `k` is the beat, the bare state is the last one
  TeamSign: { start: { k: 0 }, front: { k: 1 }, done: {} },
  FiveTimes: { start: { k: 0 }, taped: { k: 1 }, done: {} },
  AngleFan: { start: { k: 0 }, walk: { k: 2 }, zero: { k: 3 }, done: {} },
  KoolyArrives: { start: { k: 0 }, run: { k: 1 }, slant: { k: 2 }, done: {} },
  BreakThePush: { start: {}, broke: { broke: true }, flat: { broke: true, th: 0 }, upright: { broke: true, th: 90 } },
  RoadShadow: { start: { k: 0 }, drop: { k: 1 }, done: {} },
  CoinTug: { start: { k: 0 }, pull: { k: 2 }, zero: { k: 3 }, hundred: { k: 4 }, done: {} },
  AnySize: { start: { k: 0 }, coins: { k: 1 }, done: {} },
  SidePress: { start: { k: 0 }, squash: { k: 1 }, done: {} },
  SumThenBox: { start: { k: 0 }, chain: { k: 1 }, total: { k: 2 }, done: {} },
  DinnerBet: { start: { k: 0 }, ask: { k: 1 }, needle: { k: 2 }, done: {} },
  VanSinks: { start: { k: 0 }, sunk: { k: 2 }, shout: { k: 3 }, done: {} },
  PushToBox: { start: { k: 0 }, lists: { k: 2 }, done: {} },
  PlusSide: { start: { k: 0 }, swung: { k: 1 }, done: {} },
  TitanicStrength: { start: { k: 0 }, scores: { k: 2 }, done: {} },
  CoinMemory: { start: { k: 0 }, coins: { k: 1 }, cards: { k: 2 }, done: {} },
  EightyNeeded: { start: { k: 0 }, storm: { k: 1 }, need: { k: 2 }, done: {} },
  VanOut: { start: { k: 0 }, round: { k: 1 }, out: { k: 2 }, done: {} },
  // the review exercises (were text <Check>s) and their figures
  BoxWarmup: { start: {}, stop: { pick: 0 }, add: { pick: 1 }, right: { pick: 2 } },
  WarmupWays: { start: { k: 0 }, each: { k: 1 }, stop: { k: 3 }, done: {} },
  TableTug: { start: {}, double: { pick: 0 }, right: { pick: 1 }, one: { pick: 2 } },
  TableCancel: { start: { k: 0 }, zero: { k: 1 }, round: { k: 2 }, done: {} },
  CoinNeedle: { start: {}, right: { pick: 0 }, zero: { pick: 1 }, flat: { pick: 2 } },
  CoinRounds: { start: { k: 0 }, first: { k: 1 }, third: { k: 3 }, done: {} },
  HundredSlots: { start: {}, box: { pick: 0 }, draw: { pick: 1 }, length: { pick: 2 } },
  ThreeSlots: { start: {}, right: { pick: 0 }, dropped: { pick: 1 }, draw: { pick: 2 } },
  MinusCare: { start: { k: 0 }, care: { k: 1 }, drop: { k: 2 }, done: {} },
};
