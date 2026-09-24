"use client";

import { useState, type ReactNode } from "react";

import { Bubble, Building, Card as CastCard, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { BoxRun, dot, num } from "@/components/journey/box";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Ticks, pill, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";

// Screens for "Math for AI 4.8 — A million books, normalise once", told as a Journey.
//
// The village library kept machine B (cosine) in 4.7. Now the whole upazila's
// catalogue, ten lakh books, is coming onto its computer, and machine B does a
// box, a length, a root and a divide for every book on every search. আপুর ভাই
// claims B can be made as fast as A without changing one answer; the reader
// bets (SpeedBet). CostRace makes the cost felt (4 jobs a book against 1),
// SameLength shows the lengths never change between searches, ShelveOnce
// normalises each card once as it goes on the shelf, and BoxOnShelved finds
// the plain box on those cards giving machine B's numbers exactly, at machine
// A's speed. TipGap shows distance agrees (2 − 2 cos θ). YourCos is the
// unaided cosine of two shelved cards (0.96), TryShelve normalises a new book
// (6, 8, 0), and the ending closes the bet and hands over to 4.9 (attention).
//
// Screen 1 (RecallTwice) is the recall at the door: 4.7's lesson that machine
// B's score doesn't move when a book gets longer.
//
// After the screens come the story scenes (the pen drive, the brother
// shelving a card, Fahim's distance question, the night call) and the
// watch-only figures for each <Then>, numbered after their screen (2a, 2½, …).
//
// Tailwind only. Drawn "paper" uses fixed ink.

const len = (v: readonly number[]) => Math.hypot(...v);
const fix = (n: number, d: number) => {
  const s = Math.abs(n).toFixed(d);
  return n < 0 && Number(s) !== 0 ? `−${s}` : s;
};
/** a card's number: whole numbers plain, the rest to `d` places */
const cn = (x: number, d = 3) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(d));
const card = (v: readonly number[], d = 3) => `(${v.map((x) => cn(x, d)).join(", ")})`;

// Books as word counts: (মাছ, নৌকা, ধান). The query “মাছ” is (1, 0, 0).
const QUERY = [1, 0, 0];
const MB_BOOKS = [
  { id: "A", name: "মাছের ছোট note", short: "note", v: [2, 0, 0] },
  { id: "B", name: "মাছের মোটা বই", short: "মোটা বই", v: [20, 1, 0] },
  { id: "C", name: "নৌকা আর ধানের বই", short: "নৌকা-ধান", v: [3, 5, 4] },
];
const MB_UNIT = MB_BOOKS.map((b) => ({ ...b, u: b.v.map((x) => x / len(b.v)) }));
const cosQ = (v: readonly number[]) => dot(QUERY, v) / len(v);

// ---------------------------------------------------------------------------
// A search lane, shared by CostRace and BoxOnShelved: the machine's name, its
// jobs for one book as chips (the one being done lit while it runs), a bar,
// and the count of jobs done so far.

const LANE_BAR = { blue: "bg-cat-blue", coral: "bg-cat-coral", teal: "bg-cat-teal" } as const;

function MB_Lane({ name, jobs, lit, p, count, tone }: { name: string; jobs: string[]; lit: number | null; p: number; count: number; tone: keyof typeof LANE_BAR }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <b className="text-sm whitespace-nowrap">{name}</b>
          {jobs.map((j, i) => (
            <span
              key={j}
              className={`rounded-md px-1.5 py-0.5 text-[0.7rem] leading-none transition-colors duration-150 motion-reduce:transition-none ${
                lit === i ? "bg-cat-amber text-white" : "bg-foreground/8 text-muted"
              }`}
            >
              {j}
            </span>
          ))}
        </span>
        <span className="font-mono text-xs whitespace-nowrap tabular-nums">{num(count)} কাজ</span>
      </div>
      <span className="h-3 rounded-full bg-foreground/10">
        <span className={`block h-full rounded-full ${LANE_BAR[tone]}`} style={{ width: `${Math.min(1, p) * 100}%` }} />
      </span>
    </div>
  );
}

const B_JOBS = ["box", "length", "root", "ভাগ"];

// ---------------------------------------------------------------------------
// 1 · Recall at the door (4.7): the thick fish book doubled, (20, 1, 0) →
//     (40, 2, 0). What does machine B's score do? Picked as a picture of two
//     bars. Whatever is picked, the doubling plays: A's box goes 20 → 40, B's
//     cosine stays 0.999. A wrong pick leaves a dashed mark where it guessed.

const RC_GUESS = [
  { say: "দ্বিগুণ", before: 13, after: 26 },
  { say: "একই থাকবে", before: 20, after: 20 },
  { say: "অর্ধেক", before: 24, after: 12 },
];
const RC_RIGHT = 1;
const RC_MARK = [2, 1, 0.5]; // where each guess would put B's score, times 0.999

function RC_Pic({ before, after }: { before: number; after: number }) {
  return (
    <svg viewBox="0 0 44 32" aria-hidden="true" className="mx-auto block h-auto w-full max-w-[3rem]">
      <rect x={8} y={30 - before} width={10} height={before} rx={1.5} className="fill-current opacity-35" />
      <rect x={26} y={30 - after} width={10} height={after} rx={1.5} className="fill-current" />
      <path d="M2 30.5H42" strokeWidth={1} className="stroke-current opacity-50" />
    </svg>
  );
}

export function RecallTwice() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const [t] = useTween([pick === null ? 0 : 1], 1400);
  const a = 20 * (1 + t);
  const right = pick === RC_RIGHT;

  const choose = (i: number) => {
    setPick(i);
    if (i === RC_RIGHT) pass("Length বাড়লে machine B র score বদলায় না.");
    else setMiss(miss + 1);
  };

  return (
    <>
      <div className="mx-auto flex max-w-sm items-center gap-3">
        <svg viewBox="0 0 70 60" role="img" aria-label="মাছের মোটা বই, দ্বিগুণ মোটা হচ্ছে" className="block h-auto w-16 shrink-0">
          <rect x={10} y={6} width={30 + 16 * t} height={48} rx={2} fill="#1d4ed8" />
          <rect x={10} y={6} width={6 + 6 * t} height={48} fill="#1e3a8a" />
          <path d={`M${22 + 6 * t} 20h${14 + 10 * t}M${22 + 6 * t} 26h${10 + 8 * t}`} stroke="#bfdbfe" strokeWidth={2} />
        </svg>
        <div className="min-w-0">
          <div className="text-sm font-semibold">মাছের মোটা বই</div>
          <div key={t > 0.5 ? "b" : "a"} className={`${FADE} font-mono text-base`}>
            {t > 0.5 ? "(40, 2, 0)" : "(20, 1, 0)"}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-2 grid max-w-sm gap-2">
        <div className="grid grid-cols-[7rem_1fr_2.8rem] items-center gap-2 text-sm">
          <span className="text-xs text-muted">machine A, box</span>
          <span className="h-3 rounded-full bg-foreground/10">
            <span className="block h-full rounded-full bg-cat-coral" style={{ width: `${(a / 40) * 100}%` }} />
          </span>
          <b className="text-right font-mono">{Math.round(a)}</b>
        </div>
        <div className="grid grid-cols-[7rem_1fr_2.8rem] items-center gap-2 text-sm">
          <span className="text-xs text-muted">machine B, cosine</span>
          <span className="relative h-3 rounded-full bg-foreground/10">
            <span className="block h-full rounded-full bg-cat-teal" style={{ width: "99.9%" }} />
            {pick !== null && !right && (
              <span
                key={pick}
                className={`${FADE} absolute -top-1 h-5 border-l-2 border-dashed border-danger`}
                style={{ left: `${Math.min(RC_MARK[pick], 1.04) * 96}%` }}
              />
            )}
          </span>
          <b className="text-right font-mono">0.999</b>
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-muted">বইয়ের প্রতিটা সংখ্যা দ্বিগুণ হলে machine B র score কী হবে?</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {RC_GUESS.map((g, i) => (
          <Choice key={g.say} n={i} look={pick === i ? (right ? "right" : "wrong") : "idle"} disabled={right} onClick={() => choose(i)}>
            <span className="block">
              <RC_Pic before={g.before} after={g.after} />
              <span className="mt-0.5 block text-center text-xs">{g.say}</span>
            </span>
          </Choice>
        ))}
      </div>
      {pick !== null && !right && (
        <Nope key={miss}>দেখুন, দ্বিগুণ হলো machine A র box, 20 থেকে 40. Machine B র bar টা কি নড়লো? লাল দাগটা আপনার guess.</Nope>
      )}
      <Task done={right}>একটা ছবি বেছে নিন. তারপর দুইটা bar কী করে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The bet. The pen drive with ten lakh books slides into the library's
//     computer. আপুর ভাই claims machine B can be made as fast as machine A,
//     without changing one answer. Sealed, unmarked; the finale settles it.

const SB_BET = [
  "ভাই ঠিক — B-ও A র মতো দ্রুত হবে, উত্তরও একই থাকবে",
  "হবে না — cosine মানেই বাড়তি কাজ, B সবসময় ধীর",
  "দ্রুত হবে, কিন্তু তখন B-ও A র মতো ভুল বই দিবে",
];

