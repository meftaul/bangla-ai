"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { POP } from "@/components/journey/kit";
import { sfx } from "@/components/journey/sfx";

// Shared drawn pieces for the Physics for High School journeys
// (src/content/articles/physics_for_high_school/, one per video of the
// Physics 9–10 playlist in physics_9_10/). The world is the videos' own: তিথি
// in ফরিদপুর, বাসার গেট = origin O, the school 1 km east, the river road
// A (km 0) → B (km 4) → C (km 6) of EP 06–08.
//
// Colour roles are the videos': mint = the right answer / the aha /
// displacement and velocity arrows, amber = look here / time stamps, blue = a
// direction, cream = distance along a path, red = wrong. Everything drawn is
// "paper": fixed ink on a white sheet, the same in light and dark.
//
// Only add exports here; every physics journey imports from this file.

export const PH = {
  ink: "#0f1b2d",
  mute: "#5a6b7d",
  faint: "#cbd5e1",
  paper: "#ffffff",
  ground: "#f6f3ec",
  mint: "#059669",
  mintSoft: "#d1fae5",
  amber: "#d97706",
  amberSoft: "#fef3c7",
  blue: "#2563eb",
  blueSoft: "#dbeafe",
  cream: "#b08a4a",
  creamSoft: "#f5ecd7",
  red: "#dc2626",
  redSoft: "#fee2e2",
} as const;

export type PhTone = "mint" | "amber" | "blue" | "red" | "ink" | "cream";
const TONE_HEX: Record<PhTone, string> = { mint: PH.mint, amber: PH.amber, blue: PH.blue, red: PH.red, ink: PH.ink, cream: PH.cream };
const TONE_SOFT: Record<PhTone, string> = { mint: PH.mintSoft, amber: PH.amberSoft, blue: PH.blueSoft, red: PH.redSoft, ink: "#f1f5f9", cream: PH.creamSoft };
export const toneHex = (t: PhTone) => TONE_HEX[t];

/** Monospace has no Bangla glyphs: a line with any Bangla takes the page font. */
export const isBn = (s: string) => /[ঀ-৿]/.test(s);
export const fontFor = (s: string) => (isBn(s) ? "inherit" : "ui-monospace, SFMono-Regular, Menlo, monospace");
/** A rough width for a label in SVG units at font size `size`. */
export const textW = (s: string, size: number) =>
  // A line with no Bangla is set in monospace (fontFor): every glyph, space included, is 0.6 em.
  isBn(s) ? [...s].reduce((w, ch) => w + (/[ঀ-৿]/.test(ch) ? 0.58 : /[\s.,·]/.test(ch) ? 0.32 : 0.6), 0) * size : [...s].length * 0.6 * size;

// ---------------------------------------------------------------------------
// The sheet: a white rounded page, sized for a phone. Pointer maths on it goes
// through `svgPoint`, as a ratio of the rendered box (the frame zooms widgets).
// `frame="line"` is the drawn border; `frame="soft"` is a page lying on the
// desk, a warm hairline and a soft shadow, no border, so the drawing is the
// thing on the screen and not a picture in a box.

export function Sheet({
  w = 300,
  h = 200,
  label,
  className = "max-w-[22rem]",
  bg = PH.paper,
  frame = "soft",
  onPointerDown,
  onPointerMove,
  onPointerUp,
  children,
}: {
  w?: number;
  h?: number;
  label: string;
  className?: string;
  bg?: string;
  frame?: "line" | "soft";
  onPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: React.PointerEvent<SVGSVGElement>) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
      className={`mx-auto block h-auto w-full touch-none select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {frame === "soft" ? (
        <>
          <defs>
            <filter id={`${id}s`} x="-5%" y="-5%" width="110%" height="115%">
              <feGaussianBlur stdDeviation={1.6} />
            </filter>
          </defs>
          <rect x={2} y={4} width={w - 4} height={h - 6} rx={12} fill={PH.ink} opacity={0.14} filter={`url(#${id}s)`} />
          <rect x={1.5} y={1.5} width={w - 3} height={h - 4} rx={12} fill={bg} stroke={PH.cream} strokeOpacity={0.35} strokeWidth={0.8} />
        </>
      ) : (
        <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} rx={12} fill={bg} stroke={PH.faint} strokeWidth={1.5} />
      )}
      {children}
    </svg>
  );
}

