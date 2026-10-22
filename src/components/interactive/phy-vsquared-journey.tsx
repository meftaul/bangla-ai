"use client";

import { useState } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, primaryBtn, usePlay, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { Bicycle, Gauge, PH, Ripple, Sheet, Txt, WrongMark, svgPoint, toneHex, useWalk, type PhTone, useClock } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 11 — সময় ছাড়া সমীকরণ"
// (src/content/articles/physics_for_high_school/11_v_squared.mdx), the
// journey of video EP 11 (physics_9_10/11-v-squared/script.md). Book §2.7,
// pp. 46–48.
//
// The spine: a bullet stops 10 cm inside a wall; nobody knows how long it
// took. What must we know to find how hard the wall stopped it? The reader
// seals a bet (VsqBet), settled on the last screen: the start speed and the
// stopping path, no time. On the way, the video's own beats in order: both
// old equations carry t, so we are stuck (TwoHaveT), square the first one
// (SquareArea), take 2a common and the bracket is s, t is gone (CommonOut),
// check it on তিথির brake, 6 m/s stops in 9 m → a = −2, EP 09's own answer
// (TithiBrake, BrakeSum, MatchEp09), the bullet's deceleration (BulletNumbers,
// BulletDecel, BulletSum), its time (BulletTime), double the speed and the
// path is four times (DoubleStop, FourNines), and half the speed by the
// reader alone (HalfSpeed).
//
// Canon (PLAYLIST.md, script.md): 6 m/s stops in 9 m → a = −2 m/s² (EP 09's
// brake, 6 → 0 in 3 s); 12 m/s → 144 / 4 = 36 m; bullet 1.5 km/s = 1500 m/s,
// 10 cm = 0.1 m, 1500² / 0.2 = 11,250,000 m/s², t = 1500 / 11,250,000 =
// 1/7500 s. Derived here by the video's own rule (not said in the video):
// 3 m/s → 9 / 4 = 2.25 m (Your turn); the speed still left at a passed mark,
// v² = u² − 2as (DoubleStop: 10.4 m/s at 9 m, 8.5 m/s at 18 m); the bullet
// at half its time, 7.5 cm and 750 m/s (BulletTime).
//
// Reusable: Eq (a mono maths line, one glyph per cell so letters can be lit),
// Wall (a brick wall in cross-section with a bullet hole), Bullet, Stopwatch.

type Story = { story?: boolean };
type P = [number, number];

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
/** a number for the screen: at most `d` decimals, a real minus */
const fmt = (n: number, d = 1) => String(Number(n.toFixed(d))).replace("-", "−");
/** a big number with commas, the video's way: 11,250,000 */
const big = (n: number) => Math.round(n).toLocaleString("en-US");
const ease = (t: number) => 1 - (1 - t) ** 3;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Maths on paper: one glyph per cell, so a single letter can be lit, ringed
// or given a tag. Mono only (no Bangla inside an Eq).

const cellW = (size: number) => size * 0.6;
const lineX0 = (x: number, text: string, size: number, anchor: "start" | "middle") => (anchor === "middle" ? x - ([...text].length * cellW(size)) / 2 : x);
/** the centre x of glyph i of `text` laid at x */
const cellX = (x: number, text: string, size: number, i: number, anchor: "start" | "middle" = "middle") => lineX0(x, text, size, anchor) + (i + 0.5) * cellW(size);

export function Eq({
  x,
  y,
  text,
  size = 16,
  anchor = "middle",
  color = PH.ink,
  weight = 700,
  paint,
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  anchor?: "start" | "middle";
  color?: string;
  weight?: number;
  paint?: (i: number, ch: string) => string | undefined;
}) {
  return (
    <g className="pointer-events-none">
      {[...text].map((ch, i) =>
        ch === " " ? null : (
          <text
            key={i}
            x={cellX(x, text, size, i, anchor)}
            y={y}
            fontSize={size}
            fontWeight={weight}
            textAnchor="middle"
            fill={paint?.(i, ch) ?? color}
            style={{ fontFamily: MONO }}
            className="transition-[fill] duration-300 motion-reduce:transition-none"
          >
            {ch}
          </text>
        ),
      )}
    </g>
  );
}

/**
 * A rounded tag, centred at (x, y): phy-kit's Tag with a roomier width guess,
 * since a Bangla line here mixes digits, conjuncts and units.
 */
const SOFT: Record<PhTone, string> = { mint: PH.mintSoft, amber: PH.amberSoft, blue: PH.blueSoft, red: PH.redSoft, ink: "#f1f5f9", cream: PH.creamSoft };
export function Pill({ x, y, text, tone = "ink", size = 9.5, solid = false, pop = false }: { x: number; y: number; text: string; tone?: PhTone; size?: number; solid?: boolean; pop?: boolean }) {
  const bn = /[ঀ-৿]/.test(text);
  const w = [...text].reduce((a, ch) => a + (bn ? (/[ঀ-৿]/.test(ch) ? 0.66 : /\s/.test(ch) ? 0.3 : 0.6) : 0.62), 0) * size + 14;
  const h = size + 8;
  const c = toneHex(tone);
  return (
    <g className={`pointer-events-none ${pop ? POP : ""}`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={solid ? c : SOFT[tone]} stroke={c} strokeWidth={1.1} />
      <text x={x} y={y + size * 0.36} fontSize={size} textAnchor="middle" fontWeight={700} fill={solid ? "#fff" : tone === "ink" ? PH.ink : c} style={{ fontFamily: bn ? "inherit" : MONO }}>
        {text}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// The wall, the bullet, the stopwatch.

/** A brick wall in cross-section; `hole` = x where the bullet's channel ends (at height cy). */
export function Wall({ x, y, w, h, cy, hole = 0, through = false }: { x: number; y: number; w: number; h: number; cy: number; hole?: number; through?: boolean }) {
  const rows = Math.ceil(h / 12);
  let d = "";
  for (let r = 1; r < rows; r++) d += `M${x} ${y + r * 12}H${x + w}`;
  for (let r = 0; r < rows; r++) {
    const y0 = y + r * 12;
    const y1 = Math.min(y + h, y0 + 12);
    for (let xx = x + (r % 2 ? 12 : 24); xx < x + w - 2; xx += 24) d += `M${xx} ${y0}V${y1}`;
  }
  const end = Math.min(hole, x + w);
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y} width={w} height={h} fill="#c0603e" />
      <path d={d} stroke="#f1dcc4" strokeWidth={1.1} />
      {end > x + 0.5 && <rect x={x} y={cy - 3.5} width={end - x} height={7} fill="#3b2418" />}
      {through && <path d={`M${x + w} ${cy - 12}l-5 5l4 3l-4 4l5 3l-4 5`} stroke="#3b2418" strokeWidth={1.4} fill="none" />}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#7c2d12" strokeWidth={1.2} />
    </g>
  );
}

/** A bullet, its nose at (x, y), pointing right. */
export function Bullet({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M0 0Q-2 -3 -7 -3.2H-15V3.2H-7Q-2 3 0 0Z" fill="#d4a017" stroke="#92400e" strokeWidth={0.8} />
      <path d="M-15 -3.2V3.2" stroke="#92400e" strokeWidth={1.8} />
    </g>
  );
}

/** A stopwatch; `turn` turns its hand (1 = a full round); `q` shows a red ? instead. */
export function Stopwatch({ x, y, r = 14, turn = 0, q = false }: { x: number; y: number; r?: number; turn?: number; q?: boolean }) {
  const ang = turn * 2 * Math.PI;
  return (
    <g className="pointer-events-none">
      <rect x={x - 3} y={y - r - 6} width={6} height={5} rx={1.5} fill={PH.ink} />
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={PH.ink} strokeWidth={1.8} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2;
        return <path key={i} d={`M${x + Math.sin(a) * r * 0.78} ${y - Math.cos(a) * r * 0.78}L${x + Math.sin(a) * r * 0.92} ${y - Math.cos(a) * r * 0.92}`} stroke={PH.mute} strokeWidth={1.2} />;
      })}
      {q ? (
        <text x={x} y={y + r * 0.42} fontSize={r * 1.2} fontWeight={800} textAnchor="middle" fill={PH.red} style={{ fontFamily: MONO }}>
          ?
        </text>
      ) : (
        <>
          <path d={`M${x} ${y}L${x + Math.sin(ang) * r * 0.74} ${y - Math.cos(ang) * r * 0.74}`} stroke={PH.amber} strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={x} cy={y} r={1.8} fill={PH.ink} />
        </>
      )}
    </g>
  );
}

