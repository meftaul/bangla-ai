"use client";

import { useId, useState, type ReactNode } from "react";

import { Bubble, Card, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Lit, Plane, clamp, makeFrame, same, tup, type Frame, type XY } from "@/components/journey/plane";
import { L_Home, L_Place, L_Trail, route } from "./lanes-kit";
import { Alpana, ChalkGrid, Pillar, RoadBed, Rope, apply, byCols, partway, rowsOf, turnCols, type Cols, type Move } from "./road-kit";

// Screens for "Math for AI 6.7 — Did the arrow move, or the paper?", told as a
// Journey in the author's Bangla-English. The plan is 06_journey_specs.md,
// block 6.7. It closes Article 6.
//
// Boishakh eve on the school roof. Fahim's map from 5.5 says the school (2, 3)
// has the road card (−1, 3), in the roads (1, 0) and (1, 1). Rina's page of
// the art sir's notebook, with ropes (1, 0) and (1, 1), sends the marigold on
// the petal tip at (2, 3) to (5, 3). Nasib: one of the two is wrong.
//
// Eight screens. 1 seals the bet (TwoAnswersBet). 2 replays 5.5: the map's grid
// turns into the road grid under a school that never moves (ReplaySchool).
// 3 pulls the art sir's second rope: the alpana leans and the marigold really
// walks to (5, 3) (ShearTheFlower). 4 plays the two side by side; the grids end
// up identical, only the arrow differs (PaperOrArrow). 5 finds which paper point
// the lean drops on the school: the road card (−1, 3), i.e. the rickshaw
// (SameMatrixBack). 6 is the reader's own: five stories, arrow or paper
// (YourStories). 7 the stretch (2, 0), (0, 1): move (5, 3), then rename it
// (TryMoveOrRename). 8 settles the bet at dawn and sorts matrices into their
// two faces (TwoFacesSort).
//
// After the screens: the story scenes (RoofEve, FahimsPage, ArtSirRope,
// SomStacks, ArtSirStretch, DawnWalk, BetSettled) and the watch-only figures
// (SameArrows, OnePlaceTwoNames, FlowerRecipe, ActivePassive, MachineBothWays,
// DoubleHalf, FiveThings), each numbered after its screen.
//
// The road and the alpana come from road-kit.tsx, the map pieces from
// lanes-kit.tsx (5.5). The art sir borrows Nana's look, with his name drawn.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const OK = "#0d9488";
const BAD = "#e11d48";
const MARI = "#f97316";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** Rina's page: rope 1 along the main road, rope 2 up the lane — 5.5's two roads. */
const SHEAR: Cols = [
  [1, 0],
  [1, 1],
];
/** The stage alpana's page (Try it): twice as wide along the road. */
const STRETCH: Cols = [
  [2, 0],
  [0, 1],
];
/** the petal tip where Rina left the marigold, and the school on Fahim's map */
const P_TIP: XY = [2, 3];
const P_CARD: XY = [-1, 3];

const num = (n: number) => {
  const r = Math.round(n * 10) / 10;
  return r < 0 ? `−${-r}` : `${r}`;
};
const tupN = (p: XY) => `(${num(p[0])}, ${num(p[1])})`;

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ",\u00a0")}
  </span>
);

// ---------------------------------------------------------------------------
// Shared drawing: a clip to the frame, the map's two families of lines, the
// road's own squares, and the marigold.