/** Where a pointer event lands, in the SVG's own units. */
export function svgPoint(e: { clientX: number; clientY: number; currentTarget: Element }, w: number, h: number): [number, number] {
  const r = (e.currentTarget as Element).getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * w, ((e.clientY - r.top) / r.height) * h];
}

// ---------------------------------------------------------------------------
// Words on paper.

/** SVG text that picks its font per line (Bangla → page font, numbers → mono). */
export function Txt({
  x,
  y,
  children,
  size = 10,
  anchor = "middle",
  weight = 600,
  color = PH.ink,
  className = "",
}: {
  x: number;
  y: number;
  children: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  color?: string;
  className?: string;
}) {
  return (
    <text x={x} y={y} fontSize={size} textAnchor={anchor} fontWeight={weight} fill={color} style={{ fontFamily: fontFor(children) }} className={`pointer-events-none ${className}`}>
      {children}
    </text>
  );
}

/** A rounded tag with a word or two on it, centred at (x, y). Bangla-safe (cast's Card is monospace). */
export function Tag({ x, y, text, tone = "ink", size = 9.5, solid = false, pop = false }: { x: number; y: number; text: string; tone?: PhTone; size?: number; solid?: boolean; pop?: boolean }) {
  const w = textW(text, size) + 12;
  const h = size + 8;
  const c = TONE_HEX[tone];
  return (
    <g className={`pointer-events-none ${pop ? POP : ""}`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={solid ? c : TONE_SOFT[tone]} stroke={c} strokeWidth={1.1} />
      <text x={x} y={y + size * 0.36} fontSize={size} textAnchor="middle" fontWeight={700} fill={solid ? "#fff" : tone === "ink" ? PH.ink : c} style={{ fontFamily: fontFor(text) }}>
        {text}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// A physics arrow: a quantity with a size and a direction. Tapping it lights
// it up and hangs what it is off the head, `1 km পূর্বে` — the physics
// journeys' version of "every arrow tells its list". `tell={false}` for décor.

export function PArrow({
  a,
  b,
  tone = "mint",
  w = 2.6,
  draw = false,
  dashed = false,
  delay = 0,
  ms = 600,
  tell,
  opacity = 1,
}: {
  a: [number, number];
  b: [number, number];
  tone?: PhTone;
  w?: number;
  draw?: boolean;
  dashed?: boolean;
  delay?: number;
  ms?: number;
  tell?: string | false;
  opacity?: number;
}) {
  const [on, setOn] = useState(false);
  const [x1, y1] = a;
  const [x2, y2] = b;
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const hl = Math.min(8 + w * 1.4, len * 0.55);
  const bx = x2 - ux * hl;
  const by = y2 - uy * hl;
  const half = hl * 0.5;
  const head = `M${x2} ${y2}L${bx - uy * half} ${by + ux * half}L${bx + uy * half} ${by - ux * half}Z`;
  const shaft = `M${x1} ${y1}L${bx + ux * 0.5} ${by + uy * 0.5}`;
  const c = TONE_HEX[tone];
  const drawn = (
    <g opacity={opacity} className="pointer-events-none">
      {draw ? (
        <path d={shaft} strokeWidth={w} strokeLinecap="round" stroke={c} fill="none" pathLength={1} strokeDasharray="1 2" className="[stroke-dashoffset:0] transition-[stroke-dashoffset] ease-out motion-reduce:transition-none starting:[stroke-dashoffset:1]" style={{ transitionDelay: `${delay}ms`, transitionDuration: `${ms}ms` }} />
      ) : (
        <path d={shaft} strokeWidth={w} strokeLinecap="round" strokeDasharray={dashed ? "5 4" : undefined} stroke={c} fill="none" />
      )}
      <path d={head} fill={c} className={draw ? POP : ""} style={draw ? { transitionDelay: `${delay + ms - 150}ms` } : undefined} />
    </g>
  );
  if (!tell) return drawn;
  const size = 9.5;
  const tw = textW(tell, size) + 12;
  const cx = x2 + ux * (tw / 2 + 4);
  const cy = y2 + uy * 12 + (Math.abs(uy) < 0.3 ? -12 : 0);
  const tap = (e: MouseEvent<SVGGElement>) => {
    if (e.currentTarget.closest("button, a")) return;
    setOn((o) => !o);
  };
  return (
    <g onClick={tap} className="cursor-pointer">
      {on && <path d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth={w + 7} strokeLinecap="round" opacity={0.25} stroke={c} fill="none" className="pointer-events-none" />}
      {drawn}
      <path d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth={Math.max(14, w + 10)} strokeLinecap="round" stroke="transparent" pointerEvents="stroke" fill="none">
        <title>{tell}</title>
      </path>
      {on && <Tag x={cx} y={cy} text={tell} tone={tone} pop />}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Motion that carries the idea (the approved look, EP 01 onward). A body
// moves on the clock: one eased glide, not a counter stepping along. `t` is
// how far along, 0…1; `start()` runs it and says when it has arrived. Pass
// `steps: false` for things that do not walk (a ball, a car, a needle), or
// `ease: "in"` for a fall that speeds up. Reduced motion arrives at once. A
// preview (`npm run shot`) never runs it, so seed the finished state.

export function useWalk(ms: number, { steps: walkSteps = true, ease = "inOut" }: { steps?: boolean; ease?: "inOut" | "in" | "out" | "linear" } = {}) {
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const raf = useRef(0);
  const steps = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      if (steps.current) clearInterval(steps.current);
    },
    [],
  );
  const start = (done?: () => void) => {
    cancelAnimationFrame(raf.current);
    if (steps.current) clearInterval(steps.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setT(1);
      setRunning(false);
      done?.();
      return;
    }
    const t0 = performance.now();
    setT(0);
    setRunning(true);
    if (walkSteps) {
      sfx.footstep();
      steps.current = setInterval(() => sfx.footstep(), 340);
    }
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setT(ease === "linear" ? p : ease === "in" ? p * p : ease === "out" ? 1 - (1 - p) ** 2 : p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else {
        if (steps.current) clearInterval(steps.current);
        setRunning(false);
        done?.();
      }
    };
    raf.current = requestAnimationFrame(tick);
  };
  return { t, running, start };
}

/**
 * A story scene's clock: 0 while `on` is false, then a straight (linear) run
 * to 1 over `ms` once it turns on, so a body placed by the equation of motion
 * moves exactly as the equation says. Mounted already on (a preview, a
 * reduced-motion page) it sits at 1; a replay turning it off drops it to 0 at
 * once, never rolling a bike back up the hill. Reduced motion: at once.
 */
export function useClock(on: boolean, ms: number) {
  const [t, setT] = useState(on ? 1 : 0);
  const prev = useRef(on);
  useEffect(() => {
    const was = prev.current;
    prev.current = on;
    let raf = 0;
    if (!on) {
      raf = requestAnimationFrame(() => setT(0));
      return () => cancelAnimationFrame(raf);
    }
    if (was) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = calm ? 1 : Math.min(1, (now - t0) / ms);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, ms]);
  return on ? t : 0;
}

/** One ring swelling and fading from `at` when mounted: the drawing's own "yes", before any green text. */
export function Ripple({ at, tone = "mint", r = 28 }: { at: [number, number]; tone?: PhTone; r?: number }) {
  return (
    <circle
      cx={at[0]}
      cy={at[1]}
      r={r}
      fill="none"
      stroke={TONE_HEX[tone]}
      strokeWidth={2}
      className="pointer-events-none origin-center [transform-box:fill-box] scale-100 opacity-0 transition-[scale,opacity] duration-[900ms] ease-out motion-reduce:transition-none starting:scale-[0.15] starting:opacity-80"
    />
  );
}

/** A choice chip under a figure: a hairline, so the figure stays the heavy thing on the screen. */
export const chip = (on: boolean) =>
  `cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors motion-reduce:transition-none disabled:cursor-default ${
    on ? "border-cat-blue bg-cat-blue text-white" : "border-border bg-surface hover:border-cat-blue/60"
  }`;

// Stickers: one ink line, a warm fill, a soft shadow on the ground, drawn big
// enough to be the thing you look at. Every prop drawn on a Sheet follows this
// rule. (Cast Stage scenes keep the cast's own look.)

/** The school, bottom-centre at (x, y). `lit` is the found school; `ghost` a place it might be. */
export function SchoolS({ x, y, s = 1, lit = false, ghost = false }: { x: number; y: number; s?: number; lit?: boolean; ghost?: boolean }) {
  const edge = lit ? PH.mint : PH.ink;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={ghost ? 0.45 : 1} className="pointer-events-none">
      <ellipse cy={1.5} rx={23} ry={3} fill={PH.ink} opacity={0.1} />
      <rect x={-19} y={-20} width={38} height={20} rx={2} fill={lit ? PH.mintSoft : "#f3e9d8"} stroke={edge} strokeWidth={1.1} />
      <path d="M-21.5 -20h43l-3.5 -6h-36Z" fill={lit ? PH.mint : "#c9a56a"} stroke={edge} strokeWidth={1.1} strokeLinejoin="round" />
      {[-13, -5, 5, 13].map((wx) => (
        <rect key={wx} x={wx - 2.5} y={-15.5} width={5} height={5} rx={0.8} fill={PH.blueSoft} stroke={edge} strokeWidth={0.7} />
      ))}
      <rect x={-3.5} y={-9} width={7} height={9} rx={1} fill={edge} />
      <path d="M0 -26v-13" stroke={PH.ink} strokeWidth={1} strokeLinecap="round" />
      <rect x={0.5} y={-39} width={10} height={6.5} rx={0.8} fill="#16a34a" />
      <circle cx={5.2} cy={-35.75} r={2} fill="#dc2626" />
    </g>
  );
}

/** তিথিদের বাসা behind its wall and gate; the gate's threshold at (x, y). */
export function GateS({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <ellipse cy={1.5} rx={17} ry={2.6} fill={PH.ink} opacity={0.1} />
      <path d="M-12 -12v-9l12 -9l12 9v9Z" fill="#f3e9d8" stroke={PH.ink} strokeWidth={1} strokeLinejoin="round" />
      <rect x={-3} y={-20} width={6} height={5} rx={0.8} fill={PH.blueSoft} stroke={PH.ink} strokeWidth={0.6} />
      <path d="M-16 0v-10h8v10M8 0v-10h8v10" fill="#e9e2d4" stroke={PH.ink} strokeWidth={1} strokeLinejoin="round" />
      <path d="M-8 -1v-7.5M8 -1v-7.5" stroke={PH.ink} strokeWidth={1.3} strokeLinecap="round" />
      <path d="M-8 -8.5q8 -5 16 0" fill="none" stroke={PH.ink} strokeWidth={1.3} />
      <path d="M-5 -1v-6.5M-1.7 -1v-8M1.7 -1v-8M5 -1v-6.5" stroke={PH.ink} strokeWidth={0.7} opacity={0.6} />
    </g>
  );
}

/** "Not here": a red ? that pops beside where something stopped wrong. */
export function WrongMark({ x, y, size = 14 }: { x: number; y: number; size?: number }) {
  return (
    <Txt x={x} y={y} size={size} color={PH.red} weight={800} className={POP}>
      ?
    </Txt>
  );
}

/** A soft shadow on the ground under a sticker, centred at (x, y). */
export function GroundShadow({ x, y, rx = 12, ry }: { x: number; y: number; rx?: number; ry?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry ?? rx * 0.18} fill={PH.ink} opacity={0.1} className="pointer-events-none" />;
}

// ---------------------------------------------------------------------------
// Things on the map.

/** A compass rose at (x, y): উ পূ দ প, with one arm lit if asked. */
export function Compass({ x, y, r = 16, lit }: { x: number; y: number; r?: number; lit?: "N" | "E" | "S" | "W" | null }) {
  const arms = [
    ["N", 0, -1, "উ"],
    ["E", 1, 0, "পূ"],
    ["S", 0, 1, "দ"],
    ["W", -1, 0, "প"],
  ] as const;
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill="#fff" stroke={PH.faint} strokeWidth={1} />
      {arms.map(([k, dx, dy, t]) => (
        <g key={k}>
          <path d={`M${x} ${y}L${x + dx * r * 0.72 + dy * 3} ${y + dy * r * 0.72 - dx * 3}L${x + dx * r * 0.95} ${y + dy * r * 0.95}L${x + dx * r * 0.72 - dy * 3} ${y + dy * r * 0.72 + dx * 3}Z`} fill={lit === k ? PH.blue : k === "N" ? PH.ink : PH.faint} className="transition-[fill] duration-300 motion-reduce:transition-none" />
          <text x={x + dx * (r + 8)} y={y + dy * (r + 8) + 3.5} fontSize={9} fontWeight={700} textAnchor="middle" fill={lit === k ? PH.blue : PH.mute}>
            {t}
          </text>
        </g>
      ))}
    </g>
  );
}

/** A school, bottom-centre at (x, y): the sticker school. `tone="mint"` is the found school. */
export function School({ x, y, s = 1, tone }: { x: number; y: number; s?: number; tone?: PhTone }) {
  return <SchoolS x={x} y={y} s={s * 0.85} lit={tone === "mint"} />;
}

/** তিথিদের বাসা and its gate, the gate's centre at (x, y). */
export function HomeGate({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-12 -14h24v-12l-12 -8l-12 8Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.8} />
      <path d="M-7 -6v-6M7 -6v-6" stroke="#64748b" strokeWidth={2} />
      <path d="M-7 -12q7 -4 14 0" fill="none" stroke="#64748b" strokeWidth={1.2} />
    </g>
  );
}

