"use client";

import { useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Ticks, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { Bicycle, Gauge, PH, Ripple, Sheet, Tag, Txt, WrongMark, chip, svgPoint, toneHex, useWalk, type PhTone, useClock } from "@/components/interactive/phy-kit";
import { Chip } from "@/components/interactive/phy-speed-journey";

// Screens for "Physics for High School 10 — v = u + at আর s = ut + ½at²"
// (src/content/articles/physics_for_high_school/chapter_2/10_equations_of_motion.mdx),
// the journey of video EP 10 (physics_9_10/10-equations-of-motion/script.md).
// Book §2.7, pp. 45–46.
//
// The spine: তিথি rolls down the bridge slope for 4 s. How far? The reader
// bets 8, 16 or 24 m (DistanceBet), settled on the last screen: 16 m. On the
// way, the video's own beats: the five letters u v a t s (PlaceLetters), the
// speed going 2 → 6 one second at a time, v = u + at (SecondBySecond), তিথি's
// slip s = vt = 24 m and the 6 that is only the last moment's (SixCheck), the
// steady rider who keeps up with her rides at the middle moment's speed, 4,
// so 4 × 4 = 16 m (SteadyGhost), the general formula built by putting u + at
// in v's place (Derive), the check 8 + 8 = 16 (EightAndEight), the trick
// failing when the acceleration is not even (NotEven), and the reader does
// the first 2 s alone (FirstTwoSeconds).
//
// Ride canon (the video's): u = 2 m/s, a = 1 m/s², t = 4 s → v = 6 m/s,
// s = 16 m; the slip vt = 24 m. Positions s(t) = 2t + t²/2. Your turn's case
// is the same ride's first 2 s (v = 4, s = 6 m; slips 8 m and 4 m).

type Story = { story?: boolean };
type P = [number, number];

const DEG = 180 / Math.PI;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** The bridge ride: start speed, acceleration, the 4 seconds. */
export const RIDE = { u: 2, a: 1, t: 4 } as const;
export const rideV = (t: number) => RIDE.u + RIDE.a * t;
export const rideS = (t: number) => RIDE.u * t + 0.5 * RIDE.a * t * t;
const fmt = (x: number) => (Math.abs(x - Math.round(x)) < 0.05 ? `${Math.round(x)}` : x.toFixed(1));


// ---------------------------------------------------------------------------
// The bridge ramp, side on: the deck over the river at the left, the slope
// down to the right. `rampAt(m)` is the point m metres down the slope. Every
// ramp screen uses this one sheet (RW × RH).

export const RW = 300;
export const RH = 130;
const R_TOP: P = [44, 58];
const R_ANG = 11 / DEG;
const R_M = 9.2;
const R_LEN = 27;
const RC = Math.cos(R_ANG);
const RS = Math.sin(R_ANG);
export const rampAt = (m: number): P => [R_TOP[0] + RC * R_M * m, R_TOP[1] + RS * R_M * m];
/** A point `d` units under the road at metre m (along the slope's normal). */
const under = (m: number, d: number): P => {
  const [x, y] = rampAt(m);
  return [x - RS * d, y + RC * d];
};
const R_END = rampAt(R_LEN);

/** The ramp's drawing: river, pillar, deck with railing, the embankment and the road. */
export function BridgeRamp({ marks = [], lit, unit = true, z = 1 }: { marks?: number[]; lit?: { m: number; tone: PhTone } | null; unit?: boolean; z?: number }) {
  const roadPts = [under(-5, 2), under(0, 2), under(R_LEN, 2)];
  return (
    <g className="pointer-events-none">
      <rect x={0} y={108} width={52} height={RH - 108} fill="#dbeafe" />
      <path d="M4 116q5 -3 10 0t10 0t10 0t10 0" fill="none" stroke="#93c5fd" strokeWidth={1} />
      <path d={`M${R_TOP[0]} ${R_TOP[1] + 3}L${R_END[0]} ${R_END[1] + 3}H${RW}V${RH}H${R_TOP[0]}Z`} fill="#ebe4d3" />
      <rect x={18} y={R_TOP[1] + 4} width={9} height={108 - R_TOP[1] - 4} fill="#cbd5e1" />
      <path d={`M0 ${R_TOP[1] - 9}H${R_TOP[0]}`} stroke="#94a3b8" strokeWidth={1.4} />
      {[4, 16, 28, 40].map((x) => (
        <path key={x} d={`M${x} ${R_TOP[1] - 9}V${R_TOP[1]}`} stroke="#94a3b8" strokeWidth={1.2} />
      ))}
      <path d={`M${roadPts[0][0]} ${R_TOP[1] + 2}L${roadPts[1][0]} ${roadPts[1][1]}L${roadPts[2][0]} ${roadPts[2][1]}H${RW}`} stroke="#9ca3af" strokeWidth={4} fill="none" strokeLinejoin="round" />
      {marks.map((m, i) => {
        const a = under(m * z, 4);
        const b = under(m * z, 9);
        const [lx, ly] = under(m * z, 17);
        const on = lit && Math.abs(lit.m - m) < 0.01;
        const c = on ? toneHex(lit.tone) : PH.mute;
        return (
          <g key={m}>
            <path d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke={c} strokeWidth={1.3} />
            <Txt x={lx} y={ly + 3} size={8} color={c} weight={on ? 800 : 600}>
              {unit || i === marks.length - 1 ? `${m} m` : `${m}`}
            </Txt>
          </g>
        );
      })}
    </g>
  );
}

/** The ramp on its sheet; children draw on top. `z` zooms the metre marks (bikes and flags then take m × z). */
export function RampSheet({ label, marks, lit, unit, z, className = "max-w-[20rem]", children }: { label: string; marks?: number[]; lit?: { m: number; tone: PhTone } | null; unit?: boolean; z?: number; className?: string; children?: ReactNode }) {
  return (
    <Sheet w={RW} h={RH} label={label} bg="#f8fbff" className={className}>
      <BridgeRamp marks={marks} lit={lit} unit={unit} z={z} />
      {children}
    </Sheet>
  );
}

/** তিথি on her bike, m metres down the ramp, tilted with it. `ghost` = a see-through steady rider. */
export function RampBike({ m, ghost = false, label = true, s = 0.9 }: { m: number; ghost?: boolean; label?: boolean; s?: number }) {
  const [x, y] = rampAt(m);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(R_ANG * DEG).toFixed(2)})`} className="pointer-events-none">
      <g opacity={ghost ? 0.38 : 1}>
        <Bicycle x={0} y={0} s={s} spin={m * 70} />
      </g>
      {ghost && label && (
        <Txt x={4} y={-49 * s} size={8.5} color={PH.mute} weight={800}>
          ছায়া
        </Txt>
      )}
    </g>
  );
}

/** Where a word sits over a rider at metre m: just above her head. */
const overHead = (m: number, up = 50): P => [rampAt(m)[0] + 3, rampAt(m)[1] - up];

/** A flag on the ramp at metre m, tall enough to stand over a rider there, a word on top. */
const FLAG_H = 44;
function RampFlag({ m, tone = "blue", text, struck = false }: { m: number; tone?: PhTone; text?: string; struck?: boolean }) {
  const [x, y] = rampAt(m);
  const c = toneHex(tone);
  const top = y - FLAG_H;
  return (
    <g className={`pointer-events-none ${POP}`} opacity={struck ? 0.45 : 1}>
      <path d={`M${x} ${y}V${top}`} stroke={PH.ink} strokeWidth={1.1} />
      <path d={`M${x} ${top}l10 3.5l-10 3.5Z`} fill={c} stroke={PH.ink} strokeWidth={0.6} strokeLinejoin="round" />
      {text && <Chip x={x} y={top - 8} text={text} tone={tone} size={8} solid />}
      {struck && <path d={`M${x - 18} ${top - 14}L${x + 18} ${top - 2}`} stroke={PH.red} strokeWidth={1.8} strokeLinecap="round" />}
    </g>
  );
}

/** A small round check, drawn (the glyph renders as emoji on Linux). */
function CheckMark({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  return (
    <g className={`pointer-events-none ${POP}`}>
      <circle cx={x} cy={y} r={r} fill={PH.mint} />
      <path d={`M${x - r * 0.45} ${y}l${r * 0.32} ${r * 0.34}l${r * 0.6} -${r * 0.66}`} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

const GAUGE: P = [268, 32];
const TIME_AT: P = [218, 30];
/** the speedometer beside তিথি at the top of the slope, reading her start speed */
const START_GAUGE: P = [98, 30];

// ---------------------------------------------------------------------------
// The v–t graph: t 0…4 s across, v 0…7 m/s up. vtX / vtY map into the sheet.

export const GW = 300;
export const GH = 140;
const G0: P = [40, 116];
const G_T = 54;
const G_V = 12.5;
export const vtX = (t: number) => G0[0] + t * G_T;
export const vtY = (v: number) => G0[1] - v * G_V;

export function VtAxes() {
  return (
    <g className="pointer-events-none">
      {[2, 4, 6].map((v) => (
        <g key={v}>
          <path d={`M${G0[0]} ${vtY(v)}H${vtX(4.3)}`} stroke="#eef2f6" strokeWidth={1} />
          <Txt x={G0[0] - 7} y={vtY(v) + 3} size={8} anchor="end" color={PH.mute}>
            {`${v}`}
          </Txt>
        </g>
      ))}
      {[1, 2, 3, 4].map((t) => (
        <path key={t} d={`M${vtX(t)} ${G0[1]}V${vtY(6.6)}`} stroke="#eef2f6" strokeWidth={1} />
      ))}
      <path d={`M${G0[0]} ${G0[1]}H${vtX(4.55)}`} stroke={PH.ink} strokeWidth={1.3} />
      <path d={`M${vtX(4.55)} ${G0[1]}l-6 -3v6Z`} fill={PH.ink} />
      <path d={`M${G0[0]} ${G0[1]}V${vtY(7.3)}`} stroke={PH.ink} strokeWidth={1.3} />
      <path d={`M${G0[0]} ${vtY(7.3)}l-3 6h6Z`} fill={PH.ink} />
      {[0, 1, 2, 3, 4].map((t) => (
        <Txt key={t} x={vtX(t)} y={G0[1] + 12} size={8} color={PH.mute}>
          {`${t}`}
        </Txt>
      ))}
      <Txt x={GW - 8} y={G0[1] + 12} size={8} anchor="end" color={PH.mute}>
        t (s)
      </Txt>
      <Txt x={G0[0] + 6} y={vtY(7.3) + 4} size={8} anchor="start" color={PH.mute}>
        v (m/s)
      </Txt>
    </g>
  );
}

function GraphSheet({ label, className = "max-w-[20rem]", onPointerDown, children }: { label: string; className?: string; onPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void; children?: ReactNode }) {
  return (
    <Sheet w={GW} h={GH} label={label} className={className} onPointerDown={onPointerDown}>
      <VtAxes />
      {children}
    </Sheet>
  );
}

/** The ride's line on the graph, from t = 0 to `to`. */
const rideLine = (to = 4) => `M${vtX(0)} ${vtY(rideV(0))}L${vtX(to)} ${vtY(rideV(to))}`;

// ---------------------------------------------------------------------------
// The bridge on a story stage: deck at the left over the river, the slope from
// ST down to SE, then flat road. stAt(m) = m metres down the slope.

const ST: P = [70, 88];
const SE: P = [250, 150];
const S_ANG = Math.atan2(SE[1] - ST[1], SE[0] - ST[0]);
const S_LEN = Math.hypot(SE[0] - ST[0], SE[1] - ST[1]);
const S_M = S_LEN / 24;
const stAt = (m: number): P => [ST[0] + Math.cos(S_ANG) * S_M * m, ST[1] + Math.sin(S_ANG) * S_M * m];

function StageBridge() {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={150} width={92} height={30} fill="#93c5fd" />
      <path d="M8 162q6 -3 12 0t12 0t12 0t12 0t12 0" fill="none" stroke="#dbeafe" strokeWidth={1.2} />
      <path d={`M${ST[0]} ${ST[1]}L${SE[0]} ${SE[1]}L${ST[0]} 150Z`} fill="#d9d1bf" />
      <rect x={30} y={ST[1] + 4} width={12} height={150 - ST[1] - 4} fill="#cbd5e1" />
      <rect x={0} y={ST[1]} width={ST[0]} height={5} fill="#94a3b8" />
      <path d={`M0 ${ST[1] - 12}H${ST[0]}`} stroke="#94a3b8" strokeWidth={1.6} />
      {[6, 22, 38, 54, 68].map((x) => (
        <path key={x} d={`M${x} ${ST[1] - 12}V${ST[1]}`} stroke="#94a3b8" strokeWidth={1.4} />
      ))}
      <path d={`M0 ${ST[1] + 1.5}H${ST[0]}L${SE[0]} ${SE[1] + 1.5}H320`} stroke="#6b7280" strokeWidth={3} fill="none" strokeLinejoin="round" />
    </g>
  );
}

/** তিথি on the stage slope at m metres. No glide of her own: a scene's clock sets m every frame (useClock). */
function StageBike({ m }: { m: number }) {
  const [x, y] = stAt(m);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(S_ANG * DEG).toFixed(2)})`} className="pointer-events-none">
      <Bicycle x={0} y={0} s={1.25} spin={m * 40} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: তিথি at the top of the bridge slope; a timer
