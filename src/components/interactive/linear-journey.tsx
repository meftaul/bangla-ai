"use client";

import { useId, type KeyboardEvent, type ReactNode } from "react";

import { Bubble, Card, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, LOOK, Nope, POP, Scene, Stepper, Ticks, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Lit, listOf, makeFrame, sg, type Frame, type XY } from "@/components/journey/plane";
import { Alpana, ChalkGrid, ID, Pillar, RoadBed, Rope, apply, byCols, partway, pathOf, turnCols, type Cols, type Move } from "@/components/interactive/road-kit";

// Screens for "Math for AI 6.6 — The club's machine, which rules can be a
// matrix", told as a Journey. The plan is 06_journey_specs.md, block 6.6.
//
// Nine screens. 1 seals the bet: the computer club's program runs only a
// matrix, and four rules are on the whiteboard (the lotus move, Nasib's slide,
// Karim's square, Som's swap). 2 tries to type the slide as a matrix: whatever
// the four cells say, the pillar's corner stays put. 3 is Som's race, two lanes
// (combine then machine, machine then combine), run on the lotus move: the
// lanes meet. 4 runs it on the slide (× 2 and × 0: the pillar is inside the
// race). 5 on Karim's square: the lanes part, and on the road the squares stop
// being equal. 6 stacks three matrices: still one matrix. 7 is the reader's
// own verdicts on four rules (Som's among them), 8 six road pictures, 9 settles
// the bet: Som's rule fails only on its +1.
//
// After the screens come the story scenes (the club room, …) and the
// watch-only figures, each numbered after its screen (1a, 2½, …).
//
// The race is drawn on the road of road-kit.tsx: lane 1 (sky blue) combines
// first, lane 2 (violet) runs the machine first. Blue and violet, so the
// ropes' amber and teal keep their meaning.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const L1 = "#38bdf8";
const L2 = "#c084fc";
const OK = "#34d399";
const BAD = "#fb7185";
const CHALK = "#f8fafc";
const TONE = { l1: L1, l2: L2, chalk: CHALK, bad: BAD, amber: "#f59e0b", teal: "#2dd4bf" };

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

// ---------------------------------------------------------------------------
// Numbers, rules and small drawing helpers.

const num = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return sg(Object.is(r, -0) ? 0 : r);
};
const pt = (p: readonly number[]) => `(${num(p[0])}, ${num(p[1])})`;
const add = (a: XY, b: XY): XY => [a[0] + b[0], a[1] + b[1]];
const times = (c: number, a: XY): XY => [c * a[0], c * a[1]];
const near = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6;
const idMove: Move = (p) => p;

const LN_G: Cols = [
  [2, 1],
  [1, 2],
];
const lotus: Move = byCols(LN_G);
const slide: Move = ([x, y]) => [x + 1, y + 1];
const square: Move = ([x, y]) => [x * x, y];
const somRule: Move = ([x, y]) => [y, x + 1];
const swap: Move = ([x, y]) => [y, x];

/** Tap or Enter/Space on an SVG group that acts as a button. */
const press = (fn: () => void) => ({
  role: "button",
  tabIndex: 0,
  onClick: fn,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  },
});

/** a caption that fades in afresh on every beat */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k]}
  </span>
);

