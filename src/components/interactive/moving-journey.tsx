"use client";

import { useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  FADE,
  LOOK,
  Nope,
  POP,
  Scene,
  Ticks,
  pill,
  predictLook,
  primaryBtn,
  quietBtn,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
  type Look,
} from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person as CastPerson, Robot, Stage, Stall, StoryFrame } from "@/components/journey/cast";
import { Arrow, Plane, makeFrame, same, snap, tup, type Tone, type XY } from "@/components/journey/plane";
import { Door, Marks, Reach, isPlane, MARKS, type Key } from "./remote-journey";

// Screens for "Math for AI 5.3 — Basis and dimension, the fewest buttons",
// told as a Journey in plain English, 8 steps (the pathshala-journey skill).
//
// Moving day. The truck is at the gate, the robotics club has lent its drone
// to dust the new flat's ceiling fan, and the drone's remote is lost in some
// box. The toy shop builds remotes to order, 50 taka a button. Three claims:
// the shopkeeper's "the more buttons, the safer", Nasib's "one button, aimed
// right, is enough", and Som's "however you build it, the count comes out the
// same". The reader seals a bet on the fewest buttons for the floor and for
// the room (FewestButtons), then drops buttons off a three-button remote
// (DropOne: basis), files five ready-made remotes (ShopShelf: the two ways to
// fail), designs their own floor remotes (AnyPairTwo: dimension 2), flies the
// drone in a 3D room (FanOnCeiling: dimension 3), buys the cheapest remote off
// a shelf of seven with traps (ShopOrder, Your turn), and answers a visual
// Try it on two long buttons and four buttons in the room (TryTwoInRoom). The
// finale opens the three claims (ThreeVerdicts): Som wins.
//
// The floor machine (Reach, Marks, Door) is 5.1's (remote-journey.tsx). The
// room is drawn here: an oblique view of a 4 × 4 × 3 room with the door
// corner at (0, 0, 0) and the fan at (2, 2, 3), and a span painted in it as a
// line, a sheet (the plane clipped to the room) or the whole room.
//
// Watch-only figures, one in every <Then>: the three claims with a "?"
// (ThreeCards), the two jobs of a basis (TwoJobs), the two ways to fail
// (TwoFails), three designers' pairs (ThreeDesigners), the floor sheet lifted
// into the room (SheetLift), the cart of three (CartOfThree), long arrows on
// the same sheet (LongArrows), and floor 2 beside room 3 (TwoAndThree).
// Story scenes: the truck and the claims (TruckDay), the drone under the fan
// (DroneUnderFan), Abbu at the toy shop (AbbuOrders), the fan dusted
// (FanDusted). Cast name labels are Bangla chrome, so names are drawn here
// (MvTag).
//
// Tailwind only. Ink on white sheets and in the room is fixed.

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

const O: XY = [0, 0];

/** a key's colour as a literal class name */
const TEXT: Record<Tone, string> = {
  blue: "text-cat-blue",
  coral: "text-cat-coral",
  teal: "text-cat-teal",
  violet: "text-cat-violet",
  amber: "text-cat-amber",
  danger: "text-danger",
  ink: "text-foreground",
};
const TONE3: Record<Tone, { stroke: string; fill: string }> = {
  blue: { stroke: "stroke-cat-blue", fill: "fill-cat-blue" },
  coral: { stroke: "stroke-cat-coral", fill: "fill-cat-coral" },
  teal: { stroke: "stroke-cat-teal", fill: "fill-cat-teal" },
  violet: { stroke: "stroke-cat-violet", fill: "fill-cat-violet" },
  amber: { stroke: "stroke-cat-amber", fill: "fill-cat-amber" },
  danger: { stroke: "stroke-danger", fill: "fill-danger" },
  ink: { stroke: "stroke-[#0f1b2d]", fill: "fill-[#0f1b2d]" },
};

/** A name drawn under someone's feet on a stage (the cast's own label is Bangla). */
function MvTag({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={8} fontWeight={700} fill="#0f1b2d" stroke="white" strokeWidth={2.4} paintOrder="stroke">
      {name}
    </text>
  );
}

