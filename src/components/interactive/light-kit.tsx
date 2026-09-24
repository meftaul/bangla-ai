"use client";

import { useId, type ReactNode } from "react";

import { Person } from "@/components/journey/cast";
import { usePlay } from "@/components/journey/kit";
import { Arrow, makeFrame, tup, type Frame, type XY } from "@/components/journey/plane";
import { byCols, partway, pathOf, type Cols, type Move } from "./road-kit";

// The light wall, shared by the Article 7 journeys on the light machine
// (7.2 → 7.4), so the নানাবাড়ির দেয়াল, its chalk grid and the লাইট ভাই's
// machine look the same everywhere, the way 6.x shared road-kit.tsx.
//
// Coordinates are Rina's chalk grid on the whitewashed wall: the nail on the
// বারান্দার খুঁটি is (0, 0), x runs right along the wall, y runs up. The wall
// shows x −3…9, y −2…6: the post at x = 0, আপার জানালা just right of it, the
// door further right, the নারকেল গাছ at the right edge.
//
// The machine is a 2 × 2 matrix, given by its columns (road-kit's `Cols`):
// knob 1's one turn pushes the dot by cols[0], knob 2's by cols[1]. With knob
// turns (a, b) the dot sits at a·cols[0] + b·cols[1] = `apply(cols, [a, b])`.
// The lens *is* the matrix: change the lens and both jumps change.
//
// Two kinds of pieces:
//   · wall pieces, drawn inside a journey/plane <Plane f={…} paper={false}>
//     with a frame from `wallFrame()` (or WALL_F): WallBed, WallGrid, Post,
//     LightDot, Beam, ColArrow, LitRegion, Scribble, LightGrid, Heart, WallClip;
//   · stage pieces, for cast <Stage> story scenes (320 × 180 units): StageWall
//     (the same wall, small, children drawn with STAGE_WALL_F), Projector,
//     StageBeam, LightBhai.
// Plus HTML chrome: KnobDial, KnobControl, LensCard; and the hook useLensRun.
//
// Everything on the wall is fixed ink (the wall is "paper": the same in light
// and dark mode).

export { ID, apply, byCols, partway, pathOf, rowsOf, type Cols, type Move } from "./road-kit";

// ---------------------------------------------------------------------------
// Numbers.

/** 7.2's old lens, [[2, 4], [1, 2]]: both knobs push along the same line (Check Q5). */
export const OLD_LENS: Cols = [
  [2, 1],
  [4, 2],
];
/** "Last night's" good lens G = [[2, 1], [1, 2]] (7.1's table, 6.3's two ropes); cracks after 7.2. */
export const GOOD_LENS: Cols = [
  [2, 1],
  [1, 2],
];
/** The decorator's spare [[1, 0], [0, 0]]: knob 2's wire is torn, its jump is (0, 0). */
export const SPARE_LENS: Cols = [
  [1, 0],
  [0, 0],
];

/** The wall's extent in grid units. */
export const WALL = { x0: -3, x1: 9, y0: -2, y1: 6 } as const;
/** A frame for the wall (journey/plane makeFrame); u = px per chalk square. */
export const wallFrame = (u = 24, pad = 8) => makeFrame(WALL.x0, WALL.x1, WALL.y0, WALL.y1, u, pad);
/** The default widget frame: 304 × 208. */
export const WALL_F = wallFrame();
/** The wall's frame inside a Stage scene (168 × 112, no pad); place it with <StageWall>. */
export const STAGE_WALL_F = makeFrame(WALL.x0, WALL.x1, WALL.y0, WALL.y1, 14, 0);

/** Landmarks, in grid units. */
export const DOOR = { x0: 5, x1: 7, top: 2.2 } as const;
export const WINDOW = { x0: 1, x1: 3, y0: 1.8, y1: 3.4 } as const;
/** আপার তিনটা heart: over the door (on the old lens's line), over her window, the নারকেল গাছ side. */
export const HEARTS = { door: [6, 3] as XY, window: [2, 4] as XY, tree: [8, 1] as XY };

