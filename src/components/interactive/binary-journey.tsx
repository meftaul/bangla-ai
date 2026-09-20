"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  FADE,
  Nope,
  POP,
  Speech,
  predictLook,
  primaryBtn,
  quietBtn,
  useCountUp,
  usePlay,
  useSeed,
  type Fixtures,
} from "@/components/journey/kit";
import { bn } from "./figure-kit";

// Screens for "Math for AI 1.2 — বাইনারি", told as a Journey.
//
// The route is twenty questions. Shom's party trick names any number from 0 to
// 31 in five yes/no questions, because each question throws away half of what
// is left: 32 → 16 → 8 → 4 → 2 → 1. So one more question handles twice as many
// numbers (eight questions, 256). Then the turn: from the answers alone the
// number comes back, because every "yes" means "skip the lower half", and the
// lower half holds 16, then 8, 4, 2, 1 numbers. Those skips are the place
// values; write yes as 1 and no as 0 and the answer row is the number in
// binary. A wire can give exactly one such answer (current or none — half a
// current reads as nothing), so a computer keeps numbers as rows of answers,
// and eight of them are the 0–255 of a pixel's brightness.
//
// Tailwind only; SVG/DOM so the Bangla labels shape.

const N = 32;
const Q = 5;
/** How many numbers question i (0-based) skips on a "yes", out of `total`. */
const halfAt = (i: number, total = N) => total >> (i + 1);
/** Where a row of answers has narrowed 0…total−1 down to. */
const windowOf = (answers: number[], total = N) => {
  const lo = answers.reduce((a, b, i) => a + b * halfAt(i, total), 0);
  return { lo, hi: lo + (total >> answers.length) - 1 };
};
const binary = (n: number, k: number) => n.toString(2).padStart(k, "0");
const placesOf = (k: number) => Array.from({ length: k }, (_, j) => 1 << (k - 1 - j));

function Shom(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="সোম" initial="সো" tint="teal" {...props} />;
}

// ---------------------------------------------------------------------------
// The numbers 0–31 as a strip. The live window stays coloured; while a question
// is open, its "yes" half is tinted so the reader can see what yes would keep.

const CW = 10;

