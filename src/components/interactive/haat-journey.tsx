"use client";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Speech, Ticks, pill, predictLook, primaryBtn, usePlay, useSeed, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, makeFrame, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";
import { Tape } from "./dimension-journey";
import { bn } from "./figure-kit";

// Screens for "Math for AI 4.1 — ঘরে ঘরে গুণ, হাটের হিসাব", told as a Journey.
//
// নাসিবের movie club-এর বন্ধ বাক্স (3.6), opened at the Friday হাট. মামা bets
// the box ("ঘরে ঘরে গুণ করে যোগ") can do all five of the day's jobs; মামী says
// it's a film trick fit only for shop bills. The reader seals their own bet,
// then the jobs come one by one: the grocery bill (the recipe, one number
// out), the দোকানি reading the lists the other way round and a list with no
// partner (order doesn't matter, lengths must match), ফাহিম's report card
// (weights), the দালাল's cow price with a negative knob (a linear model), the
// two sacks the box cannot pour together (it only ever returns one number),
// and Shiku's arrow put in both slots (v · v = ‖v‖²). Last, five new jobs
// sorted unaided. The finale's table settles the bet.
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
      {rows.length === 0 && <div className="py-1 text-center font-sans text-xs text-muted">বাক্স তৈরি</div>}
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
      <b className="font-semibold">বাক্স:</b>
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
    pass(`বাজি সিল হলো: আপনার হিসাবে বাক্স পারবে ${bn(picks.length)}টা কাজ। হাট ঘুরে একটা একটা করে মিলিয়ে দেখবো।`);
  };

  return (
    <>
      <BoxBadge />
      <div className="mt-3 text-sm font-medium text-muted">কোন কোন কাজ এই বাক্স দিয়ে হবে? যতগুলো মনে হয়, tap করুন।</div>
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
      <Task done={sealed}>যে কাজগুলো বাক্স দিয়ে হবে বলে মনে হয়, সেগুলো বেছে বাজিটা সিল করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The grocery bill. Guess the total the দোকানি said out loud, then run the
//     box a pair at a time: 120 + 180 + 144 = 444. The two tempting wrong
//     totals add everything, or add first and multiply after.

const QTY = [2, 1, 12];
const PRICE = [60, 180, 12];
const GROCERY = ["চাল", "তেল", "ডিম"];
const BILL_GUESS = ["267", "444", "3,780"];

export function GroceryBill() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [k, setK] = useSeed("k", 0);
  const over = k > QTY.length;

  const step = () => {
    const next = k + 1;
    setK(next);
    if (next > QTY.length) pass("পরিমাণের সাথে দাম, ঘরে ঘরে গুণ, তারপর সব যোগ: 444 টাকা। দোকানি সারাদিন এই বাক্সই চালান।");
  };

  return (
    <>
      <Lists
        rows={[
          ["ফর্দ: চাল কেজি, তেল লিটার, ডিম", QTY],
          ["দাম, টাকায়", PRICE],
        ]}
      />
      <div className="mt-3 text-sm font-medium text-muted">দোকানি মুখে মুখে বিল বললেন। কত টাকা বললেন বলে মনে হয়?</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {BILL_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="font-mono text-sm">{o}</span>
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={`${FADE} mt-3`}>
          <DotBox a={QTY} b={PRICE} k={k} names={GROCERY} unit=" টাকা" />
        </div>
      )}
      {guess !== null && !over && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={step} className={primaryBtn}>
            {k === 0 ? "প্রথম জোড়া গুণ করুন" : k < QTY.length ? "পরের জোড়া" : "সব যোগ করুন"}
          </button>
        </div>
      )}
      {over && guess !== null && guess !== 1 && (
        <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>
          {guess === 0 ? "উঁহু, আপনি সব সংখ্যা একসাথে যোগ করে ফেলেছেন। ডিমের সংখ্যা আর তেলের দাম যোগ করে কোনো মানে দাঁড়ায় না।" : "উঁহু, আগে যোগ আর পরে গুণ করলে ডিমের সংখ্যা চালের দামের সাথেও গুণ হয়ে যায়।"}
        </div>
      )}
      <Task done={over}>আগে একটা guess দিন, তারপর বাক্সটা এক জোড়া এক জোড়া করে চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Two tiny rounds at the counter. The দোকানি reads the price list first:
