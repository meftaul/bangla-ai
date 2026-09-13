"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  Draw,
  FADE,
  LOOK,
  Nope,
  POP,
  Speech,
  Ticks,
  pill,
  predictLook,
  primaryBtn,
  quietBtn,
  useCountUp,
  usePlay,
  type Look,
} from "@/components/journey/kit";
import { bn } from "./figure-kit";
import {
  BIRD_COLS,
  BIRD_PX,
  CELL_TONES,
  DRAWING,
  Drawing,
  GRID_SIZES,
  PAPER,
  SHEET,
  gray,
  ink,
  type Mark,
} from "./pixel-art";

// Screens for "Math for AI 1.1 — ছবি থেকে সংখ্যা", told as a Journey.
//
// The same story as the article's GridStoryFigure, one beat per screen: you
// have a pencil bird, your friend Rafi is in another city, and all you have is
// a button phone. Saying "bird" fails, describing it fails; ruling the same
// grid on both pages and reading out one number per cell, in an order you both
// know, works. Then the reader turns it round — numbers into a picture — and
// ends on the 40 × 40 bird the computer only ever sees as numbers.
//
// Every number shown here comes from pixel-art.tsx, the same data the article's
// figures use. Styling is Tailwind only, on the site's theme tokens. The pages
// are real paper in both themes (grey 236, the drawing's own paper), so ink on
// them is fixed. SVG/DOM rather than canvas, so the Bangla labels shape.

// ---------------------------------------------------------------------------
// The 8 × 8 grid the story reads out loud.

const N = 8;
const ALL = N * N;
const TONES = CELL_TONES[N];
/** viewBox units per sheet unit — keeps SVG font sizes at real, readable px */
const U = 6;
const PAGE = SHEET * U;
const side = (n: number) => PAGE / n;
const rowOf = (i: number, n = N) => Math.floor(i / n);
const colOf = (i: number, n = N) => i % n;

/** Which cell of an n × n board a pointer is on. The SVG scales, so go through its box. */
function cellAt(svg: SVGSVGElement, e: { clientX: number; clientY: number }, n: number): number | null {
  const r = svg.getBoundingClientRect();
  const c = Math.floor(((e.clientX - r.left) / r.width) * n);
  const w = Math.floor(((e.clientY - r.top) / r.height) * n);
  return c < 0 || c >= n || w < 0 || w >= n ? null : w * n + c;
}

// ---------------------------------------------------------------------------
// The two pages and what goes on them.

