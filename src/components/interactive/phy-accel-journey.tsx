"use client";

import { Fragment, useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, primaryBtn, usePlay, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { Bicycle, Gauge, PArrow, PH, Ripple, School, Sheet, Tag, Txt, WrongMark, chip, useWalk } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 9 — ত্বরণ"
// (src/content/articles/physics_for_high_school/09_acceleration.mdx), the
// journey of video EP 09 (physics_9_10/09-acceleration/script.md). Book §2.6,
// pp. 43–45.
//
// The spine: a car ad says "0 থেকে 100, মাত্র 6 সেকেন্ডে". What is it boasting
// about? The reader seals a bet (AdBet), settled on the last screen: ত্বরণ.
// On the way, the video's own beats in order: তিথির speedometer writes 0, 1,
// 2, 3, 4, 5 (SpeedLog), the name and the rule a = (v − u) / t, filled in for
// তিথি (RateFormula), the odd unit m/s² (UnitPick, DimBuild), the bridge slope
// and the brake at the corner, −2 = মন্দন (SlopeCorner, BrakePick), the whole
// ride on a v–t graph (RideGraph), the stone on a string has ত্বরণ too, so
// ত্বরণ is a vector (StoneSpin), and the ad car by the reader alone (KmhToMs,
// AdRate).
//
// Canon (PLAYLIST.md): তিথির ride A 0 → 5 m/s in 5 s (a = 1), B steady 5,
// C 5 → 6 on the bridge slope, D 6 → 0 in 3 s (a = −2; she stops in 9 m, not
// shown here). The ad car: 100 km/h = 100000 m / 3600 s ≈ 27.8 m/s, ÷ 6 s ≈
// 4.6 m/s². The stone of EP 08 goes round at 3 m/s. B's and C's durations are
// never given, so the graph draws them without numbers.
//
// Reusable: AdCar, AdBoard (the ad with its chip), BridgeSide (the bridge,
// its slope and the corner, side view), RideVt (the ride's v–t graph).
//
// Motion: a ride runs on a steady clock (useWalk ease "linear" as the time
// t), and where the body is comes from the physics, s = ut + ½at², so a body
// speeding up from rest moves as t² and a brake eases it to a stop. The
// whole seconds are marked on the road at their true spacing.

/**
 * Whole-second marks under a road at y: an amber tick where the body was at
 * 1 s, 2 s, … `at(n)` is its x at n s. Only marks on the sheet, and only where
 * it moved on (a body at rest gets one mark, not three on top of each other).
 */
function SecondMarks({ upTo, at, y, w = 300 }: { upTo: number; at: (n: number) => number; y: number; w?: number }) {
  const marks: [number, number][] = [];
  for (let n = 1; n <= Math.floor(upTo + 1e-6); n++) {
    const x = at(n);
    if (x > w - 4) break;
    if (n === 1 || x - at(n - 1) > 2) marks.push([n, x]);
  }
  return (
    <g className="pointer-events-none">
      {marks.map(([n, x]) => (
        <g key={n} className={FADE}>
          <path d={`M${x} ${y + 3}V${y + 9}`} stroke={PH.amber} strokeWidth={1.6} strokeLinecap="round" />
          <text x={x} y={y + 17} fontSize={6.5} fontWeight={700} textAnchor="middle" fill={PH.amber} style={{ fontFamily: MONO }}>
            {`${n}s`}
          </text>
        </g>
      ))}
    </g>
  );
}

type Story = { story?: boolean };
type P = [number, number];

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
/** a number for the screen: at most `d` decimals, a real minus */
const fmt = (n: number, d = 1) => String(Number(n.toFixed(d))).replace("-", "−");

/** A line of mono text with superscripts: parts are [base, sup?]. */
function SupText({ x, y, parts, size = 14, color = PH.ink, anchor = "middle", weight = 700 }: { x: number; y: number; parts: [string, string?][]; size?: number; color?: string; anchor?: "start" | "middle" | "end"; weight?: number }) {
  return (
    <text x={x} y={y} fontSize={size} textAnchor={anchor} fontWeight={weight} fill={color} style={{ fontFamily: MONO }} className="pointer-events-none">
      {parts.map(([b, s], i) => (
        <Fragment key={i}>
          <tspan dy={i > 0 && parts[i - 1][1] ? size * 0.4 : undefined}>{b}</tspan>
          {s && (
            <tspan dy={-size * 0.4} fontSize={size * 0.65}>
              {s}
            </tspan>
          )}
        </Fragment>
      ))}
    </text>
  );
}

/** A tick mark drawn as a path (the glyph turns into an emoji on Linux). */
function TickMark({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  return (
    <g className={`pointer-events-none ${POP}`}>
      <circle cx={x} cy={y} r={r} fill={PH.mint} />
      <path d={`M${x - r * 0.45} ${y}l${r * 0.32} ${r * 0.34}l${r * 0.6} ${-r * 0.66}`} fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// The ad: a sleek car and the chip `0 → 100 km/h · 6 s`, an amber ? on the
// arrow between. The board is 240 × 90, drawn at (0, 0); callers place it.

/** The ad car, a side-on silhouette, bottom-centre at (x, y). */
export function AdCar({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <ellipse cy={0.8} rx={36} ry={2.6} fill={PH.ink} opacity={0.1} />
      <path d="M-34 -6L-34 -12Q-31 -16 -20 -17L-10 -25Q0 -28 12 -25L22 -17Q32 -16 34 -11L34 -6Z" fill="#2f6fe0" stroke={PH.ink} strokeWidth={1} strokeLinejoin="round" />
      <path d="M-8 -23L10 -23L18 -17L-14 -17Z" fill="#dbeafe" stroke={PH.ink} strokeWidth={0.7} strokeLinejoin="round" />
      <path d="M2 -23V-17" stroke={PH.ink} strokeWidth={0.9} />
      {[-20, 20].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={-6} r={6} fill={PH.ink} />
          <circle cx={wx} cy={-6} r={2.4} fill="#cbd5e1" />
        </g>
      ))}
    </g>
  );
}

/**
 * The ad board. `lit` rings one part of the chip for the bet (0 the 100 km/h,
 * 1 the 6 s, 2 the arrow between); `answer` writes 4.6 m/s² over the arrow;
 * `gone` sends the car off to the right.
 */
export function AdBoard({ lit = null, answer = false, gone = false }: { lit?: number | null; answer?: boolean; gone?: boolean }) {
  const ring: Record<number, [number, number]> = { 0: [97, 64], 1: [170, 28], 2: [57, 38] };
  return (
    <g>
      <rect x={0} y={0} width={240} height={90} rx={7} fill="#fff" stroke={PH.ink} strokeWidth={1.4} />
      <rect x={5} y={5} width={230} height={48} rx={4} fill="#e0f2fe" />
      <path d="M5 47H235" stroke="#94a3b8" strokeWidth={1.2} />
      <g style={{ transform: `translate(${gone ? 168 : 72}px, 47px)` }} className="transition-transform duration-[1200ms] ease-in motion-reduce:transition-none">
        <AdCar x={0} y={0} s={0.9} />
        {gone && <path d="M-46 -20h-18M-44 -13h-26M-48 -6h-14" stroke="#64748b" strokeWidth={1.2} strokeLinecap="round" className={FADE} />}
      </g>
      <rect x={36} y={58} width={168} height={28} rx={14} fill="#f8fafc" stroke={PH.faint} strokeWidth={1.2} />
      <text x={50} y={77} fontSize={12} fontWeight={800} textAnchor="middle" fill={PH.ink} style={{ fontFamily: MONO }}>
        0
      </text>
      <path d="M60 74H90M85 70.5L91 74L85 77.5" fill="none" stroke={answer ? PH.mint : PH.amber} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      {answer ? (
        <text x={75} y={69} fontSize={7.6} fontWeight={800} textAnchor="middle" fill={PH.mint} style={{ fontFamily: MONO }} className={FADE}>
          4.6 m/s²
        </text>
      ) : (
        <text x={75} y={69} fontSize={10} fontWeight={800} textAnchor="middle" fill={PH.amber} style={{ fontFamily: MONO }}>
          ?
        </text>
      )}
      <text x={100} y={77} fontSize={12} fontWeight={800} fill={PH.ink} style={{ fontFamily: MONO }}>
        100 km/h
      </text>
      <text x={165} y={77} fontSize={12} fontWeight={800} textAnchor="middle" fill={PH.mute}>
        ·
      </text>
      <text x={173} y={77} fontSize={12} fontWeight={800} fill={PH.ink} style={{ fontFamily: MONO }}>
        6 s
      </text>
      {lit !== null && (
        <g key={lit} className={POP}>
          <rect x={ring[lit][0]} y={60} width={ring[lit][1]} height={24} rx={6} fill="none" stroke={PH.blue} strokeWidth={1.6} strokeDasharray="3 2" />
          <circle cx={ring[lit][0] + ring[lit][1] / 2} cy={54} r={7} fill={PH.blue} />
          <text x={ring[lit][0] + ring[lit][1] / 2} y={57.5} fontSize={10} fontWeight={800} textAnchor="middle" fill="#fff" style={{ fontFamily: MONO }}>
            ?
          </text>
        </g>
      )}
    </g>
  );
}

/** The board on a stage, on two posts. */
function StageBoard(props: Parameters<typeof AdBoard>[0]) {
  return (
    <g>
      <path d="M80 100V150M240 100V150" stroke="#78716c" strokeWidth={4} />
      <g transform="translate(40 12)">
        <AdBoard {...props} />
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: the car ad on a board by the road. The car
// shoots off; the chip comes up, a ? on its arrow.

export function AdBoast({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="রাস্তার পাশে গাড়ির বিজ্ঞাপন। গাড়িটা ছুটে বেরিয়ে যায়। নিচে লেখা: 0 থেকে 100 km/h, মাত্র 6 s।">
        <StageBoard gone={k >= 1} />
        {k >= 2 && (
          <g className={POP}>
            <circle cx={115} cy={78} r={14} fill="none" stroke={PH.amber} strokeWidth={1.6} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: what is the ad boasting about? The pick rings that part
// of the chip with a ?. Not marked.

const BET = ["গাড়ির বেগ: 100 km/h", "সময়টা: মাত্র 6 s", "বেগ কত তাড়াতাড়ি বাড়ে"];

export function AdBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  return (
    <>
      <Sheet w={300} h={108} label="গাড়ির বিজ্ঞাপন: 0 থেকে 100 km/h, 6 s। যেটা বাছবেন, chip-এর সেই অংশে একটা ? বসবে।" className="max-w-[21rem]">
        <g transform="translate(30 9)">
          <AdBoard lit={bet} />
        </g>
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
      <Task done={bet !== null}>বিজ্ঞাপনটা আসলে কোন জিনিসের বড়াই করছে? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2a · Story scene for screen 2: স্কুল ছুটি; তিথি rides off; the small
// speedometer on the back wheel, and its empty t | v column.

export function SchoolOut({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  const bx = k >= 1 ? 150 : 98;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="স্কুল ছুটি। তিথি সাইকেলে প্যাডেল মারছে। পেছনের চাকায় ছোট একটা speedometer, পাশে t আর v-এর খালি ঘর।">
        <School x={48} y={150} s={1.7} />
        {/* off from rest, speeding up: ease-in */}
        <g style={{ transform: `translate(${bx}px, 150px)` }} className="transition-transform duration-[1400ms] ease-in motion-reduce:transition-none">
          <Bicycle x={0} y={0} s={1.5} spin={k * 200} />
          <circle cx={-15} cy={-10.5} r={3} fill={PH.amber} stroke="#fff" strokeWidth={0.8} />
        </g>
        {k >= 2 && (
          <g className={FADE}>
            <path d={`M${bx - 15} ${139.5}L206 84`} stroke={PH.amber} strokeWidth={1} strokeDasharray="3 2" />
            <circle cx={222} cy={70} r={30} fill="#fff" stroke={PH.amber} strokeWidth={1.2} />
            <Gauge x={222} y={72} r={20} v={0} max={6} digits={0} />
            <Txt x={222} y={32} size={8} color={PH.mute}>
              speedometer
            </Txt>
            <rect x={262} y={28} width={52} height={116} rx={5} fill="#fff" stroke={PH.faint} strokeWidth={1} />
            <Txt x={276} y={40} size={8}>
              t (s)
            </Txt>
            <Txt x={301} y={40} size={8}>
              v
            </Txt>
            <path d="M265 45H311M288 32V140" stroke={PH.faint} strokeWidth={0.8} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d={`M267 ${62 + i * 15}H309`} stroke={PH.faint} strokeWidth={0.6} strokeDasharray="2 2" />
            ))}
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · The speedometer's log. Each tap is one second of pedalling: the bike
// rolls on, the needle climbs, a row drops into t | v and a +1 pops between
// it and the last. Five taps: 0, 1, 2, 3, 4, 5.

const X2_ROW = (i: number) => 52 + i * 24;
/** where the bike is at t s: from rest at 1 m/s², x = ½t², drawn to fit the road */
const X2_X = (t: number) => 34 + (120 * t * t) / 25;

export function SpeedLog() {
  const pass = useGate();
  const [sec, setSec] = useSeed("sec", 0);
  // one tap is one second on the clock; the bike's place is the physics, ½at²
  const walk = useWalk(1000, { steps: false, ease: "linear" });
  const done = sec >= 5 && !walk.running;
  const pedal = () => {
    if (walk.running || sec >= 5) return;
    const next = sec + 1;
    setSec(next);
    sfx.pedal();
    walk.start(() => {
      sfx.pop();
      if (next === 5) pass("প্রতি সেকেন্ডে বেগ বাড়লো ঠিক 1 m/s করে।");
    });
  };
  const t = walk.running ? sec - 1 + walk.t : sec;
  const rows = walk.running ? sec : sec + 1;
  const bx = X2_X(t);
  return (
    <>
      <Sheet w={300} h={190} label="তিথির সাইকেল রাস্তায়, নিচে speedometer, ডানে t আর v-এর ঘর। প্রতি সেকেন্ডে একটা করে মান লেখা হয়।">
        <path d="M12 64H176" stroke="#a8a29e" strokeWidth={3} strokeLinecap="round" />
        <SecondMarks upTo={t} at={X2_X} y={64} w={182} />
        <g transform={`translate(${bx.toFixed(1)} 64)`}>
          <Bicycle x={0} y={0} s={1.1} spin={t * 160} />
        </g>
        <Gauge x={92} y={140} r={34} v={t} max={6} />
        <Txt x={92} y={174} size={8.5} color={PH.mute}>
          speedometer
        </Txt>
        <path d="M186 14V178" stroke={PH.faint} strokeWidth={1} />
        <Txt x={214} y={26} size={9.5}>
          t (s)
        </Txt>
        <Txt x={254} y={26} size={9.5}>
          v (m/s)
        </Txt>
        <path d="M194 33H290" stroke={PH.faint} strokeWidth={1} />
        {Array.from({ length: rows }, (_, i) => (
          <g key={i} className={FADE}>
            <Txt x={214} y={X2_ROW(i)} size={12} weight={700}>
              {String(i)}
            </Txt>
            <Txt x={254} y={X2_ROW(i)} size={12} weight={800} color={i === rows - 1 ? PH.amber : PH.ink}>
              {String(i)}
            </Txt>
            {i > 0 &&
              (done ? (
                // the log answers: every +1 lights up, one after another
                <g key="lit" style={{ transitionDelay: `${i * 120}ms` }} className={POP}>
                  <Tag x={282} y={X2_ROW(i) - 16} text="+1" tone="mint" size={8} />
                </g>
              ) : (
                <Tag x={282} y={X2_ROW(i) - 16} text="+1" tone="amber" size={8} pop />
              ))}
          </g>
        ))}
      </Sheet>
      <div className="mt-3 flex justify-center">
        <button type="button" className={primaryBtn} disabled={walk.running || sec >= 5} onClick={pedal}>
          {sec >= 5 ? "5 সেকেন্ড হলো" : `এক সেকেন্ড প্যাডেল (${sec}/5)`}
        </button>
      </div>
      <Task done={done}>প্যাডেলে চাপ দিন, এক সেকেন্ড করে পাঁচবার। প্রতি সেকেন্ডে speedometer কী লিখলো, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The rule, filled in for তিথি. The reader sets v, u and t on the card
// a = (v − u) / t; "হিসাব করুন" runs that rate second by second against the
// speedometer's log. A wrong rate drifts off the log in red.

type Abc = { v: number; u: number; t: number };
const X3_RIGHT = (o: Abc) => o.v === 5 && o.u === 0 && o.t === 5;
const X3_CELL = (i: number) => 96 + i * 36;

function x3Nope(o: Abc) {
  const a = (o.v - o.u) / o.t;
  if (o.u !== 0) return "0 s-এ তিথি দাঁড়িয়ে, বেগ 0। শুরুর বেগ u-তে সেটাই বসবে।";
  if (Math.abs(a - 1) < 1e-9) return `হারটা ঠিক 1, কিন্তু এটা ${o.t} সেকেন্ডের হিসাব। পুরো 5 সেকেন্ড নিন: শেষ বেগ 5 s-এর ঘর থেকে।`;
  if (a > 1) return `এই হারে 1 s-এই বেগ ${fmt(a)}, কিন্তু speedometer লিখেছে 1। শেষ বেগ যত সেকেন্ডে এলো, t-তে সেটা বসান।`;
  return `এই হারে 5 s-এ বেগ মাত্র ${fmt(5 * a)}, কিন্তু speedometer লিখেছে 5। শেষ বেগ v নিন 5 s-এর ঘর থেকে।`;
}

function Slot({ x, y, n, lit }: { x: number; y: number; n: number; lit: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 11} y={y - 11} width={22} height={22} rx={5} fill={lit ? PH.mintSoft : PH.blueSoft} stroke={lit ? PH.mint : PH.blue} strokeWidth={1.2} />
      <text x={x} y={y + 5} fontSize={14} fontWeight={800} textAnchor="middle" fill={PH.ink} style={{ fontFamily: MONO }}>
        {n}
      </text>
    </g>
  );
}

export function RateFormula() {
  const pass = useGate();
  const [v, setV] = useSeed("v", 0);
  const [u, setU] = useSeed("u", 0);
  const [t, setT] = useSeed("t", 1);
  const [sent, setSent] = useSeed<Abc | null>("sent", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(170);
  const go = () => {
    if (play.running) return;
    const o = { v, u, t };
    setSent(o);
    sfx.tap();
    play.play(6, () => {
      if (X3_RIGHT(o)) {
        sfx.chime();
        pass("(5 − 0) ÷ 5 = 1.");
      } else setMiss((m) => m + 1);
    });
  };
  const edit = (set: (n: number) => void) => (n: number) => {
    set(n);
    setSent(null);
  };
  const a = sent ? (sent.v - sent.u) / sent.t : 0;
  const shown = sent ? (play.running ? play.k : 6) : 0;
  const settled = !!sent && !play.running;
  const ok = settled && X3_RIGHT(sent);
  const vAt = (i: number) => (sent ? sent.u + a * i : 0);
  const needle = shown > 0 ? vAt(shown - 1) : 0;
  // the first second where this rate leaves the log: where the ? goes
  const drift = sent && settled && !ok ? [0, 1, 2, 3, 4, 5].find((i) => Math.abs(vAt(i) - i) > 1e-6) : undefined;
  return (
    <>
      <Sheet w={300} h={180} label="ত্বরণের card: a সমান v মাইনাস u, ভাগ t। নিচে speedometer-এর মাপা বেগ, আর আপনার হিসাবের বেগ, প্রতি সেকেন্ডে।">
        {/* one reading a second: the needle swings to each new one */}
        <Gauge x={44} y={66} r={27} v={Math.max(0, needle)} max={6} settle />
        <Txt x={128} y={68} size={18} weight={800} anchor="end">
          a =
        </Txt>
        <Txt x={140} y={52} size={18} weight={500}>
          (
        </Txt>
        <Slot x={156} y={46} n={v} lit={ok} />
        <Txt x={177} y={51} size={15}>
          −
        </Txt>
        <Slot x={198} y={46} n={u} lit={ok} />
        <Txt x={215} y={52} size={18} weight={500}>
          )
        </Txt>
        <path d="M136 63H220" stroke={PH.ink} strokeWidth={1.6} />
        <Slot x={177} y={80} n={t} lit={ok} />
        {settled && (
          <g className={FADE}>
            <Txt x={228} y={68} size={18} weight={800} anchor="start" color={ok ? PH.mint : PH.red}>
              {`= ${fmt(a, 2)}`}
            </Txt>
          </g>
        )}
        {ok && <Ripple at={[246, 62]} r={22} />}
        <Txt x={176} y={108} size={8.5} color={PH.mute}>
          v: শেষ বেগ · u: শুরুর বেগ · t: সময়
        </Txt>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Txt key={i} x={X3_CELL(i)} y={126} size={8} color={PH.mute}>
            {`${i} s`}
          </Txt>
        ))}
        <Txt x={44} y={146} size={8.5} color={PH.mute}>
          মাপা v
        </Txt>
        <Txt x={44} y={168} size={8.5} color={PH.mute}>
          হিসাবের v
        </Txt>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Txt key={i} x={X3_CELL(i)} y={146} size={11} color={PH.mute}>
            {String(i)}
          </Txt>
        ))}
        {sent &&
          Array.from({ length: shown }, (_, i) => {
            const match = Math.abs(vAt(i) - i) < 1e-6;
            // mint only when the whole rate is right; on a wrong one a matching second stays plain
            const fill = !match ? PH.redSoft : X3_RIGHT(sent) ? PH.mintSoft : "#f8fafc";
            const edge = !match ? PH.red : X3_RIGHT(sent) ? PH.mint : PH.faint;
            return (
              <g key={`${miss}${i}`} className={POP}>
                <rect x={X3_CELL(i) - 15} y={154} width={30} height={19} rx={5} fill={fill} stroke={edge} strokeWidth={1} />
                <Txt x={X3_CELL(i)} y={168} size={10.5} weight={800} color={!match ? PH.red : X3_RIGHT(sent) ? PH.mint : PH.ink}>
                  {fmt(vAt(i))}
                </Txt>
              </g>
            );
          })}
        {drift !== undefined && <WrongMark key={miss} x={X3_CELL(drift) + 16} y={153} size={12} />}
        {/* the rate is right but not the whole ride: the ? goes on the answer itself */}
        {settled && !ok && drift === undefined && <WrongMark key={miss} x={276} y={62} />}
      </Sheet>
      <div className="mx-auto mt-2 flex max-w-[21rem] flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        {(
          [
            ["v", v, setV],
            ["u", u, setU],
            ["t", t, setT],
          ] as const
        ).map(([name, val, set]) => (
          <span key={name} className="inline-flex items-center gap-1">
            <span className="font-mono text-sm font-bold">{name}</span>
            <Stepper value={val} onChange={edit(set)} min={name === "t" ? 1 : 0} max={name === "t" ? 5 : 6} disabled={play.running || ok} label={name} />
          </span>
        ))}
        <button type="button" className={`${primaryBtn} h-9! px-4!`} disabled={play.running || ok} onClick={go}>
          হিসাব করুন
        </button>
      </div>
      {settled && !ok && <Nope key={miss}>{x3Nope(sent)}</Nope>}
      <Task done={ok}>তিথির পুরো 5 সেকেন্ডের হিসাব বসান: শেষ বেগ v, শুরুর বেগ u, সময় t। তারপর হিসাব করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The unit. On the card, the change of velocity in m/s over the time in s.
// Each pick moves the bottom s: up beside the top one as s² (right), dropped
// away (m/s), or onto the top s to cancel, as if multiplied (m).

const X4_OPTS = ["m/s", "m/s²", "m"];
const X4_RIGHT = 1;
const X4_NOPE = [
  "ভাগের s-টা হারিয়ে গেলো। m/s তো শুধু বেগের একক; ত্বরণে বেগের বদলকে আরেকবার ভাগ করি সময় দিয়ে।",
  "",
  "s দুইটা কাটাকাটি হলো, যেন সময় দিয়ে গুণ করেছেন। বেগ গুণ সময় তো দূরত্ব, m। এখানে ভাগ।",
];

export function UnitPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(700, { steps: false });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.tap();
    walk.start(() => {
      if (i === X4_RIGHT) {
        sfx.chime();
        pass("মিটার পার সেকেন্ড, পার সেকেন্ড: m/s²।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? 0 : walk.running ? walk.t : 1;
  const end = pick !== null && !walk.running;
  const right = pick === X4_RIGHT && end;
  // where the bottom s goes
  const to: P = pick === 0 ? [150, 116] : pick === 1 ? [171, 40] : pick === 2 ? [167, 52] : [150, 88];
  const sx = 150 + (to[0] - 150) * p;
  const sy = 88 + (to[1] - 88) * p;
  const size = pick === X4_RIGHT ? 19 - 7 * p : 19;
  const result = pick === null || !end ? "?" : X4_OPTS[pick];
  return (
    <>
      <Sheet w={300} h={124} label="ত্বরণের এককের card: উপরে বেগের বদল m/s, নিচে সময় s। যেটা বাছবেন, নিচের s সেভাবে সরে যায়।">
        <Txt x={70} y={56} size={9} color={PH.mute}>
          বেগের বদল
        </Txt>
        <Txt x={70} y={92} size={9} color={PH.mute}>
          সময়
        </Txt>
        {right ? (
          <g className={FADE}>
            <Txt x={150} y={74} size={19} weight={800} color={PH.mint}>
              m/s²
            </Txt>
            <Ripple at={[150, 68]} r={26} />
          </g>
        ) : (
          <>
            <Txt x={150} y={56} size={19} weight={800}>
              m/s
            </Txt>
            <path d="M118 66H182" stroke={PH.ink} strokeWidth={1.6} opacity={pick === X4_RIGHT ? 1 - p : 1} />
            <g opacity={pick === 0 ? 1 - p : 1}>
              <text x={sx} y={sy} fontSize={size} fontWeight={800} textAnchor="middle" fill={pick !== null && pick !== X4_RIGHT && p > 0.5 ? PH.red : PH.ink} style={{ fontFamily: MONO }} className="pointer-events-none">
                s
              </text>
            </g>
            {pick === 2 && end && <path d="M146 44L176 58M146 58L176 44" stroke={PH.red} strokeWidth={1.8} strokeLinecap="round" className={FADE} />}
          </>
        )}
        <Txt x={206} y={74} size={19} weight={800} anchor="start" color={pick === null || !end ? PH.amber : right ? PH.mint : PH.red}>
          {`= ${result}`}
        </Txt>
        {pick !== null && pick !== X4_RIGHT && end && <WrongMark key={miss} x={pick === 0 ? 166 : 186} y={pick === 0 ? 114 : 50} />}
      </Sheet>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X4_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && end ? (i === X4_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="font-mono text-base font-bold">{o}</span>
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== X4_RIGHT && end && <Nope key={miss}>{X4_NOPE[pick]}</Nope>}
      <Task done={right}>বেগের বদল m/s-এ, ভাগ করছি s দিয়ে। ত্বরণের একক কী দাঁড়ায়? বেছে নিন।</Task>
    </>
  );
}

// 4½ · Figure for screen 4's explanation: the dimension built up, [a] =
// [বেগ] ÷ [সময়] → LT⁻¹ ÷ T → LT⁻².

const S4_SAY: ReactNode[] = [
  "ত্বরণ মানে বেগের বদল, ভাগ সময়।",
  <>
    বেগের মাত্রা LT<sup>−1</sup>, সময়ের T।
  </>,
  <>
    তাই ত্বরণের মাত্রা LT<sup>−2</sup>।
  </>,
];

export function DimBuild({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S4_SAY[k]}</span>}>
      <Sheet w={260} h={100} label="ত্বরণের মাত্রা: বেগের মাত্রা ভাগ সময়ের মাত্রা, LT to the power মাইনাস টু।" className="max-w-[17rem]">
        <Txt x={130} y={28} size={13} weight={700}>
          [a] = [বেগ] ÷ [সময়]
        </Txt>
        {k >= 1 && (
          <g className={FADE}>
            <SupText x={130} y={56} parts={[["= LT", "−1"], [" ÷ T"]]} size={15} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <rect x={84} y={67} width={92} height={26} rx={13} fill={PH.mintSoft} stroke={PH.mint} strokeWidth={1.2} />
            <SupText x={130} y={86} parts={[["= LT", "−2"]]} size={15} color={PH.mint} />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// The bridge in side view, for the ride's later part: the deck over the
// river, the slope down off it, the flat road to the corner and its sign.
// The deck is at y 112, the slope runs (118, 112) → (198, 150).

const BR_DECK = 112;
const BR_TOP: P = [118, BR_DECK];
const BR_FOOT: P = [198, 150];
const BR_ANG = (Math.atan2(BR_FOOT[1] - BR_TOP[1], BR_FOOT[0] - BR_TOP[0]) * 180) / Math.PI;
const slopeAt = (x: number): P => [x, BR_TOP[1] + ((x - BR_TOP[0]) * (BR_FOOT[1] - BR_TOP[1])) / (BR_FOOT[0] - BR_TOP[0])];

export function BridgeSide({ sign = true }: { sign?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={138} width={124} height={42} fill="#93c5fd" />
      <path d="M0 146q10 -3 20 0t20 0t20 0t20 0t20 0t20 0" fill="none" stroke="#dbeafe" strokeWidth={1.2} />
      {[28, 88].map((px) => (
        <rect key={px} x={px - 4} y={BR_DECK + 4} width={8} height={64} fill="#a8a29e" />
      ))}
      <path d={`M0 ${BR_DECK}H${BR_TOP[0]}L${BR_FOOT[0]} ${BR_FOOT[1]}H320`} fill="none" stroke="#57534e" strokeWidth={5} strokeLinejoin="round" />
      <path d={`M${BR_TOP[0]} ${BR_DECK + 2.5}L${BR_FOOT[0]} ${BR_FOOT[1] + 2.5}L${BR_FOOT[0]} 180L${BR_TOP[0]} 180Z`} fill="#9ca3af" />
      <path d={`M0 ${BR_DECK - 10}H${BR_TOP[0] - 2}`} stroke="#78716c" strokeWidth={1.4} />
      {[10, 40, 70, 100].map((px) => (
        <path key={px} d={`M${px} ${BR_DECK - 10}V${BR_DECK}`} stroke="#78716c" strokeWidth={1.2} />
      ))}
      {sign && (
        <g>
          <path d="M296 150V112" stroke={PH.ink} strokeWidth={1.4} />
          <path d="M296 92L308 104L296 116L284 104Z" fill="#facc15" stroke={PH.ink} strokeWidth={1} />
          <path d="M292 109V102H300M297 99L300 102L297 105" fill="none" stroke={PH.ink} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}

/**
 * তিথি's bike on the stage at (x, y), turned by `deg`, gliding between beats.
 * `ease` is the physics of the glide: "in" speeding up, "out" braking to a
 * stop, "linear" steady.
 */
function StageBike({ x, y, deg = 0, spin = 0, ease = "linear" }: { x: number; y: number; deg?: number; spin?: number; ease?: "in" | "out" | "linear" }) {
  const curve = ease === "in" ? "ease-in" : ease === "out" ? "ease-out" : "ease-linear";
  return (
    <g style={{ transform: `translate(${x}px, ${y}px) rotate(${deg}deg)` }} className={`transition-transform duration-[1400ms] ${curve} motion-reduce:transition-none`}>
      <Bicycle x={0} y={0} s={1.1} spin={spin} />
    </g>
  );
}

// 5a · Story scene for screen 5: steady at 5 on the bridge, 5 → 6 down the
// slope, then the brake before the corner: 6 → 0 in 3 s.

const S5_BEATS: { at: P; deg: number; v: number; ease: "in" | "out" | "linear" }[] = [
  { at: [54, BR_DECK], deg: 0, v: 5, ease: "linear" },
  { at: slopeAt(158), deg: BR_ANG, v: 6, ease: "in" },
  { at: [262, 150], deg: 0, v: 0, ease: "out" },
];

export function SlopeCorner({}: Story) {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  const b = S5_BEATS[k];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="তিথি ব্রিজের উপর 5 m/s-এ চলছে। ঢাল বেয়ে নামতে বেগ 6 হলো। সামনে মোড়, brake কষে 3 সেকেন্ডে থামলো।">
        <BridgeSide />
        {k >= 2 && <path d="M214 152H248M220 155H244" stroke="#44403c" strokeWidth={1.2} strokeLinecap="round" className={FADE} />}
        <StageBike x={b.at[0]} y={b.at[1]} deg={b.deg} spin={k * 220} ease={b.ease} />
        <circle cx={44} cy={42} r={28} fill="#fff" stroke={PH.faint} strokeWidth={1} />
        <Gauge x={44} y={46} r={20} v={b.v} max={8} digits={0} />
        {k === 0 && <Tag x={112} y={80} text="বেগ বদলায় না" tone="ink" size={8} pop />}
        {k === 1 && <Tag x={208} y={122} text="ঢাল" tone="amber" size={9} pop />}
        {k >= 2 && <Tag x={250} y={86} text="brake · 3 s" tone="red" size={9} pop />}
      </Stage>
    </StoryFrame>
  );
}

// 5 · The brake. Three sums for her ত্বরণ; each plays three seconds of the
// ride from 6 m/s at that rate. +2 shoots past the corner, −6 stops dead in
// one second, −2 brings her to rest at the corner as the clock hits 3 s.

const X5_OPTS = ["(6 − 0) / 3", "0 − 6", "(0 − 6) / 3"];
const X5_A = [2, -6, -2];
const X5_RIGHT = 2;
const X5_NOPE = [
  "+2 মানে প্রতি সেকেন্ডে বেগ 2 করে বাড়ে: needle উঠলো 12-তে, তিথি মোড় পেরিয়ে গেলো। শেষ বেগ থেকে শুরুরটা বাদ দিন: 0 − 6।",
  "−6 মানে এক সেকেন্ডেই থেমে যাওয়া, মোড়ের অনেক আগে। কিন্তু তিথির লেগেছে 3 সেকেন্ড। বদলটাকে সময় দিয়ে ভাগ করুন।",
  "",
];
const X5_X0 = 30;
const X5_PX = 200 / 9; // units per metre: the right stop, 9 m, lands on the corner

function brakeAt(a: number, tau: number) {
  if (a < 0) {
    const ts = Math.min(tau, 6 / -a);
    return { v: Math.max(0, 6 + a * tau), s: 6 * ts + (a * ts * ts) / 2 };
  }
  return { v: 6 + a * tau, s: 6 * tau + (a * tau * tau) / 2 };
}

export function BrakePick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // three seconds of the ride on a steady clock; where she is comes from s = ut + ½at²
  const walk = useWalk(1800, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.scrape(0.6);
    walk.start(() => {
      if (i === X5_RIGHT) {
        sfx.chime();
        pass("(0 − 6) ÷ 3 = −2 m/s².");
      } else setMiss((m) => m + 1);
    });
  };
  const tau = pick === null ? 0 : walk.running ? 3 * walk.t : 3;
  const st = pick === null ? { v: 6, s: 0 } : brakeAt(X5_A[pick], tau);
  const xAt = (s: number) => Math.min(340, X5_X0 + s * X5_PX);
  const bx = xAt(st.s);
  const end = pick !== null && !walk.running;
  const right = end && pick === X5_RIGHT;
  const wrong = end && pick !== X5_RIGHT;
  return (
    <>
      <Sheet w={300} h={150} label="তিথি 6 m/s-এ মোড়ের দিকে। যে হিসাবটা বাছবেন, সেই ত্বরণে 3 সেকেন্ড চলবে। মোড়ে থামলে ঠিক।">
        <path d="M8 72H292" stroke="#a8a29e" strokeWidth={4} strokeLinecap="round" />
        <path d="M241 60V80" stroke={right ? PH.mint : PH.amber} strokeWidth={1.4} strokeDasharray="3 2" />
        <path d="M262 72V38" stroke={PH.ink} strokeWidth={1.3} />
        <path d="M262 18L273 29L262 40L251 29Z" fill="#facc15" stroke={PH.ink} strokeWidth={1} />
        <path d="M258 34V27H266M263 24L266 27L263 30" fill="none" stroke={PH.ink} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
        <Txt x={268} y={90} size={8.5} color={PH.amber}>
          মোড়
        </Txt>
        {pick !== null && <SecondMarks upTo={tau} at={(n) => xAt(brakeAt(X5_A[pick], n).s)} y={72} />}
        {right && <Ripple at={[241, 66]} r={24} />}
        <g transform={`translate(${bx.toFixed(1)} 72)`}>
          <Bicycle x={0} y={0} s={1} spin={st.s * 60} />
        </g>
        {wrong && <WrongMark key={miss} x={bx > 292 ? 286 : bx + 24} y={bx > 292 ? 58 : 40} />}
        {end && <Tag key={pick} x={Math.max(45, Math.min(205, bx))} y={14} text={`a = ${pick === 0 ? "+" : ""}${fmt(X5_A[pick])}`} tone={right ? "mint" : "red"} size={10} pop />}
        <Gauge x={58} y={126} r={22} v={st.v} max={12} />
        <Txt x={96} y={122} size={11} weight={700} anchor="start">
          {`t = ${fmt(tau)} s`}
        </Txt>
        {right && <Tag x={178} y={136} text="মন্দন · Deceleration" tone="amber" solid size={8.5} pop />}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X5_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && end ? (i === X5_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="font-mono font-bold">{`a = ${o}`}</span>
          </Choice>
        ))}
      </div>
      {end && pick !== X5_RIGHT && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>brake কষার 3 সেকেন্ডে তিথির ত্বরণ কত? হিসাবটা বেছে নিন, তারপর দেখুন সাইকেল কোথায় থামে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The whole ride on a v–t graph, part by part. The part to judge draws
// itself; the reader tags it ত্বরণ আছে / ত্বরণ 0 / মন্দন. A wrong tag draws a
// red ghost of what that tag would look like from the part's start.

const G_X0 = 40;
const G_Y0 = 150;
const G_V = 18.33; // units per m/s
const G_S = 16; // units per second (A and D, whose times are given)
const gy = (v: number) => G_Y0 - v * G_V;

/** The ride's v–t graph: the four parts A B C D, from (t, v) corners on the sheet. */
export const RideVt = {
  parts: [
    { name: "A", a: [G_X0, gy(0)] as P, b: [G_X0 + 5 * G_S, gy(5)] as P },
    { name: "B", a: [G_X0 + 5 * G_S, gy(5)] as P, b: [180, gy(5)] as P },
    { name: "C", a: [180, gy(5)] as P, b: [214, gy(6)] as P },
    { name: "D", a: [214, gy(6)] as P, b: [214 + 3 * G_S, gy(0)] as P },
  ],
  tags: ["ত্বরণ আছে", "ত্বরণ 0", "মন্দন"],
};
const X6_RIGHT = [0, 1, 0, 2];
const X6_LETTER: P[] = [
  [68, 100],
  [150, 52],
  [192, 40],
  [250, 84],
];
const X6_TAG: P[] = [
  [100, 124],
  [150, 76],
  [240, 24],
  [268, 114],
];
const X6_SHAPE = ["উঠতো", "সমান থাকতো", "নামতো"];
const X6_ACT = ["উঠছে", "সমান", "নামছে"];

function ghostEnd(i: number, from: P, to: P): P {
  const dx = to[0] - from[0];
  const slope = i === 0 ? -(G_V / G_S) : i === 2 ? (2 * G_V) / G_S : 0;
  return [to[0], Math.max(20, Math.min(174, from[1] + slope * dx))];
}

export function RideGraph() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [wrong, setWrong] = useSeed<number | null>("wrong", null);
  const [miss, setMiss] = useState(0);
  const done = round >= 4;
  const tap = (i: number) => {
    if (done) return;
    if (i === X6_RIGHT[round]) {
      const next = round + 1;
      setRound(next);
      setWrong(null);
      sfx.pop();
      if (next === 4) pass("লাইন উঠলে ত্বরণ, সমান হলে 0, নামলে মন্দন।");
    } else {
      setWrong(i);
      setMiss((m) => m + 1);
      sfx.slip();
    }
  };
  const cur = RideVt.parts[Math.min(round, 3)];
  return (
    <>
      <Sheet w={300} h={182} label="তিথির পুরো যাত্রার বেগ-সময় graph: A, B, C, D চার অংশ। একটা একটা করে অংশ আঁকা হয়।">
        <path d={`M${G_X0} ${G_Y0}H290M${G_X0} ${G_Y0}V18`} stroke={PH.ink} strokeWidth={1.3} />
        <path d="M286 146.5L291 150L286 153.5M36.5 22L40 17L43.5 22" fill="none" stroke={PH.ink} strokeWidth={1.3} />
        <Txt x={46} y={14} size={8.5} anchor="start">
          v (m/s)
        </Txt>
        <Txt x={290} y={168} size={8.5} anchor="end">
          t (s)
        </Txt>
        {[
          [0, "0"],
          [5, "5"],
          [6, "6"],
        ].map(([vv, l]) => (
          <Txt key={l as string} x={30} y={gy(vv as number) + 3.5} size={9} weight={700}>
            {l as string}
          </Txt>
        ))}
        <path d={`M${G_X0} ${gy(5)}H${G_X0 + 5 * G_S}M${G_X0} ${gy(6)}H214`} stroke={PH.faint} strokeWidth={0.8} strokeDasharray="2 3" />
        <Txt x={G_X0 + 5 * G_S} y={163} size={9} weight={700}>
          5
        </Txt>
        <path d={`M214 156v4h48v-4`} fill="none" stroke={PH.mute} strokeWidth={0.9} />
        <Txt x={238} y={172} size={8.5} color={PH.mute}>
          3 s
        </Txt>
        {RideVt.parts.slice(0, Math.min(round, 4)).map((pt, i) => (
          <g key={pt.name}>
            <path d={`M${pt.a[0]} ${pt.a[1]}L${pt.b[0]} ${pt.b[1]}`} stroke={PH.mint} strokeWidth={3} strokeLinecap="round" />
            <Txt x={X6_LETTER[i][0]} y={X6_LETTER[i][1]} size={11} weight={800} color={PH.mint}>
              {pt.name}
            </Txt>
            <Tag x={X6_TAG[i][0]} y={X6_TAG[i][1]} text={RideVt.tags[X6_RIGHT[i]]} tone={X6_RIGHT[i] === 2 ? "amber" : "mint"} size={8} pop />
          </g>
        ))}
        {!done && (
          <g key={`cur${round}`}>
            <path d={`M${cur.a[0]} ${cur.a[1]}L${cur.b[0]} ${cur.b[1]}`} stroke={PH.amber} strokeWidth={9} strokeLinecap="round" opacity={0.22} className={FADE} />
            <Draw d={`M${cur.a[0]} ${cur.a[1]}L${cur.b[0]} ${cur.b[1]}`} strokeWidth={3} className="stroke-[#0f1b2d]" />
            <Txt x={X6_LETTER[round][0]} y={X6_LETTER[round][1]} size={11} weight={800} color={PH.amber}>
              {cur.name}
            </Txt>
          </g>
        )}
        {!done && wrong !== null && (
          <g key={`g${miss}${wrong}`}>
            <Draw d={`M${cur.a[0]} ${cur.a[1]}L${ghostEnd(wrong, cur.a, cur.b).join(" ")}`} strokeWidth={2} ms={500} className="stroke-[#dc2626] opacity-80" />
            <WrongMark x={ghostEnd(wrong, cur.a, cur.b)[0] + 10} y={ghostEnd(wrong, cur.a, cur.b)[1] + 5} size={12} />
          </g>
        )}
        {round > 0 && (
          <Ripple key={`ok${round}`} at={[(RideVt.parts[round - 1].a[0] + RideVt.parts[round - 1].b[0]) / 2, (RideVt.parts[round - 1].a[1] + RideVt.parts[round - 1].b[1]) / 2]} r={18} />
        )}
      </Sheet>
      {!done ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-sm">
          <span className="mr-0.5 font-mono font-bold text-cat-amber">{cur.name}:</span>
          {RideVt.tags.map((tg, i) => (
            <button key={tg} type="button" className={chip(false)} onClick={() => tap(i)}>
              {tg}
            </button>
          ))}
        </div>
      ) : (
        <div className={`mt-3 text-center text-sm font-semibold text-accent-text ${FADE}`}>উঠছে: ত্বরণ। সমান: 0। নামছে: মন্দন।</div>
      )}
      {!done && wrong !== null && (
        <Nope key={miss}>{`${RideVt.tags[wrong]} হলে লাইন ${X6_SHAPE[wrong]}, এই লাল দাগের মতো। কিন্তু ${cur.name}-তে লাইন ${X6_ACT[X6_RIGHT[round]]}।`}</Nope>
      )}
      <Task done={done}>graph-এর প্রতিটা অংশে কী হচ্ছে, বলে দিন: ত্বরণ আছে, ত্বরণ 0, নাকি মন্দন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The stone on a string, EP 08's: it goes round at one speed. Is there
// ত্বরণ? Each pick plays a round: "no" lets the stone fly off straight along
// its arrow (no change of velocity); "speed grows" goes round with the speed
// needle never moving; "the direction changes" leaves the four arrows behind.

const X7_C: P = [92, 90];
const X7_R = 52;
const X7_OPTS = ["নেই: দ্রুতি তো একই থাকে", "আছে: দ্রুতি বাড়ছে", "আছে: বেগের দিক বদলাচ্ছে"];
const X7_RIGHT = 2;
const X7_NOPE = [
  "ত্বরণ না থাকলে বেগ বদলাতো না: ঢিল সোজা তীর বরাবর চলে গেলো। কিন্তু সুতায় বাঁধা ঢিল ঘোরে, তীরের দিক বদলায়।",
  "দ্রুতি দেখুন: পুরো এক পাক 3 m/s-ই থাকলো, needle নড়েনি। তাহলে বেগের কোন অংশটা বদলালো?",
  "",
];
const X7_MS = 1600; // one round at one speed: a linear clock
const stoneAt = (phi: number): P => [X7_C[0] + X7_R * Math.cos(phi), X7_C[1] - X7_R * Math.sin(phi)];
const stoneDir = (phi: number): P => [-Math.sin(phi), -Math.cos(phi)];
const X7_QUARTER = ["উপরের দিকে", "বাঁ দিকে", "নিচের দিকে", "ডান দিকে"];

export function StoneSpin() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X7_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.5);
    walk.start(() => {
      if (i === X7_RIGHT) {
        sfx.chime();
        pass("দিক বদলালেও বেগ বদলায়, তাই ত্বরণ।");
      } else setMiss((m) => m + 1);
    });
  };
  const u = pick === null ? 0 : walk.running ? walk.t : 1;
  const end = pick !== null && !walk.running;
  const right = end && pick === X7_RIGHT;
  const straight = pick === 0;
  const phi = straight ? 0 : 2 * Math.PI * u;
  const at: P = straight ? [X7_C[0] + X7_R, X7_C[1] - 50 * u] : stoneAt(phi);
  const dir = straight ? ([0, -1] as P) : stoneDir(phi);
  const passed = pick === X7_RIGHT ? [0, 1, 2, 3].filter((q) => q === 0 || phi >= (q * Math.PI) / 2 - 1e-6) : [];
  return (
    <>
      <Sheet w={300} h={176} label="ছাদে সুতায় বাঁধা ঢিল, একটা বৃত্তে ঘোরে। ঢিলের গায়ে বেগের তীর। ডানে দ্রুতির speedometer।">
        <circle cx={X7_C[0]} cy={X7_C[1]} r={X7_R} fill="none" stroke={PH.amber} strokeWidth={1} strokeDasharray="3 3" />
        {passed.map((q) => {
          const p = stoneAt((q * Math.PI) / 2);
          const d = stoneDir((q * Math.PI) / 2);
          return <PArrow key={q} a={p} b={[p[0] + d[0] * 26, p[1] + d[1] * 26]} tone="mint" w={2} opacity={0.45} tell={`3 m/s, ${X7_QUARTER[q]}`} />;
        })}
        {!(straight && u > 0) && <path d={`M${X7_C[0]} ${X7_C[1]}L${at[0]} ${at[1]}`} stroke={PH.ink} strokeWidth={0.9} />}
        <circle cx={X7_C[0] + 1} cy={X7_C[1] + 1.8} r={5} fill={PH.ink} opacity={0.1} />
        <circle cx={X7_C[0]} cy={X7_C[1]} r={5} fill="#d9a273" stroke={PH.ink} strokeWidth={1} />
        <Txt x={X7_C[0]} y={X7_C[1] + 16} size={8} color={PH.mute}>
          হাত
        </Txt>
        <PArrow a={at} b={[at[0] + dir[0] * 28, at[1] + dir[1] * 28]} tone={straight && end ? "red" : "mint"} w={2.4} tell={!walk.running ? `3 m/s, ${X7_QUARTER[0]}` : false} />
        <circle cx={at[0] + 1.3} cy={at[1] + 2.3} r={6.5} fill={PH.ink} opacity={0.1} />
        <circle cx={at[0]} cy={at[1]} r={6.5} fill="#a39584" stroke={right ? PH.mint : PH.ink} strokeWidth={right ? 2 : 1} />
        <circle cx={at[0] - 2} cy={at[1] - 2} r={1.8} fill="#e7e0d6" />
        {right && <Ripple at={at} r={22} />}
        {straight && end && <WrongMark key={miss} x={at[0] + 16} y={at[1] + 5} />}
        <Txt x={228} y={34} size={9} color={PH.mute}>
          দ্রুতি
        </Txt>
        {pick === 1 && end && <circle cx={228} cy={74} r={36} fill="none" stroke={PH.red} strokeWidth={1.6} className={POP} />}
        {pick === 1 && end && <WrongMark key={miss} x={272} y={50} />}
        <Gauge x={228} y={78} r={28} v={3} max={6} />
        {right && (
          <g>
            <TickMark x={42} y={164} />
            <Txt x={54} y={168} size={11} weight={800} anchor="start" color={PH.mint} className={FADE}>
              ত্বরণ আছে
            </Txt>
            <Tag x={160} y={164} text="ত্বরণ: vector" tone="mint" solid size={9} pop />
          </g>
        )}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X7_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && end ? (i === X7_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {end && pick !== X7_RIGHT && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={right}>ঢিলটা একই দ্রুতিতে ঘোরে। এখানে কি ত্বরণ আছে? বেছে নিন, তারপর এক পাক ঘুরিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8a · Figure for screen 8's setup: 100 km/h into m/s, the video's sum.

const S8_SAY = ["100 km/h: এক ঘণ্টায় 100 km।", "100 km মানে 100000 m, এক ঘণ্টা মানে 3600 s।", "ভাগ করলে প্রায় 27.8 m/s।"];

export function KmhToMs({}: Story) {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S8_SAY[k]}</span>}>
      <Sheet w={260} h={96} label="100 km/h সমান 100000 m ভাগ 3600 s, প্রায় 27.8 m/s।" className="max-w-[17rem]">
        <Txt x={130} y={30} size={16} weight={800}>
          100 km/h
        </Txt>
        {k >= 1 && (
          <g className={FADE}>
            <Txt x={130} y={56} size={13} weight={700}>
              = 100000 m / 3600 s
            </Txt>
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <rect x={76} y={66} width={108} height={24} rx={12} fill={PH.mintSoft} stroke={PH.mint} strokeWidth={1.2} />
            <Txt x={130} y={83} size={13} weight={800} color={PH.mint}>
              ≈ 27.8 m/s
            </Txt>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// 8 · Your turn: the ad car's ত্বরণ. Three values; each drives the car six
// seconds from rest at that rate, its needle against the 100 km/h mark.

const X8_OPTS = ["16.7 m/s²", "4.6 m/s²", "167 m/s²"];
const X8_A = [100 / 6, 27.8 / 6, 27.8 * 6];
const X8_RIGHT = 1;
const X8_TOP = 27.8;
const X8_NOPE = [
  "100 ভাগ 6, km/h রেখেই। গাড়ি 2 সেকেন্ডের আগেই 100 km/h পেরিয়ে গেলো। আগে 100 km/h-কে m/s-এ নিন: 27.8।",
  "",
  "এটা 27.8 গুণ 6। প্রথম সেকেন্ডেই 100 km/h পেরিয়ে গেলো। ত্বরণ মানে বেগের বদল, ভাগ সময়।",
];
const X8_PX = 220 / ((X8_TOP / 6) * 18); // units per metre: the right run, ≈ 83 m, ends at x 254

export function AdRate() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // six seconds on a steady clock; from rest the car's place is ½at², so it speeds up as t²
  const walk = useWalk(2400, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.8);
    walk.start(() => {
      if (i === X8_RIGHT) {
        sfx.chime();
        pass("27.8 ÷ 6 ≈ 4.6 m/s².");
      } else setMiss((m) => m + 1);
    });
  };
  const tau = pick === null ? 0 : walk.running ? 6 * walk.t : 6;
  const a = pick === null ? 0 : X8_A[pick];
  const v = a * tau;
  const xAt = (tt: number) => Math.min(360, 34 + (a * tt * tt * X8_PX) / 2);
  const cx = xAt(tau);
  const end = pick !== null && !walk.running;
  const right = end && pick === X8_RIGHT;
  const over = v > X8_TOP + 0.2;
  const ang = Math.PI * (1 - X8_TOP / 30);
  return (
    <>
      <Sheet w={300} h={152} label="বিজ্ঞাপনের গাড়ি রাস্তায়, থেমে আছে। নিচে speedometer, তাতে 100 km/h-এর দাগ। যে ত্বরণ বাছবেন, সেই হারে 6 সেকেন্ড চলবে।">
        <path d="M8 62H292" stroke="#a8a29e" strokeWidth={4} strokeLinecap="round" />
        {pick !== null && <SecondMarks upTo={tau} at={xAt} y={62} />}
        <AdCar x={cx} y={62} s={0.8} />
        {end && !right && cx > 280 && <WrongMark key={miss} x={286} y={40} />}
        {right && <Ripple at={[70 + Math.cos(ang) * 27, 126 - Math.sin(ang) * 27]} r={18} />}
        <Gauge x={70} y={126} r={26} v={v} max={30} tone={over ? "red" : "amber"} />
        <path d={`M${70 + Math.cos(ang) * 22} ${126 - Math.sin(ang) * 22}L${70 + Math.cos(ang) * 32} ${126 - Math.sin(ang) * 32}`} stroke={PH.mint} strokeWidth={2.4} strokeLinecap="round" />
        <Txt x={104} y={112} size={8} anchor="start" color={PH.mint} weight={700}>
          100 km/h
        </Txt>
        <Txt x={206} y={106} size={11} weight={700}>
          {`t = ${fmt(tau)} s`}
        </Txt>
        {pick !== null && over && (
          <g className={FADE}>
            <Txt x={206} y={130} size={9.5} weight={700} color={PH.red}>
              {tau < 6 ? "6 s-এর আগেই 100 km/h পার" : "100 km/h পেরিয়ে গেলো"}
            </Txt>
          </g>
        )}
        {right && (
          <g className={FADE}>
            <Txt x={206} y={130} size={9.5} weight={700} color={PH.mint}>
              ঠিক 6 s-এ 100 km/h
            </Txt>
          </g>
        )}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X8_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && end ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="font-mono font-bold">{`a = ${o}`}</span>
          </Choice>
        ))}
      </div>
      {end && pick !== X8_RIGHT && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={right}>গাড়িটা 6 সেকেন্ডে 0 থেকে 27.8 m/s-এ ওঠে। ওর ত্বরণ কত? বেছে নিন, গাড়ি চালিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9a · The closing story scene: the ad again. The ? on the arrow becomes
// 4.6 m/s², named ত্বরণ, and the recap card comes up under the board.

export function AdAnswer({}: Story) {
  const s = useScene(3, [600, 1400, 1400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="আবার সেই বিজ্ঞাপন। তীরের ? জায়গায় এখন 4.6 m/s², নাম ত্বরণ। নিচে লেখা: ত্বরণ মানে প্রতি সেকেন্ডে বেগের বদল।">
        <StageBoard answer={k >= 1} gone={k >= 1} />
        {k >= 2 && <Tag x={115} y={50} text="ত্বরণ" tone="mint" solid size={10} pop />}
        {k >= 3 && (
          <g className={POP}>
            <rect x={36} y={118} width={248} height={28} rx={8} fill="#fff" stroke={PH.mint} strokeWidth={1.6} />
            <Txt x={160} y={137} size={12} weight={800} color={PH.ink}>
              ত্বরণ = প্রতি সেকেন্ডে বেগের বদল
            </Txt>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 9b · The next journey's teaser: the bridge slope again, তিথি rolling down
// it, and a ? at its foot: কতদূর?

export function BridgeTeaser({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  const at = k === 0 ? BR_TOP : slopeAt(160);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="ব্রিজের ঢাল। তিথি ঢাল বেয়ে নামছে। ঢালের গোড়ায় একটা প্রশ্ন: কতদূর?">
        <BridgeSide sign={false} />
        {k >= 1 && <path d={`M${BR_TOP[0]} ${BR_DECK - 3}L${at[0]} ${at[1] - 3}`} stroke={PH.cream} strokeWidth={2.4} strokeDasharray="0.1 4.5" strokeLinecap="round" className={FADE} />}
        <StageBike x={at[0]} y={at[1]} deg={k === 0 ? 0 : BR_ANG} spin={k * 200} ease="in" />
        {k >= 2 && (
          <g className={POP}>
            <Txt x={BR_FOOT[0] + 8} y={BR_FOOT[1] - 14} size={22} weight={800} color={PH.amber}>
              ?
            </Txt>
            <Tag x={BR_FOOT[0] + 50} y={BR_FOOT[1] - 20} text="কতদূর?" tone="amber" size={10} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  AdBoast: { a: { k: 0 }, end: {} },
  AdBet: { start: {}, sealed: { bet: 2 } },
  SchoolOut: { a: { k: 0 }, end: {} },
  SpeedLog: { start: {}, mid: { sec: 3 }, done: { sec: 5 } },
  RateFormula: {
    start: {},
    fast: { v: 5, u: 0, t: 1, sent: { v: 5, u: 0, t: 1 } },
    part: { v: 3, u: 0, t: 3, sent: { v: 3, u: 0, t: 3 } },
    right: { v: 5, u: 0, t: 5, sent: { v: 5, u: 0, t: 5 } },
  },
  UnitPick: { start: {}, dropped: { pick: 0 }, cancel: { pick: 2 }, right: { pick: 1 } },
  DimBuild: { a: { k: 1 }, end: {} },
  SlopeCorner: { a: { k: 0 }, b: { k: 1 }, end: {} },
  BrakePick: { start: {}, flip: { pick: 0 }, nodiv: { pick: 1 }, right: { pick: 2 } },
  RideGraph: { start: {}, wrongB: { round: 1, wrong: 0 }, wrongA: { round: 0, wrong: 2 }, d: { round: 3 }, done: { round: 4 } },
  StoneSpin: { start: {}, straight: { pick: 0 }, speed: { pick: 1 }, right: { pick: 2 } },
  KmhToMs: { a: { k: 0 }, end: {} },
  AdRate: { start: {}, kmh: { pick: 0 }, times: { pick: 2 }, right: { pick: 1 } },
  AdAnswer: { a: { k: 1 }, end: {} },
  BridgeTeaser: { a: { k: 0 }, end: {} },
};
