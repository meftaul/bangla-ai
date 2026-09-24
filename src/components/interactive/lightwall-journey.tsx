"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

import { Tup } from "@/components/journey/box";
import { Bubble, Card, Person, Robot, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, LOOK, Nope, POP, Scene, Ticks, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Plane, Star, clamp, makeFrame, same, type Drag, type Frame, type XY } from "@/components/journey/plane";
import {
  Beam,
  ColArrow,
  GOOD_LENS,
  HEARTS,
  Heart,
  KNOB_HEX,
  KNOB_SLOTS,
  KnobControl,
  LensCard,
  LightBhai,
  LightDot,
  LitRegion,
  OLD_LENS,
  Post,
  Projector,
  SPARE_LENS,
  STAGE_WALL_F,
  Scribble,
  StageBeam,
  StageWall,
  WALL_F,
  WALL_SLOTS,
  WallBed,
  WallGrid,
  apply,
  heartPath,
  onWall,
  projectorLens,
  sweepPts,
  useLensRun,
  wallFrame,
  type Cols,
} from "./light-kit";

// Screens for "Math for AI 7.2 — The light on the wall, where Ax can land",
// told as a Journey in the author's Bangla-English. The plan is
// 07_journey_specs.md, block 7.2.
//
// The evening before গায়ে হলুদ at নানাবাড়ি. The লাইট ভাই's old machine throws a
// dot on the whitewashed wall; Rina's chalk grid is tied at the বারান্দার
// খুঁটি's nail, (0, 0). Knob 1 pushes the dot (2, 1) a turn, knob 2
// (4, 2): the old lens is [[2, 4], [1, 2]] (Check Q5), though nobody says so
// yet. আপা wants three hearts: over the door (6, 3), over her window (2, 4),
// on the নারকেল গাছ side (8, 1). লাইট ভাই: two knobs, two directions, anywhere.
//
// Eight screens. 1 seals the bet: which hearts can it reach (WallBet). 2 the
// knobs, and every spot falls on one slanting line (KnobPlay). 3 why: knob 2's
// arrow lies on knob 1's, twice as long (WhyOneLine). 4 predict, then sweep the
// knobs every which way: the old lens lights one line, last night's lens
// G = [[2, 1], [1, 2]] the whole wall — the column space (AllTheLanding).
// 5 the decorator's spare [[1, 0], [0, 0]] lights only the pin's row
// (BrokenCorner). 6 Your turn: the three hearts, "যায়" backed by knob turns
// (YourSpots). 7 Try it: three lenses and the target (5, 4); only G, with
// turns (2, 1) (TryReach). 8 the good lens in, all three hearts (HeartsLight).
//
// After the screens: the story scenes (ApaPoints, MachineOn, SomReads,
// BagLens, SpareLens, LensSwap, CrackedLens) and the watch-only figures
// (ThreeHearts, TrailOneLine, StubbornAgain, ZeroWalk, MixToSpan, HowMany,
// BetSettled, SolvableOrNot), each numbered after its screen.
//
// The wall, the machine, the knobs and the lit region come from light-kit.tsx
// (shared with 7.3 and 7.4). The লাইট ভাই wears মামার look with his name drawn.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

const F = WALL_F;
const HEART_KEYS = ["door", "window", "tree"] as const;
const HEART_NAMES = ["দরজার উপরে", "জানালার উপরে", "নারকেল গাছের দিকে"];
const HEART_OF = ["দরজার উপরের", "জানালার উপরের", "নারকেল গাছের দিকের"];

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);
/** a tuple never breaks across lines, in any string */
const nb = (s: string) => s.replace(/, (?=[\d−])/g, ", ");

// ---------------------------------------------------------------------------
// Shared drawing: the wall as a sheet, and the two knobs under it.

/**
 * The wall on a Plane: lime, chalk grid, then `lit` (a lit region, under the
 * post), the post with its nail, then everything else.
 */
function LW_Wall({
  f = F,
  label,
  lit,
  drag,
  onKey,
  width = "max-w-[22rem]",
  children,
}: {
  f?: Frame;
  label: string;
  lit?: ReactNode;
  drag?: Drag;
  onKey?: (e: KeyboardEvent<SVGSVGElement>) => void;
  width?: string;
  children?: ReactNode;
}) {
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} drag={drag} onKey={onKey} className={`my-0! ${width}`}>
      <WallBed f={f} />
      <WallGrid f={f} nums={f.u >= 18} />
      {lit}
      <Post f={f} />
      {children}
    </Plane>
  );
}

/** The two knobs for a lens; a turn that would throw the dot off the wall is disabled. */
function LW_Knobs({ cols, ab, onTurn, disabled = false }: { cols: Cols; ab: XY; onTurn: (i: 0 | 1, d: -1 | 1) => void; disabled?: boolean }) {
  const can = (i: 0 | 1, d: -1 | 1) => {
    const n: XY = i === 0 ? [ab[0] + d, ab[1]] : [ab[0], ab[1] + d];
    return !disabled && Math.abs(n[i]) <= 6 && onWall(apply(cols, n));
  };
  return (
    <div className="mt-2 flex justify-center gap-6">
      <KnobControl which={1} turns={ab[0]} col={cols[0]} onTurn={(d) => onTurn(0, d)} canBack={can(0, -1)} canFwd={can(0, 1)} />
      <KnobControl which={2} turns={ab[1]} col={cols[1]} onTurn={(d) => onTurn(1, d)} canBack={can(1, -1)} canFwd={can(1, 1)} />
    </div>
  );
}

/** the dot, gliding to where the knobs put it */
function LW_GlideDot({ f = F, at, beam = true }: { f?: Frame; at: XY; beam?: boolean }) {
  const [x, y] = useTween(at, 420);
  return (
    <>
      {beam && <Beam f={f} to={[x, y]} />}
      <LightDot f={f} at={[x, y]} />
    </>
  );
}