/** A clip id that is safe inside url(#…). */
function useClip() {
  return `ln${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/**
 * A patch of the road in front of the gate: the asphalt, clipped to the
 * frame (a move can throw the design far). A plain svg, not the kit's Plane:
 * nothing here is dragged, and Plane's height cap left a gap under it.
 */
function LN_Road({ f, label, max, children }: { f: Frame; label: string; max: string; children: ReactNode }) {
  const id = useClip();
  return (
    <div className={`mx-auto w-full ${max}`}>
      <svg viewBox={`0 0 ${f.W} ${f.H}`} role="img" aria-label={label} className="block h-auto w-full select-none">
        <defs>
          <clipPath id={id}>
            <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <RoadBed f={f} />
          {children}
        </g>
      </svg>
    </div>
  );
}

/** An arrow in one of the race's inks, drawn on the road. */
function LN_Arrow({ f, from = [0, 0], to, tone, w = 2.2, dashed = false, faint = false }: { f: Frame; from?: XY; to: XY; tone: keyof typeof TONE; w?: number; dashed?: boolean; faint?: boolean }) {
  const x1 = f.sx(from[0]);
  const y1 = f.sy(from[1]);
  const x2 = f.sx(to[0]);
  const y2 = f.sy(to[1]);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const h = Math.min(6 + w, len * 0.5);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  const half = h * 0.5;
  const c = TONE[tone];
  return (
    <Lit a={[x1, y1]} b={[x2, y2]} list={listOf(from, to)} w={w} color={c}>
      <g opacity={faint ? 0.4 : 1} className="pointer-events-none">
        <path d={`M${x1} ${y1}L${bx} ${by}`} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? "4 3" : undefined} fill="none" />
        <path d={`M${x2} ${y2}L${bx - uy * half} ${by + ux * half}L${bx + uy * half} ${by - ux * half}Z`} fill={c} />
      </g>
    </Lit>
  );
}

/** A lane's flag where it stopped: lane 1 flies left, lane 2 right, so two flags on one spot read as one. */
function LN_Flag({ f, at, lane }: { f: Frame; at: XY; lane: 1 | 2 }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  const c = lane === 1 ? L1 : L2;
  return (
    <g className={POP}>
      <path d={`M${x} ${y}V${y - 15}`} stroke={CHALK} strokeWidth={1.3} />
      <path d={lane === 1 ? `M${x} ${y - 15}l-10 4l10 4Z` : `M${x} ${y - 15}l10 4l-10 4Z`} fill={c} stroke={INK} strokeWidth={0.5} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// The race (Som's test). Two lanes start from the same arrows. Lane 1 combines
// them first (adds two arrows, or stretches one), then runs the machine. Lane
// 2 runs the machine on each first, then combines. The rule is a matrix only
// if the two lanes always stop on the same spot.

type Round = { kind: "add"; u: XY; v: XY } | { kind: "scale"; c: number; v: XY };

function runRace(m: Move, r: Round) {
  if (r.kind === "add") {
    const s = add(r.u, r.v);
    const mu = m(r.u);
    const mv = m(r.v);
    return {
      lab1: "আগে যোগ, পরে machine",
      lab2: "আগে machine, পরে যোগ",
      chips1: [`${pt(r.u)} + ${pt(r.v)}`, pt(s), pt(m(s))],
      chips2: [`${pt(r.u)}, ${pt(r.v)}`, `${pt(mu)}, ${pt(mv)}`, pt(add(mu, mv))],
      starts: [r.u, r.v],
      mid1: s,
      end1: m(s),
      a2: mu,
      b2: mv as XY | null,
      end2: add(mu, mv),
    };
  }
  const cv = times(r.c, r.v);
  const mv = m(r.v);
  return {
    lab1: `আগে ${r.c} গুণ, পরে machine`,
    lab2: `আগে machine, পরে ${r.c} গুণ`,
    chips1: [`${r.c} × ${pt(r.v)}`, pt(cv), pt(m(cv))],
    chips2: [pt(r.v), pt(mv), `${r.c} × ${pt(mv)} = ${pt(times(r.c, mv))}`],
    starts: [r.v],
    mid1: cv,
    end1: m(cv),
    a2: mv,
    b2: null as XY | null,
    end2: times(r.c, mv),
  };
}

/** A race that plays in three beats (k = 1, 2, 3); `ran` is seeded so previews show it finished. */
function useRace(key = "ran", initial = false) {
  const [ran, setRan] = useSeed(key, initial);
  const p = usePlay(750);
  const k = ran ? 3 : p.k;
  const go = (done?: () => void) => {
    setRan(false);
    p.play(3, () => {
      setRan(true);
      done?.();
    });
  };
  const reset = () => {
    setRan(false);
    p.play(0);
  };
  return { k, ran, running: p.running, go, reset };
}

/** The race drawn on the road, the two lanes spelled out under it, and the verdict. */
function LN_Race({ f, m, r, k, max, label }: { f: Frame; m: Move; r: Round; k: number; max: string; label: string }) {
  const R = runRace(m, r);
  const t1 = useTween(k >= 2 ? R.end1 : R.mid1, 550);
  const f2 = useTween(k >= 2 && R.b2 ? R.a2 : [0, 0], 550);
  const t2 = useTween(k >= 2 ? R.end2 : (R.b2 ?? R.a2), 550);
  const tip1: XY = [t1[0], t1[1]];
  const from2: XY = [f2[0], f2[1]];
  const tip2: XY = [t2[0], t2[1]];
  const same = near(R.end1, R.end2);
  return (
    <>
      <LN_Road f={f} label={label} max={max}>
        <ChalkGrid f={f} move={idMove} x0={Math.ceil(f.x0)} x1={Math.floor(f.x1)} y0={Math.ceil(f.y0)} y1={Math.floor(f.y1)} />
        <Pillar f={f} />
        {R.starts.map((s, i) => (
          <LN_Arrow key={i} f={f} to={s} tone="chalk" w={1.8} faint={k >= 1} />
        ))}
        {k >= 1 && R.b2 && <LN_Arrow f={f} to={R.a2} tone="l2" w={1.8} />}
        {k >= 1 && <LN_Arrow f={f} from={from2} to={tip2} tone="l2" w={1.8} />}
        {k >= 1 && <LN_Arrow f={f} to={tip1} tone="l1" dashed={k < 2} />}
        {k >= 2 && (
          <>
            <LN_Flag f={f} at={R.end1} lane={1} />
            <LN_Flag f={f} at={R.end2} lane={2} />
          </>
        )}
        {k >= 3 &&
          (same ? (
            <circle cx={f.sx(R.end1[0])} cy={f.sy(R.end1[1])} r={7} fill="none" stroke={OK} strokeWidth={2.2} className={POP} />
          ) : (
            <path d={`M${f.sx(R.end1[0])} ${f.sy(R.end1[1])}L${f.sx(R.end2[0])} ${f.sy(R.end2[1])}`} stroke={BAD} strokeWidth={2.4} strokeDasharray="3 2.5" className={FADE} />
          ))}
      </LN_Road>
      <div className="mx-auto mt-2 grid max-w-xs gap-1 text-[0.8rem] leading-snug">
        {[
          [R.lab1, R.chips1, L1],
          [R.lab2, R.chips2, L2],
        ].map(([lab, chips, c]) => (
          <div key={lab as string} className="flex flex-wrap items-center gap-x-1.5">
            <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: c as string }} />
            <span className="text-muted">{lab as string}:</span>
            {(chips as string[]).map((t, j) =>
              k >= j ? (
                <span key={`${j}${t}`} className={`font-mono ${FADE}`}>
                  {j ? "→ " : ""}
                  {t}
                </span>
              ) : null,
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 min-h-5 text-center text-sm font-medium">
        {k >= 3 &&
          (same ? (
            <span className={`text-accent-text ${FADE}`}>দুই lane একই জায়গায়: {pt(R.end1)}.</span>
          ) : (
            <span className={`text-danger ${FADE}`}>
              {pt(R.end1)} আর {pt(R.end2)}. দুই lane দুই জায়গায়.
            </span>
          ))}
      </div>
    </>
  );
}

/** One rule, as it is written on the whiteboard. */
function LN_Rule({ who, text }: { who: string; text: ReactNode }) {
  return (
    <div className="mb-2 text-center text-sm">
      <span className="font-semibold">{who}:</span> <span className="font-mono">(g₁, g₂) → {text}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · The bet. The whiteboard with four rules; the reader ticks the ones the
//     machine can run and seals it. Unmarked; the last screen settles it.

const MB_RULES = [
  ["পদ্মের move", "(2g₁ + g₂, g₁ + 2g₂)"],
  ["নাসিবের slide", "(g₁ + 1, g₂ + 1)"],
  ["করিমের বর্গ", "(g₁², g₂)"],
  ["সোমের swap", "(g₂, g₁ + 1)"],
] as const;

/** a picked rule's paper card, waiting in front of the machine */
const MB_CARD_W = 44;
const MB_Y = 162;
const MB_NAMES = ["পদ্ম", "নাসিব", "করিম", "সোম"];

export function MachineBet() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<boolean[]>("picks", [false, false, false, false]);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(700);
  const flip = (i: number) => {
    if (!sealed) setPicks(picks.map((p, j) => (j === i ? !p : p)));
  };
  const seal = () => {
    setSealed(true);
    act.play(3, () => pass("বাজি সিল হলো. সামিনের কথা ঝুলে থাকলো."));
  };
  // beats of the acted bet: 1 the picked cards go into the machine, 2 its screen says "?", 3 sealed
  const k = !sealed ? 0 : act.running ? act.k : 3;
  const n = picks.filter(Boolean).length;
  const queue = MB_RULES.map((_, i) => i).filter((i) => picks[i]);
  return (
    <>
      <svg viewBox="0 0 280 212" role="group" aria-label="Whiteboard এ চারটা নিয়ম; যেগুলো machine চালাতে পারবে বলে মনে হয়, সেগুলোতে tick দিন; tick দেওয়া নিয়মগুলো নিচে machine এর সামনে লাইনে দাঁড়ায়" className="mx-auto block h-auto w-full max-w-[20rem]">
        <rect x={3} y={3} width={274} height={144} rx={4} fill="white" stroke="#94a3b8" strokeWidth={3} />
        <text x={14} y={20} fontSize={9} fill="#64748b">
          Machine শুধু matrix চালায়. (g₁, g₂) যাবে →
        </text>
        {MB_RULES.map(([who, rule], i) => {
          const y = 30 + i * 28;
          return (
            <g key={who} {...press(() => flip(i))} aria-label={`${who} ${rule}`} aria-pressed={picks[i]} className={sealed ? "" : "cursor-pointer"}>
              <rect x={8} y={y} width={264} height={24} rx={4} fill={picks[i] ? "#dbeafe" : "white"} className="transition-colors duration-200 motion-reduce:transition-none" />
              <text x={16} y={y + 15.5} fontSize={9.5} fontWeight={700} fill="#1d4ed8">
                {who}
              </text>
              <text x={88} y={y + 16} fontSize={11} fontFamily={MONO} fill={INK}>
                {rule}
              </text>
              <rect x={248} y={y + 4} width={16} height={16} rx={3} fill="white" stroke={INK} strokeOpacity={0.5} />
              {picks[i] && <path d={`M251 ${y + 12}l4 4l7 -8`} stroke="#1d4ed8" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" className={POP} />}
            </g>
          );
        })}
        {/* the club's machine, and the ticked rules lined up in front of it */}
        <rect x={196} y={MB_Y - 6} width={70} height={44} rx={4} fill="#1e293b" stroke="#94a3b8" strokeWidth={1.2} />
        <rect x={201} y={MB_Y - 1} width={60} height={30} rx={2} fill="#334155" />
        <rect x={194} y={MB_Y + 12} width={4} height={10} rx={1} fill="#0f172a" />
        <text x={231} y={MB_Y + 50} textAnchor="middle" fontSize={8} fontWeight={700} fill="#64748b">
          machine
        </text>
        {queue.map((i, j) => {
          const x = 8 + j * (MB_CARD_W + 2);
          const gone = k >= 1;
          return (
            <g
              key={i}
              className="transition-[transform,opacity] duration-500 ease-in motion-reduce:transition-none"
              style={{ transform: gone ? `translate(${190 - MB_CARD_W / 2 - x}px, 0px) scale(0.3)` : "translate(0px, 0px)", transformOrigin: `${x + MB_CARD_W / 2}px ${MB_Y + 16}px`, opacity: gone ? 0 : 1, transitionDelay: gone ? `${j * 120}ms` : "0ms" }}
            >
              <g className={POP}>
                <rect x={x} y={MB_Y + 6} width={MB_CARD_W} height={20} rx={3} fill="white" stroke="#1d4ed8" strokeWidth={1.2} />
                <text x={x + MB_CARD_W / 2} y={MB_Y + 19.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#1d4ed8">
                  {MB_NAMES[i]}
                </text>
              </g>
            </g>
          );
        })}
        {queue.length === 0 && !sealed && (
          <text x={92} y={MB_Y + 20} textAnchor="middle" fontSize={8} fill="#94a3b8">
            tick দিলে নিয়ম এখানে আসবে
          </text>
        )}
        {k >= 2 && (
          <text x={231} y={MB_Y + 23} textAnchor="middle" fontSize={24} fontWeight={800} fill="#fde047" className={POP}>
            ?
          </text>
        )}
        {k >= 3 && (
          <g className={POP}>
            <circle cx={182} cy={MB_Y + 30} r={15} fill="#b91c1c" />
            <circle cx={182} cy={MB_Y + 30} r={11} fill="none" stroke="#fecaca" strokeWidth={1} />
            <text x={182} y={MB_Y + 33.5} textAnchor="middle" fontSize={9} fontWeight={800} fill="white">
              সিল
            </text>
          </g>
        )}
      </svg>
      <div className="mt-3 flex justify-center">
        {sealed ? (
          <span className={`text-sm text-muted ${FADE}`}>আপনার বাজি: চারটার {n} টা চলবে. মিলিয়ে দেখবো শেষে.</span>
        ) : (
          <button type="button" className={primaryBtn} onClick={seal}>
            বাজি সিল করুন
          </button>
        )}
      </div>
      <Task done={sealed && k >= 3}>Machine কোন নিয়মগুলো চালাতে পারবে? Tick দিয়ে বাজি সিল করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Typing the slide as a matrix. Four steppers; the road follows every
//     change. The dashed design is where Nasib wants it. Whatever the cells
//     say, the pillar's corner stays on (0, 0). Can't be won: passes once all
//     four cells have been tried.

const TG_F = makeFrame(-1, 7.5, -1, 6.5, 22, 6);
const TG_CELLS = ["উপরে বামে", "উপরে ডানে", "নিচে বামে", "নিচে ডানে"];

export function TryToGrid() {
  const pass = useGate();
  const [m, setM] = useSeed<number[]>("m", [1, 0, 0, 1]);
  const [touched, setTouched] = useSeed<boolean[]>("touched", [false, false, false, false]);
  const tw = useTween(m, 450);
  const cols: Cols = [
    [tw[0], tw[2]],
    [tw[1], tw[3]],
  ];
  const move = byCols(cols);
  const corner = byCols([
    [m[0], m[2]],
    [m[1], m[3]],
  ])([0, 0]);
  const done = touched.every(Boolean);
  const set = (i: number, v: number) => {
    setM(m.map((x, j) => (j === i ? v : x)));
    const t = touched.map((x, j) => x || j === i);
    setTouched(t);
    if (t.every(Boolean) && !done) pass("কোনো matrix শূন্যকে সরাতে পারে না.");
  };
  return (
    <>
      <LN_Road f={TG_F} label="রাস্তার আলপনা, matrix এর চার ঘর বদলালে পুরা রাস্তা বদলায়; ফুটকি দেওয়া আলপনা নাসিবের চাওয়া জায়গা, এক ঘর ডানে আর উপরে" max="max-w-[12.5rem]">
        <ChalkGrid f={TG_F} move={move} ghost x0={-1} x1={8} y0={-1} y1={7} />
        <Alpana f={TG_F} move={slide} faint />
        <circle cx={TG_F.sx(1)} cy={TG_F.sy(1)} r={5} fill="none" stroke="#fde047" strokeWidth={1.4} strokeDasharray="2.5 2" />
        <Alpana f={TG_F} move={move} />
        <Rope f={TG_F} to={cols[0]} which={1} />
        <Rope f={TG_F} to={cols[1]} which={2} />
        <Pillar f={TG_F} />
      </LN_Road>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <span aria-hidden="true" className="h-[5.5rem] w-2 rounded-l-md border-y-2 border-l-2 border-foreground/60" />
        <div className="grid grid-cols-2 gap-1">
          {m.map((v, i) => (
            <Stepper key={i} value={v} min={-2} max={3} label={`matrix এর ${TG_CELLS[i]} ঘর`} onChange={(x) => set(i, x)} />
          ))}
        </div>
        <span aria-hidden="true" className="h-[5.5rem] w-2 rounded-r-md border-y-2 border-r-2 border-foreground/60" />
      </div>
      <div className="mt-2 text-center text-sm">
        খুঁটির কোণা: <span className="font-mono">(0, 0) → {pt(corner)}</span>. নাসিব চায় <span className="font-mono">(1, 1)</span>.
      </div>
      {done && <div className={`mt-1 text-center text-sm text-danger ${FADE}`}>চার ঘরেই হাত দিলেন. কোণা একবারও নড়লো না.</div>}
      <Task done={done}>চারটা ঘরই বদলে দেখুন. আলপনা কি ফুটকি দেওয়া জায়গায় যায়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Som's race on the lotus move, a known matrix. Round 1 adds (1, 0) and
//     (0, 1); round 2 doubles (1, 1). Both times the lanes meet.

const TL_F = makeFrame(-0.5, 6.5, -0.5, 6.5, 21, 6);
const TL_ROUNDS: Round[] = [
  { kind: "add", u: [1, 0], v: [0, 1] },
  { kind: "scale", c: 2, v: [1, 1] },
];

export function TwoLanes() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const race = useRace();
  const done = round === 1 && race.ran;
  const go = () => {
    const next = race.ran ? round + 1 : round;
    setRound(next);
    race.go(next === 1 ? () => pass("যোগ আগে বা machine আগে, থামে একই জায়গায়.") : undefined);
  };
  return (
    <>
      <LN_Rule who="পদ্মের move" text="(2g₁ + g₂, g₁ + 2g₂)" />
      <LN_Race f={TL_F} m={lotus} r={TL_ROUNDS[round]} k={race.k} max="max-w-[10rem]" label="পদ্মের move এর race: নীল lane আগে যোগ করে, বেগুনি lane আগে machine চালায়" />
      <div className="mt-2 flex justify-center">
        {!done && (
          <button type="button" className={primaryBtn} disabled={race.running} onClick={go}>
            {race.ran ? "Round 2: 2 গুণ" : "Race চালান"}
          </button>
        )}
      </div>
      <Ticks
        items={[
          ["যোগের race", round === 1 || race.ran],
          ["2 গুণের race", done],
        ]}
      />
      <Task done={done}>Race চালান. দুই lane কোথায় থামে দেখুন. তারপর 2 গুণ দিয়ে আরেকবার.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The race on Nasib's slide. The reader picks the stretch (0 to 3). × 2
//     parts the lanes; × 0 sends lane 1 to where the pillar's corner went.

export function SlideFails() {
  const pass = useGate();
  const [c, setC] = useSeed("c", 2);
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const race = useRace();
  const done = tried.includes(0) && tried.includes(2);
  const go = () => {
    const t = tried.includes(c) ? tried : [...tried, c];
    race.go(() => {
      setTried(t);
      if (t.includes(0) && t.includes(2) && !done) pass("Slide এ দুই lane দুই জায়গায় থামে.");
    });
  };
  const pick = (v: number) => {
    setC(v);
    race.reset();
  };
  return (
    <>
      <LN_Rule who="নাসিবের slide" text="(g₁ + 1, g₂ + 1)" />
      <LN_Race f={TL_F} m={slide} r={{ kind: "scale", c, v: [1, 1] }} k={race.k} max="max-w-[10rem]" label="নাসিবের slide এর race, (1, 1) কে কত গুণ করা হবে তা আপনি বাছেন" />
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <span className="flex items-center gap-1.5 text-sm">
          কত গুণ? <Stepper value={c} min={0} max={3} label="গুণ" disabled={race.running} onChange={pick} />
        </span>
        <button type="button" className={primaryBtn} disabled={race.running} onClick={go}>
          Race চালান
        </button>
      </div>
      <Ticks
        items={[
          ["2 গুণ", tried.includes(2)],
          ["0 গুণ", tried.includes(0)],
        ]}
      />
      <Task done={done}>2 গুণ দিয়ে race চালান. তারপর 0 গুণ দিয়ে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Karim's square. The race × 2 parts the lanes; then the whole road runs
//     through it: the vertical lines land at 0, 1, 4, 9 and the diagonal
//     chalk line bends. The pillar never moves.

const SQ_F = makeFrame(-0.5, 4.5, -0.5, 4.5, 30, 6);
const SQ_RF = makeFrame(-0.5, 9.5, -0.6, 3.5, 24, 6);
const SQ_DIAG: XY[] = Array.from({ length: 25 }, (_, i) => [(3 * i) / 24, (3 * i) / 24]);

export function SquareFails() {
  const pass = useGate();
  const [road, setRoad] = useSeed("road", false);
  const race = useRace();
  const p = usePlay(1300);
  const [t] = useTween([road ? 1 : 0], 1200);
  const mv = partway(square, t);
  const toRoad = () => {
    setRoad(true);
    p.play(1, () => pass("বর্গ করলে ঘর সমান থাকে না, লাইন বাঁকে."));
  };
  return (
    <>
      <LN_Rule who="করিমের বর্গ" text="(g₁², g₂)" />
      {road ? (
        <LN_Road f={SQ_RF} label="করিমের নিয়মে পুরা রাস্তা: খাড়া দাগগুলো 0, 1, 4, 9 এ গিয়ে পড়ে, কোনাকুনি দাগটা বেঁকে যায়" max="max-w-[17rem]">
          <ChalkGrid f={SQ_RF} move={mv} ghost x0={0} x1={3} y0={0} y1={3} />
          <path d={pathOf(SQ_RF, mv, SQ_DIAG)} stroke="#f59e0b" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Pillar f={SQ_RF} />
          {[0, 1, 2, 3].map((x) => (
            <text key={x} x={SQ_RF.sx(mv([x, 0])[0])} y={SQ_RF.sy(-0.45)} textAnchor="middle" fontSize={9} fontFamily={MONO} fontWeight={700} fill={CHALK}>
              {Math.round(mv([x, 0])[0] * 10) / 10}
            </text>
          ))}
        </LN_Road>
      ) : (
        <LN_Race f={SQ_F} m={square} r={{ kind: "scale", c: 2, v: [1, 1] }} k={race.k} max="max-w-[10rem]" label="করিমের বর্গের race, (1, 1) কে 2 গুণ" />
      )}
      <div className="mt-2 flex justify-center">
        {!race.ran && (
          <button type="button" className={primaryBtn} disabled={race.running} onClick={() => race.go()}>
            Race চালান
          </button>
        )}
        {race.ran && !road && (
          <button type="button" className={primaryBtn} onClick={toRoad}>
            পুরা রাস্তায় চালান
          </button>
        )}
      </div>
      {road && <div className={`mt-2 text-center text-sm text-muted ${FADE}`}>খাড়া দাগের ফাঁক আর সমান থাকলো না. কমলা দাগটা সোজা ছিল.</div>}
      <Ticks
        items={[
          ["race", race.ran || road],
          ["পুরা রাস্তা", road],
        ]}
      />
      <Task done={road}>আগে race চালান. তারপর করিমের নিয়ম পুরা রাস্তায় চালিয়ে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Stacking three matrices [predict]. Guess what the road looks like after
//     three moves in a row; then pick three and run them. The grid stays an
//     even grid, pinned; the ropes' last spots are one matrix's two columns.

const SK_F = makeFrame(-6, 6, -6, 6, 14, 4);
const SK_MOVES: { name: string; cols: Cols }[] = [
  { name: "ঘুরাও", cols: turnCols(90) },
  {
    name: "আয়না",
    cols: [
      [1, 0],
      [0, -1],
    ],
  },
  {
    name: "কাত",
    cols: [
      [1, 0],
      [0.5, 1],
    ],
  },
  {
    name: "ছোট",
    cols: [
      [0.5, 0],
      [0, 0.5],
    ],
  },
];
const SK_OPTS = ["লাইন বাঁকবে. নতুন রকমের নকশা.", "আবার সমান ঘরের grid, খুঁটিতে বাঁধা.", "Grid ছিঁড়ে টুকরা টুকরা হবে."];
const SK_RIGHT = 1;

/** Each guess as a small road: bent chalk lines, an even tilted grid on its pillar, a grid torn into pieces. */
function SK_Icon({ i }: { i: number }) {
  const lines: string[] =
    i === 0
      ? ["M6 8q10 14 6 36", "M18 6q14 16 8 38", "M32 6q14 18 6 38", "M4 16q20 -6 40 4", "M4 30q20 -10 40 6"]
      : i === 1
        ? ["M4 38L20 6", "M16 42L32 10", "M28 44L44 12", "M4 38L28 44", "M12 22L36 28", "M20 6L44 12"]
        : ["M5 8h14M5 20h14M8 5v18", "M27 10h14M27 22h14M34 7v18", "M8 30h13M8 41h13M14 27v17", "M29 32h13M29 43h13M35 29v17"];
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-11 shrink-0 rounded-md">
      <rect width={48} height={48} rx={5} fill="#475569" />
      {lines.map((d, j) => (
        <path key={j} d={d} stroke={CHALK} strokeWidth={1.4} fill="none" strokeLinecap="round" transform={i === 2 ? `rotate(${[-8, 10, 14, -12][j]} 24 24)` : undefined} />
      ))}
      {i === 1 && <circle cx={4} cy={38} r={3} fill="#f59e0b" stroke={INK} strokeWidth={0.6} />}
    </svg>
  );
}
/** a then b, as one matrix */
const thenCols = (a: Cols, b: Cols): Cols => [apply(b, a[0]), apply(b, a[1])];
const mixCols = (a: Cols, b: Cols, t: number): Cols => [
  [a[0][0] + (b[0][0] - a[0][0]) * t, a[0][1] + (b[0][1] - a[0][1]) * t],
  [a[1][0] + (b[1][0] - a[1][0]) * t, a[1][1] + (b[1][1] - a[1][1]) * t],
];

/** a 2 × 2 matrix, its columns in the ropes' colours */
function LN_Mat({ cols }: { cols: Cols }) {
  return (
    <span className="inline-flex items-center gap-1 align-middle font-mono text-sm font-semibold">
      <span aria-hidden="true" className="h-9 w-1.5 rounded-l-sm border-y-2 border-l-2 border-foreground/60" />
      {cols.map((c, j) => (
        <span key={j} className={`grid gap-0.5 px-1 text-center ${j ? "text-[#0d9488]" : "text-[#b45309]"}`}>
          <span>{num(c[0])}</span>
          <span>{num(c[1])}</span>
        </span>
      ))}
      <span aria-hidden="true" className="h-9 w-1.5 rounded-r-sm border-y-2 border-r-2 border-foreground/60" />
    </span>
  );
}

export function StackThree() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [slots, setSlots] = useSeed<number[]>("slots", []);
  const [ran, setRan] = useSeed("ran", false);
  const p = usePlay(1100);
  const shown = ran ? slots.length : p.k;
  const [s] = useTween([shown], 900);
  const cum: Cols[] = [ID];
  slots.forEach((i) => cum.push(thenCols(cum[cum.length - 1], SK_MOVES[i].cols)));
  const i0 = Math.min(Math.floor(s), cum.length - 1);
  const cols = i0 >= cum.length - 1 ? cum[cum.length - 1] : mixCols(cum[i0], cum[i0 + 1], s - i0);
  const move = byCols(cols);
  const pickMove = (i: number) => {
    if (slots.length >= 3 || p.running) return;
    setRan(false);
    p.play(0);
    setSlots([...slots, i]);
  };
  const clear = () => {
    setRan(false);
    p.play(0);
    setSlots([]);
  };
  const run = () =>
    p.play(3, () => {
      setRan(true);
      pass("যত matrix ই জোড়াই, শেষে একটা matrix ই.");
    });
  return (
    <>
      <LN_Road f={SK_F} label="খুঁটিতে বাঁধা রাস্তা আর আলপনা; বাছাই করা তিনটা move পরপর চলে" max="max-w-[9.5rem]">
        <ChalkGrid f={SK_F} move={move} ghost x0={-6} x1={6} y0={-6} y1={6} />
        <Alpana f={SK_F} move={move} />
        <Rope f={SK_F} to={cols[0]} which={1} />
        <Rope f={SK_F} to={cols[1]} which={2} />
        <Pillar f={SK_F} />
      </LN_Road>
      {guess !== null && (
        <div className={`mt-2 grid gap-2 ${FADE}`}>
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((j) => (
              <span
                key={j}
                className={`grid h-8 w-16 place-items-center rounded-lg border-2 text-sm ${slots[j] !== undefined ? "border-cat-blue bg-cat-blue/10" : "border-dashed border-border text-muted"} ${shown > j && p.running ? "ring-2 ring-accent" : ""}`}
              >
                {slots[j] !== undefined ? SK_MOVES[slots[j]].name : j + 1}
              </span>
            ))}
            {slots.length > 0 && (
              <button type="button" onClick={clear} disabled={p.running} className="ml-1 cursor-pointer text-sm text-muted underline disabled:opacity-40">
                মুছুন
              </button>
            )}
          </div>
          {slots.length < 3 ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              {SK_MOVES.map((mv, i) => (
                <button key={mv.name} type="button" onClick={() => pickMove(i)} className="cursor-pointer rounded-full border-2 border-border px-3 py-1 text-sm font-semibold hover:border-cat-blue/60">
                  {mv.name}
                </button>
              ))}
            </div>
          ) : ran ? (
            <div className={`text-center text-sm ${FADE}`}>
              তিনটা মিলে একটাই matrix: <LN_Mat cols={cum[3]} />
            </div>
          ) : (
            <div className="flex justify-center">
              <button type="button" className={primaryBtn} disabled={p.running} onClick={run}>
                তিনটা পরপর চালান
              </button>
            </div>
          )}
        </div>
      )}
      {guess === null && <div className="mt-3 text-sm font-medium text-muted">তিনটা matrix পরপর চালালে? বলুন তো, শেষে রাস্তা কেমন দেখাবে?</div>}
      <div className="mt-1.5 grid gap-1.5">
        {SK_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, ran, SK_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="flex items-center gap-2.5">
              {guess === null && <SK_Icon i={i} />}
              <span>{o}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={ran}>আগে guess দিন. তারপর তিনটা move বেছে পরপর চালান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn: four rules, Som's among them. The reader may race each one,
//     then says "matrix হয়" or "হয় না". A wrong verdict runs the race to show
//     what it meant.

const YR_F = makeFrame(-2.5, 4.5, -0.5, 4.5, 25, 6);
const YR: { name: string; tick: string; text: string; m: Move; lin: boolean }[] = [
  { name: "সোমের swap", tick: "সোম", text: "(g₂, g₁ + 1)", m: somRule, lin: false },
  { name: "খাতার নিয়ম 1", tick: "খাতা 1", text: "(2g₁, g₁ + g₂)", m: ([x, y]) => [2 * x, x + y], lin: true },
  { name: "খাতার নিয়ম 2", tick: "খাতা 2", text: "(−g₂, g₁)", m: ([x, y]) => [-y, x], lin: true },
  { name: "খাতার নিয়ম 3", tick: "খাতা 3", text: "(g₁ × g₂, 0)", m: ([x, y]) => [x * y, 0], lin: false },
];
const YR_PASS = "Lane মিললে matrix, না মিললে না.";

export function YourRules() {
  const pass = useGate();
  const [i, setI] = useSeed("i", 0);
  const [ok, setOk] = useSeed("ok", false);
  const [wrong, setWrong] = useSeed<boolean | null>("wrong", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const race = useRace();
  const rule = YR[i];
  const last = i === YR.length - 1;
  const verdict = (yes: boolean) => {
    if (ok || race.running) return;
    if (yes === rule.lin) {
      setOk(true);
      setWrong(null);
      if (race.ran) {
        if (last) pass(YR_PASS);
      } else race.go(last ? () => pass(YR_PASS) : undefined);
    } else {
      setWrong(yes);
      setMiss(miss + 1);
      race.go();
    }
  };
  const next = () => {
    setI(i + 1);
    setOk(false);
    setWrong(null);
    race.reset();
  };
  const btn = `${quietBtn} h-10! px-3.5!`;
  return (
    <>
      <LN_Rule who={`${i + 1}/${YR.length} · ${rule.name}`} text={rule.text} />
      <LN_Race key={i} f={YR_F} m={rule.m} r={{ kind: "scale", c: 2, v: [1, 1] }} k={race.k} max="max-w-[11.5rem]" label={`${rule.name} এর race, (1, 1) কে 2 গুণ`} />
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        {ok ? (
          !last && (
            <button type="button" className={primaryBtn} onClick={next}>
              পরের নিয়ম
            </button>
          )
        ) : (
          <>
            <button type="button" className={btn} disabled={race.running || race.ran} onClick={() => race.go()}>
              Race চালান
            </button>
            <button type="button" className={btn} disabled={race.running} onClick={() => verdict(true)}>
              matrix হয়
            </button>
            <button type="button" className={btn} disabled={race.running} onClick={() => verdict(false)}>
              হয় না
            </button>
          </>
        )}
      </div>
      {wrong !== null && !ok && (
        <Nope key={miss}>{wrong ? "উঁহু. দেখুন, দুই lane দুই জায়গায় থামলো." : "উঁহু. দুই lane একই জায়গায় থামলো."}</Nope>
      )}
      {ok && <div className={`mt-2 text-center text-sm text-accent-text ${FADE}`}>{rule.lin ? "ঠিক. Lane মিলেছে, এটা matrix." : "ঠিক. Lane মেলেনি, এটা matrix না."}</div>}
      <Ticks items={YR.map((r, j) => [r.tick, j < i || (j === i && ok)] as [string, boolean])} />
      <Task done={last && ok}>চারটা নিয়মেরই রায় দিন: matrix হয়, না হয় না.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it: six road pictures from the club's album. Tap the three the
//     machine made. A tap races the picture: × 2 on (1, 1), the two lane dots
//     meet or part. Traps: the squash looks broken but is a matrix; the wave
//     and the swirl keep the pillar and still fail.

const TH_F = makeFrame(-4.5, 5.5, -4.5, 5.5, 10, 4);
const swirl: Move = ([x, y]) => {
  const a = 0.2 * Math.hypot(x, y);
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};
const TR: { m: Move; lin: boolean; why: string; name: string }[] = [
  { name: "slide", m: ([x, y]) => [x, y - 1], lin: false, why: "খুঁটির কোণা এক ঘর নেমে গেছে. আর দুই lane এর বিন্দু দুই জায়গায়." },
  { name: "আয়না", m: ([x, y]) => [x, -y], lin: true, why: "" },
  { name: "ঢেউ", m: ([x, y]) => [x, y + 0.6 * Math.sin(1.2 * x)], lin: false, why: "খুঁটি জায়গায় আছে. কিন্তু lane দুইটা মিললো না. লাইনগুলো ঢেউ খেলছে." },
  { name: "চ্যাপ্টা", m: ([x]) => [x, 0], lin: true, why: "" },
  { name: "ঘূর্ণি", m: swirl, lin: false, why: "খুঁটি জায়গায় আছে. কিন্তু lane দুইটা মিললো না. দূরের point বেশি ঘোরে." },
  { name: "ঘুরানো", m: byCols(turnCols(90)), lin: true, why: "" },
];

/**
 * One album picture. With `race`, the two lane dots show up where (1, 1)
 * landed; with `go` they glide to where each lane stops (lane 1: 2 × first,
 * then the machine; lane 2: the machine, then 2 ×), and `verdict` rings the
 * meeting or draws the gap.
 */
function TR_Thumb({ m, race, go = race, verdict = race && go }: { m: Move; race: boolean; go?: boolean; verdict?: boolean }) {
  const e1 = m([2, 2]);
  const e2 = times(2, m([1, 1]));
  const s = m([1, 1]);
  const same = near(e1, e2);
  const c = m([0, 0]);
  const moved = !near(c, [0, 0]);
  const t = useTween(go ? [...e1, ...e2] : [...s, ...s], 650);
  return (
    <LN_Road f={TH_F} label="রাস্তার একটা ছবি" max="max-w-none">
      <ChalkGrid f={TH_F} move={m} ghost x0={-4} x1={5} y0={-4} y1={5} />
      <Alpana f={TH_F} move={m} fish={false} />
      <Pillar f={TH_F} at={c} off={moved} />
      {race && (
        <g className={FADE}>
          {verdict && !same && <path d={`M${TH_F.sx(e1[0])} ${TH_F.sy(e1[1])}L${TH_F.sx(e2[0])} ${TH_F.sy(e2[1])}`} stroke={BAD} strokeWidth={2} strokeDasharray="2.5 2" className={FADE} />}
          <circle cx={TH_F.sx(t[0])} cy={TH_F.sy(t[1])} r={3.6} fill={L1} stroke={INK} strokeWidth={0.6} />
          <circle cx={TH_F.sx(t[2])} cy={TH_F.sy(t[3])} r={verdict && same ? 2 : 3.6} fill={L2} stroke={INK} strokeWidth={0.6} />
          {verdict && same && <circle cx={TH_F.sx(e1[0])} cy={TH_F.sy(e1[1])} r={7} fill="none" stroke={OK} strokeWidth={2} className={POP} />}
        </g>
      )}
    </LN_Road>
  );
}

export function TryRoadPictures() {
  const pass = useGate();
  const [found, setFound] = useSeed<boolean[]>("found", TR.map(() => false));
  const [last, setLast] = useSeed<number | null>("last", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const p = usePlay(650);
  const need = TR.filter((t) => t.lin).length;
  const got = found.filter(Boolean).length;
  // a tap races that picture: the dots appear on (1, 1)'s spot, glide to where each lane stops, then the verdict
  const tap = (i: number) => {
    if (p.running || found[i]) return;
    setCur(i);
    setLast(null);
    p.play(2, () => {
      setCur(null);
      if (TR[i].lin) {
        const f = found.map((x, j) => x || j === i);
        setFound(f);
        if (f.filter(Boolean).length === need) pass("Race মিললেই matrix. দেখতে যেমনই হোক.");
      } else {
        setLast(i);
        setMiss((m) => m + 1);
      }
    });
  };
  const racing = (i: number) => cur === i && p.running;
  const look = (i: number): Look => (found[i] ? "right" : last === i ? "wrong" : racing(i) ? "picked" : "idle");
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {TR.map((t, i) => (
          <button
            key={t.name}
            type="button"
            aria-label={`ছবি ${i + 1}`}
            onClick={() => tap(i)}
            className={`cursor-pointer overflow-hidden rounded-xl border-2 p-0.5 transition-colors duration-200 motion-reduce:transition-none ${LOOK[look(i)]}`}
          >
            <TR_Thumb m={t.m} race={found[i] || last === i || racing(i)} go={racing(i) ? p.k >= 1 : found[i] || last === i} verdict={found[i] || last === i} />
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full" style={{ background: L1 }} /> আগে 2 গুণ, পরে machine
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full" style={{ background: L2 }} /> উল্টা
        </span>
      </div>
      {last !== null && <Nope key={miss}>{TR[last].why}</Nope>}
      {last === null && got > 0 && got < need && <div className={`mt-2 text-center text-sm text-accent-text ${FADE}`}>দুই lane মিলেছে. আরো {need - got} টা বাকি.</div>}
      <Task done={got === need}>যে তিনটা ছবি machine এর বানানো, সেগুলোতে tap করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The end's action: Som's rule with its +1 circled. The failed race sits
//     on the road; the reader rubs out the +1, and the race runs again: the
//     lanes meet. What's left is the swap, a matrix.

const DP_F = makeFrame(-0.5, 4.5, -0.5, 4.5, 30, 6);

export function DropPlusOne() {
  const pass = useGate();
  const [erased, setErased] = useSeed("erased", false);
  const race = useRace("ran", true);
  const erase = () => {
    if (erased) return;
    setErased(true);
    race.go(() => pass("+1 বাদ দিলে swap চলে. +1 টা আসলে b."));
  };
  return (
    <>
      <div className="mb-2 text-center text-sm">
        <span className="font-semibold">সোমের swap:</span>{" "}
        <span className="font-mono">
          (g₁, g₂) → (g₂, g₁
          {!erased ? (
            <button type="button" onClick={erase} aria-label="+ 1 মুছে দিন" className="mx-1 cursor-pointer rounded-full border-2 border-dashed border-danger px-1.5 font-mono text-danger hover:bg-danger/10">
              + 1
            </button>
          ) : null}
          )
        </span>
      </div>
      <LN_Race f={DP_F} m={erased ? swap : somRule} r={{ kind: "scale", c: 2, v: [1, 1] }} k={race.k} max="max-w-[9.5rem]" label="সোমের নিয়মের race, (1, 1) কে 2 গুণ" />
      {erased && race.ran && <div className={`mt-1 text-center text-sm text-muted ${FADE}`}>যা থাকলো, ওটা আয়না: matrix এর column (0, 1) আর (1, 0).</div>}
      <Task done={erased && race.ran}>সোমের নিয়ম থেকে + 1 টা মুছে দিন. Race আবার চলবে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. The computer club's room: a whiteboard with the four rules on
// the left, a projector screen with the road on the right, the old desktop on
// a table. The art sir isn't in this one.

const PJ_F = makeFrame(-1, 7, -1, 6, 10, 2);

/** The projector screen on the wall, showing the road run through `move`. */
function S_Proj({ x = 206, y = 14, move = idMove, children }: { x?: number; y?: number; move?: Move; children?: ReactNode }) {
  const w = 96;
  const h = 66;
  return (
    <g>
      <path d={`M${x + w / 2} ${y - 10}V${y}`} stroke="#64748b" strokeWidth={1.2} />
      <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={2} fill="#e2e8f0" stroke="#94a3b8" />
      <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${PJ_F.W} ${PJ_F.H}`} preserveAspectRatio="xMidYMid slice">
        <RoadBed f={PJ_F} />
        <ChalkGrid f={PJ_F} move={move} />
        <Alpana f={PJ_F} move={move} />
        <Pillar f={PJ_F} />
        {children}
      </svg>
    </g>
  );
}