export function SpeedBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [x] = useTween([bet === null ? 0 : 1], 1300);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি ধরা হয়ে গেলো. শেষে মিলিয়ে দেখবো.");
  };

  return (
    <>
      <svg viewBox="0 0 260 96" role="img" aria-label="দশ লাখ বইয়ের pen drive library র computer এ ঢুকছে; computer এ machine A আর machine B" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={96} y={6} width={150} height={74} rx={5} fill="#1e293b" />
        <rect x={101} y={11} width={140} height={64} rx={2} fill="white" />
        {(["A", "B"] as const).map((m, i) => (
          <g key={m}>
            <rect x={106 + i * 68} y={16} width={62} height={54} rx={3} fill={i === 0 ? "#fff1f2" : "#f0fdfa"} stroke={i === 0 ? "#e11d48" : "#0d9488"} strokeWidth={1.2} />
            <text x={137 + i * 68} y={30} textAnchor="middle" fontSize={10} fontWeight={800} fill="#0f1b2d">
              machine {m}
            </text>
            <text x={137 + i * 68} y={45} textAnchor="middle" fontSize={8.5} fill="#334155">
              {i === 0 ? "শুধু box" : "box, length,"}
            </text>
            <text x={137 + i * 68} y={57} textAnchor="middle" fontSize={8.5} fill="#334155">
              {i === 0 ? "দ্রুত" : "root, ভাগ"}
            </text>
          </g>
        ))}
        <rect x={160} y={80} width={22} height={8} fill="#334155" />
        {/* the pen drive glides into the computer's side once the bet is sealed */}
        <g transform={`translate(${8 + 74 * x} ${58 - 10 * x})`}>
          <rect width={26} height={12} rx={2} fill="#475569" />
          <rect x={26} y={3} width={8} height={6} fill="#94a3b8" />
          <text x={13} y={26} textAnchor="middle" fontSize={8} fontWeight={700} fill="#0f1b2d" opacity={1 - x}>
            10 লাখ বই
          </text>
        </g>
      </svg>
      <div className="mt-2 text-sm font-medium text-muted">আপুর ভাই বলছেন, machine B-কে machine A র মতোই দ্রুত করা যায়, একটা উত্তরও না বদলে. আপনার কী মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {SB_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>একটার উপরে বাজি ধরুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The old way fails: search “মাছ” in both machines at 3 books, 1,000 and
//     ten lakh. A does 1 job a book, B does 4 (box, length, root, ভাগ), and
//     B's bar takes four times as long. Time is squeezed so a run stays short.

const CR_SIZES = [3, 1000, 1000000];
const CR_LABEL = ["3 টা বই", "1,000 বই", "10 লাখ বই"];
const CR_MS = [150, 350, 600]; // machine A's run; B takes four times this
const TICK = 40;

export function CostRace() {
  const pass = useGate();
  const [size, setSize] = useSeed("size", 0);
  const [shown, setShown] = useSeed<number | null>("shown", null);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const run = usePlay(TICK);
  const all = seen.length === CR_SIZES.length;

  const n = CR_SIZES[size];
  const t = run.running ? run.k * TICK : shown === size ? Infinity : 0;
  const pA = Math.min(1, t / CR_MS[size]);
  const pB = Math.min(1, t / (4 * CR_MS[size]));

  const search = () => {
    const s = size;
    setShown(s);
    run.play(Math.ceil((4 * CR_MS[s]) / TICK), () => {
      if (seen.includes(s)) return;
      const next = [...seen, s];
      setSeen(next);
      if (next.length === CR_SIZES.length) pass("Machine B প্রতি বইয়ে 4 টা কাজ করে, A করে 1 টা.");
    });
  };

  return (
    <>
      <div className="mx-auto grid max-w-sm gap-3 rounded-2xl border border-border bg-surface px-3 py-3">
        <MB_Lane name="machine A" jobs={["box"]} lit={run.running && pA < 1 ? 0 : null} p={pA} count={Math.round(pA * n)} tone="coral" />
        <MB_Lane name="machine B" jobs={B_JOBS} lit={run.running && pB < 1 ? run.k % 4 : null} p={pB} count={Math.round(pB * n) * 4} tone="teal" />
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {CR_LABEL.map((l, i) => (
          <button
            key={l}
            type="button"
            disabled={run.running}
            onClick={() => {
              setSize(i);
              setShown(null);
            }}
            className={`${pill(size === i)} font-sans`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" disabled={run.running} onClick={search} className={primaryBtn}>
          দুইটাতেই “মাছ” search দিন
        </button>
      </div>
      <Ticks items={CR_LABEL.map((l, i) => [l, seen.includes(i)] as [string, boolean])} />
      <Task done={all}>তিনটা size এর প্রতিটাতে একবার করে search দিন. দেখুন কোন machine কত কাজ করে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Machine B's notebook. Search three different words; for each book a box
//     chip and a length chip pop in. The boxes change with the word; the
//     lengths are 2, 20.02, 7.07 every time. Then tap the column that never
//     changed.

const SL_WORDS = [
  { w: "মাছ", q: [1, 0, 0], chip: "bg-cat-blue/15 text-cat-blue", on: "border-cat-blue bg-cat-blue text-white" },
  { w: "নৌকা", q: [0, 1, 0], chip: "bg-cat-teal/15 text-cat-teal", on: "border-cat-teal bg-cat-teal text-white" },
  { w: "ধান", q: [0, 0, 1], chip: "bg-cat-amber/20 text-cat-amber", on: "border-cat-amber bg-cat-amber text-white" },
];

export function SameLength() {
  const pass = useGate();
  const [runs, setRuns] = useSeed<number[]>("runs", []);
  const [pick, setPick] = useSeed<"box" | "len" | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const all = runs.length === SL_WORDS.length;
  const right = pick === "len";

  const search = (i: number) => {
    if (runs.includes(i)) return;
    setRuns([...runs, i]);
  };
  const choose = (c: "box" | "len") => {
    if (!all || right) return;
    setPick(c);
    if (c === "len") pass("Query বদলায়, বইয়ের length বদলায় না.");
    else setMiss(miss + 1);
  };

  const head = (c: "box" | "len", label: string) => (
    <button
      type="button"
      disabled={!all || right}
      onClick={() => choose(c)}
      className={`rounded-lg border-2 px-1 py-0.5 text-center text-sm font-semibold transition-colors motion-reduce:transition-none disabled:cursor-default ${
        pick === c ? (c === "len" ? "border-accent bg-accent/15 text-accent-text" : "nudge border-danger/50 text-danger") : all ? "cursor-pointer border-cat-blue/50 text-cat-blue hover:bg-cat-blue/5" : "border-transparent"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="mx-auto max-w-sm rounded-2xl border border-border bg-surface px-2 py-2">
        <div className="text-center text-xs text-muted">machine B র খাতা</div>
        <div className="mt-1 grid grid-cols-[5.2rem_1fr_1.5fr] items-center gap-x-1.5 gap-y-1.5">
          <span className="text-xs text-muted">বই</span>
          {head("box", "box")}
          {head("len", "length")}
          {MB_BOOKS.map((b, r) => (
            <div key={b.id} className="contents">
              <span className="text-[0.8rem] leading-tight">{b.name}</span>
              <span className={`flex min-h-6 flex-wrap justify-center gap-1 rounded-md ${pick === "box" ? "bg-danger/5" : ""}`}>
                {runs.map((i) => (
                  <span key={i} style={{ transitionDelay: `${r * 180}ms` }} className={`${POP} inline-block rounded px-1 font-mono text-xs ${SL_WORDS[i].chip}`}>
                    {dot(SL_WORDS[i].q, b.v)}
                  </span>
                ))}
              </span>
              <span className={`flex min-h-6 flex-wrap justify-center gap-1 rounded-md transition-colors motion-reduce:transition-none ${right ? "bg-accent/15" : ""}`}>
                {runs.map((i) => (
                  <span key={i} style={{ transitionDelay: `${r * 180 + 90}ms` }} className={`${POP} inline-block rounded px-1 font-mono text-xs ${SL_WORDS[i].chip}`}>
                    {cn(len(b.v), 2)}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {SL_WORDS.map((s, i) => (
          <button
            key={s.w}
            type="button"
            disabled={runs.includes(i)}
            onClick={() => search(i)}
            className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors motion-reduce:transition-none ${
              runs.includes(i) ? s.on : "cursor-pointer border-border hover:border-cat-blue/60"
            }`}
          >
            “{s.w}” search
          </button>
        ))}
      </div>
      {all && !right && <div className={`${FADE} mt-3 text-center text-sm font-medium`}>কোন column এর সংখ্যা প্রতিবার একই থাকলো? ওটার মাথায় tap করুন.</div>}
      {pick === "box" && (
        <Nope key={miss}>Box তো বদলেছে. মোটা বইয়ে তিনবারে তিনটা আলাদা সংখ্যা: 20, 1, 0.</Nope>
      )}
      <Task done={right}>তিনটা word দিয়েই search দিন. তারপর যে column প্রতিবার একই থাকে, তার মাথায় tap করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Shelve each book once. Tap a book: its card is divided by its own
//     length, the numbers glide to the new ones, the length bar shrinks to the
//     "1" mark, and the book drops onto the shelf with a green 1.

const SO_SCALE = 20.1; // the thick book's length fills the bar

function SO_Row({ name, v, on, onShelve }: { name: string; v: number[]; on: boolean; onShelve: () => void }) {
  const L = len(v);
  const [t] = useTween([on ? 1 : 0], 1000);
  const shown = v.map((x) => x + (x / L - x) * t);
  const w = L + (1 - L) * t;
  return (
    <div className="grid gap-1 rounded-xl border border-border bg-surface px-2.5 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 text-[0.85rem] leading-tight font-semibold">{name}</span>
        {on ? (
          <span className={`${POP} inline-block shrink-0 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-xs text-accent-text`}>÷ {cn(L, 2)}</span>
        ) : (
          <button type="button" onClick={onShelve} className="shrink-0 cursor-pointer rounded-full border-2 border-cat-blue/60 px-2.5 py-0.5 text-xs font-semibold text-cat-blue hover:bg-cat-blue/5">
            shelf এ তুলুন
          </button>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs">{t === 0 ? card(v) : t === 1 ? card(v.map((x) => x / L)) : card(shown, 2)}</span>
        <span className="text-xs whitespace-nowrap text-muted">
          length <b className="font-mono text-foreground">{on && t === 1 ? "1" : cn(w, 2)}</b>
        </span>
      </div>
      <div className="relative h-2.5 rounded-full bg-foreground/8">
        <span className={`block h-full rounded-full ${on ? "bg-accent" : "bg-cat-coral"}`} style={{ width: `${(w / SO_SCALE) * 100}%` }} />
        <span className="absolute -top-0.5 h-3.5 border-l-2 border-foreground/60" style={{ left: `${(1 / SO_SCALE) * 100}%` }} />
      </div>
    </div>
  );
}

export function ShelveOnce() {
  const pass = useGate();
  const [shelved, setShelved] = useSeed<string[]>("shelved", []);
  const all = shelved.length === MB_BOOKS.length;

  const shelve = (id: string) => {
    if (shelved.includes(id)) return;
    const next = [...shelved, id];
    setShelved(next);
    if (next.length === MB_BOOKS.length) pass("প্রতিটা বইয়ের length মাপা হলো একবারই.");
  };

  return (
    <>
      <svg viewBox="0 0 240 44" role="img" aria-label={`shelf, ${shelved.length} টা বই তোলা`} className="mx-auto block h-auto w-full max-w-[13rem]">
        <rect x={10} y={36} width={220} height={5} fill="#7c4a1e" />
        {MB_BOOKS.map((b, i) =>
          shelved.includes(b.id) ? (
            <g key={b.id} className={POP}>
              <rect x={30 + i * 70} y={10} width={[10, 22, 16][i]} height={26} fill={["#be185d", "#1d4ed8", "#a16207"][i]} />
              <circle cx={30 + i * 70 + [10, 22, 16][i] + 7} cy={16} r={6} fill="#15803d" />
              <text x={30 + i * 70 + [10, 22, 16][i] + 7} y={19} textAnchor="middle" fontSize={8} fontWeight={800} fontFamily="ui-monospace, monospace" fill="white">
                1
              </text>
            </g>
          ) : (
            <rect key={b.id} x={30 + i * 70} y={10} width={[10, 22, 16][i]} height={26} fill="none" stroke="#94a3b8" strokeDasharray="3 2" />
          ),
        )}
      </svg>
      <div className="mx-auto mt-1 grid max-w-sm gap-1.5">
        {MB_BOOKS.map((b) => (
          <SO_Row key={b.id} name={b.name} v={b.v} on={shelved.includes(b.id)} onShelve={() => shelve(b.id)} />
        ))}
      </div>
      <div className="mt-2 text-center text-sm text-muted">
        কালো দাগটা length 1. length মাপা হলো <b className="font-mono text-foreground">{shelved.length}</b> বার.
      </div>
      <Task done={all}>তিনটা বই-ই shelf এ তুলুন. তোলার সময় প্রতিটা card নিজের length দিয়ে একবার ভাগ হবে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The plain box on the shelved cards. Tap a row: the box plays out term by
//     term (1 × 0.999 + 0 × 0.050 + 0 × 0 = 0.999) and lands beside machine
//     B's old score, the same number. Then race ten lakh books: machine B as
//     before against the box on shelved cards, at machine A's speed.

const BS_MS = 600;

function BS_Terms({ u, k }: { u: number[]; k: number }) {
  return (
    <span className="font-mono text-[0.72rem] tracking-tight">
      {u.map((x, i) =>
        k > i ? (
          <span key={i} className={`${FADE} whitespace-nowrap`}>
            {i > 0 ? " + " : ""}
            {cn(QUERY[i])} × {cn(x)}
          </span>
        ) : null,
      )}
      {k > u.length && (
        <span className={`${FADE} whitespace-nowrap`}>
          {" = "}
          <b className={`${POP} inline-block text-accent-text`}>{cn(dot(QUERY, u))}</b>
        </span>
      )}
    </span>
  );
}

export function BoxOnShelved() {
  const pass = useGate();
  const [ran, setRan] = useSeed<string[]>("ran", []);
  const [raced, setRaced] = useSeed("raced", false);
  const [active, setActive] = useState<string | null>(null);
  const terms = usePlay(420);
  const race = usePlay(TICK);
  const allRan = ran.length === MB_UNIT.length;
  const N = CR_SIZES[2];

  const box = (id: string) => {
    if (ran.includes(id) || terms.running) return;
    setActive(id);
    terms.play(4, () => setRan((r) => (r.includes(id) ? r : [...r, id])));
  };
  const go = () => {
    race.play(Math.ceil((4 * BS_MS) / TICK), () => {
      setRaced(true);
      pass("1 লম্বা card এ box-ই cosine.");
    });
  };

  const t = race.running ? race.k * TICK : raced ? Infinity : 0;
  const pFast = Math.min(1, t / BS_MS);
  const pSlow = Math.min(1, t / (4 * BS_MS));

  return (
    <>
      <div className="text-center text-xs text-muted">
        “মাছ” = <b className="font-mono text-foreground">(1, 0, 0)</b>
      </div>
      <div className="mx-auto mt-1 grid max-w-sm gap-1.5">
        {MB_UNIT.map((b) => {
          const done = ran.includes(b.id);
          const playing = active === b.id && terms.running;
          return (
            <div key={b.id} className="rounded-xl border border-border bg-surface px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.85rem] leading-tight font-semibold">{b.name}</span>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs whitespace-nowrap ${done ? "win-pop bg-accent/15 text-accent-text" : "text-muted"}`}>
                  B বলেছিল <b className="font-mono">{fix(cosQ(b.v), 3)}</b>
                </span>
              </div>
              <div className="mt-0.5 flex min-h-7 items-center justify-between gap-2">
                {done || playing ? (
                  <BS_Terms u={b.u} k={done ? 4 : terms.k} />
                ) : (
                  <>
                    <span className="font-mono text-xs text-muted">{card(b.u)}</span>
                    <button type="button" disabled={terms.running} onClick={() => box(b.id)} className="shrink-0 cursor-pointer rounded-full border-2 border-cat-coral/60 px-2.5 py-0.5 text-xs font-semibold text-cat-coral hover:bg-cat-coral/5 disabled:opacity-50">
                      box চালান
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {allRan && (
        <div className={`${FADE} mx-auto mt-2 grid max-w-sm gap-2 rounded-2xl border border-border bg-surface px-3 py-2`}>
          <MB_Lane name="machine B" jobs={B_JOBS} lit={race.running && pSlow < 1 ? race.k % 4 : null} p={pSlow} count={Math.round(pSlow * N) * 4} tone="teal" />
          <MB_Lane name="shelf এর card এ" jobs={["box"]} lit={race.running && pFast < 1 ? 0 : null} p={pFast} count={Math.round(pFast * N)} tone="coral" />
          {!raced && (
            <button type="button" disabled={race.running} onClick={go} className="mx-auto cursor-pointer rounded-full bg-cat-blue px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
              10 লাখ বইয়ে “মাছ” search দিন
            </button>
          )}
        </div>
      )}
      <Task done={raced}>প্রতিটা card এ box চালান, B র আগের সংখ্যার সাথে মিলান. তারপর 10 লাখ বইয়ে search দিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Distance agrees. Two cards, both 1 long: the query along the bottom and
//     a book the reader swings with a slider. The gap between the tips is
//     drawn; at 0°, 60°, 90° and 180° it reads 0, 1, 1.41, 2 while the box
//     reads 1, 0.5, 0, −1.

const TG_STOPS = [0, 60, 90, 180];
const TG_O = { x: 130, y: 118 };
const TG_R = 92;

export function TipGap() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 40);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const d = Math.sqrt(Math.max(0, 2 - 2 * c));
  const vx = TG_O.x + TG_R * Math.cos(r);
  const vy = TG_O.y - TG_R * Math.sin(r);
  const all = seen.length === TG_STOPS.length;

  const slide = (a: number) => {
    const stop = TG_STOPS.findIndex((s) => Math.abs(s - a) <= 2);
    const at = stop >= 0 ? TG_STOPS[stop] : a;
    setDeg(at);
    if (stop < 0 || seen.includes(stop)) return;
    const next = [...seen, stop];
    setSeen(next);
    if (next.length === TG_STOPS.length) pass("Box যত বড়, মাথা দুইটা তত কাছে.");
  };

  return (
    <>
      <svg viewBox="0 0 260 132" role="img" aria-label={`দুইটা 1 লম্বা card, মাঝে ${deg}°; box ${fix(c, 2)}, মাথার দূরত্ব ${fix(d, 2)}`} className="mx-auto block h-auto w-full max-w-[19rem]">
        <rect x={1} y={1} width={258} height={130} rx={10} fill="white" stroke="#cbd5e1" />
        <path d={`M${TG_O.x + TG_R} ${TG_O.y}A${TG_R} ${TG_R} 0 0 0 ${TG_O.x - TG_R} ${TG_O.y}`} fill="none" stroke="#0f1b2d" strokeOpacity={0.18} strokeDasharray="3 3" />
        {d > 0.02 && <path d={`M${TG_O.x + TG_R} ${TG_O.y}L${vx} ${vy}`} stroke="#e11d48" strokeWidth={2.2} strokeDasharray="4 3" />}
        <MB_Arr x1={TG_O.x} y1={TG_O.y} x2={TG_O.x + TG_R} y2={TG_O.y} color="#2563eb" w={2.6} />
        <MB_Arr x1={TG_O.x} y1={TG_O.y} x2={vx} y2={vy} color="#0d9488" w={2.6} />
        <text x={TG_O.x + TG_R} y={TG_O.y + 11} textAnchor="end" fontSize={8.5} fontWeight={700} fill="#1d4ed8">
          প্রশ্ন
        </text>
        <text x={vx + (vx > TG_O.x ? 4 : -4)} y={vy - 5} textAnchor={vx > TG_O.x ? "start" : "end"} fontSize={8.5} fontWeight={700} fill="#0f766e">
          বই
        </text>
        {d > 0.02 && (
          <text x={(TG_O.x + TG_R + vx) / 2 + 6} y={(TG_O.y + vy) / 2 + 3} fontSize={9} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#be123c">
            {fix(d, 2)}
          </text>
        )}
        <text x={8} y={15} fontSize={9} fontFamily="ui-monospace, monospace" fill="#0f1b2d">
          {`${deg}°`}
        </text>
      </svg>
      <div className="mx-auto mt-1 flex max-w-sm items-center gap-3">
        <span className="text-xs text-muted">একই দিক</span>
        <input
          type="range"
          min={0}
          max={180}
          step={1}
          value={deg}
          aria-label="বইয়ের card কত ডিগ্রি ঘোরানো"
          onChange={(e) => slide(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-teal)]"
        />
        <span className="text-xs text-muted">উল্টা</span>
      </div>
      <div className="mt-1 text-center text-[0.95rem]">
        box <b className="font-mono text-cat-teal">{fix(c, 2)}</b>, মাথার দূরত্ব <b className="font-mono text-cat-coral">{fix(d, 2)}</b>
      </div>
      <div className="mx-auto mt-2 grid max-w-sm grid-cols-4 gap-1.5">
        {TG_STOPS.map((s, i) => {
          const on = seen.includes(i);
          const cs = Math.cos((s * Math.PI) / 180);
          return (
            <div key={s} className={`rounded-lg border px-1 py-1 text-center text-xs ${on ? "win-pop border-accent/50 bg-accent/10" : "border-border text-muted"}`}>
              <div className="font-mono font-semibold">{s}°</div>
              <div>
                box <b className="font-mono">{on ? fix(cs, 1) : "?"}</b>
              </div>
              <div>
                দূরত্ব <b className="font-mono">{on ? fix(Math.sqrt(Math.max(0, 2 - 2 * cs)), 2) : "?"}</b>
              </div>
            </div>
          );
        })}
      </div>
      <Task done={all}>বইয়ের card টা ঘুরিয়ে 0°, 60°, 90° আর 180° তে থামান. Box আর দূরত্ব কী করে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn: two shelved cards, (0.6, 0.8) and (0.8, 0.6). What is their
//     cosine? A needle glides along a line from 0 to 1.5 to the picked
//     number. 1.4 runs off the end, where no cosine goes; 0.48 is one slot
//     only; "can't say without dividing" shows ÷ (1 × 1) changing nothing.

const YC_OPTS = [
  { say: "1.4", v: 1.4 },
  { say: "0.96", v: 0.96 },
  { say: "0.48", v: 0.48 },
  { say: "ভাগ না দিয়ে বলা যায় না", v: null },
];
const YC_RIGHT = 1;
const YC_X = (v: number) => 20 + (v / 1.5) * 220;

export function YourCos() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const target = pick !== null && YC_OPTS[pick].v !== null ? (YC_OPTS[pick].v as number) : 0;
  const [nx] = useTween([YC_X(target)], 900, [YC_X(0)]);
  const right = pick === YC_RIGHT;
  const O = { x: 40, y: 92 };
  const R = 80;

  const choose = (i: number) => {
    setPick(i);
    if (i === YC_RIGHT) pass("Shelf এর card এ box-ই cosine: 0.96.");
    else setMiss(miss + 1);
  };

  return (
    <>
      <svg viewBox="0 0 260 150" role="img" aria-label="দুইটা 1 লম্বা card (0.6, 0.8) আর (0.8, 0.6), নিচে cosine মাপার line" className="mx-auto block h-auto w-full max-w-[19rem]">
        <rect x={1} y={1} width={258} height={148} rx={10} fill="white" stroke="#cbd5e1" />
        <path d={`M${O.x + R} ${O.y}A${R} ${R} 0 0 0 ${O.x} ${O.y - R}`} fill="none" stroke="#0f1b2d" strokeOpacity={0.2} strokeDasharray="3 3" />
        <MB_Arr x1={O.x} y1={O.y} x2={O.x + 0.6 * R} y2={O.y - 0.8 * R} color="#2563eb" w={2.4} />
        <MB_Arr x1={O.x} y1={O.y} x2={O.x + 0.8 * R} y2={O.y - 0.6 * R} color="#0d9488" w={2.4} />
        <text x={O.x + 0.6 * R - 4} y={O.y - 0.8 * R - 5} textAnchor="middle" fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8">
          (0.6, 0.8)
        </text>
        <text x={O.x + 0.8 * R + 5} y={O.y - 0.6 * R + 3} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#0f766e">
          (0.8, 0.6)
        </text>
        <text x={O.x + R + 2} y={O.y + 3} fontSize={8} fill="#64748b">
          length 1
        </text>
        {/* the cosine line: 0 to 1.5, with the end at 1 marked */}
        {pick === 0 && <rect key={miss} x={YC_X(1)} y={112} width={YC_X(1.5) - YC_X(1)} height={20} rx={3} fill="#fee2e2" className={FADE} />}
        <path d={`M${YC_X(0)} 122H${YC_X(1.5)}`} stroke="#0f1b2d" strokeOpacity={0.5} strokeWidth={1.4} />
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <path d={`M${YC_X(v)} 117V127`} stroke="#0f1b2d" strokeOpacity={0.6} strokeWidth={v === 1 ? 2 : 1} />
            <text x={YC_X(v)} y={142} textAnchor="middle" fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#0f1b2d">
              {v}
            </text>
          </g>
        ))}
        {pick === 0 && (
          <text x={YC_X(1.27)} y={142} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#be123c" className={FADE}>
            এখানে cosine নাই
          </text>
        )}
        {pick !== null && YC_OPTS[pick].v !== null && (
          <g transform={`translate(${nx} 0)`}>
            <path d="M0 116l-5 -9h10Z" fill={right ? "#15803d" : "#be123c"} />
            <text y={104} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily="ui-monospace, monospace" fill={right ? "#15803d" : "#be123c"}>
              {YC_OPTS[pick].say}
            </text>
          </g>
        )}
        {pick === 3 && (
          <text key={miss} x={130} y={108} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#be123c" className={FADE}>
            ? ÷ (1 × 1) = একই ?
          </text>
        )}
      </svg>
      {right && (
        <div className={`${FADE} mt-1 text-center text-sm`}>
          <BoxRun a={[0.6, 0.8]} b={[0.8, 0.6]} inline />
        </div>
      )}
      <div className="mt-2 grid grid-cols-3 gap-2">
        {YC_OPTS.slice(0, 3).map((o, i) => (
          <Choice key={o.say} n={i} look={pick === i ? (right ? "right" : "wrong") : "idle"} disabled={right} onClick={() => choose(i)}>
            <span className="font-mono">{o.say}</span>
          </Choice>
        ))}
      </div>
      <div className="mt-2">
        <Choice n={3} look={pick === 3 ? "wrong" : "idle"} disabled={right} onClick={() => choose(3)}>
          {YC_OPTS[3].say}
        </Choice>
      </div>
      {pick !== null && !right && (
        <Nope key={miss}>
          {pick === 0
            ? "Cosine কখনো 1 এর বেশি হয় না. 0.6 আর 0.8 যোগ হলো. গুণটা কোথায়?"
            : pick === 2
              ? "0.48 তো শুধু প্রথম slot জোড়ার গুণ. Box এ সব জোড়া লাগে."
              : "দুইটা card-ই 1 লম্বা. 1 × 1 দিয়ে ভাগ দিলে কী বদলায়?"}
        </Nope>
      )}
      <Task done={right}>দুইটা card এর cosine কত, বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it: a new book arrives, (6, 8, 0). Machine B would give it 0.6 for
//     “মাছ”. Pick what to divide the card by before it goes on the shelf; the
//     arrow shrinks along its own line. ÷ 14 (the slots added) lands inside
//     the ring, ÷ 8 (the biggest slot) stops outside, ÷ 10 sits on it and the
//     plain box gives 0.6.

const TS_DIV = [14, 10, 8];
const TS_RIGHT = 1;
const TS_O = { x: 26, y: 156 };
const TS_S = 17; // px per unit

export function TryShelve() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const d = pick === null ? 1 : TS_DIV[pick];
  const [L] = useTween([10 / d], 1100, [10]);
  const right = pick === TS_RIGHT;
  const tipX = TS_O.x + 0.6 * L * TS_S;
  const tipY = TS_O.y - 0.8 * L * TS_S;
  const v = [6 / d, 8 / d, 0];

  const choose = (i: number) => {
    setPick(i);
    if (i === TS_RIGHT) pass("নিজের length, 10 দিয়ে ভাগ: (0.6, 0.8, 0).");
    else setMiss(miss + 1);
  };

  return (
    <>
      <div className="mx-auto flex max-w-sm items-center gap-2">
        <svg viewBox="0 0 170 166" role="img" aria-label={`নতুন বইয়ের card, length ${fix(10 / d, 2)}; 1 লম্বা ring এর সাথে তুলনা`} className="block h-auto w-full max-w-[11rem] shrink-0">
          <rect x={1} y={1} width={168} height={164} rx={10} fill="white" stroke="#cbd5e1" />
          <path d={`M${TS_O.x} ${TS_O.y}H164M${TS_O.x} ${TS_O.y}V6`} stroke="#0f1b2d" strokeOpacity={0.35} strokeWidth={1} />
          <text x={162} y={TS_O.y - 4} textAnchor="end" fontSize={9} fill="#64748b">
            মাছ
          </text>
          <text x={TS_O.x + 4} y={14} fontSize={9} fill="#64748b">
            নৌকা
          </text>
          <path d={`M${TS_O.x + TS_S} ${TS_O.y}A${TS_S} ${TS_S} 0 0 0 ${TS_O.x} ${TS_O.y - TS_S}`} fill="#dcfce7" fillOpacity={0.6} stroke="#15803d" strokeWidth={1.6} />
          <text x={TS_O.x + TS_S + 2} y={TS_O.y - 3} fontSize={8} fontWeight={700} fill="#15803d">
            1
          </text>
          <MB_Arr x1={TS_O.x} y1={TS_O.y} x2={tipX} y2={tipY} color={right ? "#15803d" : pick === null ? "#1d4ed8" : "#be123c"} w={2.4} />
        </svg>
        <div className="min-w-0 flex-1 text-sm">
          <div className="text-xs text-muted">নতুন বই</div>
          <div className="font-mono">{pick === null ? "(6, 8, 0)" : card(v, 2)}</div>
          <div className="mt-1.5 text-xs text-muted">length</div>
          <div className="font-mono">{fix(L, 2)}</div>
          <div className="mt-1.5 text-xs text-muted">“মাছ” এর সাথে box</div>
          <div className={`font-mono text-lg font-bold ${right ? "text-accent-text" : pick === null ? "" : "text-danger"}`}>{cn(0.6 * L, 2)}</div>
          <div className="mt-1.5 rounded-md bg-cat-teal/10 px-1.5 py-0.5 text-xs">
            machine B বলতো <b className="font-mono">0.6</b>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {TS_DIV.map((x, i) => (
          <Choice key={x} n={i} look={pick === i ? (right ? "right" : "wrong") : "idle"} disabled={right} onClick={() => choose(i)}>
            <span className="font-mono">÷ {x}</span>
          </Choice>
        ))}
      </div>
      {pick !== null && !right && (
        <Nope key={miss}>
          {TS_DIV[pick] === 14
            ? "Card টা ঢুকে গেলো ring এর ভিতরে. box 0.43. 14 তো 6 আর 8 এর যোগ. Length কি যোগ করে মাপে?"
            : "Card টা এখনো ring এর বাইরে. box 0.75. সবচেয়ে বড় সংখ্যাটা দিয়ে ভাগ? তাতে length 1 হয় না."}
        </Nope>
      )}
      <Task done={right}>কত দিয়ে ভাগ দিলে card টা ঠিক ring এর উপরে বসে, আর box দেয় 0.6? বেছে নিন.</Task>
    </>
  );
}

// ===========================================================================
// Story scenes and explanation figures. Watch-only, driven by the reader
// (useScene): each waits on its first frame, and every beat is drawn from `k`
// alone. The library's shelves, desk and computer, the pen drive and the
// books aren't in the cast, so they are drawn here in fixed ink. The library
// apu borrows Rina's look, her brother Karim's, each with a name drawn under
// the feet.

const MB_INK = "#0f1b2d";
const LG = 150;

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** A caption that fades in afresh on every beat. */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** Something that glides to (x, y) over `ms`, the way a Person does: draw it around (0, 0). */
function MB_Carry({ x, y, ms = 1200, children }: { x: number; y: number; ms?: number; children: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {children}
    </g>
  );
}

/** A name under someone's feet, gliding with them. */
function MB_Name({ x, text, ms = 1200, light = false }: { x: number; text: string; ms?: number; light?: boolean }) {
  return (
    <MB_Carry x={x} y={LG} ms={ms}>
      <text y={11} textAnchor="middle" fontSize={8} fontWeight={700} fill={light ? "#e2e8f0" : MB_INK}>
        {text}
      </text>
    </MB_Carry>
  );
}

/** An arrow on a white sheet, pixel coordinates. */
function MB_Arr({ x1, y1, x2, y2, color, w = 2.4 }: { x1: number; y1: number; x2: number; y2: number; color: string; w?: number }) {
  const l = Math.hypot(x2 - x1, y2 - y1);
  if (l < 1) return null;
  const ux = (x2 - x1) / l;
  const uy = (y2 - y1) / l;
  const h = Math.min(6 + w, l * 0.5);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const s = h * 0.5;
  return (
    <g>
      <path d={`M${x1} ${y1}L${bx} ${by}`} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={`M${x2} ${y2}L${bx - uy * s} ${by + ux * s}L${bx + uy * s} ${by - ux * s}Z`} fill={color} />
    </g>
  );
}

/** A bookshelf, bottom-left at (x, y), three shelves of books. */
function MB_Shelf({ x, y, w = 78 }: { x: number; y: number; w?: number }) {
  const colors = ["#b91c1c", "#1d4ed8", "#15803d", "#a16207", "#7c3aed", "#0f766e", "#be185d"];
  const widths = [6, 8, 5, 7, 6, 9, 5, 7];
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y - 3 * 26 - 4} width={w} height={3 * 26 + 4} fill="#7c4a1e" />
      {[0, 1, 2].map((r) => {
        const top = y - (r + 1) * 26;
        let bx = x + 4;
        const books: ReactNode[] = [];
        for (let i = 0; bx < x + w - 12; i++) {
          const bw = widths[(i + r * 3) % widths.length];
          const bh = 16 + ((i * 7 + r * 5) % 6);
          books.push(<rect key={i} x={bx} y={top + 24 - bh} width={bw} height={bh} fill={colors[(i + r * 2) % colors.length]} />);
          bx += bw + 1;
        }
        return (
          <g key={r}>
            <rect x={x + 3} y={top} width={w - 6} height={24} fill="#fdf6ec" opacity={0.25} />
            {books}
          </g>
        );
      })}
    </g>
  );
}

/** The library's desk and computer, the desk's left edge at x; two windows, A and B. */
function MB_Desk({ x }: { x: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={LG - 28} width={84} height={4} fill="#92400e" />
      <rect x={x + 4} y={LG - 24} width={3} height={24} fill="#78350f" />
      <rect x={x + 77} y={LG - 24} width={3} height={24} fill="#78350f" />
      <rect x={x + 38} y={LG - 33} width={8} height={5} fill="#475569" />
      <rect x={x + 8} y={LG - 70} width={68} height={38} rx={3} fill="#1e293b" />
      {(["A", "B"] as const).map((m, i) => (
        <g key={m}>
          <rect x={x + 12 + i * 31} y={LG - 66} width={29} height={30} rx={2} fill="white" />
          <text x={x + 26.5 + i * 31} y={LG - 48} textAnchor="middle" fontSize={8} fontWeight={800} fill={MB_INK}>
            {m}
          </text>
        </g>
      ))}
    </g>
  );
}

/** A small note, centred at (x, y). */
function MB_Note({ x, y, lines, tone = MB_INK, fs = 8 }: { x: number; y: number; lines: string[]; tone?: string; fs?: number }) {
  const w = Math.max(...lines.map((l) => l.length)) * fs * 0.55 + 14;
  const h = lines.length * (fs + 4) + 6;
  return (
    <g className={POP}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3} fill="white" stroke={tone} strokeWidth={1.2} />
      {lines.map((l, i) => (
        <text key={i} x={x} y={y - h / 2 + (i + 1) * (fs + 4)} textAnchor="middle" fontSize={fs} fontWeight={700} fill={tone} fontFamily={/[ঀ-৿]/.test(l) ? undefined : "ui-monospace, monospace"}>
          {l}
        </text>
      ))}
    </g>
  );
}

/** The pen drive, drawn around (0, 0). */
function MB_Pen() {
  return (
    <g>
      <rect x={-9} y={-4} width={14} height={8} rx={1.5} fill="#475569" />
      <rect x={5} y={-2.5} width={5} height={5} fill="#94a3b8" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: the afternoon library.
//      আপু at the computer, ফাহিম by the shelf. Her brother walks in with a
//      pen drive; the note says ten lakh books; আপু asks about machine B; he
//      makes the claim. Whether it holds is left to the bet.

export function CatalogueArrives({}: Story) {
  const s = useScene(4, [600, 1600, 1800, 2200, 2400]);
  const k = s.k;
  const bx = k >= 1 ? 298 : 360;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="বিকালে library; আপুর ভাই শহর থেকে pen drive নিয়ে আসেন, দশ লাখ বইয়ের card; আপু জিজ্ঞেস করেন machine B পারবে কিনা; ভাই বলেন B-কে A র মতোই দ্রুত করা যায়">
        <MB_Shelf x={6} y={LG} />
        <MB_Desk x={146} />
        <Person who="fahim" x={106} y={LG} facing={1} mood={k >= 4 ? "puzzled" : "plain"} label />
        <Person who="rina" x={240} y={LG} facing={-1} scale={0.95} mood={k === 3 ? "puzzled" : "plain"} />
        <MB_Name x={238} text="লাইব্রেরির আপু" />
        <Person who="karim" x={bx} y={LG} facing={-1} walking={k === 1} ms={1400} arm={k >= 1 && k < 3 ? "hold" : "down"} mood={k >= 4 ? "smug" : "plain"} />
        {k >= 1 && <MB_Name x={bx} text="আপুর ভাই" ms={1400} />}
        {k >= 1 && k < 3 && (
          <MB_Carry x={bx - 19} y={LG - 38} ms={1400}>
            <MB_Pen />
          </MB_Carry>
        )}
        {k >= 2 && <MB_Note x={96} y={24} lines={["উপজেলা library", "10,00,000 বই"]} tone="#b45309" />}
        {k === 3 && <Bubble x={240} y={LG - 64} side="left" lines={["দশ লাখ বইয়ে", "machine B?"]} />}
        {k >= 4 && <Bubble x={298} y={LG - 66} side="left" lines={["B-কে A র মতোই", "দ্রুত করা যায়."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: inside the two machines.
//      One book, (20, 1, 0), goes through A (box: 20) and then through B (box
//      20, squares added 401, root 20.02, ভাগ 0.999). Four jobs against one.

const X2_SAY = [
  "একটা বই, card এ (20, 1, 0). দুইটা machine এই যাবে.",
  "Machine A: শুধু box. “মাছ” এর সাথে box, 20. শেষ.",
  "Machine B: প্রথমে একই box, 20.",
  "তারপর length: প্রতিটা সংখ্যার বর্গ করে যোগ, 401.",
  "তারপর root: 20.02. এটাই বইয়ের length.",
  "শেষে ভাগ: 20 ÷ 20.02 = 0.999. একটা বইয়ে 4 টা কাজ.",
];
const X2_B = [
  { x: 72, name: "box", out: "20" },
  { x: 112, name: "বর্গ যোগ", out: "401" },
  { x: 152, name: "root", out: "20.02" },
  { x: 192, name: "ভাগ", out: "0.999" },
];

function X2_Station({ x, y, name, lit, done }: { x: number; y: number; name: string; lit: boolean; done: boolean }) {
  return (
    <g>
      <rect x={x - 18} y={y - 11} width={36} height={22} rx={5} fill={lit ? "#f59e0b" : done ? "#fef3c7" : "#f1f5f9"} stroke={lit ? "#b45309" : "#94a3b8"} className="transition-colors duration-300 motion-reduce:transition-none" />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={lit ? "white" : MB_INK}>
        {name}
      </text>
    </g>
  );
}

export function MachineInsides() {
  const s = useScene(5, [600, 1800, 1600, 1800, 1800, 2200]);
  const k = s.k;
  const ay = 32;
  const by = 84;
  const aAt = k >= 1 ? 72 : 36;
  const bStep = Math.max(0, k - 1); // 1…4 once B is running
  const bAt = k >= 2 ? X2_B[Math.min(bStep, 4) - 1].x : 36;
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <svg viewBox="0 0 250 108" role="img" aria-label="একটা বই machine A তে একটা কাজ, machine B তে চারটা কাজ: box, বর্গ যোগ, root, ভাগ" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={248} height={106} rx={10} fill="white" stroke="#cbd5e1" />
        <circle cx={16} cy={ay} r={9} fill="#e11d48" />
        <text x={16} y={ay + 3.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="white">
          A
        </text>
        <circle cx={16} cy={by} r={9} fill="#0d9488" />
        <text x={16} y={by + 3.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="white">
          B
        </text>
        <path d={`M28 ${ay}H240M28 ${by}H240`} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
        <X2_Station x={72} y={ay} name="box" lit={k === 1} done={k > 1} />
        {k >= 1 && (
          <text x={244} y={ay + 3.5} textAnchor="end" fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#be123c" className={FADE}>
            20
          </text>
        )}
        {X2_B.map((st, i) => (
          <X2_Station key={st.name} x={st.x} y={by} name={st.name} lit={k === i + 2} done={k > i + 2} />
        ))}
        {k >= 2 && (
          <text key={k} x={244} y={by + 3.5} textAnchor="end" fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#0f766e" className={FADE}>
            {X2_B[Math.min(bStep, 4) - 1].out}
          </text>
        )}
        <MB_Carry x={aAt} y={ay - 18} ms={900}>
          <rect x={-8} y={-5} width={16} height={9} rx={1.5} fill="#1d4ed8" />
        </MB_Carry>
        <MB_Carry x={bAt} y={by - 18} ms={900}>
          <rect x={-8} y={-5} width={16} height={9} rx={1.5} fill="#1d4ed8" />
        </MB_Carry>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: every search pays again.
//      One square per search, 1 → 10 → 100 lit; machine B's jobs climb to
//      40 লাখ, 4 কোটি, 40 কোটি while machine A's stay a quarter of that.

const X3_N = [1, 10, 100];
const X3_B = ["40 লাখ", "4 কোটি", "40 কোটি"];
const X3_A = ["10 লাখ", "1 কোটি", "10 কোটি"];
const X3_SAY = ["একজন search দিলো. 10 লাখ বইয়ে machine B র 40 লাখ কাজ.", "10 জন: 4 কোটি কাজ.", "দিনে 100 জন: 40 কোটি. প্রতিটা search এ পুরাটা আবার."];

export function HundredSearches() {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  const n = X3_N[k];
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <div className="mx-auto flex max-w-[18rem] items-center gap-3">
        <svg viewBox="0 0 121 31" role="img" aria-label={`${n} টা search`} className="block h-auto w-full max-w-[10rem] shrink-0">
          {Array.from({ length: 100 }, (_, i) => (
            <rect
              key={i}
              x={1 + (i % 20) * 6}
              y={1 + Math.floor(i / 20) * 6}
              width={5}
              height={5}
              rx={1}
              style={{ transitionDelay: `${(i % 20) * 12}ms` }}
              className={`transition-colors duration-300 motion-reduce:transition-none ${i < n ? "fill-[#0d9488]" : "fill-[#e2e8f0]"}`}
            />
          ))}
        </svg>
        <div className="min-w-0 text-sm leading-snug">
          <div className="text-xs text-muted">{n} টা search</div>
          <div>
            B: <b key={k} className={`${POP} inline-block text-cat-teal`}>{X3_B[k]}</b>
          </div>
          <div className="text-muted">
            A: <b className="font-semibold">{X3_A[k]}</b>
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation, no task: why it's more than four
//      times. Counted, B's jobs are 4 blocks against A's 1. Then the root
//      block and the ভাগ block grow heavier, and B's bar runs past the
//      "4 গুণ" mark. The widths are only a picture of "heavier", not a count.

const X3H_U = 30; // one light job
const X3H_X = 46;
const X3H_SAY = [
  "গুনলে machine B র কাজ 4 টা, machine A র 1 টা.",
  "কিন্তু root ভারি কাজ. computer এর জন্যও, গুণ-যোগের চেয়ে ভারি.",
  "ভাগও তাই.",
  "তাই আসলে ব্যাপারটা চার গুণেরও বেশি.",
];
const X3H_JOBS = [
  { name: "box", fill: "#f59e0b" },
  { name: "length", fill: "#0d9488" },
  { name: "root", fill: "#7c3aed" },
  { name: "ভাগ", fill: "#e11d48" },
];

export function HeavierThanFour() {
  const s = useScene(3, [600, 1800, 1400, 2200]);
  const k = s.k;
  const [root, div] = useTween([k >= 1 ? X3H_U * 1.9 : X3H_U, k >= 2 ? X3H_U * 1.6 : X3H_U], 900);
  const widths = [X3H_U, X3H_U, root, div];
  const four = X3H_X + 4 * X3H_U;
  const starts = widths.map((_, i) => X3H_X + widths.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <Scene scene={s} caption={say(X3H_SAY, k)}>
      <svg viewBox="0 0 250 84" role="img" aria-label="machine A র একটা কাজ, machine B র চারটা; root আর ভাগ ভারি, তাই B চার গুণেরও বেশি" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={248} height={82} rx={10} fill="white" stroke="#cbd5e1" />
        <text x={10} y={30} fontSize={9} fontWeight={800} fill="#be123c">
          A
        </text>
        <rect x={X3H_X} y={20} width={X3H_U - 1.5} height={14} rx={2} fill="#f59e0b" />
        <text x={X3H_X + X3H_U / 2} y={30} textAnchor="middle" fontSize={7} fontWeight={700} fill="white">
          box
        </text>
        <text x={10} y={62} fontSize={9} fontWeight={800} fill="#0f766e">
          B
        </text>
        {X3H_JOBS.map((j, i) => {
          const x = starts[i];
          return (
            <g key={j.name}>
              <rect x={x} y={52} width={widths[i] - 1.5} height={14} rx={2} fill={j.fill} />
              <text x={x + widths[i] / 2} y={62} textAnchor="middle" fontSize={7} fontWeight={700} fill="white">
                {j.name}
              </text>
            </g>
          );
        })}
        {/* the "four times" mark: where B would end if every job weighed the same */}
        <path d={`M${four} 44V74`} stroke={k >= 3 ? "#be123c" : MB_INK} strokeOpacity={k >= 3 ? 1 : 0.5} strokeWidth={1.4} strokeDasharray="3 2" className="transition-colors motion-reduce:transition-none" />
        <text x={four} y={80} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={k >= 3 ? "#be123c" : MB_INK}>
          4 গুণ
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: ফাহিম walks to the
//      computer and opens machine B's notebook. Columns: search, বই, box,
//      length; the rows fill with lines. No numbers, so the lengths don't
//      give the screen away.

const X4A_COLS = [{ x: 128, t: "search" }, { x: 172, t: "বই" }, { x: 218, t: "box" }, { x: 264, t: "length" }];

export function FahimLog({}: Story) {
  const s = useScene(3, [600, 1500, 1500, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ফাহিম computer এর কাছে গিয়ে machine B র খাতা খোলে; খাতায় search, বই, box, length এর ঘর, প্রতিটা search এর হিসাব লেখা">
        <MB_Shelf x={6} y={LG} />
        <MB_Desk x={204} />
        {k >= 2 && <rect x={247} y={LG - 66} width={29} height={30} rx={2} fill="#fde68a" className={FADE} />}
        {k >= 2 && (
          <text x={261.5} y={LG - 48} textAnchor="middle" fontSize={8} fontWeight={800} fill={MB_INK}>
            B
          </text>
        )}
        <Person who="fahim" x={k >= 1 ? 180 : 110} y={LG} walking={k === 1} arm={k >= 3 ? "point" : "down"} label />
        {k >= 2 && (
          <g className={POP}>
            <rect x={104} y={8} width={190} height={66} rx={4} fill="white" stroke="#b45309" strokeWidth={1.2} />
            <path d="M199 8V74" stroke="#b45309" strokeOpacity={0.35} />
            <text x={199} y={19} textAnchor="middle" fontSize={8} fontWeight={800} fill="#b45309">
              machine B র খাতা
            </text>
            {X4A_COLS.map((c) => (
              <text key={c.t} x={c.x} y={32} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={MB_INK}>
                {c.t}
              </text>
            ))}
            <path d="M110 36H288" stroke={MB_INK} strokeOpacity={0.4} />
          </g>
        )}
        {k >= 3 &&
          [0, 1, 2].map((r) =>
            X4A_COLS.map((c, i) => (
              <path
                key={`${r}${i}`}
                d={`M${c.x - 14} ${45 + r * 10}h28`}
                stroke="#64748b"
                strokeWidth={2}
                strokeLinecap="round"
                style={{ transitionDelay: `${r * 180 + i * 60}ms` }}
                className={FADE}
              />
            )),
          )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the thick book goes
//      through machine B's length station once per search, and each time the
//      same 20.02 drops onto the pile.

const X4_WORDS = ["মাছ", "নৌকা", "ধান"];
const X4_SAY = [
  "মোটা বই, আর machine B র length মাপার জায়গা.",
  "“মাছ” search: length মাপা হলো, 20.02.",
  "“নৌকা” search: আবার মাপা, আবার 20.02.",
  "“ধান” search: আবার 20.02.",
  "একই উত্তর, প্রতিবার. 10 লাখ বইয়ে, প্রতিটা search এ.",
];

export function SameTwenty() {
  const s = useScene(4, [600, 1600, 1600, 1600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <svg viewBox="0 0 250 92" role="img" aria-label="মোটা বইয়ের length তিনটা search এ তিনবার মাপা, প্রতিবার 20.02" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={248} height={90} rx={10} fill="white" stroke="#cbd5e1" />
        <rect x={14} y={30} width={26} height={34} rx={2} fill="#1d4ed8" />
        <rect x={14} y={30} width={6} height={34} fill="#1e3a8a" />
        <text x={27} y={78} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={MB_INK}>
          (20, 1, 0)
        </text>
        <rect x={86} y={34} width={52} height={26} rx={6} fill={k >= 1 && k <= 3 ? "#f59e0b" : "#f1f5f9"} stroke="#b45309" className="transition-colors duration-300 motion-reduce:transition-none" />
        <text x={112} y={50} textAnchor="middle" fontSize={9} fontWeight={700} fill={k >= 1 && k <= 3 ? "white" : MB_INK}>
          length
        </text>
        <path d="M44 47H82M142 47H168" stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="3 2" />
        {k >= 1 && k <= 3 && (
          <g key={k} className={FADE}>
            <rect x={90} y={10} width={44} height={15} rx={7.5} fill="#e0f2fe" stroke="#0284c7" strokeWidth={0.8} />
            <text x={112} y={21} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#0369a1">
              “{X4_WORDS[k - 1]}”
            </text>
          </g>
        )}
        {[0, 1, 2].map((i) =>
          k > i ? (
            <g key={i} className={POP}>
              <rect x={176} y={62 - i * 19} width={58} height={16} rx={3} fill={k >= 4 ? "#fee2e2" : "#fef3c7"} stroke={k >= 4 ? "#e11d48" : "#b45309"} strokeWidth={1} />
              <text x={205} y={74 - i * 19} textAnchor="middle" fontSize={9.5} fontWeight={800} fontFamily="ui-monospace, monospace" fill={MB_INK}>
                20.02
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: the brother takes the
//      fish note off the shelf, card (2, 0, 0); length 2, so divide by 2:
//      (1, 0, 0), a green 1 on it; back on the shelf, once.

export function BhaiShelves({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  const inHand = k === 1 || k === 2;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="আপুর ভাই shelf থেকে মাছের note নামান, card (2, 0, 0); length 2, তাই 2 দিয়ে ভাগ, (1, 0, 0); তারপর বইটা shelf এ ফেরত, একবারই">
        <MB_Shelf x={6} y={LG} />
        <MB_Desk x={214} />
        <Person who="karim" x={112} y={LG} facing={-1} arm={inHand ? "hold" : "down"} mood={k >= 3 ? "smug" : "plain"} />
        <MB_Name x={112} text="আপুর ভাই" />
        <Person who="fahim" x={176} y={LG} facing={-1} mood={k === 2 ? "puzzled" : "plain"} label />
        {/* the note: off the shelf into his hand, then back with a green 1 */}
        <MB_Carry x={inHand ? 92 : 44} y={inHand ? LG - 40 : 90} ms={1000}>
          <rect x={-3} y={-9} width={7} height={18} fill="#be185d" />
          {k >= 2 && (
            <g className={POP}>
              <circle cx={-10} cy={-8} r={6} fill="#15803d" />
              <text x={-10} y={-5} textAnchor="middle" fontSize={8} fontWeight={800} fontFamily="ui-monospace, monospace" fill="white">
                1
              </text>
            </g>
          )}
        </MB_Carry>
        {k >= 1 && <CastCard key={k >= 2 ? "b" : "a"} x={60} y={16} text={k >= 2 ? "(1, 0, 0)" : "(2, 0, 0)"} tone={k >= 2 ? "teal" : "coral"} />}
        {k === 2 && <Bubble x={112} y={LG - 66} side="right" lines={["Length 2. তাই", "সব 2 দিয়ে ভাগ."]} />}
        {k >= 3 && <Bubble x={112} y={LG - 66} side="right" lines={["একবারই. shelf এ", "তোলার সময়."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: before and now. Before,
//      every search pays box + length + root + ভাগ. Now, the length, root and
//      ভাগ are paid once at shelving, and each search pays only the box.

const X5_JOB = {
  box: "bg-[#f59e0b]",
  length: "bg-[#0d9488]",
  root: "bg-[#7c3aed]",
  ভাগ: "bg-[#e11d48]",
} as const;
type X5Job = keyof typeof X5_JOB;
const X5_SAY = [
  "আগে: প্রতিটা search এ box, length, root, ভাগ.",
  "এখন: length, root, ভাগ একবার, shelf এ তোলার সময়.",
  "তারপর প্রতিটা search এ শুধু box.",
];

function X5_Dots({ jobs }: { jobs: X5Job[] }) {
  return (
    <span className="inline-flex gap-0.5 rounded-md border border-border bg-surface px-1 py-1">
      {jobs.map((j, i) => (
        <span key={i} className={`size-2.5 rounded-sm ${X5_JOB[j]}`} />
      ))}
    </span>
  );
}

export function OnceNotEvery() {
  const s = useScene(2, [600, 2000, 2000]);
  const k = s.k;
  const all: X5Job[] = ["box", "length", "root", "ভাগ"];
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <div className="mx-auto grid max-w-[18rem] gap-2 text-xs">
        <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-0.5 text-muted">
          {all.map((j) => (
            <span key={j} className="inline-flex items-center gap-1">
              <span className={`size-2.5 rounded-sm ${X5_JOB[j]}`} />
              {j}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-[2.6rem_1fr] items-center gap-2">
          <span className="text-muted">আগে</span>
          <span className="flex flex-wrap gap-1">
            {[1, 2, 3].map((i) => (
              <X5_Dots key={i} jobs={all} />
            ))}
            <span className="self-center text-muted">…</span>
          </span>
        </div>
        <div className="grid min-h-7 grid-cols-[2.6rem_1fr] items-center gap-2">
          <span className="text-muted">এখন</span>
          <span className="flex flex-wrap items-center gap-1">
            {k >= 1 && (
              <span className={`${POP} inline-flex items-center gap-1 rounded-md bg-accent/10 px-1 py-0.5`}>
                <X5_Dots jobs={["length", "root", "ভাগ"]} />
                <span className="text-accent-text">একবার</span>
              </span>
            )}
            {k >= 2 &&
              [1, 2, 3].map((i) => (
                <span key={i} style={{ transitionDelay: `${i * 150}ms` }} className={`${POP} inline-block`}>
                  <X5_Dots jobs={["box"]} />
                </span>
              ))}
            {k >= 2 && <span className="self-center text-muted">…</span>}
          </span>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's formula, no task: cosine as box ÷ lengths;
//      hats on both, each length is 1, dividing by 1 × 1 does nothing, and
//      what's left is the plain box: cos θ = û · v̂.

const X6_SAY = [
  "Cosine: box, তারপর দুইটা length দিয়ে ভাগ.",
  "Card দুইটা আগেই 1 লম্বা. মাথায় 3.6 এর টুপি: û, v̂.",
  "1 × 1 দিয়ে ভাগ দিলে কিছুই বদলায় না.",
  "তাই সাদামাটা box-ই cosine.",
];

export function HatFormula() {
  const s = useScene(3, [600, 2200, 1800, 1800]);
  const k = s.k;
  const u = k >= 1 ? "û" : "u";
  const v = k >= 1 ? "v̂" : "v";
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      <div className="mx-auto flex w-fit items-center gap-2 font-mono text-lg">
        <span>cos θ =</span>
        {k >= 3 ? (
          <b className={`${POP} inline-block rounded-lg bg-cat-amber/15 px-2 text-cat-amber`}>
            {u} · {v}
          </b>
        ) : (
          <span className="grid justify-items-center gap-0.5">
            <span key={u}>
              {u} · {v}
            </span>
            <span className={`h-0.5 w-full bg-foreground/60 transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "opacity-25" : ""}`} />
            <span key={`d${k >= 1}`} className={`${FADE} transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "line-through opacity-40" : ""}`}>
              {k >= 1 ? "1 × 1" : "‖u‖ ‖v‖"}
            </span>
          </span>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for screen 6's second paragraph, no task: shelving vs
//      searching in a real search system. Each document is normalised once as
//      it's stored; a search runs only the box with each, one by one; then all
//      at once on a GPU.

const X6B_DOCS = [0, 1, 2, 3, 4, 5];
const X6B_SAY = [
  "জমা থাকা document গুলা.",
  "জমা রাখার সময়েই প্রতিটা একবার normalise, length 1.",
  "Search এর সময় প্রশ্নের সাথে শুধু box, একটার পর একটা.",
  "GPU সব box একসাথে চালায়. আসল system এ কোটি কোটি.",
];

export function StoreOnce() {
  const s = useScene(3, [600, 1800, 2200, 2200]);
  const k = s.k;
  const dx = (i: number) => 22 + i * 40;
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <svg viewBox="0 0 250 104" role="img" aria-label="document জমার সময় একবার normalise, search এর সময় শুধু box, GPU তে একসাথে" className="mx-auto block h-auto w-full max-w-[18rem]">
        {k >= 3 && (
          <g className={FADE}>
            <rect x={6} y={44} width={238} height={56} rx={6} fill="#ede9fe" stroke="#7c3aed" strokeWidth={1.2} />
            <text x={11} y={55} fontSize={8} fontWeight={800} fill="#6d28d9">
              GPU
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <rect x={101} y={3} width={48} height={18} rx={9} fill="#b45309" />
            <text x={125} y={15.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="white">
              প্রশ্ন
            </text>
          </g>
        )}
        {k >= 2 &&
          X6B_DOCS.map((i) => (
            <path
              key={`l${i}${k >= 3}`}
              d={`M125 20L${dx(i) + 11} 60`}
              pathLength={1}
              strokeDasharray="1 2"
              style={{ transitionDelay: `${k >= 3 ? 0 : i * 260}ms` }}
              className={`fill-none [stroke-dashoffset:0] transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none starting:[stroke-dashoffset:1] ${k >= 3 ? "stroke-[#7c3aed] [stroke-width:2]" : "stroke-[#d97706] [stroke-width:1.2]"}`}
            />
          ))}
        {X6B_DOCS.map((i) => (
          <g key={i}>
            <rect x={dx(i)} y={60} width={22} height={28} rx={2} fill="white" stroke="#94a3b8" />
            {[0, 1, 2].map((r) => (
              <path key={r} d={`M${dx(i) + 4} ${67 + r * 5}h14`} stroke="#cbd5e1" strokeWidth={1.4} />
            ))}
            {k >= 1 && (
              <g className={POP}>
                <circle cx={dx(i) + 20} cy={62} r={6} fill="#15803d" />
                <text x={dx(i) + 20} y={65} textAnchor="middle" fontSize={8} fontWeight={800} fontFamily="ui-monospace, monospace" fill="white">
                  1
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: ফাহিম asks whether
//      "closest" (distance) needs a sum of its own; the brother says measure
//      it. Not answered.

export function FahimAsks({}: Story) {
  const s = useScene(3, [600, 2200, 2000, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ফাহিম বলে শহরের search নাকি distance দিয়ে সবচেয়ে কাছের বই খোঁজে, তাহলে কি আরেকটা হিসাব লাগবে; আপুর ভাই বলেন, মেপে দেখো">
        <MB_Shelf x={6} y={LG} />
        <MB_Desk x={226} />
        <Person who="fahim" x={112} y={LG} arm={k === 1 ? "point" : "down"} mood={k === 2 ? "puzzled" : "plain"} label />
        <Person who="karim" x={190} y={LG} facing={-1} mood={k >= 3 ? "smug" : "plain"} />
        <MB_Name x={190} text="আপুর ভাই" />
        {k === 1 && <Bubble x={112} y={LG - 66} side="right" lines={["শহরের search নাকি", "distance দিয়ে খোঁজে."]} />}
        {k === 2 && <Bubble x={112} y={LG - 66} side="right" lines={["তাহলে আরেকটা", "হিসাব লাগবে?"]} />}
        {k >= 3 && <Bubble x={190} y={LG - 66} side="left" lines={["মেপে দেখো."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: the three shelved cards
//      under three measures. Box and cosine give 1, 0.999, 0.424; distance
//      gives 0, 0.05, 1.07 (smaller first). One order.

const X7_SAY = [
  "Shelf এর তিনটা card, “মাছ” search.",
  "Box: note, মোটা বই, নৌকা-ধান.",
  "Cosine: হুবহু একই সংখ্যা, একই order.",
  "Distance: এখানে ছোট মানে কাছে. 0, 0.05, 1.07.",
  "তিনটা মাপ, একটাই order.",
];
const X7_COLS = [
  { name: "box", val: (u: number[]) => fix(dot(QUERY, u), 3) },
  { name: "cosine", val: (u: number[]) => fix(dot(QUERY, u), 3) },
  { name: "distance", val: (u: number[]) => fix(len(u.map((x, i) => x - QUERY[i])), 2) },
];

export function SameOrderThree() {
  const s = useScene(4, [600, 1600, 1600, 2000, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X7_SAY, k)}>
      <div className="mx-auto grid max-w-[18rem] grid-cols-[5rem_repeat(3,1fr)] gap-x-1 gap-y-1 text-xs">
        <span />
        {X7_COLS.map((c, i) => (
          <span key={c.name} className={`text-center font-semibold ${k > i ? "" : "opacity-30"}`}>
            {c.name}
          </span>
        ))}
        {MB_UNIT.map((b, r) => (
          <div key={b.id} className="contents">
            <span className={`rounded px-1 py-0.5 whitespace-nowrap transition-colors duration-500 motion-reduce:transition-none ${k >= 4 ? "bg-accent/15" : ""}`}>
              {r + 1}. {b.short}
            </span>
            {X7_COLS.map((c, i) => (
              <span key={c.name} className={`rounded py-0.5 text-center font-mono transition-colors duration-500 motion-reduce:transition-none ${k >= 4 ? "bg-accent/15" : ""}`}>
                {k > i ? (
                  <span style={{ transitionDelay: `${r * 200}ms` }} className={`${POP} inline-block`}>
                    {c.val(b.u)}
                  </span>
                ) : (
                  ""
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the two shelved cards
//      (0.6, 0.8) and (0.8, 0.6): box 0.96, an angle of about 16°, and tips
//      only 0.28 apart — screen 7's rule in one pair.

const X8_SAY = [
  "Shelf এর দুইটা card, দুইটাই ring এর উপরে.",
  "Box: 0.48 + 0.48 = 0.96.",
  "0.96 মানে প্রায় একই দিক. মাঝে মাত্র 16°.",
  "মাথা দুইটা মাত্র 0.28 দূরে. Box বড়, মাথা কাছে.",
];

export function CloseTips() {
  const s = useScene(3, [600, 1600, 1800, 2000]);
  const k = s.k;
  const O = { x: 30, y: 96 };
  const R = 84;
  const a = [O.x + 0.6 * R, O.y - 0.8 * R];
  const b = [O.x + 0.8 * R, O.y - 0.6 * R];
  const arc = 26;
  return (
    <Scene scene={s} caption={say(X8_SAY, k)}>
      <div className="mx-auto flex max-w-[18rem] items-center gap-3">
        <svg viewBox="0 0 130 104" role="img" aria-label="(0.6, 0.8) আর (0.8, 0.6), মাঝে প্রায় 16°, মাথার দূরত্ব 0.28" className="block h-auto w-full max-w-[9rem] shrink-0">
          <rect x={1} y={1} width={128} height={102} rx={8} fill="white" stroke="#cbd5e1" />
          <path d={`M${O.x + R} ${O.y}A${R} ${R} 0 0 0 ${O.x} ${O.y - R}`} fill="none" stroke={MB_INK} strokeOpacity={0.2} strokeDasharray="3 3" />
          <MB_Arr x1={O.x} y1={O.y} x2={a[0]} y2={a[1]} color="#2563eb" />
          <MB_Arr x1={O.x} y1={O.y} x2={b[0]} y2={b[1]} color="#0d9488" />
          {k >= 2 && (
            <path d={`M${O.x + 0.8 * arc} ${O.y - 0.6 * arc}A${arc} ${arc} 0 0 0 ${O.x + 0.6 * arc} ${O.y - 0.8 * arc}`} fill="none" stroke="#b45309" strokeWidth={2} className={FADE} />
          )}
          {k >= 3 && <path d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke="#e11d48" strokeWidth={2.4} className={FADE} />}
        </svg>
        <div className="min-w-0 text-sm leading-relaxed">
          <div className={k >= 1 ? "" : "opacity-30"}>
            box <b className="font-mono">{k >= 1 ? "0.96" : "?"}</b>
          </div>
          <div className={k >= 2 ? "" : "opacity-30"}>
            angle <b className="font-mono text-cat-amber">{k >= 2 ? "16°" : "?"}</b>
          </div>
          <div className={k >= 3 ? "" : "opacity-30"}>
            দূরত্ব <b className="font-mono text-cat-coral">{k >= 3 ? "0.28" : "?"}</b>
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for screen 9's explanation, no task: the new book two ways.
//      Machine B on the raw card (6, 8, 0): box 6, length 10, ভাগ, 0.6 — four
//      jobs. The shelved card (0.6, 0.8, 0): box, 0.6 — one job.

const X9_SAY = [
  "একই বই, দুইভাবে. উপরে machine B, নিচে shelf এর card.",
  "Machine B: box 6, length 10 (বর্গ যোগ 100, root), ভাগ: 0.6.",
  "Shelf এর card: শুধু box, 0.6.",
  "একই উত্তর. উপরে 4 টা কাজ, নিচে 1 টা.",
];

export function SixEightTwoWays() {
  const s = useScene(3, [600, 2200, 1800, 2000]);
  const k = s.k;
  const row = (label: string, cardText: string, jobs: string[], out: string, on: boolean, tone: string) => (
    <div className="grid gap-1 rounded-xl border border-border bg-surface px-2 py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        <span className="font-mono text-xs">{cardText}</span>
      </div>
      <div className="flex items-center gap-1">
        {jobs.map((j, i) => (
          <span
            key={j}
            style={{ transitionDelay: `${on ? i * 350 : 0}ms` }}
            className={`rounded-md px-1.5 py-0.5 text-[0.7rem] leading-none transition-colors duration-300 motion-reduce:transition-none ${on ? "bg-cat-amber text-white" : "bg-foreground/8 text-muted"}`}
          >
            {j}
          </span>
        ))}
        <span className="ml-auto font-mono text-sm font-bold">
          {on ? (
            <span key="o" style={{ transitionDelay: `${jobs.length * 350}ms` }} className={`${FADE} ${tone}`}>
              {out}
            </span>
          ) : (
            <span className="text-muted">?</span>
          )}
        </span>
      </div>
    </div>
  );
  return (
    <Scene scene={s} caption={say(X9_SAY, k)}>
      <div className="mx-auto grid max-w-[17rem] gap-1.5">
        {row("machine B", "(6, 8, 0)", B_JOBS, "0.6", k >= 1, "text-cat-teal")}
        {row("shelf এর card", "(0.6, 0.8, 0)", ["box"], "0.6", k >= 2, "text-cat-coral")}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10 · A story scene for the closing step's first paragraph, no task: the bet
//      settled. The brother's claim from screen 2 comes back; the books go on
//      the shelf with a 1 each, once; a “মাছ” search, and windows A and B show
//      the same 0.999; the answer didn't move.

export function BetSettled({}: Story) {
  const s = useScene(3, [600, 2200, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="আপুর ভাইয়ের কথা: machine B-কে machine A র মতোই দ্রুত করা যায়; বইগুলো shelf এ তোলার সময় একবার normalise; তারপর মাছ search এ machine A আর B দুইটাই 0.999, উত্তর বদলায় নি">
        <MB_Shelf x={6} y={LG} />
        <MB_Desk x={150} />
        {/* one green 1 on each shelf row, once the books are normalised */}
        {k >= 2 &&
          [0, 1, 2].map((r) => (
            <g key={r} className={POP} style={{ transitionDelay: `${r * 200}ms` }}>
              <circle cx={78} cy={LG - r * 26 - 14} r={6} fill="#15803d" stroke="white" strokeWidth={1} />
              <text x={78} y={LG - r * 26 - 11} textAnchor="middle" fontSize={8} fontWeight={800} fontFamily="ui-monospace, monospace" fill="white">
                1
              </text>
            </g>
          ))}
        {k === 2 && <MB_Note x={150} y={22} lines={["shelf এ তোলার সময়", "একবার normalise"]} tone="#15803d" />}
        {k >= 3 && <MB_Note x={150} y={22} lines={["“মাছ” search", "শুধু box"]} tone="#b45309" />}
        {k >= 3 &&
          [0, 1].map((i) => (
            <text key={i} x={176.5 + i * 31} y={LG - 39} textAnchor="middle" fontSize={6.5} fontWeight={800} fontFamily="ui-monospace, monospace" fill={i === 0 ? "#be123c" : "#0f766e"} className={FADE}>
              0.999
            </text>
          ))}
        <Person who="fahim" x={118} y={LG} mood="plain" label />
        <Person who="rina" x={242} y={LG} facing={-1} scale={0.95} />
        <MB_Name x={240} text="লাইব্রেরির আপু" />
        <Person who="karim" x={296} y={LG} facing={-1} mood={k >= 3 ? "smug" : "plain"} />
        <MB_Name x={298} text="আপুর ভাই" />
        {k === 1 && <Bubble x={296} y={LG - 66} side="left" lines={["B-কে A র মতোই", "দ্রুত করা যায়."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10a · The closing story scene, no task: night, a phone call. ফাহিম tells
//       সোম the day; সোম says the haat's box runs inside ChatGPT too; ফাহিম
//       is left with the question. Not answered.

function MB_Waves({ x, y }: { x: number; y: number }) {
  return (
    <g className={FADE} fill="none" stroke="#fde68a" strokeWidth={1.4} strokeLinecap="round">
      {[6, 12, 18].map((r) => (
        <path key={r} d={`M${x - r * 0.6} ${y - r}q${r * 0.9} ${r} 0 ${r * 2}`} transform={`rotate(-90 ${x} ${y})`} />
      ))}
    </g>
  );
}

export function NightCall({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাতে ফাহিম সোমকে ফোন করে library র গল্প বলে; সোম বলে হাটের ওই box ChatGPT র ভিতরেও চলে; ফাহিম ভাবতে থাকে">
        <Building x={4} y={LG} w={66} h={72} color="#334155" />
        <Building x={250} y={LG} w={66} h={72} color="#334155" />
        <Person who="fahim" x={98} y={LG} arm="hold" mood={k >= 3 ? "puzzled" : "plain"} />
        <MB_Name x={98} text="ফাহিম" light />
        <Person who="som" x={222} y={LG} facing={-1} arm="hold" mood={k === 2 ? "smug" : "plain"} />
        <MB_Name x={222} text="সোম" light />
        {k >= 1 && k < 3 && (
          <>
            <MB_Waves x={134} y={100} />
            <MB_Waves x={186} y={100} />
          </>
        )}
        {k === 1 && <Bubble x={98} y={LG - 66} side="right" lines={["আজকে library তে", "একটা কাণ্ড হলো..."]} />}
        {k === 2 && <Bubble x={222} y={LG - 66} side="left" lines={["হাটের ওই box তো", "ChatGPT র ভিতরেও চলে."]} />}
        {k >= 3 && <Bubble x={98} y={LG - 66} side="right" tone="think" lines={["ChatGPT র ভিতরে", "হাটের box?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  RecallTwice: { start: {}, wrong: { pick: 0, miss: 1 }, right: { pick: 1 } },
  SpeedBet: { start: {}, bet: { bet: 0 } },
  CostRace: { start: {}, small: { size: 0, shown: 0, seen: [0] }, big: { size: 2, shown: 2, seen: [0, 1, 2] } },
  SameLength: { start: {}, one: { runs: [0] }, all: { runs: [0, 1, 2] }, wrong: { runs: [0, 1, 2], pick: "box", miss: 1 }, right: { runs: [0, 1, 2], pick: "len" } },
  ShelveOnce: { start: {}, one: { shelved: ["B"] }, all: { shelved: ["A", "B", "C"] } },
  BoxOnShelved: { start: {}, one: { ran: ["B"] }, ran: { ran: ["A", "B", "C"] }, raced: { ran: ["A", "B", "C"], raced: true } },
  TipGap: { start: {}, some: { deg: 60, seen: [0, 1] }, all: { deg: 180, seen: [0, 1, 2, 3] } },
  YourCos: { start: {}, over: { pick: 0, miss: 1 }, divide: { pick: 3, miss: 1 }, right: { pick: 1 } },
  TryShelve: { start: {}, sum: { pick: 0, miss: 1 }, big: { pick: 2, miss: 1 }, right: { pick: 1 } },
  // Story scenes and figures: `k` is the beat shown (no seed shows the last).
  CatalogueArrives: { rest: { k: 0 }, pen: { k: 2 }, ask: { k: 3 }, done: {} },
  MachineInsides: { rest: { k: 0 }, a: { k: 1 }, sq: { k: 3 }, done: {} },
  HundredSearches: { one: { k: 0 }, done: {} },
  HeavierThanFour: { rest: { k: 0 }, root: { k: 1 }, done: {} },
  FahimLog: { rest: { k: 0 }, open: { k: 2 }, done: {} },
  BetSettled: { rest: { k: 0 }, claim: { k: 1 }, shelf: { k: 2 }, done: {} },
  SameTwenty: { rest: { k: 0 }, two: { k: 2 }, done: {} },
  BhaiShelves: { rest: { k: 0 }, card: { k: 1 }, div: { k: 2 }, done: {} },
  OnceNotEvery: { rest: { k: 0 }, once: { k: 1 }, done: {} },
  HatFormula: { rest: { k: 0 }, hats: { k: 1 }, done: {} },
  StoreOnce: { norm: { k: 1 }, done: {} },
  FahimAsks: { ask: { k: 1 }, done: {} },
  SameOrderThree: { box: { k: 1 }, dist: { k: 3 }, done: {} },
  CloseTips: { rest: { k: 0 }, done: {} },
  SixEightTwoWays: { rest: { k: 0 }, b: { k: 1 }, done: {} },
  NightCall: { rest: { k: 0 }, som: { k: 2 }, done: {} },
};
