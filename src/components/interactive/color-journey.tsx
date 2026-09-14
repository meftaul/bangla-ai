"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, LOOK, Nope, POP, Speech, Ticks, predictLook, primaryBtn, useCountUp, usePlay } from "@/components/journey/kit";
import { bn } from "./figure-kit";

// Screens for "Math for AI 1.3 — রঙিন ছবি", told as a Journey.
//
// Rafi again (from 1.1), and this time the drawing is a watercolour
// watermelon. Read out the old way — one brightness per cell — it arrives
// grey, and worse: the red flesh and the green rind are tuned to the same
// brightness, so they turn into one grey. A drop of water on a phone screen
// shows why: every pixel is three little lamps. The reader finds the eight
// on/off colours (2 × 2 × 2, the binary lesson again), dials real colours with
// three 0–255 numbers, sorts Rafi's three unlabelled sheets, stacks them into
// the colour picture, pulls one out, reads colours from numbers, and finds that
// grey is just three equal numbers.
//
// The sheets add light, so they are drawn as tinted layers blended with
// `screen` on black: rgb(r 0 0) + rgb(0 g 0) + rgb(0 0 b) is exactly (r, g, b).
// The picture the stack ends on is not drawn anywhere — it is the three sheets.
// Paper, screens and lamps use fixed colours (they are light, not UI);
// everything around them uses the site's theme tokens. Tailwind only, and
// SVG/DOM rather than canvas, so the Bangla labels shape.

type RGB = [number, number, number];
type Part = "paper" | "flesh" | "rind" | "seed";

const N = 12;
const ALL = N * N;
/** viewBox units per cell */
const S = 10;
const SIDE = N * S;

// The drawing's four paints. Flesh and rind are tuned to the same brightness
// (105), so read out as one number per cell they become the same grey.
const PAINT: Record<Part, RGB> = {
  paper: [242, 236, 222],
  flesh: [232, 48, 64],
  rind: [24, 156, 56],
  seed: [28, 24, 24],
};

/** How bright a colour looks — the one number the grey rule would say for it. */
const luma = ([r, g, b]: RGB) => Math.round(0.299 * r + 0.587 * g + 0.114 * b);
const css = (c: RGB) => `rgb(${c.join(" ")})`;
const grey = (v: number) => `rgb(${v} ${v} ${v})`;
const trip = (c: RGB) => `(${c.join(", ")})`;

// A watermelon slice, cut side up, in cell units. The rind is a cell and a half
// thick, so plenty of cells are clearly rind at 12 × 12.
const CX = 6;
const CY = 3;
const R_FLESH = 4.5;
const R_RIND = 6;
// seeds sit on cell centres and are just under a cell big: each is one pure seed cell
const SEEDS: [number, number][] = [
  [4.5, 4.5],
  [7.5, 4.5],
  [3.5, 5.5],
  [6.5, 6.5],
];

const partAt = (x: number, y: number): Part => {
  if (SEEDS.some(([sx, sy]) => ((x - sx) / 0.5) ** 2 + ((y - sy) / 0.62) ** 2 <= 1)) return "seed";
  const d = Math.hypot(x - CX, y - CY);
  if (y < CY || d > R_RIND) return "paper";
  return d > R_FLESH ? "rind" : "flesh";
};

// Each cell averages 4 × 4 samples, the way a camera sensor averages the light
// that lands on it.
const SS = 4;
const CELLS = Array.from({ length: ALL }, (_, i) => {
  const hits: Part[] = [];
  for (let a = 0; a < SS; a++)
    for (let b = 0; b < SS; b++) hits.push(partAt((i % N) + (a + 0.5) / SS, Math.floor(i / N) + (b + 0.5) / SS));
  const rgb = [0, 1, 2].map((k) => Math.round(hits.reduce((s, p) => s + PAINT[p][k], 0) / hits.length)) as RGB;
  // What a tap on this cell counts as, so that what a screen says about it is
  // true: paper and seed only when pure; flesh or rind when the cell is those
  // two alone (any mix of them is still exactly 105) and one clearly wins —
  // then its own lamp is the one lit. Edge cells count as nothing.
  const n = (p: Part) => hits.filter((h) => h === p).length;
  const kind: Part | null =
    n("paper") === hits.length
      ? "paper"
      : n("seed") === hits.length
        ? "seed"
        : n("paper") || n("seed") || n("flesh") === n("rind")
          ? null
          : n("flesh") > n("rind")
            ? "flesh"
            : "rind";
  return { rgb, kind };
});
const MELON = CELLS.map((c) => c.rgb);
const KIND = CELLS.map((c) => c.kind);

const CH = [
  { name: "লাল", chip: "bg-[#dc2626]", edge: "248 113 113", tint: (v: number) => `rgb(${v} 0 0)` },
  { name: "সবুজ", chip: "bg-[#16a34a]", edge: "74 222 128", tint: (v: number) => `rgb(0 ${v} 0)` },
  { name: "নীল", chip: "bg-[#2563eb]", edge: "96 165 250", tint: (v: number) => `rgb(0 0 ${v})` },
];
const ON3 = [true, true, true];

// ---------------------------------------------------------------------------
// Sheets and what goes on them.

/** Which cell of the grid a pointer is on. The SVG scales, so go through its box. */
function cellAt(svg: SVGSVGElement | null, e: { clientX: number; clientY: number }): number | null {
  if (!svg) return null;
  const r = svg.getBoundingClientRect();
  const c = Math.floor(((e.clientX - r.left) / r.width) * N);
  const w = Math.floor(((e.clientY - r.top) / r.height) * N);
  return c < 0 || c >= N || w < 0 || w >= N ? null : w * N + c;
}

