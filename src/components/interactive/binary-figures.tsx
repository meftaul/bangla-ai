"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { Btn, Head, useInView } from "./figure-kit";
import "./pixel-figures.css";
import "./grid-figures.css";
import "./binary-figures.css";

// Figures for "Math for AI 1.2 — বাইনারি".
//
// The article tells binary as a story: load-shedding every night at ten, a
// friend across the lane, no phone balance, and a few spare bulbs. Each figure
// animates one beat of that story, in the order the article tells it:
//
//   14 · the lane: two buildings, the lights go out, one bulb in your window
//   15 · two bulbs, four messages — the codebook, played through
//   16 · three bulbs, eight messages — the same codebook, doubled
//   17 · why it doubles: copy the list, OFF in front of one copy, ON the other
//   18 · guess the count for four bulbs first, then build it and check
//   19 · the arithmetic as a tree: every bulb splits every branch in two
//
// Panel copy is English (the prose around them is Bangla); the messages are
// the article's own and stay in Bangla. DOM/SVG rather than canvas, and any
// loop sleeps while its figure is off screen — same rules as pixel-figures.tsx.

// The codebook from the article. Index = the pattern read as a binary number,
// leftmost bulb biggest — so the two-bulb code is exactly the first four
// entries of the three-bulb one, which is the doubling lesson in data form.
const CODE = [
  "আব্বু বাসায় নেই",
  "আব্বু একটু মুদির দোকানে গেছেন",
  "আম্মুও বাসায় নেই",
  "আম্মু মুদির দোকানে গেছেন",
  "কালকে বিকেল ৪টার দিকে মাঠে খেলতে যাবো",
  "কালকে ব্যাট-বলতুর আনার কথা",
  "বলটু ব্যাট না আনলে তুই আনিস",
  "বলটা না হয় আমিও আনলাম",
];
/** The first night's one-bulb code, indexed off → on. */
const ONE_BULB = ["আব্বু বাসায় নেই", "আব্বু বাসায় আছে"];

/** Bulb values for k bulbs, leftmost (biggest) first. */
const placesOf = (k: number) => Array.from({ length: k }, (_, j) => 1 << (k - 1 - j));
const bitsOf = (n: number, k: number) => placesOf(k).map((w) => (n & w) !== 0);
const words = (n: number, k: number) => bitsOf(n, k).map((b) => (b ? "on" : "off")).join(" · ");

const NAMES: Record<number, string[]> = { 2: ["left", "right"], 3: ["left", "middle", "right"] };

// ---------------------------------------------------------------------------
// Shared pieces.