/** The whiteboard: the four rules; optionally Karim's struck, Som's +1 ringed, Som's two lanes drawn under. */
function S_Board({ strike = false, ring = false, lanes = false, name }: { strike?: boolean; ring?: boolean; lanes?: boolean; name?: string }) {
  const x = 10;
  const y = 18;
  const rows = [
    ["পদ্ম", "(2g₁+g₂, g₁+2g₂)"],
    ["নাসিব", "(g₁+1, g₂+1)"],
    ["করিম", "(g₁², g₂)"],
    ["সোম", "(g₂, g₁+1)"],
  ];
  return (
    <g>
      <rect x={x} y={y} width={120} height={84} rx={2} fill="white" stroke="#94a3b8" strokeWidth={2} />
      {rows.map(([who, r], i) => (
        <g key={who}>
          <text x={x + 5} y={y + 14 + i * 11} fontSize={7} fontWeight={700} fill="#1d4ed8">
            {who}
          </text>
          <text x={x + 32} y={y + 14 + i * 11} fontSize={7} fontFamily={MONO} fill={INK}>
            {r}
          </text>
        </g>
      ))}
      {strike && <Draw d={`M${x + 3} ${y + 33.5}H${x + 80}`} strokeWidth={1.4} ms={700} className="stroke-[#e11d48]" />}
      {ring && <ellipse cx={x + 66} cy={y + 44.5} rx={8} ry={5.5} fill="none" stroke="#e11d48" strokeWidth={1.1} className={POP} />}
      {lanes && (
        <g>
          <Draw d={`M${x + 12} ${y + 62}H${x + 108}`} strokeWidth={2} ms={600} className="stroke-[#38bdf8]" />
          <Draw d={`M${x + 12} ${y + 75}H${x + 108}`} strokeWidth={2} ms={600} delay={300} className="stroke-[#c084fc]" />
          <text x={x + 5} y={y + 64} fontSize={6} fontWeight={700} fill={INK}>
            1
          </text>
          <text x={x + 5} y={y + 77} fontSize={6} fontWeight={700} fill={INK}>
            2
          </text>
          {name && (
            <text x={x + 112} y={y + 56} textAnchor="end" fontSize={6.5} fontWeight={700} fill={INK} className={FADE}>
              {name}
            </text>
          )}
        </g>
      )}
    </g>
  );
}

