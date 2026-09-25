"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Stepper, Ticks, predictLook, primaryBtn, quietBtn, pill, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, makeFrame, type Drag, type Frame, type XY } from "@/components/journey/plane";
import { Tup } from "@/components/journey/box";
import { GOOD_LENS, LightBhai, Post, Projector, STAGE_WALL_F, StageBeam, StageWall, WallBed, apply, det, heartPath, projectorLens, type Cols } from "./light-kit";
import { Kouta, PK, PaintFill, StageBrush, StageKouta, polyArea } from "./patch-kit";

// Screens for "Math for AI 10.4 — কৌটা গুনে stencil এর ঠিকানা", told as a
// Journey in the author's Bangla-English. The plan is 10_journey_specs.md,
// block 10.4.
//
// বিকাল, নানাবাড়ির শেষ দিনের আগের দিন। The লাইট ভাই is back for his বাকি টাকা
// and has half an hour before the next wedding. Rina chalks a cross over the
// door, b = (5, 4), and asks her 9.5 question: where on the stencil card do
// I draw the heart so that G = [[2, 1], [1, 2]] throws it onto the cross?
// Som wants to build G⁻¹ (9.2). Rina says she'll count কৌটা on the wall.
// Nasib: কৌটা দিয়া ঠিকানা? জিন্দেগিতেও হবে না।
//
// Nine screens. 1 seals the bet: four spots on the card (StencilBet). 2 a
// coordinate is an area: drag x, the patch of e₁ and x holds x₂ ঘর (and of
// x and e₂, x₁) (CoordIsArea). 3 the card thrown through G: every patch 3
// times bigger (ThrowTheArea). 4 predict, then pour: the wall's patch of
// column 1 and b holds 3 কৌটা, of b and column 2 six; ÷ 3 gives (2, 1)
// (CountKouta). 5 the same patches as matrices: b in a column's slot, ad − bc
// (SwapColumn). 6 the heart cut at (2, 1), thrown onto the cross
// (HeartLands). 7 Your turn: Karim's cross (4, 5) (YourKouta). 8 Try it:
// Check Q3 on the লাইট ভাই's next lens, det −3 (TryCramer). 9 the bet
// opened (BetOpen), the end.
//
// After the screens: the story scenes (DoorCross, FourSpots, KarimChalk,
// SaminPhone, RinaCuts, KarimCross, NextLens, MagribVan, BaburchiNight) and
// the watch-only figures (StakeFig, ShearSame, WallQuestion, PatchOverPatch,
// SlotSlide, ThreeRoads, RecapFig, StepsRace), each numbered after its
// screen.
//
// The wall is light-kit's (WallBed, Post: the door, the window, the post and
// its nail at (0, 0)); the কৌটা and the paint are patch-kit's. Both are used
// read-only. The wall here runs a little higher than light-kit's WALL (y up
// to 7.5), so Karim's patch in screen 7 fits.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const BLUE = "#2563eb";
const TEAL = "#0d9488";
const PINK = "#ec4899";
const PINK_DARK = "#be185d";
const RED = "#dc2626";
const CHALK = "#f8fafc";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

// ---------------------------------------------------------------------------
// Numbers.

/** the লাইট ভাই's lens, G = [[2, 1], [1, 2]]: columns (2, 1) and (1, 2), det 3 */
const G: Cols = GOOD_LENS;
const C1: XY = G[0];
const C2: XY = G[1];
const DET = det(G);
/** Rina's chalk cross over the door */
const B: XY = [5, 4];
/** the card spot whose light lands on it */
const X_DOOR: XY = [2, 1];
/** Karim's cross (screen 7) and its card spot */
const B7: XY = [4, 5];
const X7: XY = [1, 2];
/** the লাইট ভাই's next lens (screen 8, Check Q3): columns (2, 1) and (1, −1), det −3 */
const K: Cols = [
  [2, 1],
  [1, -1],
];
const B8: XY = [5, 1];

const E1: XY = [1, 0];
const E2: XY = [0, 1];
/** What the two numbers of a spot count (for journey/box <Tup of>). */
const SPOT_SLOTS = ["ডানে কত ঘর", "উপরে কত ঘর"] as const;

const add = (a: XY, b: XY): XY => [a[0] + b[0], a[1] + b[1]];
const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const same = (a: XY, b: XY) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
/** the signed area of the patch with sides a and b: det of [a b] */
const cross2 = (a: XY, b: XY) => a[0] * b[1] - a[1] * b[0];
/** the patch with sides a and b, from the nail */
const para = (a: XY, b: XY): XY[] => [[0, 0], a, add(a, b), b];
/** a spot carried partway through a lens: t = 0 still on the card, 1 thrown */
const throwAt = (c: Cols, p: XY, t: number): XY => lerp(p, apply(c, p), t);
const sg = (n: number) => {
  const r = Math.round(n * 100) / 100 || 0;
  return r < 0 ? `−${-r}` : `${r}`;
};
const polyD = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}`).join("") + "Z";

/** A heart outline around c, about 2r wide (in ঘর). */
const heartPts = (c: XY, r = 0.3): XY[] =>
  Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * 2 * Math.PI;
    const x = 16 * Math.sin(a) ** 3;
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    return [c[0] + (x * r) / 16, c[1] + ((y + 2.5) * r) / 16] as XY;
  });

/** The part of a polygon below the level y = L. */
const clipBelow = (poly: readonly XY[], L: number): XY[] => {
  const out: XY[] = [];
  for (let i = 0; i < poly.length; i += 1) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const pin = p[1] <= L;
    const qin = q[1] <= L;
    if (pin) out.push(p);
    if (pin !== qin) {
      const t = (L - p[1]) / (q[1] - p[1]);
      out.push([p[0] + (q[0] - p[0]) * t, L]);
    }
  }
  return out;
};
/**
 * How high (0…1 of its height) paint stands in a patch after `cans` কৌটা,
 * one কৌটা = one ঘর: the level where the area below it is `cans`.
 */
const fracFor = (poly: readonly XY[], cans: number) => {
  const ys = poly.map((p) => p[1]);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  if (cans <= 0) return 0;
  if (cans >= polyArea(poly) - 1e-9) return 1;
  let lo = y0;
  let hi = y1;
  for (let i = 0; i < 32; i += 1) {
    const mid = (lo + hi) / 2;
    const a = clipBelow(poly, mid);
    if ((a.length >= 3 ? polyArea(a) : 0) < cans) lo = mid;
    else hi = mid;
  }
  return (hi - y0) / (y1 - y0);
};

// ---------------------------------------------------------------------------
// Pieces.

/** The wall frame for most screens: the nail at (0, 0), x −1…8.5, y −1…7.5. */
const WF = makeFrame(-1, 8.5, -1, 7.5, 24, 6); // 240 × 216

/**
 * The নানাবাড়ির দেয়াল (light-kit's WallBed and Post) with Rina's chalk grid,
 * as a Plane (fixed ink). `children` are clipped to the wall; `over` is drawn
 * on top unclipped (arrows, so their tapped lists aren't cut).
 */
function KWall({ f = WF, label, className = "max-w-[15rem]", drag, onKey, children, over }: { f?: Frame; label: string; className?: string; drag?: Drag; onKey?: (e: KeyboardEvent<SVGSVGElement>) => void; children?: ReactNode; over?: ReactNode }) {
  const id = `kw${Math.round(f.W)}x${Math.round(f.H)}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  let d = "";
  for (let x = Math.ceil(f.x0); x <= f.x1; x += 1) d += `M${f.sx(x)} 0V${f.H}`;
  for (let y = Math.ceil(f.y0); y <= f.y1; y += 1) d += `M0 ${f.sy(y)}H${f.W}`;
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} drag={drag} onKey={onKey} className={`my-0! ${className}`}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <WallBed f={f} />
        <path d={d} strokeWidth={0.7} stroke={PK.chalk} strokeOpacity={0.3} fill="none" className="pointer-events-none" />
        <Post f={f} />
        {children}
      </g>
      {over}
    </Plane>
  );
}

/**
 * Rina's stencil card (a piece of cereal box), as a Plane: a pencil grid in
 * ঘর and the pin at (0, 0), where the card sits on the machine's nail.
 */
function KCard({ f, label, className = "max-w-[12rem]", drag, onKey, children }: { f: Frame; label: string; className?: string; drag?: Drag; onKey?: (e: KeyboardEvent<SVGSVGElement>) => void; children?: ReactNode }) {
  const id = `kc${Math.round(f.W)}x${Math.round(f.H)}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  let d = "";
  for (let x = Math.ceil(f.x0); x <= f.x1; x += 1) d += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  for (let y = Math.ceil(f.y0); y <= f.y1; y += 1) d += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} drag={drag} onKey={onKey} className={`my-0! ${className}`}>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={f.W} height={f.H} rx={5} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={f.W} height={f.H} rx={5} fill="#fffdf7" stroke="#d6d3d1" strokeWidth={1} />
      <path d={d} strokeWidth={0.7} stroke={PK.chalk} strokeOpacity={0.32} fill="none" className="pointer-events-none" />
      <g clipPath={`url(#${id})`}>{children}</g>
      <circle cx={f.sx(0)} cy={f.sy(0)} r={2.6} fill="#e5e7eb" stroke={INK} strokeWidth={0.9} className="pointer-events-none" />
    </Plane>
  );
}

/** Rina's chalk cross on the wall at `at`; `name` writes a small word by it. */
function ChalkCross({ f, at, name, faint = false }: { f: Frame; at: XY; name?: string; faint?: boolean }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  const s = Math.max(3.5, f.u * 0.24);
  const d = `M${x - s} ${y - s}L${x + s} ${y + s}M${x + s} ${y - s}L${x - s} ${y + s}`;
  return (
    <g className="pointer-events-none" opacity={faint ? 0.5 : 1}>
      <path d={d} stroke="#57534e" strokeWidth={3.4} strokeLinecap="round" opacity={0.35} />
      <path d={d} stroke={CHALK} strokeWidth={2} strokeLinecap="round" />
      {name && (
        <text x={x + s + 3} y={y - s - 1} fontSize={Math.max(8, f.u * 0.36)} fontWeight={800} fontFamily={/[ঀ-৿]/.test(name) ? undefined : MONO} fill={INK} stroke="white" strokeWidth={2.2} paintOrder="stroke">
          {name}
        </text>
      )}
    </g>
  );
}

/**
 * A heart: "hole" (cut in the card: a dashed pink outline), "light" (the
 * machine's light: yellow glow, pink edge), "paint" (Rina's red), or "pick"
 * (a sealed guess: solid pink).
 */
function HeartShape({ f, pts, look }: { f: Frame; pts: readonly XY[]; look: "hole" | "light" | "paint" | "pick" }) {
  const d = polyD(f, pts);
  if (look === "hole") return <path d={d} fill="white" stroke={PINK} strokeWidth={1.3} strokeDasharray="3 2" className="pointer-events-none" />;
  if (look === "pick") return <path d={d} fill={PINK} fillOpacity={0.9} stroke={PINK_DARK} strokeWidth={1.2} className="pointer-events-none" />;
  if (look === "paint") return <path d={d} fill={RED} fillOpacity={0.9} stroke="#7f1d1d" strokeWidth={1} className="pointer-events-none" />;
  return (
    <g className="pointer-events-none">
      <path d={d} fill={PK.glow} fillOpacity={0.45} stroke={PK.glow} strokeOpacity={0.6} strokeWidth={6} strokeLinejoin="round" />
      <path d={d} fill={PINK} fillOpacity={0.75} stroke={PINK_DARK} strokeWidth={1.1} strokeLinejoin="round" />
    </g>
  );
}

/** A patch of light (or its dashed outline) with sides a and b from the nail. */
function PatchLight({ f, a, b, ghost = false, tone = "light" }: { f: Frame; a: XY; b: XY; ghost?: boolean; tone?: "light" | "blue" }) {
  const d = polyD(f, para(a, b));
  if (ghost) return <path d={d} fill="none" stroke={tone === "blue" ? BLUE : PK.lamp} strokeWidth={1.4} strokeDasharray="4 3" className="pointer-events-none" />;
  return (
    <g className="pointer-events-none">
      <path d={d} fill={PK.glow} fillOpacity={0.3} stroke={PK.glow} strokeOpacity={0.5} strokeWidth={5} strokeLinejoin="round" />
      <path d={d} fill={PK.glow} fillOpacity={0.6} stroke={PK.lamp} strokeWidth={1.2} strokeLinejoin="round" />
    </g>
  );
}

