"use client";

import { useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Speech, predictLook, primaryBtn, quietBtn, useCountUp, usePlay, useTween } from "@/components/journey/kit";
import { bn } from "./figure-kit";
import { CELL_TONES, gray } from "./pixel-art";

// Screens for "Math for AI 1.4 — Vector", told as a Journey.
//
// Sports week, and the PT teacher wants every student's height and weight. The
// reader measures three classmates on a wall strip and a floor scale, writes
// them down in full sentences, and is talked into keeping only the numbers.
// Then one pair gets written the wrong way round, and the same two numbers
// turn Nasib into someone 78 cm tall and 180 kg heavy — so an order gets
// agreed, and the units drop off because the slot already says what a number
// is. A new boy with Shom's exact height, weight and shoe size forces a fourth
// feature. Only then the names: vector, v₁ … v₄, dimension, feature — and
// Rafi's 64-number bird from 1.1 unrolls into one line to show it was a vector
// all along.
//
// The students are drawn from their own two numbers (Person), so a swapped
// pair is not described, it is seen. Tailwind only, on the site's theme
// tokens; SVG/DOM rather than canvas, so the Bangla labels shape.

type Kid = {
  name: string;
  initial: string;
  /** height cm, weight kg, shoe size, age */
  v: number[];
  shirt: string;
  chip: string;
};

const NASIB: Kid = { name: "নাসিব", initial: "না", v: [180, 78, 43, 18], shirt: "fill-cat-blue", chip: "bg-cat-blue/15 text-cat-blue" };
const SAMIN: Kid = { name: "সামিন", initial: "সা", v: [170, 60, 41, 17], shirt: "fill-cat-coral", chip: "bg-cat-coral/15 text-cat-coral" };
const SHOM: Kid = { name: "সোম", initial: "সো", v: [175, 75, 42, 19], shirt: "fill-cat-teal", chip: "bg-cat-teal/15 text-cat-teal" };
// Shom to the centimetre and the kilo, and the same shoe size too: only the
// age tells them apart. Screen 5 depends on that.
const TANVIR: Kid = { name: "তানভীর", initial: "তা", v: [175, 75, 42, 17], shirt: "fill-cat-violet", chip: "bg-cat-violet/15 text-cat-violet" };
const KIDS = [NASIB, SAMIN, SHOM];
const CLASS = [...KIDS, TANVIR];

const FEATURE = ["height", "weight", "জুতার size", "বয়স"];
const SUB = "₀₁₂₃₄₅₆₇₈₉";
const vName = (i: number) => `v${String(i + 1).replace(/\d/g, (d) => SUB[Number(d)])}`;
const tuple = (v: (number | string)[]) => `(${v.join(", ")})`;

// ---------------------------------------------------------------------------
// Motion. (useTween, the eased glide between numbers, lives in journey/kit.)

/** grow up out of the floor, feet first */
const GROW =
  "origin-bottom [transform-box:fill-box] transition-[scale,opacity] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none starting:scale-y-0 starting:opacity-0";

// ---------------------------------------------------------------------------
// A student, drawn from two numbers. One stage unit is one centimetre.

/** the floor */
const G = 228;
const STAGE_W = 260;
const STAGE_H = 244;
/** the measuring strip's left edge */
const RX = 24;
/** where the student stands */
const PX = 134;

function Person({ cx, h, w, shirt = "fill-cat-blue", ghost = false }: { cx: number; h: number; w: number; shirt?: string; ghost?: boolean }) {
  const r = 6 + h * 0.03;
  // The same kilos on a shorter frame spread wider: cross-section ∝ weight / height.
  const bw = 70 * Math.sqrt(w / h);
  const neck = G - h + 2 * r - 1;
  const hip = G - (G - neck) * 0.42;
  const leg = Math.max(3, bw * 0.3);
  const paint = (c: string) => (ghost ? undefined : c);
  return (
    <g
      strokeWidth={ghost ? 1.2 : 0}
      strokeDasharray={ghost ? "3 3" : undefined}
      className={ghost ? "fill-none stroke-muted" : undefined}
    >
      <rect x={cx - bw * 0.36} y={hip - 4} width={leg} height={G - hip + 4} rx={leg / 2} className={paint("fill-foreground/70")} />
      <rect x={cx + bw * 0.36 - leg} y={hip - 4} width={leg} height={G - hip + 4} rx={leg / 2} className={paint("fill-foreground/70")} />
      <rect x={cx - bw / 2} y={neck} width={bw} height={hip - neck} rx={Math.min(bw, hip - neck) * 0.38} className={paint(shirt)} />
      <circle cx={cx} cy={G - h + r} r={r} className={paint("fill-[#e0aa80]")} />
      {!ghost && (
        <>
          <circle cx={cx - r * 0.38} cy={G - h + r * 0.95} r={Math.max(0.9, r * 0.13)} className="fill-[#2b1d14]" />
          <circle cx={cx + r * 0.38} cy={G - h + r * 0.95} r={Math.max(0.9, r * 0.13)} className="fill-[#2b1d14]" />
        </>
      )}
    </g>
  );
}

