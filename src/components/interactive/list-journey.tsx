"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

import { Bubble, Person, Stage, Stall, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  Draw,
  FADE,
  Laptop,
  Nope,
  Out,
  POP,
  Scene,
  Speech,
  Ticks,
  predictLook,
  primaryBtn,
  quietBtn,
  useCountUp,
  usePlay,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
} from "@/components/journey/kit";
import { bn } from "./figure-kit";
import { sfx } from "@/components/journey/sfx";

// Screens for "Math for AI 2.1 — List, সামিনের গড়বড় file" and its second half
// 2.1b (02a2_vector_notation), told as Journeys. 2.1 runs from the wrestling
// file to the silent bug; 2.1b opens at the definition's three words.
//
// Wrestling practice, and partners have to be matched by size. Samin puts the
// class in a file and on a sheet of graph paper, where the closest dot is the
// partner. One night he rewrites every row as (weight, height): the sheet
// mirrors across its diagonal and not one partner changes. Then Tanvir's slip
// goes in the wrong way round, the program answers without a murmur, and the
// answer is wrong: one row broken is a silent bug where a whole file flipped
// was harmless. An age column arrives, Fahim's age is missing, and whatever
// goes in that box changes who he wrestles. Only then the three words of the
// definition (ordered, n fixed, fixed meaning), and the notation: v in bold or
// with an arrow, row and column, v₁ against v[0], and x ∈ ℝ³⁰⁰ read out loud.
//
// The partner is the nearest neighbour in plain (unscaled) numbers, so both
// axes of the sheet use the same length per unit and a swap of the two slots
// is an exact mirror image. The class and its ages are chosen so every beat
// holds: the mirrored sheet keeps all five pairs, the swapped Tanvir lands
// nearest Rahat, and Fahim's partner is Arif at age 0 and Samin at the class
// average. Tailwind only, on the site's theme tokens; SVG/DOM rather than
// canvas, so the Bangla labels shape.

type Kid = { name: string; of: string; h: number; w: number; age: number; tone: string };

const SLATE = "fill-[#475569]";
const NASIB: Kid = { name: "হামজা", of: "হামজাের", h: 180, w: 78, age: 18, tone: "fill-cat-blue" };
const SAMIN: Kid = { name: "সামিন", of: "সামিনের", h: 170, w: 60, age: 17, tone: "fill-cat-coral" };
const SHOM: Kid = { name: "সোম", of: "সোমের", h: 175, w: 75, age: 19, tone: "fill-cat-teal" };
const ARIF: Kid = { name: "আরিফ", of: "আরিফের", h: 158, w: 49, age: 15, tone: SLATE };
const RAHAT: Kid = { name: "রাহাত", of: "রাহাতের", h: 162, w: 72, age: 16, tone: SLATE };
// Fahim's age is the unknown on screen 4; 16 is what he says the next day.
const FAHIM: Kid = { name: "ফাহিম", of: "ফাহিমের", h: 165, w: 54, age: 16, tone: SLATE };
const IMON: Kid = { name: "ইমন", of: "ইমনের", h: 186, w: 82, age: 18, tone: SLATE };
// Shom to the centimetre and the kilo, as in 1.4.
const TANVIR: Kid = { name: "তানভীর", of: "তানভীরের", h: 175, w: 75, age: 17, tone: "fill-cat-violet" };

const CLASS = [NASIB, SAMIN, SHOM, ARIF, RAHAT, FAHIM, IMON];
const WITH_TANVIR = [...CLASS, TANVIR];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hw = (k: Kid) => [k.h, k.w];
const d2 = (a: number[], b: number[]) => a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0);

/** Index of the vector closest to vs[i]; the first one wins a tie. */
function closest(i: number, vs: number[][]) {
  let best = -1;
  let bd = Infinity;
  vs.forEach((v, j) => {
    if (j === i) return;
    const d = d2(vs[i], v);
    if (d < bd) {
      bd = d;
      best = j;
    }
  });
  return best;
}

/** Everyone joined to whoever is closest to them, each pair once. */
function partnerLinks(vs: number[][]): [number, number][] {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  vs.forEach((_, i) => {
    const j = closest(i, vs);
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push([i, j]);
    }
  });
  return out;
}

function SaminSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="সামিন" initial="সা" tint="blue" {...props} />;
}

function SirSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="PT স্যার" initial="স্" tint="teal" {...props} />;
}

// ---------------------------------------------------------------------------
// The sheet. Both axes span 40 units at the same length per unit, so what
// looks close is close, and swapping the two slots is a true mirror image
// across the sheet's diagonal.

const U = 7;
const SPAN = 40;
const PL = 44;
const PT = 28;
const PW = PL + SPAN * U + 14;
const PH = PT + SPAN * U + 40;
const sx = (u: number) => PL + u * U;
const sy = (v: number) => PT + (SPAN - v) * U;

const SLOT = [
  { name: "height (cm)", min: 150 },
  { name: "weight (kg)", min: 45 },
];

/**
 * Where a student sits on the sheet: the first slot across, the second up.
 * `p` runs from 0, the file written (height, weight), to 1, (weight, height).
 */
const place = (k: Kid, p = 0): [number, number] => {
  const a = k.h - SLOT[0].min;
  const b = k.w - SLOT[1].min;
  return [lerp(a, b, p), lerp(b, a, p)];
};

/** Just past the sheet's top-left corner, where the swapped (75, 175) points. */
const OFF: [number, number] = [-2.5, 43.5];

let grid = "";
for (let i = 0; i <= SPAN; i += 5) grid += `M${sx(i)} ${sy(0)}V${sy(SPAN)}M${sx(0)} ${sy(i)}H${sx(SPAN)}`;
const GRID = grid;
const TICKS = [0, 10, 20, 30, 40];

/** Fixed ink: the sheet is white paper in both themes. */
const INK = "fill-[#0f1b2d]";
const INK_SOFT = "fill-[#5a6b7d]";

function AxisLabels({ first, opacity }: { first: 0 | 1; opacity: number }) {
  const across = SLOT[first];
  const up = SLOT[1 - first];
  return (
    <g style={{ opacity }} className="pointer-events-none">
      {TICKS.map((t) => (
        <text key={`x${t}`} x={sx(t)} y={sy(0) + 13} textAnchor="middle" fontSize={8} className={`${INK_SOFT} font-mono`}>
          {across.min + t}
        </text>
      ))}
      {TICKS.map((t) => (
        <text key={`y${t}`} x={sx(0) - 5} y={sy(t) + 3} textAnchor="end" fontSize={8} className={`${INK_SOFT} font-mono`}>
          {up.min + t}
        </text>
      ))}
      <text x={sx(SPAN / 2)} y={PH - 8} textAnchor="middle" fontSize={10} fontWeight={600} className={INK}>
        {across.name} →
      </text>
      <text transform={`translate(12 ${sy(SPAN / 2)}) rotate(-90)`} textAnchor="middle" fontSize={10} fontWeight={600} className={INK}>
        {up.name} →
      </text>
    </g>
  );
}

type Pt = {
  kid: Kid;
  at: [number, number];
  /** a small pixel shift, so Tanvir can stand beside his twin */
  nudge?: [number, number];
  below?: boolean;
  ring?: boolean;
  pop?: boolean;
  onPick?: () => void;
};
type Line = { key: string; a: [number, number]; b: [number, number]; bad?: boolean; draw?: boolean };

function Dot({ pt }: { pt: Pt }) {
  const x = sx(pt.at[0]) + (pt.nudge?.[0] ?? 0);
  const y = sy(pt.at[1]) + (pt.nudge?.[1] ?? 0);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pt.onPick?.();
    }
  };
  return (
    <g
      role={pt.onPick ? "button" : undefined}
      tabIndex={pt.onPick ? 0 : undefined}
      aria-label={pt.onPick ? pt.kid.name : undefined}
      onClick={pt.onPick}
      onKeyDown={pt.onPick ? onKey : undefined}
      className={pt.onPick ? "cursor-pointer outline-none" : undefined}
    >
      <g className={pt.pop ? POP : undefined}>
        {pt.onPick && <circle cx={x} cy={y} r={13} className="fill-transparent" />}
        {pt.ring && <circle cx={x} cy={y} r={8.5} strokeWidth={1.8} className="fill-none stroke-[#0f1b2d]" />}
        <circle cx={x} cy={y} r={4.6} className={pt.kid.tone} />
        <text x={x} y={pt.below ? y + 15 : y - 8} textAnchor="middle" fontSize={9} fontWeight={600} className={INK}>
          {pt.kid.name}
        </text>
      </g>
    </g>
  );
}

function Paper({
  pts,
  lines = [],
  flip = 0,
  mirror = false,
  label,
  children,
}: {
  pts: Pt[];
  lines?: Line[];
  /** 0 → the axes read (height, weight); 1 → (weight, height) */
  flip?: number;
  mirror?: boolean;
  label: string;
  children?: ReactNode;
}) {
  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} role="group" aria-label={label} className="mx-auto block h-auto w-full max-w-[21rem] overflow-visible select-none">
      <rect x={sx(0)} y={sy(SPAN)} width={SPAN * U} height={SPAN * U} rx={2} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
      <path d={GRID} strokeWidth={0.6} className="fill-none stroke-cat-blue/25" />
      <AxisLabels first={0} opacity={1 - flip} />
      <AxisLabels first={1} opacity={flip} />
      {mirror && (
        <g className={FADE}>
          <path d={`M${sx(0)} ${sy(0)}L${sx(SPAN)} ${sy(SPAN)}`} strokeDasharray="4 4" strokeWidth={1} className="fill-none stroke-[#94a3b8]" />
          <text x={sx(SPAN) - 4} y={sy(SPAN) + 14} textAnchor="end" fontSize={9} className={INK_SOFT}>
            আয়না
          </text>
        </g>
      )}
      {lines.map((l) => {
        const d = `M${sx(l.a[0])} ${sy(l.a[1])}L${sx(l.b[0])} ${sy(l.b[1])}`;
        if (l.bad) return <path key={l.key} d={d} strokeWidth={1.6} strokeDasharray="4 3" className="fill-none stroke-danger" />;
        if (l.draw) return <Draw key={l.key} d={d} strokeWidth={2} className="stroke-cat-teal" />;
        return <path key={l.key} d={d} strokeWidth={2} strokeLinecap="round" className="fill-none stroke-cat-teal/70" />;
      })}
      {pts.map((pt) => (
        <Dot key={pt.kid.name} pt={pt} />
      ))}
      {children}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Samin's file, on his Laptop (journey/kit). A row writes its two numbers in
// fixed cells, and a swap slides each number into the other's cell, so the
// reader watches it happen.

const COLS = "grid w-full grid-cols-[4.75rem_3.25rem_3.25rem] items-center";

function Cells({ a, b, swapped, delay = 0 }: { a: ReactNode; b: ReactNode; swapped: boolean; delay?: number }) {
  const move = (dir: 1 | -1) => ({ transform: swapped ? `translateX(${dir * 100}%)` : "none", transitionDelay: `${delay}ms` });
  const cell = "text-right transition-transform duration-500 ease-in-out motion-reduce:transition-none";
  return (
    <>
      <span style={move(1)} className={cell}>
        {a}
      </span>
      <span style={move(-1)} className={cell}>
        {b}
      </span>
    </>
  );
}

function FileHead({ swapped = false }: { swapped?: boolean }) {
  return (
    <div className={`${COLS} mb-1 border-b border-white/10 px-2 pb-1 text-[0.7rem]`} style={{ color: "#94a3b8" }}>
      <span>নাম</span>
      <Cells a="height" b="weight" swapped={swapped} />
    </div>
  );
}

const ROW_LOOK = {
  plain: "",
  pick: "bg-[#1d4ed8]/45",
  mate: "bg-[#0f766e]/45",
  fresh: "bg-white/10",
  bad: "bg-[#991b1b]/55 text-[#fecaca]",
  ok: "bg-[#065f46]/55 text-[#a7f3d0]",
};

function FileRow({
  kid,
  swapped = false,
  delay,
  look = "plain",
  onPick,
}: {
  kid: Kid;
  swapped?: boolean;
  delay?: number;
  look?: keyof typeof ROW_LOOK;
  onPick?: () => void;
}) {
  const cls = `${COLS} rounded-md px-2 font-mono tabular-nums transition-colors duration-300 ${ROW_LOOK[look]}`;
  const inner = (
    <>
      <span className="truncate font-sans">{kid.name}</span>
      <Cells a={kid.h} b={kid.w} swapped={swapped} delay={delay} />
    </>
  );
  return onPick ? (
    <button type="button" onClick={onPick} className={`${cls} cursor-pointer text-left hover:bg-white/10`}>
      {inner}
    </button>
  ) : (
    <div className={`${cls} ${FADE}`}>{inner}</div>
  );
}

// ---------------------------------------------------------------------------
// 1 · The class on paper. Tap a dot, and a line runs to the closest one.

