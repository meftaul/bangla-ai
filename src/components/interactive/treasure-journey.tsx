"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  FADE,
  Nope,
  POP,
  Speech,
  Stepper,
  Ticks,
  predictLook,
  primaryBtn,
  quietBtn,
  useSeed,
  type Fixtures,
} from "@/components/journey/kit";
import { Arrow, Label, Plane, makeFrame, minus, plus, same, sg, snap, tup, type Frame, type XY } from "@/components/journey/plane";
import { Shiku, Trail, route, useWalk } from "./arrow-journey";
import { bn } from "./figure-kit";

// Screens for "Math for AI 3.1 — যোগ-বিয়োগ, মেলার গুপ্তধন", told as a Journey.
//
// The school science fair opens with a treasure hunt on a chalked field, and
// every clue card is an arrow. Shiku walks two cards one after the other and
// the prize turns out to be the two walks joined; three pairs given only as
// numbers give up the rule, slot with slot. সোম reads the cards the other way
// round and lands on the same corner. Then the rule leaves the paper: আম্মুর
// tiffin adds up as three-slot cards, and নাসিব's two mismatched cards cannot
// be added at all. Subtraction is the question asked backwards: which one card
// takes সামিন to the prize? End − start, three times, checked by walking it,
// and last read as "what changed" in her stall book.
//
// Tailwind only; the field is journey/plane, Shiku comes from arrow-journey.
// Ink on the white sheet is fixed, since the sheet stays white in both themes.

const O: XY = [0, 0];
/** the chalked field */
const FA = makeFrame(0, 7, 0, 6, 34);

/** Shiku's walk along one card, then the next from where he stopped. */
const walk2 = (s: XY, a: XY, b: XY) => [...route(s, a), ...route(plus(s, a), b).slice(1)];

const KEY_STEP: Record<string, XY> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
/** Arrow keys nudge something on the sheet by one square. */
const nudger = (move: (d: XY) => void) => (e: KeyboardEvent<SVGSVGElement>) => {
  const d = KEY_STEP[e.key];
  if (!d) return;
  e.preventDefault();
  move(d);
};

/** A clue card read out: "3 ঘর পূর্বে, 1 ঘর উত্তরে". */
const words = (v: XY) =>
  [v[0] ? `${Math.abs(v[0])} ঘর ${v[0] > 0 ? "পূর্বে" : "পশ্চিমে"}` : "", v[1] ? `${Math.abs(v[1])} ঘর ${v[1] > 0 ? "উত্তরে" : "দক্ষিণে"}` : ""]
    .filter(Boolean)
    .join(", ") || "কোথাও যেতে হবে না";

const CARD = {
  blue: "border-cat-blue/40 text-cat-blue",
  coral: "border-cat-coral/40 text-cat-coral",
  teal: "border-cat-teal/40 text-cat-teal",
};

/** A clue card; `plain` shows the numbers only. */
function Clue({ name, v, tone, plain = false }: { name: ReactNode; v: XY; tone: keyof typeof CARD; plain?: boolean }) {
  return (
    <div className={`rounded-xl border-2 bg-surface px-3 py-2 text-center ${CARD[tone]}`}>
      <div className="text-xs font-semibold text-muted">{name}</div>
      <div className="font-mono text-xl font-bold">{tup(v)}</div>
      {!plain && <div className="text-xs text-muted">{words(v)}</div>}
    </div>
  );
}