function Board({
  size,
  n,
  label,
  onCell,
  drag = false,
  children,
}: {
  size: number;
  n: number;
  label: string;
  onCell?: (i: number) => void;
  /** keep calling onCell while the pointer is held and dragged */
  drag?: boolean;
  children?: ReactNode;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const down = useRef(false);
  const hit = (e: ReactPointerEvent<SVGSVGElement>) => {
    const i = ref.current ? cellAt(ref.current, e, n) : null;
    if (i !== null) onCell?.(i);
  };
  const lift = () => {
    down.current = false;
  };
  // ponytail: cells are picked by pointer only, like the graph-paper screens.
  // Add arrow-key cursor + Enter if a keyboard-only reader needs these gates.
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${size} ${size}`}
      role={onCell ? "group" : "img"}
      aria-label={label}
      className={`block h-auto w-full select-none ${onCell ? "cursor-pointer" : ""} ${drag ? "touch-none" : "touch-manipulation"}`}
      onPointerDown={
        onCell
          ? (e) => {
              if (drag) {
                e.currentTarget.setPointerCapture(e.pointerId);
                down.current = true;
              }
              hit(e);
            }
          : undefined
      }
      onPointerMove={drag ? (e) => down.current && hit(e) : undefined}
      onPointerUp={drag ? lift : undefined}
      onPointerCancel={drag ? lift : undefined}
    >
      {children}
    </svg>
  );
}

/** A sheet of paper, with whose it is written above it. */
function Page({
  who,
  label,
  n = N,
  onCell,
  children,
}: {
  who: string;
  label: string;
  n?: number;
  onCell?: (i: number) => void;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-center text-sm font-medium text-muted">{who}</div>
      <div className="overflow-hidden rounded-lg shadow-md ring-1 ring-foreground/15">
        <Board size={PAGE} n={n} label={label} onCell={onCell}>
          <rect width={PAGE} height={PAGE} style={{ fill: gray(PAPER) }} />
          {children}
        </Board>
      </div>
    </div>
  );
}

/** Your page and Rafi's, side by side. */
function Pages({ children }: { children: ReactNode }) {
  return <div className="mx-auto my-5 grid w-full max-w-md grid-cols-2 items-end gap-3 sm:gap-5">{children}</div>;
}

/** The pencil bird, scaled from sheet units onto the page. */
function Pencil({ marks }: { marks?: Mark[] }) {
  return (
    <g transform={`scale(${U})`}>
      <Drawing marks={marks} />
    </g>
  );
}

const rulingPath = (n: number) => {
  const s = side(n);
  let d = "";
  for (let k = 1; k < n; k++) d += `M${k * s} 0V${PAGE}M0 ${k * s}H${PAGE}`;
  return d;
};

function Ruling({ n = N }: { n?: number }) {
  return (
    <path d={rulingPath(n)} strokeWidth={n > 16 ? 0.5 : 1.2} className="pointer-events-none fill-none stroke-[#0f1b2d]/30" />
  );
}

/** Shaded cells. The k-th number lands in cell `at(k)` — reading order, unless someone mixes it up. */
function Cells({
  tones,
  n = N,
  count = tones.length,
  at = (k: number) => k,
}: {
  tones: number[];
  n?: number;
  count?: number;
  at?: (k: number) => number;
}) {
  const s = side(n);
  return (
    <g shapeRendering="crispEdges">
      {tones.slice(0, count).map((v, k) => {
        const i = at(k);
        return (
          <rect
            key={i}
            x={colOf(i, n) * s}
            y={rowOf(i, n) * s}
            width={s}
            height={s}
            style={{ fill: gray(v) }}
            className={FADE}
          />
        );
      })}
    </g>
  );
}

/** A cell's number, on a chip of the very grey it stands for. */
function Chip({ i, v, strong = false }: { i: number; v: number; strong?: boolean }) {
  const s = side(N);
  const x = (colOf(i) + 0.5) * s;
  const y = (rowOf(i) + 0.5) * s;
  return (
    <g className={POP}>
      <rect
        x={x - s * 0.4}
        y={y - s * 0.26}
        width={s * 0.8}
        height={s * 0.52}
        rx={s * 0.12}
        strokeWidth={strong ? 2.5 : 0.8}
        style={{ fill: gray(v) }}
        className={strong ? "stroke-cat-amber" : "stroke-[#0f1b2d]/40"}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-mono text-[11px] font-semibold"
        style={{ fill: ink(v) }}
      >
        {v}
      </text>
    </g>
  );
}

/** A cell picked out with an amber frame. */
function Outline({ i, pulse = false }: { i: number; pulse?: boolean }) {
  const s = side(N);
  return (
    <rect
      x={colOf(i) * s}
      y={rowOf(i) * s}
      width={s}
      height={s}
      strokeWidth={3}
      className={`pointer-events-none fill-none stroke-cat-amber ${pulse ? "animate-pulse" : ""}`}
    />
  );
}

/** Rafi on the other end of the line. */
function Rafi(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="রাফি" initial="র" tint="blue" {...props} />;
}

/** A 0–255 slider over the black-to-white scale it stands for. */
function Shade({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="mx-auto w-full max-w-sm">
      <input
        type="range"
        min={0}
        max={255}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block w-full cursor-pointer accent-accent"
      />
      <div className="mt-1 h-2.5 rounded-full bg-linear-to-r from-black to-white ring-1 ring-foreground/15" />
      <div className="mt-0.5 flex justify-between font-mono text-xs text-muted">
        <span>0</span>
        <span>255</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · The bird draws itself on your page; you ring Rafi.

type Call = "idle" | "ringing" | "on";

function ButtonPhone({ call }: { call: Call }) {
  const screen = call === "idle" ? "রাফি" : call === "ringing" ? "কল যাচ্ছে…" : "কথা চলছে";
  return (
    <svg
      viewBox="0 0 56 104"
      role="img"
      aria-label={`an old button phone — ${screen}`}
      className={`w-20 shrink-0 sm:w-24 ${call === "ringing" ? "animate-bounce" : ""}`}
    >
      <rect x={2} y={2} width={52} height={100} rx={12} strokeWidth={1.5} className="fill-cat-violet/10 stroke-foreground/40" />
      <rect
        x={8}
        y={12}
        width={40}
        height={28}
        rx={3}
        strokeWidth={1}
        className={`stroke-foreground/30 transition-colors duration-500 ${call === "on" ? "fill-accent/25" : "fill-cat-teal/15"}`}
      />
      <text x={28} y={29} textAnchor="middle" className="fill-foreground text-[6.5px] font-semibold">
        {screen}
      </text>
      <rect x={8} y={46} width={16} height={7} rx={3.5} className="fill-accent" />
      <rect x={32} y={46} width={16} height={7} rx={3.5} className="fill-danger/80" />
      {Array.from({ length: 12 }, (_, k) => (
        <rect key={k} x={8 + (k % 3) * 14} y={59 + Math.floor(k / 3) * 10} width={12} height={7} rx={2} className="fill-foreground/15" />
      ))}
    </svg>
  );
}

export function CallFriend() {
  const pass = useGate();
  const drawn = useCountUp(DRAWING.length, 280);
  const [call, setCall] = useState<Call>("idle");

  useEffect(() => {
    if (call !== "ringing") return;
    const t = setTimeout(() => {
      setCall("on");
      pass("লাইন পেয়ে গেছেন। এবার ছবিটা রাফির খাতায় পৌঁছাতে হবে — শুধু কথা দিয়ে।");
    }, 1800);
    return () => clearTimeout(t);
  }, [call, pass]);

  return (
    <>
      <div className="mx-auto my-5 flex max-w-md items-end justify-center gap-5 sm:gap-8">
        <div className="w-full max-w-[13rem]">
          <Page who="আপনার খাতা" label="your pencil drawing of a bird on a branch">
            {DRAWING.slice(0, drawn).map((m, k) => (
              <g key={k} className={FADE}>
                <Pencil marks={[m]} />
              </g>
            ))}
          </Page>
        </div>
        <ButtonPhone call={call} />
      </div>
      <div className="flex justify-center">
        <button type="button" disabled={call !== "idle"} onClick={() => setCall("ringing")} className={primaryBtn}>
          ☎ রাফিকে ফোন দিন
        </button>
      </div>
      {call === "on" && <Rafi>হ্যালো! কী খবর, দোস্ত?</Rafi>}
      <Task done={call === "on"}>রাফিকে একটা ফোন দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Tell him the way you would tell a person. Neither works.

const SAY = [
  {
    id: "bird",
    say: "একটা পাখি আঁক।",
    reply: "আঁকলাম! দুই ডানা মেলে উড়ছে। তোরটাও তো এরকমই, না?",
  },
  {
    id: "words",
    say: "মাঝখান থেকে একটু ডানে, একটু উপরে একটা ছোট গোল্লা আঁক…",
    reply: "একটু মানে কতটুকু একটু? ছোট মানে কত ছোট? এর কোনটা?",
  },
];
/** Where "a small circle, a bit right of the middle" could be — all of them fit. */
const GUESSES: [number, number, number][] = [
  [29, 22, 8],
  [37.5, 11.5, 3.2],
  [24.5, 13, 5.5],
];

export function JustWords() {
  const pass = useGate();
  const [tried, setTried] = useState<string[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [n, setN] = useState(0);

  const choose = (id: string) => {
    setPick(id);
    setN((k) => k + 1);
    const t = tried.includes(id) ? tried : [...tried, id];
    setTried(t);
    if (t.length === SAY.length) pass("দুইবারই রাফিকে guess করতে হলো। মুখের বর্ণনায় কাজ হচ্ছে না।");
  };
  const reply = SAY.find((s) => s.id === pick);

  return (
    <>
      <Pages>
        <Page who="আপনার খাতা" label="your pencil drawing of a bird on a branch">
          <Pencil />
        </Page>
        <Page
          who="রাফির খাতা"
          label={
            pick === "bird"
              ? "Rafi's page: the bird in his head, not yours"
              : pick === "words"
                ? "Rafi's page: three circles, any of which fits your description"
                : "Rafi's page, still blank"
          }
        >
          {pick === "bird" && (
            <Draw key={n} d="M72 144Q108 90 144 144Q180 90 216 144" strokeWidth={7} ms={900} className="stroke-[#0f1b2d]" />
          )}
          {pick === "words" && (
            <g key={n}>
              {GUESSES.map(([x, y, r], k) => (
                <g key={k} className={POP} style={{ transitionDelay: `${k * 250}ms` }}>
                  <circle cx={x * U} cy={y * U} r={r * U} strokeWidth={3} strokeDasharray="8 6" className="fill-cat-coral/10 stroke-cat-coral" />
                  <text
                    x={x * U}
                    y={y * U}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-cat-coral font-bold"
                    style={{ fontSize: Math.max(16, r * U * 0.9) }}
                  >
                    ?
                  </text>
                </g>
              ))}
            </g>
          )}
        </Page>
      </Pages>

      <div className="text-sm font-medium text-muted">রাফিকে বলুন:</div>
      <div className="mt-2 flex flex-col gap-2">
        {SAY.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => choose(s.id)}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left transition-colors duration-200 ${
              s.id === pick ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"
            }`}
          >
            <span>“{s.say}”</span>
            {tried.includes(s.id) && <span className="ml-auto text-danger">✕</span>}
          </button>
        ))}
      </div>
      {reply && (
        <Rafi key={n} tone="bad">
          {reply.reply}
        </Rafi>
      )}
      <Task done={tried.length === SAY.length}>
        দুইভাবেই বলে দেখুন ({bn(tried.length)}/{bn(SAY.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Rule the same grid on both pages.

const LINES = Array.from({ length: N - 1 }, (_, k) => [
  `M${(k + 1) * side(N)} 0V${PAGE}`,
  `M0 ${(k + 1) * side(N)}H${PAGE}`,
]).flat();

function RuleLines() {
  return (
    <>
      {LINES.map((d, i) => (
        <Draw key={i} d={d} delay={i * 70} ms={450} strokeWidth={1.2} className="stroke-[#0f1b2d]/30" />
      ))}
    </>
  );
}

export function RuleGrid() {
  const pass = useGate();
  const [ruled, setRuled] = useState(false);

  return (
    <>
      <Pages>
        <Page who="আপনার খাতা" label={ruled ? "your drawing, ruled into 8 by 8 cells" : "your pencil drawing"}>
          <Pencil />
          {ruled && <RuleLines />}
        </Page>
        <Page who="রাফির খাতা" label={ruled ? "Rafi's blank page, ruled into the same 8 by 8 cells" : "Rafi's blank page"}>
          {ruled && <RuleLines />}
        </Page>
      </Pages>
      {ruled ? (
        <div className={`${FADE} text-center font-mono text-lg delay-1000`}>
          {bn(N)} × {bn(N)} = <b>{bn(ALL)}</b>টা ঘর
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setRuled(true);
              pass("দুই খাতায় এখন ৬৪টা করে ঘর — প্রতিটা ঘর দুই খাতায় ঠিক একই জায়গায়।");
            }}
            className={primaryBtn}
          >
            ✏️ দুই খাতাতেই ছক কাটুন
          </button>
        </div>
      )}
      <Task done={ruled}>দুই খাতায় একই মাপের ছক কেটে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · How dark, as a number. Feel both ends of the scale, then match a grey.

const TARGET = 128;
const CLOSE = 8;

export function DarkDial() {
  const pass = useGate();
  const [v, setV] = useState(200);
  const [hit, setHit] = useState({ black: false, white: false, grey: false });

  const slide = (x: number) => {
    setV(x);
    const next = {
      black: hit.black || x === 0,
      white: hit.white || x === 255,
      grey: hit.grey || Math.abs(x - TARGET) <= CLOSE,
    };
    setHit(next);
    if (next.black && next.white && next.grey) pass("0 মানে ঘুটঘুটে কালো, 255 মানে একদম সাদা, মাঝখানে সব ধূসর।");
  };
  const count = [hit.black, hit.white, hit.grey].filter(Boolean).length;

  return (
    <>
      <div className="mx-auto my-5 flex max-w-sm items-end justify-center gap-6">
        <div className="text-center">
          <div
            className="grid size-28 place-items-center rounded-xl shadow-md ring-1 ring-foreground/15 sm:size-32"
            style={{ background: gray(v) }}
          >
            <span className="font-mono text-3xl font-bold tabular-nums" style={{ color: ink(v) }}>
              {v}
            </span>
          </div>
          <div className="mt-1.5 text-sm text-muted">আপনার ঘর</div>
        </div>
        <div className="text-center">
          <div
            className="grid size-20 place-items-center rounded-xl ring-1 ring-foreground/15 sm:size-24"
            style={{ background: gray(TARGET) }}
          >
            <span className="font-mono text-xl font-bold" style={{ color: ink(TARGET) }}>
              {hit.grey ? TARGET : "?"}
            </span>
          </div>
          <div className="mt-1.5 text-sm text-muted">এই ধূসরটা</div>
        </div>
      </div>
      <Shade value={v} onChange={slide} label="how dark the cell is" />
      <Ticks
        items={[
          ["ঘুটঘুটে কালো", hit.black],
          ["একদম সাদা", hit.white],
          ["পাশের ধূসরটা", hit.grey],
        ]}
      />
      <Task done={count === 3}>
        Slider টেনে তিনটাই বানিয়ে দেখুন ({bn(count)}/{bn(3)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · A cell that is part bird, part paper. Guess its number, then watch the
//     cell melt into the one grey it averages to.

/** row 3, column 5: the edge of the head */
const MIX = 2 * N + 4;
const MIX_OPTIONS = ["0-র কাছাকাছি — প্রায় কালো", "255-র কাছাকাছি — প্রায় সাদা", "মাঝামাঝি কোনো সংখ্যা — ধূসর"];
const MIX_RIGHT = 2;

export function MixedCell() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const v = TONES[MIX];
  const s = SHEET / N;
  const x0 = colOf(MIX) * s;
  const y0 = rowOf(MIX) * s;
  const mixed = guess !== null;

  useEffect(() => {
    if (guess === null) return;
    const t = setTimeout(() => {
      setOver(true);
      pass(
        guess === MIX_RIGHT
          ? `ঠিক ধরেছেন! পাখির অংশ আর কাগজের অংশ মিলে একটা ধূসর — ${v}।`
          : `আসলে মাঝামাঝি! পাখির অংশ আর কাগজের অংশ মিলে একটা ধূসর — ${v}।`,
      );
    }, 2200);
    return () => clearTimeout(t);
  }, [guess, pass, v]);

  return (
    <>
      <Pages>
        <Page who="আপনার খাতা" label={`your ruled drawing; row ${rowOf(MIX) + 1}, column ${colOf(MIX) + 1} is picked out`}>
          <Pencil />
          <Ruling />
          <Outline i={MIX} pulse={!mixed} />
        </Page>
        <div className="min-w-0">
          <div className="mb-1.5 text-center text-sm font-medium text-muted">ঘরটা বড় করে</div>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-md ring-2 ring-cat-amber">
            <svg
              viewBox={`${x0} ${y0} ${s} ${s}`}
              role="img"
              aria-label="the cell up close: the edge of the bird's head on white paper"
              className={`absolute inset-0 size-full transition-[filter] duration-1000 ease-out motion-reduce:transition-none ${
                mixed ? "blur-xl" : ""
              }`}
            >
              <rect x={x0} y={y0} width={s} height={s} style={{ fill: gray(PAPER) }} />
              <Drawing />
            </svg>
            <div
              className={`absolute inset-0 grid place-items-center transition-opacity delay-700 duration-1000 motion-reduce:transition-none ${
                mixed ? "opacity-100" : "opacity-0"
              }`}
              style={{ background: gray(v) }}
            >
              <span
                className={`font-mono text-4xl font-bold transition-opacity delay-[1600ms] duration-500 ${
                  mixed ? "opacity-100" : "opacity-0"
                }`}
                style={{ color: ink(v) }}
              >
                {v}
              </span>
            </div>
          </div>
        </div>
      </Pages>

      <div className="text-sm font-medium text-muted">এই ঘরের জন্য রাফিকে কোন সংখ্যা বলবেন?</div>
      <div className="mt-2 flex flex-col gap-2">
        {MIX_OPTIONS.map((o, i) => (
          <Choice key={i} n={i} look={predictLook(i, guess, over, MIX_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={over}>আগে ভাবুন, তারপর একটা বেছে নিন — ঘরটা তখনই মিশে যাবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Read it out. The first row by hand, one number per press; the rest in
//     one go. Rafi shades each cell the moment he hears its number.

export function ReadOut() {
  const pass = useGate();
  const read = usePlay(55);
  const said = read.k;
  const done = said === ALL;

  const finish = () => pass("৬৪টা সংখ্যা — আর “পাখি” শব্দটা একবারও বলতে হয়নি।");
  const say = (end: number) => read.play(end, end === ALL ? finish : undefined, said);

  const row = rowOf(Math.max(0, said - 1));
  const heard = TONES.slice(row * N, said);

  return (
    <>
      <Pages>
        <Page who="আপনার খাতা" label={`your ruled drawing; ${said} of ${ALL} numbers read out`}>
          <Pencil />
          <Ruling />
          {TONES.slice(0, said).map((v, i) => (
            <Chip key={i} i={i} v={v} />
          ))}
          {!done && <Outline i={said} pulse />}
        </Page>
        <Page who="রাফির খাতা" label={`Rafi's page; ${said} of ${ALL} cells shaded`}>
          <Cells tones={TONES} count={said} />
          <Ruling />
        </Page>
      </Pages>

      <div className="min-h-12 text-center font-mono text-sm text-muted">
        {said ? (
          <>
            row {bn(row + 1)}: <span className="text-foreground">{heard.join(", ")}</span>
          </>
        ) : (
          "এখনো কিছু বলেননি"
        )}
        <br />
        বলা হয়েছে: <b className="text-foreground">{bn(said)}</b>/{bn(ALL)}
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button type="button" disabled={read.running || done} onClick={() => say(said + 1)} className={primaryBtn}>
          ▶ পরের ঘরটা বলুন
        </button>
        {said >= N && !done && (
          <button type="button" disabled={read.running} onClick={() => say(ALL)} className={`${quietBtn} ${FADE}`}>
            ⏩ বাকিগুলো একটানা
          </button>
        )}
      </div>
      {done && <Rafi tone="good">হয়ে গেছে! দেখ তো, মিললো?</Rafi>}
      <Task done={done}>
        প্রথম row-এর {bn(N)}টা ঘর নিজে এক এক করে বলুন ({bn(Math.min(said, N))}/{bn(N)}), তারপর বাকিগুলো একটানা।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Same numbers, same order — but Rafi fills from the bottom row up.

const flip = (k: number) => (N - 1 - rowOf(k)) * N + colOf(k);
const ORDER_OPTIONS = ["হুবহু একই পাখি", "উল্টো পাখি — মাথা নিচের দিকে", "কিছুই চেনা যাবে না, সব এলোমেলো"];
const ORDER_RIGHT = 1;

export function WrongOrder() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const fill = usePlay(30);
  const over = guess !== null && fill.k === ALL;

  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    fill.play(ALL, () =>
      pass(
        i === ORDER_RIGHT
          ? "ঠিক ধরেছেন! সংখ্যা একই, শুধু কোনটা কোন ঘরে বসলো সেটা বদলেছে — তাতেই ছবি উল্টে গেল।"
          : "আসলে পাখি উল্টে গেল! সংখ্যা একই, শুধু কোনটা কোন ঘরে বসলো সেটা বদলেছে।",
      ),
    );
  };

  return (
    <>
      <Pages>
        <Page who="আপনার খাতা" label="your ruled drawing">
          <Pencil />
          <Ruling />
        </Page>
        <Page who="রাফির খাতা · নিচ থেকে" label="Rafi's page, filled from the bottom row up">
          <Cells tones={TONES} count={fill.k} at={flip} />
          <Ruling />
        </Page>
      </Pages>

      <div className="text-sm font-medium text-muted">রাফির খাতায় কী আসবে বলে মনে হয়?</div>
      <div className="mt-2 flex flex-col gap-2">
        {ORDER_OPTIONS.map((o, i) => (
          <Choice key={i} n={i} look={predictLook(i, guess, over, ORDER_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {over && <Rafi tone="bad">এ কী! তোর পাখি দেখি বাদুড়ের মতো ডাল থেকে ঝুলে আছে!</Rafi>}
      <Task done={over}>আগে ভাবুন, তারপর একটা বেছে নিন — রাফি তখনই ভরা শুরু করবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Tap pixels to read them; find the darkest. Darker means a smaller number,
//     and the reader has to use that to get there.

const DARKEST = TONES.indexOf(Math.min(...TONES));

export function PixelHunt() {
  const pass = useGate();
  const [seen, setSeen] = useState<number[]>([]);
  const [at, setAt] = useState<number | null>(null);
  const found = seen.includes(DARKEST);

  const tap = (i: number) => {
    setAt(i);
    if (!seen.includes(i)) setSeen([...seen, i]);
    if (i === DARKEST) pass(`পেয়েছেন! Value ${TONES[i]} — সবচেয়ে কালো pixel, তাই সবচেয়ে ছোট সংখ্যা।`);
  };

  return (
    <>
      <div className="mx-auto my-5 w-full max-w-[17rem]">
        <Page who="রাফির খাতা" label="Rafi's finished page, 64 pixels. Tap a pixel to read its number." onCell={tap}>
          <Cells tones={TONES} />
          <Ruling />
          {seen.map((i) => (
            <Chip key={i} i={i} v={TONES[i]} strong={i === at} />
          ))}
        </Page>
      </div>
      <div className="min-h-6 text-center text-[0.95rem]">
        {at !== null ? (
          <span key={at} className={`inline-block ${FADE}`}>
            pixel · row {bn(rowOf(at) + 1)}, column {bn(colOf(at) + 1)} · value{" "}
            <b className="font-mono text-lg">{TONES[at]}</b>
          </span>
        ) : (
          <span className="text-muted">যেকোনো ঘরে tap করুন</span>
        )}
      </div>
      {at !== null && !found && (
        <Nope key={`${at}-${seen.length}`}>এটার value {TONES[at]}। এর চেয়েও কালো ঘর আছে — মানে আরো ছোট সংখ্যা।</Nope>
      )}
      <Task done={found}>রাফির খাতার সবচেয়ে কালো pixel-টা খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Finer grids: the picture sharpens, the count explodes.

const FINEST = GRID_SIZES[GRID_SIZES.length - 1];

export function FinerGrid() {
  const pass = useGate();
  const [n, setN] = useState(N);
  const [finest, setFinest] = useState(false);

  const pick = (k: number) => {
    setN(k);
    if (k === FINEST) {
      setFinest(true);
      pass("যত ছোট ঘর, ছবি তত পরিষ্কার — কিন্তু বলতে হয় তত বেশি সংখ্যা।");
    }
  };

  return (
    <>
      <Pages>
        <Page who="আপনার খাতা" label={`your drawing, ruled ${n} by ${n}`}>
          <Pencil />
          {n <= 24 && <Ruling n={n} />}
        </Page>
        <Page who="রাফির খাতা" label={`Rafi's page, shaded from a ${n} by ${n} grid`}>
          <g key={n}>
            <Cells tones={CELL_TONES[n]} n={n} />
          </g>
          {n <= 12 && <Ruling n={n} />}
        </Page>
      </Pages>
      <div className="flex flex-wrap justify-center gap-2">
        {GRID_SIZES.map((k) => (
          <button key={k} type="button" aria-pressed={k === n} onClick={() => pick(k)} className={pill(k === n)}>
            {bn(k)} × {bn(k)}
          </button>
        ))}
      </div>
      <div className="mt-3 text-center">
        {bn(n)} × {bn(n)} = <b className="font-mono text-lg">{bn(n * n)}</b>টা সংখ্যা বলতে হবে
      </div>
      <Task done={finest}>
        Grid ছোট-বড় করে দেখুন — একদম ছোট ঘর ({bn(FINEST)} × {bn(FINEST)}) পর্যন্ত যান।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · The other way round: nine numbers — which picture are they?

const LAB = [10, 20, 15, 25, 240, 30, 12, 18, 22];
const PICTURES = [
  [240, 238, 236, 128, 130, 126, 14, 12, 16], // bright on top, dark below
  LAB,
  [245, 235, 240, 230, 15, 225, 243, 237, 233], // its negative
];
const PICTURE_RIGHT = 1;

function Mini({ values }: { values: number[] }) {
  return (
    <svg viewBox="0 0 3 3" shapeRendering="crispEdges" className="block aspect-square w-full rounded-md ring-1 ring-foreground/15">
      {values.map((v, i) => (
        <rect key={i} x={i % 3} y={Math.floor(i / 3)} width={1} height={1} style={{ fill: gray(v) }} />
      ))}
    </svg>
  );
}

export function GuessPicture() {
  const pass = useGate();
  const [wrong, setWrong] = useState<number[]>([]);
  const [won, setWon] = useState(false);

  const choose = (i: number) => {
    if (won) return;
    if (i === PICTURE_RIGHT) {
      setWon(true);
      pass("মাঝের 240 প্রায় সাদা, চারপাশের সব প্রায় কালো — অন্ধকারে একটা উজ্জ্বল point।");
    } else setWrong((w) => (w.includes(i) ? w : [...w, i]));
  };

  return (
    <>
      <div className="mx-auto my-5 grid w-full max-w-[13rem] grid-cols-3 gap-1.5">
        {LAB.map((v, i) => (
          <div
            key={i}
            className="grid aspect-square place-items-center rounded-md bg-surface font-mono text-xl font-semibold ring-1 ring-foreground/15 transition-colors duration-700 motion-reduce:transition-none"
            style={won ? { background: gray(v), color: ink(v), transitionDelay: `${i * 90}ms` } : undefined}
          >
            {v}
          </div>
        ))}
      </div>

      <div className="text-sm font-medium text-muted">এই ৯টা সংখ্যা কোন ছবিটা?</div>
      <div className="mx-auto mt-2 grid max-w-sm grid-cols-3 gap-3">
        {PICTURES.map((p, i) => {
          const look: Look = won && i === PICTURE_RIGHT ? "right" : wrong.includes(i) ? "wrong" : won ? "dim" : "idle";
          return (
            <button
              key={i}
              type="button"
              disabled={won || wrong.includes(i)}
              onClick={() => choose(i)}
              aria-label={`picture ${String.fromCharCode(65 + i)}`}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-2.5 transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default ${LOOK[look]}`}
            >
              <Mini values={p} />
              <span className="text-sm font-semibold">
                {look === "right" ? "✓" : look === "wrong" ? "✕" : String.fromCharCode(65 + i)}
              </span>
            </button>
          );
        })}
      </div>
      {!won && wrong.length > 0 && (
        <div className="mt-3 rounded-xl bg-cat-amber/10 px-3.5 py-2.5 text-[0.95rem] leading-snug transition duration-300 starting:opacity-0">
          <b className="font-semibold">একটা hint:</b> সংখ্যা যত ছোট, ঘর তত কালো। 240 কোথায় বসে আছে দেখুন।
        </div>
      )}
      <Task done={won}>৯টা সংখ্যা দেখে ছবিটা চিনে ফেলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11 · Edit the picture without a photo editor: change two numbers.

export function EditPicture() {
  const pass = useGate();
  const [px, setPx] = useState(LAB);
  const [sel, setSel] = useState(4); // the 240 in the middle
  const off = px[4] < 60;
  const on = px[0] > 200;

  const set = (v: number) => {
    const next = px.map((old, j) => (j === sel ? v : old));
    setPx(next);
    if (next[4] < 60 && next[0] > 200) pass("কেউ photo edit করেনি — শুধু দুইটা সংখ্যা বদলেছে।");
  };

  return (
    <>
      <div className="mx-auto my-5 flex max-w-sm flex-wrap items-center justify-center gap-5">
        <div className="grid w-44 grid-cols-3 gap-1">
          {px.map((v, i) => (
            <button
              key={i}
              type="button"
              aria-label={`row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}, value ${v}`}
              aria-pressed={i === sel}
              onClick={() => setSel(i)}
              className={`grid aspect-square cursor-pointer place-items-center rounded-md font-mono text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${
                i === sel ? "ring-4 ring-cat-amber" : "ring-1 ring-foreground/15"
              }`}
              style={{ background: gray(v), color: ink(v) }}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="font-mono text-sm leading-relaxed text-muted">
          [{px.slice(0, 3).join(", ")}]
          <br />[{px.slice(3, 6).join(", ")}]
          <br />[{px.slice(6).join(", ")}]
        </div>
      </div>
      <Shade value={px[sel]} onChange={set} label={`value of row ${Math.floor(sel / 3) + 1}, column ${(sel % 3) + 1}`} />
      <Ticks
        items={[
          ["মাঝের আলোটা নিভিয়ে দিন", off],
          ["বাঁ-উপরের কোণায় আলো জ্বালান", on],
        ]}
      />
      <Task done={off && on}>ঘরে tap করে বেছে নিন, তারপর slider টেনে তার সংখ্যা বদলান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 12 · Draw anything; the list the machine gets lights up under your finger.

const P = 12;
const PS = 24; // viewBox units per cell
const P_BG = 20;
const P_INK = 235;
const P_GOAL = 12;
const P_BLANK = Array<number>(P * P).fill(P_BG);

export function YouDraw() {
  const pass = useGate();
  const [px, setPx] = useState(P_BLANK);
  const [erase, setErase] = useState(false);
  const [nums, setNums] = useState(false);
  const lit = px.filter((v) => v === P_INK).length;

  const paint = (i: number) => {
    const v = erase ? P_BG : P_INK;
    if (px[i] === v) return;
    // functional update: a fast drag can land two cells before the next render
    setPx((p) => p.map((old, j) => (j === i ? v : old)));
    if (!erase && lit + 1 >= P_GOAL) pass("আপনার কাছে এটা একটা ছবি। কম্পিউটারের কাছে ১৪৪টা সংখ্যার একটা list।");
  };

  return (
    <>
      <div className="mx-auto my-5 w-full max-w-[16rem] overflow-hidden rounded-lg shadow-md ring-1 ring-foreground/15">
        <Board size={P * PS} n={P} label="a 12 by 12 grid to draw on — press and drag" onCell={paint} drag>
          <g shapeRendering="crispEdges">
            {px.map((v, i) => (
              <rect
                key={i}
                x={(i % P) * PS}
                y={Math.floor(i / P) * PS}
                width={PS}
                height={PS}
                style={{ fill: gray(v) }}
                className="transition-[fill] duration-200"
              />
            ))}
          </g>
          <path
            d={Array.from({ length: P - 1 }, (_, k) => `M${(k + 1) * PS} 0V${P * PS}M0 ${(k + 1) * PS}H${P * PS}`).join("")}
            strokeWidth={0.8}
            className="pointer-events-none fill-none stroke-white/15"
          />
          {nums &&
            px.map((v, i) => (
              <text
                key={i}
                x={((i % P) + 0.5) * PS}
                y={(Math.floor(i / P) + 0.5) * PS}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none font-mono text-[8px]"
                style={{ fill: ink(v) }}
              >
                {v}
              </text>
            ))}
        </Board>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" aria-pressed={!erase} onClick={() => setErase(false)} className={pill(!erase)}>
          ✏️ আঁকুন
        </button>
        <button type="button" aria-pressed={erase} onClick={() => setErase(true)} className={pill(erase)}>
          মুছুন
        </button>
        <button type="button" aria-pressed={nums} onClick={() => setNums((s) => !s)} className={pill(nums)}>
          {nums ? "সংখ্যা লুকান" : "সংখ্যা দেখান"}
        </button>
        <button type="button" onClick={() => setPx(P_BLANK)} className={pill(false)}>
          ↺ সব মুছুন
        </button>
      </div>

      <div className="mx-auto mt-4 max-w-md rounded-xl border border-border px-3 py-2.5">
        <div className="mb-1 text-sm text-muted">
          কম্পিউটার যা পায় — {bn(P * P)}টা সংখ্যা, তার {bn(lit)}টা জ্বলছে:
        </div>
        <div className="overflow-x-auto font-mono text-[0.68rem] leading-snug whitespace-pre tabular-nums sm:text-xs">
          {Array.from({ length: P }, (_, r) => (
            <div key={r}>
              {px.slice(r * P, r * P + P).map((v, c) => (
                <span key={c} className={v === P_INK ? "font-bold text-accent-text" : "text-muted/60"}>
                  {String(v).padStart(3, " ")}
                  {c < P - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <Task done={lit >= P_GOAL}>
        চেপে ধরে টেনে কিছু একটা আঁকুন — অন্তত {bn(P_GOAL)}টা ঘর ({bn(Math.min(lit, P_GOAL))}/{bn(P_GOAL)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 13 · The photo-like bird, and what the computer actually gets: the picture
//      drains away row by row and leaves only its 1,600 numbers.

const BU = 24; // viewBox units per cell

export function BirdNumbers() {
  const pass = useGate();
  const [num, setNum] = useState(false);
  const [at, setAt] = useState<number | null>(null);
  const i = at ?? 20 * BIRD_COLS + 17; // a wing pixel, so the readout is never empty

  const show = (n: boolean) => {
    setNum(n);
    if (n) pass(`পাখিটা উধাও! বাকি থাকলো ${bn("1,600")}টা সংখ্যা।`);
  };

  return (
    <>
      <div className="mx-auto my-5 w-full max-w-sm overflow-hidden rounded-lg ring-1 ring-foreground/15">
        <Board
          size={BIRD_COLS * BU}
          n={BIRD_COLS}
          label={num ? "the bird as 1,600 numbers" : "a photo-like bird on a branch, 40 by 40 pixels"}
          onCell={setAt}
        >
          <g shapeRendering="crispEdges">
            {BIRD_PX.map((v, k) => (
              <rect
                key={k}
                x={(k % BIRD_COLS) * BU}
                y={Math.floor(k / BIRD_COLS) * BU}
                width={BU}
                height={BU}
                style={{ fill: gray(v), transitionDelay: `${Math.floor(k / BIRD_COLS) * 25}ms` }}
                className={`transition-opacity duration-500 motion-reduce:transition-none ${num ? "opacity-0" : ""}`}
              />
            ))}
          </g>
          {num &&
            BIRD_PX.map((v, k) => (
              <text
                key={k}
                x={((k % BIRD_COLS) + 0.5) * BU}
                y={(Math.floor(k / BIRD_COLS) + 0.5) * BU}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ transitionDelay: `${Math.floor(k / BIRD_COLS) * 25}ms` }}
                className={`font-mono text-[9px] transition-opacity duration-500 motion-reduce:transition-none starting:opacity-0 ${
                  k === i ? "fill-foreground font-bold" : "fill-muted"
                }`}
              >
                {v}
              </text>
            ))}
          <rect
            x={(i % BIRD_COLS) * BU}
            y={Math.floor(i / BIRD_COLS) * BU}
            width={BU}
            height={BU}
            strokeWidth={3}
            className="pointer-events-none fill-none stroke-cat-amber"
          />
        </Board>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" aria-pressed={!num} onClick={() => show(false)} className={pill(!num)}>
          আপনি যা দেখেন
        </button>
        <button type="button" aria-pressed={num} onClick={() => show(true)} className={pill(num)}>
          কম্পিউটার যা পায়
        </button>
      </div>
      <div className="mt-3 text-center text-[0.95rem]">
        row {bn(Math.floor(i / BIRD_COLS) + 1)}, column {bn((i % BIRD_COLS) + 1)} → brightness{" "}
        <b className="font-mono text-lg">{BIRD_PX[i]}</b>
      </div>
      <Task done={num}>“কম্পিউটার যা পায়” চেপে দেখুন। যেকোনো ঘরে tap করলে তার সংখ্যাটা নিচে দেখা যাবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 14 · The whole lesson, replayed on one page: drawing → grid → greys → numbers.

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const stage = useCountUp(4, 1300);
  return (
    <>
      <div className="mx-auto my-5 w-full max-w-[16rem]">
        <Page who="আপনার খাতা" label="your drawing, ruled, shaded, and finally read as numbers">
          <Pencil />
          {stage >= 1 && <RuleLines />}
          {stage >= 2 && <Cells tones={TONES} />}
          {stage >= 2 && <Ruling />}
          {stage >= 3 && TONES.map((v, i) => <Chip key={i} i={i} v={v} />)}
        </Page>
      </div>
      {stage >= 4 && (
        <div className={`${FADE} text-center`}>
          <div className="font-mono text-sm break-words text-muted">
            পাখি = [{TONES.slice(0, 10).join(", ")}, … {bn(ALL)}টা সংখ্যা]
          </div>
          <button
            type="button"
            onClick={onReplay}
            className="mt-3 cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            ↺ আবার দেখুন
          </button>
        </div>
      )}
    </>
  );
}

export function Finale() {
  const [run, setRun] = useState(0);
  return <FinaleReel key={run} onReplay={() => setRun((r) => r + 1)} />;
}
