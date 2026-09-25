"use client";

import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Speech, Ticks, pill, predictLook, primaryBtn, quietBtn, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Label, Plane, Star, clamp, dist, makeFrame, plus, same, snap, type Frame, type XY } from "@/components/journey/plane";
import { Loop, Bubble, Card as CastCard, Gate as CastGate, Person, Robot, Stage, Stall, StoryFrame } from "@/components/journey/cast";
import { bn } from "./figure-kit";

// Screens for "Math for AI 3.5 — কাক, পথিক আর দাবার রাজা", told as a Journey.
//
// A lost visitor asks how far ফাহিমের stall is, and three friends answer 5, 7
// and 4, all correctly: the drone flies (the crow), সামিন walks between the
// stall rows, সোম's chess king steps. The reader walks the rows (every
// shortest route is 7 = |3| + |4|), moves the king (4 = max), and matches each
// friend to a formula: L2, L1, L∞. Then what the choice changes: the "exactly
// 1 away" set is a circle, a diamond or a square; one wild gap shouts under L2
// but not under L1; a knob budget measured as a diamond parks the best setting
// on a corner, switching a knob off (lasso); and a photo contest's "no pixel
// more than 5" watches only the worst pixel.
//
// Tailwind only; the sheets are journey/plane, and ink on white paper, the
// stall blocks and the chess board is fixed.

const O: XY = [0, 0];
/** a machine number to two decimals, with a real minus */
const f2 = (n: number) => (n < -0.005 ? `−${(-n).toFixed(2)}` : Math.abs(n).toFixed(2));
const l2 = (v: readonly number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
const l1 = (v: readonly number[]) => v.reduce((s, x) => s + Math.abs(x), 0);
const linf = (v: readonly number[]) => Math.max(...v.map(Math.abs));

const KEY_STEP: Record<string, XY> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
/** Arrow keys nudge something on the sheet by one square. */
const nudger = (move: (d: XY) => void) => (e: KeyboardEvent<SVGSVGElement>) => {
  const d = KEY_STEP[e.key];
  if (!d) return;
  e.preventDefault();
  move(d);
};

const pathOf = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0])} ${f.sy(p[1])}`).join("");

/** The fair's stall blocks: one in every square, streets run on the grid lines. */
function Stalls({ f, cols, rows }: { f: Frame; cols: number; rows: number }) {
  const inset = 5;
  return (
    <g className="pointer-events-none">
      {Array.from({ length: cols * rows }, (_, i) => {
        const x = i % cols;
        const y = Math.floor(i / cols);
        return (
          <rect
            key={i}
            x={f.sx(x) + inset}
            y={f.sy(y + 1) + inset}
            width={f.u - 2 * inset}
            height={f.u - 2 * inset}
            rx={3}
            strokeWidth={1}
            className="fill-[#fdecc4] stroke-[#e2b75a]"
          />
        );
      })}
    </g>
  );
}

function Gate({ f }: { f: Frame }) {
  return (
    <>
      <rect x={f.sx(0) - 6} y={f.sy(0) - 6} width={12} height={12} rx={2} className="pointer-events-none fill-[#0f1b2d]" />
      <Label f={f} at={O} dx={4} dy={20} anchor="start" size={10}>
        Gate
      </Label>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story-scene pieces this journey needs that journey/cast has no one for: the
// robotics club's drone (the crow), the lost ভদ্রলোক with his leaflet, and a
// chess king. Painted ink, like the rest of a Stage.

const CK_INK = "#0f1b2d";
const CK_Y = 150;
const CK_TEAL = "#0f766e";
const CK_CORAL = "#e11d48";
const CK_VIOLET = "#6d28d9";

/** Whether the reader asked for less motion; loops (rotors, a bob, legs) stay still then. */
function useStill() {
  const [still, setStill] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser's motion setting, which the server render cannot see
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return still;
}

/** Something that glides to (x, y) over `ms`, the way cast's Person does. */
function Glide({ x, y, ms = 1200, children }: { x: number; y: number; ms?: number; children: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {children}
    </g>
  );
}

/** The robotics club's drone, its body centred at (x, y), rotors spinning; `label` names it above or below. */
function Drone({ x, y, ms = 1200, label }: { x: number; y: number; ms?: number; label?: "above" | "below" }) {
  const still = useStill();
  const rotor = (cx: number) => (
    <ellipse cx={cx} cy={-9} rx={8} ry={1.6} fill="#64748b" opacity={0.8}>
      {!still && <animate attributeName="rx" values="8;2.5;8" dur="0.16s" repeatCount="indefinite" />}
    </ellipse>
  );
  return (
    <Glide x={x} y={y} ms={ms}>
      <g>
        {!still && <animateTransform attributeName="transform" type="translate" values="0 0;0 -2.5;0 0" dur="1.4s" repeatCount="indefinite" />}
        <path d="M-16 -4H16M-16 -4V-8M16 -4V-8M-7 2l-3 5M7 2l3 5" stroke="#334155" strokeWidth={2} strokeLinecap="round" fill="none" />
        {rotor(-16)}
        {rotor(16)}
        <rect x={-9} y={-8} width={18} height={10} rx={3.5} fill={CK_TEAL} />
        <circle cy={4} r={2.4} fill={CK_INK} />
        <circle cx={4.5} cy={-3.5} r={1.2} fill="#fde047" />
      </g>
      {label && (
        <text y={label === "above" ? -15 : 17} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={CK_INK}>
          drone
        </text>
      )}
    </Glide>
  );
}

/** The lost ভদ্রলোক, feet at (x, y): grey hair, a long panjabi, the fair's leaflet in his hand. */
function Gent({ x, y, facing = 1, walking = false, ms = 1200 }: { x: number; y: number; facing?: 1 | -1; walking?: boolean; ms?: number }) {
  const still = useStill();
  const move = walking && !still;
  const run = `${x},${y}`;
  const skin = "#d8a47a";
  const cloth = "#f5efe0";
  const leg = (px: number, deg: number) => (
    <g>
      <Loop on={move} run={run} ms={ms} type="rotate" values={`${deg} ${px} -22;${-deg} ${px} -22;${deg} ${px} -22`} dur={0.5} />
      <path d={`M${px} -22V-1`} strokeWidth={5} strokeLinecap="round" stroke="#57534e" />
    </g>
  );
  return (
    <Glide x={x} y={y} ms={ms}>
      <g transform={`scale(${facing} 1)`}>
        <g>
          <Loop on={move} run={run} ms={ms} type="translate" values="0 0;0 -1.5;0 0" dur={0.25} />
          {leg(-3.5, 20)}
          {leg(3.5, -20)}
          <path d="M-9 -40H9L11 -13H-11Z" fill={cloth} stroke="#cbbf9f" strokeWidth={1} />
          <path d="M0 -40V-30" stroke="#cbbf9f" strokeWidth={1} />
          <path d="M-8 -38l-3 14" strokeWidth={4} strokeLinecap="round" stroke={cloth} />
          <circle cx={-11} cy={-23} r={2} fill={skin} />
          <path d="M8 -37l8 -6" strokeWidth={4} strokeLinecap="round" stroke={cloth} />
          <circle cx={17} cy={-43.5} r={2} fill={skin} />
          <g transform="rotate(-8 19 -50)">
            <rect x={14} y={-57} width={11} height={14} rx={1} fill="#fde68a" stroke="#b45309" strokeWidth={0.8} />
            <path d="M16 -53h7M16 -50h7M16 -47h5" stroke="#b45309" strokeWidth={0.7} />
          </g>
          <circle cy={-51} r={9} fill={skin} />
          <path d="M-9.5 -52q0 -11 9.5 -11t9.5 11q-6 -6 -19 0Z" fill="#d4d4d8" />
          <path d="M-4.5 -47q4.5 -2.8 9 0q-4.5 1.8 -9 0Z" fill="#a1a1aa" />
          <circle cx={-3.4} cy={-51} r={1.2} fill={CK_INK} />
          <circle cx={3.4} cy={-51} r={1.2} fill={CK_INK} />
          <path d="M1 -56l4 -1.5M-2.5 -43.5l5 -0.8" stroke={CK_INK} strokeWidth={1} strokeLinecap="round" />
        </g>
      </g>
      <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={CK_INK}>
        ভদ্রলোক
      </text>
    </Glide>
  );
}

/** A chess king, centred at (0, 0), about 16 units tall. */
function KingPiece() {
  return (
    <g stroke="white" strokeWidth={0.8}>
      <path d="M-5 6h10l-2 -8h-6Z" fill={CK_VIOLET} />
      <circle cy={-4} r={3} fill={CK_VIOLET} />
      <path d="M0 -12v5M-2 -9.5h4" stroke={CK_VIOLET} strokeWidth={1.6} strokeLinecap="round" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the lost gentleman. He
//      walks up to the Gate with a leaflet and asks “ফাহিমের stall কত দূর?”;
//      the three standing nearby (the drone, সামিন, সোম) answer at once, three
//      different numbers, and he is left puzzled. Which is right stays open.

const S1_AT = { gent: 95, drone: 155, samin: 215, som: 275 };
const S1_DRONE_Y = 92;

export function LostGentleman() {
  const s = useScene(6, [600, 1500, 2600, 900, 900, 1400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="a lost gentleman at the fair's Gate asks how far ফাহিমের stall is; the drone, সামিন and সোম answer 5, 7 and 4">
        <CastGate x={30} y={CK_Y} />
        <Drone x={S1_AT.drone} y={S1_DRONE_Y} label="below" />
        <Person who="samin" x={S1_AT.samin} y={CK_Y} facing={-1} arm={k >= 4 ? "point" : "down"} label />
        <Person who="som" x={S1_AT.som} y={CK_Y} facing={-1} mood={k >= 5 ? "smug" : "plain"} label />
        <Gent x={k >= 1 ? S1_AT.gent : -30} y={CK_Y} walking={k === 1} ms={1400} />
        {k === 2 && <Bubble x={S1_AT.gent} y={CK_Y - 66} lines={["ফাহিমের stall", "কত দূর?"]} />}
        {k >= 3 && <Bubble x={S1_AT.drone} y={S1_DRONE_Y - 14} lines={["5 ঘর!"]} />}
        {k >= 4 && <Bubble x={S1_AT.samin} y={CK_Y - 66} lines={["7 ঘর!"]} />}
        {k >= 5 && <Bubble x={S1_AT.som} y={CK_Y - 66} lines={["4 চাল!"]} />}
        {k >= 6 && <Bubble x={S1_AT.gent} y={CK_Y - 66} tone="think" lines={["কোনটা ঠিক?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · "ফাহিমের stall কত দূর?" The stall is 3 east, 4 north, through the rows.
//     Three friends say 5, 7 and 4. Predict who's right, then watch all three
//     routes drawn: the drone's straight line, the walk, the king's steps.

const FH = makeFrame(0, 3, 0, 4, 44);
const STALL: XY = [3, 4];
const HOW_GUESS = ["5, drone ঠিক", "7, সামিন ঠিক", "4, সোম ঠিক", "তিনজনই ঠিক"];
const CROW_PATH: XY[] = [O, STALL];
const WALK_PATH: XY[] = [O, [3, 0], STALL];
const KING_PATH: XY[] = [O, [1, 1], [2, 2], [3, 3], STALL];

export function HowFar() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [shown, setShown] = useSeed("shown", false);

  const show = () => {
    setShown(true);
    pass("দূরত্ব নির্ভর করে কীভাবে যাবেন।");
  };

  return (
    <>
      <Plane f={FH} axes={false} label="the fair ground: stall blocks, the gate at a corner, ফাহিমের stall 3 blocks east and 4 north" className="max-w-[13rem]">
        <Stalls f={FH} cols={3} rows={4} />
        {shown && (
          <>
            <Draw d={pathOf(FH, WALK_PATH)} strokeWidth={3.5} ms={900} className="stroke-cat-coral" />
            <Draw d={pathOf(FH, KING_PATH)} strokeWidth={3} delay={500} ms={900} className="stroke-cat-violet" />
            <Draw d={pathOf(FH, CROW_PATH)} strokeWidth={3} delay={1000} ms={700} className="stroke-cat-teal" />
            {KING_PATH.slice(1).map((p) => (
              <circle key={p.join()} cx={FH.sx(p[0])} cy={FH.sy(p[1])} r={3.5} className={`${POP} pointer-events-none fill-cat-violet`} />
            ))}
          </>
        )}
        <Gate f={FH} />
        <Star f={FH} at={STALL} done={shown} />
      </Plane>
      {guess !== null && !shown && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={show} className={primaryBtn}>
            তিনজনের পথ এঁকে দেখুন
          </button>
        </div>
      )}
      {shown && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm space-y-1 text-[0.95rem]`}>
          <div className="flex items-center gap-2">
            <i className="h-1 w-6 shrink-0 rounded bg-cat-teal" /> Drone উড়ে গেল সোজা, <b className="font-mono">5</b> ঘর।
          </div>
          <div className="flex items-center gap-2">
            <i className="h-1 w-6 shrink-0 rounded bg-cat-coral" /> সামিন হাঁটলো stall-এর ফাঁক দিয়ে, <b className="font-mono">7</b> ঘর।
          </div>
          <div className="flex items-center gap-2">
            <i className="h-1 w-6 shrink-0 rounded bg-cat-violet" /> রাজা কোণাকুনিও যেতে পারে, <b className="font-mono">4</b> চাল।
          </div>
          <div className="pt-1 text-center">
            {guess === 3 ? "আপনার guess একদম ঠিক!" : "যাকে বেছেছিলেন, সে ঠিকই বলেছে। কিন্তু বাকি দুইজনও কিন্তু ভুল বলেনি।"}
          </div>
        </div>
      )}
      <Speech who="Robotics club-এর drone" initial="ড">
        উড়ে গেলে 5 ঘর।
      </Speech>
      <Speech who="সামিন" initial="সা" tint="teal">
        আমি তো হেঁটে হেঁটে গুনলাম, 7 ঘর।
      </Speech>
      <Speech who="সোম" initial="সো">
        আমার দাবার রাজা 4 চালেই পৌঁছে যায়।
      </Speech>
      <div className="mt-4 text-sm font-medium text-muted">বলুন তো, কার উত্তর ঠিক?</div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {HOW_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, shown, 3)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={shown}>আগে বলুন কার উত্তর ঠিক, তারপর তিনজনের পথ এঁকে মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the question was missing
//      a piece. “কীভাবে গেলে” slides in front of “কত দূর?”, and three ways
//      fan out under it, each on a tiny map of the rows with its own answer:
//      flying 5, walking 7, the king's steps 4.

const X1_F = makeFrame(0, 3, 0, 4, 7, 3);
const X1_WAYS = [
  { how: "উড়ে গেলে", n: 5, pts: CROW_PATH, line: "stroke-cat-teal", ink: "text-cat-teal" },
  { how: "হেঁটে গেলে", n: 7, pts: WALK_PATH, line: "stroke-cat-coral", ink: "text-cat-coral" },
  { how: "রাজার চালে", n: 4, pts: KING_PATH, line: "stroke-cat-violet", ink: "text-cat-violet" },
];
const X1_SAY = [
  "ভদ্রলোকের প্রশ্ন ছিল শুধু এটুকু।",
  "প্রশ্নটার সামনে একটা টুকরা বাদ পড়ে গিয়েছিল।",
  "একই stall, একই (3, 4)। কিন্তু যাওয়ার উপায় বদলালে…",
  "…উত্তরও বদলে যায়।",
];

