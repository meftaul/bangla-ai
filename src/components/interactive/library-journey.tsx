"use client";

import type { ReactNode } from "react";

import { Bubble, Building, Card as CastCard, Person, Stage, StoryFrame, Tree } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, LOOK, Nope, POP, Scene, Ticks, pill, usePlay, useScene, useSeed, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { DotBox, dot } from "./haat-journey";
import { Tup } from "@/components/journey/box";

// Screens for "Math for AI 4.7 — The library search, the box or cosine"
// (04f_library_search), in the author's Banglish. 4.8 and 4.9 have their own
// files (millionbooks-journey.tsx, attention-journey.tsx).
//
// 4.7, step by step: (1) the recall at the door, 4.6's ropes on a picture;
// (2) the village library's new computer has two search machines, and for
// "মাছ" they disagree: the box ranks the boats-and-paddy book above a short
// letter about fish. The reader bets which one লাইব্রেরির আপু keeps. (3) the
// box once more, (1, 0, 0) · (4, 2, 7); (4, 5) both machines run by hand, bars
// growing: 2, 20, 3 against 1.000, 0.999, 0.424; (6) the loud film হুলুস্থুল
// (5, 5) wins for মামা and মামি alike under the box, for neither under
// cosine; (7) 3.6's notebook: normalise to find the biggest spender?; (8) six
// jobs sorted by whether length is news; (9) your turn, আপুর list, five jobs
// into box / cosine / distance; (10) Try it, a newspaper search for "ইলিশ";
// (11) আপু keeps machine B and machine A stays, then the district catalogue
// freezes machine B (the bridge to 4.8, 04f1_million_books).
//
// Story scenes for the setups (2a the library, 6a the film at home, 9a the
// list, 11a আপু keeps both, 11b the catalogue freeze), and one or two
// watch-only figures for every <Then> (1½, 2½, 3½, 4½, 4¾, 5½, 5¾, 6½, 6¾,
// 7½, 8½, 8⅝, 8¾ in the side quest, 9½, 10½), and 10a the newspaper
// cupboard. They sit at the end of the file.
//
// Tailwind only.

const len = (v: readonly number[]) => Math.hypot(...v);
const fix = (n: number, d: number) => {
  const s = Math.abs(n).toFixed(d);
  return n < 0 && Number(s) !== 0 ? `−${s}` : s;
};

// Books as word counts: (fish, boats, paddy).
const QUERY = [1, 0, 0];
const BOOKS = [
  { id: "A", name: "a short note on fish", v: [2, 0, 0] },
  { id: "B", name: "the thick book on fish", v: [20, 1, 0] },
  { id: "C", name: "the boats-and-paddy book", v: [3, 5, 4] },
];
const cosQ = (v: readonly number[]) => dot(QUERY, v) / (len(QUERY) * len(v));
const rankBy = (score: (v: readonly number[]) => number, low = false) =>
  [...BOOKS].sort((a, b) => (low ? score(a.v) - score(b.v) : score(b.v) - score(a.v)));

// ---------------------------------------------------------------------------
// 4.7's names, in the lesson's own words. BOOKS, TASTES and FILMS keep their
// English names in the data; 4.7 shows these.

const BOOK_BN: Record<string, { full: string; short: string }> = {
  A: { full: "মাছ নিয়ে ছোট একটা চিঠি", short: "চিঠি" },
  B: { full: "মাছ নিয়ে মোটা একটা বই", short: "মোটা বই" },
  C: { full: "নৌকা আর ধানের বই", short: "নৌকা-ধান" },
};
/** what each slot of a list counts, for Tup's hover */
const BOOK_SLOTS = ["মাছ", "নৌকা", "ধান"];
const FILM_SLOTS = ["কান্না", "হাসি"];
const NEWS_SLOTS = ["ইলিশ", "দাম", "রাজনীতি"];
const COW_SLOTS = ["ওজন", "দুধ", "বয়স"];
const TEA_SLOTS = ["চা", "শরবত"];
const WHO_BN: Record<string, string> = { Mama: "মামা", Mami: "মামি" };
const FILM_BN: Record<string, string> = { Hullabaloo: "হুলুস্থুল" };
const filmBn = (name: string) => FILM_BN[name] ?? name;

