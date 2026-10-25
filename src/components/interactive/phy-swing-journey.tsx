"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Ticks, primaryBtn, quietBtn, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { GroundShadow, PArrow, PH, Ripple, Sheet, Tag, Txt, WrongMark, chip, svgPoint, useWalk } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 4 — দোলনার গতি"
// (src/content/articles/physics_for_high_school/chapter_2/04_periodic_motion.mdx), the
// journey of video EP 04 (physics_9_10/04-periodic-motion/script.md). Book
// §2.2, p. 37.
//
// The spine: টুটুল on the নানুবাড়ির দোলনা. At the very top it seems to stop:
// does it really? The reader seals a bet (SwingBet), settled on the last
// screen. On the way, the video's own beats in order: যায়, ফিরে আসে, আবার যায়
// = পর্যায়বৃত্ত গতি (SwingAgain), তিথির stopwatch: 10 দোল in 20 s, so the
// পর্যায়কাল is 2 s (PeriodWatch), পর্যায়বৃত্ত গতি everywhere: fan, comet, heart
// (EverywhereCards), the heartbeat's period, 72 a minute → 60 ÷ 72 ≈ 0.83 s
// (HeartMinute), the সাম্যবিন্দু where an unpushed swing hangs (RestPoint),
// fastest through the middle (FastestPoint), দ্রুতি 0 at the ends (CatchStop),
// and the reader sorts what else is সরল স্পন্দন (ShmSort).
//
// Swing canon (the video's): one pivot on the আমগাছের ডাল, two ropes, a plank;
// the swing goes 40° each side. Angles are + to the right. The speed of a
// swing is drawn as a bar (no numbers, like the video's): at angle θ of an
// amplitude θ0 it is √(1 − (θ/θ0)²) of the most.

type Story = { story?: boolean };
type P = [number, number];

const RAD = Math.PI / 180;
const SW = 300;
const SH = 160;
const PX = 112;
const PY = 22;
const LEN = 100;
const AMP = 40;
/** the yard's ground, where the seat's shadow falls */
const GROUND = SH - 13;
/** a real swing's pace between two angles: sine in-out, slow at the ends, fastest through the bottom */
const SWING_EASE = "cubic-bezier(0.37, 0, 0.63, 1)";
/** end → middle (speeding up) and middle → end (slowing down) */
const EASE_IN_SINE = "cubic-bezier(0.12, 0, 0.39, 0)";
const EASE_OUT_SINE = "cubic-bezier(0.61, 1, 0.88, 1)";

const JERSEY = "#1e3a8a";
const SKIN = "#d49a6a";
const HAIR = "#1c1917";
const WOOD = "#6b4423";
const ROPE = "#a1784a";
const LEAF = "#2f7d4f";

/** Where the seat is when a swing of rope `len` from (px, py) has swung `deg` (+ right). */
export const seatAt = (px: number, py: number, len: number, deg: number): P => [px + len * Math.sin(deg * RAD), py + len * Math.cos(deg * RAD)];

/** The seat's arc from d0 to d1 degrees, as a path. */
const arcD = (px: number, py: number, r: number, d0: number, d1: number) =>
  "M" +
  Array.from({ length: 25 }, (_, i) => seatAt(px, py, r, d0 + ((d1 - d0) * i) / 24))
    .map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join("L");

/** How fast a swing of amplitude `amp` moves at angle `deg`, as a share of its most. */
const speedAt = (deg: number, amp = AMP) => Math.sqrt(Math.max(0, 1 - (deg / amp) ** 2));

// ---------------------------------------------------------------------------
// The swing: drawn around its pivot, so turning it is one rotate.

/** টুটুল sitting on the plank, in the swing's own frame (pivot at 0, 0; seat at y = len). */
function SwingRider({ len }: { len: number }) {
  const y = len - 1;
  return (
    <g>
      <path d={`M-2 ${y - 3}L9 ${y - 3}L10 ${y + 10}`} stroke="#334155" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M10 ${y + 10}h3.5`} stroke={PH.ink} strokeWidth={3} strokeLinecap="round" />
      <path d={`M-1 ${y - 4}L-3 ${y - 19}`} stroke={JERSEY} strokeWidth={10} strokeLinecap="round" />
      <path d={`M-2 ${y - 17}L8.4 ${y - 14}`} stroke={SKIN} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={-2} cy={y - 29} r={6.5} fill={SKIN} />
      <path d={`M-8.6 ${y - 29}q0 -7.6 6.6 -7.6t6.6 6q-3 -3 -6.6 -3t-6.6 4.6Z`} fill={HAIR} />
      <circle cx={1.8} cy={y - 29.5} r={0.95} fill={PH.ink} />
      <path d={`M0.6 ${y - 25.6}q1.6 1.2 3 0`} fill="none" stroke={PH.ink} strokeWidth={0.8} strokeLinecap="round" />
    </g>
  );
}

/**
 * নানুবাড়ির দোলনা: two ropes from one pivot at (px, py), a plank at rope
 * length `len`, টুটুল on it when `rider`. `deg` = how far it has swung (+ to
 * the right). `glide` (ms) eases it between angles, for story scenes, at a
 * swing's own pace (`ease`). `ground` drops the seat's shadow on that line.
 */
export function Swing({
  px,
  py,
  len = LEN,
  deg,
  rider = true,
  glide = 0,
  ease = SWING_EASE,
  opacity = 1,
  ground,
}: {
  px: number;
  py: number;
  len?: number;
  deg: number;
  rider?: boolean;
  glide?: number;
  ease?: string;
  opacity?: number;
  ground?: number;
}) {
  const body = (
    <g opacity={opacity}>
      <path d={`M0 0L-12 ${len}M0 0L12 ${len}`} stroke={ROPE} strokeWidth={1.5} fill="none" />
      <rect x={-15.5} y={len - 1.5} width={31} height={5} rx={1.8} fill={WOOD} stroke={PH.ink} strokeWidth={1} />
      {rider && <SwingRider len={len} />}
    </g>
  );
  // the seat's shadow on the ground: under the seat, smaller as it climbs
  const [sx, sy] = seatAt(px, py, len, deg);
  const shadow = ground !== undefined && <GroundShadow x={sx} y={ground} rx={Math.max(8, 16 - 0.16 * (py + len - sy))} ry={2.6} />;
  if (glide)
    return (
      <>
        {shadow}
        <g style={{ transform: `translate(${px}px, ${py}px) rotate(${-deg}deg)`, transitionDuration: `${glide}ms`, transitionTimingFunction: ease }} className="pointer-events-none transition-transform motion-reduce:transition-none">
          {body}
        </g>
      </>
    );
  return (
    <>
      {shadow}
      <g transform={`translate(${px} ${py}) rotate(${-deg})`} className="pointer-events-none">
        {body}
      </g>
    </>
  );
}

/** The আমগাছের ডাল the swing hangs from, pivot at (px, py): a sticker, one ink line round it. */
function Branch({ px, py, half = 80 }: { px: number; py: number; half?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={px - half} y={py - 8} width={2 * half} height={7} rx={3.5} fill={WOOD} stroke={PH.ink} strokeWidth={1} />
      <ellipse cx={px - half - 4} cy={py - 5} rx={13} ry={7} fill={LEAF} stroke={PH.ink} strokeWidth={1} />
      <ellipse cx={px + half + 4} cy={py - 5} rx={13} ry={7} fill={LEAF} stroke={PH.ink} strokeWidth={1} />
      <circle cx={px} cy={py} r={2.8} fill="#e9dcc0" stroke={PH.ink} strokeWidth={0.9} />
    </g>
  );
}

/** The সাম্যবিন্দু under the seat: a mint dot, a dashed line up to the pivot, its name if `named`. */
function RestDot({ px = PX, py = PY, len = LEN, named = true, pop = false }: { px?: number; py?: number; len?: number; named?: boolean; pop?: boolean }) {
  const y = py + len + 17;
  return (
    <g className="pointer-events-none">
      <path d={`M${px} ${py + 4}V${y - 5}`} stroke={PH.mint} strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
      <circle cx={px} cy={y} r={4.2} fill={PH.mint} className={pop ? POP : ""} />
      {named && (
        <Txt x={px + 9} y={y + 3.5} size={9} anchor="start" color={PH.mint} weight={700} className={pop ? FADE : ""}>
          সাম্যবিন্দু
        </Txt>
      )}
    </g>
  );
}

/** "প্রান্ত" under both ends of the arc. */
function EndNames({ px = PX, py = PY, len = LEN, amp = AMP, faint = true }: { px?: number; py?: number; len?: number; amp?: number; faint?: boolean }) {
  return (
    <>
      {[-amp, amp].map((d) => {
        const [x, y] = seatAt(px, py, len, d);
        return (
          <Txt key={d} x={x + (d < 0 ? -10 : 10)} y={y + 26} size={8.5} color={faint ? "#9aa6b2" : PH.mute}>
            প্রান্ত
          </Txt>
        );
      })}
    </>
  );
}

/** A speed bar: `v` of the most, filled amber from the bottom, "দ্রুতি" under it. */
export function SpeedBar({ x, y, h, v, w = 18, children }: { x: number; y: number; h: number; v: number; w?: number; children?: ReactNode }) {
  const f = Math.max(0, Math.min(1, v)) * (h - 4);
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y} width={w} height={h} rx={5} fill="#fff" stroke={PH.faint} strokeWidth={1.4} />
      {f > 0.5 && <rect x={x + 2} y={y + h - 2 - f} width={w - 4} height={f} rx={3} fill="#f5b52e" />}
      <Txt x={x + w / 2} y={y + h + 13} size={9} color={PH.ink} weight={700}>
        দ্রুতি
      </Txt>
      {children}
    </g>
  );
}

/** The yard: a white-earth sheet with the branch on it. */
function SwingYard({ label, h = SH, px = PX, half = 80, sheet, children }: { label: string; h?: number; px?: number; half?: number; sheet?: Partial<Parameters<typeof Sheet>[0]>; children: ReactNode }) {
  return (
    <Sheet w={SW} h={h} label={label} bg={PH.ground} {...sheet}>
      <Branch px={px} py={PY} half={half} />
      {children}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: নানুবাড়ির উঠান, the আমগাছ, টুটুল on the
// swing, তিথি with her phone. The swing climbs to the top and hangs there: ?

/** The আমগাছ of নানুবাড়ির উঠান on a Stage: trunk at x, a long branch to the right. */
function MangoTree({ x, branchTo, by }: { x: number; branchTo: number; by: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x} 150V${by - 6}`} stroke="#6b4423" strokeWidth={13} strokeLinecap="round" />
      <path d={`M${x} ${by}H${branchTo}`} stroke={WOOD} strokeWidth={6} strokeLinecap="round" />
      <circle cx={x - 6} cy={by - 18} r={22} fill="#15803d" />
      <circle cx={x + 18} cy={by - 24} r={18} fill="#22c55e" />
      <circle cx={x - 22} cy={by - 2} r={14} fill="#16a34a" />
      <ellipse cx={branchTo + 6} cy={by - 4} rx={16} ry={9} fill="#16a34a" />
      <ellipse cx={x + 6} cy={by - 8} rx={3} ry={4} fill="#a3c93a" />
      <ellipse cx={x - 14} cy={by - 26} rx={3} ry={4} fill="#a3c93a" />
    </g>
  );
}