/** a compact toggle for one of the three hearts: a small heart and its place */
function LW_HeartBtn({ look, disabled, onClick, children }: { look: Look; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-1.5 text-sm leading-tight transition-[color,background-color,border-color,opacity] duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look]}`}
    >
      <svg viewBox="0 0 20 18" className="size-4 shrink-0" aria-hidden="true">
        <path d={heartPath(10, 9, 6)} fill={look === "picked" || look === "right" ? "#ec4899" : "none"} stroke="#db2777" strokeWidth={1.6} />
      </svg>
      <span>{children}</span>
    </button>
  );
}

/** a readout: a label over a list whose numbers say what they count */
function LW_Read({ label, v, of, tone = "" }: { label: string; v: readonly number[]; of: readonly string[]; tone?: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted">{label}</div>
      <div className={`font-mono text-base font-bold ${tone}`}>
        <Tup v={v} of={of} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The wall with আপার three hearts; the reader taps the ones
//     the old machine can light, then seals. The bet is acted out: a ghost dot
//     flies to each picked heart and a "?" hangs on it. Never marked.

export function WallBet() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<boolean[]>("picks", [false, false, false]);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(750);
  const k = !sealed ? 0 : act.running ? act.k : 3;
  const toggle = (i: number) => {
    if (sealed) return;
    setPicks(picks.map((v, j) => (j === i ? !v : v)));
  };
  const seal = () => {
    setSealed(true);
    act.play(3, () => pass("বাজি সিল হলো. আগে knob দুইটা ঘুরাই."));
  };
  const near = (p: XY) => {
    let best = -1;
    let bd = 1.3;
    HEART_KEYS.forEach((key, i) => {
      const h = HEARTS[key];
      const d = Math.hypot(h[0] - p[0], h[1] - p[1]);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) toggle(best);
  };
  const none = picks.every((v) => !v);
  return (
    <>
      <LW_Wall label="দেয়াল, খুঁটির পেরেক (0, 0); আপার তিনটা heart: দরজার উপরে, জানালার উপরে, নারকেল গাছের দিকে" drag={sealed ? undefined : { down: near }}>
        {HEART_KEYS.map((key, i) => (
          <Heart key={key} f={F} at={HEARTS[key]} ring={picks[i] && k === 0} mark={picks[i] && k >= 2 ? "?" : undefined} />
        ))}
        {k >= 1 &&
          HEART_KEYS.map((key, i) =>
            picks[i] ? (
              <g key={key} className={POP}>
                <Beam f={F} to={HEARTS[key]} />
                <LightDot f={F} at={HEARTS[key]} faint />
              </g>
            ) : null,
          )}
        {k >= 1 && none && <LightDot f={F} at={[0, 0]} faint />}
        {k >= 2 && none && (
          <text x={F.sx(0.5)} y={F.sy(0.6)} fontSize={14} fontWeight={800} fill="#2563eb" className={POP}>
            ?
          </text>
        )}
      </LW_Wall>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {HEART_NAMES.map((o, i) => (
          <LW_HeartBtn key={o} look={picks[i] ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => toggle(i)}>
            {o}
          </LW_HeartBtn>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" className={primaryBtn} disabled={sealed} onClick={seal}>
          {none ? "কোনোটাতেই না: সিল" : "এই বাজি সিল"}
        </button>
      </div>
      <Task done={k >= 3}>যন্ত্রের আলো কোন কোন heart এ যাবে? Heart গুলো বেছে নিয়ে বাজি সিল করুন. উত্তর শেষে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The knobs. Each turn glides the dot one jump, knob 1 (2, 1), knob 2
//     (4, 2), back or forward; every spot it stops on leaves a chalk mark.
//     However they turn, the marks line up. Once both knobs are used and four
//     spots are marked, the line is drawn through them.

const X2_LINE = (f: Frame) => `M${f.sx(-3)} ${f.sy(-1.5)}L${f.sx(9)} ${f.sy(4.5)}`;

export function KnobPlay() {
  const pass = useGate();
  const [ab, setAb] = useSeed<XY>("ab", [0, 0]);
  const [trail, setTrail] = useSeed<XY[]>("trail", [[0, 0]]);
  const [used, setUsed] = useSeed<[boolean, boolean]>("used", [false, false]);
  const [done, setDone] = useSeed("done", false);
  const pos = apply(OLD_LENS, ab);
  const turn = (i: 0 | 1, d: -1 | 1) => {
    const n: XY = i === 0 ? [ab[0] + d, ab[1]] : [ab[0], ab[1] + d];
    const p = apply(OLD_LENS, n);
    if (!onWall(p)) return;
    setAb(n);
    const nt = trail.some((q) => same(q, p)) ? trail : [...trail, p];
    setTrail(nt);
    const nu: [boolean, boolean] = i === 0 ? [true, used[1]] : [used[0], true];
    setUsed(nu);
    if (!done && nu[0] && nu[1] && nt.length >= 4) {
      setDone(true);
      pass("যেদিকেই ঘুরাই, dot একটা লাইনেই থাকে.");
    }
  };
  return (
    <>
      <LW_Wall label="দেয়ালে আলোর dot; knob ঘুরালে dot লাফ দেয়, যেখানে থামে সেখানে দাগ থাকে">
        {done && <path d={X2_LINE(F)} stroke="#b45309" strokeWidth={1.4} strokeDasharray="5 4" className={FADE} />}
        {trail.map((p) => (
          <circle key={`${p[0]},${p[1]}`} cx={F.sx(p[0])} cy={F.sy(p[1])} r={4} fill="none" stroke="#b45309" strokeWidth={1.6} className={POP} />
        ))}
        <LW_GlideDot at={pos} />
      </LW_Wall>
      <LW_Knobs cols={OLD_LENS} ab={ab} onTurn={turn} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <LW_Read label="Knob এর পাক" v={ab} of={KNOB_SLOTS} />
        <LW_Read label="dot, দেয়ালের ঘরে" v={pos} of={WALL_SLOTS} tone="text-cat-amber" />
      </div>
      <Task done={done}>দুইটা knob ই ঘুরান, সামনে আর পেছনে. অন্তত চার জায়গায় dot থামান, দাগ গুলো দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Why one line. Knob 1's jump (2, 1) stands at the pin; knob 2's (4, 2)
//     lies loose on the wall. The reader drags knob 2's arrow until its tail
//     sits on the nail: it covers knob 1's arrow exactly, twice as long, and
//     the two halves light up as 2 × (2, 1).

const X3_START: XY = [-2, 3];

export function WhyOneLine() {
  const pass = useGate();
  const [tail, setTail] = useSeed<XY>("tail", X3_START);
  const [grab, setGrab] = useState<XY | null>(null);
  const done = same(tail, [0, 0]);
  const put = (t: XY) => {
    if (done) return;
    const c: XY = [clamp(t[0], -3, 5), clamp(t[1], -2, 4)];
    setTail(c);
    if (same(c, [0, 0])) pass("দুইটা knob, কিন্তু দিক একটাই.");
  };
  return (
    <>
      <LW_Wall
        label="দেয়ালে knob 1 এর arrow (2, 1) খুঁটি থেকে; knob 2 এর arrow (4, 2) আলগা, টেনে খুঁটিতে বসাতে হবে"
        drag={
          done
            ? undefined
            : {
                down: (p) => setGrab([p[0] - tail[0], p[1] - tail[1]]),
                move: (p) => grab && put([Math.round(p[0] - grab[0]), Math.round(p[1] - grab[1])]),
                up: () => setGrab(null),
              }
        }
        onKey={(e) => {
          const d: Record<string, XY> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
          if (d[e.key]) {
            e.preventDefault();
            put([tail[0] + d[e.key][0], tail[1] + d[e.key][1]]);
          }
        }}
      >
        <ColArrow f={F} col={OLD_LENS[1]} which={2} from={tail} w={done ? 5 : 3} />
        <ColArrow f={F} col={OLD_LENS[0]} which={1} w={2.6} />
        {!done && <circle cx={F.sx(0)} cy={F.sy(0)} r={9} fill="none" stroke={KNOB_HEX[2]} strokeWidth={1.4} strokeDasharray="3 2" />}
        {done && (
          <g className={POP}>
            <circle cx={F.sx(2)} cy={F.sy(1)} r={3.4} fill="white" stroke={KNOB_HEX[1]} strokeWidth={1.6} />
            <text x={F.sx(1) + 12} y={F.sy(0.5) + 14} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={KNOB_HEX[1]}>
              (2, 1)
            </text>
            <text x={F.sx(3) + 12} y={F.sy(1.5) + 14} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={KNOB_HEX[1]}>
              (2, 1)
            </text>
          </g>
        )}
      </LW_Wall>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <LW_Read label="Knob 1 এর লাফ" v={OLD_LENS[0]} of={WALL_SLOTS} tone="text-cat-amber" />
        <LW_Read label="Knob 2 এর লাফ" v={OLD_LENS[1]} of={WALL_SLOTS} tone="text-cat-teal" />
      </div>
      <div className="mt-1 h-6 text-center text-sm">
        {done ? (
          <span className={`${POP} inline-block font-semibold`}>
            <span className="text-cat-teal">(4,&nbsp;2)</span> = 2 × <span className="text-cat-amber">(2,&nbsp;1)</span>
          </span>
        ) : (
          <span className="text-muted">
            সবুজ arrow এর গোড়া: <span className="font-mono">{nb(`(${tail[0] < 0 ? `−${-tail[0]}` : tail[0]}, ${tail[1] < 0 ? `−${-tail[1]}` : tail[1]})`)}</span>
          </span>
        )}
      </div>
      <Task done={done}>সবুজ arrow টা টেনে আনুন. গোড়াটা বসান খুঁটির পেরেকে, (0, 0) তে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Predict, then sweep. Where can the dot ever be, if the knobs are turned
//     every possible way? Three pictures: one line, the whole wall, a wide
//     band. The guess is drawn dashed on the wall with a "?". The sweep scribbles
//     hundreds of landings and the lit region paints itself: one line. Then
//     last night's lens goes in, and the same sweep fills the wall.

const X4_OPTS = ["শুধু ওই লাইন", "পুরা দেয়াল", "চওড়া পট্টি"];
const X4_RIGHT = 0;
const X4_NOPE = [
  "",
  "শত শত বার ঘুরিয়েও আলো লাইন ছাড়লো না. দেয়ালের বাকিটা অন্ধকার.",
  "পট্টি হলো না. আলো পড়লো ঠিক লাইনের উপরে, এক চুলও পাশে না.",
];
const X4_OLD = sweepPts(OLD_LENS, 420);
const X4_GOOD = sweepPts(GOOD_LENS, 900);

/** a guess drawn on the wall, dashed, with a "?" */
function X4_Ghost({ f, i }: { f: Frame; i: number }) {
  const band = `M${f.sx(-3)} ${f.sy(-0.3)}L${f.sx(9)} ${f.sy(5.7)}L${f.sx(9)} ${f.sy(3.3)}L${f.sx(-3)} ${f.sy(-2.7)}Z`;
  return (
    <g className={`${POP} pointer-events-none`}>
      {i === 0 && <path d={X2_LINE(f)} stroke="#2563eb" strokeWidth={2} strokeDasharray="5 4" />}
      {i === 1 && <rect x={f.sx(-2.8)} y={f.sy(5.8)} width={11.6 * f.u} height={7.6 * f.u} rx={4} fill="none" stroke="#2563eb" strokeWidth={2} strokeDasharray="5 4" />}
      {i === 2 && <path d={band} fill="#2563eb" fillOpacity={0.06} stroke="#2563eb" strokeWidth={1.6} strokeDasharray="5 4" />}
      <text x={f.sx(-2.2)} y={f.sy(4.6)} fontSize={18} fontWeight={800} fill="#2563eb">
        ?
      </text>
    </g>
  );
}

/** a choice's picture: a tiny wall with the guessed light */
function X4_Icon({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 60 40" className="h-8 w-auto shrink-0" aria-hidden="true">
      <rect x={0} y={0} width={60} height={40} rx={3} fill="#e9e4d8" stroke="#a8a29e" />
      {i === 1 && <rect x={2} y={2} width={56} height={36} rx={2} fill="#fde047" fillOpacity={0.6} />}
      {i === 2 && <path d="M0 26L60 4V16L0 38Z" fill="#fde047" fillOpacity={0.6} />}
      <path d="M0 32L60 10" stroke="#f59e0b" strokeWidth={i === 0 ? 3 : 1.2} />
    </svg>
  );
}

export function AllTheLanding() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [lens, setLens] = useSeed<"old" | "good">("lens", "old");
  const [swept, setSwept] = useSeed("swept", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(1800, 36);
  const cols = lens === "old" ? OLD_LENS : GOOD_LENS;
  const pts = lens === "old" ? X4_OLD : X4_GOOD;
  const t = run.running ? run.t : swept ? 1 : 0;
  const over = lens === "good" || swept;
  const sweep = () => {
    if (run.running) return;
    setSwept(false);
    run.run(() => {
      setSwept(true);
      if (lens === "old") {
        if (guess !== X4_RIGHT) setMiss((m) => m + 1);
      } else pass("Ax যেখানে যেতে পারে, সেটা column দুইটার span.");
    });
  };
  const swap = () => {
    if (run.running) return;
    setLens("good");
    setSwept(false);
  };
  const tip = pts[Math.max(0, Math.round(t * pts.length) - 1)];
  return (
    <>
      <LW_Wall label="দুই knob এলোমেলো ঘোরালে dot যেখানে যেখানে পড়ে, সেখানে আলো" lit={t > 0 ? <LitRegion f={F} cols={cols} t={t} /> : null}>
        {guess !== null && lens === "old" && !swept && !run.running && <X4_Ghost f={F} i={guess} />}
        {t > 0 && <Scribble f={F} pts={pts} show={Math.round(t * pts.length)} />}
        {run.running && tip && <LightDot f={F} at={tip} />}
      </LW_Wall>
      <div className="mt-2 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted">যন্ত্রে এখন</span>
        <LensCard cols={cols} small name={lens === "old" ? "পুরানো lens" : "গত রাতের lens"} />
      </div>
      {lens === "old" && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {X4_OPTS.map((o, i) => (
            <Choice key={o} n={i} look={predictLook(i, guess, swept, X4_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
              <span className="flex flex-col items-start gap-1 text-sm leading-tight">
                <X4_Icon i={i} />
                {o}
              </span>
            </Choice>
          ))}
        </div>
      )}
      {lens === "old" && swept && guess !== X4_RIGHT && guess !== null && <Nope key={miss}>{X4_NOPE[guess]}</Nope>}
      <div className="mt-3 flex justify-center">
        {lens === "old" && !swept && (
          <button type="button" className={primaryBtn} disabled={guess === null || run.running} onClick={sweep}>
            দুই knob এলোমেলো ঘোরান
          </button>
        )}
        {lens === "old" && swept && (
          <button type="button" className={primaryBtn} onClick={swap}>
            গত রাতের lens লাগান
          </button>
        )}
        {lens === "good" && (
          <button type="button" className={over && swept ? quietBtn : primaryBtn} disabled={run.running} onClick={sweep}>
            {swept ? "আবার ঘোরান" : "দুই knob এলোমেলো ঘোরান"}
          </button>
        )}
      </div>
      <Task done={lens === "good" && swept}>
        {lens === "old" ? "আগে guess: knob যত রকমে ঘোরানো যায়, dot কোথায় কোথায় পড়বে? তারপর ঘুরিয়ে দেখুন." : "এবার গত রাতের lens এ একই কাজ. দুই knob এলোমেলো ঘোরান."}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The decorator's spare [[1, 0], [0, 0]]: knob 2's wire is torn. Knob 1
//     walks the dot along the pin's row; knob 2 spins and the dot sits still.
//     Then the sweep: only the pin's row lights.

export function BrokenCorner() {
  const pass = useGate();
  const [ab, setAb] = useSeed<XY>("ab", [0, 0]);
  const [used, setUsed] = useSeed<[boolean, boolean]>("used", [false, false]);
  const [swept, setSwept] = useSeed("swept", false);
  const [still, setStill] = useState(0);
  const run = useLensRun(1600, 32);
  const pos = apply(SPARE_LENS, ab);
  const turn = (i: 0 | 1, d: -1 | 1) => {
    if (run.running) return;
    const n: XY = i === 0 ? [ab[0] + d, ab[1]] : [ab[0], ab[1] + d];
    if (!onWall(apply(SPARE_LENS, n)) || Math.abs(n[1]) > 4) return;
    setAb(n);
    setUsed(i === 0 ? [true, used[1]] : [used[0], true]);
    if (i === 1) setStill((s) => s + 1);
  };
  const sweep = () => {
    if (run.running) return;
    run.run(() => {
      setSwept(true);
      pass("একটা column শূন্য হলে, একটা দিক পুরাই হারায়.");
    });
  };
  const t = run.running ? run.t : swept ? 1 : 0;
  const pts = sweepPts(SPARE_LENS, 300);
  return (
    <>
      <LW_Wall label="বাড়তি lens: knob 2 ঘুরালেও dot নড়ে না; সব আলো খুঁটির পেরেকের সারিতে" lit={t > 0 ? <LitRegion f={F} cols={SPARE_LENS} t={t} /> : null}>
        {t > 0 && <Scribble f={F} pts={pts} show={Math.round(t * pts.length)} />}
        <LW_GlideDot at={pos} />
      </LW_Wall>
      <div className="mt-2 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted">যন্ত্রে এখন</span>
        <LensCard cols={SPARE_LENS} small name="বাড়তি lens" />
      </div>
      <LW_Knobs cols={SPARE_LENS} ab={ab} onTurn={turn} disabled={run.running} />
      <div className="mt-1 h-5 text-center text-sm text-danger">
        {still > 0 && !swept && (
          <span key={still} className={FADE}>
            Knob 2 ঘুরলো. Dot নড়লো না.
          </span>
        )}
      </div>
      <div className="mt-1 flex justify-center">
        <button type="button" className={primaryBtn} disabled={!(used[0] && used[1]) || run.running || swept} onClick={sweep}>
          এবার দুই knob এলোমেলো ঘোরান
        </button>
      </div>
      <Task done={swept}>আগে দুইটা knob একবার করে ঘুরান. তারপর এলোমেলো ঘুরিয়ে দেখুন, আলো দেয়ালের কোথায় পড়ে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn. Back to the old lens and আপার three hearts, one at a time:
//     "যায়" or "যায় না". A "যায়" has to be backed by knob turns that land the
//     dot on the heart. A wrong verdict sweeps the lit line and leaves it
//     showing, under the heart or through it; a right "যায় না" sweeps it past
//     the heart, which gets a cross.

const X6_ORDER = [1, 0, 2]; // window, door, tree: the reachable one isn't first
const X6_NOPE_YES = "আলোর লাইন দেখুন. Heart টা লাইনের বাইরে. কোনো পাকেই dot ওখানে যায় না.";
const X6_NOPE_NO = "আলোর লাইন তো heart এর উপর দিয়েই গেলো. Knob ঘুরিয়ে dot টা ওখানে নিয়ে যান.";

export function YourSpots() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [said, setSaid] = useSeed<"yes" | "no" | null>("said", null);
  const [ab, setAb] = useSeed<XY>("ab", [0, 0]);
  const [line, setLine] = useSeed("line", false);
  const [nope, setNope] = useSeed<string | null>("nope", null);
  const [miss, setMiss] = useState(0);
  const [marks, setMarks] = useSeed<("lit" | "x" | null)[]>("marks", [null, null, null]);
  const run = useLensRun(1000, 20);
  const hi = X6_ORDER[at] ?? 0;
  const heart = HEARTS[HEART_KEYS[hi]];
  const reach = hi === 0;
  const pos = apply(OLD_LENS, ab);
  const finish = (m: "lit" | "x") => {
    const nm = marks.map((v, j) => (j === hi ? m : v));
    setMarks(nm);
    setSaid(null);
    setLine(false);
    setNope(null);
    setAb([0, 0]);
    setAt(at + 1);
    if (at + 1 >= 3) pass("শুধু দরজার উপরের heart টা লাইনে পড়ে.");
  };
  const verdict = (v: "yes" | "no") => {
    if (run.running || at >= 3) return;
    setNope(null);
    if (v === "yes" && reach) {
      setSaid("yes");
      return;
    }
    setSaid(null);
    run.run(() => {
      setLine(true);
      if (v === "no" && !reach) finish("x");
      else {
        setNope(v === "yes" ? X6_NOPE_YES : X6_NOPE_NO);
        setMiss((m) => m + 1);
      }
    });
  };
  const turn = (i: 0 | 1, d: -1 | 1) => {
    const n: XY = i === 0 ? [ab[0] + d, ab[1]] : [ab[0], ab[1] + d];
    const p = apply(OLD_LENS, n);
    if (!onWall(p)) return;
    setAb(n);
    if (same(p, heart)) finish("lit");
  };
  const t = run.running ? run.t : line ? 1 : 0;
  const over = at >= 3;
  return (
    <>
      <LW_Wall label="পুরানো lens; আপার তিনটা heart, একটা একটা করে: আলো যায়, নাকি যায় না" lit={t > 0 ? <LitRegion f={F} cols={OLD_LENS} t={t} /> : null}>
        {HEART_KEYS.map((key, i) => (
          <Heart key={key} f={F} at={HEARTS[key]} lit={marks[i] === "lit"} mark={marks[i] === "x" ? "x" : undefined} ring={!over && i === hi} />
        ))}
        {(said === "yes" || marks[0] === "lit") && <LW_GlideDot at={marks[0] === "lit" && said !== "yes" ? HEARTS.door : pos} />}
      </LW_Wall>
      <Ticks items={X6_ORDER.map((j) => [HEART_NAMES[j], marks[j] !== null] as [string, boolean])} />
      {!over && said !== "yes" && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className={quietBtn + " justify-center"} disabled={run.running} onClick={() => verdict("yes")}>
            যায়
          </button>
          <button type="button" className={quietBtn + " justify-center"} disabled={run.running} onClick={() => verdict("no")}>
            যায় না
          </button>
        </div>
      )}
      {!over && said === "yes" && (
        <>
          <LW_Knobs cols={OLD_LENS} ab={ab} onTurn={turn} />
          <div className="mt-1 text-center text-xs text-muted">Knob ঘুরিয়ে dot টা heart এ বসান.</div>
        </>
      )}
      {nope && <Nope key={miss}>{nope}</Nope>}
      <Task done={over}>
        {over ? "তিনটা heart এর হিসাব শেষ." : nb(`${HEART_OF[hi]} heart: আলো যায়, নাকি যায় না? যায় বললে knob ঘুরিয়ে দেখিয়ে দিন.`)}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it. Three new lenses and a target, (5, 4): [[1, 2], [2, 4]], G and
//     [[0, 0], [3, 1]] (rows first, as the spec writes them; X7_LENSES holds
//     their columns). The reader picks the one
//     whose light can get there. A wrong pick sweeps its column space: a line
//     that misses the star. The right one (G) lights the whole wall; then the
//     reader finds the knob turns, (2, 1).

const X7_LENSES: Cols[] = [
  [
    [1, 2],
    [2, 4],
  ],
  GOOD_LENS,
  [
    [0, 3],
    [0, 1],
  ],
];
const X7_RIGHT = 1;
const X7_TARGET: XY = [5, 4];
const X7_NOPE = [
  "দুই column, (1, 2) আর (2, 4), একই লাইনে. আলো পড়লো শুধু ওই খাড়া লাইনে. তারা বাইরে.",
  "",
  "দুই column, (0, 3) আর (0, 1), দুইটাই সোজা উপরের দিকে. আলো শুধু খুঁটি বরাবর. তারা বাইরে.",
];

/** a choice's picture: the lens's two columns from a pin */
function X7_Icon({ cols }: { cols: Cols }) {
  const s = 5;
  const p = (v: XY) => `${14 + v[0] * s} ${26 - v[1] * s}`;
  return (
    <svg viewBox="0 0 40 30" className="h-7 w-auto shrink-0" aria-hidden="true">
      <rect x={0} y={0} width={40} height={30} rx={3} fill="#e9e4d8" />
      {cols.map((c, i) =>
        c[0] || c[1] ? <path key={i} d={`M${p([0, 0])}L${p(c)}`} stroke={KNOB_HEX[(i + 1) as 1 | 2]} strokeWidth={i ? 2 : 3.2} strokeLinecap="round" /> : null,
      )}
      <circle cx={14} cy={26} r={1.8} fill={INK} />
    </svg>
  );
}

export function TryReach() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [swept, setSwept] = useSeed("swept", false);
  const [ab, setAb] = useSeed<XY>("ab", [0, 0]);
  const [miss, setMiss] = useState(0);
  const [hit, setHit] = useSeed("hit", false);
  const run = useLensRun(1400, 28);
  const cols = pick === null ? null : X7_LENSES[pick];
  const choose = (i: number) => {
    if (run.running || (pick === X7_RIGHT && swept)) return;
    setPick(i);
    setSwept(false);
    setAb([0, 0]);
    run.run(() => {
      setSwept(true);
      if (i !== X7_RIGHT) setMiss((m) => m + 1);
    });
  };
  const turn = (i: 0 | 1, d: -1 | 1) => {
    if (hit) return;
    const n: XY = i === 0 ? [ab[0] + d, ab[1]] : [ab[0], ab[1] + d];
    const p = apply(GOOD_LENS, n);
    if (!onWall(p)) return;
    setAb(n);
    if (same(p, X7_TARGET)) {
      setHit(true);
      pass("Target টা column space এ থাকলেই যায়.");
    }
  };
  const t = run.running ? run.t : swept ? 1 : 0;
  const knobs = pick === X7_RIGHT && swept;
  return (
    <>
      <LW_Wall label="দেয়ালে একটা তারা (5, 4) এ; কোন lens এর আলো ওখানে যায়" lit={cols && t > 0 ? <LitRegion f={F} cols={cols} t={t} /> : null}>
        <Star f={F} at={X7_TARGET} done={hit} />
        {knobs && <LW_GlideDot at={apply(GOOD_LENS, ab)} />}
      </LW_Wall>
      {!knobs && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {X7_LENSES.map((c, i) => (
            <Choice
              key={i}
              n={i}
              look={pick === i && swept ? (i === X7_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"}
              disabled={run.running}
              onClick={() => choose(i)}
            >
              <span className="flex flex-col items-start gap-1">
                <X7_Icon cols={c} />
                <LensCard cols={c} small />
              </span>
            </Choice>
          ))}
        </div>
      )}
      {pick !== null && pick !== X7_RIGHT && swept && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      {knobs && (
        <>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm">
            <span className="text-muted">পুরা দেয়াল আলো. এবার</span>
            <LensCard cols={GOOD_LENS} small />
          </div>
          <LW_Knobs cols={GOOD_LENS} ab={ab} onTurn={turn} disabled={hit} />
        </>
      )}
      <Task done={hit}>{knobs ? "Knob ঘুরিয়ে dot টা তারার উপর বসান." : "কোন lens এর আলো তারা পর্যন্ত যায়? একটা বেছে নিন."}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The finale's widget. The লাইট ভাই has swapped in the good lens; the
//     reader runs it (the light spreads from a line to the whole wall), then
//     sends the dot to each heart: the knob turns show, and the heart lights.

const X8_TURNS: XY[] = [
  [3, 0],
  [0, 2],
  [5, -2],
];

export function HeartsLight() {
  const pass = useGate();
  const [on, setOn] = useSeed("on", false);
  const [lit, setLit] = useSeed<boolean[]>("lit", [false, false, false]);
  const [at, setAt] = useSeed<XY>("at", [0, 0]);
  const run = useLensRun(1400, 28);
  const glow = usePlay(700);
  const start = () => {
    if (run.running || on) return;
    run.run(() => setOn(true));
  };
  const send = (i: number) => {
    if (!on || glow.running || lit[i]) return;
    setAt(HEARTS[HEART_KEYS[i]]);
    glow.play(1, () => {
      const nl = lit.map((v, j) => v || j === i);
      setLit(nl);
      if (nl.every(Boolean)) pass("গত রাতের lens এ তিনটা heart ই জ্বললো.");
    });
  };
  const t = run.running ? run.t : on ? 1 : 0;
  const last = HEART_KEYS.findIndex((key) => same(HEARTS[key], at));
  return (
    <>
      <LW_Wall label="গত রাতের lens লাগানো; আলো পুরা দেয়ালে; তিনটা heart এ dot পাঠালে heart জ্বলে" lit={<LitRegion f={F} cols={t > 0 ? GOOD_LENS : OLD_LENS} t={t > 0 ? t : 1} />}>
        {HEART_KEYS.map((key, i) => (
          <Heart key={key} f={F} at={HEARTS[key]} lit={lit[i]} />
        ))}
        {on && <LW_GlideDot at={at} />}
      </LW_Wall>
      {!on ? (
        <div className="mt-3 flex justify-center">
          <button type="button" className={primaryBtn} disabled={run.running} onClick={start}>
            গত রাতের lens এ যন্ত্র চালান
          </button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {HEART_NAMES.map((o, i) => (
            <LW_HeartBtn key={o} look={lit[i] ? "picked" : "idle"} disabled={lit[i] || glow.running} onClick={() => send(i)}>
              {o}
            </LW_HeartBtn>
          ))}
        </div>
      )}
      <div className="mt-2 h-6 text-center text-sm text-muted">
        {on && last >= 0 && (
          <span key={last} className={FADE}>
            knob এর পাক <span className="font-mono font-bold text-foreground">{<Tup v={X8_TURNS[last]} of={KNOB_SLOTS} />}</span>
          </span>
        )}
      </div>
      <Task done={lit.every(Boolean)}>{on ? "একটা একটা heart এ tap করুন. Dot যাক, heart জ্বলুক." : "গত রাতের lens এ যন্ত্রটা চালান."}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. The wall sits at the stage's left (StageWall, 168 × 112 at
// (16, 30)); the machine on its stand at the right. A spot (x, y) on the wall
// is at stage (16 + STAGE_WALL_F.sx(x), 30 + STAGE_WALL_F.sy(y)).

const SW: [number, number] = [16, 30];
const onStage = (p: XY): [number, number] => [SW[0] + STAGE_WALL_F.sx(p[0]), SW[1] + STAGE_WALL_F.sy(p[1])];
const PJ: [number, number] = [262, 150];

/** আপা at her window (her head and a pointing arm), in wall units on the stage wall */
function LW_ApaWindow({ point = false }: { point?: boolean }) {
  const f = STAGE_WALL_F;
  const x = SW[0] + f.sx(2);
  const y = SW[1] + f.sy(2.35);
  return (
    <g className={POP}>
      <path d={`M${x - 7} ${y + 9}q7 -8 14 0`} fill="#f8fafc" />
      <circle cx={x} cy={y} r={5.5} fill="#d8a47a" />
      <path d={`M${x - 6} ${y - 1}q0 -8 6 -8t6 8q-3 -4 -6 -4t-6 4Z`} fill="#1c1917" />
      {point && <path d={`M${x + 5} ${y + 7}l12 -9`} stroke="#d8a47a" strokeWidth={2.4} strokeLinecap="round" />}
      <text x={x} y={y + 25} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={INK}>
        আপা
      </text>
    </g>
  );
}

// 1a · The evening before গায়ে হলুদ: the wall with Rina's grid and the post;
//      the machine on its stand, the লাইট ভাই by it. আপা at her window points
//      three times; three dashed hearts. His claim. Shiku on the ground.

export function ApaPoints({}: Story) {
  const s = useScene(4, [600, 1800, 2200, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="গায়ে হলুদের আগের সন্ধ্যা; চুনকাম করা দেয়ালে চকের grid, বারান্দার খুঁটি; বাঁশের stand এ লাইট ভাইয়ের যন্ত্র; আপা জানালা থেকে তিনটা জায়গা দেখালো; লাইট ভাই বললেন, দুই knob, দুই দিক, যেখানে বলবেন সেখানে যাবে">
        <StageWall x={SW[0]} y={SW[1]}>
          {k >= 1 && HEART_KEYS.map((key) => <Heart key={key} f={STAGE_WALL_F} at={HEARTS[key]} />)}
        </StageWall>
        {k >= 1 && <LW_ApaWindow point={k === 1 || k === 2} />}
        <Robot x={132} y={150} />
        <Projector x={PJ[0]} y={PJ[1]} />
        <LightBhai x={298} y={150} facing={-1} arm={k >= 3 ? "point" : "down"} />
        {k === 2 && <Bubble x={86} y={58} side="right" lines={["কাল হলুদ.", "তিনটা heart চাই."]} />}
        {k === 3 && <Bubble x={298} y={84} side="left" lines={["দুই knob, দুই দিক."]} />}
        {k >= 4 && <Bubble x={298} y={84} side="left" lines={["যেইখানে কন,", "সেইখানে যাইবো."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · The switch: the lens lights, a dot lands on the post's nail. Samin sits
//      by the knobs; the লাইট ভাই says what a turn does.

export function MachineOn({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2400]);
  const k = s.k;
  const pin = onStage([0, 0]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="লাইট ভাই switch টিপলেন; দেয়ালে একটা আলোর dot পড়লো খুঁটির পেরেকের উপর; সামিন knob এর সামনে বসলো; লাইট ভাই বললেন এক পাক ঘুরালে dot এক লাফ দেয়, উল্টা ঘুরালে উল্টা লাফ">
        <StageWall x={SW[0]} y={SW[1]}>{k >= 1 && <LightDot f={STAGE_WALL_F} at={[0, 0]} r={2.6} />}</StageWall>
        {k >= 1 && <StageBeam from={projectorLens(PJ[0], PJ[1])} to={pin} />}
        <Projector x={PJ[0]} y={PJ[1]} on={k >= 1} />
        <Person who="samin" x={212} y={150} facing={1} label arm={k >= 1 ? "hold" : "down"} />
        <LightBhai x={298} y={150} facing={-1} arm={k === 1 ? "point" : "down"} />
        {k === 2 && <Bubble x={298} y={84} side="left" lines={["এক পাক ঘুরাইলে", "dot এক লাফ দেয়."]} />}
        {k >= 3 && <Bubble x={298} y={84} side="left" lines={["উল্টা ঘুরাইলে", "উল্টা লাফ."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Som behind the machine: two tin plates under the knobs, (2, 1) and
//      (4, 2). He says the jumps go the same way.

export function SomReads({}: Story) {
  const s = useScene(4, [600, 1600, 1600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সোম যন্ত্রের পেছনে গেলো; knob দুইটার নিচে দুইটা টিনের পাত, একটায় (2, 1), আরেকটায় (4, 2); সোম বললো দুইটা knob, কিন্তু লাফ একই দিকে">
        <StageWall x={SW[0]} y={SW[1]} />
        <Projector x={PJ[0]} y={PJ[1]} knobs={[k >= 2 ? 1 : 0, k >= 3 ? 1 : 0]} />
        <Person who="som" x={k >= 1 ? 296 : 360} y={150} facing={-1} walking={k === 1} label arm={k >= 2 ? "point" : "down"} />
        {k >= 2 && <Card x={210} y={98} text="(2, 1)" tone="amber" />}
        {k >= 3 && <Card x={210} y={120} text="(4, 2)" tone="teal" />}
        {k >= 4 && <Bubble x={296} y={84} side="left" lines={["দুইটা knob.", "কিন্তু লাফ একই দিকে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Nasib complains; the লাইট ভাই says nothing, opens his bag and holds up
//      last night's lens; its plates read (2, 1) and (1, 2).

export function BagLens({}: Story) {
  const s = useScene(4, [600, 2200, 1800, 1800, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="নাসিব বললো যন্ত্র এক লাইনের বাইরে যায় না; লাইট ভাই কিছু বললেন না; ব্যাগ থেকে গত রাতের lens বের করলেন; তার পাতে (2, 1) আর (1, 2)">
        <StageWall x={SW[0]} y={SW[1]}>
          <path d={`M${STAGE_WALL_F.sx(-3)} ${STAGE_WALL_F.sy(-1.5)}L${STAGE_WALL_F.sx(9)} ${STAGE_WALL_F.sy(4.5)}`} stroke="#f59e0b" strokeWidth={2} strokeOpacity={0.6} />
        </StageWall>
        <Projector x={PJ[0]} y={PJ[1]} />
        <Person who="nasib" x={200} y={150} facing={1} label arm={k === 1 ? "point" : "down"} />
        {k === 1 && <Bubble x={200} y={84} side="right" lines={["এক লাইনের বাইরে", "তো যায়ই না."]} />}
        <LightBhai x={298} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} />
        {/* the bag at his feet */}
        <path d="M304 150l3 -14h14l3 14Z" fill="#78350f" />
        {k >= 2 && (
          <g className={POP}>
            <circle cx={284} cy={106} r={6} fill="#a7f3d0" stroke={INK} strokeWidth={1} />
          </g>
        )}
        {k >= 3 && (
          <>
            <Card x={252} y={60} text="(2, 1)" tone="amber" />
            <Card x={296} y={60} text="(1, 2)" tone="teal" />
          </>
        )}
        {k >= 4 && <Bubble x={298} y={44} side="left" lines={["কাইল রাইতে", "এইটা চলছে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · Karim brings a dusty lens from the decorator's box; its plates read
//      (1, 0) and (0, 0). The লাইট ভাই: it's the spare, knob 2's wire is torn.

export function SpareLens({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="করিম ডেকোরেটরের বাক্স থেকে একটা ধুলা মাখা lens আনলো; পাতে (1, 0) আর (0, 0); লাইট ভাই বললেন এইটা বাড়তি, knob 2 এর তার ছেঁড়া">
        <StageWall x={SW[0]} y={SW[1]} />
        <Projector x={PJ[0]} y={PJ[1]} lens="spare" />
        <Person who="karim" x={k >= 1 ? 214 : -30} y={150} facing={1} walking={k === 1} label arm="hold" />
        <g style={{ transform: `translateX(${k >= 1 ? 0 : -244}px)` }} className="transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
          <rect x={220} y={98} width={22} height={14} rx={1.5} fill="#a16207" stroke="#78350f" />
        </g>
        {k >= 2 && (
          <>
            <Card x={214} y={36} text="(1, 0)" tone="amber" />
            <Card x={258} y={36} text="(0, 0)" tone="teal" />
          </>
        )}
        <LightBhai x={298} y={150} facing={-1} />
        {k >= 3 && <Bubble x={298} y={84} side="left" lines={["এইটা বাড়তি.", "Knob 2 এর তার ছিঁড়া."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 8a · Night. The লাইট ভাই sits by the machine a long time, takes the old lens
//      out, fits last night's. আপা at her window. The lighting is the reader's.

export function LensSwap({}: Story) {
  const s = useScene(3, [600, 2000, 1800, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাত; লাইট ভাই পুরানো lens খুলে ব্যাগে রাখলেন, গত রাতের lens লাগালেন; আপা জানালায়">
        <StageWall x={SW[0]} y={SW[1]} />
        <rect x={SW[0]} y={SW[1]} width={STAGE_WALL_F.W} height={STAGE_WALL_F.H} fill="#0f172a" opacity={0.45} />
        <LW_ApaWindow />
        <Projector x={PJ[0]} y={PJ[1]} lens={k === 0 ? "old" : k === 1 ? "empty" : "good"} />
        <LightBhai x={296} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} nameTone="#e2e8f0" />
        {k === 1 && <circle cx={283} cy={106} r={6} fill="#bae6fd" stroke={INK} strokeWidth={1} className={POP} />}
        {k >= 3 && <Card x={250} y={60} text="(2, 1)  (1, 2)" tone="blue" />}
      </Stage>
    </StoryFrame>
  );
}

// 8c · The bridge to 7.3: dawn dew, the good lens cracked; two small spares
//      in the লাইট ভাই's palm; the machine has one slot. Stopped at "?".

export function CrackedLens({}: Story) {
  const s = useScene(3, [600, 1800, 2000, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ভোরে শিশির; লাইট ভাই দেখলেন গত রাতের lens টা মাঝখান দিয়ে চিড় খেয়েছে; হাতে দুইটা ছোট বাড়তি lens; যন্ত্রে খোপ একটাই">
        <StageWall x={SW[0]} y={SW[1]} grid={false} />
        {[40, 90, 150, 210, 250].map((x, i) => (
          <circle key={x} cx={x} cy={152 + (i % 2) * 6} r={1.4} fill="white" opacity={0.9} />
        ))}
        <Projector x={PJ[0]} y={PJ[1]} lens={k >= 1 ? "cracked" : "good"} />
        <LightBhai x={298} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && (
          <g className={POP}>
            <circle cx={278} cy={104} r={4.5} fill="#fde68a" stroke={INK} strokeWidth={0.9} />
            <circle cx={290} cy={100} r={4.5} fill="#c4b5fd" stroke={INK} strokeWidth={0.9} />
          </g>
        )}
        {k >= 3 && (
          <text x={236} y={76} textAnchor="middle" fontSize={18} fontWeight={800} fill="#2563eb" className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

const FIG_F = wallFrame(17, 6);

/** a small wall for a figure */
function LW_FigWall({ f = FIG_F, label, lit, children }: { f?: Frame; label: string; lit?: ReactNode; children?: ReactNode }) {
  return <LW_Wall f={f} label={label} lit={lit} width="max-w-[16rem]">{children}</LW_Wall>;
}

// 1½ · The stake: আপার three hearts appear one by one; then a "?" on each and
//      the হলুদ tomorrow.

const X1_SAY = ["দেয়াল, খুঁটি, রিনার grid.", "দরজার উপরে একটা heart.", "আপার জানালার উপরে একটা.", "নারকেল গাছের দিকে একটা.", "কাল হলুদের আগে তিনটাই চাই. পুরানো যন্ত্রে হবে?"];

export function ThreeHearts() {
  const s = useScene(4, [600, 1400, 1400, 1400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <LW_FigWall label="দেয়ালে আপার তিনটা heart, প্রত্যেকটায় প্রশ্নবোধক">
        {HEART_KEYS.map((key, i) => (k > i ? <g key={key} className={POP}><Heart f={FIG_F} at={HEARTS[key]} mark={k >= 4 ? "?" : undefined} /></g> : null))}
      </LW_FigWall>
    </Scene>
  );
}

// 2½ · The trail, calmly: four knob settings and where each lands; two
//      different settings land on the same spot; then the one line through
//      them all.

const X2B_STOPS: { ab: XY; at: XY }[] = [
  { ab: [1, 0], at: [2, 1] },
  { ab: [0, 1], at: [4, 2] },
  { ab: [1, -1], at: [-2, -1] },
  { ab: [-1, 1], at: [2, 1] },
];
const X2B_SAY = [
  "Dot খুঁটির পেরেকে. পাক (0, 0).",
  "Knob 1 এক পাক: dot (2, 1) এ.",
  "Knob 2 এক পাক: (4, 2) এ. আরো দূরে, একই দিকে.",
  "Knob 1 এক পাক, knob 2 এক পাক পেছনে: (−2, −1). পেরেকের উল্টা পাশে.",
  "Knob 1 পেছনে, knob 2 সামনে: আবার (2, 1). দুই রকম পাক, একই জায়গা.",
  "সব দাগ একটাই হেলানো লাইনে. বাকি দেয়ালে কোনো দাগ নাই.",
];

export function TrailOneLine() {
  const s = useScene(5, [600, 1600, 1600, 2200, 2200, 2200]);
  const k = s.k;
  const cur = k >= 1 && k <= 4 ? X2B_STOPS[k - 1].at : null;
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <LW_FigWall label="কয়েকটা knob এর পাক, আর dot কোথায় পড়লো; সব একটা লাইনে">
        {k >= 5 && <path d={X2_LINE(FIG_F)} stroke="#b45309" strokeWidth={1.4} strokeDasharray="5 4" className={FADE} />}
        {X2B_STOPS.slice(0, Math.min(k, 4)).map((st, i) => (
          <circle key={i} cx={FIG_F.sx(st.at[0])} cy={FIG_F.sy(st.at[1])} r={3.4 + (i === 3 ? 2 : 0)} fill="none" stroke="#b45309" strokeWidth={1.4} />
        ))}
        <LW_GlideDot f={FIG_F} at={cur ?? (k >= 5 ? [2, 1] : [0, 0])} />
      </LW_FigWall>
    </Scene>
  );
}

// 2½b · For the side quest: 6.3's move (ropes (2, 1) and (1, 2)) makes (1, 1)
//       three times longer and leaves (1, −1) where it was.

const X2C_F = makeFrame(-2, 4, -2, 4, 22, 8);
const X2C_SAY = ["6.3 এর move: দড়ি (2, 1) আর (1, 2).", "(1, 1) গেলো (3, 3) এ. একই দিকে, 3 গুণ লম্বা.", "(1, −1) গেলো (1, −1) এ. যেখানে ছিল, সেখানেই. একটুও লম্বা না."];

export function StubbornAgain() {
  const s = useScene(2, [600, 2200, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X2C_SAY, k)}>
      <div className="mx-auto w-full max-w-[12rem]">
        <Plane f={X2C_F} grid={1} axes label="6.3 এর move: (1, 1) যায় (3, 3) এ; (1, −1) থাকে (1, −1) এ" className="my-0! max-w-none">
          {k === 0 && (
            <>
              <ColArrow f={X2C_F} col={[2, 1]} which={1} w={2} draw />
              <ColArrow f={X2C_F} col={[1, 2]} which={2} w={2} draw />
            </>
          )}
          {k >= 1 && (
            <g key="a">
              <ColArrow f={X2C_F} col={[1, 1]} which={1} w={3} faint />
              <ColArrow f={X2C_F} col={[3, 3]} which={1} w={2.4} draw />
            </g>
          )}
          {k >= 2 && <ColArrow f={X2C_F} col={[1, -1]} which={2} w={3} draw />}
        </Plane>
      </div>
    </Scene>
  );
}

// 3½ · The zero walk (5.2b): knob 1 two turns forward, knob 2 one back, and the
//      dot is on the nail again. Non-zero turns, zero place: dependent.

const X3B_SAY = [
  "দুইটা arrow একই লাইনে. সবুজটা কমলার ঠিক দ্বিগুণ.",
  "Knob 1 এক পাক: (2, 1).",
  "আরেক পাক: (4, 2).",
  "Knob 2 এক পাক পেছনে: (4, 2) পেছনে হাঁটা.",
  "Dot আবার পেরেকে. পাক (2, −1). শূন্য না, তবু শূন্যে ফেরা.",
];

export function ZeroWalk() {
  const s = useScene(4, [600, 1400, 1400, 1800, 2400]);
  const k = s.k;
  const at: XY = k === 1 ? [2, 1] : k === 2 || k === 3 ? [4, 2] : [0, 0];
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <LW_FigWall label="Knob 1 দুই পাক সামনে, knob 2 এক পাক পেছনে: dot আবার খুঁটির পেরেকে">
        {k === 0 && (
          <>
            <ColArrow f={FIG_F} col={OLD_LENS[1]} which={2} w={4.5} />
            <ColArrow f={FIG_F} col={OLD_LENS[0]} which={1} w={2.2} />
          </>
        )}
        {k >= 1 && <ColArrow f={FIG_F} col={[2, 1]} which={1} w={2.4} draw />}
        {k >= 2 && <ColArrow f={FIG_F} from={[2, 1]} col={[2, 1]} which={1} w={2.4} draw />}
        {k >= 3 && (
          <g transform="translate(0 7)">
            <ColArrow f={FIG_F} from={[4, 2]} col={[-4, -2]} which={2} w={2.4} draw />
          </g>
        )}
        {k >= 1 && <LW_GlideDot f={FIG_F} at={k === 3 ? [0, 0] : at} beam={false} />}
      </LW_FigWall>
    </Scene>
  );
}

// 4½ · Mix to span, with last night's lens: one mix walked (7.1's (1, 1) →
//      (3, 3)), then many mixes as specks, then the whole wall lit and named.

const X4B_SAY = [
  "গত রাতের lens: knob 1 এর লাফ (2, 1), knob 2 এর (1, 2).",
  "পাক (1, 1): আগে কমলা লাফ, (2, 1).",
  "তারপর সবুজ লাফ: (3, 3). দুই column এর একটা mix.",
  "আরো অনেক রকম পাক. প্রত্যেকটা আরেকটা mix.",
  "সব mix একসাথে: column দুইটার span. এখানে পুরা দেয়াল. এটাই column space.",
];
const X4B_PTS = sweepPts(GOOD_LENS, 420, 5, 11);

export function MixToSpan() {
  const s = useScene(4, [600, 1600, 1800, 2200, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <LW_FigWall label="গত রাতের lens: একটা mix হেঁটে (3, 3), তারপর অনেক mix, শেষে পুরা দেয়াল" lit={k >= 4 ? <LitRegion f={FIG_F} cols={GOOD_LENS} /> : null}>
        {k === 0 && (
          <>
            <ColArrow f={FIG_F} col={GOOD_LENS[0]} which={1} draw />
            <ColArrow f={FIG_F} col={GOOD_LENS[1]} which={2} draw />
          </>
        )}
        {k >= 1 && k <= 2 && <ColArrow f={FIG_F} col={GOOD_LENS[0]} which={1} w={2.4} draw />}
        {k === 2 && <ColArrow f={FIG_F} from={GOOD_LENS[0]} col={GOOD_LENS[1]} which={2} w={2.4} draw />}
        {k >= 3 && <Scribble f={FIG_F} pts={X4B_PTS} />}
        {k >= 1 && <LW_GlideDot f={FIG_F} at={k === 1 ? [2, 1] : [3, 3]} beam={false} />}
      </LW_FigWall>
    </Scene>
  );
}

// 5½ · How many directions survive: three small walls, three lenses, lit one
//      by one, each with its count. Rank as a word only.

const X5B_F = wallFrame(7, 3);
const X5B_LENSES: { cols: Cols; name: string; n: number }[] = [
  { cols: GOOD_LENS, name: "গত রাতের", n: 2 },
  { cols: OLD_LENS, name: "পুরানো", n: 1 },
  { cols: SPARE_LENS, name: "বাড়তি", n: 1 },
];
const X5B_SAY = ["তিনটা lens, তিনটা দেয়াল.", "গত রাতের lens: দুইটা দিকই টিকে আছে. পুরা দেয়াল. rank 2.", "পুরানো lens: একটা দিক. হেলানো লাইন. rank 1.", "বাড়তি lens: একটা দিক. শোয়ানো লাইন. rank 1."];

export function HowMany() {
  const s = useScene(3, [600, 2000, 2000, 2000]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <div className="mx-auto grid max-w-[20rem] grid-cols-3 gap-2">
        {X5B_LENSES.map((l, i) => (
          <div key={l.name} className="text-center">
            <LW_Wall f={X5B_F} label={`${l.name} lens এর আলো`} lit={k > i ? <LitRegion f={X5B_F} cols={l.cols} /> : null} width="max-w-none" />
            <div className="mt-1 text-xs text-muted">{l.name}</div>
            <div className="h-5 text-sm font-bold">{k > i ? <span className={`${POP} inline-block`}>{l.n} দিক</span> : ""}</div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// 7½ · Try it's answer walked: with last night's lens, knob 1 twice, (4, 2),
//      then knob 2 once, (5, 4): the star.

const X7B_SAY = ["গত রাতের lens. তারা (5, 4) এ.", "Knob 1 এক পাক: (2, 1).", "আরেক পাক: (4, 2).", "Knob 2 এক পাক: (5, 4). তারার উপরে. পাক (2, 1)."];

export function StarWalk() {
  const s = useScene(3, [600, 1400, 1400, 2200]);
  const k = s.k;
  const at: XY = k === 0 ? [0, 0] : k === 1 ? [2, 1] : k === 2 ? [4, 2] : [5, 4];
  return (
    <Scene scene={s} caption={say(X7B_SAY, k)}>
      <LW_FigWall label="গত রাতের lens এ পাক (2, 1): কমলা লাফ দুইবার, সবুজ লাফ একবার, dot তারার উপর (5, 4) এ" lit={<LitRegion f={FIG_F} cols={GOOD_LENS} />}>
        <Star f={FIG_F} at={X7_TARGET} done={k >= 3} />
        {k >= 1 && <ColArrow f={FIG_F} col={GOOD_LENS[0]} which={1} w={2.4} draw />}
        {k >= 2 && <ColArrow f={FIG_F} from={GOOD_LENS[0]} col={GOOD_LENS[0]} which={1} w={2.4} draw />}
        {k >= 3 && <ColArrow f={FIG_F} from={[4, 2]} col={GOOD_LENS[1]} which={2} w={2.4} draw />}
        <LW_GlideDot f={FIG_F} at={at} beam={false} />
      </LW_FigWall>
    </Scene>
  );
}

// 8b · The bet settled: the three hearts on the old lens, one by one, and the
//      লাইট ভাই's "anywhere" last.

const BS_ROWS: [string, boolean][] = [
  ["দরজার উপরে (6, 3)", true],
  ["জানালার উপরে (2, 4)", false],
  ["নারকেল গাছের দিকে (8, 1)", false],
  ["লাইট ভাই: যেখানে বলবেন, সেখানে", false],
];
const BS_SAY = [
  "পুরানো lens, তিনটা heart.",
  "দরজার উপরেরটা লাইনে. knob 1 এর তিন পাকেই যায়.",
  "জানালার উপরেরটা লাইনের অনেক উপরে. যায় না.",
  "নারকেল গাছের দিকেরটা লাইনের নিচে. যায় না.",
  "তাই সব জায়গায় না. লাইট ভাইয়ের কথা টিকলো না.",
];

function LW_Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <svg viewBox="0 0 12 12" className={`size-4 ${POP}`} aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke="#0d9488" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" className={`size-4 ${POP}`} aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke="#e11d48" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function BetSettled({}: Story) {
  const s = useScene(4, [600, 1800, 1800, 1800, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(BS_SAY, k)}>
      <div className="mx-auto grid max-w-[18rem] gap-1.5">
        {BS_ROWS.map(([t, ok], i) => (
          <div
            key={t}
            className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm transition-colors duration-500 motion-reduce:transition-none ${
              k > i ? (ok ? "border-accent bg-accent/10" : "border-border opacity-60") : "border-border"
            }`}
          >
            <span>{nb(t)}</span>
            {k > i && <LW_Mark ok={ok} />}
          </div>
        ))}
      </div>
    </Scene>
  );
}

