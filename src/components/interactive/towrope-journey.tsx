"use client";

import { useEffect, useState } from "react";

import { Bubble, Loop, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, pill, usePlay, useScene, useSeed, useSeeded, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Label, Plane, makeFrame, sg, snap, type Frame, type XY } from "@/components/journey/plane";
import { tupN } from "./haat-journey";

// Screens for "Math for AI 4.6 — Towing the boat, how much of the pull works", told as a Journey.
//
// Eight screens. 1 recalls 4.5's cosine as a picture: of three pairs of unit
// arrows, which one's shadow is 0.5 long? 2 tows the loaded boat home from the
// bank, মাঝি চাচা claims a long rope wastes less pull, and the reader bets.
// 3 splits a pull by hand into a part along the river (the shadow) and a part
// at right angles (the leftover). 4 lets go of the tiller, so the leftover is
// seen doing nothing but dragging the boat to the bank. 5 settles the bet on
// the rope slider. 6 is মামি's slip, cosine 0 taken for −1, answered on a
// picture (MamiPick). 7 picks the least
// wasteful of three ropes, 8 closes and points at the bend ahead
// (04e2_bent_river, which carries the projection sum).
//
// After the screens come the story scenes (the khata at night, the tow, the
// helmsman, মামি at home, the bend past noon) and the watch-only figures (the
// last screen's recap is GunHisab), each
// numbered after its screen (1a, 2½, …).
//
// Tailwind only; the sheets are journey/plane. Ink on the white sheet is fixed.

export const O: XY = [0, 0];
export const fix = (n: number, d: number) => {
  const s = Math.abs(n).toFixed(d);
  return n < 0 && Number(s) !== 0 ? `−${s}` : s;
};
export const tupF = (v: readonly number[], d = 2) => `(${v.map((x) => fix(x, d)).join(", ")})`;

/**
 * A river band along the x axis, with a bank line at y = bank. Given a bank,
 * the water fills everything below it, so a boat that drifts off the river's
 * line is still seen to be on the water until it reaches the bank.
 */
