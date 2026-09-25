"use client";

import { useId, useState, type ReactNode } from "react";

import { BoxRun } from "@/components/journey/box";
import { Task, useGate } from "@/components/journey/journey";
import { Bubble, Card as CastCard, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Choice, Draw, FADE, LOOK, Nope, POP, Scene, Ticks, pill, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Arrow, Label, Plane, Star, clamp, makeFrame, snap, type Frame, type XY } from "@/components/journey/plane";
import { Shiku, Trail, route } from "./arrow-journey";
import { DotBox, dot, tupN } from "./haat-journey";
import { bn } from "./figure-kit";

// Screens for two journeys on the same ছাদ, "Math for AI 4.3 — দুপুরের ছায়া"
// and "Math for AI 4.4 — দুই হিসাব কেন মেলে".
//
// 4.3: মামা claims a second recipe for the box's number that multiplies no
// slots at all: two tape lengths and one protractor reading. The reader bets
// what it will give for the box's 7. On the ছাদ at noon a bamboo stick's
// shadow gives cos θ (a table from 0° to 90°, then past 90° where the shadow
// falls behind); a chalk arrow's shadow on another is ‖w‖ cos θ; মামা's
// recipe, ‖v‖ × (w's shadow), matches the box twice (6 and 7).
//
// 4.4 (from AlwaysBet on): will it always match, and why? A vector's numbers
// are its shadows on the axes, and on turned axes too (TiltedAxes); a shadow
// adds and scales (ShadowRules); and in the 2 × 2 grid of axis pairs the
// crossed ones cast no shadow, leaving only slot × slot. Last the reader
// predicts মামা's number from the box alone, three times.
//
// The box is 4.1's DotBox. Tailwind only; the sheets are journey/plane. Ink on
// the white sheet is fixed.
//
// After the screens come the watch-only story scenes (on the ছাদ at noon, and
// at the TV that night) and the explanation figures for each <Then>, numbered
// after the screen they belong to (1a, 1½, 2a, 2½, 2¾, 3½, 3¾, 4a, 4b, 4½, 4¾,
// 5a, 5b, 5½, 5⅝, 5¾, 5⅞, 6½, 6¾, 6⅞a, 6⅞b, 7a, 7b, 7½, 7¾, 8a, 8½, 8¾, 9a).
//
// Then the review questions, rebuilt as visual exercises that play each pick
// out (0✓ ZeroMeans, 2✓ ThreeMetre, 4✓ TapeThirteen, 5✓ RoadBox, 5✓✓
// SixtyCheck for 4.3; 9✓ FlatShadow, 9⅓✓ RemotePress, 11✓ NineToThree,
// 11½✓ MamiRoad, 12✓ NinetyBoth for 4.4), and the later figures (2⅞
// CalcCos, 9½ EndlessPairs, 11¾ MinusPieces, 11⅞ CrossedZero, 5⅞b MamaSeven).

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
//     reader bets what his tape and protractor will give; TwoTests settles it.

const FB = makeFrame(-0.5, 3.5, -0.5, 3.5, 34);
const V: XY = [2, 3];
const W: XY = [2, 1];
const SEVEN_BET = ["7-এর চেয়ে বেশি", "ঠিক 7", "7-এর চেয়ে কম"];

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
            <div className="font-semibold">ফাহিমের dot product</div>
            <div className="font-mono">
              <BoxRun a={V} b={W} inline />
            </div>
          </div>
          <div className="rounded-xl border-2 border-cat-violet/40 bg-cat-violet/5 px-2.5 py-1.5">
            <div className="font-semibold">মামার হিসাব</div>
            <div>দুইটা ফিতার মাপ আর একটা চাঁদার মাপ। কোনো ঘরে ঘরে গুণ নাই।</div>
          </div>
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-muted">মামার ফিতা আর চাঁদা থেকে কত আসবে, আপনার কী মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {SEVEN_BET.map((o, i) => (
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
          <div className="text-sm font-medium text-muted">লাঠিটা 120°-এ হেলে পেছনে ঝুঁকলো। ছায়া পড়বে কোথায়, বলুন তো?</div>
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
      <Task done={all}>আগে guess করুন। তারপর লাঠিটা 120°, 150° আর 180° পর্যন্ত হেলিয়ে দেখুন।</Task>
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

const TARGET_NEXT: Record<number, string> = {
  3: "পরের কাজ: ছায়া 3। w-এর মাথা টেনে নিন। সোজা নিচে দাগ নামালে যেন পড়ে 3-এ।",
  0: "পরের কাজ: ছায়া 0। w-কে দাঁড় করান। মাথা থেকে দাগ যেন পড়ে ঠিক গোড়ায়।",
  [-2]: "পরের কাজ: ছায়া −2। w-কে পেছনে হেলিয়ে দিন। দাগ যেন পড়ে গোড়ার দুই ঘর পেছনে।",
};

/** Step-by-step commentary on w's shadow where the tip is now: the angle, where the drop lands, the sum. */
function ShadowSteps({ w, next, hit }: { w: XY; next: number | undefined; hit: number[] }) {
  const L = len(w);
  const sh = w[0];
  const th = Math.round(angleOf(VFLAT, w));
  const c = Math.cos(th * RAD);
  const exact = th === 0 || th === 90 || th === 180;
  const cs = fix(c, exact ? 0 : 2);
  const flatMiss = L > 0 && w[1] === 0 && TARGETS.includes(sh) && !hit.includes(sh);
  const lines =
    L === 0
      ? ["w-এর মাথা এখন গোড়াতেই। arrow-টাই নাই। মাথাটা একটু দূরে টেনে নিন।"]
      : [
          th === 0
            ? "১. w শুয়ে আছে v-এর ওপরেই, মাঝের কোণ 0°।"
            : th === 180
              ? "১. w আর v-এর মাঝের কোণ 180°, w একদম উল্টো দিকে।"
              : th === 90
                ? "১. w আর v-এর মাঝের কোণ ঠিক 90°, w একদম খাড়া।"
                : th < 90
                  ? `১. w আর v-এর মাঝের কোণ ${th}°, 90°-এর কম।`
                  : `১. w আর v-এর মাঝের কোণ ${th}°, 90°-এর বেশি। w পেছনে হেলে গেছে।`,
          th === 0
            ? `২. রোদ ওপর থেকে পড়লে পুরো w-টাই ছায়া, ${fix(sh, 0)}।`
            : th === 180
              ? `২. w উল্টো দিকে শুয়ে আছে। তাই পুরো w-টাই পেছনের ছায়া, ${fix(sh, 0)}।`
            : sh > 0
              ? `২. w-এর মাথা থেকে সোজা নিচে দাগ নামালে? পড়ে ${fix(sh, 0)}-এ, v-এর দিকেই।`
              : sh === 0
                ? "২. মাথা থেকে সোজা নিচে দাগ নামালে পড়ে ঠিক গোড়ায়। ছায়া বলে কিছু নাই, 0।"
                : `২. মাথা থেকে দাগ নামালে পড়ে গোড়ার ${bn(-sh)} ঘর পেছনে। পেছনের ছায়া। তাই minus।`,
          `৩. হিসাবেও তাই: ‖w‖ × cos ${th}° = ${fix(L, 2)} × ${c < 0 ? `(${cs})` : cs} ${exact ? "=" : "≈"} ${fix(sh, 0)}।`,
        ];
  return (
    <div className="mx-auto mt-2 max-w-sm rounded-xl border border-border bg-surface px-3 py-2 text-sm leading-snug">
      {lines.map((l, i) => (
        <div key={`${i}${l}`} className={FADE}>
          {l}
        </div>
      ))}
      {flatMiss && <div className="mt-1 font-medium text-danger">শোয়ানো w এখানে গুনবে না। কারণ, তখন ছায়া আর w একই জিনিস। মাথাটা একটু ওপরে তুলে একই ছায়া বানান।</div>}
      {!flatMiss && next !== undefined && <div className="mt-1 font-medium text-accent-text">{TARGET_NEXT[next]}</div>}
    </div>
  );
}