//     the same 444 (order doesn't matter). Then a customer brings four items
//     against a three-price card: পেঁয়াজ has no partner and the box jams.
//     Round 1 folds to a line when round 2 opens, so the widget stays short.

const QTY4 = [2, 1, 12, 3];
const SWAP_GUESS = ["বিল একই থাকবে", "বিল বদলে যাবে"];

export function NoPartner() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [round, setRound] = useSeed("round", 1);
  const [jammed, setJammed] = useSeed("jammed", false);

  const jam = () => {
    setJammed(true);
    pass("কে আগে গুণ হলো, তাতে কিছু যায় আসে না। কিন্তু দুই list-এ ঘরের সংখ্যা সমান না হলে বাক্স চলেই না।");
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
          <div className="mt-3 text-sm font-medium text-muted">দোকানি এবার উল্টো দিক থেকে পড়লেন। বিলের কী হবে?</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SWAP_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, guess !== null, 0)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {guess !== null && (
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
              ["দোকানির দামের card", PRICE],
            ]}
          />
          {!jammed ? (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={jam} className={primaryBtn}>
                বাক্সে দিন
              </button>
            </div>
          ) : (
            <div className={`${FADE} mt-3`}>
              <DotBox a={QTY4} b={PRICE} k={5} names={[...GROCERY, "পেঁয়াজ"]} />
              <div className="mt-2 text-center text-[0.95rem] text-danger">বাক্স আটকে গেল। পেঁয়াজের 3-কে কার সাথে গুণ করবো?</div>
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
      <Task done={jammed}>আগে বলুন উল্টো পড়লে বিল বদলায় কি না। তারপর পরের খদ্দেরের ফর্দটা বাক্সে দিন।</Task>
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
  { name: "project ভারী হলে", w: [0.2, 0.5, 0.3] },
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
    pass("নম্বর একই, শুধু weight বদলালো, আর final number 79 থেকে নেমে 73। যে পরীক্ষার weight বেশি, final number সেদিকে ঝোঁকে।");
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
                বাক্স চালান
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
      <Task done={done}>আগে একটা guess দিয়ে বাক্স চালান। তারপর weight-এর card বদলে দেখুন final number কোথায় সরে।</Task>
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
    play(8, () => pass("বয়সের knob-টা minus, প্রতি বছরে 5,000 টাকা কমে। দালালের পুরো হিসাবটাই গরুর তথ্য আর তার knob, বাক্সে দেওয়া।"));
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
                দুইটাই বাক্সে দিন
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
      <Task done={ran && !running}>আগে guess দিন কোন গাইয়ের দাম বেশি, তারপর দুইটাকেই দালালের card-এর সাথে বাক্সে দিন।</Task>
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
    if (i === 1) pass("বাক্স সবসময় একটাই সংখ্যা দেয়, আর একটা সংখ্যা দিয়ে বস্তা ভরে না। বস্তা মেলাতে লাগে list, মানে সেই পুরানো যোগ।");
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
            বাক্সে দিন
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
          <div className="mt-3 text-sm font-medium text-muted">বাক্স পারলো না। অন্য দুইটা চাল চেষ্টা করুন:</div>
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
          ["বাক্স চালানো", boxed],
          ["বস্তা ভরা", filled],
        ]}
      />
      <Task done={filled}>আগে দুই বস্তা বাক্সে দিয়ে দেখুন। তারপর যে চালে বস্তাটা ভরে, সেটা খুঁজে বের করুন।</Task>
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
    pass("একই arrow বাক্সের দুই দিকে দিলে বাক্স দেয় দৈর্ঘ্যের বর্গ: v · v = ‖v‖²। Root নিলেই দৈর্ঘ্য, 49 থেকে 7।");
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
                বাক্সে দিন
              </button>
            </div>
          ) : (
            <div className={FADE}>
              <div className="mt-3">
                <DotBox a={SHIKU} b={SHIKU} k={3} />
              </div>
              <div className="mt-3 text-sm font-medium text-muted">ফিতা বলছে 5, বাক্স বলছে 25। সম্পর্কটা কী?</div>
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
          <div className="mt-2 text-center text-sm text-accent-text">✓ 25 = 5 × 5, মানে বাক্স দিয়েছে দৈর্ঘ্যের বর্গ।</div>
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
                বাক্সে দিন
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
          {miss.r === 1 ? "উঁহু। 5-কে কী দিয়ে গুণ করলে 25 হয়? আর বাক্সের ভেতরে 3 × 3 আর 4 × 4-এর দিকে তাকান।" : "উঁহু। 49 হলো বর্গ, দৈর্ঘ্য না। কোন সংখ্যাকে নিজের সাথে গুণ করলে 49 হয়?"}
        </Nope>
      )}
      <Ticks
        items={[
          ["Shiku-র arrow", linked],
          ["3-ঘরের clue", got],
        ]}
      />
      <Task done={got}>Arrow-টাকে বাক্সের দুই দিকেই দিন, তারপর বাক্সের উত্তর আর ফিতার মাপ মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · এবার আপনার পালা. Five new jobs, one card at a time, into "বাক্সের কাজ"