/** The card's pencil grid (x 0…nx, y 0…ny) thrown partway by a lens: t = 0 the card, 1 on the wall. */
function ThrownGrid({ f, c, t, nx = 3, ny = 2 }: { f: Frame; c: Cols; t: number; nx?: number; ny?: number }) {
  let d = "";
  const m = (p: XY) => throwAt(c, p, t);
  for (let x = 0; x <= nx; x += 1) {
    const a = m([x, 0]);
    const b = m([x, ny]);
    d += `M${f.sx(a[0])} ${f.sy(a[1])}L${f.sx(b[0])} ${f.sy(b[1])}`;
  }
  for (let y = 0; y <= ny; y += 1) {
    const a = m([0, y]);
    const b = m([nx, y]);
    d += `M${f.sx(a[0])} ${f.sy(a[1])}L${f.sx(b[0])} ${f.sy(b[1])}`;
  }
  const edge = polyD(f, [m([0, 0]), m([nx, 0]), m([nx, ny]), m([0, ny])]);
  return (
    <g className="pointer-events-none">
      <path d={edge} fill="#fffdf7" fillOpacity={0.55 * (1 - t)} stroke="#a8a29e" strokeOpacity={0.8 - 0.5 * t} strokeWidth={1} />
      <path d={d} stroke={PK.lamp} strokeOpacity={0.35 + 0.35 * t} strokeWidth={0.9} fill="none" />
    </g>
  );
}

/**
 * Paint poured into a patch, standing `frac` (0…1) of its height (a CSS
 * transition on the level), like patch-kit's PaintFill but in two tones:
 * "orange" (Rina's paint) and "blue" (the second patch, so the two read apart).
 */