/** What the two numbers of a wall spot count (for journey/box <Tup of>). */
export const WALL_SLOTS = ["ডানে কত ঘর", "উপরে কত ঘর"] as const;
/** What the two numbers of a knob setting count. */
export const KNOB_SLOTS = ["knob 1 এর পাক", "knob 2 এর পাক"] as const;

export const det = (c: Cols) => c[0][0] * c[1][1] - c[1][0] * c[0][1];
/** How many directions survive: 2 (whole wall), 1 (a line), 0 (only the pin). */
export const rankOf = (c: Cols) => (Math.abs(det(c)) > 1e-9 ? 2 : c.some((v) => Math.abs(v[0]) + Math.abs(v[1]) > 1e-9) ? 1 : 0);
/** Is p in the column space (can the dot ever land there)? */
export const inSpan = (c: Cols, p: XY) => {
  const r = rankOf(c);
  if (r === 2) return true;
  if (r === 0) return Math.abs(p[0]) + Math.abs(p[1]) < 1e-9;
  const d = Math.abs(c[0][0]) + Math.abs(c[0][1]) > 1e-9 ? c[0] : c[1];
  return Math.abs(d[0] * p[1] - d[1] * p[0]) < 1e-9;
};
/** The knob turns (a, b) that land the dot on p, for a lens that loses nothing; null otherwise. */
export const solve = (c: Cols, p: XY): XY | null => {
  const D = det(c);
  if (Math.abs(D) < 1e-9) return null;
  return [(p[0] * c[1][1] - c[1][0] * p[1]) / D, (c[0][0] * p[1] - p[0] * c[0][1]) / D];
};
/** Is p on the wall? */
export const onWall = (p: XY) => p[0] >= WALL.x0 && p[0] <= WALL.x1 && p[1] >= WALL.y0 && p[1] <= WALL.y1;

/**
 * Knob settings "turned every which way": n pseudo-random (a, b) in ±range,
 * the same every render (a fixed seed), sent through the lens; only the spots
 * that land on the wall are kept. Feed them to <Scribble>.
 */
export const sweepPts = (c: Cols, n = 520, range = 5, seed = 7): XY[] => {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const out: XY[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = (rnd() * 2 - 1) * range;
    const b = (rnd() * 2 - 1) * range;
    const p: XY = [a * c[0][0] + b * c[1][0], a * c[0][1] + b * c[1][1]];
    if (onWall(p)) out.push(p);
  }
  return out;
};

const INK = "#0f1b2d";
const LIME = "#e9e4d8"; // চুনকাম in the evening
const CHALK = "#64748b";
const GLOW = "#fde047";
const LAMP = "#f59e0b";
const WOOD = "#8b5e34";
/** knob / column colours: knob 1 amber, knob 2 teal (road-kit's ropes) */
export const KNOB_HEX = { 1: "#d97706", 2: "#0d9488" } as const;

// ---------------------------------------------------------------------------
// Wall pieces (inside a <Plane paper={false}>).