/** X marks the spot; the chest pops up beside it once it is found. */
function Prize({ f, at, found = false }: { f: Frame; at: XY; found?: boolean }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 6} ${y - 6}L${x + 6} ${y + 6}M${x + 6} ${y - 6}L${x - 6} ${y + 6}`} strokeWidth={3} strokeLinecap="round" className="stroke-danger" />
      {found && (
        <g className={POP}>
          <rect x={x + 7} y={y - 18} width={18} height={11} rx={2} className="fill-[#b45309]" />
          <path d={`M${x + 7} ${y - 18}q9 -9 18 0Z`} className="fill-[#d97706]" />
          <rect x={x + 14} y={y - 16} width={4} height={5} rx={1} className="fill-[#fde68a]" />
        </g>
      )}
    </g>
  );
}

function Samin({ f, at }: { f: Frame; at: XY }) {
  return (
    <g className="pointer-events-none">
      <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={6} className="fill-cat-teal" />
      <text x={f.sx(at[0])} y={f.sy(at[1]) + 20} textAnchor="middle" fontSize={10} fontWeight={600} className="fill-[#0f1b2d]">
        সামিন
      </text>
    </g>
  );
}

/** The reader's guess on the sheet. */
function Ring({ f, at }: { f: Frame; at: XY }) {
  return <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={10} strokeWidth={2} strokeDasharray="4 3" className="pointer-events-none fill-cat-blue/10 stroke-cat-blue" />;
}

// ---------------------------------------------------------------------------
// 1 · Two clue cards. The reader marks a guess, Shiku walks card 1 and then
//     card 2 from where he stopped, and the prize sits at the two walks joined.

const U1: XY = [3, 1];
const V1: XY = [1, 4];
const S1 = plus(U1, V1);

export function TwoClues() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<XY | null>("guess", null);
  const [walked, setWalked] = useSeed("walked", false);
  const w = useWalk(220);
  const path = walk2(O, U1, V1);
  const locked = w.running || walked;

  const put = (p: XY) => {
    if (!locked) setGuess(snap(p, FA));
  };
  const go = () =>
    w.go(path, () => {
      setWalked(true);
      pass("Card ১ হেঁটে Shiku যেখানে থামলো, card ২ শুরু হলো সেখান থেকেই। দুই হাঁটা জুড়ে শেষ ঠিকানা (4, 5)।");
    });

  return (
    <>
      <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-3">
        <Clue name="card ১" v={U1} tone="blue" />
        <Clue name="card ২" v={V1} tone="coral" />
      </div>
      <div className="mt-2 text-center text-sm text-muted">
        কাগজে পূর্ব মানে ডানে, উত্তর মানে ওপরে। আর card&nbsp;২ পড়া শুরু হবে card&nbsp;১ যেখানে থামে, সেখান থেকে।
      </div>
      <Plane
        f={FA}
        ticks={1}
        label={walked ? "Shiku walked (3, 1), then (1, 4), and found the prize at (4, 5)" : "Shiku at the gate of a chalked field; tap where the prize is"}
        drag={locked ? undefined : { down: put, move: put }}
        onKey={locked ? undefined : nudger((d) => setGuess(snap(plus(guess ?? O, d), FA)))}
      >
        <Trail f={FA} cells={walked ? path : w.trail} faint={walked} />
        {walked && (
          <>
            <Arrow f={FA} from={O} to={U1} tone="blue" draw />
            <Arrow f={FA} from={U1} to={S1} tone="coral" draw delay={300} />
            <Arrow f={FA} from={O} to={S1} tone="teal" w={3.2} draw delay={800} />
            <Prize f={FA} at={S1} found />
          </>
        )}
        {guess && <Ring f={FA} at={guess} />}
        <Shiku f={FA} at={walked ? S1 : w.here} />
      </Plane>
      <div className="min-h-7 text-center text-[0.95rem]">
        {walked ? (
          <span className={FADE}>
            {guess && same(guess, S1) ? (
              <>
                গুপ্তধন <b className="font-mono">{tup(S1)}</b>-এ, আর আপনার guess একদম ঠিক!
              </>
            ) : (
              <>
                গুপ্তধন পাওয়া গেল <b className="font-mono">{tup(S1)}</b>-এ। আপনি ধরেছিলেন {guess ? tup(guess) : "অন্য কোথাও"}।
              </>
            )}
          </span>
        ) : guess ? (
          <span>
            আপনার guess <b className="font-mono">{tup(guess)}</b>। এবার Shiku-কে ছেড়ে দিন।
          </span>
        ) : (
          <span className="text-muted">গুপ্তধন কোথায় লুকানো মনে হয়? কাগজে tap করে দেখান।</span>
        )}
      </div>
      {!walked && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={go} disabled={!guess || w.running} className={`${primaryBtn} bg-cat-violet`}>
            Shiku, হাঁটো!
          </button>
        </div>
      )}
      <Task done={walked}>আগে কাগজে tap করে একটা guess দিন, তারপর Shiku-কে হাঁটতে পাঠান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Three pairs, numbers only. The reader writes the answer first, then
//     Shiku walks it to check; the table fills up until slot-with-slot shows.

const PAIRS: [XY, XY][] = [
  [
    [2, 3],
    [4, 1],
  ],
  [
    [1, 4],
    [5, 1],
  ],
  [
    [0, 2],
    [3, 3],
  ],
];

export function SlotAdd() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [solved, setSolved] = useSeed("solved", 0);
  const [ans, setAns] = useSeed<XY>("ans", [0, 0]);
  const [landed, setLanded] = useSeed<XY | null>("landed", null);
  const [miss, setMiss] = useState<{ n: number; a: XY } | null>(null);
  const w = useWalk(150);
  const [u, v] = PAIRS[round];
  const sum = plus(u, v);
  const done = solved > round;
  const last = round === PAIRS.length - 1;

  const check = () => {
    const a = ans;
    setLanded(null);
    // The steppers are blocked while he walks, so this round is still current when he stops.
    w.go(walk2(O, u, v), () => {
      setLanded(sum);
      if (same(a, sum)) {
        setSolved(round + 1);
        if (last) pass("প্রথম ঘরের সাথে প্রথম ঘর, দ্বিতীয়র সাথে দ্বিতীয়। Vector যোগ বলতে এতটুকুই।");
      } else setMiss((m) => ({ n: (m?.n ?? 0) + 1, a }));
    });
  };
  const next = () => {
    setRound(round + 1);
    setAns([0, 0]);
    setLanded(null);
    setMiss(null);
    w.go([O]);
  };

  return (
    <>
      <div className="mt-4 text-center text-sm text-muted">
        জোড়া {bn(round + 1)}/{bn(PAIRS.length)}। নাম ছোট রাখতে প্রথম card-টাকে ডাকি u, দ্বিতীয়টাকে v।
      </div>
      <div className="mx-auto mt-2 grid max-w-xs grid-cols-2 gap-3">
        <Clue name="u" v={u} tone="blue" plain />
        <Clue name="v" v={v} tone="coral" plain />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-2xl bg-cat-teal/5 px-4 py-3 font-mono text-lg">
        <span className="font-semibold">u + v = (</span>
        <Stepper value={ans[0]} min={0} max={7} label="প্রথম ঘর" disabled={w.running || done} onChange={(a) => setAns([a, ans[1]])} />
        <span>,</span>
        <Stepper value={ans[1]} min={0} max={6} label="দ্বিতীয় ঘর" disabled={w.running || done} onChange={(b) => setAns([ans[0], b])} />
        <span>)</span>
      </div>
      <div className="mt-3 flex justify-center">
        {!done ? (
          <button type="button" onClick={check} disabled={w.running} className={`${primaryBtn} bg-cat-violet`}>
            Shiku-কে দিয়ে মিলিয়ে দেখুন
          </button>
        ) : !last ? (
          <button type="button" onClick={next} className={quietBtn}>
            পরের জোড়া →
          </button>
        ) : null}
      </div>
      {miss && !done && !w.running && (
        <Nope key={miss.n}>
          উঁহু, Shiku গিয়ে থামলো {tup(sum)}-এ, আর আপনার উত্তর ছিল {tup(miss.a)}। Card দুইটার সংখ্যাগুলোর দিকে আরেকবার তাকান তো।
        </Nope>
      )}
      <Plane f={FA} ticks={1} label={landed ? `Shiku walked ${tup(u)} then ${tup(v)} and stopped at ${tup(sum)}` : "Shiku at the gate, waiting"} className="max-w-[19rem]">
        <Trail f={FA} cells={landed ? walk2(O, u, v) : w.trail} faint={!!landed} />
        {landed && (
          <>
            <Arrow f={FA} from={O} to={u} tone="blue" draw />
            <Arrow f={FA} from={u} to={sum} tone="coral" draw delay={250} />
            <Prize f={FA} at={sum} found={done} />
            <Ring f={FA} at={ans} />
          </>
        )}
        <Shiku f={FA} at={landed ?? w.here} />
      </Plane>
      {solved > 0 && (
        <div className="overflow-x-auto">
          <table className="mx-auto text-center font-mono tabular-nums">
            <thead>
              <tr className="font-sans text-xs text-muted">
                <th className="px-3 pb-1 font-normal">u</th>
                <th className="px-3 pb-1 font-normal">v</th>
                <th className="px-3 pb-1 font-normal">u + v</th>
              </tr>
            </thead>
            <tbody>
              {PAIRS.slice(0, solved).map(([a, b], i) => (
                <tr key={i} className={FADE}>
                  <td className="px-3 text-cat-blue">{tup(a)}</td>
                  <td className="px-3 text-cat-coral">{tup(b)}</td>
                  <td className="px-3 font-bold text-cat-teal">{tup(plus(a, b))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Ticks items={PAIRS.map((_, i) => [`জোড়া ${bn(i + 1)}`, solved > i])} />
      <Task done={solved === PAIRS.length}>প্রতিটা জোড়ায় আগে নিজে উত্তর বসান, তারপর Shiku-কে দিয়ে মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · সোম reads card 2 first. Predict, then walk it: the two routes close into
//     a slanted four-sided shape and meet at the same far corner.

const SWAP = ["হ্যাঁ, একই জায়গায় পৌঁছাবে", "না, অন্য কোথাও গিয়ে থামবে", "হেঁটে না দেখে বলা যাবে না"];

export function SwapOrder() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [walked, setWalked] = useSeed("walked", false);
  const w = useWalk(220);
  const path = walk2(O, V1, U1);
  const pts = [O, U1, S1, V1].map((p) => `${FA.sx(p[0])},${FA.sy(p[1])}`).join(" ");

  const go = () =>
    w.go(path, () => {
      setWalked(true);
      pass("কে আগে পড়লো তাতে কিছু যায় আসে না: u + v = v + u। ঘরে ঘরে দেখলে 3 + 1 আর 1 + 3 তো একই।");
    });

  return (
    <>
      <Speech who="সোম" initial="সো" tint="teal">
        আমি কিন্তু উল্টো করে পড়বো। আগে card ২, তারপর card ১।
      </Speech>
      <Plane f={FA} ticks={1} label={walked ? "two routes, (3, 1) then (1, 4) and (1, 4) then (3, 1), meeting at (4, 5)" : "Fahim's route: (3, 1), then (1, 4), to the prize at (4, 5)"}>
        {walked && <polygon points={pts} className={`${FADE} pointer-events-none fill-cat-teal/15`} />}
        <Arrow f={FA} from={O} to={U1} tone="blue" />
        <Arrow f={FA} from={U1} to={S1} tone="coral" />
        <Label f={FA} at={U1} dx={8} dy={14} anchor="start" size={9} className="fill-cat-blue">
          ফাহিম
        </Label>
        <Trail f={FA} cells={walked ? path : w.trail} faint={walked} />
        {walked && (
          <>
            <Arrow f={FA} from={O} to={V1} tone="coral" draw />
            <Arrow f={FA} from={V1} to={S1} tone="blue" draw delay={300} />
            <Label f={FA} at={V1} dx={-8} dy={4} anchor="end" size={9} className={`${FADE} fill-cat-coral`}>
              সোম
            </Label>
          </>
        )}
        <Prize f={FA} at={S1} found />
        <Shiku f={FA} at={walked ? S1 : w.here} />
      </Plane>
      <div className="text-sm font-medium text-muted">সোম কি ফাহিমের গুপ্তধনটাই খুঁজে পাবে?</div>
      <div className="mt-2 grid gap-2">
        {SWAP.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, walked, 0)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && !walked && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={go} disabled={w.running} className={`${primaryBtn} bg-cat-violet`}>
            সোমের order-এ হাঁটান
          </button>
        </div>
      )}
      {walked && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          দুইজনের পথ মিলে একটা হেলানো চারকোণা আঁকা হয়ে গেল, আর দুইটা পথই গিয়ে ঠেকলো একই কোণায়, <b className="font-mono">{tup(S1)}</b>-এ।
        </div>
      )}
      <Task done={walked}>আগে guess করুন, তারপর Shiku-কে সোমের order-এ হাঁটান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · আম্মুর tiffin, three slots each: no picture to draw, the same rule. The
//     label adds itself up slot by slot as each food goes in.

const FOODS: { name: string; icon: string; v: number[] }[] = [
  { name: "ডিম", icon: "🥚", v: [80, 6, 0] },
  { name: "রুটি", icon: "🫓", v: [80, 3, 1] },
  { name: "কলা", icon: "🍌", v: [105, 1, 14] },
];
const NUTRI = ["ক্যালরি", "প্রোটিন (g)", "চিনি (g)"];

export function SnackLabel() {
  const pass = useGate();
  const [added, setAdded] = useSeed<number[]>("added", []);
  const full = added.length === FOODS.length;
  const total = NUTRI.map((_, s) => added.reduce((t, i) => t + FOODS[i].v[s], 0));

  const add = (i: number) => {
    if (added.includes(i)) return;
    const next = [...added, i];
    setAdded(next);
    if (next.length === FOODS.length) pass("তিন ঘরের ছবি আঁকা যায় না, তবু যোগের নিয়ম সেই একই। টিফিনের পুরো হিসাব (265, 10, 15)।");
  };

  return (
    <>
      <div className="mt-4 text-center text-sm text-muted">প্রতিটা খাবারের card-এ তিনটা ঘর: ক্যালরি, প্রোটিন আর চিনি</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {FOODS.map((f, i) => {
          const on = added.includes(i);
          return (
            <button
              key={f.name}
              type="button"
              disabled={on}
              onClick={() => add(i)}
              className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-1 py-2.5 transition-[opacity,border-color] duration-300 motion-reduce:transition-none disabled:cursor-default ${
                on ? "border-border opacity-40" : "border-border hover:border-cat-teal/60"
              }`}
            >
              <span className="text-3xl" aria-hidden="true">
                {f.icon}
              </span>
              <span className="mt-1 font-semibold">{f.name}</span>
              <span className="font-mono text-sm">{tup(f.v)}</span>
            </button>
          );
        })}
      </div>
      <div className="mx-auto mt-4 max-w-sm rounded-2xl border-2 border-foreground/70 px-4 py-3">
        <div className="flex items-baseline justify-between gap-2 border-b-4 border-foreground/70 pb-1">
          <span className="text-lg font-black">টিফিনের label</span>
          <span className="text-sm text-muted">{added.length ? added.map((i) => FOODS[i].icon).join(" ") : "বাক্স এখনো খালি"}</span>
        </div>
        {NUTRI.map((n, s) => (
          <div key={n} className="flex items-baseline justify-between gap-3 border-b border-border py-1.5 last:border-0">
            <span className="font-medium">{n}</span>
            <span className="font-mono tabular-nums">
              {added.length > 1 && <span className="text-sm text-muted">{added.map((i) => FOODS[i].v[s]).join(" + ")} = </span>}
              <b key={added.length} className={`${POP} inline-block`}>
                {total[s]}
              </b>
            </span>
          </div>
        ))}
      </div>
      {full && (
        <div className={`${FADE} mt-3 text-center font-mono text-[1.05rem]`}>
          <span className="font-sans">{added.map((i) => FOODS[i].name).join(" + ")}</span> = <b className="text-cat-teal">{tup(total)}</b>
        </div>
      )}
      <Task done={full}>
        একটা একটা করে খাবারগুলো tap করে টিফিনে ভরুন ({bn(added.length)}/{bn(FOODS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · নাসিব's two cards do not match. Pair them slot by slot: cm meets years,
//     kg meets pressure, and slot 3 has nobody at all.

const HW = [
  ["উচ্চতা", "150 cm"],
  ["ওজন", "45 kg"],
];
const ABS = [
  ["বয়স", "12 বছর"],
  ["প্রেশার", "110"],
  ["রক্তে চিনি", "90"],
];
const WHY = [
  "150 cm-এর সাথে 12 বছর? উচ্চতার সাথে বয়স যোগ করে যে সংখ্যা আসবে, তার মানে কেউ জানে না।",
  "45 kg-এর সাথে প্রেশার 110? এটারও কোনো মানে দাঁড়ায় না।",
  "আর 90-এর তো জোড়াই নাই। Card ১-এ তিন নম্বর ঘরই নেই!",
];

function Cell({ k, v, tone }: { k: string; v: string; tone: "blue" | "coral" }) {
  return (
    <span className={`block rounded-lg px-1 py-1.5 ${tone === "blue" ? "bg-cat-blue/10" : "bg-cat-coral/10"}`}>
      <span className="block text-[0.7rem] leading-tight text-muted">{k}</span>
      <b className="font-mono text-sm">{v}</b>
    </span>
  );
}

export function WrongShape() {
  const pass = useGate();
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const all = tried.length === ABS.length;

  const tap = (i: number) => {
    if (tried.includes(i)) return;
    const next = [...tried, i];
    setTried(next);
    if (next.length === ABS.length) pass("যোগ করতে হলে দুইটা card-এ ঘর সমান থাকতে হবে, আর একই ঘরে একই জিনিস।");
  };

  return (
    <>
      <Speech who="নাসিব" initial="না" tint="blue">
        আমার এই দুইটা card-ও একটু যোগ করে দাও না!
      </Speech>
      <div className="mt-4 text-center text-sm">
        <b className="text-cat-blue">card ১</b>-এ দুইটা ঘর, <b className="text-cat-coral">card ২</b>-এ তিনটা
      </div>
      <div className="mx-auto mt-2 grid max-w-sm grid-cols-3 gap-2">
        {ABS.map((b, i) => {
          const a = HW[i];
          const on = tried.includes(i);
          return (
            <button
              key={b[0]}
              type="button"
              aria-pressed={on}
              onClick={() => tap(i)}
              className={`flex cursor-pointer flex-col items-stretch gap-1 rounded-xl border-2 p-2 text-center transition-colors duration-300 motion-reduce:transition-none ${
                on ? "nudge border-danger/50 bg-danger/5" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <span className="text-xs text-muted">{bn(i + 1)} নম্বর ঘর</span>
              {a ? (
                <Cell k={a[0]} v={a[1]} tone="blue" />
              ) : (
                <span className="grid min-h-12 place-items-center rounded-lg border-2 border-dashed border-muted/40 text-muted">—</span>
              )}
              <span className="font-mono text-muted">+</span>
              <Cell k={b[0]} v={b[1]} tone="coral" />
              <span className={`font-mono font-bold ${on ? "text-danger" : "text-muted/40"}`}>= ?</span>
            </button>
          );
        })}
      </div>
      {tried.map((i) => (
        <Nope key={i}>{WHY[i]}</Nope>
      ))}
      <Task done={all}>ঘরে ঘরে যোগ করে দেখুন তো। তিনটা ঘরই একবার করে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The question backwards: which one card takes সামিন to the prize? The
//     reader drags the card's arrow from her to the X, three times; the table
//     keeps prize, সামিন and card side by side until end − start shows.

const TRIPS: { v: XY; u: XY }[] = [
  { v: [2, 1], u: [6, 4] },
  { v: [1, 5], u: [4, 2] },
  { v: [6, 3], u: [1, 1] },
];

export function WayBack() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [solved, setSolved] = useSeed("solved", 0);
  const [tip, setTip] = useSeed<XY>("tip", TRIPS[0].v);
  const { v, u } = TRIPS[round];
  const done = solved > round;
  const last = round === TRIPS.length - 1;

  const put = (p: XY) => {
    if (done) return;
    const t = snap(p, FA);
    setTip(t);
    if (!same(t, u)) return;
    setSolved(round + 1);
    if (last) pass("প্রতিবার card = গুপ্তধন − সামিন, ঘরে ঘরে। মানে u − v হলো v থেকে u-তে যাওয়ার arrow।");
  };
  const next = () => {
    setRound(round + 1);
    setTip(TRIPS[round + 1].v);
  };

  return (
    <>
      <div className="mt-4 text-center text-sm text-muted">
        সামিন দাঁড়িয়ে আছে {tup(v)}-এ, গুপ্তধন {tup(u)}-এ। সামিনের পাশের বৃত্তটা ধরে টেনে লাল ✕-এর ওপর নিয়ে যান।
      </div>
      <Plane
        f={FA}
        ticks={1}
        label={`সামিন at ${tup(v)}, the prize at ${tup(u)}; drag the card's arrow from her to the prize`}
        drag={done ? undefined : { down: put, move: put }}
        onKey={done ? undefined : nudger((d) => put(plus(tip, d)))}
      >
        <Prize f={FA} at={u} found={done} />
        <Samin f={FA} at={v} />
        <Arrow f={FA} from={v} to={tip} tone="teal" w={3} />
        {!done && <circle cx={FA.sx(tip[0])} cy={FA.sy(tip[1])} r={9} strokeWidth={2} className="pointer-events-none fill-cat-teal/20 stroke-cat-teal" />}
      </Plane>
      <div className="mx-auto max-w-xs">
        <Clue name="সামিনের card" v={minus(tip, v)} tone="teal" />
      </div>
      {done && !last && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={next} className={quietBtn}>
            এবার অন্য জায়গা থেকে →
          </button>
        </div>
      )}
      {solved > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="mx-auto text-center font-mono tabular-nums">
            <thead>
              <tr className="font-sans text-xs text-muted">
                <th className="px-3 pb-1 font-normal">গুপ্তধন (u)</th>
                <th className="px-3 pb-1 font-normal">সামিন (v)</th>
                <th className="px-3 pb-1 font-normal">card</th>
              </tr>
            </thead>
            <tbody>
              {TRIPS.slice(0, solved).map((t, i) => (
                <tr key={i} className={FADE}>
                  <td className="px-3">{tup(t.u)}</td>
                  <td className="px-3">{tup(t.v)}</td>
                  <td className="px-3 font-bold text-cat-teal">{tup(minus(t.u, t.v))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Ticks items={TRIPS.map((_, i) => [`খোঁজ ${bn(i + 1)}`, solved > i])} />
      <Task done={solved === TRIPS.length}>
        তিনবার সামিন থেকে গুপ্তধন পর্যন্ত arrow টানুন। তারপর table-এর সংখ্যাগুলোয় একবার চোখ বুলান, কিছু চোখে পড়ে?
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Check the card by walking it: from সামিন, along (u − v), lands on u. The
//     trap answer is the card itself, read as a place.

const CV = TRIPS[0].v;
const CU = TRIPS[0].u;
const CD = minus(CU, CV);
const LAND = ["(4, 3)", "(6, 4)", "(2, 1)"];

export function CheckTrip() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [walked, setWalked] = useSeed("walked", false);
  const w = useWalk(220);
  const path = route(CV, CD);

  const go = () =>
    w.go(path, () => {
      setWalked(true);
      pass("সামিনের জায়গা থেকে card ধরে হাঁটলেই গুপ্তধন: v + (u − v) = u ✓");
    });

  return (
    <>
      <div className="mx-auto mt-4 max-w-xs">
        <Clue name="সামিনের card, u − v" v={CD} tone="teal" />
      </div>
      <Plane f={FA} ticks={1} label={walked ? "Shiku walked (4, 3) from (2, 1) and landed on the prize at (6, 4)" : "Shiku standing with সামিন at (2, 1)"}>
        <Trail f={FA} cells={walked ? path : w.trail} faint={walked} />
        {walked && (
          <>
            <Arrow f={FA} from={CV} to={CU} tone="teal" w={3} draw />
            <Prize f={FA} at={CU} found />
          </>
        )}
        <Samin f={FA} at={CV} />
        <Shiku f={FA} at={walked ? CU : w.running ? w.here : CV} />
      </Plane>
      <div className="text-sm font-medium text-muted">Shiku যদি সামিনের জায়গা থেকে এই card ধরে হাঁটে, থামবে কোথায়?</div>
      <div className="mt-2 grid gap-2">
        {LAND.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, walked, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="font-mono">{o}</span>
          </Choice>
        ))}
      </div>
      {guess !== null && !walked && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={go} disabled={w.running} className={`${primaryBtn} bg-cat-violet`}>
            হাঁটিয়ে দেখুন
          </button>
        </div>
      )}
      {walked && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl border border-border px-4 py-3 text-center`}>
          <div className="font-mono text-lg">
            {tup(CV)} + {tup(CD)} = <b className="text-cat-teal">{tup(CU)}</b>
          </div>
          <div className="text-sm text-muted">সামিনের জায়গা + card = গুপ্তধন</div>
        </div>
      )}
      <Task done={walked}>আগে guess করুন, তারপর Shiku-কে হাঁটিয়ে মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · সামিন's stall book. Per slot the reader calls it (বেড়েছে / কমেছে), then
//     the subtraction shows its sign and says it in words; one vector, the
//     whole story.

const BOOK = [
  { k: "খাবার", then: 1200, now: 1100 },
  { k: "সাজ", then: 300, now: 450 },
  { k: "পুরস্কার", then: 250, now: 100 },
];
const MOVE = ["বেড়েছে", "কমেছে"];
const signed = (n: number) => (n > 0 ? `+${n}` : sg(n));

export function StallMoney() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<(number | null)[]>("picks", [null, null, null]);
  const all = picks.every((p) => p !== null);
  const diff = BOOK.map((b) => b.now - b.then);

  const pick = (i: number, p: number) => {
    if (picks[i] !== null) return;
    const next = picks.map((q, j) => (j === i ? p : q));
    setPicks(next);
    if (next.every((q) => q !== null)) pass("(−100, +150, −150), এক লাইনেই পুরো বছরের গল্প। বিয়োগ দিয়ে দেখা যায় কী বদলালো।");
  };

  return (
    <>
      <div className="mt-4 text-center text-sm text-muted">সামিনের হিসাবের খাতা (টাকায়)</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {BOOK.map((b, i) => {
          const d = diff[i];
          const p = picks[i];
          const right = d > 0 ? 0 : 1;
          return (
            <div key={b.k} className="flex flex-col items-center rounded-xl border border-border px-1.5 py-2.5 text-center">
              <b>{b.k}</b>
              <span className="mt-1 text-xs text-muted">গত বছর</span>
              <span className="font-mono">{b.then}</span>
              <span className="text-xs text-muted">এ বছর</span>
              <span className="font-mono">{b.now}</span>
              {p === null ? (
                <div className="mt-2 grid w-full gap-1.5">
                  {MOVE.map((m, j) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => pick(i, j)}
                      className="cursor-pointer rounded-full border-2 border-border py-1 text-sm transition-colors hover:border-cat-blue/60 motion-reduce:transition-none"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={`${FADE} mt-2`}>
                  <div className="font-mono text-xs text-muted">
                    {b.now} − {b.then}
                  </div>
                  <div className={`font-mono text-xl font-bold ${d < 0 ? "text-danger" : "text-accent-text"}`}>{signed(d)}</div>
                  <div className="text-sm leading-snug">
                    {bn(Math.abs(d))} টাকা {d < 0 ? "কম" : "বেশি"}
                  </div>
                  <div className={`mt-0.5 text-xs ${p === right ? "text-accent-text" : "text-danger"}`}>{p === right ? "✓ ঠিক ধরেছেন" : "✕ উল্টোটা হয়েছে"}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {all && (
        <div className={`${FADE} mx-auto mt-4 max-w-sm rounded-2xl bg-cat-teal/5 px-4 py-3 text-center`}>
          <div className="text-sm text-muted">এ বছর − গত বছর</div>
          <div className="font-mono text-xl font-bold">
            (
            {diff.map((d, i) => (
              <span key={i}>
                {i > 0 && ", "}
                <span className={d < 0 ? "text-danger" : "text-accent-text"}>{signed(d)}</span>
              </span>
            ))}
            )
          </div>
        </div>
      )}
      <Task done={all}>প্রতিটা খাতে আগে আন্দাজ করুন খরচ বেড়েছে না কমেছে, তারপর বিয়োগটা মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Say it out loud. Each card: a line of notation; tapped, its reading.

const SAY: { see: string; say: string }[] = [
  { see: "u + v", say: "“u হাঁটো, তারপর সেখান থেকে v হাঁটো”" },
  { see: "u + v = v + u", say: "“আগে-পরে যেভাবেই হাঁটো, পৌঁছাবে একই জায়গায়”" },
  { see: "u − v", say: "“v থেকে u-তে যাওয়ার arrow”" },
  { see: "v + (u − v) = u", say: "“v থেকে ওই arrow ধরে হাঁটলে u-তে পৌঁছাবে”" },
];

export function SayIt() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);

  const flip = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === SAY.length) pass("যোগ মানে একটার পর আরেকটা হাঁটা, বিয়োগ মানে এখান থেকে ওখানে যাওয়ার পথ। চিহ্নগুলো এখন আর অচেনা না।");
  };

  return (
    <>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {SAY.map((c, i) => {
          const on = open.includes(i);
          return (
            <button
              key={c.see}
              type="button"
              aria-expanded={on}
              onClick={() => flip(i)}
              className={`flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-3 py-2.5 text-center transition-colors motion-reduce:transition-none ${
                on ? "cursor-default border-cat-violet/40 bg-cat-violet/5" : "border-border hover:border-cat-violet/60"
              }`}
            >
              <span className="font-serif text-2xl italic">{c.see}</span>
              {on ? <span className={`${FADE} mt-1 text-[0.92rem] leading-snug`}>{c.say}</span> : <span className="mt-1 text-xs text-muted">আগে মুখে বলুন, তারপর tap</span>}
            </button>
          );
        })}
      </div>
      <Task done={open.length === SAY.length}>
        প্রতিটা কার্ড আগে মুখে বলুন, তারপর উল্টে মিলিয়ে নিন ({bn(open.length)}/{bn(SAY.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  TwoClues: { start: {}, guessed: { guess: [3, 4] }, walked: { guess: [3, 4], walked: true } },
  SlotAdd: {
    start: { ans: [5, 4] },
    first: { ans: [6, 4], landed: [6, 4], solved: 1 },
    last: { round: 2, solved: 3, ans: [3, 5], landed: [3, 5] },
  },
  SwapOrder: { start: {}, walked: { guess: 0, walked: true } },
  SnackLabel: { start: {}, two: { added: [0, 1] }, full: { added: [0, 1, 2] } },
  WrongShape: { start: {}, all: { tried: [0, 1, 2] } },
  WayBack: {
    start: {},
    dragging: { tip: [5, 3] },
    first: { solved: 1, tip: [6, 4] },
    last: { round: 2, solved: 3, tip: [1, 1] },
  },
  CheckTrip: { start: {}, walked: { guess: 1, walked: true } },
  StallMoney: { start: {}, one: { picks: [1, null, null] }, all: { picks: [1, 1, 1] } },
  SayIt: { start: {}, all: { open: [0, 1, 2, 3] } },
};