const GRID_D = Array.from({ length: N - 1 }, (_, k) => `M${(k + 1) * S} 0V${SIDE}M0 ${(k + 1) * S}H${SIDE}`).join("");

function Cells({ fill, className = "" }: { fill: (i: number) => string; className?: string }) {
  return (
    <g shapeRendering="crispEdges">
      {Array.from({ length: ALL }, (_, i) => (
        <rect key={i} x={(i % N) * S} y={Math.floor(i / N) * S} width={S} height={S} style={{ fill: fill(i) }} className={className} />
      ))}
    </g>
  );
}

function Lines() {
  return <path d={GRID_D} strokeWidth={0.35} className="pointer-events-none fill-none stroke-black/15" />;
}

/** A ring around one cell: the one being read, or the one picked. */
function Ring({ i, className = "stroke-cat-blue" }: { i: number; className?: string }) {
  return (
    <rect
      x={(i % N) * S + 0.9}
      y={Math.floor(i / N) * S + 0.9}
      width={S - 1.8}
      height={S - 1.8}
      rx={1.2}
      strokeWidth={1.8}
      className={`pointer-events-none fill-none ${className}`}
    />
  );
}

/** A sheet of paper, with whose it is written above it. */
function Sheet({
  who,
  label,
  onCell,
  children,
}: {
  who?: string;
  label: string;
  onCell?: (i: number) => void;
  children: ReactNode;
}) {
  const ref = useRef<SVGSVGElement>(null);
  // ponytail: cells are picked by pointer only, like the 1.1 screens. Add an
  // arrow-key cursor + Enter if a keyboard-only reader needs these gates.
  return (
    <div className="min-w-0">
      {who ? <div className="mb-1.5 text-center text-sm font-medium text-muted">{who}</div> : null}
      <div className="overflow-hidden rounded-lg shadow-md ring-1 ring-foreground/15">
        <svg
          ref={ref}
          viewBox={`0 0 ${SIDE} ${SIDE}`}
          role={onCell ? "group" : "img"}
          aria-label={label}
          onPointerDown={
            onCell
              ? (e) => {
                  const i = cellAt(ref.current, e);
                  if (i !== null) onCell(i);
                }
              : undefined
          }
          className={`block h-auto w-full select-none ${onCell ? "cursor-pointer touch-manipulation" : ""}`}
        >
          {children}
        </svg>
      </div>
    </div>
  );
}

/** Your page and Rafi's, side by side. */
function Pages({ children }: { children: ReactNode }) {
  return <div className="mx-auto my-5 grid w-full max-w-md grid-cols-2 items-end gap-3 sm:gap-5">{children}</div>;
}

function Rafi(props: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return <Speech who="রাফি" initial="র" tint="blue" {...props} />;
}

function Swatch({ c, label }: { c: string; label: string }) {
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <i className="inline-block size-10 rounded-lg ring-1 ring-foreground/20" style={{ background: c }} />
      <span className="text-xs text-muted">{label}</span>
    </span>
  );
}

/** A pixel seen up close: three little lamps, each lit as much as its number says. */
function Triad({ c, className = "" }: { c: RGB; className?: string }) {
  return (
    <div className={`grid grid-cols-3 gap-1.5 rounded-lg bg-black p-2 ${className}`} aria-hidden="true">
      {CH.map((ch, k) => (
        <i
          key={k}
          className="block rounded-full ring-1 ring-white/10 transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none"
          style={{ background: ch.tint(c[k]), boxShadow: c[k] ? `0 0 ${4 + c[k] / 20}px ${ch.tint(c[k])}` : "none" }}
        />
      ))}
    </div>
  );
}

/** One pixel's three numbers, one from each sheet, and the colour they add up to. */
function Sum({ c }: { c: RGB }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 font-mono text-sm">
      {CH.map((ch, k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          {k > 0 && <span className="text-muted">+</span>}
          <span className={`rounded-full px-2.5 py-0.5 font-semibold text-white ${ch.chip}`}>
            {ch.name} {c[k]}
          </span>
        </span>
      ))}
      <span className="text-muted">=</span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border py-0.5 pr-2.5 pl-1">
        <i className="inline-block size-5 rounded-full ring-1 ring-foreground/20" style={{ background: css(c) }} />
        <b>{trip(c)}</b>
      </span>
    </div>
  );
}

/**
 * The three sheets as tinted layers that add their light. `phase` 0 is pulled
 * apart and tipped over, 1 stacked, 2 turned to face the reader.
 */