/** A remote drawn small: a dark body with `n` keys, in two columns past three. */
function MvRemote({ x, y, n, s = 1, cross = -1 }: { x: number; y: number; n: number; s?: number; cross?: number }) {
  const cols = n > 3 ? 2 : 1;
  const rows = Math.ceil(n / cols);
  const w = (cols === 2 ? 26 : 16) * s;
  const h = (8 + rows * 9) * s;
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={h} rx={4 * s} fill="#334155" stroke="#0f172a" />
      {Array.from({ length: n }, (_, i) => {
        const c = cols === 2 ? i % 2 : 0;
        const r = cols === 2 ? Math.floor(i / 2) : i;
        const kx = x - w / 2 + (cols === 2 ? 4 + c * 11 : 4) * s;
        const ky = y + (5 + r * 9) * s;
        return (
          <g key={i}>
            <rect x={kx} y={ky} width={8 * s} height={5.5 * s} rx={1.5 * s} fill={["#2563eb", "#e0664f", "#0d9488", "#7c3aed", "#d97706", "#64748b"][i % 6]} />
            {i === cross && <path d={`M${kx - 2} ${ky - 2}l${12 * s} ${9.5 * s}M${kx + 10 * s} ${ky - 2}l${-12 * s} ${9.5 * s}`} stroke="#e11d48" strokeWidth={1.6} />}
          </g>
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// The room: a 4 × 4 × 3 box seen from the front-left, the door corner at
// (0, 0, 0), x east, y north (into the picture), z up. The fan hangs from the
// middle of the ceiling. A span inside the room is painted as a line, a sheet
// (its plane clipped to the box) or the whole room.

type V3 = [number, number, number];
const O3: V3 = [0, 0, 0];
const RX = 4;
const RY = 4;
const RZ = 3;
const FAN: V3 = [2, 2, 3];

const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (k: number, a: V3): V3 => [k * a[0], k * a[1], k * a[2]];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a: V3) => Math.sqrt(dot3(a, a));

/** an orthonormal basis of everything the vectors can reach (Gram–Schmidt) */
function ortho3(vs: V3[]): V3[] {
  const out: V3[] = [];
  vs.forEach((v) => {
    const w = out.reduce((r, e) => sub3(r, mul3(dot3(r, e), e)), v);
    const l = len3(w);
    if (l > 1e-6) out.push(mul3(1 / l, w));
  });
  return out;
}
const rank3 = (vs: V3[]) => ortho3(vs).length;
/** the spot in the span closest to p */
const nearest3 = (p: V3, vs: V3[]): V3 => ortho3(vs).reduce((s, e) => add3(s, mul3(dot3(p, e), e)), O3);
const reaches3 = (p: V3, vs: V3[]) => len3(sub3(p, nearest3(p, vs))) < 1e-6;
const clampBox = (p: V3): V3 => [Math.min(RX, Math.max(0, p[0])), Math.min(RY, Math.max(0, p[1])), Math.min(RZ, Math.max(0, p[2]))];

const BOX: V3[] = [
  [0, 0, 0],
  [RX, 0, 0],
  [RX, RY, 0],
  [0, RY, 0],
  [0, 0, RZ],
  [RX, 0, RZ],
  [RX, RY, RZ],
  [0, RY, RZ],
];
const BOX_EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

type Span3 = { kind: "none" | "line" | "sheet" | "room"; pts: V3[] };
/** what a set of buttons paints inside the room */
function span3(vs: V3[]): Span3 {
  const b = ortho3(vs);
  if (b.length === 0) return { kind: "none", pts: [] };
  if (b.length === 3) return { kind: "room", pts: [] };
  if (b.length === 1) {
    const d = b[0];
    let lo = -1e6;
    let hi = 1e6;
    const lim = [RX, RY, RZ];
    for (let i = 0; i < 3; i += 1) {
      if (Math.abs(d[i]) < 1e-9) continue;
      const a = 0 / d[i];
      const c = lim[i] / d[i];
      lo = Math.max(lo, Math.min(a, c));
      hi = Math.min(hi, Math.max(a, c));
    }
    return { kind: "line", pts: hi > lo ? [mul3(lo, d), mul3(hi, d)] : [] };
  }
  const n = cross3(b[0], b[1]);
  const side = BOX.map((p) => dot3(n, p));
  const pts: V3[] = [];
  const push = (p: V3) => {
    if (!pts.some((q) => len3(sub3(p, q)) < 1e-6)) pts.push(p);
  };
  BOX.forEach((p, i) => {
    if (Math.abs(side[i]) < 1e-9) push(p);
  });
  BOX_EDGES.forEach(([i, j]) => {
    const a = side[i];
    const c = side[j];
    if ((a < -1e-9 && c > 1e-9) || (a > 1e-9 && c < -1e-9)) push(add3(BOX[i], mul3(a / (a - c), sub3(BOX[j], BOX[i]))));
  });
  if (pts.length < 3) return { kind: "sheet", pts };
  const mid = mul3(1 / pts.length, pts.reduce(add3, O3));
  const ang = (p: V3) => Math.atan2(dot3(sub3(p, mid), b[1]), dot3(sub3(p, mid), b[0]));
  return { kind: "sheet", pts: [...pts].sort((p, q) => ang(p) - ang(q)) };
}

type View = { p: (q: V3) => XY; W: number; H: number; u: number };
/** the oblique view of the room at `u` pixels a step */
function roomView(u: number): View {
  const ox = 22;
  const oy = 12 + 0.38 * u * RY + u * RZ;
  return {
    p: (q) => [ox + u * q[0] + 0.55 * u * q[1], oy - 0.38 * u * q[1] - u * q[2]],
    W: Math.round(ox + u * RX + 0.55 * u * RY + 10),
    H: Math.round(oy + 16),
    u,
  };
}
const pts2 = (v: View, qs: V3[]) => qs.map((q) => v.p(q).join(",")).join(" ");

/** The room's floor, two walls and the ceiling's outline; the fan and the door corner. */
function RoomBox({ v, fan = true, dusty = false, door = true }: { v: View; fan?: boolean; dusty?: boolean; door?: boolean }) {
  const tiles: string[] = [];
  for (let i = 1; i < RX; i += 1) tiles.push(`M${v.p([i, 0, 0]).join(" ")}L${v.p([i, RY, 0]).join(" ")}`);
  for (let j = 1; j < RY; j += 1) tiles.push(`M${v.p([0, j, 0]).join(" ")}L${v.p([RX, j, 0]).join(" ")}`);
  const [fx, fy] = v.p(FAN);
  const bl = v.u * 0.9;
  return (
    <g className="pointer-events-none">
      <polygon points={pts2(v, [BOX[0], BOX[3], BOX[7], BOX[4]])} fill="#f3ece0" />
      <polygon points={pts2(v, [BOX[3], BOX[2], BOX[6], BOX[7]])} fill="#ebe1d0" />
      <polygon points={pts2(v, [BOX[0], BOX[1], BOX[2], BOX[3]])} fill="#e6d3b3" />
      <path d={tiles.join("")} stroke="#c6ad82" strokeWidth={0.8} fill="none" />
      <path
        d={`M${v.p(BOX[0]).join(" ")}L${v.p(BOX[1]).join(" ")}L${v.p(BOX[2]).join(" ")}L${v.p(BOX[3]).join(" ")}ZM${v.p(BOX[3]).join(" ")}L${v.p(BOX[7]).join(" ")}M${v.p(BOX[2]).join(" ")}L${v.p(BOX[6]).join(" ")}M${v.p(BOX[0]).join(" ")}L${v.p(BOX[4]).join(" ")}`}
        stroke="#0f1b2d"
        strokeOpacity={0.3}
        strokeWidth={1}
        fill="none"
      />
      <path
        d={`M${v.p(BOX[4]).join(" ")}L${v.p(BOX[5]).join(" ")}L${v.p(BOX[6]).join(" ")}L${v.p(BOX[7]).join(" ")}ZM${v.p(BOX[1]).join(" ")}L${v.p(BOX[5]).join(" ")}`}
        stroke="#0f1b2d"
        strokeOpacity={0.3}
        strokeWidth={1}
        strokeDasharray="4 3"
        fill="none"
      />
      {fan && (
        <g>
          <path d={`M${fx} ${fy - 9}V${fy - 2}`} stroke="#475569" strokeWidth={1.6} />
          <ellipse cx={fx} cy={fy} rx={bl} ry={bl * 0.2} fill="#94a3b8" stroke="#475569" strokeWidth={0.8} />
          <circle cx={fx} cy={fy} r={2.6} fill="#475569" />
          {dusty && [-0.6, -0.3, 0.35, 0.7].map((t) => <circle key={t} cx={fx + t * bl} cy={fy - 0.5} r={1.1} fill="#78716c" />)}
          <text x={fx + bl + 3} y={fy + 3} fontSize={8} fontWeight={700} fill="#5a6b7d">
            fan
          </text>
        </g>
      )}
      <circle cx={v.p(O3)[0]} cy={v.p(O3)[1]} r={3.2} fill="#0f1b2d" />
      {door && (
        <text x={v.p(O3)[0] - 5} y={v.p(O3)[1] + 12} textAnchor="middle" fontSize={8} fontWeight={700} fill="#5a6b7d">
          door
        </text>
      )}
    </g>
  );
}

/** What a set of buttons paints in the room. */
function SpanPaint({ v, s, className = "" }: { v: View; s: Span3; className?: string }) {
  if (s.kind === "room")
    return <polygon points={pts2(v, [BOX[0], BOX[1], BOX[2], BOX[6], BOX[7], BOX[4]])} className={`pointer-events-none fill-cat-violet/20 stroke-cat-violet/50 ${className}`} strokeWidth={1.2} />;
  if (s.kind === "line" && s.pts.length === 2) {
    const [a, b] = s.pts.map(v.p);
    return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={8} strokeLinecap="round" className={`pointer-events-none stroke-cat-violet/35 ${className}`} />;
  }
  if (s.kind === "sheet" && s.pts.length >= 3)
    return <polygon points={pts2(v, s.pts)} strokeWidth={1.2} className={`pointer-events-none fill-cat-violet/30 stroke-cat-violet/70 ${className}`} />;
  return null;
}

/** An arrow in the room, from `from` to `to`. */
function Arrow3({ v, from = O3, to, tone, w = 2.4, faint = false }: { v: View; from?: V3; to: V3; tone: Tone; w?: number; faint?: boolean }) {
  const [x1, y1] = v.p(from);
  const [x2, y2] = v.p(to);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const h = Math.min(8 + w * 1.4, len * 0.55);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const half = h * 0.48;
  const { stroke, fill } = TONE3[tone];
  return (
    <g opacity={faint ? 0.3 : 1} className="pointer-events-none">
      <path d={`M${x1} ${y1}L${bx + ux * 0.5} ${by + uy * 0.5}`} strokeWidth={w} strokeLinecap="round" className={`fill-none ${stroke}`} />
      <path d={`M${x2} ${y2}L${bx - uy * half} ${by + ux * half}L${bx + uy * half} ${by - ux * half}Z`} className={fill} />
    </g>
  );
}

/** The robotics club's drone, drawn just under the spot it has flown to. */
function MvDrone({ at, s = 1 }: { at: XY; s?: number }) {
  return (
    <g transform={`translate(${at[0]} ${at[1] + 3 * s}) scale(${s})`} className="pointer-events-none">
      <path d="M-12 -3H12M-12 -3V-6M12 -3V-6M-5 2l-2 4M5 2l2 4" stroke="#334155" strokeWidth={1.8} strokeLinecap="round" fill="none" />
      <ellipse cx={-12} cy={-7} rx={6} ry={1.3} fill="#64748b" />
      <ellipse cx={12} cy={-7} rx={6} ry={1.3} fill="#64748b" />
      <rect x={-7} y={-6} width={14} height={8} rx={3} fill="#0d9488" />
      <circle cx={3.5} cy={-2.5} r={1} fill="#fde047" />
    </g>
  );
}

/** A dashed gap from where the drone got to up to the fan: the part it can't reach. */
function Gap({ v, from }: { v: View; from: V3 }) {
  const [x1, y1] = v.p(from);
  const [x2, y2] = v.p(FAN);
  if (Math.hypot(x2 - x1, y2 - y1) < 2) return null;
  return <path d={`M${x1} ${y1}L${x2} ${y2}`} strokeDasharray="4 3" strokeWidth={1.8} className={`pointer-events-none fill-none stroke-danger ${FADE}`} />;
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: moving day. The truck at
//      the gate, boxes coming off; the shopkeeper, Nasib and Som each make a
//      claim; the drone hovers in, remote-less. No count is shown: that is
//      the bet.

const S1_G = 150;

function MvTruck({ x }: { x: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={S1_G - 44} width={58} height={36} rx={2} fill="#e2e8f0" stroke="#475569" />
      <rect x={x + 58} y={S1_G - 32} width={24} height={24} rx={3} fill="#2563eb" stroke="#1e3a8a" />
      <rect x={x + 64} y={S1_G - 28} width={12} height={9} rx={1.5} fill="#bfdbfe" />
      <circle cx={x + 14} cy={S1_G - 6} r={6} fill="#1f2937" />
      <circle cx={x + 68} cy={S1_G - 6} r={6} fill="#1f2937" />
      <rect x={x + 6} y={S1_G - 30} width={16} height={14} rx={1} fill="#d6b98c" stroke="#92400e" />
      <rect x={x + 26} y={S1_G - 34} width={20} height={18} rx={1} fill="#d6b98c" stroke="#92400e" />
    </g>
  );
}

export function TruckDay({}: Story) {
  const s = useScene(4, [600, 2400, 2400, 2400, 2000]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="moving day: the truck at the gate; the shopkeeper says the more buttons the safer, Nasib says one button aimed right is enough, Som says the count comes out the same; the drone hovers in without a remote">
        <MvTruck x={2} />
        <CastPerson who="karim" x={136} y={S1_G} scale={0.8} mood={k === 1 ? "smug" : "plain"} arm={k === 1 ? "point" : "down"} />
        <Stall x={136} y={S1_G} sign="50 taka a button" color="#0d9488" w={78} />
        <MvTag x={136} y={S1_G + 12} name="shopkeeper" />
        {k === 1 && <Bubble x={136} y={S1_G - 70} side="mid" lines={["The more buttons,", "the safer."]} />}
        <CastPerson who="nasib" x={k >= 2 ? 214 : 360} y={S1_G} facing={-1} walking={k === 2} mood="smug" arm={k === 2 ? "point" : "down"} />
        {k >= 2 && <MvTag x={214} y={S1_G + 12} name="Nasib" />}
        {k === 2 && <Bubble x={214} y={S1_G - 66} side="mid" lines={["One button, aimed", "right, is enough."]} />}
        <CastPerson who="som" x={k >= 3 ? 276 : 380} y={S1_G} facing={-1} walking={k === 3} mood={k === 3 ? "happy" : "plain"} />
        {k >= 3 && <MvTag x={276} y={S1_G + 12} name="Som" />}
        {k === 3 && <Bubble x={276} y={S1_G - 66} side="left" lines={["Build it any way.", "The count stays."]} />}
        {k >= 4 && (
          <g className={POP}>
            <MvDrone at={[236, 44]} />
            <CastCard x={236} y={66} text="remote?" tone="amber" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The fewest buttons for Shiku's floor (1, 2, 3, or "the
//     more the better"), for the drone's room (2, 3, 4, or more), and whether
//     Som's "the same count, whoever builds it" holds. Sealed, unmarked; the
//     Finale settles it.

const FLOOR_OPT = [1, 2, 3, 6];
const ROOM_OPT = [2, 3, 4, 6];
const SOM_OPT = ["Same for everyone", "Depends who builds it"];

function CountPick({ opts, pick, sealed, onPick }: { opts: number[]; pick: number | null; sealed: boolean; onPick: (n: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {opts.map((n) => {
        const look: Look = pick === n ? "picked" : sealed || pick !== null ? "dim" : "idle";
        return (
          <button
            key={n}
            type="button"
            disabled={sealed}
            onClick={() => onPick(n)}
            className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-1 py-1 text-xs font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look]}`}
          >
            <svg key={pick === n ? "on" : "off"} viewBox="0 0 34 46" className={`h-10 w-auto ${pick === n ? POP : ""}`} aria-hidden="true">
              <MvRemote x={17} y={2} n={n} s={n > 3 ? 1.1 : 1.15} />
            </svg>
            {n === 6 ? "the more, the better" : `${n} button${n > 1 ? "s" : ""}`}
          </button>
        );
      })}
    </div>
  );
}

export function FewestButtons() {
  const pass = useGate();
  const [floor, setFloor] = useSeed<number | null>("floor", null);
  const [room, setRoom] = useSeed<number | null>("room", null);
  const [som, setSom] = useSeed<number | null>("som", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const ready = floor !== null && room !== null && som !== null;

  const seal = () => {
    setSealed(true);
    pass("Bet sealed. Let's start dropping buttons.");
  };

  return (
    <>
      <div className="text-sm font-medium">The fewest buttons for Shiku, anywhere on the floor?</div>
      <div className="mt-1.5">
        <CountPick opts={FLOOR_OPT} pick={floor} sealed={sealed} onPick={setFloor} />
      </div>
      <div className="mt-3 text-sm font-medium">The fewest for the drone, anywhere in the room, the fan too?</div>
      <div className="mt-1.5">
        <CountPick opts={ROOM_OPT} pick={room} sealed={sealed} onPick={setRoom} />
      </div>
      <div className="mt-3 text-sm font-medium">Som says the fewest count is the same whoever builds it. Is it?</div>
      <div className="mt-1.5 flex flex-wrap justify-center gap-2">
        {SOM_OPT.map((o, i) => (
          <button
            key={o}
            type="button"
            disabled={sealed}
            onClick={() => setSom(i)}
            className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[som === i ? "picked" : sealed || som !== null ? "dim" : "idle"]}`}
          >
            {o}
          </button>
        ))}
      </div>
      {!sealed ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={seal} disabled={!ready} className={primaryBtn}>
            Seal the bet
          </button>
        </div>
      ) : (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>Bet sealed. We&apos;ll open it at the end of the day.</div>
      )}
      <Task done={sealed}>Pick all three answers, then seal the bet.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the three claims side by
//      side, each with its remote, and a "?" stamped on every one.

const X1_SAY = [
  "Three people, three claims about one remote.",
  "The shopkeeper: the more buttons, the safer.",
  "Nasib: one button is enough, if you aim it right.",
  "Som: however you build it, the count comes out the same.",
  "Only one of them can be right. Which one? That's the day's question.",
];
const X1_CLAIMS: { who: string; lines: string[]; n: number }[] = [
  { who: "Shopkeeper", lines: ["The more,", "the safer."], n: 6 },
  { who: "Nasib", lines: ["One button,", "aimed right."], n: 1 },
  { who: "Som", lines: ["Same count,", "any builder."], n: 2 },
];

export function ThreeCards() {
  const s = useScene(4, [600, 1600, 1600, 1800, 2000]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <svg viewBox="0 0 300 120" className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label="three claims side by side: the more the safer, one button aimed right, the same count whoever builds it">
        {X1_CLAIMS.map((c, i) => {
          const cx = 50 + i * 100;
          const on = k >= i + 1;
          return (
            <g key={c.who} opacity={on ? 1 : 0.25} className="transition-opacity duration-500 motion-reduce:transition-none">
              <rect x={cx - 44} y={4} width={88} height={112} rx={8} fill="white" stroke="#cbd5e1" />
              <text x={cx} y={20} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0f1b2d">
                {c.who}
              </text>
              {i === 2 ? (
                <text x={cx} y={52} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#b45309">
                  ? = ?
                </text>
              ) : (
                <MvRemote x={cx} y={28} n={c.n} s={0.9} />
              )}
              {c.lines.map((l, j) => (
                <text key={l} x={cx} y={80 + j * 12} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="#334155">
                  {l}
                </text>
              ))}
              {k >= 4 && (
                <text x={cx + 30} y={30} textAnchor="middle" fontSize={20} fontWeight={800} fill="#b45309" className={POP}>
                  ?
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2 · Drop one. Nasib's three-button remote from 5.2: e₁, e₂ and w = (2, 3).
//     The reader drops buttons one at a time and the paint answers: drop any
//     one, the floor stays painted; drop a second, only a line is left. Each
//     drop shrinks the button's arrow away and repaints.

const DROP_KEYS: Key[] = [
  { name: "e₁", v: [1, 0], tone: "blue" },
  { name: "e₂", v: [0, 1], tone: "coral" },
  { name: "w", v: [2, 3], tone: "teal" },
];
const DF = makeFrame(-2, 5, -2, 6, 21, 12);
const det2 = (a: XY, b: XY) => a[0] * b[1] - a[1] * b[0];
/** which of Ammu's marks a set of floor buttons reaches */
const marksHit = (keys: Key[]) =>
  isPlane(keys) ? MARKS.map((m) => m.name) : MARKS.filter((m) => keys.some((k) => (k.v[0] || k.v[1]) && det2(k.v, m.at) === 0)).map((m) => m.name);

export function DropOne() {
  const pass = useGate();
  const [kept, setKept] = useSeed<boolean[]>("kept", [true, true, true]);
  const [saw2, setSaw2] = useSeed("saw2", false);
  const [saw1, setSaw1] = useSeed("saw1", false);
  const grow = useTween(kept.map((x) => (x ? 1 : 0)), 450);
  const keys = DROP_KEYS.filter((_, i) => kept[i]);
  const full = isPlane(keys);
  const hit = marksHit(keys);
  const done = saw2 && saw1;

  const toggle = (i: number) => {
    const next = kept.map((x, j) => (j === i ? !x : x));
    const n = next.filter(Boolean).length;
    if (n === 0) return;
    setKept(next);
    const k2 = saw2 || n === 2;
    const k1 = saw1 || n === 1;
    setSaw2(k2);
    setSaw1(k1);
    if (!done && k2 && k1) pass("Drop one: nothing lost. Drop two: a line.");
  };

  return (
    <>
      <Plane f={DF} grid={1} ticks={2} label={`${keys.length} buttons kept; they reach ${full ? "the whole floor" : "one line"}`} className="my-1! max-w-[10.5rem]">
        <Reach key={kept.join()} f={DF} keys={keys} on dots={false} />
        <Marks f={DF} hit={hit} />
        {DROP_KEYS.map((k, i) => (
          <Arrow key={k.name} f={DF} from={O} to={[k.v[0] * grow[i], k.v[1] * grow[i]]} tone={k.tone} w={2.4} />
        ))}
        <Door f={DF} />
      </Plane>
      <div className="flex justify-center gap-2">
        {DROP_KEYS.map((k, i) => (
          <button
            key={k.name}
            type="button"
            onClick={() => toggle(i)}
            className={`cursor-pointer rounded-xl border-2 px-2.5 py-1 text-sm transition-colors duration-200 motion-reduce:transition-none ${
              kept[i] ? "border-border hover:border-cat-blue/60" : "border-dashed border-border opacity-50"
            }`}
          >
            <b className={TEXT[k.tone]}>{k.name}</b> <span className="font-mono">{tup(k.v)}</span>
            <div className="text-xs text-muted">{kept[i] ? "drop it" : "put back"}</div>
          </button>
        ))}
      </div>
      <div key={kept.join()} className={`${FADE} mt-2 text-center text-[0.95rem]`}>
        {keys.length} button{keys.length > 1 ? "s" : ""}, {keys.length * 50} taka:{" "}
        <b className={full ? "text-accent-text" : "text-danger"}>{full ? "the whole floor" : "only a line"}</b>, {hit.length} of 4 marks.
      </div>
      <Ticks
        items={[
          ["Drop one button", saw2],
          ["Drop two", saw1],
        ]}
      />
      <Task done={done}>Drop buttons one at a time. Watch the paint and Ammu&apos;s marks.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the two jobs of a basis.
//      Three remotes side by side; under each, "no extra" and "reaches all"
//      get a tick or a cross; only the two-button one gets both, and the name.

const X2_F = makeFrame(-1, 3, -1, 3, 14, 6);
const X2_REMOTES: { keys: Key[]; extra: boolean; all: boolean }[] = [
  { keys: DROP_KEYS, extra: true, all: true },
  { keys: DROP_KEYS.slice(0, 2), extra: false, all: true },
  { keys: DROP_KEYS.slice(0, 1), extra: false, all: false },
];
const X2_ORDER = [0, 2, 1];
const X2_SAY = [
  "Three remotes. Two jobs for each: nothing extra, and reach every spot.",
  "Three buttons: reaches every spot, but one button is extra.",
  "One button: nothing extra, but it misses most of the floor.",
  "Two buttons: nothing extra, every spot reached. That's a basis.",
];

function JobLine({ ok, on, text }: { ok: boolean; on: boolean; text: string }) {
  return (
    <div className="flex items-center justify-center gap-1 text-[0.68rem] leading-tight">
      <span className={on ? `${POP} font-bold ${ok ? "text-accent-text" : "text-danger"}` : "text-muted"}>{on ? (ok ? "✓" : "✕") : "·"}</span>
      <span className={on ? "" : "text-muted"}>{text}</span>
    </div>
  );
}

export function TwoJobs() {
  const s = useScene(3, [600, 1800, 1800]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X2_SAY[k]}</span>}>
      <div className="flex justify-center gap-2">
        {X2_REMOTES.map((r, i) => {
          const on = k >= X2_ORDER.indexOf(i) + 1;
          return (
            <div key={i} className={`w-[5.5rem] rounded-xl p-1 ${on && i === 1 ? "bg-accent/10 ring-2 ring-accent" : ""}`}>
              <Plane f={X2_F} grid={1} axes={false} label={`${r.keys.length} buttons`} className="my-0! max-w-none">
                {on && <Reach f={X2_F} keys={r.keys} on dots={false} />}
                {r.keys.map((key) => (
                  <Arrow key={key.name} f={X2_F} from={O} to={key.v} tone={key.tone} w={2} />
                ))}
                <circle cx={X2_F.sx(0)} cy={X2_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
              </Plane>
              <div className="mt-0.5 text-center text-xs font-semibold">
                {r.keys.length} button{r.keys.length > 1 ? "s" : ""}
              </div>
              <JobLine ok={!r.extra} on={on} text="no extra" />
              <JobLine ok={r.all} on={on} text="reaches all" />
              {on && i === 1 && <div className={`${POP} mt-0.5 text-center text-xs font-bold text-accent-text`}>basis</div>}
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · The shop's shelf. Five ready-made remotes, one at a time, painted; the
//     reader files each one: basis, has an extra, or misses spots. A wrong
//     bin bounces with a question about the paint; a right one lands in the
//     table with its reason. (The twin remote does both wrong things, so
//     either failing bin is right for it.)

type Bin = "basis" | "extra" | "misses";
const BINS: { bin: Bin; label: string }[] = [
  { bin: "basis", label: "Basis" },
  { bin: "extra", label: "Has an extra" },
  { bin: "misses", label: "Misses spots" },
];
const SHOP5: { keys: Key[]; ok: Bin[]; why: string }[] = [
  {
    keys: [
      { name: "u", v: [1, 2], tone: "blue" },
      { name: "v", v: [2, 5], tone: "coral" },
    ],
    ok: ["basis"],
    why: "Two different directions, nothing to drop.",
  },
  {
    keys: [
      { name: "e₁", v: [1, 0], tone: "blue" },
      { name: "e₂", v: [0, 1], tone: "coral" },
      { name: "w", v: [2, 3], tone: "teal" },
    ],
    ok: ["extra"],
    why: "w = 2 e₁ + 3 e₂. Drop it, same floor.",
  },
  { keys: [{ name: "e₁", v: [1, 0], tone: "blue" }], ok: ["misses"], why: "One button paints one line." },
  {
    keys: [
      { name: "e₁", v: [1, 0], tone: "blue" },
      { name: "e₂", v: [0, 1], tone: "coral" },
    ],
    ok: ["basis"],
    why: "One east, one north. Nothing extra, nothing missed.",
  },
  {
    keys: [
      { name: "u", v: [1, 1], tone: "blue" },
      { name: "v", v: [2, 2], tone: "coral" },
    ],
    ok: ["extra", "misses"],
    why: "(2, 2) is (1, 1) twice: extra, and only a line.",
  },
];
const SF = makeFrame(-2, 4, -2, 6, 13, 8);

function shelfNope(right: Bin[], picked: Bin, n: number) {
  if (picked === "basis" && right.includes("misses")) return "Nope. Look at the paint. Does it cover the whole floor?";
  if (picked === "basis") return "Nope. Could you drop one button and keep the same paint?";
  if (picked === "extra" && n === 1) return "Nope. There's only one button, nothing to drop. Look at the paint.";
  if (picked === "extra") return "Nope. Drop either button in your head. Would the paint survive?";
  return "Nope. The paint covers the whole floor. Which spot does it miss?";
}

export function ShopShelf() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [filed, setFiled] = useSeed<Bin[]>("filed", []);
  const [wrong, setWrong] = useSeed<Bin | null>("wrong", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const done = filed.length === SHOP5.length;
  const r = SHOP5[Math.min(at, SHOP5.length - 1)];

  const file = (b: Bin) => {
    if (done) return;
    if (!r.ok.includes(b)) {
      setWrong(b);
      setMiss(miss + 1);
      return;
    }
    setWrong(null);
    const next = [...filed, b];
    setFiled(next);
    if (next.length === SHOP5.length) pass("Too many: an extra. Too few: missed spots.");
    else setAt(at + 1);
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[7rem] shrink-0">
          <Plane f={SF} grid={1} axes={false} label={`remote ${at + 1}, painted`} className="my-0! max-w-none">
            <Reach key={at} f={SF} keys={r.keys} on dots={false} />
            {r.keys.map((k) => (
              <Arrow key={`${at}${k.name}`} f={SF} from={O} to={k.v} tone={k.tone} w={2.2} draw />
            ))}
            <Door f={SF} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted">
            Remote {Math.min(at + 1, SHOP5.length)} of {SHOP5.length}
          </div>
          <div key={at} className={`${FADE} mt-0.5 font-mono text-[0.95rem]`}>
            {r.keys.map((k, i) => (
              <span key={k.name} className={TEXT[k.tone]}>
                {i > 0 && <span className="text-muted"> · </span>}
                {tup(k.v)}
              </span>
            ))}
          </div>
          <div className="mt-2 grid gap-1.5">
            {BINS.map((b) => (
              <button
                key={`${b.bin}${wrong === b.bin ? miss : ""}`}
                type="button"
                disabled={done}
                onClick={() => file(b.bin)}
                className={`cursor-pointer rounded-xl border-2 px-3 py-1.5 text-left text-sm font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${
                  LOOK[wrong === b.bin ? "wrong" : done ? "dim" : "idle"]
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {wrong && <Nope key={miss}>{shelfNope(r.ok, wrong, r.keys.length)}</Nope>}
      <div className="mx-auto mt-2 max-w-sm">
        {filed.map((b, i) => (
          <div key={i} className={`${FADE} flex items-baseline justify-between gap-2 border-t border-border py-0.5 text-xs`}>
            <span className="font-mono">{SHOP5[i].keys.map((k) => tup(k.v)).join(" ")}</span>
            <span className={`shrink-0 font-semibold ${b === "basis" ? "text-accent-text" : "text-danger"}`}>{BINS.find((x) => x.bin === b)?.label}</span>
          </div>
        ))}
        {filed.length > 0 && <div className={`${FADE} text-center text-xs text-muted`}>{SHOP5[filed.length - 1].why}</div>}
      </div>
      <Task done={done}>File all five remotes: a basis, one with an extra, or one that misses spots.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the two ways to fail.
//      An overfull remote, whose w is walked out of e₁ and e₂ (so it pays for
//      nothing), and a thin one, whose line leaves the bed's mark bare.

const X3_F = makeFrame(-1, 4, -1, 4, 14, 6);
const X3_FULL = SHOP5[1].keys;
const X3_THIN: Key[] = [{ name: "u", v: [1, 1], tone: "blue" }];
const X3_SAY = [
  "Two remotes that fail, each its own way.",
  "Too many: three buttons, the floor painted.",
  "But w is just e₁ twice and e₂ three times. 50 taka for nothing.",
  "Too few: one button, one line.",
  "And the bed's mark is left out. No press can get there.",
];

export function TwoFails() {
  const s = useScene(4, [600, 1600, 2200, 1600, 2000]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <div className="flex justify-center gap-3">
        <div className="w-[7rem]">
          <Plane f={X3_F} grid={1} axes={false} label="too many: w is two e₁ and three e₂" className="my-0! max-w-none">
            {k >= 1 && <Reach f={X3_F} keys={X3_FULL} on dots={false} />}
            {X3_FULL.map((key) => (
              <Arrow key={key.name} f={X3_F} from={O} to={key.v} tone={key.tone} w={2} faint={k >= 2 && key.name !== "w"} />
            ))}
            {k >= 2 && (
              <g className={FADE}>
                <Arrow f={X3_F} from={[0, 0]} to={[2, 0]} tone="blue" w={2} draw />
                <Arrow f={X3_F} from={[2, 0]} to={[2, 3]} tone="coral" w={2} draw delay={300} />
              </g>
            )}
            <circle cx={X3_F.sx(0)} cy={X3_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
          </Plane>
          <div className="mt-0.5 text-center text-xs font-semibold">
            Too many{k >= 2 && <span className={`${FADE} text-danger`}> ✕ extra</span>}
          </div>
        </div>
        <div className="w-[7rem]">
          <Plane f={X3_F} grid={1} axes={false} label="too few: one line, the bed left out" className="my-0! max-w-none">
            {k >= 3 && <Reach f={X3_F} keys={X3_THIN} on dots={false} />}
            <Arrow f={X3_F} from={O} to={[1, 1]} tone="blue" w={2} />
            {k >= 4 && (
              <g className={POP}>
                <rect x={X3_F.sx(1) - 7} y={X3_F.sy(3) - 7} width={14} height={14} rx={2} fill="none" strokeDasharray="3 2" strokeWidth={1.4} className="stroke-danger" />
                <text x={X3_F.sx(1)} y={X3_F.sy(3) - 10} textAnchor="middle" fontSize={8} fontWeight={700} className="fill-danger">
                  bed
                </text>
              </g>
            )}
            <circle cx={X3_F.sx(0)} cy={X3_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
          </Plane>
          <div className="mt-0.5 text-center text-xs font-semibold">
            Too few{k >= 4 && <span className={`${FADE} text-danger`}> ✕ misses</span>}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · Your own floor remote. Drag button tips anywhere on the floor, add a
//     button or take one off; the paint and a flag answer at once. Keep three
//     different working designs, and try three buttons once: every design
//     that works has exactly two.

const AF = makeFrame(-3, 3, -3, 3, 23, 12);
const A_TONES: Tone[] = ["blue", "coral", "teal"];
const A_NEW: XY[] = [
  [2, 1],
  [-1, 2],
  [1, -2],
];
const designKey = (tips: XY[]) => tips.map(tup).sort().join(" ");

export function AnyPairTwo() {
  const pass = useGate();
  const [tips, setTips] = useSeed<XY[]>("tips", [[2, 1]]);
  const [kept, setKept] = useSeed<string[]>("kept", []);
  const [tried3, setTried3] = useSeed("tried3", false);
  const [held, setHeld] = useState<number | null>(null);
  const keys: Key[] = tips.map((t, i) => ({ name: `b${i + 1}`, v: t, tone: A_TONES[i] }));
  const full = isPlane(keys);
  const basis = full && tips.length === 2;
  const key = designKey(tips);
  const done = kept.length >= 3 && tried3;

  const finish = (k3: string[], t3: boolean) => {
    if (!done && k3.length >= 3 && t3) pass("Whoever builds it, the floor takes two.");
  };
  const down = (p: XY) => {
    let best = -1;
    let bd = 1.3;
    tips.forEach((t, i) => {
      const d = Math.hypot(t[0] - p[0], t[1] - p[1]);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setHeld(best >= 0 ? best : null);
  };
  const move = (p: XY) => {
    if (held === null) return;
    const q = snap(p, AF);
    if (same(q, O)) return;
    setTips(tips.map((t, i) => (i === held ? q : t)));
  };
  const addOne = () => {
    if (tips.length >= 3) return;
    const free = A_NEW.find((c) => !tips.some((t) => same(t, c))) ?? [1, 1];
    setTips([...tips, free]);
    if (tips.length + 1 === 3) {
      setTried3(true);
      finish(kept, true);
    }
  };
  const dropOne = () => {
    if (tips.length > 1) setTips(tips.slice(0, -1));
  };
  const keep = () => {
    if (!basis || kept.includes(key)) return;
    const next = [...kept, key];
    setKept(next);
    finish(next, tried3);
  };

  const flag = basis
    ? { tone: "text-accent-text", say: "Two directions: the whole floor, nothing extra. A basis." }
    : tips.length === 1
      ? { tone: "text-danger", say: "One button: only a line. Most spots missed." }
      : full
        ? { tone: "text-danger", say: "The whole floor, but one button is extra." }
        : { tone: "text-danger", say: "Only a line, and a button is extra." };

  return (
    <>
      <Plane
        f={AF}
        grid={1}
        axes={false}
        label={`your remote: ${tips.length} buttons, ${full ? "the whole floor" : "one line"}`}
        className="my-1! max-w-[10rem]"
        drag={{ down, move, up: () => setHeld(null) }}
      >
        <Reach key={`${full}${tips.length}`} f={AF} keys={keys} on dots={false} />
        {keys.map((k) => (
          <Arrow key={k.name} f={AF} from={O} to={k.v} tone={k.tone} w={2.4} />
        ))}
        {tips.map((t, i) => (
          <circle key={i} cx={AF.sx(t[0])} cy={AF.sy(t[1])} r={held === i ? 8 : 6} strokeWidth={2} className={`fill-white/70 ${TONE3[A_TONES[i]].stroke}`} />
        ))}
        <circle cx={AF.sx(0)} cy={AF.sy(0)} r={3} className="fill-[#0f1b2d]" />
      </Plane>
      <div key={`${key}`} className={`${FADE} text-center text-[0.9rem] font-semibold ${flag.tone}`}>
        {flag.say}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        <button type="button" onClick={dropOne} disabled={tips.length <= 1} className={`${quietBtn} h-9! px-3! text-sm`}>
          − button
        </button>
        <button type="button" onClick={addOne} disabled={tips.length >= 3} className={`${quietBtn} h-9! px-3! text-sm`}>
          + button
        </button>
        <button type="button" onClick={keep} disabled={!basis || kept.includes(key)} className={`${primaryBtn} h-9! px-3! text-sm`}>
          Keep this design
        </button>
      </div>
      {kept.length > 0 && (
        <div className="mt-1.5 text-center font-mono text-xs text-muted">
          {kept.map((d) => (
            <div key={d} className={POP}>
              {d}
            </div>
          ))}
        </div>
      )}
      <Ticks
        items={[
          ["Design 1", kept.length >= 1],
          ["Design 2", kept.length >= 2],
          ["Design 3", kept.length >= 3],
          ["Three buttons", tried3],
        ]}
      />
      <Task done={done}>Drag the button tips. Keep three different designs that work, and try three buttons once.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: three designers' floor
//      remotes, nothing alike, each painting the whole floor, and each
//      counting 2.

const X4_F = makeFrame(-2, 2, -2, 2, 15, 6);
const X4_DESIGNS: { who: string; keys: Key[] }[] = [
  {
    who: "Fahim",
    keys: [
      { name: "a", v: [1, 0], tone: "blue" },
      { name: "b", v: [0, 1], tone: "coral" },
    ],
  },
  {
    who: "Nasib",
    keys: [
      { name: "a", v: [2, 1], tone: "blue" },
      { name: "b", v: [-1, 2], tone: "coral" },
    ],
  },
  {
    who: "Som",
    keys: [
      { name: "a", v: [1, 1], tone: "blue" },
      { name: "b", v: [1, -2], tone: "coral" },
    ],
  },
];
const X4_SAY = [
  "Three people design a floor remote.",
  "Fahim's: east and north. The whole floor.",
  "Nasib's: two slanted buttons. The whole floor.",
  "Som's: another pair. The whole floor again.",
];

export function ThreeDesigners() {
  const s = useScene(3, [600, 1600, 1600]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? <span key={k} className={FADE}>{X4_SAY[k]}</span> : <span className={FADE}>{X4_SAY[3]} Nothing alike, and every one has exactly 2.</span>}>
      <div className="flex justify-center gap-2">
        {X4_DESIGNS.map((d, i) => (
          <div key={d.who} className={`w-[5.5rem] transition-opacity duration-500 motion-reduce:transition-none ${k >= i + 1 ? "opacity-100" : "opacity-40"}`}>
            <Plane f={X4_F} grid={1} axes={false} label={`${d.who}'s two buttons`} className="my-0! max-w-none">
              {k >= i + 1 && <Reach f={X4_F} keys={d.keys} on dots={false} />}
              {d.keys.map((key) => (
                <Arrow key={key.name} f={X4_F} from={O} to={key.v} tone={key.tone} w={2} />
              ))}
              <circle cx={X4_F.sx(0)} cy={X4_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
            </Plane>
            <div className="mt-0.5 text-center text-xs font-semibold">{d.who}</div>
            {k >= i + 1 && <div className={`${POP} text-center font-mono text-lg font-bold text-accent-text`}>2</div>}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: the fan in the middle of
//      the ceiling, thick with dust; the drone flies in and hovers under it;
//      Fahim wonders if two buttons will do again, and Nasib says aim them
//      well. No answer is shown.

const S5_G = 150;
const S5_FAN = { x: 160, y: 34 };

function S5Fan({ dust }: { dust: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={0} width={320} height={16} fill="#e7dccb" />
      <path d={`M${S5_FAN.x} 16V${S5_FAN.y - 3}`} stroke="#475569" strokeWidth={2} />
      <ellipse cx={S5_FAN.x} cy={S5_FAN.y} rx={46} ry={5} fill="#94a3b8" stroke="#475569" />
      <circle cx={S5_FAN.x} cy={S5_FAN.y} r={5} fill="#475569" />
      {dust && [-38, -26, -14, 12, 24, 36].map((dx) => <circle key={dx} cx={S5_FAN.x + dx} cy={S5_FAN.y - 2} r={1.6} fill="#78716c" />)}
    </g>
  );
}

export function DroneUnderFan({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S5_G} label="the dusty ceiling fan in the new flat; the drone flies in and hovers under it; Fahim wonders if two buttons will do again; Nasib says aim them well">
        <S5Fan dust />
        <g style={{ transform: `translate(${k >= 1 ? 0 : -150}px, 0)` }} className="transition-transform duration-1000 ease-out motion-reduce:transition-none">
          <MvDrone at={[S5_FAN.x, 104]} s={1.3} />
        </g>
        <CastPerson who="fahim" x={70} y={S5_G + 16} mood={k >= 2 ? "puzzled" : "plain"} arm={k >= 2 ? "hold" : "down"} />
        <MvTag x={70} y={S5_G + 26} name="Fahim" />
        {k >= 2 && <MvRemote x={94} y={S5_G - 30} n={2} s={0.8} />}
        {k === 2 && <Bubble x={70} y={S5_G - 52} side="mid" lines={["Two did the", "whole floor..."]} />}
        <Robot x={112} y={S5_G + 16} />
        <CastPerson who="nasib" x={k >= 3 ? 258 : 360} y={S5_G + 16} facing={-1} walking={k === 3} mood="smug" />
        {k >= 3 && <MvTag x={258} y={S5_G + 26} name="Nasib" />}
        {k >= 3 && <Bubble x={258} y={S5_G - 52} side="left" lines={["Aim them well.", "Two will do."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · The fan on the ceiling (predict). Can two well-chosen buttons reach the
//     fan? Guess, then fly the drone on four remotes: the floor pair (it
//     skims the floor under the fan), a slanted pair (a tilted plank, still
//     short), floor + up (the fan), and a fourth button (nothing new). Each
//     pick paints its span in the room and the drone glides to the closest
//     spot it can get to.

const E1: V3 = [1, 0, 0];
const E2: V3 = [0, 1, 0];
const UP: V3 = [0, 0, 1];
type Key3 = { name: string; v: V3; tone: Tone };
const FAN_SETS: { pill: string; keys: Key3[]; say: string }[] = [
  {
    pill: "Floor two",
    keys: [
      { name: "east", v: E1, tone: "blue" },
      { name: "north", v: E2, tone: "coral" },
    ],
    say: "Only the floor. The drone stops right under the fan.",
  },
  {
    pill: "Slanted two",
    keys: [
      { name: "slant", v: [1, 0, 1], tone: "blue" },
      { name: "north", v: E2, tone: "coral" },
    ],
    say: "A tilted plank. The closest spot on it is still below the fan.",
  },
  {
    pill: "Add up",
    keys: [
      { name: "east", v: E1, tone: "blue" },
      { name: "north", v: E2, tone: "coral" },
      { name: "up", v: UP, tone: "teal" },
    ],
    say: "The whole room. 2 east, 2 north, 3 up: the fan.",
  },
  {
    pill: "A fourth",
    keys: [
      { name: "east", v: E1, tone: "blue" },
      { name: "north", v: E2, tone: "coral" },
      { name: "up", v: UP, tone: "teal" },
      { name: "(1, 1, 1)", v: [1, 1, 1], tone: "violet" },
    ],
    say: "Still the whole room. (1, 1, 1) is east + north + up: extra.",
  },
];
const FAN_GUESS = ["Yes, if they're slanted well", "No, two can never do it"];
const FAN_RIGHT = 1;
const RV = roomView(30);

function Room({ v, keys, flyTo, className = "max-w-[13.5rem]", label, children }: { v: View; keys: Key3[] | null; flyTo: number[]; className?: string; label: string; children?: ReactNode }) {
  const vs = keys ? keys.map((k) => k.v) : [];
  const shape = span3(vs);
  const at = flyTo as V3;
  return (
    <svg viewBox={`0 0 ${v.W} ${v.H}`} className={`mx-auto block h-auto w-full ${className}`} role="img" aria-label={label}>
      <RoomBox v={v} dusty />
      {keys && <SpanPaint key={keys.map((k) => k.name).join()} v={v} s={shape} className={FADE} />}
      {keys?.map((k) => (
        <Arrow3 key={k.name} v={v} to={k.v} tone={k.tone} />
      ))}
      {children}
      <MvDrone at={v.p(at)} />
    </svg>
  );
}

export function FanOnCeiling() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [flown, setFlown] = useSeed<number[]>("flown", []);
  const set = pick !== null ? FAN_SETS[pick] : null;
  const vs = set ? set.keys.map((k) => k.v) : [];
  const target = set ? clampBox(nearest3(FAN, vs)) : O3;
  const now = useTween(target, 1100);
  const landed = Math.hypot(now[0] - target[0], now[1] - target[1], now[2] - target[2]) < 0.03;
  const reached = set !== null && reaches3(FAN, vs);
  const over = flown.includes(0) && flown.includes(1);
  const done = flown.length === FAN_SETS.length;

  const fly = (i: number) => {
    setPick(i);
    if (flown.includes(i)) return;
    const next = [...flown, i];
    setFlown(next);
    if (next.length === FAN_SETS.length) pass("The room takes three. Two paint a sheet.");
  };

  return (
    <>
      <Room v={RV} keys={set ? set.keys : null} flyTo={now} label={set ? `${set.pill}: ${set.say}` : "the room, the fan in the middle of the ceiling, the drone at the door"}>
        {set && landed && !reached && <Gap v={RV} from={target} />}
      </Room>
      {guess !== null && (
        <>
          <div className="mt-1 flex flex-wrap justify-center gap-1.5">
            {FAN_SETS.map((st, i) => (
              <button key={st.pill} type="button" onClick={() => fly(i)} className={`${pill(pick === i)} font-sans! px-2.5! text-[0.8rem]!`}>
                {st.pill}
                {flown.includes(i) ? " ✓" : ""}
              </button>
            ))}
          </div>
          <div className="mt-1.5 min-h-[2.6rem] text-center text-[0.9rem]">
            {set ? (
              <>
                <div className="font-mono text-[0.8rem]">
                  {set.keys.map((k, i) => (
                    <span key={k.name} className={TEXT[k.tone]}>
                      {i > 0 && <span className="text-muted"> · </span>}
                      {tup(k.v)}
                    </span>
                  ))}
                </div>
                {landed && (
                  <div key={pick} className={`${FADE} ${reached ? "text-accent-text" : "text-danger"}`}>
                    {set.say}
                  </div>
                )}
              </>
            ) : (
              <span className="text-muted">Pick a remote. The drone flies as close to the fan as its buttons allow.</span>
            )}
          </div>
        </>
      )}
      <div className="mt-2 text-sm font-medium text-muted">Can two well-chosen buttons reach anywhere in the room?</div>
      <div className="mt-1.5 grid gap-1.5">
        {FAN_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, FAN_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={done}>{guess === null ? "Take a guess first." : "Fly the drone on all four remotes. Can it get to the fan?"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the floor sheet, then
//      the up arrow lifting it: copies of the sheet at every height, until
//      the room is full.

const XV = roomView(24);
const X5_SAY = [
  "East and north: two buttons.",
  "Together they paint one flat sheet, the floor.",
  "Now add up, a third direction.",
  "Each press of up lifts the whole sheet one step.",
  "Sheet on sheet, the room fills. Floor: 2. Room: 3.",
];

export function SheetLift() {
  const s = useScene(4, [600, 1500, 1500, 1800, 1800]);
  const k = s.k;
  const floor = span3([E1, E2]);
  const lift = (z: number): Span3 => ({ kind: "sheet", pts: floor.pts.map((p) => [p[0], p[1], z] as V3) });

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5_SAY[k]}</span>}>
      <svg viewBox={`0 0 ${XV.W} ${XV.H}`} className="mx-auto block h-auto w-full max-w-[13rem]" role="img" aria-label="the floor sheet painted by east and north, lifted by the up button until it fills the room">
        <RoomBox v={XV} fan={false} />
        {k >= 1 && <SpanPaint v={XV} s={floor} className={FADE} />}
        {k >= 3 && [1, 2, 3].map((z) => <SpanPaint key={z} v={XV} s={lift(z)} className={`${FADE} opacity-70`} />)}
        {k >= 4 && <SpanPaint v={XV} s={{ kind: "room", pts: [] }} className={FADE} />}
        <Arrow3 v={XV} to={E1} tone="blue" />
        <Arrow3 v={XV} to={E2} tone="coral" />
        {k >= 2 && <Arrow3 v={XV} to={UP} tone="teal" />}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: back at the toy shop.
//      Seven buttons on the counter; Abbu wants one remote for both, as cheap
//      as can be; the shopkeeper says take all seven.

const S6_G = 150;

export function AbbuOrders({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 2000]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S6_G} label="the toy shop: seven buttons on the counter; Abbu wants one remote for the floor and the fan, as cheap as can be; the shopkeeper says take all seven">
        <CastPerson who="karim" x={84} y={S6_G} scale={0.8} mood={k === 2 ? "smug" : "plain"} arm={k === 2 ? "point" : "down"} />
        <Stall x={84} y={S6_G} sign="Toys" color="#0d9488" w={96} />
        <MvTag x={84} y={S6_G + 12} name="shopkeeper" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={42 + i * 12} y={S6_G - 30} width={9} height={6} rx={1.5} fill={["#2563eb", "#e0664f", "#0d9488", "#d97706", "#64748b", "#7c3aed", "#e11d48"][i]} />
        ))}
        {k === 2 && <Bubble x={84} y={S6_G - 74} side="right" lines={["Take all seven.", "Safer!"]} />}
        <CastPerson who="mama" x={k >= 1 ? 186 : 340} y={S6_G + 16} facing={-1} walking={k === 1} mood="plain" />
        {k >= 1 && <MvTag x={186} y={S6_G + 26} name="Abbu" />}
        {k === 1 && <Bubble x={186} y={S6_G - 52} side="mid" lines={["One remote for both.", "As cheap as you can."]} />}
        <CastPerson who="fahim" x={250} y={S6_G + 16} facing={-1} arm={k >= 3 ? "hold" : "down"} mood={k >= 3 ? "puzzled" : "plain"} />
        <MvTag x={250} y={S6_G + 26} name="Fahim" />
        {k >= 3 && <CastCard x={262} y={S6_G - 64} text="50 taka each" tone="amber" />}
        <Robot x={292} y={S6_G + 16} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn: the shop's order. Seven buttons on the shelf, traps among
//     them: a copy, (2, 0, 0); a sum that never leaves the floor, (1, 1, 0);
//     the zero button; a sum of two others, (1, 2, 1). The reader fills a
//     cart and tests it: the paint shows the span in the room and the drone
//     flies as close to the fan as it can. Only three buttons pushing three
//     different ways pass; an overfull cart works but is told which button
//     is extra and what it costs. Wrong carts bounce.

const SHELF7: Key3[] = [
  { name: "(1, 0, 0)", v: [1, 0, 0], tone: "blue" },
  { name: "(0, 1, 0)", v: [0, 1, 0], tone: "coral" },
  { name: "(2, 0, 0)", v: [2, 0, 0], tone: "teal" },
  { name: "(1, 1, 0)", v: [1, 1, 0], tone: "amber" },
  { name: "(0, 0, 0)", v: [0, 0, 0], tone: "ink" },
  { name: "(0, 1, 1)", v: [0, 1, 1], tone: "violet" },
  { name: "(1, 2, 1)", v: [1, 2, 1], tone: "danger" },
];
/** traps first: the button to call extra, when one can go */
const EXTRA_ORDER = [4, 2, 3, 6, 0, 1, 5];
const extraIn = (cart: number[]) => {
  const all = rank3(cart.map((i) => SHELF7[i].v));
  return EXTRA_ORDER.find((i) => cart.includes(i) && rank3(cart.filter((j) => j !== i).map((j) => SHELF7[j].v)) === all);
};
const WHY7: Record<number, string> = {
  4: "(0, 0, 0) doesn't move anything.",
  2: "(2, 0, 0) is (1, 0, 0) twice.",
  3: "(1, 1, 0) is (1, 0, 0) plus (0, 1, 0).",
  6: "(1, 2, 1) is (1, 1, 0) plus (0, 1, 1).",
};
const RV6 = roomView(26);

function orderVerdict(cart: number[]) {
  const vs = cart.map((i) => SHELF7[i].v);
  const r = rank3(vs);
  const ex = extraIn(cart);
  const why = ex !== undefined ? (WHY7[ex] ?? `${SHELF7[ex].name} can be built from the others.`) : "";
  if (r === 3 && cart.length === 3) return { ok: true, say: "Three buttons, three directions: the whole room. 150 taka." };
  if (r === 3) return { ok: false, say: `It reaches the fan, but costs ${cart.length * 50} taka. ${why} Drop it.` };
  const floorOnly = vs.every((v) => v[2] === 0);
  const shape = r === 2 ? "a sheet" : r === 1 ? "a line" : "nothing";
  const head = floorOnly && r === 2 ? "The drone never leaves the floor." : `Only ${shape}. The fan is out of reach.`;
  return { ok: false, say: `${head}${why ? ` ${why}` : ""}` };
}

export function ShopOrder() {
  const pass = useGate();
  const [cart, setCart] = useSeed<number[]>("cart", []);
  const [tested, setTested] = useSeed<number[] | null>("tested", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const [won, setWon] = useSeed("won", false);
  const tk = tested ? tested.map((i) => SHELF7[i]) : null;
  const vs = tk ? tk.map((k) => k.v) : [];
  const target = tk ? clampBox(nearest3(FAN, vs)) : O3;
  const now = useTween(target, 1100);
  const landed = Math.hypot(now[0] - target[0], now[1] - target[1], now[2] - target[2]) < 0.03;
  const verdict = tested ? orderVerdict(tested) : null;
  const fresh = tested !== null && tested.join() === [...cart].sort().join();

  const toggle = (i: number) => {
    if (won) return;
    setCart(cart.includes(i) ? cart.filter((j) => j !== i) : [...cart, i]);
  };
  const test = () => {
    if (won || cart.length === 0) return;
    const c = [...cart].sort();
    setTested(c);
    const v = orderVerdict(c);
    if (v.ok) {
      setWon(true);
      pass("Three buttons, 150 taka. Not one more.");
    } else setMiss(miss + 1);
  };

  return (
    <>
      <Room v={RV6} keys={tk} flyTo={now} className="max-w-[14rem]" label={verdict ? verdict.say : "the room, the fan, the drone at the door"}>
        {tk && landed && !reaches3(FAN, vs) && <Gap v={RV6} from={target} />}
      </Room>
      <div className="mt-1.5 grid grid-cols-4 gap-1.5">
        {SHELF7.map((b, i) => (
          <button
            key={b.name}
            type="button"
            disabled={won}
            onClick={() => toggle(i)}
            className={`cursor-pointer rounded-lg border-2 px-0.5 py-1 font-mono text-[0.78rem] font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${
              cart.includes(i) ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"
            } ${TEXT[b.tone]}`}
          >
            {b.name}
          </button>
        ))}
        <button type="button" onClick={test} disabled={won || cart.length === 0 || fresh} className={`${primaryBtn} h-auto! justify-center px-1! text-[0.8rem]`}>
          Test it
        </button>
      </div>
      <div className="mt-1.5 text-center text-sm">
        Cart: {cart.length} button{cart.length === 1 ? "" : "s"}, <b>{cart.length * 50} taka</b>
      </div>
      {verdict && landed && fresh && verdict.ok && <div className={`${FADE} mt-1 text-center text-[0.95rem] text-accent-text`}>{verdict.say}</div>}
      {verdict && landed && fresh && !verdict.ok && <Nope key={miss}>{verdict.say}</Nope>}
      <Task done={won}>Build the cheapest remote that takes the drone to the fan and Shiku anywhere on the floor.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the cart of three. Two
//      floor buttons paint the floor, (0, 1, 1) fills the room, and the
//      shopkeeper's "the more, the safer" gets its line through it.

const X6_SAY = [
  "The cart: (1, 0, 0), (0, 1, 0) and (0, 1, 1).",
  "The first two paint the floor.",
  "(0, 1, 1) pushes a new way, up and in. The room fills.",
  "3 × 50 = 150 taka. A fourth button would only add a copy.",
];

export function CartOfThree() {
  const s = useScene(3, [600, 1500, 1800, 2200]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6_SAY[k]}</span>}>
      <div className="flex items-center justify-center gap-2">
        <svg viewBox={`0 0 ${XV.W} ${XV.H}`} className="block h-auto w-full max-w-[11rem]" role="img" aria-label="three buttons painting the floor, then the whole room">
          <RoomBox v={XV} fan={false} />
          {k === 1 && <SpanPaint v={XV} s={span3([E1, E2])} className={FADE} />}
          {k >= 2 && <SpanPaint v={XV} s={{ kind: "room", pts: [] }} className={FADE} />}
          <Arrow3 v={XV} to={E1} tone="blue" />
          <Arrow3 v={XV} to={E2} tone="coral" />
          {k >= 2 && <Arrow3 v={XV} to={[0, 1, 1]} tone="violet" />}
        </svg>
        <div className="w-[7.5rem] text-center">
          <svg viewBox="0 0 40 50" className="mx-auto h-12 w-auto" aria-hidden="true">
            <MvRemote x={20} y={4} n={3} s={1.2} />
          </svg>
          {k >= 3 && <div className={`${POP} font-mono text-sm font-bold`}>150 taka</div>}
          <div className={`mt-1 text-xs ${k >= 3 ? "text-danger line-through" : "text-muted"}`}>&ldquo;The more, the safer.&rdquo;</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it. Round 1: two long buttons for the drone, (4, 0, 2) and
//     (0, 4, 1). Pick the picture of what they paint: the whole room, a
//     tilted sheet, or a line. The pick is painted in the room and the drone
//     flies to the fan's closest spot: a wrong "room" is left with the fan
//     unreached; a wrong "line" watches the drone land off the line. Round 2:
//     four buttons; tap the one that can go without losing the room. A wrong
//     tap collapses the paint to a sheet.

const LONG: Key3[] = [
  { name: "u", v: [4, 0, 2], tone: "blue" },
  { name: "v", v: [0, 4, 1], tone: "coral" },
];
const LONG_VS = LONG.map((k) => k.v);
type Pic = "room" | "sheet" | "line";
const T_PICS: { kind: Pic; label: string }[] = [
  { kind: "room", label: "The whole room" },
  { kind: "sheet", label: "A tilted sheet" },
  { kind: "line", label: "A line" },
];
const T_RIGHT = 1;
const FOUR: Key3[] = [
  { name: "(1, 0, 0)", v: [1, 0, 0], tone: "blue" },
  { name: "(0, 1, 0)", v: [0, 1, 0], tone: "coral" },
  { name: "(0, 0, 1)", v: [0, 0, 1], tone: "teal" },
  { name: "(3, 0, 0)", v: [3, 0, 0], tone: "violet" },
];
const MINI = roomView(9);
const RV7 = roomView(27);
/** what a picture's shape would be, drawn in the room */
const picShape = (p: Pic): Span3 => (p === "room" ? { kind: "room", pts: [] } : p === "sheet" ? span3(LONG_VS) : span3([add3(LONG_VS[0], LONG_VS[1])]));

export function TryTwoInRoom() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const [drop, setDrop] = useSeed<number | null>("drop", null);
  const [miss2, setMiss2] = useSeed("miss2", 0);
  const [round2, setRound2] = useSeed("round2", false);
  const won = round2 && drop !== null && rank3(FOUR.filter((_, i) => i !== drop).map((k) => k.v)) === 3;
  // round 1: the drone flies to the fan's closest spot (or, on a wrong "line", to u's tip, off that line)
  const target: V3 = round2 ? O3 : pick === null ? O3 : T_PICS[pick].kind === "line" ? LONG_VS[0] : clampBox(nearest3(FAN, LONG_VS));
  const now = useTween(target, 1000);
  const landed = Math.hypot(now[0] - target[0], now[1] - target[1], now[2] - target[2]) < 0.03;

  const choose = (i: number) => {
    if (round2 || pick === T_RIGHT) return;
    setPick(i);
    if (i !== T_RIGHT) setMiss(miss + 1);
  };
  const tapDrop = (i: number) => {
    if (won) return;
    setDrop(i);
    if (rank3(FOUR.filter((_, j) => j !== i).map((k) => k.v)) === 3) pass("Long adds no direction. Four is one extra.");
    else setMiss2(miss2 + 1);
  };
  const four = drop === null ? FOUR : FOUR.filter((_, i) => i !== drop);

  return (
    <>
      {!round2 ? (
        <>
          <svg viewBox={`0 0 ${RV7.W} ${RV7.H}`} className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="two long buttons in the room, (4, 0, 2) and (0, 4, 1)">
            <RoomBox v={RV7} />
            {pick !== null && <SpanPaint key={pick} v={RV7} s={picShape(T_PICS[pick].kind)} className={FADE} />}
            {LONG.map((k) => (
              <Arrow3 key={k.name} v={RV7} to={k.v} tone={k.tone} />
            ))}
            {pick !== null && landed && T_PICS[pick].kind !== "line" && <Gap v={RV7} from={target} />}
            <MvDrone at={RV7.p(now as V3)} />
          </svg>
          <div className="text-center text-sm text-muted">
            Nasib&apos;s long buttons: <span className="font-mono text-cat-blue">(4, 0, 2)</span> and <span className="font-mono text-cat-coral">(0, 4, 1)</span>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {T_PICS.map((p, i) => (
              <button
                key={p.kind}
                type="button"
                disabled={pick === T_RIGHT}
                onClick={() => choose(i)}
                className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-1 text-xs font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[pick === i ? (i === T_RIGHT ? "right" : "wrong") : pick === T_RIGHT ? "dim" : "idle"]}`}
              >
                <svg viewBox={`0 0 ${MINI.W} ${MINI.H}`} className="h-auto w-full max-w-[4.5rem]" aria-hidden="true">
                  <RoomBox v={MINI} fan={false} door={false} />
                  <SpanPaint v={MINI} s={picShape(p.kind)} />
                </svg>
                {p.label}
              </button>
            ))}
          </div>
          {pick !== null && pick !== T_RIGHT && landed && (
            <Nope key={miss}>
              {T_PICS[pick].kind === "room"
                ? "Nope. The drone got as close as it could, and the fan is still out of reach."
                : "Nope. The drone just landed on u's tip, and that's off the line. Two directions paint more than a line."}
            </Nope>
          )}
          {pick === T_RIGHT && landed && (
            <div className={`${FADE} mt-2 flex items-center justify-center gap-3`}>
              <span className="text-[0.9rem] text-accent-text">One tilted sheet. The fan is off it.</span>
              <button type="button" onClick={() => setRound2(true)} className={`${primaryBtn} h-9! px-4! text-sm`}>
                Round 2
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <svg viewBox={`0 0 ${RV7.W} ${RV7.H}`} className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="four buttons in the room; drop one and see what is left">
            <RoomBox v={RV7} />
            <SpanPaint key={drop ?? -1} v={RV7} s={span3(four.map((k) => k.v))} className={FADE} />
            {FOUR.map((k, i) => (
              <Arrow3 key={k.name} v={RV7} to={k.v} tone={k.tone} faint={drop === i} />
            ))}
          </svg>
          <div className="text-center text-sm text-muted">Round 2: four buttons. Which one can go, and the room stays full?</div>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {FOUR.map((k, i) => (
              <button
                key={k.name}
                type="button"
                disabled={won}
                onClick={() => tapDrop(i)}
                className={`cursor-pointer rounded-lg border-2 px-0.5 py-1.5 font-mono text-[0.78rem] font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${
                  LOOK[drop === i ? (won ? "right" : "wrong") : "idle"]
                } ${drop === i ? "" : TEXT[k.tone]}`}
              >
                {k.name}
              </button>
            ))}
          </div>
          {drop !== null && !won && <Nope key={miss2}>Nope. Without it the room shrank to a sheet. Look for two buttons that push the same way.</Nope>}
          {won && <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>Still the whole room. That one only repeated another button.</div>}
        </>
      )}
      <Task done={won}>{round2 ? "Tap the button you can drop and keep the whole room." : "Pick the picture of what the two long buttons paint."}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for the Try-it's explanation, no task: short buttons paint a
//      tilted sheet; stretched long, they paint the very same sheet; the fan
//      stays off it.

const X7_SHORT: V3[] = [
  [2, 0, 1],
  [0, 2, 0.5],
];
const X7_SAY = [
  "Two short buttons: (2, 0, 1) and (0, 2, 0.5).",
  "They paint a tilted sheet.",
  "Stretch them twice as long.",
  "The very same sheet. And the fan is still off it.",
];

export function LongArrows() {
  const s = useScene(3, [600, 1500, 1500, 2000]);
  const k = s.k;
  const vs = k >= 2 ? LONG_VS : X7_SHORT;
  const near = clampBox(nearest3(FAN, LONG_VS));

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X7_SAY[k]}</span>}>
      <svg viewBox={`0 0 ${XV.W} ${XV.H}`} className="mx-auto block h-auto w-full max-w-[13rem]" role="img" aria-label="short buttons and long buttons paint the same tilted sheet; the fan is off it">
        <RoomBox v={XV} />
        {k >= 1 && <SpanPaint v={XV} s={span3(LONG_VS)} className={FADE} />}
        <Arrow3 v={XV} to={vs[0]} tone="blue" />
        <Arrow3 v={XV} to={vs[1]} tone="coral" />
        {k >= 3 && <Gap v={XV} from={near} />}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for the last step's setup, no task: evening. The drone
//      rises to the fan and the dust comes down; Fahim holds up the new
//      three-button remote; Som says it.

export function FanDusted({}: Story) {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S5_G} label="the drone rises to the fan and dusts it; Fahim holds the new three-button remote; Som says two for the floor, three for the room">
        <S5Fan dust={k < 2} />
        {k >= 2 && [-30, -8, 18, 34].map((dx, i) => <circle key={dx} cx={S5_FAN.x + dx} cy={60 + i * 14} r={1.6} fill="#78716c" className={FADE} />)}
        <g style={{ transform: `translate(0, ${k >= 1 ? -58 : 0}px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
          <MvDrone at={[S5_FAN.x, 104]} s={1.3} />
        </g>
        <CastPerson who="fahim" x={70} y={S5_G + 16} mood={k >= 2 ? "happy" : "plain"} arm="hold" />
        <MvTag x={70} y={S5_G + 26} name="Fahim" />
        <MvRemote x={94} y={S5_G - 30} n={3} s={0.8} />
        <Robot x={112} y={S5_G + 16} />
        <CastPerson who="som" x={250} y={S5_G + 16} facing={-1} mood={k >= 3 ? "happy" : "plain"} arm={k >= 3 ? "wave" : "down"} />
        <MvTag x={250} y={S5_G + 26} name="Som" />
        {k >= 3 && <Bubble x={250} y={S5_G - 52} side="left" lines={["Two for the floor.", "Three for the room."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · The bet settled. Tap each claim to open its verdict, with a small
//     picture of why: the shopkeeper's extra button crossed out, Nasib's one
//     line, Som's 2 and 3.

const VERDICTS: { who: string; claim: string; ok: boolean; why: string; pic: "extra" | "line" | "count" }[] = [
  { who: "The shopkeeper", claim: "The more buttons, the safer.", ok: false, why: "Past three, every button was extra. Same room, more taka.", pic: "extra" },
  { who: "Nasib", claim: "One button, aimed right, is enough.", ok: false, why: "One button paints one line, however you aim it.", pic: "line" },
  { who: "Som", claim: "The count is the same, whoever builds it.", ok: true, why: "Floor: always 2. Room: always 3.", pic: "count" },
];
const V8_F = makeFrame(-1, 3, -1, 2, 11, 4);

function VerdictPic({ pic }: { pic: "extra" | "line" | "count" }) {
  if (pic === "extra")
    return (
      <svg viewBox="0 0 34 46" className={`h-10 w-auto ${POP}`} aria-hidden="true">
        <MvRemote x={17} y={2} n={4} s={1.1} cross={3} />
      </svg>
    );
  if (pic === "line")
    return (
      <div className={`w-14 ${POP}`}>
        <Plane f={V8_F} grid={1} axes={false} label="one button, one line" className="my-0! max-w-none">
          <Reach f={V8_F} keys={[{ name: "n", v: [2, 1], tone: "coral" }]} on dots={false} />
          <Arrow f={V8_F} from={O} to={[2, 1]} tone="coral" w={1.8} />
        </Plane>
      </div>
    );
  return <div className={`${POP} font-mono text-lg font-bold text-accent-text`}>2 · 3</div>;
}

export function ThreeVerdicts() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const all = open.length === VERDICTS.length;

  const show = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === VERDICTS.length) pass("Floor 2, room 3, whoever builds it.");
  };

  return (
    <>
      <div className="mx-auto grid max-w-sm gap-1.5">
        {VERDICTS.map((r, i) => {
          const on = open.includes(i);
          return (
            <button
              key={r.who}
              type="button"
              onClick={() => show(i)}
              disabled={on}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-left transition-colors disabled:cursor-default motion-reduce:transition-none ${
                on ? (r.ok ? "border-accent bg-accent/10" : "border-danger/50 bg-danger/5") : "border-border hover:border-accent"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.95rem] font-semibold">{r.who}</span>
                  <span className={`text-sm ${on ? (r.ok ? "text-accent-text" : "text-danger") : "text-muted"}`}>{on ? (r.ok ? "✓ right" : "✕ wrong") : "Open"}</span>
                </div>
                <div className="text-xs text-muted">&ldquo;{r.claim}&rdquo;</div>
                {on && <div className={`${FADE} text-xs`}>{r.why}</div>}
              </div>
              {on && (
                <div className="grid w-14 shrink-0 place-items-center">
                  <VerdictPic pic={r.pic} />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {all && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-violet/5 px-4 py-2.5 text-center text-[0.95rem]`}>
          Som wins. Nothing extra, every spot reached: a basis. How many it takes is the dimension.
        </div>
      )}
      <Task done={all}>Open the three claims, one by one, and check them against your bet.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for the last step's explanation, no task: the floor with its
//      two buttons beside the room with its three, and the two counts.

const X8_F = makeFrame(-1, 3, -1, 3, 15, 6);
const X8_SAY = ["Two numbers to take home.", "The floor: two buttons, nothing extra. Dimension 2.", "The room: three buttons, nothing extra. Dimension 3."];

export function TwoAndThree() {
  const s = useScene(2, [600, 1700, 1900]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X8_SAY[k]}</span>}>
      <div className="flex items-end justify-center gap-3">
        <div className={`w-[6rem] transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-40"}`}>
          <Plane f={X8_F} grid={1} axes={false} label="the floor: two buttons" className="my-0! max-w-none">
            {k >= 1 && <Reach f={X8_F} keys={DROP_KEYS.slice(0, 2)} on dots={false} />}
            <Arrow f={X8_F} from={O} to={[1, 0]} tone="blue" w={2} />
            <Arrow f={X8_F} from={O} to={[0, 1]} tone="coral" w={2} />
            <circle cx={X8_F.sx(0)} cy={X8_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
          </Plane>
          <div className="text-center text-xs font-semibold">
            floor{k >= 1 && <span className={`${POP} ml-1 font-mono text-base text-accent-text`}>2</span>}
          </div>
        </div>
        <div className={`w-[8rem] transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "opacity-100" : "opacity-40"}`}>
          <svg viewBox={`0 0 ${XV.W} ${XV.H}`} className="block h-auto w-full" role="img" aria-label="the room: three buttons">
            <RoomBox v={XV} fan={false} />
            {k >= 2 && <SpanPaint v={XV} s={{ kind: "room", pts: [] }} className={FADE} />}
            <Arrow3 v={XV} to={E1} tone="blue" />
            <Arrow3 v={XV} to={E2} tone="coral" />
            <Arrow3 v={XV} to={UP} tone="teal" />
          </svg>
          <div className="text-center text-xs font-semibold">
            room{k >= 2 && <span className={`${POP} ml-1 font-mono text-base text-accent-text`}>3</span>}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  TruckDay: { start: { k: 0 }, shop: { k: 1 }, nasib: { k: 2 }, som: { k: 3 }, end: {} },
  FewestButtons: { start: {}, picked: { floor: 2, room: 6, som: 0 }, sealed: { floor: 1, room: 3, som: 1, sealed: true } },
  ThreeCards: { start: { k: 0 }, two: { k: 2 }, end: {} },
  DropOne: { start: {}, two: { kept: [true, true, false], saw2: true }, one: { kept: [true, false, false], saw2: true, saw1: true } },
  TwoJobs: { start: { k: 0 }, mid: { k: 2 }, end: {} },
  ShopShelf: { start: {}, wrong: { at: 1, filed: ["basis"], wrong: "basis", miss: 1 }, done: { at: 4, filed: ["basis", "extra", "misses", "basis", "extra"] } },
  TwoFails: { walk: { k: 2 }, end: {} },
  AnyPairTwo: {
    start: {},
    three: { tips: [[2, 1], [-1, 2], [1, -2]], tried3: true },
    basis: { tips: [[2, 1], [-1, 2]], kept: ["(−1, 2) (2, 1)"], tried3: true },
    done: { tips: [[1, 1], [1, -2]], kept: ["(−1, 2) (2, 1)", "(1, 0) (2, 3)", "(1, −2) (1, 1)"], tried3: true },
  },
  ThreeDesigners: { mid: { k: 1 }, end: {} },
  DroneUnderFan: { start: { k: 0 }, fahim: { k: 2 }, end: {} },
  FanOnCeiling: { start: {}, floor: { guess: 0, pick: 0, flown: [0] }, slant: { guess: 0, pick: 1, flown: [0, 1] }, up: { guess: 0, pick: 2, flown: [0, 1, 2] }, four: { guess: 0, pick: 3, flown: [0, 1, 2, 3] } },
  SheetLift: { floor: { k: 1 }, lift: { k: 3 }, end: {} },
  AbbuOrders: { abbu: { k: 1 }, shop: { k: 2 }, end: {} },
  ShopOrder: {
    start: {},
    cart: { cart: [0, 1] },
    floor: { cart: [0, 1, 3], tested: [0, 1, 3], miss: 1 },
    over: { cart: [0, 1, 4, 5], tested: [0, 1, 4, 5], miss: 1 },
    copy: { cart: [0, 2, 5], tested: [0, 2, 5], miss: 1 },
    won: { cart: [0, 1, 5], tested: [0, 1, 5], won: true },
  },
  CartOfThree: { floor: { k: 1 }, end: {} },
  TryTwoInRoom: { start: {}, room: { pick: 0, miss: 1 }, line: { pick: 2, miss: 1 }, right: { pick: 1 }, round2: { pick: 1, round2: true }, wrong2: { pick: 1, round2: true, drop: 2, miss2: 1 }, won: { pick: 1, round2: true, drop: 3 } },
  LongArrows: { short: { k: 1 }, end: {} },
  FanDusted: { start: { k: 0 }, up: { k: 2 }, end: {} },
  ThreeVerdicts: { start: {}, some: { open: [0] }, all: { open: [0, 1, 2] } },
  TwoAndThree: { floor: { k: 1 }, end: {} },
};
