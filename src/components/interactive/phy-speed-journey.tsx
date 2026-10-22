"use client";

import { useState } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Ticks, primaryBtn, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { Bicycle, Gauge, PArrow, PH, ROAD, RoadBase, RoadTrace, Ripple, Sheet, Txt, WrongMark, svgPoint, toneHex, useWalk, type PhTone } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 7 — দ্রুতি আর বেগ"
// (src/content/articles/physics_for_high_school/07_speed_velocity.mdx), the
// journey of video EP 07 (physics_9_10/07-speed-velocity/script.md). Book
// §2.5, pp. 40–41.
//
// The spine: one ride, A (বাসার মোড়) → B (বটতলা) in 20 min, two answers,
// 3.33 and 2.5. The reader bets which is right (SpeedBet), settled on the
// last screen: both, for two different quantities. On the way, the video's
// own beats: the 100 m sprint (SprintPace), the বেগ card takes সরণ, a vector
// (VelocityCard), the road in m and s (RoadPace), the speed went up and down,
// read from the time dots (TimeDots), average velocity is 3 km's worth, with a
// direction (VelocityPick), a straight road makes them equal (Straighten), a
// steady ride makes তাৎক্ষণিক = গড় (SteadyRide), and the reader does the ride
// home alone (ReturnRide).
//
// Road canon (phy-kit's ROAD, EP 06's road): A km 0, B km 4 along the road,
// chord AB = 3 km. 20 min = 1200 s. Average speed 4000/1200 = 3.33 m/s,
// average velocity 3000/1200 = 2.5 m/s towards B. The uneven ride is the
// video's scene 6: speed = 3.33 × (1 + 0.5 sin 4πu), a time dot every 1/12 of
// the ride; scene 10's ride is steady, the dots even.

type Story = { story?: boolean };
type P = [number, number];

const RW = ROAD.W;
const RH = ROAD.H + 6;
const KM = ROAD.KM;
const A = ROAD.A;
const B = ROAD.B;
const AVG = 4000 / 1200;
const DEG = 180 / Math.PI;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

// ---------------------------------------------------------------------------
// The rides. u = share of the 20 minutes gone (0…1); U(u) = share of the 4 km
// done; RATE(u) = speed as a share of the average. A time dot drops at every
// u = j/12.

export type Ride = "uneven" | "even" | "speedup";
export const RIDE_U: Record<Ride, (u: number) => number> = {
  uneven: (u) => u + (1 - Math.cos(4 * Math.PI * u)) / (8 * Math.PI),
  even: (u) => u,
  speedup: (u) => 0.5 * u + 0.5 * u * u,
};
export const RIDE_RATE: Record<Ride, (u: number) => number> = {
  uneven: (u) => 1 + 0.5 * Math.sin(4 * Math.PI * u),
  even: () => 1,
  speedup: (u) => 0.5 + u,
};
const rideDots = (r: Ride) => Array.from({ length: 13 }, (_, j) => 4 * RIDE_U[r](j / 12));

/**
 * A rounded chip with a word or a number on it, centred at (x, y). Like
 * phy-kit's Tag, but sized for monospace too: a Latin-only line is set in mono,
 * where a space is as wide as a digit.
 */
