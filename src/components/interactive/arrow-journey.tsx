"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { Bubble, Person, Robot, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, Ticks, primaryBtn, quietBtn, useCountUp, usePlay, useScene, useSeed, useSeeded, useTween, type Fixtures } from "@/components/journey/kit";
import {
  Arrow,
  Dot,
  Label,
  Plane,
  Star,
  clamp,
  makeFrame,
  minus,
  mix,
  plus,
  same,
  snap,
  tup,
  type Frame,
  type Tone,
  type XY,
} from "@/components/journey/plane";
import { bn } from "./figure-kit";
import { sfx } from "@/components/journey/sfx";

// Screens for "Math for AI 2.2 — Arrow, যার কোনো address নাই", told as a Journey.
//
// Shiku, the robot from the graph-paper lesson, is read (2, 3) as a recipe and
// walks it; what is left is an arrow from where he started to where he
// stopped. Direction and magnitude get their names on a tip the reader drags
// onto (3, 1) and (1, 3), the same length pointing two ways. Then the point
// of the lesson: an arrow has no address. The reader carries (3, 1) around
// the sheet and end − start never moves; sorts four arrows by working it out;
// slides them home to meet as one position vector; and follows one street
// instruction from three corners of a map. Last, the sign as a direction, the
// zero vector that points nowhere, and the numbers as a recipe of unit steps.
//
// Tailwind only, on the site's theme tokens; the sheet is journey/plane.

const O: XY = [0, 0];
/** first-quadrant sheet, for the early screens */
const F1 = makeFrame(-1, 8, -1, 6, 34);
/** all four quadrants, once signs come in */
const F2 = makeFrame(-5, 5, -4, 4, 30);

/** Shiku's walk: along the first axis, then the second, one square at a time. */
export function route(s: XY, v: XY): XY[] {
  const out: XY[] = [s];
  let [x, y] = s;
  for (let i = 0; i < Math.abs(v[0]); i++) out.push([(x += Math.sign(v[0])), y]);
  for (let i = 0; i < Math.abs(v[1]); i++) out.push([x, (y += Math.sign(v[1]))]);
  return out;
}

/** Play a walk one square per tick; `done` fires on the last square. */
export function useWalk(ms: number) {
  const play = usePlay(ms);
  const [path, setPath] = useState<XY[]>([O]);
  const go = (p: XY[], done?: () => void) => {
    setPath(p);
    if (p.length <= 1) {
      play.play(0);
      done?.();
    } else play.play(p.length - 1, done);
  };
  const i = Math.min(play.k, path.length - 1);
  return { here: path[i], trail: path.slice(0, i + 1), running: play.running, go };
}

/** Shiku, from 1.5. Moved by a CSS transform, so the transition does the in-between. */
export function Shiku({ f, at }: { f: Frame; at: XY }) {
  // a footstep each time he lands on a new square (not on the first draw, and
  // not for every frame of a slide between squares)
  const cell = `${Math.round(at[0])},${Math.round(at[1])}`;
  const was = useRef<string | null>(null);
  useEffect(() => {
    if (was.current !== null && was.current !== cell) sfx.step();
    was.current = cell;
  }, [cell]);
  return (
    <g
      style={{ transform: `translate(${f.sx(at[0])}px, ${f.sy(at[1])}px)` }}
      className="pointer-events-none transition-transform duration-200 ease-linear motion-reduce:transition-none"
    >
      <path d="M0 -8V-12.5" strokeWidth={1.2} className="stroke-cat-violet" />
      <circle cy={-13.5} r={1.8} className="fill-cat-violet" />
      <rect x={-8} y={-8} width={16} height={15} rx={4} className="fill-cat-violet" />
      <circle cx={-3.2} cy={-1.5} r={1.7} className="fill-white" />
      <circle cx={3.2} cy={-1.5} r={1.7} className="fill-white" />
    </g>
  );
}

export function Trail({ f, cells, faint = false }: { f: Frame; cells: XY[]; faint?: boolean }) {
  if (cells.length < 2) return null;
  const d = cells.map((c, i) => `${i ? "L" : "M"}${f.sx(c[0])} ${f.sy(c[1])}`).join("");
  return (
    <path
      d={d}
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={faint ? "3 5" : undefined}
      className={`pointer-events-none fill-none ${faint ? "stroke-cat-violet/35" : "stroke-cat-violet/60"}`}
    />
  );
}

const KEY_STEP: Record<string, XY> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
/** Arrow keys nudge something on the sheet by one square. */
const nudger = (move: (d: XY) => void) => (e: KeyboardEvent<SVGSVGElement>) => {
  const d = KEY_STEP[e.key];
  if (!d) return;
  e.preventDefault();
  move(d);
};

// ---------------------------------------------------------------------------
// 1 · (2, 3) read as a recipe. Shiku walks it; the arrow is what is left.

