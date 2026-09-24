"use client";

import { useId, type ReactNode } from "react";

import { POP } from "@/components/journey/kit";
import { clamp, makeFrame, sg, type Frame, type XY } from "@/components/journey/plane";

// Shared pieces for the two rooftop journeys: 5.6 (rooftop-journey.tsx, the
// rent and Fahim's new grid) and 5.6b (fairgrid-journey.tsx, what stays real
// when the grid turns). Chacha's khata, the flat dots, the rooftop set,
// Chacha and the jilapi. No screens here: every export is a helper.
//
// The khata's rents are invented: about 8000 taka per size step, give or
// take 1000, so a one-column rule fits at most 3 of 8 flats and the
// imbalance barely matters (a least-squares fit gives about 7950 per size
// step and about 180 per imbalance step). Rents are in thousand taka.

export const O: XY = [0, 0];
export const R2 = Math.SQRT2;

/** A story scene takes `story` and ignores it (see journey.tsx). */
export type Story = { story?: boolean };

/** the rooftop's floor line on a Stage */
export const GROUND = 150;

/** a number as it's said: 2.5, 3, −0.5 */
export const say = (n: number) => sg(Math.round(n * 100) / 100);

export type Flat = { bed: number; bath: number; rent: number };
export const FLATS: Flat[] = [
  { bed: 1, bath: 1, rent: 7 },
  { bed: 2, bath: 1, rent: 11 },
  { bed: 2, bath: 2, rent: 16 },
  { bed: 3, bath: 1, rent: 17 },
  { bed: 3, bath: 2, rent: 20 },
  { bed: 3, bath: 3, rent: 25 },
  { bed: 4, bath: 3, rent: 27 },
  { bed: 5, bath: 3, rent: 32 },
];
export const sizeOf = (f: Flat) => (f.bed + f.bath) / 2;
export const imbOf = (f: Flat) => (f.bed - f.bath) / 2;
export const ROOF: XY = [4, 2];
/** within 1000 taka counts as a fit */
export const fits = (guess: number, rent: number) => Math.abs(guess - rent) <= 1;

/** the khata's (bed, bath) sheet */
export const KF = makeFrame(-0.4, 5.6, -0.4, 3.6, 38, 16);

/** a rent's colour: pale yellow when cheap, deep red when dear */
export const heat = (r: number) => {
  const t = clamp((r - 6) / 28, 0, 1);
  return `hsl(${Math.round(46 - 42 * t)} 85% ${Math.round(80 - 38 * t)}%)`;
};
export const heatInk = (r: number) => (r >= 20 ? "#ffffff" : "#3b2a0a");

/** one flat on a sheet: a dot in its rent's colour, the rent written on it (or a plain dot with no rent) */
export function FlatDot({ f, at, rent, ring = null, r = 10 }: { f: Frame; at: XY; rent: number | null; ring?: "fit" | "miss" | null; r?: number }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      {ring && (
        <circle
          cx={x}
          cy={y}
          r={r + 3.5}
          fill="none"
          strokeWidth={2.4}
          stroke={ring === "fit" ? "#16a34a" : "#dc2626"}
          className="transition-[stroke] duration-500 motion-reduce:transition-none"
        />
      )}
      <circle cx={x} cy={y} r={r} style={{ fill: rent === null ? "#b45309" : heat(rent) }} stroke="#0f1b2d" strokeOpacity={0.25} />
      {rent !== null && (
        <text x={x} y={y + 3.2} textAnchor="middle" fontSize={r * 0.9} fontWeight={700} fill={heatInk(rent)} fontFamily="ui-monospace, monospace">
          {rent}
        </text>
      )}
    </g>
  );
}

/** an axis name in small grey ink */
export function AxisName({ x, y, anchor = "middle", children }: { x: number; y: number; anchor?: "start" | "middle" | "end"; children: ReactNode }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={9} fontWeight={700} className="pointer-events-none fill-[#5a6b7d]">
      {children}
    </text>
  );
}

/** "bed" along, "bath" up, on a khata-shaped sheet */
export function BedBath({ f, x = 5.5, y = 3.45 }: { f: Frame; x?: number; y?: number }) {
  return (
    <>
      <AxisName x={f.sx(x)} y={f.sy(0) - 5} anchor="end">
        bed
      </AxisName>
      <AxisName x={f.sx(0) + 5} y={f.sy(y)} anchor="start">
        bath
      </AxisName>
    </>
  );
}

