"use client";

import { Fragment, useId, useState, type KeyboardEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { GROW,
  Choice,
  Draw,
  FADE,
  Nope,
  POP,
  Scene,
  Speech,
  Stepper,
  Ticks,
  pill,
  predictLook,
  primaryBtn,
  quietBtn,
  usePlay,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
} from "@/components/journey/kit";
import {
  Bubble,
  Card as CastCard,
  Chest,
  Person as CastPerson,
  Robot,
  Stage,
  Stall,
  StoryFrame,
  Tree,
} from "@/components/journey/cast";
import { Arrow, Dot, Label, Plane, Star, clamp, dist, makeFrame, same, sg, tup, type Frame, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";
import { bn } from "./figure-kit";

// Screens for "Math for AI 3.3 — Recipe, টিফিন বক্সের অঙ্ক", told as a Journey.
//
// The fair's two moves, add and stretch, glued together. Three classmates sit
// as coins on a card and the reader finds where it balances: the average, one
// slot at a time. A two-step machine gets there again with only the old moves,
// add all then × 1/3. The comment box puts each slip where the average of its
// words sits, which sorts happy from sad, and loses word order. ডাক্তার আপা's
// combo box is hunted with steppers, some of each food: a linear combination,
// whose parts the reader then names. Shiku's remote with only e₁ and e₂ shows
// a vector's numbers are the recipe amounts; a tilted remote reaches the same
// spot in exactly one way (a basis). Last, a rope of beads that no amount of
// adding and stretching will bend: that is what "linear" means.
//
// Every <Then> explanation (and the Check's) carries figures with no task that
// play by themselves (useScene), acting out its words: the two moves and no
// third, the balance point slot by slot, the তালগাছ cut in three, centroids of
// customers and spam, words tugging a slip's dot, the tiffin box filling its
// label, the average as a linear combination, λ₁v₁ + … + λₖvₖ growing, the
// subscript trap, presses that are the vector's numbers, one star by two
// remotes, a basis turned to fit a cloud, নাসিব's win, a GPU's cells, a
// straight line on curved data, and the Check's right and wrong answers.
//
// Tailwind only; the sheets are journey/plane. Ink on the white sheet is fixed.

const O: XY = [0, 0];
const times = (k: number, v: XY): XY => [k * v[0], k * v[1]];
const add = (a: XY, b: XY): XY => [a[0] + b[0], a[1] + b[1]];
/** a machine number rounded to one decimal, with a real minus */
const r1 = (n: number) => sg(Math.round(n * 10) / 10 || 0);
const tup1 = (v: readonly number[]) => `(${v.map(r1).join(", ")})`;

const KEY_STEP: Record<string, XY> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: নাসিবের বাজি. নাসিব is
//      washing glasses by the শরবত stall and scoffs at the two moves; ফাহিম
//      walks up with his list of six jobs, and নাসিব reads it and grins. Which
//      job he means stays his secret.

const S1_Y = 150;
const S1_AT = { nasib: 128, fahim: 224 };
const S1_RULE = [18, 14, 19, 12, 16, 15];

/** a glass being washed, held at (x, y), dripping */
function S1Glass({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 5} ${y - 13}h10l-1.5 13h-7Z`} fill="#e0f2fe" stroke="#0284c7" strokeWidth={1} />
      <circle cx={x - 2} cy={y + 5} r={1.2} fill="#38bdf8" />
      <circle cx={x + 2} cy={y + 10} r={1.2} fill="#38bdf8" />
    </g>
  );
}

/** ফাহিমের list, top-centre at (x, y): six ruled lines under a title */
function S1List({ x, y }: { x: number; y: number }) {
  return (
    <g className={POP}>
      <rect x={x - 19} y={y} width={38} height={44} rx={2} fill="white" stroke="#94a3b8" />
      <text x={x} y={y + 10} textAnchor="middle" fontSize={7} fontWeight={700} fill="#0f1b2d">
        ছয়টা কাজ
      </text>
      {S1_RULE.map((w, i) => (
        <g key={i}>
          <circle cx={x - 13} cy={y + 17 + i * 4.6} r={0.9} fill="#475569" />
          <path d={`M${x - 10} ${y + 17 + i * 4.6}h${w}`} stroke="#64748b" strokeWidth={1} />
        </g>
      ))}
    </g>
  );
}

export function NasibWager({}: Story) {
  const s = useScene(4, [600, 2600, 1600, 2400]);
  const k = s.k;
  const n = S1_AT.nasib;
  const f = S1_AT.fahim;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="নাসিব washes glasses at the শরবত stall and scoffs at the two moves; ফাহিম walks up with a list of six jobs, and নাসিব grins">
        <Stall x={50} y={S1_Y} sign="শরবত" color="#f97316" w={72} />
        <CastPerson who="nasib" x={n} y={S1_Y} arm={k >= 3 ? "down" : "hold"} mood={k === 1 || k >= 4 ? "smug" : "plain"} label />
        {k < 3 && <S1Glass x={n + 19} y={S1_Y - 40} />}
        {k === 1 && <Bubble x={n} y={S1_Y - 66} lines={["যোগ আর stretch দিয়ে", "কতদূর যাবি?"]} />}
        <CastPerson who="fahim" x={k >= 2 ? f : 370} y={S1_Y} facing={-1} walking={k === 2} arm={k >= 3 ? "hold" : "down"} label={k >= 3} />
        {k >= 3 && <S1List x={f - 32} y={S1_Y - 92} />}
        {k >= 4 && <Bubble x={n} y={S1_Y - 66} side="left" lines={["একটা তো তোরা", "জীবনেও পারবি না!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · নাসিবের বাজি. The six jobs of this journey, laid out at the start beside
//     the only two moves the reader owns. The reader bets on the one that
//     cannot be done, and the bet is sealed, never marked: BendIt (screen 9)
//     is what settles it. This is the question the whole journey answers.

const TWO_MOVES: [string, string][] = [
  ["যোগ", "u + v"],
  ["Stretch", "λ · v"],
];
const JOBS = [
  "Class-এর average গড়ন বের করা",
  "একটা মন্তব্য খুশি না বেজার, সেটা ধরা",
  "আপার শর্ত মানা combo box বানানো",
  "মাঠের যেকোনো ঠিকানায় যাওয়া",
  "মাঠ তেরছা হলেও যেকোনো ঠিকানায় যাওয়া",
  "পুকুরের পাড়ের বাঁকা রাস্তায় দড়ি বসানো",
];

export function NasibBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি ধরা হলো। ছয়টা কাজ একটা একটা করে চেষ্টা kore miliye dekha hobe");
  };

  return (
    <>
      <div className="mx-auto mt-2 flex max-w-sm flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border-2 border-cat-blue/40 bg-cat-blue/5 px-3 py-1.5">
        <span className="text-sm font-semibold">হাতে চাল দুইটা:</span>
        {TWO_MOVES.map(([name, sym]) => (
          <span key={name} className="text-[0.95rem]">
            <b className="font-mono font-semibold">{sym}</b> <span className="text-muted">{name}</span>
          </span>
        ))}
      </div>
      <div className="mt-2.5 text-sm font-medium text-muted">
        shudhu jog ar strech kore নিচের কোন কাজটা করা যাবে না বলে মনে হয়?
      </div>
      <div className="mt-2 grid gap-2">
        {JOBS.map((o, i) => (
          <Choice
            key={o}
            n={i}
            look={bet === i ? "picked" : bet !== null ? "dim" : "idle"}
            disabled={bet !== null}
            onClick={() => seal(i)}
          >
            {o}
          </Choice>
        ))}
      </div>
      {bet !== null && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>
          বাজি সিল করা হলো। ছয়টা কাজ শেষ করে মিলিয়ে দেখবো।
        </div>
      )}
      <Task done={bet !== null}>ছয়টার মধ্যে একটাতে বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1¾ · A figure for screen 1's explanation, no task: the only two moves. Two
//      cards joined tip to tail, then one card stretched by 2; then a third
//      move is offered and crossed out. Every job after this uses just the two.

const X1_F = makeFrame(0, 3, 0, 3, 24, 6);
const X1_U: XY = [2, 0.5];
const X1_V: XY = [0.5, 1.25];
const X1_SAY = [
  "হাতে চাল মাত্র দুইটা।",
  "প্রথম চাল যোগ: একটা card যেখানে থামে, পরেরটা শুরু হয় সেখান থেকে।",
  "দ্বিতীয় চাল stretch: একটা card-কে একটা সংখ্যা দিয়ে গুণ, এখানে 2 দিয়ে।",
  "এর বাইরে তিন নম্বর কোনো চাল?",
];

/** one move's own little sheet, its name under it; dim until its beat */
function X1Panel({ title, on, children }: { title: string; on: boolean; children?: ReactNode }) {
  return (
    <div className={`w-[5.25rem] transition-opacity duration-500 motion-reduce:transition-none ${on ? "opacity-100" : "opacity-40"}`}>
      <Plane f={X1_F} grid={1} axes={false} label={title} className="my-0! max-w-none">
        {children}
      </Plane>
      <div className="mt-1 text-center text-xs font-semibold">{title}</div>
    </div>
  );
}

export function MovesOnly() {
  const s = useScene(4, [600, 1700, 1700, 1400]);
  const k = s.k;
  const [m] = useTween([k >= 2 ? 2 : 1], 900);
  const tip = add(X1_U, X1_V);

  return (
    <Scene scene={s} caption={k < 4 ? X1_SAY[k] : <span className={FADE}>নাসিবের শর্তে সেটা নিষেধ। ছয়টা কাজেই চাল শুধু এই দুইটা।</span>}>
      <div className="flex justify-center gap-3">
        <X1Panel title="যোগ" on={k >= 1}>
          {k >= 1 && (
            <>
              <Arrow f={X1_F} from={O} to={X1_U} tone="blue" w={2.2} draw />
              <Arrow f={X1_F} from={X1_U} to={tip} tone="coral" w={2.2} draw delay={500} />
              <Arrow f={X1_F} from={O} to={tip} tone="violet" w={2.4} draw delay={1000} />
            </>
          )}
        </X1Panel>
        <X1Panel title="Stretch" on={k >= 2}>
          {k >= 2 && (
            <>
              <Arrow f={X1_F} from={O} to={X1_V} tone="coral" w={2.2} faint />
              <Arrow f={X1_F} from={O} to={times(m, X1_V)} tone="coral" w={2.4} />
              <Label f={X1_F} at={times(2, X1_V)} dx={6} dy={8} anchor="start" size={9} className={`${FADE} fill-cat-coral font-mono`}>
                × 2
              </Label>
            </>
          )}
        </X1Panel>
        <X1Panel title="আর কিছু?" on={k >= 3}>
          {k >= 3 && (
            <text x={X1_F.W / 2} y={X1_F.H / 2 + 9} textAnchor="middle" fontSize={26} fontWeight={800} className={`${FADE} fill-[#94a3b8]`}>
              ?
            </text>
          )}
          {k >= 4 && (
            <>
              <Draw d="M20 20L64 64" strokeWidth={3} className="stroke-cat-coral" />
              <Draw d="M64 20L20 64" strokeWidth={3} delay={250} className="stroke-cat-coral" />
            </>
          )}
        </X1Panel>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: the class poster.
//      ফাহিম, সামিন and সোম walk in under it and hold up their (height,
//      weight) cards; সামিন sets them down as three coins on the squared
//      hardboard and asks where it balances. No finger lands on it: that is
//      the widget's question.

const S2_Y = 150;
const S2_KIDS = [
  { who: "fahim", x: 36, v: [172, 68], tone: "blue", ink: "#2563eb" },
  { who: "samin", x: 104, v: [168, 55], tone: "teal", ink: "#0d9488" },
  { who: "som", x: 172, v: [159, 51], tone: "amber", ink: "#d97706" },
] as const;
/** the hardboard: (height, weight) 154…178 × 46…72 onto the board's face */
const S2_B = { x0: 214, x1: 306, y0: 128, y1: 74 };
const s2x = (h: number) => S2_B.x0 + ((h - 154) / 24) * (S2_B.x1 - S2_B.x0);
const s2y = (w: number) => S2_B.y0 + ((w - 46) / 26) * (S2_B.y1 - S2_B.y0);

export function PosterCards({}: Story) {
  const s = useScene(4, [600, 1600, 1800, 1800]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ফাহিম, সামিন and সোম hold up their height and weight cards under the class poster; সামিন puts them as three coins on a squared hardboard and asks where it balances">
        {/* the poster on the wall */}
        <rect x={210} y={28} width={96} height={36} rx={3} fill="white" stroke="#a8a29e" />
        <text x={258} y={41} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#0f1b2d">
          Class poster
        </text>
        <text x={258} y={55} textAnchor="middle" fontSize={7.5} fill="#44403c">
          average-এ কেমন গড়ন?
        </text>
        {/* the hardboard on its easel */}
        <path d={`M226 ${S2_B.y0}l-8 22M294 ${S2_B.y0}l8 22M260 ${S2_B.y0}v22`} stroke="#78350f" strokeWidth={3} strokeLinecap="round" />
        <rect x={S2_B.x0 - 4} y={S2_B.y1 - 4} width={S2_B.x1 - S2_B.x0 + 8} height={S2_B.y0 - S2_B.y1 + 8} rx={2} fill="#d6b98c" stroke="#92400e" />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`c${i}`} d={`M${S2_B.x0 + (i * (S2_B.x1 - S2_B.x0)) / 8} ${S2_B.y1}V${S2_B.y0}`} stroke="#92400e" strokeOpacity={0.35} strokeWidth={0.8} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <path key={`r${i}`} d={`M${S2_B.x0} ${S2_B.y1 + (i * (S2_B.y0 - S2_B.y1)) / 5}H${S2_B.x1}`} stroke="#92400e" strokeOpacity={0.35} strokeWidth={0.8} />
        ))}
        {k >= 3 &&
          S2_KIDS.map((kid, i) => (
            <circle
              key={kid.who}
              cx={s2x(kid.v[0])}
              cy={s2y(kid.v[1])}
              r={6}
              fill={kid.ink}
              stroke="white"
              strokeWidth={1.6}
              className={POP}
              style={{ transitionDelay: `${i * 250}ms` }}
            />
          ))}
        {S2_KIDS.map((kid) => (
          <Fragment key={kid.who}>
            <CastPerson
              who={kid.who}
              x={k >= 1 ? kid.x : -40}
              y={S2_Y}
              walking={k === 1}
              ms={1400}
              arm={k === 2 || (kid.who !== "samin" && k >= 2) ? "hold" : kid.who === "samin" && k >= 3 ? "point" : "down"}
              mood={kid.who === "samin" && k >= 4 ? "puzzled" : "plain"}
              label={k >= 2}
            />
            {k >= 2 && <CastCard x={kid.x} y={S2_Y - 76} text={`(${kid.v[0]}, ${kid.v[1]})`} tone={kid.tone} />}
          </Fragment>
        ))}
        {k >= 4 && <Bubble x={104} y={S2_Y - 90} lines={["কোথায় ধরলে", "হেলবে না?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · Three classmates as equal coins on a (height, weight) card; a tap on a
//     coin shows its exact spot. The reader
//     puts a finger where it should balance, then lets go: the balance point
//     is the height average and the weight average, together.

const KIDS: { n: string; v: XY }[] = [
  { n: "ফাহিম", v: [172, 68] },
  { n: "সামিন", v: [168, 55] },
  { n: "সোম", v: [159, 51] },
];
const SUM = KIDS.reduce<XY>((s, k) => add(s, k.v), [0, 0]);
const MID = times(1 / 3, SUM);
const FB = makeFrame(154, 178, 46, 72, 10);

/** The three coins. A tap on one shows its (height, weight) and drops dashed lines to both edges of the card. */
function Coins({ f, shown, show }: { f: Frame; shown: string[]; show: (n: string) => void }) {
  return (
    <>
      {KIDS.map((k) => {
        const [x, y] = [f.sx(k.v[0]), f.sy(k.v[1])];
        const open = shown.includes(k.n);
        return (
          <g key={k.n}>
            {open && (
              <path
                d={`M${x} ${y}V${f.sy(f.y0)}M${x} ${y}H${f.sx(f.x0)}`}
                strokeWidth={1.2}
                strokeDasharray="3 3"
                className={`${FADE} pointer-events-none fill-none stroke-[#92400e]/60`}
              />
            )}
            <circle cx={x} cy={y} r={9} strokeWidth={2} className="pointer-events-none fill-cat-amber stroke-[#92400e]" />
            <text x={x} y={y + 22} textAnchor="middle" fontSize={10} fontWeight={600} className="pointer-events-none fill-[#0f1b2d]">
              {k.n}
            </text>
            {open && (
              <text x={x} y={y + 34} textAnchor="middle" fontSize={9.5} fontWeight={700} className={`${FADE} pointer-events-none fill-[#92400e] font-mono`}>
                {tup(k.v)}
              </text>
            )}
            {/* a finger-sized target; stops the tap from also moving the finger on the card */}
            <circle
              cx={x}
              cy={y}
              r={15}
              role="button"
              aria-label={`${k.n}-এর ঠিকানা`}
              className="cursor-pointer fill-transparent"
              onPointerDown={(e) => {
                e.stopPropagation();
                show(k.n);
              }}
            />
          </g>
        );
      })}
    </>
  );
}

function CardAxes({ f }: { f: Frame }) {
  return (
    <>
      {[160, 170].map((x) => (
        <Label key={x} f={f} at={[x, f.y0]} dy={12} size={8.5} weight={400} className="fill-[#5a6b7d] font-mono">
          {x}
        </Label>
      ))}
      {[50, 60, 70].map((y) => (
        <Label key={y} f={f} at={[f.x0, y]} dx={-4} dy={3} anchor="end" size={8.5} weight={400} className="fill-[#5a6b7d] font-mono">
          {y}
        </Label>
      ))}
      <Label f={f} at={[f.x1, f.y0]} dx={-4} dy={-6} anchor="end" size={9} className="fill-[#5a6b7d]">
        উচ্চতা (cm) →
      </Label>
      <Label f={f} at={[f.x0, f.y1]} dx={6} dy={12} anchor="start" size={9} className="fill-[#5a6b7d]">
        ↑ ওজন (kg)
      </Label>
    </>
  );
}

/**
 * One slot's numbers sliding into their average: three amber dots on a rail,
 * each carrying its own number, gliding together until they are one violet
 * dot. `phase` 0 apart, 1 travelling, 2 arrived.
 */
function AvgRail({ vals, lo, hi, avg, phase }: { vals: number[]; lo: number; hi: number; avg: number; phase: 0 | 1 | 2 }) {
  const W = 232;
  const at = (v: number) => 14 + ((v - lo) / (hi - lo)) * (W - 28);
  const xs = useTween(phase === 0 ? vals.map(at) : vals.map(() => at(avg)), 900);

  return (
    <svg viewBox={`0 0 ${W} 28`} className="w-full" role="presentation">
      <line x1={10} y1={22} x2={W - 10} y2={22} strokeWidth={1.5} className="stroke-cat-violet/25" />
      {xs.map((x, i) => (
        <g key={i} className={`transition-opacity duration-300 motion-reduce:transition-none ${phase === 2 ? "opacity-0" : "opacity-100"}`}>
          <circle cx={x} cy={22} r={5} strokeWidth={1.5} className="fill-cat-amber stroke-[#92400e]" />
          <text x={x} y={11} textAnchor="middle" fontSize={10} fontWeight={600} className="fill-[#0f1b2d] font-mono">
            {vals[i]}
          </text>
        </g>
      ))}
      {phase === 2 && (
        <g className={POP}>
          <circle cx={at(avg)} cy={22} r={6} strokeWidth={2} className="fill-cat-violet stroke-cat-violet" />
          <text x={at(avg)} y={11} textAnchor="middle" fontSize={10.5} fontWeight={700} className="fill-cat-violet font-mono">
            {r1(avg)}
          </text>
        </g>
      )}
    </svg>
  );
}

export function BalanceCard() {
  const pass = useGate();
  const [pin, setPin] = useSeed<XY | null>("pin", null);
  const [held, setHeld] = useSeed("held", false);
  const [averaged, setAveraged] = useSeed("averaged", false);
  const [shown, setShown] = useSeed<string[]>("shown", []);
  const { k, play } = usePlay(900);
  const close = pin !== null && dist(pin, MID) <= 2.5;
  const step = averaged ? 4 : k;
  const phaseOf = (first: number): 0 | 1 | 2 => (step >= first + 1 ? 2 : step >= first ? 1 : 0);

  const place = (p: XY) => {
    if (held) return;
    setPin([clamp(Math.round(p[0]), FB.x0 + 1, FB.x1 - 1), clamp(Math.round(p[1]), FB.y0 + 1, FB.y1 - 1)]);
  };
  const nudge = (e: KeyboardEvent<SVGSVGElement>) => {
    const d = KEY_STEP[e.key];
    if (!d || held) return;
    e.preventDefault();
    place(add(pin ?? [166, 59], d));
  };
  const lift = () => {
    setHeld(true);
    play(4, () => {
      setAveraged(true);
      pass("Card-টা balance-এ থাকে (166.3, 58)-এ। উচ্চতাগুলোর average 166.3 আর ওজনগুলোর average 58, মানে দুই ঘরে আলাদা আলাদা average।");
    });
  };

  return (
    <>
      <Plane
        f={FB}
        grid={2}
        axes={false}
        label={`three coins on a card; ${pin ? `finger at ${tup(pin)}` : "no finger yet"}${held ? "; it balances at (166.3, 58)" : ""}`}
        drag={held ? undefined : { down: place, move: place }}
        onKey={nudge}
        className="max-w-[15rem]"
      >
        <CardAxes f={FB} />
        {held &&
          KIDS.map((kid) => (
            <path
              key={kid.n}
              d={`M${FB.sx(kid.v[0])} ${FB.sy(kid.v[1])}L${FB.sx(MID[0])} ${FB.sy(MID[1])}`}
              strokeWidth={1.4}
              strokeDasharray="4 4"
              className={`${FADE} pointer-events-none fill-none stroke-cat-violet/60`}
            />
          ))}
        <Coins f={FB} shown={shown} show={(n) => !shown.includes(n) && setShown([...shown, n])} />
        {pin && (
          <circle cx={FB.sx(pin[0])} cy={FB.sy(pin[1])} r={8} strokeWidth={2} strokeDasharray="4 3" className="pointer-events-none fill-cat-blue/15 stroke-cat-blue" />
        )}
        {held && (
          <>
            <path
              d={`M${FB.sx(MID[0])} ${FB.sy(MID[1]) - 1}l-8 13h16Z`}
              className={`${POP} pointer-events-none fill-cat-violet`}
            />
            <Label f={FB} at={MID} dx={12} dy={-6} anchor="start" size={10} weight={700} className={`${FADE} fill-cat-violet`}>
              (166.3, 58)
            </Label>
          </>
        )}
      </Plane>
      {!held && (
        <div className="text-center text-sm text-muted">
          {pin ? (
            <>
              আপনার আঙুল এখন <span className="font-mono">{tup(pin)}</span>-এ। চাইলে আরেকটু সরিয়ে নিতে পারেন।
            </>
          ) : (
            <>
              কে কোন ঘরে বসেছে, দেখতে কয়েনের ওপর tap করুন। তারপর কাগজের যেখানে আঙুল রাখতে চান, সেখানে tap করুন।
            </>
          )}
        </div>
      )}
      {pin && !held && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={lift} className={`${primaryBtn} bg-cat-violet`}>
            আঙুলের ওপর ছেড়ে দিন
          </button>
        </div>
      )}
      {held && pin && (
        <div className={`${FADE} mx-auto mt-2 max-w-sm text-center text-[0.95rem]`}>
          {close ? (
            <div className="text-accent-text">আপনার আঙুল ছিল {tup(pin)}-এ, একদম কাছাকাছি! Card-টা প্রায় একটুও হেললো না।</div>
          ) : (
            <Nope>
              আপনার আঙুল ছিল {tup(pin)}-এ, তাই card-টা এক দিকে হেলে পড়লো। আসল balance-এর জায়গাটা বেগুনি triangle-এর ওপর।
            </Nope>
          )}
          <div className="mt-3 grid gap-2 rounded-2xl bg-cat-violet/5 px-3 py-3">
            {[
              { slot: "ডানে-বামে", lo: 156, hi: 175, first: 1 },
              { slot: "ওপরে-নিচে", lo: 48, hi: 71, first: 3 },
            ].map(({ slot, lo, hi, first }, s) => {
              const vals = KIDS.map((kid) => kid.v[s]);
              const phase = phaseOf(first);
              return (
                <div key={slot}>
                  <AvgRail vals={vals} lo={lo} hi={hi} avg={MID[s]} phase={phase} />
                  <div className="text-center font-mono text-sm">
                    <span className="font-sans text-muted">{slot}: </span>({vals.join(" + ")}) ÷ 3
                    {phase === 2 && <span className={`${POP} inline-block`}>&nbsp;= <b className="text-cat-violet">{r1(MID[s])}</b></span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Task done={held}>তিনটা কয়েনই সমান ভারী। কাগজে tap করে আঙুল রাখুন, তারপর ছেড়ে দিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2¾ · A figure for screen 2's explanation, no task: two separate sums. The
//      coins drop their heights onto the bottom edge, and the three slide
//      together into 166.3; then their weights onto the left edge, into 58.
//      Where the two meet is the balance point, and neither sum saw the other.

const X2_F = makeFrame(154, 178, 46, 72, 5, 10);
const X2_SAY = [
  "ফাহিম, সামিন আর সোম, card-এর ওপর তিনটা কয়েন।",
  "ডানে-বামের হিসাবে লাগে শুধু উচ্চতা।",
  "তিনটা উচ্চতার average, 166.3।",
  "ওপরে-নিচের হিসাবে লাগে শুধু ওজন।",
  "তিনটা ওজনের average, 58।",
];

export function SlotBySlot() {
  const s = useScene(5, [700, 1500, 1500, 1500, 1500]);
  const k = s.k;
  const f = X2_F;
  const xs = useTween(KIDS.map((kid) => (k >= 2 ? MID[0] : kid.v[0])), 900);
  const ys = useTween(KIDS.map((kid) => (k >= 4 ? MID[1] : kid.v[1])), 900);
  const [bottom, left] = [f.sy(f.y0), f.sx(f.x0)];
  const [mx, my] = [f.sx(MID[0]), f.sy(MID[1])];
  const soon = { transitionDelay: "900ms" };

  return (
    <Scene
      scene={s}
      caption={k < 5 ? X2_SAY[k] : <span className={FADE}>দুই হিসাব দুই ঘরে, কেউ কারো ঘরে ঢোকে না। দুইটা যেখানে মেলে, সেখানেই balance।</span>}
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={f} grid={2} axes={false} label="three coins on the card; their heights average to 166.3 along the bottom, their weights to 58 along the left" className="my-0! max-w-none">
            {k >= 1 &&
              KIDS.map((kid) => (
                <path key={`v${kid.n}`} d={`M${f.sx(kid.v[0])} ${f.sy(kid.v[1])}V${bottom}`} strokeWidth={1} strokeDasharray="3 3" className={`${FADE} fill-none stroke-[#92400e]/50`} />
              ))}
            {k >= 3 &&
              KIDS.map((kid) => (
                <path key={`h${kid.n}`} d={`M${f.sx(kid.v[0])} ${f.sy(kid.v[1])}H${left}`} strokeWidth={1} strokeDasharray="3 3" className={`${FADE} fill-none stroke-[#92400e]/50`} />
              ))}
            {k >= 5 && (
              <g className={FADE}>
                <path d={`M${mx} ${bottom}V${my}M${left} ${my}H${mx}`} strokeWidth={1.6} strokeDasharray="4 3" className="fill-none stroke-cat-violet" />
                <path d={`M${mx} ${my - 1}l-7 12h14Z`} className={`${POP} fill-cat-violet`} />
              </g>
            )}
            {KIDS.map((kid) => (
              <circle key={kid.n} cx={f.sx(kid.v[0])} cy={f.sy(kid.v[1])} r={5} strokeWidth={1.5} className="fill-cat-amber stroke-[#92400e]" />
            ))}
            {k >= 1 && xs.map((x, i) => <circle key={`x${i}`} cx={f.sx(x)} cy={bottom} r={3.5} className={`${POP} fill-cat-amber`} />)}
            {k >= 2 && (
              <>
                <circle cx={mx} cy={bottom} r={4.5} style={soon} className={`${POP} fill-cat-violet`} />
                <text x={mx + 5} y={bottom - 6} fontSize={9} fontWeight={700} style={soon} className={`${FADE} fill-cat-violet font-mono`}>
                  166.3
                </text>
              </>
            )}
            {k >= 3 && ys.map((y, i) => <circle key={`y${i}`} cx={left} cy={f.sy(y)} r={3.5} className={`${POP} fill-cat-amber`} />)}
            {k >= 4 && (
              <>
                <circle cx={left} cy={my} r={4.5} style={soon} className={`${POP} fill-cat-violet`} />
                <text x={left + 6} y={my - 5} fontSize={9} fontWeight={700} style={soon} className={`${FADE} fill-cat-violet font-mono`}>
                  58
                </text>
              </>
            )}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <div className="h-[3.4rem]">
            {k >= 1 && (
              <div className={FADE}>
                <div className="text-xs text-muted">ডানে-বামে, শুধু উচ্চতা</div>
                <div className="font-mono">172, 168, 159</div>
              </div>
            )}
            {k >= 2 && (
              <div className={FADE}>
                গড় <b className="font-mono text-cat-violet">166.3</b>
              </div>
            )}
          </div>
          <div className="mt-2 h-[3.4rem]">
            {k >= 3 && (
              <div className={FADE}>
                <div className="text-xs text-muted">ওপরে-নিচে, শুধু ওজন</div>
                <div className="font-mono">68, 55, 51</div>
              </div>
            )}
            {k >= 4 && (
              <div className={FADE}>
                গড় <b className="font-mono text-cat-violet">58</b>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2⅞ · A story scene for screen 2's explanation, no task: nobody is average.
//      The three hold up their cards, a dashed stranger with the average card
//      (166.3, 58) appears beside them, none of the three cards matches it,
//      and a note on the wall says so. An average is a sum, not a person.

const X2_GHOST = 262;
const X2_CARD_Y = S2_Y - 76;

export function NobodyAverage() {
  const s = useScene(4, [600, 1400, 1600, 1500]);
  const k = s.k;
  const g = X2_GHOST;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="ফাহিম, সামিন and সোম hold up their cards; a dashed stranger with the average card (166.3, 58) stands beside them, and none of them matches it">
        {k >= 4 && (
          <g className={POP}>
            <rect x={80} y={14} width={160} height={24} rx={3} fill="white" stroke="#a8a29e" />
            <text x={160} y={30} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#0f1b2d">
              ঠিক এই মাপের কেউ class-এ নাই
            </text>
          </g>
        )}
        {S2_KIDS.map((kid, i) => (
          <Fragment key={kid.who}>
            <CastPerson who={kid.who} x={kid.x} y={S2_Y} arm={k >= 1 ? "hold" : "down"} mood={k >= 4 ? "puzzled" : "plain"} label />
            {k >= 1 && <CastCard x={kid.x} y={X2_CARD_Y} text={tup(kid.v)} tone={kid.tone} />}
            {k >= 3 && (
              <g className={POP} style={{ transitionDelay: `${i * 300}ms` }}>
                <circle cx={kid.x} cy={X2_CARD_Y - 16} r={6} fill="#fee2e2" stroke="#dc2626" strokeWidth={1.2} />
                <path d={`M${kid.x - 2.5} ${X2_CARD_Y - 18.5}l5 5m0 -5l-5 5`} stroke="#dc2626" strokeWidth={1.6} strokeLinecap="round" />
              </g>
            )}
          </Fragment>
        ))}
        {k >= 2 && (
          <>
            <g className={POP} fill="#ede9fe" stroke="#7c3aed" strokeWidth={1.4} strokeDasharray="3 2.5">
              <path d={`M${g - 3.5} ${S2_Y - 22}V${S2_Y - 1}M${g + 3.5} ${S2_Y - 22}V${S2_Y - 1}`} fill="none" />
              <rect x={g - 9} y={S2_Y - 40} width={18} height={20} rx={5} />
              <circle cx={g} cy={S2_Y - 51} r={9} />
            </g>
            <g className={POP} style={{ transitionDelay: "300ms" }}>
              <rect x={g - 37} y={X2_CARD_Y - 9} width={74} height={18} rx={3} fill="white" stroke="#7c3aed" strokeWidth={1.4} />
              <text x={g} y={X2_CARD_Y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#6d28d9">
                (166.3, 58)
              </text>
            </g>
            <text x={g} y={S2_Y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#6d28d9" className={FADE}>
              average
            </text>
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · The same answer from the two old moves only: add all three cards (a
//     giant, 499 cm tall), then predict and apply the stretch that brings the
//     sum back down onto the balance point.

const FW = makeFrame(0, 520, 0, 190, 0.56);
const SHRINK = ["× 3", "− 3", "× ⅓, মানে তিন ভাগের এক ভাগ"];

export function SumShrink() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const over = stage === 2;

  const next = () => {
    setStage(stage + 1);
    if (stage + 1 === 2) pass("নতুন কোনো চাল লাগলো না। আগে সবাইকে যোগ, তারপর ⅓ দিয়ে stretch, ব্যস, average পেয়ে গেলেন।");
  };

  return (
    <>
      <Plane f={FW} grid={50} ticks={100} label={`three students near (166, 58)${stage >= 1 ? "; their sum (499, 174)" : ""}${over ? "; a third of it, (166.3, 58)" : ""}`} className="max-w-[21rem]">
        {KIDS.map((k) => (
          <Dot key={k.n} f={FW} at={k.v} r={3.5} className="fill-cat-amber" />
        ))}
        {stage >= 1 && (
          <>
            <Arrow f={FW} from={O} to={SUM} tone="teal" w={2.6} draw faint={over} />
            <Label f={FW} at={SUM} dx={-6} dy={16} anchor="end" size={10} weight={700} className={`${FADE} fill-cat-teal`}>
              (499, 174)
            </Label>
          </>
        )}
        {over && (
          <>
            <Arrow f={FW} from={O} to={MID} tone="violet" w={3} draw />
            <Label f={FW} at={MID} dx={4} dy={-12} anchor="middle" size={10} weight={700} className={`${FADE} fill-cat-violet`}>
              Average (166.3, 58)
            </Label>
          </>
        )}
      </Plane>
      <div className="mx-auto max-w-sm text-center">
        {stage === 0 && <div className="text-[0.95rem] text-muted">হলুদ তিনটা dot হলো ফাহিম, সামিন আর সোম।</div>}
        {stage >= 1 && (
          <div className={`${FADE} font-mono text-sm`}>
            (172, 68) + (168, 55) + (159, 51) = <b className="whitespace-nowrap text-cat-teal">(499, 174)</b>
          </div>
        )}
        {over && (
          <div className={`${FADE} mt-1 font-mono text-[0.95rem]`}>
            ⅓ × (499, 174) = <b className="text-cat-violet">(166.3, 58)</b>
            <div className="font-sans">আগের card-এর balance-এর জায়গাটাই, হুবহু!</div>
          </div>
        )}
      </div>
      {stage === 1 && (
        <Speech who="সোম" initial="সো" tint="teal">
          ৪৯৯ cm লম্বা আর ১৭৪ kg ওজন? এta তো মানুষ না, তালগাছ!
        </Speech>
      )}
      {stage >= 1 && (
        <>
          <div className="mt-4 text-sm font-medium text-muted">এই তালগাছটাকে average গড়নে নামাতে (499, 174)-কে কী করবেন?</div>
          <div className="mt-2 grid gap-2">
            {SHRINK.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, over, 2)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </>
      )}
      {(stage === 0 || (stage === 1 && guess !== null)) && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={next} className={`${primaryBtn} ${stage === 0 ? "bg-cat-teal" : "bg-cat-violet"}`}>
            {stage === 0 ? "১ · তিনজনের card যোগ করুন" : "২ · ⅓ দিয়ে stretch করুন"}
          </button>
        </div>
      )}
      <Task done={over}>প্রথমে তিনজনের card যোগ করুন। তারপর একটা guess kore দ্বিতীয় ধাপটা চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the তালগাছ is three
//      people on each other's shoulders. ফাহিম, সামিন and সোম climb into one
//      499 cm tower, it is cut into three equal pieces, and each piece steps
//      down as a 166.3 cm person: the average height. Heights only; the
//      weights go the same way.

const TG_S = 0.33; // px per cm
const TG_GROUND = 176;
const TG_SPOT = [40, 88, 136];
const TG_TOWER = 200;
const TG_H = KIDS.map((kid) => kid.v[0] * TG_S);
/** how high each kid's feet sit in the tower, px above the ground */
const TG_FEET = TG_H.map((_, i) => TG_H.slice(0, i).reduce((a, b) => a + b, 0));
const TG_AVG_H = MID[0] * TG_S;
const TG_TOP = TG_GROUND - SUM[0] * TG_S;
const TG_MOVE = "transition-[transform,opacity] duration-700 ease-in-out motion-reduce:transition-none";

/** a pill-shaped person with the feet at (0, 0) */
function Person({ h, className }: { h: number; className: string }) {
  const r = 7;
  return (
    <>
      <circle cy={-h + r} r={r} strokeWidth={1.5} className={className} />
      <rect x={-8} y={-h + 2 * r + 1.5} width={16} height={h - 2 * r - 1.5} rx={5} strokeWidth={1.5} className={className} />
    </>
  );
}

export function TalGach() {
  const s = useScene(4, [700, 1500, 1300, 1400]);
  const k = s.k;
  const say = [
    "ফাহিম, সামিন আর সোম পাশাপাশি দাঁড়িয়ে।",
    "যোগ মানে একজনের ঘাড়ে আরেকজন চড়ে বসা।",
    "মোট 499 cm, এই সেই তালগাছ।",
    "এবার তালগাছটাকে তিনটা সমান টুকরা করি।",
  ];

  return (
    <Scene
      scene={s}
      caption={k < 4 ? say[k] : <span className={FADE}>প্রতিটা টুকরা 166.3 cm, ঠিক তিনজনের average উচ্চতা। ওজনের হিসাবও হুবহু এভাবেই হয়।</span>}
    >
      <svg viewBox="0 0 280 194" role="img" aria-label="three students climb into a 499 cm tower, which is cut into three 166.3 cm pieces" className="mx-auto block w-full max-w-[16rem]">
        <rect x={0.5} y={0.5} width={279} height={193} rx={8} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        <path d={`M12 ${TG_GROUND}H268`} strokeWidth={1.2} className="stroke-[#0f1b2d]/40" />

        {/* the three of them, standing, then climbing into one tower */}
        {KIDS.map((kid, i) => {
          const [x, y] = k >= 1 ? [TG_TOWER, TG_GROUND - TG_FEET[i]] : [TG_SPOT[i], TG_GROUND];
          return (
            <g key={kid.n} style={{ transform: `translate(${x}px, ${y}px)`, transitionDelay: k === 1 ? `${i * 250}ms` : "0ms" }} className={TG_MOVE} opacity={k >= 3 ? 0.25 : 1}>
              <Person h={TG_H[i]} className="fill-cat-amber stroke-[#92400e]" />
              {k === 0 && (
                <>
                  <text y={13} textAnchor="middle" fontSize={9.5} fontWeight={600} className="fill-[#0f1b2d]">
                    {kid.n}
                  </text>
                  <text y={-TG_H[i] - 5} textAnchor="middle" fontSize={9.5} fontWeight={700} className="fill-[#92400e] font-mono">
                    {kid.v[0]}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* who is where in the tower, and the tower's full height */}
        {k >= 1 && k < 3 &&
          KIDS.map((kid, i) => (
            <text key={kid.n} x={TG_TOWER + 14} y={TG_GROUND - TG_FEET[i] - TG_H[i] / 2 + 3} fontSize={9.5} fontWeight={600} className={`${FADE} delay-700 fill-[#0f1b2d]`}>
              {kid.n} <tspan className="fill-[#92400e] font-mono">{kid.v[0]}</tspan>
            </text>
          ))}
        {k >= 2 && (
          <g className={FADE} opacity={k >= 4 ? 0.3 : 1}>
            <path d={`M${TG_TOWER - 16} ${TG_TOP}V${TG_GROUND}M${TG_TOWER - 19} ${TG_TOP}h6M${TG_TOWER - 19} ${TG_GROUND}h6`} strokeWidth={1.4} className="fill-none stroke-cat-teal" />
            <text x={TG_TOWER - 22} y={(TG_TOP + TG_GROUND) / 2} textAnchor="end" fontSize={10.5} fontWeight={800} className="fill-cat-teal font-mono">
              499 cm
            </text>
          </g>
        )}

        {/* two cuts, three equal pieces */}
        {k >= 3 && (
          <g className={FADE} opacity={k >= 4 ? 0.3 : 1}>
            {[1, 2].map((c) => (
              <path key={c} d={`M${TG_TOWER - 14} ${TG_GROUND - c * TG_AVG_H}H${TG_TOWER + 14}`} strokeWidth={1.6} strokeDasharray="4 3" className="stroke-cat-coral" />
            ))}
            <text x={TG_TOWER - 22} y={(TG_TOP + TG_GROUND) / 2 + 15} textAnchor="end" fontSize={10.5} fontWeight={800} className="fill-cat-coral font-mono">
              ÷ 3
            </text>
          </g>
        )}
        {k >= 3 &&
          KIDS.map((kid, i) => {
            const [x, y] = k >= 4 ? [TG_SPOT[i], TG_GROUND] : [TG_TOWER, TG_GROUND - i * TG_AVG_H];
            return (
              <g key={kid.n} style={{ transform: `translate(${x}px, ${y}px)`, transitionDelay: `${i * 200}ms` }} className={TG_MOVE}>
                <g className={FADE}>
                  <Person h={TG_AVG_H} className="fill-cat-violet/80 stroke-cat-violet" />
                </g>
                {k >= 4 && (
                  <text y={-TG_AVG_H - 5} textAnchor="middle" fontSize={9.5} fontWeight={700} className={`${FADE} delay-700 fill-cat-violet font-mono`}>
                    166.3
                  </text>
                )}
              </g>
            );
          })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation, no task: centroids out in the
//      world. A shop's customers are a cloud of dots, and their balance point
//      is the "average customer"; a cloud of spam emails balances on the
//      "typical spam". Each is the same add-all-then-1/n.

const X3_F = makeFrame(0, 10, 0, 6, 17, 8);
const X3_GROUPS: { name: string; dots: XY[]; dot: string; line: string; labelY: number }[] = [
  {
    name: "“average customer”",
    dots: [[2, 4.6], [2.6, 3.4], [3.4, 4.8], [3.9, 3.8], [2.2, 3.9], [3.1, 4.3], [3.7, 3.1]],
    dot: "fill-cat-teal",
    line: "stroke-cat-teal/60",
    labelY: 5.25,
  },
  {
    name: "“typical spam”",
    dots: [[6.6, 2.4], [7.2, 1.3], [8.3, 2.6], [7.9, 1.6], [8.6, 1.9], [7, 2.9]],
    dot: "fill-cat-coral",
    line: "stroke-cat-coral/60",
    labelY: 0.45,
  },
];
const x3Mid = (ps: XY[]) => times(1 / ps.length, ps.reduce<XY>((a, p) => add(a, p), [0, 0]));
const X3_SAY = [
  "একটা online দোকানের customer-রা, প্রত্যেকে একটা vector।",
  "একটা online দোকানের customer-রা, প্রত্যেকে একটা vector।",
  "সবাইকে যোগ, তারপর 1/n দিয়ে stretch: “average customer”।",
  "এবার একগাদা spam email, এরাও একেকটা vector।",
];

export function CentroidGroups() {
  const s = useScene(4, [600, 1400, 1600, 1400]);
  const k = s.k;
  const f = X3_F;

  return (
    <Scene scene={s} caption={k < 4 ? X3_SAY[k] : <span className={FADE}>এদের centroid হলো “typical spam”। দুই জায়গাতেই সেই একই হিসাব।</span>}>
      <Plane f={f} grid={1} axes={false} label="a cloud of customers and a cloud of spam emails, each with its centroid marked" className="my-0! max-w-[13rem]">
        {X3_GROUPS.map((g, j) => {
          const first = 1 + 2 * j;
          if (k < first) return null;
          const c = x3Mid(g.dots);
          return (
            <g key={g.name}>
              {k >= first + 1 &&
                g.dots.map((d, i) => (
                  <path key={`l${i}`} d={`M${f.sx(d[0])} ${f.sy(d[1])}L${f.sx(c[0])} ${f.sy(c[1])}`} strokeWidth={1} strokeDasharray="2 3" className={`${FADE} fill-none ${g.line}`} />
                ))}
              {g.dots.map((d, i) => (
                <circle key={i} cx={f.sx(d[0])} cy={f.sy(d[1])} r={4} style={{ transitionDelay: `${i * 90}ms` }} className={`${POP} ${g.dot}`} />
              ))}
              {k >= first + 1 && (
                <>
                  <path d={`M${f.sx(c[0])} ${f.sy(c[1]) - 1}l-6 10.5h12Z`} style={{ transitionDelay: "400ms" }} className={`${POP} fill-cat-violet`} />
                  <Label f={f} at={[c[0], g.labelY]} size={9.5} weight={700} className={`${FADE} fill-cat-violet`}>
                    {g.name}
                  </Label>
                </>
              )}
            </g>
          );
        })}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: the comment box. Two
//      passers-by (করিম and রিনা's looks, unnamed) drop their slips in; ফাহিম
//      brings Shiku to sort them into Happy and Unhappy, and Shiku, who reads
//      only numbers, is stuck at the first Bangla word.

const S4_Y = 150;
const S4_SLOT: XY = [117, 116];
const S4_AT = { karim: 86, rina: 150, fahim: 214, shiku: 272 };

/** a paper slip that rides at `at` and, once `into`, drops through the box's slot */
function S4Slip({ at, into, tilt }: { at: XY; into: boolean; tilt: number }) {
  const [x, y] = into ? S4_SLOT : at;
  return (
    <g
      style={{ transform: `translate(${x}px, ${y}px)`, opacity: into ? 0 : 1, transitionDuration: "1200ms" }}
      className="pointer-events-none transition-[transform,opacity] ease-in-out motion-reduce:transition-none"
    >
      <g transform={`rotate(${tilt})`}>
        <rect x={-7} y={-5} width={14} height={10} rx={1} fill="#fef9c3" stroke="#d6c77a" />
        <path d="M-4.5 -1.5h9M-4.5 1.5h6" stroke="#a8a29e" strokeWidth={0.8} />
      </g>
    </g>
  );
}

export function CommentDrop({}: Story) {
  const s = useScene(5, [600, 1600, 1400, 1600, 2600]);
  const k = s.k;
  const kx = k >= 1 ? S4_AT.karim : -30;
  const rx = k >= 1 ? S4_AT.rina : 360;
  const fx = k >= 3 ? S4_AT.fahim : 370;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="করিম and রিনা drop comment slips into the box by the stall; ফাহিম asks Shiku to sort them into Happy and Unhappy, and Shiku cannot read the words">
        <Stall x={46} y={S4_Y} sign="শরবত" color="#f97316" w={64} />
        {/* the comment box on its post */}
        <rect x={115} y={134} width={4} height={16} fill="#78350f" />
        <rect x={101} y={113} width={32} height={22} rx={2} fill="#a16207" stroke="#78350f" />
        <path d={`M${S4_SLOT[0] - 8} ${S4_SLOT[1]}h16`} stroke="#1c1917" strokeWidth={2} strokeLinecap="round" />
        <text x={117} y={129} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#fef3c7">
          Comment
        </text>
        <CastPerson who="karim" x={kx} y={S4_Y} walking={k === 1} arm={k === 1 ? "hold" : "down"} mood={k >= 2 ? "happy" : "plain"} />
        <S4Slip at={[kx + 17, S4_Y - 43]} into={k >= 2} tilt={-8} />
        <CastPerson who="rina" x={rx} y={S4_Y} facing={-1} walking={k === 1} arm={k === 1 ? "hold" : "down"} />
        <S4Slip at={[rx - 17, S4_Y - 43]} into={k >= 2} tilt={10} />
        <CastPerson who="fahim" x={fx} y={S4_Y} facing={-1} walking={k === 3} arm={k === 4 ? "point" : "down"} label={k >= 3} />
        <Robot x={k >= 3 ? S4_AT.shiku : 400} y={S4_Y} walking={k === 3} />
        {k >= 3 && (
          <text x={S4_AT.shiku} y={S4_Y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#0f1b2d" className={FADE}>
            Shiku
          </text>
        )}
        {k === 4 && <Bubble x={S4_AT.fahim} y={S4_Y - 66} lines={["Shiku, এগুলো ভাগ কর:", "Happy আর Unhappy!"]} />}
        {k >= 5 && <Bubble x={S4_AT.shiku} y={S4_Y - 46} tone="think" lines={["“দারুণ” = ???"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · The comment box. Every word is two numbers, so a point on graph paper
//     (happy words happen to sit right, sad ones left; the other slot has no
//     name, like 2.3's embeddings). A slip lands on the average of its words,
//     shown with each word's numbers, which sorts it. Then two slips with
//     opposite meanings and the same three words land on the same dot.

const WORDS: Record<string, XY> = {
  শরবত: [1, -3],
  দারুণ: [3, -1],
  মজা: [2, 1],
  দৌড়: [0, 2],
  খেলা: [0, 3],
  সিঙ্গারা: [0, -3],
  ঠান্ডা: [-2, -1],
  বিরক্ত: [-3, 0],
  ক্রিকেট: [0, 3],
  হারলাম: [-2, 2],
  খারাপ: [-3, 0],
  ভালো: [3, 0],
  না: [-1, 0],
};
const SLIPS: { text: string; words: string[] }[] = [
  { text: "শরবত দারুণ মজা", words: ["শরবত", "দারুণ", "মজা"] },
  { text: "সিঙ্গারা ঠান্ডা, বিরক্ত", words: ["সিঙ্গারা", "ঠান্ডা", "বিরক্ত"] },
  { text: "দৌড় খেলা দারুণ", words: ["দৌড়", "খেলা", "দারুণ"] },
  { text: "ক্রিকেট হারলাম, খারাপ", words: ["ক্রিকেট", "হারলাম", "খারাপ"] },
];
const TWINS = [
  { text: "ভালো না, খারাপ", words: ["ভালো", "না", "খারাপ"] },
  { text: "খারাপ না, ভালো", words: ["খারাপ", "না", "ভালো"] },
];
const meanOf = (words: string[]) => times(1 / words.length, words.reduce<XY>((s, w) => add(s, WORDS[w]), [0, 0]));
const TWIN_GUESS = ["দুই দিকে, একটা মন ভালোর দিকে আর একটা মন খারাপের দিকে", "ঠিক একই জায়গায়", "কাছাকাছি, কিন্তু একটু আলাদা"];
const FR = makeFrame(-3.5, 3.5, -3.5, 3.5, 30, 20);

function WordMap({ words, sorted, twin }: { words: string[]; sorted: number; twin: boolean }) {
  const m = meanOf(words);
  return (
    <Plane f={FR} grid={1} ticks={0} label={`word map; ${words.length ? `the words ${words.join(", ")} and their average ${tup1(m)}` : "empty"}`} className="max-w-[16rem]">
        <Label f={FR} at={[-3.5, 3.5]} dy={-7} anchor="start" size={9} weight={500} className="fill-[#5a6b7d]">
          ← মন খারাপ
        </Label>
        <Label f={FR} at={[3.5, 3.5]} dy={-7} anchor="end" size={9} weight={500} className="fill-[#5a6b7d]">
          মন ভালো →
        </Label>
        {SLIPS.slice(0, sorted).map((s) => {
          const p = meanOf(s.words);
          return <Dot key={s.text} f={FR} at={p} r={4} className={p[0] > 0 ? "fill-cat-teal/45" : "fill-cat-coral/45"} />;
        })}
        {words.length > 0 && (
          <g key={words.join()}>
            {words.map((w) => {
              const p = WORDS[w];
              return (
                <g key={w}>
                  <path d={`M${FR.sx(p[0])} ${FR.sy(p[1])}L${FR.sx(m[0])} ${FR.sy(m[1])}`} strokeWidth={1.2} strokeDasharray="3 3" className={`${FADE} pointer-events-none fill-none stroke-cat-violet/50`} />
                  <Dot f={FR} at={p} r={4} className="fill-cat-blue" pop />
                  <Label f={FR} at={p} dx={p[0] >= 2 ? -6 : p[0] <= -2 ? 6 : 0} dy={p[1] >= 3 ? 14 : -8} anchor={p[0] >= 2 ? "end" : p[0] <= -2 ? "start" : "middle"} size={10} className="fill-cat-blue">
                    {w}
                  </Label>
                </g>
              );
            })}
            <circle cx={FR.sx(m[0])} cy={FR.sy(m[1])} r={twin ? 8 : 6.5} strokeWidth={2} className={`${POP} pointer-events-none fill-cat-violet stroke-white`} />
          </g>
        )}
    </Plane>
  );
}

function Slip({ text, faint = false }: { text: string; faint?: boolean }) {
  return (
    <span className={`inline-block -rotate-1 rounded-md border border-[#e5d9a8] bg-[#fef9c3] px-3 py-1.5 text-[0.95rem] text-[#3f3a1d] shadow-sm ${faint ? "opacity-60" : ""}`}>
      “{text}”
    </span>
  );
}

export function ReviewBox() {
  const pass = useGate();
  const [sorted, setSorted] = useSeed("sorted", 0);
  const [dropped, setDropped] = useSeed("dropped", false);
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [twin, setTwin] = useSeed("twin", false);
  const [miss, setMiss] = useState(0);
  const sorting = sorted < SLIPS.length;
  const slip = SLIPS[sorted];
  const shown = sorting ? (dropped ? slip.words : []) : twin ? TWINS[0].words : [];
  const m = sorting ? meanOf(slip.words) : meanOf(TWINS[0].words);

  const call = (happy: boolean) => {
    if (happy !== m[0] > 0) {
      setMiss(miss + 1);
      return;
    }
    setMiss(0);
    setDropped(false);
    setSorted(sorted + 1);
  };
  const dropTwins = () => {
    setTwin(true);
    pass("প্রতিটা বাক্য গিয়ে বসে তার শব্দগুলোর average-এ। কৌশলটা সহজ, কাজও করে, কিন্তু কোন শব্দ আগে ছিল সেই order-টা হারিয়ে যায়।");
  };

  return (
    <>
      <WordMap words={shown} sorted={sorted} twin={twin} />
      {sorting ? (
        <div key={sorted} className={`${FADE} text-center`}>
          <div className="text-xs font-semibold text-muted">
            মন্তব্য {bn(sorted + 1)}/{bn(SLIPS.length)}
          </div>
          <div className="mt-1">
            <Slip text={slip.text} />
          </div>
          {!dropped ? (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={() => setDropped(true)} className={`${primaryBtn} bg-cat-violet`}>
                বাক্সে ফেলুন
              </button>
            </div>
          ) : (
            <>
              <div className={`${FADE} mt-2 flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-sm text-cat-blue`}>
                {slip.words.map((w) => (
                  <span key={w} className="whitespace-nowrap">
                    {w} <span className="font-mono">{tup1(WORDS[w])}</span>
                  </span>
                ))}
              </div>
              <div className={`${FADE} mt-1 text-[0.95rem]`}>
                এই তিনটার average-এ বসলো বেগুনি dot, <span className="font-mono">{tup1(m)}</span>। Shiku এটাকে কোন দলে রাখবে?
              </div>
              <div className="mt-2 flex justify-center gap-2">
                <button type="button" onClick={() => call(true)} className={quietBtn}>
                  😊 খুশি
                </button>
                <button type="button" onClick={() => call(false)} className={quietBtn}>
                  😞 বেজার
                </button>
              </div>
              {miss > 0 && <Nope key={miss}>উঁহু, বেগুনি dot-টা map-এর কোন পাশে বসেছে, আরেকবার দেখুন তো।</Nope>}
            </>
          )}
        </div>
      ) : (
        <div className={`${FADE} text-center`}>
          <div className="flex flex-wrap justify-center gap-2">
            {TWINS.map((t) => (
              <Slip key={t.text} text={t.text} />
            ))}
          </div>
          <div className="mt-3 text-left text-sm font-medium text-muted">শেষ দুইটা মন্তব্যের মানে কিন্তু একদম উল্টো। বলুন তো, এদের dot কোথায় বসবে?</div>
          <div className="mt-2 grid gap-2 text-left">
            {TWIN_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, twin, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
          {guess !== null && !twin && (
            <div className={`${FADE} mt-3 flex justify-center`}>
              <button type="button" onClick={dropTwins} className={`${primaryBtn} bg-cat-violet`}>
                দুইটাই বাক্সে ফেলুন
              </button>
            </div>
          )}
          {twin && (
            <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-violet/5 px-4 py-3 text-[0.95rem]`}>
              দুইটা মন্তব্যই গিয়ে বসলো ঠিক <span className="font-mono">{tup1(m)}</span>-এ, একই dot-এ! শব্দ তো সেই একই তিনটা, শুধু order আলাদা।
            </div>
          )}
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {[true, false].map((happy) => (
          <div key={String(happy)} className={`min-h-16 rounded-xl border-2 border-dashed px-2 py-1.5 ${happy ? "border-cat-teal/40" : "border-cat-coral/40"}`}>
            <div className="text-center font-semibold">{happy ? "😊 খুশি" : "😞 বেজার"}</div>
            {SLIPS.slice(0, sorted)
              .filter((s) => meanOf(s.words)[0] > 0 === happy)
              .map((s) => (
                <div key={s.text} className={`${FADE} text-center text-xs text-muted`}>
                  “{s.text}”
                </div>
              ))}
          </div>
        ))}
      </div>
      <Task done={twin}>
        একটা একটা করে মন্তব্য বাক্সে ফেলুন, আর ঠিক দলে রাখুন ({bn(sorted)}/{bn(SLIPS.length)})। তারপর শেষ দুইটার পালা।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: why the two opposite
//      slips land on one dot. Their words are joined tip to tail like the
//      treasure-hunt cards, once in each order (all three have 0 in the second
//      slot, so one line is enough), and both walks stop at −1: addition keeps
//      no memory of order, so the average cannot either.

const FOL = makeFrame(-4, 4, 0, 5.2, 30, 14);
/** a lane per slip: its title row, then one row per word going down */
const OL_LANES = TWINS.map((t, j) => ({ ...t, top: 5 - 2.4 * j }));
const olRow = (top: number, i: number) => top - 0.55 * (i + 1);
const OL_AXIS = 0.35;

export function OrderLost() {
  const s = useScene(3, [600, 2000, 2000]);
  const k = s.k;
  const end = OL_LANES[0].words.reduce((x, w) => x + WORDS[w][0], 0);

  return (
    <Scene
      scene={s}
      caption={
        k < 2 ? (
          "“ভালো না, খারাপ”: শব্দের card-গুলো একটার পর একটা জোড়া লাগছে।"
        ) : k < 3 ? (
          "এবার উল্টো order-এ, “খারাপ না, ভালো”।"
        ) : (
          <span className={FADE}>দুই order-ই থামলো −1-এ। যোগ order মনে রাখে না, তাই average-ও হুবহু এক।</span>
        )
      }
    >
      <Plane f={FOL} grid={0} axes={false} label="the words of both slips joined tip to tail in their own order; both stop at −1" className="max-w-[17rem] my-0!">
        {/* the number line under both lanes */}
        <path d={`M${FOL.sx(-4)} ${FOL.sy(OL_AXIS)}H${FOL.sx(4)}`} strokeWidth={1.2} className="stroke-[#0f1b2d]/50" />
        {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
          <g key={x}>
            <path d={`M${FOL.sx(x)} ${FOL.sy(OL_AXIS) - 3}v6`} strokeWidth={1} className="stroke-[#0f1b2d]/50" />
            <Label f={FOL} at={[x, OL_AXIS]} dy={14} size={8.5} weight={400} className="fill-[#5a6b7d] font-mono">
              {sg(x)}
            </Label>
          </g>
        ))}
        {OL_LANES.map((lane, j) => {
          let x = 0;
          const steps = lane.words.map((w) => {
            const from = x;
            x += WORDS[w][0];
            return { w, from, to: x };
          });
          return (
            <g key={lane.text}>
              {/* the title sits on the side its walk leaves free */}
              <Label f={FOL} at={[j ? 4 : -4, lane.top]} dx={j ? -6 : 6} dy={3} anchor={j ? "end" : "start"} size={10} className="fill-[#0f1b2d]">
                “{lane.text}”
              </Label>
              <path d={`M${FOL.sx(0)} ${FOL.sy(lane.top - 0.3)}V${FOL.sy(olRow(lane.top, 2))}`} strokeWidth={1} strokeDasharray="2 3" className="stroke-[#0f1b2d]/30" />
              {k >= j + 1 &&
                steps.map((st, i) => (
                  <g key={st.w}>
                    {i > 0 && (
                      <path
                        d={`M${FOL.sx(st.from)} ${FOL.sy(olRow(lane.top, i - 1))}V${FOL.sy(olRow(lane.top, i))}`}
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        style={{ transitionDelay: `${i * 550}ms` }}
                        className={`${FADE} stroke-[#0f1b2d]/40`}
                      />
                    )}
                    <Arrow f={FOL} from={[st.from, olRow(lane.top, i)]} to={[st.to, olRow(lane.top, i)]} tone={WORDS[st.w][0] > 0 ? "teal" : "coral"} w={2.4} draw delay={i * 550} />
                    <Label
                      f={FOL}
                      at={[(st.from + st.to) / 2, olRow(lane.top, i)]}
                      dy={-5}
                      size={9.5}
                      className={`${FADE} ${WORDS[st.w][0] > 0 ? "fill-cat-teal" : "fill-cat-coral"}`}
                    >
                      {st.w} {sg(WORDS[st.w][0])}
                    </Label>
                  </g>
                ))}
            </g>
          );
        })}
        {/* both walks end on the same spot */}
        {k >= 3 && (
          <g className={FADE}>
            <path d={`M${FOL.sx(end)} ${FOL.sy(olRow(OL_LANES[0].top, 2))}V${FOL.sy(OL_AXIS)}`} strokeWidth={1.6} strokeDasharray="4 3" className="stroke-cat-violet" />
            <Dot f={FOL} at={[end, OL_AXIS]} r={6} className="fill-cat-violet" pop />
            {OL_LANES.map((lane) => (
              <Dot key={lane.text} f={FOL} at={[end, olRow(lane.top, 2)]} r={4} className="fill-cat-violet" pop />
            ))}
          </g>
        )}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's explanation, no task: the same machine twice.
//      The poster's three people and the comment's three words go through
//      one recipe, add all then × ⅓, side by side: only the members changed.

const X4_TEAMS = [
  { title: "Poster-এর দল", rows: KIDS.map((kid) => [kid.n, tup(kid.v)]), out: tup1(MID) },
  { title: "Comment-এর দল", rows: SLIPS[0].words.map((w) => [w, tup(WORDS[w])]), out: tup1(meanOf(SLIPS[0].words)) },
];
const X4_SAY = [
  "Poster-এ ছিল তিনজন মানুষের একটা দল।",
  "Poster-এ ছিল তিনজন মানুষের একটা দল।",
  "যোগ, তারপর ⅓ দিয়ে stretch: দলের হয়ে একটা point।",
  "Comment-এ তিনটা শব্দের একটা দল।",
];

export function SameRecipe() {
  const s = useScene(4, [600, 1400, 1600, 1400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 4 ? X4_SAY[k] : <span className={FADE}>হুবহু একই দুই চাল, শুধু মানুষের বদলে শব্দ।</span>}>
      <div className="mx-auto grid max-w-[18rem] grid-cols-2 gap-2">
        {X4_TEAMS.map((t, j) => {
          const first = 1 + 2 * j;
          return (
            <div
              key={t.title}
              className={`rounded-xl border border-border px-2 py-1.5 transition-opacity duration-500 motion-reduce:transition-none ${k >= first ? "opacity-100" : "opacity-40"}`}
            >
              <div className="text-center text-xs font-semibold text-muted">{t.title}</div>
              {t.rows.map(([name, v], i) => (
                <div key={name} className="h-6">
                  {k >= first && (
                    <div style={{ transitionDelay: `${i * 200}ms` }} className={`${POP} flex items-baseline justify-between gap-1 text-sm`}>
                      <span>{name}</span>
                      <span className="font-mono text-xs">{v}</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="h-5 text-center text-xs text-muted">{k >= first + 1 && <span className={FADE}>যোগ, তারপর × ⅓</span>}</div>
              <div className="h-6 text-center">
                {k >= first + 1 && (
                  <b style={{ transitionDelay: "400ms" }} className={`${POP} inline-block font-mono text-cat-violet`}>
                    {t.out}
                  </b>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4⅞ · A figure for screen 4's explanation, no task: a tug of war on the
//      first slot. Each word pulls the slip's dot toward its own spot on the
//      line, right for মন ভালো and left for মন খারাপ; the dot settles on the
//      average, and its sign sorts the slip. A happy slip, then a sad one.

const x4x = (x: number) => 150 + x * 38;
const x4Ink = (x: number) => (x > 0 ? "#0d9488" : x < 0 ? "#e11d48" : "#64748b");
const X4_LANES = [
  { slip: SLIPS[0], y: 58, first: 1, tx: 14, anchor: "start" as const },
  { slip: SLIPS[3], y: 120, first: 3, tx: 286, anchor: "end" as const },
];
const X4_TUG = [
  "শুধু প্রথম ঘরটা দেখি। ডানে মন ভালো, বামে মন খারাপ।",
  "শরবত প্রায় মাঝামাঝি, দারুণ আর মজা টানছে ডানে।",
  "Average-এর প্রথম সংখ্যা 2, plus। তাই happy।",
  "এবার “ক্রিকেট হারলাম, খারাপ”। টান এবার বামে।",
];

export function WordTug() {
  const s = useScene(4, [600, 1700, 1700, 1700]);
  const k = s.k;
  const avg = X4_LANES.map((l) => meanOf(l.slip.words)[0]);
  const at = useTween(
    X4_LANES.map((l, j) => (k >= l.first + 1 ? avg[j] : 0)),
    1000,
  );

  return (
    <Scene scene={s} caption={k < 4 ? X4_TUG[k] : <span className={FADE}>প্রথম সংখ্যা −1.7, minus, তাই unhappy। Shiku শুধু চিহ্নটা দেখে।</span>}>
      <svg viewBox="0 0 300 140" role="img" aria-label="each word pulls the slip's dot along the first slot; শরবত দারুণ মজা settles at 2, ক্রিকেট হারলাম খারাপ at −1.7" className="mx-auto block w-full max-w-[17rem]">
        <rect x={0.5} y={0.5} width={299} height={139} rx={8} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        <path d="M150 18V134" strokeWidth={1} strokeDasharray="3 3" className="stroke-[#0f1b2d]/30" />
        <text x={144} y={13} textAnchor="end" fontSize={9} fill="#5a6b7d">
          ← মন খারাপ
        </text>
        <text x={156} y={13} fontSize={9} fill="#5a6b7d">
          মন ভালো →
        </text>
        {X4_LANES.map((l, j) => {
          const cx = x4x(at[j]);
          const on = k >= l.first;
          return (
            <g key={l.slip.text}>
              <path d={`M14 ${l.y}H286`} strokeWidth={1.2} className="stroke-[#0f1b2d]/25" />
              <text x={l.tx} y={l.y - 30} textAnchor={l.anchor} fontSize={9.5} fontWeight={600} fill="#0f1b2d">
                “{l.slip.text}”
              </text>
              {on &&
                l.slip.words.map((w, i) => {
                  const x = x4x(WORDS[w][0]);
                  return (
                    <g key={w}>
                      <path d={`M${x} ${l.y - 12}L${cx} ${l.y}`} strokeWidth={1} className="stroke-[#7c3aed]/40" />
                      <g style={{ transitionDelay: `${i * 200}ms` }} className={POP}>
                        <circle cx={x} cy={l.y - 12} r={3.5} fill={x4Ink(WORDS[w][0])} />
                        <text x={x} y={l.y - 19} textAnchor="middle" fontSize={9} fontWeight={600} fill={x4Ink(WORDS[w][0])}>
                          {w}
                        </text>
                      </g>
                    </g>
                  );
                })}
              {on && <circle cx={cx} cy={l.y} r={5.5} fill="#7c3aed" stroke="white" strokeWidth={1.5} className={POP} />}
              {k >= l.first + 1 && (
                <text
                  x={x4x(avg[j])}
                  y={l.y + 14}
                  textAnchor="middle"
                  fontSize={9.5}
                  fontWeight={800}
                  fill={x4Ink(avg[j])}
                  style={{ transitionDelay: "900ms" }}
                  className={`${FADE} font-mono`}
                >
                  {r1(avg[j])}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: the snack table. আম্মুর
//      ডিম, রুটি আর কলা go into a tiffin box, ফাহিম holds up its label
//      (265, 10, 15), and ডাক্তার আপা walks up wanting a box of her own, on a
//      condition she keeps for the widget.

const S5_Y = 150;
const S5_AT = { fahim: 158, apa: 250 };

/** the tiffin box on the counter, bottom-centre at (x, y), filling with an egg, a roti and a banana */
function S5Tiffin({ x, y, full }: { x: number; y: number; full: boolean }) {
  return (
    <g className="pointer-events-none">
      {full && (
        <>
          <ellipse cx={x - 12} cy={y - 14} rx={5} ry={6.5} fill="white" stroke="#a8a29e" className={POP} />
          <ellipse cx={x} cy={y - 12} rx={8} ry={4} fill="#d6a760" stroke="#92400e" strokeWidth={0.8} className={POP} style={{ transitionDelay: "250ms" }} />
          <path
            d={`M${x + 7} ${y - 20}q8 8 17 1q-8 3 -17 -1Z`}
            fill="#facc15"
            stroke="#a16207"
            strokeWidth={0.8}
            className={POP}
            style={{ transitionDelay: "500ms" }}
          />
        </>
      )}
      <rect x={x - 22} y={y - 12} width={44} height={12} rx={3} fill="#cbd5e1" stroke="#64748b" />
      <path d={`M${x - 22} ${y - 7}h44`} stroke="#94a3b8" strokeWidth={0.8} />
    </g>
  );
}

export function ApaArrives({}: Story) {
  const s = useScene(4, [600, 1600, 1800, 1600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="আম্মুর egg, roti and banana go into a combo box at the snack table; ফাহিম holds up its label (265, 10, 15), and ডাক্তার আপা walks up asking for a box on one condition">
        <Stall x={76} y={S5_Y} sign="Combo box" color="#16a34a" w={96} />
        <S5Tiffin x={76} y={S5_Y - 24} full={k >= 1} />
        <CastPerson who="fahim" x={S5_AT.fahim} y={S5_Y} arm={k >= 2 ? "hold" : "down"} mood={k >= 4 ? "happy" : "plain"} label />
        {k >= 2 && <CastCard x={S5_AT.fahim} y={S5_Y - 76} text="(265, 10, 15)" tone="teal" />}
        <CastPerson who="apa" x={k >= 3 ? S5_AT.apa : 370} y={S5_Y} facing={-1} walking={k === 3} label={k >= 3} />
        {k >= 4 && <Bubble x={S5_AT.apa} y={S5_Y - 66} lines={["একটা box দাও,", "তবে শর্ত আছে!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · ডাক্তার আপা's combo box must read (345, 16, 15). Steppers for each food
//     and a live label; the reader hunts until it matches 2 eggs, 1 roti,
//     1 banana: some of each, added up.

const FOODS: { name: string; icon: string; v: number[] }[] = [
  { name: "ডিম", icon: "🥚", v: [80, 6, 0] },
  { name: "রুটি", icon: "🫓", v: [80, 3, 1] },
  { name: "কলা", icon: "🍌", v: [105, 1, 14] },
];
const NUTRI = ["ক্যালরি", "প্রোটিন (g)", "চিনি (g)"];
const ORDER = [345, 16, 15];
const labelOf = (n: number[]) => NUTRI.map((_, s) => FOODS.reduce((t, f, i) => t + n[i] * f.v[s], 0));

export function ComboBox() {
  const pass = useGate();
  const [n, setN] = useSeed("n", [1, 1, 1]);
  const total = labelOf(n);
  const match = total.every((t, s) => t === ORDER[s]);

  const change = (i: number, v: number) => {
    const next = n.map((x, j) => (j === i ? v : x));
    setN(next);
    if (labelOf(next).every((t, s) => t === ORDER[s]) && !match) pass("২টা ডিম, ১টা রুটি আর ১টা কলা। প্রতিটা খাবারের card-কে কিছুটা করে stretch করে সব যোগ করলেই আপার label।");
  };

  return (
    <>
      <Speech who="ডাক্তার আপা" initial="ডা" tint="teal">
        আমার box-এর label-এ যেন ঠিক (345, 16, 15) লেখা থাকে। কোন খাবার কয়টা দেবে, তোমরাই বের করো।
      </Speech>
      <div className="mx-auto mt-4 grid max-w-sm gap-2">
        {FOODS.map((f, i) => (
          <div key={f.name} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-1.5">
            <span className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">
                {f.icon}
              </span>
              <span>
                <span className="block font-semibold">{f.name}</span>
                <span className="block font-mono text-xs text-muted">{tup(f.v)}</span>
              </span>
            </span>
            <Stepper value={n[i]} min={0} max={4} label={f.name} disabled={match} onChange={(v) => change(i, v)} />
          </div>
        ))}
      </div>
      <div className="mx-auto mt-4 max-w-sm rounded-2xl border-2 border-foreground/70 px-4 py-3">
        <div className="flex items-baseline justify-between gap-2 border-b-4 border-foreground/70 pb-1">
          <span className="text-lg font-black">box-এর label</span>
          <span className="text-xs text-muted">আপা চান</span>
        </div>
        {NUTRI.map((name, s) => {
          const d = total[s] - ORDER[s];
          return (
            <div key={name} className="flex items-baseline justify-between gap-3 border-b border-border py-1.5 last:border-0">
              <span className="font-medium">{name}</span>
              <span className="flex items-baseline gap-3 font-mono tabular-nums">
                <b key={total[s]} className={`${POP} inline-block ${d === 0 ? "text-accent-text" : ""}`}>
                  {total[s]}
                </b>
                <span className="w-24 text-right text-sm text-muted">
                  {ORDER[s]} <span className="font-sans">{d === 0 ? "✓" : d < 0 ? "(কম)" : "(বেশি)"}</span>
                </span>
              </span>
            </div>
          );
        })}
      </div>
      {match && (
        <div className={`${FADE} mt-3 text-center font-mono text-[0.95rem] leading-relaxed`}>
          {FOODS.map((f, i) => (
            <span key={f.name}>
              {i > 0 && " + "}
              <b className="text-cat-amber">{n[i]}</b>·{tup(f.v)}
            </span>
          ))}{" "}
          = <b className="text-cat-teal">{tup(ORDER)}</b>
        </div>
      )}
      <Task done={match}>কোন খাবার কয়টা দেবেন, কম-বেশি করে দেখুন। Label-টা আপার চাওয়ার সাথে মিলে গেলেই হবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: আপার box filled one food
//      at a time, and the label's three bars filling with it, each bar split
//      by which food gave what. The sugar bar is the clue: 14 of its 15 grams
//      are the one banana.

/** the foods in the order they go into the box: egg, egg, roti, banana */
const TF_DROPS = [0, 0, 1, 2];
const TF_TONE = [
  { chip: "border-cat-amber/50 bg-cat-amber/15 text-cat-amber", bar: "bg-cat-amber" },
  { chip: "border-cat-coral/50 bg-cat-coral/15 text-cat-coral", bar: "bg-cat-coral" },
  { chip: "border-cat-violet/50 bg-cat-violet/15 text-cat-violet", bar: "bg-cat-violet" },
];
const TF_SAY = [
  "Box এখনো খালি। তিনটা bar পুরো ভরলেই আপার label মিলবে।",
  "একটা ডিম পড়লো, label-এর তিন ঘরেই ডিমের ভাগ জমলো।",
  "আরেকটা ডিম। মানে ডিমের card-টা ২ দিয়ে stretch।",
  "রুটি পড়লো। চিনির ঘরে এখনো মাত্র 1 গ্রাম।",
  "কলা পড়তেই চিনি এক লাফে 15।",
];

export function TiffinFill() {
  const s = useScene(5, [600, 1100, 1100, 1200, 1400]);
  const k = s.k;
  const inBox = TF_DROPS.slice(0, Math.min(k, TF_DROPS.length));
  const total = NUTRI.map((_, n) => inBox.reduce((t, f) => t + FOODS[f].v[n], 0));

  return (
    <Scene scene={s} caption={k < 5 ? TF_SAY[k] : <span className={FADE}>15 গ্রাম চিনির 14 গ্রামই কলার। তাই কলা একটার বেশি নেওয়ার উপায়ই ছিল না।</span>}>
      <div className="mx-auto max-w-[17rem]">
        <div className="flex">
          <div aria-label="আপার box" className="flex flex-1 gap-1.5 rounded-xl border-2 border-foreground/40 p-1.5">
            {TF_DROPS.map((f, i) => (
              <div key={i} className="grid h-8 flex-1 place-items-center rounded-md border border-dashed border-border">
                {i < k && <span className={`${POP} rounded-md border px-1.5 text-sm font-semibold ${TF_TONE[f].chip}`}>{FOODS[f].name}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 grid gap-1">
          {NUTRI.map((name, n) => {
            const full = total[n] === ORDER[n];
            const clue = n === 2 && k >= 5;
            return (
              <div
                key={name}
                className={`rounded-lg px-2 py-0.5 transition-colors duration-500 motion-reduce:transition-none ${clue ? "bg-cat-violet/10" : ""}`}
              >
                <div className="flex items-baseline justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-mono">
                    <b key={total[n]} className={`${POP} inline-block ${full ? "text-accent-text" : ""}`}>
                      {total[n]}
                    </b>
                    {full && <span className={`${FADE} font-sans text-accent-text`}> ✓</span>}
                  </span>
                </div>
                <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-foreground/10">
                  {inBox.map((f, i) =>
                    FOODS[f].v[n] > 0 ? (
                      <div
                        key={i}
                        style={{ width: `${(FOODS[f].v[n] / ORDER[n]) * 100}%` }}
                        className={`${TF_TONE[f].bar} origin-left border-r-2 border-background transition-[scale] duration-500 ease-out last:border-r-0 motion-reduce:transition-none starting:scale-x-0`}
                      />
                    ) : null,
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5¾ · A figure for screen 5's explanation, no task: the average was a
//      linear combination all along. আপার box reads 2·ডিম + 1·রুটি + 1·কলা;
//      the poster's (ফাহিম + সামিন + সোম) × ⅓ opens up into ⅓ of each, the
//      same shape, and the name lands under both.

/** how many of each food went into আপার box */
const X5_N = [2, 1, 1];
const X5_SAY = [
  "আপার box: প্রতিটা খাবার থেকে কয়েকটা, তারপর সব যোগ।",
  "আপার box: প্রতিটা খাবার থেকে কয়েকটা, তারপর সব যোগ।",
  "আর poster-এর average: সবাইকে যোগ, তারপর × ⅓।",
  "⅓-টা ভেঙে প্রত্যেকের গায়ে বসিয়ে দিলেও হিসাব একই।",
];

/** an amount in a recipe line, popping in */
function X5Amt({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  return (
    <b style={{ transitionDelay: `${delay}ms` }} className={`${POP} inline-block font-mono text-cat-amber`}>
      {children}
    </b>
  );
}

export function AverageRecipe() {
  const s = useScene(4, [600, 1500, 1700, 1500]);
  const k = s.k;
  const name = (n: string) => <span className="font-semibold text-cat-teal">{n}</span>;

  return (
    <Scene scene={s} caption={k < 4 ? X5_SAY[k] : <span className={FADE}>দুইটাই একই ছাঁচ: কিছুটা করে নাও, তারপর যোগ। এর নাম linear combination।</span>}>
      <div className="mx-auto grid max-w-xs gap-2 text-center text-[0.95rem]">
        <div className="h-12">
          {k >= 1 && (
            <div className={FADE}>
              <div className="text-xs text-muted">আপার box</div>
              {FOODS.map((fd, i) => (
                <Fragment key={fd.name}>
                  {i > 0 && " + "}
                  <X5Amt delay={i * 200}>{X5_N[i]}</X5Amt>·{name(fd.name)}
                </Fragment>
              ))}
            </div>
          )}
        </div>
        <div className="h-12">
          {k >= 2 && (
            <div className={FADE}>
              <div className="text-xs text-muted">Poster-এর average</div>
              {k < 3 ? (
                <div>
                  ({KIDS.map((kid, i) => (
                    <Fragment key={kid.n}>
                      {i > 0 && " + "}
                      {name(kid.n)}
                    </Fragment>
                  ))}) × <b className="font-mono text-cat-amber">⅓</b>
                </div>
              ) : (
                <div className={FADE}>
                  {KIDS.map((kid, i) => (
                    <Fragment key={kid.n}>
                      {i > 0 && " + "}
                      <X5Amt delay={i * 200}>⅓</X5Amt>·{name(kid.n)}
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="h-8">
          {k >= 4 && <span className={`${POP} inline-block rounded-full bg-cat-violet/10 px-3 py-1 font-bold text-cat-violet`}>linear combination</span>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · The combo box written the way papers write it. Six parts, asked in a
//     shuffled order: is it an amount or an ingredient? Then the subscript
//     warning: v₁ here is a whole card, not a slot.

const PARTS = [
  { sym: "λ₁", real: "2", amount: true },
  { sym: "v₁", real: "🥚", amount: false },
  { sym: "λ₂", real: "1", amount: true },
  { sym: "v₂", real: "🫓", amount: false },
  { sym: "λ₃", real: "1", amount: true },
  { sym: "v₃", real: "🍌", amount: false },
];
const ASK = [3, 5, 0, 1, 4, 2];

export function NameParts() {
  const pass = useGate();
  const [done, setDone] = useSeed("done", 0);
  const [miss, setMiss] = useState<{ n: number; part: number } | null>(null);
  const all = done === ASK.length;
  const cur = ASK[done];

  const call = (amount: boolean) => {
    if (all) return;
    if (PARTS[cur].amount !== amount) {
      setMiss((m) => ({ n: (m?.n ?? 0) + 1, part: cur }));
      return;
    }
    setMiss(null);
    setDone(done + 1);
    if (done + 1 === ASK.length) pass("λ বলে কতটা নিতে হবে, আর v বলে কোন উপকরণ। প্রতিটা উপকরণ থেকে কিছুটা করে নিয়ে সব যোগ, পুরো লাইনটা বলতে এতটুকুই।");
  };

  return (
    <>
      <div className="mt-5 overflow-x-auto">
        <div className="mx-auto flex w-max items-end gap-0.5">
          {PARTS.map((p, i) => {
            const k = ASK.indexOf(i);
            const named = k < done;
            const now = !all && i === cur;
            return (
              <div key={p.sym} className="flex items-end gap-0.5">
                {i > 0 && i % 2 === 0 && <span className="pb-7 font-mono text-lg text-muted">+</span>}
                <div
                  className={`flex min-w-10 flex-col items-center rounded-xl border-2 px-0.5 py-1.5 transition-colors motion-reduce:transition-none ${
                    now ? "border-cat-violet bg-cat-violet/10" : "border-transparent"
                  }`}
                >
                  <span className={`h-5 font-mono ${p.amount ? "text-sm font-bold text-cat-amber" : "text-base"}`}>{p.real}</span>
                  <span className="font-serif text-2xl italic">{p.sym}</span>
                  <span className={`mt-0.5 h-5 rounded-full px-1.5 text-[0.7rem] leading-5 ${named ? `${POP} ${p.amount ? "bg-cat-amber/15 text-cat-amber" : "bg-cat-teal/15 text-cat-teal"}` : ""}`}>
                    {named ? (p.amount ? "কতটা" : "উপকরণ") : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {!all && (
        <div key={done} className={`${FADE} text-center`}>
          <div className="mt-3 text-[0.95rem]">
            বেগুনি ঘরের <span className="font-serif text-lg italic">{PARTS[cur].sym}</span> আসলে কী বলছে?
          </div>
          <div className="mt-2 flex justify-center gap-2">
            <button type="button" onClick={() => call(true)} className={quietBtn}>
              কতটা নিতে হবে
            </button>
            <button type="button" onClick={() => call(false)} className={quietBtn}>
              কোন উপকরণ
            </button>
          </div>
        </div>
      )}
      {miss && !all && (
        <Nope key={miss.n}>
          {PARTS[miss.part].amount
            ? `উঁহু, ${PARTS[miss.part].sym}-এর ঠিক ওপরে লেখা ${PARTS[miss.part].real}, একটা মাত্র সংখ্যা। একটা সংখ্যা কি খাবার হতে পারে, নাকি বলে খাবারটা কয়টা নিতে হবে?`
            : `উঁহু, ${PARTS[miss.part].sym}-এর ওপরে তো একটা আস্ত খাবার, তার তিন ঘরের card সহ। ওটা কি শুধু একটা সংখ্যা, নাকি একটা উপকরণ?`}
        </Nope>
      )}
      {all && (
        <div className={`${FADE} mx-auto mt-4 max-w-md rounded-2xl border-2 border-cat-amber/50 bg-cat-amber/5 px-4 py-3 text-[0.95rem]`}>
          <div className="font-semibold">⚠️ ছোট্ট একটা ফাঁদ</div>
          <div className="mt-1">
            এখানে <span className="font-serif italic">v₁</span> মানে পুরো ডিমের card, <span className="font-mono">(80, 6, 0)</span>। অথচ treasure hunt-এ{" "}
            <span className="font-serif italic">u₁</span> মানে ছিল <span className="font-serif italic">u</span>-এর প্রথম ঘর, একটা মাত্র সংখ্যা। নিচের ছোট ১ দেখে দুইটাকে গুলিয়ে ফেলবেন না যেন।
          </div>
        </div>
      )}
      <Task done={all}>
        প্রতিটা symbol কী বলছে, একে একে বলে দিন ({bn(done)}/{bn(ASK.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for screen 6's explanation, no task: the formula grows out
//      of the box. 2·ডিম + 1·রুটি + 1·কলা gets its symbols under each part,
//      then more parts join, and the line settles as λ₁v₁ + … + λₖvₖ.

/** λᵢvᵢ, the amount amber and the ingredient teal, as NameParts paints them */
function X6Term({ i, delay = 0 }: { i: string; delay?: number }) {
  return (
    <span style={{ transitionDelay: `${delay}ms` }} className={`${POP} inline-block font-serif text-lg italic`}>
      <span className="text-cat-amber">λ</span>
      <sub>{i}</sub>
      <span className="text-cat-teal">v</span>
      <sub>{i}</sub>
    </span>
  );
}
const X6_SAY = [
  "আপার box, খাবারের নামে লেখা।",
  "একই box, symbol-এ। λ বলে কতটা, v বলে কোন উপকরণ।",
  "উপকরণ বাড়লে লাইনটা শুধু লম্বা হয়।",
];

export function RecipeGrows() {
  const s = useScene(3, [600, 1700, 1700]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? X6_SAY[k] : <span className={FADE}>উপকরণ kটা হলে এই চেহারা। লাইন যত লম্বাই হোক, ছাঁচ সেই একটাই।</span>}>
      <div className="mx-auto grid w-max grid-cols-5 items-baseline gap-x-2 gap-y-1 text-center">
        {FOODS.map((fd, i) => (
          <Fragment key={fd.name}>
            {i > 0 && <span className="text-muted">+</span>}
            <span>
              <b className="font-mono text-cat-amber">{X5_N[i]}</b>·<span className="font-semibold text-cat-teal">{fd.name}</span>
            </span>
          </Fragment>
        ))}
        {[1, 2, 3].map((i) => (
          <Fragment key={i}>
            {i > 1 && <span className={k >= 1 ? "text-muted" : "invisible"}>+</span>}
            <span className="h-7">{k >= 1 && <X6Term i={String(i)} delay={(i - 1) * 250} />}</span>
          </Fragment>
        ))}
      </div>
      <div className="mt-3 h-12 text-center">
        {k === 2 && (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <Fragment key={i}>
                {i > 1 && <span className="text-muted"> + </span>}
                <X6Term i={String(i)} delay={(i - 1) * 180} />
              </Fragment>
            ))}
          </div>
        )}
        {k >= 3 && (
          <div className={FADE}>
            <X6Term i="1" /> <span className="text-muted">+</span> <X6Term i="2" /> <span className="text-muted">+ … +</span> <X6Term i="k" delay={300} />
            <div className="text-xs text-muted">kটা উপকরণ</div>
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6⅞ · A figure for screen 6's explanation, no task: the subscript trap. In
//      the treasure hunt u₁ lit up one slot of u = (2, 3), a single number;
//      in আপার box v₁ lights up the whole egg card. Same little 1, two jobs.

const X6_TRAP = [
  "Treasure hunt-এ u ছিল (2, 3)।",
  "Treasure hunt-এ u ছিল (2, 3)।",
  "সেখানে u₁ মানে u-এর প্রথম ঘর, শুধু 2।",
  "আপার box-এ উপকরণ তিনটা: v₁, v₂, v₃।",
];

export function SubscriptTrap() {
  const s = useScene(4, [600, 1400, 1600, 1500]);
  const k = s.k;
  const ring = (on: boolean, tone: string) =>
    `rounded-md ring-2 transition-[box-shadow,background-color] duration-500 motion-reduce:transition-none ${on ? tone : "ring-transparent"}`;

  return (
    <Scene
      scene={s}
      caption={k < 4 ? X6_TRAP[k] : <span className={FADE}>এখানে v₁ মানে পুরো ডিমের card। একই ছোট ১, আশেপাশের কথা দেখে মানে ধরতে হয়।</span>}
    >
      <div className="mx-auto grid max-w-[19rem] grid-cols-2 gap-2">
        <div className={`rounded-xl border border-border px-2 py-2 text-center transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-40"}`}>
          <div className="text-xs text-muted">Treasure hunt-এ</div>
          <div className="mt-5 flex items-baseline justify-center font-mono text-lg">
            <span className="font-serif italic">u</span>&nbsp;= (
            <span className={`relative px-1.5 ${ring(k >= 2, "bg-cat-amber/15 ring-cat-amber")}`}>
              2
              {k >= 2 && (
                <span className={`${POP} absolute bottom-full left-1/2 -translate-x-1/2 font-serif text-base italic text-cat-amber`}>
                  u<sub>1</sub>
                </span>
              )}
            </span>
            , <span className="px-1.5">3</span>)
          </div>
          <div className="mt-2 h-5 text-xs">{k >= 2 && <span className={`${FADE} text-cat-amber`}>একটা ঘর, একটা সংখ্যা</span>}</div>
        </div>
        <div className={`rounded-xl border border-border px-2 py-2 text-center transition-opacity duration-500 motion-reduce:transition-none ${k >= 3 ? "opacity-100" : "opacity-40"}`}>
          <div className="text-xs text-muted">আপার box-এ</div>
          {FOODS.map((fd, i) => (
            <div key={fd.name} className={`mt-1 flex items-baseline gap-1 px-1 ${ring(k >= 4 && i === 0, "bg-cat-teal/10 ring-cat-teal")}`}>
              <span className="font-serif italic">
                v<sub>{i + 1}</sub>
              </span>
              <span className="text-sm">{fd.name}</span>
              <span className="ml-auto font-mono text-[0.7rem] whitespace-nowrap">{tup(fd.v)}</span>
            </div>
          ))}
          <div className="mt-1 h-5 text-xs">{k >= 4 && <span className={`${FADE} text-cat-teal`}>আস্ত একটা vector</span>}</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: the robotics club's
//      remote. It lands beside Shiku on the chalk grid with two buttons, and
//      each press is one step: e₁ east, e₂ north, and with the minus the other
//      way. Three presses, three steps; no ঠিকানা from the widget is walked.

/** the chalk grid for the remote scenes: cell c, grid point (0, 0) at (ox, oy) */
type S7G = { ox: number; oy: number; c: number };
const s7at = (g: S7G, [a, b]: XY): XY => [g.ox + a * g.c, g.oy - b * g.c];

function S7Grid({ g, x0, x1, y0, y1 }: { g: S7G; x0: number; x1: number; y0: number; y1: number }) {
  const [l, t] = s7at(g, [x0, y1]);
  const [r, b] = s7at(g, [x1, y0]);
  return (
    <g className="pointer-events-none" stroke="white" strokeOpacity={0.75} strokeWidth={1}>
      {Array.from({ length: x1 - x0 + 1 }, (_, i) => (
        <path key={`x${i}`} d={`M${l + i * g.c} ${t}V${b}`} />
      ))}
      {Array.from({ length: y1 - y0 + 1 }, (_, i) => (
        <path key={`y${i}`} d={`M${l} ${t + i * g.c}H${r}`} />
      ))}
      <circle cx={g.ox} cy={g.oy} r={2.6} fill="white" stroke="none" />
    </g>
  );
}

/** one press, as a chalk arrow from a to b (stage units) with its name at an offset */
function S7Arrow({ a, b, color, name, at }: { a: XY; b: XY; color: string; name: string; at: XY }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [ux, uy] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const [bx, by] = [b[0] - ux * 7, b[1] - uy * 7];
  return (
    <g className={`${POP} pointer-events-none`}>
      <path d={`M${a[0]} ${a[1]}L${bx} ${by}`} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${b[0]} ${b[1]}L${bx - uy * 4.5} ${by + ux * 4.5}L${bx + uy * 4.5} ${by - ux * 4.5}Z`} fill={color} />
      <text
        x={(a[0] + b[0]) / 2 + at[0]}
        y={(a[1] + b[1]) / 2 + at[1]}
        textAnchor="middle"
        fontSize={9.5}
        fontWeight={800}
        fill={color}
        stroke="white"
        strokeWidth={2.5}
        paintOrder="stroke"
      >
        {name}
      </text>
    </g>
  );
}

/** Shiku's remote, top-left at (x, y); `shift` slides it sideways (off the stage and back) */
function S7Remote({ x, y, keys, shift = 0 }: { x: number; y: number; keys: { t: string; on: boolean; tone: string; dir?: XY }[]; shift?: number }) {
  return (
    <g
      style={{ transform: `translate(${shift}px, 0px)` }}
      className="pointer-events-none transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
    >
      <rect x={x} y={y} width={50} height={26 + keys.length * 26} rx={10} fill="#334155" stroke="#0f172a" />
      <text x={x + 25} y={y + 14} textAnchor="middle" fontSize={7} fontWeight={700} fill="#cbd5e1">
        remote
      </text>
      {keys.map((b, i) => (
        <g key={b.t}>
          <rect x={x + 7} y={y + 21 + i * 26} width={36} height={20} rx={10} fill={b.on ? b.tone : "#475569"} stroke={b.on ? "white" : "#64748b"} strokeWidth={b.on ? 1.8 : 1} />
          <text x={b.dir ? x + 19 : x + 25} y={y + 34.5 + i * 26} textAnchor="middle" fontSize={9.5} fontWeight={800} fill="white">
            {b.t}
          </text>
          {b.dir && (
            <path
              d={`M${x + 31 - b.dir[0] * 4} ${y + 31 + i * 26 + b.dir[1] * 4}l${b.dir[0] * 8} ${-b.dir[1] * 8}m${-b.dir[0] * 4} 0l${b.dir[0] * 4} 0l0 ${b.dir[1] * 4}`}
              fill="none"
              stroke="white"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      ))}
    </g>
  );
}

const S7_G: S7G = { ox: 100, oy: 146, c: 26 };
const S7_WALK: XY[] = [
  [0, 0],
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

export function RemoteGiven({}: Story) {
  const s = useScene(4, [600, 1400, 1600, 1600]);
  const k = s.k;
  const p = (i: number) => s7at(S7_G, S7_WALK[i]);
  const [rx, ry] = p(k);

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={50} label="Shiku on a chalk grid gets a remote with two buttons: e₁ takes one step east, e₂ one step north, and with the minus the other way">
        <Tree x={26} y={62} s={0.6} />
        <Tree x={208} y={60} s={0.5} />
        <S7Grid g={S7_G} x0={-2} x1={4} y0={-1} y1={3} />
        <text x={36} y={66} fontSize={8.5} fontWeight={700} fill="white">
          ↑ উত্তর
        </text>
        <text x={204} y={166} textAnchor="end" fontSize={8.5} fontWeight={700} fill="white">
          পূর্ব →
        </text>
        {k >= 2 && <S7Arrow a={p(1)} b={p(2)} color="#1d4ed8" name="e₁" at={[0, 13]} />}
        {k >= 3 && <S7Arrow a={p(2)} b={p(3)} color="#0f766e" name="e₂" at={[12, 4]} />}
        {k >= 4 && <S7Arrow a={p(3)} b={p(4)} color="#be123c" name="−e₁" at={[0, 13]} />}
        <Robot x={rx} y={ry} ms={900} walking={k === 2 || k === 3} />
        {k >= 1 && (
          <g className={POP}>
            <S7Remote
              x={248}
              y={66}
              keys={[
                { t: "e₁", on: k === 2 || k === 4, tone: "#2563eb" },
                { t: "e₂", on: k === 3, tone: "#0d9488" },
                { t: "−", on: k === 4, tone: "#e11d48" },
              ]}
            />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · Shiku's remote with two buttons, e₁ (one step east) and e₂ (one step
//     north), minus allowed. The net presses are drawn as a chain of small
//     arrows and read as a recipe: the presses are the vector's numbers.

const FE = makeFrame(-3, 4, -1, 5, 30);
const GOALS: XY[] = [
  [2, 3],
  [-1, 4],
];
const E_GUESS = ["উল্টো e₁ একবার", "e₁ একবার", "e₁ চারবার"];
const REMOTE: { btn: string; d: XY }[] = [
  { btn: "+e₁ পূর্বে", d: [1, 0] },
  { btn: "−e₁ পশ্চিমে", d: [-1, 0] },
  { btn: "+e₂ উত্তরে", d: [0, 1] },
  { btn: "−e₂ দক্ষিণে", d: [0, -1] },
];

/** k copies of the step d chained from `from`, one small arrow each */
function Chain({ f, from, d, k, tone }: { f: Frame; from: XY; d: XY; k: number; tone: "blue" | "coral" }) {
  const s = Math.sign(k);
  return (
    <>
      {Array.from({ length: Math.abs(k) }, (_, i) => (
        <Arrow key={i} f={f} from={add(from, times(s * i, d))} to={add(from, times(s * (i + 1), d))} tone={tone} w={2.4} />
      ))}
    </>
  );
}

const recipe = (a: number, b: number, x = "e₁", y = "e₂") => `${sg(a)}·${x} + ${sg(b)}·${y}`;

export function TwoButtons() {
  const pass = useGate();
  const [at, setAt] = useSeed<XY>("at", [0, 0]);
  const [hits, setHits] = useSeed("hits", 0);
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const goal = GOALS[Math.min(hits, 1)];
  const waiting = hits === 1 && guess === null;
  const over = hits === 2;

  const press = (d: XY) => {
    if (waiting || over) return;
    const next: XY = [clamp(at[0] + d[0], FE.x0, FE.x1), clamp(at[1] + d[1], FE.y0, FE.y1)];
    setAt(next);
    if (!same(next, goal)) return;
    setHits(hits + 1);
    if (hits === 1) pass("(2, 3) মানে 2·e₁ + 3·e₂, আর (−1, 4) মানে −1·e₁ + 4·e₂। Vector-এর সংখ্যাগুলো আসলে একটা recipe, কোন button কতবার চাপতে হবে।");
  };
  const pick = (i: number) => {
    setGuess(i);
    setAt([0, 0]);
  };

  return (
    <>
      <Plane f={FE} ticks={1} label={`Shiku at ${tup(at)}, heading for ${tup(goal)}`} className="max-w-[16rem]">
        <Star f={FE} at={goal} done={same(at, goal)} />
        <Chain f={FE} from={O} d={[1, 0]} k={at[0]} tone="blue" />
        <Chain f={FE} from={[at[0], 0]} d={[0, 1]} k={at[1]} tone="coral" />
        <Shiku f={FE} at={at} />
      </Plane>
      <div className="text-center font-mono text-lg">
        <span className="text-cat-blue">{sg(at[0])}</span>·e₁ + <span className="text-cat-coral">{sg(at[1])}</span>·e₂ = <b>{tup(at)}</b>
      </div>
      <div className="text-center text-xs text-muted">e₁ = (1, 0), পূর্বে এক পা। e₂ = (0, 1), উত্তরে এক পা।</div>
      {!waiting && !over && (
        <div className="mx-auto mt-3 grid max-w-xs grid-cols-2 gap-2">
          {REMOTE.map((r) => (
            <button key={r.btn} type="button" onClick={() => press(r.d)} className={`${quietBtn} justify-center px-2 ${r.d[0] ? "" : "border-cat-coral text-cat-coral hover:bg-cat-coral/10"}`}>
              {r.btn}
            </button>
          ))}
        </div>
      )}
      {hits >= 1 && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-accent-text`}>
          ✓ (2, 3)-এ পৌঁছে গেলেন, {recipe(2, 3)} দিয়ে।{over && <> ✓ (−1, 4)-এও পৌঁছে গেলেন, {recipe(-1, 4)} দিয়ে।</>}
        </div>
      )}
      {hits >= 1 && (
        <div className={FADE}>
          <div className="mt-3 text-sm font-medium text-muted">এবার তারাটা (−1, 4)-এ, আর Shiku আবার Gate থেকে শুরু করবে। Remote-এ হাত দেওয়ার আগে বলুন তো, e₁ button কীভাবে চাপবেন?</div>
          <div className="mt-2 grid gap-2">
            {E_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, over, 0)} disabled={guess !== null} onClick={() => pick(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </div>
      )}
      <Ticks
        items={[
          ["(2, 3)", hits >= 1],
          ["(−1, 4)", over],
        ]}
      />
      <Task done={over}>Remote চেপে Shiku-কে তারার কাছে নিয়ে যান। তারা কিন্তু দুইটা।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A figure for screen 7's explanation, no task: the presses are the
//      numbers. Shiku's walk to (2, 3) as a log of presses, e₁ e₁ then
//      e₂ e₂ e₂; counted up they read 2e₁ + 3e₂, and the 2 and the 3 are
//      the very numbers of (2, 3).

const X7_F = makeFrame(0, 3, 0, 3.5, 26, 8);
const X7_PRESS = ["e₁", "e₁", "e₂", "e₂", "e₂"];
const X7_SAY = [
  "Shiku যাবে (2, 3)-এ।",
  "e₁ চাপা হলো দুইবার।",
  "তারপর e₂ তিনবার।",
  "কোনটা কয়বার চাপলেন, গুনে লিখলে 2e₁ + 3e₂।",
];

export function PressCount() {
  const s = useScene(4, [600, 1500, 1700, 1600]);
  const k = s.k;
  const shown = k >= 2 ? 5 : k >= 1 ? 2 : 0;

  return (
    <Scene scene={s} caption={k < 4 ? X7_SAY[k] : <span className={FADE}>কতবার চাপলেন, সেই 2 আর 3-ই তো vector-এর নিজের সংখ্যা!</span>}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[5.75rem] shrink-0">
          <Plane f={X7_F} grid={1} axes={false} label="two steps east, then three steps north, to (2, 3)" className="my-0! max-w-none">
            <Star f={X7_F} at={[2, 3]} done={k >= 2} />
            {k >= 1 && [0, 1].map((i) => <Arrow key={`a${i}`} f={X7_F} from={[i, 0]} to={[i + 1, 0]} tone="blue" w={2.4} draw delay={i * 350} />)}
            {k >= 2 && [0, 1, 2].map((j) => <Arrow key={`b${j}`} f={X7_F} from={[2, j]} to={[2, j + 1]} tone="coral" w={2.4} draw delay={j * 350} />)}
            <Dot f={X7_F} at={O} r={3} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted">কোন button চাপা হলো</div>
          <div className="mt-1 flex min-h-7 flex-wrap gap-1">
            {X7_PRESS.slice(0, shown).map((p, i) => (
              <span
                key={i}
                style={{ transitionDelay: `${(i < 2 ? i : i - 2) * 350}ms` }}
                className={`${POP} rounded-full border px-2 font-mono text-sm ${i < 2 ? "border-cat-blue/50 text-cat-blue" : "border-cat-coral/50 text-cat-coral"}`}
              >
                {p}
              </span>
            ))}
          </div>
          <div className="mt-2 h-7 font-mono text-lg">
            {k >= 3 && (
              <span className={FADE}>
                <b className="text-cat-blue">2</b>e₁ + <b className="text-cat-coral">3</b>e₂
              </span>
            )}
          </div>
          <div className="h-7 font-mono text-lg">
            {k >= 4 && (
              <span className={FADE}>
                = (
                <b className={`${POP} inline-block text-cat-blue`}>2</b>,{" "}
                <b style={{ transitionDelay: "250ms" }} className={`${POP} inline-block text-cat-coral`}>
                  3
                </b>
                )
              </span>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7⅞ · A story scene for screen 7's explanation, no task: the old reading,
//      now in math. Shiku holds the card (2, 3) and thinks the first lesson's
//      reading, x along 2 steps, then y along 3; walks it on the chalk grid,
//      one e₁ or e₂ arrow per step; and the grid spells 2e₁ + 3e₂ beside it.

const X7_G: S7G = { ox: 84, oy: 158, c: 27 };
const X7_WALK: XY[] = [
  [0, 0],
  [0, 0],
  [2, 0],
  [2, 3],
  [2, 3],
];

export function ReadAloud() {
  const s = useScene(4, [600, 1800, 1800, 1900]);
  const k = s.k;
  const p = (q: XY) => s7at(X7_G, q);
  const [rx, ry] = p(X7_WALK[k]);

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={36} label="Shiku reads (2, 3) the first lesson's way, 2 steps along x then 3 along y, walks it one arrow at a time, and it reads 2e₁ + 3e₂">
        <S7Grid g={X7_G} x0={-1} x1={4} y0={0} y1={4} />
        <text x={p([4, 0])[0] + 7} y={X7_G.oy + 3} fontSize={10} fontWeight={800} fill="white">
          x
        </text>
        <text x={X7_G.ox} y={p([0, 4])[1] - 5} textAnchor="middle" fontSize={10} fontWeight={800} fill="white">
          y
        </text>
        {k >= 2 && [0, 1].map((i) => <S7Arrow key={`e1${i}`} a={p([i, 0])} b={p([i + 1, 0])} color="#1d4ed8" name="e₁" at={[0, 13]} />)}
        {k >= 3 && [0, 1, 2].map((j) => <S7Arrow key={`e2${j}`} a={p([2, j])} b={p([2, j + 1])} color="#0f766e" name="e₂" at={[12, 4]} />)}
        <Robot x={rx} y={ry} ms={1300} walking={k === 2 || k === 3} />
        <CastCard x={262} y={62} text="(2, 3)" tone="blue" />
        {k === 1 && <Bubble x={X7_G.ox} y={X7_G.oy - 46} tone="think" lines={["x ধরে 2 step,", "তারপর y ধরে 3 step"]} />}
        {k >= 4 && (
          <g className={POP}>
            <rect x={218} y={80} width={88} height={22} rx={4} fill="white" fillOpacity={0.9} />
            <text x={262} y={95.5} textAnchor="middle" fontSize={12} fontWeight={800} fill="#0f1b2d" fontFamily="ui-monospace, monospace">
              = 2e₁ + 3e₂
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: the remote is swapped.
//      The old e₁, e₂ remote slides away and a tilted one slides in: a is a
//      step north-east, b a step north-west. One press of each shows the
//      buttons; the old treasure waits at (2, 4), and how to reach it is the
//      widget's question.

const S8_G: S7G = { ox: 118, oy: 160, c: 22 };
const S8_WALK: XY[] = [
  [0, 0],
  [0, 0],
  [1, 1],
  [0, 2],
  [0, 2],
];

export function RemoteSwap({}: Story) {
  const s = useScene(4, [600, 1600, 1600, 1600]);
  const k = s.k;
  const p = (i: number) => s7at(S8_G, S8_WALK[i]);
  const [rx, ry] = p(k);
  const [cx, cy] = s7at(S8_G, [2, 4]);

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={50} label="Shiku's remote is swapped for a tilted one: a steps north-east, b steps north-west; the old treasure still waits at (2, 4)">
        <Tree x={26} y={62} s={0.6} />
        <S7Grid g={S8_G} x0={-3} x1={4} y0={0} y1={4} />
        <text x={cx + 16} y={cy - 4} fontSize={9} fontWeight={800} fill="white" fontFamily="ui-monospace, monospace">
          (2, 4)
        </text>
        <Chest x={cx} y={cy + 4} />
        {k >= 2 && <S7Arrow a={p(1)} b={p(2)} color="#1d4ed8" name="a" at={[9, 8]} />}
        {k >= 3 && <S7Arrow a={p(2)} b={p(3)} color="#be185d" name="b" at={[-9, 8]} />}
        <Robot x={rx} y={ry} ms={900} walking={k === 2 || k === 3} />
        {k >= 4 && (
          <text x={cx} y={cy - 22} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fde047" stroke="#0f1b2d" strokeWidth={1} className={POP}>
            ?
          </text>
        )}
        <S7Remote
          x={256}
          y={66}
          shift={k >= 1 ? 90 : 0}
          keys={[
            { t: "e₁", on: false, tone: "#2563eb" },
            { t: "e₂", on: false, tone: "#0d9488" },
          ]}
        />
        <S7Remote
          x={256}
          y={66}
          shift={k >= 1 ? 0 : 90}
          keys={[
            { t: "a", on: k === 2, tone: "#2563eb", dir: [1, 1] },
            { t: "b", on: k === 3, tone: "#db2777", dir: [-1, 1] },
          ]}
        />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · The same field with a tilted remote: a is one step north-east, b is one
//     step north-west, pressed exactly the way screen 7's remote was. The
//     reader walks to the old treasure at (2, 4), guesses whether a second
//     pair reaches it, then roams the field to check for themselves: every
//     spot they come back to comes back under the very same pair, and the
//     star opens only on 3a + 1b again. Kept simple: no dots, just the walk.

const FTL = makeFrame(-3, 6, -2, 7, 20);
const A: XY = [1, 1];
const B: XY = [-1, 1];
const GOAL7: XY = [2, 4];
const land = (a: number, b: number): XY => add(times(a, A), times(b, B));
const onField = ([x, y]: XY) => x >= FTL.x0 && x <= FTL.x1 && y >= FTL.y0 && y <= FTL.y1;
/** off-star landings the roam must have before the star counts as re-found */
const ROAM = 3;
const ONE_GUESS = ["উপায় ঠিক একটাই", "আরও কয়েকটা উপায় আছে"];
const TILT: { btn: string; da: number; db: number }[] = [
  { btn: "+a উত্তর-পূর্বে", da: 1, db: 0 },
  { btn: "−a পিছনে", da: -1, db: 0 },
  { btn: "+b উত্তর-পশ্চিমে", da: 0, db: 1 },
  { btn: "−b পিছনে", da: 0, db: -1 },
];

export function TiltedField() {
  const pass = useGate();
  const [ka, setKa] = useSeed("ka", 0);
  const [kb, setKb] = useSeed("kb", 0);
  const [found, setFound] = useSeed("found", false);
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [seen, setSeen] = useSeed<Record<string, XY>>("seen", {});
  const [echo, setEcho] = useSeed<{ n: number; pair: XY } | null>("echo", null);
  const [trip, setTrip] = useSeed("trip", 0);
  const [back, setBack] = useSeed("back", false);
  const pos = land(ka, kb);
  const there = same(pos, GOAL7);
  const roaming = found && guess !== null && !back;

  const press = (da: number, db: number) => {
    const [a, b] = [ka + da, kb + db];
    const at = land(a, b);
    if (!onField(at)) return;
    setKa(a);
    setKb(b);
    const old = seen[tup(at)];
    if (old) {
      if (roaming) setEcho({ n: (echo?.n ?? 0) + 1, pair: old });
    } else {
      setEcho(null);
      setSeen({ ...seen, [tup(at)]: [a, b] });
    }
    if (!same(at, GOAL7)) {
      if (roaming) setTrip(trip + 1);
      return;
    }
    setFound(true);
    if (roaming && trip >= ROAM) {
      setBack(true);
      pass("যেদিক দিয়েই ঘুরে আসুন, তারার ঘরে নামতে সেই a তিনবার আর b একবারই লাগলো। যে ঘরে যেই জোড়া, ঘুরে ফিরে সেটাই।");
    }
  };

  return (
    <>
      <Plane f={FTL} ticks={2} label={`Shiku at ${tup(pos)} after ${ka} a and ${kb} b`} className="max-w-[15rem]">
        <Star f={FTL} at={GOAL7} done={there} />
        <Chain f={FTL} from={O} d={A} k={ka} tone="blue" />
        <Chain f={FTL} from={times(ka, A)} d={B} k={kb} tone="coral" />
        <Shiku f={FTL} at={pos} />
        {back && <circle cx={FTL.sx(GOAL7[0])} cy={FTL.sy(GOAL7[1])} r={14} strokeWidth={2.5} className={`${POP} pointer-events-none fill-none stroke-accent`} />}
      </Plane>
      <div className="text-center font-mono text-lg">
        {recipe(ka, kb, "a", "b")} = <b className={there ? "text-accent-text" : ""}>{tup(pos)}</b>
      </div>
      <div className="text-center text-xs text-muted">
        <span className="text-cat-blue">a, উত্তর-পূর্বে এক পা</span> · <span className="text-cat-coral">b, উত্তর-পশ্চিমে এক পা</span>
      </div>
      {(!found || roaming) && (
        <div className="mx-auto mt-3 grid max-w-xs grid-cols-2 gap-2">
          {TILT.map((t) => (
            <button
              key={t.btn}
              type="button"
              onClick={() => press(t.da, t.db)}
              className={`${quietBtn} justify-center px-2 ${t.db ? "border-cat-coral text-cat-coral hover:bg-cat-coral/10" : ""}`}
            >
              {t.btn}
            </button>
          ))}
        </div>
      )}
      {roaming && echo && (
        <div key={echo.n} className={`${FADE} mt-2 text-center text-[0.95rem]`}>
          এই ঘরে আগেও নেমেছিলেন, সেবারও <span className="font-mono text-cat-violet">{recipe(echo.pair[0], echo.pair[1], "a", "b")}</span>।
        </div>
      )}
      {found && (guess === null || back) && (
        <div className={FADE}>
          {guess === null && (
            <div className="mt-3 text-sm font-medium text-muted">
              তারায় পৌঁছে গেলেন, a {bn(ka)}বার আর b {bn(kb)}বার চেপে। a আর b-এর অন্য কোনো জোড়া দিয়েও কি এখানে আসা যায়?
            </div>
          )}
          <div className="mt-2 grid gap-2">
            {ONE_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, back, 0)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </div>
      )}
      <Task done={back}>
        {!found
          ? "Remote চেপে Shiku-কে তারার কাছে নিয়ে যান।"
          : guess === null
            ? "অন্য জোড়ায় তারায় আসা যাবে কিনা, একটা guess দিন।"
            : "তারা থেকে কয়েক ঘর ঘুরে এসে আবার তারায় নামুন, অন্য কোনো জোড়া দিয়ে।"}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8b · A figure for screen 8's explanation, no task: what if a button could be
//      pressed half-way, or a quarter? The spots the tilted remote reaches
//      fill in, until there is hardly a gap left on the field.

const FH = makeFrame(-2, 3, -1, 3, 30, 14);
const PRESS: { name: string; s: number; r: number; goal: XY; ab: XY | null; say: string; sum: string }[] = [
  { name: "পুরো পা", s: 1, r: 3, goal: [1, 0], ab: null, say: "পুরো পা চাপলে Shiku নামে শুধু এই dot-গুলোতে। তারার ঘর (1, 0) বাদ পড়ে যায়।", sum: "" },
  { name: "আধা পা", s: 0.5, r: 2.4, goal: [1, 0], ab: [0.5, -0.5], say: "আধা পা চাপা গেলে dot দ্বিগুণ ঘন, (1, 0)-ও হাতে চলে আসে।", sum: "½·a − ½·b = (1, 0)" },
  { name: "সিকি পা", s: 0.25, r: 1.7, goal: [0.5, 1], ab: [0.75, 0.25], say: "সিকি পা চাপা গেলে ঘরের মাঝখানেও নামা যায়, যেমন (0.5, 1)।", sum: "¾·a + ¼·b = (0.5, 1)" },
];
/** strictly inside the sheet, so no dot sits half off its edge */
const inH = ([x, y]: XY) => x > FH.x0 && x < FH.x1 && y > FH.y0 && y < FH.y1;
/** every spot the tilted remote lands on when a press moves `s` of a step */
const spotsAt = (s: number) =>
  Array.from({ length: Math.round(8 / s) + 1 }, (_, i) => i * s - 4).flatMap((a) =>
    Array.from({ length: Math.round(8 / s) + 1 }, (_, j) => j * s - 4)
      .map((b) => land(a, b))
      .filter(inH),
  );

export function FinerPresses() {
  const [lvl, setLvl] = useSeed("lvl", 0);
  const p = PRESS[lvl];
  const mid = p.ab ? times(p.ab[0], A) : null;

  return (
    // grows on a bigger screen, like the scene frames
    <div className={GROW}>
      <div className="mt-2 flex justify-center gap-2">
        {PRESS.map((q, i) => (
          <button key={q.name} type="button" onClick={() => setLvl(i)} className={`${pill(lvl === i)} font-sans`}>
            {q.name}
          </button>
        ))}
      </div>
      <Plane f={FH} ticks={1} label={`the tilted remote pressed ${p.s} of a step at a time`} className="max-w-[16rem]">
        <g key={lvl}>
          {spotsAt(p.s).map((at) => (
            <Dot key={tup(at)} f={FH} at={at} r={p.r} className="fill-cat-blue/40" pop />
          ))}
        </g>
        <Star f={FH} at={p.goal} done={!!p.ab} />
        {p.ab && mid && (
          <g key={`ab${lvl}`} className={FADE}>
            <Arrow f={FH} from={O} to={mid} tone="blue" w={2.4} />
            <Arrow f={FH} from={mid} to={p.goal} tone="coral" w={2.4} />
          </g>
        )}
      </Plane>
      <div key={lvl} className={`${FADE} mx-auto max-w-xs text-center text-sm`}>
        <div className="text-muted">{p.say}</div>
        {p.sum && <div className="mt-1 font-mono text-base">{p.sum}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8c · A figure for screen 8's explanation, no task: one star, three bases.
//      Each basis draws its own graph paper over the field, and the same star
//      reads as a different recipe on each.

const FBS = makeFrame(-1, 4, -1, 5, 24, 14);
const BASES: { name: string; u: XY; v: XY; k: XY; un: string; vn: string; say: string }[] = [
  { name: "e₁, e₂", u: [1, 0], v: [0, 1], k: [2, 4], un: "e₁", vn: "e₂", say: "Standard basis, সোজা পূর্বে আর সোজা উত্তরে।" },
  { name: "a, b", u: A, v: B, k: [3, 1], un: "a", vn: "b", say: "তেরছা remote-এর basis, কাগজের দাগগুলোও তেরছা।" },
  { name: "½e₁, ½e₂", u: [0.5, 0], v: [0, 0.5], k: [4, 8], un: "(½e₁)", vn: "(½e₂)", say: "আধা পা-র basis, ঘর ছোট, তাই চাপতে হয় বেশিবার।" },
];

/** a basis's own graph paper: lines along v through every i·u, and along u through every j·v */
function BasisGrid({ f, u, v }: { f: Frame; u: XY; v: XY }) {
  const n = Array.from({ length: 25 }, (_, i) => i - 12);
  const seg = (p: XY, d: XY) => `M${f.sx(p[0] - 12 * d[0])} ${f.sy(p[1] - 12 * d[1])}L${f.sx(p[0] + 12 * d[0])} ${f.sy(p[1] + 12 * d[1])}`;
  const d = n.map((i) => seg(times(i, u), v) + seg(times(i, v), u)).join("");
  return <path d={d} strokeWidth={0.7} className="pointer-events-none fill-none stroke-cat-blue/30" />;
}

export function BasisCompare() {
  const [pick, setPick] = useSeed("pick", 0);
  const clip = useId();
  const b = BASES[pick];

  return (
    // grows on a bigger screen, like the scene frames
    <div className={GROW}>
      <div className="mt-2 flex justify-center gap-2">
        {BASES.map((q, i) => (
          <button key={q.name} type="button" onClick={() => setPick(i)} className={pill(pick === i)}>
            {q.name}
          </button>
        ))}
      </div>
      <Plane f={FBS} grid={0} ticks={1} label={`the star at (2, 4) in the basis ${b.name}`} className="max-w-[13rem]">
        <clipPath id={clip}>
          <rect x={FBS.sx(FBS.x0)} y={FBS.sy(FBS.y1)} width={(FBS.x1 - FBS.x0) * FBS.u} height={(FBS.y1 - FBS.y0) * FBS.u} />
        </clipPath>
        <g key={pick} clipPath={`url(#${clip})`} className={FADE}>
          <BasisGrid f={FBS} u={b.u} v={b.v} />
        </g>
        <Star f={FBS} at={GOAL7} done />
        <g key={`c${pick}`} className={FADE}>
          <Chain f={FBS} from={O} d={b.u} k={b.k[0]} tone="blue" />
          <Chain f={FBS} from={times(b.k[0], b.u)} d={b.v} k={b.k[1]} tone="coral" />
        </g>
      </Plane>
      <div key={pick} className={`${FADE} mx-auto max-w-xs text-center text-sm`}>
        <div className="font-mono text-base">
          <span className="text-cat-blue">{b.k[0]}</span>·{b.un} + <span className="text-cat-coral">{b.k[1]}</span>·{b.vn} = (2, 4)
        </div>
        <div className="mt-1 text-muted">{b.say}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8d · A figure for screen 8's explanation, no task: one address, two
//      recipes. The old remote walks 2e₁ + 4e₂ to the star, then the tilted
//      one walks 3a + 1b to the very same star.

const X8_F = makeFrame(-0.5, 3.5, -0.5, 4.5, 24, 10);
const X8_SAY = [
  "তারাটা সেই (2, 4)-এ।",
  "পুরানো remote: e₁ দুইবার, e₂ চারবার।",
  "নতুন remote: a তিনবার, b একবার।",
];

export function TwoWaysStar() {
  const s = useScene(3, [600, 1900, 1900]);
  const k = s.k;
  const f = X8_F;

  return (
    <Scene scene={s} caption={k < 3 ? X8_SAY[k] : <span className={FADE}>পথ আলাদা, পৌঁছানো একই তারায়। একই ঠিকানা, দুইভাবে লেখা।</span>}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[7rem] shrink-0">
          <Plane f={f} grid={1} label="2e₁ + 4e₂ and 3a + 1b both reach the star at (2, 4)" className="my-0! max-w-none">
            <Star f={f} at={GOAL7} done={k >= 3} />
            {k >= 1 && (
              <g opacity={k === 2 ? 0.3 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
                {[0, 1].map((i) => (
                  <Arrow key={`e${i}`} f={f} from={[i, 0]} to={[i + 1, 0]} tone="blue" w={2.2} draw delay={i * 250} />
                ))}
                {[0, 1, 2, 3].map((j) => (
                  <Arrow key={`n${j}`} f={f} from={[2, j]} to={[2, j + 1]} tone="coral" w={2.2} draw delay={500 + j * 250} />
                ))}
              </g>
            )}
            {k >= 2 && (
              <>
                {[0, 1, 2].map((i) => (
                  <Arrow key={`a${i}`} f={f} from={times(i, A)} to={times(i + 1, A)} tone="teal" w={2.4} draw delay={i * 300} />
                ))}
                <Arrow f={f} from={times(3, A)} to={GOAL7} tone="violet" w={2.4} draw delay={900} />
              </>
            )}
            <Dot f={f} at={O} r={3} />
          </Plane>
        </div>
        <div className="min-w-0 text-sm">
          <div className="h-11">
            {k >= 1 && (
              <div className={FADE}>
                <div className="text-xs text-muted">পুরানো remote</div>
                <div className="font-mono text-base">
                  <b className="text-cat-blue">2</b>e₁ + <b className="text-cat-coral">4</b>e₂
                </div>
              </div>
            )}
          </div>
          <div className="mt-1 h-11">
            {k >= 2 && (
              <div className={FADE}>
                <div className="text-xs text-muted">নতুন remote</div>
                <div className="font-mono text-base">
                  <b className="text-cat-teal">3</b>a + <b className="text-cat-violet">1</b>b
                </div>
              </div>
            )}
          </div>
          <div className="mt-1 h-6">
            {k >= 3 && (
              <span className={`${POP} inline-block`}>
                দুইটাই <b className="font-mono">(2, 4)</b>
              </span>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8e · A figure for screen 8's explanation, no task: a basis that fits the
//      data. A long, tilted cloud of points under the standard basis's square
//      paper; then the basis turns until one arrow runs along the cloud and
//      the other across it. That is PCA's idea, and no more of it.

const X8_TH = 0.5;
const X8_CLOUD: XY[] = (
  [
    [-2.2, 0.1],
    [-1.8, -0.3],
    [-1.5, 0.35],
    [-1.1, -0.1],
    [-0.8, 0.3],
    [-0.5, -0.35],
    [-0.2, 0.15],
    [0.2, -0.2],
    [0.5, 0.3],
    [0.8, -0.15],
    [1.1, 0.25],
    [1.5, -0.3],
    [1.8, 0.2],
    [2.2, -0.1],
  ] as XY[]
).map(([t, n]) => [t * Math.cos(X8_TH) - n * Math.sin(X8_TH), t * Math.sin(X8_TH) + n * Math.cos(X8_TH)]);
const X8_PF = makeFrame(-2.6, 2.6, -1.7, 1.7, 28, 8);
const X8_PCA = [
  "একদল data, তেরছা একটা লম্বাটে মেঘের মতো।",
  "একদল data, তেরছা একটা লম্বাটে মেঘের মতো।",
  "Standard basis-এর সোজা দাগে মাপলে, দুই দিকেই data ছড়ানো।",
];

export function DataBasis() {
  const s = useScene(3, [600, 1500, 1900]);
  const k = s.k;
  const clip = useId();
  const f = X8_PF;
  const [a] = useTween([k >= 3 ? X8_TH : 0], 1200);
  const u: XY = [Math.cos(a), Math.sin(a)];
  const v: XY = [-Math.sin(a), Math.cos(a)];

  return (
    <Scene
      scene={s}
      caption={k < 3 ? X8_PCA[k] : <span className={FADE}>Basis ঘুরিয়ে মেঘের লম্বা দিক বরাবর বসালাম। PCA এমন মানানসই basis-ই খোঁজে।</span>}
    >
      <Plane f={f} grid={0} axes={false} label="a long tilted cloud of points; the basis turns to lie along it" className="my-0! max-w-[12rem]">
        <clipPath id={clip}>
          <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} />
        </clipPath>
        {k >= 2 && (
          <g clipPath={`url(#${clip})`} className={FADE}>
            <BasisGrid f={f} u={u} v={v} />
          </g>
        )}
        {k >= 1 &&
          X8_CLOUD.map((p, i) => <circle key={i} cx={f.sx(p[0])} cy={f.sy(p[1])} r={3.5} style={{ transitionDelay: `${i * 60}ms` }} className={`${POP} fill-cat-amber`} />)}
        {k >= 2 && (
          <g className={FADE}>
            <Arrow f={f} from={O} to={times(1.2, u)} tone="blue" w={2.4} />
            <Arrow f={f} from={O} to={times(1.2, v)} tone="coral" w={2.4} />
          </g>
        )}
        {k === 2 && (
          <>
            <Label f={f} at={times(1.2, u)} dx={4} dy={12} anchor="start" size={9} className={`${FADE} fill-cat-blue`}>
              e₁
            </Label>
            <Label f={f} at={times(1.2, v)} dx={6} dy={4} anchor="start" size={9} className={`${FADE} fill-cat-coral`}>
              e₂
            </Label>
          </>
        )}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for screen 9's setup, no task: the last job. নাসিব walks
//      up to the pond with his face gone dry, one job left; then the curved
//      road along the bank, and a straight string of beads that comes to hover
//      over it. Whether it can be laid on the road is the widget's question.

const S9_Y = 150;
const S9_BEADS = [-2, -1, 0, 1, 2];
const S9_BEAD_INK = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];

export function PondRoad({}: Story) {
  const s = useScene(4, [600, 1600, 2600, 1600]);
  const k = s.k;
  const ropeY = k >= 4 ? 96 : 58;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={100} label="নাসিব, worried, reaches the pond with one job left; a curved road runs along the bank, and a straight string of beads hovers over it">
        <Tree x={292} y={108} s={0.8} />
        <Tree x={118} y={104} s={0.55} />
        <ellipse cx={205} cy={154} rx={54} ry={17} fill="#38bdf8" stroke="#0284c7" strokeWidth={1} />
        <ellipse cx={186} cy={158} rx={6} ry={2.5} fill="#16a34a" />
        <ellipse cx={226} cy={150} rx={5} ry={2} fill="#16a34a" />
        <path d="M138 172C148 108 262 108 272 172" fill="none" stroke="#c8a27a" strokeWidth={10} strokeLinecap="round" />
        <path d="M138 172C148 108 262 108 272 172" fill="none" stroke="#e7d3b0" strokeWidth={1} strokeDasharray="4 4" />
        <CastPerson who="nasib" x={k >= 1 ? 58 : -30} y={S9_Y} walking={k === 1} mood="sad" label={k >= 1} />
        {k === 2 && <Bubble x={58} y={S9_Y - 66} tone="think" lines={["আর মাত্র", "একটা কাজ বাকি…"]} />}
        {k >= 3 && (
          <g className={POP}>
            <g
              style={{ transform: `translate(205px, ${ropeY}px)` }}
              className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
            >
              <path d="M-54 21.6L54 -21.6" stroke="#78350f" strokeWidth={1.6} />
              {S9_BEADS.map((t, i) => (
                <circle key={t} cx={t * 24} cy={-t * 9.6} r={5} fill={S9_BEAD_INK[i]} stroke="white" strokeWidth={1.2} />
              ))}
            </g>
          </g>
        )}
        {k >= 4 && (
          <text x={205} y={70} textAnchor="middle" fontSize={20} fontWeight={800} fill="#b45309" className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9 · Bend the rope. A straight string of beads and a curved road around the
//     pond; the only moves on the whole rope are stretch and add. Every move
//     plays out on its own rails, and the rails are the whole point: a stretch
//     slides each bead along its own line out of 0, an add slides them all the
//     same way and the same distance. Neither can bend anything. It cannot be
//     won, so after a few tries the reader concedes.

const FP = makeFrame(-5, 5, -3.8, 3.8, 20);
const ROPE: XY[] = [-2, -1, 0, 1, 2].map((x) => [x, x / 2 + 0.8]);
const POND = { c: [0, -1.8] as XY, rx: 1.7, ry: 0.95 };
const ROAD: XY[] = Array.from({ length: 29 }, (_, i) => {
  const x = -3.4 + (6.8 * i) / 28;
  return [x, (x * x) / 2.8 - 3.2] as XY;
});
const pathOf = (pts: XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${FP.sx(p[0])} ${FP.sy(p[1])}`).join("");

const MOVES: { btn: string; go: (p: XY) => XY; stretch: boolean }[] = [
  { btn: "× 2", go: (p) => times(2, p), stretch: true },
  { btn: "× ½", go: (p) => times(0.5, p), stretch: true },
  { btn: "× −1", go: (p) => times(-1, p), stretch: true },
  { btn: "+ (1, 0)", go: (p) => add(p, [1, 0]), stretch: false },
  { btn: "+ (0, 1)", go: (p) => add(p, [0, 1]), stretch: false },
  { btn: "+ (−1, −1)", go: (p) => add(p, [-1, -1]), stretch: false },
];
const TRIES = 5;
/** A move is offered only while the whole rope stays on the sheet. */
const onSheet = (pts: XY[]) => pts.every(([x, y]) => x >= FP.x0 && x <= FP.x1 && y >= FP.y0 && y <= FP.y1);

/** How far along the ray through a bead one can go before leaving the sheet. */
const reach = ([x, y]: XY) => {
  let t = 40;
  if (x) t = Math.min(t, (x > 0 ? FP.x1 : FP.x0) / x);
  if (y) t = Math.min(t, (y > 0 ? FP.y1 : FP.y0) / y);
  return t;
};
/** The bead's own line out of 0, drawn right across the sheet. */
const ray = (p: XY) => {
  const f = reach(p);
  const b = reach(times(-1, p));
  return `M${FP.sx(-b * p[0])} ${FP.sy(-b * p[1])}L${FP.sx(f * p[0])} ${FP.sy(f * p[1])}`;
};

export function BendIt() {
  const pass = useGate();
  const [beads, setBeads] = useSeed<XY[]>("beads", ROPE);
  const [was, setWas] = useSeed<XY[] | null>("was", null);
  const [kind, setKind] = useSeed<"stretch" | "add" | null>("kind", null);
  const [moves, setMoves] = useSeed("moves", 0);
  const [gaveUp, setGaveUp] = useSeed("gaveUp", false);
  const { running, play } = usePlay(900);
  const now = useTween(beads.flat(), 650);
  const live: XY[] = beads.map((p, i) => [now[2 * i] ?? p[0], now[2 * i + 1] ?? p[1]]);

  const apply = (m: (typeof MOVES)[number]) => {
    setWas(beads);
    setBeads(beads.map(m.go));
    setKind(m.stretch ? "stretch" : "add");
    setMoves(moves + 1);
    play(1);
  };
  const again = () => {
    setBeads(ROPE);
    setWas(null);
    setKind(null);
  };
  const concede = () => {
    setGaveUp(true);
    pass("যোগ আর stretch যতবারই করুন, সোজা দড়ি সোজাই থাকে। বাঁকাতে চাইলে এই দুইটার বাইরে অন্য কোনো চাল লাগবে।");
  };

  return (
    <>
      <Plane
        f={FP}
        ticks={0}
        label={`a straight rope of beads from ${tup1(beads[0])} to ${tup1(beads[beads.length - 1])}, and a curved road around a pond`}
        className="max-w-[15rem]"
      >
        <ellipse cx={FP.sx(POND.c[0])} cy={FP.sy(POND.c[1])} rx={POND.rx * FP.u} ry={POND.ry * FP.u} className="pointer-events-none fill-[#bae6fd]" />
        <Label f={FP} at={POND.c} dy={4} size={9} weight={500} className="fill-[#0369a1]">
          পুকুর
        </Label>
        <path d={pathOf(ROAD)} strokeWidth={9} strokeLinecap="round" className="pointer-events-none fill-none stroke-cat-amber/30" />
        <path d={pathOf(ROAD)} strokeWidth={1.2} strokeDasharray="5 4" className="pointer-events-none fill-none stroke-cat-amber" />
        {was && (
          <g
            opacity={running ? 1 : 0.25}
            className="pointer-events-none transition-opacity duration-500 motion-reduce:transition-none"
          >
            {kind === "stretch" ? (
              <>
                {was.map((p, i) => (
                  <path key={i} d={ray(p)} strokeWidth={1} strokeDasharray="3 4" className="fill-none stroke-cat-blue" />
                ))}
                <circle cx={FP.sx(0)} cy={FP.sy(0)} r={3.5} className="fill-cat-blue" />
                <Label f={FP} at={[0, 0]} dx={-6} dy={-5} anchor="end" size={9} className="fill-cat-blue">
                  0
                </Label>
              </>
            ) : (
              was.map((p, i) => <Arrow key={i} f={FP} from={p} to={beads[i]} tone="teal" w={1.8} />)
            )}
          </g>
        )}
        <path d={pathOf(live)} strokeWidth={2} className="pointer-events-none fill-none stroke-[#0f1b2d]/60" />
        {live.map((p, i) => (
          <circle key={i} cx={FP.sx(p[0])} cy={FP.sy(p[1])} r={5} className="pointer-events-none fill-cat-violet" />
        ))}
      </Plane>
      <div className="text-center text-sm">
        {running && kind === "stretch" ? (
          <span className="rounded-full bg-cat-blue/10 px-3 py-1 text-cat-blue">প্রতিটা পুঁতি 0 থেকে নিজের লাইন ধরে সরছে</span>
        ) : running ? (
          <span className="rounded-full bg-cat-teal/10 px-3 py-1 text-cat-teal">সব পুঁতি একসাথে একই দিকে একই পরিমাণ সরছে</span>
        ) : (
          <span className="rounded-full bg-accent/10 px-3 py-1 text-accent-text">পুঁতিগুলো এখনো একটা সোজা লাইনে ✓</span>
        )}
      </div>
      {!gaveUp && (
        <div className="mt-3 grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-2">
          {MOVES.map((m, i) => (
            <Fragment key={m.btn}>
              {i % 3 === 0 && (
                <span className={`text-xs font-semibold ${m.stretch ? "text-cat-blue" : "text-cat-teal"}`}>{m.stretch ? "Stretch" : "যোগ"}</span>
              )}
              <button
                type="button"
                disabled={running || !onSheet(beads.map(m.go))}
                onClick={() => apply(m)}
                className={`cursor-pointer rounded-xl border-2 px-1 py-2 font-mono text-[0.9rem] transition-colors motion-reduce:transition-none disabled:cursor-default disabled:opacity-40 ${
                  m.stretch ? "border-cat-blue/40 hover:border-cat-blue" : "border-cat-teal/40 hover:border-cat-teal"
                }`}
              >
                {m.btn}
              </button>
            </Fragment>
          ))}
        </div>
      )}
      {moves >= TRIES ? (
        <Speech who="ফাহিম" initial="ফা" tint="blue">
          {bn(moves)} বার চাল দিলাম। দড়ি লম্বা হলো, খাটো হলো, উল্টালো, সরলো, কিন্তু একটুও বাঁকলো না!
        </Speech>
      ) : (
        !gaveUp && (
          <div className="mt-2 flex justify-center">
            <button type="button" onClick={again} className="cursor-pointer text-sm text-muted underline">
              দড়ি আগের জায়গায় ফেরান
            </button>
          </div>
        )
      )}
      {moves >= TRIES && !gaveUp && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={concede} className={`${primaryBtn} bg-cat-coral`}>
            মেনে নিলাম, বাঁকানো যায় না
          </button>
        </div>
      )}
      <Task done={gaveUp}>
        Stretch আর যোগ দিয়ে দড়িটা বাঁকা রাস্তার ওপর বসানোর চেষ্টা করুন ({bn(Math.min(moves, TRIES))}/{bn(TRIES)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for screen 9's explanation, no task: real data is rarely
//      linear. Nine points on a bend, and a straight line tried three ways;
//      whichever way it lies it meets the bend at two points at most.

const FCD = makeFrame(-3.6, 3.6, -2.6, 1.6, 30, 12);
const CD_DOTS: XY[] = [-3, -2.25, -1.5, -0.75, 0, 0.75, 1.5, 2.25, 3].map((x) => [x, (x * x) / 3 - 2]);
/** the lines tried, as [slope, height at x = 0]; each passes through two of the dots */
const CD_LINES: XY[] = [
  [0, -1.25],
  [1, -2],
  [-1, -2],
];
const CD_SAY = [
  "বাঁকা পথ ধরে সাজানো ৯টা data point।",
  "বাঁকা পথ ধরে সাজানো ৯টা data point।",
  "একটা সোজা লাইন বসালাম। ৯টার মধ্যে ছুঁলো মাত্র ২টা।",
  "লাইনটা কাত করলাম, তাও সেই ২টা।",
];
/** the part of y = m·x + c that lies on the sheet */
const onCD = (m: number, c: number): [XY, XY] => {
  let [a, b] = [FCD.x0 + 0.1, FCD.x1 - 0.1];
  if (Math.abs(m) > 1e-6) {
    const [p, q] = [(FCD.y0 + 0.1 - c) / m, (FCD.y1 - 0.1 - c) / m];
    a = Math.max(a, Math.min(p, q));
    b = Math.min(b, Math.max(p, q));
  }
  return [
    [a, m * a + c],
    [b, m * b + c],
  ];
};

export function CurvedData() {
  const s = useScene(4, [500, 1000, 1700, 1700]);
  const k = s.k;
  const [m, c] = useTween(CD_LINES[clamp(k - 2, 0, 2)], 900);
  const [p, q] = onCD(m, c);

  return (
    <Scene scene={s} caption={k < 4 ? CD_SAY[k] : <span className={FADE}>উল্টো দিকে কাত করলেও ২টা। সোজা লাইন যেভাবেই রাখুন, এই বাঁকের ২টার বেশি point ছুঁতে পারে না।</span>}>
      <Plane f={FCD} grid={1} axes={false} label="nine data points on a bend, and a straight line that touches two of them at most" className="max-w-[15rem] my-0!">
        {k >= 2 && (
          <path d={`M${FCD.sx(p[0])} ${FCD.sy(p[1])}L${FCD.sx(q[0])} ${FCD.sy(q[1])}`} strokeWidth={2.4} strokeLinecap="round" className={`${FADE} stroke-cat-blue`} />
        )}
        {k >= 1 &&
          CD_DOTS.map((d, i) => {
            const hit = k >= 2 && Math.abs(d[1] - (m * d[0] + c)) < 0.06;
            return (
              <g key={i} style={{ transitionDelay: `${i * 70}ms` }} className={POP}>
                {hit && <circle cx={FCD.sx(d[0])} cy={FCD.sy(d[1])} r={8.5} strokeWidth={2} className={`${POP} fill-none stroke-accent`} />}
                <circle cx={FCD.sx(d[0])} cy={FCD.sy(d[1])} r={4.5} className={hit ? "fill-accent" : "fill-cat-amber"} />
              </g>
            );
          })}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9¾ · A story scene for screen 9's explanation, no task: নাসিব wins. The
//      straight rope still hangs over the curved road; ফাহিম gives up, নাসিব
//      walks in grinning, and the six jobs are ticked on a board: five done,
//      one not.

const X9_Y = 150;
/** one job on the board: a green tick or a red cross, drawn (no glyphs) */
function X9Mark({ x, y, ok, delay }: { x: number; y: number; ok: boolean; delay: number }) {
  const ink = ok ? "#16a34a" : "#dc2626";
  return (
    <g className={POP} style={{ transitionDelay: `${delay}ms` }}>
      <rect x={x - 7} y={y - 7} width={14} height={14} rx={2.5} fill={ok ? "#dcfce7" : "#fee2e2"} stroke={ink} strokeWidth={1.1} />
      <path
        d={ok ? `M${x - 3.5} ${y}l2.5 2.8l4.5 -5.3` : `M${x - 3} ${y - 3}l6 6m0 -6l-6 6`}
        fill="none"
        stroke={ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function NasibWins() {
  const s = useScene(4, [600, 1500, 1500, 1800]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={100} label="the straight rope still hangs over the curved road; ফাহিম gives up, নাসিব walks in grinning, and a board shows five jobs done and one not">
        <Tree x={302} y={108} s={0.7} />
        <ellipse cx={205} cy={154} rx={54} ry={17} fill="#38bdf8" stroke="#0284c7" strokeWidth={1} />
        <path d="M138 172C148 108 262 108 272 172" fill="none" stroke="#c8a27a" strokeWidth={10} strokeLinecap="round" />
        <path d="M138 172C148 108 262 108 272 172" fill="none" stroke="#e7d3b0" strokeWidth={1} strokeDasharray="4 4" />
        <g transform="translate(205 96)">
          <path d="M-54 21.6L54 -21.6" stroke="#78350f" strokeWidth={1.6} />
          {S9_BEADS.map((t, i) => (
            <circle key={t} cx={t * 24} cy={-t * 9.6} r={5} fill={S9_BEAD_INK[i]} stroke="white" strokeWidth={1.2} />
          ))}
        </g>
        <CastPerson who="fahim" x={104} y={X9_Y} mood="sad" label />
        {k === 1 && <Bubble x={104} y={X9_Y - 66} tone="think" lines={["একটুও", "বাঁকলো না…"]} />}
        <CastPerson who="nasib" x={k >= 2 ? 42 : -30} y={X9_Y} walking={k === 2} mood={k >= 2 ? "smug" : "plain"} arm={k >= 3 ? "wave" : "down"} label={k >= 2} />
        {k >= 3 && <Bubble x={42} y={X9_Y - 70} side="right" lines={["বলেছিলাম না,", "একটা পারবি না!"]} />}
        {k >= 4 && (
          <>
            <g className={POP}>
              <rect x={124} y={8} width={112} height={40} rx={4} fill="white" stroke="#a8a29e" />
              <text x={180} y={21} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#0f1b2d">
                ছয়টা কাজ
              </text>
            </g>
            {[true, true, true, true, true, false].map((ok, i) => (
              <X9Mark key={i} x={137 + i * 17} y={35} ok={ok} delay={250 + i * 150} />
            ))}
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9⅞ · A figure for screen 9's explanation, no task: a GPU is a fast machine
//      for linear combinations. One cell of the chip works out one little
//      recipe, then a whole row of cells at once, then every cell together.

const X9_ROWS = 5;
const X9_COLS = 10;
const X9_SAY = [
  "GPU-র ভেতরে সারি সারি ছোট ছোট ঘর।",
  "একটা ঘর করে একটা ছোট linear combination।",
  "একসারি ঘর, একসাথে দশটা হিসাব।",
  "সব ঘর একসাথে।",
];

export function GpuCores() {
  const s = useScene(4, [600, 1700, 1500, 1500]);
  const k = s.k;
  const lit = (r: number, c: number) => k >= 3 || (k >= 2 && r === 0) || (k >= 1 && r === 0 && c === 0);
  const count = k >= 3 ? X9_ROWS * X9_COLS : k >= 2 ? X9_COLS : 1;

  return (
    <Scene
      scene={s}
      caption={k < 4 ? X9_SAY[k] : <span className={FADE}>হিসাবগুলো এত সরল যে সব ঘর একসাথে চলে, প্রতি সেকেন্ডে কোটি কোটিবার।</span>}
    >
      <div className="flex items-center justify-center gap-3">
        <svg viewBox="0 0 160 100" role="img" aria-label="a GPU chip whose little cells light up one, then a row, then all together" className="block w-[10rem] shrink-0">
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${20 + i * 15} 8v-5M${20 + i * 15} 92v5`} stroke="#94a3b8" strokeWidth={2} />
          ))}
          <rect x={10} y={8} width={140} height={84} rx={6} fill="#0f172a" stroke="#334155" />
          <text x={80} y={20} textAnchor="middle" fontSize={8} fontWeight={700} fill="#94a3b8">
            GPU
          </text>
          <g className={k >= 4 ? "animate-pulse motion-reduce:animate-none" : ""}>
            {Array.from({ length: X9_ROWS * X9_COLS }, (_, i) => {
              const [r, c] = [Math.floor(i / X9_COLS), i % X9_COLS];
              return (
                <rect
                  key={i}
                  x={18 + c * 12.5}
                  y={26 + r * 12.5}
                  width={10}
                  height={10}
                  rx={2}
                  fill={lit(r, c) ? "#34d399" : "#334155"}
                  style={{ transitionDelay: `${k === 3 ? (r + c) * 45 : k === 2 ? c * 50 : 0}ms` }}
                  className="transition-[fill] duration-300 motion-reduce:transition-none"
                />
              );
            })}
          </g>
        </svg>
        <div className="w-[6.5rem] text-center">
          {k >= 1 && k < 4 && (
            <div className={FADE}>
              <div className="text-xs text-muted">একসাথে চলছে</div>
              <div key={count} className={`${POP} text-2xl font-bold text-accent-text`}>
                {bn(count)}টা
              </div>
              <div className="text-xs text-muted">হিসাব</div>
            </div>
          )}
          {k >= 4 && (
            <div className={FADE}>
              <div className="text-xs text-muted">প্রতি সেকেন্ডে</div>
              <div className={`${POP} text-xl font-bold text-accent-text`}>কোটি কোটি</div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 h-5 text-center font-mono text-xs">{k >= 1 && <span className={FADE}>2·(1, 2) + 3·(0, 1) = (2, 7)</span>}</div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for the Check's explanation, no task: 3·(1, 2) − 2·(0, 5)
//       built on paper, a line of the sum at a time. Stretch (1, 2) by 3,
//       turn (0, 5) round and stretch it by 2, join them tip to tail: (3, −4).

const FCR = makeFrame(-0.6, 3.6, -4.6, 6.6, 15, 10);
const CR_LINES: { say: string; math: string }[] = [
  { say: "উপকরণ দুইটা:", math: "(1, 2), (0, 5)" },
  { say: "প্রথমটা 3 দিয়ে stretch:", math: "3·(1, 2) = (3, 6)" },
  { say: "দ্বিতীয়টা উল্টে, 2 দিয়ে stretch:", math: "−2·(0, 5) = (0, −10)" },
  { say: "দুইটা জোড়া দিলে:", math: "(3, −4)" },
];

export function CheckRecipe() {
  const s = useScene(4, [500, 1400, 1500, 1500]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 4 ? "বিয়োগ থাকলেও চাল সেই দুইটাই: stretch, তারপর জোড়া।" : <span className={FADE}>বিয়োগ মানে উল্টো দিকে stretch করে জোড়া দেওয়া। উত্তর (3, −4)।</span>}>
      <div className="flex items-center gap-3">
        <div className="w-[5rem] shrink-0">
          <Plane f={FCR} grid={1} label="3 times (1, 2), then −2 times (0, 5) from its tip, ending at (3, −4)" className="my-0! max-w-none">
            {k >= 1 && (
              <g className={FADE} opacity={k >= 2 ? 0.35 : 1}>
                <Arrow f={FCR} from={O} to={[1, 2]} tone="blue" w={2} />
                <Arrow f={FCR} from={O} to={[0, 5]} tone="coral" w={2} />
              </g>
            )}
            {k >= 2 && <Arrow f={FCR} from={O} to={[3, 6]} tone="blue" w={2.6} draw />}
            {k >= 3 && <Arrow f={FCR} from={[3, 6]} to={[3, -4]} tone="coral" w={2.6} draw />}
            {k >= 4 && <Arrow f={FCR} from={O} to={[3, -4]} tone="violet" w={3} draw />}
            <Dot f={FCR} at={O} r={2.5} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1 text-sm">
          {CR_LINES.slice(0, k).map((l, i) => (
            <div key={l.math} className={`${FADE} mb-1.5`}>
              <div className="text-xs text-muted">{l.say}</div>
              <div className={`font-mono ${i === 3 ? "font-bold text-cat-violet" : ""}`}>{l.math}</div>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10¾ · A figure for the Check's explanation, no task: the two wrong options.
//       A plain 5 hovers over each slot of (1, 2) in turn and belongs to
//       neither, so it has nowhere to go; and squaring is on nobody's list.

const X10_SAY = [
  "(1, 2) + 5: এই 5 বসবে কোন ঘরে?",
  "(1, 2) + 5: এই 5 বসবে কোন ঘরে?",
  "প্রথম ঘরে? কেন প্রথমটায়?",
  "দ্বিতীয় ঘরে? তাও বা কেন?",
  "ঠিক করার কোনো উপায় নাই। তাই vector-এর সাথে সাধারণ সংখ্যা যোগ হয় না।",
];
const X10_SLOT = "absolute top-8 grid size-8 place-items-center rounded-md border-2 transition-colors duration-500 motion-reduce:transition-none";

export function WrongMoves() {
  const s = useScene(5, [600, 1400, 1500, 1600, 1800]);
  const k = s.k;
  // the 5 at rest after the +, or hovering over the first or the second slot
  const [dx, dy] = k === 2 ? [-112, -32] : k === 3 ? [-70, -32] : [0, 0];
  const lost = k >= 4;

  return (
    <Scene scene={s} caption={k < 5 ? X10_SAY[k] : <span className={FADE}>আর (1, 2)²? বর্গ করা যোগও না, stretch-ও না।</span>}>
      <div className="relative mx-auto h-[4.25rem] w-[10.5rem] font-mono text-lg">
        <span className="absolute top-8 left-1 leading-8">(</span>
        <span className={`${X10_SLOT} left-4 ${k === 2 ? "border-dashed border-cat-amber bg-cat-amber/10" : "border-border"}`}>1</span>
        <span className="absolute top-8 left-[3.1rem] leading-8">,</span>
        <span className={`${X10_SLOT} left-[3.65rem] ${k === 3 ? "border-dashed border-cat-amber bg-cat-amber/10" : "border-border"}`}>2</span>
        <span className="absolute top-8 left-[5.8rem] leading-8">)</span>
        <span className={`absolute top-8 left-[6.8rem] leading-8 transition-colors duration-500 motion-reduce:transition-none ${lost ? "text-cat-coral" : ""}`}>+</span>
        <span
          style={{ transform: `translate(${dx}px, ${dy}px)` }}
          className={`absolute top-8 left-32 grid size-8 place-items-center rounded-full border-2 font-bold transition-[transform,color,border-color] duration-700 ease-in-out motion-reduce:transition-none ${
            lost ? "border-cat-coral text-cat-coral line-through decoration-2" : "border-cat-amber text-cat-amber"
          }`}
        >
          5
        </span>
      </div>
      <div className="mt-2 flex h-8 items-center justify-center gap-2">
        {k >= 5 && (
          <span className={`${FADE} flex items-center gap-2`}>
            <span className="font-mono text-lg">(1, 2)²</span>
            <span className="text-sm text-muted">হাতে:</span>
            <span className="rounded-full border border-border px-2 text-sm">যোগ</span>
            <span className="rounded-full border border-border px-2 text-sm">stretch</span>
            <span style={{ transitionDelay: "500ms" }} className={`${POP} inline-block rounded-full border border-dashed border-cat-coral px-2 text-sm text-cat-coral line-through`}>
              বর্গ
            </span>
          </span>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

/** a few spots walked on the tilted field, cell → the a, b pair that lands there */
const SEEN7: Record<string, XY> = { "(1, 1)": [1, 0], "(2, 2)": [2, 0], "(1, 3)": [2, 1], "(2, 4)": [3, 1], "(0, 2)": [1, 1] };

export const fixtures: Fixtures = {
  NasibBet: { start: {}, sealed: { bet: 5 } },
  NasibWager: { scoff: { k: 1 }, list: { k: 3 }, end: {} },
  PosterCards: { cards: { k: 2 }, end: {} },
  CommentDrop: { walk: { k: 1 }, ask: { k: 4 }, end: {} },
  ApaArrives: { label: { k: 2 }, end: {} },
  RemoteGiven: { given: { k: 1 }, end: {} },
  RemoteSwap: { start: { k: 0 }, a: { k: 2 }, end: {} },
  PondRoad: { worry: { k: 2 }, end: {} },
  BalanceCard: { start: {}, shown: { shown: ["ফাহিম", "সামিন", "সোম"] }, pinned: { pin: [160, 62], shown: ["সামিন"] }, held: { pin: [160, 62], held: true }, averaged: { pin: [165, 58], held: true, averaged: true } },
  SumShrink: { start: {}, summed: { stage: 1 }, over: { stage: 2, guess: 2 } },
  ReviewBox: { start: {}, dropped: { sorted: 1, dropped: true }, twins: { sorted: 4, guess: 0 }, over: { sorted: 4, guess: 0, twin: true } },
  ComboBox: { start: {}, near: { n: [1, 2, 1] }, match: { n: [2, 1, 1] } },
  NameParts: { start: {}, half: { done: 3 }, all: { done: 6 } },
  TwoButtons: { start: {}, moving: { at: [2, 1] }, ask: { at: [2, 3], hits: 1 }, over: { at: [-1, 4], hits: 2, guess: 0 } },
  TiltedField: {
    start: {},
    found: { ka: 3, kb: 1, found: true, seen: SEEN7 },
    roaming: { ka: 1, kb: 1, found: true, guess: 0, trip: 3, seen: SEEN7, echo: { n: 1, pair: [1, 1] } },
    back: { ka: 3, kb: 1, found: true, guess: 0, trip: 4, back: true, seen: SEEN7 },
  },
  FinerPresses: { whole: {}, half: { lvl: 1 }, quarter: { lvl: 2 } },
  BasisCompare: { standard: {}, tilted: { pick: 1 }, half: { pick: 2 } },
  TalGach: { standing: { k: 0 }, tower: { k: 2 }, cut: { k: 3 }, end: {} },
  OrderLost: { first: { k: 1 }, end: {} },
  TiffinFill: { roti: { k: 3 }, end: {} },
  CurvedData: { flat: { k: 2 }, end: {} },
  CheckRecipe: { half: { k: 2 }, end: {} },
  MovesOnly: { mid: { k: 2 }, done: {} },
  SlotBySlot: { mid: { k: 3 }, done: {} },
  NobodyAverage: { mid: { k: 2 }, done: {} },
  CentroidGroups: { mid: { k: 2 }, done: {} },
  SameRecipe: { mid: { k: 2 }, done: {} },
  WordTug: { mid: { k: 2 }, done: {} },
  AverageRecipe: { mid: { k: 2 }, done: {} },
  RecipeGrows: { mid: { k: 2 }, done: {} },
  SubscriptTrap: { mid: { k: 2 }, done: {} },
  PressCount: { mid: { k: 2 }, done: {} },
  ReadAloud: { mid: { k: 1 }, done: {} },
  TwoWaysStar: { mid: { k: 2 }, done: {} },
  DataBasis: { mid: { k: 2 }, done: {} },
  NasibWins: { mid: { k: 3 }, done: {} },
  GpuCores: { mid: { k: 2 }, done: {} },
  WrongMoves: { mid: { k: 2 }, done: {} },
  BendIt: {
    start: {},
    stretched: { beads: ROPE.map((p) => times(2, p)), was: ROPE, kind: "stretch", moves: 1 },
    added: { beads: ROPE.map((p) => add(p, [-1, -1])), was: ROPE, kind: "add", moves: 2 },
    tried: { beads: ROPE.map((p) => add(times(2, p), [-1, -1])), was: ROPE.map((p) => times(2, p)), kind: "add", moves: 5 },
    over: { moves: 6, gaveUp: true },
  },
};
