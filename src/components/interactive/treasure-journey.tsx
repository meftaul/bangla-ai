"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  Draw,
  FADE,
  Nope,
  POP,
  Speech,
  Stepper,
  Ticks,
  predictLook,
  primaryBtn,
  quietBtn,
  Scene,
  usePlay,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
} from "@/components/journey/kit";
import { Arrow, Label, Plane, clamp, makeFrame, minus, plus, same, sg, snap, tup, type Frame, type XY } from "@/components/journey/plane";
import { Bubble, Card as CastCard, Chest, Gate, Person, Robot, Stage, Stall, StoryFrame, type Who } from "@/components/journey/cast";
import { Shiku, Trail, route, useWalk } from "./arrow-journey";
import { bn } from "./figure-kit";

// Screens for "Math for AI 3.1 — যোগ-বিয়োগ, মেলার গুপ্তধন", told as a Journey.
//
// The school science fair opens with a treasure hunt on a chalked field, and
// every clue card is an arrow. Shiku walks two cards one after the other and
// the prize turns out to be the two walks joined; three pairs given only as
// numbers give up the rule, slot with slot. সোম reads the cards the other way
// round and lands on the same corner. Then the rule leaves the paper: আম্মুর
// tiffin adds up as three-slot cards, and নাসিব's two mismatched cards cannot
// be added at all. Subtraction is the question asked backwards: which one card
// takes সামিন to the prize? End − start, three times, checked by walking it,
// and last read as "what changed" in her stall book.
//
// Tailwind only; the field is journey/plane, Shiku comes from arrow-journey.
// Ink on the white sheet is fixed, since the sheet stays white in both themes.

const O: XY = [0, 0];
/** the chalked field */
const FA = makeFrame(0, 7, 0, 6, 34);

/** Shiku's walk along one card, then the next from where he stopped. */
const walk2 = (s: XY, a: XY, b: XY) => [...route(s, a), ...route(plus(s, a), b).slice(1)];

const KEY_STEP: Record<string, XY> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
/** Arrow keys nudge something on the sheet by one square. */
const nudger = (move: (d: XY) => void) => (e: KeyboardEvent<SVGSVGElement>) => {
  const d = KEY_STEP[e.key];
  if (!d) return;
  e.preventDefault();
  move(d);
};

/** A clue card read out: "3 ঘর পূর্বে, 1 ঘর উত্তরে". */
const words = (v: XY) =>
  [v[0] ? `${Math.abs(v[0])} ঘর ${v[0] > 0 ? "পূর্বে" : "পশ্চিমে"}` : "", v[1] ? `${Math.abs(v[1])} ঘর ${v[1] > 0 ? "উত্তরে" : "দক্ষিণে"}` : ""]
    .filter(Boolean)
    .join(", ") || "কোথাও যেতে হবে না";

const CARD = {
  blue: { ink: "border-cat-blue/40 text-cat-blue", walk: "ring-4 ring-cat-blue/20", done: "bg-cat-blue/10 ring-4 ring-cat-blue/40" },
  coral: { ink: "border-cat-coral/40 text-cat-coral", walk: "ring-4 ring-cat-coral/20", done: "bg-cat-coral/10 ring-4 ring-cat-coral/40" },
  teal: { ink: "border-cat-teal/40 text-cat-teal", walk: "ring-4 ring-cat-teal/20", done: "bg-cat-teal/10 ring-4 ring-cat-teal/40" },
};

/**
 * A clue card; `plain` shows the numbers only. `lit` follows Shiku: 1 while he
 * walks this card, 2 once it is walked (it lights up and gets a tick).
 */
function Clue({ name, v, tone, plain = false, lit = 0 }: { name: ReactNode; v: XY; tone: keyof typeof CARD; plain?: boolean; lit?: 0 | 1 | 2 }) {
  const c = CARD[tone];
  return (
    <div
      className={`relative rounded-xl border-2 px-3 py-2 text-center transition-[box-shadow,background-color] duration-300 motion-reduce:transition-none ${c.ink} ${
        lit === 2 ? c.done : lit === 1 ? `bg-surface ${c.walk}` : "bg-surface"
      }`}
    >
      <div className="text-xs font-semibold text-muted">{name}</div>
      <div className="font-mono text-xl font-bold">{tup(v)}</div>
      {!plain && <div className="text-xs text-muted">{words(v)}</div>}
      {lit === 2 && (
        <span className={`${POP} absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-accent text-xs text-accent-foreground`} aria-hidden="true">
          ✓
        </span>
      )}
    </div>
  );
}

const GLOW = { blue: "fill-cat-blue/40", coral: "fill-cat-coral/40", teal: "fill-cat-teal/40" };

/** A soft ping where a card's walk just ended. */
function Glow({ f, at, tone }: { f: Frame; at: XY; tone: keyof typeof GLOW }) {
  return (
    <circle
      cx={f.sx(at[0])}
      cy={f.sy(at[1])}
      r={12}
      className={`pointer-events-none origin-center animate-ping [transform-box:fill-box] motion-reduce:animate-none ${GLOW[tone]}`}
    />
  );
}

const REST = 900;

/**
 * Shiku walks two cards from the gate with a breath in between. `phase`: 0
 * waiting, 1 on card A, 2 card A done (a pause, the card lights up), 3 on card
 * B, 4 card B done (another pause), 5 the whole trip traced.
 */