/** The wall strip, the floor scale, and whoever is standing on it. */
function Stage({
  h,
  w,
  shirt,
  ghost,
  label,
}: {
  h: number;
  w: number;
  shirt?: string;
  /** where the numbers should have put this person, dashed */
  ghost?: [number, number];
  label: string;
}) {
  const on = h >= 2;
  const top = G - h;
  return (
    <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} role="img" aria-label={label} className="mx-auto my-4 block h-auto w-full max-w-sm select-none">
      <rect x={RX} y={G - 205} width={14} height={205} rx={2} strokeWidth={0.8} className="fill-cat-amber/15 stroke-cat-amber/60" />
      {Array.from({ length: 21 }, (_, i) => (
        <line key={i} x1={RX} x2={RX + (i % 5 === 0 ? 9 : 5)} y1={G - i * 10} y2={G - i * 10} strokeWidth={0.7} className="stroke-cat-amber" />
      ))}
      {[50, 100, 150, 200].map((c) => (
        <text key={c} x={RX - 3} y={G - c + 3} textAnchor="end" fontSize={8} className="fill-muted font-mono">
          {c}
        </text>
      ))}
      <line x1={0} x2={STAGE_W} y1={G} y2={G} strokeWidth={1.2} className="stroke-border" />
      <rect x={PX - 36} y={G + 1} width={72} height={8} rx={3} className="fill-foreground/25" />
      {ghost && <Person cx={PX} h={ghost[0]} w={ghost[1]} ghost />}
      {on && <Person cx={PX} h={h} w={w} shirt={shirt} />}
      {on && (
        <>
          <line x1={RX + 52} x2={PX - 4} y1={top} y2={top} strokeWidth={0.9} strokeDasharray="3 2.5" className="stroke-cat-amber" />
          <rect x={RX + 16} y={top - 7.5} width={36} height={15} rx={7.5} className="fill-cat-amber" />
          <text x={RX + 34} y={top + 3} textAnchor="middle" fontSize={8.5} fontWeight={700} className="fill-white font-mono">
            {Math.round(h)} cm
          </text>
        </>
      )}
      <rect x={200} y={G - 36} width={56} height={28} rx={6} strokeWidth={1} className="fill-surface stroke-border" />
      <text x={228} y={G - 26} textAnchor="middle" fontSize={7.5} className="fill-muted">
        ওজন
      </text>
      <text x={228} y={G - 14} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-foreground font-mono">
        {on ? `${Math.round(w)} kg` : "— kg"}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Chrome.

function Face({ kid, small = false }: { kid: Kid; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-bold ${small ? "size-6 text-[0.65rem]" : "size-8 text-xs"} ${kid.chip}`}
    >
      {kid.initial}
    </span>
  );
}

function SirSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="PT স্যার" initial="স্" tint="teal" {...props} />;
}

function SaminSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="সামিন" initial="সা" tint="blue" {...props} />;
}

/**
 * A vector written out: each number in its own box, and under the box what
 * that box means. A box re-pops whenever its number changes.
 */
function Vec({
  v,
  names,
  lead,
  big = false,
  box,
  onPick,
}: {
  v: (number | string)[];
  names?: ReactNode[];
  lead?: ReactNode;
  big?: boolean;
  /** border/background classes per box */
  box?: (i: number) => string;
  onPick?: (i: number) => void;
}) {
  const face = `${POP} inline-block min-w-[2.6ch] rounded-lg border-2 px-2 py-0.5 text-center font-semibold tabular-nums`;
  return (
    <div className={`flex flex-wrap items-start justify-center gap-y-2 font-mono ${big ? "text-xl sm:text-2xl" : "text-lg"}`}>
      {lead ? <span className="mr-1.5 border-2 border-transparent py-0.5 font-semibold sm:mr-2">{lead}</span> : null}
      {v.map((x, i) => (
        <span key={i} className="flex flex-col items-center">
          <span className="flex items-center">
            {i === 0 && <span className="px-0.5 text-muted">(</span>}
            {onPick ? (
              <button
                key={String(x)}
                type="button"
                onClick={() => onPick(i)}
                className={`${face} cursor-pointer transition-colors ${box?.(i) ?? "border-border"}`}
              >
                {x}
              </button>
            ) : (
              <b key={String(x)} className={`${face} transition-colors ${box?.(i) ?? "border-border"}`}>
                {x}
              </b>
            )}
            <span className="px-0.5 text-muted">{i === v.length - 1 ? ")" : ","}</span>
          </span>
          {names ? (
            <span className="mt-1 max-w-[5rem] px-1 text-center font-sans text-xs leading-tight text-muted">{names[i] || " "}</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Sports week. Call each student onto the scale and read the strip.

function Measuring({ kid }: { kid: Kid }) {
  const [h, w] = useTween(kid.v.slice(0, 2), 1100, [0, 0]);
  return <Stage h={h} w={w} shirt={kid.shirt} label={`${kid.name}: ${kid.v[0]} cm, ${kid.v[1]} kg`} />;
}

export function MeasureDay() {
  const pass = useGate();
  const [who, setWho] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const rec = usePlay(1200);

  const call = (i: number) => {
    setWho(i);
    // A later click restarts the timer and replaces this callback, so `done`
    // here is still the newest list when it fires.
    rec.play(1, () => {
      if (done.includes(i)) return;
      const d = [...done, i];
      setDone(d);
      if (d.length === KIDS.length) pass("প্রত্যেকের জন্য দুইটা সংখ্যা।");
    });
  };

  return (
    <>
      {who === null ? (
        <Stage h={0} w={0} label="the measuring strip and the scale, nobody on it yet" />
      ) : (
        <Measuring key={who} kid={KIDS[who]} />
      )}
      <div className="flex flex-wrap justify-center gap-2">
        {KIDS.map((k, i) => (
          <button
            key={k.name}
            type="button"
            onClick={() => call(i)}
            disabled={rec.running}
            className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-2 pr-4 pl-1.5 font-semibold transition-colors disabled:cursor-default ${
              who === i ? "border-foreground" : "border-border hover:border-foreground/40"
            }`}
          >
            <Face kid={k} />
            {k.name}
            {done.includes(i) && <span className="text-accent-text">✓</span>}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-4 grid max-w-sm gap-1.5">
        {done.map((i) => (
          <div key={i} className={`${FADE} flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-[0.95rem]`}>
            <Face kid={KIDS[i]} small />
            <b className="font-semibold">{KIDS[i].name}</b>
            <span className="ml-auto font-mono">
              {KIDS[i].v[0]} cm · {KIDS[i].v[1]} kg
            </span>
          </div>
        ))}
      </div>
      <Task done={done.length === KIDS.length}>
        তিনজনকেই একে একে ডেকে মেপে ফেলুন ({bn(done.length)}/{bn(KIDS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Full sentences for forty students? Cut the words, keep the numbers.

/** A run of text that folds away (or unfolds) sideways. */
function Fold({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span
      aria-hidden={!on}
      className="inline-block overflow-hidden whitespace-pre transition-[max-width,opacity] duration-700 ease-in-out motion-reduce:transition-none"
      style={{ maxWidth: on ? "14em" : 0, opacity: on ? 1 : 0 }}
    >
      {children}
    </span>
  );
}

/** A ruled exercise-book page. Paper in both themes, so its ink is fixed. */
function Notebook({ children }: { children: ReactNode }) {
  return (
    <div
      className="mx-auto my-5 max-w-md rounded-xl py-2 pr-4 pl-5 shadow-md ring-1 ring-black/10"
      style={{
        backgroundColor: "#fffdf6",
        color: "#1e293b",
        backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 2.4rem, #dbe4f0 2.4rem calc(2.4rem + 1px))",
        borderLeft: "3px solid #fca5a5",
      }}
    >
      {children}
    </div>
  );
}

export function ShortNote() {
  const pass = useGate();
  const cut = usePlay(650);
  const k = cut.k; // lines cut so far
  const started = cut.running || k > 0;
  const done = k === KIDS.length;

  return (
    <>
      <Notebook>
        <div className="text-sm leading-[2.4rem] font-semibold text-[#64748b]">ক্রীড়া প্রতিযোগিতা · height আর weight</div>
        {KIDS.map((kid, i) => {
          const short = i < k;
          return (
            <div key={kid.name} className="flex flex-wrap items-center text-[0.9rem] leading-[2.4rem] sm:text-[1.05rem]">
              <b className="font-semibold">{kid.name}</b>
              <Fold on={!short}>-এর height </Fold>
              <Fold on={short}>{"   ("}</Fold>
              <b className="font-mono font-semibold">{kid.v[0]}</b>
              <Fold on={!short}> cm, আর weight </Fold>
              <Fold on={short}>, </Fold>
              <b className="font-mono font-semibold">{kid.v[1]}</b>
              <Fold on={!short}> kg।</Fold>
              <Fold on={short}>)</Fold>
            </div>
          );
        })}
        <div className="leading-[2.4rem] text-[#94a3b8]">…আরো ৩৭ জন</div>
      </Notebook>
      {!started && (
        <div className="flex justify-center">
          <button type="button" onClick={() => cut.play(KIDS.length, () => pass("একই কথা, অনেক কম লেখা।"))} className={primaryBtn}>
            শব্দগুলো কেটে শুধু সংখ্যা রাখুন
          </button>
        </div>
      )}
      {done && <SaminSays tone="good">এই তো! চল্লিশ জনের list এখন এক পাতাতেই এঁটে যাবে।</SaminSays>}
      <Task done={done}>সামিনের কথামতো, বাক্য থেকে শব্দগুলো ছেঁটে শুধু সংখ্যা রাখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict, then watch: Nasib's pair written the wrong way round. The same
//     two numbers, read in the agreed slots, draw somebody else entirely.

const TRAP = ["180 cm লম্বা, ওজন 78 kg। কোনো সমস্যা নাই", "78 cm লম্বা, আর ওজন 180 kg", "স্যার ঠিকই বুঝে নিবেন কোনটা height"];
const TRAP_RIGHT = 1;
const REAL: [number, number] = [NASIB.v[0], NASIB.v[1]];

export function SwapTrap() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const [wrongWay, setWrongWay] = useState(true);
  const show = usePlay(1400);
  const over = guess !== null && show.k === 1;
  const written = wrongWay ? [REAL[1], REAL[0]] : REAL;
  // Until the reader guesses, the stage shows the real Nasib; after, what the
  // sir reads off the page.
  const [h, w] = useTween(guess === null ? REAL : written, 1200);

  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    show.play(1, () =>
      pass(
        "জায়গা বদলালে একদম অন্য মানুষ।"),
    );
  };

  return (
    <>
      <div className="mt-5 text-center text-sm font-medium text-muted">খাতায় যা লেখা আছে</div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <Face kid={NASIB} />
        <Vec v={written} names={guess === null ? undefined : ["height", "weight"]} />
      </div>
      <div className="mt-4 text-center text-sm font-medium text-muted">
        {guess === null ? "আসল নাসিব" : wrongWay ? "স্যার খাতা পড়ে যাকে ভাবছেন" : "order ঠিক থাকলে"}
      </div>
      <Stage
        h={h}
        w={w}
        shirt={NASIB.shirt}
        ghost={guess !== null && wrongWay ? REAL : undefined}
        label={`a student ${Math.round(h)} cm tall and ${Math.round(w)} kg heavy`}
      />
      {over && wrongWay && <SirSays tone="bad">৭৮ সেন্টিমিটার?! নাসিব কি এখনো ক্লাস ওয়ানে পড়ে? তার ওপর ওজন ১৮০ কেজি!</SirSays>}
      {over && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={() => setWrongWay((x) => !x)} className={quietBtn}>
            {wrongWay ? "order ঠিক করে দিন" : "আবার উল্টে দিন"}
          </button>
        </div>
      )}
      <div className="mt-5 text-sm font-medium text-muted">স্যার (78, 180) পড়ে নাসিবকে কেমন ভাববেন?</div>
      <div className="mt-2 grid gap-2">
        {TRAP.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, TRAP_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={over}>আগে guess করুন। তারপর দেখা যাক স্যার আসলে কী পড়লেন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The rule: height first, weight second. Sort three friends' scribbles
//     into the two slots — and watch the units fall off.

const SLIPS: { kid: Kid; say: [number, string][] }[] = [
  { kid: SAMIN, say: [[60, "kg"], [170, "cm"]] },
  { kid: SHOM, say: [[175, "cm"], [75, "kg"]] },
  { kid: NASIB, say: [[78, "kg"], [180, "cm"]] },
];
const SLOT_HINT = ["প্রথম ঘরটা height-এর। cm-ওয়ালা সংখ্যাটা খুঁজুন।", "দ্বিতীয় ঘরটা weight-এর। kg-ওয়ালাটা।"];

export function SlotRule() {
  const pass = useGate();
  const [s, setS] = useState(0);
  const [put, setPut] = useState<number[]>([]);
  const [filed, setFiled] = useState(0);
  const [miss, setMiss] = useState(0);
  const next = usePlay(900);
  const slip = SLIPS[s];
  const allDone = filed === SLIPS.length;

  const tap = (x: number) => {
    if (put.includes(x) || put.length === 2) return;
    if (x !== slip.kid.v[put.length]) {
      setMiss((m) => m + 1);
      return;
    }
    const p = [...put, x];
    setPut(p);
    setMiss(0);
    if (p.length < 2) return;
    setFiled(s + 1);
    if (s + 1 === SLIPS.length) pass("নিয়ম: আগে height, তারপর weight।");
    else
      next.play(1, () => {
        setS(s + 1);
        setPut([]);
      });
  };

  return (
    <>
      <div key={s} className={`${FADE} mx-auto mt-5 max-w-sm -rotate-1 rounded-xl border-2 border-dashed border-cat-amber/60 bg-cat-amber/5 px-4 py-3`}>
        <div className="mb-2 flex items-center justify-center gap-2 text-sm font-medium text-muted">
          <Face kid={slip.kid} small /> {slip.kid.name}-এর চিরকুট
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {slip.say.map(([x, unit]) => {
            const used = put.includes(x);
            return (
              <button
                key={x}
                type="button"
                disabled={used || put.length === 2}
                onClick={() => tap(x)}
                className={`h-11 cursor-pointer rounded-full border-2 px-4 font-mono font-semibold transition-[opacity,border-color] disabled:cursor-default ${
                  used ? "border-dashed border-border opacity-40" : "border-border hover:border-cat-blue/60"
                }`}
              >
                {x} {unit}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5 text-center text-sm font-medium text-muted">স্যারের নিয়ম মেনে বসান</div>
      <div className="mt-2">
        <Vec
          v={[put[0] ?? "?", put[1] ?? "?"]}
          names={["height", "weight"]}
          big
          box={(i) =>
            i < put.length ? "border-accent bg-accent/10" : i === put.length ? "border-dashed border-cat-blue" : "border-dashed border-border text-muted"
          }
        />
      </div>
      {miss > 0 && <Nope key={miss}>উঁহু। {SLOT_HINT[put.length]}</Nope>}
      {filed > 0 && (
        <div className="mx-auto mt-5 max-w-sm">
          <div className="mb-1.5 text-sm font-medium text-muted">স্যারের list</div>
          <div className="grid gap-1.5">
            {SLIPS.slice(0, filed).map(({ kid }) => (
              <div key={kid.name} className={`${FADE} flex items-center gap-2 rounded-lg border border-border px-3 py-1.5`}>
                <Face kid={kid} small />
                <b className="font-semibold">{kid.name}</b>
                <span className="ml-auto font-mono">{tuple(kid.v.slice(0, 2))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Task done={allDone}>
        প্রতিটা চিরকুটের সংখ্যা tap করে ঠিক ঘরে বসান ({bn(filed)}/{bn(SLIPS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Tanvir has Shom's height and weight exactly. The sir picks a pair by the
//     numbers alone, and it fits two boys — until the list grows.

const ADD = ["জুতার size", "বয়স"];

function Nums({ v }: { v: number[] }) {
  return (
    <span className="font-mono text-xs whitespace-nowrap sm:text-sm">
      (
      {v.map((x, i) => (
        <span key={i}>
          {i > 0 && ", "}
          <span className={`${POP} inline-block`}>{x}</span>
        </span>
      ))}
      )
    </span>
  );
}

export function TwinTrouble() {
  const pass = useGate();
  const [n, setN] = useState(2); // numbers per student on the list
  const pick = TANVIR.v.slice(0, n);
  const fits = (k: Kid) => k.v.slice(0, n).every((x, i) => x === pick[i]);
  const hits = CLASS.filter(fits).length;
  const found = hits === 1;

  const add = () => {
    setN(n + 1);
    if (n + 1 === 4) pass("চার নম্বর সংখ্যায় এসে আলাদা হলো।");
  };

  return (
    <>
      <div className="mx-auto mt-5 max-w-sm rounded-xl border-2 border-dashed border-cat-teal/50 bg-cat-teal/5 px-4 py-3">
        <div className="mb-2 text-center text-sm font-medium text-muted">স্যার হাই জাম্পের জন্য বেছে নিলেন</div>
        <Vec v={pick} names={FEATURE.slice(0, n)} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {CLASS.map((k) => {
          const hit = fits(k);
          return (
            <div
              key={k.name}
              className={`rounded-xl border-2 p-2.5 transition-[border-color,background-color,opacity] duration-300 ${
                !hit ? "border-border opacity-45" : found ? "win-pop border-accent bg-accent/10" : "border-cat-amber bg-cat-amber/10"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <Face kid={k} small />
                <b className="font-semibold">{k.name}</b>
              </div>
              <Nums v={k.v.slice(0, n)} />
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-center text-[0.95rem]">
        মিলছে: <b>{bn(hits)} জন</b>
      </div>
      {n === 2 && <SirSays>(175, 75), এই ছেলেটাকেই চাই। কে এটা?</SirSays>}
      {n === 3 && <SirSays tone="bad">জুতার size-ও দুইজনের 42? এখনো তো দুইজন!</SirSays>}
      {n === 4 && <SirSays tone="good">তানভীর! কাল সকালে ওকে মাঠে পাঠিয়ে দিও।</SirSays>}
      {n < 4 && (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={add} className={primaryBtn}>
            সবার list-এ {ADD[n - 2]} যোগ করুন
          </button>
        </div>
      )}
      <Task done={n === 4}>list-এ আরো সংখ্যা যোগ করে বের করুন, স্যারের বাছাই করা ছেলেটা আসলে কে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your own vector. Two sliders, and the stage draws you.

const RANGE = [
  { label: "আপনার height", unit: "cm", min: 120, max: 200 },
  { label: "আপনার weight", unit: "kg", min: 30, max: 120 },
];

export function YourVector() {
  const pass = useGate();
  const [v, setV] = useState([172, 68]);
  const [moved, setMoved] = useState([false, false]);
  const [h, w] = useTween(v, 250);

  const set = (j: number, x: number) => {
    setV(v.map((o, m) => (m === j ? x : o)));
    const mv = moved.map((o, m) => o || m === j);
    setMoved(mv);
    if (mv.every(Boolean)) pass("দুইটা সংখ্যায় আপনি: আপনার vector।");
  };

  return (
    <>
      <Stage h={h} w={w} shirt="fill-cat-amber" label={`you: ${v[0]} cm, ${v[1]} kg`} />
      <Vec v={v} names={["height (cm)", "weight (kg)"]} lead="V =" big />
      <div className="mx-auto mt-5 grid max-w-sm gap-3">
        {RANGE.map((r, j) => (
          <label key={r.unit} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-sm font-medium">{r.label}</span>
            <input
              type="range"
              min={r.min}
              max={r.max}
              value={v[j]}
              aria-label={r.label}
              onChange={(e) => set(j, Number(e.target.value))}
              className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-amber)]"
            />
            <span className="w-14 shrink-0 text-right font-mono text-sm">
              {v[j]} {r.unit}
            </span>
          </label>
        ))}
      </div>
      <Task done={moved.every(Boolean)}>দুইটা slider টেনে নিজের আসল height আর weight বসান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Naming the boxes: v₁ and v₂ are given, find v₃ and v₄.

const ASK_SLOT = [2, 3];

export function NameSlots() {
  const pass = useGate();
  const [q, setQ] = useState(0);
  const [miss, setMiss] = useState<number | null>(null);
  const [tries, setTries] = useState(0);
  const known = [0, 1, ...ASK_SLOT.slice(0, q)];
  const done = q === ASK_SLOT.length;

  const tap = (i: number) => {
    if (done || known.includes(i)) return;
    if (i === ASK_SLOT[q]) {
      setQ(q + 1);
      setMiss(null);
      if (q + 1 === ASK_SLOT.length) pass("নিচের ছোট সংখ্যা বলে কত নম্বর ঘর।");
    } else {
      setMiss(i);
      setTries((t) => t + 1);
    }
  };

  return (
    <>
      <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-muted">
        <Face kid={SHOM} small /> সোমের vector
      </div>
      <div className="mt-3">
        <Vec
          v={SHOM.v}
          lead="V ="
          big
          names={SHOM.v.map((_, i) =>
            known.includes(i) ? (
              <>
                <b className="font-mono text-sm font-semibold text-foreground">{vName(i)}</b>
                <br />
                {FEATURE[i]}
              </>
            ) : (
              ""
            ),
          )}
          onPick={tap}
          box={(i) =>
            known.includes(i) ? "border-accent bg-accent/10" : miss === i ? "border-danger/50 bg-danger/5 text-danger" : "border-border hover:border-cat-blue/60"
          }
        />
      </div>
      <div className="mt-5 text-center text-lg font-semibold">
        {done ? "চারটা ঘরেরই নাম হয়ে গেল!" : `${vName(ASK_SLOT[q])} কোনটা? Tap করুন।`}
      </div>
      {miss !== null && !done && (
        <Nope key={tries}>
          উঁহু, ওটা {bn(miss + 1)} নম্বর ঘর, মানে {vName(miss)}। বাঁ দিক থেকে গুনুন।
        </Nope>
      )}
      <Task done={done}>
        {vName(2)} আর {vName(3)} খুঁজে বের করুন ({bn(q)}/{bn(ASK_SLOT.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Rafi's pencil bird from 1.1: sixty-four numbers read in a fixed order.
//     Unroll the grid into one line — it was a vector all along.

const PENCIL = CELL_TONES[8];
/** one square of the 8 × 8 grid, in rem */
const CELL = 1.6;
const PHOTO = 36_000_000;

export function Unroll() {
  const pass = useGate();
  const go = usePlay(30);
  const k = go.k; // cells moved into the line
  const started = go.running || k > 0;
  const done = k === PENCIL.length;
  const [photo] = useTween([done ? PHOTO : 0], 2200);
  const head = PENCIL.slice(0, Math.min(k, 5));

  return (
    <>
      <div className="relative mx-auto my-5 h-[17rem] w-full max-w-md" role="img" aria-label={`Rafi's 8 by 8 bird, ${k} of 64 cells laid out in one line`}>
        {PENCIL.map((t, i) => {
          const out = i < k;
          return (
            <i
              key={i}
              className="absolute block shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.12)] transition-[left,top,width,height] duration-500 ease-in-out motion-reduce:transition-none"
              style={{
                background: gray(t),
                ...(out
                  ? { left: `calc(${i} * 100% / ${PENCIL.length})`, top: "14rem", width: `calc(100% / ${PENCIL.length})`, height: "2.6rem" }
                  : {
                      left: `calc(50% - ${4 * CELL}rem + ${(i % 8) * CELL}rem)`,
                      top: `${Math.floor(i / 8) * CELL}rem`,
                      width: `${CELL}rem`,
                      height: `${CELL}rem`,
                    }),
              }}
            />
          );
        })}
      </div>
      <div className="min-h-16 text-center">
        {started && (
          <>
            <div className="font-mono text-sm break-all">
              ({head.join(", ")}
              {k > 5 ? `, …, ${PENCIL[k - 1]}` : ""}
              {done ? ")" : ""}
            </div>
            <div className="mt-1 font-mono text-2xl font-bold">
              dimension <span className="tabular-nums">{k}</span>
            </div>
          </>
        )}
      </div>
      {!started && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => go.play(PENCIL.length, () => pass("৬৪টা ঘর এক লাইনে, ছবিও vector।"))}
            className={primaryBtn}
          >
            ছকটা খুলে এক লাইনে সাজান
          </button>
        </div>
      )}
      {done && (
        <div className={`${FADE} mt-4 rounded-xl border border-border px-4 py-3 text-center delay-300`}>
          <div className="text-sm text-muted">আর আপনার ফোনের 12 megapixel রঙিন photo?</div>
          <div className="mt-1 font-mono text-3xl font-bold tabular-nums">{Math.round(photo).toLocaleString("en-US")}</div>
          <div className="text-sm text-muted">dimension-এর একটা vector</div>
        </div>
      )}
      <Task done={done}>রাফিকে যে order-এ পড়ে শুনিয়েছিলেন, সেই order-এ ছকটা এক লাইনে খুলে ফেলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Features: add a few more to Shom's vector. One of them won't go in.

const EXTRA: { name: string; short: string; value: number | null }[] = [
  { name: "১০০ মিটার দৌড়", short: "দৌড় (সেকেন্ড)", value: 13.4 },
  { name: "এক মিনিটে push-up", short: "push-up", value: 32 },
  { name: "লং জাম্প", short: "লং জাম্প (মিটার)", value: 4.6 },
  { name: "প্রিয় খাবার", short: "প্রিয় খাবার", value: null },
];

export function FeaturePicker() {
  const pass = useGate();
  const [on, setOn] = useState<number[]>([]);
  const [yuck, setYuck] = useState(0);
  const v = [...SHOM.v, ...on.map((j) => EXTRA[j].value as number)];
  const names = [...FEATURE, ...on.map((j) => EXTRA[j].short)];

  const toggle = (j: number) => {
    if (EXTRA[j].value === null) {
      setYuck((y) => y + 1);
      return;
    }
    const next = on.includes(j) ? on.filter((x) => x !== j) : [...on, j];
    setOn(next);
    if (next.length >= 2) pass("Feature বাড়লো, সাথে dimension-ও।");
  };

  return (
    <>
      <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-muted">
        <Face kid={SHOM} small /> সোমের vector · dimension{" "}
        <b key={v.length} className={`${POP} inline-block font-mono text-base text-foreground`}>
          {v.length}
        </b>
      </div>
      <div className="mt-3 overflow-x-auto pb-1">
        <Vec v={v} names={names} box={(i) => (i >= FEATURE.length ? "border-cat-blue bg-cat-blue/10" : "border-border")} />
      </div>
      <div className="mt-5 text-sm font-medium text-muted">কী কী যোগ করবেন?</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {EXTRA.map((f, j) => {
          const picked = on.includes(j);
          const bad = f.value === null && yuck > 0;
          return (
            <button
              key={f.name}
              type="button"
              aria-pressed={picked}
              onClick={() => toggle(j)}
              className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                picked
                  ? "border-cat-blue bg-cat-blue text-white"
                  : bad
                    ? "border-dashed border-danger/50 text-danger line-through"
                    : "border-border hover:border-cat-blue/60"
              }`}
            >
              {picked ? "✓ " : "+ "}
              {f.name}
            </button>
          );
        })}
      </div>
      {yuck > 0 && (
        <Nope key={yuck}>খিচুড়ি?! এটা তো কোনো সংখ্যা না। Vector-এর ঘরে বসাবো কীভাবে? প্রশ্নটা মাথায় রাখুন।</Nope>
      )}
      <Task done={on.length >= 2}>
        সোমের vector-এ অন্তত দুইটা নতুন feature যোগ করুন ({bn(Math.min(on.length, 2))}/২)
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · Last picture: the four students rise out of the floor, and each one
//      becomes four numbers.

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const k = useCountUp(CLASS.length + 1, 850);
  return (
    <>
      <svg viewBox="0 0 400 250" role="img" aria-label="four students, each written as four numbers" className="mx-auto my-4 block h-auto w-full max-w-md">
        <line x1={0} x2={400} y1={G} y2={G} strokeWidth={1.2} className="stroke-border" />
        {CLASS.map((kid, i) =>
          i < k ? (
            <g key={kid.name}>
              <g className={GROW}>
                <Person cx={58 + i * 95} h={kid.v[0]} w={kid.v[1]} shirt={kid.shirt} />
              </g>
              <text x={58 + i * 95} y={G + 16} textAnchor="middle" fontSize={12} fontWeight={600} className={`${FADE} fill-foreground`}>
                {kid.name}
              </text>
            </g>
          ) : null,
        )}
      </svg>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CLASS.map((kid, i) =>
          i < k ? (
            <div key={kid.name} className={`${POP} rounded-lg border border-border px-1.5 py-1.5 text-center font-mono text-xs whitespace-nowrap sm:text-sm`}>
              {tuple(kid.v)}
            </div>
          ) : (
            <div key={kid.name} className="h-9" />
          ),
        )}
      </div>
      <div className="mt-4 min-h-24 text-center">
        {k > CLASS.length && (
          <div className={FADE}>
            <div className="text-xl font-bold">৪ জন মানুষ, ৪টা vector</div>
            <div className="text-muted">প্রতিটার dimension 4</div>
            <button
              type="button"
              onClick={onReplay}
              className="mt-3 cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              ↺ আবার দেখুন
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function Finale() {
  const [run, setRun] = useState(0);
  return <FinaleReel key={run} onReplay={() => setRun((r) => r + 1)} />;
}
