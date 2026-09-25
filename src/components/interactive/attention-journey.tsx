"use client";

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";

import { Bubble, Building, Card, Loop, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { BoxRun } from "@/components/journey/box";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, Ticks, pill, usePlay, useScene, useSeed, useSeeded, useTween, type Fixtures } from "@/components/journey/kit";
import { dot, num, tupN } from "./haat-journey";

// Screens for "Math for AI 4.9 — The same box, inside ChatGPT", told as a Journey.
//
// Eleven screens. 1 seals the bet on সোম's claim that ChatGPT runs the হাট's
// box (BoxBet). 2 recalls 2.3 on the word map: king − man + woman lands by
// queen, because a word is a list of numbers (WordWalk). 3 tries a rule by
// position for "ওটা" and watches it fail on one of two endings (NearestRule).
// 4 finds "ওটা" by the biggest box between its query and each key, and the
// ending flips the answer (WhoIsIt). 5 lets the machine learn the query by
// reading sentences (LearnQuery). 6 runs every word against every word: 81
// boxes, attention (EveryWord). 7 runs 4.1's দালাল card as a neuron: box,
// + a number, a bend (NeuronRun). 8 is এবার আপনার পালা: the reader builds
// the query (YourSentence). 9 Try it: the cat and the milk (CatMilk). 10 the
// ending, Module 1's formula tapped piece by piece (Finale). 11 the look-ahead:
// mix u and v into w, so w is extra (MixW).
//
// After the screens come the story scenes (1a the night call, 2a সোম's
// 2.3, 3a the cow shed, 7a the khata, 8a the goat and the leaves, 9a the cat
// in the kitchen, 10a the bus home) and the watch-only figures, each
// numbered after its screen (1½, 2½, …). Every figure waits on its first
// frame for the reader (kit's useScene) and draws each beat from `k` alone.
//
// Tailwind only. Ink on the white sheets and stages is fixed.

const len = (v: readonly number[]) => Math.hypot(...v);
const fix = (n: number, d: number) => {
  const s = Math.abs(n).toFixed(d);
  return n < 0 && Number(s) !== 0 ? `−${s}` : s;
};

const A_INK = "#0f1b2d";
const A_BLUE = "#2563eb";
const A_CORAL = "#e11d48";
const A_AMBER = "#d97706";
const A_TEAL = "#0d9488";
const A_VIOLET = "#7c3aed";
const A_SLATE = "#64748b";
/** the stage's ground */
const LG = 150;

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** A caption that fades in afresh on every beat. */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** Enter or space on an SVG button does what a tap does. */
const press = (f: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    f();
  }
};

/** An arrow on a white sheet, pixel coordinates. */
function A_Arr({ x1, y1, x2, y2, color, w = 2.4, dashed = false, op = 1 }: { x1: number; y1: number; x2: number; y2: number; color: string; w?: number; dashed?: boolean; op?: number }) {
  const l = Math.hypot(x2 - x1, y2 - y1);
  if (l < 1) return null;
  const ux = (x2 - x1) / l;
  const uy = (y2 - y1) / l;
  const h = Math.min(6 + w, l * 0.5);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const s = h * 0.5;
  return (
    <g opacity={op} className="pointer-events-none">
      <path d={`M${x1} ${y1}L${bx} ${by}`} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? "4 3" : undefined} />
      <path d={`M${x2} ${y2}L${bx - uy * s} ${by + ux * s}L${bx + uy * s} ${by - ux * s}Z`} fill={color} />
    </g>
  );
}

/** Something that glides to (x, y) over `ms`, the way a Person does: draw it around (0, 0). */
function A_Carry({ x, y, ms = 1200, children }: { x: number; y: number; ms?: number; children: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {children}
    </g>
  );
}

/** The name under someone on a night stage, in light ink. */
function A_Name({ x, y = LG, text, light = false }: { x: number; y?: number; text: string; light?: boolean }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={light ? "#e2e8f0" : A_INK} className="pointer-events-none">
      {text}
    </text>
  );
}

// ---------------------------------------------------------------------------
// The toy's sheet, shared by screens 4, 5, 8 and 9: two slots, (প্রাণী, খাবার).
// The keys are arrows from the corner; the query ("ওটা"'s list) is a dashed
// violet arrow that glides when it changes. Beside the sheet, one row per word:
// its key, a bar for the box, and the box itself. Rows show only once `show`
// says so, so a screen can land them one at a time.

type Key = { w: string; key: number[] };
const K_TONE = [A_BLUE, A_TEAL, A_SLATE];
const K_TEXT = ["text-cat-blue", "text-cat-teal", "text-muted"];
const K_O = { x: 18, y: 98 };
const K_SC = 22;

