"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import {
  Choice,
  Draw,
  FADE,
  Nope,
  POP,
  Scene,
  Ticks,
  pill,
  primaryBtn,
  usePlay,
  useScene,
  useSeed,
  useTween,
  LOOK,
  type Fixtures,
  type Look,
} from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person as CastPerson, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Dot, Label, Plane, clamp, makeFrame, plus, tup, type XY } from "@/components/journey/plane";
import { Task, useGate } from "@/components/journey/journey";

// Screens for "Math for AI 5.4 — The flat sheet, where the khata really lives",
// told as a Journey in plain English, 8 steps (the pathshala-journey skill).
//
// The evening of moving day. Samin sits on the stairs with the dalal's khata
// from 5.2 (six flats: bed, bath, total rooms). Nasib says three columns
// means the flats spread three ways; Samin says they sit on one flat sheet,
// two directions. The loser carries the last box up. The reader seals a bet
// (SheetBet), then learns what a flat sheet in a room is: every span holds the
// door corner, the shelf doesn't (FloorInRoom, subspace); a set you can't fall
// out of by adding or stretching (CantFallOut, vector space); the khata's dots
// seen edge-on (FlatSheet); the two buttons that paint them (SheetFromButtons);
// three new pages judged unaided (YourCloud); a real khata that sits only near
// a sheet (TryNearlyFlat); and the bet opened (BetSettled).
//
// The "room of numbers" is drawn here in 3D (Room3): a plain orthographic
// camera that turns about the up axis, so a flat sheet can be turned edge-on.
// Cast name labels are Bangla chrome, so English names are drawn here (NameTag).
//
// Story scenes: StairsBet, ThreeBoards, LastBox. Watch-only figures, one in
// every <Then>: SixDots, FourKinds, FloorClub, SheetThrough, TwoButtonsPaint,
// ThreePages, Pancake, ColumnsNotDirections.
//
// Tailwind only. Drawn "paper" (the room, the floor sheet) is fixed ink.

/** A story scene takes `story` and ignores it (see journey.tsx). */
type Story = { story?: boolean };

/** A name under someone's feet — cast labels are Bangla, so English ones are drawn here. */
function NameTag({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={7} fontWeight={700} className="fill-[#5a6b7d]" pointerEvents="none">
      {name}
    </text>
  );
}

// ---------------------------------------------------------------------------
// The room of numbers: 3D maths and one camera.

type V3 = [number, number, number];
const RAD = Math.PI / 180;
const plus3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const times3 = (k: number, a: V3): V3 => [k * a[0], k * a[1], k * a[2]];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const mul3 = (a: V3, s: V3): V3 => [a[0] * s[0], a[1] * s[1], a[2] * s[2]];
const r2 = (n: number) => Math.round(n * 100) / 100;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

/** the camera looks down at PITCH degrees and turns about the up axis */
const PITCH = 20;
/** the view every room opens on: the door corner at the back */
const YAW0 = 36;
const SW = 300;
const SH = 206;

type Cam = { yaw: number; s: number; c: V3; mid: number };
/** a room's zoom and height, worked out once so it fits the picture at every turn in `yaws` */
type Fit = { s: number; mid: number };
const centre = (box: V3): V3 => [box[0] / 2, box[1] / 2, box[2] / 2];

/** a point of the room, before zoom: across the picture, and up it */
function flat2(yaw: number, c: V3, p: V3): XY {
  const y = yaw * RAD;
  const t = PITCH * RAD;
  const q0 = p[0] - c[0];
  const q1 = p[1] - c[1];
  const q2 = p[2] - c[2];
  const x = -Math.sin(y) * q0 + Math.cos(y) * q1;
  const up = -Math.sin(t) * Math.cos(y) * q0 - Math.sin(t) * Math.sin(y) * q1 + Math.cos(t) * q2;
  return [x, up];
}
function fit(box: V3, yaws: number[]): Fit {
  const c = centre(box);
  const pts: V3[] = [];
  for (const x of [0, box[0] + 0.3]) for (const y of [0, box[1] + 0.3]) for (const z of [0, box[2] + 0.3]) pts.push([x, y, z]);
  let xm = 0;
  let lo = Infinity;
  let hi = -Infinity;
  for (const yaw of yaws)
    for (const p of pts) {
      const [x, up] = flat2(yaw, c, p);
      xm = Math.max(xm, Math.abs(x));
      lo = Math.min(lo, up);
      hi = Math.max(hi, up);
    }
  return { s: Math.min((SW / 2 - 22) / xm, (SH - 34) / (hi - lo)), mid: (hi + lo) / 2 };
}
/** every turn, for a room the reader can spin */
const ALL = Array.from({ length: 37 }, (_, i) => i * 10 - 180);
const cam = (yaw: number, box: V3, f: Fit): Cam => ({ yaw, s: f.s, c: centre(box), mid: f.mid });

/** where a point of the room lands on the picture */
function pr(m: Cam, p: V3): XY {
  const [x, up] = flat2(m.yaw, m.c, p);
  return [SW / 2 + m.s * x, SH / 2 + 2 - m.s * (up - m.mid)];
}
/** how near the eye a point is (bigger is nearer), for drawing order */
function near(m: Cam, p: V3) {
  const y = m.yaw * RAD;
  const t = PITCH * RAD;
  return Math.cos(t) * Math.cos(y) * (p[0] - m.c[0]) + Math.cos(t) * Math.sin(y) * (p[1] - m.c[1]) + Math.sin(t) * (p[2] - m.c[2]);
}
const eye = (yaw: number): V3 => [Math.cos(PITCH * RAD) * Math.cos(yaw * RAD), Math.cos(PITCH * RAD) * Math.sin(yaw * RAD), Math.sin(PITCH * RAD)];
/** 0 when a sheet with normal n is seen exactly edge-on */
const tilt = (n: V3, yaw: number) => Math.abs(dot3(eye(yaw), n)) / len3(n);
/** the turn, nearest `from`, at which a sheet with normal n goes edge-on */
function edgeYaw(n: V3, from: number) {
  const R = Math.hypot(n[0], n[1]);
  const phi = Math.atan2(n[1], n[0]) / RAD;
  const a = Math.acos(clamp((-Math.tan(PITCH * RAD) * n[2]) / R, -1, 1)) / RAD;
  const c = [wrap(phi + a), wrap(phi - a)];
  return Math.abs(wrap(c[0] - from)) <= Math.abs(wrap(c[1] - from)) ? c[0] : c[1];
}

const P = (n: number) => Math.round(n * 10) / 10;
const seg = (m: Cam, a: V3, b: V3) => {
  const p = pr(m, a);
  const q = pr(m, b);
  return `M${P(p[0])} ${P(p[1])}L${P(q[0])} ${P(q[1])}`;
};
const path3 = (m: Cam, ps: V3[]) => ps.map((p, i) => `${i ? "L" : "M"}${P(pr(m, p)[0])} ${P(pr(m, p)[1])}`).join("");
const poly = (m: Cam, ps: V3[]) => ps.map((p) => pr(m, p).map(P).join(",")).join(" ");
/** the parallelogram a·u + b·w, a in [0, A], b in [0, B] */
const patch = (u: V3, w: V3, A: number, B: number): V3[] => [[0, 0, 0], times3(A, u), plus3(times3(A, u), times3(B, w)), times3(B, w)];

const TONE3 = {
  blue: ["stroke-cat-blue", "fill-cat-blue"],
  coral: ["stroke-cat-coral", "fill-cat-coral"],
  teal: ["stroke-cat-teal", "fill-cat-teal"],
  violet: ["stroke-cat-violet", "fill-cat-violet"],
  amber: ["stroke-cat-amber", "fill-cat-amber"],
  danger: ["stroke-danger", "fill-danger"],
  ink: ["stroke-[#0f1b2d]", "fill-[#0f1b2d]"],
} as const;
type Tone3 = keyof typeof TONE3;

/** an arrow in the room, drawn on the picture */
function Arrow3({ m, from = [0, 0, 0], to, tone = "blue", w = 2.4, draw = false }: { m: Cam; from?: V3; to: V3; tone?: Tone3; w?: number; draw?: boolean }) {
  const a = pr(m, from);
  const b = pr(m, to);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (len < 2) return null;
  const ux = (b[0] - a[0]) / len;
  const uy = (b[1] - a[1]) / len;
  const h = Math.min(8 + w, len * 0.5);
  const bx = b[0] - ux * h;
  const by = b[1] - uy * h;
  const half = h * 0.45;
  const head = `M${P(b[0])} ${P(b[1])}L${P(bx - uy * half)} ${P(by + ux * half)}L${P(bx + uy * half)} ${P(by - ux * half)}Z`;
  const shaft = `M${P(a[0])} ${P(a[1])}L${P(bx)} ${P(by)}`;
  const [stroke, fill] = TONE3[tone];
  return (
    <g className="pointer-events-none">
      {draw ? <Draw d={shaft} strokeWidth={w} className={stroke} /> : <path d={shaft} strokeWidth={w} strokeLinecap="round" className={`fill-none ${stroke}`} />}
      <path d={head} className={`${fill} ${draw ? POP : ""}`} style={draw ? { transitionDelay: "450ms" } : undefined} />
    </g>
  );
}

/** words on the picture, with a white halo so they read over lines */
function Tag3({ m, at, dx = 0, dy = 0, anchor = "middle", size = 10, cls = "fill-[#0f1b2d]", children }: { m: Cam; at: V3; dx?: number; dy?: number; anchor?: "start" | "middle" | "end"; size?: number; cls?: string; children: ReactNode }) {
  const p = pr(m, at);
  return (
    <text x={P(p[0] + dx)} y={P(p[1] + dy)} textAnchor={anchor} fontSize={size} fontWeight={700} strokeWidth={3} className={`pointer-events-none stroke-white [paint-order:stroke] ${cls}`}>
      {children}
    </text>
  );
}

