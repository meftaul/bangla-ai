"use client";

import { useId, useState, type ReactNode } from "react";

import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useSeeded, useTween, type Fixtures } from "@/components/journey/kit";
import { Plane, makeFrame, snap, tup, type Drag, type Frame, type XY } from "@/components/journey/plane";
import { Alpana, ChalkGrid, FISH, ID, LOTUS_C, LOTUS_TIPS, PETALS, Pillar, RoadBed, byCols, partway, pathOf, turnCols, type Move } from "@/components/interactive/road-kit";

// Screens for "Math for AI 6.2 — The alpana on the road, moving every point at
// once", told as a Journey. The plan is 06_journey_specs.md, block 6.2.
//
// Eight screens. 1 seals the bet: four ways to put the paper design on the
// road (twice the size, slanted, mirrored, Nasib's "one square right"), and
// the art sir says one of the four his method can never do. 2 is the old way:
// the reader moves three petal tips by hand and the lotus comes out as spikes.
// 3 turns the whole road 180° about the pillar with one slider, (2, 1) →
// (−2, −1): one rule, every point. 4 runs four moves under the sir's three
// lamps (lines straight, squares equal, pillar in place). 5 is Nasib's slide:
// guess the lamp that goes out, then push; the grid's corner comes off the
// pillar. 6 is the reader's own six verdicts, 7 finishes a grid from two of
// its lines, 8 settles the bet and ties the second rope (6.3).
//
// After the screens come the story scenes and then the watch-only figures,
// each numbered after its screen (1a, 2½, …). The road, the chalk grid, the
// আলপনা and the pillar come from road-kit.tsx, shared by 6.2–6.7. The art sir
// borrows Nana's look, as in 6.1, with his name drawn under his feet.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const OK = "#0d9488";
const BAD = "#e11d48";
const AMBER = "#f59e0b";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** 0 → 1 once, eased, from mount (key the parent to replay); settled in a preview */
function useRise(ms: number) {
  const seeded = useSeeded();
  return useTween([1], ms, seeded ? undefined : [0])[0];
}

const r1 = (n: number) => {
  const v = Math.round(n * 10) / 10;
  return Object.is(v, -0) ? 0 : v;
};

// ---------------------------------------------------------------------------
// The moves this journey plays with. Each is paper → road.

/** the plain paper: every point stays */
const A_ID: Move = byCols(ID);
const A_BIG = byCols([
  [2, 0],
  [0, 2],
]);
const A_SLANT = byCols([
  [1, 0],
  [0.5, 1],
]);
const A_MIRROR = byCols([
  [-1, 0],
  [0, 1],
]);
const A_SLIDE: Move = (p) => [p[0] + 1, p[1]];
const A_STRETCH = byCols([
  [1.5, 0],
  [0, 1],
]);
const A_TURN30 = byCols(turnCols(30));
/** a hand fan: lines stay straight, but the squares widen as they go up */
const A_FAN: Move = (p) => [p[0] * (1 + 0.1 * p[1]), p[1]];
/** the fair's crooked mirror: everything swells away from the pillar, lines bend */
const A_BULGE: Move = (p) => {
  const s = 1 + 0.05 * Math.hypot(p[0], p[1]);
  return [p[0] * s, p[1] * s];
};
const A_WAVE: Move = (p) => [p[0], p[1] + 0.35 * Math.sin(p[0] * 1.3)];

/** the three lamps: lines straight, squares equal, pillar in place */
type Lamps = [boolean, boolean, boolean];
const LAMP_NAMES = ["লাইন সোজা", "ঘর সমান", "খুঁটি জায়গায়"];

// ---------------------------------------------------------------------------
// Shared drawing.

/** The road as a Plane: asphalt, and everything on it clipped to the asphalt. */
function A_Road({ f, label, className = "max-w-[20rem]", drag, children }: { f: Frame; label: string; className?: string; drag?: Drag; children: ReactNode }) {
  const id = `road${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Plane f={f} paper={false} grid={0} axes={false} label={label} drag={drag} className={`my-0! ${className}`}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
        </clipPath>
      </defs>
      <RoadBed f={f} />
      <g clipPath={`url(#${id})`}>{children}</g>
    </Plane>
  );
}

type Box = [number, number, number, number];

/** The grid and the আলপনা carried from the plain paper to `move`, played on mount. */
function A_Moving({ f, move, box, ms = 900, fish = true }: { f: Frame; move: Move; box: Box; ms?: number; fish?: boolean }) {
  const t = useRise(ms);
  const m = partway(move, t);
  const c = m([0, 0]);
  return (
    <>
      <ChalkGrid f={f} move={m} ghost x0={box[0]} x1={box[1]} y0={box[2]} y1={box[3]} />
      <Alpana f={f} move={m} fish={fish} />
      <Pillar f={f} at={c} off={Math.hypot(c[0], c[1]) > 0.05} />
    </>
  );
}

/** A lamp: lit, out (with a cross), or not yet tried. */
function A_Bulb({ on }: { on: boolean | null }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0">
      <circle cx={8} cy={8} r={6.5} fill={on === true ? "#fbbf24" : on === false ? "#fecdd3" : "none"} stroke={on === true ? "#d97706" : on === false ? BAD : "currentColor"} strokeOpacity={on === null ? 0.4 : 1} strokeWidth={1.4} />
      {on === true && <circle cx={8} cy={8} r={3} fill="#fef3c7" />}
      {on === false && <path d="M5.2 5.2l5.6 5.6m0 -5.6l-5.6 5.6" stroke={BAD} strokeWidth={1.6} strokeLinecap="round" />}
    </svg>
  );
}

/** The art sir's three lamps in a row. `lamps` null: not tried yet. */
function A_Lamps({ lamps }: { lamps: Lamps | null }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm">
      {LAMP_NAMES.map((n, i) => (
        <span key={n} className={`inline-flex items-center gap-1.5 ${lamps === null ? "text-muted" : lamps[i] ? "text-foreground" : "font-semibold text-danger"}`}>
          <span key={lamps ? String(lamps[i]) : "x"} className={lamps && !lamps[i] ? POP : ""}>
            <A_Bulb on={lamps ? lamps[i] : null} />
          </span>
          {n}
        </span>
      ))}
    </div>
  );
}

/** The lamps, lit only once the move has landed (key it per play, with the play's `ms`). */
function A_LateLamps({ lamps, ms }: { lamps: Lamps; ms: number }) {
  const t = useRise(ms);
  return <A_Lamps lamps={t >= 1 ? lamps : null} />;
}

