"use client";

import { useState, type KeyboardEvent } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { FADE, Nope, POP, Stepper, Ticks, primaryBtn, quietBtn, useCountUp, usePlay, useTween } from "@/components/journey/kit";
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

// Screens for "Math for AI 2.2 — Arrow, যার কোনো ঠিকানা নাই", told as a Journey.
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

export function SlideArrow() {
  const pass = useGate();
  const [tail, setTail] = useState<XY>(O);
  const [grab, setGrab] = useState<XY | null>(null);
  const [spots, setSpots] = useState<string[]>([]);
  const head = plus(tail, V31);

  const drop = (t: XY) => {
    const key = t.join(",");
    if (key === "0,0" || spots.includes(key)) return;
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
        <div className="text-lg">
          <span className="font-sans text-base text-muted">Start - End = </span>
          <b className="text-cat-blue">{tup(minus(head, tail))}</b>
        </div>
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
  const [open, setOpen] = useState(0);
  const [solved, setSolved] = useState<number[]>([]);
  const [miss, setMiss] = useState<{ n: number; msg: string } | null>(null);
  const a = ABCD[open];
  const want = minus(a.e, a.s);
  const done = solved.length === ABCD.length;

  const choose = (c: XY) => {
    if (solved.includes(open)) return;
    if (!same(c, want)) {
      setMiss((m) => ({
        n: (m?.n ?? 0) + 1,
        msg: same(c, a.e) ? `${tup(c)} তো শেষের point-টা। শুরুরটা বিয়োগ করতে ভুলে গেছেন।` : `উঁহু। ${tup(a.e)} থেকে ${tup(a.s)} ঘরে ঘরে বিয়োগ করে দেখুন।`,
      }));
      return;
    }
    const next = [...solved, open];
    setSolved(next);
    setMiss(null);
    const rest = ABCD.findIndex((_, i) => !next.includes(i));
    if (rest >= 0) setOpen(rest);
    else pass("একই vector, তিন জায়গায় আঁকা।");
  };

  return (
    <>
      <Plane f={F1} ticks={1} label="four arrows, A to D, drawn in different places">
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
                setOpen(i);
                setMiss(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen(i);
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
                onClick={() => choose(c)}
                className="h-10 cursor-pointer rounded-full border-2 border-border px-4 font-mono font-semibold transition-colors hover:border-cat-blue/60"
              >
                {tup(c)}
              </button>
            ))}
          </div>
        </div>
      )}
      {miss && !done && <Nope key={miss.n}>{miss.msg}</Nope>}
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
  { say: "বাসার ঠিকানা: রোড ৫, বাড়ি ১২", kind: "point", hint: "ঠিকানা মানেই “কোথায়?”" },
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
            off[0] ? `${off[0] > 0 ? "ডানে" : "বাঁয়ে"} ${bn(Math.abs(off[0]))} ঘর` : "",
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
  { d: [-1, 0], glyph: "←", label: "বাঁয়ে এক পা", tone: "text-cat-blue" },
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
