"use client";

import { useId, useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, primaryBtn, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, CAST, Stage, StoryFrame, Tree } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { GroundShadow, PArrow, PH, Ripple, Sheet, Tag, Txt, WrongMark, chip, useWalk } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 2 — স্থির, না গতিশীল?"
// (src/content/articles/physics_for_high_school/02_rest_motion.mdx), the journey
// of video EP 02 (physics_9_10/02-rest-motion/script.md). Book §2.1, pp. 34–35.
//
// The spine: you, sitting still on a chair. Are you moving? The reader bets
// (RestBet) and it is settled on the last screen. On the way, the video's own
// beats in order: the rule on a metre ruler, a lamppost that stays and a
// rickshaw that goes (RuleRuler); তিথি on the ফরিদপুর → ঢাকা train, মিতু 1.5 m
// away for a whole hour (MituHour); চাচা on the platform sees both girls go
// (ChachaSees); who is wrong? nobody, two origins (WhoIsRight, TwoOrigins); the
// trees run backwards past the window (WindowView); the hunt for a truly still
// point (StillHunt, ChairOrbit, PickPoint); the reader judges three cases from a
// given origin (WhoMoves); the chair two ways, and the next video's three
// kinds of motion (ChairBoth, ThreeMotions).
//
// Canon (the video's): তিথি ↔ মিতু 1.5 m, the clock runs 0 → 60 min; the ruler
// 0–10 m, lamppost at 2 m, rickshaw 4 m → 9 m; the train runs to the right,
// ফরিদপুর → ঢাকা; Earth round the Sun ≈ 30 km per second. Distances from চাচা are
// read off the drawing (1.5 m = the girls' gap), not canon numbers.

type Story = { story?: boolean };
type P = [number, number];
type Look = { shirt: string; pants: string; skin: string; hair: string };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** A body that starts and stops, placed by a clock that runs linearly (useWalk "linear": the clock's hand is time). */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const fmt = (v: number) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1));
const rad = (deg: number) => (deg * Math.PI) / 180;
const onCircle = (c: P, r: number, deg: number, squash = 1): P => [c[0] + Math.cos(rad(deg)) * r, c[1] + Math.sin(rad(deg)) * r * squash];
function arcD(c: P, r: number, a0: number, a1: number, squash = 1) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 6));
  return "M" + Array.from({ length: n + 1 }, (_, i) => onCircle(c, r, a0 + ((a1 - a0) * i) / n, squash).map((v) => v.toFixed(1)).join(" ")).join("L");
}

const TITHI: Look = CAST.tithi;
const MITU: Look = { shirt: "#7c3aed", pants: "#334155", skin: "#c68e5f", hair: "#1c1917" };
const YOU: Look = { shirt: "#0d9488", pants: "#334155", skin: "#d49a6a", hair: "#1c1917" };
const SPACE = "#0b1526";

// ---------------------------------------------------------------------------
// The drawn world: seats and the people on them, the clock, the rickshaw,
// the train, চাচা, the platform things, the Earth.

/** A wooden seat facing right, its cushion top at (x, y). */
export function Seat({ x, y, s = 1, facing = 1 }: { x: number; y: number; s?: number; facing?: 1 | -1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${facing * s} ${s})`} className="pointer-events-none">
      <rect x={-14} y={-30} width={5} height={36} rx={2} fill="#8b5a2b" />
      <rect x={-14} y={0} width={25} height={5} rx={2} fill="#a0662d" />
      <rect x={-12} y={5} width={3} height={12} fill="#6b4423" />
    </g>
  );
}

/** Someone sitting, seen from the side, facing right (`facing` −1 turns them); hip at (x, y), about 38 tall. */
export function Sitter({ x, y, s = 1, facing = 1, look, hair = "short", seat = true }: { x: number; y: number; s?: number; facing?: 1 | -1; look: Look; hair?: "braids" | "long" | "short"; seat?: boolean }) {
  return (
    <g className="pointer-events-none">
      {seat && <Seat x={x} y={y} s={s} facing={facing} />}
      <g transform={`translate(${x} ${y}) scale(${facing * s} ${s})`}>
        <path d="M-3 -1H12" stroke={look.pants} strokeWidth={6} strokeLinecap="round" />
        <path d="M12 -1L13 14" stroke={look.pants} strokeWidth={5} strokeLinecap="round" />
        <path d="M11 15.5h5" stroke={PH.ink} strokeWidth={2.4} strokeLinecap="round" />
        {hair === "long" && <path d="M-7.6 -30q-1.6 8 -.4 16h4.4q-1 -7 0 -14Z" fill={look.hair} />}
        <rect x={-7} y={-22} width={11} height={22} rx={4} fill={look.shirt} />
        <path d="M0 -18L8 -8" stroke={look.skin} strokeWidth={3.4} strokeLinecap="round" />
        <circle cx={-1} cy={-29} r={6.5} fill={look.skin} />
        <path d="M-7.5 -30q0 -8 6.5 -8t6.5 8q-3 -4 -6.5 -4t-6.5 4Z" fill={look.hair} />
        {hair === "braids" && (
          <>
            <path d="M-6.8 -28q-3 6 -1.6 13" fill="none" stroke={look.hair} strokeWidth={2.6} strokeLinecap="round" />
            <circle cx={-7.2} cy={-27} r={1.6} fill="#f5ecd7" />
          </>
        )}
        <circle cx={2.6} cy={-30} r={0.9} fill={PH.ink} />
        <path d="M1.8 -26.4q1.4 .9 2.8 0" fill="none" stroke={PH.ink} strokeWidth={0.8} strokeLinecap="round" />
      </g>
    </g>
  );
}

/** A wall clock; `turn` = how much of an hour has gone (0…1). */
function Clock({ x, y, r = 16, turn = 0, label }: { x: number; y: number; r?: number; turn?: number; label?: string }) {
  const m = turn * 360;
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={PH.ink} strokeWidth={1.4} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = rad(i * 30);
        const o = r * 0.86;
        const n = r * (i % 3 ? 0.74 : 0.66);
        return <path key={i} d={`M${x + Math.sin(a) * o} ${y - Math.cos(a) * o}L${x + Math.sin(a) * n} ${y - Math.cos(a) * n}`} stroke={PH.mute} strokeWidth={i % 3 ? 0.8 : 1.4} />;
      })}
      <path d={`M${x} ${y}V${y - r * 0.45}`} stroke={PH.ink} strokeWidth={2} strokeLinecap="round" transform={`rotate(${60 + m / 12} ${x} ${y})`} />
      <path d={`M${x} ${y}V${y - r * 0.78}`} stroke={PH.amber} strokeWidth={1.6} strokeLinecap="round" transform={`rotate(${m} ${x} ${y})`} />
      <circle cx={x} cy={y} r={1.6} fill={PH.ink} />
      {label && (
        <Txt x={x} y={y + r + 10} size={8} color={PH.mute}>
          {label}
        </Txt>
      )}
    </g>
  );
}

/** The video's cycle rickshaw, the puller in front (to the right); its anchor at (x, y) on the ground. */
export function Rickshaw({ x, y, s = 0.27, spin = 0 }: { x: number; y: number; s?: number; spin?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-48 -36L66 -22M54 -24L50 -112M44 -118L72 -124" stroke="#64748b" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M-100 -58L-8 -58L-8 -100L-100 -100Z" fill="#2a3a58" />
      <rect x={-104} y={-108} width={100} height={12} rx={5} fill="#e9d8b4" />
      <path d="M-108 -104Q-116 -198 -24 -190Q2 -184 -4 -104Z" fill={PH.amber} />
      <path d="M-88 -110Q-92 -170 -50 -176M-64 -108Q-62 -160 -30 -170" stroke="#b7791f" strokeWidth={4} fill="none" />
      <path d="M50 -116L58 -160" stroke="#4f7fc9" strokeWidth={16} strokeLinecap="round" />
      <path d="M50 -112L64 -64" stroke="#2a3550" strokeWidth={9} strokeLinecap="round" />
      <path d="M58 -150L72 -124" stroke="#4f7fc9" strokeWidth={8} strokeLinecap="round" />
      <circle cx={61} cy={-178} r={14} fill="#c68e5f" />
      <path d="M47 -182Q50 -196 62 -194Q74 -193 75 -180Q66 -186 47 -182Z" fill="#1d1d1f" />
      {(
        [
          [-48, 36],
          [66, 22],
        ] as const
      ).map(([cx, r]) => (
        <g key={cx} transform={`translate(${cx} ${-r})`}>
          <circle r={r} fill="none" stroke={PH.ink} strokeWidth={5} />
          <g transform={`rotate(${spin * (36 / r)})`}>
            {[0, 45, 90, 135].map((a) => (
              <path key={a} d={`M${-r} 0H${r}`} stroke="#94a3b8" strokeWidth={2.4} transform={`rotate(${a})`} />
            ))}
          </g>
        </g>
      ))}
    </g>
  );
}

/** A lamppost standing on (x, y). */
function Lamppost({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 4} y={y - 4} width={8} height={4} rx={1} fill="#55657f" />
      <path d={`M${x} ${y - 2}V${y - 68}`} stroke="#55657f" strokeWidth={3} />
      <path d={`M${x} ${y - 66}Q${x} ${y - 74} ${x + 9} ${y - 73}`} stroke="#55657f" strokeWidth={2.4} fill="none" />
      <path d={`M${x + 4} ${y - 75}h13l-2.4 5h-8.2Z`} fill="#3a4a66" />
      <ellipse cx={x + 10.5} cy={y - 69} rx={4} ry={1.8} fill="#fbbf24" />
    </g>
  );
}

/**
 * The ফরিদপুর → ঢাকা train: one carriage cut away to show who sits inside, the
 * engine in front (to the right). Rails at (x, y); the carriage is 110 wide, 46
 * tall. `children` draw inside the carriage, in its own units (seat tops at
 * y = −19; তিথি at −15, মিতু at +15: 1.5 m apart).
 */
export function Train({ x, y, s = 1, engine = true, children }: { x: number; y: number; s?: number; engine?: boolean; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      {engine && (
        <g>
          <rect x={53} y={-15} width={7} height={3} fill="#334155" />
          <rect x={58} y={-42} width={36} height={34} rx={5} fill="#1e3a8a" />
          <rect x={63} y={-36} width={15} height={11} rx={2} fill="#e9d8b4" />
          <rect x={81} y={-36} width={9} height={11} rx={2} fill="#e9d8b4" />
          <path d="M58 -19H94" stroke="#dbe4f3" strokeWidth={1.4} />
          <circle cx={91.5} cy={-14} r={2.2} fill="#fde047" />
          {[66, 86].map((wx) => (
            <circle key={wx} cx={wx} cy={-4} r={4} fill="#334155" stroke="#94a3b8" strokeWidth={0.8} />
          ))}
        </g>
      )}
      <rect x={-55} y={-46} width={110} height={38} rx={5} fill="#2f5fb3" />
      <rect x={-49} y={-41} width={98} height={25} rx={2.5} fill="#e8eefb" />
      {children}
      <rect x={-55} y={-17} width={110} height={9} fill="#2f5fb3" />
      <path d="M-55 -12.5H55" stroke="#dbe4f3" strokeWidth={1.4} />
      {[-40, -27, 27, 40].map((wx) => (
        <circle key={wx} cx={wx} cy={-4} r={4} fill="#334155" stroke="#94a3b8" strokeWidth={0.8} />
      ))}
    </g>
  );
}

/** তিথি and মিতু in their seats, for inside a Train. */
function Riders({ tithi = true, mitu = true }: { tithi?: boolean; mitu?: boolean }) {
  return (
    <>
      {tithi && <Sitter x={-15} y={-19} s={0.58} look={TITHI} hair="braids" />}
      {mitu && <Sitter x={15} y={-19} s={0.58} facing={-1} look={MITU} hair="long" />}
    </>
  );
}

/** Rails along y, from x0 to x1. */
function Rails({ y, x0 = 0, x1 = 300 }: { y: number; x0?: number; x1?: number }) {
  return (
    <g className="pointer-events-none">
      {Array.from({ length: Math.ceil((x1 - x0) / 9) }, (_, i) => (
        <rect key={i} x={x0 + i * 9} y={y + 0.5} width={5} height={2.6} fill="#8a7f6e" />
      ))}
      <path d={`M${x0} ${y}H${x1}`} stroke="#64748b" strokeWidth={1.4} />
    </g>
  );
}

/** চাচা on the platform: lungi, panjabi, white tupi, grey beard; feet at (x, y), about 60 tall at s = 1. */
export function Chacha({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-5 -2v2.5M5 -2v2.5" stroke="#5b3a29" strokeWidth={3} strokeLinecap="round" />
      <path d="M-9 -17L-10.5 -1H10.5L9 -17Z" fill="#3b5b92" />
      <path d="M-9.6 -10H9.7M-10 -5.5H10.1" stroke="#2c4475" strokeWidth={0.8} />
      <path d="M-9 -40L-11 -14H11L9 -40Z" fill="#efe3c8" stroke="#d6c7a6" strokeWidth={0.6} />
      <path d="M-8.5 -38l-3 15M8.5 -38l3 15" stroke="#c68e5f" strokeWidth={3.6} strokeLinecap="round" />
      <circle cy={-50} r={8.5} fill="#c68e5f" />
      <path d="M-8 -50q1 11 8 12q7 -1 8 -12q-3 5 -8 5q-5 0 -8 -5Z" fill="#e5e7eb" stroke="#cbd5e1" strokeWidth={0.5} />
      <path d="M-8 -54q8 -10 16 0Z" fill="#fff" stroke="#cbd5e1" strokeWidth={0.6} />
      <circle cx={-3} cy={-51.5} r={1.1} fill={PH.ink} />
      <circle cx={3} cy={-51.5} r={1.1} fill={PH.ink} />
    </g>
  );
}

/** The station's name board on a post, the post's foot at (x, y). */
function StationSign({ x, y, h = 44 }: { x: number; y: number; h?: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x} ${y}V${y - h}`} stroke="#94a3b8" strokeWidth={2} />
      <rect x={x - 19} y={y - h - 12} width={38} height={13} rx={2.5} fill="#f5ecd7" stroke="#b08a4a" strokeWidth={0.8} />
      <Txt x={x} y={y - h - 2.6} size={8} weight={700}>
        স্টেশন
      </Txt>
    </g>
  );
}

