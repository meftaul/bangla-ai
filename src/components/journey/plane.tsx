"use client";

import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { Draw, POP } from "./kit";

// A sheet of graph paper for the Math for AI 2.x journeys: points go in as
// data, (3, 1), and come out as SVG, so a screen never talks in pixels.
//
// The sheet is real white paper in both themes, as in the graph-paper lesson,
// so ink on it is fixed rather than a theme token. Arrows get a proper head
// that shrinks for short arrows and vanishes at length zero — the zero vector
// has no direction to point a head along. A sheet can be dragged on: it hands
// the screen pointer positions in data units, and the screen decides what a
// drag means (move a tip, carry a whole arrow).

export type XY = [number, number];

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const same = (a: XY, b: XY) => a[0] === b[0] && a[1] === b[1];
export const plus = (a: XY, b: XY): XY => [a[0] + b[0], a[1] + b[1]];
export const minus = (a: XY, b: XY): XY => [a[0] - b[0], a[1] - b[1]];
export const mix = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** A machine number with a real minus sign. */
export const sg = (n: number) => (n < 0 ? `−${-n}` : `${n}`);
export const tup = (v: readonly number[]) => `(${v.map(sg).join(", ")})`;

export function makeFrame(x0: number, x1: number, y0: number, y1: number, u: number, pad = 18) {
  return {
    x0,
    x1,
    y0,
    y1,
    u,
    pad,
    W: 2 * pad + (x1 - x0) * u,
    H: 2 * pad + (y1 - y0) * u,
    sx: (x: number) => pad + (x - x0) * u,
    sy: (y: number) => pad + (y1 - y) * u,
  };
}
export type Frame = ReturnType<typeof makeFrame>;

/** The most of the screen's height one sheet may take (see Plane). */
const PAPER_MAX_VH = 44;

/** The nearest grid crossing that is still on the sheet. */
export const snap = (p: XY, f: Frame): XY => [
  clamp(Math.round(p[0]), Math.ceil(f.x0), Math.floor(f.x1)),
  clamp(Math.round(p[1]), Math.ceil(f.y0), Math.floor(f.y1)),
];

export const INK = "fill-[#0f1b2d]";
export const INK_SOFT = "fill-[#5a6b7d]";

export type Drag = { down?: (p: XY) => void; move?: (p: XY) => void; up?: () => void };

export function Plane({
  f,
  label,
  grid = 1,
  axes = true,
  ticks = 0,
  paper = true,
  drag,
  onKey,
  className = "max-w-[22rem]",
  children,
}: {
  f: Frame;
  label: string;
  /** grid spacing in data units; 0 for none */
  grid?: number;
  axes?: boolean;
  /** label every `ticks` units along both axes; 0 for none */
  ticks?: number;
  /** false: no white sheet, the screen draws its own ground (a street map) */
  paper?: boolean;
  drag?: Drag;
  /** arrow keys for the reader without a pointer */
  onKey?: (e: KeyboardEvent<SVGSVGElement>) => void;
  className?: string;
  children?: ReactNode;
}) {
  const held = useRef(false);
  const at = (e: PointerEvent<SVGSVGElement>): XY => {
    const r = e.currentTarget.getBoundingClientRect();
    const ux = ((e.clientX - r.left) / r.width) * f.W;
    const uy = ((e.clientY - r.top) / r.height) * f.H;
    return [f.x0 + (ux - f.pad) / f.u, f.y1 - (uy - f.pad) / f.u];
  };

  let lines = "";
  if (grid) {
    for (let x = Math.ceil(f.x0 / grid) * grid; x <= f.x1 + 1e-9; x += grid) lines += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
    for (let y = Math.ceil(f.y0 / grid) * grid; y <= f.y1 + 1e-9; y += grid) lines += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  }
  const xs: number[] = [];
  const ys: number[] = [];
  if (ticks) {
    for (let x = Math.ceil(f.x0 / ticks) * ticks; x <= f.x1; x += ticks) if (x !== 0) xs.push(x);
    for (let y = Math.ceil(f.y0 / ticks) * ticks; y <= f.y1; y += ticks) if (y !== 0) ys.push(y);
  }
  const hasX = axes && f.y0 <= 0 && f.y1 >= 0;
  const hasY = axes && f.x0 <= 0 && f.x1 >= 0;
  const release = () => {
    held.current = false;
    drag?.up?.();
  };

  return (
    <svg
      viewBox={`0 0 ${f.W} ${f.H}`}
      role={onKey ? "application" : "group"}
      aria-label={label}
      tabIndex={onKey ? 0 : undefined}
      className={`mx-auto my-5 block h-auto w-full overflow-visible select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
        drag ? "cursor-pointer touch-none" : ""
      } ${className}`}
      onPointerDown={
        drag
          ? (e) => {
              held.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.down?.(at(e));
            }
          : undefined
      }
      onPointerMove={drag ? (e) => held.current && drag.move?.(at(e)) : undefined}
      onPointerUp={drag ? release : undefined}
      onPointerCancel={drag ? release : undefined}
      onKeyDown={onKey}
      // Never taller than PAPER_MAX_VH of the screen: a tall frame at full width
      // (many are 1.5–2× taller than wide) pushes the controls that drive it off
      // a laptop's screen. Width, not height, so the viewBox is never letterboxed
      // and `at` still maps the whole box onto the frame.
      style={{ width: `min(100%, ${((f.W / f.H) * PAPER_MAX_VH).toFixed(2)}svh)` }}
    >
      {paper && (
        <rect
          x={f.sx(f.x0)}
          y={f.sy(f.y1)}
          width={(f.x1 - f.x0) * f.u}
          height={(f.y1 - f.y0) * f.u}
          rx={3}
          strokeWidth={0.8}
          className="fill-white stroke-[#cbd5e1]"
        />
      )}
      {lines && <path d={lines} strokeWidth={0.6} className="pointer-events-none fill-none stroke-cat-blue/25" />}
      {hasX && <path d={`M${f.sx(f.x0)} ${f.sy(0)}H${f.sx(f.x1)}`} strokeWidth={1.2} className="pointer-events-none stroke-[#0f1b2d]/50" />}
      {hasY && <path d={`M${f.sx(0)} ${f.sy(f.y0)}V${f.sy(f.y1)}`} strokeWidth={1.2} className="pointer-events-none stroke-[#0f1b2d]/50" />}
      {xs.map((x) => (
        <text key={`x${x}`} x={f.sx(x)} y={f.sy(0) + 12} textAnchor="middle" fontSize={8.5} className={`${INK_SOFT} pointer-events-none font-mono`}>
          {sg(x)}
        </text>
      ))}
      {ys.map((y) => (
        <text key={`y${y}`} x={f.sx(0) - 5} y={f.sy(y) + 3} textAnchor="end" fontSize={8.5} className={`${INK_SOFT} pointer-events-none font-mono`}>
          {sg(y)}
        </text>
      ))}
      {children}
    </svg>
  );
}