/** Clip children to the wall (Plane doesn't clip; a lit region or a moved grid runs off it). */
export function WallClip({ f, children }: { f: Frame; children: ReactNode }) {
  const id = `lw${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

/**
 * The whitewashed wall, edge to edge of the frame: plinth along the bottom,
 * and (each optional) আপার জানালা, the door, and the নারকেল গাছ at the right edge.
 */
export function WallBed({ f, door = true, window: win = true, tree = true }: { f: Frame; door?: boolean; window?: boolean; tree?: boolean }) {
  const plinth = f.sy(WALL.y0) + 2;
  return (
    <g className="pointer-events-none">
      <rect x={0} y={0} width={f.W} height={f.H} rx={6} fill={LIME} />
      {/* a few damp stains in the lime */}
      <ellipse cx={f.sx(-1.6)} cy={f.sy(4.6)} rx={f.u * 0.9} ry={f.u * 0.4} fill="#d6cfbf" opacity={0.6} />
      <ellipse cx={f.sx(4)} cy={f.sy(-1.2)} rx={f.u * 1.3} ry={f.u * 0.35} fill="#d6cfbf" opacity={0.5} />
      <rect x={0} y={plinth} width={f.W} height={Math.max(0, f.H - plinth)} fill="#a8a29e" />
      {win && (
        <g>
          <rect x={f.sx(WINDOW.x0)} y={f.sy(WINDOW.y1)} width={(WINDOW.x1 - WINDOW.x0) * f.u} height={(WINDOW.y1 - WINDOW.y0) * f.u} fill="#1e3a5f" stroke="#57534e" strokeWidth={f.u * 0.12} />
          {[1, 2, 3].map((i) => (
            <path key={i} d={`M${f.sx(WINDOW.x0 + (i * (WINDOW.x1 - WINDOW.x0)) / 4)} ${f.sy(WINDOW.y1)}V${f.sy(WINDOW.y0)}`} stroke="#57534e" strokeWidth={f.u * 0.07} />
          ))}
        </g>
      )}
      {door && (
        <g>
          <rect x={f.sx(DOOR.x0)} y={f.sy(DOOR.top)} width={(DOOR.x1 - DOOR.x0) * f.u} height={plinth - f.sy(DOOR.top)} fill="#7c4a24" stroke="#57331a" strokeWidth={f.u * 0.1} />
          <path d={`M${f.sx((DOOR.x0 + DOOR.x1) / 2)} ${f.sy(DOOR.top)}V${plinth}`} stroke="#57331a" strokeWidth={f.u * 0.06} />
          <circle cx={f.sx((DOOR.x0 + DOOR.x1) / 2) - f.u * 0.2} cy={f.sy(0.2)} r={f.u * 0.07} fill="#fbbf24" />
        </g>
      )}
      {tree && (
        <g>
          <path d={`M${f.W + f.u * 0.2} ${f.H}Q${f.W - f.u * 0.3} ${f.H * 0.5} ${f.W - f.u * 0.1} ${f.u * 0.4}`} stroke="#78532e" strokeWidth={f.u * 0.32} fill="none" strokeLinecap="round" />
          {[-150, -115, -70, -35].map((a) => {
            const r = (a * Math.PI) / 180;
            const x0 = f.W - f.u * 0.1;
            const y0 = f.u * 0.4;
            return <path key={a} d={`M${x0} ${y0}q${Math.cos(r) * f.u * 0.9} ${Math.sin(r) * f.u * 0.6 - f.u * 0.4} ${Math.cos(r) * f.u * 1.9} ${f.u * 0.4}`} stroke="#3f7d3a" strokeWidth={f.u * 0.16} fill="none" strokeLinecap="round" />;
          })}
        </g>
      )}
    </g>
  );
}

/** Rina's faint chalk grid on the wall; `nums` writes the counts along the pin's row and the post. */
export function WallGrid({ f, nums = true }: { f: Frame; nums?: boolean }) {
  let d = "";
  for (let x = WALL.x0; x <= WALL.x1; x += 1) d += `M${f.sx(x)} ${f.sy(WALL.y0)}V${f.sy(WALL.y1)}`;
  for (let y = WALL.y0; y <= WALL.y1; y += 1) d += `M${f.sx(WALL.x0)} ${f.sy(y)}H${f.sx(WALL.x1)}`;
  const fs = Math.max(5.5, f.u * 0.3);
  return (
    <g className="pointer-events-none">
      <path d={d} strokeWidth={0.7} stroke={CHALK} strokeOpacity={0.3} fill="none" />
      <path d={`M${f.sx(WALL.x0)} ${f.sy(0)}H${f.sx(WALL.x1)}`} strokeWidth={1.1} stroke={CHALK} strokeOpacity={0.55} />
      {nums &&
        [-2, 2, 4, 6, 8].map((x) => (
          <text key={`x${x}`} x={f.sx(x)} y={f.sy(0) + fs + 2} textAnchor="middle" fontSize={fs} fontFamily="ui-monospace, monospace" fill={INK} fillOpacity={0.5}>
            {x < 0 ? `−${-x}` : x}
          </text>
        ))}
      {nums &&
        [-1, 2, 4].map((y) => (
          <text key={`y${y}`} x={f.sx(0) - f.u * 0.35} y={f.sy(y) + fs * 0.35} textAnchor="end" fontSize={fs} fontFamily="ui-monospace, monospace" fill={INK} fillOpacity={0.5}>
            {y < 0 ? `−${-y}` : y}
          </text>
        ))}
    </g>
  );
}

/** The বারান্দার খুঁটি standing along x = 0, with the nail at (0, 0) where the grid is tied: the pin. */
export function Post({ f }: { f: Frame }) {
  const w = f.u * 0.34;
  return (
    <g className="pointer-events-none">
      <rect x={f.sx(0) - w / 2} y={0} width={w} height={f.H} fill={WOOD} opacity={0.85} />
      <path d={`M${f.sx(0) - w / 2 + 1} 0V${f.H}`} stroke="#a47148" strokeWidth={0.8} />
      <circle cx={f.sx(0)} cy={f.sy(0)} r={Math.max(2.4, f.u * 0.12)} fill="#e5e7eb" stroke={INK} strokeWidth={0.9} />
    </g>
  );
}

/** The light dot at a wall spot; `faint` for a ghost (a guess, where it was). */
export function LightDot({ f, at, r, faint = false }: { f: Frame; at: XY; r?: number; faint?: boolean }) {
  const R = r ?? Math.max(3.2, f.u * 0.2);
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none" opacity={faint ? 0.4 : 1}>
      <circle cx={x} cy={y} r={R * 2.6} fill={GLOW} opacity={0.25} />
      <circle cx={x} cy={y} r={R * 1.6} fill={GLOW} opacity={0.55} />
      <circle cx={x} cy={y} r={R} fill="white" stroke={LAMP} strokeWidth={1.2} />
    </g>
  );
}

/** The machine's beam, a thin cone from below the frame (the machine stands in the উঠান) to the dot. */
export function Beam({ f, to, from }: { f: Frame; to: XY; from?: [number, number] }) {
  const [x0, y0] = from ?? [f.W * 0.82, f.H + 6];
  const x = f.sx(to[0]);
  const y = f.sy(to[1]);
  const L = Math.hypot(x - x0, y - y0) || 1;
  const nx = (-(y - y0) / L) * f.u * 0.18;
  const ny = ((x - x0) / L) * f.u * 0.18;
  return <path d={`M${x0} ${y0}L${x + nx} ${y + ny}L${x - nx} ${y - ny}Z`} fill={GLOW} opacity={0.22} className="pointer-events-none" />;
}

/** A column of the lens as a tappable arrow: knob 1's jump (amber) or knob 2's (teal). */
export function ColArrow({ f, col, which, from = [0, 0], draw = false, faint = false, w = 2.6 }: { f: Frame; col: XY; which: 1 | 2; from?: XY; draw?: boolean; faint?: boolean; w?: number }) {
  return <Arrow f={f} from={from} to={[from[0] + col[0], from[1] + col[1]]} tone={which === 1 ? "amber" : "teal"} w={w} draw={draw} faint={faint} />;
}

/**
 * Everywhere the dot can land (the column space), lit on the wall: the whole
 * wall for a lens that loses nothing, a band through the pin for a lens whose
 * columns share a line, only the pin for the dark lens. `t` 0 → 1 grows it
 * out from the pin (animate it with useLensRun). Clipped to the wall.
 */
export function LitRegion({ f, cols, t = 1 }: { f: Frame; cols: Cols; t?: number }) {
  const r = rankOf(cols);
  const x = f.sx(0);
  const y = f.sy(0);
  if (r === 0 || t <= 0) return r === 0 ? <circle cx={x} cy={y} r={f.u * 0.3} fill={GLOW} opacity={0.7} className="pointer-events-none" /> : null;
  if (r === 1) {
    const d = Math.abs(cols[0][0]) + Math.abs(cols[0][1]) > 1e-9 ? cols[0] : cols[1];
    const n = Math.hypot(d[0], d[1]);
    const L = 20 * t;
    const a: XY = [(-d[0] / n) * L, (-d[1] / n) * L];
    const b: XY = [(d[0] / n) * L, (d[1] / n) * L];
    const seg = `M${f.sx(a[0])} ${f.sy(a[1])}L${f.sx(b[0])} ${f.sy(b[1])}`;
    return (
      <WallClip f={f}>
        <g className="pointer-events-none">
          <path d={seg} stroke={GLOW} strokeWidth={f.u * 0.55} strokeOpacity={0.5} strokeLinecap="round" />
          <path d={seg} stroke={LAMP} strokeWidth={1.4} strokeOpacity={0.9} strokeLinecap="round" />
        </g>
      </WallClip>
    );
  }
  const R = 12 * t;
  const m = byCols(cols);
  const pts: XY[] = [m([R, R]), m([-R, R]), m([-R, -R]), m([R, -R])];
  return (
    <WallClip f={f}>
      <path d={pathOf(f, (p) => p, pts, true)} fill={GLOW} fillOpacity={0.42} stroke={LAMP} strokeOpacity={0.6} strokeWidth={1} className="pointer-events-none" />
    </WallClip>
  );
}

/** Where the dot has been: small light specks (the first `show` of them, default all). */
export function Scribble({ f, pts, show }: { f: Frame; pts: readonly XY[]; show?: number }) {
  const n = show ?? pts.length;
  return (
    <g className="pointer-events-none">
      {pts.slice(0, n).map((p, i) => (
        <circle key={i} cx={f.sx(p[0])} cy={f.sy(p[1])} r={Math.max(1.3, f.u * 0.07)} fill={LAMP} opacity={0.75} />
      ))}
    </g>
  );
}

/**
 * The light pattern the machine throws: the grid of lines x = x0…x1,
 * y = y0…y1, carried by the lens `move` (partway by `t`, 0 = plain grid), in
 * light over the chalk. `ghost` keeps the plain pattern faintly underneath.
 * This is the "run any 2 × 2 on the whole wall" piece for 7.3/7.4:
 * <LightGrid f={f} move={byCols(W)} t={run.t} />.
 */
export function LightGrid({ f, move, t = 1, x0 = -3, x1 = 9, y0 = -2, y1 = 6, ghost = false }: { f: Frame; move: Move; t?: number; x0?: number; x1?: number; y0?: number; y1?: number; ghost?: boolean }) {
  const m = partway(move, t);
  const lines = (mv: Move) => {
    let d = "";
    for (let x = x0; x <= x1; x += 1) d += pathOf(f, mv, [[x, y0], [x, y1]]);
    for (let y = y0; y <= y1; y += 1) d += pathOf(f, mv, [[x0, y], [x1, y]]);
    return d;
  };
  return (
    <WallClip f={f}>
      <g className="pointer-events-none">
        {ghost && <path d={lines((p) => p)} strokeWidth={0.8} stroke={LAMP} strokeOpacity={0.2} fill="none" />}
        <path d={lines(m)} strokeWidth={2.4} stroke={GLOW} strokeOpacity={0.55} fill="none" />
        <path d={lines(m)} strokeWidth={0.9} stroke={LAMP} strokeOpacity={0.85} fill="none" />
        <path d={pathOf(f, m, [[x0, 0], [x1, 0]])} strokeWidth={1.8} stroke={KNOB_HEX[1]} strokeOpacity={0.9} fill="none" />
        <path d={pathOf(f, m, [[0, y0], [0, y1]])} strokeWidth={1.8} stroke={KNOB_HEX[2]} strokeOpacity={0.9} fill="none" />
      </g>
    </WallClip>
  );
}

/** a heart outline centred on (x, y), s ≈ half its width, in SVG units */
export const heartPath = (x: number, y: number, s: number) =>
  `M${x} ${y + s * 0.85}C${x - s * 1.5} ${y - s * 0.1} ${x - s * 0.75} ${y - s * 1.25} ${x} ${y - s * 0.4}C${x + s * 0.75} ${y - s * 1.25} ${x + s * 1.5} ${y - s * 0.1} ${x} ${y + s * 0.85}Z`;

/**
 * One of আপার hearts on the wall: a dashed chalk outline until `lit`, then
 * glowing pink. `mark` hangs a "?" (a sealed guess) or a cross (the light
 * can't get there) beside it; `ring` circles it (picked).
 */
export function Heart({ f, at, lit = false, mark, ring = false, s }: { f: Frame; at: XY; lit?: boolean; mark?: "?" | "x"; ring?: boolean; s?: number }) {
  const S = s ?? f.u * 0.42;
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      {lit && <circle cx={x} cy={y} r={S * 2} fill={GLOW} opacity={0.35} />}
      {ring && <circle cx={x} cy={y} r={S * 1.9} fill="none" stroke="#2563eb" strokeWidth={1.6} />}
      <path
        d={heartPath(x, y, S)}
        fill={lit ? "#ec4899" : "white"}
        fillOpacity={lit ? 0.95 : 0.5}
        stroke={lit ? "#be185d" : "#db2777"}
        strokeWidth={1.3}
        strokeDasharray={lit ? undefined : "2.5 2"}
        className="transition-[fill,fill-opacity] duration-500 motion-reduce:transition-none"
      />
      {mark === "?" && (
        <text x={x + S * 1.3} y={y - S * 0.6} fontSize={S * 1.7} fontWeight={800} fill="#2563eb">
          ?
        </text>
      )}
      {mark === "x" && <path d={`M${x - S} ${y - S}l${2 * S} ${2 * S}m0 ${-2 * S}l${-2 * S} ${2 * S}`} stroke="#e11d48" strokeWidth={1.8} strokeLinecap="round" />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// HTML chrome: the knobs and the lens as numbers.

const KNOB_TEXT = { 1: "text-cat-amber", 2: "text-cat-teal" } as const;

/** One knob, seen from the front: a dial whose mark turns 45° per turn (CSS transition). */
export function KnobDial({ turns, which, size = 40 }: { turns: number; which: 1 | 2; size?: number }) {
  const c = KNOB_HEX[which];
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      <circle cx={20} cy={20} r={17} fill="#334155" stroke={c} strokeWidth={3} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <circle key={i} cx={20 + Math.sin(a) * 13} cy={20 - Math.cos(a) * 13} r={0.9} fill="#cbd5e1" />;
      })}
      <g style={{ transform: `rotate(${turns * 45}deg)`, transformOrigin: "20px 20px" }} className="transition-transform duration-500 ease-out motion-reduce:transition-none">
        <path d="M20 20V7" stroke={c} strokeWidth={3.2} strokeLinecap="round" />
      </g>
      <circle cx={20} cy={20} r={3} fill="#e2e8f0" />
    </svg>
  );
}

/** a curved turn arrow, drawn (no glyphs): dir −1 back, +1 forward */
function TurnGlyph({ dir }: { dir: -1 | 1 }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
      <g transform={dir < 0 ? "translate(20 0) scale(-1 1)" : undefined}>
        <path d="M5 13A6 6 0 1 1 13 15.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        <path d="M13 11.5l0.5 4.5l-4.5 0.4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/**
 * A knob with its two turn buttons (back, forward), its turns so far, and its
 * jump written under it. `onTurn(±1)`; a side is disabled when that turn would
 * throw the dot off the wall (the screen decides).
 */
export function KnobControl({
  which,
  turns,
  col,
  onTurn,
  canBack = true,
  canFwd = true,
  showCol = true,
}: {
  which: 1 | 2;
  turns: number;
  col: XY;
  onTurn: (d: -1 | 1) => void;
  canBack?: boolean;
  canFwd?: boolean;
  showCol?: boolean;
}) {
  const btn =
    "grid size-9 cursor-pointer place-items-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-foreground/10 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent motion-reduce:transition-none";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`text-xs font-semibold ${KNOB_TEXT[which]}`}>
        knob {which}: <span className="font-mono">{turns < 0 ? `−${-turns}` : turns}</span> পাক
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" aria-label={`knob ${which} এক পাক পেছনে`} className={btn} disabled={!canBack} onClick={() => onTurn(-1)}>
          <TurnGlyph dir={-1} />
        </button>
        <KnobDial turns={turns} which={which} size={36} />
        <button type="button" aria-label={`knob ${which} এক পাক সামনে`} className={btn} disabled={!canFwd} onClick={() => onTurn(1)}>
          <TurnGlyph dir={1} />
        </button>
      </div>
      {showCol && (
        <div className="text-xs text-muted">
          এক পাকে <span className="font-mono">{tup(col).replace(", ", ",\u00a0")}</span>
        </div>
      )}
    </div>
  );
}

/** The lens as a matrix: two columns side by side, knob 1's amber, knob 2's teal. */
export function LensCard({ cols, name, small = false }: { cols: Cols; name?: ReactNode; small?: boolean }) {
  const n = (v: number) => (v < 0 ? `−${-v}` : `${v}`);
  const cell = small ? "w-4 text-xs" : "w-5 text-sm";
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {name && <span className="text-sm">{name}</span>}
      <span className={`inline-flex items-stretch font-mono font-bold ${small ? "text-xs" : "text-sm"}`}>
        <span className="w-1 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
        {[0, 1].map((c) => (
          <span key={c} className={`flex flex-col items-center px-0.5 ${KNOB_TEXT[(c + 1) as 1 | 2]}`}>
            <span className={`${cell} text-center`}>{n(cols[c][0])}</span>
            <span className={`${cell} text-center`}>{n(cols[c][1])}</span>
          </span>
        ))}
        <span className="w-1 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
      </span>
    </span>
  );
}

/**
 * Run a lens, a sweep or a glide: t goes 0 → 1 over `ms` in `frames` ticks
 * when `run(done?)` is called; `done` fires from the timer at the end. Before
 * the first run t is 0; a screen that shows a settled state (a fixture, a
 * finished run) decides that itself.
 */
export function useLensRun(ms = 1200, frames = 24) {
  const p = usePlay(ms / frames);
  return { t: p.k / frames, running: p.running, run: (done?: () => void) => p.play(frames, done), frames };
}

// ---------------------------------------------------------------------------
// Stage pieces (inside a cast <Stage>, 320 × 180).

/**
 * The same wall, small, for a story scene: top-left corner at (x, y), 168 ×
 * 112 units (STAGE_WALL_F), plinth to the ground at y + 112. Children are
 * drawn in wall units with STAGE_WALL_F (<LightDot f={STAGE_WALL_F} …/>).
 * A strip of roof sits above it.
 */
export function StageWall({ x = 16, y = 30, grid = true, children }: { x?: number; y?: number; grid?: boolean; children?: ReactNode }) {
  const f = STAGE_WALL_F;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M-8 0L${f.W + 8} 0L${f.W - 4} -12L4 -12Z`} fill="#9f5a3a" />
      <WallBed f={f} />
      {grid && <WallGrid f={f} nums={false} />}
      <Post f={f} />
      {children}
    </g>
  );
}

