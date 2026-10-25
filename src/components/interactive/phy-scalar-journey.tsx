"use client";

import { useState } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { Compass, GroundShadow, PArrow, PH, Ripple, Sheet, Tag, Txt, WrongMark, fontFor, svgPoint, textW, toneHex, useWalk, type PhTone } from "@/components/interactive/phy-kit";
import { TownMap } from "@/components/interactive/phy-position-journey";

// Screens for "Physics for High School 5 — স্কেলার না ভেক্টর?"
// (src/content/articles/physics_for_high_school/chapter_2/05_scalar_vector.mdx), the
// journey of video EP 05 (physics_9_10/05-scalar-vector/script.md). Book §2.3,
// p. 38.
//
// The spine: two signboards, "2 km হাঁটুন" and "2 km উত্তরে হাঁটুন". The
// reader bets where the difference lies (SignBet); it is settled on the last
// screen. On the way, the video's own beats in order: রাশি = what can be
// measured (MeasureIt), 37 °C needs no direction, a স্কেলার (NoWay37), the
// gate → school arrow needs both মান and দিক, a ভেক্টর (GateMessage), a vector
// is drawn as an arrow (DrawArrow), the book's four arrows A B C D
// (FourArrows), বেগ and বল (SpeedAndPush), how a vector is written
// (WriteA), and the reader sorts six cases (ScalarOrVector).
//
// Colour roles (the video's): amber = মান, blue = দিক, mint = the vector arrow
// and the aha, red = wrong. Map canon from EP 01: gate O, school 1 km east
// (TownMap is EP 01's own map; O and SCHOOL below repeat its numbers).

type Story = { story?: boolean };
type P = [number, number];

const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

type Dir = "N" | "E" | "S" | "W";
const DIR_BN: Record<Dir, string> = { N: "উত্তরে", E: "পূর্বে", S: "দক্ষিণে", W: "পশ্চিমে" };
/** a small hairline button in the page font, like the kit's chip; `done` once its job is done */
const btn = (done = false) =>
  `cursor-pointer rounded-full border bg-surface px-3.5 py-1.5 text-sm font-semibold transition-colors disabled:cursor-default motion-reduce:transition-none ${
    done ? "border-accent/50 text-accent-text" : "border-border hover:border-cat-blue/60 disabled:opacity-40"
  }`;

// ---------------------------------------------------------------------------
// Pieces drawn on paper, shared by several screens (exported for later
// journeys: the signboards, the thermometer, a quantity chip).

export type SignPart = { t: string; tone?: PhTone };

/**
 * A cream signboard centred at (x, y), its words as parts so one can be lit
 * (`lit` maps a part's index to a tone). `post` plants it on a post of that
 * length, with its shadow on the ground. A sticker: one ink line round it.
 */
export function SignBoard({ x, y, parts, w = 124, size = 10, post = 0, lit = {} }: { x: number; y: number; parts: SignPart[]; w?: number; size?: number; post?: number; lit?: Record<number, PhTone> }) {
  return (
    <g className="pointer-events-none">
      {post > 0 && <GroundShadow x={x} y={y + 11 + post} rx={14} />}
      {post > 0 && <rect x={x - 2.5} y={y + 11} width={5} height={post} rx={1.2} fill="#a08a6a" stroke={PH.ink} strokeWidth={0.9} />}
      <rect x={x - w / 2} y={y - 12} width={w} height={24} rx={5} fill={PH.creamSoft} stroke={PH.ink} strokeWidth={1} />
      <text x={x} y={y + size * 0.36} fontSize={size} fontWeight={700} textAnchor="middle" fill={PH.ink}>
        {parts.map((p, i) => {
          const tone = lit[i] ?? p.tone;
          return (
            <tspan key={i} fill={tone ? toneHex(tone) : PH.ink} fontWeight={lit[i] ? 900 : 700} style={{ fontFamily: fontFor(p.t) }}>
              {p.t}
            </tspan>
          );
        })}
      </text>
    </g>
  );
}

/** Where part `i` of a signboard's words sits, roughly (its centre x). */
const partX = (x: number, parts: SignPart[], i: number, size = 10) => {
  const ws = parts.map((p) => textW(p.t, size));
  const start = x - ws.reduce((a, b) => a + b, 0) / 2;
  return start + ws.slice(0, i).reduce((a, b) => a + b, 0) + ws[i] / 2;
};

const BOARD_1: SignPart[] = [{ t: "2 km " }, { t: "হাঁটুন" }];
const BOARD_2: SignPart[] = [{ t: "2 km " }, { t: "উত্তরে", tone: "blue" }, { t: " হাঁটুন" }];

/** A red "?" on paper. */
function Ask({ x, y, size = 13 }: { x: number; y: number; size?: number }) {
  return (
    <g className={POP}>
      <Txt x={x} y={y} size={size} color={PH.red} weight={800}>
        ?
      </Txt>
    </g>
  );
}

/** A drawn tick (✓ renders as emoji on Linux). */
function TickMark({ x, y, s = 1, color = PH.mint }: { x: number; y: number; s?: number; color?: string }) {
  return <path d={`M${x - 5 * s} ${y}l${3.4 * s} ${3.6 * s}l${6.6 * s} ${-7.4 * s}`} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={`pointer-events-none ${POP}`} />;
}

/** A thermometer, bulb centre at (x, y); `v` = the reading in °C (scale 35–41). */
export function Thermometer({ x, y, v, top = 30 }: { x: number; y: number; v: number; top?: number }) {
  const y34 = y - 14;
  const per = (y34 - (top + 12)) / 8;
  const at = (c: number) => y34 - (c - 34) * per;
  return (
    <g className="pointer-events-none">
      <GroundShadow x={x} y={y + 12} rx={14} />
      <rect x={x - 6} y={top} width={12} height={y - top} rx={6} fill="#fff" stroke={PH.ink} strokeWidth={1} />
      <circle cx={x} cy={y} r={11} fill="#fff" stroke={PH.ink} strokeWidth={1} />
      <rect x={x - 5.2} y={y - 12} width={10.4} height={6} fill="#fff" />
      <rect x={x - 3} y={at(v)} width={6} height={y - at(v)} fill="#ef4444" />
      <circle cx={x} cy={y} r={8} fill="#ef4444" />
      {[35, 37, 39, 41].map((c) => (
        <g key={c}>
          <path d={`M${x + 6} ${at(c)}h6`} stroke={c === 37 ? PH.amber : PH.mute} strokeWidth={1.2} />
          <Txt x={x - 10} y={at(c) + 3} size={8} anchor="end" color={c === 37 ? PH.amber : PH.mute} weight={700}>
            {String(c)}
          </Txt>
        </g>
      ))}
      <Txt x={x} y={top - 5} size={8} color={PH.mute} weight={700}>
        °C
      </Txt>
    </g>
  );
}

