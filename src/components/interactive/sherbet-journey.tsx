"use client";

import { type PointerEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  Draw,
  FADE,
  Nope,
  POP,
  Scene,
  Speech,
  Ticks,
  predictLook,
  primaryBtn,
  quietBtn,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
} from "@/components/journey/kit";
import { Arrow, Dot, Label, Plane, makeFrame, sg, tup, type XY } from "@/components/journey/plane";
import { Loop, Bubble, Card as CastCard, Chest, Person, Stage, Stall, StoryFrame, Tree } from "@/components/journey/cast";
import { Shiku, Trail } from "./arrow-journey";
import { bn } from "./figure-kit";
import { Prize, Samin } from "./treasure-journey";

// Screens for "Math for AI 3.2 — Stretch, শরবতের recipe", told as a Journey.
//
// At the science fair the class sells লেবুর শরবত from a recipe card written
// for 4 glasses. Eight people queue: two batches are the card added to itself,
// every slot doubled. Drawn on graph paper, every batch size sits on one line
// through 0, and নাসিব's extra sugar knocks the dot off it. A knob then
// multiplies (1, 2) by anything, minus and zero included: the tip never leaves
// the line. Five number cards sorted by what they do name the scalar. Flip
// সামিন's arrow from 3.1 and add, and it lands on the same card as the
// subtraction did. Last, grams: stretching the whole card keeps everyone's
// nearest neighbour, stretching only the weight slot does not (a seed for 3.7).
//
// Tailwind only; the sheets are journey/plane. Ink on the white sheet is fixed.

const O: XY = [0, 0];
const times = (k: number, v: XY): XY => [k * v[0], k * v[1]];

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the sherbet stall in the
//      midday sun. সামিন holds up the recipe card, (2, 4) for 4 glasses, and
//      then the queue grows, four people and then four more, till eight stand
//      in line. What goes on the new card is the widget's question, so the
//      scene stops at সামিন's surprise.

const SC_INK = "#0f1b2d";

/** A glass of লেবুর শরবত, bottom-centre at (x, y), with a straw. */
function SbGlass({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 4.5} ${y - 13}L${x - 3.2} ${y}H${x + 3.2}L${x + 4.5} ${y - 13}Z`} fill="#fde68a" stroke="#94a3b8" strokeWidth={0.8} />
      <path d={`M${x + 1} ${y - 11}l3 -7`} stroke="#ef4444" strokeWidth={1.3} strokeLinecap="round" />
    </g>
  );
}

/** The hot midday sun, high over the field; its glow pulses (still, with reduced motion). */
function SbSun() {
  return (
    <g className="pointer-events-none">
      <circle cx={236} cy={30} r={21} fill="#fde047" opacity={0.35} className="motion-safe:animate-pulse" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <path key={i} d={`M${236 + 16 * Math.cos(a)} ${30 + 16 * Math.sin(a)}L${236 + 23 * Math.cos(a)} ${30 + 23 * Math.sin(a)}`} stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />;
      })}
      <circle cx={236} cy={30} r={12} fill="#facc15" />
    </g>
  );
}

/**
 * Someone from the fair (not one of the cast), feet at (x, y), a little
 * smaller than the cast and facing left (`away`: right, leaving the stall).
 * Glides to a new x like Person; its legs swing while `walking`.
 */
function SbFolk({ x, y, shirt, walking, delay = 0, away = false }: { x: number; y: number; shirt: string; walking: boolean; delay?: number; away?: boolean }) {
  const run = `${x},${y}`;
  const swing = (deg: number, px: number) => <Loop on={walking} run={run} ms={1200 + delay} type="rotate" values={`${deg} ${px} -20;${-deg} ${px} -20;${deg} ${px} -20`} dur={0.5} />;
  return (
    <g
      style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: "1200ms", transitionDelay: `${delay}ms` }}
      className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none"
    >
      <g transform={`scale(${away ? -0.8 : 0.8} 0.8)`}>
        <g>
          <Loop on={walking} run={run} ms={1200 + delay} type="translate" values="0 0;0 -1.5;0 0" dur={0.25} />
          <g>
            {swing(20, -3)}
            <path d="M-3 -20V-1" strokeWidth={5} strokeLinecap="round" stroke="#334155" />
          </g>
          <g>
            {swing(-20, 3)}
            <path d="M3 -20V-1" strokeWidth={5} strokeLinecap="round" stroke="#334155" />
          </g>
          <rect x={-8} y={-39} width={16} height={20} rx={5} fill={shirt} />
          <circle cy={-48} r={8} fill="#d4a373" />
          <path d="M-8.5 -49q0 -10 8.5 -10t8.5 10q-5 -5 -17 0Z" fill="#1c1917" />
          <circle cx={-3.5} cy={-48} r={1.1} fill={SC_INK} />
        </g>
      </g>
    </g>
  );
}

const S1_Y = 150;
const S1_SAMIN = 112;
const S1_OFF = 372;
const S1_SHIRTS = ["#f97316", "#8b5cf6", "#0ea5e9", "#e11d48", "#65a30d", "#f59e0b", "#6366f1", "#14b8a6"];

export function SherbetQueue() {
  const s = useScene(4, [600, 2600, 1600, 1600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সামিন at the লেবুর শরবত stall in the hot sun holds up the recipe card (2, 4) for 4 glasses; eight people walk up and queue">
        <SbSun />
        <Stall x={50} y={S1_Y} w={78} sign="লেবুর শরবত" color="#eab308" />
        {[30, 42, 54, 66].map((gx) => (
          <SbGlass key={gx} x={gx} y={S1_Y - 24} />
        ))}
        <Person who="samin" x={S1_SAMIN} y={S1_Y} arm={k >= 1 ? "hold" : "down"} mood={k >= 4 ? "puzzled" : "happy"} label />
        {k >= 1 && <CastCard x={S1_SAMIN + 30} y={S1_Y - 44} text="(2, 4)" />}
        {k === 1 && <Bubble x={S1_SAMIN} y={S1_Y - 66} lines={["৪ গ্লাস: ২টা লেবু,", "৪ চামচ চিনি"]} />}
        {S1_SHIRTS.map((shirt, i) => {
          const beat = i < 4 ? 2 : 3;
          return <SbFolk key={shirt} x={k >= beat ? 186 + i * 15 : S1_OFF + (i % 4) * 16} y={S1_Y} shirt={shirt} walking={k === beat} delay={(i % 4) * 140} />;
        })}
        {k >= 4 && <Bubble x={S1_SAMIN} y={S1_Y - 66} lines={["লাইনে ৮ জন!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The recipe card is for 4 glasses and 8 people queue. Predict the new
//     card, then mix a second batch: the card added to itself, every slot ×2.

const RECIPE: XY = [2, 4];
const GLASS_GUESS = ["(6, 8)", "(4, 8)", "(4, 6)"];

function Batch({ glasses, v, tone }: { glasses: number; v: XY; tone: "blue" | "teal" }) {
  return (
    <div className={`rounded-xl border-2 bg-surface px-3 py-2 text-center ${tone === "blue" ? "border-cat-blue/40" : "border-cat-teal/50"}`}>
      <div className="text-xs font-semibold text-muted">{bn(glasses)} গ্লাসের card</div>
      <div className={`font-mono text-xl font-bold ${tone === "blue" ? "text-cat-blue" : "text-cat-teal"}`}>{tup(v)}</div>
      <div className="text-xs text-muted">
        {bn(v[0])}টা লেবু, {bn(v[1])} চামচ চিনি
      </div>
    </div>
  );
}

export function MoreGlasses() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [mixed, setMixed] = useSeed("mixed", false);
  const big = times(2, RECIPE);

  const mix = () => {
    setMixed(true);
    pass("একই card দুইবার যোগ মানে প্রতিটা ঘর 2 দিয়ে গুণ। লেবুও দ্বিগুণ, চিনিও দ্বিগুণ: (4, 8)।");
  };

  return (
    <>
      <div className="mx-auto mt-4 max-w-[11rem]">
        <Batch glasses={4} v={RECIPE} tone="blue" />
      </div>
      <div className="mt-3 text-center text-2xl leading-relaxed" aria-label={`${mixed ? 8 : 4} glasses`}>
        {"🥤".repeat(4)}
        {mixed && <span className={FADE}>{"🥤".repeat(4)}</span>}
      </div>
      <div className="mt-1 text-center text-sm text-muted">লাইনে দাঁড়িয়ে {bn(8)} জন, আর card লেখা {bn(4)} গ্লাসের জন্য।</div>
      <div className="mt-4 text-sm font-medium text-muted">{bn(8)} গ্লাসের জন্য card-এ কী লিখবেন?</div>
      <div className="mt-2 grid gap-2">
        {GLASS_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, mixed, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="font-mono">{o}</span>
          </Choice>
        ))}
      </div>
      {guess !== null && !mixed && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={mix} className={`${primaryBtn} bg-cat-violet`}>
            আরেক ব্যাচ মেশান
          </button>
        </div>
      )}
      {mixed && (
        <div className={`${FADE} mx-auto mt-4 max-w-sm rounded-2xl bg-cat-teal/5 px-4 py-3 text-center`}>
          <div className="font-mono text-lg">
            {tup(RECIPE)} + {tup(RECIPE)} = <b className="text-cat-teal">{tup(big)}</b>
          </div>
          <div className="text-sm text-muted">
            দুইটা ব্যাচ মানে একই card দুইবার। লেবুর ঘরে 2 + 2, চিনির ঘরে 4 + 4।
          </div>
          {guess === 0 && (
            <div className="mt-2 text-[0.95rem] text-danger">
              (6, 8) মানে দুই ঘরেই 4 করে যোগ। কিন্তু লেবু তো 4টা বাড়েনি, ঠিক দ্বিগুণ হয়েছে।
            </div>
          )}
          {guess === 2 && (
            <div className="mt-2 text-[0.95rem] text-danger">
              (4, 6) মানে লেবু দ্বিগুণ, কিন্তু চিনিতে শুধু 2 চামচ বেশি। তাহলে তো শরবত আগের চেয়ে টক হয়ে যাবে।
            </div>
          )}
        </div>
      )}
      <Task done={mixed}>আগে card-টা guess করুন, তারপর আরেক ব্যাচ মিশিয়ে মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the second batch, slot by
//      slot. Two more lemons join the লেবু row, four more spoons the চিনি row,
//      and then 2 · (2, 4) is worked out one slot at a time: both slots double.

function Lemon() {
  return (
    <svg viewBox="0 0 18 14" className="h-4 w-[1.2rem]" aria-hidden>
      <ellipse cx={9} cy={8} rx={6.6} ry={4.9} className="fill-cat-amber" />
      <path d="M2.6 8H1M15.4 8H17" strokeWidth={1.8} strokeLinecap="round" className="stroke-cat-amber" />
      <path d="M9 3.3C10 1.2 12.5 0.6 14.5 1.3C13.4 3.2 11.2 3.9 9 3.3Z" className="fill-cat-teal" />
    </svg>
  );
}

/** a spoon of sugar; `extra` tints it coral, for sugar added on its own */
function Spoon({ extra = false }: { extra?: boolean } = {}) {
  return (
    <svg viewBox="0 0 18 10" className="h-2.5 w-[1.05rem]" aria-hidden>
      <ellipse cx={5} cy={5} rx={4.2} ry={3.4} strokeWidth={1.2} className={extra ? "fill-cat-coral/25 stroke-cat-coral" : "fill-cat-blue/25 stroke-cat-blue"} />
      <path d="M9.2 5H17" strokeWidth={1.6} strokeLinecap="round" className={extra ? "stroke-cat-coral" : "stroke-cat-blue"} />
    </svg>
  );
}

/** One column of the batch table: a header, then the লেবু row and the চিনি row. */
function BatchCol({ head, box = "border-transparent", rows }: { head: ReactNode; box?: string; rows: [ReactNode, ReactNode] }) {
  return (
    <div className="flex flex-col items-center">
      <div className="h-5 text-xs font-semibold text-muted">{head}</div>
      <div className={`grid gap-1 rounded-xl border-2 px-1.5 py-1 transition-colors duration-300 motion-reduce:transition-none ${box}`}>
        {rows.map((r, i) => (
          <div key={i} className="flex h-6 items-center justify-center gap-0.5">
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}

const icons = (n: number, of: () => ReactNode, pop: boolean) =>
  Array.from({ length: n }, (_, i) => (
    <span key={i} className={`${pop ? POP : ""} inline-flex`} style={pop ? { transitionDelay: `${i * 90}ms` } : undefined}>
      {of()}
    </span>
  ));

export function DoubleBatch() {
  const s = useScene(4, [700, 1000, 1100, 1100]);
  const k = s.k;
  const lemons = k >= 1 ? 4 : 2;
  const sugar = k >= 2 ? 8 : 4;

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          `প্রথম ব্যাচে ${bn(2)}টা লেবু আর ${bn(4)} চামচ চিনি।`
        ) : k < 3 ? (
          `দ্বিতীয় ব্যাচ আসছে। লেবুর ঘরে আরও ${bn(2)}টা, চিনির ঘরে আরও ${bn(4)} চামচ।`
        ) : k === 3 ? (
          "লম্বা যোগ না লিখে 2-টা বসিয়ে দিলাম দুই ঘরের সামনেই।"
        ) : (
          <span className={FADE}>দুই ঘরই দ্বিগুণ হলো, তাই শরবতের স্বাদও আগের মতোই রইলো।</span>
        )
      }
    >
      <div className="flex items-end justify-center gap-1.5 text-sm" role="img" aria-label={`two batches: ${lemons} lemons and ${sugar} spoons of sugar`}>
        <BatchCol head="" rows={[<span key="l">লেবু</span>, <span key="c">চিনি</span>]} />
        <BatchCol head={`ব্যাচ ${bn(1)}`} box="w-[5.9rem] border-cat-blue/40" rows={[icons(2, Lemon, false), icons(4, Spoon, false)]} />
        <BatchCol
          head={`ব্যাচ ${bn(2)}`}
          box={`w-[5.9rem] ${k >= 1 ? "border-cat-teal/50" : "border-dashed border-border"}`}
          rows={[k >= 1 ? icons(2, Lemon, true) : null, k >= 2 ? icons(4, Spoon, true) : null]}
        />
        <BatchCol
          head="মোট"
          rows={[
            <b key={`l${lemons}`} className={`${POP} inline-block font-mono text-base`}>
              {lemons}
            </b>,
            <b key={`c${sugar}`} className={`${POP} inline-block font-mono text-base`}>
              {sugar}
            </b>,
          ]}
        />
      </div>
      <div className="mt-3 min-h-[3.25rem] text-center font-mono text-base leading-relaxed">
        {k >= 3 && (
          <div className={FADE}>
            <b className="text-cat-violet">2</b> · (2, 4) = (<b className="text-cat-violet">2</b> × 2, <b className="text-cat-violet">2</b> × 4)
          </div>
        )}
        {k >= 4 && (
          <div className={FADE}>
            = <b className="text-cat-teal">(4, 8)</b>
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1¾ · A figure for screen 1's explanation, no task: the question it ends on.
//      The queue of eight walks off till one person is left, the stall's four
//      glasses dim to one, and সামিন, card (2, 4) in hand, wonders how a card
//      is added "half a time". Screen 2 answers that, so the scene stops on
//      his question.

export function OneInLine() {
  const s = useScene(3, [600, 2000, 1800]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="The queue at the লেবুর শরবত stall walks off till one person is left; সামিন, holding the card (2, 4), wonders how to add a card half a time">
        <SbSun />
        <Stall x={50} y={S1_Y} w={78} sign="লেবুর শরবত" color="#eab308" />
        {[30, 42, 54, 66].map((gx, i) => (
          <g key={gx} style={{ opacity: k >= 2 && i > 0 ? 0.25 : 1 }} className="transition-opacity duration-700 motion-reduce:transition-none">
            <SbGlass x={gx} y={S1_Y - 24} />
          </g>
        ))}
        <Person who="samin" x={S1_SAMIN} y={S1_Y} arm="hold" mood={k >= 3 ? "puzzled" : k >= 2 ? "plain" : "happy"} label />
        <CastCard x={S1_SAMIN + 30} y={S1_Y - 44} text="(2, 4)" />
        {S1_SHIRTS.map((shirt, i) => {
          const leave = i > 0 && k >= 1;
          return (
            <SbFolk
              key={shirt}
              x={leave ? S1_OFF + i * 8 : 186 + i * 15}
              y={S1_Y}
              shirt={shirt}
              walking={leave && k === 1}
              away={leave}
              delay={leave ? (S1_SHIRTS.length - 1 - i) * 110 : 0}
            />
          );
        })}
        {k === 2 && <Bubble x={S1_SAMIN} y={S1_Y - 66} lines={["লাইনে এখন", "মাত্র একজন!"]} />}
        {k >= 3 && <Bubble x={S1_SAMIN} y={S1_Y - 66} tone="think" lines={["card অর্ধেকবার", "যোগ করবো কীভাবে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: সামিন takes the recipe
//      card to a sheet of graph paper on an easel, draws the two axes (লেবু to
//      the right, চিনি up) and puts the 4-glass recipe down as one dot at
//      (2, 4). Where the other glass counts land is the widget's job, so the
//      scene ends on his question.

const S2_Y = 150;
const S2_OX = 196;
const S2_OY = 120;
const S2_UX = 16;
const S2_UY = 8.5;
const s2x = (n: number) => S2_OX + n * S2_UX;
const s2y = (n: number) => S2_OY - n * S2_UY;

export function RecipeOnPaper() {
  const s = useScene(4, [600, 1500, 1400, 1500]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সামিন carries the recipe card to graph paper on an easel, draws lemons to the right and sugar up, and marks the 4-glass recipe as a dot at (2, 4)">
        <Tree x={24} y={S2_Y - 2} s={0.8} />
        {/* the easel and its sheet */}
        <path d={`M204 134L192 ${S2_Y}M272 134L284 ${S2_Y}M238 134V${S2_Y - 4}`} stroke="#92400e" strokeWidth={3} strokeLinecap="round" />
        <rect x={180} y={28} width={116} height={106} rx={2} fill="white" stroke="#a8a29e" />
        <g stroke="#bfdbfe" strokeWidth={0.7}>
          {Array.from({ length: 6 }, (_, i) => (
            <path key={`v${i}`} d={`M${s2x(i)} ${s2y(0)}V${s2y(9)}`} />
          ))}
          {Array.from({ length: 10 }, (_, j) => (
            <path key={`h${j}`} d={`M${s2x(0)} ${s2y(j)}H${s2x(5)}`} />
          ))}
        </g>
        {k >= 2 && (
          <>
            <Draw d={`M${s2x(0)} ${s2y(0)}H${s2x(5.5)}`} ms={700} strokeWidth={1.6} className="stroke-[#0f1b2d]" />
            <Draw d={`M${s2x(0)} ${s2y(0)}V${s2y(9.2)}`} ms={700} delay={300} strokeWidth={1.6} className="stroke-[#0f1b2d]" />
            <text x={292} y={130} textAnchor="end" fontSize={7.5} fontWeight={600} fill="#5a6b7d" className={FADE}>
              লেবু →
            </text>
            <text x={184} y={37} fontSize={7.5} fontWeight={600} fill="#5a6b7d" className={FADE}>
              ↑ চিনি (চামচ)
            </text>
          </>
        )}
        {k >= 3 && (
          <g className={POP}>
            <circle cx={s2x(2)} cy={s2y(4)} r={4.5} fill="#2563eb" />
            <text x={s2x(2) + 8} y={s2y(4) - 1} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8">
              (2, 4)
            </text>
            <text x={s2x(2) + 8} y={s2y(4) + 9} fontSize={7.5} fontWeight={600} fill="#1d4ed8">
              ৪ গ্লাস
            </text>
          </g>
        )}
        <Person who="samin" x={k >= 1 ? 152 : 62} y={S2_Y} walking={k === 1} arm={k === 0 ? "hold" : k >= 2 ? "point" : "down"} mood={k >= 3 ? "happy" : "plain"} label />
        {k === 0 && <CastCard x={92} y={S2_Y - 44} text="(2, 4)" />}
        {k >= 4 && <Bubble x={152} y={S2_Y - 66} side="left" tone="think" lines={["গ্লাস কম-বেশি হলে", "dot যাবে কোথায়?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · The recipe as a dot on (লেবু, চিনি) paper. 1, 2, 4 and 8 glasses all sit
//     on one line through 0; নাসিব doubles only the sugar and falls off it.

const FT = makeFrame(0, 5, 0, 9, 26);
const SIZES = [1, 2, 4, 8];
const recipeFor = (g: number): XY => times(g / 4, RECIPE);
const NASIB: XY = [2, 8];

export function TasteLine() {
  const pass = useGate();
  const [size, setSize] = useSeed("size", 2);
  const [seen, setSeen] = useSeed<number[]>("seen", [2]);
  const [nasib, setNasib] = useSeed("nasib", false);
  const all = seen.length === SIZES.length;
  const here = recipeFor(SIZES[size]);

  const pick = (i: number) => {
    setSize(i);
    if (!seen.includes(i)) setSeen([...seen, i]);
  };
  const spoil = () => {
    setNasib(true);
    pass("যত গ্লাসই বানান, dot বসে একই সোজা লাইনে। শুধু চিনি বাড়ালে dot লাইন ছেড়ে যায়, আর শরবতটাই বদলে যায়।");
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {SIZES.map((g, i) => (
          <button
            key={g}
            type="button"
            aria-pressed={size === i}
            onClick={() => pick(i)}
            className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors motion-reduce:transition-none ${
              size === i ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"
            }`}
          >
            {bn(g)} গ্লাস
          </button>
        ))}
      </div>
      <Plane f={FT} ticks={1} label={`recipe dots for ${seen.map((i) => SIZES[i]).join(", ")} glasses${nasib ? ", and নাসিব's (2, 8) off the line" : ""}`} className="max-w-[14rem]">
        <Label f={FT} at={[5, 0]} dx={-4} dy={-6} anchor="end" size={9} className="fill-[#5a6b7d]">
          লেবু →
        </Label>
        <Label f={FT} at={[0, 9]} dx={6} dy={12} anchor="start" size={9} className="fill-[#5a6b7d]">
          ↑ চিনি (চামচ)
        </Label>
        {all && <path d={`M${FT.sx(0)} ${FT.sy(0)}L${FT.sx(4.5)} ${FT.sy(9)}`} strokeWidth={1.6} strokeDasharray="6 5" className={`${FADE} pointer-events-none fill-none stroke-cat-teal/70`} />}
        {seen.map((i) => {
          const p = recipeFor(SIZES[i]);
          return <Dot key={i} f={FT} at={p} r={i === size ? 6 : 4} className={i === size ? "fill-cat-blue" : "fill-cat-blue/50"} pop />;
        })}
        <Label f={FT} at={here} dx={-9} dy={4} anchor="end" size={10} weight={700} className="fill-cat-blue">
          {tup(here)}
        </Label>
        {nasib && (
          <>
            <Dot f={FT} at={NASIB} r={6} className="fill-cat-coral" pop />
            <Label f={FT} at={NASIB} dx={9} dy={4} anchor="start" size={10} weight={700} className={`${FADE} fill-cat-coral`}>
              নাসিব
            </Label>
          </>
        )}
      </Plane>
      <div key={size} className={`${FADE} text-center text-[0.95rem]`}>
        {bn(SIZES[size])} গ্লাসে লাগে <b className="font-mono">{tup(here)}</b>, মানে {here[0] === 0.5 ? "আধা" : `${bn(here[0])}টা`} লেবু আর {bn(here[1])} চামচ চিনি।
      </div>
      <Ticks items={SIZES.map((g, i) => [`${bn(g)} গ্লাস`, seen.includes(i)])} />
      {all && !nasib && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={spoil} className={`${primaryBtn} bg-cat-coral`}>
            নাসিবকে শরবত বানাতে দিন
          </button>
        </div>
      )}
      {nasib && (
        <>
          <Speech who="নাসিব" initial="ন" tint="blue">
            {bn(4)} গ্লাসই বানালাম, শুধু চিনিটা ডাবল করে দিলাম। মিষ্টি বেশি, মজাও বেশি!
          </Speech>
          <Nope>নাসিবের dot লাইন ছেড়ে ওপরে উঠে গেছে। চুমুক দিয়ে সামিন মুখ কুঁচকালো: “এটা তো অন্য শরবত!”</Nope>
        </>
      )}
      <Task done={nasib}>চারটা মাপই একবার করে দেখুন, dot-গুলো কোথায় বসে খেয়াল করুন। তারপর নাসিবের পালা।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2¼ · A figure for screen 2's explanation, no task: the dots the reader just
