"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { Btn, Head, bn, useInView } from "./figure-kit";
import "./pixel-figures.css";
import "./grid-figures.css";

// Figures for "AI-এর গণিত ১·৫ — গ্রাফ পেপার".
//
// The side lesson has one job: get the reader from "I am standing in the middle
// of a tiled room" to "two numbers are an address", without ever saying the word
// coordinate first. So the figures are deliberately ordered as room → address →
// paper, and each one is the previous one with a little more stripped away:
//
//   11 · a robot that only understands (direction, number of tiles)
//   12 · the ball anywhere in that room, named by two numbers
//   13 · the same room with the furniture, walls and robot removed — paper
//
// Same rules as pixel-figures.tsx / feature-figures.tsx: SVG and DOM rather than
// canvas (Bangla labels shape correctly), English microcopy inside the panels,
// and any loop sleeps while the figure is off screen.

// ---------------------------------------------------------------------------
// The room, in tiles. You stand at (0, 0); the ball sits in the top-right
// corner, which the article fixes at 10 tiles right and 12 tiles up — so the
// floor is exactly 21 × 25 tiles and BALL *is* the corner, not near it.

const CX = 10;
const CY = 12;
const COLS = 2 * CX + 1;
const ROWS = 2 * CY + 1;
const BALL: Cell = [CX, CY];

type Cell = [number, number];

const T = 14; // tile side, in viewBox units
const PAD = { l: 20, r: 12, t: 12, b: 20 };
const VW = COLS * T + PAD.l + PAD.r;
const VH = ROWS * T + PAD.t + PAD.b;

/** left edge of the tile in column x (x grows rightwards from you) */
const px = (x: number) => PAD.l + (x + CX) * T;
/** top edge of the tile in row y (y grows *upwards* from you — screen y falls) */
const py = (y: number) => PAD.t + (CY - y) * T;
const mx = (x: number) => px(x) + T / 2;
const my = (y: number) => py(y) + T / 2;

const inRoom = ([x, y]: Cell) => x >= -CX && x <= CX && y >= -CY && y <= CY;
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];

/**
 * Which tile a pointer landed on.
 *
 * The SVG scales to its column, so client pixels are converted through the
 * element's own box rather than assumed to be viewBox units.
 */
function tileAt(svg: SVGSVGElement, e: { clientX: number; clientY: number }): Cell {
  const r = svg.getBoundingClientRect();
  const ux = ((e.clientX - r.left) / r.width) * VW;
  const uy = ((e.clientY - r.top) / r.height) * VH;
  const x = Math.floor((ux - PAD.l) / T) - CX;
  const y = CY - Math.floor((uy - PAD.t) / T);
  return [Math.max(-CX, Math.min(CX, x)), Math.max(-CY, Math.min(CY, y))];
}

/** The tiled floor itself: one path of grid lines, not 525 rects. */
function FloorTiles() {
  let d = "";
  for (let c = 0; c <= COLS; c++) d += `M${px(-CX) + c * T} ${py(CY)}v${ROWS * T}`;
  for (let r = 0; r <= ROWS; r++) d += `M${px(-CX)} ${py(CY) + r * T}h${COLS * T}`;
  return (
    <>
      <rect x={px(-CX)} y={py(CY)} width={COLS * T} height={ROWS * T} className="gfig-floor" />
      <path d={d} className="gfig-tile" />
    </>
  );
}