const SOFT: Record<PhTone, string> = { mint: PH.mintSoft, amber: PH.amberSoft, blue: PH.blueSoft, red: PH.redSoft, ink: "#f1f5f9", cream: PH.creamSoft };
export function Chip({ x, y, text, tone = "ink", size = 9.5, solid = false, pop = false }: { x: number; y: number; text: string; tone?: PhTone; size?: number; solid?: boolean; pop?: boolean }) {
  const bn = /[ঀ-৿]/.test(text);
  const w = [...text].reduce((a, ch) => a + (bn ? (/[ঀ-৿]/.test(ch) ? 0.6 : /\s/.test(ch) ? 0.3 : 0.56) : 0.62), 0) * size + 14;
  const h = size + 8;
  const c = toneHex(tone);
  return (
    <g className={`pointer-events-none ${pop ? POP : ""}`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={solid ? c : SOFT[tone]} stroke={c} strokeWidth={1.1} />
      <text x={x} y={y + size * 0.36} fontSize={size} textAnchor="middle" fontWeight={700} fill={solid ? "#fff" : tone === "ink" ? PH.ink : c} style={{ fontFamily: bn ? "inherit" : "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
        {text}
      </text>
    </g>
  );
}

// The road sampled every 10 m, for taps on it.
const ROAD_PTS = Array.from({ length: 401 }, (_, i) => ROAD.at(i / 100));
function nearestKm(x: number, y: number) {
  let best = 0;
  let bd = Infinity;
  ROAD_PTS.forEach(([px, py], i) => {
    const d = Math.hypot(px - x, py - y);
    if (d < bd) {
      bd = d;
      best = i / 100;
    }
  });
  return { km: best, d: bd };
}

/** Where the bike's rider sits above the road at `km`: for marks and labels that ride with her. */
const overBike = (km: number, dy = 40): P => {
  const [x, y] = ROAD.at(km);
  return [x, y - dy];
};

/** A bracket over a measured span, x0 → x1, its feet at y: the place a formula chip sits on. */
function Bracket({ x0, x1, y, tone = PH.cream }: { x0: number; x1: number; y: number; tone?: string }) {
  return <path d={`M${x0} ${y}v-4H${x1}v4`} fill="none" stroke={tone} strokeWidth={1.2} strokeLinejoin="round" className={`pointer-events-none ${FADE}`} />;
}

/** তিথি on her bike, on the road at `km`, tilted a little with it. */
export function RoadBike({ km, flip = false, s = 0.78 }: { km: number; flip?: boolean; s?: number }) {
  const [x, y, a] = ROAD.at(km);
  return (
    <g transform={`translate(${x.toFixed(2)} ${(y + 2.5).toFixed(2)}) rotate(${(a * DEG * 0.3).toFixed(2)})`} className="pointer-events-none">
      <Bicycle x={0} y={0} s={s} flip={flip} spin={km * 360} />
    </g>
  );
}

/** An amber time-stamp dot on the road at `km`. */
function TimeDot({ km }: { km: number }) {
  const [x, y] = ROAD.at(km);
  return <circle cx={x} cy={y} r={2.8} fill={PH.amber} stroke="#fff" strokeWidth={1} className={`pointer-events-none ${POP}`} />;
}

/** A clock face; the amber wedge sweeps `frac` of a full turn (an hour, or a minute for a stopwatch). */
export function Dial({ x, y, r = 14, frac }: { x: number; y: number; r?: number; frac: number }) {
  const f = Math.max(0, Math.min(0.9995, frac));
  const a = f * 2 * Math.PI;
  const ex = x + r * Math.sin(a);
  const ey = y - r * Math.cos(a);
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={PH.ink} strokeWidth={1.1} />
      {f > 0.002 && <path d={`M${x} ${y}L${x} ${y - r}A${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}Z`} fill={PH.amberSoft} />}
      {Array.from({ length: 12 }, (_, i) => {
        const b = (i * Math.PI) / 6;
        return <path key={i} d={`M${x + Math.sin(b) * r * 0.78} ${y - Math.cos(b) * r * 0.78}L${x + Math.sin(b) * r} ${y - Math.cos(b) * r}`} stroke={PH.faint} strokeWidth={0.8} />;
      })}
      <path d={`M${x} ${y}L${x + (ex - x) * 0.88} ${y + (ey - y) * 0.88}`} stroke={PH.amber} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={x} cy={y} r={1.6} fill={PH.ink} />
    </g>
  );
}
const clockWord = (sec: number) => (sec < 59.5 ? `${Math.round(sec)} s` : `${Math.round(sec / 60)} min`);

/** On a Gauge's face: a cream tick at the average, and an amber band over where the needle went. */
const gaugePt = (x: number, y: number, r: number, v: number, max: number): P => {
  const a = Math.PI * (1 - clamp01(v / max));
  return [x + Math.cos(a) * r, y - Math.sin(a) * r];
};
function GaugeAvg({ x, y, r, max }: { x: number; y: number; r: number; max: number }) {
  const [x1, y1] = gaugePt(x, y, r - 5, AVG, max);
  const [x2, y2] = gaugePt(x, y, r + 6, AVG, max);
  const [lx, ly] = gaugePt(x, y, r + 13, AVG, max);
  return (
    <g className={`pointer-events-none ${POP}`}>
      <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={PH.cream} strokeWidth={2.4} strokeLinecap="round" />
      <Txt x={lx} y={ly + 2} size={8} color={PH.cream} weight={800}>
        গড়
      </Txt>
    </g>
  );
}
function GaugeBand({ x, y, r, lo, hi, max }: { x: number; y: number; r: number; lo: number; hi: number; max: number }) {
  const [x1, y1] = gaugePt(x, y, r + 5, lo, max);
  const [x2, y2] = gaugePt(x, y, r + 5, hi, max);
  if (hi - lo < 0.05) return null;
  return <path d={`M${x1} ${y1}A${r + 5} ${r + 5} 0 0 1 ${x2} ${y2}`} fill="none" stroke={PH.amber} strokeOpacity={0.5} strokeWidth={3} className={`pointer-events-none ${FADE}`} />;
}

/** The road sheet every road screen stands on: A → B, km stones, names. */
function RoadSheet({ label, trace = 4, sheet, children }: { label: string; trace?: number; sheet?: Partial<Parameters<typeof Sheet>[0]>; children?: React.ReactNode }) {
  return (
    <Sheet w={RW} h={RH} label={label} bg={PH.ground} {...sheet}>
      <RoadBase upTo={4} />
      <RoadTrace km={trace} />
      {children}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: তিথি rides from বাসার মোড় to বটতলা while the
// clock runs 20 min; two answers pop up, and a ?.

export function OneRideTwoAnswers({}: Story) {
  const s = useScene(3, [600, 1800, 1400]);
  const k = s.k;
  const [fr] = useTween([k >= 1 ? 1 / 3 : 0], 1600);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="তিথি সাইকেলে বাসার মোড় থেকে বটতলায় গেলো, বিশ মিনিটে। তারপর দুইটা উত্তর: 3.33 m/s আর 2.5 m/s। মাঝে একটা প্রশ্নবোধক চিহ্ন।">
        <path d="M0 160H320" stroke="#b9b3a8" strokeWidth={12} />
        <path d="M0 160H320" stroke="#fff" strokeWidth={0.8} strokeDasharray="5 6" />
        {[
          [30, "বাসার মোড়"],
          [290, "বটতলা"],
        ].map(([x, name]) => (
          <g key={name as string}>
            <path d={`M${x} 150V122`} stroke={PH.ink} strokeWidth={1.4} />
            <rect x={(x as number) - 24} y={110} width={48} height={13} rx={3} fill="#fff" stroke={PH.ink} strokeOpacity={0.4} />
            <text x={x as number} y={119.5} fontSize={8} fontWeight={700} textAnchor="middle" fill={PH.ink}>
              {name as string}
            </text>
          </g>
        ))}
        <g style={{ transform: `translate(${k >= 1 ? 232 : 92}px, 158px)` }} className="transition-transform duration-[1600ms] ease-in-out motion-reduce:transition-none">
          <Bicycle x={0} y={0} s={1.5} spin={k >= 1 ? 720 : 0} />
        </g>
        <Dial x={160} y={38} r={17} frac={fr} />
        <text x={160} y={70} fontSize={10} fontWeight={700} textAnchor="middle" fill={PH.amber} style={{ fontFamily: "ui-monospace, monospace" }}>
          {k >= 1 ? "20 min" : "0 min"}
        </text>
        {k >= 2 && <Chip x={78} y={44} text="3.33 m/s" tone="ink" size={11} pop />}
        {k >= 2 && <Chip x={242} y={44} text="2.5 m/s" tone="ink" size={11} pop />}
        {k >= 3 && (
          <g className={POP}>
            <Txt x={160} y={102} size={24} color={PH.amber} weight={800}>
              ?
            </Txt>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: which answer is right? The pick lights its chip(s) on
// the road with a ring, the ? stays. Not marked.

const X1_CHIPS: { at: P; text: string }[] = [
  { at: [56, 26], text: "3.33 m/s" },
  { at: [204, 26], text: "2.5 m/s" },
];
const X1_BET = ["3.33 m/s ঠিক", "2.5 m/s ঠিক", "দুটোই ঠিক"];
const X1_LIT = [[0], [1], [0, 1]];

export function SpeedBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  return (
    <>
      <RoadSheet label="বাসার মোড় A থেকে বটতলা B, আঁকাবাঁকা রাস্তা। সময় 20 min। দুইটা উত্তর: 3.33 m/s আর 2.5 m/s।" sheet={{ className: "max-w-[21rem]" }}>
        <RoadBike km={4} />
        <Dial x={130} y={26} r={13} frac={1 / 3} />
        <Txt x={130} y={52} size={9} color={PH.amber} weight={700}>
          20 min
        </Txt>
        {X1_CHIPS.map((c, i) => {
          const on = bet !== null && X1_LIT[bet].includes(i);
          return (
            <g key={`${i}${on}`} opacity={bet !== null && !on ? 0.3 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
              {on && <rect x={c.at[0] - 34} y={c.at[1] - 13} width={68} height={26} rx={13} fill="none" stroke={PH.blue} strokeWidth={1.4} strokeDasharray="3 2.5" className={POP} />}
              <Chip x={c.at[0]} y={c.at[1]} text={c.text} tone={on ? "blue" : "ink"} solid={on} size={10} pop={on} />
            </g>
          );
        })}
        <Txt x={130} y={80} size={22} color={PH.amber} weight={800}>
          ?
        </Txt>
      </RoadSheet>
      <div className="mt-3 grid gap-2">
        {X1_BET.map((o, i) => (
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
      <Task done={bet !== null}>একই যাত্রা, দুইটা উত্তর। কোনটা ঠিক? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The 100 m sprint. The reader picks how far তিথি runs each second; she
// runs at that pace on the stopwatch's clock (a steady pace, so a linear
// clock), and an amber tick drops behind her each second. Only 5 m a second
// ends on 100 m at 20 s.

const SW = 300;
const SH = 158;
const TRACK_Y = 104;
const mx = (m: number) => 30 + m * 2.4;
const X2_RATES = [0.2, 20, 5];
const X2_RIGHT = 2;
const X2_NOPE = ["20 s শেষ, তিথি গেলো মাত্র 4 m। 20 ÷ 100 করলে ভাগটা উল্টে যায়।", "মাত্র 5 s-এই 100 m শেষ! কিন্তু তিথির লেগেছিল পুরো 20 s।", ""];
const sprintEnd = (r: number) => Math.min(20, Math.ceil(100 / r - 1e-9));
/** Real time per stopwatch second: the 20 s sprint plays in 1.9 s. */
const X2_MS_PER_S = 95;

/** তিথি running: brick-red kameez, cream salwar, two braids; her legs swing with the ground she covers. */
function Runner({ x, stride, run }: { x: number; stride: number; run: boolean }) {
  const sw = run ? Math.sin(stride) * 26 : 0;
  return (
    <g transform={`translate(${x.toFixed(2)} ${TRACK_Y - 2}) scale(1.35)`} className="pointer-events-none">
      <ellipse cy={1.6} rx={8} ry={1.5} fill={PH.ink} opacity={0.12} />
      <path d="M0 -13L0 0" transform={`rotate(${sw} 0 -13)`} stroke="#e7dcc6" strokeWidth={3.2} strokeLinecap="round" />
      <path d="M0 -13L0 0" transform={`rotate(${-sw} 0 -13)`} stroke="#f1e9da" strokeWidth={3.2} strokeLinecap="round" />
      <rect x={-4.5} y={-27} width={9} height={15} rx={3} fill="#b8473a" />
      <path d="M0 -25L0 -15" transform={`rotate(${-sw * 1.4} 0 -25)`} stroke="#c08458" strokeWidth={2.6} strokeLinecap="round" />
      <circle cy={-32} r={5} fill="#c08458" />
      <path d="M-5 -33q0 -6 5 -6t5 6q-2 -3 -5 -3t-5 3Z" fill="#1c1917" />
      <path d="M-4.5 -32q-3 3 -2 7" fill="none" stroke="#1c1917" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={-6.2} cy={-26} r={1.1} fill="#f5ecd7" />
    </g>
  );
}

/** A stopwatch sticker: a Dial with a crown and a side button, one ink line. */
function Stopwatch({ x, y, r = 17, sec }: { x: number; y: number; r?: number; sec: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 3.5} y={y - r - 6} width={7} height={5} rx={1.2} fill="#c9a56a" stroke={PH.ink} strokeWidth={1} />
      <path d={`M${x + r * 0.62} ${y - r * 0.86}l3 -3`} stroke={PH.ink} strokeWidth={2.4} strokeLinecap="round" />
      <Dial x={x} y={y} r={r} frac={sec / 60} />
    </g>
  );
}

export function SprintPace() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // Each pick runs on the same stopwatch, so its clock's length follows the pick: two clocks.
  const full = useWalk(20 * X2_MS_PER_S, { ease: "linear" });
  const quick = useWalk(sprintEnd(X2_RATES[1]) * X2_MS_PER_S, { ease: "linear" });
  const walk = pick === 1 ? quick : full;
  const go = (i: number) => {
    if (full.running || quick.running) return;
    setPick(i);
    sfx.whistle(0.35);
    (i === 1 ? quick : full).start(() => {
      if (i === X2_RIGHT) {
        sfx.chime();
        pass("প্রতি সেকেন্ডে 5 m: 100 ÷ 20।");
      } else setMiss((m) => m + 1);
    });
  };
  const rate = pick === null ? 0 : X2_RATES[pick];
  const end = pick === null ? 0 : sprintEnd(rate);
  const sec = pick === null ? 0 : walk.running ? walk.t * end : end;
  const ticks = Math.floor(sec + 1e-6);
  const dist = Math.min(100, rate * sec);
  const right = pick === X2_RIGHT && !walk.running;
  const wrong = pick !== null && pick !== X2_RIGHT && !walk.running;
  const fmt = (m: number) => (Number.isInteger(m) ? `${m}` : m.toFixed(1));
  return (
    <>
      <Sheet w={SW} h={SH} label="স্কুলের মাঠে 100 m-এর সোজা track। তিথি দৌড়াবে, উপরে stopwatch। প্রতি সেকেন্ডে track-এ একটা amber দাগ পড়ে।">
        <path d={`M${mx(0)} ${TRACK_Y + 4}H${mx(100)}`} stroke="#d6d3cb" strokeWidth={8} strokeLinecap="round" />
        {[0, 50, 100].map((m) => (
          <g key={m}>
            <path d={`M${mx(m)} ${TRACK_Y - 3}V${TRACK_Y + 9}`} stroke={m === 100 && right ? PH.mint : PH.mute} strokeWidth={m === 100 && right ? 2.2 : 1.4} />
            <Txt x={mx(m)} y={TRACK_Y + 22} size={9} color={PH.mute}>
              {`${m} m`}
            </Txt>
          </g>
        ))}
        {/* a tick drops behind her every second; on the right answer they light mint, one after another */}
        {Array.from({ length: ticks }, (_, i) => (
          <path
            key={i}
            d={`M${mx(Math.min(100, rate * (i + 1)))} ${TRACK_Y + 1}V${TRACK_Y + 7}`}
            strokeWidth={1.6}
            style={{ stroke: right ? PH.mint : PH.amber, transitionDelay: right ? `${i * 35}ms` : "0ms" }}
            className="pointer-events-none transition-[stroke] duration-300 motion-reduce:transition-none"
          />
        ))}
        {right && <Ripple at={[mx(100), TRACK_Y - 22]} r={24} />}
        <Runner x={mx(dist)} stride={(dist / 2.5) * Math.PI} run={walk.running} />
        {wrong && <WrongMark x={Math.min(mx(dist) + 18, SW - 8)} y={TRACK_Y - 50} />}
        <Stopwatch x={150} y={28} sec={sec} />
        <Txt x={174} y={33} size={13} anchor="start" color={PH.amber} weight={700}>
          {`${ticks} s`}
        </Txt>
        {right && <Bracket x0={mx(0)} x1={mx(100)} y={136} />}
        {right && <Chip x={150} y={147} text="100 m ÷ 20 s = 5 m/s" tone="cream" size={9} solid pop />}
      </Sheet>
      <div className="mt-2 text-center text-sm text-muted">
        সময় <span className="font-mono text-foreground">{ticks} s</span> · দূরত্ব <span className="font-mono text-foreground">{fmt(Math.min(100, rate * ticks))} m</span>
      </div>
      <div className="mt-2 text-center text-sm font-semibold">প্রতি সেকেন্ডে কতটা?</div>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {X2_RATES.map((r, i) => (
          <Choice key={r} n={i} look={pick === i && !walk.running ? (i === X2_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="font-mono">{r} m</span>
          </Choice>
        ))}
      </div>
      {wrong && <Nope key={miss}>{X2_NOPE[pick]}</Nope>}
      <Task done={right}>তিথি 100 m দৌড়ালো 20 s-এ। প্রতি সেকেন্ডে কতটা? বেছে নিন, তিথি সেই হারে দৌড়াবে।</Task>
    </>
  );
}

// 2½ · Figure for screen 2's explanation: the sum, then the দ্রুতি card, its
// unit and its dimension, one at a time.

const S2_SAY = ["একশো ভাগ বিশ: প্রতি সেকেন্ডে 5 m।", "সময়ের সাথে দূরত্ব যে হারে বাড়ে: দ্রুতি, লিখি v।", "একক মিটার পার সেকেন্ড, m/s।", "মাত্রা LT⁻¹।"];

export function SpeedCard({}: Story) {
  const s = useScene(3, [600, 2200, 1500]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S2_SAY[k]}</span>}>
      <Sheet w={260} h={116} label="দ্রুতির card: 100 m ভাগ 20 s সমান 5 m/s। দ্রুতি v সমান দূরত্ব ভাগ সময়। একক m/s, মাত্রা LT⁻¹।" className="max-w-[18rem]">
        <Txt x={130} y={24} size={12} weight={700}>
          100 m ÷ 20 s = 5 m/s
        </Txt>
        {k >= 1 && (
          <g className={FADE}>
            <Txt x={58} y={70} size={14} color={PH.cream} weight={800}>
              দ্রুতি
            </Txt>
            <text x={106} y={71} fontSize={16} fontStyle="italic" fontWeight={700} textAnchor="middle" fill={PH.ink} style={{ fontFamily: "ui-monospace, monospace" }}>
              v =
            </text>
            <Txt x={180} y={60} size={12} color={PH.cream} weight={700}>
              দূরত্ব
            </Txt>
            <path d="M148 66H212" stroke={PH.ink} strokeWidth={1.3} />
            <Txt x={180} y={81} size={12} color={PH.amber} weight={700}>
              সময়
            </Txt>
          </g>
        )}
        {k >= 2 && <Chip x={78} y={102} text="একক: m/s" tone="ink" pop />}
        {k >= 3 && <Chip x={186} y={102} text="মাত্রা: [v] = LT⁻¹" tone="ink" pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · The বেগ card: "বেগ = ? / সময়". The reader picks what goes on top: the
// dotted path (দূরত্ব), the arrow (সরণ) or a clock (সময়). It flies into the
// slot; দূরত্ব turns it into the দ্রুতি card, সময় ÷ সময় measures nothing, and
// সরণ lifts its arrowhead onto the v: a vector.

type Top = "dist" | "disp" | "time";
const X3_OPTS: Top[] = ["dist", "disp", "time"];
const X3_RIGHT: Top = "disp";
const X3_NAME: Record<Top, string> = { dist: "দূরত্ব", disp: "সরণ", time: "সময়" };
const X3_NOPE: Record<Top, string> = {
  dist: "card-টা দ্রুতির হয়ে গেলো: দূরত্ব ভাগ সময়। বেগ মাপে সরণ কত তাড়াতাড়ি বদলায়।",
  disp: "",
  time: "সময় ভাগ সময়: কিছুই মাপা হলো না। উপরে বসে সেটা, যেটা সময়ের সাথে বদলায়।",
};

/** The three things that could sit on top of the fraction, drawn around (0, 0). */
function TopIcon({ kind, tone }: { kind: Top; tone?: "mint" | "red" }) {
  if (kind === "dist") return <path d="M-26 2C-18 -12 -8 -12 0 2S18 16 26 2" stroke={PH.cream} strokeWidth={3} strokeDasharray="0.1 4.2" strokeLinecap="round" fill="none" className="pointer-events-none" />;
  if (kind === "disp") return <PArrow a={[-26, 2]} b={[26, 2]} tone={tone ?? "mint"} w={2.6} tell="সরণ: মান আর দিক" />;
  return (
    <g className="pointer-events-none">
      <circle r={9} cy={1} fill="#fff" stroke={PH.amber} strokeWidth={1.6} />
      <path d="M0 1V-5M0 1L4 3" stroke={PH.amber} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

export function VelocityCard() {
  const pass = useGate();
  const [pick, setPick] = useSeed<Top | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(650, { steps: false, ease: "linear" });
  const choose = (t: Top) => {
    if (walk.running) return;
    setPick(t);
    sfx.whoosh(0.3);
    walk.start(() => {
      if (t === X3_RIGHT) {
        sfx.chime();
        pass("সরণ vector, তাই বেগও vector।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const landed = pick !== null && !walk.running;
  const right = landed && pick === X3_RIGHT;
  const flyY = 124 + (30 - 124) * (1 - (1 - t) ** 2);
  return (
    <>
      <Sheet w={300} h={116} label="বেগের card: বেগ v সমান, ভাগের উপরের ঘর ফাঁকা, নিচে সময়। নিচ থেকে একটা জিনিস উড়ে এসে ফাঁকা ঘরে বসবে।">
        <Txt x={58} y={66} size={17} color={landed && pick === "dist" ? PH.red : PH.mint} weight={800}>
          বেগ
        </Txt>
        {landed && pick === "dist" && <path d="M38 61H78" stroke={PH.red} strokeWidth={2} className={FADE} />}
        <text x={108} y={67} fontSize={18} fontStyle="italic" fontWeight={700} textAnchor="middle" fill={PH.ink} style={{ fontFamily: "ui-monospace, monospace" }}>
          v
        </text>
        {right && <Ripple at={[205, 30]} r={30} />}
        {right && (
          <g className={POP}>
            <path d="M100 44H114" stroke={PH.mint} strokeWidth={1.8} strokeLinecap="round" />
            <path d="M118 44L112 40.5V47.5Z" fill={PH.mint} />
          </g>
        )}
        <text x={134} y={66} fontSize={16} fontWeight={700} textAnchor="middle" fill={PH.ink}>
          =
        </text>
        {pick === null && <rect x={168} y={18} width={74} height={32} rx={6} fill="none" stroke={PH.blue} strokeWidth={1.3} strokeDasharray="3 3" />}
        {pick === null && (
          <Txt x={205} y={39} size={13} color={PH.blue} weight={800}>
            ?
          </Txt>
        )}
        <path d="M158 58H252" stroke={PH.ink} strokeWidth={1.4} />
        <g transform="translate(180 80)">
          <TopIcon kind="time" />
        </g>
        <Txt x={212} y={84} size={12} color={PH.amber} weight={700}>
          সময়
        </Txt>
        {pick && (
          <g transform={`translate(205 ${flyY.toFixed(1)})`} opacity={clamp01(t * 3)}>
            <TopIcon kind={pick} tone={pick === X3_RIGHT ? "mint" : "red"} />
          </g>
        )}
        {landed && (
          <g className={FADE}>
            <Txt x={205} y={53} size={9} color={pick === X3_RIGHT ? PH.mint : PH.red} weight={700}>
              {X3_NAME[pick]}
            </Txt>
          </g>
        )}
        {landed && pick === "dist" && <Chip x={58} y={90} text="এটা তো দ্রুতি" tone="red" pop />}
        {landed && pick === "dist" && <Chip x={108} y={26} text="দিক?" tone="red" pop />}
        {landed && pick === "time" && <Chip x={78} y={92} text="কিছুই মাপলো না" tone="red" pop />}
        {right && <Chip x={108} y={24} text="vector" tone="mint" solid pop />}
        {right && <Chip x={66} y={92} text="মান + দিক" tone="mint" pop />}
      </Sheet>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X3_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === o && !walk.running ? (o === X3_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(o)}>
            <span className="flex flex-col items-center gap-0.5">
              <svg viewBox="-32 -14 64 28" className="h-6 w-14" aria-hidden="true">
                <TopIcon kind={o} />
              </svg>
              <span className="text-sm">{X3_NAME[o]}</span>
            </span>
          </Choice>
        ))}
      </div>
      {landed && pick !== X3_RIGHT && <Nope key={miss}>{X3_NOPE[pick]}</Nope>}
      <Task done={right}>বেগের card বানান: সময়ের উপরে কোনটা বসবে? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The road in metres and seconds: A → B is 4 km of road in 20 min. The
// reader picks the sum; তিথি rides at that speed while the clock runs. Only
// 4000 ÷ 1200 brings her to B exactly as the clock hits 20 min.

const X4_OPTS = [
  { sum: "4 ÷ 20", v: 0.2, say: "0.2" },
  { sum: "4000 ÷ 1200", v: AVG, say: "3.33" },
  { sum: "4000 ÷ 20", v: 200, say: "200" },
];
const X4_RIGHT = 1;
const X4_NOPE = ["20 মিনিট শেষ, তিথি গেলো মাত্র 0.24 km। 4 ÷ 20 হলো km পার মিনিট, m/s না।", "", "মাত্র 20 s-এই B! km-কে মিটারে নিলেন, কিন্তু মিনিটকে সেকেন্ডে নেননি।"];

export function RoadPace() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // A steady speed: the bike and the clock both run linear.
  const walk = useWalk(2200, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pedal();
    walk.start(() => {
      if (i === X4_RIGHT) {
        sfx.chime();
        pass("4000 m ÷ 1200 s = 3.33 m/s.");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const v = pick === null ? 0 : X4_OPTS[pick].v;
  const tEnd = pick === null ? 0 : Math.min(1200, 4000 / v);
  const time = tEnd * t;
  const km = Math.min(4, (v * time) / 1000);
  const right = pick === X4_RIGHT && !walk.running;
  const wrong = pick !== null && pick !== X4_RIGHT && !walk.running;
  const [lx, ly] = overBike(km, 42);
  return (
    <>
      <RoadSheet label="A থেকে B, পথ ধরে 4 km। সাইকেলের মাথায় কত km গেলো, উপরে ডানে ঘড়ি। তিথি বেছে নেওয়া দ্রুতিতে চালাবে।" trace={km} sheet={{ className: "max-w-[19rem]" }}>
        <RoadBike km={km} />
        {!right && (
          <Txt x={lx} y={ly} size={10.5} color={PH.cream} weight={700}>
            {`${km.toFixed(2)} km`}
          </Txt>
        )}
        {wrong && <WrongMark x={lx + 32} y={ly + 4} />}
        <Dial x={234} y={24} r={13} frac={time / 3600} />
        <Txt x={234} y={50} size={10} color={PH.amber} weight={700}>
          {clockWord(time)}
        </Txt>
        {right && <Ripple at={B} />}
        {right && <Chip x={B[0] - 14} y={ly - 4} text="20 min-এ ঠিক B" tone="mint" pop />}
      </RoadSheet>
      <div className="mt-3 grid gap-2">
        {X4_OPTS.map((o, i) => (
          <Choice key={o.sum} n={i} look={pick === i && !walk.running ? (i === X4_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="font-mono">
              {o.sum} = {o.say} m/s
            </span>
          </Choice>
        ))}
      </div>
      {wrong && <Nope key={miss}>{X4_NOPE[pick]}</Nope>}
      <Task done={right}>পথ 4 km, সময় 20 মিনিট। m/s-এ কত? বেছে নিন, তিথি সেই দ্রুতিতে চালাবে।</Task>
    </>
  );
}

// 4½ · Figure for screen 4's explanation: 4 km into metres, 20 min into
// seconds, then the division.

const S4_SAY = ["পথ ধরে 4 km, মানে 4000 m।", "20 মিনিট, মানে 1200 সেকেন্ড।", "চার হাজার ভাগ বারোশো: 3.33 m/s।"];

export function UnitSwap({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S4_SAY[k]}</span>}>
      <Sheet w={260} h={100} label="4 km সমান 4000 m। 20 min সমান 20 গুণ 60 s, মানে 1200 s। 4000 m ভাগ 1200 s সমান 3.33 m/s।" className="max-w-[18rem]">
        <g className={POP}>
          <Txt x={130} y={26} size={12} color={PH.cream} weight={700}>
            4 km = 4000 m
          </Txt>
        </g>
        {k >= 1 && (
          <g className={POP}>
            <Txt x={130} y={52} size={12} color={PH.amber} weight={700}>
              20 min = 20 × 60 s = 1200 s
            </Txt>
          </g>
        )}
        {k >= 2 && <Chip x={130} y={80} text="4000 m ÷ 1200 s = 3.33 m/s" tone="cream" size={11} solid pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · Average speed. The reader rides the uneven ride of the video's scene 6:
// the needle goes up and down, and an amber dot drops at equal times. Then
// they tap the gap where তিথি rode fastest: the widest one. A tap plays that
// stretch with the needle; a narrow gap reads low.

const X5_DOTS = rideDots("uneven");
const X5_GAP = X5_DOTS.slice(1).map((d, j) => d - X5_DOTS[j]);
const X5_MAX = Math.max(...X5_GAP);
const GX = 224;
const GY = 46;
const GR = 22;
const GMAX = 6;
const gapSpeed = (g: number) => (X5_GAP[g] * 1000) / 100;

export function TimeDots() {
  const pass = useGate();
  const [rode, setRode] = useSeed("rode", false);
  const [gap, setGap] = useSeed<number | null>("gap", null);
  const [miss, setMiss] = useState(0);
  // The clock is time itself (u), so it runs linear; the uneven speed lives in RIDE_U.
  const rideW = useWalk(2400, { steps: false, ease: "linear" });
  const gapW = useWalk(900, { steps: false, ease: "linear" });
  const running = rideW.running || gapW.running;
  const isFast = (g: number) => X5_GAP[g] >= X5_MAX * 0.99;
  const won = gap !== null && isFast(gap) && !running;
  const ride = () => {
    if (running) return;
    setGap(null);
    sfx.pedal();
    rideW.start(() => setRode(true));
  };
  const tap = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!rode || running || won) return;
    const [x, y] = svgPoint(e, RW, RH);
    const near = nearestKm(x, y);
    if (near.d > 14) return;
    const g = Math.max(0, Math.min(11, X5_DOTS.findIndex((d) => d > near.km) - 1));
    setGap(g);
    sfx.tap();
    gapW.start(() => {
      if (isFast(g)) {
        sfx.chime();
        pass("dot যত ফাঁকা, তিথি তত জোরে।");
      } else setMiss((m) => m + 1);
    });
  };
  let km = 0;
  let speed = 0;
  let shown = 0;
  if (rideW.running) {
    const u = rideW.t;
    km = 4 * RIDE_U.uneven(u);
    speed = AVG * RIDE_RATE.uneven(u);
    shown = Math.floor(u * 12 + 1e-6) + 1;
  } else if (gap !== null) {
    const f = gapW.running ? gapW.t : 1;
    const u = (gap + f) / 12;
    km = 4 * RIDE_U.uneven(u);
    speed = gapW.running ? AVG * RIDE_RATE.uneven(u) : gapSpeed(gap);
    shown = 13;
  } else if (rode) {
    km = 4;
    shown = 13;
  }
  const nope =
    gap === null ? "" : gapSpeed(gap) > 4 ? `এই ফাঁকে needle ${gapSpeed(gap).toFixed(2)} m/s। জোরে, তবে এর পাশেই dot আরও ফাঁকা।` : `এই ফাঁকে needle মাত্র ${gapSpeed(gap).toFixed(2)} m/s। dot দুটো কাছাকাছি: একই সময়ে অল্প পথ।`;
  return (
    <>
      <RoadSheet
        label="A থেকে B, তিথির সাইকেল, উপরে ডানে speedometer। চলার সময় সমান সময় পরপর রাস্তায় একটা করে amber dot পড়ে।"
        trace={rideW.running ? km : rode ? 4 : 0}
        sheet={{ onPointerDown: tap, className: `max-w-[22rem] ${rode && !won ? "cursor-pointer" : ""}` }}
      >
        {gap !== null && <path d={ROAD.d(X5_DOTS[gap], X5_DOTS[gap + 1])} stroke={isFast(gap) ? PH.mint : PH.amber} strokeOpacity={0.5} strokeWidth={12} strokeLinecap="round" fill="none" className="pointer-events-none" />}
        {X5_DOTS.slice(0, shown).map((d, j) => (
          <TimeDot key={j} km={d} />
        ))}
        {won && <Ripple at={ROAD.at((X5_DOTS[gap] + X5_DOTS[gap + 1]) / 2).slice(0, 2) as P} r={22} />}
        <RoadBike km={km} />
        {gap !== null && !isFast(gap) && !running && <WrongMark x={overBike(km)[0] + 18} y={overBike(km)[1] + 6} />}
        <Gauge x={GX} y={GY} r={GR} v={speed} max={GMAX} digits={2} settle={!running} />
      </RoadSheet>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" className={`${primaryBtn} h-9! px-4!`} disabled={running || won} onClick={ride}>
          {rode ? "আবার চালান" : "চালান"}
        </button>
        <span className="text-sm text-muted">সমান সময় পরপর একটা dot।</span>
      </div>
      <Ticks
        items={[
          ["চালানো", rode],
          ["সবচেয়ে জোরে", won],
        ]}
      />
      {gap !== null && !isFast(gap) && !running && <Nope key={miss}>{nope}</Nope>}
      <Task done={won}>চালিয়ে দেখুন। তারপর যে ফাঁকে তিথি সবচেয়ে জোরে চালিয়েছে, রাস্তার সেখানে tap করুন।</Task>
    </>
  );
}

// 5½ · Figure for screen 5's explanation: the needle high, then low, then the
// average mark and where it comes from.

const S5_SAY = ["কোথাও জোরে চালিয়েছে।", "কোথাও আস্তে চালিয়েছে।", "গড় দ্রুতি: মোট দূরত্ব ভাগ মোট সময়।"];
const S5_V = [AVG * 1.5, AVG * 0.5, AVG];

export function AvgNeedle({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  const [v] = useTween([S5_V[k]], 700);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <Sheet w={240} h={122} label="তিথির speedometer। needle একবার 5 m/s-এ, একবার 1.67 m/s-এ, শেষে গড়ের দাগে 3.33 m/s। গড় সমান 4000 m ভাগ 1200 s।" className="max-w-[16rem]">
        <Gauge x={120} y={76} r={44} v={v} max={GMAX} digits={2} />
        {k >= 2 && <GaugeAvg x={120} y={76} r={44} max={GMAX} />}
        {k >= 2 && <Chip x={120} y={108} text="4000 m ÷ 1200 s" tone="cream" pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · Average velocity. The reader picks তিথি's average velocity; a hollow
// dot then goes straight from A at that velocity for 20 min. 3.33 overshoots
// B by 1 km; 2.5 with no direction could end anywhere 3 km from A; 2.5 towards
// B lands on B.

const X6_OPTS = ["3.33 m/s, B-এর দিকে", "2.5 m/s", "2.5 m/s, B-এর দিকে"];
const X6_RIGHT = 2;
const X6_NOPE = ["সোজা 4 km গিয়ে B ছাড়িয়ে গেলো। 4 km তো আঁকাবাঁকা পথের দৈর্ঘ্য, A থেকে B সোজা মাত্র 3 km।", "দিক নেই, তাই A থেকে 3 km দূরের যেকোনো দিকে যেতে পারে। বেগ vector: দিকও বলতে হয়।", ""];
const X6_FAN = [-58, -32, -12, 14, 180];

function Ghost({ at, tone }: { at: P; tone: "mint" | "red" }) {
  return <circle cx={at[0]} cy={at[1]} r={4} fill="#fff" stroke={tone === "mint" ? PH.mint : PH.red} strokeWidth={1.8} className="pointer-events-none" />;
}

export function VelocityPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // A constant velocity for 20 min: the dot goes straight at an even pace, so the clock is linear.
  const walk = useWalk(1700, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.4);
    walk.start(() => {
      if (i === X6_RIGHT) {
        sfx.chime();
        pass("গড় বেগ 2.5 m/s, B-এর দিকে।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const right = pick === X6_RIGHT && !walk.running;
  const done = pick !== null && !walk.running;
  return (
    <>
      <RoadSheet label="A থেকে B আঁকাবাঁকা পথ, তিথি B-তে। A থেকে B সোজা তীর, সরণ 3 km। বেছে নেওয়া বেগে A থেকে সোজা 20 মিনিট চললে কোথায় পৌঁছায়, একটা ফাঁপা বিন্দু দেখায়।" sheet={{ className: "max-w-[20rem]" }}>
        <RoadBike km={4} />
        <PArrow a={A} b={B} tone="mint" w={2} opacity={right ? 0 : 0.35} tell={right ? false : "সরণ 3 km, B-এর দিকে"} />
        <Dial x={234} y={24} r={13} frac={(t * 20) / 60} />
        <Txt x={234} y={50} size={10} color={PH.amber} weight={700}>
          {`${Math.round(t * 20)} min`}
        </Txt>
        {pick === 0 && t > 0.03 && (
          <g>
            <PArrow a={A} b={[A[0] + 4 * KM * t, A[1]]} tone="red" tell={done ? "3.33 m/s, B-এর দিকে" : false} />
            <Ghost at={[A[0] + 4 * KM * t, A[1]]} tone="red" />
            {done && <WrongMark x={Math.min(A[0] + 4 * KM + 2, RW - 8)} y={A[1] - 10} />}
          </g>
        )}
        {pick === 1 &&
          t > 0.03 &&
          X6_FAN.map((deg) => {
            const r = (deg * Math.PI) / 180;
            const tip: P = [A[0] + Math.cos(r) * 3 * KM * t, A[1] + Math.sin(r) * 3 * KM * t];
            return (
              <g key={deg}>
                <PArrow a={A} b={tip} tone="red" w={1.8} dashed tell={done ? "2.5 m/s, দিক?" : false} />
                <Ghost at={tip} tone="red" />
                {done && tip[0] > 8 && tip[1] > 8 && <WrongMark x={tip[0] + 9} y={tip[1] - 5} size={11} />}
              </g>
            );
          })}
        {pick === 2 && t > 0.03 && (
          <g>
            <PArrow a={A} b={[A[0] + 3 * KM * t, A[1]]} tone={right ? "mint" : "blue"} w={3} tell={done ? "2.5 m/s, B-এর দিকে" : false} />
            <Ghost at={[A[0] + 3 * KM * t, A[1]]} tone="mint" />
          </g>
        )}
        {right && <Ripple at={B} />}
        {right && <Bracket x0={A[0]} x1={B[0]} y={76} tone={PH.mint} />}
        {right && <Chip x={(A[0] + B[0]) / 2} y={60} text="3000 m ÷ 1200 s = 2.5 m/s" tone="mint" solid pop />}
      </RoadSheet>
      <div className="mt-3 grid gap-2">
        {X6_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && !walk.running ? (i === X6_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== X6_RIGHT && !walk.running && <Nope key={miss}>{X6_NOPE[pick]}</Nope>}
      <Task done={right}>তিথির গড় বেগ কত? বেছে নিন: সেই বেগে A থেকে 20 মিনিট সোজা চললে কোথায় পৌঁছায়, দেখবেন।</Task>
    </>
  );
}

// 6½ · Figure for screen 6's explanation: the two chips stacked; the dotted
// path glows (চালিয়েছে 4 km), then the short arrow (সরেছে 3 km).

const S6_SAY = ["গড় বেগ গড় দ্রুতির চেয়ে কম।", "আঁকাবাঁকা পথে তিথি চালিয়েছে অনেকটা: 4 km।", "কিন্তু সরেছে কম: 3 km।"];

export function TwoChips({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S6_SAY[k]}</span>}>
      <RoadSheet label="উপরে দুই chip: গড় দ্রুতি 3.33 m/s, গড় বেগ 2.5 m/s। আঁকাবাঁকা পথ 4 km জ্বলে ওঠে, তারপর সোজা তীর 3 km।" sheet={{ className: "max-w-[18rem]" }}>
        {k >= 1 && <path d={ROAD.d(0, 4)} stroke={PH.cream} strokeOpacity={0.35} strokeWidth={8} strokeLinecap="round" fill="none" className={`pointer-events-none ${FADE}`} />}
        <PArrow a={A} b={B} tone="mint" w={k >= 2 ? 3.6 : 2.2} tell="সরণ 3 km, B-এর দিকে" />
        <Chip x={62} y={20} text="গড় দ্রুতি 3.33 m/s" tone="cream" solid />
        <Chip x={62} y={41} text="গড় বেগ 2.5 m/s" tone="mint" solid />
        {k >= 1 && <Chip x={192} y={74} text="চালিয়েছে 4 km" tone="cream" pop />}
        {k >= 2 && <Chip x={150} y={106} text="সরেছে 3 km" tone="mint" pop />}
      </RoadSheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · The straight road. The reader drags the slider and the road pulls
// straight between A and B; the dotted path shrinks to the arrow, and the two
// averages meet at 2.5 m/s.

const X7_N = 240;
function bentRoad(f: number) {
  const pts: P[] = [];
  for (let i = 0; i <= X7_N; i++) {
    const s = i / X7_N;
    const [x, y] = ROAD.at(4 * s);
    pts.push([x + (A[0] + (B[0] - A[0]) * s - x) * f, y + (A[1] - y) * f]);
  }
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const d = "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L");
  return { d, km: f < 0.005 ? 4 : f > 0.995 ? 3 : len / KM };
}

export function Straighten() {
  const pass = useGate();
  const [flat, setFlat] = useSeed("flat", 0);
  const f = flat / 100;
  const { d, km } = bentRoad(f);
  const done = flat >= 100;
  const vs = (km * 1000) / 1200;
  const change = (n: number) => {
    if (done) return;
    const next = n >= 98 ? 100 : n;
    setFlat(next);
    if (next === 100) {
      sfx.chime();
      pass("সোজা পথে দূরত্ব = সরণ।");
    }
  };
  return (
    <>
      <Sheet w={RW} h={RH} label="A থেকে B রাস্তা, slider টানলে রাস্তা সোজা হয়। দাগ দেওয়া পথ আর সোজা তীর পাশাপাশি।" bg={PH.ground}>
        <path d={d} stroke="#d6d3cb" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" className="pointer-events-none" />
        <path d={d} stroke={PH.cream} strokeWidth={3} strokeDasharray="0.1 4.5" strokeLinecap="round" fill="none" className="pointer-events-none" />
        {[1, 2, 3].map((s) => {
          const [x, y, a] = ROAD.at(s);
          const nx = -Math.sin(a) * 10;
          const ny = Math.cos(a) * 10;
          return (
            <g key={s} opacity={clamp01(1 - f * 4)} className="pointer-events-none">
              <rect x={x + nx - 4} y={y + ny - 5} width={8} height={9} rx={2.5} fill="#fff" stroke="#a8a29e" strokeWidth={0.8} />
              <Txt x={x + nx} y={y + ny + 2.2} size={6} color={PH.mute} weight={700}>
                {`${s}`}
              </Txt>
            </g>
          );
        })}
        <PArrow a={[A[0], A[1] - (done ? 7 : 0)]} b={[B[0], B[1] - (done ? 7 : 0)]} tone="mint" w={2.4} tell="সরণ 3 km, B-এর দিকে" />
        {(
          [
            [A, "A", ROAD.NAMES.A],
            [B, "B", ROAD.NAMES.B],
          ] as const
        ).map(([p, n, name]) => (
          <g key={n} className="pointer-events-none">
            <circle cx={p[0]} cy={p[1]} r={3.6} fill={PH.ink} />
            <Txt x={p[0]} y={p[1] + 18} size={10} weight={800}>
              {n}
            </Txt>
            <Txt x={p[0]} y={p[1] + 28} size={7.5} color={PH.mute}>
              {name}
            </Txt>
          </g>
        ))}
        {done && <Chip x={118} y={60} text="দূরত্ব = সরণ = 3 km" tone="mint" solid pop />}
      </Sheet>
      <div className="mx-auto mt-2 flex w-full max-w-[20rem] items-center gap-2 text-sm text-muted">
        <span className="shrink-0">আঁকাবাঁকা</span>
        <input type="range" min={0} max={100} step={1} value={flat} disabled={done} aria-label="রাস্তা সোজা করা" onChange={(e) => change(Number(e.target.value))} className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-teal)]" />
        <span className="shrink-0">সোজা</span>
      </div>
      <div className="mx-auto mt-2 grid w-full max-w-[20rem] grid-cols-[3.4rem_1fr_3.6rem] items-center gap-x-2 gap-y-1.5 text-sm">
        <span className="font-semibold text-[#b08a4a]">দূরত্ব</span>
        <span className="h-2.5 rounded-full bg-foreground/[0.06]">
          <span className="block h-full rounded-full bg-[#b08a4a]" style={{ width: `${(km / 4) * 100}%` }} />
        </span>
        <span className="font-mono tabular-nums">{km.toFixed(1)} km</span>
        <span className="font-semibold text-[#059669]">সরণ</span>
        <span className="h-2.5 rounded-full bg-foreground/[0.06]">
          <span className="block h-full rounded-full bg-[#059669]" style={{ width: "75%" }} />
        </span>
        <span className="font-mono tabular-nums">3.0 km</span>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm">
        <span className={`rounded-full border-2 px-2.5 py-0.5 ${done ? "border-[#059669]" : "border-[#b08a4a]"}`}>
          গড় দ্রুতি <span className="font-mono tabular-nums">{vs.toFixed(2)} m/s</span>
        </span>
        <span className="rounded-full border-2 border-[#059669] px-2.5 py-0.5">
          গড় বেগ <span className="font-mono">2.50 m/s</span>
        </span>
      </div>
      <Task done={done}>slider টেনে রাস্তাটা সোজা করুন। দুই উত্তর কী হয়, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Uniform speed. Three rides, as rows of time dots: the video's uneven
// ride, an even one, and one that speeds up the whole way. Each plays on the
// road with the needle; only the even one keeps তাৎক্ষণিক = গড় throughout.

const X8_OPTS: Ride[] = ["uneven", "even", "speedup"];
const X8_RIGHT: Ride = "even";
const X8_NOPE: Record<Ride, string> = {
  uneven: "needle উঠলো-নামলো, 1.67 থেকে 5.00 m/s। তাৎক্ষণিক দ্রুতি কখনো গড়ের বেশি, কখনো কম।",
  even: "",
  speedup: "dot-গুলো একটা নিয়মে ফাঁক হলো, কিন্তু সমান না। needle 1.67 থেকে বাড়তেই থাকলো।",
};

function DotRow({ ride }: { ride: Ride }) {
  return (
    <svg viewBox="0 0 180 16" className="h-4 w-44" aria-hidden="true">
      <path d="M6 8H174" stroke={PH.cream} strokeWidth={1.4} strokeDasharray="0.1 3.5" strokeLinecap="round" />
      {Array.from({ length: 13 }, (_, j) => (
        <circle key={j} cx={6 + 168 * RIDE_U[ride](j / 12)} cy={8} r={3} fill={PH.amber} stroke="#fff" strokeWidth={0.8} />
      ))}
    </svg>
  );
}

export function SteadyRide() {
  const pass = useGate();
  const [pick, setPick] = useSeed<Ride | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // u is time: linear. Each ride's own speeding and slowing lives in RIDE_U.
  const walk = useWalk(2400, { steps: false, ease: "linear" });
  const go = (r: Ride) => {
    if (walk.running) return;
    setPick(r);
    sfx.pedal();
    walk.start(() => {
      if (r === X8_RIGHT) {
        sfx.chime();
        pass("সুষম দ্রুতিতে তাৎক্ষণিক = গড়।");
      } else setMiss((m) => m + 1);
    });
  };
  const running = walk.running;
  const u = pick === null ? 0 : running ? walk.t : 1;
  const km = pick === null ? 0 : 4 * RIDE_U[pick](u);
  const speed = pick === null ? 0 : AVG * RIDE_RATE[pick](u);
  const dots = pick === null ? [] : rideDots(pick).slice(0, Math.floor(u * 12 + 1e-6) + 1);
  const settled = pick !== null && !running;
  const right = settled && pick === X8_RIGHT;
  const range = pick === null ? [AVG, AVG] : pick === "even" ? [AVG, AVG] : [AVG * 0.5, AVG * 1.5];
  return (
    <>
      <RoadSheet label="A থেকে B, তিথির সাইকেল আর speedometer। বেছে নেওয়া ride রাস্তায় চলে, সমান সময় পরপর একটা করে dot পড়ে।" trace={km} sheet={{ className: "max-w-[18rem]" }}>
        {dots.map((d, j) => (
          <TimeDot key={j} km={d} />
        ))}
        <RoadBike km={km} />
        <Gauge x={GX} y={GY} r={GR} v={settled && pick !== "even" ? range[1] : speed} max={GMAX} digits={2} settle={settled} />
        {settled && <GaugeBand x={GX} y={GY} r={GR} lo={range[0]} hi={range[1]} max={GMAX} />}
        <GaugeAvg x={GX} y={GY} r={GR} max={GMAX} />
        {right && <Ripple at={gaugePt(GX, GY, GR, AVG, GMAX)} r={18} />}
        {settled && !right && <WrongMark x={GX - GR - 14} y={GY + 2} />}
      </RoadSheet>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="rounded-full border-2 border-[#d97706] px-2.5 py-0.5">
          তাৎক্ষণিক{" "}
          <span className="font-mono tabular-nums">{settled && pick !== "even" ? `${range[0].toFixed(2)}–${range[1].toFixed(2)}` : speed.toFixed(2)} m/s</span>
        </span>
        <span className="rounded-full border-2 border-[#b08a4a] px-2.5 py-0.5">
          গড় <span className="font-mono">3.33 m/s</span>
        </span>
        {right && <span className={`font-semibold text-accent-text ${FADE}`}>একই</span>}
      </div>
      <div className="mt-2 grid gap-1.5">
        {X8_OPTS.map((r, i) => (
          <Choice key={r} n={i} look={pick === r && !running ? (r === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={running || right} onClick={() => go(r)}>
            <DotRow ride={r} />
          </Choice>
        ))}
      </div>
      {settled && pick !== X8_RIGHT && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={right}>কোন ride-এ তিথি পুরো পথ একই জোরে চালিয়েছে? dot দেখে বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn: the ride home, B → A on the same road, again 20 min. The
// reader picks both answers. The bike rides the road at the speed; a hollow
// dot goes straight from B at the velocity. Right only when both reach A.

const X9_OPTS = [
  { speed: AVG, vel: 2.5, to: "A" as const },
  { speed: AVG, vel: 2.5, to: "B" as const },
  { speed: 2.5, vel: AVG, to: "A" as const },
];
const X9_RIGHT = 0;
const X9_NOPE = ["", "সাইকেল বাসায় পৌঁছালো, কিন্তু বেগের তীর উল্টা দিকে ছুটলো। ফেরার সময় সরণ কোন দিকে?", "পথ ধরে 2.5 m/s-এ 20 মিনিটে মাত্র 3 km, বাসায় পৌঁছালো না। আর সোজা 4 km গিয়ে তীর A ছাড়িয়ে গেলো।"];
const f2 = (v: number) => (v === AVG ? "3.33" : `${v}`);

export function ReturnRide() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // Average speed and velocity over 20 min: both bodies keep an even pace.
  const walk = useWalk(2000, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pedal();
    walk.start(() => {
      if (i === X9_RIGHT) {
        sfx.chime();
        pass("ফেরার বেগ 2.5 m/s, এবার A-এর দিকে।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const o = pick === null ? null : X9_OPTS[pick];
  const bikeKm = o ? 4 - ((o.speed * 1200) / 1000) * t : 4;
  const reach = o ? ((o.vel * 1200) / 1000) * KM * t : 0;
  const ghost: P = o ? [B[0] + (o.to === "A" ? -reach : reach), B[1]] : B;
  const done = pick !== null && !walk.running;
  const right = done && pick === X9_RIGHT;
  const wrong = done && pick !== X9_RIGHT;
  const bikeAt = overBike(Math.max(0, bikeKm));
  return (
    <>
      <Sheet w={RW} h={RH} label="বটতলা B থেকে বাসার মোড় A, একই আঁকাবাঁকা পথ। সাইকেল চলে পথ ধরে, ফাঁপা বিন্দু চলে B থেকে সোজা।" bg={PH.ground} className="max-w-[17rem]">
        <RoadBase upTo={4} />
        <RoadTrace km={4} from={Math.max(0, bikeKm)} />
        <RoadBike km={Math.max(0, bikeKm)} flip />
        {o && t > 0.03 && <PArrow a={B} b={ghost} tone={right ? "mint" : pick === X9_RIGHT ? "blue" : "red"} tell={done ? `${f2(o.vel)} m/s, ${o.to}-এর দিকে` : false} />}
        {o && t > 0.03 && <Ghost at={ghost} tone={pick === X9_RIGHT ? "mint" : "red"} />}
        <Dial x={234} y={24} r={13} frac={(t * 20) / 60} />
        <Txt x={234} y={50} size={10} color={PH.amber} weight={700}>
          {`${Math.round(t * 20)} min`}
        </Txt>
        {right && <Ripple at={A} />}
        {right && <Chip x={A[0] + 24} y={A[1] - 52} text="দুজনেই বাসায়" tone="mint" solid pop />}
        {wrong && pick === 1 && <WrongMark x={RW - 10} y={B[1] - 8} />}
        {wrong && pick === 2 && <WrongMark x={bikeAt[0] - 16} y={bikeAt[1] + 6} />}
      </Sheet>
      <div className="mt-1.5 text-center text-xs text-muted">সাইকেল চলে পথ ধরে, দ্রুতিতে। ফাঁপা বিন্দু চলে সোজা, বেগে।</div>
      <div className="mt-2 text-center text-sm font-semibold">গড় দ্রুতি আর গড় বেগ, m/s-এ:</div>
      <div className="mt-1.5 grid gap-1.5">
        {X9_OPTS.map((x, i) => (
          <Choice key={i} n={i} look={pick === i && !walk.running ? (i === X9_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="text-sm">
              দ্রুতি <span className="font-mono">{f2(x.speed)}</span> · বেগ <span className="font-mono">{f2(x.vel)}</span>, {x.to}-এর দিকে
            </span>
          </Choice>
        ))}
      </div>
      {wrong && <Nope key={miss}>{X9_NOPE[pick]}</Nope>}
      <Task done={right}>ফেরার পথে গড় দ্রুতি আর গড় বেগ কত? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · Recap figure: the two cards, then the ride's two answers under them.

const S10_SAY = ["দ্রুতি = দূরত্ব ÷ সময়।", "বেগ = সরণ ÷ সময়, সাথে দিক।", "আঁকাবাঁকা পথে: গড় দ্রুতি 3.33, গড় বেগ 2.5।"];

export function RecapCards({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  const card = (x: number, name: string, top: string, tone: string, kind: Top, vec: boolean) => (
    <g className={POP}>
      <rect x={x} y={8} width={128} height={78} rx={9} fill={PH.paper} stroke={tone} strokeWidth={1.4} />
      <Txt x={x + 30} y={52} size={13} color={tone} weight={800}>
        {name}
      </Txt>
      <Txt x={x + 92} y={40} size={10.5} color={tone} weight={700}>
        {top}
      </Txt>
      <path d={`M${x + 66} 46H${x + 118}`} stroke={PH.ink} strokeWidth={1.2} />
      <Txt x={x + 92} y={60} size={10.5} color={PH.amber} weight={700}>
        সময়
      </Txt>
      {vec && <path d={`M${x + 20} 30H${x + 38}l-4 -3v6l4 -3`} stroke={tone} strokeWidth={1.6} fill={tone} strokeLinejoin="round" />}
      <g transform={`translate(${x + 64} 76) scale(0.7)`}>
        <TopIcon kind={kind} />
      </g>
    </g>
  );
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10_SAY[k]}</span>}>
      <Sheet w={280} h={122} label="দুইটা card: দ্রুতি সমান দূরত্ব ভাগ সময়, বেগ সমান সরণ ভাগ সময়। নিচে: গড় দ্রুতি 3.33 m/s, গড় বেগ 2.5 m/s B-এর দিকে।" className="max-w-[19rem]">
        {card(8, "দ্রুতি", "দূরত্ব", PH.cream, "dist", false)}
        {k >= 1 && card(144, "বেগ", "সরণ", PH.mint, "disp", true)}
        {k >= 2 && <Chip x={72} y={106} text="3.33 m/s" tone="cream" solid pop />}
        {k >= 2 && <Chip x={208} y={106} text="2.5 m/s, B-এর দিকে" tone="mint" solid pop />}
      </Sheet>
    </Scene>
  );
}

// 10a · Closing story scene, the next video's puzzle: টুটুল on the roof whirls
// a stone on a string. Its arrow keeps one length but turns every beat.

const S10_STONE: { at: P; dir: P; tell: string }[] = [
  { at: [164, 104], dir: [0, -1], tell: "বেগ: উপরের দিকে" },
  { at: [134, 74], dir: [-1, 0], tell: "বেগ: বাঁ দিকে" },
  { at: [104, 104], dir: [0, 1], tell: "বেগ: নিচের দিকে" },
  { at: [134, 134], dir: [1, 0], tell: "বেগ: ডান দিকে" },
];

export function StoneTeaser({}: Story) {
  const s = useScene(3, [600, 1300, 1300]);
  const k = s.k;
  const st = S10_STONE[k];
  const hand: P = [134, 104];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="ছাদে টুটুল সুতায় বাঁধা একটা ঢিল ঘোরাচ্ছে। ঢিলের তীর একই লম্বা, কিন্তু প্রতিবার অন্য দিকে।">
        <rect x={0} y={146} width={320} height={8} fill="#a8a29e" />
        <rect x={0} y={128} width={14} height={18} fill="#a8a29e" />
        <rect x={306} y={128} width={14} height={18} fill="#a8a29e" />
        <circle cx={hand[0]} cy={hand[1]} r={30} fill="none" stroke={PH.amber} strokeWidth={1} strokeDasharray="3 3" />
        <Person who="tutul" x={120} y={146} scale={0.8} arm="wave" label />
        <path d={`M${hand[0]} ${hand[1]}L${st.at[0]} ${st.at[1]}`} stroke={PH.ink} strokeWidth={0.8} />
        <circle cx={st.at[0]} cy={st.at[1]} r={4} fill="#78716c" stroke={PH.ink} strokeWidth={0.8} />
        <PArrow key={k} a={st.at} b={[st.at[0] + st.dir[0] * 24, st.at[1] + st.dir[1] * 24]} tone="mint" w={2.2} draw tell={st.tell} />
        {k >= 3 && <Bubble x={150} y={68} side="right" lines={["দ্রুতি একই,", "তবু বেগ বদলায়?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  OneRideTwoAnswers: { a: { k: 0 }, end: {} },
  SpeedBet: { start: {}, sealed: { bet: 2 } },
  SprintPace: { start: {}, wrong: { pick: 0 }, fast: { pick: 1 }, right: { pick: 2 } },
  SpeedCard: { a: { k: 1 }, end: {} },
  VelocityCard: { start: {}, wrong: { pick: "dist" }, time: { pick: "time" }, right: { pick: "disp" } },
  RoadPace: { start: {}, wrong: { pick: 0 }, fast: { pick: 2 }, right: { pick: 1 } },
  UnitSwap: { end: {} },
  TimeDots: { start: {}, rode: { rode: true }, wrong: { rode: true, gap: 4 }, near: { rode: true, gap: 2 }, right: { rode: true, gap: 1 } },
  AvgNeedle: { a: { k: 0 }, end: {} },
  VelocityPick: { start: {}, over: { pick: 0 }, nodir: { pick: 1 }, right: { pick: 2 } },
  TwoChips: { end: {} },
  Straighten: { start: {}, half: { flat: 50 }, done: { flat: 100 } },
  SteadyRide: { start: {}, wrong: { pick: "uneven" }, speedup: { pick: "speedup" }, right: { pick: "even" } },
  ReturnRide: { start: {}, back: { pick: 1 }, swap: { pick: 2 }, right: { pick: 0 } },
  RecapCards: { end: {} },
  StoneTeaser: { a: { k: 0 }, end: {} },
};