function Pour({ f, poly, frac, tone = "orange" }: { f: Frame; poly: readonly XY[]; frac: number; tone?: "orange" | "blue" }) {
  const id = `po${Math.round(f.W)}${poly.map((p) => `${Math.round(p[0] * 10)}_${Math.round(p[1] * 10)}`).join("").replace(/-/g, "m")}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ys = poly.map((p) => f.sy(p[1]));
  const xs = poly.map((p) => f.sx(p[0]));
  const top = Math.min(...ys);
  const bot = Math.max(...ys);
  const h = (bot - top) * Math.max(0, Math.min(1, frac));
  const d = polyD(f, poly);
  const [fill, edge] = tone === "blue" ? ["#3b82f6", "#1e40af"] : [PK.paint, PK.paintDark];
  return (
    <g className="pointer-events-none">
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={Math.min(...xs)} y={bot - h} width={Math.max(...xs) - Math.min(...xs)} height={h} fill={fill} fillOpacity={0.8} className="transition-[y,height] duration-300 ease-out motion-reduce:transition-none" />
      </g>
      <path d={d} fill="none" stroke={edge} strokeWidth={1.2} strokeDasharray={frac < 1 ? "4 3" : undefined} strokeLinejoin="round" />
    </g>
  );
}

/** A row of n কৌটা; with `per` they sit in bundles of `per` (the det), each bundle boxed. */
function Cans({ n, per = 0, size = 14, bad = false }: { n: number; per?: number; size?: number; bad?: boolean }) {
  if (!per)
    return (
      <span className="inline-flex flex-wrap items-end gap-0.5">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className={POP}>
            <Kouta size={size} bad={bad} />
          </span>
        ))}
      </span>
    );
  const groups = Math.ceil(n / per);
  return (
    <span className="inline-flex flex-wrap items-end gap-1">
      {Array.from({ length: groups }, (_, g) => (
        <span key={g} className={`inline-flex items-end gap-0.5 rounded-md border-2 border-cat-blue/60 px-0.5 py-0.5 ${POP}`}>
          {Array.from({ length: Math.min(per, n - g * per) }, (_, i) => (
            <Kouta key={i} size={size} bad={bad} />
          ))}
        </span>
      ))}
    </span>
  );
}

/** A 2 × 2 as its columns, amber and teal; a column that is b shows blue. */
function Mat({ cols, blue = -1, small = false }: { cols: readonly XY[]; blue?: number; small?: boolean }) {
  const cell = small ? "w-5 text-xs leading-4" : "w-6 text-sm leading-5";
  return (
    <span className="inline-flex shrink-0 items-stretch align-middle font-mono font-bold">
      <span className="w-1 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
      {[0, 1].map((c) => (
        <span key={c} className={`flex flex-col items-center px-0.5 ${c === blue ? "text-cat-blue" : c ? "text-cat-teal" : "text-cat-amber"}`}>
          {[0, 1].map((r) => (
            <span key={`${r}${cols[c][r]}`} className={`${cell} text-center ${c === blue ? POP : ""}`}>
              {sg(cols[c][r])}
            </span>
          ))}
        </span>
      ))}
      <span className="w-1 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
    </span>
  );
}

/** a drawn tick or cross (no glyphs) */
function Mark({ ok, size = 14 }: { ok: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} aria-hidden="true" className="shrink-0">
      <circle cx={7} cy={7} r={6.5} fill={ok ? TEAL : PK.bad} />
      {ok ? <path d="M3.8 7.2l2.2 2.2l4.2 -4.6" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M4.6 4.6l4.8 4.8M9.4 4.6l-4.8 4.8" stroke="white" strokeWidth={1.8} strokeLinecap="round" />}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Four spots on Rina's card: (1, 2); Karim's (5, 4),
//     where the cross is on the wall; (2, 1); Nasib's half, (2.5, 2).
//     Sealing acts it out: the picked heart is cut (pink), a "?" hangs by
//     it. Never judged here.

const CF = makeFrame(-0.5, 5.5, -0.5, 4.5, 30, 6); // 192 × 162
const X1_SPOTS: { at: XY; who: string; line: string }[] = [
  { at: [1, 2], who: "", line: "উপরে দুই, ডানে এক" },
  { at: [5, 4], who: "করিম", line: "দেয়ালে যেখানে, card এও সেখানে" },
  { at: [2, 1], who: "", line: "ডানে দুই, উপরে এক" },
  { at: [2.5, 2], who: "নাসিব", line: "lens এ 2, তাই অর্ধেক" },
];
const LETTER = ["A", "B", "C", "D"];

export function StencilBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(420);
  const k = !sealed ? 0 : act.running ? act.k : 3;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(3, () => pass("বাজি সিল হলো। আগে একটা ঠিকানা মাপি।"));
  };
  return (
    <>
      <div className="flex justify-center">
        <KCard f={CF} label="রিনার stencil card: চারটা জায়গায় heart আঁকার দাগ, A থেকে D" className="max-w-[12rem]">
          {X1_SPOTS.map((s, i) => {
            const picked = bet === i;
            return (
              <g key={i}>
                <HeartShape f={CF} pts={heartPts(s.at, 0.3)} look={picked && k >= 1 ? "pick" : "hole"} />
                {picked && <circle cx={CF.sx(s.at[0])} cy={CF.sy(s.at[1])} r={CF.u * 0.55} fill="none" stroke={BLUE} strokeWidth={1.6} className={POP} />}
                <text x={CF.sx(s.at[0]) - CF.u * 0.6} y={CF.sy(s.at[1]) - CF.u * 0.42} textAnchor="end" fontSize={10} fontWeight={800} fontFamily={MONO} fill={picked ? BLUE : INK} fillOpacity={picked ? 1 : 0.6}>
                  {LETTER[i]}
                </text>
                {picked && k >= 2 && (
                  <text x={CF.sx(s.at[0]) + CF.u * 0.45} y={CF.sy(s.at[1]) - CF.u * 0.2} fontSize={20} fontWeight={800} fill={BLUE} className={POP}>
                    ?
                  </text>
                )}
              </g>
            );
          })}
        </KCard>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_SPOTS.map((s, i) => (
          <Choice key={i} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex flex-col gap-0.5 text-sm leading-tight">
              <span className="flex items-center gap-1.5 font-mono font-semibold">
                <Tup v={s.at} of={SPOT_SLOTS} />
                {s.who && <span className="font-sans">{s.who}</span>}
              </span>
              <span className="text-xs text-muted">{s.line}</span>
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={bet === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 3}>Card এর কোন heart এর আলো ক্রসে পড়বে? একটা বেছে নিয়ে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · A coordinate is an area. On the card, drag the spot x. The patch of e₁
//     and x (yellow) leans as x slides sideways, a dashed straight ঘর-stack
//     beside it, and its count stays x₂; lift x and the count follows. Then
//     the patch of x and e₂: its count is x₁. Both tabs done → pass.

const F2 = makeFrame(-0.5, 5.5, -0.5, 4.5, 30, 6); // 192 × 162
const X2_KEY = (p: XY) => `${p[0]},${p[1]}`;
/** has the reader slid x sideways at one height, and lifted it to another? */
const x2Done = (seen: readonly string[], mode: number) => {
  const pts = seen.map((s) => s.split(",").map(Number) as XY);
  const h = (p: XY) => (mode === 0 ? p[1] : p[0]);
  const o = (p: XY) => (mode === 0 ? p[0] : p[1]);
  const slid = pts.some((p) => h(p) > 0 && pts.some((q) => h(q) === h(p) && o(q) !== o(p)));
  const lifted = new Set(pts.map(h).filter((v) => v > 0)).size >= 2;
  return slid && lifted;
};

export function CoordIsArea() {
  const pass = useGate();
  const [mode, setMode] = useSeed("mode", 0);
  const [x, setX] = useSeed<XY>("x", [3, 2]);
  const [seen, setSeen] = useSeed<string[][]>("seen", [[], []]);
  const [shown, setShown] = useState(false);
  const tw = useTween([x[0], x[1]], 220);
  const tx: XY = [tw[0], tw[1]];
  const done = [x2Done(seen[0], 0), x2Done(seen[1], 1)];
  const put = (p: XY) => {
    const q: XY = [Math.max(0, Math.min(4, Math.round(p[0]))), Math.max(0, Math.min(3, Math.round(p[1])))];
    if (same(q, x)) return;
    setX(q);
    const key = X2_KEY(q);
    if (seen[mode].includes(key)) return;
    const next = seen.map((s, i) => (i === mode ? [...s, key] : s));
    setSeen(next);
    if (!shown && x2Done(next[0], 0) && x2Done(next[1], 1)) {
      setShown(true);
      pass("ঠিকানার প্রত্যেক সংখ্যা একটা জায়গা।");
    }
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const d: Record<string, XY> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    put(add(x, m));
  };
  const side = mode === 0 ? E1 : E2;
  const poly = mode === 0 ? para(E1, tx) : para(tx, E2);
  const n = mode === 0 ? x[1] : x[0];
  const rect: XY[] = mode === 0 ? [[0, 0], [1, 0], [1, x[1]], [0, x[1]]] : [[0, 0], [x[0], 0], [x[0], 1], [0, 1]];
  return (
    <>
      <div className="mb-2 flex justify-center gap-2">
        {["e₁ আর x", "x আর e₂"].map((l, i) => (
          <button key={l} type="button" className={`${pill(mode === i)} font-sans!`} onClick={() => setMode(i)}>
            {l}
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <KCard f={F2} label="card এ বিন্দু x টানুন; e₁ আর x এর হলুদ ছোপ, পাশে dashed সোজা ঘর; ছোপ কত ঘর" className="max-w-[12rem] cursor-pointer touch-none" drag={{ down: put, move: put }} onKey={onKey}>
          <path d={polyD(F2, rect)} fill="none" stroke={BLUE} strokeWidth={1.3} strokeDasharray="4 3" className="pointer-events-none" />
          <path d={polyD(F2, poly)} fill={PK.glow} fillOpacity={0.62} stroke={PK.lamp} strokeWidth={1.3} strokeLinejoin="round" className="pointer-events-none" />
          <Arrow f={F2} from={[0, 0]} to={side} tone={mode === 0 ? "amber" : "teal"} w={2.4} list={false} />
          <Arrow f={F2} from={[0, 0]} to={tx} tone="blue" w={2.4} list={false} />
          <circle cx={F2.sx(tx[0])} cy={F2.sy(tx[1])} r={9} fill={BLUE} fillOpacity={0.18} stroke={BLUE} strokeWidth={1.5} className="pointer-events-none" />
          <text x={F2.sx(tx[0]) + 8} y={F2.sy(tx[1]) - 8} fontSize={11} fontWeight={800} fontFamily={MONO} fill={BLUE} className="pointer-events-none">
            x
          </text>
        </KCard>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
        <span className="font-mono font-semibold text-cat-blue">
          x = <Tup v={x} of={SPOT_SLOTS} />
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-muted">ছোপ</span>
          <span key={n} className={`font-mono text-lg font-bold ${POP}`}>
            {n}
          </span>
          <span className="text-muted">ঘর</span>
        </span>
      </div>
      <div className="text-center text-xs text-muted">{mode === 0 ? "x এর উপরের সংখ্যাটার দিকে দেখুন" : "x এর ডানের সংখ্যাটার দিকে দেখুন"}</div>
      <Ticks
        items={[
          ["e₁ এর সাথে", done[0]],
          ["e₂ এর সাথে", done[1]],
        ]}
      />
      <Task done={done[0] && done[1]}>x টেনে পাশে সরান, উপরে তুলুন। ছোপ কত ঘর, x এর কোন সংখ্যা? দুই tab এই দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · The card thrown. Pick a spot x on the card: the machine throws the card
//     (its pencil grid glides onto the wall), e₁ lands on column 1, x on Gx,
//     and the patch of e₁ and x lands 3 times bigger: its কৌটা pop in, ×3.
//     Two heights tried → pass.

const X3_SPOTS: XY[] = [
  [1, 1],
  [1, 2],
  [2, 2],
];

export function ThrowTheArea() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const [shown, setShown] = useState(false);
  const run = usePlay(45);
  const N = 26;
  const t = pick === null ? 0 : run.running ? run.k / N : 1;
  const x = pick === null ? null : X3_SPOTS[pick];
  const heights = new Set(tried.map((i) => X3_SPOTS[i][1]));
  const choose = (i: number) => {
    setPick(i);
    run.play(N, () => {
      const next = tried.includes(i) ? tried : [...tried, i];
      setTried(next);
      if (!shown && new Set(next.map((j) => X3_SPOTS[j][1])).size >= 2) {
        setShown(true);
        pass("Lens এর পরে সব জায়গা det গুণ।");
      }
    });
  };
  const landed = x !== null && !run.running;
  const e1t = throwAt(G, E1, t);
  const xt = x ? throwAt(G, x, t) : null;
  return (
    <>
      <div className="flex justify-center">
        <KWall
          label="দেয়াল; card এর পেন্সিলের grid যন্ত্র দিয়ে দেয়ালে পড়ে; e₁ আর x এর ছোপ দেয়ালে তিনগুণ"
          over={
            landed && xt ? (
              <>
                <Arrow f={WF} from={[0, 0]} to={C1} tone="amber" w={2.2} />
                <Arrow f={WF} from={[0, 0]} to={xt} tone="blue" w={2.2} />
              </>
            ) : null
          }
        >
          <ThrownGrid f={WF} c={G} t={t} nx={3} ny={2} />
          {xt && <path d={polyD(WF, para(e1t, xt))} fill={PK.glow} fillOpacity={0.62} stroke={PK.lamp} strokeWidth={1.3} strokeLinejoin="round" className="pointer-events-none" />}
          {xt && !landed && <circle cx={WF.sx(xt[0])} cy={WF.sy(xt[1])} r={4} fill={BLUE} className="pointer-events-none" />}
        </KWall>
      </div>
      <div className="mt-1.5 flex min-h-12 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
        {x ? (
          <>
            <span className="text-muted">card এ</span>
            <Cans n={x[1]} />
            <span className="font-mono font-bold">{x[1]}</span>
            <svg viewBox="0 0 16 10" className="h-2.5 w-4 shrink-0 text-muted" aria-hidden="true">
              <path d="M1 5H13M9 1.5L13 5L9 8.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-muted">দেয়ালে</span>
            {landed ? (
              <>
                <Cans key={pick} n={x[1] * DET} per={x[1] > 1 ? DET : 0} />
                <span className={`font-mono font-bold ${POP}`}>{x[1] * DET}</span>
              </>
            ) : (
              <span className="font-mono font-bold text-muted">?</span>
            )}
          </>
        ) : (
          <span className="text-muted">card এর একটা বিন্দু বেছে নিন</span>
        )}
      </div>
      <div className="mt-1 flex justify-center gap-2">
        {X3_SPOTS.map((p, i) => (
          <button key={i} type="button" className={pill(pick === i)} onClick={() => choose(i)}>
            x = ({p[0]}, {p[1]})
          </button>
        ))}
      </div>
      <Ticks
        items={[
          ["উচ্চতা 1", heights.has(1)],
          ["উচ্চতা 2", heights.has(2)],
        ]}
      />
      <Task done={heights.size >= 2}>একটা বিন্দু বেছে নিয়ে যন্ত্রে দিন। ছোপ card এ কত ঘর, দেয়ালে কত? দুইটা উচ্চতা দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Predict, then pour. The wall's patch of column 1 and the cross b:
//     guess how many কৌটা (5 · 3 · 9), then the paint rises one কৌটা at a
//     time: 3. Then the patch of b and column 2: 6. Then bundle the কৌটা by
//     det 3: one bundle, two bundles; the spot on a small card climbs 1 and
//     walks 2. → (2, 1).

const X4_A = para(C1, B); // 3 ঘর
const X4_B = para(B, C2); // 6 ঘর
const X4_GUESS = [5, 3, 9];
const X4_RIGHT = 1;
const X4_WHY = ["b এর প্রথম সংখ্যা", "", "5 + 4"];
const MF = makeFrame(-0.3, 4.6, -0.3, 2.3, 22, 4); // 116 × 65

export function CountKouta() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [stage, setStage] = useSeed("stage", 0);
  const run = usePlay(420);
  const canA = stage === 0 ? (guess === null ? 0 : run.running ? run.k : 3) : 3;
  const canB = stage < 2 ? 0 : stage === 2 ? (run.running ? run.k : 6) : 6;
  const g = stage < 4 ? 0 : stage === 4 ? (run.running ? run.k : 4) : 4;
  const choose = (i: number) => {
    if (guess !== null) return;
    setGuess(i);
    run.play(3, () => setStage(1));
  };
  const pourB = () => {
    setStage(2);
    run.play(6, () => setStage(3));
  };
  const bundle = () => {
    setStage(4);
    run.play(4, () => {
      setStage(5);
      pass("কৌটা ÷ det = card এর ঠিকানা।");
    });
  };
  const dot: XY = g >= 4 ? [2, 1] : g >= 2 ? [0, 1] : [0, 0];
  const tw = useTween([dot[0], dot[1]], 600);
  return (
    <>
      <div className="flex justify-center">
        <KWall
          label="দেয়ালে ক্রস b; column 1 আর b এর ছোপ, b আর column 2 এর ছোপ; কৌটা কৌটা করে রং উঠছে"
          over={
            <>
              <Arrow f={WF} from={[0, 0]} to={C1} tone="amber" w={2.2} />
              <Arrow f={WF} from={[0, 0]} to={B} tone="blue" w={2.2} />
              {stage >= 2 && <Arrow f={WF} from={[0, 0]} to={C2} tone="teal" w={2.2} />}
            </>
          }
        >
          <PatchLight f={WF} a={C1} b={B} ghost />
          {guess !== null && <Pour f={WF} poly={X4_A} frac={fracFor(X4_A, canA)} />}
          {stage >= 2 && <PatchLight f={WF} a={B} b={C2} ghost tone="blue" />}
          {stage >= 2 && <Pour f={WF} poly={X4_B} frac={fracFor(X4_B, canB)} tone="blue" />}
          <ChalkCross f={WF} at={B} name="b" />
        </KWall>
      </div>
      {stage < 4 ? (
        <div className="mt-1.5 flex flex-col items-center gap-1 text-sm">
          <div className="flex min-h-6 items-center gap-1.5">
            <span className="text-cat-amber">column 1</span>
            <span className="text-muted">আর</span>
            <span className="text-cat-blue">b</span>
            <Cans n={canA} />
            <span className="font-mono font-bold">{guess === null ? "?" : canA}</span>
          </div>
          {stage >= 2 && (
            <div className={`flex min-h-6 items-center gap-1.5 ${FADE}`}>
              <span className="text-cat-blue">b</span>
              <span className="text-muted">আর</span>
              <span className="text-cat-teal">column 2</span>
              <Cans n={canB} />
              <span className="font-mono font-bold">{canB}</span>
            </div>
          )}
        </div>
      ) : (
        <div className={`mt-1.5 flex items-center justify-center gap-3 ${FADE}`}>
          <div className="flex flex-col items-start gap-1 text-xs">
            <div className="flex items-center gap-1.5">
              <Cans n={3} per={g >= 1 ? DET : 0} size={12} />
              {g >= 1 && <span className={`font-semibold text-cat-blue ${POP}`}>1 ভাগ: উপরে 1</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <Cans n={6} per={g >= 3 ? DET : 0} size={12} />
              {g >= 3 && <span className={`font-semibold text-cat-blue ${POP}`}>2 ভাগ: ডানে 2</span>}
            </div>
          </div>
          <svg viewBox={`0 0 ${MF.W} ${MF.H}`} width={MF.W} height={MF.H} role="img" aria-label="ছোট card: বিন্দু উপরে 1, তারপর ডানে 2" className="shrink-0">
            <rect x={0} y={0} width={MF.W} height={MF.H} rx={4} fill="#fffdf7" stroke="#d6d3d1" />
            {[0, 1, 2, 3, 4].map((i) => (
              <path key={`v${i}`} d={`M${MF.sx(i)} ${MF.sy(-0.3)}V${MF.sy(2.3)}`} stroke={PK.chalk} strokeOpacity={0.3} strokeWidth={0.6} />
            ))}
            {[0, 1, 2].map((i) => (
              <path key={`h${i}`} d={`M${MF.sx(-0.3)} ${MF.sy(i)}H${MF.sx(4.6)}`} stroke={PK.chalk} strokeOpacity={0.3} strokeWidth={0.6} />
            ))}
            {g >= 2 && <path d={`M${MF.sx(0)} ${MF.sy(0)}V${MF.sy(1)}`} stroke={BLUE} strokeWidth={2} className={FADE} />}
            {g >= 4 && <path d={`M${MF.sx(0)} ${MF.sy(1)}H${MF.sx(2)}`} stroke={BLUE} strokeWidth={2} className={FADE} />}
            <circle cx={MF.sx(tw[0])} cy={MF.sy(tw[1])} r={4.5} fill={BLUE} />
            {g >= 4 && (
              <text x={MF.sx(2) + 6} y={MF.sy(1) - 5} fontSize={9} fontWeight={800} fontFamily={MONO} fill={BLUE} className={POP}>
                (2, 1)
              </text>
            )}
          </svg>
        </div>
      )}
      {stage === 0 && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {X4_GUESS.map((v, i) => (
            <Choice key={v} n={i} look={predictLook(i, guess, guess !== null && !run.running, X4_RIGHT)} disabled={guess !== null} onClick={() => choose(i)}>
              <span className="flex flex-col leading-tight">
                <span className="font-mono text-base font-bold">{v}</span>
                {X4_WHY[i] && <span className="text-[0.7rem] text-muted">{X4_WHY[i]}</span>}
              </span>
            </Choice>
          ))}
        </div>
      )}
      {stage === 1 && (
        <div className={`mt-2 flex flex-col items-center gap-1.5 ${FADE}`}>
          <div className="text-sm">
            {guess === X4_RIGHT ? <span className="font-semibold text-accent-text">ঠিক ধরেছেন: 3 কৌটা।</span> : <span className="text-danger">3 কৌটাতেই ভরে গেলো, {X4_GUESS[guess ?? 0]} না।</span>}
          </div>
          <button type="button" className={quietBtn} onClick={pourB}>
            b আর column 2 এর ছোপে ঢালুন
          </button>
        </div>
      )}
      {stage === 3 && (
        <div className={`mt-2 flex justify-center ${FADE}`}>
          <button type="button" className={primaryBtn} onClick={bundle}>
            3 কৌটা করে ভাগ করুন
          </button>
        </div>
      )}
      <Task done={stage >= 5}>আগে guess: column 1 আর b এর ছোপে কত কৌটা? তারপর দুই ছোপে ঢালুন, 3 কৌটা করে ভাগ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The patches as matrices. G's own patch (3 ঘর, the det) sits faint. Tap
//     to put b in column 1's place or column 2's: that column's arrow glides
//     onto b, the patch follows, the matrix's column turns blue (5, 4), and
//     ad − bc gives the কৌটা, 6 or 3. Both slots → pass.

export function SwapColumn() {
  const pass = useGate();
  const [slot, setSlot] = useSeed<number | null>("slot", null);
  const [seen, setSeen] = useSeed<boolean[]>("seen", [false, false]);
  const [shown, setShown] = useState(false);
  const target: XY[] = slot === 0 ? [B, C2] : slot === 1 ? [C1, B] : [C1, C2];
  const tw = useTween([target[0][0], target[0][1], target[1][0], target[1][1]], 800);
  const a: XY = [tw[0], tw[1]];
  const b: XY = [tw[2], tw[3]];
  const still = same(a, target[0]) && same(b, target[1]);
  const put = (i: number) => {
    setSlot(i);
    const next = seen.map((s, j) => s || j === i);
    setSeen(next);
    if (!shown && next[0] && next[1]) {
      setShown(true);
      pass("যেই সংখ্যা চাই, সেই column এ b বসাও।");
    }
  };
  const d = cross2(target[0], target[1]);
  const which = slot === 0 ? "x₁, ডানের সংখ্যা" : "x₂, উপরের সংখ্যা";
  return (
    <>
      <div className="flex justify-center">
        <KWall
          label="দেয়াল; G এর নিজের ছোপ হালকা; এক column এর জায়গায় b বসালে ছোপ বদলায়"
          over={
            still ? (
              <>
                <Arrow f={WF} from={[0, 0]} to={a} tone={slot === 0 ? "blue" : "amber"} w={2.2} />
                <Arrow f={WF} from={[0, 0]} to={b} tone={slot === 1 ? "blue" : "teal"} w={2.2} />
              </>
            ) : null
          }
        >
          <PatchLight f={WF} a={C1} b={C2} ghost />
          {slot !== null && <path d={polyD(WF, para(a, b))} fill={PK.paint} fillOpacity={0.55} stroke={PK.paintDark} strokeWidth={1.2} strokeLinejoin="round" className="pointer-events-none" />}
          {slot === null && <PatchLight f={WF} a={C1} b={C2} />}
          <ChalkCross f={WF} at={B} name="b" />
        </KWall>
      </div>
      <div className="mt-2 flex min-h-14 items-center justify-center gap-3 text-sm">
        <Mat cols={target} blue={slot ?? -1} />
        {slot === null ? (
          <span className="text-muted">
            G: ad − bc = <span className="font-mono font-bold text-foreground">{DET}</span>, মানে 3 কৌটা
          </span>
        ) : still ? (
          <span key={slot} className={`flex flex-col gap-0.5 ${FADE}`}>
            <span>
              ad − bc = <span className="font-mono font-bold">{d}</span> <Cans n={d} size={11} />
            </span>
            <span className="text-muted">
              ÷ 3 = <span className="font-mono font-bold text-cat-blue">{d / DET}</span>, {which}
            </span>
          </span>
        ) : (
          <span className="text-muted">…</span>
        )}
      </div>
      <div className="mt-1 flex justify-center gap-2">
        {["column 1 এর জায়গায় b", "column 2 এর জায়গায় b"].map((l, i) => (
          <button key={l} type="button" className={`${pill(slot === i)} px-2.5! font-sans! text-xs!`} onClick={() => put(i)}>
            {l}
          </button>
        ))}
      </div>
      <Ticks
        items={[
          ["column 1 এ b", seen[0]],
          ["column 2 এ b", seen[1]],
        ]}
      />
      <Task done={seen[0] && seen[1]}>G এর এক column এর জায়গায় b বসান। দেয়ালে কোন ছোপ আসে, ad − bc কত? দুইটাই দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The heart lands. Rina's heart is cut at (2, 1) on the card, which sits
//     at the nail. Run the machine: the card's grid glides onto the wall
//     through G, the heart slants and grows and lands on the cross.

export function HeartLands() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const run = usePlay(45);
  const N = 28;
  const t = !ran ? 0 : run.running ? run.k / N : 1;
  const go = () => {
    setRan(true);
    run.play(N, () => pass("দরজার উপরে।"));
  };
  const landed = ran && !run.running;
  const heart = heartPts(X_DOOR, 0.32).map((p) => throwAt(G, p, t));
  return (
    <>
      <div className="flex justify-center">
        <KWall label="card এর (2, 1) এ কাটা heart; যন্ত্র চালালে card এর grid দেয়ালে পড়ে, heart গিয়ে পড়ে দরজার উপরের ক্রসে">
          <ThrownGrid f={WF} c={G} t={t} nx={3} ny={2} />
          <ChalkCross f={WF} at={B} name="b" />
          <HeartShape f={WF} pts={heart} look={t > 0 ? "light" : "hole"} />
          {landed && <circle cx={WF.sx(B[0])} cy={WF.sy(B[1])} r={WF.u * 1.3} fill="none" stroke={TEAL} strokeWidth={2} className={POP} />}
        </KWall>
      </div>
      <div className="mt-2 flex min-h-8 items-center justify-center gap-1.5 text-sm">
        {landed ? (
          <span className={`flex items-center gap-1.5 ${POP}`}>
            <Mark ok />
            <span className="font-semibold text-accent-text">ক্রসের উপরে</span>
            <span className="text-muted">
              · card এর <Tup v={X_DOOR} of={SPOT_SLOTS} /> → দেয়ালের <Tup v={B} of={SPOT_SLOTS} />
            </span>
          </span>
        ) : (
          <span className="text-muted">
            heart কাটা card এর <Tup v={X_DOOR} of={SPOT_SLOTS} /> এ
          </span>
        )}
      </div>
      <div className="mt-1 flex justify-center">
        <button type="button" className={primaryBtn} disabled={run.running} onClick={go}>
          {ran ? "আবার চালান" : "যন্ত্র চালান"}
        </button>
      </div>
      <Task done={landed}>যন্ত্র চালান। Heart কোথায় পড়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn. Karim's cross at (4, 5). Two patches to pour (each shows
//     its কৌটা), two steppers for the heart on the card, and the machine.
//     A wrong spot throws the heart elsewhere, and the Nope says where.

const X7_A = para(C1, B7); // 6
const X7_B = para(B7, C2); // 3

export function YourKouta() {
  const pass = useGate();
  const [poured, setPoured] = useSeed<boolean[]>("poured", [false, false]);
  const [spot, setSpot] = useSeed<XY>("spot", [0, 0]);
  const [shot, setShot] = useSeed<XY | null>("shot", null);
  const [miss, setMiss] = useState(0);
  const pour = usePlay(380);
  const [pouring, setPouring] = useState(-1);
  const run = usePlay(45);
  const N = 28;
  const t = shot === null ? 0 : run.running ? run.k / N : 1;
  const pourIt = (i: number) => {
    if (pour.running) return;
    setPouring(i);
    pour.play(i === 0 ? 6 : 3, () => {
      setPoured(poured.map((p, j) => p || j === i));
      setPouring(-1);
    });
  };
  const cans = (i: number) => (pouring === i ? pour.k : poured[i] ? (i === 0 ? 6 : 3) : 0);
  const go = () => {
    const s: XY = [spot[0], spot[1]];
    setShot(s);
    run.play(N, () => {
      if (same(s, X7)) pass("করিমের heart: (1, 2)।");
      else setMiss((m) => m + 1);
    });
  };
  const move = (p: XY) => {
    setSpot(p);
    setShot(null);
  };
  const landedAt = shot ? apply(G, shot) : null;
  const settled = shot !== null && !run.running;
  const right = settled && shot !== null && same(shot, X7);
  const heart = heartPts(shot ?? spot, 0.3).map((p) => throwAt(G, p, t));
  const nope = (() => {
    if (!settled || right || !shot || !landedAt) return null;
    if (same(shot, [2, 1])) return "Heart পড়লো দরজার ক্রসে, (5, 4)। দুই সংখ্যা উল্টে গেছে: b আর column 2 এর ছোপ দেয় ডানের সংখ্যা।";
    if (landedAt[0] > WF.x1 || landedAt[1] > WF.y1) return `Heart দেয়াল ছাড়িয়ে গেলো, (${landedAt[0]}, ${landedAt[1]}) এ। কৌটা গুলো 3 করে ভাগ হয়েছে?`;
    return `Heart পড়লো (${landedAt[0]}, ${landedAt[1]}) এ, ক্রস (4, 5) এ। কোন ছোপ কোন সংখ্যা দেয়?`;
  })();
  return (
    <>
      <div className="flex justify-center">
        <KWall
          className="max-w-[14rem]"
          label="দেয়ালে করিমের ক্রস (4, 5); দুইটা ছোপ; card এর heart যন্ত্র দিয়ে দেয়ালে"
          over={
            <>
              <Arrow f={WF} from={[0, 0]} to={C1} tone="amber" w={2} />
              <Arrow f={WF} from={[0, 0]} to={C2} tone="teal" w={2} />
              <Arrow f={WF} from={[0, 0]} to={B7} tone="blue" w={2} />
            </>
          }
        >
          {(poured[0] || pouring === 0) && <Pour f={WF} poly={X7_A} frac={fracFor(X7_A, cans(0))} />}
          {(poured[1] || pouring === 1) && <Pour f={WF} poly={X7_B} frac={fracFor(X7_B, cans(1))} tone="blue" />}
          {(shot === null || run.running) && <ThrownGrid f={WF} c={G} t={t} nx={3} ny={2} />}
          <ChalkCross f={WF} at={B7} name="করিম" />
          <HeartShape f={WF} pts={heart} look={t > 0 ? "light" : "hole"} />
        </KWall>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {[0, 1].map((i) => (
          <button
            key={i}
            type="button"
            disabled={pour.running || poured[i]}
            onClick={() => pourIt(i)}
            className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-1 transition-colors disabled:cursor-default motion-reduce:transition-none ${poured[i] ? "border-border" : "border-cat-blue/60 hover:bg-cat-blue/10"}`}
          >
            <span className="text-xs font-semibold">{i === 0 ? "column 1 আর b" : "b আর column 2"}</span>
            <span className="flex min-h-5 items-center gap-1">
              {poured[i] || pouring === i ? <Cans n={cans(i)} size={11} /> : <span className="text-xs text-muted">ঢালুন</span>}
              {(poured[i] || pouring === i) && <span className="font-mono text-sm font-bold">{cans(i)}</span>}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          ডানে
          <Stepper value={spot[0]} min={0} max={6} label="card এ ডানে" onChange={(v) => move([v, spot[1]])} disabled={run.running} />
        </span>
        <span className="flex items-center gap-1">
          উপরে
          <Stepper value={spot[1]} min={0} max={6} label="card এ উপরে" onChange={(v) => move([spot[0], v])} disabled={run.running} />
        </span>
      </div>
      <div className="mt-1.5 flex justify-center">
        <button type="button" className={primaryBtn} disabled={run.running || right} onClick={go}>
          যন্ত্র চালান
        </button>
      </div>
      {right && (
        <div className={`mt-1 flex items-center justify-center gap-1.5 text-sm ${POP}`}>
          <Mark ok />
          <span className="font-semibold text-accent-text">করিমের ক্রসে</span>
        </div>
      )}
      {nope && <Nope key={miss}>{nope}</Nope>}
      <Task done={right}>করিমের ক্রসের জন্য card এর ঠিকানা বের করুন। ছোপে কৌটা ঢালুন, heart বসান, যন্ত্র চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it (Check Q3). The লাইট ভাই's next lens K = [[2, 1], [1, −1]],
