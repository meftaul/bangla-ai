"use client";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Ticks, pill, useSeed, type Fixtures } from "@/components/journey/kit";
import { bn } from "./figure-kit";
import { dot, tupN } from "./haat-journey";

// Screens for "Math for AI 4.6 — পাঠাগারের খোঁজ, dot না cosine", told as a Journey.
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
    pass("বাজি সিল হলো। দুইটা machine একই বই, একই শব্দ দেখছে। তাহলে গরমিলটা কোথায়, নিজের হাতে চালিয়ে দেখি।");
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
    if (next.length === BOOKS.length) pass("বাক্স বলছে নৌকা-ধানের বই মাছের চিঠির চেয়ে বেশি মানানসই, 3 বনাম 2। বইটা মাছ নিয়ে না, শুধু লম্বা।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border border-border bg-surface px-3 py-1 text-center text-sm">
        প্রশ্ন “মাছ” = <b className="font-mono">(1, 0, 0)</b>
        <div className="text-xs text-muted">ঘরগুলো (মাছ, নৌকা, ধান)-এর গোনা</div>
      </div>
      <div className="mt-3 grid gap-2">
        {BOOKS.map((b) => (
          <BookRow key={b.id} name={b.name} v={b.v} score={String(dot(QUERY, b.v))} on={ran.includes(b.id)} onClick={() => run(b.id)} label="বাক্সে দিন" />
        ))}
      </div>
      {all && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          ক্রম: <b>মোটা বই</b> 20, <b className="text-cat-coral">নৌকা-ধান</b> 3, <b>চিঠি</b> 2
        </div>
      )}
      <Task done={all}>প্রশ্নটা প্রতিটা বইয়ের সাথে বাক্সে দিন।</Task>
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
    if (next.length === BOOKS.length) pass("দৈর্ঘ্য ভাগ করতেই দুইটা মাছের বই প্রায় নিখুঁত মিল, আর নৌকা-ধানের বই নেমে গেল সবার নিচে।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border border-border bg-surface px-3 py-1 text-center text-sm">
        প্রশ্নের দৈর্ঘ্য <b className="font-mono">1</b>
      </div>
      <div className="mt-3 grid gap-2">
        {BOOKS.map((b) => (
          <div key={b.id}>
            <BookRow name={b.name} v={b.v} score={fix(cosQ(b.v), 3)} on={ran.includes(b.id)} onClick={() => run(b.id)} label="দৈর্ঘ্য দিয়ে ভাগ" />
            {ran.includes(b.id) && (
              <div className={`${FADE} mt-0.5 text-right font-mono text-xs text-muted`}>
                {dot(QUERY, b.v)} ÷ (1 × {fix(len(b.v), 2)})
              </div>
            )}
          </div>
        ))}
      </div>
      <Task done={all}>প্রতিটা বইয়ের বাক্সের নম্বরকে দুইটা দৈর্ঘ্য দিয়ে ভাগ করুন।</Task>
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
    if (next.length === 2) pass("বাক্সে হইচই জেতে দুইজনের কাছেই, মামা আর মামী দুইজনের। যে ছবি সবার কাছে জেতে, সে মানানসই বলে জেতে না, লম্বা বলে জেতে।");
  };

  return (
    <>
      <div className="mx-auto mt-2 w-fit rounded-xl border-2 border-cat-coral/40 bg-cat-coral/5 px-3 py-1 text-center text-sm">
        নতুন ছবি <b>হইচই</b> <span className="font-mono">(5, 5)</span>: কান্নাও বেশি, হাসিও বেশি
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {["বাক্স", "cosine"].map((r, i) => (
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
          ["বাক্স দিয়ে", seen.includes(0)],
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
  { t: "ভ্যান কাদা থেকে উঠবে কি না, রাস্তা বরাবর মোট ঠেলা কত", bin: 0 },
  { t: "দুইটা শব্দের মানে কতটা কাছাকাছি", bin: 1 },
  { t: "“এরকম আরো ছবি দেখাও”, শুধু ছবির ধরন দেখে", bin: 1 },
  { t: "যে ছবি সবাই দেখে, সেটা সবাইকে একটু বেশি দেখানো", bin: 0 },
];
const LENGTH_BINS = [
  { name: "বাক্স", sub: "দৈর্ঘ্যও আসল খবর" },
  { name: "cosine", sub: "শুধু দিক, দৈর্ঘ্য ঝামেলা" },
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
    if (done + 1 === LENGTH_JOBS.length) pass("প্রশ্ন একটাই: দৈর্ঘ্য কি এখানে আসল খবর? গরুর দাম আর মোট ঠেলায় হ্যাঁ, তাই বাক্স। শুধু “কী ধরনের জিনিস” জানতে চাইলে না, তাই cosine।");
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
  { name: "শুধু বাক্স", score: (u: number[]) => dot(QUERY, u), low: false },
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
    if (next.length === RULERS.length) pass("একবার normalise, তারপর শুধু বাক্স। বাক্স, cosine আর দূরত্ব, তিনটা মাপ একই ক্রম দেয়।");
  };

  return (
    <>
      <div className="mx-auto mt-2 grid max-w-sm gap-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm">
        <div className="text-xs text-muted">তাকে তোলার সময়েই প্রতিটা card 1 লম্বা করে রাখা</div>
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
    if (round === 1) pass("“ওটা”-র প্রশ্নের সাথে প্রতিটা শব্দের চাবি বাক্সে দিলে যে সবচেয়ে বড় নম্বর পায়, “ওটা” তার দিকেই তাকায়। বাক্য বদলালে প্রশ্ন বদলায়, উত্তরও বদলায়।");
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
            প্রশ্নটা প্রতিটা চাবির সাথে বাক্সে দিন
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
      <Task done={round === 1 && ran}>“ওটা”-র প্রশ্ন প্রতিটা শব্দের সাথে বাক্সে দিন, তারপর বাক্যটা বদলে আবার দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · এবার আপনার পালা. Five fresh jobs into box / cosine / distance. Wrong
//     tries bounce.

const TOOL_JOBS = [
  { t: "Chatbot-কে প্রশ্ন করলে, কোন অনুচ্ছেদের মানে প্রশ্নের সবচেয়ে কাছে", bin: 1 },
  { t: "দালালের knob দিয়ে একটা ছাগলের দাম", bin: 0 },
  { t: "ডাক্তার আপার যমজ খেলা, standardise করার পর কে কার সবচেয়ে কাছে দাঁড়িয়ে", bin: 2 },
  { t: "লম্বা-ছোট হাজারটা খবরের মধ্যে “বন্যা” নিয়ে খবর খোঁজা", bin: 1 },
  { t: "ফাহিমের final number, নম্বর আর weight মিলিয়ে", bin: 0 },
];
const TOOLS = ["বাক্স", "cosine", "দূরত্ব"];

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
    if (done + 1 === TOOL_JOBS.length) pass("দৈর্ঘ্য খবর হলে বাক্স, শুধু দিক চাইলে cosine, আর “কে কোথায় দাঁড়িয়ে” জানতে চাইলে দূরত্ব।");
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
        {miss !== null && !all && <Nope key={miss}>উঁহু। এখানে কি দৈর্ঘ্যটাই খবর, নাকি শুধু দিক, নাকি জায়গাটা?</Nope>}
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
// 9 · Module 1, read out loud. The formula from the start of the series laid
//     out as a fraction; each piece opens on a tap to say what it is and where
//     it was learned. No gate: this is the send-off.

const PIECES = [
  { sym: "u, v", say: "দুইটা জিনিস, সংখ্যার list বানানো", where: "Article 1, representation" },
  { sym: "arrow", say: "আবার সেই u আর v, এবার arrow হিসেবে: একটা দিক আর একটা দৈর্ঘ্য", where: "Article 2, vector-এর দুই চেহারা" },
  { sym: "‖u‖ ‖v‖", say: "তাদের দৈর্ঘ্য: বর্গ, যোগ, root", where: "Article 3, ফিতা" },
  { sym: "u · v", say: "ঘরে ঘরে গুণ করে যোগ, মানে দৈর্ঘ্য × দৈর্ঘ্য × কতটা একই দিকে", where: "৪.১ থেকে ৪.৩, হাট, ভ্যান, ছাদ" },
  { sym: "cos θ", say: "শুধু কতটা একই দিকে, −1 থেকে 1", where: "৪.৪, TV-র সামনে" },
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
          দুইটা জিনিস কতটা এক রকম, জানতে হলে তাদের arrow বানাও, দেখো কতটা একই দিকে তাক করা, আর দৈর্ঘ্যটা ভাগ করে ফেলে দাও, যাতে শুধু দিকটা থাকে।
        </div>
      )}
    </>
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
  Finale: { start: {}, some: { open: [4, 3] }, all: { open: [0, 1, 2, 3, 4] } },
};