function Strip({ lo, hi, split = false, mark }: { lo: number; hi: number; split?: boolean; mark?: number | null }) {
  const mid = lo + (hi - lo + 1) / 2;
  return (
    <div className="mx-auto my-4 w-full max-w-md">
      <svg viewBox={`0 0 ${N * CW} 58`} role="img" aria-label={`${lo} থেকে ${hi}`} className="block h-auto w-full">
        {Array.from({ length: N }, (_, i) => {
          const live = i >= lo && i <= hi;
          const yes = split && i >= mid && live;
          return (
            <rect
              key={i}
              x={i * CW + 1}
              y={20}
              width={CW - 2}
              height={16}
              rx={2}
              className={`transition-[fill] duration-500 motion-reduce:transition-none ${
                !live ? "fill-foreground/10" : yes ? "fill-cat-violet" : "fill-cat-teal"
              }`}
            />
          );
        })}
        {mark != null && (
          <path d={`M${mark * CW + CW / 2} 16l-4-7h8z`} className="fill-foreground transition-transform duration-500" />
        )}
        {lo === hi ? (
          <text x={Math.min(Math.max(lo * CW + CW / 2, 10), N * CW - 10)} y={52} textAnchor="middle" className="fill-foreground text-[11px] font-bold">
            {bn(lo)}
          </text>
        ) : (
          <>
            <text x={lo * CW + 1} y={52} textAnchor="start" className="fill-muted text-[11px]">
              {bn(lo)}
            </text>
            <text x={(hi + 1) * CW - 1} y={52} textAnchor="end" className="fill-muted text-[11px]">
              {bn(hi)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * A row of answer boxes. `digits` writes 1/0 instead of হ্যাঁ/না; `worth`
 * puts a label above a box; `cur` rings the box being worked on.
 */
function Answers({
  items,
  digits = false,
  worth,
  cur,
}: {
  items: (number | undefined)[];
  digits?: boolean;
  worth?: (i: number) => string | undefined;
  cur?: number;
}) {
  return (
    <div className="flex justify-center gap-1.5" role="list" aria-label="উত্তরের সারি">
      {items.map((a, i) => (
        <div key={i} role="listitem" className="flex w-13 flex-col items-center gap-1">
          <span className="h-4 font-mono text-xs text-muted">{worth?.(i) ?? ""}</span>
          <span
            className={`grid h-11 w-full place-items-center rounded-lg border-2 font-bold transition-colors duration-300 ${
              a === undefined
                ? "border-dashed border-border text-muted"
                : a
                  ? "border-cat-violet bg-cat-violet/15 text-cat-violet"
                  : "border-cat-teal/60 bg-cat-teal/10 text-cat-teal"
            } ${cur === i ? "ring-2 ring-foreground/60 ring-offset-2 ring-offset-surface" : ""} ${digits ? "font-mono text-xl" : ""}`}
          >
            {a === undefined ? "" : digits ? String(a) : a ? "হ্যাঁ" : "না"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Shom's trick, played on the reader: pick a secret number, answer five
//     questions honestly, watch the strip halve down to it.

export function FiveQuestions() {
  const pass = useGate();
  const [secret, setSecret] = useSeed<number | null>("secret", null);
  const [answers, setAnswers] = useSeed<number[]>("answers", []);
  const [miss, setMiss] = useState(0);
  const { lo, hi } = windowOf(answers);
  const done = answers.length === Q;
  const mid = lo + halfAt(answers.length);

  const answer = (a: number) => {
    if (secret === null || done) return;
    const truth = secret >= mid ? 1 : 0;
    if (a !== truth) {
      setMiss((m) => m + 1);
      return;
    }
    const next = [...answers, a];
    setAnswers(next);
    if (next.length === Q) pass("প্রতিটা প্রশ্ন বাকিদের অর্ধেক বাদ দেয়।");
  };

  if (secret === null) {
    return (
      <>
        <div className="mt-4 text-center text-sm font-medium text-muted">মনে মনে একটা সংখ্যা বেছে নিন (সোম দেখছে না)</div>
        <div className="mx-auto mt-3 grid max-w-md grid-cols-8 gap-1.5">
          {Array.from({ length: N }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSecret(i)}
              className="cursor-pointer rounded-lg border border-border py-1.5 font-mono text-sm transition-colors hover:border-cat-violet hover:bg-cat-violet/10"
            >
              {bn(i)}
            </button>
          ))}
        </div>
        <Task done={false}>০ থেকে ৩১-এর মধ্যে যেকোনো একটা সংখ্যায় tap করুন।</Task>
      </>
    );
  }

  return (
    <>
      <div className="mt-3 flex items-center justify-center gap-3 text-sm text-muted">
        <span>
          আপনার গোপন সংখ্যা: <b className="font-mono text-base text-foreground">{bn(secret)}</b>
        </span>
        {answers.length === 0 && (
          <button type="button" onClick={() => setSecret(null)} className={quietBtn}>
            বদলান
          </button>
        )}
      </div>
      <Strip lo={lo} hi={hi} split={!done} mark={secret} />
      <div className="text-center text-sm text-muted">
        বাকি আছে <b className="text-foreground">{bn(hi - lo + 1)}</b>টা সংখ্যা · প্রশ্ন হয়েছে {bn(answers.length)}টা
      </div>
      {done ? (
        <Shom tone="good">তোর সংখ্যা {bn(lo)}! ঠিক বললাম না?</Shom>
      ) : (
        <>
          <Shom key={answers.length}>
            প্রশ্ন {bn(answers.length + 1)}: তোর সংখ্যাটা কি <b>{bn(mid)}</b> বা তার বেশি?
          </Shom>
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => answer(1)} className={primaryBtn}>
              হ্যাঁ
            </button>
            <button type="button" onClick={() => answer(0)} className={primaryBtn}>
              না
            </button>
          </div>
          {miss > 0 && <Nope key={miss}>উঁহু, আপনার সংখ্যা {bn(secret)}। সত্যি উত্তর না দিলে ম্যাজিক কাজ করবে না!</Nope>}
        </>
      )}
      <div className="mt-4">
        <Answers items={Array.from({ length: Q }, (_, i) => answers[i])} />
      </div>
      <Task done={done}>সোমের পাঁচটা প্রশ্নের সত্যি উত্তর দিন ({bn(answers.length)}/{bn(Q)})</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · A thousand people. Guess the number of questions, then watch 1000 halve.

const HOW_OPTIONS = [10, 32, 100, 500];
const HOW_RIGHT = 0;
const LADDER = [1000, 500, 250, 125, 63, 32, 16, 8, 4, 2, 1];

export function HowMany() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [done, setDone] = useSeed("done", false);
  const run = usePlay(280);
  const k = done ? LADDER.length - 1 : run.k;
  const over = guess !== null && k === LADDER.length - 1;

  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    run.play(LADDER.length - 1, () => {
      setDone(true);
      pass("একটা প্রশ্ন বাড়লে পাল্লা দ্বিগুণ।");
    });
  };

  return (
    <>
      <div className="text-sm font-medium text-muted">১০০০ জনের মধ্যে একজনকে খুঁজতে কয়টা হ্যাঁ/না প্রশ্ন লাগবে?</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {HOW_OPTIONS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, HOW_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
            <span className="font-mono text-lg">{bn(o)}টা</span>
          </Choice>
        ))}
      </div>

      {guess !== null && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
          {LADDER.slice(0, k + 1).map((c, i) => (
            <span key={i} className={`inline-flex items-center gap-1 ${POP}`}>
              {i > 0 && <span className="text-xs text-muted">→</span>}
              <span
                className={`rounded-lg border-2 px-2 py-0.5 font-mono text-base ${
                  c === 1 ? "border-accent bg-accent/10 font-bold text-accent-text" : "border-border"
                }`}
              >
                {bn(c)}
              </span>
            </span>
          ))}
        </div>
      )}
      {guess !== null && <div className="mt-2 text-center text-sm text-muted">প্রশ্ন হলো {bn(k)}টা</div>}

      {over && (
        <div className={`${FADE} mx-auto mt-4 grid max-w-xs grid-cols-2 gap-x-6 gap-y-1 text-[0.95rem]`}>
          {[
            [1, 2],
            [2, 4],
            [3, 8],
            [5, 32],
            [8, 256],
            [10, 1024],
          ].map(([q, c]) => (
            <div key={q} className="contents">
              <span className="text-right text-muted">{bn(q)}টা প্রশ্নে</span>
              <b className="font-mono">{bn(c)}টা সংখ্যা</b>
            </div>
          ))}
        </div>
      )}
      <Task done={over}>আগে guess করুন, তারপর ১০০০ অর্ধেক হতে হতে কোথায় থামে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Only the answers. Replay Shom's questions one answer at a time; each
//     "yes" skips the lower half and banks how many numbers it skipped.

const SHOM_ROW = [1, 0, 1, 1, 0];

export function RowToNumber() {
  const pass = useGate();
  const [step, setStep] = useSeed("step", 0);
  const applied = SHOM_ROW.slice(0, step);
  const { lo, hi } = windowOf(applied);
  const total = applied.reduce((a, b, i) => a + b * halfAt(i), 0);
  const done = step === Q;

  const next = () => {
    const s = step + 1;
    setStep(s);
    if (s === Q) pass("প্রতিটা হ্যাঁ তার দামটা জমা করে।");
  };

  return (
    <>
      <div className="mt-2">
        <Answers items={SHOM_ROW} cur={done ? undefined : step} worth={(i) => (i < step ? (SHOM_ROW[i] ? `+${bn(halfAt(i))}` : "+০") : undefined)} />
      </div>
      <Strip lo={lo} hi={hi} split={!done} />

      <div className="mx-auto grid max-w-md grid-cols-[auto_1fr_auto_auto] items-center gap-x-3 gap-y-1.5 text-[0.93rem]">
        <span className="text-xs text-muted">প্রশ্ন</span>
        <span className="text-xs text-muted">সোম জিজ্ঞেস করেছিল</span>
        <span className="text-xs text-muted">উত্তর</span>
        <span className="text-right text-xs text-muted">জমা</span>
        {applied.map((a, i) => {
          const w = windowOf(SHOM_ROW.slice(0, i));
          return (
            <div key={i} className={`contents ${FADE}`}>
              <span className="font-mono">{bn(i + 1)}</span>
              <span>
                {bn(w.lo + halfAt(i))} বা বেশি? <span className="text-xs text-muted">(বাঁয়ে {bn(halfAt(i))}টা)</span>
              </span>
              <b className={a ? "text-cat-violet" : "text-cat-teal"}>{a ? "হ্যাঁ" : "না"}</b>
              <span className="text-right font-mono">{a ? `+${bn(halfAt(i))}` : "+০"}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center font-mono text-2xl">
        জমা: <b key={total} className={done ? "win-pop text-accent-text" : ""}>{bn(total)}</b>
      </div>
      {!done && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={next} className={primaryBtn}>
            উত্তর {bn(step + 1)} খাটান
          </button>
        </div>
      )}
      <Task done={done}>সোমের উত্তরগুলো একটা একটা করে খাটিয়ে সংখ্যাটা বের করুন ({bn(step)}/{bn(Q)})</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The other way round: build a number's answer row yourself.

const BUILD = [13, 25, 31];

export function BuildRow() {
  const pass = useGate();
  const [n, setN] = useSeed("n", 0);
  const [k, setK] = useSeed("k", 0);
  const target: number | undefined = BUILD[k];
  const places = placesOf(Q);
  const lit = places.filter((w) => n & w);

  const toggle = (w: number) => {
    const v = n ^ w;
    setN(v);
    if (target !== undefined && v === target) {
      setK(k + 1);
      if (k + 1 === BUILD.length) pass("প্রতিটা সংখ্যা লেখার উপায় একটাই।");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {BUILD.map((t, i) => (
          <span
            key={t}
            className={`rounded-full border-2 px-3.5 py-1 font-mono text-lg font-semibold transition-colors duration-300 ${
              i < k ? "border-accent bg-accent/10 text-accent-text" : i === k ? "border-foreground" : "border-border text-muted"
            }`}
          >
            {i < k ? "✓ " : ""}
            {bn(t)}
          </span>
        ))}
      </div>
      <div className="my-5 flex justify-center gap-1.5">
        {places.map((w) => {
          const on = (n & w) !== 0;
          return (
            <button
              key={w}
              type="button"
              aria-pressed={on}
              aria-label={`${w}-এর ঘর`}
              onClick={() => toggle(w)}
              className="flex w-13 cursor-pointer flex-col items-center gap-1"
            >
              <span className="font-mono text-xs text-muted">{bn(w)}</span>
              <span
                className={`grid h-12 w-full place-items-center rounded-lg border-2 font-mono text-2xl font-bold transition-colors duration-200 ${
                  on ? "border-cat-violet bg-cat-violet/15 text-cat-violet" : "border-cat-teal/60 bg-cat-teal/10 text-cat-teal"
                }`}
              >
                {on ? 1 : 0}
              </span>
            </button>
          );
        })}
      </div>
      <div className="text-center font-mono text-xl text-muted">
        {lit.length ? lit.map((w) => bn(w)).join(" + ") : "০"} = <b className="text-foreground">{bn(n)}</b>
      </div>
      <Task done={k >= BUILD.length}>
        {target !== undefined ? (
          <>
            ঘরগুলোতে tap করে 1 আর 0 বসিয়ে <b className="font-mono">{bn(target)}</b> বানান।
          </>
        ) : (
          "তিনটাই বানিয়ে ফেলেছেন!"
        )}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · One wire, one answer. Full current reads 1, none reads 0, and anything
//     in between flickers — the machine can't trust it.

type Zone = "low" | "mid" | "high";
const zoneOf = (v: number): Zone => (v <= 20 ? "low" : v >= 80 ? "high" : "mid");

export function OneWire() {
  const pass = useGate();
  const [v, setV] = useSeed("v", 0);
  const [seen, setSeen] = useSeed<Zone[]>("seen", ["low"]);
  const [flick, setFlick] = useState(0);
  const zone = zoneOf(v);

  useEffect(() => {
    if (zone !== "mid") return;
    const t = setInterval(() => setFlick((f) => f + 1), 380);
    return () => clearInterval(t);
  }, [zone]);

  const change = (x: number) => {
    setV(x);
    const z = zoneOf(x);
    if (!seen.includes(z)) {
      const s = [...seen, z];
      setSeen(s);
      if (s.length === 3) pass("তার শুধু বলে: কারেন্ট আছে, নাকি নাই।");
    }
  };

  const read = zone === "low" ? "0" : zone === "high" ? "1" : flick % 2 ? "1" : "0";

  return (
    <>
      <div className="mx-auto my-5 flex max-w-sm items-center gap-3">
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-foreground/15">
          <div
            className="absolute inset-0 bg-cat-amber shadow-[0_0_12px_var(--color-cat-amber)]"
            style={{ opacity: v / 100 }}
          />
        </div>
        <div
          className={`grid size-16 place-items-center rounded-xl border-2 font-mono text-3xl font-bold ${
            zone === "mid" ? "border-danger/60 bg-danger/5 text-danger" : "border-accent/50 bg-accent/5 text-accent-text"
          }`}
        >
          {read}
        </div>
      </div>
      <div className="text-center text-sm text-muted">
        {zone === "mid" ? "মেশিন একবার পড়ছে 1, একবার 0 — কোনটা ঠিক, জানে না।" : `মেশিন নিশ্চিত হয়ে পড়ছে ${read}।`}
      </div>
      <div className="mx-auto mt-4 w-full max-w-sm">
        <input
          type="range"
          min={0}
          max={100}
          value={v}
          aria-label="তারে কতটা কারেন্ট"
          onChange={(e) => change(Number(e.target.value))}
          className="block w-full cursor-pointer accent-accent"
        />
        <div className="mt-0.5 flex justify-between text-xs text-muted">
          <span>কারেন্ট নাই</span>
          <span>পুরো কারেন্ট</span>
        </div>
      </div>
      <Task done={seen.length === 3}>
        কারেন্ট একবার পুরো দিন, আর একবার মাঝামাঝি রেখে দেখুন ({bn(seen.length)}/৩)
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Eight wires, 128 down to 1, and the grey they stand for.

function Wires({ n, onToggle }: { n: number; onToggle?: (w: number) => void }) {
  return (
    <div className="mx-auto grid max-w-md grid-cols-8 gap-1">
      {placesOf(8).map((w) => {
        const on = (n & w) !== 0;
        const box = (
          <>
            <span className="font-mono text-[0.65rem] text-muted sm:text-xs">{w}</span>
            <span
              className={`grid h-10 w-full place-items-center rounded-md border-2 font-mono text-lg font-bold transition-colors duration-200 ${
                on ? "border-cat-violet bg-cat-violet/15 text-cat-violet" : "border-cat-teal/60 bg-cat-teal/10 text-cat-teal"
              }`}
            >
              {on ? 1 : 0}
            </span>
          </>
        );
        return onToggle ? (
          <button key={w} type="button" aria-pressed={on} aria-label={`${w}-এর তার`} onClick={() => onToggle(w)} className="flex cursor-pointer flex-col items-center gap-1">
            {box}
          </button>
        ) : (
          <div key={w} className="flex flex-col items-center gap-1">
            {box}
          </div>
        );
      })}
    </div>
  );
}

function Swatch({ n }: { n: number }) {
  return (
    <div
      aria-hidden="true"
      className="mx-auto size-20 rounded-xl ring-1 ring-foreground/20 transition-colors duration-200 motion-reduce:transition-none"
      style={{ backgroundColor: `rgb(${n}, ${n}, ${n})` }}
    />
  );
}

export function EightWires() {
  const pass = useGate();
  const [n, setN] = useSeed("n", 0);

  const toggle = (w: number) => {
    const v = n ^ w;
    setN(v);
    if (v === 255) pass("আটটা হ্যাঁ-না মানে ২৫৬টা ধাপ।");
  };

  return (
    <>
      <div className="my-5">
        <Wires n={n} onToggle={toggle} />
      </div>
      <div className="flex items-center justify-center gap-5">
        <Swatch n={n} />
        <div>
          <div className="font-mono text-sm tracking-widest text-muted">{binary(n, 8)}</div>
          <div key={n === 255 ? "full" : "not"} className={`font-mono text-4xl font-bold ${n === 255 ? "win-pop text-accent-text" : ""}`}>
            {n}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => setN(0)} className={quietBtn}>
          ↺ সব 0
        </button>
      </div>
      <Task done={n === 255}>ঘরটাকে একদম সাদা বানান — আটটা উত্তর কী হতে হবে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Last picture: eight answers counting 0 to 255, black to white.

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const n = useCountUp(255, 28);
  return (
    <>
      <div className="my-5">
        <Wires n={n} />
      </div>
      <div className="flex items-center justify-center gap-5">
        <Swatch n={n} />
        <div className="font-mono text-4xl font-bold tabular-nums">{n}</div>
      </div>
      {n === 255 && (
        <div className={`${FADE} mt-3 text-center`}>
          <div className="text-muted">২৫৬টা উত্তরের সারি — 0 থেকে 255</div>
          <button
            type="button"
            onClick={onReplay}
            className="mt-3 cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            ↺ আবার দেখুন
          </button>
        </div>
      )}
    </>
  );
}

export function Finale() {
  const [run, setRun] = useSeed("run", 0);
  return <FinaleReel key={run} onReplay={() => setRun(run + 1)} />;
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  FiveQuestions: {
    start: {},
    picked: { secret: 22 },
    two: { secret: 22, answers: [1, 0] },
    done: { secret: 22, answers: [1, 0, 1, 1, 0] },
  },
  HowMany: { start: {}, done: { guess: 0, done: true } },
  RowToNumber: { start: {}, three: { step: 3 }, done: { step: 5 } },
  BuildRow: { start: {}, mid: { n: 13, k: 1 }, done: { n: 31, k: 3 } },
  OneWire: { start: {}, mid: { v: 50, seen: ["low", "mid"] }, done: { v: 100, seen: ["low", "mid", "high"] } },
  EightWires: { start: {}, grey: { n: 150 }, full: { n: 255 } },
  Finale: { start: {} },
};