//     det −3; a cross on the door at (5, 1): 2x + y = 5, x − y = 1; y = 1
//     already. Which matrix's det goes on top for x? Each pick paints its
//     patch (a flipped patch says so), divides by −3, puts the heart at
//     (x, 1) on the card and throws it. Right: (2, 1) → (5, 1).

const TF = makeFrame(-2, 8, -2.5, 4.5, 24, 6); // 252 × 180
const X8_MATS: Cols[] = [
  [
    [2, 1],
    [5, 1],
  ],
  [
    [5, 1],
    [1, -1],
  ],
  [
    [5, 2],
    [1, 1],
  ],
];
const X8_RIGHT = 1;
const X8_NOPE = [
  "Heart পড়লো (3, 0) এ, ক্রসের নিচে বামে। এখানে b বসেছে column 2 এর জায়গায়। এটা y এর হিসাব, x এর না।",
  "",
  "Heart পড়লো (−1, −2) এ, খুঁটির বামে, একেবারে নিচে। এই matrix এ b শুয়ে আছে প্রথম row তে। b বসে একটা column এর জায়গায়, খাড়া হয়ে।",
];

export function TryCramer() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const run = usePlay(45);
  const P = 18;
  const N = 44;
  const k = pick === null ? 0 : run.running ? run.k : N;
  const choose = (i: number) => {
    if (run.running) return;
    setPick(i);
    run.play(N, () => (i === X8_RIGHT ? pass("x চাইলে b বসে column 1 এর জায়গায়।") : setMiss((m) => m + 1)));
  };
  const m = pick === null ? null : X8_MATS[pick];
  const d = m ? cross2(m[0], m[1]) : 0;
  const xv = d / det(K);
  const card: XY = [xv, 1];
  const tt = Math.max(0, Math.min(1, (k - P - 4) / (N - P - 4)));
  const heart = heartPts(card, 0.3).map((p) => throwAt(K, p, tt));
  const settled = pick !== null && !run.running;
  const poly = m ? para(m[0], m[1]) : null;
  return (
    <>
      <div className="flex justify-center">
        <KWall f={TF} label="লাইট ভাইয়ের পরের lens; দরজার গায়ে ক্রস (5, 1); বাছা matrix এর ছোপ রং হয়, তারপর heart যন্ত্র দিয়ে দেয়ালে" className="max-w-[15.75rem]">
          {poly && <PaintFill f={TF} poly={poly} frac={Math.min(1, k / P)} />}
          {m && k >= P && (
            <text x={TF.sx((m[0][0] + m[1][0]) / 2)} y={TF.sy((m[0][1] + m[1][1]) / 2) + 4} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK} stroke="white" strokeWidth={2.4} paintOrder="stroke" className={POP}>
              {sg(d)}
            </text>
          )}
          <ChalkCross f={TF} at={B8} name="(5, 1)" />
          {pick !== null && k > P && <HeartShape f={TF} pts={heart} look="light" />}
        </KWall>
      </div>
      <div className="mt-1.5 flex min-h-6 items-center justify-center gap-1.5 text-sm">
        <span className="text-muted">lens K</span>
        <Mat cols={K} small />
        <span className="text-muted">
          det <span className="font-mono font-bold text-foreground">−3</span>
        </span>
      </div>
      <div className="flex min-h-5 items-center justify-center gap-1.5 text-sm">
        {settled && (
          <span key={pick} className={`flex items-center gap-1 ${FADE}`}>
            <span className="text-muted">ছোপ</span>
            <span className="font-mono">
              {sg(d)} ÷ (−3) = <span className="font-bold">{sg(xv)}</span>
            </span>
            <span className="text-muted">= x</span>
            {d < 0 && <span className="text-xs text-muted">(ছোপ উল্টানো)</span>}
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X8_MATS.map((c, i) => (
          <Choice key={i} n={i} look={settled && pick === i ? (i === X8_RIGHT ? "right" : "wrong") : "idle"} disabled={run.running || (settled && pick === X8_RIGHT)} onClick={() => choose(i)}>
            <Mat cols={c} small blue={i === 0 ? 1 : i === 1 ? 0 : -1} />
          </Choice>
        ))}
      </div>
      {settled && pick !== X8_RIGHT && pick !== null && <Nope key={miss}>{X8_NOPE[pick]}</Nope>}
      <Task done={settled && pick === X8_RIGHT}>x বের করতে উপরে কোন matrix এর det বসবে? একটা বেছে নিন, যন্ত্র চালিয়ে দেখাবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The bet opened. The four card spots from screen 1; tap each: its
//     heart is thrown through G and lands (Karim's flies off the wall to
//     (14, 13)). Only C lands on the cross. All four opened → pass.

export function BetOpen() {
  const pass = useGate();
  const [opened, setOpened] = useSeed<number[]>("opened", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const run = usePlay(45);
  const N = 26;
  const t = cur === null ? 0 : run.running ? run.k / N : 1;
  const open = (i: number) => {
    if (run.running) return;
    setCur(i);
    run.play(N, () => {
      const next = opened.includes(i) ? opened : [...opened, i];
      setOpened(next);
      if (next.length === 4 && opened.length < 4) pass("(2, 1) এ আঁকলেই দরজার উপরে।");
    });
  };
  return (
    <>
      <div className="flex justify-center">
        <KWall label="দেয়ালে দরজার উপরের ক্রস; বাজির চারটা বিন্দুর heart যন্ত্র দিয়ে ফেলা; শুধু C পড়ে ক্রসে">
          <ChalkCross f={WF} at={B} name="b" />
          {opened
            .filter((i) => i !== cur)
            .map((i) => {
              const at = apply(G, X1_SPOTS[i].at);
              if (at[0] > WF.x1)
                return (
                  <g key={i}>
                    <path d={`M${WF.W - 28} 100l18 -16m0 0h-8m8 0v8`} stroke={PINK_DARK} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <text x={WF.W - 6} y={114} textAnchor="end" fontSize={10} fontWeight={800} fontFamily={MONO} fill={INK} stroke="white" strokeWidth={2.2} paintOrder="stroke">
                      {LETTER[i]} (14, 13)
                    </text>
                  </g>
                );
              return (
                <g key={i} opacity={0.75}>
                  <HeartShape f={WF} pts={heartPts(X1_SPOTS[i].at, 0.3).map((p) => apply(G, p))} look={i === 2 ? "light" : "pick"} />
                  <text x={WF.sx(at[0]) + 12} y={WF.sy(at[1]) + 4} fontSize={10} fontWeight={800} fontFamily={MONO} fill={INK} stroke="white" strokeWidth={2.2} paintOrder="stroke">
                    {LETTER[i]}
                  </text>
                </g>
              );
            })}
          {cur !== null && <HeartShape f={WF} pts={heartPts(X1_SPOTS[cur].at, 0.3).map((p) => throwAt(G, p, t))} look={t > 0 ? "light" : "hole"} />}
        </KWall>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_SPOTS.map((s, i) => {
          const at = apply(G, s.at);
          const on = opened.includes(i) && !(cur === i && run.running);
          const hit = same(at, B);
          return (
            <Choice key={i} n={i} look={on ? (hit ? "right" : "wrong") : "idle"} disabled={run.running} onClick={() => open(i)}>
              <span className="flex flex-col gap-0.5 text-sm leading-tight">
                <span className="flex items-center gap-1.5 font-mono font-semibold">
                  <Tup v={s.at} of={SPOT_SLOTS} />
                  {s.who && <span className="font-sans">{s.who}</span>}
                </span>
                {on ? (
                  <span className={`text-xs ${FADE}`}>
                    পড়লো <Tup v={at} of={SPOT_SLOTS} />
                    {at[0] > WF.x1 ? ", দেয়ালের বাইরে" : hit ? ", ক্রসে" : ""}
                  </span>
                ) : (
                  <span className="text-xs text-muted">tap করে চালান</span>
                )}
              </span>
            </Choice>
          );
        })}
      </div>
      <Task done={opened.length === 4}>চারটা বিন্দুই যন্ত্রে দিন। কার heart ক্রসে পড়ে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage bits for the story scenes: the উঠান in the late afternoon. The wall
// is light-kit's StageWall (its top-left at SW); the machine stands at PJ.

const SW: [number, number] = [8, 30];
const PJ: [number, number] = [214, 150];
const onStage = (p: XY): [number, number] => [SW[0] + STAGE_WALL_F.sx(p[0]), SW[1] + STAGE_WALL_F.sy(p[1])];

/** a chalk cross on the stage wall at wall spot p */
function St_Cross({ p, name }: { p: XY; name?: string }) {
  const [x, y] = onStage(p);
  return (
    <g className={`${POP} pointer-events-none`}>
      <path d={`M${x - 3} ${y - 3}l6 6m0 -6l-6 6`} stroke="#57534e" strokeWidth={2.6} strokeLinecap="round" opacity={0.35} />
      <path d={`M${x - 3} ${y - 3}l6 6m0 -6l-6 6`} stroke={CHALK} strokeWidth={1.5} strokeLinecap="round" />
      {name && (
        <text x={x + 5} y={y - 4} fontSize={7} fontWeight={800} fill={INK} stroke="white" strokeWidth={1.8} paintOrder="stroke">
          {name}
        </text>
      )}
    </g>
  );
}

/** a heart on the stage wall at wall spot p: "paint" red, "light" glowing */
function St_Heart({ p, look = "paint", s = 4.5 }: { p: XY; look?: "paint" | "light"; s?: number }) {
  const [x, y] = onStage(p);
  return (
    <g className={`${POP} pointer-events-none`}>
      {look === "light" && <circle cx={x} cy={y} r={s * 2} fill={PK.glow} opacity={0.4} />}
      <path d={heartPath(x, y, s)} fill={look === "paint" ? RED : PINK} stroke={look === "paint" ? "#7f1d1d" : PINK_DARK} strokeWidth={0.7} />
    </g>
  );
}

/** Rina's stencil card, held or standing, centre (x, y); `heart` cuts a small heart in it */
function St_Card({ x, y, w = 22, h = 17, heart = false, tilt = 0 }: { x: number; y: number; w?: number; h?: number; heart?: boolean; tilt?: number }) {
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`} className="pointer-events-none">
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={1.5} fill="#fde68a" stroke="#b45309" strokeWidth={0.8} />
      <path d={`M${x - w / 2 + 3} ${y - h / 2 + 3}h${w - 6}M${x - w / 2 + 3} ${y}h${w - 6}M${x - w / 2 + 7} ${y - h / 2 + 2}v${h - 4}M${x + 1} ${y - h / 2 + 2}v${h - 4}`} stroke="#b45309" strokeOpacity={0.3} strokeWidth={0.5} />
      {heart && <path d={heartPath(x + 3, y + 2, 2.6)} fill="white" stroke={PINK} strokeWidth={0.7} className={POP} />}
    </g>
  );
}

/** Som's খাতা, open, top-left at (x, y) */
function St_Khata({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x} ${y}h14v18h-14Z`} fill="white" stroke="#475569" strokeWidth={0.7} />
      <path d={`M${x + 14} ${y}h14v18h-14Z`} fill="white" stroke="#475569" strokeWidth={0.7} />
      <text x={x + 7} y={y + 8} textAnchor="middle" fontSize={5} fontWeight={700} fontFamily={MONO} fill={BLUE}>
        G⁻¹
      </text>
      <path d={`M${x + 3} ${y + 12}h8M${x + 17} ${y + 5}h8M${x + 17} ${y + 9}h6M${x + 17} ${y + 13}h8`} stroke="#94a3b8" strokeWidth={0.8} />
    </g>
  );
}

/** Samin's phone, top-left at (x, y), with a line of text */
function St_Phone({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y} width={26} height={40} rx={3} fill="#1e293b" />
      <rect x={x + 2} y={y + 4} width={22} height={31} rx={1} fill="#e0f2fe" />
      <text x={x + 13} y={y + 15} textAnchor="middle" fontSize={5.4} fontWeight={700} fontFamily={MONO} fill={INK}>
        ad − bc
      </text>
      <text x={x + 13} y={y + 26} textAnchor="middle" fontSize={7} fontWeight={800} fontFamily={MONO} fill={BLUE} className={POP} key={text}>
        {text}
      </text>
    </g>
  );
}

