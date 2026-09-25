"use client";

import { POP, Stepper } from "@/components/journey/kit";
import { Card as CastCard } from "@/components/journey/cast";
import { Arrow, tup, type Frame, type Tone, type XY } from "@/components/journey/plane";

// The map pieces shared by the two road-to-school journeys: 5.5
// (lanes-journey.tsx, the card for the rickshaw mama) and 5.5b
// (twocard-journey.tsx, one school, two cards). The new neighbourhood: home at
// (0, 0), the school at (2, 3) on the map, main roads running east (1, 0) and
// lanes slanting north-east (1, 1), and no road north. The rickshaw and its
// mama are drawn here; they are not in the cast. Ink on the maps is fixed.

export const O: XY = [0, 0];
export const SCHOOL: XY = [2, 3];
/** the school's road card: (blocks straight, blocks slanting) */
export const CARD: XY = [-1, 3];

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

type Key = { name: string; label: string; v: XY; tone: Tone };

/** The two roads of the new neighbourhood, as buttons on 5.1's remote. */
export const ROADS: Key[] = [
  { name: "সোজা", label: "straight", v: [1, 0], tone: "blue" },
  { name: "বাঁকা", label: "slanting", v: [1, 1], tone: "coral" },
];

/** where a road card leaves the rickshaw on the map */
export const land = (amt: readonly number[]): XY => [amt[0] + amt[1], amt[1]];

/** A card's drive, one block at a time: up (or down) the lane first, then along the main road. */
export function route(c: readonly number[]): XY[] {
  const pts: XY[] = [O];
  let p = O;
  const sl = Math.sign(c[1]);
  for (let i = 0; i < Math.abs(c[1]); i += 1) {
    p = [p[0] + sl, p[1] + sl];
    pts.push(p);
  }
  const st = Math.sign(c[0]);
  for (let i = 0; i < Math.abs(c[0]); i += 1) {
    p = [p[0] + st, p[1]];
    pts.push(p);
  }
  return pts;
}

export const on = (f: Frame, [x, y]: XY) => x >= f.x0 - 1e-9 && x <= f.x1 + 1e-9 && y >= f.y0 - 1e-9 && y <= f.y1 + 1e-9;

/** How far one road button can still be pressed each way before the rickshaw would leave the map. */
function fitRange(amt: number[], i: number, f: Frame, min: number, max: number): [number, number] {
  const ok = (n: number) => on(f, land(amt.map((a, j) => (j === i ? n : a))));
  let lo = amt[i];
  let hi = amt[i];
  while (lo - 1 >= min && ok(lo - 1)) lo -= 1;
  while (hi + 1 <= max && ok(hi + 1)) hi += 1;
  return [lo, hi];
}

// ---------------------------------------------------------------------------
// The map pieces: the roads, the plain square grid, home, the places, the
// rickshaw, and a trip drawn block by block.

export type RoadKind = "slant" | "square" | "twin";

/**
 * The roads on a map. "slant": main roads east (blue) and lanes north-east
 * (coral). "square": main roads east and roads north. "twin": two roads that
 * run side by side along one slanting line through home, and nothing else.
 */
export function L_Roads({ f, kind = "slant", show = true, lanes = true, w = 3.2 }: { f: Frame; kind?: RoadKind; show?: boolean; lanes?: boolean; w?: number }) {
  const east: string[] = [];
  const other: string[] = [];
  if (kind !== "twin") for (let y = Math.ceil(f.y0); y <= Math.floor(f.y1); y += 1) east.push(`M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`);
  if (kind === "square") for (let x = Math.ceil(f.x0); x <= Math.floor(f.x1); x += 1) other.push(`M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`);
  if (kind === "slant" && lanes)
    for (let c = Math.floor(f.x0 - f.y1); c <= Math.ceil(f.x1 - f.y0); c += 1) {
      const ya = Math.max(f.y0, f.x0 - c);
      const yb = Math.min(f.y1, f.x1 - c);
      if (yb - ya > 0.05) other.push(`M${f.sx(ya + c)} ${f.sy(ya)}L${f.sx(yb + c)} ${f.sy(yb)}`);
    }
  const lo = Math.max(f.y0, f.x0);
  const hi = Math.min(f.y1, f.x1);
  const twin = `M${f.sx(lo)} ${f.sy(lo)}L${f.sx(hi)} ${f.sy(hi)}`;
  return (
    <g style={{ opacity: show ? 1 : 0 }} className="pointer-events-none transition-opacity duration-700 motion-reduce:transition-none">
      {kind === "twin" ? (
        <>
          <g transform="translate(-2.2 -2.2)">
            <path d={twin} strokeWidth={w} strokeLinecap="round" className="fill-none stroke-cat-blue/35" />
          </g>
          <g transform="translate(2.2 2.2)">
            <path d={twin} strokeWidth={w} strokeLinecap="round" className="fill-none stroke-cat-coral/35" />
          </g>
        </>
      ) : (
        <>
          <path d={other.join("")} strokeWidth={w} strokeLinecap="round" className={`fill-none ${kind === "square" ? "stroke-cat-teal/30" : "stroke-cat-coral/[0.17]"}`} />
          <path d={east.join("")} strokeWidth={w} strokeLinecap="round" className="fill-none stroke-cat-blue/[0.22]" />
        </>
      )}
    </g>
  );
}

