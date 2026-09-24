"use client";

import { useId, type ReactNode } from "react";

import { POP } from "@/components/journey/kit";
import { Plane, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { GOOD_LENS, byCols, det, partway, type Cols } from "./light-kit";

// The patch, shared by the Article 8 journeys (8.1 → 8.7), the way 7.x shared
// light-kit.tsx (which this file imports read-only).
//
// The patch is one chalk ঘর of light (the stencil's one square) carried by a
// lens into its parallelogram: corners at, at + c₁, at + c₁ + c₂, at + c₂,
// where c₁, c₂ are the lens's columns (light-kit's `Cols`). One ঘর = one
// কৌটা রং. How many ঘর the patch covers is the determinant.
//
// "Cut and slide": for a lens with whole-number columns, the chalk lines cut
// the patch into pieces, one per ঘর it touches. Pieces that hang over (only
// part of a ঘর) slide, each by a whole number of the lens's own columns, into
// the gaps of a few "target" ঘর, until every target ঘর is full. Nothing is
// added and nothing lost; the count of full ঘর is |det|. `planPatch` works it
// out for any whole-number lens with det ≠ 0 (the patch tiles the wall by its
// columns, so each class of ঘর fills exactly one target once).
//
// Pieces:
//   · numbers: LENS_G, LENS_L, LENS_H, areaOf, patchCorners, polyArea,
//     clipToCell, planPatch, moves, wholeCells, FLOWER_CELLS, FLOWER_OUTLINE,
//     cellPoly, mapPts, PK (colours), patchFrame;
//   · wall pieces (inside <PatchWall>, a Plane with its own lime + chalk):
//     PatchWall, UnitTile, Patch, CutPieces, TargetCells, PaintFill;
//   · HTML chrome: Kouta (a paint can), KoutaRow, KoutaCount;
//   · stage pieces (cast <Stage>, 320 × 180): StageKouta, StageMora, StageBrush.
//
// Everything on the wall is fixed ink ("paper": the same in light and dark).

// ---------------------------------------------------------------------------
// Numbers.

/** 7.3's good lens G = [[2, 1], [1, 2]]: the patch (0, 0), (2, 1), (3, 3), (1, 2), 3 ঘর. */
export const LENS_G: Cols = GOOD_LENS;
/** The book's L = [[2, 0], [0, 2]]: doubles both ways, 4 ঘর. */
export const LENS_L: Cols = [
  [2, 0],
  [0, 2],
];
/** The book's H = [[½, 0], [0, ½]]: halves both ways, ¼ ঘর. */
export const LENS_H: Cols = [
  [0.5, 0],
  [0, 0.5],
];

/** How many ঘর one ঘর becomes: |det|. */
export const areaOf = (c: Cols) => Math.abs(det(c));

/** The patch's four corners: at, at + c₁, at + c₁ + c₂, at + c₂. */
export const patchCorners = (c: Cols, at: XY = [0, 0]): XY[] => [
  at,
  [at[0] + c[0][0], at[1] + c[0][1]],
  [at[0] + c[0][0] + c[1][0], at[1] + c[0][1] + c[1][1]],
  [at[0] + c[1][0], at[1] + c[1][1]],
];

/** The four corners of the ঘর whose lower-left corner is `cell`. */
export const cellPoly = (cell: XY): XY[] => [
  cell,
  [cell[0] + 1, cell[1]],
  [cell[0] + 1, cell[1] + 1],
  [cell[0], cell[1] + 1],
];

/** Area of a polygon (always ≥ 0). */
export const polyArea = (p: readonly XY[]) => {
  let s = 0;
  for (let i = 0; i < p.length; i += 1) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
};

/** A convex polygon clipped to the ঘর at `cell` (Sutherland–Hodgman against its four sides). */
export const clipToCell = (poly: readonly XY[], cell: XY): XY[] => {
  const edges: [number, number, 1 | -1][] = [
    [0, cell[0], 1],
    [0, cell[0] + 1, -1],
    [1, cell[1], 1],
    [1, cell[1] + 1, -1],
  ];
  let out: XY[] = [...poly];
  for (const [ax, v, s] of edges) {
    const inside = (p: XY) => s * (p[ax] - v) >= -1e-12;
    const cross = (p: XY, q: XY): XY => {
      const t = (v - p[ax]) / (q[ax] - p[ax]);
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    };
    const inp = out;
    out = [];
    for (let i = 0; i < inp.length; i += 1) {
      const p = inp[i];
      const q = inp[(i + 1) % inp.length];
      if (inside(q)) {
        if (!inside(p)) out.push(cross(p, q));
        out.push(q);
      } else if (inside(p)) out.push(cross(p, q));
    }
    if (!out.length) break;
  }
  return out;
};

export type Piece = {
  /** the ঘর it was cut from (lower-left corner) */
  cell: XY;
  poly: XY[];
  area: number;
  /** where it slides: a whole number of the lens's columns; (0, 0) stays */
  shift: XY;
  /** which target ঘর it helps fill (index into plan.targets) */
  target: number;
};
export type PatchPlan = { cols: Cols; at: XY; area: number; pieces: Piece[]; targets: XY[] };

const near = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;

/**
 * Cut the patch along the chalk lines and plan the slides. For a lens with
 * whole-number columns and det ≠ 0 (and a whole-number `at`), every piece
 * gets a shift and a target; each target ঘর ends full. Any other lens gets
 * one piece per ঘর with no shift and no targets (nothing to slide: count it
 * another way, like H's quarter).
 */
export const planPatch = (cols: Cols, at: XY = [0, 0]): PatchPlan => {
  const P = patchCorners(cols, at);
  const D = det(cols);
  const xs = P.map((p) => p[0]);
  const ys = P.map((p) => p[1]);
  const pieces: Piece[] = [];
  for (let i = Math.floor(Math.min(...xs)); i < Math.ceil(Math.max(...xs)); i += 1)
    for (let j = Math.floor(Math.min(...ys)); j < Math.ceil(Math.max(...ys)); j += 1) {
      const poly = clipToCell(P, [i, j]);
      const area = poly.length >= 3 ? polyArea(poly) : 0;
      if (area > 1e-9) pieces.push({ cell: [i, j], poly, area, shift: [0, 0], target: -1 });
    }
  const whole = cols.every((c) => c.every(near)) && at.every(near) && Math.abs(D) > 1e-9;
  const targets: XY[] = [];
  if (!whole) return { cols, at, area: Math.abs(D), pieces, targets };
  // two ঘর are in one class when one is a whole number of columns from the other
  const sameClass = (a: XY, b: XY) => {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return near((dx * cols[1][1] - cols[1][0] * dy) / D) && near((cols[0][0] * dy - dx * cols[0][1]) / D);
  };
  const classes: number[][] = [];
  pieces.forEach((p, i) => {
    const c = classes.find((cl) => sameClass(pieces[cl[0]].cell, p.cell));
    if (c) c.push(i);
    else classes.push([i]);
  });
  classes.forEach((cl) => {
    // the target: the class's fullest ঘর (ties: the lowest, then leftmost)
    const best = [...cl].sort((a, b) => pieces[b].area - pieces[a].area || pieces[a].cell[1] - pieces[b].cell[1] || pieces[a].cell[0] - pieces[b].cell[0])[0];
    const t = targets.length;
    targets.push(pieces[best].cell);
    cl.forEach((i) => {
      pieces[i].target = t;
      pieces[i].shift = [pieces[best].cell[0] - pieces[i].cell[0], pieces[best].cell[1] - pieces[i].cell[1]];
    });
  });
  return { cols, at, area: Math.abs(D), pieces, targets };
};

/** Does this piece hang over (has somewhere to slide)? */
export const moves = (p: Piece) => p.shift[0] !== 0 || p.shift[1] !== 0;

/** Which target ঘর are full, given which pieces have slid (slid[i] for pieces[i]). */
export const wholeCells = (plan: PatchPlan, slid: readonly boolean[]) =>
  plan.targets.map((_, t) => plan.pieces.every((p, i) => p.target !== t || !moves(p) || slid[i]));

/** Rina's ফুল stencil: 5 ঘর, a middle and four petals (lower-left corners). */
export const FLOWER_CELLS: XY[] = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** The ফুল stencil's outline (12 corners), the same five ঘর as FLOWER_CELLS. */
export const FLOWER_OUTLINE: XY[] = [
  [0, -1],
  [1, -1],
  [1, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [1, 2],
  [0, 2],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, 0],
];

/** Points carried by the lens, then moved by `at`. */
export const mapPts = (c: Cols, pts: readonly XY[], at: XY = [0, 0]): XY[] => pts.map((p) => [p[0] * c[0][0] + p[1] * c[1][0] + at[0], p[0] * c[0][1] + p[1] * c[1][1] + at[1]]);

// ---------------------------------------------------------------------------
// Colours.

export const PK = {
  ink: "#0f1b2d",
  lime: "#e9e4d8",
  chalk: "#64748b",
  glow: "#fde047",
  lamp: "#f59e0b",
  /** Rina's paint */
  paint: "#ea580c",
  paintDark: "#9a3412",
  /** a piece that hangs over, waiting to slide */
  loose: "#7c3aed",
  bad: "#e11d48",
} as const;

/** A frame for a patch wall: x0…x1, y0…y1 in ঘর, u px per ঘর. */
export const patchFrame = (x0: number, x1: number, y0: number, y1: number, u = 32, pad = 8) => makeFrame(x0, x1, y0, y1, u, pad);

const pathD = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0]).toFixed(2)} ${f.sy(p[1]).toFixed(2)}`).join("") + "Z";

// ---------------------------------------------------------------------------
// Wall pieces.

/**
 * A patch of the whitewashed wall with Rina's chalk grid and the pin (0, 0),
 * as a Plane (fixed ink). `nums` writes a few counts along the edges.
 */
export function PatchWall({ f, label, className = "max-w-[16rem]", pin = true, dark = false, children }: { f: Frame; label: string; className?: string; pin?: boolean; dark?: boolean; children?: ReactNode }) {
  // the frame's size in the id too: previews render screens apart, and their useIds repeat
  const id = `pw${Math.round(f.W)}x${Math.round(f.H)}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  let d = "";
  for (let x = Math.ceil(f.x0); x <= f.x1; x += 1) d += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  for (let y = Math.ceil(f.y0); y <= f.y1; y += 1) d += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} className={`my-0! ${className}`}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={f.W} height={f.H} rx={6} fill={dark ? "#1e293b" : PK.lime} />
      <path d={d} strokeWidth={0.8} stroke={dark ? "#e2e8f0" : PK.chalk} strokeOpacity={dark ? 0.18 : 0.4} fill="none" className="pointer-events-none" />
      <g clipPath={`url(#${id})`}>{children}</g>
      {pin && <circle cx={f.sx(0)} cy={f.sy(0)} r={2.6} fill="#e5e7eb" stroke={PK.ink} strokeWidth={0.9} className="pointer-events-none" />}
    </Plane>
  );
}