/** The club's old desktop on a table. */
function S_Desk({ x }: { x: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={118} width={56} height={5} rx={1} fill="#92400e" />
      <rect x={x + 4} y={123} width={3.5} height={27} fill="#78350f" />
      <rect x={x + 48} y={123} width={3.5} height={27} fill="#78350f" />
      <rect x={x + 14} y={96} width={28} height={19} rx={1.5} fill="#1e293b" />
      <rect x={x + 16} y={98} width={24} height={15} fill="#334155" />
      <rect x={x + 26} y={115} width={4} height={3} fill="#1e293b" />
    </g>
  );
}

/** A tea cup in Nasib's hand. */
function S_Cup({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 3.5} ${y - 5}h7l-1 6h-5Z`} fill="white" stroke={INK} strokeOpacity={0.5} strokeWidth={0.6} />
      <path d={`M${x + 3.3} ${y - 3.5}q2.5 0.5 0 2.5`} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={0.6} />
    </g>
  );
}

// 1a · The club room after school. Karim taps his rule and says his line;
//      Nasib says his is simpler; Samin turns to the screen. Which run is
//      left to the bet.

export function ClubRoom({}: Story) {
  const s = useScene(3, [600, 2600, 2400, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="Computer club এর ঘর; whiteboard এ চারটা নিয়ম, দেয়ালে রাস্তার ছবি; করিম বললো বর্গ করাও তো একটা নিয়ম, নিয়ম হইলেই চলবো; নাসিব বললো আমারটা আরো সোজা, শুধু সরানো">
        <S_Board />
        <S_Proj />
        <Person who="samin" x={48} y={150} label facing={k >= 3 ? 1 : -1} arm={k >= 3 ? "hold" : "down"} />
        <Person who="karim" x={k >= 1 ? 112 : 140} y={150} label facing={-1} walking={k === 1} arm={k === 1 ? "point" : "down"} mood={k >= 1 ? "smug" : "plain"} />
        <Person who="nasib" x={190} y={150} label facing={-1} arm={k === 2 ? "wave" : "down"} mood={k >= 2 ? "smug" : "plain"} />
        <Person who="som" x={276} y={150} label facing={-1} arm="hold" />
        {k === 1 && <Bubble x={112} y={84} side="right" lines={["বর্গ করাও তো একটা নিয়ম.", "নিয়ম হইলেই চলবো."]} />}
        {k === 2 && <Bubble x={190} y={84} side="left" lines={["আমারটা আরো সোজা.", "শুধু সরানো."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · Samin types numbers; the road on the screen tilts, turns, grows. Nasib
//     stands by with a cup of tea gone cold. That the corner never moves is
//     left to the screen.

const S2_MOVES: Move[] = [
  idMove,
  byCols([
    [1, 0],
    [0.6, 1],
  ]),
  byCols(turnCols(25)),
  byCols([
    [1.4, 0],
    [0, 1.4],
  ]),
];

export function SaminTypes({}: Story) {
  const s = useScene(3, [600, 1400, 1400, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সামিন desktop এ number বদলাচ্ছে; পর্দায় রাস্তা কাত হয়, ঘোরে, বড় হয়; নাসিব পাশে দাঁড়িয়ে, হাতে চায়ের কাপ">
        <S_Board />
        <S_Proj move={S2_MOVES[k]} />
        <S_Desk x={132} />
        <Person who="samin" x={120} y={150} label arm="hold" />
        <Person who="nasib" x={236} y={150} label facing={-1} arm="hold" />
        <S_Cup x={228} y={122} />
      </Stage>
    </StoryFrame>
  );
}

// 3a · Karim: the square of 0 is 0, the pillar doesn't move. Som closes his
//      book, walks to the board and draws two lanes.

export function SomLanes({}: Story) {
  const s = useScene(3, [600, 2400, 1800, 2800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="করিম বললো 0 এর বর্গ 0, খুঁটি নড়ে না; সোম বোর্ডে দুইটা lane আঁকলো; বললো এক lane এ আগে যোগ পরে machine, আরেকটায় উল্টা">
        <S_Board lanes={k >= 2} />
        <S_Proj />
        <Person who="karim" x={k >= 2 ? 196 : 150} y={150} label facing={-1} walking={k === 2} arm={k === 1 ? "point" : "down"} />
        <Person who="som" x={k >= 2 ? 96 : 280} y={150} label facing={-1} walking={k === 2} arm={k >= 2 ? "point" : "hold"} />
        {k === 1 && <Bubble x={150} y={84} side="left" lines={["0 এর বর্গ 0.", "খুঁটি নড়ে না."]} />}
        {k >= 3 && <Bubble x={96} y={84} side="right" lines={["আগে যোগ, পরে machine.", "আরেক lane এ উল্টা."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Nasib puts his cup down: now run mine. Som writes his name over the lanes.

export function NasibSlide({}: Story) {
  const s = useScene(2, [600, 2200, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="নাসিব কাপ নামিয়ে বললো এবার আমারটা চালাও; সোম lane এর মাথায় নাসিবের নাম লিখলো">
        <S_Board lanes name={k >= 2 ? "নাসিব" : undefined} />
        <S_Proj />
        <S_Desk x={196} />
        {k >= 1 && <S_Cup x={216} y={116} />}
        <Person who="som" x={96} y={150} label facing={-1} arm={k >= 2 ? "point" : "down"} />
        <Person who="nasib" x={176} y={150} label facing={-1} arm={k >= 1 ? "down" : "hold"} />
        {k < 1 && <S_Cup x={168} y={122} />}
        {k === 1 && <Bubble x={176} y={84} side="left" lines={["এবার আমারটা চালাও."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · Karim: the pillar doesn't move in mine. Run it. Som writes Karim's name.

export function KarimSquare({}: Story) {
  const s = useScene(2, [600, 2200, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="করিম বললো আমারটায় খুঁটি নড়ে না, চালাও; সোম lane এর মাথায় করিমের নাম লিখলো">
        <S_Board lanes name={k >= 2 ? "করিম" : undefined} />
        <S_Proj />
        <Person who="som" x={96} y={150} label facing={-1} arm={k >= 2 ? "point" : "down"} />
        <Person who="karim" x={186} y={150} label facing={-1} mood="smug" arm={k === 1 ? "point" : "down"} />
        <Person who="nasib" x={250} y={150} label facing={-1} />
        {k === 1 && <Bubble x={186} y={84} side="left" lines={["আমারটায় খুঁটি", "নড়ে না. চালাও."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Samin: three matrices in a row. Som: won't work. Samin: let's see.

export function SaminStacks({}: Story) {
  const s = useScene(3, [600, 2200, 1400, 1400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সামিন বললো তিনটা matrix পরপর চালাই; সোম বললো হবে না; সামিন বললো দেখি">
        <S_Board strike />
        <S_Proj />
        <S_Desk x={120} />
        <Person who="samin" x={108} y={150} label arm={k === 1 ? "point" : "hold"} />
        <Person who="som" x={236} y={150} label facing={-1} arm="hold" />
        {k === 1 && <Bubble x={108} y={84} side="right" lines={["তিনটা matrix", "পরপর চালাই."]} />}
        {k === 2 && <Bubble x={236} y={84} side="left" lines={["হবে না."]} />}
        {k === 3 && <Bubble x={108} y={84} side="right" lines={["দেখি."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Evening, the last test run. Karim's rule struck through; Samin rings
//     the +1 in Som's rule. What the ring means is the screen's.

export function DisplayRuns({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সন্ধ্যা, display এর শেষ test; পর্দায় পদ্মের move চলছে; বোর্ডে করিমের নিয়ম কাটা; সোমের নিয়মের +1 এর চারপাশে সামিন একটা গোল দাগ দিলো">
        <S_Board strike ring={k >= 2} />
        <S_Proj move={k >= 3 ? partway(lotus, 0.3) : idMove} />
        <Person who="samin" x={k >= 2 ? 92 : 150} y={150} label facing={-1} walking={k === 2} arm={k >= 2 ? "point" : "down"} />
        <Person who="som" x={210} y={150} label facing={-1} />
        <Person who="karim" x={268} y={150} label facing={-1} />
      </Stage>
    </StoryFrame>
  );
}

// 9b · Bridge. Samin runs the club's old shear; its two columns are the roads
//      to Fahim's school from 5.5. The machine says (5, 3). Fahim remembers (−1, 3).

const S9_SHEAR = byCols([
  [1, 0],
  [1, 1],
]);

export function FahimNotices({}: Story) {
  const s = useScene(2, [600, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="পর্দায় কাত করা রাস্তা, দুই column (1, 0) আর (1, 1); machine বললো (2, 3) যায় (5, 3) এ; ফাহিমের মনে পড়লো (−1, 3)">
        <S_Board strike ring />
        <S_Proj move={S9_SHEAR}>
          <Rope f={PJ_F} to={[1, 0]} which={1} />
          <Rope f={PJ_F} to={[1, 1]} which={2} />
        </S_Proj>
        <S_Desk x={140} />
        <Person who="samin" x={128} y={150} label arm="hold" />
        <Person who="fahim" x={196} y={150} label arm={k >= 1 ? "point" : "down"} />
        {k >= 1 && <Card x={256} y={100} text="(2, 3) → (5, 3)" tone="blue" />}
        {k >= 2 && <Bubble x={196} y={84} side="left" tone="think" lines={["(−1, 3)?"]} />}
      </Stage>
    </StoryFrame>
  );
}

/** The room's one window, its light going from afternoon to dusk. */
function S_Window({ x, y, dusk }: { x: number; y: number; dusk: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={46} height={40} rx={2} fill={dusk ? "#fb923c" : "#fef3c7"} stroke="#92400e" strokeWidth={2} className="transition-[fill] duration-1000 motion-reduce:transition-none" />
      <path d={`M${x + 23} ${y}V${y + 40}M${x} ${y + 20}H${x + 46}`} stroke="#92400e" strokeWidth={1.5} />
    </g>
  );
}

// 7a · Dusk. Som's rule is the one left on the board; Samin has found three
//      more in the club's old khata. What the three say is the screen's.

export function SaminKhata({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="বাইরে আলো কমে আসছে; বোর্ডে সোমের নিয়মটা বাকি; সামিন club এর পুরানো খাতা থেকে আরো তিনটা নিয়ম পেয়েছে">
        <S_Board strike />
        <S_Window x={150} y={22} dusk={k >= 1} />
        <S_Proj />
        {k >= 2 && <rect x={12} y={57} width={116} height={11} rx={3} fill="none" stroke="#f59e0b" strokeWidth={1.6} className={POP} />}
        <rect width={320} height={180} fill="#1e1b4b" opacity={k >= 1 ? 0.12 : 0} className="pointer-events-none transition-opacity duration-1000 motion-reduce:transition-none" />
        <Person who="som" x={150} y={150} label facing={-1} arm={k >= 2 ? "point" : "down"} />
        <Person who="samin" x={k >= 3 ? 216 : 272} y={150} label facing={-1} walking={k === 3} arm="hold" />
        {/* the old khata in Samin's hand, and opened big over his head */}
        <g style={{ transform: `translate(${k >= 3 ? 216 : 272}px, 0px)`, transitionDuration: "1200ms" }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
          <rect x={-22} y={104} width={10} height={12} rx={1} fill="#7c2d12" />
        </g>
        {k >= 3 && (
          <g className={POP}>
            <rect x={228} y={36} width={80} height={46} rx={3} fill="#fef9c3" stroke="#a16207" strokeWidth={1.2} />
            <path d="M268 36V82" stroke="#a16207" strokeWidth={0.8} />
            {[0, 1, 2].map((j) => (
              <g key={j}>
                <text x={272} y={49 + j * 12} fontSize={7} fontFamily={MONO} fontWeight={700} fill={INK}>
                  {j + 1}.
                </text>
                <path d={`M281 ${47 + j * 12}q5 -3 10 0t12 0`} stroke="#1d4ed8" strokeWidth={1} fill="none" />
              </g>
            ))}
            <path d="M233 48h28M233 58h22M233 68h26" stroke="#a16207" strokeOpacity={0.35} strokeWidth={0.8} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 8a · The club's old album comes out of the cupboard: six road pictures, each
//      moved by some rule. Which were the machine's is a "?" on every one.

const S8_F = makeFrame(-4.5, 5.5, -3.5, 4.5, 6, 2);

export function ClubAlbum({}: Story) {
  const s = useScene(3, [600, 1400, 1800, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="আলমারিতে club এর পুরানো album; খুললে ছয়টা ছবি, প্রত্যেকটায় রাস্তা আর পদ্ম, কোনো একটা নিয়মে সরানো; কোনটা machine এর বানানো লেখা নাই">
        {/* the cupboard: its left door swings open on beat 1 */}
        <rect x={22} y={52} width={72} height={98} rx={2} fill="#92400e" />
        <rect x={60} y={56} width={30} height={90} fill="#b45309" />
        {k >= 1 ? (
          <>
            <rect x={26} y={56} width={34} height={90} fill="#451a03" className={FADE} />
            <path d="M26 56l-12 -4v98l12 -4Z" fill="#b45309" className={FADE} />
            {k === 1 && <rect x={32} y={112} width={22} height={28} rx={1.5} fill="#be123c" className={POP} />}
          </>
        ) : (
          <rect x={26} y={56} width={32} height={90} fill="#b45309" />
        )}
        <circle cx={56} cy={100} r={1.6} fill="#fde68a" />
        <circle cx={64} cy={100} r={1.6} fill="#fde68a" />
        {k >= 2 && (
          <g className={POP}>
            <rect x={112} y={22} width={196} height={118} rx={4} fill="#be123c" />
            <rect x={117} y={26} width={186} height={110} rx={2} fill="#fffbeb" />
            <path d="M210 26V136" stroke="#e7e5e4" strokeWidth={1.4} />
            {TR.map((t, i) => {
              const x = 123 + (i % 3) * 60 + (i % 3 === 2 ? 4 : 0);
              const y = 34 + Math.floor(i / 3) * 51;
              return (
                <g key={t.name}>
                  <rect x={x - 1.5} y={y - 1.5} width={55} height={45} fill="white" stroke="#d6d3d1" />
                  <svg x={x} y={y} width={52} height={42} viewBox={`0 0 ${S8_F.W} ${S8_F.H}`} preserveAspectRatio="xMidYMid slice">
                    <RoadBed f={S8_F} />
                    <ChalkGrid f={S8_F} move={t.m} x0={-4} x1={5} y0={-3} y1={4} />
                    <Alpana f={S8_F} move={t.m} fish={false} />
                    <Pillar f={S8_F} at={t.m([0, 0])} off={!near(t.m([0, 0]), [0, 0])} />
                  </svg>
                  {k >= 3 && (
                    <text x={x + 45} y={y + 14} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fde047" stroke="#374151" strokeWidth={2} paintOrder="stroke" className={POP} style={{ transitionDelay: `${i * 90}ms` }}>
                      ?
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · Four rules, one machine that reads only four numbers. Which rules can
//      be written as four numbers is left as "?".

const X1_SAY = ["চারটা নিয়ম, একটা machine.", "Machine নিয়ম পড়তে পারে না.", "ও চায় শুধু চারটা number, একটা matrix.", "কোন নিয়মকে চারটা number এ লেখা যায়?"];

export function RulesIntoMachine() {
  const s = useScene(3, [600, 1600, 2000, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <svg viewBox="0 0 250 96" role="img" aria-label="চারটা নিয়মের কাগজ machine এর দিকে; machine চায় চারটা number; কোনগুলো লেখা যায় প্রশ্নবোধক" className="mx-auto block h-auto w-full max-w-[16rem]">
        {MB_RULES.map(([who], i) => (
          <g key={who} className="transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: k >= 1 ? `translate(${20 + i * 4}px, 0px)` : "translate(0px, 0px)" }}>
            <rect x={4} y={8 + i * 21} width={62} height={17} rx={3} fill="white" stroke={INK} strokeOpacity={0.35} />
            <text x={35} y={20 + i * 21} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#1d4ed8">
              {who}
            </text>
          </g>
        ))}
        <rect x={112} y={20} width={64} height={48} rx={5} fill="#1e293b" />
        <rect x={117} y={25} width={54} height={34} rx={2} fill="#334155" />
        <text x={144} y={80} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK}>
          machine
        </text>
        {k >= 2 && (
          <g className={FADE}>
            <path d="M128 30h-3v24h3M160 30h3v24h-3" stroke="#e2e8f0" strokeWidth={1.4} fill="none" />
            {[0, 1, 2, 3].map((j) => (
              <rect key={j} x={132 + (j % 2) * 16} y={33 + Math.floor(j / 2) * 10} width={9} height={7} rx={1} fill="none" stroke="#e2e8f0" strokeWidth={1} />
            ))}
          </g>
        )}
        {k >= 3 && (
          <text x={214} y={56} textAnchor="middle" fontSize={30} fontWeight={800} fill="#64748b" className={POP}>
            ?
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Zero stays zero. Three pairs of ropes; the corner walks 0 times one
//      rope and 0 times the other, and stays on the pillar each time.

const X2_F = makeFrame(-2.5, 3.5, -0.8, 3.5, 24, 6);
const X2_ROPES: Cols[] = [
  [
    [1, 0],
    [0, 1],
  ],
  LN_G,
  [
    [-1, 2],
    [3, 1],
  ],
  [
    [0, 3],
    [-2, 0],
  ],
];
const X2_SAY = ["খুঁটির কোণা মানে (0, 0).", "দড়ি (2, 1) আর (1, 2). 0 বার আর 0 বার হাঁটা: (0, 0).", "দড়ি অন্য দিকে. তবু 0 বার আর 0 বার: (0, 0).", "দড়ি যেখানেই যাক, শূন্য বার হাঁটলে খুঁটিতেই থাকা."];

export function ZeroStays() {
  const s = useScene(3, [600, 2200, 2000, 2400]);
  const k = s.k;
  const cols = X2_ROPES[k];
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <LN_Road f={X2_F} label="তিন জোড়া দড়ি, প্রত্যেকবার খুঁটির কোণা খুঁটিতেই থাকে" max="max-w-[11rem]">
        <ChalkGrid f={X2_F} move={byCols(cols)} ghost x0={-3} x1={4} y0={-1} y1={4} />
        <g key={k} className={FADE}>
          <Rope f={X2_F} to={cols[0]} which={1} />
          <Rope f={X2_F} to={cols[1]} which={2} />
        </g>
        <Pillar f={X2_F} />
        <circle cx={X2_F.sx(0)} cy={X2_F.sy(0)} r={8} fill="none" stroke="#fde047" strokeWidth={1.6} />
      </LN_Road>
    </Scene>
  );
}

// 3½ · Why 6.3's ropes were enough. (2, 1) is cut into rope pieces (e₁, e₁,
//      e₂); each piece moves along its rope; joined up they stop at (5, 4),
//      where moving (2, 1) whole puts it too.

const X3_F = makeFrame(-0.5, 5.5, -0.5, 4.5, 26, 6);
const X3_SAY = ["(2, 1): দুই বার প্রথম দড়ি, এক বার দ্বিতীয়.", "টুকরা করলাম: দুইটা e₁, একটা e₂.", "প্রত্যেক টুকরা তার দড়ির নতুন জায়গায়: (2, 1), (2, 1), (1, 2).", "জোড়া দিলে (5, 4). পুরাটা একবারে সরালেও (5, 4)."];

export function SplitMoveJoin() {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  const pieces: [XY, XY, keyof typeof TONE][] =
    k >= 2
      ? [
          [[0, 0], [2, 1], "amber"],
          [[2, 1], [4, 2], "amber"],
          [[4, 2], [5, 4], "teal"],
        ]
      : [
          [[0, 0], [1, 0], "amber"],
          [[1, 0], [2, 0], "amber"],
          [[2, 0], [2, 1], "teal"],
        ];
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <LN_Road f={X3_F} label="(2, 1) কে দড়ির টুকরায় ভাঙা, টুকরাগুলো সরানো, আবার জোড়া দেওয়া; শেষে (5, 4), পুরাটা একবারে সরালেও একই" max="max-w-[12rem]">
        <ChalkGrid f={X3_F} move={idMove} x0={0} x1={5} y0={0} y1={4} />
        <Pillar f={X3_F} />
        {k === 0 && <LN_Arrow f={X3_F} to={[2, 1]} tone="chalk" />}
        {k >= 1 && (
          <g key={k >= 2 ? "moved" : "cut"} className={FADE}>
            {pieces.map(([a, b, t], i) => (
              <LN_Arrow key={i} f={X3_F} from={a} to={b} tone={t} w={2} />
            ))}
          </g>
        )}
        {k >= 3 && (
          <>
            <LN_Arrow f={X3_F} to={[5, 4]} tone="l1" dashed />
            <LN_Flag f={X3_F} at={[5, 4]} lane={1} />
            <LN_Flag f={X3_F} at={[5, 4]} lane={2} />
          </>
        )}
      </LN_Road>
    </Scene>
  );
}

// 4½ · The slide on the road, and the × 0 race on top: lane 1 lands exactly
//      where the pillar's corner went; lane 2 ends on the pillar.

const X4_F = makeFrame(-1, 7.5, -1, 6.5, 22, 6);
const X4_SAY = ["নাসিবের slide.", "পুরা রাস্তা এক ঘর ডানে, এক ঘর উপরে. খুঁটির কোণাও.", "Lane 1: 0 গুণ মানে খুঁটি থেকে শুরু. Machine তাকে পাঠালো কোণার নতুন জায়গায়.", "Lane 2 থামে খুঁটিতেই. 0 গুণের race আর খুঁটির পরীক্ষা একই জিনিস."];

export function CornerOff() {
  const s = useScene(3, [600, 1800, 2600, 2600]);
  const k = s.k;
  const [t] = useTween([k >= 1 ? 1 : 0], 900);
  const mv = partway(slide, t);
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <LN_Road f={X4_F} label="নাসিবের slide এ পুরা রাস্তা সরে, খুঁটির কোণাও; 0 গুণের race এ lane 1 থামে কোণার নতুন জায়গায়, lane 2 খুঁটিতে" max="max-w-[12.5rem]">
        <ChalkGrid f={X4_F} move={mv} ghost x0={-1} x1={8} y0={-1} y1={7} />
        <Alpana f={X4_F} move={mv} />
        <Pillar f={X4_F} at={mv([0, 0])} off={k >= 1} />
        {k >= 2 && <LN_Flag f={X4_F} at={[1, 1]} lane={1} />}
        {k >= 3 && (
          <>
            <LN_Flag f={X4_F} at={[0, 0]} lane={2} />
            <path d={`M${X4_F.sx(0)} ${X4_F.sy(0)}L${X4_F.sx(1)} ${X4_F.sy(1)}`} stroke={BAD} strokeWidth={2.2} strokeDasharray="3 2.5" className={FADE} />
          </>
        )}
      </LN_Road>
    </Scene>
  );
}

// 5½ · Why the squares stop being equal: 0, 1, 2, 3 squared are 0, 1, 4, 9;
//      the gaps become 1, 3, 5.

const X5_SAY = ["সমান ফাঁকে 0, 1, 2, 3.", "প্রথম slot বর্গ করলে: 0, 1, 4, 9.", "ফাঁক 1, 3, 5. সমান থাকলো না. তাই ঘরও সমান থাকে না."];

export function SquareGaps() {
  const s = useScene(2, [600, 2000, 2400]);
  const k = s.k;
  const top = (i: number) => 22 + i * 26;
  const bot = (i: number) => 22 + i * i * 22.5;
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <svg viewBox="0 0 244 92" role="img" aria-label="উপরে 0 1 2 3 সমান ফাঁকে; নিচে বর্গ করে 0 1 4 9, ফাঁক 1 3 5" className="mx-auto block h-auto w-full max-w-[16rem]">
        <path d={`M12 22H236`} stroke={INK} strokeOpacity={0.3} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle cx={top(i)} cy={22} r={3.5} fill="#1d4ed8" />
            <text x={top(i)} y={14} textAnchor="middle" fontSize={9} fontFamily={MONO} fontWeight={700} fill={INK}>
              {i}
            </text>
          </g>
        ))}
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M12 66H236`} stroke={INK} strokeOpacity={0.3} />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <path d={`M${top(i)} 26L${bot(i)} 62`} stroke="#1d4ed8" strokeOpacity={0.35} strokeDasharray="2 2" />
                <circle cx={bot(i)} cy={66} r={3.5} fill="#b45309" />
                <text x={bot(i)} y={82} textAnchor="middle" fontSize={9} fontFamily={MONO} fontWeight={700} fill={INK}>
                  {i * i}
                </text>
              </g>
            ))}
          </g>
        )}
        {k >= 2 &&
          [1, 2, 3].map((i) => (
            <text key={i} x={(bot(i - 1) + bot(i)) / 2} y={60} textAnchor="middle" fontSize={8.5} fontFamily={MONO} fontWeight={700} fill="#e11d48" className={POP}>
              {2 * i - 1}
            </text>
          ))}
      </svg>
    </Scene>
  );
}