export function PartnerMap() {
  const pass = useGate();
  const shown = useCountUp(CLASS.length, 260);
  const [sel, setSel] = useState<number | null>(null);
  const [seen, setSeen] = useState<number[]>([]);
  const ready = shown === CLASS.length;
  const mate = sel === null ? null : closest(sel, CLASS.map(hw));

  const pick = (i: number) => {
    sfx.pencil(0.2);
    setSel(i);
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.length === 3) pass("কাগজে যে কাছে, মাপেও সে কাছে।");
  };

  return (
    <>
      <div className="my-5 flex flex-col items-center gap-5 md:flex-row md:items-start md:justify-center">
        <Laptop>
          <FileHead />
          {CLASS.slice(0, shown).map((k, i) => (
            <FileRow key={k.name} kid={k} look={i === sel ? "pick" : i === mate ? "mate" : "plain"} />
          ))}
        </Laptop>
        <Paper
          label="the class on graph paper, height across and weight up"
          pts={CLASS.slice(0, shown).map((k, i) => ({
            kid: k,
            at: place(k),
            pop: true,
            ring: i === sel || i === mate,
            onPick: ready ? () => pick(i) : undefined,
          }))}
          lines={sel !== null && mate !== null ? [{ key: `p${sel}`, a: place(CLASS[sel]), b: place(CLASS[mate]), draw: true }] : []}
        />
      </div>
      <div className="min-h-8 text-center text-[1.02rem]">
        {sel !== null && mate !== null ? (
          <span key={sel} className={FADE}>
            <b>{CLASS[sel].of}</b> মাপের সবচেয়ে কাছাকাছি <b>{CLASS[mate].name}</b>। কুস্তিতে ওরাই জোড়া।
          </span>
        ) : ready ? (
          <span className="text-muted">কাগজের যেকোনো dot-এ tap করুন</span>
        ) : null}
      </div>
      <Task done={seen.length >= 3}>
        অন্তত তিনজনের dot-এ tap করে দেখুন, কার partner কে ({bn(Math.min(seen.length, 3))}/৩)
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Predict, then watch: every row rewritten as (weight, height). The file
//     flips first, then the sheet redraws itself from the new file.

const LINKS = partnerLinks(CLASS.map(hw));
const FLIP_Q = ["সবার partner বদলে যাবে", "কারো partner বদলাবে না", "শুধু কয়েকজনের partner বদলাবে"];
const FLIP_RIGHT = 1;

export function FlipAll() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const show = usePlay(1300); // step 1: the sheet redraws; step 2: verdict
  const over = guess !== null && show.k === 2;
  const [p] = useTween([flipped && show.k >= 1 ? 1 : 0], 1300);

  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    sfx.typing(0.9);
    setFlipped(true);
    show.play(2, () =>
      pass(
        "আয়নায় উল্টালেও কে কার কাছাকাছি, একই।"),
    );
  };

  return (
    <>
      <div className="my-5 flex flex-col items-center gap-5 md:flex-row md:items-start md:justify-center">
        <Laptop>
          <FileHead swapped={flipped} />
          {CLASS.map((k, i) => (
            <FileRow key={k.name} kid={k} swapped={flipped} delay={i * 70} />
          ))}
        </Laptop>
        <Paper
          label={p > 0.5 ? "the class on graph paper, weight across and height up" : "the class on graph paper, height across and weight up"}
          flip={p}
          mirror={guess !== null}
          pts={CLASS.map((k) => ({ kid: k, at: place(k, p) }))}
          lines={LINKS.map(([a, b]) => ({ key: `${a}-${b}`, a: place(CLASS[a], p), b: place(CLASS[b], p) }))}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {LINKS.map(([a, b]) => (
          <span
            key={`${a}-${b}`}
            className={`rounded-full border px-2.5 py-0.5 text-sm transition-colors duration-300 ${
              over ? "border-accent/50 bg-accent/10 text-accent-text" : "border-border"
            }`}
          >
            {over && "✓ "}
            {CLASS[a].name} ↔ {CLASS[b].name}
          </span>
        ))}
      </div>
      {over && flipped && <SaminSays tone="good">দেখলি? কিছুই ভাঙেনি। কাগজটা শুধু আয়নার মতো উল্টে গেছে।</SaminSays>}
      {over && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={() => {
              sfx.typing(0.5);
              setFlipped((f) => !f);
            }}
            className={quietBtn}
          >
            {flipped ? "আবার আগের মতো লিখুন" : "আবার উল্টে দিন"}
          </button>
        </div>
      )}
      <div className="mt-5 text-sm font-medium text-muted">পুরো file উল্টানোর পর কুস্তির জোড়াগুলোর কী হবে?</div>
      <div className="mt-2 grid gap-2">
        {FLIP_Q.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, FLIP_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={over}>আগে guess করুন। তারপর দেখা যাক কাগজে কী হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · One row the wrong way round. The program runs clean and answers wrong;
//     the reader finds the row, sees where the program thinks Tanvir stands,
//     and puts him back beside Shom.

const TI = WITH_TANVIR.length - 1;

export function OneSlip() {
  const pass = useGate();
  const run = useCountUp(3, 800); // 1: the command, 2: "no error", 3: the answer
  const [found, setFound] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [miss, setMiss] = useState<{ i: number; n: number } | null>(null);
  const settle = usePlay(1300);
  const [q] = useTween([fixed ? 0 : 1], 1200); // 1 → off the sheet, 0 → home
  const ran = run === 3;
  const done = fixed && settle.k === 1;

  // What the program reads: Tanvir's two numbers in whatever order they were typed.
  const vs = WITH_TANVIR.map((k, i) => (i === TI && !fixed ? [k.w, k.h] : hw(k)));
  const mate = WITH_TANVIR[closest(TI, vs)];
  const home = place(TANVIR);
  const at: [number, number] = [lerp(home[0], OFF[0], q), lerp(home[1], OFF[1], q)];

  const tap = (i: number) => {
    if (i === TI) {
      setFound(true);
      setMiss(null);
    } else setMiss((m) => ({ i, n: (m?.n ?? 0) + 1 }));
  };

  const fix = () => {
    sfx.typing(0.4);
    setFixed(true);
    settle.play(1, () => pass("Order উল্টালে program চুপচাপ ভুল উত্তর দেয়।"));
  };

  return (
    <>
      <div className="my-5 flex flex-col items-center gap-5 md:flex-row md:items-start md:justify-center">
        <Laptop>
          <FileHead />
          {WITH_TANVIR.map((k, i) => (
            <FileRow
              key={k.name}
              kid={k}
              swapped={i === TI && !fixed}
              look={i === TI ? (fixed ? "ok" : found ? "bad" : "fresh") : miss?.i === i ? "pick" : "plain"}
              onPick={ran && !found ? () => tap(i) : undefined}
            />
          ))}
          <div className="mt-2 border-t border-white/10 pt-1.5">
            {run >= 1 && <Out>$ python kushti.py</Out>}
            {run >= 2 && <Out tone="ok">✓ কোনো error নাই</Out>}
            {run >= 3 && (
              <Out key={mate.name} tone={fixed ? "ok" : "plain"}>
                তানভীর ↔ {mate.name}
              </Out>
            )}
          </div>
        </Laptop>
        {found && (
          <div className={`${FADE} w-full`}>
            <div className="mb-1 text-center text-sm font-medium text-muted">program-এর চোখে তানভীর কোথায়</div>
            <Paper
              label={fixed ? "Tanvir back beside Shom" : "Tanvir's swapped row puts him far off the top-left of the sheet"}
              pts={[...CLASS.map((k) => ({ kid: k, at: place(k) })), { kid: TANVIR, at, nudge: [5, 2], below: true }]}
              lines={[{ key: fixed ? "ok" : "bad", a: at, b: place(mate), bad: !fixed }]}
            >
              {!fixed && (
                <g className={FADE}>
                  <text x={sx(OFF[0]) + 10} y={sy(OFF[1]) + 4} fontSize={9} fontWeight={600} className="fill-danger">
                    (75, 175) · কাগজের অনেক বাইরে ↖
                  </text>
                </g>
              )}
            </Paper>
          </div>
        )}
      </div>

      {ran && !found && <SirSays>বাহ, সামিন তো কাজের ছেলে! তাহলে বৃহস্পতিবার তানভীর নামবে রাহাতের সাথে।</SirSays>}
      {miss && !found && <Nope key={miss.n}>এই row-টা ঠিকই আছে। প্রথম ঘরে height, দ্বিতীয় ঘরে weight।</Nope>}
      {found && !fixed && (
        <div className={`${FADE} mt-4 flex justify-center`}>
          <button type="button" onClick={fix} className={primaryBtn}>
            row-টা ঠিক করুন: (175, 75)
          </button>
        </div>
      )}
      {done && <SirSays tone="good">সোম আর তানভীর! দুইজন তো হুবহু এক মাপের। এটাই তো হওয়ার কথা।</SirSays>}
      <Ticks
        items={[
          ["গড়বড় row খুঁজুন", found],
          ["ঠিক করুন", fixed],
        ]}
      />
      <Task done={done}>রাহাত কেন? File-এর কোন row-টা এর জন্য দায়ী, খুঁজে tap করুন। তারপর ঠিক করে দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · A third box, and Fahim's is empty. Leave it, put 0, put the class
//     average: the program either stops, or the bars re-sort around a guess.

const OTHERS = WITH_TANVIR.filter((k) => k !== FAHIM);
const AVG = Math.round(OTHERS.reduce((s, k) => s + k.age, 0) / OTHERS.length);
const MAX_D = 42;
const BAR = 2.1; // rem per bar row

type Fill = "empty" | "zero" | "avg";
const FILLS: { id: Fill; label: string }[] = [
  { id: "empty", label: "খালি রাখুন" },
  { id: "zero", label: "0 বসান" },
  { id: "avg", label: `বয়সের average ${AVG} বসান` },
];

/** A vector written out, each number in its own box, its meaning underneath. */
function Vec({ v, names, lead, box }: { v: ReactNode[]; names?: ReactNode[]; lead?: ReactNode; box?: (i: number) => string }) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-y-2 font-mono text-lg">
      {lead ? <span className="mr-1.5 border-2 border-transparent py-0.5 font-semibold">{lead}</span> : null}
      {v.map((x, i) => (
        <span key={i} className="flex flex-col items-center">
          <span className="flex items-center">
            {i === 0 && <span className="px-0.5 text-muted">(</span>}
            <b
              key={String(x)}
              className={`${POP} inline-block min-w-[2.6ch] rounded-lg border-2 px-2 py-0.5 text-center font-semibold tabular-nums transition-colors ${
                box?.(i) ?? "border-border"
              }`}
            >
              {x}
            </b>
            <span className="px-0.5 text-muted">{i === v.length - 1 ? ")" : ","}</span>
          </span>
          {names ? <span className="mt-1 px-1 text-center font-sans text-xs leading-tight text-muted">{names[i]}</span> : null}
        </span>
      ))}
    </div>
  );
}

export function MissingAge() {
  const pass = useGate();
  const [age, setAge] = useState<number | null>(null);
  const [last, setLast] = useState<Fill | "slide" | null>(null);
  const [tried, setTried] = useState<Fill[]>([]);

  const choose = (f: Fill) => {
    sfx.typing(f === "empty" ? 0.1 : 0.3);
    setAge(f === "empty" ? null : f === "zero" ? 0 : AVG);
    setLast(f);
    if (tried.includes(f)) return;
    const next = [...tried, f];
    setTried(next);
    if (next.length === FILLS.length) pass("কী বসালেন, তাতেই partner বদলায়।");
  };

  const ranked =
    age === null
      ? []
      : OTHERS.map((k) => ({ k, d: Math.sqrt(d2([FAHIM.h, FAHIM.w, age], [k.h, k.w, k.age])) })).sort((a, b) => a.d - b.d);
  const partner = ranked[0]?.k;

  return (
    <>
      <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-muted">ফাহিমের row</div>
      <div className="mt-2">
        <Vec
          lead="ফাহিম ="
          v={[FAHIM.h, FAHIM.w, age ?? "?"]}
          names={["height", "weight", "বয়স"]}
          box={(i) => (i < 2 ? "border-border" : age === null ? "border-dashed border-danger/60 text-danger" : "border-cat-amber bg-cat-amber/10")}
        />
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {FILLS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={last === f.id}
            onClick={() => choose(f.id)}
            className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              last === f.id ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"
            }`}
          >
            {tried.includes(f.id) && last !== f.id ? "✓ " : ""}
            {f.label}
          </button>
        ))}
      </div>
      <label className="mx-auto mt-3 flex max-w-sm items-center gap-3">
        <span className="shrink-0 text-sm text-muted">অন্য কোনো বয়স</span>
        <input
          type="range"
          min={0}
          max={25}
          value={age ?? AVG}
          aria-label="ফাহিমের বয়স"
          onChange={(e) => {
            setAge(Number(e.target.value));
            setLast("slide");
          }}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-amber)]"
        />
      </label>

      <div className="mt-5">
        {age === null ? (
          last === "empty" && (
            <div className="flex justify-center">
              <Laptop file="kushti.py">
                <Out>$ python kushti.py</Out>
                <Out tone="bad">✕ Error: ফাহিমের row-এ সংখ্যা ২টা,</Out>
                <Out tone="bad">&nbsp;&nbsp;বাকি সবার ৩টা। মেলাবো কীভাবে?</Out>
              </Laptop>
            </div>
          )
        ) : (
          <div className={FADE}>
            <div className="mx-auto mb-2 flex max-w-md items-baseline gap-2 text-xs text-muted">
              <span className="w-14 shrink-0 text-right">নাম</span>
              <span className="w-7 shrink-0">বয়স</span>
              <span className="flex-1">ফাহিমের সাথে তফাত (ছোট মানে কাছাকাছি)</span>
            </div>
            <div className="relative mx-auto max-w-md" style={{ height: `${OTHERS.length * BAR}rem` }}>
              {ranked.map(({ k, d }, r) => (
                <div
                  key={k.name}
                  className="absolute inset-x-0 flex h-[1.8rem] items-center gap-2 transition-[top] duration-500 ease-in-out motion-reduce:transition-none"
                  style={{ top: `${r * BAR}rem` }}
                >
                  <span className={`w-14 shrink-0 text-right text-sm ${r === 0 ? "font-bold" : "font-medium"}`}>{k.name}</span>
                  <span className="w-7 shrink-0 font-mono text-xs text-muted">{k.age}</span>
                  <span className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-foreground/5">
                    <span
                      className={`absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-500 motion-reduce:transition-none ${
                        r === 0 ? "bg-accent" : "bg-cat-blue/35"
                      }`}
                      style={{ width: `${Math.min(100, (d / MAX_D) * 100)}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-sm tabular-nums">{d.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-[1.05rem]">
              ফাহিমের partner:{" "}
              <b key={partner?.name} className={`${POP} inline-block`}>
                {partner?.name}
              </b>
            </div>
          </div>
        )}
      </div>

      {last === "empty" && <SaminSays tone="bad">যাক, এবার অন্তত program জানান দিল। কিন্তু ঘরে একটা কিছু তো বসাতেই হবে।</SaminSays>}
      {last === "zero" && (
        <SaminSays tone="bad">0 বছর?! Program তো ভাবছে ফাহিম সদ্য জন্মানো বাচ্চা। তাই ক্লাসের সবচেয়ে ছোট আরিফকে ধরিয়ে দিলো।</SaminSays>
      )}
      {last === "avg" && <SaminSays tone="good">Average বসালাম, {AVG}। বয়সটা অন্তত ক্লাসের আর দশজনের মতো হলো। আর partner এখন… আমি!</SaminSays>}
      <Task done={tried.length === FILLS.length}>
        ফাহিমের ঘরে তিনটাই বসিয়ে দেখুন: খালি, 0, আর average ({bn(tried.length)}/{bn(FILLS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Sort Samin's next edits: harmless, loud, or a silent bug.

type Bin = "safe" | "loud" | "quiet";
const BINS: { id: Bin; label: string; mark: string; tone: string }[] = [
  { id: "safe", label: "নিরাপদ", mark: "✓", tone: "border-accent/50 text-accent-text" },
  { id: "loud", label: "Error দেবে", mark: "!", tone: "border-cat-amber/60 text-cat-amber" },
  { id: "quiet", label: "চুপচাপ bug", mark: "✕", tone: "border-danger/50 text-danger" },
];

const EDITS: { say: string; short: string; bin: Bin; why: string; hint: string }[] = [
  {
    say: "পুরো file-এ, প্রত্যেক row-তে, height আর weight-এর জায়গা বদল",
    short: "পুরো file উল্টানো",
    bin: "safe",
    why: "সবখানে একই নিয়ম। কাগজ আয়নায় উল্টায়, কারো partner বদলায় না।",
    hint: "সামিন প্রথম রাতে ঠিক এটাই করেছিল। কুস্তির জোড়াগুলোর কী হয়েছিল?",
  },
  {
    say: "ফাহিমের বয়স জানা নাই, তাই ওর row-এ একটা ঘর কম রাখা",
    short: "একজনের ঘর কম",
    bin: "loud",
    why: "ঘর সমান না হলে তুলনাই চলে না, তাই program থেমে গিয়ে error দেয়।",
    hint: "ঘর খালি রেখে program চালানোর পর কী দেখেছিলেন?",
  },
  {
    say: "নতুন একজনের চিরকুটে আগে weight, পরে height লেখা, আর সামিন সেভাবেই copy করে দিলো",
    short: "একজনের row উল্টো",
    bin: "quiet",
    why: "তানভীরের গল্পটাই। Program দিব্যি চলে, শুধু উত্তরটা ভুল।",
    hint: "তানভীরের row উল্টো ছিল। Program কি কোনো error দিয়েছিল?",
  },
  {
    say: "Row-গুলো নাম ধরে অ-আ-ক-খ order-এ নতুন করে সাজানো",
    short: "row-এর ক্রম বদল",
    bin: "safe",
    why: "কে ওপরে কে নিচে, তাতে কিছু যায় আসে না। প্রত্যেক row-এর ভেতরের order ঠিক থাকলেই হলো।",
    hint: "কোনো row-এর ভেতরের সংখ্যা কি জায়গা বদলেছে? নাকি row-গুলো শুধু ওপর-নিচে সরেছে?",
  },
  {
    say: "অজানা বয়সের ঘরে কাউকে কিছু না জানিয়ে 0 বসিয়ে দেওয়া",
    short: "খালি ঘরে 0",
    bin: "quiet",
    why: "ঘর সবার সমান, তাই program খুশি। কিন্তু ফাহিম হয়ে গেল সদ্য জন্মানো বাচ্চা।",
    hint: "0 বসানোর পর program কি কোনো আপত্তি করেছিল? আর ফাহিমের partner?",
  },
  {
    say: "সবার row-এর শেষে একসাথে একটা নতুন ঘর জোড়া: জুতার size",
    short: "সবার নতুন ঘর",
    bin: "safe",
    why: "সবার ঘর একসাথে একটা করে বাড়লো। তাই n এখনো সবার সমান, আর নতুন ঘরের মানেও সবার কাছে এক।",
    hint: "ঘরটা সবার জন্য একসাথে যোগ হচ্ছে। তাহলে কারো সাথে কারো অমিল থাকলো কি?",
  },
];

export function SafeOrBug() {
  const pass = useGate();
  const [k, setK] = useState(0);
  const [miss, setMiss] = useState(0);
  const card = EDITS[k];
  const done = k === EDITS.length;

  const drop = (b: Bin) => {
    if (done) return;
    if (b !== card.bin) {
      setMiss((m) => m + 1);
      return;
    }
    setMiss(0);
    setK(k + 1);
    if (k + 1 === EDITS.length) pass("বিপজ্জনক ভুল জানান দেয় না।");
  };

  return (
    <>
      <div className="min-h-[7.5rem]">
        {k > 0 && (
          <div key={`why${k}`} className={`${FADE} mt-4 flex items-start gap-2 text-sm leading-snug text-accent-text`}>
            <span aria-hidden="true">✓</span>
            <span>{EDITS[k - 1].why}</span>
          </div>
        )}
        {done ? (
          <div className={`${FADE} mt-4 text-center text-lg font-semibold`}>ছয়টাই বাছাই শেষ!</div>
        ) : (
          <div key={`${k}-${miss}`} className={`${miss > 0 ? "nudge" : FADE} mx-auto mt-3 max-w-md -rotate-1 rounded-xl border-2 border-dashed border-cat-amber/60 bg-cat-amber/5 px-4 py-3 text-center`}>
            <div className="mb-1 text-xs font-medium text-muted">
              সামিনের কাজ {bn(k + 1)}/{bn(EDITS.length)}
            </div>
            <div className="text-[1.02rem] font-medium">{card.say}</div>
          </div>
        )}
      </div>
      {miss > 0 && !done && <Nope key={miss}>উঁহু। {card.hint}</Nope>}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {BINS.map((b) => (
          <button
            key={b.id}
            type="button"
            disabled={done}
            onClick={() => drop(b.id)}
            className={`flex min-h-32 cursor-pointer flex-col items-stretch rounded-xl border-2 px-1.5 py-2 text-left transition-colors hover:bg-foreground/5 disabled:cursor-default disabled:hover:bg-transparent ${b.tone}`}
          >
            <span className="text-center text-sm font-bold">
              {b.mark} {b.label}
            </span>
            <span className="mt-2 flex flex-col gap-1">
              {EDITS.slice(0, k)
                .filter((e) => e.bin === b.id)
                .map((e) => (
                  <span key={e.short} className={`${POP} rounded-md bg-foreground/5 px-1.5 py-0.5 text-center text-xs leading-snug text-foreground`}>
                    {e.short}
                  </span>
                ))}
            </span>
          </button>
        ))}
      </div>
      <Task done={done}>
        সামিনের প্রত্যেকটা কাজ ঠিক দলে ফেলুন ({bn(k)}/{bn(EDITS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The definition's three words, each opened onto the story behind it.

const WORDS: { word: ReactNode; story: string; body: ReactNode }[] = [
  {
    word: "ordered",
    story: "তানভীরের row",
    body: (
      <>
        <WordFig n={0} />
        একই দুইটা সংখ্যা, জায়গা বদলালেই অন্য মানুষ। Set-এর কাছে অবশ্য {"{75, 175}"} আর {"{175, 75}"} একই জিনিস, set order-এর ধার ধারে না। Vector ধারে।
      </>
    ),
  },
  {
    word: (
      <>
        <i>n</i> fixed
      </>
    ),
    story: "ফাহিমের খালি ঘর",
    body: (
      <>
        <WordFig n={1} />
        সবার ঘর সংখ্যা সমান হতে হবে। ঘর সংখ্যা কম হলে তুলনাই চলে না। আর খালি ঘরে কী বসাবেন, সেটা একটা decision, যেটা result বদলে দেয়।
      </>
    ),
  },
  {
    word: "fixed মানে",
    story: "সামিনের আয়না",
    body: (
      <>
        <WordFig n={2} />
        ঘরের মানে সংখ্যার গায়ে লেখা থাকে না, থাকে একটা rule-এ। Rule-টা কী, তাতে কিছু যায় আসে না। Rule-টা সবাই মানছে কিনা, সেটাই দেখার বিষয়।
      </>
    ),
  },
];

export function ThreeWords() {
  const pass = useGate();
  const [open, setOpen] = useState<number[]>([]);

  const flip = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === WORDS.length) pass("তিনটা শব্দ, সামিনের তিনটা কাণ্ড।");
  };

  return (
    <>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {WORDS.map((w, i) => {
          const on = open.includes(i);
          return (
            <button
              key={w.story}
              type="button"
              aria-expanded={on}
              onClick={() => flip(i)}
              className={`flex cursor-pointer flex-col rounded-xl border-2 px-3.5 py-3 text-left transition-colors ${
                on ? "cursor-default border-cat-blue/50 bg-cat-blue/5" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <span className="text-center font-mono text-lg font-bold">{w.word}</span>
              <span className="text-center text-xs text-muted">{on ? w.story : "tap করে খুলুন"}</span>
              {on && <span className={`${FADE} mt-1 block text-[0.92rem] leading-snug`}>{w.body}</span>}
            </button>
          );
        })}
      </div>
      <Task done={open.length === WORDS.length}>
        তিনটা শব্দই খুলে দেখুন ({bn(open.length)}/{bn(WORDS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · One vector, three ways of writing it. The two boxes glide between a row
//     and a column; the code form is the row on a dark prompt, in [ ].

type Form = "row" | "col" | "code";
const FORMS: { id: Form; label: string; note: string }[] = [
  { id: "row", label: "পাশাপাশি (row)", note: "লাইনের মাঝখানে লিখতে গেলে এটাই সুবিধা, জায়গা কম লাগে। তাই বইয়ে এভাবেই বেশি দেখবেন।" },
  {
    id: "col",
    label: "ওপর-নিচে (column)",
    note: "Machine learning-এ vector বললে সবাই ধরে নেয় column-এর কথা। কেউ পাশাপাশি লিখলেও মনে মনে সাধারণত column-টাই বোঝায়।",
  },
  { id: "code", label: "code-এ", note: "Python-এ square bracket। দেখতে প্রায় একই, কিন্তু এখানে একটা ফাঁদ পাতা আছে। সেটার দেখা পাবেন পরের ধাপে।" },
];

const BOX_W = 46;
const BOX_H = 32;
const SPOT: Record<Form, [number, number][]> = {
  row: [
    [84, 48],
    [150, 48],
  ],
  col: [
    [117, 20],
    [117, 76],
  ],
  code: [
    [84, 48],
    [150, 48],
  ],
};

export function SameVector() {
  const pass = useGate();
  const [form, setForm] = useState<Form>("row");
  const [seen, setSeen] = useState<Form[]>(["row"]);
  const note = FORMS.find((f) => f.id === form)!.note;
  const code = form === "code";
  const fade = (on: boolean) => ({ opacity: on ? 1 : 0 });
  const glyph = "transition-opacity duration-500 motion-reduce:transition-none";

  const pick = (f: Form) => {
    setForm(f);
    if (seen.includes(f)) return;
    const next = [...seen, f];
    setSeen(next);
    if (next.length === FORMS.length) pass("সংখ্যা একই, শুধু সাজগোজ আলাদা।");
  };

  return (
    <>
      <svg viewBox="0 0 260 128" role="img" aria-label={`Nasib's vector written as a ${form}`} className="mx-auto my-5 block h-auto w-full max-w-sm select-none">
        <rect x={8} y={6} width={244} height={116} rx={12} style={{ ...fade(code), fill: "#0f172a" }} className={glyph} />
        <text x={20} y={24} fontSize={9} style={{ ...fade(code), fill: "#6ee7b7" }} className={`${glyph} font-mono`}>
          {">>>"}
        </text>
        <text x={24} y={70} fontSize={20} className={`font-mono transition-colors duration-500 ${code ? "fill-[#e2e8f0]" : "fill-foreground"}`}>
          v =
        </text>
        {/* ( , ) for the row, [ , ] for code, one tall pair of brackets for the column */}
        <text x={70} y={71} fontSize={24} style={fade(form === "row")} className={`${glyph} fill-muted font-mono`}>
          (
        </text>
        <text x={200} y={71} fontSize={24} style={fade(form === "row")} className={`${glyph} fill-muted font-mono`}>
          )
        </text>
        <text x={69} y={71} fontSize={24} style={{ ...fade(code), fill: "#e2e8f0" }} className={`${glyph} font-mono`}>
          [
        </text>
        <text x={199} y={71} fontSize={24} style={{ ...fade(code), fill: "#e2e8f0" }} className={`${glyph} font-mono`}>
          ]
        </text>
        <text x={134} y={74} fontSize={20} style={fade(form !== "col")} className={`${glyph} font-mono ${code ? "fill-[#e2e8f0]" : "fill-muted"}`}>
          ,
        </text>
        <path d="M110 14h-6v100h6" strokeWidth={2} style={fade(form === "col")} className={`${glyph} fill-none stroke-muted`} />
        <path d="M170 14h6v100h-6" strokeWidth={2} style={fade(form === "col")} className={`${glyph} fill-none stroke-muted`} />
        {[NASIB.h, NASIB.w].map((n, i) => {
          const [x, y] = SPOT[form][i];
          return (
            <g
              key={n}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              className="transition-transform duration-500 ease-in-out motion-reduce:transition-none"
            >
              <rect width={BOX_W} height={BOX_H} rx={7} strokeWidth={2} className="fill-surface stroke-border" />
              <text x={BOX_W / 2} y={BOX_H / 2 + 6} textAnchor="middle" fontSize={17} fontWeight={600} className="fill-foreground font-mono">
                {n}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-2">
        {FORMS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={form === f.id}
            onClick={() => pick(f.id)}
            className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              form === f.id ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"
            }`}
          >
            {seen.includes(f.id) && form !== f.id ? "✓ " : ""}
            {f.label}
          </button>
        ))}
      </div>
      <div key={form} className={`${FADE} mt-3 min-h-12 text-center text-[0.95rem] text-muted`}>
        {note}
      </div>
      <Task done={seen.length === FORMS.length}>
        হামজাের vector তিনভাবেই সাজিয়ে দেখুন ({bn(seen.length)}/{bn(FORMS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · v[1] is not v₁. Predict what Samin's print shows, then read both
//     numberings off one ruler.

const NV = [NASIB.h, NASIB.w, NASIB.age];
const SUB = "₀₁₂₃₄₅₆₇₈₉";
const vSub = (i: number) => `v${String(i).replace(/\d/g, (d) => SUB[Number(d)])}`;
const PRINT_Q = ["180, হামজাের height", "78, হামজাের weight", "Error দেবে, v[1] বলে কিছু নাই"];
const PRINT_RIGHT = 1;
const AGE_Q = ["v[3]", "v[2]", "v[18]"];
const AGE_RIGHT = 1;
const AGE_MISS = [
  "উঁহু। Code-এ গোনা Start 0 থেকে, তাই তিন নম্বর ঘর মানে v[2]। v[3] বলে কোনো ঘরই নাই, এটায় সত্যিই error আসবে।",
  "",
  "18 তো ঘরের ভেতরের সংখ্যা। Bracket-এ বসে ঘরের নম্বর, সংখ্যাটা না।",
];

export function IndexTrap() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const show = usePlay(900);
  const over = guess !== null && show.k === 1;
  const [wrong, setWrong] = useState<number[]>([]);
  const [won, setWon] = useState(false);

  const choose = (i: number) => {
    if (guess === null) {
      setGuess(i);
      show.play(1);
    }
  };
  const askAge = (i: number) => {
    if (won) return;
    if (i === AGE_RIGHT) {
      setWon(true);
      pass("অঙ্কে v₃, code-এ v[2]: একই ঘর।");
    } else if (!wrong.includes(i)) setWrong([...wrong, i]);
  };
  const lastWrong = wrong[wrong.length - 1];

  return (
    <>
      <div className="my-5 flex justify-center">
        <Laptop file="heights.py">
          <Out tone="plain">{">>> v = [180, 78, 18]"}</Out>
          <Out tone="plain">{">>> print(v[1])"}</Out>
          <Out>{"    # হামজাের height?"}</Out>
          {guess !== null && show.k === 1 && (
            <Out tone="ok">
              <b className={`${POP} inline-block text-base`}>78</b>
            </Out>
          )}
        </Laptop>
      </div>
      {over && <SaminSays tone="bad">হামজাের height 78?! ক্লাস ওয়ানের বাচ্চাও তো এর চেয়ে লম্বা।</SaminSays>}

      {over ? (
        <div className={FADE}>
          <div className="mt-5 flex justify-center gap-3 font-mono sm:gap-4">
            {NV.map((n, i) => (
              <div key={n} className="flex flex-col items-center gap-1">
                <span className="text-sm font-semibold text-accent-text">{vSub(i + 1)}</span>
                <b
                  className={`inline-block min-w-[3.2ch] rounded-lg border-2 px-2.5 py-1 text-center text-xl font-semibold transition-colors ${
                    won && i === 2 ? "win-pop border-accent bg-accent/10" : i === 1 ? "border-cat-amber bg-cat-amber/10" : "border-border"
                  }`}
                >
                  {n}
                </b>
                <span className="text-sm font-semibold text-cat-amber">v[{i}]</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs text-muted">
            <span>
              <b className="text-accent-text">ওপরে</b> অঙ্কের গোনা, 1 থেকে
            </span>
            <span>
              <b className="text-cat-amber">নিচে</b> code-এর গোনা, 0 থেকে
            </span>
          </div>
          <div className="mt-5 text-sm font-medium text-muted">তাহলে code-এ হামজাের বয়স, 18, বের করতে কী লিখবেন?</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {AGE_Q.map((o, i) => (
              <button
                key={o}
                type="button"
                disabled={won || wrong.includes(i)}
                onClick={() => askAge(i)}
                className={`h-11 cursor-pointer rounded-full border-2 px-4 font-mono font-semibold transition-colors disabled:cursor-default ${
                  won && i === AGE_RIGHT
                    ? "win-pop border-accent bg-accent text-accent-foreground"
                    : wrong.includes(i)
                      ? "nudge border-danger/50 bg-danger/5 text-danger"
                      : won
                        ? "border-border opacity-50"
                        : "border-border hover:border-cat-blue/60"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          {!won && lastWrong !== undefined && <Nope key={lastWrong}>{AGE_MISS[lastWrong]}</Nope>}
        </div>
      ) : (
        <>
          <div className="mt-5 text-sm font-medium text-muted">Enter চাপলে কী print হবে?</div>
          <div className="mt-2 grid gap-2">
            {PRINT_Q.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, over, PRINT_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </>
      )}
      <Ticks
        items={[
          ["আগে guess করুন", over],
          ["বয়সের ঘর খুঁজুন", won],
        ]}
      />
      <Task done={won}>সামিনের code কী print করবে, আগে guess করুন। তারপর বয়সের ঘরটা খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · x ∈ ℝ³⁰⁰ read out loud: each symbol, tapped, drops its words into the
//     sentence. Then Fahim's finished vector gets its own line.

const TOKENS: { id: string; say: string; why: string; ink: string; ring: string }[] = [
  { id: "x", say: "x", why: "Vector-টার নাম, যাকে নিয়ে কথা হচ্ছে।", ink: "text-cat-blue", ring: "border-cat-blue" },
  { id: "in", say: "হলো", why: "মানে “এর মধ্যে পড়ে” বা “এই দলের সদস্য”। বাংলা বাক্যে বসালে সোজা “হলো”।", ink: "text-cat-violet", ring: "border-cat-violet" },
  { id: "n", say: "তিনশোটা", why: "কয়টা সংখ্যা, মানে list-এ কয়টা ঘর। এটাই dimension।", ink: "text-cat-amber", ring: "border-cat-amber" },
  { id: "R", say: "সাধারণ সংখ্যার", why: "Real numbers, মানে যেকোনো সাধারণ সংখ্যা: 7, −0.5, 3.14159…", ink: "text-cat-coral", ring: "border-cat-coral" },
];
const tok = (id: string) => TOKENS.find((t) => t.id === id)!;
const DIM_Q = ["f ∈ ℝ²", "f ∈ ℝ³", "f ∈ ℝ¹⁶⁵"];
const DIM_RIGHT = 1;
const DIM_MISS = ["উঁহু। বয়স যোগ হওয়ার পর ঘর তো আর দুইটা নাই।", "", "165 তো ফাহিমের height, ঘরের সংখ্যা না।"];

/** One tappable piece of the formula; it pulses until tapped. */
function Sym({ id, on, onTap, sup = false, children }: { id: string; on: boolean; onTap: (id: string) => void; sup?: boolean; children: ReactNode }) {
  const t = tok(id);
  return (
    <button
      type="button"
      onClick={() => onTap(id)}
      aria-label={t.say}
      className={`cursor-pointer rounded-lg border-2 px-1.5 font-serif leading-tight transition-colors ${
        on ? `${t.ink} ${t.ring} bg-foreground/5` : "animate-pulse border-dashed border-muted/50 hover:border-foreground/40"
      } ${sup ? "relative -top-5 text-2xl" : "text-5xl"}`}
    >
      {children}
    </button>
  );
}

/** A gap in the spoken sentence, filled once its symbol is tapped. */
function Blank({ id, on }: { id: string; on: boolean }) {
  const t = tok(id);
  return on ? (
    <b className={`${POP} inline-block font-semibold ${t.ink}`}>{t.say}</b>
  ) : (
    <span className="inline-block min-w-12 border-b-2 border-dashed border-muted/50 text-center text-muted">…</span>
  );
}

export function ReadAloud() {
  const pass = useGate();
  const [got, setGot] = useState<string[]>([]);
  const [lastTap, setLastTap] = useState<string | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const [won, setWon] = useState(false);
  const read = got.length === TOKENS.length;

  const tap = (id: string) => {
    setLastTap(id);
    if (!got.includes(id)) setGot([...got, id]);
  };
  const answer = (i: number) => {
    if (won) return;
    if (i === DIM_RIGHT) {
      setWon(true);
      pass("f হলো তিনটা সংখ্যার একটা list।");
    } else if (!wrong.includes(i)) setWrong([...wrong, i]);
  };

  const has = (id: string) => got.includes(id);

  return (
    <>
      <div className="mt-6 flex items-start justify-center gap-2">
        <Sym id="x" on={has("x")} onTap={tap}>
          <i>x</i>
        </Sym>
        <Sym id="in" on={has("in")} onTap={tap}>
          ∈
        </Sym>
        <span className="flex items-start">
          <Sym id="R" on={has("R")} onTap={tap}>
            ℝ
          </Sym>
          <Sym id="n" on={has("n")} onTap={tap} sup>
            300
          </Sym>
        </span>
      </div>
      <div className="mt-4 min-h-12 text-center text-[0.95rem] text-muted">
        {lastTap && (
          <span key={lastTap} className={FADE}>
            {tok(lastTap).why}
          </span>
        )}
      </div>
      <div className="mx-auto mt-2 flex max-w-md flex-wrap items-baseline justify-center gap-x-1.5 gap-y-2 rounded-xl border border-border px-4 py-3 text-lg">
        <span>“</span>
        <Blank id="x" on={has("x")} />
        <Blank id="in" on={has("in")} />
        <Blank id="n" on={has("n")} />
        <Blank id="R" on={has("R")} />
        <span className={read ? "font-semibold" : "text-muted"}>একটা list</span>
        <span>।”</span>
      </div>

      {read && (
        <div className={FADE}>
          <div className="mt-6 text-sm font-medium text-muted">
            পরদিন ফাহিম এসে জানালো, ওর বয়স 16। তাহলে ওর vector <span className="font-mono">f = (165, 54, 16)</span>। Paper-এর ভাষায় এটা কীভাবে লিখবেন?
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIM_Q.map((o, i) => (
              <button
                key={o}
                type="button"
                disabled={won || wrong.includes(i)}
                onClick={() => answer(i)}
                className={`h-11 cursor-pointer rounded-full border-2 px-4 font-serif text-lg transition-colors disabled:cursor-default ${
                  won && i === DIM_RIGHT
                    ? "win-pop border-accent bg-accent text-accent-foreground"
                    : wrong.includes(i)
                      ? "nudge border-danger/50 bg-danger/5 text-danger"
                      : won
                        ? "border-border opacity-50"
                        : "border-border hover:border-cat-blue/60"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          {!won && wrong.length > 0 && <Nope key={wrong.length}>{DIM_MISS[wrong[wrong.length - 1]]}</Nope>}
        </div>
      )}
      <Ticks
        items={[
          ["বাক্যটা জোড়া লাগান", read],
          ["ফাহিমেরটা লিখুন", won],
        ]}
      />
      <Task done={won}>
        চারটা টুকরাতেই tap করুন ({bn(got.length)}/{bn(TOKENS.length)}), তারপর ফাহিমের vector-টা লিখে ফেলুন।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · The last picture, the whole lesson on one sheet: the file flips and
//      nothing moves apart; one row flips and Tanvir is gone; fixed, he's back.

const REEL = [
  "",
  "পুরো file উল্টালাম…",
  "…আবার ফেরত। কারো partner বদলায়নি।",
  "এবার শুধু তানভীরের row উল্টো…",
  "…ঠিক করতেই আবার সোমের পাশে।",
];

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const k = useCountUp(REEL.length, 1600);
  const [p] = useTween([k === 1 ? 1 : 0], 1100);
  const [q] = useTween([k === 3 ? 1 : 0], 1000);
  const home = place(TANVIR, p);
  const at: [number, number] = [lerp(home[0], OFF[0], q), lerp(home[1], OFF[1], q)];

  return (
    <>
      <div className="my-4">
        <Paper
          label="the class on graph paper: mirrored and back, then Tanvir's row swapped and fixed"
          flip={p}
          mirror={k === 1 || k === 2}
          pts={[...CLASS.map((kid) => ({ kid, at: place(kid, p), pop: true })), { kid: TANVIR, at, nudge: [5, 2], below: true, pop: true }]}
          lines={k === 3 ? [{ key: "slip", a: at, b: place(RAHAT, p), bad: true }] : []}
        />
      </div>
      <div className="min-h-24 text-center">
        {k < REEL.length ? (
          <div key={k} className={`${FADE} text-lg font-medium`}>
            {REEL[k]}
          </div>
        ) : (
          <div className={FADE}>
            <div className="text-xl font-bold">সবার ঘর সমান, সবার ঘরের মানে এক</div>
            <div className="text-muted">আর order সবার বেলায় একই। এটাই vector।</div>
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

// ---------------------------------------------------------------------------
// 0 · The binary recall as an animated question. Eight lamps with their place
//     values; each pick plays out on them. 255 lights all eight, one by one,
//     with the running sum; 8 and 128 light only as many as it takes to pass
//     the number they claimed, and stop there.

const LAMPS = [128, 64, 32, 16, 8, 4, 2, 1];
const BIT_OPTIONS = [255, 8, 128];
// Which lamps each pick lights, in order: the right one all eight from the
// big end; "8" from the small end until the sum passes 8; "128" from the big
// end until the second lamp carries it past 128.
const BIT_ORDER = [
  [0, 1, 2, 3, 4, 5, 6, 7],
  [7, 6, 5, 4],
  [0, 1],
];

export function BitPick() {
  const pass = useGate();
  const [pick, setPick] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const play = usePlay(300);

  const order = pick === null ? [] : BIT_ORDER[pick];
  const lit = order.slice(0, play.k);
  const sum = lit.reduce((t, i) => t + LAMPS[i], 0);

  const choose = (i: number) => {
    setPick(i);
    setOver(false);
    sfx.pencil(0.2);
    play.play(BIT_ORDER[i].length, () => {
      setOver(true);
      if (i === 0) pass("আটটা হ্যাঁ মানে ২৫৫।");
    });
  };

  const right = over && pick === 0;
  return (
    <>
      <div className="my-4 rounded-2xl border border-border bg-foreground/[0.02] px-3 py-4">
        <div className="mx-auto flex max-w-xs justify-between gap-1">
          {LAMPS.map((v, i) => {
            const on = lit.includes(i);
            return (
              <div key={v} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`size-7 rounded-full border-2 transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none ${
                    on ? "border-cat-amber bg-cat-amber shadow-[0_0_10px_var(--color-cat-amber)]" : "border-border bg-surface"
                  }`}
                />
                <span className={`font-mono text-xs tabular-nums ${on ? "font-bold text-foreground" : "text-muted"}`}>{v}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 min-h-7 text-center font-mono text-lg font-bold tabular-nums">
          {pick === null ? <span className="text-sm font-normal text-muted">একটা উত্তর বেছে নিন</span> : sum}
        </div>
      </div>
      <div className="space-y-2">
        {BIT_OPTIONS.map((v, i) => (
          <Choice
            key={v}
            n={i}
            look={predictLook(i, pick, over, 0)}
            disabled={play.running || right}
            onClick={() => choose(i)}
          >
            <span className="font-mono">{v === 255 ? "২৫৫" : v === 8 ? "৮" : "১২৮"}</span>
          </Choice>
        ))}
      </div>
      {over && pick === 1 && <Nope key="p1">ছোট ঘর থেকে জ্বালাতে জ্বালাতে যোগফল ৮ ছাড়িয়ে গেল, অথচ ঘর এখনো বাকি।</Nope>}
      {over && pick === 2 && <Nope key="p2">১২৮-এর সাথে ৬৪-র ঘরটা জ্বালালেই ১২৮ পেরিয়ে গেল। বাকি ঘরগুলো এখনো নেভানো।</Nope>}
      <Task done={right}>সবচেয়ে বড় সংখ্যাটা বেছে নিন</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scenes for the opening of screen 2.

type Story = { story?: boolean };
const INK2 = "#0f1b2d";

/** Shom at the tea stall with the king − man + woman puzzle. */
export function TeaStallSom({}: Story) {
  const s = useScene(3, [600, 2400, 2800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="চায়ের দোকানে সোম ফোন হাতে বন্ধুকে একটা আবিষ্কারের কথা বলছে">
        <Stall x={60} y={150} sign="চা" />
        <Person who="som" x={170} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} mood={k >= 1 ? "smug" : "plain"} label />
        <Person who="fahim" x={250} y={150} facing={-1} mood={k >= 2 ? "puzzled" : "plain"} />
        {k === 1 && <Bubble x={170} y={84} side="left" lines={["King − man + woman", "= Queen."]} />}
        {k >= 2 && <Bubble x={250} y={84} side="left" tone="think" lines={["শব্দ আবার", "বিয়োগ হয় কীভাবে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1b · A figure for the paragraph after Shom's puzzle: the puzzle parked, the
//      two faces of a vector (the second kept hidden for 2.2), the list
//      with its conditions hanging off it, and one of them coming loose.

const TF_CAP = [
  "শব্দ আবার বিয়োগ হয় কীভাবে? প্রশ্নটা আপাতত মাথায় রেখে দিন.",
  "তার জন্য vector-কে দুইটা রূপে চিনতে হবে.",
  "প্রথম রূপটা আপনার চেনা, সংখ্যার একটা list.",
  "কিন্তু সেই list-এর গায়ে কয়েকটা ছোট ছোট শর্ত লেখা আছে.",
  "না মানলে কী হয়, আজকে সামিন সেটা হাতেনাতে টের পাবে.",
];
const TF_TAGS = [36, 65, 94];

export function TwoForms({}: Story) {
  const s = useScene(4, [600, 2400, 2200, 2400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{TF_CAP[k]}</span>}>
      <svg viewBox="0 0 240 132" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="vector-এর দুই রূপ: একটা সংখ্যার list, আরেকটা এখনো ঢাকা">
        {k === 0 ? (
          <text key="big" x={120} y={70} textAnchor="middle" fontSize={15} fontWeight={700} className={`${FADE} fill-foreground`}>
            King − man + woman = ?
          </text>
        ) : (
          <text key="small" x={120} y={12} textAnchor="middle" fontSize={8} className={`${FADE} fill-muted`}>
            King − man + woman = ?
          </text>
        )}
        {k >= 1 && (
          <>
            <g className={POP}>
              <rect x={18} y={24} width={94} height={62} rx={8} className={`fill-surface transition-[stroke,stroke-width] duration-300 ${k >= 2 ? "stroke-cat-blue" : "stroke-border"}`} strokeWidth={k >= 2 ? 2 : 1} />
              <text x={65} y={40} textAnchor="middle" fontSize={8.5} className="fill-muted">
                রূপ ১
              </text>
              <text x={65} y={66} textAnchor="middle" fontSize={14} fontWeight={700} fontFamily="ui-monospace, monospace" className="fill-foreground">
                (170, 60)
              </text>
            </g>
            <g className={`${POP} transition-opacity duration-300 ${k >= 2 ? "opacity-35" : ""}`} style={{ transitionDelay: "250ms" }}>
              <rect x={128} y={24} width={94} height={62} rx={8} className="fill-surface stroke-border" strokeDasharray="4 3" />
              <text x={175} y={40} textAnchor="middle" fontSize={8.5} className="fill-muted">
                রূপ ২
              </text>
              <text x={175} y={70} textAnchor="middle" fontSize={22} fontWeight={700} className="fill-muted">
                ?
              </text>
            </g>
          </>
        )}
        {k >= 3 &&
          TF_TAGS.map((x, i) => {
            const loose = k >= 4 && i === 1;
            return (
              <g key={x} className={POP} style={{ transitionDelay: `${i * 180}ms` }}>
                {!loose && <path d={`M${x} 86V102`} className="stroke-muted" strokeWidth={1} />}
                <g
                  className="transition-transform duration-700 ease-in motion-reduce:transition-none"
                  style={{ transformOrigin: `${x}px 102px`, transform: loose ? "translate(6px, 16px) rotate(28deg)" : "none" }}
                >
                  <rect x={x - 13} y={102} width={26} height={13} rx={3} className={loose ? "fill-danger/10 stroke-danger" : "fill-cat-amber/20 stroke-cat-amber"} />
                  <text x={x} y={111.5} textAnchor="middle" fontSize={7} className={loose ? "fill-danger" : "fill-foreground"}>
                    শর্ত
                  </text>
                </g>
              </g>
            );
          })}
      </svg>
    </Scene>
  );
}

// 1c · PT sir's Thursday wrestling rule, and why a 49 kg boy against an 82 kg
//      one will not do: the rule, the pairing rule, the mismatch, the fall.
export function WrestlingRule({}: Story) {
  const s = useScene(4, [600, 2400, 2400, 2400]);
  const k = s.k;
  const tag = (x: number, text: string) => (
    <g key={text} className={FADE}>
      <rect x={x - 21} y={62} width={42} height={14} rx={7} fill="white" stroke={INK2} strokeOpacity={0.35} />
      <text x={x} y={72} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK2}>
        {text}
      </text>
    </g>
  );
  const fall = k >= 4;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মাঠে PT স্যার বলছেন, প্রতি বৃহস্পতিবার কুস্তির practice, জোড়া হবে সমানে সমান। ৪৯ কেজির আরিফকে ৮২ কেজির ইমন ঠেলে ফেলে দেয়">
        <Person who="mama" x={50} y={150} arm={k <= 1 ? "point" : "down"} />
        <text x={50} y={165} textAnchor="middle" fontSize={8} fill={INK2}>
          PT স্যার
        </text>
        {k === 0 && <Bubble x={50} y={80} side="right" lines={["প্রতি বৃহস্পতিবার", "কুস্তির practice."]} />}
        {k === 1 && <Bubble x={50} y={80} side="right" lines={["জোড়া হবে", "সমানে সমান."]} />}
        {k >= 2 && (
          <>
            <g
              className="transition-transform duration-500 ease-in motion-reduce:transition-none"
              style={{ transformOrigin: "160px 150px", transform: fall ? "rotate(-78deg)" : "none", transitionDelay: fall ? "450ms" : "0ms" }}
            >
              <Person who="fahim" x={170} y={150} scale={0.85} mood={fall ? "sad" : "plain"} />
            </g>
            <Person who="nasib" x={fall ? 200 : 240} y={150} facing={-1} scale={1.12} walking={fall} ms={600} arm={fall ? "point" : "down"} />
            <text x={fall ? 135 : 170} y={165} textAnchor="middle" fontSize={8} fill={INK2}>
              আরিফ
            </text>
            <text x={fall ? 200 : 240} y={165} textAnchor="middle" fontSize={8} fill={INK2}>
              ইমন
            </text>
          </>
        )}
        {k >= 3 && !fall && tag(170, "৪৯ কেজি")}
        {k >= 3 && !fall && tag(240, "৮২ কেজি")}
      </Stage>
    </StoryFrame>
  );
}

// 1d · A figure for Samin's paragraph: the file, one row placed as a dot by
//      its two numbers, the whole class on the sheet, and close measurements
//      as close dots. Same length per unit on both axes, as on the widget.

const SS_CAP = [
  "ক্লাসের সবার (height, weight) একটা file-এ তুললো.",
  "height কে x axis বরাবর, weight কে y axis বরাবর place করলো.",
  "প্রত্যেককে কাগজে একটা dot বানিয়ে বসিয়ে দিলো.",
  "দুইজনের measurements যত কাছাকাছি, কাগজে ওদের dot-ও তত কাছাকাছি.",
  "দুজনের মাঝের distance সবচেয়ে কম হলে তারাই partner.",
];
const SS_U = 2.6;
const ssAt = (c: Kid): [number, number] => [124 + (c.h - 150) * SS_U, 116 - (c.w - 45) * SS_U];
const SS_NEAR = FAHIM;
const SS_FAR = IMON;

export function SaminSheet({}: Story) {
  const s = useScene(4, [600, 2400, 2200, 2400, 2400]);
  const k = s.k;
  const [sx, sy] = ssAt(SAMIN);
  const [nx, ny] = ssAt(SS_NEAR);
  const [fx, fy] = ssAt(SS_FAR);
  const hot = (c: Kid) => (k >= 1 && c === SAMIN) || (k >= 3 && (c === SS_NEAR || (k === 3 && c === SS_FAR)));
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SS_CAP[k]}</span>}>
      <svg viewBox="0 0 260 136" className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label="সামিনের file থেকে গ্রাফ পেপারে dot: height x axis-এ, weight y axis-এ">
        <rect x={4} y={8} width={98} height={120} rx={6} fill="#0b1220" />
        <text x={12} y={21} fontSize={6.5} fill="#94a3b8">
          নাম
        </text>
        <text x={66} y={21} textAnchor="end" fontSize={6.5} fill="#94a3b8" fontFamily="ui-monospace, monospace">
          h
        </text>
        <text x={92} y={21} textAnchor="end" fontSize={6.5} fill="#94a3b8" fontFamily="ui-monospace, monospace">
          w
        </text>
        {CLASS.map((c, i) => (
          <g key={c.name} className={FADE} style={{ transitionDelay: `${i * 110}ms` }}>
            {hot(c) && <rect x={7} y={26 + i * 14} width={92} height={13} rx={2} fill="#2563eb" opacity={0.35} />}
            <text x={12} y={35.5 + i * 14} fontSize={7} fill="#e2e8f0">
              {c.name}
            </text>
            <text x={66} y={35.5 + i * 14} textAnchor="end" fontSize={7} fill="#e2e8f0" fontFamily="ui-monospace, monospace">
              {c.h}
            </text>
            <text x={92} y={35.5 + i * 14} textAnchor="end" fontSize={7} fill="#e2e8f0" fontFamily="ui-monospace, monospace">
              {c.w}
            </text>
          </g>
        ))}
        <rect x={110} y={8} width={146} height={120} rx={4} fill="white" stroke={INK2} strokeOpacity={0.25} />
        <path d="M124 116H246M124 116V14" stroke={INK2} strokeOpacity={0.55} fill="none" />
        <text x={246} y={124} textAnchor="end" fontSize={6.5} fill={INK2}>
          height →
        </text>
        <text x={118} y={14} textAnchor="end" fontSize={6.5} fill={INK2} transform="rotate(-90 118 14)">
          weight →
        </text>
        {k >= 1 && (
          <g key="guide">
            <Draw d={`M${sx} 116V${sy}`} className="stroke-[#2563eb]" strokeWidth={0.9} ms={500} />
            <Draw d={`M124 ${sy}H${sx}`} className="stroke-[#2563eb]" strokeWidth={0.9} ms={500} delay={500} />
            <text x={sx} y={124} textAnchor="middle" fontSize={6} fill="#2563eb" fontFamily="ui-monospace, monospace" className={FADE}>
              {SAMIN.h}
            </text>
            <text x={121} y={sy + 2} textAnchor="end" fontSize={6} fill="#2563eb" fontFamily="ui-monospace, monospace" className={FADE}>
              {SAMIN.w}
            </text>
          </g>
        )}
        {k >= 3 && (
          <g key="lines">
            <g className={`transition-opacity duration-500 ${k >= 4 ? "opacity-20" : ""}`}>
              <Draw d={`M${sx} ${sy}L${fx} ${fy}`} className="stroke-[#e11d48]" strokeWidth={1.3} ms={700} />
            </g>
            <Draw d={`M${sx} ${sy}L${nx} ${ny}`} className="stroke-[#0d9488]" strokeWidth={k >= 4 ? 2.4 : 1.3} ms={500} delay={300} />
          </g>
        )}
        {CLASS.map((c, i) => {
          if (k < 2 && c !== SAMIN) return null;
          if (k < 1) return null;
          const [x, y] = ssAt(c);
          const ring = k >= 4 && (c === SAMIN || c === SS_NEAR);
          return (
            <g key={c.name}>
              <circle cx={x} cy={y} r={3} className={`${POP} ${c === SAMIN ? "fill-[#2563eb]" : "fill-[#475569]"}`} style={{ transitionDelay: c === SAMIN ? "900ms" : `${i * 120}ms` }} />
              {ring && <circle cx={x} cy={y} r={6} fill="none" stroke="#0d9488" strokeWidth={1.2} className={POP} />}
            </g>
          );
        })}
        {k >= 1 && (
          <text x={sx + 5} y={sy + 9} fontSize={6.5} fill={INK2} className={FADE}>
            {SAMIN.name}
          </text>
        )}
        {k >= 3 && (
          <text x={nx - 5} y={ny - 3} textAnchor="end" fontSize={6.5} fill={INK2} className={FADE}>
            {SS_NEAR.name}
          </text>
        )}
        {k === 3 && (
          <text x={fx - 4} y={fy - 4} textAnchor="end" fontSize={6.5} fill={INK2} className={FADE}>
            {SS_FAR.name}
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 1e · A story scene for the program paragraph: measuring dot to dot with a
//      ruler is slow (21 pairs for seven dots), so Samin types three
//      instructions instead. It stops before any pair is shown: finding the
//      partners is the reader's job on the widget.

// the sheet on the wall: 2.3 px per unit on both axes, so close on the sheet is close in the file
const wallAt = (k: Kid): [number, number] => [205 + (k.h - 155) * 2.3, 125 - (k.w - 45) * 2.3];
const ALL_PAIRS = (CLASS.length * (CLASS.length - 1)) / 2;
const RULER_PAIRS: [Kid, Kid][] = [
  [ARIF, FAHIM],
  [SHOM, IMON],
];
const SCREEN_ROWS = ["170 60", "158 49", "165 54"];
const SCREEN_CODE = ["read(file)", "nearest()", "show()"];

export function SaminProgram({}: Story) {
  const s = useScene(3, [600, 2000, 2400]);
  const k = s.k;
  const coding = k >= 3;
  const lines = coding ? SCREEN_CODE : SCREEN_ROWS;
  const ruler = !coding && k >= 1 ? RULER_PAIRS[k - 1] : null;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সামিন স্কেল দিয়ে dot থেকে dot মাপছে, মোট ২১টা মাপ। তারপর laptop-এ তিন লাইনের program লিখছে">
        <rect x={20} y={110} width={92} height={40} fill="#92400e" />
        <rect x={20} y={108} width={92} height={4} fill="#78350f" />
        <rect x={36} y={72} width={60} height={37} rx={3} fill="#1e293b" />
        <rect x={39} y={75} width={54} height={31} rx={1.5} fill="#0b1220" />
        {lines.map((l, i) => (
          <text
            key={`${coding}${l}`}
            x={44}
            y={87 + i * 9}
            fontSize={6.5}
            fontFamily="ui-monospace, monospace"
            fill={coding ? "#6ee7b7" : "#cbd5e1"}
            className={FADE}
            style={{ transitionDelay: coding ? `${i * 600}ms` : "0ms" }}
          >
            {l}
          </text>
        ))}
        <Person who="samin" x={coding ? 130 : 165} y={150} facing={coding ? -1 : 1} arm={ruler ? "point" : coding ? "point" : "down"} walking={k === 3} ms={600} label />
        <rect x={192} y={22} width={106} height={112} rx={3} fill="white" stroke={INK2} strokeOpacity={0.3} />
        <path d="M200 128H292M200 128V28" stroke={INK2} strokeOpacity={0.5} fill="none" />
        {CLASS.map((c) => {
          const [x, y] = wallAt(c);
          return <circle key={c.name} cx={x} cy={y} r={3.2} className="fill-[#2563eb]" />;
        })}
        {ruler && (
          <g key={ruler[0].name}>
            <Draw d={`M${wallAt(ruler[0]).join(" ")}L${wallAt(ruler[1]).join(" ")}`} className="stroke-[#eab308]" strokeWidth={4} ms={700} />
          </g>
        )}
        {k >= 1 && (
          <text key={k} x={245} y={16} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK2} className={FADE}>
            {coding ? `মোট ${bn(ALL_PAIRS)}টা মাপ` : `মাপ ${bn(Math.min(k, 2))}, বাকি ${bn(ALL_PAIRS - Math.min(k, 2))}টা`}
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 11 · Shared bits for the scenes and figures below.

/** Samin's desk with a laptop; `x` is the desk's left edge, `warn` reddens one line. */
function DeskLaptop({ x = 20, lines, code = false, warn }: { x?: number; lines: string[]; code?: boolean; warn?: number }) {
  return (
    <g transform={`translate(${x - 20} 0)`}>
      <rect x={20} y={110} width={92} height={40} fill="#92400e" />
      <rect x={20} y={108} width={92} height={4} fill="#78350f" />
      <rect x={36} y={72} width={60} height={37} rx={3} fill="#1e293b" />
      <rect x={39} y={75} width={54} height={31} rx={1.5} fill="#0b1220" />
      {lines.map((l, i) => (
        <text
          key={`${i}${l}`}
          x={44}
          y={87 + i * 9}
          fontSize={6.2}
          fontFamily="ui-monospace, monospace"
          fill={i === warn ? "#fca5a5" : code ? "#6ee7b7" : "#cbd5e1"}
          className={FADE}
        >
          {l}
        </text>
      ))}
    </g>
  );
}

/** A tick drawn as a path, so it never turns into an emoji. */
function TickMark({ x, y, className = "stroke-accent" }: { x: number; y: number; className?: string }) {
  return <path d={`M${x} ${y}l3 3l6 -7`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={`${POP} fill-none ${className}`} />;
}

/** The small white sheet the two mirror figures share: 100 units across and up. */
const MS_X = 70;
const MS_Y = 114;
const msx = (a: number) => MS_X + a;
const msy = (b: number) => MS_Y - b;

function MiniSheet({ flipped, children }: { flipped: boolean; children: ReactNode }) {
  const lab = "text-[7.5px] font-semibold";
  return (
    <>
      <rect x={MS_X} y={msy(100)} width={100} height={100} rx={3} fill="white" stroke={INK2} strokeOpacity={0.3} />
      <path d={[0, 25, 50, 75].map((i) => `M${msx(i)} ${msy(0)}V${msy(100)}M${msx(0)} ${msy(i)}H${msx(100)}`).join("")} strokeWidth={0.5} className="fill-none stroke-cat-blue/25" />
      <text x={msx(50)} y={MS_Y + 11} textAnchor="middle" className={lab} fill={INK2}>
        {flipped ? "weight →" : "height →"}
      </text>
      <text transform={`translate(${MS_X - 5} ${msy(50)}) rotate(-90)`} textAnchor="middle" className={lab} fill={INK2}>
        {flipped ? "height →" : "weight →"}
      </text>
      {children}
    </>
  );
}

/** A dot that glides to its mirror image when `flip` turns on. */
function MirrorDot({ a, b, flip, fill = "fill-[#2563eb]", ms = 700 }: { a: number; b: number; flip: boolean; fill?: string; ms?: number }) {
  const [x, y] = flip ? [b, a] : [a, b];
  return (
    <g style={{ transform: `translate(${msx(x)}px, ${msy(y)}px)`, transitionDuration: `${ms}ms` }} className="transition-transform ease-in-out motion-reduce:transition-none">
      <circle r={3.4} className={fill} />
    </g>
  );
}

const MS_DOTS: [number, number][] = [
  [18, 30],
  [30, 22],
  [66, 70],
  [80, 62],
  [24, 74],
];
const MS_PAIRS: [number, number][] = [
  [0, 1],
  [2, 3],
];

// ---------------------------------------------------------------------------
// 2a · Screen 3's question, animated: Hamza's row went in the wrong way round,
//      and each pick plays out how sir would then read it. The right one grows
//      a boy 78 cm tall and 180 kg wide.

const HR_OPTS = ["লাইনটা ভুল, তাই বাদ দিলেন", "কিছুই হয়নি, স্যার বুঝে নিলেন", "হামজা 78 cm লম্বা, ওজন 180 kg"];
const HR_RIGHT = 2;
const HR_NOPE = [
  "লাইনটা বাদ গেলে হামজা file-এই থাকতো না. স্যার তো ওকে একজন মানুষ ধরেই নিয়েছিলেন.",
  "ঘরের সংখ্যা তো বদলায়নি. height-এর ঘরে 78 বসে আছে, অথচ ছবির হামজা লম্বা.",
  "",
];

export function HamzaRow() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(900);
  const [h, w] = useTween(pick === HR_RIGHT ? [78, 180] : [180, 78], 900);
  const over = pick !== null && !play.running;
  const right = over && pick === HR_RIGHT;

  const choose = (i: number) => {
    if (play.running || right) return;
    setPick(i);
    sfx.pencil(0.2);
    play.play(1, () => (i === HR_RIGHT ? pass("একটা লাইন উল্টো, একদম অন্য মানুষ.") : setMiss((m) => m + 1)));
  };

  const bodyH = h * 0.42;
  const bodyW = w * 0.22;
  const gone = pick === 0;
  return (
    <>
      <svg viewBox="0 0 260 128" role="img" aria-label="স্যারের file-এর একটা row আর তার পাশে সেই row থেকে আঁকা একজন মানুষ" className="mx-auto my-4 block h-auto w-full max-w-sm select-none">
        <rect x={6} y={16} width={118} height={64} rx={8} fill="#0b1220" />
        <text x={67} y={30} textAnchor="middle" fontSize={7.5} fill="#94a3b8" fontFamily="ui-monospace, monospace">
          height
        </text>
        <text x={102} y={30} textAnchor="middle" fontSize={7.5} fill="#94a3b8" fontFamily="ui-monospace, monospace">
          weight
        </text>
        <g className={`transition-opacity duration-300 ${gone && over ? "opacity-40" : ""}`}>
          <text x={14} y={52} fontSize={9} fill="#e2e8f0">
            হামজা
          </text>
          <rect x={52} y={38} width={30} height={20} rx={5} fill="none" strokeWidth={1.6} className={`transition-colors duration-300 ${over && pick === 1 ? "stroke-danger" : "stroke-transparent"}`} />
          <text x={67} y={52} textAnchor="middle" fontSize={11} fontWeight={700} fill="#e2e8f0" fontFamily="ui-monospace, monospace">
            78
          </text>
          <text x={102} y={52} textAnchor="middle" fontSize={11} fontWeight={700} fill="#e2e8f0" fontFamily="ui-monospace, monospace">
            180
          </text>
          {gone && <path d="M12 47H116" strokeWidth={1.8} className={`${FADE} stroke-danger`} />}
        </g>
        <path d="M130 48h14" strokeWidth={1.5} className="stroke-muted" />
        <g className={`transition-opacity duration-300 ${gone ? "opacity-15" : ""}`}>
          <path d="M150 116H252" strokeWidth={1.2} className="stroke-border" />
          <circle cx={200} cy={116 - bodyH - 8} r={7} className="fill-[#d49a6a]" />
          <rect x={200 - bodyW / 2} y={116 - bodyH} width={bodyW} height={bodyH} rx={Math.min(8, bodyW / 3)} className="fill-[#dc2626]" />
          <text x={200} y={127} textAnchor="middle" fontSize={7.5} fontWeight={600} className="fill-foreground font-mono">
            {Math.round(h)} cm · {Math.round(w)} kg
          </text>
        </g>
        {gone && over && (
          <text x={200} y={70} textAnchor="middle" fontSize={9} className={`${FADE} fill-danger`}>
            বাদ
          </text>
        )}
      </svg>
      <div className="grid gap-2">
        {HR_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && over ? (i === HR_RIGHT ? "right" : "wrong") : "idle"} disabled={play.running || right} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {over && pick !== HR_RIGHT && <Nope key={miss}>{HR_NOPE[pick]}</Nope>}
      <Task done={right}>হামজার লাইন (78, 180) উল্টো লেখায় স্যার কী ধরে নিয়েছিলেন, বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 4's explanation: the sheet mirrored in its diagonal.

const MF_CAP = [
  "ক্লাসের কাগজ, আগের মতো. কাছাকাছি দুইজন, কাছাকাছি dot.",
  "file উল্টাতেই কাগজে একটা আয়না এসে দাঁড়ালো.",
  "প্রত্যেকটা dot আয়নায় দেখার মতো সরে গেল. দুই axis-এর নামও জায়গা বদলালো.",
  "কে কার কাছে, সেটা একই. কাছের জোড়াগুলো কাছেই আছে.",
  "হামজাের বেলায় যেটা সর্বনাশ ছিল, পুরো ক্লাসের বেলায় সেটা কোনো সমস্যা create করল না. কেন?",
];

export function MirrorFold({}: Story) {
  const s = useScene(4, [600, 1800, 2200, 2200, 2400]);
  const k = s.k;
  const flip = k >= 2;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{MF_CAP[k]}</span>}>
      <svg viewBox="0 0 240 130" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="কাগজের ছবি তির্যক আয়নায় উল্টে যাচ্ছে, কাছের জোড়া কাছেই থাকছে">
        <MiniSheet flipped={flip}>
          {k >= 1 && <Draw d={`M${msx(0)} ${msy(0)}L${msx(100)} ${msy(100)}`} className="stroke-[#94a3b8]" strokeWidth={1.2} ms={700} />}
          {k >= 1 && (
            <text x={msx(100) - 4} y={msy(100) + 12} textAnchor="end" fontSize={8} fill="#5a6b7d" className={FADE}>
              আয়না
            </text>
          )}
          {k >= 3 &&
            MS_PAIRS.map(([i, j]) => {
              const f = (p: [number, number]) => `${msx(flip ? p[1] : p[0])} ${msy(flip ? p[0] : p[1])}`;
              return <Draw key={`${i}${j}`} d={`M${f(MS_DOTS[i])}L${f(MS_DOTS[j])}`} className="stroke-[#0d9488]" strokeWidth={2} ms={500} />;
            })}
          {MS_DOTS.map(([a, b], i) => (
            <MirrorDot key={i} a={a} b={b} flip={flip} />
          ))}
          {k >= 4 && (
            <text x={msx(50)} y={msy(50)} textAnchor="middle" fontSize={22} fontWeight={700} fill="#0f1b2d" fillOpacity={0.55} className={POP}>
              ?
            </text>
          )}
        </MiniSheet>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · Story scenes: the night Samin rewrote the file, and the morning after.

export function SaminRewrites({}: Story) {
  const s = useScene(2, [600, 2400]);
  const k = s.k;
  const rows = k >= 1 ? ["60 170", "49 158", "54 165"] : ["170 60", "158 49", "165 54"];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop={k >= 2 ? "street" : "night"} label="রাতে সামিন পুরো file নতুন করে লিখছে, আগে weight, তারপর height। পরদিন সকালে হামজা ভাবছে 78 cm লম্বা আর 180 kg ওজনের কথা">
        {k < 2 ? (
          <>
            <DeskLaptop lines={rows} />
            <Person who="samin" x={130} y={150} facing={-1} arm={k >= 1 ? "point" : "down"} label />
            {k === 0 && <Bubble x={130} y={84} side="left" lines={["ওজনটা আগে লিখলেই", "সুবিধা."]} />}
          </>
        ) : (
          <>
            <Person who="nasib" x={170} y={150} mood="puzzled" label />
            <Bubble x={170} y={84} tone="think" lines={["78 cm লম্বা,", "ওজন 180 kg!"]} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Tanvir's chit, written weight first, and Samin copying it as it stands.

export function TanvirSlip({}: Story) {
  const s = useScene(2, [600, 2400]);
  const k = s.k;
  const rows = k === 0 ? ["170 60", "158 49", "165 54"] : k === 1 ? ["158 49", "165 54", "75 175"] : ["165 54", "75 175", "$ run"];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="তানভীর চিরকুটে লিখে দিলো 75 kg, 175 cm। সামিন তাড়াহুড়ায় ঠিক সেভাবেই file-এ তুলে program চালিয়ে দিলো">
        <DeskLaptop x={190} lines={rows} />
        <Person who="som" x={60} y={150} arm={k === 0 ? "hold" : "down"} />
        <text x={60} y={165} textAnchor="middle" fontSize={8} fill={INK2}>
          তানভীর
        </text>
        {k === 0 && (
          <g className={POP}>
            <rect x={70} y={92} width={34} height={24} rx={2} fill="white" stroke={INK2} strokeOpacity={0.4} />
            <text x={87} y={102} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={INK2}>
              75 kg
            </text>
            <text x={87} y={111} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" fill={INK2}>
              175 cm
            </text>
          </g>
        )}
        <Person who="samin" x={k === 0 ? 120 : 172} y={150} facing={k === 0 ? -1 : 1} walking={k === 1} ms={600} arm={k >= 1 ? "point" : "hold"} label />
      </Stage>
    </StoryFrame>
  );
}

// 4½ · A figure for screen 5's explanation: the program reads every cell by a
//      rule, and never asks whether the row obeys it.

const RR_ROWS = [
  { name: "সামিন", a: 170, b: 60 },
  { name: "আরিফ", a: 158, b: 49 },
  { name: "তানভীর", a: 75, b: 175 },
];
const RR_CAP = [
  "program-এর হাতে file, আর একটা rule: প্রথম ঘর height, দ্বিতীয় ঘর weight.",
  "প্রত্যেকটা ঘরের value সে ধরে নেয় একটা rule থেকে.",
  "পরের row-ও একই নিয়মে পড়া হলো.",
  "তানভীরের row উল্টো. rule-টা কী, তাতে ওর কিছু যায় আসে না. কোনো দাগও পড়লো না.",
  "rule বদলে পুরো file উল্টালে সবাই একই নিয়মে. rule-টা সবাই মানছে কিনা, সেটাই দেখার বিষয়.",
];

export function RuleReader({}: Story) {
  const s = useScene(4, [600, 2200, 1800, 2600, 2600]);
  const k = s.k;
  const all = k >= 4;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{RR_CAP[k]}</span>}>
      <svg viewBox="0 0 240 118" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="program rule ধরে প্রত্যেকটা row-এর ঘর পড়ছে">
        <rect x={34} y={4} width={172} height={18} rx={9} className="fill-cat-amber/15 stroke-cat-amber" />
        <text key={String(all)} x={120} y={16} textAnchor="middle" fontSize={8.5} fontWeight={600} className={`${FADE} fill-foreground`}>
          {all ? "প্রথম ঘর weight, দ্বিতীয় ঘর height" : "প্রথম ঘর height, দ্বিতীয় ঘর weight"}
        </text>
        {RR_ROWS.map((r, i) => {
          const y = 32 + i * 26;
          const [a, b] = all && i < 2 ? [r.b, r.a] : [r.a, r.b];
          const read = k >= i + 1;
          return (
            <g key={r.name}>
              <rect x={6} y={y} width={228} height={22} rx={6} className="fill-surface stroke-border" />
              <text x={12} y={y + 14} fontSize={8.5} className="fill-foreground">
                {r.name}
              </text>
              <text x={80} y={y + 14.5} textAnchor="end" fontSize={9.5} fontWeight={600} fontFamily="ui-monospace, monospace" className="fill-foreground">
                {a}
              </text>
              <text x={108} y={y + 14.5} textAnchor="end" fontSize={9.5} fontWeight={600} fontFamily="ui-monospace, monospace" className="fill-foreground">
                {b}
              </text>
              {read && (
                <g key={`${i}${all}`} className={FADE}>
                  <path d={`M114 ${y + 11}h8`} strokeWidth={1.2} className="stroke-muted" />
                  <text x={122} y={y + 14.5} fontSize={8.5} className="fill-muted">
                    {all ? `weight ${a}, height ${b}` : `height ${a}, weight ${b}`}
                  </text>
                  <TickMark x={221} y={y + 11} />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene: sir wants the age as well, Samin adds a column, and
//      Fahim's seat is empty.

export function AgeColumn({}: Story) {
  const s = useScene(2, [600, 2400]);
  const k = s.k;
  const rows = k === 0 ? ["170 60", "158 49", "165 54"] : k === 1 ? ["170 60 17", "158 49 15"] : ["170 60 17", "158 49 15", "165 54 ?"];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="PT স্যার বলছেন বয়সও দেখো। সামিন সবার row-এর শেষে বয়সের ঘর জোড়ে। ফাহিম আসেনি, তার বয়সের ঘরে ?">
        <Person who="mama" x={46} y={150} arm={k === 0 ? "point" : "down"} />
        <text x={46} y={165} textAnchor="middle" fontSize={8} fill={INK2}>
          PT স্যার
        </text>
        {k === 0 && <Bubble x={46} y={80} side="right" lines={["বয়সও দেখো."]} />}
        <DeskLaptop x={96} lines={rows} warn={k >= 2 ? 2 : undefined} />
        <Person who="samin" x={206} y={150} facing={-1} arm={k >= 1 ? "point" : "down"} label />
        {k >= 2 && (
          <g className={FADE}>
            <rect x={252} y={128} width={50} height={5} rx={1} fill="#78350f" />
            <rect x={256} y={133} width={3} height={17} fill="#78350f" />
            <rect x={295} y={133} width={3} height={17} fill="#78350f" />
            <text x={277} y={120} textAnchor="middle" fontSize={8} fill={INK2}>
              ফাহিম আসেনি
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 5½ · A figure for screen 6's explanation: three boxes against two, the
//      hole, and whatever goes into it.

const EB_CAP = [
  "হামজা থাকে তিন dimension-এর জগতে, আর ফাহিম দুইয়ের.",
  "সবার ঘর সংখ্যা সমান না হলে program তুলনাই করতে পারে না.",
  "ঘরটা ভরাতে গেলেই আসল প্যাঁচটা লাগে. 0 বসানো নিরীহ শোনায়, কিন্তু…",
  "…তাতে ফাহিমের partner বদলে গেল, আরিফ.",
  "average বসালে আবার অন্য জন. খালি ঘরে কী বসাচ্ছেন, সেটা একটা decision, আর decision result বদলে দিতে পারে.",
];

export function EmptyBox({}: Story) {
  const s = useScene(4, [600, 2200, 2200, 2400, 2600]);
  const k = s.k;
  const box = (x: number, y: number, v: string, tone = "stroke-border") => (
    <g key={`${x}${y}${v}`} className={POP}>
      <rect x={x} y={y} width={38} height={24} rx={6} className={`fill-surface ${tone}`} strokeWidth={1.6} />
      <text x={x + 19} y={y + 16} textAnchor="middle" fontSize={11} fontWeight={600} fontFamily="ui-monospace, monospace" className="fill-foreground">
        {v}
      </text>
    </g>
  );
  const fill = k >= 2 ? (k >= 4 ? String(AVG) : "0") : null;
  const mate = k === 3 ? ARIF.name : k >= 4 ? SAMIN.name : null;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{EB_CAP[k]}</span>}>
      <svg viewBox="0 0 240 124" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="হামজার তিনটা ঘর, ফাহিমের দুইটা আর একটা খালি ঘর, সেখানে 0 বা average বসানো">
        <text x={4} y={30} fontSize={9} className="fill-foreground">
          হামজা
        </text>
        <text x={4} y={90} fontSize={9} className="fill-foreground">
          ফাহিম
        </text>
        {[NASIB.h, NASIB.w, NASIB.age].map((v, i) => box(52 + i * 58, 16, String(v)))}
        {[FAHIM.h, FAHIM.w].map((v, i) => box(52 + i * 58, 76, String(v)))}
        {fill === null ? (
          <rect x={168} y={76} width={38} height={24} rx={6} fill="none" strokeWidth={1.6} strokeDasharray="4 3" className={k >= 1 ? "stroke-danger" : "stroke-border"} />
        ) : (
          box(168, 76, fill, "stroke-cat-amber")
        )}
        {[0, 1, 2].map((i) => {
          if (i === 2 && fill === null && k < 1) return null;
          const ok = i < 2 || fill !== null;
          return (
            <path
              key={`${i}${ok}`}
              d={`M${71 + i * 58} 40V76`}
              strokeWidth={1.4}
              strokeDasharray={ok ? undefined : "3 3"}
              className={`${FADE} ${ok ? "stroke-cat-teal" : "stroke-danger"}`}
              style={{ opacity: k >= 1 ? 1 : 0 }}
            />
          );
        })}
        {k >= 1 && fill === null && (
          <text x={187} y={62} textAnchor="middle" fontSize={8} className={`${FADE} fill-danger`}>
            মিলছে না
          </text>
        )}
        {mate && (
          <text key={mate} x={120} y={118} textAnchor="middle" fontSize={9.5} fontWeight={600} className={`${POP} fill-foreground`}>
            ফাহিমের partner: {mate}
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 7's explanation: three kinds of edit, and the one
//      that never makes a sound.

const QO_CAP = [
  "খেয়াল করেছেন, সবচেয়ে dangerous কোন ব্যাপারটা?",
  "যেটা জানান দেয় সেটা না. program থেমে গেল, লাল দাগ পড়লো.",
  "যেটা চুপচাপ থাকে, সেটা. program চলছে, কিছুই বলছে না.",
  "বেশিরভাগ data related bug এরকম. কোথাও একবার না একবার একটা rule ভাঙার ভুল.",
];
const QO_COLS = [
  { x: 4, name: "নিরাপদ" },
  { x: 84, name: "Error দেবে" },
  { x: 164, name: "চুপচাপ bug" },
];

export function QuietOnes({}: Story) {
  const s = useScene(3, [600, 2400, 2600, 2800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{QO_CAP[k]}</span>}>
      <svg viewBox="0 0 240 118" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="তিন রকম program: নিরাপদ, error দেয়, আর চুপচাপ ভুল করে">
        {QO_COLS.map((c, i) => {
          const loud = i === 1 && k >= 1;
          return (
            <g key={c.name}>
              <rect x={c.x} y={10} width={72} height={46} rx={6} fill="#0b1220" strokeWidth={2} className={`transition-colors duration-300 ${loud ? "stroke-danger" : "stroke-transparent"}`} />
              {i === 0 && (
                <>
                  <text x={c.x + 36} y={30} textAnchor="middle" fontSize={8} fontFamily="ui-monospace, monospace" fill="#cbd5e1">
                    170 60
                  </text>
                  <TickMark x={c.x + 30} y={39} />
                </>
              )}
              {i === 1 && (
                <text key={String(loud)} x={c.x + 36} y={36} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill={loud ? "#fca5a5" : "#475569"} className={FADE}>
                  {loud ? "Error!" : "…"}
                </text>
              )}
              {i === 2 && (
                <>
                  <text x={c.x + 36} y={26} textAnchor="middle" fontSize={8} fill="#cbd5e1">
                    তানভীর ↔ রাহাত
                  </text>
                  {k >= 2 && (
                    <text key="ok" x={c.x + 36} y={42} textAnchor="middle" fontSize={8} fontFamily="ui-monospace, monospace" fill="#6ee7b7" className={FADE}>
                      ok
                    </text>
                  )}
                </>
              )}
              <text x={c.x + 36} y={72} textAnchor="middle" fontSize={9} fontWeight={600} className="fill-foreground">
                {c.name}
              </text>
            </g>
          );
        })}
        {k >= 3 &&
          [0, 1, 2, 3, 4].map((r) => (
            <g key={r} className={FADE} style={{ transitionDelay: `${r * 120}ms` }}>
              <rect x={170 + (r % 5) * 12} y={84} width={9} height={14} rx={2} className={r === 3 ? "fill-cat-amber" : "fill-cat-blue/35"} />
              <path d={`M${174.5 + r * 12} 98v${r === 3 ? 6 : 0}`} className="stroke-cat-amber" strokeWidth={1.4} />
            </g>
          ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · The recall question, animated: a colleague flips 100 rows. Whatever you
//     pick, the program runs and the screen shows what really happens.

const HD_ROWS: [number, number][] = [
  [28, 42000],
  [35, 55000],
  [41, 61000],
  [52, 70000],
  [30, 38000],
  [45, 64000],
];
const HD_FLIPPED = 3;
const HD_AVG = (HD_ROWS.reduce((t, [a, b], i) => t + (i < HD_FLIPPED ? b : a), 0) / HD_ROWS.length).toFixed(1);
const HD_OPTS = [
  "Program error দেবে, কারণ row-গুলো একটার সাথে আরেকটা মিলছে না",
  "কিছুই হবে না, সংখ্যা তো সবই আছে",
  "কোনো error আসবে না, কিন্তু ওই 100 জনের সব হিসাব চুপচাপ ভুল হবে",
];
const HD_RIGHT = 2;
const HD_NOPE = [
  "লাল দাগ তো এলোই না. কোনো error নাই, সব row-তেই দুইটা করে ঘর, তাই program খুশি.",
  "program কিছু বলেনি ঠিকই, কিন্তু গড় বয়সটা দেখুন. সংখ্যা সবই আছে, শুধু কয়েকটা ঘর জায়গা বদলেছে.",
  "",
];

export function HundredRows() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const run = usePlay(800);
  const shown = pick === null ? 0 : run.running ? run.k : 3;
  const over = pick !== null && !run.running;
  const right = over && pick === HD_RIGHT;

  const choose = (i: number) => {
    if (run.running || right) return;
    setPick(i);
    sfx.typing(0.5);
    run.play(3, () => (i === HD_RIGHT ? pass("কোনো error নাই, শুধু ভুল উত্তর.") : setMiss((m) => m + 1)));
  };

  return (
    <>
      <div className="my-4 flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-center">
        <div className="w-full max-w-[15.5rem] rounded-xl border border-border bg-surface px-3 py-2 text-sm">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>বয়স</span>
            <span>আয়</span>
          </div>
          {HD_ROWS.map(([a, b], i) => {
            const flipped = i < HD_FLIPPED;
            return (
              <div key={i} className={`flex justify-between rounded px-1.5 font-mono tabular-nums ${flipped ? "bg-cat-amber/15" : ""}`}>
                <span>{flipped ? b : a}</span>
                <span>{flipped ? a : b}</span>
              </div>
            );
          })}
          <div className="mt-1 text-center text-xs text-muted">… মোট 100টা row, প্রথম 100টা উল্টো</div>
        </div>
        <Laptop file="run.py">
          {shown >= 1 && <Out>$ python run.py</Out>}
          {shown >= 2 && <Out tone="ok">✓ কোনো error নাই</Out>}
          {shown >= 3 && <Out tone="plain">গড় বয়স: {HD_AVG}</Out>}
        </Laptop>
      </div>
      <div className="grid gap-2">
        {HD_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && over ? (i === HD_RIGHT ? "right" : "wrong") : "idle"} disabled={run.running || right} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {over && pick !== HD_RIGHT && <Nope key={miss}>{HD_NOPE[pick]}</Nope>}
      <Task done={right}>colleague (বয়স, আয়) ঘুরিয়ে দিলে কী হবে, বেছে নিন. program চালিয়ে দেখবেন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Three small figures for the three words, in place of the static lines:
//     each opens, waits a beat, and then does the thing the word is about.

const WF_BOX = "fill-surface stroke-border";

function WordFig({ n }: { n: 0 | 1 | 2 }) {
  const k = useCountUp(1, 900);
  const glide = "transition-transform duration-500 ease-in-out motion-reduce:transition-none";
  const box = (x: number, y: number, t: string, extra = "") => (
    <g key={`${x}${y}${t}`} className={extra}>
      <rect x={x} y={y} width={36} height={22} rx={6} strokeWidth={1.6} className={WF_BOX} />
      <text x={x + 18} y={y + 15} textAnchor="middle" fontSize={11} fontWeight={600} fontFamily="ui-monospace, monospace" className="fill-foreground">
        {t}
      </text>
    </g>
  );
  if (n === 0) {
    return (
      <svg viewBox="0 0 200 60" className="my-2 block h-auto w-full max-w-[13rem]" role="img" aria-label="(175, 75) জায়গা বদলালে অন্য মানুষ">
        {[175, 75].map((v, i) => (
          <g key={v} style={{ transform: `translateX(${(k >= 1 ? 1 - 2 * i : 0) * 44}px)` }} className={glide}>
            {box(52 + i * 44, 8, String(v))}
          </g>
        ))}
        <text key={k} x={100} y={50} textAnchor="middle" fontSize={9.5} fontWeight={600} className={`${FADE} ${k >= 1 ? "fill-danger" : "fill-foreground"}`}>
          {k >= 1 ? "কাগজের বাইরের কেউ" : "তানভীর"}
        </text>
      </svg>
    );
  }
  if (n === 1) {
    return (
      <svg viewBox="0 0 200 66" className="my-2 block h-auto w-full max-w-[13rem]" role="img" aria-label="সামিনের তিনটা ঘর, ফাহিমের দুইটা আর একটা খালি">
        <text x={4} y={20} fontSize={9} className="fill-foreground">
          সামিন
        </text>
        <text x={4} y={52} fontSize={9} className="fill-foreground">
          ফাহিম
        </text>
        {[170, 60, 17].map((v, i) => box(44 + i * 44, 6, String(v)))}
        {[165, 54].map((v, i) => box(44 + i * 44, 38, String(v)))}
        <rect x={132} y={38} width={36} height={22} rx={6} fill="none" strokeWidth={1.6} strokeDasharray="4 3" className={`transition-colors duration-500 ${k >= 1 ? "stroke-danger" : "stroke-border"}`} />
        <text x={150} y={53} textAnchor="middle" fontSize={11} fontWeight={700} className={k >= 1 ? "fill-danger" : "fill-muted"}>
          ?
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 64" className="my-2 block h-auto w-full max-w-[13rem]" role="img" aria-label="height আর weight জায়গা বদলালেও দুটোই চলে, যদি সবাই একই rule মানে">
      {["height", "weight"].map((t, i) => (
        <g key={t} style={{ transform: `translateX(${(k >= 1 ? 1 - 2 * i : 0) * 60}px)` }} className={glide}>
          <rect x={34 + i * 60} y={6} width={52} height={20} rx={6} strokeWidth={1.6} className={WF_BOX} />
          <text x={60 + i * 60} y={20} textAnchor="middle" fontSize={9.5} fontWeight={600} className="fill-foreground font-mono">
            {t}
          </text>
        </g>
      ))}
      <TickMark x={86} y={42} />
      {k >= 1 && <TickMark x={106} y={42} />}
      <text x={100} y={60} textAnchor="middle" fontSize={8.5} className="fill-muted">
        {k >= 1 ? "(weight, height)" : "(height, weight)"}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 10 · Screen 3 of 2.1b, animated: which box is v₂? A pointer drops onto the
//      pick and its small number says whose it is.

const PS_VALS = [175, 75, 42, 19];
const PS_OPTS = [0, 1, 2];
const PS_RIGHT = 1;

export function PickSlot() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(700);
  const over = pick !== null && !play.running;
  const right = over && pick === PS_RIGHT;

  const choose = (i: number) => {
    if (play.running || right) return;
    setPick(i);
    sfx.pencil(0.2);
    play.play(1, () => (i === PS_RIGHT ? pass("v₂ মানে দ্বিতীয় ঘর: 75.") : setMiss((m) => m + 1)));
  };

  return (
    <>
      <svg viewBox="0 0 260 96" role="img" aria-label="সোমের vector (175, 75, 42, 19), প্রত্যেক ঘরের নিচে তার নম্বর" className="mx-auto my-4 block h-auto w-full max-w-sm select-none">
        <text x={8} y={50} fontSize={11} className="fill-foreground font-mono">
          v =
        </text>
        {PS_VALS.map((v, i) => {
          const on = pick === i;
          const look = on && over ? (i === PS_RIGHT ? "stroke-accent fill-accent/10" : "stroke-danger fill-danger/5") : on ? "stroke-cat-blue fill-cat-blue/10" : "fill-surface stroke-border";
          return (
            <g key={v}>
              <rect x={40 + i * 54} y={30} width={46} height={32} rx={7} strokeWidth={2} className={`transition-colors duration-300 ${look}`} />
              <text x={63 + i * 54} y={51} textAnchor="middle" fontSize={15} fontWeight={600} className="fill-foreground font-mono">
                {v}
              </text>
              <text x={63 + i * 54} y={78} textAnchor="middle" fontSize={10} className="fill-muted font-mono">
                {vSub(i + 1)}
              </text>
            </g>
          );
        })}
        <g style={{ transform: `translateX(${(pick ?? 0) * 54}px)`, opacity: pick === null ? 0 : 1 }} className="transition-[transform,opacity] duration-500 ease-in-out motion-reduce:transition-none">
          <path d="M63 25l-5 -9h10z" className="fill-cat-blue" />
        </g>
      </svg>
      <div className="grid grid-cols-3 gap-2">
        {PS_OPTS.map((i) => (
          <Choice key={i} n={i} look={pick === i && over ? (i === PS_RIGHT ? "right" : "wrong") : "idle"} disabled={play.running || right} onClick={() => choose(i)}>
            <span className="font-mono">{PS_VALS[i]}</span>
          </Choice>
        ))}
      </div>
      {over && pick !== PS_RIGHT && (
        <Nope key={miss}>
          ওটা {vSub((pick ?? 0) + 1)}, নিচের ছোট সংখ্যা {(pick ?? 0) + 1}. আমরা চাইছি v₂, মানে 2 নম্বর ঘর.
        </Nope>
      )}
      <Task done={right}>সোমের vector-এ v₂ কত, বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11a · A story scene for the code paragraph: Samin types v[1], sure the
//       first place is 1.

export function SaminPrint({}: Story) {
  const s = useScene(2, [600, 2200]);
  const k = s.k;
  const lines = k === 0 ? ["v=[180,78,18]"] : ["v=[180,78,18]", "print(v[1])"];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সামিন code লিখছে, v = [180, 78, 18], তারপর print(v[1])। মনে মনে ভাবছে, প্রথম ঘর মানে 1">
        <DeskLaptop x={150} lines={lines} code />
        <Person who="samin" x={130} y={150} arm={k >= 1 ? "point" : "down"} label />
        {k >= 2 && <Bubble x={130} y={84} side="left" tone="think" lines={["প্রথম ঘর মানে 1,", "সোজা হিসাব."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 12 · Two figures for the ending. The first: king minus man, 300 boxes at a
//      time, and a list that cannot say "queen".

const KM_KING = [0.8, 0.2, -0.4, 0.6, 0.1];
const KM_MAN = [0.7, -0.1, -0.3, 0.2, 0.1];
const KM_CAP = [
  "list-এর চোখে king একটা তিনশো ঘরের list.",
  "man-ও তাই. দুইটার ঘরে ঘরে বিয়োগ.",
  "হাতে আসে আরও তিনশোটা সংখ্যা.",
  "তাতে queen কোথা থেকে আসবে, list দেখে তার কোনো কূলকিনারা পাওয়া যায় না.",
];

export function KingMinusMan({}: Story) {
  const s = useScene(3, [600, 2200, 2400, 2800]);
  const k = s.k;
  const col = (x: number, title: string, vals: string[], show: boolean) =>
    show && (
      <g key={title} className={POP}>
        <text x={x + 19} y={14} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-foreground">
          {title}
        </text>
        {vals.map((v, i) => (
          <g key={i}>
            <rect x={x} y={22 + i * 18} width={38} height={16} rx={4} className="fill-surface stroke-border" />
            <text x={x + 19} y={34 + i * 18} textAnchor="middle" fontSize={9} fontWeight={600} fontFamily="ui-monospace, monospace" className="fill-foreground">
              {v}
            </text>
          </g>
        ))}
        {[0, 5, 10].map((d) => (
          <circle key={d} cx={x + 19} cy={22 + vals.length * 18 + 4 + d} r={1.3} className="fill-muted" />
        ))}
      </g>
    );
  const diff = KM_KING.map((v, i) => (v - KM_MAN[i]).toFixed(1));
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{KM_CAP[k]}</span>}>
      <svg viewBox="0 0 240 152" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="king আর man দুইটাই তিনশো সংখ্যার list, ঘরে ঘরে বিয়োগ করলে আরও তিনশো সংখ্যা, queen কোথাও দেখা যায় না">
        {col(14, "king", KM_KING.map((v) => v.toFixed(1)), true)}
        {k >= 1 && (
          <text x={64} y={58} textAnchor="middle" fontSize={20} fontWeight={700} className={`${POP} fill-foreground`}>
            −
          </text>
        )}
        {col(78, "man", KM_MAN.map((v) => v.toFixed(1)), k >= 1)}
        {k >= 2 && (
          <text x={128} y={58} textAnchor="middle" fontSize={20} fontWeight={700} className={`${POP} fill-foreground`}>
            =
          </text>
        )}
        {col(142, "বাকি", diff, k >= 2)}
        {k >= 3 && (
          <g className={POP}>
            <rect x={196} y={36} width={38} height={38} rx={8} fill="none" strokeWidth={1.6} strokeDasharray="4 3" className="stroke-muted" />
            <text x={215} y={62} textAnchor="middle" fontSize={20} fontWeight={700} className="fill-muted">
              ?
            </text>
            <text x={215} y={86} textAnchor="middle" fontSize={8.5} className="fill-muted">
              queen?
            </text>
          </g>
        )}
        <text x={120} y={146} textAnchor="middle" fontSize={8.5} className="fill-muted">
          প্রত্যেকটা list-এ ৩০০টা করে ঘর
        </text>
      </svg>
    </Scene>
  );
}

// 12a · The second: the dots slid like a reflection, and Tanvir shot off the
//       paper in one particular direction, so the numbers have a place and a
//       direction. The second face stays covered until 2.2.

const DF_CAP = [
  "ক্লাসের কাগজ, তানভীর সোমের পাশে.",
  "পুরো file উল্টাতে dot-গুলো আয়নায় দেখানো reflection-এর মতো সরে গেল.",
  "শুধু তানভীরের row উল্টো হতেই সে ছিটকে গেল কাগজের বাইরে, একটা নির্দিষ্ট দিকে.",
  "সংখ্যাগুলোর যেন একটা জায়গা আছে, একটা দিক আছে.",
  "Vector-এর সেই দ্বিতীয় রূপ পরের lesson-এ আপনার জন্য অপেক্ষা করছে.",
];
const DF_TANVIR: [number, number] = [63, 61];
const DF_OFF: [number, number] = [-14, 108];

export function DotsFly({}: Story) {
  const s = useScene(4, [600, 2000, 2600, 2400, 2600]);
  const k = s.k;
  const away = k >= 2;
  const [ta, tb] = away ? DF_OFF : DF_TANVIR;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{DF_CAP[k]}</span>}>
      <svg viewBox="0 0 240 130" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="file উল্টাতে dot-গুলো আয়নায় সরে গেল, তানভীরের উল্টো row তাকে কাগজের বাইরে ছিটকে দিলো">
        <MiniSheet flipped={k === 1}>
          {[...MS_DOTS, [60, 56] as [number, number]].map(([a, b], i) => (
            <MirrorDot key={i} a={a} b={b} flip={k === 1} />
          ))}
          {k >= 3 && <Draw d={`M${msx(0)} ${msy(0)}L${msx(ta)} ${msy(tb)}`} className="stroke-[#7c3aed]" strokeWidth={1.4} ms={700} />}
          <MirrorDot a={ta} b={tb} flip={k === 1} fill="fill-[#7c3aed]" ms={k === 2 ? 900 : 700} />
          {k >= 3 && (
            <text x={msx(ta) + 8} y={msy(tb) + 16} fontSize={11} fontWeight={700} fill="#7c3aed" className={POP}>
              ?
            </text>
          )}
          {k >= 2 && (
            <text x={msx(ta) + 8} y={msy(tb) + 4} fontSize={7.5} fill="#0f1b2d" className={FADE}>
              তানভীর
            </text>
          )}
        </MiniSheet>
        {k >= 4 && (
          <g className={POP}>
            <rect x={176} y={20} width={58} height={44} rx={8} className="fill-surface stroke-border" strokeDasharray="4 3" />
            <text x={205} y={38} textAnchor="middle" fontSize={8.5} className="fill-muted">
              রূপ ২
            </text>
            <text x={205} y={57} textAnchor="middle" fontSize={18} fontWeight={700} className="fill-muted">
              ?
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

export const fixtures: Fixtures = {
  TeaStallSom: { mid: { k: 2 } },
  TwoForms: { start: { k: 0 }, two: { k: 2 }, tags: { k: 3 }, loose: { k: 4 } },
  WrestlingRule: { pair: { k: 3 }, fall: { k: 4 } },
  SaminSheet: { one: { k: 1 }, all: { k: 2 }, close: { k: 3 }, partner: { k: 4 } },
  SaminProgram: { ruler: { k: 1 }, ruler2: { k: 2 }, code: { k: 3 } },
  HamzaRow: { start: {}, gone: { pick: 0 }, same: { pick: 1 }, right: { pick: 2 } },
  MirrorFold: { sheet: { k: 0 }, mirror: { k: 1 }, flipped: { k: 2 }, pairs: { k: 3 }, why: { k: 4 } },
  SaminRewrites: { night: { k: 0 }, rewritten: { k: 1 }, morning: { k: 2 } },
  TanvirSlip: { chit: { k: 0 }, typed: { k: 1 }, run: { k: 2 } },
  RuleReader: { rule: { k: 0 }, read: { k: 2 }, slip: { k: 3 }, flipped: { k: 4 } },
  AgeColumn: { sir: { k: 0 }, column: { k: 1 }, gap: { k: 2 } },
  EmptyBox: { boxes: { k: 0 }, gap: { k: 1 }, zero: { k: 3 }, avg: { k: 4 } },
  QuietOnes: { start: { k: 0 }, loud: { k: 1 }, quiet: { k: 2 }, rule: { k: 3 } },
  HundredRows: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 1 }, right: { pick: 2 } },
  PickSlot: { start: {}, wrong: { pick: 0 }, right: { pick: 1 } },
  SaminPrint: { typed: { k: 1 }, think: { k: 2 } },
  KingMinusMan: { king: { k: 0 }, minus: { k: 1 }, rest: { k: 2 }, question: { k: 3 } },
  DotsFly: { sheet: { k: 0 }, mirror: { k: 1 }, off: { k: 2 }, dir: { k: 3 }, face: { k: 4 } },
};
