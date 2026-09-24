"use client";

import { type ReactNode } from "react";

import { type Frame, type XY } from "@/components/journey/plane";

// The road in front of the school gate, shared by every Article 6 journey
// (6.2 → 6.7), so the আলপনা and its chalk grid look the same everywhere, the
// way 5.x shared ButtonRemote.
//
// Coordinates are the art sir's paper: the gate pillar is (0, 0), the road runs
// along x, across it is y. A *move* is any function paper → road. A linear move
// is given by where the two ropes land, e₁ → cols[0], e₂ → cols[1], and
// `byCols` turns that into a move. Grid lines are sampled, not drawn straight,
// so a move that isn't linear (a fish-eye, squaring) visibly bends them.
//
// Draw these inside a journey/plane <Plane paper={false}>; <RoadBed> paints the
// asphalt. Everything is fixed ink: the road is "paper", the same in light and
// dark.

export type Cols = [XY, XY];
export type Move = (p: XY) => XY;

/** v₁·e₁* + v₂·e₂*: where the ropes say p goes */
export const apply = (cols: Cols, p: XY): XY => [p[0] * cols[0][0] + p[1] * cols[1][0], p[0] * cols[0][1] + p[1] * cols[1][1]];
export const byCols =
  (cols: Cols): Move =>
  (p) =>
    apply(cols, p);
export const ID: Cols = [
  [1, 0],
  [0, 1],
];
/** a turn by `deg` anticlockwise about the pillar */
export const turnCols = (deg: number): Cols => {
  const r = (deg * Math.PI) / 180;
  const c = Math.round(Math.cos(r) * 1e9) / 1e9;
  const s = Math.round(Math.sin(r) * 1e9) / 1e9;
  return [
    [c, s],
    [-s, c],
  ];
};
/** between the plain paper (t = 0) and the move (t = 1), point by point */
export const partway =
  (m: Move, t: number): Move =>
  (p) => {
    const q = m(p);
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  };
/** a matrix, rows first, from its columns: [[a, b], [c, d]] */
export const rowsOf = (cols: Cols) => [
  [cols[0][0], cols[1][0]],
  [cols[0][1], cols[1][1]],
];

// ---------------------------------------------------------------------------
// The design on the art sir's graph paper: a lotus of five petals fanning up
// from (3, 1), tips on whole squares so the ropes' recipe works in integers,
// and a small fish above it on the right.

export const LOTUS_C: XY = [3, 1];
export const LOTUS_TIPS: XY[] = [
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 3],
  [5, 2],
];
/** one petal as a closed outline: centre → left of the vein → tip → right */
const petal = (tip: XY): XY[] => {
  const [cx, cy] = LOTUS_C;
  const dx = tip[0] - cx;
  const dy = tip[1] - cy;
  const L = Math.hypot(dx, dy);
  const nx = (-dy / L) * 0.42;
  const ny = (dx / L) * 0.42;
  const mx = cx + dx * 0.45;
  const my = cy + dy * 0.45;
  return [LOTUS_C, [mx + nx, my + ny], tip, [mx - nx, my - ny], LOTUS_C];
};
export const PETALS: XY[][] = LOTUS_TIPS.map(petal);
export const FISH: XY[] = [
  [4.3, 4.6],
  [4.9, 5.0],
  [5.6, 4.7],
  [5.8, 4.5],
  [5.6, 4.3],
  [4.9, 4.1],
  [4.3, 4.6],
  [3.9, 4.95],
  [3.9, 4.25],
  [4.3, 4.6],
];
export const FISH_EYE: XY = [5.35, 4.55];

const INK = "#0f1b2d";
const CHALK = "#f8fafc";

/** the path through points, each carried by the move */
export const pathOf = (f: Frame, m: Move, pts: readonly XY[], close = false) =>
  pts
    .map((p, i) => {
      const q = m(p);
      return `${i ? "L" : "M"}${f.sx(q[0]).toFixed(1)} ${f.sy(q[1]).toFixed(1)}`;
    })
    .join("") + (close ? "Z" : "");

/** a straight paper line from a to b, sampled so a bending move shows */
const sampled = (a: XY, b: XY, n = 24): XY[] => Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);

/** The asphalt under the frame, edge to edge, with the kerb along the gate's side. */
export function RoadBed({ f }: { f: Frame }) {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={0} width={f.W} height={f.H} rx={6} fill="#6b7280" />
      <rect x={0} y={f.H - 6} width={f.W} height={6} fill="#9ca3af" />
    </g>
  );
}