/** A compact answer tile for a row of three: a picture (or a number) over a short label, in Choice's looks. */
function PicChoice({ look, disabled, onClick, children }: { look: Look; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 px-1.5 py-2 text-center text-sm leading-snug transition-[color,background-color,border-color,opacity] duration-200 motion-reduce:transition-none disabled:cursor-default ${LOOK[look]}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 1 · The recall at the door, on 4.6's ghat: the boat 3 metres off the bank,
//     a pull of 10. Which rope sends more of it forward, 4 metres or 15, or
//     both the same? Each pick draws its rope(s) and grows the forward share:
//     6.6 on the short rope (the rest goes to the bank), 9.8 on the long.

const R1_M = 16.5; // px per metre
const R1_BANK = 96;
const R1_BOAT = 30;
const R1_ROPES = [4, 15];
const R1_ALONG = R1_ROPES.map((L) => Math.sqrt(L * L - 9));
const R1_FWD = R1_ROPES.map((L, i) => (10 * R1_ALONG[i]) / L); // 6.6, 9.8
const R1_RIGHT = 1;
const R1_OPTS = ["4 metre দড়ি", "15 metre দড়ি", "দুইটাতেই সমান"];
const R1_TONE = ["#e11d48", "#0f766e"]; // the short rope coral, the long one teal (literals: the ink consts are declared further down)

/** A thumbnail for a rope choice: the bank, the boat, and rope `i` (2 = both). */
function R1_Pic({ i }: { i: number }) {
  const ropes = i === 2 ? [0, 1] : [i];
  return (
    <svg viewBox="0 0 84 36" aria-hidden="true" className="block h-auto w-20 shrink-0">
      <rect x={0.5} y={0.5} width={83} height={35} rx={5} fill="#e0f2fe" stroke="#cbd5e1" />
      <rect x={0.5} y={27} width={83} height={8.5} fill="#a3b18a" />
      <path d="M4 12h12l-2 3h-8Z" fill="#92400e" />
      {ropes.map((r) => {
        const x = 10 + R1_ALONG[r] * 4.7;
        return (
          <g key={r}>
            <path d={`M10 12L${x} 27`} stroke={R1_TONE[r]} strokeWidth={1.6} />
            <circle cx={x} cy={24} r={2.6} fill={R1_TONE[r]} />
          </g>
        );
      })}
    </svg>
  );
}

export function RopeRecallPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const p = usePlay(950);
  const on = (r: number) => pick === r || pick === 2;
  const [f0, f1] = useTween([on(0) ? R1_FWD[0] : 0, on(1) ? R1_FWD[1] : 0], 900);
  const f = [f0, f1];
  const boatY = R1_BANK - 3 * R1_M;

  const choose = (i: number) => {
    setPick(i);
    if (i === R1_RIGHT) p.play(1, () => pass("লম্বা দড়ি, ছোট angle, টানের বেশিটা সামনে."));
    else setMiss(miss + 1);
  };

  return (
    <>
      <div className="text-center text-sm text-muted">4.6 এর ঘাট. নৌকা পাড় থেকে 3 metre দূরে, মাঝিরা টানে মোট 10.</div>
      <svg viewBox="0 0 290 116" role="img" aria-label="নৌকা পাড় থেকে 3 metre দূরে; বেছে নেয়া দড়িতে টানের কতটুকু সামনে যায়" className="mx-auto mt-1 block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={288} height={114} rx={10} fill="#e0f2fe" stroke="#cbd5e1" />
        <rect x={1} y={R1_BANK} width={288} height={19} fill="#a3b18a" />
        <text x={8} y={R1_BANK + 13} fontSize={8} fill={L_INK}>
          পাড়
        </text>
        <path d={`M${R1_BOAT - 16} ${boatY - 2}h32l-5 8h-22Z`} fill="#92400e" />
        <path d={`M${R1_BOAT - 8} ${boatY + 12}V${R1_BANK - 2}`} stroke={L_INK} strokeOpacity={0.4} strokeDasharray="2 2" />
        <text x={R1_BOAT - 5} y={(boatY + R1_BANK) / 2 + 6} fontSize={7.5} fontFamily="ui-monospace, monospace" fill={L_INK}>
          3 m
        </text>
        <text x={R1_BOAT} y={14} fontSize={7.5} fill="#0f766e">
          সামনে যায়, নদী বরাবর
        </text>
        {R1_ROPES.map((L, r) => {
          if (!on(r)) return null;
          const mx = R1_BOAT + R1_ALONG[r] * R1_M;
          const y = 24 + r * 12;
          return (
            <g key={`${r}${pick}`} className={FADE}>
              <Draw d={`M${R1_BOAT} ${boatY}L${mx} ${R1_BANK - 8}`} ms={600} strokeWidth={1.6} className="stroke-[#78350f]" />
              <circle cx={mx} cy={R1_BANK - 8} r={4.5} fill={R1_TONE[r]} />
              <text x={Math.min(mx, 262)} y={R1_BANK + 13} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={L_INK}>
                {`${L} m`}
              </text>
              <path d={`M${R1_BOAT} ${y}H${R1_BOAT + f[r] * 14}`} stroke={R1_TONE[r]} strokeWidth={6} strokeLinecap="round" />
              <text x={R1_BOAT + f[r] * 14 + 6} y={y + 3} fontSize={9} fontWeight={800} fontFamily="ui-monospace, monospace" fill={R1_TONE[r]}>
                {`${fix(f[r], 1)} · ${L} m`}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {R1_OPTS.map((o, i) => (
          <PicChoice key={o} look={pick === i ? (i === R1_RIGHT ? "right" : "wrong") : "idle"} disabled={pick === R1_RIGHT} onClick={() => choose(i)}>
            <R1_Pic i={i} />
            <span>{o}</span>
          </PicChoice>
        ))}
      </div>
      {pick === 0 && <Nope key={miss}>4 metre দড়িতে সামনে যায় মোটে 6.6. কেন? দড়ি খাড়া, angle বড়. টানের বড় একটা অংশ চলে যায় পাড়ের দিকে.</Nope>}
      {pick === 2 && <Nope key={miss}>সমান না: 6.6 আর 9.8. দড়ি লম্বা হলে angle ছোট হয়, না বড়?</Nope>}
      <Task done={pick === R1_RIGHT && !p.running}>কোন দড়িতে মোট 10 এর বেশিটা নৌকাকে সামনে নেয়? ছবিতে tap করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Two machines, one query. Machine A ranks by the box, machine B by
//     cosine, and they disagree about the boats-and-paddy book. The lists
//     print row by row; the reader bets which the library apu should keep,
//     and the bet is stamped on that machine, unmarked. The finale settles it.

const MACHINES = [
  { name: "machine A", order: rankBy((v) => dot(QUERY, v)) },
  { name: "machine B", order: rankBy(cosQ) },
];
const KEEP_BET = ["machine A. মোটা বইটায় তো আসলেই মাছ ভর্তি", "machine B", "দুইটাই চলবে, উত্তর তো প্রায় একই"];

export function TwoMachines() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি ধরা হলো. শেষে মিলিয়ে দেখবো.");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-full border-2 border-border px-4 py-1 text-sm">
        Search: <b>মাছ</b>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {MACHINES.map((m, mi) => {
          const mine = bet === mi || bet === 2;
          return (
            <div key={m.name} className={`relative rounded-xl border-2 bg-surface px-2 py-2 transition-colors motion-reduce:transition-none ${mine ? "border-cat-blue" : "border-border"}`}>
              <div className="text-center text-sm font-semibold">{m.name}</div>
              <ol className="mt-1 grid gap-1 text-[0.8rem] leading-snug">
                {m.order.map((b, i) => (
                  <li key={b.id} style={{ transitionDelay: `${300 + (mi * 3 + i) * 220}ms` }} className={`${FADE} rounded-md px-1.5 py-0.5 ${b.id === "C" ? "bg-cat-coral/10" : ""}`}>
                    {i + 1}. {BOOK_BN[b.id].full}
                  </li>
                ))}
              </ol>
              {mine && <span className={`${POP} absolute -top-2.5 right-2 inline-block rounded-full bg-cat-blue px-2 text-xs font-semibold text-white`}>আপনার বাজি</span>}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-sm font-medium text-muted">মাছের বই খুঁজতে আপু কোন machine টা রাখবেন?</div>
      <div className="mt-2 grid gap-2">
        {KEEP_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>দুইটা list দেখে একটার উপরে বাজি ধরুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The box, once more, before machine A runs: (1, 0, 0) · (4, 2, 7).
//     Three answers to pick, and each one plays out: 4 multiplies slot by
//     slot and adds; (4, 0, 0) multiplies but never adds; 13 ignores the
//     query and adds the book's slots.

const H3_Q = [1, 0, 0];
const H3_B = [4, 2, 7];
const H3_SLOTS = ["মাছ", "নৌকা", "ধান"];
const H3_OPTS = ["(4, 0, 0)", "13", "4"];
const H3_RIGHT = 2;

export function OneHotPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const p = usePlay(560);
  const at = pick === null ? 0 : p.running ? p.k : 4;
  const sum13 = pick === 1;

  const choose = (i: number) => {
    setPick(i);
    p.play(4, i === H3_RIGHT ? () => pass("শুধু first slot টিকে থাকে: 4.") : undefined);
    if (i !== H3_RIGHT) setMiss(miss + 1);
  };

  const cell = "grid h-9 place-items-center rounded-lg border font-mono text-base font-semibold transition-opacity duration-500 motion-reduce:transition-none";
  return (
    <>
      <div className="mx-auto grid w-full max-w-xs grid-cols-[3.2rem_1fr_1fr_1fr] items-center gap-1.5">
        <span />
        {H3_SLOTS.map((s) => (
          <span key={s} className="text-center text-xs text-muted">
            {s}
          </span>
        ))}
        <span className="text-xs font-semibold">query</span>
        {H3_Q.map((q, i) => (
          <span key={i} className={`${cell} border-cat-blue/40 bg-cat-blue/5 ${sum13 && at >= 1 ? "opacity-25" : ""}`}>
            {q}
          </span>
        ))}
        <span className="text-xs font-semibold">বই</span>
        {H3_B.map((b, i) => (
          <span key={i} className={`${cell} border-cat-amber/50 bg-cat-amber/10 ${!sum13 && at > i && H3_Q[i] === 0 ? "opacity-40" : ""}`}>
            {b}
          </span>
        ))}
        <span className="text-xs font-semibold">{sum13 ? "" : "গুণ"}</span>
        {H3_B.map((b, i) =>
          !sum13 && at > i ? (
            <span key={i} className={`${POP} inline-block text-center font-mono text-sm ${H3_Q[i] === 0 ? "text-muted" : "font-bold text-cat-blue"}`}>
              {`${H3_Q[i]} × ${b} = ${H3_Q[i] * b}`}
            </span>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      <div className="mt-2 h-9 text-center">
        {at >= 4 && pick === H3_RIGHT && <b className={`${POP} inline-block rounded-xl bg-accent px-3 py-1 font-mono text-lg text-accent-foreground`}>4 + 0 + 0 = 4</b>}
        {at >= 4 && pick === 0 && <span className={`${FADE} inline-block rounded-xl border-2 border-dashed border-danger/50 px-3 py-1 font-mono text-lg text-danger`}>(4, 0, 0) … যোগ?</span>}
        {sum13 && at >= 2 && <span className={`${FADE} inline-block rounded-xl border-2 border-dashed border-danger/50 px-3 py-1 font-mono text-lg text-danger`}>{at >= 4 ? "4 + 2 + 7 = 13" : "4 + 2 + 7"}</span>}
      </div>
      <div className="mt-3 text-sm font-medium text-muted">(1, 0, 0) · (4, 2, 7) কত?</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {H3_OPTS.map((o, i) => (
          <PicChoice key={o} look={pick === i && !p.running ? (i === H3_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={pick === H3_RIGHT} onClick={() => choose(i)}>
            <span className="font-mono text-base font-semibold whitespace-nowrap">{o}</span>
          </PicChoice>
        ))}
      </div>
      {pick === 0 && !p.running && <Nope key={miss}>গুণগুলা ঠিক আছে. কিন্তু box শেষে সব যোগ করে একটাই number দেয়, list না.</Nope>}
      {pick === 1 && !p.running && <Nope key={miss}>এটা তো query বাদ দিয়ে বইয়ের সব slot যোগ. 0 দিয়ে গুণ করলে কী থাকে?</Nope>}
      <Task done={pick === H3_RIGHT && !p.running}>(1, 0, 0) আর (4, 2, 7) এর box কত? একটা বেছে নিয়ে box খুলে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Machine A, by hand. The query (1, 0, 0) into the box with each book;
//     each run grows the book's bar to its score: 2, 20, 3. The
//     boats-and-paddy book beats the fish letter.

/** A book the reader runs: name and list on top, and under it a bar that grows to `frac` of the way. */
function BookBar({ id, v, score, frac, on, onClick, label, tone }: { id: string; v: number[]; score: string; frac: number; on: boolean; onClick: () => void; label: string; tone: string }) {
  return (
    <button
      type="button"
      disabled={on}
      onClick={onClick}
      className={`w-full cursor-pointer rounded-xl border-2 px-3 py-1.5 text-left transition-colors motion-reduce:transition-none disabled:cursor-default ${
        on ? "border-cat-blue/40 bg-cat-blue/5" : "border-border hover:border-cat-blue/60"
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className={`block text-sm font-semibold ${id === "C" ? "text-cat-coral" : ""}`}>{BOOK_BN[id].full}</span>
          <span className="font-mono text-xs text-muted"><Tup v={v} of={BOOK_SLOTS} /></span>
        </span>
        {on ? (
          <b key={score} className={`${POP} inline-block font-mono text-lg`}>
            {score}
          </b>
        ) : (
          <span className="text-xs whitespace-nowrap text-cat-blue">{label}</span>
        )}
      </span>
      <span className="mt-1 block h-2 rounded-full bg-foreground/10">
        <span className={`block h-full rounded-full ${tone} transition-[width,background-color] duration-700 ease-out motion-reduce:transition-none`} style={{ width: `${Math.max(0, frac) * 100}%` }} />
      </span>
    </button>
  );
}

export function DotRanking() {
  const pass = useGate();
  const [ran, setRan] = useSeed<string[]>("ran", []);
  const all = ran.length === BOOKS.length;

  const run = (id: string) => {
    if (ran.includes(id)) return;
    const next = [...ran, id];
    setRan(next);
    if (next.length === BOOKS.length) pass("Box তুলে দিলো লম্বা বইটাকে.");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border border-border bg-surface px-3 py-1 text-center text-sm">
        Query “মাছ” = <b className="font-mono">(1, 0, 0)</b>
        <div className="text-xs text-muted">slot গুলা গোনে (মাছ, নৌকা, ধান)</div>
      </div>
      <div className="mt-3 grid gap-2">
        {BOOKS.map((b) => (
          <BookBar key={b.id} id={b.id} v={b.v} score={String(dot(QUERY, b.v))} frac={ran.includes(b.id) ? dot(QUERY, b.v) / 20 : 0} on={ran.includes(b.id)} onClick={() => run(b.id)} label="box চালান" tone="bg-cat-amber" />
        ))}
      </div>
      {all && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          Order: <b>মোটা বই</b> 20, <b className="text-cat-coral">নৌকা-ধান</b> 3, <b>চিঠি</b> 2
        </div>
      )}
      <Task done={all}>প্রতিটা বইয়ের সাথে query র box চালান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Machine B, by hand. Each bar starts at the box's number (grey, out of
//     20) and, divided by the lengths, glides to cosine (teal, out of 1):
//     1.000, 0.999, 0.424. The fish letter shoots up; boats-and-paddy stays last.

export function CosRanking() {
  const pass = useGate();
  const [ran, setRan] = useSeed<string[]>("ran", []);
  const all = ran.length === BOOKS.length;

  const run = (id: string) => {
    if (ran.includes(id)) return;
    const next = [...ran, id];
    setRan(next);
    if (next.length === BOOKS.length) pass("Length ভাগ দিলে মাছের বই উপরে ওঠে.");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border border-border bg-surface px-3 py-1 text-center text-sm">
        Query র length <b className="font-mono">1</b>
      </div>
      <div className="mt-3 grid gap-2">
        {BOOKS.map((b) => {
          const on = ran.includes(b.id);
          return (
            <div key={b.id}>
              <BookBar id={b.id} v={b.v} score={fix(cosQ(b.v), 3)} frac={on ? cosQ(b.v) : dot(QUERY, b.v) / 20} on={on} onClick={() => run(b.id)} label="length দিয়ে ভাগ দিন" tone={on ? "bg-cat-teal" : "bg-foreground/25"} />
              {on && (
                <div className={`${FADE} mt-0.5 text-right font-mono text-xs text-muted`}>
                  {dot(QUERY, b.v)} ÷ (1 × {fix(len(b.v), 2)})
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Task done={all}>প্রতিটা বইয়ের box এর number কে দুইটা length দিয়ে ভাগ দিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The loud film. হুলুস্থুল (5, 5) is loud in both genres. Under the box
//     it wins for মামা (35) and মামি (25) alike; under cosine each gets their
//     own genre. The reader toggles both rules; the numbers pop in afresh,
//     each cell's bar glides to its new share and the winner's cell lights up.

const TASTES = [
  { who: "Mama", v: [2, 5] },
  { who: "Mami", v: [4, 1] },
];
const FILMS = [
  { name: "Titanic", v: [5, 2] },
  { name: "Mr. Bean", v: [1, 4] },
  { name: "Hullabaloo", v: [5, 5] },
];
const cosAB = (a: readonly number[], b: readonly number[]) => dot(a, b) / (len(a) * len(b));

export function LoudForBoth() {
  const pass = useGate();
  const [rule, setRule] = useSeed<0 | 1 | null>("rule", null);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const both = seen.length === 2;
  const score = (a: readonly number[], b: readonly number[]) => (rule === 1 ? cosAB(a, b) : dot(a, b));

  const pick = (r: 0 | 1) => {
    setRule(r);
    if (seen.includes(r)) return;
    const next = [...seen, r];
    setSeen(next);
    if (next.length === 2) pass("সবার কাছে যে জেতে, সে জেতে লম্বা হয়ে.");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border-2 border-cat-coral/40 bg-cat-coral/5 px-3 py-1 text-center text-sm">
        নতুন ছবি <b>হুলুস্থুল</b> <span className="font-mono">(5, 5)</span>: কান্নাও সবচেয়ে বেশি, হাসিও
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {["box", "cosine"].map((r, i) => (
          <button key={r} type="button" onClick={() => pick(i as 0 | 1)} className={`${pill(rule === i)} font-sans`}>
            {r}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-3 grid max-w-sm grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm">
        <span />
        {TASTES.map((t) => (
          <span key={t.who} className="text-center font-semibold">
            {WHO_BN[t.who]}
          </span>
        ))}
        {FILMS.map((f) => (
          <div key={f.name} className="contents">
            <span>
              {filmBn(f.name)} <span className="font-mono text-xs text-muted"><Tup v={f.v} of={FILM_SLOTS} /></span>
            </span>
            {TASTES.map((t) => {
              const top = rule !== null && FILMS.every((g) => score(t.v, g.v) <= score(t.v, f.v));
              // the bar glides between the two rules: the box out of 35, cosine out of 1
              const frac = rule === null ? 0 : rule === 1 ? score(t.v, f.v) : score(t.v, f.v) / 35;
              return (
                <span key={t.who} className="flex min-w-[3.2rem] flex-col items-center gap-0.5">
                  <b
                    key={`${t.who}${rule}`}
                    className={`${rule === null ? "" : POP} inline-block rounded-md px-1.5 text-center font-mono transition-colors duration-500 motion-reduce:transition-none ${top ? "bg-accent text-accent-foreground" : ""}`}
                  >
                    {rule === null ? "?" : rule === 1 ? fix(score(t.v, f.v), 2) : score(t.v, f.v)}
                  </b>
                  <span className="block h-1.5 w-full rounded-full bg-foreground/10">
                    <span
                      className={`block h-full rounded-full transition-[width,background-color] duration-700 ease-out motion-reduce:transition-none ${top ? "bg-accent" : rule === 1 ? "bg-cat-teal/60" : "bg-cat-amber/60"}`}
                      style={{ width: `${frac * 100}%` }}
                    />
                  </span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <Ticks
        items={[
          ["box দিয়ে", seen.includes(0)],
          ["cosine দিয়ে", seen.includes(1)],
        ]}
      />
      <Task done={both}>দুইটা নিয়মেই দেখুন, মামা আর মামির কাছে কোন ছবি জেতে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · 3.6's notebook, as a picture: করিম (20, 10) and ডাক্তার আপা
//     (200, 100) in taka on (চা, শরবত). Should সামিন normalise to find the
//     biggest spender? A "yes" plays the normalising: both arrows shrink to
//     the same (0.89, 0.45), and the crown has no one to go to. "No" crowns আপা.

const S7_O = { x: 22, y: 106 };
const S7_SC = 0.9; // px per taka
const S7_R = 62; // the length 1, in px
const S7_PPL = [
  { who: "করিম", v: [20, 10], dy: 7 },
  { who: "ডাক্তার আপা", v: [200, 100], dy: 0 },
];
const S7_OPTS = ["হ্যাঁ, normalise সবসময় ভালো", "না, length টাই এখানে আসল খবর", "হ্যাঁ, direction টাই আসল"];
const S7_RIGHT = 1;

function S7_Pic({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 64 34" aria-hidden="true" className="block h-auto w-16 shrink-0">
      <rect x={0.5} y={0.5} width={63} height={33} rx={5} fill="white" stroke="#cbd5e1" />
      {i === 0 && (
        <>
          <L_Arr x1={8} y1={28} x2={34} y2={15} color={L_BLUE} w={1.8} />
          <L_Arr x1={8} y1={22} x2={34} y2={9} color={L_CORAL} w={1.8} />
        </>
      )}
      {i === 1 && (
        <>
          <L_Arr x1={8} y1={28} x2={56} y2={6} color={L_CORAL} w={2} />
          <L_Arr x1={8} y1={31} x2={18} y2={26} color={L_BLUE} w={1.6} />
        </>
      )}
      {i === 2 && (
        <>
          <L_Arr x1={8} y1={28} x2={50} y2={24} color={L_BLUE} w={1.8} />
          <L_Arr x1={8} y1={28} x2={30} y2={6} color={L_CORAL} w={1.8} />
          <path d="M22 27A14 14 0 0 0 17 18" fill="none" stroke={L_AMBER} strokeWidth={1.4} />
        </>
      )}
    </svg>
  );
}

export function SpenderPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const p = usePlay(950);
  const normed = pick === 0 || pick === 2;
  const [t] = useTween([normed ? 1 : 0], 900);
  const { x: ox, y: oy } = S7_O;
  const ang = Math.atan2(1, 2);

  const choose = (i: number) => {
    setPick(i);
    if (i === S7_RIGHT) p.play(1, () => pass("Length যখন খবর, normalise না."));
    else setMiss(miss + 1);
  };

  return (
    <>
      <div className="text-center text-sm text-muted">সামিনের খাতা: কে (চা, শরবত) এ কত টাকা খরচ করলো.</div>
      <svg viewBox="0 0 240 116" role="img" aria-label="করিম (20, 10) আর ডাক্তার আপা (200, 100): দুইটা arrow একই দিকে, আপারটা 10 গুণ লম্বা" className="mx-auto mt-1 block h-auto w-full max-w-[15rem]">
        <rect x={1} y={1} width={238} height={114} rx={10} fill="white" stroke="#cbd5e1" />
        <path d={`M${ox} ${oy}H232M${ox} ${oy}V8`} stroke={L_INK} strokeOpacity={0.35} />
        <text x={232} y={oy - 4} textAnchor="end" fontSize={8} fill="#475569">
          চা
        </text>
        <text x={ox + 4} y={14} fontSize={8} fill="#475569">
          শরবত
        </text>
        {normed && t > 0.5 && <path d={`M${ox + S7_R} ${oy}A${S7_R} ${S7_R} 0 0 0 ${ox} ${oy - S7_R}`} fill="none" stroke={L_INK} strokeOpacity={0.25} strokeDasharray="3 3" className={FADE} />}
        {S7_PPL.map((c) => {
          const full = len(c.v) * S7_SC;
          const L = full + (S7_R - full) * t;
          const x2 = ox + L * Math.cos(ang);
          const y2 = oy - L * Math.sin(ang) + c.dy;
          const big = c.v[0] === 200;
          return (
            <g key={c.who}>
              <L_Arr x1={ox} y1={oy + c.dy} x2={x2} y2={y2} color={big ? L_CORAL : L_BLUE} w={big && pick === S7_RIGHT ? 3.4 : 2.4} />
              <text x={x2 > 170 ? x2 - 6 : x2 + 4} y={x2 > 170 ? y2 - 4 : y2 + (big ? 0 : 9)} textAnchor={x2 > 170 ? "end" : "start"} fontSize={8} fontWeight={700} fill={big ? "#be123c" : "#1d4ed8"}>
                {c.who}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 h-6 text-center text-sm">
        {pick === S7_RIGHT && !p.running && (
          <span className={FADE}>
            সবচেয়ে বড় ক্রেতা <b className="text-cat-coral">ডাক্তার আপা</b>: length <span className="font-mono">224</span> আর <span className="font-mono">22</span>, 10 গুণ
          </span>
        )}
        {normed && (
          <span className={FADE}>
            দুইজনই <span className="font-mono">(0.89, 0.45)</span>. বড় ক্রেতা কে? <b className="text-danger">?</b>
          </span>
        )}
      </div>
      <div className="mt-2 text-sm font-medium text-muted">সামিন খুঁজছে stall এর সবচেয়ে বড় ক্রেতা. Normalise করা কি ঠিক?</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {S7_OPTS.map((o, i) => (
          <PicChoice key={o} look={pick === i ? (i === S7_RIGHT ? "right" : "wrong") : "idle"} disabled={pick === S7_RIGHT} onClick={() => choose(i)}>
            <S7_Pic i={i} />
            <span>{o}</span>
          </PicChoice>
        ))}
      </div>
      {pick === 0 && <Nope key={miss}>Normalise করতেই দুইজন হুবহু এক. কে 10 গুণ বেশি খরচ করেন, সেই খবরটাই মুছে গেলো.</Nope>}
      {pick === 2 && <Nope key={miss}>দুইজন তো একই direction এ. Direction দিয়ে বড় ক্রেতা বের হয় না. আর normalise করলে টাকাটাই হারায়.</Nope>}
      <Task done={pick === S7_RIGHT && !p.running}>ছবি দেখে বেছে নিন: বড় ক্রেতা খুঁজতে normalise করবেন কি না.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 and 9 sort jobs into measures, one card at a time: a right tap flies the
// card into its bin and the bin's count pops; a wrong tap drops the card into
// the wrong bin, which spits it back out (the card slides back up from that
// bin, the bin shakes), and says what that measure would do to this job.
// Wrong tries bounce.

type Job = { t: string; bin: number; why: string };

/** Fly-away classes for a card going into bin i of n (literal strings for Tailwind). */
const FLY: Record<number, string[]> = {
  2: ["-translate-x-1/4", "translate-x-1/4"],
  3: ["-translate-x-1/3", "translate-x-0", "translate-x-1/3"],
};
/** Bounce-back classes: a wrong card starts down in bin i of n and slides back up (literal strings for Tailwind). */
const SPIT: Record<number, string[]> = {
  2: ["starting:-translate-x-1/4", "starting:translate-x-1/4"],
  3: ["starting:-translate-x-1/3", "starting:translate-x-0", "starting:translate-x-1/3"],
};

function SortJobs({ jobs, bins, note, doneText, nope, task }: { jobs: Job[]; bins: { name: string; sub?: string }[]; note: string; doneText: string; nope: string; task: string }) {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const [bin, setBin] = useSeed<number | null>("bin", null); // the wrong bin last tapped
  const all = done === jobs.length;
  const job = jobs[done];
  const last = done > 0 ? jobs[done - 1] : null;

  const drop = (b: number) => {
    if (all) return;
    if (b !== job.bin) {
      setBin(b);
      return setMiss((miss ?? 0) + 1);
    }
    setBin(null);
    setMiss(null);
    setDone(done + 1);
    if (done + 1 === jobs.length) pass(note);
  };

  return (
    <>
      <div className="relative mt-4 min-h-24">
        {last && (
          <div
            key={`fly${done}`}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 mx-auto max-w-sm rounded-2xl border-2 border-accent/50 bg-surface px-4 py-3 text-center text-[0.95rem] transition duration-700 ease-in motion-reduce:hidden ${FLY[bins.length][last.bin]} translate-y-24 scale-50 opacity-0 starting:translate-x-0 starting:translate-y-0 starting:scale-100 starting:opacity-100`}
          >
            {last.t}
          </div>
        )}
        {!all ? (
          <div
            key={`${done}.${miss ?? 0}`}
            className={`${
              miss !== null && bin !== null
                ? `transition duration-700 ease-out motion-reduce:transition-none ${SPIT[bins.length][bin]} starting:translate-y-24 starting:scale-50 starting:opacity-30 border-danger/50`
                : `${POP} border-cat-violet/40`
            } mx-auto max-w-sm rounded-2xl border-2 bg-surface px-4 py-3 text-center text-[0.95rem]`}
          >
            {job.t}
          </div>
        ) : (
          <div className={`${FADE} text-center text-[0.95rem] text-accent-text`}>{doneText}</div>
        )}
      </div>
      <div className={`mt-3 grid gap-2 ${bins.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {bins.map((b, i) => {
          const n = jobs.slice(0, done).filter((j) => j.bin === i).length;
          return (
            <button
              key={bin === i && miss !== null ? `${b.name}${miss}` : b.name}
              type="button"
              disabled={all}
              onClick={() => drop(i)}
              className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border-2 px-1 py-3 text-center transition-colors hover:border-cat-blue/60 motion-reduce:transition-none disabled:cursor-default ${
                bin === i && miss !== null && !all ? "nudge border-danger/50 bg-danger/5" : "border-border"
              }`}
            >
              <span className="text-sm font-semibold">{b.name}</span>
              {b.sub && <span className="text-xs text-muted">{b.sub}</span>}
              <b key={n} className={`${n > 0 ? POP : ""} inline-block font-mono text-sm`}>
                {n}
              </b>
            </button>
          );
        })}
      </div>
      {miss !== null && !all && (
        <Nope key={miss}>
          {job.why} {nope}
        </Nope>
      )}
      <Task done={all}>
        {task} ({done}/{jobs.length})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Is length news? Six jobs into the box (length matters) or cosine
//     (only direction).

const LENGTH_JOBS: Job[] = [
  { t: "দালালের card দিয়ে একটা গরুর দাম", bin: 0, why: "Cosine দিলে বড় গরু আর ছোট গরুর দাম প্রায় এক হয়ে যাবে. গরুর ওজনটাই তো দাম." },
  { t: "মাছের বই খোঁজা, বই ছোট হোক বা মোটা", bin: 1, why: "Box দিলে মোটা বই শুধু মোটা বলেই উপরে উঠবে, নৌকা-ধানের বইয়ের মতো." },
  { t: "ভ্যান কাদা থেকে উঠবে কি না: রাস্তা বরাবর মোট ধাক্কা", bin: 0, why: "Cosine শুধু বলবে ধাক্কা কোন দিকে. কত জোরে, সেটা হারিয়ে যাবে." },
  { t: "দুইটা word মানের দিক থেকে কত কাছাকাছি", bin: 1, why: "Box দিলে লম্বা arrow এর word টা সবার সাথেই বড় number পাবে, হুলুস্থুলের মতো." },
  { t: "“এরকম আরো ছবি দেখাও”, শুধু ছবির ধরন দেখে", bin: 1, why: "Box দিলে হুলুস্থুলের মতো লম্বা ছবিই সবাই পাবে, ধরন যাই হোক." },
  { t: "যে ছবি সবাই দেখে, সেটা সবাইকে একটু বেশি দেখানো", bin: 0, why: "Cosine length ফেলে দেয়. অথচ এখানে জনপ্রিয় ছবির লম্বা arrow টাই কাজের." },
];
const LENGTH_BINS = [
  { name: "box", sub: "length ও খবর" },
  { name: "cosine", sub: "শুধু direction, length হলো noise" },
];

export function LengthIsNews() {
  return (
    <SortJobs
      jobs={LENGTH_JOBS}
      bins={LENGTH_BINS}
      note="আসল প্রশ্ন: length কি এখানে খবর?"
      doneText="ছয়টা কাজই জায়গামতো বসলো."
      nope="“বেশি” বা “বড়” হওয়াটা কি এখানে উত্তরের অংশ, নাকি শুধু noise?"
      task="প্রতিটা কাজে কোন মাপ লাগবে, tap করুন."
    />
  );
}

// ---------------------------------------------------------------------------
// 9 · এবার আপনার পালা: আপুর list. Five fresh jobs into box / cosine /
//     distance.

const TOOL_JOBS: Job[] = [
  { t: "Chatbot কে প্রশ্ন করলেন: কোন paragraph এর মানে প্রশ্নের সবচেয়ে কাছে", bin: 1, why: "Box দিলে লম্বা paragraph শুধু লম্বা বলেই জিতে যাবে." },
  { t: "দালালের knob দিয়ে একটা ছাগলের দাম", bin: 0, why: "দামটা একটা পরিমাণ. Knob গুলা গুণ করে যোগ, মানে box." },
  { t: "ডাক্তার আপার twin খেলা: standardise করার পর কে কার সবচেয়ে কাছে দাঁড়িয়ে", bin: 2, why: "প্রশ্নটা জায়গা নিয়ে, কে কোথায় দাঁড়িয়ে." },
  { t: "ছোট বড় হাজারটা খবরের মধ্যে “বন্যা” র খবর খোঁজা", bin: 1, why: "Box দিলে লম্বা খবর উপরে উঠবে, বন্যা নিয়ে না হলেও." },
  { t: "ফাহিমের final number: marks আর weight মিলিয়ে", bin: 0, why: "Marks বেশি হলে number ও বেশি হবে, এটাই তো চাওয়া." },
];
const TOOL_BINS = [{ name: "box" }, { name: "cosine" }, { name: "distance" }];

export function PickTool() {
  return (
    <SortJobs
      jobs={TOOL_JOBS}
      bins={TOOL_BINS}
      note="Length: box. Direction: cosine. জায়গা: distance."
      doneText="পাঁচটা কাজই ঠিক মাপে বসলো."
      nope="Length টাই কি খবর, নাকি শুধু direction, নাকি জায়গা?"
      task="প্রতিটা কাজের জন্য ঠিক মাপটা বেছে নিন."
    />
  );
}

// ---------------------------------------------------------------------------
// 10 · Try it: the newspaper cupboard's search, a new case. Someone searches
//      "ইলিশ" among a two-line item (3, 0, 0), a ten-page market report
//      (10, 60, 8) and a half page on the fishing ban (6, 1, 0), slots
//      (ইলিশ, দাম, রাজনীতি). Pick a measure and the clippings re-sort: the box
//      and length both put the market report on top (it's not about ইলিশ);
//      cosine puts the two ইলিশ items first.

const N10_NEWS = [
  { id: "P", title: "দুই লাইন: পদ্মায় ইলিশ", v: [3, 0, 0] },
  { id: "Q", title: "দশ পাতা: বাজারে জিনিসের দাম", v: [10, 60, 8] },
  { id: "R", title: "আধা পাতা: ইলিশ ধরা বন্ধ কেন", v: [6, 1, 0] },
];
const N10_WAYS = [
  { name: "box", sub: "লম্বা খবরে বেশি থাকে", score: (v: readonly number[]) => v[0], d: 0 },
  { name: "cosine", sub: "শুধু direction", score: (v: readonly number[]) => v[0] / len(v), d: 3 },
  { name: "length", sub: "লম্বাটা আগে", score: (v: readonly number[]) => len(v), d: 1 },
];
const N10_RIGHT = 1;
const N10_H = 50; // px per row
const N10_MAX = len(N10_NEWS[1].v);

export function NewsSearch() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const p = usePlay(900);
  const way = pick === null ? null : N10_WAYS[pick];
  const order = way ? [...N10_NEWS].sort((a, b) => way.score(b.v) - way.score(a.v)).map((n) => n.id) : N10_NEWS.map((n) => n.id);

  const choose = (i: number) => {
    setPick(i);
    if (i === N10_RIGHT) p.play(1, () => pass("লম্বা হয়ে কেউ জিতবে না: cosine."));
    else setMiss(miss + 1);
  };

  return (
    <>
      <div className="mx-auto w-fit rounded-full border-2 border-border px-4 py-1 text-sm">
        পত্রিকার search: <b>ইলিশ</b> <span className="text-xs text-muted">(ইলিশ, দাম, রাজনীতি)</span>
      </div>
      <div className="relative mx-auto mt-2 w-full max-w-sm" style={{ height: N10_H * 3 }}>
        {N10_NEWS.map((n) => {
          const rank = order.indexOf(n.id);
          const top = way !== null && rank === 0;
          const good = n.id !== "Q";
          const L = len(n.v);
          return (
            <div
              key={n.id}
              className="absolute inset-x-0 top-0 px-0.5 transition-transform duration-700 ease-in-out motion-reduce:transition-none"
              style={{ transform: `translateY(${rank * N10_H}px)` }}
            >
              <div className={`flex h-[2.85rem] items-center gap-2 rounded-xl border-2 bg-surface px-2.5 transition-colors motion-reduce:transition-none ${top ? (good ? "border-accent" : "border-danger/60") : "border-border"}`}>
                <b className="w-4 shrink-0 font-mono text-sm text-muted">{way ? rank + 1 : ""}</b>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{n.title}</span>
                  <span className="mt-0.5 flex h-2 overflow-hidden rounded-full bg-foreground/10" style={{ width: `${14 + 86 * (L / N10_MAX)}%` }}>
                    <span className="block h-full bg-cat-blue" style={{ width: `${(100 * n.v[0]) / (n.v[0] + n.v[1] + n.v[2])}%` }} />
                    <span className="block h-full flex-1 bg-foreground/25" />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-[0.7rem] text-muted"><Tup v={n.v} of={NEWS_SLOTS} /></span>
                  {way && (
                    <b key={`${pick}`} className={`${POP} inline-block font-mono text-sm`}>
                      {fix(way.score(n.v), way.d)}
                    </b>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 text-center text-xs text-muted">বারটা যত লম্বা, খবর তত লম্বা. নীল অংশটা ইলিশ.</div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {N10_WAYS.map((w, i) => (
          <button
            key={w.name}
            type="button"
            disabled={pick === N10_RIGHT}
            onClick={() => choose(i)}
            className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border-2 px-1 py-2.5 text-center transition-colors motion-reduce:transition-none disabled:cursor-default ${
              pick === i ? (i === N10_RIGHT ? "border-accent bg-accent/10" : "nudge border-danger/50 bg-danger/5") : "border-border hover:border-cat-blue/60"
            }`}
          >
            <span className="text-sm font-semibold">{w.name}</span>
            <span className="text-xs text-muted">{w.sub}</span>
          </button>
        ))}
      </div>
      {pick === 0 && <Nope key={miss}>Box এ এক নম্বরে উঠে গেলো দশ পাতার বাজারের খবর. ইলিশ আছে 10 বার. কিন্তু খবরটা দাম নিয়ে. জিতলো লম্বা বলেই.</Nope>}
      {pick === 2 && <Nope key={miss}>লম্বা খবর আগে দিয়ে কী লাভ? Search টা লম্বা খবর চায় নাই, ইলিশের খবর চেয়েছে.</Nope>}
      <Task done={pick === N10_RIGHT && !p.running}>“ইলিশ” এর খবরগুলা কী দিয়ে সাজাবেন? একটা মাপ বেছে নিয়ে দেখুন.</Task>
    </>
  );
}

// ===========================================================================
// Watch-only animations: 4.7's story scenes and figures (numbered by 4.7's
// steps, see the header). Each waits on its first frame for the reader (kit's useScene); every beat is
// drawn from `k` alone.

const L_INK = "#0f1b2d";
/** the stage's ground */
const LG = 150;
const L_BLUE = "#2563eb";
const L_CORAL = "#e11d48";
const L_AMBER = "#d97706";
const L_TEAL = "#0d9488";
const L_VIOLET = "#7c3aed";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** A caption that fades in afresh on every beat. */
const lsay = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** Something that glides to (x, y) over `ms`, the way a Person does: draw it around (0, 0). */
function L_Carry({ x, y, ms = 1200, children }: { x: number; y: number; ms?: number; children: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {children}
    </g>
  );
}


/** An arrow on a white sheet, pixel coordinates. */
function L_Arr({ x1, y1, x2, y2, color, w = 2.4, dashed = false, op = 1 }: { x1: number; y1: number; x2: number; y2: number; color: string; w?: number; dashed?: boolean; op?: number }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const h = Math.min(6 + w, len * 0.5);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const s = h * 0.5;
  return (
    <g opacity={op}>
      <path d={`M${x1} ${y1}L${bx} ${by}`} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? "4 3" : undefined} />
      <path d={`M${x2} ${y2}L${bx - uy * s} ${by + ux * s}L${bx + uy * s} ${by - ux * s}Z`} fill={color} />
    </g>
  );
}

/** A bookshelf, bottom-left at (x, y), `rows` shelves of books. */
function L_Shelf({ x, y, w = 90, rows = 3 }: { x: number; y: number; w?: number; rows?: number }) {
  const colors = ["#b91c1c", "#1d4ed8", "#15803d", "#a16207", "#7c3aed", "#0f766e", "#be185d"];
  const widths = [6, 8, 5, 7, 6, 9, 5, 7];
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y - rows * 26 - 4} width={w} height={rows * 26 + 4} fill="#7c4a1e" />
      {Array.from({ length: rows }, (_, r) => {
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

/** A desk with the library computer, desk's left edge at x, feet at y. Two windows, A and B. */
function L_Desk({ x, y, query = false, lit }: { x: number; y: number; query?: boolean; lit?: 0 | 1 }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y - 28} width={80} height={4} fill="#92400e" />
      <rect x={x + 4} y={y - 24} width={3} height={24} fill="#78350f" />
      <rect x={x + 73} y={y - 24} width={3} height={24} fill="#78350f" />
      <rect x={x + 36} y={y - 32} width={8} height={4} fill="#475569" />
      <rect x={x + 6} y={y - 68} width={68} height={37} rx={3} fill="#1e293b" />
      {(["A", "B"] as const).map((m, i) => (
        <g key={m}>
          <rect x={x + 10 + i * 31} y={y - 64} width={29} height={29} rx={2} fill="white" stroke={lit === i ? "#16a34a" : "none"} strokeWidth={2} />
          <text x={x + 24.5 + i * 31} y={y - 56} textAnchor="middle" fontSize={7} fontWeight={700} fill={L_INK}>
            {m}
          </text>
          {query && (
            <g className={FADE}>
              <rect x={x + 13 + i * 31} y={y - 52} width={23} height={9} rx={1.5} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={0.6} />
              <text x={x + 24.5 + i * 31} y={y - 45.5} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={L_INK}>
                মাছ
              </text>
              <text x={x + 24.5 + i * 31} y={y - 37} textAnchor="middle" fontSize={7} fontWeight={800} fill={L_CORAL}>
                ?
              </text>
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

/** A small note, centred at (x, y): lines of text, sans. */
function L_Note({ x, y, lines, tone = L_INK, fs = 7.5 }: { x: number; y: number; lines: string[]; tone?: string; fs?: number }) {
  const w = Math.max(...lines.map((l) => l.length)) * fs * 0.55 + 12;
  const h = lines.length * (fs + 4) + 6;
  return (
    <g className={POP}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3} fill="white" stroke={tone} strokeWidth={1.2} />
      {lines.map((l, i) => (
        <text key={i} x={x} y={y - h / 2 + 3 + (i + 1) * (fs + 4) - 3} textAnchor="middle" fontSize={fs} fontWeight={700} fill={tone} fontFamily={/[ঀ-৿]/.test(l) ? undefined : "ui-monospace, monospace"}>
          {l}
        </text>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for step 1's explanation, no task: 4.6's ghat. The boat is
//      3 m from the bank, the pull is 10. The rope grows from 4 m, steep,
//      sending 6.6 forward, to 15 m, flat, sending 9.8: the shadow (4.6's
//      green) grows as the angle shrinks.

const X1_SAY = [
  "4.6 এর ঘাট. নৌকা পাড় থেকে 3 metre দূরে, টান 10.",
  "4 metre দড়ি: angle বড়, নদী বরাবর যায় 6.6.",
  "15 metre দড়ি: angle ছোট, নদী বরাবর যায় 9.8.",
  "লম্বা দড়ি, ছোট angle. Shadow প্রায় পুরা টানটাই.",
];
const X1_M = 16.5; // px per metre
const X1_BANK = 92;
const X1_BOAT = 26;

export function RopeRecall() {
  const s = useScene(3, [600, 2400, 2400]);
  const k = s.k;
  const [L] = useTween([k >= 2 ? 15 : 4], 1300);
  const along = Math.sqrt(Math.max(0, L * L - 9));
  const cos = along / L;
  const boatY = X1_BANK - 3 * X1_M;
  const px = X1_BOAT + along * X1_M;
  const P = 6; // px per unit of pull
  const tipX = X1_BOAT + 10 * P * cos;
  const tipY = boatY + 10 * P * (3 / L);
  return (
    <Scene scene={s} caption={lsay(X1_SAY, k)}>
      <svg viewBox="0 0 290 112" role="img" aria-label="নৌকা পাড় থেকে 3 metre দূরে; 4 metre দড়িতে সামনে 6.6, 15 metre এ 9.8" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={288} height={110} rx={10} fill="#e0f2fe" stroke="#cbd5e1" />
        <rect x={1} y={X1_BANK} width={288} height={19} fill="#a3b18a" />
        <text x={282} y={X1_BANK + 13} textAnchor="end" fontSize={8} fill={L_INK}>
          পাড়
        </text>
        <text x={258} y={15} textAnchor="end" fontSize={8} fill="#0369a1">
          সামনে, নদী বরাবর
        </text>
        <L_Arr x1={262} y1={12} x2={282} y2={12} color="#0369a1" w={1.4} />
        <path d={`M${X1_BOAT - 16} ${boatY - 2}h32l-5 8h-22Z`} fill="#92400e" />
        <path d={`M${X1_BOAT - 8} ${boatY + 12}V${X1_BANK - 2}`} stroke={L_INK} strokeOpacity={0.4} strokeDasharray="2 2" />
        <text x={X1_BOAT - 5} y={(boatY + X1_BANK) / 2 + 6} fontSize={7.5} fontFamily="ui-monospace, monospace" fill={L_INK}>
          3 m
        </text>
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M${X1_BOAT} ${boatY}L${px} ${X1_BANK}`} stroke="#78350f" strokeWidth={1.4} />
            <circle cx={px} cy={X1_BANK - 7} r={4} fill={L_BLUE} />
            <text x={Math.min(px, 250)} y={X1_BANK + 13} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={L_INK}>
              {`${Math.round(L)} m`}
            </text>
            <L_Arr x1={X1_BOAT} y1={boatY} x2={tipX} y2={tipY} color={L_CORAL} w={2.2} />
            <path d={`M${tipX} ${tipY}V${boatY - 12}`} stroke={L_INK} strokeOpacity={0.35} strokeDasharray="2 2" />
            <path d={`M${X1_BOAT} ${boatY - 12}H${tipX}`} stroke={L_TEAL} strokeWidth={4} strokeLinecap="round" opacity={0.85} />
            <text x={tipX + 5} y={boatY - 9} fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#0f766e">
              {fix(10 * cos, 1)}
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for step 2's setup, no task: the library in the
//      evening. লাইব্রেরির আপু (Rina's look, as in 4.6's LibraryTwo, with her
//      own name drawn) beside the new computer's two machines; a book comes off
//      the shelf and becomes its list (মাছ, নৌকা, ধান); ফাহিম walks up and
//      searches "মাছ" in both. No result.

/** লাইব্রেরির আপু: Rina's look, her own name under her feet. */
function L_Apu({ x, mood = "plain", arm = "down" }: { x: number; mood?: "plain" | "happy" | "puzzled" | "smug"; arm?: "down" | "point" | "hold" | "wave" }) {
  return (
    <>
      <Person who="rina" x={x} y={LG} facing={-1} scale={0.9} mood={mood} arm={arm} />
      <text x={Math.min(x, 284)} y={LG + 11} textAnchor="middle" fontSize={8} fontWeight={700} fill={L_INK}>
        লাইব্রেরির আপু
      </text>
    </>
  );
}

export function LibraryEvening({}: Story) {
  const s = useScene(4, [600, 2400, 2200, 1500]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সন্ধ্যায় লাইব্রেরি; আপু নতুন computer এর দুইটা machine দেখান, একটা বই হয়ে যায় (মাছ, নৌকা, ধান) list, ফাহিম দুইটাতেই মাছ লিখে search দেয়">
        <L_Shelf x={12} y={LG} w={96} />
        <L_Desk x={182} y={LG} query={k >= 4} />
        <L_Apu x={282} arm={k === 1 ? "point" : "down"} mood={k === 1 ? "happy" : "plain"} />
        {k === 1 && <Bubble x={282} y={LG - 60} side="left" lines={["দুইটা search machine.", "আমার ভাই বানাইছে."]} />}
        {k >= 2 && (
          <>
            <rect x={52} y={40} width={9} height={20} fill="#1d4ed8" className={POP} />
            <L_Note x={60} y={24} lines={["(মাছ, নৌকা, ধান)", "(3, 5, 4)"]} tone={L_AMBER} fs={8} />
          </>
        )}
        <Person who="fahim" x={k >= 3 ? 160 : -30} y={LG} walking={k === 3} ms={1400} arm={k >= 4 ? "point" : "down"} label={k >= 3} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for step 2's explanation, no task: both machines are handed
//      the same three lists; out come two orders, and the odd one out is the
//      third book, নৌকা-ধান, second for A and last for B. It stops at "কেন?".

const X2_SAY = [
  "তিনটা বই, প্রতিটার একই count.",
  "দুইটা machine কেই দেয়া হলো হুবহু একই তিনটা list.",
  "তবু বের হলো দুইরকম order.",
  "ঝগড়া তিন নম্বর বইটা নিয়ে: A তে দুই নম্বরে, B তে তিন নম্বরে.",
  "মাছ খুঁজতে গিয়ে নৌকা-ধানের বই দুই নম্বরে কেন?",
];
const X2_SHORT: Record<string, string> = { A: BOOK_BN.A.short, B: BOOK_BN.B.short, C: BOOK_BN.C.short };

export function SameCounts() {
  const s = useScene(4, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={lsay(X2_SAY, k)}>
      <div className="mx-auto w-full max-w-xs">
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {BOOKS.map((b) => (
            <div key={b.id} className={`rounded-lg border px-1 py-1 ${b.id === "C" && k >= 3 ? "border-cat-coral/60 bg-cat-coral/10" : "border-border bg-surface"}`}>
              <div className="text-xs leading-tight font-semibold">{X2_SHORT[b.id]}</div>
              <div className="font-mono text-[0.7rem] text-muted"><Tup v={b.v} of={BOOK_SLOTS} /></div>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {MACHINES.map((m, mi) => (
            <div key={m.name} className="rounded-xl border-2 border-border bg-surface px-2 py-1.5">
              <div className="text-center text-xs font-semibold">{m.name}</div>
              {k >= 1 && (
                <ol key={k >= 2 ? "out" : "in"} className={`${FADE} mt-0.5 grid gap-0.5 text-[0.78rem] leading-snug`}>
                  {(k >= 2 ? m.order : BOOKS).map((b, i) => (
                    <li key={b.id} className={`flex items-center justify-between gap-1 rounded-md px-1 ${b.id === "C" && k >= 3 ? "bg-cat-coral/15 font-semibold" : ""}`}>
                      {k >= 2 ? (
                        <span>
                          {i + 1}. {X2_SHORT[b.id]}
                        </span>
                      ) : (
                        <span className="font-mono text-[0.72rem]"><Tup v={b.v} of={BOOK_SLOTS} /></span>
                      )}
                      {k >= 4 && mi === 0 && b.id === "C" && <b className={`${POP} inline-block text-cat-coral`}>?</b>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for step 3's explanation, no task: the box opened on
//      (1, 0, 0) and (4, 2, 7), row by row. The 1 keeps the first slot, the 0s
//      wipe the rest: 4. Last, the slip: adding the book's slots gives 13.

const X3_SAY = [
  "দুইটা list: (1, 0, 0) আর (4, 2, 7).",
  "First slot: 1 × 4 = 4.",
  "Second slot এ 0, তাই গুণফল 0.",
  "Third slot এও তাই.",
  "যোগ: 4. টিকে থাকে শুধু 1 এর slot টা.",
  "গুণ না করে বইয়ের slot গুলা যোগ করলে আসে 13.",
];

export function OneHotBox() {
  const s = useScene(5, [600, 1400, 1400, 1400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={lsay(X3_SAY, k)}>
      <DotBox a={[1, 0, 0]} b={[4, 2, 7]} k={Math.min(k, 4)} />
      {k >= 5 && (
        <div className={`${FADE} mx-auto mt-1.5 w-fit font-mono text-sm text-danger`}>
          <span className="line-through">4 + 2 + 7 = 13</span>
        </div>
      )}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for step 4's first paragraph, no task: the words as tiles.
//      The letter is 2 words, both মাছ; the boats-and-paddy book is 12 words,
//      3 of them মাছ. The box counts only মাছ tiles, 2 against 3, so the book
//      wins, though the letter is all fish and the book a quarter.

const X4_KINDS = [
  { name: "মাছ", cls: "bg-cat-blue" },
  { name: "নৌকা", cls: "bg-cat-teal" },
  { name: "ধান", cls: "bg-cat-amber" },
];
const X4_ROWS = [
  { name: "চিঠি", v: BOOKS[0].v, share: "পুরাটাই মাছ" },
  { name: "নৌকা-ধান", v: BOOKS[2].v, share: "12 টার মাত্র 3 টা মাছ" },
];
const X4_SAY = [
  "প্রতিটা word একটা টুকরা: নীল মাছ, সবুজ নৌকা, হলুদ ধান.",
  "Box দেখে শুধু মাছের ঘর.",
  "মাছের টুকরা গুনে চিঠি 2, বই 3. বই আগে.",
  "অথচ চিঠি পুরাটাই মাছ, আর বইয়ে মাছ প্রায় নাই বললেই চলে.",
];

export function WordTiles() {
  const s = useScene(3, [600, 1600, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={lsay(X4_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs gap-2">
        {X4_ROWS.map((r) => (
          <div key={r.name}>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-sm font-semibold">{r.name}</span>
              <span className="flex flex-wrap gap-0.5">
                {r.v.flatMap((n, kind) =>
                  Array.from({ length: n }, (_, i) => (
                    <span
                      key={`${kind}${i}`}
                      className={`inline-block size-3.5 rounded-sm ${X4_KINDS[kind].cls} transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 && kind !== 0 ? "opacity-15" : ""}`}
                    />
                  )),
                )}
              </span>
              {k >= 2 && (
                <b key="n" className={`${POP} ml-auto inline-block font-mono ${r.v[0] === 3 ? "text-cat-coral" : ""}`}>
                  {r.v[0]}
                </b>
              )}
            </div>
            {k >= 3 && <div className={`${FADE} pl-[4.5rem] text-xs text-muted`}>{r.share}</div>}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for step 4's second paragraph, no task: 4.2's van, with the
//      road laid flat. ফাহিম pushes along it (5); the কুলি pushes 53° off
//      with 10, and his shadow on the road is 6. Then the same picture with
//      the মাছ axis: the letter (2) against the long, bent boats-and-paddy
//      book, whose shadow is 3.

const X4B_O = { x: 26, y: 104 };
const X4B_SAY = [
  "4.2 এর ভ্যান. ফাহিম রাস্তা বরাবর ঠেলে, জোর 5. কুলি ঠেলে বাঁকা হয়ে, জোর 10.",
  "রাস্তা বরাবর shadow: ফাহিম 5, কুলি 6. বাঁকা হয়েও কুলি জিতলো.",
  "বই দুইটাও তাই. মাছের দিক বরাবর shadow: চিঠি 2, নৌকা-ধান 3.",
  "নৌকা-ধানের বই মাছ থেকে অনেক বাঁকা, কিন্তু লম্বা, 7.07. লম্বা বলেই জিতলো.",
];

export function SlantWins() {
  const s = useScene(3, [600, 2400, 2600]);
  const k = s.k;
  const books = k >= 2;
  const [ax, bx, by] = useTween(books ? [28, 42, 90] : [50, 60, 80], 1200);
  const names = books ? ["চিঠি", "নৌকা-ধান"] : ["ফাহিম", "কুলি"];
  const vals = books ? ["2", "3"] : ["5", "6"];
  const { x: ox, y: oy } = X4B_O;
  return (
    <Scene scene={s} caption={lsay(X4B_SAY, k)}>
      <div className="mx-auto flex w-full max-w-xs items-center gap-3">
        <svg viewBox="0 0 150 124" role="img" aria-label="সোজা ছোট arrow আর বাঁকা লম্বা arrow; বাঁকাটার shadow বেশি" className="block h-auto w-full max-w-[10rem] shrink-0">
          <rect x={1} y={1} width={148} height={122} rx={8} fill="white" stroke="#cbd5e1" />
          <path d={`M${ox - 12} ${oy}H144`} stroke={L_INK} strokeOpacity={0.5} />
          <text x={144} y={oy - 4} textAnchor="end" fontSize={8} fill="#475569">
            {books ? "মাছ" : "রাস্তা"}
          </text>
          {k >= 1 && <path d={`M${ox + bx} ${oy - by}V${oy}`} stroke={L_INK} strokeOpacity={0.35} strokeDasharray="2 2" className={FADE} />}
          {k >= 1 && <path d={`M${ox} ${oy + 4}H${ox + bx}`} stroke={L_AMBER} strokeWidth={4} strokeLinecap="round" className={FADE} />}
          <L_Arr x1={ox} y1={oy} x2={ox + bx} y2={oy - by} color={L_CORAL} />
          <L_Arr x1={ox} y1={oy - 1} x2={ox + ax} y2={oy - 1} color={L_BLUE} w={3} />
          <text x={ox + bx + 4} y={oy - by + 4} fontSize={8} fontWeight={700} fill="#be123c">
            {names[1]}
          </text>
          <text x={ox + ax / 2} y={oy + 17} textAnchor="middle" fontSize={8} fontWeight={700} fill="#1d4ed8">
            {names[0]}
          </text>
        </svg>
        <div className="grid gap-1 text-sm">
          <div className="text-xs text-muted">{books ? "মাছের দিকে shadow" : "রাস্তা বরাবর shadow"}</div>
          {names.map((n, i) => (
            <div key={n} className="flex items-baseline justify-between gap-2">
              <span className={i === 0 ? "text-cat-blue" : "text-cat-coral"}>{n}</span>
              <b key={k >= 1 ? vals[i] : "?"} className={`${POP} inline-block font-mono`}>
                {k >= 1 ? vals[i] : "?"}
              </b>
            </div>
          ))}
          {k >= 3 && (
            <div className={`${FADE} text-xs text-muted`}>
              length <span className="font-mono">2</span> আর <span className="font-mono">7.07</span>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for step 5's first paragraph, no task: the three books as
//      arrows off the মাছ axis, drawn to scale (the fat book runs long), with
//      their angles 0°, 3° and 65°. Then every one shrunk to the same length:
//      what's left is direction, and the two fish books sit on the axis.

const X5_O = { x: 22, y: 114 };
const X5_SC = 9;
const X5_R = 82;
const X5_ARROWS = BOOKS.map((b) => {
  const side = Math.hypot(b.v[1], b.v[2]);
  const L = len(b.v);
  return { id: b.id, x: b.v[0], y: side, L, deg: (Math.atan2(side, b.v[0]) * 180) / Math.PI };
});
const X5_TONE: Record<string, string> = { A: L_BLUE, B: L_TEAL, C: L_CORAL };
const X5_SAY = [
  "Query “মাছ” তাক করা মাছের দিক বরাবর.",
  "চিঠি: ছোট, কিন্তু একদম মাছের দিকে.",
  "মোটা বই: অনেক লম্বা, প্রায় একই দিকে, মাত্র 3° সরে.",
  "নৌকা-ধানের বই: প্রায় 65° দূরে.",
  "Length দিয়ে ভাগ দিলে সবাই সমান লম্বা. থাকে শুধু direction.",
];

export function UnitFan() {
  const s = useScene(4, [600, 1500, 1800, 1800]);
  const k = s.k;
  const [p] = useTween([k >= 4 ? 1 : 0], 1300);
  const { x: ox, y: oy } = X5_O;
  const tip = (a: (typeof X5_ARROWS)[number]) => {
    const tx = a.x * X5_SC;
    const ty = a.y * X5_SC;
    const r = (a.deg * Math.PI) / 180;
    return [ox + tx + (X5_R * Math.cos(r) - tx) * p, oy - (ty + (X5_R * Math.sin(r) - ty) * p)];
  };
  const shown = X5_ARROWS.filter((_, i) => k >= i + 1);
  const cArr = X5_ARROWS[2];
  const [cx, cy] = tip(cArr);
  return (
    <Scene scene={s} caption={lsay(X5_SAY, k)}>
      <svg viewBox="0 0 230 124" role="img" aria-label="তিনটা বই arrow হিসাবে: চিঠি আর মোটা বই মাছের দিকে, নৌকা-ধান 65° দূরে; length দিয়ে ভাগ দিলে সবাই সমান লম্বা" className="mx-auto block h-auto w-full max-w-[17rem]">
        <rect x={1} y={1} width={228} height={122} rx={10} fill="white" stroke="#cbd5e1" />
        <path d={`M${ox} ${oy}H222M${ox} ${oy}V10`} stroke={L_INK} strokeOpacity={0.35} />
        <text x={222} y={oy - 4} textAnchor="end" fontSize={8} fill="#475569">
          মাছ
        </text>
        <text x={ox + 4} y={16} fontSize={8} fill="#475569">
          নৌকা, ধান
        </text>
        {k >= 4 && <path d={`M${ox + X5_R} ${oy}A${X5_R} ${X5_R} 0 0 0 ${ox} ${oy - X5_R}`} fill="none" stroke={L_INK} strokeOpacity={0.25} strokeDasharray="3 3" className={FADE} />}
        {shown.map((a) => {
          const [x2, y2] = tip(a);
          return <L_Arr key={a.id} x1={ox} y1={oy} x2={x2} y2={y2} color={X5_TONE[a.id]} w={a.id === "A" ? 3.2 : 2.2} />;
        })}
        {k >= 3 && (
          <g className={FADE}>
            <path d={`M${ox + 26} ${oy}A26 26 0 0 0 ${ox + 26 * Math.cos((cArr.deg * Math.PI) / 180)} ${oy - 26 * Math.sin((cArr.deg * Math.PI) / 180)}`} fill="none" stroke={L_CORAL} strokeWidth={1.2} />
            <text x={ox + 30} y={oy - 16} fontSize={8} fontFamily="ui-monospace, monospace" fill="#be123c">
              65°
            </text>
            <text x={cx + 4} y={cy} fontSize={8} fontWeight={700} fill="#be123c">
              নৌকা-ধান
            </text>
          </g>
        )}
        {k >= 1 && (
          <text x={k >= 4 ? ox + X5_R + 4 : ox + 22} y={oy + 9} fontSize={7.5} fontWeight={700} fill="#1d4ed8">
            {k >= 4 ? "চিঠি, মোটা বই" : "চিঠি"}
          </text>
        )}
        {k >= 2 && k < 4 && (
          <text x={206} y={oy - 14} textAnchor="end" fontSize={7.5} fontWeight={700} fill="#0f766e">
            মোটা বই
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for step 6's setup, no task: home, at night. ফাহিম
//      walks in; the TV shows the new film হুলুস্থুল; মামি is taken by the
//      crying, মামা by the laughing, and its card (5, 5) comes up. Who it wins
//      for is not said.

function L_TV({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g className="pointer-events-none">
      <rect x={x + 30} y={y - 30} width={30} height={30} fill="#78350f" />
      <rect x={x} y={y - 80} width={90} height={52} rx={4} fill="#1e293b" />
      <rect x={x + 4} y={y - 76} width={82} height={44} rx={2} fill="#fef3c7" />
      <text x={x + 45} y={y - 49} textAnchor="middle" fontSize={12} fontWeight={800} fill="#be123c">
        {text}
      </text>
    </g>
  );
}

export function LoudFilmHome({}: Story) {
  const s = useScene(4, [600, 1500, 2200, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="বাসায় মামা-মামি নতুন ছবি হুলুস্থুল নিয়ে হুলুস্থুল বাধিয়েছেন; ছবির score (5, 5), কান্নাও বেশি, হাসিও বেশি">
        <L_TV x={24} y={LG} text="হুলুস্থুল" />
        <Person who="mami" x={170} y={LG} facing={-1} mood={k >= 2 ? "happy" : "plain"} arm={k === 2 ? "wave" : "down"} label />
        <Person who="mama" x={226} y={LG} facing={-1} mood={k >= 3 ? "happy" : "plain"} arm={k === 3 ? "wave" : "down"} label />
        <Person who="fahim" x={k >= 1 ? 286 : 350} y={LG} facing={-1} walking={k === 1} ms={1300} mood={k >= 4 ? "puzzled" : "plain"} label={k >= 1} />
        {k === 2 && <Bubble x={170} y={LG - 66} lines={["এত কান্না আর", "কোনো ছবিতে নাই."]} />}
        {k === 3 && <Bubble x={226} y={LG - 66} side="left" lines={["এত হাসিও নাই."]} />}
        {k >= 4 && (
          <>
            <CastCard x={69} y={52} text="(5, 5)" tone="coral" />
            <text x={69} y={36} textAnchor="middle" fontSize={8} fontWeight={700} fill={L_INK} className={FADE}>
              কান্না, হাসি
            </text>
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for step 6's first paragraph, no task: the three films as
//      arrows on (কান্না, হাসি). হুলুস্থুল's is the longest, 7.07. Then মামা's
//      and মামি's tastes point two ways, and the box still crowns হুলুস্থুল
//      for both.

const X6_O = { x: 26, y: 116 };
const X6_SC = 17;
const X6_FILM_TONE = [L_BLUE, L_TEAL, L_CORAL];
const X6_SAY = [
  "তিনটা ছবি, arrow হিসাবে: (কান্না, হাসি).",
  "হুলুস্থুল এর arrow সবচেয়ে লম্বা, 7.07.",
  "মামা আর মামি তাকান দুই দিকে.",
  "তবু box এ দুইজনের কাছেই জেতে হুলুস্থুল, লম্বা বলে.",
];

export function LongestArrow() {
  const s = useScene(3, [600, 1800, 1600]);
  const k = s.k;
  const { x: ox, y: oy } = X6_O;
  const at = (v: readonly number[]) => [ox + v[0] * X6_SC, oy - v[1] * X6_SC] as const;
  return (
    <Scene scene={s} caption={lsay(X6_SAY, k)}>
      <div className="mx-auto flex w-full max-w-xs items-center gap-3">
        <svg viewBox="0 0 132 126" role="img" aria-label="Titanic (5, 2), Mr. Bean (1, 4), হুলুস্থুল (5, 5); হুলুস্থুল এর arrow সবচেয়ে লম্বা" className="block h-auto w-full max-w-[9.5rem] shrink-0">
          <rect x={1} y={1} width={130} height={124} rx={8} fill="white" stroke="#cbd5e1" />
          <path d={`M${ox} ${oy}H126M${ox} ${oy}V6`} stroke={L_INK} strokeOpacity={0.35} />
          <text x={126} y={oy + 8} textAnchor="end" fontSize={7} fill="#475569">
            কান্না
          </text>
          <text x={ox - 3} y={12} textAnchor="end" fontSize={7} fill="#475569">
            হাসি
          </text>
          {k >= 2 &&
            TASTES.map((t) => {
              const [x2, y2] = at(t.v);
              return <L_Arr key={t.who} x1={ox} y1={oy} x2={x2} y2={y2} color="#64748b" w={1.4} dashed />;
            })}
          {FILMS.map((f, i) => {
            const [x2, y2] = at(f.v);
            return <L_Arr key={f.name} x1={ox} y1={oy} x2={x2} y2={y2} color={X6_FILM_TONE[i]} w={i === 2 && k >= 1 ? 3.4 : 2.2} op={k >= 1 && i !== 2 ? 0.55 : 1} />;
          })}
          {k >= 2 &&
            TASTES.map((t) => {
              const [x2, y2] = at(t.v);
              return (
                <text key={t.who} x={x2 + (t.v[0] > t.v[1] ? 2 : -3)} y={y2 + (t.v[0] > t.v[1] ? 10 : -3)} textAnchor={t.v[0] > t.v[1] ? "start" : "end"} fontSize={7} fontWeight={700} fill="#475569" className={FADE}>
                  {WHO_BN[t.who]}
                </text>
              );
            })}
        </svg>
        <div className="grid gap-1 text-sm">
          {FILMS.map((f, i) => (
            <div key={f.name} className={`flex items-baseline justify-between gap-2 rounded-md px-1 ${i === 2 && k >= 3 ? "bg-accent/15" : ""}`}>
              <span className={["text-cat-blue", "text-cat-teal", "text-cat-coral"][i]}>{filmBn(f.name)}</span>
              {k >= 1 && <b className={`${FADE} font-mono text-xs`}>{fix(len(f.v), 2)}</b>}
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for step 6's second paragraph, no task: direction only.
//      Every arrow the same length. মামি's taste sits next to Titanic, মামা's
//      next to Mr. Bean, and হুলুস্থুল at 45°, right between the two.

const X6B_O = { x: 22, y: 116 };
const X6B_R = 90;
const deg = (v: readonly number[]) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
const X6B_SAY = [
  "Length ফেলে দিলে থাকে শুধু direction.",
  "মামির direction এর সবচেয়ে কাছে Titanic.",
  "মামার direction এর সবচেয়ে কাছে Mr. Bean.",
  "হুলুস্থুল ঠিক মাঝখানে, 45° তে. তাই দুইজনের কাছেই দুই নম্বরে.",
];

export function MiddleDirection() {
  const s = useScene(3, [600, 1800, 1800]);
  const k = s.k;
  const { x: ox, y: oy } = X6B_O;
  const end = (v: readonly number[], r = X6B_R) => {
    const a = (deg(v) * Math.PI) / 180;
    return [ox + r * Math.cos(a), oy - r * Math.sin(a)] as const;
  };
  const lit = (i: number) => (k === 1 && i === 0) || (k === 2 && i === 1) || (k >= 3 && i === 2);
  const tasteOn = (who: string) => (who === "Mami" ? k === 1 || k >= 3 : k >= 2);
  return (
    <Scene scene={s} caption={lsay(X6B_SAY, k)}>
      <svg viewBox="0 0 200 124" role="img" aria-label="সব arrow সমান লম্বা: মামির পাশে Titanic, মামার পাশে Mr. Bean, হুলুস্থুল মাঝখানে 45° তে" className="mx-auto block h-auto w-full max-w-[15rem]">
        <rect x={1} y={1} width={198} height={122} rx={10} fill="white" stroke="#cbd5e1" />
        <path d={`M${ox + X6B_R} ${oy}A${X6B_R} ${X6B_R} 0 0 0 ${ox} ${oy - X6B_R}`} fill="none" stroke={L_INK} strokeOpacity={0.2} strokeDasharray="3 3" />
        <path d={`M${ox} ${oy}H194M${ox} ${oy}V8`} stroke={L_INK} strokeOpacity={0.3} />
        {TASTES.map((t) => {
          if (!tasteOn(t.who)) return null;
          const [x2, y2] = end(t.v, X6B_R + 10);
          const [lx, ly] = end(t.v, X6B_R + 14);
          return (
            <g key={t.who} className={FADE}>
              <path d={`M${ox} ${oy}L${x2} ${y2}`} stroke="#64748b" strokeWidth={1.3} strokeDasharray="3 2" />
              <text x={lx + (t.who === "Mami" ? 2 : 0)} y={ly + (t.who === "Mami" ? 3 : -2)} textAnchor={t.who === "Mami" ? "start" : "middle"} fontSize={7.5} fontWeight={700} fill="#475569">
                {WHO_BN[t.who]}
              </text>
            </g>
          );
        })}
        {FILMS.map((f, i) => {
          const [x2, y2] = end(f.v);
          const [lx, ly] = i === 2 ? end(f.v, X6B_R + 2) : end(f.v, X6B_R - 16);
          return (
            <g key={f.name}>
              <L_Arr x1={ox} y1={oy} x2={x2} y2={y2} color={X6_FILM_TONE[i]} w={lit(i) ? 3.2 : 2} op={k === 0 || lit(i) ? 1 : 0.35} />
              {(k === 0 || lit(i)) && (
                <text x={lx + (i === 1 ? -4 : 4)} y={ly + (i === 0 ? 11 : 0)} textAnchor={i === 1 ? "end" : "start"} fontSize={7.5} fontWeight={700} fill={X6_FILM_TONE[i]} className={FADE}>
                  {filmBn(f.name)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for step 8's first paragraph, no task: the দালাল's card
//      from 4.1 on the two cows. Their prices come out 74,000 and 85,000.
//      Normalise the cows' lists first and both weigh "about 1": the box now
//      says about 296 and 425, and the price is gone.

const X8_COWS = [
  { name: "বড় বুড়ি গাই", v: [250, 6, 10] },
  { name: "ছোট জোয়ান গাই", v: [200, 5, 3] },
];
const X8_KNOBS = [400, 4000, -5000];
const X8_SAY = [
  "4.1 এর দুইটা গাই: (ওজন, দুধ, বয়স).",
  "দালালের card দিয়ে box: দাম 74,000 আর 85,000 টাকা.",
  "এবার আগে length 1 করে নেই. দুইটা গাইয়েরই ওজন হয়ে গেলো প্রায় 1.",
  "Box দিলো প্রায় 296 আর 425. গাইয়ের দামটাই হারিয়ে গেলো.",
];

export function CowNews() {
  const s = useScene(3, [600, 2200, 2400]);
  const k = s.k;
  const unit = k >= 2;
  return (
    <Scene scene={s} caption={lsay(X8_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs gap-1.5">
        <div className="flex items-baseline justify-center gap-1.5 text-xs text-muted">
          দালালের card <span className="font-mono text-foreground">(400, 4000, −5000)</span>
        </div>
        {X8_COWS.map((c) => {
          const u = c.v.map((x) => x / len(c.v));
          const price = dot(X8_KNOBS, unit ? u : c.v);
          return (
            <div key={c.name} className="grid grid-cols-[1fr_auto] items-center gap-x-2 rounded-xl border border-border bg-surface px-3 py-1.5">
              <span className="text-sm font-semibold">{c.name}</span>
              {k >= 1 ? (
                <b key={unit ? "u" : "v"} className={`${POP} inline-block text-right font-mono ${unit && k >= 3 ? "text-danger" : ""}`}>
                  {unit && k < 3 ? "?" : Math.round(price).toLocaleString("en-IN")}
                </b>
              ) : (
                <span />
              )}
              <span key={unit ? "u" : "v"} className={`${FADE} font-mono text-xs text-muted`}>
                {unit ? `(${u.map((x) => fix(x, 3)).join(", ")})` : <Tup v={c.v} of={COW_SLOTS} />}
              </span>
              <span className="text-right text-xs text-muted">{k >= 1 ? "টাকা" : ""}</span>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8¾ · A figure for step 8's side quest, no task: a streaming app's
//      learned film arrows. The popular film's arrow is long, and the box
//      pulls it up for every viewer, one after another. No numbers.

const X8B_O = { x: 22, y: 110 };
const X8B_FILMS = [
  { a: 20, r: 58, pop: false },
  { a: 44, r: 96, pop: true },
  { a: 70, r: 60, pop: false },
];
const X8B_VIEWERS = [10, 82];
const X8B_SAY = [
  "App নিজেই ছবির arrow শেখে. জনপ্রিয় ছবির arrow প্রায়ই লম্বা.",
  "একজন দর্শকের পছন্দ একদিকে. তার দিকে সবচেয়ে লম্বা shadow জনপ্রিয় ছবির.",
  "আরেকজনের পছন্দ আরেকদিকে. সেখানেও জনপ্রিয় ছবিটাই এগিয়ে.",
  "জনপ্রিয় ছবি সবাইকে একটু বেশি দেখানো হলো, জেনে-বুঝেই.",
];

export function PopularPull() {
  const s = useScene(3, [600, 2000, 2000]);
  const k = s.k;
  const { x: ox, y: oy } = X8B_O;
  const pt = (a: number, r: number) => [ox + r * Math.cos((a * Math.PI) / 180), oy - r * Math.sin((a * Math.PI) / 180)] as const;
  const viewers = X8B_VIEWERS.filter((_, i) => k >= i + 1 && (k === i + 1 || k >= 3));
  // the one viewer being scored: each film's shadow on their line, the farthest wins
  const one = k === 1 || k === 2 ? X8B_VIEWERS[k - 1] : null;
  return (
    <Scene scene={s} caption={lsay(X8B_SAY, k)}>
      <svg viewBox="0 0 170 120" role="img" aria-label="জনপ্রিয় ছবির লম্বা arrow দুই দর্শকের কাছেই box এ এগিয়ে থাকে" className="mx-auto block h-auto w-full max-w-[13rem]">
        <rect x={1} y={1} width={168} height={118} rx={10} fill="white" stroke="#cbd5e1" />
        {viewers.map((a) => {
          const [x2, y2] = pt(a, 102);
          return (
            <g key={a} className={FADE}>
              <path d={`M${ox} ${oy}L${x2} ${y2}`} stroke="#64748b" strokeWidth={1.3} strokeDasharray="3 2" />
              <text x={x2 + 3} y={y2 + (a < 45 ? 11 : 8)} textAnchor={a < 45 ? "end" : "start"} fontSize={7.5} fontWeight={700} fill="#475569">
                দর্শক
              </text>
            </g>
          );
        })}
        {one !== null &&
          X8B_FILMS.map((f) => {
            const [x2, y2] = pt(f.a, f.r);
            const [fx, fy] = pt(one, f.r * Math.cos(((f.a - one) * Math.PI) / 180));
            return (
              <g key={`p${one}${f.a}`} className={FADE}>
                <path d={`M${x2} ${y2}L${fx} ${fy}`} stroke={L_INK} strokeOpacity={0.3} strokeDasharray="2 2" />
                <circle cx={fx} cy={fy} r={f.pop ? 3.4 : 2.4} fill={f.pop ? L_CORAL : L_BLUE} />
              </g>
            );
          })}
        {X8B_FILMS.map((f) => {
          const [x2, y2] = pt(f.a, f.r);
          return <L_Arr key={f.a} x1={ox} y1={oy} x2={x2} y2={y2} color={f.pop ? L_CORAL : L_BLUE} w={f.pop && k >= 1 ? 3.4 : 2.2} op={k >= 1 && !f.pop ? 0.5 : 1} />;
        })}
        <text x={pt(44, 96)[0] + 4} y={pt(44, 96)[1]} fontSize={8} fontWeight={700} fill="#be123c">
          জনপ্রিয়
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for step 7's explanation, no task: সামিনের খাতা from 3.6.
//      করিম (20, 10), ডাক্তার আপা (200, 100); their lengths 22 and 224, ten
//      times apart. Normalise and both rows read (0.89, 0.45), length 1: the
//      answer to "who spends most" has been rubbed out by our own hand.

const X7_ROWS = [
  { who: "করিম", v: [20, 10] },
  { who: "ডাক্তার আপা", v: [200, 100] },
];
const X7_SAY = [
  "সামিনের খাতা: কে (চা, শরবত) এ কত টাকা খরচ করলো.",
  "Length: করিম 22, আপা 224. আপা 10 গুণ বড় ক্রেতা.",
  "Normalise: দুইজনই (0.89, 0.45), length 1.",
  "বড় ক্রেতা কে? খাতায় আর লেখা নাই. উত্তরটা নিজের হাতেই মোছা.",
];

export function SpenderErase() {
  const s = useScene(3, [600, 2200, 2200]);
  const k = s.k;
  const normed = k >= 2;
  return (
    <Scene scene={s} caption={lsay(X7_SAY, k)}>
      <div className="mx-auto w-full max-w-xs rounded-xl border border-[#e7d7c1] bg-[#fffbeb] px-3 py-2 text-[#0f1b2d]">
        <div className="text-center text-xs font-semibold text-[#92400e]">সামিনের খাতা</div>
        <div className="mt-1 grid grid-cols-[1fr_auto_3.2rem] items-center gap-x-2 gap-y-1 text-sm">
          <span />
          <span className="text-center text-[0.7rem] text-[#64748b]">(চা, শরবত)</span>
          <span className="text-right text-[0.7rem] text-[#64748b]">length</span>
          {X7_ROWS.map((r) => {
            const L = len(r.v);
            return (
              <div key={r.who} className="contents">
                <span className={`font-semibold ${r.v[0] === 200 && k === 1 ? "text-[#be123c]" : ""}`}>{r.who}</span>
                <span key={normed ? "u" : "v"} className={`${FADE} text-center font-mono text-xs`}>
                  {normed ? "(0.89, 0.45)" : <Tup v={r.v} of={TEA_SLOTS} />}
                </span>
                <span className="text-right font-mono text-sm">
                  {k >= 1 && !normed && <b className={`${POP} inline-block`}>{Math.round(L)}</b>}
                  {normed && (
                    <span className={FADE}>
                      <span className="mr-1 text-xs text-[#94a3b8] line-through">{Math.round(L)}</span>
                      <b>1</b>
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 h-6 text-center text-sm">
          {k === 1 && <span className={`${FADE} font-semibold text-[#be123c]`}>10 গুণ</span>}
          {k >= 3 && <b className={`${POP} inline-block rounded-full bg-[#fee2e2] px-2 text-[#be123c]`}>বড় ক্রেতা: ?</b>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for step 10's explanation, no task: the three news items
//       as papers, sized by length, the ইলিশ share in blue. The box counts
//       only the blue: the market report has the most, 10. Divide by the
//       length and all three are one size; now the one that is most ইলিশ
//       wins: 1.00, 0.99, 0.16.

const X10N_NEWS = [
  { name: "দুই লাইন", v: [3, 0, 0] },
  { name: "আধা পাতা", v: [6, 1, 0] },
  { name: "দশ পাতা", v: [10, 60, 8] },
];
const X10N_SAY = [
  "তিনটা খবর, তিন সাইজের. নীল অংশটা ইলিশ.",
  "Box গোনে শুধু নীল: দশ পাতার খবরে নীল সবচেয়ে বেশি, 10.",
  "Length দিয়ে ভাগ দিলে তিনটা খবরই এক সাইজের.",
  "এবার জেতে যে খবরের বেশিটা ইলিশ: 1.00, 0.99, আর দশ পাতা 0.16.",
];

export function NewsShrink() {
  const s = useScene(3, [600, 2200, 1800]);
  const k = s.k;
  const hs = useTween(X10N_NEWS.map((n) => (k >= 2 ? 64 : 12 + len(n.v) * 1.2)), 1100);
  return (
    <Scene scene={s} caption={lsay(X10N_SAY, k)}>
      <svg viewBox="0 0 220 130" role="img" aria-label="তিনটা খবর, length অনুযায়ী সাইজ; length দিয়ে ভাগ দিলে সব এক সাইজ, আর দুই লাইনের খবর জেতে" className="mx-auto block h-auto w-full max-w-[15rem]">
        <rect x={1} y={1} width={218} height={128} rx={10} fill="white" stroke="#cbd5e1" />
        {X10N_NEWS.map((n, i) => {
          const h = hs[i];
          const w = Math.min(h * 0.72, 56);
          const cx = 40 + i * 70;
          const base = 104;
          const share = n.v[0] / (n.v[0] + n.v[1] + n.v[2]);
          const win = k >= 3 && i < 2;
          return (
            <g key={n.name}>
              <rect x={cx - w / 2} y={base - h} width={w} height={h} rx={2} fill="#f8fafc" stroke={win ? "#16a34a" : "#94a3b8"} strokeWidth={win ? 2 : 1} />
              <rect x={cx - w / 2} y={base - h * share} width={w} height={h * share} fill={L_BLUE} opacity={0.75} />
              <text x={cx} y={base + 11} textAnchor="middle" fontSize={8} fontWeight={700} fill={L_INK}>
                {n.name}
              </text>
              {k === 1 && (
                <text x={cx} y={base + 22} textAnchor="middle" fontSize={8.5} fontWeight={800} fontFamily="ui-monospace, monospace" fill={i === 2 ? "#be123c" : L_INK} className={FADE}>
                  {n.v[0]}
                </text>
              )}
              {k >= 3 && (
                <text x={cx} y={base + 22} textAnchor="middle" fontSize={8.5} fontWeight={800} fontFamily="ui-monospace, monospace" fill={win ? "#15803d" : "#be123c"} className={FADE}>
                  {fix(cosQ(n.v), 2)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for step 9's setup, no task: the next afternoon, the
//      library closing. লাইব্রেরির আপু hands ফাহিম a list: কোন কাজে কোন
//      মাপ, লিখে দিয়ে যাও. ফাহিম wonders: box, cosine, না distance? No job
//      is sorted.

function L_Paper() {
  return (
    <g>
      <rect x={-7} y={-9} width={14} height={18} rx={1.5} fill="white" stroke="#94a3b8" strokeWidth={0.8} />
      {[0, 1, 2, 3].map((r) => (
        <path key={r} d={`M-4 ${-5 + r * 4}h8`} stroke="#94a3b8" strokeWidth={1} />
      ))}
    </g>
  );
}

export function ListHandover({}: Story) {
  const s = useScene(3, [600, 1600, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="লাইব্রেরি বন্ধের সময় আপু ফাহিমের হাতে একটা list দেন: কোন কাজে কোন মাপ, লিখে দিয়ে যাও">
        <Tree x={30} y={LG} s={0.9} />
        <Building x={176} y={LG} w={132} h={96} color="#e7d7c1" label="লাইব্রেরি" />
        <rect x={272} y={LG - 44} width={24} height={44} fill="#78350f" />
        <L_Apu x={210} arm={k >= 1 && k < 3 ? "hold" : "down"} mood={k === 2 ? "smug" : "plain"} />
        <Person who="fahim" x={140} y={LG} arm={k >= 3 ? "hold" : "down"} mood={k >= 3 ? "puzzled" : "plain"} label />
        {k >= 1 && (
          <L_Carry x={k >= 3 ? 159 : 192} y={LG - 34} ms={900}>
            <L_Paper />
          </L_Carry>
        )}
        {k === 2 && <Bubble x={210} y={LG - 60} lines={["কোন কাজে কোন মাপ,", "লিখে দিয়ে যাও."]} />}
        {k >= 3 && <Bubble x={140} y={LG - 66} tone="think" lines={["box, cosine,", "না distance?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for step 9's explanation, no task: three questions, three
//      measures. কত বড়: two arrows one way, one longer (box). কী ধরনের: two
//      directions and the angle between (cosine). কে কোথায়: two spots and
//      the gap (distance).

const X13_ITEMS = [
  { q: "কত বড়?", tool: "box" },
  { q: "কী ধরনের?", tool: "cosine" },
  { q: "কে কোথায়?", tool: "distance" },
];
const X13_SAY = [
  "তিনটা মাপ, তিনটা প্রশ্ন.",
  "কত বড়: length ও যখন খবর, box.",
  "কী ধরনের: শুধু direction জানতে চাইলে, cosine.",
  "কে কোথায় দাঁড়িয়ে: জায়গাটাই যখন প্রশ্ন, distance.",
];

function X13_Pic({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 64 48" aria-hidden="true" className="mx-auto block h-auto w-full max-w-[4.5rem]">
      <rect x={0.5} y={0.5} width={63} height={47} rx={6} fill="white" stroke="#cbd5e1" />
      {i === 0 && (
        <>
          <L_Arr x1={8} y1={40} x2={56} y2={12} color={L_CORAL} w={2.2} />
          <L_Arr x1={8} y1={44} x2={30} y2={31} color={L_BLUE} w={2.2} />
        </>
      )}
      {i === 1 && (
        <>
          <L_Arr x1={8} y1={40} x2={56} y2={34} color={L_BLUE} w={2.2} />
          <L_Arr x1={8} y1={40} x2={36} y2={8} color={L_TEAL} w={2.2} />
          <path d="M26 38A18 18 0 0 0 20 27" fill="none" stroke={L_AMBER} strokeWidth={1.6} />
        </>
      )}
      {i === 2 && (
        <>
          <path d="M16 34L48 14" stroke={L_CORAL} strokeWidth={1.6} strokeDasharray="3 2" />
          <circle cx={16} cy={34} r={4} fill={L_BLUE} />
          <circle cx={48} cy={14} r={4} fill={L_TEAL} />
        </>
      )}
    </svg>
  );
}

export function ThreeQuestions() {
  const s = useScene(3, [600, 1800, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={lsay(X13_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2 text-center">
        {X13_ITEMS.map((it, i) => (
          <div key={it.tool} className={`rounded-xl px-1 py-1 transition-opacity duration-500 motion-reduce:transition-none ${k === 0 || k === i + 1 ? "" : "opacity-45"}`}>
            <div className="text-sm font-semibold">{it.q}</div>
            <X13_Pic i={i} />
            <div className="mt-0.5 h-5">
              {k >= i + 1 && <b className={`${POP} inline-block rounded-full bg-cat-amber/15 px-2 text-sm`}>{it.tool}</b>}
            </div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11a · A story scene for step 11's first paragraph, no task: আপু keeps
//       machine B for finding fish, and machine A stays too, for price, total
//       and popularity.

export function KeepBoth({}: Story) {
  const s = useScene(3, [600, 2200, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="আপু মাছ খোঁজার জন্য machine B রাখেন; machine A ও থাকে দাম, মোট আর জনপ্রিয়তার জন্য">
        <L_Shelf x={10} y={LG} w={80} />
        <L_Desk x={150} y={LG} lit={k >= 1 ? 1 : undefined} />
        <L_Apu x={272} arm={k >= 1 ? "point" : "down"} mood={k >= 1 ? "happy" : "plain"} />
        {k === 1 && <Bubble x={272} y={LG - 60} side="left" lines={["মাছ খুঁজতে", "machine B."]} />}
        {k >= 2 && <L_Note x={222} y={50} lines={["মাছ খোঁজা"]} tone="#15803d" />}
        {k >= 3 && <L_Note x={140} y={50} lines={["দাম, মোট, জনপ্রিয়তা"]} tone={L_AMBER} />}
        {k >= 2 && <path d="M222 58L205 84" stroke="#15803d" strokeWidth={1} className={FADE} />}
        {k >= 3 && <path d="M160 58L174 84" stroke={L_AMBER} strokeWidth={1} className={FADE} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 11b · A story scene for step 11's bridge, no task: a month later the
//       district's catalogue arrives, lakhs of books. ফাহিম searches "মাছ";
//       machine B takes a root and a division for every book, the screen
//       hangs, আপু waits. ফাহিম wonders if cosine can be made as cheap as the
//       box. The fix is not shown (that is 4.8).

/** An hourglass, centred at (x, y). */
function L_Hourglass({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className={POP}>
      <path d="M-5 -8h10l-5 8l5 8h-10l5 -8Z" fill="#fef3c7" stroke="#92400e" strokeWidth={1.2} />
      <path d="M-2.5 5h5l-2.5 -3Z" fill="#d97706" />
    </g>
  );
}

export function CatalogueFreeze({}: Story) {
  const s = useScene(4, [600, 2400, 2000, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="জেলার catalogue আসে, লাখ লাখ বই; ফাহিম মাছ search দেয়, machine B প্রতিটা বইয়ে root আর ভাগ করে, screen আটকে যায়">
        <L_Shelf x={8} y={LG} w={70} />
        {k >= 1 && (
          <g className={FADE}>
            <L_Shelf x={80} y={LG} w={50} />
          </g>
        )}
        <L_Desk x={150} y={LG} query={k >= 2} lit={k >= 2 ? 1 : undefined} />
        {k >= 3 && (
          <g>
            <rect x={191} y={86} width={29} height={29} rx={2} fill="white" />
            <L_Hourglass x={205.5} y={100} />
          </g>
        )}
        <L_Apu x={276} mood={k >= 3 ? "puzzled" : "plain"} arm={k === 1 ? "hold" : "down"} />
        {k === 1 && <Bubble x={276} y={LG - 60} side="left" lines={["জেলার সব বই", "এই computer এ উঠবে."]} />}
        {k === 1 && <L_Note x={110} y={30} lines={["জেলার catalogue", "লাখ লাখ বই"]} tone={L_VIOLET} fs={8} />}
        {(k === 2 || k === 3) && <L_Note x={96} y={30} lines={k === 2 ? ["প্রতিটা বইয়ে:", "root, তারপর ভাগ"] : ["এখনো চলছে ..."]} tone={L_CORAL} fs={8} />}
        <Person who="fahim" x={k >= 2 ? 138 : -30} y={LG} walking={k === 2} ms={1300} arm={k === 2 ? "point" : "down"} mood={k >= 4 ? "puzzled" : "plain"} label={k >= 2} />
        {k >= 4 && <Bubble x={138} y={LG - 66} tone="think" lines={["cosine কে box এর মতো", "সস্তা করা যায় না?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5¾ · A figure for step 5's second paragraph, no task: length is only how
//      many words were written. The three books as rows of word tiles (blue
//      মাছ, teal নৌকা, amber ধান), the fat book's row running long. Divide the
//      length away and every row squeezes to one width: what's left is the mix
//      of colours, what the book is about. No numbers.

const X5W_ROWS = BOOKS.map((b) => ({ id: b.id, kinds: b.v.flatMap((n, kind) => Array.from({ length: n }, () => kind)) }));
const X5W_FILL = [L_BLUE, L_TEAL, L_AMBER];
const X5W_TW = 7.4; // a word tile, with its gap
const X5W_X = 58;
const X5W_W = 150; // the one width every row squeezes to
const X5W_SAY = [
  "তিনটা বই, প্রতিটা word একটা টুকরা: নীল মাছ, সবুজ নৌকা, হলুদ ধান.",
  "মোটা বইয়ের সারি লম্বা. Length মানে শুধু কয়টা word লেখা হয়েছে.",
  "Length ভাগ দিয়ে ফেলে দিলে, তিনটা সারিই এক মাপের.",
  "থাকে শুধু রঙের মিশাল: বইটা কী নিয়ে.",
];

export function WordSqueeze() {
  const s = useScene(3, [600, 2200, 1800]);
  const k = s.k;
  const sc = useTween(X5W_ROWS.map((r) => (k >= 2 ? X5W_W / (r.kinds.length * X5W_TW) : 1)), 1200);
  return (
    <Scene scene={s} caption={lsay(X5W_SAY, k)}>
      <svg viewBox="0 0 220 88" role="img" aria-label="তিনটা বই word এর টুকরা হিসাবে; length ভাগ দিলে সব সারি এক মাপের, থাকে শুধু রঙের মিশাল" className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect x={1} y={1} width={218} height={86} rx={10} fill="white" stroke="#cbd5e1" />
        {X5W_ROWS.map((r, ri) => {
          const y = 12 + ri * 26;
          const w = r.kinds.length * X5W_TW * sc[ri];
          const tile = X5W_TW * sc[ri];
          return (
            <g key={r.id}>
              <text x={X5W_X - 5} y={y + 10} textAnchor="end" fontSize={8} fontWeight={700} fill={r.id === "C" ? "#be123c" : L_INK}>
                {BOOK_BN[r.id].short}
              </text>
              {r.kinds.map((kind, i) => (
                <rect key={i} x={X5W_X + i * tile} y={y} width={Math.max(0.6, tile - 1.2)} height={14} rx={1.5} fill={X5W_FILL[kind]} opacity={k === 3 && kind !== 0 ? 0.55 : 1} />
              ))}
              {k === 1 && (
                <path key={`len${ri}`} d={`M${X5W_X} ${y + 18}H${X5W_X + w}`} stroke={L_INK} strokeOpacity={0.5} strokeWidth={1} className={FADE} />
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8⅝ · A figure for step 8's second paragraph, no task: three jobs where
//      length is noise, বই খোঁজা, word এর মানে, এরকম আরো দেখাও. Each has a
//      long arrow and a short one pointing the same way; the long ones shrink
//      to the short ones' size, and cosine lands under all three. No numbers.

const X8N_JOBS = [
  { t: "বই খোঁজা", a: 18 },
  { t: "word এর মানে", a: 50 },
  { t: "এরকম আরো দেখাও", a: 34 },
];
const X8N_SAY = [
  "বই খোঁজা, word এর মানে মেলানো, এরকম আরো দেখাও.",
  "এসবে length শুধু noise. ফেলে দিলে একই দিকের arrow গুলা এক.",
  "তাই search আর chatbot এর খোঁজাখুঁজিতে প্রায় সবসময় cosine ই চলে.",
];

export function NoiseJobs() {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  const [L] = useTween([k >= 1 ? 22 : 46], 1100);
  return (
    <Scene scene={s} caption={lsay(X8N_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2 text-center">
        {X8N_JOBS.map((j) => {
          const r = (j.a * Math.PI) / 180;
          const at = (len: number) => [8 + len * Math.cos(r), 42 - len * Math.sin(r)] as const;
          const [lx, ly] = at(L);
          const [sx, sy] = at(22);
          return (
            <div key={j.t}>
              <div className="h-8 text-xs leading-tight font-semibold">{j.t}</div>
              <svg viewBox="0 0 64 48" aria-hidden="true" className="mx-auto block h-auto w-full max-w-[4.5rem]">
                <rect x={0.5} y={0.5} width={63} height={47} rx={6} fill="white" stroke="#cbd5e1" />
                <L_Arr x1={8} y1={42} x2={lx} y2={ly} color={L_CORAL} w={2} />
                <L_Arr x1={8 + 3 * Math.sin(r)} y1={42 + 3 * Math.cos(r)} x2={sx + 3 * Math.sin(r)} y2={sy + 3 * Math.cos(r)} color={L_BLUE} w={2} />
              </svg>
              <div className="mt-0.5 h-5">
                {k >= 1 && <span className={`${FADE} text-xs text-muted`}>length: noise</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 h-6 text-center">
        {k >= 2 && <b className={`${POP} inline-block rounded-full bg-cat-teal/15 px-3 text-sm`}>cosine</b>}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10a · A story scene for step 10's setup, no task: আপুর পত্রিকার আলমারি.
//       Out come a two-line slip and a ten-page bundle; then someone types
//       "ইলিশ" into the search, and it waits on "?". No order is shown.

/** আপুর পত্রিকার আলমারি, bottom-left at (x, y): shelves of folded papers, thin and thick. */
function L_PaperCupboard({ x, y }: { x: number; y: number }) {
  const stacks = [
    [3, 9, 4, 14],
    [6, 2, 12, 5],
    [10, 3, 7, 2],
  ];
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y - 96} width={92} height={96} fill="#7c4a1e" />
      {stacks.map((row, r) => {
        const base = y - 8 - r * 29;
        let bx = x + 6;
        return (
          <g key={r}>
            <rect x={x + 3} y={base - 25} width={86} height={25} fill="#fdf6ec" opacity={0.25} />
            {row.map((h, i) => {
              const w = 17;
              const el = <rect key={i} x={bx} y={base - h - 2} width={w} height={h + 2} fill="#f8fafc" stroke="#94a3b8" strokeWidth={0.6} />;
              bx += w + 3;
              return el;
            })}
          </g>
        );
      })}
    </g>
  );
}

/** A clipping lying on the floor, bottom-centre at (0, 0): `pages` sheets thick, its caption above it. */
function L_Clip({ pages, text }: { pages: number; text: string }) {
  const h = 3 + pages * 1.6;
  return (
    <g>
      <rect x={-13} y={-h} width={26} height={h} fill="#f8fafc" stroke="#94a3b8" strokeWidth={0.8} />
      {Array.from({ length: Math.min(pages, 2) }, (_, i) => (
        <path key={i} d={`M-9 ${-h + 3 + i * 3}h18`} stroke="#94a3b8" strokeWidth={0.8} />
      ))}
      <text x={0} y={-h - 3} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={L_INK}>
        {text}
      </text>
    </g>
  );
}

export function NewsCupboard({}: Story) {
  const s = useScene(3, [600, 1800, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="আপুর পত্রিকার আলমারি; দুই লাইনের খবর আর দশ পাতার খবর; কেউ search এ ইলিশ লেখে">
        <L_PaperCupboard x={12} y={LG} />
        {/* the desk and the computer's one search window */}
        <rect x={150} y={LG - 28} width={80} height={4} fill="#92400e" />
        <rect x={154} y={LG - 24} width={3} height={24} fill="#78350f" />
        <rect x={223} y={LG - 24} width={3} height={24} fill="#78350f" />
        <rect x={186} y={LG - 32} width={8} height={4} fill="#475569" />
        <rect x={156} y={LG - 68} width={68} height={37} rx={3} fill="#1e293b" />
        <rect x={160} y={LG - 64} width={60} height={29} rx={2} fill="white" />
        <text x={190} y={LG - 56} textAnchor="middle" fontSize={6.5} fontWeight={700} fill={L_INK}>
          পত্রিকার search
        </text>
        {k >= 3 && (
          <g className={FADE}>
            <rect x={166} y={LG - 52} width={48} height={10} rx={1.5} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={0.6} />
            <text x={190} y={LG - 44.5} textAnchor="middle" fontSize={7} fontWeight={700} fill={L_INK}>
              ইলিশ
            </text>
            <text x={190} y={LG - 36} textAnchor="middle" fontSize={7} fontWeight={800} fill={L_CORAL}>
              ?
            </text>
          </g>
        )}
        {/* the two clippings wait inside the cupboard and glide out onto the stage */}
        <L_Carry x={k >= 1 ? 126 : 40} y={k >= 1 ? LG : 100} ms={900}>
          <g className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-0"}`}>
            <L_Clip pages={1} text="দুই লাইন" />
          </g>
        </L_Carry>
        <L_Carry x={k >= 2 ? 250 : 70} y={k >= 2 ? LG : 100} ms={900}>
          <g className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "opacity-100" : "opacity-0"}`}>
            <L_Clip pages={10} text="দশ পাতা" />
          </g>
        </L_Carry>
        <L_Apu x={282} arm={k === 1 || k === 2 ? "point" : "down"} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  RopeRecallPick: { start: {}, short: { pick: 0, miss: 1 }, same: { pick: 2, miss: 1 }, right: { pick: 1 } },
  TwoMachines: { start: {}, bet: { bet: 1 } },
  OneHotPick: { start: {}, tuple: { pick: 0, miss: 1 }, thirteen: { pick: 1, miss: 1 }, right: { pick: 2 } },
  SpenderPick: { start: {}, normed: { pick: 0, miss: 1 }, dir: { pick: 2, miss: 1 }, right: { pick: 1 } },
  NewsSearch: { start: {}, box: { pick: 0, miss: 1 }, length: { pick: 2, miss: 1 }, right: { pick: 1 } },
  DotRanking: { start: {}, one: { ran: ["C"] }, all: { ran: ["A", "B", "C"] } },
  CosRanking: { start: {}, one: { ran: ["A"] }, all: { ran: ["A", "B", "C"] } },
  LoudForBoth: { start: {}, box: { rule: 0, seen: [0] }, cos: { rule: 1, seen: [0, 1] } },
  LengthIsNews: { start: {}, miss: { done: 2, miss: 1, bin: 1 }, all: { done: 6 } },
  PickTool: { start: {}, miss: { done: 2, miss: 1, bin: 0 }, all: { done: 5 } },
  // the watch-only scenes: `k` beats shown; `stepping` shows the step controls
  RopeRecall: { start: { k: 0 }, short: { k: 1 }, done: {} },
  LibraryEvening: { start: { k: 0 }, apa: { k: 1 }, card: { k: 2, stepping: true }, done: {} },
  SameCounts: { in: { k: 1 }, odd: { k: 3 }, done: {} },
  OneHotBox: { start: { k: 0 }, one: { k: 1 }, sum: { k: 4 }, done: {} },
  WordTiles: { start: { k: 0 }, fish: { k: 1 }, done: {} },
  SlantWins: { start: { k: 0 }, van: { k: 1 }, done: {} },
  UnitFan: { start: { k: 0 }, fat: { k: 2 }, boat: { k: 3 }, done: {} },
  LoudFilmHome: { start: { k: 0 }, mami: { k: 2 }, mama: { k: 3 }, done: {} },
  LongestArrow: { start: { k: 0 }, long: { k: 1 }, done: {} },
  MiddleDirection: { start: { k: 0 }, mami: { k: 1 }, mama: { k: 2 }, done: {} },
  CowNews: { start: { k: 0 }, price: { k: 1 }, unit: { k: 2 }, done: {} },
  PopularPull: { start: { k: 0 }, one: { k: 1 }, two: { k: 2 }, done: {} },
  SpenderErase: { start: { k: 0 }, len: { k: 1 }, normed: { k: 2 }, done: {} },
  NewsShrink: { start: { k: 0 }, box: { k: 1 }, done: {} },
  CatalogueFreeze: { start: { k: 0 }, letter: { k: 1 }, search: { k: 2 }, hang: { k: 3 }, done: {} },
  ListHandover: { start: { k: 0 }, hand: { k: 1 }, say: { k: 2 }, done: {} },
  ThreeQuestions: { start: { k: 0 }, box: { k: 1 }, done: {} },
  KeepBoth: { start: { k: 0 }, say: { k: 1 }, done: {} },
  WordSqueeze: { start: { k: 0 }, long: { k: 1 }, squeezed: { k: 2 }, done: {} },
  NoiseJobs: { start: { k: 0 }, noise: { k: 1 }, done: {} },
  NewsCupboard: { start: { k: 0 }, slip: { k: 1 }, bundle: { k: 2 }, done: {} },
};
