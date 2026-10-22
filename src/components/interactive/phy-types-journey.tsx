"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, LOOK, Nope, POP, Scene, Ticks, primaryBtn, useScene, useSeed, useSeeded, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, Loop, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { GroundShadow, PArrow, PH, Ripple, Sheet, Tag, Txt, WrongMark, chip, svgPoint, toneHex, useWalk, type PhTone } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 3 — সোজা, গোল আর চলন"
// (src/content/articles/physics_for_high_school/03_types_of_motion.mdx), the
// journey of video EP 03 (physics_9_10/03-types-of-motion/script.md). Book
// §2.2, pp. 35–36.
//
// The spine: a car goes forward while its wheels turn round. The reader bets
// how many kinds of motion one car has (CarBet), settled on the last screen.
// On the way, the video's beats in order: তিথি on the roof sees a fan, a
// rickshaw and a swing (RoofThree); a stone dropped from the roof goes straight
// down (StoneDrop, then the carrom striker): সরলরৈখিক; a fan blade's tip goes
// round at one distance (FanRound, then the Moon): ঘূর্ণন; every dot on a box
// moves the same way the same distance (BoxSlide): চলন; the car's body is চলন
// and its wheels ঘূর্ণন (CarParts); two planes on the same wavy climb, only the
// one that keeps its nose one way is চলন (PlanePick); the reader sorts three
// motions (SortThree).
//
// Group colours are the video's: সরলরৈখিক blue, ঘূর্ণন amber, চলন mint. The
// video has no numbers, so no screen measures anything.

type Story = { story?: boolean };
type P = [number, number];

const RAD = Math.PI / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pathOf = (pts: P[]) => "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L");
const sample = (f: (s: number) => P, u: number, n = 48) => {
  const m = Math.max(2, Math.ceil(n * u));
  return pathOf(Array.from({ length: m + 1 }, (_, i) => f((u * i) / m)));
};
const arcD = (cx: number, cy: number, r: number, a0: number, a1: number) => sample((s) => [cx + r * Math.cos(lerp(a0, a1, s) * RAD), cy + r * Math.sin(lerp(a0, a1, s) * RAD)], 1, Math.ceil(Math.abs(a1 - a0) / 6));

