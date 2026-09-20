"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { bn } from "./figure-kit";

// Screens for "Math for AI 1.5 — গ্রাফ পেপার", told as a Journey.
//
// Same story as the old three-figure version (grid-figures.tsx): an empty room,
// a robot that only understands (direction, number of tiles), a ball — then the
// room is taken away and only the two numbers are left, on paper. Here every
// beat is its own screen with one visual and one thing to do, and each screen
// locks the Continue arrow (useGate) until the reader has done it.
//
// Styling is Tailwind only, on the site's theme tokens, so the room follows
// light/dark. The graph paper is a real white sheet in both themes on purpose —
// the switch from room to paper is the point — so ink on it is fixed, not a
// token. SVG/DOM rather than canvas, so the Bangla labels shape correctly.

// ---------------------------------------------------------------------------
// The room, in tiles. You stand at (0, 0); the ball sits in the top-right
// corner, 10 right and 12 up — so the floor is exactly 21 × 25 tiles.

type Cell = [number, number];
type Dir = "R" | "L" | "U" | "D";

const CX = 10;
const CY = 12;
const COLS = 2 * CX + 1;
const ROWS = 2 * CY + 1;
const T = 14; // tile side, in viewBox units
const PAD = 4;
const VW = COLS * T + 2 * PAD;
const VH = ROWS * T + 2 * PAD;
const BALL: Cell = [CX, CY];
const ORIGIN: Cell = [0, 0];

/** left edge of column x (x grows rightwards from you) */
const px = (x: number) => PAD + (x + CX) * T;
/** top edge of row y (y grows upwards — screen y falls) */
const py = (y: number) => PAD + (CY - y) * T;
const mx = (x: number) => px(x) + T / 2;
const my = (y: number) => py(y) + T / 2;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const inRoom = ([x, y]: Cell) => x >= -CX && x <= CX && y >= -CY && y <= CY;
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];
const near = (a: Cell, b: Cell, r = 1) => Math.abs(a[0] - b[0]) <= r && Math.abs(a[1] - b[1]) <= r;

/** A machine number, with a real minus sign. */
const sg = (n: number) => (n < 0 ? `−${-n}` : `${n}`);
const addr = ([x, y]: Cell) => `(${sg(x)}, ${sg(y)})`;

const STEP: Record<Dir, Cell> = { R: [1, 0], L: [-1, 0], U: [0, 1], D: [0, -1] };
const KEY_DIR: Record<string, Dir> = { ArrowRight: "R", ArrowLeft: "L", ArrowUp: "U", ArrowDown: "D" };

/**
 * Every tile Shiku stands on, in order, stopping dead at a wall — and which
 * wall, if he met one.
 */
function walk(...legs: [Dir, number][]): { cells: Cell[]; walled: Dir | null } {
  const cells: Cell[] = [ORIGIN];
  let at = ORIGIN;
  for (const [dir, n] of legs) {
    const [dx, dy] = STEP[dir];
    for (let i = 0; i < n; i++) {
      const next: Cell = [at[0] + dx, at[1] + dy];
      if (!inRoom(next)) return { cells, walled: dir };
      at = next;
      cells.push(at);
    }
  }
  return { cells, walled: null };
}

/** The L-shaped count to a tile: all the way across, then all the way up. */
const route = ([x, y]: Cell) => walk([x < 0 ? "L" : "R", Math.abs(x)], [y < 0 ? "D" : "U", Math.abs(y)]).cells;

/**
 * Play a path one tile per tick. `start(path, done)` restarts it; `done` fires
 * on the last tile (from the timer, never from render).
 */
function useWalk(ms: number, init: Cell[] = [ORIGIN]) {
  const [path, setPath] = useState<Cell[]>(init);
  const [i, setI] = useState(init.length - 1);
  const onDone = useRef<(() => void) | null>(null);
  const running = i < path.length - 1;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      setI(i + 1);
      if (i + 1 === path.length - 1) onDone.current?.();
    }, ms);
    return () => clearTimeout(t);
  }, [running, i, path, ms]);

  const start = (p: Cell[], done?: () => void) => {
    setPath(p);
    setI(0);
    onDone.current = done ?? null;
    if (p.length <= 1) done?.();
  };

  return { running, here: path[Math.min(i, path.length - 1)], walked: path.slice(1, i + 1), start };
}

/** Which tile a pointer landed on. The SVG scales, so go through its own box. */
function tileAt(svg: SVGSVGElement, e: { clientX: number; clientY: number }): Cell {
  const r = svg.getBoundingClientRect();
  const ux = ((e.clientX - r.left) / r.width) * VW;
  const uy = ((e.clientY - r.top) / r.height) * VH;
  const x = Math.floor((ux - PAD) / T) - CX;
  const y = CY - Math.floor((uy - PAD) / T);
  return [clamp(x, -CX, CX), clamp(y, -CY, CY)];
}

// ---------------------------------------------------------------------------
// Motion vocabulary. Entrances use @starting-style (Tailwind `starting:`), so an
// element animates in simply by being mounted — and every screen mounts fresh.

/** pop in from nothing, with a little overshoot */
const POP =
  "origin-center [transform-box:fill-box] transition-[scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none starting:scale-0 starting:opacity-0";
/** fixed ink for the white sheet, in either theme */
const INK = "fill-[#0f1b2d]";
const PEN_OK = "fill-[#0d9488]";
const PEN_BAD = "fill-[#e11d48]";