//      made, and why they line up. 1, 2, 4 and 8 glasses pop onto the paper,
//      a line runs through them from (0, 0), and then the reason walks it:
//      one lemon right, two spoons up, again and again. Last, one glass:
//      ¼ · (2, 4) = (0.5, 1), the same rule with a number below 1.

const SC_FL = makeFrame(0, 4.5, 0, 8.5, 16, 10);
const SC_STAIR: XY[] = [O, [1, 0], [1, 2], [2, 2], [2, 4], [3, 4], [3, 6], [4, 6], [4, 8]];
const SC_STAIR_D = SC_STAIR.map((p, i) => `${i ? "L" : "M"}${SC_FL.sx(p[0])} ${SC_FL.sy(p[1])}`).join("");

export function LemonStairs() {
  const s = useScene(4, [600, 1500, 1600, 1900]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k <= 1 ? (
          `${bn(1)}, ${bn(2)}, ${bn(4)} আর ${bn(8)} গ্লাসের recipe, কাগজে চারটা dot।`
        ) : k === 2 ? (
          "চারটাই একটা সোজা লাইনে, আর লাইনটা শুরু (0, 0) থেকে।"
        ) : k === 3 ? (
          `কারণ প্রতিটা লেবুর সাথে ${bn(2)} চামচ চিনি: ${bn(1)} ঘর ডানে, ${bn(2)} ঘর ওপরে, বারবার।`
        ) : (
          <span className={FADE}>একজনের জন্য আধা লেবু আর {bn(1)} চামচ। ¼ দিয়ে গুণ, নিয়ম সেই একই।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-4">
        <div className="w-[5.75rem] shrink-0">
          <Plane f={SC_FL} label="recipe dots for 1, 2, 4 and 8 glasses on one line through (0, 0); a staircase of one lemon right, two spoons up runs through them" className="my-0! max-w-none">
            <Label f={SC_FL} at={[4.5, 0]} dx={-3} dy={-4} anchor="end" size={8} className="fill-[#5a6b7d]">
              লেবু →
            </Label>
            <Label f={SC_FL} at={[0, 8.5]} dx={4} dy={9} anchor="start" size={8} className="fill-[#5a6b7d]">
              ↑ চিনি
            </Label>
            {k >= 2 && <Draw d={`M${SC_FL.sx(0)} ${SC_FL.sy(0)}L${SC_FL.sx(4.25)} ${SC_FL.sy(8.5)}`} ms={800} strokeWidth={1.4} className="stroke-cat-teal/70" />}
            {k >= 3 && <Draw d={SC_STAIR_D} ms={1300} strokeWidth={1.8} className="stroke-cat-amber" />}
            {k >= 2 && <Dot f={SC_FL} at={O} r={3} className="fill-cat-teal" pop />}
            {k >= 1 &&
              SIZES.map((g, i) => (
                <circle
                  key={g}
                  cx={SC_FL.sx(recipeFor(g)[0])}
                  cy={SC_FL.sy(recipeFor(g)[1])}
                  r={3.6}
                  style={{ transitionDelay: `${i * 160}ms` }}
                  className={`${POP} pointer-events-none fill-cat-blue`}
                />
              ))}
            {k >= 4 && <circle cx={SC_FL.sx(0.5)} cy={SC_FL.sy(1)} r={6.5} strokeWidth={1.6} className={`${POP} pointer-events-none fill-none stroke-cat-violet`} />}
          </Plane>
        </div>
        <div className="grid w-[8rem] gap-1">
          {SIZES.map((g, i) => (
            <div
              key={g}
              style={{ transitionDelay: `${i * 160}ms` }}
              className={`flex items-baseline justify-between gap-2 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-0"}`}
            >
              <span className="text-xs text-muted">{bn(g)} গ্লাস</span>
              <b className={`font-mono text-sm transition-colors duration-500 motion-reduce:transition-none ${g === 1 && k >= 4 ? "text-cat-violet" : "text-cat-blue"}`}>{tup(recipeFor(g))}</b>
            </div>
          ))}
          <div className="mt-1 min-h-[2.6rem] font-mono text-sm leading-snug">
            {k >= 4 && (
              <div className={FADE}>
                <b className="text-cat-violet">¼</b> · (2, 4)
                <br />= <b className="text-cat-violet">(0.5, 1)</b>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2⅓ · A figure for screen 2's explanation, no task: what নাসিব's extra sugar
//      breaks. সামিনের card pairs every lemon with 2 spoons. নাসিব takes the
//      same 2 lemons and the same pairs, then the sugar alone doubles: every
//      lemon now goes with 4 spoons. The pair itself changed, so did the taste.

const SC_PAIRS = [
  { who: "সামিন", card: "(2, 4)", ink: "text-cat-blue" },
  { who: "নাসিব", card: "(2, 8)", ink: "text-cat-coral" },
];

export function PerLemon() {
  const s = useScene(3, [600, 1800, 1600]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k <= 1 ? (
          `সামিনের শরবতে প্রতিটা লেবুর জুটি ${bn(2)} চামচ চিনি।`
        ) : k === 2 ? (
          `নাসিবও নিলো সেই ${bn(2)}টা লেবু, জুটিও প্রথমে একই।`
        ) : (
          <span className={FADE}>তারপর চিনি একা ডাবল। প্রতি লেবুতে এখন {bn(4)} চামচ, জুটিটাই বদলে গেল।</span>
        )
      }
    >
      <div className="mx-auto grid w-fit gap-2" role="img" aria-label="সামিন: every lemon with 2 spoons of sugar; নাসিব: every lemon with 4 spoons">
        {SC_PAIRS.map((r, i) => {
          const on = k >= i + 1;
          const more = i === 1 && k >= 3;
          return (
            <div key={r.who} className="grid grid-cols-[3.25rem_13.75rem] items-center gap-2">
              <div className="leading-tight">
                <div className="text-xs text-muted">{r.who}</div>
                <div className={`font-mono text-sm font-bold transition-opacity duration-500 motion-reduce:transition-none ${on ? "opacity-100" : "opacity-0"} ${r.ink}`}>{i === 1 && !more ? "(2, 4)" : r.card}</div>
              </div>
              <div className="min-h-[3.1rem]">
                {on && (
                  <div className={`${FADE} flex gap-1.5`}>
                    {[0, 1].map((g) => (
                      <span
                        key={g}
                        className={`flex h-8 items-center gap-0.5 rounded-lg border-2 px-1 transition-colors duration-500 motion-reduce:transition-none ${more ? "border-cat-coral/50" : "border-cat-teal/40"}`}
                      >
                        <Lemon />
                        {icons(2, Spoon, true)}
                        {more && icons(2, () => <Spoon extra />, true)}
                      </span>
                    ))}
                  </div>
                )}
                {on && (
                  <div key={more ? "4" : "2"} className={`${FADE} mt-0.5 text-xs font-semibold ${more ? "text-cat-coral" : "text-cat-teal"}`}>
                    প্রতি লেবুতে {bn(more ? 4 : 2)} চামচ
                  </div>
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
// 2½ · A figure for screen 2's explanation, no task: the same recipes, now as
//      arrows. The whole card × ¼ and × 2 only slides the tip along its own
//      line; নাসিব's sugar-only double swings the arrow off it, to (2, 8).

const SC_FA = makeFrame(0, 4.5, 0, 8.5, 18, 14);
const SC_TURN_SCALE = [1, 1, 0.25, 2, 1];
const SC_TURN_ROWS: { who: string; v: XY; ink: string }[] = [
  { who: `${bn(4)} গ্লাস, আসল card`, v: [2, 4], ink: "text-cat-blue" },
  { who: `${bn(1)} গ্লাস, পুরো card × ¼`, v: [0.5, 1], ink: "text-cat-blue" },
  { who: `${bn(8)} গ্লাস, পুরো card × 2`, v: [4, 8], ink: "text-cat-blue" },
  { who: "নাসিব, শুধু চিনি × 2", v: NASIB, ink: "text-cat-coral" },
];
/** a point `r` px from the origin of SC_FA, pointing along `v` */
const scRay = (v: XY, r: number) => {
  const a = Math.atan2(v[1], v[0]);
  return `${SC_FA.sx(0) + r * Math.cos(a)} ${SC_FA.sy(0) - r * Math.sin(a)}`;
};

export function ArrowTurns() {
  const s = useScene(4, [600, 1300, 1600, 1700]);
  const k = s.k;
  const [m] = useTween([SC_TURN_SCALE[k]], 900);
  const tip = times(m, RECIPE);

  return (
    <Scene
      scene={s}
      caption={
        k <= 1 ? (
          `সামিনের ${bn(4)} গ্লাসের recipe, এবার arrow হিসেবে আঁকা।`
        ) : k === 2 ? (
          "পুরো card ¼ গুণ: arrow খাটো হলো, কিন্তু মুখ সেই একই দিকে।"
        ) : k === 3 ? (
          "পুরো card 2 গুণ: লম্বা হলো, দিক তবুও একই। মাথাটা শুধু লাইন ধরে সরে।"
        ) : (
          <span className={FADE}>নাসিব শুধু চিনির ঘর ডাবল করলো। Arrow লাইন ছেড়ে অন্য দিকে ঘুরে গেল।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[7rem] shrink-0">
          <Plane f={SC_FA} ticks={2} label={`the recipe (2, 4) as an arrow, stretched by ¼ and 2 along one line; নাসিব's (2, 8) points elsewhere`} className="my-0! max-w-none">
            <Label f={SC_FA} at={[4.5, 0]} dx={-3} dy={-5} anchor="end" size={8.5} className="fill-[#5a6b7d]">
              লেবু →
            </Label>
            <Label f={SC_FA} at={[0, 8.5]} dx={5} dy={11} anchor="start" size={8.5} className="fill-[#5a6b7d]">
              ↑ চিনি
            </Label>
            {k >= 3 && (
              <path d={`M${SC_FA.sx(0)} ${SC_FA.sy(0)}L${SC_FA.sx(4.25)} ${SC_FA.sy(8.5)}`} strokeWidth={1.4} strokeDasharray="5 4" className={`${FADE} pointer-events-none fill-none stroke-cat-teal/70`} />
            )}
            {k >= 2 && <Dot f={SC_FA} at={[0.5, 1]} r={3} className="fill-cat-violet/60" pop />}
            {k >= 3 && <Dot f={SC_FA} at={[4, 8]} r={3} className="fill-cat-violet/60" pop />}
            {k >= 4 && (
              <path d={`M${scRay(RECIPE, 34)}A34 34 0 0 0 ${scRay(NASIB, 34)}`} strokeWidth={1.6} className={`${FADE} pointer-events-none fill-none stroke-cat-coral`} />
            )}
            {k >= 1 && <Arrow f={SC_FA} from={O} to={tip} tone="blue" w={2.6} draw />}
            {k >= 4 && <Arrow f={SC_FA} from={O} to={NASIB} tone="coral" w={2.6} draw />}
          </Plane>
        </div>
        <div className="grid w-[8.5rem] gap-1.5">
          {SC_TURN_ROWS.map((r, i) => (
            <div key={r.who} className={`leading-tight transition-opacity duration-500 motion-reduce:transition-none ${k > i ? "opacity-100" : "opacity-0"}`}>
              <div className="text-xs text-muted">{r.who}</div>
              <div className={`font-mono text-sm font-bold ${r.ink}`}>{tup(r.v)}</div>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · A knob that multiplies (1, 2) by anything from −2 to 3. Five targets to
//     hit; every visited tip leaves a dot, and the dots make one line through 0.

const FK = makeFrame(-3, 4, -5, 7, 22);
const V: XY = [1, 2];
const TARGETS = [3, 0.5, 0, -0.5, -2];
const KNOB_GUESS = ["একটা সোজা লাইনের ওপরেই থাকবে", "ঘুরে ঘুরে অন্য দিকেও চলে যাবে", "না দেখে বলা যাবে না"];

const what = (k: number) =>
  k > 1
    ? "একই দিকে, আরও লম্বা।"
    : k === 1
      ? "যেমন ছিল, তেমনই।"
      : k > 0
        ? "একই দিকে, কিন্তু খাটো।"
        : k === 0
          ? "Arrow গুটিয়ে একটা বিন্দু হয়ে গেল!"
          : k > -1
            ? "উল্টো দিকে, খাটো।"
            : k === -1
              ? "উল্টো দিকে, লম্বায় একই।"
              : "উল্টো দিকে, আরও লম্বা।";

export function StretchKnob() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [k, setK] = useSeed("k", 1);
  const [seen, setSeen] = useSeed<number[]>("seen", [1]);
  const hit = TARGETS.filter((t) => seen.includes(t)).length;
  const all = hit === TARGETS.length;
  const tip = times(k, V);

  const turn = (n: number) => {
    setK(n);
    if (seen.includes(n)) return;
    const next = [...seen, n];
    setSeen(next);
    if (TARGETS.every((t) => next.includes(t))) pass("গুণ করে arrow লম্বা, খাটো, এমনকি উল্টোও করা যায়। কিন্তু লাইন থেকে একচুলও সরানো যায় না।");
  };

  return (
    <>
      <div className="mt-4 text-sm font-medium text-muted">(1, 2)-কে নানা সংখ্যা দিয়ে গুণ করতে থাকলে arrow-এর মাথা কোথায় কোথায় যাবে?</div>
      <div className="mt-2 grid gap-2">
        {KNOB_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, all, 0)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={FADE}>
          <Plane f={FK} ticks={1} label={`(1, 2) times ${k} is ${tup(tip)}`} className="max-w-[15rem]">
            {all && <path d={`M${FK.sx(-2.5)} ${FK.sy(-5)}L${FK.sx(3.5)} ${FK.sy(7)}`} strokeWidth={1.4} strokeDasharray="6 5" className={`${FADE} pointer-events-none fill-none stroke-cat-teal/70`} />}
            {seen.map((s) => (
              <Dot key={s} f={FK} at={times(s, V)} r={3} className="fill-cat-violet/50" />
            ))}
            <Arrow f={FK} from={O} to={V} tone="ink" w={2} dashed faint />
            <Arrow f={FK} from={O} to={tip} tone={k < 0 ? "coral" : "blue"} w={3} />
            {k === 0 && <Dot f={FK} at={O} r={5} className="fill-cat-violet" />}
          </Plane>
          <div className="text-center">
            <div className="font-mono text-lg">
              <span key={k} className={`${POP} inline-block font-bold`}>
                {sg(k)}
              </span>{" "}
              × (1, 2) = <b className={k < 0 ? "text-cat-coral" : "text-cat-blue"}>{tup(tip)}</b>
            </div>
            <div key={k} className={`${FADE} text-[0.95rem]`}>
              {what(k)}
            </div>
          </div>
          <Knob k={k} onTurn={turn} />
          <Ticks items={TARGETS.map((t) => [`× ${sg(t)}`, seen.includes(t)])} />
        </div>
      )}
      <Task done={all}>
        আগে guess দিন। তারপর knob ঘুরিয়ে পাঁচটা গুণই একবার করে করুন ({bn(hit)}/{bn(TARGETS.length)})।
      </Task>
    </>
  );
}

// A radio knob for k in −2…3, steps of 0.5, over a 270° sweep with 0° at the
// top. Drag round it, or use the arrow keys; the gap at the bottom never
// wraps −2 into 3.
const K_MIN = -2;
const K_MAX = 3;
const SWEEP = 135;
const angleOf = (k: number) => -SWEEP + ((k - K_MIN) / (K_MAX - K_MIN)) * 2 * SWEEP;
const polar = (r: number, deg: number): [number, number] => [70 + r * Math.sin((deg * Math.PI) / 180), 70 - r * Math.cos((deg * Math.PI) / 180)];

function Knob({ k, onTurn }: { k: number; onTurn: (k: number) => void }) {
  const set = (n: number) => {
    const c = Math.min(K_MAX, Math.max(K_MIN, Math.round(n * 2) / 2));
    if (c !== k) onTurn(c);
  };
  const follow = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    let a = (Math.atan2(e.clientX - r.left - r.width / 2, r.top + r.height / 2 - e.clientY) * 180) / Math.PI;
    if (Math.abs(a) > SWEEP) a = k > (K_MIN + K_MAX) / 2 ? SWEEP : -SWEEP;
    set(K_MIN + ((a + SWEEP) / (2 * SWEEP)) * (K_MAX - K_MIN));
  };
  const steps = Array.from({ length: (K_MAX - K_MIN) * 2 + 1 }, (_, i) => K_MIN + i / 2);
  const a = angleOf(k);

  return (
    <div className="mt-3 flex items-center justify-center gap-4">
      <button type="button" aria-label="কমান" onClick={() => set(k - 0.5)} disabled={k === K_MIN} className={`${quietBtn} w-11 justify-center px-0 text-xl`}>
        −
      </button>
      <svg
        viewBox="0 0 140 140"
        role="slider"
        tabIndex={0}
        aria-label="কত গুণ"
        aria-valuemin={K_MIN}
        aria-valuemax={K_MAX}
        aria-valuenow={k}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          follow(e);
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && follow(e)}
        onKeyDown={(e) => {
          const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 0.5 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -0.5 : 0;
          if (!d) return;
          e.preventDefault();
          set(k + d);
        }}
        className="block w-40 cursor-grab touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cat-blue active:cursor-grabbing"
      >
        {steps.map((t) => {
          const [x1, y1] = polar(50, angleOf(t));
          const [x2, y2] = polar(t % 1 ? 54 : 57, angleOf(t));
          const [lx, ly] = polar(65, angleOf(t));
          return (
            <g key={t}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={t === k ? 2.6 : 1.4} strokeLinecap="round" className={t === k ? "stroke-cat-blue" : "stroke-muted"} />
              {t % 1 === 0 && (
                <text x={lx} y={ly + 3.5} textAnchor="middle" className={`font-mono text-[10px] ${t === k ? "fill-cat-blue font-bold" : "fill-muted"}`}>
                  {sg(t)}
                </text>
              )}
            </g>
          );
        })}
        <circle cx={70} cy={70} r={43} className="fill-[#0f1b2d]/10" />
        <circle cx={70} cy={68} r={42} strokeWidth={1.5} className="fill-white stroke-[#c9d3de]" />
        <g className="transition-transform duration-200 motion-reduce:transition-none" style={{ transform: `rotate(${a}deg)`, transformOrigin: "70px 68px" }}>
          {Array.from({ length: 12 }, (_, i) => {
            const [x1, y1] = polar(36, i * 30);
            const [x2, y2] = polar(41, i * 30);
            return <line key={i} x1={x1} y1={y1 - 2} x2={x2} y2={y2 - 2} strokeWidth={1.2} className="stroke-[#c9d3de]" />;
          })}
          <line x1={70} y1={62} x2={70} y2={36} strokeWidth={5} strokeLinecap="round" className={k < 0 ? "stroke-cat-coral" : "stroke-cat-blue"} />
        </g>
        <circle cx={70} cy={68} r={6} className="fill-[#0f1b2d]/15" />
        <title>{`knob at ${k}`}</title>
      </svg>
      <button type="button" aria-label="বাড়ান" onClick={() => set(k + 0.5)} disabled={k === K_MAX} className={`${quietBtn} w-11 justify-center px-0 text-xl`}>
        +
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3¼ · A figure for screen 3's explanation, no task: where the tip went. The
//      arrow (1, 2) glides to × 3, then × 0.5, then × −2, and every stop
//      leaves a dot; the dots turn out to be one line through (0, 0), on both
//      sides of it. Whether that matches the sherbet dots is left to the reader.

const SC_FR = makeFrame(-2.5, 3.5, -5, 7, 11, 8);
const SC_RAIL = [1, 1, 3, 0.5, -2, -2];
const SC_RAIL_STOPS = [
  { m: 3, say: "লম্বা" },
  { m: 0.5, say: "খাটো" },
  { m: -2, say: "উল্টো" },
];

export function TipOnRail() {
  const s = useScene(5, [600, 1100, 1500, 1600, 1800]);
  const k = s.k;
  const [m] = useTween([SC_RAIL[k]], 900);

  return (
    <Scene
      scene={s}
      caption={
        k <= 1 ? (
          "(1, 2)-এর মাথাটা কোথায় কোথায় যায়, চোখ রাখুন।"
        ) : k === 2 ? (
          "× 3: একই দিকে, লম্বা।"
        ) : k === 3 ? (
          "× 0.5: একই দিকে, খাটো।"
        ) : k === 4 ? (
          "× −2: (0, 0) পার হয়ে উল্টো দিকে।"
        ) : (
          <span className={FADE}>তিনটা থামার জায়গাই একটা লাইনে, (0, 0)-এর এপারে আর ওপারে।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-4">
        <div className="w-[5.125rem] shrink-0">
          <Plane f={SC_FR} label="the arrow (1, 2) times 3, 0.5 and −2; every tip sits on one line through (0, 0)" className="my-0! max-w-none">
            {k >= 5 && (
              <path d={`M${SC_FR.sx(-2.5)} ${SC_FR.sy(-5)}L${SC_FR.sx(3.5)} ${SC_FR.sy(7)}`} strokeWidth={1.3} strokeDasharray="5 4" className={`${FADE} pointer-events-none fill-none stroke-cat-teal/80`} />
            )}
            {SC_RAIL_STOPS.map((st, i) =>
              k >= i + 2 ? (
                <circle
                  key={st.m}
                  cx={SC_FR.sx(st.m * V[0])}
                  cy={SC_FR.sy(st.m * V[1])}
                  r={3}
                  style={{ transitionDelay: "800ms" }}
                  className={`${POP} pointer-events-none fill-cat-violet/70`}
                />
              ) : null,
            )}
            <Dot f={SC_FR} at={O} r={2.4} />
            {k >= 1 && <Arrow f={SC_FR} from={O} to={times(m, V)} tone={m < 0 ? "coral" : "blue"} w={2.4} draw />}
          </Plane>
        </div>
        <div className="grid w-[6.5rem] gap-1.5">
          {SC_RAIL_STOPS.map((st, i) => (
            <div key={st.m} className={`leading-tight transition-opacity duration-500 motion-reduce:transition-none ${k >= i + 2 ? "opacity-100" : "opacity-0"}`}>
              <span className="font-mono text-sm font-bold text-cat-violet">× {sg(st.m)}</span> <span className="text-sm">{st.say}</span>
              <div className={`font-mono text-sm ${st.m < 0 ? "text-cat-coral" : "text-cat-blue"}`}>{tup(times(st.m, V))}</div>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: minus means walking the
//      other way (2.2, 3.1). Shiku walks the card (1, 2) backwards, twice, one
//      square at a time: 2 west and 4 south, so −2 × (1, 2) = (−2, −4), still
//      on the blue arrow's own line, just past (0, 0).

const SC_FW = makeFrame(-3, 2, -5, 3, 16, 12);
const SC_BACK: XY[] = [O, [-1, 0], [-1, -1], [-1, -2], [-2, -2], [-2, -3], [-2, -4]];
const SC_BACK_END: XY = [-2, -4];

export function ShikuBackward() {
  const s = useScene(8, [500, 1300, 420, 420, 800, 420, 420, 700]);
  const k = s.k;
  const i = Math.min(Math.max(k - 1, 0), SC_BACK.length - 1);
  const walked = SC_BACK.slice(0, i + 1);
  const steps = walked.slice(1).map((c, j) => [c[0] - walked[j][0], c[1] - walked[j][1]]);
  const west = steps.filter((d) => d[0] < 0).length;
  const south = steps.filter((d) => d[1] < 0).length;
  const over = k >= 8;

  return (
    <Scene
      scene={s}
      caption={
        k <= 1 ? (
          "Card (1, 2) বলে: 1 ঘর পূর্বে, তারপর 2 ঘর উত্তরে।"
        ) : !over ? (
          "−2 মানে card-টা দুইবার হাঁটা, কিন্তু প্রতিটা পা উল্টো দিকে।"
        ) : (
          <span className={FADE}>উল্টো দিকে, দ্বিগুণ দূরে। তবু নীল arrow-এর লাইনেই, <span className="whitespace-nowrap">(0, 0)-এর</span> ওপারে।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-4">
        <div className="w-[8rem] shrink-0">
          <Plane f={SC_FW} label="Shiku walks the card (1, 2) backwards twice: 2 west, 4 south, to (−2, −4)" className="my-0! max-w-none">
            {over && (
              <path d={`M${SC_FW.sx(-2.5)} ${SC_FW.sy(-5)}L${SC_FW.sx(1.5)} ${SC_FW.sy(3)}`} strokeWidth={1.3} strokeDasharray="5 4" className={`${FADE} pointer-events-none fill-none stroke-cat-teal/70`} />
            )}
            {k >= 1 && <Arrow f={SC_FW} from={O} to={V} tone="blue" w={2.4} draw />}
            {k >= 1 && (
              <Label f={SC_FW} at={V} dx={-7} dy={3} anchor="end" size={8.5} weight={700} className={`${FADE} fill-cat-blue`}>
                (1, 2)
              </Label>
            )}
            <Trail f={SC_FW} cells={walked} />
            {over && <Arrow f={SC_FW} from={O} to={SC_BACK_END} tone="coral" w={2.8} draw />}
            <Shiku f={SC_FW} at={SC_BACK[i]} />
          </Plane>
        </div>
        <div className="grid w-[7.5rem] gap-1 text-sm">
          <div className="font-mono text-base font-bold">
            <span className="text-cat-coral">−2</span> × (1, 2)
          </div>
          <div className="flex justify-between">
            <span className="text-muted">পশ্চিমে</span>
            <span>{bn(west)} ঘর</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">দক্ষিণে</span>
            <span>{bn(south)} ঘর</span>
          </div>
          <div className={`font-mono text-base font-bold text-cat-coral transition-opacity duration-500 motion-reduce:transition-none ${over ? "opacity-100" : "opacity-0"}`}>= (−2, −4)</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation, no task: × 0. The arrow (1, 2)
//      halves, then shrinks all the way to a dot at (0, 0); faint spokes then
//      ask which way a dot faces, and there is no answer: it has no direction.

const SC_FZ = makeFrame(-1.5, 2, -1.5, 3, 20, 8);
const SC_ZERO = [1, 0.5, 0, 0];

export function ZeroShrink() {
  const s = useScene(3, [800, 1400, 1500]);
  const k = s.k;
  const now = SC_ZERO[k];
  const [m] = useTween([now], 900);
  const cx = SC_FZ.sx(0);
  const cy = SC_FZ.sy(0);

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "Card (1, 2), আবার একটা arrow।"
        ) : k === 1 ? (
          "× 0.5: অর্ধেক হলো, মুখ সেই একই দিকে।"
        ) : k === 2 ? (
          "× 0: arrow গুটিয়ে একটা বিন্দু, (0, 0)।"
        ) : (
          <span className={FADE}>কোথাও যায় না, তাই কোন দিকে মুখ, সেটাও বলার উপায় নাই।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-4">
        <div className="w-[5.4rem] shrink-0">
          <Plane f={SC_FZ} label={`(1, 2) times ${now} is ${tup(times(now, V))}${k >= 3 ? ": a dot with no direction" : ""}`} className="my-0! max-w-none">
            <Arrow f={SC_FZ} from={O} to={V} tone="ink" w={1.6} dashed faint />
            <Arrow f={SC_FZ} from={O} to={times(m, V)} tone="blue" w={2.6} />
            {k >= 3 &&
              Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4;
                return (
                  <path
                    key={i}
                    d={`M${cx + 8 * Math.cos(a)} ${cy - 8 * Math.sin(a)}L${cx + 20 * Math.cos(a)} ${cy - 20 * Math.sin(a)}`}
                    strokeWidth={1.3}
                    strokeDasharray="2 3"
                    style={{ transitionDelay: `${i * 90}ms` }}
                    className={`${FADE} pointer-events-none fill-none stroke-[#0f1b2d]/40`}
                  />
                );
              })}
            {k >= 2 && <Dot f={SC_FZ} at={O} r={4.5} className="fill-cat-violet" pop />}
          </Plane>
        </div>
        <div className="w-[8.5rem] text-center whitespace-nowrap">
          <div key={now} className={`${FADE} font-mono text-base`}>
            <b className="text-cat-violet">{sg(now)}</b> × (1, 2)
          </div>
          <div key={`r${now}`} className={`${FADE} font-mono text-base font-bold ${now === 0 ? "text-cat-violet" : "text-cat-blue"}`}>
            = {tup(times(now, V))}
          </div>
          <div className="mt-1 min-h-5 text-sm font-semibold text-cat-violet">{k >= 3 && <span className={FADE}>দিক কোনটা? নাই।</span>}</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · No knob now: five number cards, each filed under what it will do to
//     (1, 2). Built to fit one phone screen with nothing moving: the card and a
//     small sheet share the top row (the sheet draws each arrow once filed),
//     and the five outcomes are the rows the reader taps, so the answer buttons
//     and the results table are the same list. A miss is told inside the card
//     box, which keeps its height; the rule shows in the rows at the end.

const CASES = [2, -0.5, 0, 0.25, -3];
const KINDS = [
  { say: "লম্বা হবে", rule: "সংখ্যাটা 1-এর চেয়ে বড়" },
  { say: "খাটো হবে", rule: "0 আর 1-এর মাঝে" },
  { say: "গুটিয়ে বিন্দু হবে", rule: "ঠিক 0" },
  { say: "উল্টে খাটো হবে", rule: "0 আর −1-এর মাঝে" },
  { say: "উল্টে লম্বা হবে", rule: "−1-এর চেয়েও ছোট" },
];
const kindOf = (k: number) => (k > 1 ? 0 : k > 0 ? 1 : k === 0 ? 2 : k > -1 ? 3 : 4);
const FS = makeFrame(-3.2, 2.2, -6.2, 4.2, 12, 6);

export function FiveCases() {
  const pass = useGate();
  const [sorted, setSorted] = useSeed("sorted", 0);
  const [miss, setMiss] = useSeed<{ n: number; pick: number } | null>("miss", null);
  const all = sorted === CASES.length;
  const card = CASES[sorted];
  const last = sorted > 0 ? CASES[sorted - 1] : null;

  const choose = (i: number) => {
    if (all) return;
    if (i !== kindOf(card)) {
      setMiss((m) => ({ n: (m?.n ?? 0) + 1, pick: i }));
      return;
    }
    setMiss(null);
    setSorted(sorted + 1);
    if (sorted + 1 === CASES.length) pass("Minus থাকলে উল্টো। আর minus বাদ দিয়ে সংখ্যাটা 1-এর চেয়ে বড় হলে লম্বা, ছোট হলে খাটো।");
  };

  return (
    <>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-stretch gap-3">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-cat-violet/40 bg-surface px-2 py-2 text-center">
          {!all ? (
            <>
              <div key={sorted} className={`${POP} inline-block`}>
                <div className="text-xs font-semibold text-muted">
                  card&nbsp;{bn(sorted + 1)}/{bn(CASES.length)}
                </div>
                <div className="font-mono text-3xl leading-tight font-bold text-cat-violet">× {sg(card)}</div>
              </div>
              {/* tall enough for the longer miss line, so a miss never moves the rows */}
              <div className="mt-1 min-h-[5.4rem] text-[0.85rem] leading-snug">
                {miss ? (
                  <span key={miss.n} className="block text-danger transition duration-300 motion-reduce:transition-none starting:opacity-0">
                    উঁহু, {sg(card)} দিয়ে গুণ করলে (1, 2) হয় <span className="font-mono whitespace-nowrap">{tup(times(card, V))}</span>। Arrow-টা কোন দিকে মুখ করবে আর কতটা লম্বা হবে, আরেকবার ভাবুন।
                  </span>
                ) : (
                  <span className="text-muted">(1, 2)-কে এই সংখ্যা দিয়ে গুণ করলে arrow-টা…</span>
                )}
              </div>
            </>
          ) : (
            <div className={`${FADE} text-[0.95rem] leading-snug font-semibold text-cat-teal`}>পাঁচটা card-ই জায়গামতো বসেছে!</div>
          )}
        </div>
        <div className="w-[4.5rem]">
          <Plane f={FS} label={last === null ? "the arrow (1, 2)" : `(1, 2) times ${last} is ${tup(times(last, V))}`} className="my-0! max-w-[4.5rem]">
            <Arrow f={FS} from={O} to={V} tone="ink" w={1.6} dashed faint />
            {last !== null && <Arrow key={sorted} f={FS} from={O} to={times(last, V)} tone={last < 0 ? "coral" : "blue"} w={2.4} draw />}
            {last === 0 && <Dot f={FS} at={O} r={3.5} className="fill-cat-violet" pop />}
          </Plane>
        </div>
      </div>
      <div className="mt-3 grid gap-1.5">
        {KINDS.map((c, i) => {
          const n = CASES.slice(0, sorted).find((x) => kindOf(x) === i);
          const filed = n !== undefined;
          const wrong = miss !== null && miss.pick === i && !all;
          return (
            <button
              key={wrong ? `${c.say}-${miss.n}` : c.say}
              type="button"
              disabled={filed || all}
              onClick={() => choose(i)}
              className={`grid min-h-[2.375rem] cursor-pointer grid-cols-[1fr_auto] items-center gap-x-2 rounded-xl border-2 px-3 py-0.5 text-left text-[0.95rem] leading-snug transition-colors motion-reduce:transition-none disabled:cursor-default ${
                filed
                  ? "border-cat-violet/30 bg-cat-violet/5"
                  : wrong
                    ? "nudge border-danger/50 bg-danger/5 text-danger"
                    : "border-border hover:border-cat-violet/60"
              }`}
            >
              <span>{c.say}</span>
              <span className="font-mono text-sm">
                {filed ? (
                  <span className={`${POP} inline-block`}>
                    <b className="text-cat-violet">× {sg(n)}</b> → {tup(times(n, V))}
                  </span>
                ) : (
                  <span className="text-muted/50">?</span>
                )}
              </span>
              {all && <span className={`${FADE} col-span-2 text-sm font-semibold text-cat-teal`}>{c.rule}</span>}
            </button>
          );
        })}
      </div>
      <Task done={all}>
        প্রতিটা card-এ আগে মনে মনে ভাবুন, তারপর বলুন arrow-টার কী দশা হবে ({bn(sorted)}/{bn(CASES.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4¼ · A figure for screen 4's explanation, no task: the two questions that
//      sort all five outcomes. The numbers lie on a line; question one
//      (minus?) splits it at 0 into উল্টো and একই দিক, question two (bigger
//      than 1, minus aside?) splits each half at ±1 into লম্বা and খাটো, each
//      band with a small (1, 2) arrow showing what it does. Last, 0 alone: a dot.

const SC_NX = (v: number) => 24 + (v + 3.5) * 36;
const SC_NY = 58;
const SC_BANDS = [
  { v: -2, l: -2, say: "লম্বা" },
  { v: -0.5, l: -0.5, say: "খাটো" },
  { v: 0.5, l: 0.5, say: "খাটো" },
  { v: 2, l: 2, say: "লম্বা" },
];

/** a little (1, 2)-way arrow, long or short, flipped for a minus, centred at (cx, cy) */
function ScMini({ cx, cy, l, delay }: { cx: number; cy: number; l: number; delay: number }) {
  const len = Math.abs(l) > 1 ? 26 : 12;
  const [ux, uy] = [(Math.sign(l) * 1) / Math.sqrt(5), (-Math.sign(l) * 2) / Math.sqrt(5)];
  const [tx, ty] = [cx + (ux * len) / 2, cy + (uy * len) / 2];
  const [bx, by] = [tx - ux * 6, ty - uy * 6];
  const tone = l < 0 ? "coral" : "blue";
  return (
    <g style={{ transitionDelay: `${delay}ms` }} className={FADE}>
      <path d={`M${cx - (ux * len) / 2} ${cy - (uy * len) / 2}L${bx} ${by}`} strokeWidth={2} strokeLinecap="round" className={`fill-none ${tone === "coral" ? "stroke-cat-coral" : "stroke-cat-blue"}`} />
      <path d={`M${tx} ${ty}L${bx - uy * 3.4} ${by + ux * 3.4}L${bx + uy * 3.4} ${by - ux * 3.4}Z`} className={tone === "coral" ? "fill-cat-coral" : "fill-cat-blue"} />
    </g>
  );
}

export function TwoQuestions() {
  const s = useScene(3, [700, 1900, 1900]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "সংখ্যাগুলো একটা লাইনে সাজালাম। এবার মাত্র দুইটা প্রশ্ন।"
        ) : k === 1 ? (
          "প্রথম প্রশ্ন: minus আছে? থাকলে arrow উল্টাবে।"
        ) : k === 2 ? (
          "দ্বিতীয় প্রশ্ন: minus বাদে 1-এর চেয়ে বড়? বড় হলে লম্বা, ছোট হলে খাটো।"
        ) : (
          <span className={FADE}>আর ঠিক 0 হলে arrow-ই নাই, শুধু একটা বিন্দু।</span>
        )
      }
    >
      <svg viewBox="0 0 300 92" role="img" aria-label="a number line split at 0 into flipped and same way, and at −1 and 1 into longer and shorter; 0 alone is a dot" className="mx-auto block w-full max-w-[19rem]">
        {k >= 1 && (
          <g className={FADE}>
            <rect x={SC_NX(-3.5)} y={6} width={SC_NX(0) - SC_NX(-3.5)} height={46} rx={4} className="fill-cat-coral/10" />
            <rect x={SC_NX(0)} y={6} width={SC_NX(3.5) - SC_NX(0)} height={46} rx={4} className="fill-cat-blue/10" />
            <text x={SC_NX(-3.5) + 5} y={19} fontSize={11.5} fontWeight={700} className="fill-cat-coral">
              উল্টো
            </text>
            <text x={SC_NX(3.5) - 5} y={19} textAnchor="end" fontSize={11.5} fontWeight={700} className="fill-cat-blue">
              একই দিক
            </text>
          </g>
        )}
        {k >= 2 && (
          <>
            {[-1, 1].map((v) => (
              <path key={v} d={`M${SC_NX(v)} 6V${SC_NY + 4}`} strokeWidth={1.3} strokeDasharray="3 3" className={`${FADE} fill-none stroke-cat-violet`} />
            ))}
            {SC_BANDS.map((b, i) => (
              <g key={b.v}>
                <ScMini cx={SC_NX(b.v)} cy={31} l={b.l} delay={i * 150} />
                <text x={SC_NX(b.v)} y={89} textAnchor="middle" fontSize={11.5} fontWeight={600} style={{ transitionDelay: `${i * 150}ms` }} className={`${FADE} fill-foreground`}>
                  {b.say}
                </text>
              </g>
            ))}
          </>
        )}
        <path d={`M${SC_NX(-3.5)} ${SC_NY}H${SC_NX(3.5)}`} strokeWidth={1.4} className="fill-none stroke-foreground/50" />
        {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
          <g key={v}>
            <path d={`M${SC_NX(v)} ${SC_NY - 3}V${SC_NY + 3}`} strokeWidth={1.2} className="stroke-foreground/50" />
            <text x={SC_NX(v)} y={SC_NY + 14} textAnchor="middle" fontSize={10} className="fill-muted font-mono">
              {sg(v)}
            </text>
          </g>
        ))}
        {k >= 3 && (
          <>
            <circle cx={SC_NX(0)} cy={SC_NY} r={4.5} className={`${POP} fill-cat-violet`} />
            <text x={SC_NX(0)} y={SC_NY - 9} textAnchor="middle" fontSize={11.5} fontWeight={700} className={`${FADE} fill-cat-violet`}>
              বিন্দু
            </text>
          </>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4⅓ · A figure for screen 4's explanation, no task: where the name comes
//      from. A scale (the ruler) measures the arrow v at 2 squares; "scale"
//      grows an "ar"; the scalar 3 sits in front of v and v's length on the
//      ruler turns three times as long; then the 3 is written λ, read lambda.

const SC_RX = (u: number) => 12 + u * 39;

export function ScaleToScalar() {
  const s = useScene(4, [600, 1300, 1500, 1700]);
  const k = s.k;
  const [len] = useTween([k >= 3 ? 6 : 2], 1100);

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "Scale দিয়ে আমরা মাপি।"
        ) : k === 1 ? (
          `Arrow v-কে মাপলাম: লম্বায় ${bn(2)} ঘর।`
        ) : k === 2 ? (
          "Scale থেকেই নাম, scalar।"
        ) : k === 3 ? (
          `3 বসলো v-এর সামনে, আর v-এর মাপটাই ${bn(3)} গুণ হয়ে গেল।`
        ) : (
          <span className={FADE}>Paper-এ এই সংখ্যাটাকে লেখে λ, পড়তে হয় lambda।</span>
        )
      }
    >
      <div className="mx-auto w-full max-w-[16.5rem]">
        <div className="flex h-11 items-end justify-between px-1">
          <span className="font-serif text-2xl">
            scal
            {k >= 2 ? (
              <b key="ar" className={`${POP} inline-block text-cat-violet`}>
                ar
              </b>
            ) : (
              "e"
            )}
          </span>
          <span className="flex items-end gap-0.5 font-serif text-2xl italic">
            {k >= 3 && (
              <b key={k >= 4 ? "l" : "3"} className={`${POP} inline-block text-cat-violet ${k >= 4 ? "" : "not-italic"}`}>
                {k >= 4 ? "λ" : "3"}
              </b>
            )}
            <span>v</span>
            <span className="ml-1 min-w-[3.2rem] pb-0.5 font-sans text-xs text-muted not-italic">{k >= 4 && <span className={FADE}>lambda</span>}</span>
          </span>
        </div>
        <svg viewBox="0 0 260 58" role="img" aria-label={`a ruler measuring the arrow v at 2 units${k >= 3 ? "; 3v measures 6" : ""}`} className="mt-1 block w-full">
          {k >= 1 && <path d={`M${SC_RX(0)} 14H${SC_RX(len) - 8}`} strokeWidth={3} strokeLinecap="round" className="fill-none stroke-cat-blue" />}
          {k >= 1 && <path d={`M${SC_RX(len)} 14l-9 -5v10Z`} className="fill-cat-blue" />}
          <rect x={4} y={26} width={252} height={24} rx={3} fill="#fde68a" stroke="#b45309" strokeWidth={1} />
          {Array.from({ length: 7 }, (_, u) => (
            <g key={u}>
              <path d={`M${SC_RX(u)} 26v9`} stroke="#92400e" strokeWidth={1.2} />
              {u < 6 && <path d={`M${SC_RX(u + 0.5)} 26v5`} stroke="#92400e" strokeWidth={0.9} />}
              <text x={SC_RX(u)} y={46} textAnchor="middle" fontSize={9} fontFamily="ui-monospace, monospace" fill="#78350f">
                {u}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: λv = (λv₁, λv₂, …) on a
//      longer card. λ = 3 hops from slot to slot and multiplies each one; the
//      "…" at the end stands for the two thousand slots nobody writes out.

const SC_LONG = [1, 2, 5, 0, -1, 4];
const SC_LAMBDA = 3;
const SC_CELL = "flex h-8 w-8 items-center justify-center rounded-lg font-mono text-sm";

export function LambdaEverySlot() {
  const s = useScene(SC_LONG.length + 1, [700, 650, 650, 650, 650, 650, 800]);
  const k = s.k;
  const at = Math.max(0, k - 1);

  return (
    <Scene
      scene={s}
      caption={
        k <= SC_LONG.length ? (
          `λ = ${SC_LAMBDA} এক ঘর থেকে পরের ঘরে যাচ্ছে, আর প্রতিটা সংখ্যাকে ${SC_LAMBDA} দিয়ে গুণ করছে।`
        ) : (
          <span className={FADE}>ঘর ছয়টা হোক বা দুই হাজার, কাজ একই। কোনো ঘর বাদ পড়ে না।</span>
        )
      }
    >
      <div className="mx-auto w-fit" role="img" aria-label={`3 times (${SC_LONG.join(", ")}, …) is (${SC_LONG.map((n) => SC_LAMBDA * n).join(", ")}, …)`}>
        <div className="relative ml-9 h-7">
          {k >= 1 && (
            <span
              className={`${FADE} absolute top-0 left-0 flex h-6 w-8 items-center justify-center rounded-full bg-cat-violet font-mono text-xs font-bold text-white transition-transform duration-300 motion-reduce:transition-none`}
              style={{ transform: `translateX(${at * 2.25}rem)` }}
            >
              × {SC_LAMBDA}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="w-8 pr-1 text-right font-serif text-lg italic">v</span>
          {SC_LONG.map((n, i) => (
            <span key={i} className={`${SC_CELL} border-2 transition-colors duration-300 motion-reduce:transition-none ${k >= 1 && i === at ? "border-cat-violet" : "border-border"}`}>
              {sg(n)}
            </span>
          ))}
          <span className={`${SC_CELL} border-2 text-muted ${k > SC_LONG.length ? "border-cat-violet" : "border-transparent"}`}>…</span>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <span className="w-8 pr-1 text-right font-serif text-lg italic">{SC_LAMBDA}v</span>
          {SC_LONG.map((n, i) => (
            <span key={i} className={`${SC_CELL} bg-cat-violet/10`}>
              {k > i && <b className={`${POP} inline-block text-cat-violet`}>{sg(SC_LAMBDA * n)}</b>}
            </span>
          ))}
          <span className={SC_CELL}>{k > SC_LONG.length && <span className={`${FADE} text-muted`}>…</span>}</span>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: back to 3.1's field.
//      সামিন walks to his spot (2, 1), the treasure chest waits at (6, 4). He
//      remembers subtracting last time, then turns right round: this time the
//      plan is to flip his arrow and add. The card it lands on stays hidden,
//      that is the widget's to find.

const S5_Y = 150;
const S5_SAMIN = 78;

export function SaminTurns() {
  const s = useScene(4, [600, 1600, 1400, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সামিন stands at (2, 1) on the field, the treasure chest at (6, 4); he remembers subtracting, then turns round to flip his arrow and add">
        <Tree x={176} y={S5_Y - 2} s={0.9} />
        <Tree x={306} y={S5_Y - 2} s={0.7} />
        {k >= 2 && (
          <>
            <path d={`M34 ${S5_Y}V${S5_Y - 22}`} stroke="#78350f" strokeWidth={2.4} className={FADE} />
            <CastCard x={34} y={S5_Y - 30} text="(2, 1)" />
            <Chest x={256} y={S5_Y} />
            <CastCard x={256} y={S5_Y - 30} text="(6, 4)" tone="amber" />
          </>
        )}
        <Person
          who="samin"
          x={k >= 1 ? S5_SAMIN : -30}
          y={S5_Y}
          walking={k === 1}
          facing={k >= 4 ? -1 : 1}
          arm={k >= 4 ? "point" : "down"}
          mood={k === 3 ? "puzzled" : k >= 4 ? "smug" : "plain"}
          label={k >= 1}
        />
        {k === 3 && <Bubble x={S5_SAMIN} y={S5_Y - 66} tone="think" lines={["আগেরবার বিয়োগ", "করেছিলাম…"]} />}
        {k >= 4 && <Bubble x={S5_SAMIN} y={S5_Y - 66} lines={["এবার উল্টে দিয়ে", "যোগ করি?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · সামিন and the prize from 3.1 again. Flip her arrow, add it to the prize's
//     arrow, and compare with the card she got by subtracting: the same card.

const F5 = makeFrame(-3, 7, -2, 5, 28);
const SV: XY = [2, 1];
const SU: XY = [6, 4];
const FLIP = times(-1, SV);
const CARD5: XY = [4, 3];
const LAND5 = ["(4, 3)", "(8, 5)", "(−4, −3)"];
const STAGES = ["সামিনের arrow উল্টান", "গুপ্তধনের arrow-এর মাথায় জুড়ুন", "৩.১-এর card-এর সাথে মিলান"];

export function FlipThenAdd() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [stage, setStage] = useSeed("stage", 0);
  const over = stage === STAGES.length;
  // Stage 2 lifts the flipped arrow off the origin and carries it to the
  // prize arrow's tip. The first 30% of the tween waits for the blue arrow
  // to draw; the rest is the carry, arcing up and setting down.
  const [p] = useTween([stage >= 2 ? 1 : 0], 2200);
  const lin = 1 - Math.cbrt(1 - p);
  const q0 = Math.min(1, Math.max(0, (lin - 0.3) / 0.7));
  const q = q0 * q0 * (3 - 2 * q0);
  const lift = Math.sin(Math.PI * q) * 0.9;
  const carryFrom: XY = [q * SU[0], q * SU[1] + lift];
  const carryTo: XY = [carryFrom[0] + FLIP[0], carryFrom[1] + FLIP[1]];
  const landed = q > 0.999;

  const next = () => {
    setStage(stage + 1);
    if (stage + 1 === STAGES.length) pass("উল্টে দিয়ে যোগ করলেও সেই (4, 3)। বিয়োগ আলাদা কোনো চাল না: u − v = u + (−1)v।");
  };

  return (
    <>
      <Plane f={F5} ticks={1} label={`সামিন at (2, 1), the prize at (6, 4)${stage >= 2 ? "; (6, 4) plus (−2, −1) lands on (4, 3)" : ""}`}>
        <Prize f={F5} at={SU} found={over} />
        <Samin f={F5} at={SV} />
        {stage >= 1 && (
          <>
            <Arrow f={F5} from={O} to={SV} tone="teal" w={2} faint />
            {stage === 1 ? <Arrow f={F5} from={O} to={FLIP} tone="coral" draw /> : <Arrow f={F5} from={O} to={FLIP} tone="coral" w={2} dashed faint />}
            <Label f={F5} at={FLIP} dx={-4} dy={16} anchor="middle" size={9} className={`${FADE} fill-cat-coral`}>
              উল্টো সামিন
            </Label>
          </>
        )}
        {stage >= 2 && (
          <>
            <Arrow f={F5} from={O} to={SU} tone="blue" draw faint={over} />
            {!landed && q > 0 && (
              <path
                d={`M${F5.sx(0)} ${F5.sy(0)}L${F5.sx(carryFrom[0])} ${F5.sy(carryFrom[1])}`}
                strokeWidth={1.4}
                strokeDasharray="3 4"
                className="pointer-events-none fill-none stroke-cat-coral/60"
              />
            )}
            <g style={{ filter: !landed && q > 0 ? "drop-shadow(0 4px 3px rgb(15 27 45 / 0.35))" : undefined }}>
              <Arrow f={F5} from={carryFrom} to={carryTo} tone="coral" w={landed ? 2.6 : 3.2} faint={over} />
            </g>
            {landed && <Dot f={F5} at={CARD5} r={5} className="fill-cat-violet" pop />}
          </>
        )}
        {over && (
          <>
            <Arrow f={F5} from={O} to={CARD5} tone="teal" w={3} draw />
            <Arrow f={F5} from={SV} to={SU} tone="teal" w={2.4} dashed />
            <Label f={F5} at={CARD5} dx={-6} dy={-9} anchor="end" size={10} weight={700} className={`${FADE} fill-cat-teal`}>
              (4, 3)
            </Label>
          </>
        )}
      </Plane>
      <div className="text-sm font-medium text-muted">গুপ্তধনের arrow (6, 4)-এর সাথে উল্টানো সামিনকে যোগ করলে কোথায় গিয়ে থামবেন?</div>
      <div className="mt-2 grid gap-2">
        {LAND5.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, 0)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="font-mono">{o}</span>
          </Choice>
        ))}
      </div>
      {stage > 0 && (
        <div key={stage} className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          {stage === 1 && <>সামিনের (2, 1) উল্টে হলো (−2, −1)। লম্বায় একই, শুধু মুখ ঘুরিয়ে দাঁড়িয়েছে।</>}
          {stage === 2 && (
            <>
              গুপ্তধনের arrow-এর মাথা থেকে উল্টানো arrow ধরে গেলে থামে <b className="font-mono">(4, 3)</b>-এ।
              <div className="font-mono">(6, 4) + (−2, −1) = (4, 3)</div>
            </>
          )}
          {over && (
            <>
              ৩.১-এ সামিনের card ছিল <span className="font-mono">(6, 4) − (2, 1) = (4, 3)</span>। দুই রাস্তায় একই card! সবুজ দুইটা arrow আসলে একই card, শুধু দুই জায়গায় আঁকা।
            </>
          )}
        </div>
      )}
      {guess !== null && !over && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={next} className={`${primaryBtn} bg-cat-violet`}>
            {bn(stage + 1)} · {STAGES[stage]}
          </button>
        </div>
      )}
      <Task done={over}>আগে guess দিন, তারপর তিন ধাপে হিসাবটা করে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5¼ · A figure for screen 5's explanation, no task: the formula, built from
//      the numbers the reader just used. 3.1's subtraction (6, 4) − (2, 1)
//      gives (4, 3); −1 times সামিনের (2, 1) is (−2, −1); adding that to (6, 4)
//      gives (4, 3) again. The two results light up, and u − v = u + (−1)v
//      lands last.

const SC_SUB = [
  { sym: "u − v", work: "(6, 4) − (2, 1)", out: "(4, 3)", ink: "text-cat-teal" },
  { sym: "(−1)v", work: "(−1) · (2, 1)", out: "(−2, −1)", ink: "text-cat-coral" },
  { sym: "u + (−1)v", work: "(6, 4) + (−2, −1)", out: "(4, 3)", ink: "text-cat-teal" },
];

export function SubtractAsAdd() {
  const s = useScene(4, [600, 1700, 1700, 1800]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k <= 1 ? (
          "৩.১-এ বিয়োগ করে সামিন পেয়েছিল (4, 3)।"
        ) : k === 2 ? (
          "সামিনের arrow উল্টানো মানে −1 দিয়ে গুণ।"
        ) : k === 3 ? (
          "তারপর একদম সাধারণ যোগ।"
        ) : (
          <span className={FADE}>দুই রাস্তার result হুবহু এক। তাই বিয়োগ আলাদা করে মনে রাখার দরকার নাই।</span>
        )
      }
    >
      <div className="mx-auto grid w-fit grid-cols-[auto_auto] items-center gap-x-3 gap-y-1.5" role="img" aria-label="(6, 4) − (2, 1) = (4, 3); (−1) · (2, 1) = (−2, −1); (6, 4) + (−2, −1) = (4, 3); so u − v = u + (−1)v">
        {SC_SUB.map((r, i) => (
          <div key={r.sym} className="contents">
            <span className={`text-right font-serif text-base whitespace-nowrap italic transition-opacity duration-500 motion-reduce:transition-none ${k >= i + 1 ? "opacity-100" : "opacity-0"}`}>{r.sym}</span>
            <span className="min-h-7 font-mono text-[0.8rem] whitespace-nowrap">
              {k >= i + 1 && (
                <span className={FADE}>
                  {r.work} ={" "}
                  <b
                    style={{ transitionDelay: "700ms" }}
                    className={`${POP} inline-block rounded-md px-1 transition-colors duration-500 motion-reduce:transition-none ${r.ink} ${k >= 4 && i !== 1 ? "bg-cat-teal/15 ring-2 ring-cat-teal/50" : ""}`}
                  >
                    {r.out}
                  </b>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 min-h-8 text-center font-serif text-xl italic">
        {k >= 4 && (
          <b style={{ transitionDelay: "500ms" }} className={`${FADE} text-cat-violet`}>
            u − v = u + (−1)v
          </b>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: 6 − 2 and 6 + (−2) on a
//      number line. First two hops back from 6; then a −2 arrow, drawn at 0,
//      is carried to 6 and laid on from there. Both end on 4.

const SC_LX = (v: number) => 14 + (v + 2.5) * 25.5;
const SC_LY = 56;

export function SixMinusTwo() {
  const s = useScene(4, [600, 1600, 1400, 1800]);
  const k = s.k;
  const [b] = useTween([k >= 3 ? 6 : 0], 1300);
  const tail = SC_LX(b);
  const head = SC_LX(b - 2);

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "সংখ্যার লাইনে 6।"
        ) : k === 1 ? (
          `6 − 2: পিছনে ${bn(2)} ঘর হাঁটা।`
        ) : k === 2 ? (
          `আর −2 মানে উল্টো দিকে ${bn(2)} ঘরের একটা arrow।`
        ) : k === 3 ? (
          "ওকে 6-এর মাথায় জুড়ে দিলাম: 6 + (−2)।"
        ) : (
          <span className={FADE}>দুই রাস্তাতেই 4। একই কথা, দুইভাবে লেখা।</span>
        )
      }
    >
      <svg viewBox="0 0 258 96" role="img" aria-label="on a number line, 6 − 2 hops back to 4, and a −2 arrow laid on from 6 also ends at 4" className="mx-auto block w-full max-w-[17rem]">
        <path d={`M${SC_LX(-2.5)} ${SC_LY}H${SC_LX(6.5)}`} strokeWidth={1.4} className="fill-none stroke-foreground/50" />
        {Array.from({ length: 9 }, (_, i) => i - 2).map((v) => (
          <g key={v}>
            <path d={`M${SC_LX(v)} ${SC_LY - 3}V${SC_LY + 3}`} strokeWidth={1.2} className="stroke-foreground/50" />
            <text x={SC_LX(v)} y={SC_LY + 14} textAnchor="middle" fontSize={10} className="fill-muted font-mono">
              {sg(v)}
            </text>
          </g>
        ))}
        {k >= 1 && (
          <>
            <Draw d={`M${SC_LX(6)} ${SC_LY - 4}Q${SC_LX(5.5)} ${SC_LY - 26} ${SC_LX(5)} ${SC_LY - 4}`} ms={500} strokeWidth={2} className="stroke-cat-blue" />
            <Draw d={`M${SC_LX(5)} ${SC_LY - 4}Q${SC_LX(4.5)} ${SC_LY - 26} ${SC_LX(4)} ${SC_LY - 4}`} ms={500} delay={550} strokeWidth={2} className="stroke-cat-blue" />
            <text x={SC_LX(5)} y={SC_LY - 32} textAnchor="middle" fontSize={12} fontWeight={700} className={`${FADE} fill-cat-blue font-mono`}>
              6 − 2
            </text>
          </>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d={`M${tail} 84H${head + 7}`} strokeWidth={3} strokeLinecap="round" className="fill-none stroke-cat-coral" />
            <path d={`M${head} 84l8 -5v10Z`} className="fill-cat-coral" />
            {b > 5.95 ? (
              <text x={head - 6} y={88} textAnchor="end" fontSize={12} fontWeight={700} className={`${FADE} fill-cat-coral font-mono`}>
                6 + (−2)
              </text>
            ) : (
              <text x={tail + 6} y={88} fontSize={12} fontWeight={700} className="fill-cat-coral font-mono">
                −2
              </text>
            )}
          </g>
        )}
        {k >= 4 && <circle cx={SC_LX(4)} cy={SC_LY} r={5.5} className={`${POP} fill-cat-teal`} />}
        <circle cx={SC_LX(6)} cy={SC_LY} r={4} className="fill-foreground" />
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: ডাক্তার আপার health stall
//      in a corner of the fair. She walks up to the board, where A, B and C's
//      cards (height cm, weight kg) go up, and asks who is built most like A.
//      Then a volunteer arrives with the idea of writing the weights in grams.
//      Whether that changes the answer is the widget's question. The volunteer
//      is not one of the cast: করিম's look, labelled "volunteer".

const S6_Y = 150;
const S6_APA = 160;
const S6_VOL = 234;
const S6_ROWS: { n: string; v: string; tone: "blue" | "teal" }[] = [
  { n: "A", v: "(172, 68)", tone: "blue" },
  { n: "B", v: "(190, 69)", tone: "teal" },
  { n: "C", v: "(173, 78)", tone: "teal" },
];

export function HealthBoard() {
  const s = useScene(5, [600, 1400, 1300, 2600, 1500]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="ডাক্তার আপা at her health stall points at a board of three cards, A, B and C, and asks who is built most like A; a volunteer suggests writing kg as grams">
        <Stall x={284} y={S6_Y} w={56} sign="Health" color="#0d9488" />
        {/* the board on its legs */}
        <path d={`M30 118L24 ${S6_Y}M110 118L116 ${S6_Y}`} stroke="#78350f" strokeWidth={3} strokeLinecap="round" />
        <rect x={14} y={30} width={112} height={88} rx={3} fill="white" stroke="#a8a29e" />
        <text x={70} y={43} textAnchor="middle" fontSize={7.5} fontWeight={600} fill="#5a6b7d">
          উচ্চতা cm, ওজন kg
        </text>
        {k >= 2 &&
          S6_ROWS.map((r, i) => (
            <g key={r.n}>
              <text x={30} y={63 + i * 22} textAnchor="middle" fontSize={10} fontWeight={800} fill={SC_INK} className={FADE}>
                {r.n}
              </text>
              <CastCard x={80} y={59 + i * 22} text={r.v} tone={r.tone} />
            </g>
          ))}
        <Person who="apa" x={k >= 1 ? S6_APA : 360} y={S6_Y} facing={-1} walking={k === 1} arm={k >= 2 ? "point" : "down"} mood={k >= 5 ? "puzzled" : "plain"} label />
        {(k === 3 || k === 4) && <Bubble x={S6_APA} y={S6_Y - 66} side="right" lines={["A-এর সবচেয়ে কাছাকাছি", "গড়নের কে?"]} />}
        <Person who="karim" x={k >= 4 ? S6_VOL : 372} y={S6_Y} facing={-1} walking={k === 4} arm={k >= 5 ? "wave" : "down"} mood={k >= 5 ? "happy" : "plain"} />
        {k >= 5 && (
          <text x={S6_VOL} y={S6_Y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={SC_INK} className={FADE}>
            volunteer
          </text>
        )}
        {k >= 5 && <Bubble x={S6_VOL} y={S6_Y - 66} side="left" lines={["kg-তে দশমিক আসে,", "gram-এ লিখি!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · The health board: A, B, C as (height cm, weight kg), and A's nearest.
//     Stretch the whole card by 1000 and nothing changes; stretch only the
//     weight slot (grams) and A's twin flips from C to B.

const PEOPLE: { n: string; v: XY }[] = [
  { n: "A", v: [172, 68] },
  { n: "B", v: [190, 69] },
  { n: "C", v: [173, 78] },
];
const MODES: { btn: string; f: XY }[] = [
  { btn: "আসল মাপ (kg)", f: [1, 1] },
  { btn: "পুরো card × 1000", f: [1000, 1000] },
  { btn: "শুধু ওজন × 1000 (gram)", f: [1, 1000] },
];
const GRAM_GUESS = ["পুরো card × 1000", "শুধু ওজন × 1000", "দুইটাতেই বদলাবে", "কোনোটাতেই বদলাবে না"];
const big = (n: number) => (n < 100 ? n.toFixed(1) : Math.round(n).toLocaleString("en-US"));

export function GramsClue() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [mode, setMode] = useSeed("mode", 0);
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const both = tried.length === 2;
  const { f } = MODES[mode];
  const [a, b, c] = PEOPLE.map((p) => p.v);
  const gap = (p: XY) => Math.hypot((p[0] - a[0]) * f[0], (p[1] - a[1]) * f[1]);
  const dB = gap(b);
  const dC = gap(c);
  const top = Math.max(dB, dC);
  const twin = dB < dC ? "B" : "C";

  const show = (m: number) => {
    setMode(m);
    if (m === 0 || tried.includes(m)) return;
    const next = [...tried, m];
    setTried(next);
    if (next.length === 2) pass("পুরো card টানলে সব দূরত্ব একসাথে 1000 গুণ, যমজ সেই একই। শুধু এক ঘর টানলে map বেঁকে যায়, আর যমজই বদলে যায়।");
  };

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {PEOPLE.map((p) => (
          <div key={p.n} className={`rounded-xl border-2 px-1.5 py-2 text-center ${p.n === "A" ? "border-cat-violet/50" : "border-border"}`}>
            <b className="text-lg">{p.n}</b>
            <div className="text-xs text-muted">উচ্চতা</div>
            <div key={`h${mode}`} className={`${FADE} font-mono text-sm`}>
              {big(p.v[0] * f[0])}
            </div>
            <div className="text-xs text-muted">ওজন</div>
            <div key={`w${mode}`} className={`${FADE} font-mono text-sm`}>
              {big(p.v[1] * f[1])}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-4 grid max-w-sm gap-2">
        {[
          ["B", dB],
          ["C", dC],
        ].map(([n, d]) => (
          <div key={n} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-sm">
            <span className="text-muted">A থেকে {n}</span>
            <span className="h-3 overflow-hidden rounded-full bg-foreground/5">
              <span
                className={`block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${n === twin ? "bg-cat-teal" : "bg-foreground/25"}`}
                style={{ width: `${((d as number) / top) * 100}%` }}
              />
            </span>
            <span className="font-mono">{big(d as number)}</span>
          </div>
        ))}
      </div>
      <div key={mode} className={`${FADE} mt-2 text-center text-[0.95rem]`}>
        {mode === 0 ? (
          <>kg-তে A-এর সবচেয়ে কাছে <b>C</b>। ও-ই A-এর যমজ।</>
        ) : mode === 1 ? (
          <>সব দূরত্ব 1000 গুণ বড় হলো, কিন্তু যমজ সেই <b>C</b>-ই।</>
        ) : (
          <>যমজ বদলে গেল! এখন A-এর সবচেয়ে কাছে <b>B</b>, অথচ মানুষ তিনজন একই।</>
        )}
      </div>
      <div className="mt-4 text-sm font-medium text-muted">কোন বোতাম চাপলে A-এর যমজ বদলে যাবে বলে মনে হয়?</div>
      <div className="mt-2 grid gap-2">
        {GRAM_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, both, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={`${FADE} mt-3 flex flex-wrap justify-center gap-2`}>
          {MODES.map((m, i) => (
            <button
              key={m.btn}
              type="button"
              aria-pressed={mode === i}
              onClick={() => show(i)}
              className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors motion-reduce:transition-none ${
                mode === i ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"
              }`}
            >
              {m.btn}
            </button>
          ))}
        </div>
      )}
      <Task done={both}>আগে guess দিন, তারপর × 1000-এর দুইটা বোতামই চেপে দেখুন A-এর যমজ কে হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6¼ · A figure for screen 6's explanation, no task: "হুবহু সেই কাজ".
//      নাসিবের শরবত card: × 2 lands on the চিনি slot alone, the লেবু slot
//      stays. A-এর card: × 1000 lands on the ওজন slot alone, the উচ্চতা slot
//      stays. One slot stretched by itself, twice over.

const SC_SLOT_ROWS: { who: string; slots: [string, number][]; by: number }[] = [
  { who: "নাসিবের শরবত", slots: [["লেবু", 2], ["চিনি", 4]], by: 2 },
  { who: "A-এর card", slots: [["উচ্চতা", 172], ["ওজন", 68]], by: 1000 },
];

export function OneSlotOnly() {
  const s = useScene(4, [700, 1200, 1700, 1200]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "দুইটা card। একটা শরবতের, একটা ডাক্তার আপার board-এর।"
        ) : k <= 2 ? (
          "নাসিব গুণ করেছিল শুধু চিনির ঘর, লেবু যেমন ছিল তেমনই।"
        ) : (
          <span className={FADE}>Gram-এ লিখতে গুণ হলো শুধু ওজনের ঘর, উচ্চতা যেমন ছিল। হুবহু একই কাজ।</span>
        )
      }
    >
      <div className="mx-auto grid w-fit gap-1" role="img" aria-label="নাসিব's card: sugar slot alone times 2, 4 to 8; A's card: weight slot alone times 1000, 68 to 68,000">
        {SC_SLOT_ROWS.map((r, i) => {
          const chip = k >= 2 * i + 1;
          const done = k >= 2 * i + 2;
          return (
            <div key={r.who} className="grid grid-cols-[4.75rem_4.5rem_4.5rem] items-end gap-1.5">
              <span className="pb-2 text-xs font-semibold text-muted">{r.who}</span>
              {r.slots.map(([name, n], j) => (
                <div key={name} className="flex flex-col items-center">
                  <span className="flex h-6 items-center">
                    {j === 1 && chip && <span className={`${POP} inline-block rounded-full bg-cat-violet px-2 font-mono text-xs leading-5 font-bold text-white`}>× {r.by}</span>}
                  </span>
                  <span
                    className={`w-full rounded-lg border-2 px-1 py-0.5 text-center transition-colors duration-500 motion-reduce:transition-none ${
                      j === 1 && done ? "border-cat-coral/60 bg-cat-coral/5" : "border-border"
                    }`}
                  >
                    <span className="block text-[0.7rem] leading-tight text-muted">{name}</span>
                    <b key={j === 1 && done ? "x" : "o"} className={`${POP} inline-block font-mono text-sm ${j === 1 && done ? "text-cat-coral" : ""}`}>
                      {(j === 1 && done ? n * r.by : n).toLocaleString("en-US")}
                    </b>
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the health board as a
//      map of how far B and C are from A (height across, weight up). Whole
//      card × 1000: the very same picture, only bigger numbers, C still
//      nearest. Weight alone × 1000: to fit the page the drawing shrinks a
//      thousand times, the height gaps all but vanish, and B ends up hugging A.

const SC_FM = makeFrame(-3.6, 20, -1.5, 11.5, 10, 12);
const SC_GAPS = PEOPLE.slice(1).map((p) => ({ n: p.n, d: [p.v[0] - PEOPLE[0].v[0], p.v[1] - PEOPLE[0].v[1]] as XY }));
const SC_SCALE: XY[] = [[1, 1], [1000, 1000], [1, 1000], [1, 1000]];

export function MapSquash() {
  const s = useScene(3, [900, 1900, 1700]);
  const k = s.k;
  const [q] = useTween([k >= 2 ? 0.001 : 1], 1500);
  const f = SC_SCALE[k];
  const rows = SC_GAPS.map(({ n, d }) => ({ n, d, at: [d[0] * q, d[1]] as XY, far: Math.hypot(d[0] * f[0], d[1] * f[1]) }));
  const near = k === 2 ? null : rows[0].far < rows[1].far ? rows[0].n : rows[1].n;

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "kg-তে আঁকা map। A থেকে সবচেয়ে কাছে C।"
        ) : k === 1 ? (
          "পুরো card × 1000: ছবিটা হুবহু একই, শুধু সংখ্যাগুলো বড়। C-ই কাছে।"
        ) : k === 2 ? (
          "এবার শুধু ওজন × 1000। কাগজে আঁটাতে ছবিটা 1000 গুণ ছোট করে আঁকলে উচ্চতার ফারাক প্রায় মুছেই যায়।"
        ) : (
          <span className={FADE}>এখন A-এর সবচেয়ে কাছে B। মানুষগুলো একই, অথচ যমজ বদলে গেল।</span>
        )
      }
    >
      <Plane f={SC_FM} grid={0} label={`B and C placed by their height and weight difference from A; ${k >= 2 ? "weight alone in grams: B is nearest" : "C is nearest"}`} className="my-0! max-w-[15rem]">
        <Label f={SC_FM} at={[20, 0]} dx={-3} dy={12} anchor="end" size={10} className="fill-[#5a6b7d]">
          উচ্চতা →
        </Label>
        <Label f={SC_FM} at={[0, 11.5]} dx={-4} dy={11} anchor="end" size={10} className="fill-[#5a6b7d]">
          ↑ ওজন
        </Label>
        {k >= 2 && (
          <g className={FADE}>
            <circle cx={SC_FM.sx(18)} cy={SC_FM.sy(1)} r={4} strokeWidth={1.2} strokeDasharray="2 2" className="pointer-events-none fill-none stroke-[#0f1b2d]/40" />
            <path d={`M${SC_FM.sx(18)} ${SC_FM.sy(1)}L${SC_FM.sx(rows[0].at[0])} ${SC_FM.sy(1)}`} strokeWidth={1.2} strokeDasharray="3 4" className="pointer-events-none fill-none stroke-[#0f1b2d]/30" />
          </g>
        )}
        {rows.map((r) => (
          <path
            key={r.n}
            d={`M${SC_FM.sx(0)} ${SC_FM.sy(0)}L${SC_FM.sx(r.at[0])} ${SC_FM.sy(r.at[1])}`}
            strokeWidth={near === r.n ? 2.6 : 1.4}
            className={`pointer-events-none fill-none transition-[stroke] duration-500 motion-reduce:transition-none ${near === r.n ? "stroke-cat-teal" : "stroke-[#0f1b2d]/35"}`}
          />
        ))}
        {rows.map((r) => (
          <g key={r.n}>
            <Dot f={SC_FM} at={r.at} r={4} />
            <Label f={SC_FM} at={r.at} dx={7} dy={4} anchor="start" size={10} weight={800}>
              {r.n}
            </Label>
          </g>
        ))}
        <Dot f={SC_FM} at={O} r={4.5} className="fill-cat-violet" />
        <Label f={SC_FM} at={O} dx={-7} dy={4} anchor="end" size={10} weight={800} className="fill-cat-violet">
          A
        </Label>
      </Plane>
      <div className="mx-auto mt-2 grid max-w-[15rem] grid-cols-2 gap-2 text-center text-sm">
        {rows.map((r) => (
          <div
            key={r.n}
            className={`rounded-lg px-2 py-0.5 leading-snug transition-colors duration-500 motion-reduce:transition-none ${near === r.n ? "bg-cat-teal/10 font-semibold text-cat-teal" : "text-muted"}`}
          >
            <div className="text-xs">A থেকে {r.n}</div>
            <div key={big(r.far)} className={`${FADE} font-mono`}>
              {big(r.far)}
            </div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for screen 6's explanation, no task: the question it leaves
//      open. ডাক্তার আপার board: in kg A's twin is C, in grams it is B. She
//      can't say which is right yet, and asks the reader back at the end of
//      the fair. Nothing here answers kg or gram.

const SC_KG_ROWS = S6_ROWS.map((r, i) => ({ ...r, y: 52 + i * 19 }));
const SC_APA = 200;

export function KgOrGram() {
  const s = useScene(4, [600, 1400, 1500, 2300]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="ডাক্তার আপার board: in kg A's twin is C, in grams it is B; she wonders which is right and asks us back at the end of the fair">
        <Stall x={290} y={S6_Y} w={52} sign="Health" color="#0d9488" />
        <path d={`M30 130L24 ${S6_Y}M134 130L140 ${S6_Y}`} stroke="#78350f" strokeWidth={3} strokeLinecap="round" />
        <rect x={14} y={26} width={136} height={104} rx={3} fill="white" stroke="#a8a29e" />
        <text x={82} y={38} textAnchor="middle" fontSize={7.5} fontWeight={600} fill="#5a6b7d">
          উচ্চতা cm, ওজন kg
        </text>
        {SC_KG_ROWS.map((r) => (
          <g key={r.n}>
            <text x={40} y={r.y + 3.5} textAnchor="middle" fontSize={10} fontWeight={800} fill={SC_INK}>
              {r.n}
            </text>
            <CastCard x={88} y={r.y} text={r.v} tone={r.tone} />
          </g>
        ))}
        <path d="M20 101H144" stroke="#e2e8f0" strokeWidth={1} />
        {k >= 1 && (
          <text x={30} y={112} fontSize={8.5} fontWeight={700} fill="#0f766e" className={FADE}>
            kg-তে যমজ C
          </text>
        )}
        {k >= 2 && (
          <text x={30} y={124} fontSize={8.5} fontWeight={700} fill="#be123c" className={FADE}>
            gram-এ যমজ B
          </text>
        )}
        {k >= 3 && (
          <text x={122} y={123} textAnchor="middle" fontSize={17} fontWeight={800} fill="#be123c" className={POP}>
            ?
          </text>
        )}
        <Person who="apa" x={SC_APA} y={S6_Y} facing={-1} arm={k >= 4 ? "wave" : "point"} mood={k === 3 ? "puzzled" : k >= 4 ? "happy" : "plain"} label />
        {k === 3 && <Bubble x={SC_APA} y={S6_Y - 66} tone="think" lines={["kg না gram,", "ঠিক কোনটা?"]} />}
        {k >= 4 && <Bubble x={SC_APA} y={S6_Y - 66} lines={["উত্তর মেলার শেষে।", "আবার আসবেন!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · Say it out loud. Each card: a line of notation; tapped, its reading.

const SAY: { see: string; say: string }[] = [
  { see: "λ", say: "“lambda, একটা সাধারণ সংখ্যা”" },
  { see: "λv", say: "“v-কে lambda গুণ টেনে লম্বা বা খাটো করা”" },
  { see: "−v", say: "“v, কিন্তু উল্টো দিকে মুখ করে”" },
  { see: "u − v = u + (−1)v", say: "“v উল্টে দিয়ে u-এর সাথে যোগ”" },
];

export function SayIt() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);

  const flip = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === SAY.length) pass("λ হলো knob-এর সংখ্যা, আর λv মানে প্রতিটা ঘর সেই সংখ্যা দিয়ে গুণ। চিহ্নগুলো এখন আর অচেনা না।");
  };

  return (
    <>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {SAY.map((c, i) => {
          const on = open.includes(i);
          return (
            <button
              key={c.see}
              type="button"
              aria-expanded={on}
              onClick={() => flip(i)}
              className={`flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-3 py-2.5 text-center transition-colors motion-reduce:transition-none ${
                on ? "cursor-default border-cat-violet/40 bg-cat-violet/5" : "border-border hover:border-cat-violet/60"
              }`}
            >
              <span className="font-serif text-2xl italic">{c.see}</span>
              {on ? <span className={`${FADE} mt-1 text-[0.92rem] leading-snug`}>{c.say}</span> : <span className="mt-1 text-xs text-muted">আগে মুখে বলুন, তারপর tap</span>}
            </button>
          );
        })}
      </div>
      <Task done={open.length === SAY.length}>
        প্রতিটা কার্ড আগে মুখে বলুন, তারপর উল্টে মিলিয়ে নিন ({bn(open.length)}/{bn(SAY.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: "λ দেখলে knob-টা ধরুন".
//      A small knob marked λ turns to 2, 0.5 and −1, and the arrow (1, 2)
//      beside it stretches, shrinks and flips with it. Watch-only: the knob
//      is a picture here, not a control.

const SC_LK = [1, 2, 0.5, -1];
const SC_LK_SAY = ["যেমন ছিল", "টেনে লম্বা", "খাটো", "উল্টে গেল"];
const SC_FLK = makeFrame(-1.5, 2.5, -2.5, 4.5, 14, 8);
const scKnobDeg = (l: number) => -120 + ((l + 1) / 3) * 240;
const scPolar = (r: number, deg: number): [number, number] => [50 + r * Math.sin((deg * Math.PI) / 180), 50 - r * Math.cos((deg * Math.PI) / 180)];

export function LambdaKnob() {
  const s = useScene(3, [900, 1600, 1600]);
  const k = s.k;
  const now = SC_LK[k];
  const [l] = useTween([now], 900);

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "বইয়ে λ দেখলেই মনে মনে knob-টা ধরুন।"
        ) : k === 1 ? (
          "λ = 2: arrow টেনে লম্বা।"
        ) : k === 2 ? (
          "λ = 0.5: খাটো।"
        ) : (
          <span className={FADE}>λ = −1: উল্টে গেল। λ বলতে এতটুকুই, একটা সংখ্যা।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-3">
        <svg viewBox="0 0 100 100" role="img" aria-label={`a knob marked λ, set to ${now}`} className="block w-[6.25rem] shrink-0">
          {[-1, 0, 1, 2].map((t) => {
            const [x1, y1] = scPolar(30, scKnobDeg(t));
            const [x2, y2] = scPolar(34, scKnobDeg(t));
            const [lx, ly] = scPolar(44, scKnobDeg(t));
            return (
              <g key={t}>
                <path d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth={1.6} strokeLinecap="round" className={t === now ? "stroke-cat-violet" : "stroke-muted"} />
                <text x={lx} y={ly + 4} textAnchor="middle" fontSize={12} className={`font-mono ${t === now ? "fill-cat-violet font-bold" : "fill-muted"}`}>
                  {sg(t)}
                </text>
              </g>
            );
          })}
          <circle cx={50} cy={50} r={27} strokeWidth={1.5} className="fill-white stroke-[#c9d3de]" />
          <g style={{ transform: `rotate(${scKnobDeg(l)}deg)`, transformOrigin: "50px 50px" }}>
            <path d="M50 45V28" strokeWidth={4.5} strokeLinecap="round" className={l < 0 ? "stroke-cat-coral" : "stroke-cat-blue"} />
          </g>
          <text x={50} y={67} textAnchor="middle" fontSize={14} fontStyle="italic" className="fill-[#0f1b2d] font-serif">
            λ
          </text>
        </svg>
        <div className="w-[4.5rem] shrink-0">
          <Plane f={SC_FLK} label={`(1, 2) times ${now} is ${tup(times(now, V))}`} className="my-0! max-w-none">
            <Arrow f={SC_FLK} from={O} to={V} tone="ink" w={1.6} dashed faint />
            <Arrow f={SC_FLK} from={O} to={times(l, V)} tone={l < 0 ? "coral" : "blue"} w={2.6} />
          </Plane>
        </div>
        <div className="w-[5.25rem] leading-snug">
          <div className="font-serif text-xl italic">λv</div>
          <div key={now} className={`${FADE} font-mono text-sm`}>
            λ = <b className="text-cat-violet">{sg(now)}</b>
          </div>
          <div key={`s${now}`} className={`${FADE} text-sm font-semibold ${now < 0 ? "text-cat-coral" : "text-cat-blue"}`}>
            {SC_LK_SAY[k]}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8¼ · A figure for the check's explanation, no task: 0.5 · (4, 6). The × 0.5
//      chip visits each slot in turn, 4 → 2 and 6 → 3; then a second glass
//      fills to half the first, the same colour: half the sherbet, same taste.

const SC_HALF = [4, 6];
const SC_GLASS_X = [15, 51];
const scGlass = (cx: number, level: number) => {
  const yb = 50;
  const yt = yb - 38 * level;
  const w = (y: number) => 8 + ((yb - y) / 40) * 3;
  return `M${cx - 8} ${yb}L${cx - w(yt)} ${yt}H${cx + w(yt)}L${cx + 8} ${yb}Z`;
};

export function HalfEachSlot() {
  const s = useScene(3, [700, 1300, 1500]);
  const k = s.k;
  const at = Math.min(Math.max(k - 1, 0), 1);
  const [lv] = useTween([k >= 3 ? 0.45 : 0], 1200);

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "0.5 মানে অর্ধেক। প্রতিটা ঘরেরই অর্ধেক।"
        ) : k === 1 ? (
          "প্রথম ঘর: 0.5 × 4 = 2।"
        ) : k === 2 ? (
          "দ্বিতীয় ঘর: 0.5 × 6 = 3।"
        ) : (
          <span className={FADE}>শরবত অর্ধেক হলো, কিন্তু স্বাদ সেই একই।</span>
        )
      }
    >
      <div className="flex items-center justify-center gap-5">
        <div className="w-fit" role="img" aria-label="0.5 times (4, 6) is (2, 3), one slot at a time">
          <div className="relative ml-[3.25rem] h-7">
            {k >= 1 && k < 3 && (
              <span
                className={`${FADE} absolute top-0 -left-1 flex h-6 w-10 items-center justify-center rounded-full bg-cat-violet font-mono text-xs font-bold text-white transition-transform duration-300 motion-reduce:transition-none`}
                style={{ transform: `translateX(${at * 2.25}rem)` }}
              >
                × 0.5
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="w-12 pr-1 text-right font-mono text-sm whitespace-nowrap text-muted">card</span>
            {SC_HALF.map((n, i) => (
              <span key={n} className={`${SC_CELL} border-2 transition-colors duration-300 motion-reduce:transition-none ${k >= 1 && k < 3 && i === at ? "border-cat-violet" : "border-border"}`}>
                {n}
              </span>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="w-12 pr-1 text-right font-mono text-sm whitespace-nowrap text-muted">0.5 ×</span>
            {SC_HALF.map((n, i) => (
              <span key={n} className={`${SC_CELL} bg-cat-violet/10`}>
                {k > i && <b className={`${POP} inline-block text-cat-violet`}>{n / 2}</b>}
              </span>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 66 64" role="img" aria-label="a full glass for (4, 6) and a half glass for (2, 3), the same colour" className="block w-[5.25rem] shrink-0">
          <path d={scGlass(SC_GLASS_X[0], 0.9)} fill="#fde68a" />
          {lv > 0.01 && <path d={scGlass(SC_GLASS_X[1], lv)} fill="#fde68a" />}
          {SC_GLASS_X.map((cx) => (
            <path key={cx} d={scGlass(cx, 1)} fill="none" stroke="#94a3b8" strokeWidth={1.2} strokeLinejoin="round" />
          ))}
          <text x={SC_GLASS_X[0]} y={61} textAnchor="middle" fontSize={8} className="fill-muted font-mono">
            (4, 6)
          </text>
          {k >= 3 && (
            <text x={SC_GLASS_X[1]} y={61} textAnchor="middle" fontSize={8} className={`${FADE} fill-muted font-mono`}>
              (2, 3)
            </text>
          )}
        </svg>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for the last step's explanation, no task: the two moves in
//      hand. যোগ, one arrow laid on another's tip; stretch, an arrow grown by
//      a number. Then বিয়োগ turns up as if it were a third move, and slides
//      into the যোগ card: it was a kind of যোগ all along.

const SC_FT = makeFrame(0, 3.2, 0, 3.2, 12, 5);
const SC_MOVE = "flex w-[5.5rem] flex-col items-center rounded-xl border-2 bg-surface px-1.5 pt-1.5 pb-1";

export function TwoMoves() {
  const s = useScene(4, [600, 1600, 1700, 1900]);
  const k = s.k;
  const [g] = useTween([k >= 2 ? 2 : 1], 1200);

  return (
    <Scene
      scene={s}
      caption={
        k <= 1 ? (
          "প্রথম চাল: যোগ। এক arrow-এর মাথায় আরেকটা।"
        ) : k === 2 ? (
          "দ্বিতীয় চাল: একটা সংখ্যা দিয়ে stretch।"
        ) : k === 3 ? (
          "আর বিয়োগ? ওটা কি তিন নম্বর চাল?"
        ) : (
          <span className={FADE}>না। বিয়োগ মানে উল্টে দিয়ে যোগ, তাই ওটা যোগের ভেতরেই ঢুকে গেল।</span>
        )
      }
    >
      <div className="mx-auto grid w-fit grid-cols-3 gap-2">
        <div className={`${SC_MOVE} border-cat-teal/50 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-0"}`}>
          <div className="w-[3.4rem]">
            <Plane f={SC_FT} axes={false} label="two arrows laid tip to tail" className="my-0! max-w-none">
              {k >= 1 && (
                <>
                  <Arrow f={SC_FT} from={O} to={[2, 1]} tone="blue" w={2} draw />
                  <Arrow f={SC_FT} from={[2, 1]} to={[3, 3]} tone="teal" w={2} draw delay={600} />
                </>
              )}
            </Plane>
          </div>
          <span className="text-sm font-semibold">যোগ</span>
          <span className="min-h-4 text-[0.7rem] leading-4 font-semibold text-cat-coral">{k >= 4 && <span className={`${POP} inline-block`}>বিয়োগও এখানে</span>}</span>
        </div>
        <div className={`${SC_MOVE} border-cat-violet/50 transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "opacity-100" : "opacity-0"}`}>
          <div className="w-[3.4rem]">
            <Plane f={SC_FT} axes={false} label="an arrow stretched to twice its length" className="my-0! max-w-none">
              <Arrow f={SC_FT} from={O} to={[1.5, 1]} tone="ink" w={1.4} dashed faint />
              <Arrow f={SC_FT} from={O} to={[1.5 * g, g]} tone="violet" w={2} />
            </Plane>
          </div>
          <span className="text-sm font-semibold">stretch</span>
          <span className="min-h-4 font-mono text-[0.7rem] leading-4 text-muted">× 2</span>
        </div>
        <div
          style={{ transform: k >= 4 ? "translateX(calc(-200% - 1rem)) scale(0.5)" : undefined }}
          className={`${SC_MOVE} justify-center border-dashed border-cat-coral/60 transition-[transform,opacity] duration-1000 ease-in-out motion-reduce:transition-none ${k === 3 ? "opacity-100" : "opacity-0"}`}
        >
          <span className="font-serif text-xl italic">u − v</span>
          <span className="text-sm font-semibold">বিয়োগ?</span>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8¾ · A figure for the last step's explanation, no task: the next journey's
//      question. The class poster asks how our students are built, on
//      average; আম্মু sets out tiffin boxes at the snack table; the two moves,
//      যোগ and stretch, turn up between them, joined by a "?". How they join
//      is the next journey's, so nothing here says.

const S8_Y = 150;
const S8_AMMU = 214;

/** a tag with a word on it, centred at (x, y); Bangla, so not in mono */
function ScTag({ x, y, text, w }: { x: number; y: number; text: string; w: number }) {
  return (
    <g className={POP}>
      <rect x={x - w / 2} y={y - 9} width={w} height={18} rx={9} fill="white" stroke="#7c3aed" strokeWidth={1.4} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#6d28d9">
        {text}
      </text>
    </g>
  );
}

export function NextPuzzle() {
  const s = useScene(4, [600, 1500, 1500, 1600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="the class poster asks how our students are built on average; আম্মু sets out tiffin boxes at the snack table; the two moves, যোগ and stretch, appear between them with a question mark">
        <path d={`M30 116L26 ${S8_Y}M104 116L108 ${S8_Y}`} stroke="#78350f" strokeWidth={3} strokeLinecap="round" />
        <rect x={14} y={34} width={106} height={82} rx={3} fill="white" stroke="#a8a29e" />
        <text x={67} y={47} textAnchor="middle" fontSize={7.5} fontWeight={600} fill="#5a6b7d">
          class poster
        </text>
        <text x={67} y={62} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={SC_INK}>
          average-এ আমরা
        </text>
        <text x={67} y={74} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={SC_INK}>
          কেমন গড়নের?
        </text>
        {[38, 52, 66, 80, 94].map((x, i) => (
          <g key={x} fill={["#2563eb", "#0d9488", "#d97706", "#dc2626", "#db2777"][i]}>
            <circle cx={x} cy={88} r={3.2} fill="#d4a373" />
            <rect x={x - 3.5} y={92} width={7} height={9 + (i % 3) * 2} rx={2} />
          </g>
        ))}
        {k >= 1 && (
          <text x={108} y={112} textAnchor="middle" fontSize={15} fontWeight={800} fill="#be123c" className={POP}>
            ?
          </text>
        )}
        <Stall x={272} y={S8_Y} w={72} sign="Snack" color="#7c3aed" />
        {k >= 2 &&
          [252, 270, 288].map((x, i) => (
            <g key={x} style={{ transitionDelay: `${900 + i * 180}ms` }} className={POP}>
              <rect x={x - 7} y={115} width={14} height={11} rx={2} fill="#cbd5e1" stroke="#64748b" strokeWidth={0.8} />
              <path d={`M${x - 7} 119H${x + 7}`} stroke="#64748b" strokeWidth={0.8} />
            </g>
          ))}
        <Person who="ammu" x={k >= 2 ? S8_AMMU : 372} y={S8_Y} facing={-1} walking={k === 2} arm={k >= 3 ? "wave" : "down"} mood={k >= 3 ? "happy" : "plain"} label={k >= 2} />
        {k >= 3 && (
          <>
            <ScTag x={146} y={52} text="যোগ" w={34} />
            <text x={172} y={56} textAnchor="middle" fontSize={12} fontWeight={800} fill={SC_INK} className={FADE}>
              +
            </text>
            <ScTag x={198} y={52} text="stretch" w={44} />
          </>
        )}
        {k >= 4 && (
          <g className={POP}>
            <circle cx={172} cy={82} r={11} fill="white" stroke="#be123c" strokeWidth={1.6} />
            <text x={172} y={87.5} textAnchor="middle" fontSize={14} fontWeight={800} fill="#be123c">
              ?
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  MoreGlasses: { start: {}, wrong: { guess: 0, mixed: true } },
  TasteLine: { start: {}, all: { size: 3, seen: [2, 0, 1, 3] }, nasib: { size: 2, seen: [0, 1, 2, 3], nasib: true } },
  StretchKnob: { start: {}, playing: { guess: 0, k: -0.5, seen: [1, 3, 0.5, -0.5] }, all: { guess: 0, k: -2, seen: [1, 3, 0.5, 0, -0.5, -2] } },
  FiveCases: { start: {}, miss: { sorted: 3, miss: { n: 1, pick: 0 } }, three: { sorted: 3 }, all: { sorted: 5 } },
  FlipThenAdd: { start: {}, added: { guess: 1, stage: 2 }, over: { guess: 1, stage: 3 } },
  GramsClue: { start: {}, weight: { guess: 3, mode: 2, tried: [2] }, both: { guess: 3, mode: 2, tried: [1, 2] } },
  SayIt: { start: {}, all: { open: [0, 1, 2, 3] } },
  // the story scenes play by themselves too; `k` picks a beat
  SherbetQueue: { card: { k: 1 }, queueing: { k: 2 }, played: {} },
  RecipeOnPaper: { card: { k: 0 }, axes: { k: 2 }, played: {} },
  SaminTurns: { remember: { k: 3 }, played: {} },
  HealthBoard: { asks: { k: 3 }, arriving: { k: 4 }, played: {} },
  // the figures in <Then> play by themselves; `k` picks a beat (none = fully played)
  DoubleBatch: { played: {}, second: { k: 2 } },
  ArrowTurns: { played: {}, stretched: { k: 3 } },
  ShikuBackward: { played: {}, walking: { k: 5 } },
  LambdaEverySlot: { played: {}, mid: { k: 3 } },
  MapSquash: { kg: { k: 0 }, whole: { k: 1 }, grams: { k: 2 }, played: {} },
  OneInLine: { mid: { k: 2 }, done: {} },
  LemonStairs: { mid: { k: 3 }, done: {} },
  PerLemon: { mid: { k: 2 }, done: {} },
  TipOnRail: { mid: { k: 4 }, done: {} },
  ZeroShrink: { mid: { k: 1 }, done: {} },
  TwoQuestions: { mid: { k: 1 }, done: {} },
  ScaleToScalar: { mid: { k: 2 }, done: {} },
  SubtractAsAdd: { mid: { k: 2 }, done: {} },
  SixMinusTwo: { mid: { k: 2 }, done: {} },
  OneSlotOnly: { mid: { k: 2 }, done: {} },
  KgOrGram: { mid: { k: 3 }, done: {} },
  LambdaKnob: { mid: { k: 1 }, done: {} },
  HalfEachSlot: { mid: { k: 1 }, done: {} },
  TwoMoves: { mid: { k: 3 }, done: {} },
  NextPuzzle: { mid: { k: 2 }, done: {} },
};