/** Children clipped to the white sheet, for tilted grid lines. `name` keeps ids apart in a shot. */
export function Clipped({ f, name, children }: { f: Frame; name: string; children: ReactNode }) {
  const id = `${name}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

/** Fahim's grid on the (bed, bath) sheet: lines of equal size and of equal imbalance, every `step` (half a step by default). */
export function TiltGrid({ f, className = "stroke-cat-violet/40", step = 0.5 }: { f: Frame; className?: string; step?: number }) {
  const seg = (a: XY, b: XY) => `M${f.sx(a[0])} ${f.sy(a[1])}L${f.sx(b[0])} ${f.sy(b[1])}`;
  let d = "";
  for (let s = -2; s <= 6; s += step) d += seg([s - 8, s + 8], [s + 8, s - 8]);
  for (let m = -4; m <= 4; m += step) d += seg([m - 8, -m - 8], [m + 8, -m + 8]);
  return <path d={d} strokeWidth={0.7} className={`pointer-events-none fill-none ${className}`} />;
}

/** the little square where two arrows meet at a right angle, at the origin, for arrows along (1, 1) and (1, −1) */
export function RightMark({ f, s = 0.22 }: { f: Frame; s?: number }) {
  const p = (x: number, y: number) => `${f.sx(x)} ${f.sy(y)}`;
  return <path d={`M${p(s, s)}L${p(2 * s, 0)}L${p(s, -s)}`} fill="none" strokeWidth={1.6} className={`${POP} stroke-[#0f1b2d]`} />;
}

/** A name under someone's feet: for a character the cast doesn't have (চাচা), and for anyone on a night stage, where the cast's dark label can't be read. */
export function NameTag({ x, y, name, night = false }: { x: number; y: number; name: string; night?: boolean }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={8} fontWeight={700} className={night ? "fill-[#cbd5e1]" : "fill-[#5a6b7d]"} pointerEvents="none">
      {name}
    </text>
  );
}

/** Chacha, the landlord: white panjabi, white tupi, grey beard. Feet at (x, y), cast scale. `arm="hold"` holds his red khata. */
export function Chacha({ x, y, facing = 1, arm = "down" }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "hold" | "point" }) {
  const armR = arm === "hold" ? "M8 -37l9 -6" : arm === "point" ? "M8 -37l13 -3" : "M8 -38l3 14";
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)` }} className="pointer-events-none transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
      <g transform={`scale(${facing} 1)`}>
        <path d="M-3.5 -16V-1M3.5 -16V-1" strokeWidth={5} strokeLinecap="round" stroke="#e7e5e4" />
        <path d="M-9 -40h18l2.5 27h-23Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth={0.8} />
        <path d="M-8 -38l-3 14" strokeWidth={4} strokeLinecap="round" stroke="#b07a52" />
        <path d={armR} strokeWidth={4} strokeLinecap="round" stroke="#b07a52" />
        {arm === "hold" && <rect x={15} y={-52} width={11} height={14} rx={1} fill="#b91c1c" stroke="#7f1d1d" strokeWidth={0.6} />}
        <circle cy={-51} r={9} fill="#b07a52" />
        <path d="M-7.5 -49q1 11 7.5 12q6.5 -1 7.5 -12q-3 4 -7.5 4q-4.5 0 -7.5 -4Z" fill="#9ca3af" />
        <path d="M-8.8 -55.5q8.8 -10 17.6 0Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth={0.6} />
        <circle cx={-3.4} cy={-51} r={1.2} fill="#0f1b2d" />
        <circle cx={3.4} cy={-51} r={1.2} fill="#0f1b2d" />
      </g>
    </g>
  );
}

/** a paper cone of jilapi, the cone's tip at (x, y); `half` draws half the coils */
export function Jilapi({ x, y, s = 1, half = false }: { x: number; y: number; s?: number; half?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-9 -16L0 4L9 -16Z" fill="#fef3c7" stroke="#a16207" strokeWidth={0.8} />
      <circle cx={-3.5} cy={-19} r={3.4} fill="none" stroke="#f97316" strokeWidth={2.2} />
      {!half && <circle cx={3.5} cy={-19.5} r={3.4} fill="none" stroke="#ea580c" strokeWidth={2.2} />}
      {!half && <circle cx={0} cy={-24.5} r={3} fill="none" stroke="#f59e0b" strokeWidth={2.2} />}
    </g>
  );
}

/** the rooftop: the city behind, a parapet, the new rooftop flat on the left, a water tank on the right */
export function RoofSet({ lit = false }: { lit?: boolean }) {
  return (
    <g className="pointer-events-none">
      {[
        [96, 36],
        [128, 52],
        [176, 30],
        [214, 46],
        [250, 38],
      ].map(([x, h]) => (
        <rect key={x} x={x} y={132 - h} width={30} height={h} fill="#94a3b8" opacity={0.45} />
      ))}
      <rect x={0} y={132} width={320} height={18} fill="#e7e5e4" stroke="#a8a29e" strokeWidth={0.8} />
      <rect y={150} width={320} height={30} fill="#d6d3d1" />
      <rect x={6} y={78} width={62} height={72} fill="#fde7c7" stroke="#a8a29e" strokeWidth={1} />
      <rect x={2} y={74} width={70} height={6} fill="#a8a29e" />
      <rect x={16} y={110} width={16} height={40} fill="#92400e" />
      <rect x={42} y={96} width={18} height={14} fill={lit ? "#fde047" : "#93c5fd"} stroke="#64748b" strokeWidth={0.6} className="transition-[fill] duration-700 motion-reduce:transition-none" />
      <text x={37} y={90} textAnchor="middle" fontSize={7} fontWeight={700} fill="#78350f" fontFamily="ui-monospace, monospace">
        (4, 2)
      </text>
      <rect x={284} y={96} width={26} height={30} rx={4} fill="#1f2937" />
      <rect x={288} y={126} width={4} height={6} fill="#1f2937" />
      <rect x={302} y={126} width={4} height={6} fill="#1f2937" />
    </g>
  );
}
