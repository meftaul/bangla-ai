"use client";

import type { ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Bubble, Card as CastCard, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, pill, primaryBtn, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
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
//
// After the screens come the watch-only story scenes (on the ছাদ at noon, and
// at the TV that night) and the explanation figures for each <Then>, numbered
// after the screen they belong to (1a, 1½, 2a, 2½, 2¾, 3½, 3¾, 4a, 4½, 4¾, 5a,
// 5½, 5¾, 5⅞, 6½, 6¾, 6⅞, 7a, 7½, 7¾, 8a, 8½, 8¾, 9a).

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
    if (next.length === 4) pass("Axis ৯০ degree কোণে, তাই থাকে ঘরে ঘরে গুণ।");
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
                      <div className="text-[0.7rem] leading-tight">{same ? "নিজের ওপর পুরো ছায়া, 1" : "৯০ degree কোণ, ছায়া 0"}</div>
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
// Story scenes and explanation figures. Watch-only, driven by the reader
// (useScene): a story scene acts out a step's setup words on the ছাদ, a
// figure acts out the <Then> paragraph right before it. Props the cast
// doesn't have (the ছাদ with মামীর কাপড়, chalk on the floor, the বাঁশের
// কঞ্চি, the tape, the চাঁদা, the black box, a TV) are drawn here in fixed ink.

const S_INK = "#0f1b2d";
/** the ছাদের মেঝে on a Stage */
const SG = 150;

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** A caption that fades in afresh on every beat. */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** where w's shadow on v's line lands */
const foot = (w: XY, v: XY): XY => {
  const t = dot(w, v) / dot(v, v);
  return [v[0] * t, v[1] * t];
};

/** how far along the unit direction u a line from the origin can run and stay on the sheet */
const reach = (u: XY, f: Frame, m = 0.15) =>
  Math.min(
    u[0] > 1e-9 ? (f.x1 - m) / u[0] : u[0] < -1e-9 ? (f.x0 + m) / u[0] : Infinity,
    u[1] > 1e-9 ? (f.y1 - m) / u[1] : u[1] < -1e-9 ? (f.y0 + m) / u[1] : Infinity,
  );

/** A dashed line through the origin along v, edge to edge of the sheet: where v's shadows land. */
function S_Line({ f, v }: { f: Frame; v: XY }) {
  const n = len(v);
  const u: XY = [v[0] / n, v[1] / n];
  const a = reach([-u[0], -u[1]], f);
  const b = reach(u, f);
  return (
    <path
      d={`M${f.sx(-u[0] * a)} ${f.sy(-u[1] * a)}L${f.sx(u[0] * b)} ${f.sy(u[1] * b)}`}
      strokeWidth={1}
      strokeDasharray="3 4"
      className="pointer-events-none stroke-[#0f1b2d]/40"
    />
  );
}

const BAR = {
  ink: "stroke-[#0f1b2d]/60",
  danger: "stroke-danger/60",
  tape: "stroke-[#f59e0b]/70",
  blue: "stroke-cat-blue/45",
  coral: "stroke-cat-coral/45",
} as const;

/** A shadow (or a tape) laid along a line on the sheet. */
function S_Bar({ f, from = O, to, tone = "ink", w = 7 }: { f: Frame; from?: XY; to: XY; tone?: keyof typeof BAR; w?: number }) {
  return (
    <path
      d={`M${f.sx(from[0])} ${f.sy(from[1])}L${f.sx(to[0])} ${f.sy(to[1])}`}
      strokeWidth={w}
      strokeLinecap="round"
      className={`${FADE} pointer-events-none ${BAR[tone]}`}
    />
  );
}

/** The sun's line dropped from a tip onto the line it shadows. */
function S_Drop({ f, from, to }: { f: Frame; from: XY; to: XY }) {
  return (
    <path
      d={`M${f.sx(from[0])} ${f.sy(from[1])}L${f.sx(to[0])} ${f.sy(to[1])}`}
      strokeWidth={1.2}
      strokeDasharray="4 3"
      className={`${FADE} pointer-events-none stroke-[#d97706]`}
    />
  );
}

/** The little square of a right angle at `at`, between directions a and b. */
function S_Square({ f, at, a, b, s = 0.3 }: { f: Frame; at: XY; a: XY; b: XY; s?: number }) {
  const na = len(a);
  const nb = len(b);
  const A: XY = [at[0] + (a[0] / na) * s, at[1] + (a[1] / na) * s];
  const B: XY = [at[0] + (b[0] / nb) * s, at[1] + (b[1] / nb) * s];
  const C: XY = [A[0] + (b[0] / nb) * s, A[1] + (b[1] / nb) * s];
  return (
    <path
      d={`M${f.sx(A[0])} ${f.sy(A[1])}L${f.sx(C[0])} ${f.sy(C[1])}L${f.sx(B[0])} ${f.sy(B[1])}`}
      fill="none"
      strokeWidth={1}
      className={`${FADE} pointer-events-none stroke-[#0f1b2d]/70`}
    />
  );
}

/** A tick, drawn (glyphs turn into emoji on some systems). */
function S_Tick() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="inline-block size-3 shrink-0 text-accent-text">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A tape roll with its end hanging loose, centred at (0, 0) (4.2's tape). */
function S_Tape() {
  return (
    <g className="pointer-events-none">
      <rect x={-7} y={-5} width={14} height={10} rx={2} fill="#fbbf24" stroke="#b45309" strokeWidth={1} />
      <circle r={2.2} fill="#fff7ed" stroke="#b45309" strokeWidth={0.8} />
      <path d="M-7 3q-6 4 -9 9" fill="none" stroke="#f59e0b" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

/** A চাঁদা (half-circle protractor), flat side down, centred at (0, 0) (4.2's চাঁদা). */
function S_Protractor() {
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

/** Something that glides to (x, y) over `ms`, the way a Person does: draw it around (0, 0). */
function S_Carry({ x, y, ms = 1200, children }: { x: number; y: number; ms?: number; children: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {children}
    </g>
  );
}

/**
 * The ছাদ at noon, on a Stage: the sun right overhead, a parapet behind, the
 * floor in front, and মামীর কাপড় on a line at the left. `shade` puts each
 * cloth's shadow on the floor, straight under it.
 */
function S_Roof({ shade = false }: { shade?: boolean }) {
  return (
    <g className="pointer-events-none">
      <circle cx={160} cy={20} r={15} fill="#fde047" opacity={0.3} />
      <circle cx={160} cy={20} r={9} fill="#fbbf24" />
      <rect x={0} y={122} width={320} height={28} fill="#e7e0d6" />
      <rect x={0} y={119} width={320} height={4} fill="#cfc6b8" />
      <rect x={0} y={SG} width={320} height={30} fill="#bfb4a3" />
      <path d={`M0 ${SG}H320`} stroke="#a8a29e" strokeWidth={1} />
      <rect x={10} y={66} width={3} height={SG - 66} fill="#78716c" />
      <rect x={93} y={66} width={3} height={SG - 66} fill="#78716c" />
      <path d="M11.5 70Q53 78 94.5 70" fill="none" stroke="#57534e" strokeWidth={1} />
      <rect x={20} y={73} width={20} height={34} fill="#2563eb" />
      <path d="M20 83h20M20 95h20" stroke="#93c5fd" strokeWidth={1.2} />
      <rect x={46} y={76} width={14} height={24} fill="#dc2626" />
      <path d="M66 74h18l3 8h-5v20h-14v-20h-5Z" fill="#db2777" />
      {shade && (
        <g className={FADE}>
          <ellipse cx={30} cy={SG + 9} rx={11} ry={2.6} fill="#000" opacity={0.28} />
          <ellipse cx={53} cy={SG + 9} rx={8} ry={2.4} fill="#000" opacity={0.28} />
          <ellipse cx={75} cy={SG + 9} rx={10} ry={2.6} fill="#000" opacity={0.28} />
        </g>
      )}
    </g>
  );
}

/**
 * Chalk arrows on the ছাদের মেঝে, seen from the side: tails at (x, y), `u`
 * stage units a step, the depth squashed. `draw` chalks them in on mount.
 */
function S_Chalk({ x, y, arrows, names = [], u = 16, squash = 0.45, draw = false }: { x: number; y: number; arrows: XY[]; names?: string[]; u?: number; squash?: number; draw?: boolean }) {
  return (
    <g className="pointer-events-none">
      {arrows.map((a, i) => {
        const tx = x + a[0] * u;
        const ty = y - a[1] * u * squash;
        const l = Math.hypot(tx - x, ty - y) || 1;
        const ux = (tx - x) / l;
        const uy = (ty - y) / l;
        const d = `M${x} ${y}L${tx} ${ty}M${tx - ux * 5 - uy * 2.8} ${ty - uy * 5 + ux * 2.8}L${tx} ${ty}L${tx - ux * 5 + uy * 2.8} ${ty - uy * 5 - ux * 2.8}`;
        return (
          <g key={i}>
            {draw ? <Draw d={d} strokeWidth={1.6} delay={i * 350} className="stroke-white" /> : <path d={d} fill="none" strokeWidth={1.6} strokeLinecap="round" stroke="white" />}
            {names[i] && (
              <text x={tx + ux * 3 + 3} y={ty + 3} fontSize={8} fontWeight={700} fill="white">
                {names[i]}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** The বাঁশের কঞ্চি lying on the floor from x1 to x2. */
function S_Stick({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x1} ${y}H${x2}`} stroke="#b45309" strokeWidth={4} strokeLinecap="round" />
      {[1, 2].map((i) => (
        <path key={i} d={`M${x1 + ((x2 - x1) * i) / 3} ${y - 2.4}v4.8`} stroke="#78350f" strokeWidth={1.2} />
      ))}
    </g>
  );
}

/** The black box, bottom-centre at (x, SG), its lid tipped back when `open`. */
function S_Box({ x, open }: { x: number; open: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 18} y={SG - 24} width={36} height={24} rx={2} fill="#1f2937" />
      <text x={x} y={SG - 9} textAnchor="middle" fontSize={9} fontWeight={800} fill="white">
        box
      </text>
      <g
        style={{ transform: open ? "rotate(-40deg)" : "none", transformOrigin: `${x - 18}px ${SG - 24}px`, transformBox: "view-box" }}
        className="transition-transform duration-700 motion-reduce:transition-none"
      >
        <rect x={x - 20} y={SG - 29} width={40} height={5} rx={1.5} fill="#374151" />
      </g>
    </g>
  );
}

/** A TV on a low table, bottom-centre at (x, SG); `scores` puts the club's two numbers on its screen. */
function S_Tv({ x, scores }: { x: number; scores: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 46} y={SG - 18} width={92} height={5} rx={1} fill="#92400e" />
      <rect x={x - 42} y={SG - 13} width={4} height={13} fill="#78350f" />
      <rect x={x + 38} y={SG - 13} width={4} height={13} fill="#78350f" />
      <rect x={x - 5} y={SG - 22} width={10} height={4} fill="#374151" />
      <rect x={x - 42} y={SG - 66} width={84} height={44} rx={3} fill="#111827" />
      <rect x={x - 38} y={SG - 62} width={76} height={36} rx={1.5} fill="#1e3a8a" />
      {scores && (
        <g className={FADE} fontFamily="ui-monospace, monospace" fontSize={8.5} fontWeight={700} textAnchor="middle">
          <text x={x} y={SG - 47} fill="#bfdbfe">
            Mr. Bean 5.34
          </text>
          <text x={x} y={SG - 33} fill="#fecdd3">
            Titanic 4.09
          </text>
        </g>
      )}
    </g>
  );
}

/** A sized box for a sheet: the Plane inside fills it (`my-0! max-w-none`). */
function S_Sheet({ max, children }: { max: string; children: ReactNode }) {
  return <div className={`mx-auto w-full shrink-0 ${max}`}>{children}</div>;
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: noon on the ছাদ. মামা
//      chalks (2, 3) and (2, 1) on the floor, ফাহিম runs the box (7), মামা
//      says he'll get that 7 with a tape and a চাঁদা alone, and ফাহিম
//      wonders why two different sums would agree. No verdict.

export function RoofNoon({}: Story) {
  const s = useScene(5, [600, 1500, 1600, 2400, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="দুপুরে ছাদে মামা চক দিয়ে (2, 3) আর (2, 1) আঁকলেন; ফাহিম box চালিয়ে 7 পেলো; মামা বললেন ফিতা আর চাঁদা দিয়ে গুণ ছাড়াই 7 দেবেন; ফাহিম ভাবছে একই সংখ্যা কেন">
        <S_Roof />
        {k >= 2 && <S_Chalk x={172} y={175} arrows={[V, W]} names={["v", "w"]} draw />}
        <Person who="mama" x={k >= 1 ? 128 : -24} y={SG} walking={k === 1} ms={1400} arm={k === 2 ? "point" : k >= 4 ? "hold" : "down"} mood={k >= 4 ? "smug" : "plain"} label={k >= 1} />
        <Person who="fahim" x={k >= 1 ? 262 : 344} y={SG} facing={-1} walking={k === 1} ms={1400} mood={k === 3 ? "happy" : k === 5 ? "puzzled" : "plain"} label={k >= 1} />
        {k >= 4 && (
          <>
            <g className={POP}>
              <g transform={`translate(147 ${SG - 46})`}>
                <S_Tape />
              </g>
            </g>
            <g className={POP}>
              <g transform={`translate(164 ${SG - 38})`}>
                <S_Protractor />
              </g>
            </g>
          </>
        )}
        {k === 3 && <Bubble x={262} y={SG - 66} side="left" lines={["box চালালাম:", "2 × 2 + 3 × 1 = 7"]} />}
        {k === 4 && <Bubble x={128} y={SG - 66} lines={["গুণ ছাড়াই এই 7 দেবো,", "শুধু ফিতা আর চাঁদায়!"]} />}
        {k === 5 && <Bubble x={262} y={SG - 66} side="left" tone="think" lines={["দুইটা আলাদা হিসাব,", "একই সংখ্যা দেবে কেন?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: what মামা will measure.
//      The tape along v (3.61) and along w (2.24), both familiar; the চাঁদা
//      reads the angle θ; and θ goes into the product as a "?", the number
//      still to be found. The stick in the sun comes next.

const X1_SAY = [
  "মামার হাতে দুইটা মাপার জিনিস: ফিতা আর চাঁদা।",
  "ফিতা দিয়ে v-এর length: 3.61। এই মাপ তো চেনা।",
  "তারপর w-এর length: 2.24।",
  "চাঁদা দিয়ে মাপা হলো দুইটা arrow-এর মাঝের কোণ θ।",
  "কোণটা একটা সংখ্যায় বদলে গুণে ঢুকবে। সেই সংখ্যা বলবে দুইটা arrow কতটা একই দিকে।",
];

export function RecipeSlots() {
  const s = useScene(4, [600, 1800, 1500, 1800, 2800]);
  const k = s.k;
  const rows: [what: string, of: string, value: string, on: boolean][] = [
    ["ফিতা", "v", "3.61", k >= 1],
    ["ফিতা", "w", "2.24", k >= 2],
    ["চাঁদা", "কোণ", k >= 4 ? "θ → ?" : "θ", k >= 3],
  ];
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <div className="mx-auto flex max-w-xs items-center gap-3">
        <S_Sheet max="max-w-[8rem]">
          <Plane f={FB} ticks={1} label="(2, 3) আর (2, 1): ফিতায় দুইটার length, চাঁদায় মাঝের কোণ" className="my-0! max-w-none">
            {k === 1 && <S_Bar f={FB} to={V} tone="tape" w={6} />}
            {k === 2 && <S_Bar f={FB} to={W} tone="tape" w={6} />}
            {k >= 3 && <Arc f={FB} a={W} b={V} r={0.9} label={false} />}
            {k >= 3 && (
              <Label f={FB} at={[1.3, 1.02]} size={10} className="fill-[#0f1b2d]">
                θ
              </Label>
            )}
            <Arrow f={FB} from={O} to={V} tone="blue" w={2.4} />
            <Arrow f={FB} from={O} to={W} tone="coral" w={2.4} />
            <Label f={FB} at={V} dx={-4} dy={-4} anchor="end" className="fill-cat-blue">
              v
            </Label>
            <Label f={FB} at={W} dx={6} dy={4} anchor="start" className="fill-cat-coral">
              w
            </Label>
          </Plane>
        </S_Sheet>
        <div className="grid min-w-0 flex-1 gap-1.5 text-sm">
          {rows.map(([what, of, value, on]) => (
            <div key={of} className={`flex items-baseline justify-between gap-2 rounded-lg border px-2 py-1 transition-colors duration-500 motion-reduce:transition-none ${on ? "border-cat-violet/50 bg-cat-violet/5" : "border-border"}`}>
              <span>
                {what}, {of}
              </span>
              {on ? (
                <b key={value} className={`${FADE} font-mono`}>
                  {value}
                </b>
              ) : (
                <span className="text-muted/50">…</span>
              )}
            </div>
          ))}
          {k >= 4 && (
            <div className={`${FADE} text-center font-mono text-[0.95rem]`}>
              3.61 × 2.24 × <b className="text-cat-violet">?</b>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: a 1 m বাঁশের কঞ্চি lies
//      in the corner of the ছাদ; the noon sun's rays come straight down, and
//      every cloth's shadow falls right under it. The stick isn't lifted yet.

export function StickOnRoof({}: Story) {
  const s = useScene(3, [600, 1500, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ছাদের কোণায় ১ মিটার লম্বা একটা বাঁশের কঞ্চি; রোদ ঠিক মাথার ওপরে, তাই কাপড়ের ছায়া পড়ে ঠিক তার নিচে">
        <S_Roof shade={k >= 3} />
        {k >= 2 &&
          [30, 53, 75, 250, 280].map((x) => (
            <path key={x} d={`M${x} 34V${x > 100 ? 158 : 70}`} strokeWidth={1} strokeDasharray="3 4" stroke="#d97706" opacity={0.7} className={FADE} />
          ))}
        {k >= 3 && <ellipse cx={265} cy={169.5} rx={38} ry={2} fill="#000" opacity={0.25} className={FADE} />}
        <S_Stick x1={228} x2={302} y={167} />
        {k >= 1 && <CastCard x={265} y={146} text="1 m" tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: two sticks side by side.
//      At 60° the 1 m stick throws 0.5 and the 2 m stick 1, twice as long,
//      but shadow ÷ stick is 0.5 for both. Tilt both to 30° and the ratio
//      changes (0.87), for both at once: it belongs to the angle alone.

const X2_SAY = [
  "দুইটা লাঠি: একটা ১ মিটার, একটা ২ মিটার।",
  "১ মিটার লাঠি 60°-এ: ছায়া 0.5।",
  "২ মিটার লাঠি একই 60°-এ: ছায়া 1, দ্বিগুণ।",
  "কিন্তু ছায়া ÷ লাঠি দুইটাতেই 0.5।",
  "কোণ বদলালে ভাগফলও বদলায়, দুই লাঠিতে একসাথে। মানে ভাগফলটা শুধু কোণের।",
];
const X2_U = 50;
const X2_G = 98;

export function TwoSticks() {
  const s = useScene(4, [600, 1500, 1800, 2400, 2800]);
  const k = s.k;
  const [d] = useTween([k >= 4 ? 30 : 60], 900);
  const c = Math.cos(d * RAD);
  const sn = Math.sin(d * RAD);
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <svg viewBox="0 0 280 132" role="img" aria-label="১ মিটার আর ২ মিটার লাঠি একই কোণে: ছায়া দ্বিগুণ, কিন্তু ছায়া ÷ লাঠি সমান" className="mx-auto block h-auto w-full max-w-[17rem]">
        <rect x={1} y={1} width={278} height={130} rx={10} fill="white" stroke="#cbd5e1" />
        <text x={12} y={17} fontSize={9.5} fontWeight={600} fill="#475569">
          দুই লাঠিরই কোণ{" "}
          <tspan fontFamily="ui-monospace, monospace" fontWeight={700} fill={S_INK}>
            {Math.round(d)}°
          </tspan>
        </text>
        {[
          { x: 22, L: 1, on: k >= 1 },
          { x: 148, L: 2, on: k >= 2 },
        ].map(({ x, L, on }) => {
          const tx = x + L * X2_U * c;
          const ty = X2_G - L * X2_U * sn;
          return (
            <g key={L}>
              <path d={`M${x - 10} ${X2_G}H${x + 118}`} stroke="#94a3b8" strokeWidth={1.2} />
              <text x={x + 54} y={X2_G + 27} textAnchor="middle" fontSize={9} fill="#475569">
                {L === 1 ? "১ মিটার লাঠি" : "২ মিটার লাঠি"}
              </text>
              {on && (
                <g className={FADE}>
                  <path d={`M${x} ${X2_G}H${tx}`} strokeWidth={7} strokeLinecap="round" stroke={S_INK} strokeOpacity={0.6} />
                  <path d={`M${tx} ${ty}V${X2_G}`} strokeWidth={1.2} strokeDasharray="4 3" stroke="#d97706" />
                  <path d={`M${x} ${X2_G}L${tx} ${ty}`} strokeWidth={5} strokeLinecap="round" stroke="#92400e" />
                  <text x={(x + tx) / 2} y={X2_G + 14} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily="ui-monospace, monospace" fill={S_INK}>
                    {fix(L * c, 2)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {k >= 3 && (
        <div className={`${FADE} mx-auto mt-1.5 grid max-w-[17rem] grid-cols-2 gap-2 text-center font-mono text-sm`}>
          <span>
            {fix(c, 2)} ÷ 1 = <b>{fix(c, 2)}</b>
          </span>
          <span>
            {fix(2 * c, 2)} ÷ 2 = <b>{fix(c, 2)}</b>
          </span>
        </div>
      )}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2¾ · A figure for screen 2's explanation, no task: the right-angle
//      triangle. A 1 m stick at 30°, the sun's line from its tip and the
//      shadow close a triangle; the stick is the long side, the shadow the
//      side beside θ; cos θ = shadow ÷ stick, so cos 30° ≈ 0.87.

const X2B_SAY = [
  "30°-এ হেলানো ১ মিটার লাঠি, আর তার ছায়া।",
  "লাঠি, ছায়া আর রোদের দাগ মিলে একটা right-angle ত্রিভুজ।",
  "সবচেয়ে লম্বা বাহুটা লাঠি…",
  "…আর কোণ θ-এর পাশের বাহুটা ছায়া।",
  "cos θ মানে ছায়া ÷ লাঠি। এই লাঠির ছায়া 0.87, তাই cos 30° ≈ 0.87।",
];
const X2B_F = 34;
const X2B_G = 96;
const X2B_L = 150;

export function CosTriangle() {
  const s = useScene(4, [600, 1600, 1600, 1800, 2800]);
  const k = s.k;
  const a = 30 * RAD;
  const tx = X2B_F + X2B_L * Math.cos(a);
  const ty = X2B_G - X2B_L * Math.sin(a);
  const r = 24;
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <svg viewBox="0 0 220 116" role="img" aria-label="লাঠি, ছায়া আর রোদের দাগে একটা right-angle ত্রিভুজ; cos θ = ছায়া ÷ লাঠি" className="mx-auto block h-auto w-full max-w-[15rem]">
        <rect x={1} y={1} width={218} height={114} rx={10} fill="white" stroke="#cbd5e1" />
        <path d={`M12 ${X2B_G}H208`} stroke="#94a3b8" strokeWidth={1.2} />
        {k >= 1 && <path d={`M${X2B_F} ${X2B_G}L${tx} ${ty}L${tx} ${X2B_G}Z`} fill="#fde68a" fillOpacity={0.55} className={FADE} />}
        <path
          d={`M${X2B_F} ${X2B_G}H${tx}`}
          strokeWidth={7}
          strokeLinecap="round"
          stroke={S_INK}
          style={{ strokeOpacity: k === 3 ? 0.9 : 0.55 }}
          className="transition-[stroke-opacity] duration-500 motion-reduce:transition-none"
        />
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M${tx} ${ty}V${X2B_G}`} strokeWidth={1.3} strokeDasharray="4 3" stroke="#d97706" />
            <path d={`M${tx - 8} ${X2B_G}V${X2B_G - 8}H${tx}`} fill="none" strokeWidth={1} stroke={S_INK} />
          </g>
        )}
        <path d={`M${X2B_F} ${X2B_G}L${tx} ${ty}`} strokeLinecap="round" stroke="#92400e" style={{ strokeWidth: k === 2 ? 7 : 5 }} className="transition-[stroke-width] duration-500 motion-reduce:transition-none" />
        {k >= 2 && (
          <text x={(X2B_F + tx) / 2 - 6} y={(X2B_G + ty) / 2 - 8} textAnchor="middle" fontSize={10} fontWeight={700} fill="#92400e" transform={`rotate(-30 ${(X2B_F + tx) / 2 - 6} ${(X2B_G + ty) / 2 - 8})`} className={FADE}>
            লাঠি
          </text>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <path d={`M${X2B_F + r} ${X2B_G}A${r} ${r} 0 0 0 ${X2B_F + r * Math.cos(a)} ${X2B_G - r * Math.sin(a)}`} fill="none" stroke={S_INK} strokeWidth={1.2} />
            <text x={X2B_F + r + 5} y={X2B_G - 5} fontSize={10} fontWeight={700} fill={S_INK}>
              θ
            </text>
            <text x={(X2B_F + tx) / 2} y={X2B_G + 15} textAnchor="middle" fontSize={10} fontWeight={700} fill={S_INK}>
              ছায়া
            </text>
          </g>
        )}
      </svg>
      {k >= 4 && (
        <div className={`${FADE} mt-1 text-center text-[0.95rem]`}>
          cos θ = ছায়া ÷ লাঠি, <span className="font-mono">cos 30° ≈ 0.87</span>
        </div>
      )}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the stick turns from
//      flat in front (1) through upright (0) to flat behind (−1). Its tip
//      runs on a half circle, so the shadow stays between −1 and 1.

const X3_SAY = [
  "সামনে শোয়ানো লাঠি: ছায়া 1।",
  "খাড়া: ছায়া একটা বিন্দু, 0।",
  "উল্টো শোয়ানো: ছায়া পুরোটা পেছনে, −1।",
  "লাঠির মাথা ঘোরে এই অর্ধবৃত্তে। তাই ছায়া কখনো −1-এর কম বা 1-এর বেশি হয় না।",
];
const X3_C = 120;
const X3_G = 90;
const X3_R = 76;

export function HalfTurn() {
  const s = useScene(3, [600, 1600, 1800, 2800]);
  const k = s.k;
  const [d] = useTween([[0, 90, 180, 135][k]], 1100);
  const c = Math.cos(d * RAD);
  const tx = X3_C + X3_R * c;
  const ty = X3_G - X3_R * Math.sin(d * RAD);
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <svg viewBox="0 0 240 112" role="img" aria-label="লাঠি সামনে থেকে পেছনে ঘোরে; ছায়া 1 থেকে −1, কখনো তার বাইরে না" className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect x={1} y={1} width={238} height={110} rx={10} fill="white" stroke="#cbd5e1" />
        {k >= 3 && <rect x={X3_C - X3_R} y={X3_G - 5} width={2 * X3_R} height={10} rx={3} fill="#bbf7d0" className={FADE} />}
        {k >= 3 && <path d={`M${X3_C + X3_R} ${X3_G}A${X3_R} ${X3_R} 0 0 0 ${X3_C - X3_R} ${X3_G}`} fill="none" stroke="#d97706" strokeWidth={1.2} strokeDasharray="3 4" className={FADE} />}
        <path d={`M${X3_C - X3_R - 16} ${X3_G}H${X3_C + X3_R + 16}`} stroke="#94a3b8" strokeWidth={1.2} />
        {[-1, 0, 1].map((t) => (
          <g key={t}>
            <path d={`M${X3_C + t * X3_R} ${X3_G - 3}v6`} stroke="#64748b" strokeWidth={1} />
            <text x={X3_C + t * X3_R} y={X3_G + 17} textAnchor="middle" fontSize={9} fontFamily="ui-monospace, monospace" fill="#475569">
              {t < 0 ? "−1" : t}
            </text>
          </g>
        ))}
        {Math.abs(c) > 0.01 && <path d={`M${X3_C} ${X3_G}H${tx}`} strokeWidth={7} strokeLinecap="round" stroke={c < 0 ? "#dc2626" : S_INK} strokeOpacity={0.6} />}
        <path d={`M${tx} ${ty}V${X3_G}`} strokeWidth={1.2} strokeDasharray="4 3" stroke="#d97706" />
        <path d={`M${X3_C} ${X3_G}L${tx} ${ty}`} strokeWidth={5} strokeLinecap="round" stroke="#92400e" />
        <circle cx={X3_C} cy={X3_G} r={3.5} fill={S_INK} />
        <text x={12} y={17} fontSize={10} fontWeight={700} fill={c < -0.005 ? "#b91c1c" : S_INK}>
          ছায়া{" "}
          <tspan fontFamily="ui-monospace, monospace">
            {fix(c, 2)}
          </tspan>
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation, no task: 4.2's van table beside
//      the stick. Under 90°, at 90° and past it, the shadow and the box
//      carry the same sign.

const X3B_SAY = [
  "বাঁয়ে লাঠির ছায়া, ডানে ৪.২-এর ভ্যানের box।",
  "90°-এর কম: দুইটাই plus।",
  "ঠিক 90°: দুইটাই 0।",
  "90°-এর বেশি: দুইটাই minus।",
  "একই ছক, একই চিহ্ন।",
];
const X3B_ROWS = [
  { deg: 45, name: "90°-এর কম", v: "plus", tone: "text-accent-text" },
  { deg: 90, name: "ঠিক 90°", v: "0", tone: "" },
  { deg: 135, name: "90°-এর বেশি", v: "minus", tone: "text-danger" },
];

function X3B_Icon({ deg }: { deg: number }) {
  const c = Math.cos(deg * RAD);
  const tx = 20 + 15 * c;
  const ty = 21 - 15 * Math.sin(deg * RAD);
  return (
    <svg viewBox="0 0 40 26" aria-hidden="true" className="h-5 w-8 shrink-0">
      <path d="M3 21H37" stroke="#94a3b8" strokeWidth={1.2} />
      {Math.abs(c) > 0.01 && <path d={`M20 21H${tx}`} strokeWidth={4} strokeLinecap="round" stroke={c < 0 ? "#dc2626" : S_INK} strokeOpacity={0.6} />}
      <path d={`M20 21L${tx} ${ty}`} strokeWidth={3} strokeLinecap="round" stroke="#92400e" />
    </svg>
  );
}

export function VanTable() {
  const s = useScene(4, [600, 1500, 1500, 1500, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs grid-cols-[auto_1fr_1fr] items-center gap-x-2 gap-y-1 text-sm">
        <span />
        <span className="text-center text-xs text-muted">লাঠির ছায়া</span>
        <span className="text-center text-xs text-muted">৪.২-এর box</span>
        {X3B_ROWS.map((r, i) => (
          <div key={r.name} className="contents">
            <span className="flex items-center gap-1.5">
              <X3B_Icon deg={r.deg} />
              <span className="text-xs">{r.name}</span>
            </span>
            {[0, 1].map((j) =>
              k > i ? (
                <span
                  key={j}
                  className={`${FADE} rounded-lg py-0.5 text-center font-semibold transition-colors duration-500 motion-reduce:transition-none ${r.tone} ${k >= 4 ? "bg-accent/10" : "bg-foreground/5"}`}
                >
                  {r.v}
                </span>
              ) : (
                <span key={j} className="rounded-lg py-0.5 text-center text-muted/50">
                  ?
                </span>
              ),
            )}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A watch-only figure for screen 4's setup (a story scene, no task):
//      the stick in the sun becomes two chalk arrows. The ground turns into
//      v, the stick into w, and the sun comes over v. Where w's shadow falls
//      is left as the question.

const FS = makeFrame(-0.6, 5.6, -0.5, 3.8, 26);
const X4A_SAY = [
  "ছাদের সেই লাঠি, মাটি থেকে একটা কোণ করে ওঠা।",
  "মাটির জায়গায় v, শুয়ে আছে।",
  "লাঠির জায়গায় w, একই কোণে উঠে গেছে।",
  "এবার রোদ আসছে v-এর ঠিক মাথার ওপর থেকে। w-এর ছায়া কোথায় পড়বে?",
];

export function StickToArrow({}: Story) {
  const s = useScene(3, [600, 1500, 1500, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X4A_SAY, k)}>
      <S_Sheet max="max-w-[13rem]">
        <Plane f={FS} grid={0} axes={false} label="মাটি হলো v, লাঠি হলো w; রোদ v-এর মাথার ওপর থেকে" className="my-0! max-w-none">
          {k === 0 ? (
            <path d={`M${FS.sx(-0.5)} ${FS.sy(0)}H${FS.sx(5.5)}`} strokeWidth={2} className="stroke-[#a8a29e]" />
          ) : (
            <Arrow f={FS} from={O} to={VFLAT} tone="teal" w={3} draw />
          )}
          {k < 2 ? (
            <path d={`M${FS.sx(0)} ${FS.sy(0)}L${FS.sx(2)} ${FS.sy(3)}`} strokeWidth={5} strokeLinecap="round" className="stroke-[#92400e]" />
          ) : (
            <Arrow f={FS} from={O} to={V} tone="coral" w={2.6} draw />
          )}
          {k >= 1 && (
            <Label f={FS} at={VFLAT} dx={-4} dy={-8} anchor="end" className={`${FADE} fill-cat-teal`}>
              v
            </Label>
          )}
          {k >= 2 && (
            <Label f={FS} at={V} dx={6} dy={-4} anchor="start" className={`${FADE} fill-cat-coral`}>
              w
            </Label>
          )}
          {k >= 3 && (
            <g className={FADE}>
              <circle cx={FS.sx(4.6)} cy={FS.sy(3.35)} r={8} className="fill-[#fbbf24]" />
              {[2.9, 3.7, 4.5].map((x) => (
                <path key={x} d={`M${FS.sx(x)} ${FS.sy(2.9)}V${FS.sy(0.2)}`} strokeWidth={1} strokeDasharray="3 4" className="stroke-[#d97706]" />
              ))}
              <text x={FS.sx(2.2)} y={FS.sy(0) + 17} textAnchor="middle" fontSize={14} fontWeight={800} className="fill-[#0f1b2d]">
                ?
              </text>
            </g>
          )}
        </Plane>
      </S_Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: two ways to lay w on v.
//      Rotating w down always gives its whole length, 3.61, whatever the
//      angle (w tips up to 80° and it's still 3.61). Dropping the sun's line
//      from w's tip gives 2: the projection.

const X4_LEN = Math.hypot(2, 3);
const X4_SAY = [
  "v শোয়ানো, w একটা কোণ করে উঠে গেছে।",
  "w-কে ঘুরিয়ে v-এর ওপর শুইয়ে দিলে পাই w-এর পুরো length, 3.61।",
  "কোণ যা-ই হোক, ঘুরিয়ে শোয়ালে সবসময় সেই 3.61।",
  "রোদ নামে সোজা: w-এর মাথা থেকে v-এর ওপর খাড়া দাগ। ছায়া 2।",
  "যতটুকু পড়ে, সেটা w-এর যে অংশটা v-এর দিকে যায়: projection।",
];

export function RotateVsDrop() {
  const s = useScene(4, [600, 1800, 2200, 2400, 2600]);
  const k = s.k;
  const [a] = useTween([k === 2 ? 80 : 56.31], 900);
  const w: XY = [X4_LEN * Math.cos(a * RAD), X4_LEN * Math.sin(a * RAD)];
  const rot = k === 1 || k === 2;
  const drop = k >= 3;
  const R = X4_LEN * FS.u;
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <S_Sheet max="max-w-[13rem]">
        <Plane f={FS} grid={0} axes={false} label="w-কে ঘুরিয়ে শোয়ালে 3.61, রোদের খাড়া দাগে ছায়া 2" className="my-0! max-w-none">
          {rot && <path d={`M${FS.sx(w[0])} ${FS.sy(w[1])}A${R} ${R} 0 0 1 ${FS.sx(X4_LEN)} ${FS.sy(0)}`} fill="none" strokeWidth={1.3} strokeDasharray="4 3" className={`${FADE} stroke-cat-coral`} />}
          {rot && <S_Bar f={FS} to={[X4_LEN, 0]} tone="coral" />}
          {rot && (
            <Label f={FS} at={[X4_LEN / 2, 0]} dy={17} size={9} className="fill-[#be123c] font-mono">
              3.61
            </Label>
          )}
          {drop && <S_Bar f={FS} to={[w[0], 0]} />}
          {drop && <S_Drop f={FS} from={w} to={[w[0], 0]} />}
          {drop && <S_Square f={FS} at={[w[0], 0]} a={[-1, 0]} b={[0, 1]} />}
          {drop && (
            <Label f={FS} at={[w[0] / 2, 0]} dy={17} size={9} className="fill-[#0f1b2d] font-mono">
              2
            </Label>
          )}
          {k >= 4 && (
            <Label f={FS} at={[w[0] / 2, 0]} dy={29} size={9} weight={800} className={`${FADE} fill-[#0f1b2d]`}>
              projection
            </Label>
          )}
          <Arrow f={FS} from={O} to={VFLAT} tone="teal" w={3} />
          <Arrow f={FS} from={O} to={w} tone="coral" w={2.6} />
          <Label f={FS} at={VFLAT} dx={-4} dy={-8} anchor="end" className="fill-cat-teal">
            v
          </Label>
          <Label f={FS} at={w} dx={6} dy={-4} anchor="start" className="fill-cat-coral">
            w
          </Label>
        </Plane>
      </S_Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's explanation, no task: with v lying flat, the
//      shadow of (2, 3) is its first number, 2; the stick's sum agrees:
//      3.61 × cos 56.3° ≈ 2.

const FN = makeFrame(-0.5, 3.5, -0.5, 3.5, 34);
const X4B_SAY = [
  "v শোয়ানো, ঠিক পূর্ব দিক বরাবর। w হলো (2, 3)।",
  "w-এর মাথা থেকে সোজা নিচে দাগ নামালে ছায়া থামে 2-এ।",
  "ছায়া 2, ঠিক w-এর প্রথম সংখ্যাটা।",
  "লাঠির হিসাবেও তাই: 3.61 × cos 56.3° ≈ 2।",
];

export function FirstNumber() {
  const s = useScene(3, [600, 1800, 2000, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <div className="mx-auto flex max-w-xs items-center gap-3">
        <S_Sheet max="max-w-[9rem]">
          <Plane f={FN} ticks={1} label="v শোয়ানো, w (2, 3); v-এর ওপর w-এর ছায়া 2" className="my-0! max-w-none">
            {k >= 1 && <S_Bar f={FN} to={[2, 0]} />}
            {k >= 1 && <S_Drop f={FN} from={V} to={[2, 0]} />}
            <Arrow f={FN} from={O} to={[3.2, 0]} tone="teal" w={2.8} />
            <Arrow f={FN} from={O} to={V} tone="coral" w={2.4} />
            <Label f={FN} at={[3.2, 0]} dx={-2} dy={-7} anchor="end" className="fill-cat-teal">
              v
            </Label>
            <Label f={FN} at={V} dx={6} dy={4} anchor="start" className="fill-cat-coral">
              w
            </Label>
          </Plane>
        </S_Sheet>
        <div className="grid min-w-0 flex-1 gap-1.5 text-sm">
          <div className="font-mono text-base">
            w = (
            <span className={`rounded px-0.5 transition-colors duration-500 motion-reduce:transition-none ${k >= 2 ? "bg-cat-amber/25 font-bold" : ""}`}>2</span>, 3)
          </div>
          {k >= 1 && (
            <div className={FADE}>
              ছায়া <b className="font-mono">2</b>
            </div>
          )}
          {k >= 3 && <div className={`${FADE} font-mono text-xs`}>3.61 × cos 56.3° ≈ 2</div>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: মামা spells out his
//      recipe over the chalk arrows: measure v with the tape, then w's shadow
//      on v, then multiply. The numbers come in the widget.

const X5A = { x: 150, y: 175, u: 22, sq: 0.6 };

export function MamaRecipe({}: Story) {
  const s = useScene(3, [600, 2400, 2600, 2200]);
  const k = s.k;
  const { x, y, u, sq } = X5A;
  const vt = x + 3.61 * u;
  const wx = x + 1.94 * u;
  const wy = y - 1.11 * u * sq;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামা বলছেন: v-এর length মাপো, তারপর v-এর ওপর w-এর ছায়া মাপো, তারপর দুইটা গুণ করো">
        <S_Roof />
        <S_Chalk x={x} y={y} arrows={[[3.61, 0], [1.94, 1.11]]} names={["v", "w"]} u={u} squash={sq} />
        {k >= 1 && <Draw d={`M${x} ${y + 3.5}H${vt}`} strokeWidth={2.6} className="stroke-[#f59e0b]" />}
        {k >= 1 && (
          <g className={POP}>
            <g transform={`translate(${vt + 11} ${y + 1})`}>
              <S_Tape />
            </g>
          </g>
        )}
        {k >= 2 && <path d={`M${wx} ${wy}V${y}`} strokeWidth={1.2} strokeDasharray="3 2" stroke="#b45309" className={FADE} />}
        {k >= 2 && <Draw d={`M${x} ${y}H${wx}`} strokeWidth={4} className="stroke-[#0f1b2d]/60" />}
        <Person who="mama" x={118} y={SG} arm={k >= 1 ? "point" : "down"} mood={k >= 3 ? "happy" : "plain"} label />
        <Person who="fahim" x={270} y={SG} facing={-1} mood={k >= 3 ? "puzzled" : "plain"} label />
        {k === 1 && <Bubble x={118} y={SG - 66} lines={["আগে v-এর length মাপো।"]} />}
        {k === 2 && <Bubble x={118} y={SG - 66} lines={["তারপর v-এর ওপর", "w-এর ছায়া মাপো।"]} />}
        {k === 3 && <Bubble x={118} y={SG - 66} lines={["এবার দুইটা গুণ করো!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: length × shadow, twice.
//      (2, 0) and (3, 3): w's shadow on v is 3, v is 2 long, 2 × 3 = 6. The
//      bet's pair: w's shadow on v is 1.94, v is 3.61, 3.61 × 1.94 = 7.0.
//      Last, the sentence becomes the formula.

const FL = makeFrame(-0.5, 3.5, -0.5, 3.5, 30);
const X5_PAIRS: { v: XY; w: XY; shadow: string; len: string; prod: string; box: number }[] = [
  { v: [2, 0], w: [3, 3], shadow: "3", len: "2", prod: "2 × 3 = 6", box: 6 },
  { v: [2, 3], w: [2, 1], shadow: "1.94", len: "3.61", prod: "3.61 × 1.94 = 7.0", box: 7 },
];
const X5_SAY = [
  "প্রথম জোড়া: v = (2, 0), w = (3, 3)।",
  "w-এর যতটুকু v-এর দিকে যায়, মানে v-এর ওপর ছায়া: 3।",
  "v-এর length 2, গুণ ছায়া 3: 6। box এ ও 6।",
  "বাজির জোড়া: v-এর ওপর w-এর ছায়া 1.94।",
  "v-এর length 3.61, গুণ ছায়া 1.94: 7.0। box এ ও 7।",
  "v-এর length, গুণ v-এর ওপর w-এর ছায়া। এটাই মামার হিসাব।",
];

export function LengthTimesShadow() {
  const s = useScene(5, [600, 1800, 2400, 2200, 2400, 2600]);
  const k = s.k;
  const two = k >= 3;
  const p = X5_PAIRS[two ? 1 : 0];
  const ft = foot(p.w, p.v);
  const shadow = two ? k >= 3 : k >= 1;
  const tape = two ? k >= 4 : k >= 2;
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <div className="mx-auto flex max-w-xs items-center gap-3">
        <S_Sheet max="max-w-[8.5rem]">
          <Plane key={two ? 2 : 1} f={FL} ticks={1} label={`v ${tupN(p.v)}, w ${tupN(p.w)}: v-এর length গুণ v-এর ওপর w-এর ছায়া`} className="my-0! max-w-none">
            <S_Line f={FL} v={p.v} />
            {shadow && <S_Bar f={FL} to={ft} />}
            {shadow && <S_Drop f={FL} from={p.w} to={ft} />}
            {shadow && <S_Square f={FL} at={ft} a={[-p.v[0], -p.v[1]]} b={[p.w[0] - ft[0], p.w[1] - ft[1]]} s={0.25} />}
            {tape && <S_Bar f={FL} to={p.v} tone="tape" w={4} />}
            <Arrow f={FL} from={O} to={p.v} tone="blue" w={2.4} />
            <Arrow f={FL} from={O} to={p.w} tone="coral" w={2.4} />
          </Plane>
        </S_Sheet>
        <div key={two ? 2 : 1} className={`${FADE} grid min-w-0 flex-1 gap-1 text-sm`}>
          <div className="text-xs text-muted">{two ? "বাজির জোড়া" : "প্রথম জোড়া"}</div>
          <div className="font-mono text-xs">
            <span className="text-cat-blue">v {tupN(p.v)}</span> <span className="text-cat-coral">w {tupN(p.w)}</span>
          </div>
          {shadow && (
            <div className={FADE}>
              ছায়া <b className="font-mono">{p.shadow}</b>
            </div>
          )}
          {tape && (
            <div className={FADE}>
              v-এর length <b className="font-mono">{p.len}</b>
            </div>
          )}
          {tape && <div className={`${FADE} font-mono font-bold`}>{p.prod}</div>}
          {tape && (
            <div className={`${FADE} flex items-center gap-1 text-xs text-accent-text`}>
              <S_Tick /> box এ ও {p.box}
            </div>
          )}
        </div>
      </div>
      {k >= 5 && <div className={`${FADE} mt-2 text-center font-mono text-sm`}>‖v‖ × ‖w‖ cos θ = v · w</div>}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5¾ · A figure for the check after screen 5, no task: 4.2's debt. The road
//      card (4, 3) is 5 long; ফাহিম's push runs along it, so its shadow is
//      the whole 5; 5 × 5 = 25, the box's old number, 5 times the push.

const FRD = makeFrame(-0.5, 4.5, -0.5, 3.5, 28);
const X6_ROAD: XY = [4, 3];
const X6_OFF: XY = [-0.2, 0.27];
const X6_SAY = [
  "৪.২-এর রাস্তার card (4, 3), লম্বায় 5।",
  "ফাহিম ঠেলছিল ঠিক রাস্তা বরাবর, (4, 3)।",
  "ধাক্কা রাস্তা বরাবর, তাই রাস্তার ওপর তার ছায়া পুরো 5।",
  "রাস্তার length 5, গুণ ছায়া 5: 25। বাড়তি 5 গুণটা আসছিল রাস্তার length থেকে।",
];

export function RoadDebt() {
  const s = useScene(3, [600, 1600, 1800, 2800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      <div className="mx-auto flex max-w-xs items-center gap-3">
        <S_Sheet max="max-w-[9rem]">
          <Plane f={FRD} ticks={1} label="রাস্তা (4, 3), ফাহিমের ধাক্কা রাস্তা বরাবর, ছায়া 5, box 25" className="my-0! max-w-none">
            {k >= 2 && <S_Bar f={FRD} to={X6_ROAD} w={10} />}
            <Arrow f={FRD} from={O} to={X6_ROAD} tone="teal" w={3.2} />
            {k >= 1 && <Arrow f={FRD} from={X6_OFF} to={[4 + X6_OFF[0], 3 + X6_OFF[1]]} tone="coral" w={2.2} draw />}
            <Label f={FRD} at={[3, 1.35]} dx={4} dy={4} anchor="start" size={9} className="fill-cat-teal">
              রাস্তা
            </Label>
            {k >= 1 && (
              <Label f={FRD} at={[1.4, 1.35]} dx={-7} dy={-2} anchor="end" size={9} className={`${FADE} fill-cat-coral`}>
                ধাক্কা
              </Label>
            )}
          </Plane>
        </S_Sheet>
        <div className="grid min-w-0 flex-1 gap-1 text-sm">
          <div>
            রাস্তার length <b className="font-mono">5</b>
          </div>
          {k >= 2 && (
            <div className={FADE}>
              ধাক্কার ছায়া <b className="font-mono">5</b>
            </div>
          )}
          {k >= 3 && <div className={`${FADE} font-mono font-bold`}>5 × 5 = 25</div>}
          {k >= 3 && (
            <div className={`${FADE} flex items-center gap-1 text-xs text-accent-text`}>
              <S_Tick /> box এ ও 25
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5⅞ · A figure for the same check, no task: two matches are not a
//      proof. The two tested pairs, then unknown pairs with "?", doubt on the
//      two, and the open question: always? why?

const X6B_DONE = [
  { pair: "(2, 0), (3, 3)", n: 6 },
  { pair: "(2, 3), (2, 1)", n: 7 },
];
const X6B_SAY = [
  "দুইটা জোড়ায় দুই হিসাব মিললো।",
  "কিন্তু arrow-এর জোড়া তো আরও আছে। ওগুলোতে?",
  "হতে পারে এই দুইটা ভাগ্যক্রমে মিলে গেছে।",
  "“সবসময়” মানতে হলে জানতে হবে কেন মেলে।",
];

export function NotYetProof() {
  const s = useScene(3, [600, 1800, 2000, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-1.5 text-center">
        {X6B_DONE.map((d) => (
          <div
            key={d.pair}
            className={`rounded-xl border-2 px-1 py-1 transition-colors duration-500 motion-reduce:transition-none ${k >= 2 ? "border-dashed border-cat-amber/60 bg-cat-amber/10" : "border-accent/50 bg-accent/10"}`}
          >
            <div className="font-mono text-[0.65rem]">{d.pair}</div>
            <div className="flex items-center justify-center gap-1 text-xs">
              <S_Tick /> box {d.n}, মামা {d.n}
            </div>
          </div>
        ))}
        {k >= 1 &&
          [0, 1, 2, 3].map((i) => (
            <div key={i} style={{ transitionDelay: `${i * 120}ms` }} className={`${POP} flex items-center justify-center rounded-xl border-2 border-dashed border-border py-1.5 font-mono text-lg text-muted`}>
              ?
            </div>
          ))}
      </div>
      {k >= 3 && <div className={`${POP} mx-auto mt-2 w-fit rounded-full bg-cat-amber/15 px-3 py-0.5 text-sm font-semibold`}>সবসময়? কেন?</div>}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: 2.2's walk is the
//      shadow. (2, 3) as 2 steps east then 3 north; then the sun from above
//      lays a shadow of 2 on the east axis, and from the side one of 3 on the
//      north axis, each the length of its walk.

const FW = makeFrame(-0.5, 3.5, -0.5, 3.5, 34);
const X8_SAY = [
  "২.২-এ (2, 3) মানে ছিল একটা হাঁটা।",
  "পূর্বে 2 পা…",
  "…তারপর উত্তরে 3 পা।",
  "ওপর থেকে রোদ: পূর্বের axis-এ ছায়া 2, পূর্বে হাঁটার সমান।",
  "পাশ থেকে রোদ: উত্তরের axis-এ ছায়া 3। কতদূর হাঁটা, সেটাই ছায়া।",
];

export function WalkIsShadow() {
  const s = useScene(4, [600, 1400, 1600, 2400, 2800]);
  const k = s.k;
  const rows: [string, string, boolean][] = [
    ["পূর্বে হাঁটা", "2", k >= 1],
    ["উত্তরে হাঁটা", "3", k >= 2],
    ["পূর্বের axis-এ ছায়া", "2", k >= 3],
    ["উত্তরের axis-এ ছায়া", "3", k >= 4],
  ];
  return (
    <Scene scene={s} caption={say(X8_SAY, k)}>
      <div className="mx-auto flex max-w-xs items-center gap-3">
        <S_Sheet max="max-w-[9rem]">
          <Plane f={FW} ticks={1} label="(2, 3): পূর্বে 2 আর উত্তরে 3 হাঁটা, দুই axis-এ ছায়াও 2 আর 3" className="my-0! max-w-none">
            {k >= 3 && <S_Bar f={FW} to={[2, 0]} />}
            {k >= 3 && <S_Drop f={FW} from={V} to={[2, 0]} />}
            {k >= 4 && <S_Bar f={FW} to={[0, 3]} />}
            {k >= 4 && <S_Drop f={FW} from={V} to={[0, 3]} />}
            {k >= 1 && <Arrow f={FW} from={O} to={[2, 0]} tone="amber" w={2.2} draw />}
            {k >= 2 && <Arrow f={FW} from={[2, 0]} to={V} tone="amber" w={2.2} draw />}
            <Arrow f={FW} from={O} to={V} tone="blue" w={2.6} />
          </Plane>
        </S_Sheet>
        <div className="grid min-w-0 flex-1 gap-1 text-[0.8rem]">
          {rows.map(([name, n, on]) => (
            <div key={name} className={`flex items-baseline justify-between gap-1 ${on ? "" : "opacity-30"} transition-opacity duration-500 motion-reduce:transition-none`}>
              <span>{name}</span>
              <b className="font-mono">{on ? n : "?"}</b>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for the check after screen 6, no task: a new address. (2, 3)
//      on the old axes; the axes turn to (0.8, 0.6) and (−0.6, 0.8), both 1
//      long and at 90°; the box with each gives the shadow on it: 3.4, 1.2.

const FT = makeFrame(-1.5, 3.5, -0.5, 3.5, 28);
const X9_SAY = [
  "পুরানো axis-এ address (2, 3)।",
  "নতুন দুইটা axis: দুইটাই 1 unit লম্বা, একটা আরেকটার সাথে ৯০ degree কোণে।",
  "প্রথম নতুন axis (0.8, 0.6)-এর সাথে box: 2 × 0.8 + 3 × 0.6 = 3.4। ওর ওপর ছায়াও 3.4।",
  "দ্বিতীয়টা (−0.6, 0.8)-এর সাথে box: 1.2। একই জায়গার নতুন address (3.4, 1.2)।",
];

export function TiltedAddress() {
  const s = useScene(3, [600, 1800, 2800, 2800]);
  const k = s.k;
  const [t] = useTween([k >= 1 ? 36.87 : 0], 1100);
  const u1: XY = [Math.cos(t * RAD), Math.sin(t * RAD)];
  const u2: XY = [-u1[1], u1[0]];
  const f1: XY = [u1[0] * dot(V, u1), u1[1] * dot(V, u1)];
  const f2: XY = [u2[0] * dot(V, u2), u2[1] * dot(V, u2)];
  return (
    <Scene scene={s} caption={say(X9_SAY, k)}>
      <div className="mx-auto flex max-w-xs items-center gap-3">
        <S_Sheet max="max-w-[9.5rem]">
          <Plane f={FT} axes={false} label="(2, 3) আর দুইটা হেলানো axis; নতুন address (3.4, 1.2)" className="my-0! max-w-none">
            <S_Line f={FT} v={u1} />
            <S_Line f={FT} v={u2} />
            {k >= 2 && <S_Bar f={FT} to={f1} />}
            {k >= 2 && <S_Drop f={FT} from={V} to={f1} />}
            {k >= 3 && <S_Bar f={FT} to={f2} />}
            {k >= 3 && <S_Drop f={FT} from={V} to={f2} />}
            <Arrow f={FT} from={O} to={u1} tone="teal" w={2.4} />
            <Arrow f={FT} from={O} to={u2} tone="teal" w={2.4} />
            <Arrow f={FT} from={O} to={V} tone="blue" w={2.6} />
          </Plane>
        </S_Sheet>
        <div className="grid min-w-0 flex-1 gap-1 text-sm">
          <div className={k >= 1 ? "text-muted line-through decoration-1" : ""}>
            address <b className="font-mono">(2, 3)</b>
          </div>
          {k >= 2 && (
            <div className={FADE}>
              নতুন axis ১: <b className="font-mono">3.4</b>
            </div>
          )}
          {k >= 3 && (
            <div className={FADE}>
              নতুন axis ২: <b className="font-mono">1.2</b>
            </div>
          )}
          {k >= 3 && (
            <div className={`${FADE} font-semibold`}>
              নতুন address <span className="font-mono whitespace-nowrap">(3.4, 1.2)</span>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6⅞ · A figure for the same check, no task: PCA in one picture. A
//      cloud of data dots, one good direction through it, each dot dropping
//      its shadow onto it, and the dots settling there as one number each.

const X9B_C = { x: 120, y: 60, u: 34 };
const X9B_D: XY = [0.894, 0.447];
const X9B_DOTS: XY[] = [
  [-2.3, -0.8],
  [-1.7, -1.2],
  [-1.2, -0.3],
  [-0.7, -0.8],
  [-0.2, 0.2],
  [0.3, -0.3],
  [0.8, 0.8],
  [1.3, 0.2],
  [1.8, 1.2],
  [2.3, 0.8],
];
const X9B_SAY = [
  "একগাদা data, প্রতিটা একটা dot।",
  "Data-র জন্য একটা ভালো দিক, যেদিক বরাবর dot-গুলো ছড়ানো।",
  "প্রতিটা dot থেকে ওই দিকের ওপর ছায়া।",
  "এখন প্রতিটা dot মানে একটা সংখ্যা, ওই দিকে তার ছায়া। PCA-র প্রায় পুরো কথা এটাই।",
];

export function PcaShadow() {
  const s = useScene(3, [600, 1800, 1800, 2800]);
  const k = s.k;
  const px = (p: XY) => X9B_C.x + p[0] * X9B_C.u;
  const py = (p: XY) => X9B_C.y - p[1] * X9B_C.u;
  const on = (p: XY): XY => {
    const t = p[0] * X9B_D[0] + p[1] * X9B_D[1];
    return [X9B_D[0] * t, X9B_D[1] * t];
  };
  const L = 3.3;
  return (
    <Scene scene={s} caption={say(X9B_SAY, k)}>
      <svg viewBox="0 0 240 120" role="img" aria-label="data-র dot-গুলো একটা দিকের ওপর ছায়া ফেলে সেই লাইনে বসে যায়" className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect x={1} y={1} width={238} height={118} rx={10} fill="white" stroke="#cbd5e1" />
        {k >= 1 && <Draw d={`M${px([-X9B_D[0] * L, -X9B_D[1] * L])} ${py([-X9B_D[0] * L, -X9B_D[1] * L])}L${px([X9B_D[0] * L, X9B_D[1] * L])} ${py([X9B_D[0] * L, X9B_D[1] * L])}`} strokeWidth={2} className="stroke-[#0d9488]" />}
        {k === 2 &&
          X9B_DOTS.map((p, i) => {
            const q = on(p);
            return <path key={i} d={`M${px(p)} ${py(p)}L${px(q)} ${py(q)}`} strokeWidth={1} strokeDasharray="3 2" stroke="#d97706" className={FADE} />;
          })}
        {k >= 3 && X9B_DOTS.map((p, i) => <circle key={`g${i}`} cx={px(p)} cy={py(p)} r={3} fill="#2563eb" opacity={0.15} />)}
        {X9B_DOTS.map((p, i) => {
          const q = on(p);
          const dx = k >= 3 ? (q[0] - p[0]) * X9B_C.u : 0;
          const dy = k >= 3 ? -(q[1] - p[1]) * X9B_C.u : 0;
          return (
            <circle
              key={i}
              cx={px(p)}
              cy={py(p)}
              r={3.4}
              fill="#2563eb"
              style={{ transform: `translate(${dx}px, ${dy}px)`, transitionDelay: `${i * 60}ms` }}
              className="transition-transform duration-700 ease-in-out motion-reduce:transition-none"
            />
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A watch-only figure for screen 7's setup (a story scene, no task):
//       the shadow's two rules. Two walks put end to end: the whole path's
//       shadow is the two shadows added. Then an arrow and its double: the
//       shadow doubles too.

const FRU = makeFrame(-0.5, 4, -0.7, 2.6, 30);
const X10_A: XY = [1.5, 1.5];
const X10_AB: XY = [3, 1.1];
const X10_C: XY = [1, 1.1];
const X10_2C: XY = [2, 2.2];
const X10_SAY = [
  "মামার ছায়ার হিসাবের দুইটা নিয়ম। ছায়া পড়বে এই লাইনের ওপর।",
  "প্রথম হাঁটা, আর তার ছায়া।",
  "দ্বিতীয় হাঁটা, আর তার ছায়া।",
  "পুরো পথের ছায়া হলো দুই হাঁটার ছায়ার যোগফল।",
  "এবার একটা arrow, আর তার ছায়া।",
  "arrow দ্বিগুণ হলে তার ছায়াও দ্বিগুণ।",
];

export function TwoRules({}: Story) {
  const s = useScene(5, [600, 1600, 1600, 2400, 1800, 2400]);
  const k = s.k;
  const walk = k <= 3;
  return (
    <Scene scene={s} caption={say(X10_SAY, k)}>
      <S_Sheet max="max-w-[12rem]">
        <Plane key={walk ? "walk" : "double"} f={FRU} grid={0} axes={false} label="দুই হাঁটার ছায়া যোগ হয়; arrow দ্বিগুণ হলে ছায়াও দ্বিগুণ" className="my-0! max-w-none">
          <path d={`M${FRU.sx(-0.3)} ${FRU.sy(0)}H${FRU.sx(3.9)}`} strokeWidth={1.5} className="stroke-[#0f1b2d]/50" />
          {walk && k >= 1 && (
            <>
              <S_Bar f={FRU} to={[1.5, 0]} tone="blue" />
              <S_Drop f={FRU} from={X10_A} to={[1.5, 0]} />
              <Arrow f={FRU} from={O} to={X10_A} tone="blue" w={2.4} draw />
            </>
          )}
          {walk && k >= 2 && (
            <>
              <S_Bar f={FRU} from={[1.5, 0]} to={[3, 0]} tone="coral" />
              <S_Drop f={FRU} from={X10_AB} to={[3, 0]} />
              <Arrow f={FRU} from={X10_A} to={X10_AB} tone="coral" w={2.4} draw />
            </>
          )}
          {walk && k >= 3 && (
            <g className={FADE}>
              <Arrow f={FRU} from={O} to={X10_AB} tone="violet" w={2} dashed />
              <path d={`M${FRU.sx(0)} ${FRU.sy(-0.3)}v5H${FRU.sx(3)}v-5`} fill="none" strokeWidth={1.4} className="stroke-cat-violet" />
            </g>
          )}
          {!walk && (
            <>
              {k >= 5 && <S_Bar f={FRU} to={[2, 0]} tone="coral" w={11} />}
              {k >= 5 && <S_Drop f={FRU} from={X10_2C} to={[2, 0]} />}
              {k >= 5 && <Arrow f={FRU} from={O} to={X10_2C} tone="coral" w={2.4} draw />}
              <S_Bar f={FRU} to={[1, 0]} tone="blue" />
              <S_Drop f={FRU} from={X10_C} to={[1, 0]} />
              <Arrow f={FRU} from={O} to={X10_C} tone="blue" w={2.8} />
              {k >= 5 && (
                <Label f={FRU} at={X10_2C} dx={6} dy={2} anchor="start" size={9} className={`${FADE} fill-cat-coral`}>
                  দ্বিগুণ
                </Label>
              )}
            </>
          )}
        </Plane>
      </S_Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: three slots, nine
//       pairs of axes. Crossed pairs go to 0, each axis with itself is 1,
//       and only slot × slot is left, for three slots or three hundred.

const X10B_E = ["e₁", "e₂", "e₃"];
const X10B_SAY = [
  "তিন ঘরের vector হলে axis তিনটা, জোড়া নয়টা।",
  "আলাদা দুইটা axis: ৯০ degree কোণ, ছায়া 0।",
  "একই axis নিজের সাথে: পুরো ছায়া, 1।",
  "টিকে থাকে শুধু ঘরে ঘরে গুণ। তিনশো ঘর হলেও একই কথা।",
];

export function ThreeSlots() {
  const s = useScene(3, [600, 1800, 1800, 2800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X10B_SAY, k)}>
      <div className="mx-auto grid w-full max-w-[13rem] grid-cols-[auto_1fr_1fr_1fr] gap-1 text-center">
        <span />
        {X10B_E.map((e) => (
          <span key={e} className="font-mono text-xs font-semibold text-cat-coral">
            {e}
          </span>
        ))}
        {X10B_E.map((r, i) => (
          <div key={r} className="contents">
            <span className="self-center pr-1 font-mono text-xs font-semibold text-cat-blue">{r}</span>
            {X10B_E.map((c, j) => {
              const same = i === j;
              const on = same ? k >= 2 : k >= 1;
              return (
                <span
                  key={c}
                  className={`rounded-lg border py-1 font-mono text-sm transition-colors duration-500 motion-reduce:transition-none ${
                    on ? (same ? "border-accent bg-accent/15 font-bold" : "border-border bg-foreground/5 text-muted") : "border-border text-muted/50"
                  }`}
                >
                  {on ? (same ? "1" : "0") : "·"}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {k >= 3 && <div className={`${FADE} mt-2 text-center font-mono text-sm`}>v · w = v₁w₁ + v₂w₂ + v₃w₃</div>}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A figure for screen 7's explanation, no task: মামী's quip. She
//       says the box had a চাঁদা inside all along, only hidden; the box
//       opens and there it is.

export function HiddenProtractor() {
  const s = useScene(3, [600, 2600, 1600, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামী বললেন, box এর ভেতরে চাঁদা ছিল, শুধু লুকানো; box খুলতেই ভেতরে একটা চাঁদা">
        <S_Roof />
        <Person who="mami" x={112} y={SG} mood={k >= 1 ? "smug" : "plain"} arm={k === 1 ? "point" : "down"} label />
        <Person who="mama" x={166} y={SG} mood={k >= 3 ? "happy" : "plain"} arm={k >= 3 ? "wave" : "down"} label />
        <S_Box x={222} open={k >= 2} />
        {k >= 2 && (
          <g className={POP}>
            <g transform={`translate(222 ${SG - 36}) scale(1.5)`}>
              <S_Protractor />
            </g>
          </g>
        )}
        <Person who="fahim" x={280} y={SG} facing={-1} mood={k >= 3 ? "happy" : "plain"} label />
        {k === 1 && <Bubble x={112} y={SG - 66} side="right" lines={["তাহলে box এর ভেতরে চাঁদা", "ছিল, শুধু লুকানো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: মামা comes back with
//       the চাঁদা, chalks three new pairs on the floor, and sets the rule:
//       say his answer before he measures.

export function ThreePairs({}: Story) {
  const s = useScene(3, [600, 1500, 1800, 2600]);
  const k = s.k;
  const mx = k >= 1 ? 122 : -24;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামা চাঁদা হাতে মেঝেতে তিনটা নতুন জোড়া আঁকলেন; শর্ত, মাপার আগেই তাঁর উত্তর বলতে হবে">
        <S_Roof />
        {k >= 2 &&
          PAIRS.map((p, i) => (
            <S_Chalk key={i} x={[168, 226, 286][i]} y={176} arrows={[p.u, p.v]} u={9} squash={0.5} draw />
          ))}
        <Person who="mama" x={mx} y={SG} walking={k === 1} ms={1400} arm="hold" mood={k >= 3 ? "smug" : "plain"} label={k >= 1} />
        <S_Carry x={mx + 12} y={SG - 42} ms={1400}>
          <S_Protractor />
        </S_Carry>
        {k === 3 && <Bubble x={122} y={SG - 66} side="right" lines={["মাপার আগেই বলতে হবে,", "আমার উত্তর কত আসবে!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the third pair (2, 2)
//       and (−2, 2) meet at 90°, so w's shadow is a point: 0, like the box.
//       The second pair (3, 0) and (−1, 2) is past 90°: the shadow falls
//       behind, −1, and 3 × (−1) = −3, the box's −3.

const FZ = makeFrame(-2.5, 3.5, -0.5, 3, 26);
const X11: { v: XY; w: XY }[] = [
  { v: [2, 2], w: [-2, 2] },
  { v: [3, 0], w: [-1, 2] },
];
const X11_SAY = [
  "তৃতীয় জোড়া: (2, 2) আর (−2, 2), মাঝে ঠিক 90°।",
  "খাড়া লাঠির মতো: ছায়া একটা বিন্দু, 0।",
  "box ও 0। দুই হিসাবই বলছে ৯০ degree।",
  "দ্বিতীয় জোড়ায় কোণ 90° পেরিয়ে গেছে: ছায়া পড়লো পেছনে, −1।",
  "মামা: 3 × (−1) = −3। box ও −3। দুই হিসাবেই minus।",
];

export function ZeroAndMinus() {
  const s = useScene(4, [600, 1800, 2200, 2400, 2600]);
  const k = s.k;
  const second = k >= 3;
  const { v, w } = X11[second ? 1 : 0];
  const ft = foot(w, v);
  return (
    <Scene scene={s} caption={say(X11_SAY, k)}>
      <S_Sheet max="max-w-[13rem]">
        <Plane key={second ? 2 : 1} f={FZ} ticks={1} label={`${tupN(v)} আর ${tupN(w)}: v-এর ওপর w-এর ছায়া ${second ? "−1" : "0"}`} className="my-0! max-w-none">
          <S_Line f={FZ} v={v} />
          {!second && <S_Square f={FZ} at={O} a={v} b={w} />}
          {!second && k >= 1 && <circle cx={FZ.sx(0)} cy={FZ.sy(0)} r={5} className={`${POP} fill-[#0f1b2d]`} />}
          {second && <S_Bar f={FZ} to={ft} tone="danger" />}
          {second && <S_Drop f={FZ} from={w} to={ft} />}
          <Arrow f={FZ} from={O} to={v} tone="blue" w={2.4} />
          <Arrow f={FZ} from={O} to={w} tone="coral" w={2.4} />
        </Plane>
      </S_Sheet>
      {((!second && k >= 2) || k >= 4) && (
        <div key={second ? 2 : 1} className={`${FADE} text-center font-mono text-sm`}>
          {second ? "3 × (−1) + 0 × 2 = −3" : "2 × (−2) + 2 × 2 = 0"}
        </div>
      )}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8¾ · A figure for screen 8's explanation, no task: two roads, one
//       number. From the bet's pair, slot × slot reaches 7, and tape ×
//       tape × cos reaches the same 7.

const X11B_SAY = [
  "একই জোড়া, দুইটা হিসাব।",
  "এক রাস্তা: ঘরে ঘরে গুণ করে যোগ। পৌঁছায় 7-এ।",
  "আরেক রাস্তা: দুইটা length আর কোণের cos। পৌঁছায় সেই 7-এই।",
  "একই সংখ্যা, শুধু দুই রাস্তায় হাঁটা।",
];

export function TwoRoads() {
  const s = useScene(3, [600, 2000, 2400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X11B_SAY, k)}>
      <svg viewBox="0 0 280 120" role="img" aria-label="(2, 3) আর (2, 1) থেকে দুই রাস্তায় একই 7" className="mx-auto block h-auto w-full max-w-[17rem]">
        <rect x={1} y={1} width={278} height={118} rx={10} fill="white" stroke="#cbd5e1" />
        <path d="M78 54C118 8 196 8 236 52" fill="none" stroke="#e2e8f0" strokeWidth={3} />
        <path d="M78 66C118 112 196 112 236 68" fill="none" stroke="#e2e8f0" strokeWidth={3} />
        {k >= 1 && <Draw d="M78 54C118 8 196 8 236 52" strokeWidth={3} ms={900} className="stroke-[#d97706]" />}
        {k >= 2 && <Draw d="M78 66C118 112 196 112 236 68" strokeWidth={3} ms={900} className="stroke-[#7c3aed]" />}
        <rect x={8} y={47} width={70} height={26} rx={6} fill="white" stroke="#94a3b8" />
        <text x={43} y={64} textAnchor="middle" fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill={S_INK}>
          (2,3) (2,1)
        </text>
        {k >= 1 && (
          <g className={FADE}>
            <text x={157} y={42} textAnchor="middle" fontSize={9} fontWeight={600} fill="#b45309">
              ঘরে ঘরে গুণ
            </text>
            <text x={157} y={54} textAnchor="middle" fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#b45309">
              2×2 + 3×1
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <text x={157} y={74} textAnchor="middle" fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#6d28d9">
              3.61 × 2.24 × 0.868
            </text>
            <text x={157} y={86} textAnchor="middle" fontSize={9} fontWeight={600} fill="#6d28d9">
              ফিতা আর চাঁদা
            </text>
          </g>
        )}
        {k >= 3 && <circle cx={252} cy={60} r={21} fill="#bbf7d0" className={POP} />}
        <circle cx={252} cy={60} r={16} fill="white" stroke={k >= 1 ? "#15803d" : "#94a3b8"} strokeWidth={2} />
        <text key={k >= 1 ? "n" : "q"} x={252} y={66} textAnchor="middle" fontSize={16} fontWeight={800} fontFamily="ui-monospace, monospace" fill={k >= 1 ? "#15803d" : "#94a3b8"} className={FADE}>
          {k >= 1 ? "7" : "?"}
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for the ending's last paragraphs, no task: that night
//       at the TV. মামা announces Mr. Bean 5.34 against মামীর Titanic 4.09,
//       so his film suits him better; মামী won't have it. Who is right stays
//       open for 4.4.

export function TvArgue({}: Story) {
  const s = useScene(4, [600, 2600, 2600, 1800, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="রাতে TV-র সামনে মামা বললেন তাঁর Mr. Bean 5.34, মামীর Titanic 4.09, তাই তাঁর ছবি বেশি মানানসই; মামী মানলেন না">
        <rect x={250} y={24} width={44} height={38} rx={2} fill="#0f172a" stroke="#a8a29e" strokeWidth={2} />
        <circle cx={280} cy={36} r={5} fill="#fef3c7" />
        <path d="M272 24V62M250 43H294" stroke="#a8a29e" strokeWidth={1.4} />
        <S_Tv x={166} scores={k >= 1} />
        <Person who="mama" x={70} y={SG} arm={k === 1 || k === 2 ? "point" : "down"} mood={k === 1 || k === 2 ? "smug" : "plain"} label />
        <Person who="mami" x={262} y={SG} facing={-1} arm={k >= 3 ? "wave" : "down"} mood={k >= 3 ? "shout" : "plain"} label />
        {k === 1 && <Bubble x={70} y={SG - 66} side="right" lines={["আমার Mr. Bean 5.34,", "তোমার Titanic মাত্র 4.09!"]} />}
        {k === 2 && <Bubble x={70} y={SG - 66} side="right" lines={["মানে আমার ছবিটা", "আমার সাথে বেশি মানানসই!"]} />}
        {k === 3 && <Bubble x={262} y={SG - 66} side="left" lines={["মানি না!"]} />}
        {k >= 4 && (
          <text x={166} y={SG - 72} textAnchor="middle" fontSize={24} fontWeight={800} fill={S_INK} className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
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
  RoofNoon: { start: { k: 0 }, seven: { k: 3 }, claim: { k: 4 }, done: {} },
  RecipeSlots: { start: { k: 0 }, tape: { k: 1 }, angle: { k: 3 }, done: {} },
  StickOnRoof: { start: { k: 0 }, rays: { k: 2 }, done: {} },
  TwoSticks: { one: { k: 1 }, ratio: { k: 3 }, done: {} },
  CosTriangle: { start: { k: 0 }, tri: { k: 2 }, done: {} },
  HalfTurn: { start: { k: 0 }, up: { k: 1, stepping: true }, done: {} },
  VanTable: { start: { k: 0 }, two: { k: 2 }, done: {} },
  StickToArrow: { start: { k: 0 }, arrows: { k: 2 }, done: {} },
  RotateVsDrop: { rot: { k: 1 }, steep: { k: 2 }, done: {} },
  FirstNumber: { start: { k: 0 }, done: {} },
  MamaRecipe: { start: { k: 0 }, tape: { k: 1 }, shadow: { k: 2 }, done: {} },
  LengthTimesShadow: { first: { k: 2 }, bet: { k: 3 }, done: {} },
  RoadDebt: { start: { k: 0 }, done: {} },
  NotYetProof: { start: { k: 0 }, more: { k: 1 }, done: {} },
  WalkIsShadow: { walk: { k: 2 }, done: {} },
  TiltedAddress: { start: { k: 0 }, turned: { k: 1 }, done: {} },
  PcaShadow: { start: { k: 0 }, drop: { k: 2 }, done: {} },
  TwoRules: { walk: { k: 3 }, double: { k: 5 }, one: { k: 1 } },
  ThreeSlots: { start: { k: 0 }, done: {} },
  HiddenProtractor: { start: { k: 0 }, says: { k: 1 }, done: {} },
  ThreePairs: { start: { k: 0 }, chalk: { k: 2 }, done: {} },
  ZeroAndMinus: { zero: { k: 2 }, done: {} },
  TwoRoads: { start: { k: 0 }, one: { k: 1 }, done: {} },
  TvArgue: { start: { k: 0 }, bean: { k: 1 }, suits: { k: 2 }, mami: { k: 3 }, done: {} },
};
