"use client";

import { useState } from "react";

import { Choice, Draw, FADE, Nope, POP, Scene, pill, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person as CastPerson, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Plane, clamp, makeFrame, sg, type Frame, type XY } from "@/components/journey/plane";
import { Task, useGate } from "@/components/journey/journey";
import { BedBath, Clipped, FLATS, FlatDot, GROUND, Jilapi, KF, NameTag, O, R2, RoofSet, TiltGrid, type Story } from "./rooftop-parts";

// Screens for "Math for AI 5.6b — Turn the grid, what stays real", told as a
// Journey in the author's Bangla-English, 7 steps (the pathshala-journey
// skill). The second half of 5.6 (rooftop-journey.tsx); the khata, Chacha
// and the jilapi are shared through rooftop-parts.tsx.
//
// Late on the same night, on the roof. Nasib, half a jilapi in hand: any grid
// gives any numbers, so even how far apart two flats are is only the grid's
// say. Flats (3, 1) and (3, 3) are 2 apart on the khata's grid; the reader
// seals a bet on what Fahim's cards will say (FairBet). Pythagoras on
// Fahim's cards says 1.41, the tape on the paper says 2 (NasibTape); shrink
// Fahim's buttons to 1 long and the sum says 2 too (ShrinkButtons: the
// orthonormal idea, played before it's named); turn a fair grid under 2.3's
// word map and every slot number moves while the distance and the cosine
// don't (SpinTheGrid); of all the fair turns, the one that loses least when
// the second number is dropped is about 35°, near Fahim's 45° (BestTurn:
// PCA, played); Try it picks the grid whose cards tell the truth
// (TryFairGrid); the finale opens the bet and carries Article 5 forward
// (BetOpened).
//
// Story scenes: RoofLate, NasibSums, NasibTurns, ThreeGridsDrawn, LastJilapi.
// Watch-only figures, one or two in every <Then>: TwoFlatsTape, StepLength,
// ShrinkToOne, SameArrows + Slot137, MachineVsFahim + RiverIdeaAgain,
// TwoChecks, PcaWords + GridLifted.
//
// Tailwind only; the sheets are journey/plane. Ink on white sheets is fixed.

/** the two flats Nasib measures: 3 bed 1 bath, and 3 bed 3 bath */
const FA: XY = [3, 1];
const FB: XY = [3, 3];
const RENT_A = 17;
const RENT_B = 25;

/** a number to two places, with a real minus */
const two = (n: number) => sg(Math.round(n * 100) / 100);

/** a green tick, drawn (the ✓ glyph turns into an emoji on Linux) */
function Tick() {
  return (
    <svg viewBox="0 0 12 12" className="inline-block size-3 align-[-1px]" aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="stroke-accent-text" />
    </svg>
  );
}

/**
 * The grid of any two buttons e1, e2 (not only square ones): lines through
 * every whole number of e1 steps, along e2, and the other way round.
 */
function BasisLines({ f, e1, e2, className = "stroke-cat-violet/40", n = 9 }: { f: Frame; e1: XY; e2: XY; className?: string; n?: number }) {
  const at = (i: number, j: number) => `${f.sx(i * e1[0] + j * e2[0])} ${f.sy(i * e1[1] + j * e2[1])}`;
  let d = "";
  for (let i = -n; i <= n; i++) d += `M${at(i, -n)}L${at(i, n)}M${at(-n, i)}L${at(n, i)}`;
  return <path d={d} strokeWidth={0.7} className={`pointer-events-none fill-none ${className}`} />;
}

/** a point's card on the basis (e1, e2): solve a·e1 + b·e2 = p */
const cardOn = (p: XY, e1: XY, e2: XY): XY => {
  const det = e1[0] * e2[1] - e1[1] * e2[0];
  return [(p[0] * e2[1] - p[1] * e2[0]) / det, (e1[0] * p[1] - e1[1] * p[0]) / det];
};
/** Pythagoras on the difference of two cards */
const cardSum = (e1: XY, e2: XY) => {
  const [a, b] = [cardOn(FA, e1, e2), cardOn(FB, e1, e2)];
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
};

