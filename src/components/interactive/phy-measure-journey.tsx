"use client";

import { useRef, useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, primaryBtn, quietBtn, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { Bicycle, Gauge, PH, Ripple, Sheet, Tag, Txt, WrongMark, useWalk } from "@/components/interactive/phy-kit";
import { Rickshaw } from "@/components/interactive/phy-rest-journey";
import { NoIcon } from "@/components/interactive/phy-graphs-journey";

// Screens for "Physics for High School 15 — নিজে মাপুন: রিকশার দ্রুতি"
// (src/content/articles/physics_for_high_school/chapter_2/15_measure_speed.mdx), the
// journey of video EP 15 (physics_9_10/chapter-2/15-measure-speed/script.md).
// Book অনুসন্ধান ২.০৩, pp. 57–58. The last journey of chapter 2.
//
// The spine: a rickshaw on the road, no speedometer, no stopwatch. Can we
// still say how fast it goes? The reader bets ঘণ্টায় 5, 18 or 40 km
// (SpeedBet), settled on the last screen. On the way, the video's own
// beats: তিথি's homework, speed = distance ÷ time, so both must be measured
// (WhatToMeasure); her own step, 10 steps = 6 m → 60 cm (StepLength), and why
// ten (TenSteps); 167 steps between two lamp posts ≈ 100 m (PostToPost); the
// old trick "এক হাজার এক" (CountAloud), counting from post to post: 20
// (CountPosts); 100 ÷ 20 = 5 m/s = 18 km/h (PerHour); a bicycle in 12 s,
// 8.3 m/s (CycleSpeed) and the table (SpeedTable); and the reader's own
// count against a real stopwatch (CountYourself).
//
// Canon: 10 steps = 6 m → 0.6 m a step; 167 × 0.6 = 100.2 ≈ 100 m; রিকশা
// 100/20 = 5 m/s = 18 km/h; সাইকেল 100/12 ≈ 8.3 m/s; পথচারী 100/70 ≈ 1.4 m/s.

type Story = { story?: boolean };

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
/** Bangla number words, for counting out loud: BN[n]. */
const BN = ["শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ", "এগারো", "বারো", "তেরো", "চোদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ", "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আটাশ", "উনত্রিশ", "ত্রিশ"];

/** What the drawing says after it has answered: the words come a beat after the picture. */
function Later({ children, ms = 450 }: { children: ReactNode; ms?: number }) {
  return (
    <g style={{ transitionDelay: `${ms}ms` }} className={`pointer-events-none ${FADE}`}>
      {children}
    </g>
  );
}

/** An arrowhead pointing right at (x, y): it went off the edge of the paper. */
function RightHead({ x, y, color }: { x: number; y: number; color: string }) {
  return <path d={`M${x} ${y}l-8 -5v10Z`} fill={color} className="pointer-events-none" />;
}

// ---------------------------------------------------------------------------
// The street: a strip of pavement, the road, and the two lamp posts 100 m
// apart that every measurement on it uses. `M` is units per metre.

const ST = { W: 300, H: 150, WALK: 96, ROAD: 104, ROAD_B: 126 } as const;
const ST_BG = "#f3f6f9";

/** A lamp post standing on (x, y). `lit` = the one the reader is waiting for. */
function LampPost({ x, y, lit = false, label }: { x: number; y: number; lit?: boolean; label?: string }) {
  const c = lit ? PH.mint : "#55657f";
  return (
    <g className="pointer-events-none">
      <ellipse cx={x} cy={y + 1} rx={7} ry={1.6} fill={PH.ink} opacity={0.12} />
      <rect x={x - 3} y={y - 4} width={6} height={4} rx={1} fill={c} />
      <path d={`M${x} ${y - 3}V${y - 56}`} stroke={c} strokeWidth={2.6} />
      <path d={`M${x} ${y - 55}q0 -7 8 -6`} stroke={c} strokeWidth={2} fill="none" />
      <path d={`M${x + 4} ${y - 64}h10l-2 4h-6Z`} fill="#3a4a66" />
      <ellipse cx={x + 9} cy={y - 59.5} rx={3.4} ry={1.5} fill="#fbbf24" />
      {label && (
        <Txt x={x} y={y - 68} size={8} color={lit ? PH.mint : PH.mute} weight={700}>
          {label}
        </Txt>
      )}
    </g>
  );
}

function Street({ label, posts = [], lit = [], className = "max-w-[19rem]", h = ST.H, children }: { label: string; posts?: number[]; lit?: boolean[]; className?: string; h?: number; children?: ReactNode }) {
  return (
    <Sheet w={ST.W} h={h} label={label} bg={ST_BG} className={className}>
      <rect x={1.5} y={ST.WALK} width={ST.W - 3} height={ST.ROAD - ST.WALK} fill="#e7e2d6" />
      <rect x={1.5} y={ST.ROAD} width={ST.W - 3} height={ST.ROAD_B - ST.ROAD} fill="#d6d3cb" />
      <path d={`M6 ${(ST.ROAD + ST.ROAD_B) / 2}H${ST.W - 6}`} stroke="#fff" strokeWidth={1} strokeDasharray="6 6" />
      {posts.map((x, i) => (
        <LampPost key={x} x={x} y={ST.WALK + 2} lit={lit[i]} label={`পোস্ট ${i + 1}`} />
      ))}
      {children}
    </Sheet>
  );
}

const RICK_Y = ST.ROAD_B - 3;

/** A footprint, toes to the right, centred at (x, y). */
function Foot({ x, y, tone = PH.ink, opacity = 0.55 }: { x: number; y: number; tone?: string; opacity?: number }) {
  return (
    <g opacity={opacity} className="pointer-events-none">
      <ellipse cx={x} cy={y} rx={3.6} ry={1.9} fill={tone} />
      <circle cx={x + 4.6} cy={y - 0.2} r={1} fill={tone} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: a rickshaw rolls down the street; above it a
// crossed-out speedometer and a crossed-out stopwatch; an amber ?.

export function NoMeter({}: Story) {
  const s = useScene(2, [600, 1700]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="রাস্তা দিয়ে একটা রিকশা যাচ্ছে। উপরে একটা speedometer আর একটা stopwatch, দুটোই লাল দাগে কাটা। পাশে প্রশ্ন: কত জোরে?">
        <rect y={150} width={320} height={4} fill="#e7e2d6" />
        <path d="M0 167H320" stroke="#fff" strokeWidth={1.2} strokeDasharray="8 8" />
        <g style={{ transform: `translateX(${k >= 1 ? 160 : 0}px)` }} className="transition-transform duration-[1800ms] ease-linear motion-reduce:transition-none">
          <Rickshaw x={60} y={174} s={0.3} spin={k >= 1 ? 500 : 0} />
        </g>
        {k >= 1 && <NoIcon x={120} y={50} kind="dial" />}
        {k >= 1 && <NoIcon x={158} y={50} kind="watch" />}
        {k >= 2 && (
          <g className={POP}>
            <Txt x={200} y={60} size={26} color={PH.amber} weight={800}>
              ?
            </Txt>
          </g>
        )}
        {k >= 2 && <Tag x={250} y={44} text="কত জোরে?" tone="amber" size={10.5} solid pop />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: how fast is the rickshaw, in km an hour? The pick sets
// a see-through needle on a speedometer, with a "?", and rolls the rickshaw
// a little, faster for a bigger guess. Not marked.

const X1_BETS = [
  { text: "ঘণ্টায় প্রায় 5 km", kmh: 5 },
  { text: "ঘণ্টায় প্রায় 18 km", kmh: 18 },
  { text: "ঘণ্টায় প্রায় 40 km", kmh: 40 },
];

export function SpeedBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const walk = useWalk(1400, { steps: false, ease: "linear" });
  const kmh = bet === null ? 0 : X1_BETS[bet].kmh;
  const p = bet === null ? 0 : walk.running ? walk.t : 1;
  const x = 46 + kmh * 4 * p;
  return (
    <>
      <Street label="রাস্তায় একটা রিকশা, পাশে একটা speedometer। বাজি ধরলে কাঁটা সেই দ্রুতিতে যায়, পাশে একটা প্রশ্নবোধক চিহ্ন।">
        <Rickshaw x={x} y={RICK_Y} s={0.22} spin={kmh * 30 * p} />
        <g opacity={bet === null ? 0.35 : 0.8}>
          <Gauge x={232} y={52} r={24} v={kmh} max={50} unit="km/h" digits={0} tone="blue" settle />
        </g>
        {bet !== null && (
          <g key={bet} style={{ transitionDelay: "650ms" }} className={POP}>
            <Tag x={276} y={30} text="?" tone="blue" size={11} solid />
          </g>
        )}
      </Street>
      <div className="mt-2 grid gap-1.5">
        {X1_BETS.map((o, i) => (
          <Choice
            key={o.text}
            n={i}
            look={bet === i ? "picked" : bet !== null ? "dim" : "idle"}
            disabled={bet !== null}
            onClick={() => {
              setBet(i);
              sfx.stamp();
              walk.start();
              pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।");
            }}
          >
            {o.text}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>রিকশাটা কত জোরে যাচ্ছে বলে আপনার মনে হয়? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2a · Story scene for screen 2: তিথি with a ruler; the homework card;
// she thinks, দ্রুতি মানে দূরত্ব ভাগ সময়.

export function HomeworkCard({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="তিথির হাতে একটা স্কেল। সামনে homework-এর কাগজ: রাস্তার যানবাহনের দ্রুতি মাপো। তিথি ভাবছে, দ্রুতি মানে দূরত্ব ভাগ সময়।">
        <Person who="tithi" x={84} y={150} arm="hold" />
        <rect x={86} y={104} width={44} height={5} rx={1} fill="#fde68a" stroke={PH.ink} strokeWidth={0.7} transform="rotate(-20 94 106)" />
        {k >= 1 && (
          <g className={POP}>
            <rect x={170} y={70} width={124} height={62} rx={4} fill="#fff" stroke={PH.ink} strokeWidth={0.9} transform="rotate(3 232 101)" />
            <Txt x={232} y={90} size={9} color={PH.mute}>
              homework
            </Txt>
            <Txt x={232} y={108} size={10} weight={800}>
              যানবাহনের দ্রুতি
            </Txt>
            <Txt x={232} y={122} size={10} weight={800}>
              মাপো
            </Txt>
          </g>
        )}
        {k >= 2 && <Bubble x={96} y={58} tone="think" lines={["দ্রুতি মানে", "দূরত্ব ভাগ সময়।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// The formula card: দ্রুতি = দূরত্ব ÷ সময়, with a box for each.

type Slot = { text: string; tone: "mint" | "red" | "amber" } | null;

function FormulaCard({ d, t, result }: { d: Slot; t: Slot; result?: Slot }) {
  const box = (x: number, s: Slot, name: string) => (
    <g>
      <rect x={x} y={28} width={78} height={30} rx={6} fill={s ? (s.tone === "mint" ? PH.mintSoft : s.tone === "red" ? PH.redSoft : PH.amberSoft) : "#fff"} stroke={s ? (s.tone === "mint" ? PH.mint : s.tone === "red" ? PH.red : PH.amber) : PH.faint} strokeWidth={1.2} strokeDasharray={s ? undefined : "4 3"} className="transition-[fill,stroke] duration-300 motion-reduce:transition-none" />
      {s && (
        <g key={s.text} className={POP}>
          <Txt x={x + 39} y={47} size={11} weight={800} color={s.tone === "mint" ? PH.mint : s.tone === "red" ? PH.red : PH.amber}>
            {s.text}
          </Txt>
        </g>
      )}
      <Txt x={x + 39} y={72} size={8.5} color={PH.mute}>
        {name}
      </Txt>
    </g>
  );
  return (
    <g className="pointer-events-none">
      <Txt x={42} y={47} size={12} weight={800}>
        দ্রুতি
      </Txt>
      <Txt x={78} y={47} size={13} weight={700}>
        =
      </Txt>
      {box(92, d, "দূরত্ব")}
      <Txt x={184} y={47} size={13} weight={700}>
        ÷
      </Txt>
      {box(198, t, "সময়")}
      {result && (
        <g key={result.text} className={POP}>
          <Tag x={150} y={92} text={result.text} tone={result.tone} size={10} solid />
        </g>
      )}
    </g>
  );
}

// 2 · What must she measure? Each pick fills the boxes it would fill; an
// empty box stays a red "?", and so does the speed.

const X2_OPTS = ["শুধু দূরত্ব, স্কেল তো আছেই", "শুধু সময়", "দূরত্ব আর সময়, দুটোই"];
const X2_RIGHT = 2;
const X2_NOPE = ["সময়ের ঘর খালি রইলো। ভাগ করবো কী দিয়ে? দ্রুতি বের হলো না।", "দূরত্বের ঘর খালি। কতটা পথ গেলো না জানলে, কত জোরে গেলো সেটাও জানা যায় না।", ""];
const MEASURE: Slot = { text: "মাপবো", tone: "mint" };
const MISSING: Slot = { text: "?", tone: "red" };

export function WhatToMeasure() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(700, { steps: false });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pencil(0.3);
    walk.start(() => {
      if (i === X2_RIGHT) {
        sfx.chime();
        pass("দূরত্ব আর সময়, দুটোই নিজে মাপতে হবে।");
      } else setMiss((m) => m + 1);
    });
  };
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X2_RIGHT;
  const d = pick === null ? null : pick === 1 ? (settled ? MISSING : null) : MEASURE;
  const t = pick === null ? null : pick === 0 ? (settled ? MISSING : null) : walk.running ? null : MEASURE;
  const result: Slot | undefined = !settled ? undefined : right ? { text: "দ্রুতি বের করা যাবে", tone: "mint" } : { text: "দ্রুতি = ?", tone: "red" };
  return (
    <>
      <Sheet w={300} h={112} label="দ্রুতি = দূরত্ব ÷ সময়, দূরত্ব আর সময়ের জন্য দুইটা খালি ঘর। বেছে নেওয়া উত্তর যে ঘর মাপবে সেটা ভরে, বাকিটা লাল প্রশ্নবোধক।" className="max-w-[19rem]">
        <FormulaCard d={d} t={t} result={result} />
        {right && <Ripple at={[150, 43]} r={26} />}
      </Sheet>
      <div className="mt-2 grid gap-1.5">
        {X2_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && settled ? (i === X2_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {settled && pick !== X2_RIGHT && <Nope key={miss}>{X2_NOPE[pick]}</Nope>}
      <Task done={right}>রিকশার দ্রুতি বের করতে তিথিকে নিজে কী কী মাপতে হবে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Her own step. Ten steps cover the 6 m on the tape. How long is one?
// Each pick walks তিথি ten steps of that length: 6 cm barely leaves the 0,
// 6 m runs off the tape on the first step, 60 cm lands on 6 m exactly.

const X3_OPTS = [
  { m: 0.06, show: "6 cm" },
  { m: 0.6, show: "60 cm" },
  { m: 6, show: "6 m" },
];
const X3_RIGHT = 1;
const X3_NOPE = ["দশ পা হেঁটে তিথি মোটে 60 cm গেলো, ফিতার 6 m-এর ধারেকাছেও না। 0.6 m কত সেন্টিমিটার?", "", "প্রথম পা-তেই ফিতা শেষ! 6 m তো দশ পায়ের মাপ, একেক পায়ের না।"];
const X3_X0 = 30;
const X3_PXM = 40;
const X3_Y = 92;

function Tape({ x0, pxm, metres, y }: { x0: number; pxm: number; metres: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x0 - 4} y={y} width={metres * pxm + 8} height={12} rx={2} fill="#fde68a" stroke="#b08a4a" strokeWidth={0.8} />
      {Array.from({ length: metres + 1 }, (_, i) => (
        <g key={i}>
          <path d={`M${x0 + i * pxm} ${y}v6`} stroke={PH.ink} strokeWidth={0.9} />
          <Txt x={x0 + i * pxm} y={y + 22} size={8} color={PH.mute}>
            {`${i} m`}
          </Txt>
        </g>
      ))}
    </g>
  );
}

export function StepLength() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // ten even steps on a linear clock, a footstep sound each
  const walk = useWalk(1700, { ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    walk.start(() => {
      if (i === X3_RIGHT) {
        sfx.chime();
        pass("6 m ÷ 10 = 0.6 m, একেক পা 60 cm।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? 0 : walk.running ? walk.t : 1;
  const len = pick === null ? 0 : X3_OPTS[pick].m;
  const n = Math.min(10, Math.floor(p * 10 + 1e-6));
  const xNow = X3_X0 + p * 10 * len * X3_PXM;
  const off = xNow > ST.W - 14;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X3_RIGHT;
  return (
    <>
      <Sheet w={ST.W} h={136} label="মাটিতে 6 m লম্বা একটা ফিতা। তিথি শূন্য থেকে দশ পা হাঁটে, বেছে নেওয়া মাপের পা ফেলে। পায়ের ছাপ পড়ে।" bg={ST_BG} className="max-w-[19rem]">
        <Tape x0={X3_X0} pxm={X3_PXM} metres={6} y={X3_Y} />
        {Array.from({ length: n }, (_, i) => {
          const fx = X3_X0 + (i + 1) * len * X3_PXM;
          return fx < ST.W - 8 ? <Foot key={i} x={fx - 3} y={i % 2 ? X3_Y + 9 : X3_Y + 3} tone={right ? PH.mint : PH.ink} /> : null;
        })}
        {!off && <Person who="tithi" x={xNow} y={X3_Y - 1} scale={0.55} walking={walk.running} ms={0} />}
        {off && <RightHead x={ST.W - 6} y={X3_Y - 20} color={PH.red} />}
        <Txt x={16} y={22} size={9} anchor="start" color={PH.mute}>
          {`পা: ${n} / 10`}
        </Txt>
        {pick !== null && (
          <Txt x={16} y={36} size={9} anchor="start" weight={700} color={settled ? (right ? PH.mint : PH.red) : PH.ink}>
            {`একেক পা ${X3_OPTS[pick].show}`}
          </Txt>
        )}
        {settled && !right && <WrongMark x={off ? ST.W - 20 : xNow + 14} y={X3_Y - 30} />}
        {right && <Ripple at={[X3_X0 + 6 * X3_PXM, X3_Y + 6]} r={20} />}
        {right && (
          <Later>
            <Tag x={X3_X0 + 6 * X3_PXM - 30} y={24} text="10 পা = 6 m" tone="mint" size={9.5} solid />
          </Later>
        )}
      </Sheet>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X3_OPTS.map((o, i) => (
          <Choice key={o.show} n={i} look={pick === i && settled ? (i === X3_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="font-mono text-sm font-semibold whitespace-nowrap">{o.show}</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X3_RIGHT && <Nope key={miss}>{X3_NOPE[pick]}</Nope>}
      <Task done={right}>দশ পা হেঁটে তিথি মাপলো 6 m। একেক পা কত লম্বা? বেছে নিন, তিথি সেই মাপে দশ পা হাঁটবে।</Task>
    </>
  );
}

// 3½ · Figure for screen 3's explanation: why ten. One step measured carries
// the whole wobble of the measurement; ten steps carry the same wobble once,
// at the far end; divided by ten, each step gets a tenth of it. No numbers.

const S3_SAY = ["একটা পা মাপলে, মাপের ভুলটা পুরোটাই ওই এক পায়ে।", "দশ পা মাপলেও ভুল হয় ওই একবারই, শেষ মাথায়।", "দশ দিয়ে ভাগ করলে, ভুলটাও দশ ভাগ হয়ে যায়।"];
const S3_X0 = 34;
const S3_STEP = 23;
const S3_BAND = 14;

export function TenSteps({}: Story) {
  const s = useScene(2, [600, 1700]);
  const k = s.k;
  const end2 = S3_X0 + 10 * S3_STEP;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S3_SAY[k]}</span>}>
      <Sheet w={300} h={120} label="উপরে একটা পায়ের ছাপ, তার মাথায় একটা চওড়া amber দাগ: মাপের ভুল। নিচে দশটা ছাপ, ভুলের দাগ একবারই, তারপর সেটা দশটা সরু দাগে ভাগ হয়ে প্রতিটা পায়ে যায়।" className="max-w-[18rem]">
        <path d={`M${S3_X0} 42H${S3_X0 + S3_STEP}`} stroke={PH.faint} strokeWidth={1} />
        <Foot x={S3_X0 + S3_STEP - 4} y={36} />
        <rect x={S3_X0 + S3_STEP - S3_BAND / 2} y={26} width={S3_BAND} height={20} rx={3} fill={PH.amber} opacity={0.3} />
        <Txt x={S3_X0 + S3_STEP + 20} y={40} size={8} anchor="start" color={PH.mute}>
          এক পা
        </Txt>
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M${S3_X0} 92H${end2}`} stroke={PH.faint} strokeWidth={1} />
            {Array.from({ length: 10 }, (_, i) => (
              <Foot key={i} x={S3_X0 + (i + 1) * S3_STEP - 4} y={i % 2 ? 90 : 84} />
            ))}
            {k === 1 && <rect x={end2 - S3_BAND / 2} y={74} width={S3_BAND} height={22} rx={3} fill={PH.amber} opacity={0.3} />}
            <Txt x={S3_X0} y={110} size={8} anchor="start" color={PH.mute}>
              দশ পা
            </Txt>
          </g>
        )}
        {k >= 2 &&
          Array.from({ length: 10 }, (_, i) => (
            <g key={i} style={{ transitionDelay: `${i * 70}ms` }} className={FADE}>
              <rect x={S3_X0 + (i + 1) * S3_STEP - S3_BAND / 20} y={74} width={S3_BAND / 10} height={22} rx={0.6} fill={PH.amber} opacity={0.65} />
            </g>
          ))}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · Post to post. তিথি's 167 steps run between the two lamp posts. How many
// metres? Each pick unrolls a tape of that length from post 1: 17 m stops a
// short way out, 167 m runs past post 2 and off the street, 100 m stops on
// post 2.

const X4_P1 = 60;
const X4_P2 = 240;
const X4_PXM = (X4_P2 - X4_P1) / 100;
const X4_OPTS = [
  { m: 17, show: "প্রায় 17 m" },
  { m: 100, show: "প্রায় 100 m" },
  { m: 167, show: "167 m" },
];
const X4_RIGHT = 1;
const X4_NOPE = ["ফিতা মাঝপথেই ফুরিয়ে গেলো। 167 পা, একেক পা 0.6 m: এখানে ভাগ না, গুণ।", "", "ফিতা দ্বিতীয় পোস্ট ছাড়িয়ে চলে গেলো। 167 তো পায়ের সংখ্যা, মিটার না। একেক পা মোটে 0.6 m।"];
const X4_TAPE_Y = 110;

export function PostToPost() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(1400, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(1);
    walk.start(() => {
      if (i === X4_RIGHT) {
        sfx.chime();
        pass("167 × 0.6 ≈ 100 m।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? 0 : walk.running ? walk.t : 1;
  const L = pick === null ? 0 : X4_OPTS[pick].m;
  const tip = X4_P1 + L * p * X4_PXM;
  const off = tip > ST.W - 10;
  const shown = Math.min(tip, ST.W - 10);
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X4_RIGHT;
  const c = settled ? (right ? PH.mint : PH.red) : PH.amber;
  return (
    <>
      <Street label="রাস্তার পাশে দুইটা ল্যাম্পপোস্ট, মাঝে তিথির 167টা পায়ের ছাপ। বেছে নেওয়া দৈর্ঘ্যের একটা ফিতা প্রথম পোস্ট থেকে খোলে।" posts={[X4_P1, X4_P2]} lit={[false, right]}>
        {Array.from({ length: 30 }, (_, i) => (
          <Foot key={i} x={X4_P1 + 4 + i * 6} y={i % 2 ? 99 : 101.5} opacity={0.35} />
        ))}
        <Tag x={(X4_P1 + X4_P2) / 2} y={72} text="167 পা" tone="ink" size={9.5} />
        {pick !== null && shown > X4_P1 + 1 && (
          <g className="pointer-events-none">
            <rect x={X4_P1} y={X4_TAPE_Y} width={shown - X4_P1} height={7} rx={1.5} fill="#fde68a" stroke={c} strokeWidth={1} />
            {off && <RightHead x={ST.W - 2} y={X4_TAPE_Y + 3.5} color={c} />}
            <Tag x={clamp(shown, X4_P1 + 26, ST.W - 30)} y={X4_TAPE_Y + 22} text={`${Math.round(L * p)} m`} tone={settled ? (right ? "mint" : "red") : "amber"} size={9} />
          </g>
        )}
        {settled && !right && <WrongMark x={off ? ST.W - 16 : tip + 10} y={X4_TAPE_Y - 6} />}
        {right && <Ripple at={[X4_P2, X4_TAPE_Y]} r={20} />}
      </Street>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X4_OPTS.map((o, i) => (
          <Choice key={o.m} n={i} look={pick === i && settled ? (i === X4_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="text-sm whitespace-nowrap">{o.show}</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X4_RIGHT && <Nope key={miss}>{X4_NOPE[pick]}</Nope>}
      <Task done={right}>এক পোস্ট থেকে আরেক পোস্টে তিথি গুনলো 167 পা, একেক পা 0.6 m। দুই পোস্টের মাঝে কত মিটার?</Task>
    </>
  );
}

// 4½ · Figure for screen 4's explanation: the distance box fills, 100 m;
// the time box still waits.

const S4_SAY = ["দ্রুতি = দূরত্ব ÷ সময়।", "দূরত্বের ঘর ভরলো: 100 m।", "বাকি রইলো সময়।"];

export function DistanceIn({}: Story) {
  const s = useScene(2, [600, 1400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S4_SAY[k]}</span>}>
      <Sheet w={300} h={84} label="দ্রুতি = দূরত্ব ÷ সময়। দূরত্বের ঘরে 100 m, সময়ের ঘরে প্রশ্নবোধক।" className="max-w-[18rem]">
        <FormulaCard d={k >= 1 ? { text: "100 m", tone: "mint" } : null} t={k >= 2 ? { text: "?", tone: "amber" } : null} />
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · Story scene for screen 5: তিথি counting out loud, এক হাজার এক, এক
// হাজার দুই, one a second; a phone stopwatch beside her keeps time.

function PhoneWatch({ x, y, text, tone = PH.ink }: { x: number; y: number; text: string; tone?: string }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 26} y={y - 46} width={52} height={92} rx={9} fill="#1f2937" />
      <rect x={x - 22} y={y - 38} width={44} height={74} rx={4} fill="#fff" />
      <circle cx={x} cy={y - 10} r={14} fill="none" stroke={PH.faint} strokeWidth={1.4} />
      <Txt x={x} y={y + 20} size={10} weight={800} color={tone}>
        {text}
      </Txt>
    </g>
  );
}

export function CountAloud({}: Story) {
  const s = useScene(3, [700, 1000, 1000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="তিথি রাস্তার পাশে দাঁড়িয়ে স্বাভাবিকভাবে গুনছে: এক হাজার এক, এক হাজার দুই, এক হাজার তিন। পাশে ফোনের stopwatch-এ প্রতিবার এক সেকেন্ড করে বাড়ে।">
        <Person who="tithi" x={100} y={150} mood={k >= 1 ? "happy" : "plain"} />
        {k >= 1 && <Bubble key={k} x={100} y={62} lines={[`এক হাজার ${BN[k]}`]} />}
        <PhoneWatch x={236} y={92} text={`${k}.0 s`} />
        <path d={`M236 82L${236 + Math.sin((k / 3) * Math.PI) * 11} ${82 - Math.cos((k / 3) * Math.PI) * 11}`} stroke={PH.amber} strokeWidth={1.8} strokeLinecap="round" className="transition-all duration-300 motion-reduce:transition-none" />
      </Stage>
    </StoryFrame>
  );
}

// 5 · When to start counting, when to stop? Each pick plants its own start
// and stop flags on the street, then the rickshaw rolls by at 5 m/s, the
// count running in তিথি's voice between the flags. From first sight: 24.
// Until it is out of sight: 26. Post to post: 20.

const X5_P1 = 70;
const X5_P2 = 230;
const X5_PXM = (X5_P2 - X5_P1) / 100;
const X5_X0 = 10;
const X5_V = 5 * X5_PXM;
const X5_T_END = (ST.W - X5_X0) / X5_V;
/** Real milliseconds per counted second. */
const X5_SEC_MS = 90;
const X5_SEEN = 38;
const X5_GONE = 278;
const atX = (x: number) => (x - X5_X0) / X5_V;
const X5_OPTS = [
  { text: "রিকশা চোখে পড়তেই শুরু, দ্বিতীয় পোস্টে থামা", from: X5_SEEN, to: X5_P2 },
  { text: "প্রথম পোস্টে শুরু, দ্বিতীয় পোস্টে থামা", from: X5_P1, to: X5_P2 },
  { text: "প্রথম পোস্টে শুরু, রিকশা চোখের আড়াল হলে থামা", from: X5_P1, to: X5_GONE },
];
const X5_RIGHT = 1;
const X5_NOPE = ["গোনা শুরু হলো রিকশা প্রথম পোস্টে আসার আগেই, বাড়তি 4 সেকেন্ড ঢুকে গেলো। মাপা 100 m তো দুই পোস্টের মাঝে।", "", "রিকশা দ্বিতীয় পোস্ট পার হওয়ার পরেও গোনা চললো, বাড়তি 6 সেকেন্ড। 100 m শেষ দ্বিতীয় পোস্টেই।"];

function Flag({ x, text, tone }: { x: number; text: string; tone: "amber" | "blue" }) {
  const c = tone === "amber" ? PH.amber : PH.blue;
  return (
    <g className={`pointer-events-none ${POP}`}>
      <path d={`M${x} ${ST.ROAD_B + 2}V${ST.ROAD_B + 14}`} stroke={c} strokeWidth={1.4} />
      <Tag x={x} y={ST.ROAD_B + 16} text={text} tone={tone} size={8} />
    </g>
  );
}

export function CountPosts() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // the rickshaw keeps an even 5 m/s: a linear clock in counted seconds
  const walk = useWalk(X5_T_END * X5_SEC_MS, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.bell();
    walk.start(() => {
      if (i === X5_RIGHT) {
        sfx.chime();
        pass("দুই পোস্টের মাঝে: 20 সেকেন্ড।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? 0 : walk.running ? walk.t : 1;
  const t = p * X5_T_END;
  const x = X5_X0 + X5_V * t;
  const o = pick === null ? null : X5_OPTS[pick];
  const t0 = o ? atX(o.from) : 0;
  const t1 = o ? atX(o.to) : 0;
  const counting = !!o && t >= t0 && t < t1;
  const n = o ? Math.floor(clamp(t, t0, t1) - t0 + 1e-6) : 0;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X5_RIGHT;
  return (
    <>
      <Street label="রাস্তায় দুইটা ল্যাম্পপোস্ট, মাঝে 100 m। একটা রিকশা সমান বেগে আসে। বেছে নেওয়া মুহূর্তে গোনা শুরু আর শেষ হয়, তিথির গোনা উপরে দেখা যায়।" posts={[X5_P1, X5_P2]} lit={[counting && pick !== 0, right]} h={154}>
        <path d={`M${X5_P1} 16H${X5_P2}`} stroke={PH.mute} strokeWidth={0.8} strokeDasharray="3 3" />
        <Txt x={(X5_P1 + X5_P2) / 2} y={12} size={8} color={PH.mute}>
          100 m
        </Txt>
        {o && <Flag key={`a${pick}`} x={o.from} text="শুরু" tone="amber" />}
        {o && <Flag key={`b${pick}`} x={o.to} text="থামা" tone="blue" />}
        {o && x < ST.W + 20 && <Rickshaw x={x} y={RICK_Y} s={0.2} spin={t * 160} />}
        {!o && <Rickshaw x={X5_X0} y={RICK_Y} s={0.2} />}
        {counting && (
          <g key={n}>
            <Tag x={150} y={48} text={n >= 1 ? `এক হাজার ${BN[n]}` : "…"} tone="ink" size={9.5} />
          </g>
        )}
        {o && (
          <Txt x={22} y={52} size={20} anchor="start" weight={800} color={settled ? (right ? PH.mint : PH.red) : PH.amber}>
            {`${n}`}
          </Txt>
        )}
        {settled && (
          <Later ms={200}>
            <Tag x={150} y={48} text={`গুনলো ${n}, মানে ${n} s`} tone={right ? "mint" : "red"} size={9.5} solid />
          </Later>
        )}
        {right && <Ripple at={[X5_P2, ST.WALK - 30]} r={20} />}
      </Street>
      <div className="mt-2 grid gap-1.5">
        {X5_OPTS.map((x5, i) => (
          <Choice key={x5.text} n={i} look={pick === i && settled ? (i === X5_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="text-sm">{x5.text}</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X5_RIGHT && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>রিকশাটা দুই পোস্টের মাঝের 100 m কত সেকেন্ডে পার হয়? কখন গোনা শুরু আর কখন থামা, বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Per hour. 100 m in 20 s is 5 m/s; how many km an hour? Each pick
// plants a flag at that many km; the rickshaw then runs for a whole hour
// at 5 m/s while the clock goes round once, and stops at 18 km: past the 5
// km flag, far short of 300, on the 18.

const X6_OPTS = [5, 18, 300];
const X6_RIGHT = 1;
const X6_NOPE = ["এক ঘণ্টায় রিকশা flag ছাড়িয়ে 18 km চলে গেলো। 5 ছিল প্রতি সেকেন্ডে মিটার, ঘণ্টায় কিলোমিটার না।", "", "Flag তো 300 km দূরে, রিকশা এক ঘণ্টায় গেলো মোটে 18 km। 60 দিয়ে গুণ করলে আসে মিনিটের হিসাব; এক ঘণ্টায় সেকেন্ড 60 × 60 = 3600টা।"];
const X6_X0 = 30;
const X6_PXK = 8;
const X6_ROAD = 112;
const X6_FLAG_MS = 400;
const X6_MS = 1900;

export function PerHour() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // one hour on a linear clock (after a beat for the flag): even speed, even road
  const walk = useWalk(X6_FLAG_MS + X6_MS, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pop();
    walk.start(() => {
      if (i === X6_RIGHT) {
        sfx.chime();
        pass("5 m/s মানে ঘণ্টায় 18 km।");
      } else setMiss((m) => m + 1);
    });
  };
  const raw = pick === null ? 0 : walk.running ? walk.t : 1;
  const p = clamp((raw * (X6_FLAG_MS + X6_MS) - X6_FLAG_MS) / X6_MS, 0, 1);
  const sec = 3600 * p;
  const km = (5 * sec) / 1000;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X6_RIGHT;
  const fk = pick === null ? 0 : X6_OPTS[pick];
  const fx = X6_X0 + fk * X6_PXK;
  const fOff = fx > ST.W - 10;
  const hand = (sec / 3600) * 2 * Math.PI;
  return (
    <>
      <Sheet w={ST.W} h={140} label="একটা ঘড়ি, এক ঘণ্টা মানে 3600 s। নিচে রাস্তা, কিলোমিটারের দাগ। বেছে নেওয়া km-এ একটা flag বসে, তারপর রিকশা 5 m/s-এ এক ঘণ্টা চলে।" bg={ST_BG} className="max-w-[19rem]">
        <circle cx={44} cy={44} r={24} fill="#fffdf7" stroke={PH.ink} strokeWidth={1.1} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * 2 * Math.PI;
          return <path key={i} d={`M${44 + Math.sin(a) * 20} ${44 - Math.cos(a) * 20}L${44 + Math.sin(a) * 23} ${44 - Math.cos(a) * 23}`} stroke={PH.mute} strokeWidth={1} />;
        })}
        <path d={`M44 44L${44 + Math.sin(hand) * 18} ${44 - Math.cos(hand) * 18}`} stroke={PH.amber} strokeWidth={2} strokeLinecap="round" />
        <circle cx={44} cy={44} r={2} fill={PH.ink} />
        <Txt x={44} y={82} size={8.5} color={PH.amber} weight={700}>
          {`${Math.round(sec)} s`}
        </Txt>
        <Txt x={190} y={36} size={8.5} color={PH.mute}>
          প্রতি সেকেন্ডে 5 m
        </Txt>
        <Txt x={190} y={62} size={20} weight={800} color={settled ? (right ? PH.mint : PH.ink) : PH.ink}>
          {`${km.toFixed(km < 10 ? 1 : 0)} km`}
        </Txt>
        <rect x={1.5} y={X6_ROAD - 9} width={ST.W - 3} height={18} fill="#d6d3cb" />
        {[0, 5, 10, 15, 20, 25, 30].map((k) => (
          <g key={k}>
            <path d={`M${X6_X0 + k * X6_PXK} ${X6_ROAD + 9}v4`} stroke={PH.mute} strokeWidth={1} />
            <Txt x={X6_X0 + k * X6_PXK} y={X6_ROAD + 22} size={7.5} color={PH.mute}>
              {`${k}`}
            </Txt>
          </g>
        ))}
        <Txt x={ST.W - 8} y={X6_ROAD + 22} size={7.5} anchor="end" color={PH.mute}>
          km
        </Txt>
        {pick !== null && !fOff && (
          <g key={pick} className={`pointer-events-none ${POP}`}>
            <path d={`M${fx} ${X6_ROAD - 9}V${X6_ROAD - 34}`} stroke={PH.ink} strokeWidth={1.2} />
            <path d={`M${fx} ${X6_ROAD - 34}l11 3.5l-11 3.5Z`} fill={right ? PH.mint : PH.blue} />
            <Txt x={fx + 6} y={X6_ROAD - 38} size={8} weight={700} color={PH.blue}>
              {`${fk} km`}
            </Txt>
          </g>
        )}
        {pick !== null && fOff && (
          <g key={pick} className={`pointer-events-none ${POP}`}>
            <RightHead x={ST.W - 4} y={X6_ROAD - 26} color={PH.blue} />
            <Txt x={ST.W - 16} y={X6_ROAD - 34} size={8} weight={700} anchor="end" color={PH.blue}>
              {`${fk} km`}
            </Txt>
          </g>
        )}
        <Rickshaw x={X6_X0 + km * X6_PXK} y={X6_ROAD + 7} s={0.17} spin={sec / 6} />
        {settled && !right && <WrongMark x={fOff ? ST.W - 22 : fx + 16} y={X6_ROAD - 46} />}
        {right && <Ripple at={[fx, X6_ROAD - 20]} r={20} />}
      </Sheet>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X6_OPTS.map((v, i) => (
          <Choice key={v} n={i} look={pick === i && settled ? (i === X6_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="font-mono text-sm font-semibold whitespace-nowrap">{v} km/h</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X6_RIGHT && <Nope key={miss}>{X6_NOPE[pick]}</Nope>}
      <Task done={right}>রিকশা চলছে 5 m/s-এ। ঘণ্টায় কত কিলোমিটার? বেছে নিন, flag বসবে, রিকশা এক ঘণ্টা চলবে।</Task>
    </>
  );
}

// 6½ · Figure for screen 6's explanation: 100 ÷ 20 = 5 m/s; × 3600 =
// 18000 m in an hour; = 18 km/h.

const S6_SAY = ["100 m ভাগ 20 s: 5 m/s।", "এক ঘণ্টায় 3600 s: 5 × 3600 = 18000 m।", "মানে ঘণ্টায় 18 কিলোমিটার।"];

export function HourSum({}: Story) {
  const s = useScene(2, [600, 1700]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S6_SAY[k]}</span>}>
      <Sheet w={300} h={104} label="100 m ÷ 20 s = 5 m/s। 5 × 3600 = 18000 m। মানে 18 km/h।" className="max-w-[18rem]">
        <Txt x={150} y={28} size={13} weight={800}>
          100 m ÷ 20 s = 5 m/s
        </Txt>
        {k >= 1 && (
          <g className={FADE}>
            <Txt x={150} y={56} size={12} weight={700}>
              5 × 3600 = 18000 m
            </Txt>
          </g>
        )}
        {k >= 2 && <Tag x={150} y={84} text="= 18 km/h" tone="mint" size={11} solid pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · The same two posts, a bicycle: 12 s. Its speed? Each pick lets the
// bicycle ride for 12 s at that speed from post 1: 0.12 m/s barely rolls,
// 12 m/s overshoots post 2 by 44 m and leaves the street, 8.3 m/s stops on it.

const X7_P1 = 60;
const X7_P2 = 240;
const X7_PXM = (X7_P2 - X7_P1) / 100;
const X7_OPTS = [
  { v: 0.12, show: "0.12 m/s" },
  { v: 100 / 12, show: "8.3 m/s" },
  { v: 12, show: "12 m/s" },
];
const X7_RIGHT = 1;
const X7_NOPE = ["12 সেকেন্ডে সাইকেল এগোলো দেড় মিটারও না! ভাগটা উল্টো হয়ে গেছে: দূরত্ব ভাগ সময়, সময় ভাগ দূরত্ব না।", "", "12 সেকেন্ডে সাইকেল চলে গেলো 144 m, পোস্ট ছাড়িয়ে। 12 তো সময়, দ্রুতি না।"];

/** A cyclist on a bicycle: the kit's bicycle without তিথি, a rider in a blue shirt. */
function Cyclist({ x, y, spin }: { x: number; y: number; spin: number }) {
  return (
    <g className="pointer-events-none">
      <Bicycle x={x} y={y} s={1} rider={false} spin={spin} />
      <g transform={`translate(${x} ${y})`}>
        <path d="M-2 -19L2 -9L0 -7" stroke="#334155" strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M-2 -20l4 -12" stroke="#4f7fc9" strokeWidth={7} strokeLinecap="round" />
        <path d="M1 -29l7 5" stroke="#c08458" strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={3} cy={-37} r={4.6} fill="#c08458" />
        <path d="M-1.6 -38q0 -5.4 4.6 -5.4t4.6 5.4Z" fill="#1c1917" />
      </g>
    </g>
  );
}

export function CycleSpeed() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(1500, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pedal();
    walk.start(() => {
      if (i === X7_RIGHT) {
        sfx.chime();
        pass("100 ÷ 12 ≈ 8.3 m/s।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? 0 : walk.running ? walk.t : 1;
  const v = pick === null ? 0 : X7_OPTS[pick].v;
  const x = X7_P1 + v * 12 * p * X7_PXM;
  const off = x > ST.W - 12;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X7_RIGHT;
  return (
    <>
      <Street label="একই দুই ল্যাম্পপোস্ট, মাঝে 100 m। প্রথম পোস্ট থেকে একটা সাইকেল বেছে নেওয়া দ্রুতিতে 12 সেকেন্ড চলে।" posts={[X7_P1, X7_P2]} lit={[false, right]}>
        <path d={`M${X7_P1} 16H${X7_P2}`} stroke={PH.mute} strokeWidth={0.8} strokeDasharray="3 3" />
        <Txt x={(X7_P1 + X7_P2) / 2} y={12} size={8} color={PH.mute}>
          100 m
        </Txt>
        {!off && <Cyclist x={x} y={RICK_Y} spin={p * 12 * v * 40} />}
        {off && <RightHead x={ST.W - 4} y={RICK_Y - 12} color={PH.red} />}
        <Txt x={22} y={44} size={11} anchor="start" weight={800} color={PH.amber}>
          {`${(12 * p).toFixed(0)} s`}
        </Txt>
        {settled && !right && <WrongMark x={off ? ST.W - 18 : x + 20} y={RICK_Y - 46} />}
        {right && <Ripple at={[X7_P2, RICK_Y - 14]} r={22} />}
      </Street>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X7_OPTS.map((o, i) => (
          <Choice key={o.show} n={i} look={pick === i && settled ? (i === X7_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="font-mono text-sm font-semibold whitespace-nowrap">{o.show}</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X7_RIGHT && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={right}>একটা সাইকেল দুই পোস্ট পার হলো 12 সেকেন্ডে। তার দ্রুতি কত? বেছে নিন, সাইকেল 12 সেকেন্ড চলবে।</Task>
    </>
  );
}

// 7½ · Figure for screen 7's explanation: the book's table builds, row by
// row: রিকশা 20 · 5, সাইকেল 12 · 8.3, পথচারী 70 · 1.4.

const S7_ROWS = [
  ["রিকশা", "20", "5"],
  ["সাইকেল", "12", "8.3"],
  ["পথচারী", "70", "1.4"],
];
const S7_SAY = ["রিকশা: 20 s, 5 m/s।", "সাইকেল: 12 s, প্রায় 8.3 m/s।", "পথচারী: 70 s, প্রায় 1.4 m/s।"];

export function SpeedTable({}: Story) {
  const s = useScene(2, [600, 1400]);
  const k = s.k;
  const cols = [70, 160, 238];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S7_SAY[k]}</span>}>
      <Sheet w={300} h={120} label="একটা table: যানবাহন, সময়, দ্রুতি। রিকশা 20 s, 5 m/s; সাইকেল 12 s, 8.3 m/s; পথচারী 70 s, 1.4 m/s।" className="max-w-[18rem]">
        {["যানবাহন", "সময় (s)", "দ্রুতি (m/s)"].map((h, i) => (
          <Txt key={h} x={cols[i]} y={24} size={9} color={PH.mute}>
            {h}
          </Txt>
        ))}
        <path d="M24 32H280" stroke={PH.faint} strokeWidth={1} />
        {S7_ROWS.map((r, j) =>
          j <= k ? (
            <g key={r[0]} className={FADE}>
              {r.map((c, i) => (
                <Txt key={i} x={cols[i]} y={52 + j * 24} size={11} weight={i === 2 ? 800 : 600} color={i === 2 ? PH.mint : PH.ink}>
                  {c}
                </Txt>
              ))}
            </g>
          ) : null,
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn: how good is your own count? Start, count এক হাজার এক to
// এক হাজার দশ in your head, stop. A real stopwatch ran underneath, hidden;
// then the two bars side by side: your 10 against the stopwatch's seconds,
// and what that drift would do to the rickshaw's 5 m/s.

const X8_SPS = 12;
const X8_X0 = 70;
const X8_MIN = 4000;
const X8_MAX = 25000;

export function CountYourself() {
  const pass = useGate();
  const [res, setRes] = useSeed<number | null>("res", null);
  const [running, setRunning] = useState(false);
  const [miss, setMiss] = useState(0);
  const t0 = useRef(0);
  const start = () => {
    t0.current = performance.now();
    setRes(null);
    setRunning(true);
    sfx.click();
  };
  const stop = () => {
    const ms = performance.now() - t0.current;
    setRunning(false);
    setRes(ms);
    sfx.click();
    if (ms >= X8_MIN && ms <= X8_MAX) {
      sfx.chime();
      pass("গোনা মোটামুটি ঠিক, একদম নিখুঁত না।");
    } else setMiss((m) => m + 1);
  };
  const real = res === null ? null : res / 1000;
  const ok = real !== null && res! >= X8_MIN && res! <= X8_MAX;
  // counted 20 at this pace: how long it really was, and the speed that gives
  const real20 = real === null ? 0 : real * 2;
  return (
    <>
      <Sheet w={300} h={124} label="দুইটা দাগ: উপরেরটা আপনার গোনা, 10 সেকেন্ড; নিচেরটা ফোনের stopwatch-এর আসল সময়। দুটোর ফারাক amber রঙে।" bg={ST_BG} className="max-w-[19rem]">
        <Txt x={X8_X0 - 8} y={40} size={8.5} anchor="end" color={PH.mute}>
          আপনার গোনা
        </Txt>
        <Txt x={X8_X0 - 8} y={72} size={8.5} anchor="end" color={PH.mute}>
          stopwatch
        </Txt>
        {Array.from({ length: 19 }, (_, i) => (
          <path key={i} d={`M${X8_X0 + i * X8_SPS} 88v${i % 5 ? 3 : 6}`} stroke={PH.mute} strokeWidth={0.8} />
        ))}
        {[0, 5, 10, 15].map((s) => (
          <Txt key={s} x={X8_X0 + s * X8_SPS} y={104} size={7.5} color={PH.mute}>
            {`${s} s`}
          </Txt>
        ))}
        <rect x={X8_X0} y={30} width={(running || ok ? 10 : 0) * X8_SPS} height={14} rx={3} fill={PH.amberSoft} stroke={PH.amber} strokeWidth={1} className="transition-[width] duration-500 motion-reduce:transition-none" />
        {(running || ok) && (
          <Txt x={X8_X0 + 10 * X8_SPS + 6} y={41} size={9} anchor="start" weight={800} color={PH.amber}>
            {running ? "গুনছেন…" : "10"}
          </Txt>
        )}
        {running && (
          <Txt x={X8_X0 + 4} y={74} size={10} anchor="start" weight={800} color={PH.mute}>
            ??.? s
          </Txt>
        )}
        {ok && real !== null && (
          <g key={res} className={FADE}>
            <rect x={X8_X0} y={62} width={Math.min(real, 18) * X8_SPS} height={14} rx={3} fill={PH.blueSoft} stroke={PH.blue} strokeWidth={1} />
            <rect x={X8_X0 + Math.min(real, 10) * X8_SPS} y={26} width={Math.abs(real - 10) * X8_SPS} height={54} fill={PH.amber} opacity={0.18} />
            <Txt x={X8_X0 + Math.min(real, 18) * X8_SPS + 6} y={73} size={9} anchor="start" weight={800} color={PH.blue}>
              {`${real.toFixed(1)} s`}
            </Txt>
          </g>
        )}
        {ok && Math.abs(real! - 10) < 0.3 && <Ripple at={[X8_X0 + 10 * X8_SPS, 54]} r={22} />}
      </Sheet>
      {ok && real !== null && (
        <div className="mt-2 text-center text-sm leading-snug">
          {`এই ছন্দে রিকশার 20 গুনলে আসল সময় হতো ${real20.toFixed(1)} s, দ্রুতি `}
          <span className="font-mono font-semibold">{`${(100 / real20).toFixed(1)} m/s`}</span>
          {Math.abs(real20 - 20) < 0.5 ? ", প্রায় হুবহু 5!" : ", 5 না।"}
        </div>
      )}
      <div className="mt-2 flex justify-center">
        {running ? (
          <button type="button" className={`${primaryBtn} h-10! px-5!`} onClick={stop}>
            থামুন
          </button>
        ) : (
          <button type="button" className={`${res === null ? primaryBtn : quietBtn} h-10! px-5!`} onClick={start}>
            {res === null ? "শুরু" : "আবার গুনুন"}
          </button>
        )}
      </div>
      {res !== null && !ok && <Nope key={miss}>{res < X8_MIN ? "এত তাড়াতাড়ি? মনে মনে এক হাজার এক থেকে এক হাজার দশ পর্যন্ত গুনে, তারপর থামুন।" : "অনেক দেরি হয়ে গেলো। এক হাজার দশ বলেই থামুন।"}</Nope>}
      <Task done={ok}>শুরু চাপুন, মনে মনে স্বাভাবিকভাবে গুনুন এক হাজার এক থেকে এক হাজার দশ, তারপর থামুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9a · Recap for the last screen: the two posts, 100 m between; the
// rickshaw rolls through, the count ends at 20; = 5 m/s = 18 km/h.

const S9_SAY = ["দুই পোস্ট, মাঝে মাপা 100 m।", "রিকশা পার হলো, গোনা হলো 20।", "100 ÷ 20 = 5 m/s।", "মানে ঘণ্টায় 18 কিলোমিটার।"];

export function PostsRecap({}: Story) {
  const s = useScene(3, [600, 2200, 1200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S9_SAY[k]}</span>}>
      <Street label="দুইটা ল্যাম্পপোস্ট, মাঝে 100 m। একটা রিকশা পার হয়, গোনা 20। পাশে লেখা 5 m/s, ঘণ্টায় 18 km।" posts={[X4_P1, X4_P2]} lit={[k >= 1, k >= 1]} className="max-w-[18rem]">
        <path d={`M${X4_P1} 16H${X4_P2}`} stroke={PH.mute} strokeWidth={0.8} strokeDasharray="3 3" />
        <Txt x={(X4_P1 + X4_P2) / 2} y={12} size={8} color={PH.mute}>
          100 m
        </Txt>
        <g style={{ transform: `translateX(${k >= 1 ? X4_P2 + 30 - 20 : 0}px)` }} className="transition-transform duration-[2000ms] ease-linear motion-reduce:transition-none">
          <Rickshaw x={20} y={RICK_Y} s={0.2} spin={k >= 1 ? 700 : 0} />
        </g>
        {k >= 1 && (
          <g style={{ transitionDelay: "1700ms" }} className={POP}>
            <Tag x={150} y={40} text="গোনা: 20 s" tone="amber" size={9.5} />
          </g>
        )}
        {k >= 2 && <Tag x={150} y={62} text="100 ÷ 20 = 5 m/s" tone="mint" size={10} solid pop />}
        {k >= 3 && <Tag x={150} y={84} text="= ঘণ্টায় 18 km" tone="mint" size={10} pop />}
      </Street>
    </Scene>
  );
}

// 9b · Closing story scene: the rickshaw stops, starts again; a big "কেন?";
// the next chapter's card, বল.

export function WhyStop({}: Story) {
  const s = useScene(3, [600, 1600, 1600]);
  const k = s.k;
  const x = k === 0 ? 0 : k === 1 ? 110 : 230;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="রিকশা চলতে চলতে থামে, আবার চলতে শুরু করে। উপরে বড় করে লেখা: কেন? পাশে পরের অধ্যায়ের কার্ড: অধ্যায় 3, বল।">
        <rect y={150} width={320} height={4} fill="#e7e2d6" />
        <path d="M0 167H320" stroke="#fff" strokeWidth={1.2} strokeDasharray="8 8" />
        <g style={{ transform: `translateX(${x}px)` }} className={`transition-transform duration-[1300ms] motion-reduce:transition-none ${k === 1 ? "ease-out" : "ease-in"}`}>
          <Rickshaw x={40} y={174} s={0.3} spin={x * 3} />
        </g>
        {k >= 2 && (
          <g className={POP}>
            <Txt x={110} y={66} size={30} color={PH.amber} weight={800}>
              কেন?
            </Txt>
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={196} y={30} width={108} height={50} rx={8} fill="#fff" stroke={PH.ink} strokeWidth={1} />
            <Txt x={250} y={50} size={9} color={PH.mute}>
              পরের অধ্যায়
            </Txt>
            <Txt x={250} y={70} size={14} weight={800}>
              অধ্যায় 3 · বল
            </Txt>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  NoMeter: { a: { k: 0 }, end: {} },
  SpeedBet: { start: {}, sealed: { bet: 1 } },
  HomeworkCard: { end: {} },
  WhatToMeasure: { start: {}, wrong: { pick: 0 }, right: { pick: 2 } },
  StepLength: { start: {}, short: { pick: 0 }, over: { pick: 2 }, right: { pick: 1 } },
  TenSteps: { b: { k: 1 }, end: {} },
  PostToPost: { start: {}, short: { pick: 0 }, over: { pick: 2 }, right: { pick: 1 } },
  DistanceIn: { end: {} },
  CountAloud: { end: {} },
  CountPosts: { start: {}, early: { pick: 0 }, late: { pick: 2 }, right: { pick: 1 } },
  PerHour: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  HourSum: { end: {} },
  CycleSpeed: { start: {}, slow: { pick: 0 }, over: { pick: 2 }, right: { pick: 1 } },
  SpeedTable: { end: {} },
  CountYourself: { start: {}, fast: { res: 8600 }, close: { res: 10100 }, tooSoon: { res: 1500 } },
  PostsRecap: { end: {} },
  WhyStop: { end: {} },
};