/** Where the machine's lens is, for a Projector whose feet are at (x, y). */
export const projectorLens = (x: number, y: number, facing: 1 | -1 = -1): [number, number] => [x + facing * 19, y - 58];

/**
 * The লাইট ভাই's machine on its bamboo stand, feet at (x, y), lens toward
 * `facing` (−1: left, the wall's side). `on` lights the lens; `knobs` turns the
 * two dials on its side; `lens` "old" | "good" | "spare" | "empty" (a cracked
 * lens: "cracked").
 */
export function Projector({
  x,
  y,
  facing = -1,
  on = false,
  knobs = [0, 0],
  lens = "old",
}: {
  x: number;
  y: number;
  facing?: 1 | -1;
  on?: boolean;
  knobs?: [number, number];
  lens?: "old" | "good" | "spare" | "empty" | "cracked";
}) {
  const [lx, ly] = projectorLens(x, y, facing);
  const glass = lens === "empty" ? "#1f2937" : lens === "good" ? "#a7f3d0" : lens === "spare" ? "#d6d3d1" : "#bae6fd";
  return (
    <g className="pointer-events-none">
      {/* the bamboo tripod */}
      {[-15, 0, 15].map((dx) => (
        <path key={dx} d={`M${x} ${y - 46}L${x + dx} ${y}`} stroke="#b08d3c" strokeWidth={2.6} strokeLinecap="round" />
      ))}
      {[-7, 7].map((dx) => (
        <path key={`n${dx}`} d={`M${x + dx * 1.1 - 2} ${y - 22}h4`} stroke="#7c5e1e" strokeWidth={1} />
      ))}
      {/* the box */}
      <rect x={x - 16} y={y - 68} width={32} height={20} rx={3} fill="#334155" stroke={INK} strokeWidth={0.8} />
      <rect x={x - 8} y={y - 72} width={16} height={5} rx={1.5} fill="#475569" />
      {/* the two knobs on its side */}
      {[0, 1].map((i) => {
        const kx = x - 6 * facing + i * 9 * -facing - 4 * -facing;
        const ky = y - 55;
        const a = (knobs[i] * Math.PI) / 4;
        return (
          <g key={i}>
            <circle cx={kx} cy={ky} r={3.4} fill="#1e293b" stroke={KNOB_HEX[(i + 1) as 1 | 2]} strokeWidth={1.4} />
            <path d={`M${kx} ${ky}l${Math.sin(a) * 2.8} ${-Math.cos(a) * 2.8}`} stroke={KNOB_HEX[(i + 1) as 1 | 2]} strokeWidth={1.2} strokeLinecap="round" />
          </g>
        );
      })}
      {/* the lens barrel and glass */}
      <rect x={facing < 0 ? lx - 1 : lx - 6} y={ly - 6} width={7} height={12} fill="#1e293b" />
      {on && <circle cx={lx} cy={ly} r={9} fill={GLOW} opacity={0.35} />}
      <circle cx={lx} cy={ly} r={5.5} fill={on ? GLOW : glass} stroke={INK} strokeWidth={1} />
      {lens === "cracked" && <path d={`M${lx - 4} ${ly - 3}l3 2l-1 3l3 2`} stroke={INK} strokeWidth={0.9} fill="none" />}
    </g>
  );
}