/** a straight bar from `from`, `len` long, straight up (the two flats sit one above the other) */
function UpBar({ f, from, len, tone, dx = 0, label, draw = true }: { f: Frame; from: XY; len: number; tone: "good" | "bad" | "tape"; dx?: number; label: string; draw?: boolean }) {
  const x = f.sx(from[0]) + dx;
  const y0 = f.sy(from[1]);
  const y1 = f.sy(from[1] + len);
  const ink = tone === "good" ? "stroke-[#16a34a]" : tone === "bad" ? "stroke-[#dc2626]" : "stroke-[#b45309]";
  const txt = tone === "good" ? "fill-[#15803d]" : tone === "bad" ? "fill-[#b91c1c]" : "fill-[#92400e]";
  return (
    <g className="pointer-events-none">
      {draw ? <Draw d={`M${x} ${y0}V${y1}`} strokeWidth={tone === "tape" ? 6 : 3} className={`${ink} ${tone === "tape" ? "opacity-60" : ""}`} /> : <path d={`M${x} ${y0}V${y1}`} strokeWidth={3} className={ink} />}
      <path d={`M${x - 4} ${y1}H${x + 4}`} strokeWidth={2} className={ink} />
      <text x={x + (dx < 0 ? -6 : 6)} y={(y0 + y1) / 2 + 3} textAnchor={dx < 0 ? "end" : "start"} fontSize={9} fontWeight={800} fontFamily="ui-monospace, monospace" className={txt}>
        {label}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: late at night on the
//      roof. The tenant has gone; Fahim and Nasib each hold half a jilapi.
//      Nasib opens the khata again: any grid, any numbers; even how far
//      apart two flats are is the grid's say.

export function RoofLate({}: Story) {
  const s = useScene(3, [700, 2400, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="late at night on the roof; Nasib says any grid gives any numbers, even the distance between two flats">
        <RoofSet lit />
        <CastPerson who="fahim" x={132} y={GROUND} facing={1} arm="hold" />
        <NameTag x={132} y={GROUND + 13} name="ফাহিম" />
        <Jilapi x={146} y={GROUND - 28} s={0.8} half />
        <CastPerson who="nasib" x={236} y={GROUND} facing={-1} arm={k >= 1 ? "point" : "hold"} mood={k >= 1 ? "smug" : "plain"} />
        <NameTag x={236} y={GROUND + 13} name="নাসিব" />
        {k === 0 && <Jilapi x={222} y={GROUND - 28} s={0.8} half />}
        {k >= 1 && <rect x={250} y={GROUND - 46} width={11} height={14} rx={1} fill="#b91c1c" stroke="#7f1d1d" strokeWidth={0.6} className={POP} />}
        {k === 1 && <Bubble x={236} y={GROUND - 68} side="left" lines={["যেকোনো grid নে,", "যেকোনো সংখ্যা পাবি."]} />}
        {k >= 2 && <Bubble x={236} y={GROUND - 68} side="left" lines={["দুই flat কতদূরে,", "সেটাও grid এর মর্জি."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Flats (3, 1) and (3, 3), 2 apart on the khata's grid.
//     On Fahim's grid, will they be 2 apart, less, or more? The tape
//     between them waits with a "?", and nothing is marked until the end.

const FB_BET = ["2 ই থাকবে", "2 এর কম হবে", "2 এর বেশি হবে"];
/** how long each bet's tape is drawn: only a picture of "same, shorter, longer", no number said */
const FB_LEN = [2, 1.5, 2.5];
const BF = makeFrame(1.3, 4.7, -0.2, 3.8, 30, 10);

/** a bet as a picture: the khata's 2 as a grey bar, the bet's tape in violet beside it */
function BetBars({ i }: { i: number }) {
  const h = (n: number) => n * 12;
  return (
    <svg viewBox="0 0 30 36" className="h-6 w-auto shrink-0" aria-hidden="true">
      <path d={`M9 34V${34 - h(2)}`} strokeWidth={4} strokeLinecap="round" className="stroke-[#b45309]/50" />
      <path d={`M21 34V${34 - h(FB_LEN[i])}`} strokeWidth={4} strokeLinecap="round" className="stroke-cat-violet" />
    </svg>
  );
}

export function FairBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);

  const seal = () => {
    setSealed(true);
    pass("বাজি সিল. শেষ screen এ খুলবো.");
  };

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={BF} ticks={1} label="flats (3, 1) and (3, 3) on Fahim's grid, and a question mark for their distance" className="my-0! max-w-none">
            <Clipped f={BF} name="fb">
              <TiltGrid f={BF} step={1} className="stroke-cat-violet/40" />
            </Clipped>
            {bet === null ? (
              <path d={`M${BF.sx(3) + 14} ${BF.sy(1)}V${BF.sy(3)}`} strokeWidth={1.4} strokeDasharray="3 3" className="stroke-[#5a6b7d]" />
            ) : (
              <g key={`bet${bet}`}>
                <Draw d={`M${BF.sx(3) + 14} ${BF.sy(1)}V${BF.sy(1 + FB_LEN[bet])}`} strokeWidth={4} ms={700} className="stroke-cat-violet" />
                <path d={`M${BF.sx(3) + 10} ${BF.sy(1 + FB_LEN[bet])}H${BF.sx(3) + 18}`} strokeWidth={2} className={`${FADE} stroke-cat-violet`} />
              </g>
            )}
            <text x={BF.sx(3) + 21} y={BF.sy(2) + 4} fontSize={12} fontWeight={800} className="fill-[#b45309]">
              ?
            </text>
            <FlatDot f={BF} at={FA} rent={RENT_A} />
            <FlatDot f={BF} at={FB} rent={RENT_B} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1 text-[0.85rem] leading-snug">
          খাতার grid এ flat <b className="font-mono">(3, 1)</b> আর <b className="font-mono">(3, 3)</b> ঠিক 2 ঘর দূরে. ফাহিমের grid এ গেলে ওদের দূরত্ব কত হবে?
        </div>
      </div>
      <div className="mt-2 grid gap-1.5">
        {FB_BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => setBet(i)}>
            <span className="flex items-center gap-2">
              {bet === null || bet === i ? <BetBars i={i} /> : null}
              {o}
            </span>
          </Choice>
        ))}
      </div>
      {bet !== null && !sealed ? (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={seal} className={`${primaryBtn} ${FADE}`}>
            বাজি সিল করুন
          </button>
        </div>
      ) : null}
      {sealed ? <div className={`${FADE} mt-2 text-center text-[0.9rem] leading-snug text-muted`}>সিল করা থাকলো. নাসিব ঠিক না ভুল, শেষে খুলবো.</div> : null}
      <Task done={sealed}>একটা উত্তর বেছে নিয়ে বাজি সিল করুন. শেষের আগে কেউ বলবে না কে জিতলো.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: what "distance" means
//      here. The two flats' rooms side by side; 2 baths apart; on the sheet a
//      tape of 2; then Fahim's grid laid over, with a "?".

export function TwoFlatsTape() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const SAY = [
    "দুইটা flat. দুইটাতেই 3 bed. একটায় 1 bath, আরেকটায় 3.",
    "খাতার sheet এ ফিতা ধরলে 2. দুইটা flat ঠিক 2 bath আলাদা.",
    "এবার উপরে ফাহিমের grid. একই দুইটা dot. ওর card এ হিসাব কত বলবে?",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto w-full max-w-[8.5rem]">
        <Plane f={BF} ticks={1} label="the two flats, a tape of 2 between them, then Fahim's grid" className="my-0! max-w-none">
          {k >= 2 && (
            <g className={FADE}>
              <Clipped f={BF} name="tf">
                <TiltGrid f={BF} step={1} className="stroke-cat-violet/45" />
              </Clipped>
            </g>
          )}
          {k >= 1 && <UpBar f={BF} from={FA} len={2} tone="tape" dx={14} label="2" />}
          {k >= 2 && (
            <text x={BF.sx(3) - 16} y={BF.sy(2) + 5} textAnchor="end" fontSize={13} fontWeight={800} className={`${POP} fill-cat-violet`}>
              ?
            </text>
          )}
          <FlatDot f={BF} at={FA} rent={RENT_A} />
          <FlatDot f={BF} at={FB} rent={RENT_B} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: Nasib sits down to
//      measure himself. First on the khata's cards, then on Fahim's, 3.4's
//      Pythagoras both times (only the formula shows, never a result). Then
//      Fahim takes a tape out of his pocket.

/** a paper measuring tape, rolled, with a little of it pulled out; centre of the roll at (x, y) */
function F2_Tape({ x, y, out = 0 }: { x: number; y: number; out?: number }) {
  return (
    <g className="pointer-events-none">
      {out > 0 && (
        <g className={FADE}>
          <rect x={x} y={y - 2.5} width={out} height={5} fill="#fde68a" stroke="#b45309" strokeWidth={0.6} />
          {Array.from({ length: Math.floor(out / 4) }, (_, i) => (
            <path key={i} d={`M${x + 4 + i * 4} ${y - 2.5}v2`} stroke="#92400e" strokeWidth={0.5} />
          ))}
        </g>
      )}
      <circle cx={x} cy={y} r={6} fill="#f59e0b" stroke="#92400e" strokeWidth={0.8} />
      <circle cx={x} cy={y} r={2} fill="#fef3c7" />
    </g>
  );
}

export function NasibSums({}: Story) {
  const s = useScene(3, [700, 1800, 1800, 2000]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="Nasib works Pythagoras on the khata's cards, then on Fahim's; Fahim takes a tape out of his pocket">
        <RoofSet lit />
        <CastPerson who="fahim" x={124} y={GROUND} facing={1} arm={k >= 3 ? "hold" : "down"} mood={k >= 3 ? "smug" : "plain"} />
        <NameTag x={124} y={GROUND + 13} name="ফাহিম" />
        <CastPerson who="nasib" x={228} y={GROUND} facing={-1} arm="hold" mood={k >= 1 && k < 3 ? "puzzled" : "plain"} />
        <NameTag x={228} y={GROUND + 13} name="নাসিব" />
        <rect x={207} y={GROUND - 46} width={11} height={14} rx={1} fill="#b91c1c" stroke="#7f1d1d" strokeWidth={0.6} />
        {k >= 1 && k < 3 && (
          <g key={k} className={POP}>
            <text x={228} y={GROUND - 100} textAnchor="middle" fontSize={8} fontWeight={700} fill="#e2e8f0">
              {k === 1 ? "খাতার card" : "ফাহিমের card"}
            </text>
            <CastCard x={228} y={GROUND - 84} text="√(a² + b²)" tone={k === 1 ? "teal" : "coral"} />
          </g>
        )}
        {k >= 3 && <F2_Tape x={142} y={GROUND - 36} out={30} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · Nasib measures three ways. Pythagoras on the khata's cards: (0, 2), so
//     2, and a green bar reaches the other flat. Pythagoras on Fahim's cards:
//     (1, −1), so 1.41, and a red bar stops short. A tape on the paper: 2,
//     whatever grid is drawn.

type How = "khata" | "fahim" | "tape";
const NT_F = makeFrame(-0.3, 5.3, -0.3, 3.9, 30, 10);
const NT_ROWS: Record<How, [string, string]> = {
  khata: ["খাতার card", "ফারাক (0, 2), √(0² + 2²) = 2"],
  fahim: ["ফাহিমের card", "ফারাক (1, −1), √(1² + 1²) = 1.41"],
  tape: ["কাগজে ফিতা", "grid যা-ই থাকুক, 2"],
};
/** each flat's card on the khata's grid and on Fahim's */
const NT_CARDS: Record<"khata" | "fahim", [string, string]> = {
  khata: ["(3, 1)", "(3, 3)"],
  fahim: ["(2, 1)", "(3, 0)"],
};

/** a line of mixed words and numbers: the numbers in monospace, the Bangla not (the mono stack has no Bangla) */
function Mixed({ text }: { text: string }) {
  return (
    <>
      {text.split(/([ঀ-৿][ঀ-৿ -]*[ঀ-৿]|[ঀ-৿])/).map((part, i) =>
        /[ঀ-৿]/.test(part) ? (
          <span key={i}>{part}</span>
        ) : (
          <span key={i} className="font-mono">
            {part}
          </span>
        ),
      )}
    </>
  );
}

export function NasibTape() {
  const pass = useGate();
  const [how, setHow] = useSeed<How | null>("how", null);
  const [seen, setSeen] = useSeed<How[]>("seen", []);
  const [tries, setTries] = useState(0);
  const all = seen.length === 3;

  const go = (h: How) => {
    setHow(h);
    setTries((t) => t + 1);
    if (seen.includes(h)) return;
    const next = [...seen, h];
    setSeen(next);
    if (next.length === 3) pass("ফাহিমের card বললো 1.41, ফিতা বললো 2.");
  };

  return (
    <>
      <Plane f={NT_F} ticks={1} label="flats (3, 1) and (3, 3), measured three ways" className="my-0! max-w-[14rem]">
        {how === "fahim" && (
          <g className={FADE}>
            <Clipped f={NT_F} name="nt">
              <TiltGrid f={NT_F} step={1} className="stroke-cat-violet/45" />
            </Clipped>
          </g>
        )}
        <BedBath f={NT_F} x={5.2} y={3.75} />
        {how === "khata" && <UpBar key={`k${tries}`} f={NT_F} from={FA} len={2} tone="good" dx={14} label="2" />}
        {how === "fahim" && <UpBar key={`f${tries}`} f={NT_F} from={FA} len={R2} tone="bad" dx={14} label="1.41" />}
        {how === "tape" && <UpBar key={`t${tries}`} f={NT_F} from={FA} len={2} tone="tape" dx={-14} label="2" />}
        {(how === "khata" || how === "fahim") &&
          [FA, FB].map((p, i) => (
            <text key={`${how}${i}`} x={NT_F.sx(p[0]) - 13} y={NT_F.sy(p[1]) + 3} textAnchor="end" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" className={`${FADE} ${how === "fahim" ? "fill-cat-violet" : "fill-[#0f1b2d]"}`}>
              {NT_CARDS[how][i]}
            </text>
          ))}
        <FlatDot f={NT_F} at={FA} rent={RENT_A} r={9} />
        <FlatDot f={NT_F} at={FB} rent={RENT_B} r={9} />
      </Plane>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        {(["khata", "fahim", "tape"] as How[]).map((h) => (
          <button key={h} type="button" onClick={() => go(h)} className={`${pill(how === h)} font-sans`}>
            {NT_ROWS[h][0]}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-2 grid max-w-sm gap-1 text-[0.8rem] leading-snug">
        {(["khata", "fahim", "tape"] as How[])
          .filter((h) => seen.includes(h))
          .map((h) => (
            <div key={h} className={`${FADE} flex gap-2 rounded-lg px-2 py-0.5 ${how === h ? "bg-foreground/5" : ""}`}>
              <span className="w-[5.5rem] shrink-0 text-muted">{NT_ROWS[h][0]}</span>
              <span className={h === "fahim" ? "text-danger" : ""}>
                <Mixed text={NT_ROWS[h][1]} />
              </span>
            </div>
          ))}
      </div>
      {all ? <div className={`${FADE} mt-1.5 text-center text-[0.85rem] font-medium`}>দুইটা flat এক চুলও নড়ে নাই. তাহলে মিথ্যা বলছে কে?</div> : null}
      <Task done={all}>তিনভাবে মাপুন: খাতার card দিয়ে, ফাহিমের card দিয়ে, আর কাগজে ফিতা ধরে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: how long is one of
//      Fahim's steps? One size step, (1, 1): one across, one up; Pythagoras
//      says 1.41. So Fahim's "1" is 1.41 on the paper.

const SL_F = makeFrame(-0.3, 1.5, -0.3, 1.5, 70, 10);

export function StepLength() {
  const s = useScene(3, [700, 1800, 2200]);
  const k = s.k;
  const SAY = [
    "ফাহিমের একটা size ধাপ: (1, 1).",
    "এক ঘর ডানে, এক ঘর উপরে. Pythagoras: √(1² + 1²).",
    "মানে ফাহিমের এক ধাপ কাগজে 1.41 লম্বা. 1 না.",
    "ওর card এ লেখা 1. কাগজে কিন্তু 1.41. Pythagoras এর হিসাব এটা জানে না.",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto w-full max-w-[9rem]">
        <Plane f={SL_F} ticks={1} label="one of Fahim's size steps and its length" className="my-0! max-w-none">
          {k >= 1 && (
            <g className={FADE}>
              <path d={`M${SL_F.sx(0)} ${SL_F.sy(0)}H${SL_F.sx(1)}V${SL_F.sy(1)}`} fill="none" strokeWidth={1.6} strokeDasharray="4 3" className="stroke-[#5a6b7d]" />
              <text x={SL_F.sx(0.5)} y={SL_F.sy(0) + 12} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" className="fill-[#0f1b2d]">
                1
              </text>
              <text x={SL_F.sx(1) + 7} y={SL_F.sy(0.5) + 4} fontSize={10} fontFamily="ui-monospace, monospace" className="fill-[#0f1b2d]">
                1
              </text>
            </g>
          )}
          <Arrow f={SL_F} from={O} to={[1, 1]} tone="blue" w={3} />
          {k >= 2 && (
            <text x={SL_F.sx(0.42) - 8} y={SL_F.sy(0.58) - 4} textAnchor="end" fontSize={11} fontWeight={800} fontFamily="ui-monospace, monospace" className={`${POP} fill-[#b91c1c]`}>
              1.41
            </text>
          )}
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · Shrink Fahim's buttons. Four lengths: 1.41, 1.2, 1, 0.8. The grid
//     glides finer; both flats' cards grow; the red bar (Pythagoras on the
//     cards, 2 ÷ length) grows. At 1 it lands exactly on the other flat. At
//     0.8 it overshoots.

const SB_LEN = [R2, 1.2, 1, 0.8];
const SB_NAME = ["1.41", "1.2", "1", "0.8"];
const SB_RIGHT = 2;

export function ShrinkButtons() {
  const pass = useGate();
  const [li, setLi] = useSeed("li", 0);
  const [bump, setBump] = useState(0);
  const L = SB_LEN[li];
  const [l] = useTween([L], 800);
  const d1: XY = [1 / R2, 1 / R2];
  const d2: XY = [1 / R2, -1 / R2];
  const e1: XY = [l * d1[0], l * d1[1]];
  const e2: XY = [l * d2[0], l * d2[1]];
  const ca = cardOn(FA, e1, e2);
  const cb = cardOn(FB, e1, e2);
  const sum = 2 / l;
  const right = li === SB_RIGHT;

  const pick = (i: number) => {
    setLi(i);
    setBump((b) => b + 1);
    if (i === SB_RIGHT) pass("Button 1 লম্বা: হিসাব আর ফিতা মিলে গেলো.");
  };

  return (
    <>
      <Plane f={NT_F} ticks={1} label="Fahim's grid with its buttons shrinking; Pythagoras on the new cards drawn as a red bar" className="my-0! max-w-[14rem]">
        <Clipped f={NT_F} name="sb">
          <BasisLines f={NT_F} e1={e1} e2={e2} n={10} className="stroke-cat-violet/40" />
        </Clipped>
        <UpBar f={NT_F} from={FA} len={2} tone="tape" dx={-14} label="2" draw={false} />
        <UpBar key={`r${bump}`} f={NT_F} from={FA} len={Math.min(sum, 2.85)} tone={Math.abs(sum - 2) < 0.02 ? "good" : "bad"} dx={14} label={two(sum)} />
        <Arrow f={NT_F} from={O} to={e1} tone="blue" w={2.4} />
        <Arrow f={NT_F} from={[0, 1.2]} to={[e2[0], 1.2 + e2[1]]} tone="coral" w={2.4} />
        <FlatDot f={NT_F} at={FA} rent={RENT_A} r={9} />
        <FlatDot f={NT_F} at={FB} rent={RENT_B} r={9} />
      </Plane>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <span className="text-xs font-semibold text-muted">button এর length</span>
        {SB_NAME.map((n, i) => (
          <button key={n} type="button" onClick={() => pick(i)} className={`${pill(li === i)} px-2.5! font-mono`}>
            {n}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-2 grid max-w-sm grid-cols-[5.5rem_1fr] gap-x-2 gap-y-0.5 text-[0.8rem] leading-snug">
        <span className="text-muted">ফাহিমের card</span>
        <span>
          <Mixed text={`(${two(ca[0])}, ${two(ca[1])}) আর (${two(cb[0])}, ${two(cb[1])})`} />
        </span>
        <span className="text-muted">হিসাব</span>
        <span className={`font-mono font-bold ${Math.abs(sum - 2) < 0.02 ? "text-accent-text" : "text-danger"}`}>
          √({two(Math.abs(cb[0] - ca[0]))}² + {two(Math.abs(cb[1] - ca[1]))}²) = {two(sum)}
        </span>
        <span className="text-muted">ফিতা</span>
        <span className="font-mono">2</span>
      </div>
      {li === 3 ? <Nope key={bump}>এবার হিসাব বেশি বলছে, 2.5. Button বেশি ছোট হয়ে গেছে.</Nope> : null}
      {right ? <div className={`${FADE} mt-1.5 text-center text-[0.85rem] font-medium text-accent-text`}>লাল ফিতা এখন ঠিক (3, 3) এ গিয়ে থামে.</div> : null}
      <Task done={right}>Button দুইটার length বদলান. হিসাবের লাল ফিতা যখন ঠিক অন্য flat টায় গিয়ে থামবে, সেখানে থামুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: Fahim's buttons are
//      about 1.41 long. Shrink both to 1 (the unit ring, 3.6) and the card
//      (2.5, 0.5) becomes (3.54, 0.71).

const SO_F = makeFrame(-0.4, 1.7, -1.6, 1.6, 44, 10);

export function ShrinkToOne() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const [len] = useTween([k >= 1 ? 1 / R2 : 1], 1200);
  const SAY = [
    "ফাহিমের button গুলা দুই room এর ধাপ, প্রতিটা প্রায় 1.41 লম্বা.",
    "প্রতিটাকে 1.41 দিয়ে ভাগ করুন: দুইটাই গিয়ে বসে 1 length এর গোল দাগে.",
    "ধাপ ছোট, তাই ধাপ লাগে বেশি: flat (3, 2) এর card হয়ে যায় (3.54, 0.71).",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[15rem] items-center justify-center gap-3">
        <div className="w-[6rem] shrink-0">
          <Plane f={SO_F} label="the size and imbalance buttons shrinking to length 1" className="my-0! max-w-none">
            <circle cx={SO_F.sx(0)} cy={SO_F.sy(0)} r={SO_F.u} fill="none" strokeWidth={1.2} strokeDasharray="3 3" className="stroke-[#5a6b7d]" />
            <Arrow f={SO_F} from={O} to={[len, len]} tone="blue" w={2.4} />
            <Arrow f={SO_F} from={O} to={[len, -len]} tone="coral" w={2.4} />
            <text x={SO_F.sx(len) + 4} y={SO_F.sy(len) - 4} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" className="fill-cat-blue">
              {k >= 1 ? "1" : "1.41"}
            </text>
          </Plane>
        </div>
        <span key={k >= 2 ? "b" : "a"} className={`${POP} inline-block rounded-lg border-2 border-cat-violet px-1.5 py-0.5 font-mono text-sm font-bold whitespace-nowrap text-cat-violet`}>
          {k >= 2 ? "(3.54, 0.71)" : "(2.5, 0.5)"}
        </span>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: Nasib isn't done. He
//      turns the khata's page in his hands: a grid can be turned any way,
//      and then every number changes.

export function NasibTurns({}: Story) {
  const s = useScene(2, [700, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="Nasib turns the khata's page: a grid can be turned any way you like">
        <RoofSet lit />
        <CastPerson who="fahim" x={124} y={GROUND} facing={1} />
        <NameTag x={124} y={GROUND + 13} name="ফাহিম" />
        <CastPerson who="nasib" x={220} y={GROUND} facing={-1} arm="hold" mood={k >= 1 ? "smug" : "plain"} />
        <NameTag x={220} y={GROUND + 13} name="নাসিব" />
        <g
          style={{ transform: `rotate(${k >= 2 ? -35 : 0}deg)`, transformOrigin: "182px 104px" }}
          className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
        >
          <rect x={168} y={90} width={28} height={28} fill="white" stroke="#b91c1c" strokeWidth={1} />
          <path d="M175 90V118M182 90V118M189 90V118M168 97H196M168 104H196M168 111H196" stroke="#94a3b8" strokeWidth={0.6} />
        </g>
        {k === 1 && <Bubble x={220} y={GROUND - 68} side="left" lines={["ঠিক আছে, 1 লম্বা."]} />}
        {k >= 2 && <Bubble x={220} y={GROUND - 68} side="left" lines={["কিন্তু grid তো", "যেদিকে খুশি ঘুরে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · 2.3's word map, and a square grid turned under it. The reader turns it
//     15° at a time: every slot number glides, the king–queen distance and
//     the cosine of man→king with woman→queen never move.

const SG_F = makeFrame(-4, 4, -3.4, 3.4, 26, 10);
const WORDS: { w: string; at: XY }[] = [
  { w: "man", at: [-2.9, -2.1] },
  { w: "woman", at: [1.1, -2.5] },
  { w: "king", at: [-1.9, 2.4] },
  { w: "queen", at: [2.4, 2.3] },
];
const W = (w: string) => WORDS.find((x) => x.w === w)!.at;
const d2 = (p: XY, q: XY) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const cosOf = (u: XY, v: XY) => (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
const KQ = d2(W("king"), W("queen"));
const MK: XY = [W("king")[0] - W("man")[0], W("king")[1] - W("man")[1]];
const WQ: XY = [W("queen")[0] - W("woman")[0], W("queen")[1] - W("woman")[1]];
const COS = cosOf(MK, WQ);
/** a word's slot numbers on a grid turned by `deg` */
const slots = (p: XY, deg: number): XY => {
  const a = (deg * Math.PI) / 180;
  return [p[0] * Math.cos(a) + p[1] * Math.sin(a), -p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};
const f1 = (n: number) => sg(Math.round(n * 10) / 10);
const pair1 = (v: XY) => `(${f1(v[0])}, ${f1(v[1])})`;

/**
 * A square grid turned by `deg` about the centre, clipped to the sheet, with
 * its two axes named near the middle (the words sit far out, so they never
 * clash). `spin` turns it further with a CSS transition, for a watch-only figure.
 */
function TurnedGrid({ f, deg, name, spin = 0 }: { f: Frame; deg: number; name: string; spin?: number }) {
  const a = (deg * Math.PI) / 180;
  const e1: XY = [Math.cos(a), Math.sin(a)];
  const e2: XY = [-Math.sin(a), Math.cos(a)];
  const at = (i: number, j: number) => `${f.sx(i * e1[0] + j * e2[0])} ${f.sy(i * e1[1] + j * e2[1])}`;
  let d = "";
  for (let i = -6; i <= 6; i++) d += `M${at(i, -7)}L${at(i, 7)}M${at(-7, i)}L${at(7, i)}`;
  const turning = {
    style: { transform: `rotate(${-spin}deg)`, transformOrigin: `${f.sx(0)}px ${f.sy(0)}px` },
    className: "transition-transform duration-1000 ease-in-out motion-reduce:transition-none",
  };
  return (
    <>
      <Clipped f={f} name={name}>
        <g {...turning}>
          <path d={d} strokeWidth={0.6} className="pointer-events-none fill-none stroke-cat-blue/30" />
          <path d={`M${at(-7, 0)}L${at(7, 0)}M${at(0, -7)}L${at(0, 7)}`} strokeWidth={1.3} className="pointer-events-none fill-none stroke-[#0f1b2d]/50" />
        </g>
      </Clipped>
      <g {...turning}>
        <text x={f.sx(1.5 * e1[0] + 0.3 * e2[0])} y={f.sy(1.5 * e1[1] + 0.3 * e2[1])} textAnchor="middle" fontSize={7.5} fontWeight={700} className="pointer-events-none fill-[#5a6b7d]">
          slot 1
        </text>
        <text x={f.sx(1.5 * e2[0] - 0.35 * e1[0])} y={f.sy(1.5 * e2[1] - 0.35 * e1[1])} textAnchor="middle" fontSize={7.5} fontWeight={700} className="pointer-events-none fill-[#5a6b7d]">
          slot 2
        </text>
      </g>
    </>
  );
}

function WordDots({ f }: { f: Frame }) {
  return (
    <>
      {WORDS.map((wd) => (
        <g key={wd.w} className="pointer-events-none">
          <circle cx={f.sx(wd.at[0])} cy={f.sy(wd.at[1])} r={4} className="fill-cat-violet" />
          <text x={f.sx(wd.at[0])} y={f.sy(wd.at[1]) - 7} textAnchor="middle" fontSize={10} fontWeight={700} className="fill-[#0f1b2d]">
            {wd.w}
          </text>
        </g>
      ))}
    </>
  );
}

export function SpinTheGrid() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 0);
  const [seen, setSeen] = useSeed<number[]>("seen", [0]);
  const [now] = useTween([deg], 700);
  const enough = seen.length >= 4;

  const spin = (d: number) => {
    const next = clamp(deg + d, -90, 90);
    setDeg(next);
    if (seen.includes(next)) return;
    const all = [...seen, next];
    setSeen(all);
    if (all.length === 4) pass("নতুন grid, নতুন সংখ্যা, দূরত্ব একই.");
  };

  return (
    <>
      <Plane f={SG_F} grid={0} axes={false} label="2.3's word map with a square grid turned under it" className="my-0! max-w-[13rem]">
        <TurnedGrid f={SG_F} deg={now} name="sg" />
        <WordDots f={SG_F} />
      </Plane>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button type="button" onClick={() => spin(-15)} disabled={deg <= -90} className={`${pill(false)} font-sans`}>
          −15° ঘুরান
        </button>
        <span className="w-12 text-center font-mono text-sm tabular-nums">{sg(deg)}°</span>
        <button type="button" onClick={() => spin(15)} disabled={deg >= 90} className={`${pill(false)} font-sans`}>
          +15° ঘুরান
        </button>
      </div>
      <div className="mx-auto mt-2 grid max-w-[19rem] grid-cols-2 gap-1.5 text-[0.8rem]">
        <div className="rounded-xl border border-cat-coral/40 bg-cat-coral/5 px-2 py-1">
          <div className="text-xs text-muted">king এর সংখ্যা</div>
          <b className="font-mono tabular-nums">{pair1(slots(W("king"), now))}</b>
        </div>
        <div className="rounded-xl border border-cat-coral/40 bg-cat-coral/5 px-2 py-1">
          <div className="text-xs text-muted">queen এর সংখ্যা</div>
          <b className="font-mono tabular-nums">{pair1(slots(W("queen"), now))}</b>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent/5 px-2 py-1">
          <div className="text-xs text-muted">king থেকে queen</div>
          <b className="font-mono">{KQ.toFixed(2)}</b>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent/5 px-2 py-1">
          <div className="text-xs leading-tight text-muted">cosine, man→king আর woman→queen</div>
          <b className="font-mono">{COS.toFixed(2)}</b>
        </div>
      </div>
      <Task done={enough}>Grid টা তিনবার ঘুরান. দেখুন কোন সংখ্যা নড়ে, আর কোনটা কখনো নড়ে না.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the man→king and
//      woman→queen arrows on the map. The grid turns, every slot number
//      changes, and the two arrows still match: 2.3's sum survives.

const SA_ANG = [20, 20, 20, -40];

export function SameArrows() {
  const s = useScene(3, [700, 2200, 2200]);
  const k = s.k;
  const deg = SA_ANG[k];
  const SAY = [
    `Model ঘটনাচক্রে যে grid এ গিয়ে পড়েছে, সেটা. King এর সংখ্যা ${pair1(slots(W("king"), 20))}.`,
    "man থেকে king আর woman থেকে queen এর arrow: একই shape.",
    "এবার grid টা ঘুরাই. প্রতিটা slot এর সংখ্যা বদলে যায়.",
    `King এর সংখ্যা এখন ${pair1(slots(W("king"), -40))}. Arrow দুইটা তবুও মিলে: king − man + woman এখনো queen এ গিয়ে পড়ে.`,
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <Plane f={SG_F} grid={0} axes={false} label="the grid turns under the word map; the two arrows stay the same" className="my-0! max-w-[11.5rem]">
        <TurnedGrid f={SG_F} deg={20} spin={deg - 20} name="sa" />
        {k >= 1 && <Arrow f={SG_F} from={W("man")} to={W("king")} tone="teal" w={2.2} draw />}
        {k >= 1 && <Arrow f={SG_F} from={W("woman")} to={W("queen")} tone="teal" w={2.2} draw delay={300} />}
        <WordDots f={SG_F} />
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4½b · A second figure for screen 4's explanation, no task: 2.3's old debt.
//       king and queen as 2.3's lists of 300 slots, drawn as bars (a few of
//       them, with "…"). Slot 137 lights up with a "?". Turn the grid: every
//       bar changes. The gap between the two words stays. The bar heights are
//       only a picture; no number is said.

const X4_SLOTS = [1, 2, 3, 0, 136, 137, 138, 0, 300];
/** a bar's height, from −1 to 1, for word `w` on the grid turned by `turn` (0 or 1): made up, only a picture */
const x4Bar = (w: number, slot: number, turn: number) => Math.sin(slot * 1.7 + w * 2.3 + turn * 2.1) * 0.8 + Math.cos(slot * 0.6 + turn) * 0.2;

function X4_Row({ y, name, w, turn, lit }: { y: number; name: string; w: number; turn: number; lit: boolean }) {
  return (
    <g className="pointer-events-none">
      <text x={4} y={y + 4} fontSize={10} fontWeight={700} className="fill-[#0f1b2d]">
        {name}
      </text>
      <path d={`M44 ${y}H236`} strokeWidth={0.6} className="stroke-[#94a3b8]" />
      {X4_SLOTS.map((slot, i) => {
        const x = 50 + i * 22;
        if (slot === 0)
          return (
            <text key={i} x={x + 4} y={y + 3} textAnchor="middle" fontSize={10} className="fill-[#5a6b7d]">
              …
            </text>
          );
        const h = x4Bar(w, slot, turn) * 16;
        const hot = lit && slot === 137;
        return (
          <rect
            key={i}
            x={x}
            y={h >= 0 ? y - h : y}
            width={9}
            height={Math.abs(h)}
            rx={1}
            className={`transition-[y,height] duration-700 ease-in-out motion-reduce:transition-none ${hot ? "fill-[#b45309]" : "fill-cat-violet/70"}`}
          />
        );
      })}
    </g>
  );
}

export function Slot137() {
  const s = useScene(3, [700, 2200, 2200]);
  const k = s.k;
  const turn = k >= 2 ? 1 : 0;
  const SAY = [
    "2.3 এর king আর queen: প্রতিটা 300 টা slot এর list.",
    "Slot 137 মানে কী? কেউ জানে না.",
    "Grid টা একটু ঘুরাই. প্রতিটা slot এর সংখ্যা বদলে গেলো.",
    "কিন্তু king থেকে queen এর দূরত্ব একই থাকলো. সংখ্যা গুলা grid এর. দূরত্ব গুলা আসল.",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <svg viewBox="0 0 250 104" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="king and queen as lists of slots; slot 137 has no meaning; turning the grid changes every slot but not the distance">
        <rect x={0.5} y={0.5} width={249} height={103} rx={8} fill="white" stroke="#cbd5e1" />
        {X4_SLOTS.map((slot, i) =>
          slot === 0 ? null : (
            <text key={i} x={54.5 + i * 22} y={98} textAnchor="middle" fontSize={7.5} fontFamily="ui-monospace, monospace" className={slot === 137 && k >= 1 ? "fill-[#b45309] font-bold" : "fill-[#5a6b7d]"}>
              {slot}
            </text>
          ),
        )}
        <X4_Row y={30} name="king" w={0} turn={turn} lit={k >= 1} />
        <X4_Row y={70} name="queen" w={1} turn={turn} lit={k >= 1} />
        {k >= 1 && (
          <text key="q" x={164.5} y={12} textAnchor="middle" fontSize={11} fontWeight={800} className={`${POP} fill-[#b45309]`}>
            ?
          </text>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <path d="M242 30V70M238 30H246M238 70H246" strokeWidth={1.6} className="stroke-[#16a34a]" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · Of all the fair grids, which one? A line through the khata's middle,
//     turned 5° at a time. Each flat drops to the line (the dashed drop is
//     its second number, the one you'd throw away). The readout adds up the
//     drops' squares: what keeping one number would lose. Least at 35°.

const BT_C: XY = [23 / 8, 2];
const lossAt = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return FLATS.reduce((sum, fl) => {
    const dz = -Math.sin(a) * (fl.bed - BT_C[0]) + Math.cos(a) * (fl.bath - BT_C[1]);
    return sum + dz * dz;
  }, 0);
};
const BT_BEST = 35;
const BT_MAX = lossAt(0);

/** the line through the khata's middle at `deg`, and each flat's drop to it */
function DropLine({ f, deg, drops = true, tone = "stroke-cat-teal", dashed = false }: { f: Frame; deg: number; drops?: boolean; tone?: string; dashed?: boolean }) {
  const a = (deg * Math.PI) / 180;
  const e: XY = [Math.cos(a), Math.sin(a)];
  const p = (t: number) => `${f.sx(BT_C[0] + t * e[0])} ${f.sy(BT_C[1] + t * e[1])}`;
  return (
    <g className="pointer-events-none">
      <Clipped f={f} name={`dl${Math.round(deg)}`}>
        <path d={`M${p(-8)}L${p(8)}`} strokeWidth={2} strokeDasharray={dashed ? "6 4" : undefined} className={tone} />
      </Clipped>
      {drops &&
        FLATS.map((fl, i) => {
          const t = (fl.bed - BT_C[0]) * e[0] + (fl.bath - BT_C[1]) * e[1];
          const foot: XY = [BT_C[0] + t * e[0], BT_C[1] + t * e[1]];
          return <path key={i} d={`M${f.sx(fl.bed)} ${f.sy(fl.bath)}L${f.sx(foot[0])} ${f.sy(foot[1])}`} strokeWidth={1.4} strokeDasharray="3 2" className="stroke-[#dc2626]/70" />;
        })}
    </g>
  );
}

export function BestTurn() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 0);
  const [found, setFound] = useSeed("found", false);
  const [now] = useTween([deg], 500);
  const loss = lossAt(deg);

  const turn = (d: number) => {
    const next = clamp(deg + d, 0, 90);
    setDeg(next);
    if (next === BT_BEST && !found) {
      setFound(true);
      pass("প্রায় 35°: এখানে হারায় সবচেয়ে কম.");
    }
  };

  return (
    <>
      <Plane f={KF} ticks={1} label="the 8 flats, a line through their middle, and each flat's drop to the line" className="my-0! max-w-[16rem]">
        <BedBath f={KF} />
        <DropLine f={KF} deg={now} />
        {FLATS.map((fl, i) => (
          <FlatDot key={i} f={KF} at={[fl.bed, fl.bath]} rent={null} r={5} />
        ))}
      </Plane>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button type="button" onClick={() => turn(-5)} disabled={deg <= 0} className={`${pill(false)} font-sans`}>
          −5°
        </button>
        <span className="w-12 text-center font-mono text-sm tabular-nums">{deg}°</span>
        <button type="button" onClick={() => turn(5)} disabled={deg >= 90} className={`${pill(false)} font-sans`}>
          +5°
        </button>
      </div>
      <div className="mx-auto mt-2 grid max-w-[18rem] grid-cols-[4.5rem_1fr_2.6rem] items-center gap-2 text-[0.8rem]">
        <span className="text-muted">হারানো</span>
        <span className="relative h-3 overflow-hidden rounded-full bg-foreground/10">
          <span
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 motion-reduce:transition-none ${deg === BT_BEST ? "bg-accent" : "bg-danger/70"}`}
            style={{ width: `${Math.min(100, (loss / BT_MAX) * 100)}%` }}
          />
        </span>
        <b className="text-right font-mono">{loss.toFixed(2)}</b>
      </div>
      <div className="mx-auto mt-1 max-w-sm text-center text-[0.8rem] leading-snug text-muted">
        {found ? (
          <span className={`${FADE} text-accent-text`}>35° এর আগে বা পরে, দুই দিকেই হারানো আবার বাড়ে.</span>
        ) : (
          "লাল drop গুলাই প্রতিটা flat এর দ্বিতীয় সংখ্যা. প্রতিটা drop এর বর্গ, সব যোগ করে: এটাই হারানো."
        )}
      </div>
      <Task done={found}>Line টা ঘুরিয়ে এমন জায়গায় আনুন, যেখানে হারানো সবচেয়ে কম.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the machine's line at
//      35°, then Fahim's size line at 45° through the same middle. Close, not
//      the same: one looked at the rent, the other only at the flats.

export function MachineVsFahim() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const SAY = [
    "Machine এর line: প্রায় 35°. Flat গুলা এইদিকেই সবচেয়ে বেশি ছড়ানো.",
    "ফাহিমের size এর line: 45°.",
    "কাছাকাছি, কিন্তু এক না. ফাহিম দেখেছিল ভাড়া. Machine দেখেছে শুধু flat গুলা কোনদিকে ছড়ানো.",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <Plane f={KF} ticks={1} label="the machine's line at 35 degrees and Fahim's size line at 45 degrees, through the khata's middle" className="my-0! max-w-[13rem]">
        <BedBath f={KF} />
        <DropLine f={KF} deg={BT_BEST} drops={false} tone="stroke-cat-teal" />
        {k >= 1 && (
          <g className={FADE}>
            <DropLine f={KF} deg={45} drops={false} tone="stroke-cat-violet" dashed />
          </g>
        )}
        {FLATS.map((fl, i) => (
          <FlatDot key={i} f={KF} at={[fl.bed, fl.bath]} rent={null} r={4.5} />
        ))}
        <text x={KF.sx(5.5)} y={KF.sy(3.1)} textAnchor="end" fontSize={9} fontWeight={700} className="fill-cat-teal">
          35°
        </text>
        {k >= 1 && (
          <text x={KF.sx(4.2)} y={KF.sy(3.45)} textAnchor="end" fontSize={9} fontWeight={700} className={`${FADE} fill-cat-violet`}>
            45°
          </text>
        )}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5½b · A second figure for screen 5's explanation, no task: the callback to
//       Fahim's idea at the river ghat (4.6, bentriver-journey's KeepShadows:
//       the same twelve points, copied here). Left, those points drop onto
//       their spread's line. Right, the khata's flats drop onto the 35° line.
//       Same move twice: keep the shadow, throw the rest away.

const X5_DIR: XY = [2 / Math.sqrt(5), 1 / Math.sqrt(5)];
const X5_NRM: XY = [-1 / Math.sqrt(5), 2 / Math.sqrt(5)];
const X5_TS = [-4, -3.2, -2.5, -1.6, -0.9, -0.3, 0.4, 1.1, 1.8, 2.6, 3.3, 4.1];
const X5_ES = [0.3, -0.2, 0.4, -0.35, 0.1, -0.25, 0.3, -0.1, 0.35, -0.3, 0.2, -0.15];
const X5_CLOUD: XY[] = X5_TS.map((t, i) => [t * X5_DIR[0] + X5_ES[i] * X5_NRM[0], t * X5_DIR[1] + X5_ES[i] * X5_NRM[1]]);
const X5_RF = makeFrame(-4.5, 4.5, -3, 3, 11, 4);
const X5_KF = makeFrame(0.4, 5.4, 0.4, 3.6, 18, 4);
const X5_A = (BT_BEST * Math.PI) / 180;
const X5_E: XY = [Math.cos(X5_A), Math.sin(X5_A)];

/** p slid t of the way to its foot on the line through c along e */
const x5Slide = (p: XY, c: XY, e: XY, t: number): XY => {
  const s = (p[0] - c[0]) * e[0] + (p[1] - c[1]) * e[1];
  const foot: XY = [c[0] + s * e[0], c[1] + s * e[1]];
  return [p[0] + (foot[0] - p[0]) * t, p[1] + (foot[1] - p[1]) * t];
};

export function RiverIdeaAgain() {
  const s = useScene(3, [700, 2200, 2200]);
  const k = s.k;
  const [tl, tr] = useTween([k >= 1 ? 1 : 0, k >= 2 ? 1 : 0], 1000);
  const SAY = [
    "বামে 4.6 এর নদীর ঘাট: ফাহিমের বারোটা point. ডানে আজকের খাতা.",
    "ঘাটে ফাহিমের idea: সবার shadow ছড়ানোর line এ. প্রতিটা point এ থাকলো একটা number.",
    "আজ machine ঠিক ওইটাই করলো: 35° এর line এ shadow, বাকিটা ফেলে দেয়া.",
    "একই কাজ, দুই জায়গায়. এটাই PCA.",
  ];
  const ln = (f: Frame, c: XY, e: XY, a: number) => `M${f.sx(c[0] - a * e[0])} ${f.sy(c[1] - a * e[1])}L${f.sx(c[0] + a * e[0])} ${f.sy(c[1] + a * e[1])}`;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex w-full max-w-[16rem] items-end justify-center gap-2">
        <div className="min-w-0 flex-1 text-center">
          <Plane f={X5_RF} grid={0} axes={false} label="Fahim's twelve points at the river ghat, dropping onto their spread's line" className="my-0! max-w-none">
            <path d={ln(X5_RF, O, X5_DIR, 4.6)} strokeWidth={1.2} strokeDasharray="4 3" className="stroke-cat-teal" />
            {X5_CLOUD.map((p, i) => {
              const q = x5Slide(p, O, X5_DIR, tl);
              return <circle key={i} cx={X5_RF.sx(q[0])} cy={X5_RF.sy(q[1])} r={2.4} className="fill-cat-blue" />;
            })}
          </Plane>
          <div className="mt-0.5 text-[0.7rem] text-muted">4.6, নদীর ঘাট</div>
        </div>
        <div className="min-w-0 flex-1 text-center">
          <Plane f={X5_KF} grid={1} axes={false} label="the khata's flats dropping onto the 35 degree line" className="my-0! max-w-none">
            <Clipped f={X5_KF} name="x5">
              <path d={ln(X5_KF, BT_C, X5_E, 5)} strokeWidth={1.2} strokeDasharray="4 3" className="stroke-cat-teal" />
            </Clipped>
            {FLATS.map((fl, i) => {
              const q = x5Slide([fl.bed, fl.bath], BT_C, X5_E, tr);
              return <circle key={i} cx={X5_KF.sx(q[0])} cy={X5_KF.sy(q[1])} r={3} className="fill-[#b45309]" />;
            })}
          </Plane>
          <div className="mt-0.5 text-[0.7rem] text-muted">আজ, চাচার খাতা</div>
        </div>
      </div>
      {k >= 3 ? <div className={`${POP} mt-1 text-center text-sm font-bold text-cat-teal`}>PCA</div> : <div className="mt-1 h-5" aria-hidden="true" />}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · Try it: which grid's cards tell the truth? Three grids drawn as small
//     pictures: Fahim's (square, steps 1.41 long), a fair one turned 30°
//     (square, steps 1 long), and 5.5's rickshaw roads (a lane on a slant).
//     A pick draws that grid under the two flats and runs Pythagoras on its
//     cards as a bar beside the tape: 1.41 short, 2 exact, 2.83 long.

const C30 = Math.cos(Math.PI / 6);
const S30 = Math.sin(Math.PI / 6);
const TG: { name: string; e1: XY; e2: XY; nope: string }[] = [
  { name: "ফাহিমের grid", e1: [1, 1], e2: [1, -1], nope: "এই grid এ হিসাব বলে 1.41, ফিতা বলে 2. ঘর গুলা square ঠিকই. কিন্তু ধাপ? 1.41 লম্বা." },
  { name: "30° ঘুরানো, ধাপ 1", e1: [C30, S30], e2: [-S30, C30], nope: "" },
  { name: "রিকশার রাস্তা", e1: [1, 0], e2: [1, 1], nope: "এই grid এ হিসাব বলে 2.83, ফিতা বলে 2. রাস্তা দুইটা right angle এ না." },
];
const TG_RIGHT = 1;
const TG_F = makeFrame(-0.8, 0.8, -0.8, 0.8, 30, 4);

export function TryFairGrid() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const right = pick === TG_RIGHT;

  const choose = (i: number) => {
    if (right) return;
    setPick(i);
    if (i === TG_RIGHT) pass("Square আর 1 লম্বা: তবেই হিসাব সত্যি.");
    else setMiss((m) => m + 1);
  };
  const g = pick === null ? null : TG[pick];
  const sum = g ? cardSum(g.e1, g.e2) : 0;

  return (
    <>
      <Plane f={NT_F} ticks={1} label="the two flats with the picked grid under them, and Pythagoras on its cards as a bar beside the tape" className="my-0! max-w-[13rem]">
        {g && (
          <g key={`g${pick}`} className={FADE}>
            <Clipped f={NT_F} name="tg">
              <BasisLines f={NT_F} e1={g.e1} e2={g.e2} n={10} className="stroke-cat-violet/45" />
            </Clipped>
          </g>
        )}
        <UpBar f={NT_F} from={FA} len={2} tone="tape" dx={-14} label="2" draw={false} />
        {g && <UpBar key={`b${pick}${miss}`} f={NT_F} from={FA} len={sum} tone={right ? "good" : "bad"} dx={14} label={two(sum)} />}
        <FlatDot f={NT_F} at={FA} rent={RENT_A} r={9} />
        <FlatDot f={NT_F} at={FB} rent={RENT_B} r={9} />
      </Plane>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {TG.map((t, i) => (
          <Choice key={t.name} n={i} look={pick === i ? (i === TG_RIGHT ? "right" : "wrong") : right ? "dim" : "idle"} disabled={right} onClick={() => choose(i)}>
            <span className="grid justify-items-center gap-0.5">
              <svg viewBox="0 0 56 56" className="h-auto w-12" aria-hidden="true">
                <rect x={1} y={1} width={54} height={54} rx={4} fill="white" stroke="#cbd5e1" />
                <Clipped f={TG_F} name={`tc${i}`}>
                  <BasisLines f={TG_F} e1={[t.e1[0] * 0.45, t.e1[1] * 0.45]} e2={[t.e2[0] * 0.45, t.e2[1] * 0.45]} n={6} className="stroke-cat-violet/60" />
                </Clipped>
              </svg>
              <span className="text-[0.7rem] leading-tight">{t.name}</span>
            </span>
          </Choice>
        ))}
      </div>
      {pick !== null && !right ? <Nope key={miss}>{TG[pick].nope}</Nope> : null}
      {right ? <div className={`${FADE} mt-1.5 text-center text-[0.85rem] font-medium text-accent-text`}>হিসাব বলে 2, ফিতাও বলে 2.</div> : null}
      <Task done={right}>কোন grid এর card থেকে Pythagoras ঠিক দূরত্ব, মানে 2 দেয়? সেই grid এ tap করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task (kept after the exercise
//      so it can share TG): Nasib's last try. He turns the khata over and
//      draws three grids on the back, one per beat: Fahim's, one turned 30°
//      with steps of 1, and 5.5's rickshaw roads. Which one tells the truth
//      is left to the exercise.

export function ThreeGridsDrawn({}: Story) {
  const s = useScene(3, [700, 1600, 1600, 1600]);
  const k = s.k;
  const PX = [150, 196, 242];
  const PY = 58;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="Nasib draws three grids on the back of the khata: Fahim's, one turned 30 degrees with steps of 1, and the rickshaw roads">
        <RoofSet lit />
        <CastPerson who="fahim" x={104} y={GROUND} facing={1} />
        <NameTag x={104} y={GROUND + 13} name="ফাহিম" />
        <CastPerson who="nasib" x={272} y={GROUND} facing={-1} arm={k >= 1 ? "point" : "hold"} />
        <NameTag x={272} y={GROUND + 13} name="নাসিব" />
        {/* the back of the khata, held up big */}
        <rect x={124} y={28} width={144} height={62} rx={3} fill="white" stroke="#b91c1c" strokeWidth={1.4} />
        {TG.map((t, i) =>
          k > i ? (
            <g key={t.name} className={POP}>
              <svg x={PX[i] - 20} y={PY - 24} width={40} height={40} viewBox="0 0 56 56" overflow="hidden">
                <Clipped f={TG_F} name={`s6${i}`}>
                  <BasisLines f={TG_F} e1={[t.e1[0] * 0.45, t.e1[1] * 0.45]} e2={[t.e2[0] * 0.45, t.e2[1] * 0.45]} n={6} className="stroke-cat-violet" />
                </Clipped>
              </svg>
              <rect x={PX[i] - 20} y={PY - 24} width={40} height={40} fill="none" stroke="#cbd5e1" strokeWidth={0.6} />
              <text x={PX[i]} y={PY + 27} textAnchor="middle" fontSize={7} fontWeight={700} fill="#0f1b2d">
                {["ফাহিমের", "30°, ধাপ 1", "রিকশার রাস্তা"][i]}
              </text>
            </g>
          ) : null,
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for the exercise's explanation, no task: the two checks a
//      grid has to pass, on the 30° grid. The box of its two buttons: 0, a
//      right angle. The ring of length 1: both tips sit on it.

const TK_F = makeFrame(-1.25, 1.25, -1.15, 1.25, 40, 8);

export function TwoChecks() {
  const s = useScene(3, [700, 2200, 2000]);
  const k = s.k;
  const b1: XY = [C30, S30];
  const b2: XY = [-S30, C30];
  const SAY = [
    "30° ঘুরানো grid এর দুইটা button: (0.87, 0.5) আর (−0.5, 0.87).",
    "Box: 0.87 × (−0.5) + 0.5 × 0.87 = 0. তাই right angle.",
    "1 length এর গোল দাগ: দুইটা button এর মাথাই ঠিক ওটার উপরে.",
    "দুইটা check ই পাশ: orthonormal. এমন grid এর card এ হিসাব সবসময় ফিতার সাথে মিলে.",
  ];
  const p = (v: XY, t: number) => `${TK_F.sx(v[0] * t)} ${TK_F.sy(v[1] * t)}`;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto w-full max-w-[10rem]">
        <Plane f={TK_F} label="the 30 degree grid's two buttons: at a right angle, each 1 long" className="my-0! max-w-none">
          {k >= 2 && <circle cx={TK_F.sx(0)} cy={TK_F.sy(0)} r={TK_F.u} fill="none" strokeWidth={1.4} strokeDasharray="3 3" className={`${FADE} stroke-[#16a34a]`} />}
          <Arrow f={TK_F} from={O} to={b1} tone="blue" w={2.6} />
          <Arrow f={TK_F} from={O} to={b2} tone="coral" w={2.6} />
          {k >= 1 && <path d={`M${p(b1, 0.2)}L${TK_F.sx(0.2 * (b1[0] + b2[0]))} ${TK_F.sy(0.2 * (b1[1] + b2[1]))}L${p(b2, 0.2)}`} fill="none" strokeWidth={1.6} className={`${POP} stroke-[#0f1b2d]`} />}
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for the finale's setup, no task: the last piece of
//      jilapi. Nasib gives in on the distance; Fahim asks the next question:
//      what if the whole grid were picked up and moved?

export function LastJilapi({}: Story) {
  const s = useScene(2, [700, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="Nasib eats the last jilapi and agrees the distance is real; Fahim wonders about moving the whole grid">
        <RoofSet lit />
        <CastPerson who="fahim" x={130} y={GROUND} facing={1} mood={k >= 2 ? "puzzled" : "happy"} arm={k >= 2 ? "point" : "down"} />
        <NameTag x={130} y={GROUND + 13} name="ফাহিম" />
        <CastPerson who="nasib" x={226} y={GROUND} facing={-1} arm="hold" mood={k >= 1 ? "happy" : "plain"} />
        <NameTag x={226} y={GROUND + 13} name="নাসিব" />
        {k === 0 && <Jilapi x={212} y={GROUND - 28} s={0.8} half />}
        {k >= 1 && <path d="M205 112L212 126L219 112Z" fill="#fef3c7" stroke="#a16207" strokeWidth={0.8} className={POP} />}
        {k === 1 && <Bubble x={226} y={GROUND - 68} side="left" lines={["ঠিক আছে.", "দূরত্ব আসল."]} />}
        {k >= 2 && <Bubble x={130} y={GROUND - 68} side="right" lines={["পুরা grid টাই যদি", "তুলে নড়াই?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · The finale. Open the sealed bet: three tapes, all 2 — the distance
//     never moved, only the sum on stretched steps lied. Then the five things
//     Article 5 carries forward, one card per tap.

const OPENED = [
  ["খাতার grid", "2"],
  ["ফাহিমের grid, button 1 লম্বা করার পর", "2"],
  ["যেকোনো দিকে ঘুরানো fair grid", "2"],
];
const FIVE = [
  ["Span", "মানে নাগাল. আপনার button গুলা দিয়ে যেখানে যেখানে যাওয়া যায়, সবটা. ওখানে 0 সবসময় থাকে, আর ওটা আপনার ধারণার চেয়ে ছোটও হতে পারে."],
  ["Independent", "কোনো button বাড়তি না. 0 তে ফেরার একটাই উপায়: কোনো button ই না চাপা."],
  ["Basis", "সব জায়গায় যাওয়ার মতো যথেষ্ট button, একটাও বাড়তি না. প্রতিটা basis এ button এর সংখ্যা একই: ওটাই dimension."],
  ["Coordinates", "সংখ্যা গুলা basis এর, arrow এর না. স্কুল ছিল (2, 3), আবার (−1, 3)."],
  ["ভালো basis", "Data কে কথা বলায়. (3, 2) হলো (2.5, 0.5). ভাড়া বলতে লাগলো একটা সংখ্যা. Fair grid এ দূরত্বও ঠিক থাকে."],
];

/** the three rows' grids: the khata's, Fahim's with its buttons made 1 long, and one turned 30° */
const BO_GRID: [XY, XY][] = [
  [[1, 0], [0, 1]],
  [[1 / R2, 1 / R2], [1 / R2, -1 / R2]],
  [[Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)], [-Math.sin(Math.PI / 6), Math.cos(Math.PI / 6)]],
];

export function BetOpened() {
  const pass = useGate();
  const [open, setOpen] = useSeed("open", false);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [at, setAt] = useSeed<number | null>("at", null);
  const p = usePlay(800);
  const shown = open ? (p.running ? p.k : 4) : 0;
  const row = Math.min(shown, 3) - 1;

  const read = (i: number) => {
    setAt(i);
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.length === 5) pass("Slot এর সংখ্যা grid এর. দূরত্ব আসল.");
  };
  const unseal = () => {
    setOpen(true);
    p.play(4);
  };

  return (
    <>
      {!open ? (
        <div className="flex justify-center">
          <button type="button" onClick={unseal} className={primaryBtn}>
            সিল করা বাজি খুলুন
          </button>
        </div>
      ) : (
        <div className="mx-auto flex max-w-sm items-center gap-2">
        {/* the row just opened, on its own grid: the tape between the two flats draws again, 2 every time */}
        <div className="w-[5.5rem] shrink-0">
          <Plane f={BF} grid={0} axes={false} label="the two flats on the grid of the row just opened, with the tape of 2 between them" className="my-0! max-w-none">
            {row >= 0 && (
              <g key={`og${row}`} className={FADE}>
                <Clipped f={BF} name="og">
                  <BasisLines f={BF} e1={BO_GRID[row][0]} e2={BO_GRID[row][1]} n={10} className="stroke-cat-violet/45" />
                </Clipped>
              </g>
            )}
            {row >= 0 && <UpBar key={`ot${row}`} f={BF} from={FA} len={2} tone="good" dx={14} label="2" />}
            <FlatDot f={BF} at={FA} rent={RENT_A} r={9} />
            <FlatDot f={BF} at={FB} rent={RENT_B} r={9} />
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          {OPENED.slice(0, Math.min(shown, 3)).map(([where, d]) => (
            <div key={where} className={`${FADE} flex items-center justify-between gap-2 rounded-lg border border-accent/40 bg-accent/5 px-2.5 py-0.5 text-[0.8rem]`}>
              <span>
                <Tick /> {where}
              </span>
              <b className="whitespace-nowrap">ফিতা <span className="font-mono">{d}</span></b>
            </div>
          ))}
          {shown >= 4 ? (
            <div className={`${FADE} mt-0.5 text-center text-[0.85rem] leading-snug font-semibold`}>
              উত্তর: 2 ই থাকে. 1.41 বলেছিল লম্বা ধাপের হিসাব, flat না.
            </div>
          ) : null}
        </div>
        </div>
      )}
      {shown >= 4 ? (
        <div className={FADE}>
          <div className="mt-3 text-center text-xs text-muted">Article 5 থেকে সাথে নেয়ার পাঁচটা জিনিস. প্রতিটায় tap করুন.</div>
          <div className="mt-1 flex justify-center gap-1.5">
            {FIVE.map(([name], i) => (
              <button key={name} type="button" onClick={() => read(i)} className={`${pill(at === i)} size-9 px-0! ${seen.includes(i) && at !== i ? "border-accent/60 text-accent-text" : ""}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mx-auto mt-2 min-h-16 max-w-sm rounded-2xl border border-border px-3 py-1.5 text-center text-[0.85rem] leading-snug">
            {at === null ? (
              <span className="text-muted">1 দিয়ে শুরু করুন.</span>
            ) : (
              <span key={at} className={FADE}>
                <b>{FIVE[at][0]}.</b> {FIVE[at][1]}
              </span>
            )}
          </div>
        </div>
      ) : null}
      <Task done={seen.length === 5}>বাজিটা খুলুন, তারপর পাঁচটা জিনিসেই tap করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for the finale's explanation, no task: the PCA sentence,
//      built one phrase at a time, each tagged with where it was learned.

const PCA = [
  ["PCA, data থেকেই, খুঁজে বের করে", ""],
  ["একটা basis,", "5.3"],
  ["যার button গুলা right angle এ, প্রতিটা 1 লম্বা,", "4.2 · 3.6"],
  ["যার প্রথম direction এ data সবচেয়ে বেশি ছড়ানো, তারপর পরেরটা,", "4.5"],
  ["আর শুধু প্রথম কয়েকটা রেখে দেয়.", "আজ"],
];

export function PcaWords() {
  const s = useScene(4, [700, 1400, 1400, 1800, 1800]);
  const k = s.k;
  const SAY = [
    "এই course এর শেষে যে বড় idea টা অপেক্ষা করছে, এক line এ.",
    "একটা basis: যথেষ্ট button, একটাও বাড়তি না.",
    "Square আর 1 লম্বা: orthonormal, তাই সব সংখ্যা এক scale এ, আর দূরত্ব ঠিক থাকে.",
    "Data যেদিকে সবচেয়ে বেশি ছড়ানো, সেই direction আগে. আজকের 35° এর line এর মতো.",
    "প্রথম কয়েকটা রাখো, বাকিটা ফেলে দাও, imbalance ফেলে দেয়ার মতো. প্রতিটা শব্দ এখন আপনার চেনা.",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[17rem] flex-wrap items-baseline justify-center gap-x-1.5 gap-y-1 text-[0.9rem] leading-snug">
        {PCA.slice(0, k + 1).map(([words, tag], i) => (
          <span key={i} className={`${FADE} ${i === k && i > 0 ? "font-semibold" : ""}`}>
            {words}
            {tag ? <sup className="ml-0.5 rounded bg-cat-violet/10 px-1 text-[0.6rem] font-semibold text-cat-violet">{tag}</sup> : null}
          </span>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7½b · A second figure for the finale's explanation, no task: the bridge to
//       Article 6, left open. So far the grid turned and the arrow stayed.
//       Then a machine lifts the whole grid and moves it: "?". Then Chacha's
//       khata, one flat per row. Both get the name matrix, and nothing more.

const X7_F = makeFrame(-1.6, 2.6, -1.4, 2.6, 26, 6);
const X7_ARROW: XY = [2, 1];

export function GridLifted() {
  const s = useScene(4, [700, 1800, 2200, 2000, 2000]);
  const k = s.k;
  const SAY = [
    "এতক্ষণ: একটা arrow, নিচে একটা grid.",
    "Grid ঘুরলো, arrow থাকলো জায়গায়.",
    "পুরা grid টাই যদি একটা machine তুলে নড়ায়?",
    "আর চাচার খাতা: প্রতি flat এক row.",
    "দুইটারই নাম matrix. সেটা Article 6.",
  ];
  const tf = k >= 2 ? "matrix(1.25, -0.35, 0.45, 0.85, 0, 0)" : `rotate(${k >= 1 ? -30 : 0}deg)`;
  const at = `${X7_F.sx(0)}px ${X7_F.sy(0)}px`;
  let d = "";
  const p = (x: number, y: number) => `${X7_F.sx(x)} ${X7_F.sy(y)}`;
  for (let i = -4; i <= 4; i++) d += `M${p(i, -4)}L${p(i, 4)}M${p(-4, i)}L${p(4, i)}`;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex w-full max-w-[15rem] items-center justify-center gap-3">
        <div className="w-[7rem] shrink-0">
          <Plane f={X7_F} grid={0} axes={false} label="an arrow over a grid; the grid turns, then a machine lifts and moves the whole grid" className="my-0! max-w-none">
            <Clipped f={X7_F} name="x7">
              <g style={{ transform: tf, transformOrigin: at }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
                <path d={d} strokeWidth={0.7} className="fill-none stroke-cat-violet/50" />
              </g>
            </Clipped>
            <Arrow f={X7_F} from={O} to={X7_ARROW} tone="teal" w={2.4} />
            {k === 2 && (
              <text x={X7_F.sx(-1.1)} y={X7_F.sy(2)} fontSize={14} fontWeight={800} className={`${POP} fill-[#b45309]`}>
                ?
              </text>
            )}
          </Plane>
          {k >= 4 && <div className={`${POP} mt-0.5 text-center font-mono text-xs font-bold text-cat-violet`}>matrix</div>}
        </div>
        {k >= 3 && (
          <div className={`${FADE} shrink-0 text-center`}>
            <div className="flex items-stretch gap-1 font-mono text-[0.75rem] leading-tight text-foreground">
              <span className="w-1 rounded-l border-y-2 border-l-2 border-current" aria-hidden="true" />
              <div className="grid grid-cols-2 gap-x-2 py-0.5">
                {FLATS.slice(0, 4).map((fl) => (
                  <span key={`${fl.bed}${fl.bath}`} className="contents">
                    <span>{fl.bed}</span>
                    <span>{fl.bath}</span>
                  </span>
                ))}
                <span>…</span>
                <span>…</span>
              </div>
              <span className="w-1 rounded-r border-y-2 border-r-2 border-current" aria-hidden="true" />
            </div>
            {k >= 4 && <div className={`${POP} mt-0.5 font-mono text-xs font-bold text-cat-violet`}>matrix</div>}
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  RoofLate: { start: { k: 0 }, any: { k: 1 }, end: {} },
  FairBet: { start: {}, picked: { bet: 1 }, sealed: { bet: 0, sealed: true } },
  NasibSums: { start: { k: 0 }, khata: { k: 1 }, fahim: { k: 2 }, end: {} },
  TwoFlatsTape: { start: { k: 0 }, tape: { k: 1 }, end: {} },
  NasibTape: { start: {}, fahim: { how: "fahim", seen: ["khata", "fahim"] }, done: { how: "tape", seen: ["khata", "fahim", "tape"] } },
  StepLength: { start: { k: 0 }, legs: { k: 1 }, end: {} },
  ShrinkButtons: { start: {}, small: { li: 3 }, done: { li: 2 } },
  ShrinkToOne: { start: { k: 0 }, end: {} },
  NasibTurns: { start: { k: 0 }, end: {} },
  SpinTheGrid: { start: {}, turned: { deg: 45, seen: [0, 15, 30, 45] } },
  SameArrows: { start: { k: 0 }, arrows: { k: 1 }, end: {} },
  Slot137: { start: { k: 0 }, lit: { k: 1 }, end: {} },
  BestTurn: { start: {}, mid: { deg: 60 }, done: { deg: 35, found: true } },
  MachineVsFahim: { start: { k: 0 }, end: {} },
  RiverIdeaAgain: { start: { k: 0 }, river: { k: 1 }, end: {} },
  ThreeGridsDrawn: { start: { k: 0 }, one: { k: 1 }, end: {} },
  TryFairGrid: { start: {}, stretched: { pick: 0 }, rickshaw: { pick: 2 }, right: { pick: 1 } },
  TwoChecks: { start: { k: 0 }, box: { k: 1 }, end: {} },
  LastJilapi: { start: { k: 0 }, end: {} },
  BetOpened: { start: {}, open: { open: true }, reading: { open: true, seen: [0, 1, 2], at: 2 }, done: { open: true, seen: [0, 1, 2, 3, 4], at: 4 } },
  PcaWords: { start: { k: 0 }, mid: { k: 2 }, end: {} },
  GridLifted: { start: { k: 0 }, turned: { k: 1 }, lifted: { k: 2 }, end: {} },
};
