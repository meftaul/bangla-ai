"use client";

import type { ReactNode } from "react";

import { Bubble, Building, Card as CastCard, Person, Stage, StoryFrame, Tree } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Ticks, pill, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { bn } from "./figure-kit";
import { DotBox, dot, tupN } from "./haat-journey";

// Screens for two journeys, "Math for AI 4.7 — পাঠাগারের খোঁজ, dot না cosine"
// (TwoMachines to PickTool) and "Math for AI 4.8 — এক box, ChatGPT-র ভেতরেও"
// (BoxBet, OneRanking, WhoIsIt, Finale).
//
// The village library's new computer has two search machines, and for "মাছ"
// they disagree: the box ranks a long book about boats and rice above a short
// note about fish; cosine doesn't. The reader bets which to keep, then runs
// both: 2, 20, 3 against 1.000, 0.999, 0.424. The loud film (5, 5) wins for
// মামা and মামী alike under the box and for neither under cosine. Six jobs are
// sorted by whether length is news. Normalising once makes the plain box the
// cosine, and distance gives the same order. In a sentence, "ওটা" finds its
// word by the biggest box (attention), and a change of context changes the
// answer. Five fresh jobs, unaided, into box / cosine / distance. The finale
// reads Module 1's formula out loud, one tap per piece.
//
// Every setup that tells a scene gets a story scene (2a the library, 6a the
// loud film at home, 9a দশ লাখ বই, 11a the night call, 13a the list, 15a/15b
// আপা keeps both and the bus home), and every <Then> gets one or two
// watch-only figures (2½, 4½, 4¾, 5½, 6½, 6¾, 8½, 8¾, 9½, 9¾, 10½, 11½, 12½,
// 12¾, 13½, 15½, 15¾ in the side quest, 16½, 16¾), plus two Check answers
// (1½ the rope, 3½ the box). They sit at the end of the file.
//
// Tailwind only.

const len = (v: readonly number[]) => Math.hypot(...v);
const fix = (n: number, d: number) => {
  const s = Math.abs(n).toFixed(d);
  return n < 0 && Number(s) !== 0 ? `−${s}` : s;
};

// Books as word counts: (মাছ, নৌকা, ধান).
const QUERY = [1, 0, 0];
const BOOKS = [
  { id: "A", name: "মাছ নিয়ে ছোট্ট চিঠি", v: [2, 0, 0] },
  { id: "B", name: "মাছ নিয়ে মোটা বই", v: [20, 1, 0] },
  { id: "C", name: "নৌকা আর ধানের বই", v: [3, 5, 4] },
];
const cosQ = (v: readonly number[]) => dot(QUERY, v) / (len(QUERY) * len(v));
const rankBy = (score: (v: readonly number[]) => number, low = false) =>
  [...BOOKS].sort((a, b) => (low ? score(a.v) - score(b.v) : score(b.v) - score(a.v)));