/** Clip children to the frame (Plane doesn't clip; a leaning grid runs off it). */
function P_Clip({ f, sheet = false, children }: { f: Frame; sheet?: boolean; children: ReactNode }) {
  const id = `pclip${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          {sheet ? (
            <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} rx={3} />
          ) : (
            <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
          )}
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

/**
 * Fahim's map: the east-west lines (main roads, blue) and the other family,
 * grey north lines on the plain map, turning into the coral lanes as `lane`
 * goes 0 → 1. Both carried by `m`, a linear move, so endpoints suffice.
 */
function P_MapGrid({ f, m, lane }: { f: Frame; m: Move; lane: number }) {
  const seg = (a: XY, b: XY) => {
    const p = m(a);
    const q = m(b);
    return `M${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}L${f.sx(q[0]).toFixed(1)} ${f.sy(q[1]).toFixed(1)}`;
  };
  let h = "";
  let v = "";
  for (let j = -4; j <= 9; j += 1) h += seg([-16, j], [16, j]);
  for (let i = -16; i <= 12; i += 1) v += seg([i, -4], [i, 9]);
  return (
    <P_Clip f={f} sheet>
      <g className="pointer-events-none">
        <path d={v} strokeWidth={1} stroke="#64748b" strokeOpacity={0.45 * (1 - lane)} fill="none" />
        <path d={v} strokeWidth={2.4} stroke="#f43f5e" strokeOpacity={0.32 * lane} fill="none" strokeLinecap="round" />
        <path d={h} strokeWidth={2.4} stroke="#3b82f6" strokeOpacity={0.3} fill="none" strokeLinecap="round" />
      </g>
    </P_Clip>
  );
}

/** The road's own squares, fixed: the art sir measures from the pillar with these. */
function P_RoadSquares({ f, nums = true }: { f: Frame; nums?: boolean }) {
  let d = "";
  for (let x = Math.ceil(f.x0); x <= Math.floor(f.x1); x += 1) d += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  for (let y = Math.ceil(f.y0); y <= Math.floor(f.y1); y += 1) d += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  const xs = Array.from({ length: Math.floor(f.x1) + 1 }, (_, i) => i).filter((x) => x > 0);
  const ys = Array.from({ length: Math.floor(f.y1) + 1 }, (_, i) => i).filter((y) => y > 0);
  return (
    <g className="pointer-events-none">
      <path d={d} strokeWidth={0.6} stroke="#f8fafc" strokeOpacity={0.2} fill="none" />
      {nums &&
        xs.map((x) => (
          <text key={`x${x}`} x={f.sx(x)} y={f.sy(0) + 9} textAnchor="middle" fontSize={6} fontFamily={MONO} fill="#f8fafc" fillOpacity={0.55}>
            {x}
          </text>
        ))}
      {nums &&
        ys.map((y) => (
          <text key={`y${y}`} x={f.sx(0) - 9} y={f.sy(y) + 2} textAnchor="middle" fontSize={6} fontFamily={MONO} fill="#f8fafc" fillOpacity={0.55}>
            {y}
          </text>
        ))}
    </g>
  );
}

/** A marigold (গাঁদা ফুল) centred on a point of the frame. */
function P_Marigold({ f, at, r = 1, faint = false }: { f: Frame; at: XY; r?: number; faint?: boolean }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none" opacity={faint ? 0.35 : 1}>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return <circle key={i} cx={x + Math.cos(a) * 3.2 * r} cy={y + Math.sin(a) * 3.2 * r} r={2.4 * r} fill={MARI} stroke="#c2410c" strokeWidth={0.5} />;
      })}
      <circle cx={x} cy={y} r={2.2 * r} fill="#fbbf24" />
    </g>
  );
}

/**
 * The road with the alpana carried by `m`: the road's fixed squares under it,
 * the chalk patch and the design leaning with the move, the marigold on the
 * petal tip, the pillar and the two ropes.
 */
function P_RoadView({ f, cols, t = 1, ropes = true, nums = true }: { f: Frame; cols: Cols; t?: number; ropes?: boolean; nums?: boolean }) {
  const m = partway(byCols(cols), t);
  const r1 = m([1, 0]);
  const r2 = m([0, 1]);
  return (
    <>
      <RoadBed f={f} />
      <P_RoadSquares f={f} nums={nums} />
      <P_Clip f={f}>
        <ChalkGrid f={f} move={m} x0={-1} x1={7} y0={-1} y1={5} />
        <Alpana f={f} move={m} />
      </P_Clip>
      <P_Marigold f={f} at={m(P_TIP)} />
      <Pillar f={f} />
      {ropes && (
        <>
          <Rope f={f} to={r1} which={1} />
          <Rope f={f} to={r2} which={2} />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// The two pictures, small: Fahim's map (the paper changes under the school)
// and the road (the marigold moves on still squares). Used by the bet, the
// split screen and the figures.

const MAP_F = makeFrame(-1, 5, -1, 4, 24, 10);
const ROAD_F = makeFrame(-1, 12, -1, 5.5, 17, 10);
const MINI_MAP = makeFrame(-1, 5, -1, 4, 20, 8);
const MINI_ROAD = makeFrame(-1, 12, -1, 5.5, 11, 6);

function P_MapView({ f, t, trail = false, name = true }: { f: Frame; t: number; trail?: boolean; name?: boolean }) {
  const m = partway(byCols(SHEAR), t);
  return (
    <>
      <P_MapGrid f={f} m={m} lane={t} />
      {trail && <L_Trail f={f} pts={route(P_CARD)} w={2} />}
      <L_Home f={f} name={name} />
      <L_Place f={f} at={P_TIP} kind="school" name={name} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Fahim's page and Rina's page side by side, each with its
//     answer; four choices, each a small picture of the two cards marked; the
//     reader seals one. The pick is acted out on the pages (a strike through the
//     answer called wrong, a ring round an answer called right), then a "?"
//     hangs on it, unmarked. The finale opens it.

const B1_OPTS = ["ফাহিমের (−1, 3) ভুল", "রিনার (5, 3) ভুল", "দুইটাই ঠিক", "দুইটাই ভুল"];
type B1_Mark = "x" | "o" | null;
/** what each pick says about [Fahim's answer, Rina's answer] */
const B1_MARKS: [B1_Mark, B1_Mark][] = [
  ["x", null],
  [null, "x"],
  ["o", "o"],
  ["x", "x"],
];

/** one page's answer line; the bet's strike or ring draws itself over it, then its "?" */
function B1_Answer({ ans, tone, mark, q }: { ans: string; tone: string; mark: B1_Mark; q: boolean }) {
  return (
    <div className="font-mono text-sm font-bold">
      (2, 3) <span className="text-muted">→</span>{" "}
      <span className={`relative inline-block ${tone}`}>
        {ans}
        {mark && (
          <svg viewBox="0 0 60 24" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute -top-1 -left-1.5 h-[calc(100%+0.5rem)] w-[calc(100%+0.75rem)] overflow-visible">
            {mark === "x" ? (
              <Draw d="M3 19L57 5" strokeWidth={2.6} ms={500} className="stroke-danger" />
            ) : (
              <Draw d="M30 1C52 1 59 7 59 12C59 19 49 23 30 23C10 23 1 19 1 12C1 5 11 1 28 2" strokeWidth={2} ms={600} className="stroke-accent" />
            )}
          </svg>
        )}
        {mark && q && <span className={`${POP} absolute -top-3.5 -right-3.5 inline-block font-sans text-lg font-extrabold text-cat-blue`}>?</span>}
      </span>
    </div>
  );
}

function P_TwoPages({ mapT = 1, roadT = 1, marks = [null, null], q = false }: { mapT?: number; roadT?: number; marks?: [B1_Mark, B1_Mark]; q?: boolean }) {
  return (
    <div className="mx-auto grid max-w-[22rem] grid-cols-2 items-end gap-2">
      <div className="text-center">
        <Plane f={MINI_MAP} grid={0} axes={false} label="ফাহিমের map: স্কুল (2, 3) এ, রাস্তার grid এ card (−1, 3)" className="my-0! max-w-none">
          <P_MapView f={MINI_MAP} t={mapT} name={false} />
        </Plane>
        <div className="mt-1 text-xs text-muted">ফাহিমের map</div>
        <B1_Answer ans="(−1, 3)" tone="text-cat-coral" mark={marks[0]} q={q} />
      </div>
      <div className="text-center">
        <Plane f={MINI_ROAD} grid={0} axes={false} paper={false} label="রাস্তায় হেলানো আলপনা: গাঁদা ফুল (2, 3) থেকে (5, 3) এ" className="my-0! max-w-none">
          <P_RoadView f={MINI_ROAD} cols={SHEAR} t={roadT} nums={false} />
        </Plane>
        <div className="mt-1 text-xs text-muted">রিনার পাতা</div>
        <B1_Answer ans="(5, 3)" tone="text-cat-amber" mark={marks[1]} q={q} />
      </div>
    </div>
  );
}

/** a choice's picture: the two answer cards, coral and amber, each marked as the pick says */
function B1_Icon({ i }: { i: number }) {
  const card = (x: number, fill: string, m: B1_Mark) => (
    <g>
      <rect x={x} y={3} width={20} height={14} rx={2} fill="white" stroke={fill} strokeWidth={1.6} />
      <path d={`M${x + 4} 10h12`} stroke={fill} strokeWidth={2} strokeLinecap="round" />
      {m === "x" && <path d={`M${x + 1} 17L${x + 19} 3`} stroke={BAD} strokeWidth={2} strokeLinecap="round" />}
      {m === "o" && <ellipse cx={x + 10} cy={10} rx={13} ry={9} fill="none" stroke={OK} strokeWidth={1.6} />}
    </g>
  );
  const [a, b] = B1_MARKS[i];
  return (
    <svg viewBox="-4 -1 58 22" aria-hidden="true" className="h-5 w-auto shrink-0">
      {card(0, "#f43f5e", a)}
      {card(28, "#f59e0b", b)}
    </svg>
  );
}

export function TwoAnswersBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const act = usePlay(750);
  const seal = (i: number) => {
    setBet(i);
    act.play(3, () => pass("বাজি সিল হলো। দুইটা আবার চালিয়ে দেখি।"));
  };
  // beats of the acted bet: 1 the mark drawn on the pages, 2 its "?", 3 sealed
  const k = bet === null ? 0 : act.running ? act.k : 3;
  const marks = bet !== null && k >= 1 ? B1_MARKS[bet] : undefined;
  return (
    <>
      <P_TwoPages marks={marks} q={k >= 2} />
      <div className="mt-2 text-center text-xs text-muted">দুই পাতাতেই দুইটা arrow: (1, 0) আর (1, 1)।</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {B1_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            <span className="flex items-center gap-2 text-sm leading-tight">
              {bet === null && <B1_Icon i={i} />}
              {/* a tuple never breaks across lines */}
              <span>{o.replace(/, (?=[\d−])/g, ",\u00a0")}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={bet !== null && k >= 3}>কোনটা ভুল? একটার উপরে বাজি ধরুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Fahim's page again, as 5.5 did it. A slider turns the map's square grid
//     into the road grid; the school never moves. At the end the rickshaw's
//     route shows its card, (−1, 3).

export function ReplaySchool() {
  const pass = useGate();
  const [t, setT] = useSeed("t", 0);
  const [done, setDone] = useState(false);
  const at = (v: number) => {
    setT(v);
    if (v >= 1 && !done) {
      setDone(true);
      pass("School নড়েনি। কাগজ বদলেছে।");
    }
  };
  const end = t >= 1;
  return (
    <>
      <div className="mx-auto w-full max-w-[17rem]">
        <Plane f={MAP_F} grid={0} axes={false} label="ফাহিমের map: square grid বদলে রাস্তার grid হচ্ছে, স্কুল (2, 3) এ স্থির" className="my-0! max-w-none">
          <P_MapView f={MAP_F} t={t} trail={end} />
          {/* a pin through the school: it is nailed to the page */}
          <circle cx={MAP_F.sx(2)} cy={MAP_F.sy(3)} r={14} fill="none" stroke={INK} strokeOpacity={0.35} strokeDasharray="3 3" />
        </Plane>
      </div>
      <label className="mx-auto mt-3 flex max-w-[17rem] items-center gap-2 text-xs text-muted">
        <span>map</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={t}
          onChange={(e) => at(Number(e.target.value))}
          aria-label="map এর grid থেকে রাস্তার grid"
          className="min-w-0 flex-1 cursor-pointer accent-[#f43f5e]"
        />
        <span>রাস্তা</span>
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-xs text-muted">map এ স্কুল</div>
          <div className="font-mono text-lg font-bold">(2, 3)</div>
        </div>
        <div>
          <div className="text-xs text-muted">রাস্তার grid এ স্কুল</div>
          <div className="font-mono text-lg font-bold">
            {end ? <span className={`${POP} inline-block text-cat-coral`}>(−1, 3)</span> : <span className="text-muted/50">…</span>}
          </div>
        </div>
      </div>
      <Task done={end}>Slider টা ডানে টেনে map এর grid কে রাস্তার grid বানান। স্কুলের দিকে চোখ রাখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Rina's page, on the road. The reader drags the end of the second rope
//     from (0, 1) to the lane's (1, 1); the chalk patch and the alpana lean
//     with it, and the marigold on the petal tip walks from (2, 3) to (5, 3)
//     over the road's own squares, which stay put.

export function ShearTheFlower() {
  const pass = useGate();
  const [rx, setRx] = useSeed("rx", 0);
  const [done, setDone] = useState(false);
  const pull = (v: number) => {
    const x = clamp(v, 0, 1);
    const snapped = x > 0.93 ? 1 : x;
    setRx(snapped);
    if (snapped === 1 && !done) {
      setDone(true);
      pass("এবার ফুলটা সত্যিই সরে গেলো।");
    }
  };
  const cols: Cols = [
    [1, 0],
    [rx, 1],
  ];
  const f = ROAD_F;
  const tip = apply(cols, P_TIP);
  return (
    <>
      <Plane
        f={f}
        grid={0}
        axes={false}
        paper={false}
        label="রাস্তা, pillar থেকে দুইটা দড়ি; দ্বিতীয় দড়ির মাথা টানলে আলপনা হেলে যায়"
        drag={{ down: (p) => pull(p[0]), move: (p) => pull(p[0]) }}
        onKey={(e) => {
          if (e.key === "ArrowRight") pull(rx + 0.25);
          if (e.key === "ArrowLeft") pull(rx - 0.25);
        }}
        className="my-0! max-w-[22rem]"
      >
        <P_RoadView f={f} cols={cols} />
        {/* where the marigold sat on the plain paper */}
        <circle cx={f.sx(2)} cy={f.sy(3)} r={6} fill="none" stroke="#fde68a" strokeDasharray="2 2" />
        {!done && <circle cx={f.sx(rx)} cy={f.sy(1)} r={10} fill="none" stroke="#2dd4bf" strokeWidth={1.4} strokeDasharray="3 2" />}
        {!done && (
          <path d={`M${f.sx(1) - 5} ${f.sy(1) - 5}l10 10m0 -10l-10 10`} stroke="#2dd4bf" strokeOpacity={0.6} strokeWidth={1.4} />
        )}
      </Plane>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-xs text-muted">দ্বিতীয় দড়ির মাথা</div>
          <div className="font-mono text-lg font-bold text-cat-teal">{tupN([rx, 1])}</div>
        </div>
        <div>
          <div className="text-xs text-muted">গাঁদা ফুল, রাস্তার ঘরে</div>
          <div className="font-mono text-lg font-bold text-cat-amber">{tupN(tip)}</div>
        </div>
      </div>
      <Task done={rx === 1}>দ্বিতীয় দড়ির মাথা টেনে (1, 1) এর ক্রসে নিন। গাঁদা ফুলটা কোথায় যায়, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The split screen, one play for both. Predict first: at the end, how do
//     the two grids look? Each choice is a picture of the two sheets. The guess
//     is drawn on both sheets as a dashed ghost grid with a "?"; the play then
//     leans the real grids under it — they come out identical, only the arrow
//     differs: it stays on the map, it moves on the road. A wrong ghost is left
//     showing where it misses, with a Nope.

const PA_OPTS = ["হুবহু একই রকম", "দুইটা উল্টা দিকে হেলানো", "একটা হেলানো, আরেকটা সোজা"];
const PA_RIGHT = 0;
const PA_LEFT: Cols = [
  [1, 0],
  [-1, 1],
];
const PA_ID: Cols = [
  [1, 0],
  [0, 1],
];
/** each guess, as [the map's end grid, the road's end grid] */
const PA_GHOST: [Cols, Cols][] = [
  [SHEAR, SHEAR],
  [SHEAR, PA_LEFT],
  [PA_ID, SHEAR],
];
const PA_NOPE = ["", "দুইটা grid ই হেললো একই দিকে, গলির দিকে।", "Map এর grid ও বসে থাকেনি। দুইটাই হেললো, একই রকম।"];

/** the guessed end grid, dashed, over a sheet: the lines that lean (the second family) */
function PA_Ghost({ f, cols, sheet, tone }: { f: Frame; cols: Cols; sheet: boolean; tone: string }) {
  let d = "";
  for (let i = -8; i <= 12; i += 1) {
    const p = apply(cols, [i, -2]);
    const q = apply(cols, [i, 7]);
    d += `M${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}L${f.sx(q[0]).toFixed(1)} ${f.sy(q[1]).toFixed(1)}`;
  }
  return (
    <P_Clip f={f} sheet={sheet}>
      <path d={d} stroke={tone} strokeWidth={1.3} strokeDasharray="3 3" fill="none" className={`pointer-events-none ${FADE}`} />
    </P_Clip>
  );
}

/** a choice's picture: two little sheets, each with its grid as the guess leaves it */
function PA_Icon({ i }: { i: number }) {
  const sheet = (x: number, lean: number, paper: string) => {
    let d = "";
    for (let j = -2; j <= 5; j += 1) d += `M${x + j * 6} 22L${x + j * 6 + lean * 18} 4`;
    const id = `pa${i}${x}`;
    return (
      <g>
        <defs>
          <clipPath id={id}>
            <rect x={x} y={4} width={26} height={18} rx={2} />
          </clipPath>
        </defs>
        <rect x={x} y={4} width={26} height={18} rx={2} fill={paper} stroke={INK} strokeOpacity={0.3} />
        <path d={d} clipPath={`url(#${id})`} stroke="#f43f5e" strokeOpacity={0.7} strokeWidth={1.2} />
      </g>
    );
  };
  const lean: [number, number][] = [
    [1, 1],
    [1, -1],
    [0, 1],
  ];
  return (
    <svg viewBox="0 2 62 22" aria-hidden="true" className="h-7 w-auto shrink-0">
      {sheet(0, lean[i][0], "white")}
      {sheet(34, lean[i][1], "#e7e5e4")}
    </svg>
  );
}