// 4 s; she rolls, faster and faster; s = ?.

export function BridgeTop({}: Story) {
  const s = useScene(3, [600, 1300, 2000]);
  const k = s.k;
  // the 4 s roll on a straight clock; where she is comes from s = ut + ½at²
  const m = rideS(RIDE.t * useClock(k >= 2, 1800));
  const end = stAt(m);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ব্রিজের মাথায় তিথি, সাইকেলে। ঢালে সাইকেল ছেড়ে দিলো, বেগ বাড়ছেই। একটা timer, 4 s। কতদূর গেলো, তার জায়গায় একটা প্রশ্ন।">
        <StageBridge />
        {m > 0.3 && <path d={`M${ST[0]} ${ST[1] - 4}L${end[0]} ${end[1] - 4}`} stroke={PH.cream} strokeWidth={3} strokeDasharray="0.1 5" strokeLinecap="round" />}
        <StageBike m={m} />
        {k < 2 && (
          <text x={ST[0]} y={24} fontSize={9} fontWeight={700} textAnchor="middle" fill={PH.ink}>
            তিথি
          </text>
        )}
        {k >= 1 && <Chip x={178} y={30} text="t = 4 s" tone="amber" size={11} pop />}
        {k >= 3 && <Chip x={146} y={88} text="s = ?" tone="amber" size={11} solid pop />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: how far in 4 s? The pick sends a see-through bike down
// the ramp to that mark and plants a flag with a ?. Not marked.

const X1_M = [8, 16, 24];

export function DistanceBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [gm] = useTween([bet === null ? 0 : X1_M[bet]], 1400);
  return (
    <>
      <div className="mb-2 text-center text-sm text-muted">
        শুরু <span className="font-mono text-foreground">2 m/s</span> · প্রতি সেকেন্ডে <span className="font-mono text-foreground">+1 m/s</span> · সময় <span className="font-mono text-foreground">4 s</span>
      </div>
      <RampSheet label="ব্রিজের ঢাল, পাশে দাগ: 8 m, 16 m, 24 m। তিথি ঢালের মাথায়, বেগ 2 m/s।" marks={[0, 8, 16, 24]}>
        <Gauge x={START_GAUGE[0]} y={START_GAUGE[1]} r={15} v={2} max={8} digits={0} />
        {bet !== null && <RampFlag key={bet} m={X1_M[bet]} tone="blue" text="?" />}
        {bet !== null && gm > 0.2 && <RampBike m={gm} ghost label={false} />}
        <RampBike m={0} />
      </RampSheet>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X1_M.map((m, i) => (
          <Choice
            key={m}
            n={i}
            look={bet === i ? "picked" : bet !== null ? "dim" : "idle"}
            disabled={bet !== null}
            onClick={() => {
              setBet(i);
              sfx.stamp();
              pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।");
            }}
          >
            <span className="font-mono">{m} m</span>
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>তিথি ঢালে সাইকেল ছেড়ে দিলো। 4 সেকেন্ডে কতদূর যাবে? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The five letters. Each letter comes with its meaning; the reader taps
// its place on the ramp picture (the start speedometer, the end one, the
// rising steps, the stopwatch, the bracket along the slope). A wrong place
// takes the letter in red and says what that place is.

type Slot = "u" | "v" | "a" | "t" | "s";
const X2_ORDER: Slot[] = ["u", "v", "a", "t", "s"];
const X2_MEAN: Record<Slot, string> = {
  u: "আদি বেগ, মানে শুরুর বেগ",
  v: "শেষ বেগ",
  a: "ত্বরণ",
  t: "সময়",
  s: "এই সময়ে কতটা দূরত্ব গেলো",
};
const X2_PLACE: Record<Slot, string> = {
  u: "শুরুর বেগের",
  v: "শেষের বেগের",
  a: "প্রতি সেকেন্ডে বেগ বাড়ার",
  t: "সময়ের",
  s: "দূরত্বের",
};
const X2_HINT: Record<Slot, string> = {
  u: "u তো শুরুর বেগ, ঢালের মাথায়।",
  v: "v তো শেষের বেগ, যাত্রার শেষে।",
  a: "ত্বরণ মানে প্রতি সেকেন্ডে বেগ কতটা বাড়ে। সিঁড়ির মতো দাগগুলো দেখুন।",
  t: "t তো সময়। ঘড়িটা দেখুন।",
  s: "s তো দূরত্ব, ঢাল ধরে কতটা গেলো।",
};
const X2_END = 16;
const X2_AT: Record<Slot, P> = {
  u: [R_TOP[0], 13],
  v: [rampAt(X2_END)[0], 37],
  a: [128, 47],
  t: [278, 14],
  s: under(X2_END / 2, 29),
};

/** A tiny speedometer, for the u and v places. */
function MiniDial({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 7} ${y + 3}A7 7 0 0 1 ${x + 7} ${y + 3}`} fill="#fff" stroke={PH.mute} strokeWidth={1.3} />
      <path d={`M${x} ${y + 3}L${x + 3.5} ${y - 2}`} stroke={PH.ink} strokeWidth={1.2} strokeLinecap="round" />
    </g>
  );
}

function Stopwatch({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 2} y={y - 11} width={4} height={3} rx={1} fill={PH.mute} />
      <circle cx={x} cy={y} r={7.5} fill="#fff" stroke={PH.mute} strokeWidth={1.3} />
      <path d={`M${x} ${y}V${y - 5}M${x} ${y}l3 2`} stroke={PH.amber} strokeWidth={1.2} strokeLinecap="round" />
    </g>
  );
}

function RisingSteps({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x + i * 6} y={y + 4 - (i + 1) * 3.5} width={4.5} height={(i + 1) * 3.5} rx={0.8} fill={PH.amber} />
      ))}
    </g>
  );
}

export function PlaceLetters() {
  const pass = useGate();
  const [done, setDone] = useSeed<Slot[]>("done", []);
  const [wrong, setWrong] = useSeed<Slot | null>("wrong", null);
  const [miss, setMiss] = useState(0);
  const cur = X2_ORDER[Math.min(done.length, X2_ORDER.length - 1)];
  const finished = done.length >= X2_ORDER.length;
  const tap = (slot: Slot) => {
    if (finished || done.includes(slot)) return;
    if (slot === cur) {
      const next = [...done, slot];
      setDone(next);
      setWrong(null);
      sfx.pop();
      if (next.length === X2_ORDER.length) pass("u শুরুর বেগ, v শেষের বেগ।");
    } else {
      setWrong(slot);
      setMiss((m) => m + 1);
      sfx.tap();
    }
  };
  const bStart = rampAt(0);
  const bEnd = rampAt(X2_END);
  const sA = under(0, 14);
  const sB = under(X2_END, 14);
  return (
    <>
      <div className="mx-auto mb-2 flex min-h-9 w-fit max-w-[20rem] items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
        {finished ? (
          <span className={`text-sm font-semibold text-accent-text ${FADE}`}>পাঁচটা অক্ষর, পাঁচটা জায়গা।</span>
        ) : (
          <>
            <span key={cur} className={`font-mono text-lg font-bold text-cat-blue ${FADE}`}>
              {cur}
            </span>
            <span className="text-sm">{X2_MEAN[cur]}</span>
          </>
        )}
      </div>
      <RampSheet label="ব্রিজের ঢাল: মাথায় তিথি, যাত্রার শেষে আবছা তিথি। পাঁচটা খালি ঘর: শুরুর বেগ, শেষের বেগ, প্রতি সেকেন্ডে বেগ বাড়া, সময়, আর ঢাল ধরে দূরত্ব।">
        <path d={`M${sA[0]} ${sA[1] - 3}L${sA[0]} ${sA[1]}L${sB[0]} ${sB[1]}L${sB[0]} ${sB[1] - 3}`} stroke={PH.cream} strokeWidth={1.4} fill="none" className="pointer-events-none" />
        <RampBike m={X2_END} ghost label={false} s={0.8} />
        <RampBike m={0} s={0.8} />
        {done.length > 0 && <Ripple key={done[done.length - 1]} at={X2_AT[done[done.length - 1]]} r={22} />}
        <MiniDial x={bStart[0] - 25} y={X2_AT.u[1]} />
        <MiniDial x={bEnd[0] - 25} y={X2_AT.v[1]} />
        <RisingSteps x={X2_AT.a[0] - 34} y={X2_AT.a[1]} />
        <Stopwatch x={X2_AT.t[0] - 26} y={X2_AT.t[1]} />
        {X2_ORDER.map((slot) => {
          const [x, y] = X2_AT[slot];
          const filled = done.includes(slot);
          const bad = wrong === slot && !filled;
          return (
            <g key={slot} onClick={() => tap(slot)} className={filled || finished ? "" : "cursor-pointer"} role="button" aria-label={`${X2_PLACE[slot]} ঘর`}>
              <rect x={x - 17} y={y - 10} width={34} height={20} rx={6} fill={filled ? PH.mintSoft : bad ? PH.redSoft : "#fff"} stroke={filled ? PH.mint : bad ? PH.red : PH.blue} strokeWidth={1.3} strokeDasharray={filled || bad ? undefined : "3 2.5"} />
              {filled ? (
                <g className={POP}>
                  <Txt x={x} y={y + 4.5} size={13} color={PH.mint} weight={800}>
                    {slot}
                  </Txt>
                </g>
              ) : bad ? (
                <g key={miss} className={POP}>
                  <Txt x={x} y={y + 4.5} size={13} color={PH.red} weight={800}>
                    {cur}
                  </Txt>
                </g>
              ) : (
                <Txt x={x} y={y + 4} size={11} color={PH.blue} weight={700}>
                  ?
                </Txt>
              )}
            </g>
          );
        })}
      </RampSheet>
      <Ticks items={X2_ORDER.map((l) => [l, done.includes(l)] as [string, boolean])} />
      {wrong && !finished && (
        <Nope key={miss}>
          ওই ঘরটা {X2_PLACE[wrong]}। {X2_HINT[cur]}
        </Nope>
      )}
      <Task done={finished}>প্রতিটা অক্ষর ছবির কোন ঘরে বসে? ঠিক ঘরে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3a · Story scene for screen 3: at the top of the bridge the speedometer
// reads 2 (u = 2); she lets it roll, no pedalling, and a second later it reads
// 3, +1 (a = 1).

export function RollStart({}: Story) {
  const s = useScene(4, [600, 1300, 1600, 1300]);
  const k = s.k;
  // one second of rolling: the needle reads v = u + at and the bike sits at s = ut + ½at², in step
  const t1 = useClock(k >= 3, 1200);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ব্রিজের মাথায় তিথির speedometer দেখাচ্ছে 2 m/s। প্যাডেল না মেরেই সাইকেল গড়াচ্ছে, এক সেকেন্ড পর 3 m/s।">
        <StageBridge />
        <StageBike m={rideS(t1)} />
        <Gauge x={36} y={42} r={17} v={rideV(t1)} max={8} digits={t1 > 0 && t1 < 1 ? 1 : 0} />
        {k >= 1 && <Chip x={170} y={40} text="u = 2 m/s" tone="mint" size={11} pop />}
        {k >= 2 && (
          <g className={POP}>
            <Txt x={196} y={96} size={9} color={PH.mute} weight={700}>
              প্যাডেল ছাড়া
            </Txt>
          </g>
        )}
        {k >= 3 && <Chip x={36} y={72} text="+1" tone="amber" size={10} solid pop />}
        {k >= 4 && <Chip x={170} y={64} text="a = 1 m/s²" tone="amber" size={11} pop />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · Second by second: each tap lets the bike roll one more second; the
// speedometer climbs by 1 (a +1 badge), and the v–t line grows a step. After
// 4 s it reads 6.

// One second of riding on a straight clock; the bike glides between the beats.
const X3_SEC_MS = 720;

export function SecondBySecond() {
  const pass = useGate();
  const [sec, setSec] = useSeed("sec", 0);
  const walk = useWalk(X3_SEC_MS, { steps: false, ease: "linear" });
  const go = () => {
    if (walk.running || sec >= RIDE.t) return;
    const next = sec + 1;
    sfx.whoosh(0.5);
    walk.start(() => {
      setSec(next);
      sfx.pop();
      if (next === RIDE.t) {
        sfx.chime();
        pass("প্রতি সেকেন্ডে +1, চারবার: 2 থেকে 6।");
      }
    });
  };
  // the clock in seconds; position and needle both come from it: s = ut + ½at², v = u + at
  const t = walk.running ? sec + walk.t : sec;
  const done = sec >= RIDE.t && !walk.running;
  return (
    <>
      <RampSheet label="ব্রিজের ঢালে তিথি। পাশে speedometer আর সময়।" className="max-w-[18rem]">
        <RampBike m={rideS(t)} />
        <Gauge x={GAUGE[0]} y={GAUGE[1]} r={15} v={rideV(t)} max={8} digits={walk.running ? 1 : 0} tone={done ? "mint" : "amber"} />
        <Txt x={TIME_AT[0]} y={TIME_AT[1]} size={11} color={PH.amber} weight={700}>
          {`t = ${walk.running ? t.toFixed(1) : t} s`}
        </Txt>
        {sec > 0 && !walk.running && <Chip key={sec} x={GAUGE[0]} y={62} text="+1" tone="amber" size={9} solid pop />}
        {done && <Ripple at={[GAUGE[0], GAUGE[1] - 4]} r={22} />}
      </RampSheet>
      <div className="mt-2">
        <GraphSheet label="বেগ-সময় graph: প্রতি সেকেন্ডে বেগের একটা বিন্দু, শুরু 2 থেকে।" className="max-w-[18rem]">
          {t > 0.02 && <path d={rideLine(t)} stroke={PH.ink} strokeWidth={2.2} fill="none" strokeLinecap="round" className="pointer-events-none" />}
          {Array.from({ length: Math.floor(t + 1e-9) + 1 }, (_, j) => (
            <g key={j} className="pointer-events-none">
              <circle cx={vtX(j)} cy={vtY(rideV(j))} r={3.2} fill={j === RIDE.t ? PH.mint : PH.ink} className={POP} />
              <Txt x={vtX(j) + (j === 0 ? 9 : -7)} y={vtY(rideV(j)) - 6} size={8.5} color={j === RIDE.t ? PH.mint : PH.ink} weight={800}>
                {`${rideV(j)}`}
              </Txt>
            </g>
          ))}
          {walk.running && <circle cx={vtX(t)} cy={vtY(rideV(t))} r={3} fill={PH.amber} className="pointer-events-none" />}
          {done && <Ripple at={[vtX(RIDE.t), vtY(rideV(RIDE.t))]} r={16} />}
        </GraphSheet>
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" className={`${primaryBtn} h-10! px-4!`} disabled={walk.running || sec >= RIDE.t} onClick={go}>
          আরও 1 সেকেন্ড
        </button>
        <Ticks items={[1, 2, 3, 4].map((j) => [`${j} s`, sec >= j] as [string, boolean])} />
      </div>
      <Task done={done}>এক সেকেন্ড এক সেকেন্ড করে তিথিকে চালান। 4 সেকেন্ড পর speedometer কত দেখায়?</Task>
    </>
  );
}

// 3½ · Figure for screen 3's explanation: 2 + 1 + 1 + 1 + 1 = 6; the card
// v = u + at with the numbers; and a = (v − u) / t rearranged into it.

const S3_SAY = ["শুরুর দুই।", "তার সাথে প্রতি সেকেন্ডে এক করে চারবার যোগ: ছয়।", "এটাই প্রথম সমীকরণ: v = u + at।", "আসলে এটা ত্বরণের সংজ্ঞাটাই, একটু সাজিয়ে লেখা।"];

export function FirstEquation({}: Story) {
  const s = useScene(3, [600, 1600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S3_SAY[k]}</span>}>
      <Sheet w={300} h={128} label="2 আর চারবার 1 যোগ করে 6। তারপর v = u + at, আর ত্বরণের সংজ্ঞা থেকে সেটা।" className="max-w-[18rem]">
        <Chip x={34} y={26} text="2" tone="mint" size={13} />
        {k >= 1 &&
          [0, 1, 2, 3].map((i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 200}ms` }}>
              <Txt x={66 + i * 38} y={31} size={13} color={PH.amber} weight={800}>
                + 1
              </Txt>
            </g>
          ))}
        {k >= 1 && (
          <g className={FADE} style={{ transitionDelay: "900ms" }}>
            <Txt x={220} y={31} size={13} weight={800}>
              = 6
            </Txt>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <rect x={16} y={50} width={100} height={28} rx={7} fill={PH.amberSoft} stroke={PH.amber} strokeWidth={1.4} />
            <Txt x={66} y={68.5} size={13} weight={800}>
              v = u + at
            </Txt>
            <Txt x={200} y={68.5} size={12} color={PH.mute} weight={700}>
              = 2 + 1 × 4 = 6
            </Txt>
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <Txt x={70} y={108} size={11.5} color={PH.mute} weight={700}>
              a = (v − u) / t
            </Txt>
            <path d="M136 104h22" stroke={PH.amber} strokeWidth={1.6} />
            <path d="M162 104l-6 -3.5v7Z" fill={PH.amber} />
            <Txt x={214} y={108} size={11.5} weight={800}>
              v = u + at
            </Txt>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · Story scene for screen 4: তিথি at the foot of the bridge says distance
// is speed times time: 6 × 4 = 24 m. A red 24?.

export function TithiClaim({}: Story) {
  const s = useScene(3, [600, 1800, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ব্রিজের নিচে তিথি, পাশে সাইকেল। তিথি বললো, দূরত্ব তো বেগ গুণ সময়: 6 গুণ 4, 24 মিটার।">
        <StageBridge />
        <Bicycle x={268} y={150} s={1.15} rider={false} />
        <Person who="tithi" x={300} y={150} facing={-1} arm={k >= 1 ? "point" : "down"} mood={k >= 1 ? "smug" : "plain"} scale={0.92} />
        {k === 1 && <Bubble x={300} y={86} side="left" lines={["দূরত্ব তো", "বেগ গুণ সময়।"]} />}
        {k >= 2 && <Bubble x={300} y={86} side="left" lines={["6 গুণ 4:", "24 মিটার।"]} />}
        {k >= 2 && <Chip x={120} y={30} text="s = v × t = 6 × 4 = 24 m" tone="ink" size={9.5} pop />}
        {k >= 3 && <Chip x={120} y={52} text="24?" tone="red" size={11} solid pop />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · Was it 6 the whole time? তিথি's sum holds the speed at 6 for all 4 s (a
// red block on the graph). The reader taps each second; a scanner glides
// there and reads the real speed off the line, with the red gap up to 6. Only
// at 4 s is it 6.

export function SixCheck() {
  const pass = useGate();
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const [sx] = useTween([vtX(cur ?? 0)], 450);
  const done = seen.length >= 5;
  const tap = (e: React.PointerEvent<SVGSVGElement>) => {
    const [x] = svgPoint(e, GW, GH);
    const j = Math.round(clamp((x - G0[0]) / G_T, 0, 4));
    setCur(j);
    sfx.tap();
    if (!seen.includes(j)) {
      const next = [...seen, j];
      setSeen(next);
      if (next.length === 5) pass("6 শুধু শেষ মুহূর্তের বেগ।");
    }
  };
  return (
    <>
      <div className="mb-2 text-center text-sm">
        <span className="text-muted">তিথির হিসাব:</span> <span className="font-mono">s = 6 × 4 =</span> <span className="font-mono font-bold text-danger">24 m?</span>
      </div>
      <GraphSheet label="বেগ-সময় graph। লাল block: পুরো 4 s ধরে 6 m/s, তিথির হিসাব। কালো রেখা: আসল বেগ, 2 থেকে 6। যেকোনো সেকেন্ডে tap করা যায়।" className="max-w-[21rem] cursor-pointer" onPointerDown={tap}>
        <rect x={vtX(0)} y={vtY(6)} width={vtX(4) - vtX(0)} height={vtY(0) - vtY(6)} fill={PH.redSoft} opacity={0.6} className="pointer-events-none" />
        <path d={`M${vtX(0)} ${vtY(6)}H${vtX(4)}`} stroke={PH.red} strokeWidth={1.6} strokeDasharray="5 3" className="pointer-events-none" />
        <g className="pointer-events-none">
          <Tag x={178} y={vtY(6) - 11} text="তিথির হিসাব: পুরো সময় 6 m/s" tone="red" size={9} />
        </g>
        <path d={rideLine()} stroke={PH.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" className="pointer-events-none" />
        {seen.map((j) => (
          <g key={j} className="pointer-events-none">
            {j < 4 && <path d={`M${vtX(j)} ${vtY(rideV(j))}V${vtY(6)}`} stroke={PH.red} strokeWidth={2} className={FADE} />}
            <circle cx={vtX(j)} cy={vtY(rideV(j))} r={3.4} fill={j === 4 ? PH.mint : PH.amber} className={POP} />
          </g>
        ))}
        {cur !== null && (
          <g className="pointer-events-none">
            <path d={`M${sx} ${G0[1]}V${vtY(6.6)}`} stroke={PH.amber} strokeWidth={1.3} strokeDasharray="3 2.5" />
            <g key={cur}>
              <Tag x={clamp(vtX(cur) + 4, 62, 250)} y={vtY(rideV(cur)) + 16} text={cur === 4 ? "4 s: 6 m/s" : `${cur} s: ${rideV(cur)} m/s, 6 না`} tone={cur === 4 ? "mint" : "amber"} size={9} solid pop />
            </g>
          </g>
        )}
        {[0, 1, 2, 3, 4].map((j) =>
          seen.includes(j) ? null : <circle key={j} cx={vtX(j)} cy={G0[1]} r={6} fill="none" stroke={PH.blue} strokeWidth={1.2} strokeDasharray="2.5 2" className="pointer-events-none" />,
        )}
      </GraphSheet>
      <Ticks items={[0, 1, 2, 3, 4].map((j) => [`${j} s`, seen.includes(j)] as [string, boolean])} />
      <Task done={done}>তিথির হিসাবে পুরো 4 s বেগ ছিল 6। প্রতিটা সেকেন্ডে tap করে দেখুন, আসল বেগ কত ছিল।</Task>
    </>
  );
}

// 4½ · Figure for screen 4's explanation: s = vt holds only when the speed
// stays put. A flat line: the 6 block sits right on it. A rising line: the
// same block stands over it, too tall.

const S4_SAY = ["বেগ না বদলালে, graph সমান। পুরো সময়ের বেগ একটাই।", "তখন s = vt খাটে: block আর রেখা মিলে যায়।", "কিন্তু তিথির বেগ 2 থেকে বাড়লো।", "তাই 6 ধরে গুণ করলে, বেশি ধরা হয়।"];

function MiniVt({ x0, children }: { x0: number; children: ReactNode }) {
  const y0 = 104;
  return (
    <g className="pointer-events-none">
      <path d={`M${x0} ${y0}H${x0 + 118}M${x0} ${y0}V${y0 - 88}`} stroke={PH.ink} strokeWidth={1.1} />
      <Txt x={x0 + 120} y={y0 + 12} size={7.5} anchor="end" color={PH.mute}>
        t
      </Txt>
      <Txt x={x0 + 6} y={y0 - 80} size={7.5} anchor="start" color={PH.mute}>
        v
      </Txt>
      {children}
    </g>
  );
}
const mvx = (x0: number, t: number) => x0 + t * 26;
const mvy = (v: number) => 104 - v * 12;

export function SteadyOnly({}: Story) {
  const s = useScene(3, [600, 1600, 1600]);
  const k = s.k;
  const L = 18;
  const R = 166;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S4_SAY[k]}</span>}>
      <Sheet w={300} h={122} label="দুইটা ছোট graph। বামে বেগ সমান 6, block ঠিক রেখার উপর। ডানে বেগ 2 থেকে 6, block রেখার উপরে বাড়তি।" className="max-w-[18rem]">
        <MiniVt x0={L}>
          {k >= 1 && <rect x={mvx(L, 0)} y={mvy(6)} width={mvx(L, 4) - mvx(L, 0)} height={mvy(0) - mvy(6)} fill={PH.mintSoft} className={FADE} />}
          <path d={`M${mvx(L, 0)} ${mvy(6)}H${mvx(L, 4)}`} stroke={PH.ink} strokeWidth={2.2} />
          {k >= 1 && <Tag x={mvx(L, 2)} y={mvy(3)} text="s = vt ঠিক" tone="mint" size={9} pop />}
        </MiniVt>
        {k >= 2 && (
          <g className={FADE}>
            <MiniVt x0={R}>
              {k >= 3 && <rect x={mvx(R, 0)} y={mvy(6)} width={mvx(R, 4) - mvx(R, 0)} height={mvy(0) - mvy(6)} fill={PH.redSoft} opacity={0.7} className={FADE} />}
              {k >= 3 && <path d={`M${mvx(R, 0)} ${mvy(6)}H${mvx(R, 4)}`} stroke={PH.red} strokeWidth={1.4} strokeDasharray="4 3" />}
              <path d={`M${mvx(R, 0)} ${mvy(2)}L${mvx(R, 4)} ${mvy(6)}`} stroke={PH.ink} strokeWidth={2.2} />
              {k >= 3 && <Tag x={mvx(R, 1.4)} y={mvy(6) + 12} text="বেশি" tone="red" size={9} pop />}
            </MiniVt>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · The steady rider. A see-through bike rides one speed for all 4 s beside
// তিথি. Which speed keeps up with her? 6 runs off to 24 m, 2 falls back at
// 8 m, 4 arrives with her at 16 m. The graph draws both as they go.

const X5_V = [6, 2, 4];
const X5_RIGHT = 2;
const X5_MS = 1800;
const X5_NOPE = ["ছায়া চলে গেলো 24 m, তিথি অনেক পেছনে। 6 তো শুধু শেষ মুহূর্তের বেগ।", "ছায়া থামলো 8 m-এ, তিথি অনেক সামনে। 2 তো শুধু শুরুর বেগ।", ""];

export function SteadyGhost() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X5_MS, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(1.2);
    walk.start(() => {
      if (i === X5_RIGHT) {
        sfx.chime();
        pass("গড় বেগ 4: ছায়া আর তিথি একসাথে পৌঁছালো।");
      } else setMiss((m) => m + 1);
    });
  };
  // seconds on a straight clock: তিথি at s = ut + ½at², the ghost at s = Vt
  const t = pick === null ? 0 : RIDE.t * (walk.running ? walk.t : 1);
  const gv = pick === null ? null : X5_V[pick];
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X5_RIGHT;
  const wrong = settled && pick !== X5_RIGHT;
  const tone: PhTone = settled ? (right ? "mint" : "red") : "blue";
  const ghostAt = gv === null ? null : overHead(gv * RIDE.t, 52);
  return (
    <>
      <RampSheet label="ব্রিজের ঢালে তিথি আর একটা আবছা ছায়া সাইকেল। ছায়াটা পুরো সময় একই বেগে চলে। দাগ 8 m, 16 m, 24 m।" marks={[0, 8, 16, 24]} lit={right ? { m: 16, tone: "mint" } : null} className="max-w-[17.5rem]">
        {gv !== null && t > 0 && <RampBike m={gv * t} ghost label={!right} />}
        <RampBike m={rideS(t)} />
        <Txt x={TIME_AT[0] + 20} y={TIME_AT[1] - 6} size={11} color={PH.amber} weight={700}>
          {`t = ${walk.running ? t.toFixed(1) : fmt(t)} s`}
        </Txt>
        {wrong && ghostAt && <WrongMark x={ghostAt[0] + 14} y={ghostAt[1] + 4} />}
        {right && <Ripple at={[rampAt(16)[0], rampAt(16)[1] - 18]} r={30} />}
        {right && <Tag x={overHead(16)[0]} y={overHead(16)[1] - 2} text="একসাথে" tone="mint" solid pop />}
      </RampSheet>
      <div className="mt-2">
        <GraphSheet label="বেগ-সময় graph। কালো রেখা তিথি, 2 থেকে 6। সমান দাগটা ছায়া সাইকেল।" className="max-w-[17.5rem]">
          {t > 0.02 && <path d={rideLine(t)} stroke={PH.ink} strokeWidth={2.2} fill="none" strokeLinecap="round" className="pointer-events-none" />}
          {gv !== null && t > 0.02 && <path d={`M${vtX(0)} ${vtY(gv)}H${vtX(t)}`} stroke={toneHex(tone)} strokeWidth={2.2} strokeDasharray="5 3" className="pointer-events-none" />}
          {gv !== null && t > 0.02 && (
            <Txt x={vtX(t) + 8} y={vtY(gv) + 3} size={8.5} anchor="start" color={toneHex(tone)} weight={800}>
              {`${gv}`}
            </Txt>
          )}
        </GraphSheet>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X5_V.map((v, i) => (
          <Choice key={v} n={i} look={pick === i && settled ? (i === X5_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="font-mono">{v} m/s</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X5_RIGHT && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>ছায়া সাইকেলটা পুরো 4 s একই বেগে চলবে। কোন বেগে চললে তিথির সাথে একই জায়গায় পৌঁছায়?</Task>
    </>
  );
}

// 5½a · Figure for screen 5's explanation: the speed rises evenly, so the
// middle moment, 2 s, carries the average: 4, halfway between 2 and 6.

const S5_SAY = ["বেগ সমান হারে বাড়ছে: 2 থেকে 6।", "ঠিক মাঝখানের মুহূর্ত: 2 s।", "সেই মুহূর্তের বেগ 4 m/s, এটাই গড় বেগ।", "দুই আর ছয়ের মাঝামাঝি: চার।"];

export function MidMoment({}: Story) {
  const s = useScene(3, [600, 1500, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <GraphSheet label="বেগ-সময় graph, রেখা 2 থেকে 6। মাঝখানে 2 s-এ বেগ 4, গড় বেগ।" className="max-w-[18rem]">
        <path d={rideLine()} stroke={PH.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" className="pointer-events-none" />
        <circle cx={vtX(0)} cy={vtY(2)} r={3} fill={PH.ink} />
        <circle cx={vtX(4)} cy={vtY(6)} r={3} fill={PH.ink} />
        {k >= 1 && <path d={`M${vtX(2)} ${G0[1]}V${vtY(4)}`} stroke={PH.amber} strokeWidth={1.6} strokeDasharray="4 3" className={FADE} />}
        {k >= 1 && <Tag x={vtX(2) - 32} y={G0[1] - 10} text="মাঝখান, 2 s" tone="amber" size={9.5} pop />}
        {k >= 2 && <path d={`M${G0[0]} ${vtY(4)}H${vtX(2)}`} stroke={PH.mint} strokeWidth={1.6} strokeDasharray="4 3" className={FADE} />}
        {k >= 2 && <circle cx={vtX(2)} cy={vtY(4)} r={4} fill={PH.mint} className={POP} />}
        {k >= 2 && <Tag x={vtX(2) - 18} y={vtY(4) - 14} text="গড় বেগ 4 m/s" tone="mint" size={9.5} solid pop />}
        {k >= 3 && <Chip x={vtX(3.15)} y={vtY(2.2)} text="(2 + 6) / 2 = 4" tone="mint" size={9} pop />}
      </GraphSheet>
    </Scene>
  );
}

// 5½b · Figure for screen 5's explanation: 4 m/s × 4 s = 16 m; তিথি's 24 m
// flag is struck.

const S5B_SAY = ["তিথির হিসাব: 24 m।", "চার মিটার পার সেকেন্ড গুণ চার সেকেন্ড: ষোলো মিটার।", "চব্বিশ না, ষোলো।"];

export function NotTwentyFour({}: Story) {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5B_SAY[k]}</span>}>
      <RampSheet label="ব্রিজের ঢাল। 24 m-এ তিথির হিসাবের লাল flag, কাটা। 16 m-এ সবুজ flag, তিথি ওখানে।" marks={[0, 8, 16, 24]} lit={k >= 1 ? { m: 16, tone: "mint" } : null} className="max-w-[18rem]">
        <RampFlag m={24} tone="red" text="24 m?" struck={k >= 2} />
        {k >= 1 && <RampFlag m={16} tone="mint" text="16 m" />}
        {k >= 1 && <Chip x={rampAt(16)[0]} y={rampAt(16)[1] - FLAG_H - 26} text="4 m/s × 4 s = 16 m" tone="mint" size={9} pop />}
        <RampBike m={k >= 1 ? 16 : 0} />
      </RampSheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · The general formula. Start from V = (u + v) / 2. What goes in v's
// place? The pick slides in, the line simplifies, then the ride's numbers go
// in: only u + at gives the 4 the graph showed. Then × t: s = ut + ½at².

const X6_OPTS = ["at", "u + at", "u"];
const X6_RIGHT = 1;
const X6_LINES = [
  { sub: "(u + at) / 2", simp: "½u + ½at", num: "1 + 2 = 3" },
  { sub: "(u + u + at) / 2", simp: "u + ½at", num: "2 + ½ × 1 × 4 = 4" },
  { sub: "(u + u) / 2", simp: "u", num: "2" },
];
const X6_NOPE = [
  "গড় বেগ এলো 3, কিন্তু মাঝখানের মুহূর্তে বেগ ছিল 4। v মানে শেষ বেগ, শুরুর u-ও তার ভেতরে আছে।",
  "",
  "গড় এলো 2, মানে বেগ যেন কখনো বাড়েইনি! v-এর জায়গায় প্রথম সমীকরণটা বসান।",
];
const X6_TICKS = 12;

function Row({ label, children, tone = "plain" }: { label: string; children: ReactNode; tone?: "plain" | "mint" | "red" | "box" }) {
  return (
    <div className={`flex items-center gap-2 ${FADE}`}>
      <span className="w-14 shrink-0 text-right text-xs leading-tight text-[#5a6b7d]">{label}</span>
      <span
        className={`rounded-md px-1.5 py-0.5 font-mono text-[0.85rem] font-semibold whitespace-nowrap ${
          tone === "mint" ? "bg-[#d1fae5] text-[#059669]" : tone === "red" ? "bg-[#fee2e2] text-[#dc2626]" : tone === "box" ? "border-2 border-[#059669] bg-[#d1fae5] text-[#0f1b2d]" : ""
        }`}
      >
        {children}
      </span>
    </div>
  );
}

export function Derive() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(120);
  const go = (i: number) => {
    if (play.running) return;
    setPick(i);
    sfx.pop();
    play.play(X6_TICKS, () => {
      if (i === X6_RIGHT) {
        sfx.chime();
        pass("গড় বেগ u + ½at, গুণ t: ut + ½at²।");
      } else setMiss((m) => m + 1);
    });
  };
  const k = pick === null ? 0 : play.running ? play.k : X6_TICKS;
  const line = pick === null ? null : X6_LINES[pick];
  const ok = pick === X6_RIGHT;
  const settled = pick !== null && !play.running;
  return (
    <>
      <div className="mx-auto grid w-full max-w-[21rem] gap-1.5 rounded-xl border border-[#cbd5e1] bg-white px-2.5 py-3 text-[#0f1b2d]">
        <Row label="গড় বেগ">V = (u + v) / 2</Row>
        <Row label="v-এর জায়গায়">
          V = (u +{" "}
          {pick === null ? (
            <span className="inline-block min-w-10 rounded border-2 border-dashed border-[#2563eb] px-1 text-center text-[#2563eb]">v</span>
          ) : (
            <span key={pick} className={`rounded px-1 ${ok ? "bg-[#dbeafe] text-[#2563eb]" : "bg-[#fee2e2] text-[#dc2626]"} ${FADE}`}>
              {X6_OPTS[pick]}
            </span>
          )}
          ) / 2
        </Row>
        {line && k >= 4 && <Row label="সাজালে">{`V = ${line.sub} = ${line.simp}`}</Row>}
        {line && k >= 7 && (
          <Row label="ঢালের সংখ্যা" tone={ok ? "mint" : "red"}>
            {`V = ${line.num}`}
          </Row>
        )}
        {ok && k >= 10 && (
          <Row label="গুণ t" tone="box">
            s = Vt = ut + ½at²
          </Row>
        )}
      </div>
      <div className="mt-2 text-center text-sm font-semibold">v-এর জায়গায় কী বসবে?</div>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {X6_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && settled ? (i === X6_RIGHT ? "right" : "wrong") : "idle"} disabled={play.running || (settled && ok)} onClick={() => go(i)}>
            <span className="font-mono text-sm whitespace-nowrap">{o}</span>
          </Choice>
        ))}
      </div>
      {settled && !ok && pick !== null && <Nope key={miss}>{X6_NOPE[pick]}</Nope>}
      <Task done={settled && ok}>প্রথম সমীকরণ থেকে বেছে নিন, v-এর জায়গায় কী বসবে। ঢালের সংখ্যায় গড় বেগ 4 আসা চাই।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The check. Tap the two terms of s = ut + ½at²; each works its sum out
// with the ride's numbers and lays its piece of road on the ramp: 8 m, then
// 8 more, reaching তিথি at 16 m.

type Term = "ut" | "half";
const X7_TERMS: { key: Term; text: string; sum: string; tone: PhTone }[] = [
  { key: "ut", text: "ut", sum: "ut = 2 × 4 = 8 m", tone: "cream" },
  { key: "half", text: "½at²", sum: "½at² = ½ × 1 × 4² = 8 m", tone: "amber" },
];

/** A piece of road laid along the slope, with what it is written right under it. */
function RoadPiece({ from, len, tone, text }: { from: number; len: number; tone: PhTone; text: string }) {
  if (len < 0.05) return null;
  const a = under(from, 8);
  const b = under(from + len, 8);
  const [tx, ty] = under(from + len / 2, 40);
  return (
    <g className="pointer-events-none">
      <path d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke={toneHex(tone)} strokeWidth={4.5} strokeLinecap="round" />
      {len > 7.9 && <Tag x={tx} y={ty} text={text} tone={tone} size={8.5} pop />}
    </g>
  );
}

export function EightAndEight() {
  const pass = useGate();
  const [order, setOrder] = useSeed<Term[]>("order", []);
  const play = usePlay(90);
  const [l0, l1] = useTween([order.length >= 1 ? 8 : 0, order.length >= 2 ? 8 : 0], 900);
  const both = order.length >= 2;
  const tap = (key: Term) => {
    if (order.includes(key) || play.running) return;
    const next = [...order, key];
    setOrder(next);
    sfx.pop();
    play.play(10, () => {
      if (next.length === 2) {
        sfx.chime();
        pass("8 আর 8, ষোলো মিটার। মিলে গেছে।");
      }
    });
  };
  const termOf = (key: Term) => X7_TERMS.find((x) => x.key === key)!;
  const settledBoth = both && !play.running;
  return (
    <>
      <div className="mb-2 flex items-center justify-center gap-1.5 font-mono text-lg font-semibold">
        <span>s =</span>
        {X7_TERMS.map((x, i) => (
          <span key={x.key} className="flex items-center gap-1.5">
            {i > 0 && <span>+</span>}
            <button type="button" className={`${chip(order.includes(x.key))} font-mono`} disabled={order.includes(x.key) || play.running} onClick={() => tap(x.key)}>
              {x.text}
            </button>
          </span>
        ))}
      </div>
      <RampSheet label="ব্রিজের ঢাল, তিথি 16 m-এ। প্রতিটা অংশ ঢালে রাস্তার একটা টুকরো বসায়।" marks={[0, 8, 16]} lit={settledBoth ? { m: 16, tone: "mint" } : null}>
        {order[0] && <RoadPiece from={0} len={l0} tone={termOf(order[0]).tone} text={`${termOf(order[0]).text} · 8 m`} />}
        {order[1] && <RoadPiece from={8} len={l1} tone={termOf(order[1]).tone} text={`${termOf(order[1]).text} · 8 m`} />}
        <RampBike m={16} />
        {settledBoth && <Ripple at={[rampAt(16)[0], rampAt(16)[1] - 18]} r={30} />}
        {settledBoth && <CheckMark x={overHead(16)[0] + 14} y={overHead(16)[1] + 2} />}
      </RampSheet>
      <div className="mx-auto mt-2 grid min-h-[4.5rem] w-fit gap-0.5 font-mono text-sm">
        {order.map((key) => (
          <div key={key} className={`${FADE} ${key === "ut" ? "text-[#b08a4a]" : "text-cat-amber"} font-semibold`}>
            {termOf(key).sum}
          </div>
        ))}
        {settledBoth && <div className={`font-bold text-accent-text ${FADE}`}>s = 8 + 8 = 16 m</div>}
      </div>
      <Task done={settledBoth}>সূত্রের দুইটা অংশে tap করুন। তিথির ঢালের সংখ্যা বসিয়ে দেখুন, মেলে কি না।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · When the acceleration isn't even. Three rides, each from 2 to 6 in 4 s:
// wiggly, even, slow at first. A see-through bike rides the trick's 4 m/s
// beside each. Only on the even one do they arrive together.

type RideKey = "wiggle" | "even" | "late";
const X8_RIDES: { key: RideKey; name: string; v: (t: number) => number }[] = [
  { key: "wiggle", name: "আঁকাবাঁকা", v: (t) => 2 + t + 1.6 * Math.sin((3 * Math.PI * t) / 4) },
  { key: "even", name: "সমান হারে", v: (t) => 2 + t },
  { key: "late", name: "শুরুতে আস্তে", v: (t) => 2 + (t * t) / 4 },
];
const X8_N = 400;
const X8_DIST = X8_RIDES.map((r) => {
  const out = [0];
  const h = RIDE.t / X8_N;
  for (let i = 1; i <= X8_N; i++) out.push(out[i - 1] + ((r.v((i - 1) * h) + r.v(i * h)) / 2) * h);
  return out;
});
const x8S = (i: number, t: number) => X8_DIST[i][Math.round((t / RIDE.t) * X8_N)];
const X8_MS = 1800;
const X8_SAY: Record<RideKey, string> = {
  wiggle: "মিললো না: তিথি ছায়াকে ছাড়িয়ে গেলো।",
  even: "একসাথে পৌঁছালো।",
  late: "মিললো না: তিথি ছায়ার পেছনে পড়লো।",
};

function MiniRide({ v }: { v: (t: number) => number }) {
  const px = (t: number) => 8 + t * 19;
  const py = (s: number) => 50 - s * 6.5;
  const d = "M" + Array.from({ length: 41 }, (_, i) => `${px(i / 10).toFixed(1)} ${py(v(i / 10)).toFixed(1)}`).join("L");
  return (
    <svg viewBox="0 0 90 56" className="h-auto w-full max-w-[5.5rem]" aria-hidden="true">
      <rect x={0.5} y={0.5} width={89} height={55} rx={6} fill="#fff" stroke="#cbd5e1" />
      <path d="M8 50H86M8 50V6" stroke={PH.ink} strokeWidth={0.9} />
      <path d={`M8 ${py(4)}H84`} stroke={PH.mute} strokeWidth={0.9} strokeDasharray="3 2" />
      <path d={d} stroke={PH.ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function NotEven() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const walk = useWalk(X8_MS, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(1.2);
    walk.start(() => {
      const next = seen.includes(i) ? seen : [...seen, i];
      setSeen(next);
      if (X8_RIDES[i].key === "even") sfx.chime();
      else sfx.tap();
      if (next.length === X8_RIDES.length && !seen.includes(i)) pass("ত্বরণ সমান না হলে মাঝামাঝির কৌশল খাটে না।");
    });
  };
  // seconds on a straight clock: তিথি at the ride's own distance, the ghost at 4t, the needle at the ride's v(t)
  const t = pick === null ? 0 : RIDE.t * (walk.running ? walk.t : 1);
  const ride = pick === null ? null : X8_RIDES[pick];
  const settled = pick !== null && !walk.running;
  const all = seen.length >= X8_RIDES.length;
  const even = settled && ride?.key === "even";
  const ghost = overHead(4 * RIDE.t, 52);
  return (
    <>
      <RampSheet label="ব্রিজের ঢালে তিথি, আর 4 m/s-এ চলা আবছা ছায়া সাইকেল। 16 m-এ একটা দাগ।" marks={[0, 16]} lit={even ? { m: 16, tone: "mint" } : null} className="max-w-[19rem]">
        {pick !== null && t > 0 && <RampBike m={4 * t} ghost label={!even} />}
        <RampBike m={pick === null ? 0 : x8S(pick, t)} />
        <Gauge x={GAUGE[0]} y={GAUGE[1]} r={15} v={ride ? ride.v(t) : 2} max={8} digits={1} />
        <Txt x={TIME_AT[0] - 4} y={TIME_AT[1]} size={11} color={PH.amber} weight={700}>
          {`t = ${walk.running ? t.toFixed(1) : fmt(t)} s`}
        </Txt>
        {settled && !even && <WrongMark key={pick} x={ghost[0] - 16} y={ghost[1] + 6} />}
        {even && <Ripple key={seen.length} at={[rampAt(16)[0], rampAt(16)[1] - 18]} r={30} />}
        {all && settled && <Chip x={70} y={108} text="calculus" tone="blue" size={9} solid pop />}
      </RampSheet>
      <div className={`mt-1.5 min-h-6 text-center text-sm font-semibold ${settled && ride ? (ride.key === "even" ? "text-accent-text" : "text-danger") : "text-muted"}`}>
        {settled && ride ? <span key={`${pick}${seen.length}`} className={FADE}>{X8_SAY[ride.key]}</span> : "ছায়া চলবে (2 + 6) / 2 = 4 m/s-এ।"}
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {X8_RIDES.map((r, i) => (
          <button
            key={r.key}
            type="button"
            disabled={walk.running}
            onClick={() => go(i)}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-1.5 py-1.5 transition-colors disabled:cursor-default motion-reduce:transition-none ${
              pick === i ? "border-cat-blue bg-cat-blue/10" : seen.includes(i) ? (r.key === "even" ? "border-accent/60" : "border-danger/40") : "border-border hover:border-cat-blue/60"
            }`}
          >
            <MiniRide v={r.v} />
            <span className="text-xs font-semibold">{r.name}</span>
          </button>
        ))}
      </div>
      <Ticks items={X8_RIDES.map((r, i) => [r.name, seen.includes(i)] as [string, boolean])} />
      <Task done={all}>তিনটা ride, সবগুলোতে বেগ 2 থেকে 6। তিনটাই চালিয়ে দেখুন: কোনটায় ছায়া তিথির সাথে পৌঁছায়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn: the same ride, only the first 2 s. The reader plants a flag
// at 4, 6 or 8 m; তিথি rolls 2 s (speedometer 2 → 4) and stops at 6 m.

const X9_M = [8, 4, 6];
const X9_RIGHT = 2;
const X9_T = 2;
const X9_MS = 1500;
const X9_Z = 2.6;
const X9_NOPE = ["তিথি থামলো flag-এর আগেই। 8 হলো 4 × 2: শেষের বেগ ধরে পুরো সময়।", "তিথি flag ছাড়িয়ে গেলো। 4 হলো 2 × 2: শুধু শুরুর বেগ ধরে।", ""];

export function FirstTwoSeconds() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X9_MS, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(1);
    walk.start(() => {
      if (i === X9_RIGHT) {
        sfx.chime();
        pass("2 সেকেন্ডে 4 + 2 = 6 m।");
      } else setMiss((m) => m + 1);
    });
  };
  // seconds on a straight clock; s = ut + ½at² places her, v = u + at moves the needle
  const t = pick === null ? 0 : X9_T * (walk.running ? walk.t : 1);
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X9_RIGHT;
  const flagAt = pick === null ? null : rampAt(X9_M[pick] * X9_Z);
  return (
    <>
      <div className="mb-2 text-center text-sm text-muted">
        শুরু <span className="font-mono text-foreground">2 m/s</span> · প্রতি সেকেন্ডে <span className="font-mono text-foreground">+1 m/s</span> · সময় <span className="font-mono text-foreground">2 s</span>
      </div>
      <RampSheet label="ব্রিজের ঢাল, কাছ থেকে: দাগ 2 m পরপর, 8 m পর্যন্ত। তিথি ঢালের মাথায়।" marks={[0, 2, 4, 6, 8]} z={X9_Z} lit={right ? { m: 6, tone: "mint" } : null}>
        {pick !== null && <RampFlag key={pick} m={X9_M[pick] * X9_Z} tone={settled ? (right ? "mint" : "red") : "blue"} text={`${X9_M[pick]} m`} />}
        <RampBike m={rideS(t) * X9_Z} />
        <Gauge x={GAUGE[0]} y={GAUGE[1]} r={15} v={rideV(t)} max={8} digits={walk.running ? 1 : 0} />
        <Txt x={TIME_AT[0]} y={TIME_AT[1]} size={11} color={PH.amber} weight={700}>
          {`t = ${walk.running ? t.toFixed(1) : fmt(t)} s`}
        </Txt>
        {settled && !right && flagAt && <WrongMark key={miss} x={flagAt[0] - 14} y={flagAt[1] - FLAG_H + 22} />}
        {right && flagAt && <Ripple at={[flagAt[0], flagAt[1] - 18]} r={30} />}
      </RampSheet>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X9_M.map((m, i) => (
          <Choice key={m} n={i} look={pick === i && settled ? (i === X9_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="font-mono">{m} m</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X9_RIGHT && <Nope key={miss}>{X9_NOPE[pick]}</Nope>}
      <Task done={right}>একই ঢাল, কিন্তু শুধু প্রথম 2 সেকেন্ড। তিথি কোথায় থামবে? সেখানে flag বসান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10a · Recap figure for the last screen: the line with its midpoint marked,
// and the boxed s = ut + ½at², 16 m on তিথি's ride.

const S10_SAY = ["শুরু 2, শেষ 6, সমান হারে।", "সমত্বরণে গড় বেগ ঠিক মাঝামাঝি: 4।", "সেখান থেকেই s = ut + ½at²।", "তিথির ঢালে: 8 + 8 = 16 m।"];

export function MidpointRecap({}: Story) {
  const s = useScene(3, [600, 1500, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10_SAY[k]}</span>}>
      <GraphSheet label="বেগ-সময় graph, রেখা 2 থেকে 6, মাঝখানে 4 দাগ দেওয়া। নিচে বাক্সে s = ut + ½at²।" className="max-w-[18rem]">
        <path d={rideLine()} stroke={PH.ink} strokeWidth={2.4} fill="none" strokeLinecap="round" className="pointer-events-none" />
        {k >= 1 && <path d={`M${vtX(2)} ${G0[1]}V${vtY(4)}H${G0[0]}`} stroke={PH.mint} strokeWidth={1.5} strokeDasharray="4 3" fill="none" className={FADE} />}
        {k >= 1 && <circle cx={vtX(2)} cy={vtY(4)} r={4} fill={PH.mint} className={POP} />}
        {k >= 1 && <Tag x={vtX(2) - 22} y={vtY(4) - 13} text="মাঝামাঝি 4" tone="mint" size={9.5} solid pop />}
        {k >= 2 && (
          <g className={POP}>
            <rect x={170} y={84} width={110} height={24} rx={6} fill={PH.mintSoft} stroke={PH.mint} strokeWidth={1.6} />
            <Txt x={225} y={100} size={11.5} weight={800}>
              s = ut + ½at²
            </Txt>
          </g>
        )}
        {k >= 3 && <Chip x={225} y={72} text="= 8 + 8 = 16 m" tone="mint" size={9} pop />}
      </GraphSheet>
    </Scene>
  );
}

// 10b · The teaser: both equations, the t in each glowing amber, then "t = ?".

const S10B_SAY = ["দুইটা সমীকরণ।", "দুইটাতেই সময় t আছে।", "কিন্তু সময় না জানলে?"];
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

function EqCard({ x, parts, glow }: { x: number; parts: [string, boolean][]; glow: boolean }) {
  return (
    <g>
      <rect x={x - 62} y={26} width={124} height={34} rx={8} fill="#fff" stroke={PH.ink} strokeOpacity={0.5} strokeWidth={1.4} />
      <text x={x} y={48} fontSize={13.5} fontWeight={800} textAnchor="middle" fill={PH.ink} style={{ fontFamily: MONO }}>
        {parts.map(([p, isT], i) => (
          <tspan key={i} fill={isT && glow ? PH.amber : PH.ink} style={isT && glow ? { filter: "drop-shadow(0 0 3px #fbbf24)" } : undefined}>
            {p}
          </tspan>
        ))}
      </text>
    </g>
  );
}

export function TwoEquations({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10B_SAY[k]}</span>}>
      <Sheet w={300} h={100} label="দুইটা বাক্সে v = u + at আর s = ut + ½at²। দুইটারই t আলো হয়ে আছে।" className="max-w-[18rem]">
        <EqCard
          x={78}
          glow={k >= 1}
          parts={[
            ["v = u + a", false],
            ["t", true],
          ]}
        />
        <EqCard
          x={222}
          glow={k >= 1}
          parts={[
            ["s = u", false],
            ["t", true],
            [" + ½a", false],
            ["t", true],
            ["²", false],
          ]}
        />
        {k >= 2 && <Chip x={150} y={80} text="t = ?" tone="amber" size={11} solid pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  BridgeTop: { a: { k: 1 }, end: {} },
  DistanceBet: { start: {}, sealed: { bet: 2 } },
  PlaceLetters: { start: {}, wrong: { done: ["u"], wrong: "a" }, done: { done: ["u", "v", "a", "t", "s"] } },
  RollStart: { a: { k: 1 }, end: {} },
  SecondBySecond: { start: {}, two: { sec: 2 }, done: { sec: 4 } },
  FirstEquation: { a: { k: 1 }, end: {} },
  TithiClaim: { a: { k: 1 }, end: {} },
  SixCheck: { start: {}, mid: { seen: [0, 1], cur: 1 }, done: { seen: [0, 1, 2, 3, 4], cur: 4 } },
  SteadyOnly: { a: { k: 1 }, end: {} },
  SteadyGhost: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 1 }, right: { pick: 2 } },
  MidMoment: { a: { k: 1 }, end: {} },
  NotTwentyFour: { a: { k: 0 }, end: {} },
  Derive: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  EightAndEight: { start: {}, one: { order: ["ut"] }, done: { order: ["ut", "half"] } },
  NotEven: { start: {}, wiggle: { pick: 0, seen: [0] }, late: { pick: 2, seen: [0, 2] }, done: { pick: 1, seen: [0, 2, 1] } },
  FirstTwoSeconds: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 1 }, right: { pick: 2 } },
  MidpointRecap: { a: { k: 1 }, end: {} },
  TwoEquations: { end: {} },
};