/** A small house as a sticker (ink line, warm fill, a shadow), bottom-centre at (x, y). */
function Hut({ x, y, s = 1, tone = "#c9a56a" }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <ellipse cy={1} rx={17} ry={2.4} fill={PH.ink} opacity={0.1} />
      <rect x={-13} y={-18} width={26} height={18} rx={1} fill="#f3e9d8" stroke={PH.ink} strokeWidth={0.9} />
      <path d="M-16.5 -18L-9 -28H9L16.5 -18Z" fill={tone} stroke={PH.ink} strokeWidth={0.9} strokeLinejoin="round" />
      <rect x={-3} y={-10} width={6} height={10} rx={0.8} fill={PH.ink} opacity={0.75} />
    </g>
  );
}

/** A telegraph pole, its foot at (x, y). */
function Pole({ x, y, h = 56 }: { x: number; y: number; h?: number }) {
  return <path d={`M${x} ${y}V${y - h}M${x - 7} ${y - h + 6}H${x + 7}`} stroke="#64748b" strokeWidth={2} className="pointer-events-none" />;
}

/** The Earth seen from above the pole, land turned by `spin` degrees. */
function Earth({ c, r, spin = 0 }: { c: P; r: number; spin?: number }) {
  const k = r / 50;
  return (
    <g className="pointer-events-none">
      <circle cx={c[0]} cy={c[1]} r={r} fill="#1d4e89" stroke="#3b82c4" strokeWidth={Math.max(0.6, k * 1.5)} />
      <g transform={`rotate(${spin} ${c[0]} ${c[1]})`}>
        <g transform={`translate(${c[0]} ${c[1]}) scale(${k})`} fill="#3f7d4e">
          <path d="M-30 -34q14 -10 26 -2q6 8 -4 16q-12 6 -22 -2q-6 -6 0 -12Z" />
          <path d="M14 -18q14 -2 20 10q4 14 -6 20q-10 2 -14 -8q-4 -12 0 -22Z" />
          <path d="M-34 6q12 -4 18 8q4 14 -2 22q-10 2 -16 -8q-4 -12 0 -22Z" />
          <path d="M4 22q10 -2 14 6q0 10 -8 14q-8 -2 -8 -10Z" />
        </g>
      </g>
    </g>
  );
}