/** The stencil's one ঘর of light at `at` (lower-left corner); `faint` for where it was. */
export function UnitTile({ f, at = [0, 0], faint = false }: { f: Frame; at?: XY; faint?: boolean }) {
  const d = pathD(f, cellPoly(at));
  return (
    <g className="pointer-events-none" opacity={faint ? 0.45 : 1}>
      <path d={d} fill={PK.glow} fillOpacity={faint ? 0.25 : 0.75} stroke={PK.lamp} strokeWidth={1.2} strokeDasharray={faint ? "3 2" : undefined} />
    </g>
  );
}

/**
 * The patch of light: the ঘর at `cell` (lower-left corner, default the pin's)
 * carried by the lens, partway by `t` (0 = still the ঘর, 1 = the
 * parallelogram), then moved by `at`. `ghost` draws only a dashed outline;
 * `tone` "light" (yellow) or "paint" (Rina's orange).
 */
export function Patch({ f, cols, cell = [0, 0], at = [0, 0], t = 1, ghost = false, tone = "light" }: { f: Frame; cols: Cols; cell?: XY; at?: XY; t?: number; ghost?: boolean; tone?: "light" | "paint" }) {
  const m = partway(byCols(cols), t);
  const pts = cellPoly(cell).map((p) => {
    const q = m(p);
    return [q[0] + at[0], q[1] + at[1]] as XY;
  });
  const d = pathD(f, pts);
  if (ghost) return <path d={d} fill="none" stroke={tone === "paint" ? PK.paint : PK.lamp} strokeWidth={1.3} strokeDasharray="4 3" className="pointer-events-none" />;
  return (
    <g className="pointer-events-none">
      {tone === "light" && <path d={d} fill={PK.glow} fillOpacity={0.3} stroke={PK.glow} strokeOpacity={0.5} strokeWidth={5} strokeLinejoin="round" />}
      <path d={d} fill={tone === "paint" ? PK.paint : PK.glow} fillOpacity={tone === "paint" ? 0.85 : 0.7} stroke={tone === "paint" ? PK.paintDark : PK.lamp} strokeWidth={1.2} strokeLinejoin="round" />
    </g>
  );
}