const TONE = {
  blue: { stroke: "stroke-cat-blue", fill: "fill-cat-blue" },
  coral: { stroke: "stroke-cat-coral", fill: "fill-cat-coral" },
  teal: { stroke: "stroke-cat-teal", fill: "fill-cat-teal" },
  violet: { stroke: "stroke-cat-violet", fill: "fill-cat-violet" },
  amber: { stroke: "stroke-cat-amber", fill: "fill-cat-amber" },
  danger: { stroke: "stroke-danger", fill: "fill-danger" },
  ink: { stroke: "stroke-[#0f1b2d]", fill: "fill-[#0f1b2d]" },
};
export type Tone = keyof typeof TONE;

/**
 * An arrow from one point to another. `draw` makes it draw itself from the
 * tail when mounted (key it to replay); `faint` leaves a ghost behind.
 */
export function Arrow({
  f,
  from,
  to,
  tone = "blue",
  w = 2.6,
  draw = false,
  dashed = false,
  faint = false,
  delay = 0,
}: {
  f: Frame;
  from: XY;
  to: XY;
  tone?: Tone;
  w?: number;
  draw?: boolean;
  dashed?: boolean;
  faint?: boolean;
  delay?: number;
}) {
  const x1 = f.sx(from[0]);
  const y1 = f.sy(from[1]);
  const x2 = f.sx(to[0]);
  const y2 = f.sy(to[1]);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const h = Math.min(9 + w * 1.5, len * 0.55);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const half = h * 0.48;
  const head = `M${x2} ${y2}L${bx - uy * half} ${by + ux * half}L${bx + uy * half} ${by - ux * half}Z`;
  const shaft = `M${x1} ${y1}L${bx + ux * 0.5} ${by + uy * 0.5}`;
  const { stroke, fill } = TONE[tone];
  return (
    <g opacity={faint ? 0.3 : 1} className="pointer-events-none">
      {draw ? (
        <Draw d={shaft} strokeWidth={w} delay={delay} className={stroke} />
      ) : (
        <path d={shaft} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? "6 5" : undefined} className={`fill-none ${stroke}`} />
      )}
      <path d={head} className={`${fill} ${draw ? POP : ""}`} style={draw ? { transitionDelay: `${delay + 450}ms` } : undefined} />
    </g>
  );
}

export function Label({
  f,
  at,
  dx = 0,
  dy = 0,
  anchor = "middle",
  size = 10,
  weight = 600,
  className = INK,
  children,
}: {
  f: Frame;
  at: XY;
  dx?: number;
  dy?: number;
  anchor?: "start" | "middle" | "end";
  size?: number;
  weight?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <text x={f.sx(at[0]) + dx} y={f.sy(at[1]) + dy} textAnchor={anchor} fontSize={size} fontWeight={weight} className={`pointer-events-none ${className}`}>
      {children}
    </text>
  );
}

export function Dot({ f, at, r = 4, className = INK, pop = false }: { f: Frame; at: XY; r?: number; className?: string; pop?: boolean }) {
  return <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={r} className={`pointer-events-none ${className} ${pop ? POP : ""}`} />;
}

/** A target to reach: an amber star that pulses until it is reached. */
export function Star({ f, at, done = false }: { f: Frame; at: XY; done?: boolean }) {
  const cx = f.sx(at[0]);
  const cy = f.sy(at[1]);
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 4 : 9;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} className={`pointer-events-none ${done ? "fill-accent" : "animate-pulse fill-cat-amber"}`} />;
}
