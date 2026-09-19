"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Bubble, Card as CastCard, Loop, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Speech, Ticks, pill, primaryBtn, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Label, Plane, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { Tape } from "./dimension-journey";
import { bn } from "./figure-kit";
import { dot, tupN } from "./haat-journey";

// Screens for "Math for AI 4.4 — Cosine similarity, কার ছবি বেশি মানানসই", told as a Journey.
//
// TV night. Under 3.6's fixed club rule (films normalised) মামা's Mr. Bean
// scores 5.34 and মামী's Titanic 4.09, so মামা claims his film fits him
// better. The reader bets. মামা's own taste arrow turns out longer (he rates
// everything loudly), so the person's length is in the score too. 4.3's rule
// run backwards, dividing both sides of a balance, leaves cos θ alone; a
// fixed −1…1 scale is read (0.9 is 26°, not 90%); 3.6's 3.71 is one division
// short of মামা's 0.69 with Titanic; নানু, who has watched nothing, has no
// direction and gets NaN. Last the reader computes both cosines unaided:
// 0.991 and 0.991, a tie, and a mirror shows why.
//
// Tailwind only; the sheets are journey/plane. Ink on the white sheet is fixed.

const O: XY = [0, 0];
const len = (v: readonly number[]) => Math.hypot(...v);
const cosOf = (a: XY, b: XY) => dot(a, b) / (len(a) * len(b));
/** a number to d decimals with a real minus */
const fix = (n: number, d: number) => {
  const s = Math.abs(n).toFixed(d);
  return n < 0 && Number(s) !== 0 ? `−${s}` : s;
};

// Scores run (drama, comedy), as in 3.6.
const MAMA: XY = [2, 5];
const MAMI: XY = [4, 1];
const TITANIC: XY = [5, 2];
const BEAN: XY = [1, 4];