/** A bus stop sign, foot at (x, y). */
export function BusStop({ x, y, s = 1, tone = "amber" }: { x: number; y: number; s?: number; tone?: PhTone }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M0 0v-18" stroke={PH.ink} strokeWidth={1.2} />
      <rect x={-6} y={-26} width={12} height={9} rx={2} fill={TONE_HEX[tone]} />
      <rect x={-3.5} y={-24} width={7} height={4} rx={1} fill="#fff" />
    </g>
  );
}

/** তিথির লাল সাইকেল, wheels on y, centre x; `rider` puts তিথি on it. `flip` faces left. */
export function Bicycle({ x, y, s = 1, flip = false, rider = true, spin = 0 }: { x: number; y: number; s?: number; flip?: boolean; rider?: boolean; spin?: number }) {
  const R = 7;
  const spokes = (cx: number) => (
    <g transform={`rotate(${spin} ${cx} ${-R})`}>
      <path d={`M${cx - R + 1.5} ${-R}h${2 * R - 3}M${cx} ${-2 * R + 1.5}v${2 * R - 3}`} stroke="#94a3b8" strokeWidth={0.6} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} className="pointer-events-none">
      <ellipse cy={0.8} rx={20} ry={2.4} fill={PH.ink} opacity={0.1} />
      <circle cx={-10} cy={-R} r={R} fill="none" stroke={PH.ink} strokeWidth={1.6} />
      <circle cx={10} cy={-R} r={R} fill="none" stroke={PH.ink} strokeWidth={1.6} />
      {spokes(-10)}
      {spokes(10)}
      <path d={`M-10 ${-R}L-2 ${-R - 9}L7 ${-R - 9}L10 ${-R}M-2 ${-R - 9}L0 ${-R}L-10 ${-R}M0 ${-R}L7 ${-R - 9}M7 ${-R - 9}l-1 -4h4`} fill="none" stroke="#dc2626" strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M-4.5 -18h5" stroke={PH.ink} strokeWidth={2} strokeLinecap="round" />
      {rider && (
        <g>
          {/* তিথি: brick-red uniform, two braids, cream ribbons */}
          <path d={`M-2 -19L2 -9L0 ${-R}`} stroke="#f1e9da" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M-2 -20l4 -12" stroke="#b8473a" strokeWidth={7} strokeLinecap="round" />
          <path d="M1 -29l7 5" stroke="#c08458" strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={3} cy={-37} r={4.6} fill="#c08458" />
          <path d="M-1.6 -38q0 -5.4 4.6 -5.4t4.6 5.4q-2 -2.6 -4.6 -2.6t-4.6 2.6Z" fill="#1c1917" />
          <path d="M-1.2 -37q-2.4 3 -1.6 7" fill="none" stroke="#1c1917" strokeWidth={1.8} strokeLinecap="round" />
          <circle cx={-1.8} cy={-36.6} r={1.1} fill="#f5ecd7" />
        </g>
      )}
    </g>
  );
}

