"use client";

import { useState, type ReactNode } from "react";

import { Tup } from "@/components/journey/box";
import { Bubble, Gate, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, pill, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Lit, type XY } from "@/components/journey/plane";
import { LightBhai, Projector, StageBeam, StageWall, heartPath, projectorLens } from "./light-kit";

// Screens for "Math for AI 8.6 — পাইকারের কাঠা, তিন দিকের জায়গা", told as a
// Journey in the author's Bangla-English. The plan is 08_journey_specs.md,
// block 8.6; the source is 08-the-determinant.md §6.
//
// ফিরানির দিন সকাল। The পাইকার buys নানার ধান by his own crooked wooden box:
// তিন কাঠার বাক্স, he says, and pays for 3 কাঠা each time it's filled. নানার
// কাঠা is the true unit cube. The box's three edges from one corner are the
// columns of K = [[2, 1, 1], [1, 1, 0], [0, 1, 3]] (edges (2, 1, 0), (1, 1, 1),
// (1, 0, 3)): det 4, so নানা loses a কাঠা on every box. Walking the top row:
// 2·3 − 1·3 + 1·1 = 4 (all plus would give 10). Its 4 কাঠা show as four equal
// layers along the up-ish edge, one per কাঠা poured.
//
// Nine screens. 1 seals the bet: কম · ঠিক 3 · বেশি · মাপা যায় না (KathaBet).
// 2 straight boxes: 2 × 3 × 1 = 6, and everything doubled, 8 (UnitCube).
// 3 Karim's leaning stack of বস্তা: leaning keeps it 6 (LeanTheStack).
// 4 নানার আব্বার বাক্স N = [[1, 2, 1], [1, 3, 1], [0, 1, 2]], burnt "2": walk
// the top row, minors 5, 2, 1, pieces 5, 4, 1; Karim adds: 10 ≠ 2
// (WalkTheTopRow). 5 predict where the minus goes: 5 − 4 + 1 = 2; then the
// checkerboard, and a line with a zero (Checkerboard). 6 Your turn: the
// পাইকার's box, 4 (PaikarBox). 7 Try it: Check Q6 [[2, 0, 1], [1, 3, 2],
// [0, 1, 1]] = 3, which pile fills it (TryBox). 8 n! against n³ on a clock
// (TooManyTerms). 9 the finale: নানা pours his কাঠা in, 4, and the bet opens
// (BetOpen).
//
// After the screens: the story scenes (PaikarArrives, KarimPushes,
// NanaOldBox, SaminTape, SaminPhone, PaikarPays, LastHeart) and the
// watch-only figures (KathaStake, FlatInSpace, WhichWayBack, CrossOut,
// SixTerms, SignBoard, DiagonalOnly, TriangleWay, TermPaths, BookSlip).
//
// The 3D pictures use one oblique projection: east runs right and a little
// down, north runs up-right (foreshortened), up runs up. Edge colours: the
// first column amber, the second teal, the third violet, as the 2D lens
// columns were amber and teal. The light-wall bits of the bridge come from
// light-kit.tsx (read-only).

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const WOOD = "#c68a4e";
const WOOD_DARK = "#6b3f17";
const KATHA = "#e8bd6f";
const KATHA_DARK = "#7a4f14";
const DHAN = "#f4d160";
const DHAN_DARK = "#a47d12";
const JUTE = "#d9bb8c";
const JUTE_DARK = "#8b6b3e";
const OK = "#0d9488";
const BAD = "#e11d48";
const BLUE = "#2563eb";
const GLOW = "#fde047";
const EDGE = ["#d97706", "#0d9488", "#7c3aed"] as const;
const EDGE_INK = ["#b45309", "#0f766e", "#6d28d9"] as const;

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** What the three numbers of an edge count (for journey/box <Tup of>). One কাঠার কিনারা = 1। */
const EDGE_SLOTS = ["পূবে কত কাঠা", "উত্তরে কত কাঠা", "উপরে কত কাঠা"] as const;

const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** a number with a real minus */
const sg = (n: number) => (n < 0 ? `−${-n}` : `${n}`);

// ---------------------------------------------------------------------------
// 3D, drawn flat. A point (east, north, up) goes to the page by one oblique
// projection; faces facing the viewer (front, top, east side) are drawn, the
// rest are dashed when a box is shown as see-through.

type V3 = readonly [number, number, number];
type M3 = readonly (readonly [number, number, number])[];
type Pj = (p: V3) => XY;

const O3: V3 = [0, 0, 0];
const a3 = (p: V3, q: V3): V3 => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const s3 = (p: V3, t: number): V3 => [p[0] * t, p[1] * t, p[2] * t];
const d3 = (p: V3, q: V3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p: V3, q: V3): V3 => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];

/** where the viewer is: front (south), above, a little east */
const VIEW: V3 = [0.46, -1, 0.438];
const LIGHT: V3 = [-0.3, -0.55, 0.78];
const raw = (p: V3): XY => [p[0] * 0.87 + p[1] * 0.4, p[0] * 0.3 - p[1] * 0.3 - p[2]];
/** a projection with the corner (0, 0, 0) at (x, y) and one কাঠা's edge ≈ U units */
const pjAt =
  (x: number, y: number, U: number): Pj =>
  (p) => {
    const r = raw(p);
    return [x + U * r[0], y + U * r[1]];
  };

/** a matrix's columns: the box's three edges from the corner */
const colsOf = (m: M3): [V3, V3, V3] => [
  [m[0][0], m[1][0], m[2][0]],
  [m[0][1], m[1][1], m[2][1]],
  [m[0][2], m[1][2], m[2][2]],
];
const others = (i: number) => [0, 1, 2].filter((x) => x !== i);
/** the 2 × 2 left after crossing out row i and column j */
const sub2 = (m: M3, i: number, j: number) => {
  const [r0, r1] = others(i);
  const [c0, c1] = others(j);
  return [m[r0][c0], m[r0][c1], m[r1][c0], m[r1][c1]] as const;
};
const minor = (m: M3, i: number, j: number) => {
  const [a, b, c, d] = sub2(m, i, j);
  return a * d - b * c;
};
const sign = (i: number, j: number) => ((i + j) % 2 ? -1 : 1);
const det3 = (m: M3) => [0, 1, 2].reduce((s, j) => s + sign(0, j) * m[0][j] * minor(m, 0, j), 0);
const tupStr = (v: V3) => `(${v.map(sg).join(", ")})`;

/** পাইকারের বাক্স: det 4 (he says 3) */
const K_M: M3 = [
  [2, 1, 1],
  [1, 1, 0],
  [0, 1, 3],
];
/** নানার আব্বার বাক্স, "2" burnt on its side */
const N_M: M3 = [
  [1, 2, 1],
  [1, 3, 1],
  [0, 1, 2],
];
/** the book's Check yourself Q6 */
const Q_M: M3 = [
  [2, 0, 1],
  [1, 3, 2],
  [0, 1, 1],
];
const K_E = colsOf(K_M);
const N_E = colsOf(N_M);
const Q_E = colsOf(Q_M);

