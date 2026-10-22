"use client";

import { useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Ticks, primaryBtn, quietBtn, usePlay, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { Gauge, GroundShadow, PArrow, PH, Ripple, Sheet, Tag, Txt, WrongMark, chip, fontFor, textW, toneHex, useWalk, type PhTone } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 12 — পড়ন্ত বস্তু"
// (src/content/articles/physics_for_high_school/12_falling_bodies.mdx), the
// journey of video EP 12 (physics_9_10/12-falling-bodies/script.md). Book
// §2.8, pp. 48–49.
//
// The spine: a water bottle and a sheet of paper, let go together from the
// ছাদ. Which lands first? The reader bets (DropBet) and it is settled on the
// last screen. On the way, the video's own beats in order: তিথি tries it and
// the bottle wins, so ভারী আগে পড়ে (RoofDrop, TithiVerdict), Galileo says the
// trouble is the air, not the mass (GalileoNo), the same paper crumpled lands
// almost with the bottle (CrumpleDrop, AirPush), a tube with no air drops a
// feather and a stone together (TubePump) as on the Moon in 1971 (MoonDrop),
// every thing gets the same ত্বরণ g (GPick, FirstLaw), the old equations with
// s → h and a → g (EqSwap), v = gt (FallClock), h = ½gt² (HeightPick,
// OneFourNine), and the reader's turn with three things at 3 s (FallThree).
//
// Canon (the video's): g = 9.8 m/s²; from rest v = 9.8, 19.6, 29.4 m/s and
// h = 4.9, 19.6, 44.1 m at 1, 2, 3 s; the Moon drop was 1971 (Apollo 15).
// The landing times in air are not numbers in the video, so the screens show
// only which lands first.

type Story = { story?: boolean };
type P = [number, number];

const G0 = 9.8;
const vAt = (t: number) => G0 * t;
const hAt = (t: number) => 0.5 * G0 * t * t;
const fmt = (n: number, d = 1) => n.toFixed(d);

// ---------------------------------------------------------------------------
// Drawn pieces, as stickers (one ink line, a warm fill): the bottle, the paper
// (flat, half crumpled, a ball), the feather, the hammer, the stone, the
// cricket ball, the ছাদ from the side and from the front, the astronaut.
// Each keeps its ink line ~1 px at any `s`.

const INK = PH.ink;

/** তিথির পানিভর্তি বোতল, centre at p; its bottom is 11·s below p. */
export function Bottle({ p, rot = 0, s = 1, ghost = false }: { p: P; rot?: number; s?: number; ghost?: boolean }) {
  const sw = 1.05 / s;
  const body = "M-2.4 -10.6H2.4L5 -7.2V9A2 2 0 0 1 3 11H-3A2 2 0 0 1 -5 9V-7.2Z";
  return (
    <g transform={`translate(${p[0]} ${p[1]}) rotate(${rot}) scale(${s})`} opacity={ghost ? 0.35 : 1} className="pointer-events-none">
      <path d={body} fill="#eef7fd" />
      <path d="M-5 -2.5H5V9A2 2 0 0 1 3 11H-3A2 2 0 0 1 -5 9Z" fill="#a5d8f5" />
      <rect x={-5} y={-0.6} width={10} height={3.2} fill={PH.creamSoft} />
      <path d={body} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <rect x={-2.9} y={-14.2} width={5.8} height={3.6} rx={0.9} fill={PH.blue} stroke={INK} strokeWidth={sw} />
    </g>
  );
}

/** কাগজ, centre at p: 0 = the flat sheet, 1 = half crumpled, 2 = a ball. */
export function Paper({ p, rot = 0, crumple = 0, s = 1, ghost = false }: { p: P; rot?: number; crumple?: 0 | 1 | 2; s?: number; ghost?: boolean }) {
  const sw = 1.05 / s;
  return (
    <g transform={`translate(${p[0]} ${p[1]}) rotate(${rot}) scale(${s})`} opacity={ghost ? 0.35 : 1} className="pointer-events-none">
      {crumple === 0 && (
        <g>
          <path d="M-15 -4L13 -7L15 4L-13 7Z" fill="#fffdf7" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d="M-9 -2L8 -4M-9 1.5L9 -0.5M-8 4.5L6 3" stroke="#d6cfc2" strokeWidth={0.7 / s + 0.2} />
        </g>
      )}
      {crumple === 1 && (
        <g>
          <path d="M-10 -2L-6 -8L1 -9L8 -5L10 2L5 8L-2 9L-8 5Z" fill="#fffdf7" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
          <path d="M-6 -8L-1 -1L8 -5M-1 -1L-2 9M-1 -1L10 2" stroke="#d6cfc2" strokeWidth={0.7 / s + 0.2} fill="none" />
        </g>
      )}
      {crumple === 2 && (
        <g>
          <circle r={6.5} fill="#fffdf7" stroke={INK} strokeWidth={sw} />
          <path d="M-4 -3L0 -1L3 -4M0 -1L1 4M-4 2L1 4L4 2" stroke="#cbbfa8" strokeWidth={0.7 / s + 0.2} fill="none" />
        </g>
      )}
    </g>
  );
}

/** A feather, centre at p, about 26·s long. */
export function Feather({ p, rot = 18, s = 1, ghost = false }: { p: P; rot?: number; s?: number; ghost?: boolean }) {
  const sw = 1.05 / s;
  return (
    <g transform={`translate(${p[0]} ${p[1]}) rotate(${rot}) scale(${s})`} opacity={ghost ? 0.35 : 1} className="pointer-events-none">
      <path d="M0 -13C7 -8 7 5 0 10C-7 5 -7 -8 0 -13Z" fill="#fffdf7" stroke={INK} strokeWidth={sw} />
      <path d="M0 -6l4 -2.5M0 -1l5 -2.5M0 4l4 -2M0 -6l-4 -2.5M0 -1l-5 -2.5M0 4l-4 -2" stroke="#d6cfc2" strokeWidth={0.7 / s + 0.2} />
      <path d="M0 -12V14" stroke={PH.cream} strokeWidth={1.3 / s + 0.3} strokeLinecap="round" />
    </g>
  );
}

/** A hammer, centre at p; its bottom is 10·s below p. */
function Hammer({ p, s = 1 }: { p: P; s?: number }) {
  const sw = 1.05 / s;
  return (
    <g transform={`translate(${p[0]} ${p[1]}) scale(${s})`} className="pointer-events-none">
      <rect x={-1.8} y={-8} width={3.6} height={18} rx={1.2} fill="#c08458" stroke={INK} strokeWidth={sw} />
      <rect x={-8} y={-13} width={16} height={6} rx={1.4} fill="#a3adb8" stroke={INK} strokeWidth={sw} />
    </g>
  );
}

/** A stone, centre at p, radius 6.5·s; `tone` rings it mint (right) or red. */
function Pebble({ p, s = 1, tone }: { p: P; s?: number; tone?: "mint" | "red" }) {
  const r = 6.5 * s;
  return (
    <g className="pointer-events-none">
      <path d={`M${p[0] - r} ${p[1] + r * 0.1}C${p[0] - r} ${p[1] - r * 0.9} ${p[0] + r * 0.9} ${p[1] - r * 1.05} ${p[0] + r} ${p[1] - r * 0.05}C${p[0] + r * 1.05} ${p[1] + r * 0.85} ${p[0] - r * 0.9} ${p[1] + r * 1.05} ${p[0] - r} ${p[1] + r * 0.1}Z`} fill="#b9ae9f" stroke={tone ? (tone === "mint" ? PH.mint : PH.red) : INK} strokeWidth={tone ? 2 : 1.05} />
      <circle cx={p[0] - r * 0.3} cy={p[1] - r * 0.35} r={r * 0.22} fill="#e7e1d6" />
    </g>
  );
}

/** টুটুলের ক্রিকেট বল, centre at p. */
function CricketBall({ p, r = 5 }: { p: P; r?: number }) {
  return (
    <g className="pointer-events-none">
      <circle cx={p[0]} cy={p[1]} r={r} fill="#c2410c" stroke={INK} strokeWidth={0.9} />
      <path d={`M${p[0] - r * 0.7} ${p[1] - r * 0.6}Q${p[0]} ${p[1]} ${p[0] - r * 0.7} ${p[1] + r * 0.6}`} stroke="#fde68a" strokeWidth={0.7} fill="none" />
    </g>
  );
}

/** The plain ball of the equation screens, centre at (x, y). */
function FallBall({ x, y, r = 8, ghost = false }: { x: number; y: number; r?: number; ghost?: boolean }) {
  return (
    <g opacity={ghost ? 0.22 : 1} className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill="#b9ae9f" stroke={INK} strokeWidth={1.05} />
      {!ghost && <circle cx={x - r * 0.32} cy={y - r * 0.34} r={r * 0.22} fill="#e7e1d6" />}
    </g>
  );
}

const SOFT: Record<PhTone, string> = { mint: PH.mintSoft, amber: PH.amberSoft, blue: PH.blueSoft, red: PH.redSoft, ink: "#f1f5f9", cream: PH.creamSoft };
const MONO = fontFor("0");

/** A tag for Latin text with spaces and dots (`1 s · 4.9 m`), sized for monospace. */
function MTag({ x, y, text, tone = "amber", solid = false, pop = false, size = 9 }: { x: number; y: number; text: string; tone?: PhTone; solid?: boolean; pop?: boolean; size?: number }) {
  const w = text.length * size * 0.56 + 12;
  const h = size + 8;
  const c = toneHex(tone);
  return (
    <g className={`pointer-events-none ${pop ? POP : ""}`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={solid ? c : SOFT[tone]} stroke={c} strokeWidth={1.1} />
      <text x={x} y={y + size * 0.36} fontSize={size} textAnchor="middle" fontWeight={700} fill={solid ? "#fff" : c} style={{ fontFamily: MONO }}>
        {text}
      </text>
    </g>
  );
}

/** A law card: the Bangla name, then the formula in monospace (∝ has no Bangla glyph). */
function LawCard({ x, y, name, f, size = 9.5 }: { x: number; y: number; name: string; f: string; size?: number }) {
  const w = textW(name, size) + f.length * size * 0.56 + 18;
  const h = size + 9;
  return (
    <g className={`pointer-events-none ${POP}`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={PH.mint} stroke={PH.mint} strokeWidth={1.1} />
      <text x={x} y={y + size * 0.36} fontSize={size} fontWeight={700} fill="#fff" textAnchor="middle">
        <tspan>{name} </tspan>
        <tspan style={{ fontFamily: MONO }}>{f}</tspan>
      </text>
    </g>
  );
}

/** A thing that has just hit the ground: a small puff of dust either side of its foot. */
function Thud({ x, y }: { x: number; y: number }) {
  return (
    <g className={`pointer-events-none ${POP}`}>
      {[-1, 1].map((d) => (
        <g key={d} fill="#d8d0c1">
          <circle cx={x + d * 11} cy={y - 2.5} r={2.6} />
          <circle cx={x + d * 16} cy={y - 4.5} r={1.8} />
          <circle cx={x + d * 19.5} cy={y - 1.8} r={1.3} />
        </g>
      ))}
    </g>
  );
}

/** What the drawing says after it has answered: the words come a beat after the picture. */
function Later({ children, ms = 450 }: { children: ReactNode; ms?: number }) {
  return (
    <g style={{ transitionDelay: `${ms}ms` }} className={`pointer-events-none ${FADE}`}>
      {children}
    </g>
  );
}

/**
 * The timing function for a fall from rest, as a CSS cubic-bezier: y ∝ t²
 * exactly. `from` = how far along in time the step starts (0 = let go now,
 * 0.5 = already falling for half the step's end time).
 */
const fallEase = (from = 0) => `cubic-bezier(0.333, ${((2 * from) / (1 + from) / 3).toFixed(3)}, 0.667, ${(1 - 2 / (1 + from) / 3).toFixed(3)})`;

// The ছাদ from the side, for every drop: the house on the left, the roof at
// DS.ROOF, the ground at DS.G. Things are let go at DS.Y0, past the edge.
// DS.S = how big the things are drawn here (the drop is the subject).
const DS = { W: 300, H: 200, G: 186, ROOF: 46, EDGE: 116, Y0: 32, S: 1.5 };
const SKY_BG = "#eef4fa";
const GRASS = "#e3ecd4";

function RoofSide({ label, children, className = "max-w-[20rem]" }: { label: string; children?: ReactNode; className?: string }) {
  const { W, H, G, ROOF, EDGE } = DS;
  return (
    <Sheet w={W} h={H} label={label} bg={SKY_BG} className={className}>
      <path d={`M1.5 ${G}H${W - 1.5}V${H - 14}A12 12 0 0 1 ${W - 13.5} ${H - 2.5}H13.5A12 12 0 0 1 1.5 ${H - 14}Z`} fill={GRASS} className="pointer-events-none" />
      <path d={`M1.5 ${G}H${W - 1.5}`} stroke="#c5d1b1" strokeWidth={1} className="pointer-events-none" />
      <g className="pointer-events-none">
        <GroundShadow x={(14 + EDGE) / 2} y={G + 1.5} rx={58} ry={3.4} />
        <rect x={20} y={ROOF} width={EDGE - 26} height={G - ROOF} fill="#f3e9d8" stroke={INK} strokeWidth={1.1} />
        {[62, 98, 134].map((wy) =>
          [32, 72].map((wx) => <rect key={`${wx}${wy}`} x={wx} y={wy} width={16} height={17} rx={1.5} fill={PH.blueSoft} stroke={INK} strokeWidth={0.8} />),
        )}
        <rect x={55} y={G - 24} width={16} height={24} rx={1.5} fill="#d9bf92" stroke={INK} strokeWidth={0.9} />
        <rect x={27} y={ROOF - 27} width={24} height={20} rx={3} fill="#e9e2d4" stroke={INK} strokeWidth={1} />
        <rect x={24} y={ROOF - 30} width={30} height={5} rx={2} fill="#d6cbb6" stroke={INK} strokeWidth={1} />
        <rect x={14} y={ROOF - 7} width={EDGE - 14} height={8} rx={1.5} fill="#e5d3b3" stroke={INK} strokeWidth={1.1} />
        <Txt x={86} y={ROOF - 11} size={7.5} color={PH.mute} weight={700}>
          ছাদ
        </Txt>
      </g>
      {children}
    </Sheet>
  );
}

/** তিথিদের ছাদ on a stage, as in EP 08: a parapet, the water tank, the next house. */
function RoofBack() {
  return (
    <g className="pointer-events-none">
      <rect x={262} y={64} width={58} height={70} fill="#e7d7c1" stroke="#a8a29e" strokeWidth={1} />
      {[270, 292].map((x) => (
        <rect key={x} x={x} y={76} width={12} height={14} rx={1} fill="#93c5fd" stroke="#64748b" strokeWidth={0.6} />
      ))}
      <rect x={18} y={98} width={34} height={36} rx={3} fill="#94a3b8" />
      <rect x={15} y={94} width={40} height={6} rx={2} fill="#64748b" />
      <rect x={0} y={134} width={320} height={16} fill="#d6c4a8" stroke="#a8a29e" strokeWidth={0.8} />
      <text x={36} y={146} fontSize={7.5} fontWeight={700} textAnchor="middle" fill={PH.mute}>
        ছাদ
      </text>
    </g>
  );
}

// A drop through air on one clock: `k` counts ticks of 50 ms (fractional; a
// drop's useWalk runs linearly, k = t × its ticks). The bottle and the paper
// ball fall fast, from rest, y ∝ t²; the flat sheet drifts and sways at an
// even pace; the half crumpled one is in between. LAND = the tick each lands.
type Kind = "bottle" | "flat" | "half" | "ball";
const TICK = 50;
const LAND: Record<Kind, number> = { bottle: 12, ball: 13, half: 22, flat: 34 };
const FOOT: Record<Kind, number> = { bottle: 11 * DS.S, ball: 6.5 * DS.S, half: 8 * DS.S, flat: 6 * DS.S };
const SWAY: Record<Kind, number> = { bottle: 0, ball: 0, half: 6, flat: 15 };
const X_BOTTLE = 148;
const X_PAPER = 214;
const CRUMPLE: Record<Kind, 0 | 1 | 2> = { bottle: 0, flat: 0, half: 1, ball: 2 };

function airFall(kind: Kind, x0: number, k: number): { p: P; rot: number; landed: boolean; u: number } {
  const T = LAND[kind];
  const u = Math.min(1, k / T);
  const D = DS.G - FOOT[kind] - DS.Y0;
  const fast = kind === "bottle" || kind === "ball";
  const y = DS.Y0 + D * (fast ? u * u : u);
  const sway = SWAY[kind] * Math.sin(u * Math.PI * 3.2) * (1 - u * 0.4);
  const rot = u >= 1 ? (kind === "flat" ? -6 : 0) : kind === "flat" ? 26 * Math.cos(u * Math.PI * 3.2) : kind === "half" ? 40 * u : kind === "ball" ? 200 * u : 0;
  return { p: [x0 + (u >= 1 ? 0 : sway), y], rot, landed: u >= 1, u };
}

/** A thing falling through air at tick k, its shadow on the ground firming up as it comes down. */
function AirThing({ kind, x0, k, ghost = false }: { kind: Kind; x0: number; k: number; ghost?: boolean }) {
  const f = airFall(kind, x0, k);
  const near = (f.p[1] - DS.Y0) / (DS.G - DS.Y0);
  return (
    <>
      {!ghost && <ellipse cx={f.p[0]} cy={DS.G + 1.5} rx={kind === "flat" ? 20 : 11} ry={2.6} fill={INK} opacity={0.03 + 0.08 * near} className="pointer-events-none" />}
      {kind === "bottle" ? <Bottle p={f.p} rot={f.rot} s={DS.S} ghost={ghost} /> : <Paper p={f.p} rot={f.rot} crumple={CRUMPLE[kind]} s={DS.S} ghost={ghost} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: তিথি on the ছাদ, a water bottle and a sheet
// of paper in her hands; she steps to the edge; an amber ?.

export function RoofHold({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  const x = k >= 1 ? 160 : 110;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="ছাদে তিথি। এক হাতে পানিভর্তি বোতল, আরেক হাতে এক টুকরো কাগজ। দুটো একসাথে ছেড়ে দিলে কোনটা আগে পড়বে?">
        <RoofBack />
        <Person who="tithi" x={x} y={150} arm="hold" walking={k === 1} label />
        <g style={{ transform: `translate(${x}px, 0px)` }} className="pointer-events-none transition-transform duration-[1200ms] ease-out motion-reduce:transition-none">
          <Bottle p={[14, 114]} s={0.8} />
          <Paper p={[32, 112]} rot={-10} s={0.75} />
        </g>
        {k >= 2 && (
          <g>
            <Txt x={x + 16} y={78} size={20} weight={800} color={PH.amber} className={POP}>
              ?
            </Txt>
            <Tag x={160} y={24} text="কোনটা আগে?" tone="amber" pop />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 1 · The sealed bet: which lands first? The pick draws its fall as a dashed
// line and parks a ghost of it on the ground with a ?. Not marked.

const BET = ["বোতল আগে", "কাগজ আগে", "দুটো একসাথে"];

export function DropBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const first = bet === null ? [] : bet === 0 ? ["bottle"] : bet === 1 ? ["paper"] : ["bottle", "paper"];
  return (
    <>
      <RoofSide label="ছাদের কিনারে একটা পানিভর্তি বোতল আর এক টুকরো চ্যাপ্টা কাগজ। নিচে মাটি। আপনার বাজি: কোনটা আগে মাটিতে পড়বে।">
        <AirThing kind="bottle" x0={X_BOTTLE} k={0} />
        <AirThing kind="flat" x0={X_PAPER} k={0} />
        {first.map((w) => {
          const x = w === "bottle" ? X_BOTTLE : X_PAPER;
          const foot = w === "bottle" ? FOOT.bottle : FOOT.flat;
          return (
            <g key={`${bet}${w}`}>
              <path d={`M${x} ${DS.Y0 + 24}V${DS.G - foot - 22}`} stroke={PH.amber} strokeWidth={1.4} strokeDasharray="3 3" className={`pointer-events-none ${FADE}`} />
              <g className={POP}>{w === "bottle" ? <Bottle p={[x, DS.G - foot]} s={DS.S} ghost /> : <Paper p={[x, DS.G - foot]} rot={-6} s={DS.S} ghost />}</g>
              <Tag x={x} y={DS.G - 44} text="আগে?" tone="amber" pop />
            </g>
          );
        })}
      </RoofSide>
      <div className="mt-3 grid gap-2">
        {BET.map((o, i) => (
          <Choice
            key={o}
            n={i}
            look={bet === i ? "picked" : bet !== null ? "dim" : "idle"}
            disabled={bet !== null}
            onClick={() => {
              setBet(i);
              sfx.stamp();
              pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।");
            }}
          >
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>বোতল আর কাগজ একসাথে ছাড়লে কোনটা আগে মাটিতে পড়বে? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · তিথি tries it (video scene 2). One tap lets both go: the bottle lands
// with a thud, the paper sways down long after. The order fills in below.

const X2_N = LAND.flat + 2;

export function RoofDrop() {
  const pass = useGate();
  const [dropped, setDropped] = useSeed("dropped", false);
  const walk = useWalk(X2_N * TICK, { steps: false, ease: "linear" });
  const t = (!dropped ? 0 : walk.running ? walk.t : 1) * X2_N;
  const drop = () => {
    if (walk.running) return;
    setDropped(true);
    sfx.whoosh(0.3);
    setTimeout(() => sfx.thump(), LAND.bottle * TICK);
    walk.start(() => {
      sfx.paper();
      pass("বোতল আগে পড়লো, কাগজ অনেক পরে।");
    });
  };
  const bottleDown = t >= LAND.bottle;
  const paperDown = t >= LAND.flat;
  return (
    <>
      <RoofSide label="ছাদের কিনার থেকে বোতল আর চ্যাপ্টা কাগজ একসাথে ছাড়া হবে। কোনটা আগে মাটিতে পড়ে, দেখা যাবে।">
        <AirThing kind="bottle" x0={X_BOTTLE} k={t} />
        <AirThing kind="flat" x0={X_PAPER} k={t} />
        {bottleDown && <Thud x={X_BOTTLE} y={DS.G} />}
        {bottleDown && <Tag x={X_BOTTLE} y={DS.G - 46} text="ধপাস!" tone="amber" pop />}
      </RoofSide>
      <div className="mx-auto mt-2 flex w-full max-w-[20rem] items-center justify-center gap-2 text-sm">
        <span className="text-muted">প্রথমে:</span>
        <span className={`min-w-14 rounded-md border px-2 py-0.5 text-center font-semibold ${bottleDown ? `border-cat-amber text-cat-amber ${FADE}` : "border-dashed border-border text-muted"}`}>{bottleDown ? "বোতল" : "?"}</span>
        <span className="text-muted">তারপর:</span>
        <span className={`min-w-14 rounded-md border px-2 py-0.5 text-center font-semibold ${paperDown ? `border-border ${FADE}` : "border-dashed border-border text-muted"}`}>{paperDown ? "কাগজ" : "?"}</span>
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={dropped ? quietBtn : primaryBtn} disabled={walk.running} onClick={drop}>
          {dropped ? "আবার ছাড়ুন" : "ছেড়ে দিন"}
        </button>
      </div>
      <Task done={dropped && !walk.running}>ছাদ থেকে বোতল আর কাগজ একসাথে ছেড়ে দিন। কোনটা আগে মাটিতে পড়ে?</Task>
    </>
  );
}

// 2½ · Figure for screen 2's explanation: the bottle down, the paper still on
// its way; তিথি says it, and her claim gets a red tag.

const S2_SAY = ["বোতল ধপাস করে আগে পড়লো, কাগজ দুলতে দুলতে অনেক পরে।", "তিথির সিদ্ধান্ত: ভারী জিনিস আগে পড়ে।"];

export function TithiVerdict({}: Story) {
  const s = useScene(1, [600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S2_SAY[k]}</span>}>
      <Sheet w={300} h={150} label="বোতল মাটিতে, কাগজ তখনও দুলতে দুলতে নামছে। তিথি বলছে, ভারী জিনিস আগে পড়ে।" className="max-w-[18rem]">
        <path d="M1.5 132H298.5V136A12 12 0 0 1 286.5 147.5H13.5A12 12 0 0 1 1.5 136Z" fill={GRASS} className="pointer-events-none" />
        <path d="M1.5 132H298.5" stroke="#c5d1b1" strokeWidth={1} className="pointer-events-none" />
        <Person who="tithi" x={66} y={132} label arm={k >= 1 ? "point" : "down"} />
        <GroundShadow x={196} y={133.5} rx={11} />
        <Bottle p={[196, 132 - 11 * DS.S]} s={DS.S} />
        <Thud x={196} y={132} />
        <g style={{ transform: `translate(0px, ${k >= 1 ? 30 : 0}px)` }} className="transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
          <Paper p={[250, 52]} rot={k >= 1 ? -18 : 20} s={DS.S} />
        </g>
        {k >= 1 && <Bubble x={66} y={62} side="right" lines={["ভারী জিনিস", "আগে পড়ে!"]} />}
        {k >= 1 && <Tag x={136} y={22} text="ভারী আগে?" tone="red" solid pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · Story scene for screen 3 (video scene 3): for 2000 years the board
// said ভারী আগে পড়ে; Galileo's portrait comes up and says না; the chip ভর না,
// বাতাস, and the old claim is struck through.

export function GalileoNo({}: Story) {
  const s = useScene(2, [600, 1400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="দেয়ালে পুরোনো কথা: ভারী আগে পড়ে, দুই হাজার বছর ধরে। পাশে বিজ্ঞানী Galileo-র ছবি। তিনি বললেন, না। ভর না, বাতাস।">
        <rect x={26} y={50} width={124} height={50} rx={4} fill="#fffbeb" stroke="#a16207" strokeWidth={1.2} />
        <text x={88} y={81} fontSize={13} fontWeight={700} textAnchor="middle" fill={PH.ink}>
          ভারী আগে পড়ে
        </text>
        <Tag x={88} y={40} text="2000 বছর ধরে" tone="amber" />
        {k >= 2 && <path d="M36 77H140" stroke={PH.red} strokeWidth={2.4} strokeLinecap="round" className={FADE} />}
        {k >= 1 && (
          <g className={POP}>
            <rect x={190} y={34} width={66} height={78} rx={3} fill="#fef3c7" stroke="#92400e" strokeWidth={3} />
            <path d="M206 98C214 78 228 58 244 46C238 64 226 84 210 100Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth={0.9} />
            <path d="M244 46L204 104" stroke="#a8a29e" strokeWidth={1} />
            <rect x={196} y={116} width={54} height={13} rx={3} fill="#fff" stroke="#92400e" strokeWidth={0.8} />
            <Txt x={223} y={126} size={8.5} weight={700}>
              Galileo
            </Txt>
          </g>
        )}
        {k >= 1 && <Bubble x={198} y={40} side="left" lines={["না।"]} />}
        {k >= 2 && <Tag x={160} y={160} text="ভর না, বাতাস" tone="mint" solid size={10.5} pop />}
      </Stage>
    </StoryFrame>
  );
}

// 3 · The paper ball (video scene 4). Each tap crumples the same paper more
// (flat → half → a ball), and a chip says ভর একই. Then both go: the flat or
// half sheet still lags; the ball lands almost with the bottle.

const X3_NOPE = ["কাগজ এখনো চ্যাপ্টা, তাই দুলে দুলে অনেক পরে নামলো। আগে দলা পাকান।", "আধা দলা কাগজ আগের চেয়ে তাড়াতাড়ি নামলো, তবু অনেক পরে। আরও দলা পাকান।", ""];
const KIND_OF: Kind[] = ["flat", "half", "ball"];

export function CrumpleDrop() {
  const pass = useGate();
  const [crumple, setCrumple] = useSeed<0 | 1 | 2>("crumple", 0);
  const [drop, setDrop] = useSeed<0 | 1 | 2 | null>("drop", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk((LAND[KIND_OF[crumple]] + 2) * TICK, { steps: false, ease: "linear" });
  const kind = KIND_OF[drop ?? crumple];
  const n = LAND[kind] + 2;
  const t = (drop === null ? 0 : walk.running ? walk.t : 1) * n;
  const end = drop !== null && !walk.running;
  const right = end && drop === 2;
  const squeeze = () => {
    if (walk.running || crumple >= 2) return;
    setCrumple((crumple + 1) as 1 | 2);
    setDrop(null);
    sfx.paper();
  };
  const go = () => {
    if (walk.running) return;
    const c = crumple;
    setDrop(c);
    sfx.whoosh(0.3);
    setTimeout(() => sfx.thump(), LAND.bottle * TICK);
    walk.start(() => {
      if (c === 2) {
        sfx.chime();
        pass("একই ভর, তবু এবার প্রায় একসাথে।");
      } else setMiss((m) => m + 1);
    });
  };
  const paperDown = t >= LAND[kind];
  // A wrong drop stops the picture where it went wrong: where the paper was when the bottle hit.
  const lag = end && !right ? airFall(kind, X_PAPER, LAND.bottle) : null;
  return (
    <>
      <RoofSide label="ছাদের কিনারে বোতল আর সেই কাগজ। কাগজটা দলা পাকানো যায়, ভর একই থাকে। তারপর দুটো একসাথে ছাড়া হবে।">
        <AirThing kind="bottle" x0={X_BOTTLE} k={t} />
        <AirThing kind={kind} x0={X_PAPER} k={t} />
        {crumple >= 1 && drop === null && <Tag key={crumple} x={X_PAPER} y={DS.Y0 + 28} text="ভর একই" tone="mint" pop />}
        {t >= LAND.bottle && <Thud x={X_BOTTLE} y={DS.G} />}
        {paperDown && <Thud x={X_PAPER} y={DS.G} />}
        {lag && <AirThing kind={kind} x0={X_PAPER} k={LAND.bottle} ghost />}
        {lag && <WrongMark x={lag.p[0] + 30} y={lag.p[1] - 8} />}
        {right && <Ripple at={[(X_BOTTLE + X_PAPER) / 2, DS.G - 4]} r={44} />}
        {right && (
          <Later>
            <Tag x={(X_BOTTLE + X_PAPER) / 2} y={DS.G - 48} text="প্রায় একসাথে!" tone="mint" solid />
          </Later>
        )}
      </RoofSide>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button type="button" className={quietBtn} disabled={walk.running || crumple >= 2 || right} onClick={squeeze}>
          দলা পাকান
        </button>
        <button type="button" className={primaryBtn} disabled={walk.running || right} onClick={go}>
          ছেড়ে দিন
        </button>
      </div>
      <Ticks items={[["দলা পাকানো বল", crumple >= 2], ["একসাথে ছাড়া", right]]} />
      {end && drop !== 2 && <Nope key={miss}>{X3_NOPE[drop]}</Nope>}
      <Task done={right}>কাগজটা দলা পাকিয়ে বল বানান, তারপর বোতলের সাথে ছেড়ে দিন।</Task>
    </>
  );
}

// 3½ · Figure for screen 3's explanation (video scene 5): air pushes up under
// the flat sheet, many arrows; under the ball, only a little one.

const S3_SAY = ["চ্যাপ্টা কাগজকে বাতাস নিচ থেকে ঠেলে আটকে রাখছিল।", "দলা পাকালে বাতাসের বাধা কমে যায়।"];

export function AirPush({}: Story) {
  const s = useScene(1, [600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S3_SAY[k]}</span>}>
      <Sheet w={300} h={140} label="বাঁয়ে চ্যাপ্টা কাগজ, নিচ থেকে বাতাস অনেকগুলো তীর দিয়ে ঠেলছে। ডানে কাগজের বল, নিচে ছোট্ট একটা তীর।" className="max-w-[18rem]" bg={SKY_BG}>
        <Paper p={[86, 50]} rot={-4} s={2.2} />
        {[52, 69, 86, 103, 120].map((x, i) => (
          <PArrow key={x} a={[x, 112]} b={[x, 72]} tone="blue" w={2} draw delay={i * 90} tell="বাতাসের বাধা, উপরে" />
        ))}
        <Txt x={86} y={130} size={9} color={PH.mute}>
          চ্যাপ্টা কাগজ
        </Txt>
        {k >= 1 && (
          <g className={FADE}>
            <Paper p={[222, 54]} crumple={2} s={2.2} />
            <PArrow a={[222, 96]} b={[222, 76]} tone="blue" w={2} draw tell="বাতাসের বাধা, উপরে" />
            <Txt x={222} y={130} size={9} color={PH.mute}>
              কাগজের বল
            </Txt>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · The tube with no air (video scene 5). A glass tube, a feather and a
// stone at the top, air in it as dots. The pump takes the air out a third at
// a time; a drop with air left has the feather lag or hang; with none, the
// two land together.

const TB = { X0: 108, X1: 192, Y0: 14, Y1: 188, FLOOR: 183, S: 1.35 };
const X4_STONE = 132;
const X4_FEATHER = 168;
const X4_LAND = 14;
const X4_N = 30;
const X4_DOTS: P[] = Array.from({ length: 18 }, (_, i) => [TB.X0 + 8 + ((i * 37) % 60), TB.Y0 + 40 + ((i * 53) % 132)]);
const X4_NOPE = ["", "পালক প্রায় নামলো, কিন্তু পাথরের অনেক পরে। নলে একটু বাতাস রয়ে গেছে।", "পাথর পড়ে গেছে, পালক এখনো নলের মাঝখানে দুলছে। নলে বাতাস আছে।", "পাথর পড়ে গেছে, পালক এখনো উপরের দিকে ভাসছে। নলে পুরো বাতাস।"];

function tubeFall(air: number, k: number) {
  const us = Math.min(1, k / X4_LAND);
  const stone: P = [X4_STONE, 34 + (TB.FLOOR - 6.5 * TB.S - 34) * us * us];
  const T = X4_LAND + 14 * air;
  const uf = Math.min(1, k / T);
  const D = TB.FLOOR - 6 - 34;
  const y = 34 + D * (air === 0 ? uf * uf : uf);
  const sway = air === 0 || uf >= 1 ? 0 : 5 * Math.sin(uf * Math.PI * 4);
  const feather: P = [X4_FEATHER + sway, y];
  const frot = uf >= 1 ? 82 : air === 0 ? 18 : 18 + 30 * Math.sin(uf * Math.PI * 4);
  return { stone, feather, frot, stoneDown: us >= 1, featherDown: uf >= 1 };
}

export function TubePump() {
  const pass = useGate();
  const [air, setAir] = useSeed("air", 3);
  const [drop, setDrop] = useSeed<number | null>("drop", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X4_N * TICK, { steps: false, ease: "linear" });
  const t = (drop === null ? 0 : walk.running ? walk.t : 1) * X4_N;
  const end = drop !== null && !walk.running;
  const right = end && drop === 0;
  const f = tubeFall(drop ?? air, t);
  // A wrong drop: the feather marked where it was when the stone hit (a ghost, if it has landed since).
  const lag = end && !right ? tubeFall(drop, X4_LAND) : null;
  const pump = () => {
    if (walk.running || air <= 0) return;
    setAir(air - 1);
    setDrop(null);
    sfx.whoosh(0.4);
  };
  const go = () => {
    if (walk.running) return;
    const a = air;
    setDrop(a);
    setTimeout(() => sfx.thump(), X4_LAND * TICK);
    walk.start(() => {
      if (a === 0) {
        sfx.chime();
        pass("বাতাস নেই, তাই পালক আর পাথর একসাথে।");
      } else setMiss((m) => m + 1);
    });
  };
  return (
    <>
      <Sheet w={300} h={200} label="একটা লম্বা কাচের নল। উপরে একটা পাথর আর একটা পালক। নলের ভেতরে বাতাস, ফোঁটা ফোঁটা করে আঁকা। পাশে বাতাস বের করার pump।" className="max-w-[20rem]">
        <GroundShadow x={(TB.X0 + TB.X1) / 2} y={TB.Y1 + 1.5} rx={46} ry={3} />
        <rect x={TB.X0} y={TB.Y0} width={TB.X1 - TB.X0} height={TB.Y1 - TB.Y0} rx={12} fill="#eef6fd" stroke={INK} strokeWidth={1.1} className="pointer-events-none" />
        <path d={`M${TB.X0 + 7} ${TB.Y0 + 12}V${TB.Y1 - 16}`} stroke="#fff" strokeWidth={3} strokeLinecap="round" className="pointer-events-none" />
        {X4_DOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2} fill="#93c5fd" opacity={i < air * 6 ? 0.9 : 0} className="pointer-events-none transition-opacity duration-500 motion-reduce:transition-none" />
        ))}
        <g className="pointer-events-none">
          <path d={`M${TB.X1} 172H232V152`} stroke={INK} strokeWidth={5.4} fill="none" strokeLinejoin="round" />
          <path d={`M${TB.X1} 172H232V152`} stroke="#d6cbb6" strokeWidth={3.2} fill="none" strokeLinejoin="round" />
          <GroundShadow x={232} y={TB.Y1 + 1.5} rx={16} />
          <g style={{ transform: `translate(0px, ${air % 2 === 0 ? 0 : 14}px)` }} className="transition-transform duration-300 motion-reduce:transition-none">
            <path d="M232 104V80" stroke={INK} strokeWidth={3} />
            <rect x={218} y={74} width={28} height={7} rx={3} fill="#c08458" stroke={INK} strokeWidth={1} />
          </g>
          <rect x={220} y={100} width={24} height={54} rx={4} fill="#e9e2d4" stroke={INK} strokeWidth={1.1} />
          <path d={`M214 ${TB.Y1}H250`} stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
          <path d={`M232 154V${TB.Y1}`} stroke={INK} strokeWidth={1.1} />
          <Txt x={250} y={132} size={8.5} anchor="start" color={PH.mute}>
            পাম্প
          </Txt>
        </g>
        {lag && f.featherDown && <Feather p={lag.feather} rot={lag.frot} s={TB.S} ghost />}
        <Pebble p={f.stone} s={TB.S} tone={right ? "mint" : undefined} />
        <Feather p={f.feather} rot={f.frot} s={TB.S} />
        {f.stoneDown && drop !== null && <Thud x={X4_STONE} y={TB.FLOOR} />}
        {lag && <WrongMark x={TB.X1 + 12} y={(f.featherDown ? lag.feather[1] : f.feather[1]) + 5} />}
        {right && <Ripple at={[(TB.X0 + TB.X1) / 2, TB.FLOOR - 6]} r={34} />}
        {right && (
          <Later>
            <Tag x={150} y={112} text="একদম একসাথে" tone="mint" solid />
          </Later>
        )}
        {air === 0 ? <Tag x={232} y={52} text="বাতাস নেই" tone="mint" solid pop /> : <Tag x={232} y={52} text="বাতাস আছে" tone="blue" />}
      </Sheet>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button type="button" className={quietBtn} disabled={walk.running || air <= 0 || right} onClick={pump}>
          বাতাস বের করুন
        </button>
        <button type="button" className={primaryBtn} disabled={walk.running || right} onClick={go}>
          ছেড়ে দিন
        </button>
      </div>
      {end && drop !== 0 && <Nope key={miss}>{X4_NOPE[drop]}</Nope>}
      <Task done={right}>নল থেকে বাতাস বের করে নিন, তারপর পালক আর পাথর একসাথে ছেড়ে দিন।</Task>
    </>
  );
}

// 4½ · Figure for screen 4's explanation (video scene 6): the Moon, 1971. An
// astronaut holds a hammer and a feather out; both fall; both land together.

const S4_SAY = ["উনিশশো একাত্তর, চাঁদে। এখানে বাতাসই নেই।", "নভোচারী হাতুড়ি আর পালক একসাথে ছেড়ে দিলেন।", "দুটো ঠিক একসাথে মাটি ছুঁলো।"];
const MOON_G = 128;
// Held at HOLD; let go at k = 1 and shown 30% of the way down in time (9% of
// the drop, y ∝ t²); landed at k = 2. Both on the same clock, so together.
const MOON_HOLD = 82;
const MOON_HAMMER = MOON_G - 10 * 1.3 - MOON_HOLD;
const MOON_FEATHER = MOON_G - 7 - MOON_HOLD;
const MOON_K1 = 0.3;

function Astronaut({ x, y }: { x: number; y: number }) {
  const suit = "#f8fafc";
  return (
    <g className="pointer-events-none">
      <GroundShadow x={x} y={y + 1} rx={16} />
      <rect x={x - 8.5} y={y - 23} width={7.5} height={23} rx={3} fill={suit} stroke={INK} strokeWidth={1} />
      <rect x={x + 1} y={y - 23} width={7.5} height={23} rx={3} fill={suit} stroke={INK} strokeWidth={1} />
      <path d={`M${x - 8} ${y - 42}L${x - 28} ${y - 40}M${x + 8} ${y - 42}L${x + 28} ${y - 40}`} stroke={INK} strokeWidth={7.5} strokeLinecap="round" />
      <path d={`M${x - 8} ${y - 42}L${x - 28} ${y - 40}M${x + 8} ${y - 42}L${x + 28} ${y - 40}`} stroke={suit} strokeWidth={5.5} strokeLinecap="round" />
      <rect x={x - 10.5} y={y - 50} width={21} height={30} rx={6} fill={suit} stroke={INK} strokeWidth={1} />
      <rect x={x - 4} y={y - 42} width={8} height={6} rx={1} fill="#d6dde6" stroke={INK} strokeWidth={0.6} />
      <circle cx={x} cy={y - 59} r={10.5} fill={suit} stroke={INK} strokeWidth={1} />
      <ellipse cx={x + 1} cy={y - 59} rx={6.8} ry={5.4} fill="#f2b84b" stroke={INK} strokeWidth={0.7} />
    </g>
  );
}

export function MoonDrop({}: Story) {
  const s = useScene(2, [600, 1400]);
  const k = s.k;
  const ax = 150;
  const part = MOON_K1 * MOON_K1;
  const hy = k === 0 ? 0 : k === 1 ? MOON_HAMMER * part : MOON_HAMMER;
  const fy = k === 0 ? 0 : k === 1 ? MOON_FEATHER * part : MOON_FEATHER;
  const ease = k >= 2 ? fallEase(MOON_K1) : fallEase(0);
  const ms = k >= 2 ? 900 * (1 - MOON_K1) : 900 * MOON_K1;
  const move = (y: number) => ({ transform: `translate(0px, ${y}px)`, transitionTimingFunction: ease, transitionDuration: `${ms}ms` });
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S4_SAY[k]}</span>}>
      <Sheet w={300} h={156} label="চাঁদের ধূসর মাটি, কালো আকাশ। এক নভোচারী এক হাতে হাতুড়ি, আরেক হাতে পালক ধরে আছেন। দুটো একসাথে পড়ে একসাথে মাটি ছোঁয়।" className="max-w-[18rem]" bg="#0f172a">
        {[
          [24, 22],
          [70, 46],
          [118, 16],
          [210, 30],
          [262, 58],
          [284, 18],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={1} fill="#fff" opacity={0.8} />
        ))}
        <path d={`M1.5 ${MOON_G}Q60 ${MOON_G - 4} 120 ${MOON_G}T240 ${MOON_G}T298.5 ${MOON_G - 2}V142A12 12 0 0 1 286.5 154H13.5A12 12 0 0 1 1.5 142Z`} fill="#a8adb5" />
        <ellipse cx={58} cy={142} rx={16} ry={3.5} fill="#8d939c" />
        <ellipse cx={250} cy={146} rx={12} ry={3} fill="#8d939c" />
        <Astronaut x={ax} y={MOON_G} />
        <g style={move(hy)} className="transition-transform motion-reduce:transition-none">
          <Hammer p={[ax - 32, MOON_HOLD]} s={1.3} />
        </g>
        <g style={move(fy)} className="transition-transform motion-reduce:transition-none">
          <Feather p={[ax + 32, MOON_HOLD]} rot={k >= 2 ? 84 : 12} s={1.2} />
        </g>
        {k >= 2 && <Thud x={ax - 32} y={MOON_G} />}
        {k >= 2 && <Thud x={ax + 32} y={MOON_G} />}
        <Tag x={256} y={84} text="1971" tone="amber" solid />
        {k >= 2 && (
          <Later ms={700}>
            <Tag x={ax} y={20} text="একসাথে" tone="mint" solid />
          </Later>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · Why together? (video scene 7, as a question). No air; the bottle has
// its ত্বরণ arrow. The reader gives the feather one: shorter (lighter, so
// less), the same, or none. Both are let go and fall by their arrows: a short
// one lags, none stays up, the same lands with the bottle.

const X5 = { W: 300, H: 192, G: 176, Y0: 48, BX: 110, FX: 196, LEN: 32, T: 16, N: 18, S: 1.6 };
const X5_OPTS: { r: number; say: string }[] = [
  { r: 0.5, say: "ছোট তীর: পালক হালকা, তাই ত্বরণ কম" },
  { r: 1, say: "একই তীর: ত্বরণ সমান" },
  { r: 0, say: "তীর নেই: এত হালকা যে টানই নেই" },
];
const X5_RIGHT = 1;
const X5_NOPE = ["পালক পিছিয়ে পড়লো: বোতল মাটিতে, পালক এখনো পথে। কিন্তু বাতাসহীন নলে তো পালক আর পাথর একসাথে পড়েছিল।", "", "পালক উপরেই ভেসে রইলো। কিন্তু চাঁদে পালকও তো নিচে পড়েছিল, হাতুড়ির সাথে।"];

function MiniArrows({ r }: { r: number }) {
  return (
    <svg viewBox="0 0 84 44" className="h-11 w-[5.25rem] shrink-0" aria-hidden="true">
      <Bottle p={[20, 20]} s={0.8} />
      <path d="M32 10V32" stroke={PH.amber} strokeWidth={2} />
      <path d="M28.5 29L32 35L35.5 29Z" fill={PH.amber} />
      <Feather p={[58, 20]} s={0.75} />
      {r > 0 && <path d={`M70 10V${10 + 22 * r - 3}`} stroke={PH.amber} strokeWidth={2} />}
      {r > 0 && <path d={`M66.5 ${10 + 22 * r - 6}L70 ${10 + 22 * r}L73.5 ${10 + 22 * r - 6}Z`} fill={PH.amber} />}
      {r === 0 && <circle cx={70} cy={20} r={2} fill="none" stroke={PH.mute} strokeWidth={1} />}
    </svg>
  );
}

export function GPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X5.N * 60, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.3);
    walk.start(() => {
      if (i === X5_RIGHT) {
        sfx.chime();
        pass("বোতল আর পালক, দুটোর ত্বরণ একই।");
      } else setMiss((m) => m + 1);
    });
  };
  // One clock for both (ticks of 60 ms); each falls from rest by its own arrow: y ∝ a·t².
  const t = (pick === null ? 0 : walk.running ? walk.t : 1) * X5.N;
  const r = pick === null ? 1 : X5_OPTS[pick].r;
  const ub = Math.min(1, t / X5.T);
  const by = X5.Y0 + (X5.G - 11 * X5.S - X5.Y0) * ub * ub;
  const tf = r > 0 ? X5.T / Math.sqrt(r) : Infinity;
  const uf = Math.min(1, t / tf);
  const fy = X5.Y0 + (X5.G - 14 * X5.S - X5.Y0) * uf * uf;
  const end = pick !== null && !walk.running;
  const right = end && pick === X5_RIGHT;
  const arrow = (x: number, y: number, len: number) => <PArrow a={[x + 22, y - len / 2]} b={[x + 22, y + len / 2]} tone={right ? "mint" : "amber"} tell="ত্বরণ, নিচে" />;
  const shade = (x: number, y: number) => <ellipse cx={x} cy={X5.G + 1.5} rx={12} ry={2.6} fill={INK} opacity={0.03 + 0.08 * ((y - X5.Y0) / (X5.G - X5.Y0))} className="pointer-events-none" />;
  return (
    <>
      <Sheet w={X5.W} h={X5.H} label="বাতাস নেই। বাঁয়ে বোতল, গায়ে ওর ত্বরণের তীর, নিচের দিকে। ডানে একটা পালক। পালকের তীর কেমন, সেটা আপনি বেছে নেবেন।" className="max-w-[19rem]" bg={SKY_BG}>
        <path d={`M1.5 ${X5.G}H${X5.W - 1.5}V${X5.H - 14}A12 12 0 0 1 ${X5.W - 13.5} ${X5.H - 2.5}H13.5A12 12 0 0 1 1.5 ${X5.H - 14}Z`} fill="#ebe5d8" className="pointer-events-none" />
        <path d={`M1.5 ${X5.G}H${X5.W - 1.5}`} stroke="#d2c8b6" strokeWidth={1} className="pointer-events-none" />
        <Tag x={46} y={16} text="বাতাস নেই" tone="blue" />
        {shade(X5.BX, by)}
        {shade(X5.FX, fy)}
        <Bottle p={[X5.BX, by]} s={X5.S} />
        {ub < 1 && arrow(X5.BX, by, X5.LEN)}
        <Feather p={[X5.FX, fy]} s={X5.S} />
        {pick !== null && r > 0 && uf < 1 && arrow(X5.FX, fy, X5.LEN * r)}
        {pick === null && <Txt x={X5.FX + 24} y={X5.Y0 + 5} size={15} weight={800} color={PH.amber}>?</Txt>}
        {ub >= 1 && <Thud x={X5.BX} y={X5.G} />}
        {uf >= 1 && <Thud x={X5.FX} y={X5.G} />}
        {end && !right && <WrongMark x={X5.FX + 26} y={fy - 6} size={16} />}
        {right && <Ripple at={[(X5.BX + X5.FX) / 2, X5.G - 6]} r={56} />}
        {right && (
          <Later>
            <Tag x={(X5.BX + X5.FX) / 2} y={98} text="ত্বরণ একই, তাই একসাথে" tone="mint" solid />
          </Later>
        )}
      </Sheet>
      <div className="mt-2 grid gap-1.5">
        {X5_OPTS.map((o, i) => (
          <Choice key={i} n={i} look={pick === i && end ? (i === X5_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="flex items-center gap-2 text-sm">
              <MiniArrows r={o.r} />
              <span>{o.say}</span>
            </span>
          </Choice>
        ))}
      </div>
      {end && pick !== X5_RIGHT && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>বোতলের গায়ে ওর ত্বরণের তীর। পালকের তীর কেমন হবে? বেছে নিন, দুটো ছেড়ে দেখুন।</Task>
    </>
  );
}

// 5½ · Figure for screen 5's explanation (video scene 8): bottle, paper ball
// and feather let go from one height; after equal times they are always
// level; the card প্রথম সূত্র.

const S5_SAY = ["স্থির অবস্থা থেকে, একই উচ্চতা থেকে।", "বিনা বাধায় পড়লে, একই সময়ে একই জায়গায়।", "আরও পরে, তখনও পাশাপাশি।", "সমান সময়ে সমান পথ।"];
const S5_Y = [32, 52, 104, 104];
// From rest, y ∝ t²: the first step takes √(20/72) of the time to the second mark.
const S5_A = Math.sqrt((S5_Y[1] - S5_Y[0]) / (S5_Y[2] - S5_Y[0]));
const S5_MS = 1000;

export function FirstLaw({}: Story) {
  const s = useScene(3, [600, 1200, 1400]);
  const k = s.k;
  const dy = S5_Y[k] - S5_Y[0];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <Sheet w={300} h={160} label="বোতল, কাগজের বল আর পালক একই উচ্চতা থেকে ছাড়া হলো। সমান সময় পর পর তিনটা সবসময় পাশাপাশি।" className="max-w-[18rem]">
        <path d={`M40 ${S5_Y[0]}H260`} stroke={PH.faint} strokeWidth={1} strokeDasharray="3 3" className="pointer-events-none" />
        {k >= 1 && <path d={`M40 ${S5_Y[1]}H260`} stroke={PH.amber} strokeWidth={1.2} strokeDasharray="3 3" className={`pointer-events-none ${FADE}`} />}
        {k >= 2 && <path d={`M40 ${S5_Y[2]}H260`} stroke={PH.amber} strokeWidth={1.2} strokeDasharray="3 3" className={`pointer-events-none ${FADE}`} />}
        <g
          style={{ transform: `translate(0px, ${dy}px)`, transitionTimingFunction: k >= 2 ? fallEase(S5_A) : fallEase(0), transitionDuration: `${Math.round(k >= 2 ? S5_MS * (1 - S5_A) : S5_MS * S5_A)}ms` }}
          className="transition-transform motion-reduce:transition-none"
        >
          <Bottle p={[90, S5_Y[0]]} s={1.3} />
          <Paper p={[150, S5_Y[0]]} crumple={2} s={1.6} />
          <Feather p={[210, S5_Y[0]]} s={1.3} />
        </g>
        {k >= 3 && (
          <g className={POP}>
            <rect x={50} y={131} width={200} height={23} rx={7} fill="#fff" stroke={PH.mint} strokeWidth={1.6} />
            <Txt x={150} y={146.5} size={11} weight={800}>
              প্রথম সূত্র: সমান সময়ে সমান পথ
            </Txt>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · The old equations (video scene 9). EP 10–11's three boxed equations
// with s and a. Two rounds: where does h go, where does g go? Each pick
// rewrites that letter everywhere at once; a wrong one reads as nonsense
// (h = u + at) and stays red until the next pick.

type Tok = { b: string; sup?: string } | string;
const X6_EQS: Tok[][] = [
  [{ b: "v" }, " = ", { b: "u" }, " + ", { b: "a" }, { b: "t" }],
  [{ b: "s" }, " = ", { b: "u" }, { b: "t" }, " + ", "½", { b: "a" }, { b: "t", sup: "²" }],
  [{ b: "v", sup: "²" }, " = ", { b: "u", sup: "²" }, " + ", "2", { b: "a" }, { b: "s" }],
];
const X6_ROUNDS = [
  { to: "h", ask: "উচ্চতা h বসবে কার জায়গায়?", opts: ["v", "s", "u"], right: "s", nope: { v: "v ছিল শেষ বেগ। h = u + at মানে উচ্চতা হয়ে গেলো বেগ। h তো একটা পথ।", u: "u ছিল আদি বেগ। উচ্চতা বেগ না, পথ। কোন অক্ষরটা পথ ছিল?" } as Record<string, string> },
  { to: "g", ask: "আর g বসবে কার জায়গায়?", opts: ["t", "a", "u"], right: "a", nope: { t: "t ছিল সময়। সময়ের জায়গায় ত্বরণ বসালে সমীকরণের মানেই বদলে যায়। g একটা ত্বরণ।", u: "u ছিল আদি বেগ। g বেগ না, ত্বরণ। কোন অক্ষরটা ত্বরণ ছিল?" } as Record<string, string> },
];

export function EqSwap() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pick, setPick] = useSeed<string | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(90);
  const done = round >= X6_ROUNDS.length;
  const R = X6_ROUNDS[Math.min(round, X6_ROUNDS.length - 1)];
  const choose = (l: string) => {
    if (play.running || done) return;
    setPick(l);
    sfx.flip();
    play.play(8, () => {
      if (l === R.right) {
        sfx.chime();
        const nr = round + 1;
        setRound(nr);
        setPick(null);
        if (nr === X6_ROUNDS.length) pass("s হলো h, a হলো g। বাকি সব আগের মতো।");
      } else setMiss((m) => m + 1);
    });
  };
  // What each letter now reads as: the rounds already won, then this pick.
  const rep: Record<string, { to: string; tone: "set" | "try" | "bad" }> = {};
  X6_ROUNDS.slice(0, round).forEach((r) => (rep[r.right] = { to: r.to, tone: "set" }));
  if (pick && !done) rep[pick] = { to: R.to, tone: play.running ? "try" : pick === R.right ? "set" : "bad" };
  const wrong = pick !== null && !play.running && pick !== R.right && !done;
  return (
    <>
      <Sheet w={300} h={74} label="একটা বল উপর থেকে পড়ছে। বলের পাশে উচ্চতা h, একটা উল্লম্ব দাগ। আর নিচের দিকে ত্বরণের তীর g।" className="max-w-[19rem]">
        <path d="M104 64H196" stroke="#d2c8b6" strokeWidth={1.4} strokeLinecap="round" className="pointer-events-none" />
        <GroundShadow x={150} y={65} rx={9} />
        <FallBall x={150} y={17} r={7.5} />
        <path d="M168 10V64M163 10H173M163 64H173" stroke={PH.blue} strokeWidth={1.4} className="pointer-events-none" />
        <Tag x={210} y={37} text="h: উচ্চতা" tone="blue" />
        <PArrow a={[132, 12]} b={[132, 54]} tone="amber" tell="g, নিচে" />
        <Tag x={92} y={33} text="g: ত্বরণ" tone="amber" />
      </Sheet>
      <div className="mx-auto mt-2 grid w-full max-w-[19rem] gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5">
        {X6_EQS.map((eq, i) => (
          <div key={i} className={`rounded-lg border-2 px-2 py-1 text-center font-mono text-lg transition-colors duration-300 motion-reduce:transition-none ${done ? "border-accent bg-accent/10" : "border-border"}`}>
            {eq.map((tk, j) => {
              if (typeof tk === "string") return <span key={j}>{tk}</span>;
              const r = rep[tk.b];
              if (!r) return <span key={j}>{tk.b}{tk.sup}</span>;
              const c = r.tone === "bad" ? "text-danger" : r.tone === "try" ? "text-cat-blue" : "text-cat-amber";
              return (
                <span key={`${j}${r.to}${pick}`} style={{ transitionDelay: `${i * 120}ms` }} className={`inline-block font-bold ${c} ${POP}`}>
                  {r.to}
                  {tk.sup}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {!done ? (
        <div className="mx-auto mt-2 flex w-full max-w-[19rem] flex-wrap items-center justify-center gap-1.5 text-sm">
          <span className="w-full text-center">{R.ask}</span>
          {R.opts.map((l) => (
            <button key={l} type="button" disabled={play.running} className={`${chip(pick === l)} font-mono`} onClick={() => choose(l)}>
              {l}
            </button>
          ))}
        </div>
      ) : (
        <div className={`mt-2 text-center text-sm font-semibold text-accent-text ${FADE}`}>s → h, a → g: পড়ন্ত বস্তুর তিন সমীকরণ।</div>
      )}
      <Ticks items={[["s → h", round >= 1], ["a → g", round >= 2]]} />
      {wrong && <Nope key={miss}>{R.nope[pick]}</Nope>}
      <Task done={done}>পড়ার বেলায় পথ হলো উচ্চতা h, ত্বরণ হলো g। সমীকরণে এরা কোন অক্ষরের জায়গায় বসবে? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · v = gt (video scene 10). A ball let go from rest; each tap runs one
// more second: the ball falls, the speedometer climbs, its velocity arrow
// grows, and the v column fills 9.8 · 19.6 · 29.4. Time marks only, no
// heights yet (they are screen 8's).

const X7 = { BX: 84, Y0: 18, U: 2.8, MS: 900 };
const yFall = (t: number, y0: number, u: number) => y0 + u * hAt(t);

export function FallClock() {
  const pass = useGate();
  const [sec, setSec] = useSeed("sec", 0);
  // One second of fall per tap, on a linear clock; the height comes from h = ½gt².
  const walk = useWalk(X7.MS, { steps: false, ease: "linear" });
  const tau = walk.running ? sec - 1 + walk.t : sec;
  const y = yFall(tau, X7.Y0, X7.U);
  const v = vAt(tau);
  const tick = () => {
    if (walk.running || sec >= 3) return;
    const n = sec + 1;
    setSec(n);
    sfx.click();
    walk.start(() => {
      sfx.pop();
      if (n === 3) pass("প্রতি সেকেন্ডে বেগ বাড়ে 9.8 m/s।");
    });
  };
  const shown = walk.running ? sec - 1 : sec;
  const allDone = sec >= 3 && !walk.running;
  return (
    <>
      <Sheet w={300} h={196} label="একটা বল স্থির অবস্থা থেকে পড়ছে। প্রতি সেকেন্ডে বলের জায়গায় একটা দাগ। ডানে speedometer আর বেগের তালিকা।" className="max-w-[20rem]">
        <path d={`M${X7.BX} ${X7.Y0}V186`} stroke={PH.faint} strokeWidth={1} strokeDasharray="2 3" className="pointer-events-none" />
        {[1, 2, 3].filter((t) => t <= shown).map((t) => {
          const ty = yFall(t, X7.Y0, X7.U);
          return (
            <g key={t} className={`pointer-events-none ${FADE}`}>
              <path d={`M${X7.BX - 12} ${ty}H${X7.BX + 12}`} stroke={PH.amber} strokeWidth={1.4} />
              <Txt x={X7.BX - 16} y={ty + 3} size={8.5} anchor="end" color={PH.amber} weight={700}>{`${t} s`}</Txt>
            </g>
          );
        })}
        {[0, 1, 2].filter((t) => t < tau - 0.05).map((t) => (
          <FallBall key={t} x={X7.BX} y={yFall(t, X7.Y0, X7.U)} ghost />
        ))}
        <FallBall x={X7.BX} y={y} />
        {v > 0.5 && <PArrow a={[X7.BX + 16, y]} b={[X7.BX + 16, y + 1.4 * v]} tone="amber" w={2.2} tell={`${fmt(v)} m/s নিচে`} />}
        <Gauge x={226} y={52} r={30} v={v} max={30} />
        <Txt x={226} y={84} size={8} color={PH.mute}>
          বেগ
        </Txt>
        {[1, 2, 3].map((t, i) => (
          <g key={t} className="pointer-events-none">
            <rect x={174} y={96 + i * 22} width={104} height={18} rx={4} fill={t <= shown ? PH.amberSoft : "#f8fafc"} stroke={t <= shown ? PH.amber : PH.faint} strokeWidth={0.9} />
            <Txt x={180} y={108.5 + i * 22} size={9} anchor="start" weight={700}>{`t = ${t} s`}</Txt>
            <Txt x={272} y={108.5 + i * 22} size={9} anchor="end" weight={700} color={t <= shown ? PH.ink : PH.mute}>
              {t <= shown ? `${fmt(vAt(t))} m/s` : "?"}
            </Txt>
          </g>
        ))}
        {allDone && <LawCard x={226} y={180} name="দ্বিতীয় সূত্র:" f="v ∝ t" />}
      </Sheet>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={walk.running || sec >= 3} onClick={tick}>
          আরও 1 সেকেন্ড
        </button>
      </div>
      <Ticks items={[1, 2, 3].map((t) => [`${t} s`, shown >= t] as [string, boolean])} />
      <Task done={allDone}>বলটা স্থির থেকে ছাড়া হলো। এক সেকেন্ড করে সময় চালান। প্রতি সেকেন্ডে বেগ কত হয়, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · h = ½gt² (video scene 11, as a question). The ruler, the ball, the 1 s
// mark at 4.9 m. How far in 2 s? The pick is drawn as a mark; the ball falls
// for 2 s by the real law, and a mark it passes early turns red.

const X8 = { RX: 66, BX: 130, Y0: 24, U: 7.4, MS: 1600 };
const X8_OPTS = [9.8, 19.6, 14.7];
const X8_RIGHT = 1;
const X8_NOPE = ["ঘড়ি 2 s হওয়ার আগেই বল 9.8 m পেরিয়ে গেলো। সময় দ্বিগুণ হলে পথ দ্বিগুণ হয় না।", "", "এটাও 2 s-এর আগেই পার। সূত্রে t স্কয়ার আছে: 2 সেকেন্ডে t² কত?"];

export function HeightPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X8.MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.4);
    walk.start(() => {
      if (i === X8_RIGHT) {
        sfx.chime();
        pass("2 সেকেন্ডে 19.6 m: 4.9-এর চারগুণ।");
      } else setMiss((m) => m + 1);
    });
  };
  // A linear clock, 0 → 2 s; the ball's height is the law's, h = ½gt².
  const tau = pick === null ? 0 : walk.running ? 2 * walk.t : 2;
  const y = (h: number) => X8.Y0 + X8.U * h;
  const by = y(hAt(tau));
  const end = pick !== null && !walk.running;
  const right = end && pick === X8_RIGHT;
  const mark = pick === null ? null : X8_OPTS[pick];
  const passed = mark !== null && hAt(tau) >= mark - 0.01;
  const markTone = mark === null ? PH.blue : passed ? (pick === X8_RIGHT && tau >= 2 ? PH.mint : PH.red) : PH.blue;
  return (
    <>
      <Sheet w={300} h={196} label="বাঁয়ে মিটারের মাপকাঠি, 0 থেকে 20 m। বল উপরে। 1 সেকেন্ডের দাগ 4.9 m-এ। 2 সেকেন্ডে বল কোথায় থাকবে, তার দাগ আপনি বেছে নেবেন।" className="max-w-[20rem]">
        <path d={`M${X8.RX} ${y(0)}V${y(20)}`} stroke={PH.ink} strokeWidth={1.4} className="pointer-events-none" />
        {[0, 5, 10, 15, 20].map((m) => (
          <g key={m} className="pointer-events-none">
            <path d={`M${X8.RX - 5} ${y(m)}H${X8.RX}`} stroke={PH.ink} strokeWidth={1.2} />
            <Txt x={X8.RX - 8} y={y(m) + 3} size={8} anchor="end" color={PH.mute}>{`${m} m`}</Txt>
          </g>
        ))}
        <path d={`M${X8.RX} ${y(4.9)}H${X8.BX + 30}`} stroke={PH.amber} strokeWidth={1.2} strokeDasharray="3 3" className="pointer-events-none" />
        <MTag x={X8.BX + 64} y={y(4.9)} text="1 s · 4.9 m" tone="amber" />
        {mark !== null && (
          <g key={pick} className={FADE}>
            <path d={`M${X8.RX} ${y(mark)}H${X8.BX + 30}`} stroke={markTone} strokeWidth={1.8} strokeDasharray="4 3" className="pointer-events-none" />
            <MTag x={X8.BX + 64} y={y(mark)} text={`2 s · ${mark} m?`} tone={markTone === PH.red ? "red" : markTone === PH.mint ? "mint" : "blue"} />
          </g>
        )}
        {[0, 1].filter((t) => t < tau - 0.05).map((t) => (
          <FallBall key={t} x={X8.BX} y={y(hAt(t))} ghost />
        ))}
        <FallBall x={X8.BX} y={by} />
        <Txt x={X8.BX} y={by + 20} size={9} weight={700} color={PH.amber}>{`t = ${fmt(tau)} s`}</Txt>
        {end && !right && <WrongMark x={X8.BX + 110} y={y(mark ?? 0) + 5} />}
        {end && !right && (
          <Txt x={X8.BX + 64} y={y(mark ?? 0) + 18} size={8.5} weight={700} color={PH.red} className={FADE}>
            2 s-এর আগেই পার
          </Txt>
        )}
        {right && <Ripple at={[X8.BX, by]} r={22} />}
        {right && (
          <Later>
            <Txt x={X8.BX + 64} y={y(19.6) + 18} size={8.5} weight={700} color={PH.mint}>
              ঠিক 2 s-এ
            </Txt>
          </Later>
        )}
      </Sheet>
      <div className="mt-2 grid gap-1.5">
        {X8_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && end ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="font-mono font-bold">{`${o} m`}</span>
          </Choice>
        ))}
      </div>
      {end && pick !== X8_RIGHT && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={right}>1 সেকেন্ডে বল পড়ে 4.9 m। 2 সেকেন্ডে কতটা পড়বে? বেছে নিন, বল ছেড়ে দেখুন।</Task>
    </>
  );
}

// 8½ · Figure for screen 8's explanation: the marks at 1, 2, 3 s spread out,
// 4.9 · 19.6 · 44.1 m, then 1 : 4 : 9 and the card তৃতীয় সূত্র.

const S8_SAY = ["এক সেকেন্ডে 4.9 m।", "দুই সেকেন্ডে তার চারগুণ: 19.6 m।", "তিন সেকেন্ডে নয়গুণ: 44.1 m।", "1 : 4 : 9। পড়ার পথ সময়ের বর্গের সমানুপাতিক।"];
const S8 = { BX: 140, Y0: 18, U: 3.3 };

export function OneFourNine({}: Story) {
  const s = useScene(3, [600, 1200, 1200]);
  const k = s.k;
  const shownT = Math.min(3, k + 1);
  const y = (h: number) => S8.Y0 + S8.U * h;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S8_SAY[k]}</span>}>
      <Sheet w={300} h={196} label="পড়ন্ত বলের নিচে 1, 2, 3 সেকেন্ডের দাগ: 4.9 m, 19.6 m, 44.1 m। দাগগুলো ক্রমে দূরে দূরে। অনুপাত 1 : 4 : 9।" className="max-w-[18rem]">
        <path d={`M${S8.BX} ${y(0)}V${y(44.1)}`} stroke={PH.faint} strokeWidth={1} strokeDasharray="2 3" className="pointer-events-none" />
        <path d={`M${S8.BX - 12} ${y(0)}H${S8.BX + 12}`} stroke={PH.ink} strokeWidth={1.2} className="pointer-events-none" />
        {[1, 2, 3].filter((t) => t <= shownT).map((t) => (
          <g key={t} className={FADE}>
            <path d={`M${S8.BX - 12} ${y(hAt(t))}H${S8.BX + 40}`} stroke={PH.amber} strokeWidth={1.4} className="pointer-events-none" />
            <MTag x={S8.BX + 84} y={y(hAt(t))} text={`${t} s · ${fmt(hAt(t))} m`} tone="amber" />
            {t > 1 && (
              <Txt x={S8.BX + 84} y={y(hAt(t)) + 17} size={8.5} weight={700} color={PH.mute}>
                {t === 2 ? "4 গুণ" : "9 গুণ"}
              </Txt>
            )}
          </g>
        ))}
        {Array.from({ length: shownT }, (_, t) => (
          <FallBall key={t} x={S8.BX} y={y(hAt(t))} ghost />
        ))}
        {/* each step is one more second of the same fall: the ease is the parabola's own piece */}
        <g
          style={{ transform: `translate(0px, ${y(hAt(shownT)) - y(0)}px)`, transitionTimingFunction: fallEase((shownT - 1) / shownT), transitionDuration: "900ms" }}
          className="transition-transform motion-reduce:transition-none"
        >
          <FallBall x={S8.BX} y={y(0)} />
        </g>
        {k >= 3 && <MTag x={66} y={70} text="1 : 4 : 9" tone="mint" solid pop size={10} />}
        {k >= 3 && <LawCard x={66} y={104} name="তৃতীয় সূত্র:" f="h ∝ t²" size={8.5} />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn: no air; the bottle, the paper ball and the feather let go
// together. Where is each after 3 s? Three pictures: all at 29.4 m (v taken
// for h), the heavy one lowest, all at 44.1 m. The pick is drawn as ghosts;
// the three fall for 3 s by the real law, side by side.

const X9 = { RX: 40, Y0: 32, U: 3.2, MS: 1800, XS: [112, 170, 226], S: 1.3 };
const X9_OPTS: { hs: number[]; say: string }[] = [
  { hs: [29.4, 29.4, 29.4], say: "তিনটাই 29.4 m নিচে" },
  { hs: [44.1, 30, 16], say: "বোতল সবচেয়ে নিচে, পালক সবচেয়ে উপরে" },
  { hs: [44.1, 44.1, 44.1], say: "তিনটাই 44.1 m নিচে" },
];
const X9_RIGHT = 2;
const X9_NOPE = ["তিনটাই 29.4 m পেরিয়ে আরও নেমে গেলো। 29.4 হলো 3 সেকেন্ডের বেগ, m/s-এ। পথের সূত্র h = ½gt²।", "তিনটা একসাথেই নামলো, কেউ পিছিয়ে থাকলো না। বাতাস নেই, তাই g সবার একই।", ""];

function ThreeThings({ ys, ghost = false }: { ys: number[]; ghost?: boolean }) {
  return (
    <>
      <Bottle p={[X9.XS[0], ys[0]]} s={X9.S} ghost={ghost} />
      <Paper p={[X9.XS[1], ys[1]]} crumple={2} s={X9.S * 1.25} ghost={ghost} />
      <Feather p={[X9.XS[2], ys[2]]} s={X9.S} ghost={ghost} />
    </>
  );
}

function MiniThree({ hs }: { hs: number[] }) {
  const y = (h: number) => 6 + h * 0.75;
  return (
    <svg viewBox="0 0 72 44" className="h-11 w-[4.5rem] shrink-0" aria-hidden="true">
      <path d="M4 6H68" stroke={PH.faint} strokeWidth={1} strokeDasharray="2 2" />
      {hs.map((h, i) => (
        <circle key={i} cx={16 + i * 20} cy={y(h)} r={3.6} fill={["#7dd3fc", "#fff", "#e2e8f0"][i]} stroke={PH.mute} strokeWidth={0.9} />
      ))}
    </svg>
  );
}

export function FallThree() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X9.MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.5);
    walk.start(() => {
      if (i === X9_RIGHT) {
        sfx.chime();
        pass("তিনটাই 44.1 m: g সবার জন্য একই।");
      } else setMiss((m) => m + 1);
    });
  };
  // A linear clock, 0 → 3 s; all three fall by h = ½gt², side by side.
  const tau = pick === null ? 0 : walk.running ? 3 * walk.t : 3;
  const y = (h: number) => X9.Y0 + X9.U * h;
  const fy = y(hAt(tau));
  const end = pick !== null && !walk.running;
  const right = end && pick === X9_RIGHT;
  return (
    <>
      <Sheet w={300} h={196} label="বাতাস নেই। বাঁয়ে মিটারের মাপকাঠি, 0 থেকে 45 m। উপরে বোতল, কাগজের বল আর পালক, একই উচ্চতায়। 3 সেকেন্ড পর কে কোথায়, আপনি বেছে নেবেন।" className="max-w-[20rem]">
        <path d={`M${X9.RX} ${y(0)}V${y(45)}`} stroke={PH.ink} strokeWidth={1.4} className="pointer-events-none" />
        {[0, 10, 20, 30, 40].map((m) => (
          <g key={m} className="pointer-events-none">
            <path d={`M${X9.RX - 5} ${y(m)}H${X9.RX}`} stroke={PH.ink} strokeWidth={1.2} />
            <Txt x={X9.RX - 7} y={y(m) + 3} size={7.5} anchor="end" color={PH.mute}>{`${m}`}</Txt>
          </g>
        ))}
        <Txt x={X9.RX - 7} y={11} size={7.5} anchor="end" color={PH.mute}>
          m
        </Txt>
        <Tag x={266} y={14} text="বাতাস নেই" tone="blue" />
        {pick !== null && <ThreeThings key={pick} ys={X9_OPTS[pick].hs.map(y)} ghost />}
        <ThreeThings ys={[fy, fy, fy]} />
        <Txt x={X9.XS[2] + 16} y={fy + 3.5} size={9.5} anchor="start" weight={700} color={PH.amber}>{`t = ${fmt(tau)} s`}</Txt>
        {end && !right && <WrongMark x={X9.XS[2] + 24} y={y(X9_OPTS[pick].hs[2]) + 5} />}
        {right && <Ripple at={[X9.XS[1], fy]} r={70} />}
        {right && (
          <Later>
            <Tag x={X9.XS[1]} y={fy - 34} text="তিনটাই 44.1 m" tone="mint" solid />
          </Later>
        )}
      </Sheet>
      <div className="mt-2 grid gap-1.5">
        {X9_OPTS.map((o, i) => (
          <Choice key={i} n={i} look={pick === i && end ? (i === X9_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="flex items-center gap-2 text-sm">
              <MiniThree hs={o.hs} />
              <span>{o.say}</span>
            </span>
          </Choice>
        ))}
      </div>
      {end && pick !== X9_RIGHT && <Nope key={miss}>{X9_NOPE[pick]}</Nope>}
      <Task done={right}>বাতাস নেই। বোতল, কাগজের বল আর পালক একসাথে ছাড়লেন। 3 সেকেন্ড পর কে কোথায়? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10a · Recap card for the last screen (video scene 12): bottle, paper ball
// and feather, each with the same g arrow; the card g সবার জন্য একই.

const S10_SAY = ["বোতল, কাগজের বল, পালক।", "তিনটার গায়েই একই তীর: g = 9.8 m/s², নিচে।", "g সবার জন্য একই।"];

export function SameG({}: Story) {
  const s = useScene(2, [600, 1400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10_SAY[k]}</span>}>
      <Sheet w={300} h={130} label="বোতল, কাগজের বল আর পালক পাশাপাশি। তিনটার গায়েই একই মাপের তীর, নিচের দিকে: g = 9.8 m/s²।" className="max-w-[18rem]">
        <Bottle p={[66, 46]} s={1.5} />
        <Paper p={[146, 46]} crumple={2} s={1.9} />
        <Feather p={[226, 46]} s={1.5} />
        {k >= 1 &&
          [66, 146, 226].map((x, i) => <PArrow key={x} a={[x + 24, 24]} b={[x + 24, 80]} tone="mint" draw delay={i * 160} tell="9.8 m/s² নিচে" />)}
        {k >= 1 &&
          [66, 146, 226].map((x) => (
            <g key={`g${x}`} className={FADE}>
              <Txt x={x + 37} y={60} size={11} weight={800} color={PH.mint}>
                g
              </Txt>
            </g>
          ))}
        {k >= 2 && <Tag x={150} y={110} text="g সবার জন্য একই" tone="mint" solid size={11} pop />}
      </Sheet>
    </Scene>
  );
}

// 10b · The next journey's teaser (video scene 13): টুটুল on the ছাদ, a
// cricket ball held up, an arrow straight up, and কত উঁচু?

export function ThrowUp({}: Story) {
  const s = useScene(2, [600, 1400]);
  const k = s.k;
  const x = 150;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="বিকেলে ছাদে টুটুল, হাতে একটা ক্রিকেট বল। বল থেকে একটা তীর সোজা উপরে। প্রশ্ন: কত উঁচু?">
        <RoofBack />
        <Person who="tutul" x={x} y={150} scale={0.8} arm="wave" mood="happy" label />
        <CricketBall p={[x + 14, 96]} />
        {k >= 1 && <PArrow a={[x + 14, 88]} b={[x + 14, 40]} tone="amber" draw tell="উপরে" />}
        {k >= 2 && <Tag x={x + 64} y={44} text="কত উঁচু?" tone="amber" size={10.5} pop />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  RoofHold: { a: { k: 0 }, end: {} },
  DropBet: { start: {}, sealed: { bet: 2 }, bottle: { bet: 0 } },
  RoofDrop: { start: {}, done: { dropped: true } },
  TithiVerdict: { a: { k: 0 }, end: {} },
  GalileoNo: { a: { k: 0 }, b: { k: 1 }, end: {} },
  CrumpleDrop: { start: {}, half: { crumple: 1 }, flatWrong: { crumple: 0, drop: 0 }, halfWrong: { crumple: 1, drop: 1 }, ball: { crumple: 2 }, right: { crumple: 2, drop: 2 } },
  AirPush: { a: { k: 0 }, end: {} },
  TubePump: { start: {}, fullWrong: { air: 3, drop: 3 }, someWrong: { air: 1, drop: 1 }, empty: { air: 0 }, right: { air: 0, drop: 0 } },
  MoonDrop: { a: { k: 0 }, b: { k: 1 }, end: {} },
  GPick: { start: {}, half: { pick: 0 }, none: { pick: 2 }, right: { pick: 1 } },
  FirstLaw: { a: { k: 0 }, b: { k: 2 }, end: {} },
  EqSwap: { start: {}, wrongH: { pick: "v" }, round2: { round: 1 }, wrongG: { round: 1, pick: "t" }, done: { round: 2 } },
  FallClock: { start: {}, one: { sec: 1 }, done: { sec: 3 } },
  HeightPick: { start: {}, double: { pick: 0 }, sum: { pick: 2 }, right: { pick: 1 } },
  OneFourNine: { a: { k: 0 }, b: { k: 1 }, end: {} },
  FallThree: { start: {}, speed: { pick: 0 }, heavy: { pick: 1 }, right: { pick: 2 } },
  SameG: { a: { k: 0 }, end: {} },
  ThrowUp: { a: { k: 0 }, end: {} },
};