function useTwoWalk(ms: number) {
  const w = useWalk(ms);
  const [phase, setPhase] = useState(0);
  const [first, setFirst] = useState<XY[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const later = (fn: () => void) => {
    timer.current = setTimeout(fn, REST);
  };
  const go = (a: XY, b: XY, done: () => void) => {
    const pa = route(O, a);
    setFirst(pa);
    setPhase(1);
    w.go(pa, () => {
      setPhase(2);
      later(() => {
        setPhase(3);
        w.go(route(a, b), () => {
          setPhase(4);
          later(() => {
            setPhase(5);
            done();
          });
        });
      });
    });
  };
  const reset = () => {
    clearTimeout(timer.current);
    setPhase(0);
    setFirst([]);
    w.go([O]);
  };
  const trail = phase >= 3 ? [...first, ...w.trail.slice(1)] : w.trail;
  return { phase, here: w.here, trail, running: phase > 0 && phase < 5, go, reset };
}

/** What Shiku is up to, said while he walks two cards. */
function walkLine(phase: number, a: string, b: string) {
  const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
  if (phase === 1) return `Shiku আগে ${a} ধরে হাঁটছে।`;
  if (phase === 2) return `${cap(a)} শেষ! Shiku এখানে থামলো, ${b} শুরু হবে ঠিক এখান থেকে।`;
  if (phase === 3) return `এবার ${b}। গেটে ফিরে না গিয়ে, যেখানে থেমেছিল সেখান থেকেই।`;
  if (phase === 4) return `${cap(b)}-ও শেষ। এবার পুরো পথটা একবার দেখি।`;
  return null;
}

/** 0 before a card is walked, 1 while it is, 2 after. */
const litA = (p: number) => (p >= 2 ? 2 : p === 1 ? 1 : 0);
const litB = (p: number) => (p >= 4 ? 2 : p === 3 ? 1 : 0);

/** X marks the spot; the chest pops up beside it once it is found. */
export function Prize({ f, at, found = false }: { f: Frame; at: XY; found?: boolean }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 6} ${y - 6}L${x + 6} ${y + 6}M${x + 6} ${y - 6}L${x - 6} ${y + 6}`} strokeWidth={3} strokeLinecap="round" className="stroke-danger" />
      {found && (
        <g className={POP}>
          <rect x={x + 7} y={y - 18} width={18} height={11} rx={2} className="fill-[#b45309]" />
          <path d={`M${x + 7} ${y - 18}q9 -9 18 0Z`} className="fill-[#d97706]" />
          <rect x={x + 14} y={y - 16} width={4} height={5} rx={1} className="fill-[#fde68a]" />
        </g>
      )}
    </g>
  );
}

export function Samin({ f, at }: { f: Frame; at: XY }) {
  return (
    <g className="pointer-events-none">
      <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={6} className="fill-cat-teal" />
      <text x={f.sx(at[0])} y={f.sy(at[1]) + 20} textAnchor="middle" fontSize={10} fontWeight={600} className="fill-[#0f1b2d]">
        সামিন
      </text>
    </g>
  );
}

/** The reader's guess on the sheet. */
function Ring({ f, at }: { f: Frame; at: XY }) {
  return <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={10} strokeWidth={2} strokeDasharray="4 3" className="pointer-events-none fill-cat-blue/10 stroke-cat-blue" />;
}

/** A clue card, small, for the explanation figures. */
function Chip({ v, tone, className = "" }: { v: readonly number[]; tone: keyof typeof CARD; className?: string }) {
  return (
    <span className={`inline-block rounded-lg border-2 bg-surface px-2 py-0.5 font-mono text-sm font-bold whitespace-nowrap ${CARD[tone].ink} ${className}`}>{tup(v)}</span>
  );
}

/** Shiku along `path` in a scene: square by square to its end while `on`, back to its start when not. */
function useSceneWalk(path: XY[], on: boolean, ms: number) {
  const t = useTween([on ? path.length - 1 : 0], ms);
  const i = clamp(Math.round(t[0]), 0, path.length - 1);
  return { here: path[i], trail: path.slice(0, i + 1) };
}

// ---------------------------------------------------------------------------
// Story scenes (sections 1a, 3a …): small painted pictures that act out a step's
// setup words, marked `story` in the MDX so they flow with the paragraphs. The
// treasure field is chalked on the ground, drawn here in perspective.

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** Chalk lines on the ground, from the horizon at `top` down to the stage's foot. */
function ChalkGrid({ top }: { top: number }) {
  const vy = top - 60;
  const cut = (xb: number) => xb + (160 - xb) * ((180 - top) / (180 - vy));
  const rows = [4, 10, 19, 31, 47].map((d) => top + d).filter((y) => y < 180);
  return (
    <g className="pointer-events-none" stroke="white" strokeOpacity={0.55} strokeWidth={1}>
      {Array.from({ length: 13 }, (_, i) => {
        const xb = 160 + (i - 6) * 56;
        return <path key={i} d={`M${cut(xb)} ${top}L${xb} 180`} />;
      })}
      {rows.map((y) => (
        <path key={y} d={`M0 ${y}H320`} />
      ))}
    </g>
  );
}

// 1a · A story scene for screen 1's setup, no task: the fair opens. ফাহিম at
//      his stall, সংখ্যার মেলা, calls the treasure hunt on; the Gate is marked
//      (0, 0) on the chalked field; Shiku walks up to it holding his two cards.
//      ফাহিম asks where the treasure is, and the picture never tells.

const S1_Y = 160;
const S1_GATE = 64;
const S1_FAHIM = 196;

export function FairGate({}: Story) {
  const s = useScene(5, [600, 2400, 1200, 1500, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" ground={118} label="the science fair: ফাহিম at his stall starts the treasure hunt, and Shiku walks up to the Gate at (0, 0) with two cards, (3, 1) and (1, 4)">
        <ChalkGrid top={118} />
        <Stall x={268} y={118} w={80} sign="সংখ্যার মেলা" color="#2563eb" />
        <Gate x={S1_GATE} y={S1_Y} />
        {k >= 2 && (
          <g className={POP}>
            <ellipse cx={S1_GATE} cy={S1_Y} rx={16} ry={4} fill="none" stroke="white" strokeWidth={1.6} />
            <text x={S1_GATE} y={S1_Y + 14} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="white">
              (0, 0)
            </text>
          </g>
        )}
        <Robot x={k >= 3 ? S1_GATE : -30} y={S1_Y} ms={1400} walking={k === 3} />
        {k >= 4 && (
          <>
            <CastCard x={S1_GATE - 25} y={S1_Y - 52} text="(3, 1)" tone="blue" />
            <CastCard x={S1_GATE + 25} y={S1_Y - 52} text="(1, 4)" tone="coral" />
          </>
        )}
        <Person who="fahim" x={S1_FAHIM} y={S1_Y} facing={-1} arm={k === 1 ? "wave" : k >= 5 ? "point" : "down"} mood={k === 1 ? "shout" : "happy"} label />
        {k === 1 && <Bubble x={S1_FAHIM} y={S1_Y - 66} side="left" lines={["Treasure Hunt শুরু!"]} />}
        {k >= 5 && <Bubble x={S1_FAHIM} y={S1_Y - 66} side="left" lines={["বলো তো,", "treasure কোথায়?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · Two clue cards. The reader marks a guess, Shiku walks card 1 and then
//     card 2 from where he stopped, and the prize sits at the two walks joined.

const U1: XY = [3, 1];
const V1: XY = [1, 4];
const S1 = plus(U1, V1);

export function TwoClues() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<XY | null>("guess", null);
  const [walked, setWalked] = useSeed("walked", false);
  const t = useTwoWalk(240);
  const path = walk2(O, U1, V1);
  const phase = walked ? 5 : t.phase;
  const locked = t.running || walked;

  const put = (p: XY) => {
    if (!locked) setGuess(snap(p, FA));
  };
  const go = () =>
    t.go(U1, V1, () => {
      setWalked(true);
      pass("দ্বিতীয় হাঁটা শুরু প্রথমটার শেষে।");
    });

  return (
    <>
      <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-3">
        <Clue name="card ১" v={U1} tone="blue" lit={litA(phase)} />
        <Clue name="card ২" v={V1} tone="coral" lit={litB(phase)} />
      </div>
      <div className="mt-2 text-center text-sm text-muted">
        কাগজে পূর্ব মানে ডানে, উত্তর মানে ওপরে। আর card&nbsp;২ পড়া শুরু হবে card&nbsp;১ যেখানে থামে, সেখান থেকে।
      </div>
      <Plane
        f={FA}
        ticks={1}
        label={walked ? "Shiku walked (3, 1), then (1, 4), and found the prize at (4, 5)" : "Shiku at the gate of a chalked field; tap where the prize is"}
        drag={locked ? undefined : { down: put, move: put }}
        onKey={locked ? undefined : nudger((d) => setGuess(snap(plus(guess ?? O, d), FA)))}
      >
        <Trail f={FA} cells={walked ? path : t.trail} faint={phase === 5} />
        {phase >= 2 && <Arrow f={FA} from={O} to={U1} tone="blue" draw />}
        {phase === 2 && <Glow f={FA} at={U1} tone="blue" />}
        {phase >= 4 && <Arrow f={FA} from={U1} to={S1} tone="coral" draw />}
        {phase === 4 && <Glow f={FA} at={S1} tone="coral" />}
        {phase === 5 && (
          <>
            <Arrow f={FA} from={O} to={S1} tone="teal" w={3.2} draw />
            <Prize f={FA} at={S1} found />
          </>
        )}
        {guess && <Ring f={FA} at={guess} />}
        <Shiku f={FA} at={walked ? S1 : t.here} />
      </Plane>
      <div className="min-h-7 text-center text-[0.95rem]">
        {walked ? (
          <span className={FADE}>
            {guess && same(guess, S1) ? (
              <>
                গুপ্তধন <b className="font-mono">{tup(S1)}</b>-এ, আর আপনার guess একদম ঠিক!
              </>
            ) : (
              <>
                গুপ্তধন পাওয়া গেল <b className="font-mono">{tup(S1)}</b>-এ। আপনি ধরেছিলেন {guess ? tup(guess) : "অন্য কোথাও"}। Card দুইটা আরেকবার মিলিয়ে দেখুন তো।
              </>
            )}
          </span>
        ) : t.running ? (
          <span key={phase} className={FADE}>
            {walkLine(phase, "card ১", "card ২")}
          </span>
        ) : guess ? (
          <span>
            আপনার guess <b className="font-mono">{tup(guess)}</b>। এবার Shiku-কে ছেড়ে দিন।
          </span>
        ) : (
          <span className="text-muted">গুপ্তধন কোথায় লুকানো মনে হয়? কাগজে tap করে দেখান।</span>
        )}
      </div>
      {!walked && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={go} disabled={!guess || t.running} className={`${primaryBtn} bg-cat-violet`}>
            Shiku, হাঁটো!
          </button>
        </div>
      )}
      <Task done={walked}>আগে কাগজে tap করে একটা guess করুন, তারপর Shiku-কে হাঁটতে পাঠান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: tip to tail. Card ১ is
//      drawn from the gate. Card ২ first sits at the gate too, where it would
//      have gone had Shiku started over, then glides onto card ১'s tip; the
//      one straight arrow to the prize closes it.

const FT = makeFrame(0, 5, 0, 5, 26, 14);
const TT_SAY = [
  "Shiku-র সেই দুইটা card, আরেকবার।",
  "Card ১ ধরে হেঁটে Shiku থামলো (3, 1)-এ।",
  "গেটে ফিরে card ২ ধরলে Shiku যেত (1, 4)-এ। কিন্তু ও তা করেনি।",
  "Card ২-এর লেজ গিয়ে বসলো card ১-এর মাথায়।",
];

export function TipToTail() {
  const s = useScene(4, [500, 1300, 1700, 1500]);
  const k = s.k;
  const tail = useTween(k >= 3 ? U1 : O, 900);
  const at: XY = [tail[0], tail[1]];
  const shiku = useTween(k >= 4 ? S1 : k >= 1 ? U1 : O, 700);

  return (
    <Scene
      scene={s}
      caption={k < 4 ? <span key={k} className={FADE}>{TT_SAY[k]}</span> : <span className={FADE}>মাথায় লেজ জুড়তেই গেট থেকে গুপ্তধন পর্যন্ত একটাই সোজা arrow, (4, 5)।</span>}
    >
      <Plane f={FT} label="card 1 (3, 1) from the gate, card 2 (1, 4) moved from the gate onto its tip, and the straight arrow (4, 5)" className="my-1! max-w-[11rem]">
        {k === 2 && (
          <Label f={FT} at={V1} dx={-6} dy={-8} anchor="start" size={9} className={`${FADE} fill-cat-coral`}>
            (1, 4)?
          </Label>
        )}
        {k >= 3 && <Arrow f={FT} from={O} to={V1} tone="coral" w={2} dashed faint />}
        {k >= 1 && <Arrow f={FT} from={O} to={U1} tone="blue" draw />}
        {k === 2 && (
          <g className={FADE}>
            <Arrow f={FT} from={O} to={V1} tone="coral" dashed />
          </g>
        )}
        {k >= 3 && <Arrow f={FT} from={at} to={plus(at, V1)} tone="coral" />}
        {k >= 4 && (
          <>
            <Arrow f={FT} from={O} to={S1} tone="teal" w={3.2} draw />
            <Prize f={FT} at={S1} found />
          </>
        )}
        <circle cx={FT.sx(0)} cy={FT.sy(0)} r={4} className="pointer-events-none fill-[#0f1b2d]" />
        <Shiku f={FT} at={[shiku[0], shiku[1]]} />
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1¾ · A figure for screen 1's explanation, no task: two cards did one card's
//      work. Shiku's zigzag walk is traced, then covered by the one straight
//      arrow (4, 5), and the two cards fold into one. Last, the next pair
//      turns up with its answer blank: walk him every time, or a shortcut?

const X1_F = makeFrame(0, 5, 0, 5, 22, 12);
const X1_PATH = walk2(O, U1, V1);
const X1_SAY = [
  "Shiku হাঁটলো আঁকাবাঁকা: ডানে, ওপরে, আবার ডানে, আবার ওপরে।",
  "Shiku হাঁটলো আঁকাবাঁকা: ডানে, ওপরে, আবার ডানে, আবার ওপরে।",
  "কিন্তু গেট থেকে গুপ্তধন পর্যন্ত একটাই সোজা arrow, (4,\u00a05)।",
  "মানে দুইটা card মিলে একটা card-এরই কাজ করলো।",
  "নতুন জোড়া এলেই কি আবার হাঁটাতে হবে? নাকি কোনো shortcut আছে?",
];

export function OneCard() {
  const s = useScene(4, [600, 1700, 1500, 1700]);
  const k = s.k;
  const w = useSceneWalk(X1_PATH, k >= 1, 1400);
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X1_SAY[k]}
        </span>
      }
    >
      <div className="flex items-center justify-center gap-4">
        <div className={`w-[8.5rem] shrink-0 transition-opacity duration-500 motion-reduce:transition-none ${k >= 4 ? "opacity-40" : ""}`}>
          <Plane f={X1_F} label="Shiku's zigzag walk along (3, 1) and (1, 4), and the one straight arrow (4, 5) from the gate to the prize" className="my-0! max-w-none">
            <Trail f={X1_F} cells={w.trail} faint={k >= 2} />
            {k >= 2 && <Arrow f={X1_F} from={O} to={S1} tone="teal" w={3.2} draw />}
            <Prize f={X1_F} at={S1} found={k >= 2} />
            <circle cx={X1_F.sx(0)} cy={X1_F.sy(0)} r={4} className="pointer-events-none fill-[#0f1b2d]" />
            <Shiku f={X1_F} at={w.here} />
          </Plane>
        </div>
        <div className="flex w-[6.5rem] shrink-0 flex-col items-center gap-1 text-center">
          {k < 4 ? (
            <>
              <div className={`flex flex-col items-center gap-1 transition-opacity duration-500 motion-reduce:transition-none ${k >= 3 ? "opacity-40" : ""}`}>
                <Chip v={U1} tone="blue" />
                <span className="font-mono text-muted">+</span>
                <Chip v={V1} tone="coral" />
              </div>
              <div className="flex min-h-9 items-center">
                {k >= 3 && (
                  <span className={`${POP} inline-flex items-center gap-1.5`}>
                    <span className="font-mono text-muted">=</span>
                    <Chip v={S1} tone="teal" />
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className={`${FADE} flex flex-col items-center gap-1`}>
              <Chip v={[2, 3]} tone="blue" />
              <span className="font-mono text-muted">+</span>
              <Chip v={[4, 1]} tone="coral" />
              <span className="flex min-h-9 items-center gap-1.5 font-mono">
                <span className="text-muted">=</span>
                <span className="rounded-lg border-2 border-dashed border-muted/50 px-2 py-0.5 text-sm font-bold text-muted">(?, ?)</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2 · Three pairs, numbers only. The reader writes the answer first, then
//     Shiku walks it to check; the table fills up until slot-with-slot shows.

const PAIRS: [XY, XY][] = [
  [
    [2, 3],
    [4, 1],
  ],
  [
    [1, 4],
    [5, 1],
  ],
  [
    [0, 2],
    [3, 3],
  ],
];

export function SlotAdd() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [solved, setSolved] = useSeed("solved", 0);
  const [ans, setAns] = useSeed<XY>("ans", [0, 0]);
  const [landed, setLanded] = useSeed<XY | null>("landed", null);
  const [miss, setMiss] = useState<{ n: number; a: XY } | null>(null);
  const t = useTwoWalk(240);
  const [u, v] = PAIRS[round];
  const sum = plus(u, v);
  const done = solved > round;
  const last = round === PAIRS.length - 1;
  const phase = landed ? 5 : t.phase;

  const check = () => {
    const a = ans;
    setLanded(null);
    // The steppers are blocked while he walks, so this round is still current when he stops.
    t.go(u, v, () => {
      setLanded(sum);
      if (same(a, sum)) {
        setSolved(round + 1);
        if (last) pass("ঘরে ঘরে যোগ, vector যোগ এতটুকুই।");
      } else setMiss((m) => ({ n: (m?.n ?? 0) + 1, a }));
    });
  };
  const next = () => {
    setRound(round + 1);
    setAns([0, 0]);
    setLanded(null);
    setMiss(null);
    t.reset();
  };

  return (
    <>
      <div className="mt-4 text-center text-sm text-muted">
        তিন জোড়ার {bn(round + 1)} নম্বর। নাম ছোট রাখতে প্রথম card-টাকে ডাকি u, দ্বিতীয়টাকে v।
      </div>
      <div className="mx-auto mt-2 grid max-w-xs grid-cols-2 gap-3">
        <Clue name="u" v={u} tone="blue" plain lit={litA(phase)} />
        <Clue name="v" v={v} tone="coral" plain lit={litB(phase)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-2xl bg-cat-teal/5 px-4 py-3 font-mono text-lg">
        <span className="font-semibold">u + v = (</span>
        <Stepper value={ans[0]} min={0} max={7} label="প্রথম ঘর" disabled={t.running || done} onChange={(a) => setAns([a, ans[1]])} />
        <span>,</span>
        <Stepper value={ans[1]} min={0} max={6} label="দ্বিতীয় ঘর" disabled={t.running || done} onChange={(b) => setAns([ans[0], b])} />
        <span>)</span>
      </div>
      <div className="mt-3 flex justify-center">
        {!done ? (
          <button type="button" onClick={check} disabled={t.running} className={`${primaryBtn} bg-cat-violet`}>
            Shiku-কে দিয়ে মিলিয়ে দেখুন
          </button>
        ) : !last ? (
          <button type="button" onClick={next} className={quietBtn}>
            পরের জোড়া →
          </button>
        ) : null}
      </div>
      {miss && !done && !t.running && (
        <Nope key={miss.n}>
          উঁহু, Shiku গিয়ে থামলো {tup(sum)}-এ, আর আপনার উত্তর ছিল {tup(miss.a)}। Card দুইটার সংখ্যাগুলোর দিকে আরেকবার তাকান তো।
        </Nope>
      )}
      <Plane f={FA} ticks={1} label={landed ? `Shiku walked ${tup(u)} then ${tup(v)} and stopped at ${tup(sum)}` : "Shiku at the gate, waiting"} className="max-w-[19rem]">
        <Trail f={FA} cells={landed ? walk2(O, u, v) : t.trail} faint={phase === 5} />
        {phase >= 2 && <Arrow f={FA} from={O} to={u} tone="blue" draw />}
        {phase === 2 && <Glow f={FA} at={u} tone="blue" />}
        {phase >= 4 && <Arrow f={FA} from={u} to={sum} tone="coral" draw />}
        {phase === 4 && <Glow f={FA} at={sum} tone="coral" />}
        {phase === 5 && (
          <>
            <Arrow f={FA} from={O} to={sum} tone="teal" w={3.2} draw />
            <Prize f={FA} at={sum} found={done} />
            <Ring f={FA} at={ans} />
          </>
        )}
        <Shiku f={FA} at={landed ?? t.here} />
      </Plane>
      <div className="min-h-6 text-center text-sm text-muted">
        {t.running && (
          <span key={phase} className={FADE}>
            {walkLine(phase, "card u", "card v")}
          </span>
        )}
      </div>
      {solved > 0 && (
        <div className="overflow-x-auto">
          <table className="mx-auto text-center font-mono tabular-nums">
            <thead>
              <tr className="font-sans text-xs text-muted">
                <th className="px-3 pb-1 font-normal">u</th>
                <th className="px-3 pb-1 font-normal">v</th>
                <th className="px-3 pb-1 font-normal">u + v</th>
              </tr>
            </thead>
            <tbody>
              {PAIRS.slice(0, solved).map(([a, b], i) => (
                <tr key={i} className={FADE}>
                  <td className="px-3 text-cat-blue">{tup(a)}</td>
                  <td className="px-3 text-cat-coral">{tup(b)}</td>
                  <td className="px-3 font-bold text-cat-teal">{tup(plus(a, b))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Ticks items={PAIRS.map((_, i) => [`জোড়া ${bn(i + 1)}`, solved > i])} />
      <Task done={solved === PAIRS.length}>প্রতিটা জোড়ায় আগে নিজে উত্তর বসান, তারপর Shiku-কে দিয়ে মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2¼ · A figure for screen 2's explanation, no task: the table, read slot by
//      slot. The first pair comes in with its answer blank; the two first
//      slots light up and give 6, the two second slots give 4; then the other
//      two pairs fill in, lit the same way.

const X2_LIT = ["bg-cat-blue/15 text-cat-blue", "bg-cat-coral/15 text-cat-coral"];
const X2_SAY = [
  "(2,\u00a03) আর (4,\u00a01) থেকে (6,\u00a04) আসলো কোথা থেকে?",
  "(2,\u00a03) আর (4,\u00a01) থেকে (6,\u00a04) আসলো কোথা থেকে?",
  "প্রথম সংখ্যা দুইটা যোগ করলে 2 + 4 = 6।",
  "দ্বিতীয় দুইটা যোগ করলে 3 + 1 = 4।",
  "বাকি দুই জোড়াতেও হুবহু একই কাহিনি।",
];

/** A pair as two slots; `lit` tints a slot, and a slot not yet `shown` reads "?". */
function X2Pair({ v, lit, shown = [true, true] }: { v: XY; lit: [boolean, boolean]; shown?: [boolean, boolean] }) {
  const slot = (i: 0 | 1) => (
    <span className={`inline-block rounded px-0.5 transition-colors duration-500 motion-reduce:transition-none ${lit[i] ? X2_LIT[i] : ""}`}>
      {shown[i] ? (
        <span key="n" className={`${POP} inline-block font-bold`}>
          {sg(v[i])}
        </span>
      ) : (
        <span className="text-muted">?</span>
      )}
    </span>
  );
  return (
    <span className="whitespace-nowrap">
      ({slot(0)}, {slot(1)})
    </span>
  );
}

export function SlotTable() {
  const s = useScene(4, [500, 1500, 1600, 1600]);
  const k = s.k;
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X2_SAY[k]}
        </span>
      }
    >
      <div className="mx-auto grid w-fit grid-cols-[auto_auto_auto_auto_auto] items-center gap-x-2 gap-y-2 font-mono text-base tabular-nums">
        {["u", "", "v", "", "u + v"].map((h, i) => (
          <span key={i} className="text-center font-sans text-xs text-muted">
            {h}
          </span>
        ))}
        {PAIRS.map(([a, b], i) => {
          const on = i === 0 ? k >= 1 : k >= 4;
          const lit: [boolean, boolean] = i === 0 ? [k >= 2, k >= 3] : [on, on];
          const cls = `transition-opacity duration-500 motion-reduce:transition-none ${on ? "" : "opacity-0"}`;
          return (
            <div key={i} style={{ transitionDelay: i === 2 ? "500ms" : "0ms" }} className={`col-span-5 grid grid-cols-subgrid items-center ${cls}`}>
              <X2Pair v={a} lit={lit} />
              <span className="text-muted">+</span>
              <X2Pair v={b} lit={lit} />
              <span className="text-muted">=</span>
              <X2Pair v={plus(a, b)} lit={lit} shown={lit} />
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: why slot meets slot.
//      (2, 3) + (4, 1) walked as a staircase; the two eastward legs drop to
//      the floor and line up, 2 + 4 = 6; the two northward legs slide to the
//      wall, 3 + 1 = 4. The x numbers never meet the y numbers.

const FSL = makeFrame(-1.6, 7, -1.6, 5, 24, 10);
const SL_U = PAIRS[0][0];
const SL_V = PAIRS[0][1];
const SL_S = plus(SL_U, SL_V);
/** where the legs are laid out once they move: a row under the floor, a column left of the wall */
const SL_ROW = -0.6;
const SL_COL = -0.6;
/** Shiku's four legs: east along u, north along u, east along v, north along v */
const SL_EAST: { a: XY; b: XY; tone: "blue" | "coral"; n: number }[] = [
  { a: O, b: [SL_U[0], 0], tone: "blue", n: SL_U[0] },
  { a: [SL_U[0], SL_U[1]], b: [SL_S[0], SL_U[1]], tone: "coral", n: SL_V[0] },
];
const SL_NORTH: { a: XY; b: XY; tone: "blue" | "coral"; n: number }[] = [
  { a: [SL_U[0], 0], b: SL_U, tone: "blue", n: SL_U[1] },
  { a: [SL_S[0], SL_U[1]], b: SL_S, tone: "coral", n: SL_V[1] },
];
const SL_INK = { blue: { stroke: "stroke-cat-blue", fill: "fill-cat-blue" }, coral: { stroke: "stroke-cat-coral", fill: "fill-cat-coral" } };
const SL_MOVE = "transition-transform duration-700 ease-in-out motion-reduce:transition-none";
const SL_SAY = [
  "পথটা সিঁড়ির মতো: ডানে, ওপরে, ডানে, ওপরে।",
  "পথটা সিঁড়ির মতো: ডানে, ওপরে, ডানে, ওপরে।",
  "ডানে হাঁটা শুধু এই দুই টুকরায়।",
  "নিচে নামিয়ে পাশাপাশি রাখলে 2 আর 4, মোট 6।",
  "ওপরে হাঁটা শুধু এই দুই টুকরায়।",
  "পাশে সরিয়ে রাখলে 3 আর 1, মোট 4।",
  "x-এর সংখ্যা কখনো y-এর সাথে মেশেনি।",
];

export function SlotShadow() {
  const s = useScene(6, [400, 1400, 1300, 1600, 1300, 1400]);
  const k = s.k;
  const leg = (l: (typeof SL_EAST)[number], shift: string, label: ReactNode) => (
    <g key={`${l.a}`} className={FADE}>
      <g style={{ transform: shift }} className={SL_MOVE}>
        <path d={`M${FSL.sx(l.a[0])} ${FSL.sy(l.a[1])}L${FSL.sx(l.b[0])} ${FSL.sy(l.b[1])}`} strokeWidth={5} strokeLinecap="round" className={`pointer-events-none ${SL_INK[l.tone].stroke}`} />
        {label}
      </g>
    </g>
  );

  return (
    <Scene
      scene={s}
      caption={
        <>
          <div className="font-mono text-base text-foreground">
            (2, 3) + (4, 1){k >= 3 && <> = (<b className="text-cat-teal">6</b>, {k >= 5 ? <b className="text-cat-teal">4</b> : "?"})</>}
          </div>
          <div key={k} className={FADE}>
            {SL_SAY[k]}
          </div>
        </>
      }
    >
      <Plane f={FSL} label="(2, 3) + (4, 1) walked as a staircase; the east legs line up to 6, the north legs to 4" className="my-1! max-w-[14rem]">
        {k >= 1 && (
          <>
            <Trail f={FSL} cells={walk2(O, SL_U, SL_V)} faint />
            <Arrow f={FSL} from={O} to={SL_U} tone="blue" w={2} draw faint={k >= 2} />
            <Arrow f={FSL} from={SL_U} to={SL_S} tone="coral" w={2} draw delay={500} faint={k >= 2} />
          </>
        )}
        {k >= 2 &&
          SL_EAST.map((l) =>
            leg(
              l,
              `translate(0px, ${k >= 3 ? FSL.sy(SL_ROW) - FSL.sy(l.a[1]) : 0}px)`,
              <text x={(FSL.sx(l.a[0]) + FSL.sx(l.b[0])) / 2} y={FSL.sy(l.a[1]) + 14} textAnchor="middle" fontSize={10} fontWeight={700} className={`pointer-events-none font-mono ${SL_INK[l.tone].fill}`}>
                {l.n}
              </text>,
            ),
          )}
        {k >= 4 &&
          SL_NORTH.map((l) =>
            leg(
              l,
              `translate(${k >= 5 ? FSL.sx(SL_COL) - FSL.sx(l.a[0]) : 0}px, 0px)`,
              <text x={FSL.sx(l.a[0]) - 7} y={(FSL.sy(l.a[1]) + FSL.sy(l.b[1])) / 2 + 3.5} textAnchor="end" fontSize={10} fontWeight={700} className={`pointer-events-none font-mono ${SL_INK[l.tone].fill}`}>
                {l.n}
              </text>,
            ),
          )}
        {k >= 6 && (
          <>
            <Arrow f={FSL} from={O} to={SL_S} tone="teal" w={3} draw />
            <Label f={FSL} at={SL_S} dx={-4} dy={-8} anchor="end" size={10} weight={700} className={`${FADE} fill-cat-teal font-mono`}>
              (6, 4)
            </Label>
          </>
        )}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: সোম, contrary as ever.
//      ফাহিম holds the two cards in the order he walked them; সোম walks up with
//      the same two, says he'll read them the other way round, and they trade
//      places over his head. Where he ends up is the widget's question.

const S3_Y = 160;
const S3_FAHIM = 112;
const S3_SOM = 238;
const S3_GAP = 25;

/** A clue card with its name over it, gliding when `dx` changes. */
function S3Card({ x, y, dx, name, text, tone }: { x: number; y: number; dx: number; name: string; text: string; tone: "blue" | "coral" }) {
  return (
    <g style={{ transform: `translate(${dx}px, 0px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
      <text x={x} y={y - 12} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#0f1b2d" className={POP}>
        {name}
      </text>
      <CastCard x={x} y={y} text={text} tone={tone} />
    </g>
  );
}

