"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  Draw,
  FADE,
  Nope,
  POP,
  Speech,
  Stepper,
  Ticks,
  type Fixtures,
  pill,
  predictLook,
  primaryBtn,
  quietBtn,
  useCountUp,
  usePlay,
  useSeed,
  useTween,
} from "@/components/journey/kit";
import { Arrow, Dot, Label, Plane, clamp, dist, makeFrame, minus, plus, same, sg, snap, type Frame, type XY } from "@/components/journey/plane";
import { Shiku, Trail, route, useWalk } from "./arrow-journey";
import { bn } from "./figure-kit";

// Screens for "Math for AI 2.5 — চোখে না দেখে geometry".
//
// A ward of fifteen patients, written down as (age, BP). First the two
// columns lie flat as two number lines, where nobody stands out and pairs
// have to be matched one by one. Then, graph-paper style, the BP line stands
// up, the reader plots one patient by hand, the rest follow, and a
// 25-year-old with a 70-year-old's blood pressure is left alone.
//
// Distance is built from nothing: Shiku walks along the grid while a tailor's
// tape goes straight; tiles from the squares on the two short sides pour into
// the square on the slanted one; four triangles slide around a frame to show
// it always works; and only then does it get Pythagoras's name, checked
// against the tape anywhere on the sheet. A mosquito in a verandah shows why a
// new direction is just one more squared term, the terms grow until nobody
// can write them, and Σ is learnt on a bazaar list before it swallows the
// formula. Back in the ward, three patients are compared on paper, then by
// hand in five dimensions.
//
// 2.6 and 2.8 share this file, paced for a reader of twelve. 2.6: the long sum
// that nobody wants to write, roll numbers for x₁…x₄, Amma's questions for the
// Σ machine, the ward fed column by column, and a challenge no new column can
// win. 2.8: one radio knob before two, where vectors hide, and the notation
// read out loud. The high-dimension surprises (2.7) live in surprise-journey.tsx.
//
// Tailwind only; the plane screens sit on journey/plane. Ink on the white
// sheet is fixed, since the sheet stays white in both themes.

const SUBS = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n: number | string) => String(n).replace(/\d/g, (d) => SUBS[Number(d)]);
/** a computed value, rounded for show, with a real minus sign */
const nice = (x: number) => {
  const r = Math.round(x * 100) / 100;
  return r < 0 ? `−${-r}` : `${r}`;
};
const O: XY = [0, 0];
const INK = "fill-[#0f1b2d]";

/** Enter or Space on something that is not a real button. */
const press = (f: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    f();
  }
};

function DoctorSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="ডাক্তার আপা" initial="ডা" tint="teal" {...props} />;
}

// ---------------------------------------------------------------------------
// The ward. Both number lines start at OX; the age line lies at OY, which
// becomes the x-axis once the BP line stands up beside it.

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
/** (50, 140): the patient the reader puts on paper by hand */
const MINE = 8;
const CW = 320;
const OX = 48;
const OY = 250;
const LINE_END = 312;
const KA = 4; // px per year
const KB = 4.2; // px per mmHg
const ax = (age: number) => OX + (age - 15) * KA;
/** how far along the BP line, from its start */
const bl = (bp: number) => (bp - 110) * KB;
const by = (bp: number) => OY - bl(bp);
const LV = 9;
const DOT_R = 4.5;
const AGE_TICKS = [20, 30, 40, 50, 60, 70, 80];
const BP_TICKS = [120, 130, 140, 150, 160];

/** Dots that would sit on top of each other stack up, as on a dot plot. */
function stack(xs: number[]) {
  const lv = xs.map(() => 0);
  const placed: [number, number][] = [];
  xs.map((x, i) => [x, i] as const)
    .sort((p, q) => p[0] - q[0])
    .forEach(([x, i]) => {
      let l = 0;
      while (placed.some(([px, pl]) => pl === l && Math.abs(px - x) < LV)) l++;
      lv[i] = l;
      placed.push([x, l]);
    });
  return lv;
}
const AGE_LV = stack(WARD.map(([a]) => ax(a)));
const BP_LV = stack(WARD.map(([, b]) => bl(b)));