/**
 * A speedometer: needle at v of max, the number under it. Drawn as a sticker:
 * a soft dial face, a rounded track, five ticks, an ink needle. `settle` lets
 * the needle swing to a new reading with a small overshoot: use it where v
 * jumps (a reveal, a pick), never where a parent moves v every frame.
 */
export function Gauge({ x, y, r = 22, v, max, unit = "m/s", tone = "amber", digits = 1, settle = false }: { x: number; y: number; r?: number; v: number; max: number; unit?: string; tone?: PhTone; digits?: number; settle?: boolean }) {
  const t = Math.max(0, Math.min(1, v / max));
  const ang = Math.PI * (1 - t);
  const deg = -180 + 180 * t;
  return (
    <g className="pointer-events-none">
      <path d={`M${x - r - 5} ${y + 2}A${r + 5} ${r + 5} 0 0 1 ${x + r + 5} ${y + 2}Z`} fill="#fff" stroke={PH.faint} strokeWidth={0.8} />
      <path d={`M${x - r} ${y}A${r} ${r} 0 0 1 ${x + r} ${y}`} fill="none" stroke="#e8edf3" strokeWidth={4.5} strokeLinecap="round" />
      {t > 0.005 && <path d={`M${x - r} ${y}A${r} ${r} 0 0 1 ${x + Math.cos(ang) * r} ${y - Math.sin(ang) * r}`} fill="none" stroke={TONE_HEX[tone]} strokeWidth={4.5} strokeLinecap="round" />}
      {[0, 0.25, 0.5, 0.75, 1].map((q) => {
        const a = Math.PI * (1 - q);
        return <path key={q} d={`M${x + Math.cos(a) * (r - 6)} ${y - Math.sin(a) * (r - 6)}L${x + Math.cos(a) * (r - 9)} ${y - Math.sin(a) * (r - 9)}`} stroke={PH.mute} strokeWidth={0.8} strokeLinecap="round" />;
      })}
      <g
        style={{ transform: `translate(${x}px, ${y}px) rotate(${deg}deg)`, transitionDuration: settle ? "650ms" : "0ms" }}
        className="transition-transform ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none"
      >
        <path d={`M-2 0L${r * 0.8} 0`} stroke={PH.ink} strokeWidth={1.8} strokeLinecap="round" />
      </g>
      <circle cx={x} cy={y} r={2.6} fill={PH.ink} />
      <circle cx={x} cy={y} r={0.9} fill="#fff" />
      <text x={x} y={y + 13} fontSize={9} fontWeight={700} textAnchor="middle" fill={PH.ink} style={{ fontFamily: fontFor("0") }}>
        {`${v.toFixed(digits)} ${unit}`}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// The river road of EP 06–08 (the videos' road, scaled down): A = বাসার মোড়
// (km 0) → B = বটতলা (km 4) → C = নানুবাড়ি (km 6). A → B is one full wave,
// 4 km of road for a 3 km straight line; B → C a hairpin back towards A that
// stops 1.5 km from it. ROAD.KM units per km, along the road and straight.

const RA: [number, number] = [410, 520];
const RB: [number, number] = [1190, 520];
const RC: [number, number] = [771.6, 373.9];
const RS_SCALE = 0.2;
const R_OX = 40 - RA[0] * RS_SCALE;
const R_OY = 120 - RA[1] * RS_SCALE;
const rmap = (p: [number, number]): [number, number] => [p[0] * RS_SCALE + R_OX, p[1] * RS_SCALE + R_OY];

const RP: [number, number][] = [];
for (let i = 0; i <= 400; i++) {
  const u = i / 400;
  RP.push([RA[0] + 780 * u, RA[1] - 181.8 * Math.sin(2 * Math.PI * u) * (1 - 0.18 * Math.sin(Math.PI * u))]);
}
const R_NB = RP.length - 1;
{
  const tg = [RP[R_NB][0] - RP[R_NB - 1][0], RP[R_NB][1] - RP[R_NB - 1][1]];
  const tl = Math.hypot(tg[0], tg[1]);
  const c1 = [RB[0] + (164.3 * tg[0]) / tl, RB[1] + (164.3 * tg[1]) / tl];
  const c2 = [RC[0] + 200, RC[1]];
  for (let i = 1; i <= 300; i++) {
    const u = i / 300;
    const v = 1 - u;
    RP.push([
      v * v * v * RB[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * RC[0],
      v * v * v * RB[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * RC[1],
    ]);
  }
}
const RPS = RP.map(rmap);
const RSUM = [0];
for (let i = 1; i < RPS.length; i++) RSUM.push(RSUM[i - 1] + Math.hypot(RPS[i][0] - RPS[i - 1][0], RPS[i][1] - RPS[i - 1][1]));
const R_KM = RSUM[R_NB] / 4;

/** [x, y, heading in radians] at `km` along the road (0…6). */
function roadAt(km: number): [number, number, number] {
  const s = Math.max(0, Math.min(RSUM[RSUM.length - 1], km * R_KM));
  let lo = 0;
  let hi = RSUM.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (RSUM[m] <= s) lo = m;
    else hi = m;
  }
  const k = (s - RSUM[lo]) / (RSUM[hi] - RSUM[lo] || 1);
  const p = RPS[lo];
  const q = RPS[hi];
  return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, Math.atan2(q[1] - p[1], q[0] - p[0])];
}

/** The road as an SVG path from km k0 to km k1. */
function roadD(k0: number, k1: number) {
  const n = Math.max(2, Math.ceil(Math.abs(k1 - k0) * 24));
  const pts = Array.from({ length: n + 1 }, (_, i) => roadAt(k0 + ((k1 - k0) * i) / n));
  return "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L");
}

export const ROAD = {
  /** units per km, along the road and straight alike (52) */
  KM: R_KM,
  A: rmap(RA),
  B: rmap(RB),
  C: rmap(RC),
  at: roadAt,
  d: roadD,
  /** the sheet the road fits on */
  W: 260,
  H: 165,
  NAMES: { A: "বাসার মোড়", B: "বটতলা", C: "নানুবাড়ি" },
};

/**
 * The river road on its own: grey road, km stones 1–5, A/B/C dots with their
 * names. `upTo` = how many km of it to show (4 hides the B → C hairpin).
 */
export function RoadBase({ upTo = 6, stones = true, names = true }: { upTo?: number; stones?: boolean; names?: boolean }) {
  const pts: [string, [number, number], "start" | "end" | "middle", number][] = [
    ["A", ROAD.A, "middle", 16],
    ["B", ROAD.B, "middle", 16],
  ];
  if (upTo >= 6) pts.push(["C", ROAD.C, "middle", -9]);
  return (
    <g className="pointer-events-none">
      <path d={roadD(0, upTo)} stroke="#d6d3cb" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={roadD(0, upTo)} stroke="#fff" strokeWidth={0.8} strokeDasharray="3 4" fill="none" />
      {stones &&
        [1, 2, 3, 5].filter((k) => k < upTo).map((k) => {
          const [x, y, a] = roadAt(k);
          const nx = Math.sin(a) * -10;
          const ny = -Math.cos(a) * -10;
          return (
            <g key={k}>
              <rect x={x + nx - 4} y={y + ny - 5} width={8} height={9} rx={2.5} fill="#fff" stroke="#a8a29e" strokeWidth={0.8} />
              <text x={x + nx} y={y + ny + 2.2} fontSize={6} fontWeight={700} textAnchor="middle" fill={PH.mute} style={{ fontFamily: fontFor("1") }}>
                {k}
              </text>
            </g>
          );
        })}
      {pts.map(([n, p, , dy]) => (
        <g key={n}>
          <circle cx={p[0]} cy={p[1]} r={3.6} fill={PH.ink} />
          <text x={p[0]} y={p[1] + dy} fontSize={10} fontWeight={800} textAnchor="middle" fill={PH.ink} style={{ fontFamily: fontFor("A") }}>
            {n}
          </text>
          {names && (
            <text x={p[0]} y={p[1] + dy + (dy > 0 ? 10 : -11)} fontSize={7.5} fontWeight={600} textAnchor="middle" fill={PH.mute}>
              {ROAD.NAMES[n as "A" | "B" | "C"]}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

/** The road from km 0 to `km`, traced in cream dots: the distance travelled. */
export function RoadTrace({ km, from = 0 }: { km: number; from?: number }) {
  if (km - from < 0.02) return null;
  return <path d={roadD(from, km)} stroke={PH.cream} strokeWidth={3} strokeDasharray="0.1 4.5" strokeLinecap="round" fill="none" className="pointer-events-none" />;
}