export function WhichWay() {
  const s = useScene(4, [600, 1400, 1400, 1100]);
  const k = s.k;
  return (
    <Scene
      scene={s}
      caption={s.done ? <span className={FADE}>উপায়টা না বললে “কত দূর?”-এর একটা উত্তর হয় না। এখানেই হলো তিনটা।</span> : X1_SAY[Math.min(k, 3)]}
    >
      <div className="mx-auto max-w-[14rem]">
        <div className="flex items-baseline justify-center text-lg font-semibold whitespace-nowrap">
          <span
            className={`overflow-hidden text-accent-text transition-[max-width,opacity] duration-700 ease-out motion-reduce:transition-none ${
              k >= 1 ? "max-w-32 opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            কীভাবে গেলে&nbsp;
          </span>
          <span>কত দূর?</span>
        </div>
        <div className="mt-1 grid">
          {X1_WAYS.map((w, i) => (
            <div key={w.how} className="flex h-10 items-center gap-3">
              {k >= i + 2 && (
                <>
                  <svg viewBox={`0 0 ${X1_F.W} ${X1_F.H}`} aria-hidden className={`${FADE} h-9 w-auto shrink-0`}>
                    <rect x={X1_F.sx(0)} y={X1_F.sy(4)} width={3 * X1_F.u} height={4 * X1_F.u} rx={1.5} strokeWidth={0.6} className="fill-white stroke-[#cbd5e1]" />
                    {Array.from({ length: 12 }, (_, j) => (
                      <rect key={j} x={X1_F.sx(j % 3) + 1.2} y={X1_F.sy(Math.floor(j / 3) + 1) + 1.2} width={X1_F.u - 2.4} height={X1_F.u - 2.4} rx={0.6} className="fill-[#fdecc4]" />
                    ))}
                    <Draw d={pathOf(X1_F, w.pts)} strokeWidth={2} ms={700} className={w.line} />
                  </svg>
                  <span className={`${FADE} flex-1`}>{w.how}</span>
                  <b className={`${POP} font-mono text-xl ${w.ink}`}>{w.n}</b>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1¾ · A figure for screen 1's explanation, no task: one answer, not three.
//      The ভদ্রলোক is handed 5, 7 and 4, says he'll walk, and keeps the 7.
//      Across the line a machine has room for one answer, and the same three
//      cards hang over its one slot, unpicked: which it takes stays open.

const X1B_CARDS = [
  { text: "5", tone: "teal" as const },
  { text: "7", tone: "coral" as const },
  { text: "4", tone: "blue" as const },
];
const X1B_GENT = 76;
const X1B_BOT = 244;

export function OneSlot() {
  const s = useScene(5, [600, 1200, 1800, 1500, 1300]);
  const k = s.k;
  const still = useStill();
  return (
    <StoryFrame scene={s}>
      <Stage
        backdrop="fair"
        label="the gentleman is handed 5, 7 and 4, says he will walk and keeps the 7; a machine has room for only one answer, and the same three cards hang over its one slot"
      >
        <path d="M160 36V150" stroke={CK_INK} strokeOpacity={0.25} strokeDasharray="3 4" />
        <Gent x={X1B_GENT} y={CK_Y} />
        {k >= 1 &&
          X1B_CARDS.map((c, i) => (
            <g key={c.text} style={{ opacity: k >= 3 && i !== 1 ? 0.2 : 1 }} className="transition-opacity duration-500 motion-reduce:transition-none">
              <CastCard x={X1B_GENT - 26 + i * 26} y={74} text={c.text} tone={c.tone} w={20} />
            </g>
          ))}
        {k >= 3 && <circle cx={X1B_GENT} cy={74} r={15} fill="none" stroke="#16a34a" strokeWidth={2} className={POP} />}
        {k === 2 && <Bubble x={X1B_GENT} y={57} lines={["আমি তো হেঁটে যাবো।"]} />}
        {k >= 3 && <Bubble x={X1B_GENT} y={57} lines={["তাহলে আমার 7।"]} />}
        {k >= 4 && (
          <g className={FADE}>
            <Robot x={X1B_BOT} y={CK_Y} />
            <text x={X1B_BOT} y={CK_Y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={CK_INK}>
              machine
            </text>
            <rect x={X1B_BOT - 14} y={86} width={28} height={20} rx={3} fill="white" stroke={CK_INK} strokeWidth={1.2} strokeDasharray="3 2" />
            <text x={X1B_BOT + 20} y={99} fontSize={8} fontWeight={700} fill={CK_INK}>
              একটাই ঘর
            </text>
          </g>
        )}
        {k >= 5 && (
          <>
            <text x={X1B_BOT} y={101} textAnchor="middle" fontSize={13} fontWeight={800} fill={CK_INK} className={POP}>
              ?
            </text>
            {X1B_CARDS.map((c, i) => (
              <g key={c.text}>
                {!still && <animateTransform attributeName="transform" type="translate" values={`0 0;0 ${i === 1 ? -3 : 3};0 0`} dur="1.6s" repeatCount="indefinite" />}
                <CastCard x={X1B_BOT - 28 + i * 28} y={62} text={c.text} tone={c.tone} w={20} />
              </g>
            ))}
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2a ·A story scene for screen 2's setup, no task: the fair's rows. Stalls
//      stand in a row with walking lanes between them; সামিন sets off from
//      the Gate along the front lane, turns up a gap to ফাহিমের stall, and
//      says he walked 7. Then he wonders about another way; that stays open.

const S2_STALLS = [
  { x: 90, color: "#ef4444" },
  { x: 150, color: "#16a34a" },
  { x: 210, color: "#f59e0b" },
  { x: 270, color: "#2563eb", sign: "ফাহিম" },
];
const S2_ROW_Y = 112;
const S2_LANE_Y = 146;
const S2_TURN_X = 240;
const S2_END_Y = 127;

export function SaminRows() {
  const s = useScene(4, [600, 2300, 1200, 2400]);
  const k = s.k;
  const sx = k >= 1 ? S2_TURN_X : 30;
  const sy = k >= 2 ? S2_END_Y : S2_LANE_Y;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" ground={100} label="stalls in a row with lanes between; সামিন walks from the Gate along the front lane and up a gap to ফাহিমের stall">
        <rect x={0} y={132} width={320} height={22} fill="#ead6b0" />
        {[120, 180, 240].map((x) => (
          <rect key={x} x={x - 8} y={S2_ROW_Y} width={16} height={20} fill="#ead6b0" />
        ))}
        {S2_STALLS.map((t) => (
          <Stall key={t.x} x={t.x} y={S2_ROW_Y} w={44} color={t.color} sign={t.sign} />
        ))}
        <CastGate x={30} y={CK_Y} />
        {k >= 3 && <path d={`M30 ${S2_LANE_Y}H${S2_TURN_X}V${S2_END_Y}`} fill="none" stroke={CK_CORAL} strokeWidth={2} strokeDasharray="1 4" strokeLinecap="round" className={POP} />}
        <Person who="samin" x={sx} y={sy} walking={k === 1 || k === 2} mood={k >= 4 ? "puzzled" : k >= 3 ? "happy" : "plain"} ms={k >= 2 ? 1000 : 2100} label />
        {k === 3 && <Bubble x={S2_TURN_X} y={S2_END_Y - 66} side="left" lines={["হেঁটে হেঁটে 7 ঘর!"]} />}
        {k >= 4 && <Bubble x={S2_TURN_X} y={S2_END_Y - 66} side="left" tone="think" lines={["অন্য পথে গেলে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · Walk the rows. No cutting through stalls: the reader steps east, north,
//     west, south along the streets. Three different routes to the stall;
//     every shortest one is 7.

const FW = makeFrame(0, 3, 0, 4, 44);
const STEP: Record<string, XY> = { E: [1, 0], N: [0, 1], W: [-1, 0], S: [0, -1] };
const STEP_GLYPH: Record<string, string> = { E: "→", N: "↑", W: "←", S: "↓" };
const KEY_DIR: Record<string, string> = { ArrowRight: "E", ArrowUp: "N", ArrowLeft: "W", ArrowDown: "S" };
const MOVES = [
  { d: "N", label: "↑ উত্তরে" },
  { d: "W", label: "← পশ্চিমে" },
  { d: "E", label: "→ পূর্বে" },
  { d: "S", label: "↓ দক্ষিণে" },
];
const pointsOf = (route: string) => {
  const pts: XY[] = [O];
  for (const c of route) pts.push(plus(pts[pts.length - 1], STEP[c]));
  return pts;
};
const inside = (p: XY, f: Frame) => p[0] >= f.x0 && p[0] <= f.x1 && p[1] >= f.y0 && p[1] <= f.y1;
const ROUTE_STROKE = ["stroke-cat-coral", "stroke-cat-blue", "stroke-cat-violet", "stroke-cat-amber"];

export function WalkRows() {
  const pass = useGate();
  const [route, setRoute] = useSeed("route", "");
  const [done, setDone] = useSeed<string[]>("done", []);
  const [again, setAgain] = useState(0);
  const pts = pointsOf(route);
  const at = pts[pts.length - 1];
  const shortest = done.filter((r) => r.length === 7).length;
  const won = shortest >= 3;
  const last = done[done.length - 1];

  const step = (d: string) => {
    if (won) return;
    const next = plus(at, STEP[d]);
    if (!inside(next, FW)) return;
    const r = route + d;
    if (!same(next, STALL)) {
      setAgain(0);
      setRoute(r);
      return;
    }
    setRoute("");
    if (done.includes(r)) {
      setAgain((n) => n + 1);
      return;
    }
    setAgain(0);
    const all = [...done, r];
    setDone(all);
    if (all.filter((x) => x.length === 7).length === 3)
      pass("যে পথেই হাঁটুন, কমপক্ষে 7 ঘর।");
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const d = KEY_DIR[e.key];
    if (!d) return;
    e.preventDefault();
    step(d);
  };

  return (
    <>
      <Plane f={FW} axes={false} label={`walking the streets between stalls, now at (${at.join(", ")}), ${bn(done.length)} routes finished`} onKey={won ? undefined : onKey} className="max-w-[13rem]">
        <Stalls f={FW} cols={3} rows={4} />
        {done.map((r, i) => (
          <path key={r} d={pathOf(FW, pointsOf(r))} strokeWidth={3} strokeLinejoin="round" opacity={0.35} className={`pointer-events-none fill-none ${ROUTE_STROKE[i % ROUTE_STROKE.length]}`} />
        ))}
        {route && <path d={pathOf(FW, pts)} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" className="pointer-events-none fill-none stroke-cat-teal" />}
        <Gate f={FW} />
        <Star f={FW} at={STALL} done={won} />
        {!won && <circle cx={FW.sx(at[0])} cy={FW.sy(at[1])} r={7} strokeWidth={2} className="pointer-events-none fill-white stroke-cat-teal" />}
      </Plane>
      {!won && (
        <div className="mx-auto grid max-w-xs grid-cols-2 gap-2">
          {MOVES.map((m) => (
            <button key={m.d} type="button" onClick={() => step(m.d)} disabled={!inside(plus(at, STEP[m.d]), FW)} className={`${quietBtn} justify-center`}>
              {m.label}
            </button>
          ))}
        </div>
      )}
      <div className="mt-2 min-h-7 text-center text-[0.95rem]">
        {again > 0 ? null : route ? (
          <span className="text-muted">
            এখন পর্যন্ত হাঁটলেন <b className="font-mono">{route.length}</b> ঘর।
          </span>
        ) : last ? (
          <span key={done.length} className={FADE}>
            {last.length === 7 ? `পৌঁছে গেলেন, ${bn(7)} ঘরে।` : `পৌঁছালেন ঠিকই, কিন্তু ${bn(last.length)} ঘরে। মনে হচ্ছে একটু ঘুরপথে এসেছেন।`}
            {!won && " এবার অন্য একটা পথ ধরে দেখুন।"}
          </span>
        ) : (
          <span className="text-muted">Gate থেকে হাঁটা শুরু করুন। মনে রাখবেন, stall-এর ভেতর দিয়ে যাওয়া যাবে না।</span>
        )}
      </div>
      {again > 0 && <Nope key={again}>এই পথে তো আগেই এসেছেন! এবার মোড়গুলো একটু অন্যভাবে নিয়ে দেখুন।</Nope>}
      {route && !won && (
        <div className="mt-1 flex justify-center">
          <button type="button" onClick={() => setRoute("")} className={`${quietBtn} h-9 border-border text-muted`}>
            Gate-এ ফিরে যান
          </button>
        </div>
      )}
      {done.length > 0 && (
        <div className="mx-auto mt-3 max-w-sm rounded-2xl border border-border px-4 py-2">
          {done.map((r, i) => (
            <div key={r} className={`${FADE} flex items-baseline justify-between gap-3 py-0.5`}>
              <span className="text-sm text-muted">পথ {bn(i + 1)}</span>
              <span className="min-w-0 truncate text-lg leading-none">{[...r].map((c) => STEP_GLYPH[c]).join("")}</span>
              <b className={`shrink-0 font-mono ${r.length === 7 ? "text-cat-teal" : "text-muted"}`}>{r.length}</b>
            </div>
          ))}
        </div>
      )}
      {won && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-coral/5 px-3 py-3 text-center font-mono`}>
          হাঁটা = |3| + |4| = <b className="text-cat-coral">7</b>
        </div>
      )}
      <Task done={won}>
        তিনটা আলাদা পথ ধরে stall-এ পৌঁছান, প্রতিবার যত কম ঘর হেঁটে পারেন ({bn(Math.min(shortest, 3))}/৩)।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2¼ · A figure for screen 2's explanation, no task: the table of routes,
//      sorted. Three shortest routes, one tile per step (EEENNNN, NNNNEEE,
//      ENENENN); then each row's tiles slide into order, easts first, and all
//      three turn out to be the same 3 east and 4 north.

const X2_ROUTES = ["EEENNNN", "NNNNEEE", "ENENENN"];
const X2_SLOT = 28;
/** where each step's tile sits once sorted: the easts first, then the norths */
const x2Sorted = (route: string) => {
  let e = 0;
  let n = 0;
  return route.split("").map((c) => (c === "E" ? e++ : 3 + n++));
};
const X2_SAY = [
  "তিনটা ছোট পথ। একেকটা tile মানে এক ঘর হাঁটা।",
  "তিনটা ছোট পথ। একেকটা tile মানে এক ঘর হাঁটা।",
  "তিনটা ছোট পথ। একেকটা tile মানে এক ঘর হাঁটা।",
  "পা ফেলার ক্রম তিন রকম। এবার প্রতিটা সারি সাজিয়ে রাখি, আগে পূর্বের, পরে উত্তরের।",
  "সাজাতেই তিনটা সারি হুবহু এক।",
];