/** A quantity chip in the video's amber, centred at (x, y): "37 °C", "10 min". */
export function QtyChip({ x, y, text, w = 64, h = 28, size = 13, pop = false }: { x: number; y: number; text: string; w?: number; h?: number; size?: number; pop?: boolean }) {
  return (
    <g className={`pointer-events-none ${pop ? POP : ""}`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={7} fill={PH.amberSoft} stroke={PH.amber} strokeWidth={1.6} />
      <Txt x={x} y={y + size * 0.36} size={size} color={PH.amber} weight={800}>
        {text}
      </Txt>
    </g>
  );
}

/** The sad cloud, মন খারাপ, centred at (x, y): a sticker, its puffs outlined once round the outside. */
function SadCloud({ x, y }: { x: number; y: number }) {
  const puffs: [number, number, number, number][] = [
    [x - 18, y + 4, 16, 13],
    [x + 18, y + 4, 16, 13],
    [x, y - 6, 20, 17],
    [x, y + 8, 26, 10],
  ];
  return (
    <g className="pointer-events-none">
      {/* ink drawn fat behind, fills on top: only the outer edge keeps its line */}
      {puffs.map(([cx, cy, rx, ry], i) => (
        <ellipse key={`o${i}`} cx={cx} cy={cy} rx={rx} ry={ry} fill={PH.ink} stroke={PH.ink} strokeWidth={2} />
      ))}
      {puffs.map(([cx, cy, rx, ry], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill="#b6c2d0" />
      ))}
      <circle cx={x - 6} cy={y - 2} r={1.8} fill={PH.ink} />
      <circle cx={x + 6} cy={y - 2} r={1.8} fill={PH.ink} />
      <path d={`M${x - 7} ${y + 8}q7 -5 14 0`} fill="none" stroke={PH.ink} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: two signboards at the edge of a field; তিথি
// and টুটুল walk up and read them. টুটুল: দুটোই তো 2 km!

export function SignField({}: Story) {
  const s = useScene(3, [600, 1500, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মাঠের ধারে দুইটা সাইনবোর্ড: 2 km হাঁটুন, আর 2 km উত্তরে হাঁটুন। তিথি আর টুটুল এসে পড়ছে।">
        <SignBoard x={86} y={30} parts={BOARD_1} post={109} />
        <SignBoard x={234} y={30} parts={BOARD_2} post={109} />
        <Person who="tithi" x={k >= 1 ? 140 : -30} y={150} walking={k === 1} arm={k >= 3 ? "point" : "down"} mood={k >= 3 ? "puzzled" : "plain"} label />
        <Person who="tutul" x={k >= 1 ? 182 : -60} y={150} scale={0.8} walking={k === 1} facing={k >= 2 ? -1 : 1} arm={k === 2 ? "wave" : "down"} label />
        {k === 2 && <Bubble x={182} y={98} side="right" lines={["দুটোই তো", "2 km!"]} />}
        {k >= 3 && <Bubble x={140} y={84} side="left" tone="think" lines={["পার্থক্যটা", "কোথায়?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: where is the difference? The pick is drawn on the two
// boards with a ?: an = between them, both "2 km" lit, or "উত্তরে" lit.
// Not marked.

const BET = ["কোনো পার্থক্য নেই, দুটোই 2 km", "দূরত্বে: দুটোর পথ আলাদা", "দিকে: একটায় দিক বলা আছে"];

export function SignBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const b1 = 74;
  const b2 = 226;
  // each board planted on its post at the start; the ground at y = 100
  const by = 38;
  const sz = 11;
  return (
    <>
      <Sheet w={300} h={124} label="দুইটা সাইনবোর্ড, প্রতিটার নিচে শুরুর জায়গা। আপনার আন্দাজটা ছবিতে দাগ দেওয়া হবে।" className="max-w-[20rem]">
        <SignBoard x={b1} y={by} parts={BOARD_1} w={124} size={sz} post={51} lit={bet === 1 ? { 0: "amber" } : {}} />
        <SignBoard x={b2} y={by} parts={BOARD_2} w={124} size={sz} post={51} lit={bet === 1 ? { 0: "amber" } : bet === 2 ? { 1: "blue" } : {}} />
        {[b1, b2].map((x) => (
          <g key={x} className="pointer-events-none">
            <circle cx={x} cy={100} r={3.6} fill={PH.ink} />
            <Txt x={x} y={115} size={8.5} color={PH.mute}>
              শুরু
            </Txt>
          </g>
        ))}
        {bet === 0 && (
          <g key="b0">
            <Txt x={150} y={by + 8} size={24} weight={800} className={POP}>
              =
            </Txt>
            <Ask x={150} y={by + 36} />
          </g>
        )}
        {bet === 1 && (
          <g key="b1">
            <Ask x={partX(b1, BOARD_1, 0, sz)} y={by - 17} size={11} />
            <Ask x={partX(b2, BOARD_2, 0, sz)} y={by - 17} size={11} />
          </g>
        )}
        {bet === 2 && <Ask key="b2" x={partX(b2, BOARD_2, 1, sz)} y={by - 17} size={11} />}
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
      <Task done={bet !== null}>দুইটা command-এর পার্থক্যটা কোথায়? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2a · Story scene for screen 2: তিথির জ্বর. The thermometer reads 37 °C; a
// grey cloud gathers over her head.

export function TithiFever({}: Story) {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ঘরে তিথি, হাতে thermometer। thermometer বলছে 37 °C। তারপর মাথার উপর একটা ছোট মেঘ।">
        <rect x={210} y={40} width={64} height={48} rx={3} fill="#dbeafe" stroke="#a8a29e" strokeWidth={2} />
        <path d="M242 40V88M210 64H274" stroke="#a8a29e" strokeWidth={1.5} />
        <Person who="tithi" x={140} y={150} arm="hold" mood={k >= 2 ? "sad" : "plain"} label />
        <g transform="translate(150 104) rotate(-20)">
          <rect x={-2} y={-14} width={4} height={18} rx={2} fill="#fff" stroke={PH.mute} strokeWidth={0.8} />
          <circle cy={5} r={2.6} fill="#ef4444" />
        </g>
        {k >= 1 && (
          <g>
            <path d="M156 96L176 80" stroke={PH.amber} strokeWidth={1} strokeDasharray="2 2" className={FADE} />
            <Tag x={196} y={74} text="37 °C" tone="amber" solid size={11} pop />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <ellipse cx={128} cy={60} rx={12} ry={8} fill="#94a3b8" />
            <ellipse cx={142} cy={56} rx={13} ry={10} fill="#94a3b8" />
            <ellipse cx={154} cy={61} rx={10} ry={7} fill="#94a3b8" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · রাশি = what can be measured. The reader measures both: the thermometer
// climbs to 37 °C (রাশি), the dial on মন খারাপ swings and lands on ? (রাশি নয়).

const X2_MS = 1300;

export function MeasureIt() {
  const pass = useGate();
  const [temp, setTemp] = useSeed("temp", false);
  const [sad, setSad] = useSeed("sad", false);
  const [which, setWhich] = useState<"temp" | "sad" | null>(null);
  const play = useWalk(X2_MS, { steps: false, ease: "linear" });
  const measure = (w: "temp" | "sad") => {
    if (play.running || (w === "temp" ? temp : sad)) return;
    setWhich(w);
    sfx.tap();
    play.start(() => {
      if (w === "temp") {
        setTemp(true);
        sfx.pop();
      } else {
        setSad(true);
        sfx.slip();
      }
      if (w === "temp" ? sad : temp) pass("রাশি মানে যা মাপা যায়।");
    });
  };
  const going = play.running ? which : null;
  const t = play.t;
  // the mercury climbs and eases onto 37; the dial on মন খারাপ wanders and never reads anything
  const v = temp ? 37 : going === "temp" ? 34.6 + 2.4 * (1 - (1 - t) ** 2) : 34.6;
  const needle = going === "sad" ? 90 + 70 * Math.sin(t * Math.PI * 5) : sad ? 90 : 160;
  const nr = (needle * Math.PI) / 180;
  const dial: P = [228, 150];
  return (
    <>
      <Sheet w={300} h={190} label="বামে thermometer, ডানে মন খারাপের মেঘ। দুটোকেই মাপার চেষ্টা করা যায়।" className="max-w-[21rem]">
        <g onClick={() => measure("temp")} className={temp ? "" : "cursor-pointer"} role="button" aria-label="তাপমাত্রা মাপুন">
          <rect x={16} y={18} width={64} height={166} fill="transparent" />
          {!temp && !going && <rect x={30} y={24} width={44} height={152} rx={20} fill="none" stroke={PH.blue} strokeWidth={1.2} strokeDasharray="3 3" className="pointer-events-none" />}
          <Thermometer x={56} y={160} v={v} top={38} />
        </g>
        {temp && (
          <g>
            <path d="M70 107H92" stroke={PH.amber} strokeWidth={1.2} strokeDasharray="2.5 2.5" className={FADE} />
            <QtyChip x={124} y={107} text="37 °C" pop />
            <Ripple at={[124, 107]} r={34} />
            <Txt x={124} y={136} size={9.5}>
              তাপমাত্রা
            </Txt>
            <Tag x={118} y={170} text="রাশি" tone="mint" solid pop />
            <TickMark x={146} y={169} s={0.9} />
          </g>
        )}
        <g onClick={() => measure("sad")} className={sad ? "" : "cursor-pointer"} role="button" aria-label="মন খারাপ মাপুন">
          <rect x={180} y={24} width={100} height={150} fill="transparent" />
          {!sad && !going && <ellipse cx={228} cy={62} rx={46} ry={30} fill="none" stroke={PH.blue} strokeWidth={1.2} strokeDasharray="3 3" className="pointer-events-none" />}
          <SadCloud x={228} y={62} />
          <Txt x={228} y={100} size={9.5}>
            মন খারাপ
          </Txt>
        </g>
        {(sad || going === "sad") && (
          <g className="pointer-events-none">
            <path d={`M${dial[0] - 26} ${dial[1] + 2}A26 26 0 0 1 ${dial[0] + 26} ${dial[1] + 2}Z`} fill="#fff" stroke={PH.ink} strokeWidth={1} />
            <path d={`M${dial[0] - 20} ${dial[1]}A20 20 0 0 1 ${dial[0] + 20} ${dial[1]}`} fill="none" stroke="#e8edf3" strokeWidth={4} strokeLinecap="round" />
            <path d={`M${dial[0]} ${dial[1]}L${dial[0] + Math.cos(nr) * 18} ${dial[1] - Math.sin(nr) * 18}`} stroke={PH.ink} strokeWidth={1.8} strokeLinecap="round" />
            <circle cx={dial[0]} cy={dial[1]} r={2.2} fill={PH.ink} />
            {sad && <Ask x={dial[0] + 34} y={dial[1] - 4} size={16} />}
            {sad && <Tag x={dial[0]} y={170} text="রাশি নয়" tone="red" solid pop />}
          </g>
        )}
      </Sheet>
      <div className="mx-auto mt-2 flex w-full max-w-[21rem] flex-wrap justify-center gap-1.5 text-sm">
        <button type="button" className={btn(temp)} disabled={play.running || temp} onClick={() => measure("temp")}>
          thermometer দিয়ে মাপুন
        </button>
        <button type="button" className={btn(sad)} disabled={play.running || sad} onClick={() => measure("sad")}>
          মন খারাপ মাপুন
        </button>
      </div>
      <Ticks
        items={[
          ["তাপমাত্রা", temp],
          ["মন খারাপ", sad],
        ]}
      />
      <Task done={temp && sad}>দুটোকেই মেপে দেখুন: তিথির জ্বর, আর মন খারাপ। কোনটায় সংখ্যা বসে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Only a value: what must you say about তিথির জ্বর? A wrong pick fixes an
// arrow to 37 °C, then the arrow swings all the way round while the chip
// stays 37 °C: the direction said nothing. The right pick: an arrow tries to
// attach ("কোন দিকে?"), fades, and the chip is named স্কেলার.

const X3_OPTS: { label: string; dir: Dir | null }[] = [
  { label: "37 °C উত্তরে", dir: "N" },
  { label: "শুধু 37 °C", dir: null },
  { label: "37 °C পূর্বে", dir: "E" },
];
const X3_RIGHT = 1;
const X3_N = 16;
const X3_MS = 1400;
const X3_C: P = [150, 72];
const DIR_DEG: Record<Dir, number> = { N: -90, E: 0, S: 90, W: 180 };
/** an arrow leaving the 37 °C chip at angle `deg` (screen degrees, 0 = east) */
const chipRay = (deg: number, len: number): [P, P] => {
  const r = (deg * Math.PI) / 180;
  const a: P = [X3_C[0] + Math.cos(r) * 54, X3_C[1] + Math.sin(r) * 28];
  return [a, [a[0] + Math.cos(r) * len, a[1] + Math.sin(r) * len]];
};
const nearDir = (deg: number): Dir => (["E", "S", "W", "N"] as Dir[])[((Math.round(deg / 90) % 4) + 4) % 4];

export function NoWay37() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // one even clock, read in the old steps of 16: grow, sweep a full turn, settle
  const play = useWalk(X3_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    sfx.tap();
    play.start(() => {
      if (i === X3_RIGHT) {
        sfx.chime();
        pass("শুধু মান দিলেই চলে: স্কেলার।");
      } else setMiss((m) => m + 1);
    });
  };
  const opt = pick === null ? null : X3_OPTS[pick];
  const k = pick === null ? 0 : play.running ? play.t * X3_N : X3_N;
  const right = pick === X3_RIGHT && !play.running;
  const wrongDone = pick !== null && pick !== X3_RIGHT && !play.running;
  // wrong: grow (0-4), sweep a full turn (4-14), settle back (14-16)
  let deg = 0;
  let len = 0;
  if (opt?.dir) {
    const base = DIR_DEG[opt.dir];
    len = Math.min(1, k / 4) * 34;
    // the turn eases in and out, so the arrow visibly sweeps and comes to rest
    const turn = Math.max(0, Math.min(1, (k - 4) / 10));
    deg = base + 360 * (turn < 0.5 ? 2 * turn * turn : 1 - (-2 * turn + 2) ** 2 / 2);
  }
  // right: a short try (0-6), then fade out (6-12)
  const tryOp = opt && !opt.dir ? (k <= 6 ? 1 : Math.max(0, 1 - (k - 6) / 6)) : 0;
  const [ra, rb] = chipRay(-35, Math.min(1, k / 5) * 26);
  const [wa, wb] = chipRay(deg, len);
  return (
    <>
      <Sheet w={300} h={160} label="তিথির জ্বর, 37 °C, একটা chip-এ। পাশে compass। যেটা বেছে নেবেন, chip-এ সেটা বসানো হবে।" className="max-w-[20rem]">
        <rect x={X3_C[0] - 52} y={X3_C[1] - 24} width={104} height={48} rx={10} fill={right ? PH.mintSoft : PH.amberSoft} stroke={right ? PH.mint : PH.amber} strokeWidth={1.8} className="pointer-events-none transition-[fill,stroke] duration-500 motion-reduce:transition-none" />
        <Txt x={X3_C[0]} y={X3_C[1] + 8} size={22} color={PH.amber} weight={800}>
          37 °C
        </Txt>
        <Txt x={X3_C[0]} y={150} size={9.5} color={PH.mute}>
          তিথির জ্বর
        </Txt>
        <Compass x={264} y={128} r={12} lit={opt?.dir && len > 0 ? nearDir(deg) : null} />
        {opt?.dir && len > 1 && <PArrow a={wa} b={wb} tone={wrongDone ? "red" : "amber"} tell={wrongDone ? `37 °C ${DIR_BN[opt.dir]}` : false} />}
        {wrongDone && opt?.dir && <Tag x={wb[0] + (opt.dir === "E" ? 0 : 46)} y={wb[1] + (opt.dir === "E" ? 20 : 8)} text="তবুও 37 °C" tone="red" pop />}
        {wrongDone && opt?.dir && <WrongMark key={`w${miss}`} x={wb[0] + (opt.dir === "E" ? 14 : -14)} y={wb[1] + (opt.dir === "E" ? -6 : 10)} />}
        {right && <Ripple at={X3_C} r={56} />}
        {opt && !opt.dir && tryOp > 0 && (
          <g style={{ opacity: tryOp }}>
            <PArrow a={ra} b={rb} tone="amber" tell={false} />
            <Tag x={rb[0] + 30} y={rb[1] - 8} text="কোন দিকে?" tone="amber" />
          </g>
        )}
        {right && <Tag x={X3_C[0]} y={124} text="স্কেলার · Scalar" tone="mint" solid pop />}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X3_OPTS.map((o, i) => (
          <Choice key={o.label} n={i} look={pick === i && !play.running ? (i === X3_RIGHT ? "right" : "wrong") : "idle"} disabled={play.running || right} onClick={() => choose(i)}>
            <span className="font-sans">{o.label}</span>
          </Choice>
        ))}
      </div>
      {wrongDone && <Nope key={miss}>তীর পুরো একপাক ঘুরলো, কিন্তু জ্বর 37 °C-ই থাকলো। দিক বসিয়ে কিছুই বদলায় না।</Nope>}
      <Task done={right}>তিথির জ্বর বোঝাতে কী বলতে হয়? বেছে নিন, chip-এ বসিয়ে দেখুন।</Task>
    </>
  );
}

// 3½ · Figure for screen 3's explanation: more scalars drop beside 37 °C:
// 10 min, 50 kg, 3 m, each with its name and a tick.

const S3_CHIPS = [
  { v: "37 °C", name: "তাপমাত্রা" },
  { v: "10 min", name: "সময়" },
  { v: "50 kg", name: "ভর" },
  { v: "3 m", name: "দৈর্ঘ্য" },
];
const S3_SAY = ["তাপমাত্রা: 37 °C।", "সময়: 10 min।", "ভর: 50 kg।", "দৈর্ঘ্য: 3 m। একটা মানই পুরো কথা।"];

export function MoreScalars({}: Story) {
  const s = useScene(3, [600, 1100, 1100]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S3_SAY[k]}</span>}>
      <Sheet w={300} h={100} label="চারটা chip: 37 °C তাপমাত্রা, 10 min সময়, 50 kg ভর, 3 m দৈর্ঘ্য।" className="max-w-[20rem]">
        {S3_CHIPS.slice(0, k + 1).map((c, i) => {
          const x = 40 + i * 73.3;
          return (
            <g key={c.v}>
              <QtyChip x={x} y={36} text={c.v} w={62} size={12} pop />
              <g className={FADE}>
                <Txt x={x} y={66} size={9.5}>
                  {c.name}
                </Txt>
              </g>
              <TickMark x={x} y={82} />
            </g>
          );
        })}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · মান আর দিক: back to EP 01's map. Which message sends নানু to the school?
// "1 km" alone draws the whole circle of maybes; "পূর্বে" alone opens the whole
// road east; "1 km পূর্বে" draws one arrow, gate → school.

// must match TownMap's own gate (phy-position-journey's O), or the arrows miss the gate
const O: P = [110, 108];
const KM = 80;
const SCHOOL: P = [O[0] + KM, O[1]];
const X4_OPTS = ["গেট থেকে 1 km", "গেট থেকে পূর্বে", "গেট থেকে 1 km পূর্বে"];
const X4_RIGHT = 2;
const X4_MS = 1200;
const X4_NOPE = [
  "শুধু 1 km: গেটকে ঘিরে পুরো একটা বৃত্ত, স্কুল তার যেকোনো জায়গায়। দিক কই?",
  "শুধু পূর্বে: পূর্বের পুরো রাস্তাটাই খোলা, নানু কোথায় থামবেন? মান কই?",
  "",
];

export function GateMessage() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = useWalk(X4_MS, { steps: false });
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    sfx.footstep();
    play.start(() => {
      if (i === X4_RIGHT) {
        sfx.chime();
        pass("মান আর দিক, দুটো মিলে ভেক্টর।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : play.running ? play.t : 1;
  const right = pick === X4_RIGHT && !play.running;
  const hasMan = pick === 0 || pick === 2;
  const hasDik = pick === 1 || pick === 2;
  const ring = Array.from({ length: 8 }, (_, i) => {
    const a = (i * 45 * Math.PI) / 180;
    return [O[0] + Math.cos(a) * KM, O[1] + Math.sin(a) * KM, i / 8] as [number, number, number];
  }).filter(([, y]) => y < 190);
  // the circle of maybes is laid by a 1 km tape swept round the gate
  const nSwept = Math.max(1, Math.round(t * 64));
  const swept = Array.from({ length: nSwept + 1 }, (_, i) => {
    const a = (2 * Math.PI * t * i) / nSwept;
    return [O[0] + Math.cos(a) * KM, O[1] + Math.sin(a) * KM] as P;
  });
  const tapeA = 2 * Math.PI * t;
  return (
    <>
      <TownMap label="EP 01-এর map: বাসার গেট আর স্কুল। যে কথাটা বেছে নেবেন, map সেটা এঁকে দেখাবে।" gate="origin" school={right ? "mint" : "plain"} sheet={{ className: "max-w-[19rem]" }}>
        {pick === 0 && (
          <g key="ring" className="pointer-events-none">
            {t > 0.01 && <path d={"M" + swept.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")} fill="none" stroke={PH.amber} strokeWidth={1.6} strokeDasharray="4 4" />}
            {play.running && <path d={`M${O[0]} ${O[1]}L${O[0] + Math.cos(tapeA) * KM} ${O[1] + Math.sin(tapeA) * KM}`} stroke={PH.amber} strokeWidth={2} strokeLinecap="round" />}
            {ring.map(([x, y, at], i) => (at <= t + 1e-6 ? <Ask key={i} x={x} y={y + 4} size={12} /> : null))}
          </g>
        )}
        {pick === 1 && (
          <g key="ray" className="pointer-events-none">
            <path d={`M${O[0]} ${O[1]}H${O[0] + (288 - O[0]) * t}`} stroke={PH.blue} strokeWidth={2} strokeDasharray="5 4" />
            {[40, 80, 120, 160].map((d) => (O[0] + d <= O[0] + (288 - O[0]) * t ? <Ask key={d} x={O[0] + d} y={O[1] - 10} size={12} /> : null))}
          </g>
        )}
        {pick === 2 && t > 0.05 && <PArrow a={O} b={lerp(O, SCHOOL, t)} tone="mint" tell={t >= 1 ? "1 km পূর্বে" : false} />}
        {right && <Tag x={(O[0] + SCHOOL[0]) / 2} y={O[1] + 32} text="ভেক্টর · Vector" tone="mint" solid pop />}
      </TownMap>
      <div className="mx-auto mt-2 flex w-full max-w-[19rem] justify-center gap-2 text-sm">
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${pick === null ? "bg-foreground/[0.06] text-muted" : hasMan ? "bg-cat-amber/15 text-cat-amber" : "bg-danger/10 text-danger"}`}>
          মান: <span className="font-mono">{pick === null ? "…" : hasMan ? "1 km" : "?"}</span>
        </span>
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${pick === null ? "bg-foreground/[0.06] text-muted" : hasDik ? "bg-cat-blue/15 text-cat-blue" : "bg-danger/10 text-danger"}`}>
          দিক: {pick === null ? "…" : hasDik ? "পূর্বে" : "?"}
        </span>
      </div>
      <div className="mt-2 grid gap-2">
        {X4_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={pick === i && !play.running ? (i === X4_RIGHT ? "right" : "wrong") : "idle"} disabled={play.running || right} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== X4_RIGHT && !play.running && <Nope key={miss}>{X4_NOPE[pick]}</Nope>}
      <Task done={right}>নানুকে স্কুলে পাঠাতে তিথির কোন কথাটা লেগেছিল? বেছে নিন, map-এ দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · A vector is drawn as an arrow. The reader drags the arrow's head on a
// km grid: its length is the মান (amber bracket), its head the দিক (blue
// ring). Two arrows to make: the gate → school one (1 km পূর্বে), then the
// hook's own (2 km উত্তরে). The head snaps to the nearest half km on one of
// the four directions.

const X5_U = 40; // units per km
const X5_T: P = [130, 130];
const X5_GOALS: { km: number; dir: Dir; say: string }[] = [
  { km: 1, dir: "E", say: "1 km পূর্বে" },
  { km: 2, dir: "N", say: "2 km উত্তরে" },
];
const kmText = (km: number) => `${Number.isInteger(km) ? km : km.toFixed(1)} km`;

function snapHead([x, y]: P): P {
  const dx = x - X5_T[0];
  const dy = y - X5_T[1];
  const half = X5_U / 2;
  const q = (d: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(d / half) * half));
  if (Math.abs(dx) >= Math.abs(dy)) {
    const sx = q(dx, -100, 140);
    return [X5_T[0] + (Math.abs(sx) < half ? (dx < 0 ? -half : half) : sx), X5_T[1]];
  }
  const sy = q(dy, -100, 40);
  return [X5_T[0], X5_T[1] + (Math.abs(sy) < half ? (dy < 0 ? -half : half) : sy)];
}
const headInfo = ([x, y]: P): { km: number; dir: Dir } => {
  const dx = x - X5_T[0];
  const dy = y - X5_T[1];
  const dir: Dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "E" : "W") : dy < 0 ? "N" : "S";
  return { km: Math.round((Math.hypot(dx, dy) / X5_U) * 2) / 2, dir };
};

export function DrawArrow() {
  const pass = useGate();
  const [head, setHead] = useSeed<P>("head", [X5_T[0], X5_T[1] + X5_U]);
  const [got, setGot] = useSeed<number[]>("got", []);
  const [drag, setDrag] = useState(false);
  const [hx, hy] = useTween(head, 140);
  const info = headInfo(head);
  const done = got.length >= X5_GOALS.length;
  const aim = (e: React.PointerEvent<SVGSVGElement>) => {
    if (done) return;
    const p = snapHead(svgPoint(e, 300, 200));
    if (p[0] === head[0] && p[1] === head[1]) return;
    setHead(p);
    sfx.tap();
    const hi = headInfo(p);
    const g = X5_GOALS.findIndex((goal, i) => !got.includes(i) && goal.km === hi.km && goal.dir === hi.dir);
    if (g >= 0) {
      const next = [...got, g];
      setGot(next);
      sfx.chime();
      if (next.length === X5_GOALS.length) pass("তীরের দৈর্ঘ্য মান, মাথা দিক।");
    }
  };
  const tw: P = [hx, hy];
  const horiz = Math.abs(hx - X5_T[0]) >= Math.abs(hy - X5_T[1]);
  // the মান bracket, beside the shaft
  const off = 12;
  const b0: P = horiz ? [X5_T[0], X5_T[1] + off] : [X5_T[0] + off, X5_T[1]];
  const b1: P = horiz ? [hx, hy + off] : [hx + off, hy];
  const cap = (p: P) => (horiz ? `M${p[0]} ${p[1] - 4}v8` : `M${p[0] - 4} ${p[1]}h8`);
  const mid = lerp(b0, b1, 0.5);
  const lastHit = got.length ? X5_GOALS[got[got.length - 1]] : null;
  const onGoal = lastHit && lastHit.km === info.km && lastHit.dir === info.dir;
  // a made vector's name sits just past its head, along the arrow
  const goalAt = (say: string): P => {
    const gw = textW(say, 9) + 12;
    const sx = Math.sign(head[0] - X5_T[0]);
    const sy = Math.sign(head[1] - X5_T[1]);
    const flat = info.dir === "E" || info.dir === "W";
    const x = flat ? head[0] + sx * (gw / 2 + 16) : head[0];
    const y = flat ? head[1] : head[1] + sy * 30;
    return [Math.max(gw / 2 + 6, Math.min(294 - gw / 2, x)), Math.max(14, Math.min(186, y))];
  };
  return (
    <>
      <Sheet
        w={300}
        h={200}
        label="km-এর grid-এ একটা তীর। মাথা টেনে লম্বা বা ঘোরানো যায়। পাশে দৈর্ঘ্যের দাগ আর মাথার চারদিকে বৃত্ত।"
        className="max-w-[21rem] cursor-grab"
        onPointerDown={(e) => {
          setDrag(true);
          aim(e);
        }}
        onPointerMove={(e) => drag && aim(e)}
        onPointerUp={() => setDrag(false)}
      >
        <g className="pointer-events-none">
          {Array.from({ length: 15 }, (_, i) => 10 + i * 20).map((x) => (
            <path key={`v${x}`} d={`M${x} 6V194`} stroke="#eef2f7" strokeWidth={1} />
          ))}
          {Array.from({ length: 10 }, (_, i) => 10 + i * 20).map((y) => (
            <path key={`h${y}`} d={`M6 ${y}H294`} stroke="#eef2f7" strokeWidth={1} />
          ))}
          <path d={`M14 188h${X5_U}`} stroke={PH.ink} strokeWidth={1.4} />
          <path d="M14 185v6M54 185v6" stroke={PH.ink} strokeWidth={1.2} />
          <Txt x={34} y={182} size={8} color={PH.mute}>
            1 km
          </Txt>
          <Compass x={270} y={32} r={12} lit={info.dir} />
          <circle cx={X5_T[0]} cy={X5_T[1]} r={3.6} fill={PH.ink} />
          <path d={`M${b0[0]} ${b0[1]}L${b1[0]} ${b1[1]}${cap(b0)}${cap(b1)}`} stroke={PH.amber} strokeWidth={1.6} fill="none" />
          <Tag x={mid[0] + (horiz ? 0 : 48)} y={mid[1] + (horiz ? 12 : 0)} text="দৈর্ঘ্য = মান" tone="amber" size={8.5} />
          <circle cx={hx} cy={hy} r={11} fill="none" stroke={PH.blue} strokeWidth={1.6} />
          <Tag x={hx + (horiz ? 0 : -42)} y={hy + (horiz ? -20 : -2)} text="মাথা = দিক" tone="blue" size={8.5} />
        </g>
        <PArrow a={X5_T} b={tw} tone="mint" w={3} tell={`${kmText(info.km)} ${DIR_BN[info.dir]}`} />
        {onGoal && lastHit && <Ripple key={`r${lastHit.say}`} at={head} r={22} />}
        {onGoal && lastHit && <Tag key={lastHit.say} x={goalAt(lastHit.say)[0]} y={goalAt(lastHit.say)[1]} text={lastHit.say} tone="mint" solid size={9} pop />}
      </Sheet>
      <div className="mt-2 text-center text-sm">
        <span className="font-semibold text-cat-amber">মান: {kmText(info.km)}</span>
        <span className="mx-2 text-muted">·</span>
        <span className="font-semibold text-cat-blue">দিক: {DIR_BN[info.dir]}</span>
      </div>
      <Ticks items={X5_GOALS.map((g, i) => [g.say, got.includes(i)] as [string, boolean])} />
      <Task done={done}>তীরের মাথা টেনে দুইটা ভেক্টর আঁকুন: 1 km পূর্বে, আর 2 km উত্তরে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The book's four arrows (fig 2.03): A and B, 30°, same length, different
// places; C, same length, −35°; D, −35° and shorter. Three rounds: B is
// slid onto A, C onto A, D onto C; the reader judges each pair, and the slide
// shows the truth (they coincide / the heads part / D stops short).

const X6_G = 14; // grid square
type ArrowKey = "A" | "B" | "C" | "D";
const X6_ARROWS: Record<ArrowKey, { tail: P; deg: number; len: number }> = {
  A: { tail: [28, 84], deg: 30, len: 5 * X6_G },
  B: { tail: [96, 154], deg: 30, len: 5 * X6_G },
  C: { tail: [174, 42], deg: -35, len: 5 * X6_G },
  D: { tail: [222, 120], deg: -35, len: 3 * X6_G },
};
const headAt = (tail: P, deg: number, len: number): P => [tail[0] + Math.cos((deg * Math.PI) / 180) * len, tail[1] - Math.sin((deg * Math.PI) / 180) * len];
const degText = (d: number) => (d < 0 ? `−${-d}°` : `${d}°`);
const arrowTell = (k: ArrowKey) => `${X6_ARROWS[k].len / X6_G} ঘর, ${degText(X6_ARROWS[k].deg)}`;

export const FOUR_ARROWS = X6_ARROWS;

const X6_ROUNDS: { mover: ArrowKey; ref: ArrowKey; ask: string; opts: string[]; right: number; nope: string[]; verdict: string }[] = [
  {
    mover: "B",
    ref: "A",
    ask: "B আর A",
    opts: ["একই ভেক্টর", "আলাদা: দুইটা আলাদা জায়গায়", "আলাদা: দিক আলাদা"],
    right: 0,
    nope: ["", "B-কে A-এর জায়গায় আনতেই হুবহু মিলে গেলো। শুধু জায়গাটাই আলাদা ছিল।", "দেখুন, B A-এর উপর বসে একই দিকে মুখ করে আছে। দিক মিলেছে।"],
    verdict: "A = B",
  },
  {
    mover: "C",
    ref: "A",
    ask: "C আর A",
    opts: ["একই ভেক্টর: সমান লম্বা", "আলাদা: দিক আলাদা", "আলাদা: মান আলাদা"],
    right: 1,
    nope: ["লম্বায় মিললো, কিন্তু মাথা দুইটা দুই দিকে গেলো। শুধু সমান লম্বা হলে চলে না।", "", "দুইটা সমান লম্বা, 5 ঘর করে। মান মিলেছে, মেলেনি অন্য কিছু।"],
    verdict: "C ≠ A",
  },
  {
    mover: "D",
    ref: "C",
    ask: "D আর C",
    opts: ["একই ভেক্টর: একই দিক", "আলাদা: দিক আলাদা", "আলাদা: D-এর মান কম"],
    right: 2,
    nope: ["দিক মিললো, কিন্তু D মাঝপথেই থেমে গেলো। শুধু একই দিক হলে চলে না।", "D C-এর উপর একই দিকে শুয়ে আছে। দিক মিলেছে, মেলেনি অন্য কিছু।", ""],
    verdict: "D ≠ C",
  },
];
const X6_MS = 1000;

export function FourArrows() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // the slide glides in and settles (eases out) onto the other arrow's tail
  const play = useWalk(X6_MS, { steps: false, ease: "out" });
  const R = X6_ROUNDS[round];
  const solved = pick === R.right && !play.running;
  const done = round === X6_ROUNDS.length - 1 && solved;
  const choose = (i: number) => {
    if (play.running || solved) return;
    setPick(i);
    sfx.whoosh();
    play.start(() => {
      if (i === R.right) {
        sfx.chime();
        if (round === X6_ROUNDS.length - 1) pass("সমান লম্বা আর একই দিক হলেই একই ভেক্টর।");
      } else setMiss((m) => m + 1);
    });
  };
  const next = () => {
    setRound(round + 1);
    setPick(null);
  };
  const t = pick === null ? 0 : play.running ? play.t : 1;
  const mv = X6_ARROWS[R.mover];
  const rf = X6_ARROWS[R.ref];
  const mTail = lerp(mv.tail, rf.tail, t);
  const mHead = headAt(mTail, mv.deg, mv.len);
  const landed = t >= 1;
  const judged = pick !== null && landed && !play.running;
  // the verdict sits just past the reference arrow's head
  const rHead = headAt(rf.tail, rf.deg, rf.len);
  const rU: P = [Math.cos((rf.deg * Math.PI) / 180), -Math.sin((rf.deg * Math.PI) / 180)];
  const verdictAt: P = [rHead[0] + rU[0] * 26, rHead[1] + rU[1] * 26];
  const label = (k: ArrowKey, tail: P, head: P, side = 1) => {
    const a = X6_ARROWS[k];
    const r = (a.deg * Math.PI) / 180;
    const m = lerp(tail, head, 0.5);
    return [m[0] - Math.sin(r) * 11 * side, m[1] - Math.cos(r) * 11 * side] as P;
  };
  return (
    <>
      <Sheet w={300} h={175} label="grid-এর উপর চারটা তীর A, B, C, D। একটা তীর আরেকটার উপর সরিয়ে এনে মেলানো হবে।" className="max-w-[21rem]">
        <g className="pointer-events-none">
          {Array.from({ length: 21 }, (_, i) => 10 + i * X6_G).map((x) => (
            <path key={`v${x}`} d={`M${x} 6V169`} stroke="#eef2f7" strokeWidth={1} />
          ))}
          {Array.from({ length: 12 }, (_, i) => 10 + i * X6_G).map((y) => (
            <path key={`h${y}`} d={`M6 ${y}H294`} stroke="#eef2f7" strokeWidth={1} />
          ))}
        </g>
        {(Object.keys(X6_ARROWS) as ArrowKey[]).map((k) => {
          const a = X6_ARROWS[k];
          const head = headAt(a.tail, a.deg, a.len);
          const lit = k === R.ref || k === R.mover;
          const away = k === R.mover && pick !== null;
          const lp = label(k, a.tail, head);
          return (
            <g key={k}>
              <PArrow a={a.tail} b={head} tone={lit ? "mint" : "ink"} opacity={away ? 0.25 : lit ? 1 : 0.3} dashed={away} tell={arrowTell(k)} />
              <Txt x={lp[0]} y={lp[1] + 4} size={11} weight={800} color={lit && !away ? PH.mint : PH.mute}>
                {k}
              </Txt>
            </g>
          );
        })}
        {pick !== null && (
          <g>
            <PArrow a={mTail} b={mHead} tone={landed && R.mover !== "B" ? "red" : "mint"} w={2.4} tell={arrowTell(R.mover)} />
            {(() => {
              const lp = label(R.mover, mTail, mHead, -1);
              return (
                <Txt x={lp[0]} y={lp[1] + 4} size={11} weight={800} color={landed && R.mover !== "B" ? PH.red : PH.mint}>
                  {R.mover}
                </Txt>
              );
            })()}
          </g>
        )}
        {landed && R.mover === "C" && (
          <g key="arc" className="pointer-events-none">
            <path d={`M${rf.tail[0] + Math.cos(Math.PI / 6) * 32} ${rf.tail[1] - Math.sin(Math.PI / 6) * 32}A32 32 0 0 1 ${rf.tail[0] + Math.cos((35 * Math.PI) / 180) * 32} ${rf.tail[1] + Math.sin((35 * Math.PI) / 180) * 32}`} fill="none" stroke={PH.blue} strokeWidth={1.8} className={FADE} />
            <Tag x={rf.tail[0] + 66} y={rf.tail[1] + 2} text="দিক আলাদা" tone="blue" size={8.5} pop />
          </g>
        )}
        {landed &&
          R.mover === "D" &&
          (() => {
            // an amber bracket over the bit of C that D falls short of
            const n: P = [-rU[1], rU[0]];
            const off = 9;
            const p0: P = [mHead[0] + n[0] * off, mHead[1] + n[1] * off];
            const p1: P = [rHead[0] + n[0] * off, rHead[1] + n[1] * off];
            const cap = (p: P) => `M${p[0] - n[0] * 3} ${p[1] - n[1] * 3}L${p[0] + n[0] * 3} ${p[1] + n[1] * 3}`;
            const mid = lerp(p0, p1, 0.5);
            return (
              <g key="short" className={`pointer-events-none ${FADE}`}>
                <path d={`M${p0[0]} ${p0[1]}L${p1[0]} ${p1[1]}${cap(p0)}${cap(p1)}`} stroke={PH.amber} strokeWidth={1.6} fill="none" />
                <Tag x={mid[0] + n[0] * 22} y={mid[1] + n[1] * 22} text="মান কম" tone="amber" size={8.5} pop />
              </g>
            );
          })()}
        {landed && <Tag x={verdictAt[0]} y={verdictAt[1]} text={R.verdict} tone={R.mover === "B" ? "mint" : "red"} solid size={10} pop />}
        {judged && pick === R.right && <Ripple key={`r${round}`} at={mHead} r={22} />}
        {judged && pick !== R.right && <WrongMark key={`w${miss}`} x={mHead[0] + 12} y={mHead[1] + 16} />}
      </Sheet>
      <div className="mt-2 flex items-center justify-center gap-3 text-sm">
        <span className="font-semibold">
          {R.ask}: <span className="text-muted">একই ভেক্টর?</span>
        </span>
        {solved && !done && (
          <button type="button" className={`${btn()} ${FADE}`} onClick={next}>
            পরের জোড়া
          </button>
        )}
      </div>
      <div className="mt-2 grid gap-2">
        {R.opts.map((o, i) => (
          <Choice key={`${round}${o}`} n={i} look={pick === i && !play.running ? (i === R.right ? "right" : "wrong") : solved ? "dim" : "idle"} disabled={play.running || solved} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== R.right && !play.running && <Nope key={miss}>{R.nope[pick]}</Nope>}
      <Ticks items={X6_ROUNDS.map((r, i) => [r.ask, round > i || (round === i && solved)] as [string, boolean])} />
      <Task done={done}>প্রতিটা জোড়ায় বলুন: একই ভেক্টর, না আলাদা? বেছে নিলেই তীরটা সরে এসে মিলবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · বেগ আর বল: a rolling ball with its velocity arrow, a box with the
// arrow of the push on it. The reader flips each arrow and changes its
// strength; every change replays the motion: a longer arrow goes further,
// a flipped one goes the other way.

const X7_MS = 900;
type Mot = { dir: 1 | -1; big: boolean };
const motTell = (m: Mot) => `${m.big ? "বেশি" : "কম"} জোরে, ${m.dir > 0 ? "ডানে" : "বামে"}`;
const motSay = (m: Mot) => `কত জোরে: ${m.big ? "বেশি" : "কম"} · কোন দিকে: ${m.dir > 0 ? "ডানে" : "বামে"}`;
const X7_TICKS = ["বেগের দিক", "বেগের জোর", "বলের দিক", "বলের জোর"];

export function SpeedAndPush() {
  const pass = useGate();
  const [vel, setVel] = useSeed<Mot>("vel", { dir: 1, big: false });
  const [push, setPush] = useSeed<Mot>("push", { dir: 1, big: true });
  const [seen, setSeen] = useSeed<string[]>("seen", []);
  const [moved, setMoved] = useSeed<"vel" | "push" | null>("moved", null);
  // a velocity carries the ball at one steady speed (linear); a push speeds the box up (ease in)
  const velWalk = useWalk(X7_MS, { steps: false, ease: "linear" });
  const pushWalk = useWalk(X7_MS, { steps: false, ease: "in" });
  const running = velWalk.running || pushWalk.running;
  const change = (lane: "vel" | "push", what: "dir" | "big") => {
    if (running) return;
    const m = lane === "vel" ? vel : push;
    const nm: Mot = what === "dir" ? { ...m, dir: m.dir > 0 ? -1 : 1 } : { ...m, big: !m.big };
    if (lane === "vel") setVel(nm);
    else setPush(nm);
    setMoved(lane);
    const tick = X7_TICKS[(lane === "vel" ? 0 : 2) + (what === "dir" ? 0 : 1)];
    const nextSeen = seen.includes(tick) ? seen : [...seen, tick];
    setSeen(nextSeen);
    sfx.whoosh();
    (lane === "vel" ? velWalk : pushWalk).start(() => {
      if (nextSeen.length === X7_TICKS.length && seen.length < X7_TICKS.length) pass("বেগ আর বল: কত জোরে, কোন দিকে।");
    });
  };
  const t = (lane: "vel" | "push") => {
    const w = lane === "vel" ? velWalk : pushWalk;
    return moved !== lane ? 0 : w.running ? w.t : 1;
  };
  const vLen = vel.big ? 52 : 26;
  const fLen = push.big ? 52 : 26;
  const bx = 150 + vel.dir * vLen * 1.15 * t("vel");
  const fx = 150 + push.dir * fLen * t("push");
  const BR = 11;
  const by = 72 - BR;
  // rolling, not sliding: it turns by its own radius for every unit it goes
  const spin = ((bx - 150) / BR) * (180 / Math.PI);
  const done = seen.length >= X7_TICKS.length;
  return (
    <>
      <Sheet w={300} h={196} label="উপরে একটা গড়ানো বল, তার বেগের তীর। নিচে একটা বাক্স, তাকে ধাক্কা দেওয়া বলের তীর।" className="max-w-[21rem]">
        <g className="pointer-events-none">
          <Txt x={16} y={22} size={10.5} anchor="start" weight={800} color={PH.mint}>
            বেগ
          </Txt>
          <path d="M14 72H286" stroke={PH.faint} strokeWidth={2} />
          <GroundShadow x={bx} y={72.5} rx={12} ry={2.4} />
          <g transform={`rotate(${spin} ${bx} ${by})`}>
            <circle cx={bx} cy={by} r={BR} fill="#c2412d" stroke={PH.ink} strokeWidth={1} />
            <path d={`M${bx - 5} ${by - 9.8}q3.6 9.8 0 19.6M${bx + 5} ${by - 9.8}q-3.6 9.8 0 19.6`} stroke="#fde8d8" strokeWidth={1} fill="none" />
          </g>
          <Txt x={150} y={92} size={8.5} color={PH.mute}>
            {motSay(vel)}
          </Txt>
          <path d="M14 104H286" stroke={PH.faint} strokeWidth={1} strokeDasharray="3 3" />
          <Txt x={16} y={124} size={10.5} anchor="start" weight={800} color={PH.mint}>
            বল
          </Txt>
          <path d="M14 172H286" stroke={PH.faint} strokeWidth={2} />
          <GroundShadow x={fx} y={172.5} rx={22} ry={2.6} />
          <rect x={fx - 17} y={142} width={34} height={30} rx={2.5} fill="#d9a766" stroke={PH.ink} strokeWidth={1} />
          <path d={`M${fx - 17} 152H${fx + 17}M${fx - 17} 162H${fx + 17}`} stroke="#a8763a" strokeWidth={0.9} />
          <Txt x={150} y={189} size={8.5} color={PH.mute}>
            {motSay(push)}
          </Txt>
        </g>
        <PArrow a={[bx + vel.dir * (BR + 3), by]} b={[bx + vel.dir * (BR + 3 + vLen), by]} tone="mint" tell={motTell(vel)} />
        <PArrow a={[fx - push.dir * (21 + fLen), 157]} b={[fx - push.dir * 20, 157]} tone="mint" tell={motTell(push)} />
      </Sheet>
      {(["vel", "push"] as const).map((lane) => (
        <div key={lane} className="mx-auto mt-1.5 flex w-full max-w-[21rem] items-center justify-center gap-1.5 text-sm">
          <span className="w-10 font-semibold">{lane === "vel" ? "বেগ:" : "বল:"}</span>
          <button type="button" className={btn()} disabled={running} onClick={() => change(lane, "dir")}>
            দিক উল্টান
          </button>
          <button type="button" className={btn()} disabled={running} onClick={() => change(lane, "big")}>
            জোর বদলান
          </button>
        </div>
      ))}
      <Ticks items={X7_TICKS.map((x) => [x, seen.includes(x)] as [string, boolean])} />
      <Task done={done}>দুইটা তীরই একবার উল্টান, একবার জোর বদলান। বল আর বাক্স কোথায় যায়, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · How a vector is written. The book prints a bold A; the reader picks how
// to write it by hand. The pick is written into the খাতা stroke by stroke: a
// fat scribbled A (hard to tell from a plain one), a plain A, or an A with a
// small arrow on its head.

type Hand = "thick" | "plain" | "arrow";
const X8_OPTS: { key: Hand; label: string }[] = [
  { key: "thick", label: "হাতে মোটা করে A" },
  { key: "plain", label: "সাধারণ A" },
  { key: "arrow", label: "A, মাথায় ছোট্ট তীর" },
];
const X8_RIGHT = 2;
const X8_MS = 1600;
const X8_NOPE: Record<Hand, string> = {
  thick: "হাতের লেখায় মোটা আর চিকন আলাদা বোঝা কঠিন। bold চলে বইয়ের ছাপায়, খাতায় অন্য চিহ্ন লাগে।",
  plain: "এটা সাধারণ একটা A। যেকোনো রাশির নাম হতে পারে, ভেক্টর বলে চেনা যাচ্ছে না।",
  arrow: "",
};
/** A handwritten A (and its head-arrow) as stroke paths, in a box: centre x, top y0, height h. */
function handA(cx: number, y0: number, h: number) {
  const s = h * 0.29;
  const cy = y0 + h * 0.63;
  const ay = y0 - h * 0.2;
  return {
    legs: [`M${cx - s} ${y0 + h}L${cx} ${y0}`, `M${cx} ${y0}L${cx + s} ${y0 + h}`, `M${cx - s * 0.66} ${cy}Q${cx} ${cy - h * 0.06} ${cx + s * 0.66} ${cy}`],
    arrow: [`M${cx - h * 0.26} ${ay}Q${cx} ${ay - h * 0.06} ${cx + h * 0.26} ${ay - h * 0.02}`, `M${cx + h * 0.15} ${ay - h * 0.11}L${cx + h * 0.27} ${ay - h * 0.02}L${cx + h * 0.15} ${ay + h * 0.08}`],
  };
}
const PEN = "#284b8c";

function HandMini({ hand }: { hand: Hand }) {
  const a = handA(28, 10, 20);
  const paths = hand === "arrow" ? [...a.legs, ...a.arrow] : a.legs;
  return (
    <svg viewBox="0 0 56 34" className="h-8 w-14 shrink-0 rounded bg-[#fbf8f0]" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={PEN} strokeWidth={hand === "thick" ? 3.4 : 1.4} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export function WriteA() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const [tries, setTries] = useState(0);
  // only a timer: the pen strokes draw themselves (Draw); this waits for the last one
  const play = useWalk(X8_MS, { steps: false, ease: "linear" });
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    setTries((n) => n + 1);
    sfx.pencil(1.2);
    play.start(() => {
      if (i === X8_RIGHT) {
        sfx.chime();
        pass("খাতায় অক্ষরের মাথায় ছোট্ট তীর।");
      } else setMiss((m) => m + 1);
    });
  };
  const hand = pick === null ? null : X8_OPTS[pick].key;
  const right = pick === X8_RIGHT && !play.running;
  const a = handA(223, 58, 58);
  const strokes = hand === null ? [] : hand === "arrow" ? [...a.legs, ...a.arrow] : a.legs;
  const penClass = "stroke-[#284b8c]";
  return (
    <>
      <Sheet w={300} h={146} label="বামে বইয়ের পাতা, তাতে ছাপা মোটা A। ডানে খাতা, যেভাবে বেছে নেবেন সেভাবে A লেখা হবে।" className="max-w-[20rem]">
        <g className="pointer-events-none">
          <GroundShadow x={76} y={136} rx={62} ry={3} />
          <GroundShadow x={224} y={136} rx={62} ry={3} />
          <rect x={12} y={12} width={128} height={122} rx={6} fill="#f1f5f9" stroke={PH.ink} strokeWidth={1} />
          <Txt x={76} y={30} size={9.5} color={PH.mute}>
            বইয়ে
          </Txt>
          <text x={76} y={110} fontSize={66} fontWeight={900} textAnchor="middle" fill={PH.ink} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
            A
          </text>
          <Txt x={76} y={126} size={8.5} color={PH.mute}>
            bold
          </Txt>
          <rect x={160} y={12} width={128} height={122} rx={6} fill="#fbf8f0" stroke={PH.ink} strokeWidth={1} />
          {[48, 62, 76, 90, 104, 118].map((y) => (
            <path key={y} d={`M160 ${y}H288`} stroke="#c7d7ee" strokeWidth={0.8} />
          ))}
          <path d="M172 12V134" stroke="#f0a8a8" strokeWidth={0.8} />
          <Txt x={230} y={30} size={9.5} color={PH.mute}>
            খাতায়
          </Txt>
        </g>
        <g key={`${pick}-${tries}`}>
          {strokes.map((d, i) => (
            <g key={i}>
              <Draw d={d} delay={i * 300} ms={280} strokeWidth={hand === "thick" ? 6 : 2.2} className={penClass} />
              {hand === "thick" && <Draw d={d} delay={i * 300 + 140} ms={260} strokeWidth={4} className={`${penClass} translate-x-[1.5px] translate-y-[1px]`} />}
            </g>
          ))}
        </g>
        {right && <Ripple at={[223, 45]} r={22} />}
        {hand && pick !== X8_RIGHT && !play.running && <WrongMark key={`w${miss}`} x={262} y={78} size={16} />}
        {right && <Tag x={224} y={128} text="ভেক্টর A" tone="mint" solid size={8} pop />}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {X8_OPTS.map((o, i) => (
          <Choice key={o.key} n={i} look={pick === i && !play.running ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={play.running || right} onClick={() => choose(i)}>
            <span className="flex items-center gap-3">
              <HandMini hand={o.key} />
              <span>{o.label}</span>
            </span>
          </Choice>
        ))}
      </div>
      {hand && pick !== X8_RIGHT && !play.running && <Nope key={miss}>{X8_NOPE[hand]}</Nope>}
      <Task done={right}>বইয়ে ভেক্টর A ছাপা হয় bold-এ। খাতায় হাতে কীভাবে লিখবেন? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn: six cards from this journey's world, one at a time; the
// reader sends each to স্কেলার or ভেক্টর. A vector lands with its arrow drawn
// beside it. A wrong send lands and stays there, red, with a ? beside it (a
// scalar in the vector column also sprouts the red arrow it can't have); the
// next send flies it on from where it stopped.

type X9Item = { t: string; vec: boolean; tip?: P; tell?: string; nope: string };
const X9_ITEMS: X9Item[] = [
  { t: "জ্বর 37 °C", vec: false, nope: "37 °C-এর সাথে কোন দিক বসাবেন? শুধু মানেই পুরো কথা।" },
  { t: "2 km উত্তরে হাঁটুন", vec: true, tip: [0, -1], tell: "2 km উত্তরে", nope: "উত্তরে বাদ দিলে 2 km যেকোনো দিকে হতে পারে। এখানে দিকও বলা আছে।" },
  { t: "2 km হাঁটুন", vec: false, nope: "এখানে কোনো দিক বলা নেই, শুধু 2 km। এটা শুধু মান।" },
  { t: "ডান দিকে জোরে ধাক্কা", vec: true, tip: [1, 0], tell: "জোরে, ডানে", nope: "ধাক্কায় বলতে হয় কত জোরে, আর কোন দিকে। ডান দিকে কথাটাই দিক।" },
  { t: "গেট থেকে 1 km পূর্বে", vec: true, tip: [1, 0], tell: "1 km পূর্বে", nope: "পূর্বে না বললে নানু বৃত্তের যেকোনো জায়গায়। অবস্থানে দিক লাগে।" },
  { t: "দোলনার এক দোল 2 s", vec: false, nope: "2 s কোন দিকে? সময়ের কোনো দিক নেই, শুধু মান।" },
];
const X9_TOP: P = [150, 62];
const X9_ROWS = [94, 128, 162];
const X9_MS = 650;
const slotOf = (i: number, vec: boolean): P => {
  const row = X9_ITEMS.slice(0, i).filter((x) => x.vec === vec).length;
  return [vec ? 240 : 76, X9_ROWS[Math.min(row, X9_ROWS.length - 1)]];
};

function CardChip({ at, text, tone, size = 9 }: { at: P; text: string; tone: "ink" | "amber" | "mint" | "red"; size?: number }) {
  const w = textW(text, size) + 16;
  const c = tone === "ink" ? PH.ink : toneHex(tone);
  const fill = tone === "ink" ? "#fff" : tone === "amber" ? PH.amberSoft : tone === "mint" ? PH.mintSoft : PH.redSoft;
  return (
    <g className="pointer-events-none">
      <rect x={at[0] - w / 2} y={at[1] - 11} width={w} height={22} rx={6} fill={fill} stroke={c} strokeWidth={1.4} />
      <text x={at[0]} y={at[1] + size * 0.36} fontSize={size} fontWeight={700} textAnchor="middle" fill={tone === "ink" ? PH.ink : c} style={{ fontFamily: fontFor(text) }}>
        {text}
      </text>
    </g>
  );
}

function VecMark({ row, item, draw }: { row: number; item: X9Item; draw?: boolean }) {
  const tip = item.tip ?? [1, 0];
  const a: P = tip[0] === 0 ? [168, row + 11] : [156, row];
  const b: P = tip[0] === 0 ? [168, row - 11] : [184, row];
  return <PArrow a={a} b={b} tone="mint" w={2.2} draw={draw} tell={item.tell ?? false} />;
}

export function ScalarOrVector() {
  const pass = useGate();
  const [placed, setPlaced] = useSeed("placed", 0);
  const [pick, setPick] = useSeed<"S" | "V" | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const [from, setFrom] = useState<P>(X9_TOP);
  const play = useWalk(X9_MS, { steps: false });
  const finished = placed >= X9_ITEMS.length;
  const item = X9_ITEMS[Math.min(placed, X9_ITEMS.length - 1)];
  const send = (p: "S" | "V") => {
    if (play.running || finished) return;
    const ok = (p === "V") === item.vec;
    // a card left in the wrong column flies on from there
    const stuck = pick !== null && (pick === "V") !== item.vec;
    setFrom(stuck ? slotOf(placed, pick === "V") : X9_TOP);
    setPick(p);
    sfx.whoosh();
    const at = placed;
    play.start(() => {
      if (ok) {
        sfx.pop();
        setPlaced(at + 1);
        setPick(null);
        if (at + 1 === X9_ITEMS.length) pass("শুধু মান: স্কেলার। দিকও লাগলে: ভেক্টর।");
      } else {
        sfx.slip();
        setMiss((m) => m + 1);
      }
    });
  };
  const ok = pick !== null && (pick === "V") === item.vec;
  const target = pick ? slotOf(placed, pick === "V") : X9_TOP;
  const t = pick === null ? 0 : play.running ? play.t : 1;
  const pos: P = lerp(from, target, t);
  const wrongHere = pick !== null && !ok && !play.running;
  const cardW = textW(item.t, 8.5) + 16;
  return (
    <>
      <Sheet w={300} h={182} label="দুইটা কলাম: স্কেলার, শুধু মান; ভেক্টর, মান আর দিক। উপরে একটা card, সেটা একটা কলামে পাঠাতে হবে।" className="max-w-[21rem]">
        <g className="pointer-events-none">
          <path d="M150 80V176" stroke={PH.faint} strokeWidth={1.2} />
          <Txt x={76} y={20} size={11} weight={800}>
            স্কেলার
          </Txt>
          <Txt x={76} y={34} size={8.5} color={PH.amber}>
            শুধু মান
          </Txt>
          <Txt x={224} y={20} size={11} weight={800}>
            ভেক্টর
          </Txt>
          <text x={224} y={34} fontSize={8.5} fontWeight={600} textAnchor="middle">
            <tspan fill={PH.amber}>মান</tspan>
            <tspan fill={PH.ink}> + </tspan>
            <tspan fill={PH.blue}>দিক</tspan>
          </text>
        </g>
        {X9_ITEMS.slice(0, placed).map((x, i) => {
          const at = slotOf(i, x.vec);
          return (
            <g key={x.t}>
              <CardChip at={at} text={x.t} tone={x.vec ? "mint" : "amber"} size={8.5} />
              {x.vec && <VecMark row={at[1]} item={x} draw />}
            </g>
          );
        })}
        {placed > 0 && <Ripple key={`r${placed}`} at={slotOf(placed - 1, X9_ITEMS[placed - 1].vec)} r={26} />}
        {!finished && (
          <g>
            <CardChip at={pos} text={item.t} tone={wrongHere ? "red" : "ink"} size={8.5} />
            {wrongHere && pick === "V" && (
              <g key={`v${miss}`}>
                <path d={`M156 ${target[1]}H180`} stroke={PH.red} strokeWidth={2} strokeLinecap="round" className={FADE} />
                <WrongMark x={170} y={target[1] - 8} size={12} />
              </g>
            )}
            {wrongHere && pick === "S" && (
              <WrongMark key={`s${miss}`} x={Math.min(target[0] + cardW / 2 + 9, 142)} y={target[1] - 8} size={12} />
            )}
          </g>
        )}
        {finished && <Tag x={150} y={62} text="ছয়টাই ঠিক জায়গায়" tone="mint" solid pop />}
      </Sheet>
      <div className="mx-auto mt-2 flex w-full max-w-[21rem] justify-center gap-3">
        <button type="button" disabled={play.running || finished} onClick={() => send("S")} className="cursor-pointer rounded-full border-2 border-cat-amber/60 px-5 py-1.5 font-semibold text-cat-amber transition-colors hover:bg-cat-amber/10 disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none">
          স্কেলার
        </button>
        <button type="button" disabled={play.running || finished} onClick={() => send("V")} className="cursor-pointer rounded-full border-2 border-accent/60 px-5 py-1.5 font-semibold text-accent-text transition-colors hover:bg-accent/10 disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none">
          ভেক্টর
        </button>
      </div>
      {wrongHere && <Nope key={miss}>{item.nope}</Nope>}
      <Ticks items={X9_ITEMS.map((x, i) => [`${i + 1}`, placed > i] as [string, boolean])} />
      <Task done={finished}>প্রতিটা card স্কেলার না ভেক্টর? ঠিক কলামে পাঠান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10a · Figure for the last screen's setup (scene 1 of the video, settled):
// the two boards again. 2 km হাঁটুন: a whole circle of maybes. 2 km উত্তরে
// হাঁটুন: one arrow, one flag. The difference: the direction.

const S10_SAY = ["দুইটা command, দুটোতেই 2 km।", "2 km হাঁটুন: যেকোনো দিকে, পুরো একটা বৃত্ত।", "2 km উত্তরে হাঁটুন: ঠিক একটা জায়গা।", "পার্থক্যটা দিকে।"];

export function SignAnswer({}: Story) {
  const s = useScene(3, [600, 1500, 1500]);
  const k = s.k;
  const L: P = [78, 98];
  const R: P = [222, 122];
  const r = 40;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10_SAY[k]}</span>}>
      <Sheet w={300} h={166} label="দুইটা সাইনবোর্ড। বামেরটার নিচে শুরুর চারদিকে 2 km-এর বৃত্ত, ডানেরটার নিচে উত্তরে একটা তীর আর পতাকা।" className="max-w-[20rem]">
        <SignBoard x={L[0]} y={22} parts={BOARD_1} w={120} size={9.5} />
        <SignBoard x={R[0]} y={22} parts={BOARD_2} w={120} size={9.5} lit={k >= 3 ? { 1: "blue" } : {}} />
        <path d="M150 40V140" stroke={PH.faint} strokeWidth={1} strokeDasharray="3 3" className="pointer-events-none" />
        {k >= 1 && (
          <g key="ring" className="pointer-events-none">
            {/* the ring draws itself round the start: every way 2 km could go */}
            <Draw d={`M${L[0] + r} ${L[1]}A${r} ${r} 0 1 1 ${L[0] - r} ${L[1]}A${r} ${r} 0 1 1 ${L[0] + r} ${L[1]}`} ms={900} strokeWidth={1.4} className="stroke-[#dc2626]" />
            {[0, 60, 120, 180, 240, 300].map((d) => (
              <Ask key={d} x={L[0] + Math.cos((d * Math.PI) / 180) * r} y={L[1] + Math.sin((d * Math.PI) / 180) * r + 4} size={11} />
            ))}
          </g>
        )}
        {k >= 2 && (
          <g key="arrow">
            <PArrow a={R} b={[R[0], R[1] - r]} tone="mint" draw tell="2 km উত্তরে" />
            <g className={`pointer-events-none ${POP}`}>
              <path d={`M${R[0] + 4} ${R[1] - r - 2}V${R[1] - r - 24}`} stroke={PH.mute} strokeWidth={1.4} />
              <path d={`M${R[0] + 4} ${R[1] - r - 24}l14 5l-14 5Z`} fill={PH.mint} />
            </g>
          </g>
        )}
        {[L, R].map((p) => (
          <g key={p[0]} className="pointer-events-none">
            <circle cx={p[0]} cy={p[1]} r={3.6} fill={PH.ink} />
            <Txt x={p[0]} y={p[1] + 14} size={8} color={PH.mute}>
              শুরু
            </Txt>
          </g>
        ))}
        {k >= 3 && <Tag x={L[0]} y={154} text="শুধু মান · স্কেলার" tone="amber" solid size={8.5} pop />}
        {k >= 3 && <Tag x={R[0]} y={154} text="মান + দিক · ভেক্টর" tone="mint" solid size={8.5} pop />}
      </Sheet>
    </Scene>
  );
}

// 10 · Recap figure (scene 11): two columns. স্কেলার, শুধু মান: the four
// chips. ভেক্টর, মান + দিক: three arrows, অবস্থান, বেগ, বল.

const S10B_SAY = ["স্কেলার আর ভেক্টর।", "স্কেলার: শুধু মান।", "ভেক্টর: মান আর দিক।", "ভেক্টর আঁকি তীর দিয়ে।"];
const S10B_ARROWS: { a: P; b: P; name: string; tell: string }[] = [
  { a: [166, 88], b: [218, 74], name: "অবস্থান", tell: "1 km পূর্বে" },
  { a: [166, 112], b: [220, 112], name: "বেগ", tell: "মান + দিক" },
  { a: [166, 136], b: [218, 150], name: "বল", tell: "মান + দিক" },
];

export function TwoColumns({}: Story) {
  const s = useScene(3, [600, 1300, 1300]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10B_SAY[k]}</span>}>
      <Sheet w={300} h={196} label="দুই কলাম: স্কেলার, শুধু মান, চারটা chip; ভেক্টর, মান আর দিক, তিনটা তীর: অবস্থান, বেগ, বল।" className="max-w-[20rem]">
        <g className="pointer-events-none">
          <rect x={8} y={8} width={138} height={158} rx={10} fill="#f8fafc" stroke={PH.faint} />
          <rect x={154} y={8} width={138} height={158} rx={10} fill="#f8fafc" stroke={PH.faint} />
          <Txt x={77} y={30} size={13} weight={800}>
            স্কেলার
          </Txt>
          <Txt x={77} y={46} size={10} color={PH.amber} weight={700}>
            শুধু মান
          </Txt>
          <Txt x={223} y={30} size={13} weight={800}>
            ভেক্টর
          </Txt>
          <text x={223} y={46} fontSize={10} fontWeight={700} textAnchor="middle">
            <tspan fill={PH.amber}>মান</tspan>
            <tspan fill={PH.ink}> + </tspan>
            <tspan fill={PH.blue}>দিক</tspan>
          </text>
        </g>
        {k >= 1 &&
          S3_CHIPS.map((c, i) => <QtyChip key={c.v} x={i % 2 ? 110 : 44} y={i < 2 ? 82 : 126} text={c.v} w={58} h={26} size={11} pop />)}
        {k >= 2 &&
          S10B_ARROWS.map((r, i) => (
            <g key={r.name}>
              <PArrow a={r.a} b={r.b} tone="mint" draw delay={i * 220} tell={r.tell} />
              <g className={FADE}>
                <Txt x={234} y={(r.a[1] + r.b[1]) / 2 + 4} size={10} anchor="start">
                  {r.name}
                </Txt>
              </g>
            </g>
          ))}
        {k >= 3 && <Tag x={150} y={181} text="ভেক্টর আঁকি তীর দিয়ে" tone="mint" solid pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  SignField: { end: {} },
  SignBet: { start: {}, sealed: { bet: 2 }, same: { bet: 0 } },
  TithiFever: { end: {} },
  MeasureIt: { start: {}, temp: { temp: true }, done: { temp: true, sad: true } },
  NoWay37: { start: {}, wrong: { pick: 0 }, right: { pick: 1 } },
  MoreScalars: { mid: { k: 1 }, end: {} },
  GateMessage: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 1 }, right: { pick: 2 } },
  DrawArrow: { start: {}, one: { head: [170, 130], got: [0] }, done: { head: [130, 50], got: [0, 1] } },
  FourArrows: { start: {}, r1wrong: { round: 0, pick: 1 }, r1right: { round: 0, pick: 0 }, r2wrong: { round: 1, pick: 0 }, r2right: { round: 1, pick: 1 }, r3right: { round: 2, pick: 2 } },
  SpeedAndPush: { start: {}, flipped: { vel: { dir: -1, big: false }, moved: "vel", seen: ["বেগের দিক"] }, done: { vel: { dir: -1, big: true }, push: { dir: -1, big: false }, moved: "push", seen: ["বেগের দিক", "বেগের জোর", "বলের দিক", "বলের জোর"] } },
  WriteA: { start: {}, thick: { pick: 0 }, plain: { pick: 1 }, right: { pick: 2 } },
  ScalarOrVector: { start: {}, wrong: { placed: 1, pick: "S" }, mid: { placed: 3 }, done: { placed: 6 } },
  SignAnswer: { mid: { k: 1 }, end: {} },
  TwoColumns: { end: {} },
};