/** a bamboo ladder leaning on the wall, foot at (x, 150), top at (x2, y2) */
function St_Ladder({ x, x2, y2 }: { x: number; x2: number; y2: number }) {
  const rungs = Array.from({ length: 6 }, (_, i) => (i + 1) / 7);
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 6} 150L${x2 - 6} ${y2}M${x + 6} 150L${x2 + 6} ${y2}`} stroke="#b08d3c" strokeWidth={2} strokeLinecap="round" />
      {rungs.map((r) => (
        <path key={r} d={`M${x - 6 + (x2 - x) * r} ${150 + (y2 - 150) * r}h12`} stroke="#a47a32" strokeWidth={1.3} />
      ))}
    </g>
  );
}

/** the লাইট ভাই's ভ্যান with the machine tied on it, front wheel at (x, 150) */
function St_Van({ x, walking = false }: { x: number; walking?: boolean }) {
  return (
    <g style={{ transform: `translate(${x}px, 0px)` }} className="pointer-events-none transition-transform duration-[1800ms] ease-in-out motion-reduce:transition-none">
      <rect x={-6} y={128} width={56} height={6} fill="#8b5e34" />
      <circle cx={0} cy={144} r={7} fill="none" stroke={INK} strokeWidth={1.6} />
      <circle cx={44} cy={144} r={7} fill="none" stroke={INK} strokeWidth={1.6} />
      <path d="M-6 131l-10 -12h-6" stroke={INK} strokeWidth={1.4} fill="none" />
      <rect x={14} y={112} width={22} height={14} rx={2} fill="#334155" stroke={INK} strokeWidth={0.7} />
      <circle cx={12} cy={119} r={3} fill={walking ? PK.glow : "#a7f3d0"} stroke={INK} strokeWidth={0.6} />
      <path d={`M20 126L30 112M24 126L18 112`} stroke="#b08d3c" strokeWidth={1.4} />
    </g>
  );
}

/** the বাবুর্চি (7.x look): নানা's look and a white cap, his name under his feet */
function St_Baburchi({ x, y = 150, facing = 1, arm = "down" }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point" }) {
  return (
    <>
      <Person who="nana" x={x} y={y} facing={facing} arm={arm} />
      <path d={`M${x - 9} ${y - 57}q9 -11 18 0Z`} fill="white" stroke="#cbd5e1" strokeWidth={0.8} className="pointer-events-none" />
      <text x={x} y={y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#f8fafc" className="pointer-events-none">
        বাবুর্চি
      </text>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1a · Late afternoon. The machine on its bamboo stand; the লাইট ভাই looks at
//      his watch: আধা ঘণ্টা। Rina chalks a cross over the door, (5, 4), the
//      new card in her other hand: Card এর কোথায় আঁকবো?

export function DoorCross({}: Story) {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;
  const [bx] = onStage(B);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="বিকাল; বাঁশের তেপায়ায় যন্ত্র, লেন্সে G; লাইট ভাই ঘড়ি দেখে বললেন আধা ঘণ্টা; রিনা দরজার মাথার উপরে চক দিয়ে ক্রস দিলো; হাতে নতুন card, জিজ্ঞেস করলো card এর কোথায় আঁকবো">
        <StageWall x={SW[0]} y={SW[1]} />
        <Projector x={PJ[0]} y={PJ[1]} lens="good" />
        <LightBhai x={262} y={150} facing={-1} arm={k === 1 ? "hold" : "down"} />
        {k === 1 && <Bubble x={262} y={84} side="left" lines={["আধা ঘণ্টা আছে।"]} />}
        <Person who="rina" x={k >= 2 ? bx - 22 : 176} y={150} facing={k >= 2 ? 1 : -1} arm={k >= 2 ? "point" : "hold"} walking={k === 2} label />
        {k >= 2 && <St_Cross p={B} name="(5, 4)" />}
        <St_Card x={(k >= 2 ? bx - 22 : 176) - 10} y={118} tilt={8} />
        <StageKouta x={186} y={150} s={1.3} />
        {k >= 3 && <Bubble x={bx - 26} y={82} side="left" lines={["Card এর কোথায়", "আঁকবো?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1b · Four answers. Som opens his 9.2 খাতা (আগে G⁻¹ বানাই); Rina (কৌটা গুনে
//      বের করবো); Nasib (জিন্দেগিতেও হবে না); Karim ((5, 4)); Nasib again
//      (অর্ধেক কইরা)।

export function FourSpots({}: Story) {
  const s = useScene(5, [600, 2200, 2200, 2400, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সোম খাতা খুলে বললো আগে G inverse বানাই; রিনা বললো দেয়ালে কৌটা গুনে বের করবো; নাসিব বললো কৌটা দিয়া ঠিকানা, জিন্দেগিতেও হবে না; করিম বললো যেখানে দেয়ালে সেখানেই card এ; নাসিব বললো অর্ধেক কইরা">
        <Person who="som" x={48} y={150} arm={k === 1 ? "hold" : "down"} label />
        {k >= 1 && <St_Khata x={58} y={102} />}
        {k === 1 && <Bubble x={48} y={84} side="right" lines={["আগে G⁻¹ বানাই।"]} />}
        <Person who="rina" x={118} y={150} arm={k === 2 ? "point" : "hold"} label />
        <St_Card x={130} y={118} tilt={-8} />
        {k === 2 && <Bubble x={118} y={84} side="mid" lines={["লাগবে না। কৌটা", "গুনে বের করবো।"]} />}
        <Person who="nasib" x={196} y={150} facing={-1} mood={k === 3 || k === 5 ? "smug" : "plain"} label />
        {k === 3 && <Bubble x={196} y={84} side="mid" lines={["কৌটা দিয়া ঠিকানা?", "জিন্দেগিতেও না।"]} />}
        {k === 5 && <Bubble x={196} y={84} side="mid" lines={["অর্ধেক কইরা আঁকো।", "(2.5, 2)"]} />}
        <Person who="karim" x={268} y={150} facing={-1} arm={k === 4 ? "point" : "down"} label />
        {k === 4 && <Bubble x={268} y={84} side="left" lines={["যেখানে দেয়ালে,", "সেখানেই। (5, 4)"]} />}
        <StageKouta x={150} y={150} s={1.3} />
      </Stage>
    </StoryFrame>
  );
}

// 4a · Karim takes the chalk: two lines from the nail, one along column 1 to
//      (2, 1), one to the cross; a leaning patch between them. এইটা রং করতে
//      কয় কৌটা লাগবো? আমি গুনি।

export function KarimChalk({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const o = onStage([0, 0]);
  const c1 = onStage(C1);
  const b = onStage(B);
  const far = onStage(add(C1, B));
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="করিম চক নিয়ে পেরেক থেকে দুইটা দাগ টানলো, একটা G এর column 1 বরাবর, আরেকটা ক্রস পর্যন্ত; দুই দাগে একটা হেলানো ছোপ; করিম বললো এইটা রং করতে কয় কৌটা লাগবো, আমি গুনি">
        <StageWall x={SW[0]} y={SW[1]}>
          {k >= 3 && <path d={`M${STAGE_WALL_F.sx(0)} ${STAGE_WALL_F.sy(0)}L${STAGE_WALL_F.sx(2)} ${STAGE_WALL_F.sy(1)}L${STAGE_WALL_F.sx(7)} ${STAGE_WALL_F.sy(5)}L${STAGE_WALL_F.sx(5)} ${STAGE_WALL_F.sy(4)}Z`} fill={PK.glow} fillOpacity={0.45} stroke="none" className={FADE} />}
        </StageWall>
        <St_Cross p={B} />
        {k >= 1 && <path d={`M${o[0]} ${o[1]}L${c1[0]} ${c1[1]}`} stroke={CHALK} strokeWidth={1.6} strokeLinecap="round" className={FADE} />}
        {k >= 2 && <path d={`M${o[0]} ${o[1]}L${b[0]} ${b[1]}`} stroke={CHALK} strokeWidth={1.6} strokeLinecap="round" className={FADE} />}
        {k >= 3 && <path d={`M${c1[0]} ${c1[1]}L${far[0]} ${far[1]}L${b[0]} ${b[1]}`} stroke={CHALK} strokeWidth={1.2} strokeDasharray="3 2" fill="none" className={FADE} />}
        <Person who="karim" x={k >= 1 ? 172 : 200} y={150} facing={-1} arm={k >= 1 && k < 3 ? "point" : "down"} walking={k === 1} label />
        <Projector x={PJ[0] + 40} y={PJ[1]} lens="good" />
        <StageKouta x={206} y={150} s={1.3} />
        <StageKouta x={218} y={150} s={1.3} />
        {k >= 3 && <Bubble x={172} y={84} side="right" lines={["কয় কৌটা লাগবো?", "আমি গুনি।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · Samin with 8.2's ad − bc on her phone: প্রতিবার দেয়ালে ছোপ আঁকবো?
//      চারটা সংখ্যা দিলেই তো হয়। কিন্তু কোন চারটা?

export function SaminPhone({}: Story) {
  const s = useScene(2, [600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সামিন ফোনে আমিনের ad − bc খুললো; বললো প্রতিবার দেয়ালে ছোপ আঁকবো, চারটা সংখ্যা দিলেই তো হয়; তারপর বললো কিন্তু কোন চারটা">
        <StageWall x={SW[0]} y={SW[1]}>
          <path d={`M${STAGE_WALL_F.sx(0)} ${STAGE_WALL_F.sy(0)}L${STAGE_WALL_F.sx(2)} ${STAGE_WALL_F.sy(1)}L${STAGE_WALL_F.sx(7)} ${STAGE_WALL_F.sy(5)}L${STAGE_WALL_F.sx(5)} ${STAGE_WALL_F.sy(4)}Z`} fill={PK.paint} fillOpacity={0.35} />
        </StageWall>
        <St_Cross p={B} />
        <Person who="samin" x={214} y={150} facing={-1} arm="hold" label />
        <St_Phone x={226} y={96} text={k >= 2 ? "?" : "3"} />
        {k === 1 && <Bubble x={214} y={84} side="left" lines={["চারটা সংখ্যা দিলেই", "তো কৌটা বের হয়।"]} />}
        {k >= 2 && <Bubble x={214} y={84} side="left" lines={["কিন্তু কোন", "চারটা?"]} />}
        <Person who="karim" x={284} y={150} facing={-1} label />
      </Stage>
    </StoryFrame>
  );
}

// 6a · Rina draws a small heart at (2, 1) on the card, cuts it out with the
//      scissors, and sets the card in front of the machine.

export function RinaCuts({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="রিনা card এর (2, 1) এ একটা ছোট heart আঁকলো, কাঁচি দিয়ে কেটে ফুটো করলো, তারপর card টা যন্ত্রের মুখে বসালো">
        <StageWall x={SW[0]} y={SW[1]} />
        <St_Cross p={B} />
        <path d="M86 166L94 156H182L190 166Z" fill="#e7c98a" stroke="#a16207" strokeWidth={0.7} />
        <Person who="rina" x={k >= 3 ? 172 : 110} y={156} facing={1} arm={k >= 1 ? "hold" : "down"} walking={k === 3} label />
        {k < 3 ? <St_Card x={134} y={128} w={30} h={23} heart={k >= 1} /> : <St_Card x={lx - 10} y={ly} w={16} h={13} heart />}
        {k === 2 && (
          <g className={POP}>
            <path d="M150 136l8 -5m-8 5l8 2" stroke="#475569" strokeWidth={1.6} strokeLinecap="round" />
            <circle cx={148} cy={135} r={2} fill="none" stroke={RED} strokeWidth={1.2} />
            <circle cx={148} cy={140} r={2} fill="none" stroke={RED} strokeWidth={1.2} />
          </g>
        )}
        {k >= 1 && k < 3 && (
          <text x={134} y={112} textAnchor="middle" fontSize={7} fontWeight={800} fontFamily={MONO} fill={INK} className={POP}>
            (2, 1)
          </text>
        )}
        <Projector x={PJ[0]} y={PJ[1]} lens="good" />
        <LightBhai x={276} y={150} facing={-1} />
      </Stage>
    </StoryFrame>
  );
}

// 7a · Karim chalks a cross of his own, between the window and the door,
//      higher up: (4, 5). আমারটা এইখানে।

export function KarimCross({}: Story) {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  const [kx] = onStage(B7);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="দরজার উপরে রিনার লাল heart এর আলো; করিম দরজা আর জানালার মাঝখানে, আরো উপরে একটা ক্রস দিলো, (4, 5); বললো আমারটা এইখানে">
        <StageWall x={SW[0]} y={SW[1]} />
        <St_Heart p={B} look="light" />
        <Person who="karim" x={k >= 1 ? kx - 26 : 200} y={150} facing={k >= 1 ? 1 : -1} arm={k >= 1 ? "point" : "down"} walking={k === 1} label />
        {k >= 1 && <St_Cross p={B7} name="(4, 5)" />}
        {k >= 2 && <Bubble x={kx - 30} y={82} side="left" lines={["আমারটা এইখানে।"]} />}
        <Projector x={PJ[0]} y={PJ[1]} lens="good" on />
        <StageBeam from={projectorLens(PJ[0], PJ[1])} to={onStage(B)} />
      </Stage>
    </StoryFrame>
  );
}

// 8a · The লাইট ভাই swaps in his next wedding's lens and wants to test it here;
//      Rina chalks a cross on the door itself, (5, 1).

export function NextLens({}: Story) {
  const s = useScene(2, [600, 2000, 2000]);
  const k = s.k;
  const [dx] = onStage(B8);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="লাইট ভাই ঝোলা থেকে পরের বিয়ের lens বের করে যন্ত্রে লাগালেন; রিনা দরজার গায়ে একটা ক্রস দিলো, (5, 1)">
        <StageWall x={SW[0]} y={SW[1]} />
        <Projector x={PJ[0]} y={PJ[1]} lens={k >= 1 ? "spare" : "good"} />
        <LightBhai x={250} y={150} facing={-1} arm={k >= 1 ? "hold" : "down"} />
        {k === 1 && <Bubble x={250} y={84} side="left" lines={["এইটা পরের", "বিয়ার lens।"]} />}
        <Person who="rina" x={k >= 2 ? dx - 20 : 176} y={150} facing={k >= 2 ? 1 : -1} arm={k >= 2 ? "point" : "down"} walking={k === 2} label />
        {k >= 2 && <St_Cross p={B8} name="(5, 1)" />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · মাগরিব। Rina on the ladder, the brush red, painting over the heart of
//      light; then a red heart over the door. The লাইট ভাই ties the machine
//      on his ভ্যান; the ভ্যান goes out through the gate.

export function MagribVan({}: Story) {
  const s = useScene(3, [600, 1800, 2000, 2200]);
  const k = s.k;
  const [hx, hy] = onStage(B);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="মাগরিব; রিনা মইয়ের উপর, তুলিতে লাল রং, আলোর heart এর দাগ ধরে রং করলো; দরজার উপরে লাল heart; লাইট ভাই যন্ত্র ভ্যানে বাঁধলেন, ভ্যান গেট পার হলো">
        <StageWall x={SW[0]} y={SW[1]} />
        {k < 2 && <St_Heart p={B} look="light" />}
        {k >= 1 && <St_Heart p={B} look="paint" />}
        <St_Ladder x={hx - 20} x2={hx - 6} y2={hy + 16} />
        <Person who="rina" x={hx - 14} y={hy + 50} facing={1} arm="point" />
        <StageBrush x={hx - 6} y={hy + 12} a={-40} wet />
        {k < 2 && <Projector x={PJ[0]} y={PJ[1]} lens="good" on={k === 0} />}
        {k === 0 && <StageBeam from={projectorLens(PJ[0], PJ[1])} to={[hx, hy]} />}
        <St_Van x={k >= 3 ? 292 : 236} walking={k === 3} />
        <LightBhai x={k >= 3 ? 270 : 212} y={150} facing={1} walking={k === 3} ms={1800} />
      </Stage>
    </StoryFrame>
  );
}

// 9b · The bridge to 10.5: night, a হারিকেন (load-shedding again); the
//      বাবুর্চি with another bundle: four রসিদ, three prices. Nasib: এবার
//      তো বেশিই আছে।

export function BaburchiNight({}: Story) {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাত, হারিকেন জ্বলছে; বাবুর্চি আরেকটা পোঁটলা নিয়ে এলেন, বিয়ের খাবারের আরেকটা হিসাব; চারটা রসিদ, তিনটা দাম; নাসিব বললো এবার তো বেশিই আছে">
        <g>
          <circle cx={132} cy={136} r={26} fill="#fde047" opacity={0.22} />
          <path d="M128 128q4 -5 8 0" fill="none" stroke="#e5e7eb" strokeWidth={1.2} />
          <rect x={128} y={130} width={8} height={12} rx={3} fill="#fef08a" stroke="#44403c" strokeWidth={1} />
          <rect x={127} y={142} width={10} height={3} fill="#44403c" />
        </g>
        <St_Baburchi x={k >= 1 ? 70 : -20} y={150} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && (
          <g className={POP}>
            <path d="M82 118q8 -8 16 0l-2 12h-12Z" fill="#fef3c7" stroke="#a16207" strokeWidth={0.8} />
          </g>
        )}
        {k >= 2 &&
          [0, 1, 2, 3].map((i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 120}ms` }}>
              <rect x={100 + i * 16} y={70} width={12} height={16} rx={1} fill="white" stroke="#94a3b8" strokeWidth={0.7} />
              <path d={`M${102 + i * 16} ${75}h8M${102 + i * 16} ${79}h6`} stroke="#94a3b8" strokeWidth={0.7} />
            </g>
          ))}
        <Person who="mama" x={196} y={150} facing={-1} />
        <Person who="nasib" x={262} y={150} facing={-1} mood={k >= 3 ? "smug" : "plain"} />
        {[
          [196, "মামা"],
          [262, "নাসিব"],
        ].map(([x, t]) => (
          <text key={t} x={x} y={161} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#f8fafc" className="pointer-events-none">
            {t}
          </text>
        ))}
        {k >= 3 && <Bubble x={262} y={84} side="left" lines={["চারটা রসিদ, তিনটা দাম।", "এবার তো বেশিই আছে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The stake: the cross over the door; the লাইট ভাই's half hour running;
//      paint can't be wiped (a red heart beside the cross, crossed out); the
//      card, and a "?" where the heart should go.

const S1_SAY = ["দরজার মাথার উপরে ক্রস, (5, 4)।", "লাইট ভাইয়ের হাতে আধা ঘণ্টা। তারপর যন্ত্র নিয়ে চলে যাবেন।", "রং একবার দিলে মুছা যায় না। ভুল জায়গায় heart থাকবে সারা জীবন।", "Card এর কোথায় আঁকলে ক্রসে পড়বে? এখনো জানি না।"];
const S1F = makeFrame(-1, 8.5, -1, 7.5, 9, 0); // 85.5 × 76.5

export function StakeFig() {
  const s = useScene(3, [600, 1800, 2400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S1_SAY, k)}>
      <svg viewBox="0 0 280 100" role="img" aria-label="দেয়ালে দরজার উপরে ক্রস; একটা ঘড়ি, আধা ঘণ্টা; ভুল জায়গার লাল heart কাটা; card এ প্রশ্নবোধক" className="mx-auto block h-auto w-full max-w-[17rem]">
        <g transform="translate(6 10)">
          <rect x={0} y={0} width={S1F.W} height={S1F.H} rx={4} fill="#e9e4d8" />
          <rect x={S1F.sx(5)} y={S1F.sy(2.2)} width={2 * S1F.u} height={S1F.H - S1F.sy(2.2)} fill="#7c4a24" />
          <rect x={S1F.sx(1)} y={S1F.sy(3.4)} width={2 * S1F.u} height={1.6 * S1F.u} fill="#1e3a5f" />
          <rect x={S1F.sx(0) - 1.5} y={0} width={3} height={S1F.H} fill="#8b5e34" opacity={0.85} />
          <path d={`M${S1F.sx(5) - 3} ${S1F.sy(4) - 3}l6 6m0 -6l-6 6`} stroke="#57534e" strokeWidth={1.6} strokeLinecap="round" />
          {k >= 2 && (
            <g className={POP}>
              <path d={heartPath(S1F.sx(6.6), S1F.sy(4.4), 4)} fill={RED} />
              <path d={`M${S1F.sx(6.6) - 6} ${S1F.sy(4.4) - 6}l12 12`} stroke={PK.bad} strokeWidth={1.8} strokeLinecap="round" />
            </g>
          )}
        </g>
        {k >= 1 && (
          <g className={FADE} transform="translate(140 50)">
            <circle cx={0} cy={0} r={24} fill="white" stroke={INK} strokeWidth={1.4} />
            <path d="M0 0L0 -24A24 24 0 0 1 0 24Z" fill={PK.glow} fillOpacity={0.7} className="pointer-events-none" />
            <path d="M0 0V-17" stroke={INK} strokeWidth={2} strokeLinecap="round" />
            <path d="M0 0L11 5" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
            <text x={0} y={38} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
              আধা ঘণ্টা
            </text>
          </g>
        )}
        {k >= 3 && (
          <g className={FADE} transform="translate(200 20)">
            <rect x={0} y={0} width={72} height={58} rx={3} fill="#fde68a" stroke="#b45309" strokeWidth={1} />
            <text x={36} y={39} textAnchor="middle" fontSize={30} fontWeight={800} fill={BLUE}>
              ?
            </text>
            <text x={36} y={72} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
              card
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Sliding sideways keeps the count: x = (0, 2) a straight stack of 2;
//      (1, 2) leans; its right triangle cut and slid left, straight again;
//      (3, 2) still 2.

const S2_SAY = ["x = (0, 2): সোজা ঘর। নিচে 1, উপরে 2। জায়গা 2।", "x পাশে সরলো, (1, 2)। ছোপ হেলে গেলো।", "ডানের তেকোনা কেটে বামে বসালে আবার সোজা ঘর। জায়গা 2।", "(3, 2) তেও তাই। উচ্চতা না বদলালে জায়গা বদলায় না।"];
const S2F = makeFrame(-0.4, 4.4, -0.4, 2.6, 34, 4);

export function ShearSame() {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  const target: XY = k === 0 ? [0, 2] : k <= 2 ? [1, 2] : [3, 2];
  const tw = useTween([target[0], target[1]], 700);
  const x: XY = [tw[0], tw[1]];
  const tri: XY[] = [
    [1, 0],
    [2, 2],
    [1, 2],
  ];
  return (
    <Scene scene={s} caption={say(S2_SAY, k)}>
      <svg viewBox={`0 0 ${S2F.W} ${S2F.H}`} role="img" aria-label="card এ e₁ আর x এর ছোপ; x পাশে সরলে ছোপ হেলে যায়, তেকোনা কেটে বসালে আবার সোজা দুই ঘর" className="mx-auto block h-auto w-full max-w-[12rem]">
        <rect x={0} y={0} width={S2F.W} height={S2F.H} rx={5} fill="#fffdf7" stroke="#d6d3d1" />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={`v${i}`} d={`M${S2F.sx(i)} ${S2F.sy(-0.4)}V${S2F.sy(2.6)}`} stroke={PK.chalk} strokeOpacity={0.3} strokeWidth={0.7} />
        ))}
        {[0, 1, 2].map((i) => (
          <path key={`h${i}`} d={`M${S2F.sx(-0.4)} ${S2F.sy(i)}H${S2F.sx(4.4)}`} stroke={PK.chalk} strokeOpacity={0.3} strokeWidth={0.7} />
        ))}
        <path d={polyD(S2F, [[0, 0], [1, 0], [1, 2], [0, 2]])} fill="none" stroke={BLUE} strokeWidth={1.2} strokeDasharray="4 3" />
        {k === 2 ? (
          <>
            <path d={polyD(S2F, [[0, 0], [1, 0], [1, 2]])} fill={PK.glow} fillOpacity={0.62} stroke={PK.lamp} strokeWidth={1.2} />
            <g style={{ transform: `translate(${-S2F.u}px, 0px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none starting:translate-x-0">
              <path d={polyD(S2F, tri)} fill={PK.glow} fillOpacity={0.62} stroke="#7c3aed" strokeWidth={1.4} strokeDasharray="3 2" />
            </g>
          </>
        ) : (
          <path d={polyD(S2F, para(E1, x))} fill={PK.glow} fillOpacity={0.62} stroke={PK.lamp} strokeWidth={1.3} strokeLinejoin="round" />
        )}
        <Arrow f={S2F} from={[0, 0]} to={E1} tone="amber" w={2.2} list={false} />
        {k !== 2 && <Arrow f={S2F} from={[0, 0]} to={x} tone="blue" w={2.2} list={false} />}
        <text x={S2F.W - 8} y={16} textAnchor="end" fontSize={12} fontWeight={800} fill={INK}>
          <tspan fontFamily={MONO}>2</tspan> ঘর
        </text>
      </svg>
    </Scene>
  );
}

// 3½ · The question turned around: on the card, the right spot x (unknown,
//      "?"); thrown, e₁ lands on column 1 and x on the cross b; so the wall's
//      patch of column 1 and b holds 3 × x₂ কৌটা। Stops at x₂ = ?.

const S3_SAY = ["Card এ ঠিক বিন্দুটা, x। কোথায়, জানি না।", "যন্ত্র চালালে e₁ পড়ে column 1 এ, (2, 1)।", "আর ঠিক বিন্দু হলে x এর আলো পড়ে ক্রসে, b তে।", "তাহলে দুইটার ছোপে কৌটা 3 × x₂। ছোপটা গুনলেই x₂।"];
const S3F = makeFrame(-1, 8.5, -1, 6, 22, 4);

export function WallQuestion() {
  const s = useScene(3, [600, 1800, 1800, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S3_SAY, k)}>
      <div className="flex justify-center">
        <KWall f={S3F} label="দেয়ালে card এর জায়গায় প্রশ্নবোধক; e₁ যায় column 1 এ; x এর আলো যায় ক্রসে; দুইটার ছোপ 3 গুণ x₂" className="max-w-[14rem]">
          <ChalkCross f={S3F} at={B} name="b" />
          {k === 0 && (
            <g className={FADE}>
              <path d={polyD(S3F, [[0, 0], [3, 0], [3, 2], [0, 2]])} fill="#fffdf7" fillOpacity={0.6} stroke="#a8a29e" />
              <text x={S3F.sx(1.6)} y={S3F.sy(0.8)} fontSize={16} fontWeight={800} fill={BLUE}>
                ?
              </text>
            </g>
          )}
          {k >= 1 && <Arrow f={S3F} from={[0, 0]} to={C1} tone="amber" w={2.2} draw />}
          {k >= 2 && <Arrow f={S3F} from={[0, 0]} to={B} tone="blue" w={2.2} draw />}
          {k >= 3 && (
            <g className={FADE}>
              <PatchLight f={S3F} a={C1} b={B} ghost />
              <text x={S3F.sx(3.2)} y={S3F.sy(0.9) + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill={INK} stroke="white" strokeWidth={2.4} paintOrder="stroke">
                <tspan fontFamily={MONO}>3 × x₂</tspan> কৌটা
              </text>
            </g>
          )}
        </KWall>
      </div>
    </Scene>
  );
}

// 4½ · A patch over a patch. G's own patch (3 কৌটা, the det) at the bottom;
//      above it the patch of column 1 and b (3): 1, x₂; then the patch of b
//      and column 2 (6): 2, x₁; the name last.

const S4_SAY = ["নিচে G এর নিজের ছোপ, column 1 আর column 2: 3 কৌটা। এটাই det।", "উপরে column 1 আর b এর ছোপ: 3 কৌটা। 3 এর উপর 3: x₂ = 1।", "উপরে b আর column 2 এর ছোপ: 6 কৌটা। 6 এর উপর 3: x₁ = 2।", "ঠিকানা (2, 1)। নাম Cramer's rule."];
const S4U = 6;

function MiniPatch({ a, b, x, y, tone, n }: { a: XY; b: XY; x: number; y: number; tone: "light" | "paint" | "blue"; n: number }) {
  const pts = para(a, b);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y1 = Math.max(...ys);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${(x + (p[0] - x0) * S4U).toFixed(1)} ${(y + (y1 - p[1]) * S4U).toFixed(1)}`).join("") + "Z";
  const w = (Math.max(...xs) - x0) * S4U;
  const h = (y1 - Math.min(...ys)) * S4U;
  const fill = tone === "light" ? PK.glow : tone === "paint" ? PK.paint : "#93c5fd";
  return (
    <g className={POP}>
      <path d={d} fill={fill} fillOpacity={0.75} stroke={INK} strokeOpacity={0.5} strokeWidth={0.8} />
      <text x={x + w + 4} y={y + h / 2 + 4} fontSize={10} fontWeight={800} fontFamily={MONO} fill={INK}>
        {n}
      </text>
    </g>
  );
}

export function PatchOverPatch() {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S4_SAY, k)}>
      <svg viewBox="0 0 300 112" role="img" aria-label="দুইটা ভাগ: উপরে column 1 আর b এর ছোপ, 3; উপরে b আর column 2 এর ছোপ, 6; নিচে দুইটাতেই G এর ছোপ, 3; ফল 1 আর 2" className="mx-auto block h-auto w-full max-w-[17rem]">
        {[0, 1].map((side) => {
          const ox = side === 0 ? 8 : 158;
          const shown = side === 0 ? k >= 1 : k >= 2;
          return (
            <g key={side}>
              {shown && <MiniPatch a={side === 0 ? C1 : B} b={side === 0 ? B : C2} x={ox + (side === 0 ? 8 : 14)} y={side === 0 ? 10 : 2} tone={side === 0 ? "paint" : "blue"} n={side === 0 ? 3 : 6} />}
              {shown && <path d={`M${ox} 50H${ox + 78}`} stroke={INK} strokeWidth={1.4} className={FADE} />}
              <MiniPatch a={C1} b={C2} x={ox + 26} y={56} tone="light" n={3} />
              {shown && (
                <g className={POP}>
                  <text x={ox + 86} y={55} fontSize={14} fontWeight={800} fontFamily={MONO} fill={BLUE}>
                    = {side === 0 ? 1 : 2}
                  </text>
                  <text x={ox + 94} y={70} fontSize={10} fontWeight={800} fontFamily={MONO} fill={BLUE}>
                    {side === 0 ? "x₂" : "x₁"}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {k >= 3 && (
          <text x={150} y={106} textAnchor="middle" fontSize={11} fontWeight={800} fill={INK} className={POP}>
            Cramer&apos;s rule
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 5½ · b slides into a column's slot: column 1's (A₁, for x₁), then column
//      2's (A₂, for x₂); the rule written with det(A) in the bottom; det 0
//      breaks it.

const S5_SAY = ["G এর দুই column, আর b = (5, 4).", "b গেলো column 1 এর জায়গায়। এই matrix এর নাম A₁। তার det থেকে x₁।", "b গেলো column 2 এর জায়গায়: A₂। তার det থেকে x₂।", "দুইবারই নিচে det(A)। সেটা 0 হলে ভাগই চলে না।"];

export function SlotSlide() {
  const s = useScene(3, [600, 2200, 2200, 2600]);
  const k = s.k;
  const slot = k === 1 ? 0 : k === 2 ? 1 : -1;
  const cols: XY[] = [slot === 0 ? B : C1, slot === 1 ? B : C2];
  return (
    <Scene scene={s} caption={say(S5_SAY, k)}>
      <div className="flex min-h-24 flex-col items-center justify-center gap-2">
        {k < 3 ? (
          <div className="flex items-center gap-3">
            <Mat cols={cols} blue={slot} />
            {slot === -1 ? (
              <span className="font-mono text-sm font-bold text-cat-blue">
                b = <Tup v={B} of={SPOT_SLOTS} />
              </span>
            ) : (
              <span key={slot} className={`font-mono text-sm font-bold ${POP}`}>
                {slot === 0 ? "A₁ → x₁" : "A₂ → x₂"}
              </span>
            )}
          </div>
        ) : (
          <div className={`flex items-center gap-3 font-mono text-base font-bold ${FADE}`}>
            <span className="flex flex-col items-center">
              <span>det(Aᵢ)</span>
              <span className="h-0.5 w-full bg-current" />
              <span className="rounded bg-danger/10 px-1 text-danger">det(A)</span>
            </span>
            <span className="text-sm font-semibold text-danger">0 হলে ভাগ চলে না</span>
          </div>
        )}
      </div>
    </Scene>
  );
}

// 6½ · Three roads, one spot: Som's G⁻¹ (9.2), Rina's কৌটা, 10.3's cutting
//      of রসিদ; all three arrive at (2, 1) on the card.

const S6_SAY = ["Card এর (2, 1)। এখানে পৌঁছানোর রাস্তা কয়টা?", "সোমের খাতা: G⁻¹ দিয়ে (5, 4) কে গুণ। (2, 1).", "রিনার কৌটা: 6 ÷ 3 আর 3 ÷ 3। (2, 1).", "10.3 এর রসিদ কাটা: একটা উধাও, তারপর আরেকটা। সেই (2, 1)।"];
const S6_ROADS = [
  { y: 20, label: "G⁻¹", tone: "#7c3aed" },
  { y: 55, label: "কৌটা", tone: PK.paintDark },
  { y: 90, label: "রসিদ কাটা", tone: TEAL },
];

export function ThreeRoads() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const dot: [number, number] = [220, 55];
  return (
    <Scene scene={s} caption={say(S6_SAY, k)}>
      <svg viewBox="0 0 280 110" role="img" aria-label="তিনটা রাস্তা, G inverse, কৌটা আর রসিদ কাটা, তিনটাই card এর (2, 1) এ পৌঁছায়" className="mx-auto block h-auto w-full max-w-[17rem]">
        <rect x={188} y={22} width={78} height={62} rx={4} fill="#fffdf7" stroke="#d6d3d1" />
        <circle cx={dot[0]} cy={dot[1]} r={5} fill={BLUE} />
        <text x={dot[0] + 8} y={dot[1] - 7} fontSize={9} fontWeight={800} fontFamily={MONO} fill={BLUE}>
          (2, 1)
        </text>
        {S6_ROADS.map((r, i) =>
          k >= i + 1 ? (
            <g key={r.label}>
              <path d={`M60 ${r.y}C120 ${r.y} 150 ${dot[1]} ${dot[0] - 7} ${dot[1]}`} pathLength={1} strokeDasharray="1 2" stroke={r.tone} strokeWidth={2} fill="none" className="[stroke-dashoffset:0] transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none starting:[stroke-dashoffset:1]" />
              <text x={54} y={r.y + 4} textAnchor="end" fontSize={10} fontWeight={700} fontFamily={/[ঀ-৿]/.test(r.label) ? undefined : MONO} fill={r.tone} className={FADE}>
                {r.label}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </Scene>
  );
}

// 9½ · The recap: the cross b and lens G; the patch of column 1 and b, 3
//      কৌটা; of b and column 2, 6; both ÷ det 3: (2, 1); the heart at (2, 1)
//      thrown onto the door.

const S9_SAY = ["দেয়ালে ক্রস b = (5, 4)। Lens G.", "column 1 আর b এর ছোপ: 3 কৌটা।", "b আর column 2 এর ছোপ: 6 কৌটা।", "দুইটাই ÷ det 3: card এর (2, 1)।", "Card এর (2, 1) এর heart পড়লো দরজার উপরে।"];
const S9F = makeFrame(-1, 8.5, -1, 7, 22, 4);

export function RecapFig() {
  const s = useScene(4, [600, 1800, 1800, 2200, 2200]);
  const k = s.k;
  const heart = heartPts(X_DOOR, 0.32).map((p) => (k >= 4 ? apply(G, p) : p));
  return (
    <Scene scene={s} caption={say(S9_SAY, k)}>
      <div className="flex justify-center">
        <KWall f={S9F} label="দেয়ালে ক্রস; দুইটা ছোপ, 3 আর 6 কৌটা; ভাগ 3; card এর (2, 1) এর heart দরজার উপরে" className="max-w-[14rem]">
          {k >= 1 && k < 4 && <Pour f={S9F} poly={para(C1, B)} frac={1} />}
          {k >= 2 && k < 4 && <Pour f={S9F} poly={para(B, C2)} frac={1} tone="blue" />}
          {k >= 1 && k < 4 && (
            <text x={S9F.sx(3.9)} y={S9F.sy(1.2) + 4} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK} stroke="white" strokeWidth={2.4} paintOrder="stroke">
              {k >= 3 ? "3 ÷ 3 = 1" : "3"}
            </text>
          )}
          {k >= 2 && k < 4 && (
            <text x={S9F.sx(2.2)} y={S9F.sy(5.4) + 4} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK} stroke="white" strokeWidth={2.4} paintOrder="stroke">
              {k >= 3 ? "6 ÷ 3 = 2" : "6"}
            </text>
          )}
          <ChalkCross f={S9F} at={B} name="b" />
          {k >= 3 && (
            <HeartShape f={S9F} pts={heart} look={k >= 4 ? "paint" : "hole"} />
          )}
        </KWall>
      </div>
    </Scene>
  );
}

// 9¾ · Side quest: how the work grows with the number of unknowns n.
//      Cramer's steps roughly n!, elimination's roughly n³; at 2 and 3
//      Cramer is no worse; at 10 its bar runs off the page.

const S10_ROWS: { n: number; cr: number; el: number }[] = [
  { n: 2, cr: 2, el: 8 },
  { n: 3, cr: 6, el: 27 },
  { n: 5, cr: 120, el: 125 },
  { n: 10, cr: 3628800, el: 1000 },
];
const S10_SAY = ["2 টা অজানা: Cramer এ 2 এর মতো ধাপ, রসিদ কাটায় 8। Cramer ই সোজা।", "3 টা: 6 আর 27। তখনো Cramer চলে।", "5 টা: 120 আর 125। সমান সমান।", "10 টা: Cramer এ 36 লাখের বেশি। রসিদ কাটায় 1000।"];

export function StepsRace() {
  const s = useScene(3, [600, 2000, 2000, 2600]);
  const k = s.k;
  const row = S10_ROWS[k];
  const W = 150;
  const bar = (v: number) => Math.min(1.12, v / 1000) * W;
  return (
    <Scene scene={s} caption={say(S10_SAY, k)}>
      <svg viewBox="0 0 300 90" role="img" aria-label="অজানা বাড়লে Cramer এর ধাপ n! এর মতো বাড়ে, রসিদ কাটার ধাপ n³ এর মতো; 10 অজানায় Cramer এর দাগ পাতা ছাড়িয়ে যায়" className="mx-auto block h-auto w-full max-w-[17rem]">
        <text x={6} y={14} fontSize={10} fontWeight={800} fill={INK}>
          অজানা <tspan fontFamily={MONO}>{row.n}</tspan>
        </text>
        {[
          { y: 36, label: "Cramer", v: row.cr, tone: PK.paint },
          { y: 66, label: "রসিদ কাটা", v: row.el, tone: TEAL },
        ].map((r) => (
          <g key={r.label}>
            <text x={70} y={r.y + 4} textAnchor="end" fontSize={9} fontWeight={700} fontFamily={/[ঀ-৿]/.test(r.label) ? undefined : MONO} fill={INK}>
              {r.label}
            </text>
            <rect x={76} y={r.y - 7} width={Math.max(2, bar(r.v))} height={14} rx={2} fill={r.tone} fillOpacity={0.8} className="transition-[width] duration-700 ease-out motion-reduce:transition-none" />
            {r.v > 1000 && <path d={`M${76 + bar(r.v)} ${r.y - 9}l5 9l-5 9`} stroke={PK.paintDark} strokeWidth={1.6} fill="none" className={POP} />}
            <text x={256} y={r.y + 4} fontSize={9} fontWeight={800} fontFamily={MONO} fill={INK}>
              {r.v.toLocaleString("en-IN")}
            </text>
          </g>
        ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  StencilBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 3, sealed: true } },
  CoordIsArea: { start: {}, lean: { x: [4, 1] }, e2: { mode: 1, x: [3, 2] } },
  ThrowTheArea: { start: {}, landed: { pick: 1, tried: [1] } },
  CountKouta: { start: {}, guessed: { guess: 0, stage: 1 }, both: { guess: 1, stage: 3 }, done: { guess: 1, stage: 5 } },
  SwapColumn: { start: {}, col1: { slot: 0, seen: [true, false] }, col2: { slot: 1, seen: [true, true] } },
  HeartLands: { start: {}, landed: { ran: true } },
  YourKouta: { start: {}, poured: { poured: [true, true], spot: [2, 1], shot: [2, 1] }, right: { poured: [true, true], spot: [1, 2], shot: [1, 2] } },
  TryCramer: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 2 }, right: { pick: 1 } },
  BetOpen: { start: {}, all: { opened: [0, 1, 2, 3], cur: null } },
  FourSpots: { karim: { k: 4 } },
  StakeFig: { end: {} },
  ShearSame: { cut: { k: 2 }, end: {} },
  RecapFig: { mid: { k: 3 }, end: {} },
  StepsRace: { five: { k: 2 }, end: {} },
};