function Stack({
  phase,
  use = ON3,
  at = null,
  onCell,
}: {
  phase: number;
  use?: boolean[];
  at?: number | null;
  onCell?: (i: number) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const spread = phase === 0 ? 1 : 0;
  const tilt = phase < 2 ? 1 : 0;
  return (
    <div className="relative isolate mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-black ring-1 ring-foreground/15">
      {CH.map((ch, k) => (
        <div
          key={k}
          className="absolute top-[20%] left-[20%] size-[60%] mix-blend-screen transition-transform duration-700 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translateY(${(k - 1) * 44 * spread}%) scale(${tilt ? 1 : 1.5})` }}
        >
          <div
            className="size-full transition-[transform,box-shadow] duration-700 ease-in-out motion-reduce:transition-none"
            style={{
              transform: `rotateX(${60 * tilt}deg) rotateZ(${-45 * tilt}deg)`,
              boxShadow: `0 0 0 1px rgb(${ch.edge} / ${0.8 * tilt})`,
            }}
          >
            <svg viewBox={`0 0 ${SIDE} ${SIDE}`} aria-hidden="true" className="block size-full">
              <Cells fill={(i) => ch.tint(use[k] ? MELON[i][k] : 0)} />
            </svg>
          </div>
        </div>
      ))}
      {CH.map((ch, k) => (
        <span
          key={k}
          aria-hidden="true"
          className="absolute left-[4%] text-xs font-semibold transition-opacity duration-500 motion-reduce:transition-none"
          style={{ top: `${50 + (k - 1) * 26.4 - 12}%`, opacity: spread, color: `rgb(${ch.edge})` }}
        >
          {ch.name} পাতা
        </span>
      ))}
      {onCell && phase === 2 && (
        <svg
          ref={ref}
          viewBox={`0 0 ${SIDE} ${SIDE}`}
          role="group"
          aria-label="the three sheets stacked into one colour picture; tap a cell"
          onPointerDown={(e) => {
            const i = cellAt(ref.current, e);
            if (i !== null) onCell(i);
          }}
          className={`${FADE} absolute top-[5%] left-[5%] size-[90%] cursor-pointer touch-manipulation delay-500`}
        >
          {at !== null && <Ring i={at} className="stroke-white" />}
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · The old rule: one brightness per cell. It arrives grey, flesh and rind
//     one and the same grey.

export function ColorCall() {
  const pass = useGate();
  const read = usePlay(28);
  const k = read.k; // cells read so far
  const started = read.running || k > 0;
  const done = k === ALL;

  const start = () => read.play(ALL, () => pass("সংখ্যাগুলো ঠিকঠাক পৌঁছেছে, কিন্তু রঙ পৌঁছায়নি।"));

  return (
    <>
      <Pages>
        <Sheet who="আপনার খাতা" label="your watercolour watermelon">
          <Cells fill={(i) => css(MELON[i])} />
          <Lines />
          {read.running && <Ring i={k} />}
        </Sheet>
        <Sheet who="রাফির খাতা" label={`Rafi's copy: ${k} of ${ALL} cells painted`}>
          <Cells fill={(i) => (i < k ? grey(luma(MELON[i])) : "#fafafa")} />
          <Lines />
          {read.running && <Ring i={k} />}
        </Sheet>
      </Pages>
      <div className="min-h-8 text-center font-mono text-lg">
        {read.running ? (
          <>
            <span className="text-sm text-muted">ঘর {bn(k + 1)}:</span> <b>{luma(MELON[k])}</b>
          </>
        ) : done ? (
          <span className="text-sm text-muted">
            {bn(ALL)}টা ঘর, {bn(ALL)}টা সংখ্যা
          </span>
        ) : null}
      </div>
      {!started && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={start} className={primaryBtn}>
            আগের নিয়মে সংখ্যা বলা Start করুন
          </button>
        </div>
      )}
      {done && <Rafi tone="bad">ছবি তো আসলো, কিন্তু এটা কী আঁকলি? একটা ধূসর অর্ধেক চাঁদ, ভেতরে চারটা কালো ফোঁটা?</Rafi>}
      <Task done={done}>আগের নিয়মে, প্রতিটা ঘর কতটা উজ্জ্বল সেই সংখ্যাটা রাফিকে বলে দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Why: a red cell and a green cell, one and the same number.

export function SameNumber() {
  const pass = useGate();
  const [at, setAt] = useState<number | null>(null);
  const [seen, setSeen] = useState<Part[]>([]);
  const both = seen.includes("flesh") && seen.includes("rind");

  const pick = (i: number) => {
    setAt(i);
    const p = KIND[i];
    if (!p || seen.includes(p)) return;
    const s = [...seen, p];
    setSeen(s);
    if (!both && s.includes("flesh") && s.includes("rind"))
      pass("একটা সংখ্যা শুধু বলে কতটা আলো। কোন রঙের আলো, সেটা বলে না।");
  };
  const c = at === null ? null : MELON[at];

  return (
    <>
      <Pages>
        <Sheet who="আপনার খাতা · ঘরে tap করুন" label="your watermelon; tap a cell" onCell={pick}>
          <Cells fill={(i) => css(MELON[i])} />
          <Lines />
          {at !== null && <Ring i={at} />}
        </Sheet>
        <Sheet who="রাফির খাতা" label="Rafi's grey copy">
          <Cells fill={(i) => grey(luma(MELON[i]))} />
          <Lines />
          {at !== null && <Ring i={at} />}
        </Sheet>
      </Pages>
      {c ? (
        <div key={at} className={`${FADE} flex items-center justify-center gap-3 text-sm`}>
          <Swatch c={css(c)} label="আপনার ঘর" />
          <span className="text-muted">→ বলেছিলেন</span>
          <b className="font-mono text-2xl">{luma(c)}</b>
          <span className="text-muted">→</span>
          <Swatch c={grey(luma(c))} label="রাফির ঘর" />
        </div>
      ) : (
        <div className="text-center text-sm text-muted">আপনার খাতার যেকোনো ঘরে tap করুন</div>
      )}
      {both && <Rafi>লাল ঘরটাও 105, সবুজটাও 105? তাহলে তো দুইটা একই রঙ! আমি তো ঠিকই আঁকছি।</Rafi>}
      <Ticks
        items={[
          ["লাল শাঁসের একটা ঘর", seen.includes("flesh")],
          ["সবুজ খোসার একটা ঘর", seen.includes("rind")],
        ]}
      />
      <Task done={both}>লাল শাঁসের একটা ঘর আর সবুজ খোসার একটা ঘরে tap করে দেখুন, কোনটার জন্য কী বলেছিলেন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · A drop of water on a phone screen: every pixel is three little lamps.

const LENS = 22;
const PARTS: Part[] = ["flesh", "rind", "seed", "paper"];
const PART_NAME: Record<Part, string> = { flesh: "লাল শাঁস", rind: "সবুজ খোসা", seed: "কালো বিচি", paper: "সাদা কাগজ" };
const STEP_KEYS: Record<string, [number, number]> = { ArrowLeft: [-S, 0], ArrowRight: [S, 0], ArrowUp: [0, -S], ArrowDown: [0, S] };

function lampsSay(c: RGB) {
  const lit = CH.filter((_, k) => c[k] > 128).map((ch) => ch.name);
  if (lit.length === 3) return "তিনটা lamp-ই জোরে জ্বলছে";
  if (lit.length === 0) return "তিনটা lamp-ই প্রায় নিভে আছে";
  if (lit.length === 1) return `শুধু ${lit[0]} lamp-টা জোরে জ্বলছে`;
  return `${lit.join(" আর ")} lamp জোরে জ্বলছে`;
}

export function WaterDrop() {
  const pass = useGate();
  const [pos, setPos] = useState<[number, number]>([2.5 * S, 1.5 * S]);
  const [seen, setSeen] = useState<Part[]>([]);
  const down = useRef(false);
  const [x, y] = pos;
  const i = Math.floor(y / S) * N + Math.floor(x / S);
  const c = MELON[i];
  // the drop hangs above the spot it magnifies, or below it near the top edge
  const up = y > LENS * 2.3;
  const ly = up ? y - LENS * 1.55 : y + LENS * 1.55;
  const lx = Math.min(SIDE - LENS - 2, Math.max(LENS + 2, x));
  const tip = up ? ly + LENS * 0.9 : ly - LENS * 0.9;

  const moveTo = (nx: number, ny: number) => {
    const px = Math.min(SIDE - 0.01, Math.max(0, nx));
    const py = Math.min(SIDE - 0.01, Math.max(0, ny));
    setPos([px, py]);
    const p = KIND[Math.floor(py / S) * N + Math.floor(px / S)];
    if (!p || seen.includes(p)) return;
    const s = [...seen, p];
    setSeen(s);
    if (s.length === PARTS.length) pass("প্রতিটা ঘর আসলে তিনটা ছোট্ট lamp। কোনটা কতটা জ্বলছে, তাতেই ঘরের রঙ।");
  };
  const fromPointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    moveTo(((e.clientX - r.left) / r.width) * SIDE, ((e.clientY - r.top) / r.height) * SIDE);
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const d = STEP_KEYS[e.key];
    if (!d) return;
    e.preventDefault();
    moveTo(x + d[0], y + d[1]);
  };

  return (
    <>
      <div className="mx-auto my-5 w-full max-w-[17rem]">
        <div className="mb-1.5 text-center text-sm font-medium text-muted">আব্বুর ফোনের screen</div>
        <div className="rounded-[1.75rem] bg-[#0b0f19] p-2.5 shadow-lg ring-1 ring-foreground/20">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/15" />
          <svg
            viewBox={`0 0 ${SIDE} ${SIDE}`}
            role="application"
            aria-label="a phone screen with a drop of water on it; arrow keys move the drop"
            tabIndex={0}
            onKeyDown={onKey}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              down.current = true;
              fromPointer(e);
            }}
            onPointerMove={(e) => {
              if (down.current || e.pointerType === "mouse") fromPointer(e);
            }}
            onPointerUp={() => {
              down.current = false;
            }}
            onPointerCancel={() => {
              down.current = false;
            }}
            className="block h-auto w-full cursor-grab touch-none rounded-lg select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cat-blue"
          >
            <defs>
              <clipPath id="drop-lens">
                <circle cx={lx} cy={ly} r={LENS} />
              </clipPath>
            </defs>
            <Cells fill={(k) => css(MELON[k])} />
            <Ring i={i} className="stroke-white" />
            <path d={`M${lx - 6} ${tip}L${lx + 6} ${tip}L${x} ${y}Z`} className="fill-white/75" />
            <g clipPath="url(#drop-lens)">
              <rect x={lx - LENS} y={ly - LENS} width={LENS * 2} height={LENS * 2} className="fill-black" />
              {CH.map((ch, k) => (
                <rect
                  key={k}
                  x={lx - LENS * 0.62 + k * LENS * 0.44}
                  y={ly - LENS * 0.72}
                  width={LENS * 0.36}
                  height={LENS * 1.44}
                  rx={LENS * 0.12}
                  strokeWidth={0.6}
                  className="stroke-white/15"
                  style={{ fill: ch.tint(c[k]), filter: c[k] > 30 ? `drop-shadow(0 0 2px ${ch.tint(c[k])})` : undefined }}
                />
              ))}
            </g>
            <circle cx={lx} cy={ly} r={LENS} strokeWidth={1.4} className="fill-none stroke-white/80" />
            <path
              d={`M${lx - LENS * 0.62} ${ly - LENS * 0.5}A${LENS * 0.8} ${LENS * 0.8} 0 0 1 ${lx - LENS * 0.1} ${ly - LENS * 0.8}`}
              strokeWidth={1.6}
              strokeLinecap="round"
              className="fill-none stroke-white/45"
            />
          </svg>
        </div>
      </div>
      <div className="min-h-7 text-center text-[0.95rem]">{lampsSay(c)}</div>
      <Ticks items={PARTS.map((p) => [PART_NAME[p], seen.includes(p)] as [string, boolean])} />
      <Task done={seen.length === PARTS.length}>
        পানির ফোঁটাটা টেনে ছবির চারটা জায়গায় নিয়ে যান: লাল শাঁস, সবুজ খোসা, কালো বিচি আর সাদা কাগজ।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · One pixel, three on/off lamps: find all 2 × 2 × 2 = 8 colours. The list
//     is indexed like the binary codebook: red is worth 4, green 2, blue 1.

const EIGHT = ["কালো", "নীল", "সবুজ", "ফিরোজা", "লাল", "ম্যাজেন্টা", "হলুদ", "সাদা"];
const full = (n: number): RGB => [n & 4 ? 255 : 0, n & 2 ? 255 : 0, n & 1 ? 255 : 0];
const recipe = (n: number) => {
  const on = CH.filter((_, k) => n & (4 >> k)).map((ch) => ch.name);
  return on.length ? on.join(" + ") : "সব off";
};

export function EightColors() {
  const pass = useGate();
  const [n, setN] = useState(0);
  const [found, setFound] = useState<number[]>([0]);
  const c = full(n);

  const flip = (k: number) => {
    const v = n ^ (4 >> k);
    setN(v);
    if (found.includes(v)) return;
    const f = [...found, v];
    setFound(f);
    if (f.length === EIGHT.length) pass("৮টা রঙ! তিনটা lamp, প্রতিটা on বা off: ২ × ২ × ২ = ৮।");
  };

  return (
    <>
      <div className="mx-auto my-5 grid w-full max-w-sm grid-cols-2 gap-4 rounded-2xl bg-[#0b1226] p-4 ring-4 ring-[#334155]">
        <div className="text-center">
          <div className="mb-2 text-xs text-white/60">কাছ থেকে</div>
          <Triad c={c} className="mx-auto h-24 w-20" />
        </div>
        <div className="text-center">
          <div className="mb-2 text-xs text-white/60">দূর থেকে</div>
          <div
            role="img"
            aria-label={EIGHT[n]}
            className="mx-auto size-24 rounded-xl transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none"
            style={{ background: css(c), boxShadow: n ? `0 0 28px ${css(c)}` : "none" }}
          />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        {CH.map((ch, k) => {
          const on = (n & (4 >> k)) !== 0;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => flip(k)}
              className={`h-11 min-w-24 cursor-pointer rounded-full border-2 px-4 font-semibold transition-colors ${
                on ? `${ch.chip} border-transparent text-white` : "border-border hover:border-foreground/40"
              }`}
            >
              {ch.name} {on ? "on" : "off"}
            </button>
          );
        })}
      </div>
      <div className="mt-5 text-sm font-medium text-muted">
        রঙের লিস্ট · {bn(found.length)}/{bn(EIGHT.length)}টা পাওয়া গেছে
      </div>
      <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {EIGHT.map((name, v) => {
          const got = found.includes(v);
          return (
            <li
              key={v}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-[0.93rem] transition-colors duration-300 ${
                !got ? "border-dashed border-border text-muted" : v === n ? "border-foreground/50 bg-foreground/5" : "border-border"
              }`}
            >
              {got ? (
                <>
                  <i className={`${POP} inline-block size-5 shrink-0 rounded-full ring-1 ring-foreground/20`} style={{ background: css(full(v)) }} />
                  <b className="font-semibold">{name}</b>
                  <span className="ml-auto shrink-0 text-xs text-muted">{recipe(v)}</span>
                </>
              ) : (
                <span>? এখনো পাওয়া যায়নি</span>
              )}
            </li>
          );
        })}
      </ol>
      <Task done={found.length === EIGHT.length}>
        Lamp-গুলো on-off করে সবগুলো আলাদা রঙ খুঁজে বের করুন ({bn(found.length)}/{bn(EIGHT.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Not just on/off: each lamp is a number from 0 to 255. Dial two real colours.

const TARGETS: { name: string; c: RGB }[] = [
  { name: "পাকা আম", c: [255, 176, 0] },
  { name: "বেগুন", c: [104, 36, 140] },
];
/** how far each slider may be from the target and still count as a match */
const CLOSE = 28;
const SLIDER = ["accent-[#dc2626]", "accent-[#16a34a]", "accent-[#2563eb]"];

export function MatchColor() {
  const pass = useGate();
  const [c, setC] = useState<RGB>([0, 0, 0]);
  const [k, setK] = useState(0);
  const [touched, setTouched] = useState(false);
  const target: (typeof TARGETS)[number] | undefined = TARGETS[k];
  const shown = TARGETS[Math.min(k, TARGETS.length - 1)];

  const set = (j: number, v: number) => {
    const next = c.map((old, m) => (m === j ? v : old)) as RGB;
    setC(next);
    setTouched(true);
    if (target && next.every((x, m) => Math.abs(x - target.c[m]) <= CLOSE)) {
      setK(k + 1);
      if (k + 1 === TARGETS.length) pass("শুধু তিনটা সংখ্যা বদলে আমের রঙ, বেগুনের রঙ। কোনো রঙের বাক্স লাগলো না।");
    }
  };
  // the slider furthest from the target, as a nudge
  const off = target ? [0, 1, 2].reduce((a, m) => (Math.abs(target.c[m] - c[m]) > Math.abs(target.c[a] - c[a]) ? m : a), 0) : 0;
  const more = target ? target.c[off] > c[off] : false;

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2">
        {TARGETS.map((t, i) => (
          <span
            key={t.name}
            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors duration-300 ${
              i < k ? "border-accent bg-accent/10 text-accent-text" : i === k ? "border-foreground" : "border-border text-muted"
            }`}
          >
            {i < k ? "✓" : <i className="inline-block size-3.5 rounded-full" style={{ background: css(t.c) }} />}
            {t.name}
          </span>
        ))}
      </div>
      <div className="mx-auto my-5 grid max-w-sm grid-cols-2 gap-4">
        <div className="text-center">
          <div className="mb-1.5 text-sm font-medium text-muted">{target ? `এই রঙটা বানান: ${shown.name}` : "দুইটাই মিলে গেছে"}</div>
          <div key={k} className={`${FADE} aspect-[4/3] rounded-xl ring-1 ring-foreground/15`} style={{ background: css(shown.c) }} />
        </div>
        <div className="text-center">
          <div className="mb-1.5 text-sm font-medium text-muted">আপনার রঙ</div>
          <div className="aspect-[4/3] rounded-xl ring-1 ring-foreground/15" style={{ background: css(c) }} />
          <div className="mt-1 font-mono text-sm">{trip(c)}</div>
        </div>
      </div>
      <div className="mx-auto grid max-w-sm gap-2">
        {CH.map((ch, j) => (
          <label key={j} className="flex items-center gap-3">
            <span className={`w-14 shrink-0 rounded-full py-0.5 text-center text-sm font-semibold text-white ${ch.chip}`}>{ch.name}</span>
            <input
              type="range"
              min={0}
              max={255}
              value={c[j]}
              aria-label={ch.name}
              onChange={(e) => set(j, Number(e.target.value))}
              className={`h-6 min-w-0 flex-1 cursor-pointer ${SLIDER[j]}`}
            />
            <span className="w-9 shrink-0 text-right font-mono text-sm">{c[j]}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 min-h-6 text-center text-[0.95rem] text-muted">
        {touched && target ? `${CH[off].name} আরেকটু ${more ? "বাড়ান" : "কমান"}` : null}
      </div>
      <Task done={k >= TARGETS.length}>
        তিনটা slider টেনে দুইটা রঙই বানিয়ে ফেলুন ({bn(Math.min(k, TARGETS.length))}/{bn(TARGETS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Rafi's three sheets came without labels. Which one keeps the red count?
//     Each is a plain grey picture of one colour's numbers.

/** The order Rafi handed the sheets over in: green, blue, red. */
const HANDED = [1, 2, 0];
const SHEET_NAME = ["ক", "খ", "গ"];
const ASK = [0, 1];
const ASK_SAY = ["লালের হিসাব কোন পাতায়?", "এবার সবুজেরটা কোনটা?"];
const ASK_HINT = [
  "লালের পাতায় যে ঘরে লাল যত বেশি, সেই ঘর তত সাদা। তরমুজের লাল শাঁস কোন পাতায় উজ্জ্বল?",
  "এবার খোসাটা দেখুন। সবুজ খোসা কোন পাতায় উজ্জ্বল?",
];

export function WhichSheet() {
  const pass = useGate();
  const [q, setQ] = useState(0);
  const [miss, setMiss] = useState(0);
  const done = q >= ASK.length;
  const named = done ? [0, 1, 2] : ASK.slice(0, q);

  const tap = (ch: number) => {
    if (done || named.includes(ch)) return;
    if (ch === ASK[q]) {
      setQ(q + 1);
      setMiss(0);
      if (q + 1 === ASK.length) pass("তিনটা পাতাই আলাদা আলাদা সাদাকালো ছবি। প্রতিটা শুধু একটা রঙের হিসাব রাখে।");
    } else setMiss((m) => m + 1);
  };

  return (
    <>
      <div className="mx-auto mt-5 w-28">
        <Sheet who="আপনার ছবি" label="your watermelon, in colour">
          <Cells fill={(i) => css(MELON[i])} />
        </Sheet>
      </div>
      <div className="mt-4 text-center font-semibold">{done ? "তিনটাই চেনা গেল!" : ASK_SAY[q]}</div>
      <div className="mx-auto mt-3 grid max-w-md grid-cols-3 gap-2 sm:gap-3">
        {HANDED.map((ch, p) => {
          const known = named.includes(ch);
          return (
            <button
              key={ch}
              type="button"
              disabled={done || known}
              onClick={() => tap(ch)}
              aria-label={known ? `${CH[ch].name}-এর পাতা` : `পাতা ${SHEET_NAME[p]}`}
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl p-1 transition-transform hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0"
            >
              <span className="block w-full overflow-hidden rounded-md shadow-md ring-1 ring-foreground/15">
                <svg viewBox={`0 0 ${SIDE} ${SIDE}`} aria-hidden="true" className="block h-auto w-full">
                  <Cells fill={(i) => grey(MELON[i][ch])} />
                  <Lines />
                </svg>
              </span>
              {known ? (
                <span className={`${POP} rounded-full px-2.5 py-0.5 text-sm font-semibold text-white ${CH[ch].chip}`}>{CH[ch].name}</span>
              ) : (
                <span className="rounded-full border border-border px-2.5 py-0.5 text-sm">পাতা {SHEET_NAME[p]}</span>
              )}
            </button>
          );
        })}
      </div>
      {miss > 0 && !done && <Nope key={miss}>উঁহু। {ASK_HINT[q]}</Nope>}
      <Task done={done}>
        লাল আর সবুজের পাতা দুইটা খুঁজে বের করুন ({bn(Math.min(q, ASK.length))}/{bn(ASK.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Stack the three sheets. Their light adds up into the colour picture.

export function StackSheets() {
  const pass = useGate();
  const go = usePlay(900);
  const phase = go.k; // 0 apart · 1 stacked · 2 face-on
  const [at, setAt] = useState<number | null>(null);

  const pick = (i: number) => {
    setAt(i);
    pass("তিনটা সাদাকালো পাতা, একটার ওপর আরেকটা। তাতেই রঙিন ছবি।");
  };

  return (
    <>
      <div className="my-5">
        <Stack phase={phase} at={at} onCell={pick} />
      </div>
      {phase === 0 && !go.running && (
        <div className="flex justify-center">
          <button type="button" onClick={() => go.play(2, undefined, 1)} className={primaryBtn}>
            পাতা তিনটা একটার ওপর আরেকটা বসান
          </button>
        </div>
      )}
      {phase === 2 &&
        (at === null ? (
          <div className={`${FADE} text-center text-sm text-muted delay-500`}>এবার ছবির যেকোনো ঘরে tap করুন</div>
        ) : (
          <div key={at} className={FADE}>
            <div className="mb-2 text-center text-sm text-muted">এই ঘরে তিনটা পাতা থেকে তিনটা সংখ্যা:</div>
            <Sum c={MELON[at]} />
          </div>
        ))}
      <Ticks
        items={[
          ["পাতা তিনটা বসানো", phase === 2],
          ["একটা ঘরের তিনটা সংখ্যা", at !== null],
        ]}
      />
      <Task done={at !== null}>পাতাগুলো বসিয়ে, তারপর ছবির যেকোনো একটা ঘরে tap করে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Predict, then watch: pull the red sheet out. The white paper turns
//     turquoise (green + blue), and the red flesh goes nearly black.

const PULL = ["সাদাই থাকবে", "কালো হয়ে যাবে", "ফিরোজা হয়ে যাবে", "লাল হয়ে যাবে"];
const PULL_RIGHT = 2;
/** a cell of plain paper, top left */
const PAPER_CELL = 0;

export function PullSheet() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const [use, setUse] = useState(ON3);
  const show = usePlay(1000);
  const over = guess !== null && show.k === 1;
  const seen = (c: RGB) => c.map((v, k) => (use[k] ? v : 0)) as RGB;

  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    setUse([false, true, true]);
    show.play(1, () =>
      pass(
        i === PULL_RIGHT
          ? "ঠিক ধরেছেন! কাগজে থাকলো শুধু সবুজ আর নীল আলো, মিলে ফিরোজা।"
          : "কাগজে থাকলো শুধু সবুজ আর নীল আলো, মিলে ফিরোজা।",
      ),
    );
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {CH.map((ch, k) =>
          over ? (
            <button
              key={k}
              type="button"
              aria-pressed={use[k]}
              onClick={() => setUse((u) => u.map((s, j) => (j === k ? !s : s)))}
              className={`cursor-pointer rounded-full border-2 px-3.5 py-1 text-sm font-semibold transition-colors ${
                use[k] ? `${ch.chip} border-transparent text-white` : "border-dashed border-border text-muted"
              }`}
            >
              {ch.name} পাতা {use[k] ? "আছে" : "নাই"}
            </button>
          ) : (
            <span
              key={k}
              className={`rounded-full border-2 px-3.5 py-1 text-sm font-semibold transition-all duration-700 motion-reduce:transition-none ${
                use[k] ? `${ch.chip} border-transparent text-white` : "translate-y-2 border-dashed border-border text-muted line-through opacity-60"
              }`}
            >
              {ch.name} পাতা
            </span>
          ),
        )}
      </div>
      <div className="mx-auto my-4 w-full max-w-[15rem]">
        <Sheet label="the watermelon, built from the sheets that are left">
          <Cells fill={(i) => css(seen(MELON[i]))} className="transition-[fill] duration-700 motion-reduce:transition-none" />
          <Lines />
        </Sheet>
      </div>
      <div className="mb-4">
        <div className="mb-1.5 text-center text-sm text-muted">কাগজের একটা ঘর:</div>
        <Sum c={seen(MELON[PAPER_CELL])} />
      </div>
      <div className="text-sm font-medium text-muted">লাল পাতাটা সরিয়ে নিলে সাদা কাগজটা কী রঙ দেখাবে?</div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {PULL.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, PULL_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {over && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          লাল শাঁসটা প্রায় কালো হয়ে গেল, খেয়াল করেছেন? এবার উপরে নিজে পাতা সরিয়ে-বসিয়ে দেখুন।
        </div>
      )}
      <Task done={over}>আগে guess করুন। তারপর লাল পাতাটা সরিয়ে মিলিয়ে দেখা হবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The other way round: Rafi sends three numbers, you name the colour.

const ROUNDS: { say: RGB; options: RGB[]; right: number }[] = [
  {
    say: [255, 255, 0],
    options: [
      [255, 140, 0],
      [255, 255, 0],
      [0, 200, 60],
      [255, 255, 255],
    ],
    right: 1,
  },
  {
    say: [0, 255, 255],
    options: [
      [0, 90, 255],
      [0, 210, 90],
      [0, 255, 255],
      [240, 240, 240],
    ],
    right: 2,
  },
  {
    say: [255, 128, 0],
    options: [
      [255, 128, 0],
      [255, 230, 0],
      [220, 0, 0],
      [255, 140, 200],
    ],
    right: 0,
  },
];

export function GuessColor() {
  const pass = useGate();
  const [r, setR] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const round: (typeof ROUNDS)[number] | undefined = ROUNDS[r];

  const choose = (i: number) => {
    if (!round) return;
    if (i === round.right) {
      setR(r + 1);
      setWrong([]);
      if (r + 1 === ROUNDS.length) pass("শুধু তিনটা সংখ্যা দেখেই রঙ চিনে ফেলছেন!");
    } else setWrong((w) => [...w, i]);
  };

  return (
    <>
      <div className="my-4 flex flex-wrap justify-center gap-2">
        {ROUNDS.map((x, k) => (
          <span
            key={k}
            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 font-mono text-sm transition-colors duration-300 ${
              k < r ? "border-accent bg-accent/10 text-accent-text" : k === r ? "border-foreground" : "border-border text-muted"
            }`}
          >
            {k < r && <i className="inline-block size-3.5 rounded-full ring-1 ring-foreground/20" style={{ background: css(x.say) }} />}
            {trip(x.say)}
          </span>
        ))}
      </div>
      {round ? (
        <>
          <Rafi key={r}>“{trip(round.say)}” — এই ঘরটা কোন রঙের, বল তো?</Rafi>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {round.options.map((o, i) => {
              const bad = wrong.includes(i);
              return (
                <button
                  key={`${r}-${i}`}
                  type="button"
                  disabled={bad}
                  onClick={() => choose(i)}
                  aria-label={`রঙ ${String.fromCharCode(65 + i)}`}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-2.5 transition-[border-color,opacity] duration-200 disabled:cursor-default ${
                    bad ? LOOK.wrong : LOOK.idle
                  }`}
                >
                  <i className="block h-14 w-full rounded-lg ring-1 ring-foreground/15" style={{ background: css(o) }} />
                  <span className="text-sm font-semibold">{bad ? "✕" : String.fromCharCode(65 + i)}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <Rafi tone="good">তিনটাই ঠিক! তুই তো দেখি সংখ্যা দেখেই রঙ দেখতে পাস।</Rafi>
      )}
      <Task done={!round}>
        রাফির পাঠানো সংখ্যা দেখে ঠিক রঙটা বেছে নিন ({bn(Math.min(r, ROUNDS.length))}/{bn(ROUNDS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · Find the greys. Each one turns out to be three equal numbers — the
//      grey pictures of 1.1 were colour pictures all along.

const HUNT: RGB[] = [
  [200, 60, 60],
  [40, 40, 40],
  [60, 160, 90],
  [128, 128, 128],
  [250, 210, 80],
  [210, 210, 210],
  [90, 110, 230],
  [180, 90, 200],
];
const isGrey = ([r, g, b]: RGB) => r === g && g === b;
const GREYS = HUNT.filter(isGrey).length;

export function GreyHunt() {
  const pass = useGate();
  const [tapped, setTapped] = useState<number[]>([]);
  const found = tapped.filter((i) => isGrey(HUNT[i])).length;

  const tap = (i: number) => {
    if (tapped.includes(i)) return;
    const t = [...tapped, i];
    setTapped(t);
    if (t.filter((j) => isGrey(HUNT[j])).length === GREYS) pass("ধূসর মানে লাল, সবুজ, নীল তিনটা সংখ্যাই সমান।");
  };

  return (
    <>
      <div className="my-5 grid grid-cols-4 gap-2 sm:gap-3">
        {HUNT.map((c, i) => {
          const t = tapped.includes(i);
          const g = isGrey(c);
          return (
            <button
              key={i}
              type="button"
              disabled={t}
              onClick={() => tap(i)}
              aria-label={`রঙ ${bn(i + 1)}`}
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-1.5 transition-colors duration-200 disabled:cursor-default ${
                !t ? "border-border hover:border-cat-blue/60" : g ? "win-pop border-accent bg-accent/10" : "nudge border-danger/50 bg-danger/5"
              }`}
            >
              <i className="block aspect-square w-full rounded-lg ring-1 ring-foreground/15" style={{ background: css(c) }} />
              <span className={`min-h-4 font-mono text-[0.65rem] leading-tight sm:text-xs ${g ? "text-accent-text" : "text-danger"}`}>
                {t ? c.join(" ") : ""}
              </span>
            </button>
          );
        })}
      </div>
      {found === GREYS && (
        <div className={`${FADE} text-center text-[0.95rem]`}>
          খেয়াল করেছেন? প্রতিটা ধূসরে <b>লাল = সবুজ = নীল</b>।
        </div>
      )}
      <Task done={found === GREYS}>
        ধূসর রঙগুলো সবগুলো খুঁজে tap করুন ({bn(found)}/{bn(GREYS)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11 · Last picture: the three sheets fly together into the colour watermelon.

function FinaleReel({ onReplay }: { onReplay: () => void }) {
  const k = useCountUp(3, 1300); // 0 apart · 1 stacked · 2 face-on · 3 the count
  return (
    <>
      <div className="my-5">
        <Stack phase={Math.min(k, 2)} />
      </div>
      <div className="min-h-24 text-center">
        {k === 3 && (
          <div className={FADE}>
            <div className="font-mono text-2xl font-bold">১২ × ১২ × ৩ = ৪৩২</div>
            <div className="text-muted">তিনটা পাতা, একটা রঙিন তরমুজ</div>
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
