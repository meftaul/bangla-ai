"use client";

import { useEffect, useState } from "react";

import { Bubble, Card as CastCard, Loop, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, pill, primaryBtn, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Label, Plane, makeFrame, sg, snap, type Frame, type XY } from "@/components/journey/plane";
import { bn } from "./figure-kit";
import { dot, num, tupN } from "./haat-journey";

// Screens for "Math for AI 4.5 — গুণ টানা, টানের কতটা কাজে লাগে", told as a Journey.
//
// The boat full of হাটের মাল is towed home from the bank (গুণ টানা). মাঝি চাচা
// says the longer the rope, the less pull is wasted; the reader bets. A pull
// splits into a part along the river (the shadow) and a part at right angles
// (the leftover). On a bending river the reader slides a point along it until
// the dropped line meets it square: the shadow of (2, 1) on (2, 3) is 7/13 of
// it, (1.08, 1.62). A step machine gives the recipe (w · v ÷ v · v) v and
// checks the leftover against the river: 0, every time. Letting go of the
// rudder shows the leftover only drags the boat to the bank. The rope slider
// settles the bet. Twelve points, projected onto their own line, keep one
// number each and lose almost nothing (PCA in words). Last, (4, 2) onto (1, 1)
// unaided.
//
// After the screens come the story scenes (the tow, the river's bend, the
// হালের মাঝি, ফাহিমের বুদ্ধি, the ghat's riddle, the পাঠাগার) and the watch-only
// figures for each <Then>, numbered after their screen (1a, 1½, …).
//
// Tailwind only; the sheets are journey/plane. Ink on the white sheet is fixed.

const O: XY = [0, 0];
const fix = (n: number, d: number) => {
  const s = Math.abs(n).toFixed(d);
  return n < 0 && Number(s) !== 0 ? `−${s}` : s;
};
const tupF = (v: readonly number[], d = 2) => `(${v.map((x) => fix(x, d)).join(", ")})`;

/** A river band along the x axis, with a bank line at y = bank. */
function River({ f, bank }: { f: Frame; bank?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={f.sx(f.x0)} y={f.sy(0.6)} width={(f.x1 - f.x0) * f.u} height={1.2 * f.u} className="fill-[#38bdf8]/20" />
      <path d={`M${f.sx(f.x0)} ${f.sy(0)}H${f.sx(f.x1)}`} strokeWidth={1} strokeDasharray="6 5" className="stroke-[#0284c7]/50" />
      {bank !== undefined && (
        <>
          <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - bank) * f.u} className="fill-[#65a30d]/15" />
          <path d={`M${f.sx(f.x0)} ${f.sy(bank)}H${f.sx(f.x1)}`} strokeWidth={1.5} className="stroke-[#4d7c0f]/60" />
        </>
      )}
    </g>
  );
}

/** A little country boat, bow facing east. */
function Boat({ f, at = O }: { f: Frame; at?: XY }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none" transform={`translate(${x} ${y})`}>
      <path d="M-14 -3H14L9 5H-10Z" className="fill-[#92400e]" />
      <path d="M-4 -3V-14" strokeWidth={1.5} className="stroke-[#0f1b2d]" />
    </g>
  );
}

