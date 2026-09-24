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
  Speech,
  Ticks,
  predictLook,
  primaryBtn,
  quietBtn,
  usePlay,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
  type Look,
} from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person as CastPerson, Robot, Stage, Stall, StoryFrame } from "@/components/journey/cast";
import { Arrow, Lit, Plane, listOf, makeFrame, same, snap, tup, type Frame, type Tone, type XY } from "@/components/journey/plane";

// Screens for "Math for AI 5.3 — Basis and dimension, the fewest buttons",
// told as a Journey in the author's Bangla-English, 10 steps (the
// pathshala-journey skill).
//
// Moving day. The truck is at the gate, the robotics club has lent its drone
// to dust the new flat's ceiling fan, and the drone's remote is lost in some
// box. The toy shop builds remotes to order, 50 taka a button. Three claims:
// the shopkeeper's "the more buttons, the safer", Nasib's "one button, aimed
// right, is enough", and Som's "however you build it, the count comes out the
// same". The reader seals a bet on the fewest buttons for the floor and for
// the room (FewestButtons), then drops buttons off a three-button remote
// (DropOne: basis), files five ready-made remotes (ShopShelf: the two ways to
// fail), designs their own floor remotes (AnyPairTwo: dimension 2). Then the
// room: Nasib aims one button at the fan and Ammu points at the cobweb
// (OneAimed: one button, one line), two buttons aimed at any two of Ammu's
// dusty spots leave the others off a flat sheet (TwoAimed, predict), a third
// button fills the room whichever three you aim and a fourth is extra
// (ThirdButton: dimension 3), the reader buys the cheapest remote off a shelf
// of seven with traps (ShopOrder, Your turn), and answers a visual Try it on
// two long buttons and four buttons in the room (TryTwoInRoom). The finale
// opens the three claims (ThreeVerdicts): Som wins.
//
// The floor machine (Reach, Marks, Door) is a local copy of 5.1's
// (remote-journey.tsx), so the remote looks the same. The room is drawn here:
// an oblique view of a 4 × 4 × 3 room with the door corner at (0, 0, 0), the
// fan at (2, 2, 3) and Ammu's dusty spots, and a span painted in it as a
// line, a sheet (the plane clipped to the room) or the whole room.
//
// Watch-only figures, one in every <Then>: the three claims with a "?"
// (ThreeCards), the two jobs of a basis (TwoJobs), the two ways to fail
// (TwoFails), three designers' pairs (ThreeDesigners), one button's line on
// the floor and in the room (OneLine), three tilts of a sheet (SheetTilts),
// the floor sheet lifted into the room (SheetLift), the cart of three
// (CartOfThree), long arrows on the same sheet (LongArrows), and floor 2
// beside room 3 (TwoAndThree). Story scenes: the truck and the claims
// (TruckDay), the drone that won't go up (DroneUnderFan), Ammu's dusty spots
// (AmmuSpots), Abbu at the toy shop (AbbuOrders), the fan dusted (FanDusted).
// Names under feet are drawn here (MvTag), since the shopkeeper and Abbu
// aren't in the cast.
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
// The floor machine, copied from 5.1 (remote-journey.tsx) so this journey
// stands on its own: the door corner, Ammu's chalk marks, and the paint that
// shades everywhere a floor remote can reach.

/** One button on a remote: the name on the key, the step it takes, its colour. */
type Key = { name: string; v: XY; tone: Tone };

const MARKS: { name: string; at: XY }[] = [
  { name: "আলমারি", at: [3, 5] },
  { name: "খাট", at: [1, 3] },
  { name: "টেবিল", at: [2, 2] },
  { name: "জুতার তাক", at: [1, 0] },
];

/** The door corner of the flat: the (0, 0) every remote starts from. */
function Door({ f }: { f: Frame }) {
  return (
    <g className="pointer-events-none">
      <circle cx={f.sx(0)} cy={f.sy(0)} r={3.6} className="fill-[#0f1b2d]" />
      <text x={f.sx(0) - 6} y={f.sy(0) + 13} textAnchor="end" fontSize={8.5} fontWeight={700} className="fill-[#5a6b7d]">
        দরজা
      </text>
    </g>
  );
}

/** Ammu's chalk marks on the tiles; the names in `hit` are ticked. */
function Marks({ f, hit = [] }: { f: Frame; hit?: string[] }) {
  return (
    <>
      {MARKS.map((m) => {
        const x = f.sx(m.at[0]);
        const y = f.sy(m.at[1]);
        const on = hit.includes(m.name);
        return (
          <g key={m.name} className="pointer-events-none">
            <rect x={x - 9} y={y - 9} width={18} height={18} rx={3} strokeDasharray="3 2.5" strokeWidth={1.6} className={on ? "fill-accent/25 stroke-accent" : "fill-none stroke-[#94a3b8]"} />
            <text x={x} y={y - 13} textAnchor="middle" fontSize={8} fontWeight={700} className={on ? "fill-accent" : "fill-[#5a6b7d]"}>
              {m.name}
            </text>
          </g>
        );
      })}
    </>
  );
}

const det = (a: XY, b: XY) => a[0] * b[1] - a[1] * b[0];
/** two buttons that push different ways: everything on the floor is in reach */
const isPlane = (keys: Key[]) => keys.some((a, i) => keys.slice(i + 1).some((b) => det(a.v, b.v) !== 0));