/**
 * The chalk grid, carried by `move`: the lines x = x0…x1 and y = y0…y1 of the
 * paper. `ghost` keeps the plain paper grid faintly underneath.
 */
export function ChalkGrid({
  f,
  move,
  x0 = -1,
  x1 = 7,
  y0 = -1,
  y1 = 6,
  ghost = false,
  tone = CHALK,
}: {
  f: Frame;
  move: Move;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  ghost?: boolean;
  tone?: string;
}) {
  const id = (p: XY) => p;
  const lines = (m: Move) => {
    let d = "";
    for (let x = x0; x <= x1; x++) d += pathOf(f, m, sampled([x, y0], [x, y1]));
    for (let y = y0; y <= y1; y++) d += pathOf(f, m, sampled([x0, y], [x1, y]));
    return d;
  };
  return (
    <g className="pointer-events-none">
      {ghost && <path d={lines(id)} strokeWidth={0.6} stroke={CHALK} strokeOpacity={0.18} fill="none" />}
      <path d={lines(move)} strokeWidth={0.9} stroke={tone} strokeOpacity={0.55} fill="none" />
      <path d={pathOf(f, move, sampled([x0, 0], [x1, 0]))} strokeWidth={1.4} stroke={tone} strokeOpacity={0.9} fill="none" />
      <path d={pathOf(f, move, sampled([0, y0], [0, y1]))} strokeWidth={1.4} stroke={tone} strokeOpacity={0.9} fill="none" />
    </g>
  );
}

/** The আলপনা (lotus and fish), carried by `move`. */
export function Alpana({ f, move, fish = true, faint = false }: { f: Frame; move: Move; fish?: boolean; faint?: boolean }) {
  const eye = move(FISH_EYE);
  return (
    <g className="pointer-events-none" opacity={faint ? 0.3 : 1}>
      {PETALS.map((p, i) => (
        <path key={i} d={pathOf(f, move, p, true)} fill="#f472b6" fillOpacity={0.85} stroke={CHALK} strokeWidth={1.1} strokeLinejoin="round" />
      ))}
      <circle cx={f.sx(move(LOTUS_C)[0])} cy={f.sy(move(LOTUS_C)[1])} r={2.6} fill="#fde047" stroke={CHALK} />
      {fish && (
        <>
          <path d={pathOf(f, move, FISH, true)} fill="#fbbf24" fillOpacity={0.9} stroke={CHALK} strokeWidth={1.1} strokeLinejoin="round" />
          <circle cx={f.sx(eye[0])} cy={f.sy(eye[1])} r={1.4} fill={INK} />
        </>
      )}
    </g>
  );
}

/** The gate pillar, seen from above, at the paper's (0, 0), with the rope knot. */
export function Pillar({ f, at = [0, 0], off = false }: { f: Frame; at?: XY; off?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={f.sx(0) - 7} y={f.sy(0) - 7} width={14} height={14} rx={2} fill="#b91c1c" stroke="#7f1d1d" strokeWidth={1.2} />
      {/* where the grid's corner is: on the pillar, or pulled off it (a slide) */}
      <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={3.2} fill={off ? "#fca5a5" : CHALK} stroke={off ? "#e11d48" : INK} strokeWidth={1} />
    </g>
  );
}

/** A rope from the pillar to (x, y), with a chalk cross at its end; the two ropes are e₁ (amber) and e₂ (teal). */
export function Rope({ f, to, which, label }: { f: Frame; to: XY; which: 1 | 2; label?: ReactNode }) {
  const c = which === 1 ? "#f59e0b" : "#2dd4bf";
  const x = f.sx(to[0]);
  const y = f.sy(to[1]);
  return (
    <g className="pointer-events-none">
      <path d={`M${f.sx(0)} ${f.sy(0)}L${x} ${y}`} stroke={c} strokeWidth={2.4} strokeLinecap="round" />
      <path d={`M${x - 4} ${y - 4}l8 8m0 -8l-8 8`} stroke={CHALK} strokeWidth={1.6} strokeLinecap="round" />
      {label && (
        <text x={x + 6} y={y - 6} fontSize={9} fontWeight={700} fill={c}>
          {label}
        </text>
      )}
    </g>
  );
}
