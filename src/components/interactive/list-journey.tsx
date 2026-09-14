"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  Draw,
  FADE,
  Laptop,
  Nope,
  Out,
  POP,
  Speech,
  Ticks,
  predictLook,
  primaryBtn,
  quietBtn,
  useCountUp,
  usePlay,
  useTween,
} from "@/components/journey/kit";
import { bn } from "./figure-kit";

// Screens for "Math for AI 2.1 — List, সামিনের গড়বড় file", told as a Journey.
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
const NASIB: Kid = { name: "নাসিব", of: "নাসিবের", h: 180, w: 78, age: 18, tone: "fill-cat-blue" };
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
    setSel(i);
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.length === 3) pass("কাগজে যার dot সবচেয়ে কাছে, মাপেও সে-ই সবচেয়ে কাছাকাছি।");
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
    setFlipped(true);
    show.play(2, () =>
      pass(
        i === FLIP_RIGHT
          ? "ঠিক ধরেছেন! পুরো ছবিটা আয়নায় উল্টেছে, কিন্তু কে কার কাছে, সেটা একচুলও বদলায়নি।"
          : "পুরো ছবিটা আয়নায় উল্টেছে, কিন্তু কে কার কাছে, সেটা একচুলও বদলায়নি।",
      ),
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
          <button type="button" onClick={() => setFlipped((f) => !f)} className={quietBtn}>
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
    setFixed(true);
    settle.play(1, () => pass("মাত্র একটা row-এর order উল্টো, আর উত্তরটা চুপচাপ ভুল। Program টু শব্দও করেনি।"));
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
  { id: "avg", label: `গড় বয়স ${AVG} বসান` },
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
    setAge(f === "empty" ? null : f === "zero" ? 0 : AVG);
    setLast(f);
    if (tried.includes(f)) return;
    const next = [...tried, f];
    setTried(next);
    if (next.length === FILLS.length) pass("একই খালি ঘর, অথচ কী বসালেন তার ওপর partner বদলে গেল।");
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

      {last === "empty" && <SaminSays tone="bad">যাক, এবার অন্তত program চিৎকার করলো। কিন্তু ঘরে একটা কিছু তো বসাতেই হবে।</SaminSays>}
      {last === "zero" && (
        <SaminSays tone="bad">0 বছর?! Program তো ভাবছে ফাহিম সদ্য জন্মানো বাচ্চা। তাই ক্লাসের সবচেয়ে ছোট আরিফকে ধরিয়ে দিলো।</SaminSays>
      )}
      {last === "avg" && <SaminSays tone="good">গড় বসালাম, {AVG}। বয়সটা অন্তত ক্লাসের আর দশজনের মতো হলো। আর partner এখন… আমি!</SaminSays>}
      <Task done={tried.length === FILLS.length}>
        ফাহিমের ঘরে তিনটাই বসিয়ে দেখুন: খালি, 0, আর গড় ({bn(tried.length)}/{bn(FILLS.length)})
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
    if (k + 1 === EDITS.length) pass("সবচেয়ে বিপজ্জনক দলটা চিৎকার করে না। চুপ করে থাকে।");
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
          <div key={k} className={`${FADE} mx-auto mt-3 max-w-md -rotate-1 rounded-xl border-2 border-dashed border-cat-amber/60 bg-cat-amber/5 px-4 py-3 text-center`}>
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

function Tuple({ v, bad }: { v: ReactNode[]; bad?: number }) {
  return (
    <span className="font-mono whitespace-nowrap">
      (
      {v.map((x, i) => (
        <span key={i}>
          {i > 0 && ", "}
          <span className={i === bad ? "rounded border border-dashed border-danger/60 px-1 text-danger" : ""}>{x}</span>
        </span>
      ))}
      )
    </span>
  );
}

const WORDS: { word: ReactNode; story: string; body: ReactNode }[] = [
  {
    word: "ordered",
    story: "তানভীরের row",
    body: (
      <>
        <div className="my-2 grid gap-1 text-sm">
          <div>
            <Tuple v={[175, 75]} /> → তানভীর
          </div>
          <div>
            <Tuple v={[75, 175]} /> → কাগজের বাইরের কেউ
          </div>
        </div>
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
        <div className="my-2 grid gap-1 text-sm">
          <div>
            <Tuple v={[170, 60, 17]} /> → সামিন
          </div>
          <div>
            <Tuple v={[165, 54, "?"]} bad={2} /> → ফাহিম
          </div>
        </div>
        সবার ঘর সমান হতে হবে। ঘর কম হলে তুলনাই চলে না। আর খালি ঘরে কী বসাবেন, সেটা একটা decision, যেটা result বদলে দেয়।
      </>
    ),
  },
  {
    word: "fixed মানে",
    story: "সামিনের আয়না",
    body: (
      <>
        <div className="my-2 grid gap-1 font-mono text-sm">
          <div>(height, weight) ✓</div>
          <div>(weight, height) ✓</div>
        </div>
        ঘরের মানে সংখ্যার গায়ে লেখা থাকে না, থাকে একটা rule-এ। Rule-টা কী, তাতে কিছু যায় আসে না। Rule-টা সবাই মানছে কিনা, সেটাই আসল।
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
    if (next.length === FORMS.length) pass("সংখ্যা একই, মানেও একই। শুধু সাজগোজ আলাদা।");
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
        নাসিবের vector তিনভাবেই সাজিয়ে দেখুন ({bn(seen.length)}/{bn(FORMS.length)})
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
const PRINT_Q = ["180, নাসিবের height", "78, নাসিবের weight", "Error দেবে, v[1] বলে কিছু নাই"];
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
      pass("অঙ্কে v₃, code-এ v[2]। একই ঘর, দুই রকম নম্বর।");
    } else if (!wrong.includes(i)) setWrong([...wrong, i]);
  };
  const lastWrong = wrong[wrong.length - 1];

  return (
    <>
      <div className="my-5 flex justify-center">
        <Laptop file="heights.py">
          <Out tone="plain">{">>> v = [180, 78, 18]"}</Out>
          <Out tone="plain">{">>> print(v[1])"}</Out>
          <Out>{"    # নাসিবের height?"}</Out>
          {guess !== null && show.k === 1 && (
            <Out tone="ok">
              <b className={`${POP} inline-block text-base`}>78</b>
            </Out>
          )}
        </Laptop>
      </div>
      {over && <SaminSays tone="bad">নাসিবের height 78?! ক্লাস ওয়ানের বাচ্চাও তো এর চেয়ে লম্বা।</SaminSays>}

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
          <div className="mt-5 text-sm font-medium text-muted">তাহলে code-এ নাসিবের বয়স, 18, বের করতে কী লিখবেন?</div>
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
      pass("f হলো তিনটা সাধারণ সংখ্যার একটা list।");
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