/**
 * The patch cut along the chalk lines. Before `cut`, one whole patch. After,
 * its pieces with the cuts drawn; a piece that hangs over is outlined violet
 * and, with `onSlide`, tappable; once slid (slid[i]) it glides by its shift
 * into its target ঘর (CSS transition, ~0.7 s). `tone` as in Patch, or
 * "paper" (a newspaper cut-out).
 */
export function CutPieces({
  f,
  plan,
  cut,
  slid,
  onSlide,
  tone = "light",
}: {
  f: Frame;
  plan: PatchPlan;
  cut: boolean;
  slid: readonly boolean[];
  onSlide?: (i: number) => void;
  tone?: "light" | "paint" | "paper";
}) {
  const fill = tone === "paint" ? PK.paint : tone === "paper" ? "#f8fafc" : PK.glow;
  const edge = tone === "paint" ? PK.paintDark : tone === "paper" ? "#475569" : PK.lamp;
  if (!cut) return <path d={pathD(f, patchCorners(plan.cols, plan.at))} fill={fill} fillOpacity={tone === "paper" ? 1 : 0.75} stroke={edge} strokeWidth={1.2} strokeLinejoin="round" className="pointer-events-none" />;
  return (
    <g>
      {plan.pieces.map((p, i) => {
        const loose = moves(p) && !slid[i];
        const dx = slid[i] ? p.shift[0] * f.u : 0;
        const dy = slid[i] ? -p.shift[1] * f.u : 0;
        const d = pathD(f, p.poly);
        const body = (
          <path
            d={d}
            fill={fill}
            fillOpacity={tone === "paper" ? 1 : loose ? 0.55 : 0.75}
            stroke={loose ? PK.loose : edge}
            strokeWidth={loose ? 1.8 : 1}
            strokeDasharray={loose ? "3 2" : undefined}
            strokeLinejoin="round"
          />
        );
        const tappable = loose && !!onSlide;
        return (
          <g key={i} style={{ transform: `translate(${dx}px, ${dy}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
            {tappable ? (
              <g
                role="button"
                tabIndex={0}
                aria-label="ঝুলে থাকা টুকরা: tap করে ফাঁকা ঘরে সরান"
                className="cursor-pointer"
                onClick={() => onSlide(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSlide(i);
                  }
                }}
              >
                {body}
              </g>
            ) : (
              <g className="pointer-events-none">{body}</g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * The target ঘর: a dashed outline while it has a gap, a firm outline with a
 * small কৌটা number (1, 2, 3 … in the order they fill) once full. `order`
 * gives the fill order; default: target order.
 */
export function TargetCells({ f, plan, slid, numbers = true, order }: { f: Frame; plan: PatchPlan; slid: readonly boolean[]; numbers?: boolean; order?: readonly number[] }) {
  const full = wholeCells(plan, slid);
  const seq = order ?? plan.targets.map((_, i) => i);
  let n = 0;
  const label: Record<number, number> = {};
  seq.forEach((t) => {
    if (full[t]) label[t] = ++n;
  });
  return (
    <g className="pointer-events-none">
      {plan.targets.map((c, t) => {
        const x = f.sx(c[0]);
        const y = f.sy(c[1] + 1);
        return (
          <g key={t}>
            <rect x={x} y={y} width={f.u} height={f.u} fill="none" stroke={full[t] ? PK.ink : PK.chalk} strokeWidth={full[t] ? 1.6 : 1} strokeDasharray={full[t] ? undefined : "3 2"} strokeOpacity={full[t] ? 0.8 : 0.7} />
            {numbers && full[t] && (
              <g key={`n${label[t]}`} className={POP}>
                <circle cx={x + f.u / 2} cy={y + f.u / 2} r={Math.min(9, f.u * 0.28)} fill="white" stroke={PK.ink} strokeWidth={0.9} />
                <text x={x + f.u / 2} y={y + f.u / 2 + 3.4} textAnchor="middle" fontSize={Math.min(10, f.u * 0.3)} fontWeight={800} fontFamily="ui-monospace, monospace" fill={PK.ink}>
                  {label[t]}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Paint over a polygon, filled from the bottom up to `frac` (0…1) of its
 * height, with a CSS transition on the level. `spill` hangs a puddle under
 * it (paint left over, poured out).
 */
export function PaintFill({ f, poly, frac, spill = false }: { f: Frame; poly: readonly XY[]; frac: number; spill?: boolean }) {
  const id = `pf${Math.round(f.u)}${poly.map((p) => `${Math.round(p[0] * 10)}_${Math.round(p[1] * 10)}`).join("").replace(/-/g, "m")}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ys = poly.map((p) => f.sy(p[1]));
  const xs = poly.map((p) => f.sx(p[0]));
  const top = Math.min(...ys);
  const bot = Math.max(...ys);
  const h = (bot - top) * Math.max(0, Math.min(1, frac));
  const d = pathD(f, poly);
  return (
    <g className="pointer-events-none">
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={Math.min(...xs)} y={bot - h} width={Math.max(...xs) - Math.min(...xs)} height={h} fill={PK.paint} fillOpacity={0.88} className="transition-[y,height] duration-1000 ease-out motion-reduce:transition-none" />
      </g>
      <path d={d} fill="none" stroke={PK.paintDark} strokeWidth={1.1} strokeLinejoin="round" />
      {spill && <ellipse cx={(Math.min(...xs) + Math.max(...xs)) / 2} cy={bot + 6} rx={f.u * 0.9} ry={3.4} fill={PK.paint} fillOpacity={0.85} className={POP} />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// HTML chrome: the paint can.

/** One কৌটা রং, as a small drawing. `empty`: opened and used; `bad`: short or spilt (red lid). */
export function Kouta({ size = 18, empty = false, bad = false }: { size?: number; empty?: boolean; bad?: boolean }) {
  return (
    <svg viewBox="0 0 20 24" width={size} height={(size * 24) / 20} aria-hidden="true" className="shrink-0">
      <path d="M6 3.5Q10 -0.5 14 3.5" fill="none" stroke="#475569" strokeWidth={1.1} />
      <rect x={2.5} y={4} width={15} height={18} rx={2} fill={empty ? "#e2e8f0" : "#cbd5e1"} stroke="#475569" strokeWidth={0.9} />
      <rect x={2.5} y={10} width={15} height={6.5} fill={empty ? "#fed7aa" : PK.paint} />
      <ellipse cx={10} cy={4.2} rx={7.5} ry={1.6} fill={bad ? PK.bad : "#94a3b8"} stroke="#475569" strokeWidth={0.7} />
    </svg>
  );
}

/** A row of n কৌটা; the first `used` drawn opened. Wraps in rows of `per`. */
export function KoutaRow({ n, used = 0, size = 16, per = 10, bad = false }: { n: number; used?: number; size?: number; per?: number; bad?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-end justify-center gap-0.5" style={{ maxWidth: `${per * (size + 2)}px` }}>
      {Array.from({ length: n }, (_, i) => (
        <Kouta key={i} size={size} empty={i < used} bad={bad} />
      ))}
    </span>
  );
}

/** A can and a count: "কৌটা 3" (a "?" before it is known). */
export function KoutaCount({ n, label = "কৌটা" }: { n: number | null; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Kouta size={16} />
      <span className="text-sm text-muted">{label}</span>
      <span key={n ?? "q"} className={`font-mono text-lg font-bold ${POP}`}>
        {n === null ? "?" : n}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stage pieces (cast <Stage>, 320 × 180, ground 150).

/** A paint কৌটা standing at (x, y) (its foot), scale s. */
export function StageKouta({ x, y, s = 1, open = false }: { x: number; y: number; s?: number; open?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <rect x={-4} y={-10} width={8} height={10} rx={1} fill="#cbd5e1" stroke="#475569" strokeWidth={0.6} />
      <rect x={-4} y={-6.5} width={8} height={3.5} fill={PK.paint} />
      <ellipse cx={0} cy={-10} rx={4} ry={1} fill={open ? PK.paint : "#94a3b8"} stroke="#475569" strokeWidth={0.5} />
    </g>
  );
}

/** A বেতের মোড়া (stool) standing at (x, y); ~16 high. */
export function StageMora({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <ellipse cx={x} cy={y - 16} rx={10} ry={3} fill="#b08d3c" stroke="#7c5e1e" strokeWidth={0.7} />
      <path d={`M${x - 9} ${y - 15}L${x - 6} ${y}M${x + 9} ${y - 15}L${x + 6} ${y}M${x - 7} ${y - 8}H${x + 7}`} stroke="#7c5e1e" strokeWidth={1.4} />
      <path d={`M${x - 8} ${y - 13}L${x + 6} ${y - 2}M${x + 8} ${y - 13}L${x - 6} ${y - 2}`} stroke="#a47a32" strokeWidth={0.8} />
    </g>
  );
}

/** Rina's তুলি, handle from (x, y) pointing at angle a (degrees); `wet` paints its tip. */
export function StageBrush({ x, y, a = -40, wet = false }: { x: number; y: number; a?: number; wet?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`} className="pointer-events-none">
      <rect x={0} y={-1} width={13} height={2} rx={1} fill="#8b5e34" />
      <path d="M13 -1.6L17.5 -1L17.5 1L13 1.6Z" fill={wet ? PK.paint : "#e7e5e4"} stroke="#57534e" strokeWidth={0.4} />
    </g>
  );
}