/** The map's own thin square grid: east and north, as the paper is printed. */
export function L_Squares({ f, show = true }: { f: Frame; show?: boolean }) {
  let d = "";
  for (let x = Math.ceil(f.x0); x <= Math.floor(f.x1); x += 1) d += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  for (let y = Math.ceil(f.y0); y <= Math.floor(f.y1); y += 1) d += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  return (
    <path
      d={d}
      strokeWidth={0.9}
      style={{ opacity: show ? 1 : 0 }}
      className="pointer-events-none fill-none stroke-[#64748b]/45 transition-opacity duration-700 motion-reduce:transition-none"
    />
  );
}

/** Home, a small house on the point, with its name under it. */
export function L_Home({ f, at = O, name = true }: { f: Frame; at?: XY; name?: boolean }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 6.5} ${y + 5}V${y - 1.5}L${x} ${y - 7.5}L${x + 6.5} ${y - 1.5}V${y + 5}Z`} fill="#fde68a" stroke="#92400e" strokeWidth={1.1} />
      <rect x={x - 1.8} y={y + 0.5} width={3.6} height={4.5} fill="#92400e" />
      {name && (
        <text x={x} y={y + 16} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#5a6b7d">
          বাসা
        </text>
      )}
    </g>
  );
}

export type PlaceKind = "school" | "bazaar" | "mosque" | "fuchka";
const PLACE_NAME: Record<PlaceKind, string> = { school: "স্কুল", bazaar: "বাজার", mosque: "মসজিদ", fuchka: "ফুচকা" };

/** A place on the map, its icon on the point and its name above it; ringed when the rickshaw has arrived. */
export function L_Place({ f, at, kind, hit = false, name = true }: { f: Frame; at: XY; kind: PlaceKind; hit?: boolean; name?: boolean }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      {hit && <circle cx={x} cy={y} r={12} strokeWidth={2.2} className={`${POP} fill-none stroke-accent`} />}
      {kind === "school" && (
        <>
          <rect x={x - 7} y={y - 4} width={14} height={9} fill="#fecaca" stroke="#991b1b" strokeWidth={1} />
          <path d={`M${x - 8.5} ${y - 4}L${x} ${y - 9}L${x + 8.5} ${y - 4}Z`} fill="#dc2626" />
          <path d={`M${x} ${y - 9}V${y - 15}`} stroke="#334155" strokeWidth={0.9} />
          <path d={`M${x} ${y - 15}h5l-1.5 1.6l1.5 1.6h-5Z`} fill="#16a34a" />
          <rect x={x - 1.5} y={y + 0.5} width={3} height={4.5} fill="#991b1b" />
        </>
      )}
      {kind === "bazaar" && (
        <>
          <rect x={x - 7} y={y - 2} width={14} height={7} fill="#b45309" />
          <path d={`M${x - 8.5} ${y - 2}L${x - 6} ${y - 8}H${x + 6}L${x + 8.5} ${y - 2}Z`} fill="white" stroke="#b45309" strokeWidth={0.8} />
          <path d={`M${x - 5} ${y - 8}l-1.5 6M${x} ${y - 8}v6M${x + 5} ${y - 8}l1.5 6`} stroke="#ef4444" strokeWidth={2} />
        </>
      )}
      {kind === "mosque" && (
        <>
          <rect x={x - 6} y={y - 2} width={12} height={7} fill="#dcfce7" stroke="#166534" strokeWidth={0.9} />
          <path d={`M${x - 5} ${y - 2}Q${x - 5} ${y - 9} ${x} ${y - 10}Q${x + 5} ${y - 9} ${x + 5} ${y - 2}Z`} fill="#16a34a" />
          <path d={`M${x} ${y - 10}V${y - 13}M${x + 8} ${y + 5}V${y - 9}`} stroke="#166534" strokeWidth={1.4} />
          <circle cx={x + 8} cy={y - 10} r={1.4} fill="#16a34a" />
        </>
      )}
      {kind === "fuchka" && (
        <>
          <rect x={x - 7} y={y - 3} width={14} height={8} rx={1} fill="#fef3c7" stroke="#92400e" strokeWidth={0.9} />
          <circle cx={x - 3} cy={y - 5} r={2.6} fill="#f59e0b" stroke="#92400e" strokeWidth={0.6} />
          <circle cx={x + 2.5} cy={y - 5} r={2.6} fill="#f59e0b" stroke="#92400e" strokeWidth={0.6} />
          <path d={`M${x - 5} ${y + 5}v3M${x + 5} ${y + 5}v3`} stroke="#92400e" strokeWidth={1.2} />
        </>
      )}
      {name && (
        <text x={x} y={y - (kind === "school" ? 18 : 13)} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#5a6b7d">
          {PLACE_NAME[kind]}
        </text>
      )}
    </g>
  );
}

/** The rickshaw on a map, centred on its point; it glides to a new point over `ms`. */
export function L_Rickshaw({ f, at, ms = 300, facing = 1, s = 1 }: { f: Frame; at: XY; ms?: number; facing?: 1 | -1; s?: number }) {
  return (
    <g
      style={{ transform: `translate(${f.sx(at[0])}px, ${f.sy(at[1])}px)`, transitionDuration: `${ms}ms` }}
      className="pointer-events-none transition-transform ease-linear motion-reduce:transition-none"
    >
      <g transform={`scale(${facing * s} ${s})`}>
        <circle cx={-4} cy={3} r={3.6} fill="white" stroke="#0f1b2d" strokeWidth={1.3} />
        <circle cx={8} cy={4} r={2.6} fill="white" stroke="#0f1b2d" strokeWidth={1.2} />
        <path d="M-4 3L1 -3H6L8 4M6 -3L7.5 -8M6 -8H9.5" fill="none" stroke="#334155" strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round" />
        <rect x={-10} y={-5} width={9} height={3.5} rx={1} fill="#1d4ed8" />
        <path d="M-11 -4Q-11.5 -14 -4 -14Q-1 -14 -0.5 -9L-1 -4Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth={0.6} />
        <path d="M5 -3.5L6 -9" stroke="#16a34a" strokeWidth={3} strokeLinecap="round" />
        <circle cx={6.3} cy={-11.8} r={2.2} fill="#c68e5f" />
      </g>
    </g>
  );
}

/** A trip drawn block by block up to point `upto`: lane blocks coral, main-road blocks blue. */
export function L_Trail({ f, pts, upto, w = 2.2, draw = false }: { f: Frame; pts: XY[]; upto?: number; w?: number; draw?: boolean }) {
  const n = Math.min(upto ?? pts.length - 1, pts.length - 1);
  return (
    <>
      {pts.slice(1, n + 1).map((p, i) => (
        <Arrow key={`${i}:${tup(pts[i])}>${tup(p)}`} f={f} from={pts[i]} to={p} tone={p[1] !== pts[i][1] ? "coral" : "blue"} w={w} draw={draw} />
      ))}
    </>
  );
}

/** which way the rickshaw faces after the last block of a trip */
export const faceOf = (pts: XY[], k: number): 1 | -1 => (k > 0 && pts[k][0] < pts[k - 1][0] ? -1 : 1);

/** A road card as two coloured slots: (straight, slanting). */
export function L_CardText({ c, hit = false }: { c: readonly (number | null)[]; hit?: boolean }) {
  const s = (n: number | null) => (n === null ? "?" : n < 0 ? `−${-n}` : `${n}`);
  return (
    <span className={`font-mono font-bold ${hit ? "text-accent-text" : ""}`}>
      (<span className="text-cat-blue">{s(c[0])}</span>, <span className="text-cat-coral">{s(c[1])}</span>)
    </span>
  );
}

/**
 * The two road buttons, as 5.1's remote: one row per road, − and + around its
 * count, and a button simply runs out before the rickshaw would leave the map.
 */
export function L_Remote({ amt, onAmt, f, disabled = false }: { amt: number[]; onAmt: (i: number, n: number) => void; f: Frame; disabled?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[17rem] rounded-2xl border border-border bg-surface px-3 py-1.5">
      {ROADS.map((key, i) => {
        const [lo, hi] = fitRange(amt, i, f, -4, 5);
        return (
          <div key={key.label} className="flex items-center justify-between gap-2 py-1">
            <span className="text-sm whitespace-nowrap">
              <b className={i ? "text-cat-coral" : "text-cat-blue"}>{key.name}</b> <span className="font-mono text-[0.9rem]">{tup(key.v)}</span>
            </span>
            <Stepper value={amt[i]} onChange={(n) => onAmt(i, n)} min={lo} max={hi} disabled={disabled} label={key.name} />
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story-scene props: the big rickshaw with the rickshaw mama on the saddle,
// a card with a name over it, the school bell, and the measuring tape.

/** Passengers for the big rickshaw: shirt, skin and hair, as the cast draws them. */
const RIDER = {
  fahim: { shirt: "#2563eb", skin: "#e0ac7e", hair: "#1f1a17" },
  nasib: { shirt: "#dc2626", skin: "#d49a6a", hair: "#1c1917" },
} as const;

/**
 * The big rickshaw, wheels on the ground at (x, y), the rickshaw mama on the
 * saddle and up to two passengers on the seat. It glides to a new x over `ms`;
 * `facing` −1 turns it round to ride west.
 */
export function L_BigRick({
  x,
  y,
  ms = 1600,
  rider = true,
  facing = 1,
  riders = [],
}: {
  x: number;
  y: number;
  ms?: number;
  rider?: boolean;
  facing?: 1 | -1;
  riders?: (keyof typeof RIDER)[];
}) {
  return (
    <g
      style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }}
      className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none"
    >
      <g transform={`scale(${facing} 1)`}>
        <circle cx={-16} cy={-12} r={12} fill="none" stroke="#1f2937" strokeWidth={2.4} />
        <path d="M-16 -24V0M-28 -12H-4M-24.5 -20.5L-7.5 -3.5M-24.5 -3.5L-7.5 -20.5" stroke="#6b7280" strokeWidth={0.8} />
        <circle cx={30} cy={-9} r={9} fill="none" stroke="#1f2937" strokeWidth={2.2} />
        <path d="M30 -18V0M21 -9H39" stroke="#6b7280" strokeWidth={0.8} />
        <path d="M-16 -12L0 -24H19L30 -9M19 -24L29 -42M25 -42H34" fill="none" stroke="#334155" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        <rect x={-31} y={-35} width={27} height={9} rx={2} fill="#1d4ed8" />
        <path d="M-7 -26V-18H5" stroke="#334155" strokeWidth={2} fill="none" />
        <path d="M-34 -33Q-35 -64 -13 -64Q-4 -64 -3 -46L-4 -33Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth={1} />
        <path d="M-31 -52Q-19 -58 -7 -52M-30 -43Q-19 -48 -6 -43" stroke="#fde047" strokeWidth={2} fill="none" />
        {riders.map((who, i) => {
          const c = RIDER[who];
          const px = riders.length > 1 ? -18 + i * 9 : -12;
          return (
            <g key={who}>
              <rect x={px - 4.5} y={-45} width={9} height={11} rx={3} fill={c.shirt} />
              <circle cx={px} cy={-50} r={4.6} fill={c.skin} />
              <path d={`M${px - 4.6} -50.5Q${px} -57.5 ${px + 4.6} -50.5`} fill={c.hair} />
              <circle cx={px + 2} cy={-49.8} r={0.7} fill="#0f1b2d" />
            </g>
          );
        })}
        <path d="M17 -27h8" stroke="#0f1b2d" strokeWidth={3} strokeLinecap="round" />
        {rider && (
          <g>
            <path d="M19 -28L25 -14L22 -2" stroke="#6b21a8" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M18 -30L20 -48" stroke="#15803d" strokeWidth={9} strokeLinecap="round" />
            <path d="M21 -45L30 -42" stroke="#a16207" strokeWidth={3.2} strokeLinecap="round" />
            <circle cx={21} cy={-56} r={6.5} fill="#a16207" />
            <path d="M14.5 -58Q21 -65 27.5 -58" stroke="#f8fafc" strokeWidth={3} fill="none" />
            <path d="M16 -58h11" stroke="#ef4444" strokeWidth={1} strokeDasharray="2 2" />
            <circle cx={23.5} cy={-56} r={0.9} fill="#0f1b2d" />
            <path d="M21 -52.5q2.5 1.3 4 0" stroke="#0f1b2d" strokeWidth={0.9} fill="none" />
          </g>
        )}
      </g>
    </g>
  );
}

/** A card with a name over it, both in fixed ink. */
export function L_NamedCard({ x, y, name, text, tone }: { x: number; y: number; name: string; text: string; tone: "teal" | "amber" | "blue" | "coral" }) {
  return (
    <g className={POP}>
      <text x={x} y={y - 12} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#0f1b2d" stroke="white" strokeWidth={2.5} paintOrder="stroke">
        {name}
      </text>
      <CastCard x={x} y={y} text={text} tone={tone} />
    </g>
  );
}

/** A round wall clock at (x, y), its hands at `h`:`m`. */
export function L_Clock({ x, y, h, m, r = 13 }: { x: number; y: number; h: number; m: number; r?: number }) {
  const a = (t: number) => (t - 0.25) * Math.PI * 2;
  const hm = a(((h % 12) + m / 60) / 12);
  const mm = a(m / 60);
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill="white" stroke="#0f1b2d" strokeWidth={1.6} />
      {[0, 3, 6, 9].map((t) => (
        <circle key={t} cx={x + Math.cos(a(t / 12)) * (r - 3)} cy={y + Math.sin(a(t / 12)) * (r - 3)} r={0.9} fill="#0f1b2d" />
      ))}
      <path
        d={`M${x} ${y}L${x + Math.cos(hm) * r * 0.5} ${y + Math.sin(hm) * r * 0.5}`}
        stroke="#0f1b2d"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path d={`M${x} ${y}L${x + Math.cos(mm) * r * 0.8} ${y + Math.sin(mm) * r * 0.8}`} stroke="#dc2626" strokeWidth={1.3} strokeLinecap="round" />
    </g>
  );
}

/** The school bell on a post: a brass bell whose lines show when it rings. */
export function L_Bell({ x, y, ringing = false }: { x: number; y: number; ringing?: boolean }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x} ${y - 8}V${y}`} stroke="#57534e" strokeWidth={1.6} />
      <path d={`M${x - 7} ${y + 14}Q${x - 7} ${y} ${x} ${y}Q${x + 7} ${y} ${x + 7} ${y + 14}Z`} fill="#d97706" stroke="#92400e" strokeWidth={1} />
      <circle cx={x} cy={y + 16} r={2} fill="#92400e" />
      {ringing && (
        <g className={POP}>
          <path d={`M${x - 13} ${y + 2}l-6 -4M${x - 14} ${y + 10}h-8M${x + 13} ${y + 2}l6 -4M${x + 14} ${y + 10}h8`} stroke="#b45309" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

/** The measuring tape from 3.4: a yellow case at (x, y) with `len` units of tape pulled out to the right. */
export function L_TapeCase({ x, y, len = 0 }: { x: number; y: number; len?: number }) {
  return (
    <g className="pointer-events-none">
      {len > 0 && <path d={`M${x + 6} ${y + 2.5}H${x + 6 + len}`} strokeWidth={2.4} className="stroke-[#eab308]" />}
      <rect x={x - 6} y={y - 5.5} width={12} height={11} rx={2.5} fill="#facc15" stroke="#a16207" strokeWidth={1} />
      <circle cx={x} cy={y} r={2.4} fill="#a16207" />
    </g>
  );
}

/** A ✓ or ✕ drawn as a path (glyphs render as emoji on Linux). */
export function L_Tick({ x, y, ok }: { x: number; y: number; ok: boolean }) {
  return ok ? (
    <path d={`M${x - 4} ${y}l3 3.5l6 -7`} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={`${POP} fill-none stroke-[#15803d]`} />
  ) : (
    <path d={`M${x - 3.5} ${y - 3.5}l7 7m0 -7l-7 7`} strokeWidth={2.2} strokeLinecap="round" className={`${POP} fill-none stroke-[#dc2626]`} />
  );
}

/** A tape laid on a map from `from` to `to`, with its end ring. */
export function L_Tape({ f, from = O, to }: { f: Frame; from?: XY; to: XY }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${f.sx(from[0])} ${f.sy(from[1])}L${f.sx(to[0])} ${f.sy(to[1])}`} strokeWidth={4.5} strokeLinecap="round" className="stroke-[#eab308]" />
      <path d={`M${f.sx(from[0])} ${f.sy(from[1])}L${f.sx(to[0])} ${f.sy(to[1])}`} strokeWidth={4.5} strokeDasharray="1.2 5" className="stroke-[#a16207]" />
      <circle cx={f.sx(to[0])} cy={f.sy(to[1])} r={4.5} strokeWidth={1.2} className="fill-[#facc15] stroke-[#a16207]" />
    </g>
  );
}