function X2Tile({ dir, slot }: { dir: string; slot: number }) {
  return (
    <span
      style={{ left: slot * X2_SLOT }}
      className={`absolute top-0 grid size-6 place-items-center rounded-md transition-[left] duration-700 ease-in-out motion-reduce:transition-none ${
        dir === "E" ? "bg-cat-blue/15 text-cat-blue" : "bg-cat-amber/20 text-cat-amber"
      }`}
    >
      <svg viewBox="0 0 16 16" aria-hidden className={`size-3.5 ${dir === "N" ? "-rotate-90" : ""}`}>
        <path d="M2.5 8H12.5M8.5 4L12.5 8L8.5 12" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function SameSteps() {
  const s = useScene(5, [600, 800, 800, 1300, 1500]);
  const k = s.k;
  const w = 7 * X2_SLOT - 4;
  return (
    <Scene
      scene={s}
      caption={s.done ? <span className={FADE}>তিনটা পথই আসলে পূর্বে 3 ঘর আর উত্তরে 4 ঘর, মোট 7। বদলায় শুধু ক্রম।</span> : X2_SAY[k]}
    >
      <div className="mx-auto w-fit">
        {X2_ROUTES.map((r, i) => {
          const slots = x2Sorted(r);
          return (
            <div key={r} className="flex h-8 items-center gap-2">
              <span className="w-9 text-xs text-muted">পথ {bn(i + 1)}</span>
              <div className="relative h-6" style={{ width: w }}>
                {k >= i + 1 && (
                  <div className={FADE}>
                    {r.split("").map((c, j) => (
                      <X2Tile key={j} dir={c} slot={k >= 4 ? slots[j] : j} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div className="flex h-7 items-start gap-2">
          <span className="w-9" />
          <div className="relative text-xs" style={{ width: w }}>
            {k >= 5 && (
              <>
                <div style={{ width: 3 * X2_SLOT - 4 }} className={`${FADE} absolute top-1 left-0 border-t-2 border-cat-blue pt-0.5 text-center text-cat-blue`}>
                  পূর্বে 3
                </div>
                <div style={{ left: 3 * X2_SLOT, width: 4 * X2_SLOT - 4 }} className={`${FADE} absolute top-1 border-t-2 border-cat-amber pt-0.5 text-center text-cat-amber`}>
                  উত্তরে 4
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2½ ·A figure for screen 2's explanation, no task: the stall moved west, to
//      card (−3, 4). The walker steps 3 squares west and then 4 north, one
//      square a beat, beside the faint old route east; a minus sign never
//      saves a step, so |−3| + |4| = 7, the same as before.

const WW_F = makeFrame(-3, 3, 0, 4, 26);
const WW_STALL: XY = [-3, 4];
const WW_PATH: XY[] = [O, [-1, 0], [-2, 0], [-3, 0], [-3, 1], [-3, 2], [-3, 3], WW_STALL];
const WW_OLD: XY[] = [O, [3, 0], STALL];
const WW_STEPS = WW_PATH.length; // beats 1…7 walk a square each, beat 8 writes the sum
const WW_MS = [900, 420, 420, 800, 420, 420, 420, 700];

export function WestWalk() {
  const s = useScene(WW_STEPS, WW_MS);
  const at = Math.min(s.k, WW_PATH.length - 1);
  const [x, y] = WW_PATH[at];

  return (
    <Scene
      scene={s}
      caption={
        s.done ? (
          <span className={FADE}>
            পূর্বের stall-এর মতোই {bn(7)} ঘর। Minus চিহ্ন একটা পা-ও কমায় না: <span className="font-mono">|−3| + |4| = 7</span>।
          </span>
        ) : at === 0 ? (
          "Stall এবার পশ্চিমে, card (−3, 4)। আগের পথটা হালকা করে রাখা আছে।"
        ) : at <= 3 ? (
          `পশ্চিমে ${bn(at)} ঘর। Card-এ minus লেখা, কিন্তু পা তো ফেলতেই হচ্ছে।`
        ) : (
          `পশ্চিমে ${bn(3)}, উত্তরে ${bn(at - 3)}। এখন পর্যন্ত ${bn(at)} ঘর।`
        )
      }
    >
      <Plane f={WW_F} axes={false} label="the stall moved west to (−3, 4): the walker goes 3 west and 4 north, 7 squares, like the old route east" className="my-2! max-w-[14rem]">
        {Array.from({ length: 24 }, (_, i) => (
          <rect
            key={i}
            x={WW_F.sx((i % 6) - 3) + 4}
            y={WW_F.sy(Math.floor(i / 6) + 1) + 4}
            width={WW_F.u - 8}
            height={WW_F.u - 8}
            rx={2.5}
            strokeWidth={1}
            className="pointer-events-none fill-[#fdecc4] stroke-[#e2b75a]"
          />
        ))}
        <path d={pathOf(WW_F, WW_OLD)} strokeWidth={3} strokeDasharray="5 5" strokeLinejoin="round" className="pointer-events-none fill-none stroke-cat-coral/45" />
        <circle cx={WW_F.sx(STALL[0])} cy={WW_F.sy(STALL[1])} r={5} strokeWidth={1.5} className="pointer-events-none fill-white stroke-cat-coral/60" />
        {at > 0 && (
          <path d={pathOf(WW_F, WW_PATH.slice(0, at + 1))} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" className="pointer-events-none fill-none stroke-cat-teal" />
        )}
        <Gate f={WW_F} />
        <circle
          cx={WW_F.sx(x)}
          cy={WW_F.sy(y)}
          r={7}
          strokeWidth={2}
          className="pointer-events-none fill-white stroke-cat-teal transition-[cx,cy] duration-300 motion-reduce:transition-none"
        />
        <Star f={WW_F} at={WW_STALL} done={s.done} />
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2¾ · A figure for screen 2's explanation, no task: Manhattan's taxi. A city
//      cut into blocks; the straight line to (3, 4) runs through buildings, so
//      the taxi drives the streets, 3 blocks east and 4 north, and the sum
//      |3| + |4| = 7 is written term by term, the name landing last.

const X2B_F = makeFrame(0, 3, 0, 4, 28, 8);
const X2B_SAY = [
  "ছক কাটা একটা শহর। Taxi যাবে (3, 4)-এ।",
  "কোণাকুনি সোজা পথটা building-এর ভেতর দিয়ে। Taxi ওদিকে যেতে পারে না।",
  "তাই রাস্তা ধরে আগে পূর্বে 3 block…",
  "…তারপর উত্তরে 4 block।",
];

export function TaxiGrid() {
  const s = useScene(4, [600, 1400, 1500, 1500]);
  const k = s.k;
  const goal: XY = k >= 3 ? STALL : k >= 2 ? [3, 0] : O;
  const [tx, ty] = useTween(goal, 1000);
  const f = X2B_F;
  const cross = `M${f.sx(1.5) - 5} ${f.sy(2) - 5}l10 10M${f.sx(1.5) + 5} ${f.sy(2) - 5}l-10 10`;
  return (
    <Scene scene={s} caption={s.done ? <span className={FADE}>ছক কাটা শহরের দূরত্ব, তাই এর নাম Manhattan distance।</span> : X2B_SAY[k]}>
      <div className="flex items-center justify-center gap-5">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={f} grid={0} axes={false} label="a city grid: the straight line to (3, 4) crosses buildings, so the taxi drives 3 blocks east and 4 north, |3| + |4| = 7" className="my-0! max-w-none">
            {Array.from({ length: 12 }, (_, i) => (
              <rect
                key={i}
                x={f.sx(i % 3) + 5}
                y={f.sy(Math.floor(i / 3) + 1) + 5}
                width={f.u - 10}
                height={f.u - 10}
                rx={2}
                strokeWidth={1}
                className="pointer-events-none fill-[#e2e8f0] stroke-[#94a3b8]"
              />
            ))}
            {k >= 1 && (
              <>
                <path d={pathOf(f, CROW_PATH)} strokeWidth={2} strokeDasharray="4 4" className={`${FADE} pointer-events-none fill-none stroke-cat-teal`} />
                <path d={cross} strokeWidth={2.5} strokeLinecap="round" className={`${POP} pointer-events-none stroke-danger`} />
              </>
            )}
            {k >= 2 && <Draw d={pathOf(f, [O, [3, 0]])} strokeWidth={3} ms={900} className="stroke-cat-amber" />}
            {k >= 3 && <Draw d={pathOf(f, [[3, 0], STALL])} strokeWidth={3} ms={900} className="stroke-cat-amber" />}
            <Star f={f} at={STALL} done={s.done} />
            <g transform={`translate(${f.sx(tx)} ${f.sy(ty)}) rotate(${k >= 3 ? -90 : 0})`} className="pointer-events-none">
              <rect x={-8} y={-5} width={16} height={10} rx={2.5} fill="#facc15" stroke={CK_INK} strokeWidth={1} />
              <rect x={-3.5} y={-3.5} width={6} height={7} rx={1} fill={CK_INK} opacity={0.65} />
              <path d="M6 -3.5V-1.5M6 1.5V3.5" stroke="#fef9c3" strokeWidth={1.6} />
            </g>
          </Plane>
        </div>
        <div className="grid min-w-0 gap-0.5">
          <div className="font-mono text-lg font-semibold whitespace-nowrap">
            <span className={k >= 2 ? FADE : "invisible"}>|3|</span> <span className={k >= 3 ? FADE : "invisible"}>+ |4|</span>
          </div>
          <div className={`font-mono text-lg font-semibold ${k >= 4 ? FADE : "invisible"}`}>= 7</div>
          <b className={`text-sm leading-tight ${s.done ? FADE : "invisible"}`}>
            Manhattan
            <br />
            distance
          </b>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a ·A story scene for screen 3's setup, no task: সোম's chess king. সোম
//      walks up to a board on an easel; the king steps one square sideways,
//      then one square slantwise, and then every square around it lights up,
//      all eight a single move. সোম claims 4 moves are enough. Whether fewer
//      would do is the screen's question, so the king never heads for (3, 4).

const S3_SQ = 16;
const S3_X0 = 180;
const S3_Y0 = 34;
const S3_SOM = 118;
const s3At = (c: number, r: number): XY => [S3_X0 + c * S3_SQ + S3_SQ / 2, S3_Y0 + r * S3_SQ + S3_SQ / 2];

export function SomsKing() {
  const s = useScene(5, [600, 1500, 1200, 1200, 1800]);
  const k = s.k;
  const [kc, kr] = k >= 3 ? [2, 1] : k >= 2 ? [3, 2] : [2, 2];
  const [px, py] = s3At(kc, kr);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="সোম at a chess board on an easel: the king steps one square, then one slantwise, then all eight squares around it light up">
        <path d={`M${S3_X0 + 12} ${S3_Y0 + 84}L${S3_X0} ${CK_Y}M${S3_X0 + 68} ${S3_Y0 + 84}L${S3_X0 + 82} ${CK_Y}M${S3_X0 + 40} ${S3_Y0 + 84}V${CK_Y - 2}`} stroke="#78350f" strokeWidth={3} strokeLinecap="round" />
        <rect x={S3_X0 - 5} y={S3_Y0 - 5} width={5 * S3_SQ + 10} height={5 * S3_SQ + 10} rx={3} fill="#78350f" />
        {Array.from({ length: 25 }, (_, i) => {
          const c = i % 5;
          const r = Math.floor(i / 5);
          return <rect key={i} x={S3_X0 + c * S3_SQ} y={S3_Y0 + r * S3_SQ} width={S3_SQ} height={S3_SQ} fill={(c + r) % 2 ? "#b58863" : "#f0d9b5"} />;
        })}
        {k >= 4 &&
          [-1, 0, 1].flatMap((dc) =>
            [-1, 0, 1]
              .filter((dr) => dc || dr)
              .map((dr) => {
                const [cx, cy] = s3At(kc + dc, kr + dr);
                return <rect key={`${dc}${dr}`} x={cx - 6} y={cy - 6} width={12} height={12} rx={3} fill="#fde047" opacity={0.85} className={POP} />;
              }),
          )}
        <Glide x={px} y={py} ms={700}>
          <KingPiece />
        </Glide>
        <Person who="som" x={k >= 1 ? S3_SOM : -30} y={CK_Y} walking={k === 1} mood={k >= 5 ? "smug" : "happy"} arm={k >= 2 ? "point" : "down"} ms={1400} label />
        {k >= 5 && <Bubble x={S3_SOM} y={CK_Y - 66} lines={["4 চালই যথেষ্ট!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · সোম's chess king: one square any way, diagonals too. Reach (3, 4) in as
//     few moves as the reader can; the board only lets it go at 4.

const FK = makeFrame(-0.5, 4.5, -0.5, 4.5, 40, 12);
const KING_GOAL: XY = [3, 4];
const kingStep = (a: XY, b: XY) => linf([a[0] - b[0], a[1] - b[1]]) === 1;

function Crown({ at }: { at: XY }) {
  return (
    <g
      style={{ transform: `translate(${FK.sx(at[0])}px, ${FK.sy(at[1])}px)` }}
      className="pointer-events-none transition-transform duration-300 ease-out motion-reduce:transition-none"
    >
      <circle r={14} className="fill-white/70" />
      <path d="M-9 7L-10 -5L-4.5 0L0 -9L4.5 0L10 -5L9 7Z" strokeWidth={1.5} strokeLinejoin="round" className="fill-[#0f1b2d] stroke-white" />
    </g>
  );
}

export function KingMoves() {
  const pass = useGate();
  const [trail, setTrail] = useSeed<XY[]>("trail", [O]);
  const [won, setWon] = useSeed("won", false);
  const [best, setBest] = useState<number | null>(null);
  const king = trail[trail.length - 1];
  const moves = trail.length - 1;
  const arrived = same(king, KING_GOAL);

  const tap = (p: XY) => {
    if (arrived) return;
    const t = snap(p, FK);
    if (!kingStep(king, t)) return;
    const next = [...trail, t];
    setTrail(next);
    if (!same(t, KING_GOAL)) return;
    const n = next.length - 1;
    setBest((b) => (b === null ? n : Math.min(b, n)));
    if (n === 4) {
      setWon(true);
      pass("রাজার দূরত্ব বড় ঘরটা: max(3, 4) = 4।");
    }
  };

  return (
    <>
      <Plane f={FK} grid={0} axes={false} paper={false} label={`a chess king at (${king.join(", ")}) after ${moves} moves, heading for (3, 4)`} drag={arrived ? undefined : { down: tap }} className="max-w-[15rem]">
        {Array.from({ length: 25 }, (_, i) => {
          const x = i % 5;
          const y = Math.floor(i / 5);
          const next = !arrived && kingStep(king, [x, y]);
          return (
            <rect
              key={i}
              x={FK.sx(x - 0.5)}
              y={FK.sy(y + 0.5)}
              width={FK.u}
              height={FK.u}
              className={`${(x + y) % 2 ? "fill-[#f0dcb4]" : "fill-[#c79a62]"} ${next ? "cursor-pointer" : ""}`}
            />
          );
        })}
        {!arrived &&
          Array.from({ length: 25 }, (_, i): XY => [i % 5, Math.floor(i / 5)])
            .filter((q) => kingStep(king, q))
            .map((q) => <circle key={q.join()} cx={FK.sx(q[0])} cy={FK.sy(q[1])} r={5} className="pointer-events-none fill-cat-teal/60" />)}
        <rect x={FK.sx(KING_GOAL[0] - 0.5) + 2} y={FK.sy(KING_GOAL[1] + 0.5) + 2} width={FK.u - 4} height={FK.u - 4} strokeWidth={3} className="pointer-events-none fill-none stroke-cat-amber" />
        <path d={pathOf(FK, trail)} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" className="pointer-events-none fill-none stroke-cat-violet" />
        {trail.slice(0, -1).map((p, i) => (
          <circle key={i} cx={FK.sx(p[0])} cy={FK.sy(p[1])} r={3.5} className="pointer-events-none fill-cat-violet" />
        ))}
        <Crown at={king} />
      </Plane>
      <div className="text-center">
        চাল: <b key={moves} className={`${POP} inline-block font-mono text-lg`}>{moves}</b>
      </div>
      <div className="mt-1 min-h-7 text-center text-[0.95rem]">
        {won ? (
          <span className={`${FADE} text-accent-text`}>৪ চালেই পৌঁছে গেলেন! এর চেয়ে কম চালে রাজাও পারে না।</span>
        ) : arrived ? (
          <span className={FADE}>পৌঁছালেন {bn(moves)} চালে। রাজা কিন্তু আরও কম চালে পারে, আরেকবার চেষ্টা করুন।</span>
        ) : moves === 0 ? (
          <span className="text-muted">সবুজ বিন্দুগুলোতে tap করে রাজাকে সরান। যেতে হবে হলুদ ঘরটায়।</span>
        ) : best !== null ? (
          <span className="text-muted">আগের বার লেগেছিল {bn(best)} চাল।</span>
        ) : null}
      </div>
      {arrived && !won && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={() => setTrail([O])} className={quietBtn}>
            রাজাকে কোণায় ফিরিয়ে আনুন
          </button>
        </div>
      )}
      {won && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-violet/5 px-3 py-3 text-center font-mono`}>
          রাজার চাল = max(|3|, |4|) = <b className="text-cat-violet">4</b>
        </div>
      )}
      <Task done={won}>রাজাকে হলুদ ঘরে নিয়ে যান, যত কম চালে পারেন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: two jobs in one move.
//      The king goes diagonally three times, and each move takes one square
//      off both "east left" and "north left"; east runs out after 3 moves,
//      one square north is left, and the total is 4, the bigger of 3 and 4.

const X3_F = makeFrame(-0.5, 3.5, -0.5, 4.5, 26, 6);
const X3_PATH: XY[] = [O, [1, 1], [2, 2], [3, 3], STALL];
const X3_SAY = [
  "রাজা Gate-এ। Stall পর্যন্ত পূর্বে 3 ঘর, উত্তরে 4 ঘর বাকি।",
  "এক কোণাকুনি চাল, আর দুই দিকেই এক ঘর করে কমলো।",
  "আবার কোণাকুনি। এক চালে দুইটা কাজ।",
  "পূর্বের 3 ঘর শেষ, মাত্র 3 চালেই।",
];

export function KingTwoInOne() {
  const s = useScene(4, [700, 1300, 1300, 1400]);
  const k = s.k;
  const at = X3_PATH[k];
  const f = X3_F;
  const rows: [string, number][] = [
    ["পূর্বে বাকি", 3 - at[0]],
    ["উত্তরে বাকি", 4 - at[1]],
    ["চাল", k],
  ];
  return (
    <Scene
      scene={s}
      caption={s.done ? <span className={FADE}>বাকি 1 ঘর উত্তরে, শেষ চালে। মোট 4 চাল, বড় ঘরটার সমান। ছোট 3 তার ভেতরেই হজম।</span> : X3_SAY[k]}
    >
      <div className="flex items-center justify-center gap-5">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={f} grid={0} axes={false} label="a chess board: the king moves diagonally three times, then once north, reaching (3, 4) in 4 moves" className="my-0! max-w-none">
            {Array.from({ length: 20 }, (_, i) => {
              const c = i % 4;
              const r = Math.floor(i / 4);
              return (
                <rect
                  key={i}
                  x={f.sx(c - 0.5)}
                  y={f.sy(r + 0.5)}
                  width={f.u}
                  height={f.u}
                  className={`pointer-events-none ${(c + r) % 2 ? "fill-[#e7d3b1]" : "fill-[#faf3e6]"}`}
                />
              );
            })}
            <Star f={f} at={STALL} done={s.done} />
            {k >= 1 && (
              <path
                d={pathOf(f, X3_PATH.slice(0, k + 1))}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none fill-none stroke-cat-violet/70"
              />
            )}
            <g
              style={{ transform: `translate(${f.sx(at[0])}px, ${f.sy(at[1])}px)` }}
              className="pointer-events-none transition-transform duration-500 ease-out motion-reduce:transition-none"
            >
              <circle r={10} className="fill-white/80" />
              <path d="M-7 5L-7.5 -4L-3.5 0L0 -7L3.5 0L7.5 -4L7 5Z" strokeWidth={1.2} strokeLinejoin="round" className="fill-[#0f1b2d] stroke-white" />
            </g>
          </Plane>
        </div>
        <div className="grid grid-cols-[auto_auto] items-baseline gap-x-3 gap-y-1">
          {rows.map(([label, v]) => (
            <div key={label} className="contents">
              <span className="text-sm text-muted">{label}</span>
              <b key={v} className={`${POP} inline-block font-mono text-lg ${label === "চাল" ? "text-cat-violet" : v === 0 ? "text-accent-text" : ""}`}>
                {v}
              </b>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a ·A story scene for screen 4's setup, no task: line the three up. The
//      drone flies in and সামিন and সোম walk in, side by side; each holds up
//      their number for (3, 4), 5, 7 and 4, and a blank name sign pops up
//      beside each one. The names themselves are the screen's to give.

const S4_AT = { drone: 70, samin: 160, som: 250 };
const S4_DRONE_Y = 64;

function S4Sign({ x }: { x: number }) {
  return (
    <g className={POP}>
      <path d={`M${x} ${CK_Y}V${CK_Y - 18}`} stroke="#78350f" strokeWidth={2} />
      <rect x={x - 14} y={CK_Y - 30} width={28} height={13} rx={2} fill="white" stroke="#b45309" strokeWidth={1.2} strokeDasharray="3 2" />
      <text x={x} y={CK_Y - 20.5} textAnchor="middle" fontSize={8} fontWeight={700} fill="#b45309">
        নাম?
      </text>
    </g>
  );
}

export function LineUpThree() {
  const s = useScene(5, [600, 1600, 900, 900, 1200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="the drone, সামিন and সোম line up side by side, holding up 5, 7 and 4, each beside a blank name sign">
        <Drone x={k >= 1 ? S4_AT.drone : -40} y={S4_DRONE_Y} ms={1500} label="above" />
        {k >= 2 && (
          <>
            <path d={`M${S4_AT.drone} ${S4_DRONE_Y + 6}V${S4_DRONE_Y + 20}`} stroke="#334155" strokeWidth={1} className={POP} />
            <CastCard x={S4_AT.drone} y={S4_DRONE_Y + 29} text="5" w={22} />
          </>
        )}
        <Person who="samin" x={k >= 1 ? S4_AT.samin : 370} y={CK_Y} facing={k >= 2 ? 1 : -1} walking={k === 1} arm={k >= 3 ? "hold" : "down"} ms={1500} label />
        {k >= 3 && <CastCard x={S4_AT.samin} y={CK_Y - 76} text="7" tone="coral" w={22} />}
        <Person who="som" x={k >= 1 ? S4_AT.som : 420} y={CK_Y} facing={k >= 2 ? 1 : -1} walking={k === 1} arm={k >= 4 ? "hold" : "down"} ms={1500} label />
        {k >= 4 && <CastCard x={S4_AT.som} y={CK_Y - 76} text="4" tone="blue" w={22} />}
        {k >= 5 && [S4_AT.drone, S4_AT.samin, S4_AT.som].map((x) => <S4Sign key={x} x={x + 30} />)}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · Name the three. Each friend's number for (3, 4) gets matched to the
//     working that gives it; only then do the names L2, L1, L∞ appear.

const FRIENDS3 = [
  { who: "Drone", said: 5, name: "L2", sub: "‖v‖₂", tone: "text-cat-teal" },
  { who: "সামিন", said: 7, name: "L1", sub: "‖v‖₁", tone: "text-cat-coral" },
  { who: "সোমের রাজা", said: 4, name: "L∞", sub: "‖v‖∞", tone: "text-cat-violet" },
];
const FORMS = [
  { t: "√(3² + 4²)", val: 5 },
  { t: "|3| + |4|", val: 7 },
  { t: "max(|3|, |4|)", val: 4 },
];
const FORM_ORDER = [1, 2, 0];

export function NameThree() {
  const pass = useGate();
  const [got, setGot] = useSeed<boolean[]>("got", [false, false, false]);
  const [miss, setMiss] = useState<{ row: number; form: number; n: number } | null>(null);
  const all = got.every(Boolean);

  const pick = (row: number, form: number) => {
    if (form !== row) {
      setMiss((m) => ({ row, form, n: (m?.n ?? 0) + 1 }));
      return;
    }
    setMiss(null);
    const next = got.map((g, i) => g || i === row);
    setGot(next);
    if (next.every(Boolean)) pass("একই (3, 4): L2 5, L1 7, L∞ 4।");
  };

  return (
    <>
      <div className="mt-4 text-center font-mono text-xl font-bold text-cat-blue">v = (3, 4)</div>
      <div className="mt-1 text-center text-sm text-muted">কার সংখ্যাটা কোন হিসাব থেকে আসলো? প্রত্যেকের পাশে ঠিক হিসাবটা বেছে দিন।</div>
      <div className="mx-auto mt-3 grid max-w-md gap-2.5">
        {FRIENDS3.map((fr, row) => (
          <div key={fr.who} className={`rounded-2xl border-2 px-3 py-2.5 transition-colors duration-300 motion-reduce:transition-none ${got[row] ? "border-accent/40 bg-accent/5" : "border-border"}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span>
                {fr.who} বলেছিল <b className="font-mono">{fr.said}</b>
              </span>
              {got[row] && all && (
                <span className={`${POP} inline-block font-mono font-bold ${fr.tone}`}>
                  {fr.name} · {fr.sub}
                </span>
              )}
            </div>
            {got[row] ? (
              <div className={`${FADE} mt-1 font-mono`}>
                {FORMS[row].t} = <b className={fr.tone}>{fr.said}</b>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {FORM_ORDER.map((k) => (
                  <button key={k} type="button" onClick={() => pick(row, k)} className={pill(false)}>
                    {FORMS[k].t}
                  </button>
                ))}
              </div>
            )}
            {miss?.row === row && (
              <Nope key={miss.n}>
                {FORMS[miss.form].t} হিসাব করলে আসে {FORMS[miss.form].val}, কিন্তু {fr.who} তো বলেছিল {fr.said}। আরেকবার ভাবুন।
              </Nope>
            )}
          </div>
        ))}
      </div>
      {all && (
        <div className={`${FADE} mx-auto mt-3 max-w-md rounded-2xl bg-cat-blue/5 px-4 py-3 text-center text-[0.95rem]`}>
          তিনটা মাপেরই আলাদা নাম আছে: <b>L2</b>, <b>L1</b>, <b>L∞</b>। কোনটার কথা বলা হচ্ছে, সেটা দুই দাগের নিচে ছোট করে লেখা থাকে। আর শুধু <span className="font-mono">‖v‖</span> লেখা থাকলে ধরে নিতে হয় L2, মানে ফিতার মাপ।
        </div>
      )}
      <Task done={all}>তিনজনের সংখ্যার পাশে ঠিক হিসাবটা বসান ({bn(got.filter(Boolean).length)}/৩)।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the three rules of
//      length, checked for all three tapes on (3, 4). None is negative (5, 7,
//      4); stretched to (6, 8) each is exactly twice (10, 14, 8); the detour by
//      (3, 0) is 3 + 4 = 7, never shorter than the straight measure. All pass,
//      so all three are norms.

const X4_TAPES = [
  { who: "কাক", ink: "text-cat-teal" },
  { who: "পথিক", ink: "text-cat-coral" },
  { who: "রাজা", ink: "text-cat-violet" },
];
const X4_RULES = [
  { rule: "negative না", on: "(3, 4)", cells: ["5", "7", "4"] },
  { rule: "2 গুণ stretch", on: "(6, 8)", cells: ["10", "14", "8"] },
  { rule: "ঘুরপথ ছোট না", on: "(3, 0)", via: "হয়ে", cells: ["7 ≥ 5", "7 ≥ 7", "7 ≥ 4"] },
];
const X4_SAY = [
  "length এর  তিনটা নিয়ম, তিনটা ফিতা। Card (3, 4) দিয়ে পরীক্ষা করি।",
  "কারো মাপই negative না।",
  "Card-টা 2 গুণ stretch করে (6, 8) বানালে তিনটা মাপই ঠিক 2 গুণ।",
];

export function ThreeRules() {
  const s = useScene(3, [700, 1500, 1600]);
  const k = s.k;
  return (
    <Scene
      scene={s}
      caption={
        s.done ? (
          <span className={FADE}>
            (3, 0) হয়ে ঘুরে গেলে 3 + 4 = 7, সোজা মাপের চেয়ে ছোট না। তিন ফিতাই পাস, তাই তিনটাই <b>norm</b>।
          </span>
        ) : (
          X4_SAY[k]
        )
      }
    >
      <div className="mx-auto grid max-w-[17rem] grid-cols-[minmax(0,1fr)_repeat(3,3.1rem)] items-center gap-x-1 gap-y-1.5 text-center">
        <span />
        {X4_TAPES.map((t) => (
          <b key={t.who} className={`text-sm ${t.ink}`}>
            {t.who}
          </b>
        ))}
        {X4_RULES.map((r, i) => (
          <div key={r.rule} className="contents">
            <span className="text-left text-sm leading-tight">
              {r.rule}
              <span className="block text-[0.7rem] text-muted">
                <span className="font-mono">{r.on}</span>
                {"via" in r && <span className="ml-1.5 inline-block">{r.via}</span>}
              </span>
            </span>
            {r.cells.map((c, j) => (
              <span key={j} className="flex h-9 flex-col items-center justify-center rounded-lg bg-foreground/[0.04]">
                {k >= i + 1 && (
                  <span style={{ transitionDelay: `${j * 180}ms` }} className={`${FADE} font-mono text-sm leading-tight font-semibold whitespace-nowrap`}>
                    {c}
                    <span className="block text-[0.7rem] text-accent-text">✓</span>
                  </span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's explanation, no task: where the 2 and the 1 in
//      the names come from. On (3, 4): L2 squares each entry (power 2), adds,
//      takes the root, 5; L1 keeps them as they are (power 1), 7; L∞ just
//      takes the bigger, 4. The small number in each name lights with its power.

const X4B_SAY = [
  "(3, 4) দিয়েই দেখি, নামের ছোট সংখ্যাটা কোথা থেকে আসে।",
  "L2-তে প্রতিটা ঘরের বর্গ, মানে power 2।",
  "তারপর যোগ, শেষে root।",
  "L1-এ power 1, মানে সংখ্যা যেমন আছে তেমনই।",
];

function X4bPow({ n, on }: { n: string; on: boolean }) {
  return <sup className={`transition-colors duration-500 motion-reduce:transition-none ${on ? "text-cat-amber" : ""}`}>{n}</sup>;
}

export function PowerName() {
  const s = useScene(4, [700, 1400, 1400, 1500]);
  const k = s.k;
  const chip = (name: ReactNode, on: boolean) => (
    <b className={`w-9 shrink-0 font-mono text-base ${on ? FADE : "invisible"}`}>{name}</b>
  );
  return (
    <Scene
      scene={s}
      caption={s.done ? <span className={FADE}>আর L∞-এ বড় ঘরটাই সব। নামের 2 আর 1 আসলে power।</span> : X4B_SAY[k]}
    >
      <div className="mx-auto grid w-fit gap-2">
        <div className="flex h-7 items-baseline gap-2">
          {chip(<>L<span className="text-cat-amber">2</span></>, k >= 1)}
          <span className={`font-mono text-[0.95rem] whitespace-nowrap ${k >= 1 ? FADE : "invisible"}`}>
            3<X4bPow n="2" on={k >= 1} /> + 4<X4bPow n="2" on={k >= 1} />
            <span className={k >= 2 ? FADE : "invisible"}> = 25, √25 = <b className="text-cat-teal">5</b></span>
          </span>
        </div>
        <div className="flex h-7 items-baseline gap-2">
          {chip(<>L<span className="text-cat-amber">1</span></>, k >= 3)}
          <span className={`font-mono text-[0.95rem] whitespace-nowrap ${k >= 3 ? FADE : "invisible"}`}>
            3<X4bPow n="1" on={k >= 3} /> + 4<X4bPow n="1" on={k >= 3} /> = <b className="text-cat-coral">7</b>
          </span>
        </div>
        <div className="flex h-7 items-baseline gap-2">
          {chip("L∞", k >= 4)}
          <span className={`text-[0.95rem] whitespace-nowrap ${k >= 4 ? FADE : "invisible"}`}>
            বড়টা: <span className="font-mono">max(3, 4) = </span>
            <b className="font-mono text-cat-violet">4</b>
          </span>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a ·A story scene for screen 5's setup, no task: the pole game. A pole
//      drops into the middle of the field; সোম, the drone and সামিন come
//      round it, and each chalks a first mark exactly 1 away. Only the marks
//      straight out from the pole, which every tape agrees on, so the shapes
//      stay the screen's to guess. সোম wonders what the marks will draw.

const S5_POLE: XY = [160, 140];
const S5_MARK = { som: [110, 140], samin: [210, 140], drone: [160, 158] } as const;
const S5_DRONE_Y = 64;
const S5_FEET = 164;

function S5Mark({ at: [x, y], color }: { at: readonly [number, number]; color: string }) {
  return <path d={`M${x - 4} ${y - 3}l8 6M${x + 4} ${y - 3}l-8 6`} stroke={color} strokeWidth={2.4} strokeLinecap="round" className={POP} />;
}

export function PoleGame() {
  const s = useScene(6, [600, 1000, 1600, 1100, 1100, 1400]);
  const k = s.k;
  const [px, py] = S5_POLE;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={105} label="a pole in the middle of the field; সোম, the drone and সামিন each chalk a mark exactly 1 away from it">
        <Glide x={0} y={k >= 1 ? 0 : -170} ms={600}>
          <rect x={px - 2} y={py - 46} width={4} height={48} fill="#78350f" />
          <path d={`M${px - 2} ${py - 46}h4v8h-4ZM${px - 2} ${py - 30}h4v8h-4Z`} fill="#ef4444" />
          <text x={px + 6} y={py - 36} fontSize={8.5} fontWeight={700} fill={CK_INK}>
            খুঁটি
          </text>
        </Glide>
        {k >= 3 && (
          <g className={POP}>
            <path d={`M${px - 4} ${py + 5}H${S5_MARK.som[0] + 4}`} stroke={CK_INK} strokeOpacity={0.5} strokeWidth={1} strokeDasharray="2 2" />
            <text x={(px + S5_MARK.som[0]) / 2} y={py + 14} textAnchor="middle" fontSize={9} fontWeight={800} fill={CK_INK}>
              1
            </text>
          </g>
        )}
        {k >= 4 && (
          <g className={POP}>
            <path d={`M${px + 4} ${py + 5}H${S5_MARK.samin[0] - 4}`} stroke={CK_INK} strokeOpacity={0.5} strokeWidth={1} strokeDasharray="2 2" />
            <text x={(px + S5_MARK.samin[0]) / 2} y={py + 14} textAnchor="middle" fontSize={9} fontWeight={800} fill={CK_INK}>
              1
            </text>
          </g>
        )}
        {k >= 3 && <S5Mark at={S5_MARK.som} color={CK_VIOLET} />}
        {k >= 4 && <S5Mark at={S5_MARK.samin} color={CK_CORAL} />}
        {k >= 5 && <S5Mark at={S5_MARK.drone} color={CK_TEAL} />}
        <Drone x={k >= 2 ? px : 360} y={k >= 2 ? S5_DRONE_Y : 20} ms={1400} label="below" />
        <Person who="som" x={k >= 2 ? 62 : -30} y={S5_FEET} walking={k === 2} arm={k >= 3 ? "point" : "down"} mood={k >= 6 ? "puzzled" : "plain"} ms={1400} label />
        <Person who="samin" x={k >= 2 ? 262 : 360} y={S5_FEET} facing={-1} walking={k === 2} arm={k >= 4 ? "point" : "down"} ms={1400} label />
        {k >= 6 && <Bubble x={62} y={S5_FEET - 66} side="right" tone="think" lines={["সব দাগ মিলে", "কী আঁকা হবে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · "Exactly 1 away" for each friend. Predict the shape, then sweep a finger
//     around the middle: each direction drops a dot exactly 1 away under that
//     friend's measure. A circle, a diamond, a square.

const FO = makeFrame(-1.5, 1.5, -1.5, 1.5, 66);
const BINS = 36;
const ENOUGH = 28;
const WAYS = [
  { who: "Drone", norm: l2, dot: "fill-cat-teal", line: "stroke-cat-teal", shape: `M${FO.sx(1)} ${FO.sy(0)}A${FO.u} ${FO.u} 0 1 0 ${FO.sx(-1)} ${FO.sy(0)}A${FO.u} ${FO.u} 0 1 0 ${FO.sx(1)} ${FO.sy(0)}` },
  { who: "সামিন", norm: l1, dot: "fill-cat-coral", line: "stroke-cat-coral", shape: pathOf(FO, [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 0]]) },
  { who: "সোমের রাজা", norm: linf, dot: "fill-cat-violet", line: "stroke-cat-violet", shape: pathOf(FO, [[1, 1], [-1, 1], [-1, -1], [1, -1], [1, 1]]) },
];
const SHAPES = ["গোল একটা রিং", "কাত করা বর্গ, হীরার মতো", "সোজা একটা বর্গ"];
/** the dot for a direction bin, exactly 1 away under a measure */
const onePoint = (bin: number, norm: (v: readonly number[]) => number): XY => {
  const a = (((bin + 0.5) * 360) / BINS) * (Math.PI / 180);
  const d: XY = [Math.cos(a), Math.sin(a)];
  const n = norm(d);
  return [d[0] / n, d[1] / n];
};

export function OneAway() {
  const pass = useGate();
  const [who, setWho] = useSeed("who", 0);
  const [guess, setGuess] = useSeed<(number | null)[]>("guess", [null, null, null]);
  const [bins, setBins] = useSeed<number[][]>("bins", [[], [], []]);
  const way = WAYS[who];
  const g = guess[who];
  const full = bins.map((b) => b.length >= ENOUGH);
  const allDone = full.every(Boolean);

  const paint = (p: XY) => {
    if (g === null || full[who] || l2(p) < 0.12) return;
    const deg = ((Math.atan2(p[1], p[0]) * 180) / Math.PI + 360) % 360;
    const b = Math.floor(deg / (360 / BINS)) % BINS;
    if (bins[who].includes(b)) return;
    const mine = [...bins[who], b];
    setBins(bins.map((x, i) => (i === who ? mine : x)));
    if (who === WAYS.length - 1 && mine.length === ENOUGH && full.slice(0, -1).every(Boolean))
      pass("“1 দূর”-এর আকার: গোল, হীরা, বর্গ।");
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {WAYS.map((w, i) => (
          <span key={w.who} className={`rounded-full border px-3 py-1 text-sm ${i === who ? "border-cat-blue bg-cat-blue/10 font-semibold" : full[i] ? "border-accent/40 text-accent-text" : "border-border text-muted"}`}>
            {full[i] ? "✓ " : ""}
            {w.who}
          </span>
        ))}
      </div>
      <Plane f={FO} ticks={1} label={`points exactly 1 away from the centre as ${way.who} measures, ${bins[who].length} of ${BINS} directions found`} drag={g === null || full[who] ? undefined : { down: paint, move: paint }} className="max-w-[16rem]">
        {WAYS.map((w, i) =>
          full[i] && i !== who ? <path key={w.who} d={w.shape} strokeWidth={2} opacity={0.35} className={`pointer-events-none fill-none ${w.line}`} /> : null,
        )}
        {full[who] && <Draw key={who} d={way.shape} strokeWidth={2.5} ms={900} className={way.line} />}
        {bins[who].map((b) => {
          const q = onePoint(b, way.norm);
          return <circle key={b} cx={FO.sx(q[0])} cy={FO.sy(q[1])} r={3.5} className={`${POP} pointer-events-none ${way.dot}`} />;
        })}
        <circle cx={FO.sx(0)} cy={FO.sy(0)} r={4} className="pointer-events-none fill-[#0f1b2d]" />
      </Plane>
      {g === null ? (
        <>
          <div className="text-sm font-medium text-muted">{way.who}-এর মাপে মাঝখান থেকে ঠিক 1 দূরে যত জায়গা আছে, সবগুলো মিলে কেমন আকার হবে?</div>
          <div className="mt-2 grid gap-2">
            {SHAPES.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, g, false, who)} disabled={false} onClick={() => setGuess(guess.map((x, k) => (k === who ? i : x)))}>
                {o}
              </Choice>
            ))}
          </div>
        </>
      ) : full[who] ? (
        <div key={who} className={`${FADE} text-center text-[0.95rem]`}>
          আকারটা হলো {SHAPES[who]}।{" "}
          {g === who ? "আপনার guess একদম ঠিক!" : `আপনি ধরেছিলেন ${SHAPES[g]}।`}
        </div>
      ) : (
        <div className="text-center text-[0.95rem] text-muted">
          মাঝখানের বিন্দুটার চারপাশে আঙুল ঘুরিয়ে টানুন। যেদিকে টানবেন, সেদিকে ঠিক 1 দূরে একটা করে বিন্দু বসবে ({bn(bins[who].length)}/{bn(ENOUGH)})।
        </div>
      )}
      {full[who] && who < WAYS.length - 1 && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={() => setWho(who + 1)} className={primaryBtn}>
            এবার {WAYS[who + 1].who}-এর মাপে
          </button>
        </div>
      )}
      {allDone && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-accent/10 px-4 py-3 text-center text-[0.95rem]`}>
          তিনটা আকার এবার এক কাগজে। Axis-এর ওপরের চারটা বিন্দুতে তিনজনই একমত, কিন্তু বাকি সব দিকে তিনজন বলছে তিন কথা।
        </div>
      )}
      <Task done={allDone}>প্রত্যেকের জন্য আগে আকারটা guess করুন, তারপর আঙুল ঘুরিয়ে বিন্দু বসিয়ে মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5¼ · A figure for screen 5's explanation, no task: why a ring turns into a
//      diamond and a square. Each goes exactly 1 toward the corner. The drone
//      stops at (0.71, 0.71), on its ring. সামিন's 1 splits 0.5 east + 0.5
//      north, so he stops at (0.5, 0.5), inside: a diamond. The king's one
//      diagonal move does east and north together, so he reaches (1, 1),
//      outside: a square.

const X5_F = makeFrame(-1.25, 1.25, -1.25, 1.25, 52, 8);
const X5_N = 96;
/** the "1 away" shape morphed `t` of the way from the ring to a diamond (1) or a square (2) */
const x5Shape = (kind: 1 | 2, t: number) =>
  `${Array.from({ length: X5_N }, (_, i) => {
    const a = (2 * Math.PI * i) / X5_N;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    const r = kind === 1 ? 1 / (Math.abs(c) + Math.abs(sn)) : 1 / Math.max(Math.abs(c), Math.abs(sn));
    const m = 1 + (r - 1) * t;
    return `${i ? "L" : "M"}${X5_F.sx(c * m).toFixed(1)} ${X5_F.sy(sn * m).toFixed(1)}`;
  }).join("")}Z`;
const X5_RING = `M${X5_F.sx(1)} ${X5_F.sy(0)}A${X5_F.u} ${X5_F.u} 0 1 0 ${X5_F.sx(-1)} ${X5_F.sy(0)}A${X5_F.u} ${X5_F.u} 0 1 0 ${X5_F.sx(1)} ${X5_F.sy(0)}`;
const X5_SAY = [
  "খুঁটি মাঝখানে। নিজের মাপে ঠিক 1 গেলে কোণার দিকে কে কতদূর যায়?",
  "Drone সোজা উড়ে 1 গিয়ে থামে (0.71, 0.71)-এ। সব দিকে তাই কম্পাসের বৃত্ত।",
  "সামিনের 1 দুই ভাগ: 0.5 পূর্বে, 0.5 উত্তরে। সে থামে (0.5, 0.5)-এ, রিংয়ের ভেতরে।",
  "ঘুরপথেই 1 ফুরিয়ে গেল, তাই কোণায় দাগ ভেতরে ঢুকে এলো: হীরা।",
  "রাজার এক কোণাকুনি চালে পূর্বেও 1, উত্তরেও 1। সে থামে (1, 1)-এ, রিংয়ের বাইরে।",
];

export function PinchPush() {
  const s = useScene(5, [900, 2000, 2400, 1800, 2400]);
  const k = s.k;
  const [td, ts] = useTween([k >= 3 ? 1 : 0, k >= 5 ? 1 : 0], 1200);
  const f = X5_F;
  const rows = [
    { who: "Drone", shape: "বৃত্ত", at: 1, formed: 1, swatch: "bg-cat-teal" },
    { who: "সামিন", shape: "হীরা", at: 2, formed: 3, swatch: "bg-cat-coral" },
    { who: "রাজা", shape: "বর্গ", at: 4, formed: 5, swatch: "bg-cat-violet" },
  ];
  return (
    <Scene scene={s} caption={s.done ? <span className={FADE}>এক চালে দুই কাজ, তাই কোণা বাইরে ঠেলে বেরোলো: বর্গ।</span> : X5_SAY[k]}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={f} ticks={1} label="each goes exactly 1 toward the corner: the drone stops at (0.71, 0.71) on its ring; সামিন, walking 0.5 east then 0.5 north, stops at (0.5, 0.5) inside it, so his shape pinches to a diamond; the king reaches (1, 1) in one diagonal move, outside it, so his is pushed out to a square" className="my-0! max-w-none">
            {k >= 1 && (
              <>
                <Draw d={X5_RING} strokeWidth={2} ms={900} className="stroke-cat-teal" />
                <path d={pathOf(f, [O, [0.71, 0.71]])} strokeWidth={1.5} strokeDasharray="3 3" className={`${FADE} pointer-events-none stroke-cat-teal`} />
                <circle cx={f.sx(0.71)} cy={f.sy(0.71)} r={3.5} className={`${POP} pointer-events-none fill-cat-teal`} />
              </>
            )}
            {k >= 2 && (
              <>
                <path d={pathOf(f, [O, [0.5, 0], [0.5, 0.5]])} strokeWidth={2.5} strokeLinejoin="round" className={`${FADE} pointer-events-none fill-none stroke-cat-coral`} />
                <circle cx={f.sx(0.5)} cy={f.sy(0.5)} r={3.5} className={`${POP} pointer-events-none fill-cat-coral`} />
              </>
            )}
            {k >= 3 && <path d={x5Shape(1, td)} strokeWidth={2} className={`${FADE} pointer-events-none fill-none stroke-cat-coral`} />}
            {k >= 4 && (
              <>
                <Arrow f={f} from={O} to={[1, 1]} tone="violet" w={2} draw />
                <circle cx={f.sx(1)} cy={f.sy(1)} r={3.5} className={`${POP} pointer-events-none fill-cat-violet`} />
              </>
            )}
            {k >= 5 && <path d={x5Shape(2, ts)} strokeWidth={2} className={`${FADE} pointer-events-none fill-none stroke-cat-violet`} />}
            <circle cx={f.sx(0)} cy={f.sy(0)} r={3} className="pointer-events-none fill-[#0f1b2d]" />
          </Plane>
        </div>
        <div className="grid min-w-0 gap-2 text-sm">
          {rows.map((r) => (
            <div key={r.who} className={`flex items-center gap-1.5 whitespace-nowrap ${k >= r.at ? FADE : "invisible"}`}>
              <i className={`h-1 w-4 shrink-0 rounded ${r.swatch}`} />
              <span>{r.who}</span>
              <b className={k >= r.formed ? FADE : "invisible"}>{r.shape}</b>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5½ ·A figure for screen 5's explanation, no task: one spot, (0.7, 0.7),
//      against all three "1 away" shapes. The drone's straight line reads
//      0.99, inside its ring; সামিন's walk, east then north, reads 1.4,
//      outside his diamond; the king's 0.7 sits well inside his square.

const SS_F = makeFrame(-1.2, 1.2, -1.2, 1.2, 56, 10);
const SS_P: XY = [0.7, 0.7];
const SS_WAYS = [
  {
    who: "Drone",
    read: "0.99",
    inside: true,
    swatch: "bg-cat-teal",
    line: "stroke-cat-teal",
    shape: `M${SS_F.sx(1)} ${SS_F.sy(0)}A${SS_F.u} ${SS_F.u} 0 1 0 ${SS_F.sx(-1)} ${SS_F.sy(0)}A${SS_F.u} ${SS_F.u} 0 1 0 ${SS_F.sx(1)} ${SS_F.sy(0)}`,
    route: pathOf(SS_F, [O, SS_P]),
  },
  {
    who: "সামিন",
    read: "1.4",
    inside: false,
    swatch: "bg-cat-coral",
    line: "stroke-cat-coral",
    shape: pathOf(SS_F, [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 0]]),
    route: pathOf(SS_F, [O, [0.7, 0], SS_P]),
  },
  {
    who: "রাজা",
    read: "0.7",
    inside: true,
    swatch: "bg-cat-violet",
    line: "stroke-cat-violet",
    shape: pathOf(SS_F, [[1, 1], [-1, 1], [-1, -1], [1, -1], [1, 1]]),
    route: null,
  },
];
const SS_MS = [700, 1400, 1400, 1400];

export function SameSpot() {
  const s = useScene(SS_WAYS.length + 1, SS_MS);

  return (
    <Scene
      scene={s}
      caption={
        s.done ? (
          <span className={FADE}>একই জায়গা, অথচ রায় এক না। Drone আর রাজার কাছে এটা 1-এর ভেতরে, সামিনের কাছে বাইরে।</span>
        ) : (
          "খুঁটি থেকে (0.7, 0.7) জায়গাটা কি 1-এর ভেতরে? তিনজন মাপছে নিজের নিজের ফিতায়।"
        )
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={SS_F} ticks={1} label="the spot (0.7, 0.7): 0.99 by the drone, inside the ring; 1.4 walking, outside the diamond; 0.7 for the king, inside the square" className="my-0! max-w-none">
            {SS_WAYS.map((w, i) =>
              s.k >= i + 2 ? (
                <g key={w.who}>
                  <Draw d={w.shape} strokeWidth={2} ms={900} className={w.line} />
                  {w.route && <Draw d={w.route} strokeWidth={3} delay={500} ms={700} className={w.line} />}
                </g>
              ) : null,
            )}
            <circle cx={SS_F.sx(0)} cy={SS_F.sy(0)} r={3.5} className="pointer-events-none fill-[#0f1b2d]" />
            {s.k >= 1 && <circle cx={SS_F.sx(SS_P[0])} cy={SS_F.sy(SS_P[1])} r={4.5} className={`${POP} pointer-events-none fill-cat-amber stroke-[#0f1b2d]`} strokeWidth={1.2} />}
          </Plane>
        </div>
        <div className="grid min-w-0 gap-2 text-sm">
          {SS_WAYS.map((w, i) =>
            s.k >= i + 2 ? (
              <div key={w.who} className={`${FADE} flex items-center gap-1.5 whitespace-nowrap`}>
                <i className={`h-1 w-4 shrink-0 rounded ${w.swatch}`} />
                <span>{w.who}</span>
                <b className="font-mono">{w.read}</b>
                <span className={w.inside ? "text-accent-text" : "text-danger"}>{w.inside ? "ভেতরে" : "বাইরে"}</span>
              </div>
            ) : (
              <div key={w.who} className="h-5" />
            ),
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: ফাহিম's marks game. At
//      his stall ফাহিম calls out the game; two pairs of friends walk up, রিনা
//      and করিম, then সামিন and সোম, and hold up their half-yearly mark
//      sheets. Which pair is further apart is the screen's question.

const S6_AT = { fahim: 104, rina: 158, karim: 196, samin: 256, som: 294 };
const S6_OFF = 380;

function S6Sheet({ x }: { x: number }) {
  return (
    <g className={POP}>
      <rect x={x - 5.5} y={CK_Y - 57} width={11} height={14} rx={1} fill="white" stroke="#64748b" strokeWidth={0.8} />
      <path d={`M${x - 3.5} ${CK_Y - 53}h7M${x - 3.5} ${CK_Y - 50}h7M${x - 3.5} ${CK_Y - 47}h5`} stroke="#94a3b8" strokeWidth={0.8} />
    </g>
  );
}

export function MarksGame() {
  const s = useScene(4, [600, 2600, 1500, 1500]);
  const k = s.k;
  const x = (who: "rina" | "karim" | "samin" | "som", beat: number) => (k >= beat ? S6_AT[who] : S6_OFF);
  const pair = (who: "rina" | "karim" | "samin" | "som", beat: number) => (
    <Person key={who} who={who} x={x(who, beat)} y={CK_Y} facing={-1} walking={k === beat} arm={k >= 4 ? "hold" : "down"} ms={1400} label={k >= beat} />
  );
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="ফাহিম at his stall calls out a marks game; রিনা and করিম, then সামিন and সোম, walk up with their mark sheets">
        <Stall x={46} y={CK_Y} w={70} color="#2563eb" sign="ফাহিম" />
        <Person who="fahim" x={S6_AT.fahim} y={CK_Y} arm={k >= 1 && k < 4 ? "wave" : "down"} mood={k >= 1 && k < 2 ? "shout" : "happy"} label />
        {k >= 1 && k < 4 && <Bubble x={S6_AT.fahim} y={CK_Y - 66} side="right" lines={["কার নম্বর কার সাথে", "সবচেয়ে বেশি মেলে?"]} />}
        {pair("rina", 2)}
        {pair("karim", 2)}
        {pair("samin", 3)}
        {pair("som", 3)}
        {k >= 4 && (["rina", "karim", "samin", "som"] as const).map((w) => <S6Sheet key={w} x={S6_AT[w] - 17} />)}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · One wild gap. Two pairs of students, ten subjects each: রিনা and করিম
//     differ by 1 everywhere, সামিন and সোম by 10 in maths only. Predict who is
//     farther under the drone and under the walk, then measure: L1 ties at 10,
//     L2 is 3.16 against 10.

const SUBJECTS = ["বাংলা", "ইংরেজি", "অঙ্ক", "বিজ্ঞান", "ধর্ম", "ইতিহাস", "ভূগোল", "ICT", "চারু", "খেলা"];
const PAIRS = [
  { names: "রিনা আর করিম", gaps: SUBJECTS.map(() => 1) },
  { names: "সামিন আর সোম", gaps: SUBJECTS.map((s) => (s === "অঙ্ক" ? 10 : 0)) },
];
const WILD_OPTS = ["রিনা আর করিম", "সামিন আর সোম", "দুই জোড়া সমান দূরে"];
const WILD_Q = [
  { q: "Drone-এর মাপে (L2) কোন জোড়া বেশি দূরে?", answer: 1 },
  { q: "সামিনের হাঁটার মাপে (L1)?", answer: 2 },
];

export function OneWildValue() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<(number | null)[]>("guess", [null, null]);
  const [measured, setMeasured] = useSeed("measured", false);
  const ready = guess.every((x) => x !== null);

  const measure = () => {
    setMeasured(true);
    pass("বর্গ করলে বড় পার্থক্য আরও বড়।");
  };

  return (
    <>
      <div className="mx-auto mt-4 grid max-w-md gap-3">
        {PAIRS.map((p) => (
          <div key={p.names}>
            <div className="text-sm font-semibold">{p.names}: কোন বিষয়ে কত নম্বরের পার্থক্য</div>
            <div className="mt-1 grid grid-cols-10 gap-0.5">
              {p.gaps.map((n, i) => (
                <div key={SUBJECTS[i]} title={SUBJECTS[i]} className={`rounded-md py-1.5 text-center font-mono text-sm font-semibold ${n >= 10 ? "bg-danger/15 text-danger" : n > 0 ? "bg-cat-blue/10" : "bg-foreground/5 text-muted"}`}>
                  {n}
                </div>
              ))}
            </div>
            {measured && (
              <div className={`${FADE} mt-1.5 grid gap-1 text-sm`}>
                {[
                  { k: "L1, যোগ", v: l1(p.gaps), bar: "bg-cat-coral" },
                  { k: "L2, বর্গ-যোগ-root", v: l2(p.gaps), bar: "bg-cat-teal" },
                ].map((m) => (
                  <div key={m.k} className="flex items-center gap-2">
                    <span className="w-32 shrink-0 text-muted">{m.k}</span>
                    <span className="h-3 min-w-0 flex-1 rounded bg-foreground/5">
                      <span style={{ width: `${(m.v / 10) * 100}%` }} className={`block h-full rounded ${m.bar}`} />
                    </span>
                    <b className="w-11 shrink-0 text-right font-mono">{Number.isInteger(m.v) ? m.v : f2(m.v)}</b>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {ready && !measured && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={measure} className={primaryBtn}>
            দুইভাবেই মেপে দেখুন
          </button>
        </div>
      )}
      {measured && (
        <div className={`${FADE} mx-auto mt-3 max-w-md rounded-2xl bg-cat-teal/5 px-3 py-3 text-center font-mono text-[0.95rem] leading-relaxed`}>
          <div>√(1² + 1² + … + 1²) = √10 = <b className="text-cat-teal">3.16</b></div>
          <div>√(10² + 0 + … + 0) = √100 = <b className="text-cat-teal">10</b></div>
        </div>
      )}
      {WILD_Q.map((w, qi) => (
        <div key={w.q}>
          <div className="mt-4 text-sm font-medium text-muted">{w.q}</div>
          <div className="mt-2 grid gap-2">
            {WILD_OPTS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess[qi], measured, w.answer)} disabled={guess[qi] !== null} onClick={() => setGuess(guess.map((x, k) => (k === qi ? i : x)))}>
                {o}
              </Choice>
            ))}
          </div>
        </div>
      ))}
      <Task done={measured}>দুইটা প্রশ্নেই আগে একটা guess করুন, তারপর মেপে মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: why one 10 shouts. সামিন
//      and সোম's single 10 squares into a 10 × 10 block, 100; রিনা and করিম's
//      ten 1s square into ten little 1 × 1 tiles, which slide in and fill one
//      row of it. Filling the whole block would take a hundred.

const SQ_F = makeFrame(0, 10, 0, 11.5, 13, 10);
/** the little tiles start above the block and drop into its top row */
const SQ_DROP = 1.5 * SQ_F.u;
const SQ_GRID = Array.from({ length: 9 }, (_, i) => `M${SQ_F.sx(i + 1)} ${SQ_F.sy(0)}V${SQ_F.sy(10)}M${SQ_F.sx(0)} ${SQ_F.sy(i + 1)}H${SQ_F.sx(10)}`).join("");
const SQ_SAY = [
  "সামিন আর সোমের পার্থক্য শুধু অঙ্কে, 10। রিনা আর করিমের দশ বিষয়ে 1 করে।",
  "Drone আগে বর্গ করে। 10-এর বর্গ মানে 10 × 10-এর একটা বড় বর্গ, 100।",
  "রিনা আর করিমের প্রতিটা 1-এর বর্গ 1-ই থাকে। এমন ছোট ঘর দশটা।",
  "দশটা ছোট ঘর মিলে ভরলো বড় বর্গের মাত্র এক সারি।",
];

export function SquareHundred() {
  const s = useScene(4, [700, 1600, 1600, 1500]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={s.done ? <span className={FADE}>বড় বর্গে এমন সারি দশটা, মানে ঘর একশোটা। রিনা আর করিম ভরতে পেরেছে মাত্র দশটা।</span> : SQ_SAY[k]}
    >
      <Plane f={SQ_F} grid={0} axes={false} label="a 10 by 10 square, 100, beside ten 1 by 1 squares that fill only one row of it" className="my-2! max-w-[9rem]">
        {k >= 1 && (
          <rect
            x={SQ_F.sx(0)}
            y={SQ_F.sy(10)}
            width={10 * SQ_F.u}
            height={10 * SQ_F.u}
            strokeWidth={1.5}
            className={`${POP} pointer-events-none fill-cat-teal/15 stroke-cat-teal`}
          />
        )}
        {k >= 4 && <path d={SQ_GRID} strokeWidth={0.8} className={`${FADE} pointer-events-none fill-none stroke-cat-teal/60`} />}
        {k >= 1 && (
          <text
            x={SQ_F.sx(5)}
            y={SQ_F.sy(4.2)}
            textAnchor="middle"
            fontSize={28}
            fontWeight={800}
            strokeWidth={5}
            paintOrder="stroke"
            className={`${FADE} pointer-events-none fill-[#0f766e] stroke-white font-mono`}
          >
            100
          </text>
        )}
        {k >= 2 && (
          <g style={{ transform: `translateY(${k >= 3 ? SQ_DROP : 0}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
            {Array.from({ length: 10 }, (_, i) => (
              <rect
                key={i}
                x={SQ_F.sx(i) + 0.75}
                y={SQ_F.sy(11.5) + 0.75}
                width={SQ_F.u - 1.5}
                height={SQ_F.u - 1.5}
                rx={1.5}
                style={{ transitionDelay: `${i * 60}ms` }}
                className={`${POP} pointer-events-none fill-cat-coral`}
              />
            ))}
          </g>
        )}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for screen 6's explanation, no task: an outlier, two stories.
//      সামিন and সোম's ten gaps, all 0 but a 10 in maths: if that 10 was a
//      typing slip, L2 is shouting about a mistake and L1 is fairer. A blood
//      test where one value really is far too high: there the shout is news.

const X6_GAPS = PAIRS[1].gaps;
const X6_BLOOD = [0.34, 0.4, 0.3, 0.95, 0.38, 0.33];
const X6_SAY = [
  "একই রকম বেখাপ্পা একটা মান, কিন্তু গল্প হতে পারে দুই রকম।",
  "সামিন আর সোমের দশ বিষয়ের পার্থক্য। সব 0, শুধু অঙ্কে 10। এটাই outlier।",
  "10-টা যদি টাইপের ভুল হয়, L2 একটা ভুলকে মাথায় তুলে নাচছে। L1 বেশি ন্যায্য।",
  "আবার রক্তের পরীক্ষায় একটা মান যদি সত্যিই অনেক বেশি হয়…",
];

function X6Panel({ title, show, children, verdict }: { title: string; show: boolean; children: ReactNode; verdict: ReactNode }) {
  return (
    <div className={`min-w-0 flex-1 rounded-xl border border-border px-2 pt-1.5 pb-2 ${show ? FADE : "invisible"}`}>
      <div className="text-center text-xs text-muted">{title}</div>
      <div className="relative mt-1 flex h-16 items-end gap-0.5 border-b border-foreground/30">{children}</div>
      <div className="mt-1.5 flex h-6 justify-center">{verdict}</div>
    </div>
  );
}

export function TypoOrNews() {
  const s = useScene(4, [600, 1500, 1800, 1500]);
  const k = s.k;
  const typo = k >= 2;
  return (
    <Scene scene={s} caption={s.done ? <span className={FADE}>…তাহলে ওটাই আসল information। তখন L2-র চেঁচানোটাই কাজের।</span> : X6_SAY[k]}>
      <div className="mx-auto flex max-w-xs gap-2">
        <X6Panel
          title="সামিন আর সোম, দশ বিষয়"
          show={k >= 1}
          verdict={typo && <span className={`${POP} rounded-full bg-cat-coral/15 px-2 py-0.5 text-xs font-semibold text-cat-coral`}>L1 ন্যায্য</span>}
        >
          {X6_GAPS.map((g, i) => (
            <div key={i} className="relative flex h-full flex-1 items-end">
              <div
                style={{ height: k >= 1 ? `${Math.max(g * 8, 3)}%` : "0%" }}
                className={`w-full rounded-t-sm transition-[height,background-color] duration-700 ease-out motion-reduce:transition-none ${
                  g ? (typo ? "bg-foreground/25" : "bg-cat-teal") : "bg-foreground/20"
                }`}
              />
              {g > 0 && k >= 1 && (
                <span
                  style={{ bottom: `${g * 8}%` }}
                  className={`${FADE} absolute left-1/2 -translate-x-1/2 text-[0.65rem] leading-3 font-semibold whitespace-nowrap ${typo ? "text-danger" : "text-cat-teal"}`}
                >
                  {typo ? "ভুল?" : "10"}
                </span>
              )}
            </div>
          ))}
        </X6Panel>
        <X6Panel
          title="রক্তের পরীক্ষা"
          show={k >= 3}
          verdict={s.done && <span className={`${POP} rounded-full bg-cat-teal/15 px-2 py-0.5 text-xs font-semibold text-cat-teal`}>L2 কাজের</span>}
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-[45%] border-t border-dashed border-foreground/30" />
          {X6_BLOOD.map((v, i) => (
            <div key={i} className="flex h-full flex-1 items-end">
              <div
                style={{ height: k >= 3 ? `${v * 100}%` : "0%" }}
                className={`w-full rounded-t-sm transition-[height,background-color] duration-700 ease-out motion-reduce:transition-none ${
                  v > 0.5 && s.done ? "bg-danger" : "bg-foreground/25"
                }`}
              />
            </div>
          ))}
        </X6Panel>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a ·A story scene for screen 7's setup, no task: the robotics club's
//      pumpkin machine. A practice pumpkin on its screen, and it guesses the
//      weight right. Its two knobs (আকার, রং) get cranked hard, a new pumpkin
//      comes, and the screen says গোলমাল. A বড় ভাই from the club walks up
//      with the rule: the two knobs together, no more than 1. Which tape
//      measures that "together" is the screen's question.

const S7_KNOB = [
  { x: 62, name: "আকার", calm: -35, wild: 140 },
  { x: 98, name: "রং", calm: 25, wild: -130 },
];
const S7_BHAI = 214;

function S7Pumpkin({ x, y, tint }: { x: number; y: number; tint: string }) {
  return (
    <g className={POP}>
      <ellipse cx={x} cy={y} rx={11} ry={8.5} fill={tint} />
      <ellipse cx={x} cy={y} rx={4} ry={8.5} fill="none" stroke="#9a3412" strokeWidth={0.8} />
      <path d={`M${x} ${y - 8}q1 -4 3 -5`} stroke="#15803d" strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}

export function PumpkinMachine() {
  const s = useScene(5, [600, 1800, 1500, 1800, 1400]);
  const k = s.k;
  const wild = k >= 2 && k < 5;
  const fresh = k >= 3;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="the robotics club's machine guesses a pumpkin's weight; its two knobs get cranked, a new pumpkin confuses it, and a বড় ভাই gives the knob rule">
        <rect x={30} y={30} width={100} height={15} rx={3} fill={CK_VIOLET} />
        <text x={80} y={41} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="white">
          Robotics club
        </text>
        <path d="M30 132V150M130 132V150" stroke="#78350f" strokeWidth={3} />
        <rect x={24} y={130} width={112} height={4} fill="#92400e" />
        <rect x={34} y={52} width={92} height={78} rx={5} fill="#475569" />
        <rect x={42} y={58} width={76} height={38} rx={3} fill={CK_INK} />
        {k >= 1 && <S7Pumpkin key={fresh ? "new" : "old"} x={62} y={78} tint={fresh ? "#fbbf24" : "#f97316"} />}
        {k >= 1 && (
          <text key={k >= 3 ? "b" : k >= 2 ? "a" : "q"} x={98} y={81} textAnchor="middle" fontSize={8.5} fontWeight={800} fill={k >= 3 && k < 5 ? "#f87171" : k >= 2 ? "#4ade80" : "white"} className={POP}>
            {k >= 5 ? "ওজন?" : k >= 3 ? "গোলমাল!" : k >= 2 ? "ঠিক!" : "ওজন?"}
          </text>
        )}
        {S7_KNOB.map((n) => (
          <g key={n.name}>
            <circle cx={n.x} cy={110} r={9} fill="#e2e8f0" stroke="#94a3b8" />
            <g style={{ transform: `rotate(${wild ? n.wild : n.calm}deg)`, transformOrigin: `${n.x}px 110px` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
              <path d={`M${n.x} 110V102.5`} stroke={CK_INK} strokeWidth={2.2} strokeLinecap="round" />
            </g>
            <text x={n.x} y={126} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white">
              {n.name}
            </text>
          </g>
        ))}
        <Person who="karim" x={k >= 4 ? S7_BHAI : 370} y={CK_Y} facing={-1} walking={k === 4} arm={k >= 5 ? "point" : "down"} mood={k >= 5 ? "shout" : "plain"} ms={1300} />
        {k >= 4 && (
          <text x={S7_BHAI} y={CK_Y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={CK_INK} className={POP}>
            বড় ভাই
          </text>
        )}
        {k >= 5 && <Bubble x={S7_BHAI} y={CK_Y - 66} lines={["দুই knob মিলে", "1-এর বেশি না!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · The robotics club's knob fine. Two knobs, a star where practice error is
//     least, and a budget of 1 the knobs must stay inside. Round 1 measures the
//     budget as the crow (a circle): the best spot keeps both knobs a little.
//     Round 2 as the walk (a diamond): the best spot is the corner (1, 0), so
//     knob 2 is exactly 0. The rings round the star are equal-error lines.

const FF = makeFrame(-1.5, 2.5, -1.5, 1.5, 58);
const KSTAR: XY = [2, 0.6];
/** nearest point inside the budget, measured by the crow */
const intoCircle = (p: XY): XY => {
  const n = l2(p);
  return n <= 1 ? p : [p[0] / n, p[1] / n];
};
/** nearest point inside the budget, measured by the walk (shrink both, stop at 0) */
const intoDiamond = (p: XY): XY => {
  if (l1(p) <= 1) return p;
  const a = [Math.abs(p[0]), Math.abs(p[1])].sort((x, y) => y - x);
  const t = a[0] - a[1] >= 1 ? a[0] - 1 : (a[0] + a[1] - 1) / 2;
  return [Math.sign(p[0]) * Math.max(Math.abs(p[0]) - t, 0), Math.sign(p[1]) * Math.max(Math.abs(p[1]) - t, 0)];
};
const ROUNDS = [
  { into: intoCircle, best: intoCircle(KSTAR), fine: "‖knob‖₂", norm: l2, who: "Drone-এর মাপ, গোল" },
  { into: intoDiamond, best: intoDiamond(KSTAR), fine: "‖knob‖₁", norm: l1, who: "হাঁটার মাপ, হীরা" },
];
const CIRCLE_D = `M${FF.sx(1)} ${FF.sy(0)}A${FF.u} ${FF.u} 0 1 0 ${FF.sx(-1)} ${FF.sy(0)}A${FF.u} ${FF.u} 0 1 0 ${FF.sx(1)} ${FF.sy(0)}Z`;
const DIAMOND_D = `${pathOf(FF, [[1, 0], [0, 1], [-1, 0], [0, -1]])}Z`;

export function KnobFine() {
  const pass = useGate();
  const clip = useId();
  const [round, setRound] = useSeed("round", 0);
  const [knob, setKnob] = useSeed<XY>("knob", O);
  const [won, setWon] = useSeed<boolean[]>("won", [false, false]);
  const r = ROUNDS[round];
  const err = dist(knob, KSTAR);
  const bestErr = dist(r.best, KSTAR);
  const locked = won[round];

  const put = (p: XY) => {
    if (locked) return;
    let q = r.into([clamp(p[0], FF.x0, FF.x1), clamp(p[1], FF.y0, FF.y1)]);
    const hit = dist(q, r.best) < 0.07;
    if (hit) q = r.best;
    setKnob(q);
    if (!hit) return;
    setWon(won.map((w, i) => w || i === round));
    if (round === 1)
      pass("হীরার budget-এ একটা knob পুরো 0।");
  };
  const next = () => {
    setRound(1);
    setKnob(O);
  };

  return (
    <>
      <div className="mt-4 flex justify-center">
        <Ticks
          items={[
            ["Round ১: গোল budget", won[0]],
            ["Round ২: হীরা budget", won[1]],
          ]}
        />
      </div>
      <Plane
        f={FF}
        ticks={1}
        label={`knob 1 at ${f2(knob[0])}, knob 2 at ${f2(knob[1])}; distance to the star ${f2(err)}`}
        drag={locked ? undefined : { down: put, move: put }}
        onKey={locked ? undefined : nudger((d) => put(plus(knob, [d[0] * 0.1, d[1] * 0.1])))}
        className="max-w-[21rem]"
      >
        <clipPath id={clip}>
          <rect x={FF.sx(FF.x0)} y={FF.sy(FF.y1)} width={(FF.x1 - FF.x0) * FF.u} height={(FF.y1 - FF.y0) * FF.u} />
        </clipPath>
        <g clipPath={`url(#${clip})`} className="pointer-events-none">
          {[0.5, 1, 1.5, 2, 2.5, 3].map((rr) => (
            <circle key={rr} cx={FF.sx(KSTAR[0])} cy={FF.sy(KSTAR[1])} r={rr * FF.u} strokeWidth={1} strokeDasharray="3 4" className="fill-none stroke-[#d97706]/40" />
          ))}
        </g>
        <path key={round} d={round === 0 ? CIRCLE_D : DIAMOND_D} strokeWidth={2} className={`${FADE} pointer-events-none ${round === 0 ? "fill-cat-teal/15 stroke-cat-teal" : "fill-cat-coral/15 stroke-cat-coral"}`} />
        <Label f={FF} at={[FF.x1, 0]} dx={-4} dy={24} anchor="end" size={9}>
          knob ১ (আকার)
        </Label>
        <Label f={FF} at={[0, FF.y1]} dx={5} dy={12} anchor="start" size={9}>
          knob ২ (রং)
        </Label>
        <Star f={FF} at={KSTAR} done={won[1]} />
        <path d={`M${FF.sx(knob[0])} ${FF.sy(knob[1])}L${FF.sx(KSTAR[0])} ${FF.sy(KSTAR[1])}`} strokeWidth={1.5} strokeDasharray="4 4" className="pointer-events-none stroke-[#0f1b2d]/50" />
        <circle cx={FF.sx(knob[0])} cy={FF.sy(knob[1])} r={8} strokeWidth={2.5} className={`pointer-events-none fill-white ${locked ? "stroke-accent" : "stroke-[#0f1b2d]"}`} />
      </Plane>
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-2 text-center">
        <div className="rounded-xl border border-border px-2 py-1.5">
          <div className="text-xs text-muted">knob ১, knob ২</div>
          <div className="font-mono font-semibold">
            {f2(knob[0])}, <span className={locked && round === 1 ? "text-cat-coral" : ""}>{f2(knob[1])}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border px-2 py-1.5">
          <div className="text-xs text-muted">star থেকে দূরে, মানে ভুল</div>
          <div className="font-mono font-semibold">{f2(err)}</div>
        </div>
      </div>
      <div className="mt-2 text-center text-sm text-muted">
        {r.who}: <span className="font-mono">{r.fine} = {f2(r.norm(knob))}</span>, budget 1
      </div>
      <div className="mt-2 min-h-7 text-center text-[0.95rem]">
        {locked ? (
          <span key={round} className={FADE}>
            {round === 0
              ? "Budget-এর ভেতরে star-এর সবচেয়ে কাছে এটাই। খেয়াল করুন, দুইটা knob-ই একটু একটু চালু আছে।"
              : "এবার সবচেয়ে ভালো জায়গাটা একদম হীরার কোণায়। Knob ২ ঠিক 0.00, মানে রং দেখার clue-টা পুরোপুরি বন্ধ!"}
          </span>
        ) : err - bestErr < 0.12 && !same(knob, O) ? (
          <span className="text-muted">কাছাকাছি! Budget-এর কিনারা ধরে আরেকটু সরিয়ে দেখুন।</span>
        ) : (
          <span className="text-muted">সাদা বিন্দুটা টেনে star-এর যত কাছে পারেন নিয়ে যান। তবে রঙিন জায়গার বাইরে যাওয়া যাবে না।</span>
        )}
      </div>
      {won[0] && round === 0 && (
        <div className={`${FADE} mt-2 flex justify-center`}>
          <button type="button" onClick={next} className={`${primaryBtn} bg-cat-coral`}>
            Round ২: হাঁটার মাপে budget
          </button>
        </div>
      )}
      <Task done={won[1]}>দুই round-এই knob-টা budget-এর ভেতরে রেখে star-এর যত কাছে পারেন, নিয়ে যান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7¼ · A figure for screen 7's explanation, no task: where a ring first
//      touches the budget. Equal-error rings round the star; with the round
//      budget a ring grows from the star and first touches it on a slope
//      (0.96, 0.29), both knobs on; with the diamond it first touches the
//      corner (1, 0), and knob 2 is exactly 0.

const X7_F = makeFrame(-1.3, 2.4, -1.3, 1.4, 38, 6);
const X7_TOUCH_O = intoCircle(KSTAR);
const X7_TOUCH_D = intoDiamond(KSTAR);
const X7_CIRCLE = `M${X7_F.sx(1)} ${X7_F.sy(0)}A${X7_F.u} ${X7_F.u} 0 1 0 ${X7_F.sx(-1)} ${X7_F.sy(0)}A${X7_F.u} ${X7_F.u} 0 1 0 ${X7_F.sx(1)} ${X7_F.sy(0)}Z`;
const X7_DIAMOND = `${pathOf(X7_F, [[1, 0], [0, 1], [-1, 0], [0, -1]])}Z`;
const X7_SAY = [
  "Star-এর চারপাশের একই রিংয়ের ওপর ভুল সমান।",
  "গোল budget, drone-এর মাপে 1।",
  "Star থেকে একটা রিং বড় হতে থাকুক, যতক্ষণ না budget ছোঁয়…",
  "…ছুঁলো একটা ঢালু জায়গায়। দুইটা knob-ই একটু একটু চালু।",
  "এবার হীরার budget। রিং আবার বড় হচ্ছে…",
];

export function FirstTouch() {
  const clip = useId();
  const s = useScene(5, [600, 1200, 1300, 1700, 1500]);
  const k = s.k;
  const f = X7_F;
  const diamond = k >= 4;
  const [r] = useTween([k >= 4 ? dist(KSTAR, X7_TOUCH_D) : k >= 2 ? dist(KSTAR, X7_TOUCH_O) : 0], 1200);
  const touch = k >= 5 ? X7_TOUCH_D : k === 3 ? X7_TOUCH_O : null;
  return (
    <Scene scene={s} caption={s.done ? <span className={FADE}>…আর প্রথম ছুঁলো হীরার কোণায়। সেখানে knob ২ একদম 0।</span> : X7_SAY[k]}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[9.5rem] shrink-0">
          <Plane f={f} ticks={1} label="rings of equal error round the star; a growing ring first touches the round budget on a slope, both knobs on, and the diamond budget at its corner (1, 0), knob 2 off" className="my-0! max-w-none">
            <clipPath id={clip}>
              <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} />
            </clipPath>
            <g clipPath={`url(#${clip})`} className="pointer-events-none">
              {[0.5, 1, 1.5, 2, 2.5].map((rr) => (
                <circle key={rr} cx={f.sx(KSTAR[0])} cy={f.sy(KSTAR[1])} r={rr * f.u} strokeWidth={1} strokeDasharray="3 4" className="fill-none stroke-[#d97706]/40" />
              ))}
              {k >= 2 && <circle cx={f.sx(KSTAR[0])} cy={f.sy(KSTAR[1])} r={Math.max(r, 0) * f.u} strokeWidth={2} className="fill-none stroke-[#d97706]" />}
            </g>
            {k >= 1 && (
              <path
                key={diamond ? "d" : "o"}
                d={diamond ? X7_DIAMOND : X7_CIRCLE}
                strokeWidth={2}
                className={`${FADE} pointer-events-none ${diamond ? "fill-cat-coral/15 stroke-cat-coral" : "fill-cat-teal/15 stroke-cat-teal"}`}
              />
            )}
            <Star f={f} at={KSTAR} done={s.done} />
            {touch && <circle key={touch.join()} cx={f.sx(touch[0])} cy={f.sy(touch[1])} r={5} strokeWidth={2} className={`${POP} pointer-events-none fill-white stroke-[#0f1b2d]`} />}
          </Plane>
        </div>
        <div className="grid min-w-0 gap-1.5 text-sm">
          <span className="text-xs text-muted">knob ১, knob ২</span>
          <div className={`whitespace-nowrap ${k >= 3 ? FADE : "invisible"}`}>
            <b className="text-cat-teal">গোল</b> <span className="font-mono">{f2(X7_TOUCH_O[0])}, {f2(X7_TOUCH_O[1])}</span>
          </div>
          <div className={`whitespace-nowrap ${k >= 5 ? FADE : "invisible"}`}>
            <b className="text-cat-coral">হীরা</b> <span className="font-mono">{f2(X7_TOUCH_D[0])}, </span>
            <b className="font-mono text-danger">0</b>
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7½ ·A figure for screen 7's explanation, no task: twelve clues, twelve
//      knobs. Under ridge's fine (L2) every knob shrinks a little and all
//      twelve stay on; under lasso's (L1) each shrinks by the same amount and
//      stops at 0, so the small ones switch off and only three are left.

const RL_KNOBS = [0.9, 0.15, 0.3, 0.1, 0.25, 1, 0.2, 0.05, 0.3, 0.7, 0.12, 0.18];
const RL_ROWS = [
  { name: "ridge", how: "drone-এর মাপে fine", at: 1, bar: "bg-cat-teal", shrink: (v: number) => v * 0.55 },
  { name: "lasso", how: "হাঁটার মাপে fine", at: 2, bar: "bg-cat-coral", shrink: (v: number) => Math.max(v - 0.35, 0) },
];
const RL_SAY = [
  "বারোটা clue, প্রত্যেকটার একটা knob। Fine বসানোর আগে কোনটা কতটা ঘোরানো, দেখুন।",
  "Ridge-এ সব knob একটু একটু করে ছোট হলো। বন্ধ হলো না একটাও।",
  "Lasso-তে সবগুলো সমান করে কমলো, আর ছোটগুলো কমতে কমতে একদম 0-তে গিয়ে থামলো।",
];

export function RidgeLasso() {
  const s = useScene(3, [900, 1600, 1600]);

  return (
    <Scene
      scene={s}
      caption={s.done ? <span className={FADE}>Ridge বারোটাই রাখলো, শুধু ছোট করে। Lasso রাখলো মাত্র তিনটা, বাকি নয়টা একদম বন্ধ।</span> : RL_SAY[s.k]}
    >
      <div className="mx-auto grid max-w-xs gap-2">
        {RL_ROWS.map((r) => {
          const on = s.k >= r.at;
          const vals = RL_KNOBS.map((v) => (on ? r.shrink(v) : v));
          const live = vals.filter((v) => v > 0).length;
          return (
            <div key={r.name}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span>
                  <b>{r.name}</b> <span className="text-muted">{r.how}</span>
                </span>
                {s.done && <span className={`${FADE} text-muted`}>চালু {bn(live)}টা</span>}
              </div>
              <div className="mt-1 flex h-11 items-end gap-1 border-b border-foreground/30">
                {vals.map((v, i) => (
                  <div key={i} className="relative flex h-full flex-1 items-end">
                    {on && <div style={{ height: `${RL_KNOBS[i] * 100}%` }} className="absolute inset-x-0 bottom-0 rounded-t-sm border border-b-0 border-dashed border-foreground/30" />}
                    <div
                      style={{ height: `${v * 100}%` }}
                      className={`w-full rounded-t-sm transition-[height,background-color] duration-700 ease-out motion-reduce:transition-none ${on ? r.bar : "bg-foreground/25"}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex h-4 gap-1">
                {vals.map((v, i) => (
                  <span key={i} className="flex-1 text-center font-mono text-[10px] leading-4 text-danger">
                    {s.done && v === 0 ? "0" : ""}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: নাসিব's photo contest.
//      নাসিব walks up to ফাহিমের stall's photo on an easel and gives the
//      rule, edits allowed but no pixel changed by more than 5; one row of the
//      photo lights up and slides out as the strip of pixels the screen
//      edits. Where the rule's loophole is stays the screen's question.

/** the same strip of pixels as WorstPixel's PIX, which is declared further down */
const S8_PIX = [120, 64, 200, 90, 150, 30, 180, 110];
const S8_CELL = 11;
const S8_X0 = 158;
const S8_Y0 = 40;
const S8_ROW = 3;
const S8_STRIP_Y = 128;
const S8_PHOTO = [
  [228, 228, 228, 228, 228, 228, 228, 228],
  [228, 70, 205, 70, 205, 70, 205, 228],
  [228, 205, 70, 205, 70, 205, 70, 228],
  S8_PIX,
  [150, 95, 95, 95, 95, 95, 95, 150],
  [160, 160, 160, 160, 160, 160, 160, 160],
];
const S8_NASIB = 80;

function S8Row({ vals, y }: { vals: readonly number[]; y: number }) {
  return (
    <>
      {vals.map((v, i) => (
        <rect key={i} x={S8_X0 + i * S8_CELL} y={y} width={S8_CELL} height={S8_CELL} fill={`rgb(${v}, ${v}, ${v})`} />
      ))}
    </>
  );
}

export function PhotoContest() {
  const s = useScene(5, [600, 1500, 2300, 2600, 1300]);
  const k = s.k;
  const w = 8 * S8_CELL;
  const rowY = S8_Y0 + S8_ROW * S8_CELL;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="নাসিব at an easel with a photo of ফাহিমের stall gives the contest rule, and one row of the photo's pixels slides out">
        <rect x={S8_X0 - 12} y={14} width={w + 24} height={15} rx={3} fill="#dc2626" />
        <text x={S8_X0 + w / 2} y={25} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="white">
          movie club · ছবি প্রতিযোগিতা
        </text>
        <path d={`M${S8_X0 + 12} 108L${S8_X0} ${CK_Y}M${S8_X0 + w - 12} 108L${S8_X0 + w} ${CK_Y}`} stroke="#78350f" strokeWidth={3} strokeLinecap="round" />
        <rect x={S8_X0 - 4} y={S8_Y0 - 4} width={w + 8} height={6 * S8_CELL + 8} rx={2} fill="#78350f" />
        {S8_PHOTO.map((row, r) => (
          <S8Row key={r} vals={row} y={S8_Y0 + r * S8_CELL} />
        ))}
        <text x={S8_X0 + w / 2} y={118} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={CK_INK}>
          ফাহিমের stall
        </text>
        {k >= 4 && <rect x={S8_X0 - 1.5} y={rowY - 1.5} width={w + 3} height={S8_CELL + 3} fill="none" stroke="#fde047" strokeWidth={2.5} className={POP} />}
        {k >= 4 && (
          <Glide x={0} y={k >= 5 ? S8_STRIP_Y - rowY : 0} ms={1000}>
            <S8Row vals={S8_PIX} y={rowY} />
            <rect x={S8_X0 - 1.5} y={rowY - 1.5} width={w + 3} height={S8_CELL + 3} fill="none" stroke="#2563eb" strokeWidth={2} />
          </Glide>
        )}
        <Person who="nasib" x={k >= 1 ? S8_NASIB : -30} y={CK_Y} walking={k === 1} arm={k >= 2 ? "point" : "down"} mood={k >= 3 ? "smug" : "happy"} ms={1400} label />
        {k === 2 && <Bubble x={S8_NASIB} y={CK_Y - 66} lines={["ছবি edit করা যাবে!"]} />}
        {k >= 3 && <Bubble x={S8_NASIB} y={CK_Y - 66} lines={["কিন্তু কোনো pixel", "5-এর বেশি না!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · The photo contest's rule: "no pixel changed by more than 5". A strip of
//     8 pixels from the stall's photo; the reader edits them. The L∞ guard
//     watches only the worst change, while L1 keeps adding up.

const PIX = [120, 64, 200, 90, 150, 30, 180, 110];
const LIMIT = 5;

export function WorstPixel() {
  const pass = useGate();
  const [delta, setDelta] = useSeed<number[]>("delta", PIX.map(() => 0));
  const [sel, setSel] = useSeed("sel", 0);
  const [tripped, setTripped] = useSeed("tripped", false);
  const worst = linf(delta);
  const allMoved = delta.every((d) => d !== 0);
  const ok = allMoved && worst <= LIMIT;
  const done = tripped && ok;

  const change = (v: number) => {
    const next = delta.map((d, i) => (i === sel ? v : d));
    setDelta(next);
    const trip = tripped || linf(next) > LIMIT;
    if (trip !== tripped) setTripped(true);
    if (!done && trip && next.every((d) => d !== 0) && linf(next) <= LIMIT)
      pass("পাহারাদার দেখে শুধু সবচেয়ে বড় বদল: L∞।");
  };

  const strip = (vals: number[], pick: boolean) => (
    <div className="grid grid-cols-8 gap-1">
      {vals.map((v, i) => (
        <button
          key={i}
          type="button"
          disabled={!pick}
          onClick={() => setSel(i)}
          style={{ backgroundColor: `rgb(${v}, ${v}, ${v})`, color: v > 130 ? "#0f1b2d" : "#ffffff" }}
          className={`h-11 rounded-md font-mono text-xs font-semibold disabled:cursor-default ${pick ? "cursor-pointer" : ""} ${pick && i === sel ? "ring-3 ring-cat-blue ring-offset-2 ring-offset-background" : ""}`}
        >
          {v}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div className="mx-auto mt-4 max-w-md">
        <div className="text-xs text-muted">আসল ছবির এক সারি pixel</div>
        {strip(PIX, false)}
        <div className="mt-3 text-xs text-muted">আপনার edit করা সারি (tap করে pixel বাছুন)</div>
        {strip(
          PIX.map((p, i) => clamp(p + delta[i], 0, 255)),
          true,
        )}
        <div className="mt-1 grid grid-cols-8 gap-1 text-center font-mono text-xs">
          {delta.map((d, i) => (
            <span key={i} className={Math.abs(d) > LIMIT ? "font-bold text-danger" : d ? "text-cat-blue" : "text-muted"}>
              {d > 0 ? `+${d}` : d < 0 ? `−${-d}` : "0"}
            </span>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-3">
          <span className="shrink-0 text-sm text-muted">pixel {bn(sel + 1)}-এ বদল</span>
          <input
            type="range"
            min={-9}
            max={9}
            step={1}
            value={delta[sel]}
            aria-label={`pixel ${sel + 1}-এ কতটা বদল`}
            onChange={(e) => change(Number(e.target.value))}
            className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
          />
        </label>
      </div>
      <div className={`mx-auto mt-3 max-w-md rounded-2xl border-2 px-4 py-2.5 text-center transition-colors duration-300 motion-reduce:transition-none ${worst > LIMIT ? "border-danger/50 bg-danger/5" : "border-accent/40 bg-accent/5"}`}>
        <div className="text-sm text-muted">পাহারাদার, L∞: সবচেয়ে বড় বদল</div>
        <div className={`font-mono text-2xl font-bold ${worst > LIMIT ? "text-danger" : "text-accent-text"}`}>{worst}</div>
        <div className="text-sm">{worst > LIMIT ? "নিয়ম ভেঙে গেছে! একটা pixel 5-এর বেশি বদলে ফেলেছেন।" : "সব ঠিক আছে, নিয়ম ভাঙেনি।"}</div>
      </div>
      <div className="mx-auto mt-2 flex max-w-md justify-center gap-6 font-mono text-sm text-muted">
        <span>L1 = {l1(delta)}</span>
        <span>L2 = {f2(l2(delta))}</span>
      </div>
      <Ticks
        items={[
          ["একবার নিয়ম ভেঙে দেখুন", tripped],
          ["আটটা pixel-ই বদলান, নিয়ম না ভেঙে", ok],
        ]}
      />
      <Task done={done}>প্রথমে একটা pixel-কে 5-এর বেশি বদলে পাহারাদারকে রাগিয়ে দিন। তারপর আটটা pixel-ই বদলান, কিন্তু এবার নিয়মের ভেতরে থেকে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8¼ · A figure for screen 8's explanation, no task: the guard looks only at
//      the worst. The strip before and after an edit that changes all eight
//      pixels (+5 −5 +4 +5 −3 +5 −5 +2) looks the same; added up the change is
//      34, a big L1, but the guard sees only the biggest, 5, and is happy.

const X8_D = [5, -5, 4, 5, -3, 5, -5, 2];
const X8_AFTER = PIX.map((v, i) => v + X8_D[i]);
const X8_L1 = l1(X8_D);
const X8_SAY = [
  "Stall-এর ছবির সেই আট pixel-এর সারি।",
  "আটটা pixel-ই বদলানো হলো। অথচ চোখে দুই সারি একই।",
  "কোনো বদলই 5-এর বেশি না।",
  `সব বদল যোগ করলে ${X8_L1}। L1 বেশ বড়।`,
];

function X8Row({ label, vals, show = true }: { label: string; vals: number[]; show?: boolean }) {
  const look = show ? FADE : "opacity-0";
  return (
    <>
      <span className={`${look} text-xs text-muted`}>{label}</span>
      {vals.map((v, i) => (
        <span key={i} style={{ backgroundColor: `rgb(${v}, ${v}, ${v})` }} className={`${look} aspect-square rounded-sm ring-1 ring-black/15`} />
      ))}
    </>
  );
}

export function GuardWorst() {
  const s = useScene(4, [600, 1300, 1500, 1500]);
  const k = s.k;
  const worst = linf(X8_D);
  return (
    <Scene scene={s} caption={s.done ? <span className={FADE}>পাহারাদার দেখে শুধু সবচেয়ে বড় বদলটা, 5। নিয়ম ভাঙেনি, তাই সে খুশি। এটাই L∞।</span> : X8_SAY[k]}>
      <div className="mx-auto grid max-w-[16rem] grid-cols-[2.2rem_repeat(8,minmax(0,1fr))] items-center gap-1">
        <X8Row label="আগে" vals={PIX} />
        <X8Row label="পরে" vals={X8_AFTER} show={k >= 1} />
        <span className="text-xs text-muted">{k >= 2 ? "বদল" : ""}</span>
        {X8_D.map((d, i) => {
          const hit = s.done && Math.abs(d) === worst;
          return (
            <span
              key={i}
              style={{ transitionDelay: `${i * 90}ms` }}
              className={`rounded-md py-0.5 text-center font-mono text-[0.7rem] font-semibold transition-[opacity,box-shadow] duration-300 motion-reduce:transition-none ${
                k >= 2 ? "opacity-100" : "opacity-0"
              } ${hit ? "text-cat-violet ring-2 ring-cat-violet" : ""}`}
            >
              {d > 0 ? `+${d}` : `−${-d}`}
            </span>
          );
        })}
      </div>
      <div className="mt-2 flex justify-center gap-4 font-mono text-sm font-semibold">
        <span className={k >= 3 ? FADE : "invisible"}>L1 = {X8_L1}</span>
        <span className={`text-cat-violet ${s.done ? FADE : "invisible"}`}>L∞ = {worst} ≤ 5</span>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8½ ·A figure for screen 8's explanation, no task: the panda that turned
//      into a gibbon. A 10 × 10 panda, a model that reads it right; add a
//      chosen change of at most 5 to every pixel (L∞ = 5, shown blown up) and
//      the new picture looks the same, yet the model now says gibbon.

const PG_ART = [
  "BBggggggBB",
  "BBWWWWWWBB",
  "gWWWWWWWWg",
  "gWBBWWBBWg",
  "gWBeWWeBWg",
  "gWWWWWWWWg",
  "gWWWBBWWWg",
  "ggWWWWWWgg",
  "gggWWWWggg",
  "gggggggggg",
];
const PG_TONE: Record<string, number> = { B: 30, W: 236, g: 150, e: 205 };
const PG_PIX = PG_ART.join("").split("").map((c) => PG_TONE[c]);
/** the chosen change per pixel: + is 5 up, − is 5 down, . is untouched */
const PG_NOISE = [
  "-.+.++-.-.",
  "..-.+---..",
  "+.-++-..-+",
  ".---.+-.--",
  "+-.-+..-++",
  "-.+--++--+",
  "-+-++.-+.+",
  ".-+--+-.+.",
  "...+---.--",
  "++..-+.-+-",
]
  .join("")
  .split("")
  .map((c) => (c === "+" ? 5 : c === "-" ? -5 : 0));
const PG_NEW = PG_PIX.map((v, i) => clamp(v + PG_NOISE[i], 0, 255));

function PgPic({ vals, noise = false }: { vals: number[]; noise?: boolean }) {
  return (
    <svg viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden className="block h-auto w-full rounded-md border border-[#cbd5e1] bg-white">
      {vals.map((v, i) => (
        <rect
          key={i}
          x={i % 10}
          y={Math.floor(i / 10)}
          width={1}
          height={1}
          fill={noise ? undefined : `rgb(${v}, ${v}, ${v})`}
          className={noise ? (v > 0 ? "fill-cat-coral/80" : v < 0 ? "fill-cat-blue/70" : "fill-white") : undefined}
        />
      ))}
    </svg>
  );
}

function PgTag({ says, fooled = false }: { says: string; fooled?: boolean }) {
  return (
    <span className={`${POP} inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${fooled ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent-text"}`}>
      model: {says}
    </span>
  );
}

const PG_SAY = [
  "একশোটা pixel-এর ছোট্ট একটা পান্ডার ছবি, দেখানো হলো model-কে।",
  "Model ঠিকঠাক চিনলো, পান্ডা।",
  "এবার প্রতিটা pixel-এ হিসাব করে বাছা একটা বদল, কোনোটাই 5-এর বেশি না। চোখে পড়ার জন্য রংটা বাড়িয়ে দেখানো।",
  "বদলানো ছবিটা দেখুন। আগেরটার সাথে কোনো তফাত চোখে পড়ে?",
];

export function PandaGibbon() {
  const s = useScene(4, [900, 1300, 1700, 1500]);
  const k = s.k;

  return (
    <Scene scene={s} caption={s.done ? <span className={FADE}>চোখে একই ছবি, L∞ মাত্র 5। অথচ model বলে বসলো gibbon!</span> : PG_SAY[k]}>
      <div className="mx-auto grid max-w-xs grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-1.5 gap-y-1 text-center">
        <PgPic vals={PG_PIX} />
        <span className={`font-mono text-lg text-muted ${k >= 2 ? "" : "invisible"}`}>+</span>
        <div className="aspect-square">{k >= 2 && <div className={POP}><PgPic vals={PG_NOISE} noise /></div>}</div>
        <span className={`font-mono text-lg text-muted ${k >= 3 ? "" : "invisible"}`}>=</span>
        <div className="aspect-square">{k >= 3 && <div className={FADE}><PgPic vals={PG_NEW} /></div>}</div>

        <span className="text-xs text-muted">আসল ছবি</span>
        <span />
        <span className="text-xs text-muted">{k >= 2 && <span className={FADE}>বদল, ±5</span>}</span>
        <span />
        <span className="text-xs text-muted">{k >= 3 && <span className={FADE}>নতুন ছবি</span>}</span>

        <div className="flex min-h-6 justify-center">{k >= 1 && <PgTag says="পান্ডা" />}</div>
        <span />
        <span />
        <span />
        <div className="flex min-h-6 justify-center">{k >= 4 && <PgTag says="gibbon" fooled />}</div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · এবার আপনার পালা। Four real jobs and no scaffolding: pick the tape for
//     each one. Every job was met on an earlier screen, so this is where the
//     journey's own question — একটা machine কোন ফিতা নেবে? — gets answered by
//     the reader rather than by the page.

const TAPES = ["কাক", "পথিক", "রাজা"];
const TAPE_JOBS: { job: string; want: number; why: string }[] = [
  { job: "শহরের ছক-কাটা রাস্তায় taxi-র ভাড়া হিসাব করা", want: 1, why: "Taxi তো দেয়াল ভেদ করে যেতে পারে না, রাস্তা ধরেই ঘুরতে হয়।" },
  { job: "রক্তের পরীক্ষায় একটা মান অনেক বেশি, সেটা যেন চোখে পড়ে", want: 0, why: "বর্গ করলে বড় পার্থক্যটা চেঁচিয়ে ওঠে, ছোটগুলো চাপা পড়ে।" },
  { job: "যাচাই করা, ছবির কোনো pixel-ই 5-এর বেশি বদলায়নি", want: 2, why: "“কোনো একটাও এতটার বেশি না” মানেই শুধু সবচেয়ে বড় ঘরটা দেখা।" },
  { job: "হাজারটা clue থেকে অল্প কয়েকটা রেখে বাকিগুলো বন্ধ করা", want: 1, why: "হীরার কোণাগুলো axis-এর ওপর, তাই knob একেবারে 0 হয়ে যায়। এটাই lasso।" },
];
const tapePill = (look: "idle" | "ok" | "bad") =>
  `cursor-pointer rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors disabled:cursor-default ${
    look === "ok" ? "border-accent bg-accent text-accent-foreground" : look === "bad" ? "border-danger/60 bg-danger/5 text-danger" : "border-border hover:border-cat-blue/60"
  }`;

export function PickTape() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<(number | null)[]>("picks", [null, null, null, null]);
  const [miss, setMiss] = useState<{ n: number; i: number } | null>(null);
  const isOk = (i: number) => picks[i] === TAPE_JOBS[i].want;
  const solved = TAPE_JOBS.every((_, i) => isOk(i));
  const got = TAPE_JOBS.filter((_, i) => isOk(i)).length;

  const choose = (i: number, t: number) => {
    const next = picks.map((p, k) => (k === i ? t : p));
    setPicks(next);
    if (t !== TAPE_JOBS[i].want) setMiss({ n: (miss?.n ?? 0) + 1, i });
    else if (next.every((p, k) => p === TAPE_JOBS[k].want))
      pass("কোন ফিতা, সেটা ঠিক করে কাজটা কী।");
  };

  return (
    <>
      <div className="mx-auto mt-2 grid max-w-sm gap-2">
        {TAPE_JOBS.map((j, i) => {
          const ok = isOk(i);
          const bad = picks[i] !== null && !ok;
          return (
            <div key={j.job} className={`rounded-xl border-2 px-3 py-2 transition-colors ${ok ? "border-accent/60 bg-accent/5" : bad ? "border-danger/40" : "border-border"}`}>
              <div className="text-[0.95rem] leading-snug">{j.job}</div>
              <div className="mt-1.5 flex gap-2">
                {TAPES.map((t, ti) => (
                  <button
                    key={t}
                    type="button"
                    disabled={ok}
                    onClick={() => choose(i, ti)}
                    className={tapePill(picks[i] === ti ? (ok ? "ok" : "bad") : "idle")}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {ok && <div className={`${FADE} mt-1.5 text-xs text-accent-text`}>{j.why}</div>}
            </div>
          );
        })}
      </div>
      {miss && !solved && <Nope key={miss.n}>উঁহু, ওই ফিতাটা এখানে খাটে না। কাজটা আবার পড়ুন, কে কীভাবে যায় সেটা মিলিয়ে দেখুন।</Nope>}
      <Ticks items={[[`মিলেছে (${bn(got)}/৪)`, solved]]} />
      <Task done={solved}>চারটা কাজের প্রত্যেকটার জন্য একটা ফিতা বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for screen 9's explanation, no task: the ভদ্রলোক's answer.
//      The three still hold up 5, 7 and 4; he says he'll walk, সামিন says
//      then 7 is his, and he walks off while the drone flies off with its 5.
//      সোম's 4 was not wrong either: three answers to three questions.

const X9_AT = { gent: 56, drone: 148, samin: 212, som: 276 };
const X9_DRONE_Y = 78;

export function GentWalks() {
  const s = useScene(4, [700, 1400, 1600, 2400]);
  const k = s.k;
  const gone = k >= 3;
  const dx = gone ? 370 : X9_AT.drone;
  const dy = gone ? 24 : X9_DRONE_Y;
  return (
    <StoryFrame scene={s}>
      <Stage
        backdrop="fair"
        label="the gentleman says he will walk, সামিন says then his answer is 7, and he walks off; the drone flies off with its 5, and সোম says his 4 was not wrong either"
      >
        <Gent x={gone ? 370 : X9_AT.gent} y={CK_Y} walking={k === 3} ms={2200} />
        <Drone x={dx} y={dy} ms={2000} label="above" />
        <Glide x={dx} y={dy} ms={2000}>
          <path d="M0 6V20" stroke="#334155" strokeWidth={1} />
          <CastCard x={0} y={29} text="5" w={20} />
        </Glide>
        <Person who="samin" x={X9_AT.samin} y={CK_Y} facing={-1} arm="hold" mood={k >= 2 ? "happy" : "plain"} label />
        <CastCard x={X9_AT.samin} y={CK_Y - 76} text="7" tone="coral" w={20} />
        {k >= 2 && <circle cx={X9_AT.samin} cy={CK_Y - 76} r={15} fill="none" stroke="#16a34a" strokeWidth={2} className={POP} />}
        <Person who="som" x={X9_AT.som} y={CK_Y} facing={-1} arm="hold" mood={k >= 4 ? "smug" : "plain"} label />
        <CastCard x={X9_AT.som} y={CK_Y - 76} text="4" tone="blue" w={20} />
        {k === 1 && <Bubble x={X9_AT.gent} y={CK_Y - 66} lines={["আমি তো হেঁটে যাবো।"]} />}
        {k === 2 && <Bubble x={X9_AT.samin} y={CK_Y - 92} lines={["তাহলে আপনার জন্য 7।"]} />}
        {k >= 4 && <Bubble x={X9_AT.som} y={CK_Y - 92} side="left" lines={["আমার 4-ও কিন্তু ভুল না!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for the first check's explanation, no task: সোম's sum on
//       (3, −4). Added straight it gives −1, and a length is never negative;
//       with the minus dropped it is 7, সামিন's walk, L1; and a bare ‖v‖ is
//       the tape, L2, √(9 + 16) = 5.

const X10_ROWS = [
  { f: "3 + (−4) = −1", tag: "length negative?", tone: "text-danger" },
  { f: "|3| + |−4| = 7", tag: "L1, সামিনের হাঁটা", tone: "text-cat-coral" },
  { f: "√(9 + 16) = 5", tag: "‖v‖, মানে L2", tone: "text-cat-teal" },
];
const X10_SAY = [
  "সোমের কথামতো card (3, −4)-এর ঘরগুলো সোজা যোগ করি।",
  "length দাঁড়ালো −1!",
  "length তো negative হয় না। এই যোগটা length না।",
  "Minus ফেলে দিয়ে যোগ করলে 7। এটা সামিনের হাঁটা, L1।",
];

export function SomsSum() {
  const s = useScene(4, [700, 1300, 1500, 1500]);
  const k = s.k;
  return (
    <Scene scene={s} caption={s.done ? <span className={FADE}>আর শুধু ‖v‖ লেখা থাকলে ফিতার মাপ, L2: 5।</span> : X10_SAY[k]}>
      <div className="mx-auto w-fit">
        <div className="mb-2 text-center">
          <span className="rounded-md border-2 border-cat-blue px-2 py-0.5 font-mono text-sm font-bold text-cat-blue">(3, −4)</span>
        </div>
        <div className="grid grid-cols-[auto_auto] items-center gap-x-3 gap-y-1.5">
          {X10_ROWS.map((r, i) => {
            const on = k >= [1, 3, 4][i];
            const struck = i === 0 && k >= 2;
            return (
              <div key={r.f} className={`contents ${on ? "" : "invisible"}`}>
                <span className={`font-mono text-[0.95rem] font-semibold whitespace-nowrap ${on ? FADE : ""} ${struck ? "text-muted line-through decoration-danger decoration-2" : ""}`}>
                  {r.f}
                </span>
                <span className={`text-xs font-semibold whitespace-nowrap ${r.tone} ${i === 0 ? (struck ? FADE : "invisible") : on ? FADE : ""}`}>{r.tag}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11½ · A figure for the second check's explanation, no task: one point, three
//       sizes. Card (−6, 8) as a point; the king's square through it has size
//       8, the drone's circle 10, সামিন's diamond 14. The innermost shape has
//       to grow the most, the same fact as the nesting: 8 ≤ 10 ≤ 14.

const X11_F = makeFrame(-15, 15, -15, 15, 4.6, 6);
const X11_P: XY = [-6, 8];
const X11_SHAPES = [
  { who: "রাজা", name: "L∞", n: 8, d: `${pathOf(X11_F, [[8, 8], [-8, 8], [-8, -8], [8, -8]])}Z`, line: "stroke-cat-violet", ink: "text-cat-violet" },
  {
    who: "Drone",
    name: "L2",
    n: 10,
    d: `M${X11_F.sx(10)} ${X11_F.sy(0)}A${10 * X11_F.u} ${10 * X11_F.u} 0 1 0 ${X11_F.sx(-10)} ${X11_F.sy(0)}A${10 * X11_F.u} ${10 * X11_F.u} 0 1 0 ${X11_F.sx(10)} ${X11_F.sy(0)}`,
    line: "stroke-cat-teal",
    ink: "text-cat-teal",
  },
  { who: "সামিন", name: "L1", n: 14, d: `${pathOf(X11_F, [[14, 0], [0, 14], [-14, 0], [0, -14]])}Z`, line: "stroke-cat-coral", ink: "text-cat-coral" },
];
const X11_SAY = [
  "Card (−6, 8)-কে একটা বিন্দু হিসেবে বসাই।",
  "Gate থেকে (−6, 8)। এবার তিনজনের আকার বড় হতে হতে বিন্দুটা ছুঁক।",
  "রাজার বর্গ ছুঁলো মাপ 8-এ।",
  "Drone-এর বৃত্ত ছুঁলো 10-এ।",
];

export function NestNumbers() {
  const s = useScene(4, [700, 1300, 1400, 1400]);
  const k = s.k;
  const f = X11_F;
  return (
    <Scene
      scene={s}
      caption={s.done ? <span className={FADE}>আর সামিনের হীরাকে বাড়তে হলো 14 পর্যন্ত। সবচেয়ে ভেতরের আকারকেই বাড়তে হয় সবচেয়ে বেশি।</span> : X11_SAY[k]}
    >
      <div className="flex items-center justify-center gap-4">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={f} grid={5} label="the point (−6, 8) lies on the king's square of size 8, the drone's circle of radius 10 and সামিন's diamond of size 14" className="my-0! max-w-none">
            {X11_SHAPES.map((sh, i) => (k >= i + 2 ? <Draw key={sh.name} d={sh.d} strokeWidth={2} ms={900} className={sh.line} /> : null))}
            {k >= 1 && (
              <>
                <path d={pathOf(f, [O, X11_P])} strokeWidth={1.2} strokeDasharray="3 3" className={`${FADE} pointer-events-none stroke-[#0f1b2d]/50`} />
                <circle cx={f.sx(X11_P[0])} cy={f.sy(X11_P[1])} r={4.5} strokeWidth={1.2} className={`${POP} pointer-events-none fill-cat-amber stroke-[#0f1b2d]`} />
              </>
            )}
          </Plane>
        </div>
        <div className="grid min-w-0 gap-1.5 text-sm">
          {X11_SHAPES.map((sh, i) => (
            <div key={sh.name} className={`flex items-baseline gap-1.5 whitespace-nowrap ${k >= i + 2 ? FADE : "invisible"}`}>
              <span className="w-10">{sh.who}</span>
              <b className={`font-mono ${sh.ink}`}>
                {sh.name} = {sh.n}
              </b>
            </div>
          ))}
          <b className={`mt-1 font-mono ${s.done ? FADE : "invisible"}`}>8 ≤ 10 ≤ 14</b>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11¾ · A figure for the last explanation, no task: the next journey's
//       trouble, set up and left open. নাসিবের movie club: a visitor (2, 5) who
//       loves comedy, a comedy (1, 4) scoring 22 and a drama (5, 2) scoring
//       20, almost level, because the drama's arrow is longer (5.39 vs 4.12).
//       Whether length can be taken away and only direction kept is not shown.

const X11B_F = makeFrame(0, 5.6, 0, 5.6, 24, 12);
const X11B_FILMS = [
  { name: "comedy", at: [1, 4] as XY, score: 22, tone: "teal" as const, swatch: "bg-cat-teal", show: 2 },
  { name: "drama", at: [5, 2] as XY, score: 20, tone: "coral" as const, swatch: "bg-cat-coral", show: 3 },
];
const X11B_SAY = [
  "নাসিবের movie club। ডানে drama, ওপরে comedy।",
  "দর্শক comedy বেশি ভালোবাসেন: (2, 5)।",
  "Club-এর হিসাবে comedy ছবিটা পেলো 22।",
  "আর drama পেলো 20, প্রায় সমান!",
  "Drama-র arrow বেশি লম্বা। length এর  জোরেই এত নম্বর।",
];

export function LongerWins() {
  const s = useScene(5, [600, 1300, 1400, 1500, 1800]);
  const k = s.k;
  const f = X11B_F;
  return (
    <Scene scene={s} caption={s.done ? <span className={FADE}>lengthটা সরিয়ে দিয়ে শুধু দিকটা রাখা যায় কি?</span> : X11B_SAY[k]}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={f} ticks={1} label="the visitor (2, 5) loves comedy; the comedy (1, 4) scores 22 and the drama (5, 2) scores 20, almost level, because the drama's arrow is longer" className="my-0! max-w-none">
            <Label f={f} at={[f.x1, 0]} dx={-2} dy={-4} anchor="end" size={8}>
              drama
            </Label>
            <Label f={f} at={[0, f.y1]} dx={4} dy={8} anchor="start" size={8}>
              comedy
            </Label>
            {k >= 1 && <Arrow f={f} from={O} to={[2, 5]} tone="amber" w={2.2} draw />}
            {X11B_FILMS.map((m) => (k >= m.show ? <Arrow key={m.name} f={f} from={O} to={m.at} tone={m.tone} w={2.6} draw /> : null))}
            {s.done && (
              <text x={f.sx(3.6)} y={f.sy(0.7)} textAnchor="middle" fontSize={20} fontWeight={800} className={`${POP} pointer-events-none fill-danger`}>
                ?
              </text>
            )}
          </Plane>
        </div>
        <div className="grid min-w-0 grid-cols-[auto_auto_auto] items-center gap-x-2 gap-y-1.5 text-sm">
          <div className={`col-span-3 flex items-center gap-1.5 whitespace-nowrap ${k >= 1 ? FADE : "invisible"}`}>
            <i className="h-1 w-4 shrink-0 rounded bg-cat-amber" />
            দর্শক <span className="font-mono">(2, 5)</span>
          </div>
          <span />
          <span className={`text-xs text-muted ${k >= 2 ? FADE : "invisible"}`}>score</span>
          <span className={`text-xs text-muted ${k >= 4 ? FADE : "invisible"}`}>length</span>
          {X11B_FILMS.map((m) => (
            <div key={m.name} className="contents">
              <span className={`flex items-center gap-1.5 whitespace-nowrap ${k >= m.show ? FADE : "invisible"}`}>
                <i className={`h-1 w-4 shrink-0 rounded ${m.swatch}`} />
                {m.name}
              </span>
              <b className={`font-mono ${k >= m.show ? FADE : "invisible"}`}>{m.score}</b>
              <span className={`font-mono ${k >= 4 ? FADE : "invisible"}`}>{f2(l2(m.at))}</span>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  LostGentleman: { done: {}, ask: { k: 2 } },
  SaminRows: { done: {}, arrived: { k: 3 } },
  SomsKing: { done: {}, step: { k: 3 } },
  LineUpThree: { done: {}, cards: { k: 3 } },
  PoleGame: { done: {}, first: { k: 3 } },
  MarksGame: { done: {}, call: { k: 2 } },
  PumpkinMachine: { done: {}, muddle: { k: 3 } },
  PhotoContest: { done: {}, rule: { k: 3 }, row: { k: 4 } },
  HowFar: { start: {}, shown: { guess: 1, shown: true } },
  WalkRows: { start: {}, walking: { route: "ENNE", done: ["EEENNNN"] }, won: { done: ["EEENNNN", "NNNNEEE", "ENENENN"] } },
  KingMoves: { start: {}, moving: { trail: [[0, 0], [1, 1], [2, 1]] }, won: { trail: [[0, 0], [1, 1], [2, 2], [3, 3], [3, 4]], won: true } },
  NameThree: { start: {}, one: { got: [true, false, false] }, all: { got: [true, true, true] } },
  OneAway: {
    start: {},
    painting: { guess: [0, null, null], bins: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [], []] },
    diamond: { who: 1, guess: [0, 2, null], bins: [Array.from({ length: 36 }, (_, i) => i), Array.from({ length: 30 }, (_, i) => i), []] },
    all: { who: 2, guess: [0, 1, 1], bins: [0, 1, 2].map(() => Array.from({ length: 36 }, (_, i) => i)) },
  },
  OneWildValue: { start: {}, measured: { guess: [2, 2], measured: true } },
  KnobFine: {
    start: {},
    round1: { knob: ROUNDS[0].best, won: [true, false] },
    round2: { round: 1, knob: ROUNDS[1].best, won: [true, true] },
  },
  PickTape: { start: {}, half: { picks: [1, 0, null, null] }, solved: { picks: [1, 0, 2, 1] } },
  WestWalk: { done: {}, mid: { k: 5 } },
  SameSpot: { done: {}, mid: { k: 2 } },
  SquareHundred: { done: {}, mid: { k: 2 } },
  RidgeLasso: { done: {}, mid: { k: 1 } },
  PandaGibbon: { done: {}, mid: { k: 2 } },
  WhichWay: { done: {}, mid: { k: 2 } },
  OneSlot: { done: {}, mid: { k: 3 } },
  SameSteps: { done: {}, mid: { k: 3 } },
  TaxiGrid: { done: {}, mid: { k: 2 } },
  KingTwoInOne: { done: {}, mid: { k: 2 } },
  ThreeRules: { done: {}, mid: { k: 1 } },
  PowerName: { done: {}, mid: { k: 2 } },
  PinchPush: { done: {}, mid: { k: 3 } },
  TypoOrNews: { done: {}, mid: { k: 2 } },
  FirstTouch: { done: {}, mid: { k: 3 } },
  GuardWorst: { done: {}, mid: { k: 2 } },
  GentWalks: { done: {}, mid: { k: 2 } },
  SomsSum: { done: {}, mid: { k: 2 } },
  NestNumbers: { done: {}, mid: { k: 2 } },
  LongerWins: { done: {}, mid: { k: 3 } },
  WorstPixel: { start: {}, tripped: { delta: [9, 0, 0, 0, 0, 0, 0, 0], tripped: true }, done: { delta: [5, -5, 4, 5, -3, 5, -5, 2], sel: 7, tripped: true } },
};