/** A red padlock: this equation is stuck. */
function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g className={`pointer-events-none ${POP}`}>
      <path d={`M${x - 5} ${y - 2}v-4a5 5 0 0 1 10 0v4`} fill="none" stroke={PH.red} strokeWidth={2} />
      <rect x={x - 8} y={y - 2} width={16} height={12} rx={2.5} fill={PH.red} />
      <circle cx={x} cy={y + 3.5} r={1.6} fill="#fff" />
    </g>
  );
}

/** A small mark-flag on a road, foot at (x, y). */
function Flag({ x, y, tone = PH.blue }: { x: number; y: number; tone?: string }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x} ${y}V${y - 26}`} stroke={PH.ink} strokeWidth={1.3} />
      <path d={`M${x} ${y - 26}l11 4l-11 4Z`} fill={tone} className="transition-[fill] duration-300 motion-reduce:transition-none" />
    </g>
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
// 1a · Story scene for screen 1: the bullet flies in and stops 10 cm inside
// the wall; a stopwatch with a red ?, and a = ?.

const S1_WALL = { x: 196, y: 46, w: 92, h: 104, cy: 104 };
const S1_TIP = S1_WALL.x + 30; // 3 stage units per cm

export function BulletWall({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  const tip = k >= 1 ? S1_TIP : 24;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="একটা বুলেট ছুটে এসে দেয়ালে 10 cm ঢুকে থেমে গেলো। পাশে একটা stopwatch, তাতে শুধু ?। দেয়াল কত জোরে থামালো, সেটাও ?।">
        <Wall {...S1_WALL} hole={k >= 1 ? tip : 0} />
        {k >= 1 && <path d="M40 98H150M62 104H172M40 110H150" stroke="#94a3b8" strokeWidth={1.2} strokeLinecap="round" strokeDasharray="10 6" className={FADE} />}
        <g style={{ transform: `translate(${tip}px, ${S1_WALL.cy}px)` }} className="transition-transform duration-500 ease-out motion-reduce:transition-none">
          <Bullet x={0} y={0} s={1.3} />
        </g>
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M${S1_WALL.x} 90V84H${S1_TIP}V90`} fill="none" stroke="#fff" strokeWidth={1.3} />
            <Pill x={(S1_WALL.x + S1_TIP) / 2} y={72} text="10 cm" tone="amber" size={9} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <Stopwatch x={52} y={50} r={18} q />
          </g>
        )}
        {k >= 2 && <Pill x={126} y={50} text="a = ?" tone="amber" size={11} pop />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: what must we know to find how hard the wall stopped it?
// The pick rings those things on the picture, each with a ?. Not marked.

const B_WALL = { x: 168, y: 14, w: 84, h: 100, cy: 64 };
const B_TIP = B_WALL.x + 36;
const BET = ["বুলেটের বেগ আর সময়", "বুলেটের বেগ আর থামার পথ", "বেগ, পথ আর সময়, তিনটাই"];
const BET_LIT = [[0, 2], [0, 1], [0, 1, 2]];
const BET_SPOT: { at: P; w: number; h: number }[] = [
  { at: [90, 44], w: 76, h: 22 },
  { at: [186, 90], w: 48, h: 22 },
  { at: [276, 54], w: 40, h: 56 },
];

export function VsqBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  return (
    <>
      <Sheet w={300} h={126} label="দেয়ালে বুলেট, 10 cm ঢুকে থেমে আছে। বুলেটের বেগ, থামার পথ আর সময়। যেগুলো বাছবেন, ছবিতে সেগুলোতে ? বসবে।" className="max-w-[21rem]">
        <Wall {...B_WALL} hole={B_TIP} />
        <path d={`M24 ${B_WALL.cy}H150`} stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="8 5" />
        <Bullet x={B_TIP} y={B_WALL.cy} s={1.1} />
        <Pill x={90} y={44} text="বুলেটের বেগ" tone="ink" size={9} />
        <Pill x={186} y={90} text="10 cm" tone="amber" size={9} />
        <Stopwatch x={276} y={46} r={13} q />
        <Txt x={276} y={76} size={9} color={PH.mute}>
          সময়
        </Txt>
        {bet !== null &&
          BET_LIT[bet].map((i, n) => {
            const sp = BET_SPOT[i];
            return (
              <g key={`${bet}${i}`} className={POP} style={{ transitionDelay: `${n * 140}ms` }}>
                <rect x={sp.at[0] - sp.w / 2} y={sp.at[1] - sp.h / 2} width={sp.w} height={sp.h} rx={7} fill="none" stroke={PH.blue} strokeWidth={1.6} strokeDasharray="3 2" />
                <circle cx={sp.at[0] + sp.w / 2} cy={sp.at[1] - sp.h / 2} r={6.5} fill={PH.blue} />
                <text x={sp.at[0] + sp.w / 2} y={sp.at[1] - sp.h / 2 + 3.4} fontSize={9.5} fontWeight={800} textAnchor="middle" fill="#fff" style={{ fontFamily: MONO }}>
                  ?
                </text>
              </g>
            );
          })}
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
      <Task done={bet !== null}>দেয়াল বুলেটকে কতটা জোরে থামালো, বের করতে কী কী জানা লাগবে? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The old way fails: both old equations carry t. A tap on an equation
// puts in what the bullet tells us (u জানা, v = 0, s = 10 cm); a and t are
// left with a ? each, and the box locks. Both tried: দুটোতেই t.

const X2_EQ: { text: string; known: Record<string, string>; top: number }[] = [
  { text: "v = u + at", known: { v: "0", u: "জানা" }, top: 24 },
  { text: "s = ut + ½at²", known: { s: "10 cm", u: "জানা" }, top: 92 },
];
const X2_SIZE = 20;
const X2_TICKS = 8;

export function TwoHaveT() {
  const pass = useGate();
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const [now, setNow] = useState<number | null>(null);
  const play = usePlay(110);
  const tryEq = (i: number) => {
    if (play.running || tried.includes(i)) return;
    const next = [...tried, i];
    setTried(next);
    setNow(i);
    sfx.tap();
    play.play(X2_TICKS, () => {
      sfx.thump();
      if (next.length === 2) pass("দুটোতেই t, সময় না জানলে আটকে যাই।");
    });
  };
  const beat = (i: number) => (!tried.includes(i) ? -1 : play.running && now === i ? play.k : X2_TICKS);
  const both = tried.length === 2 && !play.running;
  return (
    <>
      <Sheet w={300} h={172} label="দুইটা সমীকরণ: v = u + at আর s = ut + ½at²। tap করলে বুলেটের জানা মানগুলো বসে, অজানাগুলোতে ? থাকে।">
        {X2_EQ.map((eq, i) => {
          const b = beat(i);
          const isOpen = !tried.includes(i);
          return (
            <g key={eq.text} role="button" aria-label={eq.text} onClick={() => tryEq(i)} className={isOpen ? "cursor-pointer" : ""}>
              <rect x={30} y={eq.top} width={240} height={58} rx={10} fill="#fff" stroke={isOpen ? PH.blue : PH.faint} strokeWidth={1.5} strokeDasharray={isOpen ? "4 3" : undefined} />
              {both &&
                [...eq.text].map((ch, j) => (ch === "t" ? <rect key={`r${j}`} x={cellX(150, eq.text, X2_SIZE, j) - 7.5} y={eq.top + 17} width={15} height={24} rx={4} fill={PH.amberSoft} stroke={PH.amber} strokeWidth={1.4} className={POP} /> : null))}
              <Eq
                x={150}
                y={eq.top + 36}
                text={eq.text}
                size={X2_SIZE}
                paint={(_, ch) => (b >= 5 && (ch === "a" || ch === "t") ? PH.amber : b >= 2 && eq.known[ch] ? PH.mint : undefined)}
              />
              {[...eq.text].map((ch, j) =>
                b >= 2 && eq.known[ch] ? (
                  <Pill key={`k${j}`} x={cellX(150, eq.text, X2_SIZE, j)} y={eq.top + 11} text={eq.known[ch]} tone="mint" size={7.5} pop />
                ) : b >= 5 && (ch === "a" || ch === "t") ? (
                  <g key={`q${j}`} className={POP}>
                    <Txt x={cellX(150, eq.text, X2_SIZE, j)} y={eq.top + 53} size={10} weight={800} color={PH.red}>
                      ?
                    </Txt>
                  </g>
                ) : null,
              )}
              {b >= X2_TICKS && <Lock x={254} y={eq.top + 26} />}
            </g>
          );
        })}
        {both && (
          <g className={FADE}>
            <Txt x={150} y={166} size={10} weight={800} color={PH.amber}>
              দুটোতেই t।
            </Txt>
          </g>
        )}
      </Sheet>
      <Task done={both}>দুইটা সমীকরণেই tap করে বুলেটের জানা মানগুলো বসান। a বের করা যায়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Square both sides. v = u + at, so a square of side u + at has area v².
// The reader picks what v² is; each pick lays its tiles into the square. The
// slips leave one or two uat rooms empty, in red.

const X3_O: P = [24, 26];
const X3_U = 76;
const X3_AT = 52;
const X3_TILES = [
  { x: 0, y: 0, w: X3_U, h: X3_U, label: "u²", fill: PH.blueSoft, edge: PH.blue },
  { x: X3_U, y: 0, w: X3_AT, h: X3_U, label: "uat", fill: PH.amberSoft, edge: PH.amber },
  { x: 0, y: X3_U, w: X3_U, h: X3_AT, label: "uat", fill: PH.amberSoft, edge: PH.amber },
  { x: X3_U, y: X3_U, w: X3_AT, h: X3_AT, label: "a²t²", fill: PH.mintSoft, edge: PH.mint },
];
const X3_OPTS = ["u² + a²t²", "u² + uat + a²t²", "u² + 2uat + a²t²"];
const X3_SET = [[0, 3], [0, 1, 3], [0, 1, 2, 3]];
const X3_RIGHT = 2;
const X3_NOPE = [
  "দুই কোণের বর্গ বসলো, কিন্তু দুইটা uat ঘর ফাঁকা রয়ে গেলো। বর্গ করলে মাঝের পদও আসে।",
  "তিনটা ঘর ভরলো, একটা uat ঘর ফাঁকা। uat আছে দুইবার, তাই লাগবে 2uat।",
  "",
];

export function SquareArea() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(140);
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    sfx.tap();
    play.play(X3_SET[i].length * 3 + 2, () => {
      if (i === X3_RIGHT) {
        sfx.chime();
        pass("বর্গ করলে মাঝে আসে 2uat।");
      } else {
        sfx.slip();
        setMiss((m) => m + 1);
      }
    });
  };
  const end = pick !== null && !play.running;
  const right = end && pick === X3_RIGHT;
  const set = pick === null ? [] : X3_SET[pick];
  const side = X3_U + X3_AT;
  const [ox, oy] = X3_O;
  const gaps = end ? 4 - set.length : 0;
  return (
    <>
      <Sheet w={300} h={176} label="বাহু u + at, মানে v, এমন একটা বর্গ। ভেতরে চারটা ঘর: u², দুইটা uat, a²t²। যেটা বাছবেন, সেই ঘরগুলো বসবে।">
        <Txt x={ox + X3_U / 2} y={18} size={11} weight={800} color={PH.blue}>
          u
        </Txt>
        <Txt x={ox + X3_U + X3_AT / 2} y={18} size={11} weight={800} color={PH.amber}>
          at
        </Txt>
        <Txt x={12} y={oy + X3_U / 2 + 4} size={11} weight={800} color={PH.blue}>
          u
        </Txt>
        <Txt x={12} y={oy + X3_U + X3_AT / 2 + 4} size={11} weight={800} color={PH.amber}>
          at
        </Txt>
        {X3_TILES.map((t, i) => {
          const pos = set.indexOf(i);
          const shown = pos >= 0 && (!play.running || play.k >= pos * 3 + 1);
          const empty = end && pos < 0;
          return (
            <g key={i}>
              {shown && (
                <g className={POP}>
                  <rect x={ox + t.x + 1} y={oy + t.y + 1} width={t.w - 2} height={t.h - 2} rx={3} fill={t.fill} stroke={t.edge} strokeWidth={1.3} />
                  <Eq x={ox + t.x + t.w / 2} y={oy + t.y + t.h / 2 + 5} text={t.label} size={13} color={t.edge} />
                </g>
              )}
              {empty && (
                <g className={FADE}>
                  <rect x={ox + t.x + 1} y={oy + t.y + 1} width={t.w - 2} height={t.h - 2} rx={3} fill={PH.redSoft} stroke={PH.red} strokeWidth={1.3} strokeDasharray="4 3" />
                  <Txt x={ox + t.x + t.w / 2} y={oy + t.y + t.h / 2 + 4} size={9.5} weight={800} color={PH.red}>
                    ফাঁকা
                  </Txt>
                </g>
              )}
            </g>
          );
        })}
        <rect x={ox} y={oy} width={side} height={side} fill="none" stroke={PH.ink} strokeWidth={1.6} />
        {right && <Ripple at={[ox + side / 2, oy + side / 2]} r={side / 2 + 4} />}
        <path d={`M${ox + X3_U} ${oy}V${oy + side}M${ox} ${oy + X3_U}H${ox + side}`} stroke={PH.faint} strokeWidth={1} strokeDasharray="3 3" />
        <Txt x={232} y={36} size={9.5} color={PH.mute}>
          বর্গের বাহু
        </Txt>
        <Eq x={232} y={56} text="u + at = v" size={12} />
        <Txt x={232} y={84} size={9.5} color={PH.mute}>
          পুরো ক্ষেত্রফল
        </Txt>
        <Eq x={232} y={104} text="v² = (u + at)²" size={11} />
        {pick !== null && (
          <g key={pick} className={FADE}>
            <Eq x={232} y={128} text={`= ${X3_OPTS[pick]}`} size={10} color={end ? (right ? PH.mint : PH.red) : PH.ink} />
          </g>
        )}
        {end && (
          <g className={FADE}>
            <Txt x={232} y={154} size={10} weight={800} color={right ? PH.mint : PH.red}>
              {right ? "পুরো বর্গ ভরলো" : gaps === 2 ? "দুইটা ঘর ফাঁকা" : "একটা ঘর ফাঁকা"}
            </Txt>
          </g>
        )}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X3_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && end ? (i === X3_RIGHT ? "right" : "wrong") : "idle"} disabled={play.running || right} onClick={() => choose(i)}>
            <span className="font-mono font-bold">{`v² = ${o}`}</span>
          </Choice>
        ))}
      </div>
      {end && pick !== X3_RIGHT && <Nope key={miss}>{X3_NOPE[pick]}</Nope>}
      <Task done={right}>v = u + at, তাই বাহু u + at-এর বর্গটাই v²। এর পুরো ক্ষেত্রফল কোনটা? বেছে নিন, ঘরগুলো বসিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · t is gone. From the last two terms the reader takes something common;
