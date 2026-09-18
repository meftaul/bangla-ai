"use client";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Ticks, pill, primaryBtn, useSeed, type Fixtures } from "@/components/journey/kit";
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
const ROPE_BET = ["ঠিক, লম্বা দড়িতে টান কম নষ্ট হয়", "দড়ির দৈর্ঘ্যে কিছু যায় আসে না, টান তো একই", "উল্টো, ছোট দড়িতে টান কাছ থেকে আসে, তাই বেশি কাজের"];

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
};