function BookRow({ name, v, score, on, onClick, label }: { name: string; v: number[]; score: string; on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      disabled={on}
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left transition-colors motion-reduce:transition-none disabled:cursor-default ${
        on ? "border-cat-blue/40 bg-cat-blue/5" : "border-border hover:border-cat-blue/60"
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{name}</span>
        <span className="font-mono text-xs text-muted">{tupN(v)}</span>
      </span>
      {on ? (
        <b key={score} className={`${POP} inline-block font-mono text-lg`}>
          {score}
        </b>
      ) : (
        <span className="text-xs whitespace-nowrap text-cat-blue">{label}</span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 1 · Two machines, one query. Machine ক ranks by the box, machine খ by
//     cosine, and they disagree about the fish note. The reader bets which the
//     librarian should keep; LengthIsNews and PickTool settle it.

const MACHINES = [
  { name: "machine ক", order: rankBy((v) => dot(QUERY, v)) },
  { name: "machine খ", order: rankBy(cosQ) },
];
const KEEP_BET = ["machine ক, মোটা বই তো সত্যিই মাছে ভরা", "machine খ", "দুইটাই সমান ভালো, উত্তর তো প্রায় একই"];

export function TwoMachines() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি সিল হলো, মিলিয়ে দেখবো শেষে।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-full border-2 border-border px-4 py-1 text-sm">
        সার্চ: <b>মাছ</b>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {MACHINES.map((m) => (
          <div key={m.name} className="rounded-xl border-2 border-border bg-surface px-2 py-2">
            <div className="text-center text-sm font-semibold">{m.name}</div>
            <ol className="mt-1 grid gap-1 text-[0.8rem] leading-snug">
              {m.order.map((b, i) => (
                <li key={b.id} className={`rounded-md px-1.5 py-0.5 ${b.id === "C" ? "bg-cat-coral/10" : ""}`}>
                  {bn(i + 1)}. {b.name}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm font-medium text-muted">মাছের বই খুঁজতে আপা কোন machine রাখবেন?</div>
      <div className="mt-2 grid gap-2">
        {KEEP_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>দুইটা তালিকা দেখে একটাতে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Machine ক, by hand. The query (1, 0, 0) into the box with each book:
//     2, 20, 3. The boats-and-rice book beats the fish note.

export function DotRanking() {
  const pass = useGate();
  const [ran, setRan] = useSeed<string[]>("ran", []);
  const all = ran.length === BOOKS.length;

  const run = (id: string) => {
    if (ran.includes(id)) return;
    const next = [...ran, id];
    setRan(next);
    if (next.length === BOOKS.length) pass("box জেতায় লম্বা বইকে, মানানসইকে না।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border border-border bg-surface px-3 py-1 text-center text-sm">
        প্রশ্ন “মাছ” = <b className="font-mono">(1, 0, 0)</b>
        <div className="text-xs text-muted">ঘরগুলো (মাছ, নৌকা, ধান)-এর গোনা</div>
      </div>
      <div className="mt-3 grid gap-2">
        {BOOKS.map((b) => (
          <BookRow key={b.id} name={b.name} v={b.v} score={String(dot(QUERY, b.v))} on={ran.includes(b.id)} onClick={() => run(b.id)} label="box এ  দিন" />
        ))}
      </div>
      {all && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          ক্রম: <b>মোটা বই</b> 20, <b className="text-cat-coral">নৌকা-ধান</b> 3, <b>চিঠি</b> 2
        </div>
      )}
      <Task done={all}>প্রশ্নটা প্রতিটা বইয়ের সাথে box এ  দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Machine খ, by hand. Divide each box by both lengths: 1.000, 0.999,
//     0.424. The two fish books top the list; boats-and-rice falls last.

export function CosRanking() {
  const pass = useGate();
  const [ran, setRan] = useSeed<string[]>("ran", []);
  const all = ran.length === BOOKS.length;

  const run = (id: string) => {
    if (ran.includes(id)) return;
    const next = [...ran, id];
    setRan(next);
    if (next.length === BOOKS.length) pass("length ভাগ করতেই মাছের বই উপরে।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border border-border bg-surface px-3 py-1 text-center text-sm">
        প্রশ্নের length <b className="font-mono">1</b>
      </div>
      <div className="mt-3 grid gap-2">
        {BOOKS.map((b) => (
          <div key={b.id}>
            <BookRow name={b.name} v={b.v} score={fix(cosQ(b.v), 3)} on={ran.includes(b.id)} onClick={() => run(b.id)} label="length দিয়ে ভাগ" />
            {ran.includes(b.id) && (
              <div className={`${FADE} mt-0.5 text-right font-mono text-xs text-muted`}>
                {dot(QUERY, b.v)} ÷ (1 × {fix(len(b.v), 2)})
              </div>
            )}
          </div>
        ))}
      </div>
      <Task done={all}>প্রতিটা বইয়ের box এর নম্বরকে দুইটা length দিয়ে ভাগ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The loud film. হইচই (5, 5) is loud in both genres. Under the box it wins
//     for মামা (35) and মামী (25) alike; under cosine each gets their own genre.
//     The reader toggles both rules.

const TASTES = [
  { who: "মামা", v: [2, 5] },
  { who: "মামী", v: [4, 1] },
];
const FILMS = [
  { name: "Titanic", v: [5, 2] },
  { name: "Mr. Bean", v: [1, 4] },
  { name: "হইচই", v: [5, 5] },
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
    if (next.length === 2) pass("যে সবার কাছে জেতে, সে জেতে লম্বা বলে।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border-2 border-cat-coral/40 bg-cat-coral/5 px-3 py-1 text-center text-sm">
        নতুন ছবি <b>হইচই</b> <span className="font-mono">(5, 5)</span>: কান্নাও বেশি, হাসিও বেশি
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
            {t.who}
          </span>
        ))}
        {FILMS.map((f) => (
          <div key={f.name} className="contents">
            <span>
              {f.name} <span className="font-mono text-xs text-muted">{tupN(f.v)}</span>
            </span>
            {TASTES.map((t) => {
              const top = rule !== null && FILMS.every((g) => score(t.v, g.v) <= score(t.v, f.v));
              return (
                <b
                  key={t.who}
                  className={`rounded-md px-1.5 text-center font-mono transition-colors motion-reduce:transition-none ${top ? "bg-accent text-accent-foreground" : ""}`}
                >
                  {rule === null ? "?" : rule === 1 ? fix(score(t.v, f.v), 2) : score(t.v, f.v)}
                </b>
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
      <Task done={both}>দুইটা নিয়মেই দেখুন, মামা আর মামীর জন্য কোন ছবি জেতে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Is length news? Six jobs, one at a time, into the box (length matters)
//     or cosine (only direction). Wrong tries bounce.

const LENGTH_JOBS = [
  { t: "দালালের card দিয়ে গরুর দাম", bin: 0 },
  { t: "মাছের বই খোঁজা, বই লম্বা হোক বা ছোট", bin: 1 },
  { t: "ভ্যান কাদা থেকে উঠবে কি না, রাস্তা বরাবর মোট ধাক্কা কত", bin: 0 },
  { t: "দুইটা শব্দের মানে কতটা কাছাকাছি", bin: 1 },
  { t: "“এরকম আরো ছবি দেখাও”, শুধু ছবির ধরন দেখে", bin: 1 },
  { t: "যে ছবি সবাই দেখে, সেটা সবাইকে একটু বেশি দেখানো", bin: 0 },
];
const LENGTH_BINS = [
  { name: "box", sub: "lengthও আসল খবর" },
  { name: "cosine", sub: "শুধু দিক, length ঝামেলা" },
];

export function LengthIsNews() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const all = done === LENGTH_JOBS.length;
  const job = LENGTH_JOBS[done];

  const drop = (b: number) => {
    if (all) return;
    if (b !== job.bin) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setDone(done + 1);
    if (done + 1 === LENGTH_JOBS.length) pass("আসল প্রশ্ন: length কি এখানে খবর?");
  };

  return (
    <>
      <div className="mt-4 min-h-20">
        {!all ? (
          <div key={done} className={`${POP} mx-auto max-w-sm rounded-2xl border-2 border-cat-violet/40 bg-surface px-4 py-3 text-center text-[0.95rem]`}>
            {job.t}
          </div>
        ) : (
          <div className={`${FADE} text-center text-[0.95rem] text-accent-text`}>ছয়টা কাজই ঠিক জায়গায়!</div>
        )}
        {miss !== null && !all && <Nope key={miss}>উঁহু। জিজ্ঞেস করুন, এখানে “বেশি” বা “বড়” হওয়াটা কি উত্তরের অংশ, নাকি শুধু গোলমাল?</Nope>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {LENGTH_BINS.map((b, i) => (
          <button
            key={b.name}
            type="button"
            disabled={all}
            onClick={() => drop(i)}
            className="flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border-2 border-border px-2 py-3 text-center transition-colors hover:border-cat-blue/60 motion-reduce:transition-none disabled:cursor-default"
          >
            <span className="text-sm font-semibold">{b.name}</span>
            <span className="text-xs text-muted">{b.sub}</span>
            <span className="font-mono text-sm">{bn(LENGTH_JOBS.slice(0, done).filter((j) => j.bin === i).length)}টা</span>
          </button>
        ))}
      </div>
      <Task done={all}>
        প্রতিটা কাজ কোন মাপের, ঠিক করে tap করুন ({bn(done)}/{bn(LENGTH_JOBS.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Normalise once. Every book card is stored 1 long. Then three rulers on
//     the unit cards: the plain box, cosine, and distance (smaller is closer).
//     All three give the same order.

const UNIT = BOOKS.map((b) => ({ ...b, u: b.v.map((x) => x / len(b.v)) }));
const RULERS = [
  { name: "শুধু box", score: (u: number[]) => dot(QUERY, u), low: false },
  { name: "cosine", score: (u: number[]) => cosQ(u), low: false },
  { name: "দূরত্ব", score: (u: number[]) => len(u.map((x, i) => x - QUERY[i])), low: true },
];

export function OneRanking() {
  const pass = useGate();
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const all = seen.length === RULERS.length;

  const show = (i: number) => {
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.length === RULERS.length) pass("একবার normalise, তিন মাপ একই ক্রম।");
  };

  return (
    <>
      <div className="mx-auto mt-2 grid max-w-sm gap-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm">
        <div className="text-xs text-muted">তাকে তোলার সময়েই প্রতিটা card-এর length 1 করে রাখা</div>
        {UNIT.map((b) => (
          <div key={b.id} className="flex justify-between gap-2">
            <span>{b.name}</span>
            <span className="font-mono text-xs">{`(${b.u.map((x) => fix(x, 2)).join(", ")})`}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {RULERS.map((r, i) => {
          const order = [...UNIT].sort((a, b) => (r.low ? r.score(a.u) - r.score(b.u) : r.score(b.u) - r.score(a.u)));
          const on = seen.includes(i);
          return (
            <button
              key={r.name}
              type="button"
              onClick={() => show(i)}
              className={`cursor-pointer rounded-xl border-2 px-1.5 py-2 text-center transition-colors motion-reduce:transition-none ${on ? "border-cat-blue/40 bg-cat-blue/5" : "border-border hover:border-cat-blue/60"}`}
            >
              <div className="text-sm font-semibold">{r.name}</div>
              {on ? (
                <ol className={`${FADE} mt-1 grid gap-0.5 text-xs`}>
                  {order.map((b, k) => (
                    <li key={b.id}>
                      {bn(k + 1)}. {b.id === "A" ? "চিঠি" : b.id === "B" ? "মোটা বই" : "নৌকা-ধান"} <span className="font-mono">{fix(r.score(b.u), 2)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="mt-1 text-xs text-cat-blue">ক্রম দেখুন</div>
              )}
            </button>
          );
        })}
      </div>
      <Task done={all}>তিনটা মাপেই বইগুলোর ক্রম দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Attention in a toy. In "বিড়ালটা দুধ খেলো কারণ ওটার খিদে পেয়েছিল", the
//     word ওটা sends a question (2, 0) and each word shows a key, with toy
//     slots (প্রাণী-ভাব, খাবার-ভাব). The biggest box wins: বিড়ালটা. Then the
//     ending changes to "…কারণ ওটা টাটকা ছিল", the question becomes (0, 2), and
//     দুধ wins.

const WORDS = [
  { w: "বিড়ালটা", key: [3, 1] },
  { w: "দুধ", key: [0, 3] },
  { w: "খেলো", key: [1, 1] },
];
const ROUNDS = [
  { tail: "কারণ ওটার খিদে পেয়েছিল", q: [2, 0], ans: 0 },
  { tail: "কারণ ওটা টাটকা ছিল", q: [0, 2], ans: 1 },
];

export function WhoIsIt() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [ran, setRan] = useSeed("ran", false);
  const r = ROUNDS[round];
  const scores = WORDS.map((x) => dot(r.q, x.key));
  const max = Math.max(...scores);

  const run = () => {
    setRan(true);
    if (round === 1) pass("“ওটা” তাকায় সবচেয়ে বড় box এর দিকে।");
  };

  return (
    <>
      <div key={round} className={`${FADE} mx-auto mt-2 max-w-sm rounded-xl border border-border bg-surface px-3 py-2 text-center text-[0.95rem]`}>
        বিড়ালটা দুধ খেলো {r.tail.split("ওটা")[0]}
        <span className="rounded-sm bg-cat-violet/15 font-semibold text-cat-violet">ওটা</span>
        {r.tail.split("ওটা")[1]}
      </div>
      <div className="mt-2 text-center text-sm">
        “ওটা”-র প্রশ্ন <b className="font-mono">{tupN(r.q)}</b> <span className="text-xs text-muted">(প্রাণী-ভাব, খাবার-ভাব)</span>
      </div>
      <div className="mx-auto mt-3 grid max-w-sm gap-1.5">
        {WORDS.map((x, i) => (
          <div key={x.w} className="grid grid-cols-[4.5rem_4rem_1fr_2rem] items-center gap-2 text-sm">
            <span className="font-semibold">{x.w}</span>
            <span className="font-mono text-xs text-muted">{tupN(x.key)}</span>
            <span className="h-3 rounded-full bg-foreground/10">
              {ran && (
                <span
                  className={`block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${scores[i] === max ? "bg-accent" : "bg-cat-blue/50"}`}
                  style={{ width: `${(scores[i] / 6) * 100}%` }}
                />
              )}
            </span>
            <b className="text-right font-mono">{ran ? scores[i] : "?"}</b>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        {!ran ? (
          <button type="button" onClick={run} className={`${pill(false)} font-sans`}>
            প্রশ্নটা প্রতিটা চাবির সাথে box এ  দিন
          </button>
        ) : round === 0 ? (
          <button
            type="button"
            onClick={() => {
              setRound(1);
              setRan(false);
            }}
            className={`${pill(false)} font-sans`}
          >
            বাক্যের শেষটা বদলান
          </button>
        ) : null}
      </div>
      {ran && (
        <div className={`${FADE} mt-2 text-center text-[0.95rem]`}>
          “ওটা” মানে <b>{WORDS[r.ans].w}</b>
        </div>
      )}
      <Ticks
        items={[
          ["খিদে পেয়েছিল", round === 1 || ran],
          ["টাটকা ছিল", round === 1 && ran],
        ]}
      />
      <Task done={round === 1 && ran}>“ওটা”-র প্রশ্ন প্রতিটা শব্দের সাথে box এ  দিন, তারপর বাক্যটা বদলে আবার দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · এবার আপনার পালা. Five fresh jobs into box / cosine / distance. Wrong
//     tries bounce.

const TOOL_JOBS = [
  { t: "Chatbot-কে প্রশ্ন করলে, কোন অনুচ্ছেদের মানে প্রশ্নের সবচেয়ে কাছে", bin: 1 },
  { t: "দালালের knob দিয়ে একটা ছাগলের দাম", bin: 0 },
  { t: "ডাক্তার আপার twin খেলা, standardise করার পর কে কার সবচেয়ে কাছে দাঁড়িয়ে", bin: 2 },
  { t: "লম্বা-ছোট হাজারটা খবরের মধ্যে “বন্যা” নিয়ে খবর খোঁজা", bin: 1 },
  { t: "ফাহিমের final number, নম্বর আর weight মিলিয়ে", bin: 0 },
];
const TOOLS = ["box", "cosine", "দূরত্ব"];

export function PickTool() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useSeed<number | null>("miss", null);
  const all = done === TOOL_JOBS.length;
  const job = TOOL_JOBS[done];

  const drop = (b: number) => {
    if (all) return;
    if (b !== job.bin) return setMiss((miss ?? 0) + 1);
    setMiss(null);
    setDone(done + 1);
    if (done + 1 === TOOL_JOBS.length) pass("lengthে box, দিকে cosine, জায়গায় দূরত্ব।");
  };

  return (
    <>
      <div className="mt-4 min-h-24">
        {!all ? (
          <div key={done} className={`${POP} mx-auto max-w-sm rounded-2xl border-2 border-cat-violet/40 bg-surface px-4 py-3 text-center text-[0.95rem]`}>
            {job.t}
          </div>
        ) : (
          <div className={`${FADE} text-center text-[0.95rem] text-accent-text`}>পাঁচটা কাজই ঠিক মাপে!</div>
        )}
        {miss !== null && !all && <Nope key={miss}>উঁহু। এখানে কি lengthটাই information, নাকি শুধু দিক, নাকি জায়গাটা?</Nope>}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {TOOLS.map((b, i) => (
          <button
            key={b}
            type="button"
            disabled={all}
            onClick={() => drop(i)}
            className="flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border-2 border-border px-1 py-3 text-center transition-colors hover:border-cat-blue/60 motion-reduce:transition-none disabled:cursor-default"
          >
            <span className="text-sm font-semibold">{b}</span>
            <span className="font-mono text-sm">{bn(TOOL_JOBS.slice(0, done).filter((j) => j.bin === i).length)}টা</span>
          </button>
        ))}
      </div>
      <Task done={all}>
        প্রতিটা কাজের জন্য ঠিক মাপটা বেছে নিন ({bn(done)}/{bn(TOOL_JOBS.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · Math for AI 4.8 opens here. সোম says the হাট's box is inside ChatGPT
//      too. The reader seals a bet on it, unmarked; OneRanking, ChordCos and
//      WhoIsIt collect the evidence, and the check after WhoIsIt settles it.

const BOX_BET = ["সত্যি, ভেতরে এই box-ই চলে", "না, ওটা একদম অন্য অঙ্ক", "box আছে, কিন্তু আসল কাজে না"];

export function BoxBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি সিল হলো। শুরু পাঠাগারের machine দিয়ে।");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl border-2 border-cat-amber/40 bg-cat-amber/5 px-2 py-2">
          <div className="text-sm font-semibold">হাটের box</div>
          <div className="font-mono text-[0.8rem]">2×60 + 1×180 + 12×12</div>
          <div className="text-xs text-muted">ঘরে ঘরে গুণ করে যোগ</div>
        </div>
        <div className="grid place-content-center rounded-2xl border-2 border-dashed border-border px-2 py-2">
          <div className="text-sm font-semibold">ChatGPT-র ভেতরে</div>
          <div className="font-mono text-2xl text-muted">?</div>
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-muted">সোমের কথাটা কি সত্যি?</div>
      <div className="mt-2 grid gap-2">
        {BOX_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>সোমের কথায় একটা বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Module 1, read out loud. The formula from the start of the series laid
//     out as a fraction; each piece opens on a tap to say what it is and where
//     it was learned. No gate: this is the send-off.

const PIECES = [
  { sym: "u, v", say: "দুইটা জিনিস, সংখ্যার list বানানো", where: "Article 1, representation" },
  { sym: "arrow", say: "আবার সেই u আর v, এবার arrow হিসেবে: একটা দিক আর একটা length", where: "Article 2, vector-এর দুই চেহারা" },
  { sym: "‖u‖ ‖v‖", say: "তাদের length: বর্গ, যোগ, root", where: "Article 3, ফিতা" },
  { sym: "u · v", say: "ঘরে ঘরে গুণ করে যোগ, মানে length × length × কতটা একই দিকে", where: "৪.১ থেকে ৪.৪, হাট, ভ্যান, ছাদ" },
  { sym: "cos θ", say: "শুধু কতটা একই দিকে, −1 থেকে 1", where: "৪.৫, TV-র সামনে" },
];

export function Finale() {
  const [open, setOpen] = useSeed<number[]>("open", []);
  const all = open.length === PIECES.length;
  const tap = (i: number) => !open.includes(i) && setOpen([...open, i]);
  const chip = (i: number, body: string, cls = "") => (
    <button
      type="button"
      onClick={() => tap(i)}
      className={`cursor-pointer rounded-lg px-2 py-0.5 font-mono transition-colors motion-reduce:transition-none ${
        open.includes(i) ? "bg-accent/15 text-accent-text" : "bg-cat-blue/10 text-cat-blue hover:bg-cat-blue/20"
      } ${cls}`}
    >
      {body}
    </button>
  );

  return (
    <>
      <div className="mx-auto mt-3 flex w-fit items-center gap-3 text-xl">
        {chip(4, "cos θ")}
        <span className="font-mono">=</span>
        <span className="grid justify-items-center gap-1">
          {chip(3, "u · v")}
          <span className="h-0.5 w-full bg-foreground/60" />
          {chip(2, "‖u‖ ‖v‖")}
        </span>
      </div>
      <div className="mt-2 flex justify-center gap-2 text-sm">
        {chip(0, "u, v", "text-sm")}
        {chip(1, "arrow", "text-sm")}
      </div>
      <div className="mx-auto mt-3 grid max-w-sm gap-1.5">
        {PIECES.map((p, i) =>
          open.includes(i) ? (
            <div key={p.sym} className={`${FADE} rounded-xl border border-border bg-surface px-3 py-1.5 text-sm`}>
              <b className="font-mono">{p.sym}</b> {p.say}
              <div className="text-xs text-muted">{p.where}</div>
            </div>
          ) : null,
        )}
      </div>
      {all && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-violet/5 px-4 py-3 text-center text-[0.95rem]`}>
          দুইটা জিনিস কতটা এক রকম, জানতে হলে তাদের arrow বানাও, দেখো কতটা একই দিকে তাক করা, আর lengthটা ভাগ করে ফেলে দাও, যাতে শুধু দিকটা থাকে।
        </div>
      )}
    </>
  );
}

// ===========================================================================
// Watch-only animations: story scenes for the setups (2a, 6a, 9a, 11a, 13a,
// 15a, 15b) and explanation figures for the <Then>s and Check answers (1½,
// 2½, 3½, 4½, 4¾, 5½, 6½, 6¾, 8½, 8¾, 9½, 9¾, 10½, 11½, 12½, 12¾, 13½, 15½,
// 15¾, 16½, 16¾). Each waits on its first frame for the reader (kit's
// useScene); every beat is drawn from `k` alone.

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

/** The name under someone who isn't in the cast (or on a night stage, in light ink). */
function L_Name({ x, y = LG, text, ms = 1200, light = false }: { x: number; y?: number; text: string; ms?: number; light?: boolean }) {
  return (
    <L_Carry x={x} y={y} ms={ms}>
      <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={light ? "#e2e8f0" : L_INK}>
        {text}
      </text>
    </L_Carry>
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

/** A desk with the library computer, desk's left edge at x, feet at y. Two windows, ক and খ. */
function L_Desk({ x, y, query = false, lit }: { x: number; y: number; query?: boolean; lit?: 0 | 1 }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y - 28} width={80} height={4} fill="#92400e" />
      <rect x={x + 4} y={y - 24} width={3} height={24} fill="#78350f" />
      <rect x={x + 73} y={y - 24} width={3} height={24} fill="#78350f" />
      <rect x={x + 36} y={y - 32} width={8} height={4} fill="#475569" />
      <rect x={x + 6} y={y - 68} width={68} height={37} rx={3} fill="#1e293b" />
      {(["ক", "খ"] as const).map((m, i) => (
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

/** A small note, centred at (x, y): lines of Bangla, sans. */
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
// 1½ · A figure for screen 1's Check answer, no task: 4.5's ঘাট. The boat is
//      3 m from the bank, the pull is 10. A 4 m rope comes in steep and sends
//      6.6 forward; a 15 m rope comes in flat and sends 9.8.

const X1_SAY = [
  "৪.৬-এর ঘাট। পাড় থেকে নৌকা 3 মিটার দূরে, টান 10।",
  "4 মিটার দড়ি: কোণ বড়, নদী বরাবর যায় 6.6।",
  "15 মিটার দড়ি: কোণ ছোট, নদী বরাবর যায় 9.8।",
  "লম্বা দড়ি, ছোট কোণ, ছায়া প্রায় পুরো টান।",
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
      <svg viewBox="0 0 290 112" role="img" aria-label="নৌকা পাড় থেকে 3 মিটার দূরে; 4 মিটার দড়িতে সামনে 6.6, 15 মিটার দড়িতে 9.8" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={288} height={110} rx={10} fill="#e0f2fe" stroke="#cbd5e1" />
        <rect x={1} y={X1_BANK} width={288} height={19} fill="#a3b18a" />
        <text x={282} y={X1_BANK + 13} textAnchor="end" fontSize={8} fill={L_INK}>
          পাড়
        </text>
        <text x={258} y={15} textAnchor="end" fontSize={8} fill="#0369a1">
          নদী বরাবর সামনে
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
            <path d={`M${X1_BOAT} ${boatY - 12}H${tipX}`} stroke={L_AMBER} strokeWidth={4} strokeLinecap="round" opacity={0.85} />
            <text x={tipX + 5} y={boatY - 9} fontSize={10} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#b45309">
              {fix(10 * cos, 1)}
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: the library in the
//      evening. পাঠাগারের আপা (a new face, drawn in ammu's look with her own
//      name) beside the new computer's two machines; a book becomes its list
//      (মাছ, নৌকা, ধান); ফাহিম walks up and searches "মাছ" in both. No result.

export function LibraryEvening({}: Story) {
  const s = useScene(4, [600, 2400, 2200, 1500]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সন্ধ্যায় পাঠাগার; আপা নতুন কম্পিউটারে দুইটা machine দেখান, একটা বই হয় (মাছ, নৌকা, ধান)-এর list, ফাহিম দুইটাতেই মাছ লিখে সার্চ দেয়">
        <L_Shelf x={12} y={LG} w={96} />
        <L_Desk x={182} y={LG} query={k >= 4} />
        <Person who="ammu" x={288} y={LG} facing={-1} arm={k === 1 ? "point" : "down"} mood={k === 1 ? "happy" : "plain"} />
        <L_Name x={288} text="আপা" />
        {k === 1 && <Bubble x={288} y={LG - 66} side="left" lines={["দুইটা খোঁজার machine,", "দুইটাই ভাইয়ের বানানো।"]} />}
        {k >= 2 && (
          <>
            <rect x={52} y={40} width={9} height={20} fill="#1d4ed8" className={POP} />
            <L_Note x={60} y={26} lines={["(মাছ, নৌকা, ধান)", "(3, 5, 4)"]} tone={L_AMBER} fs={8} />
          </>
        )}
        <Person who="fahim" x={k >= 3 ? 160 : -30} y={LG} walking={k === 3} ms={1400} arm={k >= 4 ? "point" : "down"} label={k >= 3} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: both machines are handed
//      the same three lists; out come two orders, and the odd one out is the
//      third book, নৌকা-ধান, second for ক and last for খ. It stops at "কেন?".

const X2_SAY = [
  "তিনটা বই, প্রতিটার একই গোনা।",
  "দুইটা machine-এর হাতে হুবহু একই তিনটা list।",
  "তবু দুইটা আলাদা ক্রম বের হলো।",
  "গরমিল তৃতীয় বইটা নিয়ে: ক-তে দুই নম্বরে, খ-তে তিন নম্বরে।",
  "মাছ খুঁজতে গিয়ে নৌকা-ধানের বই দুই নম্বরে কেন?",
];
const X2_SHORT: Record<string, string> = { A: "চিঠি", B: "মোটা বই", C: "নৌকা-ধান" };

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
              <div className="font-mono text-[0.7rem] text-muted">{tupN(b.v)}</div>
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
                          {bn(i + 1)}. {X2_SHORT[b.id]}
                        </span>
                      ) : (
                        <span className="font-mono text-[0.72rem]">{tupN(b.v)}</span>
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
// 3½ · A figure for screen 3's Check answer, no task: the box opened on
//      (1, 0, 0) and (4, 2, 7), row by row. The 1 keeps the first slot, the 0s
//      wipe the rest: 4. Last, the slip: adding the book's slots gives 13.

const X3_SAY = [
  "দুইটা list: (1, 0, 0) আর (4, 2, 7)।",
  "প্রথম ঘর: 1 × 4 = 4।",
  "দ্বিতীয় ঘরে 0, তাই গুণফল 0।",
  "তৃতীয় ঘরেও 0।",
  "যোগ করে 4। যে ঘরে 1, শুধু সেটাই বাঁচে।",
  "গুণ না করে বইয়ের ঘরগুলো যোগ করলে আসে 13।",
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
// 4½ · A figure for screen 4's first paragraph, no task: the words as tiles.
//      The note is 2 words, both মাছ; the boats-and-rice book is 12 words, 3
//      of them মাছ. The box counts only মাছ tiles, 2 against 3, so the book
//      wins, though the note is all fish and the book a quarter.

const X4_KINDS = [
  { name: "মাছ", cls: "bg-cat-blue" },
  { name: "নৌকা", cls: "bg-cat-teal" },
  { name: "ধান", cls: "bg-cat-amber" },
];
const X4_ROWS = [
  { name: "চিঠি", v: BOOKS[0].v, share: "পুরোটাই মাছ" },
  { name: "নৌকা-ধান", v: BOOKS[2].v, share: `${bn(12)}টার মাত্র ${bn(3)}টা মাছ` },
];
const X4_SAY = [
  "প্রতিটা শব্দ একটা টুকরা: নীল মাছ, সবুজ নৌকা, হলুদ ধান।",
  "box দেখে শুধু মাছের ঘর।",
  "মাছের টুকরা গুনে চিঠি 2, বই 3। বই আগে।",
  "অথচ চিঠি পুরোটাই মাছ, আর বইয়ে মাছ প্রায় কিছুই না।",
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
// 4¾ · A figure for screen 4's second paragraph, no task: 4.2's van, with the
//      road laid flat. ফাহিম pushes along it (5); the কুলি pushes 53° off
//      with 10, and his shadow on the road is 6. Then the same picture with
//      the মাছ axis: the note (2) against the long, bent boats-and-rice book,
//      whose shadow is 3.

const X4B_O = { x: 26, y: 104 };
const X4B_SAY = [
  "৪.২-এর ভ্যান। ফাহিম রাস্তা বরাবর ঠেলে, জোর 5। কুলি বাঁকা, জোর 10।",
  "রাস্তা বরাবর ছায়া: ফাহিম 5, কুলি 6। বাঁকা হয়েও কুলি জিতলো।",
  "বই দুইটাও তাই। মাছের দিক বরাবর ছায়া: চিঠি 2, নৌকা-ধান 3।",
  "নৌকা-ধানের বই মাছ থেকে অনেক বাঁকা, কিন্তু লম্বা, 7.07। লম্বা বলেই জিতলো।",
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
        <svg viewBox="0 0 150 124" role="img" aria-label="সোজা ছোট arrow আর বাঁকা লম্বা arrow; বাঁকাটার ছায়া বেশি" className="block h-auto w-full max-w-[10rem] shrink-0">
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
          <div className="text-xs text-muted">{books ? "মাছের দিকে ছায়া" : "রাস্তা বরাবর ছায়া"}</div>
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
// 5½ · A figure for screen 5's first paragraph, no task: the three books as
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
  "প্রশ্ন “মাছ” তাক করা মাছের দিক বরাবর।",
  "চিঠি: ছোট, কিন্তু একদম মাছের দিকে।",
  "মোটা বই: অনেক লম্বা, প্রায় একই দিকে, মাত্র 3° সরে।",
  "নৌকা-ধানের বই: প্রায় 65° দূরে।",
  "length দিয়ে ভাগ করলে সবাই সমান লম্বা। থাকে শুধু দিক।",
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
      <svg viewBox="0 0 230 124" role="img" aria-label="তিনটা বই arrow হিসেবে: চিঠি আর মোটা বই মাছের দিকে, নৌকা-ধান 65° দূরে; length ভাগ করলে সবাই সমান লম্বা" className="mx-auto block h-auto w-full max-w-[17rem]">
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
// 6a · A story scene for screen 6's setup, no task: home. ফাহিম walks in; the
//      TV shows the new film হইচই; মামী is taken by the crying, মামা by the
//      laughing, and its card (5, 5) comes up. Who it wins for is not said.

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
      <Stage backdrop="room" label="বাড়িতে মামা-মামী নতুন ছবি হইচই নিয়ে হইচই করছেন; ছবির score (5, 5), কান্নাও বেশি, হাসিও বেশি">
        <L_TV x={24} y={LG} text="হইচই" />
        <Person who="mami" x={170} y={LG} facing={-1} mood={k >= 2 ? "happy" : "plain"} arm={k === 2 ? "wave" : "down"} label />
        <Person who="mama" x={226} y={LG} facing={-1} mood={k >= 3 ? "happy" : "plain"} arm={k === 3 ? "wave" : "down"} label />
        <Person who="fahim" x={k >= 1 ? 286 : 350} y={LG} facing={-1} walking={k === 1} ms={1300} mood={k >= 4 ? "puzzled" : "plain"} label={k >= 1} />
        {k === 2 && <Bubble x={170} y={LG - 66} lines={["কান্না সবচেয়ে বেশি!"]} />}
        {k === 3 && <Bubble x={226} y={LG - 66} side="left" lines={["হাসিও সবচেয়ে বেশি!"]} />}
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
// 6½ · A figure for screen 6's first paragraph, no task: the three films as
//      arrows on (কান্না, হাসি). হইচই's is the longest, 7.07. Then মামা's and
//      মামী's tastes point two ways, and the box still crowns হইচই for both.

const X6_O = { x: 26, y: 116 };
const X6_SC = 17;
const X6_FILM_TONE = [L_BLUE, L_TEAL, L_CORAL];
const X6_SAY = [
  "তিনটা ছবি, arrow হিসেবে: (কান্না, হাসি)।",
  "হইচই-এর arrow সবচেয়ে লম্বা, 7.07।",
  "মামা আর মামী তাকান দুই দিকে।",
  "তবু box এ দুইজনের কাছেই জেতে হইচই, লম্বা বলে।",
];

export function LongestArrow() {
  const s = useScene(3, [600, 1800, 1600]);
  const k = s.k;
  const { x: ox, y: oy } = X6_O;
  const at = (v: readonly number[]) => [ox + v[0] * X6_SC, oy - v[1] * X6_SC] as const;
  return (
    <Scene scene={s} caption={lsay(X6_SAY, k)}>
      <div className="mx-auto flex w-full max-w-xs items-center gap-3">
        <svg viewBox="0 0 132 126" role="img" aria-label="Titanic (5, 2), Mr. Bean (1, 4), হইচই (5, 5); হইচই-এর arrow সবচেয়ে লম্বা" className="block h-auto w-full max-w-[9.5rem] shrink-0">
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
                  {t.who}
                </text>
              );
            })}
        </svg>
        <div className="grid gap-1 text-sm">
          {FILMS.map((f, i) => (
            <div key={f.name} className={`flex items-baseline justify-between gap-2 rounded-md px-1 ${i === 2 && k >= 3 ? "bg-accent/15" : ""}`}>
              <span className={["text-cat-blue", "text-cat-teal", "text-cat-coral"][i]}>{f.name}</span>
              {k >= 1 && <b className={`${FADE} font-mono text-xs`}>{fix(len(f.v), 2)}</b>}
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for screen 6's second paragraph, no task: direction only.
//      Every arrow the same length. মামী's taste sits next to Titanic, মামা's
//      next to Mr. Bean, and হইচই at 45°, right between the two.

const X6B_O = { x: 22, y: 116 };
const X6B_R = 90;
const deg = (v: readonly number[]) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
const X6B_SAY = [
  "length ফেলে দিলে থাকে শুধু দিক।",
  "মামীর দিকের সবচেয়ে কাছে Titanic।",
  "মামার দিকের সবচেয়ে কাছে Mr. Bean।",
  "হইচই ঠিক মাঝখানে, 45°-এ। তাই দুইজনের কাছেই দুই নম্বরে।",
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
  const tasteOn = (who: string) => (who === "মামী" ? k === 1 || k >= 3 : k >= 2);
  return (
    <Scene scene={s} caption={lsay(X6B_SAY, k)}>
      <svg viewBox="0 0 200 124" role="img" aria-label="সব arrow সমান লম্বা: মামীর পাশে Titanic, মামার পাশে Mr. Bean, হইচই মাঝখানে 45°-এ" className="mx-auto block h-auto w-full max-w-[15rem]">
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
              <text x={lx + (t.who === "মামী" ? 2 : 0)} y={ly + (t.who === "মামী" ? 3 : -2)} textAnchor={t.who === "মামী" ? "start" : "middle"} fontSize={7.5} fontWeight={700} fill="#475569">
                {t.who}
              </text>
            </g>
          );
        })}
        {FILMS.map((f, i) => {
          const [x2, y2] = end(f.v);
          const [lx, ly] = end(f.v, X6B_R - 16);
          return (
            <g key={f.name}>
              <L_Arr x1={ox} y1={oy} x2={x2} y2={y2} color={X6_FILM_TONE[i]} w={lit(i) ? 3.2 : 2} op={k === 0 || lit(i) ? 1 : 0.35} />
              {(k === 0 || lit(i)) && (
                <text x={lx + (i === 1 ? -4 : 4)} y={ly + (i === 0 ? 11 : 0)} textAnchor={i === 1 ? "end" : "start"} fontSize={7.5} fontWeight={700} fill={X6_FILM_TONE[i]} className={FADE}>
                  {f.name}
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
// 8½ · A figure for screen 8's first paragraph, no task: the দালাল's card
//      from 4.1 on the two cows. Their prices come out 74,000 and 85,000.
//      Normalise the cows' lists first and both weigh "about 1": the box now
//      says about 296 and 425, and the price is gone.

const X8_COWS = [
  { name: "বড় বুড়ি গাই", v: [250, 6, 10] },
  { name: "ছোট জোয়ান গাই", v: [200, 5, 3] },
];
const X8_KNOBS = [400, 4000, -5000];
const X8_SAY = [
  "৪.১-এর দুইটা গাই: (ওজন, দুধ, বয়স)।",
  "দালালের card দিয়ে box: দাম 74,000 আর 85,000 টাকা।",
  "এবার আগে length 1 করে নিই। দুইটা গাইয়েরই ওজন হয়ে গেল প্রায় 1।",
  "box দিলো প্রায় 296 আর 425। গাইয়ের দামটাই হারিয়ে গেল।",
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
                {unit ? `(${u.map((x) => fix(x, 3)).join(", ")})` : tupN(c.v)}
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
// 8¾ · A figure for screen 8's second paragraph, no task: a streaming app's
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
  "App নিজে ছবির arrow শেখে। জনপ্রিয় ছবির arrow প্রায়ই লম্বা।",
  "একজন দর্শকের পছন্দ একদিকে। তার দিকে সবচেয়ে লম্বা ছায়া জনপ্রিয় ছবির।",
  "আরেকজনের পছন্দ আরেকদিকে। সেখানেও জনপ্রিয় ছবিই এগিয়ে।",
  "জনপ্রিয় ছবি সবাইকে একটু বেশি দেখানো, জেনে-বুঝেই।",
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
// 9a · A story scene for screen 9's setup, no task: every search, every book:
//      length, root, ভাগ, and the books run to দশ লাখ. আপার ভাই (a new face,
//      in karim's look) walks in with the fix: make each card 1 long once,
//      when it goes on the shelf. The three rulers are not run.

export function MillionBooks({}: Story) {
  const s = useScene(4, [600, 2200, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="প্রতি সার্চে প্রতিটা বইয়ের length, root, ভাগ; বই দশ লাখ হলে? আপার ভাই বলেন, তাকে তোলার সময়েই length 1 করে রাখো">
        <L_Shelf x={8} y={LG} w={78} />
        <L_Shelf x={90} y={LG} w={70} />
        <L_Desk x={170} y={LG} />
        <Person who="ammu" x={256} y={LG} facing={-1} mood={k === 2 ? "puzzled" : k >= 4 ? "happy" : "plain"} />
        <L_Name x={256} text="আপা" />
        {k >= 1 && k < 4 && <L_Note x={86} y={30} lines={["প্রতিটা বইয়ে: length, root, ভাগ", k >= 2 ? "প্রতিবার, দশ লাখ বইয়ে" : "প্রতিবার সার্চে"]} tone={L_CORAL} fs={8} />}
        {k === 2 && <Bubble x={256} y={LG - 66} side="left" lines={["বই দশ লাখ হলে?"]} />}
        <Person who="karim" x={k >= 3 ? 298 : 360} y={LG} facing={-1} walking={k === 3} ms={1300} arm={k === 3 ? "wave" : "down"} mood={k >= 3 ? "smug" : "plain"} />
        {k >= 3 && <L_Name x={298} text="আপার ভাই" />}
        {k === 3 && <Bubble x={298} y={LG - 66} side="left" lines={["তাকে তোলার সময়েই", "length 1 করে রাখো!"]} />}
        {k >= 4 && (
          <>
            <rect x={120} y={50} width={9} height={20} fill="#15803d" className={POP} />
            <L_Note x={124} y={34} lines={["length 1"]} tone="#15803d" />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for screen 9's formula, no task: cosine as box ÷ lengths;
//      hats on both, each length is 1, dividing by 1 × 1 does nothing, and
//      what's left is the plain box: cos θ = û · v̂.

const X9_SAY = [
  "cosine: box, তারপর দুইটা length দিয়ে ভাগ।",
  "card দুইটা আগেই 1 লম্বা করা, তাই দুইটা lengthই 1।",
  "1 দিয়ে ভাগ করলে কিছুই বদলায় না।",
  "তাই সাধারণ boxই cosine।",
];

export function HatFormula() {
  const s = useScene(3, [600, 2200, 1600]);
  const k = s.k;
  const u = k >= 1 ? "û" : "u";
  const v = k >= 1 ? "v̂" : "v";
  return (
    <Scene scene={s} caption={lsay(X9_SAY, k)}>
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
// 9¾ · A figure for screen 9's second paragraph, no task: shelving vs
//      searching. Each document is normalised once as it's stored; a search
//      runs only the box with each, one by one; then all at once on a GPU.

const X9B_DOCS = [0, 1, 2, 3, 4, 5];
const X9B_SAY = [
  "জমা থাকা document।",
  "জমা রাখার সময়েই প্রতিটা একবার normalise, length 1।",
  "খোঁজার সময় প্রশ্নের সাথে শুধু box, একটার পর একটা।",
  "GPU সব box একসাথে চালায়। আসল system-এ কোটি কোটি।",
];

export function StoreOnce() {
  const s = useScene(3, [600, 1800, 2200]);
  const k = s.k;
  const dx = (i: number) => 22 + i * 40;
  return (
    <Scene scene={s} caption={lsay(X9B_SAY, k)}>
      <svg viewBox="0 0 250 104" role="img" aria-label="document জমার সময় একবার normalise, খোঁজার সময় শুধু box, GPU-তে একসাথে" className="mx-auto block h-auto w-full max-w-[18rem]">
        {k >= 3 && (
          <g className={FADE}>
            <rect x={6} y={44} width={238} height={56} rx={6} fill="#ede9fe" stroke={L_VIOLET} strokeWidth={1.2} />
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
          X9B_DOCS.map((i) => (
            <path
              key={`l${i}${k >= 3}`}
              d={`M125 20L${dx(i) + 11} 60`}
              pathLength={1}
              strokeDasharray="1 2"
              style={{ transitionDelay: `${k >= 3 ? 0 : i * 260}ms` }}
              className={`fill-none [stroke-dashoffset:0] transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none starting:[stroke-dashoffset:1] ${k >= 3 ? "stroke-[#7c3aed] [stroke-width:2]" : "stroke-[#d97706] [stroke-width:1.2]"}`}
            />
          ))}
        {X9B_DOCS.map((i) => (
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
// 10½ · A figure for screen 10's formula, no task: two arrows 1 long, the
//       second swinging open, 0° → 60° → 90° → 180°. The gap between their
//       tips reads 0, 1, 1.41, 2 while cos reads 1, 0.5, 0, −1; distance² is
//       2 − 2 cos θ every time.

const X10_ANG = [0, 60, 90, 180];
const X10_SAY = [
  "একই দিকে: cos 1, মাথার দূরত্ব 0।",
  "60°: cos 0.5, দূরত্ব 1।",
  "90°: cos 0, দূরত্ব 1.41।",
  "উল্টো দিকে: cos −1, দূরত্ব 2।",
  "প্রতিবার দূরত্ব² = 2 − 2 cos θ। cos যত বড়, দূরত্ব তত ছোট।",
];

export function ChordCos() {
  const s = useScene(4, [600, 1800, 1800, 1800]);
  const k = s.k;
  const [a] = useTween([X10_ANG[Math.min(k, 3)]], 1100);
  const r = (a * Math.PI) / 180;
  const O = { x: 130, y: 94 };
  const R = 70;
  const ux = O.x + R;
  const vx = O.x + R * Math.cos(r);
  const vy = O.y - R * Math.sin(r);
  const c = Math.cos(r);
  const d = Math.sqrt(Math.max(0, 2 - 2 * c));
  return (
    <Scene scene={s} caption={lsay(X10_SAY, k)}>
      <svg viewBox="0 0 250 104" role="img" aria-label="দুইটা 1 লম্বা arrow; কোণ বাড়লে cos কমে, মাথার দূরত্ব বাড়ে" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={248} height={102} rx={10} fill="white" stroke="#cbd5e1" />
        <path d={`M${O.x + R} ${O.y}A${R} ${R} 0 0 0 ${O.x - R} ${O.y}`} fill="none" stroke={L_INK} strokeOpacity={0.15} strokeDasharray="3 3" />
        {d > 0.02 && <path d={`M${ux} ${O.y}L${vx} ${vy}`} stroke={L_CORAL} strokeWidth={2} strokeDasharray="3 2" />}
        <L_Arr x1={O.x} y1={O.y} x2={ux} y2={O.y} color={L_BLUE} w={2.6} />
        <L_Arr x1={O.x} y1={O.y} x2={vx} y2={vy} color={L_TEAL} w={2.6} />
        <text x={8} y={14} fontSize={8.5} fontFamily="ui-monospace, monospace" fill={L_INK}>
          {`cos θ = ${fix(c, 2)}`}
        </text>
        <text x={8} y={26} fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#be123c">
          {`‖û − v̂‖ = ${fix(d, 2)}`}
        </text>
        {k >= 4 && (
          <g className={FADE}>
            <text x={8} y={38} fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#be123c">
              {`‖û − v̂‖² = ${fix(d * d, 2)}`}
            </text>
            <text x={8} y={50} fontSize={8.5} fontFamily="ui-monospace, monospace" fill="#b45309">
              {`2 − 2cos θ = ${fix(2 - 2 * c, 2)}`}
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11a · A story scene for screen 11's setup, no task: night, a phone call.
//       ফাহিম tells সোম the day; সোম laughs that ChatGPT runs this box; then
//       the sentence with "ওটা" comes up with a question mark. Not answered.

function L_Waves({ x, y }: { x: number; y: number }) {
  return (
    <g className={FADE} fill="none" stroke="#fde68a" strokeWidth={1.4} strokeLinecap="round">
      {[6, 12, 18].map((r) => (
        <path key={r} d={`M${x - r * 0.6} ${y - r}q${r * 0.9} ${r} 0 ${r * 2}`} transform={`rotate(-90 ${x} ${y})`} />
      ))}
    </g>
  );
}

export function NightCall({}: Story) {
  const s = useScene(3, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাতে ফাহিম সোমকে ফোন করে; সোম বলে ChatGPT-র ভেতরেও এই box; তারপর একটা বাক্য, ওটা কাকে বোঝায়?">
        <Building x={4} y={LG} w={66} h={72} color="#334155" />
        <Building x={250} y={LG} w={66} h={72} color="#334155" />
        <Person who="fahim" x={96} y={LG} arm="hold" mood={k === 1 ? "happy" : "plain"} />
        <L_Name x={96} text="ফাহিম" light />
        <Person who="som" x={224} y={LG} facing={-1} arm="hold" mood={k >= 2 ? "happy" : "plain"} />
        <L_Name x={224} text="সোম" light />
        {k >= 1 && k < 3 && (
          <>
            <L_Waves x={132} y={100} />
            <L_Waves x={188} y={100} />
          </>
        )}
        {k === 1 && <Bubble x={96} y={LG - 66} lines={["পাঠাগারের পুরো", "গল্পটা শোন…"]} />}
        {k === 2 && <Bubble x={224} y={LG - 66} side="left" lines={["ChatGPT-র ভেতরেও", "তো এই box।"]} />}
        {k >= 3 && (
          <g className={FADE}>
            <rect x={30} y={30} width={260} height={24} rx={6} fill="white" />
            <text x={160} y={46} textAnchor="middle" fontSize={10} fontWeight={600} fill={L_INK}>
              বিড়ালটা দুধ খেলো কারণ <tspan fill={L_VIOLET} fontWeight={800}>ওটা</tspan>র খিদে পেয়েছিল
            </text>
            <text x={160} y={72} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fde68a">
              “ওটা” কে?
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 11½ · A figure for screen 11's explanation, no task: the toy's keys as
//       arrows on (প্রাণী-ভাব, খাবার-ভাব). "ওটা"'s question points to প্রাণী
//       and the biggest box is বিড়ালটা (6); the question swings to খাবার and
//       দুধ wins (6).

const X11_O = { x: 20, y: 100 };
const X11_SC = 24;
const X11_TONE = [L_BLUE, L_TEAL, "#64748b"];
const X11_SAY = [
  "প্রতিটা শব্দের চাবি, একটা arrow: (প্রাণী-ভাব, খাবার-ভাব)।",
  "খিদে পায় প্রাণীর। “ওটা”-র প্রশ্ন তাক করা প্রাণীর দিকে।",
  "box সবচেয়ে বড় বিড়ালটার সাথে, 6। “ওটা” মানে বিড়াল।",
  "টাটকা হয় খাবার। প্রশ্ন ঘুরে গেল খাবারের দিকে।",
  "এবার box সবচেয়ে বড় দুধের সাথে। জিতলো দুধ।",
];

export function QueryKeys() {
  const s = useScene(4, [600, 1800, 2000, 1800]);
  const k = s.k;
  const round = k >= 3 ? 1 : 0;
  const q = ROUNDS[round].q;
  const [qx, qy] = useTween(q, 1100);
  const { x: ox, y: oy } = X11_O;
  const scored = k === 2 || k >= 4;
  const scores = WORDS.map((w) => dot(q, w.key));
  const win = ROUNDS[round].ans;
  return (
    <Scene scene={s} caption={lsay(X11_SAY, k)}>
      <div className="mx-auto flex w-full max-w-xs items-center gap-3">
        <svg viewBox="0 0 120 110" role="img" aria-label="শব্দের চাবি arrow; ওটার প্রশ্ন প্রথমে প্রাণীর দিকে, বিড়ালটা জেতে; পরে খাবারের দিকে, দুধ জেতে" className="block h-auto w-full max-w-[9rem] shrink-0">
          <rect x={1} y={1} width={118} height={108} rx={8} fill="white" stroke="#cbd5e1" />
          <path d={`M${ox} ${oy}H116M${ox} ${oy}V6`} stroke={L_INK} strokeOpacity={0.35} />
          <text x={116} y={oy + 8} textAnchor="end" fontSize={6.5} fill="#475569">
            প্রাণী
          </text>
          <text x={ox + 3} y={12} fontSize={6.5} fill="#475569">
            খাবার
          </text>
          {WORDS.map((w, i) => (
            <L_Arr key={w.w} x1={ox} y1={oy} x2={ox + w.key[0] * X11_SC} y2={oy - w.key[1] * X11_SC} color={X11_TONE[i]} w={scored && i === win ? 3.2 : 2} op={scored && i !== win ? 0.4 : 1} />
          ))}
          {WORDS.map((w, i) => (
            <text key={`t${w.w}`} x={ox + w.key[0] * X11_SC + (i === 1 ? 5 : 2)} y={oy - w.key[1] * X11_SC + (i === 1 ? 6 : -4)} fontSize={6.5} fontWeight={700} fill={X11_TONE[i]}>
              {w.w}
            </text>
          ))}
          {k >= 1 && <L_Arr x1={ox} y1={oy} x2={ox + qx * X11_SC} y2={oy - qy * X11_SC} color={L_VIOLET} w={2.6} dashed />}
          {k >= 1 && (
            <text x={ox + qx * X11_SC + (round ? -3 : 1)} y={oy - qy * X11_SC + (round ? 0 : -5)} textAnchor={round ? "end" : "start"} fontSize={6.5} fontWeight={800} fill={L_VIOLET}>
              ওটা
            </text>
          )}
        </svg>
        <div className="grid gap-1 text-sm">
          {k >= 1 && (
            <div className={`${FADE} text-xs text-cat-violet`}>
              “ওটা”-র প্রশ্ন <span className="font-mono">{tupN(q)}</span>
            </div>
          )}
          {WORDS.map((w, i) => (
            <div key={w.w} className={`flex items-baseline justify-between gap-3 rounded-md px-1 ${scored && i === win ? "bg-accent/15" : ""}`}>
              <span style={{ color: X11_TONE[i] }}>{w.w}</span>
              <b key={`${round}${scored}`} className={`${POP} inline-block font-mono`}>
                {scored ? scores[i] : ""}
              </b>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 12½ · A figure for screen 12's first paragraph, no task: the sentence's
//       words, each with a long strip of learned numbers; ওটার runs the box
//       with every other word, then every word with every word; the name
//       lands last: attention, and in full, scaled dot-product attention.

const X12_WORDS = ["বিড়ালটা", "দুধ", "খেলো", "কারণ", "ওটার", "খিদে", "পেয়েছিল"];
const X12_X = X12_WORDS.map((_, i) => 26 + i * 41);
const X12_SAY = [
  "আসল model-এ প্রতিটা শব্দের ঘর শত শত, সংখ্যাগুলো machine নিজেই শেখে।",
  "“ওটার” box চালায় বাকি সব শব্দের সাথে।",
  "শুধু “ওটার” না, প্রতিটা শব্দই বাকি সবার সাথে।",
  "এই কৌশলের নাম attention।",
  "পুরো নাম scaled dot-product attention। ভেতরে সত্যিই dot product।",
];
const x12arc = (i: number, j: number) => {
  const a = X12_X[i];
  const b = X12_X[j];
  return `M${a} 72Q${(a + b) / 2} ${72 - Math.abs(a - b) * 0.52} ${b} 72`;
};

export function AllPairs() {
  const s = useScene(4, [600, 1800, 1800, 1600]);
  const k = s.k;
  const pairs: [number, number][] = [];
  if (k >= 2) for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) pairs.push([i, j]);
  return (
    <Scene scene={s} caption={lsay(X12_SAY, k)}>
      <svg viewBox="0 0 300 116" role="img" aria-label="বাক্যের প্রতিটা শব্দ বাকি সব শব্দের সাথে box চালায়; নাম attention" className="mx-auto block h-auto w-full max-w-[20rem]">
        {pairs.map(([i, j]) => (
          <path key={`${i}${j}`} d={x12arc(i, j)} fill="none" stroke={L_BLUE} strokeOpacity={0.35} strokeWidth={1} className={FADE} />
        ))}
        {k === 1 &&
          X12_X.map((_, j) =>
            j === 4 ? null : <path key={`o${j}`} d={x12arc(4, j)} fill="none" stroke={L_VIOLET} strokeWidth={1.6} className={FADE} />,
          )}
        {X12_WORDS.map((w, i) => (
          <g key={w}>
            <text x={X12_X[i]} y={84} textAnchor="middle" fontSize={10} fontWeight={i === 4 ? 800 : 600} fill={i === 4 && k === 1 ? L_VIOLET : L_INK}>
              {w}
            </text>
            {Array.from({ length: 8 }, (_, c) => (
              <rect key={c} x={X12_X[i] - 14 + c * 3.6} y={89} width={2.8} height={6} fill={["#93c5fd", "#fcd34d", "#86efac", "#f9a8d4"][(i + c) % 4]} />
            ))}
          </g>
        ))}
        {k >= 3 && (
          <text key={k >= 4 ? "full" : "short"} x={150} y={111} textAnchor="middle" fontSize={10} fontWeight={800} fill={L_INK} className={FADE}>
            {k >= 4 ? (
              <>
                scaled <tspan fill="#b45309">dot-product</tspan> attention
              </>
            ) : (
              "attention"
            )}
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 12¾ · A figure for screen 12's second paragraph, no task: 4.1's দালাল card
//       as a neuron. The card is w, the cow's list is x, the box gives
//       w · x = 85,000; then + a number, then a small bend; then many of them.

const X12B_SAY = [
  "৪.১-এর দালালের card। এটাই w।",
  "গাইয়ের list x-এর সাথে box: w · x = 85,000।",
  "তার সাথে একটা সংখ্যা যোগ।",
  "তারপর ছোট্ট একটা বাঁক। এই পুরোটাই একটা neuron।",
  "আজকের AI-এর বড় একটা অংশ: এই এক box, কোটি কোটিবার।",
];

function X12B_Bend() {
  return (
    <svg viewBox="0 0 24 16" aria-hidden="true" className="inline-block h-4 w-6">
      <path d="M2 13H10Q14 13 16 8T22 3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function DalalNeuron() {
  const s = useScene(4, [600, 2200, 1500, 2000]);
  const k = s.k;
  const unit = (key: string, cls: string, body: ReactNode) => (
    <span key={key} className={`${POP} inline-flex items-center rounded-lg px-2 py-0.5 ${cls}`}>
      {body}
    </span>
  );
  const one = (
    <div className="flex flex-wrap items-center justify-center gap-1 text-sm">
      {unit("wx", "bg-cat-amber/15 font-mono", k >= 1 ? "w · x" : "w")}
      {k >= 2 && <span className="text-muted">→</span>}
      {k >= 2 && unit("b", "bg-cat-blue/10 font-mono", "+ b")}
      {k >= 3 && <span className="text-muted">→</span>}
      {k >= 3 && unit("bend", "bg-cat-violet/10 text-cat-violet", <X12B_Bend />)}
    </div>
  );
  return (
    <Scene scene={s} caption={lsay(X12B_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs gap-1.5">
        <div className="flex flex-wrap items-baseline justify-center gap-x-2 text-xs text-muted">
          <span>
            w = <span className="font-mono text-foreground">(400, 4000, −5000)</span>
          </span>
          {k >= 1 && (
            <span className={FADE}>
              x = <span className="font-mono text-foreground">(200, 5, 3)</span>
            </span>
          )}
        </div>
        {one}
        {k === 1 && <div className={`${FADE} text-center font-mono text-sm font-semibold`}>85,000</div>}
        {k >= 3 && <div className={`${FADE} text-center text-xs font-semibold text-cat-violet`}>neuron</div>}
        {k >= 4 && (
          <div className={`${FADE} flex justify-center gap-1`}>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className="inline-block size-3 rounded-full bg-cat-amber/40" />
            ))}
            <span className="text-xs text-muted">…</span>
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 13a · A story scene for screen 13's setup, no task: closing time at the
//       পাঠাগার. আপা hands ফাহিম a list: "কোন কাজে কোন মাপ, বলে যা তো।"
//       ফাহিম wonders: box, cosine, না দূরত্ব? No job is sorted.

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
      <Stage backdrop="evening" label="পাঠাগার বন্ধের সময় আপা ফাহিমের হাতে একটা তালিকা দেন: কোন কাজে কোন মাপ, বলে যা তো">
        <Tree x={30} y={LG} s={0.9} />
        <Building x={176} y={LG} w={132} h={96} color="#e7d7c1" label="পাঠাগার" />
        <rect x={272} y={LG - 44} width={24} height={44} fill="#78350f" />
        <Person who="ammu" x={210} y={LG} facing={-1} arm={k >= 1 && k < 3 ? "hold" : "down"} mood={k === 2 ? "smug" : "plain"} />
        <L_Name x={210} text="আপা" />
        <Person who="fahim" x={140} y={LG} arm={k >= 3 ? "hold" : "down"} mood={k >= 3 ? "puzzled" : "plain"} label />
        {k >= 1 && (
          <L_Carry x={k >= 3 ? 159 : 191} y={LG - 36} ms={900}>
            <L_Paper />
          </L_Carry>
        )}
        {k === 2 && <Bubble x={210} y={LG - 66} lines={["কোন কাজে কোন মাপ,", "বলে যা তো।"]} />}
        {k >= 3 && <Bubble x={140} y={LG - 66} tone="think" lines={["box, cosine,", "না দূরত্ব?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 13½ · A figure for screen 13's explanation, no task: three questions, three
//       rulers. কত বড়: two arrows one way, one longer (box). কী ধরনের: two
//       directions and the angle between (cosine). কে কোথায়: two spots and
//       the gap (দূরত্ব).

const X13_ITEMS = [
  { q: "কত বড়?", tool: "box" },
  { q: "কী ধরনের?", tool: "cosine" },
  { q: "কে কোথায়?", tool: "দূরত্ব" },
];
const X13_SAY = [
  "তিনটা মাপ, তিনটা প্রশ্ন।",
  "কত বড়, মানে lengthও খবর হলে box।",
  "কী ধরনের, মানে শুধু দিক চাইলে cosine।",
  "কে কোথায় দাঁড়িয়ে, মানে জায়গাটাই প্রশ্ন হলে দূরত্ব।",
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
// 15a · A story scene for screen 15's first paragraph, no task: আপা keeps
//       machine খ for finding fish, and machine ক stays too, for price, total
//       and popularity.

export function KeepBoth({}: Story) {
  const s = useScene(3, [600, 2200, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="আপা মাছ খোঁজার জন্য machine খ রাখেন; machine ক-ও থাকে দাম, মোট আর জনপ্রিয়তার জন্য">
        <L_Shelf x={10} y={LG} w={80} />
        <L_Desk x={150} y={LG} lit={k >= 1 ? 1 : undefined} />
        <Person who="ammu" x={262} y={LG} facing={-1} arm={k >= 1 ? "point" : "down"} mood={k >= 1 ? "happy" : "plain"} />
        <L_Name x={262} text="আপা" />
        {k === 1 && <Bubble x={262} y={LG - 66} side="left" lines={["মাছ খুঁজতে", "machine খ।"]} />}
        {k >= 2 && <L_Note x={222} y={50} lines={["মাছ খোঁজা"]} tone="#15803d" />}
        {k >= 3 && <L_Note x={140} y={50} lines={["দাম, মোট, জনপ্রিয়তা"]} tone={L_AMBER} />}
        {k >= 2 && <path d="M222 58L205 84" stroke="#15803d" strokeWidth={1} className={FADE} />}
        {k >= 3 && <path d="M160 58L174 84" stroke={L_AMBER} strokeWidth={1} className={FADE} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 15b · A story scene for screen 15's second paragraph, no task: the bus home.
//       ফাহিম writes the formula in his খাতা; first as the strange marks it
//       was at the start of the series, then piece by piece, known.

function L_Bus() {
  return (
    <g>
      <rect x={0} y={-58} width={150} height={50} rx={8} fill="#16a34a" />
      <rect x={0} y={-24} width={150} height={6} fill="#facc15" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={10 + i * 34} y={-52} width={26} height={20} rx={2} fill="#e0f2fe" stroke="#14532d" strokeWidth={0.8} />
      ))}
      <circle cx={30} cy={-6} r={8} fill="#1f2937" />
      <circle cx={120} cy={-6} r={8} fill="#1f2937" />
    </g>
  );
}

const X15B_PIECES = [
  { x: 222, y: 50, t: "cos θ =" },
  { x: 282, y: 42, t: "u · v" },
  { x: 282, y: 64, t: "‖u‖ ‖v‖" },
];

export function BusHome({}: Story) {
  const s = useScene(3, [600, 1600, 2200]);
  const k = s.k;
  const bx = k >= 1 ? 12 : -170;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="ফেরার বাসে ফাহিম খাতায় সূত্রটা লেখে; শুরুতে অচেনা চিহ্ন, এখন প্রতিটা টুকরা চেনা">
        <L_Carry x={bx} y={LG} ms={1400}>
          <L_Bus />
          <g>
            <circle cx={125} cy={-43} r={6.5} fill="#e0ac7e" />
            <path d="M118.5 -44q0 -8 6.5 -8t6.5 8q-4 -4 -13 0Z" fill="#1f1a17" />
            <rect x={119} y={-37} width={12} height={5} rx={1} fill="#2563eb" />
          </g>
        </L_Carry>
        {k >= 2 && (
          <g className={FADE}>
            <circle cx={172} cy={78} r={2.5} fill="white" stroke={L_INK} strokeOpacity={0.35} />
            <circle cx={180} cy={70} r={3.5} fill="white" stroke={L_INK} strokeOpacity={0.35} />
            <rect x={188} y={22} width={124} height={58} rx={4} fill="white" stroke={L_INK} strokeOpacity={0.35} />
            {[34, 46, 58, 70].map((y) => (
              <path key={y} d={`M192 ${y}H308`} stroke="#bfdbfe" strokeWidth={0.8} />
            ))}
            <path d="M258 53H306" stroke={L_INK} strokeWidth={1.2} />
            {X15B_PIECES.map((p) =>
              k >= 3 ? (
                <text key={p.t} x={p.x} y={p.y + 3} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8" className={POP}>
                  {p.t}
                </text>
              ) : (
                <text key={p.t} x={p.x} y={p.y + 3} textAnchor="middle" fontSize={10} fontWeight={700} fill="#94a3b8">
                  ? ? ?
                </text>
              ),
            )}
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 15½ · A figure for screen 15's explanation, no task: Module 1 in one run.
//       Titanic and Mr. Bean become lists (Article 1), arrows (2), get their
//       lengths (3), the angle between (4), and last the lengths are divided
//       away so only direction is left: cos θ = 0.59.

const X15_F = [FILMS[0], FILMS[1]];
const X15_O = { x: 126, y: 108 };
const X15_SC = 19;
const X15_R = 70;
const X15_COS = cosAB(X15_F[0].v, X15_F[1].v);
const X15_SAY = [
  "দুইটা জিনিস: Titanic আর Mr. Bean।",
  "Article 1: জিনিসকে সংখ্যার list বানানো।",
  "Article 2: সেই list-কে arrow হিসেবে দেখা।",
  "Article 3: arrow-এর length মাপা।",
  "Article 4: দুইটা arrow কতটা একই দিকে।",
  `length ভাগ করে ফেলে দিলে থাকে শুধু দিক: cos θ = ${fix(X15_COS, 2)}।`,
];

export function FourArticles() {
  const s = useScene(5, [600, 1600, 1600, 1600, 1800]);
  const k = s.k;
  const [p] = useTween([k >= 5 ? 1 : 0], 1200);
  const { x: ox, y: oy } = X15_O;
  const tip = (v: readonly number[]) => {
    const a = Math.atan2(v[1], v[0]);
    const tx = v[0] * X15_SC;
    const ty = v[1] * X15_SC;
    return [ox + tx + (X15_R * Math.cos(a) - tx) * p, oy - (ty + (X15_R * Math.sin(a) - ty) * p)] as const;
  };
  const a0 = Math.atan2(X15_F[0].v[1], X15_F[0].v[0]);
  const a1 = Math.atan2(X15_F[1].v[1], X15_F[1].v[0]);
  return (
    <Scene scene={s} caption={lsay(X15_SAY, k)}>
      <svg viewBox="0 0 240 116" role="img" aria-label="Titanic আর Mr. Bean: list, arrow, length, কোণ, শেষে শুধু দিক" className="mx-auto block h-auto w-full max-w-[18rem]">
        {X15_F.map((f, i) => (
          <g key={f.name}>
            <text x={6} y={22 + i * 34} fontSize={9} fontWeight={700} fill={X6_FILM_TONE[i]}>
              {f.name}
            </text>
            {k >= 1 && (
              <text x={6} y={34 + i * 34} fontSize={8.5} fontFamily="ui-monospace, monospace" fill={L_INK} className={FADE}>
                {tupN(f.v)}
                {k >= 3 && k < 5 ? `  length ${fix(len(f.v), 2)}` : ""}
              </text>
            )}
          </g>
        ))}
        {k >= 2 && (
          <g className={FADE}>
            <rect x={112} y={4} width={124} height={110} rx={8} fill="white" stroke="#cbd5e1" />
            <path d={`M${ox} ${oy}H232M${ox} ${oy}V10`} stroke={L_INK} strokeOpacity={0.3} />
            {k >= 5 && <path d={`M${ox + X15_R} ${oy}A${X15_R} ${X15_R} 0 0 0 ${ox} ${oy - X15_R}`} fill="none" stroke={L_INK} strokeOpacity={0.2} strokeDasharray="3 3" />}
            {X15_F.map((f, i) => {
              const [x2, y2] = tip(f.v);
              return <L_Arr key={f.name} x1={ox} y1={oy} x2={x2} y2={y2} color={X6_FILM_TONE[i]} w={k === 3 ? 3.4 : 2.4} />;
            })}
            {k >= 4 && (
              <path
                d={`M${ox + 30 * Math.cos(a0)} ${oy - 30 * Math.sin(a0)}A30 30 0 0 0 ${ox + 30 * Math.cos(a1)} ${oy - 30 * Math.sin(a1)}`}
                fill="none"
                stroke={L_AMBER}
                strokeWidth={1.8}
                className={FADE}
              />
            )}
            {k >= 4 && (
              <text x={ox + 34} y={oy - 36} fontSize={9} fontFamily="ui-monospace, monospace" fill="#b45309" className={FADE}>
                θ
              </text>
            )}
          </g>
        )}
        {k >= 5 && (
          <text x={6} y={100} fontSize={9.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#b45309" className={FADE}>
            {`cos θ = ${fix(X15_COS, 2)}`}
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 15¾ · A figure for the finale's notation side quest, no task: 4.1's
//       (1, 2) and (3, 4), and the four ways books write the same box. Each
//       spelling lands on the same 11.

const X15S_SPELL = ["u · v", "Σ uᵢvᵢ", "uᵀv", "⟨u, v⟩"];
const X15S_SAY = [
  "৪.১-এর দুইটা list। ঘরে ঘরে গুণ করে যোগ: 11।",
  "u · v: dot দিয়ে লেখা।",
  "Σ uᵢvᵢ: লুপ হিসেবে লেখা।",
  "uᵀv: paper-এর প্রিয় লেখা।",
  "⟨u, v⟩: ভারী বইয়ে inner product। চার রকম লেখা, একই 11।",
];

export function FourSpellings() {
  const s = useScene(4, [600, 1500, 1500, 1500]);
  const k = s.k;
  return (
    <Scene scene={s} caption={lsay(X15S_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs gap-1.5 font-mono text-sm">
        <div className="text-center">
          u = (1, 2)&nbsp;&nbsp; v = (3, 4)
          <div className="text-muted">1 × 3 + 2 × 4 = 11</div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {X15S_SPELL.map((t, i) =>
            k >= i + 1 ? (
              <div key={t} className={`${POP} flex justify-between rounded-lg px-2 py-0.5 ${k === i + 1 ? "bg-cat-amber/15" : "bg-foreground/[0.04]"}`}>
                <span>{t}</span>
                <b>= 11</b>
              </div>
            ) : (
              <div key={t} className="rounded-lg border border-dashed border-border px-2 py-0.5 text-transparent">
                .
              </div>
            ),
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 16½ · A figure for screen 16's first half, no task: 3.3's recipe as
//       arrows. Two ingredients u and v; every mix of them lands on a grid of
//       spots (span); a third, w = u + v, lands on a spot they already reach
//       (বাড়তি); u and v alone are the fewest that reach everything (basis).

const X16_O = { x: 60, y: 92 };
const X16_U = [34, -10] as const;
const X16_V = [12, -30] as const;
const X16_DOTS = (() => {
  const out: [number, number][] = [];
  for (let a = -4; a <= 10; a++)
    for (let b = -4; b <= 8; b++) {
      const x = X16_O.x + (a / 2) * X16_U[0] + (b / 2) * X16_V[0];
      const y = X16_O.y + (a / 2) * X16_U[1] + (b / 2) * X16_V[1];
      if (x > 8 && x < 232 && y > 8 && y < 112) out.push([x, y]);
    }
  return out;
})();
const X16_SAY = [
  "দুইটা উপকরণ, u আর v।",
  "মিশিয়ে কোথায় কোথায় পৌঁছানো যায়? এই সবটার নাম span।",
  "তৃতীয় উপকরণ w = u + v। বাকিরাই বানায়, তাই বাড়তি। এই প্রশ্নের নাম independence।",
  "সবচেয়ে কম কয়টা লাগে? এখানে দুইটা, u আর v। এর নাম basis।",
];

export function SpanRecipe() {
  const s = useScene(3, [600, 1800, 2600]);
  const k = s.k;
  const { x: ox, y: oy } = X16_O;
  return (
    <Scene scene={s} caption={lsay(X16_SAY, k)}>
      <svg viewBox="0 0 240 120" role="img" aria-label="u আর v মিশিয়ে একগাদা জায়গা; w = u + v বাড়তি; u আর v-ই basis" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={238} height={118} rx={10} fill="white" stroke="#cbd5e1" />
        {k >= 1 && X16_DOTS.map(([x, y]) => <circle key={`${x},${y}`} cx={x} cy={y} r={1.4} fill={L_INK} opacity={0.3} className={FADE} />)}
        {k === 2 && (
          <g className={FADE}>
            <path d={`M${ox + X16_U[0]} ${oy + X16_U[1]}l${X16_V[0]} ${X16_V[1]}`} stroke={L_TEAL} strokeWidth={1.4} strokeDasharray="3 2" />
            <L_Arr x1={ox} y1={oy} x2={ox + X16_U[0] + X16_V[0]} y2={oy + X16_U[1] + X16_V[1]} color={L_AMBER} w={2.6} dashed />
            <text x={ox + X16_U[0] + X16_V[0] + 4} y={oy + X16_U[1] + X16_V[1] - 3} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#b45309">
              w
            </text>
          </g>
        )}
        <L_Arr x1={ox} y1={oy} x2={ox + X16_U[0]} y2={oy + X16_U[1]} color={L_BLUE} w={k >= 3 ? 3.2 : 2.4} />
        <L_Arr x1={ox} y1={oy} x2={ox + X16_V[0]} y2={oy + X16_V[1]} color={L_TEAL} w={k >= 3 ? 3.2 : 2.4} />
        <text x={ox + X16_U[0] + 3} y={oy + X16_U[1] + 10} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8">
          u
        </text>
        <text x={ox + X16_V[0] - 9} y={oy + X16_V[1] + 2} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#0f766e">
          v
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 16¾ · A figure for screen 16's second half, no task: one list against x is
//       one box, one number; stack many lists and it's a matrix, many boxes at
//       once. Last, the open question: a cloud of data with two slots that
//       nearly lies on one line. How many directions does it need? No answer.

const X16B_ROWS = [0, 1, 2, 3];
const X16B_CLOUD = [
  [18, 92], [30, 84], [42, 79], [52, 70], [64, 66], [74, 57], [88, 52], [98, 43], [110, 38], [122, 30], [36, 76], [80, 61], [104, 46], [60, 72],
] as const;
const X16B_SAY = [
  "একটা list আর x: একটা box, একটা সংখ্যা।",
  "অনেকগুলো list একসাথে সাজালে matrix।",
  "matrix মানে একসাথে একগাদা box, একগাদা সংখ্যা।",
  "আর আমার data-র আসলে কয়টা দিক লাগে?",
];

export function MatrixBoxes() {
  const s = useScene(3, [600, 1600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={lsay(X16B_SAY, k)}>
      {k < 3 ? (
        <div className="mx-auto flex w-fit items-center gap-2">
          <div className={`grid gap-1 rounded-lg p-1 ${k >= 1 ? "ring-2 ring-cat-blue/40" : ""}`}>
            {X16B_ROWS.filter((r) => r === 0 || k >= 1).map((r) => (
              <div key={r} className={`${FADE} flex gap-0.5`}>
                {[0, 1, 2].map((c) => (
                  <span key={c} className="inline-block size-4 rounded-sm bg-cat-blue/30" />
                ))}
              </div>
            ))}
          </div>
          <span className="font-mono text-muted">·</span>
          <div className="grid gap-0.5">
            {[0, 1, 2].map((c) => (
              <span key={c} className="inline-block size-4 rounded-sm bg-cat-amber/40" />
            ))}
          </div>
          <span className="font-mono text-muted">=</span>
          <div className="grid gap-1 p-1">
            {X16B_ROWS.filter((r) => r === 0 || k >= 2).map((r) => (
              <span key={r} className={`${POP} inline-block size-4 rounded-full bg-accent/60`} />
            ))}
          </div>
        </div>
      ) : (
        <svg viewBox="0 0 140 104" role="img" aria-label="দুই ঘরের data, প্রায় একটা লাইনে; কয়টা দিক লাগে?" className={`${FADE} mx-auto block h-auto w-full max-w-[10rem]`}>
          <rect x={1} y={1} width={138} height={102} rx={8} fill="white" stroke="#cbd5e1" />
          <path d="M10 96H134M10 96V6" stroke={L_INK} strokeOpacity={0.3} />
          {X16B_CLOUD.map(([x, y]) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r={2.6} fill={L_BLUE} opacity={0.7} />
          ))}
          <text x={126} y={82} textAnchor="middle" fontSize={20} fontWeight={800} fill={L_CORAL}>
            ?
          </text>
        </svg>
      )}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  TwoMachines: { start: {}, bet: { bet: 1 } },
  DotRanking: { start: {}, all: { ran: ["A", "B", "C"] } },
  CosRanking: { start: {}, all: { ran: ["A", "B", "C"] } },
  LoudForBoth: { start: {}, box: { rule: 0, seen: [0] }, cos: { rule: 1, seen: [0, 1] } },
  LengthIsNews: { start: {}, miss: { done: 2, miss: 1 }, all: { done: 6 } },
  OneRanking: { start: {}, all: { seen: [0, 1, 2] } },
  WhoIsIt: { start: {}, one: { ran: true }, two: { round: 1, ran: true } },
  PickTool: { start: {}, miss: { done: 2, miss: 1 }, all: { done: 5 } },
  BoxBet: { start: {}, bet: { bet: 0 } },
  Finale: { start: {}, some: { open: [4, 3] }, all: { open: [0, 1, 2, 3, 4] } },
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
  MillionBooks: { start: { k: 0 }, steps: { k: 1 }, ask: { k: 2 }, fix: { k: 3 }, done: {} },
  HatFormula: { start: { k: 0 }, hats: { k: 1 }, one: { k: 2 }, done: {} },
  StoreOnce: { start: { k: 0 }, stamp: { k: 1 }, search: { k: 2 }, done: {} },
  ChordCos: { start: { k: 0 }, sixty: { k: 1 }, right: { k: 2 }, done: {} },
  NightCall: { start: { k: 0 }, tell: { k: 1 }, som: { k: 2 }, done: {} },
  QueryKeys: { start: { k: 0 }, q: { k: 1 }, cat: { k: 2 }, swing: { k: 3 }, done: {} },
  AllPairs: { start: { k: 0 }, ota: { k: 1 }, all: { k: 2 }, name: { k: 3 }, done: {} },
  DalalNeuron: { start: { k: 0 }, box: { k: 1 }, bend: { k: 3 }, done: {} },
  ListHandover: { start: { k: 0 }, hand: { k: 1 }, say: { k: 2 }, done: {} },
  ThreeQuestions: { start: { k: 0 }, box: { k: 1 }, done: {} },
  KeepBoth: { start: { k: 0 }, say: { k: 1 }, done: {} },
  BusHome: { start: { k: 0 }, marks: { k: 2 }, done: {} },
  FourArticles: { start: { k: 0 }, list: { k: 1 }, len: { k: 3 }, angle: { k: 4 }, done: {} },
  FourSpellings: { start: { k: 0 }, two: { k: 2 }, done: {} },
  SpanRecipe: { start: { k: 0 }, span: { k: 1 }, extra: { k: 2 }, done: {} },
  MatrixBoxes: { start: { k: 0 }, matrix: { k: 2 }, done: {} },
};