/** A line that draws itself from its start when mounted. */
function Draw({
  d,
  delay = 0,
  ms = 700,
  strokeWidth = 1.5,
  className = "",
}: {
  d: string;
  delay?: number;
  ms?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <path
      d={d}
      pathLength={1}
      strokeDasharray="1 2"
      strokeWidth={strokeWidth}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: `${ms}ms` }}
      className={`pointer-events-none fill-none [stroke-dashoffset:0] transition-[stroke-dashoffset] ease-out motion-reduce:transition-none starting:[stroke-dashoffset:1] ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// The stage and the cast.

let grid = "";
for (let c = 0; c <= COLS; c++) grid += `M${PAD + c * T} ${PAD}v${ROWS * T}`;
for (let r = 0; r <= ROWS; r++) grid += `M${PAD} ${PAD + r * T}h${COLS * T}`;
const GRID = grid;

function Floor({ paper }: { paper: boolean }) {
  const box = { x: PAD, y: PAD, width: COLS * T, height: ROWS * T };
  return paper ? (
    <>
      <rect {...box} rx={2} strokeWidth={0.8} className="fill-white stroke-foreground/15" />
      <path d={GRID} strokeWidth={0.6} className="fill-none stroke-cat-blue/25" />
    </>
  ) : (
    <>
      <rect {...box} className="fill-cat-violet/[0.07]" />
      <path d={GRID} strokeWidth={0.6} className="fill-none stroke-foreground/10" />
      {/* the walls */}
      <rect {...box} rx={2} strokeWidth={2.5} className="fill-none stroke-foreground/40" />
    </>
  );
}

function Board({
  label,
  paper = false,
  floor = true,
  onTile,
  onHover,
  onKeyDown,
  children,
}: {
  label: string;
  paper?: boolean;
  floor?: boolean;
  onTile?: (c: Cell) => void;
  onHover?: (c: Cell | null) => void;
  onKeyDown?: (e: ReactKeyboardEvent<SVGSVGElement>) => void;
  children?: ReactNode;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const cell = (e: { clientX: number; clientY: number }) => (ref.current ? tileAt(ref.current, e) : null);
  return (
    <div className="mx-auto my-5 w-full max-w-[22rem]">
      <svg
        ref={ref}
        viewBox={`0 0 ${VW} ${VH}`}
        role={onKeyDown ? "application" : "group"}
        aria-label={label}
        tabIndex={onKeyDown ? 0 : undefined}
        className={`block h-auto w-full touch-manipulation overflow-visible select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
          onTile ? "cursor-crosshair" : ""
        }`}
        onPointerDown={
          onTile
            ? (e) => {
                const c = cell(e);
                if (c) onTile(c);
              }
            : undefined
        }
        onPointerMove={onHover ? (e) => onHover(cell(e)) : undefined}
        onPointerLeave={onHover ? () => onHover(null) : undefined}
        onKeyDown={onKeyDown}
      >
        {floor && <Floor paper={paper} />}
        {children}
      </svg>
    </div>
  );
}

/** You, seen from above, standing in the middle of the room. */
function You({ className = "" }: { className?: string }) {
  return (
    <g className={`${POP} ${className}`}>
      <circle cx={mx(0)} cy={my(0)} r={T * 0.58} strokeWidth={1.5} className="fill-cat-teal/20 stroke-cat-teal" />
      <circle cx={mx(0)} cy={my(0)} r={T * 0.2} className="fill-cat-teal" />
      <text x={mx(0)} y={my(0) + T * 1.4} textAnchor="middle" className="fill-cat-teal text-[8px] font-semibold">
        আপনি
      </text>
    </g>
  );
}

/**
 * Shiku. Positioned by a style transform so the CSS transition does the
 * in-between frames — the walk only says which tile. `shake` re-mounts the
 * inner group, replaying the site's `nudge` (a bump into a wall, a "huh?").
 */
function Bot({
  at = ORIGIN,
  shake = 0,
  name = true,
  className = "",
}: {
  at?: Cell;
  shake?: number;
  name?: boolean;
  className?: string;
}) {
  return (
    <g
      style={{ transform: `translate(${mx(at[0])}px, ${my(at[1])}px)` }}
      className="transition-transform duration-100 ease-linear motion-reduce:transition-none"
    >
      <g className={`${POP} ${className}`}>
        <g key={shake} className={shake ? "nudge" : undefined}>
          <BotShape />
          {name && (
            <text y={-T * 0.85} textAnchor="middle" className="fill-cat-violet font-mono text-[7px] font-semibold">
              Shiku
            </text>
          )}
        </g>
      </g>
    </g>
  );
}

function BotShape() {
  return (
    <>
      <path d={`M0 ${-T * 0.3}V${-T * 0.52}`} strokeWidth={1} className="stroke-cat-violet" />
      <circle cy={-T * 0.56} r={1.4} className="fill-cat-violet" />
      <rect x={-T * 0.32} y={-T * 0.3} width={T * 0.64} height={T * 0.6} rx={2.5} className="fill-cat-violet" />
      <circle cx={-2.1} cy={-0.6} r={1.1} className="fill-white" />
      <circle cx={2.1} cy={-0.6} r={1.1} className="fill-white" />
    </>
  );
}

function Ball({ at, ping = false, className = "" }: { at: Cell; ping?: boolean; className?: string }) {
  return (
    <g
      style={{ transform: `translate(${mx(at[0])}px, ${my(at[1])}px)` }}
      className="transition-transform duration-200 ease-out motion-reduce:transition-none"
    >
      <g className={`${POP} ${className}`}>
        {ping && (
          <circle
            r={T * 0.4}
            strokeWidth={1.5}
            className="origin-center animate-ping fill-none stroke-cat-amber [transform-box:fill-box]"
          />
        )}
        <circle r={T * 0.36} strokeWidth={0.8} className="fill-cat-amber stroke-foreground/30" />
        <path d={`M${-T * 0.36} 0Q0 ${-T * 0.28} ${T * 0.36} 0`} strokeWidth={0.7} className="fill-none stroke-foreground/30" />
      </g>
    </g>
  );
}

/** The wall Shiku just walked into, lit up. */
function Wall({ side }: { side: Dir }) {
  const l = px(-CX);
  const r = px(CX) + T;
  const t = py(CY);
  const b = py(-CY) + T;
  const d = { R: `M${r} ${t}V${b}`, L: `M${l} ${t}V${b}`, U: `M${l} ${t}H${r}`, D: `M${l} ${b}H${r}` }[side];
  return <path d={d} strokeWidth={3.5} strokeLinecap="round" className="animate-pulse fill-none stroke-danger" />;
}

/** Tiles already walked. */
function Trail({ cells, className = "fill-cat-violet/30" }: { cells: Cell[]; className?: string }) {
  return (
    <>
      {cells.map(([x, y]) => (
        <rect key={`${x},${y}`} x={px(x) + 1.5} y={py(y) + 1.5} width={T - 3} height={T - 3} rx={1.5} className={className} />
      ))}
    </>
  );
}

/** Shiku talking back, as a chat bubble under the stage. */
function Say({ tone = "plain", children }: { tone?: "plain" | "good" | "bad"; children: ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2.5 transition duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
      <svg viewBox="-9 -10 18 18" className="size-8 shrink-0 rounded-lg bg-cat-violet/10" aria-hidden="true">
        <BotShape />
      </svg>
      <div
        className={`rounded-2xl rounded-tl-sm px-3.5 py-2 text-[0.95rem] leading-snug ${
          tone === "good" ? "bg-accent/10 text-accent-text" : tone === "bad" ? "bg-danger/10 text-danger" : "bg-cat-violet/10"
        }`}
      >
        <b className="font-semibold">Shiku:</b> {children}
      </div>
    </div>
  );
}

/** A "not quite" line under the stage; key it so it re-animates per miss. */
function Nope({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 text-[0.95rem] text-danger transition duration-300 motion-reduce:transition-none starting:-translate-y-1 starting:opacity-0">
      {children}
    </div>
  );
}

const choiceBtn =
  "flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default";

// ---------------------------------------------------------------------------
// 1 · Where are you? (And, on paper later: where does the pencil dot go?)

/** "বাঁয়ে আর ওপরে" — which way to go from a missed tap back to the middle. */
function towardMiddle([x, y]: Cell) {
  return [x > 1 ? "বাঁয়ে" : x < -1 ? "ডানে" : "", y > 1 ? "নিচে" : y < -1 ? "ওপরে" : ""].filter(Boolean).join(" আর ");
}

export function FindMiddle({ paper = false }: { paper?: boolean }) {
  const pass = useGate();
  const [found, setFound] = useState(false);
  const [miss, setMiss] = useState<{ at: Cell; n: number } | null>(null);

  const tap = (c: Cell) => {
    if (near(c, ORIGIN)) {
      setFound(true);
      pass("আপনি room-এর একদম মাঝখানে।");
    } else setMiss((m) => ({ at: c, n: (m?.n ?? 0) + 1 }));
  };

  return (
    <>
      <Board
        paper={paper}
        label={paper ? "a blank sheet of graph paper" : "an empty tiled apartment, seen from above"}
        onTile={found ? undefined : tap}
      >
        {miss && !found && (
          <circle
            key={miss.n}
            cx={mx(miss.at[0])}
            cy={my(miss.at[1])}
            r={T * 0.45}
            className="fill-danger opacity-0 transition-opacity duration-1000 starting:opacity-60"
          />
        )}
        {found &&
          (paper ? (
            <g className={POP}>
              <circle cx={mx(0)} cy={my(0)} r={T * 0.6} className="animate-ping fill-none stroke-[#0f1b2d] origin-center [transform-box:fill-box]" />
              <circle cx={mx(0)} cy={my(0)} r={3} className={INK} />
            </g>
          ) : (
            <You />
          ))}
      </Board>
      <Task done={found}>
        {paper
          ? "Pencil দিয়ে কাগজের ঠিক মাঝখানে একটা dot দিন — tap করুন।"
          : "আপনি কোথায় দাঁড়িয়ে আছেন? Room-এর ঠিক মাঝখানের tile-এ tap করুন।"}
      </Task>
      {miss && !found && <Nope key={miss.n}>উঁহু — আরেকটু {towardMiddle(miss.at)}।</Nope>}
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Meet Shiku, and spot the ball.

export function MeetShiku() {
  const pass = useGate();
  const [found, setFound] = useState(false);
  const [miss, setMiss] = useState(0);

  const tap = (c: Cell) => {
    if (near(c, BALL, 2)) {
      setFound(true);
      pass("Ball-টা room-এর top-right কোণায়।");
    } else setMiss((m) => m + 1);
  };

  return (
    <>
      <Board label="you and Shiku in the middle of the room; a ball somewhere" onTile={found ? undefined : tap}>
        <You />
        <Bot className="delay-500" />
        <Ball at={BALL} ping={!found} className="delay-1000" />
      </Board>
      <Task done={found}>Ball-টা কোথায় পড়ে আছে? ওটার ওপর tap করুন।</Task>
      {miss > 0 && !found && <Nope key={miss}>ওখানে তো শুধু খালি tile। কোণাগুলোতে খুঁজে দেখুন।</Nope>}
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Drive him yourself. The diagonal buttons are there to be pressed and
//     refused — the constraint is felt, not just read.

const PAD_KEYS: (Dir | "diag" | null)[] = ["diag", "U", "diag", "L", null, "R", "diag", "D", "diag"];
const ARROW: Record<Dir, string> = { R: "→", L: "←", U: "↑", D: "↓" };
const ARROW_NAME: Record<Dir, string> = { R: "ডানে", L: "বাঁয়ে", U: "উপরে", D: "নিচে" };
const DIAG: Record<number, string> = { 0: "↖", 2: "↗", 6: "↙", 8: "↘" };
const DRIVE_GOAL = 5;

export function DrivePad() {
  const pass = useGate();
  const [at, setAt] = useState<Cell>(ORIGIN);
  const [trail, setTrail] = useState<Cell[]>([]);
  const [moves, setMoves] = useState(0);
  const [bump, setBump] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const move = (d: Dir | "diag") => {
    if (d === "diag") {
      setBump((b) => b + 1);
      setMsg("কোণাকুনি? আমি ওভাবে যেতেই পারি না — শুধু ↑ ↓ ← →।");
      return;
    }
    const next: Cell = [at[0] + STEP[d][0], at[1] + STEP[d][1]];
    if (!inRoom(next)) {
      setBump((b) => b + 1);
      setMsg("ধাম! দেয়াল। Room-এর বাইরে তো যাওয়া যায় না।");
      return;
    }
    const n = moves + 1;
    setAt(next);
    setMoves(n);
    setMsg(null);
    setTrail((t) => (t.some((c) => same(c, next)) ? t : [...t, next]));
    if (same(next, BALL)) pass("Shiku-কে নিজেই ball পর্যন্ত নিলেন।");
    else if (n === DRIVE_GOAL) pass("প্রতি চাপে এক ঘর, শুধু চারটা দিকে।");
  };

  const reset = () => {
    setAt(ORIGIN);
    setTrail([]);
    setMsg(null);
  };

  // Arrow keys drive Shiku on this screen. Captured on window before the
  // Journey's own ←/→ handler, which then sees defaultPrevented and stands down.
  const latest = useRef(move);
  useEffect(() => {
    latest.current = move;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = KEY_DIR[e.key];
      if (!d || (e.target as HTMLElement | null)?.closest?.("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      latest.current(d);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  return (
    <>
      <Board label="drive Shiku one tile at a time">
        <Trail cells={trail} className="fill-cat-violet/20" />
        <You />
        <Ball at={BALL} />
        <Bot at={at} shake={bump} />
      </Board>

      <div className="flex items-center justify-center gap-5">
        <div className="grid w-44 grid-cols-3 gap-1.5">
          {PAD_KEYS.map((k, i) =>
            k === null ? (
              <div key={i} className="grid place-items-center text-center font-mono text-xs leading-tight text-muted tabular-nums">
                {bn(moves)}
                <br />
                চাল
              </div>
            ) : k === "diag" ? (
              <button
                key={i}
                type="button"
                aria-label="কোণাকুনি"
                onClick={() => move("diag")}
                className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-border text-lg text-muted/60 transition-colors hover:border-danger/50 hover:text-danger"
              >
                {DIAG[i]}
              </button>
            ) : (
              <button
                key={i}
                type="button"
                aria-label={ARROW_NAME[k]}
                onClick={() => move(k)}
                className="grid aspect-square cursor-pointer place-items-center rounded-xl border-b-4 border-cat-violet/50 bg-cat-violet/15 text-xl font-bold text-cat-violet transition-all hover:bg-cat-violet/25 active:translate-y-0.5 active:border-b-2"
              >
                {ARROW[k]}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
        >
          ↺ শুরুর জায়গায়
        </button>
      </div>

      {msg && (
        <Say key={bump} tone="bad">
          {msg}
        </Say>
      )}
      <Task done={moves >= DRIVE_GOAL}>
        Shiku-কে নিজে চালিয়ে দেখুন — অন্তত {bn(DRIVE_GOAL)} চাল ({bn(Math.min(moves, DRIVE_GOAL))}/{bn(DRIVE_GOAL)})। Keyboard-এর
        arrow key-ও চলবে।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Tell him the way you would tell a person. Neither works.

const VAGUE = [
  {
    id: "fetch",
    say: "যাও, ball-টা নিয়ে আসো।",
    reply: "Ball? সেটা কী, কোথায়? আমি তো শুধু বুঝি — কোন দিকে (↑ ↓ ← →), আর কত ঘর।",
  },
  {
    id: "diag",
    say: "কোণাকুনি হেঁটে গিয়ে নিয়ে আসো।",
    reply: "কোণাকুনি? ওটাই shortest, মানলাম — কিন্তু ওভাবে যাওয়ার উপায়ই আমার নেই। আমি একবারে এক ঘর, শুধু ↑ ↓ ← →।",
  },
];

export function VagueOrders() {
  const pass = useGate();
  const [tried, setTried] = useState<string[]>([]);
  const [pick, setPick] = useState<string | null>(null);
  const [n, setN] = useState(0);

  const choose = (id: string) => {
    setPick(id);
    setN((k) => k + 1);
    const t = tried.includes(id) ? tried : [...tried, id];
    setTried(t);
    if (t.length === VAGUE.length) pass("বলতে হবে কোন দিকে, আর কত ঘর।");
  };
  const reply = VAGUE.find((v) => v.id === pick);

  return (
    <>
      <Board label="Shiku next to you, the ball in the far corner">
        {pick === "diag" && (
          <g key={n}>
            <Draw d={`M${mx(0)} ${my(0)}L${mx(CX)} ${my(CY)}`} strokeWidth={1.5} className="stroke-danger/70" />
            <text
              x={(mx(0) + mx(CX)) / 2}
              y={(my(0) + my(CY)) / 2 + 5}
              textAnchor="middle"
              className={`${POP} delay-700 fill-danger text-[16px] font-bold`}
            >
              ✕
            </text>
          </g>
        )}
        <You />
        <Ball at={BALL} />
        <Bot shake={n} />
        {pick === "fetch" && (
          <text key={n} x={mx(0) + 8} y={my(0) - 10} className={`${POP} fill-danger text-[14px] font-bold`}>
            ?
          </text>
        )}
      </Board>

      <div className="text-sm font-medium text-muted">Shiku-কে বলুন:</div>
      <div className="mt-2 flex flex-col gap-2">
        {VAGUE.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => choose(v.id)}
            className={`${choiceBtn} ${
              v.id === pick ? "border-cat-violet bg-cat-violet/10" : "border-border hover:border-cat-violet/60"
            }`}
          >
            <span>“{v.say}”</span>
            {tried.includes(v.id) && <span className="ml-auto text-danger">✕</span>}
          </button>
        ))}
      </div>
      {reply && (
        <Say key={n} tone="bad">
          {reply.reply}
        </Say>
      )}
      <Task done={tried.length === VAGUE.length}>
        দুইটা instruction-ই দিয়ে দেখুন ({bn(tried.length)}/{bn(VAGUE.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Build the instruction: two numbers, and he walks it out.

function Stepper({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  label: string;
}) {
  const btn =
    "grid size-8 cursor-pointer place-items-center rounded-full text-lg font-bold text-muted transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface p-0.5">
      <button type="button" aria-label={`${label} এক কম`} className={btn} disabled={disabled || value <= 0} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-8 text-center font-mono text-lg font-semibold tabular-nums">{bn(value)}</span>
      <button type="button" aria-label={`${label} এক বেশি`} className={btn} disabled={disabled || value >= 15} onClick={() => onChange(value + 1)}>
        +
      </button>
    </span>
  );
}

type Outcome = { kind: "ball" } | { kind: "wall"; side: Dir } | { kind: "short"; rest: Cell };

export function BuildOrder() {
  const pass = useGate();
  const [r, setR] = useState(3);
  const [u, setU] = useState(4);
  const [out, setOut] = useState<Outcome | null>(null);
  const [tries, setTries] = useState(0);
  const w = useWalk(70);

  const run = () => {
    const { cells, walled } = walk(["R", r], ["U", u]);
    setOut(null);
    setTries((t) => t + 1);
    w.start(cells, () => {
      const end = cells[cells.length - 1];
      if (walled) setOut({ kind: "wall", side: walled });
      else if (same(end, BALL)) {
        setOut({ kind: "ball" });
        pass("ডানে ১০ ঘর, তারপর উপরে ১২ ঘর।");
      } else setOut({ kind: "short", rest: [BALL[0] - end[0], BALL[1] - end[1]] });
    });
  };

  const rest = out?.kind === "short" ? out.rest : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-2xl bg-cat-violet/5 px-4 py-4">
        <span>ডানে</span>
        <Stepper label="ডানে" value={r} onChange={setR} disabled={w.running} />
        <span>ঘর, তারপর উপরে</span>
        <Stepper label="উপরে" value={u} onChange={setU} disabled={w.running} />
        <span>ঘর</span>
        <button
          type="button"
          onClick={run}
          disabled={w.running}
          className="ml-1 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-cat-violet px-4 font-semibold text-white transition-all hover:-translate-y-px disabled:cursor-default disabled:opacity-50 disabled:hover:translate-y-0"
        >
          ▶ চালান
        </button>
      </div>

      <Board label="Shiku walks your instruction">
        <Trail cells={w.walked} />
        {out?.kind === "wall" && <Wall side={out.side} />}
        <You />
        <Bot at={w.here} shake={out?.kind === "wall" ? tries : 0} />
        <Ball at={BALL} ping={out?.kind === "ball"} />
      </Board>

      <div className="text-center font-mono text-sm text-muted">
        Shiku হাঁটল: ডানে <b className="text-foreground">{bn(w.here[0])}</b> · উপরে{" "}
        <b className="text-foreground">{bn(w.here[1])}</b>
      </div>

      {out?.kind === "ball" && <Say tone="good">পেয়ে গেছি! 🎉</Say>}
      {out?.kind === "wall" && (
        <Say key={tries} tone="bad">
          ধাম! দেয়ালে ধাক্কা খেয়ে থেমে গেলাম। ওদিকে এতগুলো ঘর তো room-এর ভেতরে নেই।
        </Say>
      )}
      {rest && (
        <Say key={tries}>
          থামলাম। কিন্তু ball এখনো{" "}
          {[rest[0] > 0 ? `ডানে ${bn(rest[0])} ঘর` : "", rest[1] > 0 ? `উপরে ${bn(rest[1])} ঘর` : ""]
            .filter(Boolean)
            .join(" আর ")}{" "}
          দূরে।
        </Say>
      )}
      <Task done={out?.kind === "ball"}>সংখ্যা দুইটা ঠিক করে Shiku-কে ball পর্যন্ত পাঠান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Predict, then watch: the right two numbers, swapped.

const GUESSES = ["Ball-এর কাছে পৌঁছে যাবে", "দেয়ালে ধাক্কা খাবে", "Ball-এর ঠিক নিচে গিয়ে থামবে"];
const WALL_GUESS = 1;
const SWAPPED = walk(["R", 12], ["U", 10]);

export function PredictSwap() {
  const pass = useGate();
  const [guess, setGuess] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const w = useWalk(80);

  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    w.start(SWAPPED.cells, () => {
      setOver(true);
      pass(
        "সংখ্যা একই, জায়গা বদলালেই গড়বড়।");
    });
  };

  return (
    <>
      <div className="rounded-2xl bg-cat-violet/5 px-4 py-3 text-center">
        আপনি বললেন: <b className="font-semibold">“ডানে ১২ ঘর, তারপর উপরে ১০ ঘর”</b>
      </div>

      <Board label="Shiku walks right 12, then up 10">
        <Trail cells={w.walked} />
        {over && SWAPPED.walled && <Wall side={SWAPPED.walled} />}
        <You />
        <Ball at={BALL} />
        <Bot at={w.here} shake={over ? 1 : 0} />
      </Board>

      <div className="text-sm font-medium text-muted">কী হবে বলে মনে হয়?</div>
      <div className="mt-2 flex flex-col gap-2">
        {GUESSES.map((g, i) => {
          const right = over && i === WALL_GUESS;
          const wrong = over && i === guess && i !== WALL_GUESS;
          return (
            <button
              key={i}
              type="button"
              disabled={guess !== null}
              onClick={() => choose(i)}
              className={`${choiceBtn} ${
                right
                  ? "win-pop border-accent bg-accent text-accent-foreground"
                  : wrong
                    ? "nudge border-danger/50 bg-danger/5 text-danger"
                    : i === guess
                      ? "border-cat-violet bg-cat-violet/10"
                      : guess !== null
                        ? "border-border opacity-50"
                        : "border-border hover:border-cat-violet/60"
              }`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-current/30 text-sm font-semibold">
                {right ? "✓" : wrong ? "✕" : String.fromCharCode(65 + i)}
              </span>
              <span>{g}</span>
            </button>
          );
        })}
      </div>
      {over && <Say tone="bad">ধাম! ডানে ১০ ঘর যেতেই দেয়াল। বাকি ২ ঘর যাব কোথায়?</Say>}
      <Task done={over}>আগে ভাবুন, তারপর একটা বেছে নিন — Shiku তখনই হাঁটা Start করবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Two walking orders, one destination.

const ROUTES = [
  {
    id: "ru",
    say: "ডানে ১০ ঘর, তারপর উপরে ১২ ঘর",
    cells: walk(["R", 10], ["U", 12]).cells,
    d: `M${mx(0)} ${my(0)}H${mx(CX)}V${my(CY)}`,
    trail: "fill-cat-blue/30",
    line: "stroke-cat-blue",
    on: "border-cat-blue bg-cat-blue/10",
  },
  {
    id: "ur",
    say: "উপরে ১২ ঘর, তারপর ডানে ১০ ঘর",
    cells: walk(["U", 12], ["R", 10]).cells,
    d: `M${mx(0)} ${my(0)}V${my(CY)}H${mx(CX)}`,
    trail: "fill-cat-coral/30",
    line: "stroke-cat-coral",
    on: "border-cat-coral bg-cat-coral/10",
  },
];

export function TwoRoutes() {
  const pass = useGate();
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const w = useWalk(55);

  const go = (id: string) => {
    if (w.running) return;
    const r = ROUTES.find((x) => x.id === id)!;
    setActive(id);
    // `done` cannot change while he walks (buttons are blocked), so the closure
    // is current when the walk ends.
    w.start(r.cells, () => {
      const next = done.includes(id) ? done : [...done, id];
      setDone(next);
      if (next.length === ROUTES.length) pass("রাস্তা আলাদা, পৌঁছানো একই জায়গায়।");
    });
  };
  const cur = ROUTES.find((x) => x.id === active);

  return (
    <>
      <Board label="two routes to the ball">
        {ROUTES.filter((r) => done.includes(r.id)).map((r) => (
          <Draw key={r.id} d={r.d} strokeWidth={2.5} ms={900} className={r.line} />
        ))}
        <Trail cells={w.walked} className={cur?.trail} />
        <You />
        <Ball at={BALL} ping={done.length === ROUTES.length} />
        <Bot at={w.here} />
      </Board>

      <div className="text-sm font-medium text-muted">Shiku-কে বলুন:</div>
      <div className="mt-2 flex flex-col gap-2">
        {ROUTES.map((r) => (
          <button
            key={r.id}
            type="button"
            disabled={w.running}
            onClick={() => go(r.id)}
            className={`${choiceBtn} ${r.id === active ? r.on : "border-border hover:border-foreground/30"}`}
          >
            <span>“{r.say}”</span>
            {done.includes(r.id) && <span className="ml-auto text-accent-text">✓</span>}
          </button>
        ))}
      </div>
      {done.length === ROUTES.length && <Say tone="good">দুইবারই পৌঁছে গেলাম!</Say>}
      <Task done={done.length === ROUTES.length}>
        দুইটা রাস্তাই চালিয়ে দেখুন ({bn(done.length)}/{bn(ROUTES.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8/9 · Put the ball anywhere: it is always two counts. `goal="negative"` asks
//       for a spot behind or to the left, where the counts pick up a minus.

const SPOTS_GOAL = 3;

function AddrRow({ word, n, axis, v, tone }: { word: string; n: number; axis: string; v: number; tone: string }) {
  return (
    <div className="grid grid-cols-[3.2rem_2rem_1rem_minmax(0,1fr)] items-baseline gap-1.5">
      <span className="text-muted">{word}</span>
      <b className="text-right font-mono text-lg">{bn(n)}</b>
      <span className="text-muted">→</span>
      <span className={`font-mono font-semibold ${tone}`}>
        {axis} = {sg(v)}
      </span>
    </div>
  );
}

export function BallAddress({ goal = "spots" }: { goal?: "spots" | "negative" }) {
  const pass = useGate();
  const [ball, setBall] = useState<Cell>(BALL);
  const [spots, setSpots] = useState<string[]>([]);
  const [neg, setNeg] = useState(false);
  const w = useWalk(35, route(BALL));

  const drop = (c: Cell) => {
    setBall(c);
    w.start(route(c));
    const next = spots.includes(c.join()) ? spots : [...spots, c.join()];
    setSpots(next);
    if (goal === "spots" && next.length === SPOTS_GOAL) pass("ঠিকানা বলতে দুইটা সংখ্যাই যথেষ্ট।");
    if (goal === "negative" && (c[0] < 0 || c[1] < 0)) {
      setNeg(true);
      pass("বাঁয়ে বা নিচে মানে সংখ্যার আগে “−”।");
    }
  };

  const onKey = (e: ReactKeyboardEvent<SVGSVGElement>) => {
    const d = KEY_DIR[e.key];
    if (!d) return;
    e.preventDefault();
    const next: Cell = [ball[0] + STEP[d][0], ball[1] + STEP[d][1]];
    if (inRoom(next)) drop(next);
  };

  // The legs are drawn only as far as the count has got, so the two numbers
  // are literally counted out, not asserted.
  const [sx, sy] = w.here;
  const [bx, by] = ball;

  return (
    <>
      <Board
        label={`the ball is ${Math.abs(bx)} tiles ${bx < 0 ? "left" : "right"} and ${Math.abs(by)} tiles ${
          by < 0 ? "down" : "up"
        }. Tap a tile, or use the arrow keys, to move it.`}
        onTile={drop}
        onKeyDown={onKey}
      >
        <path d={`M${mx(0)} ${my(0)}H${mx(sx)}`} strokeWidth={2.5} strokeLinecap="round" className="fill-none stroke-cat-blue" />
        <path d={`M${mx(sx)} ${my(0)}V${my(sy)}`} strokeWidth={2.5} strokeLinecap="round" className="fill-none stroke-cat-coral" />
        {sx !== 0 && (
          <text x={(mx(0) + mx(sx)) / 2} y={my(0) - T * 0.55} textAnchor="middle" className="fill-cat-blue text-[8px] font-semibold">
            {bx < 0 ? "বাঁয়ে" : "ডানে"} {bn(Math.abs(sx))}
          </text>
        )}
        {sy !== 0 && (
          <text
            x={mx(sx) + (sx > 0 ? -T * 0.6 : T * 0.6)}
            y={(my(0) + my(sy)) / 2}
            textAnchor={sx > 0 ? "end" : "start"}
            className="fill-cat-coral text-[8px] font-semibold"
          >
            {by < 0 ? "নিচে" : "উপরে"} {bn(Math.abs(sy))}
          </text>
        )}
        <You />
        <Ball at={ball} />
        {w.running && <circle cx={mx(sx)} cy={my(sy)} r={T * 0.22} className="fill-foreground" />}
      </Board>

      <div className="mx-auto grid max-w-xs gap-1.5 rounded-2xl border border-border px-4 py-3 text-[0.95rem]">
        <AddrRow word={bx < 0 ? "বাঁয়ে" : "ডানে"} n={Math.abs(sx)} axis="x" v={sx} tone="text-cat-blue" />
        <AddrRow word={by < 0 ? "নিচে" : "উপরে"} n={Math.abs(sy)} axis="y" v={sy} tone="text-cat-coral" />
        <div className="mt-1 border-t border-border pt-2 text-center font-mono text-2xl font-semibold">
          (<span className="text-cat-blue">{sg(sx)}</span>, <span className="text-cat-coral">{sg(sy)}</span>)
        </div>
      </div>

      {(bx < 0 || by < 0) && !w.running && (
        <div className="mt-3 rounded-xl bg-cat-amber/10 px-3.5 py-2.5 text-[0.95rem] leading-snug transition duration-300 starting:opacity-0">
          {bx < 0 && (
            <>
              বাঁয়ে {bn(-bx)} ঘর = ডানে <b className="font-semibold">−{bn(-bx)}</b> ঘর।{" "}
            </>
          )}
          {by < 0 && (
            <>
              নিচে {bn(-by)} ঘর = উপরে <b className="font-semibold">−{bn(-by)}</b> ঘর।{" "}
            </>
          )}
          “−” এখানে ছোট-বড় বোঝাচ্ছে না — দিক বোঝাচ্ছে।
        </div>
      )}

      {goal === "spots" ? (
        <Task done={spots.length >= SPOTS_GOAL}>
          Ball-টা যেকোনো tile-এ tap করে রাখুন — {bn(SPOTS_GOAL)}টা আলাদা জায়গায় ({bn(Math.min(spots.length, SPOTS_GOAL))}/
          {bn(SPOTS_GOAL)})
        </Task>
      ) : (
        <Task done={neg}>এবার ball-টা আপনার বাঁয়ে বা নিচে কোথাও রাখুন।</Task>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · The room dissolves into a sheet of paper, and the reader draws the tiles
//      back onto it — and it is the room again.

const LINES: string[] = [];
for (let c = 0; c <= COLS; c++) LINES.push(`M${PAD + c * T} ${PAD}v${ROWS * T}`);
for (let r = 0; r <= ROWS; r++) LINES.push(`M${PAD} ${PAD + r * T}h${COLS * T}`);

export function PaperReveal() {
  const pass = useGate();
  const [paper, setPaper] = useState(false);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPaper(true), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Board label={paper ? "a blank white sheet of paper" : "the room, fading away"} floor={false}>
        <g className={`transition-opacity duration-1000 ${paper ? "opacity-0" : "opacity-100"}`}>
          <Floor paper={false} />
          <You />
          <Bot />
          <Ball at={BALL} />
        </g>
        <rect
          x={PAD}
          y={PAD}
          width={COLS * T}
          height={ROWS * T}
          rx={2}
          strokeWidth={0.8}
          className={`fill-white stroke-foreground/15 transition-opacity duration-1000 ${paper ? "opacity-100" : "opacity-0"}`}
        />
        {drawn && LINES.map((d, i) => <Draw key={i} d={d} delay={i * 30} strokeWidth={0.6} className="stroke-cat-blue/25" />)}
      </Board>
      <div className="flex justify-center">
        <button
          type="button"
          disabled={!paper || drawn}
          onClick={() => {
            setDrawn(true);
            pass("আরে, এটা তো সেই tiles-এর room!");
          }}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-cat-blue px-5 font-semibold text-white transition-all hover:-translate-y-px disabled:cursor-default disabled:opacity-40 disabled:hover:translate-y-0"
        >
          ✏️ কাগজে ঘর আঁকুন
        </button>
      </div>
      <Task done={drawn}>কাগজের ওপর room-এর tiles-এর মতো ঘর আঁকুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Axes on the sheet. x is blue and y is coral everywhere in this lesson, the
// same colours as the "across" and "up" legs of the walk.

const X_AXIS = `M${px(-CX)} ${my(0)}H${px(CX) + T}`;
const Y_AXIS = `M${mx(0)} ${py(-CY) + T}V${py(CY)}`;
const X_TIP = `M${px(CX) + T + 3} ${my(0)}l-6 -3.5v7z`;
const Y_TIP = `M${mx(0)} ${py(CY) - 3}l-3.5 6h7z`;
const TICKS = [-10, -5, 5, 10];

function AxisName({ axis, className = "" }: { axis: "x" | "y"; className?: string }) {
  return axis === "x" ? (
    <text x={px(CX) + T - 2} y={my(0) - 6} textAnchor="end" className={`fill-cat-blue text-[11px] font-bold italic ${className}`}>
      x
    </text>
  ) : (
    <text x={mx(0) + 6} y={py(CY) + 9} className={`fill-cat-coral text-[11px] font-bold italic ${className}`}>
      y
    </text>
  );
}

function Axes({ ticks = false }: { ticks?: boolean }) {
  return (
    <g className="pointer-events-none">
      <path d={X_AXIS} strokeWidth={1.3} className="fill-none stroke-cat-blue" />
      <path d={X_TIP} className="fill-cat-blue" />
      <AxisName axis="x" />
      <path d={Y_AXIS} strokeWidth={1.3} className="fill-none stroke-cat-coral" />
      <path d={Y_TIP} className="fill-cat-coral" />
      <AxisName axis="y" />
      <circle cx={mx(0)} cy={my(0)} r={2.6} className={INK} />
      {ticks && (
        <>
          {TICKS.map((n) => (
            <g key={`x${n}`}>
              <path d={`M${mx(n)} ${my(0) - 3}v6`} strokeWidth={1} className="stroke-cat-blue" />
              <text x={mx(n)} y={my(0) + 13} textAnchor="middle" className="fill-[#5a6b7d] font-mono text-[7px]">
                {sg(n)}
              </text>
            </g>
          ))}
          {TICKS.map((n) => (
            <g key={`y${n}`}>
              <path d={`M${mx(0) - 3} ${my(n)}h6`} strokeWidth={1} className="stroke-cat-coral" />
              <text x={mx(0) - 6} y={my(n) + 2.5} textAnchor="end" className="fill-[#5a6b7d] font-mono text-[7px]">
                {sg(n)}
              </text>
            </g>
          ))}
        </>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 12 · Draw the two directions yourself, and the middle dot gets its name.

export function NameAxes() {
  const pass = useGate();
  const [x, setX] = useState(false);
  const [y, setY] = useState(false);

  const draw = (which: "x" | "y") => {
    const nx = x || which === "x";
    const ny = y || which === "y";
    setX(nx);
    setY(ny);
    if (nx && ny) pass("দুই দাগের মিলনবিন্দু origin, (0, 0)।");
  };

  return (
    <>
      <Board paper label="graph paper with a dot in the middle">
        {x && (
          <g>
            <Draw d={X_AXIS} strokeWidth={1.3} className="stroke-cat-blue" />
            <path d={X_TIP} className={`${POP} delay-500 fill-cat-blue`} />
            <AxisName axis="x" className={`${POP} delay-500`} />
          </g>
        )}
        {y && (
          <g>
            <Draw d={Y_AXIS} strokeWidth={1.3} className="stroke-cat-coral" />
            <path d={Y_TIP} className={`${POP} delay-500 fill-cat-coral`} />
            <AxisName axis="y" className={`${POP} delay-500`} />
          </g>
        )}
        <circle cx={mx(0)} cy={my(0)} r={2.8} className={INK} />
        {x && y && (
          <g className={`${POP} delay-700`}>
            <rect x={mx(0) - 58} y={my(0) + 5} width={53} height={25} rx={4} className="fill-white/90" />
            <text x={mx(0) - 7} y={my(0) + 15} textAnchor="end" className={`${INK} font-mono text-[9px] font-bold`}>
              (0, 0)
            </text>
            <text x={mx(0) - 7} y={my(0) + 26} textAnchor="end" className="fill-[#5a6b7d] text-[8px]">
              origin
            </text>
          </g>
        )}
      </Board>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          disabled={x}
          onClick={() => draw("x")}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-cat-blue px-4 py-2 font-semibold text-cat-blue transition-colors hover:bg-cat-blue/10 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          ↔ ডানে-বাঁয়ে দাগ: <i className="font-bold">x</i>
        </button>
        <button
          type="button"
          disabled={y}
          onClick={() => draw("y")}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-cat-coral px-4 py-2 font-semibold text-cat-coral transition-colors hover:bg-cat-coral/10 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          ↕ ওপরে-নিচে দাগ: <i className="font-bold">y</i>
        </button>
      </div>
      <Task done={x && y}>দুইটা দাগই টেনে দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 13 · Read the paper: four hidden points, one in each quarter, so no sign is
//      left unseen. Tapping one draws its two counts back to the axes.

const MYSTERY: Cell[] = [
  [7, 9],
  [-7, 5],
  [-4, -8],
  [6, -3],
];

export function ReadAddresses() {
  const pass = useGate();
  const [seen, setSeen] = useState<number[]>([]);

  const reveal = (i: number) => {
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.length === MYSTERY.length)
      pass("ডানে-ওপরে +, বাঁয়ে-নিচে −।");
  };

  return (
    <>
      <Board paper label="graph paper with four hidden points">
        <Axes ticks />
        {MYSTERY.map(([x, y], i) => {
          const open = seen.includes(i);
          return (
            <g
              key={i}
              role="button"
              tabIndex={open ? -1 : 0}
              aria-label={open ? addr([x, y]) : "লুকানো বিন্দু — ঠিকানা দেখুন"}
              className={open ? "" : "cursor-pointer"}
              onClick={() => reveal(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  reveal(i);
                }
              }}
            >
              {/* the horizontal count is x, the vertical one is y */}
              {open && (
                <>
                  <Draw d={`M${mx(x)} ${my(y)}H${mx(0)}`} strokeWidth={1.2} className="stroke-cat-blue" />
                  <Draw d={`M${mx(x)} ${my(y)}V${my(0)}`} strokeWidth={1.2} className="stroke-cat-coral" />
                </>
              )}
              <circle cx={mx(x)} cy={my(y)} r={T} className="fill-transparent" />
              {open ? (
                <>
                  <circle cx={mx(x)} cy={my(y)} r={3.5} className={`${POP} ${PEN_OK}`} />
                  <text
                    x={mx(x) + (x > 0 ? -6 : 6)}
                    y={my(y) + (y > 0 ? -6 : 12)}
                    textAnchor={x > 0 ? "end" : "start"}
                    className={`${POP} delay-300 ${PEN_OK} font-mono text-[9px] font-bold`}
                  >
                    {addr([x, y])}
                  </text>
                </>
              ) : (
                <g className="animate-pulse">
                  <circle cx={mx(x)} cy={my(y)} r={6} className={PEN_BAD} />
                  <text x={mx(x)} y={my(y) + 3} textAnchor="middle" className="pointer-events-none fill-white text-[8px] font-bold">
                    ?
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </Board>
      <Task done={seen.length === MYSTERY.length}>
        লাল বিন্দুগুলোতে tap করে ঠিকানা বের করুন ({bn(seen.length)}/{bn(MYSTERY.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 14 · The other way round: given the address, find the place. A wrong tap
//      says what it *did* hit, and — when it is the swapped pair — says so.

const TARGETS: Cell[] = [
  [-6, 3],
  [4, -5],
];

function missHint(got: Cell, want: Cell) {
  if (same(got, [want[1], want[0]])) return "উল্টে গেছে! প্রথম সংখ্যাটা x (ডানে-বাঁয়ে), দ্বিতীয়টা y (ওপরে-নিচে)।";
  if (Math.abs(got[0]) === Math.abs(want[0]) && Math.abs(got[1]) === Math.abs(want[1]))
    return "সংখ্যা ঠিক আছে, দিকটা দেখুন — “−” মানে বাঁয়ে বা নিচে।";
  return `এটা ${addr(got)}। Origin থেকে ${want[0] < 0 ? "বাঁয়ে" : "ডানে"} ${bn(Math.abs(want[0]))} ঘর, তারপর ${
    want[1] < 0 ? "নিচে" : "ওপরে"
  } ${bn(Math.abs(want[1]))} ঘর গুনে দেখুন।`;
}

export function FindPoint() {
  const pass = useGate();
  const [k, setK] = useState(0);
  const [miss, setMiss] = useState<{ at: Cell; n: number } | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const target: Cell | undefined = TARGETS[k];

  const tap = (c: Cell) => {
    if (!target) return;
    if (same(c, target)) {
      setMiss(null);
      setK(k + 1);
      if (k + 1 === TARGETS.length) pass("আপনি এখন graph paper পড়তে পারেন।");
    } else setMiss((m) => ({ at: c, n: (m?.n ?? 0) + 1 }));
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {TARGETS.map((t, i) => (
          <span
            key={i}
            className={`rounded-full border-2 px-3.5 py-1 font-mono text-lg font-semibold transition-colors duration-300 ${
              i < k ? "border-accent bg-accent/10 text-accent-text" : i === k ? "border-foreground" : "border-border text-muted"
            }`}
          >
            {i < k ? "✓ " : ""}
            {addr(t)}
          </span>
        ))}
      </div>

      <Board paper label="graph paper — tap the tile with the given address" onTile={target ? tap : undefined} onHover={setHover}>
        {hover && target && (
          <rect x={px(hover[0])} y={py(hover[1])} width={T} height={T} className="pointer-events-none fill-cat-blue/20" />
        )}
        <Axes ticks />
        {TARGETS.slice(0, k).map((t) => (
          <g key={t.join()}>
            <circle cx={mx(t[0])} cy={my(t[1])} r={3.8} className={`${POP} ${PEN_OK}`} />
            <text
              x={mx(t[0])}
              y={my(t[1]) - 7}
              textAnchor="middle"
              className={`${POP} ${PEN_OK} font-mono text-[9px] font-bold`}
            >
              {addr(t)}
            </text>
          </g>
        ))}
        {miss && (
          <g key={miss.n}>
            <circle cx={mx(miss.at[0])} cy={my(miss.at[1])} r={3.4} className={`${POP} ${PEN_BAD}`} />
            <text
              x={mx(miss.at[0])}
              y={my(miss.at[1]) - 7}
              textAnchor="middle"
              className={`${POP} ${PEN_BAD} font-mono text-[9px] font-bold`}
            >
              {addr(miss.at)}
            </text>
          </g>
        )}
      </Board>

      <Task done={!target}>
        {target ? (
          <>
            <b className="font-mono font-semibold">{addr(target)}</b> কোথায়? কাগজে ঠিক ওই ঘরে tap করুন।
          </>
        ) : (
          "দুইটাই পেয়েছেন!"
        )}
      </Task>
      {miss && target && <Nope key={miss.n}>{missHint(miss.at, target)}</Nope>}
    </>
  );
}

// ---------------------------------------------------------------------------
// 15 · Shown once the order question is answered: (10, 12) sits in the corner,
//      (12, 10) runs off the sheet — the same wall Shiku hit.

export function SwapCheck() {
  return (
    <Board paper label="(10, 12) is the top-right corner; (12, 10) is off the paper">
      <Axes />
      <Draw d={`M${mx(0)} ${my(0)}H${mx(CX)}V${my(CY)}`} strokeWidth={1.8} ms={900} className="stroke-[#0d9488]" />
      <circle cx={mx(CX)} cy={my(CY)} r={3.8} className={`${POP} delay-700 ${PEN_OK}`} />
      <text x={mx(CX) - 8} y={my(CY) + 3} textAnchor="end" className={`${POP} delay-700 ${PEN_OK} font-mono text-[9px] font-bold`}>
        (10, 12)
      </text>
      <Draw d={`M${mx(0)} ${my(0)}H${px(CX) + T + 12}`} strokeWidth={1.8} delay={1000} ms={900} className="stroke-[#e11d48]" />
      <text x={px(CX) + T - 2} y={my(0) + 14} textAnchor="end" className={`${POP} delay-[1800ms] ${PEN_BAD} font-mono text-[9px] font-bold`}>
        (12, 10) → কাগজের বাইরে!
      </text>
    </Board>
  );
}

// ---------------------------------------------------------------------------
// 16 · The last picture: the whole lesson in one line and one address.

export function Finale() {
  return (
    <Board paper label="Shiku's walk to the ball, written as the address (10, 12)">
      <Axes ticks />
      <Draw d={`M${mx(0)} ${my(0)}H${mx(CX)}`} strokeWidth={2.5} delay={300} ms={800} className="stroke-cat-blue" />
      <Draw d={`M${mx(CX)} ${my(0)}V${my(CY)}`} strokeWidth={2.5} delay={1100} ms={900} className="stroke-cat-coral" />
      <Ball at={BALL} className="delay-[1900ms]" />
      <text
        x={mx(CX) - 10}
        y={my(CY) + 3}
        textAnchor="end"
        className={`${POP} delay-[2100ms] ${INK} font-mono text-[11px] font-bold`}
      >
        ball = (10, 12)
      </text>
    </Board>
  );
}
