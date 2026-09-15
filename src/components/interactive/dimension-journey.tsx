"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Speech, Ticks, predictLook, primaryBtn, quietBtn, useCountUp, usePlay, useTween } from "@/components/journey/kit";
import { Arrow, Dot, Label, Plane, makeFrame, minus, same, snap, type XY } from "@/components/journey/plane";
import { bn } from "./figure-kit";

// Screens for "Math for AI 2.5 — চোখে না দেখে geometry".
//
// A ward of fifteen patients, written down as (age, BP). Column by column
// nobody is out of range; plotted together, one 25-year-old with a
// 70-year-old's blood pressure sits far off the cloud — the two strips on
// the axes slide into the plane and the odd one is left alone. Distance is
// Pythagoras, first dragged on paper, then grown a term at a time until Σ
// swallows the lot, then worked out by hand in five dimensions. Two warnings
// and a promise to finish: in very many dimensions distances bunch together
// (a slider watches it happen on seeded random points), a model's knobs are
// one long vector that learning walks downhill, and the notation is read out
// loud, card by card.
//
// Tailwind only; the plane screens sit on journey/plane.

const SUBS = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n: number | string) => String(n).replace(/\d/g, (d) => SUBS[Number(d)]);
/** a computed value, rounded for show, with a real minus sign */
const nice = (x: number) => {
  const r = Math.round(x * 100) / 100;
  return r < 0 ? `−${-r}` : `${r}`;
};

function DoctorSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="ডাক্তার আপা" initial="ডা" tint="teal" {...props} />;
}

// ---------------------------------------------------------------------------
// 1 · The strange patient. Each patient is two dots: one on the age axis, one
//     on the BP axis. "Plot together" slides both into the plane, where they
//     meet at (age, BP) — and one of them lands far from everyone else.

const WARD: [number, number][] = [
  [22, 118],
  [24, 121],
  [28, 122],
  [31, 126],
  [35, 127],
  [38, 131],
  [42, 135],
  [45, 134],
  [50, 140],
  [55, 143],
  [58, 147],
  [63, 150],
  [67, 153],
  [71, 156],
  [25, 150],
];
const ODD = WARD.length - 1;
const CW = 330;
const CH = 280;
const ax = (age: number) => 60 + (age - 15) * (250 / 65);
const by = (bp: number) => 214 - (bp - 110) * (190 / 55);
const AXIS_Y = 246;
const AXIS_X = 24;