/** A tiny chair: your seat, riding on something. */
function TinyChair({ at, s = 1 }: { at: P; s?: number }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]}) scale(${s})`} className="pointer-events-none">
      <rect x={-3.5} y={-12} width={7} height={6} rx={1} fill="#f5ecd7" />
      <rect x={-4.5} y={-6} width={9} height={2.2} rx={0.8} fill="#f5ecd7" />
      <path d="M-3.6 -4V0M3.6 -4V0" stroke="#f5ecd7" strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

/** A drawn tick in a mint disc. */
function Tick({ at, r = 7 }: { at: P; r?: number }) {
  const k = r / 7;
  return (
    <g className={`pointer-events-none ${POP}`}>
      <circle cx={at[0]} cy={at[1]} r={r} fill={PH.mint} />
      <path d={`M${at[0] - 3.2 * k} ${at[1]}l${2.2 * k} ${2.4 * k}l${4.2 * k} ${-4.6 * k}`} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** A drawn red ✕. */
function Cross({ at, r = 4.5, w = 2 }: { at: P; r?: number; w?: number }) {
  return <path d={`M${at[0] - r} ${at[1] - r}L${at[0] + r} ${at[1] + r}M${at[0] + r} ${at[1] - r}L${at[0] - r} ${at[1] + r}`} stroke={PH.red} strokeWidth={w} strokeLinecap="round" className={`pointer-events-none ${POP}`} />;
}

/** The paper of a soft Sheet (frame="soft"): a full-bleed fill stops at its edge, not over its shadow. */
const paper = (h: number, w = 300) => ({ x: 1.5, y: 1.5, width: w - 3, height: h - 4, rx: 12 });

/** Clips a full-bleed drawing to the sheet's rounded paper. */
function Rounded({ w = 300, h, children }: { w?: number; h: number; children: ReactNode }) {
  const id = `${useId()}c`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect {...paper(h, w)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

/** A measuring line between two points, with end ticks. */
function Ruler({ a, b, tone = PH.mint, dashed = false }: { a: P; b: P; tone?: string; dashed?: boolean }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke={tone} strokeWidth={1.8} strokeDasharray={dashed ? "4 3" : undefined} />
      <path d={`M${b[0]} ${b[1] - 4}V${b[1] + 4}`} stroke={tone} strokeWidth={1.8} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: you, on a chair, quite still. Are you moving?

export function YouSitting({}: Story) {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ঘরে একটা চেয়ারে আপনি চুপচাপ বসে আছেন। মাথার উপরে একটা প্রশ্ন: আপনি কি নড়ছেন?">
        <rect x={34} y={28} width={62} height={50} rx={3} fill="#cfe8ff" stroke="#a8a29e" strokeWidth={1.2} />
        <path d="M65 28V78M34 53H96" stroke="#a8a29e" strokeWidth={1.2} />
        <Sitter x={160} y={113} s={2.2} look={YOU} />
        <text x={160} y={166} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={PH.ink}>
          আপনি
        </text>
        {k >= 1 && <Bubble x={186} y={40} side="right" tone="think" lines={["চুপচাপ বসে আছি।"]} />}
        {k >= 2 && (
          <text x={262} y={104} textAnchor="middle" fontSize={54} fontWeight={800} fill={PH.amber} className={POP} style={{ fontFamily: "ui-monospace, monospace" }}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: sitting still, are you at rest or moving? The pick hangs
// its tag(s) on you, each with a ?. Not marked.

const BET = ["স্থির: আমি তো চুপচাপ বসে আছি", "গতিশীল", "দুটোই হতে পারে"];

export function RestBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  return (
    <>
      <Sheet w={300} h={130} label="চেয়ারে বসা আপনি। বাজি ধরলে আপনার গায়ে স্থির বা গতিশীল tag ঝুলবে, সাথে একটা প্রশ্নবোধক চিহ্ন।" className="max-w-[20rem]">
        <path d="M40 113H260" stroke={PH.faint} strokeWidth={2} strokeLinecap="round" />
        <GroundShadow x={152} y={113} rx={30} />
        <Sitter x={150} y={89} s={1.4} look={YOU} />
        <Txt x={150} y={125} size={8.5} color={PH.mute}>
          আপনি
        </Txt>
        {bet === null && (
          <text x={206} y={60} textAnchor="middle" fontSize={30} fontWeight={800} fill={PH.amber} style={{ fontFamily: "ui-monospace, monospace" }}>
            ?
          </text>
        )}
        {(bet === 0 || bet === 2) && <Tag key={`r${bet}`} x={74} y={56} text="স্থির ?" tone="blue" size={11} pop />}
        {(bet === 1 || bet === 2) && <Tag key={`m${bet}`} x={230} y={56} text="গতিশীল ?" tone="amber" size={11} pop />}
      </Sheet>
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
      <Task done={bet !== null}>চুপচাপ বসে থাকা আপনি: স্থির, না গতিশীল? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The rule, felt first: a metre ruler, a lamppost at 2 m, a rickshaw at
// 4 m. The reader runs the clock; the rickshaw rides to 9 m, the lamppost
// stays. Then they tap the one whose position changed.

const X2 = { x0: 28, m: 24, y: 132, lamp: 2, from: 4, to: 9, N: 24 };
const rx = (m: number) => X2.x0 + m * X2.m;

export function RuleRuler() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const [pick, setPick] = useSeed<"lamp" | "rick" | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // the clock runs evenly; the rickshaw starts and stops on it
  const ride = useWalk(X2.N * 65, { steps: false, ease: "linear" });
  const judge = useWalk(650, { steps: false, ease: "out" });
  const run = () => {
    if (ride.running || judge.running) return;
    setPick(null);
    sfx.pedal();
    ride.start(() => setRan(true));
  };
  const choose = (p: "lamp" | "rick") => {
    if (!ran || ride.running || judge.running || pick === "rick") return;
    setPick(p);
    sfx.tap();
    judge.start(() => {
      if (p === "rick") {
        sfx.chime();
        pass("অবস্থান বদলালো, তাই রিকশা গতিশীল।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = ride.running ? ride.t : ran ? 1 : 0;
  const m = lerp(X2.from, X2.to, ease(t));
  const jt = judge.running ? judge.t : pick ? 1 : 0;
  const right = pick === "rick" && !judge.running;
  const wrong = pick === "lamp" && !judge.running;
  const lampX = rx(X2.lamp);
  const rickX = rx(m);
  return (
    <>
      <Sheet w={300} h={160} label="মিটারের দাগ কাটা একটা ফিতা, 0 থেকে 10 m। 2 m দাগে একটা ল্যাম্পপোস্ট, 4 m দাগে একটা রিকশা, উপরে একটা ঘড়ি।" className="max-w-[22rem]">
        <path d={`M${X2.x0 - 10} ${X2.y}H${rx(10) + 10}`} stroke={PH.mute} strokeWidth={2} strokeLinecap="round" className="pointer-events-none" />
        {Array.from({ length: 11 }, (_, i) => (
          <g key={i} className="pointer-events-none">
            <path d={`M${rx(i)} ${X2.y}v${i % 5 ? 4 : 7}`} stroke={PH.mute} strokeWidth={1.2} />
            <Txt x={rx(i)} y={X2.y + 16} size={8} color={PH.mute} weight={500}>
              {String(i)}
            </Txt>
          </g>
        ))}
        <Txt x={rx(10) + 14} y={X2.y + 16} size={8} color={PH.mute} weight={500}>
          m
        </Txt>
        <Clock x={160} y={30} r={16} turn={t} label="সময়" />
        {t > 0 && <path d={`M${rx(X2.from)} ${X2.y}H${rickX}`} stroke={PH.cream} strokeWidth={3} strokeDasharray="0.1 5" strokeLinecap="round" className="pointer-events-none" />}
        {t > 0 && <circle cx={rx(X2.from)} cy={X2.y} r={3} fill="none" stroke={PH.amber} strokeWidth={1.2} className="pointer-events-none" />}
        <GroundShadow x={lampX + 2} y={X2.y} rx={8} />
        <Lamppost x={lampX} y={X2.y} />
        <GroundShadow x={rickX - 2} y={X2.y} rx={24} />
        <Rickshaw x={rickX} y={X2.y - 1} s={0.3} spin={(m - X2.from) * 140} />
        <circle cx={lampX} cy={X2.y} r={3.6} fill={PH.blue} stroke="#fff" strokeWidth={1.2} className="pointer-events-none" />
        <circle cx={rickX} cy={X2.y} r={3.6} fill={PH.amber} stroke="#fff" strokeWidth={1.2} className="pointer-events-none" />
        {pick === "rick" && jt > 0 && <path d={`M${rx(X2.from)} ${X2.y + 24}H${lerp(rx(X2.from), rickX, jt)}`} stroke={PH.amber} strokeWidth={2.4} strokeLinecap="round" className="pointer-events-none" />}
        {wrong && <WrongMark key={miss} x={lampX - 14} y={X2.y - 50} />}
        {right && <Ripple at={[rickX - 4, X2.y - 28]} r={34} />}
        {right && <Tag x={lampX} y={42} text="স্থির · rest" tone="blue" pop />}
        {right && <Tag x={rickX - 16} y={60} text="গতিশীল · motion" tone="amber" pop />}
        {ran &&
          !right &&
          !ride.running &&
          (
            [
              ["lamp", lampX, X2.y - 40, 14, 44],
              ["rick", rickX - 8, X2.y - 28, 34, 34],
            ] as const
          ).map(([key, cx, cy, rw, rh]) => (
            <g key={key} onClick={() => choose(key)} className="cursor-pointer" role="button" aria-label={key === "lamp" ? "ল্যাম্পপোস্ট" : "রিকশা"}>
              <rect x={cx - rw} y={cy - rh} width={rw * 2} height={rh * 2} rx={8} fill="transparent" stroke={PH.blue} strokeWidth={1.2} strokeDasharray="3 3" />
            </g>
          ))}
      </Sheet>
      <div className="mx-auto mt-2 grid w-full max-w-[20rem] grid-cols-2 gap-2 text-center text-sm">
        <div className="rounded-lg border border-border px-2 py-1">
          <div className="text-xs text-muted">ল্যাম্পপোস্ট</div>
          <span className="font-mono">2 m</span> → <span className={`font-mono ${wrong ? "font-bold text-danger" : ""}`}>{t > 0 ? "2 m" : "?"}</span>
        </div>
        <div className="rounded-lg border border-border px-2 py-1">
          <div className="text-xs text-muted">রিকশা</div>
          <span className="font-mono">4 m</span> → <span className={`font-mono ${right ? "font-bold text-accent-text" : ""}`}>{t > 0 ? `${fmt(m)} m` : "?"}</span>
        </div>
      </div>
      {!right && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={`${primaryBtn} h-9! px-4!`} disabled={ride.running || judge.running} onClick={run}>
            {ran ? "আবার চালান" : "ঘড়ি চালান"}
          </button>
        </div>
      )}
      {wrong && <Nope key={miss}>ঘড়ি ঘুরলো, কিন্তু ল্যাম্পপোস্ট 2 m দাগেই রইলো। ওটার অবস্থান বদলায়নি। কোনটা দাগ ছেড়ে সরে গেলো?</Nope>}
      <Task done={right}>ঘড়ি চালান। তারপর যেটার অবস্থান বদলেছে, সেটায় tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3a · Story scene for screen 3: the train from ফরিদপুর to ঢাকা, তিথি and মিতু
// face to face inside.

export function TrainRide({}: Story) {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  const tx = k === 0 ? -200 : 116;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ফরিদপুর থেকে ঢাকার ট্রেন। একটা কামরায় তিথি, সামনের সিটে ওর বান্ধবী মিতু।">
        <Tree x={70} y={150} s={0.9} />
        <Tree x={244} y={150} s={0.8} />
        {(
          [
            [30, "ফরিদপুর"],
            [292, "ঢাকা"],
          ] as const
        ).map(([x, name]) => (
          <g key={name}>
            <path d={`M${x} 150V60`} stroke="#78716c" strokeWidth={2} />
            <rect x={x - 25} y={46} width={50} height={15} rx={3} fill="#fff" stroke="#78716c" strokeWidth={0.8} />
            <text x={x} y={56.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={PH.ink}>
              {name}
            </text>
          </g>
        ))}
        <Rails y={150} x0={0} x1={320} />
        <g style={{ transform: `translate(${tx}px, 150px)` }} className="transition-transform duration-[1600ms] ease-out motion-reduce:transition-none">
          <Train x={0} y={0} s={1.6}>
            <Riders />
          </Train>
        </g>
        {k >= 2 && (
          <g className={FADE}>
            <Tag x={tx - 24} y={66} text="তিথি" tone="ink" size={8.5} />
            <Tag x={tx + 24} y={66} text="মিতু" tone="ink" size={8.5} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 3 · তিথির চোখে: inside the carriage, তিথির seat is the origin and মিতু sits
// 1.5 m away. The reader predicts where মিতু is after an hour; each pick runs
// the clock 0 → 60 min and plays it. A wrong one slides মিতু off her seat.

const X3 = { tithi: 75, mitu: 225, seat: 126, U: 100, N: 26 };
const X3_OPTS = [
  { label: "দূরে সরে যাবে: ট্রেন তো চলছে", end: 315 },
  { label: "একই জায়গায় থাকবে", end: 225 },
  { label: "কাছে চলে আসবে", end: 125 },
];
const X3_RIGHT = 1;
const X3_NOPE = [
  "মিতু সিট ছেড়ে কামরার দেয়াল পার হয়ে গেলো! ট্রেন চললে তিথিও একই সাথে চলে। তিথির সিট থেকে মিতুর দূরত্ব বদলানোর কারণ নেই।",
  "",
  "মিতু সিট ছেড়ে তিথির দিকে পিছলে এলো! কেউ তো সিট ছাড়েনি। তিথির ruler-এ দূরত্বটা কেন বদলাবে?",
];

/** The carriage from inside: wall, two windows, floor, a clock; তিথি left, মিতু right. */
function Carriage({ turn, mituX = X3.mitu, jig = 0, children }: { turn: number; mituX?: number; jig?: number; children?: ReactNode }) {
  return (
    <Rounded h={184}>
    <g style={{ transform: `translate(0px, ${jig}px)` }}>
      <rect x={0} y={-4} width={300} height={154} fill="#e3eaf6" className="pointer-events-none" />
      {[30, 180].map((wx) => (
        <g key={wx} className="pointer-events-none">
          <rect x={wx} y={22} width={90} height={56} rx={6} fill="#cfe8ff" stroke="#94a3b8" strokeWidth={1.4} />
          <rect x={wx + 1} y={64} width={88} height={13} rx={2} fill="#b7dca0" />
        </g>
      ))}
      <rect x={0} y={150} width={300} height={38} fill="#c9b79a" className="pointer-events-none" />
      <Clock x={150} y={44} r={17} turn={turn} label={`${Math.round(turn * 60)} min`} />
      <Sitter x={X3.tithi} y={X3.seat} s={1.4} look={TITHI} hair="braids" />
      <Seat x={X3.mitu} y={X3.seat} s={1.4} facing={-1} />
      <Sitter x={mituX} y={X3.seat} s={1.4} facing={-1} look={MITU} hair="long" seat={false} />
      {children}
    </g>
    </Rounded>
  );
}

export function MituHour() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // the clock's hand is time, so it runs evenly; মিতু (on a wrong pick) starts and stops on it
  const hour = useWalk(X3.N * 65, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (hour.running) return;
    setPick(i);
    sfx.rumble(1.6);
    hour.start(() => {
      if (i === X3_RIGHT) {
        sfx.chime();
        pass("ঘড়ি এক ঘণ্টা ঘুরলো, মিতু 1.5 m-এই থাকলো।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : hour.running ? hour.t : 1;
  const end = pick === null ? X3.mitu : X3_OPTS[pick].end;
  const mx = lerp(X3.mitu, end, ease(t));
  const right = pick === X3_RIGHT && !hour.running;
  const wrong = pick !== null && pick !== X3_RIGHT && !hour.running;
  const jig = hour.running ? Math.sin(t * 56) * 0.8 : 0;
  return (
    <>
      <Sheet w={300} h={184} label="ট্রেনের কামরার ভেতর। বাঁয়ে তিথি, ডানে মিতু, মাঝখানে একটা ঘড়ি। তিথির সিট থেকে মিতু পর্যন্ত একটা ruler, 1.5 m।" className="max-w-[21rem]">
        <Carriage turn={t} mituX={mx} jig={jig}>
          <circle cx={X3.tithi} cy={164} r={4} fill={PH.mint} stroke="#fff" strokeWidth={1.2} className="pointer-events-none" />
          <Ruler a={[X3.tithi, 164]} b={[mx, 164]} tone={right || pick === null ? PH.mint : hour.running ? PH.blue : PH.red} />
          <Tag x={(X3.tithi + Math.min(mx, 290)) / 2} y={164} text={`${fmt((mx - X3.tithi) / X3.U)} m`} tone={right || pick === null ? "mint" : hour.running ? "blue" : "red"} size={9} />
          {wrong && <WrongMark key={miss} x={end > X3.mitu ? Math.min(mx + 4, 284) : mx - 22} y={68} />}
          {right && <Ripple at={[X3.mitu, X3.seat - 22]} r={34} />}
          <Txt x={X3.tithi} y={179} size={8} color={PH.ink}>
            তিথি
          </Txt>
          <Txt x={X3.mitu} y={179} size={8} color={PH.ink}>
            মিতু
          </Txt>
          {right && <Tag x={150} y={104} text="তিথির কাছে মিতু: স্থির" tone="blue" solid pop />}
        </Carriage>
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X3_OPTS.map((o, i) => (
          <Choice key={o.label} n={i} look={pick === i && !hour.running ? (i === X3_RIGHT ? "right" : "wrong") : "idle"} disabled={hour.running || right} onClick={() => choose(i)}>
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 62 14" className="h-3.5 w-[3.9rem] shrink-0" aria-hidden="true">
                <circle cx={5} cy={7} r={3.4} fill={PH.mint} />
                {i !== X3_RIGHT && <circle cx={35} cy={7} r={3} fill="none" stroke={MITU.shirt} strokeWidth={1} strokeDasharray="1.6 1.4" />}
                <path d={`M5 7H${5 + ((o.end - X3.tithi) / X3.U) * 20}`} stroke={PH.mute} strokeWidth={1.2} />
                <circle cx={5 + ((o.end - X3.tithi) / X3.U) * 20} cy={7} r={3.4} fill={MITU.shirt} />
              </svg>
              <span>{o.label}</span>
            </span>
          </Choice>
        ))}
      </div>
      {wrong && pick !== null && <Nope key={miss}>{X3_NOPE[pick]}</Nope>}
      <Task done={right}>ঘড়ি এক ঘণ্টা চললে, তিথির ruler-এ মিতু কোথায় থাকবে? বেছে নিন, তারপর দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4a · Story scene for screen 4: চাচা on the platform; the train whooshes past.

export function PlatformPass({}: Story) {
  const s = useScene(2, [600, 1500]);
  const k = s.k;
  const tx = k === 0 ? -190 : k === 1 ? 104 : 330;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="স্টেশনের platform-এ এক চাচা দাঁড়িয়ে। ট্রেনটা হুশ করে চলে গেলো, ভেতরে তিথি আর মিতু।">
        <Pole x={40} y={132} h={70} />
        <Pole x={270} y={132} h={70} />
        <Tree x={238} y={132} s={0.75} />
        <StationSign x={56} y={136} h={74} />
        <Rails y={132} x0={0} x1={320} />
        <g style={{ transform: `translate(${tx}px, 132px)` }} className="transition-transform duration-[1500ms] ease-in-out motion-reduce:transition-none">
          <Train x={0} y={0} s={1.3}>
            <Riders />
          </Train>
        </g>
        <rect x={0} y={136} width={320} height={22} fill="#d6d3cb" />
        <path d="M0 136.5H320" stroke="#a8a29e" strokeWidth={1.2} />
        <Chacha x={196} y={156} />
        <text x={196} y={169} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={PH.ink}>
          চাচা
        </text>
        {k >= 2 && <Bubble x={198} y={90} side="left" lines={["দুজনেই হুশ করে", "চলে গেলো!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4 · চাচার চোখে: his spot on the platform is the origin. Who is moving? Each
// pick plays the train going by; a wrong pick leaves a girl hanging over the
// platform while the train goes on without her. Live distances from চাচা.

const X4 = { rail: 94, chacha: 56, U: 20, x0: 106, x1: 256, N: 26 };
const X4_RY = X4.rail + 46;
const X4_OPTS = ["কেউ না: দুজনেই তো সিটে চুপচাপ বসা", "শুধু তিথি: মিতু তো স্থির, আগেই দেখলাম", "তিথি আর মিতু, দুজনেই"];
const X4_RIGHT = 2;
const X4_NOPE = [
  "ট্রেন চলে গেলো, তিথি আর মিতু platform-এর উপর ঝুলে রইলো! ওরা তো ট্রেনের ভেতরে বসা, ট্রেনের সাথেই যায়।",
  "ট্রেন মিতুকে ফেলে চলে গেলো! মিতু স্থির ছিলো তিথির ruler-এ। চাচার ruler-এ মিতুর দূরত্বটা দেখুন।",
  "",
];

export function ChachaSees() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const ride = useWalk(X4.N * 60, { steps: false });
  const choose = (i: number) => {
    if (ride.running) return;
    setPick(i);
    sfx.whoosh(1.2);
    ride.start(() => {
      if (i === X4_RIGHT) {
        sfx.chime();
        pass("চাচার দাগ থেকে দুজনের দূরত্বই বদলালো।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : ride.running ? ride.t : 1;
  const xT = lerp(X4.x0, X4.x1, t);
  const tithiRides = pick !== 0;
  const mituRides = pick === X4_RIGHT || pick === null;
  const tx = (tithiRides ? xT : X4.x0) - 15;
  const mx = (mituRides ? xT : X4.x0) + 15;
  const right = pick === X4_RIGHT && !ride.running;
  const wrong = pick !== null && pick !== X4_RIGHT && !ride.running;
  const seatY = X4.rail - 19;
  return (
    <>
      <Sheet w={300} h={152} label="platform-এ চাচা দাঁড়িয়ে, তার পায়ের কাছে মূল বিন্দু। পেছনে রেললাইনে ট্রেন, ভেতরে তিথি আর মিতু।" className="max-w-[22rem]">
        <Pole x={140} y={X4.rail} h={66} />
        <Tree x={214} y={X4.rail} s={0.62} />
        <Rails y={X4.rail} />
        <Train x={xT} y={X4.rail}>
          <Riders tithi={tithiRides} mitu={mituRides} />
        </Train>
        {!tithiRides && <Sitter x={tx} y={seatY} s={0.58} look={TITHI} hair="braids" />}
        {!mituRides && <Sitter x={mx} y={seatY} s={0.58} facing={-1} look={MITU} hair="long" />}
        <Rounded h={152}>
          <rect x={0} y={X4.rail + 6} width={300} height={60} fill="#e7e5df" className="pointer-events-none" />
        </Rounded>
        <path d={`M0 ${X4.rail + 6.5}H300`} stroke="#a8a29e" strokeWidth={1.2} className="pointer-events-none" />
        <StationSign x={22} y={X4.rail + 32} h={26} />
        <GroundShadow x={X4.chacha} y={X4.rail + 32.5} rx={10} />
        <Chacha x={X4.chacha} y={X4.rail + 32} s={0.72} />
        {[tx, mx].map((gx, i) => (
          <path key={i} d={`M${gx} ${seatY + 6}V${X4_RY}`} stroke={PH.amber} strokeWidth={0.9} strokeDasharray="2 2.5" opacity={0.8} className="pointer-events-none" />
        ))}
        <path d={`M${X4.chacha} ${X4_RY}H${Math.max(tx, mx)}`} stroke={PH.amber} strokeWidth={1.8} className="pointer-events-none" />
        {[tx, mx].map((gx, i) => (
          <path key={i} d={`M${gx} ${X4_RY - 4}V${X4_RY + 4}`} stroke={PH.amber} strokeWidth={1.8} className="pointer-events-none" />
        ))}
        <circle cx={X4.chacha} cy={X4_RY} r={4} fill={PH.amber} stroke="#fff" strokeWidth={1.2} className="pointer-events-none" />
        {wrong && <WrongMark key={miss} x={pick === 0 ? X4.x0 : X4.x0 + 2} y={44} />}
        {right && <Ripple at={[xT, seatY - 6]} r={36} />}
        {right && <Tag x={94} y={68} text="চাচার চোখে: দুজনেই গতিশীল" tone="amber" solid pop />}
      </Sheet>
      <div className="mx-auto mt-1.5 w-full max-w-[21rem] text-center text-sm">
        <span className="text-muted">চাচার দাগ থেকে:</span> তিথি <span className="font-mono tabular-nums">{fmt((tx - X4.chacha) / X4.U)} m</span> · মিতু <span className="font-mono tabular-nums">{fmt((mx - X4.chacha) / X4.U)} m</span>
      </div>
      <div className="mt-2 grid gap-2">
        {X4_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && !ride.running ? (i === X4_RIGHT ? "right" : "wrong") : "idle"} disabled={ride.running || right} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {wrong && pick !== null && <Nope key={miss}>{X4_NOPE[pick]}</Nope>}
      <Task done={right}>চাচার চোখে কে কে গতিশীল? বেছে নিন, তারপর ট্রেনটা যেতে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Who is wrong? Two panels: তিথির চোখে (স্থির!) and চাচার চোখে (গতিশীল!). A
// one-sided pick plays the other panel, which proves the other one right too.

const X5 = { N: 26, lt: 40, lm: 112, lseat: 141, rail: 140, chacha: 170, s: 0.6, xT0: 214, xT1: 280, U: 12 };
const X5_OPTS = ["তিথি ঠিক, চাচা ভুল", "চাচা ঠিক, তিথি ভুল", "দুজনেই ঠিক"];
const X5_RIGHT = 2;
const X5_NOPE = ["চাচার ruler-এ মিতুর দূরত্ব বাড়তেই থাকলো। চাচাও ভুল দেখেননি।", "তিথির ruler-এ পুরো এক ঘণ্টা মিতু 1.5 m দূরে। তিথিও ভুল বলেনি।", ""];

/** The two panels; `turn` runs তিথির clock, `xT` puts the train in চাচার panel. */
function TwoViews({ turn, xT, ticks = false, children }: { turn: number; xT: number; ticks?: boolean; children?: ReactNode }) {
  const clip = `${useId()}r`;
  const mx = xT + 15 * X5.s;
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <rect x={152} y={22} width={144} height={154} rx={8} />
        </clipPath>
      </defs>
      <g className="pointer-events-none">
        <rect x={4} y={22} width={144} height={154} rx={8} fill="#eef2f8" stroke={PH.faint} strokeWidth={1.2} />
        <rect x={14} y={44} width={124} height={50} rx={5} fill="#cfe8ff" stroke="#94a3b8" strokeWidth={1} />
        <rect x={4} y={156} width={144} height={20} fill="#c9b79a" />
        <Txt x={14} y={36} size={9} weight={700} anchor="start">
          তিথির চোখে
        </Txt>
        <Clock x={118} y={60} r={10} turn={turn} label={`${Math.round(turn * 60)} min`} />
        <Sitter x={X5.lt} y={X5.lseat} s={0.9} look={TITHI} hair="braids" />
        <Sitter x={X5.lm} y={X5.lseat} s={0.9} facing={-1} look={MITU} hair="long" />
        <circle cx={X5.lt} cy={166} r={3.4} fill={PH.mint} stroke="#fff" strokeWidth={1} />
        <Ruler a={[X5.lt, 166]} b={[X5.lm, 166]} />
        <Tag x={(X5.lt + X5.lm) / 2} y={166} text="1.5 m" tone="mint" size={8} />
        <Bubble x={42} y={104} side="right" lines={["স্থির!"]} />
      </g>
      <g className="pointer-events-none">
        <rect x={152} y={22} width={144} height={154} rx={8} fill="#f8fafc" stroke={PH.faint} strokeWidth={1.2} />
        <g clipPath={`url(#${clip})`}>
          <Pole x={262} y={X5.rail} h={56} />
          <Rails y={X5.rail} x0={152} x1={296} />
          <Train x={xT} y={X5.rail} s={X5.s}>
            <Riders />
          </Train>
          <rect x={152} y={144} width={144} height={32} fill="#e7e5df" />
          <path d="M152 144.5H296" stroke="#a8a29e" strokeWidth={1} />
          <Chacha x={X5.chacha} y={166} s={0.5} />
          <path d={`M${mx} ${X5.rail - 10}V170`} stroke={PH.amber} strokeWidth={0.9} strokeDasharray="2 2.5" />
          <path d={`M${X5.chacha} 170H${mx}`} stroke={PH.amber} strokeWidth={1.8} />
          <circle cx={X5.chacha} cy={170} r={3.4} fill={PH.amber} stroke="#fff" strokeWidth={1} />
          <Tag x={Math.min(mx, 262)} y={156} text={`মিতু: ${fmt((mx - X5.chacha) / X5.U)} m`} tone="amber" size={8} />
        </g>
        <Txt x={162} y={36} size={9} weight={700} anchor="start">
          চাচার চোখে
        </Txt>
        <Bubble x={172} y={108} side="right" lines={["গতিশীল!"]} />
      </g>
      {ticks && <Ripple at={[76, 100]} r={40} />}
      {ticks && <Ripple at={[224, 100]} r={40} />}
      {ticks && <Tick at={[136, 32]} r={6} />}
      {ticks && <Tick at={[284, 32]} r={6} />}
      {children}
    </>
  );
}

