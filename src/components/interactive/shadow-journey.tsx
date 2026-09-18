"use client";

import type { ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Ticks, pill, primaryBtn, useSeed, type Fixtures } from "@/components/journey/kit";
import { Arrow, Label, Plane, clamp, makeFrame, snap, type Frame, type XY } from "@/components/journey/plane";
import { DotBox, dot, tupN } from "./haat-journey";

// Screens for "Math for AI 4.3 — দুপুরের ছায়া, দুই হিসাব এক উত্তর", told as a Journey.
//
// মামা claims a second recipe for the box's number that multiplies no slots at
// all: two tape lengths and one protractor reading. The reader bets whether it
// will always agree with the box. On the ছাদ at noon a bamboo stick's shadow
// gives cos θ (a table from 0° to 90°, then past 90° where the shadow falls
// behind); a chalk arrow's shadow on another is ‖w‖ cos θ; মামা's recipe,
// ‖v‖ × (w's shadow), matches the box twice (6 and 7). Then the why: a
// vector's numbers are its shadows on the axes, and in the 2 × 2 grid of
// axis pairs the crossed ones cast no shadow, leaving only slot × slot. Last
// the reader predicts মামা's number from the box alone, three times.
//
// The box is 4.1's DotBox. Tailwind only; the sheets are journey/plane. Ink on
// the white sheet is fixed.

const O: XY = [0, 0];
const len = (v: readonly number[]) => Math.hypot(...v);
const RAD = Math.PI / 180;
/** the angle between two arrows, in degrees */
const angleOf = (a: XY, b: XY) => Math.acos(clamp(dot(a, b) / (len(a) * len(b)), -1, 1)) / RAD;
/** a number to d decimals with a real minus, and no "−0" */
const fix = (n: number, d: number) => {
  const s = Math.abs(n).toFixed(d);
  return n < 0 && Number(s) !== 0 ? `−${s}` : s;
};