/** dots in the room, far ones first, each with a faint stem down to the floor */
function Dots3({ m, pts, look, r = 4.2, pop = false, stems = true }: { m: Cam; pts: V3[]; look?: (i: number) => string; r?: number; pop?: boolean; stems?: boolean }) {
  const order = pts.map((p, i) => ({ p, i, d: near(m, p) })).sort((a, b) => a.d - b.d);
  return (
    <g className="pointer-events-none">
      {stems &&
        order.map(({ p, i }) => (
          <path key={`s${i}`} d={seg(m, p, [p[0], p[1], 0])} strokeWidth={0.8} strokeDasharray="2 2" className="stroke-[#0f1b2d]/25" />
        ))}
      {order.map(({ p, i }) => {
        const q = pr(m, p);
        return (
          <circle
            key={i}
            cx={P(q[0])}
            cy={P(q[1])}
            r={r}
            strokeWidth={1.2}
            className={`stroke-white transition-colors duration-300 motion-reduce:transition-none ${look ? look(i) : "fill-cat-blue"} ${pop ? POP : ""}`}
            style={pop ? { transitionDelay: `${i * 90}ms` } : undefined}
          />
        );
      })}
    </g>
  );
}

/**
 * The room: a floor with a 1-unit grid, three named directions from the door
 * corner, and (for a real room) the two back walls. `turn` makes it draggable.
 */
function Room3({
  m,
  box,
  names,
  walls = false,
  label,
  turn,
  size = "max-w-[20rem]",
  children,
}: {
  m: Cam;
  box: V3;
  names: [string, string, string];
  walls?: boolean;
  label: string;
  turn?: (d: number) => void;
  size?: string;
  children?: ReactNode;
}) {
  const held = useRef<number | null>(null);
  let grid = "";
  for (let x = 1; x < box[0]; x++) grid += seg(m, [x, 0, 0], [x, box[1], 0]);
  for (let y = 1; y < box[1]; y++) grid += seg(m, [0, y, 0], [box[0], y, 0]);
  const ends: V3[] = [
    [box[0] + 0.3, 0, 0],
    [0, box[1] + 0.3, 0],
    [0, 0, box[2] + 0.3],
  ];
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!turn) return;
    const d = e.key === "ArrowLeft" ? -4 : e.key === "ArrowRight" ? 4 : 0;
    if (!d) return;
    e.preventDefault();
    turn(d);
  };
  return (
    <svg
      viewBox={`0 0 ${SW} ${SH}`}
      role={turn ? "application" : "img"}
      aria-label={label}
      tabIndex={turn ? 0 : undefined}
      onKeyDown={onKey}
      onPointerDown={
        turn
          ? (e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              held.current = e.clientX;
            }
          : undefined
      }
      onPointerMove={
        turn
          ? (e) => {
              if (held.current === null) return;
              const w = e.currentTarget.getBoundingClientRect().width;
              turn(((held.current - e.clientX) / w) * 220);
              held.current = e.clientX;
            }
          : undefined
      }
      onPointerUp={() => (held.current = null)}
      onPointerCancel={() => (held.current = null)}
      className={`mx-auto block h-auto w-full select-none rounded-2xl bg-white ring-1 ring-[#cbd5e1] outline-none focus-visible:ring-2 focus-visible:ring-accent ${size} ${
        turn ? "cursor-grab touch-none active:cursor-grabbing" : ""
      }`}
    >
      {walls && (
        <>
          <polygon points={poly(m, [[0, 0, 0], [box[0], 0, 0], [box[0], 0, box[2]], [0, 0, box[2]]])} className="fill-[#efe6d8]" />
          <polygon points={poly(m, [[0, 0, 0], [0, box[1], 0], [0, box[1], box[2]], [0, 0, box[2]]])} className="fill-[#e6dac5]" />
        </>
      )}
      <polygon points={poly(m, [[0, 0, 0], [box[0], 0, 0], [box[0], box[1], 0], [0, box[1], 0]])} className="fill-[#f4ecdc]" />
      <path d={grid} strokeWidth={0.6} className="pointer-events-none fill-none stroke-[#c9b48f]/70" />
      {ends.map((e, i) => (
        <Arrow3 key={i} m={m} to={e} tone="ink" w={1.1} />
      ))}
      {ends.map((e, i) => (
        <Tag3 key={`n${i}`} m={m} at={e} dx={i === 2 ? 5 : 0} dy={i === 2 ? 8 : 12} anchor={i === 2 ? "start" : "middle"} size={9.5} cls="fill-[#5a6b7d]">
          {names[i]}
        </Tag3>
      ))}
      <circle cx={P(pr(m, [0, 0, 0])[0])} cy={P(pr(m, [0, 0, 0])[1])} r={2.6} className="fill-[#0f1b2d]" />
      {children}
    </svg>
  );
}

/** the whole room lit up: its outline and a light wash on the ceiling */
function RoomFill({ m, box }: { m: Cam; box: V3 }) {
  const floor: V3[] = [
    [0, 0, 0],
    [box[0], 0, 0],
    [box[0], box[1], 0],
    [0, box[1], 0],
  ];
  const top = floor.map((q): V3 => [q[0], q[1], box[2]]);
  return (
    <g className={`${FADE} pointer-events-none`}>
      <polygon points={poly(m, top)} className="fill-cat-violet/15" />
      <path d={floor.map((q, i) => seg(m, q, top[i])).join("") + path3(m, [...top, top[0]])} strokeWidth={1} className="fill-none stroke-cat-violet/60" />
    </g>
  );
}
/** a sheet through the door corner with normal n, drawn over the floor [0, L] × [0, L] */
const sheetPatch = (n: V3, L: number) => patch([1, 0, -n[0] / n[2]], [0, 1, -n[1] / n[2]], L, L);