type Face = { pts: V3[]; n: V3 };
function boxFaces(at: V3, u: V3, v: V3, w: V3): Face[] {
  const c = (i: number, j: number, k: number) => a3(at, a3(s3(u, i), a3(s3(v, j), s3(w, k))));
  const s = Math.sign(d3(u, cross(v, w))) || 1;
  const vw = cross(v, w);
  const wu = cross(w, u);
  const uv = cross(u, v);
  return [
    { pts: [c(0, 0, 0), c(0, 1, 0), c(0, 1, 1), c(0, 0, 1)], n: s3(vw, -s) },
    { pts: [c(1, 0, 0), c(1, 1, 0), c(1, 1, 1), c(1, 0, 1)], n: s3(vw, s) },
    { pts: [c(0, 0, 0), c(1, 0, 0), c(1, 0, 1), c(0, 0, 1)], n: s3(wu, -s) },
    { pts: [c(0, 1, 0), c(1, 1, 0), c(1, 1, 1), c(0, 1, 1)], n: s3(wu, s) },
    { pts: [c(0, 0, 0), c(1, 0, 0), c(1, 1, 0), c(0, 1, 0)], n: s3(uv, -s) },
    { pts: [c(0, 0, 1), c(1, 0, 1), c(1, 1, 1), c(0, 1, 1)], n: s3(uv, s) },
  ];
}
const shade = (n: V3) => {
  const L = Math.hypot(n[0], n[1], n[2]) * Math.hypot(LIGHT[0], LIGHT[1], LIGHT[2]) || 1;
  return (0.32 * (1 - d3(n, LIGHT) / L)) / 2;
};
const facePath = (pj: Pj, pts: readonly V3[]) =>
  pts
    .map((p, i) => {
      const [x, y] = pj(p);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join("") + "Z";

/**
 * A box (a parallelepiped) with corner `at` and edges u, v, w. `part`: "back"
 * draws only the hidden edges, dashed (for a see-through box, before its
 * contents); "front" only the faces toward the viewer; "all" both.
 */
function Solid({ pj, at = O3, u, v, w, fill, stroke, fo = 1, sw = 1, part = "front", dashed = false }: { pj: Pj; at?: V3; u: V3; v: V3; w: V3; fill: string; stroke: string; fo?: number; sw?: number; part?: "back" | "front" | "all"; dashed?: boolean }) {
  const fs = boxFaces(at, u, v, w);
  const vis = fs.filter((f) => d3(f.n, VIEW) > 1e-9);
  const hid = fs.filter((f) => d3(f.n, VIEW) <= 1e-9);
  return (
    <g className="pointer-events-none">
      {part !== "front" && hid.map((f, i) => <path key={`h${i}`} d={facePath(pj, f.pts)} fill="none" stroke={stroke} strokeWidth={sw * 0.8} strokeDasharray="3 2.5" opacity={0.55} strokeLinejoin="round" />)}
      {part !== "back" &&
        vis.map((f, i) => {
          const d = facePath(pj, f.pts);
          return (
            <g key={i}>
              {fo > 0 && <path d={d} fill={fill} fillOpacity={fo} />}
              {fo > 0 && <path d={d} fill="#000" fillOpacity={shade(f.n) * fo} />}
              <path d={d} fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeDasharray={dashed ? "4 3" : undefined} />
            </g>
          );
        })}
    </g>
  );
}

/** one unit cube with its corner at `at` (নানার কাঠা, or a কাঠা of ধান) */
function Cube({ pj, at, fill = KATHA, stroke = KATHA_DARK, sw = 0.9, fo = 1, dashed = false }: { pj: Pj; at: V3; fill?: string; stroke?: string; sw?: number; fo?: number; dashed?: boolean }) {
  return <Solid pj={pj} at={at} u={[1, 0, 0]} v={[0, 1, 0]} w={[0, 0, 1]} fill={fill} stroke={stroke} sw={sw} fo={fo} dashed={dashed} />;
}

/** cubes of a straight a × b × c box, in pouring order (bottom first, back row first) */
const cubesOf = (dims: V3): V3[] => {
  const out: V3[] = [];
  for (let z = 0; z < dims[2]; z++) for (let y = dims[1] - 1; y >= 0; y--) for (let x = 0; x < dims[0]; x++) out.push([x, y, z]);
  return out;
};
/** far ones first, so near ones cover them */
const byDepth = (cs: readonly V3[]) => [...cs].sort((p, q) => d3(p, VIEW) - d3(q, VIEW));

/** An edge of a box as a tappable arrow: tap it and it tells its three numbers. */
function Edge3({ pj, from = O3, vec, tone, w = 2.4, dashed = false, list }: { pj: Pj; from?: V3; vec: V3; tone: string; w?: number; dashed?: boolean; list?: string }) {
  const a = pj(from);
  const b = pj(a3(from, vec));
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / L;
  const uy = (b[1] - a[1]) / L;
  const hx = b[0] - ux * 7;
  const hy = b[1] - uy * 7;
  return (
    <Lit a={a} b={b} list={list ?? tupStr(vec)} w={w} color={tone}>
      <path d={`M${a[0]} ${a[1]}L${hx} ${hy}`} stroke={tone} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? "4 3" : undefined} />
      <path d={`M${b[0]} ${b[1]}L${hx - uy * 3.6} ${hy + ux * 3.6}L${hx + uy * 3.6} ${hy - ux * 3.6}Z`} fill={tone} />
    </Lit>
  );
}

/** Is the edge from the corner along `e` on the viewer's side (drawn solid) or behind (dashed)? */
const edgeHidden = (u: V3, v: V3, w: V3, which: 0 | 1 | 2) => {
  const fs = boxFaces(O3, u, v, w);
  // the two faces through the corner that contain edge `which`
  const touch = which === 0 ? [2, 4] : which === 1 ? [0, 4] : [0, 2];
  return touch.every((i) => d3(fs[i].n, VIEW) <= 1e-9);
};

/**
 * A crooked box of ধান: wood, see-through, with `layers` of `of` layers of
 * ধান inside (stacked along the third edge, one layer per কাঠা), the three
 * edges as arrows when `edges`.
 */
function Crate({ pj, e, layers = 0, of = 4, fo = 0.3, edges = false, label, pop = -1, grain = DHAN }: { pj: Pj; e: readonly [V3, V3, V3]; layers?: number; of?: number; fo?: number; edges?: boolean; label?: string; pop?: number; grain?: string }) {
  const [u, v, w] = e;
  const step = s3(w, 1 / of);
  const fs = boxFaces(O3, u, v, w);
  const front = fs[2];
  const mid = pj(s3(a3(front.pts[0], front.pts[2]), 0.5));
  return (
    <g>
      <Solid pj={pj} u={u} v={v} w={w} fill={WOOD} stroke={WOOD_DARK} part="back" sw={1.3} />
      {Array.from({ length: Math.min(layers, of) }, (_, i) => (
        <g key={i} className={i === pop ? POP : undefined}>
          <Solid pj={pj} at={s3(step, i)} u={u} v={v} w={step} fill={grain} stroke={DHAN_DARK} sw={0.8} />
        </g>
      ))}
      <Solid pj={pj} u={u} v={v} w={w} fill={WOOD} stroke={WOOD_DARK} fo={fo} sw={1.4} />
      {label && d3(front.n, VIEW) > 0 && (
        <text x={mid[0]} y={mid[1] + 3} textAnchor="middle" fontSize={10} fontWeight={800} fill={WOOD_DARK} opacity={0.85}>
          {label}
        </text>
      )}
      {edges &&
        ([0, 1, 2] as const).map((j) => <Edge3 key={j} pj={pj} vec={e[j]} tone={EDGE[j]} dashed={edgeHidden(u, v, w, j)} />)}
    </g>
  );
}

// ---------------------------------------------------------------------------
// The nine numbers, on a sheet: columns coloured like the box's edges.

function Mat3({
  m,
  x,
  y,
  c = 28,
  cross: cx = null,
  signs = 0,
  hot,
  onPick,
  bad,
  line = null,
  fontSize = 14,
}: {
  m: M3;
  x: number;
  y: number;
  c?: number;
  /** strike this row and this column; the 2 × 2 that is left glows */
  cross?: readonly [number, number] | null;
  /** how many checkerboard signs to show, in reading order */
  signs?: number;
  hot?: (i: number, j: number) => boolean;
  onPick?: (i: number, j: number) => void;
  bad?: (i: number, j: number) => boolean;
  /** a whole row ("r") or column ("c") lit */
  line?: { kind: "r" | "c"; i: number } | null;
  fontSize?: number;
}) {
  const W = 3 * c;
  const sx = (j: number) => x + c * (j + 0.5);
  const sy = (i: number) => y + c * (i + 0.5);
  return (
    <g>
      <path d={`M${x - 3} ${y}h-4v${W}h4M${x + W + 3} ${y}h4v${W}h-4`} fill="none" stroke={INK} strokeWidth={1.4} />
      {line && <rect x={line.kind === "c" ? x + c * line.i + 1 : x + 1} y={line.kind === "r" ? y + c * line.i + 1 : y + 1} width={line.kind === "c" ? c - 2 : W - 2} height={line.kind === "r" ? c - 2 : W - 2} rx={5} fill={BLUE} fillOpacity={0.12} stroke={BLUE} strokeWidth={1.2} className={FADE} />}
      {m.map((row, i) =>
        row.map((n, j) => {
          const struck = !!cx && (i === cx[0] || j === cx[1]);
          const left = !!cx && !struck;
          const isHot = hot?.(i, j) ?? false;
          const s = sign(i, j);
          return (
            <g key={`${i}${j}`} onClick={isHot && onPick ? () => onPick(i, j) : undefined} className={isHot ? "cursor-pointer" : undefined}>
              {left && <rect x={x + c * j + 2} y={y + c * i + 2} width={c - 4} height={c - 4} rx={4} fill={GLOW} fillOpacity={0.55} className={FADE} />}
              {bad?.(i, j) && <rect x={x + c * j + 2} y={y + c * i + 2} width={c - 4} height={c - 4} rx={4} fill={BAD} fillOpacity={0.15} stroke={BAD} strokeWidth={1.2} />}
              {isHot && <rect x={x + c * j + 2.5} y={y + c * i + 2.5} width={c - 5} height={c - 5} rx={5} fill="white" fillOpacity={0.01} stroke={BLUE} strokeWidth={1.3} strokeDasharray="3 2" />}
              <text x={sx(j)} y={sy(i) + fontSize * 0.36} textAnchor="middle" fontSize={fontSize} fontWeight={800} fontFamily={MONO} fill={EDGE_INK[j]} opacity={struck ? 0.25 : 1} className="transition-opacity duration-300 motion-reduce:transition-none">
                {sg(n)}
              </text>
              {signs > i * 3 + j && (
                <text x={x + c * j + 5} y={y + c * i + 10} fontSize={10} fontWeight={800} fontFamily={MONO} fill={s > 0 ? OK : BAD} className={POP}>
                  {s > 0 ? "+" : "−"}
                </text>
              )}
            </g>
          );
        }),
      )}
      {cx && (
        <>
          <Draw key={`r${cx[0]}${cx[1]}`} d={`M${x + 2} ${sy(cx[0])}H${x + W - 2}`} strokeWidth={2} className="stroke-[#e11d48]" />
          <Draw key={`c${cx[0]}${cx[1]}`} d={`M${sx(cx[1])} ${y + 2}V${y + W - 2}`} strokeWidth={2} delay={200} className="stroke-[#e11d48]" />
        </>
      )}
    </g>
  );
}

/** a small tick or cross, drawn (the glyphs render as emoji on Linux) */
function Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <svg viewBox="0 0 12 12" className={`size-4 shrink-0 ${POP}`} aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke={OK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" className={`size-4 shrink-0 ${POP}`} aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke={BAD} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/** a row of small কাঠা of ধান lying on the ground, for piles and spills */
function CubeRow({ pj, n, fill = DHAN, stroke = DHAN_DARK, from = 0 }: { pj: Pj; n: number; fill?: string; stroke?: string; from?: number }) {
  const cs: V3[] = Array.from({ length: n }, (_, i) => [from + (i % 4) * 1.15, 0, Math.floor(i / 4)] as V3);
  return (
    <g>
      {byDepth(cs).map((p) => (
        <g key={p.join()} className={POP}>
          <Cube pj={pj} at={p} fill={fill} stroke={stroke} />
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Four cards: নাসিব কম ধরে · পাইকার ঠিক 3 · সোম বেশি ধরে
//     · করিম মাপা যায় না। A pick is drawn on the box; sealing writes it into
//     the খাতা with a "?". Never marked.

const X1_CARDS = [
  { who: "নাসিব", t: "কম ধরে", line: "হেলানো বাক্স চাপা খায়" },
  { who: "পাইকার", t: "ঠিক 3", line: "বাপ-দাদার আমলের মাপ" },
  { who: "সোম", t: "বেশি ধরে", line: "হেলানো দিকে ফুলে আছে" },
  { who: "করিম", t: "মাপা যায় না", line: "হেলানো জিনিস মাপবে কে" },
];
const X1_PJ = pjAt(18, 146, 34);
const X1_CUBE = pjAt(220, 150, 34);

function X1_Idea({ pick }: { pick: number | null }) {
  const [u, v, w] = K_E;
  const c: V3 = s3(a3(u, a3(v, w)), 0.5);
  const scaled = (t: number) => {
    const at = s3(c, 1 - t);
    return <Solid pj={X1_PJ} at={at} u={s3(u, t)} v={s3(v, t)} w={s3(w, t)} fill="none" stroke={BLUE} fo={0} sw={1.6} dashed />;
  };
  if (pick === 0) return <g key="less" className={FADE}>{scaled(0.8)}</g>;
  if (pick === 2) return <g key="more" className={FADE}>{scaled(1.12)}</g>;
  if (pick === 1)
    return (
      <g key="three" className={FADE}>
        {[1, 2].map((i) => (
          <Cube key={i} pj={X1_CUBE} at={[0, 0, i]} fill="white" stroke={BLUE} fo={0.4} dashed />
        ))}
        <text x={X1_CUBE([1.5, 0, 3])[0] + 6} y={X1_CUBE([1, 0, 3])[1]} fontSize={12} fontWeight={800} fontFamily={MONO} fill={BLUE}>
          × 3
        </text>
      </g>
    );
  if (pick === 3) {
    const a = X1_PJ([0, 0, 1.5]);
    const b = X1_PJ([3, 1, 1.5]);
    return (
      <g key="tape" className={FADE}>
        <path d={`M${a[0] - 6} ${a[1]}L${b[0] + 10} ${b[1]}`} stroke="#eab308" strokeWidth={5} strokeLinecap="round" />
        <path d={`M${a[0] - 6} ${a[1]}L${b[0] + 10} ${b[1]}`} stroke={INK} strokeWidth={0.8} strokeDasharray="1 4" />
        <text x={b[0] + 16} y={b[1] + 4} fontSize={16} fontWeight={800} fill={BLUE}>
          ?
        </text>
      </g>
    );
  }
  return null;
}

export function KathaBet() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(700);
  const k = !sealed ? 0 : act.running ? act.k : 2;
  const seal = () => {
    if (pick === null || sealed) return;
    setSealed(true);
    act.play(2, () => pass("বাজি সিল হলো। আগে নানার কাঠা।"));
  };
  return (
    <>
      <svg viewBox="0 0 300 170" className="mx-auto block h-auto w-full max-w-[19rem]" role="img" aria-label="পাইকারের হেলানো কাঠের বাক্স, গায়ে লেখা 3 কাঠা; পাশে নানার চারকোনা কাঠা; বেছে নেওয়া আন্দাজটা বাক্সের উপর আঁকা">
        <rect width={300} height={170} rx={10} fill="#f6efe2" />
        <Crate pj={X1_PJ} e={K_E} label="3 কাঠা" fo={0.85} />
        <X1_Idea pick={pick} />
        <Cube pj={X1_CUBE} at={O3} />
        <text x={X1_CUBE([0.5, 0, 0])[0] + 4} y={164} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={INK}>
          নানার কাঠা
        </text>
      </svg>
      <div className="mx-auto mt-2 flex max-w-[17rem] items-center justify-center gap-1.5 rounded-md border border-[#d6c9a3] bg-[#fbf6e8] px-3 py-1.5 text-sm text-[#0f1b2d]">
        <span className="font-semibold">খাতা:</span>
        <span>এক বাক্সে ধরে</span>
        <span className="inline-block min-w-12 border-b border-dashed border-[#0f1b2d]/60 text-center font-bold">{k >= 1 && pick !== null ? <span className={`${POP} inline-block`}>{X1_CARDS[pick].t}</span> : " "}</span>
        {k >= 2 && <span className={`${POP} inline-block font-bold text-cat-blue`}>?</span>}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={pick === i ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => setPick(i)}>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm">
                <span className="font-semibold">{c.who}:</span> {c.t}
              </span>
              {!(sealed && pick !== i) && <span className="text-xs text-muted">{c.line}</span>}
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" className={primaryBtn} disabled={pick === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 2}>পাইকারের বাক্সে আসলে কত ধরে? একটা আন্দাজ বেছে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · নানার কাঠা fills two straight boxes: 2 × 3 × 1 = 6, and the box with
//     every side doubled, 2 × 2 × 2 = 8 (8.5's promise). A tap pours কাঠা
//     after কাঠা, back row first, the count running.

const X2_BOXES = [
  { dims: [2, 3, 1] as V3, name: "সোজা বাক্স", pj: pjAt(20, 118, 33) },
  { dims: [2, 2, 2] as V3, name: "সব দিকে দুইগুণ", pj: pjAt(180, 118, 33) },
];
const vol = (d: V3) => d[0] * d[1] * d[2];

function X2_Box({ i, n }: { i: number; n: number }) {
  const { dims, pj } = X2_BOXES[i];
  const u: V3 = [dims[0], 0, 0];
  const v: V3 = [0, dims[1], 0];
  const w: V3 = [0, 0, dims[2]];
  const cs = cubesOf(dims).slice(0, n);
  return (
    <g>
      <Solid pj={pj} u={u} v={v} w={w} fill="white" stroke={WOOD_DARK} part="back" sw={1.2} />
      {byDepth(cs).map((p) => (
        <g key={p.join()} className={POP}>
          <Cube pj={pj} at={p} fill={DHAN} stroke={DHAN_DARK} />
        </g>
      ))}
      <Solid pj={pj} u={u} v={v} w={w} fill={WOOD} stroke={WOOD_DARK} fo={0.12} sw={1.3} />
      {([u, v, w] as const).map((e, j) => (
        <Edge3 key={j} pj={pj} vec={e} tone={EDGE[j]} w={2} dashed={edgeHidden(u, v, w, j as 0 | 1 | 2)} />
      ))}
    </g>
  );
}

export function UnitCube() {
  const pass = useGate();
  const [full, setFull] = useSeed<boolean[]>("full", [false, false]);
  const [cur, setCur] = useState<number | null>(null);
  const play = usePlay(170);
  const pour = (i: number) => {
    if (play.running || full[i]) return;
    setCur(i);
    play.play(vol(X2_BOXES[i].dims), () => {
      const next = full.map((f, j) => f || j === i);
      setFull(next);
      setCur(null);
      if (next.every(Boolean)) pass("সোজা বাক্স: তিন দিক গুণ।");
    });
  };
  const count = (i: number) => (full[i] ? vol(X2_BOXES[i].dims) : cur === i && play.running ? play.k : 0);
  return (
    <>
      <svg viewBox="0 0 320 150" className="mx-auto block h-auto w-full max-w-[21rem]" role="img" aria-label="দুইটা সোজা বাক্স: বামেরটা পূবে 2, উত্তরে 3, উপরে 1; ডানেরটা তিন দিকেই 2; ভেতরে নানার কাঠার মাপে ধান">
        <rect width={320} height={150} rx={10} fill="#f6efe2" />
        <X2_Box i={0} n={count(0)} />
        <X2_Box i={1} n={count(1)} />
      </svg>
      <div className="mt-1 grid grid-cols-2 gap-2 text-center">
        {X2_BOXES.map((b, i) => (
          <div key={b.name} className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold">{b.name}</span>
            <span className="font-mono text-sm tabular-nums">
              {full[i] ? (
                <span className={`${POP} inline-block`}>
                  {b.dims.join(" × ")} = {vol(b.dims)}
                </span>
              ) : (
                <span>{count(i)} কাঠা</span>
              )}
            </span>
            <button type="button" className={`${quietBtn} h-9! px-4! text-sm`} disabled={full[i] || play.running} onClick={() => pour(i)}>
              {full[i] ? `${vol(b.dims)} কাঠা` : "কাঠা ঢালুন"}
            </button>
          </div>
        ))}
      </div>
      <Task done={full.every(Boolean)}>দুইটা বাক্সেই নানার কাঠা দিয়ে ধান ঢালুন। কয় কাঠায় ভরে, গুনুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Karim's stack: three layers of two বস্তা. A push slides every layer
//     a little more than the one below; the stack leans, the third edge goes
//     (0, 0, 3) → (3, 0, 3), and the count stays 6.

const X3_PJ = pjAt(40, 132, 31);

function X3_Stack({ s }: { s: number }) {
  const bags: V3[] = [];
  for (let z = 0; z < 3; z++) for (let x = 0; x < 2; x++) bags.push([x + (z * s) / 3, 0, z]);
  const w: V3 = [s, 0, 3];
  return (
    <g>
      <Solid pj={X3_PJ} u={[2, 0, 0]} v={[0, 1, 0]} w={w} fill="none" stroke={BLUE} part="back" sw={1.2} />
      {byDepth(bags).map((p, i) => (
        <g key={i}>
          <Solid pj={X3_PJ} at={[p[0] + 0.04, 0.04, p[2]]} u={[0.92, 0, 0]} v={[0, 0.92, 0]} w={[0, 0, 0.94]} fill={JUTE} stroke={JUTE_DARK} sw={0.9} />
          {(() => {
            const a = X3_PJ([p[0] + 0.2, 0.04, p[2] + 0.5]);
            const b = X3_PJ([p[0] + 0.8, 0.04, p[2] + 0.5]);
            return <path d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke={JUTE_DARK} strokeWidth={0.7} strokeDasharray="2 2" />;
          })()}
        </g>
      ))}
      <Solid pj={X3_PJ} u={[2, 0, 0]} v={[0, 1, 0]} w={w} fill="none" stroke={BLUE} fo={0} sw={1.2} dashed />
      <Edge3 pj={X3_PJ} vec={[2, 0, 0]} tone={EDGE[0]} w={2} />
      <Edge3 pj={X3_PJ} vec={[0, 1, 0]} tone={EDGE[1]} w={2} dashed />
      <Edge3 pj={X3_PJ} vec={w} tone={EDGE[2]} w={2} list={tupStr([Math.round(s), 0, 3])} />
    </g>
  );
}

export function LeanTheStack() {
  const pass = useGate();
  const [lean, setLean] = useSeed("lean", 0);
  const [s] = useTween([lean], 700);
  const push = () => {
    if (lean >= 3) return;
    const n = lean + 1;
    setLean(n);
    if (n === 3) pass("হেলালে ধান কমে না।");
  };
  const hand = X3_PJ([(2 * lean) / 3 - 0.35, 0, 2.5]);
  return (
    <>
      <svg viewBox="0 0 300 150" className="mx-auto block h-auto w-full max-w-[20rem]" role="img" aria-label="করিমের বস্তার stack: তিন তলা, প্রতি তলায় দুইটা বস্তা; ঠেলা দিলে উপরের তলাগুলো পূবে সরে, stack হেলে যায়">
        <rect width={300} height={150} rx={10} fill="#f6efe2" />
        <X3_Stack s={s} />
        <g style={{ transform: `translate(${hand[0] - 20}px, ${hand[1]}px)` }} className="transition-transform duration-700 motion-reduce:transition-none">
          <path d="M0 0h14" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <path d="M14 -4l5 4l-5 4Z" fill={INK} />
        </g>
      </svg>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
        <span>
          বস্তা: <b className="font-mono">6</b>
        </span>
        <span>
          মেঝে: <b className="font-mono">2 × 1</b>
        </span>
        <span>
          উঁচু: <b className="font-mono">3</b>
        </span>
      </div>
      <div className="mt-1 text-center font-mono text-sm text-muted">
        <Tup v={[2, 0, 0]} of={EDGE_SLOTS} /> · <Tup v={[0, 1, 0]} of={EDGE_SLOTS} /> · <Tup v={[lean, 0, 3]} of={EDGE_SLOTS} />
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <button type="button" className={primaryBtn} disabled={lean >= 3} onClick={push}>
          ঠেলুন
        </button>
        <button type="button" className={quietBtn} disabled={lean === 0} onClick={() => setLean(0)}>
          সোজা করুন
        </button>
      </div>
      <Task done={lean >= 3}>করিমের মতো stack টা ঠেলুন, তিনবার। বস্তা কমে কি না দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · নানার আব্বার বাক্স, "2" burnt on it. The reader taps the top row's
//     numbers; each tap strikes its row and column, the 2 × 2 left glows, its
//     ad − bc runs, and a piece (number × that 2 × 2) drops into the tray.
//     Karim adds the pieces: 10. The box says 2.

const X4_PJ = pjAt(10, 118, 25);

function OldBox({ pj }: { pj: Pj }) {
  const [u, v, w] = N_E;
  const fs = boxFaces(O3, u, v, w);
  const mid = pj(s3(a3(fs[2].pts[0], fs[2].pts[2]), 0.5));
  return (
    <g>
      <Solid pj={pj} u={u} v={v} w={w} fill="#a86b36" stroke={WOOD_DARK} sw={1.3} />
      <text x={mid[0]} y={mid[1] + 6} textAnchor="middle" fontSize={17} fontWeight={900} fontFamily={MONO} fill="#3b1d06" opacity={0.85}>
        2
      </text>
    </g>
  );
}

export function WalkTheTopRow() {
  const pass = useGate();
  const [done, setDone] = useSeed<boolean[]>("done", [false, false, false]);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const play = usePlay(520);
  const tap = (_i: number, j: number) => {
    if (play.running || done[j]) return;
    setCur(j);
    play.play(4, () => {
      const next = done.map((d, x) => d || x === j);
      setDone(next);
      if (next.every(Boolean)) pass("উপরের সারি: সংখ্যা × বাকি 2 × 2।");
    });
  };
  const k = play.running ? play.k : cur !== null ? 4 : 0;
  const all = done.every(Boolean) && !play.running;
  const sub = cur !== null ? sub2(N_M, 0, cur) : null;
  return (
    <>
      <svg viewBox="0 0 320 132" className="mx-auto block h-auto w-full max-w-[21rem]" role="img" aria-label="নানার আব্বার হেলানো বাক্স, গায়ে পোড়া দাগে 2; পাশে বাক্সের নয়টা সংখ্যা, উপরের সারির সংখ্যায় চাপ দিলে তার সারি আর কলাম কাটা পড়ে">
        <rect width={320} height={132} rx={10} fill="#f6efe2" />
        <OldBox pj={X4_PJ} />
        <Mat3 m={N_M} x={200} y={14} c={34} fontSize={16} cross={cur !== null && k >= 1 ? [0, cur] : null} hot={(i, j) => i === 0 && !done[j] && !play.running} onPick={tap} />
      </svg>
      <div className="mt-1 min-h-7 text-center font-mono text-base">
        {sub && k >= 3 && (
          <span key={cur} className={FADE}>
            {sg(sub[0])}·{sg(sub[3])} − {sg(sub[1])}·{sg(sub[2])} = <b>{sg(minor(N_M, 0, cur!))}</b>
          </span>
        )}
      </div>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((j) => {
          const show = done[j] || (cur === j && k >= 4);
          return (
            <div key={j} className="flex h-10 items-center justify-center rounded-lg border border-border font-mono text-sm">
              {show ? (
                <span className={`${POP} inline-block`}>
                  <span style={{ color: EDGE_INK[j] }}>{N_M[0][j]}</span> × {minor(N_M, 0, j)} = <b>{N_M[0][j] * minor(N_M, 0, j)}</b>
                </span>
              ) : (
                <span className="text-muted">?</span>
              )}
            </div>
          );
        })}
      </div>
      {all && (
        <div className={`${FADE} mt-2 text-center text-sm`}>
          <span>করিম বললো, যোগ করে দাও: </span>
          <span className="font-mono font-bold">5 + 4 + 1 = 10</span>
          <span className="ml-1.5 font-semibold text-danger">বাক্সে লেখা 2।</span>
        </div>
      )}
      <Task done={all}>উপরের সারির তিনটা সংখ্যায় একে একে চাপ দিন। প্রতিটার পরে কী বাকি থাকে, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Predict where the minus goes: 5 + 4 − 1 · 5 − 4 + 1 · −5 + 4 + 1. The
//     pick plays as কাঠা poured in and taken out (plus pieces first); only
//     5 − 4 + 1 leaves the 2 the box says. Then the checkerboard of signs
//     pops onto the sheet, and the reader expands along a line: a line with
//     the zero needs one 2 × 2 fewer.

const X5_PIECES = [5, 4, 1];
const X5_OPTS: { t: string; s: number[] }[] = [
  { t: "5 + 4 − 1", s: [1, 1, -1] },
  { t: "5 − 4 + 1", s: [1, -1, 1] },
  { t: "−5 + 4 + 1", s: [-1, 1, 1] },
];
const X5_RIGHT = 1;
const X5_NOPE = ["", "", ""];
X5_NOPE[0] = "ধান হলো 8 কাঠা। বাক্সে লেখা 2। এত ধান এই বাক্সে ধরে না।";
X5_NOPE[2] = "সব ধান বের হয়ে গেলো: 0। 0 মানে চ্যাপ্টা বাক্স (8.4). এই বাক্সে তো 2 কাঠা ধরে।";

/** the order a pick plays: plus pieces first, then the minus one; the running total after each */
const x5Run = (s: number[]) => {
  const order = [0, 1, 2].sort((a, b) => s[b] - s[a]);
  const totals: number[] = [];
  let t = 0;
  for (const i of order) {
    t += s[i] * X5_PIECES[i];
    totals.push(t);
  }
  return { order, totals };
};

type X5Line = { kind: "r" | "c"; i: number };
const X5_LINES: X5Line[] = [
  { kind: "r", i: 0 },
  { kind: "r", i: 1 },
  { kind: "r", i: 2 },
  { kind: "c", i: 0 },
  { kind: "c", i: 1 },
  { kind: "c", i: 2 },
];
const cellsOf = (l: X5Line): [number, number][] => [0, 1, 2].map((t) => (l.kind === "r" ? [l.i, t] : [t, l.i]));
const hasZero = (l: X5Line) => cellsOf(l).some(([i, j]) => N_M[i][j] === 0);

const X5_PJ = pjAt(12, 66, 15);

export function Checkerboard() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [board, setBoard] = useSeed("board", false);
  const [line, setLine] = useSeed<number | null>("line", null);
  const [miss, setMiss] = useState(0);
  const run = usePlay(650);
  const signs = usePlay(110);
  const terms = usePlay(600);

  const choose = (i: number) => {
    if (run.running || board) return;
    setGuess(i);
    run.play(3, () => {
      if (i === X5_RIGHT) signs.play(9, () => setBoard(true));
      else setMiss((m) => m + 1);
    });
  };
  const pickLine = (n: number) => {
    if (terms.running) return;
    setLine(n);
    terms.play(4, () => {
      if (hasZero(X5_LINES[n])) pass("যেই সারিতে শূন্য বেশি, সেটা ধরো।");
    });
  };

  const over = guess !== null && !run.running;
  const played = guess === null ? null : x5Run(X5_OPTS[guess].s);
  const rk = guess === null ? 0 : run.running ? run.k : 3;
  const shown = played && rk > 0 ? played.totals[rk - 1] : 0;
  const peak = played ? Math.max(0, ...played.totals.slice(0, rk)) : 0;
  const nSigns = board ? 9 : signs.running ? signs.k : 0;
  const lk = line === null ? 0 : terms.running ? terms.k : 4;

  if (!board && !signs.running) {
    return (
      <>
        <div className="mx-auto flex max-w-[20rem] items-center justify-center gap-1.5 font-mono text-base">
          {X5_PIECES.map((p, i) => {
            const s = guess !== null && rk > 0 ? X5_OPTS[guess].s[i] : 0;
            return (
              <span key={i} className="flex items-center gap-1">
                <span className={`w-4 text-center font-bold ${s < 0 ? "text-danger" : "text-accent-text"}`}>{s === 0 ? "?" : s > 0 ? "+" : "−"}</span>
                <span className="rounded-md border border-border px-2 py-0.5">
                  <span style={{ color: EDGE_INK[i] }}>{N_M[0][i]}</span> × {minor(N_M, 0, i)}
                </span>
              </span>
            );
          })}
        </div>
        <svg viewBox="0 0 300 78" className="mx-auto mt-2 block h-auto w-full max-w-[19rem]" role="img" aria-label="নানার আব্বার বাক্স, গায়ে 2; পাশে কাঠা কাঠা ধান, বেছে নেওয়া চিহ্নে যোগ-বিয়োগ হয়">
          <rect width={300} height={78} rx={10} fill="#f6efe2" />
          <OldBox pj={pjAt(10, 64, 12)} />
          {Array.from({ length: 10 }, (_, i) => {
            const on = i < shown;
            const gone = !on && i < peak;
            const at: V3 = [i * 1.1, 0, 0];
            if (!on && !gone) return <Cube key={i} pj={pjAt(88, 58, 15)} at={at} fill="white" stroke="#cbd5e1" fo={0.5} dashed />;
            return (
              <g key={`${i}${on}`} className={on ? POP : FADE} opacity={gone ? 0.35 : 1}>
                <Cube pj={pjAt(88, 58, 15)} at={at} fill={gone ? "#fecdd3" : DHAN} stroke={gone ? BAD : DHAN_DARK} />
              </g>
            );
          })}
          <text x={292} y={20} textAnchor="end" fontSize={13} fontWeight={800} fontFamily={MONO} fill={over ? (guess === X5_RIGHT ? OK : BAD) : INK}>
            {guess === null ? "" : `${shown} কাঠা`}
          </text>
        </svg>
        <div className="mt-2 grid gap-1.5">
          {X5_OPTS.map((o, i) => (
            <Choice key={o.t} n={i} look={guess === i && over ? (i === X5_RIGHT ? "right" : "wrong") : "idle"} disabled={run.running} onClick={() => choose(i)}>
              <span className="font-mono">{o.t}</span>
            </Choice>
          ))}
        </div>
        {over && guess !== X5_RIGHT && <Nope key={miss}>{X5_NOPE[guess!]}</Nope>}
        <Task done={false}>আগে guess দিন: minus টা কোন piece এ বসলে বাক্সের 2 মিলবে?</Task>
      </>
    );
  }

  const L = line === null ? null : X5_LINES[line];
  const cells = L ? cellsOf(L) : [];
  const sum = cells.reduce((s, [i, j]) => s + sign(i, j) * N_M[i][j] * minor(N_M, i, j), 0);
  return (
    <>
      <svg viewBox="0 0 300 160" className="mx-auto block h-auto w-full max-w-[19rem]" role="img" aria-label="নানার আব্বার বাক্সের নয়টা সংখ্যা, প্রতিটা ঘরে দাবার ছকের মতো + আর − চিহ্ন; বামে তিনটা সারি, উপরে তিনটা কলাম বেছে নেওয়া যায়">
        <rect width={300} height={160} rx={10} fill="#f6efe2" />
        <OldBox pj={X5_PJ} />
        <Mat3 m={N_M} x={150} y={38} c={36} fontSize={16} signs={nSigns} line={L} />
        {board &&
          X5_LINES.map((l, n) => {
            const x = l.kind === "r" ? 108 : 150 + 36 * l.i + 4;
            const y = l.kind === "r" ? 38 + 36 * l.i + 8 : 10;
            const w = l.kind === "r" ? 36 : 28;
            return (
              <g key={n} onClick={() => pickLine(n)} className="cursor-pointer">
                <rect x={x} y={y} width={w} height={20} rx={6} fill={line === n ? BLUE : "white"} stroke={BLUE} strokeWidth={1.2} />
                <text x={x + w / 2} y={y + 14} textAnchor="middle" fontSize={10} fontWeight={700} fill={line === n ? "white" : BLUE}>
                  {l.kind === "r" ? `সারি ${l.i + 1}` : `${l.i + 1}`}
                </text>
              </g>
            );
          })}
        {board && (
          <text x={150 + 54} y={8} textAnchor="middle" fontSize={8.5} fill="#64748b">
            কলাম
          </text>
        )}
      </svg>
      <div className="mt-1 min-h-14 text-center font-mono text-sm leading-relaxed">
        {cells.map(([i, j], t) => {
          if (lk <= t) return null;
          const s = sign(i, j);
          const a = N_M[i][j];
          const mm = minor(N_M, i, j);
          const zero = a === 0 || mm === 0;
          return (
            <span key={`${line}${t}`} className={`${POP} mx-1 inline-block ${zero ? "text-muted line-through" : ""}`}>
              {s > 0 ? "+" : "−"} {a} × {mm}
            </span>
          );
        })}
        {lk >= 4 && (
          <div className={`${POP} font-bold`}>
            = {sum} <span className="font-sans font-semibold text-accent-text">বাক্সের সাথে মিললো</span>
          </div>
        )}
      </div>
      {line !== null && lk >= 4 && !hasZero(X5_LINES[line]) && <Nope key={line}>এটাও 2। তবে তিনটা 2 × 2 লাগলো। শূন্য আছে এমন একটা line ধরুন।</Nope>}
      <Task done={line !== null && lk >= 4 && hasZero(X5_LINES[line])}>চিহ্নের ছক বসে গেছে। এবার বামের সারি বা উপরের কলাম, যেকোনো একটায় চাপ দিয়ে হাঁটুন। কাজ সবচেয়ে কম কোনটায়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn: the পাইকার's box. For each top-row number the reader sets
//     the sign and the 2 × 2 left behind (a tap on a row crosses out on the
//     sheet); then pours: the pieces add up and that many কাঠা go into the
//     box, layer by layer. Too many spill beside it, too few leave the top
//     empty; wrong pieces go red.

const X6_PJ = pjAt(10, 160, 35);
const X6_SPILL = pjAt(196, 170, 15);
const X6_RIGHT_S = [1, -1, 1];
const X6_RIGHT_M = [0, 1, 2].map((j) => minor(K_M, 0, j));
/** what the box really holds: 4 */
const K_DET = det3(K_M);

export function PaikarBox() {
  const pass = useGate();
  const [sgs, setSgs] = useSeed<number[]>("sgs", [1, 1, 1]);
  const [mins, setMins] = useSeed<number[]>("mins", [0, 0, 0]);
  const [focus, setFocus] = useSeed("focus", 0);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const play = usePlay(330);
  const total = [0, 1, 2].reduce((s, j) => s + sgs[j] * K_M[0][j] * mins[j], 0);
  const fillN = Math.max(0, Math.min(total, K_DET));
  const spillN = Math.max(0, Math.min(total - K_DET, 8));
  const ticks = 3 + fillN + spillN;
  const k = !ran ? 0 : play.running ? play.k : ticks;
  const minOk = mins.map((m, j) => m === X6_RIGHT_M[j]);
  const right = minOk.every(Boolean) && sgs.every((s, j) => s === X6_RIGHT_S[j]);
  const settled = ran && !play.running;

  const edit = (f: () => void) => {
    if (play.running) return;
    setRan(false);
    f();
  };
  const go = () => {
    if (play.running) return;
    setRan(true);
    const ok = right;
    play.play(ticks, () => (ok ? pass("পাইকারের বাক্সে 4 কাঠা, 3 না।") : setMiss((m) => m + 1)));
  };
  const layers = Math.max(0, Math.min(k - 3, fillN));
  const spill = Math.max(0, k - 3 - fillN);
  const nope = !settled || right ? null : !minOk.every(Boolean) ? "লাল piece টা দেখুন। ওই সংখ্যার সারি আর কলাম কেটে যে 2 × 2 থাকে, তার ad − bc আবার করুন।" : "Piece গুলো ঠিক আছে। চিহ্ন দেখুন: উপরের সারিতে + − +।";
  const fillNote = !settled ? null : total > 4 ? `${total} কাঠা ঢাললেন। 4 কাঠাতেই বাক্স ভরে গেলো, বাকিটা উপচে পড়লো।` : total < 4 ? `${Math.max(total, 0)} কাঠায় বাক্স ভরলো না, উপরে ফাঁকা।` : "";

  return (
    <>
      <svg viewBox="0 0 320 180" className="mx-auto block h-auto w-full max-w-[21rem]" role="img" aria-label="পাইকারের হেলানো বাক্স, তিনটা কিনারা তিন রঙে; পাশে বাক্সের নয়টা সংখ্যা; ঢাললে ভেতরে ধানের তলা ওঠে">
        <rect width={320} height={180} rx={10} fill="#f6efe2" />
        <Crate pj={X6_PJ} e={K_E} layers={layers} pop={layers - 1} edges />
        <Mat3 m={K_M} x={206} y={16} c={32} fontSize={15} cross={[0, focus]} bad={(i, j) => settled && !right && i === 0 && !minOk[j]} />
        {spill > 0 && <CubeRow pj={X6_SPILL} n={spill} fill="#fecdd3" stroke={BAD} />}
        {settled && right && (
          <text x={250} y={140} textAnchor="middle" fontSize={13} fontWeight={800} fill={OK} className={POP}>
            ঠিক ভরলো
          </text>
        )}
      </svg>
      <div className="mt-1 grid gap-1">
        {[0, 1, 2].map((j) => (
          <div key={j} onClick={() => setFocus(j)} className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-1 ${focus === j ? "border-cat-blue bg-cat-blue/5" : "border-border"} ${settled && !right && !minOk[j] ? "border-danger bg-danger/5" : ""}`}>
            <button type="button" aria-label="চিহ্ন বদলান" className={`${pill(sgs[j] < 0)} w-10`} onClick={() => edit(() => setSgs(sgs.map((s, x) => (x === j ? -s : s))))}>
              {sgs[j] > 0 ? "+" : "−"}
            </button>
            <span className="font-mono text-lg font-bold" style={{ color: EDGE_INK[j] }}>
              {K_M[0][j]}
            </span>
            <span className="font-mono">×</span>
            <Stepper value={mins[j]} min={-9} max={9} label="বাকি 2 × 2" onChange={(v) =>
                edit(() => {
                  setFocus(j);
                  setMins(mins.map((m, x) => (x === j ? v : m)));
                })
              } />
            <span className="w-10 text-right font-mono text-sm tabular-nums text-muted">{k > j ? `${sg(sgs[j] * K_M[0][j] * mins[j])}` : ""}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" className={primaryBtn} disabled={play.running} onClick={go}>
          বাক্সে ঢালুন
        </button>
        {k >= 3 && <span className={`${POP} font-mono text-lg font-bold`}>= {sg(total)} কাঠা</span>}
      </div>
      {nope && (
        <Nope key={miss}>
          {fillNote} {nope}
        </Nope>
      )}
      <Task done={settled && right}>উপরের সারি ধরে হাঁটুন: প্রতিটা সংখ্যার চিহ্ন আর বাকি 2 × 2 বসান। তারপর বাক্সে ঢালুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it (Check Q6): [[2, 0, 1], [1, 3, 2], [0, 1, 1]] = 3. Three piles
//     of কাঠা (2 · 5 · 3); the picked pile is poured in, one কাঠা a tick. 2
//     leaves the top empty, 5 spills two, 3 fills it exactly.

const X7_PILES = [2, 5, 3];
const X7_RIGHT = 2;
const X7_PJ = pjAt(12, 116, 26);
const X7_SPILL = pjAt(170, 124, 14);
const X7_NOPE = ["", "", ""];
X7_NOPE[0] = "দুই কাঠায় বাক্সের উপরে ফাঁকা থাকলো। উপরের সারি ধরে হাঁটুন: 0 এর term টা বাদ।";
X7_NOPE[1] = "তিন কাঠাতেই বাক্স ভরে গেলো। বাকি দুই কাঠা উপচে পড়লো।";

function X7_Pile({ n }: { n: number }) {
  const pj = pjAt(6, 52, 15);
  return (
    <svg viewBox="0 0 80 58" className="h-auto w-full max-w-[5rem]" aria-hidden="true">
      <CubeRow pj={pj} n={n} />
    </svg>
  );
}

export function TryBox() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(380);
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    play.play(X7_PILES[i], () => (i === X7_RIGHT ? pass("শূন্যের term বাদ: 2·1 + 1·1 = 3।") : setMiss((m) => m + 1)));
  };
  const n = pick === null ? 0 : play.running ? play.k : X7_PILES[pick];
  const over = pick !== null && !play.running;
  return (
    <>
      <svg viewBox="0 0 320 134" className="mx-auto block h-auto w-full max-w-[21rem]" role="img" aria-label="বইয়ের বাক্স, তিনটা কিনারা তিন রঙে, পাশে নয়টা সংখ্যা; বেছে নেওয়া কাঠাগুলো বাক্সে ঢালা হয়">
        <rect width={320} height={134} rx={10} fill="#f6efe2" />
        <Crate pj={X7_PJ} e={Q_E} layers={Math.min(n, 3)} of={3} pop={Math.min(n, 3) - 1} edges />
        <Mat3 m={Q_M} x={206} y={12} c={28} fontSize={14} />
        {n > 3 && <CubeRow pj={X7_SPILL} n={n - 3} fill="#fecdd3" stroke={BAD} />}
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X7_PILES.map((p, i) => (
          <Choice key={i} n={i} look={pick === i && over ? (i === X7_RIGHT ? "right" : "wrong") : "idle"} disabled={play.running} onClick={() => choose(i)}>
            <span className="flex flex-col items-center">
              <X7_Pile n={p} />
              <span className="font-mono text-sm font-bold">{p} কাঠা</span>
            </span>
          </Choice>
        ))}
      </div>
      {over && pick !== X7_RIGHT && <Nope key={miss}>{X7_NOPE[pick!]}</Nope>}
      <Task done={over && pick === X7_RIGHT}>কোন স্তূপটা ঢাললে বাক্স ঠিক ভরে? উপরের সারি ধরে হিসাব করে বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · n! against n³. The reader picks a size n; an n × n sheet of dots grows,
//     and two markers ride a clock line (a computer doing 100 কোটি গুণ a
//     second): walking the rows needs n! terms, making it triangular about
//     n³. At n = 20: 77 বছর against a blink.

const X8_NS = [2, 3, 4, 5, 10, 15, 18, 20];
const fact = (n: number) => {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
};
const X8_SPEED = 1e9;
const X8_X0 = 104;
const X8_X1 = 306;
const X8_L0 = -9;
const X8_L1 = 10;
const x8x = (t: number) => {
  const l = Math.max(X8_L0, Math.min(X8_L1, Math.log10(t)));
  return X8_X0 + ((l - X8_L0) / (X8_L1 - X8_L0)) * (X8_X1 - X8_X0);
};
const X8_TICKS: [number, string][] = [
  [1, "1 সেকেন্ড"],
  [86400, "1 দিন"],
  [3.156e9, "100 বছর"],
];
const x8Time = (t: number) => {
  if (t < 1) return "1 সেকেন্ডের কম";
  if (t < 60) return `${Math.round(t)} সেকেন্ড`;
  if (t < 3600) return `${Math.round(t / 60)} মিনিট`;
  if (t < 86400) return `${Math.round(t / 3600)} ঘণ্টা`;
  if (t < 3.156e7) return `${Math.round(t / 86400)} দিন`;
  return `${Math.round(t / 3.156e7)} বছর`;
};
function X8Big({ n }: { n: number }) {
  if (n < 1e7) return <>{Math.round(n).toLocaleString("en-IN")}</>;
  const e = Math.floor(Math.log10(n));
  const m = n / 10 ** e;
  return (
    <>
      {m.toFixed(1)} × 10<sup>{e}</sup>
    </>
  );
}

export function TooManyTerms() {
  const pass = useGate();
  const [n, setN] = useSeed("n", 3);
  const tf = fact(n) / X8_SPEED;
  const tc = n ** 3 / X8_SPEED;
  const [xf, xc] = useTween([x8x(tf), x8x(tc)], 700);
  const set = (v: number) => {
    setN(v);
    if (v === 20) pass("বড় matrix এ n! না, n³।");
  };
  const dot = 64 / Math.max(n, 1);
  return (
    <>
      <svg viewBox="0 0 320 140" className="mx-auto block h-auto w-full max-w-[21rem]" role="img" aria-label="বামে n × n সংখ্যার একটা ছক; ডানে সময়ের দাগ, 1 সেকেন্ড থেকে 100 বছর; উপরের সারি ধরে হাঁটলে কত সময়, আর triangle বানালে কত সময়, দুইটা দাগে">
        <rect width={320} height={140} rx={10} fill="#f6efe2" />
        <g>
          {Array.from({ length: n * n }, (_, i) => (
            <circle key={`${n}-${i}`} cx={14 + dot * ((i % n) + 0.5)} cy={30 + dot * (Math.floor(i / n) + 0.5)} r={Math.max(0.9, dot * 0.28)} fill={INK} opacity={0.7} />
          ))}
          <text x={46} y={20} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK}>
            {n} × {n}
          </text>
        </g>
        {X8_TICKS.map(([t, l]) => (
          <g key={l}>
            <path d={`M${x8x(t)} 22V118`} stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="3 3" />
            <text x={x8x(t)} y={130} textAnchor="middle" fontSize={8.5} fill="#475569">
              {l}
            </text>
          </g>
        ))}
        {[
          { y: 52, x: xf, t: tf, name: "উপরের সারি ধরে হাঁটা", tone: BAD },
          { y: 98, x: xc, t: tc, name: "triangle বানিয়ে", tone: OK },
        ].map((r) => (
          <g key={r.name}>
            <path d={`M${X8_X0} ${r.y}H${X8_X1}`} stroke="#cbd5e1" strokeWidth={3} strokeLinecap="round" />
            <path d={`M${X8_X0} ${r.y}H${r.x}`} stroke={r.tone} strokeWidth={3} strokeLinecap="round" />
            <circle cx={r.x} cy={r.y} r={6} fill="white" stroke={r.tone} strokeWidth={2} />
            <path d={`M${r.x} ${r.y}v-3.5M${r.x} ${r.y}l2.6 1.5`} stroke={r.tone} strokeWidth={1.2} strokeLinecap="round" />
            <text x={X8_X0} y={r.y - 12} fontSize={9.5} fontWeight={700} fill={INK}>
              {r.name}
            </text>
            <text x={Math.min(r.x, 270)} y={r.y + 18} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={r.tone}>
              {x8Time(r.t)}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-1 grid grid-cols-2 gap-2 text-center text-sm">
        <div>
          term: <b className="font-mono">{n}! = <X8Big n={fact(n)} /></b>
        </div>
        <div>
          গুণ-যোগ: <b className="font-mono">≈ {n}³ = {(n ** 3).toLocaleString("en-IN")}</b>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {X8_NS.map((v) => (
          <button key={v} type="button" className={pill(n === v)} onClick={() => set(v)}>
            {v}
          </button>
        ))}
      </div>
      <Task done={n === 20}>নিচের সংখ্যায় চাপ দিয়ে matrix বড় করুন, 20 × 20 পর্যন্ত। দুইটা ঘড়ি দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The finale's widget: নানা pours his কাঠা into the পাইকার's box, one
//     tap a কাঠা (tilt, stream, a new layer). At 4 the box is full, and the
//     bet cards open one by one.

const X9_PJ = pjAt(28, 166, 33);
const X9_CARDS: [string, boolean][] = [
  ["নাসিব: কম ধরে", false],
  ["পাইকার: ঠিক 3", false],
  ["সোম: বেশি ধরে", true],
  ["করিম: মাপা যায় না", false],
];

export function BetOpen() {
  const pass = useGate();
  const [poured, setPoured] = useSeed("poured", 0);
  const [opened, setOpened] = useSeed("opened", false);
  const pour = usePlay(280);
  const open = usePlay(800);
  const tap = () => {
    if (pour.running || open.running || poured >= 4) return;
    pour.play(3, () => {
      const n = poured + 1;
      setPoured(n);
      if (n === 4)
        open.play(4, () => {
          setOpened(true);
          pass("বাক্সে ধরলো 4 কাঠা। পাইকারের 3 টিকলো না।");
        });
    });
  };
  const pk = pour.running ? pour.k : 0;
  const ck = open.running ? open.k : opened ? 4 : 0;
  const top = X9_PJ(a3(K_E[0], a3(K_E[1], K_E[2])));
  const kx = top[0] - 58;
  const ky = 26;
  return (
    <>
      <svg viewBox="0 0 300 180" className="mx-auto block h-auto w-full max-w-[19rem]" role="img" aria-label="পাইকারের বাক্স; নানা উপর থেকে নিজের কাঠায় ধান ঢালছেন; প্রতি কাঠায় বাক্সে এক তলা ধান ওঠে">
        <rect width={300} height={180} rx={10} fill="#f6efe2" />
        <Crate pj={X9_PJ} e={K_E} layers={poured} pop={poured - 1} />
        {poured < 4 && (
          <g style={{ transform: `translate(${kx}px, ${ky}px) rotate(${pk >= 1 ? 40 : 0}deg)` }} className="transition-transform duration-200 motion-reduce:transition-none">
            <Cube pj={pjAt(-8, 8, 16)} at={O3} />
          </g>
        )}
        {pk === 2 && <Draw d={`M${kx + 10} ${ky + 14}Q${kx + 26} ${ky + 26} ${top[0] - 34} ${top[1] + 18}`} strokeWidth={4} className="stroke-[#f4d160]" />}
        <text x={286} y={40} textAnchor="end" fontSize={20} fontWeight={900} fontFamily={MONO} fill={poured >= 4 ? OK : INK}>
          {poured}
        </text>
        <text x={286} y={56} textAnchor="end" fontSize={10} fontWeight={700} fill={INK}>
          কাঠা
        </text>
        {poured >= 4 && (
          <text x={286} y={76} textAnchor="end" fontSize={10.5} fontWeight={800} fill={OK} className={POP}>
            বাক্স ভরে গেলো
          </text>
        )}
      </svg>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={poured >= 4 || pour.running} onClick={tap}>
          এক কাঠা ঢালুন
        </button>
      </div>
      {ck > 0 && (
        <div className="mx-auto mt-2 grid max-w-[18rem] gap-1">
          {X9_CARDS.map(([t, ok], i) => (
            <div key={t} className={`flex items-center justify-between rounded-lg border px-3 py-1 text-sm transition-colors duration-500 motion-reduce:transition-none ${ck > i ? (ok ? "border-accent bg-accent/10" : "border-border opacity-60") : "border-border"}`}>
              <span>{t}</span>
              {ck > i && <Mark ok={ok} />}
            </div>
          ))}
        </div>
      )}
      <Task done={opened}>নানার কাঠায় একটা একটা করে ধান ঢালুন, বাক্স ভরা পর্যন্ত। তারপর বাজি খুলবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story-scene props: the পাইকার, the van, the heap, the বস্তা.

/** The পাইকার: মামার look with a checked লুঙ্গি and a গামছা, his name under his feet. */
function Paikar({ x, y, facing = -1, arm = "down", walking = false, ms = 1200 }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point"; walking?: boolean; ms?: number }) {
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} arm={arm} walking={walking} ms={ms} />
      <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
        <g transform={`scale(${facing} 1)`}>
          <path d="M-8.5 -22L-10 -1H10L8.5 -22Z" fill="#1e40af" />
          <path d="M-9 -16H9M-9.5 -9H9.5M-4 -22V-1M3 -22V-1" stroke="#93c5fd" strokeWidth={0.8} />
          <path d="M-8 -40L6 -27" stroke="#dc2626" strokeWidth={3.4} strokeLinecap="round" />
          <path d="M-5 -37.5L-3 -35.5M-1 -34L1 -32" stroke="white" strokeWidth={0.8} />
        </g>
        <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          পাইকার
        </text>
      </g>
    </>
  );
}

/** a cycle-van, its bed's back-left corner at (x, y) (bed top) */
function Van({ x, y, children }: { x: number; y: number; children?: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)` }} className="transition-transform duration-[1400ms] ease-in-out motion-reduce:transition-none">
      <rect x={0} y={0} width={74} height={6} rx={1.5} fill="#8b5a2b" stroke="#5b3a1a" strokeWidth={0.8} />
      {children}
      {[14, 60].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={16} r={9.5} fill="none" stroke="#1f2937" strokeWidth={2} />
          <circle cx={cx} cy={16} r={1.6} fill="#1f2937" />
        </g>
      ))}
      <path d="M74 3L90 3L94 -12M90 3L96 16" stroke="#1f2937" strokeWidth={1.8} fill="none" />
      <path d="M89 -13h10" stroke="#1f2937" strokeWidth={2} strokeLinecap="round" />
      <circle cx={96} cy={16} r={9.5} fill="none" stroke="#1f2937" strokeWidth={2} />
    </g>
  );
}

/** ধানের স্তূপ on a পাটি, centred at x, ground y */
function Heap({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g className="transition-transform duration-700 motion-reduce:transition-none" style={{ transform: `translate(${x}px, ${y}px) scale(${s})`, transformOrigin: "0 0" }}>
      <path d="M-42 0L-36 -6H36L42 0Z" fill="#c9a86a" stroke="#8a6a3b" strokeWidth={0.6} />
      <path d="M-34 -4Q0 -40 34 -4Z" fill={DHAN} stroke={DHAN_DARK} strokeWidth={0.8} />
      <path d="M-18 -12l2 -1M-4 -22l2 -1M10 -16l2 -1M18 -9l2 -1M0 -10l2 -1" stroke={DHAN_DARK} strokeWidth={0.8} />
    </g>
  );
}

/** a jute বস্তা standing at (x, y) */
function Sack({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-9 0Q-11 -16 -7 -22L7 -22Q11 -16 9 0Z" fill={JUTE} stroke={JUTE_DARK} strokeWidth={0.8} />
      <path d="M-6 -22L-3 -27L3 -27L6 -22" fill={JUTE} stroke={JUTE_DARK} strokeWidth={0.8} />
      <path d="M-5 -23H5" stroke={JUTE_DARK} strokeWidth={1.2} />
    </g>
  );
}

/** the উঠান's packed earth over the stage's ground */
function Uthan({ y0 = 128 }: { y0?: number }) {
  return <rect y={y0} width={320} height={180 - y0} fill="#d8bc8c" />;
}

/** the পাইকার's box on a scene, corner at (x, y), one কাঠা ≈ s units */
function StageCrate({ x, y, s, label, edges = 0 }: { x: number; y: number; s: number; label?: string; edges?: number }) {
  const pj = pjAt(x, y, s);
  const [u, v, w] = K_E;
  return (
    <g>
      <Crate pj={pj} e={K_E} fo={0.9} label={label} />
      {([0, 1, 2] as const).slice(0, edges).map((j) => (
        <g key={j} className={FADE}>
          <Edge3 pj={pj} vec={K_E[j]} tone={EDGE[j]} w={2} dashed={edgeHidden(u, v, w, j)} />
        </g>
      ))}
    </g>
  );
}

// 1a · ফিরানির দিন সকাল। The heap on the পাটি, নানা with his কাঠা, করিম with a
//      বস্তা; the van rolls in with the crooked box; the পাইকার slaps it and
//      claims; নানা turns his কাঠা in his hands.

export function PaikarArrives({}: Story) {
  const s = useScene(4, [600, 1800, 2400, 2400, 1800]);
  const k = s.k;
  const vx = k >= 1 ? 214 : 330;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ফিরানির দিন সকাল; উঠানে পাটির উপর ধানের স্তূপ; নানার হাতে চারকোনা কাঠা; করিমের পাশে বস্তা; ভ্যানে দড়ি দিয়ে বাঁধা হেলানো কাঠের বাক্স নিয়ে পাইকার এলেন; বাক্সে চাপড় দিয়ে বললেন, তিন কাঠার বাক্স, বাপ-দাদার আমলের; হেলানো তো কী, ধান তো একই ধরে">
        <Uthan />
        <Heap x={108} y={150} />
        <Person who="nana" x={42} y={152} facing={1} arm="hold" label />
        <g style={{ transform: `translate(52px, 106px) rotate(${k >= 4 ? 35 : 0}deg)` }} className="transition-transform duration-700 motion-reduce:transition-none">
          <Cube pj={pjAt(-4, 6, 9)} at={O3} />
        </g>
        <Person who="karim" x={160} y={154} facing={1} label />
        <Sack x={176} y={154} />
        <Van x={vx} y={128}>
          <StageCrate x={14} y={0} s={11} />
        </Van>
        <Paikar x={k >= 1 ? 206 : 340} y={154} facing={1} arm={k === 2 ? "point" : "down"} walking={k === 1} ms={1400} />
        {k === 2 && <Bubble x={206} y={88} side="mid" lines={["তিন কাঠার বাক্স,", "বাপ-দাদার আমলের।"]} />}
        {k >= 3 && <Bubble x={206} y={88} side="mid" lines={["হেলানো তো কী,", "ধান তো একই ধরে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · করিম stacks the বস্তা three high, then pushes the top ones; the stack
//      leans; নানা: আস্তে। The count under it stays 6.

export function KarimPushes({}: Story) {
  const s = useScene(3, [600, 1600, 2000, 2000]);
  const k = s.k;
  const lean = k >= 2 ? 1 : 0;
  const pj = pjAt(150, 150, 17);
  const bags: V3[] = [];
  for (let z = 0; z < 3; z++) for (let x = 0; x < 2; x++) bags.push([x + (z * lean) / 2, 0, z]);
  const shown = k === 0 ? 2 : 6;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="উঠানে করিম বস্তা সাজালো তিন তলা, প্রতি তলায় দুইটা; তারপর উপরের বস্তাগুলো ঠেলা দিলো; stack হেলে গেলো; নানা বললেন, আস্তে; stack এর নিচে লেখা 6 বস্তা">
        <Uthan />
        {byDepth(bags.slice(0, shown)).map((p, i) => (
          <g key={`${i}${lean}`} className={POP}>
            <Solid pj={pj} at={[p[0] + 0.04, 0.04, p[2]]} u={[0.92, 0, 0]} v={[0, 0.92, 0]} w={[0, 0, 0.94]} fill={JUTE} stroke={JUTE_DARK} sw={0.8} />
          </g>
        ))}
        <Person who="karim" x={k >= 2 ? 136 : 128} y={152} facing={1} arm={k >= 2 ? "point" : "hold"} label />
        <Person who="nana" x={62} y={152} facing={1} arm={k >= 3 ? "wave" : "down"} label />
        {k >= 3 && <Bubble x={62} y={86} side="left" lines={["আস্তে!", "বস্তা ফাটবো।"]} />}
        {k >= 1 && (
          <text x={188} y={170} textAnchor="middle" fontSize={10} fontWeight={800} fill={INK} className={FADE}>
            6 বস্তা
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 4a · নানা brings his father's box out of the গোলাঘর; "2" burnt on its
//      side; সোম opens his খাতা.

export function NanaOldBox({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="গোলাঘর থেকে নানা একটা পুরানো হেলানো বাক্স বের করে আনলেন; গায়ে পোড়া দাগে লেখা 2; নানা বললেন, আব্বার আমলের বাক্স, দুই কাঠা ধরে; সোম খাতা খুলে বললো, যেটার উত্তর জানা, সেটায় আগে হাঁটি">
        <Uthan />
        <path d="M16 132V84H92V132Z" fill="#c9a27a" stroke="#8a6a3b" strokeWidth={0.8} />
        <path d="M8 86L54 52L100 86Z" fill="#b08d3c" stroke="#7c5e1e" strokeWidth={0.8} />
        <rect x={44} y={100} width={20} height={32} fill="#5b3a1a" />
        <text x={54} y={78} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
          গোলাঘর
        </text>
        {k === 0 && <Person who="nana" x={54} y={132} facing={1} arm="hold" />}
        {k >= 1 && (
          <g className={FADE}>
            <OldBox pj={pjAt(126, 156, 11)} />
          </g>
        )}
        {k >= 1 && <Person who="nana" x={110} y={154} facing={1} arm={k === 2 ? "point" : "down"} label />}
        {k >= 2 && <Bubble x={110} y={88} side="mid" lines={["আব্বার বাক্স।", "দুই কাঠা, মাপা।"]} />}
        <Person who="som" x={236} y={154} facing={-1} arm={k >= 3 ? "hold" : "down"} label />
        {k >= 3 && <rect x={214} y={104} width={14} height={11} rx={1} fill="white" stroke="#64748b" strokeWidth={0.8} className={POP} />}
        {k >= 3 && <Bubble x={236} y={88} side="right" lines={["জানা বাক্সে", "আগে হাঁটি।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6a · The van again. সামিন with the ফিতা; the পাইকার: বাইরে থেকে মাপেন.
//      The three edges from the corner light up one by one.

export function SaminTape({}: Story) {
  const s = useScene(4, [600, 2400, 1500, 1500, 1500]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ভ্যানের উপর পাইকারের বাক্স; পাইকার বললেন, মাপেন, বাইরে থিকা, ভিতরে হাত দিবেন না; সামিন ফিতা ধরে কোনা থেকে তিনটা কিনারা মাপলো, তিন রঙে">
        <Uthan />
        <Van x={150} y={128}>
          <StageCrate x={10} y={0} s={17} edges={Math.max(0, k - 1)} />
        </Van>
        <Paikar x={276} y={154} facing={-1} arm={k === 1 ? "point" : "down"} />
        {k === 1 && <Bubble x={276} y={88} side="left" lines={["মাপেন, বাইরে থিকা।", "ভিতরে হাত দিবেন না।"]} />}
        <Person who="samin" x={112} y={154} facing={1} arm={k >= 2 ? "point" : "hold"} label />
        {k >= 2 && <path d="M124 116L160 124" stroke="#eab308" strokeWidth={2.5} strokeLinecap="round" className={FADE} />}
      </Stage>
    </StoryFrame>
  );
}

// 8a · বারান্দা, noon. সামিন with her phone: ফোনও কি এভাবে হাঁটে? সোম: 20 × 20
//      হলে? The phone's screen spins.

export function SaminPhone({}: Story) {
  const s = useScene(3, [600, 2200, 2200, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="দুপুর, বারান্দা; সামিনের হাতে phone; সামিন বললো, phone ও কি এভাবেই হাঁটে; সোম বললো, 20 × 20 হলে কয়টা term; phone এর পর্দায় চাকা ঘুরছে">
        <rect x={0} y={128} width={320} height={6} fill="#a47148" />
        <Person who="samin" x={120} y={152} facing={1} arm="hold" label />
        <rect x={126} y={100} width={9} height={15} rx={1.5} fill="#1f2937" />
        <rect x={127.3} y={101.6} width={6.4} height={11.4} rx={0.8} fill={k >= 3 ? "#e2e8f0" : "#93c5fd"} />
        {k >= 3 && (
          <circle cx={130.5} cy={107.3} r={2.4} fill="none" stroke={BLUE} strokeWidth={0.9} strokeDasharray="4 3" className={POP}>
            <animateTransform attributeName="transform" type="rotate" from="0 130.5 107.3" to="360 130.5 107.3" dur="1.2s" repeatCount="indefinite" />
          </circle>
        )}
        <Person who="som" x={200} y={152} facing={-1} label />
        {k === 1 && <Bubble x={120} y={86} side="mid" lines={["Phone ও কি", "এভাবেই হাঁটে?"]} />}
        {k >= 2 && <Bubble x={200} y={86} side="mid" lines={["20 × 20 হলে", "কয়টা term?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · After the pour. The পাইকার counts notes into নানার hand, four কাঠার
//      দাম; the van leaves; the গেটের কাপড় goes up for ফিরানি.

export function PaikarPays({}: Story) {
  const s = useScene(3, [600, 2000, 1800, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="পাইকার চুপচাপ নানার হাতে টাকা গুনে দিলেন, চার কাঠার দাম; ভ্যান চলে গেলো; উঠানে বস্তা ভরা ধান; গেটে ফিরানির কাপড় উঠলো">
        <Uthan />
        <Gate x={34} y={150} text="" />
        {k >= 3 && <path d="M10 86Q34 102 58 86" fill="none" stroke="#db2777" strokeWidth={4} className={FADE} />}
        {k >= 3 && <path d="M10 86Q34 94 58 86" fill="none" stroke="#fbbf24" strokeWidth={2} className={FADE} />}
        {[78, 96, 114].map((x) => (
          <Sack key={x} x={x} y={156} />
        ))}
        <Person who="nana" x={150} y={154} facing={1} arm="hold" label />
        {k <= 1 && <Paikar x={194} y={154} facing={-1} arm={k === 1 ? "hold" : "down"} />}
        {k === 1 && (
          <g className={POP}>
            <rect x={166} y={108} width={12} height={7} rx={1} fill="#86efac" stroke="#15803d" strokeWidth={0.6} />
            <text x={172} y={100} textAnchor="middle" fontSize={9} fontWeight={800} fontFamily={MONO} fill={INK}>
              4
            </text>
          </g>
        )}
        <Van x={k >= 2 ? 340 : 214} y={128}>
          <StageCrate x={14} y={0} s={11} />
        </Van>
      </Stage>
    </StoryFrame>
  );
}

// 9b · The bridge to 8.7. Evening, the wall with Rina's pieces; the লাইট ভাই
//      at his machine: one last heart, the whole wall; সোম: আলো ফিকে হবে.

export function LastHeart({}: Story) {
  const s = useScene(3, [600, 1800, 2200, 2200]);
  const k = s.k;
  const PJ: [number, number] = [236, 150];
  const [lx, ly] = projectorLens(PJ[0], PJ[1], -1);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যা; দেয়ালে রিনার রং করা ছবি; লাইট ভাই যন্ত্রের পাশে বললেন, শেষ একটা heart, পুরা দেয়াল জুড়ে; সোম বললো, এত বড় করলে আলো ফিকে হবে">
        <StageWall x={10} y={34} grid={false}>
          {k >= 2 && <path d={heartPath(84, 58, k >= 3 ? 46 : 14)} fill="#f9a8d4" fillOpacity={k >= 3 ? 0.22 : 0.8} stroke="#db2777" strokeWidth={1} className="transition-all duration-700 motion-reduce:transition-none" />}
        </StageWall>
        <Projector x={PJ[0]} y={PJ[1]} facing={-1} on={k >= 2} lens="good" />
        {k >= 2 && <StageBeam from={[lx, ly]} to={[94, 92]} w={k >= 3 ? 14 : 4} />}
        <LightBhai x={272} y={150} facing={-1} arm={k >= 1 ? "point" : "down"} />
        {k === 1 && <Bubble x={272} y={84} side="left" lines={["শেষ একটা heart।", "পুরা দেয়াল জুড়ে।"]} />}
        <Person who="som" x={196} y={154} facing={-1} label />
        {k >= 3 && <Bubble x={196} y={88} side="mid" lines={["এত বড় করলে", "আলো ফিকে হবে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Figures for the explanations.

// 1½ · The stake: the heap is 60 কাঠা by নানার কাঠা; each time the box is
//      filled the খাতা gets 3. If the box holds more than 3, the heap runs out
//      sooner and the খাতা shows less than 60. Stops on "?".

const KS_SAY = [
  "উঠানে নানার ধান। নানার কাঠায় মাপলে 60 কাঠা।",
  "পাইকারের বাক্স একবার ভরলো। খাতায় উঠলো 3।",
  "যতবার বাক্স ভরে, খাতায় ততবার 3। বিশবার ভরলে 60।",
  "বাক্স যদি 3 এর বেশি ধরে? স্তূপ ফুরাবে বিশবারের আগেই। খাতায় 60 উঠবে না।",
];

export function KathaStake() {
  const s = useScene(3, [600, 1600, 2000, 2600]);
  const k = s.k;
  const heap = [1, 0.85, 0.6, 0][k];
  const kh = ["", "3", "3 + 3 + 3 …", "3 + 3 + … = ?"][k];
  return (
    <Scene scene={s} caption={say(KS_SAY, k)}>
      <svg viewBox="0 0 260 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="নানার ধানের স্তূপ কমছে, পাইকারের বাক্স ভরছে, খাতায় প্রতিবার 3 উঠছে; শেষে প্রশ্ন">
        <rect width={260} height={110} rx={8} fill="#f6efe2" />
        <g style={{ transform: `translate(64px, 94px) scale(${Math.max(heap, 0.02)})` }} className="transition-transform duration-700 motion-reduce:transition-none">
          <path d="M-44 0Q0 -60 44 0Z" fill={DHAN} stroke={DHAN_DARK} strokeWidth={1} />
        </g>
        {k === 3 && (
          <text x={64} y={90} textAnchor="middle" fontSize={20} fontWeight={800} fill={BLUE} className={POP}>
            ?
          </text>
        )}
        <text x={64} y={106} textAnchor="middle" fontSize={9} fill="#475569">
          নানার ধান
        </text>
        <Crate pj={pjAt(128, 92, 13)} e={K_E} layers={k >= 1 && k < 3 ? 4 : 0} fo={0.5} />
        <rect x={182} y={22} width={72} height={56} rx={3} fill="white" stroke="#a8a29e" />
        <text x={218} y={36} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
          খাতা
        </text>
        <text key={k} x={218} y={56} textAnchor="middle" fontSize={k >= 2 ? 7.5 : 12} fontWeight={800} fontFamily={MONO} fill={k === 3 ? BLUE : INK} className={FADE}>
          {kh}
        </text>
      </svg>
    </Scene>
  );
}

// 2¼ · The straight box's three edges stand up as the three columns of a
//      3 × 3 (8.1: the patch's sides were the lens's columns), and the
//      diagonal multiplies to the count, 6.

const EC_SAY = [
  "সোজা বাক্সের কোনা থেকে তিনটা কিনারা।",
  "পূবের কিনারা (2, 0, 0) হলো প্রথম column।",
  "উত্তরের কিনারা (0, 3, 0) দ্বিতীয় column।",
  "উপরের কিনারা (0, 0, 1) তৃতীয়। det = 2 × 3 × 1 = 6: বাক্সে 6 কাঠা।",
];
const EC_M: M3 = [
  [2, 0, 0],
  [0, 3, 0],
  [0, 0, 1],
];

export function EdgesToColumns() {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  const pj = pjAt(16, 92, 24);
  const e: [V3, V3, V3] = [
    [2, 0, 0],
    [0, 3, 0],
    [0, 0, 1],
  ];
  return (
    <Scene scene={s} caption={say(EC_SAY, k)}>
      <svg viewBox="0 0 250 104" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="সোজা বাক্সের তিনটা কিনারা তিন রঙে; একে একে তিনটা column হয়ে একটা 3 × 3 এ বসে">
        <rect width={250} height={104} rx={8} fill="#f6efe2" />
        <Solid pj={pj} u={e[0]} v={e[1]} w={e[2]} fill={DHAN} stroke={DHAN_DARK} fo={0.5} />
        {e.map((v, j) => (
          <Edge3 key={j} pj={pj} vec={v} tone={EDGE[j]} w={2.2} dashed={edgeHidden(e[0], e[1], e[2], j as 0 | 1 | 2)} />
        ))}
        <path d="M150 14h-4v78h4M236 14h4v78h-4" fill="none" stroke={INK} strokeWidth={1.4} />
        {[0, 1, 2].map((j) =>
          k > j ? (
            <g key={j} className={POP}>
              {[0, 1, 2].map((i) => (
                <text key={i} x={164 + j * 29} y={34 + i * 24} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily={MONO} fill={EDGE_INK[j]}>
                  {EC_M[i][j]}
                </text>
              ))}
            </g>
          ) : null,
        )}
        {k >= 3 &&
          [0, 1, 2].map((i) => <circle key={i} cx={164 + i * 29} cy={29 + i * 24} r={10} fill="none" stroke={OK} strokeWidth={1.4} className={POP} />)}
      </svg>
    </Scene>
  );
}

// 2½ · Why only square: a 3 × 2 matrix lifts the flat ঘর into three
//      directions; it becomes a thin slanted sheet. কাঠা দিয়ে মাপলে 0, ঘর দিয়ে
//      মাপলে অন্য কিছু: কতগুণ has no answer.

const FS_SAY = [
  "একটা ঘর। দুই দিকের জিনিস: লম্বা আর চওড়া।",
  "3 × 2 matrix টা ঘরটাকে তিন দিকের জায়গায় তুলে দিলো। হয়ে গেলো একটা হেলানো পাতা।",
  "পাতার ভেতরে ধান ধরে না: কাঠায় মাপলে 0। ঘরে মাপলে অন্য সংখ্যা।",
  "তাহলে জায়গা কতগুণ হলো? উত্তর নাই। যত দিক ঢোকে, তত দিক বের না হলে det হয় না।",
];

export function FlatInSpace() {
  const s = useScene(3, [600, 1800, 2400, 2600]);
  const k = s.k;
  const pj = pjAt(130, 88, 30);
  const sheet = (u: V3, v: V3) => facePath(pj, [O3, u, a3(u, v), v]);
  return (
    <Scene scene={s} caption={say(FS_SAY, k)}>
      <svg viewBox="0 0 260 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="কাগজের একটা ঘর; 3 × 2 matrix সেটাকে তিন দিকের জায়গায় একটা হেলানো পাতলা পাতা বানিয়ে দিলো; পাশে নানার কাঠা আর প্রশ্ন">
        <rect width={260} height={110} rx={8} fill="#f6efe2" />
        {k === 0 && <rect x={40} y={40} width={44} height={44} fill="#bfdbfe" stroke={BLUE} strokeWidth={1.4} className={FADE} />}
        {k >= 1 && (
          <g className={FADE}>
            <path d={facePath(pj, [O3, [2.4, 0, 0], [2.4, 1.6, 0], [0, 1.6, 0]])} fill="none" stroke="#cbd5e1" strokeWidth={0.8} strokeDasharray="3 3" />
            <path d={sheet([1.4, 0, 0.6], [0.3, 1, 1.2])} fill="#bfdbfe" fillOpacity={0.85} stroke={BLUE} strokeWidth={1.4} />
          </g>
        )}
        {k >= 1 && (
          <text x={30} y={60} fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK}>
            3 × 2
          </text>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <Cube pj={pjAt(206, 62, 16)} at={O3} />
            <text x={222} y={86} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={BAD}>
              0 ?
            </text>
          </g>
        )}
        {k >= 3 && (
          <text x={226} y={28} textAnchor="middle" fontSize={20} fontWeight={800} fill={BLUE} className={POP}>
            ?
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 3½ · Why lean-and-straighten isn't enough: Karim's stack leans one way, a
//      push back makes it straight, 2 × 1 × 3. The পাইকার's box leans in all
//      three directions; three pushes are tried and none makes it straight.

const WW_SAY = [
  "করিমের stack হেলানো এক দিকে, পূবে।",
  "উল্টো দিকে ঠেললেই সোজা: 2 × 1 × 3 = 6।",
  "পাইকারের বাক্স হেলানো তিন দিকেই। কোন দিকে ঠেললে সোজা হবে?",
  "চোখে দেখে সোজা করা যায় না। তাই সংখ্যা লাগবে: তিনটা কিনারার নয়টা সংখ্যা।",
];

export function WhichWayBack() {
  const s = useScene(3, [600, 1600, 2200, 2600]);
  const k = s.k;
  const pj = pjAt(20, 96, 17);
  const lean = k >= 1 ? 0 : 3;
  const [l] = useTween([lean], 700);
  return (
    <Scene scene={s} caption={say(WW_SAY, k)}>
      <svg viewBox="0 0 260 110" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="বামে করিমের হেলানো stack, উল্টো ঠেলায় সোজা হয়; ডানে পাইকারের বাক্স, তিন দিকে হেলানো, প্রশ্ন">
        <rect width={260} height={110} rx={8} fill="#f6efe2" />
        <Solid pj={pj} u={[2, 0, 0]} v={[0, 1, 0]} w={[l, 0, 3]} fill={JUTE} stroke={JUTE_DARK} sw={1} />
        {k === 1 && <path d="M110 30h-18M96 26l-5 4l5 4" stroke={INK} strokeWidth={1.6} fill="none" className={FADE} />}
        {k >= 2 && (
          <g className={FADE}>
            <Crate pj={pjAt(150, 100, 20)} e={K_E} fo={0.9} />
            {k === 2 &&
              [
                [236, 48, -10, 0],
                [246, 80, -8, 8],
                [214, 16, -6, 10],
              ].map(([x, y, dx, dy], i) => <path key={i} d={`M${x} ${y}l${dx} ${dy}`} stroke={BLUE} strokeWidth={1.6} strokeLinecap="round" className={POP} />)}
            {k >= 3 && (
              <text x={244} y={30} textAnchor="middle" fontSize={20} fontWeight={800} fill={BLUE} className={POP}>
                ?
              </text>
            )}
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · The name: cross out row 1 and column 2, the 2 × 2 left is M₁₂.

const CO_SAY = ["নানার আব্বার বাক্সের নয়টা সংখ্যা।", "সারি 1 কাটা।", "কলাম 2 কাটা।", "যে 2 × 2 বাকি থাকলো, তার নাম minor। সারি 1, কলাম 2 কেটে পাওয়া, তাই M₁₂।"];

export function CrossOut() {
  const s = useScene(3, [600, 1200, 1200, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(CO_SAY, k)}>
      <svg viewBox="0 0 220 104" className="mx-auto block h-auto w-full max-w-[14rem]" role="img" aria-label="তিন সারি তিন কলামের সংখ্যা; সারি 1 আর কলাম 2 কাটা; বাকি 2 × 2 এর নাম M এক দুই">
        <rect width={220} height={104} rx={8} fill="#f6efe2" />
        <Mat3 m={N_M} x={20} y={8} c={29} fontSize={14} cross={k >= 3 ? [0, 1] : null} />
        {k >= 1 && k < 3 && <Draw d="M22 22.5H105" strokeWidth={2} className="stroke-[#e11d48]" />}
        {k === 2 && <Draw d="M63.5 10V93" strokeWidth={2} className="stroke-[#e11d48]" />}
        {k >= 3 && (
          <g className={POP}>
            <text x={118} y={40} fontSize={13} fontWeight={800} fontFamily={MONO} fill={INK}>
              M₁₂
            </text>
            <text x={118} y={62} fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK}>
              = 1·2 − 1·0
            </text>
            <text x={118} y={82} fontSize={12} fontWeight={800} fontFamily={MONO} fill={BLUE}>
              = 2
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 4¾ · Side quest: the six-term formula, the six products lit on a sheet of
//      letters, three plus, three minus.

const SIX_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
const SIX_PLUS = [
  [0, 4, 8],
  [1, 5, 6],
  [2, 3, 7],
];
const SIX_MINUS = [
  [2, 4, 6],
  [1, 3, 8],
  [0, 5, 7],
];
const SIX_SAY = [
  "নয়টা অক্ষর, a থেকে i।",
  "প্রতিটা সারি থেকে একটা, প্রতিটা কলাম থেকে একটা: aei, bfg, cdh। এই তিনটা plus।",
  "আরো তিনটা: ceg, bdi, afh। এরা minus.",
  "aei + bfg + cdh − ceg − bdi − afh. ছয়টা term। কেউ মুখস্থ করে না।",
];

export function SixTerms() {
  const s = useScene(3, [600, 2200, 2200, 2600]);
  const k = s.k;
  const cx = (n: number) => 30 + (n % 3) * 26;
  const cy = (n: number) => 22 + Math.floor(n / 3) * 24;
  const trio = (t: number[], tone: string, key: string) => <path key={key} d={t.map((n, i) => `${i ? "L" : "M"}${cx(n)} ${cy(n) - 4}`).join("")} fill="none" stroke={tone} strokeWidth={1.4} strokeOpacity={0.7} className={FADE} />;
  return (
    <Scene scene={s} caption={say(SIX_SAY, k)}>
      <svg viewBox="0 0 240 90" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="a থেকে i নয়টা অক্ষরের ছক; তিনটা plus গুণ আর তিনটা minus গুণ রঙিন দাগে">
        <rect width={240} height={90} rx={8} fill="#f6efe2" />
        {k >= 1 && SIX_PLUS.map((t, i) => trio(t, OK, `p${i}`))}
        {k >= 2 && SIX_MINUS.map((t, i) => trio(t, BAD, `m${i}`))}
        {SIX_LETTERS.map((l, n) => (
          <text key={l} x={cx(n)} y={cy(n)} textAnchor="middle" fontSize={13} fontWeight={800} fontFamily={MONO} fill={INK}>
            {l}
          </text>
        ))}
        {k >= 1 && (
          <text x={120} y={30} fontSize={10.5} fontWeight={800} fontFamily={MONO} fill={OK} className={FADE}>
            + aei + bfg + cdh
          </text>
        )}
        {k >= 2 && (
          <text x={120} y={52} fontSize={10.5} fontWeight={800} fontFamily={MONO} fill={BAD} className={FADE}>
            − ceg − bdi − afh
          </text>
        )}
        {k >= 3 && (
          <text x={120} y={76} fontSize={10} fontWeight={700} fill="#475569" className={FADE}>
            ছয়টা term
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 5½ · The checkerboard: (−1)^(i+j), sign × minor = cofactor.

const SB_SAY = [
  "উপরের বাম কোনায় +।",
  "পাশে গেলে চিহ্ন বদলায়, নিচে গেলেও বদলায়। দাবার ছকের মতো।",
  "সারি i, কলাম j এর চিহ্ন (−1)^(i+j): i + j জোড় হলে +, বিজোড় হলে −।",
  "চিহ্ন × minor এর নাম cofactor, Cᵢⱼ। উপরের সারির তিনটা cofactor: +5, −2, +1।",
];

export function SignBoard() {
  const s = useScene(3, [600, 1600, 2400, 2600]);
  const k = s.k;
  const n = [1, 9, 9, 9][k];
  return (
    <Scene scene={s} caption={say(SB_SAY, k)}>
      <svg viewBox="0 0 220 100" className="mx-auto block h-auto w-full max-w-[14rem]" role="img" aria-label="তিন সারি তিন কলামের ছকে + আর − পালাক্রমে, দাবার ছকের মতো">
        <rect width={220} height={100} rx={8} fill="#f6efe2" />
        {Array.from({ length: 9 }, (_, t) => {
          const i = Math.floor(t / 3);
          const j = t % 3;
          const plus = (i + j) % 2 === 0;
          return (
            <g key={t}>
              <rect x={16 + j * 26} y={12 + i * 26} width={24} height={24} rx={3} fill={t < n ? (plus ? "#ccfbf1" : "#ffe4e6") : "white"} stroke="#cbd5e1" />
              {t < n && (
                <text x={28 + j * 26} y={29 + i * 26} textAnchor="middle" fontSize={14} fontWeight={800} fontFamily={MONO} fill={plus ? OK : BAD} className={POP}>
                  {plus ? "+" : "−"}
                </text>
              )}
            </g>
          );
        })}
        {k >= 2 && (
          <text x={108} y={40} fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK} className={FADE}>
            (−1)^(i+j)
          </text>
        )}
        {k >= 3 && (
          <text x={108} y={64} fontSize={11} fontWeight={800} fontFamily={MONO} fill={BLUE} className={FADE}>
            Cᵢⱼ = ± Mᵢⱼ
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 5¾ · Triangular: every number under the diagonal is 0. Walk down the
//      first column: one term; again: one term. Only the diagonal is left,
//      like step 2's straight box.

const DG_M: M3 = [
  [2, 1, 1],
  [0, 3, 1],
  [0, 0, 1],
];
const DG_SAY = [
  "কোনাকুনির নিচে সব 0।",
  "প্রথম কলাম ধরে হাঁটলে দুইটা term 0। থাকে শুধু 2 × (বাকি 2 × 2)।",
  "বাকি 2 × 2 এর নিচেও 0: 3 · 1 − 1 · 0 = 3।",
  "থাকলো শুধু কোনাকুনি: 2 × 3 × 1 = 6। সোজা বাক্সের মতো।",
];

export function DiagonalOnly() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(DG_SAY, k)}>
      <svg viewBox="0 0 220 100" className="mx-auto block h-auto w-full max-w-[14rem]" role="img" aria-label="triangle আকারের matrix: কোনাকুনির নিচে সব শূন্য; প্রথম কলাম ধরে হাঁটলে শুধু কোনাকুনির গুণ থাকে">
        <rect width={220} height={100} rx={8} fill="#f6efe2" />
        <Mat3 m={DG_M} x={18} y={8} c={28} fontSize={14} cross={k === 1 || k === 2 ? [0, 0] : null} />
        {k === 0 && <path d="M22 40L22 90L72 90Z" fill={BLUE} fillOpacity={0.12} stroke={BLUE} strokeDasharray="3 2" className={FADE} />}
        {k >= 3 &&
          [0, 1, 2].map((i) => (
            <circle key={i} cx={18 + 28 * i + 14} cy={8 + 28 * i + 14} r={11} fill="none" stroke={OK} strokeWidth={1.6} className={POP} />
          ))}
        <text x={124} y={54} fontSize={12} fontWeight={800} fontFamily={MONO} fill={k >= 3 ? OK : INK}>
          {["", "2 × ( … )", "2 × 3", "2 × 3 × 1 = 6"][k]}
        </text>
      </svg>
    </Scene>
  );
}

// 8½ · The other way: zeros sweep under the diagonal, column by column
//      (Article 10 does it by hand), then the diagonal is multiplied.

const TW_SAY = [
  "একটা 4 × 4। প্রতিটা বিন্দু একটা সংখ্যা।",
  "এক সারিকে কয়েকগুণ করে আরেক সারি থেকে বাদ দিলে প্রথম কলামের নিচে সব 0।",
  "তারপর দ্বিতীয় কলাম, তারপর তৃতীয়। matrix টা triangle হয়ে গেলো।",
  "এবার শুধু কোনাকুনি গুণ। পুরা কাজে মোটামুটি n³ টা গুণ-যোগ।",
];

export function TriangleWay() {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  const zero = (i: number, j: number) => i > j && j < [0, 1, 3, 3][k];
  return (
    <Scene scene={s} caption={say(TW_SAY, k)}>
      <svg viewBox="0 0 200 96" className="mx-auto block h-auto w-full max-w-[13rem]" role="img" aria-label="চার সারি চার কলামের বিন্দু; কলাম ধরে ধরে কোনাকুনির নিচে সব শূন্য হয়; শেষে কোনাকুনি গুণ">
        <rect width={200} height={96} rx={8} fill="#f6efe2" />
        {Array.from({ length: 16 }, (_, t) => {
          const i = Math.floor(t / 4);
          const j = t % 4;
          const z = zero(i, j);
          const diag = k >= 3 && i === j;
          return z ? (
            <text key={`${t}z`} x={60 + j * 22} y={22 + i * 20} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily={MONO} fill="#94a3b8" className={FADE}>
              0
            </text>
          ) : (
            <circle key={t} cx={60 + j * 22} cy={18 + i * 20} r={diag ? 6 : 4.5} fill={diag ? OK : INK} opacity={diag ? 1 : 0.75} className="transition-all duration-500 motion-reduce:transition-none" />
          );
        })}
      </svg>
    </Scene>
  );
}

// 8¾ · Side quest: the permutation formula. Pick one number from each row,
//      each column once: a path. 3 × 3 has 3! = 6 paths. The sign counts the
//      swaps from 123: 213 is one swap (odd, −), 321 is one swap (1 ↔ 3, odd,
//      −); the book labels both "even".

const TP_PATHS: { p: number[]; name: string; odd: boolean }[] = [
  { p: [0, 1, 2], name: "123", odd: false },
  { p: [1, 0, 2], name: "213", odd: true },
  { p: [2, 1, 0], name: "321", odd: true },
];
const TP_SAY = [
  "প্রতিটা সারি থেকে একটা সংখ্যা, প্রতিটা কলাম একবার: একটা পথ।",
  "123: কোনাকুনি। কোনো অদলবদল নাই, চিহ্ন +।",
  "213: প্রথম দুইটা অদলবদল। একটা swap, বিজোড়, চিহ্ন −। বইয়ে লেখা even: ভুল।",
  "321: 1 আর 3 অদলবদল। এটাও একটা swap, বিজোড়, −। বইয়ে এটাও even লেখা।",
];

export function TermPaths() {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  const cur = k >= 1 ? TP_PATHS[k - 1] : null;
  return (
    <Scene scene={s} caption={say(TP_SAY, k)}>
      <svg viewBox="0 0 220 96" className="mx-auto block h-auto w-full max-w-[14rem]" role="img" aria-label="তিন সারি তিন কলামের ছকে প্রতি সারি থেকে একটা ঘর বেছে একটা পথ; পাশে পথের নাম আর চিহ্ন">
        <rect width={220} height={96} rx={8} fill="#f6efe2" />
        {Array.from({ length: 9 }, (_, t) => {
          const i = Math.floor(t / 3);
          const j = t % 3;
          const on = cur ? cur.p[i] === j : false;
          return <rect key={`${t}${k}`} x={20 + j * 26} y={10 + i * 26} width={24} height={24} rx={3} fill={on ? (cur!.odd ? "#ffe4e6" : "#ccfbf1") : "white"} stroke={on ? (cur!.odd ? BAD : OK) : "#cbd5e1"} strokeWidth={on ? 1.6 : 1} className={on ? POP : undefined} />;
        })}
        {cur && (
          <g key={cur.name} className={FADE}>
            <text x={124} y={40} fontSize={15} fontWeight={800} fontFamily={MONO} fill={INK}>
              {cur.name}
            </text>
            <text x={124} y={64} fontSize={15} fontWeight={800} fontFamily={MONO} fill={cur.odd ? BAD : OK}>
              {cur.odd ? "−" : "+"}
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 9½ · Side quest: বইয়েরও ভুল হয়. The book's G = [[1, 4, 5], [9, 2, 4],
//      [3, 5, 10]] walked right: 0 − 312 + 195 = −117.

const BS_M: M3 = [
  [1, 4, 5],
  [9, 2, 4],
  [3, 5, 10],
];
const BS_SAY = [
  "বইয়ের শেষ উদাহরণ। উপরের সারি ধরে হাঁটি: + − +।",
  "1 × (2·10 − 4·5) = 1 × 0 = 0.",
  "− 4 × (9·10 − 4·3) = − 4 × 78 = −312.",
  "+ 5 × (9·5 − 2·3) = 5 × 39 = 195.",
  "0 − 312 + 195 = −117. উত্তর বইয়ের সাথে মেলে। শুধু পাশের কয়েকটা লেখা ভুল ছাপা।",
];

export function BookSlip() {
  const s = useScene(4, [600, 1800, 1800, 1800, 2600]);
  const k = s.k;
  const col = k >= 1 && k <= 3 ? k - 1 : null;
  return (
    <Scene scene={s} caption={say(BS_SAY, k)}>
      <svg viewBox="0 0 230 104" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="বইয়ের matrix, 1 4 5, 9 2 4, 3 5 10; উপরের সারি ধরে হাঁটা; উত্তর মাইনাস 117">
        <rect width={230} height={104} rx={8} fill="#f6efe2" />
        <Mat3 m={BS_M} x={14} y={8} c={28} fontSize={13} cross={col !== null ? [0, col] : null} signs={k >= 1 ? 3 : 0} />
        <g fontFamily={MONO} fontWeight={800} fontSize={12}>
          {k >= 1 && (
            <text x={120} y={24} fill={INK} className={FADE}>
              + 0
            </text>
          )}
          {k >= 2 && (
            <text x={120} y={44} fill={BAD} className={FADE}>
              − 312
            </text>
          )}
          {k >= 3 && (
            <text x={120} y={64} fill={OK} className={FADE}>
              + 195
            </text>
          )}
          {k >= 4 && (
            <text x={120} y={90} fill={BLUE} fontSize={14} className={POP}>
              = −117
            </text>
          )}
        </g>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  KathaBet: { start: {}, picked: { pick: 2 }, tape: { pick: 3 }, three: { pick: 1 }, sealed: { pick: 0, sealed: true } },
  UnitCube: { start: {}, one: { full: [true, false] }, done: { full: [true, true] } },
  LeanTheStack: { start: {}, one: { lean: 1 }, done: { lean: 3 } },
  WalkTheTopRow: { start: {}, one: { cur: 0, done: [true, false, false] }, done: { cur: 2, done: [true, true, true] } },
  Checkerboard: { start: {}, wrong: { guess: 2 }, right: { guess: 1 }, board: { guess: 1, board: true }, row1: { guess: 1, board: true, line: 0 }, col1: { guess: 1, board: true, line: 3 } },
  PaikarBox: {
    start: {},
    wrong: { sgs: [1, 1, 1], mins: [3, 3, 1], ran: true, focus: 1 },
    badmin: { sgs: [1, -1, 1], mins: [3, 2, 1], ran: true, focus: 1 },
    done: { sgs: [1, -1, 1], mins: [3, 3, 1], ran: true, focus: 2 },
  },
  TryBox: { start: {}, less: { pick: 0 }, more: { pick: 1 }, done: { pick: 2 } },
  TooManyTerms: { start: {}, ten: { n: 10 }, done: { n: 20 } },
  BetOpen: { start: {}, two: { poured: 2 }, done: { poured: 4, opened: true } },
  PaikarArrives: { rest: { k: 0 }, claim: { k: 2 }, done: {} },
  KarimPushes: { rest: { k: 0 }, done: {} },
  NanaOldBox: { rest: { k: 0 }, done: {} },
  SaminTape: { say: { k: 1 }, done: {} },
  SaminPhone: { say: { k: 1 }, done: {} },
  PaikarPays: { pay: { k: 1 }, done: {} },
  LastHeart: { say: { k: 1 }, done: {} },
  KathaStake: { one: { k: 1 }, done: {} },
  EdgesToColumns: { one: { k: 1 }, done: {} },
  FlatInSpace: { rest: { k: 0 }, done: {} },
  WhichWayBack: { rest: { k: 0 }, push: { k: 2 }, done: {} },
  CrossOut: { mid: { k: 2 }, done: {} },
  SixTerms: { done: {} },
  SignBoard: { done: {} },
  DiagonalOnly: { rest: { k: 0 }, mid: { k: 1 }, done: {} },
  TriangleWay: { mid: { k: 1 }, done: {} },
  TermPaths: { two: { k: 2 }, done: {} },
  BookSlip: { two: { k: 2 }, done: {} },
};