function Card({ who, film, score, tone }: { who: string; film: string; score: string; tone: "teal" | "violet" }) {
  return (
    <div className={`rounded-xl border-2 bg-surface px-2 py-2 text-center ${tone === "teal" ? "border-cat-teal/40" : "border-cat-violet/40"}`}>
      <div className={`text-sm font-semibold ${tone === "teal" ? "text-cat-teal" : "text-cat-violet"}`}>{who}</div>
      <div className="text-xs text-muted">{film}</div>
      <div className="font-mono text-2xl font-bold">{score}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Whose film fits better? 3.6's club rule (films normalised) gives মামা
//     and Mr. Bean 5.34, মামী and Titanic 4.09. মামা claims the win. The
//     reader seals a bet, settled only by VerdictCos (screen 7).

const FIT_BET = ["মামার ছবি, নম্বর তো বেশি", "মামীর ছবি", "দুইজনেরই একদম সমান", "এই নম্বর দেখে বলাই যায় না"];

export function WhoFits() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি সিল হলো, মিলিয়ে দেখবো শেষে।");
  };

  return (
    <>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Card who="মামা (2, 5)" film="Mr. Bean (1, 4)" score="5.34" tone="teal" />
        <Card who="মামী (4, 1)" film="Titanic (5, 2)" score="4.09" tone="violet" />
      </div>
      <Speech who="মামা" initial="মা">
        নম্বর দেখো! আমার ছবিটা আমার সাথে বেশি মানানসই। কাল সকালের চা তুমি বানাবে।
      </Speech>
      <div className="mt-3 text-sm font-medium text-muted">কার ছবি তার সাথে বেশি মানানসই?</div>
      <div className="mt-2 grid gap-2">
        {FIT_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>দুইটা নম্বর দেখে একটাতে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The loud person. Measure the two tastes: মামা 5.39, মামী 4.12. Then
//     double মামা's card, (4, 10): same taste, score 5.34 → 10.67.

const FL = makeFrame(-0.5, 5.5, -0.5, 10.5, 20);

export function LoudPerson() {
  const pass = useGate();
  const [measured, setMeasured] = useSeed<number[]>("measured", []);
  const [doubled, setDoubled] = useSeed("doubled", false);
  const both = measured.length === 2;
  const mama: XY = doubled ? [4, 10] : MAMA;
  const score = dot(mama, BEAN) / len(BEAN);

  const measure = (i: number) => !measured.includes(i) && setMeasured([...measured, i]);
  const double = () => {
    setDoubled(true);
    pass("দ্বিগুণ নম্বর দিলে score-ও দ্বিগুণ।");
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Plane f={FL} ticks={2} label={`মামার পছন্দ ${tupN(mama)}, মামীর পছন্দ (4, 1)`} className="max-w-[8rem] shrink-0">
          {measured.includes(0) && !doubled && <Tape f={FL} from={O} to={MAMA} />}
          {measured.includes(1) && <Tape f={FL} from={O} to={MAMI} />}
          {doubled && <Arrow f={FL} from={O} to={MAMA} tone="teal" w={2} dashed faint />}
          <Arrow f={FL} from={O} to={mama} tone="teal" w={2.6} />
          <Arrow f={FL} from={O} to={MAMI} tone="violet" w={2.6} />
          <Label f={FL} at={mama} dx={6} dy={4} anchor="start" className="fill-cat-teal">
            মামা
          </Label>
          <Label f={FL} at={MAMI} dy={-8} className="fill-cat-violet">
            মামী
          </Label>
        </Plane>
        <div className="grid min-w-0 flex-1 gap-2">
          {["মামার", "মামীর"].map((w, i) => (
            <button key={w} type="button" disabled={measured.includes(i)} onClick={() => measure(i)} className={`${pill(measured.includes(i))} font-sans`}>
              {measured.includes(i) ? <span className={FADE}>{w} পছন্দ {i === 0 ? "5.39" : "4.12"} লম্বা</span> : `${w} পছন্দ মাপুন`}
            </button>
          ))}
          {both && (
            <div className={`${FADE} rounded-xl border border-border bg-surface px-3 py-2 text-center`}>
              <div className="text-sm">মামা {tupN(mama)} আর Mr. Bean</div>
              <div className="font-mono text-xl font-bold">
                <span key={String(doubled)} className={`${POP} inline-block`}>
                  {fix(score, 2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      {both && !doubled && (
        <div className={`${FADE} mt-3 text-center`}>
          <div className="text-[0.95rem]">মামা যদি একই রুচি রেখে সবকিছুতে দ্বিগুণ নম্বর দিতেন?</div>
          <button type="button" onClick={double} className={`${primaryBtn} mt-2`}>
            মামার card দ্বিগুণ করুন
          </button>
        </div>
      )}
      <Ticks
        items={[
          ["দুইজনের length", both],
          ["মামা দ্বিগুণ", doubled],
        ]}
      />
      <Task done={doubled}>দুইজনের পছন্দের arrow ফিতা দিয়ে মাপুন, তারপর মামার card দ্বিগুণ করে score-টা দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Run 4.3's rule backwards on a balance. Divide both sides by ‖v‖ and by
//     ‖w‖, in either order, and cos θ stands alone. Dividing one side only tips the balance.
//     Then a practice pair, (3, 4) and (4, 3): 24 ÷ 5 ÷ 5 = 0.96, about 16°.

const LENGTHS = ["‖v‖", "‖w‖"];
const MOVES = ["দুই পাশ ‖v‖ দিয়ে ভাগ", "দুই পাশ ‖w‖ দিয়ে ভাগ", "শুধু ডান পাশ ভাগ"];

function Balance({ tilt }: { tilt: boolean }) {
  return (
    <svg viewBox="0 -12 200 52" className="mx-auto block h-auto w-full max-w-[14rem]" aria-hidden="true">
      <path d="M100 38L92 24H108Z" className="fill-foreground/40" />
      <g style={{ transform: `rotate(${tilt ? -8 : 0}deg)`, transformOrigin: "100px 22px" }} className="transition-transform duration-500 motion-reduce:transition-none">
        <rect x={14} y={19} width={172} height={5} rx={2.5} className={tilt ? "fill-danger/70" : "fill-foreground/50"} />
        <path d="M24 22V8M176 22V8" strokeWidth={1.5} className="stroke-foreground/40" />
      </g>
    </svg>
  );
}

export function RunBackwards() {
  const pass = useGate();
  const [cut, setCut] = useSeed<number[]>("cut", []);
  const [tilt, setTilt] = useSeed<number | null>("tilt", null);
  const [tried, setTried] = useSeed("tried", false);
  const alone = cut.length === 2;
  const left = cut.length ? `(v · w) ${cut.map((i) => `÷ ${LENGTHS[i]}`).join(" ")}` : "v · w";
  const right = [...LENGTHS.filter((_, i) => !cut.includes(i)), "cos θ"].join(" × ");

  const move = (i: number) => {
    if (i === 2) return setTilt((tilt ?? 0) + 1);
    if (cut.includes(i)) return;
    setTilt(null);
    setCut([...cut, i]);
  };
  const practise = () => {
    setTried(true);
    pass("দুই length ভাগ করলে থাকে শুধু cos θ।");
  };

  return (
    <>
      <Balance tilt={tilt !== null} />
      <div className="mx-auto grid max-w-sm grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
        <div key={`l${cut.length}`} className={`${POP} rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-2 py-2 font-mono text-sm`}>
          {left}
        </div>
        <span className={`font-mono text-xl ${tilt !== null ? "text-danger" : ""}`}>{tilt !== null ? "≠" : "="}</span>
        <div key={`r${cut.length}`} className={`${POP} rounded-xl border-2 border-cat-violet/40 bg-cat-violet/5 px-2 py-2 font-mono text-sm ${alone ? "text-lg font-bold" : ""}`}>
          {right}
        </div>
      </div>
      {tilt !== null && <Nope key={tilt}>দাঁড়িপাল্লা হেলে গেল। শুধু এক পাশে ভাগ করলে দুই পাশ আর সমান থাকে না।</Nope>}
      {!alone ? (
        <div className="mt-3 grid gap-2">
          {MOVES.map((m, i) => (
            <button key={m} type="button" disabled={cut.includes(i)} onClick={() => move(i)} className={`${pill(cut.includes(i))} font-sans`}>
              {m}
            </button>
          ))}
        </div>
      ) : (
        <div className={`${FADE} mt-3 text-center`}>
          <div className="text-[0.95rem]">চলুন একটা জোড়ায় চালিয়ে দেখি: (3, 4) আর (4, 3)। দুইজনই 5 লম্বা।</div>
          {!tried ? (
            <button type="button" onClick={practise} className={`${primaryBtn} mt-2`}>
              হিসাবটা চালান
            </button>
          ) : (
            <div className={`${FADE} mt-2 text-[0.95rem]`}>
              <span className="font-mono">
                24 ÷ 5 ÷ 5 = <b>0.96</b>
              </span>
              , মানে প্রায় 16°
            </div>
          )}
        </div>
      )}
      <Task done={tried}>দুই পাশে একই ভাগ করে cos θ-কে একা করুন। তারপর একটা জোড়ায় হিসাবটা চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The fixed scale. An angle slider turns two unit arrows apart, and a pin
//     slides on a −1…1 bar. Find the angles for 0.9, 0.5, 0 and −1: about 26°,
//     60°, 90° and 180°. 0.9 is not 90% alike.

const FC = makeFrame(-1.3, 1.3, -0.3, 1.3, 70);
const MARKS = [
  { c: 0.9, deg: 26 },
  { c: 0.5, deg: 60 },
  { c: 0, deg: 90 },
  { c: -1, deg: 180 },
];

export function ScaleCard() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 45);
  const [hit, setHit] = useSeed<number[]>("hit", []);
  const c = Math.cos((deg * Math.PI) / 180);
  const b: XY = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
  const all = hit.length === MARKS.length;

  const turn = (d: number) => {
    setDeg(d);
    const i = MARKS.findIndex((m) => m.deg === d);
    if (i < 0 || hit.includes(i)) return;
    const next = [...hit, i];
    setHit(next);
    if (next.length === MARKS.length) pass("0.9 মানে 90% মিল না, 26° কোণ।");
  };

  return (
    <>
      <Plane f={FC} grid={0} axes={false} label={`দুইটা arrow যাদের length 1, মাঝে ${deg}°`} className="max-w-[13rem]">
        <path d={`M${FC.sx(-1.2)} ${FC.sy(0)}H${FC.sx(1.2)}`} strokeWidth={1} className="stroke-[#0f1b2d]/20" />
        <Arrow f={FC} from={O} to={[1, 0]} tone="teal" w={2.6} />
        <Arrow f={FC} from={O} to={b} tone="violet" w={2.6} />
        <Label f={FC} at={[0, 1.15]} size={11} className="fill-[#0f1b2d] font-mono">
          {`${deg}°`}
        </Label>
      </Plane>
      <div className="mx-auto flex max-w-sm items-center gap-3">
        <span className="font-mono text-sm text-muted">0°</span>
        <input
          type="range"
          min={0}
          max={180}
          step={1}
          value={deg}
          aria-label="দুই arrow-এর মাঝের কোণ"
          onChange={(e) => turn(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
        />
        <span className="font-mono text-sm text-muted">180°</span>
      </div>
      <div className="relative mx-auto mt-6 mb-6 h-2 max-w-sm rounded-full bg-linear-to-r from-danger/60 via-foreground/15 to-accent/70">
        {[-1, 0, 1].map((t) => (
          <span key={t} className="absolute top-3 -translate-x-1/2 font-mono text-xs text-muted" style={{ left: `${((t + 1) / 2) * 100}%` }}>
            {t < 0 ? "−1" : t}
          </span>
        ))}
        <span
          className="absolute -top-6 -translate-x-1/2 rounded-full bg-cat-blue px-1.5 font-mono text-xs font-bold text-white transition-[left] duration-150 motion-reduce:transition-none"
          style={{ left: `${((c + 1) / 2) * 100}%` }}
        >
          {fix(c, 2)}
        </span>
      </div>
      <Ticks items={MARKS.map((m, i) => [`cos ${m.c < 0 ? "−1" : m.c}`, hit.includes(i)])} />
      <Task done={all}>কোণটা ঘুরিয়ে এমন চারটা জায়গা খুঁজুন, যেখানে cos হয় 0.9, 0.5, 0 আর −1।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · One division short. 3.6's normalised-film score for মামা and Titanic
//     was 3.71. Divide by মামা's own length, 5.39 → 0.69. The full formula,
//     20 ÷ 5.39 ÷ 5.39, gives the same 0.69: about 46°.

export function LastDivide() {
  const pass = useGate();
  const [k, setK] = useSeed("k", 0);
  const steps = ["মামার length দিয়ে ভাগ করুন", "পুরো সূত্রে মিলিয়ে দেখুন"];

  const step = () => {
    setK(k + 1);
    if (k + 1 === 2) pass("Cosine মানে box ÷ দুই length।");
  };

  return (
    <>
      <div className="mx-auto mt-2 max-w-sm rounded-xl border border-border bg-surface px-3 py-2 text-center">
        <div className="text-sm text-muted">৩.৬-এর নিয়মে মামা আর Titanic</div>
        <div className="text-[0.95rem]">
          Titanic-এর length 1 করে তারপর box: <b className="font-mono">3.71</b>
        </div>
      </div>
      <div className="mx-auto mt-3 grid max-w-sm gap-2">
        {k >= 1 && (
          <div className={`${FADE} rounded-xl border-2 border-cat-teal/40 bg-cat-teal/5 px-3 py-2 text-center`}>
            <div className="text-xs text-muted">মামার পছন্দ 5.39 লম্বা</div>
            <div className="font-mono text-lg">
              3.71 ÷ 5.39 = <b>0.69</b>
            </div>
          </div>
        )}
        {k >= 2 && (
          <div className={`${FADE} rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-3 py-2 text-center`}>
            <div className="text-xs text-muted">পুরো সূত্র: box ÷ মামার length ÷ Titanic-এর length</div>
            <div className="font-mono text-lg">
              20 ÷ 5.39 ÷ 5.39 = <b>0.69</b>
            </div>
            <div className="text-sm">মানে মামা আর Titanic প্রায় 46° দূরে।</div>
          </div>
        )}
      </div>
      {k < 2 && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={step} className={primaryBtn}>
            {steps[k]}
          </button>
        </div>
      )}
      <Task done={k >= 2}>৩.৬-এর নম্বরটা মামার নিজের length দিয়ে ভাগ করুন, তারপর পুরো সূত্রের সাথে মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · নানু has watched nothing: (0, 0). Run the formula: the box is 0, her
//     length is 0, and 0 ÷ 0 is NaN. Then say why: an arrow of length zero
//     has no direction, so no angle with anything.

const NANU_WHY = ["নানুর জন্য Titanic-ই ঠিক, নম্বর তো 0-ও হতে পারে", "শূন্য arrow-এর কোনো দিক নাই, তাই কোনো কোণও নাই", "ক্যালকুলেটরটা নষ্ট"];

export function NanuCard() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const [got, setGot] = useSeed("got", false);

  const why = (i: number) => {
    if (i !== 1) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setGot(true);
    pass("শূন্য arrow-এর কোনো কোণ নাই।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border-2 border-border bg-surface px-4 py-2 text-center">
        <div className="text-sm font-semibold">নানুর পছন্দ</div>
        <div className="font-mono text-xl font-bold">(0, 0)</div>
      </div>
      {!ran ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={() => setRan(true)} className={primaryBtn}>
            নানু আর Titanic, সূত্রটা চালান
          </button>
        </div>
      ) : (
        <div className={FADE}>
          <div className="mx-auto mt-3 grid max-w-xs gap-0.5 rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-3 py-2 font-mono text-sm">
            <div>0 × 5 + 0 × 2 = 0</div>
            <div>‖(0, 0)‖ = 0</div>
            <div className="text-base">
              0 ÷ (0 × 5.39) = <b className="text-danger">NaN</b>
            </div>
          </div>
          <div className="mt-3 text-sm font-medium text-muted">ক্যালকুলেটর বলছে NaN, মানে “not a number”। কেন?</div>
          <div className="mt-2 grid gap-2">
            {NANU_WHY.map((o, i) => (
              <Choice key={o} n={i} look={got && i === 1 ? "right" : "idle"} disabled={got} onClick={() => why(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {miss !== null && <Nope key={miss}>উঁহু। একটা arrow যদি কোথাও না যায়, সে কোন দিকে তাক করা?</Nope>}
        </div>
      )}
      <Task done={got}>নানুর জন্য সূত্রটা চালান, তারপর বলুন উত্তরটা এমন এলো কেন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · এবার আপনার পালা. The verdict: the reader picks each couple's cosine from
//     the box and the lengths, wrong tries bouncing. 0.99 and 0.99, a tie.
//     Then the mirror: swap every card's two slots and one pair lands on the
//     other.

const VERDICT = [
  { who: "মামা আর Mr. Bean", a: MAMA, b: BEAN, opts: ["5.34", "0.99", "0.69"], ans: 1, work: "22 ÷ 5.39 ÷ 4.12" },
  { who: "মামী আর Titanic", a: MAMI, b: TITANIC, opts: ["0.99", "4.09", "0.47"], ans: 0, work: "22 ÷ 4.12 ÷ 5.39" },
];
const FM = makeFrame(-0.5, 5.5, -0.5, 5.5, 26);
const swap = (v: XY): XY => [v[1], v[0]];

export function VerdictCos() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const [mirror, setMirror] = useSeed("mirror", false);
  const both = done === VERDICT.length;
  const v = VERDICT[Math.min(done, VERDICT.length - 1)];

  const pick = (i: number) => {
    if (both) return;
    if (i !== v.ans) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setDone(done + 1);
  };
  const flip = () => {
    setMirror(true);
    pass("আয়নায় উল্টালেও কোণ একই: 0.991।");
  };
  const pair = (a: XY) => (mirror ? swap(a) : a);

  return (
    <>
      <div className="flex items-center gap-3">
        <Plane f={FM} ticks={1} label="চারটা arrow আর আয়নার দাগ" className="max-w-[10rem] shrink-0">
          {both && <path d={`M${FM.sx(0)} ${FM.sy(0)}L${FM.sx(5.3)} ${FM.sy(5.3)}`} strokeWidth={1.2} strokeDasharray="4 4" className="pointer-events-none stroke-[#0f1b2d]/40" />}
          <Arrow f={FM} from={O} to={pair(MAMA)} tone="teal" w={2.4} />
          <Arrow f={FM} from={O} to={pair(BEAN)} tone="teal" w={1.6} dashed />
          <Arrow f={FM} from={O} to={pair(MAMI)} tone="violet" w={2.4} />
          <Arrow f={FM} from={O} to={pair(TITANIC)} tone="violet" w={1.6} dashed />
        </Plane>
        <div className="grid min-w-0 flex-1 gap-1 text-xs">
          <div className="rounded-lg bg-surface px-2 py-1">
            box: মামা · Bean = <b className="font-mono">22</b>, মামী · Titanic = <b className="font-mono">22</b>
          </div>
          <div className="rounded-lg bg-surface px-2 py-1">
            length: মামা, Titanic <b className="font-mono">5.39</b>; মামী, Bean <b className="font-mono">4.12</b>
          </div>
          {VERDICT.slice(0, done).map((d) => (
            <div key={d.who} className={`${FADE} rounded-lg bg-accent/10 px-2 py-1`}>
              ✓ {d.who}: <span className="font-mono">{d.work} = </span>
              <b className="font-mono">{fix(cosOf(d.a, d.b), 3)}</b>
            </div>
          ))}
        </div>
      </div>
      {!both ? (
        <>
          <div className="mt-3 text-sm font-medium text-muted">{v.who}: cosine similarity কত?</div>
          <div className="mt-2 flex justify-center gap-2">
            {v.opts.map((o, i) => (
              <button key={o} type="button" onClick={() => pick(i)} className={pill(false)}>
                {o}
              </button>
            ))}
          </div>
          {miss !== null && <Nope key={miss}>উঁহু। box এর নম্বরটাকে দুইজনের length দিয়েই ভাগ করতে হবে, একজনের দিয়ে না।</Nope>}
        </>
      ) : (
        <div className={`${FADE} mt-3 text-center`}>
          <div className="text-[0.95rem]">দুইটাই 0.991! এমন কাকতালীয় মিল কেন?</div>
          {!mirror && (
            <button type="button" onClick={flip} className={`${primaryBtn} mt-2`}>
              প্রতিটা card-এর দুই ঘর অদলবদল করুন
            </button>
          )}
        </div>
      )}
      <Ticks
        items={[
          [`দুইটা cosine (${bn(done)}/২)`, both],
          ["আয়না", mirror],
        ]}
      />
      <Task done={mirror}>দুই জোড়ার cosine similarity বের করুন, তারপর আয়নাটা দেখুন।</Task>
    </>
  );
}

// ===========================================================================
// Animations. Story scenes act out a step's setup (written `story` in the MDX,
// so the Journey reads them as words, not as the widget); figures inside a
// <Then> or a Check's explanation show what its paragraph says. All watch-only:
// each waits for একবারে দেখুন or step by step, and every beat is drawn from k.
// Scene pieces the cast doesn't have (TV, sofa, নানু, the boat) are drawn here.

type Story = { story?: boolean };
const C_INK = "#0f1b2d";
const C_Y = 150;

/** Whether the reader asked for less motion (cast.tsx's useCalm, copied): নানু's bob stays still then. */
function useCalm() {
  const [calm, setCalm] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser's motion setting, which the server render cannot see
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return calm;
}

/** The TV on a low cabinet, feet on the floor at y; children draw on the screen, in stage units. */
function C_TV({ x, y, w = 72, h = 44, children }: { x: number; y: number; w?: number; h?: number; children?: ReactNode }) {
  const top = y - 30 - h;
  return (
    <g className="pointer-events-none">
      <rect x={x - w / 2 + 4} y={y - 24} width={w - 8} height={24} rx={2} fill="#92400e" />
      <path d={`M${x - w / 2 + 12} ${y - 12}H${x + w / 2 - 12}`} stroke="#78350f" strokeWidth={1} />
      <rect x={x - 4} y={y - 30} width={8} height={6} fill="#374151" />
      <rect x={x - w / 2 - 3} y={top - 3} width={w + 6} height={h + 6} rx={3} fill="#1f2937" />
      <rect x={x - w / 2} y={top} width={w} height={h} fill="#0f172a" />
      {children}
    </g>
  );
}

/** A sofa, feet on the floor at y. */
function C_Sofa({ x, y, w = 110 }: { x: number; y: number; w?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - w / 2 + 6} y={y - 46} width={w - 12} height={28} rx={7} fill="#b45309" />
      <rect x={x - w / 2} y={y - 22} width={w} height={16} rx={4} fill="#d97706" />
      <rect x={x - w / 2 - 4} y={y - 32} width={12} height={26} rx={4} fill="#92400e" />
      <rect x={x + w / 2 - 8} y={y - 32} width={12} height={26} rx={4} fill="#92400e" />
      <path d={`M${x - w / 2 + 4} ${y - 6}v6M${x + w / 2 - 4} ${y - 6}v6`} stroke="#44403c" strokeWidth={3} />
    </g>
  );
}

/** A phone at a holding hand (Person arm="hold" puts the hand at about x + 17 × facing, y − 43); `lit` glows. */
function C_Phone({ x, y, lit = false }: { x: number; y: number; lit?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 3.5} y={y - 6} width={7} height={12} rx={1.4} fill="#111827" />
      <rect x={x - 2.4} y={y - 4.6} width={4.8} height={8.6} rx={0.6} fill={lit ? "#93c5fd" : "#334155"} />
    </g>
  );
}

/**
 * নানু, feet at (x, y): white sari with a red border, its end over grey hair,
 * round glasses. Not in the cast (she comes in only here), so drawn locally on
 * the cast's scale. Change x and she glides over `ms`; `walking` bobs her.
 */
function C_Nanu({ x, y, facing = 1, walking = false, ms = 1200, happy = false }: { x: number; y: number; facing?: 1 | -1; walking?: boolean; ms?: number; happy?: boolean }) {
  const calm = useCalm();
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      <g transform={`scale(${facing} 1)`}>
        <g>
          <Loop on={walking && !calm} run={`${x},${y}`} ms={ms} type="translate" values="0 0;0 -1.4;0 0" dur={0.35} />
          <path d="M-9 -38L-13 -1H13L9 -38Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth={0.8} />
          <path d="M-12.6 -4.5H12.6" stroke="#dc2626" strokeWidth={2.4} />
          <rect x={-9} y={-40} width={18} height={20} rx={5} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={0.8} />
          <path d="M-7 -40L7 -22" stroke="#dc2626" strokeWidth={1.6} />
          <path d="M-8 -38l-3 14M8 -38l3 14" strokeWidth={4} strokeLinecap="round" stroke="#c68e5f" />
          <circle cy={-51} r={9} fill="#c68e5f" />
          <path d="M-9.5 -52q0 -11 9.5 -11t9.5 11q-6 -6 -19 0Z" fill="#d4d4d8" />
          <path d="M-11.5 -45q-1.5 -20 11.5 -20t11.5 20q-2 -15 -11.5 -16t-11.5 16Z" fill="#f8fafc" stroke="#dc2626" strokeWidth={1} />
          <g fill="none" stroke={C_INK} strokeWidth={0.9}>
            <circle cx={-3.4} cy={-51} r={2.6} />
            <circle cx={3.4} cy={-51} r={2.6} />
            <path d="M-0.8 -51h1.6" />
          </g>
          <circle cx={-3.4} cy={-51} r={1} fill={C_INK} />
          <circle cx={3.4} cy={-51} r={1} fill={C_INK} />
          <path d={happy ? "M-3 -45.5q3 3 6 0" : "M-2.5 -45h5"} fill="none" stroke={C_INK} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      </g>
      <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={C_INK}>
        নানু
      </text>
    </g>
  );
}

/** A caption that fades in fresh on every beat. */
const say = (k: number, lines: readonly ReactNode[]) => (
  <span key={k} className={FADE}>
    {lines[Math.min(k, lines.length - 1)]}
  </span>
);

/** An arc about the origin between two directions (radians, a0 < a1), radius r in data units. */
const arcAt = (f: Frame, a0: number, a1: number, r: number) => {
  const p = (a: number) => `${f.sx(r * Math.cos(a))} ${f.sy(r * Math.sin(a))}`;
  return `M${p(a0)}A${r * f.u} ${r * f.u} 0 0 0 ${p(a1)}`;
};
const angleOf = (v: XY) => Math.atan2(v[1], v[0]);

/** A white sheet under a frame's drawing, the same in light and dark. */
function C_Sheet({ f }: { f: Frame }) {
  return <rect x={0.5} y={0.5} width={f.W - 1} height={f.H - 1} rx={10} fill="white" stroke="#0f1b2d" strokeOpacity={0.12} />;
}

/**
 * 4.3's roof at noon: the sun straight overhead, a stick of length L hinged at
 * (bx, C_GY) and standing `deg` from the ground ahead, its shadow on the
 * ground (behind the hinge once past 90°). The stick turns and the shadow
 * stretches under CSS transitions, so a beat only sets `deg`.
 */
const C_GY = 80;
function C_Roof({ deg, bx, L, children }: { deg: number; bx: number; L: number; children?: ReactNode }) {
  const c = Math.cos((deg * Math.PI) / 180);
  return (
    <svg viewBox="0 0 220 100" className="mx-auto block h-auto w-full max-w-[15rem]" aria-hidden="true">
      <rect x={0.5} y={0.5} width={219} height={99} rx={10} fill="white" stroke="#0f1b2d" strokeOpacity={0.12} />
      <circle cx={196} cy={16} r={8} fill="#fbbf24" />
      {[150, 176, 202].map((x) => (
        <path key={x} d={`M${x} 30V${C_GY - 6}`} stroke="#f59e0b" strokeOpacity={0.45} strokeWidth={1} strokeDasharray="3 4" />
      ))}
      <path d={`M12 ${C_GY}H208`} stroke="#a8a29e" strokeWidth={2} />
      <rect
        x={bx}
        y={C_GY + 1}
        width={L}
        height={5}
        rx={1.5}
        fill="#334155"
        fillOpacity={0.6}
        style={{ transform: `scaleX(${c})`, transformOrigin: `${bx}px 0px`, transitionDuration: "900ms" }}
        className="transition-transform ease-in-out motion-reduce:transition-none"
      />
      <g style={{ transform: `rotate(${-deg}deg)`, transformOrigin: `${bx}px ${C_GY}px`, transitionDuration: "900ms" }} className="transition-transform ease-in-out motion-reduce:transition-none">
        <path d={`M${bx} ${C_GY}H${bx + L}`} stroke="#92400e" strokeWidth={4} strokeLinecap="round" />
      </g>
      <circle cx={bx} cy={C_GY} r={2.6} fill={C_INK} />
      {children}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 0 · A figure for the opening review check's explanation, no task: 4.3's
//     roof. The stick's shadow is where cos θ comes in; stand the stick up and
//     the shadow is gone, so ‖v‖ × ‖w‖ alone can't be the answer.

const X0_BX = 62;
const X0_L = 58;
const X0_SAY = [
  "দুপুরের রোদে ছাদের লাঠি, আর মাটিতে তার ছায়া।",
  "মাটির দিকটা v, লাঠিটা w। ছায়াটা হলো ‖w‖ cos θ।",
  "তাই v · w-তে তিনটা গুণ: দুইটা length আর cos θ।",
  "লাঠি খাড়া করলে ছায়াই নাই, cos 90° = 0।",
  "‖v‖ × ‖w‖ নিলে খাড়া লাঠিতেও বড় একটা নম্বর আসতো। তাই cos বাদ দেওয়া যায় না।",
];

export function RoofStick() {
  const s = useScene(4, [600, 1800, 2000, 1700]);
  const k = s.k;
  const up = k >= 3;
  const a = (40 * Math.PI) / 180;

  return (
    <Scene scene={s} caption={say(k, X0_SAY)}>
      <C_Roof deg={up ? 90 : 40} bx={X0_BX} L={X0_L}>
        <path d={`M${X0_BX} ${C_GY + 7}H${X0_BX + 78}`} stroke="#2563eb" strokeWidth={1.6} />
        <path d={`M${X0_BX + 78} ${C_GY + 7}l-6 -3v6Z`} fill="#2563eb" />
        <text x={X0_BX + 84} y={C_GY + 10} fontSize={9} fontWeight={700} fill="#2563eb">
          v
        </text>
        {k >= 1 && !up && (
          <g className={FADE}>
            <path d={`M${X0_BX + 16} ${C_GY}A16 16 0 0 0 ${X0_BX + 16 * Math.cos(a)} ${C_GY - 16 * Math.sin(a)}`} fill="none" stroke="#b45309" strokeWidth={1.2} />
            <text x={X0_BX + 20} y={C_GY - 4} fontSize={8} fill="#b45309">
              θ
            </text>
            <text x={X0_BX + 20} y={C_GY - 32} fontSize={9} fontWeight={700} fill="#92400e">
              w
            </text>
            <text x={X0_BX + 22} y={C_GY + 18} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill="#334155">
              ‖w‖ cos θ
            </text>
          </g>
        )}
        {up && (
          <g className={FADE}>
            <path d={`M${X0_BX + 9} ${C_GY}v-9h-9`} fill="none" stroke="#b45309" strokeWidth={1} />
            <text x={X0_BX + 13} y={C_GY - 11} fontSize={8} fontFamily="ui-monospace, monospace" fill="#b45309">
              90°
            </text>
          </g>
        )}
      </C_Roof>
      <div className="mt-1 flex min-h-6 flex-wrap items-center justify-center gap-x-3 font-mono text-sm">
        {k >= 2 && (
          <span className={FADE}>
            v · w = ‖v‖ × ‖w‖ × <b className="text-cat-amber">cos θ</b>
          </span>
        )}
        {k >= 4 && <span className={`${FADE} text-danger line-through`}>‖v‖ × ‖w‖</span>}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: TV night at নানুর বাড়ি.
//      মামা and মামী tug at the remote, their taste cards come up, ফাহিম runs
//      3.6's rule on his phone, the TV splits into Mr. Bean and Titanic, and
//      মামা, seeing the numbers, can't keep quiet. The numbers themselves are
//      the widget's, so the scene stops before them.

const S1_MAMA = 146;
const S1_MAMI = 208;
const S1_FAHIM = 276;

export function RemoteFight({}: Story) {
  const s = useScene(4, [600, 1600, 1800, 1700]);
  const k = s.k;
  const tug = k < 3;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সন্ধ্যায় নানুর বাড়ি: মামা আর মামী TV-র রিমোট নিয়ে টানাটানি করছেন। ফাহিম ফোনে ৩.৬-এর নিয়ম চালালো, TV-তে মামার জন্য Mr. Bean আর মামীর জন্য Titanic। নম্বর দেখে মামা চেঁচিয়ে উঠলেন।">
        <C_Sofa x={196} y={C_Y} w={124} />
        <C_TV x={50} y={C_Y}>
          {k >= 3 && (
            <g className={FADE}>
              <rect x={14} y={76} width={36} height={44} fill="#0d9488" />
              <rect x={50} y={76} width={36} height={44} fill="#be123c" />
              <text x={32} y={101} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white">
                Mr. Bean
              </text>
              <text x={68} y={101} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white">
                Titanic
              </text>
            </g>
          )}
        </C_TV>
        <Person who="mama" x={S1_MAMA} y={C_Y} mood={k >= 4 ? "shout" : k >= 3 ? "happy" : "plain"} arm={tug ? "hold" : k >= 4 ? "point" : "down"} label />
        <Person who="mami" x={S1_MAMI} y={C_Y} facing={-1} mood={k >= 3 ? "happy" : "plain"} arm={tug ? "hold" : "down"} label />
        {tug && <rect x={S1_MAMA + 20} y={C_Y - 46} width={S1_MAMI - S1_MAMA - 40} height={5} rx={1.5} fill="#111827" />}
        {k >= 1 && k < 3 && (
          <>
            <CastCard x={S1_MAMA} y={C_Y - 78} text="(2, 5)" tone="teal" />
            <CastCard x={S1_MAMI} y={C_Y - 78} text="(4, 1)" tone="coral" />
          </>
        )}
        <Person who="fahim" x={k >= 2 ? S1_FAHIM : 360} y={C_Y} facing={-1} walking={k === 2} ms={1400} arm={k >= 2 ? "hold" : "down"} label={k >= 2} />
        {k >= 2 && <C_Phone x={S1_FAHIM - 19} y={C_Y - 47} lit />}
        {k >= 4 && <Bubble x={S1_MAMA} y={C_Y - 66} lines={["নম্বর দেখো!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: what's inside 5.34. 4.3
//      says a box number is length × length × cos θ; the film's length was
//      wiped in 3.6, and one length is still there. Whose? Left open.

const X1_SAY = [
  "মামা আর Mr. Bean পেলো 5.34।",
  "৪.৩ বলে, box এর নম্বরে তিনটা জিনিস গুণ হয়ে থাকে।",
  "একটা হলো কোণ, মানে আসলে কতটা মিল।",
  "ছবির length তো ৩.৬-এ 1 বানিয়ে মুছে ফেলা হয়েছিল।",
  "তাহলে বাকি এই length টা কার?",
];

function X1Chip({ on, tone, struck, bangla, children, note }: { on: boolean; tone: "amber" | "accent" | "plain"; struck?: boolean; bangla?: boolean; children: ReactNode; note?: ReactNode }) {
  const ring = { amber: "border-cat-amber bg-cat-amber/10", accent: "border-accent bg-accent/10", plain: "border-border bg-surface" }[tone];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`rounded-lg border-2 px-2 py-1 text-sm transition-colors ${bangla ? "" : "font-mono"} duration-500 motion-reduce:transition-none ${on ? ring : "border-border bg-surface"}`}>
        <span className={struck ? "text-muted line-through" : ""}>{children}</span>
      </div>
      <div className="min-h-4 text-xs leading-tight text-muted">{note}</div>
    </div>
  );
}

export function WhatsInScore() {
  const s = useScene(4, [600, 1800, 1700, 2000]);
  const k = s.k;

  return (
    <Scene scene={s} caption={say(k, X1_SAY)}>
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-xl border-2 border-cat-teal/40 bg-surface px-3 py-1 text-center">
          <div className="text-xs text-muted">মামা আর Mr. Bean</div>
          <div className="font-mono text-2xl font-bold">5.34</div>
        </div>
        <div className="flex min-h-14 items-start justify-center gap-1.5">
          {k >= 1 && (
            <>
              <span className={`${FADE} pt-1 font-mono`}>=</span>
              <div className={FADE}>
                <X1Chip on={k >= 4} tone="amber" note={k >= 4 ? <b className={`${POP} inline-block text-cat-amber`}>কার?</b> : "length"}>
                  {k >= 4 ? "‖ ? ‖" : "‖ ‖"}
                </X1Chip>
              </div>
              <span className={`${FADE} pt-1 font-mono`}>×</span>
              <div className={FADE}>
                <X1Chip on={k >= 3} tone="plain" struck={k >= 3} bangla note={k >= 3 ? "৩.৬-এ মুছেছি, 1" : "ছবির length"}>
                  ‖ছবি‖
                </X1Chip>
              </div>
              <span className={`${FADE} pt-1 font-mono`}>×</span>
              <div className={FADE}>
                <X1Chip on={k >= 2} tone="accent" note={k >= 2 ? "কোণ" : ""}>
                  cos θ
                </X1Chip>
              </div>
            </>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1¾ · A figure for the loud-film review check's explanation, no task: 3.6's
//      Titanic (5, 2) doubled to (10, 4). Same share of drama and comedy, so
//      the same direction; only longer. A loud film.

const X1L_F = makeFrame(-0.4, 10.6, -0.4, 4.6, 15, 10);
const X1L_SAY = [
  "Titanic, (5, 2)।",
  "দুইটা ঘরই দ্বিগুণ: (10, 4)। Arrow-ও দ্বিগুণ লম্বা।",
  "5 : 2 আর 10 : 4, drama আর comedy-র ভাগাভাগি একই। তাই দিকও একই।",
  "একই দিক, শুধু জোর বেশি। এর নামই loud film।",
];

export function LoudFilmAgain() {
  const s = useScene(3, [600, 1700, 2200]);
  const k = s.k;
  const f = X1L_F;

  return (
    <Scene scene={s} caption={say(k, X1L_SAY)}>
      <div className="flex items-center justify-center gap-3">
        <svg viewBox={`0 0 ${f.W} ${f.H}`} className="block h-auto w-full max-w-[12rem]" aria-hidden="true">
          <C_Sheet f={f} />
          <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(10.4)}M${f.sx(0)} ${f.sy(0)}V${f.sy(4.4)}`} stroke="#0f1b2d" strokeOpacity={0.25} />
          {k >= 2 && <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(10.5)} ${f.sy(4.2)}`} strokeDasharray="3 3" stroke="#0f1b2d" strokeOpacity={0.35} className={FADE} />}
          {k >= 1 && <Arrow f={f} from={O} to={[10, 4]} tone="violet" w={1.8} draw />}
          <Arrow f={f} from={O} to={TITANIC} tone="violet" w={3} />
          <Label f={f} at={TITANIC} dy={-8} size={8} className="fill-[#0f1b2d] font-mono">
            (5, 2)
          </Label>
          {k >= 1 && (
            <Label f={f} at={[10, 4]} dx={-2} dy={-7} anchor="end" size={8} className={`fill-[#0f1b2d] font-mono ${FADE}`}>
              (10, 4)
            </Label>
          )}
        </svg>
        <div className="min-h-8 w-24 shrink-0 text-center">
          {k >= 3 && <span className={`${POP} inline-block rounded-full bg-cat-violet/15 px-2 py-0.5 text-sm font-bold text-cat-violet`}>loud film</span>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: the answer is on the
//      sofa. মামা gives his favourite a loud 5; মামী says 4 for hers. Their
//      cards come up. The lengths are the widget's, so they're not shown.

const S2_MAMA = 124;
const S2_MAMI = 204;

export function LoudSofa({}: Story) {
  const s = useScene(3, [600, 2200, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সোফার সামনে মামা আর মামী। মামা জোর দিয়ে Comedy-কে 5 দেন, মামী drama-কে 4। তারপর দুইজনের card।">
        <C_Sofa x={164} y={C_Y} w={150} />
        <Person who="mama" x={S2_MAMA} y={C_Y} mood={k === 1 ? "shout" : k >= 3 ? "smug" : "plain"} arm={k === 1 ? "wave" : "down"} label />
        <Person who="mami" x={S2_MAMI} y={C_Y} facing={-1} mood={k === 2 ? "happy" : "plain"} label />
        {k === 1 && (
          <>
            <Bubble x={S2_MAMA} y={C_Y - 66} lines={["Comedy? পুরো 5!"]} />
            <g className={FADE} fill="none" stroke={C_INK} strokeOpacity={0.5} strokeWidth={1.2} strokeLinecap="round">
              <path d={`M${S2_MAMA + 15} ${C_Y - 50}q4 4 0 8M${S2_MAMA + 20} ${C_Y - 53}q6 7 0 14`} />
            </g>
          </>
        )}
        {k === 2 && <Bubble x={S2_MAMI} y={C_Y - 66} lines={["Drama? 4।"]} />}
        {k >= 3 && (
          <>
            <CastCard x={S2_MAMA} y={C_Y - 78} text="(2, 5)" tone="teal" />
            <CastCard x={S2_MAMI} y={C_Y - 78} text="(4, 1)" tone="coral" />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: 5.34 is মামা's length
//      5.39 times something. Double his card and the length doubles, the score
//      doubles, and the something doesn't move. The length is his voice.

const X2_SAY = [
  "মামা আর Mr. Bean: 5.34।",
  "এই 5.34 হলো মামার length 5.39, গুণ আরেকটা কিছু।",
  "Card দ্বিগুণ করলে length 10.77, score 10.67। কিন্তু ? একটুও নড়েনি।",
  "মানে 5.34-এর একটা অংশ ছবির মিল না, মামার গলার জোর।",
];

function X2Row({ score, len, voice }: { score: string; len: string; voice: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <b className="w-12 text-right font-mono text-lg">{score}</b>
      <span className="font-mono">=</span>
      <div className="flex flex-col items-center">
        <span className="rounded-lg border-2 border-cat-teal/50 bg-cat-teal/10 px-2 font-mono font-bold text-cat-teal">{len}</span>
        <span key={String(voice)} className={`${FADE} text-xs text-muted`}>
          {voice ? "গলার জোর" : "মামার length"}
        </span>
      </div>
      <span className="font-mono">×</span>
      <div className="flex flex-col items-center">
        <span className="rounded-lg border-2 border-dashed border-border px-2 font-mono font-bold">?</span>
        <span className="text-xs text-muted">ছবির মিল</span>
      </div>
    </div>
  );
}

export function VoiceInScore() {
  const s = useScene(3, [600, 1900, 2300]);
  const k = s.k;

  return (
    <Scene scene={s} caption={say(k, X2_SAY)}>
      <div className="grid min-h-[6.5rem] content-start gap-2">
        {k === 0 ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted">মামা (2, 5) আর Mr. Bean</span>
            <b className="font-mono text-lg">5.34</b>
          </div>
        ) : (
          <div className={FADE}>
            <X2Row score="5.34" len="5.39" voice={k >= 3} />
          </div>
        )}
        {k >= 2 && (
          <div className={FADE}>
            <X2Row score="10.67" len="10.77" voice={k >= 3} />
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: dividing by the lengths
//      is shrinking both arrows to length 1. The practice pair (3, 4), (4, 3):
//      24 → 4.8 → 0.96, and the angle between them never moves.

const X3_F = makeFrame(-0.2, 4.3, -0.2, 4.3, 27, 7);
const X3_V: XY = [3, 4];
const X3_W: XY = [4, 3];
const X3_SAY = [
  "(3, 4) আর (4, 3), দুইজনই 5 লম্বা। box 24।",
  "প্রথমটার length 5 দিয়ে ভাগ: arrow ছোট হয়ে 1, নম্বর 4.8।",
  "দ্বিতীয়টারও length ছাঁটা: 0.96।",
  "জোর ছেঁটে ফেললাম, কোণটা একটুও বদলায়নি। যা থাকলো, সেটাই cosine similarity।",
];

export function ShaveLengths() {
  const s = useScene(3, [600, 1800, 1600]);
  const k = s.k;
  const f = X3_F;
  const unit = (v: XY): XY => [v[0] / 5, v[1] / 5];

  return (
    <Scene scene={s} caption={say(k, X3_SAY)}>
      <div className="flex items-center justify-center gap-3">
        <svg viewBox={`0 0 ${f.W} ${f.H}`} className="block h-auto w-full max-w-[8.5rem] shrink-0" aria-hidden="true">
          <C_Sheet f={f} />
          <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(4.2)}M${f.sx(0)} ${f.sy(0)}V${f.sy(4.2)}`} stroke="#0f1b2d" strokeOpacity={0.25} />
          {k >= 1 && <path d={arcAt(f, 0, Math.PI / 2, 1)} fill="none" strokeDasharray="2 3" stroke="#0f1b2d" strokeOpacity={0.5} className={FADE} />}
          <path d={arcAt(f, angleOf(X3_W), angleOf(X3_V), 1.7)} fill="none" stroke="#b45309" strokeWidth={1.4} />
          <Label f={f} at={[1.95 * Math.cos(0.785), 1.95 * Math.sin(0.785)]} dx={4} dy={3} anchor="start" size={8} className="fill-[#b45309] font-mono">
            16°
          </Label>
          <Arrow f={f} from={O} to={X3_V} tone="teal" w={2.4} faint={k >= 1} />
          <Arrow f={f} from={O} to={X3_W} tone="violet" w={2.4} faint={k >= 2} />
          {k >= 1 && <Arrow f={f} from={O} to={unit(X3_V)} tone="teal" w={2.4} draw />}
          {k >= 2 && <Arrow f={f} from={O} to={unit(X3_W)} tone="violet" w={2.4} draw />}
        </svg>
        <div className="grid min-w-0 gap-1 font-mono text-sm">
          <div>v · w = 24</div>
          <div className="min-h-5">{k >= 1 && <span className={FADE}>24 ÷ 5 = 4.8</span>}</div>
          <div className="min-h-5">{k >= 2 && <span className={FADE}>4.8 ÷ 5 = 0.96</span>}</div>
          <div className="min-h-7">
            {k >= 3 && <span className={`${POP} inline-block rounded-lg bg-accent/10 px-2 py-0.5 font-sans text-sm font-bold whitespace-nowrap text-accent-text`}>cosine similarity</span>}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation, no task: in two slots a
//      protractor can read the angle; সোমের ফোন's words have 300 slots, no
//      picture and no protractor, and the formula still answers. The word
//      numbers are made up, only to show a long list.

const X3P_F = makeFrame(-0.3, 4.9, -0.3, 4.9, 16, 6);
const X3P_WORDS = [
  ["0.12", "−0.40", "0.33"],
  ["0.09", "−0.31", "0.47"],
];
const X3P_SAY = [
  "দুই ঘরে চাঁদা বসিয়েই কোণটা মাপা যায়।",
  "কিন্তু সোমের ফোনে একেকটা শব্দ 300টা ঘরের list।",
  "300 ঘরের কোনো ছবি নাই, চাঁদা বসাবো কোথায়?",
  "সূত্রটা তবু দিব্যি চলে: box ÷ দুই length = 0.94, মানে দুইটা শব্দ 20° দূরে।",
];

function X3Protractor({ crossed }: { crossed: boolean }) {
  const f = X3P_F;
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} className="block h-auto w-full max-w-[5.5rem] shrink-0" aria-hidden="true">
      <C_Sheet f={f} />
      <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(3.6)}A${3.6 * f.u} ${3.6 * f.u} 0 0 0 ${f.sx(0)} ${f.sy(3.6)}Z`} fill="#fde68a" fillOpacity={0.6} stroke="#b45309" strokeWidth={1} />
      <Arrow f={f} from={O} to={X3_V} tone="teal" w={2} />
      <Arrow f={f} from={O} to={X3_W} tone="violet" w={2} />
      {crossed && <path d={`M${f.W * 0.18} ${f.H * 0.18}L${f.W * 0.82} ${f.H * 0.82}M${f.W * 0.82} ${f.H * 0.18}L${f.W * 0.18} ${f.H * 0.82}`} stroke="#dc2626" strokeWidth={3} strokeLinecap="round" className={POP} />}
    </svg>
  );
}

export function NoProtractor() {
  const s = useScene(3, [600, 1900, 1900]);
  const k = s.k;

  return (
    <Scene scene={s} caption={say(k, X3P_SAY)}>
      <div className="flex min-h-[6.5rem] items-center justify-center gap-3">
        <X3Protractor crossed={k >= 2} />
        {k >= 1 && (
          <div className={`${FADE} grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] gap-1.5`}>
            {X3P_WORDS.map((w, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-9 shrink-0 text-xs text-muted">শব্দ {bn(i + 1)}</span>
                <span className="min-w-0 truncate rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs ring-1 ring-border">({w.join(", ")}, …)</span>
              </div>
            ))}
            <div className="text-right text-xs text-muted">প্রতিটায় 300টা ঘর</div>
            <div className="min-h-6">
              {k >= 3 && (
                <span className={`${POP} inline-block rounded-lg bg-accent/10 px-2 py-0.5 text-sm`}>
                  cos = <b className="font-mono">0.94</b>, মানে <b className="font-mono">20°</b>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: why 0.9 isn't 90%. The
//      angle ruler, 0° to 180°, is evenly marked; threads run down to each
//      angle's cos on the −1…1 ruler, and bunch up at both ends. 26° lands on
//      0.9, 60° on 0.5.

const X4_X0 = 18;
const X4_SPAN = 244;
const x4Top = (deg: number) => X4_X0 + (deg / 180) * X4_SPAN;
const x4Bot = (deg: number) => X4_X0 + ((1 - Math.cos((deg * Math.PI) / 180)) / 2) * X4_SPAN;
const X4_SAY = [
  "ওপরের দাগে কোণ, 0° থেকে 180°। নিচের দাগে তার cos, 1 থেকে −1।",
  "প্রতি 15° কোণে একটা সুতা। কোণ সমান তালে বাড়ে, cos কিন্তু দুই কিনারায় গাদাগাদি।",
  "0.9 শুনলে মনে হয় 90% মিল। আসলে 26° দূরে।",
  "0.5-ও অর্ধেক মিল না, 60° দূরে। তাই percent না, পড়ুন কে আগে কে পরে।",
];
const X4_ENDS: [number, string][] = [
  [1, "1"],
  [0, "0"],
  [-1, "−1"],
];

function X4Hit({ deg, c, show }: { deg: number; c: string; show: boolean }) {
  if (!show) return null;
  return (
    <g className={FADE}>
      <path d={`M${x4Top(deg)} 28L${x4Bot(deg)} 88`} stroke="#d97706" strokeWidth={2.4} />
      <text x={x4Top(deg)} y={42} dx={4} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#b45309">
        {deg}°
      </text>
      <text x={x4Bot(deg)} y={82} dx={4} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#b45309">
        {c}
      </text>
    </g>
  );
}

export function UnevenScale() {
  const s = useScene(3, [600, 2400, 2200]);
  const k = s.k;
  const threads = Array.from({ length: 13 }, (_, i) => i * 15);

  return (
    <Scene scene={s} caption={say(k, X4_SAY)}>
      <svg viewBox="0 0 280 112" className="mx-auto block h-auto w-full max-w-[18rem]" aria-hidden="true">
        <rect x={0.5} y={0.5} width={279} height={111} rx={10} fill="white" stroke="#0f1b2d" strokeOpacity={0.12} />
        <path d={`M${X4_X0} 28H${X4_X0 + X4_SPAN}M${X4_X0} 88H${X4_X0 + X4_SPAN}`} stroke={C_INK} strokeOpacity={0.5} strokeWidth={1.5} />
        {[0, 90, 180].map((d) => (
          <text key={d} x={x4Top(d)} y={18} textAnchor="middle" fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#5a6b7d">
            {d}°
          </text>
        ))}
        {X4_ENDS.map(([c, t]) => (
          <text key={t} x={X4_X0 + ((1 - c) / 2) * X4_SPAN} y={104} textAnchor="middle" fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#5a6b7d">
            {t}
          </text>
        ))}
        {threads.map((d) => (
          <g key={d}>
            <path d={`M${x4Top(d)} 25v6M${x4Bot(d)} 85v6`} stroke={C_INK} strokeOpacity={0.5} />
            {k >= 1 && <Draw d={`M${x4Top(d)} 28L${x4Bot(d)} 88`} delay={(d / 15) * 70} strokeWidth={1} className="stroke-[#2563eb]/60" />}
          </g>
        ))}
        <X4Hit deg={26} c="0.9" show={k >= 2} />
        <X4Hit deg={60} c="0.5" show={k >= 3} />
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's explanation, no task: why cos stays in −1…1.
//      4.3's stick at 60°, then flat (the shadow is the whole stick, never
//      more), upright (0), flat backwards (−1). The bound has a name.

const X4S_DEG = [60, 0, 90, 180];
const X4S_COS = ["0.5", "1", "0", "−1"];
const X4S_SAY = [
  "ছাদের সেই লাঠি, 60°-তে। ছায়া লাঠির অর্ধেক।",
  "একদম শুইয়ে দিলে ছায়া পুরো লাঠিটাই। এর চেয়ে লম্বা হওয়ার উপায় নাই।",
  "খাড়া করলে ছায়া 0।",
  "উল্টো দিকে শোয়ালে ছায়া পেছনে, পুরো লাঠি: −1।",
  "তাই ছায়া ÷ লাঠি সবসময় −1 থেকে 1। বইয়ে এর নাম Cauchy–Schwarz inequality।",
];

export function ShadowCap() {
  const s = useScene(4, [600, 1800, 1500, 1800]);
  const k = s.k;
  const deg = X4S_DEG[Math.min(k, 3)];
  const c = X4S_COS[Math.min(k, 3)];

  return (
    <Scene scene={s} caption={say(k, X4S_SAY)}>
      <C_Roof deg={deg} bx={110} L={60} />
      <div className="mt-1 flex min-h-7 flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span className="text-sm">
          ছায়া ÷ লাঠি ={" "}
          <b key={deg} className={`${POP} inline-block font-mono`}>
            {c}
          </b>
        </span>
        {k >= 4 && <span className={`${POP} inline-block rounded-lg bg-accent/10 px-2 py-0.5 font-mono text-sm font-bold text-accent-text`}>−1 ≤ cos θ ≤ 1</span>}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · A figure for the length check's explanation, no task: (2, 5) squared
//     as tiles, 4 and 25, added to 29, and the root 5.39. 2 + 5 = 7 skips
//     the squares.

const X5_T = 6;
const X5_SAY = [
  "মামার card (2, 5)।",
  "দুই ঘরের বর্গ: 2 × 2 = 4, আর 5 × 5 = 25।",
  "যোগ করলে 29।",
  "29-এর root প্রায় 5.39। বর্গ না করে যোগ করলে 7, সেটা ভুল।",
];

function X5Tiles({ n, x, fill }: { n: number; x: number; fill: string }) {
  return (
    <g className={POP}>
      {Array.from({ length: n * n }, (_, i) => (
        <rect key={i} x={x + (i % n) * X5_T} y={36 - n * X5_T + Math.floor(i / n) * X5_T} width={X5_T - 1} height={X5_T - 1} rx={0.8} fill={fill} />
      ))}
    </g>
  );
}

export function SquareUp() {
  const s = useScene(3, [600, 1700, 1500]);
  const k = s.k;

  return (
    <Scene scene={s} caption={say(k, X5_SAY)}>
      <div className="flex items-center justify-center gap-4">
        <svg viewBox="0 0 64 40" className="block h-auto w-full max-w-[7rem] shrink-0" aria-hidden="true">
          {k >= 1 ? (
            <>
              <X5Tiles n={2} x={4} fill="#0d9488" />
              <X5Tiles n={5} x={26} fill="#d97706" />
            </>
          ) : (
            <text x={32} y={25} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace" className="fill-foreground">
              (2, 5)
            </text>
          )}
        </svg>
        <div className="grid min-w-0 gap-1 font-mono text-sm">
          <div className="min-h-5">{k >= 1 && <span className={FADE}>4 + 25</span>}</div>
          <div className="min-h-5">{k >= 2 && <span className={FADE}>= 29</span>}</div>
          <div className="min-h-6">{k >= 3 && <b className={`${POP} inline-block`}>√29 ≈ 5.39</b>}</div>
          <div className="min-h-5">{k >= 3 && <span className={`${FADE} text-danger line-through`}>2 + 5 = 7</span>}</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: মামা stops short, “was
//      3.6 wrong?”; ফাহিম says not wrong, unfinished, and holds up 3.6's
//      number for মামা and Titanic, 3.71. The cosine is the widget's.

const S5_MAMA = 116;
const S5_FAHIM = 214;

export function WasItWrong({}: Story) {
  const s = useScene(3, [600, 2600, 2000]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="মামা থমকে জিজ্ঞেস করেন, ৩.৬-এ যা করেছিলাম সেটা কি ভুল ছিল? ফাহিম বলে, ভুল না, অসম্পূর্ণ, আর ফোনে দেখায় মামা আর Titanic-এর 3.71।">
        <C_Sofa x={166} y={C_Y} w={140} />
        <Person who="mama" x={S5_MAMA} y={C_Y} mood={k >= 1 && k < 3 ? "puzzled" : "plain"} label />
        <Person who="fahim" x={S5_FAHIM} y={C_Y} facing={-1} arm={k >= 3 ? "hold" : "down"} mood={k === 2 ? "happy" : "plain"} label />
        {k >= 3 && <C_Phone x={S5_FAHIM - 19} y={C_Y - 47} lit />}
        {k === 1 && <Bubble x={S5_MAMA} y={C_Y - 66} lines={["তাহলে ৩.৬-এ আমরা যা", "করেছিলাম, সেটা কি ভুল ছিল?"]} />}
        {k === 2 && <Bubble x={S5_FAHIM} y={C_Y - 66} lines={["ভুল না, অসম্পূর্ণ।"]} />}
        {k >= 3 && <CastCard x={S5_FAHIM} y={C_Y - 80} text="Titanic: 3.71" tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: for one person, 3.6's
//      numbers are all divided by the same length, so the order holds (Mr.
//      Bean before Titanic). Across two people the divisors differ, 5.39 and
//      4.12, so 5.34 against 4.09 says nothing. The results stay "?".

const X5O_MAX = 6;
const X5O_SAY = [
  "৩.৬-এর নিয়মে মামার দুই ছবি: Mr. Bean 5.34, Titanic 3.71।",
  "দুইটাকেই মামার একই length 5.39 দিয়ে ভাগ। নম্বর ছোট হলো, কিন্তু আগে-পরে একই।",
  "এবার দুইজন আলাদা মানুষ: মামার 5.34, মামীর 4.09।",
  "এদের ভাগ করতে হবে আলাদা length দিয়ে, 5.39 আর 4.12। তাই এই দুই নম্বর পাশাপাশি রাখা চলে না।",
];

function X5Bar({ name, v, shown, tone, cut }: { name: string; v: number; shown: string; tone: "teal" | "violet"; cut?: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_2.6rem] items-center gap-2">
      <span className="truncate text-xs">{name}</span>
      <div className="h-3 overflow-hidden rounded-full bg-foreground/10">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none ${tone === "teal" ? "bg-cat-teal" : "bg-cat-violet"}`}
          style={{ width: `${(v / X5O_MAX) * 100}%` }}
        />
      </div>
      <span className="text-right font-mono text-sm font-bold">
        <span key={shown} className={FADE}>
          {shown}
        </span>
      </span>
      {cut && <span className={`${FADE} col-start-2 -mt-1 font-mono text-xs text-muted`}>{cut}</span>}
    </div>
  );
}

export function SameOrder() {
  const s = useScene(3, [600, 2400, 2000]);
  const k = s.k;
  const one = k < 2;

  return (
    <Scene scene={s} caption={say(k, X5O_SAY)}>
      <div key={String(one)} className={`${FADE} mx-auto grid min-h-[5.5rem] max-w-xs content-center gap-2`}>
        <div className="text-center text-xs font-semibold text-muted">{one ? "একজন মানুষ, মামা" : "দুইজন মানুষ"}</div>
        {one ? (
          <>
            <X5Bar name="Mr. Bean" v={k >= 1 ? 0.99 : 5.34} shown={k >= 1 ? "0.99" : "5.34"} tone="teal" cut={k >= 1 ? "÷ 5.39" : undefined} />
            <X5Bar name="Titanic" v={k >= 1 ? 0.69 : 3.71} shown={k >= 1 ? "0.69" : "3.71"} tone="teal" cut={k >= 1 ? "÷ 5.39" : undefined} />
          </>
        ) : (
          <>
            <X5Bar name="মামা, Mr. Bean" v={5.34} shown={k >= 3 ? "?" : "5.34"} tone="teal" cut={k >= 3 ? "÷ 5.39" : undefined} />
            <X5Bar name="মামী, Titanic" v={4.09} shown={k >= 3 ? "?" : "4.09"} tone="violet" cut={k >= 3 ? "÷ 4.12" : undefined} />
          </>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: নানু comes in and sits by
//      মামা and মামী, “আমাকেও একটা ছবি দে তো।”, and her card is (0, 0). What
//      the formula does with it is the widget's.

const S6_SOFA = 236;

export function NanuComes({}: Story) {
  const s = useScene(3, [600, 1800, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="নানু এসে সোফার কাছে দাঁড়ালেন, মামা আর মামী পাশে। নানু বললেন, আমাকেও একটা ছবি দে তো। নানুর card (0, 0)।">
        <C_Sofa x={S6_SOFA} y={C_Y} w={104} />
        <Person who="mama" x={70} y={C_Y} label />
        <Person who="mami" x={128} y={C_Y} label />
        <C_Nanu x={k >= 1 ? S6_SOFA : 360} y={C_Y} facing={-1} walking={k === 1} ms={1600} happy={k >= 2} />
        {k === 2 && <Bubble x={S6_SOFA} y={C_Y - 66} lines={["আমাকেও একটা ছবি", "দে তো।"]} />}
        {k >= 3 && <CastCard x={S6_SOFA} y={C_Y - 80} text="(0, 0)" tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: shrink মামা's arrow
//      (2, 5) toward nothing. It keeps its direction all the way down, until
//      at (0, 0) there's no arrow left to point anywhere, and code says NaN.

const X6_F = makeFrame(-2.6, 2.6, -1.4, 5.4, 16, 6);
const X6_S = [1, 0.5, 0.15, 0];
const X6_AT = ["(2, 5)", "(1, 2.5)", "(0.3, 0.75)", "(0, 0)"];
const X6_SAY = [
  "মামার arrow (2, 5)। কোন দিকে তাক করা, স্পষ্ট।",
  "অর্ধেক করলাম: (1, 2.5)। ছোট, কিন্তু দিক একই।",
  "আরও ছোট, তবু তাক করা ওই দিকেই।",
  "(0, 0)-তে এসে arrow-ই নাই। এবার কোন দিকে তাক করা?",
  "দিক নাই, তাই কোণও নাই। হিসাবে আসে 0 দিয়ে ভাগ, আর code বলে NaN।",
];

export function ShrinkToNothing() {
  const s = useScene(4, [600, 1500, 1400, 1600]);
  const k = s.k;
  const f = X6_F;
  const [sc] = useTween([X6_S[Math.min(k, 3)]], 700);
  const tip: XY = [2 * sc, 5 * sc];
  const gone = k >= 3;
  const at = X6_AT[Math.min(k, 3)];

  return (
    <Scene scene={s} caption={say(k, X6_SAY)}>
      <div className="flex items-center justify-center gap-3">
        <svg viewBox={`0 0 ${f.W} ${f.H}`} className="block h-auto w-full max-w-[6.5rem] shrink-0" aria-hidden="true">
          <C_Sheet f={f} />
          <path d={`M${f.sx(-2.4)} ${f.sy(0)}H${f.sx(2.4)}M${f.sx(0)} ${f.sy(-1.2)}V${f.sy(5.2)}`} stroke="#0f1b2d" strokeOpacity={0.2} />
          {!gone && <Arrow f={f} from={O} to={tip} tone="teal" w={2.6} />}
          {gone && (
            <g className={FADE}>
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4;
                return <path key={i} d={`M${f.sx(0.45 * Math.cos(a))} ${f.sy(0.45 * Math.sin(a))}L${f.sx(1.2 * Math.cos(a))} ${f.sy(1.2 * Math.sin(a))}`} stroke="#0f1b2d" strokeOpacity={0.3} strokeDasharray="2 2" />;
              })}
              <circle cx={f.sx(0)} cy={f.sy(0)} r={3.5} fill="#0d9488" />
              <text x={f.sx(0)} y={f.sy(2.1)} textAnchor="middle" fontSize={14} fontWeight={700} fill="#b45309">
                ?
              </text>
            </g>
          )}
        </svg>
        <div className="grid min-w-0 gap-1.5">
          <b key={at} className={`${FADE} font-mono`}>
            {at}
          </b>
          <div className="min-h-[2.8rem]">
            {k >= 4 && (
              <div className={`${FADE} rounded-lg bg-[#0f1b2d] px-2 py-1 font-mono text-xs leading-snug text-[#e9eef6]`}>
                <div>0 / (0 × 5.39)</div>
                <div className="font-bold text-[#fca5a5]">nan</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for screen 6's explanation, no task: নানু's ranking on the TV
//      fills with NaN row by row; ফাহিম handles her apart and simply puts on
//      an old black-and-white Bangla film. নানু খুশি.

const X6R_ROWS = ["Mr. Bean", "Titanic", "…"];

export function NanRanking() {
  const s = useScene(3, [600, 1300, 1300]);
  const k = s.k;
  const film = k >= 3;
  const nan = (i: number) => k > Math.min(i, 1);

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="TV-তে নানুর জন্য ranking, একেক করে সব ঘরে NaN। তারপর ফাহিম নানুর জন্য একটা পুরানো সাদাকালো বাংলা ছবি চালিয়ে দিলো, নানু খুশি।">
        <C_TV x={96} y={C_Y} w={124} h={70}>
          {!film ? (
            <g>
              <text x={96} y={64} textAnchor="middle" fontSize={8} fontWeight={700} fill="#e2e8f0">
                নানুর জন্য ranking
              </text>
              {X6R_ROWS.map((r, i) => (
                <g key={r}>
                  <text x={44} y={84 + i * 13} fontSize={8} fill="#cbd5e1">
                    {r}
                  </text>
                  <text key={String(nan(i))} x={148} y={84 + i * 13} textAnchor="end" fontSize={8} fontWeight={700} fontFamily="ui-monospace, monospace" fill={nan(i) ? "#f87171" : "#64748b"} className={FADE}>
                    {nan(i) ? "NaN" : "?"}
                  </text>
                </g>
              ))}
            </g>
          ) : (
            <g className={FADE}>
              <rect x={34} y={46} width={124} height={70} fill="#9ca3af" />
              <rect x={34} y={98} width={124} height={18} fill="#6b7280" />
              <circle cx={134} cy={62} r={8} fill="#e5e7eb" />
              <circle cx={80} cy={78} r={5} fill="#1f2937" />
              <path d="M80 98V84" stroke="#1f2937" strokeWidth={6} strokeLinecap="round" />
              <circle cx={104} cy={80} r={5} fill="#1f2937" />
              <path d="M104 98V86" stroke="#1f2937" strokeWidth={6} strokeLinecap="round" />
              <text x={96} y={111} textAnchor="middle" fontSize={7} fontWeight={700} fill="#f3f4f6">
                সাদাকালো বাংলা ছবি
              </text>
            </g>
          )}
        </C_TV>
        <Person who="fahim" x={206} y={C_Y} facing={-1} arm={film ? "point" : "hold"} label />
        {!film && <C_Phone x={187} y={C_Y - 47} lit />}
        <C_Nanu x={268} y={C_Y} facing={-1} happy={film} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: the two couples side by
//      side, 5.34 and 4.09, but the same 8° between each pair. Make every
//      arrow the same length and the two wedges match exactly.

const X7_F = makeFrame(-0.3, 5.4, -0.3, 5.4, 15, 6);
const X7_SAY = [
  "মামা আর Mr. Bean পেলো 5.34, মামী আর Titanic 4.09।",
  "কিন্তু দুই জোড়ার মাঝের কোণ একই, প্রায় 8°।",
  "সবার length সমান করে দিলাম, মানে জোরটা ছেঁটে ফেললাম। দুইটা কোণ হুবহু এক।",
  "তাই দুইজনেরই 0.991। মামার বাড়তি নম্বরটা পুরোটাই গলার জোর।",
];

function X7Pair({ a, b, tone, arms, score, k }: { a: XY; b: XY; tone: "teal" | "violet"; arms: number[]; score: string; k: number }) {
  const f = X7_F;
  const [a0, a1] = [angleOf(a), angleOf(b)].sort((p, q) => p - q);
  const ta: XY = [arms[0], arms[1]];
  const tb: XY = [arms[2], arms[3]];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg viewBox={`0 0 ${f.W} ${f.H}`} className="block h-auto w-full max-w-[7rem]" aria-hidden="true">
        <C_Sheet f={f} />
        <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(5.2)}M${f.sx(0)} ${f.sy(0)}V${f.sy(5.2)}`} stroke="#0f1b2d" strokeOpacity={0.25} />
        {k >= 1 && <path d={`M${f.sx(0)} ${f.sy(0)}L${arcAt(f, a0, a1, 4.2).slice(1)}Z`} fill="#f59e0b" fillOpacity={0.35} stroke="#b45309" strokeWidth={1} className={FADE} />}
        <Arrow f={f} from={O} to={ta} tone={tone} w={2.4} />
        <Arrow f={f} from={O} to={tb} tone={tone} w={1.6} dashed />
      </svg>
      <b key={score} className={`${FADE} font-mono`}>
        {score}
      </b>
    </div>
  );
}

export function SameWedge() {
  const s = useScene(3, [600, 1700, 2200]);
  const k = s.k;
  const even = k >= 2;
  const at = (v: XY): XY => (even ? [(4.6 * v[0]) / len(v), (4.6 * v[1]) / len(v)] : v);
  const arms = useTween([...at(MAMA), ...at(BEAN), ...at(MAMI), ...at(TITANIC)], 800);

  return (
    <Scene scene={s} caption={say(k, X7_SAY)}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-0.5 text-center text-xs font-semibold text-cat-teal">মামা, Mr. Bean</div>
          <X7Pair a={MAMA} b={BEAN} tone="teal" arms={arms.slice(0, 4)} score={k >= 3 ? "0.991" : "5.34"} k={k} />
        </div>
        <div>
          <div className="mb-0.5 text-center text-xs font-semibold text-cat-violet">মামী, Titanic</div>
          <X7Pair a={MAMI} b={TITANIC} tone="violet" arms={arms.slice(4, 8)} score={k >= 3 ? "0.991" : "4.09"} k={k} />
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A figure for screen 7's explanation, no task: the mirror as numbers.
//      Swap মামা's two slots and (2, 5) becomes Titanic (5, 2); swap Mr. Bean's
//      and (1, 4) becomes মামী (4, 1). One couple is the other in a mirror.

const X7M_SAY = [
  "এক জোড়া: মামা (2, 5) আর Mr. Bean (1, 4)।",
  "মামার দুই ঘর অদলবদল করলাম: (5, 2)। এটা তো Titanic।",
  "Mr. Bean-এর দুই ঘর অদলবদল: (4, 1)। এটা মামী।",
  "মানে এক জোড়া আরেক জোড়ার আয়নার ছবি। আয়নায় কোণ বদলায় না, তাই cosine-ও একই।",
];

function X7Swap({ name, v, flipped, becomes }: { name: string; v: XY; flipped: boolean; becomes: string }) {
  const slot = (n: number, dir: 1 | -1) => (
    <span
      style={{ transform: flipped ? `translateX(${dir * 3}ch)` : "none" }}
      className="inline-block w-[1ch] text-center transition-transform duration-700 ease-in-out motion-reduce:transition-none"
    >
      {n}
    </span>
  );
  return (
    <div className="grid grid-cols-[4.5rem_auto_1fr] items-center gap-2">
      <span className="text-sm text-cat-teal">{name}</span>
      <span className="font-mono text-lg font-bold">
        ({slot(v[0], 1)}, {slot(v[1], -1)})
      </span>
      <span className="min-h-6 text-sm">{flipped && <span className={`${FADE} font-semibold text-cat-violet`}>= {becomes}</span>}</span>
    </div>
  );
}

export function MirrorSlots() {
  const s = useScene(3, [600, 1800, 1800]);
  const k = s.k;

  return (
    <Scene scene={s} caption={say(k, X7M_SAY)}>
      <div className="mx-auto grid max-w-[16rem] gap-2">
        <X7Swap name="মামা" v={MAMA} flipped={k >= 1} becomes="Titanic" />
        <X7Swap name="Mr. Bean" v={BEAN} flipped={k >= 2} becomes="মামী" />
        <div className="min-h-7 text-center">
          {k >= 3 && (
            <span className={`${POP} inline-block rounded-lg bg-accent/10 px-2 py-0.5 text-sm`}>
              আয়নায় কোণ একই, দুই জোড়াই <b className="font-mono">0.991</b>
            </span>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · A figure for the review check's explanation, no task: সামিন (1, 3) with
//     b and c. Box 10 and 11 is nearly a tie; cosine 0.707 and 0.965 is a
//     clear gap.

const X8_SAY = [
  "সামিন (1, 3), হাতে দুইটা ছবি: b = (4, 2), c = (2, 3)।",
  "box-এ 10 বনাম 11, প্রায় হাড্ডাহাড্ডি।",
  "Cosine-এ 0.707 বনাম 0.965, ফারাকটা স্পষ্ট।",
  "b 45° দূরে, c প্রায় 15°। দিন c।",
];

function X8Bars({ title, rows, max }: { title: string; rows: [string, number, string][]; max: number }) {
  return (
    <div className={`${FADE} grid gap-1`}>
      <div className="text-xs font-semibold text-muted">{title}</div>
      {rows.map(([n, v, t]) => (
        <div key={n} className="grid grid-cols-[1rem_1fr_2.8rem] items-center gap-1.5">
          <span className="font-mono text-sm">{n}</span>
          <div className="h-3 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-cat-blue" style={{ width: `${(v / max) * 100}%` }} />
          </div>
          <span className="text-right font-mono text-sm font-bold">{t}</span>
        </div>
      ))}
    </div>
  );
}

export function BoxVsCos() {
  const s = useScene(3, [600, 1800, 2000]);
  const k = s.k;

  return (
    <Scene scene={s} caption={say(k, X8_SAY)}>
      <div className="mx-auto grid min-h-[7rem] max-w-xs content-start gap-2">
        {k >= 1 && (
          <X8Bars
            title="box"
            max={11}
            rows={[
              ["b", 10, "10"],
              ["c", 11, "11"],
            ]}
          />
        )}
        {k >= 2 && (
          <X8Bars
            title="cosine"
            max={1}
            rows={[
              ["b", 0.707, "0.707"],
              ["c", 0.965, "0.965"],
            ]}
          />
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for the last screen, no task: next morning মামা and
//      মামী, 0.991 each, make the tea together.

export function TeaForTwo({}: Story) {
  const s = useScene(3, [600, 1800, 2000]);
  const k = s.k;
  const near = k >= 2;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সকালে মামা আর মামী, দুইজনেরই cosine 0.991। দুইজন একসাথে চা বানাচ্ছেন।">
        <rect x={130} y={112} width={60} height={6} rx={2} fill="#92400e" />
        <path d="M136 118V150M184 118V150" stroke="#78350f" strokeWidth={3} />
        <path d="M150 112q0 -14 10 -14t10 14Z" fill="#e11d48" />
        <path d="M170 106q7 -2 8 -8" fill="none" stroke="#e11d48" strokeWidth={2} />
        <rect x={157} y={95} width={6} height={3} rx={1} fill="#be123c" />
        <rect x={136} y={104} width={9} height={8} rx={1.5} fill="white" stroke="#94a3b8" strokeWidth={0.8} />
        <rect x={177} y={104} width={9} height={8} rx={1.5} fill="white" stroke="#94a3b8" strokeWidth={0.8} />
        {k >= 3 && (
          <>
            <Draw d="M140 101q-3 -5 0 -9t0 -9" strokeWidth={1.3} ms={900} className="stroke-[#94a3b8]" />
            <Draw d="M181 101q-3 -5 0 -9t0 -9" strokeWidth={1.3} ms={900} delay={200} className="stroke-[#94a3b8]" />
          </>
        )}
        <Person who="mama" x={near ? 112 : 64} y={C_Y} walking={k === 2} ms={1500} mood={k >= 3 ? "happy" : "plain"} arm={k >= 3 ? "hold" : "down"} label />
        <Person who="mami" x={near ? 208 : 256} y={C_Y} facing={-1} walking={k === 2} ms={1500} mood={k >= 3 ? "happy" : "plain"} arm={k >= 3 ? "hold" : "down"} label />
        {k === 1 && (
          <>
            <CastCard x={64} y={C_Y - 78} text="0.991" tone="teal" />
            <text x={160} y={C_Y - 74} textAnchor="middle" fontSize={14} fontWeight={700} fill={C_INK} className={FADE}>
              =
            </text>
            <CastCard x={256} y={C_Y - 78} text="0.991" tone="coral" />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9b · A story scene for the last screen's teaser, no task: গুণ টানা. Two
//      boatmen walk the bank pulling the boat on a long rope; মাঝি চাচা says a
//      longer rope wastes less pull; ফাহিম, on the boat, wonders why. Whether
//      it's true is the next journey's question, so the scene stops there.

const S9_BANK = 124;
const S9_DX = 44;

export function GunTana({}: Story) {
  const s = useScene(3, [600, 2400, 2600]);
  const k = s.k;
  const dx = k >= 1 ? S9_DX : 0;
  const pull = k === 1;
  const glide = { transform: `translateX(${dx}px)`, transitionDuration: "2200ms" };

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={108} label="নদীর পাড় ধরে দুইজন মাঝি লম্বা দড়িতে নৌকা টানছেন, গুণ টানা। মাঝি চাচা বলেন, দড়ি যত লম্বা, টান তত কম নষ্ট। নৌকায় ফাহিমের খটকা লাগে।">
        <rect y={132} width={320} height={48} fill="#60a5fa" />
        <path d="M0 132H320" stroke="#3b82f6" strokeWidth={1.5} />
        <path d="M20 150q10 -3 20 0M120 166q10 -3 20 0M250 158q10 -3 20 0" fill="none" stroke="#dbeafe" strokeWidth={1.2} />
        <g style={glide} className="transition-transform ease-in-out motion-reduce:transition-none">
          <path d="M22 148H94l-10 12H32Z" fill="#78350f" />
          <path d="M72 148V104" stroke="#44403c" strokeWidth={2} />
          <path d={`M72 106L193 ${S9_BANK - 33}L233 ${S9_BANK - 33}`} fill="none" stroke="#a16207" strokeWidth={1.2} />
          <text x={196} y={S9_BANK + 10} textAnchor="middle" fontSize={8} fontWeight={700} fill={C_INK}>
            মাঝি চাচা
          </text>
        </g>
        <Person who="fahim" x={38 + dx} y={148} scale={0.7} ms={2200} mood={k >= 3 ? "puzzled" : "plain"} />
        <Person who="karim" x={196 + dx} y={S9_BANK} scale={0.85} walking={pull} ms={2200} arm="hold" />
        <Person who="karim" x={236 + dx} y={S9_BANK} scale={0.85} walking={pull} ms={2200} arm="hold" />
        {k === 2 && <Bubble x={196 + dx} y={S9_BANK - 58} lines={["দড়ি যত লম্বা,", "টান তত কম নষ্ট।"]} />}
        {k >= 3 && <Bubble x={38 + dx} y={148 - 46} side="right" tone="think" lines={["টান তো টানই, দড়ি", "লম্বা হলে কী আসে যায়?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  WhoFits: { start: {}, bet: { bet: 0 } },
  LoudPerson: { start: {}, measured: { measured: [0, 1] }, doubled: { measured: [0, 1], doubled: true } },
  RunBackwards: { start: {}, tilted: { cut: [0], tilt: 1 }, done: { cut: [0, 1], tried: true } },
  ScaleCard: { start: {}, some: { deg: 60, hit: [0, 1] }, all: { deg: 180, hit: [0, 1, 2, 3] } },
  LastDivide: { start: {}, done: { k: 2 } },
  NanuCard: { start: {}, ran: { ran: true }, got: { ran: true, got: true } },
  VerdictCos: { start: {}, miss: { done: 1, miss: 1 }, both: { done: 2 }, mirror: { done: 2, mirror: true } },
  // the animations shoot fully played; `k` seeds a beat part-way through
  RoofStick: { start: { k: 0 }, formula: { k: 2 }, done: {} },
  RemoteFight: { start: { k: 0 }, cards: { k: 1 }, phone: { k: 2 }, done: {} },
  WhatsInScore: { start: { k: 0 }, film: { k: 3 }, done: {} },
  LoudFilmAgain: { start: { k: 0 }, doubled: { k: 1 }, done: {} },
  LoudSofa: { loud: { k: 1 }, mami: { k: 2 }, done: {} },
  VoiceInScore: { start: { k: 0 }, doubled: { k: 2 }, done: {} },
  ShaveLengths: { start: { k: 0 }, one: { k: 1 }, done: {} },
  NoProtractor: { start: { k: 0 }, crossed: { k: 2 }, done: {} },
  UnevenScale: { start: { k: 0 }, threads: { k: 1 }, done: {} },
  ShadowCap: { start: { k: 0 }, flat: { k: 1 }, back: { k: 3 }, done: {} },
  SquareUp: { start: { k: 0 }, tiles: { k: 1 }, done: {} },
  WasItWrong: { ask: { k: 1 }, answer: { k: 2 }, done: {} },
  SameOrder: { start: { k: 0 }, divided: { k: 1 }, two: { k: 2 }, done: {} },
  NanuComes: { start: { k: 0 }, ask: { k: 2 }, done: {} },
  ShrinkToNothing: { start: { k: 0 }, gone: { k: 3 }, done: {} },
  NanRanking: { start: { k: 0 }, one: { k: 1 }, all: { k: 2 }, done: {} },
  SameWedge: { start: { k: 0 }, even: { k: 2 }, done: {} },
  MirrorSlots: { start: { k: 0 }, one: { k: 1 }, done: {} },
  BoxVsCos: { box: { k: 1 }, done: {} },
  TeaForTwo: { start: { k: 0 }, cards: { k: 1 }, done: {} },
  GunTana: { start: { k: 0 }, chacha: { k: 2 }, done: {} },
};