/** a slider that turns the room, for fingers that prefer it (and keyboards) */
function TurnBar({ yaw, onYaw, off = false }: { yaw: number; onYaw: (y: number) => void; off?: boolean }) {
  return (
    <label className="mx-auto mt-1.5 flex w-full max-w-[20rem] items-center gap-2 text-xs font-semibold text-muted">
      <span className="shrink-0">turn</span>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={Math.round(yaw)}
        disabled={off}
        onChange={(e) => onYaw(Number(e.target.value))}
        aria-label="turn the room"
        className="min-w-0 flex-1 cursor-pointer accent-cat-blue disabled:cursor-default disabled:opacity-40"
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// The shared data: the dalal's khata from 5.2 (rent-journey.tsx). Six flats as
// (bed, bath, total rooms); total = bed + bath on every row, so every dot sits
// on the sheet with normal (1, 1, −1), the span of (1, 0, 1) and (0, 1, 1).

const KHATA: V3[] = [
  [2, 1, 3],
  [3, 2, 5],
  [2, 2, 4],
  [3, 1, 4],
  [4, 2, 6],
  [1, 1, 2],
];
const KBOX: V3 = [4.6, 2.6, 7 * 0.75];
const KNAMES: [string, string, string] = ["bed", "bath", "total"];
/** the total direction is drawn at 0.75 size, so the room isn't a tall thin tower */
const KZ = 0.75;
const kd = (p: V3): V3 => [p[0], p[1], p[2] * KZ];
const KHATA_D = KHATA.map(kd);
/** the sheet's normal, as drawn */
const KN: V3 = [1, 1, -1 / KZ];
const BED_BTN: V3 = [1, 0, 1];
const BATH_BTN: V3 = [0, 1, 1];
const KSHEET = patch(kd(BED_BTN), kd(BATH_BTN), 4.5, 2.4);
const KFIX = fit(KBOX, [YAW0]);
const KALL = fit(KBOX, ALL);

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: evening of moving day.
//      Samin on the stairs with the khata, Nasib beside the last box. Nasib:
//      three columns, three directions. Samin: one flat sheet, two. The box
//      becomes the loser's box.

const GR = 150;

/** stairs going up to the right from x, each step 20 wide and 14 high */
function Stairs({ x, n = 6 }: { x: number; n?: number }) {
  let d = `M${x} ${GR}`;
  for (let i = 0; i < n; i++) d += `V${GR - 14 * (i + 1)}H${x + 20 * (i + 1)}`;
  d += `V${GR}Z`;
  return <path d={d} fill="#d6c3a1" stroke="#8a6a48" strokeWidth={1.2} className="pointer-events-none" />;
}

/** a taped cardboard box, bottom-centre at (x, y) */
function MoveBox({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none" style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: "1200ms" }}>
      <rect x={-15} y={-22} width={30} height={22} rx={1.5} fill="#c98f4f" stroke="#8a5a2b" strokeWidth={1} />
      <rect x={-15} y={-22} width={30} height={4} fill="#b77c3e" />
      <rect x={-3} y={-22} width={6} height={22} fill="#e8c48a" opacity={0.8} />
    </g>
  );
}

export function StairsBet({}: Story) {
  const s = useScene(3, [700, 2400, 2400, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="evening of moving day: Samin with the khata, Nasib by the last box at the foot of the stairs; they bet on how many directions the flats need">
        <Stairs x={236} n={4} />
        <MoveBox x={200} y={GR} />
        {k >= 3 && <CastCard x={200} y={GR - 38} text="loser's box" tone="coral" />}
        <CastPerson who="samin" x={64} y={GR} arm="hold" mood={k >= 2 ? "smug" : "plain"} />
        <CastCard x={82} y={GR - 44} text="khata" tone="amber" />
        <NameTag x={64} y={GR + 13} name="Samin" />
        {k === 2 && <Bubble x={64} y={GR - 66} lines={["One flat sheet.", "Two directions do it."]} />}
        <CastPerson who="nasib" x={140} y={GR} facing={-1} arm={k === 1 ? "point" : "down"} mood={k === 1 ? "smug" : k >= 2 ? "puzzled" : "plain"} />
        <NameTag x={140} y={GR + 13} name="Nasib" />
        {k === 1 && <Bubble x={140} y={GR - 66} lines={["Three columns,", "so three directions."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: 3, 2 or 1 directions, drawn as a room full of dots, a
//     sheet and a line. No marking; BetSettled opens it at the end.

const BET3 = [
  { n: 3, say: "3 directions", who: "Nasib: one for each column" },
  { n: 2, say: "2 directions", who: "Samin: one flat sheet" },
  { n: 1, say: "1 direction", who: "all six on one line" },
];

/** a tiny picture of a claim: dots filling a box, on a sheet, or on a line */
function ClaimPic({ n, on = false }: { n: number; on?: boolean }) {
  const dots: XY[] =
    n === 3
      ? [[14, 30], [24, 14], [34, 26], [40, 12], [20, 22], [44, 30]]
      : n === 2
        ? [[16, 28], [24, 22], [32, 26], [28, 16], [40, 20], [36, 12]]
        : [[12, 32], [19, 27], [26, 22], [33, 17], [40, 12], [46, 8]];
  return (
    <svg viewBox="0 0 56 40" className="h-9 w-auto shrink-0" aria-hidden="true">
      {n === 3 && <path d="M8 16h30v20H8zM8 16l10-10h30L38 16M48 6v20L38 36" fill="none" strokeWidth={1} className="stroke-[#5a6b7d]" />}
      {n === 2 && <path d="M6 34L20 8h34L40 34Z" strokeWidth={1} className="fill-cat-teal/15 stroke-cat-teal" />}
      {n === 1 && <path d="M6 36L52 4" strokeWidth={1.2} className="stroke-cat-teal" />}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.6} className={`fill-cat-blue ${on ? POP : ""}`} style={on ? { transitionDelay: `${i * 70}ms` } : undefined} />
      ))}
    </svg>
  );
}

/** the khata, turned on its side: one column per flat */
function KhataCard({ stamp = false }: { stamp?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[19rem] rounded-xl border border-[#c9b98f] bg-[#fbf6e9] px-2 py-1.5">
      <div className="grid grid-cols-[3.2rem_repeat(6,1fr)] gap-x-1 text-center text-[0.8rem] leading-snug text-[#3f3422]">
        <span className="text-left text-[0.65rem] font-semibold text-[#5a4a2a]">flat</span>
        {KHATA.map((_, i) => (
          <span key={i} className="font-mono text-[0.65rem] font-semibold text-[#5a4a2a]">
            {i + 1}
          </span>
        ))}
        {KNAMES.map((nm, c) => (
          <Row key={nm} name={nm} vals={KHATA.map((f) => f[c])} />
        ))}
      </div>
      {stamp && (
        <span className={`${POP} absolute -top-3 -right-2 -rotate-12 rounded border-2 border-cat-coral bg-[#fbf6e9] px-1.5 text-xs font-bold tracking-wide text-cat-coral`}>SEALED</span>
      )}
    </div>
  );
}
function Row({ name, vals }: { name: string; vals: number[] }) {
  return (
    <>
      <span className="text-left text-[0.7rem] font-semibold text-[#5a4a2a]">{name}</span>
      {vals.map((v, i) => (
        <span key={i} className="font-mono">
          {v}
        </span>
      ))}
    </>
  );
}

export function SheetBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const seal = () => {
    setSealed(true);
    pass("Bet sealed. The loser carries the box.");
  };
  return (
    <>
      <KhataCard stamp={sealed} />
      <div className="mt-2 text-sm font-medium leading-snug text-muted">How many directions do the six flats really need?</div>
      <div className="mt-1.5 grid gap-1.5">
        {BET3.map((o, i) => (
          <Choice key={o.say} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => setBet(i)}>
            <span className="flex items-center gap-2.5">
              {bet === null || bet === i ? <ClaimPic n={o.n} on={bet === i} /> : null}
              <span className="leading-tight">
                <b className="font-semibold">{o.say}</b>
                <span className="block text-xs text-muted">{o.who}</span>
              </span>
            </span>
          </Choice>
        ))}
      </div>
      {bet !== null && !sealed ? (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={seal} className={`${primaryBtn} ${FADE}`}>
            Seal the bet
          </button>
        </div>
      ) : null}
      {sealed ? <div className={`${FADE} mt-2 text-center text-[0.9rem] leading-snug text-muted`}>Sealed. The box waits at the foot of the stairs until the end.</div> : null}
      <Task done={sealed}>Pick your answer and seal it. We check it at the end.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the room built from the
//      khata. Flat 1 walks 2 along bed, 1 along bath, 3 up; then all six dots;
//      then the question, "?".

const X1_SAY = [
  "A room made from the khata: one direction for bed, one for bath, and up for total rooms.",
  "Flat 1: 2 beds, 1 bath, 3 rooms. Walk 2, then 1, then 3 up. That's its dot.",
  "Do the same for all six flats: six dots in the room.",
  "Do six dots need the whole room? That's the bet.",
];

export function SixDots() {
  const s = useScene(3, [700, 2400, 1800, 2000]);
  const k = s.k;
  const m = cam(YAW0, KBOX, KFIX);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <Room3 m={m} box={KBOX} names={KNAMES} size="max-w-[14rem]" label="a room with directions bed, bath and total; the six flats of the khata become dots">
        {k === 1 && (
          <g key="walk">
            <Draw d={seg(m, [0, 0, 0], [2, 0, 0])} strokeWidth={2.4} className="stroke-cat-blue" />
            <Draw d={seg(m, [2, 0, 0], [2, 1, 0])} delay={500} strokeWidth={2.4} className="stroke-cat-coral" />
            <Draw d={seg(m, [2, 1, 0], kd([2, 1, 3]))} delay={900} strokeWidth={2.4} className="stroke-cat-teal" />
            <Tag3 m={m} at={kd([2, 1, 3])} dx={8} dy={-4} anchor="start" size={9.5} cls="fill-[#0f1b2d] font-mono">
              (2, 1, 3)
            </Tag3>
          </g>
        )}
        {k >= 1 && <Dots3 m={m} pts={k === 1 ? [KHATA_D[0]] : KHATA} pop />}
        {k >= 3 && (
          <Tag3 m={m} at={kd([4.6, 0, 6.6])} size={22} cls={`fill-cat-coral ${POP}`}>
            ?
          </Tag3>
        )}
      </Room3>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: Fahim's new room. The
//      floor, a plank leaning from the door corner, a shelf on the wall.
//      Nasib: all three are flat sheets. Samin: but are they spans?

export function ThreeBoards({}: Story) {
  const s = useScene(3, [700, 1600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Fahim's room: the floor, a plank leaning up from the door corner, and a shelf on the wall; Nasib calls them all flat sheets, Samin asks if they are spans">
        <rect x={8} y={86} width={26} height={64} fill="#b98a5a" stroke="#8a5a2b" />
        <circle cx={29} cy={120} r={1.6} fill="#fde68a" />
        <path d="M36 150L78 96" stroke="#b07a45" strokeWidth={6} strokeLinecap="round" />
        <rect x={100} y={60} width={52} height={5} fill="#8a6a48" />
        <path d="M106 65l6 8M146 65l-6 8" stroke="#8a6a48" strokeWidth={2} />
        <circle cx={36} cy={150} r={2.6} fill="#0f1b2d" />
        <text x={40} y={165} fontSize={7} fontWeight={700} fill="#5a6b7d">
          door corner
        </text>
        {k >= 1 && <CastCard x={150} y={164} text="floor" tone="teal" />}
        {k >= 1 && <CastCard x={88} y={86} text="plank" tone="teal" />}
        {k >= 1 && <CastCard x={126} y={46} text="shelf" tone="teal" />}
        <CastPerson who="nasib" x={214} y={GR} facing={-1} arm={k === 2 ? "point" : "down"} mood={k === 2 ? "smug" : k === 3 ? "puzzled" : "plain"} />
        <NameTag x={214} y={GR + 13} name="Nasib" />
        {k === 2 && <Bubble x={214} y={GR - 66} lines={["Floor, plank, shelf:", "all flat sheets!"]} />}
        <CastPerson who="samin" x={276} y={GR} facing={-1} arm={k === 3 ? "wave" : "down"} />
        <NameTag x={276} y={GR + 13} name="Samin" />
        {k === 3 && <Bubble x={276} y={GR - 66} side="left" lines={["Flat, yes.", "But are they spans?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · FloorInRoom. Three boards in Fahim's room, each with an arrow from the
//     door corner whose tip lies on it. The reader stretches each arrow; the
//     floor and the plank keep the tip at every stretch, the shelf loses it
//     at once — and × 0 brings every arrow home to the corner.

const RBOX: V3 = [4.4, 4.4, 3.4];
const RNAMES: [string, string, string] = ["east", "north", "up"];
const RFIX = fit(RBOX, [40]);
const BOARDS: { name: string; v: V3; face: V3[]; n: V3; h: number }[] = [
  { name: "floor", v: [2, 2, 0], face: [[0, 0, 0], [4.2, 0, 0], [4.2, 4.2, 0], [0, 4.2, 0]], n: [0, 0, 1], h: 0 },
  { name: "plank", v: [2, 1.5, 1.5], face: [[0, 0, 0], [4.2, 0, 0], [4.2, 3.2, 3.2], [0, 3.2, 3.2]], n: [0, 1, -1], h: 0 },
  { name: "shelf", v: [2, 0.8, 1.5], face: [[0, 0, 1.5], [4.2, 0, 1.5], [4.2, 1.3, 1.5], [0, 1.3, 1.5]], n: [0, 0, 1], h: 1.5 },
];
const STRETCH = [0, 0.5, 1, 1.5, 2];
const onBoard = (b: number, p: V3) => Math.abs(dot3(BOARDS[b].n, p) - BOARDS[b].h) < 1e-6;

export function FloorInRoom() {
  const pass = useGate();
  const [board, setBoard] = useSeed("board", 0);
  const [lam, setLam] = useSeed("lam", 1);
  const [zero, setZero] = useSeed<boolean[]>("zero", [false, false, false]);
  const m = cam(40, RBOX, RFIX);
  const tipNow = times3(lam, BOARDS[board].v);
  const [tx, ty, tz] = useTween(tipNow, 600);
  const tip: V3 = [tx, ty, tz];
  const on = onBoard(board, tipNow);
  const done = zero.every(Boolean);

  const stretch = (l: number) => {
    setLam(l);
    if (l !== 0 || zero[board]) return;
    const z = zero.map((v, i) => v || i === board);
    setZero(z);
    if (z.every(Boolean)) pass("Every span touches the door corner.");
  };
  const say = on
    ? `× ${lam}: the tip is at ${tup(tipNow.map(r2))}, still on the ${BOARDS[board].name}.`
    : lam === 0
      ? "× 0: the tip is at the door corner, down on the floor. The shelf is 1.5 up. It fell off!"
      : `× ${lam}: the tip is ${r2(tipNow[2])} up, but the shelf is at 1.5. It fell off!`;

  return (
    <>
      <Room3 m={m} box={RBOX} names={RNAMES} walls size="max-w-[17rem]" label={`Fahim's room with the ${BOARDS[board].name} picked; its arrow stretched by ${lam}`}>
        {BOARDS.map((b, i) => (
          <polygon
            key={b.name}
            points={poly(m, b.face)}
            strokeWidth={i === board ? 1.4 : 0.8}
            className={`transition-colors duration-300 motion-reduce:transition-none ${
              i === board ? "fill-cat-teal/30 stroke-cat-teal" : "fill-[#0f1b2d]/[0.06] stroke-[#0f1b2d]/25"
            }`}
          />
        ))}
        <Arrow3 m={m} to={BOARDS[board].v} tone="ink" w={1.2} />
        <Arrow3 m={m} to={tip} tone={on ? "blue" : "danger"} w={2.6} />
        <circle cx={P(pr(m, tip)[0])} cy={P(pr(m, tip)[1])} r={4.6} strokeWidth={1.4} className={`stroke-white ${on ? "fill-accent" : "fill-danger"}`} />
        <Tag3 m={m} at={BOARDS[board].face[2]} dx={-4} dy={-4} anchor="end" size={9.5} cls="fill-cat-teal">
          {BOARDS[board].name}
        </Tag3>
      </Room3>
      <div className="mt-2 flex justify-center gap-1.5">
        {BOARDS.map((b, i) => (
          <button key={b.name} type="button" onClick={() => (setBoard(i), setLam(1))} className={`${pill(board === i)} font-sans`}>
            {b.name}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-center gap-1">
        {STRETCH.map((l) => (
          <button key={l} type="button" onClick={() => stretch(l)} className={`${pill(lam === l)} px-2.5!`}>
            × {l}
          </button>
        ))}
      </div>
      <div key={`${board} ${lam}`} className={`${FADE} mx-auto mt-1.5 min-h-10 max-w-sm text-center text-[0.9rem] leading-snug ${on ? "text-muted" : "text-danger"}`}>
        {say}
      </div>
      <Ticks items={BOARDS.map((b, i): [string, boolean] => [`${b.name} × 0`, zero[i]])} />
      <Task done={done}>Pick each board and stretch its arrow, × 0 too. Does the tip stay on the board?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the four kinds of
//      subspace in a room, one after another, all through the door corner.

const X2_SAY = [
  "Inside a room, a subspace can only be one of four kinds. All four hold the door corner.",
  "The door corner alone: what the zero button reaches.",
  "A line through the corner: what one button reaches.",
  "A sheet through the corner: what two buttons reach.",
  "The whole room: three buttons that point three different ways.",
];

export function FourKinds() {
  const s = useScene(4, [700, 1600, 1600, 1600, 1800]);
  const k = s.k;
  const m = cam(40, RBOX, RFIX);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X2_SAY[k]}</span>}>
      <Room3 m={m} box={RBOX} names={RNAMES} walls size="max-w-[14rem]" label="the four kinds of subspace in a room: the corner, a line, a sheet, the whole room">
        {k >= 4 && <RoomFill m={m} box={[4.4, 4.4, 3.4]} />}
        {k >= 3 && <polygon points={poly(m, BOARDS[1].face)} strokeWidth={1.2} className={`${FADE} ${k === 3 ? "fill-cat-teal/30" : "fill-cat-teal/15"} stroke-cat-teal`} />}
        {k >= 2 && <Draw d={seg(m, [0, 0, 0], [4, 3.4, 2.9])} strokeWidth={k === 2 ? 3 : 2} className="stroke-cat-coral" />}
        {k >= 1 && <circle cx={P(pr(m, [0, 0, 0])[0])} cy={P(pr(m, [0, 0, 0])[1])} r={k === 1 ? 7 : 5} className={`${POP} fill-cat-amber`} />}
      </Room3>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · CantFallOut. Four clubs of arrows chalked on the floor, each with two
//     members a and b. Three moves: a + b, −1 × a, 0 × a. The reader tries to
//     fall out of each club; only the whole floor can't be left.

const CF = makeFrame(-2.6, 2.6, -2.6, 2.6, 30, 10);
const CLUBS: { name: string; tick: string; a: XY; b: XY; inside: (p: XY) => boolean; why: string }[] = [
  { name: "the whole floor", tick: "whole floor", a: [1, 1], b: [1, -2], inside: () => true, why: "" },
  { name: "the floor, but not the door corner", tick: "no door", a: [1, 1], b: [-1, -1], inside: (p) => p[0] !== 0 || p[1] !== 0, why: "That's the door corner, and this club has a hole there." },
  { name: "the ring of 1-long arrows, from 3.6", tick: "ring", a: [1, 0], b: [0, 1], inside: (p) => Math.abs(Math.hypot(p[0], p[1]) - 1) < 1e-9, why: "" },
  { name: "no minus numbers, like word counts", tick: "no minus", a: [1, 1], b: [1, 0], inside: (p) => p[0] >= 0 && p[1] >= 0, why: "It has a minus number." },
];
const MOVES: { say: string; go: (a: XY, b: XY) => XY }[] = [
  { say: "a + b", go: (a, b) => plus(a, b) },
  { say: "−1 × a", go: (a) => [-a[0], -a[1]] },
  { say: "0 × a", go: () => [0, 0] },
];
const clubDone = (c: number, tried: number[]) =>
  c === 0 ? tried.length === MOVES.length : tried.some((mv) => !CLUBS[c].inside(MOVES[mv].go(CLUBS[c].a, CLUBS[c].b)));

/** a club's shape on the floor */
function ClubShape({ c }: { c: number }) {
  const [x0, y0] = [CF.sx(-2.6), CF.sy(2.6)];
  const full = <rect x={x0} y={y0} width={5.2 * CF.u} height={5.2 * CF.u} className="fill-cat-teal/15" />;
  if (c === 0) return full;
  if (c === 1)
    return (
      <>
        {full}
        <circle cx={CF.sx(0)} cy={CF.sy(0)} r={6} strokeWidth={1.2} strokeDasharray="2 2" className="fill-white stroke-danger" />
      </>
    );
  if (c === 2) return <circle cx={CF.sx(0)} cy={CF.sy(0)} r={CF.u} strokeWidth={6} className="fill-none stroke-cat-teal/35" />;
  return <rect x={CF.sx(0)} y={y0} width={2.6 * CF.u} height={2.6 * CF.u} className="fill-cat-teal/15" />;
}

export function CantFallOut() {
  const pass = useGate();
  const [club, setClub] = useSeed("club", 0);
  const [move, setMove] = useSeed<number | null>("move", null);
  const [tried, setTried] = useSeed<number[][]>("tried", [[], [], [], []]);
  const C = CLUBS[club];
  const res = move === null ? null : MOVES[move].go(C.a, C.b);
  const inside = res === null ? true : C.inside(res);
  const all = CLUBS.every((_, i) => clubDone(i, tried[i]));

  const doMove = (mv: number) => {
    setMove(mv);
    if (tried[club].includes(mv)) return;
    const t = tried.map((l, i) => (i === club ? [...l, mv] : l));
    setTried(t);
    if (CLUBS.every((_, i) => clubDone(i, t[i]))) pass("Can't fall out: that's a vector space.");
  };
  const why = (r: XY) => (club === 2 ? `That's ${r2(Math.hypot(r[0], r[1]))} long, not 1.` : C.why);

  return (
    <>
      <div className="mb-1.5 grid grid-cols-4 gap-1">
        {CLUBS.map((c, i) => (
          <button
            key={c.tick}
            type="button"
            onClick={() => (setClub(i), setMove(null))}
            className={`${pill(club === i)} px-1! py-1! font-sans text-xs! leading-tight ${club !== i && clubDone(i, tried[i]) ? "border-accent! text-accent-text" : ""}`}
          >
            {clubDone(i, tried[i]) ? "✓ " : ""}
            {c.tick}
          </button>
        ))}
      </div>
      <div className="text-center text-sm leading-snug">
        <b className="font-semibold">Club {club + 1}:</b> {C.name}
        <div className="font-mono text-[0.8rem] text-muted">
          <span className="text-cat-blue">a = {tup(C.a)}</span>, <span className="text-cat-coral">b = {tup(C.b)}</span>
        </div>
      </div>
      <div className="mx-auto w-[11.5rem]">
        <Plane f={CF} grid={1} label={`club ${club + 1}, ${C.name}; a = ${tup(C.a)}, b = ${tup(C.b)}`} className="my-1! max-w-none">
          <ClubShape c={club} />
          <Arrow f={CF} from={[0, 0]} to={C.a} tone="blue" w={2.2} />
          <Arrow f={CF} from={[0, 0]} to={C.b} tone="coral" w={2.2} />
          <Label f={CF} at={C.a} dx={6} dy={-3} size={10} className="fill-cat-blue font-mono">
            a
          </Label>
          <Label f={CF} at={C.b} dx={7} dy={9} size={10} className="fill-cat-coral font-mono">
            b
          </Label>
          {res && <Arrow key={`${club} ${move}`} f={CF} from={[0, 0]} to={res} tone={inside ? "teal" : "danger"} w={2.8} draw />}
          {res && res[0] === 0 && res[1] === 0 && <Dot key={`d${club} ${move}`} f={CF} at={res} r={5} pop className={inside ? "fill-cat-teal" : "fill-danger"} />}
        </Plane>
      </div>
      <div className="flex justify-center gap-1.5">
        {MOVES.map((mv, i) => (
          <button key={mv.say} type="button" onClick={() => doMove(i)} className={pill(move === i)}>
            {mv.say}
          </button>
        ))}
      </div>
      <div key={`${club} ${move}`} className={`${FADE} mx-auto mt-1.5 min-h-10 max-w-sm text-center text-[0.9rem] leading-snug ${inside ? "text-muted" : "text-danger"}`}>
        {res === null ? "Pick a move and watch where it lands." : inside ? `${MOVES[move!].say} = ${tup(res)}. Still in the club.` : `${MOVES[move!].say} = ${tup(res)}. ${why(res)} Fell out!`}
      </div>
      <Task done={all}>Try to fall out of each club. For the one you can’t leave, try all three moves.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the floor club. Two
//      members, their sum, a stretch by −1.5: every result still on the floor.

const FC = makeFrame(-3.2, 3.2, -3.2, 3.2, 20, 8);
const X3_SAY = [
  "The whole floor: every arrow on it is a member.",
  "Take any two members, a and b.",
  "Add them: (2, −1). Still on the floor.",
  "Stretch that by −1.5, a minus number too: (−3, 1.5). Still on the floor.",
  "No way out. A set like this is called a vector space.",
];

export function FloorClub() {
  const s = useScene(4, [700, 1400, 1600, 2200, 2200]);
  const k = s.k;
  const a: XY = [1, 1];
  const b: XY = [1, -2];
  const sum: XY = [2, -1];
  const far: XY = [-3, 1.5];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <div className="mx-auto w-[10rem]">
        <Plane f={FC} grid={1} label="the whole floor as a club: a, b, their sum, and a stretch of the sum, all on the floor" className="my-0! max-w-none">
          <rect x={FC.sx(-3.2)} y={FC.sy(3.2)} width={6.4 * FC.u} height={6.4 * FC.u} className={`fill-cat-teal/15 ${k >= 4 ? "" : ""}`} />
          {k >= 1 && <Arrow f={FC} from={[0, 0]} to={a} tone="blue" w={2.2} draw />}
          {k >= 1 && <Arrow f={FC} from={[0, 0]} to={b} tone="coral" w={2.2} draw />}
          {k >= 2 && <Arrow f={FC} from={[0, 0]} to={sum} tone="teal" w={2.6} draw />}
          {k >= 3 && <Arrow f={FC} from={[0, 0]} to={far} tone="violet" w={2.6} draw />}
          {k >= 4 && <rect x={FC.sx(-3.2)} y={FC.sy(3.2)} width={6.4 * FC.u} height={6.4 * FC.u} rx={3} strokeWidth={2.4} className={`${FADE} fill-none stroke-cat-teal`} />}
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · FlatSheet. The khata's six flats as dots in the room of numbers. The
//     reader turns the room (drag, slider, arrow keys) until the cloud goes
//     edge-on: six dots on one line. The view snaps there and stays.

export function FlatSheet() {
  const pass = useGate();
  const [yaw, setYaw] = useSeed("yaw", YAW0);
  const [flat, setFlat] = useSeed("flat", false);
  const [ms, setMs] = useState(80);
  const [v] = useTween([yaw], ms);
  const m = cam(v, KBOX, KALL);

  const go = (y: number) => {
    if (flat) return;
    const next = clamp(y, -180, 180);
    if (tilt(KN, next) < 0.03) {
      setMs(300);
      setYaw(edgeYaw(KN, next));
      setFlat(true);
      pass("Three columns, but one flat sheet.");
    } else {
      setMs(80);
      setYaw(next);
    }
  };

  return (
    <>
      <Room3 m={m} box={KBOX} names={KNAMES} turn={(d) => go(yaw + d)} label="the khata's six flats as dots in a room of bed, bath and total; drag to turn the room">
        {flat && <polygon points={poly(m, KSHEET)} strokeWidth={2.2} className={`${FADE} fill-cat-teal/20 stroke-cat-teal`} />}
        <Dots3 m={m} pts={KHATA_D} look={() => (flat ? "fill-accent" : "fill-cat-blue")} />
      </Room3>
      <TurnBar yaw={yaw} onYaw={go} off={flat} />
      <div key={String(flat)} className={`${FADE} mx-auto mt-1.5 min-h-10 max-w-sm text-center text-[0.9rem] leading-snug ${flat ? "text-accent-text" : "text-muted"}`}>
        {flat ? "Edge-on! All six dots stand in one line. Seen from the side, they lie on one flat sheet." : "Drag the picture, or the slider, to turn the room."}
      </div>
      <Task done={flat}>Turn the room until the six dots line up.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the sheet through the
//      dots, and why the dots can't leave it: flat 2 walks 3 and 2 on the
//      floor, and its height is forced, 3 + 2 = 5, right onto the sheet.

const X4_SAY = [
  "The six dots, seen from the front again.",
  "One flat sheet through the door corner holds all six.",
  "Flat 2: 3 beds and 2 baths. Walk 3 and 2 along the floor.",
  "Its height isn't free: total = 3 + 2 = 5. Right onto the sheet.",
  "Every flat's height is bed + bath. So no dot can leave the sheet.",
];

export function SheetThrough() {
  const s = useScene(4, [700, 1600, 1800, 2000, 2200]);
  const k = s.k;
  const m = cam(YAW0, KBOX, KFIX);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4_SAY[k]}</span>}>
      <Room3 m={m} box={KBOX} names={KNAMES} size="max-w-[14rem]" label="the flat sheet through the khata's dots; flat 2's height is 3 + 2 = 5">
        {k >= 1 && <polygon points={poly(m, KSHEET)} strokeWidth={1.2} className={`${FADE} fill-cat-teal/20 stroke-cat-teal`} />}
        {(k === 2 || k === 3) && (
          <g key="walk">
            <Draw d={seg(m, [0, 0, 0], [3, 0, 0])} strokeWidth={2.4} className="stroke-cat-blue" />
            <Draw d={seg(m, [3, 0, 0], [3, 2, 0])} delay={500} strokeWidth={2.4} className="stroke-cat-coral" />
          </g>
        )}
        {k === 3 && <Draw d={seg(m, [3, 2, 0], kd([3, 2, 5]))} strokeWidth={2.6} className="stroke-cat-violet" />}
        <Dots3 m={m} pts={KHATA_D} look={(i) => (k >= 4 || (k === 3 && i === 1) ? "fill-accent" : k === 2 && i === 1 ? "fill-cat-blue/30" : "fill-cat-blue")} />
        {k === 3 && (
          <Tag3 m={m} at={kd([3, 2, 5])} dx={8} dy={-2} anchor="start" size={9.5} cls="fill-cat-violet font-mono">
            3 + 2 = 5
          </Tag3>
        )}
      </Room3>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · SheetFromButtons. Four buttons, each one step in the room of numbers.
//     The reader picks two; the room paints everywhere they reach (a sheet
//     sweeping out from the corner). Only one bed (1, 0, 1) and one bath
//     (0, 1, 1) paint a sheet that holds all six flats.

const BTNS: { v: V3; reach: number }[] = [
  { v: [1, 0, 0], reach: 4.5 },
  { v: [0, 1, 1], reach: 2.4 },
  { v: [0, 0, 1], reach: 6.9 },
  { v: [1, 0, 1], reach: 4.5 },
];
const inSpan = (u: V3, w: V3, p: V3) => Math.abs(dot3(cross3(u, w), p)) < 1e-9;

export function SheetFromButtons() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<number[]>("picks", []);
  const [won, setWon] = useSeed("won", false);
  const [miss, setMiss] = useState(0);
  const paint = usePlay(45);
  const pair = picks.length === 2;
  const u = pair ? BTNS[picks[0]].v : null;
  const w = pair ? BTNS[picks[1]].v : null;
  const covered = u && w ? KHATA.map((p) => inSpan(u, w, p)) : KHATA.map(() => false);
  const t = paint.running ? paint.k / 12 : 1;
  const m = cam(YAW0, KBOX, KFIX);

  const tap = (i: number) => {
    if (won) return;
    const next = picks.length === 2 ? [i] : picks.includes(i) ? picks.filter((p) => p !== i) : [...picks, i];
    setPicks(next);
    if (next.length !== 2) return;
    const [a, b] = [BTNS[next[0]].v, BTNS[next[1]].v];
    const all = KHATA.every((p) => inSpan(a, b, p));
    paint.play(12, () => {
      if (all) {
        setWon(true);
        pass("Two buttons paint the whole khata.");
      } else setMiss((x) => x + 1);
    });
  };

  return (
    <>
      <Room3 m={m} box={KBOX} names={KNAMES} label="the khata's six dots; the two picked buttons paint a sheet from the door corner">
        {u && w && (
          <polygon
            points={poly(m, patch(kd(u), kd(w), BTNS[picks[0]].reach * t, BTNS[picks[1]].reach * t))}
            strokeWidth={1.2}
            className={won || (!paint.running && covered.every(Boolean)) ? "fill-cat-teal/25 stroke-cat-teal" : "fill-cat-amber/25 stroke-cat-amber"}
          />
        )}
        {picks.map((p, i) => (
          <Arrow3 key={`${p}`} m={m} to={kd(BTNS[p].v)} tone={i ? "coral" : "blue"} w={2.6} draw />
        ))}
        <Dots3 m={m} pts={KHATA_D} look={(i) => (pair && !paint.running ? (covered[i] ? "fill-accent" : "fill-[#94a3b8]") : "fill-cat-blue")} />
      </Room3>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {BTNS.map((b, i) => (
          <button key={i} type="button" onClick={() => tap(i)} disabled={won} className={`${pill(picks.includes(i))} px-1! text-[0.8rem]!`}>
            {tup(b.v)}
          </button>
        ))}
      </div>
      <div className="mt-0.5 text-center text-xs text-muted">Each button is one step: (bed, bath, total).</div>
      {pair && !paint.running && !won ? (
        <Nope key={miss}>That sheet misses all six flats. Look: every dot floats off it. Try another pair.</Nope>
      ) : (
        <div key={String(won)} className={`${FADE} mx-auto mt-1.5 min-h-10 max-w-sm text-center text-[0.9rem] leading-snug ${won ? "text-accent-text" : "text-muted"}`}>
          {won ? "One bed (1, 0, 1) and one bath (0, 1, 1): their paint covers every flat." : "Pick two buttons. The room paints everywhere they can reach."}
        </div>
      )}
      <Task done={won}>Pick two buttons whose paint covers all six flats.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the two buttons, every
//      mix of them landing on the sheet, flat 2 as 3 bed presses and 2 bath
//      presses, and all six flats among the mixes.

const X5_SAY = [
  "Two buttons: one bed, (1, 0, 1), and one bath, (0, 1, 1).",
  "Every mix of the two lands on the sheet.",
  "Flat 2 is 3 bed presses and 2 bath presses: (3, 2, 5).",
  "All six flats are mixes. Two buttons, the whole khata.",
];
const MIXES: V3[] = [0, 1, 2, 3, 4].flatMap((a) => [0, 1, 2].map((b) => kd(plus3(times3(a, BED_BTN), times3(b, BATH_BTN)))));

export function TwoButtonsPaint() {
  const s = useScene(3, [700, 1800, 2000, 2000]);
  const k = s.k;
  const m = cam(YAW0, KBOX, KFIX);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5_SAY[k]}</span>}>
      <Room3 m={m} box={KBOX} names={KNAMES} size="max-w-[14rem]" label="the bed button and the bath button; every mix of them lands on the sheet, and the six flats are among the mixes">
        {k >= 1 && <polygon points={poly(m, KSHEET)} className={`${FADE} fill-cat-teal/15`} />}
        {k >= 1 && <Dots3 m={m} pts={MIXES} r={2.2} stems={false} pop look={() => "fill-[#94a3b8]"} />}
        {k === 2 && (
          <g key="press">
            <Draw d={path3(m, ([[0, 0, 0], [1, 0, 1], [2, 0, 2], [3, 0, 3]] as V3[]).map(kd))} strokeWidth={2.4} className="stroke-cat-blue" />
            <Draw d={path3(m, ([[3, 0, 3], [3, 1, 4], [3, 2, 5]] as V3[]).map(kd))} delay={600} strokeWidth={2.4} className="stroke-cat-coral" />
          </g>
        )}
        <Arrow3 m={m} to={kd(BED_BTN)} tone="blue" w={2.8} />
        <Arrow3 m={m} to={kd(BATH_BTN)} tone="coral" w={2.8} />
        {k >= 2 && <Dots3 m={m} pts={k === 2 ? [KHATA_D[1]] : KHATA} look={() => "fill-accent"} pop />}
      </Room3>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · YourCloud. Your turn: three more pages from the dalal's bag, three
//     columns each, drawn as clouds in their own room (each column squeezed
//     to the same size). The reader turns each and picks what it uses: a
//     line, a sheet or the whole room. A wrong pick draws that shape through
//     the dots and shows the gaps in red, or turns the cloud to prove it.

type Page = { title: string; names: [string, string, string]; raw: V3[]; uses: 1 | 2 | 3; n?: V3; right: string };
const RENT = [13, 21, 16, 18, 26, 8];
const PAGES: Page[] = [
  {
    title: "bed · bath · light bulbs",
    names: ["bed", "bath", "bulbs"],
    raw: KHATA.map((f): V3 => [f[0], f[1], 2 * f[0] + f[1]]),
    uses: 2,
    n: [2, 1, -1],
    right: "A sheet. Each bedroom has 2 bulbs, each bathroom 1. So the bulbs come from beds and baths.",
  },
  {
    title: "bed · bath · which floor",
    names: ["bed", "bath", "floor"],
    raw: [
      [2, 1, 3],
      [3, 2, 1],
      [2, 2, 5],
      [3, 1, 2],
      [4, 2, 4],
      [1, 1, 6],
    ],
    uses: 3,
    right: "The whole room. The floor number has nothing to do with beds or baths.",
  },
  {
    title: "rent · advance · yearly rent",
    names: ["rent", "advance", "yearly"],
    raw: RENT.map((r): V3 => [r, 2 * r, 12 * r]),
    uses: 1,
    right: "A line. The advance is 2 months’ rent, a year is 12. One fact, said three ways.",
  },
];
const UBOX: V3 = [5.4, 5.4, 5.4];
const UALL = fit(UBOX, ALL);
/** a page's columns squeezed so the biggest number in each is 5 */
const squeeze = (pg: Page): V3 => {
  const mx = [0, 1, 2].map((c) => Math.max(...pg.raw.map((p) => p[c])));
  return [5 / mx[0], 5 / mx[1], 5 / mx[2]];
};
const shown = (pg: Page) => pg.raw.map((p) => mul3(p, squeeze(pg)));
/** the sheet's normal once the columns are squeezed */
const shownNormal = (pg: Page): V3 | null => {
  if (!pg.n) return null;
  const s = squeeze(pg);
  return [pg.n[0] / s[0], pg.n[1] / s[1], pg.n[2] / s[2]];
};
/** where a dot lands on the line through the corner and the cloud's middle */
const toLine = (pts: V3[], p: V3): V3 => {
  const c = pts.reduce((a, b) => plus3(a, b), [0, 0, 0] as V3);
  const u = times3(1 / len3(c), c);
  return times3(dot3(p, u), u);
};
/** where a dot lands on a sheet through the corner with normal n */
const toSheet = (n: V3, p: V3): V3 => {
  const u = times3(1 / len3(n), n);
  return plus3(p, times3(-dot3(p, u), u));
};
const USE_NAMES = ["a line", "a sheet", "whole room"];

/**
 * A picture answer, three to a row: a small drawing and a word, no letter
 * badge (Choice's badge crowds a third of a phone). Looks follow Choice's.
 */
function PicPick({ look, disabled = false, onClick, children }: { look: Look; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full cursor-pointer flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-1 text-center text-[0.75rem] leading-tight transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look]}`}
    >
      {children}
    </button>
  );
}

/** gaps from dots to where a shape would put them, in red */
function Gaps({ m, pts, to }: { m: Cam; pts: V3[]; to: (p: V3) => V3 }) {
  return <path d={pts.map((p) => seg(m, p, to(p))).join("")} strokeWidth={2} strokeLinecap="round" className={`${FADE} pointer-events-none stroke-danger`} />;
}

export function YourCloud() {
  const pass = useGate();
  const [page, setPage] = useSeed("page", 0);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [yaw, setYaw] = useSeed("yaw", YAW0);
  const [solved, setSolved] = useSeed<boolean[]>("solved", [false, false, false]);
  const [miss, setMiss] = useState(0);
  const [ms, setMs] = useState(80);
  const [v] = useTween([yaw], ms);
  const pg = PAGES[page];
  const pts = shown(pg);
  const nn = shownNormal(pg);
  const m = cam(v, UBOX, UALL);
  const right = pick !== null && pick + 1 === pg.uses;
  const all = solved.every(Boolean);

  const turn = (y: number) => {
    setMs(80);
    setYaw(clamp(y, -180, 180));
  };
  const choose = (i: number) => {
    if (right) return;
    setPick(i);
    if (i + 1 === pg.uses) {
      if (nn) {
        setMs(1100);
        setYaw(edgeYaw(nn, yaw));
      }
      const s = solved.map((x, j) => x || j === page);
      setSolved(s);
      if (s.every(Boolean)) pass("Count what the dots use, not the columns.");
      return;
    }
    setMiss((x) => x + 1);
    // Wrong "whole room": turn the cloud to show it never needed it.
    if (i === 2) {
      setMs(nn ? 1100 : 1400);
      setYaw(nn ? edgeYaw(nn, yaw) : wrap(yaw + 120));
    }
  };
  const next = () => {
    setPage(page + 1);
    setPick(null);
    setMs(500);
    setYaw(YAW0);
  };

  // what a pick draws in the room
  const lineEnd = times3(1.35, pts.reduce((a, b) => (len3(b) > len3(a) ? b : a), [0, 0, 0] as V3));
  const sheetN = nn ?? cross3(pts[0], pts[1]);
  const nope =
    pick === null || right
      ? null
      : pick === 0
        ? "No line through the corner holds them all. See the red gaps?"
        : pick === 1 && pg.uses === 1
          ? "They do sit on a sheet, but on one line inside it. The smallest shape wins."
          : pick === 1
            ? "Any sheet you try leaves dots off it: see the red gaps? Turn it, it never goes flat."
            : pg.uses === 2
              ? "Turned edge-on, they line up. They sit on one sheet; they don't need the whole room."
              : "Turn it any way you like: the dots never leave one line.";

  return (
    <>
      <div className="text-center text-sm leading-snug">
        <b className="font-semibold">Page {page + 1} of 3:</b> {pg.title}
      </div>
      <div className="mt-1">
        <Room3 m={m} box={UBOX} names={pg.names} size="max-w-[16rem]" turn={(d) => turn(yaw + d)} label={`page ${page + 1}: ${pg.title}, as dots; drag to turn`}>
          {pick === 0 && <path d={seg(m, [0, 0, 0], lineEnd)} strokeWidth={1.6} strokeDasharray="4 3" className={`${FADE} stroke-cat-teal`} />}
          {pick === 0 && !right && <Gaps m={m} pts={pts} to={(p) => toLine(pts, p)} />}
          {pick === 1 && pg.uses === 1 && <path d={seg(m, [0, 0, 0], lineEnd)} strokeWidth={1.6} strokeDasharray="4 3" className={`${FADE} stroke-cat-teal`} />}
          {pick === 1 && pg.uses !== 1 && (
            <polygon
              points={poly(m, nn ? sheetPatch(nn, 5.2) : patch(pts[0], pts[1], 1.3, 1.3))}
              strokeWidth={1.2}
              className={`${FADE} fill-cat-teal/20 stroke-cat-teal`}
            />
          )}
          {pick === 1 && pg.uses === 3 && <Gaps m={m} pts={pts} to={(p) => toSheet(sheetN, p)} />}
          {right && pg.uses === 3 && <RoomFill m={m} box={UBOX} />}
          <Dots3 m={m} pts={pts} look={() => (right ? "fill-accent" : "fill-cat-blue")} />
        </Room3>
      </div>
      <TurnBar yaw={yaw} onYaw={turn} />
      {right && page < 2 ? (
        <div className="mt-1.5 flex flex-col items-center gap-1.5">
          <div className={`${FADE} max-w-sm text-center text-[0.9rem] leading-snug text-accent-text`}>{pg.right}</div>
          <button type="button" onClick={next} className={`${primaryBtn} h-9!`}>
            Next page →
          </button>
        </div>
      ) : (
        <>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {USE_NAMES.map((u, i) => (
              <PicPick key={u} look={pick === i ? (right ? "right" : "wrong") : "idle"} disabled={right} onClick={() => choose(i)}>
                <ClaimPic n={i + 1} />
                {u}
              </PicPick>
            ))}
          </div>
          {nope ? <Nope key={miss}>{nope}</Nope> : right ? <div className={`${FADE} mt-1.5 text-center text-[0.9rem] leading-snug text-accent-text`}>{pg.right}</div> : null}
        </>
      )}
      <Task done={all}>For each page, turn the cloud and pick what it uses: a line, a sheet or the whole room.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the three pages again,
//      one per beat, each with the shape it uses drawn in.

const X6_SAY = [
  "Three pages, three columns each.",
  "Rent, advance, yearly rent: one line. One fact, said three ways.",
  "Bed, bath, bulbs: one sheet, like the khata.",
  "Bed, bath, floor: the whole room. Three facts that don't depend on each other.",
];

export function ThreePages() {
  const s = useScene(3, [700, 2000, 2000, 2200]);
  const k = s.k;
  const pg = k === 1 ? PAGES[2] : k === 2 ? PAGES[0] : PAGES[1];
  const pts = shown(pg);
  const nn = shownNormal(pg);
  const m = cam(YAW0, UBOX, UALL);
  const lineEnd = times3(1.3, pts.reduce((a, b) => (len3(b) > len3(a) ? b : a), [0, 0, 0] as V3));
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6_SAY[k]}</span>}>
      {k === 0 ? (
        <div className="mx-auto grid max-w-[16rem] gap-1.5">
          {[PAGES[2], PAGES[0], PAGES[1]].map((p, i) => (
            <div key={p.title} className={`${POP} rounded-lg border border-[#c9b98f] bg-[#fbf6e9] px-2 py-1 text-center font-mono text-[0.75rem] text-[#3f3422]`} style={{ transitionDelay: `${i * 120}ms` }}>
              {p.names.join(" · ")}
            </div>
          ))}
        </div>
      ) : (
        <Room3 key={k} m={m} box={UBOX} names={pg.names} size="max-w-[14rem]" label={`the page ${pg.names.join(", ")} and the shape its dots use`}>
          {k === 1 && <Draw d={seg(m, [0, 0, 0], lineEnd)} strokeWidth={2} className="stroke-cat-teal" />}
          {k === 2 && nn && <polygon points={poly(m, sheetPatch(nn, 5.2))} strokeWidth={1.2} className={`${FADE} fill-cat-teal/20 stroke-cat-teal`} />}
          {k === 3 && <RoomFill m={m} box={UBOX} />}
          <Dots3 m={m} pts={pts} pop />
        </Room3>
      )}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it: another dalal's khata, eight flats as (bed, bath, area in sq
//     ft). Area is about 300 per bedroom and 150 per bathroom, give or take
//     up to 210. Three pictures: on a sheet, near a sheet, fills the room.
//     Every pick turns the cloud edge-on; a wrong one also shows why.

const NEAR_RAW: V3[] = [
  [2, 1, 930],
  [3, 2, 1065],
  [2, 2, 990],
  [3, 1, 840],
  [4, 2, 1635],
  [1, 1, 360],
  [2, 1, 570],
  [3, 3, 1560],
];
const NEAR_S: V3 = [5 / 4, 5 / 3, 5 / 1635];
const NEAR_PTS = NEAR_RAW.map((p) => mul3(p, NEAR_S));
/** the sheet area = 300·bed + 150·bath, with the columns squeezed */
const NEAR_N: V3 = [300 / NEAR_S[0], 150 / NEAR_S[1], -1 / NEAR_S[2]];
const NEAR_EDGE = edgeYaw(NEAR_N, YAW0);
/** one step along bed, and along bath, staying on that sheet */
const NEAR_U: V3 = [1, 0, -NEAR_N[0] / NEAR_N[2]];
const NEAR_W: V3 = [0, 1, -NEAR_N[1] / NEAR_N[2]];
const NEAR_SHEET = patch(NEAR_U, NEAR_W, 5.2, 5.2);
const X7_PICS = ["on a sheet", "near a sheet", "fills the room"];
const X7_RIGHT = 1;

/** the three answers as pictures */
function NearPic({ i }: { i: number }) {
  const dots: XY[] =
    i === 0
      ? [[16, 28], [24, 22], [32, 26], [28, 16], [40, 20], [36, 12]]
      : i === 1
        ? [[16, 24], [24, 26], [32, 22], [28, 19], [40, 22], [36, 9]]
        : [[14, 30], [24, 14], [34, 26], [40, 12], [20, 22], [44, 30]];
  return (
    <svg viewBox="0 0 56 40" className="h-9 w-auto" aria-hidden="true">
      {i < 2 && <path d="M6 34L20 8h34L40 34Z" strokeWidth={1} className="fill-cat-teal/15 stroke-cat-teal" />}
      {i === 2 && <path d="M8 16h30v20H8zM8 16l10-10h30L38 16M48 6v20L38 36" fill="none" strokeWidth={1} className="stroke-[#5a6b7d]" />}
      {i === 1 && dots.map(([x, y], j) => <path key={`g${j}`} d={`M${x} ${y}v${j % 2 ? 3 : -3}`} strokeWidth={0.8} className="stroke-[#5a6b7d]" />)}
      {dots.map(([x, y], j) => (
        <circle key={j} cx={x} cy={y} r={2.4} className="fill-cat-blue" />
      ))}
    </svg>
  );
}

export function TryNearlyFlat() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [yaw, setYaw] = useSeed("yaw", YAW0);
  const [miss, setMiss] = useState(0);
  const [ms, setMs] = useState(80);
  const [v] = useTween([yaw], ms);
  const m = cam(v, UBOX, UALL);
  const right = pick === X7_RIGHT;

  const turn = (y: number) => {
    setMs(80);
    setYaw(clamp(y, -180, 180));
  };
  const choose = (i: number) => {
    if (right) return;
    setPick(i);
    setMs(1100);
    setYaw(NEAR_EDGE);
    if (i === X7_RIGHT) pass("Real data sits near a sheet.");
    else setMiss((x) => x + 1);
  };

  return (
    <>
      <div className="text-center text-sm leading-snug">
        <b className="font-semibold">8 flats:</b> bed, bath, and area in square feet
      </div>
      <div className="mt-1">
        <Room3 m={m} box={UBOX} names={["bed", "bath", "area"]} size="max-w-[16rem]" turn={(d) => turn(yaw + d)} label="eight flats as dots: bed, bath and area; drag to turn">
          {pick !== null && pick !== 2 && <polygon points={poly(m, NEAR_SHEET)} strokeWidth={1.2} className={`${FADE} fill-cat-teal/20 stroke-cat-teal`} />}
          {pick === 0 && <Gaps m={m} pts={NEAR_PTS} to={(p) => toSheet(NEAR_N, p)} />}
          <Dots3 m={m} pts={NEAR_PTS} r={3.4} look={() => (right ? "fill-accent" : "fill-cat-blue")} />
        </Room3>
      </div>
      <TurnBar yaw={yaw} onYaw={turn} />
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        {X7_PICS.map((p, i) => (
          <PicPick key={p} look={pick === i ? (right ? "right" : "wrong") : "idle"} disabled={right} onClick={() => choose(i)}>
            <NearPic i={i} />
            {p}
          </PicPick>
        ))}
      </div>
      {pick !== null && !right ? (
        <Nope key={miss}>
          {pick === 0
            ? "Edge-on, they make a thin band, not one line. Each dot is a little off the sheet: see the red gaps."
            : "Edge-on, it's a thin band. That's nowhere near filling the room."}
        </Nope>
      ) : right ? (
        <div className={`${FADE} mt-1.5 text-center text-[0.9rem] leading-snug text-accent-text`}>
          Near a sheet. Area is about 300 per bedroom and 150 per bathroom, give or take a kitchen.
        </div>
      ) : null}
      <Task done={right}>Turn the cloud, then pick the honest picture.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for the exercise's explanation, no task: a big khata of forty
//      flats near a sheet. From the front, a cloud; turned edge-on, a thin
//      pancake.

/** seeded wobble, so the pancake looks the same every time */
const wob = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const PAN_NU = times3(1 / len3(NEAR_N), NEAR_N);
const PANCAKE: V3[] = Array.from({ length: 40 }, (_, i) =>
  plus3(plus3(times3(0.8 + 4.2 * wob(i), NEAR_U), times3(0.8 + 4.2 * wob(i + 100), NEAR_W)), times3((wob(i + 200) - 0.5) * 0.5, PAN_NU)),
);
const X7F_SAY = [
  "A bigger khata: forty flats, three columns.",
  "From the front, the dots look like a cloud.",
  "Turn it edge-on: a thin pancake.",
  "Three columns, but about two real directions. Real data is often like this.",
];

export function Pancake() {
  const s = useScene(3, [700, 1600, 2000, 2200]);
  const k = s.k;
  const [v] = useTween([k >= 2 ? NEAR_EDGE : YAW0], 1400);
  const m = cam(v, UBOX, UALL);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X7F_SAY[k]}</span>}>
      <Room3 m={m} box={UBOX} names={["bed", "bath", "area"]} size="max-w-[14rem]" label="forty flats near one sheet: a cloud from the front, a thin pancake edge-on">
        {k >= 3 && <polygon points={poly(m, NEAR_SHEET)} strokeWidth={1.2} className={`${FADE} fill-cat-teal/15 stroke-cat-teal`} />}
        {k >= 1 && <Dots3 m={m} pts={PANCAKE} r={2.6} stems={false} pop />}
      </Room3>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for the last step's setup, no task: Samin says two
//      directions, the box is Nasib's. Nasib owns up, lifts the box, climbs.

/** the top of step i of the stairs at x = 236 */
const stepAt = (i: number): XY => [236 + 20 * i + 10, GR - 14 * (i + 1)];

export function LastBox({}: Story) {
  const s = useScene(3, [700, 2200, 2400, 1800]);
  const k = s.k;
  const up = k >= 3;
  const [nx, ny] = up ? stepAt(1) : [150, GR];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Samin says two directions; Nasib owns up, picks up the last box and carries it up the stairs">
        <Stairs x={236} n={4} />
        {!up && <MoveBox x={196} y={GR} />}
        <CastPerson who="samin" x={64} y={GR} arm="hold" mood={k >= 1 ? "happy" : "plain"} />
        <CastCard x={82} y={GR - 44} text="khata" tone="amber" />
        <NameTag x={64} y={GR + 13} name="Samin" />
        {k === 1 && <Bubble x={64} y={GR - 66} lines={["Two directions.", "The box is yours."]} />}
        <CastPerson who="nasib" x={nx} y={ny} facing={up ? 1 : -1} walking={up} arm={up ? "hold" : "down"} mood={k >= 2 ? "sad" : "plain"} ms={1600} />
        {up && <MoveBox x={nx + 16} y={ny - 22} />}
        {!up && <NameTag x={150} y={GR + 13} name="Nasib" />}
        {k === 2 && <Bubble x={150} y={GR - 66} lines={["Three columns,", "but two directions."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · BetSettled. The three claims, opened one by one on the khata's cloud:
//     3 turns the cloud edge-on (the third direction is never used), 2
//     paints the sheet from the two buttons, 1 draws a line and the gaps.

const VERDICT = [
  "Turned edge-on, the six dots line up. The third direction is never used.",
  "Two buttons, (1, 0, 1) and (0, 1, 1), paint a sheet that holds all six.",
  "No single line through the corner holds them. See the red gaps?",
];

export function BetSettled() {
  const pass = useGate();
  const [opened, setOpened] = useSeed<number[]>("opened", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const [v] = useTween([cur === 0 ? edgeYaw(KN, YAW0) : YAW0], 1200);
  const paint = usePlay(45);
  const t = paint.running ? paint.k / 12 : 1;
  const m = cam(v, KBOX, KALL);
  const done = opened.length === 3;

  const open = (i: number) => {
    setCur(i);
    if (i === 1) paint.play(12);
    if (opened.includes(i)) return;
    const o = [...opened, i];
    setOpened(o);
    if (o.length === 3) pass("Two directions. Nasib carries the box.");
  };

  return (
    <>
      <Room3 m={m} box={KBOX} names={KNAMES} label="the khata's six dots; each claim is tested on them">
        {cur === 0 && <polygon points={poly(m, KSHEET)} strokeWidth={2} className={`${FADE} fill-cat-teal/15 stroke-cat-teal`} />}
        {cur === 1 && <polygon points={poly(m, patch(kd(BED_BTN), kd(BATH_BTN), 4.5 * t, 2.4 * t))} strokeWidth={1.2} className="fill-cat-teal/25 stroke-cat-teal" />}
        {cur === 1 && <Arrow3 m={m} to={kd(BED_BTN)} tone="blue" w={2.6} />}
        {cur === 1 && <Arrow3 m={m} to={kd(BATH_BTN)} tone="coral" w={2.6} />}
        {cur === 2 && <path d={seg(m, [0, 0, 0], times3(1.35, KHATA_D[4]))} strokeWidth={1.6} strokeDasharray="4 3" className={`${FADE} stroke-cat-teal`} />}
        {cur === 2 && <Gaps m={m} pts={KHATA_D} to={(p) => toLine(KHATA_D, p)} />}
        <Dots3 m={m} pts={KHATA_D} look={() => (cur === 1 && !paint.running ? "fill-accent" : "fill-cat-blue")} />
      </Room3>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {BET3.map((o, i) => (
          <PicPick key={o.say} look={opened.includes(i) ? (i === 1 ? "right" : "wrong") : "idle"} onClick={() => open(i)}>
            <ClaimPic n={o.n} />
            <b className="font-semibold">{o.say}</b>
          </PicPick>
        ))}
      </div>
      <div key={String(cur)} className={`${FADE} mx-auto mt-1.5 min-h-10 max-w-sm text-center text-[0.9rem] leading-snug ${cur === 1 ? "text-accent-text" : cur === null ? "text-muted" : "text-danger"}`}>
        {cur === null ? "Tap a claim to test it on the six dots." : VERDICT[cur]}
      </div>
      <Task done={done}>Open all three claims, then check them against your bet.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for the last step's explanation, no task: three columns, one
//      of them only bed + bath, so two directions.

const X8_SAY = [
  "The khata has three columns.",
  "But total is only bed + bath.",
  "So the flats use two directions: bed and bath.",
  "Count the directions the data uses, not the columns it has.",
];

export function ColumnsNotDirections() {
  const s = useScene(3, [700, 1800, 1800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X8_SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[16rem] items-center justify-center gap-2">
        {["bed", "bath"].map((c) => (
          <span key={c} className="rounded-lg border border-[#c9b98f] bg-[#fbf6e9] px-2.5 py-1 font-mono text-sm font-semibold text-[#3f3422]">
            {c}
          </span>
        ))}
        <span
          className={`rounded-lg border px-2 py-1 font-mono text-[0.8rem] font-semibold whitespace-nowrap transition-opacity duration-500 motion-reduce:transition-none ${
            k >= 1 ? "border-dashed border-muted/60 text-muted" : "border-[#c9b98f] bg-[#fbf6e9] text-[#3f3422]"
          } ${k >= 2 ? "opacity-40" : ""}`}
        >
          {k >= 1 ? "total = bed + bath" : "total"}
        </span>
      </div>
      <svg viewBox="0 0 160 70" className="mx-auto mt-2 block h-auto w-full max-w-[10rem]" aria-hidden="true">
        <circle cx={40} cy={58} r={2.6} className="fill-[#0f1b2d]" />
        {k >= 2 && (
          <g key="arrows">
            <Draw d="M40 58L112 58" strokeWidth={3} className="stroke-cat-blue" />
            <Draw d="M40 58L78 18" delay={300} strokeWidth={3} className="stroke-cat-coral" />
            <text x={118} y={62} fontSize={11} fontWeight={700} className={`${POP} fill-cat-blue`}>
              bed
            </text>
            <text x={82} y={16} fontSize={11} fontWeight={700} className={`${POP} fill-cat-coral`}>
              bath
            </text>
          </g>
        )}
        {k >= 3 && (
          <text x={80} y={40} textAnchor="middle" fontSize={20} fontWeight={800} className={`${POP} fill-accent-text`}>
            2
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  StairsBet: { start: { k: 0 }, nasib: { k: 1 }, samin: { k: 2 }, end: {} },
  SheetBet: { start: {}, picked: { bet: 1 }, sealed: { bet: 1, sealed: true } },
  SixDots: { start: { k: 0 }, walk: { k: 1 }, six: { k: 2 }, end: {} },
  ThreeBoards: { start: { k: 0 }, nasib: { k: 2 }, end: {} },
  FloorInRoom: {
    start: {},
    plank: { board: 1, lam: 2, zero: [true, false, false] },
    shelfOff: { board: 2, lam: 0, zero: [true, true, true] },
    shelfHigh: { board: 2, lam: 2, zero: [true, true, false] },
  },
  FourKinds: { corner: { k: 1 }, line: { k: 2 }, sheet: { k: 3 }, end: {} },
  CantFallOut: {
    start: {},
    floor: { club: 0, move: 0, tried: [[0], [], [], []] },
    hole: { club: 1, move: 0, tried: [[0, 1, 2], [0], [], []] },
    ring: { club: 2, move: 0, tried: [[0, 1, 2], [0], [0], []] },
    minus: { club: 3, move: 1, tried: [[0, 1, 2], [0], [0], [1]] },
  },
  FloorClub: { start: { k: 0 }, sum: { k: 2 }, end: {} },
  FlatSheet: { start: {}, mid: { yaw: 0 }, flat: { yaw: edgeYaw(KN, 0), flat: true } },
  SheetThrough: { sheet: { k: 1 }, walk: { k: 2 }, rise: { k: 3 }, end: {} },
  SheetFromButtons: { start: {}, one: { picks: [1] }, wrong: { picks: [0, 2] }, right: { picks: [1, 3], won: true } },
  TwoButtonsPaint: { start: { k: 0 }, mixes: { k: 1 }, flat2: { k: 2 }, end: {} },
  YourCloud: {
    start: {},
    wrongLine: { page: 0, pick: 0 },
    rightSheet: { page: 0, pick: 1, yaw: edgeYaw(shownNormal(PAGES[0])!, YAW0), solved: [true, false, false] },
    wrongSheet: { page: 1, pick: 1, solved: [true, false, false] },
    lineRoom: { page: 2, pick: 2, yaw: 170, solved: [true, true, false] },
    done: { page: 2, pick: 0, solved: [true, true, true] },
  },
  ThreePages: { start: { k: 0 }, line: { k: 1 }, sheet: { k: 2 }, end: {} },
  TryNearlyFlat: { start: {}, onSheet: { pick: 0, yaw: NEAR_EDGE }, room: { pick: 2, yaw: NEAR_EDGE }, right: { pick: 1, yaw: NEAR_EDGE } },
  Pancake: { cloud: { k: 1 }, end: {} },
  LastBox: { start: { k: 0 }, samin: { k: 1 }, nasib: { k: 2 }, end: {} },
  BetSettled: { start: {}, three: { cur: 0, opened: [0] }, one: { cur: 2, opened: [0, 2] }, done: { cur: 1, opened: [0, 2, 1] } },
  ColumnsNotDirections: { start: { k: 0 }, total: { k: 1 }, end: {} },
};