export function SomFlips({}: Story) {
  const s = useScene(5, [600, 1300, 1700, 1300, 2600]);
  const k = s.k;
  const flip = k >= 5 ? 2 * S3_GAP : 0;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" ground={118} label="ফাহিম holds card 1 (3, 1) and card 2 (1, 4); সোম walks up with the same cards and swaps them round to read card 2 first">
        <ChalkGrid top={118} />
        <Gate x={40} y={S3_Y} />
        <Person who="fahim" x={S3_FAHIM} y={S3_Y} arm={k >= 1 ? "hold" : "down"} mood={k >= 5 ? "puzzled" : "plain"} label />
        {k >= 1 && (
          <>
            <S3Card x={S3_FAHIM - S3_GAP} y={S3_Y - 76} dx={0} name="card ১" text="(3, 1)" tone="blue" />
            <S3Card x={S3_FAHIM + S3_GAP} y={S3_Y - 76} dx={0} name="card ২" text="(1, 4)" tone="coral" />
          </>
        )}
        <Person who="som" x={k >= 2 ? S3_SOM : 370} y={S3_Y} facing={-1} walking={k === 2} arm={k >= 3 ? "hold" : "down"} mood={k >= 4 ? "smug" : "plain"} ms={1500} label={k >= 3} />
        {k >= 3 && (
          <>
            <S3Card x={S3_SOM - S3_GAP} y={S3_Y - 76} dx={flip} name="card ১" text="(3, 1)" tone="blue" />
            <S3Card x={S3_SOM + S3_GAP} y={S3_Y - 76} dx={-flip} name="card ২" text="(1, 4)" tone="coral" />
          </>
        )}
        {k >= 4 && <Bubble x={S3_SOM} y={S3_Y - 98} side="left" lines={["আমি কিন্তু উল্টো", "করে পড়বো!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · সোম reads card 2 first. The two cards trade places, the reader predicts,
//     Shiku walks সোমের order. The routes close into a parallelogram, and then
//     each of সোম's arrows slides onto ফাহিম's matching one: the same two cards,
//     only walked in the other order.

const SWAP = ["হ্যাঁ, একই জায়গায় পৌঁছাবে", "না, অন্য কোথাও গিয়ে থামবে", "হেঁটে না দেখে বলা যাবে না"];

/** Card slots trading places: each moves one card-width plus the gap. */
const SLIDE_R = "translate-x-[calc(100%+0.75rem)]";
const SLIDE_L = "-translate-x-[calc(100%+0.75rem)]";

/** Under the field, one line per beat of the after-walk replay. */
const SHOW = [
  <>দুইজনের পথ মিলে একটা হেলানো চারকোণা আঁকা হয়ে গেল, আর দুইটা পথই গিয়ে ঠেকলো একই কোণায়।</>,
  <>
    <b className="text-cat-blue">নীল</b> arrow দুইটা দেখুন। ফাহিম এটা হাঁটলো সবার আগে, আর সোম হাঁটলো সবার শেষে।
  </>,
  <>সোমের নীল arrow-টা তুলে ফাহিমেরটার ওপর বসিয়ে দিলে? একদম খাপে খাপ মিলে গেল।</>,
  <>
    <b className="text-cat-coral">লাল</b> arrow দুইটাতেও একই কাহিনি। এবার সোম এটা হাঁটলো আগে, ফাহিম হাঁটলো পরে।
  </>,
  <>এটাও সরিয়ে বসালে হুবহু মিলে যায়। শুধু কাগজের জায়গাটা আলাদা ছিল।</>,
  <>দুইজন হেঁটেছে একই দুইটা card, শুধু order আলাদা। তাই পৌঁছালোও একই জায়গায়, (4, 5)-এ।</>,
];

export function SwapOrder() {
  const pass = useGate();
  const [swapped, setSwapped] = useSeed("swapped", false);
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [walked, setWalked] = useSeed("walked", false);
  const t = useTwoWalk(240);
  const replay = usePlay(1300);
  const path = walk2(O, V1, U1);
  const pts = [O, U1, S1, V1].map((p) => `${FA.sx(p[0])},${FA.sy(p[1])}`).join(" ");
  const phase = walked ? 5 : t.phase;
  // A seeded "walked" preview has never replayed, so it shows the last beat.
  const show = !walked ? -1 : replay.running || replay.k > 0 ? replay.k : SHOW.length - 1;
  const settled = show === SHOW.length - 1;
  const focus = show === 1 || show === 2 ? "blue" : show === 3 || show === 4 ? "coral" : null;
  // সোম's blue arrow sits at (1, 4) and glides down onto ফাহিম's; his red one glides up onto ফাহিম's.
  const blueAt = useTween(show >= 2 ? O : V1, 900);
  const coralAt = useTween(show >= 4 ? U1 : O, 900);

  // Show সোম turning the cards round before anything is asked.
  useEffect(() => {
    if (swapped) return;
    const id = setTimeout(() => setSwapped(true), 900);
    return () => clearTimeout(id);
  }, [swapped, setSwapped]);

  const go = () =>
    t.go(V1, U1, () => {
      setWalked(true);
      replay.play(SHOW.length - 1, () =>
        pass("u + v = v + u, আগে-পরে লাগে না।"),
      );
    });

  return (
    <>
      <Speech who="সোম" initial="সো" tint="teal">
        আমি কিন্তু উল্টো করে পড়বো। আগে card ২, তারপর card ১।
      </Speech>
      <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-x-3 text-center text-xs text-muted">
        <span>আগে</span>
        <span>তারপর</span>
      </div>
      <div className="mx-auto mt-1 grid max-w-xs grid-cols-2 gap-3">
        <div className={`transition-transform duration-700 ease-in-out motion-reduce:transition-none ${swapped ? SLIDE_R : ""}`}>
          <Clue name="card ১" v={U1} tone="blue" lit={litB(phase)} />
        </div>
        <div className={`transition-transform duration-700 ease-in-out motion-reduce:transition-none ${swapped ? SLIDE_L : ""}`}>
          <Clue name="card ২" v={V1} tone="coral" lit={litA(phase)} />
        </div>
      </div>
      <div className="mt-1 text-center text-sm text-muted">{swapped ? "সোম card দুইটার জায়গা বদলে নিলো।" : "ফাহিম পড়েছিল এই order-এ।"}</div>
      <Plane f={FA} ticks={1} label={walked ? "two routes, (3, 1) then (1, 4) and (1, 4) then (3, 1), meeting at (4, 5)" : "Fahim's route: (3, 1), then (1, 4), to the prize at (4, 5)"}>
        {walked && <polygon points={pts} className={`${FADE} pointer-events-none fill-cat-teal/15`} />}
        <Arrow f={FA} from={O} to={U1} tone="blue" faint={focus === "coral"} />
        <Arrow f={FA} from={U1} to={S1} tone="coral" faint={focus === "blue"} />
        <Label f={FA} at={U1} dx={8} dy={14} anchor="start" size={9} className="fill-cat-blue">
          ফাহিম
        </Label>
        <Trail f={FA} cells={walked ? path : t.trail} faint={phase === 5} />
        {phase >= 2 && <Arrow f={FA} from={O} to={V1} tone="coral" draw faint={focus === "blue" || show === 4} />}
        {phase === 2 && <Glow f={FA} at={V1} tone="coral" />}
        {phase >= 4 && <Arrow f={FA} from={V1} to={S1} tone="blue" draw faint={focus === "coral" || show === 2} />}
        {phase === 4 && <Glow f={FA} at={S1} tone="blue" />}
        {walked && (
          <Label f={FA} at={V1} dx={-8} dy={4} anchor="end" size={9} className={`${FADE} fill-cat-coral`}>
            সোম
          </Label>
        )}
        {show === 2 && <Arrow f={FA} from={[blueAt[0], blueAt[1]]} to={plus([blueAt[0], blueAt[1]], U1)} tone="blue" w={4} />}
        {show === 4 && <Arrow f={FA} from={[coralAt[0], coralAt[1]]} to={plus([coralAt[0], coralAt[1]], V1)} tone="coral" w={4} />}
        <Prize f={FA} at={S1} found />
        <Shiku f={FA} at={walked ? S1 : t.here} />
      </Plane>
      {guess !== null && !walked && (
        <div className={`${FADE} mt-2 flex justify-center`}>
          <button type="button" onClick={go} disabled={t.running} className={`${primaryBtn} bg-cat-violet`}>
            সোমের order-এ হাঁটান
          </button>
        </div>
      )}
      {settled && (
        <div className={`${FADE} mt-2 flex justify-center`}>
          <button type="button" onClick={() => replay.play(SHOW.length - 1)} className={quietBtn}>
            আরেকবার দেখুন ↺
          </button>
        </div>
      )}
      <div className="min-h-12 text-center text-[0.95rem]">
        {walked ? (
          <span key={show} className={FADE}>
            {SHOW[show]}
          </span>
        ) : t.running ? (
          <span key={phase} className={`${FADE} text-sm text-muted`}>
            {walkLine(phase, "card ২", "card ১")}
          </span>
        ) : null}
      </div>
      {swapped && (
        <div className={`${FADE} mt-3`}>
          <div className="text-sm font-medium text-muted">উল্টো order-এ হেঁটে সোম কি ফাহিমের গুপ্তধনটাই খুঁজে পাবে?</div>
          <div className="mt-2 grid gap-2">
            {SWAP.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, walked, 0)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </div>
      )}
      <Task done={settled}>আগে guess করুন, তারপর Shiku-কে সোমের order-এ হাঁটিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the shape the two walks
//      drew. ফাহিমের route, then সোমের; the gap between them fills in; the
//      opposite sides get matching ticks (equal, and leaning the same way);
//      the name lands last.

const X3_F = makeFrame(0, 5, 0, 5, 22, 12);
const X3_SAY = [
  "ফাহিমের পথ: আগে (3,\u00a01), তারপর (1,\u00a04)।",
  "ফাহিমের পথ: আগে (3,\u00a01), তারপর (1,\u00a04)।",
  "সোমের পথ: আগে (1,\u00a04), তারপর (3,\u00a01)।",
  "দুই পথ মিলে আঁকা হয়ে গেল একটা হেলানো চারকোণা।",
  "মুখোমুখি বাহুগুলো সমান, আর একই দিকে হেলানো, মানে সমান্তরাল।",
];

/** Equal-length marks across the middle of a side: one tick or two. */
function X3Ticks({ a, b, n }: { a: XY; b: XY; n: 1 | 2 }) {
  const [x1, y1, x2, y2] = [X3_F.sx(a[0]), X3_F.sy(a[1]), X3_F.sx(b[0]), X3_F.sy(b[1])];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const [dx, dy] = [(x2 - x1) / len, (y2 - y1) / len];
  const [mx, my] = [(x1 + x2) / 2, (y1 + y2) / 2];
  const d = (n === 1 ? [0] : [-2.5, 2.5]).map((o) => `M${mx + dx * o + dy * 5} ${my + dy * o - dx * 5}l${-dy * 10} ${dx * 10}`).join("");
  return <path d={d} strokeWidth={1.8} strokeLinecap="round" className={`${POP} pointer-events-none stroke-[#0f1b2d]`} />;
}

export function Parallelogram() {
  const s = useScene(5, [600, 1500, 1500, 1400, 1700]);
  const k = s.k;
  const pts = [O, U1, S1, V1].map((p) => `${X3_F.sx(p[0])},${X3_F.sy(p[1])}`).join(" ");
  return (
    <Scene
      scene={s}
      caption={
        k < 5 ? (
          <span key={k} className={FADE}>
            {X3_SAY[k]}
          </span>
        ) : (
          <span className={FADE}>
            এই আকারের নাম <b className="text-foreground">parallelogram</b>, বা সামান্তরিক।
          </span>
        )
      }
    >
      <div className="flex items-center justify-center gap-4">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={X3_F} label="ফাহিম's route (3, 1) then (1, 4) and সোম's route (1, 4) then (3, 1) close into a parallelogram" className="my-0! max-w-none">
            {k >= 3 && <polygon points={pts} className={`${FADE} pointer-events-none fill-cat-teal/15`} />}
            {k >= 1 && (
              <>
                <Arrow f={X3_F} from={O} to={U1} tone="blue" draw />
                <Arrow f={X3_F} from={U1} to={S1} tone="coral" draw delay={500} />
                <Label f={X3_F} at={U1} dx={6} dy={13} anchor="start" size={9} className={`${FADE} fill-cat-blue`}>
                  ফাহিম
                </Label>
              </>
            )}
            {k >= 2 && (
              <>
                <Arrow f={X3_F} from={O} to={V1} tone="coral" draw />
                <Arrow f={X3_F} from={V1} to={S1} tone="blue" draw delay={500} />
                <Label f={X3_F} at={V1} dx={-6} dy={3} anchor="end" size={9} className={`${FADE} fill-cat-coral`}>
                  সোম
                </Label>
              </>
            )}
            {k >= 4 && (
              <>
                <X3Ticks a={O} b={U1} n={1} />
                <X3Ticks a={V1} b={S1} n={1} />
                <X3Ticks a={U1} b={S1} n={2} />
                <X3Ticks a={O} b={V1} n={2} />
              </>
            )}
            <Prize f={X3_F} at={S1} />
          </Plane>
        </div>
        <div className="flex w-[7rem] shrink-0 flex-col items-center gap-2 text-center text-xs">
          <div className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
            <div className="font-semibold">ফাহিম</div>
            <div className="font-mono">
              <span className="text-cat-blue">(3, 1)</span>, <span className="text-cat-coral">(1, 4)</span>
            </div>
          </div>
          <div className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "" : "opacity-0"}`}>
            <div className="font-semibold">সোম</div>
            <div className="font-mono">
              <span className="text-cat-coral">(1, 4)</span>, <span className="text-cat-blue">(3, 1)</span>
            </div>
          </div>
          <div className="min-h-6">{k >= 5 && <b className={`${POP} inline-block text-sm text-cat-teal`}>parallelogram</b>}</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation, no task: the same sum, counted
//      slot by slot. ফাহিম's and সোম's cards stacked for adding; the first
//      slots light up (3 + 1, 1 + 3), then the second (1 + 4, 4 + 1); both
//      come to (4, 5), u + v = v + u lands, and subtraction is left asking.

const X3_ROWS: { who: string; a: XY; b: XY; ta: "blue" | "coral"; tb: "blue" | "coral" }[] = [
  { who: "ফাহিম", a: U1, b: V1, ta: "blue", tb: "coral" },
  { who: "সোম", a: V1, b: U1, ta: "coral", tb: "blue" },
];
const X3_INK = { blue: "text-cat-blue", coral: "text-cat-coral" };
const X3B_SAY = [
  "একই দুইটা card, শুধু order উল্টো।",
  "একই দুইটা card, শুধু order উল্টো।",
  "প্রথম ঘরে ফাহিম পায় 3 + 1, সোম পায় 1 + 3। দুইটাই 4।",
  "দ্বিতীয় ঘরেও 1 + 4 আর 4 + 1, দুইটাই 5।",
  "তাই u\u00a0+\u00a0v\u00a0=\u00a0v\u00a0+\u00a0u। কোন card আগে পড়লেন, তাতে কিছু যায় আসে না।",
  "বিয়োগের বেলাতেও কি এটা খাটবে? প্রশ্নটা মাথায় রাখুন।",
];

export function SwapSums() {
  const s = useScene(5, [500, 1600, 1800, 1700, 1800]);
  const k = s.k;
  /** which slot is being added now: 0, 1, or none */
  const at = k === 2 ? 0 : k === 3 ? 1 : -1;
  const pair = (v: XY, ink: string, shown = [true, true]) => (
    <span className={`whitespace-nowrap ${ink}`}>
      (
      {[0, 1].map((i) => (
        <span key={i}>
          {i > 0 && ", "}
          <span className={`inline-block rounded px-0.5 transition-colors duration-500 motion-reduce:transition-none ${at === i ? "bg-cat-amber/25" : ""}`}>
            {shown[i] ? (
              <span key="n" className={`${POP} inline-block`}>
                {v[i]}
              </span>
            ) : (
              <span className="text-muted">?</span>
            )}
          </span>
        </span>
      ))}
      )
    </span>
  );
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X3B_SAY[k]}
        </span>
      }
    >
      <div className={`flex justify-center gap-8 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
        {X3_ROWS.map((r) => (
          <div key={r.who} className="flex flex-col items-end font-mono text-base leading-snug font-bold tabular-nums">
            <span className="self-center font-sans text-sm font-semibold">{r.who}</span>
            <span>{pair(r.a, X3_INK[r.ta])}</span>
            <span>
              <span className="text-muted">+ </span>
              {pair(r.b, X3_INK[r.tb])}
            </span>
            <span className="my-0.5 w-full border-t-2 border-foreground/50" />
            <span>{pair(S1, "text-cat-teal", [k >= 2, k >= 3])}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex min-h-8 flex-wrap items-center justify-center gap-x-5">
        {k >= 4 && <span className={`${POP} inline-block font-serif text-lg italic`}>u + v = v + u</span>}
        {k >= 5 && (
          <span className={`${POP} inline-block font-serif text-lg text-muted italic`}>
            u − v = v − u <b className="font-sans text-cat-amber not-italic">?</b>
          </span>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: আম্মুর tiffin on the snack
//      table. ফাহিম comes over and opens it: a ডিম, a রুটি and a কলা, each with
//      its card, one by one. He holds up a blank label, and every card has
//      three slots. The total stays the widget's.

const S4_Y = 158;
const S4_TABLE = 110;
const S4_FAHIM = 250;
/** each food's spot on the counter and its card */
const S4_FOODS: { kind: "egg" | "roti" | "banana"; x: number; text: string }[] = [
  { kind: "egg", x: 70, text: "(80, 6, 0)" },
  { kind: "roti", x: 94, text: "(80, 3, 1)" },
  { kind: "banana", x: 120, text: "(105, 1, 14)" },
];

/** A ডিম, a রুটি or a কলা, sitting on (x, y). */
function S4Food({ kind, x, y }: { kind: "egg" | "roti" | "banana"; x: number; y: number }) {
  if (kind === "egg") return <ellipse cx={x} cy={y - 6} rx={4.6} ry={6} fill="#fffbeb" stroke="#a8a29e" strokeWidth={0.8} />;
  if (kind === "roti")
    return (
      <g>
        <ellipse cx={x} cy={y - 2.5} rx={9} ry={2.8} fill="#e9c48a" stroke="#b7793e" strokeWidth={0.8} />
        <circle cx={x - 3} cy={y - 2.8} r={0.9} fill="#b7793e" />
        <circle cx={x + 3.5} cy={y - 2.2} r={0.9} fill="#b7793e" />
      </g>
    );
  return <path d={`M${x - 9} ${y - 7}q9 10 18 0q-9 5 -18 0Z`} fill="#facc15" stroke="#ca8a04" strokeWidth={0.8} strokeLinejoin="round" />;
}

/** A steel tiffin carrier, three tiers and a handle, bottom-centre at (x, y); `open` lifts its lid off. */
function S4Tiffin({ x, y, open }: { x: number; y: number; open: boolean }) {
  return (
    <g className="pointer-events-none">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x - 9} y={y - 9 - i * 9} width={18} height={8} rx={2} fill="#cbd5e1" stroke="#64748b" strokeWidth={0.8} />
      ))}
      <g style={{ transform: open ? "translate(0px, -10px)" : "none", opacity: open ? 0 : 1 }} className="transition-[transform,opacity] duration-500 motion-reduce:transition-none">
        <rect x={x - 10} y={y - 31} width={20} height={4} rx={2} fill="#94a3b8" />
        <path d={`M${x - 6} ${y - 31}V${y - 37}H${x + 6}V${y - 31}`} fill="none" stroke="#64748b" strokeWidth={1.6} />
      </g>
    </g>
  );
}

export function TiffinCards({}: Story) {
  const s = useScene(6, [600, 1600, 1100, 800, 800, 1200]);
  const k = s.k;
  const counter = S4_Y - 24;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" ground={S4_Y} label="আম্মুর tiffin on the snack table: ফাহিম opens it, a ডিম, a রুটি and a কলা, each with a three-slot card, and holds up a blank label">
        <Stall x={S4_TABLE} y={S4_Y} w={110} sign="Snack table" color="#16a34a" />
        <S4Tiffin x={146} y={counter} open={k >= 2} />
        {k >= 2 &&
          S4_FOODS.map((f) => (
            <g key={f.kind} className={POP}>
              <S4Food kind={f.kind} x={f.x} y={counter} />
            </g>
          ))}
        {S4_FOODS.map(
          (f, i) =>
            k >= 3 + i && (
              <g key={f.kind}>
                <g className={POP}>
                  <S4Food kind={f.kind} x={62} y={46 + i * 20} />
                </g>
                <CastCard x={120} y={40 + i * 20} text={f.text} tone="amber" w={80} />
              </g>
            ),
        )}
        <Person who="fahim" x={k >= 1 ? S4_FAHIM : 370} y={S4_Y} facing={-1} walking={k === 1} ms={1400} arm={k >= 6 ? "hold" : "down"} mood={k >= 6 ? "puzzled" : "happy"} label />
        {k >= 6 && (
          <>
            <CastCard x={S4_FAHIM} y={S4_Y - 76} text="(?, ?, ?)" />
            <Bubble x={S4_FAHIM} y={S4_Y - 90} side="left" lines={["প্রতিটা card-এ", "তিনটা ঘর!"]} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · আম্মুর tiffin, three slots each: no picture to draw, the same rule. The
//     label adds itself up slot by slot as each food goes in.

const FOODS: { name: string; icon: string; v: number[] }[] = [
  { name: "ডিম", icon: "🥚", v: [80, 6, 0] },
  { name: "রুটি", icon: "🫓", v: [80, 3, 1] },
  { name: "কলা", icon: "🍌", v: [105, 1, 14] },
];
const NUTRI = ["ক্যালরি", "প্রোটিন (g)", "চিনি (g)"];

export function SnackLabel() {
  const pass = useGate();
  const [added, setAdded] = useSeed<number[]>("added", []);
  const full = added.length === FOODS.length;
  const total = NUTRI.map((_, s) => added.reduce((t, i) => t + FOODS[i].v[s], 0));

  const add = (i: number) => {
    if (added.includes(i)) return;
    const next = [...added, i];
    setAdded(next);
    if (next.length === FOODS.length) pass("তিন ঘরেও যোগের নিয়ম একই।");
  };

  return (
    <>
      <div className="mt-4 text-center text-sm text-muted">প্রতিটা খাবারের card-এ তিনটা ঘর: ক্যালরি, প্রোটিন আর চিনি।</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {FOODS.map((f, i) => {
          const on = added.includes(i);
          return (
            <button
              key={f.name}
              type="button"
              disabled={on}
              onClick={() => add(i)}
              className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-1 py-2.5 transition-[opacity,border-color] duration-300 motion-reduce:transition-none disabled:cursor-default ${
                on ? "border-border opacity-40" : "border-border hover:border-cat-teal/60"
              }`}
            >
              <span className="text-3xl" aria-hidden="true">
                {f.icon}
              </span>
              <span className="mt-1 font-semibold">{f.name}</span>
              <span className="font-mono text-sm">{tup(f.v)}</span>
            </button>
          );
        })}
      </div>
      <div className="mx-auto mt-4 max-w-sm rounded-2xl border-2 border-foreground/70 px-4 py-3">
        <div className="flex items-baseline justify-between gap-2 border-b-4 border-foreground/70 pb-1">
          <span className="text-lg font-black">টিফিনের label</span>
          <span className="text-sm text-muted">{added.length ? added.map((i) => FOODS[i].icon).join(" ") : "box এখনো খালি"}</span>
        </div>
        {NUTRI.map((n, s) => (
          <div key={n} className="flex items-baseline justify-between gap-3 border-b border-border py-1.5 last:border-0">
            <span className="font-medium">{n}</span>
            <span className="font-mono tabular-nums">
              {added.length > 1 && <span className="text-sm text-muted">{added.map((i) => FOODS[i].v[s]).join(" + ")} = </span>}
              <b key={added.length} className={`${POP} inline-block`}>
                {total[s]}
              </b>
            </span>
          </div>
        ))}
      </div>
      {full && (
        <div className={`${FADE} mt-3 text-center font-mono text-[1.05rem]`}>
          <span className="font-sans">{added.map((i) => FOODS[i].name).join(" + ")}</span> = <b className="text-cat-teal">{tup(total)}</b>
        </div>
      )}
      <Task done={full}>
        একটা একটা করে খাবারগুলো tap করে টিফিনে ভরুন। ({bn(added.length)}/{bn(FOODS.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: why Shiku can't walk a
//      three-slot card. The কলা's card, slot by slot: the first slot gets a
//      direction on the paper (right), the second another (up), and the third
//      reaches for a third direction, off the sheet, and is crossed out.

const X4_F = makeFrame(-1.6, 4, -1.5, 3, 22, 8);
const X4_OFF: XY = [-1.35, -1.3];
const X4_ROWS: { name: string; n: number; way: string }[] = [
  { name: "ক্যালরি", n: 105, way: "ডানে" },
  { name: "প্রোটিন", n: 1, way: "ওপরে" },
  { name: "চিনি", n: 14, way: "?" },
];
const X4_SAY = [
  "কলার card-এর প্রথম ঘরের জন্য একটা দিক: ডানে।",
  "কলার card-এর প্রথম ঘরের জন্য একটা দিক: ডানে।",
  "দ্বিতীয় ঘরের জন্য আরেকটা দিক: ওপরে।",
  "তৃতীয় ঘরের জন্য লাগবে তিন নম্বর একটা দিক…",
  "কিন্তু খাতার কাগজে দিক মাত্র দুইটা। তিন নম্বরটার জায়গাই নাই।",
];

export function FlatPaper() {
  const s = useScene(4, [600, 1400, 1500, 1700]);
  const k = s.k;
  let grid = "";
  for (let x = 0; x <= 4; x++) grid += `M${X4_F.sx(x - 0.5)} ${X4_F.sy(-0.5)}V${X4_F.sy(3)}`;
  for (let y = 0; y <= 3; y++) grid += `M${X4_F.sx(-0.5)} ${X4_F.sy(y - 0.5)}H${X4_F.sx(4)}`;
  const [ox, oy] = [X4_F.sx(X4_OFF[0]), X4_F.sy(X4_OFF[1])];
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X4_SAY[k]}
        </span>
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={X4_F} paper={false} grid={0} axes={false} label="a sheet of paper has two directions, right for calories and up for protein; the third slot, sugar, would need a third direction off the paper" className="my-0! max-w-none">
            <rect x={X4_F.sx(-0.5)} y={X4_F.sy(3)} width={4.5 * X4_F.u} height={3.5 * X4_F.u} rx={3} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
            <path d={grid} strokeWidth={0.6} className="pointer-events-none fill-none stroke-cat-blue/25" />
            {k >= 1 && (
              <>
                <Arrow f={X4_F} from={O} to={[3, 0]} tone="blue" draw />
                <Label f={X4_F} at={[1.5, 0]} dy={13} size={9} className={`${FADE} fill-cat-blue`}>
                  ক্যালরি
                </Label>
              </>
            )}
            {k >= 2 && (
              <>
                <Arrow f={X4_F} from={O} to={[0, 2.5]} tone="coral" draw />
                <Label f={X4_F} at={[0, 2.5]} dx={5} dy={6} anchor="start" size={9} className={`${FADE} fill-cat-coral`}>
                  প্রোটিন
                </Label>
              </>
            )}
            {k >= 3 && (
              <>
                <path d={`M${X4_F.sx(0)} ${X4_F.sy(0)}L${ox} ${oy}`} strokeWidth={2.4} strokeDasharray="4 4" strokeLinecap="round" className={`${FADE} pointer-events-none stroke-cat-amber`} />
                <Label f={X4_F} at={X4_OFF} dx={8} dy={4} anchor="start" size={9} className={`${FADE} fill-cat-amber`}>
                  চিনি?
                </Label>
              </>
            )}
            {k >= 4 && <path d={`M${ox - 6} ${oy - 6}l12 12M${ox + 6} ${oy - 6}l-12 12`} strokeWidth={2.6} strokeLinecap="round" className={`${POP} pointer-events-none stroke-danger`} />}
            <circle cx={X4_F.sx(0)} cy={X4_F.sy(0)} r={3.5} className="pointer-events-none fill-[#0f1b2d]" />
          </Plane>
        </div>
        <div className="w-[8rem] shrink-0 text-xs">
          <div className="mb-1 text-center font-semibold">কলার card</div>
          {X4_ROWS.map((r, i) => {
            const on = k >= i + 1;
            const miss = i === 2;
            return (
              <div key={r.name} className="flex items-baseline justify-between gap-1 border-b border-border py-1 last:border-0">
                <span>{r.name}</span>
                <span className="font-mono font-bold">{r.n}</span>
                <span
                  className={`w-10 text-right font-semibold transition-opacity duration-500 motion-reduce:transition-none ${on ? "" : "opacity-0"} ${
                    miss ? (k >= 4 ? "text-danger" : "text-cat-amber") : i === 0 ? "text-cat-blue" : "text-cat-coral"
                  }`}
                >
                  {miss && k >= 4 ? "নাই" : r.way}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's explanation, no task: keep it a list, picture
//      it as an arrow. Two slots: the cards drawn as arrows beside the list,
//      and the list adds slot by slot. Three slots (ডিম + রুটি): no picture,
//      the same rule. Three thousand: u₁ with v₁ … u₃₀₀₀ with v₃₀₀₀.

const X4B_STAGES: { u: string[]; v: string[]; s: string[] }[] = [
  { u: ["2", "3"], v: ["4", "1"], s: ["6", "4"] },
  { u: ["80", "6", "0"], v: ["80", "3", "1"], s: ["160", "9", "1"] },
  {
    u: ["u₁", "u₂", "u₃", "…", "u₃₀₀₀"],
    v: ["v₁", "v₂", "v₃", "…", "v₃₀₀₀"],
    s: ["u₁+v₁", "u₂+v₂", "u₃+v₃", "…", "u₃₀₀₀+v₃₀₀₀"],
  },
];
const X4B_COLS = ["grid-cols-[1.75rem_repeat(2,auto)]", "grid-cols-[1.75rem_repeat(3,auto)]", "grid-cols-[1.75rem_repeat(5,auto)]"];
const X4B_F = makeFrame(0, 6, 0, 4, 12, 6);
const X4B_SAY = [
  "দুই ঘরের card-কে arrow হিসেবে আঁকা যায়, বুঝতে সুবিধা হয়।",
  "দুই ঘরের card-কে arrow হিসেবে আঁকা যায়, বুঝতে সুবিধা হয়।",
  "কিন্তু যোগটা আসলে হলো list-এ: ঘরে ঘরে।",
  "তিন ঘরে ছবি নাই, তবু নিয়ম একই। ডিম আর রুটি মিলে (160,\u00a09,\u00a01)।",
  "ঘর তিন হাজার হলেও একই: প্রথমের সাথে প্রথম, দ্বিতীয়র সাথে দ্বিতীয়।",
];

export function ManySlots() {
  const s = useScene(4, [600, 1600, 1700, 1800]);
  const k = s.k;
  const st = k >= 4 ? 2 : k >= 3 ? 1 : 0;
  const g = X4B_STAGES[st];
  const sums = st > 0 || k >= 2;
  const small = st === 2 ? "font-serif text-[0.8rem] italic" : "font-mono text-xs";
  const cell = (t: string, cls: string, i: number, pop = false) =>
    t === "…" ? (
      <span key={i} className="px-0.5 text-center text-muted">
        …
      </span>
    ) : (
      <span
        key={i}
        style={pop ? { transitionDelay: `${i * 150}ms` } : undefined}
        className={`min-w-8 rounded-md border px-1 py-0.5 text-center whitespace-nowrap ${pop ? POP : ""} ${cls}`}
      >
        {t}
      </span>
    );
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X4B_SAY[k]}
        </span>
      }
    >
      <div className={`flex min-h-28 items-center justify-center gap-3 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
        <div key={st} className={`${FADE} grid ${X4B_COLS[st]} items-center gap-x-1 gap-y-1.5 tabular-nums ${small}`}>
          <span className="pr-1 text-right font-serif text-sm italic">u</span>
          {g.u.map((t, i) => cell(t, "border-cat-blue/50 text-cat-blue", i))}
          <span className="pr-1 text-right font-serif text-sm italic">v</span>
          {g.v.map((t, i) => cell(t, "border-cat-coral/50 text-cat-coral", i))}
          <span className="pr-1 text-right font-mono text-sm text-muted">=</span>
          {sums ? g.s.map((t, i) => cell(t, "border-cat-teal/50 bg-cat-teal/10 font-bold text-cat-teal", i, true)) : g.s.map((_, i) => <span key={i} />)}
        </div>
        {st === 0 && (
          <div className="w-[5.25rem] shrink-0">
            <Plane f={X4B_F} label="(2, 3) and (4, 1) drawn tip to tail, and their sum (6, 4)" className="my-0! max-w-none">
              <Arrow f={X4B_F} from={O} to={[2, 3]} tone="blue" w={2} />
              <Arrow f={X4B_F} from={[2, 3]} to={[6, 4]} tone="coral" w={2} />
              {k >= 2 && <Arrow f={X4B_F} from={O} to={[6, 4]} tone="teal" w={2.4} draw />}
            </Plane>
          </div>
        )}
        {st === 1 && (
          <div className={`${FADE} grid h-14 w-[5.25rem] shrink-0 place-items-center rounded-lg border-2 border-dashed border-muted/40 text-center text-xs text-muted`}>ছবি নাই</div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: নাসিব gets an idea. He
//      walks past the snack table, a bulb lights over his head, and out of his
//      pocket come two cards, height and weight, and last week's checkup. He
//      decides to add them too; whether he can is the widget's.

const S5_Y = 150;
const S5_NASIB = 190;

/** A light bulb over someone's head: an idea. */
function S5Bulb({ x, y }: { x: number; y: number }) {
  return (
    <g className={POP}>
      <path d={`M${x - 11} ${y - 4}h-4M${x + 11} ${y - 4}h4M${x - 8} ${y - 12}l-3 -3M${x + 8} ${y - 12}l3 -3M${x} ${y - 15}v-4`} stroke="#ca8a04" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={x} cy={y - 4} r={6.5} fill="#fde047" stroke="#ca8a04" strokeWidth={1} />
      <rect x={x - 3} y={y + 2} width={6} height={4} rx={1} fill="#94a3b8" />
    </g>
  );
}

export function NasibPocket({}: Story) {
  const s = useScene(5, [600, 1600, 1300, 1100, 1300]);
  const k = s.k;
  const cardY = S5_Y - 80;
  const note = (x: number, t: string) => (
    <text x={x} y={cardY + 20} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#0f1b2d" className={POP}>
      {t}
    </text>
  );
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="নাসিব gets an idea and takes two cards out of his pocket: height and weight (150, 45), and a checkup report (12, 110, 90); he wants to add them">
        <Stall x={52} y={S5_Y} w={84} sign="Snack table" color="#16a34a" />
        <Person who="nasib" x={k >= 1 ? S5_NASIB : 370} y={S5_Y} facing={-1} walking={k === 1} ms={1400} arm={k >= 3 ? "hold" : "down"} mood={k >= 2 ? "smug" : "plain"} label />
        {k >= 2 && k < 5 && <S5Bulb x={S5_NASIB} y={S5_Y - 72} />}
        {k >= 3 && (
          <>
            <CastCard x={138} y={cardY} text="(150, 45)" tone="blue" />
            {note(138, "উচ্চতা, ওজন")}
          </>
        )}
        {k >= 4 && (
          <>
            <CastCard x={250} y={cardY} text="(12, 110, 90)" tone="coral" />
            {note(250, "checkup রিপোর্ট")}
          </>
        )}
        {k >= 5 && <Bubble x={S5_NASIB} y={S5_Y - 94} tone="think" lines={["এই দুইটাকেও", "যোগ করে ফেলি!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · নাসিব's two cards do not match. Pair them slot by slot: cm meets years,
//     kg meets pressure, and slot 3 has nobody at all.

const HW = [
  ["উচ্চতা", "150 cm"],
  ["ওজন", "45 kg"],
];
const ABS = [
  ["বয়স", "12 বছর"],
  ["প্রেশার", "110"],
  ["রক্তে চিনি", "90"],
];
const WHY = [
  "150 cm-এর সাথে 12 বছর? উচ্চতার সাথে বয়স যোগ করে যে সংখ্যা আসবে, তার মানে কেউ জানে না।",
  "45 kg-এর সাথে প্রেশার 110? এটারও কোনো মানে দাঁড়ায় না।",
  "আর 90-এর তো জোড়াই নাই। Card ১-এ তিন নম্বর ঘরই নেই!",
];

function Cell({ k, v, tone }: { k: string; v: string; tone: "blue" | "coral" }) {
  return (
    <span className={`block rounded-lg px-1 py-1.5 ${tone === "blue" ? "bg-cat-blue/10" : "bg-cat-coral/10"}`}>
      <span className="block text-[0.7rem] leading-tight text-muted">{k}</span>
      <b className="font-mono text-sm">{v}</b>
    </span>
  );
}

export function WrongShape() {
  const pass = useGate();
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const all = tried.length === ABS.length;

  const tap = (i: number) => {
    if (tried.includes(i)) return;
    const next = [...tried, i];
    setTried(next);
    if (next.length === ABS.length) pass("যোগে ঘর সমান, আর ঘরের মানে একই।");
  };

  return (
    <>
      <Speech who="নাসিব" initial="ন" tint="blue">
        আমার এই দুইটা card-ও একটু যোগ করে দাও না!
      </Speech>
      <div className="mt-4 text-center text-sm">
        <b className="text-cat-blue">card ১</b>-এ দুইটা ঘর, অথচ <b className="text-cat-coral">card ২</b>-এ তিনটা।
      </div>
      <div className="mx-auto mt-2 grid max-w-sm grid-cols-3 gap-2">
        {ABS.map((b, i) => {
          const a = HW[i];
          const on = tried.includes(i);
          return (
            <button
              key={b[0]}
              type="button"
              aria-pressed={on}
              onClick={() => tap(i)}
              className={`flex cursor-pointer flex-col items-stretch gap-1 rounded-xl border-2 p-2 text-center transition-colors duration-300 motion-reduce:transition-none ${
                on ? "nudge border-danger/50 bg-danger/5" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <span className="text-xs text-muted">{bn(i + 1)} নম্বর ঘর</span>
              {a ? (
                <Cell k={a[0]} v={a[1]} tone="blue" />
              ) : (
                <span className="grid min-h-12 place-items-center rounded-lg border-2 border-dashed border-muted/40 text-muted">—</span>
              )}
              <span className="font-mono text-muted">+</span>
              <Cell k={b[0]} v={b[1]} tone="coral" />
              <span className={`font-mono font-bold ${on ? "text-danger" : "text-muted/40"}`}>= ?</span>
            </button>
          );
        })}
      </div>
      {tried.map((i) => (
        <Nope key={i}>{WHY[i]}</Nope>
      ))}
      <Task done={all}>ঘরে ঘরে যোগ করে দেখুন তো। তিনটা ঘরই একবার করে tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the condition hidden in
//      the rule. নাসিব's two cards lined up slot by slot: the first two slots
//      find partners, 90 finds nobody, and even 150 + 12, which does come
//      out as a number, comes out as a number that means nothing.

const X5_SAY = [
  "নাসিবের দুইটা card, ঘরে ঘরে সাজানো হলো।",
  "নাসিবের দুইটা card, ঘরে ঘরে সাজানো হলো।",
  "প্রথম দুইটা ঘর একজন করে সঙ্গী পেলো।",
  "কিন্তু 90-এর সঙ্গী কই? Card ১-এ তিন নম্বর ঘরই নাই।",
  "আর 150 + 12 = 162 ঠিকই হয়। কিন্তু 162 কী, cm না বছর? এর কোনো মানে নাই।",
];

/** One of নাসিব's slots, compact: what it is, and its number. */
function X5Cell({ k, v, tone }: { k: string; v: string; tone: "blue" | "coral" }) {
  return (
    <span className={`block rounded-lg px-1 py-1 leading-tight ${tone === "blue" ? "bg-cat-blue/10" : "bg-cat-coral/10"}`}>
      <span className="block text-[0.7rem] text-muted">{k}</span>
      <b className="font-mono text-sm">{v}</b>
    </span>
  );
}

export function NoPartner() {
  const s = useScene(4, [600, 1500, 1800, 2000]);
  const k = s.k;
  const tag = "text-xs font-semibold";
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X5_SAY[k]}
        </span>
      }
    >
      <div
        className={`mx-auto grid max-w-[17rem] grid-cols-[2.75rem_repeat(3,minmax(0,1fr))] items-center gap-x-1.5 gap-y-1 text-center transition-opacity duration-500 motion-reduce:transition-none ${
          k >= 1 ? "" : "opacity-0"
        }`}
      >
        <span className={`${tag} text-cat-blue`}>card ১</span>
        <X5Cell k={HW[0][0]} v={HW[0][1]} tone="blue" />
        <X5Cell k={HW[1][0]} v={HW[1][1]} tone="blue" />
        <span
          className={`grid h-full place-items-center rounded-lg border-2 border-dashed text-xs transition-colors duration-500 motion-reduce:transition-none ${
            k >= 3 ? "border-danger/60 bg-danger/5 text-danger" : "border-muted/40 text-muted"
          }`}
        >
          {k >= 3 ? "কেউ নাই" : "—"}
        </span>
        <span />
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-4 font-mono text-sm leading-4 font-bold ${i === 2 ? "text-danger" : "text-muted"}`}>
            {(i < 2 ? k >= 2 : k >= 3) && <span className={`${POP} inline-block`}>{i < 2 ? "+" : "?"}</span>}
          </span>
        ))}
        <span className={`${tag} text-cat-coral`}>card ২</span>
        {ABS.map((b) => (
          <X5Cell key={b[0]} k={b[0]} v={b[1]} tone="coral" />
        ))}
        <span />
        <span className="col-span-3 min-h-6 text-left">
          {k >= 4 && (
            <span className={`${POP} inline-block pl-4 text-danger`}>
              <b className="font-mono">= 162</b> <span className="text-xs">cm? না বছর?</span>
            </span>
          )}
        </span>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5¾ · A figure for screen 5's explanation, no task: what u, v ∈ ℝⁿ said.
//      u's slots, u₁ … uₙ, counted: n of them; v's, v₁ … vₙ: n too. The mark
//      from 2.8 lands with its little n lit; then every slot finds its partner.

const X5B_U = ["u₁", "u₂", "…", "uₙ"];
const X5B_V = ["v₁", "v₂", "…", "vₙ"];
const X5B_SAY = [
  "u-এর ঘরগুলো গুনলে nটা।",
  "u-এর ঘরগুলো গুনলে nটা।",
  "v-এরও ঠিক nটা।",
  "২.৮-এর চিহ্নে লিখলে u,\u00a0v\u00a0∈\u00a0ℝⁿ। মাথার ছোট n বলে, দুইজনেরই nটা করে ঘর।",
  "ঘর সমান, তাই প্রত্যেকে একজন সঙ্গী পায়। যোগ করা যায়।",
];

export function RnPair() {
  const s = useScene(4, [600, 1400, 1800, 1700]);
  const k = s.k;
  const row = (name: string, cells: string[], cls: string, on: boolean) => (
    <>
      <span className={`pr-1 text-right font-serif text-lg italic transition-opacity duration-500 motion-reduce:transition-none ${on ? "" : "opacity-0"}`}>{name}</span>
      {cells.map((t, i) =>
        t === "…" ? (
          <span key={i} className={`text-center text-muted transition-opacity duration-500 motion-reduce:transition-none ${on ? "" : "opacity-0"}`}>
            …
          </span>
        ) : (
          <span
            key={i}
            style={{ transitionDelay: `${i * 120}ms` }}
            className={`rounded-md border-2 py-0.5 text-center font-serif italic transition-opacity duration-500 motion-reduce:transition-none ${cls} ${on ? "" : "opacity-0"}`}
          >
            {t}
          </span>
        ),
      )}
      <span className={`pl-1 text-left text-xs whitespace-nowrap text-muted transition-opacity duration-500 motion-reduce:transition-none ${on ? "" : "opacity-0"}`}>
        মোট <i className="font-serif text-sm text-cat-amber">n</i>টা ঘর
      </span>
    </>
  );
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X5B_SAY[k]}
        </span>
      }
    >
      <div className="mx-auto grid w-fit grid-cols-[1.5rem_repeat(4,2.25rem)_auto] items-center gap-x-1.5 gap-y-1">
        {row("u", X5B_U, "border-cat-blue/50 text-cat-blue", k >= 1)}
        <span />
        {X5B_U.map((t, i) => (
          <span key={i} className="text-center font-mono text-sm text-muted">
            {k >= 4 && t !== "…" && (
              <span style={{ transitionDelay: `${i * 120}ms` }} className={`${POP} inline-block`}>
                +
              </span>
            )}
          </span>
        ))}
        <span />
        {row("v", X5B_V, "border-cat-coral/50 text-cat-coral", k >= 2)}
      </div>
      <div className="mt-2 flex min-h-8 items-center justify-center">
        {k >= 3 && (
          <span className={`${POP} inline-block font-serif text-xl italic`}>
            u, v ∈ ℝ<sup className="ml-0.5 text-cat-amber">n</sup>
          </span>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: সামিন knows both places.
//      He walks onto the chalked field and his spot is ringed; the treasure
//      shows up across the field; he points at it, card in hand, but the card
//      is a "?". Its two numbers are the widget's.

const S6_Y = 165;
const S6_SAMIN = 88;
const S6_PRIZE: XY = [250, 138];

export function SaminStuck({}: Story) {
  const s = useScene(4, [600, 1600, 1300, 1300]);
  const k = s.k;
  const [px, py] = S6_PRIZE;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" ground={118} label="সামিন stands on the chalked field and can see the treasure across it, but doesn't know which card takes him there">
        <ChalkGrid top={118} />
        {k >= 2 && (
          <>
            <ellipse cx={S6_SAMIN} cy={S6_Y} rx={16} ry={4} fill="none" stroke="white" strokeWidth={1.6} className={POP} />
            <g className={POP}>
              <path d={`M${px - 9} ${py - 3}l18 6M${px + 9} ${py - 3}l-18 6`} stroke="#dc2626" strokeWidth={2.4} strokeLinecap="round" />
            </g>
            <g className={POP}>
              <Chest x={px + 22} y={py + 2} />
            </g>
            <text x={px + 10} y={py + 15} textAnchor="middle" fontSize={8} fontWeight={700} fill="#0f1b2d" className={POP}>
              গুপ্তধন
            </text>
          </>
        )}
        <Person who="samin" x={k >= 1 ? S6_SAMIN : -30} y={S6_Y} walking={k === 1} ms={1400} arm={k >= 3 ? "point" : "down"} mood={k >= 3 ? "puzzled" : "plain"} label />
        {k >= 3 && <CastCard x={S6_SAMIN} y={S6_Y - 76} text="(?, ?)" />}
        {k >= 4 && <Bubble x={S6_SAMIN + 4} y={S6_Y - 90} side="right" tone="think" lines={["কোন card ধরে", "হাঁটবো?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · The question backwards: which one card takes সামিন to the prize? The
//     reader drags the card's arrow from her to the X, three times; the table
//     keeps prize, সামিন and card side by side until end − start shows.

const TRIPS: { v: XY; u: XY }[] = [
  { v: [2, 1], u: [6, 4] },
  { v: [1, 5], u: [4, 2] },
  { v: [6, 3], u: [1, 1] },
];

/**
 * Once সামিন's card is found, her trip traced along the axes: first along x
 * to the prize's column, then along y down or up to it, each leg labelled with
 * its change. Labels sit on the side away from the diagonal card arrow.
 */
function Legs({ v, u }: { v: XY; u: XY }) {
  const corner: XY = [u[0], v[1]];
  const dx = u[0] - v[0];
  const dy = u[1] - v[1];
  return (
    <>
      <Arrow f={FA} from={v} to={corner} tone="blue" w={2.4} draw />
      <Arrow f={FA} from={corner} to={u} tone="coral" w={2.4} draw delay={550} />
      {dx !== 0 && (
        <Label f={FA} at={[(v[0] + u[0]) / 2, v[1]]} dy={dy < 0 ? -8 : 15} size={11} weight={700} className={`fill-cat-blue ${FADE}`}>
          x: {sg(dx)}
        </Label>
      )}
      {dy !== 0 && (
        <Label
          f={FA}
          at={[u[0], (v[1] + u[1]) / 2]}
          dx={dx > 0 ? 8 : -8}
          dy={4}
          anchor={dx > 0 ? "start" : "end"}
          size={11}
          weight={700}
          className={`fill-cat-coral ${FADE}`}
        >
          y: {sg(dy)}
        </Label>
      )}
    </>
  );
}

export function WayBack() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [solved, setSolved] = useSeed("solved", 0);
  const [tip, setTip] = useSeed<XY>("tip", TRIPS[0].v);
  const { v, u } = TRIPS[round];
  const done = solved > round;
  const last = round === TRIPS.length - 1;
  // The square just touched, named for a moment so the reader can read positions off the paper.
  const [peek, setPeek] = useState<XY | null>(null);
  useEffect(() => {
    if (!peek) return;
    const id = setTimeout(() => setPeek(null), 1600);
    return () => clearTimeout(id);
  }, [peek]);

  const put = (p: XY) => {
    if (done) return;
    const t = snap(p, FA);
    setTip(t);
    setPeek(t);
    if (!same(t, u)) return;
    setSolved(round + 1);
    if (last) pass("u − v হলো v থেকে u-তে যাওয়ার arrow।");
  };
  const next = () => {
    setRound(round + 1);
    setTip(TRIPS[round + 1].v);
  };

  return (
    <>
      <div className="mt-4 text-center text-sm text-muted">
        সামিন দাঁড়িয়ে আছে {tup(v)}-এ, গুপ্তধন {tup(u)}-এ। সামিনের গায়ের বৃত্তটা ধরে টেনে লাল ✕-এর ওপর নিয়ে যান।
      </div>
      <Plane
        f={FA}
        ticks={1}
        label={`সামিন at ${tup(v)}, the prize at ${tup(u)}; drag the card's arrow from her to the prize`}
        drag={done ? undefined : { down: put, move: put }}
        onKey={done ? undefined : nudger((d) => put(plus(tip, d)))}
      >
        <Prize f={FA} at={u} found={done} />
        <Samin f={FA} at={v} />
        <Arrow f={FA} from={v} to={tip} tone="teal" w={3} faint={done} />
        {done && <Legs key={round} v={v} u={u} />}
        {!done && <circle cx={FA.sx(tip[0])} cy={FA.sy(tip[1])} r={9} strokeWidth={2} className="pointer-events-none fill-cat-teal/20 stroke-cat-teal" />}
        {peek && !done && (
          <Label
            f={FA}
            at={peek}
            dx={peek[0] >= 6 ? -10 : peek[0] <= 0 ? 10 : 0}
            dy={peek[1] >= 5 ? 26 : -14}
            anchor={peek[0] >= 6 ? "end" : peek[0] <= 0 ? "start" : "middle"}
            size={12}
            weight={700}
            className={`${FADE} fill-[#0f1b2d] stroke-white [paint-order:stroke] [stroke-width:4px]`}
          >
            {tup(peek)}
          </Label>
        )}
      </Plane>
      <div className="mx-auto max-w-xs">
        <Clue name="সামিনের card" v={minus(tip, v)} tone="teal" />
      </div>
      {done && (
        <div key={round} className={`${FADE} mt-2 text-center text-sm text-muted`}>
          x বরাবর <b className="font-mono text-cat-blue">{sg(u[0] - v[0])}</b> ঘর, তারপর y বরাবর{" "}
          <b className="font-mono text-cat-coral">{sg(u[1] - v[1])}</b> ঘর। Card-এর দুইটা সংখ্যা ঠিক এই দুইটাই।
        </div>
      )}
      {done && !last && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={next} className={quietBtn}>
            এবার অন্য জায়গা থেকে →
          </button>
        </div>
      )}
      {solved > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="mx-auto text-center font-mono tabular-nums">
            <thead>
              <tr className="font-sans text-xs text-muted">
                <th className="px-3 pb-1 font-normal">গুপ্তধন (u)</th>
                <th className="px-3 pb-1 font-normal">সামিন (v)</th>
                <th className="px-3 pb-1 font-normal">card</th>
              </tr>
            </thead>
            <tbody>
              {TRIPS.slice(0, solved).map((t, i) => (
                <tr key={i} className={FADE}>
                  <td className="px-3">{tup(t.u)}</td>
                  <td className="px-3">{tup(t.v)}</td>
                  <td className="px-3 font-bold text-cat-teal">{tup(minus(t.u, t.v))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Ticks items={TRIPS.map((_, i) => [`খোঁজ ${bn(i + 1)}`, solved > i])} />
      <Task done={solved === TRIPS.length}>
        তিনবার সামিন থেকে গুপ্তধন পর্যন্ত arrow টানুন। তারপর table-এর সংখ্যাগুলোয় একবার চোখ বুলান, কিছু চোখে পড়ছে?
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the same subtraction in
//      two places. সামিনের card on the field (prize − সামিন), and সোমের ফোনের
//      king − man on 2.3's word map (the same spots as there). Both get tagged
//      start and end: end − start is the arrow from start to end.

const FSA = makeFrame(0, 7, 0, 6, 18, 16);
/** 2.3's royal map, cropped to man and king */
const FKM = makeFrame(0.6, 3.8, 0.4, 7, 18, 16);
const KM_MAN: XY = [1.6, 1.4];
const KM_KING: XY = [2.6, 5.9];
const SA_SAY = [
  "বামে সামিনের মাঠ, ডানে সোমের ফোনের শব্দের map।",
  "সামিন থেকে গুপ্তধনে যাওয়ার card: গুপ্তধন − সামিন।",
  "Map-এ man থেকে king-এ যাওয়ার arrow: king − man।",
];

function Tag({ f, at, dx = 0, dy = 0, anchor = "middle", children }: { f: Frame; at: XY; dx?: number; dy?: number; anchor?: "start" | "middle" | "end"; children: ReactNode }) {
  return (
    <Label f={f} at={at} dx={dx} dy={dy} anchor={anchor} size={10} weight={700} className={`${FADE} fill-cat-violet`}>
      {children}
    </Label>
  );
}

export function SameArrow() {
  const s = useScene(3, [500, 1500, 1600]);
  const k = s.k;
  return (
    <Scene
      scene={s}
      caption={
        k < 3 ? (
          <span key={k} className={FADE}>
            {SA_SAY[k]}
          </span>
        ) : (
          <span className={FADE}>দুইটাই ২.২-এর সেই End − Start: শুরু থেকে শেষে যাওয়ার arrow।</span>
        )
      }
    >
      <div className="flex items-end justify-center gap-3">
        <div className="w-[10.5rem] shrink-0">
          <Plane f={FSA} label="সামিন at (2, 1), the prize at (6, 4); the card between them is prize minus সামিন" className="my-0! max-w-none">
            {k >= 1 && <Arrow f={FSA} from={TRIPS[0].v} to={TRIPS[0].u} tone="teal" w={2.6} draw />}
            <Prize f={FSA} at={TRIPS[0].u} />
            <Samin f={FSA} at={TRIPS[0].v} />
            {k >= 3 && (
              <>
                <Tag f={FSA} at={TRIPS[0].v} dx={-9} dy={3} anchor="end">
                  শুরু
                </Tag>
                <Tag f={FSA} at={TRIPS[0].u} dy={-11}>
                  শেষ
                </Tag>
              </>
            )}
          </Plane>
          <div className={`mt-1 min-h-5 text-center text-xs transition-opacity motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>গুপ্তধন − সামিন</div>
        </div>
        <div className="w-[6rem] shrink-0">
          <Plane f={FKM} axes={false} label="2.3's word map: man and king; the arrow from man to king is king minus man" className="my-0! max-w-none">
            {k >= 2 && <Arrow f={FKM} from={KM_MAN} to={KM_KING} tone="teal" w={2.6} draw />}
            {(
              [
                ["man", KM_MAN, 12],
                ["king", KM_KING, -8],
              ] as const
            ).map(([w, at, dy]) => (
              <g key={w} className="pointer-events-none">
                <circle cx={FKM.sx(at[0])} cy={FKM.sy(at[1])} r={4} className="fill-[#0f1b2d]" />
                <Label f={FKM} at={at} dy={dy + (dy > 0 ? 4 : 0)} size={10}>
                  {w}
                </Label>
              </g>
            ))}
            {k >= 3 && (
              <>
                <Tag f={FKM} at={KM_MAN} dx={-7} dy={-5} anchor="end">
                  শুরু
                </Tag>
                <Tag f={FKM} at={KM_KING} dx={7} dy={12} anchor="start">
                  শেষ
                </Tag>
              </>
            )}
          </Plane>
          <div className={`mt-1 min-h-5 text-center font-mono text-xs transition-opacity motion-reduce:transition-none ${k >= 2 ? "" : "opacity-0"}`}>king − man</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · Walk the card both ways. Going: from সামিন along (u − v) lands on u, and
//     the sum turns round into the subtraction it came from. Coming back: the
//     same card only carries Shiku further off; the flipped card, v − u, brings
//     him home. The trap going out is the card itself, read as a place.

/** a wider field, so the wrong way home still fits on the paper */
const FB = makeFrame(0, 10, 0, 7, 30);
const CV = TRIPS[0].v;
const CU = TRIPS[0].u;
const CD = minus(CU, CV);
const FAR = plus(CU, CD);
const BACK = minus(CV, CU);
const LAND = ["(4, 3)", "(6, 4)", "(2, 1)"];
const HOME = ["হ্যাঁ, সামিনের কাছেই ফিরবে", "না, আরও দূরে কোথাও চলে যাবে"];

export function CheckTrip() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [walked, setWalked] = useSeed("walked", false);
  const [back, setBack] = useSeed<number | null>("back", null);
  const [far, setFar] = useSeed("far", false);
  const [home, setHome] = useSeed("home", false);
  const w = useWalk(240);
  const [leg, setLeg] = useState<"out" | "astray" | "homeward" | null>(null);
  const out = route(CV, CD);
  const astray = route(CU, CD);
  const homeward = route(CU, BACK);
  const at = w.running ? w.here : home ? CV : far ? FAR : walked ? CU : CV;

  const walk = (name: NonNullable<typeof leg>, p: XY[], done: () => void) => {
    setLeg(name);
    w.go(p, done);
  };
  const goOut = () => walk("out", out, () => setWalked(true));
  const goAstray = () => walk("astray", astray, () => setFar(true));
  const goHome = () =>
    walk("homeward", homeward, () => {
      setHome(true);
      pass("u − v আর v − u ঠিক উল্টো।");
    });
  const onWay = (name: typeof leg, p: XY[], done: boolean) => (done ? p : w.running && leg === name ? w.trail : []);

  return (
    <>
      <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-3">
        <Clue name="যাওয়ার card, u − v" v={CD} tone="teal" lit={walked ? 2 : 0} />
        {far ? (
          <div className={FADE}>
            <Clue name="ফেরার card, v − u" v={BACK} tone="coral" lit={home ? 2 : 0} />
          </div>
        ) : (
          <div className="grid place-items-center rounded-xl border-2 border-dashed border-muted/40 px-2 text-center text-xs text-muted">ফেরার card কোনটা, এখনো জানি না।</div>
        )}
      </div>
      <Plane f={FB} ticks={1} label={home ? "Shiku went (4, 3) from (2, 1) to the prize, and came back with (−4, −3)" : walked ? "Shiku walked (4, 3) from (2, 1) and landed on the prize at (6, 4)" : "Shiku standing with সামিন at (2, 1)"}>
        <Trail f={FB} cells={onWay("out", out, walked)} faint={walked} />
        <Trail f={FB} cells={onWay("astray", astray, far)} faint={far} />
        <Trail f={FB} cells={onWay("homeward", homeward, home)} faint={home} />
        {walked && (
          <>
            <Arrow f={FB} from={CV} to={CU} tone="teal" w={3} draw faint={far && !home} />
            <Label f={FB} at={[(CV[0] + CU[0]) / 2, (CV[1] + CU[1]) / 2]} dx={-8} dy={-6} anchor="end" size={10} weight={700} className={`${FADE} fill-cat-teal`}>
              u − v
            </Label>
          </>
        )}
        {far && (
          <>
            <Arrow f={FB} from={CU} to={FAR} tone="teal" w={2.4} dashed />
            <Label f={FB} at={FAR} dx={-12} dy={16} anchor="end" size={10} weight={700} className={`${FADE} fill-danger`}>
              এ তো আরও দূরে!
            </Label>
          </>
        )}
        {home && (
          <>
            <Arrow f={FB} from={CU} to={CV} tone="coral" w={3} draw />
            <Label f={FB} at={[(CV[0] + CU[0]) / 2, (CV[1] + CU[1]) / 2]} dx={10} dy={14} anchor="start" size={10} weight={700} className={`${FADE} fill-cat-coral`}>
              v − u
            </Label>
          </>
        )}
        <Prize f={FB} at={CU} found={walked} />
        <Samin f={FB} at={CV} />
        <Shiku f={FB} at={at} />
      </Plane>

      {!walked && (
        <>
          {guess !== null && (
            <div className={`${FADE} mb-3 flex justify-center`}>
              <button type="button" onClick={goOut} disabled={w.running} className={`${primaryBtn} bg-cat-violet`}>
                হাঁটিয়ে দেখুন
              </button>
            </div>
          )}
          <div className="text-sm font-medium text-muted">Shiku যদি সামিনের জায়গা থেকে এই card ধরে হাঁটে, থামবে কোথায়?</div>
          <div className="mt-2 grid gap-2">
            {LAND.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, walked, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
                <span className="font-mono">{o}</span>
              </Choice>
            ))}
          </div>
        </>
      )}

      {walked && (
        <div className={`${FADE} mx-auto mt-1 max-w-sm rounded-2xl border border-border px-4 py-3 text-center`}>
          <div className="font-mono text-lg">
            {tup(CV)} + {tup(CD)} = <b className="text-cat-teal">{tup(CU)}</b>
          </div>
          <div className="text-sm text-muted">{guess === 1 ? "ঠিক ধরেছেন, " : "Shiku গিয়ে থামলো গুপ্তধনের ওপরেই, "}সামিনের জায়গায় card যোগ করতেই গুপ্তধন।</div>
          <div style={{ transitionDelay: "900ms" }} className={`${FADE} mt-2 border-t border-border pt-2`}>
            <div className="font-mono text-lg">
              {tup(CU)} − {tup(CV)} = <b className="text-cat-teal">{tup(CD)}</b>
            </div>
            <div className="text-sm text-muted">আর উল্টো দিক থেকে পড়লে, গুপ্তধন থেকে সামিনকে বাদ দিলেই card।</div>
          </div>
        </div>
      )}

      {walked && !far && (
        <div style={{ transitionDelay: "1400ms" }} className={`${FADE} mt-4`}>
          {back !== null && (
            <div className={`${FADE} mb-3 flex justify-center`}>
              <button type="button" onClick={goAstray} disabled={w.running} className={`${primaryBtn} bg-cat-violet`}>
                একই card ধরে ফেরান
              </button>
            </div>
          )}
          <div className="text-sm font-medium text-muted">এবার ফেরার পালা। গুপ্তধন থেকে একই card (4, 3) ধরে হাঁটলে Shiku কি সামিনের কাছে ফিরবে?</div>
          <div className="mt-2 grid gap-2">
            {HOME.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, back, far, 1)} disabled={back !== null} onClick={() => setBack(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </div>
      )}

      {far && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem]`}>
          {back === 1 ? "ঠিক ধরেছেন। " : "উঁহু। "}Shiku গিয়ে থামলো <b className="font-mono">{tup(FAR)}</b>-এ, সামিনের থেকে আরও দূরে। এই card তো সবসময় পূর্ব আর উত্তরেই টানে।
          {!home && (
            <div className="mt-3 flex justify-center">
              <button type="button" onClick={goHome} disabled={w.running} className={`${primaryBtn} bg-cat-violet`}>
                Card উল্টে আবার হাঁটান
              </button>
            </div>
          )}
          {home && (
            <div className={`${FADE} mt-2`}>
              উল্টো card <b className="font-mono">{tup(BACK)}</b> নিয়ে Shiku ঠিক সামিনের কাছে ফিরে এলো।
            </div>
          )}
        </div>
      )}

      <Ticks
        items={[
          ["যাওয়া", walked],
          ["ফেরা", home],
        ]}
      />
      <Task done={home}>আগে যাওয়ার পথ, তারপর ফেরার পথ। দুইবারই আগে guess করুন, তারপর Shiku-কে হাঁটিয়ে মিলিয়ে নিন।</Task>
    </>
  );
}

/**
 * For the MDX explanation: "v + (u − v) = u" with the (u − v) part hoverable
 * (or tappable) to show the arrow it stands for, সামিন to the prize.
 */
export function TripPeek() {
  const [open, setOpen] = useState(false);
  const f = makeFrame(0, 7, 0, 5, 18, 12);
  return (
    <span className="relative inline-block font-serif whitespace-nowrap italic">
      v +{" "}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="peer cursor-help rounded px-0.5 italic underline decoration-cat-teal decoration-dotted decoration-2 underline-offset-4 transition-colors hover:bg-cat-teal/10 motion-reduce:transition-none"
      >
        (u − v)
      </button>{" "}
      = u
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 block w-52 -translate-x-1/2 rounded-xl border border-border bg-white p-2 shadow-lg transition-opacity duration-200 peer-hover:opacity-100 peer-focus-visible:opacity-100 motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        <svg viewBox={`0 0 ${f.W} ${f.H}`} className="block h-auto w-full" aria-hidden="true">
          {Array.from({ length: 8 }, (_, x) => (
            <path key={`x${x}`} d={`M${f.sx(x)} ${f.sy(0)}V${f.sy(5)}`} strokeWidth={1} className="stroke-[#0f1b2d]/10" />
          ))}
          {Array.from({ length: 6 }, (_, y) => (
            <path key={`y${y}`} d={`M${f.sx(0)} ${f.sy(y)}H${f.sx(7)}`} strokeWidth={1} className="stroke-[#0f1b2d]/10" />
          ))}
          <Arrow f={f} from={CV} to={CU} tone="teal" w={3} />
          <Prize f={f} at={CU} found />
          <Samin f={f} at={CV} />
        </svg>
        <span className="block text-center font-sans text-xs leading-snug not-italic text-[#0f1b2d]">সামিন (v) থেকে গুপ্তধন (u)-তে যাওয়ার arrow।</span>
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: subtraction is addition
//      run backwards. Where সামিন is, plus the card, lands on the prize, each
//      term with its letter under it; then the same line read from the other
//      end: prize minus সামিন gives the card back.

const X7_SAY = [
  "যেখানে আছেন: সামিন, (2,\u00a01)।",
  "যেখানে আছেন: সামিন, (2,\u00a01)।",
  "তার সাথে যোগ করি যেখানে যেতে চান সেখানে যাওয়ার arrow, (4,\u00a03)।",
  "পৌঁছালো ঠিক গুপ্তধনের ওপর, (6,\u00a04)। Symbol-এ, v\u00a0+\u00a0(u\u00a0−\u00a0v)\u00a0=\u00a0u।",
  "উল্টো দিক থেকে পড়লে বিয়োগ, আর ফেরত আসে সেই card। বিয়োগ যোগেরই উল্টো কাজ।",
];

/** One term of the line: the tuple, its letter, and who it is. */
function X7Term({ v, sym, who, ink, on = true }: { v: XY; sym: string; who: string; ink: string; on?: boolean }) {
  return (
    <span className={`flex flex-col items-center leading-tight transition-opacity duration-500 motion-reduce:transition-none ${on ? "" : "opacity-0"}`}>
      <b className={`font-mono text-base ${ink}`}>{tup(v)}</b>
      <i className="font-serif text-sm">{sym}</i>
      <span className="text-[0.7rem] text-muted">{who}</span>
    </span>
  );
}

export function UndoAdd() {
  const s = useScene(4, [600, 1500, 1700, 2000]);
  const k = s.k;
  const op = (t: string, on: boolean) => <span className={`self-start pt-0.5 font-mono text-base text-muted transition-opacity duration-500 motion-reduce:transition-none ${on ? "" : "opacity-0"}`}>{t}</span>;
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X7_SAY[k]}
        </span>
      }
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-start gap-2">
          <X7Term v={CV} sym="v" who="সামিন" ink="text-cat-violet" on={k >= 1} />
          {op("+", k >= 2)}
          <X7Term v={CD} sym="u − v" who="card" ink="text-cat-teal" on={k >= 2} />
          {op("=", k >= 3)}
          <X7Term v={CU} sym="u" who="গুপ্তধন" ink="text-danger" on={k >= 3} />
        </div>
        <div className={`flex items-start gap-2 border-t border-border pt-2 transition-opacity duration-700 motion-reduce:transition-none ${k >= 4 ? "" : "opacity-0"}`}>
          <X7Term v={CU} sym="u" who="গুপ্তধন" ink="text-danger" />
          {op("−", true)}
          <X7Term v={CV} sym="v" who="সামিন" ink="text-cat-violet" />
          {op("=", true)}
          <X7Term v={CD} sym="u − v" who="card" ink="text-cat-teal" />
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A figure for screen 7's explanation, no task: a card is a direction,
//      not an address. (4, 3) takes Shiku from সামিন to the prize; from the
//      prize the same card only takes him further off; the flipped card,
//      (−4, −3), brings him home. u − v and v − u, exact opposites.

const X7_F = makeFrame(0, 10, 0, 7, 15, 10);
/** going and coming back lie on one line; each is nudged off it a little, so both show */
const X7_OFF: XY = [-0.18, 0.24];
const X7B_SAY = [
  "Card (4,\u00a03) বলে শুধু কোন দিকে কত ঘর, আর কিছু না।",
  "Card (4,\u00a03) বলে শুধু কোন দিকে কত ঘর, আর কিছু না।",
  "গুপ্তধন থেকে একই card ধরলে Shiku আরও দূরে। Card address বলে না।",
  "ফিরতে লাগে উল্টো card, v\u00a0−\u00a0u\u00a0=\u00a0(−4,\u00a0−3)।",
  "যোগে order matter করেনি, বিয়োগে করে। দুইটা card একটা আরেকটার ঠিক উল্টো।",
];

export function FlipCard() {
  const s = useScene(4, [600, 1500, 1800, 1600]);
  const k = s.k;
  const p = useTween(k >= 3 ? CV : k >= 1 ? CU : CV, 1000);
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X7B_SAY[k]}
        </span>
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[10rem] shrink-0">
          <Plane f={X7_F} label="the card (4, 3) takes Shiku from সামিন at (2, 1) to the prize at (6, 4); from the prize the same card goes on to (10, 7); the flipped card (−4, −3) brings him back" className="my-0! max-w-none">
            {k >= 1 && <Arrow f={X7_F} from={k >= 3 ? plus(CV, X7_OFF) : CV} to={k >= 3 ? plus(CU, X7_OFF) : CU} tone="teal" w={2.6} draw faint={k === 2} />}
            {k === 2 && (
              <>
                <Arrow f={X7_F} from={CU} to={FAR} tone="teal" w={2.2} dashed />
                <g opacity={0.45} className={FADE}>
                  <Shiku f={X7_F} at={FAR} />
                </g>
                <Label f={X7_F} at={FAR} dx={-4} dy={20} anchor="end" size={9} weight={700} className={`${FADE} fill-danger`}>
                  আরও দূরে!
                </Label>
              </>
            )}
            {k >= 3 && <Arrow f={X7_F} from={minus(CU, X7_OFF)} to={minus(CV, X7_OFF)} tone="coral" w={2.6} draw />}
            <Prize f={X7_F} at={CU} />
            <Samin f={X7_F} at={CV} />
            <Shiku f={X7_F} at={[p[0], p[1]]} />
          </Plane>
        </div>
        <div className="flex w-[6.5rem] shrink-0 flex-col items-center gap-1.5 text-center">
          <div className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
            <i className="block font-serif text-sm">u − v</i>
            <Chip v={CD} tone="teal" />
          </div>
          <div className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 3 ? "" : "opacity-0"}`}>
            <i className="block font-serif text-sm">v − u</i>
            <Chip v={BACK} tone="coral" />
          </div>
          <div className="min-h-7">{k >= 4 && <b className={`${POP} inline-block font-serif text-lg italic`}>u − v ≠ v − u</b>}</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: সামিন keeps the stall's
//      money. He comes up to সংখ্যার মেলা with his notebook open, and the two
//      years' spending pop up as three-slot cards, (খাবার, decoration,
//      পুরস্কার). What changed is the widget's.

const S8_Y = 158;
const S8_SAMIN = 228;

export function SaminBook({}: Story) {
  const s = useScene(5, [600, 1600, 1100, 1100, 1300]);
  const k = s.k;
  const row = (i: number, name: string, text: string, tone: "blue" | "coral") => (
    <g key={name}>
      <text x={56} y={55 + i * 23} textAnchor="end" fontSize={8} fontWeight={700} fill="#0f1b2d" className={POP}>
        {name}
      </text>
      <CastCard x={112} y={52 + i * 23} text={text} tone={tone} />
    </g>
  );
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" ground={S8_Y} label="সামিন at the সংখ্যার মেলা stall with his notebook: last year's spending (1200, 300, 250) and this year's (1100, 450, 100)">
        <Stall x={96} y={S8_Y} w={104} sign="সংখ্যার মেলা" color="#2563eb" />
        {k >= 3 && (
          <text x={112} y={37} textAnchor="middle" fontSize={7.5} fontWeight={600} fill="#44403c" className={POP}>
            (খাবার, decoration, পুরস্কার)
          </text>
        )}
        {k >= 3 && row(0, "গত বছর", "(1200, 300, 250)", "blue")}
        {k >= 4 && row(1, "এ বছর", "(1100, 450, 100)", "coral")}
        <Person who="samin" x={k >= 1 ? S8_SAMIN : 370} y={S8_Y} facing={-1} walking={k === 1} ms={1400} arm={k >= 2 ? "hold" : "down"} mood={k >= 5 ? "puzzled" : "plain"} label />
        {k >= 2 && (
          <g className={POP}>
            <path d={`M${S8_SAMIN - 28} ${S8_Y - 50}l10 2l10 -2v12l-10 2l-10 -2Z`} fill="white" stroke="#64748b" strokeWidth={0.9} strokeLinejoin="round" />
            <path d={`M${S8_SAMIN - 18} ${S8_Y - 48}v12M${S8_SAMIN - 25} ${S8_Y - 45}h5M${S8_SAMIN - 25} ${S8_Y - 42}h5M${S8_SAMIN - 15} ${S8_Y - 45}h5M${S8_SAMIN - 15} ${S8_Y - 42}h5`} stroke="#94a3b8" strokeWidth={0.8} />
          </g>
        )}
        {k >= 5 && <Bubble x={S8_SAMIN} y={S8_Y - 66} lines={["কোন খাতে", "কী বদলালো?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · সামিন's stall book. Per slot the reader calls it (বেড়েছে / কমেছে), then
//     the subtraction shows its sign and says it in words; one vector, the
//     whole story.

const BOOK = [
  { k: "খাবার", then: 1200, now: 1100 },
  { k: "Decoration", then: 300, now: 450 },
  { k: "পুরস্কার", then: 250, now: 100 },
];
const MOVE = ["বেড়েছে", "কমেছে"];
const signed = (n: number) => (n > 0 ? `+${n}` : sg(n));

export function StallMoney() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<(number | null)[]>("picks", [null, null, null]);
  const all = picks.every((p) => p !== null);
  const diff = BOOK.map((b) => b.now - b.then);

  const pick = (i: number, p: number) => {
    if (picks[i] !== null) return;
    const next = picks.map((q, j) => (j === i ? p : q));
    setPicks(next);
    if (next.every((q) => q !== null)) pass("বিয়োগ বলে কোন খাতে কত বদলালো।");
  };

  return (
    <>
      <div className="mt-4 text-center text-sm text-muted">সামিনের হিসাবের খাতা, সব টাকায়।</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {BOOK.map((b, i) => {
          const d = diff[i];
          const p = picks[i];
          const right = d > 0 ? 0 : 1;
          return (
            <div key={b.k} className="flex flex-col items-center rounded-xl border border-border px-1.5 py-2.5 text-center">
              <b>{b.k}</b>
              <span className="mt-1 text-xs text-muted">গত বছর</span>
              <span className="font-mono">{b.then}</span>
              <span className="text-xs text-muted">এ বছর</span>
              <span className="font-mono">{b.now}</span>
              {p === null ? (
                <div className="mt-2 grid w-full gap-1.5">
                  {MOVE.map((m, j) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => pick(i, j)}
                      className="cursor-pointer rounded-full border-2 border-border py-1 text-sm transition-colors hover:border-cat-blue/60 motion-reduce:transition-none"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={`${FADE} mt-2`}>
                  <div className="font-mono text-xs text-muted">
                    {b.now} − {b.then}
                  </div>
                  <div className={`font-mono text-xl font-bold ${d < 0 ? "text-danger" : "text-accent-text"}`}>{signed(d)}</div>
                  <div className="text-sm leading-snug">
                    {bn(Math.abs(d))} টাকা {d < 0 ? "কম" : "বেশি"}
                  </div>
                  <div className={`mt-0.5 text-xs ${p === right ? "text-accent-text" : "text-danger"}`}>{p === right ? "✓ ঠিক ধরেছেন" : "✕ উল্টোটা হয়েছে"}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {all && (
        <div className={`${FADE} mx-auto mt-4 max-w-sm rounded-2xl bg-cat-teal/5 px-4 py-3 text-center`}>
          <div className="text-sm text-muted">এ বছর − গত বছর</div>
          <div className="font-mono text-xl font-bold">
            (
            {diff.map((d, i) => (
              <span key={i}>
                {i > 0 && ", "}
                <span className={d < 0 ? "text-danger" : "text-accent-text"}>{signed(d)}</span>
              </span>
            ))}
            )
          </div>
        </div>
      )}
      <Task done={all}>প্রতিটা খাতে আগে আন্দাজ করুন খরচ বেড়েছে না কমেছে, তারপর বিয়োগটা মিলিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8¼ · A figure for screen 8's explanation, no task: what changed, with no
//      arrow in sight. Last year's spending rises as three bars, this year's
//      beside them; the gap in each pair is marked with its sign (kept short
//      in red, grown in green); the three gaps line up into one vector.

const X8_BASE = 96;
const X8_H = (n: number) => (n / 1200) * 78;
const X8_GROUPS = BOOK.map((b, i) => ({ ...b, cx: 42 + i * 80, d: b.now - b.then }));
const X8_SAY = [
  "গত বছরের খরচ, তিন খাতে।",
  "গত বছরের খরচ, তিন খাতে।",
  "পাশে এ বছরের খরচ।",
  "এ বছর − গত বছর: minus মানে কমেছে, plus মানে বেড়েছে।",
  "এক লাইনের একটা vector-এ পুরো বছরের গল্প।",
];

export function BookDiff() {
  const s = useScene(4, [600, 1400, 1500, 1900]);
  const k = s.k;
  const grow = (on: boolean) => ({ transform: `scaleY(${on ? 1 : 0})` });
  const bar = "origin-bottom [transform-box:fill-box] transition-transform duration-700 ease-out motion-reduce:transition-none";
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X8_SAY[k]}
        </span>
      }
    >
      <svg viewBox="0 0 250 118" role="img" aria-label="সামিন's spending, last year and this year, for food, decoration and prizes; the changes are −100, +150 and −150" className="mx-auto block h-auto w-full max-w-[16rem]">
        <g className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "" : "opacity-0"}`}>
          <rect x={158} y={4} width={8} height={8} rx={1.5} className="fill-muted/50" />
          <text x={170} y={11.5} fontSize={9} className="fill-muted">
            গত বছর
          </text>
        </g>
        <g className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 2 ? "" : "opacity-0"}`}>
          <rect x={158} y={18} width={8} height={8} rx={1.5} className="fill-cat-blue" />
          <text x={170} y={25.5} fontSize={9} className="fill-muted">
            এ বছর
          </text>
        </g>
        <path d={`M4 ${X8_BASE}H246`} strokeWidth={1} className="stroke-border" />
        {X8_GROUPS.map((g) => {
          const [ht, hn] = [X8_H(g.then), X8_H(g.now)];
          const down = g.d < 0;
          return (
            <g key={g.k}>
              <rect x={g.cx - 20} y={X8_BASE - ht} width={18} height={ht} style={grow(k >= 1)} className={`${bar} fill-muted/50`} />
              <rect x={g.cx + 2} y={X8_BASE - hn} width={18} height={hn} style={grow(k >= 2)} className={`${bar} fill-cat-blue`} />
              {k >= 3 && (
                <g className={FADE}>
                  <path d={`M${g.cx - 20} ${X8_BASE - ht}H${g.cx + 22}`} strokeWidth={1} strokeDasharray="2 2" className="stroke-muted" />
                  {down ? (
                    <rect x={g.cx + 2} y={X8_BASE - ht} width={18} height={ht - hn} strokeWidth={1.2} strokeDasharray="3 2" className="fill-danger/10 stroke-danger" />
                  ) : (
                    <rect x={g.cx + 2} y={X8_BASE - hn} width={18} height={hn - ht} className="fill-accent" />
                  )}
                  <text x={g.cx + 11} y={X8_BASE - Math.max(ht, hn) - 5} textAnchor="middle" fontSize={11} fontWeight={700} className={`font-mono ${down ? "fill-danger" : "fill-accent-text"}`}>
                    {signed(g.d)}
                  </text>
                </g>
              )}
              <text x={g.cx} y={X8_BASE + 13} textAnchor="middle" fontSize={9.5} className="fill-foreground">
                {g.k}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex min-h-8 items-center justify-center">
        {k >= 4 && (
          <span className={`${POP} inline-block font-mono text-lg font-bold`}>
            (
            {X8_GROUPS.map((g, i) => (
              <span key={g.k}>
                {i > 0 && ", "}
                <span className={g.d < 0 ? "text-danger" : "text-accent-text"}>{signed(g.d)}</span>
              </span>
            ))}
            )
          </span>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the subtraction a model
//      learns from. guess − answer is the error vector, the arrow from the
//      answer to the guess; each turn of the knob moves the guess back along
//      it by half, and the error shrinks, (8, 4), (4, 2), (2, 1).

const FGN = makeFrame(0, 10, -0.4, 6, 22, 14);
const GN_ANSWER: XY = [1, 1];
const GN_GUESS: XY[] = [
  [9, 5],
  [5, 3],
  [3, 2],
];
const GN_SAY = [
  "Model-এর guess এক জায়গায়, আসল answer আরেক জায়গায়।",
  "Model-এর guess এক জায়গায়, আসল answer আরেক জায়গায়।",
  "Guess − answer = (8, 4)। ভুলটা কোন দিকে, কতখানি, দুইটাই বলে দিলো।",
  "ভুলের উল্টো দিকে knob একটু ঘোরানো হলো। নতুন ভুল (4, 2)।",
];

export function GuessNudge() {
  const s = useScene(4, [400, 1100, 1800, 1500]);
  const k = s.k;
  const turn = clamp(k - 2, 0, GN_GUESS.length - 1);
  const g = useTween(GN_GUESS[turn], 800);
  const guess: XY = [g[0], g[1]];
  const err = minus(GN_GUESS[turn], GN_ANSWER);
  const knob = FGN.sx(1.3);
  const knobY = FGN.sy(4.7);

  return (
    <Scene
      scene={s}
      caption={
        k < 4 ? (
          <span key={k} className={FADE}>
            {GN_SAY[k]}
          </span>
        ) : (
          <span className={FADE}>আরেকটু ঘোরাতেই ভুল (2, 1)। এভাবে একটু একটু করে guess আসল answer-এর দিকে সরে।</span>
        )
      }
    >
      <Plane f={FGN} axes={false} label="a model's guess at (9, 5) and the answer at (1, 1); the error arrow shrinks as the knob turns" className="my-1! max-w-[15.5rem]">
        {k >= 1 && (
          <g className={FADE}>
            {/* the knob */}
            <circle cx={knob} cy={knobY} r={11} strokeWidth={1.5} className="pointer-events-none fill-[#e2e8f0] stroke-[#0f1b2d]" />
            <g
              style={{ transform: `translate(${knob}px, ${knobY}px) rotate(${turn * 55}deg)` }}
              className="pointer-events-none transition-transform duration-700 ease-out motion-reduce:transition-none"
            >
              <path d="M0 -3V-9" strokeWidth={2.5} strokeLinecap="round" className="stroke-[#0f1b2d]" />
            </g>
            <text x={knob} y={knobY + 22} textAnchor="middle" fontSize={9} fontWeight={600} className="pointer-events-none fill-[#5a6b7d]">
              knob
            </text>
            {GN_GUESS.slice(0, turn).map((p) => (
              <circle key={`${p}`} cx={FGN.sx(p[0])} cy={FGN.sy(p[1])} r={3.5} className="pointer-events-none fill-cat-violet/35" />
            ))}
          </g>
        )}
        {k >= 2 && (
          <>
            <Arrow f={FGN} from={GN_ANSWER} to={guess} tone="coral" w={2.4} draw />
            <Label
              key={turn}
              f={FGN}
              at={[(GN_ANSWER[0] + guess[0]) / 2, (GN_ANSWER[1] + guess[1]) / 2]}
              dx={-6}
              dy={-7}
              anchor="end"
              size={10}
              weight={700}
              className={`${FADE} fill-cat-coral font-mono`}
            >
              {tup(err)}
            </Label>
          </>
        )}
        <Prize f={FGN} at={GN_ANSWER} />
        <Label f={FGN} at={GN_ANSWER} dx={-9} dy={20} anchor="start" size={9}>
          আসল answer
        </Label>
        {k >= 1 && (
          <g className={FADE}>
            <circle cx={FGN.sx(guess[0])} cy={FGN.sy(guess[1])} r={6} strokeWidth={1.5} className="pointer-events-none fill-cat-violet stroke-white" />
            <Label f={FGN} at={guess} dy={-10} size={9}>
              guess
            </Label>
          </g>
        )}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8¾ · A story figure for screen 8's explanation, no task: ডাক্তার আপা reads
//      one patient's two reports. নাসিব walks into her room; last year's
//      (প্রেশার, চিনি) card, then today's (the checkup from screen 5, 110 and
//      90); today − last year pops up, and she sees which way it is heading.

const X8_Y = 150;
const X8_APA = 58;
const X8_NASIB = 284;

export function ApaReport() {
  const s = useScene(5, [600, 1500, 1200, 1300, 1700]);
  const k = s.k;
  const row = (i: number, name: string, text: string, tone: "blue" | "coral" | "amber") => (
    <g key={name}>
      <text x={172} y={60 + i * 26 + 3} textAnchor="end" fontSize={8} fontWeight={700} fill="#0f1b2d" className={POP}>
        {name}
      </text>
      <CastCard x={212} y={60 + i * 26} text={text} tone={tone} w={62} />
    </g>
  );
  return (
    <StoryFrame scene={s}>
      <Stage
        backdrop="room"
        ground={X8_Y}
        label="ডাক্তার আপা reads নাসিব's reports, (প্রেশার, চিনি): last year (105, 70), today (110, 90); today minus last year is (+5, +20), and she sees the sugar is going up"
      >
        <Person who="apa" x={X8_APA} y={X8_Y} arm={k >= 2 ? "hold" : "down"} mood={k >= 5 ? "puzzled" : "plain"} />
        {/* her desk, in front of her */}
        <rect x={20} y={X8_Y - 26} width={80} height={26} rx={2} fill="#a16207" />
        <rect x={16} y={X8_Y - 30} width={88} height={5} rx={2} fill="#854d0e" />
        <text x={60} y={X8_Y - 10} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fef3c7">
          ডাক্তার আপা
        </text>
        {k >= 2 && (
          <text x={212} y={40} textAnchor="middle" fontSize={8} fontWeight={600} fill="#44403c" className={POP}>
            (প্রেশার, চিনি)
          </text>
        )}
        {k >= 2 && row(0, "গত বছর", "(105, 70)", "blue")}
        {k >= 3 && row(1, "আজ", "(110, 90)", "coral")}
        {k >= 4 && (
          <>
            <path d="M184 99H240" stroke="#0f1b2d" strokeOpacity={0.5} strokeWidth={1} className={POP} />
            {row(2, "আজ − গত বছর", "(+5, +20)", "amber")}
          </>
        )}
        <Person who="nasib" x={k >= 1 ? X8_NASIB : 370} y={X8_Y} facing={-1} walking={k === 1} ms={1400} mood={k >= 5 ? "sad" : "plain"} label />
        {k >= 5 && <Bubble x={X8_APA + 4} y={X8_Y - 66} side="right" lines={["চিনিটা কিন্তু", "বাড়ছে!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9 · Say it out loud. Each card: a line of notation; tapped, its reading.

const SAY: { see: string; say: string }[] = [
  { see: "u + v", say: "“u হাঁটো, তারপর সেখান থেকে v হাঁটো”" },
  { see: "u + v = v + u", say: "“আগে-পরে যেভাবেই হাঁটো, পৌঁছাবে একই জায়গায়”" },
  { see: "u − v", say: "“v থেকে u-তে যাওয়ার arrow”" },
  { see: "v + (u − v) = u", say: "“v থেকে ওই arrow ধরে হাঁটলে u-তে পৌঁছাবে”" },
];

export function SayIt() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);

  const flip = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === SAY.length) pass("যোগ মানে পরপর হাঁটা, বিয়োগ মানে পথ।");
  };

  return (
    <>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {SAY.map((c, i) => {
          const on = open.includes(i);
          return (
            <button
              key={c.see}
              type="button"
              aria-expanded={on}
              onClick={() => flip(i)}
              className={`flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-3 py-2.5 text-center transition-colors motion-reduce:transition-none ${
                on ? "cursor-default border-cat-violet/40 bg-cat-violet/5" : "border-border hover:border-cat-violet/60"
              }`}
            >
              <span className="font-serif text-2xl italic">{c.see}</span>
              {on ? <span className={`${FADE} mt-1 text-[0.92rem] leading-snug`}>{c.say}</span> : <span className="mt-1 text-xs text-muted">আগে মুখে বলুন, তারপর tap</span>}
            </button>
          );
        })}
      </div>
      <Task done={open.length === SAY.length}>
        প্রতিটা card আগে মুখে বলুন, তারপর উল্টে মিলিয়ে নিন। ({bn(open.length)}/{bn(SAY.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9¼ · A figure for screen 9's explanation, no task: reading a book's symbols.
//      "u + v" on the page: Shiku walks u, then v from where he stopped, and
//      the sum is worked slot by slot. "u − v": the arrow from v to u, and the
//      difference worked slot by slot.

const X9_F = makeFrame(0, 6, 0, 5, 18, 10);
const X9_PATH = walk2(O, U1, V1);
const X9_SAY = [
  "বইয়ে u + v দেখলে: Shiku আগে u ধরে হাঁটে, তারপর সেখান থেকে v।",
  "বইয়ে u + v দেখলে: Shiku আগে u ধরে হাঁটে, তারপর সেখান থেকে v।",
  "আর হিসাব করতে হলে? ঘরে ঘরে যোগ।",
  "u − v দেখলে: v থেকে u-তে যাওয়ার পথ।",
  "হিসাবে ঘরে ঘরে বিয়োগ, এর বেশি কিছু না।",
];

export function ReadAloud() {
  const s = useScene(4, [600, 1900, 1700, 1800]);
  const k = s.k;
  const sub = k >= 3;
  const w = useSceneWalk(X9_PATH, k >= 1 && !sub, 1300);
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X9_SAY[k]}
        </span>
      }
    >
      <div className="flex items-center justify-center gap-4">
        <div className="w-[8rem] shrink-0">
          <Plane
            f={X9_F}
            label={sub ? "u − v: the arrow from v at (2, 1) to u at (6, 4)" : "u + v: Shiku walks u = (3, 1), then v = (1, 4), and stops at (4, 5)"}
            className="my-0! max-w-none"
          >
            {!sub ? (
              <g key="add">
                <Trail f={X9_F} cells={w.trail} faint />
                {k >= 1 && <Arrow f={X9_F} from={O} to={U1} tone="blue" draw delay={300} />}
                {k >= 1 && <Arrow f={X9_F} from={U1} to={S1} tone="coral" draw delay={900} />}
                <Shiku f={X9_F} at={w.here} />
              </g>
            ) : (
              <g key="sub" className={FADE}>
                <Arrow f={X9_F} from={CV} to={CU} tone="teal" draw />
                <Prize f={X9_F} at={CU} />
                <circle cx={X9_F.sx(CV[0])} cy={X9_F.sy(CV[1])} r={4.5} className="pointer-events-none fill-cat-violet" />
                <Label f={X9_F} at={CV} dx={-8} dy={4} anchor="end" size={11} className="fill-[#0f1b2d] font-serif italic">
                  v
                </Label>
                <Label f={X9_F} at={CU} dx={-2} dy={16} anchor="middle" size={11} className="fill-[#0f1b2d] font-serif italic">
                  u
                </Label>
              </g>
            )}
          </Plane>
        </div>
        <div className="w-[8.5rem] shrink-0 text-center">
          <div className="rounded-md border border-border bg-surface px-2 py-1.5 shadow-sm">
            <div className="text-[0.65rem] text-muted">বইয়ে লেখা</div>
            <div key={sub ? "s" : "a"} className={`${FADE} font-serif text-2xl italic`}>
              {sub ? "u − v" : "u + v"}
            </div>
          </div>
          <div className="mt-2 min-h-10 font-mono text-xs leading-relaxed">
            {k === 2 && (
              <span className={FADE}>
                (3 + 1, 1 + 4)
                <br />= <b className="text-cat-teal">(4, 5)</b>
              </span>
            )}
            {k >= 4 && (
              <span className={FADE}>
                (6 − 2, 4 − 1)
                <br />= <b className="text-cat-teal">(4, 3)</b>
              </span>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for the review check's explanation, no task: the check's sum
//      walked. (4, −1): 4 east, 1 south; then from there (−2, 3): 2 west,
//      3 north. Shiku stops at (2, 2).

const FCW = makeFrame(-1, 5, -2, 3, 24, 14);
const CW_A: XY = [4, -1];
const CW_B: XY = [-2, 3];
const CW_S = plus(CW_A, CW_B);
const CW_PATH = walk2(O, CW_A, CW_B);
/** the square where card 1 ends */
const CW_MID = route(O, CW_A).length - 1;
const CW_END = CW_PATH.length - 1;
const CW_MS = CW_PATH.map((_, i) => (i === 0 ? 500 : i === CW_MID ? 900 : i === CW_END ? 700 : 300));

export function CheckWalk() {
  const s = useScene(CW_END + 1, CW_MS);
  const k = s.k;
  const i = Math.min(k, CW_END);
  const say =
    k > CW_END
      ? null
      : k <= CW_MID
        ? "প্রথম card: 4 ঘর পূর্বে, তারপর 1 ঘর দক্ষিণে।"
        : "সেখান থেকে দ্বিতীয় card: 2 ঘর পশ্চিমে, তারপর 3 ঘর উত্তরে।";

  return (
    <Scene
      scene={s}
      caption={
        say ? (
          <span key={k <= CW_MID ? "a" : "b"} className={FADE}>
            {say}
          </span>
        ) : (
          <span className={FADE}>
            Shiku থামলো ঠিক (2, 2)-এ।
            <span className="block font-mono text-foreground">(4, −1) + (−2, 3) = (2, 2)</span>
          </span>
        )
      }
    >
      <Plane f={FCW} ticks={1} label="Shiku walks (4, −1), then (−2, 3), and stops at (2, 2)" className="my-1! max-w-[12rem]">
        <Trail f={FCW} cells={CW_PATH.slice(0, i + 1)} faint={k > CW_END} />
        {k >= CW_MID && <Arrow f={FCW} from={O} to={CW_A} tone="blue" draw />}
        {k >= CW_END && <Arrow f={FCW} from={CW_A} to={CW_S} tone="coral" draw />}
        {k > CW_END && (
          <>
            <Arrow f={FCW} from={O} to={CW_S} tone="teal" w={3.2} draw />
            <Prize f={FCW} at={CW_S} found />
          </>
        )}
        <Shiku f={FCW} at={CW_PATH[i]} />
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9¾ · A story figure for the review step's explanation, no task: the treasure
//      found. Shiku walks one card along the chalk, then the next from where
//      he stopped; the chest opens and ফাহিম cheers; out come the two new
//      moves, u + v and u − v, and both are done slot by slot.

const X10_Y = 168;
const X10_GATE = 64;
const X10_TURN: XY = [178, 168];
const X10_END: XY = [240, 138];

export function TreasureFound() {
  const s = useScene(4, [600, 1500, 1500, 1400]);
  const k = s.k;
  const at = k >= 2 ? X10_END : k >= 1 ? X10_TURN : ([X10_GATE, X10_Y] as XY);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" ground={118} label="Shiku walks one card and then the next along the chalk, reaches the chest and it opens; two cards come out, u + v and u − v">
        <ChalkGrid top={118} />
        <Gate x={X10_GATE} y={X10_Y} />
        <Person who="fahim" x={124} y={146} mood={k >= 3 ? "happy" : "plain"} arm={k >= 3 ? "wave" : "down"} label />
        {k >= 1 && <Draw d={`M${X10_GATE} ${X10_Y + 3}H${X10_TURN[0]}`} ms={1300} strokeWidth={2.4} className="stroke-white" />}
        {k >= 2 && <Draw d={`M${X10_TURN[0]} ${X10_Y + 3}L${X10_END[0]} ${X10_END[1] + 3}`} ms={1300} strokeWidth={2.4} className="stroke-white" />}
        <Chest x={272} y={141} open={k >= 3} />
        <Robot x={at[0]} y={at[1]} ms={1300} walking={k === 1 || k === 2} />
        {k === 3 && <Bubble x={124} y={146 - 66} lines={["পাওয়া গেছে!"]} />}
        {k >= 4 && (
          <>
            <CastCard x={228} y={72} text="u + v" tone="blue" />
            <CastCard x={280} y={72} text="u − v" tone="coral" />
            <Bubble x={124} y={146 - 66} lines={["দুইটাই ঘরে ঘরে!"]} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for the last check's explanation, no task: what the clue
//       cards were. A card's two slots get counted, ১ and ২; ∈ ℝ² lands with
//       its name; the card is drawn as the arrow it is; then আম্মুর tiffin card
//       turns up with its ℝ left blank for the reader.

const X11_F = makeFrame(0, 3, 0, 1, 16, 6);
const X11_SAY = [
  "Treasure hunt-এর প্রতিটা card-এ দুইটা ঘর।",
  "Treasure hunt-এর প্রতিটা card-এ দুইটা ঘর।",
  "দুই ঘর, তাই ওরা 2-dimensional vector: u,\u00a0v\u00a0∈\u00a0ℝ²।",
  "কোন দিকে কত দূর, এই কথাটাই তো একটা arrow। আর arrow মানেই vector।",
  "টিফিনের card-গুলো তাহলে কী? নিজেই বলে দিন।",
];

export function CardR2() {
  const s = useScene(4, [600, 1500, 1700, 1700]);
  const k = s.k;
  const slot = (n: number, count: string, i: number) => (
    <span className="relative inline-block">
      {n}
      {k >= 1 && (
        <span style={{ transitionDelay: `${i * 300}ms` }} className={`${POP} absolute -top-6 left-1/2 -translate-x-1/2 font-sans text-xs leading-5 font-semibold text-cat-amber`}>
          {count}
        </span>
      )}
    </span>
  );
  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {X11_SAY[k]}
        </span>
      }
    >
      <div className="flex flex-col items-center gap-2 pt-4">
        <div className="flex min-h-10 items-center gap-3">
          <span className="rounded-xl border-2 border-cat-blue/40 bg-surface px-3 py-1 font-mono text-xl font-bold text-cat-blue">
            ({slot(3, "১", 0)}, {slot(1, "২", 1)})
          </span>
          {k >= 2 && <span className={`${POP} inline-block font-serif text-xl italic`}>∈ ℝ²</span>}
          {k >= 3 && (
            <span className={`${FADE} w-[4rem] shrink-0`}>
              <Plane f={X11_F} label="the card (3, 1) drawn as an arrow" className="my-0! max-w-none">
                <Arrow f={X11_F} from={O} to={[3, 1]} tone="blue" w={2.2} draw />
              </Plane>
            </span>
          )}
        </div>
        <div className="min-h-6">{k >= 2 && <b className={`${FADE} text-sm`}>2-dimensional vector</b>}</div>
        <div className="flex min-h-9 items-center gap-3">
          {k >= 4 && (
            <span className={`${FADE} flex items-center gap-3`}>
              <span className="rounded-xl border-2 border-cat-amber/50 bg-surface px-3 py-1 font-mono text-base font-bold text-cat-amber">(80, 6, 0)</span>
              <span className="font-serif text-xl italic">
                ∈ ℝ<sup className="font-sans font-bold text-cat-amber not-italic">?</sup>
              </span>
            </span>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10¾ · A story figure for the last step's explanation, no task: the next
//       stall. Class seven's লেবুর শরবত; the queue grows, two, then five; the
//       recipe card for ৪ গ্লাস, (2, 4), pops up, and as the line gets long
//       it is pulled wider with a "× ?" and a shout from the back. What the
//       stretch does is the next journey's.

const X12_Y = 150;
const X12_SELLER = 130;
const X12_LINE: Who[] = ["som", "nasib", "fahim", "samin", "karim"];

export function SherbetTease() {
  const s = useScene(4, [600, 1500, 1600, 1500]);
  const k = s.k;
  const cy = 60;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" ground={X12_Y} label="the লেবুর শরবত stall: a queue grows, the recipe card (2, 4) for 4 glasses pops up, and it gets pulled wider with a question mark">
        <Stall x={66} y={X12_Y} w={92} sign="লেবুর শরবত" color="#eab308" />
        <Person who="rina" x={X12_SELLER} y={X12_Y} arm={k >= 3 ? "hold" : "down"} mood={k >= 4 ? "puzzled" : "plain"} />
        {X12_LINE.map((who, i) => {
          const here = i < 2 ? k >= 1 : k >= 2;
          return (
            <Person key={who} who={who} x={here ? 168 + i * 30 : 380 + i * 30} y={X12_Y} facing={-1} walking={here && k === (i < 2 ? 1 : 2)} ms={1400} mood={k >= 4 ? "puzzled" : "plain"} />
          );
        })}
        {k >= 3 && (
          <>
            <text x={X12_SELLER} y={cy - 16} textAnchor="middle" fontSize={8} fontWeight={700} fill="#0f1b2d" className={POP}>
              ৪ গ্লাসের recipe
            </text>
            <CastCard x={X12_SELLER} y={cy} text="(2, 4)" tone="amber" />
          </>
        )}
        {k >= 4 && (
          <g className={POP}>
            <rect x={X12_SELLER - 44} y={cy - 12} width={88} height={24} rx={4} fill="none" stroke="#b45309" strokeWidth={1.2} strokeDasharray="4 3" />
            <path d={`M${X12_SELLER - 30} ${cy}h-10m0 0l4 -3m-4 3l4 3M${X12_SELLER + 30} ${cy}h10m0 0l-4 -3m4 3l-4 3`} fill="none" stroke="#b45309" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
            <text x={X12_SELLER + 52} y={cy + 4} fontSize={11} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#b45309">
              × ?
            </text>
          </g>
        )}
        {k >= 4 && <Bubble x={288} y={X12_Y - 66} side="left" lines={["এত জনের", "জন্য কত?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  TwoClues: { start: {}, guessed: { guess: [3, 4] }, walked: { guess: [3, 4], walked: true } },
  SlotAdd: {
    start: { ans: [5, 4] },
    first: { ans: [6, 4], landed: [6, 4], solved: 1 },
    last: { round: 2, solved: 3, ans: [3, 5], landed: [3, 5] },
  },
  SwapOrder: { start: {}, swapped: { swapped: true, guess: 0 }, walked: { swapped: true, guess: 0, walked: true } },
  SnackLabel: { start: {}, two: { added: [0, 1] }, full: { added: [0, 1, 2] } },
  WrongShape: { start: {}, all: { tried: [0, 1, 2] } },
  WayBack: {
    start: {},
    dragging: { tip: [5, 3] },
    first: { solved: 1, tip: [6, 4] },
    second: { round: 1, solved: 2, tip: [4, 2] },
    last: { round: 2, solved: 3, tip: [1, 1] },
  },
  CheckTrip: {
    start: {},
    walked: { guess: 1, walked: true },
    far: { guess: 1, walked: true, back: 0, far: true },
    home: { guess: 1, walked: true, back: 0, far: true, home: true },
  },
  StallMoney: { start: {}, one: { picks: [1, null, null] }, all: { picks: [1, 1, 1] } },
  SayIt: { start: {}, all: { open: [0, 1, 2, 3] } },
  // scenes shoot fully played; these catch a beat mid-way (the seed is the beat count k)
  TipToTail: { done: {}, gate: { k: 2 } },
  SlotShadow: { done: {}, floor: { k: 3 } },
  GuessNudge: { done: {}, error: { k: 2 } },
  CheckWalk: { done: {}, half: { k: 5 } },
  FairGate: { done: {}, rule: { k: 1 }, gate: { k: 4 } },
  SomFlips: { done: {}, said: { k: 4 } },
  TiffinCards: { done: {}, opened: { k: 3 } },
  NasibPocket: { done: {}, idea: { k: 3 } },
  SaminStuck: { done: {}, spots: { k: 2 } },
  SaminBook: { done: {}, book: { k: 3 } },
  // explanation figures, each caught mid-way too
  OneCard: { done: {}, mid: { k: 2 } },
  SlotTable: { done: {}, mid: { k: 2 } },
  Parallelogram: { done: {}, mid: { k: 4 } },
  SwapSums: { done: {}, mid: { k: 2 } },
  FlatPaper: { done: {}, mid: { k: 3 } },
  ManySlots: { done: {}, mid: { k: 2 }, three: { k: 3 } },
  NoPartner: { done: {}, mid: { k: 3 } },
  RnPair: { done: {}, mid: { k: 2 } },
  UndoAdd: { done: {}, mid: { k: 3 } },
  FlipCard: { done: {}, mid: { k: 2 } },
  BookDiff: { done: {}, mid: { k: 3 } },
  ApaReport: { done: {}, mid: { k: 3 } },
  ReadAloud: { done: {}, mid: { k: 2 } },
  TreasureFound: { done: {}, mid: { k: 3 } },
  CardR2: { done: {}, mid: { k: 2 } },
  SherbetTease: { done: {}, mid: { k: 3 } },
};
