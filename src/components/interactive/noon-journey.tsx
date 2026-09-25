"use client";

import { useId, type KeyboardEvent, type ReactNode } from "react";

import { BoxRun } from "@/components/journey/box";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Speech, Ticks, pill, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Label, Plane, clamp, makeFrame, snap, type Frame, type XY } from "@/components/journey/plane";

// Screens for "Math for AI 4.3 — Mama's card", the pieces-to-picture version
// of 04c_noon_shadow (see .claude/skills/pieces-to-picture and
// 04c1_pieces_plan.md).
//
// The route: Mama's card holds two lengths and an angle, and the reader can't
// get the box's 7 out of it (screen 1). The familiar twin is the box with v
// lying flat on the floor: there it is just v's length × where the noon sun
// drops w's tip, w's shadow (screens 2–3). Two pieces that look unrelated: a
// stick tilted in the sun gives one shadow number per angle, and a longer
// pole at the same tilt gives a longer shadow but the same number. The one
// rule change: v is tilted, the flat trick fails, and the reader turns the
// paper until v is flat again. The snap turns w into the stick, and the
// reader gets 7 from the card alone.
//
// Visual hooks shared by every piece: w and the stick are the same coral, every
// shadow is the same amber bar, and the sun always drops a dashed amber line
// straight down.
//
// Tailwind only; drawn objects on the white sheets use fixed ink.

type Story = { story?: boolean };