/** A row of full-size bulbs. With `onToggle` each bulb is a switch. */
function Bulbs({
  n,
  k,
  onToggle,
  names,
}: {
  n: number;
  k: number;
  onToggle?: (w: number) => void;
  names?: string[];
}) {
  return (
    <div
      className="bfig-row"
      style={{ ["--k" as string]: k }}
      {...(onToggle ? {} : { role: "img", "aria-label": `bulbs, left to right: ${words(n, k)}` })}
    >
      {placesOf(k).map((w, j) => {
        const on = (n & w) !== 0;
        const cls = `bfig-lamp${on ? " on" : ""}${onToggle ? "" : " flat"}`;
        const body = (
          <>
            <i />
            {names ? <u>{names[j]}</u> : null}
          </>
        );
        return onToggle ? (
          <button
            key={w}
            type="button"
            className={cls}
            aria-pressed={on}
            aria-label={`${names?.[j] ?? ""} bulb`.trim()}
            onClick={() => onToggle(w)}
          >
            {body}
          </button>
        ) : (
          <div key={w} className={cls}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

/**
 * A pattern in miniature. `lead` is an extra bulb in front of it — the one the
 * doubling figures slide in: hidden until it arrives, then off or on.
 */
function Mini({ n, k, lead }: { n: number; k: number; lead?: "hidden" | "off" | "on" }) {
  return (
    <span className="bfig-mini" role="img" aria-label={`${lead && lead !== "hidden" ? `${lead} · ` : ""}${words(n, k)}`}>
      {lead ? <i className={`bfig-slot${lead === "hidden" ? "" : " in"}${lead === "on" ? " on" : ""}`} /> : null}
      {bitsOf(n, k).map((b, j) => (
        <i key={j} className={b ? "on" : ""} />
      ))}
    </span>
  );
}

/** Stepped figures: one step at a time, or played through while on screen. */
type Stepper = { step: number; last: number; playing: boolean; go: (s: number) => void; toggle: () => void };

function useSteps(count: number, box: RefObject<HTMLElement | null>, ms: number): Stepper {
  const [step, setStep] = useState(0);
  const [play, setPlay] = useState(false);
  const [awake, setAwake] = useState(true);
  useInView(box, { enter: () => setAwake(true), leave: () => setAwake(false) });

  const last = count - 1;
  // As in grid-figures: the last step simply stops satisfying `playing`.
  const playing = play && step < last;
  useEffect(() => {
    if (!playing || !awake) return;
    const t = setTimeout(() => setStep((s) => s + 1), ms);
    return () => clearTimeout(t);
  }, [playing, awake, step, ms]);

  return {
    step,
    last,
    playing,
    go: (s) => {
      setPlay(false);
      setStep(Math.max(0, Math.min(last, s)));
    },
    toggle: () => {
      if (step >= last) setStep(0);
      setPlay(!playing);
    },
  };
}

function StepList({ steps, s }: { steps: { title: string }[]; s: Stepper }) {
  return (
    <ol className="gfig-steps">
      {steps.map((x, i) => (
        <li key={x.title} className={i === s.step ? "on" : i < s.step ? "past" : ""}>
          <button type="button" onClick={() => s.go(i)}>
            {x.title}
          </button>
        </li>
      ))}
    </ol>
  );
}

function StepNav({ s, extra }: { s: Stepper; extra?: ReactNode }) {
  return (
    <div className="mfig-controls">
      <button type="button" className="mfig-btn" onClick={() => s.go(s.step - 1)} disabled={s.step === 0}>
        ← Back
      </button>
      <button type="button" className="mfig-btn" onClick={() => s.go(s.step + 1)} disabled={s.step === s.last}>
        Next →
      </button>
      <Btn on={s.playing} onClick={s.toggle}>
        {s.playing ? "Pause" : "Play all"}
      </Btn>
      {extra}
      <span className="mfig-read">
        step <b>{s.step + 1}</b> / {s.last + 1}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 14 · The lane. Two buildings face each other across a narrow lane. The
//      lights go out, the two facing windows are picked out, and a bulb
//      appears in yours — the reader switches it and sees the one-bulb code
//      from the article arrive on the other side.

const LANE_W = 320;
const LANE_H = 200;
const GROUND = 176;

type Bldg = { x: number; y: number; w: number; tank: number };
const YOURS: Bldg = { x: 14, y: 58, w: 108, tank: 26 };
const THEIRS: Bldg = { x: 198, y: 66, w: 108, tank: 272 };
const WIN_W = 30;
const WIN_H = 22;
const winsOf = (b: Bldg) =>
  [0, 1, 2].flatMap((r) => [0, 1].map((c) => ({ x: b.x + 14 + c * 50, y: b.y + 16 + r * 32, r, c })));

// The two windows that face each other: yours is top-right, theirs top-left.
const MY_WIN = { x: YOURS.x + 64, y: YOURS.y + 16 };
const FR_WIN = { x: THEIRS.x + 14, y: THEIRS.y + 16 };
const BULB = { x: MY_WIN.x + WIN_W / 2, y: MY_WIN.y + 7 };

const STARS: [number, number][] = [
  [30, 18], [62, 32], [100, 14], [138, 28], [176, 12], [212, 34], [240, 16], [304, 24], [118, 46], [192, 50],
];
const FAR = [
  { x: 124, y: 112, w: 22 },
  { x: 146, y: 98, w: 18 },
  { x: 170, y: 120, w: 26 },
];

const LANE_STEPS = [
  {
    title: "10 pm — the lane is lit",
    note: "Your building on the left, your friend’s across the lane. Every window glows, and so does the street light.",
  },
  {
    title: "Load-shedding",
    note: "The power goes, and the whole lane goes dark. For days now it has gone at 10 every night.",
  },
  {
    title: "Two windows, face to face",
    note: "From your window you can see straight into your friend’s. The phone has no balance, but you can still see each other.",
  },
  {
    title: "One spare bulb",
    note: "A spare bulb in your window. Tap it to switch it on or off, and see what your friend reads from across the lane.",
  },
];

export function LaneFigure() {
  const box = useRef<HTMLElement>(null);
  const s = useSteps(LANE_STEPS.length, box, 2400);
  const [on, setOn] = useState(false);

  const lit = s.step === 0;
  const dark = s.step >= 1;
  const bulb = s.step === s.last;
  const glow = bulb && on;

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 14" title="Two windows, face to face across the lane" />
      <div className="pfig-body">
        <svg
          viewBox={`0 0 ${LANE_W} ${LANE_H}`}
          className={`mfig-svg bfig-lane${dark ? " dark" : ""}${bulb ? " tap" : ""}`}
          role="img"
          aria-label={`a lane at night between your building and your friend's. ${LANE_STEPS[s.step].title}`}
          onClick={() => bulb && setOn(!on)}
        >
          <rect width={LANE_W} height={LANE_H} className="bfig-sky" />
          <g className={`bfig-fade${dark ? " on" : ""}`}>
            <circle cx={278} cy={30} r={11} className="bfig-moon" />
            {STARS.map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} className="bfig-star" />
            ))}
          </g>
          {FAR.map((f) => (
            <rect key={f.x} x={f.x} y={f.y} width={f.w} height={GROUND - f.y} className="bfig-far" />
          ))}
          <rect x={0} y={GROUND} width={LANE_W} height={LANE_H - GROUND} className="bfig-ground" />
          <line x1={126} y1={189} x2={194} y2={189} className="bfig-laneline" />

          {/* the street light, and the pool of light it throws on the lane */}
          <polygon points={`155,94 165,94 188,${GROUND} 132,${GROUND}`} className={`bfig-cone${lit ? " on" : ""}`} />
          <line x1={160} y1={GROUND} x2={160} y2={92} className="bfig-post" />
          <circle cx={160} cy={91} r={3.5} className={`bfig-streetlamp${lit ? " on" : ""}`} />

          {[YOURS, THEIRS].map((b, bi) => (
            <g key={bi}>
              <rect x={b.tank} y={b.y - 19} width={18} height={14} rx={2} className="bfig-bldg" />
              <rect x={b.x - 4} y={b.y - 5} width={b.w + 8} height={6} className="bfig-bldg edge" />
              <rect x={b.x} y={b.y} width={b.w} height={GROUND - b.y} className="bfig-bldg" />
              {winsOf(b).map((w) => {
                const facing = w.r === 0 && w.c === (bi === 0 ? 1 : 0);
                return (
                  <rect
                    key={`${w.r}${w.c}`}
                    x={w.x}
                    y={w.y}
                    width={WIN_W}
                    height={WIN_H}
                    rx={1.5}
                    className={`bfig-win${lit ? " lit" : ""}${facing && s.step >= 2 ? " face" : ""}${
                      facing && bi === 0 && glow ? " glow" : ""
                    }`}
                  />
                );
              })}
            </g>
          ))}

          {/* the two of you, and the line of sight across the lane */}
          <g className={`bfig-fade${s.step >= 2 ? " on" : ""}`}>
            <line
              x1={MY_WIN.x + WIN_W}
              y1={MY_WIN.y + 11}
              x2={FR_WIN.x}
              y2={FR_WIN.y + 11}
              className={`bfig-sight${glow ? " on" : ""}`}
            />
            <circle cx={MY_WIN.x + 8} cy={MY_WIN.y + 15} r={3} className="bfig-person" />
            <path d={`M${MY_WIN.x + 2} ${MY_WIN.y + WIN_H}Q${MY_WIN.x + 8} ${MY_WIN.y + 16} ${MY_WIN.x + 14} ${MY_WIN.y + WIN_H}Z`} className="bfig-person" />
            <circle cx={FR_WIN.x + 22} cy={FR_WIN.y + 15} r={3} className="bfig-person" />
            <path d={`M${FR_WIN.x + 16} ${FR_WIN.y + WIN_H}Q${FR_WIN.x + 22} ${FR_WIN.y + 16} ${FR_WIN.x + 28} ${FR_WIN.y + WIN_H}Z`} className="bfig-person" />
            <text x={MY_WIN.x + WIN_W / 2} y={MY_WIN.y - 4} textAnchor="middle" className="bfig-who">
              you
            </text>
            <text x={FR_WIN.x + WIN_W / 2} y={FR_WIN.y - 4} textAnchor="middle" className="bfig-who">
              friend
            </text>
          </g>

          {/* your spare bulb */}
          <g className={`bfig-fade${bulb ? " on" : ""}`}>
            <line x1={BULB.x} y1={MY_WIN.y} x2={BULB.x} y2={BULB.y - 3.4} className="bfig-wire" />
            <circle cx={BULB.x} cy={BULB.y} r={10} className={`bfig-glow${glow ? " on" : ""}`} />
            <circle cx={BULB.x} cy={BULB.y} r={3.6} className={`bfig-bulb${glow ? " on" : ""}`} />
          </g>
        </svg>

        <div className="pfig-split">
          <StepList steps={LANE_STEPS} s={s} />
          <div className="pfig-col">
            <p className="gfig-say">{LANE_STEPS[s.step].note}</p>
            {bulb && (
              <div className="bfig-reads">
                <span>Your bulb is {on ? "on" : "off"} · your friend reads</span>
                <b key={String(on)}>{ONE_BULB[on ? 1 : 0]}</b>
              </div>
            )}
          </div>
        </div>
      </div>

      <StepNav
        s={s}
        extra={
          bulb ? (
            <Btn on={on} onClick={() => setOn(!on)}>
              {on ? "Switch bulb off" : "Switch bulb on"}
            </Btn>
          ) : null
        }
      />

      <figcaption>
        Press <strong>Next →</strong> to walk through the evening, or <strong>Play all</strong>. At the last step, tap
        the bulb in your window: one bulb, two states, two messages. That is all a single bulb can ever say.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 15, 16 · The codebook. The article's on/off tables, made live: the bulbs in
//      your window, what your friend reads, and the agreed list with the
//      current pattern lit. "Play the codebook" sends every message in order.
//      At three bulbs the four rows that did not exist at two are marked new,
//      which sets up figure 17.

export function BulbCodeFigure({ bulbs }: { bulbs: 2 | 3 }) {
  const box = useRef<HTMLElement>(null);
  const total = 1 << bulbs;
  const [n, setN] = useState(0);
  const [play, setPlay] = useState(false);
  const [awake, setAwake] = useState(true);
  useInView(box, { enter: () => setAwake(true), leave: () => setAwake(false) });

  const playing = play && n < total - 1;
  useEffect(() => {
    if (!playing || !awake) return;
    const t = setTimeout(() => setN((v) => v + 1), 1600);
    return () => clearTimeout(t);
  }, [playing, awake, n]);

  const pick = (v: number) => {
    setPlay(false);
    setN(v);
  };

  return (
    <figure className="mfig" ref={box}>
      <Head
        n={bulbs === 2 ? "Figure 15" : "Figure 16"}
        title={bulbs === 2 ? "Two bulbs, four messages" : "Three bulbs, eight messages"}
      />
      <div className="pfig-body pfig-split wide">
        <div className="pfig-col">
          <div className="bfig-window">
            <p className="pfig-label">Your window · tap a bulb</p>
            <Bulbs n={n} k={bulbs} names={NAMES[bulbs]} onToggle={(w) => pick(n ^ w)} />
          </div>
          <div className="bfig-reads">
            <span>{words(n, bulbs)} · your friend reads</span>
            <b key={n}>{CODE[n]}</b>
          </div>
        </div>

        <div className="pfig-col">
          <p className="pfig-label">The codebook you both agreed on</p>
          <ol className="bfig-code">
            {CODE.slice(0, total).map((m, v) => (
              <li key={v}>
                <button type="button" className={v === n ? "on" : ""} onClick={() => pick(v)}>
                  <Mini n={v} k={bulbs} />
                  <span className="bfig-msg">{m}</span>
                  {bulbs === 3 && v >= 4 ? <em className="bfig-new">new</em> : <span />}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mfig-controls">
        <Btn
          on={playing}
          onClick={() => {
            if (playing) return setPlay(false);
            if (n >= total - 1) setN(0);
            setPlay(true);
          }}
        >
          {playing ? "Pause" : "Play the codebook"}
        </Btn>
        <span className="mfig-read">
          message <b>{n + 1}</b> / {total}
        </span>
      </div>

      <figcaption>
        {bulbs === 2 ? (
          <>
            Tap the bulbs, or tap a row of the codebook. <strong>Play the codebook</strong> sends every pattern in order:
            watch your window and what your friend reads.
          </>
        ) : (
          <>
            Same codebook, one more bulb. The first four rows are your two-bulb code with the left bulb off. The four
            marked <strong>new</strong> all have the left bulb on.
          </>
        )}
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 17 · Why it doubles. The article's own sentence, acted out: take the list
//      you had, make a second copy, slide an OFF bulb in front of the first
//      copy and an ON bulb in front of the second. OFF changes no meanings;
//      ON makes every pattern in the copy brand new. Old + new = double.

const DBL_STEPS = [
  { title: "The 4 patterns you already had", note: "Two bulbs, four patterns, four messages: yesterday’s codebook." },
  {
    title: "Make a second copy",
    note: "Copy the whole list. Now there are two identical lists, but one pattern cannot mean two things, so the copies have to be told apart.",
  },
  {
    title: "Put OFF in front of the first copy",
    note: "A third bulb goes in front. Switched off, it changes nothing: the first copy keeps its four old messages.",
  },
  {
    title: "Put ON in front of the second copy",
    note: "The same third bulb, switched on. Every pattern in the second copy is now brand new, so it can carry four new messages.",
  },
  {
    title: "4 + 4 = 8",
    note: "The old list with OFF, and the old list again with ON. Every new bulb does exactly this, so every new bulb doubles the messages.",
  },
];

export function DoublingFigure() {
  const box = useRef<HTMLElement>(null);
  const s = useSteps(DBL_STEPS.length, box, 2600);
  const { step } = s;

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 17" title="OFF in front, ON in front — twice the messages" />
      <div className="pfig-body">
        <div className="bfig-dbl">
          {[0, 1].map((half) => {
            const shown = half === 0 || step >= 1;
            const fronted = step >= (half === 0 ? 2 : 3);
            const lead = fronted ? (half ? "on" : "off") : "hidden";
            const label =
              half === 0
                ? step >= 2
                  ? "Copy 1 · OFF in front"
                  : step >= 1
                    ? "Copy 1"
                    : "The list"
                : step >= 3
                  ? "Copy 2 · ON in front"
                  : "Copy 2";
            return (
              <div
                key={half}
                className={`bfig-copy${half ? " b" : ""}${shown ? " in" : ""}${fronted ? (half ? " lit" : " dim") : ""}`}
                aria-hidden={!shown}
              >
                <p className="pfig-label">{label}</p>
                <ol className="bfig-code">
                  {[0, 1, 2, 3].map((v) => {
                    const fresh = half === 1 && step >= 3;
                    return (
                      <li key={v}>
                        <div className="bfig-code-row">
                          <Mini n={v} k={2} lead={lead} />
                          <span key={String(fresh)} className={`bfig-msg${half === 1 ? (fresh ? " fresh" : " dup") : ""}`}>
                            {CODE[fresh ? 4 + v : v]}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>

        <div className="pfig-split wide">
          <StepList steps={DBL_STEPS} s={s} />
          <div className="pfig-col">
            <p className={`gfig-say${step === s.last ? " good" : ""}`}>{DBL_STEPS[step].note}</p>
            {step === s.last && (
              <p className="pfig-big">
                4 + 4 = 8<small>old messages + new messages</small>
              </p>
            )}
          </div>
        </div>
      </div>

      <StepNav s={s} />

      <figcaption>
        Step through slowly. The new bulb (ringed) always goes <strong>in front</strong>. With it off, the old messages
        keep their meaning; with it on, you get a whole fresh set.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 18 · Four bulbs, predicted. The reader commits to a number first, from the
//      tally alone, and only then builds it — the eight three-bulb patterns,
//      copied, OFF in front of one copy and ON in front of the other — so the
//      answer is something they checked, not something they were told.

const GUESSES = [9, 10, 12, 16];
const BUILD = [
  "",
  "Here are the 8 patterns of 3 bulbs.",
  "Make a second copy of all 8.",
  "Fourth bulb in front: OFF on the first copy, ON on the second.",
];

export function PredictFigure() {
  const box = useRef<HTMLElement>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [phase, setPhase] = useState(0); // 0 not built · 1–3 building · 4 counted
  const [awake, setAwake] = useState(true);
  useInView(box, { enter: () => setAwake(true), leave: () => setAwake(false) });

  const building = phase > 0 && phase < 4;
  useEffect(() => {
    if (!building || !awake) return;
    const t = setTimeout(() => setPhase((p) => p + 1), 1500);
    return () => clearTimeout(t);
  }, [building, awake, phase]);

  const done = phase === 4;

  let say: string;
  let tone = "";
  if (done) {
    tone = guess === 16 ? " good" : " warn";
    say =
      guess === 16
        ? "16 — you called it before building it. 8 patterns with OFF in front + 8 with ON in front."
        : `The bulbs say 16, not ${guess}. 8 with OFF in front + 8 with ON in front = 16. Every bulb doubles: 2, 4, 8, 16.`;
  } else if (building) {
    say = BUILD[phase];
  } else if (guess !== null) {
    say = `You guessed ${guess}. Now check it: build the four-bulb patterns from the three-bulb ones.`;
  } else {
    say = "Look at the tally. What happens to the number each time a bulb is added? Pick your guess first.";
  }

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 18" title="Four bulbs: guess first, then build it" />
      <div className="pfig-body pfig-split">
        <div className="pfig-col">
          <p className="pfig-label">Tally</p>
          <ol className="bfig-tally">
            <li>
              <span>1 bulb</span>
              <b>2</b>
            </li>
            <li className="x">× 2</li>
            <li>
              <span>2 bulbs</span>
              <b>4</b>
            </li>
            <li className="x">× 2</li>
            <li>
              <span>3 bulbs</span>
              <b>8</b>
            </li>
            <li className="x">{done ? "× 2" : "× ?"}</li>
            <li className="big">
              <span>4 bulbs</span>
              <b>{done ? 16 : "?"}</b>
            </li>
          </ol>

          <p className="pfig-label">Your guess for 4 bulbs</p>
          <div className="bfig-opts">
            {GUESSES.map((o) => (
              <button
                key={o}
                type="button"
                className={`bfig-opt${
                  done ? (o === 16 ? " right" : o === guess ? " wrong" : "") : o === guess ? " sel" : ""
                }`}
                onClick={() => setGuess(o)}
                disabled={phase > 0}
              >
                {o}
              </button>
            ))}
          </div>
          <p className={`gfig-say${tone}`}>{say}</p>
        </div>

        <div className="bfig-dbl keep">
          {[0, 1].map((half) => {
            const shown = phase >= (half === 0 ? 1 : 2);
            const lead = phase >= 3 ? (half ? "on" : "off") : "hidden";
            return (
              <div
                key={half}
                className={`bfig-copy b${shown ? " in" : ""}${phase >= 3 ? (half ? " lit" : " dim") : ""}`}
                aria-hidden={!shown}
              >
                <p className="pfig-label">{phase >= 3 ? (half ? "ON in front" : "OFF in front") : half ? "Copy" : "3 bulbs"}</p>
                <div className="bfig-stack">
                  {Array.from({ length: 8 }, (_, v) => (
                    <Mini key={v} n={v} k={3} lead={lead} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mfig-controls">
        <button type="button" className="mfig-btn go" onClick={() => setPhase(1)} disabled={guess === null || phase > 0}>
          Build it and check
        </button>
        <button
          type="button"
          className="mfig-btn"
          onClick={() => {
            setGuess(null);
            setPhase(0);
          }}
        >
          Start over
        </button>
        <span className="mfig-read">
          patterns: <b>{phase === 0 ? "?" : phase < 2 ? 8 : phase < 4 ? "8 + 8" : 16}</b>
        </span>
      </div>

      <figcaption>
        No counting on your fingers: make a guess from the tally, then press <strong>Build it and check</strong>. The
        figure builds four bulbs out of three, the same way figure 17 built three out of two.
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 19 · The arithmetic. One bulb is a fork with two branches, off and on. The
//      next bulb forks every branch again, so the branches multiply: 2, then
//      2 × 2, then 2 × 2 × 2. The tree grows one level per step, the equation
//      grows with it, and the column on the right reads each branch back as
//      the pattern it spells — the codebook's rows, in the codebook's order.

const TREE_K = 4;
const TW = 320;
const TH = 236;
const TOP = 26;
const SPAN = TH - TOP - 8;
const LX = [16, 72, 128, 184, 238];
const PAT_X = 256;
const NODE_R = [0, 6.5, 5.5, 4.4, 3.4];

/** Vertical position of node j on level L (level 0 is the start). */
const nodeY = (level: number, j: number) => TOP + ((j + 0.5) * SPAN) / (1 << level);

const TREE_STEPS = [
  { title: "Bulb 1: off or on", note: "One bulb has two options: off or on. Two branches — 2." },
  {
    title: "Bulb 2: every branch splits",
    note: "The second bulb also has two options, and it has them on each branch. 2 branches, each split in 2: 2 × 2 = 4.",
  },
  {
    title: "Bulb 3: split again",
    note: "Three bulbs side by side: every one of the 4 branches splits in two. 2 × 2 × 2 = 8 — the eight rows of your codebook.",
  },
  {
    title: "Bulb 4: and again",
    note: "Your prediction, checked by arithmetic: 2 × 2 × 2 × 2 = 16. Each new bulb multiplies by 2.",
  },
];

export function BranchTreeFigure() {
  const box = useRef<HTMLElement>(null);
  const s = useSteps(TREE_STEPS.length, box, 2800);
  const shown = s.step + 1; // bulbs on the tree

  const levels = Array.from({ length: TREE_K }, (_, i) => i + 1);

  return (
    <figure className="mfig" ref={box}>
      <Head n="Figure 19" title="2 × 2 × 2 — every bulb splits every branch" />
      <div className="pfig-body pfig-split wide">
        <svg viewBox={`0 0 ${TW} ${TH}`} className="mfig-svg" role="img" aria-label={`a tree of choices for ${shown} bulbs: ${1 << shown} branches`}>
          {levels.map((L) => (
            <text key={L} x={LX[L]} y={12} textAnchor="middle" className={`bfig-tlabel bfig-fade${L <= shown ? " on" : ""}`}>
              bulb {L}
            </text>
          ))}
          <text x={PAT_X + 12} y={12} textAnchor="middle" className="bfig-tlabel">
            pattern
          </text>

          {/* the branches, drawn in as each bulb arrives */}
          {levels.map((L) =>
            Array.from({ length: 1 << L }, (_, j) => (
              <line
                key={`e${L}-${j}`}
                x1={LX[L - 1]}
                y1={nodeY(L - 1, j >> 1)}
                x2={LX[L]}
                y2={nodeY(L, j)}
                pathLength={1}
                className={`bfig-edge${L <= shown ? " on" : ""}`}
              />
            )),
          )}
          <text x={(LX[0] + LX[1]) / 2 - 2} y={(nodeY(0, 0) + nodeY(1, 0)) / 2 - 3} textAnchor="middle" className="bfig-tlabel">
            off
          </text>
          <text x={(LX[0] + LX[1]) / 2 - 2} y={(nodeY(0, 0) + nodeY(1, 1)) / 2 + 9} textAnchor="middle" className="bfig-tlabel on">
            on
          </text>

          <circle cx={LX[0]} cy={nodeY(0, 0)} r={3} className="bfig-root" />

          {levels.map((L) =>
            Array.from({ length: 1 << L }, (_, j) => (
              <circle
                key={`n${L}-${j}`}
                cx={LX[L]}
                cy={nodeY(L, j)}
                r={NODE_R[L]}
                className={`bfig-node${j & 1 ? " on" : ""}${L <= shown ? " in" : ""}`}
              />
            )),
          )}

          {/* each branch of the newest level, read back as its pattern */}
          {levels.map((L) => (
            <g key={`p${L}`} className={`bfig-tpat bfig-fade${L === shown ? " on" : ""}`}>
              {Array.from({ length: 1 << L }, (_, j) =>
                bitsOf(j, L).map((b, k) => (
                  <circle key={`${j}-${k}`} cx={PAT_X + k * 7} cy={nodeY(L, j)} r={2.6} className={b ? "on" : ""} />
                )),
              )}
            </g>
          ))}
        </svg>

        <div className="pfig-col">
          <StepList steps={TREE_STEPS} s={s} />
          <p className="gfig-say">{TREE_STEPS[s.step].note}</p>
          <p className="pfig-big">
            {Array.from({ length: shown }, () => "2").join(" × ")}
            {shown > 1 ? ` = ${1 << shown}` : ""}
            <small>
              {1 << shown} patterns with {shown} bulb{shown > 1 ? "s" : ""}
            </small>
          </p>
        </div>
      </div>

      <StepNav s={s} />

      <figcaption>
        Follow any branch from the start to the right: each fork is one bulb, upper for <strong>off</strong>, lower for{" "}
        <strong>on</strong>. Every path spells one pattern, and no two paths spell the same one.
      </figcaption>
    </figure>
  );
}