const ST = { px: 165, py: 44, len: 74 };

/** তিথির ফোন in her hand on a Stage (she faces left). */
function StagePhone({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 4} y={y - 7} width={8} height={13} rx={1.6} fill={PH.ink} />
      <rect x={x - 2.8} y={y - 5.6} width={5.6} height={9} rx={0.8} fill="#93c5fd" />
    </g>
  );
}

export function NanuBariSwing({}: Story) {
  const s = useScene(2, [600, 1500]);
  const k = s.k;
  const top = seatAt(ST.px, ST.py, ST.len, -AMP);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নানুবাড়ির উঠানে আমগাছের ডালে দোলনা। টুটুল দোল খাচ্ছে, তিথির হাতে ফোন। দোলনা একদম উপরে উঠে যেন থেমে আছে।">
        <text x={306} y={22} fontSize={10} fontWeight={700} textAnchor="end" fill={PH.ink}>
          নানুবাড়ি
        </text>
        <MangoTree x={46} branchTo={232} by={ST.py - 3} />
        <circle cx={ST.px} cy={ST.py} r={2.4} fill="#d6c29a" />
        <Swing px={ST.px} py={ST.py} len={ST.len} deg={k >= 1 ? -AMP : 22} glide={1300} />
        <text x={ST.px} y={162} fontSize={8.5} fontWeight={700} textAnchor="middle" fill={PH.ink}>
          টুটুল
        </text>
        <Person who="tithi" x={278} y={150} facing={-1} label arm="hold" />
        <StagePhone x={268} y={106} />
        {k >= 2 && (
          <text x={top[0] - 20} y={top[1] - 30} fontSize={22} fontWeight={800} textAnchor="middle" fill={PH.amber} className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: at the very top, what does the swing do? The pick is
// drawn on the seat: a pause mark (it stops), a short arrow (slowly on), a
// long one (as fast as ever), each with its ?. Not marked.

const BET = ["এক মুহূর্ত সত্যিই থামে", "খুব ধীরে চলে, পুরো থামে না", "একই জোরে চলে, থামাটা চোখের ভুল"];

export function SwingBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sx, sy] = seatAt(PX, PY, LEN, AMP);
  // along the arc, further up and out: where it would go if it did not stop
  const ux = Math.cos(AMP * RAD);
  const uy = -Math.sin(AMP * RAD);
  const tip = (l: number): P => [sx + ux * l, sy + uy * l];
  return (
    <>
      <SwingYard label="দোলনা একদম উপরে, ডান প্রান্তে। টুটুল বসে আছে। ওই মুহূর্তে দোলনা কী করে, তার উপরে একটা প্রশ্নবোধক চিহ্ন।" sheet={{ className: "max-w-[19rem]" }}>
        <path d={arcD(PX, PY, LEN + 2, -AMP, AMP)} stroke={PH.faint} strokeWidth={1.2} strokeDasharray="4 4" fill="none" />
        <Swing px={PX} py={PY} deg={AMP} ground={GROUND} />
        {bet === null && (
          <Txt x={sx + 28} y={sy - 30} size={20} color={PH.amber} weight={800}>
            ?
          </Txt>
        )}
        {bet === 0 && (
          <g key="b0" className={POP}>
            <rect x={sx + 22} y={sy - 42} width={4.5} height={14} rx={1} fill={PH.blue} />
            <rect x={sx + 30} y={sy - 42} width={4.5} height={14} rx={1} fill={PH.blue} />
          </g>
        )}
        {bet === 1 && <PArrow key="b1" a={[sx + 14, sy - 8]} b={tip(34)} tone="blue" draw tell="ধীরে চলে" />}
        {bet === 2 && <PArrow key="b2" a={[sx + 14, sy - 8]} b={tip(78)} tone="blue" draw tell="একই জোরে" />}
        {bet !== null && <Tag key={`t${bet}`} x={sx + 70} y={sy - 18} text={["থামে ?", "ধীরে ?", "একই জোরে ?"][bet]} tone="blue" pop />}
      </SwingYard>
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
      <Task done={bet !== null}>টুটুল একদম উপরে। ঠিক ওই মুহূর্তে দোলনা কী করে? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · যায়, ফিরে আসে, আবার যায়. The reader drags the seat up to one side and
// lets go; it swings three times over the same arc and comes back to the
// same spot each time. The trail stays: the same path, again and again.

const X2_PERIOD_MS = 1300;
const X2_TRIPS = 3;
const X2_MIN = 12;

export function SwingAgain() {
  const pass = useGate();
  const [amp, setAmp] = useSeed("amp", 0);
  const [trips, setTrips] = useSeed("trips", 0);
  const [drag, setDrag] = useState(false);
  const [small, setSmall] = useState(false);
  // one clock for the three rounds: the angle is a cosine of it, so the seat
  // eases into each end and rushes through the bottom, like a real swing
  const walk = useWalk(X2_PERIOD_MS * X2_TRIPS, { steps: false, ease: "linear" });
  const done = trips >= X2_TRIPS;
  const aim = (e: React.PointerEvent<SVGSVGElement>) => {
    const [x, y] = svgPoint(e, SW, SH);
    const deg = (Math.atan2(x - PX, Math.max(4, y - PY)) * 180) / Math.PI;
    setAmp(Math.round(Math.max(-45, Math.min(45, deg))));
  };
  const down = (e: React.PointerEvent<SVGSVGElement>) => {
    if (done || walk.running) return;
    setDrag(true);
    setSmall(false);
    aim(e);
  };
  const up = () => {
    if (!drag) return;
    setDrag(false);
    if (Math.abs(amp) < X2_MIN) {
      setSmall(true);
      return;
    }
    setTrips(0);
    sfx.whoosh(0.4);
    walk.start(() => {
      setTrips(X2_TRIPS);
      sfx.chime();
      pass("যায়, ফিরে আসে, আবার যায়।");
    });
  };
  const t = walk.running ? walk.t : done ? 1 : 0;
  const rounds = X2_TRIPS * t;
  const deg = amp * Math.cos(2 * Math.PI * rounds);
  const back = walk.running ? Math.floor(rounds) : trips;
  const A = Math.abs(amp);
  const loose = (walk.running || done) && A >= X2_MIN;
  // the path is laid by the first swing across, then gone over again and again
  const swept = rounds >= 0.5 ? arcD(PX, PY, LEN + 2, -A, A) : arcD(PX, PY, LEN + 2, amp, deg);
  const spot = seatAt(PX, PY, LEN + 2, amp);
  return (
    <>
      <SwingYard
        label="আমগাছের ডালে দোলনা, টুটুল বসে আছে। দোলনাটা এক পাশে টেনে ছেড়ে দিলে সে দুলতে থাকে।"
        sheet={{ onPointerDown: down, onPointerMove: (e) => drag && aim(e), onPointerUp: up, className: `max-w-[21rem] ${done || walk.running ? "" : "cursor-grab"}` }}
      >
        {loose && <path d={swept} stroke={PH.amber} strokeWidth={1.6} strokeDasharray="4 3" fill="none" className="pointer-events-none" />}
        {loose && <circle cx={spot[0]} cy={spot[1]} r={5} fill="#fff" stroke={PH.amber} strokeWidth={1.6} className="pointer-events-none" />}
        {loose && back >= 1 && <Ripple key={back} at={spot} tone="amber" r={16} />}
        <Swing px={PX} py={PY} deg={deg} ground={GROUND} />
        {!walk.running && !done && amp === 0 && (
          <g className="pointer-events-none">
            <PArrow a={[PX + 20, PY + LEN + 6]} b={[PX + 52, PY + LEN - 4]} tone="blue" tell={false} />
            <Txt x={PX + 74} y={PY + LEN - 14} size={9} color={PH.blue}>
              টেনে ছাড়ুন
            </Txt>
          </g>
        )}
        {done && <Tag x={Math.max(40, Math.min(SW - 40, spot[0] + (amp < 0 ? -8 : 8)))} y={spot[1] - 52} text="আবার, আবার" tone="amber" pop />}
      </SwingYard>
      <Ticks items={Array.from({ length: X2_TRIPS }, (_, i) => [`ফিরে এলো ${i + 1}`, back > i] as [string, boolean])} />
      {small && !done && <div className={`mt-2 text-center text-sm text-muted ${FADE}`}>আরেকটু বেশি টেনে তারপর ছাড়ুন।</div>}
      <Task done={done}>দোলনার সিটটা এক পাশে টেনে ছেড়ে দিন। দেখুন সে কোথায় যায়, কোথায় ফিরে আসে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · তিথির stopwatch. Start it: the swing goes ten times while the phone runs
// to 20 s. Then the reader says how long one swing takes; each pick re-runs
// the ten swings at that pace and the stopwatch lands on 10 × the pick.

const X3_MS = 2400;
const X3_AMP = 34;
const X3_PICKS = [0.5, 2, 20];
const X3_RIGHT = 1;
const X3_NOPE = [
  "প্রতিটা দোল 0.5 s হলে দশটা দোল 5 s-এই শেষ। কিন্তু stopwatch দেখিয়েছিল 20 s।",
  "",
  "প্রতিটা দোল 20 s হলে দশটায় লাগতো 200 s। 20 s তো দশটা দোল মিলিয়ে।",
];
const X3_PX = 96;

/** তিথির ফোন as a stopwatch: the time, the swing count, and what was measured. */
function StopwatchPhone({ t, n, measured, tone }: { t: number; n: number; measured: boolean; tone: "ink" | "red" | "mint" }) {
  const shown = Number.isInteger(t) ? `${t} s` : `${Math.floor(t)} s`;
  const col = tone === "red" ? "#fca5a5" : tone === "mint" ? "#6ee7b7" : "#fff";
  return (
    <g className="pointer-events-none">
      <GroundShadow x={245} y={GROUND} rx={40} ry={3} />
      <rect x={202} y={18} width={86} height={128} rx={13} fill="#1e293b" stroke={PH.ink} strokeWidth={1} />
      <rect x={207} y={25} width={76} height={114} rx={8} fill="#0f172a" />
      <text x={245} y={40} fontSize={8} textAnchor="middle" fill="#94a3b8" style={{ fontFamily: "ui-monospace, monospace" }}>
        stopwatch
      </text>
      <text x={245} y={70} fontSize={19} fontWeight={700} textAnchor="middle" fill={col} style={{ fontFamily: "ui-monospace, monospace" }}>
        {shown}
      </text>
      <Txt x={245} y={94} size={10} color="#e2e8f0">
        {`দোল: ${n}`}
      </Txt>
      {measured && (
        <Txt x={245} y={124} size={8.5} color="#fbbf24">
          মাপা: 10 দোল, 20 s
        </Txt>
      )}
    </g>
  );
}

export function PeriodWatch() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [mode, setMode] = useState<"measure" | "pick">("measure");
  const [miss, setMiss] = useState(0);
  // ten swings on one clock; the stopwatch runs evenly with it
  const walk = useWalk(X3_MS, { steps: false, ease: "linear" });
  const start = () => {
    if (walk.running) return;
    setMode("measure");
    sfx.click();
    walk.start(() => {
      setRan(true);
      sfx.chime();
    });
  };
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    setMode("pick");
    sfx.tap();
    walk.start(() => {
      if (i === X3_RIGHT) {
        sfx.chime();
        pass("পর্যায়কাল = 20 ÷ 10 = 2 s।");
      } else setMiss((m) => m + 1);
    });
  };
  const total = mode === "pick" && pick !== null ? 10 * X3_PICKS[pick] : 20;
  const u = walk.running ? walk.t : pick !== null || ran ? 1 : 0;
  const settledTotal = pick !== null ? 10 * X3_PICKS[pick] : 20;
  const t = walk.running ? total * u : ran || pick !== null ? settledTotal : 0;
  const n = Math.min(10, Math.floor(10 * u + 1e-9));
  const deg = -X3_AMP * Math.cos(2 * Math.PI * 10 * u);
  const judged = pick !== null && !walk.running;
  const right = judged && pick === X3_RIGHT;
  const tone = judged ? (right ? "mint" : "red") : "ink";
  return (
    <>
      <SwingYard label="বাম দিকে দোলনায় টুটুল, ডান দিকে তিথির ফোনে stopwatch। Stopwatch সময় আর দোলের সংখ্যা দেখায়।" px={X3_PX} half={68} sheet={{ className: "max-w-[21rem]" }}>
        <Swing px={X3_PX} py={PY} deg={ran || walk.running ? deg : -X3_AMP} ground={GROUND} />
        <StopwatchPhone t={t} n={n} measured={pick !== null} tone={tone} />
        {right && <Ripple at={[245, 64]} r={30} />}
        {judged && !right && <WrongMark x={194} y={70} size={16} />}
      </SwingYard>
      {!ran && pick === null ? (
        <div className="mt-3 flex justify-center">
          <button type="button" className={`${primaryBtn} h-10! px-5!`} disabled={walk.running} onClick={start}>
            Stopwatch চালু করুন
          </button>
        </div>
      ) : (
        <div className="mx-auto mt-3 flex w-full max-w-[20rem] flex-wrap items-center justify-center gap-1.5 text-sm">
          <span className="mr-0.5">একেকটা দোল:</span>
          {X3_PICKS.map((p, i) => (
            <button key={p} type="button" disabled={walk.running || right} className={`${chip(pick === i)} font-mono`} onClick={() => choose(i)}>
              {p} s
            </button>
          ))}
        </div>
      )}
      {judged && !right && <Nope key={miss}>{X3_NOPE[pick]}</Nope>}
      <Task done={right}>Stopwatch চালু করে দশটা দোল গুনতে দিন। তারপর বলুন, একেকটা দোলে কত সময় লাগলো।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · পর্যায়বৃত্ত গতি everywhere: three cards, the video's three. A tap plays
// one round: the fan's blade goes round its circle, the comet round its long
// path about the Sun, the heart beats twice. The path stays drawn.

const X4_MS = 1500;
const X4_CARDS = [
  { key: "fan", name: "ফ্যানের পাখা", how: "গোল পথে" },
  { key: "comet", name: "ধূমকেতু", how: "সূর্যকে ঘিরে, লম্বাটে পথে" },
  { key: "heart", name: "হৃৎপিণ্ড", how: "নির্দিষ্ট সময় পর পর" },
] as const;

const HEART_D = "M0 9C-17 -2 -15 -17 -6 -17C-2 -17 0 -14 0 -12C0 -14 2 -17 6 -17C15 -17 17 -2 0 9Z";

/** Points of a path, as an SVG d. */
const polyD = (pts: P[]) => (pts.length < 2 ? "" : "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L"));

/** A ceiling fan from above, blades turned `turn` of a round; the traced tip path up to `t`. */
export function FanTop({ cx, cy, r = 26, turn, t }: { cx: number; cy: number; r?: number; turn: number; t: number }) {
  const a0 = -90;
  const tipPath = polyD(
    Array.from({ length: Math.round(t * 40) + 1 }, (_, i) => {
      const a = (a0 + (360 * i) / 40) * RAD;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P;
    }),
  );
  const tipA = (a0 + 360 * turn) * RAD;
  return (
    <g className="pointer-events-none">
      {t > 0.02 && <path d={tipPath} stroke={PH.blue} strokeWidth={1.4} strokeDasharray="3 2.5" fill="none" />}
      <g transform={`rotate(${360 * turn} ${cx} ${cy})`}>
        {[0, 120, 240].map((b) => (
          <ellipse key={b} cx={cx} cy={cy - r / 2} rx={5.5} ry={r / 2} fill="#cbd5e1" stroke={PH.ink} strokeWidth={0.9} transform={`rotate(${b} ${cx} ${cy})`} />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={5} fill="#64748b" stroke={PH.ink} strokeWidth={0.9} />
      <circle cx={cx + Math.cos(tipA) * r} cy={cy + Math.sin(tipA) * r} r={3} fill={PH.amber} />
    </g>
  );
}

/**
 * How far round its ellipse a comet is after `turn` of its period, starting
 * far from the Sun (Kepler: M = E − e·sin E), as the angle E from the near end.
 * It dawdles out at the far end and whips round the Sun.
 */
const keplerE = (turn: number, e: number) => {
  const M = Math.PI + 2 * Math.PI * turn;
  let E = M + 0.85 * e * Math.sign(Math.sin(M));
  for (let i = 0; i < 12; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
};

/** The Sun and a comet on its long path; the comet `turn` of a round on (at its true, uneven pace), the path traced up to `t`. */
export function CometPath({ cx, cy, rx = 36, ry = 15, turn, t }: { cx: number; cy: number; rx?: number; ry?: number; turn: number; t: number }) {
  const c = Math.sqrt(rx * rx - ry * ry);
  const fx = cx - c;
  const e = c / rx;
  // E = 0 is the near end, by the Sun; π the far end, where the comet starts
  const at = (E: number): P => [cx - rx * Math.cos(E), cy + ry * Math.sin(E)];
  const E1 = keplerE(t, e);
  const steps = Math.max(1, Math.round(((E1 - Math.PI) / (2 * Math.PI)) * 64));
  const trail = polyD(Array.from({ length: steps + 1 }, (_, i) => at(Math.PI + ((E1 - Math.PI) * i) / steps)));
  const [x, y] = at(keplerE(turn, e));
  const away = Math.atan2(y - cy, x - fx);
  return (
    <g className="pointer-events-none">
      {t > 0.02 && <path d={trail} stroke={PH.blue} strokeWidth={1.3} strokeDasharray="3 2.5" fill="none" />}
      <circle cx={fx} cy={cy} r={9} fill="#f59e0b" opacity={0.25} />
      <circle cx={fx} cy={cy} r={6} fill="#f59e0b" stroke={PH.ink} strokeWidth={0.9} />
      <path d={`M${x} ${y}L${x + Math.cos(away) * 11} ${y + Math.sin(away) * 11}`} stroke="#93c5fd" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      <circle cx={x} cy={y} r={3.2} fill="#1d4ed8" stroke={PH.ink} strokeWidth={0.8} />
    </g>
  );
}

/** A heart, `beat` 0…1 of its squeeze, and its pulse line drawn up to `t`. */
export function HeartPulse({ cx, cy, s = 1, beat, t, beats = 2 }: { cx: number; cy: number; s?: number; beat: number; t: number; beats?: number }) {
  const x0 = cx - 40;
  const pts: P[] = [];
  for (let i = 0; i <= 80; i++) {
    const u = i / 80;
    const ph = (u * beats) % 1;
    const y = ph > 0.42 && ph < 0.47 ? -9 : ph >= 0.47 && ph < 0.52 ? 5 : ph >= 0.6 && ph < 0.7 ? -2 : 0;
    pts.push([x0 + 80 * u, cy + 36 + y]);
  }
  const shown = pts.slice(0, Math.round(t * 80) + 1);
  return (
    <g className="pointer-events-none">
      <g transform={`translate(${cx} ${cy}) scale(${s * (1 + 0.16 * beat)})`}>
        <path d={HEART_D} fill="#f06b7e" stroke={PH.ink} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </g>
      {t > 0.02 && <path d={polyD(shown)} stroke="#e11d48" strokeWidth={1.3} fill="none" strokeLinejoin="round" />}
    </g>
  );
}

export function EverywhereCards() {
  const pass = useGate();
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [on, setOn] = useState<number | null>(null);
  const walk = useWalk(X4_MS, { steps: false, ease: "linear" });
  const done = seen.length >= X4_CARDS.length;
  const tap = (i: number) => {
    if (walk.running) return;
    setOn(i);
    sfx.whoosh(0.3);
    walk.start(() => {
      const next = seen.includes(i) ? seen : [...seen, i];
      setSeen(next);
      sfx.pop();
      if (next.length === X4_CARDS.length && !seen.includes(i)) pass("গোল পথ, লম্বাটে পথ, স্পন্দন: সবই বারবার।");
    });
  };
  const tOf = (i: number) => (walk.running && on === i ? walk.t : seen.includes(i) ? 1 : 0);
  return (
    <>
      <div className="mx-auto grid w-full max-w-[22rem] grid-cols-3 gap-2">
        {X4_CARDS.map((c, i) => {
          const t = tOf(i);
          const playing = walk.running && on === i;
          const beat = c.key === "heart" && playing ? Math.max(0, 1 - ((t * 2) % 1) * 3) : 0;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => tap(i)}
              disabled={walk.running}
              className={`flex cursor-pointer flex-col items-center rounded-xl border bg-white px-1 pt-1 pb-1.5 transition-colors disabled:cursor-default motion-reduce:transition-none ${
                playing ? "border-cat-blue" : seen.includes(i) ? "border-accent" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <svg viewBox="0 0 100 86" className="block h-auto w-full" role="img" aria-label={`${c.name}, ${c.how}`}>
                {c.key === "fan" && <FanTop cx={50} cy={42} r={28} turn={t} t={t} />}
                {c.key === "comet" && <CometPath cx={54} cy={42} rx={38} ry={16} turn={t} t={t} />}
                {c.key === "heart" && <HeartPulse cx={50} cy={34} s={1.4} beat={beat} t={t} />}
              </svg>
              <span className="text-[0.8rem] leading-tight font-semibold text-[#0f1b2d]">{c.name}</span>
              <span className={`min-h-8 text-center text-[0.7rem] leading-tight text-[#5a6b7d] transition-opacity duration-300 motion-reduce:transition-none ${seen.includes(i) ? "opacity-100" : "opacity-0"}`}>{c.how}</span>
            </button>
          );
        })}
      </div>
      <Ticks items={X4_CARDS.map((c, i) => [c.name, seen.includes(i)] as [string, boolean])} />
      {done && <div className={`mt-1 text-center text-sm font-semibold text-accent-text ${FADE}`}>তিনটাই বারবার, একইভাবে।</div>}
      <Task done={done}>তিনটা card-ই tap করে দেখুন: কে কোন পথে চলে, আর আবার ফিরে আসে কি না।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The heartbeat's period. মিনিটে 72 বার. The reader picks how long one
// beat takes; the heart then beats at that pace while a 60 s dial sweeps once,
// and the count lands on 50, 60 or 72.

const X5_MS = 1800;
const X5_PICKS = [1.2, 1, 60 / 72];
const X5_SHOW = ["1.2 s", "1 s", "0.83 s"];
const X5_RIGHT = 2;
const X5_NOPE = [
  "প্রতিটা beat 1.2 s হলে এক মিনিটে মাত্র 50 বার। কিন্তু heartbeat তো 72 বার।",
  "প্রতিটা beat 1 s হলে এক মিনিটে 60 বার। 72 বার হতে হলে একেকটা আরো ছোট।",
  "",
];
const beatsIn = (t: number, p: number) => Math.floor(t / p + 1e-9);

export function HeartMinute() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // the minute on one even clock: the hand sweeps at a steady pace
  const walk = useWalk(X5_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.tap();
    walk.start(() => {
      if (i === X5_RIGHT) {
        sfx.chime();
        pass("60 ÷ 72 ≈ 0.83 s, এক সেকেন্ডেরও কম।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? null : X5_PICKS[pick];
  const t = pick === null ? 0 : walk.running ? 60 * walk.t : 60;
  const n = p === null ? 0 : beatsIn(t, p);
  const beat = p !== null && walk.running ? Math.max(0, 1 - ((t / p) % 1) * 2.5) : 0;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X5_RIGHT;
  const C: P = [226, 76];
  const R = 42;
  const ha = (360 * t) / 60;
  const hx = C[0] + Math.sin(ha * RAD) * (R - 6);
  const hy = C[1] - Math.cos(ha * RAD) * (R - 6);
  const sweep = t > 0.2 ? `M${C[0]} ${C[1]}L${C[0]} ${C[1] - R + 2}A${R - 2} ${R - 2} 0 ${ha > 180 ? 1 : 0} 1 ${C[0] + Math.sin(Math.min(ha, 359.5) * RAD) * (R - 2)} ${C[1] - Math.cos(Math.min(ha, 359.5) * RAD) * (R - 2)}Z` : "";
  return (
    <>
      <Sheet w={SW} h={165} label="বাম দিকে একটা হৃৎপিণ্ড, ডান দিকে 60 সেকেন্ডের একটা ঘড়ি। হৃৎপিণ্ড যতবার beat করে, গোনা হয়।" className="max-w-[21rem]">
        <Txt x={76} y={22} size={10} color={PH.amber} weight={700}>
          মিনিটে 72 বার beat
        </Txt>
        <HeartPulse cx={76} cy={70} s={1.9} beat={beat} t={0} />
        {right && <Ripple at={[76, 62]} r={34} />}
        <text x={76} y={118} fontSize={15} fontWeight={700} textAnchor="middle" fill={settled ? (right ? PH.mint : PH.red) : PH.ink} style={{ fontFamily: "ui-monospace, monospace" }}>
          {`beat ${n}`}
        </text>
        {settled && !right && <WrongMark x={128} y={119} />}
        <circle cx={C[0]} cy={C[1]} r={R + 4} fill="#fff" stroke={PH.ink} strokeWidth={1} />
        <circle cx={C[0]} cy={C[1]} r={R} fill="#fff" stroke={PH.faint} strokeWidth={1} />
        {sweep && <path d={sweep} fill={PH.amberSoft} />}
        {Array.from({ length: 12 }, (_, i) => {
          const a = i * 30 * RAD;
          return <path key={i} d={`M${C[0] + Math.sin(a) * (R - 3)} ${C[1] - Math.cos(a) * (R - 3)}L${C[0] + Math.sin(a) * (R - 8)} ${C[1] - Math.cos(a) * (R - 8)}`} stroke={PH.mute} strokeWidth={i % 3 ? 0.8 : 1.6} />;
        })}
        <path d={`M${C[0]} ${C[1]}L${hx} ${hy}`} stroke={PH.ink} strokeWidth={2} strokeLinecap="round" />
        <circle cx={C[0]} cy={C[1]} r={2.6} fill={PH.ink} />
        <text x={C[0]} y={C[1] + R + 14} fontSize={11} fontWeight={700} textAnchor="middle" fill={PH.ink} style={{ fontFamily: "ui-monospace, monospace" }}>
          {`${Math.round(t)} s`}
        </text>
        {settled && <Tag key={`r${pick}`} x={76} y={142} text={`60 s-এ ${n} বার`} tone={right ? "mint" : "red"} pop />}
      </Sheet>
      <div className="mx-auto mt-3 flex w-full max-w-[20rem] flex-wrap items-center justify-center gap-1.5 text-sm">
        {X5_SHOW.map((s, i) => (
          <button key={s} type="button" disabled={walk.running || right} className={`${chip(pick === i)} font-mono`} onClick={() => choose(i)}>
            {s}
          </button>
        ))}
      </div>
      {settled && !right && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>একেকটা beat কত সময়ের? বেছে নিন, তারপর দেখুন এক মিনিটে কতবার beat হয়।</Task>
    </>
  );
}

// 5½ · Figure for screen 5's explanation: the video's rule of three, row by
// row: 72 বার beat → 60 s, so 1 বার beat → 60 ÷ 72 s ≈ 0.83 s.

const S5_SAY = ["মিনিটে 72 বার beat: 72 বারে 60 সেকেন্ড।", "তাহলে 1 বারে 60 ÷ 72 সেকেন্ড।", "এক সেকেন্ডেরও কম, প্রায় 0.83 সেকেন্ড।"];

export function BeatRule({}: Story) {
  const s = useScene(2, [600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <Sheet w={260} h={110} label="72 বার beat হয় 60 সেকেন্ডে, তাই 1 বার beat হয় 60 ভাগ 72 সেকেন্ডে, প্রায় 0.83 সেকেন্ড।" className="max-w-[17rem]">
        <g transform="translate(30 30)">
          <path d={HEART_D} fill="#f06b7e" stroke={PH.ink} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" transform="scale(0.8)" />
        </g>
        <Txt x={60} y={36} size={13} anchor="start" weight={700}>
          72 বার beat
        </Txt>
        <Txt x={160} y={36} size={13} anchor="start" color={PH.mute}>
          →
        </Txt>
        <Txt x={182} y={36} size={13} anchor="start" weight={700}>
          60 s
        </Txt>
        {k >= 1 && (
          <g className={FADE}>
            <Txt x={60} y={66} size={13} anchor="start" weight={700}>
              1 বার beat
            </Txt>
            <Txt x={160} y={66} size={13} anchor="start" color={PH.mute}>
              →
            </Txt>
            <Txt x={182} y={66} size={13} anchor="start" weight={700} color={PH.amber}>
              60 ÷ 72 s
            </Txt>
          </g>
        )}
        {k >= 2 && <Tag x={208} y={92} text="≈ 0.83 s" tone="mint" size={11} solid pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · সাম্যবিন্দু. টুটুল has got off. Where does an unpushed swing hang? Three
// rings on the arc; the seat is set on the tapped one and let go. Off the
// middle it swings down and dies away in the middle; in the middle it stays,
// and the সাম্যবিন্দু is named with the two ends either side of it.

const X6_SPOTS = [-AMP, 26, 0];
const X6_RIGHT = 2;
const X6_MS = 1800;

export function RestPoint() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // let go off the middle, the swing dies away on a clock: each swing smaller, slow at its ends
  const walk = useWalk(X6_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.tap();
    if (i === X6_RIGHT) {
      // set down in the middle, it just hangs there
      sfx.chime();
      pass("কেউ না ঠেললে দোলনা থাকে সাম্যবিন্দুতে।");
      return;
    }
    walk.start(() => setMiss((m) => m + 1));
  };
  const d0 = pick === null ? 0 : X6_SPOTS[pick];
  const u = walk.running ? walk.t : 1;
  const deg = pick === null ? null : !walk.running ? 0 : d0 * Math.exp(-2.2 * u) * Math.cos(2 * Math.PI * 1.6 * u) * (1 - u ** 3);
  const right = pick === X6_RIGHT && !walk.running;
  const wrong = pick !== null && pick !== X6_RIGHT && !walk.running;
  return (
    <>
      <SwingYard label="আমগাছের ডালে খালি দোলনা। দোলনার পথে তিনটা গোল দাগ: বাম প্রান্তে, ডান দিকে মাঝামাঝি, আর একদম নিচে মাঝখানে।">
        <path d={arcD(PX, PY, LEN + 2, -AMP - 4, AMP + 4)} stroke={PH.faint} strokeWidth={1.2} strokeDasharray="4 4" fill="none" className="pointer-events-none" />
        {right && (
          <g className={FADE}>
            {[-AMP, AMP].map((d) => {
              const [x, y] = seatAt(PX, PY, LEN, d);
              return <path key={d} d={`M${PX} ${PY}L${x} ${y}`} stroke={PH.mute} strokeWidth={1} strokeDasharray="3 3" className="pointer-events-none" />;
            })}
            <EndNames faint={false} />
          </g>
        )}
        {deg === null && X6_SPOTS.map((d) => <Swing key={d} px={PX} py={PY} deg={d} rider={false} opacity={0.16} />)}
        {deg !== null && <Swing px={PX} py={PY} deg={deg} rider={false} ground={GROUND} />}
        {right && <RestDot pop />}
        {right && <Ripple at={[PX, PY + LEN + 2]} r={26} />}
        {!right &&
          X6_SPOTS.map((d, i) => {
            const [x, y] = seatAt(PX, PY, LEN + 2, d);
            const look = pick === i && !walk.running ? PH.red : PH.blue;
            return (
              <g key={i} onClick={() => choose(i)} className="cursor-pointer" role="button" aria-label={`জায়গা ${i + 1}`}>
                <circle cx={x} cy={y} r={16} fill="transparent" />
                <circle cx={x} cy={y} r={11} fill="none" stroke={look} strokeWidth={1.5} strokeDasharray="3 2.5" className="pointer-events-none" />
              </g>
            );
          })}
        {wrong &&
          (() => {
            const [x, y] = seatAt(PX, PY, LEN + 2, X6_SPOTS[pick]);
            return <WrongMark key={`w${miss}`} x={x + (x < PX ? -18 : 18)} y={y - 10} />;
          })()}
      </SwingYard>
      {wrong && <Nope key={miss}>ওখানে রেখে ছেড়ে দিতেই দোলনা দুলে দুলে নেমে এলো। শেষে থামলো কোথায়?</Nope>}
      <Task done={right}>কেউ না ঠেললে খালি দোলনাটা কোথায় ঝুলে থাকবে? সেই গোল দাগে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Fastest through the middle. The swing is let go from the left end; the
// reader taps where on the way down it goes fastest. The swing then runs to
// the middle with the speed bar beside it; the bar is marked as it passes the
// tapped spot, and a spot short of the middle is left below the bar's top.

const X7_SPOTS = [-30, -18, 0];
const X7_RIGHT = 2;
const X7_MS = 1100;
const X7_BAR = { x: 244, y: 30, h: 100 };
const X7_NOPE = ["আপনার জায়গা পার হওয়ার পরেও bar বাড়তেই থাকলো। আরো নিচে দ্রুতি বেশি।", "এখানেও bar থামেনি, মাঝখান পর্যন্ত বাড়লো। সবচেয়ে উঁচু bar কোথায়?", ""];

export function FastestPoint() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // a quarter swing on an even clock: the angle is a cosine of time, so it
  // leaves the end slowly and is fastest at the bottom
  const walk = useWalk(X7_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.5);
    walk.start(() => {
      if (i === X7_RIGHT) {
        sfx.chime();
        pass("সাম্যবিন্দুতে দ্রুতি সবচেয়ে বেশি।");
      } else setMiss((m) => m + 1);
    });
  };
  const ph = pick === null ? 0 : walk.running ? walk.t : 1;
  const deg = -AMP * Math.cos((Math.PI / 2) * ph);
  const v = Math.sin((Math.PI / 2) * ph);
  const vp = pick === null ? 0 : speedAt(X7_SPOTS[pick]);
  const passed = pick !== null && deg >= X7_SPOTS[pick] - 0.01;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X7_RIGHT;
  const pickAt = pick === null ? null : seatAt(PX, PY, LEN + 2, X7_SPOTS[pick]);
  const barY = (f: number) => X7_BAR.y + X7_BAR.h - 2 - f * (X7_BAR.h - 4);
  return (
    <>
      <SwingYard label="দোলনা বাম প্রান্ত থেকে নামবে। নামার পথে তিনটা গোল দাগ, নিচে সাম্যবিন্দু। ডান পাশে দ্রুতির bar।">
        <path d={arcD(PX, PY, LEN + 2, -AMP, AMP)} stroke={PH.faint} strokeWidth={1.2} strokeDasharray="4 4" fill="none" className="pointer-events-none" />
        <RestDot />
        <EndNames />
        <Swing px={PX} py={PY} deg={deg} ground={GROUND} />
        {right && <Ripple at={[PX, PY + LEN + 2]} r={24} />}
        {settled && !right && pickAt && <WrongMark key={`w${miss}`} x={pickAt[0] - 4} y={pickAt[1] - 14} />}
        {X7_SPOTS.map((d, i) => {
          const [x, y] = seatAt(PX, PY, LEN + 2, d);
          const look = pick === i && settled ? (i === X7_RIGHT ? PH.mint : PH.red) : PH.blue;
          return (
            <g key={i} onClick={() => choose(i)} className={right ? "" : "cursor-pointer"} role="button" aria-label={`জায়গা ${i + 1}`}>
              <circle cx={x} cy={y} r={14} fill="transparent" />
              <circle cx={x} cy={y} r={9} fill="none" stroke={look} strokeWidth={1.5} strokeDasharray="3 2.5" className="pointer-events-none" />
            </g>
          );
        })}
        <SpeedBar x={X7_BAR.x} y={X7_BAR.y} h={X7_BAR.h} v={v}>
          {passed && pick !== X7_RIGHT && (
            <g className={FADE}>
              <path d={`M${X7_BAR.x - 6} ${barY(vp)}h${18 + 12}`} stroke={PH.red} strokeWidth={1.6} strokeDasharray="3 2" />
              <Txt x={X7_BAR.x - 9} y={barY(vp) + 3} size={8} anchor="end" color={PH.red}>
                আপনার জায়গা
              </Txt>
            </g>
          )}
          {settled && (
            <g className={FADE}>
              <path d={`M${X7_BAR.x - 6} ${barY(1)}h30`} stroke={PH.amber} strokeWidth={1.4} strokeDasharray="3 2" />
              <Txt x={X7_BAR.x + 9} y={X7_BAR.y - 6} size={8.5} color={PH.amber} weight={700}>
                সবচেয়ে বেশি
              </Txt>
            </g>
          )}
        </SpeedBar>
      </SwingYard>
      {settled && !right && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={right}>দোলনা বাম প্রান্ত থেকে ছাড়া হবে। নামার পথে কোন গোল দাগে সে সবচেয়ে জোরে চলবে? tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · প্রান্তে শূন্য. The swing goes to and fro at its real pace (2 s a round,
// the video's period) with the speed bar beside it. The reader stops it where
// the bar is smallest; at an end it is caught at দ্রুতি 0 with a turn-back
// arrow. Both ends to catch. Anywhere else the bar is still up: a Nope.

// k counts the swing's clock in steps of 40 ms: X8_P of them make one round,
// 2 s, the video's period.
const X8_P = 50;
const X8_RUN = 3 * X8_P;
const X8_NEAR = 0.45;
const X8_BAR = { x: 244, y: 30, h: 100 };
const X8_MS_PER_K = 40;
type End = "L" | "R";

const x8deg = (k: number) => -AMP * Math.cos((2 * Math.PI * k) / X8_P);
const x8v = (k: number) => Math.abs(Math.sin((2 * Math.PI * k) / X8_P));
const isEnd = (k: number) => x8v(k) < 1e-6;

/**
 * A clock that runs smoothly (rAF) from k0 to k1, `msPerK` a step, and can be
 * stopped where it is: `stop()` freezes it and says the k it stopped at. The
 * kit's useWalk can't be stopped midway; catching the swing needs that. It runs
 * under reduced motion too: stopping the moving swing is the exercise.
 */
function useStopClock(msPerK: number) {
  const [k, setK] = useState(0);
  const [running, setRunning] = useState(false);
  const raf = useRef(0);
  const now = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const go = (k0: number, k1: number) => {
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    now.current = k0;
    setK(k0);
    setRunning(true);
    const tick = (ts: number) => {
      const kk = Math.min(k1, k0 + (ts - t0) / msPerK);
      now.current = kk;
      setK(kk);
      if (kk < k1) raf.current = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf.current = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf.current);
    setRunning(false);
    return now.current;
  };
  return { k, running, go, stop, peek: () => now.current };
}

export function CatchStop() {
  const pass = useGate();
  const [frozen, setFrozen] = useSeed<number | null>("frozen", null);
  const [caught, setCaught] = useSeed<End[]>("caught", []);
  const [judged, setJudged] = useSeed("judged", false);
  const [from, setFrom] = useState(0);
  const [miss, setMiss] = useState(0);
  const play = useStopClock(X8_MS_PER_K);
  const done = caught.length >= 2;
  const go = () => {
    if (play.running || done) return;
    const k0 = frozen ?? 0;
    setFrom(k0);
    setJudged(false);
    sfx.whoosh(0.4);
    play.go(k0, k0 + X8_RUN);
  };
  const stop = () => {
    if (!play.running) return;
    if (play.peek() - from < 6) return;
    const k = play.stop();
    setJudged(true);
    if (x8v(k) < X8_NEAR) {
      const ks = Math.round(k / (X8_P / 2)) * (X8_P / 2);
      const end: End = x8deg(ks) < 0 ? "L" : "R";
      setFrozen(ks);
      sfx.thump();
      if (!caught.includes(end)) {
        const next = [...caught, end];
        setCaught(next);
        if (next.length === 2) pass("প্রান্তে দ্রুতি 0, তারপর দিক বদল।");
      }
    } else {
      setFrozen(k);
      setMiss((m) => m + 1);
    }
  };
  const k = play.running ? play.k : (frozen ?? 0);
  const deg = x8deg(k);
  const v = x8v(k);
  const atEnd = judged && !play.running && frozen !== null && isEnd(frozen);
  const missed = judged && !play.running && frozen !== null && !isEnd(frozen);
  const [sx, sy] = seatAt(PX, PY, LEN, deg);
  const side = deg < 0 ? -1 : 1;
  // back along the arc towards the middle
  const bx = -side * Math.cos(AMP * RAD);
  const by = Math.sin(AMP * RAD);
  return (
    <>
      <SwingYard label="দোলনা দুই প্রান্তের মাঝে দুলছে, ডান পাশে দ্রুতির bar। থামান চাপলে ছবিটা ঠিক ওই মুহূর্তে আটকে যায়।">
        <path d={arcD(PX, PY, LEN + 2, -AMP, AMP)} stroke={PH.faint} strokeWidth={1.2} strokeDasharray="4 4" fill="none" className="pointer-events-none" />
        <RestDot named={false} />
        <EndNames />
        <Swing px={PX} py={PY} deg={deg} ground={GROUND} />
        {missed && <circle cx={sx} cy={sy + 2} r={13} fill="none" stroke={PH.red} strokeWidth={1.6} className={`pointer-events-none ${POP}`} />}
        {missed && <WrongMark key={`w${miss}`} x={sx + (sx < PX ? -22 : 22)} y={sy - 6} />}
        {atEnd && (
          <g key={`e${frozen}`}>
            <Ripple at={[sx, sy]} r={22} />
            <Tag x={sx + side * 4} y={sy - 50} text="দ্রুতি 0" tone="amber" solid pop />
            <PArrow a={[sx + bx * 14, sy + by * 14 + 14]} b={[sx + bx * 40, sy + by * 40 + 14]} tone="blue" draw tell="এবার উল্টা দিকে" />
          </g>
        )}
        <SpeedBar x={X8_BAR.x} y={X8_BAR.y} h={X8_BAR.h} v={v}>
          {atEnd && (
            <Txt x={X8_BAR.x + 30} y={X8_BAR.y + X8_BAR.h - 2} size={13} color={PH.amber} weight={800}>
              0
            </Txt>
          )}
        </SpeedBar>
      </SwingYard>
      <div className="mt-3 flex justify-center gap-2">
        {play.running ? (
          <button type="button" className={`${primaryBtn} h-10! px-6!`} onClick={stop}>
            থামান
          </button>
        ) : (
          <button type="button" className={`${quietBtn} h-10! px-5!`} disabled={done} onClick={go}>
            {frozen === null ? "দোলনা ছেড়ে দিন" : "আবার ছেড়ে দিন"}
          </button>
        )}
      </div>
      <Ticks
        items={[
          ["বাম প্রান্ত", caught.includes("L")],
          ["ডান প্রান্ত", caught.includes("R")],
        ]}
      />
      {missed && <Nope key={miss}>এখানে দোলনা চলছে, bar খালি না। যেখানে bar সবচেয়ে ছোট, সেখানে ধরুন।</Nope>}
      <Task done={done}>দোলনা ছেড়ে দিন। bar যখন সবচেয়ে ছোট, ঠিক সেই মুহূর্তে থামান চাপুন। দুই দিকেই একবার করে।</Task>
    </>
  );
}

// 8½ · Figure for screen 8's explanation: the swing to and fro about the
// সাম্যবিন্দু is named সরল স্পন্দন, then the bigger box around it, পর্যায়বৃত্ত
// গতি, with the fan, the comet and the heart beside it (the video's scene 10).

const S8_SAY = ["সাম্যবিন্দুর দুই পাশে দোলা।", "এর নাম সরল স্পন্দন গতি, Simple Harmonic Motion।", "এটা পর্যায়বৃত্ত গতিরই একটা বিশেষ ধরন।"];
const S8 = { px: 92, py: 44, len: 74 };

export function ShmBox({}: Story) {
  const s = useScene(2, [600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S8_SAY[k]}</span>}>
      <Sheet w={SW} h={180} label="দোলনা সাম্যবিন্দুর দুই পাশে দোলে: সরল স্পন্দন। তার চারপাশে বড় একটা বাক্স: পর্যায়বৃত্ত গতি, পাশে ফ্যান, ধূমকেতু, হৃৎপিণ্ড।" className="max-w-[19rem]">
        {k >= 2 && (
          <g className={FADE}>
            <rect x={8} y={8} width={284} height={164} rx={12} fill={PH.amberSoft} stroke={PH.amber} strokeWidth={1.3} strokeDasharray="5 4" />
            <Tag x={234} y={24} text="পর্যায়বৃত্ত গতি" tone="amber" solid />
            {["ফ্যানের পাখা", "ধূমকেতু", "হৃৎপিণ্ড"].map((c, i) => (
              <Tag key={c} x={238} y={70 + i * 28} text={c} tone="ink" />
            ))}
          </g>
        )}
        <rect x={20} y={20} width={170} height={142} rx={10} fill="#fff" stroke={k >= 1 ? PH.mint : PH.faint} strokeWidth={1.3} className="transition-[stroke] duration-500 motion-reduce:transition-none" />
        <Branch px={S8.px} py={S8.py} half={56} />
        <path d={arcD(S8.px, S8.py, S8.len + 2, -AMP, AMP)} stroke={PH.faint} strokeWidth={1.2} strokeDasharray="4 4" fill="none" />
        <RestDot px={S8.px} py={S8.py} len={S8.len} named={false} />
        <Swing px={S8.px} py={S8.py} len={S8.len} deg={k === 1 ? AMP : -AMP} glide={1100} />
        {k >= 1 && (
          <g className={POP}>
            <Tag x={105} y={152} text="সরল স্পন্দন · Simple Harmonic Motion" tone="mint" size={7.5} solid />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn: which of five move to and fro about a সাম্যবিন্দু? The spring,
// the clock's pendulum and the air molecules bob about their mint rest mark;
// the fan and the comet go round, periodic but no to-and-fro. Find all three.

const X9_MS = 1200;
type Thing = "spring" | "pendulum" | "air" | "fan" | "comet";
const X9_THINGS: { key: Thing; name: string; shm: boolean }[] = [
  { key: "fan", name: "ফ্যানের পাখা", shm: false },
  { key: "spring", name: "Spring-এ ঝোলানো বস্তু", shm: true },
  { key: "comet", name: "ধূমকেতু", shm: false },
  { key: "pendulum", name: "দেয়াল ঘড়ির pendulum", shm: true },
  { key: "air", name: "বাতাসের অণু", shm: true },
];
const X9_NOPE: Partial<Record<Thing, string>> = {
  fan: "পাখা ঘুরে ঘুরে গোল পথে চলে। কোনো মাঝের বিন্দুর দুই পাশে দোলে না।",
  comet: "ধূমকেতু সূর্যকে ঘিরে লম্বাটে পথে ঘোরে। পর্যায়বৃত্ত ঠিকই, কিন্তু দুই পাশে দোলা না।",
};

/**
 * One of the five, `t` 0…1 into its play (two bobs, or one round); `rest`
 * shows its সাম্যবিন্দু, `wrong` a red ? beside the thing that went round.
 */
function ThingPic({ thing, t, rest, wrong = false }: { thing: Thing; t: number; rest: boolean; wrong?: boolean }) {
  const bob = Math.sin(2 * Math.PI * 2 * t);
  if (thing === "spring") {
    const yb = 42 + 10 * bob;
    const pts: P[] = [[50, 9]];
    for (let i = 1; i < 9; i++) pts.push([i % 2 ? 42 : 58, 9 + ((yb - 9) * i) / 9]);
    pts.push([50, yb]);
    return (
      <g className="pointer-events-none">
        <rect x={29} y={4.5} width={42} height={5} rx={2.5} fill="#cbd5e1" stroke={PH.ink} strokeWidth={0.9} />
        <path d={polyD(pts)} stroke="#64748b" strokeWidth={1.4} fill="none" strokeLinejoin="round" />
        {rest && <path d="M24 50H76" stroke={PH.mint} strokeWidth={1.3} strokeDasharray="3 2.5" />}
        {rest && <Ripple at={[50, 50]} r={22} />}
        <rect x={37} y={yb} width={26} height={16} rx={3} fill="#bfdbfe" stroke={PH.ink} strokeWidth={0.9} />
      </g>
    );
  }
  if (thing === "pendulum") {
    const a = 22 * bob * RAD;
    const bx = 50 + Math.sin(a) * 34;
    const by = 32 + Math.cos(a) * 34;
    return (
      <g className="pointer-events-none">
        <rect x={30} y={4} width={40} height={74} rx={7} fill="#7a5c45" stroke={PH.ink} strokeWidth={0.9} />
        <circle cx={50} cy={19} r={11} fill="#f5ecd7" stroke={PH.ink} strokeWidth={0.9} />
        <path d="M50 19V12M50 19L55 22" stroke={PH.ink} strokeWidth={1.3} strokeLinecap="round" />
        {rest && <path d="M50 32V72" stroke={PH.mint} strokeWidth={1.3} strokeDasharray="3 2.5" />}
        {rest && <Ripple at={[50, 66]} r={18} />}
        <path d={`M50 32L${bx} ${by}`} stroke="#d4a843" strokeWidth={1.6} />
        <circle cx={bx} cy={by} r={5} fill="#e8c35a" stroke={PH.ink} strokeWidth={0.9} />
      </g>
    );
  }
  if (thing === "air") {
    return (
      <g className="pointer-events-none">
        <circle cx={11} cy={40} r={10} fill={SKIN} />
        <path d="M2 36q0 -10 9 -10t9 8q-4 -3 -9 -3t-9 5Z" fill={HAIR} />
        <ellipse cx={20} cy={44} rx={2} ry={2.8} fill="#7f1d1d" />
        {rest && <path d="M51 14V68" stroke={PH.mint} strokeWidth={1.3} strokeDasharray="3 2.5" />}
        {rest && <Ripple at={[51, 42]} r={20} />}
        {[18, 30, 42, 54, 66].map((y) =>
          [30, 41, 51, 61, 72, 83, 93].map((x, c) => {
            const dx = 3.6 * Math.sin(2 * Math.PI * 2 * t - c * 0.9);
            return <circle key={`${x}${y}`} cx={x + dx} cy={y} r={2.2} fill={c === 2 ? PH.blue : "#94a3b8"} />;
          }),
        )}
      </g>
    );
  }
  if (thing === "fan")
    return (
      <>
        <FanTop cx={50} cy={40} r={26} turn={t} t={t} />
        {wrong && <WrongMark x={88} y={20} />}
      </>
    );
  return (
    <>
      <CometPath cx={54} cy={40} rx={38} ry={15} turn={t} t={t} />
      {wrong && <WrongMark x={90} y={20} />}
    </>
  );
}

export function ShmSort() {
  const pass = useGate();
  const [found, setFound] = useSeed<Thing[]>("found", []);
  const [wrong, setWrong] = useSeed<Thing | null>("wrong", null);
  const [on, setOn] = useState<Thing | null>(null);
  const [miss, setMiss] = useState(0);
  const play = useWalk(X9_MS, { steps: false, ease: "linear" });
  const need = X9_THINGS.filter((x) => x.shm).length;
  const done = found.length >= need;
  const tap = (th: (typeof X9_THINGS)[number]) => {
    if (play.running || done || found.includes(th.key)) return;
    setOn(th.key);
    setWrong(null);
    sfx.whoosh(0.3);
    play.start(() => {
      if (th.shm) {
        const next = [...found, th.key];
        setFound(next);
        sfx.pop();
        if (next.length === need) pass("Spring, pendulum, বাতাসের অণু: সবাই দোলে।");
      } else {
        setWrong(th.key);
        setMiss((m) => m + 1);
      }
    });
  };
  return (
    <>
      <div className="mx-auto flex w-full max-w-[22rem] flex-wrap justify-center gap-2">
        {X9_THINGS.map((th) => {
          const playing = play.running && on === th.key;
          const ok = found.includes(th.key);
          const bad = wrong === th.key && !play.running;
          // a wrong one keeps the round it just went, path and all
          const t = playing ? play.t : bad ? 1 : 0;
          return (
            <button
              key={th.key}
              type="button"
              onClick={() => tap(th)}
              disabled={play.running || done}
              className={`flex w-[31%] cursor-pointer flex-col items-center rounded-xl border bg-white px-1 pt-1 pb-1 transition-colors disabled:cursor-default motion-reduce:transition-none ${
                ok ? "border-accent" : bad ? "nudge border-danger/60" : playing ? "border-cat-blue" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <svg viewBox="0 0 100 82" className="block h-auto w-full" role="img" aria-label={th.name}>
                <ThingPic thing={th.key} t={t} rest={ok} wrong={bad} />
              </svg>
              <span className="min-h-8 text-center text-[0.72rem] leading-tight font-semibold text-[#0f1b2d]">{th.name}</span>
            </button>
          );
        })}
      </div>
      <Ticks items={Array.from({ length: need }, (_, i) => [`${i + 1}`, found.length > i] as [string, boolean])} />
      {wrong && !play.running && <Nope key={miss}>{X9_NOPE[wrong]}</Nope>}
      <Task done={done}>কোনগুলো সাম্যবিন্দুর দুই পাশে দুলে দুলে চলে? সরল স্পন্দনের সবগুলোতে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · The closing story scene: টুটুল on the swing again. It climbs to the
// right end and stops there, দ্রুতি 0; rushes through the middle, সবচেয়ে
// জোরে; stops at the left end too. তিথি says what she saw.

export function SwingAnswer({}: Story) {
  const s = useScene(3, [600, 1600, 1600]);
  const k = s.k;
  const deg = [12, AMP, 0, -AMP][k];
  // climbing to an end it slows; falling to the middle it speeds up
  const ease = [SWING_EASE, EASE_OUT_SINE, EASE_IN_SINE, EASE_OUT_SINE][k];
  const [sx, sy] = seatAt(ST.px, ST.py, ST.len, deg);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="টুটুল আবার দোলনায়। ডান প্রান্তে দোলনা এক মুহূর্ত থামে, মাঝখান দিয়ে সবচেয়ে জোরে যায়, বাম প্রান্তে আবার থামে। তিথি দেখছে।">
        <text x={306} y={22} fontSize={10} fontWeight={700} textAnchor="end" fill={PH.ink}>
          নানুবাড়ি
        </text>
        <MangoTree x={46} branchTo={232} by={ST.py - 3} />
        <circle cx={ST.px} cy={ST.py} r={2.4} fill="#d6c29a" />
        <path d={arcD(ST.px, ST.py, ST.len + 2, -AMP, AMP)} stroke="#fff" strokeWidth={1.2} strokeDasharray="4 4" fill="none" opacity={0.8} />
        <Swing px={ST.px} py={ST.py} len={ST.len} deg={deg} glide={1100} ease={ease} />
        <Person who="tithi" x={284} y={150} facing={-1} label arm="hold" mood={k >= 3 ? "happy" : "plain"} />
        <StagePhone x={274} y={106} />
        {(k === 1 || k === 3) && <Tag key={`z${k}`} x={sx + (k === 1 ? 26 : -26)} y={sy - 46} text="দ্রুতি 0" tone="amber" solid pop />}
        {k === 2 && <Tag key="m" x={sx} y={sy + 28} text="সবচেয়ে জোরে" tone="mint" solid pop />}
        {k >= 3 && <Bubble x={284} y={84} side="left" lines={["থামে, তারপর", "দিক বদলায়।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  NanuBariSwing: { a: { k: 0 }, end: {} },
  SwingBet: { start: {}, slow: { bet: 1 }, stops: { bet: 0 } },
  SwingAgain: { start: {}, pulled: { amp: -34 }, done: { amp: -34, trips: 3 } },
  PeriodWatch: { start: {}, measured: { ran: true }, wrong: { ran: true, pick: 0 }, wrong20: { ran: true, pick: 2 }, right: { ran: true, pick: 1 } },
  EverywhereCards: { start: {}, two: { seen: [0, 1] }, done: { seen: [0, 1, 2] } },
  HeartMinute: { start: {}, wrong: { pick: 0 }, right: { pick: 2 } },
  BeatRule: { a: { k: 0 }, end: {} },
  RestPoint: { start: {}, wrong: { pick: 0 }, right: { pick: 2 } },
  FastestPoint: { start: {}, wrong: { pick: 1 }, right: { pick: 2 } },
  CatchStop: { start: {}, miss: { frozen: 10, judged: true }, right: { frozen: 25, caught: ["R"], judged: true }, done: { frozen: 50, caught: ["R", "L"], judged: true } },
  ShmBox: { a: { k: 0 }, b: { k: 1 }, end: {} },
  ShmSort: { start: {}, wrong: { wrong: "fan" }, two: { found: ["spring", "pendulum"] }, done: { found: ["spring", "pendulum", "air"] } },
  SwingAnswer: { top: { k: 1 }, mid: { k: 2 }, end: {} },
};