// 6½ · Three matrices fold into one; with a bend between them they don't.

const X6_SAY = ["তিনটা matrix, পরপর.", "একসাথে একটাই matrix. 100 টা হলেও একটা.", "মাঝে একটা বাঁক রাখলে?", "আর এক হয় না. প্রত্যেক layer এর কাজ আলাদা থাকে."];

function X6_Card({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <rect x={x} y={y} width={30} height={26} rx={3} fill="white" stroke={INK} strokeOpacity={0.35} />
      <path d={`M${x + 7} ${y + 5}h-2v16h2M${x + 23} ${y + 5}h2v16h-2`} stroke={INK} strokeWidth={1.2} fill="none" />
      <text x={x + 15} y={y + 17} textAnchor="middle" fontSize={10} fontWeight={800} fill={INK}>
        {text}
      </text>
    </g>
  );
}

export function ThreeIntoOne() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const slide3 = (i: number) => (k >= 1 ? `translate(${(1 - i) * 44}px, 0px)` : "translate(0px, 0px)");
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      <svg viewBox="0 0 240 92" role="img" aria-label="তিনটা matrix জোড়া লেগে একটা হয়; মাঝে বাঁক থাকলে আর জোড়া লাগে না" className="mx-auto block h-auto w-full max-w-[16rem]">
        {["A", "B", "C"].map((t, i) => (
          <g key={t} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none" style={{ transform: slide3(i) }} opacity={k >= 1 && i !== 1 ? 0 : 1}>
            <X6_Card x={61 + i * 44} y={6} text={k >= 1 ? "" : t} />
          </g>
        ))}
        {k >= 1 && (
          <text x={120} y={46} textAnchor="middle" fontSize={8} fontWeight={700} fill="#0d9488" className={FADE}>
            একটাই
          </text>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <X6_Card x={40} y={58} text="A" />
            <path d="M80 71q6 -9 12 0t12 0t12 0" stroke="#e11d48" strokeWidth={2} fill="none" strokeLinecap="round" />
            <X6_Card x={124} y={58} text="B" />
            <path d="M162 71q6 -9 12 0t12 0" stroke="#e11d48" strokeWidth={2} fill="none" strokeLinecap="round" />
          </g>
        )}
        {k >= 3 && (
          <text x={214} y={75} textAnchor="middle" fontSize={8} fontWeight={700} fill="#e11d48" className={POP}>
            আলাদা
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 8½ · Two traps side by side: the squash looks broken and passes; the wave
//      keeps the pillar and fails. Lamps: pillar, then race.

const X8_SAY = ["চ্যাপ্টা আর ঢেউ.", "খুঁটি: দুইটাতেই জায়গায়.", "Race: চ্যাপ্টা পাস. ঢেউ ফেল.", "দেখতে কেমন, তাতে কিছু যায় আসে না. Race যা বলে, তাই."];

function X8_Lamp({ on, bad, text }: { on: boolean; bad?: boolean; text: string }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className={`inline-block size-2.5 rounded-full transition-colors duration-300 motion-reduce:transition-none ${!on ? "bg-foreground/15" : bad ? "bg-danger" : "bg-accent"}`} />
      {text}
    </span>
  );
}

export function WaveTrap() {
  const s = useScene(3, [600, 1600, 2000, 2400]);
  const k = s.k;
  const pics = [TR[3], TR[2]];
  return (
    <Scene scene={s} caption={say(X8_SAY, k)}>
      <div className="mx-auto grid max-w-[15rem] grid-cols-2 gap-2">
        {pics.map((t) => (
          <div key={t.name}>
            <TR_Thumb m={t.m} race={k >= 2} />
            <div className="mt-1 flex justify-center gap-2">
              <X8_Lamp on={k >= 1} text="খুঁটি" />
              <X8_Lamp on={k >= 2} bad={!t.lin} text="race" />
            </div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// 9½ · The bet settled, rule by rule.

const X9_BETS: [string, string, "no" | "half" | "yes"][] = [
  ["পদ্ম", "matrix", "yes"],
  ["নাসিব", "কোণা সরে", "no"],
  ["করিম", "ঘর বাঁকে", "no"],
  ["সোম", "+1 ছাড়া", "half"],
];
const X9_SAY = ["চারটা নিয়ম.", "পদ্মের move: চলে.", "নাসিবের slide: চলে না. খুঁটির কোণা সরে.", "করিমের বর্গ: চলে না. ঘর সমান থাকে না.", "সোমের swap: +1 বাদে চলে. +1 টা আলাদা, b."];

function X9_Mark({ kind }: { kind: "no" | "half" | "yes" }) {
  if (kind === "yes") return <path d="M-5 0l3.5 4l7 -8" fill="none" stroke="#0d9488" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />;
  if (kind === "no") return <path d="M-4 -4l8 8m0 -8l-8 8" stroke="#e11d48" strokeWidth={2.4} strokeLinecap="round" />;
  return <path d="M-5 0h10" stroke="#f59e0b" strokeWidth={2.4} strokeLinecap="round" />;
}

export function BetSettled() {
  const s = useScene(4, [600, 1600, 2000, 2000, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X9_SAY, k)}>
      <svg viewBox="0 0 240 70" role="img" aria-label="বাজির হিসাব: পদ্ম চলে, নাসিব আর করিমেরটা চলে না, সোমেরটা +1 বাদে চলে" className="mx-auto block h-auto w-full max-w-[17rem]">
        {X9_BETS.map(([who, t, kind], i) => (
          <g key={who} transform={`translate(${8 + i * 58} 8)`}>
            <rect width={52} height={40} rx={5} fill="white" stroke={INK} strokeOpacity={0.3} />
            <text x={26} y={15} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={INK}>
              {who}
            </text>
            {k >= i + 1 && (
              <text x={26} y={30} textAnchor="middle" fontSize={7.5} fill={INK} className={FADE}>
                {t}
              </text>
            )}
            {k >= i + 1 && (
              <g transform="translate(26 56)" className={POP}>
                <X9_Mark kind={kind} />
              </g>
            )}
          </g>
        ))}
      </svg>
    </Scene>
  );
}

// 9c · Samin's extra line: first the matrix, then + b, separately. For Nasib's
//      slide the matrix keeps the road as it is (the ropes stay on (1, 0) and
//      (0, 1)); then + (1, 1) slides the whole road, pillar's corner and all.
//      The two boxes read wx + b at the end.

const X9C_SAY = ["আগে matrix, তারপর আলাদা করে + b.", "নাসিবের slide: matrix রাস্তা যেমন আছে তেমন রাখে.", "তারপর + (1, 1). পুরা রাস্তা এক ঘর ডানে, এক ঘর উপরে.", "4.1 এর wx + b এর b এটাই."];

export function MatrixThenB() {
  const s = useScene(3, [600, 1800, 2200, 2200]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 1 : 0], 900);
  const mv = partway(slide, t);
  const box = (on: boolean) => `rounded-lg border-2 px-2.5 py-0.5 font-mono text-sm font-semibold transition-colors duration-300 motion-reduce:transition-none ${on ? "border-accent bg-accent/15" : "border-border text-muted"}`;
  return (
    <Scene scene={s} caption={say(X9C_SAY, k)}>
      <div className="mb-1.5 flex items-center justify-center gap-1.5">
        <span className={box(k === 1 || k >= 3)}>{k >= 3 ? "wx" : "matrix"}</span>
        <svg viewBox="0 0 20 10" aria-hidden="true" className="w-5">
          <path d="M1 5H15M11 1.5L16 5L11 8.5" stroke="#94a3b8" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={box(k >= 2)}>+ b</span>
      </div>
      <LN_Road f={X4_F} label="নাসিবের slide দুই ধাপে: matrix রাস্তা যেমন আছে রাখে, তারপর + (1, 1) পুরা রাস্তা এক ঘর ডানে আর উপরে সরায়" max="max-w-[11rem]">
        <ChalkGrid f={X4_F} move={mv} ghost x0={-1} x1={8} y0={-1} y1={7} />
        <Alpana f={X4_F} move={mv} />
        {k === 1 && (
          <g className={FADE}>
            <Rope f={X4_F} to={[1, 0]} which={1} />
            <Rope f={X4_F} to={[0, 1]} which={2} />
          </g>
        )}
        <Pillar f={X4_F} at={mv([0, 0])} off={k >= 2} />
        {k >= 2 && <LN_Arrow f={X4_F} to={[1, 1]} tone="chalk" w={1.8} dashed />}
      </LN_Road>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  MachineBet: { start: {}, ticked: { picks: [true, false, true, false] }, sealed: { picks: [true, false, true, false], sealed: true } },
  TryToGrid: { start: {}, bent: { m: [2, 1, 0, 1], touched: [true, true, false, false] }, done: { m: [0, -1, 2, 1], touched: [true, true, true, true] } },
  TwoLanes: { start: {}, round1: { ran: true }, done: { round: 1, ran: true } },
  SlideFails: { start: {}, two: { ran: true, tried: [2] }, zero: { c: 0, ran: true, tried: [2, 0] } },
  SquareFails: { start: {}, race: { ran: true }, road: { ran: true, road: true } },
  StackThree: { start: {}, picked: { guess: 0, slots: [0, 2] }, done: { guess: 0, slots: [0, 2, 3], ran: true } },
  YourRules: { start: {}, wrong: { wrong: true, miss: 1, ran: true }, right: { ok: true, ran: true }, last: { i: 3, ok: true, ran: true } },
  TryRoadPictures: { start: {}, wrong: { last: 2, miss: 1 }, half: { found: [false, true, false, true, false, false] }, done: { found: [false, true, false, true, false, true] } },
  DropPlusOne: { start: {}, done: { erased: true } },
  // Story scenes and figures: `k` is the beat shown (no seed shows the last).
  ClubRoom: { rest: { k: 0 }, karim: { k: 1 }, nasib: { k: 2 }, done: {} },
  SaminTypes: { rest: { k: 0 }, done: {} },
  SomLanes: { karim: { k: 1 }, done: {} },
  NasibSlide: { says: { k: 1 }, done: {} },
  KarimSquare: { says: { k: 1 }, done: {} },
  SaminStacks: { samin: { k: 1 }, som: { k: 2 }, done: {} },
  DisplayRuns: { rest: { k: 0 }, done: {} },
  FahimNotices: { rest: { k: 0 }, done: {} },
  RulesIntoMachine: { rest: { k: 0 }, done: {} },
  ZeroStays: { rest: { k: 0 }, done: {} },
  SplitMoveJoin: { cut: { k: 1 }, moved: { k: 2 }, done: {} },
  CornerOff: { rest: { k: 0 }, lane1: { k: 2 }, done: {} },
  SquareGaps: { rest: { k: 0 }, done: {} },
  ThreeIntoOne: { rest: { k: 0 }, one: { k: 1 }, done: {} },
  WaveTrap: { lamps: { k: 1 }, done: {} },
  BetSettled: { half: { k: 2 }, done: {} },
  SaminKhata: { rest: { k: 0 }, dusk: { k: 1 }, som: { k: 2 }, done: {} },
  ClubAlbum: { rest: { k: 0 }, open: { k: 1 }, album: { k: 2 }, done: {} },
  MatrixThenB: { rest: { k: 0 }, keep: { k: 1 }, slide: { k: 2 }, done: {} },
};