function River({ f, bank }: { f: Frame; bank?: number }) {
  return (
    <g className="pointer-events-none">
      {bank !== undefined && <rect x={f.sx(f.x0)} y={f.sy(bank)} width={(f.x1 - f.x0) * f.u} height={(bank - f.y0) * f.u} className="fill-[#38bdf8]/15" />}
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
// 1 · Last night's cosine, recalled as a picture instead of a sum: three pairs
//     of arrows, 30°, 60° and 90°, each arrow one unit long. Which pair's
//     cosine is 0.5? A pick drops 4.3's noon light on that pair and draws the
//     shadow along the first arrow, so a wrong pick shows its own cosine
//     rather than a ✕. Unit arrows, so the shadow's length *is* the cosine —
//     which is the tool the whole journey then runs on.

const CR_F = makeFrame(-0.25, 1.3, -0.25, 1.2, 92);
const CR_ANG = [30, 60, 90];
const CR_RIGHT = 1;
const CR_COS = [Math.cos(Math.PI / 6), 0.5, 0];
/** the cosine as the reader reads it: 0.5, not 0.50, so it matches the question */
const CR_SHOW = ["0.87", "0.5", "0"];

/** one pair of arrows at `deg`, as a small picture for a Choice */
function CR_Pic({ deg }: { deg: number }) {
  const r = (deg * Math.PI) / 180;
  return (
    <svg viewBox="0 0 76 56" role="img" aria-label={`${deg} degree এর জোড়া`} className="mx-auto block h-auto w-full max-w-[4.8rem]">
      {/* on the page, not on a white sheet: the ink follows the Choice's own colour, in either theme */}
      <path d="M10 48H62" strokeWidth={2.4} strokeLinecap="round" className="stroke-current" />
      <path d={`M10 48L${10 + 42 * Math.cos(r)} ${48 - 42 * Math.sin(r)}`} strokeWidth={2.4} strokeLinecap="round" className="stroke-cat-coral" />
      <text x={72} y={16} textAnchor="end" fontSize={13} fontWeight={800} fontFamily="ui-monospace" className="fill-current">
        {deg}°
      </text>
    </svg>
  );
}

export function CosRecall() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const seeded = useSeeded();
  const p = usePlay(650);
  // 0 nothing yet, 1 the light and the drop line, 2 the shadow and its number.
  const k = pick === null ? 0 : seeded ? 2 : p.k;
  const deg = pick === null ? 0 : CR_ANG[pick];
  const c = pick === null ? 0 : CR_COS[pick];
  const a = (deg * Math.PI) / 180;
  const tip: XY = [Math.cos(a), Math.sin(a)];

  const choose = (i: number) => {
    setPick(i);
    if (i !== CR_RIGHT) setMiss(miss + 1);
    p.play(
      2,
      () => {
        if (i === CR_RIGHT) pass("Cosine 0.5 মানে 60° এর angle।");
      },
      0,
    );
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-[20rem] items-center gap-3">
        <div className="w-full max-w-[12rem] shrink-0">
          <Plane f={CR_F} grid={0} axes={false} label={pick === null ? "দুইটা arrow এর জোড়া, এখনো বেছা হয় নাই" : `${deg}° এর জোড়া, shadow ${CR_SHOW[pick]}`} className="my-0! max-w-none">
            <Arrow f={CR_F} from={O} to={[1, 0]} tone="ink" w={2.6} />
            {pick !== null && k >= 1 && (
              <g className={FADE}>
                {[0.15, 0.45, 0.75, 1.05].map((x) => (
                  <path key={x} d={`M${CR_F.sx(x)} ${CR_F.sy(1.12)}V${CR_F.sy(0.06)}`} strokeWidth={1} className="pointer-events-none stroke-[#f59e0b]/45" />
                ))}
                <circle cx={CR_F.sx(0.6)} cy={CR_F.sy(1.16)} r={6} className="pointer-events-none fill-[#f59e0b]" />
                <path d={`M${CR_F.sx(tip[0])} ${CR_F.sy(tip[1])}V${CR_F.sy(0)}`} strokeWidth={1.3} strokeDasharray="3 3" className="pointer-events-none stroke-[#b45309]" />
              </g>
            )}
            {pick !== null && k >= 2 && c > 0 && <Arrow key={`s${pick}`} f={CR_F} from={O} to={[c, 0]} tone="teal" w={3.6} draw />}
            {pick !== null && k >= 2 && c === 0 && <circle cx={CR_F.sx(0)} cy={CR_F.sy(0)} r={5} strokeWidth={2} className={`fill-white stroke-cat-teal ${POP}`} />}
            {pick !== null && <Arrow key={`w${pick}`} f={CR_F} from={O} to={tip} tone="coral" w={2.6} draw />}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-xs text-muted">angle</div>
          <div className="font-mono text-2xl font-bold">{pick === null ? "?" : `${deg}°`}</div>
          <div className="mt-2 text-xs text-muted">shadow, মানে cos θ</div>
          <div className="font-mono text-2xl font-bold text-cat-teal">{pick === null || k < 2 ? "?" : CR_SHOW[pick]}</div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {CR_ANG.map((d, i) => (
          <Choice key={d} n={i} look={pick === i ? (i === CR_RIGHT ? "right" : "wrong") : "idle"} disabled={false} onClick={() => choose(i)}>
            <CR_Pic deg={d} />
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== CR_RIGHT && (
        <Nope key={miss}>
          {pick === 0 ? "30° এ আরো শক্ত মিল। Shadow লম্বা, cos 0.87." : "90° এ shadow বলে কিছুই নাই, cos 0।"} মাঝামাঝি একটা লাগবে।
        </Nope>
      )}
      <Task done={pick === CR_RIGHT}>তিনটা জোড়ার কোনটার cosine 0.5, ছবি দেখে বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The tow. Two men on the bank pull the boat with a rope. মাঝি চাচা's
//     claim: the longer the rope, the less pull is wasted. Sealed; LongRope
//     (screen 5) settles it.

const FT = makeFrame(-1, 9, -1, 4, 30);
const ROPE_BET = ["ঠিক — দড়ি লম্বা হলে টান কম নষ্ট হয়", "দড়ির length এ কিছু যায় আসে না, টান তো টানই", "উল্টাটা — ছোট দড়ি কাছ থেকে টানে, তাই বেশি কাজে লাগে"];

export function RopeBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  // once the bet is sealed the tow moves on: boat and boatmen glide upriver together
  const [d] = useTween([bet === null ? 0 : 1.2], 1600);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি ধরা হয়ে গেলো। শেষে মিলিয়ে দেখবো।");
  };

  return (
    <>
      <Plane f={FT} grid={0} axes={false} label="নদীতে নৌকা, পাড় থেকে দুইজন দড়ি দিয়ে টানছে" className="max-w-[20rem]">
        <River f={FT} bank={3} />
        <path d={`M${FT.sx(d)} ${FT.sy(0)}L${FT.sx(6 + d)} ${FT.sy(3)}`} strokeWidth={1.4} className="pointer-events-none stroke-[#78350f]" />
        <Boat f={FT} at={[d, 0]} />
        <Man f={FT} at={[6 + d, 3]} />
        <Man f={FT} at={[7 + d, 3]} />
        <Label f={FT} at={[4, 0]} dy={20} size={9} weight={500} className="fill-[#0284c7]">
          নদী →
        </Label>
        <Label f={FT} at={[1.5, 3.4]} size={9} weight={500} className="fill-[#4d7c0f]">
          পাড়
        </Label>
      </Plane>
      <div className="text-sm font-medium text-muted">মাঝি চাচা বলছেন, দড়ি লম্বা যত বেশি হইবো, টানা তত কম লাগবো। আপনার কী মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {ROPE_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>ছবিটা দেখে একটার উপরে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · A pull splits in two. The river runs east. Drag the pull's tip: its
//     shadow on the river (forward) and what's left (towards the bank) are
//     drawn live. Find: all forward, no forward at all, and (4, 3).

const FS = makeFrame(-1, 7, -1, 4.5, 34);
const SPLIT_GOALS = ["পুরা টানটাই সামনে", "সামনে কিছুই না", "সামনে 4, পাড়ের দিকে 3"];

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
    if (next.length === SPLIT_GOALS.length) pass("প্রতিটা টান দুই ভাগ হয়: সামনে, আর পাড়ের দিকে।");
  };

  return (
    <>
      <Plane f={FS} ticks={1} label={`টান ${tupN(w)}`} drag={{ down: move, move }} className="max-w-[20rem]">
        <River f={FS} bank={3} />
        {/* the rope the pull runs along, so the red arrow reads as a rope and not just an arrow */}
        <path d={`M${FS.sx(0)} ${FS.sy(0)}L${FS.sx(w[0])} ${FS.sy(w[1])}`} strokeWidth={1.4} className="pointer-events-none stroke-[#78350f]" />
        {w[1] >= 2.6 && <Man f={FS} at={[w[0], w[1]]} />}
        <Boat f={FS} />
        {w[0] !== 0 && <Arrow f={FS} from={O} to={[w[0], 0]} tone="teal" w={3} />}
        {w[1] !== 0 && <Arrow f={FS} from={[w[0], 0]} to={w} tone="amber" w={2} dashed />}
        <Arrow f={FS} from={O} to={w} tone="coral" w={2.6} />
      </Plane>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl border-2 border-cat-teal/40 px-2 py-1.5">
          <div className="text-xs text-muted">নদী বরাবর সামনে</div>
          <div className="font-mono text-lg font-bold">{sg(w[0])}</div>
        </div>
        <div className="rounded-xl border-2 border-cat-amber/40 px-2 py-1.5">
          <div className="text-xs text-muted">পাড়ের দিকে, right angle এ</div>
          <div className="font-mono text-lg font-bold">{sg(w[1])}</div>
        </div>
      </div>
      <Ticks items={SPLIT_GOALS.map((g, i) => [g, hit.includes(i)])} />
      <Task done={all}>টানের মাথা ঘুরিয়ে ঘুরিয়ে তিনটা অবস্থা খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Where the leftover goes. Predict what the boat does if the হালের মাঝি
//     lets go of the tiller, then press it: the boat itself glides, and its
//     track stays on the water. Let go and it slides towards the bank; hold on
//     and it runs straight along the river. Every press moves it on from where
//     it stopped, in a shorter step, so the track never runs off the sheet.

const FP = makeFrame(-1, 8, -1, 3.5, 30);
const DRIFT = ["সোজা সামনে", "সামনেও যাবে, পাড়ের দিকেও ভেসে যাবে", "শুধু পাড়ের দিকে, সামনে একটুও না"];

export function SidePull() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [free, setFree] = useSeed<boolean | null>("free", null);
  const [seen, setSeen] = useSeed<boolean[]>("seen", []);
  const [track, setTrack] = useSeed<XY[]>("track", [O]);
  const end = track[track.length - 1];
  const [bx, by] = useTween(end, 1500);
  const both = seen.includes(true) && seen.includes(false);
  // the tow walks on with the boat: the men stay ahead of it on the bank
  const manX = bx + 3;

  const go = (f: boolean) => {
    const [x, y] = end;
    const d = (6.2 - x) * 0.5;
    const next: XY = f ? [x + d, Math.min(2.4, y + d * 0.6)] : [x + d, y];
    setTrack([...track, next]);
    setFree(f);
    if (seen.includes(f)) return;
    const s = [...seen, f];
    setSeen(s);
    if (s.includes(true) && s.includes(false)) pass("Right angle এর part টা নৌকাকে সামনে নেয় না।");
  };

  return (
    <>
      <Plane f={FP} grid={0} axes={false} label="হাল ছেড়ে দিলে নৌকা পাড়ের দিকে ভেসে যায়, হাল ধরে রাখলে সোজা সামনে যায়" className="max-w-[20rem]">
        <River f={FP} bank={3} />
        {track.length > 1 && (
          <path
            d={track.map((t, i) => `${i ? "L" : "M"}${FP.sx(t[0])} ${FP.sy(t[1])}`).join("")}
            strokeWidth={1.4}
            strokeDasharray="4 4"
            className="pointer-events-none fill-none stroke-[#0f1b2d]/45"
          />
        )}
        <path d={`M${FP.sx(bx)} ${FP.sy(by)}L${FP.sx(manX)} ${FP.sy(3)}`} strokeWidth={1.2} className="pointer-events-none stroke-[#78350f]" />
        <Man f={FP} at={[manX, 3]} />
        <Arrow f={FP} from={[bx, by]} to={[bx + 1.5, by]} tone="teal" w={2.6} />
        <Arrow f={FP} from={[bx, by]} to={[bx, by + 1]} tone="amber" w={2.2} dashed />
        {free === false && <Arrow key={`hal${track.length}`} f={FP} from={[bx, by]} to={[bx, by - 1]} tone="violet" w={2.2} draw />}
        {free === false && (
          <Label f={FP} at={[bx, by - 1]} dx={6} dy={3} anchor="start" size={9} className={`fill-[#6d28d9] ${FADE}`}>
            হাল
          </Label>
        )}
        <Boat f={FP} at={[bx, by]} />
      </Plane>
      {guess === null ? (
        <>
          <div className="text-sm font-medium text-muted">মাঝি হাল ছেড়ে দিলো — নৌকা এখন কোনদিকে যাবে?</div>
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
            <button type="button" onClick={() => go(true)} className={`${pill(free === true)} font-sans`}>
              হাল ছেড়ে দিন
            </button>
            <button type="button" onClick={() => go(false)} className={`${pill(free === false)} font-sans`}>
              হাল ধরে রাখুন
            </button>
          </div>
          {free !== null && (
            <div key={`say${track.length}`} className={`${FADE} mt-2 text-center text-[0.95rem]`}>
              {free
                ? `${guess === 1 ? "ঠিক ধরেছেন। " : ""}নৌকা সামনেও গেলো, পাড়ের দিকেও ভেসে গেলো। সামনে যাওয়াটুকু পুরাটাই সবুজ part এর কাজ।`
                : "মাঝি হাল ধরে উল্টা দিকে চাপ দিলো। নৌকা সোজা সামনে গেলো, পাড়ের দিকে এক চুলও না।"}
            </div>
          )}
        </div>
      )}
      {guess !== null && (
        <Ticks
          items={[
            ["হাল ছাড়া", seen.includes(true)],
            ["হাল ধরা", seen.includes(false)],
          ]}
        />
      )}
      <Task done={both}>আগে guess করুন। এরপর নৌকাটা চালান, একবার হাল ছেড়ে, একবার হাল ধরে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The bet. The bank is 3 m away; the rope length slider runs 3.5 → 15 m.
//     With a pull of 10, forward = 10 cos θ climbs 5.2 → 9.8 while the
//     sideways part falls 8.6 → 2. Visit a short, a middle and a long rope.

const FLR = makeFrame(-0.8, 15.3, -0.8, 3.8, 21);
const PULL = 10;

export function LongRope() {
  const pass = useGate();
  const [rope, setRope] = useSeed("rope", 5);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const x = Math.sqrt(rope * rope - 9);
  const cos = x / rope;
  const fwd = PULL * cos;
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
    if (next.length === 3) pass("লম্বা দড়ি টানের প্রায় পুরাটাই সামনে পাঠায়।");
  };

  return (
    <>
      <Plane f={FLR} grid={0} axes={false} label={`${rope} metre দড়ি, angle ${fix(theta, 0)}°`} className="max-w-[22rem]">
        <River f={FLR} bank={3} />
        <path d={`M${FLR.sx(0)} ${FLR.sy(0)}L${FLR.sx(x)} ${FLR.sy(3)}`} strokeWidth={1.4} className="pointer-events-none stroke-[#78350f]" />
        <Man f={FLR} at={[x, 3]} />
        {/* the same split as screen 3, drawn on the boat: green forward, yellow towards the bank */}
        <Arrow f={FLR} from={O} to={[fwd * 0.42, 0]} tone="teal" w={3} />
        <Arrow f={FLR} from={O} to={[0, side * 0.24]} tone="amber" w={2.4} dashed />
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
          aria-label="দড়ি কত metre"
          onChange={(e) => slide(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
        />
        <span className="text-sm text-muted">লম্বা</span>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        দড়ি <b className="font-mono">{rope}</b> metre, angle <b className="font-mono">{fix(theta, 0)}°</b>, cos θ <b className="font-mono text-cat-teal">{fix(cos, 2)}</b>
      </div>
      <div className="mx-auto mt-2 grid max-w-sm gap-1.5">
        {[
          { name: `সামনে, 10 × ${fix(cos, 2)}`, v: fwd, bar: "bg-cat-teal" },
          { name: "পাড়ের দিকে, নষ্ট", v: side, bar: "bg-cat-amber" },
        ].map((r) => (
          <div key={r.name} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-sm">
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
          ["4 metre বা তার কম", seen.includes(0)],
          ["8 metre এর আশেপাশে", seen.includes(1)],
          ["14 metre বা তার বেশি", seen.includes(2)],
        ]}
      />
      <Task done={all}>দড়িটা ছোট, মাঝারি আর লম্বা করুন। টানের কতটুকু সামনে যায়? মোট টান সবসময় {PULL}.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · মামি's claim, answered on a picture (it was a text-only Check). Each
//     option is drawn as the pair of arrows it means — opposite, at a right
//     angle, the same way — and a pick plays it out on the sheet: the second
//     arrow draws, the noon light drops it onto the first, and its shadow's
//     length is read off as the cosine. So "0 means opposite" shows its own
//     shadow of −1 rather than a ✕, and the right angle's shadow shrinks to a
//     single point, 0. The hint is the Check's own hint, after the first miss.

const ZM_F = makeFrame(-1.3, 1.3, -0.35, 1.25, 62);
const ZM_ANG = [180, 90, 0];
const ZM_RIGHT = 1;
const ZM_COS = [-1, 0, 1];
const ZM_OPTS = ["হ্যাঁ, 0 মানে উল্টা", "না, 0 মানে right angle, কোনো relationship-ই নাই; উল্টা হলো −1", "না, 0 মানে একই direction"];
const ZM_NOPE = ["উল্টা হলে shadow পুরাটাই পিছনে, cosine −1।", "", "একই direction এ shadow পুরাটাই সামনে, cosine 1।"];

/** the pair of arrows an option means, as a small picture for its Choice */
function ZM_Pic({ deg }: { deg: number }) {
  // the first arrow runs (30, 26) → (54, 26); the second starts at (30, 26), one unit = 24.
  // "The same way" is lifted a little so both show; heads are paths, not glyphs.
  const [line, head] =
    deg === 180 ? ["M30 20H8", "M4 20l7 -4v8Z"] : deg === 90 ? ["M30 26V8", "M30 3l-4 7h8Z"] : ["M30 18H52", "M57 18l-7 -4v8Z"];
  return (
    <svg viewBox="0 0 60 32" role="img" aria-label={`${deg} degree এর জোড়া`} className="block h-auto w-[3.2rem] shrink-0">
      <path d="M30 26H52" strokeWidth={2.2} strokeLinecap="round" className="stroke-current" />
      <path d="M57 26l-7 -4v8Z" className="fill-current" />
      <path d={line} strokeWidth={2.2} strokeLinecap="round" className="stroke-cat-coral" />
      <path d={head} className="fill-cat-coral" />
    </svg>
  );
}

export function MamiPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const seeded = useSeeded();
  const p = usePlay(650);
  // 0 nothing yet, 1 the second arrow and the light, 2 the shadow and its number.
  const k = pick === null ? 0 : seeded ? 2 : p.k;
  const f = ZM_F;
  const deg = pick === null ? 0 : ZM_ANG[pick];
  const c = pick === null ? 0 : ZM_COS[pick];
  const a = (deg * Math.PI) / 180;
  const tip: XY = [Math.cos(a), Math.sin(a) + (deg === 0 ? 0.14 : 0)];
  const won = pick === ZM_RIGHT;

  const choose = (i: number) => {
    setPick(i);
    if (i !== ZM_RIGHT) setMiss(miss + 1);
    p.play(
      2,
      () => {
        if (i === ZM_RIGHT) pass("0 মানে right angle, উল্টা না।");
      },
      0,
    );
  };

  return (
    <>
      <div className="text-[0.95rem] leading-snug font-semibold text-balance">মামি বললেন, cosine 0 মানে দুইটা একদম উল্টা দিকে point করে আছে। উনি কি ঠিক বলেছেন?</div>
      <div className="mx-auto mt-2 flex w-full max-w-[20rem] items-center gap-3">
        <div className="w-full max-w-[9.5rem] shrink-0">
          <Plane f={f} grid={0} axes={false} label={pick === null ? "একটা arrow, এখনো জোড়া বেছা হয় নাই" : `${deg}° এর জোড়া, shadow ${sg(c)}`} className="my-0! max-w-none">
            {/* the line the shadow falls on, both ways from the tail */}
            <path d={`M${f.sx(-1.2)} ${f.sy(0)}H${f.sx(1.2)}`} strokeWidth={1} strokeDasharray="4 4" className="pointer-events-none stroke-[#0f1b2d]/30" />
            <Arrow f={f} from={O} to={[1, 0]} tone="ink" w={3.4} />
            {pick !== null && k >= 1 && (
              <g key={`l${pick}${miss}`} className={FADE}>
                {[-0.95, -0.45, 0.45, 0.95].map((x) => (
                  <path key={x} d={`M${f.sx(x)} ${f.sy(1.15)}V${f.sy(0.06)}`} strokeWidth={1} className="pointer-events-none stroke-[#f59e0b]/45" />
                ))}
                <circle cx={f.sx(0)} cy={f.sy(1.16)} r={6} className="pointer-events-none fill-[#f59e0b]" />
                {deg !== 180 && <path d={`M${f.sx(tip[0])} ${f.sy(tip[1])}V${f.sy(0)}`} strokeWidth={1.3} strokeDasharray="3 3" className="pointer-events-none stroke-[#b45309]" />}
              </g>
            )}
            {pick !== null && <Arrow key={`w${pick}${miss}`} f={f} from={O} to={tip} tone="coral" w={2.4} draw />}
            {/* the shadow, laid just under the line so it shows even where the arrows lie on it */}
            {pick !== null && k >= 2 && c !== 0 && <Arrow key={`s${pick}${miss}`} f={f} from={[0, -0.2]} to={[c, -0.2]} tone={c < 0 ? "danger" : "teal"} w={3.4} draw />}
            {pick !== null && k >= 2 && c === 0 && <circle cx={f.sx(0)} cy={f.sy(0)} r={5} strokeWidth={2} className={`fill-white stroke-cat-teal ${POP}`} />}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-xs text-muted">angle</div>
          <div className="font-mono text-2xl font-bold">{pick === null ? "?" : `${deg}°`}</div>
          <div className="mt-2 text-xs text-muted">shadow, মানে cos θ</div>
          <div className={`font-mono text-2xl font-bold ${c < 0 && k >= 2 ? "text-danger" : "text-cat-teal"}`}>{pick === null || k < 2 ? "?" : sg(c)}</div>
        </div>
      </div>
      <div className="mt-2 grid gap-1.5">
        {ZM_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i ? (i === ZM_RIGHT ? "right" : "wrong") : won ? "dim" : "idle"} disabled={won} onClick={() => choose(i)}>
            <span className="flex items-center gap-2.5 text-[0.9rem] leading-snug">
              <ZM_Pic deg={ZM_ANG[i]} />
              <span>{o}</span>
            </span>
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== ZM_RIGHT && (
        <Nope key={miss}>
          {ZM_NOPE[pick]} মাঝি হাল ছেড়ে দেয়ার পর পাড়ের দিকের টানটা কি নৌকাকে পিছনে নিয়েছিল, নাকি সামনে-পিছনে কিছুই করে নাই?
        </Nope>
      )}
      <Task done={won}>একটা বেছে নিন, আর ছবিতে দেখুন মামি ঠিক বলেছেন কি না।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it: three ropes to the same boat, drawn as three pictures. Which
//     wastes the least pull? A wrong pick plays out what that rope does — the
//     yellow bankwards part grows and the forward bar shrinks — so the reader
//     sees the waste rather than being told the answer.

const TI_ROPES = [4, 7, 14];
const TI_RIGHT = 2;
const TI_F = makeFrame(-0.6, 14.6, -0.8, 3.6, 8);

/**
 * One rope of length L to a bank 3 away, as a small picture for a Choice. The
 * ink follows the Choice's own colour (as CR_Pic does), so the picked one, on
 * its dark chip, stays readable in either theme.
 */
function TI_Pic({ L }: { L: number }) {
  const x = Math.sqrt(L * L - 9);
  return (
    <svg viewBox="0 0 96 46" role="img" aria-label={`${L} metre দড়ি`} className="mx-auto block h-auto w-full max-w-[6rem]">
      <rect y={30} width={96} height={16} rx={2} className="fill-current opacity-10" />
      <rect y={0} width={96} height={12} rx={2} className="fill-current opacity-15" />
      <path d={`M8 34L${8 + (x / 14) * 78} 12`} strokeWidth={1.6} className="stroke-current" />
      <path d="M2 31h12l-2 5H4Z" className="fill-current" />
      <circle cx={8 + (x / 14) * 78} cy={9} r={2.6} className="fill-current" />
      <text x={48} y={26} textAnchor="middle" fontSize={8.5} fontWeight={700} className="fill-current font-mono">
        {L} m
      </text>
    </svg>
  );
}

export function PickRope() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const shown = pick ?? TI_RIGHT;
  const L = TI_ROPES[shown];
  const x = Math.sqrt(L * L - 9);
  const fwd = (10 * x) / L;
  const side = (10 * 3) / L;

  const choose = (i: number) => {
    setPick(i);
    if (i === TI_RIGHT) pass("লম্বা দড়ি, ছোট angle, টান কম নষ্ট।");
    else setMiss(miss + 1);
  };

  return (
    <>
      <Plane f={TI_F} grid={0} axes={false} label={`${L} metre দড়ি: সামনে ${fix(fwd, 1)}, পাড়ের দিকে ${fix(side, 1)}`} className="max-w-[20rem]">
        <River f={TI_F} bank={3} />
        <path d={`M${TI_F.sx(0)} ${TI_F.sy(0)}L${TI_F.sx(x)} ${TI_F.sy(3)}`} strokeWidth={1.4} className="pointer-events-none stroke-[#78350f]" />
        <Man f={TI_F} at={[x, 3]} />
        <Arrow key={`f${shown}`} f={TI_F} from={O} to={[fwd * 0.9, 0]} tone="teal" w={3} draw />
        <Arrow key={`s${shown}`} f={TI_F} from={O} to={[0, side * 0.36]} tone="amber" w={3} draw dashed />
        <Boat f={TI_F} />
      </Plane>
      <div className="mx-auto mt-1 grid max-w-sm grid-cols-2 gap-1.5 text-sm">
        {[
          { n: "সামনে", v: fwd, bar: "bg-cat-teal" },
          { n: "নষ্ট", v: side, bar: "bg-cat-amber" },
        ].map((b) => (
          <div key={b.n} className="flex items-center gap-1.5">
            <span className="text-xs text-muted">{b.n}</span>
            <span className="h-2.5 flex-1 rounded-full bg-foreground/10">
              <span className={`block h-full rounded-full ${b.bar} transition-[width] duration-500 motion-reduce:transition-none`} style={{ width: `${b.v * 10}%` }} />
            </span>
            <b className="w-7 text-right font-mono text-xs">{fix(b.v, 1)}</b>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {TI_ROPES.map((L2, i) => (
          <Choice key={L2} n={i} look={pick === i ? (i === TI_RIGHT ? "right" : "wrong") : "idle"} disabled={false} onClick={() => choose(i)}>
            <TI_Pic L={L2} />
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== TI_RIGHT && (
        <Nope key={miss}>এই দড়িতে পাড়ের দিকে যাচ্ছে {fix(side, 1)}, আর সামনে মোটে {fix(fwd, 1)}. হলুদ বারটা ছোট করতে হবে।</Nope>
      )}
      <Task done={pick === TI_RIGHT}>তিনটা দড়ির ছবি দেখে বেছে নিন কোনটায় টান সবচেয়ে কম নষ্ট হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes and explanation figures. Watch-only, driven by the reader
// (useScene): a story scene acts out a step's setup words, a figure acts out
// the <Then> paragraph right before it. The river seen from the side (a boat,
// the bank, the boatmen in lungi and gamchha, the ghat's stairs, a green
// coconut) and the library's computer aren't in the cast, so they are drawn
// here in fixed ink, like the rest of a Stage. The library apu borrows Rina's
// look and gets her own name drawn under her feet.

export const T_INK = "#0f1b2d";
const T_SKIN = "#b0764a";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

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
export const T_say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** The river on a Stage, seen from the side: the bank's edge at y = top, water below it. */
export function T_Water({ top }: { top: number }) {
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
 * (x, y): the haat's goods on board, the sail furled (no wind), and at the
 * stern the tiller. The mast's head, where the rope is tied, is at (x − 14, y − 62).
 */
export function T_Boat({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
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
 * A boatman (not in the cast): a lungi, a white vest, a red gamchha round the head.
 * Feet at (x, y), about 62 units tall at s = 1. `pose` "pull" leans into a
 * rope held at the chest; "hold" reaches forward; `walking` swings the legs for
 * `ms` each time `run` changes.
 */
export function T_Majhi({
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
export function T_Dab() {
  return (
    <g>
      <ellipse rx={6.5} ry={7.5} fill="#4d7c0f" />
      <ellipse cx={-2} cy={-2} rx={2} ry={3} fill="#84cc16" opacity={0.7} />
      <path d="M-2 -7.5h4l-1 -2.5h-2Z" fill="#a16207" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: last night at home, Fahim
//      draws three pairs in his khata, every arrow one square long. Which
//      pair's cosine is 0.5 is left to the screen.

/** one pair of arrows at `deg` on the khata's page, drawn from (x, y) */
function K_Pair({ x, y, deg, on }: { x: number; y: number; deg: number; on: boolean }) {
  const r = (deg * Math.PI) / 180;
  const L = 26;
  return (
    <g>
      <Draw d={`M${x} ${y}h${L}`} strokeWidth={1.8} ms={600} className={on ? "stroke-[#0f1b2d]" : "stroke-transparent"} />
      <Draw d={`M${x} ${y}l${L * Math.cos(r)} ${-L * Math.sin(r)}`} strokeWidth={1.8} ms={600} className={on ? "stroke-[#e11d48]" : "stroke-transparent"} />
      {on && (
        <text x={x + 30} y={y - 20} fontSize={8} fontWeight={700} fill={T_INK} className={FADE}>
          {deg}°
        </text>
      )}
    </g>
  );
}

export function RaateKhata({}: Story) {
  const s = useScene(2, [700, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="রাতে ঘরে ফাহিম খাতায় তিনটা জোড়া arrow এঁকেছে, তিন রকম angle এ, প্রতিটা arrow সমান লম্বা">
        <rect x={128} y={44} width={176} height={104} rx={5} fill="white" stroke={T_INK} strokeOpacity={0.35} />
        <path d="M150 44V148" stroke="#e11d48" strokeOpacity={0.3} strokeWidth={1} />
        {[60, 78, 96, 114, 132].map((y) => (
          <path key={y} d={`M156 ${y}H296`} stroke="#0284c7" strokeOpacity={0.18} strokeWidth={1} />
        ))}
        <K_Pair x={160} y={132} deg={30} on={k >= 1} />
        <K_Pair x={208} y={132} deg={60} on={k >= 1} />
        <K_Pair x={256} y={132} deg={90} on={k >= 1} />
        <Person who="fahim" x={72} y={150} mood={k >= 2 ? "happy" : "plain"} arm={k >= 2 ? "point" : "down"} label />
        {k >= 2 && <Bubble x={72} y={84} side="left" tone="think" lines={["প্রতিটা arrow ঠিক", "এক ঘর লম্বা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: towing. The loaded boat
//      on a river running the wrong way, the sail furled; Majhi chacha and his
//      brother step onto the bank with the rope and walk, pulling; Fahim asks,
//      and Majhi chacha gives the claim. Which rope wastes less is left open.

export const S1_WL = 158;
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
      <Stage backdrop="field" ground={100} label="মাল বোঝাই নৌকা, স্রোত উল্টা দিকে; মাঝি চাচা আর তার ভাই পাড়ে নেমে লম্বা দড়ি দিয়ে নৌকার গুন টানছে; মাঝি চাচা বলছেন দড়ি লম্বা হলে টান কম নষ্ট হয়">
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
        {k >= 5 && <Bubble x={cx} y={my - 50} side="left" lines={["দড়ি লম্বা যত বেশি হইবো,", "টানা তত কম লাগবো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the tow seen from above.
//      The boatmen walk along the bank and the boat along the river, side by
//      side, so the rope runs slantwise; one pull along it, and a "?" for the
//      part that is "wasted".

const X1_F = makeFrame(-1, 10, -1, 4, 28);
const X1_SAY = [
  "উপর থেকে: নদীতে নৌকা, পাড়ে মাঝিরা।",
  "মাঝিরা হাঁটে পাড় বরাবর, নৌকা চলে নদী বরাবর। দুইটা line পাশাপাশি।",
  "তাই দড়িটা যায় বাঁকা হয়ে, নদীর সাথে একটা angle করে।",
  "টান তো একটাই, দড়ি বরাবর। তাহলে কোন part টা “নষ্ট” হয়?",
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
        <Plane f={f} grid={0} axes={false} label="উপর থেকে: নদীতে নৌকা, পাড়ে মাঝিরা, দড়ি বাঁকা" className="my-0! max-w-none">
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
// 3½ · A figure for screen 3's explanation, no task: the split, built. The
//      noon sun straight over the river (4.3's sun) drops the pull (3, 2)
//      onto it; the shadow, then the leftover at a right angle, then the two
//      joined back into the whole pull.

const X2_F = makeFrame(-0.6, 4.4, -0.8, 3, 36);
const X2_W: XY = [3, 2];
const X2A_SAY = [
  "নদী গেছে east দিকে, দড়ির টান (3, 2)।",
  "4.3 এর মতো সূর্যটা একদম মাথার উপর থেকে আলো ফেলুক।",
  "নদীর উপরে যেটুকু পড়লো সেটাই টানের shadow, ওর projection।",
  "বাকি থাকলো হলুদ part টা, নদীর সাথে right angle এ।",
  "হলুদটাকে সবুজের মাথায় জোড়া দিলে পুরা টানটা ফেরত।",
];

/** A right-angle mark at `at`, its sides along the unit directions `a` and `b`, in units of `f`. */
export function T_Square({ f, at, a, b, size = 0.22 }: { f: Frame; at: XY; a: XY; b: XY; size?: number }) {
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
        <Plane f={f} grid={0} axes={false} label="টান (3, 2): নদীর উপরে shadow 3, আর বাকি 2 right angle এ" className="my-0! max-w-none">
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
              shadow
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

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: the boat under tow on a
//      straight river again, and at the stern the helmsman on the tiller.
//      Fahim wonders where the sideways pull goes, then what happens if the
//      tiller is let go. The drift is left for the screen.

export function RudderMan({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  const [bx, cx, dx] = useTween([k >= 1 ? 112 : 88, k >= 1 ? 290 : 266, k >= 1 ? 236 : 212], 1600);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={100} label="গুন টানা নৌকা, পিছনে হাল ধরে বসা মাঝি; ফাহিম ভাবছে পাড়ের দিকের টানটা কোথায় যায়, আর হাল ছেড়ে দিলে কী হয়">
        <T_Water top={124} />
        <T_Boat x={bx} y={S1_WL} />
        <T_Majhi x={bx - 55} y={S1_WL - 10} pose="hold" cloth="#7c2d12" />
        {k >= 1 && <T_Tag x={bx - 55} y={S1_WL - 66} text="হালের মাঝি" />}
        <Person who="fahim" x={bx + 8} y={S1_WL - 10} scale={0.75} ms={0} mood={k >= 2 ? "puzzled" : "plain"} />
        <path d={`M${bx - 14} ${S1_WL - 62}L${cx + 3} ${S1_BANK - 27}`} stroke="#78350f" strokeWidth={1.4} fill="none" />
        <T_Majhi x={dx} y={S1_BANK} walking={k === 1} run={String(k)} ms={1600} pose="pull" cloth="#15803d" />
        <T_Majhi x={cx} y={S1_BANK} walking={k === 1} run={String(k)} ms={1600} pose="pull" />
        {k === 2 && <Bubble x={bx + 8} y={S1_WL - 60} side="right" tone="think" lines={["পাড়ের দিকের টানটা", "কোথায় যায়?"]} />}
        {k >= 3 && <Bubble x={bx + 8} y={S1_WL - 60} side="right" tone="think" lines={["হাল ছেড়ে দিলে", "কী হয়?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the tiller holds. The
//      yellow part alone would only drag the boat to the bank; the tiller
//      pushes back just as hard; the two cancel and the boat runs on the green
//      part alone. The yellow is the "wasted pull".

const X5_F = makeFrame(-1, 7, -1.6, 3.3, 28);
const X5A_SAY = [
  "টান দুই part এ: সবুজ সামনে, হলুদ পাড়ের দিকে।",
  "হলুদ part একা থাকলে নৌকাকে শুধু পাড়ে নিতো, সামনে এক পা-ও না।",
  "মাঝি হাল ধরে ঠিক উল্টা দিকে চাপ দেয়, আর ওটাকে ঠেকিয়ে রাখে।",
  "হলুদ আর হালের চাপ কাটাকাটি হয়ে যায়। নৌকা চলে শুধু সবুজ part এ।",
  "হলুদ part টা খরচ হলো, কাজে লাগলো না। মাঝি চাচার ওই “নষ্ট হওয়া টান”।",
];

export function RudderHolds() {
  const s = useScene(4, [600, 2000, 1800, 2000, 2200]);
  const k = s.k;
  const f = X5_F;
  const shift = k === 1 ? `0px, ${-1 * f.u}px` : k >= 3 ? `${2.6 * f.u}px, 0px` : "0px, 0px";
  return (
    <Scene scene={s} caption={T_say(X5A_SAY, k)}>
      <div className="mx-auto w-full max-w-[16rem]">
        <Plane f={f} grid={0} axes={false} label="নৌকার উপরে: সবুজ part সামনে, হলুদ পাড়ের দিকে, হাল উল্টা দিকে ঠেকিয়ে আছে" className="my-0! max-w-none">
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
                নষ্ট হওয়া টান
              </Label>
            )}
            <Boat f={f} />
          </g>
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5½ · Two figures for screen 5's explanation, no task.
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
  "দড়ি যত লম্বাই হোক, নৌকা থেকে পাড় 3 metre দূরে।",
  `দড়ি 4 metre: মাঝিরা প্রায় নৌকার বরাবর দাঁড়ায়, angle ${fix(X6_ROPES[0].deg, 0)}°. cos θ মোটে ${fix(X6_ROPES[0].cos, 2)}.`,
  `দড়ি 8 metre: angle কমে দাঁড়ায় ${fix(X6_ROPES[1].deg, 0)}°, cos θ ${fix(X6_ROPES[1].cos, 2)}.`,
  `দড়ি 15 metre: angle মোটে ${fix(X6_ROPES[2].deg, 0)}°, cos θ ${fix(X6_ROPES[2].cos, 2)}, প্রায় 1। টানের প্রায় পুরাটাই সামনে যায়।`,
  "দড়ি যত লম্বা, angle তত ছোট, cos θ তত 1 এর কাছে। মাঝি চাচা ঠিকই বলেছিলেন।",
];

export function RopeFan() {
  const s = useScene(4, [600, 2000, 2000, 2400, 2200]);
  const k = s.k;
  const f = X6_F;
  return (
    <Scene scene={s} caption={T_say(X6A_SAY, k)}>
      <div className="mx-auto w-full max-w-[20rem]">
        <Plane f={f} grid={0} axes={false} label="একই পাড়ে 4, 8 আর 15 metre এর দড়ি: angle ছোট হয়, cos θ 1 এর দিকে এগোয়" className="my-0! max-w-none">
          <River f={f} bank={3} />
          <path d={`M${f.sx(15)} ${f.sy(0)}V${f.sy(3)}M${f.sx(14.8)} ${f.sy(0)}H${f.sx(15.2)}M${f.sx(14.8)} ${f.sy(3)}H${f.sx(15.2)}`} strokeWidth={1} className="pointer-events-none stroke-[#0f1b2d]/60" />
          <Label f={f} at={[14.8, 1.5]} dy={3} anchor="end" size={8} className="fill-[#0f1b2d]">
            3 metre
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
              <b className="font-mono">{r.L}</b> metre, cos θ <b className="font-mono">{fix(r.cos, 2)}</b>
            </span>
          ) : null,
        )}
      </div>
    </Scene>
  );
}

const X6B_SAY = [
  "Maths বলছে, দড়ি যত লম্বা তত ভালো।",
  "কিন্তু খুব লম্বা দড়ি ভারি, মাঝখানটা পানিতে ঝুলে পড়ে।",
  "আর নিচে বাঁধলে দড়ি পাড়ের ঝোপঝাড়ে আটকে যায়।",
  "তাই মাঝিরা মাঝামাঝি একটা length নেয়, আর দড়ি বাঁধে মাস্তুলের মাথায়।",
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
      <svg viewBox="0 0 300 112" role="img" aria-label="পাশ থেকে গুন টানা: খুব লম্বা দড়ি পানিতে ঝুলে পড়ে, নিচে বাঁধা দড়ি ঝোপে আটকায়, মাস্তুলের মাথায় বাঁধা মাঝারি দড়ি দুইটাই এড়ায়" className="mx-auto block h-auto w-full max-w-[18rem]">
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
// 6a · A story scene for screen 6's setup, no task: at home in the evening
//      Fahim tells the day's story, and Mami drops cosine 0 and −1 into the
//      same basket. Whether she is right is left to the Check.

export function MamiSays({}: Story) {
  const s = useScene(3, [600, 2400, 2600, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সন্ধ্যায় ঘরে ফাহিম নৌকার গল্প বলছে; মামি বললেন cosine 0 মানে দুইটা উল্টা দিকে">
        <Person who="mami" x={214} y={150} facing={-1} mood={k >= 2 ? "smug" : "plain"} label />
        <Person who="fahim" x={104} y={150} mood={k >= 3 ? "puzzled" : "plain"} arm={k === 1 ? "point" : "down"} label />
        {k === 1 && <Bubble x={104} y={84} side="left" lines={["পাড়ের দিকের টানটা", "নৌকাকে সামনে নেয় না।"]} />}
        {k === 2 && <Bubble x={214} y={84} side="right" lines={["তার মানে cosine 0,", "মানে একদম উল্টা দিক।"]} />}
        {k >= 3 && <Bubble x={104} y={84} side="left" tone="think" lines={["উল্টা? নাকি", "অন্য কিছু?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6½ · The figure inside screen 6's Check, no task: 0 is not −1. 4.2's van on
//      its road (4, 3). Mami pushed from 90° and the push's shadow on the road
//      is a single point; a push from dead ahead has a shadow all the way
//      backwards, cosine −1.

const X5B_F = makeFrame(-2.6, 2.6, -1.8, 1.9, 30);
const X5B_R: XY = [0.8, 0.6];
const X5B_N: XY = [-0.6, 0.8];
const X5B_SAY = [
  "4.2 এর ভ্যান, তার রাস্তার উপরে।",
  "মামি ধাক্কা দিয়েছিলেন right angle এ। ভ্যান এক চুলও নড়ে নাই।",
  "রাস্তার উপরে ওই ধাক্কার shadow মোটে একটা বিন্দু, মানে 0। একটার direction এ আরেকটার কিছুই নাই।",
  "উল্টা দিক থেকে সোজাসুজি ধাক্কা দিলে shadow পুরাটাই পিছন দিকে। Cosine তখন −1.",
  "0 মানে কোনো relationship নাই। −1 মানে উল্টা, আর ওটা strong একটা relationship।",
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
        <Plane f={f} grid={0} axes={false} label="ভ্যানের রাস্তা (4, 3); মামির right angle এর ধাক্কা, shadow 0; সোজাসুজি উল্টা ধাক্কা, cosine −1" className="my-0! max-w-none">
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
              মামি
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
// 7½ · A figure for screen 7's explanation, no task: the waste, counted. The
//      bank stays 3 metre off and the pull stays 10, so doubling the rope
//      halves what goes sideways — 4.3 becomes 2.1, which the reader has just
//      read off the three pictures.

const X7_F = makeFrame(-0.6, 14.6, -0.8, 3.6, 18);
const X7_ROPES = [7, 14].map((L) => ({ L, x: Math.sqrt(L * L - 9), side: 30 / L }));
const X7_SAY = [
  "একই নৌকা, পাড় 3 metre দূরে, টান সবসময় 10।",
  `দড়ি 7 metre। পাড়ের দিকে নষ্ট হয় ${fix(X7_ROPES[0].side, 1)}.`,
  `দড়ি দ্বিগুণ করে 14 metre। নষ্ট ${fix(X7_ROPES[1].side, 1)}, ঠিক অর্ধেক।`,
  "পাড় সরে নাই, টানও বাড়ে নাই। শুধু দড়ি দ্বিগুণ হয়েছে, আর নষ্টটুকু অর্ধেক।",
];

export function HalfWaste() {
  const s = useScene(3, [600, 2200, 2400, 2600]);
  const k = s.k;
  const f = X7_F;
  return (
    <Scene scene={s} caption={T_say(X7_SAY, k)}>
      <div className="mx-auto w-full max-w-[18rem]">
        <Plane f={f} grid={0} axes={false} label="7 metre দড়িতে নষ্ট 4.3, দড়ি দ্বিগুণ করে 14 metre করলে নষ্ট 2.1" className="my-0! max-w-none">
          <River f={f} bank={3} />
          <path d={`M${f.sx(14.3)} ${f.sy(0)}V${f.sy(3)}M${f.sx(14.1)} ${f.sy(0)}H${f.sx(14.5)}M${f.sx(14.1)} ${f.sy(3)}H${f.sx(14.5)}`} strokeWidth={1} className="pointer-events-none stroke-[#0f1b2d]/60" />
          <Label f={f} at={[14.1, 1.5]} dy={3} anchor="end" size={8} className="fill-[#0f1b2d]">
            3 metre
          </Label>
          {X7_ROPES.map((r, i) =>
            k >= i + 1 ? (
              <g key={r.L} opacity={k === i + 1 || k === 3 ? 1 : 0.35} className="transition-opacity duration-500 motion-reduce:transition-none">
                <Draw d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(r.x)} ${f.sy(3)}`} strokeWidth={1.6} className="stroke-[#78350f]" />
                <Man f={f} at={[r.x, 3]} />
              </g>
            ) : null,
          )}
          {k >= 1 && <Arrow key={`s${k}`} f={f} from={O} to={[0, X7_ROPES[Math.min(k, 2) - 1].side * 0.3]} tone="amber" w={3} draw dashed />}
          <Boat f={f} />
        </Plane>
      </div>
      <div className="mx-auto mt-2 grid min-h-10 max-w-[16rem] gap-1.5">
        {X7_ROPES.map((r, i) =>
          k > i ? (
            <div key={r.L} className={`${FADE} grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2 text-[0.8rem]`}>
              <span className="text-muted">
                <b className="font-mono">{r.L}</b> metre
              </span>
              <span className="h-2.5 rounded-full bg-foreground/10">
                <span className="block h-full rounded-full bg-cat-amber" style={{ width: `${r.side * 10}%` }} />
              </span>
              <b className="text-right font-mono">{fix(r.side, 1)}</b>
            </div>
          ) : null,
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8r · A figure for the last screen's recap, written with `story` so it sits
//      with the recap words (the Table stays the screen), no task: the bet settled, from
//      above. The long rope (15 m to a bank 3 m off, as in RopeFan), its small
//      angle, the shadow along the river that is nearly the whole pull, and
//      the small leftover at a right angle towards the bank. One sentence of
//      the recap per beat; the arrows keep the true 10 cos θ proportions.

const X8_F = makeFrame(-0.8, 15.3, -0.8, 3.8, 19);
const X8_L = 15;
const X8_X = Math.sqrt(X8_L * X8_L - 9);
const X8_W: XY = [(4.2 * X8_X) / X8_L, (4.2 * 3) / X8_L];
const X8_SAY = [
  "মাঝি চাচার দড়ি, লম্বা। পাড় 3 metre দূরে।",
  "লম্বা দড়ি মানে ছোট angle।",
  "আর ছোট angle এ shadow প্রায় পুরা টানটাই।",
  "নষ্ট হওয়া টান যায় নদীর সাথে right angle এ, পাড়ের দিকে।",
];

export function GunHisab({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const f = X8_F;
  const a = Math.atan2(3, X8_X);
  const R = 6.5;
  return (
    <Scene scene={s} caption={T_say(X8_SAY, k)}>
      <div className="mx-auto w-full max-w-[20rem]">
        <Plane f={f} grid={0} axes={false} label="15 metre দড়ি, ছোট angle: shadow প্রায় পুরা টান, বাকি ছোট টুকু পাড়ের দিকে" className="my-0! max-w-none">
          <River f={f} bank={3} />
          <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(X8_X)} ${f.sy(3)}`} strokeWidth={1.4} className="pointer-events-none stroke-[#78350f]" />
          <Man f={f} at={[X8_X, 3]} />
          {k >= 1 && (
            <path
              d={`M${f.sx(R)} ${f.sy(0)}A${R * f.u} ${R * f.u} 0 0 0 ${f.sx(R * Math.cos(a))} ${f.sy(R * Math.sin(a))}`}
              strokeWidth={1.6}
              className={`pointer-events-none fill-none stroke-[#b45309] ${FADE}`}
            />
          )}
          {k >= 1 && (
            <Label f={f} at={[R, 0.4]} dx={5} anchor="start" size={9} weight={700} className={`fill-[#b45309] ${FADE}`}>
              {fix((a * 180) / Math.PI, 0)}°
            </Label>
          )}
          {k >= 2 && <Arrow f={f} from={O} to={[X8_W[0], 0]} tone="teal" w={3.2} draw />}
          {k >= 3 && <Arrow f={f} from={[X8_W[0], 0]} to={X8_W} tone="amber" w={2.4} dashed draw />}
          {k >= 3 && <T_Square f={f} at={[X8_W[0], 0]} a={[-1, 0]} b={[0, 1]} size={0.45} />}
          <Arrow f={f} from={O} to={X8_W} tone="coral" w={2.4} />
          <Boat f={f} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A closing story scene, no task: past noon the tow goes on, and the
//      river ahead takes a bend. The far bank swings away; where the shadow
//      lands on a bent river is left for the next journey.

export function NoonBend({}: Story) {
  const s = useScene(3, [600, 2000, 2400, 2400]);
  const k = s.k;
  const [bx, cx, dx] = useTween([k >= 1 ? 116 : 88, k >= 1 ? 266 : 236, k >= 1 ? 212 : 182], 1600);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={100} label="দুপুরের পর গুন টানা চলছে; সামনে নদী বাঁক নিয়েছে, পাড় কোনাকুনি সরে গেছে">
        <T_Water top={124} />
        {k >= 2 && (
          <g className={FADE}>
            {/* the bank swings away to the right and the water takes its place: the bend */}
            <path d="M288 124Q308 129 318 154L320 154V124Z" fill="#7cb8e8" />
            <Draw d="M288 124Q308 129 318 154" strokeWidth={2.2} ms={900} className="stroke-[#4d7c0f]" />
            <text x={300} y={116} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#14532d">
              বাঁক
            </text>
          </g>
        )}
        <T_Boat x={bx} y={S1_WL} />
        <Person who="fahim" x={bx + 8} y={S1_WL - 10} scale={0.75} ms={0} mood={k >= 3 ? "puzzled" : "plain"} />
        <path d={`M${bx - 14} ${S1_WL - 62}L${cx + 3} ${S1_BANK - 27}`} stroke="#78350f" strokeWidth={1.4} fill="none" />
        <T_Majhi x={dx} y={S1_BANK} walking={k === 1} run={String(k)} ms={1600} pose="pull" cloth="#15803d" />
        <T_Majhi x={cx} y={S1_BANK} walking={k === 1} run={String(k)} ms={1600} pose="pull" />
        {k === 2 && <Bubble x={cx - 16} y={S1_BANK - 50} side="left" lines={["সামনে নদী বাঁক নিছে।"]} />}
        {k >= 3 && <Bubble x={bx + 8} y={S1_WL - 60} side="right" tone="think" lines={["বাঁকা নদীতে shadow", "কতদূর পড়বে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for the last screen's bridge, no task: why the straight river
//      was easy. On an east river the shadow is the pull's first number and
//      the leftover the second; then the river turns, and "?".

const X2B_F = makeFrame(-0.5, 3.6, -0.6, 3.2, 34);
const X2B_SAY = [
  "টান আবার (3, 2), নদী গেছে east দিকে।",
  "নদী বরাবর shadow হলো 3 — টানের first number।",
  "বাকিটা 2, second number। কোনো হিসাব লাগলো না।",
  "কিন্তু নদী তো সবসময় east দিকে যায় না। বাঁক নিলে shadow তখন কত লম্বা?",
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
          <Plane f={f} ticks={1} label={bend ? "নদী বাঁক নিয়েছে (2, 3) বরাবর; shadow কত, জানা নাই" : "নদী east দিকে, টান (3, 2)"} className="my-0! max-w-none">
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
                shadow <b className="font-mono text-cat-teal">3</b>
              </div>
            )}
            {k >= 2 && !bend && (
              <div className={FADE}>
                বাকি <b className="font-mono text-cat-amber">2</b>
              </div>
            )}
            {bend && (
              <div className={FADE}>
                shadow <b className="font-mono text-lg">?</b>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  CosRecall: { start: {}, wrong: { pick: 0, miss: 1 }, right: { pick: 1 } },
  PickRope: { start: {}, wrong: { pick: 0, miss: 1 }, right: { pick: 2 } },
  RopeBet: { start: {}, bet: { bet: 0 } },
  SplitPull: { start: {}, some: { w: [4, 3], hit: [2] }, all: { w: [0, 3], hit: [0, 1, 2] } },
  SidePull: { start: {}, free: { guess: 1, free: true, seen: [true], track: [O, [3.1, 1.9]] }, held: { guess: 1, free: false, seen: [true, false], track: [O, [3.1, 1.9], [4.6, 1.9]] } },
  LongRope: { start: {}, short: { rope: 4, seen: [0] }, long: { rope: 15, seen: [0, 1, 2] } },
  // Story scenes and figures: `k` is the beat shown (no seed shows the last).
  RaateKhata: { rest: { k: 0 }, drawn: { k: 1 }, done: {} },
  GunTana: { rest: { k: 0 }, ashore: { k: 2 }, ask: { k: 4 }, done: {} },
  SlantRope: { rest: { k: 0 }, side: { k: 1 }, done: {}, step: { k: 2, stepping: true } },
  ShadowDrop: { rest: { k: 0 }, sun: { k: 1 }, rest3: { k: 3 }, done: {} },
  EastEasy: { first: { k: 1 }, second: { k: 2 }, done: {} },
  RudderMan: { rest: { k: 0 }, where: { k: 2 }, done: {} },
  MamiSays: { rest: { k: 0 }, tell: { k: 1 }, mami: { k: 2 }, done: {} },
  NoonBend: { rest: { k: 0 }, bend: { k: 2 }, done: {} },
  RudderHolds: { rest: { k: 0 }, alone: { k: 1 }, hal: { k: 2 }, done: {} },
  ZeroNotMinus: { rest: { k: 0 }, zero: { k: 2 }, done: {} },
  RopeFan: { rest: { k: 0 }, short: { k: 1 }, done: {} },
  SagRope: { rest: { k: 0 }, sag: { k: 1 }, snag: { k: 2 }, done: {} },
  HalfWaste: { rest: { k: 0 }, seven: { k: 1 }, fourteen: { k: 2 }, done: {} },
  MamiPick: { start: {}, wrong: { pick: 0, miss: 1 }, same: { pick: 2, miss: 1 }, right: { pick: 1 } },
  GunHisab: { rest: { k: 0 }, angle: { k: 1 }, shadow: { k: 2 }, done: {} },
};