//     or "বাক্সের কাজ না". Wrong tries bounce; each right one leaves its
//     reason behind, so the numbers actually get read.

const NEW_JOBS = [
  { t: "ভ্যান ভাড়া: গেলাম 6 কিলোমিটার, সাথে 4টা বস্তা। রেট কিলোমিটারে 20 টাকা, বস্তায় 10 টাকা।", yes: true, why: "(6, 4) · (20, 10) = 120 + 40 = 160 টাকা।" },
  { t: "সকালে কেনা (চাল, ডাল) = (3, 1), বিকেলে আরও (2, 1)। সারাদিনে মোট কী কী কেনা হলো?", yes: false, why: "উত্তরটা একটা list, (5, 2)। এটা পুরানো যোগের কাজ।" },
  { t: "ফাহিম মারলো 3টা চার, 2টা ছক্কা আর 10টা single। মোট কত রান?", yes: true, why: "(3, 2, 10) · (4, 6, 1) = 12 + 12 + 10 = 34 রান।" },
  { t: "Class-এর সবার (উচ্চতা, ওজন) card দ্বিগুণ করে দেখা।", yes: false, why: "এটা stretch, উত্তর আবার একটা card। বাক্স দেয় একটা সংখ্যা।" },
  { t: "ফর্দে (চাল, ডাল, তেল), কিন্তু দোকানির card-এ দাম আছে শুধু (চাল, ডাল)-এর।", yes: false, why: "তেলের জোড়া নাই। দুই list-এ ঘর সমান না হলে বাক্স চলে না।" },
];
const JOB_BINS = ["বাক্সের কাজ", "বাক্সের কাজ না"];

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
    if (done + 1 === NEW_JOBS.length) pass("দুইটা list, ঘরে ঘরে জোড়া মেলে, আর উত্তর চাই একটা সংখ্যা: তবেই বাক্সের কাজ। উত্তর list হলে সেটা যোগ বা stretch-এর কাজ।");
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
        প্রতিটা কাজ বাক্স দিয়ে হবে কি না, ঠিক করে tap করুন ({bn(done)}/{bn(NEW_JOBS.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  HaatBet: { start: {}, picked: { picks: [0, 1, 4] }, sealed: { picks: [0, 1, 4], sealed: true } },
  GroceryBill: { start: {}, half: { guess: 2, k: 2 }, done: { guess: 2, k: 4 } },
  NoPartner: { start: {}, swapped: { guess: 0 }, jammed: { guess: 0, round: 2, jammed: true } },
  ReportCard: { start: {}, guessed: { guess: 0 }, ran: { guess: 0, ran: true }, flipped: { guess: 0, ran: true, card: 1, seen: [0, 1] } },
  CowPrice: { start: {}, guessed: { guess: 0 }, ran: { guess: 0, ran: true } },
  TwoSacks: { start: {}, boxed: { boxed: true }, wrong: { boxed: true, tried: 0 }, filled: { boxed: true, tried: 1 } },
  SelfDot: { start: {}, ran: { ran: true }, three: { ran: true, linked: true, ran3: true }, done: { ran: true, linked: true, ran3: true, got: true } },
  BoxOrNot: { start: {}, miss: { done: 1, miss: 1 }, some: { done: 3 }, all: { done: 5 } },
};