const O: XY = [0, 0];
const RAD = Math.PI / 180;
const len = (v: readonly number[]) => Math.hypot(...v);
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
/** the angle between two arrows, in degrees */
const angleOf = (a: XY, b: XY) => Math.acos(clamp(dot(a, b) / (len(a) * len(b)), -1, 1)) / RAD;
/** p turned about the origin by `deg`, anticlockwise */
export const rot = (p: XY, deg: number): XY => {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
/** a point `r` along the direction `deg` */
export const polar = (r: number, deg: number): XY => [r * Math.cos(deg * RAD), r * Math.sin(deg * RAD)];
/** a number to at most two decimals, a real minus, no "−0" */
export const nice = (n: number) => {
  const s = Math.abs(n).toFixed(2).replace(/\.?0+$/, "");
  return n < 0 && s !== "0" ? `−${s}` : s;
};
export const par = (n: number) => (n < 0 ? `(${nice(n)})` : nice(n));
/** a cosine to three decimals, bracketed when negative */
const cos3 = (n: number) => {
  const s = Math.abs(n).toFixed(3).replace(/\.?0+$/, "");
  return n < 0 && s !== "0" ? `(−${s})` : s;
};

const SUN = "#fbbf24";
const INK = "#0f1b2d";

// ---------------------------------------------------------------------------
// The drawing kit for the white sheets: the floor, the noon sun, its dashed
// drop, the amber shadow, the bamboo stick (w's coral, with two nodes), and an
// angle arc.

export function Floor({ f }: { f: Frame }) {
  return <path d={`M${f.sx(f.x0)} ${f.sy(0)}H${f.sx(f.x1)}`} strokeWidth={1.5} className="pointer-events-none stroke-[#0f1b2d]/50" />;
}

export function Sun({ f }: { f: Frame }) {
  const rays: number[] = [];
  for (let x = Math.ceil(f.x0 * 2) / 2; x <= f.x1; x += 0.5) rays.push(x);
  return (
    <g className="pointer-events-none">
      {rays.map((x) => (
        <path key={x} d={`M${f.sx(x)} ${f.sy(f.y1) + 4}V${f.sy(0) - 2}`} strokeWidth={1} strokeDasharray="2 7" className="stroke-[#d97706]/25" />
      ))}
      <circle cx={f.sx(f.x1) - 13} cy={f.sy(f.y1) + 13} r={8} fill={SUN} />
    </g>
  );
}

/** the sun's line from a tip straight down to the floor */
export function Drop({ f, from, to }: { f: Frame; from: XY; to?: XY }) {
  const end = to ?? [from[0], 0];
  return <path d={`M${f.sx(from[0])} ${f.sy(from[1])}L${f.sx(end[0])} ${f.sy(end[1])}`} strokeWidth={1.3} strokeDasharray="4 3" className="pointer-events-none stroke-[#d97706]" />;
}

/** the amber shadow on the floor from x = a to x = b, just under the floor line */
export function Shade({ f, a = 0, b, y = -0.1, bad = false, ghost = false }: { f: Frame; a?: number; b: number; y?: number; bad?: boolean; ghost?: boolean }) {
  if (Math.abs(b - a) * f.u < 1) return null;
  return (
    <path
      d={`M${f.sx(a)} ${f.sy(y)}H${f.sx(b)}`}
      strokeWidth={7}
      strokeLinecap="round"
      strokeDasharray={ghost ? "3 4" : undefined}
      opacity={ghost ? 0.7 : 0.85}
      className={`pointer-events-none ${bad ? "stroke-danger" : "stroke-[#f59e0b]"}`}
    />
  );
}

/** the bamboo stick from `from` to `tip`: w's coral, two dark nodes */
export function Stick({ f, tip, from = O, w = 6 }: { f: Frame; tip: XY; from?: XY; w?: number }) {
  const x1 = f.sx(from[0]);
  const y1 = f.sy(from[1]);
  const x2 = f.sx(tip[0]);
  const y2 = f.sy(tip[1]);
  const l = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / l;
  const ny = (x2 - x1) / l;
  return (
    <g className="pointer-events-none">
      <path d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth={w} strokeLinecap="round" className="stroke-cat-coral" />
      {[1 / 3, 2 / 3].map((t) => {
        const cx = x1 + (x2 - x1) * t;
        const cy = y1 + (y2 - y1) * t;
        return <path key={t} d={`M${cx - nx * 4} ${cy - ny * 4}L${cx + nx * 4} ${cy + ny * 4}`} strokeWidth={1.5} className="stroke-[#7f1d1d]" />;
      })}
    </g>
  );
}

/** an arc at the origin from direction a to direction b; `text` beside it */
export function Arc({ f, a, b, r = 0.5, text }: { f: Frame; a: XY; b: XY; r?: number; text?: string }) {
  const a1 = Math.atan2(a[1], a[0]);
  let d = Math.atan2(b[1], b[0]) - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  if (Math.abs(d) < 1e-6) return null;
  const p = (t: number, k: number): [number, number] => [f.sx(k * Math.cos(t)), f.sy(k * Math.sin(t))];
  const [x1, y1] = p(a1, r);
  const [x2, y2] = p(a1 + d, r);
  const [lx, ly] = p(a1 + d / 2, r + 0.28 * (40 / f.u) + 0.12);
  return (
    <g className="pointer-events-none">
      <path d={`M${x1} ${y1}A${r * f.u} ${r * f.u} 0 0 ${d > 0 ? 0 : 1} ${x2} ${y2}`} strokeWidth={1.3} className="fill-none stroke-[#0f1b2d]/60" />
      {text && (
        <text x={lx} y={ly + 3} textAnchor="middle" fontSize={9} fontWeight={600} className="fill-[#0f1b2d] font-mono">
          {text}
        </text>
      )}
    </g>
  );
}

/**
 * Fahim's box, worked out for v and w — the pairing shown and played out
 * rather than printed (journey/box.tsx). `live` is for a box the reader is
 * dragging: the sum keeps up with the hand instead of replaying each frame.
 */
export function BoxLine({ v, w, tone = "plain", live = false }: { v: XY; w: XY; tone?: "plain" | "good" | "bad"; live?: boolean }) {
  return <BoxRun a={v} b={w} aName="v" bName="w" tone={tone} live={live} lang="bn" dense />;
}

/** arrow keys move a dragged tip one square */
const STEP_KEYS: Record<string, XY> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
export const keyMove = (f: Frame, at: XY, go: (p: XY) => void) => (e: KeyboardEvent<SVGSVGElement>) => {
  const d = STEP_KEYS[e.key];
  if (!d) return;
  e.preventDefault();
  go(snap([at[0] + d[0], at[1] + d[1]], f));
};

/** A tilt slider in degrees. */
export function Tilt({ value, min = 0, max, step = 5, label, onChange }: { value: number; min?: number; max: number; step?: number; label: string; onChange: (n: number) => void }) {
  return (
    <div className="mx-auto flex max-w-sm items-center gap-3">
      <span className="font-mono text-sm text-muted">{min}°</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
      />
      <span className="font-mono text-sm text-muted">{max}°</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mama's card and Fahim's box, side by side, as on screens 1 and 8.

const CARD = { v: 2.24, w: 3.61, deg: 30 };
const V: XY = [2, 1];
const W: XY = [2, 3];

function MamaCard({ v = CARD.v, w = CARD.w, deg = `প্রায় ${CARD.deg}°` }: { v?: number; w?: number; deg?: string }) {
  return (
    <div className="-rotate-2 rounded-lg border border-[#d6c7a1] bg-[#fdf8ec] px-3 py-2 font-mono text-sm leading-relaxed text-[#0f1b2d] shadow-sm">
      <div className="font-sans text-xs font-semibold text-[#6b5b3e]">মামার card</div>
      <div>
        <span className="text-cat-blue">v</span> {nice(v)} <span className="font-sans">লম্বা</span>
      </div>
      <div>
        <span className="text-cat-coral">w</span> {nice(w)} <span className="font-sans">লম্বা</span>
      </div>
      <div>
        angle: <span className="font-sans">{deg}</span>
      </div>
    </div>
  );
}

/** Mama's card as one line, for the exercises, where the picture needs the room */
function CardStrip({ v, w, deg }: { v: number; w: number; deg: number }) {
  return (
    <div className="mx-auto w-fit -rotate-1 rounded-lg border border-[#d6c7a1] bg-[#fdf8ec] px-3 py-1 font-mono text-sm text-[#0f1b2d] shadow-sm">
      <span className="mr-2 font-sans text-xs font-semibold text-[#6b5b3e]">মামার card</span>
      <span className="text-cat-blue">v</span> {v} <span className="font-sans">লম্বা</span> · <span className="text-cat-coral">w</span> {w} <span className="font-sans">লম্বা</span> · {deg}°
    </div>
  );
}

function FahimBox({ lit = false }: { lit?: boolean }) {
  return (
    <div className={`rounded-xl border-2 px-3 py-2 text-center transition-colors duration-300 motion-reduce:transition-none ${lit ? "border-accent bg-accent/10" : "border-cat-amber/40 bg-cat-amber/5"}`}>
      <div className="text-xs text-muted">ফাহিমের dot product</div>
      <div className="font-mono text-sm">
        <BoxRun a={[2, 1]} b={[2, 3]} lang="bn" inline noSum />
      </div>
      <div className="font-mono text-3xl font-bold">7{lit && <span className={`${POP} ml-1 inline-block text-accent-text`}>✓</span>}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. The roof of Nanu's house at noon, drawn on a Stage.

const SG = 150;

function Roof() {
  return (
    <g className="pointer-events-none">
      <circle cx={160} cy={20} r={15} fill="#fde047" opacity={0.3} />
      <circle cx={160} cy={20} r={9} fill={SUN} />
      <rect x={0} y={122} width={320} height={28} fill="#e7e0d6" />
      <rect x={0} y={119} width={320} height={4} fill="#cfc6b8" />
      <rect x={0} y={SG} width={320} height={30} fill="#bfb4a3" />
      <path d={`M0 ${SG}H320`} stroke="#a8a29e" strokeWidth={1} />
    </g>
  );
}

/** two chalk arrows on the floor, seen from the side (depth squashed) */
function Chalk({ x, y, arrows, u = 16 }: { x: number; y: number; arrows: XY[]; u?: number }) {
  return (
    <g className="pointer-events-none">
      {arrows.map((a, i) => {
        const tx = x + a[0] * u;
        const ty = y - a[1] * u * 0.45;
        const l = Math.hypot(tx - x, ty - y) || 1;
        const ux = (tx - x) / l;
        const uy = (ty - y) / l;
        const d = `M${x} ${y}L${tx} ${ty}M${tx - ux * 5 - uy * 2.8} ${ty - uy * 5 + ux * 2.8}L${tx} ${ty}L${tx - ux * 5 + uy * 2.8} ${ty - uy * 5 - ux * 2.8}`;
        return (
          <g key={i} className={POP} style={{ transitionDelay: `${i * 300}ms` }}>
            <path d={d} fill="none" strokeWidth={1.6} strokeLinecap="round" stroke="white" />
            <text x={tx + 4} y={ty + 3} fontSize={8} fontWeight={700} fill="white">
              {i === 0 ? "v" : "w"}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function NoonCard({}: Story) {
  const s = useScene(5, [500, 1500, 1600, 2400, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="দুপুরবেলা ছাদে। মামা চক দিয়ে দুইটা arrow আঁকলেন, v আর w। ফাহিম dot product করে পেলো 7। মামা একটা card তুলে ধরলেন, তাতে দুইটা length আর একটা angle। বললেন শুধু card থেকেই 7 আনবেন। ফাহিম card টার দিকে তাকিয়ে থাকলো।">
        <Roof />
        {k >= 2 && <Chalk x={168} y={172} arrows={[V, W]} />}
        <Person who="mama" x={k >= 1 ? 118 : -24} y={SG} walking={k === 1} ms={1400} arm={k === 2 ? "point" : k >= 4 ? "hold" : "down"} mood={k >= 4 ? "smug" : "plain"} />
        <Person who="fahim" x={k >= 1 ? 262 : 344} y={SG} facing={-1} walking={k === 1} ms={1400} mood={k === 3 ? "happy" : k === 5 ? "puzzled" : "plain"} />
        {k >= 4 && <CastCard x={134} y={SG - 44} text="2.24 · 3.61 · 30°" tone="amber" />}
        {k === 3 && <Bubble x={262} y={SG - 66} side="left" lines={["Dot product বলছে", "2 × 2 + 1 × 3 = 7."]} />}
        {k === 4 && <Bubble x={118} y={SG - 66} side="right" lines={["Slot লাগবে না।", "এই card থেকেই 7 আনবো।"]} />}
        {k === 5 && <Bubble x={262} y={SG - 66} side="left" tone="think" lines={["দুইটা length আর", "একটা angle থেকে 7?"]} />}
      </Stage>
    </StoryFrame>
  );
}

export function MamiPoles({}: Story) {
  const s = useScene(3, [500, 1800, 2400]);
  const k = s.k;
  const lean = k >= 3 ? 60 : 88;
  const [tx, ty] = [150 + 70 * Math.cos(lean * RAD), SG - 70 * Math.sin(lean * RAD)];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামি কাপড় শুকানোর জন্য বাঁশ নিয়ে আসলেন। ফাহিমকে একটা বাঁশ 60 degree হেলিয়ে ধরতে বললেন। দুপুরের রোদে বাঁশের shadow মেঝেতে পড়লো।">
        <Roof />
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M150 ${SG}L${tx} ${ty}`} strokeWidth={4} strokeLinecap="round" stroke="#e8590c" className="transition-all duration-700 motion-reduce:transition-none" />
            {k >= 3 && <path d={`M150 ${SG + 2}H${tx}`} strokeWidth={5} strokeLinecap="round" stroke="#f59e0b" opacity={0.85} className={FADE} />}
          </g>
        )}
        <Person who="mami" x={k >= 1 ? 96 : -24} y={SG} walking={k === 1} ms={1400} arm={k >= 2 ? "point" : "down"} />
        <Person who="fahim" x={k >= 1 ? 210 : 344} y={SG} facing={-1} walking={k === 1} ms={1400} arm={k >= 3 ? "hold" : "down"} />
        {k === 2 && <Bubble x={96} y={SG - 66} side="right" lines={["বাঁশটা একটু ধরো তো।", "60° হেলিয়ে।"]} />}
        {k === 3 && <Bubble x={210} y={SG - 66} side="left" lines={["কোনটা ধরবো?", "বাঁশ তো তিনটা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · A story scene for screen 4's setup, no task: Mama finds the 1 metre
//      bamboo stick leaning in the roof's corner and carries it out under the
//      noon sun, whose light drops straight down. No shadow is shown: the
//      screen finds the shadows.

/** the 1 metre stick for the Stage (about 39 units beside a 62-unit person), foot at the origin */
function N4Bamboo() {
  return (
    <g className="pointer-events-none">
      <path d="M0 0V-39" strokeWidth={3.5} strokeLinecap="round" stroke="#e8590c" />
      <path d="M-2.5 -13H2.5M-2.5 -26H2.5" strokeWidth={1.4} stroke="#7f1d1d" />
    </g>
  );
}

export function StickFound({}: Story) {
  const s = useScene(3, [500, 1500, 1700, 1800]);
  const k = s.k;
  const mx = k === 0 ? 70 : k === 1 ? 262 : 174;
  const held = k >= 2;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="দুপুরবেলা ছাদে। কোণায় একটা বাঁশের কঞ্চি হেলান দেওয়া, 1 metre লম্বা। মামা হেঁটে গিয়ে ওটা তুলে ছাদের মাঝখানে নিয়ে আসলেন। সূর্য ঠিক মাথার উপরে। রোদ সোজা নিচে পড়ছে।">
        <Roof />
        {k >= 3 && (
          <g className={FADE}>
            {[64, 112, 160, 208, 256].map((x) => (
              <path key={x} d={`M${x} 36V${SG - 2}`} strokeWidth={1.2} strokeDasharray="3 5" stroke="#d97706" opacity={0.55} />
            ))}
          </g>
        )}
        <g style={{ transform: `translate(${held ? mx - 14 : 302}px, ${SG}px) rotate(${held ? 0 : -14}deg)` }} className="transition-transform duration-[1400ms] ease-in-out motion-reduce:transition-none">
          <N4Bamboo />
        </g>
        <Person who="mama" x={mx} y={SG} facing={k >= 2 ? -1 : 1} walking={k === 1 || k === 2} ms={1400} arm={held ? "hold" : "down"} />
        {k >= 2 && <CastCard x={128} y={SG - 50} text="1 m" tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · A story scene for screen 9's setup, no task: Mama writes a new card
//      and holds it up for Fahim.

export function NewCard({}: Story) {
  const s = useScene(2, [500, 1500, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ছাদে মামা নতুন একটা card লিখলেন: v 2 লম্বা, w 3 লম্বা, angle 60 degree। ফাহিম card টার দিকে তাকালো।">
        <Roof />
        <Person who="mama" x={120} y={SG} arm={k >= 1 ? "hold" : "down"} mood={k >= 2 ? "smug" : "plain"} />
        <Person who="fahim" x={236} y={SG} facing={-1} mood={k >= 2 ? "puzzled" : "plain"} />
        {k >= 1 && <CastCard key={k} x={146} y={SG - 44} text={k >= 2 ? "v 2 · w 3 · 60°" : "v 2 · w 3"} tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}

// 11a · A story scene for the ending, after the widget, no task: the box's 7
//       and the card's 7 side by side; Mama says always; Mami walks up and
//       wants a proof. It stops on her question (4.4 answers it).

export function MamiWantsProof({}: Story) {
  const s = useScene(4, [500, 1400, 2200, 1500, 2600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="ছাদে ফাহিমের হাতে dot product এর 7, মামার হাতে card এর 7। মামা বললেন প্রতিবারই মিলবে। মামি হেঁটে এসে proof চাইলেন। হয়তো কপালগুণে মিলে গেছে।">
        <Roof />
        <Person who="mama" x={96} y={SG} arm="hold" mood={k === 2 ? "smug" : "plain"} />
        <Person who="fahim" x={178} y={SG} arm="hold" facing={k >= 3 ? 1 : -1} mood={k >= 4 ? "puzzled" : "happy"} />
        {k >= 1 && <CastCard x={112} y={SG - 44} text="card: 7" tone="amber" />}
        {k >= 1 && <CastCard x={194} y={SG - 44} text="dot product: 7" tone="amber" />}
        {k === 2 && <Bubble x={96} y={SG - 66} side="right" lines={["সবসময়। প্রতিবার।"]} />}
        <Person who="mami" x={k >= 3 ? 268 : 344} y={SG} facing={-1} walking={k === 3} ms={1300} arm={k >= 4 ? "point" : "down"} />
        {k >= 4 && <Bubble x={268} y={SG - 66} side="left" lines={["নাকি কপাল ভালো ছিল?", "Proof দেখাও।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The hook. Mama's card: v is 2.24 long, w is 3.61, about 30° apart. The
//     box said 7. The reader tries three ways to get 7 from the card and none
//     works. The journey's question, answered on screen 8.

const TRIES = [
  { label: "দুইটা length গুণ করি", sum: "2.24 × 3.61", n: 8.09 },
  { label: "দুইটা length যোগ করি", sum: "2.24 + 3.61", n: 5.85 },
  { label: "তিনটাই গুণ করি", sum: "2.24 × 3.61 × 30", n: 242.6 },
];

/**
 * The try's number as a bar on a ruler, next to the box's 7: it grows to 8.09
 * (past the 7), stops short at 5.85, or runs off the end for 242.6.
 */
function TryBar({ n }: { n: number | null }) {
  const [b] = useTween([n ?? 0], 700);
  const x = (v: number) => 14 + (Math.min(Math.max(v, 0), 10.6) / 10) * 216;
  return (
    <svg viewBox="0 0 260 46" role="img" aria-label={n === null ? "0 থেকে 10 পর্যন্ত একটা ruler, dot product এর 7 দাগ দেওয়া" : `এই উপায়ে আসে ${n}, dot product এ আসে 7`} className="mx-auto mt-3 block h-auto w-full max-w-[17rem]">
      <rect x={0.5} y={0.5} width={259} height={45} rx={6} fill="white" stroke="#cbd5e1" strokeWidth={0.8} />
      <path d={`M14 28H${x(10.6)}`} stroke={INK} strokeOpacity={0.3} strokeWidth={1} />
      {[0, 2, 4, 6, 8, 10].map((t) => (
        <g key={t}>
          <path d={`M${x(t)} 25v6`} stroke={INK} strokeOpacity={0.35} strokeWidth={1} />
          <text x={x(t)} y={41} textAnchor="middle" fontSize={7.5} fill={INK} fillOpacity={0.55} fontFamily="ui-monospace, monospace">
            {t}
          </text>
        </g>
      ))}
      {n !== null && <rect x={14} y={21} width={Math.max(0, x(b) - 14)} height={9} rx={2} fill="#dc2626" opacity={0.75} />}
      {n !== null && n > 10.6 && b > 10.5 && <path d={`M${x(10.6)} 20l8 5.5l-8 5.5Z`} fill="#dc2626" className={FADE} />}
      <path d={`M${x(7)} 14V33`} stroke="#16a34a" strokeWidth={2} />
      <text x={x(7)} y={11} textAnchor="middle" fontSize={8} fontWeight={700} fill="#15803d">
        dot product 7
      </text>
    </svg>
  );
}

export function CardTries() {
  const pass = useGate();
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const [last, setLast] = useSeed<number | null>("last", null);
  const done = tried.length === TRIES.length;

  const tryIt = (i: number) => {
    setLast(i);
    if (tried.includes(i)) return;
    const next = [...tried, i];
    setTried(next);
    if (next.length === TRIES.length) pass("কোনোটাতেই 7 আসে না। Angle টা কিছু একটা করে।");
  };

  return (
    <>
      <div className="mt-2 flex items-center justify-center gap-4">
        <MamaCard />
        <FahimBox />
      </div>
      <TryBar n={last === null ? null : TRIES[last].n} />
      <div className="mt-1 h-10 text-center">
        {last !== null && (
          <div key={last} className={`${POP} inline-flex items-baseline gap-2 font-mono`}>
            <span className="text-sm text-muted">{TRIES[last].sum} =</span>
            <b className="text-2xl text-danger">{TRIES[last].n}</b>
            <span className="text-lg text-danger">≠ 7</span>
          </div>
        )}
      </div>
      <div className="grid gap-1.5">
        {TRIES.map((t, i) => (
          <button key={t.label} type="button" onClick={() => tryIt(i)} className={`${pill(last === i)} font-sans`}>
            {t.label}
          </button>
        ))}
      </div>
      {done && (
        <Speech who="মামা" initial="M" tint="teal">
          এভাবে না। তবে 7 আসবে।
        </Speech>
      )}
      <Task done={done}>মামার card থেকে 7 আনার তিনটা উপায়ই try করে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The familiar twin. v = (3, 0) lies flat on the floor. The reader drags
//     w's tip, the noon sun drops it, and the box follows. Two different w's
//     that both make 6: only where the shadow lands counts.

const F2 = makeFrame(-1, 5, -0.6, 4, 36);
const V2: XY = [3, 0];

export function FlatFloor() {
  const pass = useGate();
  const [w, setW] = useSeed<XY>("w", [1, 3]);
  const [found, setFound] = useSeed<XY[]>("found", []);
  const done = found.length >= 2;

  const go = (p: XY) => {
    setW(p);
    if (done || dot(V2, p) !== 6 || found.some((q) => q[0] === p[0] && q[1] === p[1])) return;
    const next = [...found, p];
    setFound(next);
    if (next.length === 2) pass("w এর shadow কোথায় পড়ে, শুধু সেটাই matter করে।");
  };

  return (
    <>
      <Plane f={F2} ticks={1} label={`v শোয়ানো, 3 লম্বা। w এর মাথা (${nice(w[0])}, ${nice(w[1])}) এ; ওর shadow শেষ হয় ${nice(w[0])} এ`} drag={{ down: (p) => go(snap(p, F2)), move: (p) => go(snap(p, F2)) }} onKey={keyMove(F2, w, go)} className="max-w-[20rem]">
        <Sun f={F2} />
        <Shade f={F2} b={w[0]} />
        <Arrow f={F2} from={O} to={V2} tone="blue" w={3} />
        <Drop f={F2} from={w} />
        <Arrow f={F2} from={O} to={w} tone="coral" w={2.6} />
        {found.map((q) => (
          <circle key={`${q[0]} ${q[1]}`} cx={F2.sx(q[0])} cy={F2.sy(q[1])} r={6} strokeWidth={2} className={`${POP} pointer-events-none fill-none stroke-accent`} />
        ))}
        <circle cx={F2.sx(w[0])} cy={F2.sy(w[1])} r={9} className="fill-cat-coral/15 stroke-cat-coral" strokeWidth={1.2} />
        <Label f={F2} at={V2} dx={2} dy={-7} className="fill-cat-blue">
          v
        </Label>
        <Label f={F2} at={w} dx={10} dy={-4} anchor="start" className="fill-cat-coral">
          w
        </Label>
      </Plane>
      <BoxLine v={V2} w={w} tone={dot(V2, w) === 6 ? "good" : "plain"} live />
      <Ticks
        items={[
          ["একটা 6", found.length >= 1],
          ["আরেক জায়গায় আরেকটা 6", found.length >= 2],
        ]}
      />
      <Task done={done}>w এর মাথা টেনে নিন, যতক্ষণ না dot product বলে 6। তারপর আরেকটা জায়গা খুঁজুন, যেখানেও 6 আসে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict. Same flat v, w = (−2, 4). The traps: 6 (drop the sign) and 12
//     (use the 4). The sun drops the tip behind v's foot: −6.

const W3: XY = [-2, 4];
const G3 = ["6", "−6", "12"];

export function BehindFoot() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [dropped, setDropped] = useSeed("dropped", false);
  const [s] = useTween([dropped ? W3[0] : 0], 800);
  const drop = () => {
    setDropped(true);
    setTimeout(() => pass("Shadow v এর গোড়ার পিছনে পড়লে minus।"), 800);
  };

  return (
    <>
      <Plane f={F2} ticks={1} label={`v শোয়ানো, 3 লম্বা; w গেছে (−2, 4) এ${dropped ? ", ওর shadow v এর গোড়ার 2 ঘর পিছনে" : ""}`} className="max-w-[18rem]">
        <Sun f={F2} />
        {dropped && <Shade f={F2} b={s} bad />}
        <Arrow f={F2} from={O} to={V2} tone="blue" w={3} />
        {dropped && <Drop f={F2} from={W3} />}
        <Arrow f={F2} from={O} to={W3} tone="coral" w={2.6} />
        <Label f={F2} at={V2} dx={2} dy={-7} className="fill-cat-blue">
          v
        </Label>
        <Label f={F2} at={W3} dx={-8} dy={-2} anchor="end" className="fill-cat-coral">
          w
        </Label>
      </Plane>
      {guess !== null && !dropped && (
        <div className="flex justify-center">
          <button type="button" onClick={drop} className={`${primaryBtn} ${FADE}`}>
            রোদ ফেলুন
          </button>
        </div>
      )}
      {dropped && (
        <div className={FADE}>
          <BoxLine v={V2} w={W3} />
        </div>
      )}
      <div className="mt-3 text-sm font-medium text-muted">বলুন তো, এই w এর জন্য dot product কত বলবে?</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {G3.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, dropped, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="font-mono text-lg">{o}</span>
          </Choice>
        ))}
      </div>
      <Task done={dropped}>আগে একটা guess দিন। তারপর w এর মাথায় রোদ ফেলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Piece: a 1 m bamboo stick in the noon sun. The reader tilts it to end
//     its shadow on four chalk marks, and the card fills: 30° 0.866, 60° 0.5,
//     90° 0, 120° −0.5. Nothing here mentions arrows.

const F4 = makeFrame(-1.15, 1.2, -0.28, 1.12, 112);
const MARKS = [30, 60, 90, 120];

function StickSheet({ f, deg, L, marks = [], hit = [], label }: { f: Frame; deg: number; L: number; marks?: number[]; hit?: number[]; label: string }) {
  const tip = polar(L, deg);
  const back = tip[0] < -1e-9;
  return (
    <Plane f={f} grid={0} axes={false} label={label} className="max-w-[20rem]">
      <Sun f={f} />
      <Floor f={f} />
      {marks.map((m) => {
        const x = L * Math.cos(m * RAD);
        const on = hit.includes(m);
        return (
          <g key={m} className="pointer-events-none">
            <path d={`M${f.sx(x)} ${f.sy(0) + 3}v12`} strokeWidth={2.2} className={on ? "stroke-accent" : "stroke-[#0f1b2d]/35"} />
            <text x={f.sx(x)} y={f.sy(0) + 25} textAnchor="middle" fontSize={8.5} fontWeight={700} className={on ? "fill-accent-text font-mono" : "fill-[#0f1b2d]/40 font-mono"}>
              {on ? (CARD_ROWS.find(([d]) => d === m)?.[1] ?? "") : "?"}
            </text>
          </g>
        );
      })}
      <Shade f={f} b={tip[0]} y={-0.04} bad={back} />
      <Drop f={f} from={tip} />
      <Stick f={f} tip={tip} />
      <Arc f={f} a={[1, 0]} b={tip} r={0.2} text={deg > 0 ? `${deg}°` : undefined} />
      <circle cx={f.sx(0)} cy={f.sy(0)} r={3.5} className="pointer-events-none fill-[#0f1b2d]" />
    </Plane>
  );
}

function StickCard({ rows }: { rows: [deg: number, value: string, on: boolean][] }) {
  return (
    <div className="mx-auto mt-2 flex w-fit gap-1 rounded-xl border border-border bg-surface px-2 py-1 font-mono text-sm">
      {rows.map(([d, v, on]) => (
        <div key={d} className="flex w-12 flex-col items-center">
          <span className="text-xs text-muted">{d}°</span>
          <b className={on ? `${POP} inline-block` : "text-muted/40"}>{on ? v : "?"}</b>
        </div>
      ))}
    </div>
  );
}

const CARD_ROWS: [number, string][] = [
  [0, "1"],
  [30, "0.866"],
  [60, "0.5"],
  [90, "0"],
  [120, "−0.5"],
];

export function StickMarks() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 0);
  const [hit, setHit] = useSeed<number[]>("hit", []);
  const done = MARKS.every((m) => hit.includes(m));

  const tilt = (d: number) => {
    setDeg(d);
    if (!MARKS.includes(d) || hit.includes(d)) return;
    const next = [...hit, d];
    setHit(next);
    if (MARKS.every((m) => next.includes(m))) pass("প্রতিটা হেলানোর নিজের একটা shadow number আছে।");
  };

  return (
    <>
      <StickSheet f={F4} deg={deg} L={1} marks={MARKS} hit={hit} label={`1 metre এর কঞ্চি ${deg}° হেলানো, shadow ${nice(Math.cos(deg * RAD))} metre`} />
      <Tilt value={deg} max={180} label="কঞ্চিটা কতখানি হেলানো" onChange={tilt} />
      <div className="mt-1 text-center text-[0.95rem]">
        <span className="font-mono">{deg}°</span>: shadow <b className="font-mono">{nice(Math.cos(deg * RAD))}</b> m
      </div>
      <StickCard rows={CARD_ROWS.map(([d, v]) => [d, v, d === 0 || hit.includes(d)])} />
      <Task done={done}>কঞ্চিটা হেলান, যাতে ওর shadow একে একে প্রতিটা চকের দাগে গিয়ে শেষ হয়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Piece: Mami's three poles, 1, 2 and 3 m, each leaned to 60°. The
//     shadow grows 0.5, 1, 1.5; shadow ÷ pole stays 0.5.

const F5 = makeFrame(-0.4, 3.3, -0.3, 2.75, 52);
const POLES = [1, 2, 3];

export function ThreePoles() {
  const pass = useGate();
  const [L, setL] = useSeed("L", 1);
  const [deg, setDeg] = useSeed("deg", 20);
  const [got, setGot] = useSeed<number[]>("got", []);
  const done = POLES.every((p) => got.includes(p));
  const shadow = L * Math.cos(deg * RAD);

  const note = (l: number, d: number) => {
    if (d !== 60 || got.includes(l)) return;
    const next = [...got, l];
    setGot(next);
    if (POLES.every((p) => next.includes(p))) pass("বাঁশ লম্বা, shadow ও লম্বা। তবু সেই 0.5.");
  };

  return (
    <>
      <StickSheet f={F5} deg={deg} L={L} label={`${L} metre এর বাঁশ ${deg}° হেলানো, shadow ${nice(shadow)} metre`} />
      <Tilt value={deg} max={90} label="বাঁশটা কতখানি হেলানো" onChange={(d) => {
          setDeg(d);
          note(L, d);
        }} />
      <div className="mt-1 flex justify-center gap-2">
        {POLES.map((l) => (
          <button key={l} type="button" onClick={() => {
              setL(l);
              note(l, deg);
            }} className={pill(L === l)}>
            {l} m
          </button>
        ))}
      </div>
      <div className="mx-auto mt-2 grid w-fit grid-cols-3 gap-x-4 rounded-xl border border-border bg-surface px-3 py-1 font-mono text-sm">
        <span className="font-sans text-xs text-muted">বাঁশ</span>
        <span className="font-sans text-xs text-muted">shadow</span>
        <span className="font-sans text-xs text-muted">shadow ÷ বাঁশ</span>
        {POLES.map((l) => {
          const on = got.includes(l);
          return [
            <span key={`a${l}`}>{l} m</span>,
            <b key={`b${l}`} className={on ? `${POP} inline-block` : "text-muted/40"}>
              {on ? `${nice(l / 2)} m` : "?"}
            </b>,
            <b key={`c${l}`} className={on ? `${POP} inline-block` : "text-muted/40"}>
              {on ? "0.5" : "?"}
            </b>,
          ];
        })}
      </div>
      <Task done={done}>তিনটা বাঁশই একে একে 60° তে হেলান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The rule change. v = (2, 1) is tilted now. The flat trick (v's length ×
//     where the sun drops w) gives 4.47, not 7: the shadow lands on the floor,
//     not on v. The reader turns the paper until v lies flat; then the drop
//     lands on v's line at 3.13, and 2.24 × 3.13 = 7.0.

const F6 = makeFrame(-0.9, 3.9, -0.7, 3.7, 46);
const PHI = Math.atan2(V[1], V[0]) / RAD; // 26.57°: how far v is tilted
const LV = len(V);
const LW = len(W);
const SHADOW = dot(V, W) / LV; // 3.13: w's shadow on v

/** The sheet with v and w, turned clockwise by `turn`°, over the floor. The sun drops w's tip to the floor. */
function TurnSheet({ turn, dropped, label, children }: { turn: number; dropped: boolean; label: string; children?: ReactNode }) {
  const f = F6;
  const clip = `turn${useId().replace(/:/g, "")}`;
  const w = rot(W, -turn);
  const flat = Math.abs(turn - PHI) < 0.01;
  const g: number[] = [];
  for (let i = -1; i <= 4; i++) g.push(i);
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} className="max-w-[20rem]">
      <defs>
        <clipPath id={clip}>
          <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} rx={3} />
        </clipPath>
      </defs>
      <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} rx={3} className="fill-[#f1ece2]" />
      <Sun f={f} />
      <g clipPath={`url(#${clip})`}>
      <g transform={`rotate(${turn} ${f.sx(0)} ${f.sy(0)})`}>
        <rect x={f.sx(-0.5)} y={f.sy(3.5)} width={4 * f.u} height={4 * f.u} rx={2} strokeWidth={0.8} className="fill-white stroke-[#cbd5e1]" />
        {g
          .filter((i) => i >= 0 && i <= 3)
          .map((i) => (
            <g key={i}>
              <path d={`M${f.sx(i)} ${f.sy(-0.5)}V${f.sy(3.5)}M${f.sx(-0.5)} ${f.sy(i)}H${f.sx(3.5)}`} strokeWidth={0.6} className="stroke-cat-blue/25" />
            </g>
          ))}
        <Arrow f={f} from={O} to={V} tone="blue" w={3} />
        <Arrow f={f} from={O} to={W} tone="coral" w={2.6} />
      </g>
      </g>
      <Floor f={f} />
      {dropped && <Shade f={f} b={w[0]} y={-0.1} bad={!flat} />}
      {dropped && <Drop f={f} from={w} />}
      <Label f={f} at={rot(V, -turn)} dx={4} dy={14} className="fill-cat-blue">
        v
      </Label>
      <Label f={f} at={w} dx={-8} dy={-2} anchor="end" className="fill-cat-coral">
        w
      </Label>
      <text x={f.sx(f.x0) + 4} y={f.sy(0) - 4} fontSize={8} className="pointer-events-none fill-[#0f1b2d]/50">
        মেঝে
      </text>
      {children}
    </Plane>
  );
}

export function TurnThePaper() {
  const pass = useGate();
  const [tried, setTried] = useSeed("tried", false);
  const [turn, setTurn] = useSeed("turn", 0);
  const flat = Math.abs(turn - PHI) < 0.01;
  const sh = rot(W, -turn)[0];

  const onTurn = (t: number) => {
    if (flat) return;
    if (Math.abs(t - PHI) < 1.5) {
      setTurn(PHI);
      pass("v কে শুইয়ে দিলে আবার সেই length × shadow।");
    } else setTurn(t);
  };

  return (
    <>
      <TurnSheet turn={turn} dropped={tried} label={`v = (2, 1) আর w = (2, 3), কাগজ ঘুরানো ${Math.round(turn)}°; ${tried ? `মেঝেতে w এর shadow ${nice(sh)}` : "এখনো shadow নাই"}`} />
      {!tried ? (
        <div className="flex justify-center">
          <button type="button" onClick={() => setTried(true)} className={primaryBtn}>
            আগের নিয়মটা চালান
          </button>
        </div>
      ) : (
        <div className={FADE}>
          {!flat && <Tilt value={Math.round(turn * 2) / 2} max={45} step={0.5} label="কাগজটা ঘুরান" onChange={onTurn} />}
          <div className="mt-1 text-center font-mono text-[0.95rem]">
            <div className="font-sans text-xs text-muted">v এর length × shadow</div>
            2.24 × {nice(sh)} = <b className={flat ? "text-accent-text" : "text-danger"}>{flat ? "7.0" : nice(LV * sh)}</b>
            <span className={flat ? "text-accent-text" : "text-danger"}>{flat ? " ✓ dot product 7" : " ≠ dot product 7"}</span>
          </div>
          {!flat && turn === 0 && <Nope>Shadow পড়ছে মেঝেতে, v এর উপরে না। রোদ তো শুধু সোজা নিচে নামে।</Nope>}
        </div>
      )}
      <Task done={flat}>আগে শোয়ানো v এর নিয়মটা চালান। তারপর কাগজটা ঘুরাতে থাকুন। যতক্ষণ না মেলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The snap. The turned sheet from screen 6: w becomes the stick, v's line
//     the floor, about 30° between them, and screen 4's card has that row.
//     Then the reader taps w's length and the card number, and the shadow
//     they make lands on the 3.13 they measured.

const F7 = makeFrame(-0.5, 3.8, -0.75, 2.3, 58);
const V7: XY = [LV, 0];
const W7 = rot(W, -PHI); // (3.13, 1.79)
const SNAP_CAP = [
  "আগের সেই ঘুরানো কাগজ। v এর উপর w এর shadow: 3.13.",
  "এবার w এর দিকে আবার তাকান। দুপুরের রোদে একটা কঞ্চি।",
  "মেঝে থেকে প্রায় 30° হেলানো।",
  "কঞ্চির card এ 30° এর একটা ঘর আছে।",
];
const CHIPS = [
  { key: "len", text: "w এর length 3.61" },
  { key: "card", text: "card 0.866" },
];

export function WIsTheStick() {
  const pass = useGate();
  const play = usePlay(1300);
  const [seen, setSeen] = useSeed("seen", false);
  const [tapped, setTapped] = useSeed<string[]>("tapped", []);
  const k = seen && !play.running ? 3 : play.k;
  const both = tapped.length === 2;
  const [grow] = useTween([both ? LW * 0.866 : 0], 900);

  const tap = (key: string) => {
    if (!seen || tapped.includes(key)) return;
    const next = [...tapped, key];
    setTapped(next);
    if (next.length === 2) setTimeout(() => pass("w এর shadow = w এর length × card এর number."), 900);
  };

  return (
    <>
      <Plane f={F7} grid={0} axes={false} label="ঘুরানো কাগজ: v মেঝেতে শোয়ানো, w তার উপরে প্রায় 30° হেলে আছে, v এর উপর w এর shadow 3.13 লম্বা" className="max-w-[20rem]">
        {k >= 1 && (
          <g className={FADE}>
            <Sun f={F7} />
          </g>
        )}
        <Floor f={F7} />
        <Shade f={F7} b={SHADOW} y={-0.1} />
        <path d={`M${F7.sx(SHADOW)} ${F7.sy(0) + 2}v12`} strokeWidth={2} className="pointer-events-none stroke-[#b45309]" />
        <text x={F7.sx(SHADOW) + 5} y={F7.sy(0) + 12} fontSize={9} fontWeight={700} className="pointer-events-none fill-[#b45309] font-mono">
          3.13
        </text>
        {both && <Shade f={F7} b={grow} y={-0.45} />}
        <Arrow f={F7} from={O} to={V7} tone="blue" w={3} />
        <Drop f={F7} from={W7} />
        {k >= 1 ? (
          <g className={FADE}>
            <Stick f={F7} tip={W7} w={6} />
          </g>
        ) : (
          <Arrow f={F7} from={O} to={W7} tone="coral" w={2.6} />
        )}
        {k >= 2 && (
          <g className={FADE}>
            <Arc f={F7} a={[1, 0]} b={W7} r={0.7} text="30°" />
          </g>
        )}
        <Label f={F7} at={V7} dx={0} dy={-8} className="fill-cat-blue">
          v
        </Label>
        {both && (
          <text x={F7.sx(grow / 2)} y={F7.sy(-0.45) + 17} textAnchor="middle" fontSize={9} fontWeight={700} className={`${FADE} pointer-events-none fill-[#b45309] font-mono`}>
            3.61 × 0.866 = 3.13
          </text>
        )}
      </Plane>
      <div className="h-9">{k >= 3 && <StickCard rows={[[30, "0.866", true]]} />}</div>
      <div className="mx-auto mt-2 min-h-10 max-w-xs text-center text-sm leading-snug text-muted">{seen ? (both ? "দুইটা একই জায়গায় গিয়ে পড়লো।" : "কঞ্চির নিয়মে w এর shadow বানান: দুইটাতেই tap করুন।") : SNAP_CAP[k]}</div>
      {!seen && !play.running && (
        <div className="mt-1 flex justify-center">
          <button type="button" onClick={() => play.play(3, () => setSeen(true))} className={primaryBtn}>
            আবার দেখুন
          </button>
        </div>
      )}
      {seen && (
        <div className={`${FADE} mt-1 flex justify-center gap-2`}>
          {CHIPS.map((c) => (
            <button key={c.key} type="button" onClick={() => tap(c.key)} disabled={tapped.includes(c.key)} className={`${pill(tapped.includes(c.key))} font-sans`}>
              {c.text}
            </button>
          ))}
        </div>
      )}
      <Task done={both}>আগে কাগজটা দেখুন। তারপর w এর length আর card এর number এ tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Use it: only Mama's card. The reader fills three slots from four chips.
//     0.866 isn't on the card: the stick has to be tilted to 30° to get it.
//     Any slot holding 30 multiplies degrees and gives 242.6.

const F8 = makeFrame(-0.2, 1.1, -0.15, 0.62, 70);
const CHIP8 = ["2.24", "3.61", "30", "0.866"];
const VAL8: Record<string, number> = { "2.24": 2.24, "3.61": 3.61, "30": 30, "0.866": 0.866 };

export function CardAlone() {
  const pass = useGate();
  const [asked, setAsked] = useSeed("asked", false);
  const [slots, setSlots] = useSeed<string[]>("slots", []);
  const [misses, setMisses] = useSeed("misses", 0);
  const [deg] = useTween([asked ? 30 : 0], 900);
  const full = slots.length === 3;
  const right = full && !slots.includes("30");
  const n = slots.reduce((p, c) => p * VAL8[c], 1);

  const put = (c: string) => {
    const base = full ? [] : slots;
    if (right || base.includes(c) || (c === "0.866" && !asked)) return;
    const next = [...base, c];
    setSlots(next);
    if (next.length < 3) return;
    if (next.includes("30")) setMisses(misses + 1);
    else pass("2.24 × 3.61 × 0.866 = 7.0, dot product এর মতোই।");
  };

  return (
    <>
      <div className="flex items-center justify-center gap-4">
        <MamaCard />
        <FahimBox lit={right} />
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 font-mono text-lg">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted">×</span>}
            <span className={`grid h-9 min-w-14 place-items-center rounded-lg border-2 px-1.5 ${slots[i] ? `${POP} border-cat-blue bg-cat-blue/10` : "border-dashed border-border"}`}>{slots[i] ?? ""}</span>
          </span>
        ))}
        <span className="text-muted">=</span>
        <b key={slots.join()} className={`${full ? POP : ""} inline-block min-w-12 ${full ? (right ? "text-accent-text" : "text-danger") : "text-muted/40"}`}>
          {full ? (right ? "7.0" : nice(Math.round(n * 10) / 10)) : "?"}
        </b>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="w-28 shrink-0">
          <Plane f={F8} grid={0} axes={false} label={`1 metre এর কঞ্চি ${Math.round(deg)}° হেলানো`} className="my-0 max-w-[7rem]">
            <Floor f={F8} />
            <Shade f={F8} b={Math.cos(deg * RAD)} y={-0.05} />
            <Stick f={F8} tip={polar(1, deg)} w={4} />
          </Plane>
        </div>
        <button type="button" onClick={() => setAsked(true)} disabled={asked} className={`${pill(asked)} font-sans`}>
          {asked ? "30° তে আসে 0.866" : "কঞ্চিটা 30° তে হেলান"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {CHIP8.map((c) => {
          const locked = c === "0.866" && !asked;
          return (
            <button key={c} type="button" onClick={() => put(c)} disabled={locked || right} className={`${pill(slots.includes(c))} ${locked ? "opacity-30" : ""} ${c === "0.866" && asked ? POP : ""}`}>
              {c}
            </button>
          );
        })}
      </div>
      {full && !right && <Nope key={misses}>30 তো degree, shadow number না। Dot product 242 হতে পারে না। আবার শুরু করতে একটা number এ tap করুন।</Nope>}
      <Task done={right}>Card থেকে তিনটা ঘর ভরুন, যাতে উত্তর dot product এর সাথে মেলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it: a new card, v 2 long, w 3 long, 60°. The reader leans w to 60°,
//     watches the shadow, then picks the box's number. The slips: 6 (w laid
//     flat instead of dropped: the ghost rotates down to show it) and 1.5
//     (the shadow alone).

const F9 = makeFrame(-3.2, 3.3, -0.45, 3.1, 36);
const V9: XY = [2, 0];
const G9 = ["6", "1.5", "3"];
const R9 = 2;
const WHY9: Record<number, string> = {
  0: "এটা পুরো 3 লম্বা w কে মেঝেতে শুইয়ে দেয়। রোদ w এর মাথা সোজা নিচে ফেলে, w কে শোয়ায় না।",
  1: "এটা শুধু w এর shadow। মামার recipe এটাকে আবার v এর length দিয়ে গুণ করে।",
};

export function SixtyCard() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 150);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const set = deg === 60 || pick !== null;
  const w = polar(3, deg);
  const [flatDeg] = useTween([pick === 0 ? 0 : 60], 800);
  // 1.5 lays the shadow alone under v; 3 lays it down twice, once per unit of v's length
  const [bar] = useTween([pick === 1 ? 1.5 : pick === R9 ? 3 : 0], 800);

  const choose = (i: number) => {
    setPick(i);
    if (i === R9) setTimeout(() => pass("2 × 3 × 0.5 = 3."), 800);
    else setMiss(miss + 1);
  };

  return (
    <>
      <CardStrip v={2} w={3} deg={60} />
      <Plane f={F9} grid={0} axes={false} label={`v শোয়ানো, 2 লম্বা; w 3 লম্বা, ${deg}° তে`} className="my-2 max-w-[17rem]">
            <Sun f={F9} />
            <Floor f={F9} />
            <Shade f={F9} b={w[0]} bad={w[0] < -1e-9} />
            {pick === 0 && <Shade f={F9} b={polar(3, flatDeg)[0]} y={-0.35} ghost bad />}
            {pick === 0 && <Arrow f={F9} from={O} to={polar(3, flatDeg)} tone="coral" w={2} faint />}
            {(pick === 1 || pick === R9) && (
              <g className={FADE}>
                <Shade f={F9} b={bar} y={-0.35} bad={pick === 1} ghost={pick === 1} />
                {pick === R9 && bar > 1.55 && <path d={`M${F9.sx(1.5)} ${F9.sy(-0.35) - 5}v10`} strokeWidth={1.5} className="pointer-events-none stroke-white" />}
                <text x={F9.sx(-0.15)} y={F9.sy(-0.35) + 3} textAnchor="end" fontSize={9} fontWeight={700} className={`pointer-events-none ${pick === 1 ? "fill-danger" : "fill-[#b45309] font-mono"}`}>
                  {pick === 1 ? "শুধু 1.5" : "2 × 1.5 = 3"}
                </text>
              </g>
            )}
            <Arrow f={F9} from={O} to={V9} tone="blue" w={3} faint={pick === 1} />
            <Drop f={F9} from={w} />
            <Arrow f={F9} from={O} to={w} tone="coral" w={2.6} />
            <Arc f={F9} a={[1, 0]} b={w} r={0.55} text={`${deg}°`} />
      </Plane>
      {pick === null && <Tilt value={deg} max={180} label="v এর সাথে w এর angle" onChange={setDeg} />}
      <div className="mt-1 text-center text-sm text-muted">{set ? `v এর উপর w এর shadow: ${nice(w[0])}` : "w কে card এর angle এ হেলান।"}</div>
      {set && (
        <div className={FADE}>
          <div className="mt-2 text-sm font-medium text-muted">তাহলে dot product কত বলবে?</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {G9.map((o, i) => (
              <Choice key={o} n={i} look={pick === i ? (i === R9 ? "right" : "wrong") : "idle"} disabled={pick === R9} onClick={() => choose(i)}>
                <span className="font-mono text-lg">{o}</span>
              </Choice>
            ))}
          </div>
        </div>
      )}
      {pick !== null && pick !== R9 && <Nope key={miss}>{WHY9[pick]}</Nope>}
      <Task done={pick === R9}>w কে 60° তে হেলান। তারপর বলুন, dot product কত বলবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · Try it: card v 4 long, w 2 long, 120°. Three unlabelled pictures (60°,
//      120°, 90°); the pick is drawn big with its shadow and box number. The
//      slips: a front shadow (+4) and upright (0).

const F10 = makeFrame(-1.5, 4.4, -0.45, 2.2, 40);
const V10: XY = [4, 0];
const OPTS10 = [60, 120, 90];
const R10 = 1;
const WHY10: Record<number, string> = {
  60: "এই w সামনে হেলানো। ওর shadow পড়ে সামনে। তাই dot product বলতো +4. Card এ কিন্তু লেখা 120°।",
  90: "এই w একদম খাড়া। কোনো shadow ই নাই। তাই dot product বলতো 0.",
};

function Mini({ deg }: { deg: number }) {
  const f = makeFrame(-1, 2.1, -0.1, 1.7, 22, 6);
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} className="block h-auto w-16" aria-hidden="true">
      <path d={`M${f.sx(f.x0)} ${f.sy(0)}H${f.sx(f.x1)}`} strokeWidth={1} stroke={INK} opacity={0.4} />
      <Arrow f={f} from={O} to={[2, 0]} tone="blue" w={2.2} />
      <Arrow f={f} from={O} to={polar(1.6, deg)} tone="coral" w={2.2} />
      <Arc f={f} a={[1, 0]} b={polar(1, deg)} r={0.45} />
    </svg>
  );
}

export function LeanBack() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const deg = pick === null ? null : OPTS10[pick];
  const w = deg === null ? null : polar(2, deg);
  const sh = w ? Math.round(w[0] * 1000) / 1000 : 0;

  const choose = (i: number) => {
    setPick(i);
    if (i === R10) pass("পিছনে হেলানো: shadow −1, dot product −4.");
    else setMiss(miss + 1);
  };

  return (
    <>
      <CardStrip v={4} w={2} deg={120} />
      <Plane f={F10} grid={0} axes={false} label={w ? `w ${deg}° তে, ওর shadow ${nice(sh)}` : "v শোয়ানো, 4 লম্বা; w বেছে নিন"} className="my-2 max-w-[17rem]">
            <Sun f={F10} />
            <Floor f={F10} />
            {w && <Shade key={deg} f={F10} b={sh} bad={sh < 0} />}
            <Arrow f={F10} from={O} to={V10} tone="blue" w={3} />
            {w && <Drop f={F10} from={w} />}
            {w && <Arrow key={deg} f={F10} from={O} to={w} tone="coral" w={2.6} draw />}
      </Plane>
      <div className="h-8 text-center font-mono text-[0.95rem]">
        {w && (
          <span key={deg} className={FADE}>
            <span className="font-sans text-sm text-muted">dot product </span>4 × {par(sh)} = <b className={pick === R10 ? "text-accent-text" : "text-danger"}>{nice(4 * sh)}</b>
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {OPTS10.map((d, i) => (
          <Choice key={d} n={i} look={pick === i ? (i === R10 ? "right" : "wrong") : "idle"} disabled={pick === R10} onClick={() => choose(i)}>
            <Mini deg={d} />
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== R10 && <Nope key={miss}>{WHY10[OPTS10[pick]]}</Nope>}
      <Task done={pick === R10}>মামার card এর সাথে যে ছবিটা মেলে, সেটা বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11 · The end: drag w anywhere. The box (slot by slot) and Mama's card recipe
//      (lengths and the angle) move together, always the same number. Why
//      always is 4.4's question.

const F11 = makeFrame(-3, 4, -2.5, 4, 30);

export function BothRecipes() {
  const pass = useGate();
  const [w, setW] = useSeed<XY>("w", W);
  const [spots, setSpots] = useSeed<string[]>("spots", []);
  const done = spots.length >= 3;
  const zero = w[0] === 0 && w[1] === 0;
  const th = zero ? 0 : angleOf(V, w);
  const t = dot(V, w) / dot(V, V);
  const foot: XY = [V[0] * t, V[1] * t];
  const far = 3.4;
  const u: XY = [V[0] / LV, V[1] / LV];

  const go = (p: XY) => {
    setW(p);
    const key = `${p[0]},${p[1]}`;
    if ((p[0] === 0 && p[1] === 0) || spots.includes(key) || key === `${W[0]},${W[1]}`) return;
    const next = [...spots, key];
    setSpots(next);
    if (next.length === 3) pass("দুই recipe, একই number। প্রতিবার।");
  };

  return (
    <>
      <Plane f={F11} ticks={0} label={`v = (2, 1); w = (${nice(w[0])}, ${nice(w[1])}); angle ${Math.round(th)}°`} drag={{ down: (p) => go(snap(p, F11)), move: (p) => go(snap(p, F11)) }} onKey={keyMove(F11, w, go)} className="max-w-[18rem]">
        <path d={`M${F11.sx(-u[0] * far)} ${F11.sy(-u[1] * far)}L${F11.sx(u[0] * far)} ${F11.sy(u[1] * far)}`} strokeWidth={1} strokeDasharray="3 4" className="pointer-events-none stroke-cat-blue/40" />
        {!zero && (
          <path d={`M${F11.sx(0)} ${F11.sy(0)}L${F11.sx(foot[0])} ${F11.sy(foot[1])}`} strokeWidth={7} strokeLinecap="round" opacity={0.85} className={`pointer-events-none ${t < 0 ? "stroke-danger" : "stroke-[#f59e0b]"}`} />
        )}
        <Arrow f={F11} from={O} to={V} tone="blue" w={3} />
        {!zero && <Drop f={F11} from={w} to={foot} />}
        <Arrow f={F11} from={O} to={w} tone="coral" w={2.6} />
        {!zero && <Arc f={F11} a={V} b={w} r={0.6} text={`${Math.round(th)}°`} />}
        <circle cx={F11.sx(w[0])} cy={F11.sy(w[1])} r={9} className="fill-cat-coral/15 stroke-cat-coral" strokeWidth={1.2} />
      </Plane>
      <div className="mx-auto grid w-fit gap-1 font-mono text-[0.9rem]">
        <div className="rounded-lg border-2 border-cat-amber/40 bg-cat-amber/5 px-2.5 py-1">
          <span className="font-sans text-xs text-muted">dot product </span>
          <BoxRun a={V} b={w} lang="bn" inline live />
        </div>
        <div className="rounded-lg border-2 border-cat-violet/40 bg-cat-violet/5 px-2.5 py-1">
          <span className="font-sans text-xs text-muted">card </span>2.24 × {nice(len(w))} × {cos3(Math.cos(th * RAD))} = <b className="inline-block">{zero ? "0" : nice(LV * len(w) * Math.cos(th * RAD))}</b>
        </div>
      </div>
      <Task done={done}>w এর মাথা টেনে তিনটা নতুন জায়গায় নিন। দুইটা number ই খেয়াল করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures (watch-only).

// 7a · Naming it: the stick's triangle, shadow ÷ stick = cos θ; then w's
//      shadow on v is ‖w‖ cos θ, and the drop meets v square.

const COS_SAY = ["1 লম্বা একটা কঞ্চি, θ angle এ হেলানো।", "ওর shadow ÷ কঞ্চি? এটাই card এর number। এর নাম cos θ।", "3.61 লম্বা কঞ্চির shadow হয় 3.61 × cos θ.", "w এর মাথা থেকে দাগটা v এর উপর right angle এ নামে। এই নামানোকে বলে projection।"];

export function CosName() {
  const s = useScene(4, [500, 1800, 2000, 2200]);
  const k = s.k;
  const f = makeFrame(-0.3, 3.9, -0.7, 2.2, 56);
  const L = k >= 3 ? LW : 1;
  const tip = polar(L, 30);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{COS_SAY[Math.max(0, k - 1)]}</span>}>
      <Plane f={f} grid={0} axes={false} label="θ angle এ হেলানো একটা কঞ্চি, ওর shadow, আর দাগটা যেখানে মেঝেতে নামে সেখানে একটা right angle" className="max-w-[18rem]">
        <Floor f={f} />
        <Shade f={f} b={tip[0]} y={-0.08} />
        <Drop f={f} from={tip} />
        <Stick f={f} tip={tip} w={5} />
        <Arc f={f} a={[1, 0]} b={tip} r={0.45} text="θ" />
        {k >= 4 && <path d={`M${f.sx(tip[0]) - 9} ${f.sy(0)}v-9h9`} strokeWidth={1.2} className={`${FADE} fill-none stroke-[#0f1b2d]`} />}
        {k >= 2 && (
          <text x={f.sx(tip[0] / 2)} y={f.sy(-0.08) + 18} textAnchor="middle" fontSize={10} fontWeight={700} className={`${FADE} fill-[#b45309] font-mono`}>
            {k >= 3 ? "3.61 × cos θ" : "cos θ"}
          </text>
        )}
      </Plane>
    </Scene>
  );
}

// 8a · The recipe, slot by slot: v's length, times w's shadow on v, which is
//      w's length times cos θ.

const RECIPE_SAY = ["মামার recipe:", "v এর length…", "…গুণ v এর উপর w এর shadow…", "…আর w এর shadow হলো w এর length × cos θ."];

export function RecipeLine() {
  const s = useScene(3, [500, 1600, 1800]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{RECIPE_SAY[k]}</span>}>
      <div className="flex min-h-16 items-center justify-center gap-1.5 font-mono text-lg">
        <span>v · w =</span>
        {k >= 1 && <span className={`${POP} inline-block rounded-md bg-cat-blue/15 px-1.5 text-cat-blue`}>‖v‖</span>}
        {k >= 2 && <span className={`${POP} inline-block`}>×</span>}
        {k >= 2 && (
          <span className={`${POP} inline-block rounded-md bg-[#f59e0b]/20 px-1.5`}>
            {k >= 3 ? (
              <span className={FADE}>
                <span className="text-cat-coral">‖w‖</span> cos θ
              </span>
            ) : (
              <span className="font-sans">w এর shadow</span>
            )}
          </span>
        )}
      </div>
    </Scene>
  );
}

// 7b · A figure for screen 7's explanation, no task: w follows the stick
//      rule. The 1 metre stick at 30° casts 0.866; a pole twice as long at
//      the same tilt casts twice as much (Mami's poles); a pole 3.61 long
//      casts 3.61 × 0.866 = 3.13, and that pole is w standing on v.

const P7_F = makeFrame(-0.3, 3.9, -0.7, 2.1, 42);
const P7_L = [1, 2, LW, LW];
const P7_SH = ["0.866", "1.73", "3.13", "3.13"];
const P7_SAY = [
  "আগের কঞ্চিটা: 1 metre, 30° হেলানো। ওর shadow 0.866.",
  "মামির বাঁশের মতো: দ্বিগুণ লম্বা, একই হেলান, shadow ও দ্বিগুণ। 1.73.",
  "3.61 লম্বা একটা বাঁশ, 30° তে: 3.61 × 0.866 = 3.13.",
  "ওই বাঁশটাই w, দাঁড়িয়ে আছে v এর উপর। তাই w এর shadow হলো w এর length × card এর number.",
];

export function PoleToW() {
  const s = useScene(3, [500, 1800, 2000, 2400]);
  const k = s.k;
  const f = P7_F;
  const [L] = useTween([P7_L[k]], 900);
  const tip = polar(L, 30);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{P7_SAY[k]}</span>}>
      <Plane f={f} grid={0} axes={false} label={`${P7_L[k] === LW ? "3.61" : P7_L[k]} লম্বা একটা বাঁশ 30 degree হেলানো, ওর shadow ${P7_SH[k]}`} className="my-0! max-w-[14rem]">
        <Sun f={f} />
        <Floor f={f} />
        {k >= 3 && (
          <g className={FADE}>
            <Arrow f={f} from={O} to={[LV, 0]} tone="blue" w={3} />
            <Label f={f} at={[LV, 0]} dx={0} dy={-8} className="fill-cat-blue">
              v
            </Label>
          </g>
        )}
        <Shade f={f} b={tip[0]} y={-0.1} />
        <Drop f={f} from={tip} />
        {k >= 3 ? (
          <g className={FADE}>
            <Arrow f={f} from={O} to={tip} tone="coral" w={2.6} />
            <Label f={f} at={tip} dx={-6} dy={-4} anchor="end" className="fill-cat-coral">
              w
            </Label>
          </g>
        ) : (
          <Stick f={f} tip={tip} w={5} />
        )}
        <Arc f={f} a={[1, 0]} b={tip} r={0.42} text="30°" />
        <text key={k} x={f.sx(tip[0])} y={f.sy(-0.1) + 17} textAnchor="middle" fontSize={9.5} fontWeight={700} className={`${FADE} pointer-events-none fill-[#b45309] font-mono`}>
          {P7_SH[k]}
        </text>
      </Plane>
    </Scene>
  );
}

// 8b · A figure for screen 8's explanation, no task: the callback to screen
//      1. Mama's card and Fahim's slot sum; Mama's words from the start; the
//      slots go grey, the card works it out, and it lands on the same 7.

export function MamaSaid() {
  const s = useScene(3, [500, 2400, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="মামার হাতে card: 2.24, 3.61 আর 30 degree। ফাহিমের হাতে dot product এর slot ধরে ধরে যোগফল। মামা বললেন শুধু card থেকেই 7 আনবেন। Slot এর হিসাবটা ফিকে হয়ে গেলো। Card হয়ে গেলো 2.24 গুণ 3.61 গুণ 0.866, মানে 7। ফাহিম বললো, dot product এর মতোই 7, আর slot ছাড়াই।">
        <Roof />
        <Person who="mama" x={112} y={SG} arm="hold" mood={k >= 3 ? "smug" : "plain"} />
        <Person who="fahim" x={262} y={SG} facing={-1} arm="hold" mood={k >= 3 ? "happy" : "plain"} />
        <g opacity={k >= 2 ? 0.35 : 1} className="transition-opacity duration-700 motion-reduce:transition-none">
          <CastCard x={224} y={SG - 44} text="2×2 + 1×3" tone="blue" />
        </g>
        <CastCard key={k >= 3 ? 3 : k >= 2 ? 2 : 0} x={128} y={SG - 44} text={k >= 3 ? "2.24×3.61×0.866 = 7" : k >= 2 ? "2.24 × 3.61 × 0.866" : "2.24 · 3.61 · 30°"} tone="amber" />
        {k === 1 && <Bubble x={112} y={SG - 66} side="right" lines={["Slot লাগবে না।", "এই card থেকেই 7 আনবো।"]} />}
        {k >= 3 && <Bubble x={262} y={SG - 66} side="left" lines={["Dot product এর মতোই 7.", "Slot ছাড়াই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  NoonCard: { start: { k: 0 }, end: { k: 5 } },
  MamiPoles: { end: { k: 3 } },
  FlatFloor: { start: {}, one: { w: [2, 3], found: [[2, 3]] }, done: { w: [2, 0], found: [[2, 3], [2, 0]] } },
  BehindFoot: { start: {}, guessed: { guess: 0 }, dropped: { guess: 0, dropped: true } },
  StickMarks: { start: {}, half: { deg: 60, hit: [30, 60] }, done: { deg: 120, hit: [30, 60, 90, 120] } },
  ThreePoles: { start: {}, done: { L: 3, deg: 60, got: [1, 2, 3] } },
  TurnThePaper: { start: {}, tried: { tried: true }, half: { tried: true, turn: 14 }, flat: { tried: true, turn: PHI } },
  WIsTheStick: { start: {}, seen: { seen: true }, done: { seen: true, tapped: ["len", "card"] } },
  CardAlone: { start: {}, wrong: { slots: ["2.24", "3.61", "30"], misses: 1 }, right: { asked: true, slots: ["2.24", "3.61", "0.866"] } },
  SixtyCard: { start: {}, set: { deg: 60 }, wrong: { deg: 60, pick: 0, miss: 1 }, alone: { deg: 60, pick: 1, miss: 1 }, right: { deg: 60, pick: 2 } },
  LeanBack: { start: {}, wrong: { pick: 0, miss: 1 }, right: { pick: 1 } },
  BothRecipes: { start: {}, moved: { w: [-2, 3], spots: ["-2,3"] } },
  CosName: { end: { k: 4 } },
  RecipeLine: { end: { k: 3 } },
  StickFound: { start: { k: 0 }, held: { k: 2 }, end: { k: 3 } },
  NewCard: { end: { k: 2 } },
  MamiWantsProof: { always: { k: 2 }, end: { k: 4 } },
  PoleToW: { start: { k: 0 }, mid: { k: 2 }, end: { k: 3 } },
  MamaSaid: { said: { k: 1 }, end: { k: 3 } },
  CardTries: { start: {}, one: { tried: [0], last: 0 }, big: { tried: [0, 2], last: 2 }, done: { tried: [0, 1, 2], last: 1 } },
};