export function WhoIsRight() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // তিথির clock runs evenly; চাচার train starts and stops on it
  const hour = useWalk(X5.N * 65, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (hour.running) return;
    setPick(i);
    sfx.tap();
    hour.start(() => {
      if (i === X5_RIGHT) {
        sfx.chime();
        pass("দুজনেই ঠিক: মাপছে আলাদা জায়গা থেকে।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : hour.running ? hour.t : 1;
  const left = pick === 1 || pick === 2;
  const rightPanel = pick === 0 || pick === 2;
  const right = pick === X5_RIGHT && !hour.running;
  const wrong = pick !== null && pick !== X5_RIGHT && !hour.running;
  return (
    <>
      <Sheet w={300} h={190} label="দুইটা ছবি পাশাপাশি। বাঁয়ে তিথির চোখে: কামরার ভেতর, মিতু 1.5 m দূরে, তিথি বলছে স্থির। ডানে চাচার চোখে: ট্রেন চলে যাচ্ছে, চাচা বলছেন গতিশীল।" className="max-w-[22rem]">
        <g transform="translate(0 8)">
          <TwoViews turn={left ? t : 0} xT={lerp(X5.xT0, X5.xT1, rightPanel ? ease(t) : 0)} ticks={right}>
            {/* the one called wrong was measuring right all along: a ? on their word */}
            {wrong && <WrongMark key={miss} x={pick === 0 ? 220 : 82} y={102} />}
          </TwoViews>
        </g>
        <Tag key={right ? "ok" : "q"} x={150} y={15} text={right ? "দুজনেই ঠিক" : "কেউ একজন ভুল?"} tone={right ? "mint" : "red"} solid size={8.5} pop={right} />
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X5_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && !hour.running ? (i === X5_RIGHT ? "right" : "wrong") : "idle"} disabled={hour.running || right} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {wrong && pick !== null && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>তিথি বলছে স্থির, চাচা বলছেন গতিশীল। কার কথা ঠিক? বেছে নিন, তারপর দেখুন।</Task>
    </>
  );
}

// 5½ · Figure for screen 5's explanation: one picture, one মিতু, two origins.
// তিথির seat (mint) rides with the train, 1.5 m holds; চাচার spot (amber) stays,
// its reading changes as the train moves on.

const S5_SAY = ["একই মিতু, দুইজন মাপছে।", "তিথি মাপছে ট্রেনের ভেতর থেকে।", "চাচা মাপছেন platform থেকে।", "ট্রেন এগোলো। মূল বিন্দু আলাদা, তাই উত্তরও আলাদা।"];
const S5 = { rail: 96, s: 1.15, chacha: 40, U: 23 };

export function TwoOrigins({}: Story) {
  const sc = useScene(3, [600, 1600, 1600]);
  const k = sc.k;
  const [xT] = useTween([k >= 3 ? 205 : 150], 1400);
  const tX = xT - 15 * S5.s;
  const mX = xT + 15 * S5.s;
  const seatY = S5.rail - 19 * S5.s;
  return (
    <Scene scene={sc} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <Sheet w={300} h={150} label="platform-এর পাশে ট্রেন, ভেতরে তিথি আর মিতু। তিথির সিটে একটা মূল বিন্দু, চাচার পায়ের কাছে আরেকটা। দুই জায়গা থেকে মিতুকে মাপা হচ্ছে।" className="max-w-[19rem]">
        <Rails y={S5.rail} />
        <Train x={xT} y={S5.rail} s={S5.s}>
          <Riders />
        </Train>
        <Rounded h={150}>
          <rect x={0} y={S5.rail + 6} width={300} height={60} fill="#e7e5df" className="pointer-events-none" />
        </Rounded>
        <path d={`M0 ${S5.rail + 6.5}H300`} stroke="#a8a29e" strokeWidth={1.2} className="pointer-events-none" />
        <Chacha x={S5.chacha} y={S5.rail + 38} s={0.72} />
        {k >= 1 && (
          <g className={FADE}>
            <circle cx={tX} cy={seatY} r={8} fill={PH.mintSoft} opacity={0.8} className="pointer-events-none" />
            <circle cx={tX} cy={seatY} r={3.4} fill={PH.mint} stroke="#fff" strokeWidth={1} className="pointer-events-none" />
            <Ruler a={[tX, seatY]} b={[mX, seatY]} />
            <Tag x={xT} y={26} text="ট্রেন থেকে: 1.5 m" tone="mint" solid size={8.5} />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <circle cx={S5.chacha} cy={S5.rail + 44} r={8} fill={PH.amberSoft} className="pointer-events-none" />
            <path d={`M${mX} ${seatY + 4}V${S5.rail + 44}`} stroke={PH.amber} strokeWidth={0.9} strokeDasharray="2 2.5" className="pointer-events-none" />
            <path d={`M${S5.chacha} ${S5.rail + 44}H${mX}`} stroke={PH.amber} strokeWidth={1.8} className="pointer-events-none" />
            <circle cx={S5.chacha} cy={S5.rail + 44} r={3.4} fill={PH.amber} stroke="#fff" strokeWidth={1} className="pointer-events-none" />
            <Tag x={(S5.chacha + mX) / 2 + 16} y={S5.rail + 26} text={`platform থেকে: ${fmt((mX - S5.chacha) / S5.U)} m`} tone="amber" solid size={8.5} />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · The window: take the train as still. Which way does the tree outside
// go? Each pick plays in the window; glued to the window or running ahead
// are both shown for what they would mean.

const X6 = { N: 28, shift: 150, ground: 96 };
type Item = { kind: "tree" | "hut" | "pole" | "chacha" | "sign"; x: number; main?: boolean };
const X6_ITEMS: Item[] = [
  { kind: "tree", x: 40 },
  { kind: "hut", x: 105 },
  { kind: "pole", x: 160 },
  { kind: "tree", x: 225, main: true },
  { kind: "hut", x: 300 },
  { kind: "tree", x: 350 },
  { kind: "pole", x: 410 },
  { kind: "hut", x: 455 },
];
const X6_SPAN = 480;

/**
 * The view from তিথির window, the train taken as still: whatever is outside
 * sits at its x shifted by `shift` (negative = backwards, towards ফরিদপুর).
 * The main item stays unwrapped, so it can run off the glass.
 */
function WindowScene({ shift, items, mainLabel, h = 150, arrow = true, children }: { shift: number; items: Item[]; mainLabel: string; h?: number; arrow?: boolean; children?: ReactNode }) {
  const clip = `${useId()}w`;
  const wrap = (x: number) => ((((x + 30) % X6_SPAN) + X6_SPAN) % X6_SPAN) - 30;
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <rect x={24} y={18} width={252} height={96} rx={8} />
        </clipPath>
      </defs>
      <rect {...paper(h)} fill="#dfe7f3" className="pointer-events-none" />
      <rect x={24} y={18} width={252} height={96} rx={8} fill="#cfe8ff" className="pointer-events-none" />
      <g clipPath={`url(#${clip})`} className="pointer-events-none">
        <rect x={24} y={X6.ground} width={252} height={20} fill="#9cc97e" />
        {items.map((it, i) => {
          const x = it.main ? it.x + shift : wrap(it.x + shift);
          return (
            <g key={i}>
              {it.kind === "tree" && <Tree x={x} y={X6.ground + 4} s={0.78} />}
              {it.kind === "hut" && <Hut x={x} y={X6.ground + 4} s={1.1} />}
              {it.kind === "pole" && <Pole x={x} y={X6.ground + 4} h={60} />}
              {it.kind === "sign" && <StationSign x={x} y={X6.ground + 4} h={26} />}
              {it.kind === "chacha" && <Chacha x={x} y={X6.ground + 8} s={0.62} />}
              {it.main && <Tag x={x} y={it.kind === "chacha" ? X6.ground - 38 : X6.ground - 54} text={mainLabel} tone="amber" size={8} />}
            </g>
          );
        })}
      </g>
      <rect x={24} y={18} width={252} height={96} rx={8} fill="none" stroke="#64748b" strokeWidth={3} className="pointer-events-none" />
      <circle cx={34} cy={128} r={4} fill={PH.mint} stroke="#fff" strokeWidth={1.2} className="pointer-events-none" />
      <Tag x={86} y={128} text="মূল বিন্দু: ট্রেন" tone="mint" size={8.5} />
      {arrow && (
        <g>
          <Txt x={124} y={158} size={8} anchor="end" color={PH.mute}>
            ফরিদপুর
          </Txt>
          <PArrow a={[130, 155]} b={[206, 155]} tone="blue" w={2} tell="ট্রেন চলছে ঢাকার দিকে" />
          <Txt x={212} y={158} size={8} anchor="start" color={PH.mute}>
            ঢাকা
          </Txt>
        </g>
      )}
      {children}
    </>
  );
}

const X6_OPTS = [
  { label: "দাঁড়িয়েই থাকবে", dir: 0 },
  { label: "সামনে, ঢাকার দিকে", dir: 1 },
  { label: "পেছনে, ফরিদপুরের দিকে", dir: -1 },
];
const X6_RIGHT = 2;
const X6_NOPE = [
  "গাছটা জানালার একই জায়গায় আটকে রইলো। মানে গাছও ট্রেনের সাথে ঢাকা যাচ্ছে! গাছ তো মাটিতে পোঁতা।",
  "গাছ ট্রেনকে ছাড়িয়ে ঢাকার দিকে দৌড় দিলো! তাহলে গাছ ট্রেনের চেয়েও জোরে ছুটছে। গাছ তো মাটিতে পোঁতা।",
  "",
];

function MiniTree({ dir }: { dir: number }) {
  return (
    <svg viewBox="0 0 64 34" className="h-7 w-[3.3rem] shrink-0" aria-hidden="true">
      <path d="M4 30H60" stroke="#9cc97e" strokeWidth={3} />
      <Tree x={32} y={30} s={0.42} />
      {dir !== 0 && <PArrow a={[dir > 0 ? 40 : 24, 9]} b={[dir > 0 ? 60 : 4, 9]} tone="blue" w={1.8} tell={dir > 0 ? "সামনে" : "পেছনে"} />}
      {dir === 0 && <circle cx={32} cy={31} r={2.4} fill={PH.blue} />}
    </svg>
  );
}

export function WindowView() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const ride = useWalk(X6.N * 60, { steps: false });
  const choose = (i: number) => {
    if (ride.running) return;
    setPick(i);
    sfx.rumble(1.6);
    ride.start(() => {
      if (i === X6_RIGHT) {
        sfx.chime();
        pass("ট্রেন থেকে দেখলে গাছ পেছনে ছোটে।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : ride.running ? ride.t : 1;
  const dir = pick === null ? 0 : X6_OPTS[pick].dir;
  const shift = dir * X6.shift * t;
  const right = pick === X6_RIGHT && !ride.running;
  const wrong = pick !== null && pick !== X6_RIGHT && !ride.running;
  const jig = ride.running ? Math.sin(t * 60) * 0.7 : 0;
  return (
    <>
      <Sheet w={300} h={170} label="ট্রেনের জানালা দিয়ে বাইরে: গাছ, ঘর, খুঁটি। ট্রেনটাই মূল বিন্দু। ট্রেন চলছে ফরিদপুর থেকে ঢাকার দিকে, ডানে।" className="max-w-[22rem]">
        <g style={{ transform: `translate(0px, ${jig}px)` }}>
          <WindowScene shift={shift} items={X6_ITEMS} mainLabel="গাছ" h={170}>
            {/* glued to the glass: the ? sits by the tree; run ahead: it sits where the tree left the glass */}
            {wrong && <WrongMark key={miss} x={pick === 0 ? 225 + 30 : 262} y={X6.ground - 44} />}
            {right && <Ripple at={[225 - X6.shift, X6.ground - 22]} r={32} />}
            {right && <Tag x={214} y={128} text="ট্রেন স্থির ধরলে: এটাও ঠিক" tone="mint" solid pop />}
          </WindowScene>
        </g>
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X6_OPTS.map((o, i) => (
          <Choice key={o.label} n={i} look={pick === i && !ride.running ? (i === X6_RIGHT ? "right" : "wrong") : "idle"} disabled={ride.running || right} onClick={() => choose(i)}>
            <span className="flex items-center gap-2">
              <MiniTree dir={o.dir} />
              <span>{o.label}</span>
            </span>
          </Choice>
        ))}
      </div>
      {wrong && pick !== null && <Nope key={miss}>{X6_NOPE[pick]}</Nope>}
      <Task done={right}>ট্রেনকে স্থির ধরলে, জানালার বাইরের গাছটা কোন দিকে যায়? বেছে নিন, তারপর দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The hunt for a truly still point. Three candidates; each tap zooms to
// the level where it moves: the ground spins with the Earth, the Earth's
// centre circles the Sun, the Sun circles the galaxy's centre. Three ✕.

type Cand = "ground" | "earth" | "sun";
const X7: { key: Cand; name: string; say: string }[] = [
  { key: "ground", name: "মাটি", say: "মাটি? পৃথিবী তো নিজেই ঘুরছে!" },
  { key: "earth", name: "পৃথিবীর কেন্দ্র", say: "পৃথিবীর কেন্দ্র? সেটা ঘুরছে সূর্যকে ঘিরে।" },
  { key: "sun", name: "সূর্য", say: "সূর্য? সূর্যও ঘুরছে ছায়াপথের কেন্দ্রকে ঘিরে।" },
];
const X7_N = 26;
const C7: P = [150, 94];

/** One level of the zoom: `view` picks it, `t` (0…1) how far its motion has run (a spin and orbits: even, so linear). */
function SpaceView({ view, t, tested }: { view: Cand; t: number; tested: boolean }) {
  const e = t;
  if (view === "ground") {
    const spin = 150 * e;
    const g = onCircle(C7, 58, -125 + spin);
    return (
      <g>
        <Earth c={C7} r={58} spin={spin} />
        <circle cx={C7[0]} cy={C7[1]} r={2.4} fill="#e5e7eb" className="pointer-events-none" />
        {t > 0 && <path d={arcD(C7, 66, -125, -125 + spin)} stroke={PH.amber} strokeWidth={1.6} strokeDasharray="3 3" fill="none" className="pointer-events-none" />}
        <circle cx={g[0]} cy={g[1]} r={4} fill={PH.amber} stroke="#fff" strokeWidth={1.2} className="pointer-events-none" />
        <Tag x={g[0] + (g[0] > C7[0] ? 22 : -22)} y={g[1] - 12} text="মাটি" tone="amber" size={8.5} />
        {tested && <Cross at={[g[0], g[1]]} r={6} w={2.4} />}
      </g>
    );
  }
  if (view === "earth") {
    const b = -150 + 110 * e;
    const p = onCircle(C7, 72, b);
    return (
      <g>
        <circle cx={C7[0]} cy={C7[1]} r={72} fill="none" stroke="#475569" strokeWidth={1} strokeDasharray="3 4" className="pointer-events-none" />
        {t > 0 && <path d={arcD(C7, 72, -150, b)} stroke={PH.amber} strokeWidth={1.8} fill="none" className="pointer-events-none" />}
        <circle cx={C7[0]} cy={C7[1]} r={22} fill="#fbbf24" opacity={0.18} className="pointer-events-none" />
        <circle cx={C7[0]} cy={C7[1]} r={15} fill="#fbbf24" className="pointer-events-none" />
        <Txt x={C7[0]} y={C7[1] + 32} size={8.5} color="#fde68a">
          সূর্য
        </Txt>
        <Earth c={p} r={10} spin={b * 3} />
        <circle cx={p[0]} cy={p[1]} r={1.8} fill="#fff" className="pointer-events-none" />
        <Tag x={p[0]} y={p[1] - 20} text="পৃথিবীর কেন্দ্র" tone="amber" size={8} />
        {tested && <Cross at={[p[0] + 15, p[1] + 9]} r={5} w={2.2} />}
      </g>
    );
  }
  const c = 20 + 100 * e;
  const p = onCircle(C7, 82, c, 0.5);
  return (
    <g>
      {[0, 180].map((arm) => (
        <path
          key={arm}
          d={
            "M" +
            Array.from({ length: 61 }, (_, i) => {
              const th = i * 9;
              const r = 6 + (th / 540) * 96;
              return onCircle(C7, r, th + arm, 0.5).map((v) => v.toFixed(1)).join(" ");
            }).join("L")
          }
          stroke="#c7d2fe"
          strokeWidth={7}
          opacity={0.14}
          fill="none"
          strokeLinecap="round"
          className="pointer-events-none"
        />
      ))}
      <ellipse cx={C7[0]} cy={C7[1]} rx={82} ry={41} fill="none" stroke="#475569" strokeWidth={1} strokeDasharray="3 4" className="pointer-events-none" />
      {t > 0 && <path d={arcD(C7, 82, 20, c, 0.5)} stroke={PH.amber} strokeWidth={1.8} fill="none" className="pointer-events-none" />}
      <circle cx={C7[0]} cy={C7[1]} r={9} fill="#e0e7ff" opacity={0.5} className="pointer-events-none" />
      <circle cx={C7[0]} cy={C7[1]} r={4} fill="#fff" className="pointer-events-none" />
      <Txt x={C7[0]} y={C7[1] - 13} size={8} color="#c7d2fe">
        ছায়াপথের কেন্দ্র
      </Txt>
      <circle cx={p[0]} cy={p[1]} r={4.6} fill="#fbbf24" className="pointer-events-none" />
      <Tag x={p[0]} y={p[1] + 15} text="সূর্য" tone="amber" size={8} />
      {tested && <Cross at={[p[0] + 10, p[1] - 8]} r={4.5} w={2.2} />}
    </g>
  );
}

export function StillHunt() {
  const pass = useGate();
  const [tested, setTested] = useSeed<Cand[]>("tested", []);
  const [cur, setCur] = useSeed<Cand | null>("cur", null);
  const spin = useWalk(X7_N * 65, { steps: false, ease: "linear" });
  const done = tested.length >= X7.length && !spin.running;
  const test = (c: Cand) => {
    if (spin.running) return;
    setCur(c);
    sfx.whoosh(0.8);
    spin.start(() => {
      const next = tested.includes(c) ? tested : [...tested, c];
      setTested(next);
      sfx.thump();
      if (next.length === X7.length && !tested.includes(c)) pass("মাটি, পৃথিবী, সূর্য: কেউই স্থির না।");
    });
  };
  const t = cur === null ? 0 : spin.running ? spin.t : 1;
  const view = cur ?? "ground";
  const say = cur && !spin.running ? X7.find((x) => x.key === cur)?.say : null;
  return (
    <>
      <Sheet w={300} h={190} label="মহাকাশ। প্রথমে পৃথিবী, তার উপরে মাটির একটা বিন্দু। যেটা বেছে নেবেন, সেটা আসলে স্থির কিনা দেখা যাবে।" className="max-w-[21rem]" bg={SPACE}>
        <SpaceView key={view} view={view} t={t} tested={!!cur && tested.includes(cur) && !spin.running} />
        {cur === null && <Tag x={150} y={176} text="সত্যিকারের স্থির বিন্দু কোনটা?" tone="ink" size={9} />}
        {done && <Tag x={150} y={176} text="পুরোপুরি স্থির বিন্দু: কোথাও নেই" tone="red" solid pop />}
      </Sheet>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {X7.map((x) => {
          const gone = tested.includes(x.key);
          return (
            <button
              key={x.key}
              type="button"
              disabled={spin.running}
              onClick={() => test(x.key)}
              className={`${chip(cur === x.key)} inline-flex items-center gap-1.5 ${cur !== x.key && gone ? "border-danger/40! text-danger" : ""}`}
            >
              {gone && (
                <svg viewBox="0 0 10 10" className="size-3" aria-hidden="true">
                  <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </svg>
              )}
              {x.name}
            </button>
          );
        })}
      </div>
      <div className="mx-auto mt-2 min-h-6 max-w-[20rem] text-center text-sm text-muted">{say && <span key={cur} className={FADE}>{say}</span>}</div>
      <Task done={done}>স্থির একটা মূল বিন্দু খুঁজুন। তিনটা প্রার্থীকেই একে একে পরীক্ষা করুন।</Task>
    </>
  );
}

// 7½ · Figures for screen 7's explanation. ChairOrbit: your chair rides the
// Earth round the Sun, ≈ 30 km a second. PickPoint: a point taken as still,
// rulers spreading out from it, from an atom to a satellite.

const S7_SAY = ["আপনার চেয়ার, পৃথিবীর উপরে।", "পৃথিবীর সাথে চেয়ারটাও ছুটছে সূর্যের চারদিকে।", "প্রতি সেকেন্ডে প্রায় 30 km!"];
const C7B: P = [150, 86];

export function ChairOrbit({}: Story) {
  const sc = useScene(2, [600, 1600]);
  const k = sc.k;
  const [th] = useTween([k === 0 ? -150 : k === 1 ? -70 : 10], 1400);
  const e = onCircle(C7B, 64, th);
  const out = onCircle(C7B, 64 + 26, th);
  return (
    <Scene scene={sc} caption={<span key={k} className={FADE}>{S7_SAY[k]}</span>}>
      <Sheet w={300} h={172} label="সূর্যকে ঘিরে পৃথিবীর পথ। পৃথিবীর উপরে ছোট্ট একটা চেয়ার, পৃথিবীর সাথে ঘুরছে।" className="max-w-[18rem]" bg={SPACE}>
        <circle cx={C7B[0]} cy={C7B[1]} r={64} fill="none" stroke="#475569" strokeWidth={1} strokeDasharray="3 4" className="pointer-events-none" />
        <path d={arcD(C7B, 64, -150, th)} stroke={PH.amber} strokeWidth={1.8} fill="none" className="pointer-events-none" />
        <circle cx={C7B[0]} cy={C7B[1]} r={21} fill="#fbbf24" opacity={0.18} className="pointer-events-none" />
        <circle cx={C7B[0]} cy={C7B[1]} r={14} fill="#fbbf24" className="pointer-events-none" />
        <Txt x={C7B[0]} y={C7B[1] + 4} size={8} color="#78350f">
          সূর্য
        </Txt>
        <Earth c={e} r={10} spin={th * 2} />
        <TinyChair at={[e[0] + 1, e[1] - 10]} />
        {k === 0 && <Tag x={out[0]} y={out[1] - 6} text="আপনার চেয়ার" tone="ink" size={8} />}
        {k >= 2 && <Tag x={Math.min(220, Math.max(80, out[0]))} y={out[1] + 14} text="≈ 30 km প্রতি সেকেন্ডে" tone="amber" solid size={8.5} pop />}
      </Sheet>
    </Scene>
  );
}

const S7P_SAY = ["কাজের সুবিধামতো একটা বিন্দু।", "এটাকেই স্থির ধরে নিলাম।", "সব measurement হবে এর সাপেক্ষে।", "পরমাণু থেকে মহাকাশের উপগ্রহ, সব এভাবেই মাপা হয়।"];

export function PickPoint({}: Story) {
  const sc = useScene(3, [600, 1300, 1600]);
  const k = sc.k;
  const y = 74;
  return (
    <Scene scene={sc} caption={<span key={k} className={FADE}>{S7P_SAY[k]}</span>}>
      <Sheet w={300} h={116} label="একটা লম্বা ফিতা। মাঝখানে একটা বিন্দু, ধরে নেওয়া হলো স্থির। ফিতা দুইদিকে ছড়িয়ে গেছে, একদিকে পরমাণু, আরেকদিকে উপগ্রহ।" className="max-w-[18rem]">
        <rect x={56} y={y - 5} width={188} height={10} rx={2} fill="#f5ecd7" stroke="#d6c7a6" strokeWidth={0.8} className="pointer-events-none" />
        {k >= 2 &&
          Array.from({ length: 13 }, (_, i) => {
            const d = (i - 6) * 14;
            return <Draw key={i} d={`M${150 + d} ${y - 5}v${i % 3 ? 4 : 7}`} delay={Math.abs(i - 6) * 70} ms={200} strokeWidth={1} className="stroke-[#8a7f6e]" />;
          })}
        {k >= 1 && (
          <g className={POP}>
            <path d={`M150 ${y - 7}V${y - 20}`} stroke={PH.mint} strokeWidth={1.4} />
            <circle cx={150} cy={y} r={5.5} fill={PH.mint} stroke="#fff" strokeWidth={1.4} />
          </g>
        )}
        {k >= 1 && <Tag x={150} y={y - 30} text="ধরে নিলাম স্থির" tone="mint" solid pop />}
        {k >= 3 && (
          <g className={POP}>
            <g transform={`translate(32 ${y})`} className="pointer-events-none">
              {[0, 60, 120].map((a) => (
                <ellipse key={a} rx={15} ry={5.5} fill="none" stroke={PH.blue} strokeWidth={1.1} transform={`rotate(${a})`} />
              ))}
              <circle r={3.4} fill={PH.amber} />
            </g>
            <Txt x={32} y={y + 28} size={8.5} color={PH.mute}>
              পরমাণু
            </Txt>
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <g transform={`translate(268 ${y}) rotate(-8)`} className="pointer-events-none">
              <rect x={-24} y={-5} width={14} height={10} rx={1} fill="#3b5b92" />
              <rect x={10} y={-5} width={14} height={10} rx={1} fill="#3b5b92" />
              <path d="M-10 0H10" stroke="#94a3b8" strokeWidth={1.2} />
              <rect x={-6} y={-7} width={12} height={14} rx={2} fill="#f5ecd7" stroke="#b08a4a" strokeWidth={0.8} />
              <path d="M0 -7l-3 -6M0 -7l3 -6" stroke="#94a3b8" strokeWidth={0.8} />
              <circle cy={-14} r={1.6} fill={PH.amber} />
            </g>
            <Txt x={268} y={y + 28} size={8.5} color={PH.mute}>
              উপগ্রহ
            </Txt>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn: the origin is given each time. Still, moving, or can't say?
// Every pick plays what really happens from that origin, then is judged.

type Ans = "rest" | "move" | "cant";
const ANS_BN: Record<Ans, string> = { rest: "স্থির", move: "গতিশীল", cant: "বলা যায় না" };
const X8_CANT = "মূল বিন্দু তো বলে দেওয়া আছে। এবার শুধু দেখুন, ওখান থেকে মাপলে অবস্থান বদলায় কিনা।";
const X8_ROUNDS: { obj: string; from: string; right: Ans; nope: Partial<Record<Ans, string>> }[] = [
  { obj: "চাচা", from: "ট্রেন", right: "move", nope: { rest: "চাচা জানালার বাইরে পেছনে সরে গেলেন। ট্রেন থেকে মাপলে চাচার অবস্থান বদলায়।", cant: X8_CANT } },
  { obj: "স্টেশনের ঘর", from: "চাচা", right: "rest", nope: { move: "ট্রেন চলে গেলো, কিন্তু ঘরটা চাচা থেকে একই জায়গায় রইলো। ট্রেন তো এখানে বস্তু না।", cant: X8_CANT } },
  { obj: "আপনার চেয়ার", from: "সূর্য", right: "move", nope: { rest: "চেয়ারটা সূর্যকে ঘিরে ছুটে গেলো। সূর্য থেকে চেয়ারের দিকটাই বদলে গেলো, তাই অবস্থানও।", cant: X8_CANT } },
];
const X8_N = 26;
const X8_WIN: Item[] = [
  { kind: "tree", x: 60 },
  { kind: "pole", x: 130 },
  { kind: "sign", x: 175 },
  { kind: "chacha", x: 222, main: true },
  { kind: "hut", x: 300 },
  { kind: "tree", x: 380 },
];

/** Where each round's বস্তু ends up when its motion has run: the drawing answers there. */
const X8_END: P[] = [
  [222 - 120, X6.ground - 14],
  [236, 112],
  onCircle([150, 74], 56, -20),
];

/** Round r's picture with its motion run to t (t from a useWalk, already eased). */
function RoundView({ r, t }: { r: number; t: number }) {
  const e = t;
  if (r === 0) return <WindowScene shift={-120 * e} items={X8_WIN} mainLabel="চাচা" h={150} arrow={false} />;
  if (r === 1) {
    const xT = lerp(-110, 380, e);
    return (
      <g>
        <rect {...paper(150)} fill="#f8fafc" className="pointer-events-none" />
        <Pole x={140} y={96} h={60} />
        <Rails y={96} />
        {t > 0 && t < 1 && (
          <Train x={xT} y={96}>
            <Riders />
          </Train>
        )}
        <Rounded h={150}>
          <rect x={0} y={102} width={300} height={48} fill="#e7e5df" className="pointer-events-none" />
        </Rounded>
        <path d="M0 102.5H300" stroke="#a8a29e" strokeWidth={1.2} className="pointer-events-none" />
        <Hut x={236} y={130} s={1.6} tone="#b08a4a" />
        <Tag x={236} y={78} text="স্টেশনের ঘর" tone="amber" size={8} />
        <Chacha x={70} y={128} s={0.62} />
        <circle cx={70} cy={136} r={4} fill={PH.mint} stroke="#fff" strokeWidth={1.2} className="pointer-events-none" />
        <Ruler a={[70, 136]} b={[236, 136]} />
        <Tag x={70} y={64} text="মূল বিন্দু: চাচা" tone="mint" size={8.5} />
      </g>
    );
  }
  const C: P = [150, 74];
  const th = -130 + 110 * e;
  const p = onCircle(C, 56, th);
  const a = onCircle(C, 15, th);
  return (
    <g>
      <rect {...paper(150)} fill={SPACE} className="pointer-events-none" />
      <circle cx={C[0]} cy={C[1]} r={56} fill="none" stroke="#475569" strokeWidth={1} strokeDasharray="3 4" className="pointer-events-none" />
      <circle cx={C[0]} cy={C[1]} r={12} fill="#fbbf24" className="pointer-events-none" />
      <circle cx={C[0]} cy={C[1]} r={15} fill="none" stroke={PH.mint} strokeWidth={1.6} className="pointer-events-none" />
      <PArrow a={a} b={onCircle(C, 46, th)} tone="amber" w={2} tell="সূর্য থেকে চেয়ার" />
      <Earth c={p} r={8} spin={th * 2} />
      <TinyChair at={[p[0] + 1, p[1] - 8]} s={0.9} />
      <Tag x={C[0]} y={140} text="মূল বিন্দু: সূর্য" tone="mint" size={8.5} />
    </g>
  );
}

export function WhoMoves() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pick, setPick] = useSeed<Ans | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = useWalk(X8_N * 65, { steps: false });
  const finished = round >= X8_ROUNDS.length;
  const r = X8_ROUNDS[Math.min(round, X8_ROUNDS.length - 1)];
  const answered = pick === r.right && !play.running;
  const wrong = !!pick && pick !== r.right && !play.running;
  const choose = (a: Ans) => {
    if (play.running || answered || finished) return;
    setPick(a);
    sfx.tap();
    play.start(() => {
      if (a === r.right) sfx.chime();
      else setMiss((m) => m + 1);
    });
  };
  const next = () => {
    const nr = round + 1;
    setRound(nr);
    setPick(null);
    if (nr === X8_ROUNDS.length) pass("মূল বিন্দু বললেই উত্তর একটাই।");
  };
  const t = finished ? 1 : pick === null ? 0 : play.running ? play.t : 1;
  const endAt = X8_END[Math.min(round, 2)];
  return (
    <>
      <div className="mx-auto mb-1.5 w-fit max-w-[21rem] rounded-full bg-foreground/[0.05] px-3 py-1 text-center text-sm">
        বস্তু: <b>{r.obj}</b> <span className="text-muted">·</span> মূল বিন্দু: <b className="text-accent-text">{r.from}</b>
      </div>
      <Sheet w={300} h={150} label={`বস্তু ${r.obj}, মূল বিন্দু ${r.from}। সময় চালালে দেখা যায় বস্তুটার অবস্থান বদলায় কিনা।`} className="max-w-[21rem]">
        <RoundView key={Math.min(round, 2)} r={Math.min(round, 2)} t={t} />
        {answered && <Ripple key={`ok${round}`} at={endAt} r={round === 2 ? 20 : 30} />}
        {wrong && <WrongMark key={`no${miss}`} x={endAt[0] + (round === 2 ? 18 : round === 1 ? 34 : 26)} y={endAt[1] - (round === 2 ? 10 : round === 1 ? 12 : 22)} />}
      </Sheet>
      {!finished ? (
        <>
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            {(["rest", "move", "cant"] as Ans[]).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => choose(a)}
                disabled={play.running || answered}
                className={`${chip(pick === a && !(wrong && a === pick))} ${wrong && a === pick ? "nudge border-danger/50! text-danger" : ""}`}
              >
                {ANS_BN[a]}
              </button>
            ))}
          </div>
          {wrong && pick && <Nope key={miss}>{r.nope[pick]}</Nope>}
          {answered && (
            <div className={`mt-2 flex items-center justify-center gap-3 text-sm ${FADE}`}>
              <span className="text-accent-text">
                {r.from} থেকে {r.obj}: {ANS_BN[r.right]}।
              </span>
              <button type="button" className={`${primaryBtn} h-9! px-4!`} onClick={next}>
                {round < X8_ROUNDS.length - 1 ? "পরেরটা" : "শেষ"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={`mt-2 text-center text-sm font-semibold text-accent-text ${FADE}`}>মূল বিন্দু ধরে দিলে, উত্তর একটাই।</div>
      )}
      <Ticks items={X8_ROUNDS.map((x, i) => [`${i + 1}`, round > i] as [string, boolean])} />
      <Task done={finished}>মূল বিন্দু ধরে দেওয়া আছে। বস্তুটা স্থির, না গতিশীল?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9a · Recap figure for the last screen, the bet settled on a picture: the
// same you, from the ground (still) and from the Sun (moving).

const S9_SAY = ["মাটির সাপেক্ষে: আপনি স্থির।", "সূর্যের সাপেক্ষে: আপনি গতিশীল, প্রতি সেকেন্ডে প্রায় 30 km।", "একই আপনি, দুই উত্তর। সব গতিই আপেক্ষিক।"];
const C9: P = [224, 70];

export function ChairBoth({}: Story) {
  const sc = useScene(2, [600, 1800]);
  const k = sc.k;
  const [th] = useTween([k >= 1 ? 20 : -110], 1500);
  const e = onCircle(C9, 46, th);
  return (
    <Scene scene={sc} caption={<span key={k} className={FADE}>{S9_SAY[k]}</span>}>
      <Sheet w={300} h={160} label="বাঁয়ে ঘরে চেয়ারে বসা আপনি, মাটি থেকে মাপা। ডানে সূর্যকে ঘিরে পৃথিবী, তার উপরে আপনার চেয়ার।" className="max-w-[19rem]">
        <g opacity={k === 1 ? 0.45 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
          <path d="M14 112H140" stroke={PH.faint} strokeWidth={2} />
          <Sitter x={82} y={89} s={1.3} look={YOU} />
          <circle cx={30} cy={118} r={3.6} fill={PH.mint} stroke="#fff" strokeWidth={1} className="pointer-events-none" />
          <Ruler a={[30, 118]} b={[82, 118]} />
          <Txt x={30} y={132} size={8} color={PH.mute}>
            মাটি
          </Txt>
          <Tag x={77} y={20} text="স্থির" tone="blue" solid size={9} />
        </g>
        <g opacity={k === 0 ? 0.45 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
          <rect x={152} y={6} width={142} height={128} rx={10} fill={SPACE} className="pointer-events-none" />
          <circle cx={C9[0]} cy={C9[1]} r={46} fill="none" stroke="#475569" strokeWidth={1} strokeDasharray="3 4" className="pointer-events-none" />
          <path d={arcD(C9, 46, -110, th)} stroke={PH.amber} strokeWidth={1.6} fill="none" className="pointer-events-none" />
          <circle cx={C9[0]} cy={C9[1]} r={10} fill="#fbbf24" className="pointer-events-none" />
          <Earth c={e} r={7} spin={th * 2} />
          <TinyChair at={[e[0] + 1, e[1] - 7]} s={0.8} />
          <Tag x={C9[0]} y={20} text="গতিশীল" tone="amber" solid size={9} />
          {k >= 1 && <Tag x={C9[0]} y={124} text="≈ 30 km প্রতি সেকেন্ডে" tone="amber" size={7.5} />}
        </g>
        {k >= 2 && <Tag x={150} y={148} text="সব গতিই আপেক্ষিক" tone="mint" solid pop />}
      </Sheet>
    </Scene>
  );
}

// 9b · The next video's teaser: a ball going straight, a fan turning, a
// swing rocking.

const S9B_SAY = ["গতি কিন্তু এক রকমের না।", "কেউ সোজা যায়,", "কেউ ঘোরে,", "কেউ দোলে।"];

export function ThreeMotions({}: Story) {
  const sc = useScene(3, [600, 1300, 1300]);
  const k = sc.k;
  return (
    <Scene scene={sc} caption={<span key={k} className={FADE}>{S9B_SAY[k]}</span>}>
      <Sheet w={300} h={112} label="তিনটা ছবি: একটা বল সোজা যাচ্ছে, একটা পাখা ঘুরছে, একটা দোলনা দুলছে।" className="max-w-[18rem]">
        <path d="M14 80H90" stroke={PH.faint} strokeWidth={1.6} />
        {k >= 1 && <path d="M22 72H82" stroke={PH.cream} strokeWidth={2.4} strokeDasharray="0.1 5" strokeLinecap="round" className={FADE} />}
        <g style={{ transform: `translate(${k >= 1 ? 58 : 0}px, 0px)` }} className="transition-transform duration-[1100ms] ease-out motion-reduce:transition-none">
          <circle cx={22} cy={72} r={7} fill="#dc2626" />
          <path d="M16 70q6 4 12 0" stroke="#fff" strokeWidth={0.9} fill="none" />
        </g>
        <Txt x={52} y={100} size={8.5} color={k >= 1 ? PH.ink : PH.mute}>
          সোজা যায়
        </Txt>
        <path d="M150 52V82M140 82H160" stroke="#64748b" strokeWidth={2.4} strokeLinecap="round" />
        <g style={{ transform: `rotate(${k >= 2 ? 540 : 0}deg)` }} className="origin-center transition-transform duration-[1300ms] ease-out [transform-box:fill-box] motion-reduce:transition-none">
          {[0, 90, 180, 270].map((a) => (
            <ellipse key={a} cx={150} cy={36} rx={4.5} ry={13} fill="#60a5fa" transform={`rotate(${a} 150 49)`} />
          ))}
        </g>
        <circle cx={150} cy={49} r={3.4} fill="#334155" />
        <Txt x={150} y={100} size={8.5} color={k >= 2 ? PH.ink : PH.mute}>
          ঘোরে
        </Txt>
        <path d="M222 14H278M226 14V80M274 14V80" stroke="#8b5a2b" strokeWidth={2.4} strokeLinecap="round" />
        <g style={{ transform: `rotate(${k >= 3 ? 24 : -24}deg)`, transformOrigin: "250px 14px", transformBox: "view-box" }} className="transition-transform duration-[1100ms] ease-in-out motion-reduce:transition-none">
          <path d="M244 14V64M256 14V64" stroke="#94a3b8" strokeWidth={1} />
          <rect x={240} y={63} width={20} height={4} rx={1.5} fill="#a0662d" />
        </g>
        <Txt x={250} y={100} size={8.5} color={k >= 3 ? PH.ink : PH.mute}>
          দোলে
        </Txt>
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  RestBet: { start: {}, sealed: { bet: 2 } },
  RuleRuler: { start: {}, ran: { ran: true }, wrong: { ran: true, pick: "lamp" }, right: { ran: true, pick: "rick" } },
  MituHour: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  ChachaSees: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 1 }, right: { pick: 2 } },
  WhoIsRight: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 1 }, right: { pick: 2 } },
  WindowView: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 1 }, right: { pick: 2 } },
  StillHunt: { start: {}, ground: { cur: "ground", tested: ["ground"] }, earth: { cur: "earth", tested: ["ground", "earth"] }, done: { cur: "sun", tested: ["ground", "earth", "sun"] } },
  WhoMoves: { start: {}, r1wrong: { round: 0, pick: "rest" }, r1right: { round: 0, pick: "move" }, r2wrong: { round: 1, pick: "move" }, r3right: { round: 2, pick: "move" }, done: { round: 3 } },
  YouSitting: { end: {} },
  TrainRide: { a: { k: 0 }, end: {} },
  PlatformPass: { mid: { k: 1 }, end: {} },
  TwoOrigins: { a: { k: 1 }, b: { k: 2 }, end: {} },
  ChairOrbit: { a: { k: 0 }, end: {} },
  PickPoint: { a: { k: 1 }, end: {} },
  ChairBoth: { a: { k: 0 }, end: {} },
  ThreeMotions: { a: { k: 0 }, end: {} },
};
