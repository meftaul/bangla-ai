"use client";

import { useId, useState } from "react";
import { BoxRun, Tup, dot, num, tupN } from "@/components/journey/box";
import { Bubble, Card as CastCard, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, Ticks, pill, primaryBtn, usePlay, useScene, useSeed, useSeeded, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Label, Plane, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { O, S1_WL, T_Boat, T_Dab, T_INK, T_Majhi, T_Square, T_Water, T_say, fix, tupF, type Story } from "./towrope-journey";

// Screens for "Math for AI 4.6 — বাঁকা নদী: shadow এর মাথা কোথায় পড়ে", told as a
// Journey. The second half of the tow: 4.6 settled the straight river (the pull
// splits, the leftover only drags the boat to the bank, a long rope wastes
// less). Here the river bends, so "how much of the pull goes forward" can no
// longer be read off a slot — it has to be worked out.
//
// The sum is taken apart one piece per screen, because it is the hardest thing
// in Article 4: the foot of the shadow by hand (FindFoot), what share of the
// river that is (ShareWalk), where the 7 comes from (SevenFromBox), where the
// 13 comes from (ThirteenFromRiver), and only then the whole machine
// (ShadowRecipe). Every screen carries the same legend — blue is নদী, red is
// দড়ি — because the two arrows are what the reader must never lose track of.
//
// Eleven screens: 1 recalls box 0 = right angle as a picture (BoxRecall); 2 the
// bend and মাঝি চাচা's question, the foot found by sliding (FindFoot); 3–5 the
// pieces; 5b the share turned into an address, why 7/13 multiplies both slots
// (ShareToPoint); 6 the machine, with what বাকি is (BakiPull); 7 a second bend before the ghat, the Try it
// (TapFoot); 8 মাঝি চাচা's riddle at the ghat, your turn (YourShadow); 9 the
// PCA payoff (KeepShadows); 10 the end. Story scenes and figures follow the
// screens, numbered after them (1a, 2a, 2½, …); the ending carries a recap
// (RecapBend, 10b) as well as the library teaser.
//
// The boat, the মাঝি and the river are drawn in towrope-journey.tsx and
// imported: same story, same ink.

/** নদী blue, দড়ি red — pinned on every screen of this journey, so the two
 *  arrows are never in doubt. `now` names the piece being worked on. */
export function Legend({ now, blue = "নদী" }: { now?: string; blue?: string }) {
  return (
    <div className="mx-auto mb-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[0.78rem]">
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-0.5 w-4 rounded-full bg-cat-blue" />
        <b className="text-cat-blue">{blue}</b> <span className="font-mono text-muted">v</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="inline-block h-0.5 w-4 rounded-full bg-cat-coral" />
        <b className="text-cat-coral">দড়ির টান</b> <span className="font-mono text-muted">w</span>
      </span>
      {now && <span className="text-muted">· {now}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · The recall at the door, as a picture: (2, 1) · (−1, 2) — which of three
//     drawings is this pair? A pick runs the box (it says 0 every time, because
//     the numbers are the numbers), then draws the real second arrow: a right
//     angle, with its corner mark. A wrong pick leaves its own arrow behind,
//     dashed red, so the reader sees where they thought it went.

const BR_W: XY = [2, 1];
const BR_V: XY = [-1, 2];
const BR_OPTS: { v: XY; box: string; say: string }[] = [
  { v: [1, 2], box: "4", say: "একই দিকে" },
  { v: [-1, -2], box: "−4", say: "উল্টা দিকে" },
  { v: [-1, 2], box: "0", say: "right angle" },
];
const BR_RIGHT = 2;
const BR_F = makeFrame(-1.4, 2.4, -2.3, 2.3, 30);

/** one pair as a small picture for a Choice: (2, 1) in coral, the other in blue */
function BR_Pic({ v }: { v: XY }) {
  const c = (p: XY) => `${32 + p[0] * 13} ${32 - p[1] * 13}`;
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="mx-auto block h-auto w-full max-w-[3.8rem]">
      <path d={`M${c(O)}L${c(BR_W)}`} strokeWidth={2.6} strokeLinecap="round" className="stroke-cat-coral" />
      <path d={`M${c(O)}L${c(v)}`} strokeWidth={2.6} strokeLinecap="round" className="stroke-cat-blue" />
      <circle cx={32} cy={32} r={2.4} className="fill-current" />
    </svg>
  );
}

export function BoxRecall() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const seeded = useSeeded();
  const p = usePlay(1700);
  // 0 nothing yet, 1 the box runs, 2 the real arrow draws (and a wrong guess stays, dashed)
  const k = pick === null ? 0 : seeded ? 2 : p.k;
  const right = pick === BR_RIGHT;
  const uw: XY = [BR_W[0] / Math.hypot(...BR_W), BR_W[1] / Math.hypot(...BR_W)];
  const uv: XY = [BR_V[0] / Math.hypot(...BR_V), BR_V[1] / Math.hypot(...BR_V)];

  const choose = (i: number) => {
    setPick(i);
    if (i !== BR_RIGHT) setMiss(miss + 1);
    p.play(
      2,
      () => {
        if (i === BR_RIGHT) pass("Dot product 0 মানে right angle.");
      },
      1,
    );
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-[20rem] items-center gap-2">
        <div className="w-full max-w-[8.5rem] shrink-0">
          <Plane f={BR_F} ticks={1} label={k >= 2 ? "(2, 1) আর (−1, 2), right angle এ" : "(2, 1) আঁকা, (−1, 2) এখনো আঁকা হয় নাই"} className="my-0! max-w-none">
            <Arrow f={BR_F} from={O} to={BR_W} tone="coral" w={2.6} />
            {pick !== null && k >= 2 && !right && <Arrow key={`g${pick}-${miss}`} f={BR_F} from={O} to={BR_OPTS[pick].v} tone="danger" w={2} dashed />}
            {pick !== null && k >= 2 && <Arrow key={`v${pick}-${miss}`} f={BR_F} from={O} to={BR_V} tone="blue" w={2.6} draw />}
            {pick !== null && k >= 2 && (
              <g style={{ transitionDelay: "600ms" }} className={FADE}>
                <path
                  d={`M${BR_F.sx(uw[0] * 0.3)} ${BR_F.sy(uw[1] * 0.3)}L${BR_F.sx((uw[0] + uv[0]) * 0.3)} ${BR_F.sy((uw[1] + uv[1]) * 0.3)}L${BR_F.sx(uv[0] * 0.3)} ${BR_F.sy(uv[1] * 0.3)}`}
                  strokeWidth={1.4}
                  className="pointer-events-none fill-none stroke-[#0f1b2d]/70"
                />
              </g>
            )}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 text-center">
          {k >= 1 ? (
            <BoxRun key={`${pick}-${miss}`} a={BR_W} b={BR_V} aName="a" bName="b" ms={450} dense />
          ) : (
            <>
              <div className="font-mono text-lg font-bold">
                <span className="text-cat-coral">(2, 1)</span> · <span className="text-cat-blue">(−1, 2)</span>
              </div>
              <div className="mt-1 text-sm text-muted">Dot product কত, আর জোড়াটা দেখতে কেমন?</div>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {BR_OPTS.map((o, i) => (
          <Choice key={o.box} n={i} look={pick === i && k >= 2 ? (i === BR_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={right} onClick={() => choose(i)}>
            <BR_Pic v={o.v} />
            <div className="text-center font-mono text-sm font-bold">{o.box}</div>
            <div className="text-center text-[0.7rem] leading-tight">{o.say}</div>
          </Choice>
        ))}
      </div>
      {pick !== null && k >= 2 && !right && (
        <Nope key={miss}>Dot product বললো 0, {BR_OPTS[pick].box} না। লাল দাগে ছিল আপনার ছবি। নীল arrow টা আসলে গেলো কোথায়? দেখুন।</Nope>
      )}
      <Task done={right}>(2, 1) · (−1, 2) এর ছবি কোনটা? একটা বেছে নিন, dot product নিজেই চলবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Find the foot. The river bends: v = (2, 3), the rope w = (2, 1). A
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
      pass("মাথার উপরে line টা square। Dot product বলে 0.");
      return;
    }
    setLam(x);
  };

  return (
    <>
      <Legend now="মাথা কোথায়" />
      <Plane f={FF} ticks={1} label={`নদী (2, 3), দড়ি (2, 1), নদীর উপরে একটা point ${tupF(P)}`} className="max-w-[14rem]">
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
        {/* found: the corner mark pops in where the line meets the river square */}
        {found && <T_Square f={FF} at={P} a={[-V[0] / Math.hypot(...V), -V[1] / Math.hypot(...V)]} b={[gap[0] / Math.hypot(...gap), gap[1] / Math.hypot(...gap)]} size={0.26} />}
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
          aria-label="নদীর arrow এর কত অংশ"
          onChange={(e) => slide(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)] disabled:cursor-default"
        />
        <span className="font-mono text-sm text-muted">1</span>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        <b className="font-mono">{found ? "7/13" : fix(lam, 2)}</b> — নদীর এতটুকু অংশ, point <span className="font-mono">{tupF(P)}</span>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        line · নদী ={" "}
        <b key={String(found)} className={`font-mono ${found ? `${POP} inline-block text-accent-text` : ""}`}>
          {found ? "0" : fix(box, 2)}
        </b>
      </div>
      <Task done={found}>নদী বরাবর point টা slide করুন। কোথায় দড়ির মাথা থেকে নামা line টা নদীর সাথে right angle এ মিলে? ওখানে dot product বলবে 0.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · কত অংশ? The foot is found, but "somewhere along the river" is not a
//      number. The reader cuts the নদী arrow into equal parts until a tick
//      lands exactly on the foot — only 13 does — and then walks the boat tick
//      by tick and counts: 7. So the share is 7/13, felt before it is derived.

const SW_MAX = 16;

export function ShareWalk() {
  const pass = useGate();
  const [parts, setParts] = useSeed("parts", 4);
  const [step, setStep] = useSeed("step", 0);
  const [walked, setWalked] = useSeed("walked", false);
  const fits = parts === 13;
  const foot: XY = [FOOT * V[0], FOOT * V[1]];
  const at: XY = [(step / parts) * V[0], (step / parts) * V[1]];

  const cut = (n: number) => {
    setParts(n);
    setStep(0);
    setWalked(false);
  };
  const walk = () => {
    if (step >= 7) return;
    const next = step + 1;
    setStep(next);
    if (next === 7) {
      setWalked(true);
      pass("নদীর 13 ভাগের 7 ভাগ। ওখানেই shadow এর মাথা।");
    }
  };

  return (
    <>
      <Legend now={fits ? "13 ভাগ" : `${parts} ভাগ`} />
      <Plane f={FF} ticks={0} label={`নদীকে ${parts} ভাগ করা হলো; shadow এর মাথা ${fits ? "ঠিক 7 নম্বর দাগে" : "কোনো দাগে পড়ে নাই"}`} className="max-w-[10.5rem]">
        <Arrow f={FF} from={O} to={V} tone="blue" w={2.4} />
        <Arrow f={FF} from={O} to={W} tone="coral" w={2.2} faint />
        <path d={`M${FF.sx(W[0])} ${FF.sy(W[1])}L${FF.sx(foot[0])} ${FF.sy(foot[1])}`} strokeWidth={1.2} strokeDasharray="4 3" className="pointer-events-none stroke-[#0f1b2d]/35" />
        {Array.from({ length: parts - 1 }, (_, i) => {
          const t = (i + 1) / parts;
          const c: XY = [t * V[0], t * V[1]];
          const n: XY = [-3 / Math.sqrt(13), 2 / Math.sqrt(13)];
          const h = 0.12;
          const on = fits && i === 6;
          return (
            <path
              key={`${parts}-${i}`}
              d={`M${FF.sx(c[0] - n[0] * h)} ${FF.sy(c[1] - n[1] * h)}L${FF.sx(c[0] + n[0] * h)} ${FF.sy(c[1] + n[1] * h)}`}
              strokeWidth={on ? 2.4 : 1.2}
              className={`pointer-events-none ${on ? "stroke-accent" : "stroke-[#0f1b2d]/55"} ${POP}`}
            />
          );
        })}
        <circle cx={FF.sx(foot[0])} cy={FF.sy(foot[1])} r={5} className={`pointer-events-none ${fits ? "fill-accent" : "fill-none stroke-[#0f1b2d]/60"}`} strokeWidth={1.6} />
        {/* the boat, seen from above, rides the river one cut per tap */}
        {fits && (
          <g
            style={{ transform: `translate(${FF.sx(at[0])}px, ${FF.sy(at[1])}px) rotate(-56.3deg)` }}
            className="pointer-events-none transition-transform duration-500 motion-reduce:transition-none"
          >
            <path d="M-12 0Q-6 -5 5 -4.5L13 0L5 4.5Q-6 5 -12 0Z" className="fill-[#92400e]" />
            <circle cx={-1} r={2} className="fill-[#78350f]" />
          </g>
        )}
        <Label f={FF} at={V} dx={-4} dy={-4} anchor="end" className="fill-cat-blue">
          নদী
        </Label>
        <Label f={FF} at={W} dx={6} dy={4} anchor="start" className="fill-cat-coral">
          দড়ি
        </Label>
      </Plane>

      <Stepper value={parts} onChange={cut} min={2} max={SW_MAX} disabled={walked} label="নদীকে কয় ভাগ করবো" />

      <div className="mt-1 min-h-10 text-center text-[0.95rem]">
        {fits ? (
          <span key="fit" className={FADE}>
            13 ভাগ করলে একটা দাগ ঠিক মাথার উপরে পড়লো।{" "}
            {step > 0 && (
              <b className="font-mono text-accent-text">
                {step} ধাপ{walked ? " — পৌঁছে গেছি।" : "…"}
              </b>
            )}
          </span>
        ) : (
          <span key={parts} className={FADE}>
            {parts} ভাগে কোনো দাগ মাথার উপরে পড়ে না।
          </span>
        )}
      </div>

      {fits && !walked && (
        <div className={`${FADE} mt-1 flex justify-center`}>
          <button type="button" onClick={walk} className={primaryBtn}>
            এক ধাপ হাঁটুন
          </button>
        </div>
      )}

      <Task done={walked}>নদীকে ভাগ করতে থাকুন, যতক্ষণ না একটা দাগ মাথার উপরে পড়ে। তারপর গুনুন, কয় ধাপ।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · 7 এলো কোথা থেকে? The reader walked 7 steps. Now run the box of দড়ি and
//      নদী: 2 × 2 + 1 × 3 = 7। The same 7. The box counted the steps without
//      anybody walking.

export function SevenFromBox() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const [matched, setMatched] = useSeed("matched", false);
  const foot: XY = [FOOT * V[0], FOOT * V[1]];

  const match = () => {
    setMatched(true);
    pass("দড়ি · নদী = 7। Dot product-ই ধাপ গুনে দিলো।");
  };

  return (
    <>
      <Legend now="7 কোথা থেকে" />
      <div className="flex items-start gap-2">
        <Plane f={FF} ticks={0} label="নদী 13 ভাগে কাটা, 7 নম্বর দাগে shadow এর মাথা" className="max-w-[8.5rem] shrink-0">
          <Arrow f={FF} from={O} to={V} tone="blue" w={2.2} />
          <Arrow f={FF} from={O} to={W} tone="coral" w={2.2} />
          {Array.from({ length: 12 }, (_, i) => {
            const t = (i + 1) / 13;
            const c: XY = [t * V[0], t * V[1]];
            const n: XY = [-3 / Math.sqrt(13), 2 / Math.sqrt(13)];
            const h = i === 6 ? 0.2 : 0.1;
            const lit = matched && i <= 6;
            return (
              <path
                key={i}
                d={`M${FF.sx(c[0] - n[0] * h)} ${FF.sy(c[1] - n[1] * h)}L${FF.sx(c[0] + n[0] * h)} ${FF.sy(c[1] + n[1] * h)}`}
                strokeWidth={i === 6 ? 2 : 1}
                style={{ transitionDelay: `${i * 70}ms` }}
                className={`pointer-events-none ${lit ? "stroke-accent" : "stroke-[#0f1b2d]/55"} transition-colors duration-500 motion-reduce:transition-none`}
              />
            );
          })}
          <circle cx={FF.sx(foot[0])} cy={FF.sy(foot[1])} r={4} className="pointer-events-none fill-accent" />
        </Plane>
        <div className="min-w-0 flex-1">
          {ran ? (
            <BoxRun a={W} b={V} aName="দড়ি" bName="নদী" dense />
          ) : (
            <div className="grid h-full place-content-center">
              <button type="button" onClick={() => setRan(true)} className={primaryBtn}>
                Dot product চালান
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 min-h-10 text-center text-[0.95rem]">
        {matched ? (
          <span className={FADE}>
            আপনি হেঁটেছেন <b className="font-mono">7</b> ধাপ। Dot product-ও বললো <b className="font-mono text-accent-text">7</b>. এক জিনিস।
          </span>
        ) : ran ? (
          <span className={FADE}>Dot product বললো 7। আর আপনি হেঁটেছিলেন কয় ধাপ?</span>
        ) : (
          <span className="text-muted">দড়ি আর নদীর dot product চালিয়ে দেখুন কী আসে।</span>
        )}
      </div>

      {ran && !matched && (
        <div className={`${FADE} mt-1 flex justify-center`}>
          <button type="button" onClick={match} className={primaryBtn}>
            ধাপের সাথে মিলিয়ে দেখুন
          </button>
        </div>
      )}

      <Task done={matched}>Dot product চালান। তারপর সংখ্যাটা মিলিয়ে দেখুন, আপনার হাঁটা ধাপের সাথে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · 13 এলো কোথা থেকে? The number of parts is the river's own box. The reader
//       squares each slot — the squares appear as real tiles, 2×2 and 3×3 —
//       and the 13 tiles line up against the 13 cuts on the river. 4.1's
//       v · v = ‖v‖², seen instead of recalled.

const TR_TILE = 13;

export function ThirteenFromRiver() {
  const pass = useGate();
  const [sq, setSq] = useSeed<number[]>("sq", []);
  const [added, setAdded] = useSeed("added", false);
  const both = sq.length === 2;

  const square = (i: number) => {
    if (sq.includes(i)) return;
    const next = [...sq, i];
    setSq(next);
  };
  const add = () => {
    setAdded(true);
    pass("নদীর নিজের dot product 13। তাই 13 ভাগ।");
  };

  return (
    <>
      <Legend now="13 কোথা থেকে" />
      <div className="mx-auto grid w-full max-w-[17rem] grid-cols-2 gap-2">
        {[0, 1].map((i) => {
          const n = V[i];
          const on = sq.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => square(i)}
              disabled={on}
              className={`cursor-pointer rounded-xl border-2 px-2 py-1.5 transition-colors duration-300 disabled:cursor-default motion-reduce:transition-none ${
                on ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <div className="text-[0.7rem] text-muted">নদীর slot {i + 1}</div>
              <div className="font-mono text-lg font-bold text-cat-blue">{n}</div>
              <div className="mt-1 flex h-14 items-end justify-center">
                {on ? (
                  <svg viewBox="0 0 40 40" aria-hidden="true" className="h-14 w-14">
                    {Array.from({ length: n * n }, (_, k) => (
                      <rect
                        key={k}
                        x={2 + (k % n) * (34 / n)}
                        y={38 - Math.floor(k / n) * (34 / n) - 34 / n}
                        width={34 / n - 2}
                        height={34 / n - 2}
                        rx={1.5}
                        style={{ transitionDelay: `${k * 45}ms` }}
                        className={`fill-cat-blue/70 ${POP}`}
                      />
                    ))}
                  </svg>
                ) : (
                  <span className="text-xs text-cat-blue">বর্গ করুন</span>
                )}
              </div>
              <div className="font-mono text-sm">{on ? `${n} × ${n} = ${n * n}` : "?"}</div>
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-2 flex min-h-8 w-full max-w-[17rem] flex-wrap justify-center gap-0.5">
        {added &&
          Array.from({ length: TR_TILE }, (_, k) => (
            <span key={k} style={{ transitionDelay: `${k * 55}ms` }} className={`inline-block h-3.5 w-3.5 rounded-[2px] bg-accent ${POP}`} />
          ))}
      </div>

      <div className="mt-1 min-h-10 text-center text-[0.95rem]">
        {added ? (
          <span className={FADE}>
            13 টা ঘর। নদীকে আমরা ভাগও করেছিলাম <b className="font-mono text-accent-text">13</b> ভাগে। এটাই নদীর নিজের dot product, <span className="font-mono">v · v</span>.
          </span>
        ) : both ? (
          <span className={FADE}>4 আর 9। যোগ করলে?</span>
        ) : (
          <span className="text-muted">নদীর দুইটা slot-ই বর্গ করুন।</span>
        )}
      </div>

      {both && !added && (
        <div className={`${FADE} mt-1 flex justify-center`}>
          <button type="button" onClick={add} className={primaryBtn}>
            দুইটা যোগ করুন
          </button>
        </div>
      )}

      <Task done={added}>নদীর প্রতিটা slot বর্গ করুন, তারপর যোগ করে দেখুন কয়টা ঘর হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The recipe, step by step: w · v = 7, v · v = 13, so the shadow is 7/13
//     of v, (14/13, 21/13); the leftover w − shadow is (12/13, −8/13); and the
//     leftover's box with the river is 24/13 − 24/13 = 0. The বাকি tap plays
//     out: the leftover glows where it sits, a copy slides down to (0, 0), and
//     its two legs grow — 2 − 1.08 = 0.92 right, 1 − 1.62 = −0.62 down — so the
//     reader sees where (0.92, −0.62) comes from before the line lands.

// Each line carries `say`: what it means in plain words, shown under the sheet
// for the line just run, so the reader never meets a number without its story.
const RECIPE: { btn: string; line: string; say: string; box?: [readonly number[], readonly number[], string, string] }[] = [
  { btn: "দড়ি · নদী", line: "w · v = 7", say: "দড়ি আর নদীর dot product: সেই 7 ধাপ।", box: [[2, 1], [2, 3], "w", "v"] },
  { btn: "নদী · নদী", line: "v · v = 13", say: "নদীর নিজের dot product: সেই 13 ভাগ।", box: [[2, 3], [2, 3], "v", "v"] },
  { btn: "Shadow বানান", line: "shadow = (7 ÷ 13) × (2, 3) = (14/13, 21/13) ≈ (1.08, 1.62)", say: "নদীর arrow এর দুইটা slot-ই 7/13 দিয়ে গুণ। মাথা 1.08 ঘর ডানে, 1.62 ঘর উপরে।" },
  { btn: "বাকিটা বের করুন", line: "বাকি = w − shadow = (12/13, −8/13) ≈ (0.92, −0.62)", say: "টানের যেটুকু shadow এ ধরা পড়ে নাই। Shadow এর মাথা থেকে দড়ির মাথা পর্যন্ত।" },
  { btn: "বাকি · নদী", line: "বাকি · v = 24/13 − 24/13 = 0", say: "বাকিটা নদীর সাথে right angle এ। সামনের দিকে এক ফোঁটাও টানে না।" },
];
const FR = makeFrame(-0.5, 3, -1, 3.5, 36);
// the বাকি tap's play, one caption per phase; phase 4 is the line itself
const X6_REST: XY = [12 / 13, -8 / 13];
const X6_PH = [
  "এই হলুদ টুকরাটাই বাকি: shadow এর মাথা থেকে দড়ির মাথা পর্যন্ত।",
  "বাকিটাকে তুলে (0, 0) তে বসাই। তাহলে এর ঠিকানা পড়া যায়।",
  "ডানে কত? দড়ি 2 ঘর, shadow 1.08 ঘর। বাকি 2 − 1.08 = 0.92.",
  "উপরে কত? দড়ি 1 ঘর, shadow 1.62 ঘর। 1 − 1.62 = −0.62. মানে 0.62 ঘর নিচে।",
];

export function ShadowRecipe() {
  const pass = useGate();
  const [k, setK] = useSeed("k", 0);
  const shadow: XY = [(7 / 13) * 2, (7 / 13) * 3];
  // the বাকি tap's play: 0 glow, 1 slide to (0, 0), 2 right leg, 3 down leg, 4 the line
  const play = usePlay(1500);
  const [rest] = useSeed("ph", 4);
  const ph = k < 4 ? 0 : k > 4 ? 4 : play.running ? play.k : play.k || rest;
  const [rx, ry] = useTween(ph >= 1 ? [0, 0] : [shadow[0], shadow[1]], 1000);
  const [lx, ly] = useTween([ph >= 2 ? X6_REST[0] : 0, ph >= 3 ? X6_REST[1] : 0], 800);
  const busy = k === 4 && ph < 4;

  const step = () => {
    if (play.running) return;
    setK(k + 1);
    if (k + 1 === 4) play.play(4);
    if (k + 1 === RECIPE.length) pass("Shadow এর formula: (w · v ÷ v · v) × v.");
  };

  return (
    <>
      <Legend now="পুরা হিসাব" />
      <div className="flex items-center gap-2">
        <Plane f={FR} ticks={1} label="দড়ি, তার shadow আর বাকিটা" className="max-w-[8.5rem] shrink-0">
          <Arrow f={FR} from={O} to={V} tone="blue" w={2} faint />
          <Arrow f={FR} from={O} to={W} tone="coral" w={2.2} />
          {k >= 3 && <Arrow f={FR} from={O} to={shadow} tone="teal" w={3} draw />}
          {k >= 3 && (
            <Label f={FR} at={shadow} dx={-5} dy={-2} anchor="end" size={9} weight={700} className={`fill-[#0f766e] ${FADE}`}>
              shadow
            </Label>
          )}
          {/* the leftover glows where it sits while its tap plays out */}
          {k === 4 && (
            <path
              d={`M${FR.sx(shadow[0])} ${FR.sy(shadow[1])}L${FR.sx(W[0])} ${FR.sy(W[1])}`}
              strokeWidth={9}
              strokeLinecap="round"
              className={`pointer-events-none stroke-[#f59e0b] transition-opacity duration-700 motion-reduce:transition-none ${ph === 0 ? "opacity-45" : "opacity-20"} ${FADE}`}
            />
          )}
          {k >= 4 && <Arrow f={FR} from={shadow} to={W} tone="amber" w={2} dashed draw={busy} />}
          {k >= 4 && (
            <Label f={FR} at={[(shadow[0] + W[0]) / 2, (shadow[1] + W[1]) / 2]} dx={2} dy={-8} anchor="start" size={9} weight={700} className={`fill-[#b45309] ${FADE}`}>
              বাকি
            </Label>
          )}
          {/* a copy set down at (0, 0), its two legs read off the axes */}
          {k === 4 && ph >= 2 && (
            <path d={`M${FR.sx(0)} ${FR.sy(0)}H${FR.sx(lx)}`} strokeWidth={4} strokeLinecap="round" className="pointer-events-none stroke-cat-teal/70" />
          )}
          {k === 4 && ph >= 2 && (
            <Label f={FR} at={[X6_REST[0], 0]} dx={3} dy={-3} anchor="start" size={8.5} weight={700} className={`fill-[#0f766e] font-mono ${FADE}`}>
              0.92
            </Label>
          )}
          {k === 4 && ph >= 3 && (
            <path d={`M${FR.sx(X6_REST[0])} ${FR.sy(0)}V${FR.sy(ly)}`} strokeWidth={4} strokeLinecap="round" className="pointer-events-none stroke-cat-violet/60" />
          )}
          {k === 4 && ph >= 3 && (
            <Label f={FR} at={X6_REST} dx={5} dy={4} anchor="start" size={8.5} weight={700} className={`fill-[#6d28d9] font-mono ${FADE}`}>
              −0.62
            </Label>
          )}
          {k >= 4 && ph >= 1 && <Arrow f={FR} from={[rx, ry]} to={[rx + X6_REST[0], ry + X6_REST[1]]} tone="amber" w={2.2} faint={k > 4} />}
          {k >= 5 && <T_Square f={FR} at={shadow} a={[-2 / Math.sqrt(13), -3 / Math.sqrt(13)]} b={[3 / Math.sqrt(13), -2 / Math.sqrt(13)]} size={0.3} />}
        </Plane>
        <div className="grid min-w-0 flex-1 gap-0.5 text-[0.82rem] leading-snug">
          {RECIPE.slice(0, busy ? 3 : k).map((r, i) =>
            // the last box run stays open; the earlier one folds back to its answer
            r.box && i === k - 1 ? (
              <BoxRun key={i} a={r.box[0]} b={r.box[1]} aName={r.box[2]} bName={r.box[3]} dense />
            ) : (
              <div key={i} className={`${FADE} ${i === RECIPE.length - 1 ? "font-bold text-accent-text" : ""}`}>
                {r.line}
              </div>
            ),
          )}
          {/* the leftover's address, slot by slot: rope minus shadow */}
          {k === 4 && ph >= 2 && (
            <div className={`${FADE} text-[0.75rem] text-cat-teal`}>
              ডানে: <span className="font-mono">2 − 1.08 = 0.92</span>
            </div>
          )}
          {k === 4 && ph >= 3 && (
            <div className={`${FADE} text-[0.75rem] text-cat-violet`}>
              উপরে: <span className="font-mono">1 − 1.62 = −0.62</span>
            </div>
          )}
          {k === 0 && <div className="text-sm text-muted">দড়ি w = (2, 1), নদী v = (2, 3)</div>}
        </div>
      </div>
      <div className="mt-2 min-h-10 text-center text-[0.9rem] leading-snug">
        {k > 0 && (
          <span key={busy ? `p${ph}` : k} className={FADE}>
            {busy ? X6_PH[ph] : RECIPE[k - 1].say}
          </span>
        )}
      </div>
      {k < RECIPE.length && !busy && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={step} className={primaryBtn}>
            {RECIPE[k].btn}
          </button>
        </div>
      )}
      <Task done={k >= RECIPE.length}>হিসাবটা এক step এক step করে চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5b · ঠিকানা। The share is 7/13, but a dot on Fahim's khata needs an
//      address: how many squares right, how many up. The boat rides the river
//      the whole way, then half way, and a bar on each axis shows its address:
//      both numbers halve together. Then the reader picks the address at 7/13
//      from three, and each pick sails the boat there. Shrinking only one slot
//      runs it aground off the river; shrinking both lands it on the shadow's
//      head. This is why the recipe multiplies (2, 3) by 7/13.

const SP_F = makeFrame(-0.6, 2.6, -0.5, 3.4, 40);
const SP_SHARES = [
  { btn: "পুরা পথ", t: 1, say: "পুরা পথ: 2 ঘর ডানে, 3 ঘর উপরে।" },
  { btn: "আধা পথ", t: 0.5, say: "আধা পথ: দুইটাই আধা। 1 ঘর ডানে, 1.5 ঘর উপরে।" },
];
const SP_PICKS: { top: string; approx: string; at: XY }[] = [
  { top: "(7/13 × 2, 3)", approx: "≈ (1.08, 3)", at: [(7 / 13) * 2, 3] },
  { top: "(7/13 × 2, 7/13 × 3)", approx: "≈ (1.08, 1.62)", at: [(7 / 13) * 2, (7 / 13) * 3] },
  { top: "(2, 7/13 × 3)", approx: "≈ (2, 1.62)", at: [2, (7 / 13) * 3] },
];
const SP_RIGHT = 1;
const SP_NOPE = [
  "নৌকা নদী ছেড়ে চরে উঠলো। শুধু ডানের 2 ছোট হলো, উপরের 3 পুরাই রইলো। আধা পথে দুইটাই আধা হয়েছিল, মনে আছে?",
  "",
  "আবার চরে। এবার উপরেরটা ছোট হলো, ডানের 2 পুরাই রইলো। নদীর উপরে থাকতে হলে দুইটাকেই একই অংশ দিয়ে ছোট করতে হয়।",
];
const SP_TILT = (Math.atan2(V[1], V[0]) * 180) / Math.PI;

/** The boat seen from above, bow along the river, centred at (x, y) in pixels. */
function SP_Boat({ x, y, tilt }: { x: number; y: number; tilt: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${-tilt})`} className="pointer-events-none">
      <path d="M-12 0Q-6 -5 5 -4.5L13 0L5 4.5Q-6 5 -12 0Z" className="fill-[#92400e]" />
      <circle cx={-1} r={2} className="fill-[#78350f]" />
    </g>
  );
}

export function ShareToPoint() {
  const pass = useGate();
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [last, setLast] = useSeed<number | null>("last", null);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(90);
  const warm = seen.length === SP_SHARES.length;
  const target: XY = pick !== null ? SP_PICKS[pick].at : last !== null ? [SP_SHARES[last].t * V[0], SP_SHARES[last].t * V[1]] : O;
  const [x, y] = useTween([target[0], target[1]], 900);
  const landed = !play.running;
  const right = pick === SP_RIGHT && landed;
  const aground = pick !== null && pick !== SP_RIGHT && landed;
  const foot: XY = [FOOT * V[0], FOOT * V[1]];
  const f = SP_F;

  const sail = (i: number) => {
    if (play.running) return;
    setLast(i);
    if (!seen.includes(i)) setSeen([...seen, i]);
    play.play(10);
  };
  const choose = (i: number) => {
    if (play.running || pick === SP_RIGHT) return;
    setPick(i);
    play.play(10, () => (i === SP_RIGHT ? pass("7/13 পথ মানে দুইটা slot-ই 7/13 গুণ।") : setMiss((m) => m + 1)));
  };

  return (
    <>
      <Legend now="মাথার ঠিকানা" />
      <div className="flex items-center gap-2">
        <div className="w-full max-w-[8.5rem] shrink-0">
          <Plane f={f} ticks={0} label={`নদী (2, 3); নৌকা এখন ${tupF([x, y])} এ`} className="my-0! max-w-none">
            <path d={`M${f.sx(-0.25 * V[0])} ${f.sy(-0.25 * V[1])}L${f.sx(1.12 * V[0])} ${f.sy(1.12 * V[1])}`} strokeWidth={12} strokeLinecap="round" className="pointer-events-none stroke-[#38bdf8]/25" />
            <Arrow f={f} from={O} to={V} tone="blue" w={2.2} />
            <Arrow f={f} from={O} to={W} tone="coral" w={2} faint />
            {/* the shadow's head, found on screens 2–3, waits as a ring */}
            <circle cx={f.sx(foot[0])} cy={f.sy(foot[1])} r={5} strokeWidth={1.6} strokeDasharray={right ? undefined : "2 2"} className={`pointer-events-none ${right ? "fill-accent stroke-accent" : "fill-none stroke-[#0f1b2d]/60"}`} />
            {/* the address: a bar along each axis, dashed guides out to the boat */}
            <path d={`M${f.sx(x)} ${f.sy(0)}V${f.sy(y)}H${f.sx(0)}`} strokeWidth={1} strokeDasharray="3 3" className="pointer-events-none fill-none stroke-[#0f1b2d]/45" />
            <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(x)}`} strokeWidth={5} strokeLinecap="round" className="pointer-events-none stroke-cat-teal/75" />
            <path d={`M${f.sx(0)} ${f.sy(0)}V${f.sy(y)}`} strokeWidth={5} strokeLinecap="round" className="pointer-events-none stroke-cat-violet/60" />
            {x > 0.05 && (
              <Label f={f} at={[x, 0]} dy={13} size={9} weight={700} className="fill-[#0f1b2d] font-mono">
                {fix(x, 2)}
              </Label>
            )}
            {y > 0.05 && (
              <Label f={f} at={[0, y]} dx={-4} dy={3} anchor="end" size={9} weight={700} className="fill-[#0f1b2d] font-mono">
                {fix(y, 2)}
              </Label>
            )}
            {aground && <ellipse cx={f.sx(x)} cy={f.sy(y)} rx={17} ry={9} className={`pointer-events-none fill-[#e7d3a1] ${POP}`} />}
            <SP_Boat x={f.sx(x)} y={f.sy(y)} tilt={aground ? SP_TILT - 30 : SP_TILT} />
            {right && (
              <g className={FADE}>
                <path d={`M${f.sx(W[0])} ${f.sy(W[1])}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={1.3} strokeDasharray="4 3" className="pointer-events-none stroke-accent" />
                <T_Square f={f} at={foot} a={[-2 / Math.sqrt(13), -3 / Math.sqrt(13)]} b={[3 / Math.sqrt(13), -2 / Math.sqrt(13)]} size={0.24} />
              </g>
            )}
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1.5 text-[0.85rem] leading-snug">
          <div>
            ঠিকানা <b className="font-mono">{tupF([x, y])}</b>
          </div>
          {!warm ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {SP_SHARES.map((sh, i) => (
                  <button key={sh.btn} type="button" onClick={() => sail(i)} className={pill(last === i)}>
                    {sh.btn}
                  </button>
                ))}
              </div>
              {last !== null && landed && (
                <div key={last} className={`${FADE} text-[0.8rem]`}>
                  {SP_SHARES[last].say}
                </div>
              )}
            </>
          ) : (
            <>
              {pick === null && <div className="text-[0.75rem] text-muted">{SP_SHARES[1].say}</div>}
              <div key="ask" className={`${FADE} text-[0.8rem]`}>
                7/13 ≈ 0.54. 7/13 পথে ঠিকানা কী?
              </div>
              {SP_PICKS.map((p, i) => (
                <Choice key={p.top} n={i} look={pick === i && landed ? (i === SP_RIGHT ? "right" : "wrong") : "idle"} disabled={right} onClick={() => choose(i)}>
                  <span className="block font-mono text-[0.75rem] leading-tight">{p.top}</span>
                  <span className="block font-mono text-[0.7rem] leading-tight opacity-70">{p.approx}</span>
                </Choice>
              ))}
            </>
          )}
        </div>
      </div>
      {aground && <Nope key={miss}>{SP_NOPE[pick ?? 0]}</Nope>}
      <Task done={right}>নৌকাকে আগে পুরা পথ চালান, তারপর আধা পথ। ঠিকানার দুইটা number কী করে? দেখুন। তারপর 7/13 পথের ঠিকানা বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5b-a · A story scene for screen 5b's setup, no task: Fahim opens his khata
//        on the boat and draws the bent river, 2 squares right, 3 up. The
//        share 7/13 is known, but the pen stops: where does the dot go? From
//        the bank মাঝি চাচা says, first tell me where half way is. The address
//        itself is left for the screen.

const S5B_BANK = 118;
const S5B_BX = 96;

/** Fahim's khata, open, as an inset: squared paper, the river drawn on it, a "?" where the dot must go. */
function S5B_Khata({ ask }: { ask: boolean }) {
  const u = 12;
  const o: XY = [24, 70];
  const at = (p: XY): XY => [o[0] + p[0] * u, o[1] - p[1] * u];
  const tip = at(V);
  const q = at([FOOT * V[0], FOOT * V[1]]);
  return (
    <g className="pointer-events-none">
      <rect x={10} y={8} width={92} height={72} rx={3} fill="white" stroke={T_INK} strokeOpacity={0.35} />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={`v${i}`} d={`M${16 + i * u} 12V76`} stroke="#38bdf8" strokeOpacity={0.35} strokeWidth={0.6} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <path key={`h${i}`} d={`M12 ${10 + i * u}H100`} stroke="#38bdf8" strokeOpacity={0.35} strokeWidth={0.6} />
      ))}
      <Draw d={`M${o[0]} ${o[1]}L${tip[0]} ${tip[1]}`} strokeWidth={2} className="stroke-[#1d4ed8]" />
      <circle cx={tip[0]} cy={tip[1]} r={2.2} fill="#1d4ed8" />
      <path d={`M${o[0]} ${o[1]}L${at(W)[0]} ${at(W)[1]}`} stroke="#be123c" strokeOpacity={0.5} strokeWidth={1.4} />
      {ask && (
        <g className={POP}>
          <circle cx={q[0]} cy={q[1]} r={5} fill="white" stroke="#d97706" strokeWidth={1.4} strokeDasharray="2 2" />
          <text x={q[0]} y={q[1] + 3} textAnchor="middle" fontSize={8} fontWeight={700} fill="#b45309">
            ?
          </text>
        </g>
      )}
      <text x={56} y={89} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={T_INK}>
        ফাহিমের খাতা
      </text>
    </g>
  );
}

export function KhataDot({}: Story) {
  const s = useScene(2, [600, 2200, 2600]);
  const k = s.k;
  const cx = 250;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={100} label="নৌকায় বসে ফাহিম খাতায় বাঁকা নদী আঁকলো; shadow এর মাথার dot কোথায় বসাবে বুঝতে পারছে না; পাড় থেকে মাঝি চাচা বললেন আগে আধা পথের হিসাব দিতে">
        <T_Water top={124} />
        <T_Boat x={S5B_BX} y={S1_WL} />
        <Person who="fahim" x={S5B_BX + 8} y={S1_WL - 10} scale={0.75} ms={0} mood={k === 1 ? "puzzled" : "plain"} arm="hold" />
        <path d={`M${S5B_BX - 14} ${S1_WL - 62}L${cx + 3} ${S5B_BANK - 27}`} stroke="#78350f" strokeWidth={1.4} fill="none" />
        <T_Majhi x={cx - 54} y={S5B_BANK} pose="pull" cloth="#15803d" />
        <T_Majhi x={cx} y={S5B_BANK} pose="pull" name="মাঝি চাচা" />
        {/* the same khata, small, in Fahim's hand */}
        <rect x={S5B_BX + 15} y={S1_WL - 42} width={11} height={8} rx={1} fill="white" stroke={T_INK} strokeOpacity={0.5} strokeWidth={0.8} className="pointer-events-none" />
        <S5B_Khata ask={k >= 1} />
        {k === 1 && <Bubble x={S5B_BX + 8} y={S1_WL - 60} side="right" tone="think" lines={["7/13 অংশ তো বুঝলাম।", "Dot বসাই কোথায়?"]} />}
        {k >= 2 && <Bubble x={cx} y={S5B_BANK - 60} side="left" lines={["আধা পথে কই থাকো,", "আগে হেইডা কও।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5b½ · A figure for screen 5b's explanation, no task: the river's arrow and
//        its two legs (2 right, 3 up) shrink together — to half, then to 7/13
//        — so the tip never leaves the river; the head's address lands last.

const X5T_F = makeFrame(-0.4, 2.6, -0.5, 3.4, 34);
const X5T_T = [1, 0.5, FOOT, FOOT];
const X5T_SAY = [
  "নদীর arrow এর দুই পা: 2 ঘর ডানে, 3 ঘর উপরে।",
  "আধা পথ: arrow আধা, দুই পা-ও আধা। 1 আর 1.5.",
  "7/13 পথ: দুই পা-ই 7/13 হলো। 1.08 আর 1.62.",
  "মাথার ঠিকানা (1.08, 1.62). খাতায় dot টা ওখানেই বসলো।",
];

export function ShrinkBoth() {
  const s = useScene(3, [600, 1800, 2000, 2200]);
  const k = s.k;
  const f = X5T_F;
  const [t] = useTween([X5T_T[k]], 1000);
  const tip: XY = [t * V[0], t * V[1]];
  return (
    <Scene scene={s} caption={T_say(X5T_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[17rem] items-center gap-3">
        <div className="w-full max-w-[8rem] shrink-0">
          <Plane f={f} ticks={0} label="নদীর arrow আর তার দুই পা একসাথে ছোট হয়; মাথা নদীর উপরেই থাকে" className="my-0! max-w-none">
            <Arrow f={f} from={O} to={V} tone="blue" w={2} faint={k >= 1} />
            {k >= 1 && <Arrow f={f} from={O} to={tip} tone="teal" w={3} />}
            <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(tip[0])}`} strokeWidth={4} strokeLinecap="round" className="pointer-events-none stroke-cat-teal/60" />
            <path d={`M${f.sx(tip[0])} ${f.sy(0)}V${f.sy(tip[1])}`} strokeWidth={4} strokeLinecap="round" className="pointer-events-none stroke-cat-violet/55" />
            {k >= 3 && <circle cx={f.sx(tip[0])} cy={f.sy(tip[1])} r={4} className={`pointer-events-none fill-accent ${POP}`} />}
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1 text-[0.85rem]">
          <div className="flex items-baseline gap-2">
            <span className="inline-block h-1 w-4 rounded-full bg-cat-teal/70" />
            ডানে <b className="font-mono">{fix(tip[0], 2)}</b>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="inline-block h-1 w-4 rounded-full bg-cat-violet/60" />
            উপরে <b className="font-mono">{fix(tip[1], 2)}</b>
          </div>
          {k >= 3 && <b className={`${FADE} font-mono text-accent-text`}>(1.08, 1.62)</b>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½c · A figure for screen 6's explanation, no task: what বাকি is. The pull
//        splits into the shadow along the river and the rest from the
//        shadow's head to the rope's head. Laid on the boat by itself the rest
//        points only at the bank — 4.6's yellow part — and its box with the
//        river is 0: none of it pulls forward, so the shadow caught all of it.

const X6C_F = makeFrame(-0.7, 2.9, -1.1, 3.3, 32);
const X6C_SH: XY = [(7 / 13) * V[0], (7 / 13) * V[1]];
const X6C_REST: XY = [W[0] - X6C_SH[0], W[1] - X6C_SH[1]];
const X6C_N: XY = [3 / Math.sqrt(13), -2 / Math.sqrt(13)];
const X6C_SAY = [
  "দড়ির টান (2, 1), নদী (2, 3)।",
  "Shadow: টানের যেটুকু নদী বরাবর। নৌকা এটুকুতেই সামনে যায়।",
  "বাকি: shadow এর মাথা থেকে দড়ির মাথা পর্যন্ত। টানের যেটুকু shadow এ ধরা পড়ে নাই।",
  "বাকিটা একা নৌকায় লাগালে নৌকা শুধু পাড়ের দিকে যায়। 4.6 এর সেই হলুদ part।",
  "বাকি · নদী = 0। সামনের দিকে বাকির এক ফোঁটাও নাই। সামনের পুরা টান shadow এ।",
];

export function BakiPull() {
  const s = useScene(4, [600, 1600, 2400, 2400, 2400]);
  const k = s.k;
  const f = X6C_F;
  // from beat 3 a copy of the rest slides down to start at the boat
  const [cx, cy] = useTween(k >= 3 ? [0, 0] : [X6C_SH[0], X6C_SH[1]], 1200);
  const bank = (t: number): XY => [0.45 * X6C_N[0] + t * V[0], 0.45 * X6C_N[1] + t * V[1]];
  const b0 = bank(-0.3);
  const b1 = bank(1.05);
  const rl = Math.hypot(...X6C_REST);
  return (
    <Scene scene={s} caption={T_say(X6C_SAY, k)}>
      <div className="mx-auto w-full max-w-[10.5rem]">
        <Plane f={f} ticks={0} label="দড়ির টান দুই টুকরা: নদী বরাবর shadow, আর পাড়ের দিকে বাকি; বাকি নদীর সাথে right angle এ" className="my-0! max-w-none">
          <path d={`M${f.sx(-0.3 * V[0])} ${f.sy(-0.3 * V[1])}L${f.sx(1.05 * V[0])} ${f.sy(1.05 * V[1])}`} strokeWidth={0.85 * f.u} className="pointer-events-none stroke-[#38bdf8]/20" />
          <path d={`M${f.sx(b0[0])} ${f.sy(b0[1])}L${f.sx(b1[0])} ${f.sy(b1[1])}`} strokeWidth={2} className="pointer-events-none stroke-[#4d7c0f]" />
          <Label f={f} at={bank(-0.22)} dx={6} dy={4} anchor="start" size={9} weight={700} className="fill-[#4d7c0f]">
            পাড়
          </Label>
          <Arrow f={f} from={O} to={V} tone="blue" w={2} faint />
          <Arrow f={f} from={O} to={W} tone="coral" w={2} faint={k >= 2} />
          {k >= 1 && <Arrow f={f} from={O} to={X6C_SH} tone="teal" w={3} draw />}
          {k >= 2 && <Arrow f={f} from={X6C_SH} to={W} tone="amber" w={2.4} draw={k === 2} faint={k === 3} />}
          {k >= 3 && <Arrow f={f} from={[cx, cy]} to={[cx + X6C_REST[0], cy + X6C_REST[1]]} tone="amber" w={2.4} list="(12/13, −8/13)" />}
          {k >= 4 && (
            <g className={POP}>
              <T_Square f={f} at={X6C_SH} a={[-V[0] / Math.sqrt(13), -V[1] / Math.sqrt(13)]} b={[X6C_REST[0] / rl, X6C_REST[1] / rl]} size={0.26} />
            </g>
          )}
          <SP_Boat x={f.sx(0)} y={f.sy(0)} tilt={SP_TILT} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Keep the shadows. Twelve points lie roughly along a line. Project them
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
    if (next.includes(1) && next.includes(2)) pass("ঠিক line এ shadow নিলে প্রায় কিছুই হারায় না।");
  };

  return (
    <>
      <Plane f={FK} grid={1} axes={false} label="বারোটা point আর তাদের shadow" className="max-w-[18rem]">
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
          ছড়ানোর line এ shadow
        </button>
        <button type="button" onClick={() => go(2)} className={`${pill(mode === 2)} font-sans`}>
          Right angle এর line এ shadow
        </button>
      </div>
      <div className="mt-2 min-h-12 text-center text-[0.95rem]">
        {mode === 0 ? (
          "প্রতিটা point এখন দুইটা number, মোট 24 টা।"
        ) : (
          <span key={mode} className={FADE}>
            প্রতিটা point এখন একটা number, মোট 12 টা। যেটুকু হারালো, তার সবচেয়ে বড়টা <b className={`font-mono ${mode === 2 ? "text-danger" : ""}`}>{num(lost)}</b>.
          </span>
        )}
      </div>
      <Ticks
        items={[
          ["ছড়ানোর line এ", seen.includes(1)],
          ["90° এর line এ", seen.includes(2)],
        ]}
      />
      <Task done={both}>দুইটা line এই shadow নিন। কোনটায় কম হারায়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · এবার আপনার পালা। মাঝি চাচা's riddle at the ghat: (4, 2) onto the
//     stairs (1, 1), five small questions in a row: w · v = 6, v · v = 2,
//     shadow (3, 3), leftover (1, −1), check 0. Wrong tries bounce, each with
//     its own line saying what went wrong; a wrong shadow or leftover is drawn
//     on the sheet in red, so the reader sees it miss.

const ASK: {
  q: string;
  opts: string[];
  ans: number;
  say: string;
  box?: [readonly number[], readonly number[], string, string];
  /** per option: why it is wrong (empty for the right one) */
  nope: string[];
  /** per option: a wrong arrow to draw, [from, to], or null */
  ghost?: ([XY, XY] | null)[];
}[] = [
  {
    q: "w · v কত?",
    opts: ["6", "8", "4"],
    ans: 0,
    say: "w · v = 6",
    box: [[4, 2], [1, 1], "w", "v"],
    nope: ["", "8 আসে 4 × 2 থেকে, দড়ির নিজের দুইটা slot। Dot product এ দড়ির slot গুণ হয় সিঁড়ির slot এর সাথে।", "4 শুধু first slot এর গুণ। Second slot এর গুণটাও যোগ করুন।"],
  },
  {
    q: "v · v কত?",
    opts: ["1", "2", "4"],
    ans: 1,
    say: "v · v = 2",
    box: [[1, 1], [1, 1], "v", "v"],
    nope: ["", "সিঁড়ির slot দুইটা। দুইটারই বর্গ নিয়ে যোগ করুন: 1 × 1 + 1 × 1।", "4 আসে আগে যোগ করে পরে বর্গ করলে। আগে প্রতিটা slot বর্গ, তারপর যোগ।"],
  },
  {
    q: "তাহলে shadow টা কত?",
    opts: ["(6, 6)", "(1.5, 1.5)", "(3, 3)"],
    ans: 2,
    say: "shadow = (6 ÷ 2) × (1, 1) = (3, 3)",
    nope: ["6 দিয়ে গুণ করেছেন, 2 দিয়ে ভাগটা বাদ পড়েছে। দেখুন, লাল arrow টা দড়ির মাথা ছাড়িয়ে কাগজের বাইরে চলে গেছে।", "লাল arrow এর মাথা থেকে দড়ির মাথায় line টা দেখুন, সিঁড়ির সাথে হেলে আছে। 6 ÷ 2 কত?", ""],
    ghost: [[O, [3.9, 3.9]], [O, [1.5, 1.5]], null],
  },
  {
    q: "বাকিটা, w − shadow?",
    opts: ["(1, −1)", "(7, 5)", "(−1, 1)"],
    ans: 0,
    say: "বাকি = (4, 2) − (3, 3) = (1, −1)",
    nope: ["", "(7, 5) আসে যোগ করলে। বাকি মানে দড়ি থেকে shadow বাদ।", "উল্টা দিকে বাদ দিয়েছেন। লাল arrow টা দড়ির মাথা থেকে দূরে যাচ্ছে। বাকিটা যায় shadow এর মাথা থেকে দড়ির মাথায়।"],
    ghost: [null, null, [[3, 3], [2, 4]]],
  },
  {
    q: "বাকি · v কত?",
    opts: ["2", "0", "−2"],
    ans: 1,
    say: "বাকি · v = 1 − 1 = 0। Right angle.",
    nope: ["1 × 1 + (−1) × 1. Minus চিহ্নটা খেয়াল করুন।", "", "1 × 1 হলো +1, আর (−1) × 1 হলো −1। দুইটা যোগ করলে?"],
  },
];
const FY = makeFrame(-0.5, 4.5, -1.5, 3.5, 30);

/** A wrong box or a wrong subtraction, worked the way the reader's pick implies:
 *  the slots it paired get joined by a drawn red arc, then each step of that
 *  working pops in beside it. Slots 0, 1 are the left pair's, 2, 3 the right's.
 *  `strike` crosses out a minus the pick dropped; `flip` marks a minus it added. */
type YS_Slip = { a: [string, string]; b: [string, string]; an: string; bn: string; pairs: [number, number][]; work: string[]; strike?: number; flip?: number };
const YS_SLIPS: Record<string, YS_Slip> = {
  "0-1": { a: ["4", "2"], b: ["1", "1"], an: "w", bn: "v", pairs: [[0, 1]], work: ["4 × 2 = 8"] },
  "0-2": { a: ["4", "2"], b: ["1", "1"], an: "w", bn: "v", pairs: [[0, 2]], work: ["4 × 1 = 4", "2 × 1 বাদ"] },
  "1-0": { a: ["1", "1"], b: ["1", "1"], an: "v", bn: "v", pairs: [[0, 2]], work: ["1 × 1 = 1", "1 × 1 বাদ"] },
  "1-2": { a: ["1", "1"], b: ["1", "1"], an: "v", bn: "v", pairs: [[0, 1]], work: ["1 + 1 = 2", "2 × 2 = 4"] },
  "3-1": { a: ["4", "2"], b: ["3", "3"], an: "w", bn: "shadow", pairs: [[0, 2], [1, 3]], work: ["4 + 3 = 7", "2 + 3 = 5"] },
  "4-0": { a: ["1", "−1"], b: ["1", "1"], an: "বাকি", bn: "v", pairs: [[0, 2], [1, 3]], work: ["1 × 1 = 1", "1 × 1 = 1", "মোট 2"], strike: 1 },
  "4-2": { a: ["1", "−1"], b: ["1", "1"], an: "বাকি", bn: "v", pairs: [[0, 2], [1, 3]], work: ["(−1) × 1 = −1", "(−1) × 1 = −1", "মোট −2"], flip: 0 },
};
const YS_X = [22, 52, 118, 148];

function YS_Working({ slip }: { slip: YS_Slip }) {
  const slots = [...slip.a, ...slip.b];
  return (
    <div className="mx-auto mt-2 flex w-full max-w-[20rem] items-center gap-2">
      <svg viewBox="0 -6 172 52" aria-label={`আপনার হিসাব: ${slip.work.join(", ")}`} className="block h-auto w-full max-w-[11.5rem] shrink-0">
        {/* the two pairs, slot by slot */}
        {[
          [37, slip.an],
          [133, slip.bn],
        ].map(([x, n]) => (
          <text key={n} x={x as number} y={44} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-muted">
            {n}
          </text>
        ))}
        {slots.map((t, i) => (
          <g key={i}>
            <rect x={YS_X[i] - 13} y={12} width={26} height={20} rx={4} className={i < 2 ? "fill-cat-coral/15 stroke-cat-coral" : "fill-cat-blue/15 stroke-cat-blue"} strokeWidth={1.2} />
            <text x={YS_X[i]} y={26} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="ui-monospace" className={slip.flip === i ? "fill-danger" : "fill-current"}>
              {slip.flip === i ? `−${t}` : t}
            </text>
            {/* a minus the pick lost, crossed out */}
            {slip.strike === i && <Draw d={`M${YS_X[i] - 9} 27L${YS_X[i] - 1} 17`} strokeWidth={1.8} delay={200} ms={300} className="stroke-danger" />}
          </g>
        ))}
        {/* the pairs the pick multiplied (or added), drawn as it works */}
        {slip.pairs.map(([x, y], i) => (
          <Draw key={i} d={`M${YS_X[x]} 11Q${(YS_X[x] + YS_X[y]) / 2} ${-10 + i * 6} ${YS_X[y]} 11`} strokeWidth={1.6} delay={150 + i * 350} ms={450} className="stroke-danger" />
        ))}
      </svg>
      <div className="grid min-w-0 flex-1 gap-0.5 text-[0.82rem]">
        {slip.work.map((w, i) => (
          <span key={w} style={{ transitionDelay: `${450 + i * 350}ms` }} className={`${FADE} ${/[ঀ-৿]/.test(w) ? "" : "font-mono"} ${i === slip.work.length - 1 ? "font-bold text-danger" : ""}`}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
const WY: XY = [4, 2];
const VY: XY = [1, 1];

export function YourShadow() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed("miss", 0);
  const [bad, setBad] = useSeed<number | null>("bad", null);
  const all = done === ASK.length;
  const a = ASK[Math.min(done, ASK.length - 1)];
  const ghost = bad === null ? null : (a.ghost?.[bad] ?? null);
  const slip = bad === null ? null : (YS_SLIPS[`${done}-${bad}`] ?? null);
  const fin = usePlay(900);

  const pick = (i: number) => {
    if (all) return;
    if (i !== a.ans) {
      setBad(i);
      setMiss(miss + 1);
      return;
    }
    setBad(null);
    setDone(done + 1);
    // the corner mark lands first, then the pass
    if (done + 1 === ASK.length) fin.play(1, () => pass("(4, 2) দুই টুকরা হয়ে গেলো, right angle এ।"));
  };

  return (
    <>
      <Legend now="এবার আপনি" blue="সিঁড়ি" />
      <div className="flex items-center gap-2">
        <Plane f={FY} ticks={1} label="দড়ির টান w (4, 2), সিঁড়ি v (1, 1)" className="max-w-[9rem] shrink-0">
          <path d={`M${FY.sx(-0.4)} ${FY.sy(-0.4)}L${FY.sx(3.4)} ${FY.sy(3.4)}`} strokeWidth={1} strokeDasharray="4 4" className="pointer-events-none stroke-cat-blue/40" />
          <Arrow f={FY} from={O} to={VY} tone="blue" w={2.4} />
          <Arrow f={FY} from={O} to={WY} tone="coral" w={2.4} />
          {done >= 3 && <Arrow f={FY} from={O} to={[3, 3]} tone="teal" w={3} draw />}
          {done >= 4 && <Arrow f={FY} from={[3, 3]} to={WY} tone="amber" w={2} dashed />}
          {all && <T_Square f={FY} at={[3, 3]} a={[-Math.SQRT1_2, -Math.SQRT1_2]} b={[Math.SQRT1_2, -Math.SQRT1_2]} size={0.35} />}
          {/* a wrong shadow or leftover, drawn where it would really go */}
          {ghost && <Arrow key={miss} f={FY} from={ghost[0]} to={ghost[1]} tone="danger" w={2.4} draw />}
          {ghost && done === 2 && bad === 1 && (
            <path key={`l${miss}`} d={`M${FY.sx(1.5)} ${FY.sy(1.5)}L${FY.sx(WY[0])} ${FY.sy(WY[1])}`} strokeWidth={1.2} strokeDasharray="3 3" className={`pointer-events-none stroke-danger ${FADE}`} />
          )}
        </Plane>
        <div className="grid min-w-0 flex-1 gap-0.5 text-[0.85rem]">
          {ASK.slice(0, done).map((x, i) =>
            // the box the reader just answered plays itself; older ones sit as their answer
            x.box && i === done - 1 ? (
              <BoxRun key={x.say} a={x.box[0]} b={x.box[1]} aName={x.box[2]} bName={x.box[3]} dense />
            ) : (
              <div key={x.say} className={FADE}>
                {x.say}
              </div>
            ),
          )}
        </div>
      </div>
      {!all && (
        <>
          <div className="mt-3 text-sm font-medium text-muted">{a.q}</div>
          <div className="mt-2 flex justify-center gap-2">
            {a.opts.map((o, i) => (
              <button key={o} type="button" onClick={() => pick(i)} className={`${pill(false)} ${bad === i ? "border-danger! bg-danger/10! text-danger!" : ""}`}>
                {o}
              </button>
            ))}
          </div>
          {slip && <YS_Working key={`w${miss}`} slip={slip} />}
          {bad !== null && <Nope key={miss}>{a.nope[bad]}</Nope>}
        </>
      )}
      <Task done={all}>
        সিঁড়ির (1, 1) এর উপরে দড়ির (4, 2) এর shadow বের করুন, এক step এক step করে ({done}/{ASK.length}).
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it: a new river, নদী (3, 1), and a new pull, দড়ি (1, 2). The river is
//     already cut into v · v = 10 parts; the reader taps the tick where the
//     shadow's head lands (w · v = 5, so halfway). A wrong tap drops the line
//     from the rope's tip to that tick and shows it leaning — the box beside it
//     is not 0 — so the miss is seen, not just marked.

const TF = makeFrame(-0.4, 3.4, -0.4, 2.4, 42);
const TF_V: XY = [3, 1];
const TF_W: XY = [1, 2];
const TF_N = 10;
const TF_RIGHT = 5;

export function TapFoot() {
  const pass = useGate();
  const [tap, setTap] = useSeed<number | null>("tap", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const right = tap === TF_RIGHT;
  const at = (i: number): XY => [(i / TF_N) * TF_V[0], (i / TF_N) * TF_V[1]];
  const p = tap === null ? null : at(tap);
  const gap: XY = p ? [TF_W[0] - p[0], TF_W[1] - p[1]] : [0, 0];
  const fin = usePlay(900);

  // a tap anywhere on the sheet snaps to the nearest cut
  const take = (q: XY) => {
    if (right) return;
    const t = (q[0] * TF_V[0] + q[1] * TF_V[1]) / dot(TF_V, TF_V);
    const i = Math.max(1, Math.min(TF_N - 1, Math.round(t * TF_N)));
    setTap(i);
    // the line draws down to the tick first; the pass lands once it is square
    if (i === TF_RIGHT) fin.play(1, () => pass("দড়ি · নদী = 5, নদী · নদী = 10। মাঝখানে।"));
    else setMiss(miss + 1);
  };

  return (
    <>
      <Legend now="নতুন নদী (3, 1), নতুন টান (1, 2)" />
      <Plane f={TF} ticks={0} label="নদী (3, 1) দশ ভাগে কাটা, দড়ির টান (1, 2); shadow এর মাথা কোন দাগে" drag={{ down: take, move: () => {} }} className="max-w-[16rem]">
        <Arrow f={TF} from={O} to={TF_V} tone="blue" w={2.4} />
        <Arrow f={TF} from={O} to={TF_W} tone="coral" w={2.4} />
        {Array.from({ length: TF_N - 1 }, (_, i) => {
          const c = at(i + 1);
          const n: XY = [-1 / Math.sqrt(10), 3 / Math.sqrt(10)];
          const h = 0.1;
          const on = tap === i + 1;
          return (
            <path
              key={i}
              d={`M${TF.sx(c[0] - n[0] * h)} ${TF.sy(c[1] - n[1] * h)}L${TF.sx(c[0] + n[0] * h)} ${TF.sy(c[1] + n[1] * h)}`}
              strokeWidth={on ? 2.4 : 1.1}
              className={`pointer-events-none ${on ? (right ? "stroke-accent" : "stroke-danger") : "stroke-[#0f1b2d]/55"}`}
            />
          );
        })}
        {/* each tap drops the line from the rope's tip down to the tapped tick,
            drawn as it falls: square on the 5th, leaning anywhere else */}
        {p && (
          <g key={`${tap}-${miss}`}>
            <Draw d={`M${TF.sx(TF_W[0])} ${TF.sy(TF_W[1])}L${TF.sx(p[0])} ${TF.sy(p[1])}`} strokeWidth={1.8} ms={550} className={right ? "stroke-accent" : "stroke-danger"} />
            <circle cx={TF.sx(p[0])} cy={TF.sy(p[1])} r={4.5} style={{ transitionDelay: "450ms" }} className={`pointer-events-none ${right ? "fill-accent" : "fill-danger"} ${POP}`} />
            {right && (
              <g style={{ transitionDelay: "650ms" }} className={FADE}>
                <T_Square f={TF} at={p} a={[-TF_V[0] / Math.sqrt(10), -TF_V[1] / Math.sqrt(10)]} b={[gap[0] / Math.hypot(...gap), gap[1] / Math.hypot(...gap)]} />
              </g>
            )}
          </g>
        )}
        <Label f={TF} at={TF_V} dx={4} dy={-4} anchor="start" className="fill-cat-blue">
          নদী
        </Label>
        <Label f={TF} at={TF_W} dx={-4} dy={-4} anchor="end" className="fill-cat-coral">
          দড়ি
        </Label>
      </Plane>

      <div className="mt-1 min-h-10 text-center text-[0.95rem]">
        {tap === null ? (
          <span className="text-muted">নদীটা 10 ভাগে কাটা আছে। মাথা কোন দাগে পড়বে?</span>
        ) : (
          <span key={`${tap}-${miss}`} style={{ transitionDelay: "500ms" }} className={FADE}>
            {tap} নম্বর দাগ · বাকি line আর নদীর dot product{" "}
            <b className={`font-mono ${right ? "text-accent-text" : "text-danger"}`}>{num(dot(gap, TF_V))}</b>
          </span>
        )}
      </div>

      {tap !== null && !right && <Nope key={miss}>Dot product 0 হয় নাই, মানে line টা নদীর সাথে হেলে আছে। দড়ি · নদী কত হয়, বের করে দেখুন।</Nope>}

      <Task done={right}>নদীর যে দাগে shadow এর মাথা পড়বে, সেই দাগে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: the river bends, seen from
//      above. The boat reaches the bend; the river now runs along (2, 3), the
//      rope pulls along (2, 1), a "?" sits on the river for the shadow's
//      tip, and মাঝি চাচা calls from the bank: how much of the pull works
//      now? Where the tip falls is the screen's job.

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
  const s = useScene(5, [600, 1600, 1600, 1800, 2400]);
  const k = s.k;
  const end = S3_at(S3_V, 200);
  const tip = S3_at(S3_V, 88);
  const men = S3_at(S3_WD, 80);
  const q = S3_at(S3_V, 50);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={0} label="উপর থেকে নদী: বাঁক নিয়েছে (2, 3) বরাবর; দড়ির টান (2, 1); প্রশ্ন হলো shadow এর মাথা কোথায়; পাড় থেকে মাঝি চাচা জিজ্ঞেস করলেন টানের কতটুকু কাজে লাগে">
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
            <text x={tip[0] - 40} y={tip[1] - 10} textAnchor="middle" fontSize={9} fontWeight={700} fill={T_INK} className={FADE}>
              নদী
            </text>
            <CastCard x={tip[0] - 40} y={tip[1] + 4} text="(2, 3)" tone="blue" />
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
              Shadow এর মাথা কোথায়?
            </text>
          </g>
        )}
        {k >= 5 && <Bubble x={men[0] + 10} y={men[1] - 6} side="right" lines={["বাঁক নেওনের পরে টানের", "কতটুকু কামে লাগে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation (a) and one for screen 4's (b), no task.
//      (a) 7 and 13: the river cut in 13 equal parts, the shadow's tip on the
//          7th mark; then the Then's open question — why 13, why 7 — each
//          number gets its "?", and the figure stops there. (It used to run
//          w · v = 7 and v · v = 13, which are screens 4 and 5's answers.)
//      (b) Why: 4.3's ‖w‖ cos θ, the same ‖w‖ cos θ inside the box, and one
//          division by ‖v‖ for the length. The shared ‖w‖ cos θ is lit in
//          both rows. The second division and ‖v‖² = v · v are screen 5's
//          (TwoDivides), so they stay out of here.

const X3_F = makeFrame(-0.4, 2.9, -0.4, 3.4, 40);
const X3A_SAY = [
  "Shadow এর মাথা পড়লো ঠিক নদীর arrow এর 7/13 অংশে।",
  "নদীর arrow টাকে 13 টুকরা করলে shadow এর মাথা বসে 7 নম্বর দাগে।",
  "কিন্তু 13 ভাগ করার কথা মাথায় আসলো কেন?",
  "আর গুনে 7 পাওয়ার মানেই বা কী?",
  "দুইটা সংখ্যাই লুকিয়ে আছে চেনা এক জায়গায়।",
];

/** one number of 7/13 with its "?" hung on it once the figure asks about it */
function X3_Num({ n, ask }: { n: string; ask: boolean }) {
  return (
    <span className={`relative inline-block rounded px-0.5 transition-colors duration-500 motion-reduce:transition-none ${ask ? "bg-cat-amber/25" : ""}`}>
      {n}
      {ask && <span className={`${POP} absolute -top-3 -right-2.5 inline-block rounded-full bg-cat-amber px-1 text-[0.65rem] leading-4 font-bold text-[#0f1b2d]`}>?</span>}
    </span>
  );
}

export function SevenThirteen() {
  const s = useScene(4, [600, 1800, 2200, 2000, 2200]);
  const k = s.k;
  const f = X3_F;
  const n: XY = [-3 / Math.sqrt(13), 2 / Math.sqrt(13)];
  const foot: XY = [FOOT * V[0], FOOT * V[1]];
  return (
    <Scene scene={s} caption={T_say(X3A_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-3">
        <div className="w-full max-w-[8.5rem] shrink-0">
          <Plane f={f} ticks={1} label="নদী (2, 3), দড়ি (2, 1), shadow এর মাথা 7/13 অংশে" className="my-0! max-w-none">
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
        <div className="grid min-w-0 flex-1 gap-2 text-[0.85rem] leading-snug">
          <div>
            অংশ{" "}
            <b className="font-mono text-lg">
              <X3_Num n="7" ask={k >= 3} />/<X3_Num n="13" ask={k >= 2} />
            </b>
          </div>
          {k >= 1 && (
            <div className={`${FADE} text-[0.8rem] text-muted`}>
              13 ভাগ, 7 ধাপ
            </div>
          )}
          {/* the open question, left open: both numbers come from somewhere */}
          {k >= 4 && (
            <div className={`${FADE} flex items-center gap-1.5`}>
              <span className={`${POP} inline-grid h-7 w-7 place-content-center rounded-md border-2 border-dashed border-cat-amber font-mono font-bold text-cat-amber`}>?</span>
              <span className="text-[0.8rem]">চেনা এক জায়গায়</span>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

const X3B_ROWS: { name: string; f: string[] }[] = [
  { name: "4.3: shadow এর length", f: ["", "‖w‖ cos θ"] },
  { name: "dot product", f: ["w · v = ‖v‖ ", "‖w‖ cos θ"] },
  { name: "তাহলে shadow এর length", f: ["w · v ÷ ‖v‖"] },
];
const X3B_SAY = [
  "4.3 এর একটা কথা জানলেই 7 টা মিলে যায়।",
  "4.3 থেকে: shadow এর length হলো ‖w‖ cos θ.",
  "ওই একই ‖w‖ cos θ বসে আছে dot product এর ভিতরে, সাথে বাড়তি একটা ‖v‖।",
  "তাই dot product কে ‖v‖ দিয়ে ভাগ দিলে shadow এর length পাওয়া যায়।",
];

export function WhySeven() {
  const s = useScene(3, [600, 1800, 2200, 2200]);
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
            <span className={`font-mono text-[0.8rem] font-semibold whitespace-nowrap ${i === 2 && k >= 3 ? "text-accent-text" : ""}`}>
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
// 6½ · Two figures for screen 6's explanation, no task.
//      (a) The recipe read aloud: two boxes, one division, a stretch of the
//          river's arrow down to 7/13 of itself; no root, no protractor.
//      (b) Any pull, any river: four pairs in turn, each split into shadow
//          and leftover with the leftover square to the river. Only the first
//          pair is the screen's; the other three are made up to show "any".

const X4_F = makeFrame(-0.4, 2.6, -0.4, 3.4, 30);
const X4A_SAY = [
  "Shadow এর recipe টা জোরে জোরে পড়ি।",
  "প্রথম dot product: দড়ি আর নদী, 7।",
  "দ্বিতীয় dot product: নদী আর নদী, 13।",
  "একটা ভাগ: 7 ÷ 13।",
  "এরপর নদীর arrow টাকে ওই অংশ অনুযায়ী টানুন। ওটাই shadow.",
  "Root লাগলো না, চাঁদাও লাগলো না।",
];
const X4A_ROWS = [
  { name: "dot product", val: "w · v = 7" },
  { name: "dot product", val: "v · v = 13" },
  { name: "ভাগ", val: "7 ÷ 13" },
  { name: "টানুন", val: "(7 ÷ 13) × v" },
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
          <Plane f={f} ticks={1} label="নদীর (2, 3) কে টেনে নিজের 7/13 করা — দড়ির (2, 1) এর shadow" className="my-0! max-w-none">
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
        <Plane f={f} ticks={1} label={`নদী ${tupN(v)}, টান ${tupN(w)}, shadow আর বাকিটা right angle এ`} className="my-0! max-w-none">
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
// 9a · A story scene for screen 9's setup, no task: Fahim's idea. At the
//      ghat, a green coconut in hand, Fahim in the boat thinks: a shadow turns an arrow into one number;
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
      <Stage backdrop="evening" ground={100} label="ঘাটের কাছে নৌকায় বসে ফাহিম ভাবছে: shadow নিলে arrow একটা number হয়ে যায়; একগাদা point এর shadow এক line এ নিলে কী হারায়?">
        <T_Water top={124} />
        <T_Ghat />
        <T_Boat x={bx} y={S7_WL} />
        <Person who="fahim" x={bx + 8} y={S7_WL - 10} scale={0.75} ms={0} mood={k >= 1 ? "smug" : "plain"} arm="hold" />
        {/* মাঝি চাচার ডাব, still in Fahim's hand */}
        <g transform={`translate(${bx + 19} ${S7_WL - 44}) scale(0.8)`}>
          <T_Dab />
        </g>
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
              একটা number
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
            কী হারালো?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9½ · Two figures for screen 9's explanation, no task.
//      (a) One point up close: (2.46, 0.89), the tenth of the twelve. On the
//          spread's line it keeps 2.6 and loses 0.3; on the line at 90° it
//          keeps −0.3 and loses 2.6.
//      (b) PCA in one picture: a point of 300 numbers, a few directions to
//          take shadows on, a few numbers kept, the small leftovers thrown
//          away. The "few" is drawn as three.

const X7_F = makeFrame(-1, 3, -1, 2.1, 40);
const X7_P = CLOUD[9];
const X7A_SAY = [
  "বারোটা point এর একটা, দুইটা number: (2.46, 0.89).",
  "ছড়ানোর line এ shadow: থাকলো একটা number, 2.6.",
  "হারালো শুধু বাকিটুকু, 0.3.",
  "Right angle এর line এ shadow: থাকলো −0.3, হারালো 2.6. প্রায় সবটাই।",
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
        <Plane f={f} grid={1} axes={false} label="একটা point এর shadow দুইটা line এ: ছড়ানোর line এ থাকে 2.6, হারায় 0.3; 90° এর line এ থাকে −0.3, হারায় 2.6" className="my-0! max-w-none">
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
          থাকলো <b className={`font-mono ${across ? "text-cat-coral" : "text-cat-teal"}`}>{k >= 1 ? fix(dot(X7_P, line), 1) : "–"}</b>
        </span>
        <span>
          হারালো <b className="font-mono text-cat-amber">{k >= 2 ? fix(Math.abs(dot(X7_P, across ? DIR : NRM)), 1) : "–"}</b>
        </span>
      </div>
    </Scene>
  );
}

const X7B_SAY = [
  "ধরুন আপনার data এর প্রতিটা point 300 টা number।",
  "কিন্তু ওরা আসলে ছড়িয়ে আছে মাত্র কয়েকটা direction বরাবর। ওই direction গুলাতেই shadow নিন।",
  "প্রতি direction এ একটা number। 300 টার কাজ কয়েকটা দিয়েই হয়ে যায়।",
  "বাকিটা ফেলে দিন। হারাবে শুধু সামান্য কিছু।",
];

export function FewNumbers() {
  const s = useScene(3, [600, 2400, 2000, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={T_say(X7B_SAY, k)}>
      <svg viewBox="0 0 280 96" role="img" aria-label="300 টা number এর একটা point, কয়েকটা direction এ shadow নিলে কয়েকটা number, বাকিটা ফেলে দেয়া" className="mx-auto block h-auto w-full max-w-[18rem]">
        <g opacity={k >= 3 ? 0.18 : 1} className="transition-opacity duration-700 motion-reduce:transition-none">
          {Array.from({ length: 300 }, (_, i) => (
            <rect key={i} x={6 + (i % 30) * 3.8} y={14 + Math.floor(i / 30) * 3.8} width={3} height={3} rx={0.6} className="fill-cat-blue" />
          ))}
        </g>
        <text x={63} y={66} textAnchor="middle" fontSize={10} fontWeight={700} className="fill-foreground">
          300 টা number
        </text>
        {k >= 1 && (
          <g>
            <Draw d="M128 33H176" strokeWidth={2} className="stroke-muted" />
            <path d="M182 33l-7 -4v8Z" className={`fill-muted ${POP}`} style={{ transitionDelay: "450ms" }} />
            <text x={152} y={22} textAnchor="middle" fontSize={8.5} className={`fill-muted ${FADE}`}>
              shadow
            </text>
          </g>
        )}
        {k >= 2 &&
          [0, 1, 2].map((i) => (
            <rect key={i} x={194 + i * 22} y={23} width={18} height={18} rx={3} style={{ transitionDelay: `${i * 150}ms` }} className={`fill-cat-teal ${POP}`} />
          ))}
        {k >= 2 && (
          <text x={227} y={58} textAnchor="middle" fontSize={10} fontWeight={700} className={`fill-foreground ${FADE}`}>
            কয়েকটা number
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
            বাকিটা, ফেলে দেয়া
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: at the ghat. The boat is
//      tied to a post on the stairs, which rise one step up for one across,
//      like (1, 1). Majhi chacha, laughing, gives the riddle: the rope's pull
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
      <Stage backdrop="evening" ground={100} label="ঘাটে নৌকা বাঁধা হচ্ছে; দড়ির টান (4, 2), সিঁড়ি উঠে গেছে (1, 1) বরাবর; মাঝি চাচা হাসতে হাসতে ধাঁধা দিলেন">
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
        {k >= 4 && <Bubble x={288} y={106 - 50} side="left" lines={["টানের কতটুকু সিঁড়ি বরাবর,", "আর কতটুকু বাকি থাকে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the answer on cards,
//      (4, 2) = (3, 3) + (1, −1), the box check (1, −1) · (1, 1) = 0, and
//      Majhi chacha handing Fahim a green coconut.

export function DabTreat() {
  const s = useScene(3, [600, 1800, 1600, 1800]);
  const k = s.k;
  const [dx, dy] = useTween([k >= 3 ? S8_BOAT + 18 : 276, k >= 3 ? S1_WL - 44 : 76], 1400);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={100} label="(4, 2) = (3, 3) + (1, −1), আর (1, −1) · (1, 1) = 0; খুশি হয়ে মাঝি চাচা ফাহিমকে একটা ডাব দিলেন">
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
// 10a · A story scene for the ending's teaser, no task: the library in the
//      evening. The apu's new computer; Fahim types "fish"; two machines, two
//      top answers (a thick book, a small letter); which one to keep is left
//      open for 4.7.

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
            machine A
          </text>
          <text x={195} y={72} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#475569">
            machine B
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
      <Stage backdrop="room" ground={150} label="সন্ধ্যায় লাইব্রেরি, আপুর নতুন computer; ফাহিম মাছ লিখে search দেয়; একটা machine মোটা বই দেখায়, আরেকটা ছোট একটা চিঠি; আপু ভাবছেন কোনটা রাখবেন">
        <T_Computer show={k >= 3 ? 2 : k >= 2 ? 1 : 0} />
        <Person who="rina" x={282} y={150} facing={-1} scale={0.9} mood={k >= 4 ? "puzzled" : "plain"} />
        <text x={282} y={161} textAnchor="middle" fontSize={8} fontWeight={700} fill={T_INK}>
          লাইব্রেরির আপু
        </text>
        <Person who="fahim" x={k >= 1 ? 100 : -30} y={150} walking={k === 1} ms={1400} scale={0.9} arm={k === 2 ? "point" : "down"} mood={k >= 3 ? "puzzled" : "plain"} label={k >= 1} />
        {k >= 4 && <Bubble x={282} y={150 - 60} side="left" tone="think" lines={["কোন machine টা", "রাখবো?"]} />}
      </Stage>
    </StoryFrame>
  );
}


// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: a right angle says 0
//      however the pair is turned, and with any number of slots. Three pairs
//      at right angles, each box landing on 0; then a three-slot pair, also 0.

const unit = (v: XY): XY => [v[0] / Math.hypot(...v), v[1] / Math.hypot(...v)];
/** the little corner mark of a right angle at `at`, between directions a and b */
function X_Corner({ f, a, b, at = O, size = 0.35, delay = 0 }: { f: ReturnType<typeof makeFrame>; a: XY; b: XY; at?: XY; size?: number; delay?: number }) {
  const ua = unit(a);
  const ub = unit(b);
  const pt = (x: number, y: number) => `${f.sx(at[0] + ua[0] * x + ub[0] * y)} ${f.sy(at[1] + ua[1] * x + ub[1] * y)}`;
  return <path d={`M${pt(size, 0)}L${pt(size, size)}L${pt(0, size)}`} strokeWidth={1.4} style={{ transitionDelay: `${delay}ms` }} className={`pointer-events-none fill-none stroke-[#0f1b2d]/70 ${FADE}`} />;
}

const X1_F = makeFrame(-1.4, 3.2, -2.3, 3.2, 26);
const X1_PAIRS: [XY, XY][] = [
  [[2, 1], [-1, 2]],
  [[3, 1], [-1, 3]],
  [[1, -2], [2, 1]],
];
const X1_SAY = [
  "(2, 1) আর (−1, 2)। Dot product 0, right angle.",
  "জোড়াটা একসাথে ঘুরিয়ে দিলাম: (3, 1) আর (−1, 3)। এবারও 0।",
  "আরেকবার ঘুরালাম: (1, −2) আর (2, 1)। এবারও 0।",
  "তিন slot হলেও একই কথা। এই জোড়ার dot product-ও 0।",
];

export function ZeroAnySlots() {
  const s = useScene(3, [600, 2200, 2200, 2600]);
  const k = s.k;
  const three = k >= 3;
  const [w, v] = X1_PAIRS[Math.min(k, 2)];
  return (
    <Scene scene={s} caption={T_say(X1_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-2">
        <div className="w-full max-w-[8rem] shrink-0">
          <Plane f={X1_F} ticks={1} label={three ? "তিন slot এর জোড়া, কাগজে আঁকা যায় না" : `${tupN(w)} আর ${tupN(v)}, right angle এ`} className="my-0! max-w-none">
            <g key={k} opacity={three ? 0.25 : 1}>
              <Arrow f={X1_F} from={O} to={w} tone="coral" w={2.4} draw />
              <Arrow f={X1_F} from={O} to={v} tone="blue" w={2.4} draw delay={250} />
              <X_Corner f={X1_F} a={w} b={v} delay={900} />
            </g>
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          {three ? (
            <BoxRun key="three" a={[1, 2, 2]} b={[2, -2, 1]} aName="a" bName="b" ms={500} dense />
          ) : (
            <BoxRun key={k} a={w} b={v} aName="a" bName="b" ms={450} dense />
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: why sliding is not an
//      answer. The river from above, winding to the ghat: the foot found at
//      this bend, then a "?" at every bend still ahead, the sun going down,
//      and the boat reaching the next bend with nothing but a "?" there.

const X2_SAY = [
  "এই বাঁকে slide করে করে মাথাটা পাওয়া গেলো।",
  "কিন্তু ঘাটের আগে নদী আরো কয়েকবার বাঁক নিবে।",
  "আর সূর্য নামছে। মাঝি চাচা সন্ধ্যার আগে ঘাটে পৌঁছাতে চান।",
  "প্রতিটা বাঁকে নতুন করে slide করতে বসলে সন্ধ্যা পার হয়ে যাবে। দরকার একটা হিসাব।",
];
const X2_RIVER = "M-6 104H62Q80 104 88 86L104 48Q112 30 130 30H166Q184 30 192 48L202 70Q210 88 228 88H290";
const X2_BENDS: XY[] = [
  [118, 18],
  [192, 34],
  [226, 74],
];

export function BendsAhead() {
  const s = useScene(3, [600, 2000, 2200, 2600]);
  const k = s.k;
  const [bx, by, rot, sunY] = useTween([k >= 3 ? 100 : 50, k >= 3 ? 46 : 104, k >= 3 ? -66 : 0, k >= 3 ? 40 : k >= 2 ? 26 : 12], 1300);
  return (
    <Scene scene={s} caption={T_say(X2_SAY, k)}>
      <svg viewBox="0 0 280 124" role="img" aria-label="উপর থেকে নদী, ঘাট পর্যন্ত কয়েকটা বাঁক; প্রতিটা বাঁকে একটা প্রশ্ন; সূর্য নামছে" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={0} y={0} width={280} height={124} rx={10} fill="#ecfccb" />
        <circle cx={258} cy={sunY} r={9} fill={k >= 3 ? "#ea580c" : "#f59e0b"} className="transition-[fill] duration-700 motion-reduce:transition-none" />
        <path d={X2_RIVER} stroke="#7cb8e8" strokeWidth={16} fill="none" strokeLinejoin="round" />
        {/* the ghat's stairs at the river's end */}
        {k >= 2 && (
          <g className={FADE}>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={250 + i * 6} y={96} width={6} height={14 - i * 3} fill="#d6d3d1" stroke="#78716c" strokeWidth={0.6} />
            ))}
            <text x={262} y={120} textAnchor="middle" fontSize={8} fontWeight={700} fill={T_INK}>
              ঘাট
            </text>
          </g>
        )}
        {/* this bend: the foot, found by sliding */}
        <circle cx={78} cy={96} r={3.4} className="fill-accent" />
        <text x={78} y={120} textAnchor="middle" fontSize={8} fontWeight={700} fill={T_INK}>
          slide করে পাওয়া
        </text>
        {k >= 1 && X2_BENDS.map(([x, y], i) => <g key={i} className={POP} style={{ transitionDelay: `${i * 220}ms` }}><CastCard x={x} y={y} text="?" tone="amber" w={16} /></g>)}
        <g style={{ transform: `translate(${bx}px, ${by}px) rotate(${rot}deg)` }} className="pointer-events-none">
          <path d="M-11 0Q-6 -5 5 -4.5L12 0L5 4.5Q-6 5 -11 0Z" fill="#92400e" />
          <circle cx={-2} r={2} fill="#78350f" />
        </g>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: v · v is the length
//      squared, seen as tiles. The river's arrow (2, 3) is a walk of 2 across
//      and 3 up; a 2 × 2 square of tiles on one leg, a 3 × 3 on the other; and
//      the square standing on the arrow itself holds exactly 4 + 9 = 13.

const X5_F = makeFrame(-3.3, 5.3, -2.3, 5.3, 17);
const X5_SAY = [
  "নদীর arrow (2, 3)। ওর নিজের সাথে dot product: 2 × 2 + 3 × 3।",
  "Arrow টা মানে 2 ঘর ডানে, তারপর 3 ঘর উপরে।",
  "2 এর উপরে square এ 4 টা ঘর, 3 এর উপরে square এ 9 টা।",
  "আর arrow এর নিজের উপরে বসানো square এ ঠিক 13 ঘর। 13 হলো length এর বর্গ।",
];

export function RiverSquare() {
  const s = useScene(3, [600, 1800, 2200, 2600]);
  const k = s.k;
  const f = X5_F;
  const cell = (x: number, y: number, i: number, cls: string) => (
    <rect key={`${x},${y}`} x={f.sx(x) + 0.8} y={f.sy(y + 1) + 0.8} width={f.u - 1.6} height={f.u - 1.6} rx={1.5} style={{ transitionDelay: `${i * 50}ms` }} className={`pointer-events-none ${cls} ${POP}`} />
  );
  const tilt: XY[] = [O, [2, 3], [-1, 5], [-3, 2]];
  return (
    <Scene scene={s} caption={T_say(X5_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-2">
        <div className="w-full max-w-[10rem] shrink-0">
          <Plane f={f} ticks={0} label="নদী (2, 3); দুই পাশে 4 আর 9 ঘরের square, arrow এর উপরে 13 ঘরের square" className="my-0! max-w-none">
            {k >= 3 && (
              <g className={FADE}>
                <path d={`M${tilt.map((p) => `${f.sx(p[0])} ${f.sy(p[1])}`).join("L")}Z`} strokeWidth={1.4} className="pointer-events-none fill-cat-teal/25 stroke-cat-teal" />
                <text x={f.sx(-0.5)} y={f.sy(2.5) + 5} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily="ui-monospace" className="fill-[#0f766e]">
                  13
                </text>
              </g>
            )}
            {k >= 2 && [0, 1].flatMap((x) => [-2, -1].map((y) => cell(x, y, x * 2 + y + 2, "fill-cat-amber/60")))}
            {k >= 2 && [2, 3, 4].flatMap((x) => [0, 1, 2].map((y) => cell(x, y, 4 + (x - 2) * 3 + y, "fill-cat-violet/45")))}
            {k >= 1 && (
              <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(2)}V${f.sy(3)}`} strokeWidth={1.6} strokeDasharray="4 3" className={`pointer-events-none fill-none stroke-[#0f1b2d]/70 ${FADE}`} />
            )}
            <Arrow f={f} from={O} to={V} tone="blue" w={2.6} />
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1 font-mono text-[0.85rem]">
          <div className={k >= 2 ? "" : "opacity-0"}>
            <span className="text-cat-amber">2 × 2</span> = 4
          </div>
          <div className={k >= 2 ? "" : "opacity-0"}>
            <span className="text-cat-violet">3 × 3</span> = 9
          </div>
          <div className={`border-t border-current/15 pt-1 font-bold ${k >= 3 ? "text-accent-text" : "opacity-0"}`}>v · v = 13</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: late afternoon, the tow
//      goes on and the river bends once more before the ghat. মাঝি চাচা calls
//      from the bank to be quick this time; the new river and the new pull
//      turn up as cards. Where the head lands is the screen's job.

const S7B_BANK = 118;

export function SecondBend({}: Story) {
  const s = useScene(3, [600, 1600, 2200, 2000]);
  const k = s.k;
  const [bx, cx, dx] = useTween([k >= 1 ? 104 : 74, k >= 1 ? 254 : 224, k >= 1 ? 200 : 170], 1500);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={100} label="বিকালে গুন টানা চলছে; ঘাটের আগে নদী আরেকবার বাঁক নিলো; মাঝি চাচা পাড় থেকে তাড়া দিলেন; নতুন নদী (3, 1), নতুন টান (1, 2)">
        <T_Water top={124} />
        {k >= 1 && (
          <g className={FADE}>
            <path d="M282 124Q304 128 316 150L320 150V124Z" fill="#7cb8e8" />
            <Draw d="M282 124Q304 128 316 150" strokeWidth={2.2} ms={900} className="stroke-[#4d7c0f]" />
          </g>
        )}
        <T_Boat x={bx} y={S1_WL} />
        <Person who="fahim" x={bx + 8} y={S1_WL - 10} scale={0.75} ms={0} mood={k >= 3 ? "puzzled" : "plain"} arm={k >= 3 ? "hold" : "down"} />
        <path d={`M${bx - 14} ${S1_WL - 62}L${cx + 3} ${S7B_BANK - 27}`} stroke="#78350f" strokeWidth={1.4} fill="none" />
        <T_Majhi x={dx} y={S7B_BANK} walking={k === 1} run={String(k)} ms={1500} pose="pull" cloth="#15803d" />
        <T_Majhi x={cx} y={S7B_BANK} walking={k === 1} run={String(k)} ms={1500} pose="pull" name={k >= 2 ? "মাঝি চাচা" : undefined} />
        {k === 2 && <Bubble x={cx - 10} y={S7B_BANK - 50} side="left" lines={["আরেকটা বাঁক আইলো।", "এইবার জলদি কও।"]} />}
        {k >= 3 && (
          <g>
            {[
              [bx - 30, "নদী", "(3, 1)", "blue"],
              [bx + 30, "টান", "(1, 2)", "coral"],
            ].map(([x, name, t, tone]) => (
              <g key={name as string}>
                <text x={x as number} y={S1_WL - 110} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={T_INK} className={FADE}>
                  {name}
                </text>
                <CastCard x={x as number} y={S1_WL - 96} text={t as string} tone={tone as "blue" | "coral"} />
              </g>
            ))}
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: why the 5th cut. The
//      two boxes, 5 and 10, land beside the river; the line from the rope's
//      tip drops square onto the 5th cut; a line to the 7th cut leans, and its
//      box says −2, not 0.

const X7T_F = makeFrame(-0.4, 3.4, -0.4, 2.4, 34);
const X7T_SAY = [
  "নতুন নদী (3, 1), দশ ভাগে কাটা। দড়ির টান (1, 2)।",
  "দড়ি · নদী = 3 + 2 = 5। এইটা কয় ধাপ।",
  "নদী · নদী = 9 + 1 = 10। এইটা কয় ভাগ। তাই 10 ভাগের 5 ভাগ, ঠিক মাঝখানে।",
  "7 নম্বর দাগে নামালে line টা হেলে যায়। Dot product বলে −2, 0 না।",
];

export function HalfwayWhy() {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  const f = X7T_F;
  const at = (i: number): XY => [(i / TF_N) * TF_V[0], (i / TF_N) * TF_V[1]];
  const nrm: XY = [-1 / Math.sqrt(10), 3 / Math.sqrt(10)];
  const mid = at(5);
  const off = at(7);
  const gapMid: XY = [TF_W[0] - mid[0], TF_W[1] - mid[1]];
  return (
    <Scene scene={s} caption={T_say(X7T_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-2">
        <div className="w-full max-w-[9.5rem] shrink-0">
          <Plane f={f} ticks={0} label="নদী (3, 1) দশ ভাগে কাটা; দড়ির মাথা থেকে line টা 5 নম্বর দাগে right angle এ নামে" className="my-0! max-w-none">
            <Arrow f={f} from={O} to={TF_V} tone="blue" w={2.2} />
            <Arrow f={f} from={O} to={TF_W} tone="coral" w={2.2} />
            {Array.from({ length: TF_N - 1 }, (_, i) => {
              const c = at(i + 1);
              const h = i === 4 && k >= 2 ? 0.16 : 0.09;
              return (
                <path
                  key={i}
                  d={`M${f.sx(c[0] - nrm[0] * h)} ${f.sy(c[1] - nrm[1] * h)}L${f.sx(c[0] + nrm[0] * h)} ${f.sy(c[1] + nrm[1] * h)}`}
                  strokeWidth={i === 4 && k >= 2 ? 2 : 1}
                  className={`pointer-events-none ${i === 4 && k >= 2 ? "stroke-accent" : "stroke-[#0f1b2d]/55"}`}
                />
              );
            })}
            {k >= 2 && (
              <g className={FADE}>
                <path d={`M${f.sx(TF_W[0])} ${f.sy(TF_W[1])}L${f.sx(mid[0])} ${f.sy(mid[1])}`} strokeWidth={1.5} strokeDasharray="4 3" className="pointer-events-none stroke-accent" />
                <X_Corner f={f} at={mid} a={[-TF_V[0], -TF_V[1]]} b={gapMid} size={0.22} />
              </g>
            )}
            {k >= 3 && (
              <path d={`M${f.sx(TF_W[0])} ${f.sy(TF_W[1])}L${f.sx(off[0])} ${f.sy(off[1])}`} strokeWidth={1.5} strokeDasharray="4 3" className={`pointer-events-none stroke-danger ${FADE}`} />
            )}
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1 font-mono text-[0.82rem] leading-snug">
          <div className={k >= 1 ? FADE : "opacity-0"}>
            <span className="text-cat-coral">w</span> · <span className="text-cat-blue">v</span> = <b>5</b>
          </div>
          <div className={k >= 2 ? FADE : "opacity-0"}>
            <span className="text-cat-blue">v</span> · <span className="text-cat-blue">v</span> = <b>10</b>
          </div>
          <div className={k >= 2 ? `${FADE} font-sans font-bold text-accent-text` : "opacity-0"}>
            <span className="font-mono">5/10</span>, মাঝখানে
          </div>
          <div className={k >= 3 ? `${FADE} font-sans text-danger` : "opacity-0"}>
            7 নম্বরে dot product <span className="font-mono">−2</span>
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the tow goes on. মাঝি চাচা
//      and his brother pull on the bank, the boat follows with ফাহিম in it,
//      and the river's bend comes into view ahead. Nothing about the bend's
//      numbers yet: that is screen 2's.

const S1B_BANK = 118;

export function BendNear({}: Story) {
  const s = useScene(2, [600, 1800, 2000]);
  const k = s.k;
  const [bx, cx, dx] = useTween([k >= 1 ? 96 : 64, k >= 1 ? 246 : 214, k >= 1 ? 192 : 160], 1600);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={100} label="গুন টেনে নৌকা চলছে; পাড়ে মাঝি চাচা আর তাঁর ভাই দড়ি টানছেন; সামনে নদীর বাঁক দেখা দিলো">
        <T_Water top={124} />
        {/* the bend, coming into view at the right */}
        {k >= 2 && (
          <g className={FADE}>
            <path d="M270 124Q300 128 314 156L320 156V124Z" fill="#7cb8e8" />
            <Draw d="M270 124Q300 128 314 156" strokeWidth={2.2} ms={1000} className="stroke-[#4d7c0f]" />
            <text x={286} y={112} textAnchor="middle" fontSize={9} fontWeight={700} fill={T_INK} className={FADE} style={{ transitionDelay: "700ms" }}>
              বাঁক
            </text>
          </g>
        )}
        <T_Boat x={bx} y={S1_WL} />
        <Person who="fahim" x={bx + 8} y={S1_WL - 10} scale={0.75} ms={0} mood="plain" arm="down" />
        <path d={`M${bx - 14} ${S1_WL - 62}L${cx + 3} ${S1B_BANK - 27}`} stroke="#78350f" strokeWidth={1.4} fill="none" />
        <T_Majhi x={dx} y={S1B_BANK} walking={k === 1} run={String(k)} ms={1600} pose="pull" cloth="#15803d" />
        <T_Majhi x={cx} y={S1B_BANK} walking={k === 1} run={String(k)} ms={1600} pose="pull" name="মাঝি চাচা" />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5½b · A figure for screen 5's explanation, no task: why the division lands
//       on 13. The box's 7 as a bar; one division by ‖v‖ shrinks it to the
//       shadow's length (7/√13 ≈ 1.94); the river's own length ‖v‖ = √13 ≈
//       3.61 laid under it; a second division by ‖v‖ gives the share, 7/13;
//       and the two divisions together are ‖v‖², that is v · v, that is 13.

const X5B_U = 33;
const X5B_L = Math.sqrt(13);
const X5B_SAY = [
  "Dot product বলে 7। ভিতরে shadow এর length, সাথে বাড়তি একটা ‖v‖।",
  "একবার ‖v‖ দিয়ে ভাগ: shadow এর length, প্রায় 1.94.",
  "নদীর arrow এর নিজের length ‖v‖, প্রায় 3.61.",
  "নদীর কত অংশ? আরেকবার ‖v‖ দিয়ে ভাগ: 1.94 ÷ 3.61, মানে 7/13।",
  "মোট ভাগ হলো ‖v‖² দিয়ে, মানে v · v, মানে 13।",
];

export function TwoDivides() {
  const s = useScene(4, [600, 2000, 1800, 2400, 2400]);
  const k = s.k;
  const [len] = useTween([k >= 1 ? 7 / X5B_L : 7], 1100);
  const x0 = 8;
  return (
    <Scene scene={s} caption={T_say(X5B_SAY, k)}>
      <div className="mx-auto w-full max-w-[17rem]">
        <svg viewBox="0 0 250 92" role="img" aria-label="Dot product এর 7, ‖v‖ দিয়ে ভাগে shadow এর length 1.94; নদীর length 3.61; আরেকবার ভাগে 7/13" className="block h-auto w-full">
          {/* the box's number, then the shadow's length */}
          <text x={x0} y={14} fontSize={9.5} fontWeight={700} className="fill-cat-teal">
            {k >= 1 ? "shadow এর length ≈ 1.94" : "w · v = 7"}
          </text>
          <rect x={x0} y={20} width={len * X5B_U} height={12} rx={3} className="fill-cat-teal/70" />
          {k === 1 && (
            <text x={x0 + (7 / X5B_L) * X5B_U + 8} y={30} fontSize={10} fontWeight={700} fontFamily="ui-monospace" className={`fill-[#b45309] ${FADE}`}>
              ÷ ‖v‖
            </text>
          )}
          {/* the river's own length, under it */}
          {k >= 2 && (
            <g className={FADE}>
              <rect x={x0} y={44} width={X5B_L * X5B_U} height={12} rx={3} className="fill-cat-blue/60" />
              <text x={x0} y={70} fontSize={9.5} fontWeight={700} className="fill-cat-blue">
                নদীর length ‖v‖ ≈ 3.61
              </text>
            </g>
          )}
          {/* the share: shadow over river, a second ÷ ‖v‖ */}
          {k >= 3 && (
            <g className={FADE}>
              <path d={`M${x0 + X5B_L * X5B_U + 8} 26V50`} strokeWidth={1.2} className="stroke-current opacity-50" />
              <text x={x0 + X5B_L * X5B_U + 14} y={34} fontSize={10} fontWeight={700} fontFamily="ui-monospace" className="fill-[#b45309]">
                ÷ ‖v‖
              </text>
              <text x={x0 + X5B_L * X5B_U + 14} y={52} fontSize={13} fontWeight={800} fontFamily="ui-monospace" className="fill-current">
                = 7/13
              </text>
            </g>
          )}
        </svg>
        <div className={`mt-1 text-center font-mono text-[0.85rem] font-semibold transition-opacity duration-500 motion-reduce:transition-none ${k >= 4 ? "opacity-100" : "opacity-0"}`}>
          7 ÷ ‖v‖ ÷ ‖v‖ = 7 ÷ ‖v‖² = <span className="text-accent-text">7 ÷ 13</span>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10b · A recap for the ending, no task: the journey replayed calmly. The
//       question on the bent river; the foot found by sliding, square to it;
//       13 parts and 7 steps; both numbers from a box; and the pull in two
//       pieces, the shadow along the river and the rest at a right angle.
//       Watch-only, written with `story` because the last step has no widget.

const X10_SAY = [
  "শুরুতে প্রশ্ন: নদী বাঁকা হলে shadow এর মাথা কোথায় পড়ে?",
  "Slide করে খুঁজে পেলাম। দড়ির মাথা থেকে line টা নদীর সাথে right angle এ।",
  "তারপর সংখ্যায় আনলাম: নদীকে 13 ভাগ করে 7 ধাপ।",
  "7 আর 13 দুইটাই dot product থেকে: দড়ি আর নদীর dot product, আর নদীর নিজের dot product।",
  "দড়ির টান দুই টুকরা: নদী বরাবর shadow, আর বাকিটা right angle এ।",
];

export function RecapBend({}: Story) {
  const s = useScene(4, [600, 1800, 2000, 2400, 2400]);
  const k = s.k;
  const f = X3_F;
  const foot: XY = [FOOT * V[0], FOOT * V[1]];
  const n: XY = [-3 / Math.sqrt(13), 2 / Math.sqrt(13)];
  const uv: XY = [-V[0] / Math.sqrt(13), -V[1] / Math.sqrt(13)];
  const gap: XY = [W[0] - foot[0], W[1] - foot[1]];
  const ug: XY = [gap[0] / Math.hypot(...gap), gap[1] / Math.hypot(...gap)];
  return (
    <Scene scene={s} caption={T_say(X10_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-3">
        <div className="w-full max-w-[8.5rem] shrink-0">
          <Plane f={f} ticks={1} label="নদী (2, 3), দড়ি (2, 1); shadow এর মাথা 7/13 অংশে; বাকিটা right angle এ" className="my-0! max-w-none">
            <Arrow f={f} from={O} to={V} tone="blue" w={2.2} faint={k >= 4} />
            <Arrow f={f} from={O} to={W} tone="coral" w={2.2} />
            {k === 0 && (
              <text x={f.sx(foot[0]) - 10} y={f.sy(foot[1]) + 4} textAnchor="end" fontSize={13} fontWeight={800} className="fill-[#b45309]">
                ?
              </text>
            )}
            {k >= 1 && k < 4 && (
              <g className={FADE}>
                <path d={`M${f.sx(W[0])} ${f.sy(W[1])}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={1.3} strokeDasharray="4 3" className="pointer-events-none stroke-accent" />
                <T_Square f={f} at={foot} a={uv} b={ug} size={0.24} />
              </g>
            )}
            {k >= 2 &&
              k < 4 &&
              Array.from({ length: 12 }, (_, i) => {
                const t = (i + 1) / 13;
                const c: XY = [t * V[0], t * V[1]];
                const h = i === 6 ? 0.2 : 0.1;
                return (
                  <path
                    key={i}
                    d={`M${f.sx(c[0] - n[0] * h)} ${f.sy(c[1] - n[1] * h)}L${f.sx(c[0] + n[0] * h)} ${f.sy(c[1] + n[1] * h)}`}
                    strokeWidth={i === 6 ? 1.8 : 1}
                    style={{ transitionDelay: `${i * 50}ms` }}
                    className={`pointer-events-none ${i <= 6 ? "stroke-accent" : "stroke-[#0f1b2d]/55"} ${FADE}`}
                  />
                );
              })}
            {k >= 4 && (
              <g key="split">
                <Arrow f={f} from={O} to={foot} tone="teal" w={3.2} draw />
                <Arrow f={f} from={foot} to={W} tone="amber" w={2} draw delay={500} />
                <g style={{ transitionDelay: "900ms" }} className={FADE}>
                  <T_Square f={f} at={foot} a={uv} b={ug} size={0.24} />
                </g>
              </g>
            )}
            {k >= 1 && <circle cx={f.sx(foot[0])} cy={f.sy(foot[1])} r={3.5} className={`pointer-events-none fill-accent ${POP}`} />}
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1 text-[0.85rem] leading-snug">
          {k >= 2 && (
            <div className={FADE}>
              অংশ <b className="font-mono">7/13</b>
            </div>
          )}
          {k >= 3 && (
            <div className={`${FADE} grid gap-0.5 font-mono text-[0.8rem]`}>
              <span>
                <span className="text-cat-coral">w</span> · <span className="text-cat-blue">v</span> = 7
              </span>
              <span style={{ transitionDelay: "400ms" }} className={FADE}>
                <span className="text-cat-blue">v</span> · <span className="text-cat-blue">v</span> = 13
              </span>
            </div>
          )}
          {k >= 4 && (
            <div className={`${FADE} text-[0.8rem]`}>
              <span className="font-semibold text-cat-teal">shadow</span> + <span className="font-semibold text-cat-amber">বাকি</span>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// SQ · Side quest from screen 5, a journey of its own (<SideQuest journey>, 5
//      steps): why does dividing by 13 give the shadow? The answer without
//      cos θ: turn the paper until the river lies flat.
//      1 That night, by the hurricane lamp, আপা copies both arrows onto thin
//        paper; the reader turns it (TurnPaper). Both lists change, the dot
//        product stays 7, and once the river is flat the rope's first number
//        is the shadow — 4.6's straight river again.
//      2 On the flat river the dot product is shadow × river length: the
//        second slot dies on the river's 0 (FlatDot).
//      3 So divide by the river's length — how many times? Once lands the boat
//        at 7, off the river's end (a length, not a share); twice lands on the
//        foot; three times stops short (DivideCount). Twice = ‖v‖² = v · v.
//      4 Your turn: a new pair, নদী (4, 3) and দড়ি (2, 4), turned by hand and
//        read off the grid, 4/5 = 20/25 (TurnAndRead).
//      5 The end, the loop closed (TurnRecap).
//      Figures: NightKhata (1 setup), KeepsTurning (1), ShadowTimesRiver (2),
//      TwoDivides (3, screen 5's own), FormulaTurns (4).

const SQ_SLOTS = ["ডানে", "উপরে"];
const SQ_TILT = Math.atan2(V[1], V[0]);
const SQ_FLAT = (SQ_TILT * 180) / Math.PI;
// Rounded: the server's and the browser's sin/cos can differ in the last digit,
// which would break hydration.
const sqRound = (n: number) => Math.round(n * 1e6) / 1e6;
const sqRot = (p: XY, a: number): XY => [sqRound(p[0] * Math.cos(a) - p[1] * Math.sin(a)), sqRound(p[0] * Math.sin(a) + p[1] * Math.cos(a))];
const sqUnit = (p: XY): XY => {
  const l = Math.hypot(...p);
  return [p[0] / l, p[1] / l];
};
const r2 = (p: XY): XY => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100];
/** the flat river and the rope turned with it: (3.61, 0) and (1.94, −1.11) */
const SQ_VF: XY = [Math.sqrt(13), 0];
const SQ_WF: XY = [7 / Math.sqrt(13), -4 / Math.sqrt(13)];

/** The boat seen from above, sailing along the flat river. */
function SQ_Boat({ f, x }: { f: Frame; x: number }) {
  return (
    <g style={{ transform: `translate(${f.sx(x)}px, ${f.sy(0)}px)` }} className="pointer-events-none">
      <path d="M-12 0Q-6 -5 5 -4.5L13 0L5 4.5Q-6 5 -12 0Z" className="fill-[#92400e]" />
      <circle cx={-1} r={2} className="fill-[#78350f]" />
    </g>
  );
}

/**
 * The thin paper with both arrows on it, turned by `a` (radians) over the
 * khata's grid, which stays put. The shadow is drawn on the river, and the drop
 * to its foot square. `arc` marks the angle between the two arrows.
 */
function SQ_Paper({ f, river, rope, a, lit = false, arc = false, sheet = true }: { f: Frame; river: XY; rope: XY; a: number; lit?: boolean; arc?: boolean; sheet?: boolean }) {
  const clip = `sq${useId().replace(/:/g, "")}`;
  const v = sqRot(river, a);
  const w = sqRot(rope, a);
  const share = dot(rope, river) / dot(river, river);
  const foot: XY = [share * v[0], share * v[1]];
  const gap: XY = [w[0] - foot[0], w[1] - foot[1]];
  const xs = [0, river[0], rope[0]];
  const ys = [0, river[1], rope[1]];
  const m = 0.35;
  const [x0, x1, y0, y1] = [Math.min(...xs) - m, Math.max(...xs) + m, Math.min(...ys) - m, Math.max(...ys) + m];
  const corners = ([[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as XY[]).map((c) => sqRot(c, a));
  const r = 0.8;
  const uv = sqUnit(v);
  const uw = sqUnit(w);
  return (
    <>
      {/* the thin paper, cut off where the khata's page ends */}
      {sheet && (
        <>
          <clipPath id={clip}>
            <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} />
          </clipPath>
          <path
            d={`M${corners.map((c) => `${f.sx(c[0])} ${f.sy(c[1])}`).join("L")}Z`}
            clipPath={`url(#${clip})`}
            strokeWidth={1}
            strokeDasharray="4 3"
            className="pointer-events-none fill-[#fde68a]/30 stroke-[#b45309]/50"
          />
        </>
      )}
      <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={lit ? 8 : 5} strokeLinecap="round" className="pointer-events-none stroke-cat-teal/60" />
      {arc && (
        <path
          d={`M${f.sx(uw[0] * r)} ${f.sy(uw[1] * r)}A${r * f.u} ${r * f.u} 0 0 0 ${f.sx(uv[0] * r)} ${f.sy(uv[1] * r)}`}
          strokeWidth={2}
          className="pointer-events-none fill-none stroke-[#d97706]"
        />
      )}
      <Arrow f={f} from={O} to={v} tone="blue" w={2.4} />
      <Arrow f={f} from={O} to={w} tone="coral" w={2.2} />
      <path d={`M${f.sx(w[0])} ${f.sy(w[1])}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={1.3} strokeDasharray="4 3" className="pointer-events-none stroke-accent" />
      {Math.hypot(...gap) > 0.2 && <T_Square f={f} at={foot} a={sqUnit([-v[0], -v[1]])} b={sqUnit(gap)} size={0.24} />}
      <circle cx={f.sx(foot[0])} cy={f.sy(foot[1])} r={3.5} className="pointer-events-none fill-accent" />
    </>
  );
}

/** a slider that turns the paper, bent on the left, flat once far enough */
function SQ_Turn({ deg, max, off, onTurn }: { deg: number; max: number; off: boolean; onTurn: (d: number) => void }) {
  return (
    <div className="mx-auto flex max-w-sm items-center gap-3">
      <span className="text-sm text-muted">বাঁকা</span>
      <input
        type="range"
        min={0}
        max={max}
        step={0.5}
        value={deg}
        disabled={off}
        aria-label="কাগজ কতটুকু ঘুরাবেন"
        onChange={(e) => onTurn(Number(e.target.value))}
        className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)] disabled:cursor-default"
      />
      <span className="text-sm text-muted">ঘুরানো</span>
    </div>
  );
}

// SQ 1 · Turn the paper.

const SQ1_F = makeFrame(-0.6, 4.1, -1.7, 3.5, 34);

export function TurnPaper() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 0);
  const [flat, setFlat] = useSeed("flat", false);
  const a = (-deg * Math.PI) / 180;
  const v = sqRot(V, a);
  const w = sqRot(W, a);
  const turn = (d: number) => {
    if (flat) return;
    if (Math.abs(d - SQ_FLAT) < 2.5) {
      setDeg(SQ_FLAT);
      setFlat(true);
      pass("নদী সোজা। দড়ির first number ই shadow.");
      return;
    }
    setDeg(d);
  };
  return (
    <>
      <Legend now={flat ? "নদী সোজা" : deg > 1 ? "কাগজ ঘুরছে" : "খাতার উপরে পাতলা কাগজ"} />
      <Plane f={SQ1_F} ticks={1} label={`পাতলা কাগজ ${Math.round(deg)} ডিগ্রি ঘুরানো; নদী ${tupF(v)}, দড়ি ${tupF(w)}`} className="max-w-[12.5rem]">
        <SQ_Paper f={SQ1_F} river={V} rope={W} a={a} lit={flat} />
      </Plane>
      <SQ_Turn deg={deg} max={75} off={flat} onTurn={turn} />
      <div className="mx-auto mt-1 grid max-w-[16rem] grid-cols-[auto_1fr] items-baseline gap-x-3 font-mono text-[0.95rem]">
        <b className="font-sans text-cat-blue">নদী</b>
        <Tup v={v} of={SQ_SLOTS} />
        <b className="font-sans text-cat-coral">দড়ি</b>
        <Tup v={w} of={SQ_SLOTS} />
        <span className="font-sans">dot product</span>
        <b key={flat ? "f" : "t"} className={flat ? `${POP} inline-block text-accent-text` : ""}>
          {num(dot(w, v))}
        </b>
      </div>
      {flat && (
        <div className={`${FADE} mt-1 text-center text-[0.95rem]`}>
          দড়ির first number <b className="font-mono text-cat-teal">1.94</b>. Shadow এর length ও <b className="font-mono text-cat-teal">1.94</b>.
        </div>
      )}
      <Task done={flat}>কাগজটা ঘুরিয়ে নদীকে ডান দিকের axis এর উপরে শুইয়ে দিন। ঘুরানোর সময় list দুইটা আর dot product এর দিকে চোখ রাখুন।</Task>
    </>
  );
}

// SQ 2 · The dot product on the flat river, slot by slot.

const SQ2_F = makeFrame(-0.4, 4, -1.5, 0.8, 40);

export function FlatDot() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const seeded = useSeeded();
  const p = usePlay(1100);
  const k = !ran ? 0 : seeded ? 3 : p.k;
  const run = () => {
    if (p.running) return;
    setRan(true);
    p.play(3, () => pass("Dot product = shadow × নদীর length."));
  };
  const f = SQ2_F;
  return (
    <>
      <Legend now="সোজা নদী" />
      <Plane f={f} ticks={1} label="সোজা নদী (3.61, 0), দড়ি (1.94, −1.11); shadow 1.94" className="max-w-[14rem]">
        <SQ_Paper f={f} river={V} rope={W} a={-SQ_TILT} lit={k === 1 || k >= 3} />
        {/* the second slot: the rope's other piece, straight down, meets the river's 0 */}
        {k === 2 && <Arrow key="rest" f={f} from={[SQ_WF[0], 0]} to={SQ_WF} tone="amber" w={2.6} draw list="(0, −1.11)" />}
        {k === 2 && (
          <text x={f.sx(SQ_WF[0]) + 8} y={f.sy(-0.7)} fontSize={11} fontWeight={800} fontFamily="ui-monospace, monospace" className={`fill-[#b45309] ${FADE}`}>
            × 0
          </text>
        )}
      </Plane>
      {ran ? (
        <BoxRun a={r2(SQ_WF)} b={r2(SQ_VF)} k={k} dense />
      ) : (
        <div className="mt-1 flex justify-center">
          <button type="button" onClick={run} className={primaryBtn}>
            Dot product চালান
          </button>
        </div>
      )}
      <div className="mt-1 min-h-6 text-center text-[0.9rem]">
        {k === 1 && (
          <span key="1" className={FADE}>
            First slot: <b className="text-cat-teal">shadow</b> × <b className="text-cat-blue">নদীর length</b>.
          </span>
        )}
        {k === 2 && (
          <span key="2" className={FADE}>
            Second slot: নদীর number 0। বাকি টুকরা যত বড়ই হোক, 0।
          </span>
        )}
        {k >= 3 && (
          <span key="3" className={FADE}>
            শুধু <b className="text-cat-teal">shadow</b> × <b className="text-cat-blue">নদীর length</b> টিকে থাকলো।
          </span>
        )}
      </div>
      <Task done={k >= 3}>সোজা নদীতে দড়ি আর নদীর dot product চালান। প্রতিটা slot কী দিচ্ছে, দেখুন।</Task>
    </>
  );
}

// SQ 3 · How many times to divide by the river's length. The boat sails to
//       the share it gets: once lands at 7, past the river's end; twice on the
//       foot; three times short of it.

const SQ3_F = makeFrame(-0.4, 7.5, -1.5, 0.9, 26);
const SQ3_L = Math.sqrt(13);
const SQ3_OPTS = [1, 2, 3];
const SQ3_RIGHT = 1;
const SQ3_NOPE = [
  "নৌকা নদী ছাড়িয়ে 7 এ গিয়ে থামলো। একবার ভাগ দিলে পাওয়া যায় 1.94. ওটা shadow এর length, ঘর দিয়ে মাপা। অংশ না।",
  "",
  "নৌকা মাথার অনেক আগেই থামলো। একবার বেশি ভাগ দিয়ে ফেলেছেন।",
];

export function DivideCount() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const p = usePlay(45);
  const right = pick === SQ3_RIGHT && !p.running;
  const share = (n: number) => 7 / SQ3_L ** n;
  const t = pick === null ? 0 : p.running ? p.k / 24 : 1;
  const x = pick === null ? 0 : t * share(SQ3_OPTS[pick]) * SQ3_L;
  const choose = (i: number) => {
    if (p.running || right) return;
    setPick(i);
    p.play(24, () => (i === SQ3_RIGHT ? pass("দুইবার ভাগ: 3.61 × 3.61 = 13.") : setMiss((m) => m + 1)));
  };
  const f = SQ3_F;
  return (
    <>
      <Legend now="নৌকা কোথায় থামে" />
      <Plane f={f} ticks={1} label="সোজা নদী 3.61 লম্বা; shadow এর মাথা 1.94 এ; নৌকা ভাগের অংশ ধরে চলে" className="max-w-[20rem]">
        <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(SQ3_L)}`} strokeWidth={16} className="pointer-events-none stroke-[#38bdf8]/20" />
        <path d={`M${f.sx(SQ3_L)} ${f.sy(0)}H${f.sx(7.4)}`} strokeWidth={1.2} strokeDasharray="3 4" className="pointer-events-none stroke-[#0f1b2d]/35" />
        <text x={f.sx(SQ3_L) + 4} y={f.sy(0.3)} fontSize={9} className="fill-[#5a6b7d]">
          নদী এখানে শেষ
        </text>
        <SQ_Paper f={f} river={V} rope={W} a={-SQ_TILT} sheet={false} />
        {pick !== null && <SQ_Boat f={f} x={x} />}
      </Plane>
      <div className="mt-1 min-h-6 text-center font-mono text-[0.95rem]">
        {pick !== null && (
          <span key={`${pick}-${miss}`} className={FADE}>
            অংশ {fix(share(SQ3_OPTS[pick]), 2)} → নৌকা {fix(t * share(SQ3_OPTS[pick]) * SQ3_L, 2)} ঘর
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {SQ3_OPTS.map((n, i) => (
          <Choice key={n} n={i} look={pick === i && !p.running ? (i === SQ3_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={right} onClick={() => choose(i)}>
            <div className="text-center font-mono text-[0.8rem] leading-tight font-bold">
              7
              {Array.from({ length: n }, (_, j) => (
                <div key={j}>÷ 3.61</div>
              ))}
            </div>
            <div className="mt-0.5 text-center text-[0.75rem]">{n} বার</div>
          </Choice>
        ))}
      </div>
      {pick !== null && !p.running && pick !== SQ3_RIGHT && <Nope key={miss}>{SQ3_NOPE[pick]}</Nope>}
      <Task done={right}>7 কে নদীর length, 3.61 দিয়ে কয়বার ভাগ দিলে নৌকা ঠিক shadow এর মাথায় থামে? একটা বেছে নিন।</Task>
    </>
  );
}

// SQ 4 · Your turn: নদী (4, 3), দড়ি (2, 4). Turn the paper flat by hand —
//       the river becomes (5, 0), the rope (4, 2) — then say the share. Each
//       pick sails the boat to it: 2/5 took the rope's second number, 4/25
//       divided by 25 where the flat river is 5 long.

const SQ4_V: XY = [4, 3];
const SQ4_W: XY = [2, 4];
const SQ4_FLAT = (Math.atan2(3, 4) * 180) / Math.PI;
const SQ4_F = makeFrame(-0.6, 5.5, -0.6, 4.6, 27);
const SQ4_OPTS = [
  { n: "2/5", s: 0.4 },
  { n: "4/5", s: 0.8 },
  { n: "4/25", s: 0.16 },
];
const SQ4_RIGHT = 1;
const SQ4_NOPE = [
  "নৌকা 2 এ থামলো, মাথার আগে। 2 হলো দড়ির second number, নদী থেকে কতটা সরে আছে। নদী বরাবর কতদূর, সেটা কোন number?",
  "",
  "নৌকা প্রায় শুরুতেই থামলো। সোজা নদীর length তো 5, 25 না। Shadow কে একবারই ভাগ দিন নদীর length দিয়ে।",
];

export function TurnAndRead() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 0);
  const [flat, setFlat] = useSeed("flat", false);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const p = usePlay(45);
  const right = pick === SQ4_RIGHT && !p.running;
  const a = (-deg * Math.PI) / 180;
  const v = sqRot(SQ4_V, a);
  const w = sqRot(SQ4_W, a);
  const t = pick === null ? 0 : p.running ? p.k / 24 : 1;
  const turn = (d: number) => {
    if (flat) return;
    if (Math.abs(d - SQ4_FLAT) < 2.5) {
      setDeg(SQ4_FLAT);
      setFlat(true);
      return;
    }
    setDeg(d);
  };
  const choose = (i: number) => {
    if (p.running || right) return;
    setPick(i);
    p.play(24, () => (i === SQ4_RIGHT ? pass("4/5 = 20/25. ঘুরিয়েও একই, না ঘুরিয়েও।") : setMiss((m) => m + 1)));
  };
  const f = SQ4_F;
  return (
    <>
      <Legend now={flat ? "এবার অংশটা বলুন" : "কাগজ ঘুরান"} />
      <Plane f={f} ticks={1} label={`নতুন নদী আর দড়ি, কাগজ ${Math.round(deg)} ডিগ্রি ঘুরানো; নদী ${tupF(v)}, দড়ি ${tupF(w)}`} className="max-w-[12rem]">
        <SQ_Paper f={f} river={SQ4_V} rope={SQ4_W} a={a} lit={flat} />
        {pick !== null && <SQ_Boat f={f} x={t * SQ4_OPTS[pick].s * 5} />}
      </Plane>
      {flat ? null : <SQ_Turn deg={deg} max={60} off={flat} onTurn={turn} />}
      <div className="mx-auto mt-1 grid max-w-[16rem] grid-cols-[auto_1fr] items-baseline gap-x-3 font-mono text-[0.95rem]">
        <b className="font-sans text-cat-blue">নদী</b>
        <Tup v={v} of={SQ_SLOTS} />
        <b className="font-sans text-cat-coral">দড়ি</b>
        <Tup v={w} of={SQ_SLOTS} />
      </div>
      {flat && (
        <div className={`${FADE} mt-2 grid grid-cols-3 gap-2`}>
          {SQ4_OPTS.map((o, i) => (
            <Choice key={o.n} n={i} look={pick === i && !p.running ? (i === SQ4_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={right} onClick={() => choose(i)}>
              <div className="text-center font-mono text-base font-bold">{o.n}</div>
              <div className="text-center text-[0.72rem] leading-tight">নদীর অংশ</div>
            </Choice>
          ))}
        </div>
      )}
      {pick !== null && !p.running && pick !== SQ4_RIGHT && <Nope key={miss}>{SQ4_NOPE[pick]}</Nope>}
      <Task done={right}>{flat ? "Shadow এর মাথা নদীর কত অংশে? একটা বেছে নিন, নৌকা গিয়ে দেখাবে।" : "নতুন নদী, নতুন দড়ি। কাগজ ঘুরিয়ে নদী সোজা করুন, তারপর বলুন shadow এর মাথা নদীর কত অংশে।"}</Task>
    </>
  );
}

// SQ 1a · A story scene for the side quest's setup, no task: load-shedding,
//         the hurricane lamp, ফাহিম at the table with 7 ÷ 13 in his khata;
//         আপা comes in with a sheet of thin paper. The turning is the screen's.

const SQ1A_G = 150;

export function NightKhata({}: Story) {
  const s = useScene(3, [600, 2200, 2000, 2200]);
  const k = s.k;
  const [ax] = useTween([k >= 2 ? 236 : 340], 1500);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="রাতে load-shedding; হারিকেনের আলোয় ফাহিম খাতায় 7 ÷ 13 নিয়ে বসে আছে; আপা একটা পাতলা কাগজ নিয়ে আসলেন">
        <rect x={0} y={0} width={320} height={180} fill="#0f172a" opacity={0.45} className="pointer-events-none" />
        <circle cx={170} cy={88} r={70} fill="#fde68a" opacity={0.28} className="pointer-events-none" />
        {/* the table, the khata, the lamp */}
        <rect x={110} y={112} width={120} height={5} fill="#92400e" />
        <rect x={116} y={117} width={4} height={33} fill="#78350f" />
        <rect x={220} y={117} width={4} height={33} fill="#78350f" />
        <rect x={138} y={105} width={34} height={7} rx={1} fill="white" stroke={T_INK} strokeOpacity={0.4} />
        <text x={155} y={111} textAnchor="middle" fontSize={5.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill={T_INK}>
          7 ÷ 13
        </text>
        <g className="pointer-events-none">
          <rect x={186} y={108} width={14} height={4} rx={1} fill="#57534e" />
          <path d="M188 108Q184 98 193 90Q202 98 198 108Z" fill="#fef3c7" stroke="#57534e" strokeWidth={0.8} />
          <ellipse cx={193} cy={100} rx={2} ry={3.5} fill="#f59e0b" />
          <path d="M187 90H199" stroke="#57534e" strokeWidth={1.2} />
        </g>
        <Person who="fahim" x={92} y={SQ1A_G} mood={k === 1 ? "puzzled" : k >= 3 ? "happy" : "plain"} arm="hold" />
        {k === 1 && <Bubble x={98} y={84} side="right" tone="think" lines={["ভাগ দিলে shadow", "আসে কেন?"]} />}
        <Person who="apa" x={ax} y={SQ1A_G} facing={-1} walking={k === 2} ms={1500} arm={k >= 3 ? "hold" : "down"} />
        {k >= 3 && (
          <g className={POP}>
            <rect x={ax - 30} y={96} width={20} height={14} rx={1} fill="#fef9c3" fillOpacity={0.85} stroke="#b45309" strokeOpacity={0.6} strokeDasharray="2 1.5" transform={`rotate(-18 ${ax - 20} 103)`} />
            <Bubble x={ax} y={80} side="left" lines={["কাগজটা ঘুরা।", "নদী সোজা করে ফেল।"]} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// SQ 1½ · A figure for step 1's explanation, no task: the pair turned to three
//         angles in turn. The lists change; the angle between them (the arc),
//         both lengths and the dot product do not.

const SQ1B_DEG = [0, 22, 40, SQ_FLAT];
const SQ1B_SAY = [
  "বাঁকা নদী আর দড়ি। মাঝের angle টা দেখুন, কমলা দাগ।",
  "একটু ঘুরালাম। list বদলালো। Angle একই, দুইটার length ও একই।",
  "আরো ঘুরালাম। এখনো angle একই। Dot product ও 7.",
  "নদী সোজা। তবু 7। Dot product শুধু length আর angle দেখে, কোনদিকে মুখ করে আছে দেখে না।",
];

export function KeepsTurning() {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;
  const [deg] = useTween([SQ1B_DEG[k]], 1100);
  const a = (-deg * Math.PI) / 180;
  const v = sqRot(V, a);
  const w = sqRot(W, a);
  return (
    <Scene scene={s} caption={T_say(SQ1B_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-3">
        <div className="w-full max-w-[9rem] shrink-0">
          <Plane f={SQ1_F} ticks={1} label={`কাগজ ${Math.round(deg)} ডিগ্রি ঘুরানো; angle একই, dot product 7`} className="my-0! max-w-none">
            <SQ_Paper f={SQ1_F} river={V} rope={W} a={a} arc lit={k >= 3} />
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1 font-mono text-[0.78rem] leading-snug">
          <span>
            <span className="text-cat-blue">v</span> <Tup v={v} of={SQ_SLOTS} />
          </span>
          <span>
            <span className="text-cat-coral">w</span> <Tup v={w} of={SQ_SLOTS} />
          </span>
          <span className="font-sans text-[#b45309]">angle ≈ 30°</span>
          <span className="font-sans">
            dot product <b>7</b>
          </span>
        </div>
      </div>
    </Scene>
  );
}

// SQ 2½ · A figure for step 2's explanation, no task: shadow × river length
//         as a rectangle, 1.94 by 3.61, about 7 squares; the rest × 0 adds
//         nothing; and the bent river's own 2 × 2 + 3 × 1 is the same 7.

const SQ2B_U = 22;
const SQ2B_SAY = [
  "First slot: দড়ির first number, মানে shadow, গুণ নদীর length.",
  "Second slot: দড়ির বাকি টুকরা গুণ নদীর 0। কিছুই যোগ হয় না।",
  "তাই dot product = shadow × নদীর length. 1.94 চওড়া, 3.61 লম্বা একটা আয়ত, ভিতরে প্রায় 7 ঘর।",
  "বাঁকা নদীতেও একই 7: 2 × 2 + 3 × 1। কাগজ ঘুরালে dot product বদলায় না।",
];

export function ShadowTimesRiver() {
  const s = useScene(3, [600, 2000, 2000, 2600]);
  const k = s.k;
  const L = Math.sqrt(13) * SQ2B_U;
  const H = (7 / Math.sqrt(13)) * SQ2B_U;
  const [rest] = useTween([k >= 1 ? 0 : 1.11 * SQ2B_U], 900);
  const x0 = 30;
  const y0 = 24;
  return (
    <Scene scene={s} caption={T_say(SQ2B_SAY, k)}>
      <div className="mx-auto w-full max-w-[17rem]">
        <svg viewBox="0 0 250 112" role="img" aria-label="shadow 1.94 আর নদীর length 3.61 এর গুণ একটা আয়ত, ভিতরে প্রায় 7 ঘর; বাকি টুকরা গুণ 0" className="block h-auto w-full">
          {/* the river's length along the top, the shadow down the side */}
          <rect x={x0} y={y0 - 8} width={L} height={5} rx={2} className="fill-cat-blue/70" />
          <text x={x0 + L / 2} y={y0 - 11} textAnchor="middle" fontSize={8.5} fontWeight={700} className="fill-cat-blue">
            নদীর length 3.61
          </text>
          <rect x={x0 - 8} y={y0} width={5} height={H} rx={2} className="fill-cat-teal/80" />
          <text x={x0 - 11} y={y0 + H / 2} textAnchor="middle" fontSize={8.5} fontWeight={700} className="fill-cat-teal" transform={`rotate(-90 ${x0 - 11} ${y0 + H / 2})`}>
            shadow 1.94
          </text>
          {/* the second slot: the rest, squashed to nothing by the river's 0 */}
          {k < 3 && (
            <g className={FADE}>
              <rect x={x0 + L + 18} y={y0} width={5} height={rest} rx={2} className="fill-cat-amber/80" />
              <text x={x0 + L + 28} y={y0 + 10} fontSize={8.5} fontWeight={700} className="fill-[#b45309]">
                {k >= 1 ? "বাকি × 0" : "বাকি টুকরা"}
              </text>
              {k === 2 && (
                <text x={x0 + L + 28} y={y0 + 22} fontSize={9} fontWeight={800} fontFamily="ui-monospace, monospace" className="fill-[#b45309]">
                  = 0
                </text>
              )}
            </g>
          )}
          {/* the product: the rectangle, with its squares */}
          {k >= 2 && (
            <g className={FADE}>
              <rect x={x0} y={y0} width={L} height={H} className="fill-cat-teal/15 stroke-cat-teal" strokeWidth={1.2} />
              {Array.from({ length: 3 }, (_, i) => (
                <path key={`v${i}`} d={`M${x0 + (i + 1) * SQ2B_U} ${y0}V${y0 + H}`} strokeWidth={0.6} className="stroke-cat-teal/50" />
              ))}
              <path d={`M${x0} ${y0 + SQ2B_U}H${x0 + L}`} strokeWidth={0.6} className="stroke-cat-teal/50" />
              <text x={x0 + L / 2} y={y0 + H / 2 + 5} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily="ui-monospace, monospace" className="fill-current">
                7
              </text>
            </g>
          )}
          {k >= 3 && (
            <text x={x0 + L + 14} y={y0 + H / 2 + 4} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" className={`fill-current ${FADE}`}>
              = 2×2 + 3×1
            </text>
          )}
        </svg>
      </div>
    </Scene>
  );
}

// SQ 4½ · A figure for step 4's explanation, no task: the same answer with no
//         turning. The bent pair (4, 3) and (2, 4), its two dot products, and
//         the foot dropping on 20/25 of the river — where the turned paper said.

const SQ4B_F = makeFrame(-0.4, 4.4, -0.4, 4.4, 26);
const SQ4B_SAY = [
  "কাগজ ঘুরাবো না। নদী (4, 3), দড়ি (2, 4) যেমন আছে তেমন।",
  "দড়ি · নদী = 2×4 + 4×3 = 20।",
  "নদী · নদী = 4×4 + 3×3 = 25।",
  "20/25, মানে 4/5। মাথা ঠিক ওখানেই, যেখানে ঘুরানো কাগজ বলেছিল।",
];

export function FormulaTurns() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const foot: XY = [0.8 * SQ4_V[0], 0.8 * SQ4_V[1]];
  const f = SQ4B_F;
  return (
    <Scene scene={s} caption={T_say(SQ4B_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-3">
        <div className="w-full max-w-[8.5rem] shrink-0">
          <Plane f={f} ticks={1} label="নদী (4, 3), দড়ি (2, 4); shadow এর মাথা নদীর 20/25 অংশে" className="my-0! max-w-none">
            <Arrow f={f} from={O} to={SQ4_V} tone="blue" w={2.2} />
            <Arrow f={f} from={O} to={SQ4_W} tone="coral" w={2.2} />
            {k >= 3 && (
              <g className={FADE}>
                <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={5} strokeLinecap="round" className="pointer-events-none stroke-cat-teal/60" />
                <path d={`M${f.sx(SQ4_W[0])} ${f.sy(SQ4_W[1])}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={1.3} strokeDasharray="4 3" className="pointer-events-none stroke-accent" />
                <circle cx={f.sx(foot[0])} cy={f.sy(foot[1])} r={3.5} className={`pointer-events-none fill-accent ${POP}`} />
              </g>
            )}
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1 font-mono text-[0.8rem] leading-snug">
          {k >= 1 && (
            <span className={FADE}>
              <span className="text-cat-coral">w</span> · <span className="text-cat-blue">v</span> = 20
            </span>
          )}
          {k >= 2 && (
            <span className={FADE}>
              <span className="text-cat-blue">v</span> · <span className="text-cat-blue">v</span> = 25
            </span>
          )}
          {k >= 3 && <b className={`${FADE} text-accent-text`}>20/25 = 4/5</b>}
        </div>
      </div>
    </Scene>
  );
}

// SQ 5 · A recap for the side quest's ending, no task: the paper turns flat,
//        the dot product reads as shadow × river, and the two divisions by the
//        river's length land on 7/13. Written with `story`: the last step has
//        no widget.

const SQ5_SAY = [
  "প্রশ্ন ছিল: 7 কে 13 দিয়ে ভাগ দিলে shadow আসে কেন?",
  "কাগজ ঘুরিয়ে নদী সোজা করলাম। Dot product তখনো 7.",
  "সোজা নদীতে dot product = shadow × নদীর length.",
  "একবার নদীর length দিয়ে ভাগ: shadow এর length, 1.94.",
  "আরেকবার ভাগ: নদীর কত অংশ। দুইবারে ভাগ হলো 13 দিয়ে, মানে নদী · নদী।",
];

export function TurnRecap({}: Story) {
  const s = useScene(4, [600, 2000, 2000, 2000, 2600]);
  const k = s.k;
  const [deg] = useTween([k >= 1 ? SQ_FLAT : 0], 1300);
  const a = (-deg * Math.PI) / 180;
  return (
    <Scene scene={s} caption={T_say(SQ5_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[19rem] items-center gap-3">
        <div className="w-full max-w-[9rem] shrink-0">
          <Plane f={SQ1_F} ticks={1} label="পাতলা কাগজ ঘুরে নদী সোজা; shadow নদীর 7/13 অংশ" className="my-0! max-w-none">
            <SQ_Paper f={SQ1_F} river={V} rope={W} a={a} lit={k >= 2} />
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1 font-mono text-[0.78rem] leading-snug">
          {k === 0 && <b className="text-lg text-[#b45309]">7 ÷ 13 ?</b>}
          {k >= 2 && (
            <span className={FADE}>
              7 = <span className="text-cat-teal">1.94</span> × <span className="text-cat-blue">3.61</span>
            </span>
          )}
          {k >= 3 && <span className={FADE}>7 ÷ 3.61 = <span className="text-cat-teal">1.94</span></span>}
          {k >= 4 && <b className={`${FADE} text-accent-text`}>÷ 3.61 আবার = 7/13</b>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  TapFoot: { start: {}, wrong: { tap: 3, miss: 1 }, right: { tap: 5 } },
  ShareWalk: { start: {}, wrong: { parts: 5 }, fits: { parts: 13 }, walked: { parts: 13, step: 7, walked: true } },
  SevenFromBox: { start: {}, ran: { ran: true }, matched: { ran: true, matched: true } },
  ThirteenFromRiver: { start: {}, one: { sq: [0] }, both: { sq: [0, 1] }, added: { sq: [0, 1], added: true } },
  FindFoot: { start: {}, near: { lam: 0.45 }, found: { lam: FOOT, found: true } },
  ShadowRecipe: { start: {}, box: { k: 2 }, half: { k: 3 }, glow: { k: 4, ph: 0 }, slid: { k: 4, ph: 1 }, legs: { k: 4, ph: 3 }, baki: { k: 4 }, all: { k: 5 } },
  ShareToPoint: { start: {}, half: { seen: [0, 1], last: 1 }, wrong: { seen: [0, 1], last: 1, pick: 0 }, right: { seen: [0, 1], last: 1, pick: 1 } },
  KhataDot: { rest: { k: 0 }, ask: { k: 1 }, done: {} },
  ShrinkBoth: { rest: { k: 0 }, half: { k: 1 }, done: {} },
  BakiPull: { split: { k: 2 }, slid: { k: 3 }, done: {} },
  KeepShadows: { start: {}, along: { mode: 1, seen: [1] }, across: { mode: 2, seen: [1, 2] } },
  BoxRecall: { start: {}, wrong: { pick: 0, miss: 1 }, right: { pick: 2 } },
  ZeroAnySlots: { rest: { k: 0 }, turned: { k: 1 }, done: {} },
  BendsAhead: { rest: { k: 0 }, bends: { k: 1 }, sun: { k: 2 }, done: {} },
  RiverSquare: { rest: { k: 0 }, legs: { k: 2 }, done: {} },
  SecondBend: { rest: { k: 0 }, ask: { k: 2 }, done: {} },
  HalfwayWhy: { rest: { k: 0 }, mid: { k: 2 }, done: {} },
  RiverBend: { rest: { k: 0 }, river: { k: 2 }, ask: { k: 4 }, done: {} },
  RecipeAloud: { div: { k: 3 }, done: {} },
  AnyRiver: { first: { k: 0 }, east: { k: 1 }, third: { k: 2 }, done: {} },
  FahimIdea: { rest: { k: 0 }, one: { k: 1 }, cloud: { k: 2 }, done: {} },
  OnePoint: { rest: { k: 0 }, along: { k: 2 }, done: {} },
  FewNumbers: { rest: { k: 0 }, few: { k: 2 }, done: {} },
  GhatRiddle: { rest: { k: 0 }, cards: { k: 3 }, done: {} },
  DabTreat: { rest: { k: 0 }, done: {} },
  LibraryTwo: { rest: { k: 0 }, search: { k: 2 }, done: {} },
  BendNear: { rest: { k: 0 }, walk: { k: 1 }, done: {} },
  TwoDivides: { rest: { k: 0 }, once: { k: 1 }, river: { k: 2 }, share: { k: 3 }, done: {} },
  RecapBend: { rest: { k: 0 }, slide: { k: 1 }, count: { k: 2 }, boxes: { k: 3 }, done: {} },
  SevenThirteen: { rest: { k: 0 }, ticks: { k: 1 }, ask13: { k: 2 }, done: {} },
  WhySeven: { two: { k: 2 }, done: {} },
  TurnPaper: { start: {}, mid: { deg: 30 }, flat: { deg: SQ_FLAT, flat: true } },
  FlatDot: { start: {}, done: { ran: true } },
  DivideCount: { start: {}, once: { pick: 0, miss: 1 }, thrice: { pick: 2, miss: 1 }, right: { pick: 1 } },
  TurnAndRead: { start: {}, mid: { deg: 20 }, flat: { deg: SQ4_FLAT, flat: true }, wrong: { deg: SQ4_FLAT, flat: true, pick: 0, miss: 1 }, right: { deg: SQ4_FLAT, flat: true, pick: 1 } },
  NightKhata: { rest: { k: 0 }, ask: { k: 1 }, done: {} },
  KeepsTurning: { rest: { k: 0 }, mid: { k: 2 }, done: {} },
  ShadowTimesRiver: { rest: { k: 0 }, zero: { k: 1 }, rect: { k: 2 }, done: {} },
  FormulaTurns: { rest: { k: 0 }, done: {} },
  TurnRecap: { rest: { k: 0 }, done: {} },
  YourShadow: { start: {}, box: { done: 1 }, slip8: { done: 0, miss: 1, bad: 1 }, slip4: { done: 1, miss: 1, bad: 2 }, miss: { done: 2, miss: 1, bad: 0 }, over: { done: 2, miss: 1, bad: 1 }, add: { done: 3, miss: 1, bad: 1 }, flip: { done: 3, miss: 1, bad: 2 }, minus: { done: 4, miss: 1, bad: 0 }, all: { done: 5 } },
};