export function RecipeWalk() {
  const pass = useGate();
  const [v, setV] = useState<XY>([2, 3]);
  const [runs, setRuns] = useState<string[]>([]);
  const [shown, setShown] = useState<XY | null>(null);
  const w = useWalk(260);

  const run = () => {
    const recipe = v;
    setShown(null);
    // The buttons are blocked while he walks, so `runs` is still current when he stops.
    w.go(route(O, recipe), () => {
      setShown(recipe);
      const key = recipe.join(",");
      const next = runs.includes(key) ? runs : [...runs, key];
      setRuns(next);
      if (next.includes("2,3") && next.some((k) => k !== "2,3")) pass("দুইটা সংখ্যা মানে একটা arrow।");
    });
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-2xl bg-cat-violet/5 px-4 py-4 font-mono text-lg">
        <span className="font-semibold">v = (</span>
        <Stepper value={v[0]} min={0} max={7} label="প্রথম সংখ্যা" disabled={w.running} onChange={(a) => setV([a, v[1]])} />
        <span>,</span>
        <Stepper value={v[1]} min={0} max={5} label="দ্বিতীয় সংখ্যা" disabled={w.running} onChange={(b) => setV([v[0], b])} />
        <span>)</span>
        <button type="button" onClick={run} disabled={w.running} className={`${primaryBtn} bg-cat-violet font-sans text-base`}>
          ▶ Shiku-কে পড়ে শোনান
        </button>
      </div>
      <div className="mt-2 text-center text-sm text-muted">প্রথম সংখ্যা: ডানে কত ঘর · দ্বিতীয় সংখ্যা: ওপরে কত ঘর</div>
      <Plane f={F1} ticks={1} label={shown ? `an arrow from the origin to ${tup(shown)}` : "Shiku at the origin of a sheet of graph paper"}>
        <Trail f={F1} cells={w.trail} faint={!!shown} />
        {shown && <Arrow key={shown.join()} f={F1} from={O} to={shown} draw w={3} />}
        {shown && (
          <Label f={F1} at={shown} dx={8} dy={-8} anchor="start" className={`${POP} fill-cat-blue font-mono`}>
            {tup(shown)}
          </Label>
        )}
        <Shiku f={F1} at={w.here} />
      </Plane>
      <Ticks
        items={[
          ["(2, 3) চালান", runs.includes("2,3")],
          ["নিজের guide", runs.some((k) => k !== "2,3")],
        ]}
      />
      <Task done={runs.includes("2,3") && runs.some((k) => k !== "2,3")}>
        আগে (2, 3) পড়ে শোনান। তারপর সংখ্যা বদলে নিজের একটা guide চালান।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Direction and magnitude, on a tip the reader drags. (3, 1) and (1, 3):
//     the length bars come out identical, the needles do not.

const DIRS = ["পূর্ব", "উত্তর-পূর্ব", "উত্তর", "উত্তর-পশ্চিম", "পশ্চিম", "দক্ষিণ-পশ্চিম", "দক্ষিণ", "দক্ষিণ-পূর্ব"];

/** "প্রায় পূর্ব" — the nearest of the eight compass words. */
function heading(v: XY) {
  const deg = (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  const r = Math.round(deg / 45);
  const word = DIRS[((r % 8) + 8) % 8];
  return { deg, word: Math.abs(deg - r * 45) < 1 ? word : `প্রায় ${word}` };
}

/** A compass whose needle points along v; at zero there is nothing to point along. */
function Compass({ v }: { v: XY }) {
  const zero = v[0] === 0 && v[1] === 0;
  return (
    <svg viewBox="-34 -34 68 68" className="size-20 shrink-0" aria-hidden="true">
      <circle r={30} strokeWidth={1.5} className="fill-surface stroke-border" />
      <text y={-19} textAnchor="middle" fontSize={8} className="fill-muted">
        উ
      </text>
      <text x={21} y={3} textAnchor="middle" fontSize={8} className="fill-muted">
        পূ
      </text>
      {zero ? (
        <text y={7} textAnchor="middle" fontSize={20} fontWeight={700} className="animate-pulse fill-danger">
          ?
        </text>
      ) : (
        <g style={{ transform: `rotate(${-heading(v).deg}deg)` }} className="transition-transform duration-300 motion-reduce:transition-none">
          <path d="M-13 0H15" strokeWidth={2.5} strokeLinecap="round" className="stroke-cat-blue" />
          <path d="M23 0L13 -5.5V5.5Z" className="fill-cat-blue" />
        </g>
      )}
      <circle r={2.5} className="fill-foreground" />
    </svg>
  );
}

/** How long, as a bar; measuring it with a number is the next lesson's job. */
function LengthBar({ v, max }: { v: XY; max: number }) {
  return (
    <span className="relative block h-3 w-full rounded-full bg-foreground/10">
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-cat-amber transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${(Math.hypot(v[0], v[1]) / max) * 100}%` }}
      />
    </span>
  );
}

function ArrowCard({ v, max }: { v: XY; max: number }) {
  const zero = v[0] === 0 && v[1] === 0;
  return (
    <div className="mx-auto flex max-w-sm items-center gap-4 rounded-2xl border border-border px-4 py-3">
      <Compass v={v} />
      <div className="grid min-w-0 flex-1 gap-1.5 text-[0.95rem]">
        <div>
          <span className="text-muted">vector </span>
          <b className="font-mono">{tup(v)}</b>
        </div>
        <div>
          <span className="text-muted">direction </span>
          <b>{zero ? "কোনো দিক নাই" : heading(v).word}</b>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-muted">length</span>
          <LengthBar v={v} max={max} />
        </div>
      </div>
    </div>
  );
}

const STARS: XY[] = [
  [3, 1],
  [1, 3],
];

export function PointIt() {
  const pass = useGate();
  const [tip, setTip] = useState<XY>([2, 2]);
  const [hit, setHit] = useState<number[]>([]);

  const put = (p: XY) => {
    const t = snap(p, F1);
    setTip(t);
    const i = STARS.findIndex((s) => same(s, t));
    if (i < 0 || hit.includes(i)) return;
    const next = Array.from(new Set([...hit, i]));
    setHit(next);
    if (next.length === STARS.length) pass("দিক আলাদা হলে vector-ও আলাদা।");
  };

  return (
    <>
      <Plane
        f={F1}
        ticks={1}
        label={`an arrow from the origin to ${tup(tip)}; drag its tip`}
        drag={{ down: put, move: put }}
        onKey={nudger((d) => put(plus(tip, d)))}
      >
        {hit.map((i) => (
          <Arrow key={i} f={F1} from={O} to={STARS[i]} tone={i ? "coral" : "blue"} faint />
        ))}
        {STARS.map((s, i) => (
          <Star key={i} f={F1} at={s} done={hit.includes(i)} />
        ))}
        <Arrow f={F1} from={O} to={tip} w={3} tone="ink" />
        <circle cx={F1.sx(tip[0])} cy={F1.sy(tip[1])} r={9} strokeWidth={2} className="fill-cat-blue/20 stroke-cat-blue" />
      </Plane>
      <ArrowCard v={tip} max={10} />
      {hit.length > 0 && (
        <div className={`${FADE} mx-auto mt-3 grid max-w-sm gap-1.5`}>
          {hit.map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-foreground/5 px-3 py-1.5 text-sm">
              <b className={`w-14 font-mono ${i ? "text-cat-coral" : "text-cat-blue"}`}>{tup(STARS[i])}</b>
              <span className="w-28 shrink-0">{heading(STARS[i]).word}</span>
              <LengthBar v={STARS[i]} max={10} />
            </div>
          ))}
        </div>
      )}
      <Ticks
        items={[
          ["(3, 1)-এর তারা", hit.includes(0)],
          ["(1, 3)-এর তারা", hit.includes(1)],
        ]}
      />
      <Task done={hit.length === STARS.length}>Arrow-এর মাথা টেনে (বা tap করে) দুইটা তারার ওপরই বসান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Carry (3, 1) anywhere. Start and end change; end − start does not. Each
//     place it is dropped leaves a ghost, so the copies pile up side by side.

const V31: XY = [3, 1];
const PLACES_GOAL = 3;

/** Where (3, 1) may sit so that it stays on the sheet. */
const keepOn = (t: XY): XY => [clamp(Math.round(t[0]), F1.x0, F1.x1 - V31[0]), clamp(Math.round(t[1]), F1.y0, F1.y1 - V31[1])];

/** শেষ − শুরু worked out ঘরে ঘরে: x first, then y, whenever the arrow is moved. */
function MinusReadout({ head, tail }: { head: XY; tail: XY }) {
  return <MinusSteps key={`${head.join()}|${tail.join()}`} head={head} tail={tail} />;
}

function MinusSteps({ head, tail }: { head: XY; tail: XY }) {
  const k = useCountUp(2, 330);
  const d = minus(head, tail);
  const out = (i: 0 | 1) => (
    <b className={`inline-block min-w-[1ch] ${k > i ? `${POP} text-cat-blue` : "text-transparent"}`}>{d[i]}</b>
  );
  return (
    <div className="grid gap-0.5 text-center">
      <span className="font-sans text-sm text-muted">শেষ − শুরু</span>
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 text-lg">
        <span className="whitespace-nowrap text-muted">
          ({head[0]} − {tail[0]}, {head[1]} − {tail[1]})
        </span>
        <span className="text-muted">=</span>
        <span className="whitespace-nowrap">
          <span className="text-muted">(</span>
          {out(0)}
          <span className="text-muted">, </span>
          {out(1)}
          <span className="text-muted">)</span>
        </span>
      </div>
    </div>
  );
}

export function SlideArrow() {
  const pass = useGate();
  const [tail, setTail] = useState<XY>(O);
  const [grab, setGrab] = useState<XY | null>(null);
  const [spots, setSpots] = useState<string[]>([]);
  const head = plus(tail, V31);

  const drop = (t: XY) => {
    const key = t.join(",");
    if (key === "0,0" || spots.includes(key)) return;
    sfx.pencil(0.3);
    const next = [...spots, key];
    setSpots(next);
    if (next.length === PLACES_GOAL) pass("যেখানেই রাখুন, vector সেই (3, 1)।");
  };

  const down = (p: XY) => {
    // Grabbed on the arrow: keep the grip. Grabbed elsewhere: centre it under the finger.
    const g = minus(p, tail);
    const onIt = g[0] > -0.7 && g[0] < V31[0] + 0.7 && Math.abs(g[1] - (g[0] * V31[1]) / V31[0]) < 0.9;
    const grip: XY = onIt ? g : [V31[0] / 2, V31[1] / 2];
    setGrab(grip);
    setTail(keepOn(minus(p, grip)));
  };

  return (
    <>
      <Plane
        f={F1}
        ticks={1}
        label={`the arrow (3, 1) drawn from ${tup(tail)} to ${tup(head)}; drag it anywhere`}
        drag={{
          down,
          move: (p) => {
            if (grab) setTail(keepOn(minus(p, grab)));
          },
          up: () => {
            setGrab(null);
            drop(tail);
          },
        }}
        onKey={nudger((d) => {
          const t = keepOn(plus(tail, d));
          setTail(t);
          drop(t);
        })}
      >
        {spots.map((s) => {
          const t = s.split(",").map(Number) as XY;
          return <Arrow key={s} f={F1} from={t} to={plus(t, V31)} faint />;
        })}
        <Arrow f={F1} from={tail} to={head} w={3.4} />
        <Dot f={F1} at={tail} r={3.5} className="fill-cat-blue" />
      </Plane>
      <div className="mx-auto grid max-w-sm gap-1 rounded-2xl border border-border px-4 py-3 text-center font-mono">
        <div className="text-[0.95rem]">
          <span className="font-sans text-muted">শুরু </span>
          <b key={`s${tail.join()}`} className={`${POP} inline-block`}>
            {tup(tail)}
          </b>
          <span className="font-sans text-muted"> · শেষ </span>
          <b key={`e${head.join()}`} className={`${POP} inline-block`}>
            {tup(head)}
          </b>
        </div>
        <MinusReadout head={head} tail={tail} />
      </div>
      <Task done={spots.length >= PLACES_GOAL}>
        Arrow-টা ধরে কাগজের অন্তত তিনটা আলাদা জায়গায় রাখুন ({bn(Math.min(spots.length, PLACES_GOAL))}/{bn(PLACES_GOAL)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Four arrows, four sums. A wrong pick that is the end point says so.

const ABCD: { id: string; s: XY; e: XY }[] = [
  { id: "A", s: [0, 0], e: [3, 1] },
  { id: "B", s: [2, 2], e: [5, 3] },
  { id: "C", s: [1, 4], e: [4, 5] },
  { id: "D", s: [0, 0], e: [1, 3] },
];
const CANDS: XY[] = [
  [3, 1],
  [1, 3],
  [5, 3],
];
const toneOf = (v: XY): Tone => (same(v, V31) ? "blue" : "coral");

export function SortArrows() {
  const pass = useGate();
  const clip = useId();
  const [open, setOpen] = useSeed("open", 0);
  const [solved, setSolved] = useState<number[]>([]);
  const [cand, setCand] = useSeed<XY | null>("cand", null);
  const [miss, setMiss] = useState(0);
  const grow = usePlay(110);
  const a = ABCD[open];
  const want = minus(a.e, a.s);
  const done = solved.length === ABCD.length;
  const t = cand === null ? 0 : grow.running ? Math.min(1, grow.k / 6) : 1;
  const wrong = cand !== null && !grow.running && !same(cand, want);

  const choose = (c: XY) => {
    if (grow.running || solved.includes(open)) return;
    setCand(c);
    // laid on the picture from the arrow's own tail; one beat more to land
    grow.play(7, () => {
      if (!same(c, want)) {
        setMiss((m) => m + 1);
        return;
      }
      const next = [...solved, open];
      setSolved(next);
      setCand(null);
      const rest = ABCD.findIndex((_, i) => !next.includes(i));
      if (rest >= 0) setOpen(rest);
      else pass("একই vector, তিন জায়গায় আঁকা।");
    });
  };

  return (
    <>
      <Plane f={F1} ticks={1} label="four arrows, A to D, drawn in different places">
        <defs>
          <SheetClip id={clip} f={F1} />
        </defs>
        {ABCD.map((r, i) => {
          const ok = solved.includes(i);
          const mid = mix(r.s, r.e, 0.5);
          return (
            <g
              key={r.id}
              role="button"
              tabIndex={0}
              aria-label={`arrow ${r.id}`}
              className="cursor-pointer outline-none"
              onClick={() => {
                if (grow.running) return;
                setOpen(i);
                setCand(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (grow.running) return;
                  setOpen(i);
                  setCand(null);
                }
              }}
            >
              <path d={`M${F1.sx(r.s[0])} ${F1.sy(r.s[1])}L${F1.sx(r.e[0])} ${F1.sy(r.e[1])}`} strokeWidth={18} className="fill-none stroke-transparent" />
              <Arrow f={F1} from={r.s} to={r.e} tone={ok ? toneOf(minus(r.e, r.s)) : "ink"} w={i === open && !done ? 3.6 : 2.4} />
              <Dot f={F1} at={r.s} r={3} className={ok ? "fill-foreground/50" : "fill-[#0f1b2d]"} />
              <Label f={F1} at={mid} dx={-9} dy={-7} size={11} weight={700} className={i === open && !done ? "fill-cat-violet" : "fill-[#0f1b2d]"}>
                {ok ? `${r.id} = ${tup(minus(r.e, r.s))}` : r.id}
              </Label>
            </g>
          );
        })}
        {cand !== null && !done && <Ghost f={F1} from={a.s} v={cand} t={t} id={clip} />}
      </Plane>
      {done ? (
        <div className={`${FADE} text-center text-lg font-semibold`}>
          <span className="text-cat-blue">A, B, C = (3, 1)</span> · <span className="text-cat-coral">D = (1, 3)</span>
        </div>
      ) : (
        <div key={open} className={`${FADE} mx-auto max-w-sm rounded-2xl border border-border px-4 py-3 text-center`}>
          <div className="text-sm text-muted">
            Arrow <b className="text-cat-violet">{a.id}</b>: Start <span className="font-mono">{tup(a.s)}</span>, শেষ{" "}
            <span className="font-mono">{tup(a.e)}</span>
          </div>
          <div className="mt-1 font-mono text-lg">
            ({a.e[0]} − {a.s[0]}, {a.e[1]} − {a.s[1]}) = ?
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {CANDS.map((c) => (
              <button
                key={c.join()}
                type="button"
                disabled={grow.running}
                onClick={() => choose(c)}
                className="h-10 cursor-pointer rounded-full border-2 border-border px-4 font-mono font-semibold transition-colors hover:border-cat-blue/60 disabled:cursor-default disabled:opacity-60"
              >
                {tup(c)}
              </button>
            ))}
          </div>
        </div>
      )}
      {wrong && cand && !done && (
        <Nope key={miss}>
          {same(cand, a.e)
            ? `${tup(cand)} তো শেষের point-টা. শুরু থেকে আঁকলে মাথায় মিললো না, শুরুরটা বিয়োগ করতে ভুলে গেছেন।`
            : `শুরু থেকে ${tup(cand)} আঁকলাম, মাথায় মিললো না. ${tup(a.e)} থেকে ${tup(a.s)} ঘরে ঘরে বিয়োগ করে দেখুন।`}
        </Nope>
      )}
      <Task done={done}>
        চারটা arrow-এরই vector বের করুন ({bn(solved.length)}/{bn(ABCD.length)})। চাইলে অন্য arrow-এ tap করে আগে সেটা নিয়ে কাজ করতে পারেন।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Bring them home: A, B and C slide to the origin and become one arrow.

export function SlideHome() {
  const pass = useGate();
  const [home, setHome] = useState(false);
  const [p] = useTween([home ? 1 : 0], 1300);
  const settle = usePlay(1400);
  const there = p > 0.97;

  const toggle = () => {
    const h = !home;
    sfx.whoosh(0.4);
    setHome(h);
    if (h) settle.play(1, () => pass("সরিয়ে বসালে তিনটাই একটা arrow।"));
  };

  return (
    <>
      <Plane f={F1} ticks={1} label={home ? "all four arrows drawn from the origin" : "four arrows, A to D, drawn in different places"}>
        {ABCD.map((r) => {
          const v = minus(r.e, r.s);
          const s = mix(r.s, O, p);
          return (
            <g key={r.id}>
              <Arrow f={F1} from={s} to={plus(s, v)} tone={toneOf(v)} w={2.8} />
              <g style={{ opacity: 1 - p }}>
                <Label f={F1} at={mix(s, plus(s, v), 0.5)} dx={-9} dy={-7} size={11} weight={700}>
                  {r.id}
                </Label>
              </g>
            </g>
          );
        })}
        {there && (
          <>
            <Dot f={F1} at={V31} r={4.5} className="fill-cat-blue" pop />
            <Label f={F1} at={V31} dx={8} dy={4} anchor="start" className={`${POP} fill-cat-blue`}>
              A, B, C → (3, 1)
            </Label>
            <Dot f={F1} at={[1, 3]} r={4.5} className="fill-cat-coral" pop />
            <Label f={F1} at={[1, 3]} dx={8} dy={-4} anchor="start" className={`${POP} fill-cat-coral`}>
              D → (1, 3)
            </Label>
          </>
        )}
      </Plane>
      <div className="flex justify-center">
        <button type="button" onClick={toggle} className={home ? quietBtn : primaryBtn}>
          {home ? "আবার আগের জায়গায় পাঠান" : "চারটাকেই origin-এ নিয়ে আসুন"}
        </button>
      </div>
      <Task done={settle.k === 1}>চারটা arrow-এর লেজ origin-এ নিয়ে আসুন, দেখুন কী হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · A street map. One instruction, walked from three corners: three arrows,
//     one direction, one distance. The map is not paper, so it is on theme
//     tokens.

const FM = makeFrame(0, 8, 0, 6, 36, 20);
const MOVE: XY = [2, 1];
const PLACES: { name: string; at: XY; dx: number; dy: number; anchor: "start" | "middle" | "end" }[] = [
  { name: "ধানমন্ডি ২৭-এর মোড়", at: [1, 1], dx: 0, dy: 16, anchor: "middle" },
  { name: "স্কুলের গেট", at: [1, 4], dx: -6, dy: -8, anchor: "start" },
  { name: "চায়ের দোকান", at: [4, 2], dx: 0, dy: 16, anchor: "middle" },
  { name: "বাসস্ট্যান্ড", at: [5, 4], dx: 0, dy: -9, anchor: "middle" },
];
const WALK_TONES: Tone[] = ["teal", "blue", "coral", "violet"];

export function CityWalk() {
  const pass = useGate();
  const [from, setFrom] = useState<number | null>(null);
  const [walked, setWalked] = useState<number[]>([]);
  const w = useWalk(420);
  // a footstep for every block walked
  const walkedTo = w.trail.length;
  useEffect(() => {
    if (w.running && walkedTo > 1) sfx.footstep();
  }, [w.running, walkedTo]);

  const start = (i: number) => {
    if (w.running) return;
    setFrom(i);
    w.go(route(PLACES[i].at, MOVE), () => {
      if (walked.includes(i)) return;
      const next = [...walked, i];
      setWalked(next);
      if (next.length === 3) pass("শুরু আলাদা, অথচ arrow একই।");
    });
  };

  let blocks = "";
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 6; j++) {
      const x = FM.sx(i) + 5;
      const y = FM.sy(j + 1) + 5;
      const s = FM.u - 10;
      blocks += `M${x} ${y}h${s}v${s}h${-s}z`;
    }

  return (
    <>
      <div className="mt-5 rounded-2xl bg-cat-teal/10 px-4 py-3 text-center text-[1.05rem] font-semibold">“দুই গলি পূর্বে যান, তারপর এক গলি উত্তরে।”</div>
      <Plane f={FM} paper={false} grid={0} axes={false} label="a street map; the same instruction walked from different corners" className="max-w-[24rem]">
        <rect x={FM.sx(0)} y={FM.sy(6)} width={8 * FM.u} height={6 * FM.u} rx={10} className="fill-foreground/[0.05]" />
        <path d={blocks} className="fill-cat-amber/15" />
        <text x={FM.sx(8) - 6} y={FM.sy(6) + 14} textAnchor="end" fontSize={10} fontWeight={700} className="fill-muted">
          উ ↑
        </text>
        {walked.map((i) => (
          <Arrow key={i} f={FM} from={PLACES[i].at} to={plus(PLACES[i].at, MOVE)} tone={WALK_TONES[i]} draw w={3.2} />
        ))}
        {w.running && from !== null && <Trail f={FM} cells={w.trail} />}
        {PLACES.map((pl, i) => (
          <g
            key={pl.name}
            role="button"
            tabIndex={0}
            aria-label={pl.name}
            className="cursor-pointer outline-none"
            onClick={() => start(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                start(i);
              }
            }}
          >
            <circle cx={FM.sx(pl.at[0])} cy={FM.sy(pl.at[1])} r={14} className="fill-transparent" />
            <circle cx={FM.sx(pl.at[0])} cy={FM.sy(pl.at[1])} r={5.5} strokeWidth={2} className="fill-surface stroke-foreground" />
            <text x={FM.sx(pl.at[0]) + pl.dx} y={FM.sy(pl.at[1]) + pl.dy} textAnchor={pl.anchor} fontSize={10} fontWeight={600} className="fill-foreground">
              {pl.name}
            </text>
          </g>
        ))}
        {from !== null && (
          <g
            style={{ transform: `translate(${FM.sx(w.here[0])}px, ${FM.sy(w.here[1])}px)` }}
            className="pointer-events-none transition-transform duration-300 ease-in-out motion-reduce:transition-none"
          >
            <circle r={7} className="fill-cat-teal" />
            <circle r={2.5} className="fill-white" />
          </g>
        )}
      </Plane>
      <div className="flex flex-wrap justify-center gap-2">
        {PLACES.map((pl, i) => (
          <button
            key={pl.name}
            type="button"
            disabled={w.running}
            onClick={() => start(i)}
            className="cursor-pointer rounded-full border-2 border-border px-3 py-1 text-sm font-semibold transition-colors hover:border-cat-teal/60 disabled:cursor-default disabled:opacity-50"
          >
            {walked.includes(i) ? "✓ " : ""}
            {pl.name}
          </button>
        ))}
      </div>
      <Task done={walked.length >= 3}>
        ম্যাপের তিনটা আলাদা জায়গা থেকে instruction-টা মেনে হাঁটুন ({bn(Math.min(walked.length, 3))}/৩)
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Sort the sentences: a place, or a move?

type Kind = "point" | "vector";
const SAYINGS: { say: string; kind: Kind; hint: string }[] = [
  { say: "ধানমন্ডি ২৭-এর মোড়", kind: "point", hint: "এটা কি কোথাও যেতে বলছে, নাকি একটা জায়গার নাম?" },
  { say: "উত্তর-পূর্ব দিকে 20 km যান", kind: "vector", hint: "এখানে একটা দিক আছে আর একটা দূরত্ব। কোথা থেকে শুরু, বলা নাই।" },
  { say: "ঢাকা আছে (23.8°N, 90.4°E)-এ", kind: "point", hint: "দুইটা সংখ্যা আছে ঠিকই, কিন্তু প্রশ্নটা কী? “কোথায়?”" },
  { say: "ডানে 3 ঘর, তারপর ওপরে 2 ঘর", kind: "vector", hint: "Shiku-র recipe। যেকোনো ঘর থেকে Start করা যায়।" },
  { say: "স্কুল থেকে বাসায় যেতে যতটা হাঁটতে হয়", kind: "vector", hint: "দুইটা জায়গার মাঝের সম্পর্ক। নিজে কোনো জায়গা না।" },
  { say: "বাসার address: রোড ৫, বাড়ি ১২", kind: "point", hint: "address মানেই “কোথায়?”" },
];
const KINDS: { id: Kind; label: string; q: string; tone: string }[] = [
  { id: "point", label: "জায়গা (point)", q: "কোথায়?", tone: "border-cat-teal/60 text-cat-teal" },
  { id: "vector", label: "যাওয়া (vector)", q: "কোন দিকে, কত দূর?", tone: "border-cat-blue/60 text-cat-blue" },
];

export function PointOrMove() {
  const pass = useGate();
  const [k, setK] = useState(0);
  const [miss, setMiss] = useState(0);
  const done = k === SAYINGS.length;
  const card = SAYINGS[k];

  const drop = (kind: Kind) => {
    if (done) return;
    if (kind !== card.kind) {
      setMiss((m) => m + 1);
      return;
    }
    setMiss(0);
    setK(k + 1);
    if (k + 1 === SAYINGS.length) pass("Point মানে জায়গা, vector মানে হাঁটা।");
  };

  return (
    <>
      <div className="min-h-24">
        {done ? (
          <div className={`${FADE} mt-5 text-center text-lg font-semibold`}>ছয়টাই বাছাই শেষ!</div>
        ) : (
          <div key={k} className={`${FADE} mx-auto mt-5 max-w-md -rotate-1 rounded-xl border-2 border-dashed border-cat-amber/60 bg-cat-amber/5 px-4 py-3 text-center`}>
            <div className="mb-1 text-xs font-medium text-muted">
              {bn(k + 1)}/{bn(SAYINGS.length)}
            </div>
            <div className="text-[1.05rem] font-semibold">“{card.say}”</div>
          </div>
        )}
      </div>
      {miss > 0 && !done && <Nope key={miss}>উঁহু। {card.hint}</Nope>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {KINDS.map((b) => (
          <button
            key={b.id}
            type="button"
            disabled={done}
            onClick={() => drop(b.id)}
            className={`flex min-h-36 cursor-pointer flex-col rounded-xl border-2 px-2 py-2 transition-colors hover:bg-foreground/5 disabled:cursor-default disabled:hover:bg-transparent ${b.tone}`}
          >
            <span className="text-center font-bold">{b.label}</span>
            <span className="text-center text-xs text-muted">{b.q}</span>
            <span className="mt-2 flex flex-col gap-1">
              {SAYINGS.slice(0, k)
                .filter((s) => s.kind === b.id)
                .map((s) => (
                  <span key={s.say} className={`${POP} rounded-md bg-foreground/5 px-1.5 py-0.5 text-center text-xs leading-snug text-foreground`}>
                    {s.say}
                  </span>
                ))}
            </span>
          </button>
        ))}
      </div>
      <Task done={done}>
        প্রত্যেকটা কথা ঠিক দলে ফেলুন ({bn(k)}/{bn(SAYINGS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Signs are directions. Send Shiku to (−2, 3), then to (2, −3).

const OPP: XY[] = [
  [-2, 3],
  [2, -3],
];

export function Opposite() {
  const pass = useGate();
  const [v, setV] = useState<XY>([2, 3]);
  const [stage, setStage] = useState(0);
  const [note, setNote] = useState<{ n: number; text: string } | null>(null);
  const w = useWalk(240);
  const done = stage === OPP.length;

  const run = () => {
    const recipe = v;
    setNote(null);
    w.go(route(O, recipe), () => {
      if (done) return;
      const want = OPP[stage];
      if (same(recipe, want)) {
        setStage(stage + 1);
        if (stage + 1 === OPP.length) pass("Minus মানে ছোট না, উল্টো।");
      } else {
        const off = minus(want, recipe);
        setNote((m) => ({
          n: (m?.n ?? 0) + 1,
          text: `তারা এখনো ${[
            off[0] ? `${off[0] > 0 ? "ডানে" : "বামে"} ${bn(Math.abs(off[0]))} ঘর` : "",
            off[1] ? `${off[1] > 0 ? "ওপরে" : "নিচে"} ${bn(Math.abs(off[1]))} ঘর` : "",
          ]
            .filter(Boolean)
            .join(" আর ")} দূরে।`,
        }));
      }
    });
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-2xl bg-cat-violet/5 px-4 py-4 font-mono text-lg">
        <span className="font-semibold">v = (</span>
        <Stepper value={v[0]} min={-5} max={5} label="প্রথম সংখ্যা" disabled={w.running} onChange={(a) => setV([a, v[1]])} />
        <span>,</span>
        <Stepper value={v[1]} min={-4} max={4} label="দ্বিতীয় সংখ্যা" disabled={w.running} onChange={(b) => setV([v[0], b])} />
        <span>)</span>
        <button type="button" onClick={run} disabled={w.running} className={`${primaryBtn} bg-cat-violet font-sans text-base`}>
          ▶ চালান
        </button>
      </div>
      <Plane f={F2} ticks={1} label="a sheet with all four quarters; targets at (−2, 3) and (2, −3)" className="max-w-[21rem]">
        {done && <path d={`M${F2.sx(-2)} ${F2.sy(3)}L${F2.sx(2)} ${F2.sy(-3)}`} strokeDasharray="3 4" strokeWidth={1} className={`${FADE} fill-none stroke-[#94a3b8]`} />}
        {OPP.slice(0, stage).map((t, i) => (
          <Arrow key={i} f={F2} from={O} to={t} tone={i ? "coral" : "blue"} draw w={3} />
        ))}
        {OPP.map((t, i) => (i <= stage ? <Star key={i} f={F2} at={t} done={i < stage} /> : null))}
        <Trail f={F2} cells={w.trail} faint={!w.running} />
        <Shiku f={F2} at={w.here} />
      </Plane>
      {note && !done && <Nope key={note.n}>{note.text}</Nope>}
      <Ticks
        items={[
          ["(−2, 3)-এর তারা", stage >= 1],
          ["(2, −3)-এর তারা", stage >= 2],
        ]}
      />
      <Task done={done}>সংখ্যা ঠিক করে Shiku-কে তারার কাছে পাঠান। Minus দিলে সে উল্টো দিকে হাঁটবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The zero vector. Drag the tip home, and the needle has nothing to follow.

export function ZeroArrow() {
  const pass = useGate();
  const [tip, setTip] = useState<XY>([3, 2]);
  const [zeroed, setZeroed] = useState(false);
  const zero = same(tip, O);

  const put = (p: XY) => {
    const t = snap(p, F2);
    setTip(t);
    if (same(t, O) && !zeroed) {
      setZeroed(true);
      pass("Zero vector-এর কোনো দিক নাই।");
    }
  };

  return (
    <>
      <Plane f={F2} ticks={1} label={`an arrow from the origin to ${tup(tip)}; drag its tip`} drag={{ down: put, move: put }} onKey={nudger((d) => put(plus(tip, d)))} className="max-w-[21rem]">
        <Arrow f={F2} from={O} to={tip} w={3} tone="ink" />
        {zero ? (
          <circle cx={F2.sx(0)} cy={F2.sy(0)} r={7} className={`${POP} fill-danger`} />
        ) : (
          <circle cx={F2.sx(tip[0])} cy={F2.sy(tip[1])} r={9} strokeWidth={2} className="fill-cat-blue/20 stroke-cat-blue" />
        )}
      </Plane>
      <ArrowCard v={tip} max={Math.hypot(5, 4)} />
      {zero && (
        <div className={`${FADE} mt-3 text-center text-[1.05rem]`}>
          <b className="font-mono">0 = (0, 0)</b>: একটা arrow, যেটা কোথাও যায় না।
        </div>
      )}
      <Task done={zeroed}>Arrow-এর মাথা টেনে একদম origin-এ, (0, 0)-তে নিয়ে আসুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · The numbers as a recipe of unit steps. Chain one-square arrows head to
//      tail until the chain reaches the star; the order does not matter.

const UNIT_GOAL: XY = [3, -2];
const STEP_BTNS: { d: XY; glyph: string; label: string; tone: string }[] = [
  { d: [1, 0], glyph: "→", label: "ডানে এক পা", tone: "text-cat-blue" },
  { d: [-1, 0], glyph: "←", label: "বামে এক পা", tone: "text-cat-blue" },
  { d: [0, 1], glyph: "↑", label: "ওপরে এক পা", tone: "text-cat-coral" },
  { d: [0, -1], glyph: "↓", label: "নিচে এক পা", tone: "text-cat-coral" },
];
const MAX_STEPS = 16;

export function UnitSteps() {
  const pass = useGate();
  const [steps, setSteps] = useState<XY[]>([]);
  const pts = steps.reduce<XY[]>((acc, d) => [...acc, plus(acc[acc.length - 1], d)], [O]);
  const end = pts[pts.length - 1];
  const reached = steps.length > 0 && same(end, UNIT_GOAL);

  const add = (d: XY) => {
    if (reached || steps.length >= MAX_STEPS) return;
    const nextEnd = plus(end, d);
    if (nextEnd[0] < F2.x0 || nextEnd[0] > F2.x1 || nextEnd[1] < F2.y0 || nextEnd[1] > F2.y1) return;
    sfx.pencil(0.15);
    setSteps([...steps, d]);
    if (same(nextEnd, UNIT_GOAL)) pass("সংখ্যাগুলো বলে কোন axis-এ কত পা।");
  };

  return (
    <>
      <Plane f={F2} ticks={1} label={`a chain of ${steps.length} one-square arrows ending at ${tup(end)}`} className="max-w-[21rem]">
        <Star f={F2} at={UNIT_GOAL} done={reached} />
        {steps.map((d, i) => (
          <Arrow key={i} f={F2} from={pts[i]} to={pts[i + 1]} tone={d[0] ? "blue" : "coral"} w={2.4} />
        ))}
        {reached && <Arrow key="sum" f={F2} from={O} to={end} tone="ink" w={3.2} draw />}
        <Dot f={F2} at={end} r={3.5} className="fill-cat-violet" />
      </Plane>
      <div className="mx-auto flex max-w-sm flex-wrap items-center justify-center gap-2">
        {STEP_BTNS.map((b) => (
          <button
            key={b.glyph}
            type="button"
            aria-label={b.label}
            disabled={reached}
            onClick={() => add(b.d)}
            className={`grid size-11 cursor-pointer place-items-center rounded-xl border-b-4 border-border bg-foreground/5 text-xl font-bold transition-all hover:bg-foreground/10 active:translate-y-0.5 active:border-b-2 disabled:cursor-default disabled:opacity-40 ${b.tone}`}
          >
            {b.glyph}
          </button>
        ))}
        <button type="button" onClick={() => setSteps(steps.slice(0, -1))} disabled={!steps.length || reached} className={`${quietBtn} h-11 px-3 text-sm`}>
          ↶ এক পা পিছে
        </button>
        <button type="button" onClick={() => setSteps([])} disabled={!steps.length} className={`${quietBtn} h-11 px-3 text-sm`}>
          ↺ আবার
        </button>
      </div>
      <div className="mt-4 text-center font-mono text-lg">
        <span className="text-cat-blue">{end[0] < 0 ? `(−${-end[0]})` : end[0]} × →</span>
        <span className="text-muted"> + </span>
        <span className="text-cat-coral">{end[1] < 0 ? `(−${-end[1]})` : end[1]} × ↑</span>
        <span className="text-muted"> = </span>
        <b>{tup(end)}</b>
      </div>
      <Task done={reached}>তারা, {tup(UNIT_GOAL)} পর্যন্ত পৌঁছান। কোন order-এ জুড়বেন, আপনার ইচ্ছা।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11 · The last picture: (3, 1) stamped all over the sheet, then every copy
//      slides home and they are one arrow.

const REEL_SPOTS: XY[] = [
  [0, 0],
  [2, 2],
  [4, 0],
  [1, 4],
  [4, 3],
];

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const k = useCountUp(REEL_SPOTS.length + 2, 800);
  const shown = REEL_SPOTS.slice(0, Math.min(k, REEL_SPOTS.length));
  useEffect(() => {
    if (k > 0 && k <= REEL_SPOTS.length) sfx.pencil(0.3);
    else if (k === REEL_SPOTS.length + 1) sfx.whoosh(0.6);
  }, [k]);
  const [p] = useTween([k > REEL_SPOTS.length ? 1 : 0], 1300);
  const last = k === REEL_SPOTS.length + 2;

  return (
    <>
      <Plane f={F1} ticks={1} label="the arrow (3, 1) drawn in five places, then all of them slid to the origin">
        {shown.map((s, i) => {
          const t = mix(s, O, p);
          return <Arrow key={i} f={F1} from={t} to={plus(t, V31)} w={3} draw={p === 0} />;
        })}
      </Plane>
      <div className="min-h-24 text-center">
        {last ? (
          <div className={FADE}>
            <div className="text-xl font-bold">যেখানেই আঁকুন, একটাই vector</div>
            <div className="text-muted">direction আর length, এর বেশি কিছু না</div>
            <button
              type="button"
              onClick={onReplay}
              className="mt-3 cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              ↺ আবার দেখুন
            </button>
          </div>
        ) : (
          <div className="font-mono text-lg">
            (3, 1) × <span className="tabular-nums">{shown.length}</span>
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
// Animation pass. 2.2 was one journey of fifteen steps; it is now two. 2.2
// (02b_vector_arrow) runs from Shiku's recipe to the arrow with no address and
// its position vector; 2.2b (02b2_point_or_move) is the street, point against
// move, signs, the zero vector and the numbers as unit steps. Everything below
// is new: the three recall Checks turned into animated questions, a story scene
// where a setup tells one, and a figure where the words describe a picture.

type Story = { story?: boolean };

/** The corner of a sheet a figure may not draw past: a clip for arrows that run off it. */
function SheetClip({ id, f }: { id: string; f: Frame }) {
  return (
    <clipPath id={id}>
      <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} />
    </clipPath>
  );
}

// ---------------------------------------------------------------------------
// 0 · 2.2 screen 1, the recall as an animated question: the whole file flipped.
//     Whatever the reader picks, the sheet plays the real thing: every dot
//     glides to its mirror image and the two pairs stay pairs.

const FR_DOTS: XY[] = [
  [18, 30],
  [30, 22],
  [66, 70],
  [80, 62],
  [24, 74],
];
const FR_PAIRS: [number, number][] = [
  [0, 1],
  [2, 3],
];
const FR_OPTS = ["কে কার কাছাকাছি, কিছুই বদলালো না", "সবার partner বদলে গেল", "Program error দিলো"];
const FR_RIGHT = 0;
const FR_NOPE = [
  "",
  "Partner বদলায়নি. দাগগুলো ঘুরলো, তবে যে দুইজন পাশাপাশি ছিল তারা এখনো পাশাপাশি. আয়নায় দেখা ম্যাপের কথা মনে করুন.",
  "Error আসেনি. Program ঠিক যা বলা হলো তাই করলো, শুধু দাগগুলো ঘুরলো. আয়নায় দেখা ম্যাপের কথা মনে করুন.",
];

function FlipSheet({ run }: { run: boolean }) {
  const seeded = useSeeded();
  const [t] = useTween([run ? 1 : 0], 1000, [0]);
  const p = seeded ? (run ? 1 : 0) : t;
  const at = FR_DOTS.map(([a, b]): XY => [a + (b - a) * p, b + (a - b) * p]);
  const X = (a: number) => 40 + a;
  const Y = (b: number) => 112 - b;
  return (
    <svg viewBox="0 0 180 132" role="img" aria-label="ক্লাসের পাঁচজনের dot, একটা কাগজে. পুরো file উল্টালে dot-গুলো আয়নায় দেখার মতো সরে যায়" className="mx-auto my-3 block h-auto w-full max-w-[13rem] select-none">
      <rect x={40} y={12} width={100} height={100} rx={3} fill="white" stroke="#0f1b2d" strokeOpacity={0.3} />
      {run && <path d={`M40 112L140 12`} strokeDasharray="3 4" strokeWidth={1} className={`${FADE} fill-none stroke-[#94a3b8]`} />}
      {FR_PAIRS.map(([i, j]) => (
        <path key={i} d={`M${X(at[i][0])} ${Y(at[i][1])}L${X(at[j][0])} ${Y(at[j][1])}`} strokeWidth={1.4} className="fill-none stroke-cat-amber" />
      ))}
      {at.map((d, i) => (
        <circle key={i} cx={X(d[0])} cy={Y(d[1])} r={3.6} className="fill-[#2563eb]" />
      ))}
      <text x={90} y={125} textAnchor="middle" fontSize={8} fontWeight={600} fill="#0f1b2d">
        {p < 0.5 ? "height →" : "weight →"}
      </text>
      <text transform="translate(33 62) rotate(-90)" textAnchor="middle" fontSize={8} fontWeight={600} fill="#0f1b2d">
        {p < 0.5 ? "weight →" : "height →"}
      </text>
    </svg>
  );
}

export function FlipRecall() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [tries, setTries] = useState(0);
  const [miss, setMiss] = useState(0);
  const play = usePlay(1100);
  const over = pick !== null && !play.running;
  const right = over && pick === FR_RIGHT;

  const choose = (i: number) => {
    if (play.running || right) return;
    setPick(i);
    setTries((t) => t + 1);
    play.play(1, () => (i === FR_RIGHT ? pass("পুরো file উল্টালে কিছুই বদলায় না.") : setMiss((m) => m + 1)));
  };

  return (
    <>
      <FlipSheet key={tries} run={pick !== null} />
      <div className="grid gap-2">
        {FR_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && over ? (i === FR_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={play.running || right} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {over && pick !== FR_RIGHT && <Nope key={miss}>{FR_NOPE[pick ?? 0]}</Nope>}
      <Task done={right}>সামিন পুরো file-এর সব row একই নিয়মে উল্টে দিলে কী হয়েছিল, বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 2: "go and get the ball" gets Shiku nowhere;
//      the two numbers get him there.

export function ShikuErrand({}: Story) {
  const s = useScene(2, [600, 2400, 3000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ফাহিম Shiku-কে বলটা আনতে বলছে. শুধু যাও বললে সে নড়ে না. ডানে ১০ ঘর, ওপরে ১২ ঘর বললে হাঁটতে শুরু করে">
        <circle cx={288} cy={145} r={5} fill="#f59e0b" />
        <Person who="fahim" x={70} y={150} arm={k >= 1 ? "point" : "down"} label />
        <Robot x={k >= 2 ? 268 : 150} y={150} ms={1800} walking={k >= 2} />
        {k === 1 && <Bubble x={70} y={84} side="right" lines={["যাও, গিয়ে বলটা", "নিয়ে আসো."]} />}
        {k >= 2 && <Bubble x={70} y={84} side="right" lines={["ডানে 10 ঘর যাও,", "তারপর ওপরে 12 ঘর."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 3's setup: Shiku walks right, then up; what stays on
//      the paper is one straight arrow from where he started to where he
//      stopped. Then its two names: the way it points, and how long it is. No
//      numbers on either: PointIt's bars come next, and measuring is 2.3's job.

const WA_F = makeFrame(-2, 4, -1, 5, 24, 12);
const WA_V: XY = [2, 3];
const WA_CAP = [
  "Shiku origin-এ দাঁড়িয়ে. এখান থেকেই শুরু.",
  "আগে ডানে 2 ঘর.",
  "তারপর ওপরে 3 ঘর. এখানে থামলো.",
  "হাঁটা শেষে কাগজে রয়ে গেল একটা সোজা arrow. শুরু থেকে থামা পর্যন্ত.",
  "Arrow-টা কোন দিকে তাক করা, সেটা ওর direction.",
  "আর arrow-টা কত লম্বা, সেটা ওর magnitude.",
];

export function WalkLeavesArrow({}: Story) {
  const s = useScene(5, [600, 1400, 1600, 2600, 2400]);
  const k = s.k;
  const [x, y] = useTween(k >= 2 ? WA_V : k === 1 ? [2, 0] : O, 1000);
  const trail: XY[] = y > 0.01 ? [O, [2, 0], [x, y]] : [O, [x, 0]];
  // the arrow on screen, its far end pushed on along the same line, and a tape
  // laid beside it on the empty upper-left side (the trail has the other), all
  // in screen units
  const [ax, ay, bx, by] = [WA_F.sx(0), WA_F.sy(0), WA_F.sx(WA_V[0]), WA_F.sy(WA_V[1])];
  const len = Math.hypot(bx - ax, by - ay);
  const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
  const [nx, ny] = [uy, -ux];
  const off = 11;
  const tape = `M${ax + nx * off} ${ay + ny * off}L${bx + nx * off} ${by + ny * off}`;
  const ends = [0, 1].map((t) => {
    const [px, py] = [ax + (bx - ax) * t + nx * off, ay + (by - ay) * t + ny * off];
    return `M${px - nx * 4} ${py - ny * 4}L${px + nx * 4} ${py + ny * 4}`;
  });
  const ray = WA_F.sy(4.6);
  const rayX = ax + (ux / uy) * (ray - ay);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{WA_CAP[k]}</span>}>
      <Plane f={WA_F} grid={1} label="Shiku origin থেকে ডানে 2 ঘর, তারপর ওপরে 3 ঘর হাঁটলো. হাঁটা শেষে শুরু থেকে থামা পর্যন্ত একটা সোজা arrow রয়ে গেল; তার direction আর magnitude" className="my-0! max-w-[11rem]">
        <Trail f={WA_F} cells={trail} faint={k >= 3} />
        <Dot f={WA_F} at={O} r={3.5} />
        <Label f={WA_F} at={O} dx={-5} dy={14} anchor="end" size={10}>
          শুরু
        </Label>
        {k >= 4 && (
          <g className={POP}>
            <path d={`M${bx} ${by}L${rayX} ${ray}`} strokeWidth={2} strokeDasharray="3 4" strokeLinecap="round" className="fill-none stroke-[#0d9488]" />
            <text x={rayX - 6} y={ray + 4} textAnchor="end" fontSize={10} fontWeight={600} className="fill-[#0f766e]">
              direction
            </text>
          </g>
        )}
        {k >= 5 && (
          <g>
            <Draw d={tape} ms={700} strokeWidth={3} className="stroke-[#d97706]" />
            {ends.map((d) => (
              <path key={d} d={d} strokeWidth={2} strokeLinecap="round" className={`${POP} fill-none stroke-[#d97706]`} />
            ))}
            <text x={(ax + bx) / 2 + nx * 18} y={(ay + by) / 2 + ny * 18 + 4} textAnchor="end" fontSize={10} fontWeight={600} className={`${FADE} fill-[#b45309]`}>
              magnitude
            </text>
          </g>
        )}
        <g className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 3 ? "opacity-25" : "opacity-100"}`}>
          <Shiku f={WA_F} at={[x, y]} />
        </g>
        {k >= 3 && <Arrow key="a" f={WA_F} from={O} to={WA_V} draw w={3} />}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 4's setup: the definition asks two things of an
//      arrow and a third thing it never asks.

const TA_CAP = [
  "একটা arrow.",
  "কোন দিকে তাক করা, definition সেটা বলেছে.",
  "কত লম্বা, তাও বলেছে.",
  "কাগজের কোথায় বসে আছে? এই কথা কোথাও নাই.",
];
const TA_CHIPS = ["দিক", "দৈর্ঘ্য", "জায়গা"];

export function ThreeAsks({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{TA_CAP[k]}</span>}>
      <svg viewBox="0 0 240 120" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="একটা arrow, তার পাশে তিনটা প্রশ্ন: দিক, দৈর্ঘ্য, জায়গা. প্রথম দুইটার উত্তর আছে, তৃতীয়টার নাই">
        <rect x={6} y={14} width={96} height={92} rx={8} className="fill-surface stroke-border" />
        <path d="M22 86L80 42" strokeWidth={3} strokeLinecap="round" className="fill-none stroke-cat-blue" />
        <path d="M88 36L72 40L80 52Z" className="fill-cat-blue" />
        {TA_CHIPS.map((c, i) => {
          const y = 18 + i * 32;
          const shown = k >= i + 1;
          const lacks = i === 2;
          return (
            <g key={c} className={`transition-opacity duration-500 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}>
              <rect x={122} y={y} width={100} height={24} rx={7} strokeDasharray={lacks ? "4 3" : undefined} className={lacks ? "fill-danger/5 stroke-danger" : "fill-cat-teal/10 stroke-cat-teal"} />
              <text x={134} y={y + 16} fontSize={11} fontWeight={600} className="fill-foreground">
                {c}
              </text>
              {lacks ? (
                <text x={206} y={y + 17} textAnchor="middle" fontSize={14} fontWeight={700} className="fill-danger">
                  ?
                </text>
              ) : (
                <path d={`M200 ${y + 12}l4 4l8 -9`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="fill-none stroke-cat-teal" />
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · The sort question, animated. Each pick is laid on the picture from the
//      arrow's own tail: the right one lands on the head, a wrong one runs past
//      it, or short of it, or off the sheet. SortArrows below plays this.

/** Draws the picked vector from `from`, `t` of the way along it, clipped to the sheet. */
function Ghost({ f, from, v, t, id }: { f: Frame; from: XY; v: XY; t: number; id: string }) {
  return (
    <g clipPath={`url(#${id})`}>
      <Arrow f={f} from={from} to={mix(from, plus(from, v), t)} tone="amber" w={3.2} dashed list={false} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 2.2b · 1 · The apartment game as an animated question. Two Shikus set off
//      together, one right-then-up, the other up-then-right; whatever is
//      picked, they walk, and they meet on the star.

const SO_F = makeFrame(-1, 11, -1, 13, 15, 10);
const SO_GOAL: XY = [10, 12];
const SO_A = route(O, SO_GOAL);
const SO_B: XY[] = [O, ...Array.from({ length: 12 }, (_, i): XY => [0, i + 1]), ...Array.from({ length: 10 }, (_, i): XY => [i + 1, 12])];
const SO_OPTS = ["দুইবার দুই জায়গায়", "দ্বিতীয়বার দেয়ালে ধাক্কা খায়", "দুইবারই একই জায়গায়"];
const SO_RIGHT = 2;
const SO_NOPE = [
  "দুই Shiku দুই রাস্তায় হাঁটলো, তবু তারায় একসাথে পৌঁছালো. ডানে মোট কত, উপরে মোট কত?",
  "দেয়ালে কেউ ধাক্কা খায়নি. দুইজনই তারায় পৌঁছালো. ডানে মোট কত, উপরে মোট কত?",
  "",
];

function ShikuTwin({ f, at }: { f: Frame; at: XY }) {
  return (
    <g style={{ transform: `translate(${f.sx(at[0])}px, ${f.sy(at[1])}px)` }} className="pointer-events-none transition-transform duration-100 ease-linear motion-reduce:transition-none">
      <path d="M0 -8V-12.5" strokeWidth={1.2} className="stroke-cat-coral" />
      <circle cy={-13.5} r={1.8} className="fill-cat-coral" />
      <rect x={-8} y={-8} width={16} height={15} rx={4} className="fill-cat-coral" />
      <circle cx={-3.2} cy={-1.5} r={1.7} className="fill-white" />
      <circle cx={3.2} cy={-1.5} r={1.7} className="fill-white" />
    </g>
  );
}

export function ShikuOrder() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(70);
  const last = SO_A.length - 1;
  const k = pick === null ? 0 : play.running ? play.k : last;
  const over = pick !== null && !play.running;
  const right = over && pick === SO_RIGHT;
  const trail = (cells: XY[], cls: string) =>
    cells.length > 1 && <path d={cells.map((c, i) => `${i ? "L" : "M"}${SO_F.sx(c[0])} ${SO_F.sy(c[1])}`).join("")} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" className={`pointer-events-none fill-none ${cls}`} />;

  const choose = (i: number) => {
    if (play.running || right) return;
    setPick(i);
    play.play(last, () => (i === SO_RIGHT ? pass("হাঁটার ক্রম বদলালে address বদলায় না.") : setMiss((m) => m + 1)));
  };

  return (
    <>
      <Plane f={SO_F} ticks={2} label="দুই Shiku origin থেকে (10, 12)-এর তারার দিকে হাঁটছে, একজন আগে ডানে, আরেকজন আগে উপরে" className="my-2 max-w-[11rem]">
        {trail(SO_A.slice(0, k + 1), "stroke-cat-violet/60")}
        {trail(SO_B.slice(0, k + 1), "stroke-cat-coral/60")}
        <Star f={SO_F} at={SO_GOAL} done={right} />
        <Shiku f={SO_F} at={SO_A[k]} />
        <ShikuTwin f={SO_F} at={SO_B[k]} />
      </Plane>
      <div className="grid gap-2">
        {SO_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && over ? (i === SO_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={play.running || right} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {over && pick !== SO_RIGHT && <Nope key={miss}>{SO_NOPE[pick ?? 0]}</Nope>}
      <Task done={right}>Shiku একবার আগে ডানে ১০ তারপর উপরে ১২, আরেকবার আগে উপরে ১২ তারপর ডানে ১০. কোথায় পৌঁছায়, বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2.2b · 2a · A story scene for the street instruction.

export function StreetAsk({}: Story) {
  const s = useScene(2, [600, 2200, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="রাস্তায় একজন পথচারী ফাহিমকে বলছেন, দুই গলি পূর্বে যান, তারপর এক গলি উত্তরে">
        <Person who="fahim" x={100} y={150} label />
        <Person who="mama" x={220} y={150} facing={-1} arm={k >= 1 ? "point" : "down"} />
        <text x={220} y={166} textAnchor="middle" fontSize={9} fontWeight={600} fill="#0f1b2d">
          পথচারী
        </text>
        {k === 1 && <Bubble x={220} y={84} side="left" lines={["দুই গলি পূর্বে যান,"]} />}
        {k >= 2 && <Bubble x={220} y={84} side="left" lines={["তারপর এক গলি", "উত্তরে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2.2b · 3½ · A figure for screen 4's setup: we say "point" and mean an arrow
//      from the origin; subtract two points and what you hold is an arrow with
//      no place at all.

const PV_F = makeFrame(0, 7, 0, 5, 26, 12);
const PV_CAP = [
  "হামজাকে বলি vector (180, 78). মুখে বলছি, এটা একটা point.",
  "আসলে বোঝাই origin থেকে ওই point পর্যন্ত arrow.",
  "এবার দুইটা point, A আর B. বিয়োগ করলে হাতে আসে A থেকে B-তে যাওয়ার arrow.",
  "ওটা কোনো জায়গা না. একটা relation, যেখানে খুশি বসানো যায়.",
];
const PV_HAMZA: XY = [5, 4];
const PV_A: XY = [1, 1];
const PV_B: XY = [4, 3];

export function PointVsArrow({}: Story) {
  const s = useScene(3, [600, 2200, 2800, 2800]);
  const k = s.k;
  const slide = k >= 3 ? minus(O, PV_A) : O;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{PV_CAP[k]}</span>}>
      <Plane f={PV_F} grid={1} label="একটা point আর origin থেকে তার arrow, তারপর দুইটা point A আর B আর তাদের মাঝের arrow" className="my-0! max-w-[14rem]">
        <g className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "opacity-20" : "opacity-100"}`}>
          {k >= 1 && <Arrow key="h" f={PV_F} from={O} to={PV_HAMZA} tone="blue" draw w={3} list={false} />}
          <Dot f={PV_F} at={PV_HAMZA} r={4.5} className="fill-cat-blue" />
          <Label f={PV_F} at={PV_HAMZA} dx={-6} dy={-9} anchor="end" size={9} className="fill-[#0f1b2d]">
            হামজা (180, 78)
          </Label>
        </g>
        {k >= 2 && (
          <g className={POP}>
            <g style={{ transform: `translate(${slide[0] * PV_F.u}px, ${-slide[1] * PV_F.u}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
              <Arrow f={PV_F} from={PV_A} to={PV_B} tone="coral" w={3} list={false} />
            </g>
            {k < 3 && (
              <>
                <Dot f={PV_F} at={PV_A} r={4} />
                <Dot f={PV_F} at={PV_B} r={4} />
                <Label f={PV_F} at={PV_A} dx={-8} dy={4} anchor="end" size={11}>
                  A
                </Label>
                <Label f={PV_F} at={PV_B} dx={8} dy={-6} anchor="start" size={11}>
                  B
                </Label>
              </>
            )}
          </g>
        )}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2.2b · 5½ · A figure for the zero vector's explanation: shrink an arrow and
//      it keeps its direction right down to the last bit; at zero there is no
//      direction left to ask for.

const ZN_F = makeFrame(-3, 3, -2, 2, 26);
const ZN_CAP = [
  "সব arrow-র একটা দিক আছে. কোন দিকে তাক করা, বলা যায়.",
  "ছোট করুন. দিক তবুও আছে.",
  "length শূন্য হলে arrow একটা বিন্দু হয়ে যায়.",
  "কোন দিকে মুখ করবে? সব দিকই চলে, কোনোটাই বলা যায় না.",
];
const ZN_ALL: XY[] = [
  [2, 0],
  [0, 1.5],
  [-2, 0],
  [0, -1.5],
];

export function ZeroNowhere({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{ZN_CAP[k]}</span>}>
      <Plane f={ZN_F} grid={1} axes={false} label="একটা arrow ছোট হতে হতে একটা বিন্দু হয়ে গেল" className="my-0! max-w-[13rem]">
        {k === 0 && <Arrow key="a" f={ZN_F} from={O} to={[2, 1]} tone="blue" draw w={3} />}
        {k === 1 && <Arrow key="b" f={ZN_F} from={O} to={[1, 0.5]} tone="blue" w={3} />}
        {k >= 3 && ZN_ALL.map((t, i) => <Arrow key={i} f={ZN_F} from={O} to={t} tone="ink" dashed faint w={2} list={false} />)}
        <Dot f={ZN_F} at={O} r={k >= 2 ? 5.5 : 3} className={k >= 2 ? "fill-danger" : "fill-[#0f1b2d]"} />
        {k >= 3 && (
          <Label f={ZN_F} at={O} dx={0} dy={-14} size={16} weight={700} className={`${POP} fill-danger`}>
            ?
          </Label>
        )}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2.2b · 6 · The code recall as an animated question: v[2]. A pointer for each
//      guess, then the numbers 0, 1, 2 come up under the boxes and v[2] walks
//      to its own.

const SC_VALS = [180, 78, 18];
const SC_OPTS = [
  { t: "দ্বিতীয় ঘর", box: 1 },
  { t: "তৃতীয় ঘর", box: 2 },
  { t: "প্রথম ঘর", box: 0 },
];
const SC_RIGHT = 1;
const SC_X = (i: number) => 50 + i * 70;

export function SlotCode() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(500);
  const k = pick === null ? 0 : play.running ? play.k : 3;
  const over = pick !== null && !play.running;
  const right = over && pick === SC_RIGHT;

  const choose = (i: number) => {
    if (play.running || right) return;
    setPick(i);
    play.play(3, () => (i === SC_RIGHT ? pass("Code-এ গোনা শুরু 0 থেকে.") : setMiss((m) => m + 1)));
  };

  return (
    <>
      <svg viewBox="0 0 260 112" role="img" aria-label="vector v = (180, 78, 18), তিনটা ঘর. code-এ v[2] লিখলে কোন ঘরটা আসে" className="mx-auto my-4 block h-auto w-full max-w-sm select-none">
        <text x={6} y={46} fontSize={12} className="fill-foreground font-mono">
          v =
        </text>
        {SC_VALS.map((v, i) => {
          const claimed = pick !== null && SC_OPTS[pick].box === i;
          const look = claimed && over ? (i === 2 ? "stroke-accent fill-accent/10" : "stroke-danger fill-danger/5") : claimed ? "stroke-cat-blue fill-cat-blue/10" : "fill-surface stroke-border";
          return (
            <g key={v}>
              <rect x={SC_X(i) - 26} y={26} width={52} height={30} rx={7} strokeWidth={2} className={`transition-colors duration-300 ${look}`} />
              <text x={SC_X(i)} y={46} textAnchor="middle" fontSize={15} fontWeight={600} className="fill-foreground font-mono">
                {v}
              </text>
              <text x={SC_X(i)} y={71} textAnchor="middle" fontSize={10} className={`fill-muted font-mono transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-0"}`}>
                {i}
              </text>
            </g>
          );
        })}
        <g style={{ transform: `translateX(${SC_X(pick === null ? 0 : SC_OPTS[pick].box)}px)`, opacity: pick === null ? 0 : 1 }} className="transition-[transform,opacity] duration-500 ease-in-out motion-reduce:transition-none">
          <path d="M0 21l-5 -9h10z" className="fill-cat-blue" />
        </g>
        <g style={{ transform: `translateX(${k >= 2 ? SC_X(2) : SC_X(0) - 40}px)`, opacity: k >= 2 ? 1 : 0 }} className="transition-[transform,opacity] duration-700 ease-in-out motion-reduce:transition-none">
          <rect x={-22} y={79} width={44} height={20} rx={10} className="fill-cat-amber/20 stroke-cat-amber" />
          <text y={93} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-foreground font-mono">
            v[2]
          </text>
        </g>
      </svg>
      <div className="grid grid-cols-3 gap-2">
        {SC_OPTS.map((o, i) => (
          <Choice key={o.t} n={i} look={pick === i && over ? (i === SC_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={play.running || right} onClick={() => choose(i)}>
            {o.t}
          </Choice>
        ))}
      </div>
      {over && pick !== SC_RIGHT && <Nope key={miss}>v[2] গিয়ে বসলো তৃতীয় ঘরে. নিচের ছোট সংখ্যাগুলো দেখুন, code-এ গোনা শুরু কোথা থেকে?</Nope>}
      <Task done={right}>Code-এ v[2] লিখলে কোন ঘরটা আসে, বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2.2b · 8 · Try it, animated: an arrow from (3, 7) to (8, 9). The pick is
//      drawn from the origin; then the arrow itself slides home, and the two
//      either lie on top of each other or they do not.

const SE_F = makeFrame(-6, 12, -3, 10, 17);
const SE_S: XY = [3, 7];
const SE_E: XY = [8, 9];
const SE_OPTS: XY[] = [
  [8, 9],
  [5, 2],
  [11, 16],
  [-5, -2],
];
const SE_RIGHT = 1;
const SE_NOPE = [
  "(8, 9) তো শেষের point-টা. মাথাটা আছে (8, 9)-এ, কিন্তু arrow-টা ওখানে গিয়ে মেলেনি. শুরুর (3, 7) বিয়োগ করতে ভুলে গেছেন.",
  "",
  "ওটা কাগজের কিনারা ছাড়িয়ে গেল, arrow-এর সাথে মিললো না. শেষ থেকে শুরু বিয়োগ করুন, যোগ না.",
  "ঠিক উল্টো দিকে তাক করা. শেষ থেকে শুরু বিয়োগ করতে হয়, শুরু থেকে শেষ না.",
];

export function StartEnd() {
  const pass = useGate();
  const clip = useId();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(600);
  const k = pick === null ? 0 : play.running ? play.k : 3;
  const over = pick !== null && !play.running;
  const right = over && pick === SE_RIGHT;
  const home = k >= 2;

  const choose = (i: number) => {
    if (play.running || right) return;
    setPick(i);
    play.play(3, () => (i === SE_RIGHT ? pass("End − Start, তারপর যেখানে খুশি.") : setMiss((m) => m + 1)));
  };

  return (
    <>
      <Plane f={SE_F} ticks={2} label="একটা arrow (3, 7) থেকে (8, 9)-এ গিয়ে থেমেছে. বেছে নেওয়া vector origin থেকে আঁকা হয়েছে, তারপর arrow-টা origin-এ সরে এসেছে" className="my-2 max-w-[20rem]">
        <defs>
          <SheetClip id={clip} f={SE_F} />
        </defs>
        {k >= 1 && pick !== null && (
          <g key={pick} clipPath={`url(#${clip})`}>
            <Arrow f={SE_F} from={O} to={SE_OPTS[pick]} tone="amber" w={3} dashed draw list={false} />
          </g>
        )}
        <g style={{ transform: `translate(${home ? -SE_S[0] * SE_F.u : 0}px, ${home ? SE_S[1] * SE_F.u : 0}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
          <Arrow f={SE_F} from={SE_S} to={SE_E} tone="blue" w={3.2} list={false} />
          <Dot f={SE_F} at={SE_S} r={3.5} className="fill-[#0f1b2d]" />
        </g>
      </Plane>
      <div className="grid grid-cols-2 gap-2">
        {SE_OPTS.map((c, i) => (
          <Choice key={c.join()} n={i} look={pick === i && over ? (i === SE_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={play.running || right} onClick={() => choose(i)}>
            <span className="font-mono">{tup(c)}</span>
          </Choice>
        ))}
      </div>
      {over && pick !== SE_RIGHT && <Nope key={miss}>{SE_NOPE[pick ?? 0]}</Nope>}
      <Task done={right}>Arrow-টা (3, 7) থেকে শুরু হয়ে (8, 9)-এ থেমেছে. এটা কোন vector, বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2.2b · 9 · A figure for the ending: every word a point, king minus man an
//      arrow, and an arrow that can be set down anywhere. Stops at the "?".

const MK_F = makeFrame(0, 8, 0, 5, 24, 12);
const MK_MAN: XY = [1, 1];
const MK_KING: XY = [3, 3];
const MK_V = minus(MK_KING, MK_MAN);
const MK_WOMAN: XY = [5, 1];
const MK_CAP = [
  "ধরেন প্রত্যেকটা শব্দ একটা point.",
  "king থেকে man বিয়োগ করলে কোনো point পাবেন না. পাবেন man থেকে king-এ যাওয়ার রাস্তা, একটা arrow.",
  "আর arrow-এর তো কোনো address নাই. যেখান থেকে খুশি বসানো যায়.",
  "যেখান থেকে খুশি হাঁটা শুরু করা যায়, woman থেকেও…",
];

export function ManToKing({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{MK_CAP[k]}</span>}>
      <Plane f={MK_F} grid={1} axes={false} label="man আর king দুইটা point, মাঝে একটা arrow. সেই arrow অন্য জায়গায় বসালেও একই থাকে" className="my-0! max-w-[15rem]">
        {k >= 2 && (
          <g className={POP}>
            <Arrow f={MK_F} from={[4, 0]} to={plus([4, 0], MK_V)} tone="coral" faint w={2.6} list={false} />
            <Arrow f={MK_F} from={[0, 3]} to={plus([0, 3], MK_V)} tone="coral" faint w={2.6} list={false} />
          </g>
        )}
        {k >= 1 && <Arrow key="v" f={MK_F} from={MK_MAN} to={MK_KING} tone="coral" draw w={3.2} list={false} />}
        {k >= 3 && (
          <g className={POP}>
            <Arrow f={MK_F} from={MK_WOMAN} to={plus(MK_WOMAN, MK_V)} tone="coral" dashed w={2.6} list={false} />
            <Dot f={MK_F} at={MK_WOMAN} r={4.5} className="fill-cat-teal" />
            <Label f={MK_F} at={MK_WOMAN} dx={0} dy={16} size={10}>
              woman
            </Label>
            <Label f={MK_F} at={plus(MK_WOMAN, MK_V)} dx={10} dy={-4} anchor="start" size={16} weight={700} className="fill-danger">
              ?
            </Label>
          </g>
        )}
        <Dot f={MK_F} at={MK_MAN} r={4.5} className="fill-cat-blue" />
        <Dot f={MK_F} at={MK_KING} r={4.5} className="fill-cat-blue" />
        <Label f={MK_F} at={MK_MAN} dx={0} dy={16} size={10}>
          man
        </Label>
        <Label f={MK_F} at={MK_KING} dx={-8} dy={-8} anchor="end" size={10}>
          king
        </Label>
      </Plane>
    </Scene>
  );
}

export const fixtures: Fixtures = {
  FlipRecall: { start: {}, wrong: { pick: 1 }, wrong2: { pick: 2 }, right: { pick: 0 } },
  ShikuErrand: { stand: { k: 0 }, order: { k: 1 }, walk: { k: 2 } },
  WalkLeavesArrow: { start: { k: 0 }, right: { k: 1 }, up: { k: 2 }, arrow: { k: 3 }, dir: { k: 4 }, mag: { k: 5 } },
  ThreeAsks: { arrow: { k: 0 }, dir: { k: 1 }, len: { k: 2 }, place: { k: 3 } },
  SortArrows: { start: {}, wrong: { cand: [5, 3], open: 2 }, over: { cand: [4, 5], open: 1 } },
  ShikuOrder: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 1 }, right: { pick: 2 } },
  StreetAsk: { stand: { k: 0 }, east: { k: 1 }, north: { k: 2 } },
  PointVsArrow: { point: { k: 0 }, arrow: { k: 1 }, two: { k: 2 }, free: { k: 3 } },
  ZeroNowhere: { arrow: { k: 0 }, short: { k: 1 }, dot: { k: 2 }, nowhere: { k: 3 } },
  SlotCode: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  StartEnd: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, wrong3: { pick: 3 }, right: { pick: 1 } },
  ManToKing: { points: { k: 0 }, arrow: { k: 1 }, anywhere: { k: 2 }, woman: { k: 3 } },
};
