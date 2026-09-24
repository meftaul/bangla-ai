"use client";

import { useId, type KeyboardEvent, type ReactNode } from "react";

import { Bubble, Card, Person, Robot, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Stepper, Ticks, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Lit, Plane, clamp, listOf, makeFrame, tup, type Drag, type Frame, type XY } from "@/components/journey/plane";

import { Alpana, ChalkGrid, LOTUS_C, LOTUS_TIPS, PETALS, Pillar, RoadBed, Rope, apply, byCols, partway, pathOf, turnCols, type Cols, type Move } from "./road-kit";

// Screens for "Math for AI 6.3 — Two ropes, and the whole alpana follows",
// told as a Journey. The plan is 06_journey_specs.md, block 6.3.
//
// Nine screens. 1 seals the bet: the art sir pulls his two ropes to (2, 1) and
// (1, 2), marks the ends and leaves for মাগরিব; can the class put the lotus's
// five petals on the road before he's back? 2 is the old way: the petal (2, 3)
// placed by eye, and four friends put it in four places. 3 walks the paper's
// recipe, e₁ twice and e₂ three times, on the new ropes: (7, 8). 4 is Nasib's
// objection, checked on 6.2's 180° turn: the ropes give (−2, −3), and turning
// the whole road puts the petal on the same cross. 5 builds any petal slot by
// slot, (2g₁ + g₂, g₁ + 2g₂). 6 is the mischief: two directions that don't
// turn, (1, 1) and (1, −1). 7 is the reader's turn: all five petals, from the
// rope marks alone. 8 tries new ropes (Check Q2), 9 settles the bet.
//
// After the screens come the story scenes and the watch-only figures, each
// numbered after its screen (1a, 2½, …). The road, the grid and the lotus come
// from road-kit.tsx, shared by every Article 6 journey. The art sir borrows
// Nana's look with his name drawn under his feet, as in 6.1.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const E1C = "#f59e0b"; // the along-the-road rope, e₁ (road-kit's amber)
const E2C = "#2dd4bf"; // the across rope, e₂ (road-kit's teal)
const CHALK = "#f8fafc";
const AFTER = "#f472b6";
const BAD = "#e11d48";
const OK = "#16a34a";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** The art sir's ropes for the lotus crossing: e₁ → (2, 1), e₂ → (1, 2). */
const RP_G: Cols = [
  [2, 1],
  [1, 2],
];
const RP_MOVE = byCols(RP_G);
const RP_ID: Move = (p) => p;
/** back from the road to the paper, for these ropes */
const RP_BACK = (p: XY): XY => [(2 * p[0] - p[1]) / 3, (2 * p[1] - p[0]) / 3];

const eq = (a: XY, b: XY) => a[0] === b[0] && a[1] === b[1];

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

// ---------------------------------------------------------------------------
// Local drawing helpers (prefixed RP_; road-kit stays untouched).

