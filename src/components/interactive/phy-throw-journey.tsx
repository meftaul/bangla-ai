"use client";

import { useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, Ticks, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { GroundShadow, PArrow, PH, Ripple, Sheet, Tag, Txt, WrongMark, isBn, svgPoint, useWalk } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 13 — উপরে ছুড়লে কত উঁচু?"
// (src/content/articles/physics_for_high_school/13_throw_up.mdx), the journey
// of video EP 13 (physics_9_10/13-throw-up/script.md). Book §2.8, pp. 49–50.
//
// The spine: a pace bowler's 150 km/h ball, thrown straight up. How high? The
// reader bets মেঘ, 3 তলা or 30 তলা (HeightBet), settled on the last screen.
// On the way, the video's own beats: টুটুল says it will touch the clouds and
// তিথি says let's work it out; the units first, 150 km/h = 41.67 m/s
// (PerSecond); g takes 9.8 off every second, 41.7 → 31.9 → 22.1 → 12.3 → 2.5
// → 0 (EverySecond); no t needed, v² = u² − 2gh with a minus (WhichSign);
// v = 0 gives h = u²/2g ≈ 88.6 m (ZeroIn, HowHigh); about 30 floors
// (FloorStack); টুটুল's cannon at 10 km/s, 1e8 / 19.6 ≈ 5,102 km (CannonZoom);
// the sum is right but the answer is wrong, because g changes (WhereWrong);
// and the reader does the rest of the climb from 22.1 m/s alone (TheRest).
//
// Ball canon (the video's): u = 150000 / 3600 = 41.67 m/s, g = 9.8 m/s²,
// h = 41.67² / 19.6 ≈ 88.6 m (book 88.59), top at ≈ 4.25 s, 1 তলা ≈ 3 m.
// Cannon: 10 km/s = 10,000 m/s → 100,000,000 / 19.6 ≈ 5,102 km.
// On the sky sheet 1 m = 1.7 units, 0–100 m on the bar, the clouds beyond a break.

type Story = { story?: boolean };

const G = 9.8;
/** The bowler's ball: 150 km/h in m/s. */
export const BALL_U = 150000 / 3600;
export const ballH = (t: number) => BALL_U * t - 0.5 * G * t * t;
export const ballV = (t: number) => BALL_U - G * t;
export const PEAK_T = BALL_U / G;
export const PEAK_H = (BALL_U * BALL_U) / (2 * G);
const f1 = (x: number) => (Math.abs(x) < 0.05 ? "0" : x.toFixed(1));
/** A throw up to its top as a CSS timing function: y = 1 − (1 − p)², exactly (slows to a stop). */
const THROW_EASE = "cubic-bezier(0.333, 0.667, 0.667, 1)";
const INK = PH.ink;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const comma = (n: number) => Math.round(n).toLocaleString("en-US");

// ---------------------------------------------------------------------------
// The sky sheet: one tall column of sky over a strip of ground, the ball
// thrown up from the middle. 0–100 m on the bar (when `scale`), the clouds
// drawn above a dashed break, because they are much higher than that.

export const SKY = { W: 300, H: 240, GY: 214, X: 150, PXM: 1.7 } as const;
const SKY_BG = "#eef4fa";
export const skyY = (m: number) => SKY.GY - m * SKY.PXM;
const BALL_R = 7;
/** The ball's centre when it is h metres up (it sits on the ground at 0). */
const ballY = (h: number) => skyY(h) - BALL_R;
const BREAK_Y = 36;
const FLOOR_M = 3;

function GroundStrip({ w, h, gy, fill = "#e3ecd4" }: { w: number; h: number; gy: number; fill?: string }) {
  return (
    <g className="pointer-events-none">
      <path d={`M1.5 ${gy}H${w - 1.5}V${h - 14}A12 12 0 0 1 ${w - 13.5} ${h - 2.5}H13.5A12 12 0 0 1 1.5 ${h - 14}Z`} fill={fill} />
      <path d={`M1.5 ${gy}H${w - 1.5}`} stroke="#c5d1b1" strokeWidth={1} />
    </g>
  );
}

/** A cloud sticker: white puffs under one faint ink line. */
function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const d = "M-18 4a6 6 0 0 1 3 -11a8 8 0 0 1 14 -3a7 7 0 0 1 12 4a5.5 5.5 0 0 1 6 10Z";
  return <path d={d} transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" stroke={INK} strokeOpacity={0.35} strokeWidth={0.9 / s} strokeLinejoin="round" />;
}

function Clouds() {
  return (
    <g className="pointer-events-none">
      <Cloud x={80} y={20} />
      <Cloud x={216} y={21} s={1.1} />
      <Txt x={58} y={23} size={8} color={PH.mute} anchor="end">
        মেঘ
      </Txt>
      <path d={`M40 ${BREAK_Y}H286`} stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="2 4" />
      <path d={`M24 ${BREAK_Y + 3}l8 -6M29 ${BREAK_Y + 3}l8 -6`} stroke="#64748b" strokeWidth={1.1} />
    </g>
  );
}

function HeightScale() {
  return (
    <g className="pointer-events-none">
      <path d={`M30 ${SKY.GY}V${skyY(100)}`} stroke={PH.mute} strokeWidth={1} />
      {[0, 20, 40, 60, 80, 100].map((m) => (
        <g key={m}>
          <path d={`M30 ${skyY(m)}h5`} stroke={PH.mute} strokeWidth={1} />
          <Txt x={27} y={skyY(m) + 3} size={7.5} anchor="end" color={PH.mute}>
            {m === 100 ? "100 m" : `${m}`}
          </Txt>
        </g>
      ))}
    </g>
  );
}

export function SkySheet({
  label,
  scale = false,
  clouds = true,
  className = "max-w-[18rem]",
  onPointerDown,
  onPointerMove,
  onPointerUp,
  children,
}: {
  label: string;
  scale?: boolean;
  clouds?: boolean;
  className?: string;
  onPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: React.PointerEvent<SVGSVGElement>) => void;
  children?: ReactNode;
}) {
  return (
    <Sheet w={SKY.W} h={SKY.H} label={label} bg={SKY_BG} className={className} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      {clouds && <Clouds />}
      <GroundStrip w={SKY.W} h={SKY.H} gy={SKY.GY} />
      {scale && <HeightScale />}
      {children}
    </Sheet>
  );
}

/** The red cricket ball with its seam, centred at (x, y). `ghost` = a see-through guess. */
export function CricketBall({ x = SKY.X, y, ghost = false, r = BALL_R }: { x?: number; y: number; ghost?: boolean; r?: number }) {
  return (
    <g opacity={ghost ? 0.4 : 1} className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill="#c0262d" stroke={INK} strokeWidth={1} strokeDasharray={ghost ? "2 1.5" : undefined} />
      <path d={`M${x - r * 0.58} ${y - r * 0.76}q${r * 0.36} ${r * 0.76} 0 ${r * 1.52}M${x + r * 0.58} ${y - r * 0.76}q${-r * 0.36} ${r * 0.76} 0 ${r * 1.52}`} stroke="#fff" strokeWidth={0.7} fill="none" opacity={0.85} />
    </g>
  );
}

/** The ball's velocity (mint, up, as long as v) and g (blue, down, always the same). */
function BallArrows({ x = SKY.X, y, v, g = true, gLen = 20, gTell = "g = 9.8 m/s² নিচে" }: { x?: number; y: number; v: number; g?: boolean; gLen?: number; gTell?: string }) {
  const len = Math.min(46, v * 1.05);
  return (
    <>
      {len > 4 && <PArrow a={[x, y - BALL_R - 2]} b={[x, y - BALL_R - 2 - len]} tone="mint" w={2.4} tell={`${f1(v)} m/s উপরে`} />}
      {g && gLen > 3 && <PArrow a={[x + 15, y - 8]} b={[x + 15, y - 8 + gLen]} tone="blue" w={2} tell={gTell} />}
      {g && (
        <Txt x={x + 22} y={y + 1} size={8.5} anchor="start" color={PH.blue} weight={800}>
          g
        </Txt>
      )}
    </>
  );
}

/** Where the ball was a moment ago: a faint disc, for a trail at equal times. */
function BallGhost({ x = SKY.X, y }: { x?: number; y: number }) {
  return <circle cx={x} cy={y} r={BALL_R} fill="#c0262d" opacity={0.14} className="pointer-events-none" />;
}