function Man({ f, at }: { f: Frame; at: XY }) {
  return (
    <g className="pointer-events-none" transform={`translate(${f.sx(at[0])} ${f.sy(at[1])})`}>
      <circle cy={-11} r={3} className="fill-[#0f1b2d]" />
      <path d="M0 -8V0M0 0L-3 6M0 0L3 6M0 -6L4 -3" strokeWidth={1.6} className="fill-none stroke-[#0f1b2d]" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1 · The tow. Two men on the bank pull the boat with a rope. মাঝি চাচা's
//     claim: the longer the rope, the less pull is wasted. Sealed; LongRope
//     (screen 6) settles it.

const FT = makeFrame(-1, 9, -1, 4, 30);
const ROPE_BET = ["ঠিক, লম্বা দড়িতে টান কম নষ্ট হয়", "দড়ির lengthে কিছু যায় আসে না, টান তো একই", "উল্টো, ছোট দড়িতে টান কাছ থেকে আসে, তাই বেশি কাজের"];

export function RopeBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি সিল হলো, মিলিয়ে দেখবো শেষে।");
  };

  return (
    <>
      <Plane f={FT} grid={0} axes={false} label="নদীতে নৌকা, পাড় থেকে দুইজন দড়ি দিয়ে টানছে" className="max-w-[20rem]">
        <River f={FT} bank={3} />
        <path d={`M${FT.sx(0)} ${FT.sy(0)}L${FT.sx(6)} ${FT.sy(3)}`} strokeWidth={1.4} className="pointer-events-none stroke-[#78350f]" />
        <Boat f={FT} />
        <Man f={FT} at={[6, 3]} />
        <Man f={FT} at={[7, 3]} />
        <Label f={FT} at={[4, 0]} dy={20} size={9} weight={500} className="fill-[#0284c7]">
          নদী →
        </Label>
        <Label f={FT} at={[1.5, 3.4]} size={9} weight={500} className="fill-[#4d7c0f]">
          পাড়
        </Label>
      </Plane>
      <div className="text-sm font-medium text-muted">মাঝি চাচা বলছেন, “দড়ি যত লম্বা, টান তত কম নষ্ট।” আপনার কী মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {ROPE_BET.map((o, i) => (
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
// 2 · A pull splits in two. The river runs east. Drag the pull's tip: its
//     shadow on the river (forward) and what's left (towards the bank) are
//     drawn live. Find: all forward, no forward at all, and (4, 3).

const FS = makeFrame(-1, 7, -1, 4.5, 34);
const SPLIT_GOALS = ["পুরো টান সামনে", "সামনে একটুও না", "সামনে 4, পাড়ের দিকে 3"];

export function SplitPull() {
  const pass = useGate();
  const [w, setW] = useSeed<XY>("w", [3, 2]);
  const [hit, setHit] = useSeed<number[]>("hit", []);
  const all = hit.length === SPLIT_GOALS.length;

  const goal = (p: XY) => {
    if (p[0] > 0 && p[1] === 0) return 0;
    if (p[0] === 0 && p[1] !== 0) return 1;
    if (p[0] === 4 && p[1] === 3) return 2;
    return -1;
  };
  const move = (p: XY) => {
    const q = snap(p, FS);
    if (q[0] === w[0] && q[1] === w[1]) return;
    setW(q);
    const g = goal(q);
    if (g < 0 || hit.includes(g)) return;
    const next = [...hit, g];
    setHit(next);
    if (next.length === SPLIT_GOALS.length) pass("প্রতিটা টান দুই ভাগ: সামনে আর পাড়ে।");
  };

  return (
    <>
      <Plane f={FS} ticks={1} label={`টান ${tupN(w)}`} drag={{ down: move, move }} className="max-w-[20rem]">
        <River f={FS} />
        <Boat f={FS} />
        {w[0] !== 0 && <Arrow f={FS} from={O} to={[w[0], 0]} tone="teal" w={3} />}
        {w[1] !== 0 && <Arrow f={FS} from={[w[0], 0]} to={w} tone="amber" w={2} dashed />}
        <Arrow f={FS} from={O} to={w} tone="coral" w={2.6} />
      </Plane>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl border-2 border-cat-teal/40 px-2 py-1.5">
          <div className="text-xs text-muted">সামনে, নদী ধরে</div>
          <div className="font-mono text-lg font-bold">{sg(w[0])}</div>
        </div>
        <div className="rounded-xl border-2 border-cat-amber/40 px-2 py-1.5">
          <div className="text-xs text-muted">পাড়ের দিকে, ৯০ degree কোণে</div>
          <div className="font-mono text-lg font-bold">{sg(w[1])}</div>
        </div>
      </div>
      <Ticks items={SPLIT_GOALS.map((g, i) => [g, hit.includes(i)])} />
      <Task done={all}>টানের মাথা টেনে টেনে তিনটা অবস্থা খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Find the foot. The river bends: v = (2, 3), the rope w = (2, 1). A
//     slider moves a point along the river; a dashed line joins it to w's tip.
//     The box of that line with the river reads 7 − 13λ, and is 0 only at
//     λ = 7/13, where the line meets the river square: the shadow's tip,
//     (1.08, 1.62).

const FF = makeFrame(-0.5, 3, -0.5, 3.5, 44);
const V: XY = [2, 3];
const W: XY = [2, 1];
const FOOT = 7 / 13;

export function FindFoot() {
  const pass = useGate();
  const [lam, setLam] = useSeed("lam", 0.2);
  const [found, setFound] = useSeed("found", false);
  const P: XY = [lam * V[0], lam * V[1]];
  const gap: XY = [W[0] - P[0], W[1] - P[1]];
  const box = dot(gap, V);

  const slide = (x: number) => {
    if (found) return;
    if (Math.abs(7 - 13 * x) < 0.15) {
      setLam(FOOT);
      setFound(true);
      pass("ছায়ার মাথায় দাগটা ৯০ degree কোণে, box এ  0।");
      return;
    }
    setLam(x);
  };

  return (
    <>
      <Plane f={FF} ticks={1} label={`নদী (2, 3), দড়ি (2, 1), নদীর ওপর বিন্দু ${tupF(P)}`} className="max-w-[14rem]">
        <path d={`M${FF.sx(-0.3)} ${FF.sy(-0.45)}L${FF.sx(2.3)} ${FF.sy(3.45)}`} strokeWidth={18} className="pointer-events-none stroke-[#38bdf8]/20" />
        <Arrow f={FF} from={O} to={V} tone="blue" w={2.4} />
        <Arrow f={FF} from={O} to={W} tone="coral" w={2.4} />
        {lam > 0.01 && <path d={`M${FF.sx(0)} ${FF.sy(0)}L${FF.sx(P[0])} ${FF.sy(P[1])}`} strokeWidth={6} strokeLinecap="round" className="pointer-events-none stroke-cat-teal/70" />}
        <path
          d={`M${FF.sx(W[0])} ${FF.sy(W[1])}L${FF.sx(P[0])} ${FF.sy(P[1])}`}
          strokeWidth={1.4}
          strokeDasharray="4 3"
          className={`pointer-events-none ${found ? "stroke-accent" : "stroke-[#d97706]"}`}
        />
        <circle cx={FF.sx(P[0])} cy={FF.sy(P[1])} r={4} className={`pointer-events-none ${found ? "fill-accent" : "fill-[#0f1b2d]"}`} />
        <Label f={FF} at={V} dx={-4} dy={-4} anchor="end" className="fill-cat-blue">
          নদী
        </Label>
        <Label f={FF} at={W} dx={6} dy={4} anchor="start" className="fill-cat-coral">
          দড়ি
        </Label>
      </Plane>
      <div className="mx-auto flex max-w-sm items-center gap-3">
        <span className="font-mono text-sm text-muted">0</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={lam}
          disabled={found}
          aria-label="নদীর arrow-এর কত ভাগ"
          onChange={(e) => slide(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)] disabled:cursor-default"
        />
        <span className="font-mono text-sm text-muted">1</span>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        নদীর <b className="font-mono">{found ? "7/13" : fix(lam, 2)}</b> ভাগ, বিন্দু <span className="font-mono">{tupF(P)}</span>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        দাগ · নদী ={" "}
        <b key={String(found)} className={`font-mono ${found ? `${POP} inline-block text-accent-text` : ""}`}>
          {found ? "0" : fix(box, 2)}
        </b>
      </div>
      <Task done={found}>নদীর ওপর বিন্দুটা সরিয়ে এমন জায়গা খুঁজুন, যেখানে দড়ির মাথা থেকে নামানো দাগ নদীর সাথে ৯০ degree কোণ করে, মানে box এ  0।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The recipe, step by step: w · v = 7, v · v = 13, so the shadow is 7/13
//     of v, (14/13, 21/13); the leftover w − shadow is (12/13, −8/13); and the
//     leftover's box with the river is 24/13 − 24/13 = 0.

const RECIPE = [
  { btn: "দড়ি · নদী", line: "w · v = 2 × 2 + 1 × 3 = 7" },
  { btn: "নদী · নদী", line: "v · v = 2 × 2 + 3 × 3 = 13" },
  { btn: "ছায়া বানান", line: "ছায়া = (7 ÷ 13) × (2, 3) = (14/13, 21/13) ≈ (1.08, 1.62)" },
  { btn: "বাকিটুকু বের করুন", line: "বাকি = w − ছায়া = (12/13, −8/13) ≈ (0.92, −0.62)" },
  { btn: "বাকি · নদী", line: "বাকি · v = 24/13 − 24/13 = 0" },
];
const FR = makeFrame(-0.5, 3, -1, 3.5, 36);

export function ShadowRecipe() {
  const pass = useGate();
  const [k, setK] = useSeed("k", 0);
  const shadow: XY = [(7 / 13) * 2, (7 / 13) * 3];

  const step = () => {
    setK(k + 1);
    if (k + 1 === RECIPE.length) pass("ছায়ার formula: (w · v ÷ v · v) × v।");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Plane f={FR} ticks={1} label="দড়ি, তার ছায়া আর বাকিটুকু" className="max-w-[8.5rem] shrink-0">
          <Arrow f={FR} from={O} to={V} tone="blue" w={2} faint />
          <Arrow f={FR} from={O} to={W} tone="coral" w={2.2} />
          {k >= 3 && <Arrow f={FR} from={O} to={shadow} tone="teal" w={3} draw />}
          {k >= 4 && <Arrow f={FR} from={shadow} to={W} tone="amber" w={2} dashed />}
        </Plane>
        <div className="grid min-w-0 flex-1 gap-0.5 text-[0.82rem] leading-snug">
          {RECIPE.slice(0, k).map((r, i) => (
            <div key={i} className={`${FADE} ${i === RECIPE.length - 1 ? "font-bold text-accent-text" : ""}`}>
              {r.line}
            </div>
          ))}
          {k === 0 && <div className="text-sm text-muted">দড়ি w = (2, 1), নদী v = (2, 3)</div>}
        </div>
      </div>
      {k < RECIPE.length && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={step} className={primaryBtn}>
            {RECIPE[k].btn}
          </button>
        </div>
      )}
      <Task done={k >= RECIPE.length}>হিসাবটা এক ধাপ এক ধাপ করে চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Where the leftover goes. Predict what the boat does if the হালের মাঝি
//     lets go of the rudder, then toggle: free, it drifts to the bank; held,
//     it runs straight. The leftover never moves it forward.

const FP = makeFrame(-1, 8, -1, 3.5, 30);
const DRIFT = ["সোজা সামনে", "সামনে যাবে, আবার পাড়ের দিকেও সরে যাবে", "শুধু পাড়ের দিকে যাবে, সামনে একটুও না"];

export function SidePull() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [free, setFree] = useSeed<boolean | null>("free", null);
  const [seen, setSeen] = useSeed<boolean[]>("seen", []);
  const both = seen.includes(true) && seen.includes(false);

  const toggle = (f: boolean) => {
    setFree(f);
    if (seen.includes(f)) return;
    const next = [...seen, f];
    setSeen(next);
    if (next.includes(true) && next.includes(false)) pass("৯০ degree কোণের ভাগে নৌকা এগোয় না।");
  };

  return (
    <>
      <Plane f={FP} grid={0} axes={false} label="হাল ছাড়লে নৌকা কোন দিকে যায়" className="max-w-[20rem]">
        <River f={FP} bank={3} />
        <path d={`M${FP.sx(0)} ${FP.sy(0)}L${FP.sx(5)} ${FP.sy(3)}`} strokeWidth={1.2} className="pointer-events-none stroke-[#78350f]/60" />
        <Man f={FP} at={[5, 3]} />
        <Arrow f={FP} from={O} to={[2, 0]} tone="teal" w={2.6} />
        <Arrow f={FP} from={O} to={[0, 1.2]} tone="amber" w={2} dashed />
        {free !== null && <Arrow key={String(free)} f={FP} from={O} to={free ? [6.5, 2.6] : [7, 0]} tone="coral" w={2} dashed draw />}
        <Boat f={FP} />
      </Plane>
      {guess === null ? (
        <>
          <div className="text-sm font-medium text-muted">হালের মাঝি হাল ছেড়ে দিলে নৌকা কোন দিকে যাবে?</div>
          <div className="mt-2 grid gap-2">
            {DRIFT.map((o, i) => (
              <Choice key={o} n={i} look="idle" disabled={false} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </>
      ) : (
        <div className={FADE}>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={() => toggle(true)} className={`${pill(free === true)} font-sans`}>
              হাল ছেড়ে দিন
            </button>
            <button type="button" onClick={() => toggle(false)} className={`${pill(free === false)} font-sans`}>
              হাল ধরুন
            </button>
          </div>
          {seen.includes(true) && (
            <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>
              {guess === 1 ? "ঠিক ধরেছেন।" : "নৌকা সামনেও গেল, পাড়ের দিকেও সরলো।"} সামনে যাওয়াটা পুরোটাই সবুজ ভাগের কাজ। হলুদ ভাগটা শুধু পাশে টানে।
            </div>
          )}
        </div>
      )}
      <Ticks
        items={[
          ["হাল ছাড়া", seen.includes(true)],
          ["হাল ধরা", seen.includes(false)],
        ]}
      />
      <Task done={both}>আগে guess করুন, তারপর হাল একবার ছেড়ে আর একবার ধরে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The bet. The bank is 3 m away; the rope length slider runs 3.5 → 15 m.
//     With a pull of 10, forward = 10 cos θ climbs 5.2 → 9.8 while the
//     sideways part falls 8.6 → 2. Visit a short, a middle and a long rope.

const FLR = makeFrame(-0.8, 15.3, -0.8, 3.8, 21);
const PULL = 10;

export function LongRope() {
  const pass = useGate();
  const [rope, setRope] = useSeed("rope", 5);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const x = Math.sqrt(rope * rope - 9);
  const fwd = (PULL * x) / rope;
  const side = (PULL * 3) / rope;
  const theta = (Math.atan2(3, x) * 180) / Math.PI;
  const all = seen.length === 3;

  const slide = (r: number) => {
    setRope(r);
    // short, middle and long ropes
    const b = r <= 4 ? 0 : r >= 7.5 && r <= 8.5 ? 1 : r >= 14 ? 2 : -1;
    if (b < 0 || seen.includes(b)) return;
    const next = [...seen, b];
    setSeen(next);
    if (next.length === 3) pass("দড়ি লম্বা হলে টানের বেশিটা সামনে।");
  };

  return (
    <>
      <Plane f={FLR} grid={0} axes={false} label={`${rope} মিটার দড়ি, কোণ ${fix(theta, 0)}°`} className="max-w-[22rem]">
        <River f={FLR} bank={3} />
        <path d={`M${FLR.sx(0)} ${FLR.sy(0)}L${FLR.sx(x)} ${FLR.sy(3)}`} strokeWidth={1.4} className="pointer-events-none stroke-[#78350f]" />
        <Man f={FLR} at={[x, 3]} />
        <Boat f={FLR} />
      </Plane>
      <div className="mx-auto flex max-w-sm items-center gap-3">
        <span className="text-sm text-muted">ছোট</span>
        <input
          type="range"
          min={3.5}
          max={15}
          step={0.5}
          value={rope}
          aria-label="দড়ি কত মিটার"
          onChange={(e) => slide(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
        />
        <span className="text-sm text-muted">লম্বা</span>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        দড়ি <b className="font-mono">{rope}</b> মিটার, কোণ <b className="font-mono">{fix(theta, 0)}°</b>
      </div>
      <div className="mx-auto mt-2 grid max-w-sm gap-1.5">
        {[
          { name: "সামনে", v: fwd, bar: "bg-cat-teal" },
          { name: "পাড়ের দিকে, নষ্ট", v: side, bar: "bg-cat-amber" },
        ].map((r) => (
          <div key={r.name} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2 text-sm">
            <span className="text-muted">{r.name}</span>
            <span className="h-3 rounded-full bg-foreground/10">
              <span className={`block h-full rounded-full ${r.bar} transition-[width] duration-200 motion-reduce:transition-none`} style={{ width: `${(r.v / PULL) * 100}%` }} />
            </span>
            <b className="text-right font-mono">{fix(r.v, 1)}</b>
          </div>
        ))}
      </div>
      <Ticks
        items={[
          ["৪ মিটার বা কম", seen.includes(0)],
          ["৮ মিটারের কাছে", seen.includes(1)],
          ["১৪ মিটার বা বেশি", seen.includes(2)],
        ]}
      />
      <Task done={all}>দড়িটা ছোট, মাঝারি আর লম্বা করে দেখুন, টানের কতটা সামনে যায়। মোট টান সবসময় {bn(PULL)}।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Keep the shadows. Twelve points lie roughly along a line. Project them
//     onto it: each keeps one number, and the biggest leftover is small. Then
//     onto the line at right angles to it: nearly everything is lost.

const DIR: XY = [2 / Math.sqrt(5), 1 / Math.sqrt(5)];
const NRM: XY = [-1 / Math.sqrt(5), 2 / Math.sqrt(5)];
const TS = [-4, -3.2, -2.5, -1.6, -0.9, -0.3, 0.4, 1.1, 1.8, 2.6, 3.3, 4.1];
const ES = [0.3, -0.2, 0.4, -0.35, 0.1, -0.25, 0.3, -0.1, 0.35, -0.3, 0.2, -0.15];
const CLOUD: XY[] = TS.map((t, i) => [t * DIR[0] + ES[i] * NRM[0], t * DIR[1] + ES[i] * NRM[1]]);
const FK = makeFrame(-4.5, 4.5, -3, 3, 26);
const onto = (p: XY, d: XY): XY => {
  const s = dot(p, d);
  return [s * d[0], s * d[1]];
};

export function KeepShadows() {
  const pass = useGate();
  const [mode, setMode] = useSeed<0 | 1 | 2>("mode", 0);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const line = mode === 2 ? NRM : DIR;
  const pts = CLOUD.map((p) => (mode === 0 ? p : onto(p, line)));
  const lost = Math.max(...CLOUD.map((p) => Math.abs(dot(p, mode === 2 ? DIR : NRM))));
  const both = seen.includes(1) && seen.includes(2);

  const go = (m: 1 | 2) => {
    setMode(m);
    if (seen.includes(m)) return;
    const next = [...seen, m];
    setSeen(next);
    if (next.includes(1) && next.includes(2)) pass("ঠিক দিকে ছায়া নিলে হারায় সামান্যই।");
  };

  return (
    <>
      <Plane f={FK} grid={1} axes={false} label="বারোটা বিন্দু আর তাদের ছায়া" className="max-w-[18rem]">
        {mode !== 0 && (
          <path
            d={`M${FK.sx(-4.4 * line[0])} ${FK.sy(-4.4 * line[1])}L${FK.sx(4.4 * line[0])} ${FK.sy(4.4 * line[1])}`}
            strokeWidth={1.4}
            className={`pointer-events-none ${mode === 1 ? "stroke-cat-teal" : "stroke-cat-coral"}`}
          />
        )}
        {mode !== 0 && CLOUD.map((p, i) => <circle key={`g${i}`} cx={FK.sx(p[0])} cy={FK.sy(p[1])} r={3} className="pointer-events-none fill-[#0f1b2d]/15" />)}
        {pts.map((p, i) => (
          <circle
            key={i}
            r={4.5}
            style={{ transform: `translate(${FK.sx(p[0])}px, ${FK.sy(p[1])}px)` }}
            className="pointer-events-none fill-cat-blue transition-transform duration-700 motion-reduce:transition-none"
          />
        ))}
      </Plane>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => go(1)} className={`${pill(mode === 1)} font-sans`}>
          ছড়ানোর দিকে ছায়া
        </button>
        <button type="button" onClick={() => go(2)} className={`${pill(mode === 2)} font-sans`}>
          ৯০ degree কোণের দাগে ছায়া
        </button>
      </div>
      <div className="mt-2 min-h-12 text-center text-[0.95rem]">
        {mode === 0 ? (
          "প্রতিটা বিন্দু এখন দুইটা সংখ্যা, মোট ২৪টা।"
        ) : (
          <span key={mode} className={FADE}>
            প্রতিটা বিন্দু এখন একটা সংখ্যা, মোট ১২টা। সবচেয়ে বড় হারানো বাকিটুকু <b className={`font-mono ${mode === 2 ? "text-danger" : ""}`}>{num(lost)}</b>।
          </span>
        )}
      </div>
      <Ticks
        items={[
          ["ছড়ানোর দিকে", seen.includes(1)],
          ["৯০ degree কোণের দাগে", seen.includes(2)],
        ]}
      />
      <Task done={both}>দুইটা দাগের ওপরই ছায়া ফেলে দেখুন, কোনটায় কম হারায়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · এবার আপনার পালা. (4, 2) onto (1, 1), five small questions in a row:
//     w · v = 6, v · v = 2, shadow (3, 3), leftover (1, −1), check 0. Wrong
//     tries bounce.

const ASK = [
  { q: "w · v কত?", opts: ["6", "8", "4"], ans: 0, say: "w · v = 4 + 2 = 6" },
  { q: "v · v কত?", opts: ["1", "2", "4"], ans: 1, say: "v · v = 1 + 1 = 2" },
  { q: "তাহলে ছায়া কত?", opts: ["(6, 6)", "(1.5, 1.5)", "(3, 3)"], ans: 2, say: "ছায়া = (6 ÷ 2) × (1, 1) = (3, 3)" },
  { q: "বাকিটুকু, w − ছায়া?", opts: ["(1, −1)", "(7, 5)", "(−1, 1)"], ans: 0, say: "বাকি = (4, 2) − (3, 3) = (1, −1)" },
  { q: "বাকি · v কত?", opts: ["2", "0", "−2"], ans: 1, say: "বাকি · v = 1 − 1 = 0 ✓" },
];
const FY = makeFrame(-0.5, 4.5, -1.5, 3.5, 30);
const WY: XY = [4, 2];
const VY: XY = [1, 1];

export function YourShadow() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const all = done === ASK.length;
  const a = ASK[Math.min(done, ASK.length - 1)];

  const pick = (i: number) => {
    if (all) return;
    if (i !== a.ans) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setDone(done + 1);
    if (done + 1 === ASK.length) pass("(4, 2) ভাঙলো দুই ৯০ degree কোণের ভাগে।");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Plane f={FY} ticks={1} label="w (4, 2), v (1, 1)" className="max-w-[9rem] shrink-0">
          <path d={`M${FY.sx(-0.4)} ${FY.sy(-0.4)}L${FY.sx(3.4)} ${FY.sy(3.4)}`} strokeWidth={1} strokeDasharray="4 4" className="pointer-events-none stroke-cat-blue/40" />
          <Arrow f={FY} from={O} to={VY} tone="blue" w={2.4} />
          <Arrow f={FY} from={O} to={WY} tone="coral" w={2.4} />
          {done >= 3 && <Arrow f={FY} from={O} to={[3, 3]} tone="teal" w={3} draw />}
          {done >= 4 && <Arrow f={FY} from={[3, 3]} to={WY} tone="amber" w={2} dashed />}
        </Plane>
        <div className="grid min-w-0 flex-1 gap-0.5 text-[0.85rem]">
          {ASK.slice(0, done).map((x) => (
            <div key={x.say} className={FADE}>
              {x.say}
            </div>
          ))}
        </div>
      </div>
      {!all && (
        <>
          <div className="mt-3 text-sm font-medium text-muted">{a.q}</div>
          <div className="mt-2 flex justify-center gap-2">
            {a.opts.map((o, i) => (
              <button key={o} type="button" onClick={() => pick(i)} className={pill(false)}>
                {o}
              </button>
            ))}
          </div>
          {miss !== null && <Nope key={miss}>উঁহু। হিসাবটা ৪ নম্বর screen-এর মতোই: আগে দুইটা box, তারপর ভাগ, তারপর গুণ।</Nope>}
        </>
      )}
      <Task done={all}>
        (4, 2)-এর ছায়া (1, 1)-এর ওপর বের করুন, step by step ({bn(done)}/{bn(ASK.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes and explanation figures. Watch-only, driven by the reader
// (useScene): a story scene acts out a step's setup words, a figure acts out
// the <Then> paragraph right before it. The river seen from the side (a boat,
// the bank, the মাঝি in লুঙ্গি and গামছা, the ghat's stairs, a ডাব) and the
// পাঠাগার's computer aren't in the cast, so they are drawn here in fixed ink,
// like the rest of a Stage. পাঠাগারের আপা borrows রিনা's look and gets her own
// name drawn under her feet.

const T_INK = "#0f1b2d";
const T_SKIN = "#b0764a";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** Whether the reader asked for less motion (as in cast.tsx): walking legs stay still then. */
function T_useCalm() {
  const [calm, setCalm] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser's motion setting, which the server render cannot see
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return calm;
}

/** A caption that fades in afresh on every beat. */
const T_say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** The river on a Stage, seen from the side: the bank's edge at y = top, water below it. */
function T_Water({ top }: { top: number }) {
  return (
    <g className="pointer-events-none">
      <rect y={top} width={320} height={180 - top} fill="#7cb8e8" />
      <path d={`M0 ${top}H320`} stroke="#4d7c0f" strokeWidth={2} />
      {[
        [30, 16],
        [140, 30],
        [236, 14],
        [84, 44],
        [196, 48],
      ].map(([x, dy]) => (
        <path key={x} d={`M${x} ${top + dy}q5 -3 10 0t10 0`} fill="none" stroke="white" strokeOpacity={0.6} strokeWidth={1} />
      ))}
    </g>
  );
}

/** A jute sack, bottom-centre at (x, y). */
function T_Sack({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(0.62)`}>
      <path d="M-11 0q-4 -14 2 -22l-2 -4h22l-2 4q6 8 2 22Z" fill="#c9a36b" stroke="#8a6a3a" strokeWidth={1.2} />
    </g>
  );
}

/**
 * A country boat seen from the side, bow to the right, its waterline centre at
 * (x, y): হাটের মাল on board, the sail furled (no wind), and at the stern the
 * হাল. The mast's head, where the rope is tied, is at (x − 14, y − 62).
 */
function T_Boat({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g className="pointer-events-none" transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-46 -20L-66 12" stroke="#78350f" strokeWidth={3} strokeLinecap="round" />
      <path d="M-66 12l-5 -8l6 -4Z" fill="#78350f" />
      <path d="M-14 -8V-62" stroke="#78350f" strokeWidth={3} />
      <rect x={-17.5} y={-56} width={7} height={40} rx={3.5} fill="#fde68a" stroke="#b45309" strokeWidth={1} />
      <path d="M-12.5 -62l2.5 1l-0.6 11l-2.2 -1.2Z" fill="#dc2626" />
      <T_Sack x={-46} y={-9} />
      <T_Sack x={-35} y={-9} />
      <ellipse cx={-26} cy={-14} rx={5.5} ry={5} fill="#c2410c" />
      <ellipse cx={-26} cy={-19} rx={3} ry={1.2} fill="#7c2d12" />
      <path d="M-60 -12Q-56 4 -32 6H36Q56 4 64 -16L54 -10H-50Z" fill="#92400e" />
      <path d="M-50 -10H54" stroke="#78350f" strokeWidth={1.4} />
    </g>
  );
}

/**
 * A মাঝি (not in the cast): লুঙ্গি, a white vest, a red গামছা round the head.
 * Feet at (x, y), about 62 units tall at s = 1. `pose` "pull" leans into a
 * rope held at the chest; "hold" reaches forward; `walking` swings the legs for
 * `ms` each time `run` changes.
 */
function T_Majhi({
  x,
  y,
  s = 0.75,
  facing = 1,
  walking = false,
  run = "",
  ms = 1200,
  pose = "down",
  mood = "plain",
  cloth = "#0e7490",
  name,
}: {
  x: number;
  y: number;
  s?: number;
  facing?: 1 | -1;
  walking?: boolean;
  run?: string;
  ms?: number;
  pose?: "down" | "pull" | "hold";
  mood?: "plain" | "happy";
  cloth?: string;
  name?: string;
}) {
  const calm = T_useCalm();
  const move = walking && !calm;
  const arms = pose === "pull" ? "M-7 -36l12 4M7 -36l8 4" : pose === "hold" ? "M-7 -36l-3 13M7 -37l10 -5" : "M-7 -36l-3 13M7 -36l3 13";
  return (
    <g className="pointer-events-none" transform={`translate(${x} ${y})`}>
      <g transform={`scale(${facing * s} ${s})${pose === "pull" ? " rotate(12)" : ""}`}>
        <g>
          <Loop on={move} run={run} ms={ms} type="translate" values="0 0;0 -1.5;0 0" dur={0.25} />
          {[-3, 3].map((lx) => (
            <g key={lx}>
              <Loop on={move} run={run} ms={ms} type="rotate" values={lx < 0 ? `18 ${lx} -12;-18 ${lx} -12;18 ${lx} -12` : `-18 ${lx} -12;18 ${lx} -12;-18 ${lx} -12`} dur={0.5} />
              <path d={`M${lx} -12V-1`} strokeWidth={4.5} strokeLinecap="round" stroke={T_SKIN} />
            </g>
          ))}
          <path d="M-9.5 -24L-10.5 -9H10.5L9.5 -24Z" fill={cloth} />
          <path d="M-10 -19H10M-10.3 -14H10.3M-4 -24V-9M3 -24V-9" stroke="white" strokeOpacity={0.35} strokeWidth={1} />
          <rect x={-8.5} y={-41} width={17} height={18} rx={4.5} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={0.6} />
          <path d={arms} strokeWidth={4} strokeLinecap="round" stroke={T_SKIN} fill="none" />
          <circle cy={-50} r={8.5} fill={T_SKIN} />
          <path d="M-8.8 -51q0 -10.5 8.8 -10.5t8.8 10.5q-6 -5 -17.6 0Z" fill="#1c1917" />
          <path d="M-9 -54.5H9" stroke="#dc2626" strokeWidth={3} strokeLinecap="round" />
          <circle cx={-3.2} cy={-49} r={1.1} fill={T_INK} />
          <circle cx={3.2} cy={-49} r={1.1} fill={T_INK} />
          <path d={mood === "happy" ? "M-3 -44.5q3 3 6 0" : "M-2.5 -44h5"} fill="none" stroke={T_INK} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      </g>
      {name && (
        <text y={10} textAnchor="middle" fontSize={8} fontWeight={700} fill={T_INK}>
          {name}
        </text>
      )}
    </g>
  );
}

/** A name tag on a white chip, centred at (x, y), for someone whose feet stand on something dark. */
function T_Tag({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 5.2 + 12;
  return (
    <g className={POP}>
      <rect x={x - w / 2} y={y - 8} width={w} height={15} rx={7.5} fill="white" stroke={T_INK} strokeOpacity={0.3} />
      <text x={x} y={y + 3} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={T_INK}>
        {text}
      </text>
    </g>
  );
}

/** A green ডাব, centred at (0, 0). */
function T_Dab() {
  return (
    <g>
      <ellipse rx={6.5} ry={7.5} fill="#4d7c0f" />
      <ellipse cx={-2} cy={-2} rx={2} ry={3} fill="#84cc16" opacity={0.7} />
      <path d="M-2 -7.5h4l-1 -2.5h-2Z" fill="#a16207" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: গুণ টানা. The loaded boat
//      on a river running the wrong way, the sail furled; মাঝি চাচা and his
//      brother step onto the bank with the rope and walk, pulling; ফাহিম asks,
//      and মাঝি চাচা gives the claim. Which rope wastes less is left open.

const S1_WL = 158;
const S1_BANK = 118;

export function GunTana({}: Story) {
  const s = useScene(5, [600, 1400, 1400, 2000, 2200]);
  const k = s.k;
  const ashore = k >= 2;
  const far = k >= 3;
  const [bx, cx, dx, my] = useTween(
    [far ? 100 : 72, ashore ? (far ? 286 : 244) : 116, ashore ? (far ? 232 : 190) : 100, ashore ? S1_BANK : S1_WL - 10],
    far ? 1800 : 1200,
  );
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={100} label="মাল বোঝাই নৌকা, স্রোত উল্টো দিকে; মাঝি চাচা আর তাঁর ভাই পাড়ে নেমে লম্বা দড়িতে নৌকা টানেন; মাঝি চাচা বলেন, দড়ি যত লম্বা, টান তত কম নষ্ট">
        <T_Water top={124} />
        {k >= 1 &&
          [300, 206, 112].map((x) => (
            <g key={x}>
              <Draw d={`M${x} 171H${x - 38}`} strokeWidth={1.6} ms={900} className="stroke-[#1e40af]" />
              <path d={`M${x - 44} 171l7 -4v8Z`} fill="#1e40af" className={POP} style={{ transitionDelay: "700ms" }} />
            </g>
          ))}
        {k >= 1 && (
          <text x={281} y={164} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#1e3a8a" className={FADE}>
            স্রোত
          </text>
        )}
        <T_Boat x={bx} y={S1_WL} />
        <Person who="fahim" x={bx + 6} y={S1_WL - 10} scale={0.75} ms={0} mood={k === 4 ? "puzzled" : "plain"} arm={k === 4 ? "point" : "down"} />
        {ashore && <path d={`M${bx - 14} ${S1_WL - 62}L${cx + 3} ${my - 27}`} stroke="#78350f" strokeWidth={1.4} fill="none" className={FADE} />}
        <T_Majhi x={dx} y={my} walking={k === 2 || k === 3} run={String(k)} ms={far ? 1800 : 1200} pose={far ? "pull" : "down"} cloth="#15803d" name={ashore ? "ভাই" : undefined} />
        <T_Majhi x={cx} y={my} walking={k === 2 || k === 3} run={String(k)} ms={far ? 1800 : 1200} pose={far ? "pull" : "down"} mood={k >= 5 ? "happy" : "plain"} name={ashore ? "মাঝি চাচা" : undefined} />
        {k === 4 && <Bubble x={bx + 6} y={S1_WL - 60} lines={["দড়িটা এত লম্বা কেন?"]} />}
        {k >= 5 && <Bubble x={cx} y={my - 50} side="left" lines={["দড়ি যত লম্বা,", "টান তত কম নষ্ট।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the tow seen from above.
//      The মাঝিরা walk along the bank and the boat along the river, side by
//      side, so the rope runs slantwise; one pull along it, and a "?" for the
//      part that is "wasted".

const X1_F = makeFrame(-1, 10, -1, 4, 28);
const X1_SAY = [
  "ওপর থেকে দেখলে: নৌকা নদীতে, মাঝিরা পাড়ে।",
  "মাঝিরা হাঁটেন পাড় ধরে, নৌকা চলে নদী ধরে। দুই দাগ পাশাপাশি।",
  "তাই দড়িটা কোণাকুণি, নদীর সাথে একটা কোণ করে থাকে।",
  "টান একটাই, দড়ি বরাবর। তাহলে “নষ্ট” হয় কোন অংশটা?",
];

export function SlantRope() {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;
  const f = X1_F;
  const a = Math.atan2(3, 6);
  const r = 1.4;
  return (
    <Scene scene={s} caption={T_say(X1_SAY, k)}>
      <div className="mx-auto w-full max-w-[19rem]">
        <Plane f={f} grid={0} axes={false} label="ওপর থেকে: নৌকা নদীতে, মাঝিরা পাড়ে, দড়ি কোণাকুণি" className="my-0! max-w-none">
          <River f={f} bank={3} />
          {k >= 1 && <Draw d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(1.5)}`} strokeWidth={3} ms={1600} className="stroke-[#0284c7]/60" />}
          {k >= 1 && <Draw d={`M${f.sx(6)} ${f.sy(3)}H${f.sx(8.5)}`} strokeWidth={3} ms={1600} className="stroke-[#4d7c0f]/60" />}
          <g style={{ transform: `translateX(${k >= 1 ? 1.5 * f.u : 0}px)` }} className="transition-transform duration-[1600ms] ease-in-out motion-reduce:transition-none">
            <path
              d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(6)} ${f.sy(3)}`}
              strokeWidth={k >= 2 ? 2.4 : 1.4}
              className="pointer-events-none stroke-[#78350f] transition-[stroke-width] duration-500 motion-reduce:transition-none"
            />
            {k >= 2 && (
              <path
                d={`M${f.sx(r)} ${f.sy(0)}A${r * f.u} ${r * f.u} 0 0 0 ${f.sx(r * Math.cos(a))} ${f.sy(r * Math.sin(a))}`}
                strokeWidth={1.6}
                className={`pointer-events-none fill-none stroke-[#b45309] ${FADE}`}
              />
            )}
            {k >= 3 && <Arrow f={f} from={O} to={[3.6, 1.8]} tone="coral" w={2.8} draw />}
            {k >= 3 && (
              <Label f={f} at={[3.6, 1.8]} dx={4} dy={-6} anchor="start" size={15} weight={800} className={`fill-[#be123c] ${FADE}`}>
                ?
              </Label>
            )}
            <Boat f={f} />
            <Man f={f} at={[6, 3]} />
            <Man f={f} at={[7, 3]} />
          </g>
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2½ · Two figures for screen 2's explanation, no task.
//      (a) The split, built: noon sun straight over the river (4.3's রোদ)
//          drops the pull (3, 2) onto it; the shadow, then the leftover at a
//          right angle, then the two joined back into the whole pull.
//      (b) Why east is easy: on an east river the shadow is the first number
//          and the leftover the second; then the river turns, and "?".

const X2_F = makeFrame(-0.6, 4.4, -0.8, 3, 36);
const X2_W: XY = [3, 2];
const X2A_SAY = [
  "নদী পূর্বে, দড়ির টান (3, 2)।",
  "৪.৩-এর মতো রোদ ফেলি, একদম মাথার ওপর থেকে।",
  "নদীর ওপর যা পড়লো, সেটা টানের ছায়া, মানে projection।",
  "বাকি থাকে হলুদ অংশটা, নদীর সাথে একদম ৯০ degree কোণে।",
  "সবুজের মাথায় হলুদ জুড়ে দিলে আবার পুরো টান।",
];

/** A right-angle mark at `at`, its sides along the unit directions `a` and `b`, in units of `f`. */
function T_Square({ f, at, a, b, size = 0.22 }: { f: Frame; at: XY; a: XY; b: XY; size?: number }) {
  const p = (x: number, y: number) => `${f.sx(at[0] + a[0] * x + b[0] * y)} ${f.sy(at[1] + a[1] * x + b[1] * y)}`;
  return <path d={`M${p(size, 0)}L${p(size, size)}L${p(0, size)}`} strokeWidth={1.2} className={`pointer-events-none fill-none stroke-[#0f1b2d]/70 ${FADE}`} />;
}

export function ShadowDrop() {
  const s = useScene(4, [600, 1600, 1800, 1800, 2000]);
  const k = s.k;
  const f = X2_F;
  return (
    <Scene scene={s} caption={T_say(X2A_SAY, k)}>
      <div className="mx-auto w-full max-w-[13rem]">
        <Plane f={f} grid={0} axes={false} label="টান (3, 2): নদীর ওপর ছায়া 3, আর ৯০ degree কোণে বাকি 2" className="my-0! max-w-none">
          <River f={f} />
          {k >= 1 && (
            <g className={FADE}>
              {[0.6, 1.4, 2.2, 3.8].map((x) => (
                <path key={x} d={`M${f.sx(x)} ${f.sy(2.75)}V${f.sy(0.05)}`} strokeWidth={1} className="pointer-events-none stroke-[#f59e0b]/45" />
              ))}
              <path d={`M${f.sx(3)} ${f.sy(2)}V${f.sy(0)}`} strokeWidth={1.3} strokeDasharray="3 3" className="pointer-events-none stroke-[#b45309]" />
              <circle cx={f.sx(3)} cy={f.sy(2.8)} r={6} className="pointer-events-none fill-[#f59e0b]" />
            </g>
          )}
          {k >= 2 && <Arrow f={f} from={O} to={[3, 0]} tone="teal" w={3.4} draw />}
          {k >= 2 && (
            <Label f={f} at={[1.5, 0]} dy={16} size={9} className={`fill-[#0f766e] ${FADE}`}>
              ছায়া
            </Label>
          )}
          {k >= 3 && <Arrow f={f} from={[3, 0]} to={X2_W} tone="amber" w={2.4} dashed />}
          {k >= 3 && <T_Square f={f} at={[3, 0]} a={[-1, 0]} b={[0, 1]} />}
          {k >= 3 && (
            <Label f={f} at={[3, 1]} dx={7} anchor="start" size={9} className={`fill-[#b45309] ${FADE}`}>
              বাকি
            </Label>
          )}
          <Arrow key={k >= 4 ? "again" : "w"} f={f} from={O} to={X2_W} tone="coral" w={2.6} draw={k >= 4} />
          <Boat f={f} />
        </Plane>
      </div>
    </Scene>
  );
}

const X2B_F = makeFrame(-0.5, 3.6, -0.6, 3.2, 34);
const X2B_SAY = [
  "টান আবার (3, 2), নদী পূর্বে।",
  "নদী ধরে ছায়া 3, মানে টানের প্রথম সংখ্যাটাই।",
  "বাকিটুকু 2, দ্বিতীয় সংখ্যা। কোনো হিসাব লাগলো না।",
  "কিন্তু নদী তো সবসময় পূর্বে যায় না। বাঁক নিলে ছায়া কত?",
];

export function EastEasy() {
  const s = useScene(3, [600, 1600, 1800, 2000]);
  const k = s.k;
  const f = X2B_F;
  const bend = k >= 3;
  return (
    <Scene scene={s} caption={T_say(X2B_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-3">
        <div className="w-full max-w-[9.5rem] shrink-0">
          <Plane f={f} ticks={1} label={bend ? "নদী বাঁক নিয়েছে (2, 3)-এর দিকে, ছায়া অজানা" : "নদী পূর্বে, টান (3, 2)"} className="my-0! max-w-none">
            <g
              style={{ transform: `rotate(${bend ? -56.31 : 0}deg)`, transformOrigin: `${f.sx(0)}px ${f.sy(0)}px` }}
              className="pointer-events-none transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
            >
              <rect x={f.sx(-0.5)} y={f.sy(0.3)} width={4.1 * f.u} height={0.6 * f.u} className="fill-[#38bdf8]/25" />
              <path d={`M${f.sx(-0.5)} ${f.sy(0)}H${f.sx(3.6)}`} strokeWidth={1} strokeDasharray="6 5" className="stroke-[#0284c7]/60" />
            </g>
            {k >= 1 && !bend && <Arrow f={f} from={O} to={[3, 0]} tone="teal" w={3.2} draw />}
            {k >= 2 && !bend && <Arrow f={f} from={[3, 0]} to={X2_W} tone="amber" w={2.2} dashed />}
            <Arrow f={f} from={O} to={X2_W} tone="coral" w={2.4} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-xs text-muted">টান</div>
          <div className="font-mono text-2xl font-bold">
            (<span className={`transition-colors duration-500 motion-reduce:transition-none ${k >= 1 && !bend ? "text-cat-teal" : ""}`}>3</span>,{" "}
            <span className={`transition-colors duration-500 motion-reduce:transition-none ${k >= 2 && !bend ? "text-cat-amber" : ""}`}>2</span>)
          </div>
          <div className="mt-1 min-h-10 text-sm leading-snug">
            {k >= 1 && !bend && (
              <div className={FADE}>
                ছায়া <b className="font-mono text-cat-teal">3</b>
              </div>
            )}
            {k >= 2 && !bend && (
              <div className={FADE}>
                বাকি <b className="font-mono text-cat-amber">2</b>
              </div>
            )}
            {bend && (
              <div className={FADE}>
                ছায়া <b className="font-mono text-lg">?</b>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: the river bends, seen from
//      above. The boat reaches the bend; the river now runs along (2, 3), the
//      rope pulls along (2, 1), and a "?" sits on the river for the shadow's
//      tip. Where it falls is the screen's job.

const S3_BEND: XY = [124, 142];
const S3_V: XY = [2 / Math.sqrt(13), -3 / Math.sqrt(13)];
const S3_WD: XY = [2 / Math.sqrt(5), -1 / Math.sqrt(5)];
const S3_at = (d: XY, t: number): XY => [S3_BEND[0] + d[0] * t, S3_BEND[1] + d[1] * t];

/** A person seen from straight above: shoulders and a head. */
function T_ManTop({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx={7} ry={3.5} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={0.8} />
      <circle r={3.6} fill="#1c1917" />
      <path d="M-3.4 -1H3.4" stroke="#dc2626" strokeWidth={1.4} />
    </g>
  );
}

export function RiverBend({}: Story) {
  const s = useScene(4, [600, 1600, 1600, 1800]);
  const k = s.k;
  const end = S3_at(S3_V, 200);
  const tip = S3_at(S3_V, 88);
  const men = S3_at(S3_WD, 80);
  const q = S3_at(S3_V, 50);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={0} label="ওপর থেকে নদী: পূর্বে গিয়ে বাঁক নিয়েছে (2, 3)-এর দিকে; দড়ির টান (2, 1); ছায়ার মাথা কোথায়, প্রশ্ন">
        <path d={`M-20 ${S3_BEND[1]}H${S3_BEND[0]}L${end[0]} ${end[1]}`} stroke="#7cb8e8" strokeWidth={42} fill="none" strokeLinejoin="round" />
        <g
          style={{ transform: `translate(${k >= 1 ? S3_BEND[0] : 42}px, ${S3_BEND[1]}px)` }}
          className="pointer-events-none transition-transform duration-[1400ms] ease-in-out motion-reduce:transition-none"
        >
          <path d="M-15 0Q-11 -7 0 -7H8Q15 -5 20 0Q15 5 8 7H0Q-11 7 -15 0Z" fill="#92400e" />
          <circle cx={-2} r={2.2} fill="#78350f" />
        </g>
        {k >= 2 && (
          <g>
            <Draw d={`M${S3_BEND[0]} ${S3_BEND[1]}L${tip[0]} ${tip[1]}`} strokeWidth={3} className="stroke-[#1d4ed8]" />
            <path
              d={`M${tip[0] + S3_V[0] * 8} ${tip[1] + S3_V[1] * 8}L${tip[0] - S3_V[1] * 5} ${tip[1] + S3_V[0] * 5}L${tip[0] + S3_V[1] * 5} ${tip[1] - S3_V[0] * 5}Z`}
              fill="#1d4ed8"
              className={POP}
              style={{ transitionDelay: "450ms" }}
            />
            <text x={tip[0] + 34} y={tip[1] - 10} textAnchor="middle" fontSize={9} fontWeight={700} fill={T_INK} className={FADE}>
              নদী
            </text>
            <CastCard x={tip[0] + 34} y={tip[1] + 4} text="(2, 3)" tone="blue" />
          </g>
        )}
        {k >= 3 && (
          <g>
            <Draw d={`M${S3_BEND[0]} ${S3_BEND[1]}L${men[0] - S3_WD[0] * 8} ${men[1] - S3_WD[1] * 8}`} strokeWidth={1.8} className="stroke-[#be123c]" />
            <g className={POP}>
              <T_ManTop x={men[0]} y={men[1]} />
              <T_ManTop x={men[0] + 16} y={men[1] - 4} />
            </g>
            <text x={men[0] + 36} y={men[1] + 10} textAnchor="middle" fontSize={9} fontWeight={700} fill={T_INK} className={FADE}>
              দড়ি
            </text>
            <CastCard x={men[0] + 36} y={men[1] + 24} text="(2, 1)" tone="coral" />
          </g>
        )}
        {k >= 4 && (
          <g>
            <CastCard x={q[0]} y={q[1]} text="?" tone="amber" w={18} />
            <text x={q[0] - 16} y={q[1] + 3} textAnchor="end" fontSize={9} fontWeight={700} fill={T_INK} className={FADE}>
              ছায়ার মাথা কোথায়?
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3½ · Two figures for screen 3's explanation, no task.
//      (a) 7 and 13: the river cut in 13 equal parts, the shadow's tip on the
//          7th mark; then w · v = 7 and v · v = 13 land beside it.
//      (b) Why: 4.3's ‖w‖ cos θ, the same ‖w‖ cos θ inside the box, one
//          division by ‖v‖ for the length and another for the share, and
//          4.1's ‖v‖² = v · v. The shared ‖w‖ cos θ is lit in both rows.

const X3_F = makeFrame(-0.4, 2.9, -0.4, 3.4, 40);
const X3A_SAY = [
  "ছায়ার মাথা পড়েছিল নদীর arrow-এর ঠিক 7/13 ভাগে।",
  "নদীর arrow-কে 13 ভাগ করলে ছায়ার মাথা ঠিক 7 নম্বর দাগে।",
  "এবার দড়ি আর নদীর box: 4 + 3 = 7।",
  "আর নদীর নিজের সাথে box: 4 + 9 = 13।",
  "7 আর 13, দুইটাই box থেকে আসা। কাকতালীয় না।",
];

export function SevenThirteen() {
  const s = useScene(4, [600, 1800, 1800, 1800, 2200]);
  const k = s.k;
  const f = X3_F;
  const n: XY = [-3 / Math.sqrt(13), 2 / Math.sqrt(13)];
  const foot: XY = [FOOT * V[0], FOOT * V[1]];
  return (
    <Scene scene={s} caption={T_say(X3A_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-3">
        <div className="w-full max-w-[8.5rem] shrink-0">
          <Plane f={f} ticks={1} label="নদী (2, 3), দড়ি (2, 1), ছায়ার মাথা নদীর 7/13 ভাগে" className="my-0! max-w-none">
            <Arrow f={f} from={O} to={V} tone="blue" w={2.2} />
            <Arrow f={f} from={O} to={W} tone="coral" w={2.2} />
            {k >= 1 && (
              <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={5} strokeLinecap="round" className={`pointer-events-none stroke-cat-teal/70 ${FADE}`} />
            )}
            {k >= 1 &&
              Array.from({ length: 12 }, (_, i) => {
                const t = (i + 1) / 13;
                const c: XY = [t * V[0], t * V[1]];
                const h = i === 6 ? 0.2 : 0.1;
                return (
                  <path
                    key={i}
                    d={`M${f.sx(c[0] - n[0] * h)} ${f.sy(c[1] - n[1] * h)}L${f.sx(c[0] + n[0] * h)} ${f.sy(c[1] + n[1] * h)}`}
                    strokeWidth={i === 6 ? 1.8 : 1}
                    style={{ transitionDelay: `${i * 60}ms` }}
                    className={`pointer-events-none ${i === 6 ? "stroke-[#0f1b2d]" : "stroke-[#0f1b2d]/60"} ${FADE}`}
                  />
                );
              })}
            <path d={`M${f.sx(W[0])} ${f.sy(W[1])}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={1.3} strokeDasharray="4 3" className="pointer-events-none stroke-accent" />
            <circle cx={f.sx(foot[0])} cy={f.sy(foot[1])} r={3.5} className="pointer-events-none fill-accent" />
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1 text-[0.85rem] leading-snug">
          <div>
            ভাগ <b className="font-mono">7/13</b>
          </div>
          {k >= 2 && <div className={`${FADE} font-mono`}>w · v = 4 + 3 = 7</div>}
          {k >= 3 && <div className={`${FADE} font-mono`}>v · v = 4 + 9 = 13</div>}
          {k >= 4 && <div className={`${FADE} font-bold text-accent-text`}>কাকতালীয় না।</div>}
        </div>
      </div>
    </Scene>
  );
}

const X3B_ROWS: { name: string; f: string[] }[] = [
  { name: "৪.৩: ছায়ার length", f: ["", "‖w‖ cos θ"] },
  { name: "box", f: ["w · v = ‖v‖ ", "‖w‖ cos θ"] },
  { name: "তাই ছায়ার length", f: ["w · v ÷ ‖v‖"] },
  { name: "নদীর কত ভাগ", f: ["w · v ÷ ‖v‖²"] },
  { name: "৪.১: ‖v‖² = v · v, তাই", f: ["7 ÷ 13"] },
];
const X3B_SAY = [
  "হিসাবটা মেলাতে ৪.৩ আর ৪.১-এর দুইটা কথাই যথেষ্ট।",
  "৪.৩ থেকে: ছায়ার length হলো ‖w‖ cos θ।",
  "box-এর ভেতরেও সেই ‖w‖ cos θ আছে, সাথে বাড়তি একটা ‖v‖।",
  "তাই box-কে ‖v‖ দিয়ে ভাগ করলেই ছায়ার length।",
  "সেটা নদীর arrow-এর কত ভাগ, জানতে আরেকবার ‖v‖ দিয়ে ভাগ।",
  "৪.১ থেকে ‖v‖² মানে v · v। তাই ভাগটা 7 ÷ 13।",
];

export function WhySeven() {
  const s = useScene(5, [600, 1800, 2200, 1800, 2000, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={T_say(X3B_SAY, k)}>
      <div className="mx-auto grid w-full max-w-[20rem] gap-1 rounded-2xl border-2 border-cat-blue/30 bg-cat-blue/5 px-3 py-2">
        {X3B_ROWS.map((r, i) => (
          <div
            key={r.name}
            className={`grid grid-cols-[6.4rem_1fr] items-baseline gap-2 rounded-lg px-1 py-0.5 transition-[opacity,background-color] duration-500 motion-reduce:transition-none ${
              k > i ? "opacity-100" : "opacity-0"
            } ${k === i + 1 ? "bg-cat-blue/10" : ""}`}
          >
            <span className="text-[0.8rem] text-muted">{r.name}</span>
            <span className={`font-mono text-[0.8rem] font-semibold whitespace-nowrap ${i === 4 ? "text-accent-text" : ""}`}>
              {r.f.map((p, j) => (
                <span key={j} className={j === 1 && k >= 2 && k <= 3 ? "rounded bg-cat-teal/20 px-0.5" : ""}>
                  {p}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4½ · Two figures for screen 4's explanation, no task.
//      (a) The recipe read aloud: two boxes, one division, a stretch of the
//          river's arrow down to 7/13 of itself; no root, no চাঁদা.
//      (b) Any pull, any river: four pairs in turn, each split into shadow
//          and leftover with the leftover square to the river. Only the first
//          pair is the screen's; the other three are made up to show "any".

const X4_F = makeFrame(-0.4, 2.6, -0.4, 3.4, 30);
const X4A_SAY = [
  "ছায়ার recipe, মুখে পড়ি।",
  "প্রথম box: দড়ি আর নদী, 7।",
  "দ্বিতীয় box: নদী আর নদী, 13।",
  "একটা ভাগ: 7 ÷ 13।",
  "তারপর নদীর arrow-কে সেই ভাগফল দিয়ে stretch। এটাই ছায়া।",
  "কোনো root লাগে না, চাঁদাও না।",
];
const X4A_ROWS = [
  { name: "box", val: "w · v = 7" },
  { name: "box", val: "v · v = 13" },
  { name: "ভাগ", val: "7 ÷ 13" },
  { name: "stretch", val: "(7 ÷ 13) × v" },
];

export function RecipeAloud() {
  const s = useScene(5, [600, 1500, 1500, 1500, 2200, 2000]);
  const k = s.k;
  const f = X4_F;
  // the river's arrow, stretched to 7/13 of itself from beat 4
  const [t] = useTween([k >= 4 ? FOOT : 1], 1100);
  return (
    <Scene scene={s} caption={T_say(X4A_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-3">
        <div className="w-full max-w-[7.5rem] shrink-0">
          <Plane f={f} ticks={1} label="নদী (2, 3) stretch হয়ে তার 7/13 ভাগ, দড়ি (2, 1)-এর ছায়া" className="my-0! max-w-none">
            <Arrow f={f} from={O} to={V} tone="blue" w={2} faint={k >= 4} />
            <Arrow f={f} from={O} to={W} tone="coral" w={2} faint />
            {k >= 4 && <Arrow f={f} from={O} to={[t * V[0], t * V[1]]} tone="teal" w={3.2} />}
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          {X4A_ROWS.map((r, i) => (
            <div
              key={r.val}
              className={`flex items-baseline gap-2 transition-opacity duration-500 motion-reduce:transition-none ${k > i ? "opacity-100" : "opacity-25"}`}
            >
              <span className={`w-14 shrink-0 rounded-md px-1 text-center text-xs font-semibold ${k === i + 1 ? "bg-cat-amber/25" : "bg-foreground/5"}`}>{r.name}</span>
              <span className="font-mono text-[0.85rem]">{k > i ? r.val : ""}</span>
            </div>
          ))}
          {k >= 5 && (
            <div className={`${FADE} mt-1 flex items-center gap-3`}>
              <svg viewBox="0 0 24 20" aria-hidden="true" className="h-5 w-6">
                <text x={12} y={16} textAnchor="middle" fontSize={17} className="fill-muted">
                  √
                </text>
                <path d="M3 17L21 3" strokeWidth={2} className="stroke-danger" strokeLinecap="round" />
              </svg>
              <svg viewBox="0 0 28 20" aria-label="চাঁদা" className="h-5 w-7">
                <path d="M3 16A11 11 0 0 1 25 16Z" strokeWidth={1.4} className="fill-none stroke-muted" />
                <path d="M14 16V11M8 14l1.5 -2M20 14l-1.5 -2" strokeWidth={1} className="stroke-muted" />
                <path d="M4 18L24 3" strokeWidth={2} className="stroke-danger" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

const X4B_F = makeFrame(-1.5, 3.5, -1, 3.5, 30);
const X4B_CASES: { w: XY; v: XY }[] = [
  { w: [2, 1], v: [2, 3] },
  { w: [2, 1], v: [1, 0] },
  { w: [1, 3], v: [3, 1] },
  { w: [3, 1], v: [1, 2] },
];

export function AnyRiver() {
  const s = useScene(3, [600, 2200, 2200, 2200]);
  const k = s.k;
  const f = X4B_F;
  const { w, v } = X4B_CASES[k];
  const len = Math.hypot(v[0], v[1]);
  const u: XY = [v[0] / len, v[1] / len];
  const t = dot(w, v) / dot(v, v);
  const sh: XY = [t * v[0], t * v[1]];
  const rest: XY = [w[0] - sh[0], w[1] - sh[1]];
  const rl = Math.hypot(rest[0], rest[1]);
  const caption = `নদী ${tupN(v)}, টান ${tupN(w)}: বাকি · নদী = 0।${k === 3 ? " যেকোনো টান, যেকোনো নদী।" : ""}`;
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {caption}
        </span>
      }
    >
      <div className="mx-auto w-full max-w-[11rem]">
        <Plane f={f} ticks={1} label={`নদী ${tupN(v)}, টান ${tupN(w)}, ছায়া আর বাকিটুকু ৯০ degree কোণে`} className="my-0! max-w-none">
          <g key={k}>
            <path
              d={`M${f.sx(-u[0])} ${f.sy(-u[1])}L${f.sx(3.2 * u[0])} ${f.sy(3.2 * u[1])}`}
              strokeWidth={10}
              strokeLinecap="round"
              className={`pointer-events-none stroke-[#38bdf8]/20 ${FADE}`}
            />
            <Arrow f={f} from={O} to={v} tone="blue" w={2} />
            <Arrow f={f} from={O} to={w} tone="coral" w={2.2} />
            <Arrow f={f} from={O} to={sh} tone="teal" w={3.2} draw delay={300} />
            <Arrow f={f} from={sh} to={w} tone="amber" w={2} draw delay={900} />
            {rl > 0.3 && (
              <g style={{ transitionDelay: "1400ms" }} className={FADE}>
                <T_Square f={f} at={sh} a={t >= 0 ? [-u[0], -u[1]] : u} b={[rest[0] / rl, rest[1] / rl]} />
              </g>
            )}
          </g>
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: the boat under tow on a
//      straight river again, and at the stern the হালের মাঝি on the হাল.
//      ফাহিম wonders where the sideways pull goes, then what happens if the
//      হাল is let go. The drift is left for the screen.

export function RudderMan({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  const [bx, cx, dx] = useTween([k >= 1 ? 112 : 88, k >= 1 ? 290 : 266, k >= 1 ? 236 : 212], 1600);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={100} label="গুণ টানা নৌকা, পেছনে হালের মাঝি হাল ধরে বসে; ফাহিম ভাবে, পাড়ের দিকের টান যায় কোথায়, হাল ছেড়ে দিলে কী হবে">
        <T_Water top={124} />
        <T_Boat x={bx} y={S1_WL} />
        <T_Majhi x={bx - 55} y={S1_WL - 10} pose="hold" cloth="#7c2d12" />
        {k >= 1 && <T_Tag x={bx - 55} y={S1_WL - 66} text="হালের মাঝি" />}
        <Person who="fahim" x={bx + 8} y={S1_WL - 10} scale={0.75} ms={0} mood={k >= 2 ? "puzzled" : "plain"} />
        <path d={`M${bx - 14} ${S1_WL - 62}L${cx + 3} ${S1_BANK - 27}`} stroke="#78350f" strokeWidth={1.4} fill="none" />
        <T_Majhi x={dx} y={S1_BANK} walking={k === 1} run={String(k)} ms={1600} pose="pull" cloth="#15803d" />
        <T_Majhi x={cx} y={S1_BANK} walking={k === 1} run={String(k)} ms={1600} pose="pull" />
        {k === 2 && <Bubble x={bx + 8} y={S1_WL - 60} side="right" tone="think" lines={["পাড়ের দিকের টানটা", "যায় কোথায়?"]} />}
        {k >= 3 && <Bubble x={bx + 8} y={S1_WL - 60} side="right" tone="think" lines={["হাল ছেড়ে দিলে", "কী হবে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5½ · Two figures for screen 5's explanation, no task.
//      (a) The হাল holds: the yellow part alone would only drag the boat to
//          the bank; the হাল pushes back just as hard; the two cancel and the
//          boat runs on the green part alone. The yellow is the "নষ্ট টান".
//      (b) 0 is not −1: 4.2's van on its road (4, 3). মামী pushes from 90°
//          and the push's shadow on the road is a single point; a push from
//          dead ahead has a shadow all the way backwards, cosine −1.

const X5_F = makeFrame(-1, 7, -1.6, 3.3, 28);
const X5A_SAY = [
  "টানের দুই ভাগ: সবুজটা সামনে, হলুদটা পাড়ের দিকে।",
  "হলুদ ভাগ একা থাকলে নৌকাকে শুধু পাড়ের দিকে নেয়, সামনে এক পা-ও না।",
  "হালের মাঝি হাল দিয়ে ঠিক উল্টো দিকে ঠেকিয়ে রাখেন।",
  "হলুদ আর হালের ঠেকা কাটাকাটি। নৌকা এগোয় শুধু সবুজ ভাগে।",
  "হলুদ ভাগটা খরচ হলো, কাজে লাগলো না। এটাই মাঝি চাচার “নষ্ট টান”।",
];

export function RudderHolds() {
  const s = useScene(4, [600, 2000, 1800, 2000, 2200]);
  const k = s.k;
  const f = X5_F;
  const shift = k === 1 ? `0px, ${-1 * f.u}px` : k >= 3 ? `${2.6 * f.u}px, 0px` : "0px, 0px";
  return (
    <Scene scene={s} caption={T_say(X5A_SAY, k)}>
      <div className="mx-auto w-full max-w-[16rem]">
        <Plane f={f} grid={0} axes={false} label="নৌকার ওপর টানের সবুজ ভাগ সামনে, হলুদ ভাগ পাড়ের দিকে, হাল উল্টো দিকে ঠেকায়" className="my-0! max-w-none">
          <River f={f} bank={3} />
          {k === 1 && (
            <g opacity={0.25}>
              <Boat f={f} />
            </g>
          )}
          <g style={{ transform: `translate(${shift})` }} className="transition-transform duration-[1500ms] ease-in-out motion-reduce:transition-none">
            <Arrow f={f} from={O} to={[2, 1.2]} tone="coral" w={2} faint />
            <Arrow f={f} from={O} to={[2, 0]} tone="teal" w={3} faint={k === 1 || k === 2} />
            <Arrow f={f} from={O} to={[0, 1.2]} tone="amber" w={2.4} faint={k === 3} />
            {k >= 2 && <Arrow f={f} from={O} to={[0, -1.2]} tone="violet" w={2.4} draw={k === 2} faint={k >= 3} />}
            {k >= 2 && (
              <Label f={f} at={[0, -1.2]} dx={6} dy={2} anchor="start" size={9} className={`fill-[#6d28d9] ${FADE}`}>
                হাল
              </Label>
            )}
            {k >= 4 && (
              <Label f={f} at={[0, 1.2]} dx={-6} dy={4} anchor="end" size={9} weight={700} className={`fill-[#b45309] ${FADE}`}>
                নষ্ট টান
              </Label>
            )}
            <Boat f={f} />
          </g>
        </Plane>
      </div>
    </Scene>
  );
}

const X5B_F = makeFrame(-2.6, 2.6, -1.8, 1.9, 30);
const X5B_R: XY = [0.8, 0.6];
const X5B_N: XY = [-0.6, 0.8];
const X5B_SAY = [
  "৪.২-এর ভ্যান, রাস্তা ধরে।",
  "মামী ঠেললেন ৯০ degree কোণ থেকে। ভ্যান এক চুলও আগালো না।",
  "রাস্তার ওপর ধাক্কার ছায়া একটা বিন্দু, মানে 0। একটার দিকে আরেকটার কোনো ভাগই নাই।",
  "কেউ সামনে থেকে উল্টো দিকে ঠেললে ছায়া পুরোটাই উল্টা দিকে। Cosine তখন −1।",
  "0 মানে সম্পর্কটাই নাই। −1 মানে উল্টা, আর সেটা একটা শক্ত সম্পর্ক।",
];

export function ZeroNotMinus() {
  const s = useScene(4, [600, 1800, 2400, 2400, 2400]);
  const k = s.k;
  const f = X5B_F;
  const at = (d: XY, t: number): XY => [d[0] * t, d[1] * t];
  const mTail = at(X5B_N, 1.9);
  const mHead = at(X5B_N, 0.45);
  const oTail = at(X5B_R, 2.35);
  const oHead = at(X5B_R, 0.75);
  const back = k >= 3 ? -0.25 * f.u : 0;
  return (
    <Scene scene={s} caption={T_say(X5B_SAY, k)}>
      <div className="mx-auto w-full max-w-[12.5rem]">
        <Plane f={f} grid={0} axes={false} label="ভ্যানের রাস্তা (4, 3); মামীর ধাক্কা ৯০ degree কোণে, ছায়া 0; সামনে থেকে উল্টো ধাক্কা, cosine −1" className="my-0! max-w-none">
          <path
            d={`M${f.sx(-2.4 * X5B_R[0])} ${f.sy(-2.4 * X5B_R[1])}L${f.sx(2.4 * X5B_R[0])} ${f.sy(2.4 * X5B_R[1])}`}
            strokeWidth={22}
            strokeLinecap="round"
            className="pointer-events-none stroke-[#d6c08f]/60"
          />
          <g
            style={{ transform: `translate(${back * X5B_R[0]}px, ${-back * X5B_R[1]}px)` }}
            className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
          >
            <g transform={`rotate(${-Math.atan2(3, 4) * (180 / Math.PI)} ${f.sx(0)} ${f.sy(0)})`}>
              <rect x={f.sx(-0.6)} y={f.sy(0.3)} width={1.2 * f.u} height={0.6 * f.u} rx={3} className="pointer-events-none fill-[#92400e]" />
              <circle cx={f.sx(0.62)} cy={f.sy(0)} r={4} className="pointer-events-none fill-[#0f1b2d]" />
            </g>
          </g>
          {k >= 1 && <Arrow f={f} from={mTail} to={mHead} tone="violet" w={2.6} draw={k === 1} />}
          {k >= 1 && (
            <Label f={f} at={mTail} dx={-4} dy={-5} anchor="end" size={9} className={`fill-[#6d28d9] ${FADE}`}>
              মামী
            </Label>
          )}
          {k >= 2 && (
            <g className={FADE}>
              <path d={`M${f.sx(mTail[0])} ${f.sy(mTail[1])}L${f.sx(0)} ${f.sy(0)}`} strokeWidth={1.2} strokeDasharray="3 3" className="pointer-events-none stroke-[#0f1b2d]/60" />
              <circle cx={f.sx(0)} cy={f.sy(0)} r={4.5} className="pointer-events-none fill-white stroke-cat-teal" strokeWidth={2} />
              <Label f={f} at={O} dx={8} dy={16} anchor="start" size={10} weight={800} className="fill-[#0f766e]">
                0
              </Label>
            </g>
          )}
          {k >= 3 && <Arrow f={f} from={oTail} to={oHead} tone="coral" w={2.6} draw={k === 3} />}
          {k >= 3 && <Arrow f={f} from={at(X5B_R, -0.5)} to={at(X5B_R, -2.1)} tone="danger" w={2.4} dashed />}
          {k >= 3 && (
            <Label f={f} at={at(X5B_R, -2.1)} dx={14} dy={10} size={10} weight={800} className={`fill-[#be123c] ${FADE}`}>
              −1
            </Label>
          )}
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½ · Two figures for screen 6's explanation, no task.
//      (a) The ropes side by side: 4, 8 and 15 m ropes to a bank 3 m off, all
//          on one sheet, with each one's angle and cos θ; the angle shrinks
//          and cos θ creeps to 1.
//      (b) The honest limit, from the side: a very long rope sags into the
//          water; a rope tied low snags on the bank's bushes; a middle length
//          tied at the mast's head clears them.

const X6_F = makeFrame(-0.8, 15.3, -0.8, 3.8, 19);
const X6_ROPES = [4, 8, 15].map((L) => {
  const x = Math.sqrt(L * L - 9);
  return { L, x, deg: (Math.atan2(3, x) * 180) / Math.PI, cos: x / L };
});
const X6A_SAY = [
  "পাড় নৌকা থেকে 3 মিটার দূরে, দড়ি যত লম্বাই হোক।",
  `দড়ি 4 মিটার: মাঝিরা প্রায় পাশাপাশি, কোণ ${fix(X6_ROPES[0].deg, 0)}°। cos θ মাত্র ${fix(X6_ROPES[0].cos, 2)}।`,
  `দড়ি 8 মিটার: কোণ ছোট হয়ে ${fix(X6_ROPES[1].deg, 0)}°, cos θ ${fix(X6_ROPES[1].cos, 2)}।`,
  `দড়ি 15 মিটার: কোণ মাত্র ${fix(X6_ROPES[2].deg, 0)}°, cos θ ${fix(X6_ROPES[2].cos, 2)}, প্রায় 1। টানের প্রায় পুরোটাই সামনে।`,
  "দড়ি যত লম্বা, কোণ তত ছোট, cos θ তত 1-এর কাছে। মাঝি চাচাই ঠিক।",
];

export function RopeFan() {
  const s = useScene(4, [600, 2000, 2000, 2400, 2200]);
  const k = s.k;
  const f = X6_F;
  return (
    <Scene scene={s} caption={T_say(X6A_SAY, k)}>
      <div className="mx-auto w-full max-w-[20rem]">
        <Plane f={f} grid={0} axes={false} label="একই পাড়ে 4, 8 আর 15 মিটার দড়ি: কোণ ছোট হয়, cos θ 1-এর দিকে যায়" className="my-0! max-w-none">
          <River f={f} bank={3} />
          <path d={`M${f.sx(15)} ${f.sy(0)}V${f.sy(3)}M${f.sx(14.8)} ${f.sy(0)}H${f.sx(15.2)}M${f.sx(14.8)} ${f.sy(3)}H${f.sx(15.2)}`} strokeWidth={1} className="pointer-events-none stroke-[#0f1b2d]/60" />
          <Label f={f} at={[14.8, 1.5]} dy={3} anchor="end" size={8} className="fill-[#0f1b2d]">
            3 মিটার
          </Label>
          {X6_ROPES.map((r, i) => {
            if (k < i + 1) return null;
            const now = k === i + 1 || (k === 4 && i === 2);
            const a = Math.atan2(3, r.x);
            const R = 1.6;
            return (
              <g key={r.L} opacity={now ? 1 : 0.35} className="transition-opacity duration-500 motion-reduce:transition-none">
                <Draw d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(r.x)} ${f.sy(3)}`} strokeWidth={now ? 1.8 : 1.2} className="stroke-[#78350f]" />
                <Man f={f} at={[r.x, 3]} />
                {now && (
                  <path
                    d={`M${f.sx(R)} ${f.sy(0)}A${R * f.u} ${R * f.u} 0 0 0 ${f.sx(R * Math.cos(a))} ${f.sy(R * Math.sin(a))}`}
                    strokeWidth={1.4}
                    className={`pointer-events-none fill-none stroke-[#b45309] ${FADE}`}
                  />
                )}
              </g>
            );
          })}
          <Boat f={f} />
        </Plane>
      </div>
      <div className="mx-auto mt-2 flex min-h-6 max-w-[20rem] flex-wrap justify-center gap-1.5 text-[0.8rem]">
        {X6_ROPES.map((r, i) =>
          k > i ? (
            <span key={r.L} className={`${FADE} rounded-full px-2 py-0.5 ${i === 2 ? "bg-accent/15 font-semibold" : "bg-foreground/5"}`}>
              <b className="font-mono">{r.L}</b> মিটার, cos θ <b className="font-mono">{fix(r.cos, 2)}</b>
            </span>
          ) : null,
        )}
      </div>
    </Scene>
  );
}

const X6B_SAY = [
  "অঙ্ক বলে, দড়ি যত লম্বা তত ভালো।",
  "কিন্তু দড়ি খুব লম্বা হলে ভারী হয়, মাঝখানে পানিতে ঝুলে পড়ে।",
  "আর নিচে বাঁধলে দড়ি পাড়ের ঝোপঝাড়ে আটকায়।",
  "তাই মাঝিরা বাছেন মাঝামাঝি length, আর দড়ি বাঁধেন মাস্তুলের মাথায়।",
];

export function SagRope() {
  const s = useScene(3, [600, 2200, 2000, 2400]);
  const k = s.k;
  const low = k === 2;
  const [mx, sag, ax, ay] = useTween([k === 1 ? 286 : 214, k === 1 ? 40 : 0, low ? 91 : 60.2, low ? 85 : 48.6], 1300);
  const hx = mx + 3;
  const hy = 68 - 17;
  const midx = (ax + hx) / 2;
  const midy = (ay + hy) / 2 + sag;
  return (
    <Scene scene={s} caption={T_say(X6B_SAY, k)}>
      <svg viewBox="0 0 300 112" role="img" aria-label="পাশ থেকে গুণ টানা: খুব লম্বা দড়ি পানিতে ঝোলে, নিচে বাঁধা দড়ি ঝোপে আটকায়, মাস্তুলের মাথায় বাঁধা মাঝারি দড়ি পরিষ্কার" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect width={300} height={112} rx={10} fill="#e0f2fe" />
        <rect y={56} width={300} height={16} fill="#86c06c" />
        <path d="M0 72H300V102Q300 112 290 112H10Q0 112 0 102Z" fill="#7cb8e8" />
        <path d="M0 72H300" stroke="#4d7c0f" strokeWidth={1.5} />
        <g>
          <ellipse cx={146} cy={63} rx={10} ry={8} fill="#15803d" />
          <ellipse cx={156} cy={61} rx={9} ry={9} fill="#16a34a" />
          <ellipse cx={165} cy={64} rx={8} ry={6} fill="#15803d" />
        </g>
        <T_Boat x={70} y={92} s={0.7} />
        <path d={`M${ax} ${ay}Q${2 * midx - (ax + hx) / 2} ${2 * midy - (ay + hy) / 2} ${hx} ${hy}`} stroke="#78350f" strokeWidth={1.4} fill="none" />
        {k === 1 && (
          <g className={FADE}>
            <path d="M150 76q6 -3 12 0t12 0M140 82q6 -3 12 0" fill="none" stroke="white" strokeWidth={1.2} />
          </g>
        )}
        {low && (
          <g className={POP} transform="translate(156 60)">
            <circle r={7} fill="white" stroke="#dc2626" strokeWidth={1.6} />
            <path d="M-3 -3l6 6M3 -3l-6 6" stroke="#dc2626" strokeWidth={1.6} strokeLinecap="round" />
          </g>
        )}
        <T_Majhi x={mx - 24} y={68} s={0.42} pose="pull" cloth="#15803d" walking={k >= 1} run={String(k)} ms={1300} />
        <T_Majhi x={mx} y={68} s={0.42} pose="pull" walking={k >= 1} run={String(k)} ms={1300} />
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: ফাহিমের বুদ্ধি. Near the
//      ghat, ফাহিম in the boat thinks: a shadow turns an arrow into one number;
//      what about a whole cloud of points lying along a line? Dashes drop
//      from each point to the line, and a "?" for what is lost.

const S7_WL = 158;

export function FahimIdea({}: Story) {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  const [bx] = useTween([k >= 1 ? 82 : 58], 1400);
  const cx = 158;
  const cy = 14;
  const c = (p: XY): XY => [cx + 70 + p[0] * 14, cy + 44 - p[1] * 14];
  const lineA = c([-4.2 * DIR[0], -4.2 * DIR[1]]);
  const lineB = c([4.2 * DIR[0], 4.2 * DIR[1]]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={100} label="ঘাটের কাছে নৌকায় ফাহিম ভাবছে: ছায়া নিলে arrow থেকে একটা সংখ্যা; একগাদা বিন্দুর ছায়া একটা দাগে নিলে কী হারায়">
        <T_Water top={124} />
        <T_Boat x={bx} y={S7_WL} />
        <Person who="fahim" x={bx + 8} y={S7_WL - 10} scale={0.75} ms={0} mood={k >= 1 ? "smug" : "plain"} />
        {k >= 1 && (
          <g className={FADE}>
            <circle cx={bx + 22} cy={S7_WL - 64} r={2.5} fill="white" stroke={T_INK} strokeOpacity={0.35} />
            <circle cx={bx + 34} cy={S7_WL - 74} r={3.5} fill="white" stroke={T_INK} strokeOpacity={0.35} />
            <rect x={cx} y={cy} width={148} height={96} rx={14} fill="white" stroke={T_INK} strokeOpacity={0.35} strokeDasharray="3 2" />
          </g>
        )}
        {k === 1 && (
          <g className={FADE}>
            <path d={`M${cx + 16} ${cy + 70}H${cx + 132}`} stroke="#94a3b8" strokeWidth={1.2} />
            <path d={`M${cx + 24} ${cy + 70}L${cx + 96} ${cy + 26}`} stroke="#be123c" strokeWidth={2.2} strokeLinecap="round" />
            <path d={`M${cx + 96} ${cy + 26}V${cy + 70}`} stroke="#0f1b2d" strokeOpacity={0.5} strokeDasharray="3 2" />
            <path d={`M${cx + 24} ${cy + 70}H${cx + 96}`} stroke="#0f766e" strokeWidth={3.4} strokeLinecap="round" />
            <text x={cx + 60} y={cy + 86} textAnchor="middle" fontSize={9} fontWeight={700} fill="#0f766e">
              একটা সংখ্যা
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d={`M${lineA[0]} ${lineA[1]}L${lineB[0]} ${lineB[1]}`} stroke="#0f766e" strokeWidth={1.2} strokeDasharray="4 3" />
            {CLOUD.map((p, i) => {
              const q = c(p);
              const foot = c(onto(p, DIR));
              return (
                <g key={i}>
                  {k >= 3 && <path d={`M${q[0]} ${q[1]}L${foot[0]} ${foot[1]}`} stroke="#b45309" strokeWidth={1} className={FADE} />}
                  <circle cx={q[0]} cy={q[1]} r={2.6} fill="#1d4ed8" />
                </g>
              );
            })}
          </g>
        )}
        {k >= 3 && (
          <text x={cx + 140} y={cy + 88} textAnchor="end" fontSize={9.5} fontWeight={800} fill="#b45309" className={FADE}>
            কী হারায়?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7½ · Two figures for screen 7's explanation, no task.
//      (a) One point up close: (2.46, 0.89), the tenth of the twelve. On the
//          spread's line it keeps 2.6 and loses 0.3; on the line at 90° it
//          keeps −0.3 and loses 2.6.
//      (b) PCA in one picture: a point of 300 numbers, a few directions to
//          take shadows on, a few numbers kept, the small leftovers thrown
//          away. The "few" is drawn as three.

const X7_F = makeFrame(-1, 3, -1, 2.1, 40);
const X7_P = CLOUD[9];
const X7A_SAY = [
  "বারোটার একটা বিন্দু, দুইটা সংখ্যা: (2.46, 0.89)।",
  "ছড়ানোর দিকের দাগে ছায়া নিলে থাকে একটাই সংখ্যা, 2.6।",
  "হারালো শুধু বাকিটুকু, 0.3।",
  "৯০ degree কোণের দাগে ছায়া নিলে থাকে −0.3, আর হারায় 2.6। প্রায় সবটাই।",
];

export function OnePoint() {
  const s = useScene(3, [600, 1800, 1600, 2400]);
  const k = s.k;
  const f = X7_F;
  const across = k >= 3;
  const line = across ? NRM : DIR;
  const foot = onto(X7_P, line);
  const ln = (d: XY, a: number, b: number) => `M${f.sx(d[0] * a)} ${f.sy(d[1] * a)}L${f.sx(d[0] * b)} ${f.sy(d[1] * b)}`;
  return (
    <Scene scene={s} caption={T_say(X7A_SAY, k)}>
      <div className="mx-auto w-full max-w-[11rem]">
        <Plane f={f} grid={1} axes={false} label="একটা বিন্দুর ছায়া দুই দাগে: ছড়ানোর দিকে 2.6 থাকে, 0.3 হারায়; ৯০ degree কোণের দাগে −0.3 থাকে, 2.6 হারায়" className="my-0! max-w-none">
          {CLOUD.map((p, i) =>
            i === 9 || p[0] < f.x0 || p[0] > f.x1 || p[1] < f.y0 || p[1] > f.y1 ? null : (
              <circle key={i} cx={f.sx(p[0])} cy={f.sy(p[1])} r={2.6} className="pointer-events-none fill-[#0f1b2d]/15" />
            ),
          )}
          {k >= 1 && (
            <g key={across ? "b" : "a"}>
              <path d={across ? ln(NRM, -1, 2.2) : ln(DIR, -1.1, 3.3)} strokeWidth={1.4} className={`pointer-events-none ${FADE} ${across ? "stroke-cat-coral" : "stroke-cat-teal"}`} />
              <path d={ln(line, 0, dot(X7_P, line))} strokeWidth={5} strokeLinecap="round" className={`pointer-events-none ${FADE} ${across ? "stroke-cat-coral/60" : "stroke-cat-teal/60"}`} />
              <path
                d={`M${f.sx(X7_P[0])} ${f.sy(X7_P[1])}L${f.sx(foot[0])} ${f.sy(foot[1])}`}
                strokeWidth={k >= 2 ? 3 : 1.2}
                strokeDasharray={k >= 2 ? undefined : "3 3"}
                className={`pointer-events-none ${k >= 2 ? "stroke-cat-amber" : "stroke-[#0f1b2d]/60"}`}
              />
              <circle cx={f.sx(0)} cy={f.sy(0)} r={2.5} className="pointer-events-none fill-[#0f1b2d]" />
            </g>
          )}
          <circle cx={f.sx(X7_P[0])} cy={f.sy(X7_P[1])} r={4.5} className="pointer-events-none fill-cat-blue" />
          {k === 0 && (
            <Label f={f} at={X7_P} dx={-6} dy={-8} anchor="end" size={9} className={`fill-[#0f1b2d] font-mono ${FADE}`}>
              (2.46, 0.89)
            </Label>
          )}
        </Plane>
      </div>
      <div className="mx-auto mt-1 flex max-w-[14rem] justify-center gap-4 text-sm">
        <span>
          থাকে <b className={`font-mono ${across ? "text-cat-coral" : "text-cat-teal"}`}>{k >= 1 ? fix(dot(X7_P, line), 1) : "–"}</b>
        </span>
        <span>
          হারায় <b className="font-mono text-cat-amber">{k >= 2 ? fix(Math.abs(dot(X7_P, across ? DIR : NRM)), 1) : "–"}</b>
        </span>
      </div>
    </Scene>
  );
}

const X7B_SAY = [
  "ধরেন data-র প্রতিটা বিন্দু 300টা সংখ্যা।",
  "কিন্তু বিন্দুগুলো আসলে ছড়িয়ে আছে মাত্র কয়েকটা দিক ধরে। সেই দিকগুলোর ওপর ছায়া নিই।",
  "প্রতিটা দিক থেকে একটা করে সংখ্যা। 300টার কাজ চলে কয়েকটায়।",
  "বাকিটুকু ফেলে দিই। হারায় শুধু ছোট ছোট বাকিটুকু।",
];

export function FewNumbers() {
  const s = useScene(3, [600, 2400, 2000, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={T_say(X7B_SAY, k)}>
      <svg viewBox="0 0 280 96" role="img" aria-label="300টা সংখ্যার একটা বিন্দু, কয়েকটা দিকে ছায়া নিয়ে কয়েকটা সংখ্যা, বাকিটুকু ফেলে দেওয়া" className="mx-auto block h-auto w-full max-w-[18rem]">
        <g opacity={k >= 3 ? 0.18 : 1} className="transition-opacity duration-700 motion-reduce:transition-none">
          {Array.from({ length: 300 }, (_, i) => (
            <rect key={i} x={6 + (i % 30) * 3.8} y={14 + Math.floor(i / 30) * 3.8} width={3} height={3} rx={0.6} className="fill-cat-blue" />
          ))}
        </g>
        <text x={63} y={66} textAnchor="middle" fontSize={10} fontWeight={700} className="fill-foreground">
          300টা সংখ্যা
        </text>
        {k >= 1 && (
          <g>
            <Draw d="M128 33H176" strokeWidth={2} className="stroke-muted" />
            <path d="M182 33l-7 -4v8Z" className={`fill-muted ${POP}`} style={{ transitionDelay: "450ms" }} />
            <text x={152} y={22} textAnchor="middle" fontSize={8.5} className={`fill-muted ${FADE}`}>
              ছায়া
            </text>
          </g>
        )}
        {k >= 2 &&
          [0, 1, 2].map((i) => (
            <rect key={i} x={194 + i * 22} y={23} width={18} height={18} rx={3} style={{ transitionDelay: `${i * 150}ms` }} className={`fill-cat-teal ${POP}`} />
          ))}
        {k >= 2 && (
          <text x={227} y={58} textAnchor="middle" fontSize={10} fontWeight={700} className={`fill-foreground ${FADE}`}>
            কয়েকটা সংখ্যা
          </text>
        )}
        {k >= 3 &&
          Array.from({ length: 14 }, (_, i) => (
            <circle
              key={i}
              cx={14 + i * 7.5}
              cy={84}
              r={1.4}
              style={{ transitionDelay: `${i * 40}ms` }}
              className={`fill-cat-amber ${FADE}`}
            />
          ))}
        {k >= 3 && (
          <text x={128} y={87} fontSize={8.5} className={`fill-muted ${FADE}`}>
            বাকিটুকু, ফেলে দিলাম
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: at the ghat. The boat is
//      tied to a post on the stairs, which rise one step up for one across,
//      like (1, 1). মাঝি চাচা, laughing, gives the riddle: the rope's pull
//      (4, 2), the stairs (1, 1); how much along the stairs, how much left?

/** The ghat's stairs rising from the water to the bank, one up for one across, and the post the boat is tied to. */
function T_Ghat() {
  let d = "M196 180V166";
  for (let i = 0; i < 5; i++) d += "h12v-12";
  d += "H320V180Z";
  return (
    <g className="pointer-events-none">
      <path d={d} fill="#e7e5e4" stroke="#78716c" strokeWidth={1} />
      <rect x={210} y={132} width={4} height={22} fill="#78350f" />
    </g>
  );
}

const S8_BOAT = 120;
const S8_POST: XY = [212, 134];

export function GhatRiddle({}: Story) {
  const s = useScene(4, [600, 1500, 1600, 1800, 2400]);
  const k = s.k;
  const [bx] = useTween([k >= 1 ? S8_BOAT : 88], 1300);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={100} label="ঘাটে নৌকা বাঁধা হচ্ছে; দড়ির টান (4, 2), সিঁড়ি উঠে গেছে (1, 1)-এর দিকে; মাঝি চাচা হাসতে হাসতে ধাঁধা দেন">
        <T_Water top={124} />
        <T_Ghat />
        <T_Boat x={bx} y={S1_WL} />
        <Person who="fahim" x={bx + 8} y={S1_WL - 10} scale={0.75} ms={0} />
        {k >= 1 && <Draw d={`M${S8_BOAT + 58} ${S1_WL - 13}L${S8_POST[0]} ${S8_POST[1]}`} strokeWidth={1.6} className="stroke-[#78350f]" />}
        <T_Majhi x={288} y={106} facing={-1} pose={k >= 2 ? "hold" : "down"} mood={k >= 2 ? "happy" : "plain"} name="মাঝি চাচা" />
        {k >= 2 && <CastCard x={172} y={118} text="(4, 2)" tone="coral" />}
        {k >= 3 && (
          <g>
            <Draw d="M186 158L246 98" strokeWidth={2} className="stroke-[#1d4ed8]" />
            <path d="M252 92l-9.5 3l6.5 6.5Z" fill="#1d4ed8" className={POP} style={{ transitionDelay: "450ms" }} />
            <CastCard x={216} y={96} text="(1, 1)" tone="blue" />
          </g>
        )}
        {k >= 4 && <Bubble x={288} y={106 - 50} side="left" lines={["টানের কতটা সিঁড়ি বরাবর,", "আর কতটা বাকি?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the answer on cards,
//      (4, 2) = (3, 3) + (1, −1), the box check (1, −1) · (1, 1) = 0, and
//      মাঝি চাচা handing ফাহিম a ডাব.

export function DabTreat() {
  const s = useScene(3, [600, 1800, 1600, 1800]);
  const k = s.k;
  const [dx, dy] = useTween([k >= 3 ? S8_BOAT + 18 : 276, k >= 3 ? S1_WL - 44 : 76], 1400);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={100} label="(4, 2) = (3, 3) + (1, −1), আর (1, −1) · (1, 1) = 0; মাঝি চাচা খুশি হয়ে ফাহিমকে ডাব দেন">
        <T_Water top={124} />
        <T_Ghat />
        <T_Boat x={S8_BOAT} y={S1_WL} />
        <path d={`M${S8_BOAT + 58} ${S1_WL - 13}L${S8_POST[0]} ${S8_POST[1]}`} stroke="#78350f" strokeWidth={1.6} />
        <Person who="fahim" x={S8_BOAT + 8} y={S1_WL - 10} scale={0.75} ms={0} mood={k >= 3 ? "happy" : "plain"} arm={k >= 3 ? "hold" : "down"} />
        <T_Majhi x={288} y={106} facing={-1} pose={k >= 2 ? "hold" : "down"} mood={k >= 2 ? "happy" : "plain"} name="মাঝি চাচা" />
        <CastCard x={52} y={22} text="(4, 2)" tone="coral" />
        <text x={86} y={26} textAnchor="middle" fontSize={11} fontWeight={800} fill={T_INK}>
          =
        </text>
        <CastCard x={120} y={22} text="(3, 3)" tone="teal" />
        <text x={154} y={26} textAnchor="middle" fontSize={11} fontWeight={800} fill={T_INK}>
          +
        </text>
        <CastCard x={192} y={22} text="(1, −1)" tone="amber" />
        {k >= 1 && <CastCard x={122} y={48} text="(1, −1) · (1, 1) = 0" tone="blue" />}
        {k >= 2 && (
          <g style={{ transform: `translate(${dx}px, ${dy}px)` }} className={FADE}>
            <T_Dab />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for the ending's teaser, no task: the পাঠাগার in the
//      evening. The আপা's new computer; ফাহিম types “মাছ”; two machines, two
//      top answers (a thick book, a small letter); which one to keep is left
//      open for 4.6.

/** The পাঠাগার's desk with its new computer; the screen shows `show` of: nothing, the search, both answers. */
function T_Computer({ show }: { show: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={70} y={10} width={44} height={120} fill="#a16207" opacity={0.35} />
      {[34, 64, 94].map((y) => (
        <g key={y}>
          <rect x={72} y={y - 2} width={40} height={2.5} fill="#78350f" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={74 + i * 6} y={y - 16 - (i % 2) * 2} width={4.5} height={14 + (i % 2) * 2} fill={["#dc2626", "#2563eb", "#16a34a", "#d97706"][i % 4]} />
          ))}
        </g>
      ))}
      <rect x={112} y={118} width={120} height={8} fill="#92400e" />
      <rect x={118} y={126} width={6} height={24} fill="#78350f" />
      <rect x={220} y={126} width={6} height={24} fill="#78350f" />
      <rect x={122} y={40} width={100} height={66} rx={4} fill="#1e293b" />
      <rect x={126} y={44} width={92} height={58} rx={2} fill="white" />
      <rect x={166} y={106} width={12} height={12} fill="#334155" />
      {show >= 1 && (
        <g className={FADE}>
          <rect x={132} y={49} width={80} height={12} rx={6} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={0.8} />
          <text x={140} y={58.5} fontSize={8} fontWeight={700} fill={T_INK}>
            মাছ
          </text>
        </g>
      )}
      {show >= 2 && (
        <g className={FADE}>
          <path d="M172 65V98" stroke="#cbd5e1" strokeWidth={0.8} />
          <text x={149} y={72} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#475569">
            machine ১
          </text>
          <text x={195} y={72} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#475569">
            machine ২
          </text>
          <rect x={138} y={77} width={22} height={17} rx={1.5} fill="#1d4ed8" />
          <rect x={138} y={77} width={4} height={17} fill="#1e3a8a" />
          <rect x={187} y={80} width={16} height={11} fill="#fef3c7" stroke="#b45309" strokeWidth={0.8} />
          <path d="M187 80l8 6l8 -6" fill="none" stroke="#b45309" strokeWidth={0.8} />
        </g>
      )}
    </g>
  );
}

export function LibraryTwo({}: Story) {
  const s = useScene(4, [600, 1500, 1600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={150} label="সন্ধ্যায় পাঠাগারে আপার নতুন কম্পিউটার; ফাহিম মাছ লিখে সার্চ দেয়; এক machine দেখায় মোটা বই, আরেকটা ছোট চিঠি; আপা ভাবেন কোনটা রাখবেন">
        <T_Computer show={k >= 3 ? 2 : k >= 2 ? 1 : 0} />
        <Person who="rina" x={282} y={150} facing={-1} scale={0.9} mood={k >= 4 ? "puzzled" : "plain"} />
        <text x={282} y={161} textAnchor="middle" fontSize={8} fontWeight={700} fill={T_INK}>
          পাঠাগারের আপা
        </text>
        <Person who="fahim" x={k >= 1 ? 100 : -30} y={150} walking={k === 1} ms={1400} scale={0.9} arm={k === 2 ? "point" : "down"} mood={k >= 3 ? "puzzled" : "plain"} label={k >= 1} />
        {k >= 4 && <Bubble x={282} y={150 - 60} side="left" tone="think" lines={["কোন machine", "রাখবো?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  RopeBet: { start: {}, bet: { bet: 0 } },
  SplitPull: { start: {}, some: { w: [4, 3], hit: [2] }, all: { w: [0, 3], hit: [0, 1, 2] } },
  FindFoot: { start: {}, near: { lam: 0.45 }, found: { lam: FOOT, found: true } },
  ShadowRecipe: { start: {}, half: { k: 3 }, all: { k: 5 } },
  SidePull: { start: {}, free: { guess: 1, free: true, seen: [true] } },
  LongRope: { start: {}, short: { rope: 4, seen: [0] }, long: { rope: 15, seen: [0, 1, 2] } },
  KeepShadows: { start: {}, along: { mode: 1, seen: [1] }, across: { mode: 2, seen: [1, 2] } },
  YourShadow: { start: {}, miss: { done: 2, miss: 1 }, all: { done: 5 } },
  // Story scenes and figures: `k` is the beat shown (no seed shows the last).
  GunTana: { rest: { k: 0 }, ashore: { k: 2 }, ask: { k: 4 }, done: {} },
  SlantRope: { rest: { k: 0 }, side: { k: 1 }, done: {}, step: { k: 2, stepping: true } },
  ShadowDrop: { rest: { k: 0 }, sun: { k: 1 }, rest3: { k: 3 }, done: {} },
  EastEasy: { first: { k: 1 }, second: { k: 2 }, done: {} },
  RiverBend: { rest: { k: 0 }, river: { k: 2 }, done: {} },
  SevenThirteen: { rest: { k: 0 }, ticks: { k: 1 }, done: {} },
  WhySeven: { two: { k: 2 }, done: {} },
  RecipeAloud: { div: { k: 3 }, done: {} },
  AnyRiver: { first: { k: 0 }, east: { k: 1 }, third: { k: 2 }, done: {} },
  RudderMan: { rest: { k: 0 }, where: { k: 2 }, done: {} },
  RudderHolds: { rest: { k: 0 }, alone: { k: 1 }, hal: { k: 2 }, done: {} },
  ZeroNotMinus: { rest: { k: 0 }, zero: { k: 2 }, done: {} },
  RopeFan: { rest: { k: 0 }, short: { k: 1 }, done: {} },
  SagRope: { rest: { k: 0 }, sag: { k: 1 }, snag: { k: 2 }, done: {} },
  FahimIdea: { rest: { k: 0 }, one: { k: 1 }, cloud: { k: 2 }, done: {} },
  OnePoint: { rest: { k: 0 }, along: { k: 2 }, done: {} },
  FewNumbers: { rest: { k: 0 }, few: { k: 2 }, done: {} },
  GhatRiddle: { rest: { k: 0 }, cards: { k: 3 }, done: {} },
  DabTreat: { rest: { k: 0 }, done: {} },
  LibraryTwo: { rest: { k: 0 }, search: { k: 2 }, done: {} },
};