/** Everywhere a floor remote can reach, shaded: the whole floor, or one line through the door. */
function Reach({ f, keys }: { f: Frame; keys: Key[] }) {
  const d = keys.map((k) => k.v).find((v) => v[0] || v[1]) ?? [1, 0];
  let lo = -1e6;
  let hi = 1e6;
  const cut = (dv: number, a: number, b: number) => {
    if (Math.abs(dv) < 1e-9) return;
    lo = Math.max(lo, Math.min(a / dv, b / dv));
    hi = Math.min(hi, Math.max(a / dv, b / dv));
  };
  cut(d[0], f.x0, f.x1);
  cut(d[1], f.y0, f.y1);
  return (
    <g className={`${FADE} pointer-events-none`}>
      {isPlane(keys) ? (
        <rect x={f.pad} y={f.pad} width={f.W - 2 * f.pad} height={f.H - 2 * f.pad} className="fill-cat-violet/20" />
      ) : (
        <line x1={f.sx(lo * d[0])} y1={f.sy(lo * d[1])} x2={f.sx(hi * d[0])} y2={f.sy(hi * d[1])} strokeWidth={14} className="stroke-cat-violet/30" />
      )}
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
            ফ্যান
          </text>
        </g>
      )}
      <circle cx={v.p(O3)[0]} cy={v.p(O3)[1]} r={3.2} fill="#0f1b2d" />
      {door && (
        <text x={v.p(O3)[0] - 5} y={v.p(O3)[1] + 12} textAnchor="middle" fontSize={8} fontWeight={700} fill="#5a6b7d">
          দরজা
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
    <Lit a={[x1, y1]} b={[x2, y2]} list={listOf(from, to)} w={w} stroke={stroke}>
      <g opacity={faint ? 0.3 : 1} className="pointer-events-none">
        <path d={`M${x1} ${y1}L${bx + ux * 0.5} ${by + uy * 0.5}`} strokeWidth={w} strokeLinecap="round" className={`fill-none ${stroke}`} />
        <path d={`M${x2} ${y2}L${bx - uy * half} ${by + ux * half}L${bx + uy * half} ${by - ux * half}Z`} className={fill} />
      </g>
    </Lit>
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

/** A dashed gap from where the drone got to up to a spot it can't reach (the fan by default). */
function Gap({ v, from, to = FAN }: { v: View; from: V3; to?: V3 }) {
  const [x1, y1] = v.p(from);
  const [x2, y2] = v.p(to);
  if (Math.hypot(x2 - x1, y2 - y1) < 2) return null;
  return <path d={`M${x1} ${y1}L${x2} ${y2}`} strokeDasharray="4 3" strokeWidth={1.8} className={`pointer-events-none fill-none stroke-danger ${FADE}`} />;
}

// ---------------------------------------------------------------------------
// Ammu's dusty spots in the room, and the aiming room used by screens 5–7: tap
// a spot and a button is aimed at it (the button's step is the spot itself,
// from the door corner). The buttons' paint fills in, the drone glides to the
// newest spot, and every spot the paint misses gets a red gap from the
// closest place the drone can get to. No three of these spots lie on one
// sheet through the door, so any two buttons miss two spots and any three
// reach all four.

type Spot = { name: string; at: V3; dx: number; dy: number; end?: boolean };
const SPOTS: Spot[] = [
  { name: "ফ্যান", at: FAN, dx: 0, dy: -9 },
  { name: "ঝুল", at: [4, 4, 3], dx: -8, dy: 3, end: true },
  { name: "আলমারি", at: [0, 4, 2], dx: -6, dy: 3, end: true },
  { name: "ঘড়ি", at: [3, 4, 1], dx: 7, dy: 3 },
];

/** A dusty spot: a small ring with its name, green once the paint reaches it. */
function SpotMark({ v, s, on }: { v: View; s: Spot; on: boolean }) {
  const [x, y] = v.p(s.at);
  return (
    <g className="pointer-events-none">
      {s.name === "আলমারি" && <rect x={x - 3} y={y} width={v.u * 0.7} height={v.u * 2} fill="#a16207" opacity={0.55} />}
      {s.name === "ঘড়ি" && <circle cx={x} cy={y} r={v.u * 0.22} fill="white" stroke="#475569" strokeWidth={1.2} />}
      {s.name === "ঝুল" && <path d={`M${x} ${y}l-7 0M${x} ${y}l0 7M${x} ${y}l-5 5M${x - 3.5} ${y}q1 2.5 0 3.5M${x - 5.5} ${y}q2 4 0 5.5`} stroke="#57534e" strokeWidth={0.8} fill="none" />}
      <circle cx={x} cy={y} r={4.2} strokeWidth={1.6} className={on ? "fill-accent stroke-accent" : "fill-amber-200 stroke-amber-700"} />
      {s.name !== "ফ্যান" && (
        <text x={x + s.dx} y={y + s.dy} textAnchor={s.end ? "end" : s.dx > 0 ? "start" : "middle"} fontSize={8} fontWeight={700} fill="#334155" stroke="white" strokeWidth={2.2} paintOrder="stroke">
          {s.name}
        </text>
      )}
    </g>
  );
}

const AIM_TONES: Tone[] = ["blue", "coral", "teal", "violet"];
const RVA = roomView(28);

/**
 * The room with buttons aimed at spots. `aimed` are spot indices in the order
 * they were aimed; `shown` limits which spots are on the wall yet.
 */
function AimRoom({ aimed, shown = SPOTS.length, label, className = "max-w-[14rem]" }: { aimed: number[]; shown?: number; label: string; className?: string }) {
  const vs = aimed.map((i) => SPOTS[i].at);
  const shape = span3(vs);
  const last = aimed.length ? SPOTS[aimed[aimed.length - 1]].at : O3;
  const now = useTween(last, 900) as V3;
  const landed = len3(sub3(now, last)) < 0.03;
  return (
    <svg viewBox={`0 0 ${RVA.W} ${RVA.H}`} className={`mx-auto block h-auto w-full ${className}`} role="img" aria-label={label}>
      <RoomBox v={RVA} dusty={!aimed.includes(0)} />
      {aimed.length > 0 && <SpanPaint key={aimed.slice().sort().join()} v={RVA} s={shape} className={FADE} />}
      {aimed.map((i, j) => (
        <Arrow3 key={i} v={RVA} to={SPOTS[i].at} tone={AIM_TONES[j]} />
      ))}
      {SPOTS.slice(0, shown).map((sp) => (
        <SpotMark key={sp.name} v={RVA} s={sp} on={aimed.length > 0 && reaches3(sp.at, vs)} />
      ))}
      {landed && aimed.length > 0 && SPOTS.slice(0, shown).map((sp) => (reaches3(sp.at, vs) ? null : <Gap key={sp.name} v={RVA} from={clampBox(nearest3(sp.at, vs))} to={sp.at} />))}
      <MvDrone at={RVA.p(now)} />
    </svg>
  );
}

/** The spot buttons under the aiming room: tap to aim a button at a spot, tap again to take it off. */
function AimChips({ aimed, shown = SPOTS.length, onTap, disabled = false }: { aimed: number[]; shown?: number; onTap: (i: number) => void; disabled?: boolean }) {
  return (
    <div className={`mt-1 grid gap-1.5 ${shown > 2 ? "grid-cols-4" : "mx-auto max-w-[14rem] grid-cols-2"}`}>
      {SPOTS.slice(0, shown).map((sp, i) => {
        const j = aimed.indexOf(i);
        return (
          <button
            key={sp.name}
            type="button"
            disabled={disabled}
            onClick={() => onTap(i)}
            className={`cursor-pointer rounded-lg border-2 px-0.5 py-1 text-center text-[0.8rem] font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${
              j >= 0 ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"
            }`}
          >
            <div className={j >= 0 ? TEXT[AIM_TONES[j]] : ""}>{sp.name}</div>
            <div className="font-mono text-[0.7rem] text-muted">{tup(sp.at)}</div>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: moving day. The truck at
//      the gate, the driver in a hurry; the shopkeeper, Nasib and Som each
//      make a claim; the drone hovers in, remote-less. No count is shown:
//      that is the bet.

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
      <Stage backdrop="street" label="moving day: the truck at the gate, the driver in a hurry; the shopkeeper says the more buttons the safer, Nasib says one button aimed right is enough, Som says the count comes out the same; the drone hovers in without a remote">
        <MvTruck x={2} />
        <CastPerson who="karim" x={136} y={S1_G} scale={0.8} mood={k === 1 ? "smug" : "plain"} arm={k === 1 ? "point" : "down"} />
        <Stall x={136} y={S1_G} sign="button 50 টাকা" color="#0d9488" w={78} />
        <MvTag x={136} y={S1_G + 12} name="দোকানদার" />
        {k === 0 && <Bubble x={72} y={S1_G - 34} side="right" lines={["আধা ঘণ্টার মইধ্যে", "মাল নামান, ভাই."]} />}
        {k === 1 && <Bubble x={136} y={S1_G - 70} side="mid" lines={["button যত বেশি,", "ঝামেলা তত কম."]} />}
        <CastPerson who="nasib" x={k >= 2 ? 214 : 360} y={S1_G} facing={-1} walking={k === 2} mood="smug" arm={k === 2 ? "point" : "down"} />
        {k >= 2 && <MvTag x={214} y={S1_G + 12} name="নাসিব" />}
        {k === 2 && <Bubble x={214} y={S1_G - 66} side="mid" lines={["ঠিক দিকে তাক করা", "একটা button ই যথেষ্ট."]} />}
        <CastPerson who="som" x={k >= 3 ? 276 : 380} y={S1_G} facing={-1} walking={k === 3} mood={k === 3 ? "happy" : "plain"} />
        {k >= 3 && <MvTag x={276} y={S1_G + 12} name="সোম" />}
        {k === 3 && <Bubble x={276} y={S1_G - 66} side="left" lines={["যেভাবেই বানাও,", "সংখ্যা একই থাকবে."]} />}
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
const SOM_OPT = ["সবার জন্য একই", "কে বানায় তার উপর"];

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
            {n === 6 ? "যত বেশি তত ভালো" : `${n} টা button`}
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
    pass("বাজি ধরা হলো. এবার button খোলা শুরু.");
  };

  return (
    <>
      <div className="text-sm font-medium">Shiku কে floor এর যেকোনো জায়গায় নিতে সবচেয়ে কম কয়টা button?</div>
      <div className="mt-1.5">
        <CountPick opts={FLOOR_OPT} pick={floor} sealed={sealed} onPick={setFloor} />
      </div>
      <div className="mt-3 text-sm font-medium">Drone কে ঘরের যেকোনো জায়গায়, ফ্যান সহ, সবচেয়ে কম কয়টা?</div>
      <div className="mt-1.5">
        <CountPick opts={ROOM_OPT} pick={room} sealed={sealed} onPick={setRoom} />
      </div>
      <div className="mt-3 text-sm font-medium">সোম বলছে, যে-ই বানাক, সবচেয়ে কম সংখ্যাটা একই. তাই কি?</div>
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
            বাজি ধরুন
          </button>
        </div>
      ) : (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>বাজি ধরা হয়ে গেলো. দিনের শেষে খুলে দেখবো.</div>
      )}
      <Task done={sealed}>তিনটা প্রশ্নেরই উত্তর বেছে নিন, তারপর বাজি ধরুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the three claims side by
//      side, each with its remote, and a "?" stamped on every one.

const X1_SAY = [
  "তিনজন মানুষ, একটা remote নিয়ে তিন রকম কথা.",
  "দোকানদার: button যত বেশি, তত নিরাপদ.",
  "নাসিব: ঠিক দিকে তাক করলে একটা button ই যথেষ্ট.",
  "সোম: যেভাবেই বানান, গুনলে সংখ্যা একই আসবে.",
  "তিনজন একসাথে ঠিক হতে পারে না. কে ঠিক? আজকের প্রশ্ন এটাই.",
];
const X1_CLAIMS: { who: string; lines: string[]; n: number }[] = [
  { who: "দোকানদার", lines: ["যত বেশি,", "তত নিরাপদ."], n: 6 },
  { who: "নাসিব", lines: ["একটা button,", "ঠিক দিকে."], n: 1 },
  { who: "সোম", lines: ["সংখ্যা একই,", "যে-ই বানাক."], n: 2 },
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
// 1¾ · A figure for screen 1's explanation, no task: why every button is
//      counted. Each key carries its 50 taka. One too many, and that 50 taka
//      drops into the water; one too few, and some spot stays out of reach.
//      No count is shown as the right one: that is the bet.

const X1B_SAY = [
  "প্রতিটা button 50 টাকা.",
  "একটা button বেশি হলে, দাম 50 টাকা বেশি.",
  "ওই 50 টাকা পানিতে গেলো.",
  "আর একটা button কম হলে?",
  "কোনো একটা জায়গা নাগালের বাইরে থেকে যায়.",
];
const X1B_KEY = ["#2563eb", "#e0664f", "#0d9488"];

/** A remote drawn for this figure: `n` keys in one column, each with its price; `ghost` keys are gone. */
function X1bRemote({ x, y, n, extra = false, ghost = -1, tags = true }: { x: number; y: number; n: number; extra?: boolean; ghost?: number; tags?: boolean }) {
  const all = n + (extra ? 1 : 0);
  return (
    <g>
      <rect x={x - 11} y={y} width={22} height={8 + all * 12} rx={5} fill="#334155" stroke="#0f172a" />
      {Array.from({ length: all }, (_, i) => {
        const ky = y + 5 + i * 12;
        const isExtra = extra && i === n;
        const gone = i === ghost;
        return (
          <g key={i} className={isExtra ? POP : gone ? FADE : ""}>
            {gone ? (
              <rect x={x - 6} y={ky} width={12} height={7} rx={2} fill="none" stroke="#94a3b8" strokeDasharray="2 1.5" />
            ) : (
              <rect x={x - 6} y={ky} width={12} height={7} rx={2} fill={isExtra ? "#e11d48" : X1B_KEY[i % 3]} />
            )}
            {tags && !gone && (
              <text x={x + 16} y={ky + 6.5} fontSize={8} fontWeight={700} fontFamily="ui-monospace, monospace" fill={isExtra ? "#be123c" : "#475569"}>
                {isExtra ? "+50" : "50"}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

export function FiftyEach() {
  const s = useScene(4, [600, 1600, 1600, 1400, 2200]);
  const k = s.k;
  // the extra key's coin: at its tag until beat 2, then in the water
  const coin = k >= 2 ? { x: 104, y: 98 } : { x: 60, y: 69 };

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1B_SAY[k]}</span>}>
      <svg viewBox="0 0 300 116" className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label="every button costs 50 taka; one too many and its 50 taka is thrown away, one too few and a spot is out of reach">
        <rect x={3} y={3} width={144} height={110} rx={8} fill="white" stroke="#cbd5e1" />
        <rect x={153} y={3} width={144} height={110} rx={8} fill="white" stroke="#cbd5e1" />
        <text x={75} y={17} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#0f1b2d">
          একটা বেশি
        </text>
        <text x={225} y={17} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#0f1b2d">
          একটা কম
        </text>
        <X1bRemote x={30} y={26} n={3} extra={k >= 1} />
        {k >= 2 && (
          <g className={FADE}>
            <path d="M8 96q8 -5 16 0t16 0t16 0t16 0t16 0t16 0t16 0t16 0v13H8Z" fill="#bfdbfe" />
            <text x={20} y={107} fontSize={8} fontWeight={700} fill="#1d4ed8">
              পানি
            </text>
          </g>
        )}
        {k >= 1 && (
          <g style={{ transform: `translate(${coin.x}px, ${coin.y}px)` }} className="transition-transform duration-1000 ease-in motion-reduce:transition-none">
            <g className={POP}>
              <circle r={8} fill="#fbbf24" stroke="#b45309" strokeWidth={1.2} />
              <text y={3} textAnchor="middle" fontSize={7.5} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#78350f">
                50
              </text>
            </g>
          </g>
        )}
        <g opacity={k === 1 || k === 2 ? 0.35 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
          <X1bRemote x={180} y={26} n={3} ghost={k >= 3 ? 2 : -1} />
        </g>
        {k >= 4 && (
          <g className={FADE}>
            <rect x={206} y={34} width={46} height={62} rx={10} className="fill-cat-violet/20" />
            <path d="M252 62L272 56" stroke="#e11d48" strokeWidth={1.4} strokeDasharray="3 2.5" />
            <circle cx={280} cy={54} r={6} fill="#fde68a" stroke="#b45309" strokeWidth={1.4} />
            {[-3, 0, 3].map((d) => (
              <circle key={d} cx={280 + d} cy={53} r={0.9} fill="#78716c" />
            ))}
            <text x={292} y={82} textAnchor="end" fontSize={8} fontWeight={700} fill="#be123c">
              নাগালের
            </text>
            <text x={292} y={92} textAnchor="end" fontSize={8} fontWeight={700} fill="#be123c">
              বাইরে
            </text>
          </g>
        )}
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
/** which of Ammu's marks a set of floor buttons reaches */
const marksHit = (keys: Key[]) =>
  isPlane(keys) ? MARKS.map((m) => m.name) : MARKS.filter((m) => keys.some((k) => (k.v[0] || k.v[1]) && det(k.v, m.at) === 0)).map((m) => m.name);

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
    if (!done && k2 && k1) pass("একটা খুললে কিছুই হারায় না. দুইটা খুললে line.");
  };

  return (
    <>
      <Plane f={DF} grid={1} ticks={2} label={`${keys.length} buttons kept; they reach ${full ? "the whole floor" : "one line"}`} className="my-1! max-w-[10.5rem]">
        <Reach key={kept.join()} f={DF} keys={keys} />
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
            <div className="text-xs text-muted">{kept[i] ? "খুলে ফেলুন" : "আবার লাগান"}</div>
          </button>
        ))}
      </div>
      <div key={kept.join()} className={`${FADE} mt-2 text-center text-[0.95rem]`}>
        {keys.length} টা button, {keys.length * 50} টাকা:{" "}
        <b className={full ? "text-accent-text" : "text-danger"}>{full ? "পুরা floor" : "শুধু একটা line"}</b>, 4 টা দাগের {hit.length} টা.
      </div>
      <Ticks
        items={[
          ["একটা button খুলুন", saw2],
          ["দুইটা খুলুন", saw1],
        ]}
      />
      <Task done={done}>একটা একটা করে button খুলুন. রং আর আম্মুর দাগগুলা খেয়াল করুন.</Task>
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
  "তিনটা remote. প্রত্যেকের দুইটা কাজ: কিছু বাড়তি না, আর সব জায়গায় পৌঁছানো.",
  "তিন button: সব জায়গায় পৌঁছায়, কিন্তু একটা button বাড়তি.",
  "এক button: বাড়তি কিছু নাই, কিন্তু floor এর বেশিরভাগই বাদ.",
  "দুই button: বাড়তি নাই, সব জায়গায় পৌঁছায়. এটাই basis.",
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
                {on && <Reach f={X2_F} keys={r.keys} />}
                {r.keys.map((key) => (
                  <Arrow key={key.name} f={X2_F} from={O} to={key.v} tone={key.tone} w={2} />
                ))}
                <circle cx={X2_F.sx(0)} cy={X2_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
              </Plane>
              <div className="mt-0.5 text-center text-xs font-semibold">{r.keys.length} টা button</div>
              <JobLine ok={!r.extra} on={on} text="বাড়তি নাই" />
              <JobLine ok={r.all} on={on} text="সবখানে যায়" />
              {on && i === 1 && <div className={`${POP} mt-0.5 text-center text-xs font-bold text-accent-text`}>basis</div>}
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: back at the toy shop. The
//      shopkeeper sets five ready-made remotes on the counter, two, then all
//      five, and says they're all good, take them. No paint: filing them is
//      the screen's job.

const S3_REMOTES = [2, 3, 1, 2, 2];

export function FiveOnCounter({}: Story) {
  const s = useScene(3, [600, 1500, 1500, 2600]);
  const k = s.k;
  const shown = k === 0 ? 0 : k === 1 ? 2 : 5;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="the toy shop: the shopkeeper sets five ready-made remotes on the counter and says they are all good, take them; Fahim looks at them">
        <CastPerson who="karim" x={118} y={S1_G} scale={0.8} mood={k >= 3 ? "smug" : "plain"} arm={k >= 3 ? "point" : k >= 1 ? "hold" : "down"} />
        <Stall x={118} y={S1_G} sign="button 50 টাকা" color="#0d9488" w={132} />
        <MvTag x={118} y={S1_G + 12} name="দোকানদার" />
        {S3_REMOTES.slice(0, shown).map((n, i) => (
          <g key={i} className={POP}>
            <MvRemote x={70 + i * 24} y={S1_G - 24 - (8 + n * 9) * 0.75} n={n} s={0.75} />
          </g>
        ))}
        {k >= 3 && <Bubble x={118} y={S1_G - 72} side="mid" lines={["সবগুলাই ভালো জিনিস.", "নিয়া যান."]} />}
        <CastPerson who="fahim" x={240} y={S1_G} facing={-1} mood={k >= 3 ? "puzzled" : "plain"} />
        <MvTag x={240} y={S1_G + 12} name="ফাহিম" />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · The shop's shelf. Five ready-made remotes, one at a time, painted; the
//     reader files each one: basis, has an extra, or misses spots. Every tap
//     plays a test on the plane: "extra" takes a button off and repaints (the
//     paint stays, or collapses to a line), "misses" lights Ammu's marks (all
//     inside, or some bare), and a wrong "basis" plays whichever test it
//     fails. A wrong bin bounces with a question about the paint; a right one
//     lands in the table with its reason. (The twin remote does both wrong things, so
//     either failing bin is right for it.)

type Bin = "basis" | "extra" | "misses";
const BINS: { bin: Bin; label: string }[] = [
  { bin: "basis", label: "Basis" },
  { bin: "extra", label: "বাড়তি button আছে" },
  { bin: "misses", label: "জায়গা বাদ পড়ে" },
];
const SHOP5: { keys: Key[]; ok: Bin[]; why: string }[] = [
  {
    keys: [
      { name: "u", v: [1, 2], tone: "blue" },
      { name: "v", v: [2, 5], tone: "coral" },
    ],
    ok: ["basis"],
    why: "দুইটা আলাদা direction, খোলার মতো কিছু নাই.",
  },
  {
    keys: [
      { name: "e₁", v: [1, 0], tone: "blue" },
      { name: "e₂", v: [0, 1], tone: "coral" },
      { name: "w", v: [2, 3], tone: "teal" },
    ],
    ok: ["extra"],
    why: "w = 2 e₁ + 3 e₂. ওটা খুললেও একই floor.",
  },
  { keys: [{ name: "e₁", v: [1, 0], tone: "blue" }], ok: ["misses"], why: "এক button রং করে একটা line." },
  {
    keys: [
      { name: "e₁", v: [1, 0], tone: "blue" },
      { name: "e₂", v: [0, 1], tone: "coral" },
    ],
    ok: ["basis"],
    why: "একটা east, একটা north. বাড়তিও নাই, বাদও নাই.",
  },
  {
    keys: [
      { name: "u", v: [1, 1], tone: "blue" },
      { name: "v", v: [2, 2], tone: "coral" },
    ],
    ok: ["extra", "misses"],
    why: "(2, 2) হলো (1, 1) এর দুইগুণ: বাড়তি, আর শুধু একটা line.",
  },
];
const SF = makeFrame(-2, 4, -2, 6, 13, 8);

function shelfNope(right: Bin[], picked: Bin, n: number) {
  if (picked === "basis" && right.includes("misses")) return "উঁহু. রং টা দেখুন. পুরা floor কি ঢেকেছে?";
  if (picked === "basis") return "উঁহু. একটা button খুলে ফেললেও কি রং একই থাকে না?";
  if (picked === "extra" && n === 1) return "উঁহু. Button তো একটাই, খোলার কিছু নাই. রং টা দেখুন.";
  if (picked === "extra") return "উঁহু. মনে মনে যেকোনো একটা খুলে ফেলুন. রং কি টিকে থাকে?";
  return "উঁহু. রং তো পুরা floor ঢেকে ফেলেছে. কোন জায়গাটা বাদ গেলো?";
}

/** What a bin tap tests on the plane: take a button off, or check Ammu's marks. */
type Probe = { bin: Bin; at: number };
function shelfTest(keys: Key[], ok: Bin[], b: Bin): "drop" | "marks" {
  if (b === "extra") return keys.length === 1 ? "marks" : "drop";
  if (b === "misses") return "marks";
  // a wrong "basis" shows why: the extra button taken off, or the marks left bare
  return ok.includes("extra") && !ok.includes("misses") ? "drop" : "marks";
}
/** the button a drop test takes off: one the others can stand in for, else the last */
function dropIdx(keys: Key[]) {
  const all = isPlane(keys);
  for (let j = keys.length - 1; j >= 0; j -= 1) if (isPlane(keys.filter((_, m) => m !== j)) === all) return j;
  return keys.length - 1;
}

export function ShopShelf() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [filed, setFiled] = useSeed<Bin[]>("filed", []);
  const [wrong, setWrong] = useSeed<Bin | null>("wrong", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const [probe, setProbe] = useSeed<Probe | null>("probe", null);
  const pl = usePlay(650);
  const done = filed.length === SHOP5.length;
  const r = SHOP5[Math.min(at, SHOP5.length - 1)];

  // the test the last tap plays: a button shrinks off and the floor repaints, or the marks light up
  const live = probe !== null && probe.at === at && !done;
  const test = live ? shelfTest(r.keys, r.ok, probe.bin) : null;
  const di = test === "drop" ? dropIdx(r.keys) : -1;
  const grow = useTween(r.keys.map((_, i) => (i === di ? 0 : 1)), 450);
  const settled = !pl.running || pl.k >= 1;
  const left = test === "drop" && settled ? r.keys.filter((_, i) => i !== di) : r.keys;
  const hit = marksHit(r.keys);
  const right = live && r.ok.includes(probe.bin);
  const readout =
    test === "drop"
      ? isPlane(left) === isPlane(r.keys)
        ? `${tup(r.keys[di].v)} খুলে দেখি: রং একই রইলো.`
        : `${tup(r.keys[di].v)} খুলে দেখি: রং চুপসে গেলো.`
      : test === "marks"
        ? `আম্মুর 4 টা দাগের ${hit.length} টা রং এর ভিতরে.`
        : "";

  const file = (b: Bin) => {
    if (done || pl.running) return;
    setProbe({ bin: b, at });
    setWrong(null);
    if (!r.ok.includes(b)) {
      pl.play(2, () => {
        setWrong(b);
        setMiss(miss + 1);
      });
      return;
    }
    const next = [...filed, b];
    pl.play(3, () => {
      setFiled(next);
      setProbe(null);
      if (next.length === SHOP5.length) pass("বেশি হলে বাড়তি. কম হলে জায়গা বাদ.");
      else setAt(at + 1);
    });
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[7rem] shrink-0">
          <Plane f={SF} grid={1} axes={false} label={`remote ${at + 1}, painted`} className="my-0! max-w-none">
            <Reach key={`${at}${left.length}`} f={SF} keys={left} />
            {test === "marks" && <Marks f={SF} hit={hit} />}
            {r.keys.map((k, i) => (
              <Arrow key={`${at}${k.name}`} f={SF} from={O} to={[k.v[0] * (grow[i] ?? 1), k.v[1] * (grow[i] ?? 1)]} tone={k.tone} w={2.2} draw={!live} />
            ))}
            <Door f={SF} />
          </Plane>
          {test && settled && (
            <div key={`${at}${probe?.bin}`} className={`${FADE} mt-0.5 text-center text-[0.7rem] leading-tight ${right ? "text-accent-text" : "text-danger"}`}>
              {readout}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted">
            {SHOP5.length} টার মধ্যে remote {Math.min(at + 1, SHOP5.length)}
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
                  LOOK[wrong === b.bin ? "wrong" : live && probe.bin === b.bin ? (right && settled ? "right" : "picked") : done ? "dim" : "idle"]
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
      <Task done={done}>পাঁচটা remote ই ঠিক ঘরে রাখুন: basis, বাড়তি button আছে, নাকি জায়গা বাদ পড়ে.</Task>
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
  "দুইটা remote, দুইটাই ফেল. যার যার নিজের মতো করে.",
  "বেশি: তিন button, পুরা floor রং হয়েছে.",
  "কিন্তু w আসলে দুইবার e₁ আর তিনবার e₂. 50 টাকা এমনি এমনি গেলো.",
  "কম: এক button, একটা line.",
  "আর খাটের দাগটা বাদ পড়লো. যত চাপই দেন, ওখানে যাওয়া যায় না.",
];

export function TwoFails() {
  const s = useScene(4, [600, 1600, 2200, 1600, 2000]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3_SAY[k]}</span>}>
      <div className="flex justify-center gap-3">
        <div className="w-[7rem]">
          <Plane f={X3_F} grid={1} axes={false} label="too many: w is two e₁ and three e₂" className="my-0! max-w-none">
            {k >= 1 && <Reach f={X3_F} keys={X3_FULL} />}
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
            বেশি{k >= 2 && <span className={`${FADE} text-danger`}> ✕ বাড়তি</span>}
          </div>
        </div>
        <div className="w-[7rem]">
          <Plane f={X3_F} grid={1} axes={false} label="too few: one line, the bed left out" className="my-0! max-w-none">
            {k >= 3 && <Reach f={X3_F} keys={X3_THIN} />}
            <Arrow f={X3_F} from={O} to={[1, 1]} tone="blue" w={2} />
            {k >= 4 && (
              <g className={POP}>
                <rect x={X3_F.sx(1) - 7} y={X3_F.sy(3) - 7} width={14} height={14} rx={2} fill="none" strokeDasharray="3 2" strokeWidth={1.4} className="stroke-danger" />
                <text x={X3_F.sx(1)} y={X3_F.sy(3) - 10} textAnchor="middle" fontSize={8} fontWeight={700} className="fill-danger">
                  খাট
                </text>
              </g>
            )}
            <circle cx={X3_F.sx(0)} cy={X3_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
          </Plane>
          <div className="mt-0.5 text-center text-xs font-semibold">
            কম{k >= 4 && <span className={`${FADE} text-danger`}> ✕ বাদ পড়ে</span>}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation, no task: the basis sits in the
//      middle. The shop's basis remote, (1, 2) and (2, 5): take either button
//      off and the paint collapses to a line (nothing to drop), and all four
//      of Ammu's marks sit inside the paint (nothing missing).

const X3B_KEYS = SHOP5[0].keys;
const X3B_SAY = [
  "দোকানের basis remote: (1, 2) আর (2, 5). পুরা floor রং.",
  "(1, 2) খুলে দেখি: রং চুপসে একটা line.",
  "(2, 5) খুলে দেখি: আবারো একটা line. খোলার মতো কিছু নাই.",
  "আর আম্মুর চারটা দাগই রং এর ভিতরে. বাকিও কিছু নাই.",
  "বেশি আর কমের ঠিক মাঝখানে: basis.",
];

export function BasisMiddle() {
  const s = useScene(4, [600, 1800, 2200, 2200, 1800]);
  const k = s.k;
  const off = k === 1 ? 0 : k === 2 ? 1 : -1;
  const grow = useTween(X3B_KEYS.map((_, i) => (i === off ? 0 : 1)), 450);
  const keys = X3B_KEYS.filter((_, i) => i !== off);
  const rung = (on: boolean, bad: boolean) =>
    `rounded-lg border-2 px-1 py-1 transition-colors duration-500 motion-reduce:transition-none ${on ? (bad ? "border-danger/50 bg-danger/5 text-danger" : "border-accent bg-accent/10 text-accent-text") : "border-border text-muted"}`;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X3B_SAY[k]}</span>}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[7rem]">
          <Plane f={SF} grid={1} axes={false} label={off < 0 ? "the basis remote paints the whole floor" : "one button taken off: the paint is one line"} className="my-0! max-w-none">
            <Reach key={off} f={SF} keys={keys} />
            {k >= 3 && <Marks f={SF} hit={MARKS.map((m) => m.name)} />}
            {X3B_KEYS.map((key, i) => (
              <Arrow key={key.name} f={SF} from={O} to={[key.v[0] * (grow[i] ?? 1), key.v[1] * (grow[i] ?? 1)]} tone={key.tone} w={2.2} />
            ))}
            <Door f={SF} />
          </Plane>
        </div>
        <div className="grid w-[6rem] gap-1.5 text-center text-xs font-semibold leading-tight">
          <div className={rung(k >= 4, true)}>বেশি: বাড়তি button</div>
          <div className={`${rung(k >= 4, false)} ${k >= 4 ? POP : ""}`}>basis</div>
          <div className={rung(k >= 4, true)}>কম: জায়গা বাদ</div>
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
    if (!done && k3.length >= 3 && t3) pass("যে-ই বানাক, floor এ লাগে দুইটা.");
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
    ? { tone: "text-accent-text", say: "দুইটা direction: পুরা floor, বাড়তি কিছু নাই. Basis." }
    : tips.length === 1
      ? { tone: "text-danger", say: "এক button: শুধু একটা line. বেশিরভাগ জায়গা বাদ." }
      : full
        ? { tone: "text-danger", say: "পুরা floor, কিন্তু একটা button বাড়তি." }
        : { tone: "text-danger", say: "শুধু একটা line, আর একটা button বাড়তি." };

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
        <Reach key={`${full}${tips.length}`} f={AF} keys={keys} />
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
          Design টা রাখুন
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
          ["তিন button", tried3],
        ]}
      />
      <Task done={done}>Button এর মাথা টেনে সরান. কাজ করে এমন তিনটা আলাদা design রাখুন. আর একবার দেখুন তিন button দিয়ে.</Task>
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
    who: "ফাহিম",
    keys: [
      { name: "a", v: [1, 0], tone: "blue" },
      { name: "b", v: [0, 1], tone: "coral" },
    ],
  },
  {
    who: "নাসিব",
    keys: [
      { name: "a", v: [2, 1], tone: "blue" },
      { name: "b", v: [-1, 2], tone: "coral" },
    ],
  },
  {
    who: "সোম",
    keys: [
      { name: "a", v: [1, 1], tone: "blue" },
      { name: "b", v: [1, -2], tone: "coral" },
    ],
  },
];
const X4_SAY = [
  "তিনজন তিনটা floor remote design করলো.",
  "ফাহিমের টা: east আর north. পুরা floor.",
  "নাসিবের টা: দুইটা বাঁকা button. পুরা floor.",
  "সোমের টা: আরেক জোড়া. আবারো পুরা floor.",
];

export function ThreeDesigners() {
  const s = useScene(3, [600, 1600, 1600]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? <span key={k} className={FADE}>{X4_SAY[k]}</span> : <span className={FADE}>{X4_SAY[3]} কারো সাথে কারো মিল নাই, কিন্তু সবগুলাতেই ঠিক 2 টা.</span>}>
      <div className="flex justify-center gap-2">
        {X4_DESIGNS.map((d, i) => (
          <div key={d.who} className={`w-[5.5rem] transition-opacity duration-500 motion-reduce:transition-none ${k >= i + 1 ? "opacity-100" : "opacity-40"}`}>
            <Plane f={X4_F} grid={1} axes={false} label={`${d.who}'s two buttons`} className="my-0! max-w-none">
              {k >= i + 1 && <Reach f={X4_F} keys={d.keys} />}
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
// 4¾ · A figure for screen 4's explanation, no task: the floor's own number.
//      The three designers' 2s glide onto the floor and become one 2; the
//      name dimension lands; Som's claim card from screen 1 gets its tick for
//      the floor, with the room still a "?".

const X4B_WHO = ["ফাহিম", "নাসিব", "সোম"];
const X4B_SAY = [
  "তিনজনের তিনটা design. গুনলে তিনটাতেই 2.",
  "সংখ্যাটা কে বানালো তার উপর নির্ভর করে না. ওটা floor এর নিজের.",
  "এই সংখ্যার নাম dimension. Floor এর dimension 2.",
  "সোমের কথা টিকে গেলো, অন্তত floor এ. ঘর এখনো বাকি.",
];

export function FloorsOwnNumber() {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4B_SAY[k]}</span>}>
      <svg viewBox="0 0 300 116" className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label="three designers' counts of 2 glide onto the floor as one 2, named dimension; Som's claim is ticked for the floor, the room still a question">
        {k >= 1 && (
          <g className={FADE}>
            <polygon points="46,104 146,104 170,70 70,70" fill="#e6d3b3" stroke="#c6ad82" />
            <path d="M71 104L94 70M96 104L120 70M121 104L145 70M58 87H158" stroke="#c6ad82" strokeWidth={0.8} />
            <text x={108} y={114} textAnchor="middle" fontSize={8} fontWeight={700} fill="#5a6b7d">
              floor
            </text>
          </g>
        )}
        {X4B_WHO.map((who, i) => {
          const x = 50 + i * 100;
          const dx = k >= 1 ? 108 - x : 0;
          const dy = k >= 1 ? 48 : 0;
          return (
            <g key={who} style={{ transform: `translate(${dx}px, ${dy}px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
              <rect x={x - 30} y={6} width={60} height={34} rx={7} fill="white" stroke="#cbd5e1" opacity={k >= 1 ? 0 : 1} className="transition-opacity duration-500 motion-reduce:transition-none" />
              <text x={x} y={18} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#334155" opacity={k >= 1 ? 0 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
                {who}
              </text>
              <text x={x} y={35} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#0f766e">
                2
              </text>
            </g>
          );
        })}
        {k >= 2 && (
          <g className={POP}>
            <rect x={70} y={46} width={76} height={16} rx={8} fill="#ccfbf1" stroke="#0f766e" />
            <text x={108} y={57.5} textAnchor="middle" fontSize={9.5} fontWeight={800} fill="#0f766e">
              dimension
            </text>
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <rect x={196} y={10} width={98} height={98} rx={8} fill="white" stroke="#cbd5e1" />
            <text x={245} y={26} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0f1b2d">
              সোম
            </text>
            <text x={245} y={42} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="#334155">
              সংখ্যা একই,
            </text>
            <text x={245} y={54} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="#334155">
              যে-ই বানাক.
            </text>
            <g className={POP}>
              <path d="M212 74l4 4 8 -9" stroke="#0f766e" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x={230} y={78} fontSize={9} fontWeight={700} fill="#0f766e">
                floor এ
              </text>
            </g>
            <text x={216} y={98} textAnchor="middle" fontSize={13} fontWeight={800} fill="#b45309">
              ?
            </text>
            <text x={230} y={97} fontSize={9} fontWeight={700} fill="#b45309">
              ঘরে
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// Buttons in the room, shared by screens 6½–10: east, north and up, and the
// room with a remote's paint and the drone flown to its closest spot.

const E1: V3 = [1, 0, 0];
const E2: V3 = [0, 1, 0];
const UP: V3 = [0, 0, 1];
type Key3 = { name: string; v: V3; tone: Tone };

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

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: the fan in the middle of
//      the ceiling, thick with dust. Fahim puts Shiku's floor remote on the
//      drone: it slides along the floor to just under the fan and stays
//      there. Nasib says one button, aimed at the fan, is enough. No answer
//      is shown.

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
  const s = useScene(3, [600, 2400, 2400, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S5_G} label="the dusty ceiling fan; Fahim puts Shiku's floor remote on the drone, and it slides along the floor to under the fan but never goes up; Nasib says one button aimed at the fan is enough">
        <S5Fan dust />
        <g style={{ transform: `translate(${k >= 1 ? 48 : 0}px, 0)` }} className="transition-transform duration-1000 ease-out motion-reduce:transition-none">
          <MvDrone at={[118, 158]} s={1.3} />
        </g>
        {k >= 2 && (
          <g className={FADE}>
            <path d={`M166 146V${S5_FAN.y + 8}`} stroke="#e11d48" strokeWidth={1.4} strokeDasharray="4 3" />
            <text x={160} y={84} textAnchor="end" fontSize={9} fontWeight={700} fill="#be123c">
              3 ধাপ উপরে
            </text>
          </g>
        )}
        <CastPerson who="fahim" x={46} y={S5_G + 16} mood={k === 2 ? "puzzled" : "plain"} arm="hold" />
        <MvTag x={46} y={S5_G + 26} name="ফাহিম" />
        <MvRemote x={70} y={S5_G - 30} n={2} s={0.8} />
        {k === 1 && <Bubble x={46} y={S5_G - 50} side="right" lines={["Shiku র remote টাই", "লাগিয়ে দেখি."]} />}
        {k === 2 && <Bubble x={46} y={S5_G - 50} side="right" lines={["উপরে তো", "ওঠেই না."]} />}
        <Robot x={86} y={S5_G + 16} />
        <CastPerson who="nasib" x={k >= 3 ? 262 : 360} y={S5_G + 16} facing={-1} walking={k === 3} mood="smug" arm={k >= 3 ? "point" : "down"} />
        {k >= 3 && <MvTag x={262} y={S5_G + 26} name="নাসিব" />}
        {k >= 3 && <Bubble x={262} y={S5_G - 50} side="left" lines={["ফ্যানের দিকে তাক করা", "একটা button ই যথেষ্ট."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · One button, aimed. Nasib's single button, aimed at a spot: the drone
//     rides its line straight to the fan. Then Ammu points at the cobweb in
//     the ceiling's corner, and it is off the line. Re-aim the button at the
//     cobweb and the fan drops off instead. A challenge that can't be won:
//     one button, one line.

export function OneAimed() {
  const pass = useGate();
  const [aim, setAim] = useSeed<number | null>("aim", null);
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const shown = tried.length ? 2 : 1;
  const done = tried.length === 2;

  const tap = (i: number) => {
    setAim(i);
    if (tried.includes(i)) return;
    const next = [...tried, i];
    setTried(next);
    if (next.length === 2) pass("এক button, এক line. একটা ধরলে আরেকটা ফসকায়.");
  };

  const say =
    aim === null
      ? "নাসিবের button টা ফ্যানের দিকে তাক করুন."
      : aim === 0
        ? tried.length === 2
          ? "ফ্যান আবার পাওয়া গেলো. ঝুল আবার line এর বাইরে."
          : "Drone line ধরে সোজা ফ্যানে. নাসিব ঠিক?"
        : "ঝুল পাওয়া গেলো. কিন্তু এবার ফ্যান line এর বাইরে.";

  return (
    <>
      <AimRoom aimed={aim === null ? [] : [aim]} shown={shown} label={aim === null ? "the room, the dusty fan, the drone at the door" : `one button aimed at the ${aim === 0 ? "fan" : "cobweb"}: a line through the door`} />
      <AimChips aimed={aim === null ? [] : [aim]} shown={shown} onTap={tap} />
      <div key={`${aim}${tried.length}`} className={`${FADE} mt-1.5 text-center text-[0.9rem]`}>
        {say}
      </div>
      {tried.length > 0 && (
        <Speech who="আম্মু" initial="আ" tint="teal">
          ফ্যান তো হলো. কোনার ঝুলটা?
        </Speech>
      )}
      <Task done={done}>একটা button দিয়েই ফ্যান আর ঝুল, দুইটাতে পৌঁছানোর চেষ্টা করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: one button on the floor
//      paints a line; one button in the room paints a line too, through the
//      fan, and the cobweb stays off it.

const X5A_F = makeFrame(-1, 4, -1, 4, 14, 6);
const X5A_SAY = [
  "Floor এ এক button, আর ঘরে এক button.",
  "Floor এ: এক button মানে একটা line. DropOne এ দেখেছিলেন.",
  "ঘরেও: এক button মানে একটা line. এবার সেটা ফ্যানের ভিতর দিয়ে যায়.",
  "Line এর বাইরে যা আছে, যতবারই চাপুন, নাগালের বাইরে.",
];

export function OneLine() {
  const s = useScene(3, [600, 1600, 2000, 2000]);
  const k = s.k;
  const fan = span3([FAN]);
  const web = SPOTS[1].at;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X5A_SAY[k]}</span>}>
      <div className="flex items-end justify-center gap-3">
        <div className="w-[6rem]">
          <Plane f={X5A_F} grid={1} axes={false} label="the floor: one button, one line" className="my-0! max-w-none">
            {k >= 1 && <Reach f={X5A_F} keys={[{ name: "e₁", v: [1, 1], tone: "blue" }]} />}
            <Arrow f={X5A_F} from={O} to={[1, 1]} tone="blue" w={2} />
            <circle cx={X5A_F.sx(0)} cy={X5A_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
          </Plane>
          <div className="text-center text-xs font-semibold">floor</div>
        </div>
        <div className="w-[9rem]">
          <svg viewBox={`0 0 ${XV.W} ${XV.H}`} className="block h-auto w-full" role="img" aria-label="the room: one button aimed at the fan paints a line; the cobweb is off it">
            <RoomBox v={XV} fan />
            {k >= 2 && <SpanPaint v={XV} s={fan} className={FADE} />}
            <Arrow3 v={XV} to={FAN} tone="coral" />
            <SpotMark v={XV} s={SPOTS[1]} on={false} />
            {k >= 3 && <Gap v={XV} from={clampBox(nearest3(web, [FAN]))} to={web} />}
          </svg>
          <div className="text-center text-xs font-semibold">ঘর</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: Ammu walks the room with
//      a broom and points at two more dusty spots, the top of the almirah and
//      the wall clock; Nasib says fine, two buttons.

function S6Room({ k }: { k: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={14} y={70} width={40} height={80} rx={2} fill="#a16207" stroke="#713f12" />
      <path d="M34 72V148" stroke="#713f12" strokeWidth={1} />
      <circle cx={30} cy={110} r={1.6} fill="#fde68a" />
      <circle cx={38} cy={110} r={1.6} fill="#fde68a" />
      {[18, 28, 40, 48].map((x) => (
        <circle key={x} cx={x} cy={68} r={1.6} fill="#78716c" />
      ))}
      <circle cx={232} cy={62} r={11} fill="white" stroke="#475569" strokeWidth={1.6} />
      <path d="M232 62V55M232 62l5 3" stroke="#0f1b2d" strokeWidth={1.4} strokeLinecap="round" />
      {[226, 232, 238].map((x) => (
        <circle key={x} cx={x} cy={49} r={1.5} fill="#78716c" />
      ))}
      <path d="M320 16l-18 0M320 16l0 18M320 16l-14 14M311 16q3 5 0 9M306 16q5 8 0 13" stroke="#57534e" strokeWidth={0.9} fill="none" />
      {k >= 1 && <rect x={10} y={62} width={48} height={12} rx={3} fill="none" stroke="#e11d48" strokeWidth={1.4} strokeDasharray="3 2" className={POP} />}
      {k >= 2 && <circle cx={232} cy={56} r={17} fill="none" stroke="#e11d48" strokeWidth={1.4} strokeDasharray="3 2" className={POP} />}
    </g>
  );
}

export function AmmuSpots({}: Story) {
  const s = useScene(3, [600, 2400, 2400, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S5_G} label="Ammu with a broom points at the dusty top of the almirah and the dusty wall clock; Nasib says fine, two buttons">
        <S5Fan dust={false} />
        <S6Room k={k} />
        <CastPerson who="ammu" x={108} y={S5_G + 16} arm={k === 1 || k === 2 ? "point" : "hold"} facing={k === 2 ? 1 : -1} />
        <MvTag x={108} y={S5_G + 26} name="আম্মু" />
        {k === 1 && <Bubble x={108} y={S5_G - 50} side="mid" lines={["আলমারির মাথা.", "কেউ দেখে নাই."]} />}
        {k === 2 && <Bubble x={108} y={S5_G - 50} side="right" lines={["ঘড়ির মাথাতেও ধুলা."]} />}
        <CastPerson who="nasib" x={k >= 3 ? 272 : 360} y={S5_G + 16} facing={-1} walking={k === 3} mood="smug" />
        {k >= 3 && <MvTag x={272} y={S5_G + 26} name="নাসিব" />}
        {k >= 3 && <Bubble x={272} y={S5_G - 50} side="left" lines={["ঠিক আছে, দুইটা button.", "এদিকে একটা, ওদিকে একটা."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · Two buttons, aimed (predict). Guess first: can two well-aimed buttons
//     reach anywhere in the room? Then aim two buttons at any two of Ammu's
//     four spots (a third tap re-aims the older one). The two spots land on a
//     flat sheet through the door; the other two stay off it, with red gaps.
//     Two different pairs settle the guess.

const TWO_GUESS = ["হ্যাঁ, ঠিক জোড়াটা বাছলেই", "না, দুইটা দিয়ে কখনোই না"];
const TWO_RIGHT = 1;
const pairKey = (a: number[]) => [...a].sort().join();

export function TwoAimed() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [aimed, setAimed] = useSeed<number[]>("aimed", []);
  const [pairs, setPairs] = useSeed<string[]>("pairs", []);
  const over = pairs.length >= 2;
  const vs = aimed.map((i) => SPOTS[i].at);
  const missed = SPOTS.filter((sp) => !reaches3(sp.at, vs)).length;

  const tap = (i: number) => {
    const next = aimed.includes(i) ? aimed.filter((j) => j !== i) : [...aimed, i].slice(-2);
    setAimed(next);
    if (next.length < 2 || pairs.includes(pairKey(next))) return;
    const p2 = [...pairs, pairKey(next)];
    setPairs(p2);
    if (p2.length === 2) pass("দুই button সবসময় একটা flat sheet.");
  };

  return (
    <>
      <AimRoom aimed={aimed} className="max-w-[12.5rem]" label={`${aimed.length} buttons aimed; ${missed} of Ammu's four spots are off the paint`} />
      {guess !== null && (
        <>
          <AimChips aimed={aimed} onTap={tap} />
          <div key={pairKey(aimed)} className={`${FADE} mt-1.5 text-center text-[0.9rem]`}>
            {aimed.length < 2 ? (
              <span className="text-muted">দুইটা spot এ দুইটা button তাক করুন.</span>
            ) : (
              <>
                2 টা button, 100 টাকা: একটা sheet. <b className="text-danger">{missed} টা spot বাইরে.</b>
                {pairs.length === 1 && <span className="text-muted"> এবার অন্য একটা জোড়া.</span>}
              </>
            )}
          </div>
        </>
      )}
      <div className="mt-2 text-sm font-medium text-muted">দুইটা button ঠিকমতো তাক করলে কি ঘরের সব জায়গায় পৌঁছানো যায়?</div>
      <div className="mt-1.5 grid gap-1.5">
        {TWO_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, TWO_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={over}>{guess === null ? "আগে একটা guess দিন." : "দুইটা আলাদা জোড়া spot এ button তাক করে দেখুন."}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: three tilts of a sheet.
//      Fahim's floor pair lies flat; the fan-and-cobweb pair tilts it one
//      way, the almirah-and-clock pair another. Every tilt leaves spots off.

const X6A_PAIRS: V3[][] = [[E1, E2], [SPOTS[0].at, SPOTS[1].at], [SPOTS[2].at, SPOTS[3].at]];
const X6A_SAY = [
  "ঘর, আর আম্মুর চারটা ধুলার spot.",
  "ফাহিমের floor এর দুই button: sheet টা মেঝেতে শুয়ে আছে. চারটা spot ই উপরে.",
  "ফ্যান আর ঝুলে তাক করলে sheet হেলে যায়. আলমারি আর ঘড়ি বাইরে.",
  "আলমারি আর ঘড়িতে তাক করলে হেলে আরেক দিকে. ফ্যান আর ঝুল বাইরে.",
  "যেভাবেই হেলান, sheet একটা পাতলা পাতাই থাকে. ঘর ভরে না.",
];

export function SheetTilts() {
  const s = useScene(4, [600, 2200, 2200, 2200, 2200]);
  const k = s.k;
  const pair = k >= 1 && k <= 3 ? X6A_PAIRS[k - 1] : null;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X6A_SAY[k]}</span>}>
      <svg viewBox={`0 0 ${XV.W} ${XV.H}`} className="mx-auto block h-auto w-full max-w-[13rem]" role="img" aria-label="two buttons paint a flat sheet; tilted three ways, every sheet leaves some of Ammu's spots off it">
        <RoomBox v={XV} fan />
        {pair && <SpanPaint key={k} v={XV} s={span3(pair)} className={FADE} />}
        {k === 4 && X6A_PAIRS.map((p, i) => <SpanPaint key={i} v={XV} s={span3(p)} className={`${FADE} opacity-60`} />)}
        {pair && pair.map((v, i) => <Arrow3 key={`${k}${i}`} v={XV} to={v} tone={i ? "coral" : "blue"} />)}
        {SPOTS.map((sp) => (
          <SpotMark key={sp.name} v={XV} s={sp} on={pair !== null && reaches3(sp.at, pair)} />
        ))}
        {pair && SPOTS.map((sp) => (reaches3(sp.at, pair) ? null : <Gap key={sp.name} v={XV} from={clampBox(nearest3(sp.at, pair))} to={sp.at} />))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: Nasib with his
//      two-button remote under the dusty fan; Som walks in and says, calmly,
//      a third button is needed, and whichever three, the count stays three.
//      No room is painted: the screen does that.

export function SomThird({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2800]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S5_G} label="Nasib holds his two-button remote under the dusty fan; Som walks in and says a third button is needed, and whichever three you aim, the count stays three">
        <S5Fan dust />
        <CastPerson who="nasib" x={110} y={S5_G + 16} arm="hold" mood={k >= 2 ? "puzzled" : "smug"} />
        <MvTag x={110} y={S5_G + 26} name="নাসিব" />
        <MvRemote x={134} y={S5_G - 30} n={2} s={0.8} />
        <CastPerson who="som" x={k >= 1 ? 236 : 360} y={S5_G + 16} facing={-1} walking={k === 1} mood="plain" arm={k >= 2 ? "point" : "down"} />
        {k >= 1 && <MvTag x={236} y={S5_G + 26} name="সোম" />}
        {k === 2 && <Bubble x={236} y={S5_G - 50} side="left" lines={["তিন নম্বর button", "লাগবে."]} />}
        {k >= 3 && <Bubble x={236} y={S5_G - 50} side="left" lines={["যে তিনটাতেই তাক করো,", "সংখ্যা তিনই থাকবে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · The third button. Som: aim a third one, any three, and the count stays.
//     Starts from the fan-and-cobweb pair. A third button fills the room and
//     every spot turns green; do it with two different trios, then add a
//     fourth and watch nothing new happen but the price.

const trioOk = (a: number[]) => a.length === 3 && rank3(a.map((i) => SPOTS[i].at)) === 3;

export function ThirdButton() {
  const pass = useGate();
  const [aimed, setAimed] = useSeed<number[]>("aimed", [0, 1]);
  const [trios, setTrios] = useSeed<string[]>("trios", []);
  const [tried4, setTried4] = useSeed("tried4", false);
  const done = trios.length >= 2 && tried4;
  const vs = aimed.map((i) => SPOTS[i].at);
  const r = rank3(vs);

  const tap = (i: number) => {
    const next = aimed.includes(i) ? aimed.filter((j) => j !== i) : [...aimed, i];
    if (next.length === 0) return;
    setAimed(next);
    const t = trioOk(next) && !trios.includes(pairKey(next)) ? [...trios, pairKey(next)] : trios;
    const f = tried4 || next.length === 4;
    setTrios(t);
    setTried4(f);
    if (!done && t.length >= 2 && f) pass("যে তিনটাই হোক, ঘরে লাগে তিনটা.");
  };

  const say =
    aimed.length === 4
      ? "4 টা button, 200 টাকা: সেই একই ঘর. একটা বাড়তি."
      : r === 3
        ? "3 টা button, 150 টাকা: পুরা ঘর রং হলো. সব spot পাওয়া গেলো."
        : r === 2
          ? "2 টা button: একটা sheet. আরেকটা spot এ তাক করুন."
          : "1 টা button: একটা line.";

  return (
    <>
      <AimRoom aimed={aimed} label={`${aimed.length} buttons aimed; they paint ${r === 3 ? "the whole room" : r === 2 ? "a sheet" : "a line"}`} />
      <AimChips aimed={aimed} onTap={tap} />
      <div key={pairKey(aimed)} className={`${FADE} mt-1.5 text-center text-[0.9rem] ${r === 3 ? (aimed.length === 3 ? "text-accent-text" : "text-danger") : ""}`}>
        {say}
      </div>
      <Ticks
        items={[
          ["তিন button, সব spot", trios.length >= 1],
          ["অন্য তিনটা দিয়ে", trios.length >= 2],
          ["চার button", tried4],
        ]}
      />
      <Task done={done}>তিনটা button দিয়ে সব spot এ পৌঁছান, দুইটা আলাদা ভাবে. তারপর চার নম্বর একটা লাগিয়ে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: the floor sheet, then
//      the up arrow lifting it: copies of the sheet at every height, until
//      the room is full.

const XV = roomView(24);
const X5_SAY = [
  "East আর north: দুইটা button.",
  "দুইটা মিলে রং করে একটা flat sheet, মেঝেটা.",
  "এবার up যোগ করি, তিন নম্বর direction.",
  "Up এর প্রতিটা চাপ পুরা sheet টাকে এক ধাপ উপরে তোলে.",
  "Sheet এর উপর sheet, ঘর ভরে যায়. Floor: 2. ঘর: 3.",
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
// 7¾ · A figure for screen 7's explanation, no task: count the slots, count
//      the buttons. A line (1 slot) takes 1, the floor (2 slots) takes 2, the
//      room (3 slots) takes 3, and ℝⁿ takes n.

const X7B_SAY = [
  "প্রতিটা space এর কয়টা slot, আর কয়টা button লাগে?",
  "1 slot: একটা line. লাগে 1 টা button.",
  "2 slot: floor. লাগে 2 টা.",
  "3 slot: ঘর. লাগে 3 টা. ঘরের dimension 3.",
  "n টা slot এর space, ℝⁿ, নেয় ঠিক n টা.",
];
const X7B_HEAD = ["ℝ¹", "ℝ²", "ℝ³", "ℝⁿ"];

export function SlotsCount() {
  const s = useScene(4, [600, 1600, 1600, 2000, 2200]);
  const k = s.k;
  const dim = (i: number) => (k >= i + 1 ? 1 : 0.3);

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X7B_SAY[k]}</span>}>
      <svg viewBox="0 0 300 104" className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label="a line takes one button, the floor two, the room three, and a space of n slots takes n">
        {X7B_HEAD.map((h, i) => (
          <g key={h} opacity={dim(i)} className="transition-opacity duration-500 motion-reduce:transition-none">
            <rect x={3 + i * 74} y={3} width={68} height={98} rx={8} fill="white" stroke="#cbd5e1" />
            <text x={37 + i * 74} y={18} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#0f1b2d">
              {h}
            </text>
            {k >= i + 1 && (
              <text x={37 + i * 74} y={94} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#0f766e" className={POP}>
                {i === 3 ? "n" : i + 1}
              </text>
            )}
          </g>
        ))}
        <g opacity={dim(0)}>
          <path d="M10 58H64" stroke="#7c3aed" strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" />
          <path d="M16 58H34" stroke="#2563eb" strokeWidth={2} />
          <path d="M38 58l-5 -3v6Z" fill="#2563eb" />
        </g>
        <g opacity={dim(1)}>
          <polygon points="84,76 124,76 138,40 98,40" fill="#e6d3b3" stroke="#c6ad82" />
          <path d="M88 72H104" stroke="#2563eb" strokeWidth={2} />
          <path d="M108 72l-5 -3v6Z" fill="#2563eb" />
          <path d="M88 72L94 56" stroke="#e0664f" strokeWidth={2} />
          <path d="M95.5 52l-4.3 3.4 5.6 2Z" fill="#e0664f" />
        </g>
        <g opacity={dim(2)}>
          <svg x={152} y={24} width={66} height={52} viewBox={`0 0 ${MINI.W} ${MINI.H}`}>
            <RoomBox v={MINI} fan={false} door={false} />
            <Arrow3 v={MINI} to={E1} tone="blue" w={1.6} />
            <Arrow3 v={MINI} to={E2} tone="coral" w={1.6} />
            <Arrow3 v={MINI} to={UP} tone="teal" w={1.6} />
          </svg>
        </g>
        <g opacity={dim(3)}>
          <text x={259} y={46} textAnchor="middle" fontSize={9} fontWeight={700} fill="#334155">
            n টা slot
          </text>
          <text x={259} y={62} textAnchor="middle" fontSize={9} fontWeight={700} fill="#334155">
            n টা button
          </text>
        </g>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: back at the toy shop.
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
        <Stall x={84} y={S6_G} sign="খেলনা" color="#0d9488" w={96} />
        <MvTag x={84} y={S6_G + 12} name="দোকানদার" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={42 + i * 12} y={S6_G - 30} width={9} height={6} rx={1.5} fill={["#2563eb", "#e0664f", "#0d9488", "#d97706", "#64748b", "#7c3aed", "#e11d48"][i]} />
        ))}
        {k === 2 && <Bubble x={84} y={S6_G - 74} side="right" lines={["সাতটাই নিয়া যান.", "কোনো চিন্তা নাই."]} />}
        <CastPerson who="mama" x={k >= 1 ? 186 : 340} y={S6_G + 16} facing={-1} walking={k === 1} mood="plain" />
        {k >= 1 && <MvTag x={186} y={S6_G + 26} name="আব্বু" />}
        {k === 1 && <Bubble x={186} y={S6_G - 52} side="mid" lines={["একটাই remote, দুই কাজ.", "যত কমে হয়."]} />}
        <CastPerson who="fahim" x={250} y={S6_G + 16} facing={-1} arm={k >= 3 ? "hold" : "down"} mood={k >= 3 ? "puzzled" : "plain"} />
        <MvTag x={250} y={S6_G + 26} name="ফাহিম" />
        {k >= 3 && <Bubble x={250} y={S6_G - 50} side="left" tone="think" lines={["একেকটা 50 টাকা."]} />}
        <Robot x={292} y={S6_G + 16} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn: the shop's order. Seven buttons on the shelf, traps among
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
  4: "(0, 0, 0) কিছুই নড়ায় না.",
  2: "(2, 0, 0) হলো (1, 0, 0) এর দুইগুণ.",
  3: "(1, 1, 0) হলো (1, 0, 0) যোগ (0, 1, 0).",
  6: "(1, 2, 1) হলো (1, 1, 0) যোগ (0, 1, 1).",
};
const RV6 = roomView(26);

function orderVerdict(cart: number[]) {
  const vs = cart.map((i) => SHELF7[i].v);
  const r = rank3(vs);
  const ex = extraIn(cart);
  const why = ex !== undefined ? (WHY7[ex] ?? `${SHELF7[ex].name} বাকিগুলা দিয়েই বানানো যায়.`) : "";
  if (r === 3 && cart.length === 3) return { ok: true, say: "তিন button, তিন direction: পুরা ঘর. 150 টাকা." };
  if (r === 3) return { ok: false, say: `ফ্যানে পৌঁছায়, কিন্তু দাম ${cart.length * 50} টাকা. ${why} ওটা খুলে ফেলুন.` };
  const floorOnly = vs.every((v) => v[2] === 0);
  const shape = r === 2 ? "একটা sheet" : r === 1 ? "একটা line" : "কিছুই না";
  const head = floorOnly && r === 2 ? "Drone মেঝে ছেড়ে ওঠেই না." : `শুধু ${shape}. ফ্যান নাগালের বাইরে.`;
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
      pass("তিন button, 150 টাকা. একটাও বেশি না.");
    } else setMiss(miss + 1);
  };

  return (
    <>
      <Room v={RV6} keys={tk} flyTo={now} className="max-w-[14rem]" label={tested ? `a cart of ${tested.length} buttons tested` : "the room, the fan, the drone at the door"}>
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
          Test করুন
        </button>
      </div>
      <div className="mt-1.5 text-center text-sm">
        Cart এ {cart.length} টা button, <b>{cart.length * 50} টাকা</b>
      </div>
      {verdict && landed && fresh && verdict.ok && <div className={`${FADE} mt-1 text-center text-[0.95rem] text-accent-text`}>{verdict.say}</div>}
      {verdict && landed && fresh && !verdict.ok && <Nope key={miss}>{verdict.say}</Nope>}
      <Task done={won}>সবচেয়ে সস্তা remote টা বানান, যেটা drone কে ফ্যানে নেয় আর Shiku কে floor এর যেকোনো জায়গায়.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the cart of three. Two
//      floor buttons paint the floor, (0, 1, 1) fills the room, and the
//      shopkeeper's "the more, the safer" gets its line through it.

const X6_SAY = [
  "Cart এ: (1, 0, 0), (0, 1, 0) আর (0, 1, 1).",
  "প্রথম দুইটা মেঝে রং করে.",
  "(0, 1, 1) ঠেলে নতুন দিকে, উপরে আর ভিতরে. ঘর ভরে যায়.",
  "3 × 50 = 150 টাকা. চার নম্বর button শুধু একটা copy যোগ করতো.",
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
          {k >= 3 && <div className={`${POP} text-sm font-bold`}>150 টাকা</div>}
          <div className={`mt-1 text-xs ${k >= 3 ? "text-danger line-through" : "text-muted"}`}>&ldquo;যত বেশি, তত নিরাপদ.&rdquo;</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8¼ · A figure for screen 8's explanation, no task: the shelf's three traps,
//      one at a time. (2, 0, 0) is (1, 0, 0) pressed twice, the same line;
//      (1, 1, 0) is east then north, flat on the floor; (0, 0, 0) moves
//      nothing, the drone stays at the door.

const X8B_SAY = [
  "ফাঁদে পড়া সহজ ছিল. তাকের তিনটা ফাঁদ দেখি.",
  "(2, 0, 0): (1, 0, 0) দুইবার চাপলেই. একই দিকে, শুধু লম্বা.",
  "(1, 1, 0): east যোগ north. মেঝে ছেড়ে কখনো ওঠে না.",
  "(0, 0, 0): কোনো arrow ই নাই. Drone দরজা থেকে নড়েই না.",
];

/** a closer view: the traps are one or two steps long */
const X8B_V = roomView(34);

export function ThreeTraps() {
  const s = useScene(3, [600, 2200, 2200, 2200]);
  const k = s.k;
  const [dx, dy] = X8B_V.p(O3);

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X8B_SAY[k]}</span>}>
      <svg viewBox={`0 0 ${X8B_V.W} ${X8B_V.H}`} className="mx-auto block h-auto w-full max-w-[12.5rem]" role="img" aria-label="three trap buttons: (2, 0, 0) lies along (1, 0, 0); (1, 1, 0) is east plus north and stays on the floor; (0, 0, 0) moves nothing">
        <RoomBox v={X8B_V} fan={false} />
        {k === 1 && (
          <g key="copy" className={FADE}>
            <SpanPaint v={X8B_V} s={span3([E1])} />
            <Arrow3 v={X8B_V} to={[2, 0, 0]} tone="teal" w={5} faint />
            <Arrow3 v={X8B_V} to={E1} tone="blue" />
            <g className={POP}>
              <Arrow3 v={X8B_V} from={E1} to={[2, 0, 0]} tone="blue" />
            </g>
          </g>
        )}
        {k === 2 && (
          <g key="flat" className={FADE}>
            <SpanPaint v={X8B_V} s={span3([E1, E2])} />
            <Arrow3 v={X8B_V} to={[1, 1, 0]} tone="amber" w={3} />
            <Arrow3 v={X8B_V} to={E1} tone="blue" w={1.8} />
            <g className={POP}>
              <Arrow3 v={X8B_V} from={E1} to={[1, 1, 0]} tone="coral" w={1.8} />
            </g>
          </g>
        )}
        {k === 3 && (
          <g key="zero" className={POP}>
            <circle cx={dx} cy={dy} r={9} fill="none" stroke="#0f1b2d" strokeWidth={1.4} strokeDasharray="3 2" />
            <text x={dx + 12} y={dy - 8} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#0f1b2d">
              (0, 0, 0)
            </text>
          </g>
        )}
        {(k === 0 || k === 3) && <MvDrone at={X8B_V.p(O3)} s={0.9} />}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it. Round 1: two long buttons for the drone, (4, 0, 2) and
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
  { kind: "room", label: "পুরা ঘর" },
  { kind: "sheet", label: "হেলানো sheet" },
  { kind: "line", label: "একটা line" },
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
    if (rank3(FOUR.filter((_, j) => j !== i).map((k) => k.v)) === 3) pass("লম্বা মানে নতুন দিক না. চারে একটা বাড়তি.");
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
            নাসিবের লম্বা button: <span className="font-mono text-cat-blue">(4, 0, 2)</span> আর <span className="font-mono text-cat-coral">(0, 4, 1)</span>
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
                ? "উঁহু. Drone যতটা কাছে যাওয়া যায় গেলো, তবু ফ্যান নাগালের বাইরে."
                : "উঁহু. Drone নামলো u এর মাথায়, আর সেটা line এর বাইরে. দুইটা direction একটা line এর চেয়ে বেশি রং করে."}
            </Nope>
          )}
          {pick === T_RIGHT && landed && (
            <div className={`${FADE} mt-2 flex items-center justify-center gap-3`}>
              <span className="text-[0.9rem] text-accent-text">একটা হেলানো sheet. ফ্যান তার বাইরে.</span>
              <button type="button" onClick={() => setRound2(true)} className={`${primaryBtn} h-9! px-4! text-sm`}>
                দুই নম্বর round
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
          <div className="text-center text-sm text-muted">চারটা button. কোনটা খুললেও পুরা ঘর রং থাকে?</div>
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
          {drop !== null && !won && <Nope key={miss2}>উঁহু. ওটা খুলতেই ঘর চুপসে একটা sheet. খুঁজুন সেই দুইটা button, যারা একই দিকে ঠেলে.</Nope>}
          {won && <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>এখনো পুরা ঘর. ওটা শুধু আরেকটা button এর কাজ আবার করছিল.</div>}
        </>
      )}
      <Task done={won}>{round2 ? "যে button টা খুললেও পুরা ঘর থাকে, সেটায় tap করুন." : "লম্বা দুইটা button কী রং করে, সেই ছবিটা বেছে নিন."}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for the Try-it's explanation, no task: short buttons paint a
//      tilted sheet; stretched long, they paint the very same sheet; the fan
//      stays off it.

const X7_SHORT: V3[] = [
  [2, 0, 1],
  [0, 2, 0.5],
];
const X7_SAY = [
  "দুইটা ছোট button: (2, 0, 1) আর (0, 2, 0.5).",
  "এরা রং করে একটা হেলানো sheet.",
  "এবার দুইটাকেই টেনে দ্বিগুণ লম্বা করি.",
  "ঠিক সেই একই sheet. আর ফ্যান এখনো তার বাইরে.",
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
// 9a · A story scene for the Try-it's setup, no task: Nasib's new idea. He
//      holds up his remote and says make both buttons long; two arrows
//      stretch out of it; then his two long buttons, (4, 0, 2) and (0, 4, 1),
//      as cards. What they paint is the exercise.

function S9Arrow({ to, color, len }: { to: XY; color: string; len: number }) {
  const [x0, y0] = [150, 116];
  const ux = to[0] - x0;
  const uy = to[1] - y0;
  const l = Math.hypot(ux, uy);
  const [ex, ey] = [x0 + (ux / l) * len, y0 + (uy / l) * len];
  const [nx, ny] = [ux / l, uy / l];
  return (
    <g>
      <path d={`M${x0} ${y0}L${ex - nx * 6} ${ey - ny * 6}`} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <path d={`M${ex} ${ey}L${ex - nx * 8 - ny * 4} ${ey - ny * 8 + nx * 4}L${ex - nx * 8 + ny * 4} ${ey - ny * 8 - nx * 4}Z`} fill={color} />
    </g>
  );
}

export function NasibStretches({}: Story) {
  const s = useScene(3, [600, 2400, 2200, 2400]);
  const k = s.k;
  const len = useTween([k >= 1 ? 72 : 22], 900)[0];

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={S5_G} label="Nasib holds up his remote and says make the two buttons very long, then they will reach everywhere; two arrows stretch out of the remote; his buttons are (4, 0, 2) and (0, 4, 1)">
        <S5Fan dust />
        <S9Arrow to={[216, 80]} color="#2563eb" len={len} />
        <S9Arrow to={[220, 108]} color="#e0664f" len={len} />
        <CastPerson who="nasib" x={116} y={S5_G + 16} arm="hold" mood="smug" />
        <MvTag x={116} y={S5_G + 26} name="নাসিব" />
        <MvRemote x={140} y={S5_G - 30} n={2} s={0.8} />
        {k === 1 && <Bubble x={116} y={S5_G - 50} side="right" lines={["button দুইটা অনেক", "লম্বা বানাই."]} />}
        {k === 2 && <Bubble x={116} y={S5_G - 50} side="right" lines={["তাহলেই সব জায়গায়", "পৌঁছাবে."]} />}
        {k >= 3 && (
          <>
            <CastCard x={252} y={58} text="(4, 0, 2)" tone="blue" />
            <CastCard x={252} y={82} text="(0, 4, 1)" tone="coral" />
          </>
        )}
        <CastPerson who="fahim" x={40} y={S5_G + 16} mood={k >= 2 ? "puzzled" : "plain"} />
        <MvTag x={40} y={S5_G + 26} name="ফাহিম" />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9¾ · A figure for the Try-it's explanation, no task: four buttons in the
//      room. (1, 0, 0) pressed three times walks to (3, 0, 0): the same way.
//      So (3, 0, 0) is extra, and taken off the room stays full. Then the
//      counts: two is always too few, four always one too many.

const X9B_SAY = [
  "ঘরে চারটা button. পুরা ঘর রং.",
  "(1, 0, 0) তিনবার চাপলেই (3, 0, 0). একই দিকে ঠেলে.",
  "তাই (3, 0, 0) বাড়তি. খুলে ফেললেও পুরা ঘর রং.",
  "ঘরে দুই সবসময় কম, আর চার সবসময় একটা বেশি.",
];

export function FourInRoom() {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;
  const chip = (bad: boolean) => `rounded-lg border-2 px-2 py-0.5 ${bad ? "border-danger/50 bg-danger/5 text-danger" : "border-accent bg-accent/10 text-accent-text"}`;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X9B_SAY[k]}</span>}>
      <svg viewBox={`0 0 ${XV.W} ${XV.H}`} className="mx-auto block h-auto w-full max-w-[12rem]" role="img" aria-label="four buttons in the room: (3, 0, 0) is three presses of (1, 0, 0); without it the room is still full">
        <RoomBox v={XV} fan={false} />
        <SpanPaint v={XV} s={{ kind: "room", pts: [] }} />
        {FOUR.map((key) => (
          <Arrow3 key={key.name} v={XV} to={key.v} tone={key.tone} w={key.name === "(3, 0, 0)" ? 4 : 2.4} faint={(k === 1 && key.name !== "(3, 0, 0)" && key.name !== "(1, 0, 0)") || (k >= 2 && key.name === "(3, 0, 0)")} />
        ))}
        {k === 1 &&
          [1, 2].map((i) => (
            <g key={i} className={POP}>
              <Arrow3 v={XV} from={[i, 0, 0]} to={[i + 1, 0, 0]} tone="blue" />
            </g>
          ))}
      </svg>
      {k >= 3 && (
        <div className={`${FADE} mt-1 flex justify-center gap-1.5 text-xs font-semibold`}>
          <span className={chip(true)}>2: কম</span>
          <span className={chip(false)}>3</span>
          <span className={chip(true)}>4: একটা বেশি</span>
        </div>
      )}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10a · A story scene for the last step's setup, no task: evening. The
//       drone rises to the fan and the dust comes down; Fahim holds up the
//       new three-button remote; Som says it.

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
        <MvTag x={70} y={S5_G + 26} name="ফাহিম" />
        <MvRemote x={94} y={S5_G - 30} n={3} s={0.8} />
        <Robot x={112} y={S5_G + 16} />
        <CastPerson who="ammu" x={204} y={S5_G + 16} facing={-1} arm="hold" mood={k >= 2 ? "happy" : "plain"} />
        <MvTag x={204} y={S5_G + 26} name="আম্মু" />
        <CastPerson who="som" x={262} y={S5_G + 16} facing={-1} mood={k >= 3 ? "happy" : "plain"} arm={k >= 3 ? "wave" : "down"} />
        <MvTag x={262} y={S5_G + 26} name="সোম" />
        {k >= 3 && <Bubble x={262} y={S5_G - 52} side="left" lines={["Floor এ দুই.", "ঘরে তিন."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10 · The bet settled. Tap each claim to open its verdict, with a small
//     picture of why: the shopkeeper's extra button crossed out, Nasib's one
//     line, Som's 2 and 3.

const VERDICTS: { who: string; claim: string; ok: boolean; why: string; pic: "extra" | "line" | "count" }[] = [
  { who: "দোকানদার", claim: "Button যত বেশি, তত নিরাপদ.", ok: false, why: "তিনের পরে প্রতিটা button বাড়তি. একই ঘর, বেশি টাকা.", pic: "extra" },
  { who: "নাসিব", claim: "ঠিক দিকে তাক করা একটা button ই যথেষ্ট.", ok: false, why: "এক button রং করে একটা line, যেদিকেই তাক করুন.", pic: "line" },
  { who: "সোম", claim: "যে-ই বানাক, সংখ্যা একই.", ok: true, why: "Floor এ সবসময় 2. ঘরে সবসময় 3.", pic: "count" },
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
          <Reach f={V8_F} keys={[{ name: "n", v: [2, 1], tone: "coral" }]} />
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
    if (next.length === VERDICTS.length) pass("Floor এ 2, ঘরে 3, যে-ই বানাক.");
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
                  <span className={`text-sm ${on ? (r.ok ? "text-accent-text" : "text-danger") : "text-muted"}`}>{on ? (r.ok ? "✓ ঠিক" : "✕ ভুল") : "খুলুন"}</span>
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
          সোম জিতলো. বাড়তি কিছু নাই, সব জায়গায় পৌঁছায়: basis. কয়টা লাগে, সেটাই dimension.
        </div>
      )}
      <Task done={all}>তিনটা দাবি একটা একটা করে খুলুন, আর আপনার বাজির সাথে মিলিয়ে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for the last step's explanation, no task: the floor with its
//      two buttons beside the room with its three, and the two counts.

const X8_F = makeFrame(-1, 3, -1, 3, 15, 6);
const X8_SAY = ["বাসায় নিয়ে যাওয়ার মতো দুইটা সংখ্যা.", "Floor: দুই button, বাড়তি কিছু নাই. Dimension 2.", "ঘর: তিন button, বাড়তি কিছু নাই. Dimension 3."];

export function TwoAndThree() {
  const s = useScene(2, [600, 1700, 1900]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X8_SAY[k]}</span>}>
      <div className="flex items-end justify-center gap-3">
        <div className={`w-[6rem] transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-40"}`}>
          <Plane f={X8_F} grid={1} axes={false} label="the floor: two buttons" className="my-0! max-w-none">
            {k >= 1 && <Reach f={X8_F} keys={DROP_KEYS.slice(0, 2)} />}
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
            ঘর{k >= 2 && <span className={`${POP} ml-1 font-mono text-base text-accent-text`}>3</span>}
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
  FiftyEach: { start: { k: 0 }, extra: { k: 2 }, end: {} },
  FiveOnCounter: { start: { k: 0 }, two: { k: 1 }, end: {} },
  BasisMiddle: { start: { k: 0 }, drop: { k: 1 }, marks: { k: 3 }, end: {} },
  FloorsOwnNumber: { start: { k: 0 }, merge: { k: 1 }, name: { k: 2 }, end: {} },
  SomThird: { start: { k: 0 }, third: { k: 2 }, end: {} },
  SlotsCount: { start: { k: 0 }, floor: { k: 2 }, end: {} },
  ThreeTraps: { copy: { k: 1 }, flat: { k: 2 }, end: {} },
  NasibStretches: { start: { k: 0 }, long: { k: 1 }, end: {} },
  FourInRoom: { walk: { k: 1 }, extra: { k: 2 }, end: {} },
  DropOne: { start: {}, two: { kept: [true, true, false], saw2: true }, one: { kept: [true, false, false], saw2: true, saw1: true } },
  TwoJobs: { start: { k: 0 }, mid: { k: 2 }, end: {} },
  ShopShelf: {
    start: {},
    wrong: { at: 1, filed: ["basis"], wrong: "basis", miss: 1, probe: { bin: "basis", at: 1 } },
    wrongMiss: { at: 0, wrong: "misses", miss: 1, probe: { bin: "misses", at: 0 } },
    wrongExtra: { at: 0, wrong: "extra", miss: 1, probe: { bin: "extra", at: 0 } },
    right: { at: 2, filed: ["basis", "extra"], probe: { bin: "misses", at: 2 } },
    done: { at: 4, filed: ["basis", "extra", "misses", "basis", "extra"] },
  },
  TwoFails: { walk: { k: 2 }, end: {} },
  AnyPairTwo: {
    start: {},
    three: { tips: [[2, 1], [-1, 2], [1, -2]], tried3: true },
    basis: { tips: [[2, 1], [-1, 2]], kept: ["(−1, 2) (2, 1)"], tried3: true },
    done: { tips: [[1, 1], [1, -2]], kept: ["(−1, 2) (2, 1)", "(1, 0) (2, 3)", "(1, −2) (1, 1)"], tried3: true },
  },
  ThreeDesigners: { mid: { k: 1 }, end: {} },
  DroneUnderFan: { start: { k: 0 }, slide: { k: 1 }, fahim: { k: 2 }, end: {} },
  OneAimed: { start: {}, fan: { aim: 0, tried: [0] }, web: { aim: 1, tried: [0, 1] } },
  OneLine: { floor: { k: 1 }, end: {} },
  AmmuSpots: { start: { k: 0 }, almirah: { k: 1 }, clock: { k: 2 }, end: {} },
  TwoAimed: { start: {}, guessed: { guess: 0 }, one: { guess: 0, aimed: [0, 1], pairs: ["0,1"] }, over: { guess: 0, aimed: [2, 3], pairs: ["0,1", "2,3"] } },
  SheetTilts: { floor: { k: 1 }, tilt: { k: 2 }, end: {} },
  ThirdButton: { start: {}, three: { aimed: [0, 1, 2], trios: ["0,1,2"] }, four: { aimed: [0, 1, 2, 3], trios: ["0,1,2"], tried4: true } },
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