/** A tick or a cross, drawn as paths (the glyphs turn into emoji on Linux). */
function A_Mark({ x, y, ok, r = 9 }: { x: number; y: number; ok: boolean; r?: number }) {
  return (
    <g className={POP}>
      <circle cx={x} cy={y} r={r} fill={ok ? OK : BAD} />
      {ok ? (
        <path d={`M${x - r * 0.45} ${y}l${r * 0.3} ${r * 0.35}l${r * 0.6} -${r * 0.7}`} stroke="white" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={`M${x - r * 0.4} ${y - r * 0.4}l${r * 0.8} ${r * 0.8}m0 -${r * 0.8}l-${r * 0.8} ${r * 0.8}`} stroke="white" strokeWidth={2} strokeLinecap="round" />
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1 · The bet. Four proposals, each a small road: the plain chalk grid pinned
//     at the pillar, the paper design faint where it was, and the proposed
//     design gliding into place. They all look fine. The reader seals the one
//     the sir's method can't do; unmarked until the last screen.

type Proposal = { who: string; how: string; move: Move; frame: Box };
export const A_PROPOSALS: Proposal[] = [
  { who: "ফাহিম", how: "বড় করে, দ্বিগুণ", move: A_BIG, frame: [-1, 12, -1, 10.6] },
  { who: "সামিন", how: "কাত করে", move: A_SLANT, frame: [-1, 9, -1, 6] },
  { who: "সোম", how: "উল্টা করে, আয়নার মতো", move: A_MIRROR, frame: [-7, 7, -1, 6] },
  { who: "নাসিব", how: "যেমন আছে, শুধু এক ঘর ডানে", move: A_SLIDE, frame: [-1, 8, -1, 6] },
];

/** One proposal on its own small road. The grid stays; only the design moves. */
function A_BetThumb({ p, rise = true }: { p: Proposal; rise?: boolean }) {
  const [x0, x1, y0, y1] = p.frame;
  const f = makeFrame(x0, x1, y0, y1, 108 / (x1 - x0), 4);
  const t = useRise(rise ? 1000 : 0);
  const m = partway(p.move, rise ? t : 1);
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} aria-hidden="true" className="block h-16 w-24 shrink-0">
      <RoadBed f={f} />
      <ChalkGrid f={f} move={A_ID} x0={Math.ceil(x0)} x1={Math.floor(x1)} y0={Math.ceil(y0)} y1={Math.floor(y1)} />
      <Alpana f={f} move={A_ID} faint />
      <Alpana f={f} move={m} />
      <Pillar f={f} />
    </svg>
  );
}

/**
 * The sealed bet, acted out: the picked proposal on a bigger road. The paper
 * design lies faint where it was, the proposed one glides out of it, and a
 * "?" lands by the pillar: whether the sir's rule allows it is not said yet.
 */
function A_BetStage({ p }: { p: Proposal }) {
  const [x0, x1, y0, y1] = p.frame;
  const f = makeFrame(x0, x1, y0, y1, 190 / (x1 - x0), 6);
  const t = useRise(1300);
  return (
    <A_Road f={f} label={`${p.who} এর প্রস্তাব রাস্তায়: ${p.how}; স্যারের নিয়মে হয় কি-না, প্রশ্নবোধক`} className="mx-auto max-w-[12rem]">
      <ChalkGrid f={f} move={A_ID} x0={Math.ceil(x0)} x1={Math.floor(x1)} y0={Math.ceil(y0)} y1={Math.floor(y1)} />
      <Alpana f={f} move={A_ID} faint />
      <Alpana f={f} move={partway(p.move, t)} />
      <Pillar f={f} />
      {t > 0.98 && (
        <g className={POP}>
          <circle cx={f.W - 20} cy={20} r={13} fill="white" />
          <text x={f.W - 20} y={26.5} textAnchor="middle" fontSize={18} fontWeight={800} fill={INK}>
            ?
          </text>
        </g>
      )}
    </A_Road>
  );
}

export function AlpanaBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const play = usePlay(1400);
  const seal = (i: number) => {
    setBet(i);
    play.play(1, () => pass("বাজি সিল হলো। আগে স্যারের নিয়মটা বুঝি।"));
  };
  return (
    <>
      {bet !== null && (
        <div className="mb-2">
          <A_BetStage p={A_PROPOSALS[bet]} />
        </div>
      )}
      <div className="grid gap-2">
        {A_PROPOSALS.map((p, i) => (
          <Choice key={p.who} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            <span className="flex items-center gap-3">
              {bet === null && <A_BetThumb p={p} />}
              <span>
                <span className="block font-semibold">{p.who}</span>
                <span className="block text-sm text-muted">{p.how}</span>
              </span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>চারটার কোনটা স্যারের নিয়মে হয় না? একটার উপরে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · One point at a time. "Twice the size", by hand: the reader drags three
//     petal tips to their doubled places. A wrong drop bounces back. Each tip
//     that moves drags only itself, so the petals turn into long spikes while
//     the rest of the lotus and the fish stay put.

const OP_F = makeFrame(-0.5, 10.5, -0.5, 8.5, 24, 6);
const OP_TIPS = [0, 2, 4]; // which of LOTUS_TIPS the reader moves
const dbl = (p: XY): XY => [p[0] * 2, p[1] * 2];

/**
 * A wrong drop, played out: the petal as it would be with its tip where it was
 * dropped (red, dashed), then the tip slides back home along it.
 */
function OP_Miss({ i, to }: { i: number; to: XY }) {
  const t = useRise(900);
  const home = LOTUS_TIPS[OP_TIPS[i]];
  const at: XY = [to[0] + (home[0] - to[0]) * t, to[1] + (home[1] - to[1]) * t];
  const pts = PETALS[OP_TIPS[i]].map((q, n) => (n === 2 ? to : q));
  return (
    <g className="pointer-events-none">
      <path d={pathOf(OP_F, A_ID, pts, true)} fill={BAD} fillOpacity={0.18} stroke={BAD} strokeWidth={1.4} strokeDasharray="4 3" strokeLinejoin="round" opacity={1 - 0.5 * t} />
      <circle cx={OP_F.sx(to[0])} cy={OP_F.sy(to[1])} r={7} fill="none" stroke={BAD} strokeWidth={1.6} />
      {t < 1 && <circle cx={OP_F.sx(at[0])} cy={OP_F.sy(at[1])} r={5} fill="white" stroke={BAD} strokeWidth={2} />}
    </g>
  );
}

export function OnePointAtATime() {
  const pass = useGate();
  const [placed, setPlaced] = useSeed<boolean[]>("placed", [false, false, false]);
  const [held, setHeld] = useState<number | null>(null);
  const [at, setAt] = useState<XY>([0, 0]);
  const [miss, setMiss] = useSeed<{ i: number; to: XY; n: number } | null>("miss", null);

  const tipOf = (j: number): XY => (placed[j] ? dbl(LOTUS_TIPS[OP_TIPS[j]]) : held === j ? at : LOTUS_TIPS[OP_TIPS[j]]);
  const drag: Drag = {
    down: (p) => {
      let best = -1;
      let bd = 1.2;
      OP_TIPS.forEach((ti, j) => {
        if (placed[j]) return;
        const d = Math.hypot(p[0] - LOTUS_TIPS[ti][0], p[1] - LOTUS_TIPS[ti][1]);
        if (d < bd) {
          bd = d;
          best = j;
        }
      });
      if (best >= 0) {
        setHeld(best);
        setAt(p);
      }
    },
    move: (p) => held !== null && setAt(p),
    up: () => {
      if (held === null) return;
      const s = snap(at, OP_F);
      const want = dbl(LOTUS_TIPS[OP_TIPS[held]]);
      if (s[0] === want[0] && s[1] === want[1]) {
        const next = placed.map((v, j) => v || j === held);
        setPlaced(next);
        setMiss(null);
        if (next.every(Boolean)) pass("এক এক করে সরালে শেষ হয় না, আর পদ্মটা বেঁকে যায়।");
      } else if (Math.hypot(s[0] - LOTUS_TIPS[OP_TIPS[held]][0], s[1] - LOTUS_TIPS[OP_TIPS[held]][1]) > 0.5) {
        setMiss({ i: held, to: s, n: (miss?.n ?? 0) + 1 });
      }
      setHeld(null);
    },
  };

  // the petals, each with its tip possibly pulled away
  const petal = (i: number) => {
    const j = OP_TIPS.indexOf(i);
    const pts = PETALS[i].map((q, n) => (n === 2 && j >= 0 ? tipOf(j) : q));
    return pathOf(OP_F, A_ID, pts, true);
  };
  const done = placed.filter(Boolean).length;

  return (
    <>
      <A_Road f={OP_F} drag={drag} label="রাস্তায় chalk এর grid; পদ্মের তিনটা পাপড়ির মাথা টেনে দ্বিগুণ দূরে নিতে হবে" className="max-w-[20rem]">
        <ChalkGrid f={OP_F} move={A_ID} x0={0} x1={10} y0={0} y1={8} />
        {PETALS.map((_, i) => (
          <path key={i} d={petal(i)} fill="#f472b6" fillOpacity={0.85} stroke="#f8fafc" strokeWidth={1.1} strokeLinejoin="round" />
        ))}
        <circle cx={OP_F.sx(LOTUS_C[0])} cy={OP_F.sy(LOTUS_C[1])} r={3} fill="#fde047" stroke="#f8fafc" />
        <path d={pathOf(OP_F, A_ID, FISH, true)} fill="#fbbf24" fillOpacity={0.9} stroke="#f8fafc" strokeWidth={1.1} />
        <Pillar f={OP_F} />
        {miss && !placed[miss.i] && held === null && <OP_Miss key={miss.n} i={miss.i} to={miss.to} />}
        {OP_TIPS.map((ti, j) => {
          const p = tipOf(j);
          const lab = placed[j] ? dbl(LOTUS_TIPS[ti]) : held === j ? snap(at, OP_F) : LOTUS_TIPS[ti];
          // labels sit away from the fish and inside the road
          const right = p[0] < 1.5 || (p[0] >= 4.5 && p[0] <= 8);
          return (
            <g key={ti}>
              <circle cx={OP_F.sx(p[0])} cy={OP_F.sy(p[1])} r={placed[j] ? 4 : 6} fill={placed[j] ? OK : "white"} stroke={placed[j] ? "white" : AMBER} strokeWidth={2} />
              <text x={OP_F.sx(p[0]) + (right ? 8 : -8)} y={OP_F.sy(p[1]) + (p[1] > 7 || p[0] < 1.5 || (placed[j] && p[0] < 4.5) ? 16 : -7)} textAnchor={right ? "start" : "end"} fontSize={10} fontFamily={MONO} fontWeight={700} fill="white" stroke="#374151" strokeWidth={3} paintOrder="stroke">
                {tup(lab)}
              </text>
            </g>
          );
        })}
      </A_Road>
      <div className="mt-2 text-center text-sm text-muted">
        {done < 3 ? (
          <>
            সরানো হয়েছে <span className="font-mono font-semibold text-foreground">{done}</span> টা point। সাদা গোল্লা টেনে নিন।
          </>
        ) : (
          <span className={FADE}>
            <span className="font-mono font-semibold text-foreground">3</span> টা point শেষ। পাপড়ির গা, পদ্মের মাঝখান, পুরা মাছ? সব এখনো আগের জায়গায়।
          </span>
        )}
      </div>
      {miss && !placed[miss.i] && (
        <Nope key={miss.n}>
          {tup(miss.to)} না। {tup(LOTUS_TIPS[OP_TIPS[miss.i]])} এর দুইটা সংখ্যাকেই দ্বিগুণ করুন।
        </Nope>
      )}
      <Task done={done === 3}>তিনটা পাপড়ির মাথা টেনে দ্বিগুণ জায়গায় বসান। প্রত্যেকটা সংখ্যা দুই দিয়ে গুণ।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The whole grid. One slider turns the road about the pillar, 0 → 180°:
//     every chalk line, every petal and the fish turn together. Two points
//     are tracked with arrows from the pillar: (2, 1) and a petal tip (3, 4).

const WG_F = makeFrame(-6.5, 6.5, -6, 5.5, 22, 6);
const WG_PTS: XY[] = [
  [2, 1],
  [3, 4],
];

export function WholeGrid() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 0);
  const [done, setDone] = useSeed("done", false);
  const m = byCols(turnCols(deg));
  const turn = (d: number) => {
    setDeg(d);
    if (d === 180 && !done) {
      setDone(true);
      pass("একটা rule, সব point একসাথে।");
    }
  };
  return (
    <>
      <A_Road f={WG_F} label={`পুরা রাস্তা খুঁটির চারপাশে ${deg} ডিগ্রি ঘুরেছে; (2, 1) এখন ${tup(m([2, 1]).map(r1))}`}>
        <ChalkGrid f={WG_F} move={m} ghost x0={-1} x1={7} y0={-1} y1={6} />
        <Alpana f={WG_F} move={m} />
        {WG_PTS.map((p, i) => {
          const q = m(p);
          return (
            <g key={i}>
              <path d={`M${WG_F.sx(0)} ${WG_F.sy(0)}L${WG_F.sx(q[0])} ${WG_F.sy(q[1])}`} stroke={i ? "#a78bfa" : "#38bdf8"} strokeWidth={2.4} strokeLinecap="round" />
              <circle cx={WG_F.sx(q[0])} cy={WG_F.sy(q[1])} r={4} fill={i ? "#a78bfa" : "#38bdf8"} stroke="white" strokeWidth={1.2} />
            </g>
          );
        })}
        <Pillar f={WG_F} />
      </A_Road>
      <input
        type="range"
        min={0}
        max={180}
        step={5}
        value={deg}
        aria-label="কত ডিগ্রি ঘুরবে"
        onChange={(e) => turn(Number(e.target.value))}
        className="mx-auto mt-3 block w-full max-w-[18rem] cursor-pointer accent-[#f59e0b]"
      />
      <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-sm">
        <span className="font-semibold">{deg}°</span>
        <span className="text-[#0284c7]">
          (2, 1) → {tup(m([2, 1]).map(r1))}
        </span>
        <span className="text-[#7c3aed]">
          (3, 4) → {tup(m([3, 4]).map(r1))}
        </span>
      </div>
      <Task done={done}>Slider টেনে পুরা রাস্তা খুঁটির চারপাশে 180° ঘুরান। নীল আর বেগুনি বিন্দু দুইটার সংখ্যা দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The sir's three lamps. Four moves, each played from the plain road:
//     stretched sideways and turned pass all three; the fan keeps lines
//     straight but not the squares; the crooked mirror bends the lines.

const SS_F = makeFrame(-4, 9.5, -2, 7.5, 21, 6);
const SS_BOX: Box = [-1, 6, -1, 5];
export const SS_MOVES: { name: string; move: Move; lamps: Lamps }[] = [
  { name: "পাশে টানা", move: A_STRETCH, lamps: [true, true, true] },
  { name: "ঘোরানো", move: A_TURN30, lamps: [true, true, true] },
  { name: "পাখা", move: A_FAN, lamps: [true, false, true] },
  { name: "বাঁকা আয়না", move: A_BULGE, lamps: [false, false, true] },
];

export function StraightStays() {
  const pass = useGate();
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const [tried, setTried] = useSeed<boolean[]>("tried", [false, false, false, false]);
  const run = (i: number) => {
    setCur(i);
    const next = tried.map((v, j) => v || j === i);
    setTried(next);
    if (next.every(Boolean) && !tried.every(Boolean)) pass("লাইন সোজা, ঘর সমান, খুঁটি নড়ে না।");
  };
  const mv = cur === null ? null : SS_MOVES[cur];
  return (
    <>
      <A_Road f={SS_F} label={mv ? `${mv.name}: রাস্তার grid আর আলপনা নড়েছে` : "রাস্তার grid আর আলপনা, খুঁটিতে বাঁধা"}>
        <A_Moving key={cur ?? -1} f={SS_F} move={mv ? mv.move : A_ID} box={SS_BOX} />
      </A_Road>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {SS_MOVES.map((m, i) => (
          <button key={m.name} type="button" onClick={() => run(i)} className={`${cur === i ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"} cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors motion-reduce:transition-none`}>
            {m.name}
          </button>
        ))}
      </div>
      {mv ? <A_LateLamps key={cur} lamps={mv.lamps} ms={900} /> : <A_Lamps lamps={null} />}
      <Ticks items={SS_MOVES.map((m, i) => [m.name, tried[i]] as [string, boolean])} />
      <Task done={tried.every(Boolean)}>চারটা move একে একে চালান। প্রতিবার দেখুন কোন বাতি জ্বলে, কোনটা নেভে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Nasib's slide. Guess first which lamp goes out (or none); then push the
//     road one square right. Lines stay straight, squares stay equal, and the
//     grid's corner comes off the pillar.

const SL_F = makeFrame(-1.5, 8.5, -1.5, 6.5, 26, 6);
const SL_GUESS = ["তিনটা বাতিই জ্বলবে", "“লাইন সোজা” নিভবে", "“খুঁটি জায়গায়” নিভবে"];
const SL_RIGHT = 2;
/** each guess as the lamps it means: all lit, the first out, the third out */
const SL_PIC: Lamps[] = [
  [true, true, true],
  [false, true, true],
  [true, true, false],
];

/** a guess drawn as the sir's three lamps, the one it says goes out crossed */
function SL_Pic({ lamps }: { lamps: Lamps }) {
  return (
    <span className="flex shrink-0 gap-0.5" aria-hidden="true">
      {lamps.map((on, i) => (
        <A_Bulb key={i} on={on} />
      ))}
    </span>
  );
}

export function SlideTheAlpana() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [slid, setSlid] = useSeed("slid", false);
  const play = usePlay(1150);
  const push = () => {
    setSlid(true);
    play.play(1, () => pass("সরালে খুঁটির কোণাও সরে। তাই এটা হয় না।"));
  };
  const landed = slid && !play.running;
  return (
    <>
      <A_Road f={SL_F} className="max-w-[15rem]" label={slid ? "পুরা grid এক ঘর ডানে সরেছে; grid এর কোণা আর খুঁটিতে নাই" : "রাস্তার grid আর আলপনা, খুঁটিতে বাঁধা"}>
        <A_Moving key={slid ? 1 : 0} f={SL_F} move={slid ? A_SLIDE : A_ID} box={[-1, 8, -1, 6]} ms={1100} />
        {landed && (
          <g className={FADE}>
            <circle cx={SL_F.sx(0)} cy={SL_F.sy(0)} r={12} fill="none" stroke={BAD} strokeWidth={1.6} strokeDasharray="3 2" />
            <path d={`M${SL_F.sx(0) + 8} ${SL_F.sy(-0.75)}H${SL_F.sx(1) - 6}`} stroke={BAD} strokeWidth={1.6} strokeDasharray="3 2" />
            <path d={`M${SL_F.sx(1) - 10} ${SL_F.sy(-0.75) - 4}l5 4l-5 4`} stroke={BAD} strokeWidth={1.6} fill="none" />
          </g>
        )}
      </A_Road>
      {guess !== null && !slid && (
        <div className={`mt-3 flex justify-center ${FADE}`}>
          <button type="button" onClick={push} className={primaryBtn}>
            এক ঘর ডানে ঠেলুন
          </button>
        </div>
      )}
      {slid && <A_LateLamps lamps={[true, true, false]} ms={1100} />}
      <div className="mt-3 text-sm font-medium text-muted">নাসিবের move এ স্যারের তিনটা বাতির কী হবে?</div>
      <div className="mt-2 grid gap-2">
        {SL_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, landed, SL_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="flex items-center gap-2.5">
              <SL_Pic lamps={SL_PIC[i]} />
              <span>{o}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={landed}>আগে একটা guess দিন, তারপর পুরা রাস্তা এক ঘর ডানে ঠেলে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn: six moves, one at a time. Each plays on the road; the reader
//     says হয় or হয় না. A wrong verdict lights the lamps, the failing one
//     red, and replays the move.

const YM_F = makeFrame(-6, 7.5, -1.5, 7, 21, 6);
const YM_BOX: Box = [-1, 6, -1, 5];
const YM_MID: XY = [3, 2.5];
export const YM_MOVES: { name: string; move: Move; lamps: Lamps }[] = [
  { name: "খুঁটির চারপাশে 90° ঘোরানো", move: byCols(turnCols(90)), lamps: [true, true, true] },
  { name: "রাস্তার মাঝখানের চারপাশে 90° ঘোরানো", move: (p) => [YM_MID[0] - (p[1] - YM_MID[1]), YM_MID[1] + (p[0] - YM_MID[0])], lamps: [true, true, false] },
  {
    name: "অর্ধেক ছোট",
    move: byCols([
      [0.5, 0],
      [0, 0.5],
    ]),
    lamps: [true, true, true],
  },
  { name: "ঢেউ খেলানো", move: A_WAVE, lamps: [false, false, true] },
  {
    name: "চ্যাপ্টা করে একটা লাইনে",
    move: byCols([
      [0.5, 0.25],
      [0.5, 0.25],
    ]),
    lamps: [true, true, true],
  },
  { name: "এক ঘর উপরে সরানো", move: (p) => [p[0], p[1] + 1], lamps: [true, true, false] },
];
const yes = (l: Lamps) => l.every(Boolean);

export function YourMoves() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pick, setPick] = useSeed<boolean | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const over = round >= YM_MOVES.length;
  const mv = YM_MOVES[Math.min(round, YM_MOVES.length - 1)];
  const right = pick !== null && pick === yes(mv.lamps);
  // every verdict replays the move on the road; the lamps and "next" wait for it to land
  const play = usePlay(1150);
  const landed = !play.running;
  const answer = (v: boolean) => {
    setPick(v);
    const ok = v === yes(mv.lamps);
    if (!ok) setMiss(miss + 1);
    play.play(1, () => {
      if (ok && round === YM_MOVES.length - 1) pass("খুঁটি নড়লেই বাদ। চ্যাপ্টা হলেও চলে।");
    });
  };
  const next = () => {
    setRound(round + 1);
    setPick(null);
  };
  return (
    <>
      <div className="mb-2 flex items-center justify-center gap-1.5" aria-label={`${YM_MOVES.length} টার মধ্যে ${Math.min(round + (right ? 1 : 0), 6)} টা শেষ`}>
        {YM_MOVES.map((_, i) => (
          <span key={i} className={`size-2 rounded-full ${i < round || (i === round && right) ? "bg-accent" : i === round ? "bg-cat-blue" : "bg-border"}`} />
        ))}
      </div>
      <A_Road f={YM_F} label={`${mv.name}: রাস্তার grid আর আলপনা নড়ছে`}>
        <A_Moving key={`${round}-${miss}-${right ? 1 : 0}`} f={YM_F} move={mv.move} box={YM_BOX} ms={1100} />
      </A_Road>
      <div className="mt-2 text-center text-sm font-semibold">{mv.name}</div>
      {!right && !over && (pick === null || landed) && (
        <div className="mt-2 flex justify-center gap-2">
          <button type="button" onClick={() => answer(true)} className={quietBtn}>
            স্যারের নিয়মে হয়
          </button>
          <button type="button" onClick={() => answer(false)} className={quietBtn}>
            হয় না
          </button>
        </div>
      )}
      {pick !== null && <A_LateLamps key={`${round}-${miss}-${right ? 1 : 0}`} lamps={mv.lamps} ms={1100} />}
      {pick !== null && !right && landed && (
        <Nope key={miss}>{yes(mv.lamps) ? "তিনটা বাতিই জ্বলছে। লাইন সোজা, ঘর সমান, খুঁটির কোণা খুঁটিতেই।" : mv.lamps[2] ? "লাইনগুলো দেখুন। সোজা আছে?" : "খুঁটির কোণাটা দেখুন। ওটা কোথায় গেলো?"}</Nope>
      )}
      {right && landed && round < YM_MOVES.length - 1 && (
        <div className={`mt-2 flex justify-center ${FADE}`}>
          <button type="button" onClick={next} className={primaryBtn}>
            পরেরটা
          </button>
        </div>
      )}
      <Task done={right && landed && round === YM_MOVES.length - 1}>ছয়টা move। প্রত্যেকটা দেখে বলুন, স্যারের নিয়মে হয় কি-না।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it: two moved grid lines are chalked, the rest is dark. Pick the
//     grid that finishes them. A pick morphs from the even grid into itself,
//     so bunching squares and bending lines are seen happening.

const TF_L = byCols([
  [1, 0.4],
  [-0.3, 1],
]);
/** the squares shrink as they go right, lines stay straight */
const TF_BUNCH: Move = (p) => TF_L([p[0] > 1 ? 1 + Math.log(p[0]) : p[0], p[1]]);
/** the cross lines curve; the two given lines stay where they are */
const TF_CURVE: Move = (p) => {
  const q = TF_L(p);
  const b = 0.22 * p[0] * (p[0] - 1);
  return [q[0], q[1] + b];
};
export const TF_OPTS: { move: Move; lamps: Lamps }[] = [
  { move: TF_BUNCH, lamps: [true, false, true] },
  { move: TF_L, lamps: [true, true, true] },
  { move: TF_CURVE, lamps: [false, false, true] },
];
const TF_RIGHT = 1;
const TF_F = makeFrame(-2, 6, -0.8, 6.5, 26, 6);
const TF_BOX: Box = [0, 5, 0, 4];

/** the two lines Rina chalked: paper x = 0 and x = 1, carried by the move */
function TF_Given({ f }: { f: Frame }) {
  return (
    <g>
      {[0, 1].map((x) => (
        <path key={x} d={pathOf(f, TF_L, [
          [x, 0],
          [x, 4],
        ])} stroke="#fde047" strokeWidth={2.4} strokeLinecap="round" />
      ))}
    </g>
  );
}

/** a pick, morphed in from the even grid */
function TF_Morph({ f, move }: { f: Frame; move: Move }) {
  const t = useRise(1100);
  const m: Move = (p) => {
    const a = TF_L(p);
    const b = move(p);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  return <ChalkGrid f={f} move={m} x0={TF_BOX[0]} x1={TF_BOX[1]} y0={TF_BOX[2]} y1={TF_BOX[3]} />;
}

function TF_Thumb({ move }: { move: Move }) {
  const f = makeFrame(-2, 6, -0.8, 6.5, 11, 3);
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} aria-hidden="true" className="mx-auto block h-auto w-full max-w-[6rem]">
      <RoadBed f={f} />
      <ChalkGrid f={f} move={move} x0={TF_BOX[0]} x1={TF_BOX[1]} y0={TF_BOX[2]} y1={TF_BOX[3]} />
      <TF_Given f={f} />
    </svg>
  );
}

export function TryFinishTheGrid() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  // the pick morphs in on the road; the lamps, the verdict and pass() wait for it
  const play = usePlay(1150);
  const landed = !play.running;
  const choose = (i: number) => {
    setPick(i);
    if (i !== TF_RIGHT) setMiss(miss + 1);
    play.play(1, () => {
      if (i === TF_RIGHT) pass("দুইটা লাইন জানলে বাকি grid সমান তালে চলে।");
    });
  };
  return (
    <>
      <A_Road f={TF_F} label="রাস্তায় শুধু দুইটা হলুদ লাইন টানা; বাকি grid কেমন হবে" className="max-w-[12rem]">
        {pick !== null && <TF_Morph key={`${pick}-${miss}`} f={TF_F} move={TF_OPTS[pick].move} />}
        <TF_Given f={TF_F} />
        <Pillar f={TF_F} />
      </A_Road>
      {pick !== null && <A_LateLamps key={`${pick}-${miss}`} lamps={TF_OPTS[pick].lamps} ms={1100} />}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {TF_OPTS.map((o, i) => (
          <button
            key={i}
            type="button"
            aria-label={["ঘর ছোট হতে থাকে", "সমান ঘর", "বাঁকা লাইন"][i]}
            onClick={() => choose(i)}
            className={`cursor-pointer rounded-xl border-2 p-1.5 transition-colors motion-reduce:transition-none ${
              pick === i && landed ? (i === TF_RIGHT ? "border-accent bg-accent/10" : "nudge border-danger/50 bg-danger/5") : "border-border hover:border-cat-blue/60"
            }`}
          >
            <TF_Thumb move={o.move} />
          </button>
        ))}
      </div>
      {pick !== null && pick !== TF_RIGHT && landed && <Nope key={miss}>{pick === 0 ? "লাইন সোজা আছে। কিন্তু ডানের ঘরগুলো চিকন হয়ে গেলো।" : "আড়াআড়ি লাইনগুলো বেঁকে গেছে।"}</Nope>}
      <Task done={pick === TF_RIGHT && landed}>হলুদ দুইটা লাইন রিনার টানা। বাকি grid কোনটা? নিচের তিনটা থেকে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. The road in front of the gate, side on: the gate's left
// pillar, the rope knot, the chalk grid on the road. The art sir wears Nana's
// look with his name drawn, as in 6.1.

function S_Name({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
      {text}
    </text>
  );
}

function S_Pillar({ ropes = 1 }: { ropes?: 0 | 1 | 2 }) {
  return (
    <g className="pointer-events-none">
      <rect x={26} y={50} width={14} height={70} fill="#b91c1c" />
      <rect x={20} y={44} width={26} height={8} fill="#7f1d1d" />
      {ropes >= 1 && <path d="M40 112q20 10 44 12" stroke={AMBER} strokeWidth={2} fill="none" />}
      {ropes >= 2 && <path d="M40 108q14 18 24 40" stroke="#2dd4bf" strokeWidth={2} fill="none" className={FADE} />}
    </g>
  );
}

/** the chalk grid on the road, seen side on */
function S_Grid() {
  return (
    <g className="pointer-events-none" stroke="white" strokeOpacity={0.7} strokeWidth={1}>
      <rect y={120} width={320} height={60} fill="#9ca3af" stroke="none" />
      {[132, 148, 164].map((y) => (
        <path key={y} d={`M44 ${y}H316`} />
      ))}
      {Array.from({ length: 11 }, (_, i) => 50 + i * 26).map((x) => (
        <path key={x} d={`M${x} 124V176`} />
      ))}
    </g>
  );
}

/** a tiny graph paper held up, with the proposal drawn on it: a fish and a lotus dot */
function S_Sketch({ x, y, kind }: { x: number; y: number; kind: "plain" | "big" | "slant" | "mirror" | "slide" }) {
  const tf = kind === "big" ? "scale(1.5)" : kind === "slant" ? "skewX(-25)" : kind === "mirror" ? "scale(-1 1)" : kind === "slide" ? "translate(4 0)" : "";
  return (
    <g className={POP}>
      <rect x={x - 13} y={y - 10} width={26} height={20} rx={1.5} fill="white" stroke="#0284c7" strokeOpacity={0.6} />
      <path d={`M${x - 13} ${y}h26M${x} ${y - 10}v20`} stroke="#0284c7" strokeOpacity={0.2} />
      <g transform={`translate(${x - 4} ${y + 2}) ${tf}`}>
        <path d="M-5 0q5 -5 10 0q-5 5 -10 0Z" fill="#f59e0b" />
        <path d="M-5 0l-3 -2.5v5Z" fill="#f59e0b" />
        <circle cx={4} cy={-5} r={2.2} fill="#db2777" />
      </g>
      {kind === "slide" && <path d={`M${x + 4} ${y + 7}h6m-2 -2l2 2l-2 2`} stroke={BAD} strokeWidth={1} fill="none" />}
    </g>
  );
}

function S_StreetLamp({ on }: { on: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={298} y={34} width={3} height={86} fill="#475569" />
      <path d="M300 36h-14" stroke="#475569" strokeWidth={3} />
      <circle cx={284} cy={40} r={4} fill={on ? "#fde047" : "#94a3b8"} className="transition-colors duration-500 motion-reduce:transition-none" />
      {on && <path d="M284 44L264 120H304Z" fill="#fde047" opacity={0.18} className={FADE} />}
    </g>
  );
}

// 1a · The gate after school. The art sir at the pillar with the rope and the
//      chalk; Rina with the paper; four friends, four sketches held up; the
//      sir's two lines. Which one fails is left to the bet.

export function GateEvening({}: Story) {
  const s = useScene(4, [600, 1800, 1800, 2600, 2800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={120} label="স্কুল গেটের সামনের রাস্তা; আর্ট স্যার খুঁটির গোড়ায়, রিনার হাতে graph paper; ফাহিম, সামিন, সোম আর নাসিব চার রকম কাগজ তুলে ধরলো; স্যার বললেন খুঁটি থেকে যা শুরু খুঁটিতেই থাকে, চাইরটার একটা আমার নিয়মে হয় না">
        <S_Pillar />
        <S_Grid />
        <Person who="nana" x={62} y={160} arm={k >= 3 ? "point" : "down"} />
        <S_Name x={62} y={160} text="আর্ট স্যার" />
        <Person who="rina" x={104} y={160} label arm="hold" />
        <S_Sketch x={116} y={116} kind="plain" />
        <Person who="fahim" x={162} y={160} facing={-1} label arm={k >= 1 ? "hold" : "down"} />
        <Person who="samin" x={204} y={160} facing={-1} label arm={k >= 1 ? "hold" : "down"} />
        <Person who="som" x={246} y={160} facing={-1} label arm={k >= 2 ? "hold" : "down"} />
        <Person who="nasib" x={288} y={160} facing={-1} label arm={k >= 2 ? "hold" : "down"} mood={k >= 2 ? "smug" : "plain"} />
        {k >= 1 && k < 3 && (
          <>
            <S_Sketch x={162} y={80} kind="big" />
            <S_Sketch x={204} y={80} kind="slant" />
          </>
        )}
        {k >= 2 && k < 3 && (
          <>
            <S_Sketch x={246} y={80} kind="mirror" />
            <S_Sketch x={288} y={80} kind="slide" />
          </>
        )}
        {k === 3 && <Bubble x={62} y={94} side="right" lines={["খুঁটি থেকে যা শুরু,", "খুঁটিতেই থাকে।"]} />}
        {k >= 4 && <Bubble x={62} y={94} side="right" lines={["চাইরটার একটা", "আমার নিয়মে হয় না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · The sir goes for tea, and says to start with the big one. Fahim chalks
//      the first doubled points one by one while Rina counts.

export function FahimChalks({}: Story) {
  const s = useScene(4, [600, 2400, 1600, 1400, 2000]);
  const k = s.k;
  const dots = [150, 206, 262];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={120} label="আর্ট স্যার বললেন বড়টা দিয়া শুরু করো, দ্বিগুণ, তারপর চা খেতে গেলেন; ফাহিম chalk দিয়ে একটা একটা করে দাগ দিলো; রিনা গুনছে">
        <S_Pillar />
        <S_Grid />
        <Person who="nana" x={k >= 2 ? 340 : 80} y={160} walking={k === 2} ms={1400} />
        {k < 2 && <S_Name x={80} y={160} text="আর্ট স্যার" />}
        {k === 1 && <Bubble x={80} y={94} side="right" lines={["বড়টা দিয়া শুরু করো।", "দ্বিগুণ।"]} />}
        <Person who="fahim" x={k >= 3 ? 250 : 140} y={160} label arm={k >= 3 ? "point" : "hold"} walking={k === 3} ms={900} />
        <Person who="rina" x={110} y={160} label arm="hold" />
        {dots.slice(0, k >= 4 ? 3 : k >= 3 ? 1 : 0).map((x) => (
          <circle key={x} cx={x} cy={148} r={3} fill="white" className={POP} />
        ))}
        {k >= 4 && <Bubble x={110} y={94} side="right" lines={["এক। দুই। তিন।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · The sir back from tea. He sees the three spikes, pins the paper to the
//      road at the pillar and turns it. A top view in the corner shows the
//      paper turning about the pin.

export function SirTurnsPaper({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const deg = k >= 3 ? 180 : k >= 2 ? 90 : 0;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={120} label="আর্ট স্যার ফিরলেন; কাগজের কোণায় আলপিন গেঁথে খুঁটির গোড়ায় বসালেন, তারপর কাগজটা ঘুরালেন; উপর থেকে দেখলে পুরা কাগজ একসাথে ঘুরছে">
        <S_Pillar />
        <S_Grid />
        {[150, 206, 262].map((x) => (
          <path key={x} d={`M${x} 148l-18 -14`} stroke="#f472b6" strokeWidth={2.4} strokeLinecap="round" />
        ))}
        <Person who="nana" x={k >= 1 ? 58 : 296} y={160} walking={k === 0} arm={k >= 1 ? "hold" : "down"} facing={k >= 1 ? 1 : -1} ms={1400} />
        <S_Name x={k >= 1 ? 58 : 296} y={160} text="আর্ট স্যার" />
        <Person who="rina" x={120} y={160} label facing={-1} />
        <Person who="fahim" x={200} y={160} label facing={-1} />
        {k >= 1 && (
          <g className={FADE}>
            <rect x={190} y={8} width={120} height={82} rx={6} fill="#6b7280" stroke="white" strokeWidth={1.5} />
            <text x={196} y={20} fontSize={7.5} fontWeight={600} fill="white">
              উপর থেকে
            </text>
            <rect x={245} y={44} width={10} height={10} rx={1.5} fill="#b91c1c" />
            <g style={{ transform: `rotate(${-deg}deg)`, transformOrigin: "250px 49px", transformBox: "view-box" }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
              <rect x={250} y={27} width={34} height={22} fill="white" stroke="#0284c7" strokeOpacity={0.6} />
              <path d="M258 38q5 -5 10 0q-5 5 -10 0Z" fill="#f59e0b" />
              <circle cx={276} cy={33} r={3} fill="#db2777" />
            </g>
            <circle cx={250} cy={49} r={2} fill={INK} />
          </g>
        )}
        {k >= 1 && <Bubble x={58} y={94} side="right" lines={["এক এক কইরা না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Dusk. The street lamp comes on. Nasib: then anything goes. The sir
//      lays a bamboo stick along a chalk line, then three fingers, three
//      conditions.

export function ThreeFingers({}: Story) {
  const s = useScene(4, [600, 1400, 2200, 1600, 3000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={120} label="সন্ধ্যা নামছে, রাস্তার বাতি জ্বললো; নাসিব বললো তাহলে যা খুশি করা যায়; আর্ট স্যার একটা কঞ্চি chalk এর লাইনের পাশে রাখলেন, তারপর তিনটা শর্ত বললেন">
        <S_Pillar />
        <S_Grid />
        <S_StreetLamp on={k >= 1} />
        <Person who="nana" x={70} y={160} arm={k >= 4 ? "wave" : k === 3 ? "point" : "down"} />
        <S_Name x={70} y={160} text="আর্ট স্যার" />
        <Person who="nasib" x={230} y={160} facing={-1} label mood={k >= 2 ? "smug" : "plain"} arm={k === 2 ? "wave" : "down"} />
        <Person who="som" x={180} y={160} facing={-1} label />
        {k === 2 && <Bubble x={230} y={94} side="left" lines={["তাহলে যা খুশি", "করা যায়।"]} />}
        {k >= 3 && <path d="M92 150L178 146" stroke="#a16207" strokeWidth={3} strokeLinecap="round" className={FADE} />}
        {k >= 4 && <Bubble x={70} y={94} side="right" lines={["লাইন সোজা থাকবো।", "ঘর সমান থাকবো।", "খুঁটি নড়বো না।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · Nasib takes the paper, lays it on the road and pushes it one square
//      to the right. His line. The sir says nothing.

export function NasibPushes({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={120} label="নাসিব graph paper টা রাস্তায় রাখলো, এক ঘর ডানে ঠেলে দিলো, বললো লাইন সোজা, ঘর সমান; স্যার কিছু বললেন না">
        <S_Pillar />
        <S_Grid />
        <S_StreetLamp on />
        <rect x={k >= 2 ? 76 : 50} y={140} width={26} height={16} fill="white" stroke="#0284c7" strokeOpacity={0.6} className="transition-[x] duration-1000 ease-in-out motion-reduce:transition-none" />
        <Person who="nasib" x={k >= 1 ? 130 : 200} y={160} facing={-1} label arm={k >= 1 ? "point" : "hold"} walking={k === 1} />
        <Person who="nana" x={280} y={160} facing={-1} />
        <S_Name x={280} y={160} text="আর্ট স্যার" />
        {k >= 3 && <Bubble x={130} y={94} side="mid" lines={["দেখেন। লাইন সোজা।", "ঘর সমান।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6a · The sir tears a page from his notebook, draws six small roads on it,
//      before and after, and hands it to Rina.

export function SixRoads({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={120} label="আর্ট স্যার খাতা থেকে একটা পাতা ছিঁড়লেন, তাতে ছয়টা ছোট রাস্তা আঁকলেন, রিনার হাতে দিলেন">
        <S_Pillar />
        <S_Grid />
        <S_StreetLamp on />
        <Person who="nana" x={90} y={160} arm="hold" />
        <S_Name x={90} y={160} text="আর্ট স্যার" />
        <Person who="rina" x={k >= 2 ? 150 : 200} y={160} facing={-1} label arm={k >= 2 ? "hold" : "down"} walking={k === 2} ms={900} />
        {k >= 1 && (
          <g className={POP}>
            <rect x={k >= 2 ? 104 : 100} y={78} width={36} height={26} fill="white" stroke={INK} strokeOpacity={0.3} className="transition-[x] duration-700 motion-reduce:transition-none" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={(k >= 2 ? 107 : 103) + (i % 3) * 11} y={81 + Math.floor(i / 3) * 11} width={9} height={9} fill="#6b7280" className="transition-[x] duration-700 motion-reduce:transition-none" />
            ))}
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 7a · Rina chalks two lines of a new grid; the power goes; the street lamp
//      dies; Samin's phone torch comes on.

export function LightsOut({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop={k >= 2 ? "night" : "evening"} ground={120} label="রিনা নতুন grid এর দুইটা লাইন টানলো; কারেন্ট চলে গেলো, রাস্তার বাতি নিভলো; সামিন মোবাইলের আলো জ্বাললো">
        <rect y={120} width={320} height={60} fill="#6b7280" />
        <S_Pillar />
        <S_StreetLamp on={k < 2} />
        {k >= 1 && (
          <g>
            <Draw d="M60 176L96 124" strokeWidth={2.4} ms={700} className="stroke-[#fde047]" />
            <Draw d="M92 176L128 124" strokeWidth={2.4} ms={700} delay={300} className="stroke-[#fde047]" />
          </g>
        )}
        <Person who="rina" x={150} y={160} label arm={k >= 1 ? "point" : "hold"} facing={-1} />
        <Person who="samin" x={210} y={160} label facing={-1} arm={k >= 3 ? "hold" : "down"} />
        {k >= 3 && <path d="M190 122L100 176H170Z" fill="#fef9c3" opacity={0.3} className={FADE} />}
        {k >= 3 && <Bubble x={150} y={94} side="mid" lines={["বাকিটা?"]} />}
      </Stage>
    </StoryFrame>
  );
}

/** a cycle rickshaw, side on, wheels on the road at y 172 */
function S_Rickshaw({ x }: { x: number }) {
  return (
    <g style={{ transform: `translate(${x}px, -18px)` }} className="pointer-events-none transition-transform duration-[1800ms] ease-in-out motion-reduce:transition-none">
      <circle cx={-18} cy={164} r={9} fill="none" stroke={INK} strokeWidth={2} />
      <circle cx={16} cy={164} r={9} fill="none" stroke={INK} strokeWidth={2} />
      <path d="M-18 164L0 150L16 164M0 150V132" stroke={INK} strokeWidth={1.6} fill="none" />
      <rect x={-8} y={128} width={20} height={8} rx={2} fill="#dc2626" />
      <path d="M-10 128q12 -26 26 0Z" fill="#1d4ed8" />
      <path d="M-30 140h10" stroke="#f59e0b" strokeWidth={3} />
    </g>
  );
}

// 8a · Before the azaan. A rickshaw passes, its wheel over the square next
//      to the pillar. Nasib folds his paper away. The sir ties a second rope.

export function RickshawPasses({}: Story) {
  const s = useScene(3, [600, 2000, 1600, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={120} label="একটা রিকশা গেলো, চাকা খুঁটির পাশের ঘরের উপর দিয়ে; নাসিব কাগজ ভাঁজ করে পকেটে রাখলো; আর্ট স্যার খুঁটিতে আরেকটা দড়ি বাঁধলেন">
        <S_Pillar ropes={k >= 3 ? 2 : 1} />
        <S_Grid />
        <S_StreetLamp on />
        <S_Rickshaw x={k >= 2 ? 380 : k === 1 ? 72 : -40} />
        <Person who="nana" x={40} y={166} arm={k >= 3 ? "hold" : "down"} />
        <S_Name x={40} y={166} text="আর্ট স্যার" />
        <Person who="nasib" x={250} y={166} facing={-1} label arm={k >= 2 ? "down" : "hold"} />
        {k < 2 && <S_Sketch x={236} y={116} kind="slide" />}
        {k >= 2 && <rect x={241} y={138} width={7} height={7} fill="white" stroke="#0284c7" strokeOpacity={0.6} className={POP} />}
      </Stage>
    </StoryFrame>
  );
}

// 8b · The bridge. The sir pulls the two ropes to two spots, chalks a cross at
//      each end, and nothing else; the azaan; he walks off. Where the petals
//      go is 6.3.

export function TwoCrosses({}: Story) {
  const s = useScene(3, [600, 1800, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={120} label="আর্ট স্যার দুইটা দড়ির মাথা টেনে রাস্তার দুই জায়গায় নিলেন, দুইটা ক্রস দিলেন, তারপর মাগরিবে চলে গেলেন">
        <S_Pillar ropes={0} />
        <S_Grid />
        <S_StreetLamp on />
        {k >= 1 && (
          <g className={FADE}>
            <path d="M40 112L150 160" stroke={AMBER} strokeWidth={2} />
            <path d="M40 116L96 176" stroke="#2dd4bf" strokeWidth={2} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP} stroke="white" strokeWidth={2} strokeLinecap="round">
            <path d="M145 155l10 10m0 -10l-10 10" />
            <path d="M92 168l8 8m0 -8l-8 8" />
          </g>
        )}
        <Person who="nana" x={k >= 3 ? 340 : 160} y={150} walking={k === 3} arm={k === 1 ? "hold" : "down"} ms={1600} />
        {k < 3 && <S_Name x={160} y={150} text="আর্ট স্যার" />}
        <Person who="rina" x={220} y={160} label facing={-1} />
        <Person who="som" x={262} y={160} label facing={-1} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The paper and the road. The small design on graph paper; the empty
//      road, the grid chalked from the pillar's corner; a "?" between them.

const X1_SAY = ["কাগজে ছোট একটা design।", "রাস্তায় খুঁটি। খুঁটির কোণা থেকে grid।", "মাঝখানে একটা নিয়ম দরকার।", "কোন নিয়মে কোনটা হয়, কোনটা হয় না?"];
const X1_PAPER = makeFrame(0, 6.5, 0, 5.5, 9, 4);
const X1_ROAD = makeFrame(-0.8, 8, -0.8, 6.2, 12, 4);

export function PaperToRoad() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <svg viewBox="0 0 250 100" role="img" aria-label="বামে graph paper এ ছোট আলপনা, ডানে রাস্তায় খুঁটি থেকে chalk এর grid, মাঝখানে প্রশ্নবোধক" className="mx-auto block h-auto w-full max-w-[17rem]">
        <g transform="translate(4 18)">
          <rect x={0} y={0} width={X1_PAPER.W} height={X1_PAPER.H} rx={2} fill="white" stroke="#cbd5e1" />
          <ChalkGrid f={X1_PAPER} move={A_ID} x0={0} x1={6} y0={0} y1={5} tone="#0284c7" />
          <Alpana f={X1_PAPER} move={A_ID} />
        </g>
        {k >= 1 && (
          <g transform="translate(130 6)" className={FADE}>
            <RoadBed f={X1_ROAD} />
            {k >= 2 && (
              <g className={FADE}>
                <ChalkGrid f={X1_ROAD} move={A_ID} x0={0} x1={7} y0={0} y1={6} />
              </g>
            )}
            <Pillar f={X1_ROAD} />
          </g>
        )}
        {k >= 2 && <path d="M76 50H124" stroke={INK} strokeOpacity={0.5} strokeWidth={1.4} strokeDasharray="4 3" className={FADE} />}
        {k >= 3 && (
          <text x={100} y={44} textAnchor="middle" fontSize={16} fontWeight={800} fill="#64748b" className={POP}>
            ?
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Points without end. The lotus's outline, and dots along it: the 3
//      the reader moved, then 15, 60, 240, until the outline is all dots.

const X2_SAY = ["আপনি সরিয়েছেন তিনটা point।", "পাপড়ির গায়েও point আছে।", "আরো।", "আরো। একটা লাইনের উপরে point গুনে শেষ করা যায় না।"];
const X2_F = makeFrame(0.5, 5.5, 0.6, 4.2, 40, 6);
const X2_N = [3, 15, 60, 240];

/** n points spread evenly along all five petal outlines */
function X2_Dots(n: number): XY[] {
  const segs: [XY, XY][] = PETALS.flatMap((p) => p.slice(1).map((q, i) => [p[i], q] as [XY, XY]));
  const len = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = len.reduce((a, b) => a + b, 0);
  const out: XY[] = [];
  for (let j = 0; j < n; j++) {
    let d = ((j + 0.5) / n) * total;
    let i = 0;
    while (i < segs.length - 1 && d > len[i]) d -= len[i++];
    const [a, b] = segs[i];
    const t = Math.min(1, d / len[i]);
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

export function CountPoints() {
  const s = useScene(3, [600, 1400, 1400, 2400]);
  const k = s.k;
  const dots = k === 0 ? [LOTUS_TIPS[0], LOTUS_TIPS[2], LOTUS_TIPS[4]] : X2_Dots(X2_N[k]);
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <svg viewBox={`0 0 ${X2_F.W} ${X2_F.H}`} role="img" aria-label="পদ্মের পাপড়ির রেখার উপরে বিন্দু, তিনটা থেকে বেড়ে শত শত" className="mx-auto block h-auto w-full max-w-[14rem]">
        <RoadBed f={X2_F} />
        {PETALS.map((p, i) => (
          <path key={i} d={pathOf(X2_F, A_ID, p, true)} fill="#f472b6" fillOpacity={0.35} stroke="#f8fafc" strokeOpacity={0.5} />
        ))}
        <g key={k} className={FADE}>
          {dots.map((p, i) => (
            <circle key={i} cx={X2_F.sx(p[0])} cy={X2_F.sy(p[1])} r={k === 0 ? 3.5 : k === 3 ? 1.1 : 1.8} fill={k === 0 ? OK : "white"} />
          ))}
        </g>
        <text x={X2_F.W - 8} y={16} textAnchor="end" fontSize={11} fontFamily={MONO} fontWeight={700} fill="white">
          {k === 3 ? "240+" : X2_N[k]}
        </text>
      </svg>
    </Scene>
  );
}

// 3½ · Four arrows, one rule. Four arrows from the pillar, and the grid under
//      them, turn together: 90°, then 180°. Their old places stay faint.

const X3_SAY = ["খুঁটি থেকে চারটা arrow। কোনোটার সাথে কোনোটার মিল নাই।", "নিয়ম একটাই: 180° ঘোরাও। প্রথমে অর্ধেক পথ।", "চারটাই একসাথে উল্টা দিকে।", "(2, 1) গেলো (−2, −1) এ। বাকি তিনটাও একই ভাবে।"];
const X3_F = makeFrame(-4, 4, -3, 3, 22, 8);
const X3_V: XY[] = [
  [2, 1],
  [-1, 2],
  [3, -1],
  [-2, -2],
];
const X3_C = ["#38bdf8", "#a78bfa", "#f472b6", "#fde047"];

export function FourArrows() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const [d] = useTween([k >= 2 ? 180 : k >= 1 ? 90 : 0], 900);
  const m = byCols(turnCols(d));
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <svg viewBox={`0 0 ${X3_F.W} ${X3_F.H}`} role="img" aria-label="খুঁটি থেকে চারটা arrow, grid সহ একসাথে 180 ডিগ্রি ঘুরলো" className="mx-auto block h-auto w-full max-w-[15rem]">
        <RoadBed f={X3_F} />
        <ChalkGrid f={X3_F} move={m} x0={-4} x1={4} y0={-3} y1={3} ghost />
        {X3_V.map((v, i) => {
          const q = m(v);
          return (
            <g key={i}>
              <path d={`M${X3_F.sx(0)} ${X3_F.sy(0)}L${X3_F.sx(v[0])} ${X3_F.sy(v[1])}`} stroke={X3_C[i]} strokeOpacity={0.5} strokeWidth={1.4} strokeDasharray="3 2" />
              <path d={`M${X3_F.sx(0)} ${X3_F.sy(0)}L${X3_F.sx(q[0])} ${X3_F.sy(q[1])}`} stroke={X3_C[i]} strokeWidth={2.4} strokeLinecap="round" />
              <circle cx={X3_F.sx(q[0])} cy={X3_F.sy(q[1])} r={3.4} fill={X3_C[i]} />
            </g>
          );
        })}
        <Pillar f={X3_F} />
        {k >= 3 && (
          <g className={FADE} fontFamily={MONO} fontSize={10} fontWeight={700} fill="#38bdf8" stroke="#374151" strokeWidth={3} paintOrder="stroke">
            <text x={X3_F.sx(2) + 5} y={X3_F.sy(1) + 12}>
              (2, 1)
            </text>
            <text x={X3_F.sx(-2)} y={X3_F.sy(-1) + 15} textAnchor="middle">
              (−2, −1)
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 3¾ · Two in, two out. The rule as a box L: the card (2, 1) goes in, the
//      card (−2, −1) comes out; ℝ² lands under each; then the cards give way
//      to the whole road going through at once, and the name lands last.

const X3B_SAY: ReactNode[] = [
  "একটা নিয়ম। বাক্সটার নাম L।",
  "ঢোকে একটা vector, (2, 1)। দুই সংখ্যা।",
  "বের হয় আরেকটা vector, (−2, −1)। আবারও দুই সংখ্যা।",
  "লেখা হয় L : ℝ² → ℝ²। দুই সংখ্যা ঢোকে, দুই সংখ্যা বের হয়।",
  <>
    একটা arrow না, পুরা রাস্তা একসাথে ঢোকে। এমন নিয়মের নাম <b>transformation</b>.
  </>,
];
const X3B_F = makeFrame(-6.2, 6.2, -5.2, 5.2, 6, 3);
const X3B_TURN = byCols(turnCols(180));

/** a number card on the figure's white sheet */
function X3B_Card({ x, text }: { x: number; text: string }) {
  return (
    <g className={POP}>
      <rect x={x - 32} y={42} width={64} height={26} rx={5} fill="white" stroke={INK} strokeOpacity={0.35} />
      <text x={x} y={60} textAnchor="middle" fontSize={13} fontFamily={MONO} fontWeight={700} fill={INK}>
        {text}
      </text>
    </g>
  );
}

/** the whole road, small: the grid and the আলপনা, plain or turned */
function X3B_Road({ x, move }: { x: number; move: Move }) {
  return (
    <g transform={`translate(${x - X3B_F.W / 2} ${55 - X3B_F.H / 2})`} className={FADE}>
      <RoadBed f={X3B_F} />
      <ChalkGrid f={X3B_F} move={move} x0={-1} x1={6} y0={-1} y1={5} />
      <Alpana f={X3B_F} move={move} />
      <Pillar f={X3B_F} />
    </g>
  );
}

export function TwoInTwoOut() {
  const s = useScene(4, [600, 1600, 1600, 2400, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3B_SAY[k]}</span>}>
      <svg viewBox="0 0 260 124" role="img" aria-label="L নামের বাক্স: (2, 1) ঢোকে, (−2, −1) বের হয়; নিচে L : ℝ² → ℝ²; শেষে পুরা রাস্তা বাক্সের ভেতর দিয়ে ঘুরে বের হয়" className="mx-auto block h-auto w-full max-w-[17rem]">
        <rect x={0} y={0} width={260} height={124} rx={8} fill="white" />
        {/* the box */}
        <rect x={106} y={28} width={48} height={54} rx={6} fill="#fef3c7" stroke={INK} strokeWidth={1.6} />
        <text x={130} y={63} textAnchor="middle" fontSize={22} fontFamily={MONO} fontWeight={800} fill={INK}>
          L
        </text>
        {k >= 1 && <Draw key={`i${k >= 4}`} d="M88 55H102" strokeWidth={2} className="stroke-[#0f1b2d]" />}
        {k >= 2 && <Draw key={`o${k >= 4}`} d="M158 55H172" strokeWidth={2} className="stroke-[#0f1b2d]" />}
        {k >= 1 && k < 4 && <X3B_Card x={50} text="(2, 1)" />}
        {k >= 2 && k < 4 && <X3B_Card x={210} text="(−2, −1)" />}
        {k >= 4 && <X3B_Road x={50} move={A_ID} />}
        {k >= 4 && <X3B_Road x={210} move={X3B_TURN} />}
        {k >= 3 && (
          <g className={POP} fontFamily={MONO} fontWeight={700} fill={INK}>
            <text x={50} y={108} textAnchor="middle" fontSize={12}>
              ℝ²
            </text>
            <text x={130} y={108} textAnchor="middle" fontSize={12}>
              L
            </text>
            <text x={210} y={108} textAnchor="middle" fontSize={12}>
              ℝ²
            </text>
            <path d="M92 104H122M138 104H168" stroke={INK} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="2 2" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · Three lamps, three ways to fail. Three small roads; each in turn does
//      the one thing its lamp forbids: the lines bend, the squares fan out,
//      the corner leaves the pillar.

const X4_SAY = ["স্যারের তিনটা বাতি, তিনটা রাস্তা।", "এক: লাইন বেঁকে গেলে প্রথম বাতি নেভে।", "দুই: ঘর ছোট-বড় হলে দ্বিতীয়টা।", "তিন: grid এর কোণা খুঁটি ছাড়লে তৃতীয়টা।"];
const X4_F = makeFrame(-0.8, 4.4, -0.8, 3.6, 16, 4);
// The third road shrinks toward its own middle (2, 1.5), not the pillar: lines
// straight, squares equal, but the corner leaves the pillar. (It used to slide
// one square right, which was screen 5's answer shown a screen early.)
const X4_MOVES: Move[] = [A_WAVE, (p) => [p[0] * (1 + 0.18 * p[1]), p[1]], (p) => [2 + 0.6 * (p[0] - 2), 1.5 + 0.6 * (p[1] - 1.5)]];

function X4_Mini({ i, on }: { i: number; on: boolean }) {
  const [t] = useTween([on ? 1 : 0], 900);
  const m = partway(X4_MOVES[i], t);
  const c = m([0, 0]);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${X4_F.W} ${X4_F.H}`} aria-hidden="true" className="block h-auto w-full max-w-[6rem]">
        <RoadBed f={X4_F} />
        <ChalkGrid f={X4_F} move={m} x0={0} x1={4} y0={0} y1={3} />
        <Pillar f={X4_F} at={c} off={on && i === 2} />
      </svg>
      <span className="mt-1 inline-flex items-center gap-1 text-xs">
        <A_Bulb on={on ? false : null} />
        {LAMP_NAMES[i]}
      </span>
    </div>
  );
}

export function ThreeLamps() {
  const s = useScene(3, [600, 1600, 1600, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <div className="mx-auto grid w-full max-w-[20rem] grid-cols-3 gap-2" role="img" aria-label="তিনটা ছোট রাস্তা: একটায় লাইন বাঁকে, একটায় ঘর ছোট-বড় হয়, একটায় grid এর কোণা খুঁটি ছাড়ে">
        {[0, 1, 2].map((i) => (
          <X4_Mini key={i} i={i} on={k >= i + 1} />
        ))}
      </div>
    </Scene>
  );
}

// 4¾ · The stick still fits. 3.3's point on the road: five chalk dots on a
//      straight line, each the one before plus the same step. The road moves
//      (a stretch and a turn); every step changes the same way, so the dots
//      stay on one line, and the sir's bamboo stick lies along them again.

const X4B_SAY = [
  "খুঁটি থেকে সোজা একটা লাইন। তার উপরে পাঁচটা বিন্দু।",
  "প্রত্যেকটা বিন্দু আগেরটার সাথে একই step যোগ।",
  "রাস্তা টানা হলো, একটু ঘুরলো। step টাও বদলে গেলো।",
  "কিন্তু সব step বদলালো একই রকম। তাই বিন্দুগুলো এখনো এক লাইনে। কঞ্চি গায়ে গায়ে লাগে।",
];
const X4B_F = makeFrame(-1.2, 7, -1, 5.4, 21, 6);
const X4B_MOVE = byCols([
  [1.25, 0.35],
  [-0.35, 1],
]);
const X4B_STEP: XY = [1.2, 0.7];

export function StickStays() {
  const s = useScene(3, [600, 1600, 1800, 2600]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 1 : 0], 1000);
  const m = partway(X4B_MOVE, t);
  const dots = [0, 1, 2, 3, 4].map((j) => m([X4B_STEP[0] * j, X4B_STEP[1] * j]));
  const px = (p: XY) => `${X4B_F.sx(p[0]).toFixed(1)} ${X4B_F.sy(p[1]).toFixed(1)}`;
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <svg viewBox={`0 0 ${X4B_F.W} ${X4B_F.H}`} role="img" aria-label="খুঁটি থেকে সোজা লাইনে পাঁচটা বিন্দু, প্রত্যেকটার মাঝে একই step; রাস্তা টানা আর ঘোরানোর পরও বিন্দুগুলো এক লাইনে, কঞ্চি তাদের গায়ে লাগে" className="mx-auto block h-auto w-full max-w-[13rem]">
        <RoadBed f={X4B_F} />
        <ChalkGrid f={X4B_F} move={m} ghost x0={-1} x1={7} y0={-1} y1={5} />
        {k >= 3 && (
          <path key="stick" d={`M${px(m([-0.5 * X4B_STEP[0], -0.5 * X4B_STEP[1]]))}L${px(m([4.5 * X4B_STEP[0], 4.5 * X4B_STEP[1]]))}`} stroke="#a16207" strokeWidth={6} strokeLinecap="round" opacity={0.85} className={FADE} />
        )}
        {k >= 1 &&
          dots.slice(1).map((d, j) => (
            <path key={j} d={`M${px(dots[j])}L${px(d)}`} stroke={AMBER} strokeWidth={2.4} strokeLinecap="round" className={FADE} />
          ))}
        {dots.map((d, j) => (
          <circle key={j} cx={X4B_F.sx(d[0])} cy={X4B_F.sy(d[1])} r={3.6} fill="white" stroke={INK} strokeWidth={1} />
        ))}
        <Pillar f={X4B_F} />
      </svg>
    </Scene>
  );
}

// 5½ · The corner walks off. The grid slides one square right; the corner
//      that sat on the pillar is left standing in the road. Then "+ b": the
//      slide added on after, as its own step.

const X5_SAY = ["Grid এর কোণা খুঁটির উপরে। (0, 0).", "এক ঘর ডানে ঠেলা। কোণা এখন (1, 0) তে।", "খুঁটি যেখানে ছিল, সেখানেই। কোণাটা নাই।", "তাই সরানোর কাজটা আলাদা: আগে wx, পরে + b।"];
const X5_F = makeFrame(-1, 6, -1, 4, 26, 6);

export function CornerWalksOff() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const [t] = useTween([k >= 1 ? 1 : 0], 1000);
  const m: Move = (p) => [p[0] + t, p[1]];
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <svg viewBox={`0 0 ${X5_F.W} ${X5_F.H}`} role="img" aria-label="grid এক ঘর ডানে সরে গেলো; grid এর কোণা খুঁটি ছেড়ে (1, 0) তে" className="mx-auto block h-auto w-full max-w-[15rem]">
        <RoadBed f={X5_F} />
        <ChalkGrid f={X5_F} move={m} x0={-1} x1={5} y0={-1} y1={4} ghost />
        <Alpana f={X5_F} move={m} fish={false} />
        <Pillar f={X5_F} at={m([0, 0])} off={k >= 1} />
        {k >= 2 && (
          <g className={FADE}>
            <circle cx={X5_F.sx(0)} cy={X5_F.sy(0)} r={11} fill="none" stroke={BAD} strokeWidth={1.6} strokeDasharray="3 2" />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={X5_F.sx(-0.8)} y={X5_F.sy(3.8)} width={64} height={20} rx={4} fill="white" />
            <text x={X5_F.sx(-0.8) + 32} y={X5_F.sy(3.8) + 14} textAnchor="middle" fontSize={11} fontFamily={MONO} fontWeight={700} fill={INK}>
              wx + b
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 7½ · Copy the first square. From the two given lines, the first square is
//      marked; copies of it go along the road, then up, until the whole grid
//      is there.

const X7_SAY = ["রিনার দুইটা লাইন।", "ওদের মাঝে প্রথম ঘর। সাথে নিচের আর উপরের লাইন।", "পাশের ঘর হুবহু একই। তার পাশেরটাও।", "উপরেও একই। পুরা grid প্রথম ঘরের কপি।"];
const X7_F = makeFrame(-2, 6, -0.8, 6.5, 26, 6);

function X7_Square({ f, at, hi = false }: { f: Frame; at: XY; hi?: boolean }) {
  const [x, y] = at;
  return <path d={pathOf(f, TF_L, [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]], true)} fill={hi ? "#fde047" : "#f8fafc"} fillOpacity={hi ? 0.35 : 0.14} stroke="#f8fafc" strokeWidth={1} className={POP} />;
}

export function CopySquares() {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const cells: XY[] = [];
  if (k >= 2) for (let x = 1; x < 5; x++) cells.push([x, 0]);
  if (k >= 3) for (let y = 1; y < 4; y++) for (let x = 0; x < 5; x++) cells.push([x, y]);
  return (
    <Scene scene={s} caption={say(X7_SAY, k)}>
      <svg viewBox={`0 0 ${X7_F.W} ${X7_F.H}`} role="img" aria-label="প্রথম ঘরের কপি বসিয়ে বসিয়ে পুরা grid" className="mx-auto block h-auto w-full max-w-[13rem]">
        <RoadBed f={X7_F} />
        {k >= 1 && <X7_Square f={X7_F} at={[0, 0]} hi />}
        {cells.map((c) => (
          <X7_Square key={`${c[0]},${c[1]}`} f={X7_F} at={c} />
        ))}
        <TF_Given f={X7_F} />
        <Pillar f={X7_F} />
      </svg>
    </Scene>
  );
}

// 8½ · The bet, settled. The four proposals as small roads; a tick lands on
//      three of them, a cross on Nasib's.

const X8_SAY = ["চারটা প্রস্তাব।", "বড় করা: লাইন সোজা, ঘর সমান, খুঁটি জায়গায়।", "কাত করা: একই। উল্টা করা: একই।", "নাসিবের এক ঘর ডানে: grid এর কোণা খুঁটি ছাড়ে।"];

export function BetSettled() {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const shown = [k >= 1, k >= 2, k >= 2, k >= 3];
  return (
    <Scene scene={s} caption={say(X8_SAY, k)}>
      <div className="mx-auto grid w-full max-w-[18rem] grid-cols-2 gap-2" role="img" aria-label="চারটা প্রস্তাব; বড়, কাত, উল্টা হয়, এক ঘর ডানে হয় না">
        {A_PROPOSALS.map((p, i) => (
          <div key={p.who} className="relative flex flex-col items-center">
            <A_BetThumb p={p} rise={false} />
            <span className="mt-0.5 text-xs font-semibold">{p.who}</span>
            {shown[i] && (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="absolute top-0.5 right-1 size-6">
                <A_Mark x={12} y={12} ok={i < 3} r={10} />
              </svg>
            )}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` is a scene's beat).

export const fixtures: Fixtures = {
  AlpanaBet: { start: {}, bet: { bet: 3 } },
  OnePointAtATime: { start: {}, one: { placed: [true, false, false] }, wrong: { placed: [true, false, false], miss: { i: 1, to: [4, 6], n: 1 } }, done: { placed: [true, true, true] } },
  WholeGrid: { start: {}, half: { deg: 90 }, done: { deg: 180, done: true } },
  StraightStays: { start: {}, fan: { cur: 2, tried: [true, true, true, false] }, bulge: { cur: 3, tried: [true, true, true, true] } },
  SlideTheAlpana: { start: {}, guessed: { guess: 0 }, slid: { guess: 0, slid: true } },
  YourMoves: { start: {}, wrong: { round: 1, pick: true, miss: 1 }, squash: { round: 4, pick: false, miss: 1 }, right: { round: 3, pick: false }, last: { round: 5, pick: false } },
  TryFinishTheGrid: { start: {}, bunch: { pick: 0, miss: 1 }, curve: { pick: 2, miss: 1 }, right: { pick: 1 } },
  GateEvening: { rest: { k: 0 }, props: { k: 2 }, rule: { k: 3 }, done: {} },
  FahimChalks: { sir: { k: 1 }, done: {} },
  SirTurnsPaper: { rest: { k: 0 }, half: { k: 2 }, done: {} },
  ThreeFingers: { nasib: { k: 2 }, done: {} },
  NasibPushes: { rest: { k: 0 }, done: {} },
  SixRoads: { rest: { k: 1 }, done: {} },
  LightsOut: { lines: { k: 1 }, done: {} },
  RickshawPasses: { rest: { k: 0 }, pass: { k: 1 }, done: {} },
  TwoCrosses: { crosses: { k: 2 }, done: {} },
  PaperToRoad: { rest: { k: 0 }, done: {} },
  CountPoints: { rest: { k: 0 }, many: { k: 2 }, done: {} },
  FourArrows: { rest: { k: 0 }, done: {} },
  TwoInTwoOut: { rest: { k: 0 }, cards: { k: 2 }, formula: { k: 3 }, done: {} },
  ThreeLamps: { rest: { k: 0 }, done: {} },
  StickStays: { steps: { k: 1 }, moved: { k: 2 }, done: {} },
  CornerWalksOff: { rest: { k: 0 }, done: {} },
  CopySquares: { one: { k: 1 }, done: {} },
  BetSettled: { half: { k: 1 }, done: {} },
};