// the old s card rises under the bracket to compare. 2a leaves ut + ½at², the
// card itself: the bracket turns into s, the t's fly off, v² = u² + 2as.

const X4_L1 = "v² = u² + 2uat + a²t²";
const X4_OPTS = [
  { pre: "2a", inside: "ut + ½at²" },
  { pre: "a", inside: "2ut + at²" },
  { pre: "t", inside: "2ua + a²t" },
];
const X4_RIGHT = 0;
const X4_SIZE = 14;
// One clock for the whole beat: the card rises (first 6/14), the verdict lands (8/14), the t's fly off (10/14).
const X4_MS = 1680;
const X4_CARD = "s = ut + ½at²";
const X4_NOPE = ["", "ভেতরে এলো 2ut + at²। এটা s-এর দ্বিগুণ, s না। বাইরে আরেকটা 2 নিতে হবে।", "ভেতরে এলো 2ua + a²t। ভেতরে এখনো t, বাইরেও t। সময় উধাও হলো না।"];

export function CommonOut() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X4_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.tap();
    walk.start(() => {
      if (i === X4_RIGHT) {
        sfx.chime();
        pass("ভেতরে s, তাই v² = u² + 2as। t উধাও।");
      } else {
        sfx.slip();
        setMiss((m) => m + 1);
      }
    });
  };
  const cw = cellW(X4_SIZE);
  const opt = pick === null ? null : X4_OPTS[pick];
  const l2 = opt ? `v² = u² + ${opt.pre}(${opt.inside})` : "";
  const inIdx = opt ? 10 + opt.pre.length + 1 : 0;
  const l2x0 = opt ? lineX0(150, l2, X4_SIZE, "middle") : 0;
  const cardX0 = opt ? l2x0 + (inIdx - 4) * cw : 150 - ([...X4_CARD].length * cw) / 2;
  const wt = pick === null ? 0 : walk.running ? walk.t : 1;
  const p = Math.min(1, (wt * 14) / 6);
  const cardY = lerp(150, 100, ease(p));
  const verdict = pick !== null && wt >= 8 / 14;
  const right = verdict && pick === X4_RIGHT;
  const gone = right && wt >= 10 / 14;
  const done = right && !walk.running;
  const l1x0 = lineX0(150, X4_L1, X4_SIZE, "middle");
  return (
    <>
      <Sheet w={300} h={172} label="v² = u² + 2uat + a²t²। শেষের দুইটা পদ থেকে কিছু common নিলে একটা bracket হয়। নিচে আগের সমীকরণ s = ut + ½at², উঠে এসে bracket-এর সাথে মেলে কি না দেখায়।">
        <Eq x={150} y={30} text={X4_L1} size={X4_SIZE} paint={(i) => (i >= 10 ? PH.amber : undefined)} />
        <path d={`M${l1x0 + 10 * cw} 37v4H${l1x0 + 20 * cw}v-4`} fill="none" stroke={PH.amber} strokeWidth={1.3} />
        {opt && (
          <g key={pick} className={FADE}>
            <Eq
              x={150}
              y={72}
              text={l2}
              size={X4_SIZE}
              paint={(i) => (i > inIdx - 1 && i < inIdx + 9 ? (gone ? PH.faint : verdict ? (right ? PH.mint : PH.red) : PH.amber) : i >= 10 && i < inIdx ? PH.blue : undefined)}
            />
          </g>
        )}
        {opt &&
          right &&
          [...opt.inside].map((ch, j) =>
            ch === "t" ? (
              <text
                key={j}
                x={l2x0 + (inIdx + j + 0.5) * cw}
                y={72}
                fontSize={X4_SIZE}
                fontWeight={800}
                textAnchor="middle"
                fill={PH.amber}
                style={{ fontFamily: MONO, transform: `translate(${j < 4 ? -14 : 14}px, ${gone ? -44 : 0}px)`, opacity: gone ? 0 : 1 }}
                className="pointer-events-none transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-none"
              >
                t
              </text>
            ) : null,
          )}
        <g className="pointer-events-none">
          <rect x={cardX0 - 6} y={cardY - 16} width={[...X4_CARD].length * cw + 12} height={23} rx={6} fill={PH.creamSoft} stroke={PH.cream} strokeWidth={1.2} />
          <Eq x={cardX0} y={cardY} text={X4_CARD} size={X4_SIZE} anchor="start" paint={(i) => (i === 0 && right ? PH.mint : undefined)} />
          {p < 0.05 && (
            <Txt x={cardX0 + ([...X4_CARD].length * cw) / 2} y={cardY + 19} size={8.5} color={PH.mute}>
              আগের সমীকরণ
            </Txt>
          )}
          {verdict && <Pill x={cardX0 + ([...X4_CARD].length * cw) / 2} y={cardY + 19} text={right ? "হুবহু s" : "s না"} tone={right ? "mint" : "red"} size={9} pop />}
        </g>
        {done && (
          <g className={POP}>
            <rect x={78} y={134} width={144} height={30} rx={8} fill={PH.mintSoft} stroke={PH.mint} strokeWidth={1.8} />
            <Eq x={150} y={155} text="v² = u² + 2as" size={16} color={PH.ink} />
          </g>
        )}
      </Sheet>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X4_OPTS.map((o, i) => (
          <Choice key={o.pre} n={i} look={pick === i && verdict && !walk.running ? (i === X4_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || done} onClick={() => choose(i)}>
            <span className="font-mono font-bold">{o.pre}</span>
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== X4_RIGHT && !walk.running && <Nope key={miss}>{X4_NOPE[pick]}</Nope>}
      <Task done={done}>শেষের দুইটা পদ থেকে কী common নিলে ভেতরে ঠিক s থাকে? বেছে নিন, তারপর মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5a · Story scene for screen 5: তিথি at 6 m/s brakes and stops 9 m on; the
// tape 9 m, and v = 0.

const S5_X0 = 54;
const S5_X1 = 254;

export function TithiBrake({}: Story) {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  // the brake on a straight clock: 6 → 0 in 3 s at a = −2, so s = 6t − t² places her and v = 6 − 2t reads on the needle
  const tau = 3 * useClock(k >= 1, 1600);
  const bx = S5_X0 + ((S5_X1 - S5_X0) * (6 * tau - tau * tau)) / 9;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="তিথি সাইকেলে 6 m/s-এ চলছে। brake কষলো, 9 m গিয়ে থামলো। শেষ বেগ 0।">
        <path d="M0 150H320" stroke="#78716c" strokeWidth={2} />
        <circle cx={44} cy={44} r={28} fill="#fff" stroke={PH.faint} strokeWidth={1} />
        <Gauge x={44} y={48} r={20} v={6 - 2 * tau} max={8} digits={tau > 0 && tau < 3 ? 1 : 0} />
        {k >= 1 && <path d={`M${S5_X0 + 30} 152H${S5_X1 - 16}M${S5_X0 + 44} 155H${S5_X1 - 30}`} stroke="#44403c" strokeWidth={1.2} strokeLinecap="round" strokeDasharray="14 8" className={FADE} />}
        <g transform={`translate(${bx.toFixed(1)} 150)`}>
          <Bicycle x={0} y={0} s={1.5} spin={bx * 3} />
        </g>
        {k === 1 && <Pill x={150} y={92} text="brake" tone="red" size={10} pop />}
        {k >= 2 && (
          <g className={FADE}>
            <path d={`M${S5_X0} 166V172H${S5_X1}V166`} fill="none" stroke={PH.cream} strokeWidth={2} />
            <Pill x={(S5_X0 + S5_X1) / 2} y={166} text="9 m" tone="cream" size={9.5} />
            <Pill x={S5_X1} y={66} text="v = 0" tone="mint" size={10} pop />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 5 · The check on তিথি: 0 = 6² + 2 × a × 9. Three values of a; each plays
// three seconds of braking from 6 m/s at that a. +2 runs past the 9 m mark,
// −4 stops at 4.5 m, −2 stops on the mark: 36 + 18 × (−2) = 0.

const X5_A = [2, -2, -4];
const X5_RIGHT = 1;
const X5_X0 = 34;
const X5_PX = 20; // units per metre: 9 m lands at x 214
const X5_Y = 70; // the road
/** How long each pick rides, in seconds: +2 until she reaches 12 m (the sheet's edge), −2 and −4 until she stops. */
const X5_T = [Math.sqrt(21) - 3, 3, 1.5];
const X5_MS = 1560;
const X5_NOPE = [
  "+2 মানে প্রতি সেকেন্ডে বেগ বাড়ে: তিথি 9 m-এর দাগ পেরিয়ে ছুটলো। 36 + 18a = 0 হতে হলে 18a = −36।",
  "",
  "−4-এ brake বেশি জোরে: তিথি 4.5 m-এই থেমে গেলো। 36-কে ভাগ করুন 18 দিয়ে, 9 দিয়ে না।",
];

function rideAt(u: number, a: number, tau: number) {
  if (a < 0) {
    const ts = Math.min(tau, u / -a);
    return { v: Math.max(0, u + a * tau), s: u * ts + (a * ts * ts) / 2 };
  }
  return { v: u + a * tau, s: u * tau + (a * tau * tau) / 2 };
}

export function BrakeSum() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X5_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.scrape(0.6);
    walk.start(() => {
      if (i === X5_RIGHT) {
        sfx.chime();
        pass("36 + 18a = 0, তাই a = −2 m/s²।");
      } else {
        sfx.slip();
        setMiss((m) => m + 1);
      }
    });
  };
  // seconds on a straight clock; s = ut + ½at² places the bike, v = u + at moves the needle
  const tau = pick === null ? 0 : X5_T[pick] * (walk.running ? walk.t : 1);
  const a = pick === null ? 0 : X5_A[pick];
  const st = pick === null ? { v: 6, s: 0 } : rideAt(6, a, tau);
  const bx = X5_X0 + st.s * X5_PX;
  const end = pick !== null && !walk.running;
  const right = end && pick === X5_RIGHT;
  const wrong = end && pick !== X5_RIGHT;
  const aTxt = a < 0 ? `(${fmt(a)})` : fmt(a);
  const mark = X5_X0 + 9 * X5_PX;
  return (
    <>
      <Sheet w={300} h={156} label="তিথি 6 m/s-এ, সামনে 9 m-এর দাগ। যে a বাছবেন, সেই ত্বরণে 3 সেকেন্ড চলবে। নিচে হিসাব: 0 = 6² + 2 × a × 9।">
        <path d={`M8 ${X5_Y}H292`} stroke="#a8a29e" strokeWidth={4} strokeLinecap="round" />
        <path d={`M${X5_X0} ${X5_Y - 10}V${X5_Y + 10}M${mark} ${X5_Y - 14}V${X5_Y + 12}`} stroke={PH.amber} strokeWidth={1.4} strokeDasharray="3 2" />
        <Txt x={X5_X0} y={X5_Y + 22} size={8.5} color={PH.mute}>
          0
        </Txt>
        <Txt x={mark} y={X5_Y + 24} size={9} weight={800} color={right ? PH.mint : PH.amber}>
          9 m
        </Txt>
        {right && <Ripple at={[mark, X5_Y - 20]} r={30} />}
        <g transform={`translate(${bx.toFixed(1)} ${X5_Y})`}>
          <Bicycle x={0} y={0} s={1.2} spin={st.s * 60} />
        </g>
        {wrong && <WrongMark key={miss} x={Math.min(bx + 22, 290)} y={X5_Y - 50} />}
        {end && (
          <g className={FADE}>
            <Pill x={Math.max(120, Math.min(236, bx))} y={X5_Y + 38} text={right ? "ঠিক 9 m-এ থামলো" : pick === 0 ? "9 m পেরিয়ে গেলো" : "4.5 m-এই থামলো"} tone={right ? "mint" : "red"} size={9} />
          </g>
        )}
        <Gauge x={44} y={138} r={19} v={st.v} max={12} />
        <Eq x={190} y={131} text="0 = 6² + 2 × a × 9" size={11} />
        {end && (
          <g key={pick} className={FADE}>
            <Eq x={190} y={150} text={`36 + 18 × ${aTxt} = ${fmt(36 + 18 * a)}`} size={11} color={right ? PH.mint : PH.red} />
          </g>
        )}
      </Sheet>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X5_A.map((v, i) => (
          <Choice key={v} n={i} look={pick === i && end ? (i === X5_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="font-mono font-bold whitespace-nowrap">{`${v > 0 ? "+" : ""}${fmt(v)}`}</span>
          </Choice>
        ))}
      </div>
      {end && pick !== X5_RIGHT && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>0 = 6² + 2 × a × 9। তিথির a কত? বেছে নিন, তারপর দেখুন সাইকেল কোথায় থামে।</Task>
    </>
  );
}

// 5½ · Figure for screen 5's explanation: the new sum's −2 beside EP 09's
// card (0 − 6) / 3 = −2, and মিলে গেছে.

const S5_SAY = ["নতুন সমীকরণে: 36 + 18a = 0, তাই a = −2।", "ত্বরণের journey-তে: 6 থেকে 0, 3 সেকেন্ডে।", "হুবহু মিলে গেছে।"];

export function MatchEp09({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <Sheet w={280} h={104} label="বাঁয়ে নতুন সমীকরণের হিসাব: a = −2। ডানে ত্বরণের journey-র হিসাব: (0 − 6) / 3 = −2। দুটো মিলে গেছে।" className="max-w-[18rem]">
        <rect x={10} y={14} width={124} height={62} rx={8} fill="#fff" stroke={PH.blue} strokeWidth={1.3} />
        <Txt x={72} y={30} size={8.5} color={PH.mute}>
          v² = u² + 2as থেকে
        </Txt>
        <Eq x={72} y={50} text="36 + 18a = 0" size={11} />
        <Eq x={72} y={68} text="a = −2 m/s²" size={11} color={PH.blue} />
        {k >= 1 && (
          <g className={FADE}>
            <rect x={146} y={14} width={124} height={62} rx={8} fill={PH.creamSoft} stroke={PH.cream} strokeWidth={1.3} />
            <Txt x={208} y={30} size={8.5} color={PH.mute}>
              ত্বরণের journey
            </Txt>
            <Eq x={208} y={50} text="(0 − 6) / 3" size={11} />
            <Eq x={208} y={68} text="a = −2 m/s²" size={11} color={PH.blue} />
          </g>
        )}
        {k >= 2 && (
          <g>
            <TickMark x={140} y={66} r={8} />
            <Pill x={140} y={92} text="মিলে গেছে" tone="mint" solid size={9} pop />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · Figure for screen 6's setup: the bullet's numbers in metres.

const S6_SAY = ["বুলেটের বেগ দেড় km/s।", "মানে 1500 m/s।", "থামলো 10 cm-এ, মানে 0.1 m-এ।", "শেষ বেগ 0।"];

export function BulletNumbers({}: Story) {
  const s = useScene(3, [600, 1300, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S6_SAY[k]}</span>}>
      <Sheet w={260} h={100} label="u = 1.5 km/s = 1500 m/s. s = 10 cm = 0.1 m. v = 0." className="max-w-[17rem]">
        <Eq x={22} y={30} text="u = 1.5 km/s" size={13} anchor="start" />
        {k >= 1 && (
          <g className={FADE}>
            <Eq x={142} y={30} text="= 1500 m/s" size={13} anchor="start" color={PH.mint} />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <Eq x={22} y={58} text="s = 10 cm" size={13} anchor="start" />
            <Eq x={142} y={58} text="= 0.1 m" size={13} anchor="start" color={PH.mint} />
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <Eq x={22} y={86} text="v = 0" size={13} anchor="start" />
            <Txt x={142} y={86} size={10} anchor="start" color={PH.mute}>
              থেমে গেলো
            </Txt>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// 6 · The bullet's deceleration. Three values; each flies the bullet into the
// wall at 1500 m/s and slows it at that rate. 7,500 (no square) goes clean
// through, 112,500,000 (2 × 0.1 = 0.02) stops at 1 cm, 11,250,000 at 10 cm.

const W6 = { x: 128, y: 14, w: 156, h: 88, cy: 58 };
const W6_PM = 600; // units per metre: 10 cm = 60
const X6_U = 1500;
const X6_A = [7500, 11250000, 112500000];
const X6_RIGHT = 1;
const X6_T = X6_U / X6_A[X6_RIGHT]; // 1/7500 s
/** One clock: the first quarter flies the bullet to the wall at 1500 m/s, the rest slows it inside. */
const X6_MS = 1440;
const X6_IN = 0.25;
/** a bullet that goes clean through stops on the page, its nose just out of the wall */
const X6_OUT = W6.x + W6.w + 14;
const X6_NOPE = [
  "বুলেট দেয়াল ফুঁড়ে বেরিয়ে গেলো। 1500 ÷ 0.2 নিয়েছেন, বর্গ করা হয়নি: u² মানে 1500 × 1500।",
  "",
  "বুলেট 1 cm-এই থেমে গেলো, 10 cm-এর অনেক আগে। 2 × 0.1 হয় 0.2, 0.02 না।",
];

function bulletAt(a: number, tau: number) {
  const ts = Math.min(tau, X6_U / a);
  return { v: Math.max(0, X6_U - a * tau), s: X6_U * ts - (a * ts * ts) / 2 };
}

/** The wall of screens 6–7 with its 10 cm bracket over the hole. */
function WallTen({ hole, through = false }: { hole: number; through?: boolean }) {
  const ten = W6.x + 0.1 * W6_PM;
  return (
    <g className="pointer-events-none">
      <Wall {...W6} hole={hole} through={through} />
      <path d={`M${W6.x} ${W6.cy - 12}V${W6.cy - 18}H${ten}V${W6.cy - 12}`} fill="none" stroke="#fff" strokeWidth={1.4} />
      <Pill x={(W6.x + ten) / 2} y={W6.cy - 28} text="10 cm" tone="amber" size={8.5} />
    </g>
  );
}

export function BulletDecel() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X6_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.35);
    walk.start(() => {
      if (i === X6_RIGHT) {
        sfx.chime();
        pass("মন্দন 11,250,000 m/s², সময় ছাড়াই।");
      } else {
        sfx.slip();
        setMiss((m) => m + 1);
      }
    });
  };
  const wt = pick === null ? 0 : walk.running ? walk.t : 1;
  const a = pick === null ? 0 : X6_A[pick];
  const inside = wt > X6_IN;
  // inside the wall the slowing is the equation's own: s = ut − ½at², v = u − at
  const st = pick === null || !inside ? { v: X6_U, s: 0 } : bulletAt(a, ((wt - X6_IN) / (1 - X6_IN)) * 1.6 * X6_T);
  const tip = pick === null ? 16 : inside ? Math.min(W6.x + st.s * W6_PM, X6_OUT) : lerp(16, W6.x, wt / X6_IN);
  const end = pick !== null && !walk.running;
  const right = end && pick === X6_RIGHT;
  const through = tip > W6.x + W6.w;
  return (
    <>
      <Sheet w={300} h={156} label="দেয়ালের ছেদ, বাঁ দিক থেকে বুলেট আসবে 1500 m/s-এ। যে মন্দন বাছবেন, দেয়াল সেই হারে থামাবে। আসল গর্ত 10 cm।">
        <WallTen hole={pick === null ? 0 : tip} through={through} />
        {pick !== null && !inside && <path d={`M10 ${W6.cy}H${tip - 16}`} stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="8 5" />}
        <Bullet x={tip} y={W6.cy} s={1.1} />
        {right && <Ripple at={[tip - 4, W6.cy]} r={24} />}
        {end && !right && <WrongMark key={miss} x={pick === 0 ? X6_OUT - 6 : W6.x - 10} y={W6.cy - 14} />}
        <Txt x={66} y={124} size={11} weight={700}>
          {`v = ${big(st.v)} m/s`}
        </Txt>
        {end && (
          <g className={FADE}>
            {right ? (
              <Pill x={222} y={120} text="ঠিক 10 cm-এ থামলো" tone="mint" size={9} />
            ) : pick === 0 ? (
              <Pill x={222} y={120} text="দেয়াল ফুঁড়ে বেরিয়ে গেলো" tone="red" size={9} />
            ) : (
              <Pill x={222} y={120} text="1 cm-এই থামলো" tone="red" size={9} />
            )}
          </g>
        )}
        <Eq x={150} y={146} text="0 = 1500² + 2 × a × 0.1" size={10.5} />
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X6_A.map((v, i) => (
          <Choice key={v} n={i} look={pick === i && end ? (i === X6_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span>
              মন্দন <span className="font-mono font-bold">{`${big(v)} m/s²`}</span>
            </span>
          </Choice>
        ))}
      </div>
      {end && pick !== X6_RIGHT && <Nope key={miss}>{X6_NOPE[pick]}</Nope>}
      <Task done={right}>দেয়াল বুলেটকে কত মন্দনে থামালো? বেছে নিন, তারপর দেখুন বুলেট কোথায় থামে।</Task>
    </>
  );
}

// 6½ · Figure for screen 6's explanation: a = u² / 2s, built as the video says it.

const S6B_SAY = ["থামলে v = 0, তাই মন্দন a = u² / 2s।", "পনেরোশোর স্কয়ার, বাইশ লক্ষ পঞ্চাশ হাজার।", "ভাগ 2 × 0.1, মানে 0.2।", "মন্দন 11,250,000 m/s²।"];

export function BulletSum({}: Story) {
  const s = useScene(3, [600, 1600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S6B_SAY[k]}</span>}>
      <Sheet w={260} h={110} label="a = u² / 2s = 2,250,000 / 0.2 = 11,250,000 m/s²." className="max-w-[17rem]">
        <Eq x={130} y={28} text="a = u² / 2s" size={14} />
        {k >= 1 && (
          <g className={FADE}>
            <Eq x={130} y={54} text="1500² = 2,250,000" size={12} paint={(i) => (i >= 8 ? PH.blue : undefined)} />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <Eq x={130} y={76} text="2 × 0.1 = 0.2" size={12} paint={(i) => (i >= 10 ? PH.blue : undefined)} />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={44} y={84} width={172} height={22} rx={11} fill={PH.mintSoft} stroke={PH.mint} strokeWidth={1.3} />
            <Eq x={130} y={100} text="a = 11,250,000 m/s²" size={12} color={PH.mint} />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · Now the time too: বেগ ভাগ মন্দন. Three sums; each runs the stopwatch
// for that long with the bullet's real slowing. 1/15000 s leaves it at
// 7.5 cm, still at 750 m/s; 7500 s keeps the clock going two hours after it
// stopped; 1/7500 s stops the clock exactly as the bullet stops.

const X7_OPTS = ["0.1 ÷ 1500 = 1/15000 s", "11,250,000 ÷ 1500 = 7500 s", "1500 ÷ 11,250,000 = 1/7500 s"];
const X7_RIGHT = 2;
const X7_NOPE = [
  "এই সময়ে বুলেট মাত্র 7.5 cm গেছে, এখনও 750 m/s-এ ছুটছে। 0.1 ÷ 1500 মানে পুরো পথ 1500 m/s-এ, কিন্তু বেগ তো কমছিল।",
  "বুলেট থেমেছে অনেক আগেই, ঘড়ি চলছে তো চলছেই: 7500 s মানে দুই ঘণ্টার বেশি! ভাগটা উল্টে গেছে: বেগ ভাগ মন্দন।",
  "",
];
const X7_READ = ["t = 1/15000 s", "t = 7500 s ≈ 2 ঘণ্টা", "t = 1/7500 s"];
const X7_MS = 1520;

export function BulletTime() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X7_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.tap();
    walk.start(() => {
      if (i === X7_RIGHT) {
        sfx.chime();
        pass("সময় = বেগ ÷ মন্দন = 1/7500 s।");
      } else {
        sfx.slip();
        setMiss((m) => m + 1);
      }
    });
  };
  const f = pick === null ? 0 : walk.running ? walk.t : 1;
  // τ in units of the true stopping time T = 1/7500 s
  const tauT = pick === null ? 0 : pick === 0 ? f / 2 : pick === 2 ? f : Math.min(1, f * 2);
  const st = bulletAt(X6_A[X6_RIGHT], tauT * X6_T);
  const tip = W6.x + st.s * W6_PM;
  const spin = pick === 1 && f > 0.5 ? 0.75 + (f - 0.5) * 2 * 9.25 : tauT * 0.75;
  const end = pick !== null && !walk.running;
  const right = end && pick === X7_RIGHT;
  return (
    <>
      <Sheet w={300} h={156} label="দেয়ালের ছেদ, বুলেট দেয়ালে ঢুকছে, পাশে stopwatch। যে সময় বাছবেন, ঘড়ি ততক্ষণ চলবে। তখন বুলেট কোথায়, কত বেগে, দেখায়।">
        <WallTen hole={pick === null ? W6.x : tip} />
        <Bullet x={pick === null ? W6.x : tip} y={W6.cy} s={1.1} />
        <Stopwatch x={60} y={58} r={26} turn={spin} />
        {right && <Ripple at={[60, 58]} r={34} />}
        {right && <Ripple at={[tip - 4, W6.cy]} r={22} />}
        {end && !right && <WrongMark key={miss} x={96} y={40} />}
        <Txt x={60} y={102} size={8.5} color={PH.mute}>
          stopwatch
        </Txt>
        <Txt x={150} y={124} size={10.5} weight={700}>
          {`s = ${fmt(st.s * 100)} cm · v = ${big(st.v)} m/s`}
        </Txt>
        {pick !== null && (
          <g key={pick} className={FADE}>
            <Txt x={150} y={146} size={11} weight={800} color={end ? (right ? PH.mint : PH.red) : PH.ink}>
              {X7_READ[pick]}
            </Txt>
          </g>
        )}
        {end && (
          <g className={FADE}>
            {right ? (
              <Pill x={226} y={86} text="ঠিক তখনই থামলো" tone="mint" size={8.5} />
            ) : pick === 0 ? (
              <Pill x={226} y={86} text="এখনও ছুটছে" tone="red" size={8.5} />
            ) : (
              <Pill x={226} y={86} text="কবেই থেমে গেছে" tone="red" size={8.5} />
            )}
          </g>
        )}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X7_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && end ? (i === X7_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="font-mono text-sm font-bold">{`t = ${o}`}</span>
          </Choice>
        ))}
      </div>
      {end && pick !== X7_RIGHT && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={right}>বুলেটটা কতক্ষণ ধরে দেয়ালে ঢুকলো? হিসাবটা বেছে নিন, তারপর ঘড়ি চালিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Double the speed. Top lane: 6 m/s stops in 9 m. Bottom lane: 12 m/s,
// the same brake (a = −2). The reader plants a flag where she will stop; the
// brake then plays. 9 m and 18 m are passed at speed; she stops at 36 m.

const X8_X0 = 52;
const X8_PX = 6.2; // units per metre: 36 m lands at x 275
const X8_D = [18, 36, 9];
const X8_RIGHT = 1;
const X8_MS = 1800;
const X8_Y1 = 50;
const X8_Y2 = 112;
const X8_NOPE: Record<number, string> = {
  18: "বেগ দ্বিগুণ, পথও দ্বিগুণ ভেবেছিলেন। কিন্তু 18 m-এর দাগে তিথি তখনও 8.5 m/s-এ ছুটছে।",
  9: "একই brake, তাই একই পথ? না: 9 m-এর দাগে তিথি তখনও 10.4 m/s-এ ছুটছে।",
};

export function DoubleStop() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(X8_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.scrape(0.9);
    walk.start(() => {
      if (i === X8_RIGHT) {
        sfx.chime();
        pass("বেগ দ্বিগুণ, থামার পথ চারগুণ: 36 m।");
      } else {
        sfx.slip();
        setMiss((m) => m + 1);
      }
    });
  };
  // 12 → 0 at a = −2 takes 6 s; on a straight clock, s = ut + ½at² places her
  const tau = pick === null ? 0 : 6 * (walk.running ? walk.t : 1);
  const st = rideAt(12, -2, tau);
  const d = pick === null ? null : X8_D[pick];
  const passed = d !== null && st.s > d + 0.05;
  const end = pick !== null && !walk.running;
  const right = end && pick === X8_RIGHT;
  const mx = (m: number) => X8_X0 + m * X8_PX;
  return (
    <>
      <Sheet w={300} h={150} label="দুইটা রাস্তা। উপরে তিথি 6 m/s থেকে brake কষে 9 m-এ থেমেছে। নিচে 12 m/s থেকে একই brake। যে দাগ বাছবেন, সেখানে flag বসবে।">
        <Txt x={8} y={22} size={9} anchor="start" weight={700}>
          6 m/s
        </Txt>
        <path d={`M8 ${X8_Y1}H292`} stroke="#a8a29e" strokeWidth={3.5} strokeLinecap="round" />
        <path d={`M${mx(0)} ${X8_Y1 + 8}v4H${mx(9)}v-4`} fill="none" stroke={PH.cream} strokeWidth={1.6} />
        <Pill x={(mx(0) + mx(9)) / 2} y={X8_Y1 + 20} text="9 m" tone="cream" size={8.5} />
        <g transform={`translate(${mx(9).toFixed(1)} ${X8_Y1})`}>
          <Bicycle x={0} y={0} s={0.85} />
        </g>
        <Txt x={8} y={X8_Y2 - 28} size={9} anchor="start" weight={700}>
          12 m/s
        </Txt>
        <path d={`M8 ${X8_Y2}H292`} stroke="#a8a29e" strokeWidth={3.5} strokeLinecap="round" />
        {d !== null && <Flag x={mx(d)} y={X8_Y2} tone={end ? (right ? PH.mint : PH.red) : passed ? PH.red : PH.blue} />}
        <g transform={`translate(${mx(st.s).toFixed(1)} ${X8_Y2})`}>
          <Bicycle x={0} y={0} s={0.85} spin={st.s * 40} />
        </g>
        {right && <Ripple at={[mx(36), X8_Y2 - 16]} r={26} />}
        {end && !right && d !== null && <WrongMark key={miss} x={mx(d) - 9} y={X8_Y2 - 16} />}
        <Txt x={8} y={140} size={9.5} anchor="start" weight={700}>
          {`v = ${st.v.toFixed(1)} m/s`}
        </Txt>
        {end && d !== null && (
          <g className={FADE}>
            {right ? (
              <>
                <path d={`M${mx(0)} ${X8_Y2 + 8}v4H${mx(36)}v-4`} fill="none" stroke={PH.cream} strokeWidth={1.6} />
                <Pill x={200} y={X8_Y2 + 24} text="ঠিক 36 m-এ থামলো" tone="mint" size={8.5} />
              </>
            ) : (
              <Pill x={mx(d) + 22} y={X8_Y2 + 24} text={`এখানে ${fmt(Math.sqrt(144 - 4 * d))} m/s`} tone="red" size={8.5} />
            )}
          </g>
        )}
      </Sheet>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X8_D.map((m, i) => (
          <Choice key={m} n={i} look={pick === i && end ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => choose(i)}>
            <span className="font-mono font-bold">{`${m} m`}</span>
          </Choice>
        ))}
      </div>
      {end && pick !== X8_RIGHT && d !== null && <Nope key={miss}>{X8_NOPE[d]}</Nope>}
      <Task done={right}>একই brake, কিন্তু বেগ 12 m/s। তিথি কোথায় থামবে? দাগ বেছে নিন, তারপর brake কষে দেখুন।</Task>
    </>
  );
}

// 8½ · Figure for screen 8's explanation: the 36 m tape breaks into four 9 m
// pieces; 2× বেগ → 4× পথ; a bus and a speed-limit sign.

const S8_SAY = ["12 m/s-এ থামার পথ: 36 m।", "ভাঙলে ঠিক চারটা 9 m।", "গতি দ্বিগুণ, থামার পথ চারগুণ।", "তাই বাস-ট্রাকের গতিসীমা মানা এত জরুরি।"];
const S8_PX = 7; // units per metre

function Bus({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="pointer-events-none">
      <rect x={-34} y={-26} width={68} height={22} rx={4} fill="#16a34a" />
      {[-28, -14, 0, 14].map((wx) => (
        <rect key={wx} x={wx} y={-22} width={10} height={8} rx={1.5} fill="#dcfce7" />
      ))}
      <rect x={24} y={-22} width={7} height={14} rx={1} fill="#dcfce7" />
      <circle cx={-20} cy={-3} r={4.5} fill={PH.ink} />
      <circle cx={20} cy={-3} r={4.5} fill={PH.ink} />
    </g>
  );
}

export function FourNines({}: Story) {
  const s = useScene(3, [600, 1600, 1600]);
  const k = s.k;
  const x0 = 14;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S8_SAY[k]}</span>}>
      <Sheet w={280} h={124} label="36 m-এর একটা ফিতা, ভেঙে চারটা 9 m। লেখা: 2× বেগ → 4× পথ। নিচে একটা বাস আর গতিসীমার sign।" className="max-w-[18rem]">
        {k === 0 && (
          <g className={FADE}>
            <rect x={x0} y={22} width={36 * S8_PX} height={12} rx={3} fill={PH.creamSoft} stroke={PH.cream} strokeWidth={1.3} />
            <Pill x={x0 + 18 * S8_PX} y={50} text="36 m" tone="cream" size={9} />
          </g>
        )}
        {k >= 1 &&
          [0, 1, 2, 3].map((i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 120}ms` }}>
              <rect x={x0 + i * 9 * S8_PX + i * 1.5} y={22} width={9 * S8_PX - 3} height={12} rx={3} fill={PH.creamSoft} stroke={PH.cream} strokeWidth={1.3} />
              <Txt x={x0 + (i + 0.5) * 9 * S8_PX} y={50} size={9} weight={800} color={PH.cream}>
                9 m
              </Txt>
            </g>
          ))}
        {k >= 2 && <Pill x={140} y={72} text="2× বেগ → 4× পথ" tone="amber" solid size={10} pop />}
        {k >= 3 && (
          <g className={FADE}>
            <path d="M8 118H272" stroke="#a8a29e" strokeWidth={3} strokeLinecap="round" />
            <Bus x={96} y={116} />
            <path d="M200 116V92" stroke={PH.ink} strokeWidth={1.4} />
            <circle cx={200} cy={88} r={11} fill="#fff" stroke={PH.red} strokeWidth={3} />
            <Txt x={200} y={91} size={6.5} weight={800}>
              km/h
            </Txt>
            <Txt x={236} y={100} size={9} weight={700} color={PH.mute}>
              গতিসীমা
            </Txt>
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn: half the speed, 3 m/s, the same brake. The reader drags a
// flag to where তিথি will stop and lets her brake. Short of 2.25 m she runs
// past it; beyond it she stops before it; on 2.25 m she stops on it.

const X9_X0 = 30;
const X9_PX = 50; // units per metre, 0…5 m
const X9_RIGHT = 2.25;
const X9_MS = 1320;
const X9_Y = 74;
const x9At = (m: number) => X9_X0 + m * X9_PX;

export function HalfSpeed() {
  const pass = useGate();
  const [flag, setFlag] = useSeed("flag", 1);
  const [sent, setSent] = useSeed<number | null>("sent", null);
  const [miss, setMiss] = useState(0);
  const [drag, setDrag] = useState(false);
  const walk = useWalk(X9_MS, { steps: false, ease: "linear" });
  const aim = (e: React.PointerEvent<SVGSVGElement>) => {
    if (walk.running) return;
    const [x] = svgPoint(e, 300, 136);
    const m = Math.max(0.25, Math.min(5, Math.round(((x - X9_X0) / X9_PX) * 4) / 4));
    if (m !== flag) {
      setFlag(m);
      sfx.tap();
    }
    if (sent !== null) setSent(null);
  };
  const go = () => {
    if (walk.running) return;
    const f = flag;
    setSent(f);
    sfx.scrape(0.5);
    walk.start(() => {
      if (Math.abs(f - X9_RIGHT) < 1e-6) {
        sfx.chime();
        pass("গতি অর্ধেক, পথ চার ভাগের এক: 2.25 m।");
      } else {
        sfx.slip();
        setMiss((n) => n + 1);
      }
    });
  };
  // 3 → 0 at a = −2 takes 1.5 s; on a straight clock, s = ut + ½at² places her
  const tau = sent === null ? 0 : 1.5 * (walk.running ? walk.t : 1);
  const st = rideAt(3, -2, tau);
  const end = sent !== null && !walk.running;
  const right = end && Math.abs(sent - X9_RIGHT) < 1e-6;
  const under = sent !== null && sent < X9_RIGHT;
  const passed = sent !== null && st.s > sent + 0.02;
  const nope = !end || right ? "" : under ? `তিথি দাগ পেরিয়ে গেলো, তখনও ${fmt(Math.sqrt(9 - 4 * sent))} m/s-এ। থামার পথ আরও লম্বা।` : "তিথি দাগের আগেই থেমে গেলো। থামার পথ এত লম্বা না।";
  return (
    <>
      <Sheet
        w={300}
        h={136}
        label="রাস্তা, 0 থেকে 5 m দাগ কাটা। তিথি 3 m/s-এ। একটা flag টেনে বসানো যায়। brake কষলে তিথি একই brake-এ থামে।"
        className="max-w-[22rem] cursor-ew-resize"
        onPointerDown={(e) => {
          setDrag(true);
          aim(e);
        }}
        onPointerMove={(e) => drag && aim(e)}
        onPointerUp={() => setDrag(false)}
      >
        <Txt x={12} y={22} size={9.5} anchor="start" weight={700} color={PH.cream}>
          আগে: 6 m/s → 9 m
        </Txt>
        <Txt x={292} y={22} size={10} anchor="end" weight={700}>
          {`v = ${st.v.toFixed(1)} m/s`}
        </Txt>
        <path d={`M8 ${X9_Y}H292`} stroke="#a8a29e" strokeWidth={4} strokeLinecap="round" />
        {[0, 1, 2, 3, 4, 5].map((m) => (
          <g key={m}>
            <path d={`M${x9At(m)} ${X9_Y + 4}v6`} stroke={PH.mute} strokeWidth={1} />
            <Txt x={x9At(m)} y={X9_Y + 20} size={8.5} color={PH.mute}>
              {m === 5 ? "5 m" : String(m)}
            </Txt>
          </g>
        ))}
        <Flag x={x9At(flag)} y={X9_Y} tone={end ? (right ? PH.mint : PH.red) : passed ? PH.red : PH.blue} />
        <g transform={`translate(${x9At(st.s).toFixed(1)} ${X9_Y})`}>
          <Bicycle x={0} y={0} s={1} spin={st.s * 90} />
        </g>
        {right && <Ripple at={[x9At(X9_RIGHT), X9_Y - 16]} r={28} />}
        {end && !right && sent !== null && <WrongMark key={miss} x={x9At(sent) - 9} y={X9_Y - 16} />}
        {end && (
          <g className={FADE}>
            <Pill x={Math.max(70, Math.min(230, x9At(sent)))} y={124} text={right ? "ঠিক দাগে থামলো" : under ? "দাগ পেরিয়ে গেলো" : "দাগের আগেই থামলো"} tone={right ? "mint" : "red"} size={8.5} />
          </g>
        )}
      </Sheet>
      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <span>
          দাগ: <span className="font-mono font-bold">{`${flag} m`}</span>
        </span>
        <button type="button" className={`${primaryBtn} h-9! px-4!`} disabled={walk.running || right} onClick={go}>
          brake কষুন
        </button>
      </div>
      {end && !right && <Nope key={miss}>{nope}</Nope>}
      <Task done={right}>তিথি 3 m/s-এ, brake একই। flag টেনে বসান, কোথায় থামবে। তারপর brake কষুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10a · The closing story scene: the wall again. a = ? becomes the মন্দন, the
// stopwatch's ? becomes 1/7500 s, and the boxed v² = u² + 2as comes up.

export function BulletSolved({}: Story) {
  const s = useScene(3, [600, 1400, 1400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="আবার সেই দেয়াল, বুলেট 10 cm ঢুকে থেমে আছে। a = ? এর জায়গায় মন্দন 11,250,000 m/s²। stopwatch-এ 1/7500 s। নিচে v² = u² + 2as।">
        <Wall {...S1_WALL} hole={S1_TIP} />
        <Bullet x={S1_TIP} y={S1_WALL.cy} s={1.3} />
        <path d={`M${S1_WALL.x} 90V84H${S1_TIP}V90`} fill="none" stroke="#fff" strokeWidth={1.3} />
        <Pill x={(S1_WALL.x + S1_TIP) / 2} y={72} text="10 cm" tone="amber" size={9} />
        <Stopwatch x={38} y={40} r={16} q={k < 2} turn={0.25} />
        {k >= 2 && <Pill x={38} y={72} text="1/7500 s" tone="amber" size={9} pop />}
        {k === 0 ? <Pill x={110} y={40} text="a = ?" tone="amber" size={11} pop /> : <Pill x={126} y={40} text="মন্দন 11,250,000 m/s²" tone="mint" size={9} pop />}
        {k >= 3 && (
          <g className={POP}>
            <rect x={22} y={108} width={156} height={32} rx={8} fill="#fff" stroke={PH.mint} strokeWidth={1.8} />
            <Eq x={100} y={130} text="v² = u² + 2as" size={16} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 10b · The next journey's teaser: তিথি on the roof with a water bottle and a
// sheet of paper; a ? at the foot of the drop.

export function RoofTeaser({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="ছাদের কিনারে তিথি। এক হাতে পানির বোতল, আরেক হাতে একটা কাগজ। নিচে একটা প্রশ্ন।">
        <rect x={0} y={84} width={150} height={66} fill="#e7d7c1" stroke="#a8a29e" strokeWidth={1} />
        {[14, 52, 90].map((wx) => (
          <rect key={wx} x={wx} y={100} width={18} height={20} fill="#93c5fd" stroke="#64748b" strokeWidth={0.6} />
        ))}
        <path d="M0 80H150M2 84V80M148 84V80M75 84V80" stroke="#57534e" strokeWidth={1.4} />
        <Person who="tithi" x={118} y={84} facing={1} arm={k >= 1 ? "hold" : "down"} label={false} />
        {k >= 1 && (
          <g className={POP}>
            <rect x={133} y={30} width={8} height={16} rx={2.5} fill="#bfdbfe" stroke="#2563eb" strokeWidth={1} />
            <rect x={135} y={27} width={4} height={4} rx={1} fill="#2563eb" />
            <path d="M92 52l12 -6l4 10l-12 6Z" fill="#fff" stroke="#94a3b8" strokeWidth={1} />
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d="M152 50V146" stroke={PH.amber} strokeWidth={1.2} strokeDasharray="3 4" />
            <Txt x={176} y={120} size={24} weight={800} color={PH.amber}>
              ?
            </Txt>
            <Pill x={232} y={118} text="পড়ন্ত বস্তু" tone="amber" size={10} pop />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  BulletWall: { a: { k: 0 }, b: { k: 1 }, end: {} },
  VsqBet: { start: {}, sealed: { bet: 1 }, all: { bet: 2 } },
  TwoHaveT: { start: {}, one: { tried: [0] }, done: { tried: [0, 1] } },
  SquareArea: { start: {}, corners: { pick: 0 }, three: { pick: 1 }, right: { pick: 2 } },
  CommonOut: { start: {}, twice: { pick: 1 }, still: { pick: 2 }, right: { pick: 0 } },
  TithiBrake: { a: { k: 0 }, b: { k: 1 }, end: {} },
  BrakeSum: { start: {}, plus: { pick: 0 }, hard: { pick: 2 }, right: { pick: 1 } },
  MatchEp09: { a: { k: 0 }, end: {} },
  BulletNumbers: { a: { k: 1 }, end: {} },
  BulletDecel: { start: {}, through: { pick: 0 }, short: { pick: 2 }, right: { pick: 1 } },
  BulletSum: { a: { k: 1 }, end: {} },
  BulletTime: { start: {}, half: { pick: 0 }, hours: { pick: 1 }, right: { pick: 2 } },
  DoubleStop: { start: {}, double: { pick: 0 }, same: { pick: 2 }, right: { pick: 1 } },
  FourNines: { a: { k: 0 }, b: { k: 2 }, end: {} },
  HalfSpeed: { start: {}, under: { flag: 1.5, sent: 1.5 }, over: { flag: 4.5, sent: 4.5 }, right: { flag: 2.25, sent: 2.25 } },
  BulletSolved: { a: { k: 0 }, end: {} },
  RoofTeaser: { a: { k: 0 }, end: {} },
};