/** An angle arc at the origin from direction a to direction b, labelled in degrees. */
function Arc({ f, a, b, r = 0.9, label = true }: { f: Frame; a: XY; b: XY; r?: number; label?: boolean }) {
  const a1 = Math.atan2(a[1], a[0]);
  let d = Math.atan2(b[1], b[0]) - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  if (Math.abs(d) < 1e-6) return null;
  const p = (t: number, k: number): [number, number] => [f.sx(k * Math.cos(t)), f.sy(k * Math.sin(t))];
  const [x1, y1] = p(a1, r);
  const [x2, y2] = p(a1 + d, r);
  const [lx, ly] = p(a1 + d / 2, r + 0.6);
  return (
    <g className="pointer-events-none">
      <path d={`M${x1} ${y1}A${r * f.u} ${r * f.u} 0 0 ${d > 0 ? 0 : 1} ${x2} ${y2}`} strokeWidth={1.3} className="fill-none stroke-[#0f1b2d]/60" />
      {label && (
        <text x={lx} y={ly + 3} textAnchor="middle" fontSize={9} fontWeight={600} className="fill-[#0f1b2d] font-mono">
          {fix(Math.abs(d) / RAD, 0)}°
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// The stick in the noon sun. A stick L metres long, tilted θ up from the
// ground, casts a shadow straight down: L cos θ, behind the foot past 90°.

const FST = makeFrame(-2.2, 2.2, -0.3, 2.3, 70);

function StickScene({ deg, L }: { deg: number; L: number }) {
  const f = FST;
  const t = deg * RAD;
  const tip: XY = [L * Math.cos(t), L * Math.sin(t)];
  const back = tip[0] < -1e-9;
  const rays = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2];
  return (
    <Plane f={f} label={`${L} মিটার লাঠি, ${deg}° কোণে, ছায়া ${fix(tip[0], 2)} মিটার`} grid={0.5} axes={false} className="max-w-[20rem]">
      {rays.map((x) => (
        <path key={x} d={`M${f.sx(x)} ${f.sy(2.2)}V${f.sy(0.05)}`} strokeWidth={1} strokeDasharray="2 6" className="pointer-events-none stroke-[#d97706]/40" />
      ))}
      <circle cx={f.sx(1.95)} cy={f.sy(2.05)} r={9} className="pointer-events-none fill-[#fbbf24]" />
      <path d={`M${f.sx(-2.2)} ${f.sy(0)}H${f.sx(2.2)}`} strokeWidth={1.5} className="pointer-events-none stroke-[#0f1b2d]/50" />
      {Math.abs(tip[0]) > 0.01 && (
        <path
          d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(tip[0])}`}
          strokeWidth={7}
          strokeLinecap="round"
          className={`pointer-events-none ${back ? "stroke-danger/70" : "stroke-[#0f1b2d]/70"}`}
        />
      )}
      <path d={`M${f.sx(tip[0])} ${f.sy(tip[1])}V${f.sy(0)}`} strokeWidth={1.2} strokeDasharray="4 3" className="pointer-events-none stroke-[#d97706]" />
      <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(tip[0])} ${f.sy(tip[1])}`} strokeWidth={5} strokeLinecap="round" className="pointer-events-none stroke-[#92400e]" />
      <Arc f={f} a={[1, 0]} b={tip} r={0.32} label={deg > 0} />
      <circle cx={f.sx(0)} cy={f.sy(0)} r={3.5} className="pointer-events-none fill-[#0f1b2d]" />
      <Label f={f} at={[tip[0] / 2, 0]} dy={16} size={9} className={back ? "fill-danger" : "fill-[#0f1b2d]"}>
        ছায়া
      </Label>
    </Plane>
  );
}

function Slider({ value, min, max, step, label, onChange }: { value: number; min: number; max: number; step: number; label: string; onChange: (n: number) => void }) {
  return (
    <div className="mx-auto flex max-w-sm items-center gap-3">
      <span className="font-mono text-sm text-muted">{min}°</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
      />
      <span className="font-mono text-sm text-muted">{max}°</span>
    </div>
  );
}

function Rows({ rows }: { rows: [left: ReactNode, right: ReactNode, on: boolean][] }) {
  return (
    <div className="mx-auto mt-3 grid max-w-xs gap-0.5 rounded-xl border border-border bg-surface px-3 py-1.5">
      {rows.map(([l, r, on], i) => (
        <div key={i} className="grid grid-cols-2 gap-2 font-mono text-sm">
          <span className="text-muted">{l}</span>
          <span className={on ? `${FADE} font-semibold` : "text-muted/40"}>{on ? r : "?"}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · The two recipes. The box's 7 for (2, 3) · (2, 1) beside মামা's claim:
//     two tape lengths and a protractor reading give the same number. The
//     reader bets whether that always holds; NoCrossTalk and YourPair settle it.

const FB = makeFrame(-0.5, 3.5, -0.5, 3.5, 34);
const V: XY = [2, 3];
const W: XY = [2, 1];
const RECIPE_BET = ["সবসময় মিলবে, যেকোনো দুইটা arrow-এ", "মাঝেমধ্যে মিলবে, কাকতালীয়ভাবে", "কখনোই মিলবে না, দুইটা আলাদা হিসাব"];

export function TwoRecipes() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি সিল হলো। শুরু লাঠির ছায়া দিয়ে।");
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Plane f={FB} ticks={1} label="ছাদে চক দিয়ে আঁকা দুইটা arrow, (2, 3) আর (2, 1)" className="max-w-[9rem] shrink-0">
          <Arrow f={FB} from={O} to={V} tone="blue" w={2.4} />
          <Arrow f={FB} from={O} to={W} tone="coral" w={2.4} />
          <Label f={FB} at={V} dx={-4} dy={-4} anchor="end" className="fill-cat-blue">
            v
          </Label>
          <Label f={FB} at={W} dx={6} dy={4} anchor="start" className="fill-cat-coral">
            w
          </Label>
        </Plane>
        <div className="grid min-w-0 flex-1 gap-2 text-sm">
          <div className="rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-2.5 py-1.5">
            <div className="font-semibold">ফাহিমের box</div>
            <div className="font-mono">2 × 2 + 3 × 1 = 7</div>
          </div>
          <div className="rounded-xl border-2 border-cat-violet/40 bg-cat-violet/5 px-2.5 py-1.5">
            <div className="font-semibold">মামার হিসাব</div>
            <div>দুইটা ফিতার মাপ আর একটা চাঁদার মাপ। কোনো ঘরে ঘরে গুণ নাই।</div>
          </div>
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-muted">মামা বলছেন তার হিসাব আর box সবসময় একই উত্তর দেবে। আপনার কী মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {RECIPE_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>দুইটা হিসাব দেখে একটাতে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · A 1 m stick in the noon sun. The reader tilts it and reads the shadow at
//     0°, 30°, 45°, 60° and 90°, and the table fills. Then a 2 m stick at 60°
//     casts a 1 m shadow: shadow ÷ stick is still 0.5, so it depends only on θ.

const ANGLES = [0, 30, 45, 60, 90];

export function StickShadow() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 20);
  const [L, setL] = useSeed("L", 1);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [big, setBig] = useSeed("big", false);
  const shadow = L * Math.cos(deg * RAD);
  const allSeen = ANGLES.every((a) => seen.includes(a));

  /** note a 1 m reading at one of the five angles, or the 2 m stick at 60° */
  const record = (d: number, l: number) => {
    const nextSeen = l === 1 && ANGLES.includes(d) && !seen.includes(d) ? [...seen, d] : seen;
    const nextBig = big || (l === 2 && d === 60);
    if (nextSeen === seen && nextBig === big) return;
    setSeen(nextSeen);
    setBig(nextBig);
    if (ANGLES.every((a) => nextSeen.includes(a)) && nextBig)
      pass("ছায়া ÷ লাঠি শুধু কোণের ওপর নির্ভর করে।");
  };
  const tilt = (d: number) => {
    setDeg(d);
    record(d, L);
  };
  const toggle = (l: number) => {
    setL(l);
    record(deg, l);
  };

  return (
    <>
      <StickScene deg={deg} L={L} />
      <Slider value={deg} min={0} max={90} step={5} label="লাঠি কত ডিগ্রি হেলানো" onChange={tilt} />
      <div className="mt-1 text-center text-[0.95rem]">
        <span className="font-mono">{deg}°</span>: ছায়া <b className="font-mono">{fix(shadow, 2)}</b> মিটার, ছায়া ÷ লাঠি <b className="font-mono">{fix(shadow / L, 2)}</b>
      </div>
      <div className="mt-2 flex justify-center gap-2">
        {[1, 2].map((l) => (
          <button key={l} type="button" onClick={() => toggle(l)} className={`${pill(L === l)} font-sans`}>
            {l === 1 ? "১ মিটার লাঠি" : "২ মিটার লাঠি"}
          </button>
        ))}
      </div>
      <Rows rows={ANGLES.map((a) => [`${a}°`, fix(Math.cos(a * RAD), 2), seen.includes(a)])} />
      <Ticks
        items={[
          [`পাঁচটা কোণ (${seen.length}/5)`, allSeen],
          ["২ মিটার লাঠি, 60°", big],
        ]}
      />
      <Task done={allSeen && big}>১ মিটার লাঠিটা 0°, 30°, 45°, 60° আর 90°-এ হেলিয়ে ছায়া মাপুন। তারপর ২ মিটার লাঠি নিয়ে 60°-এ দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Past 90°. Predict the shadow at 120° first (the trap: 0.5 in front, or
//     none), then tilt on to 120°, 150° and 180°: the shadow falls behind the
//     foot, −0.5, −0.87, −1. Never longer than the stick.

const BACK = [120, 150, 180];
const BACK_GUESS = ["সামনে 0.5 মিটার", "পেছনে 0.5 মিটার", "কোনো ছায়াই নাই"];

export function BackShadow() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [deg, setDeg] = useSeed("deg", 60);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const all = BACK.every((a) => seen.includes(a));

  const tilt = (d: number) => {
    setDeg(d);
    if (!BACK.includes(d) || seen.includes(d)) return;
    const next = [...seen, d];
    setSeen(next);
    if (BACK.every((a) => next.includes(a))) pass("সংখ্যাটা সবসময় −1 থেকে 1-এর মধ্যে।");
  };

  return (
    <>
      <StickScene deg={deg} L={1} />
      {guess === null ? (
        <>
          <div className="text-sm font-medium text-muted">লাঠিটা যদি 120°-এ হেলে পেছনের দিকে ঝোঁকে, ছায়া পড়বে কোথায়?</div>
          <div className="mt-2 grid gap-2">
            {BACK_GUESS.map((o, i) => (
              <Choice key={o} n={i} look="idle" disabled={false} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </>
      ) : (
        <div className={FADE}>
          <Slider value={deg} min={0} max={180} step={5} label="লাঠি কত ডিগ্রি হেলানো" onChange={tilt} />
          <div className="mt-1 text-center text-[0.95rem]">
            <span className="font-mono">{deg}°</span>: ছায়া <b className={`font-mono ${Math.cos(deg * RAD) < -1e-9 ? "text-danger" : ""}`}>{fix(Math.cos(deg * RAD), 2)}</b> মিটার
          </div>
          {seen.includes(120) && (
            <div className={`${FADE} mt-1 text-center text-sm`}>
              {guess === 1 ? "ঠিক ধরেছেন, পেছনে 0.5।" : "ছায়া পড়লো পায়ের পেছনে, 0.5 মিটার।"} পেছনের ছায়াকে আমরা minus দিয়ে লিখি।
            </div>
          )}
          <Rows rows={BACK.map((a) => [`${a}°`, fix(Math.cos(a * RAD), 2), seen.includes(a)])} />
        </div>
      )}
      <Task done={all}>আগে guess করুন, তারপর লাঠিটা 120°, 150° আর 180° পর্যন্ত হেলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The shadow of one arrow on another. v lies flat; which is w's shadow on
//     it: w rotated down onto v (the trap), or a straight line dropped from
//     w's tip? Then the reader drags w's tip to make shadows of 3, 0 and −2.

const FA = makeFrame(-4, 6, -1, 5, 26);
const VFLAT: XY = [5, 0];
const SHADOW_WAYS = ["w-কে ঘুরিয়ে v-এর ওপর শুইয়ে দেওয়া", "w-এর মাথা থেকে v-এর ওপর সোজা দাগ টেনে নামানো"];
const TARGETS = [3, 0, -2];

export function ArrowShadow() {
  const pass = useGate();
  const [way, setWay] = useSeed<number | null>("way", null);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const [w, setW] = useSeed<XY>("w", [2, 3]);
  const [hit, setHit] = useSeed<number[]>("hit", []);
  const right = way === 1;
  const all = TARGETS.every((t) => hit.includes(t));
  const shadow = w[0];
  const th = len(w) ? angleOf(VFLAT, w) : 0;

  const pickWay = (i: number) => {
    if (i !== 1) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setWay(1);
  };
  const move = (p: XY) => {
    if (!right) return;
    const q = snap(p, FA);
    if (q[0] === w[0] && q[1] === w[1]) return;
    setW(q);
    if (q[1] === 0 || !TARGETS.includes(q[0]) || hit.includes(q[0])) return;
    const next = [...hit, q[0]];
    setHit(next);
    if (TARGETS.every((t) => next.includes(t))) pass("w-এর ছায়ার মাপ ‖w‖ × cos θ।");
  };

  return (
    <>
      <Plane f={FA} ticks={1} label={`v শোয়ানো (5, 0), w ${tupN(w)}`} drag={{ down: move, move }} className="max-w-[20rem]">
        <Arrow f={FA} from={O} to={VFLAT} tone="teal" w={3} />
        <Label f={FA} at={VFLAT} dx={-4} dy={-8} anchor="end" className="fill-cat-teal">
          v
        </Label>
        {right && Math.abs(shadow) > 0 && (
          <path
            d={`M${FA.sx(0)} ${FA.sy(0)}H${FA.sx(shadow)}`}
            strokeWidth={7}
            strokeLinecap="round"
            className={`pointer-events-none ${shadow < 0 ? "stroke-danger/60" : "stroke-[#0f1b2d]/60"}`}
          />
        )}
        {right && <path d={`M${FA.sx(w[0])} ${FA.sy(w[1])}V${FA.sy(0)}`} strokeWidth={1.2} strokeDasharray="4 3" className="pointer-events-none stroke-[#d97706]" />}
        {right && len(w) > 0 && <Arc f={FA} a={VFLAT} b={w} r={0.8} />}
        <Arrow f={FA} from={O} to={w} tone="coral" w={2.6} />
        <Label f={FA} at={w} dx={6} dy={-4} anchor="start" className="fill-cat-coral">
          w
        </Label>
      </Plane>
      {!right ? (
        <>
          <div className="text-sm font-medium text-muted">রোদ যদি v-এর ঠিক মাথার ওপর থেকে আসে, v-এর ওপর w-এর ছায়া কোনটা?</div>
          <div className="mt-2 grid gap-2">
            {SHADOW_WAYS.map((o, i) => (
              <Choice key={o} n={i} look="idle" disabled={false} onClick={() => pickWay(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {miss !== null && <Nope key={miss}>উঁহু। লাঠির ছায়ার কথা ভাবুন। রোদ লাঠিকে মাটিতে শুইয়ে দেয় না, মাথা থেকে সোজা নিচে নামে।</Nope>}
        </>
      ) : (
        <div className={FADE}>
          <div className="text-center text-[0.95rem]">
            <span className="font-mono">
              ‖w‖ {fix(len(w), 2)} × cos {fix(th, 0)}°
            </span>{" "}
            = ছায়া <b className={`font-mono ${shadow < 0 ? "text-danger" : ""}`}>{fix(shadow, 0)}</b>
          </div>
          <Ticks items={TARGETS.map((t) => [`ছায়া ${t < 0 ? `−${-t}` : t}`, hit.includes(t)])} />
        </div>
      )}
      <Task done={all}>আগে বলুন ছায়া কোনটা। তারপর w-এর মাথা টেনে এমন জায়গায় নিন যাতে ছায়া হয় 3, তারপর 0, তারপর −2।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · মামা's recipe, tested twice: ‖v‖ × ‖w‖ × cos θ, one measurement at a
//     time, beside the box. (2, 0) and (3, 3) give 6; then the bet's own pair
//     (2, 3) and (2, 1) gives 7.0 (29.7°). Round 1 folds when round 2 opens.

const TESTS: { v: XY; w: XY; f: Frame }[] = [
  { v: [2, 0], w: [3, 3], f: makeFrame(-0.5, 3.5, -0.5, 3.5, 30) },
  { v: [2, 3], w: [2, 1], f: makeFrame(-0.5, 3.5, -0.5, 3.5, 30) },
];
const MEASURE_BTN = ["v ফিতা দিয়ে মাপুন", "w ফিতা দিয়ে মাপুন", "চাঁদা বসান", "তিনটা গুণ করুন"];

function MamaSteps({ v, w, k }: { v: XY; w: XY; k: number }) {
  const th = angleOf(v, w);
  const lines = [
    `‖v‖ = ${fix(len(v), 2)}`,
    `‖w‖ = ${fix(len(w), 2)}`,
    `θ = ${fix(th, 1)}°, cos θ = ${fix(Math.cos(th * RAD), 3)}`,
    `${fix(len(v), 2)} × ${fix(len(w), 2)} × ${fix(Math.cos(th * RAD), 3)} = ${fix(len(v) * len(w) * Math.cos(th * RAD), 1)}`,
  ];
  return (
    <div className="rounded-2xl border-2 border-cat-violet/40 bg-cat-violet/5 px-3 py-2 font-mono text-[0.8rem]">
      <div className="font-sans text-xs text-muted">মামার ফিতা আর চাঁদা</div>
      {lines.slice(0, k).map((l, i) => (
        <div key={i} className={`${FADE} ${i === 3 ? "text-sm font-bold" : ""}`}>
          {l}
        </div>
      ))}
    </div>
  );
}

export function TwoTests() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [k, setK] = useSeed("k", 0);
  const t = TESTS[round];
  const over = k >= 4;

  const step = () => {
    setK(k + 1);
    if (k + 1 === 4 && round === 1) pass("দুই হিসাব, দুইবারই একই উত্তর।");
  };

  return (
    <>
      {round === 1 && <div className="text-center text-sm text-accent-text">✓ প্রথম জোড়া: box 6, মামা 6.0।</div>}
      <div key={round} className={`${FADE} flex items-center gap-3`}>
        <Plane f={t.f} ticks={1} label={`v ${tupN(t.v)}, w ${tupN(t.w)}`} className="max-w-[8.5rem] shrink-0">
          {k >= 3 && <Arc f={t.f} a={t.v} b={t.w} r={0.9} />}
          <Arrow f={t.f} from={O} to={t.v} tone="blue" w={2.4} />
          <Arrow f={t.f} from={O} to={t.w} tone="coral" w={2.4} />
        </Plane>
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="text-sm">
            <span className="text-cat-blue">v {tupN(t.v)}</span>, <span className="text-cat-coral">w {tupN(t.w)}</span>
          </div>
          <DotBox a={t.v} b={t.w} k={3} dense />
        </div>
      </div>
      <div className="mt-3">
        <MamaSteps v={t.v} w={t.w} k={k} />
      </div>
      <div className="mt-3 flex justify-center">
        {!over ? (
          <button type="button" onClick={step} className={primaryBtn}>
            {MEASURE_BTN[k]}
          </button>
        ) : (
          round === 0 && (
            <button
              type="button"
              onClick={() => {
                setRound(1);
                setK(0);
              }}
              className={primaryBtn}
            >
              এবার বাজির জোড়া, (2, 3) আর (2, 1)
            </button>
          )
        )}
      </div>
      <Ticks
        items={[
          ["প্রথম জোড়া", round === 1],
          ["বাজির জোড়া", round === 1 && over],
        ]}
      />
      <Task done={round === 1 && over}>মামার হিসাবটা এক মাপ এক মাপ করে চালান, তারপর box এর উত্তরের সাথে মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · A vector's numbers are shadows. Light (2, 3) onto each axis: the shadow
//     on the east axis is 2, on the north axis 3, and the box with e₁ and e₂
//     gives the same two numbers.

const FX = makeFrame(-0.5, 3.5, -0.5, 3.5, 40);

export function AxisShadow() {
  const pass = useGate();
  const [lit, setLit] = useSeed<number[]>("lit", []);
  const both = lit.length === 2;

  const light = (i: number) => {
    if (lit.includes(i)) return;
    const next = [...lit, i];
    setLit(next);
    if (next.length === 2) pass("প্রতিটা সংখ্যা একেকটা axis-এ ছায়া।");
  };

  return (
    <>
      <Plane f={FX} ticks={1} label="(2, 3) আর দুইটা axis-এর ওপর তার ছায়া" className="max-w-[13rem]">
        {lit.includes(0) && (
          <>
            <path d={`M${FX.sx(2)} ${FX.sy(3)}V${FX.sy(0)}`} strokeWidth={1.2} strokeDasharray="4 3" className="pointer-events-none stroke-[#d97706]" />
            <path d={`M${FX.sx(0)} ${FX.sy(0)}H${FX.sx(2)}`} strokeWidth={7} strokeLinecap="round" className={`${POP} pointer-events-none stroke-[#0f1b2d]/60`} />
          </>
        )}
        {lit.includes(1) && (
          <>
            <path d={`M${FX.sx(2)} ${FX.sy(3)}H${FX.sx(0)}`} strokeWidth={1.2} strokeDasharray="4 3" className="pointer-events-none stroke-[#d97706]" />
            <path d={`M${FX.sx(0)} ${FX.sy(0)}V${FX.sy(3)}`} strokeWidth={7} strokeLinecap="round" className={`${POP} pointer-events-none stroke-[#0f1b2d]/60`} />
          </>
        )}
        <Arrow f={FX} from={O} to={[1, 0]} tone="teal" w={2.4} />
        <Arrow f={FX} from={O} to={[0, 1]} tone="teal" w={2.4} />
        <Label f={FX} at={[1, 0]} dy={-6} className="fill-cat-teal">
          e₁
        </Label>
        <Label f={FX} at={[0, 1]} dx={7} dy={3} anchor="start" className="fill-cat-teal">
          e₂
        </Label>
        <Arrow f={FX} from={O} to={V} tone="blue" w={2.6} />
      </Plane>
      <div className="grid grid-cols-2 gap-2">
        {["পূর্বের axis-এ রোদ", "উত্তরের axis-এ রোদ"].map((b, i) => (
          <div key={b} className="grid gap-2">
            <button type="button" disabled={lit.includes(i)} onClick={() => light(i)} className={`${pill(lit.includes(i))} font-sans`}>
              {b}
            </button>
            {lit.includes(i) && (
              <div className={`${FADE} text-center`}>
                <div className="text-sm">ছায়া {i === 0 ? 2 : 3}</div>
                <DotBox a={V} b={i === 0 ? [1, 0] : [0, 1]} k={3} dense />
              </div>
            )}
          </div>
        ))}
      </div>
      <Task done={both}>দুইটা axis-এর ওপরই রোদ ফেলুন, আর ছায়া মেপে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Why they agree. v = 2 e₁ + 3 e₂ and w = 2 e₁ + 1 e₂, so মামা's recipe
//     splits into four axis pairs. The reader taps each cell for its shadow:
//     same axis 1, crossed axes 0 (a right angle casts none). The crossed
//     cells vanish and 4 + 3 = 7 is left: slot × slot.

const VP = [2, 3];
const WP = [2, 1];

export function NoCrossTalk() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const all = open.length === 4;

  const tap = (c: number) => {
    if (open.includes(c)) return;
    const next = [...open, c];
    setOpen(next);
    if (next.length === 4) pass("Axis সোজা কোণে, তাই থাকে ঘরে ঘরে গুণ।");
  };

  return (
    <>
      <div className="mx-auto mt-2 grid max-w-sm grid-cols-[auto_1fr_1fr] gap-1.5 text-center">
        <span />
        {WP.map((x, j) => (
          <span key={j} className="font-mono text-sm font-semibold text-cat-coral">
            {x} e{j === 0 ? "₁" : "₂"}
          </span>
        ))}
        {VP.map((x, i) => (
          <div key={i} className="contents">
            <span className="self-center pr-1 font-mono text-sm font-semibold text-cat-blue">
              {x} e{i === 0 ? "₁" : "₂"}
            </span>
            {WP.map((y, j) => {
              const c = i * 2 + j;
              const on = open.includes(c);
              const same = i === j;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => tap(c)}
                  className={`min-h-20 cursor-pointer rounded-xl border-2 px-1 py-1.5 transition-colors motion-reduce:transition-none ${
                    on ? (same ? "border-accent bg-accent/10" : "border-border bg-foreground/5 text-muted") : "border-border hover:border-cat-blue/60"
                  }`}
                >
                  <div className="font-mono text-xs">
                    {x} × {y} × (e{i === 0 ? "₁" : "₂"} · e{j === 0 ? "₁" : "₂"})
                  </div>
                  {on ? (
                    <div className={FADE}>
                      <div className="text-[0.7rem] leading-tight">{same ? "নিজের ওপর পুরো ছায়া, 1" : "সোজা কোণ, ছায়া 0"}</div>
                      <div className={`font-mono text-lg font-bold ${same ? "" : "line-through"}`}>{same ? x * y : 0}</div>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-cat-blue">ছায়া দেখুন</div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {all && (
        <div className={`${FADE} mt-3 text-center font-mono text-[0.95rem]`}>
          4 + 0 + 0 + 3 = <b>7</b> = 2 × 2 + 3 × 1
        </div>
      )}
      <Task done={all}>চারটা ঘরেই tap করে দেখুন, কোন দুই axis-এর মধ্যে কতটা ছায়া পড়ে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · এবার আপনার পালা. Three new pairs. Before মামা measures, the reader says
//     what his tape and protractor will give, from the box alone. Wrong tries
//     bounce; a right one shows মামা's measurement agreeing.

const PAIRS: { u: XY; v: XY; opts: string[]; ans: number }[] = [
  { u: [4, 1], v: [1, 3], opts: ["12", "7", "5"], ans: 1 },
  { u: [3, 0], v: [-1, 2], opts: ["3", "6", "−3"], ans: 2 },
  { u: [2, 2], v: [-2, 2], opts: ["0", "8", "4"], ans: 0 },
];
const FP = makeFrame(-2.5, 4.5, -0.5, 3.5, 26);

export function YourPair() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const all = done === PAIRS.length;
  const p = PAIRS[Math.min(done, PAIRS.length - 1)];
  const shown = all ? PAIRS.length - 1 : done;

  const pick = (i: number) => {
    if (all) return;
    if (i !== p.ans) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setDone(done + 1);
    if (done + 1 === PAIRS.length) pass("চাঁদা-ফিতা আর box একই সংখ্যা দেয়।");
  };

  const q = PAIRS[shown];
  const prev = done > 0 ? PAIRS[done - 1] : null;
  return (
    <>
      <div className="text-center text-sm text-muted">
        জোড়া {Math.min(done + 1, PAIRS.length)}/{PAIRS.length}
      </div>
      <Plane f={FP} ticks={1} label={`u ${tupN(q.u)}, v ${tupN(q.v)}`} className="max-w-[15rem]">
        <Arc f={FP} a={q.u} b={q.v} r={0.8} />
        <Arrow f={FP} from={O} to={q.u} tone="blue" w={2.4} />
        <Arrow f={FP} from={O} to={q.v} tone="coral" w={2.4} />
      </Plane>
      <div className="text-center font-mono">
        <span className="text-cat-blue">{tupN(q.u)}</span> আর <span className="text-cat-coral">{tupN(q.v)}</span>
      </div>
      {!all ? (
        <>
          <div className="mt-2 text-sm font-medium text-muted">মামা মাপতে যাচ্ছেন। মাপার আগেই বলুন, তার উত্তর কত আসবে?</div>
          <div className="mt-2 flex justify-center gap-2">
            {p.opts.map((o, i) => (
              <button key={o} type="button" onClick={() => pick(i)} className={pill(false)}>
                {o}
              </button>
            ))}
          </div>
          {miss !== null && <Nope key={miss}>উঁহু। মামার মাপ লাগবে না, boxটা চালান: ঘরে ঘরে গুণ, তারপর যোগ।</Nope>}
        </>
      ) : null}
      {prev && (
        <div key={done} className={`${FADE} mt-2 text-center text-sm text-muted`}>
          ✓ মামা মাপলেন:{" "}
          <span className="font-mono">
            {fix(len(prev.u), 2)} × {fix(len(prev.v), 2)} × cos {fix(angleOf(prev.u, prev.v), 1)}° = {fix(dot(prev.u, prev.v), 1)}
          </span>
        </div>
      )}
      <Task done={all}>
        তিনটা জোড়ার প্রত্যেকটায় মামার উত্তর আগেভাগে বলে দিন ({Math.min(done, PAIRS.length)}/{PAIRS.length})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  TwoRecipes: { start: {}, bet: { bet: 0 } },
  StickShadow: { start: {}, some: { deg: 45, seen: [0, 30, 45] }, big: { deg: 60, L: 2, seen: [0, 30, 45, 60, 90], big: true } },
  BackShadow: { start: {}, guessed: { guess: 1, deg: 120, seen: [120] }, all: { guess: 1, deg: 180, seen: [120, 150, 180] } },
  ArrowShadow: { start: {}, way: { way: 1 }, back: { way: 1, w: [-2, 3], hit: [3, 0, -2] } },
  TwoTests: { start: {}, one: { k: 4 }, two: { round: 1, k: 4 } },
  AxisShadow: { start: {}, both: { lit: [0, 1] } },
  NoCrossTalk: { start: {}, some: { open: [0, 1] }, all: { open: [0, 1, 2, 3] } },
  YourPair: { start: {}, miss: { done: 1, miss: 1 }, all: { done: 3 } },
};