function KeyPanel({ keys, q, show, win, qLabel = "ওটা" }: { keys: readonly Key[]; q: readonly number[] | null; show: readonly boolean[]; win: number | null; qLabel?: string }) {
  const [qx, qy] = useTween([...(q ?? [0, 0])], 900);
  const scores = keys.map((k) => (q ? dot(q, k.key) : 0));
  const top = Math.max(6, ...scores);
  const { x: ox, y: oy } = K_O;
  return (
    <div className="mx-auto mt-2 flex w-full max-w-sm items-center gap-3">
      <svg viewBox="0 0 112 106" role="img" aria-label="দুই slot এর sheet: প্রাণী ডানে, খাবার উপরে; প্রতিটা শব্দের key একটা arrow, ওটার query ড্যাশ দেয়া arrow" className="block h-auto w-full max-w-[8.5rem] shrink-0">
        <rect x={1} y={1} width={110} height={104} rx={8} fill="white" stroke="#cbd5e1" />
        <path d={`M${ox} ${oy}H108M${ox} ${oy}V6`} stroke={A_INK} strokeOpacity={0.35} />
        <text x={108} y={oy - 3} textAnchor="end" fontSize={6.5} fill="#475569">
          প্রাণী
        </text>
        <text x={ox + 3} y={11} fontSize={6.5} fill="#475569">
          খাবার
        </text>
        {keys.map((k, i) => (
          <A_Arr key={k.w} x1={ox} y1={oy} x2={ox + k.key[0] * K_SC} y2={oy - k.key[1] * K_SC} color={K_TONE[i]} w={win === i ? 3.2 : 2} op={win !== null && win !== i ? 0.4 : 1} />
        ))}
        {keys.map((k, i) => (
          <text key={`t${k.w}`} x={ox + k.key[0] * K_SC + (k.key[0] === 0 ? 4 : 1)} y={oy - k.key[1] * K_SC + (k.key[1] === 0 ? -5 : k.key[0] === 0 ? 6 : -3)} fontSize={7} fontWeight={700} fill={K_TONE[i]}>
            {k.w}
          </text>
        ))}
        {q && <A_Arr x1={ox} y1={oy} x2={ox + qx * K_SC} y2={oy - qy * K_SC} color={A_VIOLET} w={2.4} dashed />}
        {q && (
          <text x={ox + qx * K_SC + (qy > qx ? -3 : 2)} y={oy - qy * K_SC + (qy > qx ? 2 : 10)} textAnchor={qy > qx ? "end" : "start"} fontSize={7} fontWeight={800} fill={A_VIOLET}>
            {qLabel}
          </text>
        )}
      </svg>
      <div className="grid min-w-0 flex-1 gap-1.5 text-sm">
        {q && (
          <div className="text-xs text-cat-violet">
            {qLabel} এর query <span className="font-mono">{tupN(q)}</span>
          </div>
        )}
        {keys.map((k, i) => (
          <div key={k.w} className={`grid grid-cols-[3.2rem_1fr_1.6rem] items-center gap-1.5 rounded-md ${win === i ? "bg-accent/15" : ""}`}>
            <span className={`font-semibold leading-tight ${K_TEXT[i]}`}>
              {k.w}
              <span className="block font-mono text-[0.7rem] font-normal text-muted">{tupN(k.key)}</span>
            </span>
            <span className="h-2.5 rounded-full bg-foreground/10">
              {show[i] && q && (
                <span
                  className={`block h-full origin-left rounded-full transition-[scale] duration-500 motion-reduce:transition-none starting:scale-x-0 ${win === i ? "bg-accent" : "bg-cat-blue/50"}`}
                  style={{ width: `${(Math.max(0, scores[i]) / top) * 100}%` }}
                />
              )}
            </span>
            <b key={`${show[i]}${q?.join()}`} className={`${show[i] ? POP : ""} inline-block text-right font-mono`}>
              {show[i] && q ? num(scores[i]) : "?"}
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A sentence as word chips: `ota` is lit violet, `win` gets the accent once found. */
function Sentence({ words, ota, win = null, cursor = null, miss = false }: { words: readonly string[]; ota: number; win?: number | null; cursor?: number | null; miss?: boolean }) {
  return (
    <div className="mx-auto flex max-w-sm flex-wrap justify-center gap-x-0.5 gap-y-1 rounded-xl border border-border bg-surface px-2 py-1.5 text-[0.95rem]">
      {words.map((w, i) => (
        <span
          key={`${i}${w}`}
          className={`rounded-md px-0.5 transition-colors duration-200 motion-reduce:transition-none ${
            i === ota
              ? "bg-cat-violet/15 font-semibold text-cat-violet"
              : i === cursor
                ? "bg-cat-amber/25 ring-2 ring-cat-amber"
                : i === win
                  ? miss
                    ? "bg-danger/10 font-semibold text-danger ring-2 ring-danger/50"
                    : "bg-accent/20 font-semibold ring-2 ring-accent"
                  : ""
          }`}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · The bet. সোম says ChatGPT runs the হাট's box. The হাট's box plays on the
//     left, ChatGPT is a closed phone on the right. The bet is sealed unmarked:
//     an envelope takes the letter and closes. Settled on screen 8 / 10.

const BET = ["ঠিক — ChatGPT এর ভিতরেও এই dot product টাই চলে", "না, ওটা পুরা অন্য হিসাব", "Dot product আছে, কিন্তু আসল কাজে না"];

function B1_Envelope({ letter }: { letter: string }) {
  const [flap] = useTween([1], 900, [0]);
  return (
    <svg viewBox="0 0 70 46" role="img" aria-label={`বাজি ${letter}, খামে ভরে বন্ধ`} className={`${POP} mx-auto block h-auto w-full max-w-[4.5rem]`}>
      <rect x={4} y={8} width={62} height={34} rx={3} fill="#fef3c7" stroke="#b45309" strokeWidth={1.2} />
      <text x={35} y={33} textAnchor="middle" fontSize={13} fontWeight={800} fill="#92400e">
        {letter}
      </text>
      <path d={`M4 8L35 ${8 + 20 * flap}L66 8Z`} fill="#fde68a" stroke="#b45309" strokeWidth={1.2} strokeLinejoin="round" />
      {flap > 0.95 && <circle cx={35} cy={28} r={4} fill={A_CORAL} className={POP} />}
    </svg>
  );
}

export function BoxBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি ধরা হয়ে গেলো। শেষে মিলিয়ে দেখবো।");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl border-2 border-cat-amber/40 bg-cat-amber/5 px-2 py-2">
          <div className="text-sm font-semibold">হাটের dot product</div>
          <div className="mt-1 text-[0.8rem] leading-relaxed">
            <BoxRun a={[2, 1, 12]} b={[60, 180, 12]} inline />
          </div>
          <div className="mt-1 text-xs text-muted">ঘরে ঘরে গুণ, তারপর যোগ</div>
        </div>
        <div className="grid place-items-center rounded-2xl border-2 border-dashed border-border px-2 py-2">
          <div className="text-sm font-semibold">ChatGPT এর ভিতরে</div>
          {bet === null ? (
            <svg viewBox="0 0 40 52" aria-hidden="true" className="mt-1 block h-auto w-10">
              <rect x={6} y={2} width={28} height={48} rx={4} fill="#1e293b" />
              <rect x={9} y={7} width={22} height={36} rx={2} fill="#e2e8f0" />
              <rect x={11} y={10} width={13} height={5} rx={2} fill="#94a3b8" />
              <rect x={16} y={18} width={13} height={5} rx={2} fill="#a5b4fc" />
              <text x={20} y={39} textAnchor="middle" fontSize={11} fontWeight={800} fill={A_CORAL}>
                ?
              </text>
            </svg>
          ) : (
            <B1_Envelope letter={String.fromCharCode(65 + bet)} />
          )}
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-muted">সোম বললো, ChatGPT এর ভিতরেও এই dot product চলে। আপনার কী মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>সোমের কথার উপরে একটা বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · 2.3, recalled on the map. Where does king − man + woman land? The
//     reader taps a word; either way the sum walks: the arrow man → king, then
//     the same arrow carried to woman, landing at (6.6, 5.5) by queen. A wrong
//     tap is shown far from where the arrow stopped.

const W2 = [
  { w: "man", at: [1.6, 1.4] },
  { w: "woman", at: [5.6, 1.0] },
  { w: "boy", at: [3.0, 0.5] },
  { w: "girl", at: [7.4, 0.4] },
  { w: "king", at: [2.6, 5.9] },
  { w: "queen", at: [6.9, 5.8] },
  { w: "prince", at: [4.1, 4.9] },
  { w: "princess", at: [8.5, 4.8] },
  { w: "car", at: [0.8, 7.3] },
  { w: "rice", at: [9.0, 7.4] },
] as const;
const W2_MAN = W2[0].at;
const W2_WOMAN = W2[1].at;
const W2_KING = W2[4].at;
const W2_QUEEN = 5;
const W2_D = [W2_KING[0] - W2_MAN[0], W2_KING[1] - W2_MAN[1]];
const W2_END = [W2_WOMAN[0] + W2_D[0], W2_WOMAN[1] + W2_D[1]];
const w2x = (x: number) => 16 + x * 29;
const w2y = (y: number) => 202 - y * 24;

export function WordWalk() {
  const pass = useGate();
  const seeded = useSeeded();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const walk = usePlay(750);
  const k = seeded && pick !== null ? 3 : walk.k;
  const from = k >= 2 ? W2_WOMAN : W2_MAN;
  const [fx, fy] = useTween([from[0], from[1]], 800);

  const tap = (i: number) => {
    if (walk.running) return;
    setPick(i);
    walk.play(3, () => {
      if (i === W2_QUEEN) pass("শব্দও একটা list of numbers, একটা vector.");
      else setMiss((m) => m + 1);
    });
  };
  const over = k >= 3 && pick !== null;
  const right = over && pick === W2_QUEEN;

  return (
    <>
      <svg viewBox="0 0 300 214" role="img" aria-label="শব্দের map: man, woman, king, queen আর আরো কিছু শব্দ; king − man + woman কোথায় পড়ে?" className="mx-auto block h-auto w-full max-w-[21rem]">
        <rect x={1} y={1} width={298} height={212} rx={10} fill="white" stroke="#cbd5e1" />
        {k >= 1 && (
          <g className={FADE}>
            <A_Arr x1={w2x(fx)} y1={w2y(fy)} x2={w2x(fx + W2_D[0])} y2={w2y(fy + W2_D[1])} color={A_AMBER} w={2.6} dashed={k < 2} />
            {k === 1 && (
              <text x={w2x(2.1)} y={w2y(3.6)} textAnchor="end" fontSize={9} fontWeight={700} fill="#b45309" fontFamily="ui-monospace, monospace">
                king − man
              </text>
            )}
          </g>
        )}
        {W2.map((d, i) => {
          const x = w2x(d.at[0]);
          const y = w2y(d.at[1]);
          const picked = over && pick === i;
          return (
            <g key={d.w} role="button" tabIndex={0} aria-label={d.w} onClick={() => tap(i)} onKeyDown={press(() => tap(i))} className="cursor-pointer outline-none">
              <rect x={x - 26} y={y - 16} width={52} height={24} fill="transparent" />
              {picked && <circle cx={x} cy={y} r={9} fill="none" stroke={right ? "#16a34a" : A_CORAL} strokeWidth={2} className={POP} />}
              <circle cx={x} cy={y} r={3.2} fill={A_INK} />
              <text x={x} y={y - 7} textAnchor="middle" fontSize={10} fontWeight={600} fill={A_INK} fontFamily="ui-monospace, monospace">
                {d.w}
              </text>
            </g>
          );
        })}
        {k >= 3 && <circle cx={w2x(W2_END[0])} cy={w2y(W2_END[1])} r={4.5} fill={A_CORAL} className={POP} />}
      </svg>
      <div className="mt-1 min-h-6 text-center font-mono text-sm">
        {k === 0 && <span className="font-sans text-muted">শব্দে tap করুন।</span>}
        {k === 1 && <span className={FADE}>king − man = {tupN(W2_D)}</span>}
        {k === 2 && <span className={FADE}>woman থেকে একই arrow</span>}
        {k >= 3 && (
          <span className={FADE}>
            {tupN(W2_WOMAN)} + {tupN(W2_D)} = <b>{tupN(W2_END)}</b>
          </span>
        )}
      </div>
      {over && !right && <Nope key={miss}>Arrow টা থামলো {tupN(W2_END)} এ, queen এর একদম পাশে। {W2[pick].w} ওখান থেকে অনেক দূরে। আবার tap করুন।</Nope>}
      <Task done={right}>king − man + woman কোন শব্দের পাশে গিয়ে পড়ে? Map এ সেই শব্দে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The old way fails. The rule "ওটা means the name just before it" hops
//     back from ওটা word by word and stops on খড় — in both sentences. With
//     "পচা ছিল" that is right; with "পেট ভরা ছিল" it is not. Same places,
//     different answers.

const R3 = [
  { words: ["গরুটা", "খড়", "খেলো", "না,", "কারণ", "ওটার", "পেট", "ভরা", "ছিল।"], tick: "পেট ভরা", ok: false, say: "ওটা মানে খড়? খড়ের পেট ভরা ছিল? মিললো না।" },
  { words: ["গরুটা", "খড়", "খেলো", "না,", "কারণ", "ওটা", "পচা", "ছিল।"], tick: "পচা", ok: true, say: "ওটা মানে খড়। খড় পচা ছিল। মিলে গেলো।" },
];
const R3_OTA = 5;
const R3_STOP = 1;

export function NearestRule() {
  const pass = useGate();
  const [ran, setRan] = useSeed<number[]>("ran", []);
  const [active, setActive] = useState<number | null>(null);
  const hop = usePlay(420);
  const hopping = hop.running && active !== null;

  const run = (r: number) => {
    if (hop.running || ran.includes(r)) return;
    setActive(r);
    hop.play(R3_OTA - R3_STOP, () => {
      const next = [...ran, r];
      setRan(next);
      if (next.length === 2) pass("শব্দ একই জায়গায়, তবু উত্তর আলাদা।");
    });
  };

  return (
    <>
      <div className="mx-auto max-w-sm rounded-xl bg-cat-amber/10 px-3 py-1.5 text-center text-sm">
        নিয়ম: ওটার ঠিক আগে যে নামটা, ওটা মানে সেটাই।
      </div>
      <div className="mt-3 grid gap-3">
        {R3.map((row, r) => {
          const done = ran.includes(r) && !(hopping && active === r);
          const cursor = hopping && active === r ? R3_OTA - hop.k : null;
          return (
            <div key={row.tick} className="grid gap-1.5">
              <Sentence words={row.words} ota={R3_OTA} cursor={cursor} win={done ? R3_STOP : null} miss={!row.ok} />
              <div className="flex min-h-9 items-center justify-center gap-2 text-sm">
                {ran.includes(r) ? (
                  <span className={`${FADE} ${row.ok ? "text-accent-text" : "text-danger"}`}>{row.say}</span>
                ) : (
                  <button type="button" onClick={() => run(r)} disabled={hop.running} className={`${pill(false)} font-sans`}>
                    নিয়মটা চালান
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Ticks items={R3.map((row, r) => [row.tick, ran.includes(r)] as [string, boolean])} />
      <Task done={ran.length === 2}>দুইটা বাক্যেই নিয়মটা চালান। দেখুন ওটা কার উপরে গিয়ে থামে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Attention in a toy. "ওটা" sends a query (2, 0) and each word shows a
//     key, in two slots (প্রাণী, খাবার). The boxes land one by one; the biggest
//     wins: গরু। Change the ending to "পচা ছিল": the query swings to (0, 2),
//     and খড় wins.

const W4_KEYS: Key[] = [
  { w: "গরু", key: [3, 1] },
  { w: "খড়", key: [0, 3] },
  { w: "খেলো", key: [1, 1] },
];
const W4_ROUNDS = [
  { words: ["গরুটা", "খড়", "খেলো", "না,", "কারণ", "ওটার", "পেট", "ভরা", "ছিল।"], q: [2, 0], ans: 0, tick: "পেট ভরা" },
  { words: ["গরুটা", "খড়", "খেলো", "না,", "কারণ", "ওটা", "পচা", "ছিল।"], q: [0, 2], ans: 1, tick: "পচা" },
];

export function WhoIsIt() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [ran, setRan] = useSeed("ran", false);
  const box = usePlay(480);
  const k = box.running ? box.k : ran ? 4 : 0;
  const r = W4_ROUNDS[round];

  const run = () => {
    if (box.running) return;
    box.play(4, () => {
      setRan(true);
      if (round === 1) pass("ওটা ঘুরে যায় সবচেয়ে বড় dot product এর দিকে।");
    });
  };

  return (
    <>
      <Sentence key={round} words={r.words} ota={5} win={k >= 4 ? r.ans : null} />
      <KeyPanel keys={W4_KEYS} q={r.q} show={W4_KEYS.map((_, i) => k > i)} win={k >= 4 ? r.ans : null} />
      <div className="mt-3 flex min-h-10 items-center justify-center">
        {k === 0 && !box.running ? (
          <button type="button" onClick={run} className={`${pill(false)} font-sans`}>
            ওটার query র সাথে সবার dot product নিন
          </button>
        ) : k >= 4 && round === 0 ? (
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
        ) : k >= 4 ? (
          <span className={`${FADE} text-[0.95rem]`}>
            ওটা মানে <b>{W4_KEYS[r.ans].w}</b>.
          </span>
        ) : null}
      </div>
      <Ticks items={W4_ROUNDS.map((x, i) => [x.tick, round > i || (round === i && ran)] as [string, boolean])} />
      <Task done={round === 1 && ran}>ওটার query র সাথে প্রতিটা শব্দের dot product নিন। তারপর বাক্যের শেষটা বদলে আবার দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Who sets the numbers? The query for "…কারণ ওটার পেট ভরা ছিল" starts
//     pointing the wrong way. The reader feeds four sentences; each one, the
//     machine guesses by the biggest box, and the query is nudged towards the
//     right answer: wrong, wrong, right, right.

const L5_Q = [
  [0.2, 2],
  [0.9, 1.8],
  [1.5, 1.2],
  [2, 0.4],
  [2.2, 0.2],
];
const L5_READS = [
  { animal: "ছাগল", food: "পাতা" },
  { animal: "বিড়াল", food: "মাছ" },
  { animal: "মুরগি", food: "ধান" },
  { animal: "হাঁস", food: "শামুক" },
];
const L5_A = [3, 1];
const L5_F = [0, 3];

export function LearnQuery() {
  const pass = useGate();
  const [n, setN] = useSeed("n", 0);
  const read = usePlay(700);
  const k = read.running ? read.k : 3;
  const d = read.running ? n : n - 1;
  const shownRead = L5_READS[Math.max(0, d)];
  const qBefore = L5_Q[Math.max(0, d)];
  const guessAnimal = dot(qBefore, L5_A) > dot(qBefore, L5_F);
  const keys: Key[] = [
    { w: shownRead.animal, key: L5_A },
    { w: shownRead.food, key: L5_F },
  ];
  const verdict = d >= 0 && k >= 2;
  // history: a read counts once its verdict is in
  const judged = (i: number) => i < n || (read.running && i === n && k >= 2);
  const ok = (i: number) => dot(L5_Q[i], L5_A) > dot(L5_Q[i], L5_F);

  const feed = () => {
    if (read.running || n >= L5_READS.length) return;
    const i = n;
    read.play(3, () => {
      setN(i + 1);
      if (i + 1 === L5_READS.length) pass("Numbers কেউ বসায় না, machine নিজে শেখে।");
    });
  };

  return (
    <>
      <div className="mx-auto max-w-sm rounded-xl border border-border bg-surface px-3 py-2 text-center text-[0.95rem]">
        {d < 0 ? (
          <span className="text-muted">এখনো কোনো বাক্য পড়া হয় নাই।</span>
        ) : (
          <span key={d} className={FADE}>
            {shownRead.animal}টা {shownRead.food} খেলো না, কারণ <span className="rounded-md bg-cat-violet/15 px-1 font-semibold text-cat-violet">ওটার</span> পেট ভরা ছিল।
          </span>
        )}
      </div>
      <KeyPanel keys={keys} q={L5_Q[n]} show={[read.running && k >= 1, read.running && k >= 1]} win={read.running && k >= 2 ? (guessAnimal ? 0 : 1) : null} />
      <div className="mt-2 min-h-6 text-center text-sm">
        {verdict && (
          <span key={`${d}v`} className={`${FADE} ${guessAnimal ? "text-accent-text" : "text-danger"}`}>
            Machine বললো, ওটা মানে {guessAnimal ? shownRead.animal : shownRead.food}. {guessAnimal ? "ঠিক।" : `ভুল, হবে ${shownRead.animal}. Query একটু সরলো।`}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" onClick={feed} disabled={read.running || n >= L5_READS.length} className={`${pill(false)} font-sans`}>
          {n === 0 ? "একটা বাক্য পড়ান" : "আরেকটা বাক্য পড়ান"}
        </button>
        <div className="flex gap-1.5" aria-label="কোন বাক্যে machine ঠিক বললো">
          {L5_READS.map((x, i) => (
            <span
              key={x.animal}
              className={`inline-block size-3.5 rounded-full transition-colors duration-300 motion-reduce:transition-none ${judged(i) ? (ok(i) ? "bg-accent" : "bg-danger") : "border border-muted/50"}`}
            />
          ))}
        </div>
      </div>
      <Task done={n >= L5_READS.length}>Machine কে একটা একটা করে চারটা বাক্য পড়ান। ভুল হলে query কোন দিকে সরে, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Every word with every word. Tap a word: arcs draw from it to all nine
//     words (itself too), and its row of the 9 × 9 grid fills. After two by
//     hand, the rest run at once. 81 boxes for one short sentence.

const E6 = ["গরুটা", "খড়", "খেলো", "না", "কারণ", "ওটার", "পেট", "ভরা", "ছিল"];
const E6_X = E6.map((_, i) => 20 + i * 35);
const E6_Y = 104;
/** how much word i attends to word j: invented shades, except that ওটার looks hardest at গরুটা */
const e6w = (i: number, j: number) => (i === 5 ? (j === 0 ? 1 : j === 6 ? 0.5 : 0.12) : i === j ? 0.55 : 0.12 + (((i * 7 + j * 3) % 5) / 4) * 0.5);
const e6arc = (i: number, j: number) => {
  if (i === j) return `M${E6_X[i] - 4} ${E6_Y - 12}c-6 -16 14 -16 8 0`;
  const a = E6_X[i];
  const b = E6_X[j];
  return `M${a} ${E6_Y - 12}Q${(a + b) / 2} ${E6_Y - 12 - Math.abs(a - b) * 0.33} ${b} ${E6_Y - 12}`;
};

export function EveryWord() {
  const pass = useGate();
  const [done, setDone] = useSeed<number[]>("done", []);
  const [fresh, setFresh] = useState<number | null>(null);
  const rest = usePlay(170);
  const left = E6.map((_, i) => i).filter((i) => !done.includes(i));
  const shown = rest.running ? [...done, ...left.slice(0, rest.k)] : done;
  const all = shown.length === E6.length;

  const tap = (i: number) => {
    if (rest.running || done.includes(i)) return;
    const next = [...done, i];
    setDone(next);
    setFresh(i);
    if (next.length === E6.length) pass("9 টা শব্দ, 81 টা dot product। সবাই সবার সাথে।");
  };
  const runRest = () => {
    if (rest.running) return;
    setFresh(null);
    rest.play(left.length, () => {
      setDone(E6.map((_, i) => i));
      pass("9 টা শব্দ, 81 টা dot product। সবাই সবার সাথে।");
    });
  };

  return (
    <>
      <svg viewBox="0 0 320 116" role="img" aria-label="বাক্যের 9 টা শব্দ; tap করলে শব্দটা বাকি সবার সাথে dot product নেয়, arc দিয়ে দেখানো" className="mx-auto block h-auto w-full max-w-[22rem]">
        {shown.map((i) =>
          E6.map((_, j) =>
            i === fresh ? (
              <Draw key={`${i}-${j}`} d={e6arc(i, j)} ms={500} delay={j * 40} strokeWidth={0.6 + 2.2 * e6w(i, j)} className="stroke-[#7c3aed]" />
            ) : (
              <path key={`${i}-${j}`} d={e6arc(i, j)} fill="none" stroke={A_BLUE} strokeOpacity={0.15 + 0.5 * e6w(i, j)} strokeWidth={0.6 + 1.4 * e6w(i, j)} className={FADE} />
            ),
          ),
        )}
        {E6.map((w, i) => {
          const on = shown.includes(i);
          return (
            <g key={w} role="button" tabIndex={0} aria-label={w} aria-pressed={on} onClick={() => tap(i)} onKeyDown={press(() => tap(i))} className="cursor-pointer outline-none">
              <rect x={E6_X[i] - 17} y={E6_Y - 10} width={34} height={20} rx={5} fill={on ? (i === fresh ? "#ede9fe" : "#dbeafe") : "white"} stroke={on ? (i === fresh ? A_VIOLET : "#93c5fd") : "#cbd5e1"} />
              <text x={E6_X[i]} y={E6_Y + 4} textAnchor="middle" fontSize={9.5} fontWeight={i === 5 ? 800 : 600} fill={A_INK}>
                {w}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4">
        <svg viewBox="0 0 74 74" role="img" aria-label="9 × 9 ঘরের grid; প্রতিটা ঘর একটা dot product" className="block h-auto w-[4.6rem] shrink-0">
          {E6.map((_, i) =>
            E6.map((__, j) => (
              <rect
                key={`${i}${j}`}
                x={1 + j * 8}
                y={1 + i * 8}
                width={7}
                height={7}
                rx={1}
                fill={shown.includes(i) ? (i === 5 && j === 0 ? A_VIOLET : A_BLUE) : "#e2e8f0"}
                fillOpacity={shown.includes(i) ? 0.25 + 0.75 * e6w(i, j) : 1}
                className="transition-[fill,fill-opacity] duration-300 motion-reduce:transition-none"
              />
            )),
          )}
        </svg>
        <div className="grid gap-1 text-sm">
          <div>
            dot product হলো: <b className="font-mono">{shown.length * 9}</b> <span className="text-muted">/ 81</span>
          </div>
          {!all && done.length >= 2 && (
            <button type="button" onClick={runRest} disabled={rest.running} className={`${pill(false)} ${FADE} font-sans text-xs`}>
              বাকি {left.length} টা একসাথে চালান
            </button>
          )}
        </div>
      </div>
      <Task done={all}>শব্দগুলোতে tap করুন। প্রতিটা শব্দ কার কার সাথে dot product নেয়, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The neuron, run by hand on 4.1's দালাল card and the small young গাই.
//     Three stations: the box (85,000), + the হাসিল (2,000, a number added),
//     and a bend (the straight line bent; how is for later). Each tap plays.

const N7_W = [400, 4000, -5000];
const N7_X = [200, 5, 3];
const N7_B = 2000;
const N7_BOX = dot(N7_W, N7_X);
const N7_STEPS = ["dot product নিন", "হাসিল যোগ করুন", "বাঁকিয়ে দিন"];
const N7_STATIONS = [
  { name: "dot product", val: "85,000" },
  { name: "+ হাসিল", val: "87,000" },
  { name: "বাঁক", val: "বাঁকা" },
];

function N7_Bend() {
  const [y] = useTween([1], 900, [0]);
  // the straight line and the bent one, input left to right; at x = 50 the dot drops from one to the other
  const lineY = 62 - (38 * 50) / 180;
  const bentY = 62;
  return (
    <svg viewBox="0 0 200 72" role="img" aria-label="সোজা line একটু বাঁকানো হলো; সংখ্যাটা বাঁকা line এ গিয়ে বসলো" className="mx-auto block h-auto w-full max-w-[13rem]">
      <rect x={1} y={1} width={198} height={70} rx={8} fill="white" stroke="#cbd5e1" />
      <path d="M12 66H192M12 66V6" stroke={A_INK} strokeOpacity={0.3} />
      <path d="M12 62L192 12" fill="none" stroke={A_SLATE} strokeWidth={1.4} strokeDasharray="4 3" />
      <Draw d="M12 62H78Q92 62 100 57L192 12" strokeWidth={2.4} ms={800} className="stroke-[#7c3aed]" />
      <circle cx={50} cy={lineY + (bentY - lineY) * y} r={4} fill={A_AMBER} />
      <text x={20} y={18} fontSize={8} fill={A_INK}>
        সোজা line বাঁকা হলো
      </text>
    </svg>
  );
}

function A_Cow({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const coat = "#b45309";
  const leg = "#7c2d12";
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
      <circle cx={-26} cy={-31} r={1} fill={A_INK} />
    </g>
  );
}

export function NeuronRun() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);

  const next = () => {
    if (stage >= 3) return;
    const s = stage + 1;
    setStage(s);
    if (s === 3) pass("Neuron এর প্রথম কাজটাই হাটের dot product।");
  };

  return (
    <>
      <div className="mx-auto flex max-w-sm items-center justify-center gap-3">
        <svg viewBox="-34 -46 64 48" aria-hidden="true" className="block h-auto w-14 shrink-0">
          <A_Cow x={0} y={0} s={0.95} />
        </svg>
        <div className="grid gap-0.5 text-xs">
          <div>
            গাই, x = <span className="font-mono text-sm">{tupN(N7_X)}</span>
            <span className="block text-muted">ওজন, দুধ, বয়স</span>
          </div>
          <div>
            দালালের card, w = <span className="font-mono text-sm">{tupN(N7_W)}</span>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-3 flex max-w-sm items-stretch justify-center gap-1">
        {N7_STATIONS.map((st, i) => (
          <div key={st.name} className="flex items-center gap-1">
            {i > 0 && <span className={`text-muted transition-opacity duration-300 motion-reduce:transition-none ${stage > i ? "opacity-100" : "opacity-40"}`}>→</span>}
            <div
              className={`grid min-w-[4.6rem] justify-items-center rounded-xl border-2 px-2 py-1 transition-colors duration-300 motion-reduce:transition-none ${
                stage > i ? "border-cat-violet/60 bg-cat-violet/10" : stage === i ? "border-cat-blue/60 border-dashed" : "border-border opacity-60"
              }`}
            >
              <span className="text-xs font-semibold">{st.name}</span>
              <b key={`${stage > i}`} className={`${stage > i ? POP : ""} inline-block text-sm ${i < 2 ? "font-mono" : ""}`}>
                {stage > i ? st.val : "…"}
              </b>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid min-h-[5.5rem] place-items-center">
        {stage === 1 && (
          <div key="box" className={`${FADE} w-full`}>
            <BoxRun a={N7_W} b={N7_X} aName="w" bName="x" dense />
          </div>
        )}
        {stage === 2 && (
          <div key="b" className={`${FADE} text-center font-mono text-lg`}>
            {N7_BOX.toLocaleString("en-IN")} + {N7_B.toLocaleString("en-IN")} ={" "}
            <b className={`${POP} inline-block`}>{(N7_BOX + N7_B).toLocaleString("en-IN")}</b>
            <div className="font-sans text-xs text-muted">একটা fixed number যোগ: হাটের হাসিল।</div>
          </div>
        )}
        {stage === 3 && (
          <div key="bend" className={`${FADE} w-full`}>
            <N7_Bend />
            <div className="mt-1 text-center text-xs text-muted">কীভাবে বাঁকায়, সেটা পরের গল্প।</div>
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-center">
        {stage < 3 ? (
          <button type="button" onClick={next} className={`${pill(false)} font-sans`}>
            {N7_STEPS[stage]}
          </button>
        ) : (
          <span className={`${FADE} text-sm font-semibold text-cat-violet`}>এই পুরাটাই একটা neuron।</span>
        )}
      </div>
      <Task done={stage >= 3}>তিনটা ধাপ একটা একটা করে চালান। দেখুন কোন ধাপে হাটের dot product টা বসে আছে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · এবার আপনার পালা। "ছাগলটা পাতা খেলো না, কারণ ওটা শুকনা ছিল।" The reader
//     builds ওটা's query, picking one of three arrows; the boxes play out. Aimed
//     at প্রাণী, ছাগল wins (6); aimed at both, ছাগল still wins (4 vs 3); aimed
//     at খাবার, পাতা wins (6).

const Y8_KEYS: Key[] = [
  { w: "ছাগল", key: [3, 1] },
  { w: "পাতা", key: [0, 3] },
  { w: "খেলো", key: [1, 1] },
];
const Y8_WORDS = ["ছাগলটা", "পাতা", "খেলো", "না,", "কারণ", "ওটা", "শুকনা", "ছিল।"];
const Y8_Q = [
  { q: [2, 0], say: "প্রাণী" },
  { q: [1, 1], say: "দুই দিকেই" },
  { q: [0, 2], say: "খাবার" },
];
const Y8_RIGHT = 2;
const winOf = (keys: readonly Key[], q: readonly number[]) => {
  const s = keys.map((k) => dot(q, k.key));
  return s.indexOf(Math.max(...s));
};

/** a query as a small arrow on a mini sheet, for a picture choice */
function QPic({ q }: { q: readonly number[] }) {
  return (
    <svg viewBox="0 0 54 44" aria-hidden="true" className="mx-auto block h-auto w-full max-w-[3.4rem]">
      <path d="M6 38H50M6 38V4" className="stroke-current" strokeOpacity={0.35} fill="none" />
      <path d={`M6 38L${6 + q[0] * 17} ${38 - q[1] * 15}`} className="stroke-current" strokeWidth={2.4} strokeLinecap="round" strokeDasharray="4 3" fill="none" />
      <circle cx={6 + q[0] * 17} cy={38 - q[1] * 15} r={2.6} className="fill-current" />
    </svg>
  );
}

export function YourSentence() {
  const pass = useGate();
  const seeded = useSeeded();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const box = usePlay(450);
  const k = pick === null ? 0 : seeded || !box.running ? 4 : box.k;
  const q = pick === null ? null : Y8_Q[pick].q;
  const win = q && k >= 4 ? winOf(Y8_KEYS, q) : null;
  const over = pick !== null && k >= 4;

  const choose = (i: number) => {
    if (box.running) return;
    setPick(i);
    box.play(4, () => {
      if (i === Y8_RIGHT) pass("ওটার query আপনি নিজেই বানালেন।");
      else setMiss((m) => m + 1);
    });
  };

  return (
    <>
      <Sentence key={`${pick}`} words={Y8_WORDS} ota={5} win={win} miss={win !== null && pick !== Y8_RIGHT} />
      <KeyPanel keys={Y8_KEYS} q={q} show={Y8_KEYS.map((_, i) => k > i)} win={win} />
      <div className="mt-2 text-sm font-medium text-muted">ওটার query কোন slot এর দিকে তাক করবেন?</div>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {Y8_Q.map((o, i) => (
          <Choice key={o.say} n={i} look={over && pick === i ? (i === Y8_RIGHT ? "right" : "wrong") : "idle"} disabled={box.running} onClick={() => choose(i)}>
            <span className="grid justify-items-center gap-0.5 text-xs">
              <QPic q={o.q} />
              {o.say}
            </span>
          </Choice>
        ))}
      </div>
      {over && pick !== Y8_RIGHT && (
        <Nope key={miss}>
          {pick === 0
            ? "ছাগলের dot product 6। সবচেয়ে বড়। তাহলে ছাগলটা শুকনা ছিল? শুকনা হয় কী, ভাবুন।"
            : "ছাগলের dot product 4, পাতার 3। ছাগল জিতে গেলো। প্রাণী slot এর 1 টা ছাগলকে টেনে নিচ্ছে।"}
        </Nope>
      )}
      <Task done={over && pick === Y8_RIGHT}>ওটার query বানান, যাতে ওটা ঠিক শব্দটার দিকে ঘুরে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it: the cat and the milk. Query (1, 0); keys দুধ (0, 3), বিড়াল
//     (2, 0), খেলো (1, 1)। The reader picks a word as a picture of its key; the
//     picked box plays term by term, its bar grows, and then ওটা lands on the
//     picked word in the sentence (red if wrong). দুধ's big 3 is the slip: its
//     box is 0, so its bar never grows. pass() fires from the play's done.

const T9_KEYS: Key[] = [
  { w: "দুধ", key: [0, 3] },
  { w: "বিড়াল", key: [2, 0] },
  { w: "খেলো", key: [1, 1] },
];
const T9_Q = [1, 0];
const T9_RIGHT = 1;
const T9_WORDS = ["বিড়ালটা", "দুধ", "খেলো,", "কারণ", "ওটার", "খিদে", "পেয়েছিল।"];
const T9_AT = [1, 0, 2];

function KeyPic({ v, tone }: { v: readonly number[]; tone: string }) {
  return (
    <svg viewBox="0 0 54 44" aria-hidden="true" className="mx-auto block h-auto w-full max-w-[3.4rem]">
      <path d="M6 38H50M6 38V4" stroke="currentColor" strokeOpacity={0.35} fill="none" />
      <path d={`M6 38L${6 + v[0] * 17} ${38 - v[1] * 11}`} stroke={tone} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <circle cx={6 + v[0] * 17} cy={38 - v[1] * 11} r={2.6} fill={tone} />
    </svg>
  );
}

export function CatMilk() {
  const pass = useGate();
  const seeded = useSeeded();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  // a pick plays in two beats: its box runs term by term (1), then ওটা turns to
  // the word it lands on (2), right or wrong, and only then the verdict.
  const run = usePlay(1900);
  const [tries, setTries] = useState(0);
  const k = pick === null ? 0 : seeded || !run.running ? 2 : run.k;
  const over = pick !== null && k >= 2;

  const choose = (i: number) => {
    if (run.running) return;
    setPick(i);
    setTries((t) => t + 1);
    run.play(2, () => {
      if (i === T9_RIGHT) pass("Query যে slot এ তাকায়, সেই slot এর number জেতে।");
      else setMiss((m) => m + 1);
    }, 1);
  };
  const score = pick === null ? 0 : dot(T9_Q, T9_KEYS[pick].key);

  return (
    <>
      <Sentence words={T9_WORDS} ota={4} win={pick !== null && k >= 2 ? T9_AT[pick] : null} miss={over && pick !== T9_RIGHT} />
      <KeyPanel keys={T9_KEYS} q={T9_Q} show={T9_KEYS.map((_, i) => i === pick && k >= 1)} win={over && pick === T9_RIGHT ? pick : null} />
      <div className="mt-2 min-h-7 text-center text-sm">
        {pick !== null && k >= 1 && (
          <span key={tries}>
            {T9_KEYS[pick].w}: <BoxRun a={T9_Q} b={T9_KEYS[pick].key} inline ms={600} />
          </span>
        )}
      </div>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {T9_KEYS.map((x, i) => (
          <Choice key={x.w} n={i} look={over && pick === i ? (i === T9_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={run.running || (over && pick === T9_RIGHT)} onClick={() => choose(i)}>
            <span className="grid justify-items-center gap-0.5 text-xs">
              <KeyPic v={x.key} tone={K_TONE[i]} />
              {x.w}
            </span>
          </Choice>
        ))}
      </div>
      {over && pick !== T9_RIGHT && (
        <Nope key={miss}>
          {pick === 0
            ? `দুধের dot product ${score}. ওর 3 বসে আছে খাবার slot এ। query র খাবার slot এ 0। গুণ করলে? 0.`
            : `খেলো র dot product ${score}. আরেকটা শব্দের dot product এর চেয়ে ছোট। কোনটা?`}
        </Nope>
      )}
      <Task done={over && pick === T9_RIGHT}>ওটা কার দিকে ঘুরবে? সেই শব্দের ছবিতে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · Module 1, read out loud. The formula from the start of the series laid
//      out as a fraction; each piece opens on a tap to say what it is and where
//      it was learned. Done when every piece is open.

const PIECES = [
  { sym: "u, v", say: "দুইটা জিনিস, সংখ্যার list বানানো", where: "Article 1, representation" },
  { sym: "arrow", say: "সেই u আর v, এবার arrow হিসাবে: একটা direction, একটা length", where: "Article 2, vector এর দুই চেহারা" },
  { sym: "‖u‖ ‖v‖", say: "ওদের length: বর্গ, যোগ, root", where: "Article 3, ফিতা" },
  { sym: "u · v", say: "ঘরে ঘরে গুণ, তারপর যোগ। মানে length × length × কতটা একই দিকে", where: "4.1 থেকে 4.4, হাট, ভ্যান, ছাদ" },
  { sym: "cos θ", say: "শুধু কতটা একই দিকে, −1 থেকে 1", where: "4.5, TV এর সামনে" },
];

export function Finale() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const all = open.length === PIECES.length;
  const last = open[open.length - 1];
  const tap = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === PIECES.length) pass("Module 1 এর প্রতিটা টুকরা এখন চেনা।");
  };
  const chip = (i: number, body: string, cls = "") => (
    <button
      type="button"
      onClick={() => tap(i)}
      className={`cursor-pointer rounded-lg px-2 py-0.5 font-mono transition-[background-color,color,scale] duration-300 motion-reduce:transition-none ${
        open.includes(i) ? `bg-accent/15 text-accent-text ${last === i ? "scale-110" : ""}` : "bg-cat-blue/10 text-cat-blue hover:bg-cat-blue/20"
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
        {chip(1, "arrow", "font-sans text-sm")}
      </div>
      <div className="mx-auto mt-3 grid min-h-16 max-w-sm gap-1.5">
        {last !== undefined && !all && (
          <div key={last} className={`${POP} rounded-xl border border-border bg-surface px-3 py-1.5 text-sm`}>
            <b className="font-mono">{PIECES[last].sym}</b> {PIECES[last].say}
            <div className="text-xs text-muted">{PIECES[last].where}</div>
          </div>
        )}
        {all && (
          <div className={`${FADE} rounded-2xl bg-cat-violet/5 px-4 py-3 text-center text-[0.95rem]`}>
            দুইটা জিনিস কতটা একরকম জানতে চাইলে ওদের arrow বানান, দেখুন কতটা একই দিকে, আর length ভাগ দিয়ে ফেলে দিন, যাতে থাকে শুধু direction।
          </div>
        )}
      </div>
      <Ticks items={PIECES.map((p, i) => [p.sym, open.includes(i)] as [string, boolean])} />
      <Task done={all}>Formula র প্রতিটা টুকরায় tap করুন। কোনটা কোথায় শিখেছিলেন, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11 · The look-ahead. Three ingredients u (2, 1), v (1, 2), w (4, 5). Mix
//      some u's and some v's with the steppers: the path walks u's then v's.
//      1 u + 2 v lands on w's tip, so w is extra.

const M11_U = [2, 1];
const M11_V = [1, 2];
const M11_W = [4, 5];
const M11_O = { x: 20, y: 150 };
const M11_SC = 21;
const m11 = (p: readonly number[]) => [M11_O.x + p[0] * M11_SC, M11_O.y - p[1] * M11_SC] as const;

export function MixW() {
  const pass = useGate();
  const [a, setA] = useSeed("a", 0);
  const [b, setB] = useSeed("b", 0);
  const end = [a * M11_U[0] + b * M11_V[0], a * M11_U[1] + b * M11_V[1]];
  const [ex, ey] = useTween(end, 600);
  const hit = end[0] === M11_W[0] && end[1] === M11_W[1];
  const set = (na: number, nb: number) => {
    setA(na);
    setB(nb);
    if (na * M11_U[0] + nb * M11_V[0] === M11_W[0] && na * M11_U[1] + nb * M11_V[1] === M11_W[1]) pass("w কে u আর v মিশিয়েই বানানো যায়। ও বাড়তি।");
  };
  const legs: { from: number[]; to: number[]; tone: string }[] = [];
  let at = [0, 0];
  for (let i = 0; i < a; i++) {
    const nx = [at[0] + M11_U[0], at[1] + M11_U[1]];
    legs.push({ from: at, to: nx, tone: A_BLUE });
    at = nx;
  }
  for (let i = 0; i < b; i++) {
    const nx = [at[0] + M11_V[0], at[1] + M11_V[1]];
    legs.push({ from: at, to: nx, tone: A_TEAL });
    at = nx;
  }
  const [wx, wy] = m11(M11_W);
  const [px, py] = m11([ex, ey]);

  return (
    <>
      <svg viewBox="0 0 170 160" role="img" aria-label={`${a} টা u আর ${b} টা v মিশিয়ে পৌঁছানো গেলো (${end.join(", ")}) এ; w আছে (4, 5) এ`} className="mx-auto block h-auto w-full max-w-[14rem]">
        <rect x={1} y={1} width={168} height={158} rx={10} fill="white" stroke="#cbd5e1" />
        {Array.from({ length: 7 }, (_, i) => Array.from({ length: 7 }, (__, j) => <circle key={`${i}${j}`} cx={M11_O.x + i * M11_SC} cy={M11_O.y - j * M11_SC} r={1} fill={A_INK} opacity={0.2} />))}
        <A_Arr x1={M11_O.x} y1={M11_O.y} x2={wx} y2={wy} color={A_AMBER} w={2.4} dashed />
        <text x={wx + 5} y={wy + 2} fontSize={10} fontWeight={800} fill="#b45309" fontFamily="ui-monospace, monospace">
          w
        </text>
        {legs.map((l, i) => {
          const [x1, y1] = m11(l.from);
          const [x2, y2] = m11(l.to);
          return <A_Arr key={`${a}${b}${i}`} x1={x1} y1={y1} x2={x2} y2={y2} color={l.tone} w={2.4} />;
        })}
        {legs.length === 0 && (
          <>
            <A_Arr x1={M11_O.x} y1={M11_O.y} x2={m11(M11_U)[0]} y2={m11(M11_U)[1]} color={A_BLUE} w={2} op={0.6} />
            <A_Arr x1={M11_O.x} y1={M11_O.y} x2={m11(M11_V)[0]} y2={m11(M11_V)[1]} color={A_TEAL} w={2} op={0.6} />
            <text x={m11(M11_U)[0] + 3} y={m11(M11_U)[1] + 8} fontSize={9} fontWeight={700} fill="#1d4ed8" fontFamily="ui-monospace, monospace">
              u
            </text>
            <text x={m11(M11_V)[0] - 10} y={m11(M11_V)[1]} fontSize={9} fontWeight={700} fill="#0f766e" fontFamily="ui-monospace, monospace">
              v
            </text>
          </>
        )}
        <circle cx={px} cy={py} r={hit ? 6 : 4} fill={hit ? "#16a34a" : A_CORAL} className="transition-[r] duration-300 motion-reduce:transition-none" />
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono font-bold text-cat-blue">u</span>
          <Stepper value={a} onChange={(n) => set(n, b)} min={0} max={2} label="u" />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono font-bold text-cat-teal">v</span>
          <Stepper value={b} onChange={(n) => set(a, n)} min={0} max={2} label="v" />
        </span>
      </div>
      <div className="mt-2 text-center font-mono text-sm">
        {a} u + {b} v = {tupN(end)} <span className="font-sans text-muted">· w = {tupN(M11_W)}</span>
      </div>
      {hit && <div className={`${FADE} mt-1 text-center text-sm font-semibold text-accent-text`}>w এর মাথায় পৌঁছানো গেলো। w বাড়তি।</div>}
      <Task done={hit}>u আর v কয়টা করে মিশালে পথটা w এর মাথায় গিয়ে থামে? Stepper দিয়ে মিলান।</Task>
    </>
  );
}

// ===========================================================================
// Story scenes, one per setup that tells a scene (1a, 2a, 3a, 7a, 8a, 9a, 10a).

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: night, a phone call.
//      ফাহিম tells সোম the library's story; সোম says ChatGPT runs this box;
//      ফাহিম goes quiet. Whether it is true is left to the bet.

function A_Waves({ x, y }: { x: number; y: number }) {
  return (
    <g className={FADE} fill="none" stroke="#fde68a" strokeWidth={1.4} strokeLinecap="round">
      {[6, 12, 18].map((r) => (
        <path key={r} d={`M${x - r * 0.6} ${y - r}q${r * 0.9} ${r} 0 ${r * 2}`} transform={`rotate(-90 ${x} ${y})`} />
      ))}
    </g>
  );
}

export function NightCall({}: Story) {
  const s = useScene(3, [600, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাতে ফাহিম সোমকে ফোন করে লাইব্রেরির গল্প বলে; সোম বলে ChatGPT এর ভিতরেও এই dot product; ফাহিম চুপ">
        <Building x={4} y={LG} w={66} h={72} color="#334155" />
        <Building x={250} y={LG} w={66} h={72} color="#334155" />
        <Person who="fahim" x={96} y={LG} arm="hold" mood={k === 1 ? "happy" : k >= 3 ? "puzzled" : "plain"} />
        <A_Name x={96} text="ফাহিম" light />
        <Person who="som" x={224} y={LG} facing={-1} arm="hold" mood={k >= 2 ? "smug" : "plain"} />
        <A_Name x={224} text="সোম" light />
        {k >= 1 && k < 3 && (
          <>
            <A_Waves x={132} y={100} />
            <A_Waves x={188} y={100} />
          </>
        )}
        {k === 1 && <Bubble x={96} y={LG - 66} lines={["লাইব্রেরির পুরা", "গল্পটা শোন…"]} />}
        {k === 2 && <Bubble x={224} y={LG - 66} side="left" lines={["ChatGPT এর ভিতরেও", "তো এই dot product চলে।"]} />}
        {k >= 3 && <Bubble x={96} y={LG - 66} tone="think" lines={["হাটের dot product?", "ChatGPT তে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: মামার গোয়ালঘর at night.
//      The cow sits with its খড় untouched; ফাহিম, on the phone, says so; সোম
//      turns it into the sentence; the sentence and "ওটা কে?" — not answered.

function A_Shed({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 8} ${y - 70}L${x + 60} ${y - 96}L${x + 128} ${y - 70}Z`} fill="#78350f" />
      <rect x={x} y={y - 70} width={4} height={70} fill="#57534e" />
      <rect x={x + 116} y={y - 70} width={4} height={70} fill="#57534e" />
    </g>
  );
}

export function GoyalGhor({}: Story) {
  const s = useScene(3, [600, 2000, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাতে মামার গোয়ালঘর: গরুটা বসে আছে, সামনে খড়, ছোঁয়া হয় নাই; ফোনে ফাহিম সোমকে বলে; সোম একটা বাক্য বলে, ওটা কে?">
        <A_Shed x={170} y={LG} />
        <path d="M180 150q16 -18 34 0Z" fill="#facc15" />
        <path d="M184 146l10 -8M192 147l8 -9M200 146l6 -8" stroke="#ca8a04" strokeWidth={1} />
        <A_Cow x={254} y={LG} s={0.95} />
        <Person who="fahim" x={90} y={LG} arm="hold" mood={k >= 3 ? "puzzled" : "plain"} />
        <A_Name x={90} text="ফাহিম" light />
        {k >= 2 && <A_Waves x={120} y={96} />}
        {k === 1 && <Bubble x={90} y={LG - 66} side="left" lines={["মামার গরুটা আজ", "খড় খায় নাই।"]} />}
        {k === 2 && (
          <g className={FADE}>
            <text x={96} y={56} fontSize={8} fontWeight={700} fill="#e2e8f0">
              ফোনে সোম:
            </text>
            <Bubble x={104} y={100} side="right" lines={["এটাই ধর।", "ওটা কে?"]} />
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <rect x={14} y={14} width={292} height={26} rx={6} fill="white" />
            <text x={160} y={31} textAnchor="middle" fontSize={10} fontWeight={600} fill={A_INK}>
              গরুটা খড় খেলো না, কারণ <tspan fill={A_VIOLET} fontWeight={800}>ওটার</tspan> পেট ভরা ছিল।
            </text>
            <text x={160} y={56} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fde68a">
              ওটা কে?
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: the khata. সোম on the
//      phone says the neuron was at the cow haat; ফাহিম turns the pages back to
//      4.1 and there is the দালাল's card, (400, 4000, −5000). The neuron's
//      three stations are left to the screen.

export function KhataCard({}: Story) {
  const s = useScene(3, [600, 2200, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ঘরে ফাহিম; ফোনে সোম বলে neuron সে গরুর হাটে দেখেছে; ফাহিম খাতা উল্টিয়ে 4.1 এর পাতায় দালালের card পায়">
        <rect x={140} y={112} width={170} height={5} fill="#92400e" />
        <rect x={148} y={117} width={4} height={33} fill="#78350f" />
        <rect x={298} y={117} width={4} height={33} fill="#78350f" />
        <Person who="fahim" x={86} y={LG} arm={k >= 2 ? "point" : "hold"} mood={k >= 3 ? "happy" : "plain"} label />
        {k === 1 && (
          <g className={FADE}>
            <A_Waves x={112} y={92} />
            <text x={92} y={56} fontSize={8} fontWeight={700} fill={A_INK}>
              ফোনে সোম:
            </text>
            <Bubble x={100} y={100} side="right" lines={["neuron তুই আগেই", "দেখছিস। গরুর হাটে।"]} />
          </g>
        )}
        {k >= 2 && (
          <g>
            <rect x={160} y={52} width={130} height={60} rx={3} fill="white" stroke={A_INK} strokeOpacity={0.35} />
            <path d="M225 52V112" stroke={A_INK} strokeOpacity={0.2} />
            <text x={192} y={66} textAnchor="middle" fontSize={8} fontWeight={700} fill="#475569">
              4.1
            </text>
            <g transform="translate(193 104) scale(0.55)">
              <A_Cow x={0} y={0} />
            </g>
            <text key={k} x={258} y={68} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={A_INK} className={FADE}>
              দালালের card
            </text>
            {k >= 3 && (
              <g className={POP}>
                <rect x={230} y={76} width={56} height={26} rx={3} fill="#fef3c7" stroke="#b45309" strokeWidth={1} />
                <text x={258} y={87} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#92400e" fontFamily="ui-monospace, monospace">
                  (400, 4000,
                </text>
                <text x={258} y={97} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#92400e" fontFamily="ui-monospace, monospace">
                  −5000)
                </text>
              </g>
            )}
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10a · A story scene for the ending's setup, no task: the bus home. ফাহিম
//       messages সোম, then writes the formula in his khata: first as the
//       strange marks it was at the start of the series, then piece by piece,
//       known.

function A_Bus() {
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

const B10_PIECES = [
  { x: 222, y: 50, t: "cos θ =" },
  { x: 282, y: 42, t: "u · v" },
  { x: 282, y: 64, t: "‖u‖ ‖v‖" },
];

export function BusHome({}: Story) {
  const s = useScene(4, [600, 1600, 2200, 2000]);
  const k = s.k;
  const bx = k >= 1 ? 12 : -170;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="ফেরার বাসে ফাহিম সোমকে message পাঠায়, তারপর খাতায় formula লেখে; শুরুতে অচেনা দাগ, এখন প্রতিটা টুকরা চেনা">
        <A_Carry x={bx} y={LG} ms={1400}>
          <A_Bus />
          <g>
            <circle cx={125} cy={-43} r={6.5} fill="#e0ac7e" />
            <path d="M118.5 -44q0 -8 6.5 -8t6.5 8q-4 -4 -13 0Z" fill="#1f1a17" />
            <rect x={119} y={-37} width={12} height={5} rx={1} fill="#2563eb" />
          </g>
        </A_Carry>
        {k === 2 && (
          <g className={FADE}>
            <rect x={180} y={30} width={116} height={36} rx={8} fill="white" stroke="#16a34a" strokeWidth={1.4} />
            <text x={190} y={45} fontSize={8} fontWeight={700} fill="#15803d">
              সোমকে:
            </text>
            <text x={190} y={58} fontSize={9} fontWeight={600} fill={A_INK}>
              তোর কথাই ঠিক ছিল।
            </text>
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <circle cx={172} cy={78} r={2.5} fill="white" stroke={A_INK} strokeOpacity={0.35} />
            <circle cx={180} cy={70} r={3.5} fill="white" stroke={A_INK} strokeOpacity={0.35} />
            <rect x={188} y={22} width={124} height={58} rx={4} fill="white" stroke={A_INK} strokeOpacity={0.35} />
            {[34, 46, 58, 70].map((y) => (
              <path key={y} d={`M192 ${y}H308`} stroke="#bfdbfe" strokeWidth={0.8} />
            ))}
            <path d="M258 53H306" stroke={A_INK} strokeWidth={1.2} />
            {B10_PIECES.map((p) =>
              k >= 4 ? (
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
// 2a · A story scene for screen 2's setup, no task: the call goes on. সোম
//      laughs and asks, 2.3 মনে নাই?; the sum king − man + woman comes up as a
//      card between them. Where it lands is left to the map.

export function SomRecalls({}: Story) {
  const s = useScene(2, [600, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="ফোনে সোম হাসে, বলে 2.3 মনে নাই? king − man + woman">
        <Building x={4} y={LG} w={66} h={72} color="#334155" />
        <Building x={250} y={LG} w={66} h={72} color="#334155" />
        <Person who="fahim" x={96} y={LG} arm="hold" mood={k >= 2 ? "puzzled" : "plain"} />
        <A_Name x={96} text="ফাহিম" light />
        <Person who="som" x={224} y={LG} facing={-1} arm="hold" mood={k >= 1 ? "happy" : "plain"} />
        <A_Name x={224} text="সোম" light />
        <A_Waves x={132} y={100} />
        <A_Waves x={188} y={100} />
        {k >= 1 && <Bubble x={224} y={LG - 66} side="left" lines={["2.3 মনে নাই?"]} />}
        {k >= 2 && <Card x={160} y={34} text="king − man + woman" tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: মামা walks up with a
//      bunch of jackfruit leaves, puts them down in front of the tied goat and
//      walks off; the goat turns its face away. Then the sentence, with ওটা lit.
//      Which word ওটা is, is left to the screen.

/** The goat, feet on (0, 0), head to the left; `away` turns it round. */
function A_Goat({ x, y, away = false }: { x: number; y: number; away?: boolean }) {
  const coat = "#f5f5f4";
  const edge = "#a8a29e";
  return (
    <g style={{ transform: `translate(${x}px, ${y}px) scaleX(${away ? -1 : 1})`, transitionDuration: "700ms" }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {[-11, -6, 7, 12].map((lx) => (
        <rect key={lx} x={lx} y={-12} width={2.6} height={12} fill="#57534e" />
      ))}
      <ellipse cy={-18} rx={16} ry={8} fill={coat} stroke={edge} strokeWidth={0.8} />
      <path d="M15 -21q5 -3 4 -8" fill="none" stroke={edge} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M-13 -22l-6 -8" stroke={coat} strokeWidth={6} strokeLinecap="round" />
      <ellipse cx={-21} cy={-31} rx={5.5} ry={4.5} fill={coat} stroke={edge} strokeWidth={0.8} />
      <path d="M-20 -35q2 -6 6 -7M-23 -35q0 -6 3 -8" fill="none" stroke="#78716c" strokeWidth={1.3} strokeLinecap="round" />
      <path d="M-18 -33l6 -1" stroke={edge} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M-24 -27q-1 4 1 6" fill="none" stroke="#a8a29e" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={-22} cy={-32} r={0.9} fill={A_INK} />
    </g>
  );
}

/** A bunch of jackfruit leaves, centred on (0, 0). */
function A_Leaves() {
  return (
    <g className="pointer-events-none">
      {[-40, -15, 10, 35].map((r, i) => (
        <g key={r} transform={`rotate(${r})`}>
          <ellipse cy={-7} rx={3.6} ry={8} fill={["#a16207", "#ca8a04", "#92400e", "#b45309"][i]} />
          <path d="M0 -14V0" stroke="#78350f" strokeWidth={0.6} />
        </g>
      ))}
    </g>
  );
}

export function GoatLeaves({}: Story) {
  const s = useScene(4, [600, 1600, 1600, 1400]);
  const k = s.k;
  const mx = k === 1 ? 168 : 44;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামা ছাগলটার সামনে এক গোছা কাঁঠাল পাতা রেখে যান; ছাগলটা মুখ ফিরিয়ে নেয়">
        <rect x={268} y={112} width={4} height={38} fill="#78350f" />
        <path d="M270 128Q262 142 256 136" fill="none" stroke="#a16207" strokeWidth={1.2} />
        <A_Goat x={246} y={LG} away={k >= 3} />
        <Person who="mama" x={mx} y={LG} facing={k >= 2 ? -1 : 1} walking={k === 1 || k === 2} arm={k === 0 || k === 1 ? "hold" : "down"} ms={1400} label />
        {k <= 1 ? (
          <A_Carry x={mx + 18} y={LG - 44} ms={1400}>
            <A_Leaves />
          </A_Carry>
        ) : (
          <g transform={`translate(208 ${LG - 1}) rotate(80)`} className={FADE}>
            <A_Leaves />
          </g>
        )}
        {k >= 4 && (
          <g className={FADE}>
            <rect x={14} y={14} width={292} height={26} rx={6} fill="white" />
            <text x={160} y={31} textAnchor="middle" fontSize={10} fontWeight={600} fill={A_INK}>
              ছাগলটা পাতা খেলো না, কারণ <tspan fill={A_VIOLET} fontWeight={800}>ওটা</tspan> শুকনা ছিল।
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for screen 9's setup, no task: a kitchen at night, a
//      bowl of milk by the চুলা; the cat walks in. Morning: the cat is gone and
//      the bowl is empty. Nothing is shown in between.

function A_useCalm() {
  const [calm, setCalm] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser's motion setting, which the server render cannot see
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return calm;
}

/** The cat, feet on (0, 0), head to the left; its legs swing while it walks. */
function A_Cat({ walking, run, ms }: { walking: boolean; run: string; ms: number }) {
  const calm = A_useCalm();
  const on = walking && !calm;
  const fur = "#d97706";
  return (
    <g className="pointer-events-none">
      {[-9, 8].map((lx, i) => (
        <g key={lx}>
          <Loop on={on} run={run} ms={ms} type="rotate" values={`${i ? 18 : -18} ${lx + 1} -9;${i ? -18 : 18} ${lx + 1} -9;${i ? 18 : -18} ${lx + 1} -9`} dur={0.4} />
          <rect x={lx} y={-9} width={2.4} height={9} rx={1} fill={fur} />
        </g>
      ))}
      <ellipse cy={-12} rx={13} ry={5.5} fill={fur} />
      <path d="M12 -13q9 -2 8 -14" fill="none" stroke={fur} strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={-13} cy={-18} r={5} fill={fur} />
      <path d="M-17 -21l0 -6l3 4ZM-11 -22l2 -5l1 5Z" fill={fur} />
      <circle cx={-15} cy={-19} r={0.9} fill="#facc15" />
    </g>
  );
}

export function CatKitchen({}: Story) {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  const night = k < 2;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="রাতে বিড়ালটা রান্নাঘরে ঢোকে; সকালে দুধের বাটি খালি, বিড়াল নাই">
        {/* the window: moon by night, sun by morning */}
        <rect x={40} y={34} width={52} height={40} rx={2} fill={night ? "#1e293b" : "#bae6fd"} stroke="#78350f" strokeWidth={2} className="transition-[fill] duration-700 motion-reduce:transition-none" />
        <path d="M66 34V74M40 54H92" stroke="#78350f" strokeWidth={1.4} />
        {!night && <circle cx={53} cy={44} r={5} fill="#facc15" className={FADE} />}
        {/* the চুলা, and the bowl beside it */}
        <path d="M112 150V128q0 -8 8 -8h32q8 0 8 8V150Z" fill="#b45309" />
        <path d="M124 150v-12q12 -9 24 0v12Z" fill="#1c1917" />
        <path d="M180 139h34l-4 11h-26Z" fill="#e7e5e4" stroke="#78716c" strokeWidth={0.8} />
        {night && <ellipse cx={197} cy={139.5} rx={16} ry={2.4} fill="white" />}
        {night && (
          <A_Carry x={k >= 1 ? 222 : 352} y={LG} ms={1600}>
            <A_Cat walking={k === 1} run={`${k}`} ms={1600} />
          </A_Carry>
        )}
        {/* the night over the room, and the moon above it */}
        <rect width={320} height={180} fill="#0f172a" opacity={night ? 0.45 : 0} className="pointer-events-none transition-opacity duration-700 motion-reduce:transition-none" />
        {night && <path d="M79 42a6 6 0 1 0 5 9a5 5 0 1 1 -5 -9Z" fill="#fde68a" />}
      </Stage>
    </StoryFrame>
  );
}

// ===========================================================================
// Explanation figures, one or two per <Then>, numbered after their screen.

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the হাট's box needs two
//      lists; it runs, 444. Then words come instead of lists: গরু × খড়? The
//      box jams. The question is left open for screen 2.

const F1_SAY = [
  "হাটের dot product: দুইটা list of numbers। চাল, তেল, ডিম কতটুকু কেনা, আর দাম কত।",
  "ঘরে ঘরে গুণ, তারপর যোগ: 444 টাকা।",
  "ChatGPT এর কাছে আসে শব্দ: গরু, খড়।",
  "গরুর সাথে খড়ের গুণ? শব্দের সাথে শব্দের গুণ হয় কেমনে?",
];

export function WordTimesWord() {
  const s = useScene(3, [600, 2800, 1800]);
  const k = s.k;
  const row = (label: string, v: readonly (number | string)[], tone: string) => (
    <div className="flex items-center gap-2">
      <span className="w-12 text-right text-xs text-muted">{label}</span>
      <div className="flex gap-1">
        {v.map((x, i) => (
          <span key={`${i}${x}`} className={`${POP} inline-grid min-w-9 place-items-center rounded-md px-1.5 py-0.5 font-mono text-sm ${tone}`}>
            {x}
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <Scene scene={s} caption={say(F1_SAY, k)}>
      <div className="mx-auto grid min-h-[6.5rem] w-full max-w-xs content-center justify-items-center gap-1.5">
        {k < 2 ? (
          <>
            {row("পরিমাণ", [2, 1, 12], "bg-cat-blue/10")}
            {row("দাম", [60, 180, 12], "bg-cat-amber/15")}
            {k === 1 && (
              <div className="mt-1 text-sm">
                <BoxRun a={[2, 1, 12]} b={[60, 180, 12]} inline ms={700} />
              </div>
            )}
          </>
        ) : (
          <div key="words" className={`${FADE} flex items-center gap-3 text-lg`}>
            <span className="rounded-lg bg-cat-blue/10 px-3 py-1">গরু</span>
            <span className="font-mono text-muted">×</span>
            <span className="rounded-lg bg-cat-teal/10 px-3 py-1">খড়</span>
            <span className="font-mono text-muted">=</span>
            {k >= 3 ? <b className={`${POP} inline-block font-mono text-2xl text-danger`}>?</b> : <span className="font-mono text-muted">…</span>}
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: king and queen as two
//      spots on the map, then as two lists, then the box runs on them: 52.16.
//      Words are lists, so words can be boxed.

const F2_SAY = [
  "Map এ দুইটা শব্দ, দুইটা জায়গা।",
  "জায়গা মানে দুইটা number। king (2.6, 5.9), queen (6.9, 5.8).",
  "দুইটা list, তাই dot product ও চলে: 52.16.",
];

export function WordBox() {
  const s = useScene(2, [600, 2400]);
  const k = s.k;
  const K = [2.6, 5.9];
  const Q = [6.9, 5.8];
  return (
    <Scene scene={s} caption={say(F2_SAY, k)}>
      <div className="mx-auto flex w-full max-w-xs items-center gap-3">
        <svg viewBox="0 0 100 80" role="img" aria-label="Map এ king আর queen, দুইটা জায়গা" className="block h-auto w-full max-w-[6.5rem] shrink-0">
          <rect x={1} y={1} width={98} height={78} rx={6} fill="white" stroke="#cbd5e1" />
          <path d="M8 72H96M8 72V4" stroke={A_INK} strokeOpacity={0.3} />
          {[
            { w: "king", v: K },
            { w: "queen", v: Q },
          ].map((d) => (
            <g key={d.w}>
              {k >= 1 && <path d={`M${8 + d.v[0] * 10} 72V${72 - d.v[1] * 10}M8 ${72 - d.v[1] * 10}H${8 + d.v[0] * 10}`} stroke={A_AMBER} strokeWidth={0.8} strokeDasharray="2 2" className={FADE} />}
              <circle cx={8 + d.v[0] * 10} cy={72 - d.v[1] * 10} r={2.6} fill={A_INK} />
              <text x={8 + d.v[0] * 10} y={66 - d.v[1] * 10} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={A_INK} fontFamily="ui-monospace, monospace">
                {d.w}
              </text>
            </g>
          ))}
        </svg>
        <div className="grid min-w-0 gap-1 text-sm">
          {k >= 1 && (
            <div className={`${FADE} font-mono text-xs`}>
              king {tupN(K)}
              <br />
              queen {tupN(Q)}
            </div>
          )}
          {k >= 2 && (
            <div className="text-[0.8rem]">
              <BoxRun a={K} b={Q} inline ms={700} />
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the toy's two slots, and
//      each word's card landing as an arrow: গরু (3, 1), খড় (0, 3), খেলো (1, 1).

const F3_SAY = [
  "খেলনা sheet: ডানে প্রাণী slot, উপরে খাবার slot।",
  "গরু: প্রাণী 3, খাবার 1।",
  "খড়: প্রাণী 0, খাবার 3।",
  "খেলো: দুইটাতেই একটু একটু, (1, 1)।",
];

export function TwoSlots() {
  const s = useScene(3, [600, 1600, 1600]);
  const k = s.k;
  const { x: ox, y: oy } = K_O;
  return (
    <Scene scene={s} caption={say(F3_SAY, k)}>
      <svg viewBox="0 0 112 106" role="img" aria-label="দুই slot এর sheet; গরু, খড় আর খেলো এর card arrow হয়ে বসে" className="mx-auto block h-auto w-full max-w-[9rem]">
        <rect x={1} y={1} width={110} height={104} rx={8} fill="white" stroke="#cbd5e1" />
        <path d={`M${ox} ${oy}H108M${ox} ${oy}V6`} stroke={A_INK} strokeOpacity={0.35} />
        <text x={108} y={oy - 3} textAnchor="end" fontSize={6.5} fontWeight={700} fill="#475569">
          প্রাণী
        </text>
        <text x={ox + 3} y={11} fontSize={6.5} fontWeight={700} fill="#475569">
          খাবার
        </text>
        {W4_KEYS.map((w, i) =>
          k > i ? (
            <g key={w.w} className={FADE}>
              <A_Arr x1={ox} y1={oy} x2={ox + w.key[0] * K_SC} y2={oy - w.key[1] * K_SC} color={K_TONE[i]} w={k === i + 1 ? 3 : 2} />
              <text
                x={w.key[0] >= 2 ? 108 : ox + w.key[0] * K_SC + (w.key[0] === 0 ? 4 : 2)}
                y={oy - w.key[1] * K_SC + (w.key[0] === 0 ? 6 : w.key[0] >= 2 ? 12 : -3)}
                textAnchor={w.key[0] >= 2 ? "end" : "start"}
                fontSize={7}
                fontWeight={700}
                fill={K_TONE[i]}
              >
                {w.w} {tupN(w.key)}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the keys as arrows; the
//      query points at প্রাণী and the biggest box is গরু (6); the query swings
//      to খাবার and খড় wins (6). Query and key named in the captions.

const F4_SAY = [
  "প্রতিটা শব্দের key, একটা arrow: আমি কেমন জিনিস।",
  "পেট ভরা হয় প্রাণীর। ওটার query তাক করা প্রাণী slot এ।",
  "Dot product সবচেয়ে বড় গরুর সাথে, 6। ওটা মানে গরু।",
  "পচা হয় খাবার। Query ঘুরে গেলো খাবার slot এ।",
  "এবার dot product সবচেয়ে বড় খড়ের সাথে। জিতলো খড়।",
];

export function QueryKeys() {
  const s = useScene(4, [600, 1800, 2000, 1800]);
  const k = s.k;
  const round = k >= 3 ? 1 : 0;
  const q = W4_ROUNDS[round].q;
  const scored = k === 2 || k >= 4;
  return (
    <Scene scene={s} caption={say(F4_SAY, k)}>
      <KeyPanel keys={W4_KEYS} q={k >= 1 ? q : null} show={W4_KEYS.map(() => scored)} win={scored ? W4_ROUNDS[round].ans : null} />
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the toy card of two
//      slots grows into a long strip of many; nobody names the slots, the
//      machine set every number itself.

const F5_SAY = [
  "খেলনায় গরুর card এ দুইটা slot: (3, 1)।",
  "আসল model এ slot শত শত।",
  "কোন slot এর মানে কী, কেউ নাম দেয় নাই। সব number machine এর শেখা।",
];
const F5_N = 72;
const F5_TONE = ["bg-cat-blue/60", "bg-cat-amber/60", "bg-cat-teal/60", "bg-cat-violet/50", "bg-cat-coral/50"];

export function LongStrips() {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(F5_SAY, k)}>
      <div className="mx-auto grid min-h-[5.5rem] w-full max-w-xs content-center justify-items-center gap-2">
        <div className="text-sm font-semibold">গরু</div>
        {k === 0 ? (
          <div className="flex gap-1">
            <span className="grid h-7 w-10 place-items-center rounded-md bg-cat-blue/15 font-mono text-sm">3</span>
            <span className="grid h-7 w-10 place-items-center rounded-md bg-cat-teal/15 font-mono text-sm">1</span>
          </div>
        ) : (
          <div className="flex max-w-[16rem] flex-wrap justify-center gap-0.5">
            {Array.from({ length: F5_N }, (_, i) => (
              <span
                key={i}
                style={{ transitionDelay: `${i * 12}ms` }}
                className={`${POP} inline-block h-3.5 w-2.5 rounded-sm ${F5_TONE[k >= 2 ? (i * 7 + 3) % 5 : (i * 3) % 5]} transition-colors duration-500 motion-reduce:transition-none`}
              />
            ))}
            <span className="text-xs text-muted">…</span>
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the name lands, one word
//      at a time — attention, dot-product (and under it, the হাট's box, the
//      same one), scaled (the box divided by one fixed number).

const F6_SAY = [
  "সবাই সবার দিকে তাকায়, আর বেছে নেয় কার দিকে বেশি মন দিবে। নাম attention.",
  "কীভাবে বাছে? Dot product দিয়ে। হাটের সেই হিসাবটাই।",
  "Scaled মানে dot product এর number টাকে একটা fixed number দিয়ে ভাগ। কেন? যাতে বেশি বড় না হয়ে যায়।",
];

export function NameLands() {
  const s = useScene(2, [600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(F6_SAY, k)}>
      <div className="mx-auto grid min-h-[5.5rem] w-full max-w-xs content-center justify-items-center gap-2">
        <div className="flex flex-wrap items-baseline justify-center gap-x-1.5 font-mono text-base font-bold">
          {k >= 2 && <span className={`${POP} inline-block text-cat-violet`}>scaled</span>}
          {k >= 1 && <span className={`${POP} inline-block text-[#b45309]`}>dot-product</span>}
          <span>attention</span>
        </div>
        {k >= 1 && (
          <div className={`${FADE} rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-3 py-1 text-sm`}>
            <BoxRun a={[2, 0]} b={[3, 1]} inline ms={600} />
            <span className="ml-2 text-xs text-muted">ওটা · গরু</span>
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: one neuron, a box
//      inside; a column of them; many columns, all lit. Millions of boxes.

const F7_SAY = [
  "একটা neuron। ভিতরে একটা dot product.",
  "পাশাপাশি অনেকগুলো neuron।",
  "সারির পর সারি। প্রতিটার ভিতরে একটা করে dot product।",
  "ChatGPT এ এরকম neuron কোটি কোটি।",
];

export function ManyNeurons() {
  const s = useScene(3, [600, 1400, 1600]);
  const k = s.k;
  const cols = k === 0 ? 1 : k === 1 ? 1 : 6;
  const rows = k === 0 ? 1 : 5;
  return (
    <Scene scene={s} caption={say(F7_SAY, k)}>
      <svg viewBox="0 0 220 100" role="img" aria-label="Neuron এর সারি, প্রতিটার ভিতরে একটা dot product" className="mx-auto block h-auto w-full max-w-[16rem]">
        {Array.from({ length: cols }, (_, c) =>
          Array.from({ length: rows }, (__, r) => {
            const cx = cols === 1 ? 110 : 25 + c * 34;
            const cy = rows === 1 ? 50 : 12 + r * 19;
            const big = cols === 1 && rows === 1;
            return (
              <g key={`${c}${r}`} className={POP} style={{ transitionDelay: `${(c * rows + r) * 30}ms` }}>
                {c > 0 &&
                  Array.from({ length: rows }, (___, r2) => (
                    <path key={r2} d={`M${cx - 34 + 7} ${12 + r2 * 19}L${cx - 7} ${cy}`} stroke={A_SLATE} strokeOpacity={0.18} strokeWidth={0.6} />
                  ))}
                <circle cx={cx} cy={cy} r={big ? 26 : 7} fill={k >= 3 ? "#fde68a" : "white"} stroke={A_VIOLET} strokeWidth={big ? 2 : 1.2} className="transition-[fill] duration-500 motion-reduce:transition-none" />
                <rect x={cx - (big ? 23 : 3.5)} y={cy - (big ? 8 : 2.5)} width={big ? 46 : 7} height={big ? 16 : 5} rx={big ? 3 : 1} fill="#fef3c7" stroke="#b45309" strokeWidth={big ? 1.2 : 0.6} />
                {big && (
                  <text x={cx} y={cy + 3} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#92400e">
                    dot product
                  </text>
                )}
              </g>
            );
          }),
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the হাট's bill and the
//      ছাগল sentence's box side by side, both run the same way: pair, multiply,
//      add. Same box, other lists.

const F8_SAY = [
  "হাটের বিল: পরিমাণ আর দাম।",
  "ঘরে ঘরে গুণ, তারপর যোগ: 444।",
  "ওটার query আর পাতার key।",
  "ঘরে ঘরে গুণ, তারপর যোগ: 6।",
  "একই কাজ, একই dot product। শুধু list দুইটা আলাদা।",
];

export function SameBox() {
  const s = useScene(4, [600, 2400, 1400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(F8_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs gap-2 text-sm">
        <div className={`rounded-xl border-2 px-3 py-1.5 transition-colors duration-300 motion-reduce:transition-none ${k <= 1 ? "border-cat-amber/50 bg-cat-amber/5" : "border-border"}`}>
          <div className="text-xs text-muted">হাট</div>
          <div className="font-mono">{k >= 1 ? <BoxRun a={[2, 1, 12]} b={[60, 180, 12]} inline ms={600} /> : "(2, 1, 12) · (60, 180, 12)"}</div>
        </div>
        {k >= 2 && (
          <div className={`${FADE} rounded-xl border-2 px-3 py-1.5 ${k >= 2 ? "border-cat-violet/50 bg-cat-violet/5" : ""}`}>
            <div className="text-xs text-muted">ওটা · পাতা</div>
            <div className="font-mono">{k >= 3 ? <BoxRun a={[0, 2]} b={[0, 3]} inline ms={600} /> : "(0, 2) · (0, 3)"}</div>
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for screen 9's explanation, no task: the query (1, 0) and
//      দুধ's key (0, 3) stand at a right angle; the box runs to 0; 4.2's van,
//      pushed side-on, doesn't move.

const F9_SAY = [
  "Query (1, 0) আর দুধের key (0, 3).",
  "দুইটা arrow right angle এ।",
  "Dot product: 1 × 0 + 0 × 3 = 0.",
  "4.2 এর ভ্যানের মতো। পাশ থেকে ধাক্কা দিলে ভ্যান এক চুলও আগায় না।",
];

export function RightAngleZero() {
  const s = useScene(3, [600, 1400, 1800]);
  const k = s.k;
  const ox = 24;
  const oy = 90;
  return (
    <Scene scene={s} caption={say(F9_SAY, k)}>
      <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-3">
        {k < 3 ? (
          <svg viewBox="0 0 110 100" role="img" aria-label="Query আর দুধের key, right angle এ" className="block h-auto w-full max-w-[7.5rem]">
            <rect x={1} y={1} width={108} height={98} rx={8} fill="white" stroke="#cbd5e1" />
            <A_Arr x1={ox} y1={oy} x2={ox + 60} y2={oy} color={A_VIOLET} dashed />
            <A_Arr x1={ox} y1={oy} x2={ox} y2={oy - 72} color={A_BLUE} />
            <text x={ox + 60} y={oy - 5} textAnchor="end" fontSize={7} fontWeight={700} fill={A_VIOLET}>
              query
            </text>
            <text x={ox + 5} y={oy - 64} fontSize={7} fontWeight={700} fill={A_BLUE}>
              দুধ
            </text>
            {k >= 1 && <path d={`M${ox + 10} ${oy}V${oy - 10}H${ox}`} fill="none" stroke={A_CORAL} strokeWidth={1.4} className={FADE} />}
          </svg>
        ) : (
          <svg viewBox="0 0 150 70" role="img" aria-label="4.2 এর ভ্যান, পাশ থেকে ধাক্কা, নড়ে না" className={`${FADE} block h-auto w-full max-w-[10rem]`}>
            <rect x={1} y={1} width={148} height={68} rx={8} fill="white" stroke="#cbd5e1" />
            <path d="M8 56H142" stroke={A_INK} strokeOpacity={0.3} />
            <rect x={48} y={30} width={56} height={18} rx={3} fill="#0ea5e9" />
            <circle cx={60} cy={50} r={5} fill="#1f2937" />
            <circle cx={92} cy={50} r={5} fill="#1f2937" />
            <A_Arr x1={76} y1={8} x2={76} y2={27} color={A_CORAL} w={2.4} />
            <A_Arr x1={112} y1={40} x2={136} y2={40} color={A_SLATE} w={1.4} dashed op={0.5} />
            <text x={124} y={33} textAnchor="middle" fontSize={8} fontWeight={800} fill={A_INK} fontFamily="ui-monospace, monospace">
              0
            </text>
          </svg>
        )}
        {k >= 2 && k < 3 && (
          <div className="text-sm">
            <BoxRun a={[1, 0]} b={[0, 3]} inline ms={600} />
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for the ending's explanation, no task: Module 1 in one run.
//       Titanic and Mr. Bean become lists (Article 1), arrows (2), get their
//       lengths (3), the angle between (4), and last the lengths are divided
//       away so only direction is left: cos θ = 0.59.

const F10_F = [
  { name: "Titanic", v: [5, 2] },
  { name: "Mr. Bean", v: [1, 4] },
];
const F10_TONE = [A_BLUE, A_TEAL];
const F10_O = { x: 126, y: 108 };
const F10_SC = 19;
const F10_R = 70;
const F10_COS = dot(F10_F[0].v, F10_F[1].v) / (len(F10_F[0].v) * len(F10_F[1].v));
const F10_SAY = [
  "দুইটা জিনিস: Titanic আর Mr. Bean.",
  "Article 1: জিনিসকে সংখ্যার list বানানো।",
  "Article 2: সেই list কে arrow হিসাবে দেখা।",
  "Article 3: arrow এর length মাপা।",
  "Article 4: দুইটা arrow কতটা একই দিকে।",
  `Length ভাগ দিয়ে ফেলে দিলে থাকে শুধু direction: cos θ = ${fix(F10_COS, 2)}.`,
];

export function FourArticles() {
  const s = useScene(5, [600, 1600, 1600, 1600, 1800]);
  const k = s.k;
  const [p] = useTween([k >= 5 ? 1 : 0], 1200);
  const { x: ox, y: oy } = F10_O;
  const tip = (v: readonly number[]) => {
    const a = Math.atan2(v[1], v[0]);
    const tx = v[0] * F10_SC;
    const ty = v[1] * F10_SC;
    return [ox + tx + (F10_R * Math.cos(a) - tx) * p, oy - (ty + (F10_R * Math.sin(a) - ty) * p)] as const;
  };
  const a0 = Math.atan2(F10_F[0].v[1], F10_F[0].v[0]);
  const a1 = Math.atan2(F10_F[1].v[1], F10_F[1].v[0]);
  return (
    <Scene scene={s} caption={say(F10_SAY, k)}>
      <svg viewBox="0 0 240 116" role="img" aria-label="Titanic আর Mr. Bean: list, arrow, length, angle, শেষে শুধু direction" className="mx-auto block h-auto w-full max-w-[18rem]">
        {F10_F.map((f, i) => (
          <g key={f.name}>
            <text x={6} y={22 + i * 34} fontSize={9} fontWeight={700} fill={F10_TONE[i]}>
              {f.name}
            </text>
            {k >= 1 && (
              <text x={6} y={34 + i * 34} fontSize={8.5} fontFamily="ui-monospace, monospace" fill={A_INK} className={FADE}>
                {tupN(f.v)}
                {k >= 3 && k < 5 ? `  length ${fix(len(f.v), 2)}` : ""}
              </text>
            )}
          </g>
        ))}
        {k >= 2 && (
          <g className={FADE}>
            <rect x={112} y={4} width={124} height={110} rx={8} fill="white" stroke="#cbd5e1" />
            <path d={`M${ox} ${oy}H232M${ox} ${oy}V10`} stroke={A_INK} strokeOpacity={0.3} />
            {k >= 5 && <path d={`M${ox + F10_R} ${oy}A${F10_R} ${F10_R} 0 0 0 ${ox} ${oy - F10_R}`} fill="none" stroke={A_INK} strokeOpacity={0.2} strokeDasharray="3 3" />}
            {F10_F.map((f, i) => {
              const [x2, y2] = tip(f.v);
              return <A_Arr key={f.name} x1={ox} y1={oy} x2={x2} y2={y2} color={F10_TONE[i]} w={k === 3 ? 3.4 : 2.4} />;
            })}
            {k >= 4 && (
              <path
                d={`M${ox + 30 * Math.cos(a0)} ${oy - 30 * Math.sin(a0)}A30 30 0 0 0 ${ox + 30 * Math.cos(a1)} ${oy - 30 * Math.sin(a1)}`}
                fill="none"
                stroke={A_AMBER}
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
            {`cos θ = ${fix(F10_COS, 2)}`}
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10¾ · A figure for the ending's notation side quest, no task: 4.1's
//       (1, 2) and (3, 4), and the four ways books write the same box. Each
//       spelling lands on the same 11.

const F10S_SPELL = ["u · v", "Σ uᵢvᵢ", "uᵀv", "⟨u, v⟩"];
const F10S_SAY = [
  "4.1 এর দুইটা list। ঘরে ঘরে গুণ, তারপর যোগ: 11।",
  "u · v: dot দিয়ে লেখা।",
  "Σ uᵢvᵢ: loop হিসাবে লেখা।",
  "uᵀv: paper গুলোর প্রিয় লেখা।",
  "⟨u, v⟩: ভারী বইয়ে inner product। চার রকম লেখা, একই 11।",
];

export function FourSpellings() {
  const s = useScene(4, [600, 1500, 1500, 1500]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(F10S_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs gap-1.5 font-mono text-sm">
        <div className="text-center">
          u = (1, 2)&nbsp;&nbsp; v = (3, 4)
          <div className="text-muted">
            <BoxRun a={[1, 2]} b={[3, 4]} inline />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {F10S_SPELL.map((t, i) =>
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
// 11½ · A figure for the look-ahead's first half, no task: 3.3's recipe as
//       arrows. Two ingredients u and v; every mix of them lands on a grid of
//       spots (span); a third, w = u + 2v, lands on a spot they already reach
//       (extra: independence); u and v alone are the fewest that reach
//       everything (basis).

const F11_O = { x: 60, y: 104 };
const F11_U = [34, -10] as const;
const F11_V = [12, -30] as const;
const F11_DOTS = (() => {
  const out: [number, number][] = [];
  for (let a = -4; a <= 10; a++)
    for (let b = -4; b <= 8; b++) {
      const x = F11_O.x + (a / 2) * F11_U[0] + (b / 2) * F11_V[0];
      const y = F11_O.y + (a / 2) * F11_U[1] + (b / 2) * F11_V[1];
      if (x > 8 && x < 232 && y > 8 && y < 112) out.push([x, y]);
    }
  return out;
})();
const F11_SAY = [
  "দুইটা উপকরণ, u আর v।",
  "মিশিয়ে কোথায় কোথায় পৌঁছানো যায়? এই সবটার নাম span।",
  "তৃতীয় উপকরণ w, u আর v দিয়েই বানানো। তাই বাড়তি। এই প্রশ্নের নাম independence।",
  "সবচেয়ে কম কয়টা লাগে? এখানে দুইটা, u আর v। এর নাম basis।",
];

export function SpanRecipe() {
  const s = useScene(3, [600, 1800, 2600]);
  const k = s.k;
  const { x: ox, y: oy } = F11_O;
  const wx = ox + F11_U[0] + 2 * F11_V[0];
  const wy = oy + F11_U[1] + 2 * F11_V[1];
  return (
    <Scene scene={s} caption={say(F11_SAY, k)}>
      <svg viewBox="0 0 240 120" role="img" aria-label="u আর v মিশিয়ে একগাদা জায়গা; w বাড়তি; u আর v ই basis" className="mx-auto block h-auto w-full max-w-[18rem]">
        <rect x={1} y={1} width={238} height={118} rx={10} fill="white" stroke="#cbd5e1" />
        {k >= 1 && F11_DOTS.map(([x, y]) => <circle key={`${x},${y}`} cx={x} cy={y} r={1.4} fill={A_INK} opacity={0.3} className={FADE} />)}
        {k === 2 && (
          <g className={FADE}>
            <path d={`M${ox + F11_U[0]} ${oy + F11_U[1]}l${2 * F11_V[0]} ${2 * F11_V[1]}`} stroke={A_TEAL} strokeWidth={1.4} strokeDasharray="3 2" />
            <A_Arr x1={ox} y1={oy} x2={wx} y2={wy} color={A_AMBER} w={2.6} dashed />
            <text x={wx + 4} y={wy + 3} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#b45309">
              w
            </text>
          </g>
        )}
        <A_Arr x1={ox} y1={oy} x2={ox + F11_U[0]} y2={oy + F11_U[1]} color={A_BLUE} w={k >= 3 ? 3.2 : 2.4} />
        <A_Arr x1={ox} y1={oy} x2={ox + F11_V[0]} y2={oy + F11_V[1]} color={A_TEAL} w={k >= 3 ? 3.2 : 2.4} />
        <text x={ox + F11_U[0] + 3} y={oy + F11_U[1] + 10} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8">
          u
        </text>
        <text x={ox + F11_V[0] - 9} y={oy + F11_V[1] + 2} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#0f766e">
          v
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11¾ · A figure for the look-ahead's second half, no task: one list against
//       x is one box, one number; stack many lists and it's a matrix, many
//       boxes at once. Last, the open question: a cloud of data with two slots
//       that nearly lies on one line. How many directions does it need?

const F11B_ROWS = [0, 1, 2, 3];
const F11B_CLOUD = [
  [18, 92], [30, 84], [42, 79], [52, 70], [64, 66], [74, 57], [88, 52], [98, 43], [110, 38], [122, 30], [36, 76], [80, 61], [104, 46], [60, 72],
] as const;
const F11B_SAY = [
  "একটা list আর x: একটা dot product, একটা number.",
  "অনেকগুলো list একসাথে সাজালে matrix।",
  "Matrix মানে একসাথে একগাদা dot product, একগাদা number।",
  "আর আমার data র আসলে কয়টা direction লাগে?",
];

export function MatrixBoxes() {
  const s = useScene(3, [600, 1600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(F11B_SAY, k)}>
      {k < 3 ? (
        <div className="mx-auto flex w-fit items-center gap-2">
          <div className={`grid gap-1 rounded-lg p-1 ${k >= 1 ? "ring-2 ring-cat-blue/40" : ""}`}>
            {F11B_ROWS.filter((r) => r === 0 || k >= 1).map((r) => (
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
            {F11B_ROWS.filter((r) => r === 0 || k >= 2).map((r) => (
              <span key={r} className={`${POP} inline-block size-4 rounded-full bg-accent/60`} />
            ))}
          </div>
        </div>
      ) : (
        <svg viewBox="0 0 140 104" role="img" aria-label="দুই slot এর data, প্রায় একটা line এ; কয়টা direction লাগে?" className={`${FADE} mx-auto block h-auto w-full max-w-[10rem]`}>
          <rect x={1} y={1} width={138} height={102} rx={8} fill="white" stroke="#cbd5e1" />
          <path d="M10 96H134M10 96V6" stroke={A_INK} strokeOpacity={0.3} />
          {F11B_CLOUD.map(([x, y]) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r={2.6} fill={A_BLUE} opacity={0.7} />
          ))}
          <text x={126} y={82} textAnchor="middle" fontSize={20} fontWeight={800} fill={A_CORAL}>
            ?
          </text>
        </svg>
      )}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¼ · A figure for screen 3's explanation, first paragraph, no task: the two
//      sentences one above the other. The rule missed on one and hit on the
//      other; গরু and খড় sit in the same places in both; only the ending
//      differs; পেট ভরা goes with a প্রাণী, পচা with a খাবার.

const F3A_SAY = [
  "নিয়মটা একবার মিললো, একবার মিললো না।",
  "অথচ দুইটা বাক্যেই গরু আর খড় একই জায়গায় বসা।",
  "বদলেছে শুধু শেষের কথাটা।",
  "পেট ভরা হয় প্রাণীর।",
  "পচা হয় খাবার।",
];
/** where the ending starts in each of R3's sentences */
const F3A_END = [6, 6];

/** a drawn tick or cross, so it never renders as an emoji */
function A_Mark({ ok }: { ok: boolean }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className={`${POP} block size-3.5 shrink-0`}>
      <path d={ok ? "M2 6.5l2.6 2.6L10 3" : "M3 3l6 6M9 3l-6 6"} fill="none" stroke={ok ? "#16a34a" : A_CORAL} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EndingFlips() {
  const s = useScene(4, [600, 2200, 1600, 1800, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(F3A_SAY, k)}>
      <div className="mx-auto grid w-full max-w-xs gap-2">
        {R3.map((row, r) => {
          const kind = r === 0 ? k >= 3 : k >= 4;
          return (
            <div key={row.tick} className="grid gap-0.5">
              <div className="flex items-center gap-1">
                <span className="w-3.5 shrink-0">{k === 0 && <A_Mark ok={row.ok} />}</span>
                <div className="flex flex-wrap gap-x-0.5 whitespace-nowrap text-[0.85rem]">
                  {row.words.map((w, i) => {
                    const place = k === 1 && i <= R3_STOP;
                    const end = k >= 2 && i >= F3A_END[r];
                    const who = kind && i === (r === 0 ? 0 : R3_STOP);
                    return (
                      <span
                        key={`${i}${w}`}
                        className={`rounded px-0.5 transition-colors duration-300 motion-reduce:transition-none ${
                          who ? (r === 0 ? "bg-cat-blue/20 font-semibold text-cat-blue" : "bg-cat-teal/20 font-semibold text-cat-teal") : place ? "bg-cat-amber/25 ring-1 ring-cat-amber" : end ? "bg-cat-violet/15 text-cat-violet" : ""
                        }`}
                      >
                        {w}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="min-h-4 pl-5 text-xs">
                {kind && (
                  <span className={`${FADE} ${r === 0 ? "text-cat-blue" : "text-cat-teal"}`}>
                    {r === 0 ? "পেট ভরা হয় প্রাণীর: গরু" : "পচা হয় খাবার: খড়"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10⅞ · A figure for the ending's first side quest, no task: the formula at
//       work, three times. A search engine, a film app, a chatbot: the thing
//       asked is a dashed arrow, the candidates are arrows, and the one most in
//       the same direction glides to the top of the list.

type F10Q = { name: string; ask: string; item: "page" | "film" | "para"; q: number; c: [number, number][]; win: number };
const F10Q_APPS: F10Q[] = [
  { name: "Search engine", ask: "প্রশ্ন", item: "page", q: 38, c: [[78, 34], [42, 26], [8, 36]], win: 1 },
  { name: "Film এর app", ask: "পছন্দের film", item: "film", q: 62, c: [[20, 30], [85, 36], [58, 38]], win: 2 },
  { name: "Chatbot", ask: "প্রশ্ন", item: "para", q: 22, c: [[25, 24], [66, 38], [0, 32]], win: 0 },
];
const F10Q_TONE = [A_BLUE, A_TEAL, A_SLATE];
const F10Q_SAY = [
  "Search engine: আপনার প্রশ্ন একটা arrow। প্রতিটা page ও একটা arrow।",
  "প্রশ্নের সাথে যে page সবচেয়ে একই দিকে, সেটা উঠে আসে সবার উপরে।",
  "Film এর app: আপনার পছন্দের film একটা arrow, বাকি film গুলোও।",
  "যে film সবচেয়ে একই দিকে, সেটাই আসে আপনার সামনে।",
  "Chatbot: আপনার প্রশ্ন একটা arrow, প্রতিটা paragraph একটা arrow।",
  "যে paragraph প্রশ্নের সাথে সবচেয়ে একই দিকে, উত্তর খোঁজে ওখানে।",
];

function F10Q_Item({ kind, tone, lit }: { kind: F10Q["item"]; tone: string; lit: boolean }) {
  return (
    <g>
      <rect x={-15} y={-10} width={30} height={20} rx={3} fill={lit ? "#dcfce7" : "white"} stroke={lit ? "#16a34a" : tone} strokeWidth={lit ? 1.8 : 1.2} />
      {kind === "film" ? (
        <>
          {[-11, -5, 1, 7].map((x) => (
            <g key={x}>
              <rect x={x} y={-8} width={3} height={2.4} fill={tone} />
              <rect x={x} y={5.6} width={3} height={2.4} fill={tone} />
            </g>
          ))}
          <path d="M-2 -3.5V3.5L4 0Z" fill={tone} />
        </>
      ) : (
        [-5, 0, 5].map((y, i) => <path key={y} d={`M-10 ${y}H${kind === "para" && i === 2 ? 2 : 10}`} stroke={tone} strokeWidth={1.4} strokeLinecap="round" />)
      )}
    </g>
  );
}

function F10Q_Ask({ app }: { app: F10Q }) {
  return (
    <g>
      {app.item === "page" && (
        <g>
          <rect x={4} y={34} width={70} height={16} rx={8} fill="white" stroke={A_VIOLET} strokeWidth={1.2} />
          <circle cx={62} cy={42} r={3.4} fill="none" stroke={A_VIOLET} strokeWidth={1.3} />
          <path d="M64.5 44.5l3 3" stroke={A_VIOLET} strokeWidth={1.3} strokeLinecap="round" />
        </g>
      )}
      {app.item === "film" && (
        <g>
          <rect x={20} y={30} width={38} height={24} rx={3} fill="white" stroke={A_VIOLET} strokeWidth={1.2} />
          <path d="M39 48c-7 -5 -9 -8 -6 -11c2 -2 5 -1 6 1c1 -2 4 -3 6 -1c3 3 1 6 -6 11Z" fill={A_VIOLET} />
        </g>
      )}
      {app.item === "para" && (
        <g>
          <path d="M8 30h62a4 4 0 0 1 4 4v14a4 4 0 0 1 -4 4H26l-8 7v-7H8a4 4 0 0 1 -4 -4V34a4 4 0 0 1 4 -4Z" fill="white" stroke={A_VIOLET} strokeWidth={1.2} />
          <text x={39} y={46} textAnchor="middle" fontSize={11} fontWeight={800} fill={A_VIOLET}>
            ?
          </text>
        </g>
      )}
      <text x={39} y={16} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={A_INK}>
        {app.name}
      </text>
      <text x={39} y={72} textAnchor="middle" fontSize={7.5} fill="#475569">
        {app.ask}
      </text>
    </g>
  );
}

export function EverydayMatch() {
  const s = useScene(5, [600, 2400, 2000, 2400, 2000, 2400]);
  const k = s.k;
  const a = Math.min(2, Math.floor(k / 2));
  const app = F10Q_APPS[a];
  const matched = k % 2 === 1;
  const ox = 94;
  const oy = 94;
  const R = (deg: number, l: number) => [ox + 1.7 * l * Math.cos((deg * Math.PI) / 180), oy - 1.7 * l * Math.sin((deg * Math.PI) / 180)] as const;
  // the list on the right: the winner rises to the top once matched
  const order = matched ? [app.win, ...[0, 1, 2].filter((i) => i !== app.win)] : [0, 1, 2];
  const [qx, qy] = R(app.q, 44);
  return (
    <Scene scene={s} caption={say(F10Q_SAY, k)}>
      <svg key={a} viewBox="0 0 250 104" role="img" aria-label={`${app.name}: ${app.ask} একটা arrow, সবচেয়ে একই দিকের জিনিসটা উপরে ওঠে`} className={`${FADE} mx-auto block h-auto w-full max-w-[18rem]`}>
        <rect x={1} y={1} width={248} height={102} rx={8} fill="white" stroke="#cbd5e1" />
        <F10Q_Ask app={app} />
        <path d={`M${ox} ${oy}H${ox + 76}M${ox} ${oy}V${oy - 80}`} stroke={A_INK} strokeOpacity={0.25} />
        {app.c.map(([deg, l], i) => {
          const [x2, y2] = R(deg, l);
          return <A_Arr key={i} x1={ox} y1={oy} x2={x2} y2={y2} color={matched && i === app.win ? "#16a34a" : F10Q_TONE[i]} w={matched && i === app.win ? 3 : 2} op={matched && i !== app.win ? 0.4 : 1} />;
        })}
        <A_Arr x1={ox} y1={oy} x2={qx} y2={qy} color={A_VIOLET} w={2.2} dashed />
        {matched && (
          <path
            d={`M${ox + 30 * Math.cos((app.q * Math.PI) / 180)} ${oy - 30 * Math.sin((app.q * Math.PI) / 180)}A30 30 0 0 ${app.c[app.win][0] > app.q ? 0 : 1} ${R(app.c[app.win][0], 30 / 1.7).join(" ")}`}
            fill="none"
            stroke={A_AMBER}
            strokeWidth={1.6}
            className={FADE}
          />
        )}
        {[0, 1, 2].map((i) => (
          <A_Carry key={i} x={218} y={22 + order.indexOf(i) * 30} ms={900}>
            <F10Q_Item kind={app.item} tone={F10Q_TONE[i]} lit={matched && i === app.win} />
          </A_Carry>
        ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names; `k` = beats shown of
// a watch-only scene, `stepping` shows the step controls).

export const fixtures: Fixtures = {
  BoxBet: { start: {}, bet: { bet: 0 } },
  WordWalk: { start: {}, wrong: { pick: 6, miss: 1 }, right: { pick: 5 } },
  NearestRule: { start: {}, one: { ran: [0] }, both: { ran: [0, 1] } },
  WhoIsIt: { start: {}, one: { ran: true }, two: { round: 1, ran: true } },
  LearnQuery: { start: {}, two: { n: 2 }, all: { n: 4 } },
  EveryWord: { start: {}, two: { done: [5, 0] }, all: { done: [0, 1, 2, 3, 4, 5, 6, 7, 8] } },
  NeuronRun: { start: {}, box: { stage: 1 }, b: { stage: 2 }, all: { stage: 3 } },
  YourSentence: { start: {}, animal: { pick: 0, miss: 1 }, both: { pick: 1, miss: 1 }, right: { pick: 2 } },
  CatMilk: { start: {}, milk: { pick: 0, miss: 1 }, right: { pick: 1 } },
  Finale: { start: {}, some: { open: [4, 3] }, all: { open: [0, 1, 2, 3, 4] } },
  MixW: { start: {}, off: { a: 2, b: 1 }, hit: { a: 1, b: 2 } },
  NightCall: { start: { k: 0 }, tell: { k: 1 }, som: { k: 2 }, done: {} },
  GoyalGhor: { start: { k: 0 }, fahim: { k: 1 }, som: { k: 2, stepping: true }, done: {} },
  KhataCard: { start: { k: 0 }, som: { k: 1 }, page: { k: 2 }, done: {} },
  BusHome: { start: { k: 0 }, msg: { k: 2 }, marks: { k: 3 }, done: {} },
  WordTimesWord: { start: { k: 0 }, box: { k: 1 }, words: { k: 2 }, done: {} },
  WordBox: { start: { k: 0 }, lists: { k: 1 }, done: {} },
  TwoSlots: { start: { k: 0 }, cow: { k: 1 }, done: {} },
  QueryKeys: { start: { k: 0 }, q: { k: 1 }, cow: { k: 2 }, swing: { k: 3 }, done: {} },
  LongStrips: { start: { k: 0 }, many: { k: 1 }, done: {} },
  NameLands: { start: { k: 0 }, dot: { k: 1 }, done: {} },
  ManyNeurons: { start: { k: 0 }, col: { k: 1 }, rows: { k: 2 }, done: {} },
  SameBox: { start: { k: 0 }, haat: { k: 1 }, ota: { k: 2 }, done: {} },
  RightAngleZero: { start: { k: 0 }, right: { k: 1 }, box: { k: 2 }, done: {} },
  FourArticles: { start: { k: 0 }, list: { k: 1 }, len: { k: 3 }, angle: { k: 4 }, done: {} },
  FourSpellings: { start: { k: 0 }, two: { k: 2 }, done: {} },
  SpanRecipe: { start: { k: 0 }, span: { k: 1 }, extra: { k: 2 }, done: {} },
  MatrixBoxes: { start: { k: 0 }, matrix: { k: 2 }, done: {} },
  SomRecalls: { start: { k: 0 }, ask: { k: 1 }, done: {} },
  GoatLeaves: { start: { k: 0 }, walk: { k: 1 }, down: { k: 2 }, away: { k: 3 }, done: {} },
  CatKitchen: { start: { k: 0 }, cat: { k: 1 }, done: {} },
  EndingFlips: { start: { k: 0 }, place: { k: 1 }, end: { k: 2 }, cow: { k: 3 }, done: {} },
  EverydayMatch: { start: { k: 0 }, search: { k: 1 }, film: { k: 2 }, filmwin: { k: 3 }, done: {} },
};