/** What the drawing says after it has answered: the words come a beat after the picture. */
function Later({ children, ms = 450 }: { children: ReactNode; ms?: number }) {
  return (
    <g style={{ transitionDelay: `${ms}ms` }} className={`pointer-events-none ${FADE}`}>
      {children}
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

/** A small up-pointing head, drawn, for "higher than the sheet". */
function UpHead({ x, y, color }: { x: number; y: number; color: string }) {
  return <path d={`M${x} ${y - 5}l5 7h-10Z`} fill={color} className="pointer-events-none" />;
}

/** A building of `floors` floors (3 m each), bottom-left at (x, gy). `ghost` draws it dashed. */
function Tower({ x, gy, floors, w = 40, ghost = false, tone }: { x: number; gy: number; floors: number; w?: number; ghost?: boolean; tone?: "mint" }) {
  const fh = FLOOR_M * SKY.PXM;
  const h = floors * fh;
  if (h < 0.5) return null;
  const edge = tone === "mint" ? PH.mint : ghost ? PH.mute : INK;
  const n = Math.floor(floors);
  return (
    <g className="pointer-events-none">
      {!ghost && <GroundShadow x={x + w / 2} y={gy + 1.5} rx={w / 2 + 6} ry={2.8} />}
      <rect x={x} y={gy - h} width={w} height={h} fill={ghost ? "none" : tone === "mint" ? "#eef8f1" : "#f3e9d8"} stroke={edge} strokeWidth={ghost ? 1 : 1.1} strokeDasharray={ghost ? "3 2.5" : undefined} />
      {!ghost && Array.from({ length: n }, (_, i) => <path key={i} d={`M${x + 1} ${gy - (i + 1) * fh}h${w - 2}`} stroke="#e2d2b4" strokeWidth={0.7} />)}
      {!ghost && h > 14 && <rect x={x + w / 2 - 4} y={gy - 9} width={8} height={9} rx={1} fill="#d9bf92" stroke={edge} strokeWidth={0.8} />}
      {!ghost && h > 3 && <rect x={x - 2.5} y={gy - h - 3} width={w + 5} height={4} rx={1} fill="#e5d3b3" stroke={edge} strokeWidth={1} />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: the ball, 150 km/h; an arrow straight up into
// the dark sky; a "?" at the top.

function Stumps({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      {[-5, 0, 5].map((d) => (
        <path key={d} d={`M${x + d} ${y}v-26`} stroke="#f5ecd7" strokeWidth={2} strokeLinecap="round" />
      ))}
      <path d={`M${x - 6} ${y - 27}h12`} stroke="#f5ecd7" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

export function BowlerBall({}: Story) {
  const s = useScene(3, [600, 1500, 1800]);
  const k = s.k;
  const by = k >= 1 ? 112 : 143;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাতের মাঠ, stumps। একটা ক্রিকেট বল, গায়ে লেখা 150 km/h। বল সোজা আকাশের দিকে ছোড়া হলো, উপরে একটা প্রশ্নবোধক চিহ্ন।">
        <rect x={110} y={150} width={100} height={30} fill="#3f5a3a" />
        <Stumps x={80} y={150} />
        <Stumps x={240} y={150} />
        <g style={{ transform: `translate(0px, ${by - 143}px)`, transitionTimingFunction: THROW_EASE }} className="transition-transform duration-[1200ms] motion-reduce:transition-none">
          <CricketBall x={160} y={143} r={6.5} />
        </g>
        <Tag x={206} y={by} text="150 km/h" tone="amber" size={10} />
        {k >= 1 && <PArrow a={[160, by - 12]} b={[160, 44]} tone="mint" w={2.6} draw ms={900} tell="150 km/h উপরে" />}
        {k >= 2 && (
          <g className={POP}>
            <Txt x={160} y={30} size={22} color={PH.amber} weight={800}>
              ?
            </Txt>
          </g>
        )}
        {k >= 3 && <Tag x={226} y={24} text="কত উঁচুতে?" tone="amber" size={10} solid pop />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: how high? The pick sends a see-through ball up to it:
// into the clouds, or to the roof of a see-through 3- or 30-floor building
// that grows beside it, with a "?". Not marked.

const X1_BETS = [
  { text: "মেঘ ছুঁয়ে ফেলবে", floors: 0 },
  { text: "প্রায় 3 তলা দালানের সমান", floors: 3 },
  { text: "প্রায় 30 তলা দালানের সমান", floors: 30 },
];
const X1_MS = 1200;

export function HeightBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  // A throw up to its height: "out" is 1 − (1 − p)², slowing to a stop at the top.
  const walk = useWalk(X1_MS, { steps: false, ease: "out" });
  const p = bet === null ? 0 : walk.running ? walk.t : 1;
  const b = bet === null ? null : X1_BETS[bet];
  const toY = b ? (b.floors ? ballY(b.floors * FLOOR_M) : 18) : ballY(0);
  const gy = ballY(0) + (toY - ballY(0)) * p;
  return (
    <>
      <SkySheet label="আকাশের দিকে একটা খাড়া column, নিচে মাঠে ক্রিকেট বল, উপরে মেঘ। বাজি ধরলে একটা আবছা বল সেই উচ্চতায় উঠে যায়।">
        {b && b.floors > 0 && <Tower x={176} gy={SKY.GY} floors={b.floors * p} ghost />}
        {b && b.floors > 0 && p >= 1 && (
          <Txt x={196} y={skyY(b.floors * FLOOR_M) - 6} size={8.5} color={PH.mute}>
            {`${b.floors} তলা`}
          </Txt>
        )}
        {b && <CricketBall y={gy} ghost />}
        {b && p >= 1 && <Tag x={SKY.X - 26} y={toY} text="?" tone="blue" size={11} solid pop />}
        <GroundShadow x={SKY.X} y={SKY.GY + 1.5} rx={9} />
        <CricketBall y={ballY(0)} />
        <Tag x={SKY.X - 44} y={ballY(0) - 2} text="150 km/h" tone="amber" size={9} />
      </SkySheet>
      <div className="mt-3 grid gap-2">
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
      <Task done={bet !== null}>ঘণ্টায় 150 km বেগে বল সোজা উপরে ছুড়লে কত উঁচুতে উঠবে? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2a · Story scene for screen 2: টুটুল at the TV, the speed graphic 150 km/h;
// he says it will touch the clouds (red tag আন্দাজ!); তিথি says work it out.

function TvSet({ x, y, graphic }: { x: number; y: number; graphic: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 60} y={y} width={120} height={20} rx={2} fill="#92400e" />
      <rect x={x - 54} y={y + 20} width={6} height={150 - y - 20} fill="#78350f" />
      <rect x={x + 48} y={y + 20} width={6} height={150 - y - 20} fill="#78350f" />
      <rect x={x - 8} y={y - 6} width={16} height={6} fill="#334155" />
      <rect x={x - 56} y={y - 74} width={112} height={68} rx={4} fill="#1f2937" />
      <rect x={x - 51} y={y - 69} width={102} height={58} rx={2} fill="#4d8f4f" />
      <ellipse cx={x} cy={y - 34} rx={34} ry={17} fill="#5ea660" />
      <rect x={x - 5} y={y - 50} width={10} height={32} fill="#d9c79a" />
      <circle cx={x + 2} cy={y - 26} r={2.2} fill="#b91c1c" />
      {graphic && (
        <g className={POP}>
          <rect x={x - 6} y={y - 30} width={54} height={16} rx={2} fill="#1e3a8a" />
          <text x={x + 21} y={y - 19} fontSize={9} fontWeight={800} textAnchor="middle" fill="#fff" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            150 km/h
          </text>
        </g>
      )}
    </g>
  );
}

export function TutulTv({}: Story) {
  const s = useScene(3, [600, 1500, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="টিভিতে খেলা। Screen-এ লেখা 150 km/h। টুটুল বললো, এই বল উপরে ছুড়লে তো মেঘ ছুঁয়ে ফেলবে। তিথি বললো, আন্দাজ না, হিসাব করি।">
        <TvSet x={82} y={110} graphic={k >= 1} />
        <Person who="tutul" x={186} y={150} facing={-1} scale={0.8} arm={k >= 2 ? "point" : "down"} mood={k >= 2 ? "shout" : "plain"} label />
        <Person who="tithi" x={262} y={150} facing={-1} arm={k >= 3 ? "point" : "down"} label />
        {k === 2 && <Bubble x={186} y={98} lines={["উপরে ছুড়লে তো", "মেঘ ছুঁয়ে ফেলবে!"]} />}
        {k >= 2 && <Tag x={k >= 3 ? 186 : 236} y={k >= 3 ? 82 : 40} text="আন্দাজ!" tone="red" size={9.5} solid pop />}
        {k >= 3 && <Bubble x={262} y={84} side="left" lines={["আন্দাজ না,", "হিসাব করি।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · The units. How many metres does the ball go in one second? Each pick
// runs the ball for a whole hour (the clock turns once, 3600 s) and lays the
// distance on a road with the TV's 150 km flag. 150 m runs to 540 km, 2500 m
// to 9000 km; only 41.67 m lands on 150 km.

const X2_OPTS = [
  { v: 150, show: "150 m", how: "150, যেমন আছে" },
  { v: 150000 / 60, show: "2500 m", how: "150000 ÷ 60" },
  { v: BALL_U, show: "41.67 m", how: "150000 ÷ 3600" },
];
const X2_RIGHT = 2;
const X2_NOPE = [
  "এক ঘণ্টায় বল গেলো 540 km, TV বলছে 150। 150 সংখ্যাটা ছিল কিলোমিটার আর ঘণ্টায়, মিটার আর সেকেন্ডে না।",
  "এক ঘণ্টায় 9000 km! 60 দিয়ে ভাগ করলে আসে প্রতি মিনিটে। এক ঘণ্টায় সেকেন্ড 60 × 60 = 3600টা।",
  "",
];
const X2_MS = 1600;
const X2_W = 300;
const X2_H = 150;
const X2_0 = 30;
const X2_KM = 200 / 150;
const X2_ROAD = 118;

export function PerSecond() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // One hour squeezed into a linear clock: an even speed covers even road.
  const walk = useWalk(X2_MS, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(1.2);
    walk.start(() => {
      if (i === X2_RIGHT) {
        sfx.chime();
        pass("150 km/h মানে 41.67 m/s।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? 0 : walk.running ? walk.t : 1;
  const sec = 3600 * p;
  const v = pick === null ? 0 : X2_OPTS[pick].v;
  const km = (v * sec) / 1000;
  const bx = X2_0 + km * X2_KM;
  const off = bx > X2_W - 8;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X2_RIGHT;
  const tone = settled ? (right ? PH.mint : PH.red) : PH.amber;
  const hand = (sec / 3600) * 2 * Math.PI;
  return (
    <>
      <Sheet w={X2_W} h={X2_H} label="একটা ঘড়ি, এক ঘণ্টা মানে 3600 s। নিচে রাস্তা, 150 km-এ TV-র flag। বেছে নেওয়া বেগে বল এক ঘণ্টা চলে।" className="max-w-[20rem]">
        <GroundShadow x={52} y={80} rx={20} />
        <circle cx={52} cy={52} r={24} fill="#fffdf7" stroke={PH.ink} strokeWidth={1.1} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * 2 * Math.PI;
          return <path key={i} d={`M${52 + Math.sin(a) * 20} ${52 - Math.cos(a) * 20}L${52 + Math.sin(a) * 23} ${52 - Math.cos(a) * 23}`} stroke={PH.mute} strokeWidth={1} />;
        })}
        <path d={`M52 52L${52 + Math.sin(hand) * 18} ${52 - Math.cos(hand) * 18}`} stroke={PH.amber} strokeWidth={2} strokeLinecap="round" />
        <circle cx={52} cy={52} r={2} fill={PH.ink} />
        <Txt x={52} y={92} size={9} color={PH.amber} weight={700}>
          {`${Math.round(sec)} s`}
        </Txt>
        <Txt x={180} y={30} size={8.5} color={PH.mute}>
          {pick === null ? "প্রতি সেকেন্ডে কত মিটার?" : `প্রতি সেকেন্ডে ${X2_OPTS[pick].show}`}
        </Txt>
        <Txt x={180} y={62} size={20} color={pick === null ? PH.faint : tone} weight={800}>
          {pick === null ? "? km" : `${comma(km)} km`}
        </Txt>
        <Txt x={180} y={78} size={8.5} color={PH.mute}>
          {`${Math.round(sec)} সেকেন্ডে`}
        </Txt>
        <path d={`M14 ${X2_ROAD}H286`} stroke="#d6d3cb" strokeWidth={8} strokeLinecap="round" />
        <path d={`M14 ${X2_ROAD}H286`} stroke="#fff" strokeWidth={0.8} strokeDasharray="3 4" />
        <path d={`M${X2_0} ${X2_ROAD - 6}v12`} stroke={PH.ink} strokeWidth={1.2} />
        <Txt x={X2_0} y={X2_ROAD + 20} size={8} color={PH.mute}>
          0
        </Txt>
        <path d={`M${X2_0 + 150 * X2_KM} ${X2_ROAD}V${X2_ROAD - 26}`} stroke={PH.ink} strokeWidth={1.2} />
        <path d={`M${X2_0 + 150 * X2_KM} ${X2_ROAD - 26}l12 4l-12 4Z`} fill={right ? PH.mint : PH.blue} />
        <Txt x={X2_0 + 150 * X2_KM} y={X2_ROAD + 20} size={8} color={PH.ink} weight={700}>
          TV: 150 km, 1 ঘণ্টায়
        </Txt>
        {pick !== null && km > 0.5 && <path d={`M${X2_0} ${X2_ROAD}H${Math.min(bx, X2_W - 4)}`} stroke={tone} strokeWidth={3} strokeLinecap="round" />}
        {pick !== null && !off && <CricketBall x={bx} y={X2_ROAD - BALL_R - 4} />}
        {pick !== null && off && (
          <g>
            <path d={`M${X2_W - 16} ${X2_ROAD - 14}l9 5l-9 5Z`} fill={tone} />
            {!settled && <Tag x={X2_W - 44} y={X2_ROAD - 38} text="ছাড়িয়ে গেলো" tone="amber" size={8} />}
            {settled && <WrongMark x={X2_W - 14} y={X2_ROAD - 24} />}
          </g>
        )}
        {right && <Ripple at={[X2_0 + 150 * X2_KM, X2_ROAD - 8]} r={24} />}
      </Sheet>
      <div className="mt-2 text-center text-sm font-semibold">প্রতি সেকেন্ডে বল কত মিটার যায়?</div>
      <div className="mt-1.5 grid gap-1.5">
        {X2_OPTS.map((o, i) => (
          <Choice key={o.show} n={i} look={pick === i && settled ? (i === X2_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="flex items-baseline gap-2">
              <span className="font-mono font-semibold">{o.show}</span>
              <span className={`text-xs opacity-75 ${isBn(o.how) ? "" : "font-mono"}`}>{o.how}</span>
            </span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X2_RIGHT && <Nope key={miss}>{X2_NOPE[pick]}</Nope>}
      <Task done={right}>TV বলছে 150 km/h। প্রতি সেকেন্ডে বল কত মিটার যায়? বেছে নিন, বল এক ঘণ্টা চলবে।</Task>
    </>
  );
}

// 2½ · Figure for screen 2's explanation: 150 km/h = 150000 m / 3600 s = 41.67 m/s.

const S2_SAY = ["TV-র সংখ্যা: 150 km/h।", "150 km মানে 150000 m, আর 1 ঘণ্টা মানে 3600 s।", "ভাগ করলে, 41.67 m/s।"];

export function UnitSum({}: Story) {
  const s = useScene(2, [600, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S2_SAY[k]}</span>}>
      <Sheet w={300} h={104} label="150 km/h সমান 150000 m ভাগ 3600 s, সমান 41.67 m/s।" className="max-w-[18rem]">
        <Txt x={150} y={30} size={15} weight={800}>
          150 km/h
        </Txt>
        {k >= 1 && (
          <g className={FADE}>
            <Txt x={150} y={58} size={13} weight={700}>
              = 150000 m / 3600 s
            </Txt>
            <Txt x={128} y={72} size={7.5} color={PH.mute}>
              150 × 1000
            </Txt>
            <Txt x={206} y={72} size={7.5} color={PH.mute}>
              60 × 60
            </Txt>
          </g>
        )}
        {k >= 2 && <Tag x={150} y={90} text="= 41.67 m/s" tone="mint" size={11} solid pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · Second by second. Each tap lets the ball fly one more second: it rises
// less each time, its speed chip ticks 41.7 → 31.9 → 22.1 → 12.3 → 2.5, a
// −9.8 badge each second, the g arrow on it the whole way; the fifth tap
// takes it to the top, 0, where it stops for a moment.

const X3_N = 5;
/** Real time per flight second on the clock. */
const X3_SEC_MS = 900;
const X3_V = ["41.7", "31.9", "22.1", "12.3", "2.5", "0"];
const secT = (i: number) => (i >= X3_N ? PEAK_T : i);

export function EverySecond() {
  const pass = useGate();
  const [sec, setSec] = useSeed("sec", 0);
  // One clock for the whole climb: each tap runs the next stretch of flight
  // time (the last is only 0.25 s) at the same rate, and y comes from ut − ½gt².
  const walk = useWalk(X3_SEC_MS * (secT(Math.min(sec + 1, X3_N)) - secT(sec)), { steps: false, ease: "linear" });
  const go = () => {
    if (walk.running || sec >= X3_N) return;
    const next = sec + 1;
    setSec(next);
    sfx.whoosh(0.8);
    walk.start(() => {
      sfx.tap();
      if (next === X3_N) {
        sfx.chime();
        pass("প্রতি সেকেন্ডে বেগ কমে 9.8 করে।");
      }
    });
  };
  const t = walk.running ? secT(sec - 1) + (secT(sec) - secT(sec - 1)) * walk.t : secT(sec);
  const v = Math.max(0, ballV(t));
  const y = ballY(ballH(t));
  const top = sec >= X3_N && !walk.running;
  const landed = !walk.running && sec > 0;
  const reached = walk.running ? sec - 1 : sec;
  return (
    <>
      <SkySheet label="আকাশের column-এ ক্রিকেট বল, গায়ে তার বেগ। সবুজ তীর বেগ, নীল তীর g, নিচের দিকে। প্রতি tap-এ বল আরও এক সেকেন্ড ওড়ে।">
        {/* where the ball was at each whole second: the gaps shrink as g takes its speed */}
        {Array.from({ length: X3_N }, (_, i) => (i <= reached && i < X3_N ? <BallGhost key={i} y={ballY(ballH(i))} /> : null))}
        <CricketBall y={y} />
        <BallArrows y={y} v={v} />
        <Tag x={SKY.X - 44} y={y} text={`${f1(v)} m/s`} tone={top ? "mint" : "ink"} size={9.5} />
        {landed && !top && <Tag key={sec} x={SKY.X - 44} y={y + 18} text="−9.8" tone="amber" size={9} solid pop />}
        {top && <Ripple at={[SKY.X, y]} r={20} />}
        {top && (
          <Later>
            <Tag x={SKY.X - 66} y={y + 18} text="চূড়া: এক মুহূর্ত থামে" tone="mint" size={8.5} />
          </Later>
        )}
        <Txt x={262} y={SKY.GY - 8} size={10} color={PH.amber} weight={700}>
          {`t = ${walk.running ? t.toFixed(1) : sec >= X3_N ? "4.25" : `${sec}`} s`}
        </Txt>
      </SkySheet>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1 font-mono text-sm">
        {X3_V.map((x, i) => (
          <span key={x} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted">→</span>}
            <span className={`rounded-md px-1.5 py-0.5 transition-colors duration-300 motion-reduce:transition-none ${i < sec || (i === sec && !walk.running) ? (i === X3_N ? "bg-accent/15 font-bold text-accent-text" : "bg-foreground/[0.07] font-semibold") : "text-muted/50"}`}>{x}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={`${primaryBtn} h-10! px-4!`} disabled={walk.running || sec >= X3_N} onClick={go}>
          {sec >= X3_N - 1 ? "চূড়া পর্যন্ত" : "আরও 1 সেকেন্ড"}
        </button>
      </div>
      <Task done={sec >= X3_N && !walk.running}>বল ছোড়া হলো 41.7 m/s বেগে। এক সেকেন্ড করে উড়িয়ে দেখুন, বেগ কত করে কমে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · No t. Which formula matches the ball? Each pick throws the ball by it:
// with a plus the speed grows as it rises and it never stops; v = u − gt
// needs a time, and the stopwatch only shows "?"; with the minus the speed
// falls to 0 at the top.

type Sign = "minus" | "plus" | "time";
const X4_OPTS: { key: Sign; f: string }[] = [
  { key: "minus", f: "v² = u² − 2gh" },
  { key: "plus", f: "v² = u² + 2gh" },
  { key: "time", f: "v = u − gt" },
];
const X4_NOPE: Record<Sign, string> = {
  minus: "",
  plus: "যোগ দিলে উচ্চতা যত বাড়ে, বেগও তত বাড়ে। বল থামলোই না, উঠতেই থাকলো!",
  time: "এই সূত্রে t লাগে। কিন্তু চূড়ার সময় না জেনেই h বের করতে চাই। বল তো নড়লোই না।",
};
const X4_MS = 1500;

function Stopwatch({ x, y, turn }: { x: number; y: number; turn: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 3} y={y - 21} width={6} height={4} rx={1} fill={PH.ink} />
      <circle cx={x} cy={y} r={15} fill="#fff" stroke={PH.ink} strokeWidth={1.6} />
      <path d={`M${x} ${y}L${x + Math.sin(turn) * 11} ${y - Math.cos(turn) * 11}`} stroke={PH.red} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={x} cy={y} r={1.8} fill={PH.ink} />
    </g>
  );
}

export function WhichSign() {
  const pass = useGate();
  const [pick, setPick] = useSeed<Sign | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // A linear clock; each formula moves the ball by its own law of t.
  const walk = useWalk(X4_MS, { steps: false, ease: "linear" });
  const go = (key: Sign) => {
    if (walk.running) return;
    setPick(key);
    sfx.whoosh(1.2);
    walk.start(() => {
      if (key === "minus") {
        sfx.chime();
        pass("মাইনাস, কারণ g বেগ কমাচ্ছে।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? 0 : walk.running ? walk.t : 1;
  let h = 0;
  let v = BALL_U;
  if (pick === "minus") {
    h = ballH(PEAK_T * p);
    v = Math.sqrt(Math.max(0, BALL_U * BALL_U - 2 * G * h));
  } else if (pick === "plus") {
    const t = 2.4 * p;
    h = BALL_U * t + 0.5 * G * t * t;
    v = Math.sqrt(BALL_U * BALL_U + 2 * G * h);
  }
  const y = ballY(h);
  const gone = y < 10;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === "minus";
  return (
    <>
      <SkySheet label="আকাশের column-এ ক্রিকেট বল। বেছে নেওয়া সূত্র ধরে বল ছোড়া হয়, সবুজ তীর তার বেগ।" className="max-w-[16rem]">
        <GroundShadow x={SKY.X} y={SKY.GY + 1.5} rx={9 - Math.min(5, h / 20)} />
        {!gone && <CricketBall y={y} />}
        {!gone && <BallArrows y={y} v={pick === "time" ? BALL_U : v} />}
        {!gone && !right && <Tag x={SKY.X - 44} y={y} text={`${f1(pick === "time" ? BALL_U : v)} m/s`} tone={pick === "plus" ? "red" : "ink"} size={9.5} />}
        {gone && <UpHead x={SKY.X} y={12} color={PH.red} />}
        {pick === "time" && <Stopwatch x={226} y={150} turn={p * 6 * Math.PI} />}
        {pick === "time" && settled && <Tag x={226} y={124} text="t = ?" tone="red" size={11} solid pop />}
        {pick === "plus" && settled && <Tag x={SKY.X + 58} y={60} text={`বেগ ${f1(v)} m/s, বাড়ছেই!`} tone="red" size={9} solid pop />}
        {right && <Ripple at={[SKY.X, y]} r={20} />}
        {right && (
          <Later>
            <Tag x={SKY.X - 40} y={y} text="v = 0" tone="mint" size={10} solid />
          </Later>
        )}
        {pick !== null && <Tag key={pick} x={226} y={SKY.GY - 16} text={X4_OPTS.find((o) => o.key === pick)!.f} tone={right ? "mint" : "ink"} size={10} solid={right} />}
      </SkySheet>
      <div className="mt-2 grid gap-1.5">
        {X4_OPTS.map((o, i) => (
          <Choice key={o.key} n={i} look={pick === o.key && settled ? (o.key === "minus" ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(o.key)}>
            <span className="font-mono font-semibold">{o.f}</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== "minus" && <Nope key={miss}>{X4_NOPE[pick]}</Nope>}
      <Task done={right}>চূড়ায় শেষ বেগ শূন্য, সময় জানা নেই। কোন সূত্রটা বলের সাথে মেলে? বেছে নিয়ে বল ছুড়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5a · Figure for screen 5's setup: v = 0 goes in, and h = u²/2g comes out.

const S5_SAY = ["চূড়ায় পৌঁছালে v = 0।", "v-এর জায়গায় 0 বসালাম।", "2gh নিলাম অন্য পাশে।", "দুই পাশকে 2g দিয়ে ভাগ: h = u²/2g।"];

function EqLine({ y, left, right, lc = PH.ink, rc = PH.ink, size = 13 }: { y: number; left: string; right: string; lc?: string; rc?: string; size?: number }) {
  return (
    <g className={FADE}>
      <Txt x={140} y={y} size={size} anchor="end" color={lc} weight={700}>
        {left}
      </Txt>
      <Txt x={150} y={y} size={size} weight={700}>
        =
      </Txt>
      <Txt x={160} y={y} size={size} anchor="start" color={rc} weight={700}>
        {right}
      </Txt>
    </g>
  );
}

export function ZeroIn({}: Story) {
  const s = useScene(3, [600, 1500, 1500]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <Sheet w={300} h={124} label="v² = u² − 2gh. v-এর জায়গায় 0। তারপর 2gh = u²। শেষে h = u² / 2g।" className="max-w-[17rem]">
        <EqLine y={26} left="v²" right="u² − 2gh" lc={k >= 1 ? PH.faint : PH.ink} />
        {k >= 1 && <EqLine y={52} left="0" right="u² − 2gh" lc={PH.amber} />}
        {k >= 2 && <EqLine y={78} left="2gh" right="u²" />}
        {k >= 3 && (
          <g className={POP}>
            <rect x={96} y={89} width={108} height={26} rx={6} fill={PH.mintSoft} stroke={PH.mint} strokeWidth={1.6} />
            <Txt x={150} y={107} size={14} weight={800}>
              h = u² / 2g
            </Txt>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// 5 · The numbers. Three sums, three heights: each pick plants a flag at its
// height, then the ball is thrown for real (the second-by-second flight). It
// always stops at 88.6 m: past the 2.1 m flag, halfway to the 177.2 m one,
// right at the 88.6 m one.

const X5_OPTS = [
  { expr: "41.67 / 19.6", h: 2.1 },
  { expr: "41.67² / 19.6", h: 88.6 },
  { expr: "41.67² / 9.8", h: 177.2 },
];
const X5_RIGHT = 1;
const X5_NOPE = ["বল flag ছাড়িয়ে অনেক উপরে উঠে গেলো। u-এর বর্গ লাগবে: 41.67²।", "", "বল flag-এর অর্ধেকেই থেমে গেলো। ভাগ 2g দিয়ে, মানে 2 × 9.8 = 19.6।"];
const X5_FLAG = 8;
const X5_TICKS = 40;
/** Ticks of 45 ms: the flag goes in, then the flight runs on a linear clock to the top. */
const X5_TICK_MS = 45;

function HeightFlag({ h, tone }: { h: number; tone: string }) {
  const high = skyY(h) < BREAK_Y + 8;
  const y = high ? BREAK_Y - 4 : skyY(h);
  return (
    <g className={`pointer-events-none ${FADE}`}>
      {!high && <path d={`M40 ${y}H286`} stroke={tone} strokeWidth={1.3} strokeDasharray="5 3" />}
      <path d={`M232 ${y}V${y - 16}`} stroke={PH.ink} strokeWidth={1.1} />
      <path d={`M232 ${y - 16}l11 3.5l-11 3.5Z`} fill={tone} />
      <Txt x={264} y={y - 6} size={9} color={tone} weight={800}>
        {`${h} m`}
      </Txt>
      {high && <UpHead x={252} y={y + 10} color={tone} />}
    </g>
  );
}

export function HowHigh() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X5_TICKS * X5_TICK_MS, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pop();
    walk.start(() => {
      if (i === X5_RIGHT) {
        sfx.chime();
        pass("h = u²/2g, প্রায় 88.6 m।");
      } else setMiss((m) => m + 1);
    });
  };
  const k = (pick === null ? 0 : walk.running ? walk.t : 1) * X5_TICKS;
  const p = clamp((k - X5_FLAG) / (X5_TICKS - X5_FLAG), 0, 1);
  const t = PEAK_T * p;
  const y = ballY(ballH(t));
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X5_RIGHT;
  const flagTone = settled ? (right ? PH.mint : PH.red) : PH.blue;
  return (
    <>
      <SkySheet label="উচ্চতার দাগ দেওয়া আকাশের column। বেছে নেওয়া হিসাবের উচ্চতায় একটা flag বসে, তারপর বলটা সত্যি ছোড়া হয়।" scale className="max-w-[16rem]">
        {pick !== null && k >= 1 && <HeightFlag key={pick} h={X5_OPTS[pick].h} tone={flagTone} />}
        {settled && !right && (
          <g className={FADE}>
            <path d={`M40 ${skyY(PEAK_H)}H${SKY.X - 8}`} stroke={PH.amber} strokeWidth={1.2} strokeDasharray="3 3" />
            <Tag x={SKY.X - 48} y={skyY(PEAK_H) - 11} text="বল থামলো এখানে" tone="amber" size={8} />
          </g>
        )}
        {settled && !right && pick !== null && <WrongMark x={216} y={skyY(X5_OPTS[pick].h) < BREAK_Y + 8 ? BREAK_Y + 18 : skyY(X5_OPTS[pick].h) - 5} />}
        {right && <Ripple at={[SKY.X, y]} r={22} />}
        <CricketBall y={y} />
        <BallArrows y={y} v={Math.max(0, ballV(t))} />
      </SkySheet>
      <div className="mt-2 grid gap-1.5">
        {X5_OPTS.map((o, i) => (
          <Choice key={o.expr} n={i} look={pick === i && settled ? (i === X5_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="font-mono font-semibold">
              h = {o.expr} ≈ {o.h} m
            </span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X5_RIGHT && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>h = u²/2g-তে বলের সংখ্যা বসানো হলো তিনভাবে। কোনটা ঠিক? flag বসিয়ে বল ছুড়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · How tall is 88.6 m? The reader pulls a building up beside the ball at
// its top, floor by floor (3 m each), until the roof meets the ball: 30
// floors. Over that, the roof passes the ball. The clouds stay far above.

const X6_MAX = 36;
const X6_RIGHT = 30;
const X6_X = 164;

export function FloorStack() {
  const pass = useGate();
  const [floors, setFloors] = useSeed("floors", 0);
  const [judged, setJudged] = useSeed<number | null>("judged", null);
  const [drag, setDrag] = useState(false);
  const [miss, setMiss] = useState(0);
  const play = usePlay(70);
  const [fh] = useTween([floors], 160);
  const done = judged === X6_RIGHT && floors === X6_RIGHT && !play.running;
  const judge = (f: number) => {
    if (play.running || done) return;
    setJudged(f);
    if (f === X6_RIGHT) {
      sfx.pop();
      play.play(8, () => {
        sfx.chime();
        pass("88.6 m মানে প্রায় 30 তলা।");
      });
    } else if (f > X6_RIGHT) setMiss((m) => m + 1);
  };
  const aim = (e: React.PointerEvent<SVGSVGElement>) => {
    const [, y] = svgPoint(e, SKY.W, SKY.H);
    const f = clamp(Math.round((SKY.GY - y) / (FLOOR_M * SKY.PXM)), 0, X6_MAX);
    if (f !== floors) {
      setFloors(f);
      if (f % 5 === 0) sfx.tap();
    }
    return f;
  };
  const over = judged !== null && judged === floors && judged > X6_RIGHT;
  return (
    <>
      <SkySheet
        label="আকাশের column-এ বল তার চূড়ায়, 88.6 m। পাশে একটা দালান, টেনে উপরে তোলা যায়, প্রতি তলা 3 m।"
        scale
        className="max-w-[17rem] cursor-ns-resize"
        onPointerDown={(e) => {
          if (done) return;
          setDrag(true);
          aim(e);
        }}
        onPointerMove={(e) => {
          if (drag && !done) aim(e);
        }}
        onPointerUp={(e) => {
          if (!drag) return;
          setDrag(false);
          judge(aim(e));
        }}
      >
        <Tower x={X6_X} gy={SKY.GY} floors={fh} w={44} tone={done ? "mint" : undefined} />
        {!done && floors < X6_MAX && <rect x={X6_X - 2} y={skyY(floors * FLOOR_M) - 5} width={48} height={5} rx={2} fill={PH.blue} opacity={0.75} className="pointer-events-none" />}
        {floors === 0 && (
          <Txt x={X6_X + 22} y={SKY.GY - 12} size={8.5} color={PH.blue}>
            টেনে তুলুন
          </Txt>
        )}
        <path d={`M40 ${skyY(PEAK_H)}H${X6_X - 4}`} stroke={PH.amber} strokeWidth={1} strokeDasharray="3 3" className="pointer-events-none" />
        <CricketBall y={skyY(PEAK_H)} />
        <Tag x={SKY.X - 52} y={skyY(PEAK_H) - 12} text="চূড়া, 88.6 m" tone="amber" size={8.5} />
        {done && <Ripple at={[SKY.X + 8, skyY(PEAK_H) - 4]} r={30} />}
        {done && (
          <Later>
            <Tag x={X6_X + 22} y={skyY(90) - 14} text="প্রায় 30 তলা" tone="mint" size={9} solid />
            <Tag x={143} y={BREAK_Y - 14} text="মেঘ পর্যন্ত না" tone="ink" size={8.5} />
          </Later>
        )}
        {over && <Tag x={X6_X + 22} y={skyY(floors * FLOOR_M) - 12} text="বল ছাড়িয়ে গেলো" tone="red" size={8.5} pop />}
      </SkySheet>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm">
        <Stepper
          value={floors}
          min={0}
          max={X6_MAX}
          disabled={play.running || done}
          label="তলা"
          onChange={(f) => {
            setFloors(f);
            sfx.tap();
            judge(f);
          }}
        />
        <span>
          <span className="font-mono font-semibold">{floors}</span> তলা × <span className="font-mono">3 m</span> = <span className={`font-mono font-bold ${done ? "text-accent-text" : over ? "text-danger" : ""}`}>{floors * FLOOR_M} m</span>
        </span>
      </div>
      <div className="mt-1 text-center text-xs text-muted">
        1 তলা ≈ <span className="font-mono">3 m</span>
      </div>
      {over && <Nope key={miss}>দালানের ছাদ বলের চূড়া ছাড়িয়ে গেলো। একটু নামিয়ে দেখুন, ছাদ কোথায় বল ছোঁয়।</Nope>}
      <Task done={done}>দালানটা টেনে উপরে তুলুন, যতক্ষণ না ছাদ বলের চূড়া ছোঁয়। কয় তলা লাগে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7a · Story scene for screen 7: a spacecraft circling at 10 km/s; টুটুল by a
// cannon pointing up asks; 10 km/s = 10,000 m/s, an arrow up, "?".

function Cannon({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <ellipse cy={1} rx={22} ry={3} fill={INK} opacity={0.1} />
      <rect x={-6.5} y={-50} width={13} height={38} rx={3} fill="#5b6472" stroke={INK} strokeWidth={1} />
      <rect x={-8} y={-53} width={16} height={5} rx={1.5} fill="#454c57" stroke={INK} strokeWidth={1} />
      <rect x={-15} y={-18} width={30} height={10} rx={2} fill="#c08458" stroke={INK} strokeWidth={1} />
      <circle cx={-10} cy={-7} r={7} fill="#e9e2d4" stroke={INK} strokeWidth={1.1} />
      <circle cx={10} cy={-7} r={7} fill="#e9e2d4" stroke={INK} strokeWidth={1.1} />
      <circle cx={-10} cy={-7} r={1.8} fill={INK} />
      <circle cx={10} cy={-7} r={1.8} fill={INK} />
    </g>
  );
}

function Spacecraft({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="pointer-events-none">
      <rect x={-17} y={-3} width={11} height={6} fill="#3b82f6" />
      <rect x={6} y={-3} width={11} height={6} fill="#3b82f6" />
      <rect x={-5} y={-5} width={10} height={10} rx={2} fill="#e5e7eb" stroke="#64748b" strokeWidth={0.8} />
    </g>
  );
}

export function TutulCannon({}: Story) {
  const s = useScene(3, [600, 1500, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="আকাশে একটা মহাকাশযান ঘুরছে, 10 km/s। মাঠে একটা কামান, নল সোজা উপরে। টুটুল জিজ্ঞেস করে, এত জোরে গোলা উপরে ছুড়লে? 10 km/s মানে 10,000 m/s।">
        <path d="M14 70Q160 -6 306 70" fill="none" stroke="#64748b" strokeWidth={0.9} strokeDasharray="3 4" />
        <g style={{ transform: `translate(${k >= 1 ? 250 : 70}px, ${k >= 1 ? 40 : 44}px)` }} className="transition-transform duration-[1400ms] ease-in-out motion-reduce:transition-none">
          <Spacecraft x={0} y={0} />
        </g>
        <Tag x={k >= 1 ? 250 : 70} y={k >= 1 ? 58 : 62} text="10 km/s" tone="blue" size={9} />
        {k >= 1 && (
          <g className={POP}>
            <Cannon x={96} y={150} s={1.1} />
          </g>
        )}
        {k >= 1 && <Person who="tutul" x={186} y={150} facing={-1} scale={0.8} arm="point" label />}
        {k === 2 && <Bubble x={186} y={98} lines={["এত জোরে গোলা", "উপরে ছুড়লে?"]} />}
        {k >= 3 && <PArrow a={[96, 88]} b={[96, 30]} tone="mint" w={2.4} draw tell="10,000 m/s উপরে" />}
        {k >= 3 && <Tag x={176} y={62} text="10 km/s = 10,000 m/s" tone="amber" size={9.5} solid pop />}
        {k >= 3 && (
          <g className={POP}>
            <Txt x={96} y={22} size={18} color={PH.amber} weight={800}>
              ?
            </Txt>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 7 · The same formula, from further and further away. The shell's path runs
// off the top; each tap zooms the bar out ten times (100 m → 1 km → … →
// 10,000 km): the 30-floor building shrinks to nothing, the clouds and the
// air go by, and at last the top shows: 5,102 km.

const X7_TOPS = [100, 1e3, 1e4, 1e5, 1e6, 1e7];
const X7_NAMES = ["100 m", "1 km", "10 km", "100 km", "1,000 km", "10,000 km"];
const X7_PEAK = (1e4 * 1e4) / (2 * G);
const X7_BAR = 170;
const X7_CLOUD = 2000;
const X7_AIR = 1e5;
const X7_CX = 110;

export function CannonZoom() {
  const pass = useGate();
  const [zoom, setZoom] = useSeed("zoom", 0);
  const play = usePlay(950);
  const [L] = useTween([Math.log10(X7_TOPS[zoom])], 900);
  const top = 10 ** L;
  const yOf = (m: number) => SKY.GY - (m / top) * X7_BAR;
  const done = zoom >= X7_TOPS.length - 1 && !play.running;
  const go = () => {
    if (play.running || zoom >= X7_TOPS.length - 1) return;
    const next = zoom + 1;
    setZoom(next);
    sfx.whoosh(0.8);
    play.play(1, () => {
      if (next === X7_TOPS.length - 1) {
        sfx.chime();
        pass("10,000² / 19.6, প্রায় 5,102 km।");
      }
    });
  };
  const peakY = yOf(X7_PEAK);
  const seen = peakY > 30;
  const bH = (90 / top) * X7_BAR;
  const airY = yOf(X7_AIR);
  return (
    <>
      <Sheet w={SKY.W} h={SKY.H} label="মাঠে কামান, নল উপরে। পাশে 30 তলা দালান। গোলার পথ উপরে চলে গেছে। প্রতি tap-এ ছবিটা দশ গুণ দূর থেকে দেখা যায়।" className="max-w-[17rem]" bg={SKY_BG}>
        {airY < SKY.GY - 2 && (
          <g className="pointer-events-none">
            <rect x={1} y={Math.max(1, airY)} width={298} height={SKY.GY - Math.max(1, airY)} fill="#93c5fd" opacity={0.28} />
            <path d={`M1 ${airY}H299`} stroke="#60a5fa" strokeWidth={1} strokeDasharray="4 3" opacity={airY > 2 ? 1 : 0} />
            {zoom >= 3 && SKY.GY - airY > 26 && (
              <Txt x={262} y={Math.max(airY + 14, 40)} size={8.5} color="#2563eb">
                বায়ুমণ্ডল
              </Txt>
            )}
          </g>
        )}
        {yOf(X7_CLOUD) > 20 && yOf(X7_CLOUD) < SKY.GY - 4 && (
          <g className="pointer-events-none" fill="#fff">
            <ellipse cx={226} cy={yOf(X7_CLOUD)} rx={16} ry={5} />
            <ellipse cx={238} cy={yOf(X7_CLOUD) - 3} rx={9} ry={4} />
          </g>
        )}
        <GroundStrip w={SKY.W} h={SKY.H} gy={SKY.GY} />
        <path d={`M30 ${SKY.GY}V${SKY.GY - X7_BAR}`} stroke={PH.mute} strokeWidth={1} className="pointer-events-none" />
        <path d={`M30 ${SKY.GY - X7_BAR}h5M30 ${SKY.GY}h5`} stroke={PH.mute} strokeWidth={1} className="pointer-events-none" />
        <Txt x={27} y={SKY.GY + 3} size={7.5} anchor="end" color={PH.mute}>
          0
        </Txt>
        <g key={zoom} className={FADE}>
          <Txt x={36} y={SKY.GY - X7_BAR - 8} size={9} anchor="start" color={PH.ink} weight={700}>
            {X7_NAMES[zoom]}
          </Txt>
        </g>
        {bH > 0.6 && (
          <g className="pointer-events-none">
            <rect x={196} y={SKY.GY - bH} width={30} height={bH} fill="#f3e9d8" stroke={INK} strokeWidth={Math.min(1, bH / 3)} />
            {bH > 18 && (
              <Txt x={211} y={SKY.GY - bH - 5} size={8} color={PH.mute}>
                30 তলা
              </Txt>
            )}
          </g>
        )}
        <path d={`M${X7_CX} ${SKY.GY - 52}V${seen ? peakY + 7 : 24}`} stroke={PH.amber} strokeWidth={1.8} strokeDasharray="4 3" className="pointer-events-none" />
        {!seen && <UpHead x={X7_CX} y={20} color={PH.amber} />}
        {!seen && <Tag x={X7_CX + 26} y={22} text="?" tone="amber" size={10} solid />}
        {seen && <circle cx={X7_CX} cy={peakY} r={5} fill="#374151" className="pointer-events-none" />}
        {done && <Tag x={X7_CX + 56} y={peakY} text="5,102 km" tone="mint" size={10} solid pop />}
        <Cannon x={X7_CX} y={SKY.GY} s={0.9} />
      </Sheet>
      <div className="mx-auto mt-2 w-fit text-center font-mono text-sm leading-relaxed">
        <div>
          h = 10,000² / 19.6 <span className={done ? "" : "text-muted"}>= {done ? "100,000,000 / 19.6" : "?"}</span>
        </div>
        {done && <div className={`font-bold text-accent-text ${FADE}`}>≈ 5,102,000 m = 5,102 km</div>}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={`${primaryBtn} h-10! px-4!`} disabled={play.running || zoom >= X7_TOPS.length - 1} onClick={go}>
          আরও দূর থেকে দেখুন
        </button>
      </div>
      <Ticks items={X7_NAMES.slice(1).map((n, i) => [n, zoom > i] as [string, boolean])} />
      <Task done={done}>গোলার পথ ছবির বাইরে চলে গেছে। দূর থেকে দেখতে থাকুন, যতক্ষণ না চূড়াটা দেখা যায়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The sum is right, the answer is wrong. Three lines of the cannon's sum;
// the reader taps the one that is not true up there. The u line and the
// division check out (each works itself out, mint). The g line: the shell
// rises from the Earth and its g arrow shrinks as it goes, "g বদলায়!".

type Line = "u" | "g" | "h";
const X8_LINES: { key: Line; text: string; check: string }[] = [
  { key: "u", text: "u = 10 km/s = 10,000 m/s", check: "10 × 1,000 = 10,000 m: ঠিক" },
  { key: "g", text: "g = 9.8 m/s², পুরো পথে", check: "" },
  { key: "h", text: "h = 10,000² / 19.6 ≈ 5,102 km", check: "100,000,000 ÷ 19.6 = 5,102,041 m: ঠিক" },
];
const X8_NOPE: Record<Line, string> = {
  u: "এই লাইন ঠিক: 10 km মানে 10,000 m। গোলমালটা অন্য লাইনে।",
  g: "",
  h: "ভাগটাও ঠিক। হিসাবে ভুল নেই, তাহলে কোন লাইনটা ধরে নেওয়া কথা?",
};
const X8_TICKS = 34;
const X8_W = 300;
const X8_H = 190;
const X8_R = 150;
const X8_SURF = 170;
const X8_KM = X8_R / 6371;

export function WhereWrong() {
  const pass = useGate();
  const [pick, setPick] = useSeed<Line | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // The shell rises on the clock, slowing as it goes ("out": a throw up to its top).
  const walk = useWalk(X8_TICKS * 45, { steps: false, ease: "out" });
  const go = (key: Line) => {
    if (walk.running) return;
    setPick(key);
    sfx.tap();
    if (key !== "g") {
      setMiss((m) => m + 1);
      return;
    }
    walk.start(() => {
      sfx.chime();
      pass("অনেক উপরে g কমে যায়, 9.8 থাকে না।");
    });
  };
  const p = pick === "g" ? (walk.running ? walk.t : 1) : 0;
  const km = 5102 * p;
  const sy = X8_SURF - 6 - km * X8_KM;
  const gLen = 26 * (6371 / (6371 + km)) ** 2;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === "g";
  return (
    <>
      <Sheet w={X8_W} h={X8_H} label="দূর থেকে পৃথিবী, উপরে কামানের গোলা, তার গায়ে নীল g তীর। হিসাব বলছে গোলা উঠবে 5,102 km।" className="max-w-[18rem]" bg="#0f1b2d">
        {[
          [40, 30],
          [80, 70],
          [250, 40],
          [270, 110],
          [30, 120],
          [210, 20],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={0.9} fill="#fff" opacity={0.7} className="pointer-events-none" />
        ))}
        <circle cx={150} cy={X8_SURF + X8_R} r={X8_R + 5} fill="#60a5fa" opacity={0.35} className="pointer-events-none" />
        <circle cx={150} cy={X8_SURF + X8_R} r={X8_R} fill="#2563eb" className="pointer-events-none" />
        <path d="M70 196q30 -22 60 -12t50 -6" fill="none" stroke="#16a34a" strokeWidth={12} strokeLinecap="round" opacity={0.8} className="pointer-events-none" />
        <path d={`M150 ${X8_SURF - 6 - 5102 * X8_KM}H200`} stroke="#fcd34d" strokeWidth={1} strokeDasharray="3 3" className="pointer-events-none" />
        <Tag x={238} y={X8_SURF - 6 - 5102 * X8_KM} text="হিসাব: 5,102 km" tone="amber" size={8.5} />
        <circle cx={150} cy={sy} r={4.5} fill="#e5e7eb" stroke="#94a3b8" strokeWidth={0.8} className="pointer-events-none" />
        <PArrow a={[162, sy - 10]} b={[162, sy - 10 + gLen]} tone="blue" w={2.2} tell={right ? "g নিচে, 9.8-এর চেয়ে অনেক কম" : "g = 9.8 m/s² নিচে"} />
        <Txt x={170} y={sy - 2} size={9} anchor="start" color="#93c5fd" weight={800}>
          g
        </Txt>
        {pick === "g" && km > 40 && <path d={`M150 ${X8_SURF - 6}V${sy + 6}`} stroke="#fcd34d" strokeWidth={1.2} strokeDasharray="2 3" className="pointer-events-none" />}
        {right && <Tag x={100} y={(sy + X8_SURF) / 2} text="g বদলায়!" tone="red" size={10} solid pop />}
      </Sheet>
      <div className="mt-2 grid gap-1.5">
        {X8_LINES.map((l, i) => (
          <Choice key={l.key} n={i} look={pick === l.key && settled ? (l.key === "g" ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(l.key)}>
            <span className="flex flex-col">
              <span className="font-mono text-sm font-semibold">{l.text}</span>
              {pick === l.key && settled && l.check && <span className={`font-mono text-xs text-accent-text ${FADE}`}>{l.check}</span>}
            </span>
          </Choice>
        ))}
      </div>
      {settled && pick !== "g" && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={right}>হিসাবে ভুল নেই, তবু উত্তর ভুল। কোন লাইনটা এত উঁচুতে সত্যি থাকে না? tap করুন।</Task>
    </>
  );
}

// 8½a · Figure for screen 8's explanation: the shell leaves the cannon at
// 10,000 m/s through the air; it glows with the heat of the friction; it burns.

const S8_SAY = ["কামানের মুখে গোলা।", "গোলা ছুটলো 10,000 m/s বেগে, বাতাসের ভেতর দিয়ে।", "বাতাসের ঘর্ষণে গোলা গরম হয়ে উঠছে।", "এত জোরে ছুটলে পুড়েই যাবে।"];

export function ShellBurns({}: Story) {
  const s = useScene(3, [600, 1600, 1600]);
  const k = s.k;
  const y = k >= 1 ? 52 : 92;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S8_SAY[k]}</span>}>
      <Sheet w={300} h={140} label="কামান থেকে গোলা উপরে ছুটছে। চারপাশে গরমের আভা, শেষে গোলা জ্বলছে।" className="max-w-[17rem]" bg={SKY_BG}>
        <GroundStrip w={300} h={140} gy={124} />
        <Cannon x={110} y={124} s={0.85} />
        <g style={{ transform: `translate(0px, ${y - 92}px)` }} className="transition-transform duration-700 ease-out motion-reduce:transition-none">
          {k >= 2 && <circle cx={110} cy={92} r={14} fill="#fb923c" opacity={0.35} className={FADE} />}
          {k >= 2 && <circle cx={110} cy={92} r={9} fill="#f97316" opacity={0.5} className={FADE} />}
          <circle cx={110} cy={92} r={5} fill={k >= 3 ? "#dc2626" : "#374151"} className="transition-[fill] duration-500 motion-reduce:transition-none" />
          {k >= 1 && <path d="M104 102v14M110 104v18M116 102v14" stroke="#94a3b8" strokeWidth={1} strokeLinecap="round" className={FADE} />}
        </g>
        {k >= 1 && <Tag x={196} y={52} text="10,000 m/s" tone="ink" size={9} pop />}
        {k >= 2 && <Tag x={196} y={74} text="বাতাসের ঘর্ষণ" tone="amber" size={9} pop />}
        {k >= 3 && <Tag x={196} y={28} text="পুড়েই যাবে" tone="red" size={9.5} solid pop />}
      </Sheet>
    </Scene>
  );
}

// 8½b · Figure for screen 8's explanation: the formula's conditions, ticked
// one by one, and then the formula itself.

const S8B_SAY = ["সূত্রের শর্ত।", "পৃথিবীর কাছাকাছি, যেখানে g প্রায় 9.8।", "বাতাসের বাধা কম।", "দুইটা খাটলে, v² = u² − 2gh দারুণ কাজ করে।"];

export function RuleCard({}: Story) {
  const s = useScene(3, [600, 1500, 1500]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S8B_SAY[k]}</span>}>
      <Sheet w={300} h={132} label="একটা ছোট card: পৃথিবীর কাছাকাছি, বাতাসের বাধা কম, তাহলে v² = u² − 2gh।" className="max-w-[17rem]">
        <Txt x={150} y={22} size={10} color={PH.mute} weight={700}>
          সূত্রের শর্ত
        </Txt>
        {k >= 1 && (
          <g className={FADE}>
            <CheckMark x={78} y={44} />
            <Txt x={92} y={48} size={11} anchor="start">
              পৃথিবীর কাছাকাছি
            </Txt>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <CheckMark x={78} y={70} />
            <Txt x={92} y={74} size={11} anchor="start">
              বাতাসের বাধা কম
            </Txt>
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <path d="M150 84v8" stroke={PH.mint} strokeWidth={1.6} />
            <path d="M146 90l4 5l4 -5" fill="none" stroke={PH.mint} strokeWidth={1.6} />
            <rect x={86} y={99} width={128} height={24} rx={6} fill={PH.mintSoft} stroke={PH.mint} strokeWidth={1.5} />
            <Txt x={150} y={115} size={12} weight={800}>
              v² = u² − 2gh
            </Txt>
            <CheckMark x={228} y={111} r={6.5} />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn: the same ball, 2 s after the throw, 22.1 m/s left. How much
// higher? Each pick plants a flag that far above the ball, then it flies on:
// it stops at the old top, 88.6 m, past the 1 m flag, short of the 50 m one,
// on the 25 m one.

const X9_T0 = 2;
const X9_OPTS = [1, 25, 50];
const X9_RIGHT = 1;
const X9_NOPE = ["বল flag ছাড়িয়ে অনেক উপরে উঠলো। 22.1-কে বর্গ না করলে এমন হয়।", "", "বল flag-এর অনেক নিচে থেমে গেলো। ভাগ 2g দিয়ে, মানে 19.6, শুধু 9.8 না।"];
const X9_FLAG = 6;
const X9_TICKS = 32;
const X9_TICK_MS = 45;

export function TheRest() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // The flag goes in, then the flight runs on a linear clock from 2 s to the top.
  const walk = useWalk(X9_TICKS * X9_TICK_MS, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pop();
    walk.start(() => {
      if (i === X9_RIGHT) {
        sfx.chime();
        pass("22.1² / 19.6 ≈ 25 m। চূড়া সেই একই জায়গায়।");
      } else setMiss((m) => m + 1);
    });
  };
  const k = (pick === null ? 0 : walk.running ? walk.t : 1) * X9_TICKS;
  const p = clamp((k - X9_FLAG) / (X9_TICKS - X9_FLAG), 0, 1);
  const t = X9_T0 + (PEAK_T - X9_T0) * p;
  const h0 = ballH(X9_T0);
  const y = ballY(ballH(t));
  const v = Math.max(0, ballV(t));
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X9_RIGHT;
  const fh = pick === null ? 0 : h0 + X9_OPTS[pick];
  const high = skyY(fh) < BREAK_Y + 8;
  const fy = high ? BREAK_Y + 8 : skyY(fh);
  const tone = settled ? (right ? PH.mint : PH.red) : PH.blue;
  return (
    <>
      <SkySheet label="উচ্চতার দাগ দেওয়া আকাশের column। ছোড়ার 2 s পরে বল উঠছে, বেগ 22.1 m/s। বেছে নেওয়া উত্তর বলের উপরে flag বসায়।" scale className="max-w-[16rem]">
        <path d={`M${SKY.X + 24} ${skyY(h0)}H210`} stroke={PH.faint} strokeWidth={1} className="pointer-events-none" />
        <Txt x={230} y={skyY(h0) + 3} size={8} color={PH.mute}>
          2 s-এ
        </Txt>
        {pick !== null && k >= 1 && (
          <g key={pick} className={`pointer-events-none ${FADE}`}>
            <path d={`M40 ${fy}H286`} stroke={tone} strokeWidth={1.3} strokeDasharray="5 3" />
            <path d={`M244 ${fy}V${fy - 16}`} stroke={PH.ink} strokeWidth={1.1} />
            <path d={`M244 ${fy - 16}l11 3.5l-11 3.5Z`} fill={tone} />
            <Txt x={270} y={fy - 6} size={9} color={tone} weight={800}>
              {`+${X9_OPTS[pick]} m`}
            </Txt>
            {high && <UpHead x={262} y={fy + 10} color={tone} />}
          </g>
        )}
        <CricketBall y={y} />
        <BallArrows y={y} v={v} />
        <Tag x={SKY.X - 44} y={y} text={`${f1(v)} m/s`} tone={right ? "mint" : "ink"} size={9.5} />
        {settled && !right && <Tag x={SKY.X - 44} y={y + 18} text="থামলো এখানে" tone="amber" size={8} pop />}
        {settled && !right && <WrongMark x={212} y={high ? fy + 22 : fy - 7} />}
        {right && <Ripple at={[SKY.X, y]} r={22} />}
        {right && (
          <Later>
            <Tag x={SKY.X - 44} y={y + 18} text="চূড়া, 88.6 m" tone="mint" size={8.5} />
          </Later>
        )}
      </SkySheet>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X9_OPTS.map((m, i) => (
          <Choice key={m} n={i} look={pick === i && settled ? (i === X9_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="text-sm whitespace-nowrap">
              আর <span className="font-mono font-semibold">{m} m</span>
            </span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X9_RIGHT && <Nope key={miss}>{X9_NOPE[pick]}</Nope>}
      <Task done={right}>ছোড়ার 2 s পরে বলের বেগ বাকি 22.1 m/s। ওখান থেকে বল আর কত উপরে উঠবে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10a · Recap figure for the last screen: the ball rises, stops at its top,
// h = u²/2g, and under it, g একই.

const S10_SAY = ["বল ছুটলো 41.67 m/s বেগে, সোজা উপরে।", "g প্রতি সেকেন্ডে 9.8 করে কমালো। চূড়ায় v = 0।", "বল উঠলো h = u²/2g পর্যন্ত, প্রায় 88.6 m।", "যতক্ষণ g বদলায় না।"];

export function PeakRecap({}: Story) {
  const s = useScene(3, [600, 1600, 2200]);
  const k = s.k;
  const y = k >= 1 ? ballY(PEAK_H) : ballY(0);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10_SAY[k]}</span>}>
      <SkySheet label="আকাশের column-এ বল তার চূড়ায়। পাশে h = u²/2g, নিচে g একই।" scale className="max-w-[15rem]">
        <g style={{ transform: `translate(0px, ${y - ballY(0)}px)`, transitionTimingFunction: THROW_EASE }} className="transition-transform duration-[1300ms] motion-reduce:transition-none">
          <CricketBall y={ballY(0)} />
        </g>
        {k === 0 && <BallArrows y={ballY(0)} v={BALL_U} g={false} />}
        {k >= 1 && <BallArrows y={y} v={0} />}
        {k >= 1 && <Tag x={SKY.X - 40} y={y} text="v = 0" tone="mint" size={9.5} pop />}
        {k >= 2 && <path d={`M40 ${skyY(PEAK_H)}H${SKY.X - 8}`} stroke={PH.amber} strokeWidth={1} strokeDasharray="3 3" className={`pointer-events-none ${FADE}`} />}
        {k >= 2 && <Tag x={226} y={120} text="h = u²/2g" tone="mint" size={12} solid pop />}
        {k >= 3 && <Tag x={226} y={146} text="g একই" tone="blue" size={10} pop />}
      </SkySheet>
    </Scene>
  );
}

// 10b · The teaser: a sheet of graph paper, two axes, a curve starting to
// draw, and a "?".

const S10B_SAY = ["এক পাতা graph কাগজ।", "দুইটা অক্ষ।", "পুরো গতিটা একটা রেখায়?", "graph থেকে বেগ আর ত্বরণ।"];

export function GraphPaper({}: Story) {
  const s = useScene(3, [600, 1300, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10B_SAY[k]}</span>}>
      <Sheet w={300} h={140} label="graph কাগজ, দুইটা অক্ষ, একটা রেখা আঁকা শুরু হয়েছে, পাশে প্রশ্নবোধক চিহ্ন।" className="max-w-[17rem]" bg="#fbfdf8">
        {Array.from({ length: 19 }, (_, i) => (
          <path key={`v${i}`} d={`M${15 + i * 15} 8V132`} stroke="#d9efe0" strokeWidth={0.7} className="pointer-events-none" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <path key={`h${i}`} d={`M8 ${15 + i * 15}H292`} stroke="#d9efe0" strokeWidth={0.7} className="pointer-events-none" />
        ))}
        {k >= 1 && (
          <g className={FADE}>
            <path d="M40 120H270M40 120V18" stroke={PH.ink} strokeWidth={1.4} className="pointer-events-none" />
            <path d="M270 120l-6 -3v6Z" fill={PH.ink} />
            <path d="M40 18l-3 6h6Z" fill={PH.ink} />
          </g>
        )}
        {k >= 2 && <Draw d="M40 120Q90 116 130 92T190 46" ms={1400} strokeWidth={2.4} className="stroke-[#059669]" />}
        {k >= 3 && (
          <g className={POP}>
            <Txt x={214} y={44} size={20} color={PH.amber} weight={800}>
              ?
            </Txt>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  HeightBet: { start: {}, sealed: { bet: 2 }, cloud: { bet: 0 } },
  PerSecond: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 1 }, right: { pick: 2 } },
  EverySecond: { start: {}, two: { sec: 2 }, four: { sec: 4 }, done: { sec: 5 } },
  WhichSign: { start: {}, plus: { pick: "plus" }, time: { pick: "time" }, right: { pick: "minus" } },
  HowHigh: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  FloorStack: { start: {}, mid: { floors: 18, judged: 18 }, over: { floors: 34, judged: 34 }, right: { floors: 30, judged: 30 } },
  CannonZoom: { start: {}, mid: { zoom: 3 }, done: { zoom: 5 } },
  WhereWrong: { start: {}, wrong: { pick: "u" }, wrong2: { pick: "h" }, right: { pick: "g" } },
  TheRest: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  BowlerBall: { a: { k: 0 }, end: {} },
  TutulTv: { claim: { k: 2 }, end: {} },
  TutulCannon: { ask: { k: 2 }, end: {} },
  UnitSum: { end: {} },
  ZeroIn: { b: { k: 1 }, end: {} },
  ShellBurns: { end: {} },
  RuleCard: { end: {} },
  PeakRecap: { a: { k: 0 }, end: {} },
  GraphPaper: { end: {} },
};