const CALM = "(prefers-reduced-motion: reduce)";
const calmSub = (cb: () => void) => {
  const m = window.matchMedia(CALM);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
/** Whether the reader asked for less motion (true on the server, so loops never run in a preview). */
function useCalm() {
  return useSyncExternalStore(calmSub, () => window.matchMedia(CALM).matches, () => true);
}
/** A little air on each side of a Bangla tag (the kit's width guess runs short on conjuncts). */
const pad = (s: string) => `\u00a0\u00a0${s}\u00a0\u00a0`;

/** A screen-direction word for a little arrow: উপরে-ডানে, ডানে… */
function dirWord(dx: number, dy: number) {
  const a = (Math.atan2(dy, dx) / RAD + 360) % 360;
  const k = Math.round(a / 45) % 8;
  return ["ডানে", "নিচে-ডানে", "নিচে", "নিচে-বামে", "বামে", "উপরে-বামে", "উপরে", "উপরে-ডানে"][k];
}

// ---------------------------------------------------------------------------
// The three groups, the video's bins.

export type Group = "lin" | "rot" | "tra";
export const GROUP: Record<Group, { bn: string; en: string; tone: PhTone; rule: string[] }> = {
  lin: { bn: "সরলরৈখিক", en: "Linear", tone: "blue", rule: ["পথ সোজা"] },
  rot: { bn: "ঘূর্ণন", en: "Circular", tone: "amber", rule: ["পথ বৃত্ত"] },
  tra: { bn: "চলন", en: "Translational", tone: "mint", rule: ["সব বিন্দু একসাথে,", "একই দিকে"] },
};

/** A round arrow (not a vector: it says "turns"), clockwise from `from` degrees through `sweep`. */
export function SpinArrow({ cx, cy, r, tone = "amber", from = -150, sweep = 290, w = 1.8 }: { cx: number; cy: number; r: number; tone?: PhTone; from?: number; sweep?: number; w?: number }) {
  const c = toneHex(tone);
  const a1 = (from + sweep) * RAD;
  const p1: P = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  const t: P = [-Math.sin(a1), Math.cos(a1)];
  const n: P = [Math.cos(a1), Math.sin(a1)];
  const hl = 4 + w * 1.2;
  const tip: P = [p1[0] + t[0] * hl * 0.7, p1[1] + t[1] * hl * 0.7];
  const b1: P = [p1[0] - t[0] * hl * 0.3 + n[0] * hl * 0.5, p1[1] - t[1] * hl * 0.3 + n[1] * hl * 0.5];
  const b2: P = [p1[0] - t[0] * hl * 0.3 - n[0] * hl * 0.5, p1[1] - t[1] * hl * 0.3 - n[1] * hl * 0.5];
  return (
    <g className="pointer-events-none">
      <path d={arcD(cx, cy, r, from, from + sweep)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />
      <path d={`M${tip[0]} ${tip[1]}L${b1[0]} ${b1[1]}L${b2[0]} ${b2[1]}Z`} fill={c} />
    </g>
  );
}

/** A group's little picture in a 28 × 20 box at (x, y): a straight arrow, a round arrow, a box slid along. */
export function GroupGlyph({ g, x = 0, y = 0, s = 1 }: { g: Group; x?: number; y?: number; s?: number }) {
  const c = toneHex(GROUP[g].tone);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      {g === "lin" && <path d="M3 10H19M17 5.5L23.5 10L17 14.5Z" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill={c} />}
      {g === "rot" && (
        <>
          <SpinArrow cx={13} cy={10} r={7} tone={GROUP[g].tone} from={-200} sweep={280} w={2.2} />
          <circle cx={13} cy={10} r={1.8} fill={c} />
        </>
      )}
      {g === "tra" && (
        <>
          <rect x={2.5} y={10.5} width={7} height={7} rx={1} fill="none" stroke={c} strokeWidth={1.3} strokeDasharray="2 1.5" />
          <rect x={17} y={2} width={8} height={8} rx={1.2} fill={c} />
          <path d="M6 10.5L16.5 4M9.5 14L20 7.6" stroke={c} strokeWidth={1.4} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

/** One bin of the three, top-left at (x, y): dashed with its number until `g` fills it. */
function Bin({ x, y, w, h, n, g, rule = false }: { x: number; y: number; w: number; h: number; n: number; g?: Group; rule?: boolean }) {
  if (!g)
    return (
      <g className="pointer-events-none">
        <rect x={x} y={y} width={w} height={h} rx={9} fill="#f8fafc" stroke={PH.faint} strokeWidth={1.4} strokeDasharray="4 3" />
        <Txt x={x + w / 2} y={y + h / 2 + 6} size={17} color={PH.faint} weight={800}>
          {String(n)}
        </Txt>
      </g>
    );
  const G = GROUP[g];
  const c = toneHex(G.tone);
  return (
    <g className={`pointer-events-none ${POP}`}>
      <rect x={x} y={y} width={w} height={h} rx={9} fill={G.tone === "blue" ? PH.blueSoft : G.tone === "amber" ? PH.amberSoft : PH.mintSoft} stroke={c} strokeWidth={1.6} />
      <GroupGlyph g={g} x={x + w / 2 - 14} y={y + 8} />
      <Txt x={x + w / 2} y={y + 44} size={12.5} color={c} weight={800}>
        {G.bn}
      </Txt>
      <Txt x={x + w / 2} y={y + 57} size={8.5} color={PH.mute}>
        {G.en}
      </Txt>
      {rule &&
        G.rule.map((l, i) => (
          <Txt key={l} x={x + w / 2} y={y + 76 + i * 11} size={9} color={PH.ink}>
            {l}
          </Txt>
        ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// The car of scenes 1 and 8, side view. Wheels sit on y = 0; `spin` turns the
// spokes (degrees), `tilt` turns the whole car about its middle, `mark` puts a
// dot on the front wheel's spoke. `loop` spins the spokes by SVG animation
// while a story scene glides the car.

const CAR_BODY =
  "M-40 -12Q-41 -24 -34 -25L-20 -26L-11 -38Q-9 -40 -6 -40L12 -40Q15 -40 17 -38L26 -27L36 -25Q41 -24 40 -12Q40 -9 37 -9L34.5 -9A10.5 10.5 0 0 0 13.5 -9L-13.5 -9A10.5 10.5 0 0 0 -34.5 -9L-37 -9Q-40 -9 -40 -12Z";
export const CAR = { R: 9, WX: [-24, 24] as const, DOTS: [[-30, -17], [-3, -33], [30, -17]] as P[] };
type CarLoop = { run: string; ms: number; dur: number };

function CarWheel({ x, spin, mark, loop }: { x: number; spin: number; mark: boolean; loop?: CarLoop }) {
  return (
    <g transform={`translate(${x} -9)`}>
      <circle r={9} fill="#1f2937" />
      <circle r={6.4} fill="#cbd5e1" />
      <g transform={`rotate(${spin})`}>
        <g>
          {loop && <Loop on run={loop.run} ms={loop.ms} type="rotate" values="0 0 0;360 0 0" dur={loop.dur} />}
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d="M0 0V-6" transform={`rotate(${a})`} stroke="#475569" strokeWidth={1.1} />
          ))}
          {mark && <circle cy={-6} r={2} fill={PH.amber} stroke="#fff" strokeWidth={0.6} />}
        </g>
      </g>
      <circle r={1.6} fill="#475569" />
    </g>
  );
}

export function Car({ x, y, s = 1, spin = 0, tilt = 0, mark = false, ghost = false, loop }: { x: number; y: number; s?: number; spin?: number; tilt?: number; mark?: boolean; ghost?: boolean; loop?: CarLoop }) {
  if (ghost)
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none" fill="none" stroke={PH.mute} strokeWidth={1 / s} strokeDasharray="3 2.5" opacity={0.6}>
        <path d={CAR_BODY} />
        {CAR.WX.map((wx) => (
          <circle key={wx} cx={wx} cy={-9} r={9} />
        ))}
      </g>
    );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <ellipse cy={1} rx={38} ry={3} fill={PH.ink} opacity={0.1} />
      <g transform={`rotate(${tilt} 0 -20)`}>
      <path d={CAR_BODY} fill="#4f6fa8" stroke={PH.ink} strokeWidth={0.9 / s} strokeLinejoin="round" />
      <path d="M-39 -17H39" stroke="#9fb3d6" strokeWidth={1.2} />
      <path d="M-17 -27L-10 -37H2V-27ZM5 -27V-37H12Q14 -37 15 -35.5L22 -27Z" fill="#c7d6ee" />
      <path d="M3.5 -38V-12" stroke="#3f5c91" strokeWidth={0.8} />
      <rect x={36.5} y={-23} width={3.5} height={3} rx={1} fill="#fde68a" />
      <rect x={-40.5} y={-23} width={3} height={3} rx={1} fill={PH.red} />
      {CAR.WX.map((wx, i) => (
        <CarWheel key={wx} x={wx} spin={spin} mark={mark && i === 1} loop={loop} />
      ))}
      </g>
    </g>
  );
}

/** A flat road under the car: a grey band from y, white dashes. */
function Road({ y, w = 300, h = 18 }: { y: number; w?: number; h?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={1} y={y} width={w - 2} height={h} fill="#d6d3cb" />
      <path d={`M8 ${y + h / 2}H${w - 8}`} stroke="#fff" strokeWidth={1.4} strokeDasharray="10 8" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: a car rolls along; the body glides, the
// spokes spin; then the two motions are pointed out, and a ?.

export function CarRolls({}: Story) {
  const s = useScene(2, [600, 2000]);
  const k = s.k;
  const calm = useCalm();
  const X0 = 72;
  const X1 = 196;
  const SC = 1.45;
  const turns = (X1 - X0) / (2 * Math.PI * CAR.R * SC);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="একটা গাড়ি রাস্তা দিয়ে সামনে যাচ্ছে, চাকাগুলো গোল গোল ঘুরছে। একই গাড়িতে দুই রকম গতি?">
        <path d="M0 164H320" stroke="#fff" strokeWidth={2} strokeDasharray="14 10" />
        <g style={{ transform: `translate(${k >= 1 ? X1 - X0 : 0}px, 0px)` }} className="transition-transform duration-[1800ms] ease-in-out motion-reduce:transition-none">
          <Car x={X0} y={152} s={SC} loop={k === 1 && !calm ? { run: "go", ms: 1800, dur: 1.8 / turns } : undefined} />
        </g>
        {k >= 2 && (
          <g className={FADE}>
            <PArrow a={[X1 - 46, 82]} b={[X1 + 48, 82]} tone="ink" w={2.2} tell="সামনে" />
            <Txt x={X1} y={74} size={10} weight={800}>
              সামনে
            </Txt>
            <SpinArrow cx={X1 + CAR.WX[1] * SC} cy={152 - CAR.R * SC} r={CAR.R * SC + 5} tone="amber" w={2.2} />
            <Txt x={X1 + 35} y={177} size={10} color={PH.amber} weight={800}>
              গোল গোল
            </Txt>
            <Txt x={290} y={120} size={36} color={PH.amber} weight={800}>
              ?
            </Txt>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: how many kinds of motion does the car have? The pick
// rolls the car and draws what the pick claims on it, each with a ?. Not marked.

const BET = ["এক রকম: পুরো গাড়িটা সামনে যায়", "দুই রকম: বডি সামনে যায়, চাকা ঘোরে", "এক রকম: চাকা ঘোরে, তাই গাড়ি চলে"];

export function CarBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const roll = useWalk(900, { steps: false });
  const choose = (i: number) => {
    setBet(i);
    sfx.stamp();
    roll.start();
    pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।");
  };
  const t = bet === null ? 0 : roll.running ? roll.t : 1;
  const SC = 1.2;
  const x = lerp(96, 176, t);
  const spin = ((x - 96) / (CAR.R * SC)) / RAD;
  const drawn = bet !== null && !roll.running;
  const wheels = CAR.WX.map((wx) => x + wx * SC);
  const wy = 96 - CAR.R * SC;
  const q = (qx: number, qy: number) => (
    <Txt x={qx} y={qy} size={13} color={PH.red} weight={800}>
      ?
    </Txt>
  );
  return (
    <>
      <Sheet w={300} h={122} label="রাস্তায় একটা গাড়ি। যে বাজি ধরবেন, গাড়ির উপর সেটাই আঁকা হবে।" className="max-w-[21rem]">
        <Road y={96} />
        <Car x={x} y={96} s={SC} spin={spin} />
        {bet === null && (
          <Txt x={250} y={66} size={30} color={PH.amber} weight={800}>
            ?
          </Txt>
        )}
        {drawn && bet === 0 && (
          <g className={FADE}>
            <PArrow a={[x - 56, 26]} b={[x + 56, 26]} tone="blue" tell="পুরো গাড়ি: সামনে" />
            {q(x + 70, 30)}
          </g>
        )}
        {drawn && bet === 1 && (
          <g className={FADE}>
            <PArrow a={[x - 44, 30]} b={[x + 40, 30]} tone="blue" tell="বডি: সামনে" />
            {q(x + 54, 34)}
            {wheels.map((wx) => (
              <g key={wx}>
                <SpinArrow cx={wx} cy={wy} r={CAR.R * SC + 4} tone="amber" />
              </g>
            ))}
            {q(wheels[1] + 22, wy + 4)}
          </g>
        )}
        {drawn && bet === 2 && (
          <g className={FADE}>
            {wheels.map((wx) => (
              <SpinArrow key={wx} cx={wx} cy={wy} r={CAR.R * SC + 4} tone="amber" />
            ))}
            {q(wheels[1] + 22, wy + 4)}
          </g>
        )}
      </Sheet>
      <div className="mt-3 grid gap-2">
        {BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>একই গাড়িতে কয় রকম গতি? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2a · Story scene for screen 2: তিথি on the roof. Across the lane a fan turns
// in a window, a rickshaw goes by, the boy next door swings.

const RICK_D = "M-18 -18Q-18 -34 -2 -34L-2 -30Q-14 -30 -14 -18Z";

/** A rickshaw, wheels on y = 0, facing right: hood, seat, the puller at the front. */
function Rickshaw({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d={RICK_D} fill="#c2410c" />
      <rect x={-18} y={-21} width={17} height={7} rx={1.5} fill="#2563eb" />
      <path d="M-8 -9L4 -12L17 -5M4 -12L12 -22" stroke={PH.ink} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <circle cx={-8} cy={-9} r={9} fill="none" stroke={PH.ink} strokeWidth={1.4} />
      <path d="M-17 -9H1M-8 -18V0" stroke="#94a3b8" strokeWidth={0.6} />
      <circle cx={17} cy={-5} r={5} fill="none" stroke={PH.ink} strokeWidth={1.3} />
      <path d="M11 -22L13 -30" stroke="#f1e9da" strokeWidth={3.4} strokeLinecap="round" />
      <path d="M12 -23L15 -14" stroke="#475569" strokeWidth={2} strokeLinecap="round" />
      <circle cx={13.5} cy={-33.5} r={3.4} fill="#a16207" />
    </g>
  );
}

/** A ceiling fan seen from below, centre (x, y), blade length r, turned `rot` degrees; `mark` dots blade 0's tip. */
function Fan({ x, y, r, rot = 0, mark = false, spin = false }: { x: number; y: number; r: number; rot?: number; mark?: boolean; spin?: boolean }) {
  const blade = `M${r * 0.12} -${r * 0.07}L${r * 0.86} -${r * 0.16}Q${r * 1.02} -${r * 0.13} ${r} 0Q${r * 1.02} ${r * 0.13} ${r * 0.86} ${r * 0.16}L${r * 0.12} ${r * 0.07}Z`;
  return (
    <g transform={`translate(${x} ${y})`} className="pointer-events-none">
      <g transform={`rotate(${rot - 90})`}>
        <g>
          {spin && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.7s" repeatCount="indefinite" />}
          {[0, 120, 240].map((a) => (
            <path key={a} d={blade} transform={`rotate(${a})`} fill="#e6d9bc" stroke={PH.ink} strokeWidth={0.8} strokeLinejoin="round" />
          ))}
          {mark && <circle cx={r} cy={0} r={Math.max(2.4, r * 0.06)} fill={PH.amber} stroke="#fff" strokeWidth={0.8} />}
        </g>
      </g>
      <circle r={Math.max(4, r * 0.16)} fill="#64748b" stroke={PH.ink} strokeWidth={0.8} />
      <circle r={Math.max(1.6, r * 0.05)} fill="#e2e8f0" />
    </g>
  );
}

/** The swing: frame from (x, top) down to `foot`, seat on ropes of length L, the boy next door on it. */
function Swing({ x, top, foot, L, deg = 0, rock = false, trail = false }: { x: number; top: number; foot: number; L: number; deg?: number; rock?: boolean; trail?: boolean }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 28} ${foot}L${x - 20} ${top}M${x + 28} ${foot}L${x + 20} ${top}M${x - 24} ${top}H${x + 24}`} stroke="#7c4a24" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      {trail && <path d={arcD(x, top, L, 90 - 24, 90 + 24)} stroke={PH.amber} strokeWidth={1.8} strokeDasharray="3 3" fill="none" className={FADE} />}
      <g transform={`rotate(${deg} ${x} ${top})`}>
        <g>
          {rock && <animateTransform attributeName="transform" type="rotate" values={`22 ${x} ${top};-22 ${x} ${top};22 ${x} ${top}`} dur="2s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite" />}
          <path d={`M${x - 6} ${top}V${top + L}M${x + 6} ${top}V${top + L}`} stroke="#e7e5e4" strokeWidth={0.9} />
          <rect x={x - 9} y={top + L - 1} width={18} height={3.2} rx={1} fill="#92400e" />
          <path d={`M${x - 1} ${top + L - 2}L${x + 1} ${top + L - 15}`} stroke="#4f7fd0" strokeWidth={6} strokeLinecap="round" />
          <path d={`M${x + 1} ${top + L}l5 7`} stroke="#334155" strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={x + 1.5} cy={top + L - 20} r={4} fill="#c68e5f" />
          <path d={`M${x - 2.5} ${top + L - 21}q4 -5.5 8 0`} fill="#1c1917" />
        </g>
      </g>
    </g>
  );
}

/** The rooftop world of screens 2 and 9: তিথি's roof, the swing next door, a window with a fan, the lane. */
function RoofWorld({ fanOn, rickAt, rickMs = 2600, swingOn, dim = false, trail = false, bubble }: { fanOn: boolean; rickAt: number; rickMs?: number; swingOn: boolean; dim?: boolean; trail?: boolean; bubble?: string[] }) {
  const calm = useCalm();
  return (
    <>
      <rect x={196} y={60} width={124} height={90} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
      <path d="M190 62L258 38L326 62Z" fill="#94a3b8" />
      <g opacity={dim ? 0.18 : 1} className="transition-opacity duration-700 motion-reduce:transition-none">
        <rect x={214} y={74} width={58} height={44} rx={2} fill="#dbeafe" stroke="#64748b" strokeWidth={1.2} />
        <Fan x={243} y={96} r={17} spin={fanOn && !calm} />
      </g>
      <text x={243} y={134} fontSize={8} fontWeight={700} textAnchor="middle" fill={PH.mute} opacity={dim ? 0.3 : 1}>
        ফ্যান
      </text>
      <Swing x={150} top={88} foot={150} L={44} rock={swingOn && !calm} trail={trail} />
      <text x={150} y={83} fontSize={8} fontWeight={700} textAnchor="middle" fill={PH.mute}>
        দোলনা
      </text>
      <rect x={0} y={108} width={104} height={42} fill="#e7d7c1" stroke="#a8a29e" strokeWidth={1} />
      <rect x={0} y={102} width={104} height={6} fill="#d6c4a8" />
      {[14, 44, 74].map((wx) => (
        <rect key={wx} x={wx} y={118} width={14} height={14} rx={1} fill="#93c5fd" stroke="#64748b" strokeWidth={0.6} />
      ))}
      <Person who="tithi" x={60} y={102} scale={0.85} label />
      <g opacity={dim ? 0.18 : 1} className="transition-opacity duration-700 motion-reduce:transition-none">
        <g style={{ transform: `translate(${rickAt}px, 0px)`, transitionDuration: `${rickMs}ms` }} className="transition-transform ease-linear motion-reduce:transition-none">
          <Rickshaw x={0} y={176} s={0.9} />
        </g>
      </g>
      {bubble && <Bubble x={60} y={44} tone="think" lines={bubble} />}
    </>
  );
}

export function RoofView({}: Story) {
  const s = useScene(3, [600, 1400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="তিথি ছাদে। পাশের বাসার জানালায় ফ্যান ঘুরছে, নিচের গলিতে রিকশা যাচ্ছে, পাশের বাসার ছেলেটা দোলনায় দুলছে।">
        <RoofWorld fanOn={k >= 1} rickAt={k >= 2 ? 292 : 128} swingOn={k >= 3} bubble={k >= 3 ? ["কত রকম", "নড়াচড়া!"] : undefined} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · Three things, three paths. Each card plays its thing once and keeps the
// path of one marked point: the fan blade's tip, a rickshaw's seat, the swing's
// seat. Nothing is named yet.

type Thing = "fan" | "rick" | "swing";
const X2_THINGS: { id: Thing; bn: string }[] = [
  { id: "fan", bn: "ফ্যান" },
  { id: "rick", bn: "রিকশা" },
  { id: "swing", bn: "দোলনা" },
];
const X2_MS = 1500;
const X2_CARD = { w: 92, h: 134, y: 8 };
const x2Left = (i: number) => 6 + i * 98;

export function RoofThree() {
  const pass = useGate();
  const [seen, setSeen] = useSeed<Thing[]>("seen", []);
  const [cur, setCur] = useState<Thing | null>(null);
  // a fan turns evenly, a rickshaw rolls on evenly, a swing's own cos() gives it its swing: all on a linear clock
  const play = useWalk(X2_MS, { steps: false, ease: "linear" });
  const tap = (id: Thing) => {
    if (play.running) return;
    const next = seen.includes(id) ? seen : [...seen, id];
    setCur(id);
    sfx.tap();
    play.start(() => {
      setSeen(next);
      if (next.length === 3 && seen.length < 3) {
        sfx.chime();
        pass("ফ্যান, রিকশা, দোলনা: তিন রকম পথ।");
      }
    });
  };
  const tOf = (id: Thing) => (play.running && cur === id ? play.t : seen.includes(id) ? 1 : 0);
  return (
    <>
      <Sheet w={300} h={150} label="তিনটা card: ফ্যান, রিকশা, দোলনা। tap করলে সেটা নড়ে, আর একটা বিন্দুর পথ আঁকা থাকে।" className="max-w-[22rem]">
        {X2_THINGS.map((th, i) => {
          const x0 = x2Left(i);
          const t = tOf(th.id);
          const on = t > 0;
          const cx = x0 + X2_CARD.w / 2;
          let body: ReactNode = null;
          if (th.id === "fan") {
            const R = 32;
            const rot = 360 * t;
            body = (
              <>
                {on && <path d={arcD(cx, 64, R, -90, -90 + Math.max(1, rot))} stroke={PH.amber} strokeWidth={2} strokeDasharray="3 2.5" fill="none" />}
                <Fan x={cx} y={64} r={R} rot={rot} mark />
              </>
            );
          } else if (th.id === "rick") {
            const RS = 1.3;
            const rx = lerp(x0 + 25, x0 + 62, t);
            const seat = (q: number): P => [q - 9 * RS, 116 - 17.5 * RS];
            body = (
              <>
                <path d={`M${x0 + 4} 116H${x0 + X2_CARD.w - 4}`} stroke="#a8a29e" strokeWidth={1.4} />
                {on && <path d={`M${seat(x0 + 25)[0]} ${seat(0)[1]}H${seat(rx)[0]}`} stroke={PH.amber} strokeWidth={2} strokeDasharray="3 2.5" />}
                <GroundShadow x={rx} y={116} rx={26} />
                <Rickshaw x={rx} y={116} s={RS} />
                <circle cx={seat(rx)[0]} cy={seat(rx)[1]} r={2.6} fill={PH.amber} stroke="#fff" strokeWidth={0.8} />
              </>
            );
          } else {
            const th0 = (a: number) => 30 * Math.cos(2 * Math.PI * a);
            const L = 62;
            const seat = (a: number): P => [cx + L * Math.sin(-th0(a) * RAD), 26 + L * Math.cos(th0(a) * RAD)];
            const deg = th0(t);
            body = (
              <>
                {on && <path d={sample(seat, t)} stroke={PH.amber} strokeWidth={2} strokeDasharray="3 2.5" fill="none" />}
                <Swing x={cx} top={26} foot={128} L={L} deg={deg} />
                <circle cx={seat(t)[0]} cy={seat(t)[1]} r={2.6} fill={PH.amber} stroke="#fff" strokeWidth={0.8} />
              </>
            );
          }
          return (
            <g key={th.id} onClick={() => tap(th.id)} className="cursor-pointer" role="button" aria-label={th.bn}>
              <rect x={x0} y={X2_CARD.y} width={X2_CARD.w} height={X2_CARD.h} rx={10} fill={seen.includes(th.id) ? "#fffbeb" : "#f8fafc"} stroke={seen.includes(th.id) ? PH.amber : PH.faint} strokeWidth={1.3} />
              {body}
              <Txt x={cx} y={X2_CARD.y + X2_CARD.h - 6} size={11} weight={800}>
                {th.bn}
              </Txt>
            </g>
          );
        })}
      </Sheet>
      <Ticks items={X2_THINGS.map((th) => [th.bn, seen.includes(th.id)] as [string, boolean])} />
      <Task done={seen.length >= 3}>তিনটা card-এ একে একে tap করুন। হলুদ বিন্দুটা কোন পথে যায়, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The first group: a stone let go from the roof edge falls straight down.
// The reader lets go; the stone falls on the clock, faster and faster (a dot
// left every equal beat of time, so the gaps grow), then a straight line is
// laid along its path.

const X3_TICKS = 18;
const X3_MS = 900;
const X3_S: P = [126, 22];
const X3_GROUND = 183;

export function StoneDrop() {
  const pass = useGate();
  const [landed, setLanded] = useSeed("landed", false);
  // a fall speeds up: distance grows as time squared ("in")
  const fall = useWalk(X3_MS, { steps: false, ease: "in" });
  const drop = () => {
    if (fall.running) return;
    setLanded(false);
    sfx.whoosh(0.5);
    fall.start(() => {
      setLanded(true);
      sfx.thump();
      pass("ঢিলের পথ একটা সরলরেখা।");
    });
  };
  const t = fall.running ? fall.t : landed ? 1 : 0;
  // one dot per equal beat of time: beat i is passed once (i/N)² of the drop is
  const k = Math.min(X3_TICKS, Math.floor(Math.sqrt(t) * X3_TICKS + 1e-6));
  const yAt = (i: number) => X3_S[1] + (X3_GROUND - X3_S[1]) * (i / X3_TICKS) ** 2;
  const stoneY = X3_S[1] + (X3_GROUND - X3_S[1]) * t;
  const done = landed && !fall.running;
  return (
    <>
      <Sheet w={300} h={200} label="তিথি ছাদের কিনারে, হাতে একটা ঢিল। ছেড়ে দিলে ঢিলটা নিচে পড়ে, পথে বিন্দু রেখে যায়।" className="max-w-[20rem]">
        <rect x={1} y={186} width={298} height={13} fill="#d6d3cb" />
        <rect x={30} y={52} width={90} height={134} fill="#efe3cf" stroke={PH.ink} strokeWidth={1} />
        <rect x={28} y={46} width={94} height={6} rx={1} fill="#d6c4a8" stroke={PH.ink} strokeWidth={1} />
        {[0, 1, 2, 3].map((r) =>
          [44, 82].map((wx) => <rect key={`${r}${wx}`} x={wx} y={66 + r * 30} width={16} height={16} rx={1.5} fill={PH.blueSoft} stroke={PH.ink} strokeWidth={0.7} />),
        )}
        <Person who="tithi" x={108} y={46} scale={0.62} arm={t === 0 ? "point" : "down"} />
        {Array.from({ length: k + 1 }, (_, i) => (
          <circle key={i} cx={X3_S[0]} cy={yAt(i)} r={1.7} fill={PH.mute} className="pointer-events-none" />
        ))}
        {done && <Draw d={`M${X3_S[0]} ${X3_S[1]}V${X3_GROUND}`} strokeWidth={1.8} className="stroke-[#2563eb]" ms={700} />}
        {done && <Ripple at={[X3_S[0], X3_GROUND]} r={22} />}
        <g onClick={drop} className="cursor-pointer" role="button" aria-label="ঢিল ছেড়ে দিন">
          <circle cx={X3_S[0]} cy={stoneY} r={14} fill="transparent" />
          <circle cx={X3_S[0]} cy={stoneY} r={4.6} fill="#78716c" stroke={PH.ink} strokeWidth={1} />
        </g>
        {done && <Tag x={X3_S[0] + 58} y={112} text={pad("পথটা সোজা রেখা")} tone="blue" pop />}
      </Sheet>
      <div className="mt-2 flex justify-center">
        <button type="button" className={`${primaryBtn} h-9! px-4!`} disabled={fall.running} onClick={drop}>
          {landed ? "আবার ছাড়ুন" : "ঢিল ছেড়ে দিন"}
        </button>
      </div>
      <Task done={landed}>ছাদ থেকে ঢিলটা ছেড়ে দিন। ঢিলটা কোন পথে নামে, দেখুন।</Task>
    </>
  );
}

// 3½ · Figure for screen 3's explanation: the carrom striker, flicked, goes
// in a straight line; the first bin fills.

const S3_SAY = ["Carrom board, striker বসানো।", "টোকা দিলেন, striker গেলো সোজা লাইনে।", "পথটা একটা সরলরেখা, ব্যস, এটুকুই।"];
const S3_A: P = [83, 121];
const S3_B: P = [150, 28];

export function CarromStrike({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S3_SAY[k]}</span>}>
      <Sheet w={200} h={174} label="উপর থেকে carrom board। striker-এ টোকা দিলে সেটা সোজা লাইনে পকেটের দিকে যায়।" className="max-w-[14rem]">
        <rect x={30} y={8} width={140} height={140} rx={6} fill="#6b4a2f" />
        <rect x={40} y={18} width={120} height={120} fill="#e9d3a1" />
        {[
          [46, 24],
          [154, 24],
          [46, 132],
          [154, 132],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={6} fill="#1c1917" />
        ))}
        <path d="M62 34H138M62 122H138M56 40V116M144 40V116" stroke="#a0784c" strokeWidth={0.8} />
        <circle cx={100} cy={78} r={15} fill="none" stroke="#a0784c" strokeWidth={0.8} />
        <circle cx={100} cy={78} r={3} fill={PH.red} />
        <circle cx={72} cy={62} r={3.6} fill="#1c1917" />
        <circle cx={79} cy={58} r={3.6} fill="#f5f5f4" stroke="#a8a29e" strokeWidth={0.5} />
        <circle cx={77} cy={66} r={3.6} fill="#1c1917" />
        {k >= 1 && <Draw d={`M${S3_A[0]} ${S3_A[1]}L${S3_B[0]} ${S3_B[1]}`} strokeWidth={1.6} className="stroke-[#2563eb]" ms={900} />}
        <g style={{ transform: `translate(${k >= 1 ? S3_B[0] - S3_A[0] : 0}px, ${k >= 1 ? S3_B[1] - S3_A[1] : 0}px)` }} className="transition-transform duration-[900ms] ease-out motion-reduce:transition-none">
          <circle cx={S3_A[0]} cy={S3_A[1]} r={5.5} fill="#fafaf9" stroke="#78716c" strokeWidth={1} />
          <circle cx={S3_A[0]} cy={S3_A[1]} r={2.5} fill="none" stroke="#a8a29e" strokeWidth={0.6} />
        </g>
        {k >= 2 && <Tag x={100} y={162} text={pad("সরলরৈখিক · Linear")} tone="blue" solid pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · The second group: a fan blade's tip. The reader drags the tip round the
// centre; the radius line from the centre never changes length, and the tip's
// path fills a circle (12 sectors). Then the clock's minute hand goes round.

const X4_C: P = [104, 98];
const X4_R = 70;
const X4_SEC = 12;
const X4_CLOCK: P = [246, 92];
const X4_HAND_MS = 1440;

export function FanRound() {
  const pass = useGate();
  const [ang, setAng] = useSeed("ang", -90);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [drag, setDrag] = useState(false);
  // a clock's minute hand goes round evenly
  const hand = useWalk(X4_HAND_MS, { steps: false, ease: "linear" });
  const done = seen.length >= X4_SEC;
  const aim = (e: React.PointerEvent<SVGSVGElement>) => {
    const [x, y] = svgPoint(e, 300, 200);
    if (Math.hypot(x - X4_C[0], y - X4_C[1]) < 10) return;
    const deg = Math.atan2(y - X4_C[1], x - X4_C[0]) / RAD;
    setAng(deg);
    const sec = ((Math.floor(((deg + 360) % 360) / 30) % X4_SEC) + X4_SEC) % X4_SEC;
    if (!seen.includes(sec)) {
      const next = [...seen, sec];
      setSeen(next);
      sfx.tap();
      if (next.length === X4_SEC) {
        hand.start(() => {
          sfx.chime();
          pass("কেন্দ্র থেকে সবসময় একই দূরত্ব।");
        });
      }
    }
  };
  const tip: P = [X4_C[0] + X4_R * Math.cos(ang * RAD), X4_C[1] + X4_R * Math.sin(ang * RAD)];
  const tau = done ? (hand.running ? hand.t : 1) : 0;
  const handDeg = -90 + 360 * tau;
  return (
    <>
      <Sheet
        w={300}
        h={200}
        label="নিচ থেকে দেখা ফ্যান। পাখার মাথায় হলুদ বিন্দু, কেন্দ্র থেকে মাথা পর্যন্ত একটা দাগ। পাশে একটা ঘড়ি।"
        className="max-w-[22rem] cursor-grab"
        onPointerDown={(e) => {
          setDrag(true);
          aim(e);
        }}
        onPointerMove={(e) => drag && aim(e)}
        onPointerUp={() => setDrag(false)}
      >
        {/* the circle is built by the sweep: every 30° the tip has covered is drawn in */}
        {seen.map((sec) => (
          <Draw key={sec} d={arcD(X4_C[0], X4_C[1], X4_R, sec * 30, sec * 30 + 30)} ms={300} strokeWidth={2.2} className="stroke-[#d97706]" />
        ))}
        {done && <Ripple at={X4_C} tone="amber" r={X4_R} />}
        <Fan x={X4_C[0]} y={X4_C[1]} r={X4_R} rot={ang + 90} mark />
        <path d={`M${X4_C[0]} ${X4_C[1]}L${tip[0]} ${tip[1]}`} stroke={PH.ink} strokeWidth={1.2} strokeDasharray="3 2.5" className="pointer-events-none" />
        <circle cx={X4_C[0]} cy={X4_C[1]} r={2.6} fill={PH.ink} className="pointer-events-none" />
        <Txt x={(X4_C[0] + tip[0]) / 2 + 7} y={(X4_C[1] + tip[1]) / 2 - 3} size={11} weight={800} color={PH.ink}>
          r
        </Txt>
        <circle cx={tip[0]} cy={tip[1]} r={8} fill="none" stroke={PH.amber} strokeWidth={1.2} className="pointer-events-none" />
        <Txt x={X4_C[0]} y={192} size={9.5} color={PH.mute}>
          ফ্যানের পাখা
        </Txt>
        <g className="pointer-events-none">
          <circle cx={X4_CLOCK[0] + 1} cy={X4_CLOCK[1] + 2} r={36} fill={PH.ink} opacity={0.08} />
          <circle cx={X4_CLOCK[0]} cy={X4_CLOCK[1]} r={36} fill="#f7efdf" stroke={PH.ink} strokeWidth={1.2} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = i * 30 * RAD;
            return <path key={i} d={`M${X4_CLOCK[0] + 30 * Math.cos(a)} ${X4_CLOCK[1] + 30 * Math.sin(a)}L${X4_CLOCK[0] + 33 * Math.cos(a)} ${X4_CLOCK[1] + 33 * Math.sin(a)}`} stroke={PH.mute} strokeWidth={i % 3 ? 0.8 : 1.6} />;
          })}
          {tau > 0 && <path d={arcD(X4_CLOCK[0], X4_CLOCK[1], 26, -90, Math.max(-89, handDeg))} stroke={PH.amber} strokeWidth={1.8} strokeDasharray="3 2.5" fill="none" />}
          <path d={`M${X4_CLOCK[0]} ${X4_CLOCK[1]}L${X4_CLOCK[0] + 15 * Math.cos(-150 * RAD)} ${X4_CLOCK[1] + 15 * Math.sin(-150 * RAD)}`} stroke="#334155" strokeWidth={2.6} strokeLinecap="round" />
          <path d={`M${X4_CLOCK[0]} ${X4_CLOCK[1]}L${X4_CLOCK[0] + 26 * Math.cos(handDeg * RAD)} ${X4_CLOCK[1] + 26 * Math.sin(handDeg * RAD)}`} stroke="#c2410c" strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={X4_CLOCK[0]} cy={X4_CLOCK[1]} r={2.4} fill="#334155" />
        </g>
        <Txt x={X4_CLOCK[0]} y={148} size={9.5} color={PH.mute}>
          ঘড়ির কাঁটা
        </Txt>
      </Sheet>
      <div className="mt-2 text-center text-sm">
        <span className="font-semibold">কেন্দ্র থেকে দূরত্ব:</span> <span className="font-mono">r</span>, <span className="text-muted">সবসময় একই</span>
        <span className="ml-2 text-muted tabular-nums">
          ({seen.length}/{X4_SEC})
        </span>
      </div>
      <Task done={done}>পাখার মাথার হলুদ বিন্দুটা টেনে পুরো এক পাক ঘুরিয়ে আনুন। মাথাটা কোন পথে যায়?</Task>
    </>
  );
}

// 4½ · Figure for screen 4's explanation: the Moon goes round the Earth, no
// string tied, and doesn't fall.

const S4_SAY = ["পৃথিবী আর আকাশের চাঁদ।", "চাঁদ পৃথিবীকে ঘিরে ঘুরছে।", "কোনো দড়ি দিয়ে বাঁধা নেই।", "তবু ঘুরছে, টুপ করে পড়েও যাচ্ছে না।"];
const S4_E: P = [110, 80];
const S4_R = 54;

export function MoonRound({}: Story) {
  const s = useScene(3, [600, 1600, 1800]);
  const k = s.k;
  const deg = k >= 2 ? 360 : k >= 1 ? 180 : 0;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S4_SAY[k]}</span>}>
      <Sheet w={220} h={160} label="মাঝখানে পৃথিবী, চারপাশের বৃত্তে চাঁদ। চাঁদ ঘুরে আসে, কোনো দড়ি নেই।" className="max-w-[16rem]" bg="#0f172a">
        {[
          [20, 22],
          [44, 120],
          [196, 30],
          [186, 136],
          [28, 70],
          [204, 88],
          [150, 14],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={0.9} fill="#e2e8f0" opacity={0.7} />
        ))}
        <circle cx={S4_E[0]} cy={S4_E[1]} r={S4_R} fill="none" stroke="#475569" strokeWidth={0.8} strokeDasharray="2 3" />
        {k >= 1 && <Draw d={arcD(S4_E[0], S4_E[1], S4_R, -90, 90)} strokeWidth={1.8} className="stroke-[#f59e0b]" ms={1400} />}
        {k >= 2 && <Draw d={arcD(S4_E[0], S4_E[1], S4_R, 90, 270)} strokeWidth={1.8} className="stroke-[#f59e0b]" ms={1400} />}
        <circle cx={S4_E[0]} cy={S4_E[1]} r={18} fill="#2563eb" stroke="#1e3a8a" strokeWidth={1.5} />
        <path d="M100 70q6 -6 10 0q-2 7 -9 6ZM114 86q7 -3 9 4q-5 5 -10 1Z" fill="#16a34a" />
        <text x={S4_E[0]} y={S4_E[1] + 32} fontSize={9} fontWeight={700} textAnchor="middle" fill="#e2e8f0">
          পৃথিবী
        </text>
        <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: `${S4_E[0]}px ${S4_E[1]}px` }} className="transition-transform duration-[1400ms] ease-linear motion-reduce:transition-none">
          {k === 2 && (
            <g className={FADE}>
              <path d={`M${S4_E[0]} ${S4_E[1] - 20}V${S4_E[1] - S4_R + 8}`} stroke="#94a3b8" strokeWidth={1} strokeDasharray="2 2" />
              <path d={`M${S4_E[0] - 4} ${S4_E[1] - 41}l8 8M${S4_E[0] + 4} ${S4_E[1] - 41}l-8 8`} stroke={PH.red} strokeWidth={1.8} strokeLinecap="round" />
            </g>
          )}
          <circle cx={S4_E[0]} cy={S4_E[1] - S4_R} r={7} fill="#e7e5e4" stroke="#a8a29e" strokeWidth={0.8} />
          <circle cx={S4_E[0] - 2} cy={S4_E[1] - S4_R - 2} r={1.4} fill="#a8a29e" />
        </g>
        {k === 0 && (
          <text x={S4_E[0] + 16} y={S4_E[1] - S4_R - 4} fontSize={9} fontWeight={700} fill="#e2e8f0">
            চাঁদ
          </text>
        )}
        {k >= 3 && <Tag x={S4_E[0]} y={150} text={pad("ঘূর্ণন · Circular")} tone="amber" solid pop />}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · The third group: a box with four dots. The reader drags it anywhere;
// four arrows grow from where each dot was to where it is. They are always the
// same: same time, same direction, same distance.

const X5_S: P = [80, 124];
/** the box's half-size, and its four dots */
const X5_HALF: P = [38, 27];
const X5_DOTS: P[] = [
  [-22, -13],
  [22, -13],
  [-22, 13],
  [22, 13],
];
const X5_MIN = 50;

export function BoxSlide() {
  const pass = useGate();
  const [at, setAt] = useSeed<P>("at", X5_S);
  const [done, setDone] = useSeed("done", false);
  const [grab, setGrab] = useState<P | null>(null);
  const down = (e: React.PointerEvent<SVGSVGElement>) => {
    const [x, y] = svgPoint(e, 300, 190);
    if (Math.abs(x - at[0]) < X5_HALF[0] + 10 && Math.abs(y - at[1]) < X5_HALF[1] + 10) {
      setGrab([x - at[0], y - at[1]]);
      sfx.tap();
    }
  };
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!grab) return;
    const [x, y] = svgPoint(e, 300, 190);
    setAt([Math.max(X5_HALF[0] + 6, Math.min(300 - X5_HALF[0] - 6, x - grab[0])), Math.max(X5_HALF[1] + 6, Math.min(190 - X5_HALF[1] - 8, y - grab[1]))]);
  };
  const up = () => {
    if (!grab) return;
    setGrab(null);
    if (!done && Math.hypot(at[0] - X5_S[0], at[1] - X5_S[1]) >= X5_MIN) {
      setDone(true);
      sfx.chime();
      pass("সব বিন্দু একই দিকে, একই দূরত্ব গেলো।");
    }
  };
  const dx = at[0] - X5_S[0];
  const dy = at[1] - X5_S[1];
  const moved = Math.hypot(dx, dy) > 6;
  return (
    <>
      <Sheet w={300} h={190} label="চারটা বিন্দু আঁকা একটা বাক্স। টেনে সরালে প্রতিটা বিন্দুর আগের জায়গা থেকে নতুন জায়গা পর্যন্ত তীর আঁকা হয়।" className="max-w-[22rem] cursor-grab" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        {moved && <rect x={X5_S[0] - X5_HALF[0]} y={X5_S[1] - X5_HALF[1]} width={X5_HALF[0] * 2} height={X5_HALF[1] * 2} rx={4} fill="none" stroke={PH.mute} strokeWidth={1} strokeDasharray="4 3" className="pointer-events-none" />}
        {moved &&
          X5_DOTS.map((d, i) => <circle key={`g${i}`} cx={X5_S[0] + d[0]} cy={X5_S[1] + d[1]} r={2} fill={PH.faint} className="pointer-events-none" />)}
        <g className="pointer-events-none">
          <rect x={at[0] - X5_HALF[0] + 1.5} y={at[1] - X5_HALF[1] + 3} width={X5_HALF[0] * 2} height={X5_HALF[1] * 2} rx={5} fill={PH.ink} opacity={grab ? 0.14 : 0.1} />
          <rect x={at[0] - X5_HALF[0]} y={at[1] - X5_HALF[1]} width={X5_HALF[0] * 2} height={X5_HALF[1] * 2} rx={4} fill="#c79a66" stroke={PH.ink} strokeWidth={1} />
          <rect x={at[0] - 6} y={at[1] - X5_HALF[1] + 0.5} width={12} height={X5_HALF[1] * 2 - 1} fill="#e2bf8a" />
          {X5_DOTS.map((d, i) => (
            <circle key={i} cx={at[0] + d[0]} cy={at[1] + d[1]} r={3.8} fill={PH.amber} stroke={PH.ink} strokeWidth={1} />
          ))}
        </g>
        {done && <Ripple at={at} r={46} />}
        {moved &&
          X5_DOTS.map((d, i) => (
            <PArrow key={`a${i}`} a={[X5_S[0] + d[0], X5_S[1] + d[1]]} b={[at[0] + d[0], at[1] + d[1]]} tone="mint" w={1.8} tell={grab ? false : dirWord(dx, dy)} />
          ))}
        {!moved && (
          <Txt x={X5_S[0]} y={X5_S[1] + X5_HALF[1] + 16} size={9} color={PH.mute}>
            টেনে সরান
          </Txt>
        )}
      </Sheet>
      <Ticks items={(["একই সময়ে", "একই দিকে", "একই দূরত্ব"] as const).map((l) => [l, done] as [string, boolean])} />
      <Task done={done}>বাক্সটা টেনে যেকোনো দিকে সরান। চারটা বিন্দুর চারটা তীর দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The car's answer. The reader gives the body and the wheel a group each
// and drives. A wrong one plays what it would mean: a body in ঘূর্ণন tumbles,
// a wheel in চলন slides without turning and scrapes the road.

type Two = "tra" | "rot";
const X6_X0 = 64;
const X6_X1 = 220;
const X6_Y = 100;
const X6_SC = 1.05;
const X6_MS = 1560;

export function CarParts() {
  const pass = useGate();
  const [body, setBody] = useSeed<Two | null>("body", null);
  const [wheel, setWheel] = useSeed<Two | null>("wheel", null);
  const [ran, setRan] = useSeed<{ body: Two; wheel: Two } | null>("ran", null);
  const [miss, setMiss] = useState(0);
  const play = useWalk(X6_MS, { steps: false });
  const right = !!ran && ran.body === "tra" && ran.wheel === "rot" && !play.running;
  const wrong = !!ran && !right && !play.running;
  const drive = () => {
    if (!body || !wheel || play.running) return;
    const r = { body, wheel };
    setRan(r);
    sfx.whoosh(1.2);
    play.start(() => {
      if (r.body === "tra" && r.wheel === "rot") {
        sfx.chime();
        pass("বডির চলন, চাকার ঘূর্ণন: দুটোই সত্যি।");
      } else {
        sfx.slip();
        setMiss((m) => m + 1);
      }
    });
  };
  const t = ran ? (play.running ? play.t : 1) : 0;
  const e = t;
  const x = lerp(X6_X0, X6_X1, e);
  const rolled = x - X6_X0;
  const spin = ran?.wheel === "rot" ? rolled / (CAR.R * X6_SC) / RAD : 0;
  const tilt = ran?.body === "rot" ? 360 * e : 0;
  const nope = !ran
    ? ""
    : ran.body === "rot"
      ? "গাড়িটা ডিগবাজি খেলো! আসল গাড়ির বডির প্রতিটা বিন্দু একসাথে সামনে যায়, একই দূরত্ব।"
      : "চাকা না ঘুরে রাস্তায় ঘষে ঘষে গেলো, spoke-এর হলুদ বিন্দুটা একটুও ঘুরলো না। আসল চাকা কী করে?";
  const wy = X6_Y - CAR.R * X6_SC;
  const row = (label: string, v: Two | null, set: (x: Two) => void) => (
    <div className="flex items-center justify-center gap-1.5 text-sm">
      <span className="w-12 text-right font-semibold">{label}</span>
      {(["tra", "rot"] as Two[]).map((g) => (
        <button key={g} type="button" disabled={play.running || right} className={chip(v === g)} onClick={() => set(g)}>
          <span className="font-sans">{GROUP[g].bn}</span>
        </button>
      ))}
    </div>
  );
  return (
    <>
      <Sheet w={300} h={148} label="রাস্তায় গাড়ি। বডিতে তিনটা বিন্দু, সামনের চাকার spoke-এ একটা হলুদ বিন্দু। চালালে বেছে নেওয়া গতিতে চলে।" className="max-w-[22rem]">
        <Road y={X6_Y} />
        {ran && <Car x={X6_X0} y={X6_Y} s={X6_SC} ghost />}
        {ran?.wheel === "tra" && t > 0 && <path d={`M${X6_X0 + CAR.WX[0] * X6_SC} ${X6_Y + 1}H${x + CAR.WX[0] * X6_SC}M${X6_X0 + CAR.WX[1] * X6_SC} ${X6_Y + 1}H${x + CAR.WX[1] * X6_SC}`} stroke={PH.red} strokeWidth={2} className="pointer-events-none" />}
        <Car x={x} y={X6_Y} s={X6_SC} spin={spin} tilt={tilt} mark />
        {ran?.body === "tra" &&
          rolled > 4 &&
          CAR.DOTS.map((d, i) => (
            <PArrow key={i} a={[X6_X0 + d[0] * X6_SC, X6_Y + d[1] * X6_SC]} b={[x + d[0] * X6_SC, X6_Y + d[1] * X6_SC]} tone="mint" w={1.6} tell={t >= 1 ? "সামনে" : false} />
          ))}
        {wrong && <WrongMark key={miss} x={x + 50} y={X6_Y - 44} />}
        {ran?.body !== "rot" &&
          CAR.DOTS.map((d, i) => <circle key={`d${i}`} cx={x + d[0] * X6_SC} cy={X6_Y + d[1] * X6_SC} r={2.6} fill={PH.amber} stroke={PH.ink} strokeWidth={0.8} className="pointer-events-none" />)}
        {right && (
          <>
            <Ripple at={[x, X6_Y - 22]} r={48} />
            <SpinArrow cx={x + CAR.WX[1] * X6_SC} cy={wy} r={CAR.R * X6_SC + 4.5} tone="amber" w={2} />
            <Tag x={x - 6} y={40} text={pad("বডি: চলন")} tone="mint" solid pop />
            <Tag x={x + CAR.WX[1] * X6_SC} y={134} text={pad("চাকা: ঘূর্ণন")} tone="amber" solid pop />
          </>
        )}
      </Sheet>
      <div className="mt-2 grid gap-1.5">
        {row("বডি:", body, setBody)}
        {row("চাকা:", wheel, setWheel)}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={`${primaryBtn} h-9! px-4!`} disabled={!body || !wheel || play.running || right} onClick={drive}>
          চালান
        </button>
      </div>
      {wrong && <Nope key={miss}>{nope}</Nope>}
      <Task done={right}>বডি আর চাকা, কোনটার গতি কোন দলে? দুইটাই বেছে নিয়ে গাড়ি চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Two planes on the same wavy climb (book fig 2.01). Flown first: the left
// one turns its nose with the path, the right one keeps it pointing right.
// Then the pick, তিথি's slip first ("not চলন, the path isn't straight"). Each
// pick runs the dot test on a plane: nose (amber) and tail (blue) draw their
// paths, then the tail's path is slid onto the nose's. On the right plane it
// lies exactly on it; on the left it doesn't.

const PL_NOSE = 12;
const PL_PANEL = [4, 152];
const plP = (s: number): P => [18 + 100 * s, 116 - 76 * s - 11 * Math.sin(3 * Math.PI * s)];
const plH = (s: number) => Math.atan2(-76 - 33 * Math.PI * Math.cos(3 * Math.PI * s), 100);
const plPt = (s: number, turns: boolean, k: 1 | -1): P => {
  const [x, y] = plP(s);
  const h = turns ? plH(s) : 0;
  return [x + k * PL_NOSE * Math.cos(h), y + k * PL_NOSE * Math.sin(h)];
};
const PL_GHOSTS = [0, 1 / 3, 2 / 3, 1];
const X7_FLY_MS = 1650;
/** the test: the two dots draw their paths, then the tail's path slides onto the nose's (a share of one clock) */
const X7_TEST = 24;
const X7_SLIDE = 10;
const X7_TEST_MS = (X7_TEST + X7_SLIDE) * 55;
const X7_RIGHT = 2;
const X7_PICKS = ["কোনোটাই চলন না: পথ তো সোজা না", "বামের plane-টা চলন", "ডানের plane-টা চলন"];
const X7_NOPE = [
  "ডানের plane-এর লেজের নীল পথ সরাতেই নাকের হলুদ পথে হুবহু মিলে গেলো। পথ সোজা না, তবু মিললো!",
  "লেজের নীল পথ সরিয়ে আনলেও নাকের হলুদ পথে মিললো না। নাক ঘোরানোয় দুই বিন্দুর পথ আলাদা হলো।",
  "",
];

/** The plane of fig 2.01, small, nose to +x, at (x, y) turned `deg`. */
export function Plane({ x, y, deg = 0, faint = false }: { x: number; y: number; deg?: number; faint?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${deg}) scale(0.3)`} opacity={faint ? 0.4 : 1} className="pointer-events-none">
      <path d="M-44 -6L-54 -30L-40 -30L-24 -8Z" fill="#64748b" />
      <path d="M-46 -7Q-40 -11 28 -10Q48 -8 52 0Q48 8 28 10L-40 8Q-48 6 -46 -7Z" fill="#94a3b8" stroke="#475569" strokeWidth={2} />
      <path d="M-10 2L16 2L-4 24L-22 24Z" fill="#64748b" />
      {[-26, -14, -2, 10].map((cx) => (
        <circle key={cx} cx={cx} cy={-2} r={2.8} fill="#f8fafc" />
      ))}
      <path d="M34 -7L46 -3L34 -1Z" fill="#1e293b" />
    </g>
  );
}

export function PlanePick() {
  const pass = useGate();
  const [flown, setFlown] = useSeed("flown", false);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const flight = useWalk(X7_FLY_MS, { steps: false });
  const test = useWalk(X7_TEST_MS, { steps: false, ease: "linear" });
  const busy = flight.running || test.running;
  const fly = () => {
    if (busy) return;
    sfx.whoosh(1.4);
    flight.start(() => setFlown(true));
  };
  const choose = (i: number) => {
    if (busy) return;
    setPick(i);
    sfx.tap();
    test.start(() => {
      if (i === X7_RIGHT) {
        sfx.chime();
        pass("পথ আঁকাবাঁকা, নাক একদিকে: তবু চলন।");
      } else setMiss((m) => m + 1);
    });
  };
  const flyS = flight.running ? flight.t : flown ? 1 : 0;
  const testK = (test.running ? test.t : 1) * (X7_TEST + X7_SLIDE);
  const tested = pick === null ? null : pick === 1 ? 0 : 1;
  const over = pick !== null && !test.running;
  return (
    <>
      <Sheet w={300} h={150} label="পাশাপাশি দুইটা ঘর, দুইটাতেই একই আঁকাবাঁকা পথে একটা plane উঠছে। বামেরটা পথের সাথে নাক ঘোরায়, ডানেরটা নাক সবসময় ডানে রাখে।" className="max-w-[22rem]">
        {PL_PANEL.map((px, i) => {
          const turns = i === 0;
          const testing = tested === i;
          const s = testing ? Math.min(1, testK / X7_TEST) : flyS;
          const slide = testing ? Math.max(0, Math.min(1, (testK - X7_TEST) / X7_SLIDE)) : 0;
          const [cx, cy] = plP(s);
          const off: P = [plPt(0, turns, 1)[0] - plPt(0, turns, -1)[0], plPt(0, turns, 1)[1] - plPt(0, turns, -1)[1]];
          const ok = !turns;
          return (
            <g key={px} transform={`translate(${px} 4)`}>
              <rect x={0} y={0} width={144} height={142} rx={9} fill="#eef6ff" stroke={PH.faint} strokeWidth={1.2} />
              {s > 0 && <path d={sample(plP, s)} stroke="#94a3b8" strokeWidth={1.4} fill="none" opacity={testing ? 0.35 : 1} className="pointer-events-none" />}
              {!testing &&
                flown &&
                PL_GHOSTS.map((g) => {
                  const [gx, gy] = plP(g);
                  const h = turns ? plH(g) : 0;
                  const u: P = [Math.cos(h), Math.sin(h)];
                  return (
                    <g key={g}>
                      {g < 1 && <Plane x={gx} y={gy} deg={h / RAD} faint />}
                      <PArrow a={[gx + u[0] * 14, gy + u[1] * 14]} b={[gx + u[0] * 25, gy + u[1] * 25]} tone={turns ? "amber" : "mint"} w={1.6} tell={`নাক ${dirWord(u[0], u[1])}`} />
                    </g>
                  );
                })}
              {testing && (
                <g className="pointer-events-none">
                  <path d={sample((q) => plPt(q, turns, 1), s)} stroke={PH.amber} strokeWidth={1.8} fill="none" />
                  <path d={sample((q) => plPt(q, turns, -1), s)} stroke={PH.blue} strokeWidth={1.8} fill="none" />
                  {slide > 0 && <path d={sample((q) => plPt(q, turns, -1), 1)} transform={`translate(${off[0] * slide} ${off[1] * slide})`} stroke={PH.blue} strokeWidth={1.8} strokeDasharray="4 3" fill="none" />}
                </g>
              )}
              <Plane x={cx} y={cy} deg={turns ? plH(s) / RAD : 0} />
              {testing && (
                <g className="pointer-events-none">
                  <circle cx={plPt(s, turns, 1)[0]} cy={plPt(s, turns, 1)[1]} r={2.6} fill={PH.amber} stroke={PH.ink} strokeWidth={0.7} />
                  <circle cx={plPt(s, turns, -1)[0]} cy={plPt(s, turns, -1)[1]} r={2.6} fill={PH.blue} stroke={PH.ink} strokeWidth={0.7} />
                </g>
              )}
              {/* the tested plane answers on its own panel: lit on the right pick, a ? where the pick went wrong */}
              {testing && over && pick === X7_RIGHT && <Ripple at={[cx, cy]} r={30} />}
              {testing && over && pick !== X7_RIGHT && <WrongMark key={miss} x={Math.min(cx + 14, 136)} y={cy - 12} />}
              {testing && over && <Tag x={ok ? 30 : 38} y={16} text={pad(ok ? "চলন" : "চলন নয়")} tone={ok ? (pick === X7_RIGHT ? "mint" : "ink") : "red"} solid={pick === X7_RIGHT || !ok} pop />}
            </g>
          );
        })}
      </Sheet>
      {!flown ? (
        <div className="mt-3 flex justify-center">
          <button type="button" className={`${primaryBtn} h-9! px-4!`} disabled={busy} onClick={fly}>
            দুইটা plane-ই ওড়ান
          </button>
        </div>
      ) : (
        <div className="mt-3 grid gap-1.5">
          {X7_PICKS.map((o, i) => (
            <Choice key={o} n={i} look={over && pick === i ? (i === X7_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={busy || (over && pick === X7_RIGHT)} onClick={() => choose(i)}>
              {o}
            </Choice>
          ))}
        </div>
      )}
      {over && pick !== X7_RIGHT && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={over && pick === X7_RIGHT}>{flown ? "কোন plane-এর গতি চলন? বেছে নিন, তারপর নাক আর লেজের পথ মিলিয়ে দেখুন।" : "দুইটা plane-ই ওড়ান। কোনটা নাক ঘোরায়, দেখুন।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn: three motions from the video's world, each drawn as it
// happens: the striker, the clock's minute hand, the box on a wavy road. The
// reader sends each to a group; the pick lays that group's test on the
// picture (a straight line, a circle, a second dot's path) and it fits or not.

type X8Round = { id: "striker" | "clock" | "box"; right: Group; nope: Partial<Record<Group, string>> };
const X8_ROUNDS: X8Round[] = [
  { id: "striker", right: "lin", nope: { rot: "Striker বৃত্তটার উপর দিয়ে গেলো না, গেলো সোজা লাইনে।", tra: "Striker-এর পথটা দেখুন: একটা সরলরেখা, ব্যস। পথ সোজা হলে কোন দল?" } },
  { id: "clock", right: "rot", nope: { lin: "সোজা রেখাটা কাঁটার মাথার পথের সাথে মিললো না। মাথাটা গেলো গোল পথে।", tra: "কাঁটার মাঝের বিন্দু আঁকলো ছোট পথ, মাথা আঁকলো বড়। সব বিন্দু একই পথে যায়নি।" } },
  { id: "box", right: "tra", nope: { lin: "সোজা রেখা থেকে বাক্সের পথ বারবার সরে গেলো। পথটা আঁকাবাঁকা।", rot: "বাক্সটা কোনো বিন্দুকে ঘিরে ঘোরেনি, একই দূরত্বেও থাকেনি।" } },
];
const X8_S0: P = [126, 108];
const X8_S1: P = [188, 30];
const X8_CK: P = [150, 68];
const X8_HAND = 44;
const x8Box = (s: number): P => [48 + 190 * s, 104 - 60 * s - 18 * Math.sin(2 * Math.PI * s)];
const X8_B_OFF: P = [20, 12];
const X8_TEST_MS = 980;
/** Where each round's motion ends (the drawing answers there), where a wrong pick's ? pops, and where the verdict tag sits beside it. */
const X8_END: Record<X8Round["id"], { at: P; mark: P; tag: P }> = {
  striker: { at: X8_S1, mark: [216, 56], tag: [250, 30] },
  clock: { at: [X8_CK[0] - X8_HAND, X8_CK[1]], mark: [118, 58], tag: [252, 68] },
  box: { at: [x8Box(1)[0] + 10, x8Box(1)[1] + 6], mark: [276, 56], tag: [248, 20] },
};

/** One round's motion, drawn as it happens (a glide on mount; settled in a preview). */
function SortMotion({ id }: { id: X8Round["id"] }) {
  const seeded = useSeeded();
  const [t] = useTween([1], 1500, seeded ? undefined : [0]);
  const trail = { stroke: PH.cream, strokeWidth: 2, fill: "none", strokeDasharray: "0.1 4", strokeLinecap: "round" as const };
  if (id === "striker") {
    const p: P = [lerp(X8_S0[0], X8_S1[0], t), lerp(X8_S0[1], X8_S1[1], t)];
    return (
      <g className="pointer-events-none">
        <rect x={92} y={10} width={116} height={116} rx={5} fill="#6b4a2f" />
        <rect x={100} y={18} width={100} height={100} fill="#e9d3a1" />
        {[
          [105, 23],
          [195, 23],
          [105, 113],
          [195, 113],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={5} fill="#1c1917" />
        ))}
        <circle cx={150} cy={68} r={12} fill="none" stroke="#a0784c" strokeWidth={0.8} />
        <path d={`M${X8_S0[0]} ${X8_S0[1]}L${p[0]} ${p[1]}`} {...trail} strokeWidth={2.4} stroke="#78716c" />
        <circle cx={p[0]} cy={p[1]} r={5} fill="#fafaf9" stroke="#78716c" strokeWidth={1} />
      </g>
    );
  }
  if (id === "clock") {
    const a = -90 + 270 * t;
    return (
      <g className="pointer-events-none">
        <circle cx={X8_CK[0]} cy={X8_CK[1]} r={54} fill="#f5ecd7" stroke="#475569" strokeWidth={2.4} />
        {Array.from({ length: 12 }, (_, i) => {
          const r = i * 30 * RAD;
          return <path key={i} d={`M${X8_CK[0] + 48 * Math.cos(r)} ${X8_CK[1] + 48 * Math.sin(r)}L${X8_CK[0] + 51 * Math.cos(r)} ${X8_CK[1] + 51 * Math.sin(r)}`} stroke="#475569" strokeWidth={i % 3 ? 0.8 : 1.6} />;
        })}
        {t > 0.01 && <path d={arcD(X8_CK[0], X8_CK[1], X8_HAND, -90, a)} {...trail} stroke="#78716c" strokeWidth={2.4} />}
        <path d={`M${X8_CK[0]} ${X8_CK[1]}L${X8_CK[0] + X8_HAND * Math.cos(a * RAD)} ${X8_CK[1] + X8_HAND * Math.sin(a * RAD)}`} stroke="#c2410c" strokeWidth={2.2} strokeLinecap="round" />
        <circle cx={X8_CK[0] + X8_HAND * Math.cos(a * RAD)} cy={X8_CK[1] + X8_HAND * Math.sin(a * RAD)} r={2.8} fill={PH.ink} />
        <circle cx={X8_CK[0] + (X8_HAND / 2) * Math.cos(a * RAD)} cy={X8_CK[1] + (X8_HAND / 2) * Math.sin(a * RAD)} r={2.4} fill={PH.ink} />
        <circle cx={X8_CK[0]} cy={X8_CK[1]} r={2.8} fill="#334155" />
      </g>
    );
  }
  const [ax, ay] = x8Box(t);
  const c: P = [ax + 10, ay + 6];
  return (
    <g className="pointer-events-none">
      <rect x={48 + 10 - 17} y={104 + 6 - 12} width={34} height={24} rx={3} fill="none" stroke={PH.mute} strokeDasharray="3 2.5" />
      {t > 0.01 && <path d={sample(x8Box, t)} {...trail} stroke="#78716c" strokeWidth={2.4} />}
      <rect x={c[0] - 16} y={c[1] - 9} width={34} height={24} rx={3} fill={PH.ink} opacity={0.1} />
      <rect x={c[0] - 17} y={c[1] - 12} width={34} height={24} rx={3} fill="#c79a66" stroke={PH.ink} strokeWidth={1} />
      <circle cx={ax} cy={ay} r={2.8} fill={PH.ink} />
      <circle cx={ax + X8_B_OFF[0]} cy={ay + X8_B_OFF[1]} r={2.8} fill={PH.ink} />
    </g>
  );
}

/** What a group's test looks like on a round's picture; null where the group has no test to lay. */
function sortTest(id: X8Round["id"], g: Group): string | null {
  if (id === "striker") {
    if (g === "lin") return `M${X8_S0[0]} ${X8_S0[1]}L${X8_S1[0]} ${X8_S1[1]}`;
    if (g === "rot") {
      const m: P = [(X8_S0[0] + X8_S1[0]) / 2, (X8_S0[1] + X8_S1[1]) / 2];
      const r = Math.hypot(X8_S1[0] - X8_S0[0], X8_S1[1] - X8_S0[1]) / 2;
      const a0 = Math.atan2(X8_S0[1] - m[1], X8_S0[0] - m[0]) / RAD;
      return arcD(m[0], m[1], r, a0, a0 + 360);
    }
    return null;
  }
  if (id === "clock") {
    if (g === "lin") return `M${X8_CK[0]} ${X8_CK[1] - X8_HAND}L${X8_CK[0] - X8_HAND} ${X8_CK[1]}`;
    if (g === "rot") return arcD(X8_CK[0], X8_CK[1], X8_HAND, -90, 270);
    return arcD(X8_CK[0], X8_CK[1], X8_HAND / 2, -90, 180);
  }
  if (g === "lin") {
    const [a, b] = [x8Box(0), x8Box(1)];
    return `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
  }
  if (g === "tra") return sample((s) => [x8Box(s)[0] + X8_B_OFF[0], x8Box(s)[1] + X8_B_OFF[1]], 1);
  return null;
}

export function SortThree() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pick, setPick] = useSeed<Group | null>("pick", null);
  const [solved, setSolved] = useSeed("solved", false);
  const [miss, setMiss] = useState(0);
  // the group's test is laid on the picture on the clock; the verdict comes when it is down
  const play = useWalk(X8_TEST_MS, { steps: false, ease: "out" });
  const r = X8_ROUNDS[Math.min(round, X8_ROUNDS.length - 1)];
  const last = round === X8_ROUNDS.length - 1;
  const choose = (g: Group) => {
    if (play.running || solved) return;
    setPick(g);
    sfx.pop();
    play.start(() => {
      if (g === r.right) {
        setSolved(true);
        sfx.chime();
        if (last) pass("সোজা, গোল, না সব বিন্দু একসাথে: পথ বলে দেয়।");
      } else setMiss((m) => m + 1);
    });
  };
  const next = () => {
    setRound(round + 1);
    setPick(null);
    setSolved(false);
  };
  const test = pick ? sortTest(r.id, pick) : null;
  const over = pick !== null && !play.running;
  const wrong = over && pick !== r.right;
  const tone = pick ? toneHex(GROUP[pick].tone) : PH.ink;
  const laid = pick === null ? 0 : play.running ? play.t : 1;
  const end = X8_END[r.id];
  return (
    <>
      <Sheet w={300} h={136} label="একটা নড়াচড়া, যেমন ঘটে তেমন আঁকা। দল বেছে নিলে সেই দলের মাপকাঠি ছবির উপর বসে।" className="max-w-[21rem]">
        <SortMotion key={round} id={r.id} />
        {test && <path d={test} stroke={tone} strokeWidth={1.8} fill="none" pathLength={1} strokeDasharray="1 2" strokeDashoffset={1 - laid} className="pointer-events-none" />}
        {solved && <Ripple key={`ok${round}`} at={end.at} tone={GROUP[r.right].tone} r={22} />}
        {solved && <Tag x={end.tag[0]} y={end.tag[1]} text={pad(GROUP[r.right].bn)} tone={GROUP[r.right].tone} solid pop />}
        {wrong && <WrongMark key={`no${miss}`} x={end.mark[0]} y={end.mark[1]} />}
        {wrong && <Tag x={end.tag[0]} y={end.tag[1]} text={pad(`${GROUP[pick].bn} না`)} tone="red" pop />}
      </Sheet>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {(["lin", "rot", "tra"] as Group[]).map((g) => {
          const look = over && pick === g ? (g === r.right ? "right" : "wrong") : pick === g && play.running ? "picked" : "idle";
          return (
            <button key={g} type="button" disabled={play.running || solved} onClick={() => choose(g)} className={`flex cursor-pointer flex-col items-center rounded-xl border-2 px-1 py-1.5 transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look]}`}>
              <svg viewBox="0 0 28 20" className="h-5 w-7" aria-hidden="true">
                <GroupGlyph g={g} />
              </svg>
              <span className="text-sm font-semibold">{GROUP[g].bn}</span>
              <span className="text-[0.7rem] opacity-70">{GROUP[g].en}</span>
            </button>
          );
        })}
      </div>
      {wrong && <Nope key={miss}>{r.nope[pick]}</Nope>}
      {solved && !last && (
        <div className={`mt-2 flex justify-center ${FADE}`}>
          <button type="button" className={`${primaryBtn} h-9! px-4!`} onClick={next}>
            পরেরটা
          </button>
        </div>
      )}
      <Ticks items={X8_ROUNDS.map((x, i) => [`${i + 1}`, round > i || (round === i && solved)] as [string, boolean])} />
      <Task done={last && solved}>কোন নড়াচড়া কোন দলে? পথটা দেখে দল বেছে নিন, তিনবার।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9a · Recap figure for the last screen: the three bins fill one by one, each
// with its rule.

const S9_SAY = ["তিন দল।", "পথ সোজা: সরলরৈখিক গতি।", "পথ বৃত্ত: ঘূর্ণন গতি।", "সব বিন্দু একসাথে, একই দিকে: চলন গতি।"];

export function ThreeBins({}: Story) {
  const s = useScene(3, [600, 1300, 1300]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S9_SAY[k]}</span>}>
      <Sheet w={300} h={112} label="তিনটা দল: সরলরৈখিক, ঘূর্ণন, চলন, প্রতিটার নিচে তার নিয়ম।" className="max-w-[21rem]">
        {(["lin", "rot", "tra"] as Group[]).map((g, i) => (
          <Bin key={g} x={6 + i * 97} y={6} w={91} h={100} n={i + 1} g={k > i ? g : undefined} rule />
        ))}
      </Sheet>
    </Scene>
  );
}

// 9b · Closing story scene: back on the roof; the fan and the rickshaw fade,
// the swing keeps coming back to the same place.

export function SwingLeft({}: Story) {
  const s = useScene(1, [600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="আবার ছাদে তিথি। ফ্যান আর রিকশা মিলিয়ে গেলো, বাকি রইলো দোলনা, বারবার একই জায়গায় ফিরে আসে।">
        <RoofWorld fanOn rickAt={k >= 1 ? 292 : 200} rickMs={1200} swingOn dim={k >= 1} trail={k >= 1} />
        {k >= 1 && <Tag x={150} y={20} text={pad("দোলনা: ?")} tone="amber" solid pop />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  CarBet: { start: {}, sealed: { bet: 1 }, one: { bet: 0 } },
  RoofThree: { start: {}, one: { seen: ["fan"] }, done: { seen: ["fan", "rick", "swing"] } },
  StoneDrop: { start: {}, done: { landed: true } },
  FanRound: { start: {}, half: { ang: 150, seen: [0, 1, 2, 3, 4, 5] }, done: { ang: -60, seen: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] } },
  BoxSlide: { start: {}, done: { at: [196, 62], done: true } },
  CarParts: {
    start: {},
    wrongBody: { body: "rot", wheel: "rot", ran: { body: "rot", wheel: "rot" } },
    wrongWheel: { body: "tra", wheel: "tra", ran: { body: "tra", wheel: "tra" } },
    right: { body: "tra", wheel: "rot", ran: { body: "tra", wheel: "rot" } },
  },
  PlanePick: { start: {}, flown: { flown: true }, slip: { flown: true, pick: 0 }, wrong: { flown: true, pick: 1 }, right: { flown: true, pick: 2 } },
  SortThree: {
    start: {},
    r1wrong: { round: 0, pick: "rot" },
    r1right: { round: 0, pick: "lin", solved: true },
    r2wrong: { round: 1, pick: "tra" },
    r2lin: { round: 1, pick: "lin" },
    r3wrong: { round: 2, pick: "lin" },
    done: { round: 2, pick: "tra", solved: true },
  },
  CarRolls: { start: { k: 0 }, end: {} },
  RoofView: { end: {} },
  CarromStrike: { a: { k: 0 }, end: {} },
  MoonRound: { b: { k: 2 }, end: {} },
  ThreeBins: { a: { k: 0 }, end: {} },
  SwingLeft: { end: {} },
};