export function ArrowShadow() {
  const pass = useGate();
  const [way, setWay] = useSeed<number | null>("way", null);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const [w, setW] = useSeed<XY>("w", [2, 3]);
  const [hit, setHit] = useSeed<number[]>("hit", []);
  const right = way === 1;
  const all = TARGETS.every((t) => hit.includes(t));
  const shadow = w[0];

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
          <div className="text-sm font-medium text-muted">রোদ আসছে v-এর ঠিক মাথার ওপর থেকে। v-এর ওপর w-এর ছায়া কোনটা?</div>
          <div className="mt-2 grid gap-2">
            {SHADOW_WAYS.map((o, i) => (
              <Choice key={o} n={i} look="idle" disabled={false} onClick={() => pickWay(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {miss !== null && <Nope key={miss}>উঁহু। লাঠির ছায়ার কথা ভাবুন। রোদ লাঠিকে মাটিতে শুইয়ে দেয় না। নামে মাথা থেকে সোজা নিচে।</Nope>}
        </>
      ) : (
        <div className={FADE}>
          <ShadowSteps w={w} hit={hit} next={TARGETS.find((t) => !hit.includes(t))} />
          <Ticks items={TARGETS.map((t) => [`ছায়া ${t < 0 ? `−${-t}` : t}`, hit.includes(t)])} />
        </div>
      )}
      <Task done={all}>আগে বলুন, ছায়া কোনটা। তারপর w-এর মাথা টানুন। ছায়া বানান 3, তারপর 0, তারপর −2।</Task>
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
      {round === 1 && <div className="text-center text-sm text-accent-text">✓ প্রথম জোড়া: dot product 6, মামা 6.0।</div>}
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
          <DotBox a={t.v} b={t.w} dense />
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
      <Task done={round === 1 && over}>মামার হিসাবটা চালান, এক মাপ এক মাপ করে। তারপর dot product এর উত্তরের সাথে মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · A vector's numbers are shadows. Light (2, 3) onto each axis: the shadow
//     on the x axis is 2, on the y axis 3, and the box with e₁ and e₂ gives
//     the same two numbers. Each axis has its own torch, switched on and off.

const FX = makeFrame(-0.5, 4, -0.5, 4.2, 36);
const AXIS_NAME = ["x axis", "y axis"];

export function AxisShadow() {
  const pass = useGate();
  const [lit, setLit] = useSeed<number[]>("lit", []);
  const [on, setOn] = useSeed<number[]>("on", []);
  const both = lit.length === 2;
  const f = FX;
  const dark = on.length === 0;

  /** switch axis i's torch on or off; lighting both at least once clears the screen */
  const toggle = (i: number) => {
    if (on.includes(i)) return setOn(on.filter((j) => j !== i));
    setOn([...on, i]);
    if (lit.includes(i)) return;
    const next = [...lit, i];
    setLit(next);
    if (next.length === 2) pass("প্রতিটা সংখ্যা একেকটা axis-এ ছায়া।");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[13rem]">
        <Plane f={f} ticks={1} label="(2, 3) আর দুই axis-এর torch; x axis-এ ছায়া 2, y axis-এ ছায়া 3" className="my-0! max-w-none">
          <rect
            x={f.sx(f.x0)}
            y={f.sy(f.y1)}
            width={(f.x1 - f.x0) * f.u}
            height={(f.y1 - f.y0) * f.u}
            fill={S_INK}
            style={{ opacity: dark ? 0.22 : 0 }}
            className="pointer-events-none transition-opacity duration-500 motion-reduce:transition-none"
          />
          {on.includes(0) && (
            <>
              <path d={`M${f.sx(1) - 9} ${f.sy(3.95)}L${f.sx(-0.2)} ${f.sy(0)}H${f.sx(2.2)}L${f.sx(1) + 9} ${f.sy(3.95)}Z`} fill="#fde047" fillOpacity={0.3} className={`${FADE} pointer-events-none`} />
              <path d={`M${f.sx(2)} ${f.sy(3)}V${f.sy(0)}`} strokeWidth={1.2} strokeDasharray="4 3" className="pointer-events-none stroke-[#d97706]" />
              <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(2)}`} strokeWidth={7} strokeLinecap="round" className={`${POP} pointer-events-none stroke-[#0f1b2d]/60`} />
            </>
          )}
          {on.includes(1) && (
            <>
              <path d={`M${f.sx(3.7)} ${f.sy(1.5) - 9}L${f.sx(0)} ${f.sy(3.2)}V${f.sy(-0.2)}L${f.sx(3.7)} ${f.sy(1.5) + 9}Z`} fill="#fde047" fillOpacity={0.3} className={`${FADE} pointer-events-none`} />
              <path d={`M${f.sx(2)} ${f.sy(3)}H${f.sx(0)}`} strokeWidth={1.2} strokeDasharray="4 3" className="pointer-events-none stroke-[#d97706]" />
              <path d={`M${f.sx(0)} ${f.sy(0)}V${f.sy(3)}`} strokeWidth={7} strokeLinecap="round" className={`${POP} pointer-events-none stroke-[#0f1b2d]/60`} />
            </>
          )}
          <Arrow f={f} from={O} to={[1, 0]} tone="teal" w={2.4} />
          <Arrow f={f} from={O} to={[0, 1]} tone="teal" w={2.4} />
          <Label f={f} at={[1, 0]} dy={-6} className="fill-cat-teal">
            e₁
          </Label>
          <Label f={f} at={[0, 1]} dx={7} dy={3} anchor="start" className="fill-cat-teal">
            e₂
          </Label>
          <Arrow f={f} from={O} to={V} tone="blue" w={2.6} />
          <S_Torch x={f.sx(1)} y={f.sy(3.95)} on={on.includes(0)} />
          <g transform={`rotate(90 ${f.sx(3.7)} ${f.sy(1.5)})`}>
            <S_Torch x={f.sx(3.7)} y={f.sy(1.5)} on={on.includes(1)} />
          </g>
        </Plane>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {AXIS_NAME.map((name, i) => (
          <div key={name} className="grid content-start gap-2">
            <button type="button" onClick={() => toggle(i)} className={`${pill(on.includes(i))} font-sans`}>
              {name}-এর torch {on.includes(i) ? "নিভান" : "জ্বালান"}
            </button>
            {on.includes(i) && (
              <div className={`${FADE} text-center`}>
                <div className="text-sm">
                  {name} বরাবর ছায়া <b className="font-mono">{i === 0 ? 2 : 3}</b>
                </div>
                <DotBox a={V} b={i === 0 ? [1, 0] : [0, 1]} dense />
              </div>
            )}
          </div>
        ))}
      </div>
      <Task done={both}>দুই axis-এর torch-ই একবার জ্বালান, একবার নিভান। কোন axis বরাবর ছায়া কত?</Task>
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

/** Two axes in a cell: the same axis lies on itself (a full shadow), crossed ones meet at 90° (a dot). */
function PairIcon({ same }: { same: boolean }) {
  const head = (x: number, y: number, dx: number, dy: number) => `M${x - dx * 4 - dy * 2.5} ${y - dy * 4 + dx * 2.5}L${x} ${y}L${x - dx * 4 + dy * 2.5} ${y - dy * 4 - dx * 2.5}`;
  return (
    <svg viewBox="0 0 44 26" aria-hidden="true" className="mx-auto block h-6 w-11">
      {same ? (
        <>
          <path d="M8 21H36" strokeWidth={5} strokeLinecap="round" className="stroke-[#0f1b2d]/40" />
          <path d={`M8 13H36${head(36, 13, 1, 0)}`} fill="none" strokeWidth={1.6} strokeLinecap="round" className="stroke-cat-coral" />
          <path d={`M8 16H36${head(36, 16, 1, 0)}`} fill="none" strokeWidth={1.6} strokeLinecap="round" className="stroke-cat-blue" />
        </>
      ) : (
        <>
          <path d={`M12 22H38${head(38, 22, 1, 0)}`} fill="none" strokeWidth={1.6} strokeLinecap="round" className="stroke-cat-blue" />
          <path d={`M12 22V3${head(12, 3, 0, -1)}`} fill="none" strokeWidth={1.6} strokeLinecap="round" className="stroke-cat-coral" />
          <path d="M12 18H16V22" fill="none" strokeWidth={0.8} className="stroke-[#0f1b2d]/60" />
          <circle cx={12} cy={22} r={2.6} className="fill-[#0f1b2d]" />
        </>
      )}
    </svg>
  );
}

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
                      <PairIcon same={same} />
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
          4 + 0 + 0 + 3 = <BoxRun a={V} b={W} inline />
        </div>
      )}
      <Task done={all}>চারটা ঘরেই tap করুন। কোন দুই axis-এর মধ্যে ছায়া কতটা?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · এবার আপনার পালা। Three new pairs. Before মামা measures, the reader says
//     what his tape and protractor will give, from the box alone. Every pick
//     plays মামা measuring on the sheet (tape along u, tape along v, then v's
//     shadow on u) and his number lands beside the reader's: a wrong try
//     bounces, a right one moves on to the next pair.

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
  const [tried, setTried] = useSeed<number | null>("tried", null);
  const [ran, setRan] = useState(false);
  const play = usePlay(520);
  const all = done === PAIRS.length;
  const p = PAIRS[Math.min(done, PAIRS.length - 1)];
  const shown = all ? PAIRS.length - 1 : done;
  // beats of মামা's measuring; a preview (no effects) shows a seeded try settled
  const k = ran ? play.k : tried !== null ? 3 : 0;

  const pick = (i: number) => {
    if (all) return;
    setTried(i);
    setRan(true);
    if (i !== p.ans) {
      setMiss((miss ?? 0) + 1);
      play.play(3);
      return;
    }
    setMiss(null);
    play.play(3, () => {
      setTried(null);
      setDone(done + 1);
      if (done + 1 === PAIRS.length) pass("চাঁদা-ফিতা আর dot product একই সংখ্যা দেয়।");
    });
  };

  const q = PAIRS[shown];
  const prev = done > 0 ? PAIRS[done - 1] : null;
  const m = tried !== null && !all;
  const ft = foot(q.v, q.u);
  const back = dot(q.u, q.v) < 0;
  return (
    <>
      <div className="text-center text-sm text-muted">
        জোড়া {Math.min(done + 1, PAIRS.length)}/{PAIRS.length}
      </div>
      <Plane f={FP} ticks={1} label={`u ${tupN(q.u)}, v ${tupN(q.v)}`} className="max-w-[15rem]">
        {m && k >= 1 && <S_Bar f={FP} to={q.u} tone="tape" w={9} />}
        {m && k >= 2 && <S_Bar f={FP} to={q.v} tone="tape" w={9} />}
        {m && k >= 3 && <S_Line f={FP} v={q.u} />}
        {m && k >= 3 && <S_Drop f={FP} from={q.v} to={ft} />}
        {m && k >= 3 && (Math.hypot(...ft) > 0.05 ? <S_Bar f={FP} to={ft} tone={back ? "danger" : "ink"} /> : <circle cx={FP.sx(0)} cy={FP.sy(0)} r={5} className={`${POP} fill-[#0f1b2d]`} />)}
        <Arc f={FP} a={q.u} b={q.v} r={0.8} />
        <Arrow f={FP} from={O} to={q.u} tone="blue" w={2.4} />
        <Arrow f={FP} from={O} to={q.v} tone="coral" w={2.4} />
      </Plane>
      <div className="text-center font-mono">
        <span className="text-cat-blue">{tupN(q.u)}</span> আর <span className="text-cat-coral">{tupN(q.v)}</span>
      </div>
      {m && k >= 1 && (
        <div className={`${FADE} mt-1 text-center text-sm`}>
          মামা মাপছেন:{" "}
          <span className="font-mono">
            {fix(len(q.u), 2)}
            {k >= 2 && <> × {fix(len(q.v), 2)}</>}
            {k >= 3 && (
              <>
                {" "}
                × cos {fix(angleOf(q.u, q.v), 1)}° = <b>{fix(dot(q.u, q.v), 1)}</b>
              </>
            )}
          </span>
        </div>
      )}
      {!all ? (
        <>
          <div className="mt-2 text-sm font-medium text-muted">মামা মাপতে যাচ্ছেন। মাপার আগেই বলুন তো, উত্তর কত আসবে?</div>
          <div className="mt-2 flex justify-center gap-2">
            {p.opts.map((o, i) => (
              <button key={o} type="button" onClick={() => pick(i)} className={pill(tried === i)}>
                {o}
              </button>
            ))}
          </div>
          {miss !== null && (tried === null || k >= 3) && <Nope key={miss}>উঁহু। মামার মাপ লাগবে না। Dot productটা করুন। ঘরে ঘরে গুণ, তারপর যোগ।</Nope>}
        </>
      ) : null}
      {prev && !m && (
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
// Math for AI 4.4 starts here: the same ছাদ in the afternoon. 4.3 matched মামা's
// recipe to the box twice; 4.4 asks whether it always will, and why.
//
// 9 · The bet 4.3 left open. Two pairs matched, 6 and 7; will the two recipes
//     agree for every pair? Sealed, unmarked; NoCrossTalk and YourPair settle it.

const FAB = makeFrame(-0.5, 3.5, -0.5, 3.5, 20);
const ALWAYS_DONE: { v: XY; w: XY; n: number }[] = [
  { v: [2, 0], w: [3, 3], n: 6 },
  { v: [2, 3], w: [2, 1], n: 7 },
];
const RECIPE_BET = ["সবসময় মিলবে, যেকোনো দুইটা arrow-এ", "মাঝেমধ্যে মিলবে, কাকতালীয়ভাবে", "এই দুইটার বাইরে আর মিলবে না"];

export function AlwaysBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি সিল হলো। খোঁজ শুরু axis-এর ছায়ায়।");
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2 text-center">
        {ALWAYS_DONE.map((d) => (
          <div key={d.n} className="grid content-start gap-1 rounded-xl border-2 border-accent/50 bg-accent/10 px-1 py-1.5">
            <Plane f={FAB} label={`${tupN(d.v)} আর ${tupN(d.w)}: dot product ${d.n}, মামা ${d.n}`} className="mx-auto my-0! max-w-[4.5rem]">
              <Arrow f={FAB} from={O} to={d.v} tone="blue" w={2.2} />
              <Arrow f={FAB} from={O} to={d.w} tone="coral" w={2.2} />
            </Plane>
            <div className="flex items-center justify-center gap-1 text-xs">
              <S_Tick /> dot product {d.n}, মামা {d.n}
            </div>
          </div>
        ))}
        <div className="grid place-content-center gap-1 rounded-xl border-2 border-dashed border-border px-1 py-1.5 text-muted">
          <div className="font-mono text-2xl">?</div>
          <div className="text-xs">বাকি সব জোড়া</div>
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-muted">মামা বলছেন তাঁর হিসাব আর dot product সবসময় একই উত্তর দেবে। আপনার কী মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {RECIPE_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>দুইটা মিলে যাওয়া জোড়া দেখে একটাতে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · Turn the axes. (2, 3) stays put; the reader turns a pair of axes, both
//      1 long and at 90°, to four stops (0°, 37°, 53°, 90°, picked so every
//      number is clean). No sums on screen: the graph paper turns with the
//      axes, and Shiku walks to (2, 3)'s tip on it, one square at a time,
//      axis 1 first, then axis 2, the step count running as he goes. The arrow
//      never moves; only the address he walked does, and each stop's address
//      stays in a row underneath. The corner of his walk is where the tip's
//      shadow falls on axis 1.

const FTA = makeFrame(-1.6, 3.6, -0.6, 3.6, 36);
const TURN_DEG = [0, 36.87, 53.13, 90];
const TURN_NAME = ["0°", "37°", "53°", "90°"];
const TURN_AXES: [XY, XY][] = [
  [
    [1, 0],
    [0, 1],
  ],
  [
    [0.8, 0.6],
    [-0.6, 0.8],
  ],
  [
    [0.6, 0.8],
    [-0.8, 0.6],
  ],
  [
    [0, 1],
    [-1, 0],
  ],
];
const AXIS_BN = ["১", "২"];
/** one decimal, dropping a ".0" */
const num = (n: number) => fix(n, 1).replace(/\.0$/, "");
/** the stops on the way from 0 to a along one axis: every whole square, then the last bit */
const legOf = (a: number) => {
  const out: number[] = [];
  const sg = Math.sign(a);
  for (let s = 1; s <= Math.abs(a) + 1e-9; s++) out.push(sg * s);
  if (Math.abs(a - (out.at(-1) ?? 0)) > 1e-6) out.push(a);
  return out;
};
/** Shiku's walk to (2, 3)'s tip on a turned grid: along axis 1 first, then along axis 2 */
const walkOf = ([u, w]: [XY, XY]) => {
  const [a, b] = [u, w].map((x) => Math.round(dot(V, x) * 10) / 10);
  const at = (s: number, r: number): XY => [u[0] * s + w[0] * r, u[1] * s + w[1] * r];
  return [
    { p: O, s: [0, 0] },
    ...legOf(a).map((s) => ({ p: at(s, 0), s: [s, 0] })),
    ...legOf(b).map((r) => ({ p: at(a, r), s: [a, r] })),
  ];
};
/** beside an axis arrow, on the side away from (2, 3), so neither the arrow nor Shiku's walk covers it */
const TA_labelAt = (u: XY): XY => {
  const side = u[0] * V[1] - u[1] * V[0] > 0 ? -1 : 1;
  return [u[0] * 0.55 - u[1] * 0.35 * side, u[1] * 0.55 + u[0] * 0.35 * side];
};
/** ticks to wait while the grid turns, before Shiku sets off */
const TA_WAIT = 2;

/** The graph paper, turned: unit lines along both axes, cut at the sheet's edge. */
function TA_Grid({ f, axes }: { f: Frame; axes: [XY, XY] }) {
  const id = useId();
  const lines: string[] = [];
  for (const [u, w] of [axes, [axes[1], axes[0]]] as [XY, XY][])
    for (let i = -7; i <= 7; i++)
      lines.push(`M${f.sx(w[0] * i - u[0] * 9)} ${f.sy(w[1] * i - u[1] * 9)}L${f.sx(w[0] * i + u[0] * 9)} ${f.sy(w[1] * i + u[1] * 9)}`);
  return (
    <g className="pointer-events-none">
      <clipPath id={id}>
        <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={f.sx(f.x1) - f.sx(f.x0)} height={f.sy(f.y0) - f.sy(f.y1)} />
      </clipPath>
      <path d={lines.join("")} clipPath={`url(#${id})`} strokeWidth={0.8} className="fill-none stroke-[#0f1b2d]/15" />
    </g>
  );
}

export function TiltedAxes() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [seen, setSeen] = useSeed<number[]>("seen", [0]);
  const [t] = useTween([TURN_DEG[at]], 700);
  const play = usePlay(380);
  const all = seen.length === TURN_DEG.length;
  const live: [XY, XY] = [
    [Math.cos(t * RAD), Math.sin(t * RAD)],
    [-Math.sin(t * RAD), Math.cos(t * RAD)],
  ];
  const walk = walkOf(TURN_AXES[at]);
  const i = play.running ? Math.max(0, play.k - TA_WAIT) : walk.length - 1;
  const landed = i === walk.length - 1;
  const [s1, s2] = walk[i].s;
  const addr = walk.at(-1)!.s;
  /** the stops already walked, in the order the reader turned to them */
  const log = seen.filter((j) => j !== at || landed);

  const turn = (j: number) => {
    setAt(j);
    const next = seen.includes(j) ? seen : [...seen, j];
    play.play(walkOf(TURN_AXES[j]).length - 1 + TA_WAIT, () => {
      setSeen(next);
      if (next.length === TURN_DEG.length && seen.length < TURN_DEG.length) pass("Arrow একচুলও নড়ে নাই, axis ঘুরলে বদলায় শুধু address।");
    });
  };

  return (
    <>
      <S_Sheet max="max-w-[15rem]">
        <Plane f={FTA} axes={false} label={`graph paper ${TURN_NAME[at]} ঘোরানো; Shiku (2, 3) এর মাথায় হেঁটে যায়: axis ১ বরাবর ${num(addr[0])}, axis ২ বরাবর ${num(addr[1])}`} className="my-0! max-w-none">
          <TA_Grid f={FTA} axes={live} />
          {live.map((u, j) => (
            <g key={j}>
              <Arrow f={FTA} from={O} to={u} tone="teal" w={2.4} />
              <Label f={FTA} at={TA_labelAt(u)} dy={4} size={10} className="fill-cat-teal">
                {AXIS_BN[j]}
              </Label>
            </g>
          ))}
          <Arrow f={FTA} from={O} to={V} tone="blue" w={2.6} />
          <Trail f={FTA} cells={walk.slice(0, i + 1).map((w) => w.p)} />
          {walk.slice(1, i + 1).map((w, j) => (
            <circle key={`${at}-${j}`} cx={FTA.sx(w.p[0])} cy={FTA.sy(w.p[1])} r={2.6} className={`${POP} pointer-events-none fill-cat-violet`} />
          ))}
          <Shiku f={FTA} at={walk[i].p} />
        </Plane>
      </S_Sheet>
      <div className="mt-2 text-center text-xs text-muted">দুইটা axis কতটা ঘোরাবেন?</div>
      <div className="mt-1 flex justify-center gap-1.5">
        {TURN_NAME.map((n, j) => (
          <button key={n} type="button" onClick={() => turn(j)} className={`${pill(at === j)} font-mono`}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center text-sm">
        <span>
          axis ১ বরাবর <b className="font-mono">{num(s1)}</b> ঘর
        </span>
        <span>
          axis ২ বরাবর <b className="font-mono">{num(s2)}</b> ঘর
        </span>
      </div>
      <div className="mt-1.5 flex min-h-7 flex-wrap items-center justify-center gap-1.5 text-xs">
        {log.map((j) => (
          <span key={j} className={`${POP} rounded-full border px-2 py-0.5 ${j === at ? "border-cat-blue bg-cat-blue/10 font-semibold" : "border-border text-muted"}`}>
            {TURN_NAME[j]}: <span className="font-mono">({walkOf(TURN_AXES[j]).at(-1)!.s.map(num).join(", ")})</span>
          </span>
        ))}
      </div>
      <Task done={all}>চারটা কোণেই axis ঘুরিয়ে দেখুন, Shiku একই মাথায় পৌঁছাতে কয় ঘর হাঁটে ({bn(seen.length)}/৪)।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11 · The shadow's two rules, by hand. Round 1: two walks end to end over a
//      floor line; the reader lights each walk's shadow, then the whole
//      path's: 1.5 + 1.5 = 3. Round 2: one arrow times 2, 3 and −1; the shadow
//      follows, even behind the foot.

const FSR_WALK = makeFrame(-0.3, 3.5, -0.4, 1.9, 44);
const FSR = makeFrame(-1.5, 3.9, -1.4, 3.5, 30);
const SR_A: XY = [1.5, 1.5];
const SR_AB: XY = [3, 1.1];
const SR_C: XY = [1, 1.1];
const SR_TIMES = [1, 2, 3, -1];
const SR_BTN = ["প্রথম হাঁটার ছায়া", "দ্বিতীয় হাঁটার ছায়া", "পুরো পথের ছায়া"];

export function ShadowRules() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [k, setK] = useSeed("k", 0);
  const [m, setM] = useSeed("m", 1);
  const [seen, setSeen] = useSeed<number[]>("seen", [1]);
  const walkDone = round === 1;
  const all = walkDone && seen.length === SR_TIMES.length;
  const c: XY = [SR_C[0] * m, SR_C[1] * m];
  const g = round === 0 ? FSR_WALK : FSR;

  const times = (n: number) => {
    setM(n);
    if (seen.includes(n)) return;
    const next = [...seen, n];
    setSeen(next);
    if (next.length === SR_TIMES.length) pass("ছায়া যোগ হয়, গুণও হয়।");
  };

  return (
    <>
      <div className="text-center text-xs font-semibold text-muted">{round === 0 ? "নিয়ম ১: দুইটা হাঁটা জোড়া দিলে" : "নিয়ম ২: arrow-কে গুণ করলে"}</div>
      <S_Sheet max="max-w-[12rem]">
        <Plane key={round} f={g} grid={0} axes={false} label={round === 0 ? "দুইটা হাঁটা আর তাদের ছায়া" : `arrow × ${m}, ছায়া ${m}`} className="my-0! max-w-none">
          <path d={`M${g.sx(g.x0 + 0.1)} ${g.sy(0)}H${g.sx(g.x1 - 0.1)}`} strokeWidth={1.5} className="stroke-[#0f1b2d]/50" />
          {round === 0 && (
            <>
              {k >= 1 && k < 3 && <S_Bar f={g} to={[1.5, 0]} tone="blue" />}
              {k >= 1 && <S_Drop f={g} from={SR_A} to={[1.5, 0]} />}
              {k >= 2 && k < 3 && <S_Bar f={g} from={[1.5, 0]} to={[3, 0]} tone="coral" />}
              {k >= 2 && <S_Drop f={g} from={SR_AB} to={[3, 0]} />}
              {k >= 3 && <S_Bar f={g} to={[3, 0]} tone="ink" w={9} />}
              <Arrow f={g} from={O} to={SR_A} tone="blue" w={2.4} />
              <Arrow f={g} from={SR_A} to={SR_AB} tone="coral" w={2.4} />
              {k >= 3 && <Arrow f={g} from={O} to={SR_AB} tone="violet" w={2} dashed />}
            </>
          )}
          {round === 1 && (
            <>
              <S_Bar f={g} to={[c[0], 0]} tone={m < 0 ? "danger" : "ink"} />
              <S_Drop f={g} from={c} to={[c[0], 0]} />
              <Arrow f={g} from={O} to={c} tone="blue" w={2.6} />
            </>
          )}
        </Plane>
      </S_Sheet>
      {round === 0 ? (
        <>
          <div className="mt-2 flex justify-center">
            {k < 3 ? (
              <button type="button" onClick={() => setK(k + 1)} className={primaryBtn}>
                {SR_BTN[k]}
              </button>
            ) : (
              <button type="button" onClick={() => setRound(1)} className={primaryBtn}>
                এবার নিয়ম ২
              </button>
            )}
          </div>
          <div className="mt-2 grid gap-0.5 text-center text-sm">
            {k >= 1 && (
              <div className={FADE}>
                <span className="text-cat-blue">প্রথম হাঁটার ছায়া</span> <b className="font-mono">1.5</b>
              </div>
            )}
            {k >= 2 && (
              <div className={FADE}>
                <span className="text-cat-coral">দ্বিতীয় হাঁটার ছায়া</span> <b className="font-mono">1.5</b>
              </div>
            )}
            {k >= 3 && (
              <div className={`${FADE} font-semibold`}>
                পুরো পথের ছায়া <span className="font-mono">3 = 1.5 + 1.5</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mt-2 flex justify-center gap-1.5">
            {SR_TIMES.map((n) => (
              <button key={n} type="button" onClick={() => times(n)} className={`${pill(m === n)} font-mono`}>
                × {sgn(n)}
              </button>
            ))}
          </div>
          <div key={m} className={`${FADE} mt-2 text-center text-sm`}>
            arrow <b className="font-mono">× {sgn(m)}</b>, ছায়া <b className="font-mono">{sgn(m)}</b>
            {m < 0 && <span className="text-muted">, পেছনের দিকে</span>}
          </div>
        </>
      )}
      <Ticks
        items={[
          ["নিয়ম ১: ছায়া যোগ হয়", walkDone],
          ["নিয়ম ২: ছায়াও গুণ হয়", all],
        ]}
      />
      <Task done={all}>দুই হাঁটার ছায়া দেখুন, আলাদা করে আর একসাথে। তারপর arrow-টাকে গুণ করুন 2, 3 আর −1 দিয়ে।</Task>
    </>
  );
}

/** a whole number with a real minus sign */
const sgn = (n: number) => (n < 0 ? `−${-n}` : `${n}`);

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

/** A চাঁদা (half-circle protractor), flat side down, centred at (0, 0) (4.2's চাঁদা)। */
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

/** The black box (labelled u · v, the dot product), bottom-centre at (x, SG), its lid tipped back when `open`. */
function S_Box({ x, open }: { x: number; open: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 18} y={SG - 24} width={36} height={24} rx={2} fill="#1f2937" />
      <text x={x} y={SG - 9} textAnchor="middle" fontSize={9} fontWeight={800} fill="white">
        u · v
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
      <Stage backdrop="field" label="দুপুরে ছাদে মামা চক দিয়ে (2, 3) আর (2, 1) আঁকলেন; ফাহিম dot product করে 7 পেলো; মামা বললেন ফিতা আর চাঁদা দিয়ে গুণ ছাড়াই 7 দেবেন; ফাহিম ভাবছে একই সংখ্যা কেন">
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
        {k === 3 && <Bubble x={262} y={SG - 66} side="left" lines={["Dot product করলাম:", "2 × 2 + 3 × 1 = 7"]} />}
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
  "কোণ বদলালে? ভাগফলও বদলায়, দুই লাঠিতে একসাথে। মানে ভাগফলটা শুধু কোণের।",
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
  "cos θ মানে ছায়া ÷ লাঠি। এই লাঠির ছায়া 0.87। তাই cos 30° ≈ 0.87।",
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
  "বাঁয়ে লাঠির ছায়া, ডানে ৪.২-এর ভ্যানের dot product।",
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
        <span className="text-center text-xs text-muted">৪.২-এর dot product</span>
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
// 4b · A watch-only figure for screen 4's setup (a story scene, no task): a
//      torchlight switched on and off right over v. On, its light falls
//      straight down and w's shadow shows on v; off, it's gone. In the dark w
//      tips steeper, and the shadow comes back shorter; then w leans back past
//      90° and the shadow falls behind v's tail.

const FTD = makeFrame(-2.8, 5.2, -0.6, 4.9, 24);
const X4T_LEN = Math.hypot(2, 3);
const X4T_ANG = [56.31, 56.31, 56.31, 76, 76, 124];
const X4T_ON = [false, true, false, false, true, true];
const X4T_SAY = [
  "ঘরটা অন্ধকার। v মেঝেতে শোয়ানো, w একটা কোণ করে উঠে গেছে।",
  "v-এর ঠিক ওপরে torchlight জ্বালালাম। আলো নামে সোজা নিচে। v-এর ওপর পড়ে w-এর ছায়া।",
  "Torch নিভালে ছায়াও নাই। ছায়াটা আসে শুধু ওপরের আলো থেকে।",
  "অন্ধকারেই w-কে আরও খাড়া করলাম।",
  "আবার জ্বালালাম। ছায়া এবার ছোট। কারণ, w এখন v-এর দিকে কম যায়।",
  "w পেছনে হেলে গেলে ছায়া পড়ে v-এর উল্টো দিকে।",
];

/** A torchlight pointing straight down, its lens centred at (x, y) on the sheet. */
function S_Torch({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 5} y={y - 24} width={10} height={15} rx={2} fill="#374151" />
      <rect x={x - 2} y={y - 20} width={4} height={5} rx={1} fill={on ? "#22c55e" : "#9ca3af"} />
      <path d={`M${x - 5} ${y - 9}L${x - 10} ${y - 1}H${x + 10}L${x + 5} ${y - 9}Z`} fill="#4b5563" />
      <rect x={x - 10} y={y - 2} width={20} height={3} rx={1} fill={on ? "#fde047" : "#9ca3af"} />
    </g>
  );
}

export function TorchDrop({}: Story) {
  const s = useScene(5, [600, 2400, 2000, 1400, 2400, 2400]);
  const k = s.k;
  const on = X4T_ON[k];
  const [a] = useTween([X4T_ANG[k]], 900);
  const f = FTD;
  const w: XY = [X4T_LEN * Math.cos(a * RAD), X4T_LEN * Math.sin(a * RAD)];
  const lo = Math.min(0, w[0]) - 0.35;
  const hi = Math.max(0, w[0]) + 0.35;
  const tx = f.sx((lo + hi) / 2);
  const ty = f.sy(4.45);
  return (
    <Scene scene={s} caption={say(X4T_SAY, k)}>
      <S_Sheet max="max-w-[14rem]">
        <Plane f={f} grid={0} axes={false} label="v-এর ঠিক ওপরে torchlight; জ্বালালে v-এর ওপর w-এর ছায়া পড়ে, নিভালে থাকে না" className="my-0! max-w-none">
          <rect
            x={f.sx(f.x0)}
            y={f.sy(f.y1)}
            width={(f.x1 - f.x0) * f.u}
            height={(f.y1 - f.y0) * f.u}
            fill={S_INK}
            style={{ opacity: on ? 0 : 0.28 }}
            className="pointer-events-none transition-opacity duration-500 motion-reduce:transition-none"
          />
          {on && <path d={`M${tx - 9} ${ty + 1}L${f.sx(lo)} ${f.sy(0)}H${f.sx(hi)}L${tx + 9} ${ty + 1}Z`} fill="#fde047" fillOpacity={0.35} className={`${FADE} pointer-events-none`} />}
          {on && Math.abs(w[0]) > 0.02 && <S_Bar f={f} to={[w[0], 0]} tone={w[0] < 0 ? "danger" : "ink"} />}
          {on && <S_Drop f={f} from={w} to={[w[0], 0]} />}
          <Arrow f={f} from={O} to={[4.6, 0]} tone="teal" w={3} />
          <Arrow f={f} from={O} to={w} tone="coral" w={2.6} />
          <Label f={f} at={[4.6, 0]} dx={-2} dy={-8} anchor="end" className="fill-cat-teal">
            v
          </Label>
          <Label f={f} at={w} dx={w[0] < 0 ? -6 : 6} dy={-2} anchor={w[0] < 0 ? "end" : "start"} className="fill-cat-coral">
            w
          </Label>
          <S_Torch x={tx} y={ty} on={on} />
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
  "w-কে ঘুরিয়ে v-এর ওপর শুইয়ে দিলে? পাই w-এর পুরো length, 3.61।",
  "কোণ যা-ই হোক, ঘুরিয়ে শোয়ালে সবসময় সেই 3.61।",
  "রোদ নামে সোজা। w-এর মাথা থেকে v-এর ওপর খাড়া দাগ। ছায়া 2।",
  "যতটুকু পড়ে? w-এর যে অংশটা v-এর দিকে যায়। এর নাম projection।",
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
  "w-এর মাথা থেকে সোজা নিচে দাগ নামালে? ছায়া থামে 2-এ।",
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
// 5b · A watch-only figure for screen 5's setup (a story scene, no task):
//      মামা's sentence becomes the formula. v's length is ‖v‖ on the tape;
//      the roof's rule (shadow = stick × cos θ) with w as the stick makes
//      w's shadow ‖w‖ cos θ; together ‖v‖ × ‖w‖ × cos θ.

const X5B_SAY = [
  "মামার হিসাব: v-এর length, গুণ v-এর ওপর w-এর ছায়া।",
  "v-এর length ফিতায় মাপা যায়। এর নাম ‖v‖।",
  "আর ছায়া? ছাদের লাঠির কথা মনে করুন: ছায়া হলো লাঠি গুণ cos θ।",
  "এখানে লাঠি হলো w। তাই w-এর ছায়া হলো ‖w‖ গুণ cos θ।",
  "সব মিলিয়ে ‖v‖ × ‖w‖ × cos θ। দুইটা ফিতার মাপ, আর একটা চাঁদার মাপ।",
];

export function RecipeBuild({}: Story) {
  const s = useScene(4, [600, 1800, 2600, 2600, 2800]);
  const k = s.k;
  const chip = "rounded-lg border-2 px-1.5 py-0.5 text-center transition-colors duration-500 motion-reduce:transition-none";
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <div className="mx-auto flex max-w-xs items-center gap-3">
        <S_Sheet max="max-w-[8rem]">
          <Plane f={FN} ticks={1} label="v শোয়ানো, w (2, 3); ফিতায় v-এর length, আর v-এর ওপর w-এর ছায়া" className="my-0! max-w-none">
            {k === 1 && <S_Bar f={FN} to={[3.2, 0]} tone="tape" w={6} />}
            {k >= 2 && <Arc f={FN} a={[1, 0]} b={V} r={0.7} label={false} />}
            {k >= 3 && <S_Bar f={FN} to={[2, 0]} />}
            {k >= 3 && <S_Drop f={FN} from={V} to={[2, 0]} />}
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
          <div className="flex flex-wrap items-center gap-1">
            <span key={k >= 1 ? "a" : "b"} className={`${FADE} ${chip} border-cat-teal/50 ${k >= 1 ? "bg-cat-teal/10 font-mono font-bold" : ""}`}>
              {k >= 1 ? "‖v‖" : "v-এর length"}
            </span>
            <span className="font-mono">×</span>
            <span key={k >= 3 ? "c" : "d"} className={`${FADE} ${chip} border-cat-coral/50 ${k >= 3 ? "bg-cat-coral/10 font-mono font-bold" : ""}`}>
              {k >= 3 ? "‖w‖ cos θ" : "w-এর ছায়া"}
            </span>
          </div>
          {k >= 2 && <div className={`${FADE} text-xs text-muted`}>ছাদের নিয়ম: ছায়া = লাঠি × cos θ</div>}
          {k >= 4 && <div className={`${FADE} font-mono text-[0.95rem] font-bold`}>‖v‖ × ‖w‖ × cos θ</div>}
        </div>
      </div>
    </Scene>
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
  "v-এর length 2, গুণ ছায়া 3: 6। Dot product এ ও 6।",
  "বাজির জোড়া: v-এর ওপর w-এর ছায়া 1.94।",
  "v-এর length 3.61, গুণ ছায়া 1.94: 7.0। Dot product এ ও 7।",
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
              <S_Tick /> dot product এ ও {p.box}
            </div>
          )}
        </div>
      </div>
      {k >= 5 && <div className={`${FADE} mt-2 text-center font-mono text-sm`}>‖v‖ × ‖w‖ cos θ = v · w</div>}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5⅝ · A figure for screen 5's explanation, no task: the shadow on a tilted
//      arrow. The bet's v (2, 3) leans; turn the round paper until v lies
//      flat, drop the sun's line from w's tip (1.94), then turn it back: the
//      shadow stays on v. Everything is rotated by hand, so labels stay upright.

const X5T = { cx: 120, cy: 88, r: 80, u: 20 };
const X5T_TURN = 123.69;
const X5T_SAY = [
  "বাজির জোড়ায় v = (2, 3) হেলানো। ওর ওপর রোদ ফেলবো কীভাবে?",
  "কাগজটা ঘুরিয়ে দিন, যতক্ষণ না v মেঝের মতো শুয়ে পড়ে।",
  "এবার ওপর থেকে রোদ। w-এর মাথা থেকে সোজা নিচে দাগ। ছায়া 1.94।",
  "কাগজ আগের মতো ঘুরিয়ে দিলেও? ছায়াটা লেগে থাকে v-এর গায়েই।",
];

export function TurnPaper() {
  const s = useScene(3, [600, 2000, 2400, 2400]);
  const k = s.k;
  const clip = useId();
  const [a] = useTween([k === 1 || k === 2 ? X5T_TURN : 0], 1200);
  const c = Math.cos(a * RAD);
  const sn = Math.sin(a * RAD);
  const { cx, cy, r, u } = X5T;
  const P = (p: XY): [number, number] => [cx + (p[0] * c - p[1] * sn) * u, cy - (p[0] * sn + p[1] * c) * u];
  const seg = (p: XY, q: XY) => {
    const [x1, y1] = P(p);
    const [x2, y2] = P(q);
    return `M${x1} ${y1}L${x2} ${y2}`;
  };
  const ft = foot(W, V);
  const grid = [-4, -3, -2, -1, 1, 2, 3, 4].map((t) => seg([t, -4.5], [t, 4.5]) + seg([-4.5, t], [4.5, t])).join("");
  const arrow = (to: XY, color: string) => {
    const [x2, y2] = P(to);
    const [x1, y1] = P(O);
    const l = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / l;
    const uy = (y2 - y1) / l;
    return (
      <path
        d={`M${x1} ${y1}L${x2} ${y2}M${x2 - ux * 7 - uy * 4} ${y2 - uy * 7 + ux * 4}L${x2} ${y2}L${x2 - ux * 7 + uy * 4} ${y2 - uy * 7 - ux * 4}`}
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };
  const tag = (p: XY, text: string, color: string) => {
    const [x, y] = P([p[0] * (1 + 0.5 / len(p)), p[1] * (1 + 0.5 / len(p))]);
    const dy = 4;
    return (
      <text x={x} y={y + dy} textAnchor="middle" fontSize={11} fontWeight={700} fill={color}>
        {text}
      </text>
    );
  };
  const [mx, my] = P([ft[0] / 2, ft[1] / 2]);
  return (
    <Scene scene={s} caption={say(X5T_SAY, k)}>
      <svg viewBox="0 0 240 176" role="img" aria-label="হেলানো v-এর ওপর ছায়া: কাগজ ঘুরিয়ে v-কে শুইয়ে রোদ ফেলা, ছায়া 1.94, তারপর কাগজ আগের মতো" className="mx-auto block h-auto w-full max-w-[15rem]">
        <defs>
          <clipPath id={clip}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="white" stroke="#cbd5e1" strokeWidth={1.5} />
        <path d={grid} clipPath={`url(#${clip})`} stroke="#e2e8f0" strokeWidth={1} fill="none" />
        <path d={seg([-4.5, 0], [4.5, 0]) + seg([0, -4.5], [0, 4.5])} clipPath={`url(#${clip})`} stroke="#94a3b8" strokeWidth={1} fill="none" />
        {k >= 2 && <path d={seg(O, ft)} stroke={S_INK} strokeOpacity={0.6} strokeWidth={7} strokeLinecap="round" className={FADE} />}
        {k >= 2 && <path d={seg(W, ft)} stroke="#d97706" strokeWidth={1.3} strokeDasharray="4 3" className={FADE} />}
        {arrow(V, "#2563eb")}
        {arrow(W, "#e11d48")}
        {tag(V, "v", "#2563eb")}
        {tag(W, "w", "#e11d48")}
        {k >= 2 && (
          <text x={mx} y={my + (k === 2 ? 17 : 0)} dx={k === 2 ? 0 : -16} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily="ui-monospace, monospace" fill={S_INK} className={FADE}>
            1.94
          </text>
        )}
      </svg>
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
  "ধাক্কা রাস্তা বরাবর। তাই রাস্তার ওপর তার ছায়া পুরো 5।",
  "রাস্তার length 5, গুণ ছায়া 5: 25। বাড়তি 5 গুণটা? আসছিল রাস্তার length থেকে।",
];

export function RoadDebt() {
  const s = useScene(3, [600, 1600, 1800, 2800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      <div className="mx-auto flex max-w-xs items-center gap-3">
        <S_Sheet max="max-w-[9rem]">
          <Plane f={FRD} ticks={1} label="রাস্তা (4, 3), ফাহিমের ধাক্কা রাস্তা বরাবর, ছায়া 5, dot product 25" className="my-0! max-w-none">
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
              <S_Tick /> dot product এ ও 25
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

export function NotYetProof({}: Story) {
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
              <S_Tick /> dot product {d.n}, মামা {d.n}
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
  "ওপর থেকে রোদ: x axis-এ ছায়া 2, পূর্বে হাঁটার সমান।",
  "পাশ থেকে রোদ: y axis-এ ছায়া 3। কতদূর হাঁটা, সেটাই ছায়া।",
];

export function WalkIsShadow() {
  const s = useScene(4, [600, 1400, 1600, 2400, 2800]);
  const k = s.k;
  const rows: [string, string, boolean][] = [
    ["পূর্বে হাঁটা", "2", k >= 1],
    ["উত্তরে হাঁটা", "3", k >= 2],
    ["x axis-এ ছায়া", "2", k >= 3],
    ["y axis-এ ছায়া", "3", k >= 4],
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
  "প্রথম নতুন axis (0.8, 0.6)-এর সাথে dot product: 2 × 0.8 + 3 × 0.6 = 3.4। ওর ওপর ছায়াও 3.4।",
  "দ্বিতীয়টা (−0.6, 0.8)-এর সাথে dot product: 1.2। একই জায়গার নতুন address (3.4, 1.2)।",
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
// 6⅞a · A figure for the PCA side quest in screen 6's explanation, no task:
//       why turn the axes. A long, thin cloud of data dots on the usual
//       axes; the axes turn until axis 1 runs along the cloud; the shadows
//       on axis 1 spread from −2.4 to 2.4, those on axis 2 bunch between
//       −0.4 and 0.4; axis 2 fades, its number is tiny for every dot.
//       Captions converted to Banglish; the author may revise them.

const X9C_SAY = [
  "প্রতিটা dot একটা করে data। সাধারণ axis-এ প্রতিটা dot-এর লাগে দুইটা number।",
  "দুই axis ঘুরাই, 1 unit লম্বা আর 90° রেখেই, যতক্ষণ না axis 1 dot-এর ঝাঁক বরাবর চলে আসে।",
  "Axis 1-এর shadow-গুলো অনেক দূরে দূরে ছড়ানো। এই number দিয়েই dot-গুলো আলাদা করে চেনা যায়।",
  "Axis 2-এর shadow-গুলো সব 0-এর কাছে জড়ো। প্রতিটা dot-এর জন্যই এই number ছোট।",
  "তাই দ্বিতীয় number প্রায় কোনো কাজেরই না। ওটাকে প্রায় বাদ দেওয়া যায়।",
];
const X9C_SPREAD = [
  ["axis 1", "−2.4 থেকে 2.4"],
  ["axis 2", "−0.4 থেকে 0.4"],
];

export function DataAxes() {
  const s = useScene(4, [600, 1800, 2400, 2400, 2400]);
  const k = s.k;
  const [t] = useTween([k >= 1 ? 26.57 : 0], 1100);
  const px = (p: XY) => X9B_C.x + p[0] * X9B_C.u;
  const py = (p: XY) => X9B_C.y - p[1] * X9B_C.u;
  const axes: XY[] = [
    [Math.cos(t * RAD), Math.sin(t * RAD)],
    [-Math.sin(t * RAD), Math.cos(t * RAD)],
  ];
  const reachOf = [3.3, 1.6];
  const on = (p: XY, u: XY): XY => [u[0] * dot(p, u), u[1] * dot(p, u)];
  const shown = (j: number) => k >= j + 2;
  return (
    <Scene scene={s} caption={say(X9C_SAY, k)}>
      <div className="mx-auto flex max-w-sm items-center gap-3">
        <svg viewBox="0 0 240 120" role="img" aria-label="লম্বা, সরু একটা data-র মেঘ; axis ঘুরিয়ে মেঘ বরাবর বসালে axis 1-এ ছায়া ছড়ানো, axis 2-এ সব ছায়া 0-এর কাছে" className="block h-auto w-full max-w-[13rem] shrink-0">
          <rect x={1} y={1} width={238} height={118} rx={10} fill="white" stroke="#cbd5e1" />
          {axes.map((u, j) => {
            const r = reachOf[j];
            const end: XY = [u[0] * r, u[1] * r];
            const lab: XY = [u[0] * (r - 0.25) - axes[1 - j][0] * 0.25, u[1] * (r - 0.25) - axes[1 - j][1] * 0.25];
            return (
              <g key={j} style={{ opacity: k >= 4 && j === 1 ? 0.25 : 1 }} className="transition-opacity duration-700 motion-reduce:transition-none">
                <path d={`M${px([-end[0], -end[1]])} ${py([-end[0], -end[1]])}L${px(end)} ${py(end)}`} strokeWidth={1.6} stroke="#0d9488" />
                <text x={px(lab)} y={py(lab) + 3} textAnchor="middle" fontSize={9} fontWeight={700} fill="#0d9488" fontFamily="ui-monospace, monospace">
                  {j + 1}
                </text>
              </g>
            );
          })}
          {axes.map((u, j) =>
            k === j + 2
              ? X9B_DOTS.map((p, i) => {
                  const q = on(p, u);
                  return <path key={`d${j}${i}`} d={`M${px(p)} ${py(p)}L${px(q)} ${py(q)}`} strokeWidth={1} strokeDasharray="3 2" stroke="#d97706" className={FADE} />;
                })
              : null,
          )}
          {X9B_DOTS.map((p, i) => (
            <circle key={i} cx={px(p)} cy={py(p)} r={3.4} fill="#2563eb" />
          ))}
          {axes.map((u, j) =>
            shown(j)
              ? X9B_DOTS.map((p, i) => {
                  const q = on(p, u);
                  return <circle key={`s${j}${i}`} cx={px(q)} cy={py(q)} r={2.4} fill="#d97706" className={FADE} style={{ opacity: k >= 4 && j === 1 ? 0.3 : 1 }} />;
                })
              : null,
          )}
        </svg>
        <div className="grid min-w-0 flex-1 gap-1.5 text-sm">
          {k >= 2 && <div className={`${FADE} text-xs text-muted`}>shadow কতটা ছড়ানো</div>}
          {X9C_SPREAD.map(([name, range], j) =>
            shown(j) ? (
              <div key={j} className={`${FADE} ${k >= 4 && j === 1 ? "text-muted" : ""}`}>
                {name}: <b className="whitespace-nowrap">{range}</b>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6⅞b · A figure for the same side quest, no task: dropping the second
//       number. The same cloud, axis 1 through it, each dot dropping its
//       shadow onto it, and the dots settling there as one number each.

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
  "সেই একই data-র ঝাঁক। প্রতিটা dot এখনো দুইটা number।",
  "শুধু axis 1 রাখি, যেদিকে dot-গুলো ছড়ানো।",
  "প্রতিটা dot axis 1-এর ওপর shadow ফেলে।",
  "এখন প্রতিটা dot শুধু একটা number, ওর shadow। হারালাম শুধু ছোট্ট দ্বিতীয় number-গুলো। PCA মোটামুটি এটুকুই।",
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
// 7b · A watch-only figure for screen 7's setup (a story scene, no task): the
//       four pieces. v = 2e₁ + 3e₂ and w = 2e₁ + 1e₂ break into two pieces
//       each; by rule one every piece of v pairs with every piece of w (four
//       lines drawn), and by rule two the numbers step outside, leaving one
//       pair of axes per piece. No piece's value is shown: that's the widget.

const X7B_V = ["2e₁", "3e₂"];
const X7B_W = ["2e₁", "1e₂"];
const X7B_X = [110, 190];
const X7B_SAY = [
  "v = 2e₁ + 3e₂, দুইটা টুকরা। w = 2e₁ + 1e₂, এরও দুইটা।",
  "নিয়ম এক: টুকরা টুকরা করে হিসাব করে যোগ করলেই চলে। তাই v-এর 2e₁ বসে w-এর দুই টুকরার সাথেই।",
  "v-এর 3e₂-ও বসে দুই টুকরার সাথে। মোট চারটা জোড়া।",
  "নিয়ম দুই: সামনের সংখ্যাগুলো বাইরে এসে গুণ হয়। ভেতরে থাকে শুধু একজোড়া axis।",
];

export function FourPieces({}: Story) {
  const s = useScene(3, [600, 2800, 2200, 2800]);
  const k = s.k;
  const node = (x: number, y: number, t: string, tone: string) => (
    <g key={`${t}${y}`}>
      <rect x={x - 22} y={y - 11} width={44} height={22} rx={6} fill="white" stroke={tone} strokeWidth={1.6} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace" fill={tone}>
        {t}
      </text>
    </g>
  );
  return (
    <Scene scene={s} caption={say(X7B_SAY, k)}>
      <svg viewBox="0 0 260 104" role="img" aria-label="v-এর দুই টুকরা আর w-এর দুই টুকরা; প্রতিটা টুকরা অন্য দিকের দুই টুকরার সাথেই জোড়া বাঁধে, মোট চারটা" className="mx-auto block h-auto w-full max-w-[16rem]">
        <text x={40} y={22} textAnchor="middle" fontSize={12} fontWeight={800} fill="#2563eb">
          v
        </text>
        <text x={40} y={88} textAnchor="middle" fontSize={12} fontWeight={800} fill="#e11d48">
          w
        </text>
        {[0, 1].map((i) =>
          k >= i + 1
            ? X7B_X.map((x2, j) => <Draw key={`${i}${j}`} d={`M${X7B_X[i]} 29L${x2} 73`} delay={j * 300} ms={700} strokeWidth={1.8} className="stroke-cat-violet" />)
            : null,
        )}
        <text x={150} y={22} textAnchor="middle" fontSize={11} fill="#475569">
          +
        </text>
        <text x={150} y={88} textAnchor="middle" fontSize={11} fill="#475569">
          +
        </text>
        {X7B_V.map((t, i) => node(X7B_X[i], 18, t, "#2563eb"))}
        {X7B_W.map((t, j) => node(X7B_X[j], 84, t, "#e11d48"))}
      </svg>
      {k >= 3 && (
        <div className={`${FADE} mx-auto mt-1 grid max-w-[17rem] grid-cols-2 gap-1 text-center font-mono text-[0.7rem]`}>
          {[0, 1].flatMap((i) =>
            [0, 1].map((j) => (
              <span key={`${i}${j}`} className="rounded-lg border border-border bg-foreground/5 px-1 py-0.5 whitespace-nowrap">
                {X7B_V[i][0]} × {X7B_W[j][0]} × ({X7B_V[i].slice(1)}·{X7B_W[j].slice(1)})
              </span>
            )),
          )}
        </div>
      )}
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
      <Stage backdrop="field" label="মামী বললেন, dot product এর হিসাবের ভেতরে চাঁদা ছিল, শুধু লুকানো; box খুলতেই ভেতরে একটা চাঁদা">
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
        {k === 1 && <Bubble x={112} y={SG - 66} side="right" lines={["তাহলে dot product এর", "হিসাবের ভেতরে চাঁদা", "ছিল, শুধু লুকানো।"]} />}
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
  "Dot product ও 0। দুই হিসাবই বলছে ৯০ degree।",
  "দ্বিতীয় জোড়ায় কোণ 90° পেরিয়ে গেছে: ছায়া পড়লো পেছনে, −1।",
  "মামা: 3 × (−1) = −3। Dot product ও −3। দুই হিসাবেই minus।",
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
          {second ? <BoxRun a={[3, 0]} b={[-1, 2]} inline /> : <BoxRun a={[2, 2]} b={[-2, 2]} inline />}
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
// 9a½ · A story scene for 4.4's opening, no task: the same ছাদ in the
//       afternoon. মামী shrugs off the two matches (a lottery wins now and
//       then too); মামা says any two arrows will do. ফাহিম is left wondering.

export function MamiDoubt({}: Story) {
  const s = useScene(3, [600, 2600, 2600, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বিকেলে ছাদে মামী বললেন দুইবার মেলা ভাগ্য; মামা বললেন যেকোনো দুইটা arrow-এ মিলবে; ফাহিম ভাবছে">
        <S_Roof shade />
        <S_Chalk x={196} y={172} arrows={[V, W]} names={["v", "w"]} u={12} squash={0.5} />
        <Person who="mami" x={120} y={SG} mood={k === 1 ? "smug" : "plain"} arm={k === 1 ? "point" : "down"} label />
        <Person who="mama" x={180} y={SG} mood={k === 2 ? "shout" : "plain"} arm={k === 2 ? "wave" : "down"} label />
        <Person who="fahim" x={270} y={SG} facing={-1} mood={k >= 3 ? "puzzled" : "plain"} label />
        {k === 1 && <Bubble x={120} y={SG - 66} side="right" lines={["দুইবার মিলেছে, তাতে কী?", "লটারিও মাঝেমধ্যে মেলে।"]} />}
        {k === 2 && <Bubble x={180} y={SG - 66} side="right" lines={["যেকোনো দুইটা arrow নাও,", "সবসময় মিলবে!"]} />}
        {k >= 3 && (
          <text x={270} y={SG - 70} textAnchor="middle" fontSize={22} fontWeight={800} fill={S_INK} className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// The review questions, rebuilt as visual exercises. Each keeps its old
// Check's question, answer, hint (the Nope line) and praise (the pass note).
// A tap plays the pick out on the sheet in a few short beats: a wrong pick
// shows what it would mean, and the right one passes from the play's done.
// A Check's own explanation comes in as children and takes the choices'
// place once it is solved.

/** A pick played out in `end` beats of `ms`. A preview (no effects) shows a seeded pick settled. */
function useTry(right: number, end: number, note?: string, ms = 520) {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [won, setWon] = useSeed("won", false);
  const [miss, setMiss] = useState(0);
  const [ran, setRan] = useState(false);
  const p = usePlay(ms);
  const choose = (i: number) => {
    if (won) return;
    setPick(i);
    setRan(true);
    setMiss((m) => m + 1);
    p.play(
      end,
      i === right
        ? () => {
            setWon(true);
            pass(note);
          }
        : undefined,
    );
  };
  // a preview can also seed the beat it stops on ("at")
  const [at] = useSeed<number | null>("at", null);
  const k = ran ? p.k : pick === null ? 0 : (at ?? end);
  const settled = pick !== null && k >= end;
  return { pick, won, k, miss, choose, settled, wrong: settled && pick !== right, hit: settled && pick === right };
}
type Try = ReturnType<typeof useTry>;

const tryLook = (t: Try, i: number): Look => (t.pick === i ? (t.settled ? (t.hit ? "right" : "wrong") : "picked") : t.won ? "dim" : "idle");

/** The question, as the old Check put it. */
function X_Ask({ children }: { children: ReactNode }) {
  return <div className="text-[1.05rem] leading-snug font-semibold text-balance">{children}</div>;
}

/** One choice: a small picture (or none) over its words; `row` lays them side by side. */
function X_Pick({ t, i, label, row = false, children }: { t: Try; i: number; label: string; row?: boolean; children?: ReactNode }) {
  return (
    <button
      type="button"
      disabled={t.won}
      onClick={() => t.choose(i)}
      className={`flex min-w-0 cursor-pointer items-center rounded-xl border-2 leading-tight transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default motion-reduce:transition-none ${
        row ? "gap-2.5 px-2.5 py-1.5 text-left text-sm" : "flex-col justify-center gap-1 px-1 py-1.5 text-center text-xs"
      } ${LOOK[tryLook(t, i)]}`}
    >
      {children}
      <span className={children ? "" : /[ঀ-৿]/.test(label) ? "text-sm" : "font-mono text-base font-semibold"}>{label}</span>
    </button>
  );
}

/** The choices; once solved, the explanation (if any) takes their place. */
function X_Answer({ t, cols, picks, children }: { t: Try; cols: string; picks: ReactNode; children?: ReactNode }) {
  if (t.won && children) return <div className={`${FADE} mt-3 text-left text-[0.95rem] leading-relaxed`}>{children}</div>;
  return <div className={`mt-3 grid gap-2 ${cols}`}>{picks}</div>;
}

/** A small arrow in a choice's own little drawing. */
function X_Mini({ x1, y1, x2, y2, c, w = 2 }: { x1: number; y1: number; x2: number; y2: number; c: string; w?: number }) {
  const l = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / l;
  const uy = (y2 - y1) / l;
  return (
    <path
      d={`M${x1} ${y1}L${x2} ${y2}M${x2 - ux * 5 - uy * 3} ${y2 - uy * 5 + ux * 3}L${x2} ${y2}L${x2 - ux * 5 + uy * 3} ${y2 - uy * 5 - ux * 3}`}
      fill="none"
      stroke={c}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** A choice's white card. */
function X_Card({ w = 64, h = 40, children }: { w?: number; h?: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="block h-auto w-full max-w-[4.5rem] shrink-0">
      <rect x={0.5} y={0.5} width={w - 1} height={h - 1} rx={6} fill="white" stroke="#cbd5e1" />
      {children}
    </svg>
  );
}

const X_TEAL = "#0d9488";
const X_CORAL = "#e11d48";
const X_BLUE = "#2563eb";

/** A shadow laid along the floor (y = 0) from a to b, drawing itself. */
const floorPath = (f: Frame, a: number, b: number) => `M${f.sx(a)} ${f.sy(0)}H${f.sx(b)}`;

/** A red bracket under the floor between a and b: how far a wrong shadow missed. */
function X_Gap({ f, a, b }: { f: Frame; a: number; b: number }) {
  if (Math.abs(a - b) < 0.01) return null;
  const y = f.sy(0) + 8;
  return <path d={`M${f.sx(a)} ${y - 3}v3H${f.sx(b)}v-3`} fill="none" strokeWidth={1.6} className={`${FADE} pointer-events-none stroke-danger`} />;
}

// 4.2's muddy road, for the two van questions. The road (4, 3) runs through
// the van at the middle of the sheet; the van rolls along it as far as the
// box's number says.

const FVAN = makeFrame(-4.5, 4.5, -3.5, 4.5, 17);
const VAN_ROAD: XY = [4, 3];
const VAN_DIR: XY = [0.8, 0.6];

function X_Road() {
  const f = FVAN;
  const a = reach([-VAN_DIR[0], -VAN_DIR[1]], f, 0);
  const b = reach(VAN_DIR, f, 0);
  const d = `M${f.sx(-VAN_DIR[0] * a)} ${f.sy(-VAN_DIR[1] * a)}L${f.sx(VAN_DIR[0] * b)} ${f.sy(VAN_DIR[1] * b)}`;
  return (
    <g className="pointer-events-none">
      <path d={d} strokeWidth={16} stroke="#e7dcc5" />
      <path d={d} strokeWidth={1} strokeDasharray="5 5" stroke="#a8a29e" />
    </g>
  );
}

/** The van, `at` units along the road; `ghost` is a guess of where it goes, drawn dashed. */
function X_Van({ at, ghost = false }: { at: number; ghost?: boolean }) {
  const f = FVAN;
  const body = ghost ? "none" : "#92400e";
  return (
    <g
      style={{ transform: `translate(${f.sx(at * VAN_DIR[0])}px, ${f.sy(at * VAN_DIR[1])}px) rotate(-36.87deg)` }}
      className="pointer-events-none transition-transform duration-700 ease-out motion-reduce:transition-none"
    >
      <rect x={-10} y={-7} width={20} height={11} rx={2} fill={body} stroke="#78350f" strokeWidth={1.2} strokeDasharray={ghost ? "3 2" : undefined} />
      {[-5.5, 5.5].map((x) => (
        <circle key={x} cx={x} cy={5.5} r={2.4} fill={ghost ? "none" : S_INK} stroke={ghost ? "#78350f" : "none"} strokeWidth={1} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 0✓ · 4.3's opening review: the box gave 0 for two arrows; what does that
//      mean? On 4.2's road, the picked push draws in, the box runs it, and
//      the van rolls: forward for the same direction (25), back for the
//      opposite one (−25), not at all at 90° (মামী's push, 0).

const ZM_PUSH: XY[] = [
  [4, 3],
  [-4, -3],
  [-3, 4],
];
const ZM_OFF: XY = [-0.36, 0.48];
const ZM_OPTS = ["দুইটা একই দিকে", "দুইটা উল্টো দিকে", "দুইটা ৯০ degree কোণে"];
const ZM_RIGHT = 2;
/** the push in each choice's picture, from the tail at (28, 26); the road runs to (52, 8) */
const ZM_PIC: [number, number, number, number][] = [
  [25, 21, 47, 4],
  [28, 26, 9, 40],
  [28, 26, 15, 8],
];

export function ZeroMeans({ children }: { children?: ReactNode }) {
  const t = useTry(ZM_RIGHT, 3, "Dot product 0 মানে ৯০ degree কোণ।");
  const f = FVAN;
  const push = t.pick === null ? null : ZM_PUSH[t.pick];
  const off: XY = t.pick === 0 ? ZM_OFF : O;
  const n = push ? dot(VAN_ROAD, push) : 0;
  return (
    <>
      <X_Ask>দুইটা arrow এর dot product করলে 0 এলো। মানে কী?</X_Ask>
      <S_Sheet max="mt-2 max-w-[10.5rem]">
        <Plane f={f} label="৪.২-এর রাস্তা (4, 3) আর একটা ধাক্কা; dot product যত বলে, ভ্যান তত এগোয় বা পেছায়" className="my-0! max-w-none">
          <X_Road />
          <Arrow f={f} from={O} to={VAN_ROAD} tone="teal" w={2.4} />
          <Label f={f} at={[2.6, 1.95]} dx={6} dy={12} anchor="start" size={9} className="fill-cat-teal">
            রাস্তা
          </Label>
          <X_Van at={t.k >= 3 ? Math.sign(n) * 2 : 0} />
          {push && t.k >= 1 && (
            <g key={t.miss}>
              <Arrow f={f} from={off} to={[push[0] + off[0], push[1] + off[1]]} tone="coral" w={2.4} draw />
            </g>
          )}
          {t.hit && <S_Square f={f} at={O} a={VAN_ROAD} b={ZM_PUSH[2]} s={0.7} />}
        </Plane>
      </S_Sheet>
      <div className="mt-1 min-h-10 text-center text-sm">
        {push && t.k >= 2 && (
          <span key={t.miss} className={FADE}>
            dot product: <BoxRun a={VAN_ROAD} b={push} k={t.k >= 3 ? 3 : 2} inline />
          </span>
        )}
        {push && t.k >= 3 && <div className={`${FADE} text-xs text-muted`}>{n > 0 ? "ভ্যান সামনে এগোলো।" : n < 0 ? "ভ্যান পেছনে গেলো।" : "ভ্যান এক চুলও নড়লো না।"}</div>}
      </div>
      <X_Answer
        t={t}
        cols="grid-cols-3"
        picks={ZM_OPTS.map((o, i) => (
          <X_Pick key={o} t={t} i={i} label={o}>
            <X_Card w={64} h={44}>
              <X_Mini x1={28} y1={26} x2={52} y2={8} c={X_TEAL} />
              <X_Mini x1={ZM_PIC[i][0]} y1={ZM_PIC[i][1]} x2={ZM_PIC[i][2]} y2={ZM_PIC[i][3]} c={X_CORAL} />
            </X_Card>
          </X_Pick>
        ))}
      >
        {children}
      </X_Answer>
      {t.wrong && (
        <Nope key={t.miss}>
          Dot product এ এলো {fix(n, 0)}, 0 না। মামীর ধাক্কা পক্ষেও ছিল না, বিপক্ষেও না। কোন দিক থেকে ঠেলছিলেন?
        </Nope>
      )}
      <Task done={t.won}>যে ছবিতে dot product 0 আসে, সেটাতে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2✓ · The review after screen 2: a 3 m stick at the same 60°. The picked
//      shadow is laid on the floor, then the sun's line drops from the
//      stick's tip; a wrong shadow stops short of it or runs past it.

const FTM = makeFrame(-0.3, 3.9, -0.45, 2.9, 38);
const TM_TIP: XY = [1.5, 3 * Math.sin(60 * RAD)];
const TM_OPTS = [1.5, 0.5, 3.5];
const TM_RIGHT = 0;

export function ThreeMetre() {
  const t = useTry(TM_RIGHT, 3, "লাঠি ৩ গুণ, ছায়াও ৩ গুণ।");
  const f = FTM;
  const L = t.pick === null ? 0 : TM_OPTS[t.pick];
  return (
    <>
      <X_Ask>১ মিটার লাঠির ছায়া 60°-এ 0.5 মিটার। ৩ মিটার লাঠি একই 60°-এ হেলালে ছায়া কত?</X_Ask>
      <S_Sheet max="mt-2 max-w-[12rem]">
        <Plane f={f} grid={0.5} axes={false} label="৩ মিটার লাঠি 60° কোণে; বেছে নেওয়া ছায়া মেঝেতে, আর রোদের দাগ লাঠির মাথা থেকে সোজা নিচে" className="my-0! max-w-none">
          <circle cx={f.sx(3.5)} cy={f.sy(2.5)} r={8} className="pointer-events-none fill-[#fbbf24]" />
          <path d={floorPath(f, -0.3, 3.9)} strokeWidth={1.5} className="pointer-events-none stroke-[#0f1b2d]/50" />
          {[0, 1, 2, 3].map((m) => (
            <g key={m}>
              <path d={`M${f.sx(m)} ${f.sy(0)}v4`} strokeWidth={1} className="pointer-events-none stroke-[#0f1b2d]/50" />
              <Label f={f} at={[m, 0]} dy={15} size={8.5} className="fill-[#0f1b2d]/70 font-mono">
                {m}
              </Label>
            </g>
          ))}
          {L > 0 && t.k >= 1 && <Draw key={t.miss} d={floorPath(f, 0, L)} strokeWidth={7} ms={500} className={t.wrong ? "stroke-danger/60" : "stroke-[#0f1b2d]/60"} />}
          {t.k >= 2 && <S_Drop f={f} from={TM_TIP} to={[1.5, 0]} />}
          {t.wrong && <X_Gap f={f} a={L} b={1.5} />}
          {t.hit && <S_Square f={f} at={[1.5, 0]} a={[0, 1]} b={[-1, 0]} s={0.2} />}
          <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(TM_TIP[0])} ${f.sy(TM_TIP[1])}`} strokeWidth={5} strokeLinecap="round" className="pointer-events-none stroke-[#92400e]" />
          <Arc f={f} a={[1, 0]} b={TM_TIP} r={0.42} />
          <Label f={f} at={[0.75, 1.3]} dx={-4} anchor="end" size={9} className="fill-[#92400e]">
            ৩ মিটার
          </Label>
        </Plane>
      </S_Sheet>
      <X_Answer
        t={t}
        cols="grid-cols-3"
        picks={TM_OPTS.map((L2, i) => (
          <X_Pick key={L2} t={t} i={i} label={`${L2} মিটার`}>
            <X_Card w={70} h={24}>
              <path d="M4 17H66" stroke="#94a3b8" strokeWidth={1} />
              <path d={`M6 14H${6 + L2 * 16}`} stroke="#475569" strokeWidth={5} strokeLinecap="round" />
            </X_Card>
          </X_Pick>
        ))}
      />
      {t.wrong && (
        <Nope key={t.miss}>
          আপনার ছায়া রোদের দাগের সাথে মিললো না। ২ মিটার লাঠিতে ছায়া কী হয়েছিল? ছায়া ÷ লাঠি তো বদলায় না।
        </Nope>
      )}
      <Task done={t.won}>একটা ছায়া বেছে নিন। তারপর দেখুন রোদের দাগ কোথায় পড়ে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4✓ · The review before screen 5: (2, 3) with itself gives 13; how long is
//      (2, 3)? The picked length is laid on the arrow as মামার ফিতা: 13 runs
//      off the sheet, 5 (2 and 3 added straight, laid end to end) runs past
//      the tip, √13 stops on it.

const FTT = makeFrame(-0.5, 3.5, -0.5, 4.5, 28);
const TT_LEN = [13, Math.sqrt(13), 5];
const TT_OPTS = ["13", "প্রায় 3.61, মানে √13", "5"];
const TT_RIGHT = 1;
const TT_U: XY = [2 / Math.sqrt(13), 3 / Math.sqrt(13)];

export function TapeThirteen({ children }: { children?: ReactNode }) {
  const t = useTry(TT_RIGHT, 3, "v · v = 13, তাই length √13 ≈ 3.61।");
  const f = FTT;
  const L = t.pick === null ? 0 : TT_LEN[t.pick];
  const end = Math.min(L, reach(TT_U, f, 0.05));
  const tip = Math.sqrt(13);
  const seg = (a: number, b: number) => `M${f.sx(TT_U[0] * a)} ${f.sy(TT_U[1] * a)}L${f.sx(TT_U[0] * b)} ${f.sy(TT_U[1] * b)}`;
  const at = (s: number): XY => [TT_U[0] * s, TT_U[1] * s];
  return (
    <>
      <X_Ask>(2, 3)-এর নিজের সাথে dot product করলে আসে 13। তাহলে (2, 3) arrow-টা কত লম্বা?</X_Ask>
      <div className="mt-2 flex items-center gap-3">
        <S_Sheet max="max-w-[8.5rem]">
          <Plane f={f} ticks={1} label="(2, 3) arrow-এর ওপর বেছে নেওয়া length-এর ফিতা" className="my-0! max-w-none">
            {L > 0 &&
              t.k >= 1 &&
              (t.pick === 2 ? (
                <g key={t.miss}>
                  <Draw d={seg(0, 2)} strokeWidth={8} ms={400} className="stroke-[#f59e0b]/75" />
                  <Draw d={seg(2, 5)} delay={400} strokeWidth={8} ms={500} className="stroke-[#b45309]/55" />
                </g>
              ) : (
                <Draw key={t.miss} d={seg(0, end)} strokeWidth={8} ms={t.pick === 0 ? 800 : 500} className="stroke-[#f59e0b]/75" />
              ))}
            <Arrow f={f} from={O} to={V} tone="blue" w={2.4} />
            {t.pick === 2 && t.k >= 2 && (
              <g className={FADE}>
                <Label f={f} at={at(1)} dx={8} dy={2} anchor="start" size={9} className="fill-[#b45309] font-mono">
                  2
                </Label>
                <Label f={f} at={at(3.5)} dx={8} dy={2} anchor="start" size={9} className="fill-[#b45309] font-mono">
                  3
                </Label>
              </g>
            )}
            {t.wrong && <path d={seg(tip, end)} strokeWidth={3} className={`${FADE} pointer-events-none stroke-danger`} />}
            {t.hit && <circle cx={f.sx(V[0])} cy={f.sy(V[1])} r={7} fill="none" strokeWidth={2} className={`${POP} stroke-accent`} />}
          </Plane>
        </S_Sheet>
        <div className="grid min-w-0 flex-1 gap-1.5 text-sm">
          <div className="rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-2 py-1 text-center font-mono text-xs">(2, 3) · (2, 3) = 13</div>
          {L > 0 && t.k >= 1 && (
            <div key={t.miss} className={FADE}>
              ফিতা: <b className="font-mono">{t.pick === 2 ? "2 + 3 = 5" : t.pick === 0 ? "13" : "3.61"}</b>
            </div>
          )}
          {t.k >= 3 && L > 0 && <div className={`${FADE} text-xs ${t.hit ? "text-accent-text" : "text-danger"}`}>{t.hit ? "ফিতা থামলো ঠিক arrow-এর মাথায়।" : "ফিতা arrow-এর মাথা ছাড়িয়ে গেলো।"}</div>}
        </div>
      </div>
      <X_Answer
        t={t}
        cols="grid-cols-3"
        picks={TT_OPTS.map((o, i) => (
          <X_Pick key={o} t={t} i={i} label={o}>
            <X_Card w={70} h={24}>
              <g transform="translate(11 12)">
                <S_Tape />
              </g>
              <path d={`M18 16H${18 + Math.min(TT_LEN[i] * 8, 48)}`} stroke="#f59e0b" strokeWidth={4} strokeDasharray={i === 0 ? "10 2 1 2" : undefined} />
            </X_Card>
          </X_Pick>
        ))}
      >
        {children}
      </X_Answer>
      {t.wrong && <Nope key={t.miss}>মনে আছে ৪.১? Shiku-র (3, 4)-এর নিজের সাথে dot product করে এসেছিল 25। আর ফিতা বলেছিল 5।</Nope>}
      <Task done={t.won}>একটা length বেছে নিন। ফিতাটা (2, 3)-এর ওপর বিছিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5✓ · The review after screen 5: 4.2's road card (4, 3), 5 long, and
//      ফাহিম's push, whose shadow on the road is 5. The pick is built from
//      the two measured bars: 5 is the shadow alone, 10 the two laid end to
//      end, 25 the shadow five times over (once per unit of road). Then the
//      box runs (4, 3) · (4, 3) and says which one it is.

const RB_OPTS = ["5", "25", "10"];
const RB_RIGHT = 1;
const RB_U = 8;
const RB_X = 96;
const RB_FORMULA = ["5", "5 × 5 = 25", "5 + 5 = 10"];

export function RoadBox() {
  const t = useTry(RB_RIGHT, 3, "Dot product মানে length গুণ ছায়া: 5 × 5।");
  const w = 5 * RB_U;
  const bar = (x: number, y: number, teal: boolean, key: string, delay = 0) => (
    <rect key={key} x={x} y={y - 3} width={w} height={6} rx={3} fill={teal ? X_TEAL : "#475569"} className={POP} style={{ transitionDelay: `${delay}ms` }} />
  );
  const built = t.pick === null || t.k < 1 ? [] : t.pick === 0 ? [bar(RB_X, 62, false, "s")] : t.pick === 2 ? [bar(RB_X, 62, true, "r"), bar(RB_X + w, 62, false, "s", 250)] : [0, 1, 2, 3, 4].map((j) => bar(RB_X, 52 + j * 8, false, `s${j}`, j * 120));
  return (
    <>
      <X_Ask>৪.২-এর রাস্তার card (4, 3) ছিল 5 unit লম্বা। ফাহিমের ধাক্কার ছায়া রাস্তা বরাবর 5 unit। Dot product এ কত আসার কথা?</X_Ask>
      <svg viewBox="0 0 250 96" role="img" aria-label="রাস্তার length 5 আর ধাক্কার ছায়া 5 থেকে বেছে নেওয়া উত্তর গড়া হলো" className="mx-auto mt-2 block h-auto w-full max-w-[17rem]">
        <rect x={0.5} y={0.5} width={249} height={95} rx={8} fill="white" stroke="#cbd5e1" />
        <text x={8} y={18} fontSize={9} fill={S_INK}>
          রাস্তার length
        </text>
        {bar(RB_X, 15, true, "road")}
        <text x={RB_X + w + 6} y={18} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill={X_TEAL}>
          5
        </text>
        <text x={8} y={34} fontSize={9} fill={S_INK}>
          ধাক্কার ছায়া
        </text>
        {bar(RB_X, 31, false, "shadow")}
        <text x={RB_X + w + 6} y={34} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#475569">
          5
        </text>
        <path d="M8 43H242" stroke="#e2e8f0" />
        <text x={8} y={66} fontSize={9} fill="#64748b">
          আপনার উত্তর
        </text>
        <g key={t.miss}>{built}</g>
        {t.pick !== null && t.k >= 2 && (
          <text key={`f${t.miss}`} x={t.pick === 2 ? RB_X + 2 * w + 6 : RB_X + w + 6} y={t.pick === 1 ? 72 : 66} fontSize={9.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill={t.wrong ? "#dc2626" : S_INK} className={FADE}>
            {RB_FORMULA[t.pick]}
          </text>
        )}
      </svg>
      <div className="mt-1 min-h-6 text-center text-sm">
        {t.k >= 3 && t.pick !== null && (
          <span key={t.miss} className={`${FADE} inline-flex items-center gap-1`}>
            dot product: <BoxRun a={VAN_ROAD} b={VAN_ROAD} k={3} inline />
            {t.hit ? <S_Tick /> : <span className="text-danger">, আপনার {RB_OPTS[t.pick]}</span>}
          </span>
        )}
      </div>
      <X_Answer t={t} cols="grid-cols-3" picks={RB_OPTS.map((o, i) => <X_Pick key={o} t={t} i={i} label={o} />)} />
      {t.wrong && <Nope key={t.miss}>Dot product এর সাথে মিললো না। মামার হিসাবটা মনে করুন। রাস্তার length, গুণ ধাক্কার যতটুকু রাস্তার দিকে যায়।</Nope>}
      <Task done={t.won}>একটা উত্তর বেছে নিন। Dot product মিলিয়ে দেখবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5✓✓ · 4.3's last review: ‖v‖ = 2, ‖w‖ = 3, 60° between them. 6 swings w
//       flat onto v (the angle dropped); 1.5 stops at w's shadow (v's
//       length never multiplied); 3 is v's length times that shadow.

const FSC = makeFrame(-0.4, 3.4, -0.5, 2.9, 40);
const SC_W: XY = [1.5, 3 * Math.sin(60 * RAD)];
const SC_OPTS = ["6", "1.5", "3"];
const SC_RIGHT = 2;

export function SixtyCheck({ children }: { children?: ReactNode }) {
  const t = useTry(SC_RIGHT, 3);
  const f = FSC;
  const flat = t.pick === 0 && t.k >= 1;
  const [deg] = useTween([flat ? 0 : 60], 600);
  const wAt: XY = [3 * Math.cos(deg * RAD), 3 * Math.sin(deg * RAD)];
  const drop = t.pick === 1 || t.pick === 2 ? t.k >= 1 : t.pick === 0 && t.k >= 3;
  const shadow = (t.pick === 1 || t.pick === 2) && t.k >= 2;
  const formula = t.pick === 0 && t.k >= 2 ? "2 × 3 = 6" : t.pick === 1 && t.k >= 3 ? "3 × 0.5 = 1.5" : t.pick === 2 && t.k >= 3 ? "2 × 1.5 = 3" : shadow ? "w-এর ছায়া 1.5" : "";
  return (
    <>
      <X_Ask>মামা মাপলেন: ‖v‖ = 2, ‖w‖ = 3, আর মাঝের কোণ 60°। Dot product এ কত আসবে?</X_Ask>
      <S_Sheet max="mt-2 max-w-[11.5rem]">
        <Plane f={f} grid={0.5} axes={false} label="v 2 লম্বা, w 3 লম্বা, মাঝে 60°; বেছে নেওয়া উত্তরের হিসাব" className="my-0! max-w-none">
          <path d={floorPath(f, -0.4, 3.4)} strokeWidth={1} strokeDasharray="3 4" className="pointer-events-none stroke-[#0f1b2d]/40" />
          {t.pick === 2 && t.k >= 3 && <S_Bar f={f} to={[2, 0]} tone="tape" w={13} />}
          {flat && t.k >= 2 && <S_Bar f={f} to={[3, 0]} tone="coral" w={8} />}
          {drop && <S_Drop f={f} from={SC_W} to={[1.5, 0]} />}
          {shadow && <Draw key={t.miss} d={floorPath(f, 0, 1.5)} strokeWidth={7} ms={500} className="stroke-[#0f1b2d]/60" />}
          {t.pick === 0 && t.k >= 3 && <X_Gap f={f} a={1.5} b={3} />}
          <Arrow f={f} from={O} to={[2, 0]} tone="blue" w={2.6} />
          {flat && <Arrow f={f} from={O} to={SC_W} tone="coral" w={2} faint />}
          <Arrow f={f} from={O} to={wAt} tone="coral" w={2.4} />
          {!flat && <Arc f={f} a={[1, 0]} b={SC_W} r={0.6} />}
          <Label f={f} at={[2, 0]} dx={2} dy={-7} anchor="start" size={10} className="fill-cat-blue">
            v
          </Label>
          <Label f={f} at={wAt} dx={flat ? 2 : 6} dy={flat ? -8 : 2} anchor="start" size={10} className="fill-cat-coral">
            w
          </Label>
        </Plane>
      </S_Sheet>
      <div className="mt-1 min-h-6 text-center font-mono text-sm">
        {formula && (
          <span key={formula} className={`${FADE} ${t.wrong ? "text-danger" : ""}`}>
            {formula}
          </span>
        )}
      </div>
      <X_Answer t={t} cols="grid-cols-3" picks={SC_OPTS.map((o, i) => <X_Pick key={o} t={t} i={i} label={o} />)}>
        {children}
      </X_Answer>
      {t.wrong && <Nope key={t.miss}>60°-এ ১ মিটার লাঠির ছায়া কত ছিল? দুইটা length-এর সাথে সেটাও গুণ হবে।</Nope>}
      <Task done={t.won}>একটা উত্তর বেছে নিন। তারপর দেখুন সেই হিসাব কোথায় থামে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9✓ · 4.4's opening review: v lies flat, w = (2, 3); how long is w's shadow
//      on v? 3 lays w's height on the floor, 3.61 swings w down flat, 2 is
//      the sun's line from w's tip. The sun's line settles every pick.

const FFS = makeFrame(-0.5, 4.3, -0.5, 3.6, 32);
const FS_OPTS = ["3", "প্রায় 3.61, w-এর পুরো length", "2"];
const FS_LEN = [3, Math.sqrt(13), 2];
const FS_RIGHT = 2;

export function FlatShadow({ children }: { children?: ReactNode }) {
  const t = useTry(FS_RIGHT, 3, "শোয়ানো v-এর ওপর ছায়া w-এর প্রথম সংখ্যা।");
  const f = FFS;
  const swing = t.pick === 1 && t.k >= 1;
  const [deg] = useTween([swing ? 0 : Math.atan2(3, 2) / RAD], 700);
  const R = Math.sqrt(13);
  const wAt: XY = [R * Math.cos(deg * RAD), R * Math.sin(deg * RAD)];
  const L = t.pick === null ? 0 : FS_LEN[t.pick];
  const drop = t.pick === 2 ? t.k >= 1 : t.pick !== null && t.k >= 3;
  return (
    <>
      <X_Ask>v মেঝেতে শোয়ানো, সোজা ডান দিকে। w = (2, 3)। রোদ পড়ছে মাথার ওপর থেকে। v-এর ওপর w-এর ছায়া কত লম্বা?</X_Ask>
      <S_Sheet max="mt-2 max-w-[11.5rem]">
        <Plane f={f} ticks={1} label="মেঝেতে শোয়ানো v আর w (2, 3); বেছে নেওয়া ছায়া v-এর ওপর, রোদের দাগ w-এর মাথা থেকে সোজা নিচে" className="my-0! max-w-none">
          <circle cx={f.sx(3.8)} cy={f.sy(3.2)} r={7} className="pointer-events-none fill-[#fbbf24]" />
          {t.pick === 0 && t.k >= 1 && <S_Bar f={f} from={[2, 0]} to={[2, 3]} tone="tape" w={6} />}
          {t.pick !== null && t.k >= 2 && <Draw key={t.miss} d={floorPath(f, 0, L)} strokeWidth={7} ms={500} className={t.wrong ? "stroke-danger/60" : "stroke-[#0f1b2d]/60"} />}
          {drop && <S_Drop f={f} from={V} to={[2, 0]} />}
          {t.wrong && <X_Gap f={f} a={2} b={L} />}
          {t.hit && <S_Square f={f} at={[2, 0]} a={[0, 1]} b={[1, 0]} s={0.22} />}
          <Arrow f={f} from={O} to={[4, 0]} tone="blue" w={2.4} />
          {swing && <Arrow f={f} from={O} to={V} tone="coral" w={2} faint />}
          <Arrow f={f} from={O} to={wAt} tone="coral" w={2.4} />
          <Label f={f} at={[4, 0]} dy={-6} size={10} className="fill-cat-blue">
            v
          </Label>
          <Label f={f} at={wAt} dx={swing ? -16 : 6} dy={swing ? -8 : 2} anchor="start" size={10} className="fill-cat-coral">
            w
          </Label>
        </Plane>
      </S_Sheet>
      <X_Answer t={t} cols="grid-cols-3" picks={FS_OPTS.map((o, i) => <X_Pick key={o} t={t} i={i} label={o} />)}>
        {children}
      </X_Answer>
      {t.wrong && <Nope key={t.miss}>shadow মানে w-কে ঘুরিয়ে শুইয়ে দেওয়া না। w-এর মাথা থেকে সোজা নিচে দাগ নামান। মেঝের কোথায় পড়লো?</Nope>}
      <Task done={t.won}>একটা উত্তর বেছে নিন, তারপর দেখুন রোদের দাগ কোথায় পড়ে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9⅓✓ · The review after AlwaysBet: Shiku's remote, to (2, 3). Each pick
//       presses its buttons one by one and Shiku walks them; only e₁ twice,
//       e₂ three times lands on the star.

const FRP = makeFrame(-0.5, 5.5, -0.5, 3.5, 28);
const RP_PRESS: XY[] = [
  [3, 2],
  [2, 3],
  [5, 0],
];
const RP_OPTS = ["e₁ তিনবার, e₂ দুইবার", "e₁ দুইবার, e₂ তিনবার", "e₁ পাঁচবার"];
const RP_RIGHT = 1;
const RP_GOAL: XY = [2, 3];

/** The remote's presses as a row of buttons; the first `on` are lit. */
function X_Keys({ n, on = 99 }: { n: XY; on?: number }) {
  const keys = [...Array<number>(n[0]).fill(0), ...Array<number>(n[1]).fill(1)];
  return (
    <span className="flex shrink-0 gap-0.5">
      {keys.map((e, i) => (
        <span
          key={i}
          className={`rounded-md px-1 py-0.5 font-mono text-[0.7rem] font-bold transition-colors duration-200 motion-reduce:transition-none ${
            i < on ? (e === 0 ? "bg-cat-teal text-white" : "bg-cat-violet text-white") : e === 0 ? "bg-cat-teal/15 text-cat-teal" : "bg-cat-violet/15 text-cat-violet"
          }`}
        >
          e{e === 0 ? "₁" : "₂"}
        </span>
      ))}
    </span>
  );
}

export function RemotePress({ children }: { children?: ReactNode }) {
  const t = useTry(RP_RIGHT, 5, "(2, 3) মানে 2·e₁ + 3·e₂।", 380);
  const f = FRP;
  const press = t.pick === null ? null : RP_PRESS[t.pick];
  const path = press ? route(O, press) : [O];
  const i = Math.min(t.k, path.length - 1);
  const end = path[path.length - 1];
  return (
    <>
      <X_Ask>Shiku-র remote-এ (2, 3)-এ যেতে কোন button কতবার চাপতে হয়?</X_Ask>
      <S_Sheet max="mt-2 max-w-[12.5rem]">
        <Plane f={f} ticks={1} label="Shiku remote-এর button চেপে হাঁটে; তারা (2, 3)-এ" className="my-0! max-w-none">
          <Star f={f} at={RP_GOAL} done={t.hit} />
          <Trail f={f} cells={path.slice(0, i + 1)} />
          <Shiku f={f} at={path[i]} />
        </Plane>
      </S_Sheet>
      <div className="mt-1 flex min-h-7 items-center justify-center gap-2 text-sm">
        {press && (
          <>
            <span className="text-muted">remote:</span>
            <X_Keys n={press} on={t.k} />
          </>
        )}
      </div>
      <X_Answer
        t={t}
        cols="grid-cols-1"
        picks={RP_OPTS.map((o, j) => (
          <X_Pick key={o} t={t} i={j} label={o} row>
            <X_Keys n={RP_PRESS[j]} />
          </X_Pick>
        ))}
      >
        {children}
      </X_Answer>
      {t.wrong && <Nope key={t.miss}>Shiku থামলো {tupN(end)}-এ। e₁ মানে ডান দিক বরাবর এক পা।</Nope>}
      <Task done={t.won}>একটা button-এর সারি বেছে নিন, Shiku হেঁটে দেখাবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11✓ · The review after screen 7: three slots, nine pieces; how many are
//       left? The pick lights the pieces it keeps; each piece shows its
//       two axes, the crossed ones fade (no shadow) and drop out, and the
//       survivors close up into one row. No 0/1 values or formula here:
//       those are ThreeSlots' job in the <Then> that follows.

const NT_OPTS = ["নয়টাই", "ছয়টা", "তিনটা"];
const NT_N = [9, 6, 3];
const NT_RIGHT = 2;
const NT_E = ["e₁", "e₂", "e₃"];

export function NineToThree() {
  const t = useTry(NT_RIGHT, 3, "টিকে থাকে শুধু একই axis-এর জোড়া।", 700);
  const mine = (i: number, j: number) => t.pick !== null && t.k >= 1 && (t.pick === 0 || (t.pick === 1 ? i !== j : i === j));
  return (
    <>
      <X_Ask>তিন ঘরের দুইটা vector। মামার হিসাব ভেঙে নয়টা টুকরা। কয়টা টিকে থাকবে, বলুন তো?</X_Ask>
      <div className="mx-auto mt-2 flex w-full max-w-[14rem] flex-wrap justify-center gap-1">
        {NT_E.flatMap((r, i) =>
          NT_E.map((c, j) => {
            const same = i === j;
            // past beat 2 the crossed pieces are gone and the survivors close up into one row
            if (!same && t.k >= 3) return null;
            const fading = !same && t.k >= 2;
            const my = mine(i, j);
            return (
              <span
                key={`${r}${c}`}
                className={`grid w-[4.3rem] justify-items-center rounded-lg border-2 px-0.5 py-0.5 font-mono text-[0.7rem] transition-[color,background-color,border-color,opacity,scale] duration-500 motion-reduce:transition-none ${
                  fading ? `scale-75 opacity-40 ${my ? "border-danger/60 bg-danger/5" : "border-border"}` : same && t.k >= 2 ? "border-accent bg-accent/10" : my ? "border-cat-blue bg-cat-blue/10" : "border-border"
                }`}
              >
                {r}·{c}
                {t.k >= 2 && <span className={`${FADE} mt-0.5 rounded bg-white px-0.5`}><PairIcon same={same} /></span>}
              </span>
            );
          }),
        )}
      </div>
      <div className="mt-1 min-h-6 text-center text-sm">
        {t.k >= 3 && t.pick !== null && (
          <span key={t.miss} className={`${FADE} ${t.wrong ? "text-danger" : ""}`}>
            টিকে থাকলো <b className="font-mono">3</b>টা, আপনার উত্তর <b className="font-mono">{NT_N[t.pick]}</b>টা।
          </span>
        )}
      </div>
      <X_Answer
        t={t}
        cols="grid-cols-3"
        picks={NT_OPTS.map((o, i) => (
          <X_Pick key={o} t={t} i={i} label={o}>
            <span className="flex max-w-[3.2rem] flex-wrap justify-center gap-1 py-0.5">
              {Array.from({ length: NT_N[i] }, (_, d) => (
                <span key={d} className="size-1.5 rounded-full bg-current" />
              ))}
            </span>
          </X_Pick>
        ))}
      />
      {t.wrong && <Nope key={t.miss}>কোন টুকরাগুলো মুছে যায়? যেখানে দুইটা আলাদা axis।</Nope>}
      <Task done={t.won}>একটা উত্তর বেছে নিন, তারপর দেখুন কোন টুকরা মুছে যায়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11½✓ · The review before screen 8: 4.2's road (4, 3) and মামী's push
//        (−3, 4). The pick sends a dashed van where it says (far ahead for
//        25, a little back for −5, nowhere for 0); the box runs; the real
//        van never moved, and the dashed one comes back to it.

const MR_PUSH: XY = [-3, 4];
const MR_OPTS = ["25, মানে পুরো ধাক্কাটাই কাজে লেগেছিল", "−5, মানে উল্টো দিকে ঠেলছিলেন", "0, মানে রাস্তার সাথে ৯০ degree কোণে"];
const MR_GO = [2.6, -0.9, 0];
const MR_RIGHT = 2;

export function MamiRoad({ children }: { children?: ReactNode }) {
  const t = useTry(MR_RIGHT, 3, "−12 + 12 = 0, মানে ৯০ degree কোণ।", 650);
  const f = FVAN;
  const go = t.pick === null ? 0 : MR_GO[t.pick];
  return (
    <>
      <X_Ask>৪.২-এর রাস্তা মনে আছে তো? রাস্তা (4, 3), মামী ঠেলছিলেন (−3, 4) দিক থেকে। Dot product এ কত এসেছিল? আর তার মানে কী?</X_Ask>
      <div className="mt-2 flex items-center gap-3">
        <S_Sheet max="max-w-[9.5rem]">
          <Plane f={f} label="৪.২-এর রাস্তা (4, 3) আর মামীর ধাক্কা (−3, 4); বেছে নেওয়া উত্তর ভ্যানকে যেখানে পাঠায়" className="my-0! max-w-none">
            <X_Road />
            <Arrow f={f} from={O} to={VAN_ROAD} tone="teal" w={2.4} />
            <X_Van at={0} />
            {t.pick !== null && t.k >= 1 && go !== 0 && <X_Van ghost at={t.k >= 3 ? 0 : go} />}
            <Arrow f={f} from={O} to={MR_PUSH} tone="violet" w={2.4} />
            <Label f={f} at={[-1.5, 2]} dx={7} dy={2} anchor="start" size={9} className="fill-cat-violet">
              মামী
            </Label>
            {t.hit && <S_Square f={f} at={O} a={VAN_ROAD} b={MR_PUSH} s={0.7} />}
          </Plane>
        </S_Sheet>
        <div className="grid min-w-0 flex-1 gap-1 text-sm">
          {t.pick !== null && t.k >= 2 && (
            <span key={t.miss} className={FADE}>
              dot product: <BoxRun a={VAN_ROAD} b={MR_PUSH} k={t.k >= 3 ? 3 : 2} inline />
            </span>
          )}
          {t.k >= 3 && t.pick !== null && <span className={`${FADE} text-xs text-muted`}>ভ্যান এক চুলও নড়েনি।</span>}
        </div>
      </div>
      <X_Answer
        t={t}
        cols="grid-cols-1"
        picks={MR_OPTS.map((o, i) => (
          <X_Pick key={o} t={t} i={i} label={o} row>
            <X_Card w={64} h={30}>
              <rect x={24} y={11} width={16} height={9} rx={2} fill="#92400e" />
              {i === 0 && <X_Mini x1={42} y1={15} x2={60} y2={15} c={X_CORAL} />}
              {i === 1 && <X_Mini x1={22} y1={15} x2={12} y2={15} c={X_CORAL} />}
            </X_Card>
          </X_Pick>
        ))}
      >
        {children}
      </X_Answer>
      {t.wrong && <Nope key={t.miss}>4 × (−3) + 3 × 4। আর মামীর ধাক্কায় ভ্যান কি এক চুলও এগিয়েছিল?</Nope>}
      <Task done={t.won}>একটা উত্তর বেছে নিন, ভ্যান কী করে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 12✓ · 4.4's last review: v = (1, 0), w = (0, 4). The box runs 1 × 0 +
//       0 × 4; then মামা's shadow: w's tip drops straight onto v's line at
//       the corner, a point. "মামা 4" first swings w flat (the angle left
//       out), and the dropped line still lands on the point.

const FNB = makeFrame(-0.6, 4.5, -0.5, 4.5, 26);
const NB_V: XY = [1, 0];
const NB_W: XY = [0, 4];
const NB_OPTS = ["দুইটাই 0", "dot product 0, কিন্তু মামার হিসাব 4", "dot product 4, মামার হিসাব 0"];
const NB_SAY: XY[] = [
  [0, 0],
  [0, 4],
  [4, 0],
];
const NB_RIGHT = 0;

function X_Verdict({ ok, said }: { ok: boolean; said: number }) {
  return (
    <span className={`${FADE} ml-1 inline-flex items-center gap-0.5 text-xs ${ok ? "text-accent-text" : "text-danger"}`}>
      {ok ? <S_Tick /> : null}আপনি {said}
    </span>
  );
}

export function NinetyBoth({ children }: { children?: ReactNode }) {
  const t = useTry(NB_RIGHT, 3, undefined, 650);
  const f = FNB;
  const said = t.pick === null ? null : NB_SAY[t.pick];
  const swing = t.pick === 1 && t.k >= 2;
  const [deg] = useTween([swing ? 0 : 90], 700);
  const wAt: XY = [4 * Math.cos(deg * RAD), 4 * Math.sin(deg * RAD)];
  const drop = t.pick !== null && (t.pick === 1 ? t.k >= 3 : t.k >= 2);
  return (
    <>
      <X_Ask>v = (1, 0) আর w = (0, 4)। Dot product আর মামার হিসাব কী বলবে?</X_Ask>
      <div className="mt-2 flex items-center gap-3">
        <S_Sheet max="max-w-[8rem]">
          <Plane f={f} ticks={1} label="v (1, 0) আর w (0, 4), মাঝে 90°; w-এর মাথা থেকে সোজা নিচে দাগ পড়ে কোণের বিন্দুতে" className="my-0! max-w-none">
            {!swing && <S_Square f={f} at={O} a={NB_V} b={NB_W} s={0.45} />}
            {swing && <S_Bar f={f} to={[4, 0]} tone="coral" w={7} />}
            {drop && <S_Drop f={f} from={NB_W} to={O} />}
            {drop && <circle cx={f.sx(0)} cy={f.sy(0)} r={5} className={`${POP} fill-[#0f1b2d]`} />}
            {swing && <Arrow f={f} from={O} to={NB_W} tone="coral" w={2} faint />}
            <Arrow f={f} from={O} to={wAt} tone="coral" w={2.4} />
            <Arrow f={f} from={O} to={NB_V} tone="blue" w={2.8} />
          </Plane>
        </S_Sheet>
        <div className="grid min-w-0 flex-1 gap-2 text-sm">
          <div className="min-h-10">
            <div className="text-xs font-semibold text-muted">dot product</div>
            {said && t.k >= 1 && (
              <span key={t.miss} className={FADE}>
                <BoxRun a={NB_V} b={NB_W} k={3} inline />
                <X_Verdict ok={said[0] === 0} said={said[0]} />
              </span>
            )}
          </div>
          <div className="min-h-10">
            <div className="text-xs font-semibold text-muted">মামা</div>
            {said && t.k >= 3 && (
              <span key={t.miss} className={FADE}>
                <span className="font-mono">1 × 4 × 0 = 0</span>
                <X_Verdict ok={said[1] === 0} said={said[1]} />
              </span>
            )}
            {t.pick === 1 && t.k === 2 && <span className={`${FADE} font-mono text-danger`}>1 × 4 = 4 ?</span>}
          </div>
        </div>
      </div>
      <X_Answer t={t} cols="grid-cols-3" picks={NB_OPTS.map((o, i) => <X_Pick key={o} t={t} i={i} label={o} />)}>
        {children}
      </X_Answer>
      {t.wrong && <Nope key={t.miss}>একটা পূর্বে, আরেকটা খাড়া উত্তরে। কোণ কত? আর সেই কোণে লাঠির ছায়া কত?</Nope>}
      <Task done={t.won}>একটা উত্তর বেছে নিন, তারপর দেখুন দুই হিসাব কী বলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2⅞ · A figure for the explanation after 2✓, no task: the calculator does
//      the rest. A 1 m stick at 30°; cos 30 typed into a calculator gives
//      0.866; the stick's shadow is that same 0.87 m.

const X2C_SAY = ["১ মিটার লাঠি, 30° কোণে।", "ক্যালকুলেটরে লিখলাম cos 30।", "উত্তর 0.866, মানে প্রায় 0.87।", "লাঠির ছায়াও ঠিক 0.87 মিটার।"];
const X2C_KEYS = [
  ["cos", "7", "8", "9"],
  ["sin", "4", "5", "6"],
  ["tan", "1", "2", "3"],
  ["0", ".", "=", "×"],
];

export function CalcCos() {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const lit = (key: string) => (k === 1 && (key === "cos" || key === "3" || key === "0")) || (k === 2 && key === "=");
  const tip = [18 + 100 * Math.cos(30 * RAD), 96 - 100 * Math.sin(30 * RAD)];
  return (
    <Scene scene={s} caption={say(X2C_SAY, k)}>
      <svg viewBox="0 0 256 112" role="img" aria-label="১ মিটার লাঠি 30° কোণে, ক্যালকুলেটরে cos 30 = 0.866, আর লাঠির ছায়া 0.87 মিটার" className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect x={0.5} y={0.5} width={150} height={111} rx={8} fill="white" stroke="#cbd5e1" />
        <circle cx={132} cy={16} r={7} fill="#fbbf24" />
        <path d="M8 96H144" stroke="#94a3b8" strokeWidth={1.2} />
        {k >= 3 && <path d={`M18 96H${tip[0]}`} stroke="#475569" strokeOpacity={0.65} strokeWidth={7} strokeLinecap="round" className={FADE} />}
        {k >= 3 && <path d={`M${tip[0]} ${tip[1]}V96`} stroke="#d97706" strokeWidth={1.2} strokeDasharray="4 3" className={FADE} />}
        <path d={`M18 96L${tip[0]} ${tip[1]}`} stroke="#92400e" strokeWidth={5} strokeLinecap="round" />
        <path d={`M40 96A22 22 0 0 0 ${18 + 22 * Math.cos(30 * RAD)} ${96 - 22 * Math.sin(30 * RAD)}`} fill="none" stroke={S_INK} strokeOpacity={0.6} strokeWidth={1.2} />
        <text x={50} y={91} fontSize={8.5} fontWeight={600} fontFamily="ui-monospace, monospace" fill={S_INK}>
          30°
        </text>
        <text x={56} y={62} textAnchor="end" fontSize={9} fill="#92400e">
          ১ মিটার
        </text>
        {k >= 3 && (
          <text x={61} y={108} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill={S_INK} className={FADE}>
            0.87
          </text>
        )}
        <rect x={170} y={4} width={80} height={104} rx={9} fill="#1f2937" />
        <rect x={177} y={11} width={66} height={24} rx={3} fill="#d9f99d" />
        {k >= 1 && (
          <text key={k >= 2 ? "a" : "q"} x={239} y={k >= 2 ? 20 : 27} textAnchor="end" fontSize={k >= 2 ? 6.5 : 9.5} fontFamily="ui-monospace, monospace" fill="#1a2e05" className={FADE}>
            cos 30
          </text>
        )}
        {k >= 2 && (
          <text x={239} y={32} textAnchor="end" fontSize={10.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1a2e05" className={FADE}>
            0.866
          </text>
        )}
        {X2C_KEYS.map((row, r) =>
          row.map((key, c) => (
            <g key={key}>
              <rect x={177 + c * 17} y={42 + r * 16} width={14} height={12} rx={2.5} className="transition-[fill] duration-300 motion-reduce:transition-none" fill={lit(key) ? "#f59e0b" : "#4b5563"} />
              <text x={184 + c * 17} y={50.5 + r * 16} textAnchor="middle" fontSize={key.length > 1 ? 5.5 : 7} fontFamily="ui-monospace, monospace" fill="white">
                {key}
              </text>
            </g>
          )),
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for AlwaysBet's explanation, no task: two matches, and
//      then pairs without end, too many to measure; "always" needs a why;
//      and the search starts with Shiku's remote, e₁ and e₂.

const X9P_SAY = [
  "দুইটা জোড়ায় মিলেছে, এটুকু সত্যি।",
  "কিন্তু arrow-এর জোড়া তো অসংখ্য।",
  "সব তো আর মেপে দেখা সম্ভব না।",
  "“সবসময়” মানবো তখনই, যখন জানবো কেন মেলে।",
  "খোঁজ শুরু Shiku-র remote-এর দুইটা button দিয়ে।",
];
/** fan pairs from one corner: two angles (degrees) and two lengths (px) */
const X9P_FAN: [number, number, number, number][] = [
  [12, 70, 52, 40],
  [40, 118, 44, 56],
  [160, 96, 50, 38],
  [58, 24, 30, 58],
  [140, 34, 42, 30],
  [100, 170, 56, 44],
  [26, 150, 36, 48],
  [84, 48, 60, 34],
];
const X9P_MORE: [number, number, number, number][] = [
  [5, 130, 40, 30],
  [66, 176, 26, 50],
  [110, 20, 46, 54],
  [150, 76, 34, 58],
  [30, 92, 58, 26],
  [124, 60, 28, 40],
  [174, 44, 44, 36],
  [48, 160, 54, 30],
];
const X9P_O = [130, 100];

function X9P_Pair({ p, delay, faint }: { p: [number, number, number, number]; delay: number; faint?: boolean }) {
  const end = (deg: number, l: number): [number, number] => [X9P_O[0] + l * Math.cos(deg * RAD), X9P_O[1] - l * Math.sin(deg * RAD)];
  const [a, b] = [end(p[0], p[2]), end(p[1], p[3])];
  return (
    <g opacity={faint ? 0.45 : 1}>
      <Draw d={`M${X9P_O[0]} ${X9P_O[1]}L${a[0]} ${a[1]}`} delay={delay} ms={400} strokeWidth={1.4} className="stroke-cat-blue" />
      <Draw d={`M${X9P_O[0]} ${X9P_O[1]}L${b[0]} ${b[1]}`} delay={delay + 120} ms={400} strokeWidth={1.4} className="stroke-cat-coral" />
    </g>
  );
}

export function EndlessPairs() {
  const s = useScene(4, [600, 1600, 1800, 2400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X9P_SAY, k)}>
      <svg viewBox="0 0 260 112" role="img" aria-label="দুইটা মিলে যাওয়া জোড়া, তারপর অসংখ্য জোড়া, আর শেষে Shiku-র remote-এর দুইটা button e₁ আর e₂" className="mx-auto block h-auto w-full max-w-[16.5rem]">
        <rect x={0.5} y={0.5} width={259} height={111} rx={8} fill="white" stroke="#cbd5e1" />
        {[
          { y: 8, v: [16, 0], w: [24, -24] },
          { y: 58, v: [16, -24], w: [16, -8] },
        ].map((c, i) => (
          <g key={i}>
            <rect x={6} y={c.y} width={50} height={44} rx={6} fill="#f0fdf4" stroke="#86efac" />
            <X_Mini x1={14} y1={c.y + 38} x2={14 + c.v[0]} y2={c.y + 38 + c.v[1]} c={X_BLUE} w={1.6} />
            <X_Mini x1={14} y1={c.y + 38} x2={14 + c.w[0]} y2={c.y + 38 + c.w[1]} c={X_CORAL} w={1.6} />
            <path d={`M42 ${c.y + 9}l3 3 6 -6`} fill="none" stroke="#15803d" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        <g className="transition-opacity duration-700 motion-reduce:transition-none" opacity={k >= 3 ? 0.25 : 1}>
          {k >= 1 && X9P_FAN.map((p, i) => <X9P_Pair key={i} p={p} delay={i * 140} />)}
          {k >= 2 && X9P_MORE.map((p, i) => <X9P_Pair key={`m${i}`} p={p} delay={i * 90} faint />)}
          {k >= 1 && (
            <text x={200} y={20} textAnchor="middle" fontSize={16} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#94a3b8" className={FADE}>
              ?
            </text>
          )}
        </g>
        {k === 3 && (
          <g className={POP}>
            <rect x={96} y={38} width={68} height={20} rx={10} fill="#fef3c7" />
            <text x={130} y={52} textAnchor="middle" fontSize={10} fontWeight={700} fill="#92400e">
              কেন মেলে?
            </text>
          </g>
        )}
        {k >= 4 && (
          <g className={FADE}>
            <X_Mini x1={X9P_O[0]} y1={X9P_O[1]} x2={X9P_O[0] + 34} y2={X9P_O[1]} c={X_TEAL} w={2.6} />
            <X_Mini x1={X9P_O[0]} y1={X9P_O[1]} x2={X9P_O[0]} y2={X9P_O[1] - 34} c={X_TEAL} w={2.6} />
            <text x={X9P_O[0] + 36} y={X9P_O[1] - 4} fontSize={9} fontWeight={700} fill={X_TEAL}>
              e₁
            </text>
            <text x={X9P_O[0] + 5} y={X9P_O[1] - 32} fontSize={9} fontWeight={700} fill={X_TEAL}>
              e₂
            </text>
            <rect x={214} y={32} width={36} height={70} rx={8} fill="#374151" />
            <circle cx={232} cy={54} r={10} fill={X_TEAL} />
            <circle cx={232} cy={82} r={10} fill="#7c3aed" />
            <text x={232} y={57.5} textAnchor="middle" fontSize={9} fontWeight={800} fill="white">
              e₁
            </text>
            <text x={232} y={85.5} textAnchor="middle" fontSize={9} fontWeight={800} fill="white">
              e₂
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11¾ · A figure for ShadowRules' explanation, second paragraph, no task:
//       times minus, the shadow falls behind; then an arrow broken into
//       three pieces, each piece's shadow, and the pieces' shadows added
//       are the whole shadow, not a hair off.

const FMP = makeFrame(-3.1, 3.3, -1.9, 2.1, 30);
/** the pieces stage, closer in */
const FMP2 = makeFrame(-0.3, 2.4, -0.8, 1.9, 50);
const X11M_A: XY = [2, 1.5];
const X11M_PIECES: XY[] = [
  [0.8, 0.9],
  [0.9, -0.3],
  [0.3, 0.9],
];
const X11M_TONE = ["blue", "coral", "amber"] as const;
const X11M_BAR = ["blue", "coral", "tape"] as const;
const X11M_SAY = [
  "একটা arrow, আর লাইনের ওপর তার ছায়া।",
  "Minus দিয়ে গুণ করলে arrow উল্টো দিকে, ছায়াও পড়লো পেছনে।",
  "এবার arrow-টাকে তিন টুকরা করি।",
  "প্রতিটা টুকরার ছায়া আলাদা করে।",
  "টুকরাগুলোর ছায়া যোগ করলে পুরো ছায়াটাই। এক চুলও নড়লো না।",
];

export function MinusPieces() {
  const s = useScene(4, [600, 2200, 1800, 2000, 2400]);
  const k = s.k;
  const pieces = k >= 2;
  const f = pieces ? FMP2 : FMP;
  const starts: XY[] = [O];
  for (const p of X11M_PIECES) starts.push([starts[starts.length - 1][0] + p[0], starts[starts.length - 1][1] + p[1]]);
  return (
    <Scene scene={s} caption={say(X11M_SAY, k)}>
      <S_Sheet max={pieces ? "max-w-[10rem]" : "max-w-[14rem]"}>
        <Plane key={pieces ? "p" : "m"} f={f} grid={0} axes={false} label="একটা arrow আর তার ছায়া; minus দিলে ছায়া পেছনে; টুকরাগুলোর ছায়া যোগ করলে পুরো ছায়া" className="my-0! max-w-none">
          <path d={floorPath(f, pieces ? -0.3 : -3, pieces ? 2.4 : 3.2)} strokeWidth={1.5} className="stroke-[#0f1b2d]/50" />
          {!pieces && (
            <>
              <S_Bar f={f} to={[2, 0]} />
              <S_Drop f={f} from={X11M_A} to={[2, 0]} />
              <Arrow f={f} from={O} to={X11M_A} tone="blue" w={2.6} />
              {k >= 1 && (
                <>
                  <S_Bar f={f} to={[-2, 0]} tone="danger" />
                  <S_Drop f={f} from={[-2, -1.5]} to={[-2, 0]} />
                  <Arrow f={f} from={O} to={[-2, -1.5]} tone="coral" w={2.6} draw />
                  <Label f={f} at={[-2, -1.5]} dx={-4} dy={4} anchor="end" size={9} className={`${FADE} fill-cat-coral`}>
                    −1 ×
                  </Label>
                </>
              )}
            </>
          )}
          {pieces && (
            <>
              <Arrow f={f} from={O} to={X11M_A} tone="ink" w={1.6} faint />
              {k >= 4 && <S_Bar f={f} from={[0, -0.55]} to={[2, -0.55]} w={7} />}
              {X11M_PIECES.map((p, i) => {
                const a = starts[i];
                const b = starts[i + 1];
                return (
                  <g key={i}>
                    {k >= 3 && <S_Bar f={f} from={[a[0], -0.2]} to={[b[0], -0.2]} tone={X11M_BAR[i]} w={6} />}
                    {k >= 3 && <S_Drop f={f} from={b} to={[b[0], 0]} />}
                    <Arrow f={f} from={a} to={b} tone={X11M_TONE[i]} w={2.4} draw delay={i * 300} />
                  </g>
                );
              })}
            </>
          )}
        </Plane>
      </S_Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11⅞ · A figure for NoCrossTalk's explanation, no task: why two of the
//       four cells go. e₁ and e₂ at 90°: e₂'s tip drops onto e₁'s line at
//       the corner, a point, like the upright stick; e₁ on itself casts its
//       whole length, 1, and so does e₂.

const FCZ = makeFrame(-0.4, 1.6, -0.4, 1.5, 56);
const X11C_SAY = [
  "e₁ আর e₂: দুইটাই 1 লম্বা, মাঝে ৯০ degree।",
  "e₁-এর ওপর e₂-এর ছায়া: খাড়া কঞ্চির মতো একটা বিন্দু। 0।",
  "e₁ নিজের ওপর: পুরো ছায়া, 1।",
  "e₂-ও নিজের ওপর 1। তাই টিকে থাকে শুধু 2\u00a0×\u00a02 আর 3\u00a0×\u00a01।",
];

export function CrossedZero() {
  const s = useScene(3, [600, 2400, 1800, 2600]);
  const k = s.k;
  const f = FCZ;
  const rows: [string, string, boolean][] = [
    ["e₁ · e₂", "0", k >= 1],
    ["e₁ · e₁", "1", k >= 2],
    ["e₂ · e₂", "1", k >= 3],
  ];
  return (
    <Scene scene={s} caption={say(X11C_SAY, k)}>
      <div className="mx-auto flex max-w-xs items-center gap-3">
        <S_Sheet max="max-w-[8rem]">
          <Plane f={f} grid={0.5} axes={false} label="e₁ আর e₂ ৯০ degree কোণে; e₁-এর ওপর e₂-এর ছায়া একটা বিন্দু, নিজের ওপর প্রতিটার ছায়া 1" className="my-0! max-w-none">
            <S_Square f={f} at={O} a={[1, 0]} b={[0, 1]} s={0.18} />
            {k === 1 && <S_Drop f={f} from={[0, 1]} to={O} />}
            {k >= 1 && <circle cx={f.sx(0)} cy={f.sy(0)} r={4.5} className={`${POP} fill-[#0f1b2d]`} />}
            {k >= 2 && <S_Bar f={f} from={[0, -0.12]} to={[1, -0.12]} w={6} />}
            {k >= 3 && <S_Bar f={f} from={[-0.12, 0]} to={[-0.12, 1]} w={6} />}
            <Arrow f={f} from={O} to={[1, 0]} tone="teal" w={2.6} />
            <Arrow f={f} from={O} to={[0, 1]} tone="teal" w={2.6} />
            <Label f={f} at={[1, 0]} dx={2} dy={-7} size={10} className="fill-cat-teal">
              e₁
            </Label>
            <Label f={f} at={[0, 1]} dx={8} dy={4} anchor="start" size={10} className="fill-cat-teal">
              e₂
            </Label>
          </Plane>
        </S_Sheet>
        <div className="grid min-w-0 flex-1 gap-1 text-sm">
          {rows.map(([name, n, on]) => (
            <div key={name} className={`flex items-baseline justify-between gap-1 font-mono transition-opacity duration-500 motion-reduce:transition-none ${on ? "" : "opacity-30"}`}>
              <span>{name}</span>
              <b>{on ? n : "?"}</b>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5⅞b · A story scene for 4.3's ending, no task: মামা's tape and চাঁদা give
//       7.0, and ফাহিমের box gives 7. The bet from screen 1 is settled.

export function MamaSeven({}: Story) {
  const s = useScene(3, [600, 1800, 1600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ছাদে মামা ফিতা আর চাঁদা দিয়ে মাপলেন, 3.61 × 2.24 × 0.868 = 7.0; ফাহিমের box খুললো, সেখানেও 7">
        <S_Roof />
        <S_Chalk x={150} y={174} arrows={[V, W]} names={["v", "w"]} u={12} squash={0.5} />
        <Person who="mama" x={112} y={SG} arm={k >= 1 ? "hold" : "down"} mood={k >= 3 ? "smug" : "plain"} label />
        {k >= 1 && (
          <>
            <g className={POP}>
              <g transform={`translate(131 ${SG - 46})`}>
                <S_Tape />
              </g>
            </g>
            <g className={POP}>
              <g transform={`translate(146 ${SG - 38})`}>
                <S_Protractor />
              </g>
            </g>
            <CastCard x={112} y={SG - 100} text="3.61 × 2.24 × 0.868" tone="blue" />
          </>
        )}
        {k >= 2 && <CastCard x={112} y={SG - 78} text="7.0" tone="amber" />}
        <S_Box x={222} open={k >= 3} />
        {k >= 3 && <CastCard x={222} y={SG - 44} text="7" tone="amber" />}
        <Person who="fahim" x={276} y={SG} facing={-1} mood={k >= 3 ? "happy" : "plain"} label />
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
  ArrowShadow: { start: {}, way: { way: 1 }, up: { way: 1, w: [0, 3], hit: [3] }, flat: { way: 1, w: [-2, 0], hit: [3, 0] }, back: { way: 1, w: [-2, 2], hit: [3, 0, -2] } },
  TwoTests: { start: {}, one: { k: 4 }, two: { round: 1, k: 4 } },
  AxisShadow: { start: {}, x: { lit: [0], on: [0] }, both: { lit: [0, 1], on: [0, 1] } },
  NoCrossTalk: { start: {}, some: { open: [0, 1] }, all: { open: [0, 1, 2, 3] } },
  YourPair: { start: {}, miss: { done: 1, miss: 1 }, measure: { tried: 0, miss: 1 }, back: { done: 1, tried: 2 }, all: { done: 3 } },
  AlwaysBet: { start: {}, bet: { bet: 0 } },
  TiltedAxes: { start: {}, tilt: { at: 1, seen: [0, 1] }, all: { at: 3, seen: [0, 1, 2, 3] } },
  ShadowRules: { start: {}, walk: { k: 3 }, back: { round: 1, m: -1, seen: [1, 2, 3, -1] } },
  MamiDoubt: { start: { k: 0 }, mami: { k: 1 }, mama: { k: 2 }, done: {} },
  RoofNoon: { start: { k: 0 }, seven: { k: 3 }, claim: { k: 4 }, done: {} },
  RecipeSlots: { start: { k: 0 }, tape: { k: 1 }, angle: { k: 3 }, done: {} },
  StickOnRoof: { start: { k: 0 }, rays: { k: 2 }, done: {} },
  TwoSticks: { one: { k: 1 }, ratio: { k: 3 }, done: {} },
  CosTriangle: { start: { k: 0 }, tri: { k: 2 }, done: {} },
  HalfTurn: { start: { k: 0 }, up: { k: 1, stepping: true }, done: {} },
  VanTable: { start: { k: 0 }, two: { k: 2 }, done: {} },
  StickToArrow: { start: { k: 0 }, arrows: { k: 2 }, done: {} },
  TorchDrop: { dark: { k: 0 }, on: { k: 1 }, steep: { k: 4 }, done: {} },
  RotateVsDrop: { rot: { k: 1 }, steep: { k: 2 }, done: {} },
  FirstNumber: { start: { k: 0 }, done: {} },
  MamaRecipe: { start: { k: 0 }, tape: { k: 1 }, shadow: { k: 2 }, done: {} },
  RecipeBuild: { start: { k: 0 }, rule: { k: 2 }, shadow: { k: 3 }, done: {} },
  LengthTimesShadow: { first: { k: 2 }, bet: { k: 3 }, done: {} },
  TurnPaper: { start: { k: 0 }, drop: { k: 2 }, done: {} },
  RoadDebt: { start: { k: 0 }, done: {} },
  NotYetProof: { start: { k: 0 }, more: { k: 1 }, done: {} },
  WalkIsShadow: { walk: { k: 2 }, done: {} },
  TiltedAddress: { start: { k: 0 }, turned: { k: 1 }, done: {} },
  DataAxes: { start: { k: 0 }, turned: { k: 1 }, one: { k: 2 }, two: { k: 3 }, done: {} },
  PcaShadow: { start: { k: 0 }, drop: { k: 2 }, done: {} },
  TwoRules: { walk: { k: 3 }, double: { k: 5 }, one: { k: 1 } },
  FourPieces: { start: { k: 0 }, one: { k: 1 }, done: {} },
  ThreeSlots: { start: { k: 0 }, done: {} },
  HiddenProtractor: { start: { k: 0 }, says: { k: 1 }, done: {} },
  ThreePairs: { start: { k: 0 }, chalk: { k: 2 }, done: {} },
  ZeroAndMinus: { zero: { k: 2 }, done: {} },
  TwoRoads: { start: { k: 0 }, one: { k: 1 }, done: {} },
  TvArgue: { start: { k: 0 }, bean: { k: 1 }, suits: { k: 2 }, mami: { k: 3 }, done: {} },
  ZeroMeans: { start: {}, same: { pick: 0 }, opposite: { pick: 1 }, right: { pick: 2, won: true } },
  ThreeMetre: { start: {}, short: { pick: 1 }, long: { pick: 2 }, right: { pick: 0, won: true } },
  TapeThirteen: { start: {}, thirteen: { pick: 0 }, five: { pick: 2 }, right: { pick: 1, won: true } },
  RoadBox: { start: {}, ten: { pick: 2 }, right: { pick: 1, won: true } },
  SixtyCheck: { start: {}, six: { pick: 0 }, half: { pick: 1 }, right: { pick: 2, won: true } },
  FlatShadow: { start: {}, height: { pick: 0 }, full: { pick: 1 }, right: { pick: 2, won: true } },
  RemotePress: { start: {}, swap: { pick: 0 }, right: { pick: 1, won: true } },
  NineToThree: { start: {}, fading: { pick: 1, at: 2 }, six: { pick: 1 }, right: { pick: 2, won: true } },
  MamiRoad: { start: {}, forward: { pick: 0 }, right: { pick: 2, won: true } },
  NinetyBoth: { start: {}, four: { pick: 1 }, box4: { pick: 2 }, right: { pick: 0, won: true } },
  CalcCos: { start: { k: 0 }, typed: { k: 2 }, done: {} },
  EndlessPairs: { start: { k: 0 }, many: { k: 2 }, why: { k: 3 }, done: {} },
  MinusPieces: { start: { k: 0 }, minus: { k: 1 }, pieces: { k: 3 }, done: {} },
  CrossedZero: { start: { k: 0 }, zero: { k: 1 }, done: {} },
  MamaSeven: { start: { k: 0 }, tape: { k: 2 }, done: {} },
};
