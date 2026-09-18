"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { GROW, Choice, Draw, FADE, Nope, POP, Scene, Stepper, Ticks, pill, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Label, Plane, clamp, dist, makeFrame, minus, mix, plus, same, sg, snap, tup, type Frame, type XY } from "@/components/journey/plane";
import { Bubble, Building, Card as CastCard, Chest, Gate, Person, Stage, Stall, StoryFrame, Tree } from "@/components/journey/cast";
import { Tape } from "./dimension-journey";
import { bn } from "./figure-kit";
import { Prize, Samin } from "./treasure-journey";

// Screens for "Math for AI 3.4 — ‖v‖, গুপ্তধন কত দূরে", told as a Journey.
//
// One question runs the whole journey: four finalists stand for the treasure
// prize and their cards cannot be compared, so the reader bets on a winner
// (PrizeRow) and only gives the verdict seven screens later (PrizeGiven).
// Settling them builds the number. The tape from 2.5 measures ফাহিম's (3, 4)
// and the arrow gets its name tag, ‖v‖. সোম's roof card has three slots:
// square, add, root, done by hand. সামিন's card is lost, so it is rebuilt by
// subtracting and then measured, which makes distance the length of a
// difference. Then the objections, and each one is a rule of length: নাসিব
// cannot make a length of zero or less; nor does flipping turn a length
// negative (‖λv‖ = |λ|·‖v‖); and ফাহিম's "but I walked farther" is the
// triangle inequality (the golf ball's 84.9). After the verdict, two tea
// stalls find their places by k-means, which is only that distance and 3.3's
// average taken in turns. The reader is not told the name k-means here: the
// author holds it back for later, so neither the screen nor its <Then> says it.
//
// Tailwind only; the sheets are journey/plane, the tape comes from 2.5's
// screens. Ink on the white sheet is fixed.

