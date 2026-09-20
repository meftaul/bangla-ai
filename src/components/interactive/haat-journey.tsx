"use client";

import type { ReactNode } from "react";

import { Bubble, Card as CastCard, Person, Robot, Stage, Stall, StoryFrame, Tree } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Speech, Ticks, pill, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, makeFrame, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";
import { Tape } from "./dimension-journey";
import { bn } from "./figure-kit";

// Screens for "Math for AI 4.1 — ঘরে ঘরে গুণ, হাটের হিসাব", told as a Journey.
//
// নাসিবের movie club-এর black box (3.6), opened at the Friday হাট. মামা bets
// the box ("ঘরে ঘরে গুণ করে যোগ") can do all five of the day's jobs; মামী says
// it's a film trick fit only for shop bills. The reader seals their own bet,
// then the jobs come one by one: the grocery bill (the recipe, one number
// out), the দোকানদার  reading the lists the other way round and a list with no
// partner (order doesn't matter, lengths must match), ফাহিম's report card
// (weights), the দালাল's cow price with a negative knob (a linear model), the
// two sacks the box cannot pour together (it only ever returns one number),
// and Shiku's arrow put in both slots (v · v = ‖v‖²). Last, five new jobs
// sorted unaided. The finale's table settles the bet.
//
// Every step's setup that tells a scene gets a story scene on the হাটের stage
// (1a road, 2a মুদি দোকান, 4a the joke, 6a the result, 7a the দালাল, 9a the
// sacks, 11a Shiku's উঠান, 12a the জিলাপির দোকান, 14a/14b the bet paid and the
// van in the mud), and every <Then> gets one or two watch-only figures (1½,
// 2½, 3½, 4½, 4¾, 6½, 7½, 8½, 9½, 9¾, 11½, 11¾, 12½).
//
// `DotBox` is the box itself; the later 4.x journeys import it from here so
// the machine looks the same everywhere.
//
// Tailwind only; the sheet is journey/plane. Ink on the white sheet is fixed.

/** the box: multiply slot by slot, then add */
export const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
/** a machine number: at most two decimals, lakh-style commas, a real minus */
export const num = (n: number) => {
  const r = Math.round(n * 100) / 100 || 0;
  const s = Math.abs(r).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return r < 0 ? `−${s}` : s;
};
export const tupN = (v: readonly number[]) => `(${v.map(num).join(", ")})`;

/**
 * The box, opened: row i pairs slot i of each list and multiplies them; the
 * sum comes once `k` passes the last row. `k` rows are shown, so a screen can
 * step through it. A slot with no partner jams the box and no sum appears.
 * `dense` drops the row names for a half-width card.
 */
export function DotBox({
  a,
  b,
  k,
  names,
  unit = "",
  dense = false,
}: {
  a: readonly number[];
  b: readonly number[];
  k: number;
  names?: readonly string[];
  unit?: string;
  dense?: boolean;
}) {
  const n = Math.max(a.length, b.length);
  const jam = a.length !== b.length;
  const rows = Array.from({ length: Math.min(k, n) }, (_, i) => i);
  return (
    <div
      className={`mx-auto w-full rounded-2xl border-2 border-cat-amber/40 bg-cat-amber/5 font-mono ${
        dense ? "px-2 py-1.5 text-[0.78rem]" : "max-w-xs px-3 py-2 text-sm"
      }`}
    >
      {rows.length === 0 && <div className="py-1 text-center font-sans text-xs text-muted">box তৈরি</div>}
      {rows.map((i) => {
        const lone = a[i] === undefined || b[i] === undefined;
        return (
          <div key={i} className={`${FADE} flex items-baseline justify-between gap-2 leading-relaxed`}>
            {names && !dense && <span className="font-sans text-xs text-muted">{names[i]}</span>}
            {lone ? (
              <span className="text-danger">
                {num(a[i] ?? b[i])} × ? <span className="font-sans text-xs">জোড়া নাই</span>
              </span>
            ) : (
              <span className={dense ? "ml-auto" : ""}>
                {num(a[i])} × {num(b[i])} = <b>{num(a[i] * b[i])}</b>
              </span>
            )}
          </div>
        );
      })}
      {k > n && !jam && (
        <div className={`${FADE} mt-1 flex items-baseline justify-between gap-2 border-t border-cat-amber/40 pt-1 ${dense ? "" : "text-base"}`}>
          <span className="font-sans text-xs text-muted">সব যোগ</span>
          <b key={dot(a, b)} className={`${POP} inline-block`}>
            {num(dot(a, b))}
            {unit}
          </b>
        </div>
      )}
    </div>
  );
}

/** What the box does, in one line: the reader's reminder on the opening screen. */
export function BoxBadge() {
  return (
    <div className="mx-auto flex max-w-sm flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-3 py-1.5 text-sm">
      <b className="font-semibold">box:</b>
      <span>দুইটা list</span>
      <span className="text-muted">→</span>
      <span>ঘরে ঘরে গুণ</span>
      <span className="text-muted">→</span>
      <span>সব যোগ</span>
      <span className="text-muted">→</span>
      <span>একটা সংখ্যা</span>
    </div>
  );
}