export function StrangePatient() {
  const pass = useGate();
  const [plotted, setPlotted] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [miss, setMiss] = useState<{ n: number; i: number } | null>(null);
  const found = picked === ODD;

  const tap = (i: number) => {
    if (!plotted || found) return;
    if (i === ODD) {
      setPicked(i);
      setMiss(null);
      pass("আলাদা করে দেখলে দুইটাই স্বাভাবিক। একসাথে দেখলে উনি সবার থেকে অনেক দূরে।");
    } else setMiss((m) => ({ n: (m?.n ?? 0) + 1, i }));
  };

  const band = `M${ax(19)} ${by(115.2 - 6)}L${ax(74)} ${by(159.2 - 6)}L${ax(74)} ${by(159.2 + 6)}L${ax(19)} ${by(115.2 + 6)}Z`;

  return (
    <>
      <svg viewBox={`0 0 ${CW} ${CH}`} role="group" aria-label={plotted ? "patients plotted by age and blood pressure" : "ages on one axis, blood pressures on the other"} className="mx-auto my-5 block h-auto w-full max-w-sm select-none">
        {plotted && <path d={band} className={`${FADE} fill-cat-teal/15 delay-700`} />}
        {/* the two columns, as two axes */}
        <path d={`M${AXIS_X + 20} ${AXIS_Y}H${CW - 8}`} strokeWidth={1.2} className="stroke-foreground/40" />
        <path d={`M${AXIS_X} ${AXIS_Y - 20}V${10}`} strokeWidth={1.2} className="stroke-foreground/40" />
        {[20, 40, 60, 80].map((a) => (
          <text key={a} x={ax(a)} y={AXIS_Y + 16} textAnchor="middle" fontSize={9} className="fill-muted font-mono">
            {a}
          </text>
        ))}
        {[120, 140, 160].map((b) => (
          <text key={b} x={AXIS_X + 6} y={by(b) + 3} fontSize={9} className="fill-muted font-mono">
            {b}
          </text>
        ))}
        <text x={CW - 8} y={AXIS_Y - 8} textAnchor="end" fontSize={10} fontWeight={600} className="fill-foreground">
          বয়স →
        </text>
        <text x={AXIS_X + 6} y={12} fontSize={10} fontWeight={600} className="fill-foreground">
          ↑ BP
        </text>
        {WARD.map(([age, bp], i) => {
          const done = found && i === ODD;
          const tone = done ? "fill-cat-coral" : miss?.i === i ? "fill-cat-amber" : "fill-cat-blue";
          const move = (x: number, y: number) => ({ transform: `translate(${x}px, ${y}px)`, transitionDelay: `${i * 45}ms` });
          const glide = "transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none";
          return (
            <g
              key={i}
              role={plotted ? "button" : undefined}
              tabIndex={plotted ? 0 : undefined}
              aria-label={plotted ? `রোগী ${bn(i + 1)}` : undefined}
              onClick={() => tap(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  tap(i);
                }
              }}
              className={plotted ? "cursor-pointer outline-none" : undefined}
            >
              <circle r={5} style={move(ax(age), plotted ? by(bp) : AXIS_Y)} className={`${glide} ${tone} opacity-80`} />
              <circle r={5} style={move(plotted ? ax(age) : AXIS_X, by(bp))} className={`${glide} ${tone} opacity-80`} />
              {plotted && <circle cx={ax(age)} cy={by(bp)} r={12} className="fill-transparent" />}
            </g>
          );
        })}
        {found && (
          <g className={POP}>
            <circle cx={ax(25)} cy={by(150)} r={11} strokeWidth={2} className="fill-none stroke-cat-coral" />
            <text x={ax(25) + 14} y={by(150) + 4} fontSize={10} fontWeight={700} className="fill-cat-coral">
              ২৫ বছর, BP ১৫০
            </text>
          </g>
        )}
      </svg>
      {!plotted ? (
        <>
          <div className="text-center text-[0.95rem] text-muted">
            বয়সের column: ২২ থেকে ৭১। BP-র column: ১১৮ থেকে ১৫৬। Column ধরে দেখলে কেউই সীমার বাইরে না।
          </div>
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={() => setPlotted(true)} className={primaryBtn}>
              দুইটা column একসাথে plot করুন
            </button>
          </div>
        </>
      ) : (
        !found && <div className="text-center text-[0.95rem] text-muted">এবার কাউকে অদ্ভুত লাগছে? তার ওপর tap করুন।</div>
      )}
      {miss && !found && (
        <Nope key={miss.n}>
          {bn(WARD[miss.i][0])} বছর, BP {bn(WARD[miss.i][1])}: উনি তো বাকিদের মেঘের ভেতরেই।
        </Nope>
      )}
      {found && <DoctorSays tone="good">এই তো! বয়স ২৫, অথচ BP ৭০ বছরের মানুষের মতো। ওনাকে আজই আবার দেখতে হবে।</DoctorSays>}
      <Ticks
        items={[
          ["একসাথে plot করুন", plotted],
          ["অদ্ভুত রোগীকে খুঁজুন", found],
        ]}
      />
      <Task done={found}>দুইটা column একসাথে plot করে অদ্ভুত রোগীটাকে খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Pythagoras on paper. Drag one point; the two legs and the sum follow.

const FP = makeFrame(0, 8, 0, 6, 34);
const P0: XY = [1, 1];

export function Pythagoras() {
  const pass = useGate();
  const [q, setQ] = useState<XY>([6, 2]);
  const [hit, setHit] = useState(false);
  const d = minus(q, P0);
  const s = d[0] ** 2 + d[1] ** 2;
  const len = Math.sqrt(s);

  const put = (p: XY) => {
    const t = snap(p, FP);
    if (same(t, P0)) return;
    setQ(t);
    const dd = minus(t, P0);
    if (!hit && dd[0] !== 0 && dd[1] !== 0 && dd[0] ** 2 + dd[1] ** 2 === 25) {
      setHit(true);
      pass("3 আর 4। বর্গ করে 9 আর 16, যোগ করে 25, বর্গমূল 5।");
    }
  };

  const corner: XY = [q[0], P0[1]];

  return (
    <>
      <Plane f={FP} ticks={1} label={`two points, ${Math.abs(d[0])} across and ${Math.abs(d[1])} up from each other; drag the second`} drag={{ down: put, move: put }}>
        <path
          d={`M${FP.sx(P0[0])} ${FP.sy(P0[1])}H${FP.sx(corner[0])}`}
          strokeWidth={2.5}
          strokeDasharray="5 4"
          className="pointer-events-none fill-none stroke-cat-blue"
        />
        <path d={`M${FP.sx(corner[0])} ${FP.sy(corner[1])}V${FP.sy(q[1])}`} strokeWidth={2.5} strokeDasharray="5 4" className="pointer-events-none fill-none stroke-cat-coral" />
        <path d={`M${FP.sx(P0[0])} ${FP.sy(P0[1])}L${FP.sx(q[0])} ${FP.sy(q[1])}`} strokeWidth={3} className="pointer-events-none fill-none stroke-[#0f1b2d]" />
        {d[0] !== 0 && (
          <Label f={FP} at={[(P0[0] + corner[0]) / 2, P0[1]]} dy={16} className="fill-cat-blue">
            {nice(Math.abs(d[0]))}
          </Label>
        )}
        {d[1] !== 0 && (
          <Label f={FP} at={[corner[0], (corner[1] + q[1]) / 2]} dx={d[0] >= 0 ? 12 : -12} anchor={d[0] >= 0 ? "start" : "end"} className="fill-cat-coral">
            {nice(Math.abs(d[1]))}
          </Label>
        )}
        <Dot f={FP} at={P0} r={5} className="fill-[#0f1b2d]" />
        <circle cx={FP.sx(q[0])} cy={FP.sy(q[1])} r={9} strokeWidth={2} className="fill-cat-violet/20 stroke-cat-violet" />
        <Dot f={FP} at={q} r={4} className="fill-cat-violet" />
      </Plane>
      <div className="mx-auto max-w-md rounded-2xl border border-border px-4 py-3 text-center font-mono text-lg">
        d = √(<span className="text-cat-blue">{nice(Math.abs(d[0]))}²</span> + <span className="text-cat-coral">{nice(Math.abs(d[1]))}²</span>) = √(
        {nice(d[0] ** 2)} + {nice(d[1] ** 2)}) = √{s} ={" "}
        <b key={s} className={`${POP} inline-block ${Number.isInteger(len) ? "text-accent-text" : ""}`}>
          {Number.isInteger(len) ? len : `≈ ${len.toFixed(2)}`}
        </b>
      </div>
      <Task done={hit}>বেগুনি point-টা টেনে এমন জায়গায় নিন যেন দূরত্ব ঠিক 5 হয়। তবে সোজা ডানে বা সোজা ওপরে না, কোণাকুনি।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The formula grows a term per box, and then Σ folds it away.

const TERM_TONES = ["text-cat-blue", "text-cat-coral", "text-cat-teal", "text-cat-violet", "text-cat-amber"];
const GROW_NOTE = [
  "",
  "",
  "২টা ঘর: কাগজে আঁকা যায়।",
  "৩টা ঘর: আপনার রুমের ভেতরের মতো একটা জায়গা। এখনো কল্পনা করা যায়।",
  "৪টা ঘর: ছবি শেষ। অথচ formula দিব্যি চলছে।",
  "৫টা ঘর: সেই একই নিয়ম, একটা term বেশি।",
];

function Term({ i }: { i: number }) {
  return (
    <span className={`${POP} inline-block font-semibold whitespace-nowrap ${TERM_TONES[i - 1]}`}>
      (a{sub(i)} − b{sub(i)})²
    </span>
  );
}

export function GrowFormula() {
  const pass = useGate();
  const [n, setN] = useState(2);
  const [sigma, setSigma] = useState(false);

  return (
    <>
      <div className="my-6 flex min-h-28 items-center justify-center overflow-x-auto px-1 font-serif text-lg sm:text-xl">
        {sigma ? (
          <div key="sigma" className={`${FADE} flex items-center gap-2 whitespace-nowrap`}>
            <i>d</i> =<span className="text-3xl">√</span>
            <span className="flex items-center gap-2 border-t-2 border-foreground pt-1">
              <span className="flex flex-col items-center leading-none">
                <span className="text-xs">
                  <i>n</i>
                </span>
                <span className="text-4xl">Σ</span>
                <span className="text-xs">
                  <i>i</i>=1
                </span>
              </span>
              <span className="font-semibold text-cat-violet">
                (a<sub className="italic">i</sub> − b<sub className="italic">i</sub>)²
              </span>
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2">
            <i>d</i> =<span className="text-3xl">√</span>
            <span className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 border-t-2 border-foreground pt-1">
              {Array.from({ length: n }, (_, k) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  {k > 0 && <span className="text-muted">+</span>}
                  <Term i={k + 1} />
                </span>
              ))}
            </span>
          </div>
        )}
      </div>
      <div className="min-h-8 text-center text-[0.95rem] text-muted">
        {sigma ? (
          <span className={FADE}>Σ মানে শুধু “যোগ করো”: i-কে 1 থেকে n পর্যন্ত নিয়ে যাও, প্রত্যেক ঘরের term যোগ করতে থাকো।</span>
        ) : (
          <span key={n} className={FADE}>
            {GROW_NOTE[n]}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {!sigma && (
          <button type="button" onClick={() => setN(n + 1)} disabled={n >= 5} className={quietBtn}>
            + আরেকটা ঘর
          </button>
        )}
        {n >= 5 && !sigma && (
          <button
            type="button"
            onClick={() => {
              setSigma(true);
              pass("এক লাইন, যেকোনো n-এর জন্য। 2 হোক বা 36,000,000।");
            }}
            className={`${primaryBtn} ${FADE}`}
          >
            Σ দিয়ে গুটিয়ে ফেলুন
          </button>
        )}
      </div>
      <Ticks
        items={[
          ["৫টা ঘর পর্যন্ত বাড়ান", n >= 5],
          ["Σ দিয়ে গুটান", sigma],
        ]}
      />
      <Task done={sigma}>ঘর বাড়াতে থাকুন, দেখুন formula-র কী হয়। পাঁচে পৌঁছালে পুরোটা এক চিহ্নে গুটিয়ে ফেলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Five dimensions by hand. Guess, then step the Σ machine through p − q
//     one box at a time; p − r then runs by itself.

const P5 = [45, 130, 90, 5.2, 27];
const Q5 = [47, 128, 88, 5.4, 26];
const R5 = [72, 165, 95, 9.1, 34];
const COL5 = ["বয়স", "sys BP", "dia BP", "glucose", "BMI"];
const WHO = ["q-এর সাথে", "r-এর সাথে", "দুইজনের সাথেই সমান"];
const WHO_RIGHT = 0;

function SumRows({ label, a, b, k, tone }: { label: string; a: number[]; b: number[]; k: number; tone: string }) {
  const diff = a.map((x, i) => x - b[i]);
  const sq = diff.map((x) => x * x);
  const run = sq.slice(0, k).reduce((s, x) => s + x, 0);
  const cell = (on: boolean, v: string, key: string) => (
    <td key={key} className="px-1.5 text-center">
      {on ? (
        <span key={key} className={`${POP} inline-block`}>
          {v}
        </span>
      ) : (
        <span className="text-muted/40">·</span>
      )}
    </td>
  );
  return (
    <>
      <tr className={tone}>
        <td className="pr-2 text-right font-sans text-sm font-semibold whitespace-nowrap">{label} তফাত</td>
        {diff.map((x, i) => cell(i < k, nice(x), `d${i}${i < k}`))}
        <td />
      </tr>
      <tr>
        <td className="pr-2 text-right font-sans text-sm text-muted">বর্গ</td>
        {sq.map((x, i) => cell(i < k, nice(x), `s${i}${i < k}`))}
        <td className="pl-2 text-left font-semibold whitespace-nowrap">
          Σ = <span key={run} className={`${POP} inline-block`}>{nice(run)}</span>
        </td>
      </tr>
      <tr>
        <td />
        <td colSpan={5} className="pb-2 text-center">
          {k === 5 && (
            <span className={`${FADE} font-semibold ${tone}`}>
              দূরত্ব = √{nice(run)} ≈ {Math.sqrt(run).toFixed(1)}
            </span>
          )}
        </td>
        <td />
      </tr>
    </>
  );
}

export function WardFive() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const [kq, setKq] = useState(0);
  const auto = usePlay(450);
  const kr = auto.k;
  const done = kr === 5;
  const over = done && guess !== null;

  const step = () => {
    if (guess === null || kq >= 5) return;
    const k = kq + 1;
    setKq(k);
    if (k === 5) auto.play(5, () => pass("3.6 বনাম 45.2। পাঁচ dimension-এ geometry, কিছু না দেখেই।"));
  };

  return (
    <>
      <div className="mt-5 overflow-x-auto pb-1">
        <table className="mx-auto font-mono text-sm tabular-nums">
          <thead>
            <tr className="text-xs text-muted">
              <th />
              {COL5.map((c, i) => (
                <th key={c} className={`px-1.5 font-sans font-normal ${guess !== null && kq === i ? "text-cat-violet" : ""}`}>
                  i={i + 1}
                  <br />
                  {c}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {[
              ["p", P5, "font-bold"],
              ["q", Q5, "text-cat-blue"],
              ["r", R5, "text-cat-coral"],
            ].map(([name, v, tone]) => (
              <tr key={name as string} className={tone as string}>
                <td className="pr-2 text-right font-semibold">{name as string}</td>
                {(v as number[]).map((x, i) => (
                  <td key={i} className="px-1.5 text-center">
                    {x}
                  </td>
                ))}
                <td />
              </tr>
            ))}
            <tr>
              <td colSpan={7} className="py-1">
                <div className="border-t border-border" />
              </td>
            </tr>
            {guess !== null && <SumRows label="p − q" a={P5} b={Q5} k={kq} tone="text-cat-blue" />}
            {kq === 5 && <SumRows label="p − r" a={P5} b={R5} k={kr} tone="text-cat-coral" />}
          </tbody>
        </table>
      </div>
      {guess !== null && kq < 5 && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={step} className={primaryBtn}>
            Σ মেশিন: পরের ঘর, i = {kq + 1}
          </button>
        </div>
      )}
      {kq === 5 && !done && <div className="mt-2 text-center text-sm text-muted">p − r এবার মেশিন নিজেই করছে…</div>}
      {guess === null ? (
        <>
          <div className="mt-5 text-sm font-medium text-muted">p কার সাথে বেশি মেলে?</div>
          <div className="mt-2 grid gap-2">
            {WHO.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, over, WHO_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </>
      ) : (
        over && (
          <div className="mt-4 grid gap-2">
            {WHO.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, over, WHO_RIGHT)} disabled onClick={() => {}}>
                {o}
              </Choice>
            ))}
          </div>
        )
      )}
      <Ticks
        items={[
          ["আগে guess", guess !== null],
          ["p − q নিজের হাতে", kq === 5],
          ["p − r", done],
        ]}
      />
      <Task done={over}>আগে guess করুন। তারপর Σ মেশিনটা এক ঘর এক ঘর করে চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The curse of dimensionality. Random points in the unit cube; from one of
//     them, the distance to every other, laid along a line scaled to the
//     farthest. As n grows the dots crowd to the far end.

const NS = [2, 3, 10, 30, 100, 300, 1000];
const COUNT = 150;

/** mulberry32: the same "random" points on every visit */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const spreadCache = new Map<number, number[]>();
/** distances from the first random point to the other COUNT − 1, in n dimensions */
function spread(n: number) {
  const hit = spreadCache.get(n);
  if (hit) return hit;
  const r = rng(1234 + n);
  const pts = Array.from({ length: COUNT }, () => Array.from({ length: n }, r));
  const q = pts[0];
  const ds = pts.slice(1).map((p) => Math.sqrt(p.reduce((s, x, i) => s + (x - q[i]) ** 2, 0)));
  spreadCache.set(n, ds);
  return ds;
}

const SW = 320;
const SX0 = 16;
const SX1 = 304;

export function Curse() {
  const pass = useGate();
  const [ni, setNi] = useState(0);
  const [reached, setReached] = useState(false);
  const n = NS[ni];
  const ds = useMemo(() => spread(n), [n]);
  const max = Math.max(...ds);
  const min = Math.min(...ds);
  const ratio = min / max;

  const pick = (i: number) => {
    setNi(i);
    if (!reached && NS[i] >= 300) {
      setReached(true);
      pass("সবচেয়ে কাছেরটা আর সবচেয়ে দূরেরটা প্রায় সমান দূরে। “সবচেয়ে কাছে” কথাটার আর তেমন জোর নাই।");
    }
  };

  return (
    <>
      <svg viewBox={`0 0 ${SW} 96`} role="img" aria-label={`distances in ${n} dimensions, nearest ${Math.round(ratio * 100)} percent of farthest`} className="mx-auto my-5 block h-auto w-full max-w-md select-none">
        <path d={`M${SX0} 50H${SX1}`} strokeWidth={1.5} className="stroke-foreground/30" />
        <text x={SX0} y={80} fontSize={9} className="fill-muted">
          0
        </text>
        <text x={SX1} y={80} textAnchor="end" fontSize={9} className="fill-muted">
          সবচেয়ে দূরেরটা
        </text>
        <rect
          x={SX0 + ratio * (SX1 - SX0)}
          y={34}
          width={(1 - ratio) * (SX1 - SX0)}
          height={32}
          rx={6}
          className="fill-cat-amber/15 transition-[x,width] duration-700 motion-reduce:transition-none"
        />
        {ds.map((d, i) => (
          <circle
            key={i}
            r={3.2}
            cy={0}
            cx={0}
            style={{ transform: `translate(${SX0 + (d / max) * (SX1 - SX0)}px, ${50 + ((i % 7) - 3) * 3.4}px)` }}
            className="fill-cat-blue/70 transition-transform duration-700 ease-out motion-reduce:transition-none"
          />
        ))}
        <text x={SX0 + ratio * (SX1 - SX0)} y={24} textAnchor="middle" fontSize={9} fontWeight={600} className="fill-cat-amber transition-[x] duration-700">
          সবচেয়ে কাছেরটা
        </text>
      </svg>
      <div className="text-center">
        <div className="font-mono text-2xl font-bold">
          n = <span key={n} className={`${POP} inline-block`}>{n}</span>
        </div>
        <div className="mt-1 text-[0.95rem]">
          সবচেয়ে কাছেরটা, সবচেয়ে দূরেরটার{" "}
          <b className="font-mono">{Math.round(ratio * 100)}%</b> দূরে
        </div>
      </div>
      <label className="mx-auto mt-4 flex max-w-sm items-center gap-3">
        <span className="shrink-0 text-sm text-muted">dimension</span>
        <input
          type="range"
          min={0}
          max={NS.length - 1}
          value={ni}
          aria-label="dimension"
          onChange={(e) => pick(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
        />
      </label>
      <Task done={reached}>Slider টেনে dimension বাড়ান, অন্তত 300 পর্যন্ত। দাগের ওপর dot-গুলোর কী হয়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Two knobs, one vector. The error is a bowl; each press takes a step
//     along the negative gradient, drawn as the arrow it is.

const FK = makeFrame(-4, 8, -1, 5, 27, 18);
const MIN: XY = [3, 2];
const RATE = 0.3;
const loss = ([a, b]: XY) => (a - MIN[0]) ** 2 / 2 + (b - MIN[1]) ** 2;
/** one step downhill: w − rate × gradient */
const stepOf = ([a, b]: XY): XY => [a - RATE * (a - MIN[0]), b - RATE * 2 * (b - MIN[1])];
const START: XY = [-3, 4.2];
const GOOD = 0.5;

export function KnobStep() {
  const pass = useGate();
  const [path, setPath] = useState<XY[]>([START]);
  const w = path[path.length - 1];
  const [tx, ty] = useTween(w, 500);
  const here: XY = [tx, ty];
  const next = stepOf(w);
  const L = loss(w);
  const low = L < GOOD;

  const go = () => {
    if (low) return;
    const n = stepOf(w);
    setPath([...path, n]);
    if (loss(n) < GOOD) pass("প্রতি পা-এ দুইটা knob একসাথে ঘুরলো। পুরোটা একটা arrow ধরে হাঁটা।");
  };

  return (
    <>
      <Plane f={FK} ticks={2} label={`two knobs at (${w[0].toFixed(1)}, ${w[1].toFixed(1)}); error ${L.toFixed(2)}`} className="max-w-[24rem]">
        {[8, 4.5, 2, 0.5].map((c, i) => (
          <ellipse
            key={c}
            cx={FK.sx(MIN[0])}
            cy={FK.sy(MIN[1])}
            rx={Math.sqrt(2 * c) * FK.u}
            ry={Math.sqrt(c) * FK.u}
            strokeWidth={1}
            className={`pointer-events-none ${i === 3 ? "fill-cat-teal/20 stroke-cat-teal" : "fill-none stroke-cat-blue/35"}`}
          />
        ))}
        <Label f={FK} at={MIN} dy={4} size={8.5} className="fill-cat-teal">
          ভুল সবচেয়ে কম
        </Label>
        {path.slice(0, -1).map((p, i) => (
          <Dot key={i} f={FK} at={p} r={2.5} className="fill-cat-violet/50" />
        ))}
        {!low && <Arrow f={FK} from={w} to={next} tone="coral" w={2.6} />}
        <circle cx={FK.sx(here[0])} cy={FK.sy(here[1])} r={6} className="fill-cat-violet" />
        <Label f={FK} at={[FK.x1, 0]} dx={-4} dy={-6} anchor="end" size={9}>
          knob ১ →
        </Label>
        <Label f={FK} at={[0, FK.y1]} dx={5} dy={10} anchor="start" size={9}>
          ↑ knob ২
        </Label>
      </Plane>
      <div className="mx-auto grid max-w-sm gap-1 rounded-2xl border border-border px-4 py-3 text-center">
        <div className="font-mono">
          knob-গুলো = ({w[0].toFixed(1)}, {w[1].toFixed(1)})
        </div>
        <div>
          ভুল:{" "}
          <b key={L.toFixed(2)} className={`${POP} inline-block font-mono ${low ? "text-accent-text" : ""}`}>
            {L.toFixed(2)}
          </b>
        </div>
        {!low && <div className="text-xs text-cat-coral">লাল arrow: −gradient, মানে পরের পা কোন দিকে</div>}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <button type="button" onClick={go} disabled={low} className={primaryBtn}>
          এক পা হাঁটুন ({bn(path.length - 1)})
        </button>
        <button type="button" onClick={() => setPath([START])} disabled={path.length === 1} className={`${quietBtn} px-3`}>
          ↺
        </button>
      </div>
      <Task done={low}>
        −gradient ধরে পা ফেলতে থাকুন, যতক্ষণ না ভুল {nice(GOOD)}-এর নিচে নামে।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Say it out loud. Each card: a line of notation; tapped, its reading.

const CARDS: { see: ReactNode; say: string }[] = [
  { see: <>v ∈ ℝ⁴</>, say: "“v হলো চারটা সাধারণ সংখ্যার একটা list”" },
  { see: <>v₂</>, say: "“v-এর দ্বিতীয় component”" },
  { see: <>x ∈ ℝ⁷⁸⁴</>, say: "“x হলো 784টা সংখ্যার list”, মানে একটা 28 × 28 ছবি" },
  {
    see: (
      <>
        <b className="font-black">0</b> ∈ ℝ³
      </>
    ),
    say: "“তিন dimension-এর zero vector: (0, 0, 0)”",
  },
  { see: <>λ ∈ ℝ</>, say: "“lambda একটা সাধারণ সংখ্যা”, মানে একটা scalar" },
  { see: <>u, v ∈ ℝⁿ</>, say: "“u আর v দুইটাই nটা সংখ্যার list”, তাই ওদের তুলনা করা যায়" },
  { see: <>‖v‖</>, say: "“v-এর length”। কীভাবে মাপে, সামনের lesson-এ" },
];

export function SayItCards() {
  const pass = useGate();
  const [open, setOpen] = useState<number[]>([]);

  const flip = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === CARDS.length) pass("সাতটা চিহ্ন, সাতটা বাক্য। Paper পড়া এখন আর অতটা ভয়ের না।");
  };

  return (
    <>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {CARDS.map((c, i) => {
          const on = open.includes(i);
          return (
            <button
              key={i}
              type="button"
              aria-expanded={on}
              onClick={() => flip(i)}
              className={`flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-3 py-2.5 text-center transition-colors ${
                on ? "cursor-default border-cat-violet/40 bg-cat-violet/5" : "border-border hover:border-cat-violet/60"
              }`}
            >
              <span className="font-serif text-2xl">{c.see}</span>
              {on ? (
                <span className={`${FADE} mt-1 text-[0.92rem] leading-snug`}>{c.say}</span>
              ) : (
                <span className="mt-1 text-xs text-muted">মুখে বলুন, তারপর tap</span>
              )}
            </button>
          );
        })}
      </div>
      <Task done={open.length === CARDS.length}>
        সাতটা কার্ডই উল্টে মিলিয়ে নিন ({bn(open.length)}/{bn(CARDS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The last picture: one line of formula, and n running from 2 to a photo.

const DIMS = ["2", "3", "5", "40", "300", "784", "36,000,000"];

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const k = useCountUp(DIMS.length + 1, 800);
  const i = Math.min(Math.max(k - 1, 0), DIMS.length - 1);
  const last = k > DIMS.length;

  return (
    <>
      <div className="my-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 font-serif text-xl whitespace-nowrap">
          <i>d</i> =<span className="text-3xl">√</span>
          <span className="flex items-center gap-2 border-t-2 border-foreground pt-1">
            <span className="flex flex-col items-center leading-none">
              <span key={i} className={`${POP} inline-block font-mono text-xs font-bold text-cat-violet`}>
                {DIMS[i]}
              </span>
              <span className="text-4xl">Σ</span>
              <span className="text-xs">
                <i>i</i>=1
              </span>
            </span>
            <span className="font-semibold">
              (a<sub className="italic">i</sub> − b<sub className="italic">i</sub>)²
            </span>
          </span>
        </div>
        <div className="font-mono text-3xl font-bold tabular-nums">
          n = <span key={i} className={`${POP} inline-block text-cat-violet`}>{DIMS[i]}</span>
        </div>
      </div>
      <div className="min-h-24 text-center">
        {last && (
          <div className={FADE}>
            <div className="text-xl font-bold">ছবি আঁকুন 2D-তে, হিসাব করুন n-D-তে</div>
            <div className="text-muted">কয়টা ঘর, formula সেটা টেরই পায় না</div>
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