export function PaperOrArrow() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [played, setPlayed] = useSeed("played", false);
  const run = usePlay(1500);
  const [t] = useTween([played ? 1 : 0], 1400);
  const go = () => {
    setPlayed(true);
    run.play(1, () => pass("একটায় arrow নড়ে, আরেকটায় কাগজ।"));
  };
  const m = partway(byCols(SHEAR), t);
  const tip = m(P_TIP);
  const over = played && !run.running && t > 0.98;
  const ghost = guess !== null ? PA_GHOST[guess] : null;
  const q = (f: Frame) =>
    ghost && !played ? (
      <text x={f.W - 12} y={24} textAnchor="middle" fontSize={20} fontWeight={800} fill="#7c3aed" stroke="white" strokeWidth={2.5} paintOrder="stroke" className={POP}>
        ?
      </text>
    ) : null;
  const ra: XY = [MINI_ROAD.sx(0), MINI_ROAD.sy(0)];
  const rb: XY = [MINI_ROAD.sx(tip[0]), MINI_ROAD.sy(tip[1])];
  return (
    <>
      <div className="mx-auto grid max-w-[22rem] grid-cols-2 gap-2">
        <div className="text-center">
          <Plane f={MINI_MAP} grid={0} axes={false} label="ফাহিমের map: grid হেলে যায়, স্কুলের arrow জায়গায় থাকে" className="my-0! max-w-none">
            <P_MapView f={MINI_MAP} t={t} name={false} />
            {ghost && <PA_Ghost f={MINI_MAP} cols={ghost[0]} sheet tone="#7c3aed" />}
            <Arrow f={MINI_MAP} from={[0, 0]} to={P_TIP} tone="ink" w={2} />
            {q(MINI_MAP)}
          </Plane>
          <div className="mt-1 text-xs text-muted">ফাহিমের map</div>
          {over && <div className={`text-sm font-semibold text-cat-coral ${FADE}`}>কাগজ বদলেছে</div>}
        </div>
        <div className="text-center">
          <Plane f={MINI_ROAD} grid={0} axes={false} paper={false} label="রাস্তা: আলপনার grid হেলে যায়, ফুলের arrow সরে যায়" className="my-0! max-w-none">
            <P_RoadView f={MINI_ROAD} cols={SHEAR} t={t} nums={false} ropes={false} />
            {ghost && <PA_Ghost f={MINI_ROAD} cols={ghost[1]} sheet={false} tone="#e9d5ff" />}
            <Lit a={ra} b={rb} list={tupN(tip)} w={2} color="#fde047">
              <path d={`M${ra[0]} ${ra[1]}L${rb[0]} ${rb[1]}`} stroke="#fde047" strokeWidth={2} strokeLinecap="round" />
            </Lit>
            {q(MINI_ROAD)}
          </Plane>
          <div className="mt-1 text-xs text-muted">রাস্তা</div>
          {over && <div className={`text-sm font-semibold text-cat-amber ${FADE}`}>Arrow নড়েছে</div>}
        </div>
      </div>
      {guess !== null && !played && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={go} className={`${primaryBtn} ${FADE}`}>
            দুইটা একসাথে চালান
          </button>
        </div>
      )}
      {over && guess !== null && guess !== PA_RIGHT && <Nope>{PA_NOPE[guess]}</Nope>}
      {!played && <div className="mt-3 text-sm font-medium text-muted">বলুন তো, চালানোর পরে দুই ছবির grid দেখতে কেমন হবে?</div>}
      <div className="mt-2 grid gap-2">
        {PA_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, PA_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="flex items-center gap-2.5">
              {(guess === null || guess === i) && <PA_Icon i={i} />}
              <span>{o}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={played}>আগে একটা guess দিন। তারপর দুইটা ছবি একসাথে চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The same grid, run the other way round. On Fahim's map, the reader sets
//     a point on the plain paper with two steppers and leans the grid (Rina's
//     page); the point is carried. Which paper point lands on the school?
//     (−1, 3), the rickshaw card. (2, 3) itself overshoots to (5, 3), as the
//     rickshaw did on the first morning.

const SM_F = makeFrame(-2, 7, -1, 4, 20, 10);

export function SameMatrixBack() {
  const pass = useGate();
  const [p, setP] = useSeed<XY>("p", [2, 3]);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = usePlay(1300);
  const [t] = useTween([ran ? 1 : 0], 1200);
  const land = apply(SHEAR, p);
  const hit = same(land, P_TIP);
  const set = (i: number, v: number) => {
    setRan(false);
    setP(i === 0 ? [v, p[1]] : [p[0], v]);
  };
  const go = () => {
    setRan(true);
    if (hit) run.play(1, () => pass("একই grid: নতুন card থেকে পুরানো card এ ফেরত।"));
    else {
      run.play(1);
      setMiss((n) => n + 1);
    }
  };
  const m = partway(byCols(SHEAR), t);
  // a stepper tap glides the point to its new square instead of jumping
  const [gx, gy] = useTween(p, 300);
  const at = m([gx, gy]);
  const f = SM_F;
  const over = ran && !run.running;
  return (
    <>
      <div className="mx-auto w-full max-w-[19rem]">
        <Plane f={f} grid={0} axes={false} label="ফাহিমের map; কাগজে একটা point, রিনার grid এ হেলালে সেটা সরে যায়; লক্ষ্য স্কুল (2, 3)" className="my-0! max-w-none">
          <P_MapGrid f={f} m={m} lane={t} />
          <L_Home f={f} name={false} />
          <L_Place f={f} at={P_TIP} kind="school" hit={over && hit} />
          <circle cx={f.sx(gx)} cy={f.sy(gy)} r={4} fill="none" stroke={INK} strokeOpacity={0.4} strokeDasharray="2 2" />
          <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={4.5} fill="#7c3aed" stroke="white" strokeWidth={1.2} />
        </Plane>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-muted">কাগজের point</span>
        <Stepper value={p[0]} onChange={(v) => set(0, v)} min={-2} max={3} label="প্রথম সংখ্যা" disabled={run.running} />
        <Stepper value={p[1]} onChange={(v) => set(1, v)} min={0} max={4} label="দ্বিতীয় সংখ্যা" disabled={run.running} />
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" onClick={go} disabled={ran} className={primaryBtn}>
          grid হেলান
        </button>
        <span className="font-mono text-sm">
          {tup(p)} <span className="text-muted">→</span> {over ? <b className={hit ? "text-accent-text" : "text-danger"}>{tup(land)}</b> : "…"}
        </span>
      </div>
      {over && !hit && (
        <Nope key={miss}>
          {same(p, P_TIP) ? "(2, 3) গিয়ে পড়লো (5, 3) এ। প্রথম দিনের রিকশার মতো, স্কুল ছাড়িয়ে 3 ঘর। " : `${tup(p)} গিয়ে পড়লো ${tup(land)} এ। `}
          হেলানোতে দ্বিতীয় সংখ্যা যতো, point ততো ঘর ডানে যায়।
        </Nope>
      )}
      <Task done={over && hit}>কাগজের কোন point হেলানোর পরে ঠিক স্কুলের উপর পড়ে? খুঁজে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn. Five small stories from these days; for each, arrow or paper.
//     Every tap plays the pick out on the little sheet: "arrow" moves the fish
//     on still squares, "paper" changes the squares under a still fish. A wrong
//     pick plays what it would mean (Fahim himself growing, the school walking
//     off), then a Nope says what really happened; the right one plays the
//     story as it went, and the last one passes from the play's end.

/** `claim`: what the wrong pick just drew, said before the truth (`why`) */
type P_Tale = { text: string; cols: Cols; moved: boolean; why: string; claim: string };
const YS_TALES: P_Tale[] = [
  { text: "মোড়ের আলপনাটা এক পাক ঘুরিয়ে আঁকা হলো, রাস্তার বাঁকের সাথে মিলিয়ে।", cols: turnCols(90), moved: true, why: "রাস্তার ঘর যেখানে ছিল সেখানেই। মাছটা ঘুরে গেছে।", claim: "এখানে ঘুরলো grid, মাছ বসে রইলো।" },
  {
    text: "ফাহিমের height 150 cm। স্কুলের খাতায় লেখা হলো 1.5 m.",
    cols: [
      [1.6, 0],
      [0, 1.6],
    ],
    moved: false,
    why: "ফাহিম একটুও লম্বা হয়নি। শুধু মাপার ঘর বড় হয়েছে।",
    claim: "এখানে ফাহিম নিজেই বড় হয়ে গেলো।",
  },
  { text: "5.6b: word map এর নিচে grid ঘুরানো হলো। Word গুলো যেখানে ছিল, সেখানেই।", cols: turnCols(30), moved: false, why: "Word গুলো নড়েনি। ঘুরেছে শুধু grid।", claim: "এখানে word গুলোই ঘুরে গেলো।" },
  {
    text: "আর্ট স্যারের notebook: মাছটা আয়নার মতো উল্টিয়ে আঁকা হলো।",
    cols: [
      [-1, 0],
      [0, 1],
    ],
    moved: true,
    why: "মাছ উল্টে গেছে, অন্য দিকে মুখ। রাস্তার ঘর একই।",
    claim: "এখানে উল্টালো grid, মাছ বসে রইলো।",
  },
  { text: "প্রথম দিনের রিকশা: স্কুল map এ (2, 3), রাস্তার card এ (−1, 3)।", cols: SHEAR, moved: false, why: "স্কুল এক ইঞ্চিও সরেনি। বদলেছে রাস্তার grid।", claim: "এখানে স্কুলটাই সরে গেলো।" },
];

const YS_F = makeFrame(-2.2, 2.2, -1.6, 2.2, 22, 6);
/** a small fish-arrow: a body pointing along (1.4, 0.7), with a tail */
const YS_FISH: XY[] = [
  [0, 0],
  [1.2, 0.9],
  [1.6, 0.7],
  [1.2, 0.45],
  [0, 0],
];

/** `moved`: how this play reads the story — the fish moves, or the squares change */
function P_Tale({ tale, t, moved }: { tale: P_Tale; t: number; moved: boolean }) {
  const f = YS_F;
  const m = partway(byCols(tale.cols), t);
  const still = (q: XY) => q;
  const grid = moved ? still : m;
  const thing = moved ? m : still;
  let d = "";
  for (let i = -5; i <= 5; i += 1) {
    const a = grid([i, -5]);
    const b = grid([i, 5]);
    const c = grid([-5, i]);
    const e = grid([5, i]);
    d += `M${f.sx(a[0])} ${f.sy(a[1])}L${f.sx(b[0])} ${f.sy(b[1])}M${f.sx(c[0])} ${f.sy(c[1])}L${f.sx(e[0])} ${f.sy(e[1])}`;
  }
  const body = YS_FISH.map((q, i) => {
    const r = thing(q);
    return `${i ? "L" : "M"}${f.sx(r[0]).toFixed(1)} ${f.sy(r[1]).toFixed(1)}`;
  }).join("");
  return (
    <Plane f={f} grid={0} axes={false} label="ছোট একটা কাগজ, grid আর একটা মাছ" className="my-0! max-w-none">
      <P_Clip f={f} sheet>
        <path d={d} stroke={moved ? "#94a3b8" : "#f43f5e"} strokeOpacity={moved ? 0.6 : 0.5} strokeWidth={moved ? 0.8 : 1.3} fill="none" />
        <path d={body} fill="#fbbf24" stroke="#b45309" strokeWidth={1.2} strokeLinejoin="round" />
      </P_Clip>
      <circle cx={f.sx(0)} cy={f.sy(0)} r={2.4} fill={INK} />
    </Plane>
  );
}

export function YourStories() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pick, setPick] = useSeed<boolean | null>("pick", null);
  // the last pick keeps drawing while a wrong play glides back, so it doesn't jump
  const [shown, setShown] = useState<boolean | null>(pick);
  const [miss, setMiss] = useState(0);
  const run = usePlay(1150);
  const [t] = useTween([pick === null ? 0 : 1], 1100);
  const done = round >= YS_TALES.length;
  const tale = YS_TALES[Math.min(round, YS_TALES.length - 1)];
  const right = pick !== null && pick === tale.moved;
  const landed = pick !== null && !run.running;
  const choose = (moved: boolean) => {
    if (run.running) return;
    setPick(moved);
    setShown(moved);
    run.play(1, () => {
      if (moved !== tale.moved) setMiss((n) => n + 1);
      else if (round === YS_TALES.length - 1) pass("প্রশ্ন একটাই: জিনিস সরেছে, নাকি বর্ণনা?");
    });
  };
  const next = () => {
    setPick(null);
    setShown(null);
    setRound(round + 1);
  };
  const retry = () => setPick(null);
  const look = (moved: boolean) => (pick === moved ? (landed ? (right ? "right" : "wrong") : "picked") : pick !== null ? "dim" : "idle");
  return (
    <>
      <div className="flex items-center justify-center gap-1.5" aria-label={`${YS_TALES.length} টার মধ্যে ${Math.min(round + 1, YS_TALES.length)}`}>
        {YS_TALES.map((_, i) => (
          <span key={i} className={`size-2 rounded-full ${i < round || (i === round && right && landed) ? "bg-accent" : i === round ? "bg-cat-blue" : "bg-border"}`} />
        ))}
      </div>
      <div className="mx-auto mt-2 flex max-w-[22rem] items-center gap-3">
        <div className="w-[7.5rem] shrink-0">
          <P_Tale key={round} tale={tale} t={t} moved={shown ?? tale.moved} />
        </div>
        <div className="min-w-0 text-[0.95rem] leading-snug">{tale.text}</div>
      </div>
      {!done && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Choice n={0} look={look(true)} disabled={pick !== null} onClick={() => choose(true)}>
            arrow নড়েছে
          </Choice>
          <Choice n={1} look={look(false)} disabled={pick !== null} onClick={() => choose(false)}>
            কাগজ বদলেছে
          </Choice>
        </div>
      )}
      {landed && !right && (
        <Nope key={miss}>
          উঁহু। {tale.claim} {tale.why}
        </Nope>
      )}
      {landed && right && <div className={`mt-2 text-[0.95rem] text-accent-text ${FADE}`}>{tale.why}</div>}
      <div className="mt-3 flex justify-center">
        {landed && !right && (
          <button type="button" onClick={retry} className={quietBtn}>
            আবার চেষ্টা করুন
          </button>
        )}
        {landed && right && round < YS_TALES.length - 1 && (
          <button type="button" onClick={next} className={primaryBtn}>
            পরের ঘটনা
          </button>
        )}
      </div>
      <Task done={landed && right && round === YS_TALES.length - 1}>পাঁচটা ঘটনা। প্রত্যেকটায় বলুন: arrow নড়েছে, নাকি কাগজ বদলেছে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it. The stage alpana's page: ropes (2, 0) and (0, 1). Round 1, move:
//     the marigold is chalked at (5, 3); the reader drops a pin where it will
//     land, then pulls — it goes to (10, 3). Round 2, rename: the art sir wants
//     the marigold on the road's (5, 3); the reader puts it on the paper,
//     pulls, and it must land there: (2.5, 3). Every pull plays honestly.

const TM_F = makeFrame(-1, 11, -1, 4.5, 19, 10);
const TM_MOVE: XY = [10, 3];
const TM_NAME: XY = [2.5, 3];
const TM_SPOT: XY = [5, 3];
const half = (p: XY): XY => [clamp(Math.round(p[0] * 2) / 2, -0.5, 11), clamp(Math.round(p[1] * 2) / 2, -0.5, 4.5)];

export function TryMoveOrRename() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pin, setPin] = useSeed<XY | null>("pin", null);
  const [dot, setDot] = useSeed<XY | null>("dot", null);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = usePlay(1300);
  const [t] = useTween([ran ? 1 : 0], 1200);
  const f = TM_F;
  const m = partway(byCols(STRETCH), t);
  const src = round === 0 ? TM_SPOT : dot;
  const landed = src ? apply(STRETCH, src) : null;
  const ok = round === 0 ? pin !== null && same(pin, TM_MOVE) : dot !== null && same(dot, TM_NAME);
  const over = ran && !run.running;

  const place = (p: XY) => {
    if (ran) return;
    if (round === 0) setPin(half(p));
    else setDot(half(p));
  };
  const pull = () => {
    setRan(true);
    run.play(1, () => {
      if (ok) {
        if (round === 1) pass("সরালে গুণ 2। নাম বদলালে ভাগ 2।");
      } else setMiss((n) => n + 1);
    });
  };
  const again = () => setRan(false);
  const toRename = () => {
    setRan(false);
    setRound(1);
  };
  const ready = round === 0 ? pin !== null : dot !== null;
  return (
    <>
      <div className="flex justify-center gap-2 text-sm">
        <span className={`rounded-full px-3 py-1 ${round === 0 ? "bg-cat-blue text-white" : "bg-accent/15 text-accent-text"}`}>1. সরান</span>
        <span className={`rounded-full px-3 py-1 ${round === 1 ? "bg-cat-blue text-white" : "bg-border/40 text-muted"}`}>2. নাম বদলান</span>
      </div>
      <Plane
        f={f}
        grid={0}
        axes={false}
        paper={false}
        label="মঞ্চের সামনের রাস্তা; দড়ি (2, 0) আর (0, 1); গাঁদা ফুল আর একটা pin"
        drag={{ down: place, move: place }}
        className="my-2! max-w-[22rem]"
      >
        <RoadBed f={f} />
        <P_RoadSquares f={f} />
        <P_Clip f={f}>
          <ChalkGrid f={f} move={m} x0={-1} x1={6} y0={-1} y1={4} />
        </P_Clip>
        <Pillar f={f} />
        <Rope f={f} to={m([1, 0])} which={1} />
        <Rope f={f} to={m([0, 1])} which={2} />
        {round === 1 && (
          <g>
            <rect x={f.sx(5) - 8} y={f.sy(3) - 8} width={16} height={16} rx={3} fill="none" stroke="#fde047" strokeWidth={1.6} strokeDasharray="3 2" />
          </g>
        )}
        {round === 0 && pin && (
          <g className={POP}>
            <path d={`M${f.sx(pin[0])} ${f.sy(pin[1])}l-4 -10h8Z`} fill="#38bdf8" stroke="white" strokeWidth={0.8} />
            <circle cx={f.sx(pin[0])} cy={f.sy(pin[1]) - 11} r={3.2} fill="#38bdf8" stroke="white" strokeWidth={0.8} />
          </g>
        )}
        {src && <P_Marigold f={f} at={m(src)} />}
        {over && !ok && landed && <circle cx={f.sx(landed[0])} cy={f.sy(landed[1])} r={9} fill="none" stroke={BAD} strokeWidth={1.6} className={POP} />}
        {over && ok && landed && <circle cx={f.sx(landed[0])} cy={f.sy(landed[1])} r={9} fill="none" stroke={OK} strokeWidth={2} className={POP} />}
      </Plane>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!ran && (
          <button type="button" onClick={pull} disabled={!ready} className={primaryBtn}>
            দড়ি টানুন
          </button>
        )}
        {over && !ok && (
          <button type="button" onClick={again} className={quietBtn}>
            আবার
          </button>
        )}
        {over && ok && round === 0 && (
          <button type="button" onClick={toRename} className={primaryBtn}>
            এবার নাম বদলান
          </button>
        )}
        <span className="font-mono text-sm">
          {round === 0 ? (pin ? `pin ${tupN(pin)}` : "") : dot ? `কাগজে ${tupN(dot)}` : ""}
          {over && landed ? ` → ফুল ${tupN(landed)}` : ""}
        </span>
      </div>
      {over && !ok && (
        <Nope key={miss}>
          {round === 0
            ? `ফুল গেলো ${tupN(TM_MOVE)} এ। আপনার pin ${tupN(pin ?? [0, 0])} এ। কেন? প্রথম দড়ি এখন 2 ঘর লম্বা।`
            : `কাগজের ${tupN(dot ?? [0, 0])} গিয়ে পড়লো ${tupN(landed ?? [0, 0])} এ, হলুদ ঘরে না। x টা দুইগুণ হয়ে যায়।`}
        </Nope>
      )}
      <Task done={round === 1 && over && ok}>
        {round === 0 ? "কাগজের (5, 3) এর ফুল দড়ি টানার পরে কোথায় যাবে? সেখানে pin বসান, তারপর টানুন।" : "টানার পরে ফুল যেন হলুদ ঘরে, রাস্তার (5, 3) এ পড়ে। কাগজে ফুলটা কোথায় বসাবেন?"}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The finale's widget: the article's two faces. Six places a matrix shows
//     up in machine learning, one at a time; the reader sorts each into
//     "table" (it keeps numbers) or "move" (it does something). A right tap
//     flies the card into its bin; a wrong tap flies it toward the wrong bin,
//     it comes back, shakes, and a Nope says why.

type P_Use = { name: string; shape: string; verb: boolean; why: string };
const TF_USES: P_Use[] = [
  { name: "ক্লাসের data: প্রতি row এ একজন student", shape: "10000 × 300", verb: false, why: "Row মানে student, column মানে feature। এটা জমা রাখা।" },
  { name: "Neural network এর একটা layer", shape: "512 × 768", verb: true, why: "Layer প্রতিটা vector কে নতুন জায়গায় পাঠায়। এটা একটা move।" },
  { name: "একটা greyscale ছবি", shape: "28 × 28", verb: false, why: "প্রতিটা ঘরে একটা pixel। ছবিটাই table।" },
  { name: "PCA এর rotation", shape: "300 × 300", verb: true, why: "PCA grid ঘুরায়। 5.6b তে দেখেছেন। এটা একটা move।" },
  { name: "Embedding table: প্রতি word এ একটা row", shape: "50000 × 300", verb: false, why: "প্রতি row এ একটা word এর সংখ্যা। জমা রাখা।" },
  { name: "System of equations, 5.5 এর দুই line এর মতো", shape: "2 × 2", verb: true, why: "প্রতিটা row একটা line। Matrix টা card কে map এ নামায়। এটা move." },
];

export function TwoFacesSort() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [wrong, setWrong] = useSeed<boolean | null>("wrong", null);
  const [miss, setMiss] = useState(0);
  const fly = usePlay(420);
  const [to, setTo] = useState<boolean | null>(null); // the bin the card is flying toward
  const done = at >= TF_USES.length;
  const use = TF_USES[Math.min(at, TF_USES.length - 1)];
  const sort = (verb: boolean) => {
    if (fly.running) return;
    setTo(verb);
    setWrong(null);
    if (verb === use.verb)
      fly.play(1, () => {
        setTo(null);
        setAt(at + 1);
        if (at + 1 === TF_USES.length) pass("Matrix কখনো table, কখনো move.");
      });
    else
      fly.play(2, () => {
        setTo(null);
        setWrong(verb);
        setMiss((n) => n + 1);
      });
  };
  // first leg: into the bin (right) or partway toward it (wrong); second leg: back
  const away = to !== null && fly.running && fly.k === 0;
  const flyCls = !away
    ? ""
    : to === use.verb
      ? to
        ? "translate-x-1/2 -translate-y-28 scale-50 opacity-0"
        : "-translate-x-1/2 -translate-y-28 scale-50 opacity-0"
      : to
        ? "translate-x-1/3 -translate-y-12 scale-75"
        : "-translate-x-1/3 -translate-y-12 scale-75";
  const bin = (verb: boolean) => (
    <div className={`min-h-[7.5rem] rounded-xl border-2 p-2 ${verb ? "border-cat-amber/40 bg-cat-amber/5" : "border-cat-blue/40 bg-cat-blue/5"}`}>
      <div className="text-center text-sm font-semibold">{verb ? "move: কিছু করে" : "table: জমা রাখে"}</div>
      <div className="mt-1.5 grid gap-1">
        {TF_USES.slice(0, at)
          .filter((u) => u.verb === verb)
          .map((u) => (
            <div key={u.name} className={`${POP} rounded-md bg-surface px-1.5 py-0.5 text-[0.7rem] leading-tight shadow-sm`}>
              {u.name}
            </div>
          ))}
      </div>
    </div>
  );
  return (
    <>
      <div className="mx-auto grid max-w-[24rem] grid-cols-2 gap-2">
        {bin(false)}
        {bin(true)}
      </div>
      {!done && (
        <div
          key={`${at}-${miss}`}
          className={`mx-auto mt-3 max-w-[18rem] rounded-xl border-2 border-border bg-surface px-3 py-2 text-center shadow-sm transition-[translate,scale,opacity] duration-400 ease-in-out motion-reduce:transition-none ${
            wrong === null ? "starting:scale-0 starting:opacity-0" : "nudge"
          } ${flyCls}`}
        >
          <div className="text-[0.95rem] leading-snug">{use.name}</div>
          <div className="mt-0.5 font-mono text-sm text-muted">{use.shape}</div>
        </div>
      )}
      {!done && (
        <div className="mx-auto mt-3 grid max-w-[24rem] grid-cols-2 gap-2">
          <button type="button" onClick={() => sort(false)} disabled={fly.running} className={quietBtn + " justify-center"}>
            ← table
          </button>
          <button type="button" onClick={() => sort(true)} disabled={fly.running} className={quietBtn + " justify-center"}>
            move →
          </button>
        </div>
      )}
      {wrong !== null && <Nope key={miss}>উঁহু। {use.why}</Nope>}
      {done && <div className={`mt-3 text-center text-[0.95rem] text-accent-text ${FADE}`}>ছয়টাই জায়গামতো। একই জিনিস, দুই চেহারা।</div>}
      <Task done={done}>প্রতিটা matrix কোন দিকে যাবে? জমা রাখা table, নাকি কিছু একটা করা move?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. Watch-only, driven by the reader (useScene). The school roof
// at dusk, with a railing and a string of tuni lights; the art sir borrows
// Nana's look, his name drawn under his feet.

function P_Roof({ lights = true }: { lights?: boolean }) {
  const cols = ["#ef4444", "#22c55e", "#3b82f6", "#eab308"];
  return (
    <g className="pointer-events-none">
      <rect x={0} y={128} width={320} height={52} fill="#d6d3d1" />
      <path d="M0 108H320" stroke="#57534e" strokeWidth={2.4} />
      {Array.from({ length: 17 }, (_, i) => (
        <path key={i} d={`M${i * 20} 108V128`} stroke="#57534e" strokeWidth={1.4} />
      ))}
      {lights && (
        <>
          <path d="M0 20Q80 40 160 22T320 24" fill="none" stroke="#44403c" strokeWidth={0.8} />
          {Array.from({ length: 16 }, (_, i) => {
            const x = 10 + i * 20;
            const y = 22 + Math.sin((x / 320) * Math.PI * 2) * -6 + 6;
            return <circle key={i} cx={x} cy={y} r={2} fill={cols[i % 4]} />;
          })}
        </>
      )}
    </g>
  );
}

function P_Name({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
      {text}
    </text>
  );
}

/** a small sheet of paper held up, with a word on it */
function P_Sheet({ x, y, text, tone = INK }: { x: number; y: number; text: string; tone?: string }) {
  return (
    <g className={POP}>
      <rect x={x - 17} y={y - 12} width={34} height={24} rx={1.5} fill="white" stroke={INK} strokeOpacity={0.35} />
      <text x={x} y={y + 3} textAnchor="middle" fontSize={7} fontFamily={MONO} fontWeight={700} fill={tone}>
        {text}
      </text>
    </g>
  );
}

// 1a · The roof on Boishakh eve. Lights on; Fahim holds up his map's card,
//      Rina the notebook's; Nasib looks from one to the other and says his
//      line. Which is wrong is left to the bet.

export function RoofEve({}: Story) {
  const s = useScene(4, [600, 1600, 1600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="চৈত্রের শেষ সন্ধ্যা, স্কুলের ছাদ; ফাহিমের হাতে map এর card (−1, 3), রিনার হাতে notebook এর (5, 3); নাসিব বললো একই দুই arrow, দুইটার একটা ভুল">
        <P_Roof lights={k >= 1} />
        <Person who="fahim" x={70} y={150} label arm={k >= 2 ? "hold" : "down"} />
        <Person who="rina" x={250} y={150} facing={-1} label arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && (
          <>
            <Card x={70} y={70} text="(−1, 3)" tone="coral" />
            <Card x={250} y={70} text="(5, 3)" tone="amber" />
          </>
        )}
        <Person who="nasib" x={k >= 3 ? 160 : 360} y={150} facing={-1} walking={k === 3} label={k >= 3} />
        {k === 3 && <Bubble x={160} y={84} lines={["একই দুই arrow।", "একই (2, 3)।"]} />}
        {k >= 4 && <Bubble x={160} y={84} lines={["দুইটার একটা ভুল।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · Fahim at the railing with his khata open on it; he points down at the
//      lane. Rina asks which address is the real one. The page flutters; he
//      holds it down.

export function FahimsPage({}: Story) {
  const s = useScene(3, [600, 1600, 2600, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="ফাহিম খাতাটা রেলিং এর উপর মেলে ধরে নিচের গলি দেখালো; রিনা জিজ্ঞেস করলো কোনটা আসল ঠিকানা; বাতাসে পাতা উড়ছিল, ফাহিম চেপে ধরলো">
        <P_Roof />
        <g>
          <rect x={100} y={101} width={30} height={8} rx={1} fill="white" stroke={INK} strokeOpacity={0.4} />
          <path
            d={k === 3 ? "M130 101l12 -2l-2 8Z" : "M130 101l10 -9l2 9Z"}
            fill="white"
            stroke={INK}
            strokeOpacity={0.4}
            className="transition-all duration-300 motion-reduce:transition-none"
          />
        </g>
        <Person who="fahim" x={88} y={150} label arm={k === 1 ? "point" : k >= 3 ? "hold" : "down"} />
        {k === 1 && <Bubble x={88} y={84} side="right" lines={["ওই গলি দিয়েই", "প্রথম দিন গেছি।"]} />}
        <Person who="rina" x={230} y={150} facing={-1} label />
        {k === 2 && <Bubble x={230} y={84} side="left" lines={["কোনটা আসল", "ঠিকানা?"]} />}
        {k >= 2 && (
          <g className={FADE}>
            <path d="M132 62q10 -4 20 0t20 0M142 74q10 -4 20 0" fill="none" stroke="#78716c" strokeWidth={1} strokeLinecap="round" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Down on the road: the art sir kneels at the pillar, two ropes tied,
//      Karim holds the second rope's end. Rina's marigold is on the petal tip.
//      The art sir calls up to the roof. The pull is the reader's.

export function ArtSirRope({}: Story) {
  const s = useScene(3, [600, 1600, 2600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={110} label="নিচে রাস্তায় আর্ট স্যার pillar এর পাশে বসা; দুইটা দড়ি; করিম দ্বিতীয় দড়ির মাথা ধরে আছে; আর্ট স্যার বললেন দড়িটা গলির দিকে টানো, দেখো ফুলটা কোথায় যায়">
        <rect x={20} y={44} width={14} height={70} fill="#b91c1c" />
        <rect x={14} y={38} width={26} height={8} fill="#7f1d1d" />
        {/* the ropes, and the alpana further along the road */}
        <path d="M34 112L300 128" stroke="#f59e0b" strokeWidth={2.2} strokeLinecap="round" />
        {k >= 1 && <path d="M34 104L132 124" stroke="#2dd4bf" strokeWidth={2.2} strokeLinecap="round" className={FADE} />}
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse key={i} cx={196 + i * 14} cy={150 - Math.abs(i - 2) * 5} rx={6} ry={3} fill="#f472b6" opacity={0.85} />
        ))}
        {k >= 1 && <circle cx={224} cy={139} r={3.5} fill={MARI} className={POP} />}
        <Person who="nana" x={60} y={168} facing={1} arm={k === 2 ? "wave" : "down"} />
        <P_Name x={60} y={168} text="আর্ট স্যার" />
        <Person who="karim" x={k >= 1 ? 140 : 360} y={168} facing={-1} walking={k === 1} label arm={k >= 1 ? "hold" : "down"} />
        {k === 2 && <Bubble x={60} y={100} side="right" lines={["দড়িডা গলির দিকে টানো।", "দেহো ফুলডা কোম্মে যায়।"]} />}
        {k >= 3 && <Bubble x={140} y={100} side="left" lines={["ধরলাম, স্যার।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Nasib won't let go. He lays the two pictures side by side on the
//      railing, Fahim's map on the left, the road on the right, and asks for
//      both to be run at once, on the same two ropes.

/** a small picture laid on the railing, bottom at y: Fahim's map, or the road with its alpana */
function S4_Sheet({ x, y, road }: { x: number; y: number; road: boolean }) {
  const w = 38;
  const h = 28;
  const x0 = x - w / 2;
  const y0 = y - h;
  let d = "";
  for (let i = 1; i < 6; i += 1) d += `M${x0 + (i * w) / 6} ${y0 + 2}V${y - 2}`;
  for (let j = 1; j < 4; j += 1) d += `M${x0 + 2} ${y0 + (j * h) / 4}H${x0 + w - 2}`;
  return (
    <g className={POP}>
      <rect x={x0} y={y0} width={w} height={h} rx={1.5} fill={road ? "#57534e" : "white"} stroke={INK} strokeOpacity={0.4} />
      <path d={d} stroke={road ? "#f8fafc" : "#3b82f6"} strokeOpacity={road ? 0.35 : 0.35} strokeWidth={0.7} />
      {road ? (
        <>
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={x - 5 + i * 6} cy={y - 12 - Math.abs(i - 1) * 3} rx={3} ry={1.6} fill="#f472b6" />
          ))}
          <circle cx={x + 8} cy={y - 18} r={2.4} fill={MARI} />
        </>
      ) : (
        <>
          <rect x={x - 11} y={y - 8} width={4} height={4} fill="#f59e0b" />
          <rect x={x + 5} y={y - 22} width={5} height={5} fill="#dc2626" />
        </>
      )}
    </g>
  );
}

export function NasibSideBySide({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="নাসিব দুইটা ছবি রেলিং এর উপর পাশাপাশি রাখলো, বাঁয়ে ফাহিমের map, ডানে রাস্তা; বললো দুইটা একসাথে চালাও, একই দুই দড়ি, দেখি কী হয়">
        <P_Roof />
        <Person who="fahim" x={48} y={150} label />
        <Person who="nasib" x={110} y={150} label arm={k === 1 ? "hold" : k >= 2 ? "point" : "down"} />
        {k >= 1 && (
          <>
            <S4_Sheet x={168} y={108} road={false} />
            <S4_Sheet x={212} y={108} road />
          </>
        )}
        <Person who="rina" x={272} y={150} facing={-1} label />
        {k === 2 && <Bubble x={110} y={84} side="right" lines={["দুইটা একসাথে চালাও।"]} />}
        {k >= 3 && <Bubble x={110} y={84} side="right" lines={["একই দুই দড়ি।", "দেখি কী হয়।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · Som lays Rina's page over Fahim's and asks about the first morning:
//      which card Fahim gave the rickshaw mama first, and where it stopped.

export function SomStacks({}: Story) {
  const s = useScene(4, [600, 1600, 2400, 2000, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সোম রিনার পাতা ফাহিমের পাতার উপরে রাখলো; জিজ্ঞেস করলো প্রথম দিন মামাকে প্রথমে কোন card দিয়েছিল; ফাহিম বললো (2, 3), রিকশা থেমেছিল (5, 3) এ">
        <P_Roof />
        <Person who="som" x={150} y={150} label arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && (
          <g className={POP}>
            <rect x={158} y={104} width={20} height={14} rx={1} fill="white" stroke={INK} strokeOpacity={0.4} />
            <rect x={162} y={101} width={20} height={14} rx={1} fill="white" stroke="#0284c7" strokeOpacity={0.6} />
          </g>
        )}
        <Person who="fahim" x={260} y={150} facing={-1} label />
        <Person who="rina" x={60} y={150} label />
        {k === 2 && <Bubble x={150} y={84} side="right" lines={["প্রথমে মামাকে", "কোন card দিছিলা?"]} />}
        {k === 3 && <Bubble x={260} y={84} side="left" lines={["(2, 3). Map এর।"]} />}
        {k >= 4 && (
          <>
            <Bubble x={150} y={84} side="right" lines={["রিকশা থামলো কই?"]} />
            <Card x={260} y={70} text="(5, 3)" tone="amber" />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Your turn. The wind picks up on the roof. Samin comes with his laptop:
//      five small stories from these days, each with one question.

export function SaminLaptop({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 2000]);
  const k = s.k;
  const gust = k % 2 === 0 ? 0 : 14;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="ছাদে বাতাস বাড়ছে; সামিন ল্যাপটপ নিয়ে এলো; তাতে পাঁচটা ছোট ঘটনা, প্রত্যেকটায় একটাই প্রশ্ন: arrow নড়েছে, নাকি কাগজ বদলেছে">
        <P_Roof />
        <g className="transition-transform duration-1000 ease-out motion-reduce:transition-none" style={{ transform: `translateX(${gust}px)` }}>
          <path d="M40 48q14 -6 28 0t28 0M70 62q12 -5 24 0M150 44q14 -6 28 0t28 0" fill="none" stroke="#78716c" strokeWidth={1} strokeLinecap="round" />
        </g>
        <Person who="fahim" x={48} y={150} label />
        <Person who="nasib" x={106} y={150} label />
        <Person who="samin" x={k >= 1 ? 164 : 360} y={150} facing={-1} walking={k === 1} label arm={k >= 2 ? "point" : "hold"} />
        {k >= 2 && (
          <g className={POP}>
            <path d="M190 108l4 -4h44l4 4Z" fill="#94a3b8" stroke={INK} strokeOpacity={0.4} />
            <rect x={194} y={72} width={44} height={32} rx={2} fill="#1e293b" stroke={INK} strokeOpacity={0.5} />
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <text x={199} y={79 + i * 5.6} fontSize={4.6} fontFamily={MONO} fill="#e2e8f0">
                  {i + 1}
                </text>
                <path d={`M203 ${77.5 + i * 5.6}H${k >= 3 ? 225 : 231}`} stroke="#e2e8f0" strokeOpacity={0.7} strokeWidth={1.4} />
                {k >= 3 && (
                  <text x={231} y={79.5 + i * 5.6} fontSize={5.4} fontWeight={800} fill="#fde047" className={POP}>
                    ?
                  </text>
                )}
              </g>
            ))}
          </g>
        )}
        <Person who="rina" x={276} y={150} facing={-1} label />
      </Stage>
    </StoryFrame>
  );
}

// 7a · Seven o'clock: the art sir comes up to the roof with the notebook's
//      last page, the stage alpana, ropes (2, 0) and (0, 1). His line; Rina's
//      question; he says nothing.

export function ArtSirStretch({}: Story) {
  const s = useScene(4, [600, 1800, 1400, 2600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="সন্ধ্যা সাতটা, আর্ট স্যার ছাদে এলেন; notebook এর শেষ পাতায় দড়ি (2, 0) আর (0, 1); বললেন আলপনা দুইগুণ চওড়া হবে, ফুল থাকবে (5, 3) এ; রিনা জিজ্ঞেস করলো কোন কাগজের (5, 3)">
        <P_Roof />
        <Person who="rina" x={70} y={150} label />
        <Person who="nana" x={k >= 1 ? 220 : 360} y={150} facing={-1} walking={k === 1} arm={k >= 2 ? "hold" : "down"} />
        {k >= 1 && <P_Name x={220} y={150} text="আর্ট স্যার" />}
        {k >= 2 && (
          <>
            <P_Sheet x={258} y={62} text="(2, 0)" tone="#b45309" />
            <P_Sheet x={298} y={62} text="(0, 1)" tone="#0f766e" />
          </>
        )}
        {k === 3 && <Bubble x={220} y={96} side="left" lines={["দুইগুণ চওড়া হইবো।", "ফুলডা থাকবো (5, 3)।"]} />}
        {k >= 4 && <Bubble x={70} y={84} side="right" lines={["কোন কাগজের", "(5, 3), স্যার?"]} />}
      </Stage>
    </StoryFrame>
  );
}

/** the শোভাযাত্রা's paper owl on a bamboo pole, pole foot at (x, y) */
function P_Owl({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x} ${y}V${y - 92}`} stroke="#a16207" strokeWidth={2} />
      <ellipse cx={x} cy={y - 104} rx={15} ry={17} fill="#fde68a" stroke="#92400e" strokeWidth={1} />
      <path d={`M${x - 13} ${y - 116}l4 -8l5 6M${x + 13} ${y - 116}l-4 -8l-5 6`} fill="#fde68a" stroke="#92400e" strokeWidth={1} />
      <circle cx={x - 6} cy={y - 108} r={5} fill="white" stroke="#dc2626" strokeWidth={1.4} />
      <circle cx={x + 6} cy={y - 108} r={5} fill="white" stroke="#dc2626" strokeWidth={1.4} />
      <circle cx={x - 6} cy={y - 108} r={1.8} fill={INK} />
      <circle cx={x + 6} cy={y - 108} r={1.8} fill={INK} />
      <path d={`M${x - 2} ${y - 101}l2 4l2 -4Z`} fill="#ea580c" />
      <path d={`M${x - 9} ${y - 94}q9 5 18 0`} fill="none" stroke="#2563eb" strokeWidth={1.4} />
    </g>
  );
}

// 8a · Dawn, Pohela Boishakh. The wet road, the alpana; the paper owl on its
//      bamboo; the procession walks over the design, and the marigold goes
//      under a foot. The art sir by the gate. Flat, no words.

export function DawnWalk({}: Story) {
  const s = useScene(3, [600, 1800, 2400, 2200]);
  const k = s.k;
  const walkers: { who: "fahim" | "rina" | "som" | "nasib" | "samin" | "karim"; dx: number }[] = [
    { who: "rina", dx: 0 },
    { who: "fahim", dx: -34 },
    { who: "samin", dx: -66 },
    { who: "som", dx: -98 },
    { who: "nasib", dx: -130 },
    { who: "karim", dx: -162 },
  ];
  const lead = k >= 3 ? 250 : k >= 2 ? 190 : -40;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={120} label="পহেলা বৈশাখের ভোর; ভেজা রাস্তায় আলপনা; বাঁশের মাথায় কাগজের পেঁচা; শোভাযাত্রা আলপনার উপর দিয়ে হেঁটে গেলো; গাঁদা ফুলটা পায়ের নিচে পড়লো; আর্ট স্যার গেটের পাশে দাঁড়িয়ে">
        <circle cx={40} cy={118} r={14} fill="#fef08a" opacity={0.9} />
        <rect x={0} y={120} width={320} height={60} fill="#78716c" />
        <rect x={0} y={120} width={320} height={60} fill="#1e3a8a" opacity={0.12} />
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse key={i} cx={150 + i * 16} cy={162 - Math.abs(i - 2) * 5} rx={7} ry={3.2} fill="#f472b6" opacity={0.85} />
        ))}
        <ellipse cx={120} cy={164} rx={12} ry={4} fill="#fbbf24" opacity={0.85} />
        {k < 3 && <circle cx={196} cy={152} r={3.5} fill={MARI} />}
        <rect x={290} y={60} width={12} height={110} fill="#b91c1c" />
        <Person who="nana" x={306} y={176} facing={-1} scale={0.9} />
        {k >= 1 && <P_Owl x={lead + 18} y={172} />}
        {k >= 1 &&
          walkers.map((w) => (
            <Person key={w.who} who={w.who} x={lead + w.dx} y={172} walking={k === 2 || k === 3} ms={1800} scale={0.85} />
          ))}
      </Stage>
    </StoryFrame>
  );
}

// 8b · The bet settled, card by card, as a story figure in the finale's
//      setup: the four sealed answers, each marked, Nasib's "one is wrong"
//      last.

const BS_BETS: [string, "no" | "yes"][] = [
  ["ফাহিমের (−1, 3) ভুল", "no"],
  ["রিনার (5, 3) ভুল", "no"],
  ["দুইটাই ভুল", "no"],
  ["দুইটাই ঠিক", "yes"],
];
const BS_SAY = [
  "চারটা বাজি।",
  "(−1, 3) ঠিক: স্কুল নড়েনি, শুধু রাস্তার ভাষায় লেখা।",
  "(5, 3) ঠিক: ফুলটা সত্যিই সরে গেছে।",
  "তাই দুইটাই ভুল হতে পারে না।",
  "দুইটাই ঠিক। প্রশ্ন ছিল দুইটা। নাসিবের একটা ভুল টিকলো না।",
];

function P_Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <svg viewBox="0 0 12 12" className={`size-4 ${POP}`} aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke={OK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" className={`size-4 ${POP}`} aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke={BAD} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function BetSettled({}: Story) {
  const s = useScene(4, [600, 1800, 1800, 1800, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(BS_SAY, k)}>
      <div className="mx-auto grid max-w-[18rem] gap-1.5">
        {BS_BETS.map(([t, v], i) => (
          <div
            key={t}
            className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm transition-colors duration-500 motion-reduce:transition-none ${
              k > i ? (v === "yes" ? "border-accent bg-accent/10" : "border-border opacity-60") : "border-border"
            }`}
          >
            <span>{t}</span>
            {k > i && <P_Mark ok={v === "yes"} />}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The same three things on both pages: the two arrows, the (2, 3), and
//      then two different answers, each left as a "?" of which is right.

const X1_SAY = ["দুইটা পাতা।", "দুই পাতাতেই একই দুইটা arrow: (1, 0) আর (1, 1)।", "দুই পাতাতেই একই (2, 3)।", "উত্তর দুই রকম। কোনটা ভুল? শেষে দেখবো।"];

export function SameArrows() {
  const s = useScene(3, [600, 1800, 1600, 2400]);
  const k = s.k;
  const fm = makeFrame(-1, 4, -1, 4, 16, 6);
  const panel = (label: string, ans: string, tone: string) => (
    <div className="text-center">
      <Plane f={fm} label={label} grid={1} axes={false} className="my-0! max-w-none">
        {k >= 1 && (
          <>
            <Arrow f={fm} from={[0, 0]} to={[1, 0]} tone="blue" w={2.2} draw />
            <Arrow f={fm} from={[0, 0]} to={[1, 1]} tone="coral" w={2.2} draw />
          </>
        )}
        {k >= 2 && <circle cx={fm.sx(2)} cy={fm.sy(3)} r={4} fill={INK} className={POP} />}
        {k >= 2 && (
          <text x={fm.sx(2) + 6} y={fm.sy(3) - 5} fontSize={8} fontFamily={MONO} fontWeight={700} fill={INK}>
            (2, 3)
          </text>
        )}
      </Plane>
      <div className="mt-1 h-6 font-mono text-sm font-bold" style={{ color: tone }}>
        {k >= 3 ? <span className={`${POP} inline-block`}>{ans} ?</span> : ""}
      </div>
    </div>
  );
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <div className="mx-auto grid max-w-[15rem] grid-cols-2 gap-3">
        {panel("ফাহিমের পাতা: দুই arrow আর (2, 3)", "(−1, 3)", "#be123c")}
        {panel("রিনার পাতা: দুই arrow আর (2, 3)", "(5, 3)", "#b45309")}
      </div>
    </Scene>
  );
}

// 2½ · One place, two addresses: the school on the map, reached 2 east and
//      3 north on the square grid; then the road grid, and 3 up the lane and
//      1 back reach the very same school.

const X2_SAY = ["স্কুল, map এ।", "Square grid এ: 2 ঘর east, 3 ঘর north. (2, 3).", "এবার রাস্তার grid। স্কুল জায়গায়।", "গলিতে 3, বড় রাস্তায় 1 পিছনে: (−1, 3)। একই স্কুল।"];

export function OnePlaceTwoNames() {
  const s = useScene(3, [600, 1800, 1400, 2400]);
  const k = s.k;
  const f = MINI_MAP;
  const lane = k >= 2 ? 1 : 0;
  const [t] = useTween([lane], 900);
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <div className="mx-auto w-full max-w-[12rem]">
        <Plane f={f} grid={0} axes={false} label="map এ স্কুল; square grid এ (2, 3), রাস্তার grid এ (−1, 3)" className="my-0! max-w-none">
          <P_MapView f={f} t={t} name={false} />
          {k === 1 && (
            <>
              <Arrow f={f} from={[0, 0]} to={[2, 0]} tone="ink" w={2} draw />
              <Arrow f={f} from={[2, 0]} to={[2, 3]} tone="ink" w={2} draw delay={500} />
            </>
          )}
          {k >= 3 && <L_Trail f={f} pts={route(P_CARD)} w={2} draw />}
        </Plane>
      </div>
    </Scene>
  );
}

// 3½ · The recipe on the road: the marigold is 2 of rope 1 and 3 of rope 2.
//      With the ropes leaned, 2 × (1, 0) then 3 × (1, 1) walk from the pillar
//      to (5, 3), read on the road's own squares.

const X3_SAY = ["পাতায় ফুল: প্রথম দড়ি 2 বার, দ্বিতীয় দড়ি 3 বার।", "হেলানো রাস্তায় প্রথম দড়ি (1, 0): 2 বার, (2, 0)।", "দ্বিতীয় দড়ি (1, 1): 3 বার। প্রতিবার এক ঘর ডানে, এক ঘর উপরে।", "রাস্তার ঘরে পৌঁছালাম (5, 3)।"];

export function FlowerRecipe() {
  const s = useScene(3, [600, 1800, 2200, 1800]);
  const k = s.k;
  const f = ROAD_F;
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <div className="mx-auto w-full max-w-[17rem]">
        <Plane f={f} grid={0} axes={false} paper={false} label="হেলানো রাস্তায় দুই দড়ির recipe: 2 বার (1, 0), 3 বার (1, 1), পৌঁছায় (5, 3)" className="my-0! max-w-none">
          <P_RoadView f={f} cols={SHEAR} ropes={false} />
          {k >= 1 && [0, 1].map((i) => <Arrow key={`a${i}`} f={f} from={[i, 0]} to={[i + 1, 0]} tone="amber" w={2.4} draw delay={i * 250} />)}
          {k >= 2 && [0, 1, 2].map((i) => <Arrow key={`b${i}`} f={f} from={[2 + i, i]} to={[3 + i, i + 1]} tone="teal" w={2.4} draw delay={i * 300} />)}
          {k >= 3 && <circle cx={f.sx(5)} cy={f.sy(3)} r={9} fill="none" stroke="#fde047" strokeWidth={2} className={POP} />}
        </Plane>
      </div>
    </Scene>
  );
}

// 4½ · Active and passive, as a small table filling row by row.

const X4_ROWS: [string, string, string][] = [
  ["কী নড়ে", "arrow, জিনিসটা", "কাগজ, grid"],
  ["arrow", "অন্য জায়গায় যায়", "এক চুলও নড়ে না"],
  ["সংখ্যা বদলায়, কারণ", "জিনিস বদলেছে", "বর্ণনা বদলেছে"],
  ["প্রশ্নটা", "কোথায় গেলো?", "নতুন grid এ ঠিকানা কী?"],
];
const X4_SAY = ["দুই রকম move।", "একটায় arrow নড়ে, আরেকটায় কাগজ।", "Active এ arrow সত্যিই সরে। Passive এ বসে থাকে।", "সংখ্যা দুই জায়গাতেই বদলায়। কারণ আলাদা।", "প্রশ্নও আলাদা। তাই উত্তরও আলাদা।"];

export function ActivePassive() {
  const s = useScene(4, [600, 1600, 1800, 1800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <div className="mx-auto max-w-[19rem] overflow-hidden rounded-lg border border-border text-[0.78rem] leading-tight">
        <div className="grid grid-cols-[1fr_1.1fr_1.1fr] bg-foreground/5 font-semibold">
          <div className="px-2 py-1.5" />
          <div className="px-2 py-1.5 text-cat-amber">active (রাস্তা)</div>
          <div className="px-2 py-1.5 text-cat-coral">passive (map)</div>
        </div>
        {X4_ROWS.map((r, i) => (
          <div key={r[0]} className={`grid grid-cols-[1fr_1.1fr_1.1fr] border-t border-border ${k > i ? FADE : "opacity-0"}`}>
            <div className="px-2 py-1.5 text-muted">{r[0]}</div>
            <div className="px-2 py-1.5">{r[1]}</div>
            <div className="px-2 py-1.5">{r[2]}</div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// 4½b · The 5.6b callback: 2.3's four words on their map, the square grid
//       turned under them twice. The words don't move; only the paper does.

const X4B_WORDS: { w: string; at: XY }[] = [
  { w: "man", at: [-2.9, -2.1] },
  { w: "woman", at: [1.1, -2.5] },
  { w: "king", at: [-1.9, 2.4] },
  { w: "queen", at: [2.4, 2.3] },
];
const X4B_SAY = ["5.6b এর word map: king, queen, man, woman.", "নিচের grid ঘুরালাম।", "আরো ঘুরালাম। Word গুলো যেখানে ছিল, সেখানেই।", "নড়েছে শুধু কাগজ। ওটা ছিল passive।"];
const X4B_F = makeFrame(-4, 4, -3.4, 3.4, 15, 6);

export function WordsStayPut() {
  const s = useScene(3, [600, 1400, 1600, 2200]);
  const k = s.k;
  const f = X4B_F;
  const deg = k === 0 ? 0 : k === 1 ? 25 : 55;
  let d = "";
  for (let i = -7; i <= 7; i += 1) d += `M${f.sx(i)} ${f.sy(-7)}V${f.sy(7)}M${f.sx(-7)} ${f.sy(i)}H${f.sx(7)}`;
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <div className="mx-auto w-full max-w-[11rem]">
        <Plane f={f} grid={0} axes={false} label="2.3 এর word map; নিচের grid ঘুরছে, word গুলো জায়গায়" className="my-0! max-w-none">
          <P_Clip f={f} sheet>
            <g
              className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
              style={{ transform: `rotate(${-deg}deg)`, transformOrigin: `${f.sx(0)}px ${f.sy(0)}px` }}
            >
              <path d={d} stroke="#3b82f6" strokeOpacity={0.3} strokeWidth={0.7} fill="none" />
              <path d={`M${f.sx(-7)} ${f.sy(0)}H${f.sx(7)}M${f.sx(0)} ${f.sy(-7)}V${f.sy(7)}`} stroke={INK} strokeOpacity={0.45} strokeWidth={1.2} />
            </g>
          </P_Clip>
          {X4B_WORDS.map((wd) => (
            <g key={wd.w} className="pointer-events-none">
              {k >= 3 && <circle cx={f.sx(wd.at[0])} cy={f.sy(wd.at[1])} r={8} fill="none" stroke="#7c3aed" strokeWidth={1.4} className={POP} />}
              <circle cx={f.sx(wd.at[0])} cy={f.sy(wd.at[1])} r={3.6} fill="#7c3aed" />
              <text x={f.sx(wd.at[0])} y={f.sy(wd.at[1]) - 7} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
                {wd.w}
              </text>
            </g>
          ))}
        </Plane>
      </div>
    </Scene>
  );
}

// 4½c · For the side note: change of basis can be run back. Fahim's map
//       turns into the road grid (the school's address becomes (−1, 3)) and
//       back into squares (it is (2, 3) again). Nothing is lost on the way.

const X4C_SAY = ["ফাহিমের map। স্কুলের ঠিকানা (2, 3)।", "কাগজ বদলালাম: রাস্তার grid। একই স্কুল, ঠিকানা (−1, 3)।", "এবার উল্টা দিকে চালালাম। কাগজ আবার square।", "ঠিকানা আবার (2, 3)। কিছুই হারায়নি। পুরোপুরি ফেরত আনা গেলো।"];

export function LeanAndBack() {
  const s = useScene(3, [600, 1800, 1600, 2400]);
  const k = s.k;
  const f = MINI_MAP;
  const [t] = useTween([k === 1 ? 1 : 0], 900);
  const addr = k === 1 ? "(−1, 3)" : "(2, 3)";
  return (
    <Scene scene={s} caption={say(X4C_SAY, k)}>
      <div className="mx-auto flex w-full max-w-[16rem] items-center gap-3">
        <div className="w-[9.5rem] shrink-0">
          <Plane f={f} grid={0} axes={false} label="ফাহিমের map; grid রাস্তার grid হয়, আবার square এ ফেরে; স্কুল জায়গায়" className="my-0! max-w-none">
            <P_MapView f={f} t={t} name={false} />
            {k === 1 && <L_Trail f={f} pts={route(P_CARD)} w={2} draw />}
            {k >= 3 && <circle cx={f.sx(2)} cy={f.sy(3)} r={11} fill="none" stroke={OK} strokeWidth={1.6} className={POP} />}
          </Plane>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted">স্কুলের ঠিকানা</div>
          <div key={addr} className={`font-mono text-lg font-bold ${k === 1 ? "text-cat-coral" : ""} ${POP} inline-block`}>
            {addr}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// 5½ · One machine, two directions. The lean [[1, 1], [0, 1]] takes a paper
//      point to the road: (2, 3) in, (5, 3) out — the active question. The
//      passive question runs it backwards: which card goes in so that (2, 3)
//      comes out? (−1, 3).

const X5_SAY = ["রিনার grid: দুইটা column, দুইটা দড়ি।", "Active: (2, 3) ঢুকলো, বের হলো (5, 3)। ফুল সরলো।", "Passive: কোন card ঢোকালে (2, 3) বের হয়?", "(−1, 3). একই যন্ত্র, উল্টা দিক থেকে পড়া।"];

function X5_Grid({ x, y }: { x: number; y: number }) {
  const r = rowsOf(SHEAR);
  return (
    <g>
      <rect x={x - 26} y={y - 20} width={52} height={40} rx={6} fill="#f1f5f9" stroke={INK} strokeOpacity={0.35} />
      <path d={`M${x - 16} ${y - 14}h-3v28h3M${x + 16} ${y - 14}h3v28h-3`} fill="none" stroke={INK} strokeWidth={1.2} />
      {r.map((row, i) =>
        row.map((v, j) => (
          <text key={`${i}${j}`} x={x - 8 + j * 16} y={y - 2 + i * 12} textAnchor="middle" fontSize={10} fontFamily={MONO} fontWeight={700} fill={j === 0 ? "#b45309" : "#0f766e"}>
            {v}
          </text>
        )),
      )}
    </g>
  );
}

export function MachineBothWays() {
  const s = useScene(3, [600, 1800, 2000, 2200]);
  const k = s.k;
  const rev = k >= 2;
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <svg viewBox="0 0 240 70" role="img" aria-label="রিনার grid: (2, 3) দিলে (5, 3); আর (−1, 3) দিলে (2, 3)" className="mx-auto block h-auto w-full max-w-[16rem]">
        <X5_Grid x={120} y={35} />
        {k >= 1 && (
          <g key={rev ? "b" : "a"} className={FADE}>
            <text x={40} y={39} textAnchor="middle" fontSize={11} fontFamily={MONO} fontWeight={700} fill={rev ? "#be123c" : INK}>
              {rev ? (k >= 3 ? "(−1, 3)" : "(?, ?)") : "(2, 3)"}
            </text>
            <path d="M68 35H88" stroke={INK} strokeOpacity={0.5} strokeWidth={1.4} />
            <path d="M88 35l-5 -3v6Z" fill={INK} fillOpacity={0.5} />
            <path d="M152 35H172" stroke={INK} strokeOpacity={0.5} strokeWidth={1.4} />
            <path d="M172 35l-5 -3v6Z" fill={INK} fillOpacity={0.5} />
            <text x={202} y={39} textAnchor="middle" fontSize={11} fontFamily={MONO} fontWeight={700} fill={rev ? INK : "#b45309"}>
              {rev ? "(2, 3)" : "(5, 3)"}
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 5½b · For the Article 12 side note: change the paper, do the easy move,
//       change it back. A round patch is to be pulled long on a slant — awkward
//       on the square grid. Turn the grid to the slant, stretch along its first
//       direction only, turn the grid back: the same slanted long shape.
//       (The 45° turn and the ×2 are this figure's own, not the book's.)

const X5B_SAY = [
  "একটা move: গোলটাকে হেলানো দিকে টেনে লম্বা করা। Square grid এ দেখতে জটিল।",
  "আগে কাগজ বদলান: grid ঘুরিয়ে টানার দিকে মিলান।",
  "সহজ grid এ move টা করেন: শুধু প্রথম দিকে দুইগুণ।",
  "তারপর কাগজ আবার আগের মতো। সেই হেলানো লম্বা shape টাই।",
];
const X5B_F = makeFrame(-2.6, 2.6, -2.6, 2.6, 18, 6);

export function SwapPaper() {
  const s = useScene(3, [600, 2200, 1600, 1800]);
  const k = s.k;
  const f = X5B_F;
  const deg = k === 1 || k === 2 ? 45 : 0;
  const [st] = useTween([k >= 2 ? 2 : 1], 900);
  const r = 0.85 * f.u;
  let d = "";
  for (let i = -5; i <= 5; i += 1) d += `M${f.sx(i)} ${f.sy(-5)}V${f.sy(5)}M${f.sx(-5)} ${f.sy(i)}H${f.sx(5)}`;
  const cx = f.sx(0);
  const cy = f.sy(0);
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <div className="mx-auto w-full max-w-[9rem]">
        <Plane f={f} grid={0} axes={false} label="একটা গোল; grid ঘুরে, গোলটা এক দিকে দুইগুণ লম্বা হয়, grid আবার ফেরে" className="my-0! max-w-none">
          <P_Clip f={f} sheet>
            <g
              className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
              style={{ transform: `rotate(${-deg}deg)`, transformOrigin: `${cx}px ${cy}px` }}
            >
              <path d={d} stroke="#f43f5e" strokeOpacity={0.35} strokeWidth={0.8} fill="none" />
              <path d={`M${f.sx(-5)} ${cy}H${f.sx(5)}`} stroke="#f59e0b" strokeOpacity={0.8} strokeWidth={1.6} />
            </g>
          </P_Clip>
          {k === 0 && <ellipse cx={cx} cy={cy} rx={r * 2} ry={r} transform={`rotate(-45 ${cx} ${cy})`} fill="none" stroke={INK} strokeOpacity={0.4} strokeDasharray="3 3" className={FADE} />}
          <ellipse cx={cx} cy={cy} rx={r * st} ry={r} transform={`rotate(-45 ${cx} ${cy})`} fill="#fbbf24" fillOpacity={0.55} stroke="#b45309" strokeWidth={1.2} />
        </Plane>
      </div>
    </Scene>
  );
}

// 7½ · Times two, or half. Moving the marigold doubles its first number on
//      the same squares; renaming halves it, because the new squares are two
//      wide.

const X7_SAY = ["দড়ি (2, 0): প্রতি ঘর এখন 2 চওড়া।", "সরালে: (5, 3) যায় (10, 3) এ। x দুইগুণ।", "নাম বদলালে: ফুল বসে থাকে (5, 3) এ।", "নতুন ঘর গুনলে 2.5 টা: card (2.5, 3). x অর্ধেক।"];

export function DoubleHalf() {
  const s = useScene(3, [600, 1800, 1600, 2400]);
  const k = s.k;
  const f = TM_F;
  const [t] = useTween([k === 1 ? 1 : 0], 900);
  const m = partway(byCols(STRETCH), t);
  const newGrid = byCols(STRETCH);
  return (
    <Scene scene={s} caption={say(X7_SAY, k)}>
      <div className="mx-auto w-full max-w-[17rem]">
        <Plane f={f} grid={0} axes={false} paper={false} label="সরালে (5, 3) যায় (10, 3) এ; নাম বদলালে (5, 3) এর card (2.5, 3)" className="my-0! max-w-none">
          <RoadBed f={f} />
          <P_RoadSquares f={f} />
          <P_Clip f={f}>{k >= 2 ? <ChalkGrid f={f} move={newGrid} x0={-1} x1={6} y0={-1} y1={4} tone="#fde047" /> : <ChalkGrid f={f} move={m} x0={-1} x1={6} y0={-1} y1={4} />}</P_Clip>
          <Pillar f={f} />
          <P_Marigold f={f} at={k === 1 ? m(TM_SPOT) : TM_SPOT} />
          {k >= 3 && [0, 1].map((i) => <Arrow key={i} f={f} from={[i * 2, 0]} to={[i * 2 + 2, 0]} tone="amber" w={2.2} draw delay={i * 300} />)}
          {k >= 3 && <Arrow f={f} from={[4, 0]} to={[5, 0]} tone="amber" w={2.2} draw delay={600} />}
        </Plane>
      </div>
    </Scene>
  );
}

// 8½ · Five things to carry out of Article 6, one per beat.

const X8_THINGS = [
  "Matrix: m × n সংখ্যার table. Row মানে জিনিস, column মানে feature.",
  "Matrix একটা move ও: পুরা plane একসাথে, pillar জায়গায় রেখে।",
  "Column গুলো বলে দড়ি দুইটা কোথায় গিয়ে পড়ে।",
  "m × n matrix n সংখ্যা নেয়, m সংখ্যা দেয়। চ্যাপ্টা হলে আর ফেরা নাই।",
  "Linear: আগে যোগ পরে move, বা উল্টা, একই। Slide আর square পারে না।",
];
const X8_SAY = ["Article 6 থেকে পাঁচটা কথা।", "এক: 6.1 এর register.", "দুই: 6.2 এর আলপনা।", "তিন: 6.3 আর 6.4 এর দড়ি।", "চার: 6.5 এর চ্যাপ্টা মোড়।", "পাঁচ: 6.6 এর club এর যন্ত্র।"];

export function FiveThings() {
  const s = useScene(5, [600, 1800, 1800, 1800, 1800, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X8_SAY, k)}>
      <ol className="mx-auto grid max-w-[20rem] gap-1 text-[0.78rem] leading-snug">
        {X8_THINGS.map((th, i) => (
          <li key={i} className={`flex gap-2 ${k > i ? FADE : "opacity-0"}`}>
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-cat-blue/15 text-xs font-bold text-cat-blue">{i + 1}</span>
            <span>{th}</span>
          </li>
        ))}
      </ol>
    </Scene>
  );
}

// 8½b · The question Article 7 answers, set up and stopped at "?": how the
//       lean does its sum row by row, and two moves run one after the other,
//       in both orders. No answer is shown.

const X8B_SAY = ["রিনার যন্ত্র: (2, 3) ঢুকলো, (5, 3) বের হলো।", "কিন্তু ভেতরে হিসাবটা row ধরে ধরে কীভাবে হয়?", "আগে হেলানো, তারপর দুইগুণ চওড়া। ফুল কোথায় যায়?", "উল্টা order এ চালালে? একই জায়গায়? Article 7 এ।"];

/** a move as a small box: the lean (slanted lines) or the stretch (wide squares), named under it */
function X8B_Box({ x, y, lean }: { x: number; y: number; lean: boolean }) {
  const id = `x8b${lean ? "l" : "s"}${x}${y}`;
  let d = "";
  for (let i = -3; i <= 6; i += 1) d += lean ? `M${x - 15 + i * 7} ${y + 11}L${x - 15 + i * 7 + 22} ${y - 11}` : `M${x - 15 + i * 10} ${y + 11}V${y - 11}`;
  return (
    <g className={POP}>
      <defs>
        <clipPath id={id}>
          <rect x={x - 15} y={y - 11} width={30} height={22} rx={3} />
        </clipPath>
      </defs>
      <rect x={x - 15} y={y - 11} width={30} height={22} rx={3} fill="white" stroke={INK} strokeOpacity={0.4} />
      <path d={d} clipPath={`url(#${id})`} stroke={lean ? "#f43f5e" : "#f59e0b"} strokeWidth={1.3} />
      <text x={x} y={y + 20} textAnchor="middle" fontSize={7} fontWeight={600} fill={INK}>
        {lean ? "হেলানো" : "চওড়া"}
      </text>
    </g>
  );
}

function X8B_To({ x, y }: { x: number; y: number }) {
  return (
    <g className={FADE}>
      <path d={`M${x} ${y}h14`} stroke={INK} strokeOpacity={0.5} strokeWidth={1.3} />
      <path d={`M${x + 14} ${y}l-4 -2.6v5.2Z`} fill={INK} fillOpacity={0.5} />
    </g>
  );
}

function X8B_Q({ x, y }: { x: number; y: number }) {
  return (
    <text x={x} y={y + 6} textAnchor="middle" fontSize={17} fontWeight={800} fill="#7c3aed" className={POP}>
      ?
    </text>
  );
}

export function OrderQuestion() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X8B_SAY, k)}>
      <svg viewBox="0 0 240 126" role="img" aria-label="রিনার যন্ত্র (2, 3) কে (5, 3) বানায়; দুইটা move পর পর, দুই order এ; উত্তর ?" className="mx-auto block h-auto w-full max-w-[16rem]">
        <text x={34} y={24} textAnchor="middle" fontSize={10} fontFamily={MONO} fontWeight={700} fill={INK}>
          (2, 3)
        </text>
        <X8B_To x={58} y={20} />
        <X8B_Box x={96} y={20} lean />
        {k >= 1 && <X8B_Q x={96} y={-6 + 20} />}
        <X8B_To x={116} y={20} />
        <text x={156} y={24} textAnchor="middle" fontSize={10} fontFamily={MONO} fontWeight={700} fill="#b45309">
          (5, 3)
        </text>
        {k >= 2 && (
          <g>
            <X8B_Box x={60} y={66} lean />
            <X8B_To x={80} y={66} />
            <X8B_Box x={116} y={66} lean={false} />
            <X8B_To x={136} y={66} />
            <X8B_Q x={164} y={66} />
          </g>
        )}
        {k >= 3 && (
          <g>
            <X8B_Box x={60} y={104} lean={false} />
            <X8B_To x={80} y={104} />
            <X8B_Box x={116} y={104} lean />
            <X8B_To x={136} y={104} />
            <X8B_Q x={164} y={104} />
            <text x={198} y={90} textAnchor="middle" fontSize={11} fontWeight={800} fill={INK} className={POP}>
              একই?
            </text>
            <path d="M174 70q12 15 0 30" fill="none" stroke={INK} strokeOpacity={0.35} strokeDasharray="2 2" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  TwoAnswersBet: { start: {}, sealed: { bet: 2 }, fahim: { bet: 0 }, both: { bet: 3 } },
  ReplaySchool: { start: {}, mid: { t: 0.5 }, end: { t: 1 } },
  ShearTheFlower: { start: {}, mid: { rx: 0.5 }, end: { rx: 1 } },
  PaperOrArrow: { start: {}, guessed: { guess: 1 }, played: { guess: 1, played: true }, slip: { guess: 2, played: true }, right: { guess: 0, played: true } },
  SameMatrixBack: { start: {}, overshoot: { p: [2, 3], ran: true }, right: { p: [-1, 3], ran: true } },
  YourStories: { start: {}, wrong: { round: 2, pick: true }, grow: { round: 1, pick: true }, right: { round: 4, pick: false } },
  TryMoveOrRename: {
    start: {},
    pinned: { pin: [10, 3] },
    moved: { pin: [10, 3], ran: true },
    wrong: { round: 1, dot: [5, 3], ran: true },
    renamed: { round: 1, dot: [2.5, 3], ran: true },
  },
  TwoFacesSort: { start: {}, wrong: { at: 1, wrong: false }, mid: { at: 3 }, done: { at: 6 } },
  RoofEve: { rest: { k: 0 }, cards: { k: 2 }, nasib: { k: 3 }, done: {} },
  FahimsPage: { point: { k: 1 }, ask: { k: 2 }, done: {} },
  ArtSirRope: { rest: { k: 0 }, call: { k: 2 }, done: {} },
  SomStacks: { ask: { k: 2 }, fahim: { k: 3 }, done: {} },
  ArtSirStretch: { rest: { k: 0 }, sir: { k: 3 }, done: {} },
  DawnWalk: { rest: { k: 0 }, owl: { k: 1 }, walk: { k: 2 }, done: {} },
  BetSettled: { mid: { k: 2 }, done: {} },
  SameArrows: { arrows: { k: 1 }, done: {} },
  OnePlaceTwoNames: { square: { k: 1 }, done: {} },
  FlowerRecipe: { rope1: { k: 1 }, done: {} },
  ActivePassive: { mid: { k: 2 }, done: {} },
  MachineBothWays: { active: { k: 1 }, ask: { k: 2 }, done: {} },
  DoubleHalf: { moved: { k: 1 }, rename: { k: 2 }, done: {} },
  FiveThings: { mid: { k: 2 }, done: {} },
  NasibSideBySide: { sheets: { k: 1 }, ask: { k: 2 }, done: {} },
  SaminLaptop: { rest: { k: 0 }, laptop: { k: 2 }, done: {} },
  WordsStayPut: { rest: { k: 0 }, turned: { k: 2 }, done: {} },
  LeanAndBack: { lean: { k: 1 }, back: { k: 2 }, done: {} },
  SwapPaper: { rest: { k: 0 }, turned: { k: 1 }, stretched: { k: 2 }, done: {} },
  OrderQuestion: { ask: { k: 1 }, one: { k: 2 }, done: {} },
};