/** A two-list card: what goes into the box. */
function Lists({ rows }: { rows: [label: string, v: readonly number[]][] }) {
  return (
    <div className="mx-auto mt-3 grid max-w-sm gap-1 rounded-xl border border-border bg-surface px-3 py-2">
      {rows.map(([label, v]) => (
        <div key={label} className="flex items-baseline justify-between gap-3">
          <span className="text-sm leading-snug text-muted">{label}</span>
          <span className="font-mono font-semibold whitespace-nowrap">{tupN(v)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · মামা-মামীর বাজি. The day's five jobs beside the box. The reader picks
//     the ones they think it can do and seals the bet, never marked here: the
//     finale's table settles it. This is the question the journey answers.

const JOBS = [
  "মুদি দোকানের bill",
  "Report card-এ ফাহিমের final number",
  "দালালের হিসাবে গাইয়ের দাম",
  "চাল-ডালের দুই বস্তা এক বস্তায় ঢালা",
  "Shiku-র arrow কত লম্বা",
];

export function HaatBet() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<number[]>("picks", []);
  const [sealed, setSealed] = useSeed("sealed", false);

  const toggle = (i: number) => setPicks(picks.includes(i) ? picks.filter((p) => p !== i) : [...picks, i].sort());
  const seal = () => {
    setSealed(true);
    pass(`বাজি সিল: box পারবে ${bn(picks.length)}টা কাজ।`);
  };

  return (
    <>
      <BoxBadge />
      <div className="mt-3 text-sm font-medium text-muted">কোন কোন কাজ এই box দিয়ে হবে? যতগুলো মনে হয়, tap করুন।</div>
      <div className="mt-2 grid gap-2">
        {JOBS.map((o, i) => (
          <Choice key={o} n={i} look={picks.includes(i) ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => toggle(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {!sealed ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={seal} className={primaryBtn}>
            {picks.length ? "বাজি সিল করুন" : "একটাও পারবে না, সিল করুন"}
          </button>
        </div>
      ) : (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>বাজি সিল করা হলো। হাট শেষে মিলিয়ে দেখবো।</div>
      )}
      <Task done={sealed}>যে কাজগুলো box দিয়ে হবে বলে মনে হয়, সেগুলো বেছে বাজিটা সিল করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The grocery bill. Run the box a pair at a time: 120 + 180 + 144 = 444.

const QTY = [2, 1, 12];
const PRICE = [60, 180, 12];
const GROCERY = ["চাল", "তেল", "ডিম"];

export function GroceryBill() {
  const pass = useGate();
  const [k, setK] = useSeed("k", 0);
  const over = k > QTY.length;

  const step = () => {
    const next = k + 1;
    setK(next);
    if (next > QTY.length) pass("ঘরে ঘরে গুণ, তারপর সব যোগ: 444।");
  };

  return (
    <>
      <Lists
        rows={[
          ["ফর্দ: চাল কেজি, তেল লিটার, ডিম", QTY],
          ["দাম, টাকায়", PRICE],
        ]}
      />
      <div className="mt-3">
        <DotBox a={QTY} b={PRICE} k={k} names={GROCERY} unit=" টাকা" />
      </div>
      {!over && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={step} className={primaryBtn}>
            {k === 0 ? "প্রথম জোড়া গুণ করুন" : k < QTY.length ? "পরের জোড়া" : "সব যোগ করুন"}
          </button>
        </div>
      )}
      <Task done={over}>boxটা এক জোড়া এক জোড়া করে চালান, দেখুন বিল কত আসে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Two tiny rounds at the counter. The দোকানদার  reads the price list first:
//     the same 444 (order doesn't matter). Then a customer brings four items
//     against a three-price card: পেঁয়াজ has no partner and the box jams.
//     Round 1 folds to a line when round 2 opens, so the widget stays short.

const QTY4 = [2, 1, 12, 3];

export function NoPartner() {
  const pass = useGate();
  const [swapped, setSwapped] = useSeed("swapped", false);
  const [round, setRound] = useSeed("round", 1);
  const [jammed, setJammed] = useSeed("jammed", false);

  const jam = () => {
    setJammed(true);
    pass("Order লাগে না, কিন্তু ঘর সমান লাগে।");
  };

  return (
    <>
      {round === 1 ? (
        <>
          <Lists
            rows={[
              ["আগে দাম", PRICE],
              ["পরে পরিমাণ", QTY],
            ]}
          />
          {!swapped ? (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={() => setSwapped(true)} className={primaryBtn}>
                উল্টো দিক থেকে box চালান
              </button>
            </div>
          ) : (
            <div className={`${FADE} mt-3`}>
              <DotBox a={PRICE} b={QTY} k={4} names={GROCERY} unit=" টাকা" />
              <div className="mt-3 flex justify-center">
                <button type="button" onClick={() => setRound(2)} className={primaryBtn}>
                  পরের খদ্দের
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-2 text-center text-sm text-accent-text">✓ উল্টো পড়লেও বিল সেই 444 টাকা।</div>
          <Lists
            rows={[
              ["ফর্দ: চাল, তেল, ডিম, পেঁয়াজ", QTY4],
              ["দোকানদার র দামের card", PRICE],
            ]}
          />
          {!jammed ? (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={jam} className={primaryBtn}>
                box এ  দিন
              </button>
            </div>
          ) : (
            <div className={`${FADE} mt-3`}>
              <DotBox a={QTY4} b={PRICE} k={5} names={[...GROCERY, "পেঁয়াজ"]} />
              <div className="mt-2 text-center text-[0.95rem] text-danger">box আটকে গেল। পেঁয়াজের 3-কে কার সাথে গুণ করবো?</div>
            </div>
          )}
        </>
      )}
      <Ticks
        items={[
          ["উল্টো করে পড়া", round === 2],
          ["চার জিনিস, তিন দাম", jammed],
        ]}
      />
      <Task done={jammed}>আগে উল্টো দিক থেকে box চালান, তারপর পরের খদ্দেরের ফর্দটা box এ  দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · ফাহিমের report card. Marks (80, 60, 90), the school's weights (0.2, 0.3,
//     0.5). Predict against the plain average, 76.7 → 79. Then a project-heavy
//     card (0.2, 0.5, 0.3) → 73. A number line shows the pin leaning towards
//     the exam that weighs most.

const MARKS = [80, 60, 90];
const EXAMS = ["midterm", "project", "final"];
const W_CARDS = [
  { name: "স্কুলের নিয়ম", w: [0.2, 0.3, 0.5] },
  { name: "project এর weight বেশি হলে", w: [0.2, 0.5, 0.3] },
];
const PLAIN = (80 + 60 + 90) / 3;
const GRADE_GUESS = ["76.7-এর বেশি", "76.7-এর কম", "ঠিক 76.7"];

function MarkLine({ final }: { final: number }) {
  const lo = 55;
  const hi = 95;
  const x = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  return (
    <div className="relative mx-auto mt-4 mb-7 h-1.5 max-w-xs rounded-full bg-foreground/15">
      {MARKS.map((m, i) => (
        <span key={EXAMS[i]} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: x(m) }}>
          <span className="block size-2.5 rounded-full bg-foreground/50" />
          <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[0.7rem] whitespace-nowrap text-muted">
            {EXAMS[i]} {m}
          </span>
        </span>
      ))}
      <span className="absolute -top-1 h-3.5 w-px bg-foreground/40" style={{ left: x(PLAIN) }} aria-hidden="true" />
      <span
        className="absolute -top-6 -translate-x-1/2 rounded-full bg-cat-blue px-1.5 font-mono text-xs font-bold text-white transition-[left] duration-500 motion-reduce:transition-none"
        style={{ left: x(final) }}
      >
        {num(final)}
      </span>
    </div>
  );
}

export function ReportCard() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);
  const [card, setCard] = useSeed("card", 0);
  const [seen, setSeen] = useSeed<number[]>("seen", [0]);
  const w = W_CARDS[card].w;
  const done = ran && seen.length === W_CARDS.length;

  const flip = (i: number) => {
    setCard(i);
    if (seen.includes(i)) return;
    setSeen([...seen, i]);
    pass("যার weight বেশি, final সেদিকে ঝোঁকে।");
  };

  return (
    <>
      <Lists
        rows={[
          ["ফাহিমের নম্বর", MARKS],
          [`weight (${W_CARDS[card].name})`, w],
        ]}
      />
      {!ran ? (
        <>
          <div className="mt-3 text-sm font-medium text-muted">তিনটা নম্বরের সাধারণ average 76.7। ফাহিমের final number কত হবে?</div>
          <div className="mt-2 grid gap-2">
            {GRADE_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, false, 0)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {guess !== null && (
            <div className={`${FADE} mt-3 flex justify-center`}>
              <button type="button" onClick={() => setRan(true)} className={primaryBtn}>
                box চালান
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={FADE}>
          {card === 0 && (
            <div className="mt-2 text-center text-[0.95rem]">{guess === 0 ? "ঠিক ধরেছেন, 79।" : "উঁহু, 79, মানে average-এর চেয়ে বেশি।"} সবচেয়ে বড় weight-টা পড়েছে ফাহিমের সবচেয়ে ভালো পরীক্ষায়।</div>
          )}
          <MarkLine final={dot(MARKS, w)} />
          <DotBox a={MARKS} b={w} k={4} names={EXAMS} />
          <div className="mt-3 flex justify-center gap-2">
            {W_CARDS.map((c, i) => (
              <button key={c.name} type="button" onClick={() => flip(i)} className={`${pill(card === i)} font-sans`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <Task done={done}>আগে একটা guess দিয়ে box চালান। তারপর weight-এর card বদলে দেখুন final number কোথায় সরে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The দালাল's knob card: +400 per kg, +4000 per litre of milk a day,
//     −5000 per year of age. Which cow costs more? The big old one is the
//     trap: 74,000 against 85,000 for the small young one.

const KNOBS = [400, 4000, -5000];
const KNOB_NAMES = ["প্রতি কেজি ওজনে", "প্রতি লিটার দুধে", "প্রতি বছর বয়সে"];
const COWS = [
  { name: "বড় বুড়ি গাই", v: [250, 6, 10] },
  { name: "ছোট জোয়ান গাই", v: [200, 5, 3] },
];
const COW_GUESS = ["বড় বুড়ি গাই", "ছোট জোয়ান গাই", "দুইটার দাম সমান"];

export function CowPrice() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);
  const { k, running, play } = usePlay(420);
  const shown = ran && !running ? 8 : k;

  const run = () => {
    setRan(true);
    play(8, () => pass("গাইয়ের দাম মানে তথ্য আর knob, box এ ।"));
  };

  return (
    <>
      <div className="mx-auto mt-2 grid max-w-sm grid-cols-3 gap-1.5 rounded-xl border-2 border-cat-violet/40 bg-cat-violet/5 px-2 py-1.5 text-center">
        {KNOBS.map((w, i) => (
          <div key={KNOB_NAMES[i]}>
            <div className="text-[0.7rem] leading-tight text-muted">{KNOB_NAMES[i]}</div>
            <div className={`font-mono text-sm font-bold ${w < 0 ? "text-danger" : ""}`}>{w > 0 ? `+${num(w)}` : num(w)}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {COWS.map((c, i) => (
          <div key={c.name} className="rounded-xl border-2 border-border bg-surface px-2 py-2 text-center">
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="text-[0.7rem] text-muted">(ওজন, দুধ, বয়স)</div>
            <div className="font-mono font-bold">{tupN(c.v)}</div>
            {ran && (
              <div className="mt-1.5">
                <DotBox a={c.v} b={KNOBS} k={Math.max(0, shown - i * 4)} unit="" dense />
              </div>
            )}
          </div>
        ))}
      </div>
      {!ran ? (
        <>
          <div className="mt-3 text-sm font-medium text-muted">দালালের card দেখে বলুন তো, কোন গাইয়ের দাম বেশি?</div>
          <div className="mt-2 grid gap-2">
            {COW_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, false, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {guess !== null && (
            <div className={`${FADE} mt-3 flex justify-center`}>
              <button type="button" onClick={run} className={primaryBtn}>
                দুইটাই box এ  দিন
              </button>
            </div>
          )}
        </>
      ) : (
        !running && (
          <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
            {guess === 1 ? "ঠিক ধরেছেন। ছোট গাইটাই 11,000 টাকা বেশি।" : "উঁহু, ছোট জোয়ান গাইটার দামই বেশি, 85,000 বনাম 74,000।"} বড়টার বয়সেই কাটা গেল 50,000।
          </div>
        )
      )}
      <Task done={ran && !running}>আগে guess করুন কোন গাইয়ের দাম বেশি, তারপর দুইটাকেই দালালের card-এর সাথে box এ  দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · মামী's challenge: pour the two sacks (চাল, ডাল) = (10, 2) and (5, 3)
//     into one with the box. It gives 56, which no sack can be read from. Of
//     the other two moves, slot-by-slot multiply without the add gives
//     (50, 6), which means nothing; the old slot-by-slot add fills the sack.

const SACKS = [
  [10, 2],
  [5, 3],
];
const SACK_TRY = [
  { name: "ঘরে ঘরে গুণ, যোগ ছাড়া", out: "(50, 6)" },
  { name: "ঘরে ঘরে যোগ", out: "(15, 5)" },
];

export function TwoSacks() {
  const pass = useGate();
  const [boxed, setBoxed] = useSeed("boxed", false);
  const [tried, setTried] = useSeed<number | null>("tried", null);
  const filled = tried === 1;

  const tryIt = (i: number) => {
    setTried(i);
    if (i === 1) pass("box দেয় একটা সংখ্যা, list না।");
  };

  return (
    <>
      <div className="mt-2 flex items-center justify-center gap-2">
        {SACKS.map((s, i) => (
          <div key={i} className="rounded-2xl rounded-t-[2rem] border-2 border-cat-amber/50 bg-cat-amber/10 px-4 pt-3 pb-2 text-center">
            <div className="text-[0.7rem] text-muted">(চাল, ডাল) কেজি</div>
            <div className="font-mono font-bold">{tupN(s)}</div>
          </div>
        ))}
        <span className="text-xl text-muted">→</span>
        <div
          className={`min-w-24 rounded-2xl rounded-t-[2rem] border-2 border-dashed px-3 pt-3 pb-2 text-center transition-colors motion-reduce:transition-none ${
            filled ? "border-accent bg-accent/10" : "border-border"
          }`}
        >
          <div className="text-[0.7rem] text-muted">নতুন বস্তা</div>
          <div key={`${boxed}${tried}`} className={`${POP} font-mono font-bold`}>
            {filled ? "(15, 5)" : boxed ? "56 ?" : "?"}
          </div>
        </div>
      </div>
      {!boxed ? (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={() => setBoxed(true)} className={primaryBtn}>
            box এ  দিন
          </button>
        </div>
      ) : (
        <div className={FADE}>
          <div className="mt-3">
            <DotBox a={SACKS[0]} b={SACKS[1]} k={3} names={["চাল", "ডাল"]} />
          </div>
          <Speech who="মামী" initial="মী" tint="teal">
            56 কী? নতুন বস্তায় চাল কত কেজি, ডাল কত কেজি?
          </Speech>
          <div className="mt-3 text-sm font-medium text-muted">box পারলো না। অন্য দুইটা চাল চেষ্টা করুন:</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SACK_TRY.map((t, i) => (
              <button
                key={t.name}
                type="button"
                disabled={filled}
                onClick={() => tryIt(i)}
                className={`cursor-pointer rounded-xl border-2 px-2 py-2 text-center transition-colors motion-reduce:transition-none disabled:cursor-default ${
                  tried === i ? (i === 1 ? "border-accent bg-accent/10" : "border-danger/50 bg-danger/5") : "border-border hover:border-cat-blue/60"
                }`}
              >
                <div className="text-sm font-semibold">{t.name}</div>
                {tried === i && <div className={`${FADE} font-mono`}>{t.out}</div>}
              </button>
            ))}
          </div>
          {tried === 0 && <Nope key="t0">50 কী, “চাল গুণ চাল”? এমন কোনো জিনিস বস্তায় ঢোকে না।</Nope>}
        </div>
      )}
      <Ticks
        items={[
          ["box চালানো", boxed],
          ["বস্তা ভরা", filled],
        ]}
      />
      <Task done={filled}>আগে দুই বস্তা box এ  দিয়ে দেখুন। তারপর যে চালে বস্তাটা ভরে, সেটা খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Shiku's arrow (3, 4) in both slots of the box → 25, and Shiku's tape
//     says 5: 25 = 5 × 5. Then the 3-slot clue (2, 3, 6), which can't be
//     drawn: the box says 49, so the length is 7.

const FA = makeFrame(0, 4, 0, 4.5, 30);
const SHIKU: XY = [3, 4];
const BOX3 = [2, 3, 6];
const LINK = ["25 = 5 + 20", "25 = 5 × 5", "কোনো সম্পর্ক নাই"];
const LEN3 = ["49", "7", "11"];

export function SelfDot() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const [linked, setLinked] = useSeed("linked", false);
  const [miss, setMiss] = useSeed<{ r: number; n: number } | null>("miss", null);
  const [ran3, setRan3] = useSeed("ran3", false);
  const [got, setGot] = useSeed("got", false);

  const link = (i: number) => {
    if (i !== 1) return setMiss({ r: 1, n: (miss?.n ?? 0) + 1 });
    setMiss(null);
    setLinked(true);
  };
  const len3 = (i: number) => {
    if (i !== 1) return setMiss({ r: 2, n: (miss?.n ?? 0) + 1 });
    setMiss(null);
    setGot(true);
    pass("v · v = ‖v‖², root নিলেই length।");
  };

  return (
    <>
      {!linked ? (
        <>
          <Plane f={FA} ticks={1} label="Shiku-র arrow (3, 4), পাশে ফিতা" className="max-w-[10rem]">
            <Tape f={FA} from={[0, 0]} to={SHIKU} />
            <Arrow f={FA} from={[0, 0]} to={SHIKU} tone="violet" w={2.4} />
            <Shiku f={FA} at={SHIKU} />
          </Plane>
          <Lists
            rows={[
              ["Shiku-র arrow", SHIKU],
              ["আবার Shiku-র arrow", SHIKU],
            ]}
          />
          {!ran ? (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={() => setRan(true)} className={primaryBtn}>
                box এ  দিন
              </button>
            </div>
          ) : (
            <div className={FADE}>
              <div className="mt-3">
                <DotBox a={SHIKU} b={SHIKU} k={3} />
              </div>
              <div className="mt-3 text-sm font-medium text-muted">ফিতা বলছে 5, box বলছে 25। সম্পর্কটা কী?</div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {LINK.map((o, i) => (
                  <button key={o} type="button" onClick={() => link(i)} className={`${pill(false)} ${i === 2 ? "font-sans" : ""}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={FADE}>
          <div className="mt-2 text-center text-sm text-accent-text">✓ 25 = 5 × 5, মানে box দিয়েছে length এর  বর্গ।</div>
          <div className="mt-2 text-center text-[0.95rem]">এবার মেলার ছাদের সেই 3-ঘরের clue। এটা কাগজে আঁকা যায় না, ফিতাও ধরা যায় না।</div>
          <Lists
            rows={[
              ["clue", BOX3],
              ["আবার clue", BOX3],
            ]}
          />
          {!ran3 ? (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={() => setRan3(true)} className={primaryBtn}>
                box এ  দিন
              </button>
            </div>
          ) : (
            <div className={FADE}>
              <div className="mt-3">
                <DotBox a={BOX3} b={BOX3} k={4} />
              </div>
              <div className="mt-3 text-sm font-medium text-muted">তাহলে arrow-টা কত লম্বা?</div>
              <div className="mt-2 flex justify-center gap-2">
                {LEN3.map((o, i) => (
                  <button key={o} type="button" disabled={got} onClick={() => len3(i)} className={pill(got && i === 1)}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {miss && (
        <Nope key={`${miss.r}-${miss.n}`}>
          {miss.r === 1 ? "উঁহু। 5-কে কী দিয়ে গুণ করলে 25 হয়? আর box এর ভেতরে 3 × 3 আর 4 × 4-এর দিকে তাকান।" : "উঁহু। 49 হলো বর্গ, length না। কোন সংখ্যাকে নিজের সাথে গুণ করলে 49 হয়?"}
        </Nope>
      )}
      <Ticks
        items={[
          ["Shiku-র arrow", linked],
          ["3-ঘরের clue", got],
        ]}
      />
      <Task done={got}>Arrow-টাকে box এর দুই দিকেই দিন, তারপর box এর উত্তর আর ফিতার মাপ মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · এবার আপনার পালা. Five new jobs, one card at a time, into "box এর কাজ"
//     or "box এর কাজ না". Wrong tries bounce; each right one leaves its
//     reason behind, so the numbers actually get read.

const NEW_JOBS = [
  { t: "ভ্যান ভাড়া: গেলাম 6 কিলোমিটার, সাথে 4টা বস্তা। রেট কিলোমিটারে 20 টাকা, বস্তায় 10 টাকা।", yes: true, why: "(6, 4) · (20, 10) = 120 + 40 = 160 টাকা।" },
  { t: "সকালে কেনা (চাল, ডাল) = (3, 1), বিকেলে আরও (2, 1)। সারাদিনে মোট কী কী কেনা হলো?", yes: false, why: "উত্তরটা একটা list, (5, 2)। এটা পুরানো যোগের কাজ।" },
  { t: "ফাহিম মারলো 3টা চার, 2টা ছক্কা আর 10টা single। মোট কত রান?", yes: true, why: "(3, 2, 10) · (4, 6, 1) = 12 + 12 + 10 = 34 রান।" },
  { t: "Class-এর সবার (উচ্চতা, ওজন) card দ্বিগুণ করে দেখা।", yes: false, why: "এটা stretch, উত্তর আবার একটা card। box দেয় একটা সংখ্যা।" },
  { t: "ফর্দে (চাল, ডাল, তেল), কিন্তু দোকানদার র card-এ দাম আছে শুধু (চাল, ডাল)-এর।", yes: false, why: "তেলের জোড়া নাই। দুই list-এ ঘর সমান না হলে box চলে না।" },
];
const JOB_BINS = ["box এর কাজ", "box এর কাজ না"];

export function BoxOrNot() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const job = NEW_JOBS[done];
  const all = done === NEW_JOBS.length;
  const last = done > 0 ? NEW_JOBS[done - 1] : null;

  const drop = (yes: boolean) => {
    if (all) return;
    if (yes !== job.yes) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setDone(done + 1);
    if (done + 1 === NEW_JOBS.length) pass("উত্তর একটা সংখ্যা হলে তবেই box।");
  };

  return (
    <>
      <div className="mt-4 min-h-28">
        {!all ? (
          <div key={done} className={`${POP} mx-auto max-w-sm rounded-2xl border-2 border-cat-violet/40 bg-surface px-4 py-3 text-center text-[0.95rem]`}>
            {job.t}
          </div>
        ) : (
          <div className={`${FADE} text-center text-[0.95rem] text-accent-text`}>পাঁচটা কাজই ঠিক জায়গায়!</div>
        )}
        {miss !== null && !all && (
          <Nope key={miss}>উঁহু। নিজেকে দুইটা প্রশ্ন করুন: উত্তরটা কি একটাই সংখ্যা? আর দুই list-এর ঘরগুলো কি জোড়ায় জোড়ায় মেলে?</Nope>
        )}
        {last && miss === null && (
          <div key={`why${done}`} className={`${FADE} mt-2 text-center text-sm text-muted`}>
            ✓ আগেরটা: {last.why}
          </div>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {JOB_BINS.map((b, i) => (
          <button
            key={b}
            type="button"
            disabled={all}
            onClick={() => drop(i === 0)}
            className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-border px-2 py-3 text-center transition-colors hover:border-cat-blue/60 motion-reduce:transition-none disabled:cursor-default"
          >
            <span className="text-sm font-semibold">{b}</span>
            <span className="font-mono text-sm">{bn(NEW_JOBS.slice(0, done).filter((j) => j.yes === (i === 0)).length)}টা</span>
          </button>
        ))}
      </div>
      <Task done={all}>
        প্রতিটা কাজ box দিয়ে হবে কি না, ঠিক করে tap করুন ({bn(done)}/{bn(NEW_JOBS.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes and explanation figures. Watch-only, driven by the reader
// (useScene): a story scene acts out a step's setup words on the হাটের stage,
// a figure acts out the <Then> paragraph right before it. Props the cast
// doesn't have (a signpost, a van, sacks, cows, a calculator, jilapi) are
// drawn here in fixed ink, like the rest of a Stage. People who aren't in the
// cast (the দোকানদার , the দালাল, a খদ্দের, চাচা, রফিক) borrow the closest
// look and get their own name drawn under their feet.

const H_INK = "#0f1b2d";
/** the stage's ground */
const G = 150;

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** Something that glides to (x, y) over `ms`, the way a Person does: draw it around (0, 0). */
function H_Carry({ x, y, ms = 1200, children }: { x: number; y: number; ms?: number; children: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {children}
    </g>
  );
}

/** The name under someone who isn't in the cast; it glides with them. */
function H_Name({ x, y = G, text, ms = 1200 }: { x: number; y?: number; text: string; ms?: number }) {
  return (
    <H_Carry x={x} y={y} ms={ms}>
      <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={H_INK}>
        {text}
      </text>
    </H_Carry>
  );
}

/** A signpost, foot at (x, y), its board pointing right. */
function H_Sign({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 2} y={y - 44} width={4} height={44} fill="#78350f" />
      <path d={`M${x - 22} ${y - 56}h34l8 8l-8 8h-34Z`} fill="#fde68a" stroke="#92400e" strokeWidth={1} />
      <text x={x - 4} y={y - 45} textAnchor="middle" fontSize={9} fontWeight={800} fill={H_INK}>
        {text}
      </text>
    </g>
  );
}

/** A jute sack, bottom-centre at (0, 0). */
function H_Sack({ s = 1, ghost = false }: { s?: number; ghost?: boolean }) {
  return (
    <g transform={`scale(${s})`}>
      <path
        d="M-11 0q-4 -14 2 -22l-2 -4h22l-2 4q6 8 2 22Z"
        fill={ghost ? "none" : "#c9a36b"}
        stroke={ghost ? H_INK : "#8a6a3a"}
        strokeOpacity={ghost ? 0.5 : 1}
        strokeDasharray={ghost ? "3 2" : undefined}
        strokeWidth={1}
      />
      {!ghost && <path d="M-7 -23h14" stroke="#8a6a3a" strokeWidth={1.6} />}
    </g>
  );
}

/** A cycle van, the left end of its bed over (x, y): a flat bed, two wheels, and the rider's frame in front. */
function H_Van({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y - 32} width={70} height={6} rx={1} fill="#92400e" />
      <path d={`M${x} ${y - 32}v-7M${x + 70} ${y - 32}v-7M${x} ${y - 37}h70`} stroke="#78350f" strokeWidth={1.6} />
      <circle cx={x + 16} cy={y - 11} r={11} fill="none" stroke={H_INK} strokeWidth={2.2} />
      <circle cx={x + 54} cy={y - 11} r={11} fill="none" stroke={H_INK} strokeWidth={2.2} />
      <path d={`M${x + 70} ${y - 28}L${x + 88} ${y - 30}L${x + 94} ${y - 9}M${x + 84} ${y - 30}l-2 -12h-5M${x + 90} ${y - 44}l4 -1`} fill="none" stroke={H_INK} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={x + 94} cy={y - 9} r={9} fill="none" stroke={H_INK} strokeWidth={2.2} />
    </g>
  );
}

/** A cow facing left, feet at (x, y). `old` greys her coat. */
function H_Cow({ x, y, s = 1, old = false }: { x: number; y: number; s?: number; old?: boolean }) {
  const coat = old ? "#a8a29e" : "#b45309";
  const leg = old ? "#78716c" : "#7c2d12";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      {[-15, -9, 10, 16].map((lx) => (
        <rect key={lx} x={lx} y={-15} width={3.5} height={15} fill={leg} />
      ))}
      <ellipse cy={-23} rx={22} ry={11} fill={coat} />
      <ellipse cx={6} cy={-26} rx={6} ry={4} fill="white" opacity={0.85} />
      <ellipse cx={5} cy={-13} rx={4} ry={2.4} fill="#f9a8d4" />
      <path d="M21 -27q7 2 5 14" fill="none" stroke={leg} strokeWidth={1.6} />
      <ellipse cx={-24} cy={-30} rx={6.5} ry={7.5} fill={coat} />
      <ellipse cx={-27} cy={-25} rx={4} ry={3} fill="#fbcfe8" />
      <path d="M-28 -37q-5 -2 -5 -6M-20 -37q5 -2 5 -6" fill="none" stroke="#fef3c7" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={-26} cy={-31} r={1} fill={H_INK} />
    </g>
  );
}

/** A small calculator on a counter, bottom-left at (x, y). */
function H_Calc({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y - 12} width={10} height={12} rx={1.5} fill="#334155" />
      <rect x={x + 1.5} y={y - 10.5} width={7} height={3} fill="#bef264" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x + 1.8 + (i % 2) * 3.6} y={y - 6 + Math.floor(i / 2) * 2.6} width={2.6} height={1.8} fill="#e2e8f0" />
      ))}
    </g>
  );
}

/** A plate of jilapi, centred at (0, 0). */
function H_Jilapi() {
  return (
    <g>
      <ellipse cy={2} rx={11} ry={3} fill="white" stroke="#94a3b8" strokeWidth={0.8} />
      {[-5, 0, 5].map((cx) => (
        <circle key={cx} cx={cx} cy={-1} r={3.4} fill="none" stroke="#f97316" strokeWidth={1.8} />
      ))}
    </g>
  );
}

/** A tick or a cross, drawn (glyphs turn into emoji on some systems). */
function H_Mark({ ok }: { ok: boolean }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={`inline-block size-3.5 shrink-0 align-[-2px] ${ok ? "text-accent-text" : "text-danger"}`}>
      <path d={ok ? "M2 6.5l2.6 2.6L10 3.5" : "M3 3l6 6M9 3l-6 6"} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A caption that fades in afresh on every beat. */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the road to the হাট.
//      ফাহিম tells the club's rule, মামী laughs it off as a film trick, and
//      মামা bets all five jobs on it, jilapi for the loser. No verdict.

export function HaatRoad({}: Story) {
  const s = useScene(5, [600, 1500, 2400, 2400, 2400]);
  const k = s.k;
  const on = k >= 1;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামা, মামী আর ফাহিম হাটের রাস্তায়; ফাহিম club-এর নিয়ম বলে, মামী হাসেন, মামা জিলাপির বাজি ধরেন">
        <rect y={G - 3} width={320} height={12} fill="#d6c08f" />
        <Tree x={250} y={G - 4} s={0.8} />
        <H_Sign x={292} y={G - 2} text="হাট" />
        <Person who="mami" x={on ? 70 : 28} y={G} walking={k === 1} ms={1400} mood={k >= 3 ? "smug" : "plain"} arm={k === 3 ? "wave" : "down"} label />
        <Person who="mama" x={on ? 128 : 72} y={G} walking={k === 1} ms={1400} mood={k >= 4 ? "happy" : "plain"} arm={k >= 4 ? "point" : "down"} label />
        <Person who="fahim" x={on ? 192 : 114} y={G} facing={k >= 2 ? -1 : 1} walking={k === 1} ms={1400} mood={k === 2 ? "happy" : "plain"} arm={k === 2 ? "wave" : "down"} label />
        {k === 2 && <Bubble x={192} y={G - 66} lines={["Club-এর black box:", "ঘরে ঘরে গুণ, তারপর যোগ!"]} />}
        {k === 3 && <Bubble x={70} y={G - 66} lines={["সিনেমার গোঁজামিল!", "বড়জোর দোকানের বিল।"]} />}
        {k === 4 && <Bubble x={128} y={G - 66} lines={["পাঁচটা কাজ,", "পাঁচটাই box এ হবে!"]} />}
        {k === 5 && <Bubble x={128} y={G - 66} lines={["যে হারবে,", "সে জিলাপি খাওয়াবে!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the box's three steps,
//      each lit in turn on the club's own numbers from 3.6: মামার পছন্দ
//      (2, 5) and Mr. Bean (1, 4) give the 22 the club showed.

const X1_SAY = [
  "box এর ভেতরে তিনটা ধাপ।",
  "এক: দুইটা list নাও। যেমন club-এ মামার পছন্দ আর Mr. Bean-এর score।",
  "দুই: একই ঘরের দুইটা সংখ্যা গুণ করো।",
  "তিন: গুণফলগুলো সব যোগ। হাতে একটা সংখ্যা, club-এর সেই 22।",
];
const X1_ROWS = [
  { name: "দুইটা list", out: "(2, 5)  (1, 4)" },
  { name: "ঘরে ঘরে গুণ", out: "2 × 1 = 2   5 × 4 = 20" },
  { name: "সব যোগ", out: "2 + 20 = 22" },
];

export function BoxSteps() {
  const s = useScene(3, [600, 2400, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <div className="mx-auto w-full max-w-xs rounded-2xl border-2 border-cat-amber/40 bg-cat-amber/5 px-3 py-2">
        {X1_ROWS.map((r, i) => (
          <div
            key={r.name}
            className={`flex items-baseline gap-2 rounded-lg px-1.5 py-1 transition-[opacity,background-color] duration-500 motion-reduce:transition-none ${
              k > i ? "opacity-100" : "opacity-35"
            } ${k === i + 1 ? "bg-cat-amber/15" : ""}`}
          >
            <span className="w-4 shrink-0 text-sm font-bold text-cat-amber">{bn(i + 1)}</span>
            <span className="w-24 shrink-0 text-sm">{r.name}</span>
            {k > i && <span className={`${FADE} font-mono text-sm font-semibold whitespace-pre`}>{r.out}</span>}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: the মুদি দোকান. মামী walks
//      up with ফাহিম and holds out the ফর্দ (2, 1, 12); the price card
//      (60, 180, 12) sits on the counter; the calculator lies untouched while
//      the দোকানদার  says he'll do it in his head. The bill itself is not said.

const S2_STALL = 235;
const S2_SHOP = 296;

/** The মুদি দোকান with its দোকানদার  on the right, for 2a and 4a. */
function S2_Shop({ talk, prices }: { talk: boolean; prices: boolean }) {
  return (
    <>
      <Stall x={S2_STALL} y={G} w={96} color="#16a34a" />
      <H_Calc x={S2_STALL + 18} y={G - 24} />
      <Person who="karim" x={S2_SHOP} y={G} facing={-1} mood={talk ? "smug" : "plain"} arm={talk ? "wave" : "down"} />
      <H_Name x={S2_SHOP} text="দোকানদার " />
      {prices && <CastCard x={S2_STALL} y={G - 11} text="(60, 180, 12)" tone="blue" />}
    </>
  );
}

export function MudiStall({}: Story) {
  const s = useScene(4, [600, 1500, 1800, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="মুদি দোকানে মামী ফর্দ (2, 1, 12) দেন, দোকানের দাম (60, 180, 12), দোকানদার  ক্যালকুলেটর ছাড়াই মুখে হিসাব করেন">
        <S2_Shop talk={k >= 4} prices={k >= 3} />
        <Person who="fahim" x={k >= 1 ? 80 : -30} y={G} walking={k === 1} ms={1400} label={k >= 1} />
        <Person who="mami" x={k >= 1 ? 138 : -70} y={G} walking={k === 1} ms={1400} arm={k >= 2 ? "hold" : "down"} label={k >= 1} />
        {k >= 2 && <CastCard x={150} y={G - 44} text="(2, 1, 12)" tone="amber" />}
        {k >= 4 && <Bubble x={S2_SHOP} y={G - 66} side="left" lines={["ক্যালকুলেটর লাগবে না,", "বিল মুখেই বলছি!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the two lists as rows.
//      Straight lines pair each slot with its own (120, 180, 144 → 444); then
//      "add first, multiply after" throws every line across, ডিমের 12 onto
//      চালের 60 among them (15 × 252 = 3,780); last, only the straight ones stay.

const X2_X = [72, 140, 208];
const X2_TOP = 34;
const X2_BOT = 96;
const X2_SAY = [
  "দুইটা list: ওপরে পরিমাণ, নিচে দাম।",
  "চাল চালের সাথে, তেল তেলের সাথে, ডিম ডিমের সাথে।",
  "তিনটা গুণফল যোগ: 444 টাকা।",
  "আগে সব যোগ, পরে গুণ করলে ডিমের 12 গুণ হয় চালের 60-এর সাথেও। বিল 3,780!",
  "box এর নিয়ম কড়া: শুধু একই ঘরের দুইজন জোড়া বাঁধে।",
];

function X2_Chip({ x, y, text, tone }: { x: number; y: number; text: string; tone: string }) {
  return (
    <g>
      <rect x={x - 19} y={y - 10} width={38} height={20} rx={4} fill="white" stroke={tone} strokeWidth={1.4} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace" fill={H_INK}>
        {text}
      </text>
    </g>
  );
}

export function PairsNotAll() {
  const s = useScene(4, [600, 1800, 1500, 2600]);
  const k = s.k;
  const cross = k === 3;
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <svg viewBox="0 0 300 118" role="img" aria-label="পরিমাণ (2, 1, 12) আর দাম (60, 180, 12): সোজা জোড়ায় 444, সব আড়াআড়ি গুণে 3,780" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={298} height={116} rx={10} fill="white" stroke="#cbd5e1" />
        {GROCERY.map((g, i) => (
          <text key={g} x={X2_X[i]} y={16} textAnchor="middle" fontSize={9} fill="#475569">
            {g}
          </text>
        ))}
        <text x={10} y={X2_TOP + 4} fontSize={9} fill="#475569">
          পরিমাণ
        </text>
        <text x={10} y={X2_BOT + 4} fontSize={9} fill="#475569">
          দাম
        </text>
        {k >= 1 &&
          X2_X.map((x, i) => (
            <g key={`s${i}`} style={{ opacity: cross ? 0.25 : 1 }} className="transition-opacity duration-500 motion-reduce:transition-none">
              <Draw d={`M${x} ${X2_TOP + 10}V${X2_BOT - 10}`} strokeWidth={2.4} delay={i * 250} className="stroke-[#2563eb]" />
              {!cross && (
                <text x={x + 5} y={68} fontSize={10} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8">
                  {QTY[i] * PRICE[i]}
                </text>
              )}
            </g>
          ))}
        {cross &&
          X2_X.flatMap((x, i) =>
            X2_X.map((xb, j) =>
              i === j ? null : (
                <Draw key={`c${i}${j}`} d={`M${x} ${X2_TOP + 10}L${xb} ${X2_BOT - 10}`} strokeWidth={i === 2 && j === 0 ? 2.6 : 1.2} delay={(i * 2 + j) * 80} className={i === 2 && j === 0 ? "stroke-[#dc2626]" : "stroke-[#f87171]"} />
              ),
            ),
          )}
        {X2_X.map((x, i) => (
          <X2_Chip key={`q${i}`} x={x} y={X2_TOP} text={`${QTY[i]}`} tone="#b45309" />
        ))}
        {X2_X.map((x, i) => (
          <X2_Chip key={`p${i}`} x={x} y={X2_BOT} text={`${PRICE[i]}`} tone="#1d4ed8" />
        ))}
        {(k === 2 || k === 4) && (
          <text key="ok" x={266} y={70} textAnchor="middle" fontSize={17} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#15803d" className={POP}>
            444
          </text>
        )}
        {cross && (
          <g className={FADE}>
            <text x={266} y={58} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill="#b91c1c">
              15 × 252
            </text>
            <text x={266} y={76} textAnchor="middle" fontSize={14} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#b91c1c">
              3,780
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the name, built. The
//      Check's (1, 2) and (3, 4) worked slot by slot to 11, the same recipe
//      for n slots, folded into a Σ, and last the dot in the middle, u · v.

const X3_SAY = [
  "Check-এর দুইটা list, u আর v।",
  "ঘরে ঘরে গুণ, তারপর যোগ: হাতে একটা সংখ্যা, 11।",
  "ঘর যতগুলোই হোক, একই নিয়ম, n নম্বর ঘর পর্যন্ত।",
  "Σ দিয়ে ছোট করে লেখা: i এক থেকে n, সব যোগ।",
  "মাঝখানে একটা ফোঁটা, u · v। নাম তাই dot product।",
];

export function DotName() {
  const s = useScene(4, [600, 2200, 2200, 2200]);
  const k = s.k;
  const dotted = k >= 4 && <span className={`${POP} inline-block text-cat-amber`}>u · v =</span>;
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <div className="mx-auto w-full max-w-xs space-y-1 text-center font-mono text-[0.95rem]">
        <div>
          u = (1, 2)&nbsp;&nbsp; v = (3, 4)
        </div>
        {k >= 1 && (
          <div className={FADE}>
            1 × 3 + 2 × 4 = <b>11</b>
          </div>
        )}
        {k >= 2 && (
          <div className={FADE}>
            {dotted} u<sub>1</sub>v<sub>1</sub> + u<sub>2</sub>v<sub>2</sub> + … + u<sub>n</sub>v<sub>n</sub>
          </div>
        )}
        {k >= 3 && (
          <div className={FADE}>
            {dotted} Σ u<sub>i</sub>v<sub>i</sub>
          </div>
        )}
        {k >= 4 && (
          <div className={`${POP} mx-auto mt-1 inline-block rounded-full bg-cat-amber/15 px-3 font-sans text-sm font-bold`}>dot product</div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: the দোকানদার 's joke (read it
//      backwards and the bill drops), মামী laughing, and a খদ্দের stepping up
//      with a four-item ফর্দ against the three-price card. Nothing is run.

export function UltoJoke({}: Story) {
  const s = useScene(4, [600, 2400, 1400, 1500]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="দোকানদার  মজা করে বলেন উল্টো হিসাবে বিল কমে, মামী হাসেন, এক খদ্দের চার জিনিসের ফর্দ (2, 1, 12, 3) দেখান">
        <S2_Shop talk={k === 1} prices />
        <Person who="fahim" x={60} y={G} mood={k >= 2 ? "happy" : "plain"} label />
        <Person who="mami" x={110} y={G} mood={k >= 2 ? "happy" : "plain"} arm={k === 2 ? "wave" : "down"} label />
        {k === 1 && <Bubble x={S2_SHOP} y={G - 66} side="left" lines={["উল্টো দিক থেকে গুনলে", "বিল কমে যায়!"]} />}
        <Person who="som" x={k >= 3 ? 168 : -40} y={G} walking={k === 3} ms={1500} arm={k >= 4 ? "hold" : "down"} />
        <H_Name x={k >= 3 ? 168 : -40} text="খদ্দের" ms={1500} />
        {k >= 4 && <CastCard x={182} y={G - 44} text="(2, 1, 12, 3)" tone="coral" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's first paragraph, no task: each pair turns
//      round, 2 × 60 into 60 × 2, and every product stays put, so u · v = v · u.

const X4_PAIRS = QTY.map((q, i) => [q, PRICE[i]]);
const X4_SAY = [
  "প্রতিটা জোড়ায় আগে পরিমাণ, পরে দাম।",
  "এবার প্রতিটা জোড়া উল্টো করি: আগে দাম, পরে পরিমাণ।",
  "গুণফল একটাও বদলালো না। 60 × 2 আর 2 × 60 তো একই।",
  "তাই যোগফলও একই, u · v = v · u। বিল কমলো না।",
];

export function SwapSame() {
  const s = useScene(3, [600, 1800, 1800]);
  const k = s.k;
  const flip = k >= 1;
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <div className="mx-auto w-full max-w-[17rem] space-y-1">
        {X4_PAIRS.map(([a, b], i) => (
          <div key={GROCERY[i]} className="grid grid-cols-[2.4rem_3rem_1.2rem_3rem_1.4rem_3rem] items-baseline text-center">
            <span className="text-left text-sm text-muted">{GROCERY[i]}</span>
            <span
              style={{ transform: flip ? "translateX(4.2rem)" : "none", transitionDelay: `${i * 150}ms` }}
              className="font-mono font-semibold text-cat-amber transition-transform duration-700 ease-in-out motion-reduce:transition-none"
            >
              {a}
            </span>
            <span className="font-mono text-muted">×</span>
            <span
              style={{ transform: flip ? "translateX(-4.2rem)" : "none", transitionDelay: `${i * 150}ms` }}
              className="font-mono font-semibold text-cat-blue transition-transform duration-700 ease-in-out motion-reduce:transition-none"
            >
              {b}
            </span>
            <span className="font-mono text-muted">=</span>
            <b className={`rounded font-mono transition-colors duration-500 motion-reduce:transition-none ${k >= 2 ? "bg-accent/15" : ""}`}>{a * b}</b>
          </div>
        ))}
        {k >= 3 && <div className={`${POP} border-t border-border pt-1 text-center font-mono font-bold`}>u · v = v · u = 444</div>}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's second paragraph, no task: (2, 3) against
//      (1, 4, 5). Two pairs join, 5 is left alone and the box jams; with a +
//      in the middle instead (3.1's vector add) the 5 is just as alone.

const X4B_X = [96, 152, 208];
const X4B_SAY = [
  "(2, 3) আর (1, 4, 5)। box ঘরে ঘরে জোড়া বাঁধে।",
  "প্রথম ঘর: 2 × 1।",
  "দ্বিতীয় ঘর: 3 × 4।",
  "তৃতীয় ঘরে 5 একা। কাকে দিয়ে গুণ করবে? box আটকে গেল।",
  "৩.১-এর vector যোগেও ঠিক এই আটকা: 5-এর সাথে যোগ করার কেউ নাই।",
];

export function NoMate() {
  const s = useScene(4, [600, 1300, 1300, 2000, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <svg viewBox="0 0 300 108" role="img" aria-label="(2, 3) আর (1, 4, 5): দুইটা জোড়া মেলে, 5-এর কোনো সঙ্গী নাই" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={298} height={106} rx={10} fill="white" stroke="#cbd5e1" />
        <text key={k >= 4 ? "plus" : "dot"} x={40} y={60} textAnchor="middle" fontSize={20} fontWeight={800} fontFamily="ui-monospace, monospace" fill={k >= 4 ? "#7c3aed" : "#b45309"} className={POP}>
          {k >= 4 ? "+" : "·"}
        </text>
        {k >= 1 && <Draw d={`M${X4B_X[0]} 34V74`} strokeWidth={2.4} className="stroke-[#2563eb]" />}
        {k >= 2 && <Draw d={`M${X4B_X[1]} 34V74`} strokeWidth={2.4} className="stroke-[#2563eb]" />}
        {k >= 3 && (
          <>
            <path d={`M${X4B_X[2]} 74V36`} strokeDasharray="3 3" strokeWidth={1.6} className={`${FADE} stroke-[#dc2626]`} />
            <text x={X4B_X[2]} y={30} textAnchor="middle" fontSize={16} fontWeight={800} fill="#dc2626" className={POP}>
              ?
            </text>
          </>
        )}
        {[2, 3].map((n, i) => (
          <X2_Chip key={`t${n}`} x={X4B_X[i]} y={24} text={`${n}`} tone="#b45309" />
        ))}
        {[1, 4, 5].map((n, i) => (
          <X2_Chip key={`b${n}`} x={X4B_X[i]} y={84} text={`${n}`} tone={k >= 3 && i === 2 ? "#dc2626" : "#1d4ed8"} />
        ))}
        {k >= 1 && k <= 2 && (
          <text key={k} x={264} y={58} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8" className={FADE}>
            {k === 1 ? "2" : "2 + 12"}
          </text>
        )}
        {k >= 3 && (
          <text x={264} y={58} textAnchor="middle" fontSize={10} fontWeight={700} fill="#dc2626" className={FADE}>
            আটকে গেল
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: leaving the হাট, ফাহিমের
//      phone buzzes. The result pops up on a screen, (80, 60, 90); ফাহিম
//      wonders how three go in as one; then the school's weights appear
//      beside them. No final number.

const S6_FAHIM = 218;
const S6_ROWS = [
  ["midterm", "80", "20%"],
  ["project", "60", "30%"],
  ["final", "90", "50%"],
];

export function ResultPing({}: Story) {
  const s = useScene(5, [600, 1300, 1600, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="হাট থেকে বের হতে ফাহিমের ফোনে result: 80, 60, 90; স্কুলের weight 20%, 30%, 50%">
        <Stall x={40} y={G} w={70} color="#f59e0b" />
        <Person who="mami" x={100} y={G} label />
        <Person who="mama" x={152} y={G} label />
        <Person who="fahim" x={S6_FAHIM} y={G} facing={-1} arm={k >= 1 ? "hold" : "down"} mood={k === 2 ? "happy" : k === 4 ? "puzzled" : "plain"} label />
        {k >= 1 && (
          <g className={POP}>
            <rect x={S6_FAHIM - 21} y={G - 50} width={6} height={10} rx={1.2} fill="#1e293b" />
            {k === 1 && <path d={`M${S6_FAHIM - 25} ${G - 52}q-3 5 0 10M${S6_FAHIM - 11} ${G - 52}q3 5 0 10`} fill="none" stroke="#1e293b" strokeWidth={1} />}
          </g>
        )}
        {k === 2 && <Bubble x={S6_FAHIM} y={G - 66} lines={["Result দিয়েছে!"]} />}
        {k >= 3 && (
          <g className={POP}>
            <rect x={14} y={14} width={140} height={60} rx={6} fill="white" stroke="#1e293b" strokeWidth={1.4} />
            <text x={22} y={27} fontSize={8.5} fontWeight={700} fill={H_INK}>
              ফাহিমের result
            </text>
            {k >= 5 && (
              <text x={132} y={27} textAnchor="middle" fontSize={8} fontWeight={700} fill="#1d4ed8">
                weight
              </text>
            )}
            {S6_ROWS.map(([name, mark, w], i) => (
              <g key={name}>
                <text x={22} y={41 + i * 12} fontSize={8.5} fill="#475569">
                  {name}
                </text>
                <text x={90} y={41 + i * 12} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill={H_INK}>
                  {mark}
                </text>
                {k >= 5 && (
                  <text x={132} y={41 + i * 12} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8" className={FADE}>
                    {w}
                  </text>
                )}
              </g>
            ))}
          </g>
        )}
        {k === 4 && <Bubble x={S6_FAHIM} y={G - 66} tone="think" lines={["report card-এ যাবে", "একটাই সংখ্যা?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the plain average is a
//      box too. One bar split into the three exams' shares: equal thirds give
//      76.7, the school's 20/30/50 give 79. Same marks, only the weights move.

const X6_TONE = ["bg-cat-amber/70", "bg-cat-coral/70", "bg-cat-violet/70"];
const X6_W = [
  [1 / 3, 1 / 3, 1 / 3],
  [0.2, 0.3, 0.5],
];
const X6_SAY = [
  "ফাহিমের তিনটা নম্বর। কোনটার ভাগ কত?",
  "সাধারণ average: সবার ভাগ সমান, ⅓ করে। হাতে 76.7।",
  "স্কুলের weight: final-এর ভাগ অর্ধেক, তাই 79।",
  "দুইটাই একই box, নম্বরের list · weight-এর list। বদলেছে শুধু weight।",
];

export function AverageIsBox() {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;
  const w = useTween(k >= 2 ? X6_W[1] : X6_W[0], 800);
  const lines = [
    { on: k === 1 || k >= 3, w: "(⅓, ⅓, ⅓)", out: "76.7" },
    { on: k >= 2, w: "(0.2, 0.3, 0.5)", out: "79" },
  ];
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      <div className="mx-auto w-full max-w-xs">
        <div className="flex h-11 overflow-hidden rounded-lg border border-border">
          {MARKS.map((m, i) => (
            <div
              key={EXAMS[i]}
              style={{ width: `${w[i] * 100}%` }}
              className={`flex flex-col items-center justify-center border-r border-white/60 leading-tight transition-colors duration-500 last:border-r-0 motion-reduce:transition-none ${k >= 1 ? X6_TONE[i] : "bg-foreground/5"}`}
            >
              <span className="font-mono text-sm font-bold">{m}</span>
              {k >= 1 && <span className="font-mono text-[0.7rem]">{k >= 2 ? X6_W[1][i] : "⅓"}</span>}
            </div>
          ))}
        </div>
        <div className="mt-0.5 flex justify-around text-[0.7rem] text-muted">
          {EXAMS.map((e) => (
            <span key={e}>{e}</span>
          ))}
        </div>
        <div className="mt-1.5 min-h-[2.8rem] space-y-0.5 text-center font-mono text-[0.8rem]">
          {lines.map(
            (l) =>
              l.on && (
                <div key={l.w} className={FADE}>
                  (80, 60, 90) · {l.w} = <b>{l.out}</b>
                </div>
              ),
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: the গরুর হাট. মামা wants a
//      milch cow; the দালাল boasts of thirty years and pulls out his card
//      (400, 4000, −5000); two cows are led up to the posts. No prices.

export function DalalCard({}: Story) {
  const s = useScene(4, [600, 1800, 2200, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="গরুর হাটে মামা দুধের গাই চান, দালাল ত্রিশ বছরের হিসাবের card (400, 4000, −5000) দেখান, সামনে দুইটা গাই">
        {[228, 290].map((x) => (
          <rect key={x} x={x - 32} y={G - 30} width={3} height={30} fill="#78350f" />
        ))}
        <H_Carry x={k >= 4 ? 228 : 400} y={G} ms={1500}>
          <H_Cow x={0} y={0} s={1.15} old />
        </H_Carry>
        <H_Carry x={k >= 4 ? 290 : 470} y={G} ms={1500}>
          <H_Cow x={0} y={0} s={0.9} />
        </H_Carry>
        <Person who="mama" x={48} y={G} arm={k === 1 ? "point" : "down"} label />
        <Person who="fahim" x={96} y={G} label />
        <Person who="samin" x={150} y={G} facing={-1} arm={k >= 3 ? "hold" : "down"} mood={k >= 2 ? "smug" : "plain"} />
        <H_Name x={150} text="দালাল" />
        {k === 1 && <Bubble x={48} y={G - 66} side="right" lines={["একটা দুধের গাই", "কিনতে চাই।"]} />}
        {k === 2 && <Bubble x={150} y={G - 66} lines={["আমার ত্রিশ বছরের", "হিসাব এই card-এ!"]} />}
        {k >= 3 && <CastCard x={150} y={G - 76} text="(400, 4000, −5000)" tone="coral" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: the card read aloud, one
//      slot per beat, an arrow up or down beside each sentence; last, the big
//      cow's ten years against the −5,000 slot.

const X7_LINES = [
  { up: true, text: "প্রতি কেজি ওজনে দাম বাড়ে 400।" },
  { up: true, text: "প্রতি লিটার দুধে বাড়ে 4,000।" },
  { up: false, text: "প্রতি বছর বয়সে কমে 5,000।" },
];
const X7_SAY = [
  "দালালের card-এ তিনটা ঘর।",
  "প্রথম ঘরটা বাক্যে পড়ি।",
  "দ্বিতীয় ঘর।",
  "শেষ ঘরটা minus, মানে দাম কমে।",
  "বড় গাইয়ের বয়স দশ বছর। ওজন আর দুধ বেশি হলেও, বয়সেই কাটা গেল 50,000।",
];

function X7_Arrow({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={`inline-block size-3.5 shrink-0 ${up ? "text-accent-text" : "text-danger"}`}>
      <path d={up ? "M6 10.5V2M2.5 5.5L6 2l3.5 3.5" : "M6 1.5V10M2.5 6.5L6 10l3.5-3.5"} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KnobSentences() {
  const s = useScene(4, [600, 1800, 1800, 1800, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X7_SAY, k)}>
      <div className="mx-auto w-full max-w-xs">
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border-2 border-cat-violet/40 bg-cat-violet/5 px-2 py-1 text-center">
          {KNOBS.map((w, i) => (
            <span
              key={KNOB_NAMES[i]}
              className={`rounded font-mono text-sm font-bold transition-colors duration-500 motion-reduce:transition-none ${w < 0 ? "text-danger" : ""} ${k === i + 1 ? "bg-cat-violet/20" : ""}`}
            >
              {w > 0 ? `+${num(w)}` : num(w)}
            </span>
          ))}
        </div>
        <div className="mt-2 min-h-[5.6rem] space-y-0.5 text-sm">
          {X7_LINES.map(
            (l, i) =>
              k > i && (
                <div key={l.text} className={`${FADE} flex items-center gap-1.5`}>
                  <X7_Arrow up={l.up} />
                  {l.text}
                </div>
              ),
          )}
          {k >= 4 && (
            <div className={`${POP} mt-1 text-center font-mono font-bold text-danger`}>10 × (−5,000) = −50,000</div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the card as three radio
//      knobs. The small young cow x = (200, 5, 3) through the box gives
//      85,000; turn the milk knob from 4,000 to 6,000 (the Check's change)
//      and the same cow comes out at 95,000.

const X8_X = [52, 150, 248];
const X8_NAMES = ["ওজন", "দুধ", "বয়স"];
const X8_COW = [200, 5, 3];
const X8_SAY = [
  "দালালের card-এর তিনটা সংখ্যা, তিনটা knob।",
  "গাইয়ের তথ্য x আর knob-এর list w, box এ দিলেই দাম।",
  "দুধের knob ঘোরালাম, 4,000 থেকে 6,000।",
  "গাই একই আছে, দাম বদলে গেল। knob-গুলোই model-এর weights।",
];

export function RadioKnobs() {
  const s = useScene(3, [600, 2000, 1800, 2200]);
  const k = s.k;
  const w = k >= 2 ? [400, 6000, -5000] : KNOBS;
  return (
    <Scene scene={s} caption={say(X8_SAY, k)}>
      <svg viewBox="0 0 300 96" role="img" aria-label="তিনটা knob: ওজন 400, দুধ 4,000 থেকে 6,000, বয়স −5,000" className="mx-auto block h-auto w-full max-w-[17rem]">
        <rect x={1} y={1} width={298} height={94} rx={10} fill="white" stroke="#cbd5e1" />
        {X8_X.map((cx, i) => {
          const turned = i === 1 && k >= 2;
          return (
            <g key={X8_NAMES[i]}>
              <circle cx={cx} cy={36} r={20} fill="#f1f5f9" stroke={turned ? "#7c3aed" : "#64748b"} strokeWidth={turned ? 2.4 : 1.4} />
              <g style={{ transformOrigin: `${cx}px 36px`, transform: `rotate(${(w[i] / 6000) * 130}deg)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
                <path d={`M${cx} 36V20`} stroke={w[i] < 0 ? "#dc2626" : H_INK} strokeWidth={3} strokeLinecap="round" />
              </g>
              <circle cx={cx} cy={36} r={3} fill={H_INK} />
              <text x={cx} y={70} textAnchor="middle" fontSize={9} fill="#475569">
                {X8_NAMES[i]}
              </text>
              <text key={w[i]} x={cx} y={85} textAnchor="middle" fontSize={10.5} fontWeight={800} fontFamily="ui-monospace, monospace" fill={w[i] < 0 ? "#dc2626" : turned ? "#7c3aed" : H_INK} className={FADE}>
                {w[i] > 0 ? `+${num(w[i])}` : num(w[i])}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 min-h-[1.5rem] text-center font-mono text-sm">
        <span className="text-muted">x = {tupN(X8_COW)}</span>
        {k >= 1 && (
          <span key={k >= 3 ? "b" : "a"} className={`${POP} ml-3 inline-block`}>
            w · x = <b className={k >= 3 ? "text-cat-violet" : ""}>{num(dot(w, X8_COW))}</b>
          </span>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for screen 9's setup, no task: the two sacks (10, 2) and
//      (5, 3) by the van, room on it for only one, and মামী's dare. The box
//      is not run.

export function MamiDare({}: Story) {
  const s = useScene(4, [600, 1500, 1500, 2000, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="দুইটা বস্তা (10, 2) আর (5, 3), ভ্যানে একটার জায়গা, মামী box দিয়ে এক বস্তা করতে বলেন">
        <H_Van x={206} y={G} />
        {k >= 2 && (
          <g className={POP}>
            <H_Carry x={241} y={G - 32}>
              <H_Sack ghost />
            </H_Carry>
          </g>
        )}
        <H_Carry x={138} y={G}>
          <H_Sack />
        </H_Carry>
        <H_Carry x={186} y={G}>
          <H_Sack />
        </H_Carry>
        {k >= 1 && (
          <>
            <CastCard x={134} y={G - 40} text="(10, 2)" tone="amber" />
            <CastCard x={188} y={G - 40} text="(5, 3)" tone="amber" />
          </>
        )}
        <Person who="mama" x={40} y={G} mood={k >= 4 ? "puzzled" : "plain"} label />
        <Person who="mami" x={92} y={G} mood={k >= 3 ? "smug" : "plain"} arm={k >= 4 ? "point" : "down"} label />
        {k === 3 && <Bubble x={92} y={G - 66} lines={["তোর box তো", "সব পারে।"]} />}
        {k === 4 && <Bubble x={92} y={G - 66} lines={["দে, box দিয়ে", "এক বস্তা করে দে!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for screen 9's first paragraph, no task: the new sack has two
//      slots, চাল and ডাল. The box's one number, 56, has nowhere to sit; slot
//      by slot adding fills both, (15, 5).

const X9_SAY = [
  "নতুন বস্তার খবর দুইটা: চাল কত, ডাল কত।",
  "box দেয় একটাই সংখ্যা, 56। কোন ঘরে বসবে?",
  "ঘরে ঘরে যোগ: চাল 10 + 5 = 15।",
  "ডাল 2 + 3 = 5। বস্তা ভরলো একটা list দিয়ে, (15, 5)।",
];

function X9_Sack({ children, tone = "border-cat-amber/50 bg-cat-amber/10" }: { children: ReactNode; tone?: string }) {
  return <div className={`rounded-2xl rounded-t-[1.6rem] border-2 px-2.5 pt-2.5 pb-1.5 text-center ${tone}`}>{children}</div>;
}

export function SackNeedsTwo() {
  const s = useScene(3, [600, 2000, 1800, 2200]);
  const k = s.k;
  const slot = (name: string, v: number, on: boolean) => (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-muted">{name}</span>
      {on ? <b className={`${POP} inline-block font-mono`}>{v}</b> : <span className="font-mono text-muted">__</span>}
    </div>
  );
  return (
    <Scene scene={s} caption={say(X9_SAY, k)}>
      <div className="flex items-center justify-center gap-2">
        {SACKS.map((sk, i) => (
          <X9_Sack key={i}>
            <div className="font-mono text-sm font-bold">{tupN(sk)}</div>
          </X9_Sack>
        ))}
        <svg viewBox="0 0 20 12" aria-hidden="true" className="w-5 shrink-0 text-muted">
          <path d="M1 6h16M13 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="relative">
          <X9_Sack tone={k >= 3 ? "border-accent bg-accent/10 border-solid" : "border-dashed border-border"}>
            <div className="w-20 space-y-0.5">
              {slot("চাল", 15, k >= 2)}
              {slot("ডাল", 5, k >= 3)}
            </div>
          </X9_Sack>
          {k === 1 && (
            <span className={`${POP} absolute -top-3 -right-3 rounded-full bg-danger px-2 font-mono text-sm font-bold text-white`}>56 ?</span>
          )}
        </div>
      </div>
      <div className="mt-2 min-h-[1.4rem] text-center font-mono text-sm">
        {k === 1 && <span className={FADE}>10 × 5 + 2 × 3 = 56</span>}
        {k === 2 && <span className={FADE}>10 + 5 = 15</span>}
        {k >= 3 && <span className={FADE}>(10, 2) + (5, 3) = (15, 5)</span>}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9¾ · A figure for screen 9's second paragraph, no task: 3.7's open question,
//      answered. Multiply slot by slot and stop: (50, 6), a list with no
//      meaning. Carry on and add: one number, 56. That is the useful product.

const X9B_SAY = [
  "৩.৭-এর প্রশ্ন: দুইটা vector কি গুণ করা যায়?",
  "ঘরে ঘরে গুণ করে থামলে পাওয়া যায় একটা list, (50, 6)।",
  "চাল গুণ চাল, 50? এর তেমন কোনো মানে নাই।",
  "গুণ করে যোগ করলে হাতে একটা সংখ্যা। কাজের গুণ এটাই।",
];

export function MultiplyThenAdd() {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X9B_SAY, k)}>
      <div className="mx-auto w-full max-w-xs space-y-1 text-center">
        <div className="font-mono font-semibold">(10, 2) &nbsp;(5, 3)</div>
        {k >= 1 && (
          <div className={`${FADE} flex items-center justify-center gap-2`}>
            <span className="text-xs text-muted">ঘরে ঘরে গুণ</span>
            <span className={`font-mono font-bold transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "opacity-45 line-through" : ""}`}>(50, 6)</span>
            {k >= 2 && <span className={`${POP} rounded-full bg-foreground/10 px-2 text-xs`}>মানে?</span>}
          </div>
        )}
        {k >= 3 && (
          <div className={`${FADE} flex items-center justify-center gap-2`}>
            <span className="text-xs text-muted">তারপর যোগ</span>
            <span className="font-mono">50 + 6 =</span>
            <b className={`${POP} inline-block font-mono text-lg text-cat-amber`}>56</b>
            <span className="rounded-full bg-cat-amber/15 px-2 text-xs font-semibold">একটা সংখ্যা</span>
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11a · A story scene for screen 11's setup, no task: the উঠান. Shiku has
//       chalked a grid and drawn (3, 4) on it; ফাহিম and মামী come in; মামী
//       says length needs a tape, ফাহিম has his idea: the same arrow on both
//       sides of the box. No 25, no 5.

/** a chalk grid lying flat on the উঠান: x runs right, y runs back and to the right */
const S11_O: XY = [150, 177];
const S11_P = ([x, y]: XY): XY => [S11_O[0] + x * 16 + y * 4, S11_O[1] - y * 4];

export function ShikuYard({}: Story) {
  const s = useScene(4, [600, 1500, 1600, 2400, 2400]);
  const k = s.k;
  const line = (a: XY, b: XY) => `M${S11_P(a).join(" ")}L${S11_P(b).join(" ")}`;
  const tip = S11_P([3, 4]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="উঠানে Shiku চকে ঘর কেটে arrow (3, 4) এঁকেছে; মামী বলেন length মাপতে ফিতা লাগে, ফাহিম একই arrow box এর দুই দিকে দেয়">
        <Tree x={26} y={G} s={0.9} />
        <g stroke="white" strokeOpacity={0.75} strokeWidth={0.8}>
          {[0, 1, 2, 3, 4, 5].map((x) => (
            <path key={`v${x}`} d={line([x, 0], [x, 4])} />
          ))}
          {[0, 1, 2, 3, 4].map((y) => (
            <path key={`h${y}`} d={line([0, y], [5, y])} />
          ))}
        </g>
        {k >= 2 && (
          <g className={FADE}>
            <Draw d={line([0, 0], [3, 4])} strokeWidth={2.2} className="stroke-[#7c3aed]" />
            <circle cx={tip[0]} cy={tip[1]} r={2} fill="#7c3aed" />
          </g>
        )}
        <Robot x={282} y={G + 4} />
        {k >= 2 && <CastCard x={282} y={G - 50} text="(3, 4)" tone="blue" />}
        <Person who="fahim" x={k >= 1 ? 62 : -30} y={G} walking={k === 1} ms={1400} mood={k >= 4 ? "happy" : "plain"} arm={k >= 4 ? "hold" : "down"} label={k >= 1} />
        <Person who="mami" x={k >= 1 ? 116 : -70} y={G} walking={k === 1} ms={1400} arm={k === 3 ? "point" : "down"} label={k >= 1} />
        {k === 3 && <Bubble x={116} y={G - 66} lines={["length মাপতে লাগে ফিতা।", "box এখানে কী করবে?"]} />}
        {k >= 4 && <CastCard x={76} y={G - 76} text="(3, 4) · (3, 4)" tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 11½ · A figure for screen 11's explanation, no task: v · v as tiles. 3 × 3
//       lays a 3-by-3 square, 4 × 4 a 4-by-4 one; 9 + 16 = 25 tiles, and
//       3.4's root makes it 5.

const X11_T = 9;
const X11_SAY = [
  "একই arrow, box এর দুই দিকে: (3, 4) · (3, 4)।",
  "প্রথম ঘর নিজের সাথে গুণ: 3 × 3, মানে 3-এর বর্গ, 9 টা ঘর।",
  "দ্বিতীয় ঘরও: 4 × 4, 16 টা ঘর।",
  "যোগ 25, length এর  বর্গ। ৩.৪-এর মতো শেষে root: √25 = 5।",
];

function X11_Square({ x, y, n, fill }: { x: number; y: number; n: number; fill: string }) {
  return (
    <g className={POP}>
      {Array.from({ length: n * n }, (_, i) => (
        <rect key={i} x={x + (i % n) * X11_T} y={y - (Math.floor(i / n) + 1) * X11_T} width={X11_T - 1} height={X11_T - 1} rx={1} fill={fill} />
      ))}
    </g>
  );
}

export function SelfSquares() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X11_SAY, k)}>
      <svg viewBox="0 0 300 100" role="img" aria-label="3 × 3 = 9 আর 4 × 4 = 16 টাইল, যোগ 25, root 5" className="mx-auto block h-auto w-full max-w-[17rem]">
        <rect x={1} y={1} width={298} height={98} rx={10} fill="white" stroke="#cbd5e1" />
        <text x={150} y={17} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace" fill={H_INK}>
          (3, 4) · (3, 4)
        </text>
        {k >= 1 && <X11_Square x={34} y={78} n={3} fill="#60a5fa" />}
        {k >= 2 && <X11_Square x={104} y={78} n={4} fill="#a78bfa" />}
        {k >= 1 && (
          <text x={47} y={92} textAnchor="middle" fontSize={9.5} fontFamily="ui-monospace, monospace" fill="#1d4ed8" className={FADE}>
            3 × 3 = 9
          </text>
        )}
        {k >= 2 && (
          <text x={122} y={92} textAnchor="middle" fontSize={9.5} fontFamily="ui-monospace, monospace" fill="#6d28d9" className={FADE}>
            4 × 4 = 16
          </text>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <text x={236} y={52} textAnchor="middle" fontSize={11} fontFamily="ui-monospace, monospace" fill={H_INK}>
              9 + 16 = 25
            </text>
            <text x={236} y={74} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#15803d" className={POP}>
              √25 = 5
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11¾ · A figure for screen 11's second paragraph, no task: the sign. With
//       itself every slot is a square, never below zero, even (−3) × (−3);
//       two different arrows can go negative. When? Left as the question.

const X11B_SAY = [
  "নিজের সাথে box মানে প্রতিটা ঘরের বর্গ।",
  "minus-ও নিজের সাথে গুণ হলে plus: (−3) × (−3) = 9। তাই v · v কখনো negative না।",
  "কিন্তু দুইটা আলাদা arrow দিলে উত্তর negative হতেই পারে।",
  "সেটা কবে হয়? পরের journey-র গল্প।",
];

export function SignQuestion() {
  const s = useScene(3, [600, 2400, 2200, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X11B_SAY, k)}>
      <div className="mx-auto w-full max-w-xs space-y-1.5 font-mono text-sm">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-foreground/5 px-2 py-1">
          <span>v · v</span>
          <span className="font-sans text-xs text-muted">বর্গের যোগ</span>
        </div>
        {k >= 1 && (
          <div className={`${FADE} flex items-center justify-between gap-2 px-2`}>
            <span>(−3, 4) · (−3, 4) = 9 + 16</span>
            <b className="flex items-center gap-1 text-accent-text">
              25 <H_Mark ok />
            </b>
          </div>
        )}
        {k >= 2 && (
          <div className={`${FADE} flex items-center justify-between gap-2 px-2`}>
            <span>(3, 4) · (−4, 1) = −12 + 4</span>
            <b className="text-danger">−8</b>
          </div>
        )}
        {k >= 3 && <div className={`${POP} text-center font-sans text-base font-bold text-cat-amber`}>কবে?</div>}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 12a · A story scene for screen 12's setup, no task: at the জিলাপির দোকান
//       মামী sets the last test: five new jobs, and ফাহিম must say which are
//       the box's. Five blank cards; none is sorted.

export function JilapiDare({}: Story) {
  const s = useScene(4, [600, 1500, 2200, 2400, 1600]);
  const k = s.k;
  const on = k >= 1;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="জিলাপির দোকানের সামনে মামী ফাহিমকে পাঁচটা নতুন কাজ দেন, কোনগুলো box এর কাজ বলতে">
        <Stall x={258} y={G} w={84} sign="জিলাপি" color="#f97316" />
        <H_Carry x={248} y={G - 28}>
          <H_Jilapi />
        </H_Carry>
        <Person who="fahim" x={on ? 64 : 10} y={G} walking={k === 1} ms={1400} mood={k >= 3 ? "puzzled" : "plain"} label />
        <Person who="mama" x={on ? 116 : 50} y={G} walking={k === 1} ms={1400} label />
        <Person who="mami" x={on ? 176 : 92} y={G} facing={k >= 2 ? -1 : 1} walking={k === 1} ms={1400} mood={k >= 2 ? "smug" : "plain"} arm={k >= 2 ? "point" : "down"} label />
        {k === 2 && <Bubble x={176} y={G - 66} lines={["ঠিক আছে, পাঁচটা", "নতুন কাজ দিচ্ছি।"]} />}
        {k === 3 && <Bubble x={176} y={G - 66} lines={["কোনগুলো box এর কাজ,", "তুই নিজে বল!"]} />}
        {k >= 4 && [0, 1, 2, 3, 4].map((i) => <CastCard key={i} x={40 + i * 40} y={42} text="?" tone="blue" w={26} />)}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 12½ · A figure for screen 12's explanation, no task: the two questions as
//       gates. The van fare passes both and goes in the box, 160 টাকা; the
//       day's shopping fails the first (its answer is a list) and goes to
//       plain adding.

const X12_Q = ["উত্তরটা কি একটাই সংখ্যা?", "ঘরগুলো কি জোড়ায় জোড়ায় মেলে?"];
const X12_SAY = [
  "box এর কাজ চেনার দুইটা প্রশ্ন।",
  "ভ্যান ভাড়া: উত্তর একটা সংখ্যা, টাকা। প্রথম প্রশ্নে হ্যাঁ।",
  "কিলোমিটারের সাথে কিলোমিটারের রেট, বস্তার সাথে বস্তার রেট। দুইটাতেই হ্যাঁ, box চালান।",
  "সারাদিনের কেনাকাটা: উত্তর নিজেই একটা list, (5, 2)। প্রথম প্রশ্নেই না।",
  "উত্তর list হলে সেটা যোগ বা stretch-এর কাজ, box এর না।",
];

export function TwoQuestions() {
  const s = useScene(4, [600, 2000, 2600, 2400, 2000]);
  const k = s.k;
  const van = k >= 1 && k <= 2;
  const day = k >= 3;
  const marks: (boolean | null)[] = day ? [false, null] : [k >= 1 ? true : null, k >= 2 ? true : null];
  return (
    <Scene scene={s} caption={say(X12_SAY, k)}>
      <div className="mx-auto w-full max-w-xs">
        <div className="min-h-[1.6rem] text-center text-sm font-semibold">
          {van && (
            <span key="van" className={`${POP} inline-block rounded-full bg-cat-blue/10 px-2.5`}>
              ভ্যান ভাড়া
            </span>
          )}
          {day && (
            <span key="day" className={`${POP} inline-block rounded-full bg-cat-violet/10 px-2.5`}>
              সারাদিনের কেনাকাটা
            </span>
          )}
        </div>
        <div className="mt-1 space-y-1">
          {X12_Q.map((q, i) => (
            <div
              key={q}
              className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1 text-sm transition-opacity duration-500 motion-reduce:transition-none ${
                day && i === 1 ? "opacity-35" : ""
              } border-border`}
            >
              <span>{q}</span>
              {marks[i] !== null && (
                <span key={`${k >= 3}${i}`} className={`${POP} inline-flex`}>
                  <H_Mark ok={marks[i] === true} />
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-1.5 min-h-[1.5rem] text-center text-sm">
          {k === 2 && (
            <span className={`${FADE} font-mono`}>
              (6, 4) · (20, 10) = <b>160</b>
            </span>
          )}
          {k >= 4 && (
            <span className={`${FADE}`}>
              <span className="font-mono">(3, 1) + (2, 1) = (5, 2)</span> <span className="text-muted">যোগের কাজ</span>
            </span>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 14a · A story scene for the finale, no task: the bet paid. মামী buys the
//       jilapi and hands it over; মামা still has to heave the sack onto the van.

export function JilapiPaid({}: Story) {
  const s = useScene(4, [600, 1500, 1500, 1600, 1600]);
  const k = s.k;
  const plate: XY = k >= 2 ? [143, G - 44] : [127, G - 44];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="মামী জিলাপি খাওয়ালেন, আর মামা বস্তাটা ভ্যানে তুললেন">
        <Stall x={50} y={G} w={76} sign="জিলাপি" color="#f97316" />
        <H_Van x={214} y={G} />
        <H_Carry x={k >= 3 ? 250 : 184} y={k >= 3 ? G - 32 : G} ms={1000}>
          <H_Sack />
        </H_Carry>
        <Person who="mami" x={110} y={G} arm={k === 1 ? "hold" : "down"} mood={k >= 4 ? "happy" : "plain"} label />
        <Person who="fahim" x={160} y={G} facing={-1} arm={k >= 2 ? "hold" : "down"} mood={k >= 2 ? "happy" : "plain"} label />
        {k >= 1 && (
          <H_Carry x={plate[0]} y={plate[1]} ms={1000}>
            <g className={POP}>
              <H_Jilapi />
            </g>
          </H_Carry>
        )}
        <Person who="mama" x={k >= 3 ? 230 : 206} y={G} facing={k >= 3 ? 1 : -1} walking={k === 3} ms={1000} arm={k === 3 ? "hold" : "down"} mood={k >= 4 ? "sad" : k >= 2 ? "happy" : "plain"} label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 14b · A story scene for the finale's last paragraph, no task: on the way
//       home the van sinks in the mud. মামা shouts for everyone to push, five
//       people push from both sides, and the van doesn't budge. Who helps is
//       4.2's question, so nobody is judged here.

const S14_PUSH: { who?: "mama" | "fahim" | "mami"; look?: "karim" | "som"; name?: string; x: number; facing: 1 | -1 }[] = [
  { who: "mama", x: 30, facing: 1 },
  { who: "fahim", x: 76, facing: 1 },
  { look: "karim", name: "চাচা", x: 226, facing: -1 },
  { who: "mami", x: 262, facing: -1 },
  { look: "som", name: "রফিক", x: 298, facing: -1 },
];

export function VanInMud({}: Story) {
  const s = useScene(5, [600, 1500, 1200, 2000, 1600, 1600]);
  const k = s.k;
  const sunk = k >= 2 ? 5 : 0;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="বাড়ি ফেরার পথে ভ্যান কাদায় আটকে গেল; মামা সবাইকে ঠেলতে বলেন, পাঁচজন দুই দিক থেকে ঠেলে, ভ্যান নড়ে না">
        <rect y={G - 3} width={320} height={12} fill="#d6c08f" />
        <ellipse cx={156} cy={G + 2} rx={62} ry={7} fill="#6b4f2a" />
        <H_Carry x={k >= 1 ? 100 : -130} y={sunk} ms={k === 1 ? 1500 : 600}>
          <H_Van x={0} y={G} />
          {(k === 1 || k === 2) && <Person who="mama" x={86} y={G - 22} scale={0.85} />}
        </H_Carry>
        {k >= 2 && <path d="M104 150q-6 -7 -12 -3M198 150q6 -7 12 -3" fill="none" stroke="#6b4f2a" strokeWidth={2} strokeLinecap="round" className={FADE} />}
        {k === 3 && <Person who="mama" x={40} y={G} mood="shout" arm="wave" />}
        {k === 3 && <Bubble x={40} y={G - 66} side="right" lines={["সবাই ঠেলো!", "যে যেদিক থেকে পারো!"]} />}
        {k >= 4 &&
          S14_PUSH.map((p) => (
            <g key={p.x} className={FADE}>
              <Person who={p.who ?? p.look ?? "karim"} x={p.x} y={G} facing={p.facing} arm="point" mood={k >= 5 ? "puzzled" : "shout"} label={!!p.who} />
              {p.name && <H_Name x={p.x} text={p.name} />}
              <path d={`M${p.x + p.facing * 14} ${G - 38}h${p.facing * 9}m${-p.facing * 3} -3l${p.facing * 3} 3l${-p.facing * 3} 3`} fill="none" stroke="#dc2626" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
        {k >= 5 && (
          <text x={156} y={78} textAnchor="middle" fontSize={26} fontWeight={800} fill={H_INK} className={POP}>
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
  HaatBet: { start: {}, picked: { picks: [0, 1, 4] }, sealed: { picks: [0, 1, 4], sealed: true } },
  GroceryBill: { start: {}, half: { k: 2 }, done: { k: 4 } },
  NoPartner: { start: {}, swapped: { swapped: true }, jammed: { swapped: true, round: 2, jammed: true } },
  ReportCard: { start: {}, guessed: { guess: 0 }, ran: { guess: 0, ran: true }, flipped: { guess: 0, ran: true, card: 1, seen: [0, 1] } },
  CowPrice: { start: {}, guessed: { guess: 0 }, ran: { guess: 0, ran: true } },
  TwoSacks: { start: {}, boxed: { boxed: true }, wrong: { boxed: true, tried: 0 }, filled: { boxed: true, tried: 1 } },
  SelfDot: { start: {}, ran: { ran: true }, three: { ran: true, linked: true, ran3: true }, done: { ran: true, linked: true, ran3: true, got: true } },
  BoxOrNot: { start: {}, miss: { done: 1, miss: 1 }, some: { done: 3 }, all: { done: 5 } },
  // the story scenes and figures: `k` is the beat, the bare state is the last one
  HaatRoad: { start: { k: 0 }, fahim: { k: 2 }, bet: { k: 4 }, done: {} },
  BoxSteps: { start: { k: 0 }, mid: { k: 2 }, done: {} },
  MudiStall: { start: { k: 0 }, list: { k: 2 }, done: {} },
  PairsNotAll: { mid: { k: 2 }, cross: { k: 3 }, done: {} },
  DotName: { mid: { k: 2 }, done: {} },
  UltoJoke: { joke: { k: 1 }, done: {} },
  SwapSame: { start: { k: 0 }, done: {} },
  NoMate: { mid: { k: 2 }, jam: { k: 3 }, done: {} },
  ResultPing: { ping: { k: 1 }, think: { k: 4 }, done: {} },
  AverageIsBox: { avg: { k: 1 }, done: {} },
  DalalCard: { boast: { k: 2 }, done: {} },
  KnobSentences: { mid: { k: 2 }, done: {} },
  RadioKnobs: { start: { k: 1 }, done: {} },
  MamiDare: { sacks: { k: 2 }, done: {} },
  SackNeedsTwo: { box: { k: 1 }, done: {} },
  MultiplyThenAdd: { mid: { k: 2 }, done: {} },
  ShikuYard: { mami: { k: 3 }, done: {} },
  SelfSquares: { mid: { k: 1 }, done: {} },
  SignQuestion: { mid: { k: 2 }, done: {} },
  JilapiDare: { dare: { k: 3 }, done: {} },
  TwoQuestions: { van: { k: 2 }, done: {} },
  JilapiPaid: { plate: { k: 2 }, done: {} },
  VanInMud: { shout: { k: 3 }, done: {} },
};