/** Keeps a moved grid or design on the road: Plane doesn't clip. */
function RP_Clip({ f, children }: { f: Frame; children: ReactNode }) {
  // useId repeats across a `shot` page, so the frame's size is in the id too.
  const id = `${useId().replace(/:/g, "")}c${f.W}x${f.H}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

/** The road as a Plane: asphalt, then everything clipped to it. */
function RP_Road({ f, label, drag, onKey, max = "max-w-[16rem]", children }: { f: Frame; label: string; drag?: Drag; onKey?: (e: KeyboardEvent<SVGSVGElement>) => void; max?: string; children: ReactNode }) {
  return (
    <div className={`mx-auto w-full ${max}`}>
      <Plane f={f} label={label} paper={false} grid={0} axes={false} drag={drag} onKey={onKey} className="my-0! max-w-none">
        <RoadBed f={f} />
        <RP_Clip f={f}>{children}</RP_Clip>
      </Plane>
    </div>
  );
}

/** A straight arrow in fixed ink, for the road and the paper. */
function RP_Arrow({ f, from, to, c, w = 2.4, dashed = false, op = 1 }: { f: Frame; from: XY; to: XY; c: string; w?: number; dashed?: boolean; op?: number }) {
  const x1 = f.sx(from[0]);
  const y1 = f.sy(from[1]);
  const x2 = f.sx(to[0]);
  const y2 = f.sy(to[1]);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const h = Math.min(6 + w * 1.4, len * 0.5);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const half = h * 0.5;
  return (
    <Lit a={[x1, y1]} b={[x2, y2]} list={listOf(from, to)} w={w} color={c}>
      <g opacity={op} className="pointer-events-none">
        <path d={`M${x1} ${y1}L${bx} ${by}`} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? "4 3" : undefined} fill="none" />
        <path d={`M${x2} ${y2}L${bx - uy * half} ${by + ux * half}L${bx + uy * half} ${by - ux * half}Z`} fill={c} />
      </g>
    </Lit>
  );
}

/** The recipe walked as a chain: `a` steps of rope 1, then `b` of rope 2; only the first `upto` steps drawn. */
function RP_Chain({ f, cols, a, b, upto = 99, w = 2.2 }: { f: Frame; cols: Cols; a: number; b: number; upto?: number; w?: number }) {
  const out: ReactNode[] = [];
  let at: XY = [0, 0];
  const steps: [XY, string][] = [...Array.from({ length: Math.abs(a) }, (): [XY, string] => [[Math.sign(a) * cols[0][0], Math.sign(a) * cols[0][1]], E1C]), ...Array.from({ length: Math.abs(b) }, (): [XY, string] => [[Math.sign(b) * cols[1][0], Math.sign(b) * cols[1][1]], E2C])];
  steps.slice(0, upto).forEach(([d, c], i) => {
    const to: XY = [at[0] + d[0], at[1] + d[1]];
    out.push(
      <g key={i} className={POP}>
        <RP_Arrow f={f} from={at} to={to} c={c} w={w} />
      </g>,
    );
    at = to;
  });
  return <>{out}</>;
}

/** A chalk cross on the road at a paper point. */
function RP_X({ f, at, c = CHALK, s = 4 }: { f: Frame; at: XY; c?: string; s?: number }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return <path d={`M${x - s} ${y - s}l${2 * s} ${2 * s}m0 ${-2 * s}l${-2 * s} ${2 * s}`} stroke={c} strokeWidth={1.8} strokeLinecap="round" className="pointer-events-none" />;
}

/** One petal (0…4, left to right) carried by a move. */
function RP_Petal({ f, i, move, faint = false }: { f: Frame; i: number; move: Move; faint?: boolean }) {
  return <path d={pathOf(f, move, PETALS[i], true)} fill={AFTER} fillOpacity={faint ? 0.3 : 0.85} stroke={CHALK} strokeWidth={1.1} strokeLinejoin="round" className="pointer-events-none" />;
}

/** A label on the road, white with a dark halo so it reads on the asphalt. */
function RP_Tag({ x, y, text, c = CHALK, anchor = "start", size = 8 }: { x: number; y: number; text: string; c?: string; anchor?: "start" | "middle" | "end"; size?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={700} fontFamily={/[ঀ-৿]/.test(text) ? undefined : MONO} fill={c} stroke="#374151" strokeWidth={2.4} paintOrder="stroke" className="pointer-events-none">
      {text}
    </text>
  );
}

/** The art sir's graph paper: grid, lotus, the two short paper ropes, and one petal tip ringed. */
function RP_PaperDraw({ f, hi = null, ropes = true, fish = true }: { f: Frame; hi?: number | null; ropes?: boolean; fish?: boolean }) {
  let lines = "";
  for (let x = Math.ceil(f.x0); x <= f.x1; x++) lines += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  for (let y = Math.ceil(f.y0); y <= f.y1; y++) lines += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  return (
    <g className="pointer-events-none">
      <rect x={0} y={0} width={f.W} height={f.H} rx={4} fill="white" stroke="#cbd5e1" />
      <path d={lines} stroke="#93c5fd" strokeOpacity={0.5} strokeWidth={0.6} />
      <Alpana f={f} move={RP_ID} fish={fish} />
      {ropes && (
        <>
          <RP_Arrow f={f} from={[0, 0]} to={[1, 0]} c={E1C} w={2} />
          <RP_Arrow f={f} from={[0, 0]} to={[0, 1]} c={E2C} w={2} />
        </>
      )}
      <rect x={f.sx(0) - 3.5} y={f.sy(0) - 3.5} width={7} height={7} rx={1} fill="#b91c1c" />
      {hi !== null && <circle cx={f.sx(LOTUS_TIPS[hi][0])} cy={f.sy(LOTUS_TIPS[hi][1])} r={4.5} fill="none" stroke={INK} strokeWidth={1.4} />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1 · The bet. The paper (five petals, two short ropes) beside the road (two
//     long ropes, two chalk crosses, nothing else). Three answers, each a small
//     picture; the reader seals one. The pick is acted out on the road and
//     left on a "?": Nasib's is five sirs, one per petal; Karim's is three
//     more crosses; Rina's is the paper's petals sent to the two crosses.
//     Unmarked; the last screen settles it.

const TB_OPTS: [string, string][] = [
  ["প্রত্যেক পাপড়ির জন্য স্যার লাগবে.", "নাসিব"],
  ["আরো কয়েকটা দাগ দিয়ে গেলে হতো.", "করিম"],
  ["দুই দড়িই যথেষ্ট.", "রিনা"],
];
const TB_PAPER = makeFrame(-0.6, 6.4, -0.6, 5.6, 14, 4);
const TB_ROAD = makeFrame(-1, 7, -1, 6, 17, 4);
/** Karim's extra marks: anywhere off the ropes (not petal tips on the road) */
const TB_MORE: XY[] = [
  [4, 1.6],
  [2, 4.5],
  [5.8, 5],
];
/** where each bet's "?" sits on the road */
const TB_Q: XY[] = [
  [3.4, 3],
  [4.2, 3.4],
  [4.6, 3.2],
];

/** the art sir, small, from above the kerb: white cap, beard, kurta */
function TB_Sir({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-6 16q0 -11 6 -11q6 0 6 11Z" fill="#e2e8f0" stroke={INK} strokeWidth={0.8} />
      <circle cx={0} cy={0} r={4.6} fill="#f5d0a9" stroke={INK} strokeWidth={0.8} />
      <path d="M-4.6 -1.2q4.6 -5.4 9.2 0Z" fill="white" stroke={INK} strokeWidth={0.6} />
      <path d="M-3.2 2q3.2 5.6 6.4 0" fill="white" stroke={INK} strokeWidth={0.6} />
    </g>
  );
}

/** the three bets as pictures, 44 × 30 */
function TB_Icon({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 44 30" aria-hidden="true" className="h-auto w-11 shrink-0">
      <rect x={0} y={0} width={44} height={30} rx={4} fill="#6b7280" />
      {i === 0 && [6, 16, 26, 36].map((x) => <TB_Sir key={x} x={x} y={10} s={0.7} />)}
      {i !== 0 && (
        <>
          <path d="M6 24L20 17" stroke={E1C} strokeWidth={1.8} strokeLinecap="round" />
          <path d="M6 24L13 10" stroke={E2C} strokeWidth={1.8} strokeLinecap="round" />
          <rect x={3} y={21} width={6} height={6} rx={1} fill="#b91c1c" />
        </>
      )}
      {i === 1 &&
        ([
          [30, 8],
          [36, 20],
          [26, 24],
        ] as const).map(([x, y]) => <path key={x} d={`M${x - 2.5} ${y - 2.5}l5 5m0 -5l-5 5`} stroke={CHALK} strokeWidth={1.4} strokeLinecap="round" />)}
      {i === 2 && (
        <>
          <circle cx={20} cy={17} r={4} fill="#fde047" opacity={0.5} />
          <circle cx={13} cy={10} r={4} fill="#fde047" opacity={0.5} />
          {[-150, -120, -90, -60, -30].map((a) => {
            const r = (a * Math.PI) / 180;
            return <path key={a} d={`M34 25L${34 + Math.cos(r) * 4 - Math.sin(r) * 2} ${25 + Math.sin(r) * 4 + Math.cos(r) * 2}L${34 + Math.cos(r) * 10} ${25 + Math.sin(r) * 10}L${34 + Math.cos(r) * 4 + Math.sin(r) * 2} ${25 + Math.sin(r) * 4 - Math.cos(r) * 2}Z`} fill={AFTER} />;
          })}
        </>
      )}
    </svg>
  );
}

export function TwoRopesBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const act = usePlay(650);
  const seal = (i: number) => {
    setBet(i);
    act.play(3, () => pass("বাজি সিল হলো. স্যার ফেরার আগে পাঁচটা পাপড়ি."));
  };
  // beats of the acted bet: 1 the claim drawn, 2 its "?", 3 sealed
  const k = bet === null ? 0 : act.running ? act.k : 3;
  const W = TB_PAPER.W + 10 + TB_ROAD.W;
  const py = (TB_ROAD.H - TB_PAPER.H) / 2;
  const rx = TB_PAPER.W + 10;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${TB_ROAD.H}`} role="img" aria-label="বামে স্যারের কাগজে পাঁচ পাপড়ির পদ্ম আর দুইটা ছোট দড়ি; ডানে রাস্তায় খুঁটি থেকে দুইটা দড়ি, মাথায় দুইটা chalk এর ক্রস" className="mx-auto block h-auto w-full max-w-[20rem]">
        <svg x={0} y={py} width={TB_PAPER.W} height={TB_PAPER.H} viewBox={`0 0 ${TB_PAPER.W} ${TB_PAPER.H}`}>
          <RP_PaperDraw f={TB_PAPER} />
        </svg>
        <svg x={rx} y={0} width={TB_ROAD.W} height={TB_ROAD.H} viewBox={`0 0 ${TB_ROAD.W} ${TB_ROAD.H}`}>
          <RoadBed f={TB_ROAD} />
          {bet === 2 && k >= 1 && (
            <g className={FADE}>
              <circle cx={TB_ROAD.sx(2)} cy={TB_ROAD.sy(1)} r={10} fill="#fde047" opacity={0.4} />
              <circle cx={TB_ROAD.sx(1)} cy={TB_ROAD.sy(2)} r={10} fill="#fde047" opacity={0.4} />
            </g>
          )}
          <Rope f={TB_ROAD} to={[2, 1]} which={1} label="(2, 1)" />
          <Rope f={TB_ROAD} to={[1, 2]} which={2} label="(1, 2)" />
          <Pillar f={TB_ROAD} />
          {bet === 0 && k >= 1 && [0, 1, 2, 3, 4].map((j) => (
            <g key={j} className={POP} style={{ transitionDelay: `${j * 110}ms` }}>
              <TB_Sir x={TB_ROAD.sx(0.6 + j * 1.2)} y={TB_ROAD.sy(5.2)} />
            </g>
          ))}
          {bet === 1 && k >= 1 && TB_MORE.map((p, j) => (
            <g key={j} className={POP} style={{ transitionDelay: `${j * 160}ms` }}>
              <RP_X f={TB_ROAD} at={p} s={4.5} />
            </g>
          ))}
          {k >= 2 && (
            <text x={TB_ROAD.sx(TB_Q[bet ?? 0][0])} y={TB_ROAD.sy(TB_Q[bet ?? 0][1])} textAnchor="middle" fontSize={26} fontWeight={800} fill={CHALK} stroke="#374151" strokeWidth={2} paintOrder="stroke" className={POP}>
              ?
            </text>
          )}
        </svg>
        {bet === 2 && k >= 1 &&
          LOTUS_TIPS.map((t, j) => (
            <Draw key={j} d={`M${TB_PAPER.sx(t[0])} ${py + TB_PAPER.sy(t[1])}L${rx + TB_ROAD.sx(TB_Q[2][0]) - 6} ${TB_ROAD.sy(TB_Q[2][1]) - 8}`} delay={j * 90} ms={700} strokeWidth={1} className="stroke-[#f472b6]/70" />
          ))}
      </svg>
      <div className="mt-1 text-center text-sm text-muted">কাগজে দড়ি এক ঘর করে. রাস্তায় স্যার টেনে নিয়েছেন নতুন জায়গায়.</div>
      <div className="mt-3 grid gap-2">
        {TB_OPTS.map(([t, who], i) => (
          <Choice key={t} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            <span className="flex items-center gap-2.5">
              {bet === null && <TB_Icon i={i} />}
              <span>
                {t} <span className="text-muted">— {who}</span>
              </span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={bet !== null && k >= 3}>স্যার ফেরার আগে পাঁচটা পাপড়ি রাস্তায় বসানো যাবে? একটার উপরে বাজি ধরুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · By eye. The road with only the two rope marks. The reader taps where the
//     petal (2, 3) should go; then the three friends' spots pop in, one by one,
//     all different. Nothing says which is right.

const GE_F = makeFrame(-1, 9, -1, 9, 20, 8);
const GE_FRIENDS: [string, XY][] = [
  ["নাসিব", [2, 3]],
  ["করিম", [4, 6.5]],
  ["সোম", [6.5, 5]],
];
const GE_TONE = ["#fca5a5", "#67e8f9", "#fcd34d"];

export function GuessByEye() {
  const pass = useGate();
  const [mine, setMine] = useSeed<XY | null>("mine", null);
  // after the reader's mark, the three friends put theirs down one by one
  const walk = usePlay(550);
  const drop = (p: XY) => {
    if (mine) return;
    const q: XY = [clamp(Math.round(p[0] * 2) / 2, GE_F.x0, GE_F.x1), clamp(Math.round(p[1] * 2) / 2, GE_F.y0, GE_F.y1)];
    setMine(q);
    walk.play(3, () => pass("চোখে মেপে সবাই আলাদা জায়গা বলে."));
  };
  const shown = walk.running ? walk.k : 3;
  return (
    <>
      <div className="mb-2 text-center text-sm">
        কাগজের পাপড়ি <span className="font-mono font-semibold">(2, 3)</span>. রাস্তায় এর মাথা কোথায়?
      </div>
      <RP_Road f={GE_F} label="রাস্তা, খুঁটি থেকে দুই দড়ি; পাপড়ির মাথা কোথায় বসবে সেখানে tap করুন" drag={{ down: drop }}>
        <Rope f={GE_F} to={[2, 1]} which={1} />
        <Rope f={GE_F} to={[1, 2]} which={2} />
        <Pillar f={GE_F} />
        {mine &&
          GE_FRIENDS.slice(0, shown).map(([who, at], i) => (
            <g key={who} className={POP}>
              <circle cx={GE_F.sx(at[0])} cy={GE_F.sy(at[1])} r={5} fill={GE_TONE[i]} stroke={INK} strokeWidth={1} />
              <RP_Tag x={GE_F.sx(at[0]) + 7} y={GE_F.sy(at[1]) + 3} text={who} />
            </g>
          ))}
        {mine && (
          <g className={POP}>
            <circle cx={GE_F.sx(mine[0])} cy={GE_F.sy(mine[1])} r={6} fill="white" stroke="#2563eb" strokeWidth={2.2} />
            <RP_Tag x={GE_F.sx(mine[0]) - 8} y={GE_F.sy(mine[1]) + 3} text="আপনি" anchor="end" />
          </g>
        )}
      </RP_Road>
      {mine && shown === 3 && <div className={`mt-2 text-center text-sm ${FADE}`}>চারজন, চার জায়গা. কারটা ঠিক, কেউ জানে না.</div>}
      <Task done={mine !== null && shown === 3}>চোখে মেপে রাস্তায় একটা জায়গা tap করুন. তারপর দেখুন বাকিরা কোথায় রাখলো.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Same recipe. The rope remote: presses of e₁ (2, 1) and e₂ (1, 2), walked
//     as a chain from the pillar. The paper says (2, 3) is e₁ twice and e₂ three
//     times; the same presses on the road land on (7, 8), the petal pops there
//     and the whole grid through the ropes shows.

const SR_F = makeFrame(-1, 9.5, -1, 9.5, 20, 8);

/** The two-button remote, in the ropes' own colours. */
function RP_Remote({ cols, amt, onAmt, max = 3, min = 0, disabled = false }: { cols: Cols; amt: XY; onAmt: (v: XY) => void; max?: number; min?: number; disabled?: boolean }) {
  const rows: [string, string, XY][] = [
    ["হলুদ দড়ি", "text-cat-amber", cols[0]],
    ["সবুজ দড়ি", "text-cat-teal", cols[1]],
  ];
  return (
    <div className="mx-auto mt-2 w-full max-w-[17rem] rounded-2xl border border-border bg-surface px-3 py-1">
      {rows.map(([name, tone, v], i) => (
        <div key={name} className="flex items-center justify-between gap-2 py-0.5">
          <span className="text-sm">
            <b className={tone}>{name}</b> <span className="font-mono">{tup(v)}</span>
          </span>
          <Stepper value={amt[i]} min={min} max={max} disabled={disabled} label={name} onChange={(n) => onAmt(i === 0 ? [n, amt[1]] : [amt[0], n])} />
        </div>
      ))}
    </div>
  );
}

export function SameRecipe() {
  const pass = useGate();
  const [amt, setAmt] = useSeed<XY>("amt", [0, 0]);
  const [hit, setHit] = useSeed("hit", false);
  const land = apply(RP_G, amt);
  const [dx, dy] = useTween(land, 450);
  // the right recipe lands: the petal pops on the dot, then the grid through the ropes shows
  const conf = usePlay(600);
  const set = (v: XY) => {
    setAmt(v);
    if (!hit && eq(v, [2, 3])) {
      setHit(true);
      conf.play(2, () => pass("একই recipe, নতুন উপকরণ: (7, 8)."));
    }
  };
  const beat = conf.running ? conf.k : 2;
  return (
    <>
      <RP_Road f={SR_F} label={`রাস্তায় দড়ি ধরে হাঁটা: হলুদ ${amt[0]} বার, সবুজ ${amt[1]} বার, থামলো ${tup(land)} এ`} max="max-w-[14rem]">
        {hit && beat >= 2 && (
          <g className={FADE}>
            <ChalkGrid f={SR_F} move={RP_MOVE} x0={-1} x1={5} y0={-1} y1={5} />
          </g>
        )}
        {hit && beat >= 1 && (
          <g className={POP}>
            <RP_Petal f={SR_F} i={1} move={RP_MOVE} />
          </g>
        )}
        <Rope f={SR_F} to={[2, 1]} which={1} />
        <Rope f={SR_F} to={[1, 2]} which={2} />
        <RP_Chain f={SR_F} cols={RP_G} a={amt[0]} b={amt[1]} />
        <Pillar f={SR_F} />
        <circle cx={SR_F.sx(dx)} cy={SR_F.sy(dy)} r={4.5} fill="white" stroke={INK} strokeWidth={1.4} />
      </RP_Road>
      <RP_Remote cols={RP_G} amt={amt} onAmt={set} />
      <div className="mt-2 text-center font-mono text-base">
        <span className="text-cat-amber">{amt[0]}</span>·(2, 1) + <span className="text-cat-teal">{amt[1]}</span>·(1, 2) = <b className={hit && eq(amt, [2, 3]) ? "text-accent-text" : ""}>{tup(land)}</b>
      </div>
      <Task done={hit && beat >= 2}>কাগজে (2, 3) মানে হলুদ দড়ি দুইবার, সবুজ তিনবার. রাস্তার দড়িতেও ঠিক ওই কয়টা press দিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Nasib's check: 6.2's 180° turn. Three stages under the picture: pull the
//     two plain ropes to (−1, 0) and (0, −1); walk the same recipe, 2 and 3,
//     and chalk a cross at (−2, −3); then turn the whole road the 6.2 way and
//     watch the petal (2, 3) stop on that cross.

const TC_F = makeFrame(-5.5, 5.5, -5.5, 5.5, 15, 6);
const TC_TURNED: Cols = [
  [-1, 0],
  [0, -1],
];
const TC_BTN = ["দড়ি দুইটা উল্টা দিকে টানুন", "Recipe চালান: হলুদ 2, সবুজ 3", "এবার 6.2 এর মতো পুরা আলপনা ঘুরান"];
const TC_SAY = ["দড়ি এখনো কাগজের মতো: (1, 0) আর (0, 1).", "হলুদ এখন (−1, 0), সবুজ (0, −1).", "2·(−1, 0) + 3·(0, −1) = (−2, −3). ক্রস দেওয়া হলো.", "পুরা আলপনা ঘুরলো. (2, 3) এর পাপড়ি থামলো ঠিক ক্রসে."];

export function TurnCheck() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const walk = usePlay(260);
  const fin = usePlay(1300);
  const [tr] = useTween([stage >= 1 ? 1 : 0], 700);
  const [tt] = useTween([stage >= 3 ? 1 : 0], 1200);
  const ropes = turnCols(180 * tr);
  const turn = byCols(turnCols(180 * tt));
  const shown = walk.running ? walk.k : stage >= 2 ? 5 : 0;
  const next = () => {
    const s = stage + 1;
    setStage(s);
    if (s === 2) walk.play(5);
    if (s === 3) fin.play(1, () => pass("দড়ির হিসাব আর পুরা ঘুরানো: একই জায়গা."));
  };
  const tip = turn(LOTUS_TIPS[1]);
  return (
    <>
      <RP_Road f={TC_F} label="রাস্তায় পদ্ম; দড়ি দুইটা উল্টা দিকে টেনে recipe চালানো, তারপর পুরা আলপনা ঘুরানো" max="max-w-[14rem]">
        <ChalkGrid f={TC_F} move={turn} x0={-6} x1={6} y0={-6} y1={6} />
        <Alpana f={TC_F} move={turn} fish={false} />
        <circle cx={TC_F.sx(tip[0])} cy={TC_F.sy(tip[1])} r={4} fill="none" stroke={INK} strokeWidth={1.6} />
        <Rope f={TC_F} to={ropes[0]} which={1} />
        <Rope f={TC_F} to={ropes[1]} which={2} />
        <RP_Chain f={TC_F} cols={TC_TURNED} a={2} b={3} upto={shown} w={2} />
        {stage >= 2 && shown === 5 && <RP_X f={TC_F} at={[-2, -3]} c="#fde047" s={5} />}
        <Pillar f={TC_F} />
      </RP_Road>
      <div className="mt-2 min-h-[2.5rem] text-center text-sm">{say(TC_SAY, stage)}</div>
      {stage < 3 && (
        <div className="mt-1 flex justify-center">
          <button type="button" className={primaryBtn} disabled={walk.running} onClick={next}>
            {TC_BTN[stage]}
          </button>
        </div>
      )}
      <Ticks
        items={[
          ["দড়ির হিসাব", stage >= 2],
          ["পুরা ঘুরানো", stage >= 3],
        ]}
      />
      <Task done={stage >= 3}>আগে দড়ি দিয়ে হিসাব করুন, তারপর পুরা আলপনা ঘুরান. দুইটা কি এক জায়গায় থামে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Slot by slot. Any petal (g₁, g₂): the reader dials it, the dot glides on
//     the small road, and two lines build the two slots from the ropes'
//     numbers. After three petals, the numbers give way to g₁ and g₂.

const SF_F = makeFrame(-1, 13, -1, 13, 12, 6);

/** One output slot built from the two ropes' numbers: a × p + b × q = out. */
function SF_Row({ slot, a, b, p, q, out }: { slot: string; a: string; b: string; p: number; q: number; out: string }) {
  return (
    <div className="flex items-baseline justify-center gap-1.5 font-mono text-[0.95rem]">
      <span className="w-14 text-right font-sans text-xs text-muted">{slot}</span>
      <span key={`${a}${p}`} className={POP}>
        {a}
      </span>
      ×<b className="text-cat-amber">{p}</b>+
      <span key={`${b}${q}`} className={POP}>
        {b}
      </span>
      ×<b className="text-cat-teal">{q}</b>=
      <b key={out} className={`${POP} min-w-[4.5rem] text-left`}>
        {out}
      </b>
    </div>
  );
}

export function SlotFormula() {
  const pass = useGate();
  const [g, setG] = useSeed<XY>("g", [1, 2]);
  const [tried, setTried] = useSeed<string[]>("tried", ["1,2"]);
  const [letters, setLetters] = useSeed("letters", false);
  const land = apply(RP_G, g);
  const [dx, dy] = useTween(land, 450);
  const dial = (v: XY) => {
    setG(v);
    const key = v.join(",");
    if (!tried.includes(key)) setTried([...tried, key]);
  };
  const three = tried.length >= 3;
  const a = letters ? "g₁" : String(g[0]);
  const b = letters ? "g₂" : String(g[1]);
  return (
    <>
      <RP_Road f={SF_F} label={`কাগজের ${tup(g)} রাস্তায় যায় ${tup(land)} এ`} max="max-w-[11rem]">
        <ChalkGrid f={SF_F} move={RP_MOVE} x0={-1} x1={6} y0={-1} y1={6} />
        <Alpana f={SF_F} move={RP_MOVE} fish={false} faint />
        <Rope f={SF_F} to={[2, 1]} which={1} />
        <Rope f={SF_F} to={[1, 2]} which={2} />
        <Pillar f={SF_F} />
        <circle cx={SF_F.sx(dx)} cy={SF_F.sy(dy)} r={5} fill="white" stroke={INK} strokeWidth={1.6} />
      </RP_Road>
      <div className="mt-2 flex items-center justify-center gap-2 text-sm">
        কাগজের পাপড়ি
        <Stepper value={g[0]} min={0} max={4} label="g₁" disabled={letters} onChange={(n) => dial([n, g[1]])} />
        <Stepper value={g[1]} min={0} max={4} label="g₂" disabled={letters} onChange={(n) => dial([g[0], n])} />
      </div>
      <div className="mt-2 grid gap-1">
        <SF_Row slot="slot 1" a={a} b={b} p={2} q={1} out={letters ? "2g₁ + g₂" : String(land[0])} />
        <SF_Row slot="slot 2" a={a} b={b} p={1} q={2} out={letters ? "g₁ + 2g₂" : String(land[1])} />
      </div>
      {three && !letters && (
        <div className={`mt-2 flex justify-center ${FADE}`}>
          <button
            type="button"
            className={primaryBtn}
            onClick={() => {
              setLetters(true);
              pass("দুই দড়ি থেকেই পুরা formula.");
            }}
          >
            সংখ্যার জায়গায় g₁, g₂ বসান
          </button>
        </div>
      )}
      <Ticks
        items={[
          [`তিনটা পাপড়ি (${Math.min(tried.length, 3)}/3)`, three],
          ["সব পাপড়ির formula", letters],
        ]}
      />
      <Task done={letters}>তিনটা আলাদা পাপড়ি বসিয়ে দেখুন, দুই slot এ কী আসে. তারপর সংখ্যার জায়গায় অক্ষর.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The stubborn arrows. Drag an arrow's tip (whole squares, −1…1) and see it
//     before (white, dashed) and after the move (pink). Most arrows turn; the
//     reader hunts the one that only stretches, (1, 1)'s line, and the one
//     that doesn't move at all, (1, −1)'s.

const SA_F = makeFrame(-3.5, 3.5, -3.5, 3.5, 24, 6);

const saKind = (v: XY): "turn" | "stretch" | "still" => {
  const w = apply(RP_G, v);
  if (eq(w, v)) return "still";
  return v[0] * w[1] - v[1] * w[0] === 0 ? "stretch" : "turn";
};
const SA_VERDICT = { turn: "ঘুরে গেছে.", stretch: "ঘোরে নাই! একই লাইনে, 3 গুণ লম্বা.", still: "একটুও নড়ে নাই." };

export function StubbornArrow() {
  const pass = useGate();
  const [v, setV] = useSeed<XY>("v", [1, 0]);
  const [found, setFound] = useSeed<[boolean, boolean]>("found", [false, false]);
  const w = apply(RP_G, v);
  const [wx, wy] = useTween(w, 500);
  const kind = saKind(v);
  const put = (q: XY) => {
    if (q[0] === 0 && q[1] === 0) return;
    if (eq(q, v)) return;
    setV(q);
    const k = saKind(q);
    const nf: [boolean, boolean] = [found[0] || k === "stretch", found[1] || k === "still"];
    if (nf[0] !== found[0] || nf[1] !== found[1]) {
      setFound(nf);
      if (nf[0] && nf[1]) pass("দুইটা দিক ঘোরে না. একটা শুধু লম্বা হয়, একটা নড়েই না.");
    }
  };
  const at = (p: XY) => put([clamp(Math.round(p[0]), -1, 1), clamp(Math.round(p[1]), -1, 1)]);
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const d: Record<string, XY> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (!d[e.key]) return;
    e.preventDefault();
    put([clamp(v[0] + d[e.key][0], -1, 1), clamp(v[1] + d[e.key][1], -1, 1)]);
  };
  const far = 7;
  return (
    <>
      <RP_Road f={SA_F} label={`arrow ${tup(v)} move এর পরে ${tup(w)}`} drag={{ down: at, move: at }} onKey={key} max="max-w-[14rem]">
        <ChalkGrid f={SA_F} move={RP_MOVE} x0={-3} x1={3} y0={-3} y1={3} ghost />
        {kind !== "turn" && <path d={`M${SA_F.sx(-v[0] * far)} ${SA_F.sy(-v[1] * far)}L${SA_F.sx(v[0] * far)} ${SA_F.sy(v[1] * far)}`} stroke="#fde047" strokeOpacity={0.6} strokeWidth={6} className={FADE} />}
        <RP_Arrow f={SA_F} from={[0, 0]} to={[wx, wy]} c={AFTER} w={2.8} />
        <RP_Arrow f={SA_F} from={[0, 0]} to={v} c={CHALK} w={2.2} dashed />
        <circle cx={SA_F.sx(v[0])} cy={SA_F.sy(v[1])} r={9} fill="white" fillOpacity={0.15} stroke={CHALK} strokeWidth={1.2} />
        <Pillar f={SA_F} />
      </RP_Road>
      <div className="mt-2 text-center text-sm">
        <span className="font-mono">{tup(v)}</span> <span className="text-muted">থেকে</span> <b className="font-mono text-[#db2777]">{tup(w)}</b>.{" "}
        <b key={kind} className={`${POP} ${kind === "turn" ? "text-muted" : "text-accent-text"}`}>
          {SA_VERDICT[kind]}
        </b>
      </div>
      <div className="mt-0.5 text-center text-xs text-muted">সাদা দাগ: move এর আগে. গোলাপি: move এর পরে.</div>
      <Ticks
        items={[
          ["শুধু লম্বা হয়", found[0]],
          ["একটুও নড়ে না", found[1]],
        ]}
      />
      <Task done={found[0] && found[1]}>Arrow এর মাথা টেনে ঘুরান. খুঁজুন কোন arrow move এর পরেও নিজের লাইন ছাড়ে না.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn: all five petals. The road has the grid through the two ropes
//     and nothing else; the reader taps where each petal's tip goes, reading
//     the paper numbers. Every tap is walked out along the ropes from the
//     pillar: the paper square that spot belongs to, yellow so many times,
//     green so many. A right tap's walk ends on the tip and the petal pops; a
//     wrong one ends on the tapped spot, named with its own paper numbers.

const PP_F = makeFrame(-1, 13, -1, 12, 16, 6);

export function PaintThePetals() {
  const pass = useGate();
  const [n, setN] = useSeed("n", 0);
  const [last, setLast] = useSeed<XY | null>("last", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const [walked, setWalked] = useSeed<XY | null>("walked", null);
  const walk = usePlay(170);
  const done = n >= 5;
  const settle = (q: XY, at: number) => {
    if (eq(q, LOTUS_TIPS[at])) {
      setLast(null);
      setN(at + 1);
      if (at + 1 === 5) pass("পাঁচটা পাপড়ি, শুধু দুই দড়ি দিয়ে.");
    } else {
      setLast(q);
      setMiss((m) => m + 1);
    }
  };
  const tap = (p: XY) => {
    if (done || walk.running) return;
    const b = RP_BACK(p);
    const q: XY = [Math.round(b[0]), Math.round(b[1])];
    setLast(null);
    setWalked(q);
    const steps = Math.abs(q[0]) + Math.abs(q[1]);
    if (steps === 0) settle(q, n);
    else walk.play(steps, () => settle(q, n));
  };
  const upto = walk.running ? walk.k : 99;
  const wrongAt = last && !walk.running ? RP_MOVE(last) : null;
  return (
    <>
      <div className="mb-2 flex justify-center gap-1.5">
        {LOTUS_TIPS.map((t, i) => (
          <span
            key={i}
            className={`rounded-lg border-2 px-1.5 py-0.5 font-mono text-xs font-semibold transition-colors motion-reduce:transition-none ${
              i < n ? "border-accent bg-accent/15 text-accent-text" : i === n ? "border-cat-blue bg-cat-blue/10" : "border-border text-muted"
            }`}
          >
            {tup(t)}
          </span>
        ))}
      </div>
      <RP_Road f={PP_F} label={done ? "পাঁচটা পাপড়িই রাস্তায়" : `কাগজের ${tup(LOTUS_TIPS[n])} পাপড়ির মাথা রাস্তায় কোথায়, tap করুন`} drag={{ down: tap }} max="max-w-[17rem]">
        <ChalkGrid f={PP_F} move={RP_MOVE} />
        {LOTUS_TIPS.slice(0, n).map((t, i) => (
          <g key={i} className={POP}>
            <RP_Petal f={PP_F} i={i} move={RP_MOVE} />
          </g>
        ))}
        {n > 0 && <circle cx={PP_F.sx(7)} cy={PP_F.sy(5)} r={2.6} fill="#fde047" stroke={CHALK} />}
        <Rope f={PP_F} to={[2, 1]} which={1} />
        <Rope f={PP_F} to={[1, 2]} which={2} />
        {walked && !done && (walk.running || last) && <RP_Chain key={walked.join(",")} f={PP_F} cols={RP_G} a={walked[0]} b={walked[1]} upto={upto} w={2} />}
        <Pillar f={PP_F} />
        {wrongAt && last && !done && (
          <g key={miss} className={POP}>
            <circle cx={PP_F.sx(wrongAt[0])} cy={PP_F.sy(wrongAt[1])} r={5.5} fill={BAD} stroke="white" strokeWidth={1.4} />
            <RP_Tag x={PP_F.sx(wrongAt[0]) + (wrongAt[0] > 9 ? -8 : 8)} y={PP_F.sy(wrongAt[1]) + 3} text={`কাগজের ${tup(last)}`} anchor={wrongAt[0] > 9 ? "end" : "start"} />
          </g>
        )}
      </RP_Road>
      <div className="mt-2 text-center text-sm">
        {done ? (
          <b className={`${POP} text-accent-text`}>পদ্মটা রাস্তায়. পাঁচটা পাপড়িই.</b>
        ) : (
          <>
            এখন: কাগজের পাপড়ি <b className="font-mono">{tup(LOTUS_TIPS[n])}</b>
          </>
        )}
      </div>
      {last && !done && !walk.running && (
        <Nope key={miss}>
          ওই জায়গাটা কাগজের {tup(last)} থেকে আসে. দরকার {tup(LOTUS_TIPS[n])}: হলুদ দড়ি {LOTUS_TIPS[n][0]} বার, সবুজ {LOTUS_TIPS[n][1]} বার.
        </Nope>
      )}
      <Task done={done}>পাঁচটা পাপড়ির মাথা রাস্তায় tap করে বসান. কাগজের সংখ্যা দেখে, শুধু দুই দড়ি ধরে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it (Check Q2): Karim's ropes, e₁ → (0, 3), e₂ → (−2, 0). The reader
//     taps where the paper's (1, 1) lands. A wrong tap walks the recipe from
//     the pillar and draws the gap to where it really ends.

const TN_F = makeFrame(-3.5, 3.5, -1.5, 4.5, 26, 6);
const TN_COLS: Cols = [
  [0, 3],
  [-2, 0],
];
const TN_RIGHT: XY = [-2, 3];

export function TryNewRopes() {
  const pass = useGate();
  const [pick, setPick] = useSeed<XY | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const walk = usePlay(450);
  const right = pick !== null && eq(pick, TN_RIGHT);
  const tap = (p: XY) => {
    if (right || walk.running) return;
    const q: XY = [clamp(Math.round(p[0]), -3, 3), clamp(Math.round(p[1]), -1, 4)];
    setPick(q);
    // every tap walks the recipe, yellow once, green once; a right one lands on the mark
    if (eq(q, TN_RIGHT)) walk.play(2, () => pass("(1, 1) গেলো (−2, 3) এ."));
    else {
      setMiss(miss + 1);
      walk.play(2);
    }
  };
  const shown = walk.running ? walk.k : 2;
  const dots: XY[] = [];
  for (let x = -3; x <= 3; x++) for (let y = -1; y <= 4; y++) dots.push([x, y]);
  return (
    <>
      <div className="mb-1 text-center text-sm">
        করিমের দড়ি: হলুদ <span className="font-mono">(0, 3)</span>, সবুজ <span className="font-mono">(−2, 0)</span>. কাগজের <b className="font-mono">(1, 1)</b> কোথায় যাবে?
      </div>
      <RP_Road f={TN_F} label="করিমের দুই দড়ি; কাগজের (1, 1) রাস্তায় কোথায় যাবে সেখানে tap করুন" drag={{ down: tap }} max="max-w-[15rem]">
        {dots.map(([x, y]) => (
          <circle key={`${x},${y}`} cx={TN_F.sx(x)} cy={TN_F.sy(y)} r={1.6} fill={CHALK} opacity={0.45} />
        ))}
        <Rope f={TN_F} to={TN_COLS[0]} which={1} label="(0, 3)" />
        <Rope f={TN_F} to={TN_COLS[1]} which={2} />
        <RP_Tag x={TN_F.sx(-2)} y={TN_F.sy(0) + 17} text="(−2, 0)" c={E2C} anchor="middle" />
        <Pillar f={TN_F} />
        {pick && !right && (
          <g key={miss}>
            <RP_Chain f={TN_F} cols={TN_COLS} a={1} b={1} upto={shown} w={2.6} />
            {shown === 2 && <path d={`M${TN_F.sx(pick[0])} ${TN_F.sy(pick[1])}L${TN_F.sx(-2)} ${TN_F.sy(3)}`} stroke={BAD} strokeWidth={1.6} strokeDasharray="3 3" className={FADE} />}
            <circle cx={TN_F.sx(pick[0])} cy={TN_F.sy(pick[1])} r={6} fill={BAD} stroke="white" strokeWidth={1.4} className={POP} />
          </g>
        )}
        {right && (
          <g>
            <circle cx={TN_F.sx(-2)} cy={TN_F.sy(3)} r={6} fill="white" fillOpacity={0.25} stroke={CHALK} strokeWidth={1.4} />
            <RP_Chain f={TN_F} cols={TN_COLS} a={1} b={1} upto={shown} w={2.6} />
            {!walk.running && <circle cx={TN_F.sx(-2)} cy={TN_F.sy(3)} r={7} fill={OK} stroke="white" strokeWidth={1.6} className={POP} />}
          </g>
        )}
      </RP_Road>
      {pick && !right && !walk.running && (
        <Nope key={miss}>
          আপনার দাগ <span className="font-mono">{tup(pick)}</span> এ. দড়ি ধরে হাঁটলে: হলুদ একবার, তারপর সবুজ একবার. কোথায় থামলো দেখুন.
        </Nope>
      )}
      {right && !walk.running && <div className={`mt-2 text-center text-sm font-semibold text-accent-text ${FADE}`}>হলুদ একবার (0, 3), সবুজ একবার (−2, 0). থামলো (−2, 3) এ.</div>}
      <Task done={right && !walk.running}>কাগজের (1, 1) করিমের দড়িতে কোথায় যায়? রাস্তায় tap করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. Watch-only, driven by the reader (useScene). The road in front
// of the gate at dusk: the red pillar on the left, the road a grey band, the
// ropes lying on it. The art sir borrows Nana's look; his name is drawn.

const S_ROAD = 118;

function S_Road() {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={S_ROAD} width={320} height={180 - S_ROAD} fill="#6b7280" />
      <rect x={0} y={S_ROAD} width={320} height={3} fill="#9ca3af" />
    </g>
  );
}

function S_Pillar({ x = 26 }: { x?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={52} width={14} height={80} fill="#b91c1c" />
      <rect x={x - 5} y={46} width={24} height={8} fill="#7f1d1d" />
    </g>
  );
}

function S_Name({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
      {text}
    </text>
  );
}

/** a rope lying on the road from the pillar's foot */
function S_Rope({ to, c, from = [33, 132] }: { to: [number, number]; c: string; from?: [number, number] }) {
  return <Draw d={`M${from[0]} ${from[1]}L${to[0]} ${to[1]}`} strokeWidth={2.2} ms={700} className={c === E1C ? "stroke-[#f59e0b]" : "stroke-[#2dd4bf]"} />;
}

function S_Cross({ x, y, c = CHALK }: { x: number; y: number; c?: string }) {
  return <path d={`M${x - 4} ${y - 4}l8 8m0 -8l-8 8`} stroke={c} strokeWidth={1.8} strokeLinecap="round" className={POP} />;
}

/** the art sir's graph paper with a small lotus, held up */
function S_Paper({ x, y }: { x: number; y: number }) {
  return (
    <g className={POP}>
      <rect x={x} y={y} width={24} height={20} fill="white" stroke="#0284c7" strokeOpacity={0.6} />
      <path d={`M${x + 4} ${y + 15}q2 -8 6 -9q4 1 6 9q-4 -3 -6 -3q-2 0 -6 3Z`} fill={AFTER} />
    </g>
  );
}

/** a hurricane lantern, lit, top at (x, y) */
function S_Lantern({ x, y }: { x: number; y: number }) {
  return (
    <g className={POP}>
      <circle cx={x} cy={y + 9} r={16} fill="#fde047" opacity={0.3} />
      <path d={`M${x - 4} ${y}q4 -5 8 0`} fill="none" stroke="#44403c" strokeWidth={1.2} />
      <rect x={x - 4} y={y + 2} width={8} height={12} rx={3} fill="#fef08a" stroke="#44403c" strokeWidth={1} />
      <rect x={x - 5} y={y + 14} width={10} height={3} fill="#44403c" />
    </g>
  );
}

/** the lotus chalked on the road, seen low: five petals fanning from (x, y) */
function S_Lotus({ x, y, n = 5 }: { x: number; y: number; n?: number }) {
  const ang = [-150, -120, -90, -60, -30];
  return (
    <g className="pointer-events-none">
      {ang.slice(0, n).map((a, i) => {
        const r = (a * Math.PI) / 180;
        const tx = x + Math.cos(r) * 26;
        const ty = y + Math.sin(r) * 13;
        const nx = -Math.sin(r) * 5;
        const ny = Math.cos(r) * 2.5;
        const mx = x + Math.cos(r) * 12;
        const my = y + Math.sin(r) * 6;
        return <path key={i} d={`M${x} ${y}L${mx + nx} ${my + ny}L${tx} ${ty}L${mx - nx} ${my - ny}Z`} fill={AFTER} fillOpacity={0.9} stroke={CHALK} strokeWidth={0.8} className={POP} />;
      })}
      <circle cx={x} cy={y} r={2.5} fill="#fde047" />
    </g>
  );
}

// 1a · The ropes. The art sir at the pillar with two ropes; he pulls them
//      out along the road; Rina chalks a cross at each end; he says his line;
//      the আজান, and he walks off; Nasib's line. Whether two marks are enough
//      is the widget's bet.

export function RopesTied({}: Story) {
  const s = useScene(5, [600, 1600, 1600, 2800, 2800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S_ROAD} label="সন্ধ্যা, গেটের সামনের রাস্তা; আর্ট স্যার খুঁটি থেকে দুইটা দড়ি টেনে নিলেন, রিনা দুই মাথায় chalk এর ক্রস দিলো; স্যার বললেন দুই দড়ির মাথা কই গেলো হেইডা জানলেই সব জানা হইলো, তারপর মাগরিবে চলে গেলেন; নাসিব বললো প্রত্যেক পাপড়ির জন্য স্যার লাগবে">
        <S_Road />
        <S_Pillar />
        {k >= 1 && (
          <>
            <S_Rope to={[128, 150]} c={E1C} />
            <S_Rope to={[92, 170]} c={E2C} />
          </>
        )}
        {k >= 2 && (
          <>
            <S_Cross x={128} y={150} />
            <S_Cross x={92} y={170} />
          </>
        )}
        <Person who="nana" x={k >= 4 ? 350 : 70} y={142} facing={k >= 4 ? 1 : 1} walking={k === 4} arm={k === 1 ? "hold" : k === 3 ? "point" : "down"} ms={1800} />
        {k < 4 && <S_Name x={70} y={142} text="আর্ট স্যার" />}
        <Person who="rina" x={k >= 2 ? 150 : 180} y={142} facing={-1} walking={k === 2} label arm={k >= 4 ? "hold" : k >= 2 ? "point" : "hold"} />
        {k >= 4 && <S_Paper x={128} y={96} />}
        <Person who="nasib" x={248} y={142} facing={-1} label mood={k >= 4 ? "smug" : "plain"} arm={k >= 4 ? "point" : "down"} />
        <Robot x={290} y={142} />
        {k === 3 && <Bubble x={70} y={76} side="right" lines={["দুই দড়ির মাথা কই গেলো,", "হেইডা জানলেই", "সব জানা হইলো."]} />}
        {k >= 4 && <Bubble x={248} y={76} side="left" lines={["প্রত্যেক পাপড়ির জন্য", "স্যার লাগবে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · By eye. Rina reads the petal off the paper; Nasib steps onto the road
//      and puts his foot down; Karim and Som each put theirs somewhere else.

export function EyeGuesses({}: Story) {
  const s = useScene(3, [600, 1800, 2000, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S_ROAD} label="রিনা কাগজ থেকে পড়লো দুই তিন; নাসিব রাস্তায় এক জায়গায় পা রাখলো, করিম আর সোম আরো দুই জায়গায়">
        <S_Road />
        <S_Pillar />
        <S_Rope to={[128, 150]} c={E1C} />
        <S_Rope to={[92, 170]} c={E2C} />
        <Person who="rina" x={62} y={142} label arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && <S_Paper x={66} y={96} />}
        {k === 1 && <Bubble x={62} y={76} side="right" lines={["মাঝের পাশেরটা.", "(2, 3)."]} />}
        <Person who="nasib" x={k >= 2 ? 150 : 200} y={k >= 2 ? 162 : 142} walking={k === 2} label facing={-1} />
        {k >= 2 && <S_Cross x={166} y={158} c="#fca5a5" />}
        {k === 2 && <Bubble x={150} y={96} side="left" lines={["এইখানে."]} />}
        <Person who="karim" x={k >= 3 ? 205 : 250} y={k >= 3 ? 168 : 142} walking={k === 3} label facing={-1} />
        <Person who="som" x={k >= 3 ? 250 : 296} y={k >= 3 ? 156 : 142} walking={k === 3} label facing={-1} />
        {k >= 3 && (
          <>
            <S_Cross x={221} y={164} c="#67e8f9" />
            <S_Cross x={266} y={152} c="#fcd34d" />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Som picks up the yellow rope's end; Shiku carries the chalk to the
//      pillar. Where the walk ends is the widget's.

export function SomRope({}: Story) {
  const s = useScene(2, [600, 1800, 2800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S_ROAD} label="সোম হলুদ দড়ির মাথা তুলে নিলো; বললো কাগজে যে recipe রাস্তাতেও সেইটা, শুধু দড়ি বদলেছে; Shiku chalk নিয়ে খুঁটির পাশে দাঁড়ালো">
        <S_Road />
        <S_Pillar />
        <S_Rope to={[128, 150]} c={E1C} />
        <S_Rope to={[92, 170]} c={E2C} />
        <S_Cross x={128} y={150} />
        <S_Cross x={92} y={170} />
        <Person who="som" x={k >= 1 ? 134 : 210} y={142} facing={-1} walking={k === 1} label arm={k >= 1 ? "hold" : "down"} />
        <Robot x={k >= 1 ? 70 : 300} y={146} walking={k === 1} ms={1600} />
        {k >= 1 && <rect x={76} y={112} width={3} height={9} rx={1} fill={CHALK} className={POP} />}
        {k >= 2 && <Bubble x={134} y={76} lines={["কাগজে যে recipe,", "রাস্তাতেও সেইটা.", "দড়ি শুধু বদলেছে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Nasib's objection. He holds up yesterday's turned drawing and asks for
//      the check.

export function NasibTurn({}: Story) {
  const s = useScene(2, [600, 1800, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S_ROAD} label="নাসিব বললো এটা বানানো হিসাব; কালকের উল্টা ঘুরানো ছবিটা তুলে ধরে বললো ওইটা দিয়ে মিলাও">
        <S_Road />
        <S_Pillar />
        <Person who="som" x={100} y={142} label />
        <Person who="nasib" x={200} y={142} facing={-1} label arm={k >= 2 ? "hold" : "down"} mood={k >= 1 ? "puzzled" : "plain"} />
        {k >= 1 && k < 2 && <Bubble x={200} y={76} side="left" lines={["এটা তো", "বানানো হিসাব."]} />}
        {k >= 2 && (
          <>
            <Card x={210} y={104} text="180°" tone="coral" />
            <Bubble x={200} y={76} side="left" lines={["কালকের ঘুরানোটা", "দিয়ে মিলাও."]} />
          </>
        )}
        <Person who="samin" x={270} y={142} facing={-1} label />
      </Stage>
    </StoryFrame>
  );
}

// 5a · Rina counts five petals on her fingers; Samin opens his khata and
//      writes two empty slots.

export function SaminSlots({}: Story) {
  const s = useScene(2, [600, 2000, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S_ROAD} label="রিনা পাপড়ি গুনলো, পাঁচটা; সামিন খাতা খুলে বললো হাঁটার দরকার নাই, একবার লিখে ফেললেই হয়">
        <S_Road />
        <S_Pillar />
        <Person who="rina" x={90} y={142} label arm={k >= 1 ? "wave" : "hold"} />
        {k === 1 && <Bubble x={90} y={76} side="right" lines={["পাঁচটা পাপড়ি.", "পাঁচবার হাঁটা?"]} />}
        <Person who="samin" x={220} y={142} facing={-1} label arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && (
          <>
            <Card x={236} y={104} text="( ? , ? )" tone="blue" />
            <Bubble x={220} y={76} side="left" lines={["হাঁটা লাগবে না.", "একবার লিখে ফেলি."]} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Fahim chalks an arrow from the pillar with a stick, runs it through
//      the move: it turns. Another: it turns too. His question.

export function FahimArrow({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S_ROAD} label="ফাহিম কঞ্চি দিয়ে খুঁটি থেকে একটা তীর আঁকলো; move এর পরে তীরটা ঘুরে গেলো; আরেকটা আঁকলো, সেটাও ঘুরলো; ফাহিম জিজ্ঞেস করলো সব তীরই কি ঘোরে">
        <S_Road />
        <S_Pillar />
        {k >= 1 && (
          <g>
            <Draw d="M40 140L120 140" strokeWidth={2} ms={600} className="stroke-white" />
            <Draw d="M40 140L150 160" strokeWidth={2.4} ms={600} delay={500} className="stroke-[#f472b6]" />
          </g>
        )}
        {k >= 2 && (
          <g>
            <Draw d="M40 140L70 172" strokeWidth={2} ms={600} className="stroke-white" />
            <Draw d="M40 140L128 176" strokeWidth={2.4} ms={600} delay={500} className="stroke-[#f472b6]" />
          </g>
        )}
        <Person who="fahim" x={200} y={142} facing={-1} label arm={k >= 1 && k < 3 ? "point" : "down"} mood={k >= 3 ? "puzzled" : "plain"} />
        {k >= 3 && <Bubble x={200} y={76} side="left" lines={["সব তীরই", "কি ঘোরে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · Your turn. People coming out of the mosque down the road; Rina reads
//      the first petal; Shiku waits with the chalk.

export function MosqueOut({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S_ROAD} label="রাস্তার শেষ মাথায় মসজিদ থেকে লোক বের হচ্ছে; রিনা কাগজ থেকে প্রথম পাপড়ি পড়লো, এক দুই; Shiku chalk হাতে দাঁড়িয়ে">
        <S_Road />
        <S_Pillar />
        <g className="pointer-events-none">
          <rect x={250} y={80} width={50} height={38} fill="#f1f5f9" />
          <path d="M256 80q19 -30 38 0Z" fill="#e2e8f0" />
          <rect x={270} y={96} width={10} height={22} fill="#94a3b8" />
          <path d="M306 118V56" stroke="#e2e8f0" strokeWidth={4} />
        </g>
        {k >= 1 &&
          [230, 244, 216].map((x, i) => (
            <g key={x} className={FADE} style={{ transitionDelay: `${i * 300}ms` }}>
              <circle cx={x} cy={100} r={3.2} fill="#f8fafc" />
              <rect x={x - 3.5} y={103} width={7} height={15} rx={2} fill="#f8fafc" />
            </g>
          ))}
        <Person who="rina" x={80} y={142} label arm="hold" />
        <S_Paper x={84} y={96} />
        {k >= 2 && <Bubble x={80} y={76} side="right" lines={["প্রথমটা (1, 2)."]} />}
        <Robot x={140} y={148} />
        <rect x={146} y={116} width={3} height={9} rx={1} fill={CHALK} />
      </Stage>
    </StoryFrame>
  );
}

// 8a · Karim's own ropes at the other pillar: one pulled straight across,
//      three squares; one backwards along the road, two. His question.

export function KarimRopes({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S_ROAD} label="করিম পাশের খুঁটিতে দুইটা দড়ি বাঁধলো; হলুদটা আড়াআড়ি তিন ঘর, সবুজটা উল্টা দিকে রাস্তা বরাবর দুই ঘর; করিম জিজ্ঞেস করলো এবার এক এক কোথায়">
        <S_Road />
        <S_Pillar x={180} />
        {k >= 1 && <S_Rope from={[187, 132]} to={[187, 176]} c={E1C} />}
        {k >= 2 && <S_Rope from={[187, 132]} to={[127, 132]} c={E2C} />}
        <Person who="karim" x={240} y={142} facing={-1} label arm={k >= 1 && k < 3 ? "hold" : "down"} mood={k >= 3 ? "smug" : "plain"} />
        {k >= 3 && <Bubble x={240} y={76} side="left" lines={["এবার (1, 1)", "কোথায়?"]} />}
        <Person who="nasib" x={70} y={142} label />
      </Stage>
    </StoryFrame>
  );
}

// 9a · The sir comes back. Night. The lotus on the road; he walks in with a
//      lantern, holds it up, says nothing; then writes four numbers in a small
//      grid in his notebook.

export function SirReturns({}: Story) {
  const s = useScene(3, [600, 2000, 2600, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" ground={S_ROAD} label="রাত; রাস্তায় পাঁচ পাপড়ির পদ্ম; আর্ট স্যার হারিকেন হাতে ফিরলেন, উঁচু করে ধরে দেখলেন, কিছু বললেন না; তারপর খাতায় দুই দড়ির মাথা লিখলেন, চারটা সংখ্যা, একটা ছোট ঘরে">
        <S_Road />
        <S_Pillar />
        <S_Lotus x={140} y={164} />
        <Person who="rina" x={216} y={142} facing={-1} label />
        <Person who="nasib" x={262} y={142} facing={-1} label />
        <Robot x={298} y={146} />
        <Person who="nana" x={k >= 1 ? 86 : -30} y={142} walking={k === 1} arm={k === 2 ? "hold" : "down"} ms={1800} />
        {k >= 1 && <S_Name x={86} y={142} text="আর্ট স্যার" />}
        {k === 2 && <S_Lantern x={100} y={78} />}
        {k !== 2 && k >= 1 && <S_Lantern x={98} y={104} />}
        {k >= 3 && (
          <g className={POP}>
            <rect x={112} y={46} width={40} height={30} rx={2} fill="#fef3c7" stroke="#92400e" />
            <path d="M120 52V70M144 52V70" stroke={INK} strokeWidth={1} fill="none" />
            <text x={132} y={60} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={INK}>
              2 1
            </text>
            <text x={132} y={70} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={INK}>
              1 2
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The stake. Five petals on paper; two crosses on the road; one "?".

const X1_P = makeFrame(-0.6, 6.4, -0.6, 5.6, 12, 4);
const X1_R = makeFrame(-1, 7, -1, 6, 14, 4);
const X1_SAY = ["কাগজে পাঁচটা পাপড়ি. প্রত্যেকটার মাথা একটা ঘরের কোণায়.", "রাস্তায় শুধু দুইটা ক্রস. দুই দড়ির মাথা.", "পাঁচটা মাথা রাস্তায় কোথায় বসবে? স্যার বলে যান নি."];

export function RopeStake() {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  const W = X1_P.W + 12 + X1_R.W;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <svg viewBox={`0 0 ${W} ${X1_R.H}`} role="img" aria-label="কাগজে পাঁচ পাপড়ি, রাস্তায় দুইটা ক্রস, মাঝখানে প্রশ্নবোধক" className="mx-auto block h-auto w-full max-w-[17rem]">
        <svg x={0} y={(X1_R.H - X1_P.H) / 2} width={X1_P.W} height={X1_P.H} viewBox={`0 0 ${X1_P.W} ${X1_P.H}`}>
          <RP_PaperDraw f={X1_P} ropes={false} />
          {LOTUS_TIPS.map((t, i) => (
            <circle key={i} cx={X1_P.sx(t[0])} cy={X1_P.sy(t[1])} r={2.4} fill={INK} />
          ))}
        </svg>
        <svg x={X1_P.W + 12} y={0} width={X1_R.W} height={X1_R.H} viewBox={`0 0 ${X1_R.W} ${X1_R.H}`}>
          <RoadBed f={X1_R} />
          {k >= 1 && (
            <g className={FADE}>
              <circle cx={X1_R.sx(2)} cy={X1_R.sy(1)} r={9} fill="#fde047" opacity={0.35} />
              <circle cx={X1_R.sx(1)} cy={X1_R.sy(2)} r={9} fill="#fde047" opacity={0.35} />
              <Rope f={X1_R} to={[2, 1]} which={1} />
              <Rope f={X1_R} to={[1, 2]} which={2} />
            </g>
          )}
          <Pillar f={X1_R} />
          {k >= 2 && (
            <text x={X1_R.sx(4.5)} y={X1_R.sy(3.5)} textAnchor="middle" fontSize={28} fontWeight={800} fill={CHALK} opacity={0.85} className={POP}>
              ?
            </text>
          )}
        </svg>
      </svg>
    </Scene>
  );
}

// 2½ · The paper's recipe (3.3, 5.1): (2, 3) walked as e₁ twice, e₂ three
//      times, landing on the petal's tip.

const X2_F = makeFrame(-0.6, 6.4, -0.6, 5.6, 17, 4);
const X2_SAY = ["কাগজে (2, 3) এর পাপড়ি.", "হলুদ দড়ি, মানে e₁, দুইবার.", "তারপর সবুজ দড়ি, e₂, তিনবার.", "(2, 3) = 2·e₁ + 3·e₂. পাপড়ির মাথায় পৌঁছে গেলাম."];

export function PaperRecipe() {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const upto = k >= 2 ? 5 : k >= 1 ? 2 : 0;
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <svg viewBox={`0 0 ${X2_F.W} ${X2_F.H}`} role="img" aria-label="কাগজে (2, 3) পর্যন্ত হাঁটা: e₁ দুইবার, e₂ তিনবার" className="mx-auto block h-auto w-full max-w-[12rem]">
        <RP_PaperDraw f={X2_F} hi={1} ropes={false} fish={false} />
        <RP_Chain f={X2_F} cols={[[1, 0], [0, 1]]} a={2} b={3} upto={upto} w={2.2} />
        {k >= 3 && <circle cx={X2_F.sx(2)} cy={X2_F.sy(3)} r={4} fill={INK} className={POP} />}
      </svg>
    </Scene>
  );
}

// 3½ · The recipe twice: on paper with the short ropes, then on the road with
//      the long ones. Same 2 and 3, different ingredients.

const X3_P = makeFrame(-0.5, 4.5, -0.5, 4.5, 14, 4);
const X3_R = makeFrame(-0.5, 8.5, -0.5, 8.5, 11, 4);
const X3_SAY = ["একই recipe: 2 আর 3.", "কাগজে, ছোট দড়ি দিয়ে: (2, 3).", "রাস্তায়, লম্বা দড়ি দিয়ে: (7, 8).", "Recipe বদলায় নাই. বদলেছে শুধু উপকরণ."];

export function RecipeTwice() {
  const s = useScene(3, [600, 1800, 2000, 2200]);
  const k = s.k;
  const W = X3_P.W + 16 + X3_R.W;
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <svg viewBox={`0 0 ${W} ${X3_R.H}`} role="img" aria-label="কাগজে 2 আর 3 হেঁটে (2, 3), রাস্তায় একই 2 আর 3 হেঁটে (7, 8)" className="mx-auto block h-auto w-full max-w-[17rem]">
        <svg x={0} y={X3_R.H - X3_P.H} width={X3_P.W} height={X3_P.H} viewBox={`0 0 ${X3_P.W} ${X3_P.H}`}>
          <RP_PaperDraw f={X3_P} ropes={k < 1} fish={false} />
          {k >= 1 && <RP_Chain f={X3_P} cols={[[1, 0], [0, 1]]} a={2} b={3} w={1.8} />}
        </svg>
        <svg x={X3_P.W + 16} y={0} width={X3_R.W} height={X3_R.H} viewBox={`0 0 ${X3_R.W} ${X3_R.H}`}>
          <RoadBed f={X3_R} />
          {k >= 3 && <ChalkGrid f={X3_R} move={RP_MOVE} x0={0} x1={3} y0={0} y1={3} />}
          {k < 2 && (
            <>
              <Rope f={X3_R} to={[2, 1]} which={1} />
              <Rope f={X3_R} to={[1, 2]} which={2} />
            </>
          )}
          {k >= 2 && <RP_Chain f={X3_R} cols={RP_G} a={2} b={3} w={1.8} />}
          {k >= 2 && <RP_Petal f={X3_R} i={1} move={RP_MOVE} />}
          <Pillar f={X3_R} />
        </svg>
        {k >= 1 && <RP_TagText x={X3_P.W / 2} y={X3_R.H - X3_P.H - 4} text="(2, 3)" />}
        {k >= 2 && <RP_TagText x={X3_P.W + 16 + X3_R.sx(7) - 22} y={X3_R.sy(8) + 4} text="(7, 8)" light />}
      </svg>
    </Scene>
  );
}

function RP_TagText({ x, y, text, light = false }: { x: number; y: number; text: string; light?: boolean }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={light ? CHALK : INK} className={POP}>
      {text}
    </text>
  );
}

// 4½ · Two ways, one spot. The rope recipe chalks (−2, −3); the whole lotus
//      turns the 6.2 way and its (2, 3) petal comes to rest on that cross.

const X4_F = makeFrame(-5.5, 5.5, -5.5, 5.5, 10, 4);
const X4_SAY = ["(2, 3) এর পাপড়ি, আগের জায়গায়.", "দড়ির হিসাব: 2·(−1, 0) + 3·(0, −1) = (−2, −3).", "পুরা আলপনা 180° ঘুরলো, 6.2 এর মতো.", "দুই হিসাব, এক জায়গা. (2, 3) গেলো −(2, 3) এ."];

export function TwoWaysOneSpot() {
  const s = useScene(3, [600, 2000, 1800, 2200]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 1 : 0], 1100);
  const turn = byCols(turnCols(180 * t));
  const tip = turn(LOTUS_TIPS[1]);
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <svg viewBox={`0 0 ${X4_F.W} ${X4_F.H}`} role="img" aria-label="দড়ির হিসাবে (−2, −3) এ ক্রস, আর পুরা আলপনা ঘুরিয়েও পাপড়ি ওই ক্রসে" className="mx-auto block h-auto w-full max-w-[11rem]">
        <RoadBed f={X4_F} />
        <RP_Clip f={X4_F}>
          <ChalkGrid f={X4_F} move={turn} x0={-6} x1={6} y0={-6} y1={6} />
          <Alpana f={X4_F} move={turn} fish={false} />
          <circle cx={X4_F.sx(tip[0])} cy={X4_F.sy(tip[1])} r={3.5} fill="none" stroke={INK} strokeWidth={1.4} />
          {k >= 1 && <RP_Chain f={X4_F} cols={TC_TURNED} a={2} b={3} w={1.6} />}
          {k >= 1 && <RP_X f={X4_F} at={[-2, -3]} c="#fde047" s={4} />}
          <Pillar f={X4_F} />
        </RP_Clip>
      </svg>
    </Scene>
  );
}

// 5½ · Two descriptions of one move: where the ropes go, and a formula per
//      slot, side by side; the arrow between them is 6.4's job.

const X5_F = makeFrame(-0.5, 3.9, -0.5, 3, 20, 4);
const X5_SAY = ["এক: দড়ি দুইটা কোথায় গেলো.", "দুই: প্রত্যেক slot এর formula.", "একই move, দুই রকম লেখা. একটা থেকে আরেকটা কীভাবে, পরের journey তে."];

export function TwoDescriptions() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <svg viewBox="0 0 252 96" role="img" aria-label="বামে দুই দড়ি (2, 1) আর (1, 2), ডানে formula (2g₁ + g₂, g₁ + 2g₂), মাঝে দুইমুখী তীর" className="mx-auto block h-auto w-full max-w-[17rem]">
        <svg x={4} y={4} width={X5_F.W} height={X5_F.H} viewBox={`0 0 ${X5_F.W} ${X5_F.H}`}>
          <RoadBed f={X5_F} />
          <Rope f={X5_F} to={[2, 1]} which={1} label="(2, 1)" />
          <Rope f={X5_F} to={[1, 2]} which={2} label="(1, 2)" />
          <Pillar f={X5_F} />
        </svg>
        {k >= 1 && (
          <g className={FADE}>
            <rect x={132} y={22} width={104} height={50} rx={6} fill="white" stroke={INK} strokeOpacity={0.3} />
            <text x={184} y={42} textAnchor="middle" fontSize={9} fontFamily={MONO} fill={INK}>
              slot 1: 2g₁ + g₂
            </text>
            <text x={184} y={60} textAnchor="middle" fontSize={9} fontFamily={MONO} fill={INK}>
              slot 2: g₁ + 2g₂
            </text>
          </g>
        )}
        {k >= 2 && (
          <g>
            <Draw d="M100 40H126" strokeWidth={1.8} className="stroke-[#64748b]" />
            <Draw d="M126 56H100" strokeWidth={1.8} delay={300} className="stroke-[#64748b]" />
            <path d="M126 40l-5 -3v6Z M100 56l5 -3v6Z" fill="#64748b" className={POP} />
            <text x={113} y={84} textAnchor="middle" fontSize={11} fontWeight={800} fill="#64748b" className={POP}>
              ?
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 6½ · A fan of arrows through the move: most turn off their line; (1, 1)
//      stays on its line, three times longer, and (1, −1) stays put.

const X6_F = makeFrame(-3.5, 3.5, -3.5, 3.5, 22, 4);
const X6_FAN: XY[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];
const X6_SAY = ["অনেকগুলো arrow, move এর আগে.", "Move এর পরে: প্রায় সবাই অন্য দিকে ঘুরে গেলো.", "দুইটা বাদে. (1, 1) গেলো (3, 3): একই লাইন, 3 গুণ.", "আর (1, −1) গেলো (1, −1) এ. যেখানে ছিল, সেখানেই."];

export function ArrowFan() {
  const s = useScene(3, [600, 1600, 2200, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      <svg viewBox={`0 0 ${X6_F.W} ${X6_F.H}`} role="img" aria-label="অনেকগুলো arrow move এর পরে ঘুরে যায়; (1, 1) আর (1, −1) নিজের লাইনে থাকে" className="mx-auto block h-auto w-full max-w-[10rem]">
        <RoadBed f={X6_F} />
        <RP_Clip f={X6_F}>
          {X6_FAN.map((v, i) => (
            <g key={i}>
              <RP_Arrow f={X6_F} from={[0, 0]} to={v} c={CHALK} w={1.6} dashed op={k >= 2 ? 0.35 : 1} />
              {k >= 1 && (
                <g className={FADE}>
                  <RP_Arrow f={X6_F} from={[0, 0]} to={apply(RP_G, v)} c={AFTER} w={1.8} op={k >= 2 ? 0.3 : 1} />
                </g>
              )}
            </g>
          ))}
          {k >= 2 && (
            <g className={FADE}>
              <path d={`M${X6_F.sx(-5)} ${X6_F.sy(-5)}L${X6_F.sx(5)} ${X6_F.sy(5)}`} stroke="#fde047" strokeOpacity={0.5} strokeWidth={5} />
              <RP_Arrow f={X6_F} from={[0, 0]} to={[3, 3]} c={AFTER} w={2.6} />
              <RP_Arrow f={X6_F} from={[0, 0]} to={[1, 1]} c={CHALK} w={2} />
            </g>
          )}
          {k >= 3 && (
            <g className={FADE}>
              <path d={`M${X6_F.sx(-5)} ${X6_F.sy(5)}L${X6_F.sx(5)} ${X6_F.sy(-5)}`} stroke="#fde047" strokeOpacity={0.5} strokeWidth={5} />
              <RP_Arrow f={X6_F} from={[0, 0]} to={[1, -1]} c={AFTER} w={3.2} />
              <RP_Arrow f={X6_F} from={[0, 0]} to={[1, -1]} c={CHALK} w={1.4} dashed />
            </g>
          )}
          <Pillar f={X6_F} />
        </RP_Clip>
      </svg>
    </Scene>
  );
}

// 8½ · Karim's ropes, walked: e₁ once to (0, 3), e₂ once to (−2, 3). The
//      tempting slip, (2, 3), is crossed out beside it: the minus dropped.

const X8_F = makeFrame(-3.5, 3.5, -1, 4.5, 16, 4);
const X8_SAY = ["করিমের দড়ি: (0, 3) আর (−2, 0).", "(1, 1) মানে হলুদ একবার: (0, 3).", "তারপর সবুজ একবার: (0, 3) + (−2, 0) = (−2, 3).", "(2, 3) বললে সবুজ দড়ির minus টা পড়ে গেছে."];

export function KarimWalk() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const upto = k >= 2 ? 2 : k >= 1 ? 1 : 0;
  return (
    <Scene scene={s} caption={say(X8_SAY, k)}>
      <svg viewBox={`0 0 ${X8_F.W} ${X8_F.H}`} role="img" aria-label="করিমের দড়িতে (1, 1): হলুদ একবার, সবুজ একবার, (−2, 3); পাশে (2, 3) কাটা" className="mx-auto block h-auto w-full max-w-[12rem]">
        <RoadBed f={X8_F} />
        <Rope f={X8_F} to={TN_COLS[0]} which={1} />
        <Rope f={X8_F} to={TN_COLS[1]} which={2} />
        <RP_Chain f={X8_F} cols={TN_COLS} a={1} b={1} upto={upto} w={2.4} />
        {k >= 2 && <circle cx={X8_F.sx(-2)} cy={X8_F.sy(3)} r={5} fill={OK} stroke="white" className={POP} />}
        {k >= 3 && (
          <g className={POP}>
            <circle cx={X8_F.sx(2)} cy={X8_F.sy(3)} r={5} fill="none" stroke={BAD} strokeWidth={1.6} />
            <RP_X f={X8_F} at={[2, 3]} c={BAD} s={5} />
          </g>
        )}
        <Pillar f={X8_F} />
      </svg>
    </Scene>
  );
}

// 9½ · The bet settled, card by card: Nasib's "every petal needs the sir" out,
//      Karim's "a few more marks" out, Rina's "two ropes are enough" in.

const X9_BETS: [string, string, boolean][] = [
  ["নাসিব", "স্যার লাগবে", false],
  ["করিম", "আরো দাগ", false],
  ["রিনা", "দুই দড়িই", true],
];
const X9_SAY = ["তিনটা বাজি.", "নাসিব: স্যার ছাড়াই পাঁচটা পাপড়ি বসেছে.", "করিম: বাড়তি একটা দাগও লাগে নাই.", "রিনা: দুই দড়িই যথেষ্ট ছিল."];

export function RopesBetSettled() {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X9_SAY, k)}>
      <svg viewBox="0 0 200 70" role="img" aria-label="তিনটা বাজির হিসাব: নাসিব আর করিম হারলো, রিনা জিতলো" className="mx-auto block h-auto w-full max-w-[15rem]">
        {X9_BETS.map(([who, t, win], i) => (
          <g key={who} transform={`translate(${6 + i * 64} 6)`}>
            <rect width={58} height={40} rx={5} fill="white" stroke={INK} strokeOpacity={0.3} />
            <text x={29} y={15} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
              {who}
            </text>
            <text x={29} y={30} textAnchor="middle" fontSize={7.5} fill={INK}>
              {t}
            </text>
            {k >= i + 1 && (
              <g transform="translate(29 54)" className={POP}>
                {win ? (
                  <path d="M-5 0l3.5 4l7 -8" fill="none" stroke={OK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M-4 -4l8 8m0 -8l-8 8" stroke={BAD} strokeWidth={2.4} strokeLinecap="round" />
                )}
              </g>
            )}
          </g>
        ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// More explanation figures (the animation pass), each after the paragraph it
// shows, and the closing scene.

// 2½a · By eye, the lotus goes crooked. Four friends' marks on the road; then
//       petals put down by eye, each a little off, until the lotus leans.
//       Nothing shows where the petals really go (that is screen 7's).

const X2B_P = makeFrame(-0.6, 6.4, -0.6, 5.6, 11, 4);
const X2B_R = makeFrame(-1, 8, -1, 7, 14, 4);
/** each petal's by-eye slip: turn (deg) about the lotus centre, then a nudge */
const X2B_SLIP: [number, number, number][] = [
  [14, 0, 0.3],
  [-12, 0.4, -0.4],
  [9, -0.3, 0.5],
  [-22, 0.5, 0],
  [26, -0.2, -0.5],
];
const X2B_AT: XY = [1.6, 1.6];
const X2B_MARKS: [XY, string][] = [
  [[2.5, 4], "#93c5fd"],
  [[4, 5.5], "#fca5a5"],
  [[5.5, 4.5], "#67e8f9"],
  [[3.5, 2.5], "#fcd34d"],
];
const X2B_SAY = ["চারজন, চার জায়গা.", "কারো হাতে কোনো যুক্তি নাই, শুধু চোখ.", "পাঁচটা পাপড়ি এভাবে বসালে পদ্মটা বেঁকে যাবে."];

const x2bMove =
  ([deg, dx, dy]: [number, number, number]): Move =>
  (p) => {
    const r = (deg * Math.PI) / 180;
    const [cx, cy] = LOTUS_C;
    const u = p[0] - cx;
    const v = p[1] - cy;
    return [cx + u * Math.cos(r) - v * Math.sin(r) + X2B_AT[0] + dx, cy + u * Math.sin(r) + v * Math.cos(r) + X2B_AT[1] + dy];
  };

export function CrookedLotus() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const n = k >= 2 ? 5 : k >= 1 ? 2 : 0;
  const W = X2B_P.W + 10 + X2B_R.W;
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <svg viewBox={`0 0 ${W} ${X2B_R.H}`} role="img" aria-label="বামে কাগজের সোজা পদ্ম; ডানে রাস্তায় চোখে মেপে বসানো পাপড়ি, একেকটা একেক দিকে হেলানো, পদ্মটা বাঁকা" className="mx-auto block h-auto w-full max-w-[16rem]">
        <svg x={0} y={(X2B_R.H - X2B_P.H) / 2} width={X2B_P.W} height={X2B_P.H} viewBox={`0 0 ${X2B_P.W} ${X2B_P.H}`}>
          <RP_PaperDraw f={X2B_P} ropes={false} fish={false} />
        </svg>
        <svg x={X2B_P.W + 10} y={0} width={X2B_R.W} height={X2B_R.H} viewBox={`0 0 ${X2B_R.W} ${X2B_R.H}`}>
          <RoadBed f={X2B_R} />
          <Rope f={X2B_R} to={[2, 1]} which={1} />
          <Rope f={X2B_R} to={[1, 2]} which={2} />
          <Pillar f={X2B_R} />
          {k === 0 &&
            X2B_MARKS.map(([p, c], i) => <circle key={i} cx={X2B_R.sx(p[0])} cy={X2B_R.sy(p[1])} r={4} fill={c} stroke={INK} strokeWidth={0.8} className={POP} style={{ transitionDelay: `${i * 150}ms` }} />)}
          {k >= 1 && <circle cx={X2B_R.sx(LOTUS_C[0] + X2B_AT[0])} cy={X2B_R.sy(LOTUS_C[1] + X2B_AT[1])} r={2.4} fill="#fde047" className={POP} />}
          {PETALS.slice(0, n).map((pts, i) => (
            <path key={i} d={pathOf(X2B_R, x2bMove(X2B_SLIP[i]), pts, true)} fill={AFTER} fillOpacity={0.85} stroke={CHALK} strokeWidth={1.1} strokeLinejoin="round" className={POP} style={{ transitionDelay: `${(i % 3) * 180}ms` }} />
          ))}
        </svg>
      </svg>
    </Scene>
  );
}

// 3½b · The basis. The paper's two short ropes, e₁ and e₂, stretch to where
//       the sir pulled them (e₁*, e₂*); the chalk grid follows them; the two
//       get their name, basis, last. No petal: where they land is screen 7's.

const X3B_F = makeFrame(-1, 5, -1, 5, 20, 4);
const X3B_SAY = ["কাগজের দুই দড়ি: e₁ আর e₂. এক ঘর করে.", "টানার পরে: e₁* আর e₂*. তারা চিহ্ন মানে টানার পরে.", "দড়ি যেদিকে গেলো, পুরা grid ও সেদিকে.", "দুই দড়ির নাম basis. ওরা কোথায় গেলো জানলেই move টা জানা."];

export function BasisFollows() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const [tr] = useTween([k >= 1 ? 1 : 0], 900);
  const [tg] = useTween([k >= 2 ? 1 : 0], 1100);
  const e1: XY = [1 + tr, tr];
  const e2: XY = [tr, 1 + tr];
  const star = k >= 1 ? "*" : "";
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <svg viewBox={`0 0 ${X3B_F.W} ${X3B_F.H}`} role="img" aria-label="কাগজের দুই ছোট দড়ি টেনে লম্বা হলো, grid তাদের পিছে পিছে গেলো; দুই দড়ির নাম basis" className="mx-auto block h-auto w-full max-w-[9rem]">
        <RoadBed f={X3B_F} />
        <RP_Clip f={X3B_F}>
          <ChalkGrid f={X3B_F} move={partway(RP_MOVE, tg)} x0={-1} x1={5} y0={-1} y1={5} ghost={k >= 2} />
          {k >= 3 && (
            <g className={FADE}>
              <circle cx={X3B_F.sx(2)} cy={X3B_F.sy(1)} r={11} fill="#fde047" opacity={0.35} />
              <circle cx={X3B_F.sx(1)} cy={X3B_F.sy(2)} r={11} fill="#fde047" opacity={0.35} />
            </g>
          )}
          <Rope f={X3B_F} to={e1} which={1} />
          <Rope f={X3B_F} to={e2} which={2} />
          <Pillar f={X3B_F} />
          <RP_Tag x={X3B_F.sx(e1[0]) + 7} y={X3B_F.sy(e1[1]) + 4} text={`e₁${star}`} c={E1C} size={10} />
          <RP_Tag x={X3B_F.sx(e2[0]) - 4} y={X3B_F.sy(e2[1]) - 8} text={`e₂${star}`} c={E2C} size={10} anchor="middle" />
          {k >= 3 && (
            <g className={POP}>
              <RP_Tag x={X3B_F.sx(3.4)} y={X3B_F.sy(3.6)} text="basis" size={13} anchor="middle" />
            </g>
          )}
        </RP_Clip>
      </svg>
    </Scene>
  );
}

// 5½a · Where each slot's numbers come from: the two ropes as two cards,
//       numbers stacked. The top pair (2 and 1) makes slot 1, the bottom pair
//       (1 and 2) makes slot 2.

const X5A_SAY = ["প্রথম slot এ কী আসে দেখুন.", "হলুদ দড়ির প্রথম সংখ্যা 2, সবুজের প্রথম সংখ্যা 1.", "তাই প্রথম slot = 2 × g₁ + 1 × g₂.", "দ্বিতীয় slot এ আসে দড়ি দুইটার দ্বিতীয় সংখ্যা, 1 আর 2."];

function X5A_Card({ x, name, nums, c, hi }: { x: number; name: string; nums: XY; c: string; hi: number }) {
  return (
    <g>
      <rect x={x} y={14} width={34} height={58} rx={5} fill="white" stroke={c} strokeWidth={2} />
      <text x={x + 17} y={10} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={c}>
        {name}
      </text>
      {nums.map((v, i) => (
        <g key={i}>
          {hi === i && <rect x={x + 5} y={21 + i * 24} width={24} height={20} rx={4} fill="#fde047" opacity={0.6} className={FADE} />}
          <text x={x + 17} y={36 + i * 24} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily={MONO} fill={INK}>
            {v}
          </text>
        </g>
      ))}
    </g>
  );
}

export function SlotsFromRopes() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  const hi = k === 1 || k === 2 ? 0 : k === 3 ? 1 : -1;
  const row = (y: number, a: number, b: number, slot: string) => (
    <text x={96} y={y} fontSize={10.5} fontFamily={MONO} fill={INK} className={POP}>
      {slot} ={" "}
      <tspan fill="#b45309" fontWeight={700}>
        {a}
      </tspan>
      ×g₁ +{" "}
      <tspan fill="#0f766e" fontWeight={700}>
        {b}
      </tspan>
      ×g₂
    </text>
  );
  return (
    <Scene scene={s} caption={say(X5A_SAY, k)}>
      <svg viewBox="0 0 250 80" role="img" aria-label="হলুদ দড়ি (2, 1) আর সবুজ দড়ি (1, 2) দুইটা card; উপরের সংখ্যা দুইটা থেকে slot 1, নিচের দুইটা থেকে slot 2" className="mx-auto block h-auto w-full max-w-[17rem]">
        <X5A_Card x={4} name="হলুদ" nums={[2, 1]} c={E1C} hi={hi} />
        <X5A_Card x={46} name="সবুজ" nums={[1, 2]} c="#14b8a6" hi={hi} />
        {k >= 2 && <Draw d="M84 32Q90 30 94 36" strokeWidth={1.4} className="stroke-[#64748b]" />}
        {k >= 2 && row(40, 2, 1, "slot 1")}
        {k >= 3 && <Draw d="M84 56Q90 56 94 60" strokeWidth={1.4} className="stroke-[#64748b]" />}
        {k >= 3 && row(64, 1, 2, "slot 2")}
      </svg>
    </Scene>
  );
}

// 6½b · A callback to 5.6: the two directions that don't turn here are the
//       two lines Fahim drew in his rent khata, size and imbalance. Stopped
//       on "?": why is much later.

const X6B_R = makeFrame(-2.5, 2.5, -2.5, 2.5, 20, 4);
const X6B_K = makeFrame(-2.5, 2.5, -2.5, 2.5, 20, 4);
const X6B_SAY = ["এখানে ঘোরে না এমন দুইটা দিক: (1, 1) আর (1, −1).", "5.6 এ ফাহিমের ভাড়ার খাতা. size আর imbalance এর line.", "একই দুইটা দিক.", "এটা কাকতালীয় না. কেন, সেটা অনেক পরে."];

function X6B_Lines({ f, thick = 5 }: { f: Frame; thick?: number }) {
  return (
    <>
      <path d={`M${f.sx(-3)} ${f.sy(-3)}L${f.sx(3)} ${f.sy(3)}`} stroke="#fde047" strokeOpacity={0.55} strokeWidth={thick} />
      <path d={`M${f.sx(-3)} ${f.sy(3)}L${f.sx(3)} ${f.sy(-3)}`} stroke="#fde047" strokeOpacity={0.55} strokeWidth={thick} />
    </>
  );
}

export function SizeImbalanceAgain() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const gap = 14;
  const W = X6B_R.W + gap + X6B_K.W;
  let grid = "";
  for (let i = -2; i <= 2; i++) grid += `M${X6B_K.sx(i)} ${X6B_K.sy(-2.5)}V${X6B_K.sy(2.5)}M${X6B_K.sx(-2.5)} ${X6B_K.sy(i)}H${X6B_K.sx(2.5)}`;
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <svg viewBox={`0 0 ${W} ${X6B_R.H + 14}`} role="img" aria-label="বামে রাস্তায় যে দুই দিক ঘোরে না; ডানে ফাহিমের খাতায় size আর imbalance এর line; দুইটা একই দিক" className="mx-auto block h-auto w-full max-w-[17rem]">
        <svg x={0} y={0} width={X6B_R.W} height={X6B_R.H} viewBox={`0 0 ${X6B_R.W} ${X6B_R.H}`}>
          <RoadBed f={X6B_R} />
          <RP_Clip f={X6B_R}>
            <X6B_Lines f={X6B_R} />
            <RP_Arrow f={X6B_R} from={[0, 0]} to={[1, 1]} c={CHALK} w={2} />
            <RP_Arrow f={X6B_R} from={[0, 0]} to={[1, -1]} c={CHALK} w={2} />
            <Pillar f={X6B_R} />
          </RP_Clip>
        </svg>
        <text x={X6B_R.W / 2} y={X6B_R.H + 11} textAnchor="middle" fontSize={8} fontWeight={700} className="fill-muted">
          রাস্তা
        </text>
        {k >= 1 && (
          <g className={FADE}>
            <svg x={X6B_R.W + gap} y={0} width={X6B_K.W} height={X6B_K.H} viewBox={`0 0 ${X6B_K.W} ${X6B_K.H}`}>
              <rect x={0} y={0} width={X6B_K.W} height={X6B_K.H} rx={4} fill="#fffbeb" stroke="#d6b98c" />
              <path d={grid} stroke="#93c5fd" strokeOpacity={0.5} strokeWidth={0.6} />
              <path d={`M${X6B_K.sx(-2.5)} ${X6B_K.sy(0)}H${X6B_K.sx(2.5)}M${X6B_K.sx(0)} ${X6B_K.sy(-2.5)}V${X6B_K.sy(2.5)}`} stroke={INK} strokeOpacity={0.5} strokeWidth={0.9} />
              {k >= 2 && (
                <g className={FADE}>
                  <X6B_Lines f={X6B_K} thick={7} />
                </g>
              )}
              <Draw d={`M${X6B_K.sx(-2.2)} ${X6B_K.sy(-2.2)}L${X6B_K.sx(2.2)} ${X6B_K.sy(2.2)}`} strokeWidth={2} className="stroke-[#2563eb]" />
              <Draw d={`M${X6B_K.sx(-2.2)} ${X6B_K.sy(2.2)}L${X6B_K.sx(2.2)} ${X6B_K.sy(-2.2)}`} strokeWidth={2} delay={300} className="stroke-[#e11d48]" />
              <text x={X6B_K.sx(1.2)} y={X6B_K.sy(2.1)} fontSize={8.5} fontWeight={700} fill="#2563eb">
                size
              </text>
              <text x={X6B_K.sx(1.5)} y={X6B_K.sy(-2.1)} textAnchor="end" fontSize={8.5} fontWeight={700} fill="#e11d48">
                imbalance
              </text>
              <text x={X6B_K.sx(2.4)} y={X6B_K.sy(0) - 3} textAnchor="end" fontSize={7} fill={INK} opacity={0.6}>
                bed
              </text>
              <text x={X6B_K.sx(0) + 3} y={X6B_K.sy(2.4) + 6} fontSize={7} fill={INK} opacity={0.6}>
                bath
              </text>
            </svg>
            <text x={X6B_R.W + gap + X6B_K.W / 2} y={X6B_R.H + 11} textAnchor="middle" fontSize={8} fontWeight={700} className="fill-muted">
              ফাহিমের খাতা, 5.6
            </text>
          </g>
        )}
        {k >= 2 && <path d={`M${X6B_R.W - 4} ${X6B_R.H / 2}H${X6B_R.W + gap + 4}`} stroke="#fde047" strokeWidth={3} strokeLinecap="round" className={POP} />}
        {k >= 3 && (
          <text x={X6B_R.W + gap / 2} y={X6B_R.H / 2 - 8} textAnchor="middle" fontSize={18} fontWeight={800} className={`fill-foreground ${POP}`}>
            ?
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 6½c · For the side quest: the two stubborn directions and how much each
//       stretches, 3 and 1, then their names: eigenvector, eigenvalue.

const X6C_F = makeFrame(-1.5, 3.5, -2.2, 3.5, 20, 4);
const X6C_SAY = ["যে দুইটা দিক ঘোরে না: (1, 1) আর (1, −1).", "(1, 1) এর দিক: move এর পরে 3 গুণ লম্বা.", "(1, −1) এর দিক: 1 গুণ, মানে যেমন ছিল.", "যে দিক ঘোরে না, তার নাম eigenvector.", "আর কত গুণ, 3 আর 1: eigenvalue."];

export function StretchNames() {
  const s = useScene(4, [600, 1600, 1800, 1800, 2200]);
  const k = s.k;
  const [t] = useTween([k >= 1 ? 1 : 0], 900);
  const a: XY = [1 + 2 * t, 1 + 2 * t];
  return (
    <Scene scene={s} caption={say(X6C_SAY, k)}>
      <svg viewBox={`0 0 ${X6C_F.W} ${X6C_F.H}`} role="img" aria-label="(1, 1) এর arrow 3 গুণ লম্বা হলো, (1, −1) এর arrow একই রইলো; নাম eigenvector আর eigenvalue" className="mx-auto block h-auto w-full max-w-[9rem]">
        <RoadBed f={X6C_F} />
        <RP_Clip f={X6C_F}>
          {k >= 3 && (
            <g className={FADE}>
              <path d={`M${X6C_F.sx(-1.5)} ${X6C_F.sy(-1.5)}L${X6C_F.sx(3.5)} ${X6C_F.sy(3.5)}`} stroke="#fde047" strokeOpacity={0.5} strokeWidth={5} />
              <path d={`M${X6C_F.sx(-1.5)} ${X6C_F.sy(1.5)}L${X6C_F.sx(2.2)} ${X6C_F.sy(-2.2)}`} stroke="#fde047" strokeOpacity={0.5} strokeWidth={5} />
            </g>
          )}
          {k >= 1 && <RP_Arrow f={X6C_F} from={[0, 0]} to={a} c={AFTER} w={2.6} />}
          <RP_Arrow f={X6C_F} from={[0, 0]} to={[1, 1]} c={CHALK} w={1.6} dashed />
          {k >= 1 && <RP_Tag key="x3" x={X6C_F.sx(a[0]) - 6} y={X6C_F.sy(a[1]) + 4} text="×3" anchor="end" size={10} />}
          {k >= 2 && (
            <g className={FADE}>
              <RP_Arrow f={X6C_F} from={[0, 0]} to={[1, -1]} c={AFTER} w={3.4} />
              <RP_Tag x={X6C_F.sx(1) + 6} y={X6C_F.sy(-1) + 4} text="×1" size={10} />
            </g>
          )}
          <RP_Arrow f={X6C_F} from={[0, 0]} to={[1, -1]} c={CHALK} w={1.6} dashed />
          {k >= 3 && (
            <g className={POP}>
              <RP_Tag x={X6C_F.sx(-1.2)} y={X6C_F.sy(3.1)} text="eigenvector" size={9} />
            </g>
          )}
          {k >= 4 && (
            <g className={POP}>
              <circle cx={X6C_F.sx(a[0]) - 14} cy={X6C_F.sy(a[1]) + 1} r={10} fill="none" stroke="#fde047" strokeWidth={1.6} />
              <circle cx={X6C_F.sx(1) + 14} cy={X6C_F.sy(-1) + 1} r={10} fill="none" stroke="#fde047" strokeWidth={1.6} />
            </g>
          )}
          <Pillar f={X6C_F} />
        </RP_Clip>
      </svg>
    </Scene>
  );
}

// 9b · The next morning. The sir has a fever and doesn't come; only his
//      notebook does: five small boxes of four numbers, five alpana pictures,
//      and nothing says which box is which picture. Ends on "?" (6.4's).

function S_Box({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={16} height={12} rx={1} fill="none" stroke={INK} strokeWidth={0.7} />
      <path d={`M${x + 3} ${y + 4}h3M${x + 10} ${y + 4}h3M${x + 3} ${y + 9}h3M${x + 10} ${y + 9}h3`} stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
    </g>
  );
}

/** five small alpana pictures, each a different shape (no numbers on them) */
function S_Pic({ x, y, i }: { x: number; y: number; i: number }) {
  const shapes = [
    `M${x + 3} ${y + 10}l5 -8l5 8Z`,
    `M${x + 2} ${y + 3}h12v6h-12Z`,
    `M${x + 2} ${y + 9}l10 -7l2 5l-10 4Z`,
    `M${x + 8} ${y + 2}l6 5l-6 5l-6 -5Z`,
    `M${x + 2} ${y + 6}q6 -8 12 0q-6 8 -12 0Z`,
  ];
  return (
    <g>
      <rect x={x} y={y} width={16} height={14} rx={1} fill="#fff7ed" stroke="#d6b98c" strokeWidth={0.7} />
      <path d={shapes[i]} fill={AFTER} fillOpacity={0.85} />
    </g>
  );
}

export function SirNotebook({}: Story) {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  const open = k >= 2;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="পরদিন সকাল; স্যারের চেয়ার খালি; টেবিলে শুধু স্যারের খাতা; খাতায় পাঁচটা ছোট ঘর, প্রত্যেকটায় চারটা সংখ্যা, পাশে পাঁচটা আলপনার ছবি; কোন ঘর কোন ছবির, লেখা নাই">
        {/* the sir's empty chair and the table */}
        <g className="pointer-events-none">
          <rect x={40} y={96} width={26} height={4} fill="#92400e" />
          <rect x={40} y={70} width={4} height={30} fill="#92400e" />
          <path d="M42 100v50M64 100v50" stroke="#92400e" strokeWidth={3} />
          <rect x={80} y={110} width={150} height={6} fill="#78350f" />
          <path d="M86 116v34M224 116v34" stroke="#78350f" strokeWidth={4} />
        </g>
        {k >= 1 && !open && (
          <g className={POP}>
            <rect x={140} y={100} width={30} height={10} rx={1} fill="#fef3c7" stroke="#92400e" />
          </g>
        )}
        {open && (
          <g className={POP}>
            <rect x={96} y={20} width={120} height={88} rx={3} fill="#fef3c7" stroke="#92400e" />
            <path d="M156 20v88" stroke="#92400e" strokeOpacity={0.5} />
            {[0, 1, 2, 3, 4].map((i) => (
              <S_Box key={i} x={120} y={26 + i * 16} />
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <S_Pic key={i} x={176} y={25 + i * 16} i={(i * 2 + 1) % 5} />
            ))}
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={i} d={`M137 ${32 + i * 16}L175 ${32 + ((i + 2) % 5) * 16}`} stroke="#64748b" strokeWidth={0.8} strokeDasharray="2 2" />
            ))}
            <text x={156} y={16} textAnchor="middle" fontSize={16} fontWeight={800} fill={INK} className={POP}>
              ?
            </text>
          </g>
        )}
        <Person who="rina" x={262} y={150} facing={-1} label arm={open ? "point" : "down"} />
        <Person who="nasib" x={298} y={150} facing={-1} label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  TwoRopesBet: { start: {}, nasib: { bet: 0 }, karim: { bet: 1 }, rina: { bet: 2 } },
  GuessByEye: { start: {}, dropped: { mine: [5, 4] } },
  SameRecipe: { start: {}, mid: { amt: [2, 1] }, done: { amt: [2, 3], hit: true } },
  TurnCheck: { start: {}, ropes: { stage: 1 }, walked: { stage: 2 }, done: { stage: 3 } },
  SlotFormula: { start: {}, three: { g: [4, 3], tried: ["1,2", "2,3", "4,3"] }, done: { g: [4, 3], tried: ["1,2", "2,3", "4,3"], letters: true } },
  StubbornArrow: { start: {}, stretch: { v: [1, 1], found: [true, false] }, done: { v: [1, -1], found: [true, true] } },
  PaintThePetals: { start: {}, wrong: { n: 1, last: [3, 2], walked: [3, 2], miss: 1 }, two: { n: 2 }, done: { n: 5 } },
  TryNewRopes: { start: {}, wrong: { pick: [2, 3], miss: 1 }, right: { pick: [-2, 3] } },
  // Story scenes and figures: `k` is the beat shown (no seed shows the last).
  RopesTied: { rest: { k: 0 }, marks: { k: 2 }, sir: { k: 3 }, done: {} },
  EyeGuesses: { rina: { k: 1 }, nasib: { k: 2 }, done: {} },
  SomRope: { done: {} },
  NasibTurn: { first: { k: 1 }, done: {} },
  SaminSlots: { rina: { k: 1 }, done: {} },
  FahimArrow: { one: { k: 1 }, done: {} },
  MosqueOut: { done: {} },
  KarimRopes: { done: {} },
  SirReturns: { walk: { k: 1 }, still: { k: 2 }, done: {} },
  RopeStake: { rest: { k: 0 }, done: {} },
  PaperRecipe: { e1: { k: 1 }, done: {} },
  RecipeTwice: { paper: { k: 1 }, done: {} },
  TwoWaysOneSpot: { chain: { k: 1 }, done: {} },
  TwoDescriptions: { rest: { k: 0 }, done: {} },
  ArrowFan: { turned: { k: 1 }, done: {} },
  KarimWalk: { done: {} },
  RopesBetSettled: { done: {} },
  CrookedLotus: { marks: { k: 0 }, two: { k: 1 }, done: {} },
  BasisFollows: { rest: { k: 0 }, pulled: { k: 1 }, grid: { k: 2 }, done: {} },
  SlotsFromRopes: { first: { k: 1 }, slot1: { k: 2 }, done: {} },
  SizeImbalanceAgain: { road: { k: 0 }, khata: { k: 1 }, done: {} },
  StretchNames: { rest: { k: 0 }, three: { k: 2 }, done: {} },
  SirNotebook: { chair: { k: 0 }, khata: { k: 1 }, open: { k: 2 }, done: {} },
};