/** A beam of light in a Stage scene, from the lens to a spot on the wall. */
export function StageBeam({ from, to, w = 3.5 }: { from: [number, number]; to: [number, number]; w?: number }) {
  const L = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const nx = (-(to[1] - from[1]) / L) * w;
  const ny = ((to[0] - from[0]) / L) * w;
  return <path d={`M${from[0]} ${from[1]}L${to[0] + nx} ${to[1] + ny}L${to[0] - nx} ${to[1] - ny}Z`} fill={GLOW} opacity={0.3} className="pointer-events-none" />;
}

/**
 * The লাইট ভাই: মামার look (no মামা in these scenes), his name under his feet,
 * a cigarette tucked behind his ear. Takes Person's pose props.
 */
export function LightBhai({
  x,
  y,
  facing = 1,
  arm = "down",
  walking = false,
  ms = 1200,
  name = true,
  nameTone = INK,
}: {
  x: number;
  y: number;
  facing?: 1 | -1;
  arm?: "down" | "wave" | "hold" | "point";
  walking?: boolean;
  ms?: number;
  name?: boolean;
  /** the name's ink: light on a night stage */
  nameTone?: string;
}) {
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} arm={arm} walking={walking} ms={ms} />
      {/* the cigarette behind the ear, riding along with him */}
      <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
        <path d={`M${-facing * 6} -56l${-facing * 7} -3`} stroke="white" strokeWidth={1.8} strokeLinecap="round" />
        <path d={`M${-facing * 12} -58.6l${-facing * 1.4} -0.6`} stroke="#f97316" strokeWidth={1.8} strokeLinecap="round" />
        {name && (
          <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={nameTone}>
            লাইট ভাই
          </text>
        )}
      </g>
    </>
  );
}