function FlatLine({ y, name, ticks, at, end }: { y: number; name: string; ticks: number[]; at: (v: number) => number; end: number }) {
  return (
    <>
      <path d={`M${OX} ${y}H${end}`} strokeWidth={1.2} className="stroke-foreground/40" />
      {ticks.map((t, k) => (
        <g key={t}>
          <path d={`M${at(t)} ${y - 3}V${y + 3}`} strokeWidth={1} className="stroke-foreground/40" />
          {k % 2 === 0 && (
            <text x={at(t)} y={y + 15} textAnchor="middle" fontSize={9} className="fill-muted font-mono">
              {t}
            </text>
          )}
        </g>
      ))}
      <text x={OX - 10} y={y + 4} textAnchor="end" fontSize={11} fontWeight={600} className="fill-foreground">
        {name}
      </text>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1 · Two columns, two flat lines. Each patient is a dot on each line; tapping
//     either lights up its partner. Nobody is out of range on either line.

const TL_BP = 70;
const TL_AGE = 160;
const PAIRS = 3;

export function TwoLines() {
  const pass = useGate();
  const [sel, setSel] = useState<number | null>(null);
  const [seen, setSeen] = useState<number[]>([]);
  const ageY = (i: number) => TL_AGE - 5 - AGE_LV[i] * LV;
  const bpY = (i: number) => TL_BP - 5 - BP_LV[i] * LV;

  const tap = (i: number) => {
    setSel(i);
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.length === PAIRS) pass("প্রত্যেক রোগী দুই দাগে দুইটা dot। জোড়া মেলাতে হচ্ছে একজন একজন করে।");
  };

  return (
    <>
      <svg viewBox={`0 0 ${CW} 186`} role="group" aria-label="fifteen patients: ages on one line, blood pressures on another" className="mx-auto my-5 block h-auto w-full max-w-sm select-none">
        <FlatLine y={TL_BP} name="BP" ticks={BP_TICKS} at={(b) => OX + bl(b)} end={OX + bl(165)} />
        <FlatLine y={TL_AGE} name="বয়স" ticks={AGE_TICKS} at={ax} end={LINE_END} />
        {sel !== null && (
          <path
            key={`pair${sel}`}
            d={`M${ax(WARD[sel][0])} ${ageY(sel)}L${OX + bl(WARD[sel][1])} ${bpY(sel)}`}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            className={`${FADE} pointer-events-none stroke-cat-coral`}
          />
        )}
        {WARD.map(([age, bp], i) => {
          const on = sel === i;
          const tone = on ? "fill-cat-coral" : seen.includes(i) ? "fill-cat-blue/40" : "fill-cat-blue";
          return (
            <g key={i} role="button" tabIndex={0} aria-label={`রোগী ${bn(i + 1)}`} aria-pressed={on} onClick={() => tap(i)} onKeyDown={press(() => tap(i))} className="cursor-pointer outline-none">
              <circle cx={ax(age)} cy={ageY(i)} r={9} className="fill-transparent" />
              <circle cx={OX + bl(bp)} cy={bpY(i)} r={9} className="fill-transparent" />
              <circle cx={ax(age)} cy={ageY(i)} r={DOT_R} className={`${tone} transition-colors`} />
              <circle cx={OX + bl(bp)} cy={bpY(i)} r={DOT_R} className={`${tone} transition-colors`} />
            </g>
          );
        })}
        {sel !== null && (
          <g key={`values${sel}`} className={`${FADE} pointer-events-none`}>
            <text x={ax(WARD[sel][0])} y={ageY(sel) - 9} textAnchor="middle" fontSize={10} fontWeight={700} className="fill-cat-coral font-mono">
              {WARD[sel][0]}
            </text>
            <text x={OX + bl(WARD[sel][1])} y={bpY(sel) - 9} textAnchor="middle" fontSize={10} fontWeight={700} className="fill-cat-coral font-mono">
              {WARD[sel][1]}
            </text>
          </g>
        )}
      </svg>
      {sel === null ? (
        <div className="text-center text-[0.95rem] text-muted">যেকোনো একটা dot tap করুন, অন্য দাগে তার জোড়াটা জ্বলে উঠবে।</div>
      ) : (
        <DoctorSays key={sel}>
          রোগী {bn(sel + 1)}: বয়স {bn(WARD[sel][0])}, BP {bn(WARD[sel][1])}।{sel === ODD ? " হুম, এই জোড়াটা একটু খটকা লাগছে না?" : ""}
        </DoctorSays>
      )}
      <Task done={seen.length >= PAIRS}>
        অন্তত তিনজন রোগীর জোড়া মিলিয়ে দেখুন ({bn(Math.min(seen.length, PAIRS))}/{bn(PAIRS)})। কোনো দাগে কেউ কি দলছুট?
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Graph paper. The BP line stands up and becomes the y-axis; the reader
//     puts one patient on the sheet by hand, then the rest glide in — and one
//     of them lands far from everyone else.

type Stage = "flat" | "up" | "mine" | "all";
/** the BP line while it still lies flat */
const YF = 160;
const PH = 284;
const snap5 = (v: number) => Math.round(v / 5) * 5;
const PAPER_GRID =
  AGE_TICKS.map((t) => `M${ax(t)} ${by(165)}V${OY}`).join("") + BP_TICKS.map((b) => `M${OX} ${by(b)}H${LINE_END}`).join("");
const GLIDE = "transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none";
const KEY5: Record<string, [number, number]> = { ArrowRight: [5, 0], ArrowLeft: [-5, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] };

export function PlotTogether() {
  const pass = useGate();
  const [stage, setStage] = useState<Stage>("flat");
  const [miss, setMiss] = useState<{ n: number; age: number; bp: number } | null>(null);
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [picked, setPicked] = useState<{ n: number; i: number } | null>(null);
  const [found, setFound] = useState(false);
  const up = stage !== "flat";
  const onPaper = (i: number) => stage === "all" || (stage === "mine" && i === MINE);
  const [mAge, mBp] = WARD[MINE];

  const tryPlace = (age: number, bp: number) => {
    if (stage !== "up" || age < 15 || age > 80 || bp < 110 || bp > 165) return;
    if (age === mAge && bp === mBp) {
      setStage("mine");
      setMiss(null);
      setCursor(null);
    } else setMiss((m) => ({ n: (m?.n ?? 0) + 1, age, bp }));
  };
  const put = (e: PointerEvent<SVGSVGElement>) => {
    if (stage !== "up") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * CW;
    const y = ((e.clientY - r.top) / r.height) * PH;
    tryPlace(snap5(15 + (x - OX) / KA), snap5(110 + (OY - y) / KB));
  };
  // Without a pointer: arrows move a cross on the sheet, Enter puts the patient there.
  const keys = (e: KeyboardEvent<SVGSVGElement>) => {
    if (stage !== "up") return;
    const c = cursor ?? [30, 120];
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (cursor) tryPlace(...cursor);
      return;
    }
    const d = KEY5[e.key];
    if (!d) return;
    e.preventDefault();
    setCursor([clamp(c[0] + d[0], 15, 80), clamp(c[1] + d[1], 110, 165)]);
  };

  const tap = (i: number) => {
    if (stage !== "all" || found) return;
    if (i === ODD) {
      setFound(true);
      setPicked(null);
      pass("আলাদা করে দেখলে দুইটাই স্বাভাবিক। একসাথে দেখলে উনি সবার থেকে অনেক দূরে।");
    } else setPicked((m) => ({ n: (m?.n ?? 0) + 1, i }));
  };

  const tone = (i: number) =>
    found && i === ODD
      ? "fill-cat-coral"
      : picked?.i === i
        ? "fill-cat-amber"
        : i === MINE && (stage === "up" || stage === "mine")
          ? "fill-cat-violet"
          : "fill-cat-blue";
  const delay = (i: number) => `${stage === "all" ? i * 45 : 0}ms`;
  const band = `M${ax(19)} ${by(115.2 - 6)}L${ax(74)} ${by(159.2 - 6)}L${ax(74)} ${by(159.2 + 6)}L${ax(19)} ${by(115.2 + 6)}Z`;

  return (
    <>
      <svg
        viewBox={`0 0 ${CW} ${PH}`}
        role={stage === "up" ? "application" : "group"}
        tabIndex={stage === "up" ? 0 : undefined}
        aria-label={up ? "graph paper: age to the right, blood pressure up" : "ages on one line, blood pressures on another"}
        onPointerDown={put}
        onKeyDown={keys}
        className={`mx-auto my-5 block h-auto w-full max-w-sm select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
          stage === "up" ? "cursor-crosshair" : ""
        }`}
      >
        {/* the sheet, once the lines are axes */}
        <g className={`transition-opacity duration-700 motion-reduce:transition-none ${up ? "opacity-100 delay-700" : "opacity-0"}`}>
          <rect x={OX} y={by(165)} width={LINE_END - OX} height={OY - by(165)} rx={3} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
          <path d={PAPER_GRID} strokeWidth={0.6} className="fill-none stroke-cat-blue/25" />
        </g>
        {stage === "all" && <path d={band} className={`${FADE} fill-cat-teal/15 delay-700`} />}

        {/* the age line: flat all along, the x-axis in the end */}
        <path d={`M${OX} ${OY}H${LINE_END}`} strokeWidth={1.2} className="stroke-foreground/40" />
        {AGE_TICKS.map((t, k) => (
          <g key={t}>
            <path d={`M${ax(t)} ${OY - 3}V${OY + 3}`} strokeWidth={1} className="stroke-foreground/40" />
            {k % 2 === 0 && (
              <text x={ax(t)} y={OY + 15} textAnchor="middle" fontSize={9} className="fill-muted font-mono">
                {t}
              </text>
            )}
          </g>
        ))}
        <text
          textAnchor="end"
          fontSize={11}
          fontWeight={600}
          style={{ transform: up ? `translate(${LINE_END}px, ${OY + 29}px)` : `translate(${OX - 10}px, ${OY + 4}px)` }}
          className={`${GLIDE} fill-foreground`}
        >
          {up ? "বয়স →" : "বয়স"}
        </text>

        {/* the BP line, which swings up about its start to become the y-axis */}
        <g
          style={{ transform: up ? `translate(${OX}px, ${OY}px) rotate(-90deg)` : `translate(${OX}px, ${YF}px) rotate(0deg)` }}
          className={GLIDE}
        >
          <path d={`M0 0H${bl(165)}`} strokeWidth={1.2} className="stroke-foreground/40" />
          {BP_TICKS.map((b) => (
            <path key={b} d={`M${bl(b)} -3V3`} strokeWidth={1} className="stroke-foreground/40" />
          ))}
          {stage === "up" && (
            <circle cx={bl(mBp)} cy={-5 - BP_LV[MINE] * LV} r={8} strokeWidth={1.5} className="origin-center animate-ping fill-none stroke-cat-violet [transform-box:fill-box]" />
          )}
          {WARD.map(([age, bp], i) => (
            <circle
              key={i}
              r={DOT_R}
              // on the sheet, a point (age, BP) is this far along the line and this far off it
              style={{
                transform: onPaper(i) ? `translate(${bl(bp)}px, ${(age - 15) * KA}px)` : `translate(${bl(bp)}px, ${-5 - BP_LV[i] * LV}px)`,
                transitionDelay: delay(i),
              }}
              className={`${GLIDE} ${tone(i)} opacity-80`}
            />
          ))}
        </g>
        {[120, 140, 160].map((b) => (
          <text
            key={b}
            textAnchor="middle"
            fontSize={9}
            style={{ transform: up ? `translate(${OX - 30}px, ${by(b) + 3}px)` : `translate(${OX + bl(b)}px, ${YF + 15}px)` }}
            className={`${GLIDE} fill-muted font-mono`}
          >
            {b}
          </text>
        ))}
        <text
          textAnchor="end"
          fontSize={11}
          fontWeight={600}
          style={{ transform: up ? `translate(${OX - 8}px, ${by(165) + 5}px)` : `translate(${OX - 10}px, ${YF + 4}px)` }}
          className={`${GLIDE} fill-foreground`}
        >
          {up ? "↑ BP" : "BP"}
        </text>

        {/* the ages, which ride up into the sheet */}
        {stage === "up" && (
          <circle
            cx={ax(mAge)}
            cy={OY - 5 - AGE_LV[MINE] * LV}
            r={8}
            strokeWidth={1.5}
            className="origin-center animate-ping fill-none stroke-cat-violet [transform-box:fill-box]"
          />
        )}
        {WARD.map(([age, bp], i) => (
          <circle
            key={i}
            r={DOT_R}
            style={{ transform: `translate(${ax(age)}px, ${onPaper(i) ? by(bp) : OY - 5 - AGE_LV[i] * LV}px)`, transitionDelay: delay(i) }}
            className={`${GLIDE} ${tone(i)} opacity-80`}
          />
        ))}

        {/* placing one patient by hand */}
        {stage === "up" && miss && (
          <g key={miss.n} className={`${FADE} pointer-events-none`}>
            <path d={`M${ax(mAge)} ${OY}V${by(mBp)}M${OX} ${by(mBp)}H${ax(mAge)}`} strokeWidth={1.3} strokeDasharray="4 3" className="fill-none stroke-cat-violet" />
            <path d={`M${ax(miss.age)} ${OY}V${by(miss.bp)}H${OX}`} strokeWidth={1} strokeDasharray="2 3" className="fill-none stroke-danger/70" />
            <path
              d={`M${ax(miss.age) - 4} ${by(miss.bp) - 4}l8 8m0 -8l-8 8`}
              strokeWidth={2}
              strokeLinecap="round"
              className="stroke-danger"
            />
          </g>
        )}
        {stage === "up" && cursor && (
          <g className="pointer-events-none">
            <circle cx={ax(cursor[0])} cy={by(cursor[1])} r={7} strokeWidth={1.5} className="fill-none stroke-[#0f1b2d]" />
            <text x={ax(cursor[0]) + 10} y={by(cursor[1]) - 8} fontSize={9} fontWeight={600} className={`${INK} font-mono`}>
              ({cursor[0]}, {cursor[1]})
            </text>
          </g>
        )}
        {stage === "mine" && (
          <text x={ax(mAge) + 9} y={by(mBp) - 9} fontSize={10} fontWeight={700} className={`${POP} ${INK} pointer-events-none font-mono delay-1000`}>
            ({mAge}, {mBp})
          </text>
        )}

        {/* finding the odd one */}
        {stage === "all" &&
          WARD.map(([age, bp], i) => (
            <circle
              key={i}
              cx={ax(age)}
              cy={by(bp)}
              r={11}
              role="button"
              tabIndex={0}
              aria-label={`রোগী ${bn(i + 1)}`}
              onClick={() => tap(i)}
              onKeyDown={press(() => tap(i))}
              className="cursor-pointer fill-transparent outline-none"
            />
          ))}
        {found && (
          <g className={`${POP} pointer-events-none`}>
            <circle cx={ax(25)} cy={by(150)} r={11} strokeWidth={2} className="fill-none stroke-cat-coral" />
            <text x={ax(25) + 14} y={by(150) + 4} fontSize={10} fontWeight={700} className="fill-cat-coral">
              ২৫ বছর, BP ১৫০
            </text>
          </g>
        )}
      </svg>

      {stage === "flat" && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={() => setStage("up")} className={primaryBtn}>
            BP-র দাগটা খাড়া করে দিন
          </button>
        </div>
      )}
      {stage === "up" && (
        <>
          <div className="text-center text-[0.95rem] text-muted">
            রোগী {bn(MINE + 1)}-এর বয়স {bn(mAge)}, BP {bn(mBp)} (বেগুনি dot দুইটা)। কাগজে ওনার জায়গা কোথায়? সেখানে tap করুন।
          </div>
          {miss && (
            <Nope key={miss.n}>
              ওটা বয়স {bn(miss.age)}, BP {bn(miss.bp)}-এর জায়গা। বয়সের দাগে {bn(mAge)} থেকে সোজা ওপরে, BP-র দাগে {bn(mBp)} থেকে সোজা ডানে। দুই পথ যেখানে মেলে, সেখানে।
            </Nope>
          )}
        </>
      )}
      {stage === "mine" && (
        <>
          <DoctorSays tone="good">ঠিক! দুই দাগের দুইটা dot মিলে এখন কাগজে একটাই point।</DoctorSays>
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={() => setStage("all")} className={primaryBtn}>
              বাকি {bn(WARD.length - 1)} জনকেও বসান
            </button>
          </div>
        </>
      )}
      {stage === "all" && !found && <div className="text-center text-[0.95rem] text-muted">এবার কাউকে অদ্ভুত লাগছে? তার ওপর tap করুন।</div>}
      {picked && !found && (
        <Nope key={picked.n}>
          {bn(WARD[picked.i][0])} বছর, BP {bn(WARD[picked.i][1])}: উনি তো বাকিদের মেঘের ভেতরেই।
        </Nope>
      )}
      {found && <DoctorSays tone="good">এই তো! বয়স ২৫, অথচ BP ৭০ বছরের মানুষের মতো। ওনাকে আজই আবার দেখতে হবে।</DoctorSays>}
      <Ticks
        items={[
          ["দাগটা খাড়া", up],
          ["একজনকে নিজে বসান", stage === "mine" || stage === "all"],
          ["অদ্ভুত রোগী", found],
        ]}
      />
      <Task done={found}>BP-র দাগটা খাড়া করুন, একজন রোগীকে নিজের হাতে কাগজে বসান, তারপর অদ্ভুত রোগীটাকে খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// A tailor's measuring tape, laid straight between two points on the sheet,
// with a tick and a number at every whole square.

export function Tape({ f, from, to }: { f: Frame; from: XY; to: XY }) {
  const x1 = f.sx(from[0]);
  const y1 = f.sy(from[1]);
  const x2 = f.sx(to[0]);
  const y2 = f.sy(to[1]);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const L = dist(from, to);
  const marks = Array.from({ length: Math.floor(L + 1e-9) }, (_, k) => k + 1);
  return (
    <g className="pointer-events-none">
      <path d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth={12} className="stroke-[#d97706]" />
      <path d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth={10} className="stroke-[#fde68a]" />
      {marks.map((m) => {
        const cx = x1 + ux * m * f.u;
        const cy = y1 + uy * m * f.u;
        return (
          <g key={m}>
            <path d={`M${cx + uy * 5} ${cy - ux * 5}L${cx - uy * 5} ${cy + ux * 5}`} strokeWidth={1} className="stroke-[#92400e]" />
            {L - m > 0.4 && (
              <text x={cx - uy * 13} y={cy + ux * 13 + 3} textAnchor="middle" fontSize={8} className="fill-[#92400e] font-mono">
                {m}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function PaperBall({ f, at }: { f: Frame; at: XY }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className={`${POP} pointer-events-none`}>
      <circle cx={x} cy={y} r={7} strokeWidth={0.8} className="fill-[#f59e0b] stroke-[#0f1b2d]/30" />
      <path d={`M${x - 7} ${y}Q${x} ${y - 5.5} ${x + 7} ${y}`} strokeWidth={0.7} className="fill-none stroke-[#0f1b2d]/30" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 3 · Shiku walks, the tape goes straight. Two balls; the walk is always
//     across + up, the tape always shorter, and nobody yet knows why 5.

const FT = makeFrame(0, 8, 0, 6, 34);
const BALLS: XY[] = [
  [4, 3],
  [8, 6],
];

export function ShikuTape() {
  const pass = useGate();
  const [round, setRound] = useState(0);
  const [walked, setWalked] = useState(false);
  const [end, setEnd] = useState<XY>(O);
  const [done, setDone] = useState(0);
  const w = useWalk(170);
  const ball = BALLS[round];
  const measured = done > round;
  const pulling = walked && !measured;

  const send = () => w.go(route(O, ball), () => setWalked(true));
  const pull = (p: XY) => {
    if (!pulling) return;
    const t: XY = [clamp(p[0], FT.x0, FT.x1), clamp(p[1], FT.y0, FT.y1)];
    if (dist(t, ball) < 0.4) {
      setEnd(ball);
      setDone(round + 1);
      if (round + 1 === BALLS.length) pass("Shiku হাঁটে 7, ফিতা বলে 5। Shiku হাঁটে 14, ফিতা বলে 10। সোজা পথ সবসময় ছোট।");
    } else setEnd(t);
  };
  const again = () => {
    setRound(1);
    setWalked(false);
    setEnd(O);
    w.go([O]);
  };

  return (
    <>
      <Plane f={FT} ticks={1} label={`Shiku at the corner, a ball ${ball[0]} across and ${ball[1]} up`} drag={pulling ? { down: pull, move: pull } : undefined}>
        <Trail f={FT} cells={w.trail} faint={walked} />
        <PaperBall key={round} f={FT} at={ball} />
        <Tape f={FT} from={O} to={end} />
        {pulling && same(end, O) && (
          <circle cx={FT.sx(0)} cy={FT.sy(0)} r={9} strokeWidth={2} className="origin-center animate-ping fill-none stroke-[#d97706] [transform-box:fill-box]" />
        )}
        {pulling && !same(end, O) && <circle cx={FT.sx(end[0])} cy={FT.sy(end[1])} r={6} className="pointer-events-none fill-[#d97706]" />}
        <Shiku f={FT} at={w.here} />
      </Plane>
      <div className="min-h-7 text-center text-[0.95rem]">
        {walked && (
          <span className={FADE}>
            Shiku হাঁটলো: ডানে {ball[0]} + ওপরে {ball[1]} = <b>{ball[0] + ball[1]} ঘর</b>
            {pulling && !same(end, O) && (
              <>
                {" "}
                · ফিতা: <b className="font-mono">{dist(O, end).toFixed(1)}</b>
              </>
            )}
          </span>
        )}
      </div>
      <div className="mt-2 flex justify-center">
        {!walked && (
          <button type="button" onClick={send} disabled={w.running} className={`${primaryBtn} bg-cat-violet`}>
            ▶ Shiku-কে ball আনতে পাঠান
          </button>
        )}
        {pulling && <div className="text-center text-[0.95rem] text-muted">এবার কোণা থেকে ফিতাটা টেনে সোজা ball পর্যন্ত নিয়ে যান।</div>}
        {measured && round === 0 && (
          <button type="button" onClick={again} className={quietBtn}>
            Ball-টা আরও দূরে রাখুন
          </button>
        )}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="mx-auto text-center font-mono tabular-nums">
          <thead>
            <tr className="font-sans text-xs text-muted">
              <th className="px-3 pb-1 font-normal">ডানে</th>
              <th className="px-3 pb-1 font-normal">ওপরে</th>
              <th className="px-3 pb-1 font-normal">Shiku-র হাঁটা</th>
              <th className="px-3 pb-1 font-normal">ফিতা</th>
            </tr>
          </thead>
          <tbody>
            {BALLS.slice(0, round + 1).map((b, r) => (
              <tr key={r}>
                <td>{b[0]}</td>
                <td>{b[1]}</td>
                <td>{r < round || walked ? b[0] + b[1] : "?"}</td>
                <td className="font-bold text-accent-text">{r < done ? dist(O, b) : "?"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Ticks
        items={[
          ["প্রথম ball", done >= 1],
          ["দূরের ball", done >= 2],
        ]}
      />
      <Task done={done === BALLS.length}>দুইটা ball-এর বেলাতেই আগে Shiku-কে পাঠান, তারপর ফিতা দিয়ে সোজা দূরত্বটা মাপুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Squares on the sides. The tiles under the long side pour into the square
//     on the slanted side as a block, the ones beside the short side as the L
//     around it — and fill it exactly. Then again with a bigger triangle. Only
//     whole-number triangles are offered: a 1-by-1 one would need √2 tiles.

type Tri = { a: number; b: number; c: number };
const TRIS: Tri[] = [
  { a: 4, b: 3, c: 5 },
  { a: 8, b: 6, c: 10 },
  { a: 12, b: 5, c: 13 },
];
/** the sheet's size in px, the same for every triangle so it never jumps */
const TILE_SHEET = 252;
const TILE_MS = 900;
/** the whole stagger, spread over however many tiles there are */
const POUR_MS = 1100;
const TILE_GUESS = ["কম পড়বে, ফাঁক থেকে যাবে", "একদম ঠিক ঠিক ভরে যাবে", "বেশি হবে, কিছু tile বাইরে থাকবে"];
const TILE_RIGHT = 1;
const pts = (ps: XY[], f: Frame) => ps.map(([x, y]) => `${f.sx(x)},${f.sy(y)}`).join(" ");

function tileScene({ a, b, c }: Tri) {
  // square sheet: the height 2a + b + 1 is always the longer span, so widen x to match
  const span = 2 * a + b + 1;
  const side = (span - (a + 2 * b + 1)) / 2;
  const f = makeFrame(-b - 0.5 - side, a + b + 0.5 + side, -a - 0.5, a + b + 0.5, TILE_SHEET / span);
  const e1: XY = [a / c, b / c];
  const e2: XY = [-b / c, a / c];
  const at = (i: number, j: number): XY => [(i + 0.5) * e1[0] + (j + 0.5) * e2[0], (i + 0.5) * e1[1] + (j + 0.5) * e2[1]];
  // the L around the a × a block, walked from the foot of the slanted side up and over
  const ell: XY[] = [];
  for (let i = a; i < c; i++) for (let j = 0; j < c; j++) ell.push([i, j]);
  for (let i = a - 1; i >= 0; i--) for (let j = a; j < c; j++) ell.push([i, j]);
  const tiles = [
    ...Array.from({ length: a * a }, (_, k) => ({ from: [(k % a) + 0.5, -Math.floor(k / a) - 0.5] as XY, to: at(k % a, Math.floor(k / a)), blue: true })),
    ...ell.map(([i, j], k) => ({ from: [a + (k % b) + 0.5, Math.floor(k / b) + 0.5] as XY, to: at(i, j), blue: false })),
  ];
  return { f, tiles, tilt: (-Math.atan2(b, a) * 180) / Math.PI, gap: Math.min(45, POUR_MS / tiles.length) };
}
const SCENES = TRIS.map(tileScene);

function CountLabel({ f, at, children, className }: { f: Frame; at: XY; children: ReactNode; className: string }) {
  return (
    <text
      x={f.sx(at[0])}
      y={f.sy(at[1]) + 5}
      textAnchor="middle"
      fontSize={15}
      fontWeight={800}
      strokeWidth={3.5}
      className={`pointer-events-none stroke-white font-mono [paint-order:stroke] ${className}`}
    >
      {children}
    </text>
  );
}

export function TilePour() {
  const pass = useGate();
  const [t, setT] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [poured, setPoured] = useState(false);
  const [seen, setSeen] = useState<number[]>([]);
  const { a, b, c } = TRIS[t];
  const { f, tiles, tilt, gap } = SCENES[t];
  const settle = usePlay(tiles.length * gap + TILE_MS);
  const over = settle.k === 1;
  const h = f.u * 0.457;

  const pour = () => {
    setPoured(true);
    if (over || settle.running) return;
    settle.play(1, () => {
      const next = seen.includes(t) ? seen : [...seen, t];
      setSeen(next);
      if (next.length >= 2) pass("যে triangle-ই নিন, দুই ছোট square-এর tile মিলে বাঁকা square-টা একদম ঠিক ঠিক ভরে যায়।");
    });
  };
  const pick = (i: number) => {
    if (i === t) return;
    setT(i);
    setPoured(false);
    settle.play(0);
  };

  return (
    <>
      <Plane
        f={f}
        axes={false}
        label={
          poured
            ? "the tiles from the two small squares now fill the square on the slanted side"
            : `a right triangle with sides ${a} and ${b}, a square of tiles on each, and an empty square on the slanted side`
        }
      >
        <rect x={f.sx(0)} y={f.sy(0)} width={a * f.u} height={a * f.u} strokeWidth={1.5} strokeDasharray="4 3" className="fill-none stroke-cat-blue/60" />
        <rect x={f.sx(a)} y={f.sy(b)} width={b * f.u} height={b * f.u} strokeWidth={1.5} strokeDasharray="4 3" className="fill-none stroke-cat-coral/60" />
        <polygon points={pts([O, [a, b], [a - b, a + b], [-b, a]], f)} strokeWidth={1.5} strokeDasharray="4 3" className="fill-none stroke-[#0f1b2d]/60" />
        <polygon points={pts([O, [a, 0], [a, b]], f)} className="fill-cat-violet/15" />
        {tiles.map((tile, k) => {
          const [x, y] = poured ? tile.to : tile.from;
          return (
            <rect
              key={`${t}-${k}`}
              x={-h}
              y={-h}
              width={2 * h}
              height={2 * h}
              rx={Math.min(1.5, h / 4)}
              style={{
                transform: `translate(${f.sx(x)}px, ${f.sy(y)}px) rotate(${poured ? tilt : 0}deg)`,
                transitionDelay: `${k * gap}ms`,
                transitionDuration: `${TILE_MS}ms`,
              }}
              className={`pointer-events-none transition-transform ease-in-out motion-reduce:transition-none ${tile.blue ? "fill-cat-blue/70" : "fill-cat-coral/70"}`}
            />
          );
        })}
        <path d={`M${f.sx(0)} ${f.sy(0)}H${f.sx(a)}`} strokeWidth={3} className="stroke-cat-blue" />
        <path d={`M${f.sx(a)} ${f.sy(0)}V${f.sy(b)}`} strokeWidth={3} className="stroke-cat-coral" />
        <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(a)} ${f.sy(b)}`} strokeWidth={3} className="stroke-[#0f1b2d]" />
        <Label f={f} at={[a / 2, 0]} dy={-5} size={10} className="fill-cat-blue">
          {a}
        </Label>
        <Label f={f} at={[a, b / 2]} dx={-6} dy={4} anchor="end" size={10} className="fill-cat-coral">
          {b}
        </Label>
        <CountLabel f={f} at={[a / 2, -a / 2]} className="fill-cat-blue">
          {a * a}
        </CountLabel>
        <CountLabel f={f} at={[a + b / 2, b / 2]} className="fill-cat-coral">
          {b * b}
        </CountLabel>
        <CountLabel f={f} at={[(a - b) / 2, (a + b) / 2]} className={over && poured ? "fill-accent-text" : INK}>
          {over && poured ? c * c : "?"}
        </CountLabel>
      </Plane>
      <div className="text-sm font-medium text-muted">নীল আর লাল tile-গুলো দিয়ে বাঁকা square-টা ভরাট করলে কী হবে?</div>
      <div className="mt-2 grid gap-2">
        {TILE_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, seen.length > 0, TILE_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {guess !== null && !poured && (
          <button type="button" onClick={pour} className={`${primaryBtn} ${FADE}`}>
            Tile ঢালুন
          </button>
        )}
        {over && (
          <button type="button" onClick={() => setPoured(!poured)} className={`${quietBtn} px-4`}>
            {poured ? "↺ Tile ফেরত নিন" : "আবার ঢালুন"}
          </button>
        )}
      </div>
      {over && (
        <div key={t} className={`${FADE} mx-auto mt-3 max-w-md rounded-2xl border border-border px-4 py-3 text-center`}>
          <div className="font-mono text-lg">
            <span className="text-cat-blue">{a * a}</span> + <span className="text-cat-coral">{b * b}</span> = <b>{c * c}</b>
          </div>
          <div className="mt-1 text-[0.95rem]">
            {c * c}টা tile-এর square-এর বাহু কত? {c} × {c} = {c * c}, তাই <b>{c}</b>।{t === 0 && " ফিতাও ঠিক এটাই বলেছিল।"}
          </div>
        </div>
      )}
      {seen.length > 0 && (
        <div className={`${FADE} mt-3 flex flex-wrap items-center justify-center gap-2`}>
          <span className="text-sm text-muted">বাহু বদলে দেখুন:</span>
          {TRIS.map((tr, i) => (
            <button key={i} type="button" aria-pressed={i === t} disabled={settle.running} onClick={() => pick(i)} className={pill(i === t)}>
              {tr.a} আর {tr.b}
            </button>
          ))}
        </div>
      )}
      <Ticks
        items={[
          ["প্রথম triangle", seen.includes(0)],
          ["আরেকটা triangle", seen.length >= 2],
        ]}
      />
      <Task done={seen.length >= 2}>আগে একটা guess করুন, তারপর tile ঢেলে দেখুন। শেষে বাহু বদলে আরেকটা triangle-এও ঢালুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Why it always works. Four copies of one right triangle in a frame of
//     side a + b: in the corners they leave the square on the slanted side
//     empty; slid into two rectangles they leave a² and b². Same frame, same
//     four triangles, so the same empty space. Every move is a translation.

const RB = 260;
const RM = 14;

export function Rearrange() {
  const pass = useGate();
  const [a, setA] = useState(4);
  const [b, setB] = useState(3);
  const [split, setSplit] = useState(false);
  const [seen, setSeen] = useState<string[]>(["4,3,A"]);
  const s = a + b;
  const u = (RB - 2 * RM) / s;
  const X = (x: number) => RM + x * u;
  const Y = (y: number) => RB - RM - y * u;
  const P = (ps: XY[]) => ps.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ");

  const both = (list: string[]) => list.filter((k) => k.endsWith(",B") && list.includes(k.replace(/B$/, "A"))).length;
  const look = (na: number, nb: number, ns: boolean) => {
    const key = `${na},${nb},${ns ? "B" : "A"}`;
    if (seen.includes(key)) return;
    const next = [...seen, key];
    setSeen(next);
    if (both(next) >= 2) pass("Frame একই, triangle সেই চারটাই, তাই ফাঁকা জায়গাও সমান। প্রত্যেকবার।");
  };
  const pairDone = seen.includes(`${a},${b},A`) && seen.includes(`${a},${b},B`);
  const pairs = both(seen);

  // right-angle corner R, the a-long leg to P, the b-long leg to Q; `move` slides it to the second picture
  const tris: { R: XY; P: XY; Q: XY; move: XY }[] = [
    { R: [0, 0], P: [a, 0], Q: [0, b], move: [0, a] },
    { R: [s, 0], P: [s, a], Q: [s - b, 0], move: [0, 0] },
    { R: [s, s], P: [s - a, s], Q: [s, s - b], move: [-b, 0] },
    { R: [0, s], P: [0, s - a], Q: [b, s], move: [a, -b] },
  ];
  let grid = "";
  for (let k = 1; k < s; k++) grid += `M${X(k)} ${Y(0)}V${Y(s)}M${X(0)} ${Y(k)}H${X(s)}`;
  const fade = (on: boolean) => `transition-opacity duration-500 motion-reduce:transition-none ${on ? "opacity-100 delay-700" : "opacity-0"}`;

  return (
    <>
      <svg viewBox={`0 0 ${RB} ${RB}`} role="img" aria-label={split ? `four triangles leaving two squares, ${a} by ${a} and ${b} by ${b}` : "four triangles in the corners of a frame, leaving a tilted square"} className="mx-auto my-5 block h-auto w-full max-w-[17rem] select-none">
        <path d={grid} strokeWidth={0.6} className="fill-none stroke-foreground/10" />
        <polygon points={P([[a, 0], [s, a], [b, s], [0, b]])} className={`fill-cat-amber/25 ${fade(!split)}`} />
        <rect x={X(0)} y={Y(a)} width={a * u} height={a * u} className={`fill-cat-blue/20 ${fade(split)}`} />
        <rect x={X(a)} y={Y(s)} width={b * u} height={b * u} className={`fill-cat-coral/20 ${fade(split)}`} />
        {tris.map((t, k) => {
          const g: XY = [(t.R[0] + t.P[0] + t.Q[0]) / 3, (t.R[1] + t.P[1] + t.Q[1]) / 3];
          const toward = (m: XY): XY => [m[0] + (g[0] - m[0]) * 0.5, m[1] + (g[1] - m[1]) * 0.5];
          const la = toward([(t.R[0] + t.P[0]) / 2, (t.R[1] + t.P[1]) / 2]);
          const lb = toward([(t.R[0] + t.Q[0]) / 2, (t.R[1] + t.Q[1]) / 2]);
          return (
            <g
              key={k}
              style={{
                transform: split ? `translate(${t.move[0] * u}px, ${-t.move[1] * u}px)` : "translate(0px, 0px)",
                transitionDelay: `${k * 120}ms`,
              }}
              className="transition-transform duration-700 ease-in-out motion-reduce:transition-none"
            >
              <polygon points={P([t.R, t.P, t.Q])} className="fill-cat-violet/25" />
              <path d={`M${X(t.R[0])} ${Y(t.R[1])}L${X(t.P[0])} ${Y(t.P[1])}`} strokeWidth={2.5} strokeLinecap="round" className="stroke-cat-blue" />
              <path d={`M${X(t.R[0])} ${Y(t.R[1])}L${X(t.Q[0])} ${Y(t.Q[1])}`} strokeWidth={2.5} strokeLinecap="round" className="stroke-cat-coral" />
              <path d={`M${X(t.P[0])} ${Y(t.P[1])}L${X(t.Q[0])} ${Y(t.Q[1])}`} strokeWidth={2} strokeLinecap="round" className="stroke-foreground/70" />
              <text x={X(la[0])} y={Y(la[1]) + 4} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-cat-blue font-mono">
                {a}
              </text>
              <text x={X(lb[0])} y={Y(lb[1]) + 4} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-cat-coral font-mono">
                {b}
              </text>
            </g>
          );
        })}
        <text x={X(s / 2)} y={Y(s / 2) + 5} textAnchor="middle" fontSize={14} fontWeight={800} className={`fill-foreground font-mono ${fade(!split)}`}>
          {pairDone ? a * a + b * b : "?"}
        </text>
        <text x={X(a / 2)} y={Y(a / 2) + 4} textAnchor="middle" fontSize={11} fontWeight={700} className={`fill-cat-blue font-mono ${fade(split)}`}>
          {a}×{a}
        </text>
        <text x={X(a + b / 2)} y={Y(a + b / 2) + 4} textAnchor="middle" fontSize={11} fontWeight={700} className={`fill-cat-coral font-mono ${fade(split)}`}>
          {b}×{b}
        </text>
        <rect x={X(0)} y={Y(s)} width={s * u} height={s * u} strokeWidth={2} className="fill-none stroke-foreground/60" />
      </svg>
      <div className="min-h-14 text-center text-[0.95rem]">
        {split ? (
          <>
            ফাঁকা জায়গা: <b className="text-cat-blue">{a}×{a} = {a * a}</b> আর <b className="text-cat-coral">{b}×{b} = {b * b}</b>
          </>
        ) : (
          <>ফাঁকা জায়গা: বাঁকা বাহুর ওপর একটা square</>
        )}
        {pairDone && (
          <div key={`${a},${b}`} className={`${FADE} mt-1 font-semibold text-accent-text`}>
            তাহলে বাঁকা বাহুর square = {a * a} + {b * b} = {a * a + b * b}
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
        <span className="inline-flex items-center gap-2 text-sm text-cat-blue">
          নীল বাহু
          <Stepper value={a} min={1} max={6} label="নীল বাহু" onChange={(v) => (setA(v), look(v, b, split))} />
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-cat-coral">
          লাল বাহু
          <Stepper value={b} min={1} max={6} label="লাল বাহু" onChange={(v) => (setB(v), look(a, v, split))} />
        </span>
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={() => (setSplit(!split), look(a, b, !split))} className={primaryBtn}>
          {split ? "↺ আগের মতো সাজান" : "Triangle-গুলো সরান"}
        </button>
      </div>
      <Ticks
        items={[
          ["দুইভাবেই সাজান", pairs >= 1],
          ["আরেকটা triangle-এ", pairs >= 2],
        ]}
      />
      <Task done={pairs >= 2}>Triangle-গুলো সরিয়ে দুইভাবেই দেখুন। তারপর বাহু দুইটা বদলে অন্য একটা triangle-এও দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The rule against the tape. Drag a point anywhere; square the two gaps,
//     add, take the root — and the tape agrees, left of the start included.

const FP = makeFrame(0, 8, 0, 6, 34);
const P0: XY = [3, 1];
const SPOTS = 3;
const KEY_STEP: Record<string, XY> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
const sq = (v: number) => (v < 0 ? `(${sg(v)})²` : `${v}²`);

export function RuleVsTape() {
  const pass = useGate();
  const [q, setQ] = useState<XY>([7, 4]);
  const [spots, setSpots] = useState<string[]>([]);
  const d = minus(q, P0);
  const s = d[0] ** 2 + d[1] ** 2;
  const len = Math.sqrt(s);
  const whole = Number.isInteger(len);
  const isLeft = (k: string) => Number(k.split(",")[0]) < P0[0];
  const leftDone = spots.some(isLeft);

  // A spot counts when the reader lets go there, not for every square a drag passes.
  const keep = (t: XY) => {
    const dd = minus(t, P0);
    const key = t.join(",");
    if (dd[0] === 0 || dd[1] === 0 || spots.includes(key)) return;
    const next = [...spots, key];
    setSpots(next);
    if (next.length >= SPOTS && next.some(isLeft)) pass("যেখানেই নিন, নিয়ম আর ফিতা এক কথা বলে। বাঁয়ে গেলেও বর্গ করলে minus চলে যায়।");
  };
  const put = (p: XY) => {
    const t = snap(p, FP);
    if (!same(t, P0)) setQ(t);
  };
  const nudge = (e: KeyboardEvent<SVGSVGElement>) => {
    const k = KEY_STEP[e.key];
    if (!k) return;
    e.preventDefault();
    const t = snap(plus(q, k), FP);
    if (same(t, P0)) return;
    setQ(t);
    keep(t);
  };
  const corner: XY = [q[0], P0[1]];

  return (
    <>
      <Plane
        f={FP}
        ticks={1}
        label={`two points, ${sg(d[0])} across and ${sg(d[1])} up from each other; drag the second`}
        drag={{ down: put, move: put, up: () => keep(q) }}
        onKey={nudge}
      >
        <path d={`M${FP.sx(P0[0])} ${FP.sy(P0[1])}H${FP.sx(corner[0])}`} strokeWidth={2.5} strokeDasharray="5 4" className="pointer-events-none fill-none stroke-cat-blue" />
        <path d={`M${FP.sx(corner[0])} ${FP.sy(corner[1])}V${FP.sy(q[1])}`} strokeWidth={2.5} strokeDasharray="5 4" className="pointer-events-none fill-none stroke-cat-coral" />
        <Tape f={FP} from={P0} to={q} />
        {d[0] !== 0 && (
          <Label f={FP} at={[(P0[0] + corner[0]) / 2, P0[1]]} dy={d[1] >= 0 ? 16 : -8} className="fill-cat-blue">
            {sg(d[0])}
          </Label>
        )}
        {d[1] !== 0 && (
          <Label f={FP} at={[corner[0], (corner[1] + q[1]) / 2]} dx={d[0] >= 0 ? 12 : -12} anchor={d[0] >= 0 ? "start" : "end"} className="fill-cat-coral">
            {sg(d[1])}
          </Label>
        )}
        <Dot f={FP} at={P0} r={5} className="fill-[#0f1b2d]" />
        <circle cx={FP.sx(q[0])} cy={FP.sy(q[1])} r={9} strokeWidth={2} className="fill-cat-violet/20 stroke-cat-violet" />
        <Dot f={FP} at={q} r={4} className="fill-cat-violet" />
      </Plane>
      <div className="mx-auto grid max-w-md grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1.5 rounded-2xl border border-border px-4 py-3">
        <span className="text-xs font-semibold text-muted">নিয়ম</span>
        <span className="font-mono text-[1.05rem]">
          √(<span className="text-cat-blue">{sq(d[0])}</span> + <span className="text-cat-coral">{sq(d[1])}</span>) = √({d[0] ** 2} + {d[1] ** 2}) = √{s}{" "}
          {whole ? "=" : "≈"}{" "}
          <b key={s} className={`${POP} inline-block`}>
            {whole ? len : len.toFixed(2)}
          </b>
        </span>
        <span className="text-xs font-semibold text-muted">ফিতা</span>
        <span className="font-mono text-[1.05rem]">
          <b>{len.toFixed(2)}</b> <span className="text-accent-text">✓ মিলে গেছে</span>
        </span>
      </div>
      <div className="mt-2 min-h-6 text-center text-sm text-muted">
        {d[0] < 0 && (
          <span className={FADE}>
            বাঁয়ে গেলে তফাত negative, কিন্তু বর্গ করলে minus চলে যায়: {sq(d[0])} = {d[0] ** 2}।
          </span>
        )}
      </div>
      <Ticks
        items={[
          [`${bn(SPOTS)}টা জায়গা (${bn(Math.min(spots.length, SPOTS))}/${bn(SPOTS)})`, spots.length >= SPOTS],
          ["একটা বাঁ দিকে", leftDone],
        ]}
      />
      <Task done={spots.length >= SPOTS && leftDone}>
        বেগুনি point-টা টেনে তিনটা আলাদা কোণাকুনি জায়গায় নিন, অন্তত একটা কালো point-এর বাঁয়ে। প্রত্যেকবার নিয়ম আর ফিতা মিলিয়ে দেখুন।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · Naming the gaps. a = (5, 4) and b = (1, 1) mark their coordinates on
//     the axes as a₁, b₁ and a₂, b₂. The stretch between each pair lights up
//     on its axis, then slides into the triangle as a leg, so a₁ − b₁ and
//     a₂ − b₂ are seen to be the two gaps the tape rule squares.

const FG = makeFrame(-0.9, 7, -0.9, 5.5, 32);
const GA: XY = [5, 4];
const GB: XY = [1, 1];
/** appear at once, then glide into the triangle a moment later */
const SLIDE =
  "[transition:opacity_400ms_ease-out,transform_900ms_ease-in-out_700ms] motion-reduce:[transition:none]";

export function GapNames() {
  const pass = useGate();
  const [stage, setStage] = useState(0);
  const d1 = GA[0] - GB[0];
  const d2 = GA[1] - GB[1];
  const len = Math.hypot(d1, d2);
  const x0 = FG.sx(0);
  const y0 = FG.sy(0);
  const next = () => {
    const n = stage + 1;
    setStage(n);
    if (n === 3) pass("a₁ − b₁ হলো ডানে-বাঁয়ে তফাত, a₂ − b₂ হলো ওপরে-নিচে তফাত। Formula শুধু ছবির দুইটা বাহুর নাম দিয়েছে।");
  };
  const name = (x: number, y: number, text: string, cls: string, anchor: "middle" | "end" = "middle") => (
    <text x={x} y={y} textAnchor={anchor} fontSize={11} fontWeight={700} className={`pointer-events-none font-mono ${cls}`}>
      {text}
    </text>
  );

  return (
    <>
      <Plane f={FG} ticks={1} label={`two points, a = (${GA.join(", ")}) and b = (${GB.join(", ")}), with their coordinates named on the axes`}>
        {/* where each coordinate comes from */}
        <path
          d={[GA, GB].map(([x, y]) => `M${FG.sx(x)} ${FG.sy(y)}V${y0}M${FG.sx(x)} ${FG.sy(y)}H${x0}`).join("")}
          strokeWidth={1}
          strokeDasharray="3 3"
          className="pointer-events-none fill-none stroke-[#0f1b2d]/30"
        />
        {name(FG.sx(GA[0]), y0 + 25, "a₁", "fill-cat-violet")}
        {name(FG.sx(GB[0]), y0 + 25, "b₁", INK)}
        {name(x0 - 15, FG.sy(GA[1]) + 4, "a₂", "fill-cat-violet", "end")}
        {name(x0 - 15, FG.sy(GB[1]) + 4, "b₂", INK, "end")}

        {/* ghosts left on the axes once the gaps have moved */}
        {stage >= 1 && <path d={`M${FG.sx(GB[0])} ${y0}H${FG.sx(GA[0])}`} strokeWidth={4} className={`${FADE} stroke-cat-blue/25`} />}
        {stage >= 2 && <path d={`M${x0} ${FG.sy(GB[1])}V${FG.sy(GA[1])}`} strokeWidth={4} className={`${FADE} stroke-cat-coral/25`} />}

        {/* the across gap: lights up on the x-axis, then rises to b's height */}
        <g
          style={{ transform: `translate(0px, ${stage >= 1 ? -GB[1] * FG.u : 0}px)`, opacity: stage >= 1 ? 1 : 0 }}
          className={`pointer-events-none ${SLIDE}`}
        >
          <path d={`M${FG.sx(GB[0])} ${y0}H${FG.sx(GA[0])}`} strokeWidth={4} strokeLinecap="round" className="stroke-cat-blue" />
          {name((FG.sx(GB[0]) + FG.sx(GA[0])) / 2, y0 - 8, "a₁ − b₁", "fill-cat-blue")}
        </g>
        {/* the up gap: lights up on the y-axis, then slides across to a's column */}
        <g
          style={{ transform: `translate(${stage >= 2 ? GA[0] * FG.u : 0}px, 0px)`, opacity: stage >= 2 ? 1 : 0 }}
          className={`pointer-events-none ${SLIDE}`}
        >
          <path d={`M${x0} ${FG.sy(GB[1])}V${FG.sy(GA[1])}`} strokeWidth={4} strokeLinecap="round" className="stroke-cat-coral" />
          <text x={x0 + 8} y={(FG.sy(GB[1]) + FG.sy(GA[1])) / 2 + 4} fontSize={11} fontWeight={700} className="fill-cat-coral font-mono">
            a₂ − b₂
          </text>
        </g>

        {stage >= 3 && (
          <>
            <Tape f={FG} from={GB} to={GA} />
            <Label f={FG} at={[(GA[0] + GB[0]) / 2, (GA[1] + GB[1]) / 2]} dx={-12} dy={-8} size={12} weight={800} className={INK}>
              d
            </Label>
          </>
        )}
        <Dot f={FG} at={GB} r={5} className="fill-[#0f1b2d]" />
        <Dot f={FG} at={GA} r={5} className="fill-cat-violet" />
        <Label f={FG} at={GB} dx={-8} dy={16} anchor="end" className={INK}>
          b = ({GB.join(", ")})
        </Label>
        <Label f={FG} at={GA} dx={-8} dy={-9} anchor="end" className="fill-cat-violet">
          a = ({GA.join(", ")})
        </Label>
      </Plane>
      <div className="mx-auto grid min-h-24 max-w-md gap-1.5 text-center font-mono text-[1.02rem]">
        {stage >= 1 && (
          <div className={FADE}>
            <span className="font-sans text-sm text-muted">ডানে-বাঁয়ে</span> a<sub>1</sub> − b<sub>1</sub> = {GA[0]} − {GB[0]} ={" "}
            <b className="text-cat-blue">{d1}</b>
          </div>
        )}
        {stage >= 2 && (
          <div className={FADE}>
            <span className="font-sans text-sm text-muted">ওপরে-নিচে</span> a<sub>2</sub> − b<sub>2</sub> = {GA[1]} − {GB[1]} ={" "}
            <b className="text-cat-coral">{d2}</b>
          </div>
        )}
        {stage >= 3 && (
          <div className={`${FADE} rounded-xl bg-accent/10 px-3 py-2 font-semibold`}>
            d = √(<span className="text-cat-blue">{d1}²</span> + <span className="text-cat-coral">{d2}²</span>) = √{d1 * d1 + d2 * d2} = {len}
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-center">
        {stage === 0 && (
          <button type="button" onClick={next} className={primaryBtn}>
            ১ · ডানে-বাঁয়ে তফাত
          </button>
        )}
        {stage === 1 && (
          <button type="button" onClick={next} className={primaryBtn}>
            ২ · ওপরে-নিচে তফাত
          </button>
        )}
        {stage === 2 && (
          <button type="button" onClick={next} className={primaryBtn}>
            ৩ · ফিতা দিয়ে দূরত্ব
          </button>
        )}
        {stage === 3 && (
          <button type="button" onClick={() => setStage(0)} className={quietBtn}>
            ↺ আবার দেখুন
          </button>
        )}
      </div>
      <Ticks
        items={[
          ["ডানে-বাঁয়ে", stage >= 1],
          ["ওপরে-নিচে", stage >= 2],
          ["দূরত্ব", stage >= 3],
        ]}
      />
      <Task done={stage >= 3}>তিন ধাপে দেখুন, a আর b-এর ঘরগুলো থেকে তফাত দুইটা কোথা থেকে আসে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · A third direction, seen from inside. You stand at one floor corner of a
//     6 × 2 × 3 verandah, open along one long side (a railing) and at the near
//     end, and look for the mosquito on the far ceiling corner. Pythagoras
//     across the floor, then again standing up, and the root in the middle
//     cancels.
//
//     The room is a real pinhole projection the reader can drag to look
//     around; it opens looking down at your own feet. The standing triangle's
//     plane runs right through your eyes, so from the corner it is only a
//     line: for that step the camera backs out of the open end, where both
//     triangles show whole.

type V3 = [number, number, number];
const RL = 6;
const RW = 2;
const RHT = 3;
const VW = 320;
const VH = 240;
/** focal length in px: about 80° across */
const FL = 190;
const NEAR = 0.05;
const EYE_AT: V3 = [0.3, 0.3, 1.55];
const EYE_BACK: V3 = [-2.4, 1, 1.9];
/** where the camera stands and looks at each step: x, y, z, yaw°, pitch°. Yaw 0 looks down the verandah, + turns left. */
const VIEWS = [
  [...EYE_AT, 17, -6],
  [...EYE_AT, 14, -16],
  [...EYE_BACK, 5, -10],
  [...EYE_BACK, 5, -10],
];
const KEY_TURN: Record<string, [number, number]> = { ArrowLeft: [8, 0], ArrowRight: [-8, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] };

type Cam = { e: V3; f: V3; l: V3; u: V3 };
function camera([x, y, z, yd, pd]: number[]): Cam {
  const ya = (yd * Math.PI) / 180;
  const pa = (pd * Math.PI) / 180;
  const [cy, sy, cp, sp] = [Math.cos(ya), Math.sin(ya), Math.cos(pa), Math.sin(pa)];
  return { e: [x, y, z], f: [cp * cy, cp * sy, sp], l: [-sy, cy, 0], u: [-sp * cy, -sp * sy, cp] };
}
const d3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** a world point in the camera's own terms: [left, up, ahead] */
const inView = (c: Cam, p: V3): V3 => {
  const r: V3 = [p[0] - c.e[0], p[1] - c.e[1], p[2] - c.e[2]];
  return [d3(r, c.l), d3(r, c.u), d3(r, c.f)];
};
const r1 = (v: number) => Math.round(v * 10) / 10;
const onScreen = (q: V3): XY => [r1(VW / 2 - (FL * q[0]) / q[2]), r1(VH / 2 - (FL * q[1]) / q[2])];
/** where the line from `out` (behind the eye) to `inn` crosses the near plane */
const cut = (out: V3, inn: V3): V3 => {
  const t = (NEAR - out[2]) / (inn[2] - out[2]);
  return [out[0] + (inn[0] - out[0]) * t, out[1] + (inn[1] - out[1]) * t, NEAR];
};
function line3(c: Cam, p: V3, q: V3) {
  let a = inView(c, p);
  let b = inView(c, q);
  if (a[2] < NEAR && b[2] < NEAR) return "";
  if (a[2] < NEAR) a = cut(a, b);
  else if (b[2] < NEAR) b = cut(b, a);
  const [x1, y1] = onScreen(a);
  const [x2, y2] = onScreen(b);
  return `M${x1} ${y1}L${x2} ${y2}`;
}
/** a flat polygon, clipped to what is in front of the eye (Sutherland–Hodgman on one plane) */
function face3(c: Cam, ps: V3[]) {
  const vs = ps.map((p) => inView(c, p));
  const kept: V3[] = [];
  vs.forEach((cur, i) => {
    const prev = vs[(i + vs.length - 1) % vs.length];
    const inCur = cur[2] >= NEAR;
    if (inCur !== prev[2] >= NEAR) kept.push(inCur ? cut(prev, cur) : cut(cur, prev));
    if (inCur) kept.push(cur);
  });
  return kept.length < 3 ? "" : kept.map((q) => onScreen(q).join(",")).join(" ");
}
/** a point on screen, if it is in front of the eye and inside the picture */
function spot3(c: Cam, p: V3, margin = 12): XY | null {
  const q = inView(c, p);
  if (q[2] < 0.2) return null;
  const s = onScreen(q);
  return s[0] > margin && s[0] < VW - margin && s[1] > margin && s[1] < VH - margin ? s : null;
}
const along = (p: V3, q: V3, t: number): V3 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];

const S: V3 = [0, 0, 0];
const K: V3 = [RL, 0, 0];
const F: V3 = [RL, RW, 0];
const M: V3 = [RL, RW, RHT];
const FEET: V3 = [0.24, 0.24, 0];
const FACES: { ps: V3[]; cls: string }[] = [
  { ps: [S, K, F, [0, RW, 0]], cls: "fill-[#eadcc3]" }, // floor
  { ps: [[0, 0, RHT], [RL, 0, RHT], M, [0, RW, RHT]], cls: "fill-[#f7f4ee]" }, // ceiling
  { ps: [S, K, [RL, 0, RHT], [0, 0, RHT]], cls: "fill-[#efe6d8]" }, // the wall on your right
  { ps: [K, F, M, [RL, 0, RHT]], cls: "fill-[#e2d5c0]" }, // the far wall
];
type Seg = [V3, V3];
/** 1 m floor tiles, so 6 and 2 can be counted */
const TILE_LINES: Seg[] = [...[1, 2, 3, 4, 5].map((x): Seg => [[x, 0, 0], [x, RW, 0]]), [[0, 1, 0], [RL, 1, 0]]];
const WALL_EDGES: Seg[] = [
  [S, K],
  [K, F],
  [[0, 0, RHT], [RL, 0, RHT]],
  [[RL, 0, RHT], M],
  [K, [RL, 0, RHT]],
  [S, [0, 0, RHT]],
];
const POSTS: Seg[] = [1, 2, 3, 4, 5].map((x): Seg => [[x, RW, 0], [x, RW, 1]]);
const RAIL: Seg[] = [[[0, RW, 1], [RL, RW, 1]]];
const PILLARS: Seg[] = [
  [[0, RW, 0], [0, RW, RHT]],
  [F, M],
  [[0, RW, RHT], M],
];
const SX = (v: number) => <span className="text-cat-blue">{v}²</span>;

function Term3({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={tone}>{children}</span>;
}

export function RoomCorner() {
  const pass = useGate();
  const [stage, setStage] = useState(0);
  const [look, setLook] = useState<number[]>(VIEWS[0]);
  const [ms, setMs] = useState(2400);
  const [looked, setLooked] = useState(false);
  const held = useRef<XY | null>(null);
  // it opens looking down at your own feet, then lifts to the far corner
  const v = useTween(look, ms, [...EYE_AT, 17, -72]);
  const c = camera(v);

  const next = () => {
    const n = stage + 1;
    setStage(n);
    setMs(1600);
    setLook(VIEWS[n]);
    if (n === 3) pass("দুইবার Pythagoras, আর formula-য় তিনটা term। নতুন একটা দিক মানে নতুন একটা term।");
  };
  const turn = (dYaw: number, dPitch: number, speed: number) => {
    setMs(speed);
    setLooked(true);
    setLook((l) => [l[0], l[1], l[2], clamp(l[3] + dYaw, -60, 110), clamp(l[4] + dPitch, -80, 60)]);
  };
  const lines = (segs: Seg[]) => segs.map(([p, q]) => line3(c, p, q)).join("");
  const tag = (p: V3, text: ReactNode, cls: string, dx = 0, dy = 0, anchor: "start" | "middle" | "end" = "middle") => {
    const s = spot3(c, p);
    return (
      s && (
        <text
          x={s[0] + dx}
          y={s[1] + dy}
          textAnchor={anchor}
          fontSize={11}
          fontWeight={700}
          strokeWidth={3}
          className={`pointer-events-none stroke-white font-mono [paint-order:stroke] ${cls}`}
        >
          {text}
        </text>
      )
    );
  };
  const horizon = clamp(VH / 2 + FL * Math.tan((v[4] * Math.PI) / 180), 0, VH);
  const feet = inView(c, FEET);
  const feetAt = spot3(c, FEET, 0);
  const bug = spot3(c, M, 0);
  const floorTri = face3(c, [S, K, F]);
  const upTri = face3(c, [S, F, M]);

  return (
    <>
      <div className="mx-auto my-5 max-w-sm overflow-hidden rounded-2xl ring-1 ring-border">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          role="application"
          tabIndex={0}
          aria-label="inside a verandah 6 by 2 by 3 metres: you at one floor corner, a mosquito at the opposite ceiling corner. Drag or use the arrow keys to look around."
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            held.current = [e.clientX, e.clientY];
          }}
          onPointerMove={(e) => {
            const h = held.current;
            if (!h) return;
            const k = (VW / e.currentTarget.getBoundingClientRect().width) * 0.3;
            turn((e.clientX - h[0]) * k, (e.clientY - h[1]) * k, 40);
            held.current = [e.clientX, e.clientY];
          }}
          onPointerUp={() => (held.current = null)}
          onPointerCancel={() => (held.current = null)}
          onKeyDown={(e) => {
            const k = KEY_TURN[e.key];
            if (!k) return;
            e.preventDefault();
            turn(k[0], k[1], 250);
          }}
          className="block h-auto w-full cursor-grab touch-none select-none outline-none active:cursor-grabbing"
        >
          {/* outside: sky over a garden, seen past the railing and the open end */}
          <rect width={VW} height={horizon} className="fill-[#d8ecfa]" />
          <rect y={horizon} width={VW} height={VH - horizon} className="fill-[#d6e6c6]" />
          {FACES.map((fc, i) => {
            const d = face3(c, fc.ps);
            return d && <polygon key={i} points={d} className={fc.cls} />;
          })}
          <path d={lines(TILE_LINES)} strokeWidth={0.8} className="pointer-events-none fill-none stroke-[#c6ad82]" />
          <path d={lines(WALL_EDGES)} strokeWidth={1} className="pointer-events-none fill-none stroke-[#0f1b2d]/25" />
          <path d={lines(POSTS)} strokeWidth={1.6} strokeLinecap="round" className="pointer-events-none fill-none stroke-[#8a6a48]" />
          <path d={lines(RAIL)} strokeWidth={3} strokeLinecap="round" className="pointer-events-none fill-none stroke-[#8a6a48]" />
          <path d={lines(PILLARS)} strokeWidth={4.5} strokeLinecap="round" className="pointer-events-none fill-none stroke-[#8a6a48]" />

          {stage >= 1 && (
            <g className={FADE}>
              {floorTri && <polygon points={floorTri} className="pointer-events-none fill-cat-violet/25" />}
              <path d={line3(c, S, K)} strokeWidth={3} className="pointer-events-none stroke-cat-blue" />
              <path d={line3(c, K, F)} strokeWidth={3} className="pointer-events-none stroke-cat-coral" />
              <Draw d={line3(c, S, F)} strokeWidth={3} className="stroke-cat-violet" />
            </g>
          )}
          {stage >= 2 && (
            <g className={FADE}>
              {upTri && <polygon points={upTri} className="pointer-events-none fill-cat-teal/20" />}
              <path d={line3(c, F, M)} strokeWidth={3} className="pointer-events-none stroke-cat-teal" />
              <Draw d={line3(c, S, M)} strokeWidth={3} className="stroke-[#0f1b2d]" />
            </g>
          )}
          {stage === 0 && <path d={line3(c, S, M)} strokeWidth={1.8} strokeDasharray="5 4" className="pointer-events-none stroke-[#0f1b2d]/70" />}

          {/* your feet, at the corner */}
          {feetAt && (
            <g className="pointer-events-none">
              <text x={feetAt[0]} y={feetAt[1]} textAnchor="middle" dominantBaseline="middle" fontSize={clamp((FL * 0.3) / feet[2], 10, 44)}>
                👣
              </text>
              <text
                x={feetAt[0]}
                y={feetAt[1] + clamp((FL * 0.3) / feet[2], 10, 44) / 2 + 12}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                strokeWidth={3}
                className="fill-cat-teal stroke-white [paint-order:stroke]"
              >
                আপনি
              </text>
            </g>
          )}
          {bug && (
            <g className="pointer-events-none">
              <g transform={`translate(${bug[0]} ${bug[1] + 6})`}>
                <ellipse cx={-4.5} cy={-4} rx={4.5} ry={2} transform="rotate(-30 -4.5 -4)" className="fill-cat-blue/50" />
                <ellipse cx={4.5} cy={-4} rx={4.5} ry={2} transform="rotate(30 4.5 -4)" className="fill-cat-blue/50" />
                <ellipse rx={1.8} ry={4.5} className="fill-[#0f1b2d]" />
              </g>
              <text x={bug[0] + 10} y={bug[1] + 4} fontSize={10} fontWeight={700} strokeWidth={3} className="fill-[#0f1b2d] stroke-white [paint-order:stroke]">
                মশা
              </text>
            </g>
          )}

          {tag(along(S, M, 0.6), stage >= 3 ? "7" : "?", stage >= 3 ? "fill-accent-text" : "fill-[#0f1b2d]", 12, 0, "start")}
          {tag(along(S, K, 0.72), "6 m", "fill-cat-blue", 0, 14)}
          {tag(along(K, F, 0.5), "2 m", "fill-cat-coral", 0, 14)}
          {tag(along(F, M, 0.5), "3 m", "fill-cat-teal", -8, 4, "end")}
          {stage >= 1 && tag(along(S, F, 0.72), "√40", "fill-cat-violet", 0, -7)}
        </svg>
      </div>
      <div className="-mt-3 mb-2 flex min-h-8 items-center justify-center gap-3 text-sm text-muted">
        {looked ? (
          <button type="button" onClick={() => (setMs(900), setLook(VIEWS[stage]), setLooked(false))} className="cursor-pointer underline-offset-2 hover:underline">
            ↺ সামনে তাকান
          </button>
        ) : (
          <span>ছবিটা টেনে (বা arrow key দিয়ে) চারপাশে তাকিয়ে দেখুন</span>
        )}
      </div>
      {stage === 2 && (
        <div className={`${FADE} mx-auto mb-2 max-w-md text-center text-sm text-muted`}>
          খাড়া triangle-টা ঠিক আপনার চোখ বরাবর পড়ে, তাই কোণা থেকে ওটাকে একটা দাগের মতো দেখায়। তাই বারান্দার মুখ থেকে কয়েক পা পিছিয়ে এসে দেখছি।
        </div>
      )}
      <div className="mx-auto grid min-h-20 max-w-md gap-1.5 text-center font-mono text-[1.02rem]">
        {stage >= 1 && (
          <div className={FADE}>
            <span className="font-sans text-sm text-muted">মেঝের কোণাকুনি</span> = √({SX(6)} + <Term3 tone="text-cat-coral">2²</Term3>) = <span className="text-cat-violet">√40</span>{" "}
            <span className="text-muted">≈ 6.32</span>
          </div>
        )}
        {stage >= 2 && (
          <div className={FADE}>
            <span className="font-sans text-sm text-muted">মশা পর্যন্ত</span> = √(<Term3 tone="text-cat-violet">(√40)²</Term3> + <Term3 tone="text-cat-teal">3²</Term3>)
          </div>
        )}
        {stage >= 3 && (
          <>
            <div className={`${FADE} text-sm`}>
              <Term3 tone="text-cat-violet">(√40)²</Term3> = 40 = {SX(6)} + <Term3 tone="text-cat-coral">2²</Term3>
            </div>
            <div className={`${FADE} rounded-xl bg-accent/10 px-3 py-2 font-semibold`}>
              <span className="font-sans text-sm">মশা পর্যন্ত</span> = √({SX(6)} + <Term3 tone="text-cat-coral">2²</Term3> + <Term3 tone="text-cat-teal">3²</Term3>) = √49 = 7
            </div>
          </>
        )}
      </div>
      <div className="mt-3 flex justify-center">
        {stage === 0 && (
          <button type="button" onClick={next} className={primaryBtn}>
            ১ · আগে মেঝের ওপর দিয়ে
          </button>
        )}
        {stage === 1 && (
          <button type="button" onClick={next} className={primaryBtn}>
            ২ · এবার খাড়া ওপরে
          </button>
        )}
        {stage === 2 && (
          <button type="button" onClick={next} className={primaryBtn}>
            ৩ · (√40)²-কে খুলে লিখুন
          </button>
        )}
      </div>
      <Ticks
        items={[
          ["মেঝের triangle", stage >= 1],
          ["খাড়া triangle", stage >= 2],
          ["এক লাইনে", stage >= 3],
        ]}
      />
      <Task done={stage >= 3}>তিন ধাপে মশা পর্যন্ত দূরত্ব বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The formula grows a term per box, until nobody can write it out.

const TERM_TONES = ["text-cat-blue", "text-cat-coral", "text-cat-teal", "text-cat-violet", "text-cat-amber"];
const GROW_NOTE = [
  "",
  "",
  "২টা ঘর: কাগজের ওপর, Shiku-র ফিতা।",
  "৩টা ঘর: বারান্দার মশা। নতুন একটা দিক, নতুন একটা term।",
  "৪টা ঘর: ছবি শেষ। অথচ formula দিব্যি চলছে।",
  "৫টা ঘর: সেই একই নিয়ম, একটা term বেশি।",
];

function Term({ i, pop = true }: { i: number | string; pop?: boolean }) {
  const tone = typeof i === "number" && i <= TERM_TONES.length ? TERM_TONES[i - 1] : "text-foreground";
  return (
    <span className={`${pop ? POP : ""} inline-block font-semibold whitespace-nowrap ${tone}`}>
      (a{sub(i)} − b{sub(i)})²
    </span>
  );
}

function Sum({ terms }: { terms: ReactNode[] }) {
  return (
    <>
      {terms.map((t, k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          {k > 0 && <span className="text-muted">+</span>}
          {t}
        </span>
      ))}
    </>
  );
}

export function GrowFormula() {
  const pass = useGate();
  const [n, setN] = useState(2);
  const [many, setMany] = useState(false);

  return (
    <>
      <div className="my-6 flex min-h-28 items-center justify-center overflow-x-auto px-1 font-serif text-lg sm:text-xl">
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2">
          <i>d</i> =<span className="text-3xl">√</span>
          <span className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 border-t-2 border-foreground pt-1">
            <Sum
              terms={
                many
                  ? [<Term key={1} i={1} pop={false} />, <Term key={2} i={2} pop={false} />, <Term key={3} i={3} pop={false} />, <span key="…" className="text-muted">…</span>, <Term key={40} i={40} />]
                  : Array.from({ length: n }, (_, k) => <Term key={k} i={k + 1} />)
              }
            />
          </span>
        </div>
      </div>
      <div className="min-h-8 text-center text-[0.95rem] text-muted">
        <span key={many ? "many" : n} className={FADE}>
          {many ? "৪০টা ঘর: মাঝখানে আরও ৩৬টা term লুকিয়ে আছে। লিখতে লিখতে হাত ব্যথা।" : GROW_NOTE[n]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {!many && (
          <button type="button" onClick={() => setN(n + 1)} disabled={n >= 5} className={quietBtn}>
            + আরেকটা ঘর
          </button>
        )}
        {n >= 5 && !many && (
          <button
            type="button"
            onClick={() => {
              setMany(true);
              pass("শুধু term বাড়ে। কিন্তু লিখে শেষ করা যায় না, ছোট করে লেখার একটা উপায় লাগবে।");
            }}
            className={`${primaryBtn} ${FADE}`}
          >
            ৪০টা ঘর হলে?
          </button>
        )}
      </div>
      <Ticks
        items={[
          ["৫টা ঘর পর্যন্ত বাড়ান", n >= 5],
          ["৪০টা ঘর", many],
        ]}
      />
      <Task done={many}>ঘর বাড়াতে থাকুন, দেখুন formula-র কী হয়। পাঁচে পৌঁছালে ৪০টা ঘরের কথা ভাবুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · The long sum (2.6). One squared gap per column, written out in full,
//      until the page cannot hold it: the reason Σ exists.

const LONG_NS = [3, 5, 10, 40, 100, 300];
/** seconds to write one term by hand, for the "how long" meter */
const PER_TERM = 3;
const LONG_MAX = LONG_NS[LONG_NS.length - 1];

export function LongSum() {
  const pass = useGate();
  const [ni, setNi] = useState(0);
  const [reached, setReached] = useState(false);
  const n = LONG_NS[ni];
  const secs = n * PER_TERM;

  const pick = (i: number) => {
    setNi(i);
    if (!reached && LONG_NS[i] === LONG_MAX) {
      setReached(true);
      pass("লেখা শেষই হয় না! এত লম্বা যোগ ছোট করে লেখার একটা উপায় দরকার।");
    }
  };

  return (
    <>
      <div className="relative mx-auto mt-5 max-h-60 max-w-md overflow-hidden rounded-2xl border border-[#cbd5e1] bg-white px-4 py-3 font-serif text-base leading-loose text-[#0f1b2d]">
        <i>d</i> = √(
        {Array.from({ length: n }, (_, i) => (
          <span key={i}>
            <span className="whitespace-nowrap">
              (a{sub(i + 1)} − b{sub(i + 1)})²
            </span>
            {i < n - 1 ? " + " : ""}
          </span>
        ))}
        )
        {n > 40 && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-white to-transparent" />}
      </div>
      <div className="mx-auto mt-4 grid max-w-md gap-1.5">
        <div className="flex flex-wrap justify-between gap-x-3 text-sm">
          <span>
            term: <b className="font-mono">{n}</b>টা
          </span>
          <span>
            ✏️ হাতে লিখতে লাগবে:{" "}
            <b key={n} className={`${POP} inline-block font-mono`}>
              {secs < 60 ? `${secs} সেকেন্ড` : `${Math.round(secs / 60)} মিনিট`}
            </b>
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-foreground/5">
          <div style={{ width: `${(secs / (LONG_MAX * PER_TERM)) * 100}%` }} className="h-full rounded-full bg-cat-coral transition-[width] duration-700 motion-reduce:transition-none" />
        </div>
      </div>
      <label className="mx-auto mt-4 flex max-w-sm items-center gap-3">
        <span className="shrink-0 text-sm text-muted">কয়টা ঘর</span>
        <input
          type="range"
          min={0}
          max={LONG_NS.length - 1}
          value={ni}
          aria-label="কয়টা ঘর"
          onChange={(e) => pick(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-coral)]"
        />
      </label>
      <Task done={reached}>Slider টেনে ঘরের সংখ্যা 300 পর্যন্ত বাড়ান। পুরোটা হাতে লিখতে কতক্ষণ লাগবে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8¾ · Roll numbers (2.6). Amma's four items get a number each, like a class
//      register, so x₃ can mean "the price of item 3".

const ROLL_QS: { ask: string; opts: string[]; right: number; why: string; item: number }[] = [
  { ask: "x₃ কত টাকা?", opts: ["70", "40", "3"], right: 1, why: "x₃ মানে 3 নম্বর জিনিস, আলু: 40 টাকা", item: 2 },
  { ask: "ডিমের দামটাকে কী নামে ডাকবো?", opts: ["x₁", "x₄", "x₁₅₀"], right: 1, why: "ডিম list-এর 4 নম্বর, তাই x₄", item: 3 },
];

export function RollNumbers() {
  const pass = useGate();
  const [numbered, setNumbered] = useState(false);
  const [solved, setSolved] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const q = ROLL_QS[solved];
  const lit = (k: number) => ROLL_QS.slice(0, solved).some((s) => s.item === k);

  const choose = (i: number) => {
    if (!q) return;
    if (i === q.right) {
      const n = solved + 1;
      setSolved(n);
      setWrong([]);
      if (n === ROLL_QS.length) pass("ছোট সংখ্যাটা শুধু বলে list-এর কত নম্বর জিনিস। x₃ মানে “3 নম্বরের দাম”।");
    } else setWrong((w) => (w.includes(i) ? w : [...w, i]));
  };

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-4">
        {BAZAAR.map(([name, x], k) => (
          <div key={name} className={`relative rounded-2xl border-2 px-3 pt-4 pb-3 text-center transition-colors duration-300 ${lit(k) ? "border-cat-violet bg-cat-violet/10" : "border-border"}`}>
            {numbered && (
              <span
                style={{ transitionDelay: `${k * 180}ms` }}
                className={`${POP} absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cat-teal px-2.5 py-0.5 font-mono text-sm font-bold text-white`}
              >
                {k + 1}
              </span>
            )}
            <div className="font-semibold">{name}</div>
            <div className="font-mono">{x} ৳</div>
            {numbered && (
              <div style={{ transitionDelay: `${k * 180 + 400}ms` }} className={`${FADE} mt-1 font-serif text-lg text-cat-violet`}>
                x{sub(k + 1)}
              </div>
            )}
          </div>
        ))}
      </div>
      {!numbered ? (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={() => setNumbered(true)} className={primaryBtn}>
            ক্লাসের মতো রোল নম্বর দিন
          </button>
        </div>
      ) : (
        <div className={FADE}>
          <div className="mt-4 text-center text-[0.95rem]">
            <span className="font-serif text-cat-violet">x</span>-এর নিচের ছোট সংখ্যাটা হলো রোল নম্বর। <span className="font-serif text-cat-violet">x₂</span> মানে “2 নম্বর জিনিসের দাম”।
          </div>
          {ROLL_QS.slice(0, solved).map((s) => (
            <div key={s.ask} className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>
              ✓ {s.why}
            </div>
          ))}
          {q && (
            <div key={solved} className={`${FADE} mt-4`}>
              <div className="text-sm font-medium text-muted">{q.ask}</div>
              <div className="mt-2 grid gap-2">
                {q.opts.map((o, i) => (
                  <Choice key={o} n={i} look={wrong.includes(i) ? "wrong" : "idle"} disabled={wrong.includes(i)} onClick={() => choose(i)}>
                    <span className="font-serif">{o}</span>
                  </Choice>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <Ticks
        items={[
          ["রোল নম্বর", numbered],
          ["দুইটা প্রশ্ন", solved === ROLL_QS.length],
        ]}
      />
      <Task done={solved === ROLL_QS.length}>জিনিসগুলোকে রোল নম্বর দিন, তারপর দুইটা প্রশ্নের উত্তর দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Σ on a bazaar list. The three parts of the sign get a colour each; the
//     reader steps the machine through i = 1…4, then answers Amma by setting
//     where it starts and stops.

const BAZAAR: [string, number][] = [
  ["চাল", 70],
  ["ডাল", 110],
  ["আলু", 40],
  ["ডিম", 150],
];
const ASKS = [
  { say: "শুধু চাল আর ডাল কিনতে কত খরচ হলো?", from: 1, to: 2 },
  { say: "ডাল, আলু আর ডিম মিলে কত?", from: 2, to: 4 },
];
const sumRange = (from: number, to: number) => BAZAAR.slice(from - 1, to).reduce((s, [, x]) => s + x, 0);
const XI = (
  <>
    x<sub className="italic">i</sub>
  </>
);

function SigmaSign({ from, to, body }: { from: ReactNode; to: ReactNode; body: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-serif whitespace-nowrap">
      <span className="flex flex-col items-center leading-none">
        <span key={`to${to}`} className={`${POP} inline-block font-mono text-sm font-bold text-cat-coral`}>
          {to}
        </span>
        <span className="text-5xl leading-none">Σ</span>
        <span key={`from${from}`} className={`${POP} inline-block font-mono text-sm font-bold text-cat-teal`}>
          <i className="font-serif">i</i>={from}
        </span>
      </span>
      <span className="text-2xl font-semibold text-cat-violet">{body}</span>
    </span>
  );
}

function SigmaParts({ body }: { body: ReactNode }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
      <span className="rounded-full bg-cat-teal/10 px-3 py-1 text-cat-teal">নিচে: কোন i থেকে শুরু</span>
      <span className="rounded-full bg-cat-coral/10 px-3 py-1 text-cat-coral">ওপরে: কোন i-তে থামা</span>
      <span className="rounded-full bg-cat-violet/10 px-3 py-1 text-cat-violet">ডানে: প্রতিবার কী যোগ, {body}</span>
    </div>
  );
}

function AmmuSays(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="আম্মু" initial="আ" tint="teal" {...props} />;
}

export function BazaarSigma() {
  const pass = useGate();
  const [k, setK] = useState(0);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(BAZAAR.length);
  const [solved, setSolved] = useState(0);
  const [miss, setMiss] = useState(0);
  const ran = k === BAZAAR.length;
  const ask = ASKS[solved];
  const added = BAZAAR.slice(0, k).map(([, x]) => x);
  const total = added.reduce((s, x) => s + x, 0);
  const live = sumRange(from, to);
  const inRange = (i: number) => (ran ? i + 1 >= from && i + 1 <= to : i < k);

  const check = () => {
    if (!ask) return;
    if (from === ask.from && to === ask.to) {
      const n = solved + 1;
      setSolved(n);
      setMiss(0);
      if (n === ASKS.length) pass("নিচে কোথা থেকে শুরু, ওপরে কোথায় থামা, ডানে কী যোগ। Σ মানে এতটুকুই।");
    } else setMiss(miss + 1);
  };

  return (
    <>
      <div className="mt-5 flex items-center justify-center gap-3 text-lg">
        <SigmaSign from={ran ? from : 1} to={ran ? to : BAZAAR.length} body={XI} />
        <span className="font-mono text-xl">
          ={" "}
          <b key={ran ? live : total} className={`${POP} inline-block`}>
            {ran ? live : total}
          </b>
        </span>
      </div>
      <SigmaParts body={XI} />
      <div className="mt-4 overflow-x-auto">
        <table className="mx-auto font-mono tabular-nums">
          <tbody>
            {BAZAAR.map(([name, x], i) => (
              <tr key={name} className={`transition-colors duration-300 ${inRange(i) ? (ran ? "bg-cat-violet/10" : "bg-accent/10") : ""}`}>
                <td className="w-10 py-1 pl-2 text-right text-sm text-cat-violet">{!ran && i === k - 1 ? "i →" : ""}</td>
                <td className="px-3 py-1 text-sm text-cat-teal">i = {i + 1}</td>
                <td className="px-3 py-1 font-sans">{name}</td>
                <td className="px-3 py-1 text-right">
                  x{sub(i + 1)} = <b>{x}</b> ৳
                </td>
                <td className="w-8 pr-2 text-accent-text">{inRange(i) ? "✓" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!ran ? (
        <>
          <div className="mt-2 text-center font-mono text-[0.95rem]">মোট = {k === 0 ? "0" : `${added.join(" + ")} = ${total}`}</div>
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={() => setK(k + 1)} className={primaryBtn}>
              Σ মেশিন: i = {k + 1} বসান
            </button>
          </div>
        </>
      ) : (
        <>
          {ASKS.slice(0, solved).map((s) => (
            <div key={s.say} className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>
              ✓ i = {s.from} থেকে {s.to}: {sumRange(s.from, s.to)} ৳
            </div>
          ))}
          {ask ? (
            <div key={solved} className={FADE}>
              <AmmuSays>{ask.say}</AmmuSays>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
                <span className="inline-flex items-center gap-2 text-sm text-cat-teal">
                  নিচে (শুরু)
                  <Stepper value={from} min={1} max={to} label="নিচের সংখ্যা" onChange={setFrom} />
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-cat-coral">
                  ওপরে (থামা)
                  <Stepper value={to} min={from} max={BAZAAR.length} label="ওপরের সংখ্যা" onChange={setTo} />
                </span>
              </div>
              <div className="mt-3 flex justify-center">
                <button type="button" onClick={check} className={primaryBtn}>
                  আম্মুকে বলুন: {live} ৳
                </button>
              </div>
              {miss > 0 && (
                <Nope key={miss}>উঁহু! আম্মু কোন কোন জিনিসের কথা বললেন? ওদের রোল নম্বর দেখে নিচে আর ওপরের সংখ্যা বসান।</Nope>
              )}
            </div>
          ) : (
            <AmmuSays tone="good">একদম ঠিক! তুমি তো দেখি Σ মেশিন হয়ে গেছো।</AmmuSays>
          )}
        </>
      )}
      <Ticks
        items={[
          ["মেশিন চালান", ran],
          ["আম্মুর প্রথম প্রশ্ন", solved >= 1],
          ["দ্বিতীয় প্রশ্ন", solved >= 2],
        ]}
      />
      <Task done={solved === ASKS.length}>Σ মেশিনটা একবার পুরো চালান। তারপর নিচের আর ওপরের সংখ্যা বদলে আম্মুর দুইটা প্রশ্নের উত্তর দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · The same machine on the distance formula: each i drops one term into
//      the long sum; then the top number changes and the Σ line does not grow.

const UNFOLD_NS = [5, 40, 300];
const DIFF_I = (
  <>
    (a<sub className="italic">i</sub> − b<sub className="italic">i</sub>)²
  </>
);

export function SigmaUnfold() {
  const pass = useGate();
  const [k, setK] = useState(0);
  const [n, setN] = useState(5);
  const done = k === 5;

  const step = () => {
    const nk = k + 1;
    setK(nk);
    if (nk === 5) pass("এক লাইনের Σ আর পাঁচ term-এর লম্বা লাইন, একই জিনিস।");
  };

  return (
    <>
      <div className="my-5 flex justify-center overflow-x-auto">
        <span className="flex items-center gap-2 font-serif text-lg whitespace-nowrap">
          <i>d</i> =<span className="text-3xl">√</span>
          <span className="border-t-2 border-foreground pt-1">
            <SigmaSign from={1} to={n} body={DIFF_I} />
          </span>
        </span>
      </div>
      <SigmaParts body={DIFF_I} />
      <div className="mt-4 min-h-9 text-center font-serif text-lg">
        {k > 0 && n === 5 && (
          <span key={k} className={FADE}>
            <span className="font-sans text-sm text-cat-teal">i = {k} বসালে</span> → <Term i={k} />
          </span>
        )}
      </div>
      <div className="mt-1 text-center text-xs font-medium text-muted">লম্বা করে লিখলে</div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 overflow-x-auto font-serif text-lg">
        {n === 5 ? (
          <Sum
            terms={[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={`transition-opacity duration-300 ${i <= k ? "opacity-100" : "opacity-20"}`}>
                <Term i={i} pop={false} />
              </span>
            ))}
          />
        ) : (
          <span key={n} className={`${FADE} inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2`}>
            <Sum terms={[<Term key={1} i={1} pop={false} />, <Term key={2} i={2} pop={false} />, <span key="…" className="text-muted">…</span>, <Term key={n} i={n} pop={false} />]} />
          </span>
        )}
      </div>
      {n === 5 && (
        <>
          <div className="mt-3 text-center text-xs font-medium text-muted">p আর q-এর বেলায়, এইমাত্র যা যোগ করলেন</div>
          <div className="mt-1 flex flex-wrap items-baseline justify-center gap-x-1.5 font-mono">
            {SQ_Q.map((x, i) => (
              <span key={i} className={`transition-opacity duration-300 ${i < k ? "opacity-100" : "opacity-20"}`}>
                {i > 0 && <span className="text-muted">+ </span>}
                {nice(x)}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {!done ? (
          <button type="button" onClick={step} className={primaryBtn}>
            Σ মেশিন: i = {k + 1} বসান
          </button>
        ) : (
          <div className={`${FADE} flex flex-wrap items-center justify-center gap-2`}>
            <span className="text-sm text-muted">ওপরের সংখ্যাটা বদলে দেখুন:</span>
            {UNFOLD_NS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setN(v)}
                className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 font-mono text-sm font-semibold transition-colors ${
                  n === v ? "border-cat-coral bg-cat-coral text-white" : "border-border hover:border-cat-coral/60"
                }`}
              >
                n = {v}
              </button>
            ))}
          </div>
        )}
      </div>
      {done && n !== 5 && (
        <div className={`${FADE} mt-2 text-center text-[0.95rem] text-muted`}>Σ-এর লাইনটা একটুও লম্বা হলো না, শুধু ওপরের সংখ্যাটা বদলালো।</div>
      )}
      <Task done={done}>মেশিনটা i = 1 থেকে 5 পর্যন্ত চালান। প্রত্যেক i-তে কোন term-টা যোগ হচ্ছে, খেয়াল করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11 · Three patients on paper, two columns only: the eye and the formula
//      agree on who is nearest p.

const seg = (p: XY, q: XY) => `M${p[0]} ${p[1]}L${q[0]} ${q[1]}`;
const mid = (p: XY, q: XY): XY => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const TP: XY = [45, 130];
const TQ: XY = [47, 128];
const TR: XY = [72, 165];
const tax = (age: number) => 44 + (age - 40) * 7.2;
const tby = (bp: number) => 232 - (bp - 125) * 4.9;
const T_AGES = [40, 45, 50, 55, 60, 65, 70, 75];
const T_BPS = [125, 130, 135, 140, 145, 150, 155, 160, 165, 170];
const T_GRID = T_AGES.map((a) => `M${tax(a)} ${tby(170)}V${tby(125)}`).join("") + T_BPS.map((b) => `M${tax(40)} ${tby(b)}H${tax(76)}`).join("");
const tpt = ([a, b]: XY): XY => [tax(a), tby(b)];

export function ThreePatients() {
  const pass = useGate();
  const [won, setWon] = useState(false);
  const [miss, setMiss] = useState(0);
  const tap = (who: "q" | "r") => {
    if (won) return;
    if (who === "q") {
      setWon(true);
      pass("চোখ বলছে q, formula-ও বলছে q।");
    } else setMiss((m) => m + 1);
  };
  const [p, q, r] = [tpt(TP), tpt(TQ), tpt(TR)];
  const who = (key: "q" | "r", at: XY, tone: string, name: string) => (
    <g role="button" tabIndex={0} aria-label={`রোগী ${name}`} onClick={() => tap(key)} onKeyDown={press(() => tap(key))} className="cursor-pointer outline-none">
      <circle cx={at[0]} cy={at[1]} r={14} className="fill-transparent" />
      <circle cx={at[0]} cy={at[1]} r={5.5} className={tone} />
    </g>
  );

  return (
    <>
      <svg viewBox="0 0 316 262" role="group" aria-label="three patients by age and systolic blood pressure" className="mx-auto my-5 block h-auto w-full max-w-sm select-none">
        <rect x={tax(40)} y={tby(170)} width={tax(76) - tax(40)} height={tby(125) - tby(170)} rx={3} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        <path d={T_GRID} strokeWidth={0.6} className="fill-none stroke-cat-blue/25" />
        {[40, 50, 60, 70].map((a) => (
          <text key={a} x={tax(a)} y={tby(125) + 14} textAnchor="middle" fontSize={9} className="fill-muted font-mono">
            {a}
          </text>
        ))}
        {[130, 140, 150, 160].map((b) => (
          <text key={b} x={tax(40) - 5} y={tby(b) + 3} textAnchor="end" fontSize={9} className="fill-muted font-mono">
            {b}
          </text>
        ))}
        <text x={tax(76)} y={tby(125) + 28} textAnchor="end" fontSize={11} fontWeight={600} className="fill-foreground">
          বয়স →
        </text>
        <text x={tax(40) - 5} y={tby(170) - 4} textAnchor="end" fontSize={10} fontWeight={600} className="fill-foreground">
          ↑ BP
        </text>
        {won && (
          <>
            <Draw d={seg(p, q)} strokeWidth={2.5} className="stroke-cat-blue" />
            <Draw d={seg(p, r)} strokeWidth={2.5} delay={300} className="stroke-cat-coral" />
            <text x={mid(p, r)[0] + 8} y={mid(p, r)[1]} fontSize={10} fontWeight={700} className={`${FADE} fill-cat-coral font-mono delay-700`}>
              44.2
            </text>
          </>
        )}
        <circle cx={p[0]} cy={p[1]} r={6} className="fill-[#0f1b2d]" />
        {who("q", q, "fill-cat-blue", "q")}
        {who("r", r, "fill-cat-coral", "r")}
        <text x={p[0] - 9} y={p[1] - 5} textAnchor="end" fontSize={12} fontWeight={700} className={`${INK} pointer-events-none italic`}>
          p
        </text>
        <text x={q[0] + 9} y={q[1] + 4} fontSize={12} fontWeight={700} className="pointer-events-none fill-cat-blue italic">
          q
        </text>
        <text x={r[0] - 10} y={r[1] + 4} textAnchor="end" fontSize={12} fontWeight={700} className="pointer-events-none fill-cat-coral italic">
          r
        </text>
      </svg>
      {!won && <div className="text-center text-[0.95rem] text-muted">p-এর সবচেয়ে কাছে কে? তার ওপর tap করুন।</div>}
      {miss > 0 && !won && <Nope key={miss}>r? উনি তো কাগজের একদম অন্য কোণায়!</Nope>}
      {won && (
        <div className={`${FADE} mx-auto grid max-w-md gap-1.5 rounded-2xl border border-border px-4 py-3 font-mono text-[1.02rem]`}>
          <div>
            <span className="font-bold text-cat-blue">p আর q</span>: √(2² + 2²) = √8 ≈ <b>2.8</b>
          </div>
          <div>
            <span className="font-bold text-cat-coral">p আর r</span>: √(27² + 35²) = √1954 ≈ <b>44.2</b>
          </div>
        </div>
      )}
      <Task done={won}>p-এর সবচেয়ে কাছের রোগীকে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 12 · Five dimensions by hand. Guess, then feed the Σ machine one column at
//      a time; q's and r's squared gaps drop into two running sums side by
//      side, and at the end the two distances are drawn on one scale.

const P5 = [45, 130, 90, 5.2, 27];
const Q5 = [47, 128, 88, 5.4, 26];
const R5 = [72, 165, 95, 9.1, 34];
const COL5 = ["বয়স", "sys BP", "dia BP", "glucose", "BMI"];
const WHO = ["q-এর সাথে", "r-এর সাথে", "দুইজনের সাথেই সমান"];
const WHO_RIGHT = 0;
const SQ_Q = P5.map((x, i) => (x - Q5[i]) ** 2);
const SQ_R = P5.map((x, i) => (x - R5[i]) ** 2);

function JarRow({ name, parts, tone }: { name: string; parts: number[]; tone: string }) {
  const sum = parts.reduce((s, x) => s + x, 0);
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 font-mono text-[0.95rem]">
      <span className={`w-16 shrink-0 font-sans text-sm font-semibold ${tone}`}>p আর {name}</span>
      {parts.length === 0 ? (
        <span className="text-muted">…</span>
      ) : (
        parts.map((x, i) => (
          <span key={i} className="inline-flex items-baseline gap-1.5">
            {i > 0 && <span className="text-muted">+</span>}
            <span className={`${POP} inline-block rounded-md bg-foreground/[0.05] px-1.5 ${tone}`}>{nice(x)}</span>
          </span>
        ))
      )}
      {parts.length > 1 && (
        <b key={sum} className={`${POP} inline-block`}>
          = {nice(sum)}
        </b>
      )}
    </div>
  );
}

export function WardFive() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const [k, setK] = useState(0);
  const done = k === COL5.length;
  const dq = Math.sqrt(SQ_Q.reduce((s, x) => s + x, 0));
  const dr = Math.sqrt(SQ_R.reduce((s, x) => s + x, 0));
  const c = k - 1;

  const step = () => {
    if (guess === null || done) return;
    const n = k + 1;
    setK(n);
    if (n === COL5.length) pass("3.6 বনাম 45.2। পাঁচ dimension-এ geometry করে ফেললেন, কিছু না দেখেই!");
  };
  const calc = (b: number[], tone: string, name: string) => (
    <div className={tone}>
      {name}: {nice(P5[c])} − {nice(b[c])} = {nice(P5[c] - b[c])} → বর্গ <b>{nice((P5[c] - b[c]) ** 2)}</b>
    </div>
  );

  return (
    <>
      <div className="mt-5 overflow-x-auto pb-1">
        <table className="mx-auto font-mono text-sm tabular-nums">
          <thead>
            <tr className="text-xs text-muted">
              <th />
              {COL5.map((col, i) => (
                <th key={col} className={`rounded-t-md px-1.5 pt-1 font-sans font-normal transition-colors ${i === c ? "bg-cat-violet/10 text-cat-violet" : ""}`}>
                  i={i + 1}
                  <br />
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["p", P5, "font-bold"],
                ["q", Q5, "text-cat-blue"],
                ["r", R5, "text-cat-coral"],
              ] as const
            ).map(([name, v, tone]) => (
              <tr key={name} className={tone}>
                <td className="pr-2 text-right font-semibold">{name}</td>
                {v.map((x, i) => (
                  <td key={i} className={`px-1.5 py-0.5 text-center transition-colors ${i === c ? "bg-cat-violet/10" : ""} ${i < k ? "" : "opacity-60"}`}>
                    {x}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {guess === null ? (
        <>
          <div className="mt-4 text-sm font-medium text-muted">আগে একটা guess: p কার সাথে বেশি মেলে?</div>
          <div className="mt-2 grid gap-2">
            {WHO.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, done, WHO_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mx-auto mt-3 min-h-14 max-w-md text-center font-mono text-sm">
            {k > 0 && (
              <div key={k} className={FADE}>
                <div className="font-sans text-xs text-muted">
                  ঘর {bn(k)}: {COL5[c]}
                </div>
                {calc(Q5, "text-cat-blue", "q")}
                {calc(R5, "text-cat-coral", "r")}
              </div>
            )}
          </div>
          <div className="mx-auto mt-3 grid max-w-md gap-2 rounded-2xl border border-border px-3 py-3">
            <JarRow name="q" parts={SQ_Q.slice(0, k)} tone="text-cat-blue" />
            <JarRow name="r" parts={SQ_R.slice(0, k)} tone="text-cat-coral" />
          </div>
          {!done ? (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={step} className={primaryBtn}>
                Σ মেশিন: ঘর {bn(k + 1)} ({COL5[k]})
              </button>
            </div>
          ) : (
            <div className={`${FADE} mx-auto mt-4 grid max-w-md gap-2`}>
              {(
                [
                  ["q", dq, "bg-cat-blue", "text-cat-blue"],
                  ["r", dr, "bg-cat-coral", "text-cat-coral"],
                ] as const
              ).map(([name, d, fill, ink]) => (
                <div key={name} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 text-sm">
                  <span className={`font-semibold ${ink}`}>p আর {name}</span>
                  <span className="h-4 overflow-hidden rounded-full bg-foreground/5">
                    <span style={{ width: `${(d / dr) * 100}%` }} className={`block h-full rounded-full ${fill}`} />
                  </span>
                  <b className="font-mono">{d.toFixed(1)}</b>
                </div>
              ))}
              <div className="text-center text-xs text-muted">দূরত্ব = যোগফলের বর্গমূল</div>
              <div className="mt-2 grid gap-2">
                {WHO.map((o, i) => (
                  <Choice key={o} n={i} look={predictLook(i, guess, done, WHO_RIGHT)} disabled onClick={() => {}}>
                    {o}
                  </Choice>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <Ticks
        items={[
          ["আগে guess", guess !== null],
          ["পাঁচটা ঘর", done],
        ]}
      />
      <Task done={done}>আগে guess করুন। তারপর Σ মেশিনে এক ঘর এক ঘর করে পাঁচটা ঘরই দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 12½ · Try to bring q closer (2.6). Invent a sixth column, hours of sleep,
//      with p at 7 and q's value on a slider. Its block is (7 − q)², never
//      below zero: the distance grows or stays put, and never shrinks.

const SLEEP_P = 7;
const SLEEP_MAX = 14;
const BASE_Q = SQ_Q.reduce((s, x) => s + x, 0);
const D_BASE = Math.sqrt(BASE_Q);
const D_TOP = Math.sqrt(BASE_Q + SLEEP_P ** 2);

export function NeverShrinks() {
  const pass = useGate();
  const [v, setV] = useState(12);
  const [tried, setTried] = useState<number[]>([12]);
  const gap = SLEEP_P - v;
  const block = gap * gap;
  const d = Math.sqrt(BASE_Q + block);
  const best = tried.includes(SLEEP_P);
  const done = best && tried.length >= 3;

  const move = (x: number) => {
    setV(x);
    if (tried.includes(x)) return;
    const next = [...tried, x];
    setTried(next);
    if (!done && next.includes(SLEEP_P) && next.length >= 3) pass("সবচেয়ে ভালো মান দিলেও নতুন ঘর যোগ করে 0, কমায় না। বর্গ কখনো negative হয় না!");
  };

  return (
    <>
      <div className="mx-auto mt-5 max-w-md rounded-2xl border border-border px-4 py-4">
        <div className="text-center text-sm font-semibold">নতুন ঘর ৬: রাতে কত ঘণ্টা ঘুম</div>
        <div className="mt-3 flex items-center justify-center gap-6 font-mono">
          <span className="text-center">
            <span className="block font-sans text-xs text-muted">p</span>
            <b className="text-xl">{SLEEP_P}</b>
          </span>
          <span className="text-center">
            <span className="block font-sans text-xs text-cat-blue">q</span>
            <b key={v} className={`${POP} inline-block text-xl text-cat-blue`}>
              {v}
            </b>
          </span>
        </div>
        <label className="mt-3 flex items-center gap-3">
          <span className="shrink-0 text-sm text-cat-blue">q-এর ঘুম</span>
          <input
            type="range"
            min={0}
            max={SLEEP_MAX}
            value={v}
            aria-label="q-এর ঘুম, ঘণ্টা"
            onChange={(e) => move(Number(e.target.value))}
            className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
          />
        </label>
        <div className="mt-2 text-center font-mono text-[0.95rem]">
          নতুন ঘরের বর্গ: ({SLEEP_P} − {v})² = ({sg(gap)})² = <b className={block === 0 ? "text-accent-text" : "text-cat-amber"}>{block}</b>
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-md">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-cat-blue">p আর q-এর দূরত্ব</span>
          <span className="font-mono">
            <b key={d.toFixed(2)} className={`${POP} inline-block`}>
              {d.toFixed(2)}
            </b>{" "}
            <span className={block === 0 ? "text-accent-text" : "text-cat-amber"}>{block === 0 ? "(একই, একটুও কমেনি)" : `(+${(d - D_BASE).toFixed(2)})`}</span>
          </span>
        </div>
        <div className="relative mt-1 h-6 overflow-hidden rounded-lg bg-foreground/5">
          <div style={{ width: `${(D_BASE / D_TOP) * 100}%` }} className="absolute inset-y-0 left-0 bg-cat-blue/70" />
          <div
            style={{ left: `${(D_BASE / D_TOP) * 100}%`, width: `${((d - D_BASE) / D_TOP) * 100}%` }}
            className="absolute inset-y-0 bg-cat-amber transition-[width] duration-300 motion-reduce:transition-none"
          />
          <div style={{ left: `${(D_BASE / D_TOP) * 100}%` }} className="absolute inset-y-0 w-0.5 bg-foreground" />
        </div>
        <div style={{ paddingLeft: `calc(${(D_BASE / D_TOP) * 100}% - 2rem)` }} className="mt-0.5 text-xs text-muted">
          আগে {D_BASE.toFixed(2)}
        </div>
      </div>

      <div className="mx-auto mt-3 flex max-w-md flex-wrap justify-center gap-1.5">
        {tried.map((x) => (
          <span key={x} className={`rounded-full px-2 py-0.5 font-mono text-xs ${x === SLEEP_P ? "bg-accent/15 text-accent-text" : "bg-foreground/5 text-muted"}`}>
            {x} ঘণ্টা → {Math.sqrt(BASE_Q + (SLEEP_P - x) ** 2).toFixed(2)}
          </span>
        ))}
      </div>
      {done && (
        <div className={`${FADE} mx-auto mt-3 max-w-md rounded-2xl bg-accent/10 px-4 py-3 text-center text-[0.95rem]`}>
          সবচেয়ে ভালো মান {SLEEP_P} দিলেও দূরত্ব একই থাকে, কমে না। বর্গ কখনো negative হয় না, তাই নতুন ঘর শুধু যোগ করতে পারে।
        </div>
      )}
      <Ticks
        items={[
          ["অন্তত তিনটা মান", tried.length >= 3],
          ["সবচেয়ে ভালো মান", best],
        ]}
      />
      <Task done={done}>Slider টেনে q-এর ঘুম বদলান। এমন একটা মান খুঁজুন, যাতে q, p-এর আরও কাছে চলে আসে!</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 13¾ · One knob (2.8). An old radio: turn the knob, and how much it hisses
//      traces a valley. The slope under the ball says which way is down, and
//      steps that follow it find the quiet bottom.

const QUIET = 6.5;
const hiss = (k: number) => 0.5 * (k - QUIET) ** 2 + 0.4;
const OK_HISS = 0.55;
const VX0 = 26;
const VX1 = 300;
const VY0 = 150;
const vx = (k: number) => VX0 + (k / 10) * (VX1 - VX0);
const vy = (h: number) => VY0 - h * 6;
const VALLEY = Array.from({ length: 101 }, (_, i) => `${i ? "L" : "M"}${vx(i / 10).toFixed(1)} ${vy(hiss(i / 10)).toFixed(1)}`).join("");

function Radio({ k, h }: { k: number; h: number }) {
  const bars = Math.max(1, Math.ceil(Math.min(1, h / 20) * 8));
  return (
    <div className="mx-auto flex w-40 shrink-0 flex-col items-center rounded-2xl border-2 border-[#8a6a48] bg-[#f3e6d3] px-3 py-3">
      <div className="grid grid-cols-6 gap-1">
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} className="size-1.5 rounded-full bg-[#8a6a48]/50" />
        ))}
      </div>
      <svg viewBox="-24 -24 48 48" aria-hidden="true" className="mt-2 size-14">
        <circle r={20} strokeWidth={2} className="fill-[#5b4630] stroke-[#3b2d1e]" />
        <path d="M0 -6V-16" strokeWidth={3.5} strokeLinecap="round" transform={`rotate(${-135 + (k / 10) * 270})`} className="stroke-[#fde68a]" />
      </svg>
      <div className="mt-2 flex items-end gap-0.5" aria-label={`hiss ${bars} of 8`}>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} style={{ height: `${6 + i * 2}px` }} className={`w-1.5 rounded-sm transition-colors ${i < bars ? "bg-cat-coral" : "bg-[#8a6a48]/20"}`} />
        ))}
      </div>
      <div className="mt-1 text-xs text-[#5b4630]">খসখস</div>
    </div>
  );
}

export function OneKnob() {
  const pass = useGate();
  const [k, setK] = useState(1);
  const [walked, setWalked] = useState(false);
  const [turned, setTurned] = useState(false);
  const [shown] = useTween([k], 450);
  const h = hiss(k);
  const low = h < OK_HISS;
  const slope = k - QUIET;
  const bx = vx(shown);
  const by = vy(hiss(shown));
  const arrowLen = Math.min(64, Math.abs(slope) * 14);
  const dir = slope > 0 ? -1 : 1;

  const move = (n: number) => {
    const c = clamp(Math.round(n * 100) / 100, 0, 10);
    setK(c);
    if (!low && hiss(c) < OK_HISS) pass("ঢাল যেদিকে নিচে নেমেছে, knob সেদিকেই ঘোরাতে হয়। শেখার পুরো বুদ্ধিটা আসলে এটুকুই।");
  };
  const turn = (d: number) => {
    setTurned(true);
    move(k + d);
  };
  const walk = () => {
    setWalked(true);
    move(k - 0.35 * slope);
  };

  return (
    <>
      <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row">
        <Radio k={shown} h={hiss(shown)} />
        <svg viewBox="0 0 320 186" role="img" aria-label={`the hiss valley; knob at ${k.toFixed(1)}, hiss ${h.toFixed(1)}`} className="block h-auto w-full max-w-sm select-none">
          <path d={`M${VX0} ${VY0}H${VX1}`} strokeWidth={1} className="stroke-foreground/30" />
          <path d={VALLEY} strokeWidth={2.5} className="fill-none stroke-cat-blue/60" />
          <text x={VX1} y={VY0 + 30} textAnchor="end" fontSize={10} fontWeight={600} className="fill-foreground">
            knob →
          </text>
          <text x={VX0} y={14} fontSize={10} fontWeight={600} className="fill-foreground">
            ↑ খসখস কতটা
          </text>
          <text x={vx(QUIET)} y={VY0 + 14} textAnchor="middle" fontSize={9} className="fill-cat-teal">
            সবচেয়ে চুপ
          </text>
          {!low && (
            <g className="pointer-events-none">
              <path d={`M${bx} ${VY0 + 20}h${dir * arrowLen}`} strokeWidth={3} strokeLinecap="round" className="stroke-cat-coral" />
              <path d={`M${bx + dir * (arrowLen + 6)} ${VY0 + 20}l${-dir * 8} -5v10z`} className="fill-cat-coral" />
              <text x={bx + dir * (arrowLen / 2)} y={VY0 + 34} textAnchor="middle" fontSize={9} className="fill-cat-coral">
                এদিকে গেলে কমবে
              </text>
            </g>
          )}
          <path d={`M${bx} ${by}V${VY0}`} strokeWidth={1} strokeDasharray="3 3" className="stroke-cat-violet/50" />
          <circle cx={bx} cy={by - 7} r={7} className="fill-cat-violet" />
        </svg>
      </div>
      <div className="mt-2 text-center font-mono text-[0.95rem]">
        knob এখন {k.toFixed(1)}-এ, আর খসখস{" "}
        <b key={h.toFixed(1)} className={`${POP} inline-block ${low ? "text-accent-text" : ""}`}>
          {h.toFixed(1)}
        </b>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => turn(-0.5)} disabled={k <= 0} className={`${quietBtn} px-4`}>
          − বাঁয়ে ঘোরান
        </button>
        <button type="button" onClick={() => turn(0.5)} disabled={k >= 10} className={`${quietBtn} px-4`}>
          ডানে ঘোরান +
        </button>
        <button type="button" onClick={walk} disabled={low} className={primaryBtn}>
          লাল arrow ধরে এক পা
        </button>
      </div>
      <Ticks
        items={[
          ["নিজের হাতে ঘুরিয়েছেন", turned],
          ["arrow ধরে পা ফেলেছেন", walked],
          ["খসখস সবচেয়ে কম", low],
        ]}
      />
      <Task done={low}>
        Knob ঘুরিয়ে খসখসটা যতটা পারা যায় কমিয়ে আনুন। একবার নিজের হাতে ঘুরিয়ে দেখুন, একবার লাল arrow ধরে পা ফেলে।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 14 · Two knobs, one vector. Two dials on a machine; the error is a bowl
//      over their settings. Turning one dial by hand is guesswork; each press
//      of the button turns both at once along the negative gradient, drawn as
//      the arrow it is, and that step is itself a vector the size of the knobs.

const FK = makeFrame(-4, 8, -1, 5, 27, 18);
const MIN: XY = [3, 2];
const RATE = 0.3;
const loss = ([a, b]: XY) => (a - MIN[0]) ** 2 / 2 + (b - MIN[1]) ** 2;
/** one step downhill: w − rate × gradient */
const stepOf = ([a, b]: XY): XY => [a - RATE * (a - MIN[0]), b - RATE * 2 * (b - MIN[1])];
const START: XY = [-3, 4.2];
const GOOD = 0.5;
const KNOB_RANGE: [number, number][] = [
  [FK.x0, FK.x1],
  [FK.y0, FK.y1],
];
const signed = (x: number) => (x > 0 ? `+${nice(x)}` : nice(x));

function Dial({
  name,
  v,
  shown,
  range,
  lit,
  delta,
  stamp,
  onTurn,
}: {
  name: string;
  v: number;
  shown: number;
  range: [number, number];
  /** this knob moved on the last press */
  lit: boolean;
  /** how far it moved, shown above it while lit */
  delta: number;
  /** changes on every move, so the highlight replays */
  stamp: number;
  onTurn: (d: number) => void;
}) {
  const [lo, hi] = range;
  const deg = -135 + ((shown - lo) / (hi - lo)) * 270;
  const btn =
    "grid size-8 cursor-pointer place-items-center rounded-full text-lg font-bold text-muted transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-default disabled:opacity-30";
  return (
    <div className="flex flex-col items-center">
      <div className="h-6">
        {lit && (
          <span key={stamp} className={`${POP} inline-block rounded-full bg-cat-coral px-2 font-mono text-sm font-bold text-white`}>
            {signed(delta)}
          </span>
        )}
      </div>
      <div
        className={`rounded-full p-1 transition-[box-shadow,background-color] duration-300 motion-reduce:transition-none ${
          lit ? "bg-cat-coral/10 ring-4 ring-cat-coral/60" : "ring-0 ring-transparent"
        }`}
      >
        <svg viewBox="-30 -30 60 60" aria-hidden="true" className="size-16">
          {Array.from({ length: 11 }, (_, i) => {
            const t = ((-135 + i * 27) * Math.PI) / 180;
            return (
              <path
                key={i}
                d={`M${r1(25 * Math.sin(t))} ${r1(-25 * Math.cos(t))}L${r1(28 * Math.sin(t))} ${r1(-28 * Math.cos(t))}`}
                strokeWidth={1.2}
                className="stroke-foreground/30"
              />
            );
          })}
          <circle r={21} strokeWidth={2} className="fill-surface stroke-foreground/25" />
          <path d="M0 -6V-17" strokeWidth={3.5} strokeLinecap="round" transform={`rotate(${deg})`} className="stroke-cat-violet" />
          <circle r={3} className="fill-foreground/40" />
        </svg>
      </div>
      <div className="mt-1 flex items-center gap-0.5 text-sm">
        <button type="button" aria-label={`${name} কমান`} disabled={v <= lo} onClick={() => onTurn(-0.5)} className={btn}>
          −
        </button>
        <span className="w-24 text-center whitespace-nowrap">
          <span className="text-muted">{name}</span> <span className="font-mono">{nice(v)}</span>
        </span>
        <button type="button" aria-label={`${name} বাড়ান`} disabled={v >= hi} onClick={() => onTurn(0.5)} className={btn}>
          +
        </button>
      </div>
    </div>
  );
}

const KNOB_NAMES = ["sharp", "deep"];

export function KnobStep() {
  const pass = useGate();
  const [path, setPath] = useSeed<XY[]>("path", [START]);
  const [turned, setTurned] = useSeed("turned", false);
  /** what moved on the last press: the red arrow (both knobs), or one knob by hand */
  const [moved, setMoved] = useSeed<"arrow" | 0 | 1 | null>("moved", null);
  const w = path[path.length - 1];
  const before = path.length > 1 ? path[path.length - 2] : w;
  const [tx, ty] = useTween(w, 500);
  const here: XY = [tx, ty];
  const next = stepOf(w);
  const L = loss(w);
  const low = L < GOOD;

  const move = (n: XY, by: "arrow" | 0 | 1) => {
    setPath([...path, n]);
    setMoved(by);
    const byHand = by !== "arrow";
    if (byHand) setTurned(true);
    if ((turned || byHand) && loss(n) < GOOD)
      pass("লাল arrow-এর প্রত্যেক পা-এ sharp আর deep, দুইটা knob-ই একসাথে ঘুরলো। তাই একেকটা পা বলতে লাগলো দুইটা সংখ্যা।");
  };
  const go = () => {
    if (!low) move(stepOf(w), "arrow");
  };
  const turn = (i: 0 | 1, d: number) => {
    const n: XY = [w[0], w[1]];
    n[i] = clamp(Math.round((n[i] + d) * 10) / 10, KNOB_RANGE[i][0], KNOB_RANGE[i][1]);
    if (!same(n, w)) move(n, i);
  };
  const restart = () => {
    setPath([START]);
    setMoved(null);
  };

  return (
    <>
      <div className="mt-5 flex justify-center gap-6">
        {([0, 1] as const).map((i) => (
          <Dial
            key={i}
            name={KNOB_NAMES[i]}
            v={w[i]}
            shown={here[i]}
            range={KNOB_RANGE[i]}
            lit={moved === "arrow" || moved === i}
            delta={w[i] - before[i]}
            stamp={path.length}
            onTurn={(d) => turn(i, d)}
          />
        ))}
      </div>
      <div className="mt-2 min-h-12 text-center text-[0.95rem] leading-snug">
        {moved === "arrow" ? (
          <span key={path.length} className={`${FADE} font-semibold text-cat-coral`}>
            খেয়াল করুন, লাল arrow-এর এক পা-এ sharp আর deep দুইটাই একসাথে ঘুরলো!
          </span>
        ) : moved !== null ? (
          <span key={path.length} className={`${FADE} text-muted`}>
            হাতে ঘোরালে একবারে একটাই knob ঘোরে। এবার শুধু {KNOB_NAMES[moved]} ঘুরলো, আর {KNOB_NAMES[1 - moved]} যেখানে ছিল সেখানেই।
          </span>
        ) : (
          <span className="text-muted">
            গোল গোল দাগগুলো ম্যাপের উচ্চতার দাগের মতো। বাইরের দাগে গানটা সবচেয়ে বেখাপ্পা শোনায়, যত ভেতরে যাবেন ভুল তত কম, আর একদম মাঝখানটা সবচেয়ে নিচু।
          </span>
        )}
      </div>
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
          sharp →
        </Label>
        <Label f={FK} at={[0, FK.y1]} dx={5} dy={10} anchor="start" size={9}>
          ↑ deep
        </Label>
      </Plane>
      <div className="mx-auto grid max-w-sm gap-1 rounded-2xl border border-border px-4 py-3 text-center">
        <div>
          sharp আছে <span className="font-mono">{nice(w[0])}</span>-এ, deep আছে <span className="font-mono">{nice(w[1])}</span>-এ
        </div>
        <div>
          ভুল এখন{" "}
          <b key={L.toFixed(2)} className={`${POP} inline-block font-mono ${low ? "text-accent-text" : ""}`}>
            {L.toFixed(2)}
          </b>
        </div>
        {!low && (
          <div className="text-sm text-cat-coral">
            লাল arrow-এর পরের পা <span className="font-mono">({signed(next[0] - w[0])}, {signed(next[1] - w[1])})</span>। দুই ঘরে দুই knob-এর ঘোরা।
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <button type="button" onClick={go} disabled={low} className={primaryBtn}>
          লাল arrow ধরে এক পা
        </button>
        <button type="button" onClick={restart} disabled={path.length === 1} className={`${quietBtn} px-3`} aria-label="আবার শুরু">
          ↺
        </button>
      </div>
      <Ticks
        items={[
          ["একটা knob নিজের হাতে ঘুরিয়েছেন", turned],
          ["arrow ধরে ভুল কমিয়েছেন", low],
        ]}
      />
      <Task done={turned && low}>
        আগে sharp বা deep, যেকোনো একটা knob নিজের হাতে ঘুরিয়ে দেখুন ভুলটা কমে কিনা। তারপর লাল arrow ধরে পা ফেলতে থাকুন, যতক্ষণ না ভুল {nice(GOOD)}-এর নিচে নামে।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 14¼ · What a gradient is. Same amplifier map, one spot on it. The reader
//      takes one trial step in a few of eight directions and sees the error
//      rise or fall, then points at the steepest climb. Only then: which way
//      lowers the error? Straight against it. That climb is the gradient, and
//      the red arrow of the last screen was its opposite.

const GW: XY = [1, 3];
/** eight directions, counterclockwise from "right" */
const COMPASS: XY[] = Array.from({ length: 8 }, (_, i): XY => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]);
const RISE = COMPASS.map(([dx, dy]) => loss([GW[0] + dx, GW[1] + dy]) - loss(GW));
const UP = RISE.indexOf(Math.max(...RISE));
const GRAD: XY = [GW[0] - MIN[0], 2 * (GW[1] - MIN[1])];
const DIR_NAME = ["ডানে", "ডানে-ওপরে", "ওপরে", "বাঁয়ে-ওপরে", "বাঁয়ে", "বাঁয়ে-নিচে", "নিচে", "ডানে-নিচে"];
const DIR_CELL = [
  "col-start-3 row-start-2",
  "col-start-3 row-start-1",
  "col-start-2 row-start-1",
  "col-start-1 row-start-1",
  "col-start-1 row-start-2",
  "col-start-1 row-start-3",
  "col-start-2 row-start-3",
  "col-start-3 row-start-3",
];
const WAYS = ["চড়াইয়ের arrow ধরেই", "চড়াইয়ের ঠিক উল্টো দিকে", "আড়াআড়ি, পাশের দিকে"];
const WAY_RIGHT = 1;
const TIPS_NEEDED = 4;
const one = (x: number) => (Math.round(Math.abs(x) * 10) / 10).toString();

export function GradientFeel() {
  const pass = useGate();
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const [last, setLast] = useSeed<number | null>("last", null);
  const [found, setFound] = useSeed("found", false);
  const [way, setWay] = useSeed<number | null>("way", null);
  const [miss, setMiss] = useState<{ i: number; n: number } | null>(null);
  const enough = tried.length >= TIPS_NEEDED;
  const tip = (i: number, len = 1): XY => [GW[0] + COMPASS[i][0] * len, GW[1] + COMPASS[i][1] * len];
  const up: XY = [GW[0] + GRAD[0] * 0.45, GW[1] + GRAD[1] * 0.45];
  const down: XY = [GW[0] - GRAD[0] * 0.45, GW[1] - GRAD[1] * 0.45];

  const probe = (i: number) => {
    setLast(i);
    if (!tried.includes(i)) setTried([...tried, i]);
  };
  const point = (i: number) => {
    if (!enough || found) return;
    if (i === UP) {
      setFound(true);
      setMiss(null);
    } else setMiss({ i, n: (miss?.n ?? 0) + 1 });
  };
  const choose = (i: number) => {
    if (way !== null) return;
    setWay(i);
    pass("চড়াইয়ের arrow উল্টে দিলেই সবচেয়ে খাড়া নামার পথ। আগের screen-এর লাল arrow ঠিক এদিকটাই দেখাচ্ছিল।");
  };

  return (
    <>
      <div className="mt-5 text-center text-[0.95rem] leading-snug text-muted">
        ডানে গেলে sharp বাড়ে, ওপরে গেলে deep। বেগুনি বিন্দুতে ভুল এখন {one(loss(GW))}।
      </div>
      <Plane f={FK} ticks={2} label={`the amplifier map; standing at (${GW[0]}, ${GW[1]}), ${tried.length} directions tried`} className="max-w-[24rem]">
        {[8, 4.5, 3, 0.5].map((c, i) => (
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
        {tried.map((i) => {
          const [x, y] = tip(i);
          const [lx2, ly2] = tip(i, 1.6);
          const rise = RISE[i] > 0;
          const pickable = enough && !found;
          const anchor = COMPASS[i][0] > 0.3 ? "start" : COMPASS[i][0] < -0.3 ? "end" : "middle";
          return (
            <g key={i}>
              <path
                d={`M${FK.sx(GW[0])} ${FK.sy(GW[1])}L${FK.sx(x)} ${FK.sy(y)}`}
                strokeWidth={last === i ? 3 : 2}
                strokeLinecap="round"
                className={`pointer-events-none ${rise ? "stroke-cat-coral" : "stroke-cat-teal"}`}
              />
              <Label f={FK} at={[lx2, ly2]} dy={3} anchor={anchor} size={9} className={rise ? "fill-cat-coral" : "fill-cat-teal"}>
                {rise ? "+" : "−"}
                {one(RISE[i])}
              </Label>
              <circle
                cx={FK.sx(x)}
                cy={FK.sy(y)}
                r={pickable ? 7 : 4}
                role={pickable ? "button" : undefined}
                tabIndex={pickable ? 0 : undefined}
                aria-label={pickable ? `${DIR_NAME[i]}-এর পা-টা বেছে নিন` : undefined}
                onClick={() => point(i)}
                onKeyDown={pickable ? press(() => point(i)) : undefined}
                className={`${rise ? "fill-cat-coral" : "fill-cat-teal"} ${pickable ? "animate-pulse cursor-pointer" : "pointer-events-none"} motion-reduce:animate-none`}
              />
            </g>
          );
        })}
        {found && <Arrow key="up" f={FK} from={GW} to={up} tone="violet" w={3.2} draw />}
        {way !== null && <Arrow key="down" f={FK} from={GW} to={down} tone="teal" w={3.2} draw />}
        <circle cx={FK.sx(GW[0])} cy={FK.sy(GW[1])} r={6} className="pointer-events-none fill-cat-violet" />
        <Label f={FK} at={[FK.x1, 0]} dx={-4} dy={-6} anchor="end" size={9}>
          sharp →
        </Label>
        <Label f={FK} at={[FK.x0, FK.y1]} dx={5} dy={10} anchor="start" size={9}>
          ↑ deep
        </Label>
      </Plane>

      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
        <div className="grid shrink-0 grid-cols-3 grid-rows-3 gap-1" role="group" aria-label="কোন দিকে এক পা ফেলবেন">
          {COMPASS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${DIR_NAME[i]} এক পা`}
              aria-pressed={last === i}
              onClick={() => probe(i)}
              className={`${DIR_CELL[i]} grid size-10 cursor-pointer place-items-center rounded-xl border-2 transition-colors ${
                last === i ? "border-cat-violet bg-cat-violet/10" : tried.includes(i) ? "border-border bg-foreground/[0.04]" : "border-border hover:border-cat-violet/60"
              }`}
            >
              <svg viewBox="-10 -10 20 20" aria-hidden="true" className="size-5">
                <path d="M-6 0H5M1 -4L5 0L1 4" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" transform={`rotate(${-45 * i})`} className="fill-none stroke-current" />
              </svg>
            </button>
          ))}
          <span className="col-start-2 row-start-2 grid place-items-center text-xs text-muted">এক পা</span>
        </div>
        <div className="min-h-16 max-w-xs text-center text-[0.95rem] leading-snug sm:text-left">
          {last === null ? (
            <span className="text-muted">বিন্দু থেকে কোন দিকে এক পা ফেলে দেখবেন, পাশের বোতাম থেকে বেছে নিন।</span>
          ) : RISE[last] > 0 ? (
            <span key={last} className={FADE}>
              {DIR_NAME[last]} এক পা ফেলতেই ভুল বেড়ে গেল <b className="font-mono text-cat-coral">{one(RISE[last])}</b>। এটা চড়াই।
            </span>
          ) : (
            <span key={last} className={FADE}>
              {DIR_NAME[last]} এক পা ফেলতেই ভুল কমে গেল <b className="font-mono text-cat-teal">{one(RISE[last])}</b>। এটা ঢাল বেয়ে নামা।
            </span>
          )}
        </div>
      </div>

      {enough && !found && (
        <div className={`${FADE} mt-4 text-center`}>
          <div className="font-semibold">এবার বলুন তো, কোন দিকে পা ফেললে ভুল সবচেয়ে বেশি বাড়ে? ম্যাপে ওই পা-টার মাথার বিন্দুতে tap করুন।</div>
          {miss && (
            <Nope key={miss.n}>
              {RISE[miss.i] <= 0
                ? `উঁহু, ${DIR_NAME[miss.i]} গেলে তো ভুল উল্টো কমে যায়।`
                : tried.includes(UP)
                  ? `${DIR_NAME[miss.i]} গেলে ভুল বাড়ে ${one(RISE[miss.i])}, কিন্তু এর চেয়েও খাড়া একটা দিক আপনি দেখে ফেলেছেন। সংখ্যাগুলো মিলিয়ে দেখুন তো।`
                  : `${DIR_NAME[miss.i]} গেলে ভুল বাড়ে ${one(RISE[miss.i])}। কিন্তু সব দিক কি দেখা হয়েছে? আরেকটু খুঁজে দেখুন।`}
            </Nope>
          )}
        </div>
      )}

      {found && (
        <div className={`${FADE} mt-4`}>
          <div className="text-center text-[0.95rem] leading-snug">
            ঠিক ধরেছেন, এদিকের চড়াইটাই সবচেয়ে খাড়া। হিসাব কষে এই দিকটা arrow হিসেবে লিখলে দাঁড়ায়{" "}
            <b className="font-mono text-cat-violet">
              ({nice(GRAD[0])}, {nice(GRAD[1])})
            </b>
            , মানে sharp কমানো আর deep বাড়ানো।
          </div>
          <div className="mt-3 font-semibold">ভুল কমাতে চাইলে এখান থেকে কোন দিকে পা ফেলবেন?</div>
          <div className="mt-2 grid gap-2">
            {WAYS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, way, way !== null, WAY_RIGHT)} disabled={way !== null} onClick={() => choose(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {way !== null && (
            <div className={`${FADE} mt-2 text-center text-[0.95rem] leading-snug`}>
              {way === WAY_RIGHT ? "একদম! " : way === 0 ? "উঁহু, চড়াই ধরে গেলে তো ভুল আরও বাড়বে। " : "উঁহু, পাশের দিকে গেলে ভুল প্রায় বদলায়ই না। "}
              সবচেয়ে খাড়া নামা হলো চড়াইয়ের ঠিক উল্টো দিকটা,{" "}
              <b className="font-mono text-cat-teal">
                ({nice(-GRAD[0])}, {nice(-GRAD[1])})
              </b>
              ।
            </div>
          )}
        </div>
      )}

      <Ticks
        items={[
          [`${bn(TIPS_NEEDED)}টা দিকে পা ফেলেছেন`, enough],
          ["সবচেয়ে খাড়া চড়াই", found],
          ["নামার পথ", way !== null],
        ]}
      />
      <Task done={way !== null}>
        চারপাশে অন্তত {bn(TIPS_NEEDED)}টা দিকে এক পা করে ফেলে দেখুন ভুল কতটা বাড়ে বা কমে। তারপর সবচেয়ে খাড়া চড়াইটা খুঁজে বের করুন।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 14½ · Where vectors hide. Tap a card and its vector drops onto a ruler of
//      sizes, from a handful of numbers to ten thousand crore. The gradient
//      card asks first: how big, next to the weights? A row of knobs each gets
//      its own "which way, how far", so it lands exactly on the weights.

const RUNGS: { name: string; what: string; size: string; lo: number; hi: number; band: string; ink: string }[] = [
  { name: "Dataset-এর একটা row", what: "একজন রোগীর সব কলাম, বা একটা বাসার সব তথ্য।", size: "5 থেকে 100টা সংখ্যা", lo: 5, hi: 100, band: "fill-cat-blue/30", ink: "fill-cat-blue" },
  { name: "Classifier-এর output", what: "প্রত্যেকটা সম্ভাব্য উত্তরের জন্য একটা করে score।", size: "10 থেকে 1,000টা সংখ্যা", lo: 10, hi: 1000, band: "fill-cat-amber/35", ink: "fill-cat-amber" },
  { name: "একটা embedding", what: "একটা শব্দের মানে, model যেভাবে শিখে নিয়েছে।", size: "300 থেকে 12,288টা সংখ্যা", lo: 300, hi: 12288, band: "fill-cat-teal/30", ink: "fill-cat-teal" },
  { name: "একটা ছবি", what: "প্রত্যেকটা pixel-এর রং, পরপর সাজানো।", size: "784 থেকে 3.6 কোটি সংখ্যা", lo: 784, hi: 3.6e7, band: "fill-cat-coral/30", ink: "fill-cat-coral" },
  { name: "Model-এর weights", what: "Model-এর সবগুলো knob, একটা list-এ।", size: "হাজার থেকে 10,000 কোটি সংখ্যা", lo: 1e3, hi: 1e11, band: "fill-cat-violet/30", ink: "fill-cat-violet" },
  { name: "একটা gradient", what: "কোন knob কোন দিকে কতটা ঘুরবে।", size: "weights-এর ঠিক যতগুলো, ততগুলো", lo: 1e3, hi: 1e11, band: "fill-cat-violet/30", ink: "fill-cat-violet" },
];
const WEIGHTS_CARD = 4;
const GRAD_CARD = 5;
const LX0 = 14;
const LX1 = 306;
const DECADES = 11;
const lx = (v: number) => LX0 + (Math.log10(v) / DECADES) * (LX1 - LX0);
const LANE = 24;
const LTOP = 16;
const RULER: [number, string][] = [
  [0, "1"],
  [2, "100"],
  [4, "10 হাজার"],
  [6, "10 লাখ"],
  [8, "10 কোটি"],
  [10, "1000 কোটি"],
];
const SIZE_GUESS = ["একটাই সংখ্যা, সব knob মিলিয়ে", "weights-এর অর্ধেক", "weights-এর যতগুলো ঘর, ঠিক ততগুলো"];
const SIZE_RIGHT = 2;
const DEMO_W = [0.4, -1.2, 2, 0.7, -0.3, 1.5];
const DEMO_G = ["+0.3", "−1.1", "+0.8", "−0.2", "+1.6", "−0.5"];

/** A little knob drawn at a setting, for the pairing row. */
function MiniKnob({ v }: { v: number }) {
  return (
    <svg viewBox="-12 -12 24 24" aria-hidden="true" className="size-8">
      <circle r={10} strokeWidth={1.5} className="fill-surface stroke-foreground/30" />
      <path d="M0 -3V-8" strokeWidth={2.5} strokeLinecap="round" transform={`rotate(${v * 50})`} className="stroke-cat-violet" />
    </svg>
  );
}

export function VectorLadder() {
  const pass = useGate();
  const [placed, setPlaced] = useSeed<number[]>("placed", []);
  const [asking, setAsking] = useSeed("asking", false);
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [early, setEarly] = useState(0);
  const pair = usePlay(420);
  const paired = guess !== null && pair.k === DEMO_W.length;
  const axisY = LTOP + RUNGS.length * LANE;

  const place = (i: number, from = placed) => {
    if (from.includes(i)) return;
    const next = [...from, i];
    setPlaced(next);
    if (next.length === RUNGS.length) pass("পাঁচ ঘরের একটা row থেকে হাজার কোটি ঘরের weights, সবই vector। আর প্রত্যেক knob-এর জন্য gradient-এ ঠিক একটা করে ঘর।");
  };
  const tap = (i: number) => {
    if (placed.includes(i) || pair.running) return;
    if (i !== GRAD_CARD) return place(i);
    if (!placed.includes(WEIGHTS_CARD)) return setEarly((n) => n + 1);
    setAsking(true);
  };
  const answer = (g: number) => {
    if (guess !== null) return;
    setGuess(g);
    pair.play(DEMO_W.length, () => place(GRAD_CARD, placed));
  };

  return (
    <>
      <svg viewBox={`0 0 320 ${axisY + 22}`} role="img" aria-label="how many numbers each kind of vector holds, on a scale that grows tenfold per step" className="mx-auto my-5 block h-auto w-full max-w-md select-none">
        {Array.from({ length: DECADES + 1 }, (_, d) => (
          <path key={d} d={`M${lx(10 ** d)} ${LTOP - 4}V${axisY}`} strokeWidth={0.6} className="stroke-foreground/10" />
        ))}
        <path d={`M${LX0} ${axisY}H${LX1}`} strokeWidth={1} className="stroke-foreground/40" />
        {RULER.map(([d, t]) => (
          <text key={d} x={lx(10 ** d)} y={axisY + 14} textAnchor="middle" fontSize={8.5} className="fill-muted">
            {t}
          </text>
        ))}
        {RUNGS.map(
          (r, i) =>
            placed.includes(i) && (
              <g key={i} className="pointer-events-none">
                <rect
                  x={lx(r.lo)}
                  y={LTOP + i * LANE + 7}
                  width={lx(r.hi) - lx(r.lo)}
                  height={10}
                  rx={5}
                  className={`${r.band} origin-left transition-[scale,opacity] duration-700 ease-out [transform-box:fill-box] motion-reduce:transition-none starting:scale-x-0 starting:opacity-0`}
                />
                <text x={lx(r.lo)} y={LTOP + i * LANE + 3} fontSize={9} fontWeight={700} className={`${FADE} ${r.ink}`}>
                  {r.name}
                </text>
              </g>
            ),
        )}
      </svg>
      <div className="grid gap-2 sm:grid-cols-2">
        {RUNGS.map((r, i) => {
          const on = placed.includes(i);
          return (
            <button
              key={i}
              type="button"
              aria-pressed={on}
              onClick={() => tap(i)}
              className={`rounded-xl border-2 px-3 py-2 text-left transition-colors ${
                on
                  ? "cursor-default border-border bg-foreground/[0.03]"
                  : i === GRAD_CARD && asking
                    ? "cursor-default border-cat-violet/60 bg-cat-violet/5"
                    : "cursor-pointer border-dashed border-border hover:border-cat-blue/60"
              }`}
            >
              <div className="text-[0.95rem] font-semibold">{r.name}</div>
              {on ? (
                <div className={`${FADE} text-sm leading-snug`}>
                  {r.what} <span className="font-semibold">{r.size}।</span>
                </div>
              ) : (
                <div className="text-xs text-muted">
                  {i === GRAD_CARD && asking ? "নিচে আগে একটা আন্দাজ দিন" : "কত বড় হতে পারে? মনে মনে আন্দাজ করে tap করুন"}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {early > 0 && !placed.includes(WEIGHTS_CARD) && (
        <Nope key={early}>Gradient-এর মাপ weights-এর সাথে জড়ানো। আগে Model-এর weights-এর কার্ডটা খুলে নিন।</Nope>
      )}

      {asking && (
        <div className={`${FADE} mt-5 rounded-2xl border border-cat-violet/40 px-4 py-4`}>
          <div className="font-semibold">Amplifier-এ knob ছিল দুইটা, লাল arrow-এর পা-ও ছিল দুই সংখ্যার। তাহলে weights-এ যত ঘর, gradient-এ কয়টা?</div>
          <div className="mt-3 grid gap-2">
            {SIZE_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, paired, SIZE_RIGHT)} disabled={guess !== null} onClick={() => answer(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {guess !== null && (
            <div className="mt-4 overflow-x-auto pb-1">
              <div className="mx-auto grid w-max grid-cols-[auto_repeat(6,2.75rem)] items-center gap-x-1 gap-y-1 text-center">
                <span className="pr-2 text-right text-sm font-semibold text-cat-violet">weights</span>
                {DEMO_W.map((v, i) => (
                  <span key={i} className="grid place-items-center">
                    <MiniKnob v={v} />
                  </span>
                ))}
                <span />
                {DEMO_W.map((_, i) => (
                  <span key={i} className="h-5 text-muted">
                    {i < pair.k && <span className={`${POP} inline-block`}>↓</span>}
                  </span>
                ))}
                <span className="pr-2 text-right text-sm font-semibold text-cat-coral">gradient</span>
                {DEMO_G.map((g, i) => (
                  <span key={i} className="h-7">
                    {i < pair.k && <span className={`${POP} inline-block rounded-md bg-cat-coral/15 px-1 font-mono text-sm text-cat-coral`}>{g}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-2 min-h-12 text-center text-[0.95rem] leading-snug">
            {guess !== null && !paired && <span className="text-muted">প্রত্যেকটা knob-কে জিজ্ঞেস করা হচ্ছে, “তুমি কোন দিকে কতটা ঘুরবে?”</span>}
            {paired && (
              <span className={FADE}>
                {guess === SIZE_RIGHT ? "ঠিক ধরেছেন! " : "উঁহু, দেখলেন তো? "}
                প্রত্যেক knob নিজের একটা উত্তর পেল, কেউ বাদ গেল না, কেউ দুইটা পেল না। তাই হাজার কোটি knob হলে gradient-এও হাজার কোটি ঘর।
              </span>
            )}
          </div>
        </div>
      )}

      <Task done={placed.length === RUNGS.length}>
        ছয়টা কার্ডই tap করে মিলিয়ে নিন, কোন vector কত বড় ({bn(placed.length)}/{bn(RUNGS.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 15 · Say it out loud. Each card: a line of notation; tapped, its reading.

const CARDS: { see: ReactNode; say: string }[] = [
  { see: <>v ∈ ℝ⁴</>, say: "“v হলো চারটা real number-এর একটা list”, মানে ৪ dimension-এর vector" },
  { see: <>v₂</>, say: "“v-এর দ্বিতীয় component”, মানে list-এর দুই নম্বর ঘরের সংখ্যাটা" },
  { see: <>x ∈ ℝ⁷⁸⁴</>, say: "“x হলো 784টা সংখ্যার list”, মানে একটা 28 × 28 ছবি" },
  {
    see: (
      <>
        <b className="font-black">0</b> ∈ ℝ³
      </>
    ),
    say: "“তিন dimension-এর zero vector”, মানে (0, 0, 0)",
  },
  { see: <>λ ∈ ℝ</>, say: "“lambda একটাই real number”, কোনো list না। এমন একলা সংখ্যাকে বলে scalar" },
  { see: <>u, v ∈ ℝⁿ</>, say: "“u আর v, দুইটাই nটা সংখ্যার list”। ঘর সমান, তাই পাশাপাশি হিসাব করা চলে" },
  { see: <>‖v‖</>, say: "“v-এর length”। কীভাবে মাপতে হয়, সেটা সামনের lesson-এ দেখবো" },
];

export function SayItCards() {
  const pass = useGate();
  const [open, setOpen] = useState<number[]>([]);

  const flip = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === CARDS.length) pass("সাতটা চিহ্ন, আর প্রত্যেকটার পেছনে একটা সোজা বাক্য। বইয়ের ওই লাইনগুলো দেখে এখন আর ভয় লাগার কথা না।");
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
                <span className="mt-1 text-xs text-muted">কী বলতে চাইছে? আগে আন্দাজ করুন, তারপর tap</span>
              )}
            </button>
          );
        })}
      </div>
      <Task done={open.length === CARDS.length}>
        সাতটা কার্ডই উল্টে দেখুন, আপনার আন্দাজের সাথে মিললো কিনা ({bn(open.length)}/{bn(CARDS.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 15½ · Why "u, v ∈ ℝⁿ" matters. The Σ machine pairs two lists box by box:
//      p and q line up all the way, while Nasib's (height, weight) against a
//      patient's (age, BP, glucose) runs out of partners at the third box.

type Rec = { who: string; whose: string; cols: string[]; v: number[] };
const PAIRINGS: { name: string; a: Rec; b: Rec }[] = [
  { name: "p আর q", a: { who: "p", whose: "p-এর", cols: COL5, v: P5 }, b: { who: "q", whose: "q-এর", cols: COL5, v: Q5 } },
  {
    name: "নাসিব আর একজন রোগী",
    a: { who: "নাসিব", whose: "নাসিবের", cols: ["height", "weight"], v: [170, 65] },
    b: { who: "রোগী", whose: "রোগীর", cols: ["বয়স", "BP", "glucose"], v: [45, 130, 5.2] },
  },
];
const SUPS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) => String(n).replace(/\d/g, (d) => SUPS[Number(d)]);
const ORDINAL = ["প্রথম", "দ্বিতীয়", "তৃতীয়", "চতুর্থ", "পঞ্চম"];

export function PairUp() {
  const pass = useGate();
  const [pi, setPi] = useState<number | null>(null);
  const [seen, setSeen] = useState<number[]>([]);
  const run = usePlay(450);
  const pr = pi === null ? null : PAIRINGS[pi];
  const la = pr?.a.v.length ?? 0;
  const lb = pr?.b.v.length ?? 0;
  const cols = Math.max(la, lb);
  const both = Math.min(la, lb);
  const fits = la === lb;
  const stuck = !fits && run.k > both;
  const sum = pr && fits ? pr.a.v.reduce((s, x, i) => s + (x - pr.b.v[i]) ** 2, 0) : 0;

  const choose = (i: number) => {
    if (run.running) return;
    const p = PAIRINGS[i];
    setPi(i);
    const end = p.a.v.length === p.b.v.length ? p.a.v.length : Math.min(p.a.v.length, p.b.v.length) + 1;
    run.play(end, () => {
      const next = seen.includes(i) ? seen : [...seen, i];
      setSeen(next);
      if (next.length === PAIRINGS.length) pass("ঘর সমান হলে প্রত্যেক ঘর তার জোড়া পায়। না হলে কোথাও না কোথাও একজন একা পড়ে যায়, আর তফাত বের করার উপায়ই থাকে না।");
    });
  };

  const row = (r: Rec, tone: string) => (
    <tr>
      <td className={`pr-2 text-right font-sans text-sm font-semibold whitespace-nowrap ${tone}`}>{r.who}</td>
      {Array.from({ length: cols }, (_, i) => (
        <td key={i}>
          {i < r.v.length ? (
            <div className={`min-w-14 rounded-lg border px-1.5 py-1 transition-colors ${tone} ${i < run.k ? "border-current bg-foreground/[0.03]" : "border-border"}`}>
              <div className="font-sans text-[0.7rem] text-muted">{r.cols[i]}</div>
              {r.v[i]}
            </div>
          ) : (
            <div className={`min-w-14 rounded-lg border-2 border-dashed px-1.5 py-1 ${i < run.k ? "border-danger/60 text-danger" : "border-border text-muted"}`}>
              <div className="font-sans text-[0.7rem]">নাই</div>?
            </div>
          )}
        </td>
      ))}
    </tr>
  );

  return (
    <>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {PAIRINGS.map((p, i) => (
          <button key={i} type="button" aria-pressed={pi === i} disabled={run.running} onClick={() => choose(i)} className={pill(pi === i)}>
            {p.name}
          </button>
        ))}
      </div>
      {pr === null ? (
        <div className="mt-4 text-center text-[0.95rem] text-muted">একটা জোড়া বেছে দিন। Σ মেশিন প্রথম ঘরের সাথে প্রথম ঘর, দ্বিতীয়র সাথে দ্বিতীয়, এভাবে মিলিয়ে যাবে।</div>
      ) : (
        <div key={pi} className={FADE}>
          <div className="mt-4 text-center font-serif text-lg">
            {pr.a.who} ∈ ℝ{sup(la)}, {pr.b.who} ∈ ℝ{sup(lb)}{" "}
            <span className={fits ? "text-accent-text" : "text-danger"}>{fits ? "✓ ঘর সমান" : "✗ ঘর সমান না"}</span>
          </div>
          <div className="mt-2 overflow-x-auto pb-1">
            <table className="mx-auto border-separate border-spacing-x-1.5 text-center font-mono text-sm tabular-nums">
              <tbody>
                {row(pr.a, "text-cat-blue")}
                <tr>
                  <td />
                  {Array.from({ length: cols }, (_, i) => (
                    <td key={i} className="h-7">
                      {i < run.k &&
                        (i < both ? (
                          <span className={`${POP} inline-block text-muted`}>↕</span>
                        ) : (
                          <span className={`${POP} inline-block font-bold text-danger`}>✗</span>
                        ))}
                    </td>
                  ))}
                </tr>
                {row(pr.b, "text-cat-coral")}
                {fits && (
                  <tr>
                    <td className="pr-2 text-right font-sans text-xs text-muted">বর্গ</td>
                    {pr.a.v.map((x, i) => (
                      <td key={i} className="pt-1">
                        {i < run.k && <span className={`${POP} inline-block`}>{nice((x - pr.b.v[i]) ** 2)}</span>}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="mt-2 min-h-12 text-center text-[0.95rem]">
        {pr && fits && run.k === cols && (
          <div className={`${FADE} font-semibold text-accent-text`}>প্রত্যেক ঘর তার জোড়া পেয়ে গেল, আর দূরত্ব দাঁড়ালো প্রায় {Math.sqrt(sum).toFixed(1)}।</div>
        )}
        {pr && stuck && (
          <div className={`${FADE} text-danger`}>
            (a{sub(both + 1)} − b{sub(both + 1)})? {la < lb ? pr.a.whose : pr.b.whose} তো {ORDINAL[both]} ঘরই নাই। Σ মেশিন এখানেই আটকে গেল।
          </div>
        )}
      </div>
      <Ticks
        items={[
          ["p আর q", seen.includes(0)],
          ["নাসিব আর রোগী", seen.includes(1)],
        ]}
      />
      <Task done={seen.length === PAIRINGS.length}>দুইটা জোড়াই একবার করে Σ মেশিনে চালিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 16 · The last picture: one line of formula, and n running from 2 to a photo.

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
            <div className="text-muted">ঘর দুইটা হোক বা সাড়ে তিন কোটি, formula-টা টেরই পায় না।</div>
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

// states for `npm run shot`
export const fixtures: Fixtures = {
  KnobStep: {
    arrow: { path: [START, stepOf(START)], turned: false, moved: "arrow" },
    hand: { path: [START, [-2.5, 4.2]], turned: true, moved: 0 },
  },
  GradientFeel: {
    start: {},
    tried: { tried: [0, 2, 4, 6], last: 6 },
    found: { tried: [0, 2, 3, 4, 6, 7], last: 3, found: true },
    way: { tried: [0, 2, 3, 4, 6, 7], last: 3, found: true, way: 1 },
  },
  VectorLadder: {
    asking: { placed: [0, 1, 4], asking: true },
    guessed: { placed: [0, 1, 4], asking: true, guess: 2 },
  },
};