/** You, standing in the middle of an empty apartment. */
function You({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return (
    <g className="gfig-you" aria-hidden="true">
      <circle cx={mx(x)} cy={my(y)} r={T * 0.34} />
      <text x={mx(x)} y={my(y) - T * 0.75} textAnchor="middle">
        আপনি
      </text>
    </g>
  );
}

function Ball({ at, glow }: { at: Cell; glow?: boolean }) {
  return (
    <g className={glow ? "gfig-ball got" : "gfig-ball"}>
      <circle cx={mx(at[0])} cy={my(at[1])} r={T * 0.3} />
      <text x={mx(at[0])} y={my(at[1]) - T * 0.8} textAnchor="middle">
        ball
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// 11 · The robot. The reader is given five things they might say to Shiku and
//      watches each one play out a tile at a time. Two of them work, and the
//      one that fails most usefully is the one with the right two numbers in
//      the wrong order — which is the vector lesson, walked into a wall.

type Dir = "R" | "L" | "U" | "D";
const STEP: Record<Dir, Cell> = { R: [1, 0], L: [-1, 0], U: [0, 1], D: [0, -1] };

type Plan = {
  id: string;
  label: string;
  legs: { dir: Dir; n: number }[];
  /** what Shiku does with it — only "walk" ever moves him */
  kind: "walk" | "diagonal" | "vague";
  say: string;
};

const PLANS: Plan[] = [
  {
    id: "vague",
    label: "“যাও, ball টা নিয়ে আসো”",
    legs: [],
    kind: "vague",
    say: "Shiku একদমই নড়ল না। ও জানেই না ball কী বা ballটা কোথায় আছে। ও শুধু জানে, ও ডানে, বাঁয়ে, উপরে আর নিচে একবারে এক ঘর করে move করতে পারবে।",
  },
  {
    id: "diag",
    label: "কোণাকুনি হেঁটে গিয়ে নিয়ে আসো।",
    legs: [],
    kind: "diagonal",
    say: "এটাই shortest way। But ও এভাবে নড়তে পারবে না, ও শুধু ডানে, বাঁয়ে, উপরে, নিচে এক ঘর করে move করতে পারবে।",
  },
  {
    id: "right-up",
    label: "ডানে ১০ ঘর, তারপর উপরে ১২ ঘর।",
    legs: [{ dir: "R", n: 10 }, { dir: "U", n: 12 }],
    kind: "walk",
    say: "এবার ও পৌঁছাতে পারবে। ওকে আমরা শুধু কোন direction-এ কত ঘর যেতে হবে, সেটা বলে দিয়েছি।",
  },
  {
    id: "up-right",
    label: "উপরে ১২ ঘর, তারপর ডানে ১০ ঘর।",
    legs: [{ dir: "U", n: 12 }, { dir: "R", n: 10 }],
    kind: "walk",
    say: "এবার ওকে একটু অন্যভাবে বলেছি, but খেয়াল করুন, উপরের দিকে ১২ ঘর আর ডানের দিকে ১০ ঘর—এই ব্যাপারটা fixed আছে এখনও।",
  },
  {
    id: "swapped",
    label: "ডানে ১২ ঘর, তারপর উপরে ১০ ঘর।",
    legs: [{ dir: "R", n: 12 }, { dir: "U", n: 10 }],
    kind: "walk",
    say: "ডানে ১২ ঘর যেতে হলে ওকে room থেকেই বের হয়ে যেতে হবে। So, not possible.",
  },
];

/** Every tile Shiku stands on, in order, stopping dead at a wall. */
function walk(legs: Plan["legs"]) {
  const cells: Cell[] = [[0, 0]];
  let at: Cell = [0, 0];
  for (const leg of legs) {
    const [dx, dy] = STEP[leg.dir];
    for (let i = 0; i < leg.n; i++) {
      const next: Cell = [at[0] + dx, at[1] + dy];
      if (!inRoom(next)) return { cells, walled: true };
      at = next;
      cells.push(at);
    }
  }
  return { cells, walled: false };
}

const WALKS = Object.fromEntries(PLANS.map((p) => [p.id, walk(p.legs)])) as Record<
  string,
  { cells: Cell[]; walled: boolean }
>;

export function RobotPlanFigure() {
  const box = useRef<HTMLElement>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [at, setAt] = useState(0);
  const [run, setRun] = useState(false);
  const [awake, setAwake] = useState(true);
  useInView(box, { enter: () => setAwake(true), leave: () => setAwake(false) });

  const plan = PLANS.find((p) => p.id === pick) ?? null;
  const path = plan && plan.kind === "walk" ? WALKS[plan.id] : null;
  const cells = path?.cells ?? [[0, 0] as Cell];
  const done = at >= cells.length - 1;

  // One tile per tick while the figure is on screen. "Still walking" is derived
  // rather than switched off at the end, so the last tile does not cost an extra
  // render just to clear a flag.
  const walking = run && !done;
  useEffect(() => {
    if (!walking || !awake) return;
    const t = setTimeout(() => setAt((i) => i + 1), 110);
    return () => clearTimeout(t);
  }, [walking, awake, at]);

  const choose = (p: Plan) => {
    setPick(p.id);
    setAt(0);
    setRun(p.kind === "walk");
  };

  const here = cells[Math.min(at, cells.length - 1)];
  const reached = plan?.kind === "walk" && done && same(here, BALL);

  // The running readout is the whole point: a position is two counts.
  const acrossWord = here[0] < 0 ? "" : "ডানে";
  const upWord = here[1] < 0 ? "নিচে" : "উপরে";

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ১১" title="Shiku শুধু ওপর, নিচ, ডান, —এই চারটা direction বোঝে এবং জানে, এই চার দিকের যেকোনো এক দিকে সে এক ঘর যেতে পারবে" />
      <div className="pfig-body pfig-split wide">
        <div className="gfig-plot">
          <svg viewBox={`0 0 ${VW} ${VH}`} className="mfig-svg" role="img" aria-label="an empty tiled apartment with a ball in the top right corner">
            <FloorTiles />

            {/* the straight line the reader wants to take, and cannot */}
            {plan?.kind === "diagonal" && (
              <g className="gfig-nope">
                <line x1={mx(0)} y1={my(0)} x2={mx(BALL[0])} y2={my(BALL[1])} />
                <text x={(mx(0) + mx(BALL[0])) / 2} y={(my(0) + my(BALL[1])) / 2} textAnchor="middle">
                  ✕
                </text>
              </g>
            )}

            {/* tiles already walked */}
            {plan?.kind === "walk" &&
              cells.slice(1, at + 1).map(([x, y], i) => (
                <rect key={i} x={px(x) + 1.5} y={py(y) + 1.5} width={T - 3} height={T - 3} className="gfig-trail" />
              ))}

            {/* the wall he is about to meet, drawn only once he is against it */}
            {plan?.id === "swapped" && done && path?.walled && (
              <line x1={px(CX) + T} y1={py(CY)} x2={px(CX) + T} y2={py(-CY) + T} className="gfig-wall" />
            )}

            <You />
            {!reached && <Ball at={BALL} />}

            {plan?.kind === "walk" && (
              <g className="gfig-bot" style={{ transform: `translate(${mx(here[0])}px, ${my(here[1])}px)` }}>
                <rect x={-T * 0.34} y={-T * 0.34} width={T * 0.68} height={T * 0.68} rx={2} />
                {/* against a side wall his name would hang off the floor, so it
                    tucks back over him instead of staying centred */}
                <text
                  x={here[0] > CX - 2 ? T * 0.34 : here[0] < 2 - CX ? -T * 0.34 : 0}
                  y={-T * 0.72}
                  textAnchor={here[0] > CX - 2 ? "end" : here[0] < 2 - CX ? "start" : "middle"}
                >
                  Shiku
                </text>
              </g>
            )}

            {/* He ends up standing on the ball's tile, so on arrival the ball is
                drawn last — otherwise the one moment worth seeing is hidden. */}
            {reached && <Ball at={BALL} glow />}
          </svg>
        </div>

        <div className="pfig-col">
          <p className="pfig-label">Shiku-কে instruction দিন:</p>
          <div className="gfig-choices">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`gfig-choice${p.id === pick ? " on" : ""}`}
                aria-pressed={p.id === pick}
                onClick={() => choose(p)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {plan?.kind === "walk" ? (
            <p className="pfig-mono">
              কত ঘর হাঁটল: <b>{bn(at ?? 0)}</b>
              <br />
              {acrossWord} <b>{bn(Math.abs(here[0]))}</b>, {upWord} <b>{bn(Math.abs(here[1]))}</b>
            </p>
          ) : (
            <p className="pfig-mono">
              কত ঘর হাঁটল: <b>০</b>
            </p>
          )}

          <p className={`gfig-say${plan ? (reached ? " good" : plan.kind === "walk" && done ? " bad" : plan.kind !== "walk" ? " bad" : "") : ""}`}>
            {!plan
              ? "একটা বেছে নিয়ে দেখুন ও কী করে। ও ওপর, নিচ, বাঁয়ে, ডানে একবারে এক ঘর করে move করতে পারে।"
              : plan.kind !== "walk" || done
                ? plan.say
                : "হাঁটছে…"}
          </p>
        </div>
      </div>

      <div className="mfig-controls">
        <Btn
          on={walking}
          onClick={() => {
            if (!plan || plan.kind !== "walk") return;
            setAt(0);
            setRun(true);
          }}
        >
          আবার দেখান
        </Btn>
        <span className="mfig-read">
          ও যেতে পারে: <b>↑ ↓ ← →</b>, একবারে এক ঘর
        </span>
      </div>

      <figcaption>
        <strong>উপরের options গুলো explore করে দেখুন। কোনটা কী করে।</strong>
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 12 · Now move the ball. The article asks the reader outright whether the ball
//      can be written as two numbers like a student was; this figure answers by
//      never showing anything except two numbers, wherever the ball is put.

/** The L-shaped route: all the way across, then all the way up. */
function route(to: Cell): Cell[] {
  const cells: Cell[] = [[0, 0]];
  const sx = Math.sign(to[0]);
  const sy = Math.sign(to[1]);
  for (let i = 1; i <= Math.abs(to[0]); i++) cells.push([i * sx, 0]);
  for (let i = 1; i <= Math.abs(to[1]); i++) cells.push([to[0], i * sy]);
  return cells;
}

export function BallAddressFigure() {
  const box = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [ball, setBall] = useState<Cell>(BALL);
  const [at, setAt] = useState<number | null>(null); // null = not counting
  const [awake, setAwake] = useState(true);
  useInView(box, { enter: () => setAwake(true), leave: () => setAwake(false) });

  const path = route(ball);
  const counting = at !== null && at < path.length - 1;

  useEffect(() => {
    if (at === null || !awake || !counting) return;
    const t = setTimeout(() => setAt((i) => (i ?? 0) + 1), 110);
    return () => clearTimeout(t);
  }, [at, awake, counting]);

  const move = (c: Cell) => {
    setBall(c);
    setAt(null);
  };

  // While counting, the readout shows how far along the walk is — so the two
  // numbers are literally counted out, not asserted.
  const shown: Cell = at === null ? ball : path[Math.min(at, path.length - 1)];
  const [bx, by] = ball;

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ১২" title="এই ঘরের প্রত্যেকটা tile-এর address বলার জন্য দুইটা number-ই যথেষ্ট" />
      <div className="pfig-body pfig-split wide">
        <div className="gfig-plot">
          <svg
            ref={svg}
            viewBox={`0 0 ${VW} ${VH}`}
            className="mfig-svg gfig-pick"
            tabIndex={0}
            role="application"
            aria-label={`the ball is ${Math.abs(bx)} tiles ${bx < 0 ? "left" : "right"} and ${Math.abs(by)} tiles ${by < 0 ? "down" : "up"}. Use the arrow keys to move it.`}
            onPointerDown={(e: ReactPointerEvent<SVGSVGElement>) => {
              if (svg.current) move(tileAt(svg.current, e));
            }}
            onKeyDown={(e) => {
              const d = { ArrowRight: STEP.R, ArrowLeft: STEP.L, ArrowUp: STEP.U, ArrowDown: STEP.D }[e.key];
              if (!d) return;
              e.preventDefault();
              const next: Cell = [bx + d[0], by + d[1]];
              if (inRoom(next)) move(next);
            }}
          >
            <FloorTiles />

            {/* the two legs of the walk, drawn as the two numbers they are */}
            <line x1={mx(0)} y1={my(0)} x2={mx(shown[0])} y2={my(0)} className="gfig-leg x" />
            <line x1={mx(shown[0])} y1={my(0)} x2={mx(shown[0])} y2={my(shown[1])} className="gfig-leg y" />

            {bx !== 0 && (
              <text x={(mx(0) + mx(bx)) / 2} y={my(0) + T * 1.25} textAnchor="middle" className="gfig-legtag x">
                {bx < 0 ? "বাঁয়ে" : "ডানে"} {bn(Math.abs(at === null ? bx : shown[0]))}
              </text>
            )}
            {by !== 0 && (
              <text
                x={mx(bx) + (bx > 0 ? -T * 0.7 : T * 0.7)}
                y={(my(0) + my(by)) / 2}
                textAnchor={bx > 0 ? "end" : "start"}
                className="gfig-legtag y"
              >
                {by < 0 ? "নিচে" : "উপরে"} {bn(Math.abs(at === null ? by : shown[1]))}
              </text>
            )}

            <You />
            <Ball at={ball} />
            {at !== null && (
              <circle cx={mx(shown[0])} cy={my(shown[1])} r={T * 0.24} className="gfig-walker" />
            )}
          </svg>
        </div>

        <div className="pfig-col">
          <p className="pfig-label">
            ball-টা drop করতে <b>যেকোনো tile-এ click করুন</b>
          </p>
          <div className="gfig-addr">
            <div className="gfig-addr-row">
              <span>{bx < 0 ? "বাঁয়ে" : "ডানে"}</span>
              <b>{Math.abs(bx)}</b>
              <u>→</u>
              <i>x = {bx}</i>
            </div>
            <div className="gfig-addr-row">
              <span>{by < 0 ? "নিচে" : "উপরে"}</span>
              <b>{Math.abs(by)}</b>
              <u>→</u>
              <i>y = {by}</i>
            </div>
          </div>
          <p className="pfig-big">
            ({bx}, {by})<small>Ball-এর position-কে student-এর মতো করেই express করলাম।</small>
          </p>
          {(bx < 0 || by < 0) && (
            <p className="gfig-say">
              <b>{bx < 0 ? "বাঁয়ে" : "নিচে"}</b> যাওয়া মানে আসলে{" "}
              {bx < 0 ? "ডানে" : "উপরে"} ঋণাত্মক কয়েক ঘর যাওয়া। ৪ ঘর বাঁয়ে যাচ্ছি বলা আর −৪ ঘর ডানে
              যাচ্ছি বলা — একই কথা। তেমনি ৪ ঘর নিচে যাচ্ছি বলা আর −৪ ঘর উপরে যাচ্ছি বলাও একই কথা।
              অর্থাৎ এখানে “−” চিহ্নটা direction বোঝাতে ব্যবহার হচ্ছে। ডানে আর উপরের জন্য “+”, আর বাঁয়ে
              আর নিচের জন্য “−”।
            </p>
          )}
        </div>
      </div>

      <div className="mfig-controls">
        <Btn on={at !== null} onClick={() => setAt(0)}>
          গুনে গুনে দেখান
        </Btn>
        <Btn on={false} onClick={() => move(BALL)}>
          কোণায় ফেরত
        </Btn>
        <Btn on={false} onClick={() => move([0, 0])}>
          আপনার পায়ের কাছে
        </Btn>
        <span className="mfig-read">
          ঠিকানা: <b>({bx}, {by})</b>
        </span>
      </div>

      <figcaption>
        <b>গুনে গুনে দেখান-এ click</b> করলে এক এক ঘর করে Shiku যে move করছে, তা দেখতে পাবেন। Ball-টাকে আপনার নিচে আর বাঁয়ে drop করে দেখুন।
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// 13 · The reveal. Everything the room had — walls, a robot, a floor — is taken
//      away one step at a time until only the two numbers are left, on paper.
//      Built as steps rather than one animation so the reader controls the pace
//      and can walk back a step they did not follow.

type Step = { title: string; note: string };
const STEPS: Step[] = [
  { title: "একটা blank sheet of paper", note: "এর ওপর কোনো tiles, wall বা robot কিছুই নেই" },
  { title: "এবার এর ওপর tiles imagine করুন", note: "আরে! এটা দেখতে তো আবার সেই tiles-ওয়ালা room-এর মতোই হয়ে গেল" },
  { title: "একটা pencil দিয়ে ঠিক মাঝখানে একটা dot দিন", note: "আপনি যেমন room-এর ঠিক মাঝখানে দাঁড়িয়ে ছিলেন, dot-টাও room-এর ঠিক মাঝখানে পড়ে আছে" },
  { title: "এবার দুইটা direction-এর নাম দেওয়া যাক", note: "বাম থেকে ডান দিক বরাবর একটা দাগ দিয়ে সেটার নাম দিলাম 'X', আর ওপর থেকে নিচ বরাবর একটা দাগ দিয়ে সেটার নাম দিলাম 'Y'" },
  { title: "Dot-টার নিজের একটা address পেল: (0, 0)", note: "ডানেও শূন্য ঘর, উপরেও শূন্য ঘর। সবকিছু আমরা এটা থেকে কত দূরে, সেই হিসাবে মাপব। তাই এর নাম দিলাম origin" },
  { title: "এই page-এর প্রত্যেকটা square-এর একটা address আছে", note: "ডানে আর ওপরে positive দিকে count করি; বাঁয়ে আর নিচে negative দিকে count করি। তারমানে, দুইটা সংখ্যা দিয়ে আমরা যেকোনো square-এর address বলতে পারব" },
  { title: "page-এর যেকোনো জায়গায় একটা point বসান", note: "Paper-এর ওপর যেকোনো জায়গায় click করুন। দুইটা number ফেরত আসবে" },
];

/** Landmarks for step 5: one in each quadrant, so no sign is left unseen. */
const MARKS: { at: Cell; tag: string }[] = [
  { at: [10, 12], tag: "ball-টা" },
  { at: [-7, 5], tag: "" },
  { at: [-4, -8], tag: "" },
  { at: [6, -3], tag: "" },
];

const TICKS = [-10, -5, 5, 10];
const TICKS_Y = [-10, -5, 5, 10];

export function GraphPaperFigure() {
  const box = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [step, setStep] = useState(0);
  const [dot, setDot] = useState<Cell | null>(null);
  const [play, setPlay] = useState(false);
  const [awake, setAwake] = useState(true);
  useInView(box, { enter: () => setAwake(true), leave: () => setAwake(false) });

  const last = STEPS.length - 1;
  // Same rule as figure 11: the last step simply stops satisfying `playing`.
  const playing = play && step < last;
  useEffect(() => {
    if (!playing || !awake) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1900);
    return () => clearTimeout(t);
  }, [playing, awake, step]);

  const go = (s: number) => {
    setPlay(false);
    setStep(Math.max(0, Math.min(last, s)));
  };

  // Each layer fades in at its own step and stays. `on` drives opacity in CSS
  // rather than mounting/unmounting, so nothing pops in without a transition.
  const on = (from: number) => (step >= from ? "gfig-in on" : "gfig-in");
  const s = STEPS[step];

  return (
    <figure className="mfig" ref={box}>
      <Head n="চিত্র ১৩" title="ঘরটা সরিয়ে নিন — দুইটা সংখ্যা কিন্তু রয়েই গেল" />
      <div className="pfig-body pfig-split wide">
        <div className="gfig-plot paper">
          <svg
            ref={svg}
            viewBox={`0 0 ${VW} ${VH}`}
            className={`mfig-svg${step === last ? " gfig-pick" : ""}`}
            role="img"
            aria-label={`graph paper, step ${step + 1} of ${STEPS.length}: ${s.title}`}
            onPointerDown={(e: ReactPointerEvent<SVGSVGElement>) => {
              if (step === last && svg.current) setDot(tileAt(svg.current, e));
            }}
          >
            <rect x={px(-CX)} y={py(CY)} width={COLS * T} height={ROWS * T} className="gfig-sheet" />

            <g className={on(1)}>
              <FloorTiles />
            </g>

            <g className={on(2)}>
              <circle cx={mx(0)} cy={my(0)} r={2.6} className="gfig-pencil" />
            </g>

            {/* the two axes, and their names */}
            <g className={on(3)}>
              <line x1={px(-CX)} y1={my(0)} x2={px(CX) + T} y2={my(0)} className="gfig-axis2" markerEnd="url(#gfig-tip)" />
              <line x1={mx(0)} y1={py(-CY) + T} x2={mx(0)} y2={py(CY)} className="gfig-axis2" markerEnd="url(#gfig-tip)" />
              <text x={px(CX) + T - 2} y={my(0) - 5} textAnchor="end" className="gfig-axname">
                x — across
              </text>
              <text x={mx(0) + 5} y={py(CY) + 9} className="gfig-axname">
                y — up
              </text>
              <defs>
                <marker id="gfig-tip" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M0 0L8 4L0 8z" className="gfig-tipfill" />
                </marker>
              </defs>
            </g>

            <g className={on(4)}>
              <text x={mx(0) - 5} y={my(0) + 12} textAnchor="end" className="gfig-origin">
                (0, 0)
              </text>
            </g>

            {/* numbered ticks — the thing that turns tiles into readable addresses */}
            <g className={on(5)}>
              {TICKS.map((n) => (
                <g key={`x${n}`}>
                  <line x1={mx(n)} y1={my(0) - 3} x2={mx(n)} y2={my(0) + 3} className="gfig-tick" />
                  <text x={mx(n)} y={my(0) + 14} textAnchor="middle" className="gfig-num">
                    {n}
                  </text>
                </g>
              ))}
              {TICKS_Y.map((n) => (
                <g key={`y${n}`}>
                  <line x1={mx(0) - 3} y1={my(n)} x2={mx(0) + 3} y2={my(n)} className="gfig-tick" />
                  <text x={mx(0) - 6} y={my(n) + 3.5} textAnchor="end" className="gfig-num">
                    {n}
                  </text>
                </g>
              ))}
              {MARKS.map((m) => {
                // A tag on a mark near an edge would run off the sheet, so it
                // hangs off the inward side instead of straddling the point.
                const edge = m.at[0] > CX - 5 ? "end" : m.at[0] < 5 - CX ? "start" : "middle";
                return (
                  <g key={m.at.join()}>
                    <circle cx={mx(m.at[0])} cy={my(m.at[1])} r={3} className="gfig-mark" />
                    <text
                      x={mx(m.at[0]) + (edge === "end" ? -5 : edge === "start" ? 5 : 0)}
                      y={my(m.at[1]) + (edge === "middle" ? -7 : 3)}
                      textAnchor={edge}
                      className="gfig-marktag"
                    >
                      ({m.at[0]}, {m.at[1]}){m.tag ? ` — ${m.tag}` : ""}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* the reader's own point */}
            {step === last && dot && (
              <g className="gfig-in on">
                <line x1={mx(0)} y1={my(dot[1])} x2={mx(dot[0])} y2={my(dot[1])} className="gfig-drop2" />
                <line x1={mx(dot[0])} y1={my(0)} x2={mx(dot[0])} y2={my(dot[1])} className="gfig-drop2" />
                <circle cx={mx(dot[0])} cy={my(dot[1])} r={3.4} className="gfig-mine" />
                <text x={mx(dot[0])} y={my(dot[1]) - 8} textAnchor="middle" className="gfig-minetag">
                  ({dot[0]}, {dot[1]})
                </text>
              </g>
            )}
          </svg>
        </div>

        <div className="pfig-col">
          <ol className="gfig-steps">
            {STEPS.map((x, i) => (
              <li key={x.title} className={i === step ? "on" : i < step ? "past" : ""}>
                <button type="button" onClick={() => go(i)}>
                  {x.title}
                </button>
              </li>
            ))}
          </ol>
          <p className="gfig-say">{s.note}</p>
          {step === last && (
            <p className="pfig-big">
              {dot ? `(${dot[0]}, ${dot[1]})` : "( , )"}
              <small>{dot ? "আপনার point, কাগজ থেকে পড়ে নেওয়া" : "কাগজে click করুন"}</small>
            </p>
          )}
        </div>
      </div>

      <div className="mfig-controls">
        <button type="button" className="mfig-btn" onClick={() => go(step - 1)} disabled={step === 0}>
          ← আগেরটা
        </button>
        <button type="button" className="mfig-btn" onClick={() => go(step + 1)} disabled={step === last}>
          পরেরটা →
        </button>
        <Btn
          on={playing}
          onClick={() => {
            if (step >= last) setStep(0);
            setPlay(!playing);
          }}
        >
          {playing ? "থামান" : "সবগুলো চালান"}
        </Btn>
        <span className="mfig-read">
          ধাপ <b>{bn(step + 1)}</b> / {bn(STEPS.length)}
        </span>
      </div>

      <figcaption>
         এটাকেই আমরা graph paper বলছি, তারমানে এটা আসলে আপনার tiles-ওয়ালা apartment-এর মতোই।
      </figcaption>
    </figure>
  );
}