const O: XY = [0, 0];
/** length of a list of numbers: square, add, root */
const len = (v: readonly number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
/** a machine number to two decimals, with a real minus */
const f2 = (n: number) => (n < -0.005 ? `−${(-n).toFixed(2)}` : Math.abs(n).toFixed(2));
const sq = (n: number) => (n < 0 ? `(${sg(n)})²` : `${n}²`);
/** A figure's caption at beat k: that beat's line, fading in fresh each time. */
const beatSay = (k: number, lines: readonly ReactNode[]) => (
  <span key={k} className={FADE}>
    {lines[Math.min(k, lines.length - 1)]}
  </span>
);

const KEY_STEP: Record<string, XY> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
/** Arrow keys nudge something on the sheet by one square. */
const nudger = (move: (d: XY) => void) => (e: KeyboardEvent<SVGSVGElement>) => {
  const d = KEY_STEP[e.key];
  if (!d) return;
  e.preventDefault();
  move(d);
};

function Card({ name, v, note }: { name: string; v: readonly number[]; note?: string }) {
  return (
    <div className="mx-auto mt-4 max-w-xs rounded-xl border-2 border-cat-teal/40 bg-surface px-3 py-2 text-center text-cat-teal">
      <div className="text-xs font-semibold text-muted">{name}</div>
      <div className="font-mono text-xl font-bold">{tup(v)}</div>
      {note && <div className="text-xs text-muted">{note}</div>}
    </div>
  );
}

/** A grab-me ring, pulsing where the reader should start pulling. */
function Grab({ at, f, ping = false }: { at: XY; f: Frame; ping?: boolean }) {
  return ping ? (
    <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={9} strokeWidth={2} className="pointer-events-none origin-center animate-ping fill-none stroke-[#d97706] [transform-box:fill-box]" />
  ) : (
    <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={6} className="pointer-events-none fill-[#d97706]" />
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the prize giving. ফাহিম
//      calls out the rule at the Gate, then the finalists walk up one by one,
//      each holding up a card of a different kind: সোম's has three slots,
//      সামিন's is lost, and নাসিব has no card at all, only a claim.

const FA_AT = { fahim: 78, som: 140, samin: 198, nasib: 258 };
const FA_OFF = 370;
const FA_Y = 150;

export function FinalistsArrive() {
  const s = useScene(5, [600, 2600, 1400, 1400, 1400]);
  const k = s.k;
  const x = (who: "som" | "samin" | "nasib", beat: number) => (k >= beat ? FA_AT[who] : FA_OFF);

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="prize giving at the fair: ফাহিম calls the rule, then সোম, সামিন and নাসিব walk up with their cards">
        <Gate x={34} y={FA_Y} />
        <Person who="fahim" x={FA_AT.fahim} y={FA_Y} arm={k === 1 ? "wave" : k >= 5 ? "hold" : "down"} mood={k === 1 ? "shout" : "happy"} label />
        {k === 1 && <Bubble x={FA_AT.fahim} y={FA_Y - 66} side="right" lines={["Gate থেকে যে সবচেয়ে দূরে,", "পুরস্কার তার!"]} />}
        {k >= 5 && <CastCard x={FA_AT.fahim} y={FA_Y - 76} text="(3, 4)" />}
        <Person who="som" x={x("som", 2)} y={FA_Y} facing={-1} walking={k === 2} arm={k >= 3 ? "hold" : "down"} label={k >= 3} />
        {k >= 3 && <CastCard x={FA_AT.som} y={FA_Y - 76} text="(2, 3, 6)" tone="amber" />}
        <Person who="samin" x={x("samin", 3)} y={FA_Y} facing={-1} walking={k === 3} mood={k >= 4 ? "puzzled" : "plain"} label={k >= 4} />
        {k >= 4 && <CastCard x={FA_AT.samin} y={FA_Y - 76} text="?" tone="blue" w={24} />}
        <Person who="nasib" x={x("nasib", 4)} y={FA_Y} facing={-1} walking={k === 4} mood="smug" arm={k >= 5 ? "point" : "down"} label={k >= 5} />
        {k >= 5 && <Bubble x={FA_AT.nasib} y={FA_Y - 66} side="left" lines={["আমার দৈর্ঘ্য", "negative!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The prize row. Four finalists whose cards cannot yet be compared: one
//     plain, one with three slots, one whose card has to be rebuilt, and
//     নাসিব, who says the rule itself is broken. The reader bets on a winner
//     and the bet is sealed, never marked — PrizeGiven settles it. This is the
//     question the whole journey answers.

const FINALISTS: { name: string; what: string; note: string; said?: boolean }[] = [
  { name: "ফাহিম", what: "(3, 4)", note: "card-টা হাতেই আছে" },
  { name: "সোম", what: "(2, 3, 6)", note: "card ছাদের, তাই ঘর তিনটা" },
  { name: "সামিন", what: "(1, 2) → (7, 10)", note: "card হারানো, শুধু শুরু আর শেষটা মনে আছে" },
  { name: "নাসিব", what: "“আমার দৈর্ঘ্য negative”", note: "বলছে নিয়মটাই খাটে না", said: true },
];
const WHO = ["ফাহিম", "সোম", "সামিন", "নাসিব ঠিক, এই নিয়মে বিচার হয় না"];

export function PrizeRow() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);

  const seal = (i: number) => {
    setBet(i);
    pass("বাজি ধরা হলো। চারজনের card চার ধাঁচের, তাই একটা একটা করে মাপতে হবে। শেষে মিলিয়ে দেখবো।");
  };

  return (
    <>
      <div className="mx-auto mt-2 max-w-sm divide-y divide-border overflow-hidden rounded-xl border-2 border-cat-teal/40">
        {FINALISTS.map((f) => (
          <div key={f.name} className="px-3 py-1.5">
            <div className="flex items-baseline gap-2">
              <span className="w-14 shrink-0 text-sm font-semibold">{f.name}</span>
              <span className={`text-[0.95rem] text-cat-teal ${f.said ? "" : "font-mono"}`}>{f.what}</span>
            </div>
            <div className="pl-16 text-xs text-muted">{f.note}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm font-medium text-muted">শেষ card ধরে হেঁটে কে সবচেয়ে দূরে থেমেছে? আন্দাজে একটা বাজি ধরুন।</div>
      <div className="mt-2 grid gap-2">
        {WHO.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {bet !== null && (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>
          বাজি সিল করা হলো। এখন একটা একটা card মেপে শেষে ফলাফল মিলিয়ে দেখবো।
        </div>
      )}
      <Task done={bet !== null}>চারজনের একজনের ওপর বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: what we have done with
//      cards so far, replayed on one sheet. Read (2, 1); join (1, 3) on to it,
//      which lands on ফাহিম's (3, 4); stretch (2, 1) to twice as long. Then
//      only (3, 4) is left, a dashed tape beside it and a "?": how long a card
//      is, we have never had to say.

const X1 = makeFrame(0, 5, 0, 5, 22, 12);
const X1_V: XY = [2, 1];
const X1_SUM: XY = [3, 4];
/** the dashed tape runs beside (3, 4), nudged this far off to its upper left */
const X1_OFF: XY = [-0.36, 0.27];
const X1_SAY = [
  "এতদিন card নিয়ে তিন রকম কাজ করেছি।",
  "Card পড়েছি: (2, 1) মানে 2 ঘর পূর্বে, 1 ঘর উত্তরে।",
  "জোড়া দিয়েছি: (2, 1) যেখানে শেষ, (1, 3) সেখান থেকে শুরু। মিলে (3, 4)।",
  "Stretch করেছি: (2, 1) একই দিকে দ্বিগুণ হয়ে (4, 2)।",
  "কিন্তু একটা arrow কতটা লম্বা, সেই সংখ্যাটা একবারও বলতে হয়নি।",
];
const X1_DID = ["পড়েছি", "জোড়া দিয়েছি", "stretch করেছি"];

export function NeverMeasured() {
  const s = useScene(4, [600, 1500, 1800, 1600]);
  const k = s.k;
  const end = k >= 4;
  const a = plus(O, X1_OFF);
  const b = plus(X1_SUM, X1_OFF);
  const q = mix(a, b, 0.5);
  return (
    <Scene scene={s} caption={beatSay(k, X1_SAY)}>
      <div className="flex items-center justify-center gap-4">
        <div className="w-[8rem] shrink-0">
          <Plane f={X1} axes={false} label="a card read, two cards joined into (3, 4), one stretched; then only (3, 4) is left and its length is a question" className="my-0! max-w-none">
            {k >= 1 && !end && <Arrow f={X1} from={O} to={X1_V} tone="blue" draw />}
            {k === 2 && <Arrow f={X1} from={X1_V} to={X1_SUM} tone="coral" draw delay={300} />}
            {k >= 2 && <Arrow f={X1} from={O} to={X1_SUM} tone="teal" w={3} draw delay={900} faint={k === 3} />}
            {k === 3 && <Arrow f={X1} from={O} to={[4, 2]} tone="violet" draw />}
            {end && (
              <g className={FADE}>
                <path d={`M${X1.sx(a[0])} ${X1.sy(a[1])}L${X1.sx(b[0])} ${X1.sy(b[1])}`} strokeWidth={2} strokeDasharray="4 4" className="fill-none stroke-cat-amber" />
                <circle cx={X1.sx(q[0])} cy={X1.sy(q[1])} r={9} strokeWidth={1.5} className="fill-white stroke-cat-amber" />
                <text x={X1.sx(q[0])} y={X1.sy(q[1]) + 4} textAnchor="middle" fontSize={12} fontWeight={800} className="fill-cat-amber">
                  ?
                </text>
              </g>
            )}
            <circle cx={X1.sx(0)} cy={X1.sy(0)} r={3.5} className="fill-[#0f1b2d]" />
          </Plane>
        </div>
        <div className="w-32 text-sm leading-relaxed">
          {X1_DID.map((d, i) => (
            <div key={d} className={`transition-opacity duration-500 motion-reduce:transition-none ${k > i ? "opacity-100" : "opacity-30"}`}>
              <span className="inline-block w-4 text-accent-text">{k > i ? "✓" : ""}</span>
              {d}
            </div>
          ))}
          <div className={`mt-1 font-semibold text-cat-amber transition-opacity duration-500 motion-reduce:transition-none ${end ? "opacity-100" : "opacity-0"}`}>
            <span className="inline-block w-4">?</span>কতটা লম্বা
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: ফাহিমের own card. He holds
//      up (3, 4) at the Gate, walks it out across the field, along and then
//      away, and finds his treasure; then a straight dashed line runs back to
//      the Gate with only a "?" on it. The 5 is left for the tape.

/** Something carried along with a Person: glides to (x, y) over `ms`, like they do. */
function Carry({ x, y, ms = 1200, children }: { x: number; y: number; ms?: number; children: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {children}
    </g>
  );
}

const FT_Y = 160;
/** where ফাহিম stands after each beat */
const FT_AT: XY[] = [
  [92, FT_Y],
  [92, FT_Y],
  [214, FT_Y],
  [214, 116],
];
const FT_CHEST: XY = [190, 114];

export function FahimsTreasure() {
  const s = useScene(4, [600, 1800, 1500, 1600]);
  const k = s.k;
  const [fx, fy] = FT_AT[Math.min(k, 3)];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={100} label="ফাহিম walks his card (3, 4) out from the Gate to his treasure; a straight line back to the Gate asks how far">
        <Tree x={296} y={104} s={0.7} />
        <Tree x={118} y={100} s={0.45} />
        <Gate x={40} y={FT_Y} />
        {k >= 2 && <path d={`M92 ${FT_Y + 3}H214`} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" stroke="#166534" className={FADE} />}
        {k >= 3 && <path d={`M214 ${FT_Y + 3}V119`} strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" stroke="#166534" className={FADE} />}
        <Chest x={FT_CHEST[0]} y={FT_CHEST[1]} open={k >= 3} />
        {k >= 4 && (
          <g className={FADE}>
            <path d={`M40 ${FT_Y - 4}L${FT_CHEST[0]} ${FT_CHEST[1] - 6}`} strokeWidth={1.8} strokeDasharray="5 4" stroke="#0f1b2d" />
            <circle cx={115} cy={131} r={8} fill="white" stroke="#0f1b2d" strokeWidth={1.2} />
            <text x={115} y={134.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="#0f1b2d">
              ?
            </text>
          </g>
        )}
        <Person who="fahim" x={fx} y={fy} ms={1300} walking={k === 2 || k === 3} arm={k >= 1 && k <= 3 ? "hold" : "down"} mood={k >= 4 ? "puzzled" : "happy"} label />
        {k >= 1 && k <= 3 && (
          <Carry x={fx} y={fy} ms={1300}>
            <CastCard x={0} y={-76} text="(3, 4)" />
          </Carry>
        )}
        {k >= 4 && <Bubble x={fx} y={fy - 66} side="left" tone="think" lines={["সোজাসুজি কত দূর?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · The prize card (3, 4). Guess how far, then pull 2.5's tape from the gate
//     to the X: 5. Only now does the arrow get its name tag, ‖v‖.

const FA = makeFrame(0, 6, 0, 5, 38);
const V1: XY = [3, 4];
const TAPE_GUESS = ["7", "5", "4"];

export function TapeRecall() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [end, setEnd] = useSeed<XY>("end", O);
  const done = same(end, V1);
  const pulling = guess !== null && !done;

  const pull = (p: XY) => {
    if (!pulling) return;
    const t: XY = [clamp(p[0], FA.x0, FA.x1), clamp(p[1], FA.y0, FA.y1)];
    if (dist(t, V1) < 0.4) {
      setEnd(V1);
      pass("ফিতা বললো 5, Shiku-র ball মাপার সময় যেমন এসেছিল। Arrow-টা কতটা লম্বা, সেটাকে লেখা হয় ‖v‖, আর হিসাবটা √(3² + 4²) = 5।");
    } else setEnd(t);
  };

  return (
    <>
      <Card name="ফাহিমের শেষ card" v={V1} note="Gate থেকে 3 ঘর পূর্বে, 4 ঘর উত্তরে" />
      <Plane
        f={FA}
        ticks={1}
        label={done ? "the tape from the gate to (3, 4) reads 5" : "an arrow from the gate to the prize at (3, 4)"}
        drag={pulling ? { down: pull, move: pull } : undefined}
        onKey={pulling ? nudger((d) => pull(snap(plus(end, d), FA))) : undefined}
      >
        <Arrow f={FA} from={O} to={V1} tone="teal" w={2.6} faint={!same(end, O)} />
        <Prize f={FA} at={V1} found={done} />
        <Tape f={FA} from={O} to={end} />
        {pulling && <Grab f={FA} at={end} ping={same(end, O)} />}
        {done && (
          <Label f={FA} at={[1.5, 2]} dx={-14} dy={-4} anchor="end" size={13} weight={700} className={`${POP} fill-cat-teal`}>
            ‖v‖ = 5
          </Label>
        )}
      </Plane>
      {guess === null ? (
        <>
          <div className="text-sm font-medium text-muted">Gate থেকে treasure সোজাসুজি কত ঘর দূরে?</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {TAPE_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, done, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
                <span className="font-mono">{o}</span>
              </Choice>
            ))}
          </div>
        </>
      ) : (
        <div className="min-h-7 text-center text-[0.95rem]">
          {done ? (
            <span className={FADE}>
              ফিতা বলছে <b className="font-mono">5</b>। আপনি ধরেছিলেন <b className="font-mono">{TAPE_GUESS[guess]}</b>
              {guess === 1 ? ", একদম ঠিক!" : guess === 0 ? "। Shiku-র মতো ঘর গুনে গুনে হাঁটলে 7 হতো, কিন্তু ফিতা তো যায় কোণাকুনি।" : "। কোণাকুনি পথ কিন্তু 4-এর চেয়ে লম্বা, কারণ উত্তরে 4 ঘর তো যেতেই হয়, সাথে পূর্বেও 3 ঘর।"}
            </span>
          ) : same(end, O) ? (
            <span className="text-muted">আপনার guess {TAPE_GUESS[guess]}। এবার Gate-এর কোণা থেকে ফিতাটা টেনে ✕ পর্যন্ত নিয়ে যান।</span>
          ) : (
            <span>
              ফিতা এখন <b className="font-mono">{dist(O, end).toFixed(1)}</b> ঘর লম্বা।
            </span>
          )}
        </div>
      )}
      {done && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-teal/5 px-3 py-3 text-center font-mono`}>
          ‖v‖ = √(3² + 4²) = √(16 + 9) = √25 = <b className="text-cat-teal">5</b>
        </div>
      )}
      <Task done={done}>আগে একটা guess দিন, তারপর ফিতা দিয়ে মেপে মিলিয়ে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the same 5, seen two
//      ways. First two dots, the Gate's corner and the treasure's ✕, and the
//      tape pulled between them (2.5's "distance between two points"); then an
//      arrow is drawn over the tape, and the 5 becomes the arrow's own size.

const X2 = makeFrame(0, 4, 0, 5, 22, 12);
const X2_END: XY = [3, 4];
const X2_SAY = [
  "আগে এটা ছিল দুই বিন্দুর দূরত্ব: Gate-এর কোণা আর treasure-এর ✕।",
  "আগে এটা ছিল দুই বিন্দুর দূরত্ব: Gate-এর কোণা আর treasure-এর ✕।",
  "ফিতা টানলে 5। 3 আর 4-এর tile থেকে যেভাবে এসেছিল, ঠিক সেভাবে।",
  "একই 5, এবার একটা arrow-এর নিজের মাপ হিসেবে।",
];

export function DotsToArrow() {
  const s = useScene(3, [600, 1400, 1800]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 1 : 0], 1000);
  return (
    <Scene scene={s} caption={beatSay(k, X2_SAY)}>
      <div className="flex items-center justify-center gap-4">
        <div className="w-[7rem] shrink-0">
          <Plane f={X2} ticks={1} label="the Gate's corner and the treasure at (3, 4): the tape between them reads 5, then an arrow is drawn along it" className="my-0! max-w-none">
            {k >= 1 && k < 3 && <path d={`M${X2.sx(0)} ${X2.sy(0)}L${X2.sx(3)} ${X2.sy(4)}`} strokeWidth={1.5} strokeDasharray="3 4" className={`${FADE} fill-none stroke-[#0f1b2d]/60`} />}
            {k >= 2 && <Tape f={X2} from={O} to={mix(O, X2_END, t)} />}
            {k >= 3 && <Arrow f={X2} from={O} to={X2_END} tone="teal" w={3.2} draw />}
            <Prize f={X2} at={X2_END} />
            <circle cx={X2.sx(0)} cy={X2.sy(0)} r={4} className="fill-[#0f1b2d]" />
          </Plane>
        </div>
        <div className="w-36 text-sm leading-snug">
          <div className={`transition-opacity duration-500 motion-reduce:transition-none ${k >= 3 ? "opacity-50" : ""}`}>
            <div className="text-muted">দুই বিন্দুর দূরত্ব</div>
            <div className="font-mono">{k >= 2 ? <span className={FADE}>√(3² + 4²) = 5</span> : "?"}</div>
          </div>
          <div className="mt-3 text-muted">arrow-এর নিজের মাপ</div>
          <div className="font-mono">{k >= 3 ? <b className={`${POP} inline-block text-cat-teal`}>‖v‖ = 5</b> : "?"}</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2¾ · A figure for screen 2's explanation, no task: the name tag, built a
//      piece at a time. v; two bars slide in on each side, ‖v‖; ফাহিম's card
//      goes inside; square each slot and add; the root, 5; and last the word
//      itself, norm.

const X2N_SAY = [
  "ফাহিমের arrow-টার নাম দিই v।",
  "দুই পাশে দুইটা করে খাড়া দাগ: ‖v‖, মানে v কতটা লম্বা।",
  "ভেতরে বসাই ফাহিমের card, (3, 4)।",
  "প্রতিটা ঘরের বর্গ, তারপর যোগ।",
  "শেষে root: 5। এই মাপটার নামই norm।",
];
const X2N_BAR = "inline-block text-cat-teal transition-[opacity,translate] duration-500 motion-reduce:transition-none";

export function NormBuild() {
  const s = useScene(4, [600, 1300, 1400, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={beatSay(k, X2N_SAY)}>
      <div className="flex min-h-36 flex-col items-center justify-center gap-1 font-mono tabular-nums" aria-label="‖v‖ = ‖(3, 4)‖ = √(3² + 4²) = √25 = 5, the norm">
        <div className="flex items-baseline text-3xl font-bold">
          <span className={`${X2N_BAR} ${k >= 1 ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`}>‖</span>
          <span key={k >= 2 ? "card" : "v"} className={`${POP} inline-block`}>
            {k >= 2 ? "(3, 4)" : "v"}
          </span>
          <span className={`${X2N_BAR} ${k >= 1 ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}>‖</span>
        </div>
        <div className="h-7 text-lg">{k >= 3 && <span className={FADE}>= √(3² + 4²) = √(9 + 16)</span>}</div>
        <div className="h-7 text-lg">
          {k >= 4 && (
            <span className={FADE}>
              = √25 = <b className="text-cat-teal">5</b>
            </span>
          )}
        </div>
        <div className="h-7">
          {k >= 4 && <span className={`${POP} inline-block rounded-full bg-cat-teal/10 px-3 py-0.5 font-sans text-sm font-bold text-cat-teal delay-500`}>norm</span>}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: সোম's card is not on the
//      field but on the school roof. He climbs up and holds up his card, and a
//      third slot joins it as the roof's height is marked on the wall. Down at
//      the Gate ফাহিম, tape in hand, wonders if a two-slot tape still works.

const SR_ROOF = 95;
const SR_LADDER = 273;

export function SomOnRoof() {
  const s = useScene(5, [600, 1500, 1400, 1400, 1900]);
  const k = s.k;
  const card = k >= 4 ? "(2, 3, 6)" : "(2, 3)";
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সোম climbs onto the school roof with his card; a third slot, the roof's height, joins it; ফাহিম wonders if his tape still works">
        <Tree x={304} y={150} s={0.6} />
        <Gate x={36} y={150} />
        <Building x={178} y={150} w={88} h={150 - SR_ROOF} roof label="স্কুল" />
        {/* the ladder up the school's side */}
        <g stroke="#78350f" strokeWidth={1.6}>
          <path d={`M${SR_LADDER - 6} 150V${SR_ROOF - 10}M${SR_LADDER + 6} 150V${SR_ROOF - 10}`} />
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M${SR_LADDER - 6} ${146 - i * 9}h12`} />
          ))}
        </g>
        {k >= 4 && (
          <g className={FADE}>
            <path d={`M170 150V${SR_ROOF}M166 150h8M166 ${SR_ROOF}h8`} stroke="#b45309" strokeWidth={1.6} />
            <text x={165} y={126} textAnchor="end" fontSize={8.5} fontWeight={700} fill="#b45309">
              height
            </text>
          </g>
        )}
        <Person who="fahim" x={96} y={150} arm="hold" mood={k >= 5 ? "puzzled" : "plain"} label />
        {/* ফাহিমের দর্জির ফিতা, a roll with its tongue out */}
        <g>
          <circle cx={117} cy={107} r={5.5} fill="#facc15" stroke="#a16207" strokeWidth={1.2} />
          <path d="M121 109h9" stroke="#facc15" strokeWidth={3} />
        </g>
        {k >= 5 && <Bubble x={96} y={84} side="right" tone="think" lines={["দুই ঘরের ফিতা", "তিন ঘরে খাটবে?"]} />}
        <Person who="som" x={k >= 2 ? 218 : SR_LADDER} y={k >= 1 ? SR_ROOF : 150} ms={1300} facing={-1} walking={k === 1 || k === 2} arm={k >= 3 ? "hold" : "down"} mood={k >= 4 ? "happy" : "plain"} label={k === 0 || k >= 3} />
        {k >= 3 && <CastCard key={card} x={218} y={SR_ROOF - 76} text={card} tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · The last clue is on the school roof: three slots. The reader squares each
//     slot, adds them, then hunts the number whose square is 49.

const BOX = [
  { k: "পূর্বে", n: 2 },
  { k: "উত্তরে", n: 3 },
  { k: "ওপরে", n: 6 },
];
const BOX_SUM = BOX.reduce((s, b) => s + b.n * b.n, 0);
const BOX_LEN = Math.sqrt(BOX_SUM);

export function BoxClue() {
  const pass = useGate();
  const [squared, setSquared] = useSeed<number[]>("squared", []);
  const [added, setAdded] = useSeed("added", false);
  const [root, setRoot] = useSeed("root", 0);
  const allSq = squared.length === BOX.length;
  const done = added && root === BOX_LEN;
  const r2 = root * root;

  const square = (i: number) => {
    if (!squared.includes(i)) setSquared([...squared, i]);
  };
  const turn = (n: number) => {
    if (done) return;
    setRoot(n);
    if (n === BOX_LEN) pass("ঘর যতগুলোই থাকুক, কাজ সেই তিনটাই: প্রতিটা ঘরের বর্গ, সব যোগ, তারপর root। তাই drone সোজাসুজি উড়েছিল 7 ঘর।");
  };

  return (
    <>
      <Card name="ছাদের card" v={BOX.map((b) => b.n)} note="2 ঘর পূর্বে, 3 ঘর উত্তরে, 6 ঘর ওপরে" />
      <div className="mt-4 text-center text-sm text-muted">প্রথম কাজ হলো প্রতিটা ঘরকে নিজের সাথে গুণ করা, মানে বর্গ করা। একটা একটা করে ঘরগুলোতে tap করুন।</div>
      <div className="mx-auto mt-2 grid max-w-sm grid-cols-3 gap-2">
        {BOX.map((b, i) => {
          const on = squared.includes(i);
          return (
            <button
              key={b.k}
              type="button"
              disabled={on}
              onClick={() => square(i)}
              className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-1 py-2.5 transition-colors duration-300 motion-reduce:transition-none disabled:cursor-default ${
                on ? "border-cat-teal/40 bg-cat-teal/5" : "border-border hover:border-cat-teal/60"
              }`}
            >
              <span className="text-xs text-muted">{b.k}</span>
              <span className="font-mono text-2xl font-bold">{b.n}</span>
              {on ? (
                <span className={`${POP} inline-block font-mono text-sm`}>
                  {b.n}² = <b className="text-cat-teal">{b.n * b.n}</b>
                </span>
              ) : (
                <span className="text-xs text-muted">বর্গ করুন</span>
              )}
            </button>
          );
        })}
      </div>
      {allSq && !added && (
        <div className={`${FADE} mt-3 flex justify-center`}>
          <button type="button" onClick={() => setAdded(true)} className={primaryBtn}>
            বর্গগুলো যোগ করুন
          </button>
        </div>
      )}
      {added && (
        <div className={`${FADE} mt-3 text-center font-mono text-lg`}>
          {BOX.map((b) => b.n * b.n).join(" + ")} = <b className="text-cat-teal">{BOX_SUM}</b>
        </div>
      )}
      {added && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl border border-border px-4 py-3 text-center`}>
          <div className="text-[0.95rem]">শেষ কাজটা একটা উল্টো প্রশ্ন। কোন সংখ্যাকে সেই সংখ্যা দিয়েই গুণ করলে {BOX_SUM} হয়?</div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 font-mono text-lg">
            <Stepper value={root} min={0} max={12} label="সংখ্যাটা" disabled={done} onChange={turn} />
            <span>
              × {root} = <b className={r2 === BOX_SUM ? "text-accent-text" : ""}>{r2}</b>
            </span>
          </div>
          <div key={root} className={`${FADE} mt-1 min-h-6 text-sm`}>
            {root === 0 ? (
              <span className="text-muted">ছোট থেকে একটু একটু করে বাড়াতে থাকুন।</span>
            ) : r2 < BOX_SUM ? (
              <span className="text-muted">{r2}, এখনো {BOX_SUM}-এ পৌঁছায়নি। আরেকটু বাড়ান।</span>
            ) : r2 > BOX_SUM ? (
              <span className="text-danger">{r2}, {BOX_SUM} ছাড়িয়ে গেল। একটু কমিয়ে দেখুন।</span>
            ) : (
              <span className="text-accent-text">
                ✓ √{BOX_SUM} = {BOX_LEN}
              </span>
            )}
          </div>
        </div>
      )}
      {done && (
        <div className={`${FADE} mt-3 text-center font-mono text-lg`}>
          ‖(2, 3, 6)‖ = √(4 + 9 + 36) = <b className="text-cat-teal">7</b>
        </div>
      )}
      <Task done={done}>তিনটা ঘর বর্গ করে যোগ করুন, তারপর যোগফলের root খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: সোমের card (2, 3, 6) as
//      a room, drawn in 2.x's slanted 3D, played once it is seen. The
//      mosquito's two Pythagoras: across the floor (4 + 9 = 13, no root yet),
//      then up the wall (13 + 36 = 49), and only then one root, 7.

const RB = { x: 2, y: 3, z: 6 };
const RB_U = 17;
const RB_C = Math.cos(Math.PI / 6);
/** slanted 3D: east runs down-right, north runs up-right, up runs up */
const rb = (x: number, y: number, z: number): [number, number] => [34 + (x + y) * RB_C * RB_U, 150 + (x - y) * 0.5 * RB_U - z * RB_U];
const rbPath = (...ps: [number, number, number][]) => ps.map((p, i) => `${i ? "L" : "M"}${rb(...p).map((n) => n.toFixed(1)).join(" ")}`).join("");
const RB_SAY = [
  "সোমের card-টাকে একটা ঘর ভাবুন: 2 পূর্বে, 3 উত্তরে, 6 ওপরে।",
  "প্রথম Pythagoras, মেঝের কোণাকুনি: 2² + 3² = 13। Root এখনই না।",
  "দ্বিতীয় Pythagoras, দেয়াল বেয়ে ওপরে: 13 + 6² = 49।",
  "এবার একবারই root: √49 = 7। মশাটা সোজা উড়লে ঠিক\u00a07।",
];

export function RoofBox() {
  const s = useScene(3, [500, 1300, 1300]);
  const k = s.k;
  const { x, y, z } = RB;
  const edge = "fill-none stroke-[#0f1b2d]/25";
  const [lx, ly] = rb(x / 2, y / 2, 0);
  const [ux, uy] = rb(x, y, z / 2);
  const [dx, dy] = rb(x / 2, y / 2, z / 2);

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{RB_SAY[k]}</span>}>
      <svg viewBox="0 0 170 172" role="img" aria-label="a 2 by 3 by 6 room: across the floor 13, up the wall 36, straight through 7" className="mx-auto block h-auto w-full max-w-[11rem] overflow-visible">
        <rect x="0" y="0" width="170" height="172" rx="10" className="fill-white" />
        {/* the room: the floor filled, the far walls faint */}
        <path d={`${rbPath([0, 0, 0], [x, 0, 0], [x, y, 0], [0, y, 0])}Z`} className="fill-cat-blue/10 stroke-[#0f1b2d]/40" strokeWidth={1} />
        <path d={rbPath([0, 0, 0], [0, 0, z], [x, 0, z], [x, 0, 0]) + rbPath([0, 0, z], [0, y, z], [x, y, z], [x, 0, z]) + rbPath([0, y, 0], [0, y, z]) + rbPath([x, y, 0], [x, y, z])} strokeWidth={1} className={edge} />
        {k >= 1 && <Draw key={`f${k > 0}`} d={rbPath([0, 0, 0], [x, y, 0])} strokeWidth={3} ms={700} className="stroke-cat-blue" />}
        {k >= 1 && (
          <text x={lx + 4} y={ly + 16} className={`${FADE} fill-cat-blue font-mono text-[11px] font-bold`}>
            13
          </text>
        )}
        {k >= 2 && <Draw d={rbPath([x, y, 0], [x, y, z])} strokeWidth={3} ms={700} className="stroke-cat-coral" />}
        {k >= 2 && (
          <text x={ux + 6} y={uy} className={`${FADE} fill-cat-coral font-mono text-[11px] font-bold`}>
            36
          </text>
        )}
        {k >= 3 && <Draw d={rbPath([0, 0, 0], [x, y, z])} strokeWidth={3.4} ms={900} className="stroke-cat-teal" />}
        {k >= 3 && (
          <text x={dx - 10} y={dy - 2} textAnchor="end" className={`${POP} fill-cat-teal font-mono text-[15px] font-extrabold`}>
            7
          </text>
        )}
        <circle cx={rb(0, 0, 0)[0]} cy={rb(0, 0, 0)[1]} r={4} className="fill-[#0f1b2d]" />
        {k >= 3 && <circle cx={rb(x, y, z)[0]} cy={rb(x, y, z)[1]} r={5} className={`${POP} fill-cat-amber stroke-[#0f1b2d]`} strokeWidth={1.2} />}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A figure for screen 3's explanation, no task: more slots, same rule.
//      Two slots (3, 4), three (2, 3, 6), four (2, 4, 5, 6), a row each:
//      square every slot, add, one root. Then any number of slots, and the
//      long sum folds into Σ.

const X3_ROWS = [
  [3, 4],
  [2, 3, 6],
  [2, 4, 5, 6],
];
const X3_SAY = [
  "দুই ঘর: প্রতিটার বর্গ, যোগ, তারপর root।",
  "দুই ঘর: প্রতিটার বর্গ, যোগ, তারপর root।",
  "তিন ঘর: একই কাজ, শুধু বর্গ একটা বেশি।",
  "চার ঘর: বর্গ চারটা, root তবু একটাই।",
  "ঘর যতগুলোই হোক, নিয়ম একটাই। Σ শুধু লম্বা যোগটা ছোট করে লেখে।",
];

export function ManySlots() {
  const s = useScene(4, [600, 1400, 1400, 1700]);
  const k = s.k;
  return (
    <Scene scene={s} caption={beatSay(k, X3_SAY)}>
      <div className="mx-auto grid min-h-[7.5rem] w-fit grid-cols-[auto_auto_auto] content-start items-baseline gap-x-2.5 gap-y-1.5 whitespace-nowrap">
        {X3_ROWS.flatMap((v, i) =>
          k > i
            ? [
                <span key={`n${i}`} className={`${FADE} text-xs text-muted`}>
                  {bn(v.length)} ঘর
                </span>,
                <span key={`v${i}`} className={`${FADE} font-mono text-xs font-semibold`}>
                  {tup(v)}
                </span>,
                <span key={`f${i}`} className={`${FADE} font-mono text-xs`}>
                  √({v.map((x) => x * x).join(" + ")}) = <b className="text-sm text-cat-teal">{len(v)}</b>
                </span>,
              ]
            : [],
        )}
        {k >= 4 && (
          <>
            <span className={`${FADE} border-t border-border pt-1.5 text-xs text-muted`}>যত ঘর</span>
            <span className={`${FADE} border-t border-border pt-1.5 font-mono text-xs font-semibold`}>(v₁, …, vₙ)</span>
            <span className={`${FADE} border-t border-border pt-1.5 font-mono text-xs leading-tight`}>
              √(v₁² + … + vₙ²)
              <span className="block">
                = <b className="text-sm text-cat-violet">√(Σ vᵢ²)</b>
              </span>
            </span>
          </>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3⅞ · A figure for screen 3's explanation, no task: a 784-pixel picture as
//      an arrow. A hand-drawn 7 on 28 × 28 pixels, 1 where there is ink. A
//      scan reads it row by row into a card of 784 slots; squaring leaves
//      only the inked slots, 64 of them; the root, 8. Nobody can draw that
//      arrow, but its length came out all the same.

const X3P_N = 28;
/** the inked pixels of the 7, [row, column]: a two-row bar, then a stroke two pixels wide */
const X3P_INK: [number, number][] = [
  ...Array.from({ length: 28 }, (_, i): [number, number] => [5 + Math.floor(i / 14), 7 + (i % 14)]),
  ...Array.from({ length: 36 }, (_, i): [number, number] => {
    const r = 7 + Math.floor(i / 2);
    return [r, 19 - Math.floor((r - 7) / 2) + (i % 2)];
  }),
];
const X3P_SUM = X3P_INK.length;
const X3P_GRID = Array.from({ length: X3P_N + 1 }, (_, i) => `M${i} 0V${X3P_N}M0 ${i}H${X3P_N}`).join("");
const X3P_SAY = [
  "28 × 28 pixel-এর একটা ছোট ছবি। কালি থাকলে 1, না থাকলে 0।",
  "সারি ধরে পড়লে ছবিটা একটা card, 784 ঘরের।",
  `প্রতিটা ঘরের বর্গ, সব যোগ। 0² তো 0, 1² হলো 1, তাই যোগফল ${X3P_SUM}।`,
  `শেষে root: ${Math.sqrt(X3P_SUM)}। Arrow-টা আঁকা যায় না, কিন্তু দৈর্ঘ্য ঠিকই বের হলো।`,
];

export function PixelLength() {
  const s = useScene(3, [600, 1800, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={beatSay(k, X3P_SAY)}>
      <div className="flex items-center justify-center gap-4">
        <svg viewBox={`0 0 ${X3P_N} ${X3P_N}`} role="img" aria-label={`a 28 by 28 picture of a 7: ${X3P_SUM} inked pixels, length √${X3P_SUM}`} className="block w-[6.5rem] shrink-0 overflow-hidden rounded-md">
          <rect width={X3P_N} height={X3P_N} className="fill-white" />
          <path d={X3P_GRID} strokeWidth={0.05} className="fill-none stroke-[#0f1b2d]/15" />
          {X3P_INK.map(([r, c]) => (
            <rect key={`${r},${c}`} x={c} y={r} width={1} height={1} className={`transition-[fill] duration-500 motion-reduce:transition-none ${k >= 2 ? "fill-cat-teal" : "fill-[#0f1b2d]"}`} />
          ))}
          {k === 1 && (
            <rect
              width={X3P_N}
              height={2}
              style={{ transitionDuration: "1500ms" }}
              className="translate-y-[26px] fill-cat-amber/30 transition-transform ease-linear motion-reduce:transition-none starting:translate-y-0"
            />
          )}
        </svg>
        <div className="w-40 text-sm leading-snug">
          <div className="text-muted">{k >= 1 ? <span className={FADE}>784 ঘরের card</span> : "একটা ছবি"}</div>
          <div className="font-mono text-xs">{k >= 1 ? <span className={FADE}>(0, 0, …, 1, 1, …, 0)</span> : " "}</div>
          <div className="mt-2 font-mono text-xs">{k >= 2 ? <span className={FADE}>0² + … + 1² + … = {X3P_SUM}</span> : " "}</div>
          <div className="mt-1 font-mono">
            {k >= 3 ? (
              <span className={FADE}>
                √{X3P_SUM} = <b className="text-cat-teal">{Math.sqrt(X3P_SUM)}</b>
              </span>
            ) : (
              " "
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: সামিন has lost his card.
//      He looks for it, then walks what he remembers: from the flag at (1, 2)
//      to the flag at (7, 10). No card appears; building it is the screen's job.

function LcFlag({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g className={POP}>
      <path d={`M${x} ${y}V${y - 62}`} stroke="#57534e" strokeWidth={2} />
      <path d={`M${x + 1} ${y - 62}l14 5l-14 5Z`} fill="#0d9488" />
      <CastCard x={x} y={y - 76} text={text} tone="blue" />
    </g>
  );
}

const LC_Y = 150;
const LC_A = 50;
const LC_B = 238;
/** where সামিন stands after each beat */
const LC_AT = [160, 160, LC_A + 24, LC_B + 24, LC_B + 24, 158];

export function LostCard() {
  const s = useScene(5, [600, 2400, 1700, 2100, 1300]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সামিন has lost his card; he only remembers starting at (1, 2) and stopping at (7, 10)">
        <Tree x={306} y={150} s={0.55} />
        {k >= 2 && <LcFlag x={LC_A} y={LC_Y} text="(1, 2)" />}
        {k >= 4 && <LcFlag x={LC_B} y={LC_Y} text="(7, 10)" />}
        <Person
          who="samin"
          x={LC_AT[k]}
          y={LC_Y}
          ms={k === 3 ? 1900 : 1400}
          facing={k === 2 || k >= 4 ? -1 : 1}
          walking={k === 2 || k === 3 || k === 5}
          mood={k === 1 || k >= 5 ? "puzzled" : "plain"}
          arm={k === 1 ? "hold" : "down"}
          label
        />
        {k === 1 && <Bubble x={160} y={LC_Y - 66} lines={["আমার card-টা কই?!"]} />}
        {k >= 5 && <Bubble x={158} y={LC_Y - 66} tone="think" lines={["শুধু শুরু আর", "শেষটা মনে আছে…"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · সামিন at (1, 2), the prize at (7, 10). Build her card first (end − start,
//     from 3.1), guess its length, then lay the tape: 10. Distance is the
//     length of a difference.

const FT = makeFrame(0, 8, 0, 11, 26);
const T_FROM: XY = [1, 2];
const T_TO: XY = [7, 10];
const T_TRIP = minus(T_TO, T_FROM);
const TRIP_GUESS = ["14", "10", "12"];

export function TripLength() {
  const pass = useGate();
  const [card, setCard] = useSeed<XY>("card", [0, 0]);
  const [built, setBuilt] = useSeed("built", false);
  const [miss, setMiss] = useState<{ n: number; a: XY } | null>(null);
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [measured, setMeasured] = useSeed("measured", false);

  const check = () => {
    if (same(card, T_TRIP)) {
      setBuilt(true);
      setMiss(null);
    } else setMiss((m) => ({ n: (m?.n ?? 0) + 1, a: card }));
  };
  const measure = () => {
    setMeasured(true);
    pass("দূরত্ব মাপা দুই ধাপের কাজ। আগে বিয়োগ করে যাওয়ার card, তারপর সেই card কতটা লম্বা: ‖(7, 10) − (1, 2)‖ = 10।");
  };

  return (
    <>
      <Plane f={FT} ticks={1} label={`সামিন at ${tup(T_FROM)}, the prize at ${tup(T_TO)}`} className="max-w-[15rem]">
        {miss && !built && <Arrow key={miss.n} f={FT} from={T_FROM} to={plus(T_FROM, miss.a)} tone="coral" dashed faint />}
        {built && <Arrow f={FT} from={T_FROM} to={T_TO} tone="teal" w={3} draw faint={measured} />}
        {measured && <Tape f={FT} from={T_FROM} to={T_TO} />}
        <Prize f={FT} at={T_TO} found={measured} />
        <Samin f={FT} at={T_FROM} />
      </Plane>
      {!built ? (
        <>
          <div className="text-center text-sm text-muted">প্রথমে সামিনের card বানাই। সামিন থেকে পুরস্কার পর্যন্ত যেতে কোন দিকে কত ঘর হাঁটতে হবে?</div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 rounded-2xl bg-cat-teal/5 px-4 py-3 font-mono text-lg">
            <span className="font-semibold">card = (</span>
            <Stepper value={card[0]} min={0} max={7} label="পূর্বে" onChange={(a) => setCard([a, card[1]])} />
            <span>,</span>
            <Stepper value={card[1]} min={0} max={9} label="উত্তরে" onChange={(b) => setCard([card[0], b])} />
            <span>)</span>
          </div>
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={check} className={primaryBtn}>
              Card-টা মিলিয়ে দেখুন
            </button>
          </div>
          {miss && (
            <Nope key={miss.n}>
              উঁহু, সামিন {tup(miss.a)} হাঁটলে থামবে {tup(plus(T_FROM, miss.a))}-এ। পুরস্কার আর সামিনের ঠিকানা দুইটা পাশাপাশি রেখে দেখুন তো।
            </Nope>
          )}
        </>
      ) : (
        <div className={FADE}>
          <div className="text-center font-mono text-lg">
            {tup(T_TO)} − {tup(T_FROM)} = <b className="text-cat-teal">{tup(T_TRIP)}</b>
          </div>
          <div className="mt-3 text-sm font-medium text-muted">এই card ধরে সামিন সোজাসুজি কত ঘর যাবে?</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {TRIP_GUESS.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, measured, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
                <span className="font-mono">{o}</span>
              </Choice>
            ))}
          </div>
          {guess !== null && !measured && (
            <div className={`${FADE} mt-3 flex justify-center`}>
              <button type="button" onClick={measure} className={`${primaryBtn} bg-cat-amber`}>
                ফিতা দিয়ে মাপুন
              </button>
            </div>
          )}
          {measured && (
            <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-teal/5 px-3 py-3 text-center font-mono`}>
              ‖(6, 8)‖ = √(36 + 64) = √100 = <b className="text-cat-teal">10</b>
            </div>
          )}
        </div>
      )}
      <Ticks
        items={[
          ["সামিনের card", built],
          ["card-এর দৈর্ঘ্য", measured],
        ]}
      />
      <Task done={measured}>আগে সামিনের card বানান, তারপর সেই card কতটা লম্বা, মেপে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the old long distance
//      formula, taken apart. √((7 − 1)² + (10 − 2)²) sits there whole; its
//      subtractions light up blue and become সামিন's card (6, 8), drawn on the
//      sheet; the rest lights up teal and is that card's length, taped: 10.
//      Two old jobs, joined: distance is the length of a difference.

const X4 = makeFrame(0, 8, 0, 11, 10, 10);
const X4_B: XY = [1, 2];
const X4_A: XY = [7, 10];
const X4_SAY = [
  "এতদিনের লম্বা formula: ঘরে ঘরে বিয়োগ, প্রতিটার বর্গ, যোগ, তারপর root।",
  "নীল অংশটা পুরানো কাজ: বিয়োগ করে যাওয়ার card, (6, 8)।",
  "বাকিটা একটু আগের কাজ: card-টা কতটা লম্বা। 10।",
  "দুইটা পুরানো কাজ জোড়া দিলেই দূরত্ব।",
];
const x4Hi = (on: boolean, ink: string) => `transition-colors duration-500 motion-reduce:transition-none ${on ? `font-bold ${ink}` : "text-muted"}`;

export function TwoJobs() {
  const s = useScene(3, [700, 1700, 1700]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 1 : 0], 900);
  const tip = mix(X4_B, X4_A, t);
  return (
    <Scene scene={s} caption={beatSay(k, X4_SAY)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={X4} axes={false} label="সামিন at (1, 2), the prize at (7, 10): the card (6, 8) between them, then its length, 10" className="my-0! max-w-none">
            {k >= 2 && t > 0.02 && <path d={`M${X4.sx(X4_B[0])} ${X4.sy(X4_B[1])}L${X4.sx(tip[0])} ${X4.sy(tip[1])}`} strokeWidth={7} strokeLinecap="round" className="fill-none stroke-[#fde68a]" />}
            {k >= 1 && <Arrow f={X4} from={X4_B} to={X4_A} tone="blue" w={2.4} draw />}
            <Prize f={X4} at={X4_A} />
            <Samin f={X4} at={X4_B} />
          </Plane>
        </div>
        <div className="w-48 text-sm leading-snug">
          <div className="font-mono text-[0.8rem]">
            <span className={x4Hi(k >= 2, "text-cat-teal")}>√(</span>
            <span className={x4Hi(k >= 1, "text-cat-blue")}>(7 − 1)</span>
            <span className={x4Hi(k >= 2, "text-cat-teal")}>² + </span>
            <span className={x4Hi(k >= 1, "text-cat-blue")}>(10 − 2)</span>
            <span className={x4Hi(k >= 2, "text-cat-teal")}>²)</span>
          </div>
          <div className="mt-2 h-5">
            {k >= 1 && (
              <span className={FADE}>
                <span className="text-muted">বিয়োগ: </span>
                <b className="font-mono text-cat-blue">(6, 8)</b>
              </span>
            )}
          </div>
          <div className="h-5">
            {k >= 2 && (
              <span className={FADE}>
                <span className="text-muted">দৈর্ঘ্য: </span>
                <b className="font-mono text-cat-teal">‖(6, 8)‖ = 10</b>
              </span>
            )}
          </div>
          <div className="mt-1 h-6">
            {k >= 3 && (
              <b className={`${POP} inline-block text-cat-violet`}>
                দূরত্ব<span className="font-mono">(a, b) = ‖a − b‖</span>
              </b>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's explanation, no task: the question it leaves
//      open. সামিন's two points, b where he started and a where he stopped;
//      a − b runs from b to a, (6, 8), length 10; b − a runs back, (−6, −8),
//      another card, and its length is left as a "?". Not answered here.

/** the two arrows run side by side, this far apart, so both show */
const X4_SIDE: XY = [-0.24, 0.18];
const X4Q_SAY = [
  "সামিন শুরু করেছিল b-তে, থেমেছিল a-তে।",
  "সামিন শুরু করেছিল b-তে, থেমেছিল a-তে।",
  "a − b: b থেকে a-তে যাওয়ার card, দৈর্ঘ্য 10।",
  "b − a: উল্টো দিকের, অন্য একটা card। দুইটার দৈর্ঘ্য কি এক? নিজেই ভেবে দেখুন।",
];

export function BothWaysQuestion() {
  const s = useScene(3, [600, 1300, 1700]);
  const k = s.k;
  return (
    <Scene scene={s} caption={beatSay(k, X4Q_SAY)}>
      <div className="flex items-center justify-center gap-4">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={X4} axes={false} label="b at (1, 2), a at (7, 10): a − b is (6, 8), b − a is (−6, −8); is their length the same?" className="my-0! max-w-none">
            {k >= 2 && <Arrow f={X4} from={plus(X4_B, X4_SIDE)} to={plus(X4_A, X4_SIDE)} tone="blue" w={2.4} draw />}
            {k >= 3 && <Arrow f={X4} from={minus(X4_A, X4_SIDE)} to={minus(X4_B, X4_SIDE)} tone="coral" w={2.4} draw />}
            {k >= 1 && (
              <g className={FADE}>
                <circle cx={X4.sx(X4_B[0])} cy={X4.sy(X4_B[1])} r={4} className="fill-[#0f1b2d]" />
                <circle cx={X4.sx(X4_A[0])} cy={X4.sy(X4_A[1])} r={4} className="fill-[#0f1b2d]" />
                <Label f={X4} at={X4_B} dx={9} dy={10} anchor="start" size={12} weight={700}>
                  b
                </Label>
                <Label f={X4} at={X4_A} dx={-9} dy={-2} anchor="end" size={12} weight={700}>
                  a
                </Label>
              </g>
            )}
          </Plane>
        </div>
        <div className="w-36 text-sm leading-snug">
          <div className="h-11">
            {k >= 2 && (
              <div className={FADE}>
                <b className="font-mono text-cat-blue">a − b = (6, 8)</b>
                <div className="text-muted">
                  দৈর্ঘ্য <span className="font-mono">10</span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 h-11">
            {k >= 3 && (
              <div className={FADE}>
                <b className="font-mono text-cat-coral">b − a = {tup([-6, -8])}</b>
                <div className="text-muted">
                  দৈর্ঘ্য <b className="font-mono text-cat-amber">?</b>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: নাসিব's claim. He struts
//      up to the Gate and says he'll make an arrow out of it with length 0,
//      then a negative one, so the judging means nothing; ফাহিম, whose rule it
//      is, is left scratching his head. Whether he can is the screen's job.

const NC_Y = 150;

export function NasibClaims() {
  const s = useScene(4, [600, 1600, 2600, 2500]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="নাসিব walks up to the Gate and claims an arrow of length 0, even a negative one, so the judging means nothing">
        <Gate x={36} y={NC_Y} />
        <Person who="fahim" x={112} y={NC_Y} mood={k >= 4 ? "puzzled" : "plain"} label />
        <Person who="nasib" x={k >= 1 ? 214 : 370} y={NC_Y} ms={1400} facing={-1} walking={k === 1} mood="smug" arm={k >= 2 ? "point" : "down"} label />
        {k === 2 && <Bubble x={214} y={NC_Y - 66} lines={["Gate থেকে বের হবে,", "তবু দৈর্ঘ্য 0!"]} />}
        {k === 3 && <Bubble x={214} y={NC_Y - 66} lines={["negative-ও", "বানিয়ে দেখাবো!"]} />}
        {k >= 4 && <Bubble x={214} y={NC_Y - 66} side="left" lines={["তাহলে বিচারটাই", "অর্থহীন!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · A challenge that can't be won: an arrow of length 0 that isn't at the
//     gate, or a negative length. The squares under the readout never dip.

const FZ = makeFrame(-4, 4, -4, 4, 30);
const keyOf = (p: XY) => p.join(",");
const fromKey = (k: string) => k.split(",").map(Number) as XY;

export function NoZero() {
  const pass = useGate();
  const [tip, setTip] = useSeed<XY>("tip", [2, 3]);
  const [tried, setTried] = useSeed<string[]>("tried", ["2,3"]);
  const pts = tried.map(fromKey);
  const neg = pts.some((p) => p[0] < 0 || p[1] < 0);
  const home = tried.includes("0,0");
  const many = tried.length >= 6;
  const done = neg && home && many;
  const away = pts.filter((p) => !same(p, O));
  const least = away.length ? Math.min(...away.map((p) => len(p))) : null;
  const L = len(tip);

  const put = (p: XY) => {
    const t = snap(p, FZ);
    setTip(t);
    const k = keyOf(t);
    if (tried.includes(k)) return;
    const next = [...tried, k];
    setTried(next);
    const np = next.map(fromKey);
    if (!done && next.length >= 6 && next.includes("0,0") && np.some((q) => q[0] < 0 || q[1] < 0))
      pass("যেখানেই নিয়ে যান, বর্গ কখনো negative হয় না, তাই দৈর্ঘ্যও হয় না। আর দৈর্ঘ্য 0 হয় শুধু Gate-এ দাঁড়িয়ে থাকলে।");
  };

  return (
    <>
      <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-2 text-center text-sm">
        <div className="rounded-xl border-2 border-dashed border-cat-amber/60 px-2 py-2">Gate ছাড়া অন্য কোথাও এমন একটা arrow, যার দৈর্ঘ্য 0</div>
        <div className="rounded-xl border-2 border-dashed border-cat-amber/60 px-2 py-2">এমন একটা arrow, যার দৈর্ঘ্য 0-এর চেয়েও কম</div>
      </div>
      <Plane f={FZ} ticks={1} label={`an arrow from the gate to ${tup(tip)}, length ${f2(L)}`} drag={{ down: put, move: put }} onKey={nudger((d) => put(plus(tip, d)))} className="max-w-[17rem]">
        <Arrow f={FZ} from={O} to={tip} tone="teal" w={3} />
        <circle cx={FZ.sx(tip[0])} cy={FZ.sy(tip[1])} r={9} strokeWidth={2} className="pointer-events-none fill-cat-teal/20 stroke-cat-teal" />
      </Plane>
      <div className="mx-auto max-w-sm rounded-2xl bg-cat-teal/5 px-4 py-3 text-center font-mono">
        <div>
          {sq(tip[0])} + {sq(tip[1])} = {tip[0] * tip[0]} + {tip[1] * tip[1]} = {tip[0] * tip[0] + tip[1] * tip[1]}
        </div>
        <div className="text-lg">
          দৈর্ঘ্য ={" "}
          <b key={keyOf(tip)} className={`${POP} inline-block ${same(tip, O) ? "text-cat-amber" : "text-cat-teal"}`}>
            {f2(L)}
          </b>
        </div>
      </div>
      <div className="mt-2 min-h-7 text-center text-[0.95rem]">
        {same(tip, O) ? (
          <span className={FADE}>দৈর্ঘ্য 0 ঠিকই, কিন্তু এটা তো Gate নিজেই। Arrow তো কোথাও যায়ইনি।</span>
        ) : least !== null ? (
          <span className="text-muted">
            Gate ছাড়া এখন পর্যন্ত পাওয়া সবচেয়ে ছোট দৈর্ঘ্য: <b className="font-mono">{f2(least)}</b>
          </span>
        ) : null}
      </div>
      {done && (
        <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-4 py-3 text-center text-[0.95rem]`}>
          Minus-এর দিকে গেলেও বর্গ করার পর সংখ্যাগুলো plus হয়ে যায়। তাই challenge দুইটাই আসলে অসম্ভব।
        </div>
      )}
      <Ticks
        items={[
          ["minus-এর দিকে", neg],
          ["Gate-এ ফিরে", home],
          [`ছয় জায়গায় (${bn(Math.min(tried.length, 6))}/৬)`, many],
        ]}
      />
      <Task done={done}>Arrow-এর মাথা টেনে যেখানে খুশি নিয়ে যান। Challenge দুইটার কোনো একটা পারেন কিনা, দেখুন তো।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: why a square is never
//      negative. −2 and 2 sit on either side of 0; each becomes a square of
//      tiles on its own side, and both squares hold the same 4 tiles. A
//      count of tiles has no minus to carry.

const ST_NUMS = [-2, 2];

export function SquareTiles() {
  const s = useScene(3, [500, 1100, 1100]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        <span key={k} className={FADE}>
          {k < 2
            ? "একটা −2, একটা 2। একটা 0-এর বাঁয়ে, আরেকটা ডানে।"
            : k === 2
              ? "বর্গ মানে পাশাপাশি সাজানো tile গোনা। দুইটা square-এ tile সমান সমান।"
              : "Tile গুনলে কখনো minus আসে না। তাই বর্গ কখনো negative হয় না।"}
        </span>
      }
    >
      <div className="flex items-end justify-center gap-8">
        {ST_NUMS.map((n) => (
          <div key={n} className="flex w-24 flex-col items-center">
            <div className="grid h-24 place-items-end">
              {k >= 2 ? (
                <div className="grid grid-cols-2 gap-1">
                  {Array.from({ length: 4 }, (_, i) => (
                    <span
                      key={i}
                      style={{ transitionDelay: `${i * 120}ms` }}
                      className={`${POP} size-8 rounded-md border ${n < 0 ? "border-cat-coral bg-cat-coral/15" : "border-cat-blue bg-cat-blue/15"}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <div className={`mt-2 font-mono text-2xl font-bold ${n < 0 ? "text-cat-coral" : "text-cat-blue"}`}>
              {k >= 2 ? sq(n) : sg(n)}
            </div>
            <div className="h-7 font-mono text-xl font-bold">{k >= 3 ? <span className={POP}>= 4</span> : null}</div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5¾ · A figure for screen 5's explanation, no task: when the sum can be 0.
//      (2, 1) holds 4 + 1 = 5 tiles; zero one slot, (0, 1), and the other
//      slot's tile stays; zero both, (0, 0), and only then no tiles, length 0,
//      the arrow shrunk to a dot at the Gate: the zero vector.

const X5 = makeFrame(-0.5, 2.5, -0.5, 1.5, 34, 10);
const X5_TIPS: XY[] = [
  [2, 1],
  [2, 1],
  [0, 1],
  [0, 0],
];
const X5_SAY = [
  "(2, 1): বর্গ দুইটা 4 আর 1, কোনোটাই minus না। যোগ 5।",
  "(2, 1): বর্গ দুইটা 4 আর 1, কোনোটাই minus না। যোগ 5।",
  "(0, 1): একটা ঘর 0, তবু অন্যটার বর্গ রয়ে গেল। যোগ 1।",
  "(0, 0): দুইটা ঘরই 0, তবেই যোগ 0। Arrow তখন কোথাও যায় না।",
];

export function OnlyZero() {
  const s = useScene(3, [600, 1600, 1700]);
  const k = s.k;
  const tip = X5_TIPS[k];
  const [x, y] = useTween(tip, 800);
  const sum = tip[0] ** 2 + tip[1] ** 2;
  return (
    <Scene scene={s} caption={beatSay(k, X5_SAY)}>
      <div className="flex items-center justify-center gap-4">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={X5} ticks={1} label={`an arrow from the Gate to ${tup(tip)}: its squares add to ${sum}`} className="my-0! max-w-none">
            <Arrow f={X5} from={O} to={[x, y]} tone="teal" w={3} />
            {k >= 3 && (
              <g className={POP}>
                <circle cx={X5.sx(0)} cy={X5.sy(0)} r={6} className="fill-cat-teal" />
                <text x={X5.sx(0) + 10} y={X5.sy(0) - 8} fontSize={10} fontWeight={700} className="fill-cat-teal">
                  zero vector
                </text>
              </g>
            )}
          </Plane>
        </div>
        <div className="w-40 text-sm leading-snug">
          <div key={`s${k}`} className={`${FADE} font-mono`}>
            {sq(tip[0])} + {sq(tip[1])} = <b className="text-cat-teal">{sum}</b>
          </div>
          <div className="mt-1.5 flex h-4 gap-1">
            {Array.from({ length: sum }, (_, i) => (
              <span key={`${k}-${i}`} style={{ transitionDelay: `${i * 90}ms` }} className={`${POP} size-4 rounded-sm border border-cat-teal bg-cat-teal/20`} />
            ))}
          </div>
          <div key={`l${k}`} className={`${FADE} mt-2`}>
            দৈর্ঘ্য{" "}
            <span className="font-mono">
              = √{sum} = <b className="text-cat-teal">{Number.isInteger(Math.sqrt(sum)) ? Math.sqrt(sum) : f2(Math.sqrt(sum))}</b>
            </span>
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: নাসিব's second go. By the
//      sherbet stall he turns his back on it, walks the other way from the Gate
//      (an arrow on the ground behind him), and turns round: walking backwards
//      must make the length minus. Whether it does is the screen's job.

const NF_Y = 150;
const NF_GATE = 188;

export function NasibFlips() {
  const s = useScene(3, [600, 2500, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="নাসিব turns and walks the other way from the Gate, and says the length must now be minus">
        <Stall x={284} y={NF_Y} sign="শরবত" color="#f97316" />
        <Gate x={NF_GATE} y={NF_Y} />
        {k >= 2 && (
          <g className={FADE}>
            <Draw d={`M${NF_GATE} 171H62`} ms={1500} strokeWidth={2.4} className="stroke-[#dc2626]" />
            <path d="M68 166l-8 5l8 5" fill="none" stroke="#dc2626" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        <Person
          who="nasib"
          x={k >= 2 ? 62 : NF_GATE + 34}
          y={NF_Y}
          ms={1500}
          facing={k === 0 || k >= 3 ? 1 : -1}
          walking={k === 2}
          mood={k >= 1 ? "smug" : "plain"}
          arm={k === 1 ? "hold" : k >= 3 ? "point" : "down"}
          label
        />
        {k === 1 && <Bubble x={NF_GATE + 34} y={NF_Y - 74} side="right" lines={["আমার card", "উল্টো দিকের!"]} />}
        {k >= 3 && <Bubble x={62} y={NF_Y - 74} side="right" lines={["উল্টো দিকে হাঁটলে", "দৈর্ঘ্যও minus, তাই না?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · 3.2's stretch knob on (1, 2), now with a length readout. Predict the
//     length at λ = −2 first; the table of visits shows length = |λ| · 2.24.

const FL = makeFrame(-3, 3, -5, 5, 22);
const SV: XY = [1, 2];
const SV_LEN = len(SV);
const S_GUESS = ["−4.47, কারণ উল্টো দিকে গেছে", "4.47, মানে আগের দ্বিগুণ", "2.24, আগের মতোই"];
const S_TARGETS = [2, -1, -2];

export function StretchTape() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [k, setK] = useSeed("k", 1);
  const [seen, setSeen] = useSeed<number[]>("seen", [1]);
  const hit = S_TARGETS.filter((t) => seen.includes(t)).length;
  const all = hit === S_TARGETS.length;
  const tip: XY = [k * SV[0], k * SV[1]];

  const turn = (n: number) => {
    setK(n);
    if (seen.includes(n)) return;
    const next = [...seen, n];
    setSeen(next);
    if (!all && S_TARGETS.every((t) => next.includes(t))) pass("λ দিয়ে stretch করলে দৈর্ঘ্যও ঠিক ততগুণ হয়, শুধু minus চিহ্নটা বাদ দিয়ে। উল্টে দিলে দিক বদলায়, দৈর্ঘ্য বদলায় না।");
  };

  return (
    <>
      <div className="mt-4 text-sm font-medium text-muted">(1, 2)-এর দৈর্ঘ্য 2.24। এবার λ = −2 দিয়ে গুণ করলে নতুন arrow-টা কতটা লম্বা হবে?</div>
      <div className="mt-2 grid gap-2">
        {S_GUESS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, all, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {guess !== null && (
        <div className={FADE}>
          <Plane f={FL} ticks={1} label={`(1, 2) times ${k} is ${tup(tip)}, length ${f2(len(tip))}`} className="max-w-[14rem]">
            <Arrow f={FL} from={O} to={SV} tone="ink" w={2} dashed faint />
            <Arrow f={FL} from={O} to={tip} tone={k < 0 ? "coral" : "blue"} w={3} />
            {k === 0 && <circle cx={FL.sx(0)} cy={FL.sy(0)} r={5} className="fill-cat-violet" />}
          </Plane>
          <div className="text-center font-mono text-lg">
            <span key={k} className={`${POP} inline-block font-bold`}>
              {sg(k)}
            </span>{" "}
            × (1, 2) = <b className={k < 0 ? "text-cat-coral" : "text-cat-blue"}>{tup(tip)}</b>
          </div>
          <div className="text-center">
            দৈর্ঘ্য <b className="font-mono text-lg text-cat-teal">{f2(len(tip))}</b>
          </div>
          <label className="mx-auto mt-3 flex max-w-sm items-center gap-3">
            <span className="shrink-0 font-serif text-lg italic text-muted">λ</span>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.5}
              value={k}
              aria-label="λ, কত গুণ"
              onChange={(e) => turn(Number(e.target.value))}
              className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
            />
          </label>
          <div className="mt-3 overflow-x-auto">
            <table className="mx-auto text-center font-mono tabular-nums">
              <thead>
                <tr className="font-sans text-xs text-muted">
                  <th className="px-3 pb-1 font-normal">λ</th>
                  <th className="px-3 pb-1 font-normal">arrow</th>
                  <th className="px-3 pb-1 font-normal">দৈর্ঘ্য</th>
                  {all && <th className="px-3 pb-1 font-normal">2.24-এর কত গুণ</th>}
                </tr>
              </thead>
              <tbody>
                {[...seen]
                  .sort((a, b) => b - a)
                  .map((s) => (
                    <tr key={s} className={`${FADE} ${s === k ? "bg-cat-blue/5" : ""}`}>
                      <td className="px-3">{sg(s)}</td>
                      <td className="px-3">{tup([s * SV[0], s * SV[1]])}</td>
                      <td className="px-3 font-bold text-cat-teal">{f2(Math.abs(s) * SV_LEN)}</td>
                      {all && <td className={`${FADE} px-3`}>{Math.abs(s)}</td>}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Ticks items={S_TARGETS.map((t) => [`λ = ${sg(t)}`, seen.includes(t)])} />
        </div>
      )}
      <Task done={all}>
        আগে একটা guess দিন। তারপর λ বদলে তিনটা মানই একবার করে দেখুন ({bn(hit)}/{bn(S_TARGETS.length)})।
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6¼ · A figure for screen 6's explanation, no task: the table's last column,
//      replayed calmly. (1, 2) is 2.24; λ = 2 sends it forward, 4.47; λ = −2
//      sends it back, 4.47 again. Both get a "× 2": the direction flipped, the
//      size did not.

const X6 = makeFrame(-2.5, 2.5, -4.5, 4.5, 12, 10);
const X6_ROWS = [1, 2, -2];
const X6_L = [1, 1, 2, -2, -2];
const X6_SAY = [
  "(1, 2), দৈর্ঘ্য 2.24।",
  "(1, 2), দৈর্ঘ্য 2.24।",
  "λ = 2: সামনের দিকে, দ্বিগুণ লম্বা।",
  "λ = −2: এবার পেছনের দিকে।",
  "দুইবারই 4.47, মানে 2.24-এর দ্বিগুণ। দিক উল্টো, মাপ একই।",
];

export function TwiceBothWays() {
  const s = useScene(4, [600, 1400, 1600, 1600]);
  const k = s.k;
  const l = X6_L[k];
  const [x, y] = useTween([l * SV[0], l * SV[1]], 800);
  return (
    <Scene scene={s} caption={beatSay(k, X6_SAY)}>
      <div className="flex items-center justify-center gap-4">
        <div className="w-[5rem] shrink-0">
          <Plane f={X6} ticks={0} label={`(1, 2) times ${sg(l)} is ${tup([l, 2 * l])}, length ${f2(Math.abs(l) * SV_LEN)}`} className="my-0! max-w-none">
            <Arrow f={X6} from={O} to={SV} tone="ink" w={1.6} dashed faint />
            {k >= 4 && <Arrow f={X6} from={O} to={[2, 4]} tone="blue" w={2.6} faint />}
            <Arrow f={X6} from={O} to={[x, y]} tone={l < 0 ? "coral" : "blue"} w={3} />
          </Plane>
        </div>
        <table className="font-mono text-sm tabular-nums">
          <thead>
            <tr className="font-sans text-xs text-muted">
              <th className="px-1.5 pb-1 font-normal">λ</th>
              <th className="px-1.5 pb-1 font-normal">arrow</th>
              <th className="px-1.5 pb-1 text-left font-normal">দৈর্ঘ্য</th>
            </tr>
          </thead>
          <tbody>
            {X6_ROWS.map(
              (r, i) =>
                k > i && (
                  <tr key={r} className={`${FADE} h-7`}>
                    <td className="px-1.5 text-center">{sg(r)}</td>
                    <td className={`px-1.5 ${r < 0 ? "text-cat-coral" : "text-cat-blue"}`}>{tup([r, 2 * r])}</td>
                    <td className="w-20 px-1.5 font-bold text-cat-teal">
                      {f2(Math.abs(r) * SV_LEN)}
                      {k >= 4 && r !== 1 && <span className={`${POP} ml-1 inline-block rounded bg-cat-teal/15 px-1 text-xs`}>× 2</span>}
                    </td>
                  </tr>
                ),
            )}
          </tbody>
        </table>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6⅜ · A figure for screen 6's explanation, no task: home to school and back.
//      নাসিব walks from home to school, a blue tape unrolling under the road
//      behind him; then walks back, a red tape unrolling the other way. The
//      two tapes get the same ticks, end to end, and he has to admit it.

const X6H_Y = 150;
const X6H_HOME = 70;
const X6H_SCHOOL = 244;
/** the tapes' tick marks, the same for both, so the two can be compared at a glance */
const X6H_TICKS = Array.from({ length: 9 }, (_, i) => X6H_HOME + ((X6H_SCHOOL - X6H_HOME) * (i + 1)) / 10);

function X6hTape({ y, from, to, ink, ticks }: { y: number; from: number; to: number; ink: string; ticks: boolean }) {
  const d = Math.sign(to - from);
  return (
    <g>
      <Draw d={`M${from} ${y}H${to - 4 * d}`} ms={2000} strokeWidth={2.4} className={ink} />
      <path d={`M${to - 6 * d} ${y - 4}L${to} ${y}L${to - 6 * d} ${y + 4}`} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transitionDelay: "1900ms" }} className={`${FADE} fill-none ${ink}`} />
      {ticks && <path d={X6H_TICKS.map((x) => `M${x} ${y - 3}V${y + 3}`).join("")} strokeWidth={1.4} className={`${FADE} ${ink}`} />}
    </g>
  );
}

export function HomeSchool() {
  const s = useScene(3, [600, 2400, 2500]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="নাসিব walks from home to school and back; the tape for going and the tape for coming back come out the same length">
        <Building x={4} y={X6H_Y} w={56} h={62} color="#fde2c4" label="বাসা" />
        <Building x={256} y={X6H_Y} w={60} h={96} roof label="স্কুল" />
        {k >= 1 && <X6hTape y={166} from={X6H_HOME} to={X6H_SCHOOL} ink="stroke-[#2563eb]" ticks={k >= 3} />}
        {k >= 2 && <X6hTape y={174} from={X6H_SCHOOL} to={X6H_HOME} ink="stroke-[#dc2626]" ticks={k >= 3} />}
        {k >= 1 && (
          <text x={X6H_SCHOOL + 6} y={169} fontSize={8} fontWeight={700} fill="#1d4ed8" className={FADE}>
            যাওয়া
          </text>
        )}
        {k >= 2 && (
          <text x={X6H_HOME - 6} y={177} textAnchor="end" fontSize={8} fontWeight={700} fill="#b91c1c" className={FADE}>
            ফেরা
          </text>
        )}
        <Person who="nasib" x={k === 1 ? X6H_SCHOOL - 10 : X6H_HOME + 10} y={X6H_Y} ms={2000} facing={k === 2 ? -1 : 1} walking={k === 1 || k === 2} mood={k >= 3 ? "sad" : "smug"} />
        {k >= 3 && <Bubble x={X6H_HOME + 10} y={X6H_Y - 66} side="right" lines={["যাওয়া আর ফেরা,", "রাস্তা তো একই লম্বা…"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: two bars go up around a
//      number and its minus drops off. On the number line only the stretch
//      from 0 is left, which is what the bars keep.

const ABS_NUMS = [-2, -4, 3];
const FN = makeFrame(-5, 5, -0.5, 0.9, 24, 14);
const BAR = "inline-block text-cat-teal transition-[opacity,translate] duration-500 motion-reduce:transition-none";

export function AbsBars() {
  const [pick, setPick] = useSeed("pick", 0);
  const [on, setOn] = useSeed("on", false);
  const n = ABS_NUMS[pick];
  const neg = n < 0;
  const size = Math.abs(n);

  const choose = (i: number) => {
    setPick(i);
    setOn(false);
  };

  return (
    <div className={`my-4 ${GROW}`}>
      <div className="flex justify-center gap-2">
        {ABS_NUMS.map((x, i) => (
          <button key={x} type="button" onClick={() => choose(i)} className={pill(pick === i)}>
            {sg(x)}
          </button>
        ))}
      </div>
      <div key={pick} className="mt-4 flex h-12 items-baseline justify-center font-mono text-4xl font-bold tabular-nums" aria-label={on ? `|${sg(n)}| = ${size}` : sg(n)}>
        <span className={`${BAR} ${on ? "translate-x-0 opacity-100" : "-translate-x-5 opacity-0"}`}>|</span>
        {neg && (
          <span
            className={`inline-block text-cat-coral transition-all duration-700 motion-reduce:transition-none ${
              on ? "max-w-0 translate-y-10 rotate-90 opacity-0 delay-300" : "max-w-[1ch]"
            }`}
          >
            −
          </span>
        )}
        <span>{size}</span>
        <span className={`${BAR} ${on ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0"}`}>|</span>
        {on && <span className={`${FADE} ml-3 text-cat-teal delay-700`}>= {size}</span>}
      </div>
      <Plane f={FN} grid={0} ticks={1} label={`the number line: ${sg(n)} is ${size} steps from 0`} className="mt-2 max-w-[17rem]">
        {on && <Draw key={`d${pick}`} d={`M${FN.sx(0)} ${FN.sy(0)}H${FN.sx(n)}`} strokeWidth={5} ms={700} delay={500} className="stroke-cat-teal/70" />}
        {on && (
          <Label f={FN} at={[n / 2, 0]} dy={-9} className={`${FADE} fill-cat-teal delay-700`}>
            0 থেকে {bn(size)} ঘর
          </Label>
        )}
        <circle cx={FN.sx(n)} cy={FN.sy(0)} r={6} className={neg ? "fill-cat-coral" : "fill-cat-blue"} />
      </Plane>
      <div className="mx-auto mt-2 min-h-10 max-w-xs text-center text-sm text-muted">
        {!on
          ? "সংখ্যাটার দুই পাশে এক জোড়া খাড়া দাগ বসিয়ে দেখুন।"
          : neg
            ? "Minus চিহ্নটা খসে পড়লো। থাকলো শুধু 0 থেকে কত ঘর দূরে, সেটুকু।"
            : "এর তো minus নাই, তাই দাগ বসালেও যা ছিল তাই। 0 থেকে দূরত্ব সেই একই।"}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={() => setOn(!on)} className={on ? quietBtn : primaryBtn}>
          {on ? "দাগ সরান" : "খাড়া দাগ বসান"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: this time the objection is
//      ফাহিম's own. He steps out from the Gate and shouts that the rule is
//      wrong, that he walked the most and walking should count, while the
//      others look on; then his first two cards come back to him, (3, 1) and
//      (1, 4). Whether walked and straight can ever match is the screen's job.

const FO_Y = 150;

export function FahimObjects() {
  const s = useScene(4, [600, 2200, 2600, 2400]);
  const k = s.k;
  const fx = k >= 1 ? 116 : 72;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="ফাহিম objects: he walked the most, so walking should count; then his two cards (3, 1) and (1, 4) come back">
        <Gate x={30} y={FO_Y} />
        <Person who="som" x={190} y={FO_Y} facing={-1} mood={k >= 1 ? "puzzled" : "plain"} label />
        <Person who="samin" x={245} y={FO_Y} facing={-1} mood={k >= 2 ? "puzzled" : "happy"} label />
        <Person who="nasib" x={298} y={FO_Y} facing={-1} mood={k >= 1 ? "smug" : "plain"} label />
        <Person who="fahim" x={fx} y={FO_Y} ms={900} walking={k === 1} mood={k >= 4 ? "plain" : "shout"} arm={k >= 4 ? "hold" : k >= 1 ? "wave" : "down"} label />
        {k === 1 && <Bubble x={fx} y={FO_Y - 66} lines={["নিয়মটা ভুল!"]} />}
        {k === 2 && <Bubble x={fx} y={FO_Y - 66} lines={["আমি তো সবার চেয়ে", "বেশি হেঁটেছি!"]} />}
        {k === 3 && <Bubble x={fx} y={FO_Y - 66} lines={["হাঁটাটাই", "গোনা উচিত!"]} />}
        {k >= 4 && (
          <>
            <CastCard x={fx - 24} y={FO_Y - 76} text="(3, 1)" />
            <CastCard x={fx + 26} y={FO_Y - 76} text="(1, 4)" />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · The detour. Card (3, 1), then card (1, 4) turned any way the reader
//     drags it. First ফাহিম walks it once, so the two meters are seen filling:
//     the walked one as he goes, the straight one only when he stops. Then
//     card 2 swings out and back once by itself, away from the answer, so the
//     reader sees which meter moves before taking hold of it. The walked meter
//     never moves; the straight one only catches up when both legs point the
//     same way. Callback: the golf ball's 84.9.

const FD = makeFrame(-2, 8, -4, 6, 26);
const DU: XY = [3, 1];
const DU_LEN = len(DU);
const DV_LEN = len([1, 4]);
const WALKED = DU_LEN + DV_LEN;
const toDeg = (r: number) => (r * 180) / Math.PI;
const DU_DEG = toDeg(Math.atan2(DU[1], DU[0]));
const DV_DEG = toDeg(Math.atan2(4, 1));
const legOf = (deg: number): XY => [DV_LEN * Math.cos((deg * Math.PI) / 180), DV_LEN * Math.sin((deg * Math.PI) / 180)];

const WALK_MS = 2600;
/** after the walk, card 2 swings out once and back by itself, to show which meter moves */
const SWING_MS = 1200;
const SWING_DEG = 70;

export function Detour() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", DV_DEG);
  const [lined, setLined] = useSeed("lined", false);
  const [walked, setWalked] = useSeed("walked", false);
  const [walking, setWalking] = useState(false);
  const walkPlay = usePlay(WALK_MS);
  // 0 → 1 along card 1, 1 → 2 along card 2
  const [t] = useTween([walking || walked ? 2 : 0], WALK_MS);
  // The demo swing: out on beat 0, back on beat 1, a breath on beat 2; hands off meanwhile.
  const swing = usePlay(SWING_MS);
  const [sw] = useTween([swing.running && swing.k === 0 ? 1 : 0], SWING_MS - 100);
  const end = plus(DU, legOf(deg + SWING_DEG * sw));
  const far = len(end);
  const walker = t <= 1 ? mix(O, DU, t) : mix(DU, end, t - 1);
  const sofar = Math.min(t, 1) * DU_LEN + Math.max(0, t - 1) * DV_LEN;

  const walk = () => {
    setWalking(true);
    walkPlay.play(1, () => {
      setWalked(true);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) swing.play(3);
    });
  };
  const turn = (d: number) => {
    if (lined || !walked || swing.running) return;
    let a = ((Math.round(d) % 360) + 360) % 360;
    if (Math.abs(a - DU_DEG) < 3) a = DU_DEG;
    setDeg(a);
    if (a === DU_DEG) {
      setLined(true);
      pass("ঘুরপথ কখনো সোজা পথের চেয়ে ছোট হয় না। সমান হয় শুধু তখন, যখন দুইটা card একই দিকে যায়।");
    }
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? 5 : e.key === "ArrowRight" || e.key === "ArrowDown" ? -5 : 0;
    if (!step) return;
    e.preventDefault();
    turn(deg + step);
  };

  return (
    <>
      <Plane
        f={FD}
        ticks={2}
        label={`card (3, 1), then card 2 turned to end at ${tup(end.map((n) => Math.round(n * 10) / 10))}; walked ${f2(WALKED)}, straight ${f2(far)}`}
        drag={lined || !walked || swing.running ? undefined : { down: (p) => turn(toDeg(Math.atan2(p[1] - DU[1], p[0] - DU[0]))), move: (p) => turn(toDeg(Math.atan2(p[1] - DU[1], p[0] - DU[0]))) }}
        onKey={lined || !walked || swing.running ? undefined : onKey}
        className="max-w-[19rem]"
      >
        {walked && <circle cx={FD.sx(DU[0])} cy={FD.sy(DU[1])} r={DV_LEN * FD.u} strokeWidth={1.2} strokeDasharray="4 5" className={`${FADE} pointer-events-none fill-none stroke-cat-coral/40`} />}
        {walked && (
          <g className={FADE}>
            <Arrow f={FD} from={O} to={end} tone="teal" w={2.4} dashed={!lined} />
          </g>
        )}
        <Arrow f={FD} from={O} to={DU} tone="blue" w={3} />
        <Arrow f={FD} from={DU} to={end} tone="coral" w={3} />
        {(walking || walked) && !walked && (
          <>
            <path d={`M${FD.sx(0)} ${FD.sy(0)}L${FD.sx(Math.min(t, 1) * DU[0])} ${FD.sy(Math.min(t, 1) * DU[1])}${t > 1 ? `L${FD.sx(walker[0])} ${FD.sy(walker[1])}` : ""}`} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none fill-none stroke-cat-violet/50" />
            <circle cx={FD.sx(walker[0])} cy={FD.sy(walker[1])} r={7} strokeWidth={2} className="pointer-events-none fill-surface stroke-cat-violet" />
          </>
        )}
        {walked && !lined && <circle cx={FD.sx(end[0])} cy={FD.sy(end[1])} r={9} strokeWidth={2} className="pointer-events-none fill-cat-coral/20 stroke-cat-coral" />}
      </Plane>
      <div className="mx-auto max-w-sm">
        <div className="flex items-baseline justify-between text-sm">
          <span>
            হেঁটেছে, <span className="font-mono">‖u‖ + ‖v‖</span>
          </span>
          <span className="font-mono">
            {walked ? (
              <>
                {f2(DU_LEN)} + {f2(DV_LEN)} = <b>{f2(WALKED)}</b>
              </>
            ) : (
              <b>{f2(sofar)}</b>
            )}
          </span>
        </div>
        <div className="mt-1 h-4 rounded-md bg-foreground/5">
          <div style={{ width: `${(sofar / WALKED) * 100}%` }} className="h-full rounded-md bg-cat-violet/70" />
        </div>
        <div className="mt-3 flex items-baseline justify-between text-sm">
          <span>
            Gate থেকে সোজা দূরত্ব, <span className="font-mono">‖u + v‖</span>
          </span>
          <b className="font-mono text-cat-teal">{walked ? f2(far) : "?"}</b>
        </div>
        <div className="mt-1 h-4 rounded-md bg-foreground/5">
          <div style={{ width: `${walked ? (far / WALKED) * 100 : 0}%` }} className="h-full rounded-md bg-cat-teal transition-[width] duration-500 motion-reduce:transition-none" />
        </div>
        {walked && swing.running ? (
          <div className={`${FADE} mt-1 text-center text-sm text-muted`}>দেখুন, লাল card ঘুরলে বেগুনি দাগ একচুলও নড়ে না। বদলায় শুধু সবুজটা।</div>
        ) : walked ? (
          <div className="mt-1 text-center text-sm text-muted">
            পার্থক্য <b className="font-mono">{f2(WALKED - far)}</b>
          </div>
        ) : (
          <div className="mt-3 flex justify-center">
            <button type="button" onClick={walk} disabled={walking} className={primaryBtn}>
              ফাহিমকে হাঁটান
            </button>
          </div>
        )}
      </div>
      {lined && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-accent/10 px-4 py-3 text-center text-[0.95rem]`}>
          দুইটা card এক লাইনে আসতেই মাপ দুইটা মিলে গেল। Golf ball-এর বেলায় ঠেলা ছিল 60 আর 60, কিন্তু দুই দিকে। তাই বেগ হয়েছিল √(60² + 60²) = <b className="font-mono">84.9</b>, 120 না।
        </div>
      )}
      <Task done={lined}>আগে ফাহিমকে একবার হাঁটান। তারপর লাল card-টার মাথা ধরে ঘোরান, মাপ দুইটা সমান করতে পারেন কিনা দেখুন তো।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7¼ · A figure for screen 7's explanation, no task: the village footpath.
//      Two people set off together from one corner of a field, at the same
//      pace: করিম keeps to the আল round two sides, মামা cuts across the
//      corner. মামা is there first and waits; then the grass wears into a
//      footpath along his line, the way it does in every village.

type X7Pt = [number, number];
const X7F_A: X7Pt = [44, 170];
const X7F_B: X7Pt = [264, 170];
const X7F_C: X7Pt = [234, 84];
const X7F_D: X7Pt = [98, 84];
/** both walk at this pace, in stage units per ms, so the one who arrives first walked less */
const X7F_PACE = 0.1;
const x7fMs = (p: X7Pt, q: X7Pt) => Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / X7F_PACE);
const X7F_AB = x7fMs(X7F_A, X7F_B);
const X7F_BC = x7fMs(X7F_B, X7F_C);
const X7F_AC = x7fMs(X7F_A, X7F_C);
const X7F_BEATS = [700, X7F_AB + 100, X7F_BC + 800];
const X7F_ANGLE = (Math.atan2(X7F_C[1] - X7F_A[1], X7F_C[0] - X7F_A[0]) * 180) / Math.PI;

export function FieldShortcut() {
  const s = useScene(3, X7F_BEATS);
  const k = s.k;
  const [kx, ky] = k >= 2 ? [X7F_C[0] + 12, X7F_C[1] + 2] : k === 1 ? X7F_B : X7F_A;
  const [mx, my] = k >= 1 ? [X7F_C[0] - 12, X7F_C[1]] : [X7F_A[0] + 14, X7F_A[1]];
  const line = (p: X7Pt, q: X7Pt) => `M${p[0]} ${p[1]}L${q[0]} ${q[1]}`;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" ground={62} label="two people cross a field from one corner to the far one: one keeps to the edges, one cuts across and arrives first; a footpath wears in along the diagonal">
        <Tree x={64} y={78} s={0.5} />
        <Tree x={286} y={80} s={0.6} />
        <path d={`M${X7F_A.join(" ")}L${X7F_B.join(" ")}L${X7F_C.join(" ")}L${X7F_D.join(" ")}Z`} fill="#6fae52" stroke="#a16207" strokeWidth={3} strokeLinejoin="round" />
        {k >= 3 && (
          <g className={FADE}>
            <path d={line(X7F_A, X7F_C)} stroke="#d6b98c" strokeWidth={9} strokeLinecap="round" />
            <text x={0} y={-8} transform={`translate(${(X7F_A[0] + X7F_C[0]) / 2 - 8} ${(X7F_A[1] + X7F_C[1]) / 2}) rotate(${X7F_ANGLE})`} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#78350f">
              পায়ে-চলা পথ
            </text>
          </g>
        )}
        {k >= 1 && <Draw d={line(X7F_A, X7F_B)} ms={X7F_AB} strokeWidth={2} className="stroke-[#fef3c7]" />}
        {k >= 2 && <Draw d={line(X7F_B, X7F_C)} ms={X7F_BC} strokeWidth={2} className="stroke-[#fef3c7]" />}
        {k >= 1 && k < 3 && <Draw d={line(X7F_A, X7F_C)} ms={X7F_AC} strokeWidth={2} className="stroke-[#fde68a]" />}
        <Person who="mama" x={mx} y={my} ms={X7F_AC} scale={0.62} walking={k === 1} facing={1} mood={k >= 2 ? "happy" : "plain"} />
        <Person who="karim" x={kx} y={ky} ms={k >= 2 ? X7F_BC : X7F_AB} scale={0.62} walking={k === 1 || k === 2} facing={k >= 2 ? -1 : 1} />
        {k >= 2 && <Bubble x={mx} y={my - 42} side="left" lines={["আগেই পৌঁছে গেলাম!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: 2.5's ball at (4, 3)
//      again, played by itself once it is seen. Shiku walks 4 east and 3
//      north one square at a time, 7 walked; then the tape goes straight and
//      the squares on the sides pop in, 16 + 9 = 25, so 5.

const FW = makeFrame(-3, 7, -4, 7, 17, 12);
const WALK_PATH: XY[] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [4, 1],
  [4, 2],
  [4, 3],
];
const WV_END: XY = [4, 3];
const WV_STEPS = WALK_PATH.length; // beats 1…7 walk a square each, beat 8 pulls the tape
const WV_MS = [700, 380, 380, 380, 380, 380, 380, 900];
const ptsW = (ps: XY[]) => ps.map(([x, y]) => `${FW.sx(x)},${FW.sy(y)}`).join(" ");
const W_SQUARES: { pts: XY[]; mid: XY; n: string; fill: string; ink: string; delay: string }[] = [
  { pts: [[0, 0], [4, 0], [4, -4], [0, -4]], mid: [2, -2], n: "16", fill: "fill-cat-blue/15 stroke-cat-blue", ink: "fill-cat-blue", delay: "" },
  { pts: [[4, 0], [7, 0], [7, 3], [4, 3]], mid: [5.5, 1.5], n: "9", fill: "fill-cat-coral/15 stroke-cat-coral", ink: "fill-cat-coral", delay: "delay-300" },
  { pts: [[0, 0], [4, 3], [1, 7], [-3, 4]], mid: [0.5, 3.5], n: "25", fill: "fill-cat-teal/15 stroke-cat-teal", ink: "fill-cat-teal", delay: "delay-700" },
];

export function WalkVsCrow() {
  const s = useScene(WV_STEPS, WV_MS);
  const at = Math.min(s.k, WALK_PATH.length - 1);
  const taped = s.k >= WV_STEPS;

  return (
    <Scene
      scene={s}
      caption={
        taped ? (
          <span className={FADE}>হেঁটেছে 7 ঘর, অথচ ball আছে মাত্র 5 দূরে। কোণাকুনি পথটা 2 ঘর বাঁচিয়ে দেয়।</span>
        ) : (
          "ball পর্যন্ত যেতে Shiku আগে 4 ঘর পূর্বে যায়, তারপর 3 ঘর উত্তরে। পা গুনতে থাকুন।"
        )
      }
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-[9.5rem] shrink-0">
          <Plane f={FW} axes={false} label="Shiku walks 4 east and 3 north, 7 squares; the straight tape to the ball reads 5" className="my-0! max-w-none">
            {taped &&
              W_SQUARES.map((q) => (
                <g key={q.n} className={`${POP} ${q.delay}`}>
                  <polygon points={ptsW(q.pts)} strokeWidth={1.4} className={q.fill} />
                  <Label f={FW} at={q.mid} dy={5} size={14} weight={800} className={q.ink}>
                    {q.n}
                  </Label>
                </g>
              ))}
            <Arrow f={FW} from={O} to={[4, 0]} tone="blue" w={2.4} faint={s.k > 0} />
            <Arrow f={FW} from={[4, 0]} to={WV_END} tone="coral" w={2.4} faint={s.k > 0} />
            {at > 0 && (
              <polyline points={ptsW(WALK_PATH.slice(0, at + 1))} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none fill-none stroke-cat-violet/60" />
            )}
            {taped && <Arrow f={FW} from={O} to={WV_END} tone="teal" w={3.2} draw delay={900} />}
            <circle cx={FW.sx(WV_END[0])} cy={FW.sy(WV_END[1])} r={7} strokeWidth={1.5} className="pointer-events-none fill-cat-amber stroke-[#0f1b2d]" />
            <circle
              cx={FW.sx(WALK_PATH[at][0])}
              cy={FW.sy(WALK_PATH[at][1])}
              r={6}
              strokeWidth={2}
              className="pointer-events-none fill-surface stroke-cat-violet transition-[cx,cy] duration-300 motion-reduce:transition-none"
            />
          </Plane>
        </div>
        <div className="w-36 text-sm leading-snug">
          <div className="text-muted">হেঁটেছে</div>
          <div className="font-mono">{at === 0 ? "0" : at < 7 ? <b>{at}</b> : <>4 + 3 = <b className="text-cat-violet">7</b></>}</div>
          <div className="mt-3 text-muted">ফিতা, সোজা ball পর্যন্ত</div>
          <div className="font-mono">{taped ? <span className={FADE}>√(16 + 9) = <b className="text-cat-teal">5</b></span> : "?"}</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7⅝ · A figure for screen 7's explanation, no task: the triangle and its
//      name. ফাহিম's u = (3, 1), then v = (1, 4) tip to tail, then u + v
//      straight back to the Gate; the three shut into a triangle, and the
//      numbers line up into ‖u + v‖ ≤ ‖u‖ + ‖v‖, the name landing last.

const X7 = makeFrame(-0.5, 4.5, -0.5, 5.5, 20, 10);
const X7_U: XY = [3, 1];
const X7_UV: XY = [4, 5];
const X7_SAY = [
  "ফাহিমের প্রথম card u = (3, 1), দৈর্ঘ্য 3.16।",
  "ফাহিমের প্রথম card u = (3, 1), দৈর্ঘ্য 3.16।",
  "তারপর v = (1, 4), আরও 4.12। হাঁটা হলো মোট 7.29।",
  "সোজা পথ u + v মাত্র 6.40। তিনটা arrow মিলে একটা triangle।",
  "এক বাহু কখনো বাকি দুইটার যোগফলের চেয়ে লম্বা হয় না।",
];
const X7_LINES: { at: number; ink: string; label: string; n: number }[] = [
  { at: 1, ink: "text-cat-blue", label: "‖u‖", n: len(X7_U) },
  { at: 2, ink: "text-cat-coral", label: "‖v‖", n: len([1, 4]) },
  { at: 3, ink: "text-cat-violet", label: "‖u + v‖", n: len(X7_UV) },
];

export function TriangleName() {
  const s = useScene(4, [600, 1400, 1600, 1700]);
  const k = s.k;
  const tri = [O, X7_U, X7_UV].map(([x, y]) => `${X7.sx(x)},${X7.sy(y)}`).join(" ");
  return (
    <Scene scene={s} caption={beatSay(k, X7_SAY)}>
      <div className="flex items-center justify-center gap-4">
        <div className="w-[7rem] shrink-0">
          <Plane f={X7} axes={false} label="u = (3, 1), v = (1, 4) and u + v = (4, 5) make a triangle: 6.40 ≤ 3.16 + 4.12" className="my-0! max-w-none">
            {k >= 3 && <polygon points={tri} className={`${FADE} fill-cat-violet/10`} />}
            {k >= 1 && <Arrow f={X7} from={O} to={X7_U} tone="blue" w={2.6} draw />}
            {k >= 2 && <Arrow f={X7} from={X7_U} to={X7_UV} tone="coral" w={2.6} draw />}
            {k >= 3 && <Arrow f={X7} from={O} to={X7_UV} tone="violet" w={3} draw />}
            <circle cx={X7.sx(0)} cy={X7.sy(0)} r={3.5} className="fill-[#0f1b2d]" />
          </Plane>
        </div>
        <div className="w-40 text-sm leading-snug">
          {X7_LINES.map((l) => (
            <div key={l.label} className={`h-6 font-mono ${l.ink}`}>
              {k >= l.at && (
                <span className={FADE}>
                  {l.label} = <b>{f2(l.n)}</b>
                </span>
              )}
            </div>
          ))}
          <div className="mt-1 h-12">
            {k >= 4 && (
              <div className={FADE}>
                <div className="font-mono">
                  6.40 ≤ 3.16 + 4.12
                </div>
                <b className={`${POP} inline-block text-cat-violet delay-300`}>triangle inequality</b>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A figure for screen 7's explanation, no task: 2.4's golf ball, now
//      worked out, a line at a time once it is seen: the car's 60 north, then
//      the throw's 60 tip to tail, then the sum. Pick "একই দিকে" and the same
//      two pushes play again pointing one way, and make the full 120: the one
//      case where ‖u + v‖ is as big as ‖u‖ + ‖v‖.

const FGB = makeFrame(-0.6, 3.6, -0.4, 6.4, 20, 10);
const GOLF_MODES = ["দুই দিকে", "একই দিকে"];
const GOLF_STEPS = 4;
const GOLF_MS = [500, 900, 900, 1100];
const GOLF_SAY: { say: string; math?: string }[][] = [
  [
    { say: "গাড়ি ছুটছে উত্তরে,", math: "60" },
    { say: "বল ছোড়া হলো পূর্বে,", math: "60" },
    { say: "দুইটা খাড়া, তাই বর্গ করে যোগ:", math: "60² + 60² = 7200" },
    { say: "শেষে root:", math: "√7200 ≈ 84.9" },
  ],
  [
    { say: "গাড়ি ছুটছে উত্তরে,", math: "60" },
    { say: "বলও ছোড়া হলো উত্তরে,", math: "60" },
    { say: "একই লাইনে, তাই সোজা যোগ:", math: "60 + 60" },
    { say: "মোট", math: "= 120" },
  ],
];

export function GolfSum() {
  const [mode, setMode] = useSeed("mode", 0);
  const s = useScene(GOLF_STEPS, GOLF_MS);
  const k = s.k;
  const apart = mode === 0;
  const throwTo: XY = apart ? [3, 3] : [0, 6];

  const turn = (m: number) => {
    setMode(m);
    s.replay();
  };

  return (
    <Scene scene={s}>
      <div className="flex justify-center gap-2">
        {GOLF_MODES.map((m, i) => (
          <button key={m} type="button" onClick={() => turn(i)} className={`${pill(mode === i)} font-sans`}>
            {m}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={FGB} axes={false} label={apart ? "car 60 north, ball thrown 60 east: together 84.9" : "car 60 north, ball thrown 60 north: together 120"} className="my-0! max-w-none">
            {k >= 1 && <Arrow key={`c${mode}`} f={FGB} from={O} to={[0, 3]} tone="blue" w={3} draw />}
            {k >= 1 && (
              <Label f={FGB} at={[0, 1.5]} dx={-5} dy={4} anchor="end" className={`${FADE} fill-cat-blue`}>
                60
              </Label>
            )}
            {k >= 2 && <Arrow key={`t${mode}`} f={FGB} from={[0, 3]} to={throwTo} tone="coral" w={3} draw />}
            {k >= 2 && (
              <Label f={FGB} at={apart ? [1.5, 3] : [0, 4.5]} dx={apart ? 0 : -5} dy={apart ? -7 : 4} anchor={apart ? "middle" : "end"} className={`${FADE} fill-cat-coral`}>
                60
              </Label>
            )}
            {k >= 4 && <Arrow key={`s${mode}`} f={FGB} from={O} to={throwTo} tone="violet" w={3.6} draw />}
            {k >= 4 && (
              <Label f={FGB} at={mix(O, throwTo, 0.5)} dx={8} dy={apart ? 10 : 4} anchor="start" size={11} weight={800} className={`${FADE} fill-cat-violet`}>
                {apart ? "84.9" : "120"}
              </Label>
            )}
            <circle cx={FGB.sx(0)} cy={FGB.sy(0)} r={4} className="fill-[#0f1b2d]" />
          </Plane>
        </div>
        <div className="min-h-32 w-44 text-sm leading-snug">
          {GOLF_SAY[mode].slice(0, k).map((l, i) => (
            <div key={`${mode}${i}`} className={`${FADE} mb-1.5`}>
              <div className="text-muted">{l.say}</div>
              <div className={`font-mono ${i === GOLF_STEPS - 1 ? "font-bold text-cat-violet" : ""}`}>{l.math}</div>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · The verdict, and the reader gives it. Every finalist's card has now been
//     measured on its own screen, so here the reader measures each one again in
//     one place and then awards the prize. Wrong picks bounce, so the numbers
//     actually get read. This closes the bet PrizeRow sealed.

const MEASURED: { name: string; calc: string; out: string; said?: boolean }[] = [
  { name: "ফাহিম", calc: "‖(3, 4)‖ = √(9 + 16)", out: "5" },
  { name: "সোম", calc: "‖(2, 3, 6)‖ = √(4 + 9 + 36)", out: "7" },
  { name: "সামিন", calc: "‖(6, 8)‖ = √(36 + 64)", out: "10" },
  { name: "নাসিব", calc: "দৈর্ঘ্য কখনো negative হয় না", out: "দাবি খারিজ", said: true },
];
const WINNER = 2;

export function PrizeGiven() {
  const pass = useGate();
  const [shown, setShown] = useSeed<number[]>("shown", []);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState<{ n: number; i: number } | null>(null);
  const all = shown.length === MEASURED.length;
  const won = pick === WINNER;

  const measure = (i: number) => {
    if (shown.includes(i)) return;
    setShown([...shown, i]);
  };
  const choose = (i: number) => {
    if (i === WINNER) {
      setPick(i);
      pass("সামিনের card (6, 8), দৈর্ঘ্য 10। ফাহিমের 5, সোমের 7, আর নাসিবের দাবিটা খাটেই না। পুরস্কার সামিনের।");
    } else setMiss({ n: (miss?.n ?? 0) + 1, i });
  };

  return (
    <>
      <div className="mx-auto mt-2 max-w-sm divide-y divide-border overflow-hidden rounded-xl border-2 border-cat-teal/40">
        {MEASURED.map((m, i) => (
          <div key={m.name} className="flex min-h-10 items-center gap-2 px-3 py-1.5">
            <span className="w-14 shrink-0 text-sm font-semibold">{m.name}</span>
            {shown.includes(i) ? (
              <span className={`${FADE} flex min-w-0 flex-1 items-baseline justify-between gap-2`}>
                <span className={`truncate text-xs text-muted ${m.said ? "" : "font-mono"}`}>{m.calc}</span>
                <b className="shrink-0 font-mono text-cat-teal">{m.out}</b>
              </span>
            ) : (
              <button type="button" onClick={() => measure(i)} className="ml-auto cursor-pointer rounded-full border-2 border-cat-blue px-3 py-0.5 text-sm font-semibold text-cat-blue transition-colors hover:bg-cat-blue/10">
                মাপুন
              </button>
            )}
          </div>
        ))}
      </div>
      {all && (
        <div className={FADE}>
          <div className="mt-3 text-sm font-medium text-muted">তাহলে পুরস্কার কার?</div>
          <div className="mt-2 grid gap-2">
            {WHO.map((o, i) => (
              <Choice
                key={o}
                n={i}
                look={won ? (i === WINNER ? "right" : "dim") : miss?.i === i ? "wrong" : "idle"}
                disabled={won}
                onClick={() => choose(i)}
              >
                {o}
              </Choice>
            ))}
          </div>
          {miss && !won && <Nope key={miss.n}>উঁহু, চারটা সংখ্যার দিকে আরেকবার তাকান তো। সবচেয়ে বড়টা কার?</Nope>}
        </div>
      )}
      <Ticks items={[[`চারটা card মাপা (${bn(shown.length)}/৪)`, all], ["পুরস্কার দেওয়া", won]]} />
      <Task done={won}>আগে চারটা card মেপে নিন, তারপর পুরস্কারটা কাকে দেবেন বলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: one tape, four kinds of
//      card. The same amber tape runs out along each row in turn: two slots,
//      5; three slots, 7; the lost card rebuilt as (6, 8), 10; নাসিব's claim
//      gets no tape at all. Then, being numbers now, the rows sort themselves
//      and সামিন comes to the top.

const X8_ROWS: { name: string; card: string; n: number; lost?: boolean; said?: boolean }[] = [
  { name: "ফাহিম", card: "(3, 4)", n: 5 },
  { name: "সোম", card: "(2, 3, 6)", n: 7 },
  { name: "সামিন", card: "(6, 8)", n: 10, lost: true },
  { name: "নাসিব", card: "negative", n: 0, said: true },
];
/** where each row ends up once they are sorted: সামিন, সোম, ফাহিম, নাসিব */
const X8_SLOT = [2, 1, 0, 3];
const X8_SAY = [
  "চারটা card, চার ধাঁচের।",
  "একই ফিতা, প্রথমে দুই ঘরের card: 5।",
  "তিন ঘরের card-এও খাটলো: 7।",
  "হারানো card আগে বিয়োগ করে বানানো, তারপর মাপ: 10।",
  "নাসিবের দাবি ফিতা মানে না। দৈর্ঘ্য কখনো negative হয় না।",
  "সংখ্যা হয়ে গেলেই সাজানো যায়। সবার ওপরে সামিন।",
];

export function VerdictSort() {
  const s = useScene(5, [600, 1400, 1400, 1700, 1600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={beatSay(k, X8_SAY)}>
      <div className="relative mx-auto h-[8.6rem] max-w-[19rem]" aria-label="the four finalists measured with one tape: সামিন 10, সোম 7, ফাহিম 5, নাসিব out">
        {X8_ROWS.map((r, i) => {
          const done = k > i;
          const won = k >= 5 && i === 2;
          return (
            <div
              key={r.name}
              style={{ transform: `translateY(${(k >= 5 ? X8_SLOT[i] : i) * 2.15}rem)` }}
              className={`absolute inset-x-0 top-0 grid h-8 grid-cols-[3.2rem_4.6rem_1fr_1.8rem] items-center gap-2 rounded-lg px-2 transition-[transform,background-color] duration-700 motion-reduce:transition-none ${won ? "bg-accent/15" : ""}`}
            >
              <span className="text-sm font-semibold">{r.name}</span>
              <span className={`truncate text-xs text-cat-teal ${r.said ? "" : "font-mono"} ${r.said && done ? "text-danger line-through" : ""}`}>
                {r.lost && !done ? "?" : r.said ? `“${r.card}”` : r.card}
              </span>
              {r.said ? (
                <span className="text-xs text-danger">{done && <span className={FADE}>দাবি খারিজ</span>}</span>
              ) : (
                <span className="h-2.5 rounded-sm bg-foreground/5">
                  <span style={{ width: done ? `${r.n * 10}%` : "0%" }} className="block h-full rounded-sm bg-[#f59e0b] transition-[width] duration-700 motion-reduce:transition-none" />
                </span>
              )}
              <b className="text-right font-mono text-cat-teal">{r.said ? "" : done ? r.n : "?"}</b>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for screen 9's setup, no task: after the prize, the fair
//      committee's problem. People stand about the field in knots, then someone
//      from the committee walks in carrying two tea-stall signs and wonders
//      where to put them. Where they go is the screen's job, so no sign lands.

/** one of the crowd: no name, smaller, standing a little way off */
function TcFolk({ x, y, shirt, skin }: { x: number; y: number; shirt: string; skin: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(0.62)`}>
      <path d="M-3.5 -22V-1M3.5 -22V-1" strokeWidth={5} strokeLinecap="round" stroke="#334155" />
      <rect x={-9} y={-40} width={18} height={20} rx={5} fill={shirt} />
      <circle cy={-51} r={9} fill={skin} />
      <path d="M-9.5 -52q0 -11 9.5 -11t9.5 11q-6 -6 -19 0Z" fill="#1c1917" />
    </g>
  );
}

const TC_A: [number, number, string][] = [
  [26, 146, "#16a34a"],
  [52, 140, "#9333ea"],
  [80, 148, "#0ea5e9"],
  [40, 166, "#f59e0b"],
  [68, 170, "#e11d48"],
];
const TC_B: [number, number, string][] = [
  [226, 132, "#64748b"],
  [252, 128, "#db2777"],
  [280, 134, "#65a30d"],
  [240, 150, "#2563eb"],
  [270, 154, "#ea580c"],
  [298, 148, "#0891b2"],
];
const TC_SKIN = ["#e0ac7e", "#c68e5f", "#d49a6a", "#e8b88f"];
const TC_Y = 160;

function TcSign({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} -34V-62`} stroke="#78350f" strokeWidth={2} />
      <rect x={x - 11} y={-76} width={22} height={15} rx={2} fill="#fef3c7" stroke="#b45309" strokeWidth={1.2} />
      <text x={x} y={-65.5} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#92400e">
        চা
      </text>
    </g>
  );
}

export function TeaCommittee() {
  const s = useScene(4, [600, 1100, 1100, 1900]);
  const k = s.k;
  const cx = k >= 3 ? 160 : 370;
  const crowd = (list: [number, number, string][], off: number) => (
    <g className={FADE}>
      {list.map(([x, y, shirt], i) => (
        <TcFolk key={i} x={x} y={y} shirt={shirt} skin={TC_SKIN[(i + off) % TC_SKIN.length]} />
      ))}
    </g>
  );
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" ground={112} label="people stand about the fair field in knots; the fair committee walks in with two tea-stall signs, wondering where to put them">
        {k >= 1 && crowd(TC_A, 0)}
        {k >= 2 && crowd(TC_B, 1)}
        <Person who="karim" x={cx} y={TC_Y} ms={1600} facing={-1} walking={k === 3} mood={k >= 4 ? "puzzled" : "plain"} arm="hold" />
        <Carry x={cx} y={TC_Y} ms={1600}>
          <TcSign x={-23} />
          <TcSign x={23} />
          <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#0f1b2d">
            মেলার কমিটি
          </text>
        </Carry>
        {k >= 4 && <Bubble x={cx} y={TC_Y - 72} tone="think" lines={["চায়ের stall দুইটা", "কোথায় বসাই?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9 · Two tea stalls on the field. The reader plants two flags anywhere, then
//     alternates: everyone walks to the nearer flag (‖person − flag‖), and
//     each flag moves to the average of its people (3.3). Until nothing moves.
//
//     The two steps change two different things, never both at once, and the
//     screen is built so that is seen. Step ১ leaves the flags where they are
//     and only regroups people: the paint stays on between rounds, so whoever
//     changes stall visibly changes colour, and the caption counts them. That
//     regrouping is what moves each group's balance point (the dashed ring).
//     Step ২ leaves the groups alone and only moves the flags, and it counts
//     the average out loud first: one person at a time lights up on the paper
//     with their (x, y), their numbers light up in the sums below, and only
//     when everyone is in does the flag glide to sum ÷ head count.

const FS = makeFrame(0, 10, 0, 8, 30);
const CROWD: XY[] = [
  [1.5, 6],
  [2.5, 6.8],
  [3.2, 5.4],
  [2, 4.8],
  [1, 5.4],
  [3, 6.4],
  [6.5, 2],
  [7.2, 3.4],
  [8.4, 2.6],
  [7.8, 1.4],
  [6.6, 3.2],
  [8.8, 3.8],
];
const FLAG_FILL = ["fill-cat-blue", "fill-cat-coral"];
const FLAG_BG = ["bg-cat-blue", "bg-cat-coral"];
const FLAG_TEXT = ["text-cat-blue", "text-cat-coral"];
const FLAG_RING = ["stroke-cat-blue", "stroke-cat-coral"];
const LINK_STROKE = ["stroke-cat-blue/50", "stroke-cat-coral/50"];
/** one person per beat while step ২ counts the average out loud */
const COUNT_MS = 450;
const nearer = (p: XY, flags: XY[]) => (dist(p, flags[0]) <= dist(p, flags[1]) ? 0 : 1);
const walkTotal = (flags: XY[]) => CROWD.reduce((s, p) => s + Math.min(dist(p, flags[0]), dist(p, flags[1])), 0);
/**
 * Where a stall's own people balance: their average, slot by slot (3.3).
 * Who they are and their sum come back too, because the screen counts the
 * average out, one person at a time, instead of just announcing it.
 */
const middleOf = (groups: number[], k: number) => {
  const mine = groups.flatMap((g, i) => (g === k ? [i] : []));
  const sum: XY = [mine.reduce((s, i) => s + CROWD[i][0], 0), mine.reduce((s, i) => s + CROWD[i][1], 0)];
  return { mine, sum, at: [sum[0] / mine.length, sum[1] / mine.length] as XY };
};
const d1 = (n: number) => n.toFixed(1);

function TeaFlag({ at, k }: { at: XY; k: number }) {
  return (
    <g style={{ transform: `translate(${FS.sx(at[0])}px, ${FS.sy(at[1])}px)` }} className="pointer-events-none">
      <path d="M0 0V-24" strokeWidth={2} className="stroke-[#0f1b2d]" />
      <path d="M0 -24L16 -19L0 -14Z" className={FLAG_FILL[k]} />
      <circle r={3.5} className={FLAG_FILL[k]} />
    </g>
  );
}

export function TeaStalls() {
  const pass = useGate();
  const [flags, setFlags] = useSeed<XY[]>("flags", []);
  const [groups, setGroups] = useSeed<number[] | null>("groups", null);
  // Step ১ done, step ২ waiting: the lines are live and the flag may move.
  const [staged, setStaged] = useSeed("staged", false);
  // Who changed stall on the last ১, so they can be seen changing.
  const [swapped, setSwapped] = useSeed<number[]>("swapped", []);
  // Where step ২'s count stands when it isn't running: always 0 in use, but a
  // preview can freeze the count part-way (usePlay's own counter can't be seeded).
  const [counted, setCounted] = useSeed("counted", 0);
  const [log, setLog] = useSeed<number[]>("log", []);
  const [settled, setSettled] = useSeed("settled", false);
  // Settling clears the task for good; a replay puts the field back but must
  // not un-tick it.
  const [done, setDone] = useSeed("done", false);
  const [lonely, setLonely] = useState(0);
  const { k: beat, running, play } = usePlay(COUNT_MS);
  const started = log.length > 0;
  const two = flags.length === 2;
  // The flag glides, and its lines are drawn to wherever it is right now.
  const tw = useTween(flags.flat(), 700);
  const live: XY[] = flags.map((f, k) => [tw[2 * k] ?? f[0], tw[2 * k + 1] ?? f[1]]);
  // Each stall's balance point depends on its group alone, so it moves only
  // when people change stall (step ১) and never when a flag moves (step ২).
  const middles = groups && two ? flags.map((_, k) => middleOf(groups, k)) : null;
  const biggest = middles ? Math.max(...middles.map((m) => m.mine.length)) : 0;
  // Step ২ counts one person per beat, holds a beat on the finished sums, then
  // moves the flag. `now` is the person being added (1-based), 0 for none.
  const at = running ? beat : counted;
  const now = staged && at <= biggest ? at : 0;
  const upTo = staged ? Math.min(at, biggest) : biggest;
  const summed = !staged || at > biggest;
  const counting = running || now > 0;

  const place = (p: XY) => {
    if (started) return;
    const t = snap(p, FS);
    setLonely(0);
    if (flags.length < 2) setFlags([...flags, t]);
    else {
      const k = nearer(t, flags);
      setFlags(flags.map((f, i) => (i === k ? t : f)));
    }
  };
  const gather = () => {
    const g = CROWD.map((p) => nearer(p, flags));
    if (!g.includes(0) || !g.includes(1)) {
      setLonely((n) => n + 1);
      return;
    }
    setSwapped(groups ? g.flatMap((v, i) => (v === groups[i] ? [] : [i])) : []);
    setGroups(g);
    setStaged(true);
    setCounted(0);
    setLog([...log, walkTotal(flags)]);
  };
  const shift = () => {
    if (!middles) return;
    play(biggest + 2, () => {
      const next = middles.map((m) => m.at);
      const moved = Math.max(dist(next[0], flags[0]), dist(next[1], flags[1]));
      setFlags(next);
      setStaged(false);
      setSwapped([]);
      if (moved < 0.01) {
        setSettled(true);
        setDone(true);
        pass("সবাইকে কাছের flag-এ ভাগ করুন, তারপর প্রতিটা flag-কে তার দলের average-এ সরান। পালা করে এই দুইটা চালালে flag একসময় নিজে থেকেই থেমে যায়।");
      }
    });
  };
  const restart = () => {
    setFlags([]);
    setGroups(null);
    setStaged(false);
    setSwapped([]);
    setCounted(0);
    setLog([]);
    setSettled(false);
    setLonely(0);
  };

  return (
    <>
      <Plane
        f={FS}
        ticks={2}
        label={two ? `two tea flags at ${tup(flags[0].map((n) => Math.round(n * 10) / 10))} and ${tup(flags[1].map((n) => Math.round(n * 10) / 10))}` : "twelve visitors on the field in two loose clumps"}
        drag={started ? undefined : { down: place }}
        className="max-w-[20rem]"
      >
        {groups &&
          CROWD.map((p, i) => (
            <path
              key={`l${i}`}
              d={`M${FS.sx(p[0])} ${FS.sy(p[1])}L${FS.sx(live[groups[i]][0])} ${FS.sy(live[groups[i]][1])}`}
              strokeWidth={1.2}
              className={`${FADE} pointer-events-none ${LINK_STROKE[groups[i]]} ${staged ? "opacity-100" : "opacity-30"} transition-opacity duration-500 motion-reduce:transition-none`}
            />
          ))}
        {middles?.map(({ at: m }, k) => (
          <g key={`m${k}-${m[0].toFixed(2)},${m[1].toFixed(2)}`} className={`${POP} pointer-events-none`}>
            <circle cx={FS.sx(m[0])} cy={FS.sy(m[1])} r={10} strokeWidth={2} strokeDasharray="4 3" className={`fill-none ${FLAG_RING[k]} ${staged && !running ? "animate-pulse" : ""}`} />
            <circle cx={FS.sx(m[0])} cy={FS.sy(m[1])} r={2} className={FLAG_FILL[k]} />
          </g>
        ))}
        {CROWD.map((p, i) => (
          <circle
            key={i}
            cx={FS.sx(p[0])}
            cy={FS.sy(p[1])}
            r={swapped.includes(i) ? 7 : 5}
            className={`pointer-events-none transition-[fill,r] duration-500 motion-reduce:transition-none ${groups ? FLAG_FILL[groups[i]] : "fill-[#94a3b8]"}`}
          />
        ))}
        {live.map((f, k) => (
          <TeaFlag key={k} at={f} k={k} />
        ))}
        {/* Step ২ counting: the person being added right now, with the numbers that go in. */}
        {now > 0 &&
          middles?.map(({ mine }, k) => {
            const i = mine[now - 1];
            if (i === undefined) return null;
            const [x, y] = CROWD[i];
            return (
              <g key={`c${k}-${i}`} className={`${POP} pointer-events-none`}>
                <circle cx={FS.sx(x)} cy={FS.sy(y)} r={10} strokeWidth={2.5} className={`fill-none ${FLAG_RING[k]}`} />
                <rect x={FS.sx(x) - 38} y={FS.sy(y) - 33} width={76} height={18} rx={4} strokeWidth={0.8} className="fill-white/95 stroke-[#cbd5e1]" />
                <Label f={FS} at={[x, y]} dy={-19.5} size={11} weight={700} className={`font-mono ${FLAG_FILL[k]}`}>
                  ({d1(x)}, {d1(y)})
                </Label>
              </g>
            );
          })}
      </Plane>
      <div className="min-h-7 text-center text-[0.95rem]">
        {settled ? (
          <span className={`${FADE} text-accent-text`}>এবার flag একচুলও নড়লো না। দুইটা stall-ই ঠিক জায়গা পেয়ে গেছে!</span>
        ) : !two ? (
          <span className="text-muted">মাঠের যেখানে খুশি tap করে দুইটা চায়ের flag বসান ({bn(flags.length)}/২)।</span>
        ) : counting ? (
          <span className={FADE}>দলের একেকজনের x আর y যোগ হচ্ছে। দল এখন আর বদলাবে না, শুধু হিসাব শেষে flag নড়বে।</span>
        ) : staged && swapped.length > 0 ? (
          <span className={FADE}>
            Flag নড়েনি, কিন্তু <b>{bn(swapped.length)} জন দল বদলালো</b>। দলের মানুষ বদলালো বলে গোল দাগ দুইটাও সরে গেল। এবার ২ চেপে হিসাবটা দেখুন।
          </span>
        ) : staged && log.length > 1 ? (
          <span className={FADE}>এবার কেউ দল বদলালো না, তাই গোল দাগও নড়লো না। তবু ২ চেপে একবার হিসাবটা দেখুন।</span>
        ) : staged ? (
          <span className={FADE}>সবাই গেল যার যার কাছের flag-এ। গোল দাগটা দলের average: দলের সবার x আর y আলাদা করে যোগ, তারপর জন দিয়ে ভাগ। ২ চেপে হিসাবটা দেখুন।</span>
        ) : started ? (
          <span className={FADE}>দল একই আছে, শুধু flag গিয়ে বসলো দাগের ওপর। কিন্তু flag সরেছে বলে এখন কারো কারো কাছের flag বদলে যেতে পারে। ১ চেপে দেখুন।</span>
        ) : (
          <span className="text-muted">চাইলে tap করে flag সরিয়ে নিতে পারেন। তারপর সবাইকে কাছের flag-এ পাঠিয়ে দিন।</span>
        )}
      </div>
      {lonely > 0 && <Nope key={lonely}>সবাই একটা flag-এই চলে গেল, অন্যটার কাছে কেউ নাই! ওই flag-টা মানুষের একটু কাছাকাছি সরিয়ে বসান।</Nope>}
      {!settled && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={gather} disabled={!two || staged || running} className={primaryBtn}>
            ১ · কাছের flag-এ পাঠান
          </button>
          <button type="button" onClick={shift} disabled={!staged || running} className={`${primaryBtn} bg-cat-violet`}>
            ২ · flag average-এ সরান
          </button>
        </div>
      )}
      {middles && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl border border-border px-3 py-2`}>
          <div className="text-center text-xs text-muted">প্রতিটা দলের average: সবার x যোগ ÷ জন, সবার y যোগ ÷ জন</div>
          <div className="mt-1.5 grid gap-1.5">
            {middles.map(({ mine, sum, at: m }, k) => (
              <div key={k} className="flex items-start gap-2">
                <span className={`mt-1 size-2.5 shrink-0 rounded-full ${FLAG_BG[k]}`} />
                <div className="min-w-0 font-mono text-[0.7rem] leading-snug">
                  {[0, 1].map((j) => (
                    <div key={j} className="-indent-3 pl-3">
                      <span className="text-muted">{j ? "y" : "x"} </span>
                      {mine.map((i, t) => (
                        <span key={i} className="whitespace-nowrap">
                          {t > 0 && <span className="mx-px text-muted">+</span>}
                          <span className={t < upTo ? `font-semibold ${FLAG_TEXT[k]}` : "text-muted/60"}>{d1(CROWD[i][j])}</span>
                        </span>
                      ))}{" "}
                      {summed && (
                        <span className={`${POP} inline-block indent-0 whitespace-nowrap`}>
                          = {d1(sum[j])} ÷ {mine.length} = <b className={FLAG_TEXT[k]}>{d1(m[j])}</b>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 border-t border-border pt-1.5">
            <span className="text-xs text-muted">সবাই মিলে মোট হাঁটবে</span>
            <span className="font-mono">
              {log.map((d, i) => (
                <span key={i} className={FADE}>
                  {i > 0 && <span className="text-muted"> → </span>}
                  <b className={i === log.length - 1 ? "text-cat-teal" : ""}>{d1(d)}</b>
                </span>
              ))}
            </span>
          </div>
        </div>
      )}
      {started && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={restart} disabled={running} className={quietBtn}>
            {settled ? "অন্য জায়গায় flag বসিয়ে আবার দেখুন" : "নতুন করে flag বসান"}
          </button>
        </div>
      )}
      <Task done={done}>দুইটা flag বসান। তারপর ১ আর ২ পালা করে চাপতে থাকুন, যতক্ষণ না flag নড়াচড়া থামায়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for screen 9's explanation, no task: the two steps, taking
//      turns by themselves on the same crowd. Step ১ only regroups people (the
//      flags stay put), and the dashed rings, each group's average, move with
//      the groups; step ২ only moves the flags onto the rings (the groups stay
//      put). Round two: ৪ people switch because the flags moved. Round three:
//      nobody switches, so nothing moves again. The walk total only falls.

const X9 = makeFrame(0, 10, 0, 8, 14, 8);
const x9Groups = (flags: XY[]) => CROWD.map((p) => nearer(p, flags));
const x9Rings = (groups: number[]) => [0, 1].map((j) => middleOf(groups, j).at);
const X9_F0: XY[] = [
  [2, 2],
  [4, 6],
];
const X9_G1 = x9Groups(X9_F0);
const X9_F1 = x9Rings(X9_G1);
const X9_G2 = x9Groups(X9_F1);
const X9_F2 = x9Rings(X9_G2);
/** who changed flag in round two */
const X9_SWAP = X9_G2.flatMap((g, i) => (g === X9_G1[i] ? [] : [i]));
/** what each beat shows: the flags, the groups (none before the first ১), and the rings */
const X9_BEATS: { flags: XY[]; groups: number[] | null }[] = [
  { flags: X9_F0, groups: null },
  { flags: X9_F0, groups: X9_G1 },
  { flags: X9_F1, groups: X9_G1 },
  { flags: X9_F1, groups: X9_G2 },
  { flags: X9_F2, groups: X9_G2 },
  { flags: X9_F2, groups: X9_G2 },
];
/** everyone's walk to their flag, logged at each ১ */
const X9_WALK = [walkTotal(X9_F0), walkTotal(X9_F1), walkTotal(X9_F2)];
const X9_SAY = [
  "দুইটা flag বসানো। কেউ এখনো কোনো দলে না।",
  "১: flag নড়লো না, শুধু সবাই কাছের flag-এর দলে গেল। গোল দাগ হলো দলের average।",
  "২: দল একই থাকলো, শুধু flag গিয়ে বসলো দাগের ওপর।",
  `১: flag সরেছে বলে ${bn(X9_SWAP.length)} জন দল বদলালো, আর তাই দাগও সরলো।`,
  "২: আবার শুধু flag, দাগের ওপর।",
  "১: এবার কেউ দল বদলালো না, দাগও নড়লো না। সব থেমে গেল।",
];

export function TwoMoves() {
  const s = useScene(5, [600, 1800, 1700, 1900, 1700]);
  const k = s.k;
  const { flags, groups } = X9_BEATS[k];
  const rings = groups ? x9Rings(groups) : null;
  const tw = useTween(flags.flat(), 800);
  const step = k === 0 ? null : k % 2 === 1 ? 1 : 2;
  const logged = X9_WALK.slice(0, Math.ceil(k / 2));
  return (
    <Scene scene={s} caption={beatSay(k, X9_SAY)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[9.5rem] shrink-0">
          <Plane f={X9} axes={false} grid={1} label="twelve people and two flags: people join the nearer flag, then each flag moves to its group's average, in turns, until nothing moves" className="my-0! max-w-none">
            {rings?.map((m, j) => (
              <circle key={`r${j}-${m.map((n) => n.toFixed(2)).join()}`} cx={X9.sx(m[0])} cy={X9.sy(m[1])} r={8} strokeWidth={1.8} strokeDasharray="3 3" className={`${POP} fill-none ${FLAG_RING[j]}`} />
            ))}
            {CROWD.map((p, i) => {
              const swapped = k === 3 && X9_SWAP.includes(i);
              return (
                <circle
                  key={i}
                  cx={X9.sx(p[0])}
                  cy={X9.sy(p[1])}
                  r={swapped ? 5.5 : 3.8}
                  className={`transition-[fill,r] duration-500 motion-reduce:transition-none ${groups ? FLAG_FILL[groups[i]] : "fill-[#94a3b8]"}`}
                />
              );
            })}
            {[0, 1].map((j) => (
              <g key={j} style={{ transform: `translate(${X9.sx(tw[2 * j])}px, ${X9.sy(tw[2 * j + 1])}px)` }}>
                <path d="M0 0V-18" strokeWidth={1.8} className="stroke-[#0f1b2d]" />
                <path d="M0 -18L12 -14L0 -10Z" className={FLAG_FILL[j]} />
                <circle r={2.8} className={FLAG_FILL[j]} />
              </g>
            ))}
          </Plane>
        </div>
        <div className="w-32 text-sm leading-snug">
          <div className="h-7">
            {step && (
              <span key={k} className={`${POP} inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${step === 1 ? "bg-cat-blue" : "bg-cat-violet"}`}>
                {step === 1 ? "১ · কাছের flag-এ" : "২ · flag average-এ"}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted">সবাই মিলে মোট হাঁটা</div>
          <div className="font-mono">
            {logged.map((w, i) => (
              <div key={i} className={FADE}>
                <b className={i === logged.length - 1 ? "text-cat-teal" : "text-muted"}>{d1(w)}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9¾ · A figure for screen 9's explanation, no task: the same trick on a
//      picture's colours. A tiny sunset, 24 × 16 cells, nearly every cell its
//      own colour; sixteen colours are picked by the same two steps (every
//      colour is an (R, G, B) vector, so "nearest" is the length of a
//      difference); then every cell goes to its nearest one. Sixteen colours,
//      and the picture still reads.

type X9Rgb = [number, number, number];
const X9C_W = 24;
const X9C_H = 16;
/** the sunset, a colour per cell, with a little grain so that hardly two cells match */
const X9C_PX: X9Rgb[] = Array.from({ length: X9C_W * X9C_H }, (_, i) => {
  const x = i % X9C_W;
  const y = Math.floor(i / X9C_W);
  const grain = ((i * 73 + 41) % 17) - 8;
  const hill = 10 + 2.2 * Math.sin(x / 3.2);
  const d = (y - hill) / (X9C_H - hill);
  const c: X9Rgb =
    y >= hill ? [70 - 30 * d + x, 140 - 60 * d, 50 - 20 * d] : Math.hypot(x - 16, y - 7) < 2.8 ? [255, 225 - 12 * (y - 4), 110] : [40 + 20 * y, 50 + 12 * y, 160 - 9 * y];
  return c.map((v) => clamp(Math.round(v + grain), 0, 255)) as X9Rgb;
});
const x9cGap = (a: X9Rgb, b: X9Rgb) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const X9C_KINDS = new Set(X9C_PX.map((c) => c.join())).size;
/** sixteen colours by the tea-stall steps, taken in turns a dozen times; and each cell's nearest */
const [X9C_PAL, X9C_OF] = (() => {
  let pal: X9Rgb[] = Array.from({ length: 16 }, (_, j) => X9C_PX[Math.floor(((j + 0.5) * X9C_PX.length) / 16)]);
  let of: number[] = [];
  for (let round = 0; round < 12; round++) {
    of = X9C_PX.map((p) => pal.reduce((best, c, j) => (x9cGap(p, c) < x9cGap(p, pal[best]) ? j : best), 0));
    pal = pal.map((c, j) => {
      const mine = X9C_PX.filter((_, i) => of[i] === j);
      return mine.length ? ([0, 1, 2].map((ch) => Math.round(mine.reduce((sum, p) => sum + p[ch], 0) / mine.length)) as X9Rgb) : c;
    });
  }
  return [pal, of] as const;
})();
const rgb = (c: X9Rgb) => `rgb(${c.join(",")})`;
const X9C_SAY = [
  "একটা ছোট ছবি। প্রায় প্রতিটা ঘরের রং আলাদা।",
  "একটা ছোট ছবি। প্রায় প্রতিটা ঘরের রং আলাদা।",
  "প্রতিটা রং আসলে (R, G, B), একটা vector। সেই দুই চাল পালা করে চালিয়ে বাছা হলো ১৬টা রং, যেন ১৬টা flag।",
  "প্রতিটা ঘর চলে গেল তার সবচেয়ে কাছের রঙে। ১৬টা রঙেই ছবিটা দিব্যি চেনা যায়।",
];

export function ColorSixteen() {
  const s = useScene(3, [600, 1200, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={beatSay(k, X9C_SAY)}>
      <div className="flex items-center justify-center gap-3">
        <svg viewBox={`0 0 ${X9C_W} ${X9C_H + 2}`} role="img" aria-label="a small sunset picture, redrawn with only sixteen colours" className="block w-[10.5rem] shrink-0">
          {X9C_PX.map((c, i) => (
            <rect
              key={i}
              x={i % X9C_W}
              y={Math.floor(i / X9C_W)}
              width={1.02}
              height={1.02}
              style={{ fill: rgb(k >= 3 ? X9C_PAL[X9C_OF[i]] : c), transitionDelay: `${(i % X9C_W) * 40}ms` }}
              className="transition-[fill] duration-500 motion-reduce:transition-none"
            />
          ))}
          {k >= 2 &&
            X9C_PAL.map((c, j) => (
              <rect key={j} x={j * 1.5 + 0.1} y={X9C_H + 0.6} width={1.3} height={1.3} rx={0.25} style={{ fill: rgb(c), transitionDelay: `${j * 60}ms` }} className={POP} />
            ))}
        </svg>
        <div className="w-24 text-sm leading-snug">
          <div className="text-xs text-muted">কত রকম রং</div>
          <div key={k >= 3 ? "few" : "many"} className={`${POP} inline-block text-2xl font-bold ${k >= 3 ? "text-cat-teal" : ""}`}>
            {k >= 3 ? bn(X9C_PAL.length) : bn(X9C_KINDS)}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10 · Say it out loud. Each card: a line of notation; tapped, its reading.

const SAY: { see: string; say: string }[] = [
  { see: "|−3|", say: "“3, minus চিহ্ন ছাড়া”। এক দাগ মানে ভেতরে একটা সাধারণ সংখ্যা।" },
  { see: "‖v‖", say: "“v-এর দৈর্ঘ্য”। দুই দাগ মানে ভেতরে একটা vector।" },
  { see: "‖a − b‖", say: "“a আর b-এর দূরত্ব”, মানে b থেকে a-তে যাওয়ার card-টা কতটা লম্বা।" },
  { see: "‖v‖²", say: "“root নেওয়ার আগের সংখ্যা”, মানে শুধু বর্গগুলোর যোগফল।" },
];

export function SayIt() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);

  const flip = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === SAY.length) pass("দুই দাগের ভেতরে একটা vector থাকলে তার মানে দৈর্ঘ্য। আর দুইটা vector-এর বিয়োগ থাকলে, তাদের দূরত্ব।");
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
              {on ? <span className={`${FADE} mt-1 text-[0.92rem] leading-snug`}>{c.say}</span> : <span className="mt-1 text-xs text-muted">আগে মুখে বলুন, তারপর tap করুন</span>}
            </button>
          );
        })}
      </div>
      <Task done={open.length === SAY.length}>
        প্রতিটা card আগে একবার মুখে বলুন, তারপর উল্টে মিলিয়ে নিন ({bn(open.length)}/{bn(SAY.length)})
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for screen 10's explanation, no task: one bar and two bars.
//       ‖(3, 4)‖ = 5 is how far an arrow gets from the Gate; |−3| = 3 is how
//       far a number sits from 0 on the line; and a one-slot vector (−3),
//       drawn along that same line, measures √9 = 3: the two agree.

const X10 = makeFrame(-4, 4, -0.8, 4.4, 15, 10);
const X10_SAY = [
  "দুই দাগ: একটা vector Gate থেকে কত দূরে।",
  "দুই দাগ: একটা vector Gate থেকে কত দূরে।",
  "এক দাগ: একটা সংখ্যা 0 থেকে কত দূরে।",
  "এক ঘরের vector (−3) নিলে দুই দাগও দেয় √9 = 3। দুইটা মিলে গেল।",
];

export function OneBarTwoBars() {
  const s = useScene(3, [600, 1600, 1800]);
  const k = s.k;
  const line = `M${X10.sx(-4)} ${X10.sy(0)}H${X10.sx(4)}`;
  return (
    <Scene scene={s} caption={beatSay(k, X10_SAY)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={X10} ticks={0} label="the arrow (3, 4) is 5 from the Gate; −3 is 3 from 0; the one-slot vector (−3) is also 3 long" className="my-0! max-w-none">
            {k >= 2 && <path d={line} strokeWidth={3} className={`${FADE} stroke-[#0f1b2d]/60`} />}
            {k >= 1 && <Arrow f={X10} from={O} to={[3, 4]} tone="teal" w={2.8} draw faint={k >= 2} />}
            {k >= 2 && <Draw d={`M${X10.sx(0)} ${X10.sy(0) + 7}H${X10.sx(-3)}`} ms={700} strokeWidth={4} className="stroke-cat-amber" />}
            {k >= 2 && <circle cx={X10.sx(-3)} cy={X10.sy(0)} r={4.5} className={`${POP} fill-cat-coral`} />}
            {k >= 3 && <Arrow f={X10} from={O} to={[-3, 0]} tone="violet" w={2.8} draw />}
            {k >= 2 && (
              <g className={FADE}>
                <Label f={X10} at={[-3, 0]} dy={20} size={9} className="fill-[#5a6b7d] font-mono">
                  {sg(-3)}
                </Label>
                <Label f={X10} at={O} dy={20} size={9} className="fill-[#5a6b7d] font-mono">
                  0
                </Label>
              </g>
            )}
            <circle cx={X10.sx(0)} cy={X10.sy(0)} r={3} className="fill-[#0f1b2d]" />
          </Plane>
        </div>
        <div className="w-40 text-sm leading-snug">
          {k >= 1 && (
            <div className={`${FADE} ${k >= 2 ? "opacity-60" : ""}`}>
              <b className="font-mono text-cat-teal">‖(3, 4)‖ = 5</b>
              <div className="text-xs text-muted">Gate থেকে কত দূরে</div>
            </div>
          )}
          {k >= 2 && (
            <div className={`${FADE} mt-1.5`}>
              <b className="font-mono text-cat-amber">|−3| = 3</b>
              <div className="text-xs text-muted">0 থেকে কত দূরে</div>
            </div>
          )}
          {k >= 3 && (
            <div className={`${FADE} mt-1.5`}>
              <b className="font-mono text-cat-violet">‖(−3)‖ = √9 = 3</b>
              <div className="text-xs text-muted">এক ঘরের vector</div>
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11½ · A figure for the check's explanation, no task: the square as a sieve.
//       (3, −4) added straight gives −1, a length below zero; squared, each
//       leg becomes a square of tiles, 9 and 16, and the minus is gone; 25
//       counts tiles, so the root brings it back to the grid's own units: the
//       tape along the arrow reads 5.

const X11 = makeFrame(-0.5, 7.5, -4.5, 3.5, 14, 10);
const X11_END: XY = [3, -4];
const x11Pts = (ps: XY[]) => ps.map(([x, y]) => `${X11.sx(x)},${X11.sy(y)}`).join(" ");
const X11_SAY = [
  "সরাসরি যোগ করলে 3 + (−4) = −1। দৈর্ঘ্য negative? সেটা তো অসম্ভব।",
  "সরাসরি যোগ করলে 3 + (−4) = −1। দৈর্ঘ্য negative? সেটা তো অসম্ভব।",
  "বর্গ করলে minus ছেঁকে বাদ পড়ে: 9 + 16 = 25। তবে 25 হলো tile-এর সংখ্যা।",
  "Root নিলে আবার ঘরের মাপে ফেরা: ফিতায় ঠিক 5।",
];

export function SquareSieve() {
  const s = useScene(3, [600, 1700, 1700]);
  const k = s.k;
  const [t] = useTween([k >= 3 ? 1 : 0], 900);
  return (
    <Scene scene={s} caption={beatSay(k, X11_SAY)}>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[8rem] shrink-0">
          <Plane f={X11} axes={false} label="the arrow (3, −4): its legs squared make 9 and 16 tiles, 25 in all; the tape along it reads 5" className="my-0! max-w-none">
            {k >= 2 && (
              <g className={POP}>
                <polygon points={x11Pts([O, [3, 0], [3, 3], [0, 3]])} strokeWidth={1.2} className="fill-cat-blue/15 stroke-cat-blue" />
                <Label f={X11} at={[1.5, 1.5]} dy={5} size={13} weight={800} className="fill-cat-blue">
                  9
                </Label>
              </g>
            )}
            {k >= 2 && (
              <g className={`${POP} delay-300`}>
                <polygon points={x11Pts([[3, 0], [7, 0], [7, -4], X11_END])} strokeWidth={1.2} className="fill-cat-coral/15 stroke-cat-coral" />
                <Label f={X11} at={[5, -2]} dy={5} size={13} weight={800} className="fill-cat-coral">
                  16
                </Label>
              </g>
            )}
            {k >= 3 && t > 0.02 && <Tape f={X11} from={O} to={mix(O, X11_END, t)} />}
            <Arrow f={X11} from={O} to={X11_END} tone="teal" w={2.6} faint={k >= 3} />
            <circle cx={X11.sx(0)} cy={X11.sy(0)} r={3.5} className="fill-[#0f1b2d]" />
          </Plane>
        </div>
        <div className="w-40 text-sm leading-snug">
          <div className="font-mono">
            {k >= 1 && (
              <span className={`${FADE} ${k >= 2 ? "text-muted line-through" : "text-danger"}`}>3 + (−4) = −1</span>
            )}
          </div>
          <div className="mt-1.5 h-10 font-mono">
            {k >= 2 && (
              <div className={FADE}>
                3² + (−4)²
                <div>
                  = 9 + 16 = <b>25</b>
                </div>
              </div>
            )}
          </div>
          <div className="mt-1.5 font-mono">
            {k >= 3 && (
              <span className={FADE}>
                √25 = <b className="text-cat-teal">5</b>
              </span>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11¾ · A figure for the check's explanation, no task: comparing without the
//       root. The three finalists' sums of squares, 25, 49 and 100, as bars;
//       then their roots, 5, 7 and 10. The order is the same both times, so
//       to know who is longer, the root was never needed.

const X11R: { name: string; sq: number }[] = [
  { name: "ফাহিম", sq: 25 },
  { name: "সোম", sq: 49 },
  { name: "সামিন", sq: 100 },
];
const X11R_SAY = [
  "Root ছাড়া, শুধু বর্গের যোগ: 25, 49, 100।",
  "Root ছাড়া, শুধু বর্গের যোগ: 25, 49, 100।",
  "Root নিলে 5, 7, 10। ছোট-বড়র ক্রম একটুও বদলালো না।",
  "কে বেশি লম্বা, শুধু এটুকু জানতে root লাগে না। সামিন দুইভাবেই এগিয়ে।",
];

export function NoRootNeeded() {
  const s = useScene(3, [600, 1500, 1600]);
  const k = s.k;
  const bar = "block h-full rounded-sm transition-[width] duration-700 motion-reduce:transition-none";
  return (
    <Scene scene={s} caption={beatSay(k, X11R_SAY)}>
      <div className="mx-auto grid max-w-[19rem] grid-cols-[3rem_1fr_1fr] items-center gap-x-3 gap-y-1.5 text-sm">
        <span />
        <span className="font-mono text-xs text-muted">‖v‖²</span>
        <span className="font-mono text-xs text-muted">‖v‖</span>
        {X11R.map((r) => {
          const top = k >= 3 && r.sq === 100;
          return [
            <span key={`${r.name}n`} className={`font-semibold ${top ? "text-accent-text" : ""}`}>
              {r.name}
            </span>,
            <span key={`${r.name}s`} className="flex items-center gap-1.5">
              <span className="h-3 flex-1 rounded-sm bg-foreground/5">
                <span style={{ width: k >= 1 ? `${r.sq}%` : "0%" }} className={`${bar} bg-cat-violet/70`} />
              </span>
              <b className="w-7 text-right font-mono">{k >= 1 ? r.sq : ""}</b>
            </span>,
            <span key={`${r.name}l`} className="flex items-center gap-1.5">
              <span className="h-3 flex-1 rounded-sm bg-foreground/5">
                <span style={{ width: k >= 2 ? `${Math.sqrt(r.sq) * 10}%` : "0%" }} className={`${bar} bg-cat-teal`} />
              </span>
              <b className="w-5 text-right font-mono text-cat-teal">{k >= 2 ? Math.sqrt(r.sq) : ""}</b>
            </span>,
          ];
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 12½ · A figure for the last step's explanation, no task: the tape so far
//       measured the way a crow flies. On the fair ground (stall blocks, the
//       Gate at one corner, ফাহিম's stall at the other) the crow's line goes
//       straight over the stalls; a person trying the same line walks into a
//       stall; so the person goes round, along the gaps between the rows. How
//       far it "is" is left as the question the next journey takes up.

const X12 = makeFrame(0, 3, 0, 4, 26, 12);
const X12_STALL: XY = [3, 4];
/** where the walker bumps into the first stall on the straight line */
const X12_BUMP: XY = [0.17, 0.23];
const X12_ROUTE: XY[] = [O, [3, 0], X12_STALL];
const x12Along = (t: number): XY => (t <= 3 / 7 ? mix(O, [3, 0], t / (3 / 7)) : mix([3, 0], X12_STALL, (t - 3 / 7) / (4 / 7)));
const X12_SAY = [
  "এতদিন ফিতা মেপেছে কাকের মতো, সোজা উড়ে।",
  "এতদিন ফিতা মেপেছে কাকের মতো, সোজা উড়ে।",
  "মানুষ কিন্তু stall ভেদ করে কোণাকুনি যেতে পারে না।",
  "তাকে যেতে হয় সারির ফাঁক দিয়ে, ঘুরে ঘুরে।",
  "একই stall, দুই রকম পথ। তাহলে “কত দূর?” বললে কোন পথের কথা?",
];

export function CrowOverRows() {
  const s = useScene(4, [600, 1600, 1200, 2200, 1500]);
  const k = s.k;
  const [c] = useTween([k >= 1 ? 1 : 0], 1300);
  const [b] = useTween([k === 2 ? 1 : 0], 600);
  const [w] = useTween([k >= 3 ? 1 : 0], 1900);
  const crow = mix(O, X12_STALL, c);
  const me = k >= 3 ? x12Along(w) : mix(O, X12_BUMP, b);
  const blocks: XY[] = [0, 1, 2].flatMap((i) => [0, 1, 2, 3].map((j): XY => [i, j]));
  return (
    <Scene scene={s} caption={beatSay(k, X12_SAY)}>
      <div className="flex items-center justify-center gap-4">
        <div className="w-[7rem] shrink-0">
          <Plane f={X12} axes={false} label="the fair ground: stall blocks between walkways, the Gate at one corner and ফাহিম's stall at the far one; the crow flies straight, a person walks round" className="my-0! max-w-none">
            {blocks.map(([i, j]) => (
              <rect key={`${i},${j}`} x={X12.sx(i + 0.16)} y={X12.sy(j + 0.84)} width={X12.u * 0.68} height={X12.u * 0.68} rx={2} className="fill-[#e7c9a0] stroke-[#b45309]" strokeWidth={0.8} />
            ))}
            {k >= 1 && <path d={`M${X12.sx(0)} ${X12.sy(0)}L${X12.sx(3)} ${X12.sy(4)}`} strokeWidth={1.6} strokeDasharray="4 4" className={`${FADE} fill-none stroke-cat-teal`} />}
            {k >= 3 && <Draw d={X12_ROUTE.map(([x, y], i) => `${i ? "L" : "M"}${X12.sx(x)} ${X12.sy(y)}`).join("")} ms={1900} strokeWidth={2.4} className="stroke-cat-violet/70" />}
            {k === 2 && (
              <path
                d={`M${X12.sx(0.3) - 4} ${X12.sy(0.4) - 4}l8 8m0 -8l-8 8`}
                strokeWidth={2}
                strokeLinecap="round"
                style={{ transitionDelay: "500ms" }}
                className={`${FADE} fill-none stroke-danger`}
              />
            )}
            <circle cx={X12.sx(3)} cy={X12.sy(4)} r={6} className="fill-cat-coral" />
            <circle cx={X12.sx(0)} cy={X12.sy(0)} r={4} className="fill-[#0f1b2d]" />
            {k >= 1 && <path d="M-6 0q3 -4 6 0q3 -4 6 0" transform={`translate(${X12.sx(crow[0])} ${X12.sy(crow[1]) - 3})`} strokeWidth={1.6} strokeLinecap="round" className="fill-none stroke-[#0f1b2d]" />}
            <circle cx={X12.sx(me[0])} cy={X12.sy(me[1])} r={5} strokeWidth={2} className="fill-white stroke-cat-violet" />
            {k >= 4 && (
              <g className={POP}>
                <circle cx={X12.sx(1.5)} cy={X12.sy(2)} r={9} strokeWidth={1.5} className="fill-white stroke-cat-amber" />
                <text x={X12.sx(1.5)} y={X12.sy(2) + 4} textAnchor="middle" fontSize={12} fontWeight={800} className="fill-cat-amber">
                  ?
                </text>
              </g>
            )}
          </Plane>
        </div>
        <div className="w-36 space-y-1.5 text-sm leading-snug">
          <div className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full bg-cat-coral" />
            ফাহিমের stall
          </div>
          <div className={`flex items-center gap-2 transition-opacity duration-500 motion-reduce:transition-none ${k >= 1 ? "opacity-100" : "opacity-0"}`}>
            <span className="w-3 shrink-0 border-t-2 border-dashed border-cat-teal" />
            কাক, সোজা উড়ে
          </div>
          <div className={`flex items-center gap-2 transition-opacity duration-500 motion-reduce:transition-none ${k >= 3 ? "opacity-100" : "opacity-0"}`}>
            <span className="w-3 shrink-0 border-t-2 border-cat-violet" />
            মানুষ, ফাঁক দিয়ে
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  FinalistsArrive: { rule: { k: 1 }, walking: { k: 3 }, stepping: { k: 3, stepping: true }, done: {} },
  FahimsTreasure: { card: { k: 1 }, walking: { k: 2 }, done: {} },
  SomOnRoof: { climbing: { k: 1 }, card: { k: 3 }, done: {} },
  LostCard: { lost: { k: 1 }, start: { k: 2 }, done: {} },
  NasibClaims: { zero: { k: 2 }, negative: { k: 3 }, done: {} },
  NasibFlips: { turned: { k: 1 }, done: {} },
  FahimObjects: { rule: { k: 1 }, walked: { k: 2 }, done: {} },
  TeaCommittee: { crowd: { k: 2 }, done: {} },
  PrizeRow: { start: {}, sealed: { bet: 0 } },
  TapeRecall: { start: {}, pulling: { guess: 0, end: [2, 2.5] }, done: { guess: 0, end: [3, 4] } },
  BoxClue: { start: {}, squared: { squared: [0, 1, 2] }, hunting: { squared: [0, 1, 2], added: true, root: 8 }, done: { squared: [0, 1, 2], added: true, root: 7 } },
  TripLength: { start: {}, built: { card: [6, 8], built: true }, measured: { card: [6, 8], built: true, guess: 1, measured: true } },
  TeaStalls: {
    start: {},
    placed: { flags: [[2, 2], [4, 6]] },
    gathered: { flags: [[2, 2], [4, 6]], groups: [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1], staged: true, log: [40.8] },
    shifted: {
      flags: [
        [7.15, 1.7],
        [4.42, 4.78],
      ],
      groups: [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1],
      log: [40.8],
    },
    swapped: {
      flags: [
        [7.15, 1.7],
        [4.42, 4.78],
      ],
      groups: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      swapped: [7, 8, 10, 11],
      staged: true,
      log: [40.8, 24.3],
    },
    counting: {
      flags: [
        [7.15, 1.7],
        [4.42, 4.78],
      ],
      groups: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      swapped: [7, 8, 10, 11],
      staged: true,
      counted: 3,
      log: [40.8, 24.3],
    },
    settled: {
      flags: [
        [7.55, 2.73],
        [2.2, 5.8],
      ],
      groups: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      log: [40.8, 24.3, 13.1],
      settled: true,
      done: true,
    },
  },
  NoZero: { start: {}, home: { tip: [0, 0], tried: ["2,3", "-1,2", "1,0", "0,0"] }, done: { tip: [0, -1], tried: ["2,3", "-1,2", "1,0", "0,0", "3,-3", "0,-1"] } },
  StretchTape: { start: {}, flipped: { guess: 1, k: -2, seen: [1, 2, -2] }, all: { guess: 0, k: -1, seen: [1, 2, 0.5, -2, -1] } },
  Detour: { start: {}, walked: { walked: true }, turned: { walked: true, deg: 120 }, lined: { walked: true, deg: DU_DEG, lined: true } },
  AbsBars: { start: {}, bars: { on: true }, plus: { pick: 2, on: true } },
  GolfSum: { apart: {}, together: { mode: 1 } },
  NeverMeasured: { mid: { k: 2 }, done: {} },
  DotsToArrow: { mid: { k: 2 }, done: {} },
  NormBuild: { mid: { k: 2 }, stepping: { k: 2, stepping: true }, start: { k: 0 }, done: {} },
  ManySlots: { mid: { k: 2 }, done: {} },
  PixelLength: { mid: { k: 1 }, done: {} },
  TwoJobs: { mid: { k: 1 }, done: {} },
  BothWaysQuestion: { mid: { k: 2 }, done: {} },
  OnlyZero: { mid: { k: 2 }, done: {} },
  TwiceBothWays: { mid: { k: 3 }, done: {} },
  HomeSchool: { mid: { k: 1 }, done: {} },
  FieldShortcut: { mid: { k: 1 }, done: {} },
  TriangleName: { mid: { k: 2 }, done: {} },
  VerdictSort: { mid: { k: 3 }, done: {} },
  TwoMoves: { mid: { k: 3 }, done: {} },
  ColorSixteen: { mid: { k: 2 }, done: {} },
  OneBarTwoBars: { mid: { k: 2 }, done: {} },
  SquareSieve: { mid: { k: 2 }, done: {} },
  NoRootNeeded: { mid: { k: 1 }, done: {} },
  CrowOverRows: { mid: { k: 2 }, done: {} },
  PrizeGiven: { start: {}, measured: { shown: [0, 1, 2, 3] }, over: { shown: [0, 1, 2, 3], pick: 2 } },
  SayIt: { start: {}, all: { open: [0, 1, 2, 3] } },
};