// 8½ · For the Ax = b side quest: on the old lens, a b on the line has knob
//      turns; a b off it has none, however the knobs turn.

const X8B_SAY = ["পুরানো lens. প্রশ্ন: কোন পাক x দিলে Ax = b?", "b = (6, 3), লাইনের উপরে. x = (3, 0) দিলেই হয়.", "b = (2, 4), লাইনের বাইরে. কোনো x ই নাই.", "b column space এ থাকলে উত্তর আছে. না থাকলে নাই."];

export function SolvableOrNot() {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X8B_SAY, k)}>
      <LW_FigWall label="পুরানো lens এর আলোর লাইন; (6, 3) লাইনে, উত্তর আছে; (2, 4) বাইরে, উত্তর নাই" lit={<LitRegion f={FIG_F} cols={OLD_LENS} />}>
        {k >= 1 && <Star f={FIG_F} at={[6, 3]} done />}
        {k >= 2 && (
          <g className={POP}>
            <Star f={FIG_F} at={[2, 4]} />
            <path d={`M${FIG_F.sx(2) - 7} ${FIG_F.sy(4) - 7}l14 14m0 -14l-14 14`} stroke="#e11d48" strokeWidth={1.8} strokeLinecap="round" />
          </g>
        )}
        {k >= 1 && k < 3 && <LW_GlideDot f={FIG_F} at={k === 1 ? [6, 3] : [2, 1]} />}
      </LW_FigWall>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  WallBet: { start: {}, picked: { picks: [true, false, true] }, sealed: { picks: [true, true, true], sealed: true } },
  KnobPlay: {
    start: {},
    mid: { ab: [1, 1], trail: [[0, 0], [2, 1], [6, 3]], used: [true, true] },
    done: { ab: [1, -1], trail: [[0, 0], [2, 1], [6, 3], [8, 4], [-2, -1]], used: [true, true], done: true },
  },
  WhyOneLine: { start: {}, mid: { tail: [-1, 1] }, done: { tail: [0, 0] } },
  AllTheLanding: {
    start: {},
    guessed: { guess: 2 },
    wrong: { guess: 2, swept: true },
    right: { guess: 0, swept: true },
    good: { guess: 0, lens: "good", swept: true },
  },
  BrokenCorner: { start: {}, turned: { ab: [3, 2], used: [true, true] }, done: { ab: [3, 2], used: [true, true], swept: true } },
  YourSpots: {
    start: {},
    wrongYes: { line: true, nope: X6_NOPE_YES },
    knobs: { at: 1, said: "yes", ab: [1, 0], marks: [null, "x", null] },
    done: { at: 3, marks: ["lit", "x", "x"], line: false },
  },
  TryReach: { start: {}, wrong: { pick: 0, swept: true }, knobs: { pick: 1, swept: true, ab: [1, 1] }, done: { pick: 1, swept: true, ab: [2, 1], hit: true } },
  HeartsLight: { start: {}, on: { on: true }, two: { on: true, lit: [true, true, false], at: [2, 4] }, done: { on: true, lit: [true, true, true], at: [8, 1] } },
  ApaPoints: { rest: { k: 0 }, apa: { k: 2 }, claim: { k: 3 }, done: {} },
  MachineOn: { rest: { k: 0 }, on: { k: 2 }, done: {} },
  SomReads: { plates: { k: 3 }, done: {} },
  BagLens: { nasib: { k: 1 }, done: {} },
  SpareLens: { rest: { k: 0 }, done: {} },
  LensSwap: { rest: { k: 0 }, out: { k: 1 }, done: {} },
  CrackedLens: { rest: { k: 0 }, done: {} },
  ThreeHearts: { two: { k: 2 }, done: {} },
  TrailOneLine: { one: { k: 1 }, back: { k: 4 }, done: {} },
  StubbornAgain: { one: { k: 1 }, done: {} },
  ZeroWalk: { rest: { k: 0 }, two: { k: 2 }, done: {} },
  MixToSpan: { walk: { k: 2 }, many: { k: 3 }, done: {} },
  HowMany: { one: { k: 1 }, done: {} },
  BetSettled: { mid: { k: 2 }, done: {} },
  SolvableOrNot: { yes: { k: 1 }, done: {} },
  StarWalk: { two: { k: 2 }, done: {} },
};
