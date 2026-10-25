"use client";

import { useState, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, LOOK, Nope, POP, Scene, primaryBtn, useScene, useSeed, type Fixtures, type Look } from "@/components/journey/kit";
import { Bubble, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { Bicycle, PArrow, PH, ROAD, RoadBase, RoadTrace, Ripple, Sheet, Tag, Txt, WrongMark, chip, svgPoint, useWalk } from "@/components/interactive/phy-kit";

// Screens for "Physics for High School 6 — দূরত্ব আর সরণ"
// (src/content/articles/physics_for_high_school/chapter_2/06_distance_displacement.mdx),
// the journey of video EP 06 (physics_9_10/06-distance-displacement/script.md).
// Book §2.4, pp. 39–40.
//
// The spine: 4 km of cycling, only 3 km from the start. The reader bets what
// happens to that 3 km if তিথি rides 2 km more (MoreRoadBet); it is settled on
// the last screen. On the way, the video's own beats on its river road: ride
// A → B and the odometer counts 4 (RideToB), the 4 km laid on a tape, every
// way it turned forgotten (CountKm), the straight arrow A → B (DrawArrow), the
// arrow measured, 3 km (MeasureArrow), on to C: more road, less arrow
// (OnToC), back B → A, the arrow flips (BackToA), the full loop home in Your
// turn (LoopHome), and the same unit for both (SameUnit).
//
// Road canon (phy-kit's ROAD, the video's): A km 0 বাসার মোড়, B km 4 বটতলা,
// C km 6 নানুবাড়ি. A → B path 4 km, displacement 3 km; A → C path 6 km,
// displacement 1.5 km; A → C → A 12 km, 0. The scoreboard is the video's:
// দূরত্ব in cream (the odometer), সরণ in mint with a little direction dial.
//
// Reusable for EP 07–08: RiverRoad (the road sheet with its river, বটগাছ and
// নানুবাড়ি), RoadRider (তিথি's bike sitting on the road at a km), Scoreboard,
// NanuHouse, Banyan, VecName (AB with an arrow on top), chordKm.

type Story = { story?: boolean };
type P = [number, number];

const W = ROAD.W;
const H = 188;
const KM = ROAD.KM;
const A = ROAD.A as P;
const B = ROAD.B as P;

const at = (km: number): P => {
  const [x, y] = ROAD.at(km);
  return [x, y];
};
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const angleOf = (from: P, to: P) => Math.atan2(to[1] - from[1], to[0] - from[0]);
/** The straight-line km from `from` to the point `km` along the road. */
export const chordKm = (from: [number, number], km: number) => {
  const p = at(km);
  return Math.hypot(p[0] - from[0], p[1] - from[1]) / KM;
};
/** 4 → "4", 2.34 → "2.3", 1.4999 → "1.5". */
const fmt = (v: number) => {
  const r = Math.round(v);
  return Math.abs(v - r) < 0.05 ? `${r}` : v.toFixed(1);
};

// ---------------------------------------------------------------------------
// The road and what sits on it. On a Sheet the house and the tree are
// stickers (one ink line, a soft shadow); `flat` keeps the cast's own look for
// the Stage story scenes.

/** নানুবাড়ি: a small tin-roofed house, bottom-centre at (x, y). */
export function NanuHouse({ x, y, s = 1, flat = false }: { x: number; y: number; s?: number; flat?: boolean }) {
  const ink = flat ? undefined : PH.ink;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      {!flat && <ellipse cy={1} rx={14} ry={2.2} fill={PH.ink} opacity={0.1} />}
      <rect x={-9} y={-11} width={18} height={11} rx={0.8} fill="#f5ecd7" stroke={ink ?? "#b08a4a"} strokeWidth={flat ? 0.7 : 0.8} />
      <path d="M-12 -10.5L0 -20L12 -10.5Z" fill="#c2410c" stroke={ink} strokeWidth={0.8} strokeLinejoin="round" />
      <rect x={-2.2} y={-6.5} width={4.4} height={6.5} fill="#7c5a3a" />
      <rect x={4} y={-8.5} width={3.4} height={3} fill="#93c5fd" stroke={ink} strokeWidth={0.5} />
    </g>
  );
}

/** The বটগাছ at বটতলা, foot at (x, y). The sticker's ink line runs round the whole crown, not each puff. */
export function Banyan({ x, y, s = 1, flat = false }: { x: number; y: number; s?: number; flat?: boolean }) {
  const puffs: [number, number, number, string][] = [
    [-8, -19, 7.5, "#4d7c4f"],
    [8, -19, 7.5, "#4d7c4f"],
    [0, -25, 9.5, "#5b8f5c"],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      {!flat && <ellipse cy={0.8} rx={13} ry={2} fill={PH.ink} opacity={0.1} />}
      <rect x={-2.6} y={-15} width={5.2} height={15} rx={1} fill="#7c5a3a" stroke={flat ? undefined : PH.ink} strokeWidth={0.8} />
      <path d="M-9 -12v12M9 -12v12" stroke="#7c5a3a" strokeWidth={0.8} />
      {!flat && puffs.map(([cx, cy, r]) => <circle key={`o${cx}${cy}`} cx={cx} cy={cy} r={r} fill={PH.ink} stroke={PH.ink} strokeWidth={1.6} />)}
      {puffs.map(([cx, cy, r, c]) => (
        <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={r} fill={c} />
      ))}
    </g>
  );
}

/**
 * The river road of EP 06–08 on its sheet (ROAD.W × 188): the নদী along the
 * bottom, the বটগাছ at B, নানুবাড়ি at C (when the road reaches it), and the
 * road from phy-kit. The top-left corner is left free for the Scoreboard.
 */
export function RiverRoad({ label, upTo = 6, sheet, children }: { label: string; upTo?: number; sheet?: Partial<Parameters<typeof Sheet>[0]>; children?: ReactNode }) {
  const river = "M6 178C50 170 100 186 150 177S226 171 254 178";
  return (
    <Sheet w={W} h={H} label={label} bg={PH.ground} {...sheet}>
      <g className="pointer-events-none">
        <path d={river} stroke="#bfdbfe" strokeWidth={10} strokeLinecap="round" fill="none" />
        <path d={river} stroke="#93c5fd" strokeWidth={0.8} strokeDasharray="5 5" fill="none" />
        <Txt x={238} y={167} size={8} color="#3b82f6">
          নদী
        </Txt>
      </g>
      <Banyan x={228} y={126} s={1.15} />
      {upTo >= 6 && <NanuHouse x={142} y={84} s={1.1} />}
      <RoadBase upTo={upTo} />
      {children}
    </Sheet>
  );
}

/** তিথি on her bike, sitting on the road at `km`; `back` faces towards A. Tilts with the road, at most 45°. */
export function RoadRider({ km, back = false, s = 0.72, ghost = false }: { km: number; back?: boolean; s?: number; ghost?: boolean }) {
  const [x, y, h0] = ROAD.at(km);
  const h = back ? h0 + Math.PI : h0;
  const left = Math.cos(h) < 0;
  let deg = ((left ? h - Math.PI : h) * 180) / Math.PI;
  deg = ((((deg + 180) % 360) + 360) % 360) - 180;
  deg = Math.max(-45, Math.min(45, deg));
  return (
    <g transform={`translate(${x} ${y}) rotate(${deg.toFixed(1)})`} opacity={ghost ? 0.35 : 1} className="pointer-events-none">
      <Bicycle x={0} y={3} s={s} flip={left} spin={km * 400} />
    </g>
  );
}

/**
 * The video's scoreboard, top-left: দূরত্ব in cream (the odometer) and সরণ in
 * mint with a small dial that points the arrow's way (a dot for 0). `disp`
 * null shows ?, undefined hides the সরণ row; `dir` in radians on the sheet.
 */
export function Scoreboard({ x = 6, y = 6, w = 104, dist, disp, dir = 0 }: { x?: number; y?: number; w?: number; dist: number | null; disp?: number | null; dir?: number }) {
  const two = disp !== undefined;
  const h = two ? 46 : 25;
  const cx = x + w - 13;
  const cy = y + 35;
  const zero = typeof disp === "number" && disp < 0.04;
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y} width={w} height={h} rx={7} fill="#fff" stroke={PH.faint} strokeWidth={1.2} />
      <Txt x={x + 8} y={y + 16.5} size={9.5} anchor="start" color={PH.cream} weight={700}>
        দূরত্ব
      </Txt>
      <Txt x={x + w - 8} y={y + 16.5} size={10} anchor="end" weight={700}>
        {dist === null ? "?" : `${fmt(dist)} km`}
      </Txt>
      {two && (
        <>
          <path d={`M${x + 6} ${y + 24}H${x + w - 6}`} stroke={PH.faint} strokeWidth={0.8} />
          <Txt x={x + 8} y={y + 38.5} size={9.5} anchor="start" color={PH.mint} weight={700}>
            সরণ
          </Txt>
          <Txt x={x + w - 24} y={y + 38.5} size={10} anchor="end" color={disp === null ? PH.amber : PH.mint} weight={700}>
            {disp === null ? "?" : `${fmt(disp)} km`}
          </Txt>
          <circle cx={cx} cy={cy} r={6.5} fill={PH.mintSoft} stroke={PH.mint} strokeWidth={1} />
          {disp !== null &&
            (zero ? (
              <circle cx={cx} cy={cy} r={1.8} fill={PH.mint} />
            ) : (
              <g transform={`translate(${cx} ${cy}) rotate(${((dir * 180) / Math.PI).toFixed(1)})`}>
                <path d="M-3.6 0H1.6" stroke={PH.mint} strokeWidth={1.4} strokeLinecap="round" />
                <path d="M4.3 0L0.6 -2.7V2.7Z" fill={PH.mint} />
              </g>
            ))}
        </>
      )}
    </g>
  );
}

/** A vector's name, the letters with an arrow over them (AB⃗), centred at (x, y). */
export function VecName({ x, y, text, size = 12, color = PH.ink }: { x: number; y: number; text: string; size?: number; color?: string }) {
  const half = text.length * size * 0.3;
  const top = y - size * 0.95;
  return (
    <g className="pointer-events-none">
      <Txt x={x} y={y} size={size} color={color} weight={800}>
        {text}
      </Txt>
      <path d={`M${x - half} ${top}H${x + half - 2}`} stroke={color} strokeWidth={1.1} />
      <path d={`M${x + half + 1} ${top}l-3.6 -2.2v4.4Z`} fill={color} />
    </g>
  );
}

/** A km stone the bike has passed, lit cream (drawn over RoadBase's own). */
function StoneLit({ km }: { km: number }) {
  const [x, y, a] = ROAD.at(km);
  const sx = x - 10 * Math.sin(a);
  const sy = y + 10 * Math.cos(a);
  return (
    <g className={`pointer-events-none ${POP}`}>
      <rect x={sx - 4.5} y={sy - 5.5} width={9} height={10} rx={2.5} fill={PH.creamSoft} stroke={PH.cream} strokeWidth={1.2} />
      <Txt x={sx} y={sy + 2.4} size={6.5} color={PH.cream} weight={800}>
        {`${km}`}
      </Txt>
    </g>
  );
}

/**
 * Drag the bike forward along the road, from `km` up to `end`: the pointer
 * pulls it to the nearest road point a little ahead (never back, never across
 * a bend). A new km stone ticks the pedal.
 */
function useRideDrag(km: number, setKm: (k: number) => void, end: number, onEnd: () => void, locked: boolean) {
  const [drag, setDrag] = useState(false);
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (locked || km >= end) return;
    const [px, py] = svgPoint(e, W, H);
    let best = km;
    let bd = Infinity;
    for (let k = km; k <= Math.min(end, km + 0.6) + 1e-9; k += 0.02) {
      const [x, y] = ROAD.at(k);
      const d = (x - px) ** 2 + (y - py) ** 2;
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    if (bd > 30 * 30 || best <= km + 1e-6) return;
    const next = best >= end - 0.04 ? end : best;
    if (Math.floor(next) > Math.floor(km)) sfx.pedal();
    setKm(next);
    if (next >= end) onEnd();
  };
  return {
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      setDrag(true);
      move(e);
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      if (drag) move(e);
    },
    onPointerUp: () => setDrag(false),
  };
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: তিথি rides off from বাসার মোড় along the river
// towards নানুবাড়ি; then the video's hook, two chips: চালালেন 4 km, সরলেন 3 km, ?

export function RiverRide({}: Story) {
  const s = useScene(2, [600, 1900]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="নদীর পাড়ের রাস্তায় তিথি সাইকেল চালিয়ে নানুবাড়ি যাচ্ছে। উপরে দুইটা chip: চালালেন 4 km, সরলেন 3 km, আর একটা প্রশ্নবোধক।">
        <path d="M0 166C70 160 130 172 200 165S290 161 320 166V180H0Z" fill="#93c5fd" />
        <Banyan x={292} y={150} s={1.8} flat />
        <path d="M22 150V108" stroke="#7c5a3a" strokeWidth={1.6} />
        <rect x={3} y={98} width={40} height={12} rx={2} fill="#fff" stroke="#7c5a3a" strokeWidth={0.8} />
        <text x={23} y={106.5} fontSize={7} fontWeight={700} textAnchor="middle" fill={PH.ink}>
          বাসার মোড়
        </text>
        <g style={{ transform: `translate(${k >= 1 ? 228 : 64}px, 0px)` }} className="transition-transform duration-[1700ms] ease-in-out motion-reduce:transition-none">
          <Bicycle x={0} y={150} s={1.5} />
        </g>
        {k >= 2 && (
          <>
            <Tag x={84} y={62} text="চালালেন 4 km" tone="cream" pop />
            <Tag x={190} y={62} text="সরলেন 3 km" tone="mint" pop />
            <Txt x={250} y={68} size={18} color={PH.amber} weight={800} className={POP}>
              ?
            </Txt>
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: তিথি rides 2 km more. What happens to how far she is from
// the start? The pick grows the road bar 4 → 6 and lays a ghost bar for the
// সরা that is longer, the same, or shorter, ending in a ?. Not marked.

const BET = ["আরো বেড়ে যাবে", "একই থাকবে", "কমেও যেতে পারে"];
const BET_TO = [4.8, 3, 1.3];
const BU = 22;
const BX = 80;

export function MoreRoadBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const walk = useWalk(800, { steps: false });
  const t = bet === null ? 0 : walk.running ? walk.t : 1;
  const road = 4 + 2 * t;
  const ghost = bet === null ? 3 : 3 + (BET_TO[bet] - 3) * t;
  const choose = (i: number) => {
    setBet(i);
    sfx.stamp();
    walk.start();
    pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।");
  };
  return (
    <>
      <Sheet w={W} h={96} label="দুইটা দাগ: কত চালালেন, আর শুরু থেকে কত সরলেন। আন্দাজ বাছলে প্রথম দাগ 6 km হয়, দ্বিতীয়টার পাশে একটা প্রশ্নবোধক দাগ পড়ে।" className="max-w-[22rem]">
        <Txt x={10} y={31} size={9} anchor="start" color={PH.cream} weight={700}>
          কত চালালেন
        </Txt>
        <path d={`M${BX} 28H${BX + road * BU}`} stroke={PH.cream} strokeWidth={3.2} strokeDasharray="0.1 4.5" strokeLinecap="round" />
        <Tag x={BX + road * BU + 19} y={28} text={`${fmt(road)} km`} tone="cream" />
        <Txt x={10} y={65} size={9} anchor="start" color={PH.mint} weight={700}>
          কত সরলেন
        </Txt>
        <path d={`M${BX} 62H${BX + 3 * BU}`} stroke={PH.mint} strokeWidth={4} strokeLinecap="round" opacity={bet === null ? 1 : 0.35} />
        {bet === null && <Tag x={BX + 3 * BU + 19} y={62} text="3 km" tone="mint" />}
        {bet !== null && (
          <g className="pointer-events-none">
            <path d={`M${BX} 78H${BX + ghost * BU}`} stroke={PH.blue} strokeWidth={3} strokeDasharray="5 3" strokeLinecap="round" />
            <Tag x={BX + ghost * BU + 15} y={78} text="?" tone="blue" />
            <Txt x={BX + 3 * BU + 18} y={65} size={8} color={PH.mint} weight={700}>
              3 km
            </Txt>
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
      <Task done={bet !== null}>তিথি আরো 2 km চালালে, শুরুর জায়গা থেকে কত সরবে? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The road and the odometer: the reader drags তিথির সাইকেল along the road
// from A to B. A cream dotted trail follows, each km stone lights as it is
// passed, and the scoreboard's দূরত্ব ticks 0 → 4 km.

export function RideToB() {
  const pass = useGate();
  const [km, setKm] = useSeed("km", 0);
  const [from, setFrom] = useState(0);
  const walk = useWalk(1800, { steps: false });
  const done = km >= 4;
  const finish = () => {
    sfx.chime();
    pass("পথ ধরে যতটা গেলো, সেটাই দূরত্ব।");
  };
  const drag = useRideDrag(km, setKm, 4, finish, walk.running);
  const now = walk.running ? from + (4 - from) * walk.t : km;
  const auto = () => {
    if (walk.running || done) return;
    setFrom(km);
    sfx.pedal();
    walk.start(() => {
      setKm(4);
      finish();
    });
  };
  return (
    <>
      <RiverRoad label="নদীর পাড়ের আঁকাবাঁকা রাস্তা, A বাসার মোড় থেকে B বটতলা, পাশে মাইলফলক। তিথির সাইকেল A-তে। উপরে বাঁয়ে দূরত্বের হিসাব।" upTo={4} sheet={{ ...drag, className: "max-w-[22rem] cursor-grab" }}>
        <RoadTrace km={now} />
        {[1, 2, 3].filter((k) => now >= k).map((k) => (
          <StoneLit key={k} km={k} />
        ))}
        {now < 0.05 && <circle cx={A[0]} cy={A[1]} r={13} fill="none" stroke={PH.amber} strokeWidth={1.4} strokeDasharray="3 2.5" className="pointer-events-none" />}
        <RoadRider km={now} />
        {now >= 4 && <Ripple at={[B[0], B[1] - 12]} tone="cream" />}
        {now >= 4 && <Tag x={B[0] - 4} y={B[1] - 46} text="4 km" tone="cream" solid pop />}
        <Scoreboard dist={now} />
      </RiverRoad>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={auto} disabled={walk.running || done} className="cursor-pointer text-sm text-muted underline underline-offset-2 hover:text-foreground disabled:cursor-default disabled:opacity-40">
          টানতে না পারলে, এখানে tap করুন
        </button>
      </div>
      <Task done={done}>তিথির সাইকেলটা রাস্তা ধরে টেনে A থেকে B-তে নিয়ে যান। দূরত্বের হিসাব দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · দূরত্বে দিক নেই: the 4 km of road, each turned its own way. A tap on a km
// lifts it off the road and lays it straight on a tape at the top, one after
// the other, whichever way it had turned. The tape reads 4 km, with no head.

const X3_TY = 36;
const X3_X0 = (W - 4 * KM) / 2;
const X3_N = 12;
const piece = (i: number): P[] => Array.from({ length: X3_N + 1 }, (_, j) => at(i + j / X3_N));
const tapeAt = (slot: number): P[] => Array.from({ length: X3_N + 1 }, (_, j) => [X3_X0 + (slot + j / X3_N) * KM, X3_TY] as P);
const ptsD = (pts: P[]) => "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L");

export function CountKm() {
  const pass = useGate();
  const [laid, setLaid] = useSeed<number[]>("laid", []);
  const walk = useWalk(650, { steps: false });
  const done = laid.length >= 4;
  const t = walk.running ? walk.t : 1;
  const lay = (i: number) => {
    if (walk.running || laid.includes(i)) return;
    const next = [...laid, i];
    setLaid(next);
    sfx.tape(0.4);
    walk.start(() => {
      if (next.length === 4) {
        sfx.chime();
        pass("দূরত্বে দিক নেই, শুধু কত km।");
      }
    });
  };
  return (
    <>
      <RiverRoad label="A থেকে B-এর রাস্তা, চার কিলোমিটারে ভাগ করা। উপরে একটা খালি ফিতা। tap করা কিলোমিটার সোজা হয়ে ফিতায় বসে।" upTo={4}>
        <rect x={X3_X0 - 3} y={X3_TY - 6} width={4 * KM + 6} height={12} rx={3} fill="#fff" stroke={PH.faint} strokeDasharray="3 2" className="pointer-events-none" />
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k} className="pointer-events-none">
            <path d={`M${X3_X0 + k * KM} ${X3_TY + 6}v3`} stroke={PH.mute} strokeWidth={0.8} />
            <Txt x={X3_X0 + k * KM} y={X3_TY + 16} size={6.5} color={PH.mute}>
              {`${k}`}
            </Txt>
          </g>
        ))}
        {[0, 1, 2, 3]
          .filter((i) => !laid.includes(i))
          .map((i) => (
            <g key={i} onClick={() => lay(i)} className="cursor-pointer" role="button" aria-label={`${i + 1} নম্বর কিলোমিটার`}>
              <path d={ROAD.d(i + 0.05, i + 0.95)} stroke={PH.amber} strokeOpacity={0.5} strokeWidth={6} strokeLinecap="round" fill="none" className="pointer-events-none" />
              <path d={ROAD.d(i, i + 1)} stroke="transparent" strokeWidth={18} fill="none" pointerEvents="stroke" />
            </g>
          ))}
        {laid.map((i, slot) => {
          const tt = slot === laid.length - 1 ? t : 1;
          const goal = tapeAt(slot);
          return (
            <g key={i} className="pointer-events-none">
              <path d={ptsD(piece(i).map((p, j) => lerp(p, goal[j], tt)))} stroke={PH.cream} strokeWidth={3.2} strokeDasharray="0.1 4.5" strokeLinecap="round" fill="none" />
              {tt >= 1 && (
                <Txt x={X3_X0 + (slot + 0.5) * KM} y={X3_TY - 10} size={7} color={PH.cream} weight={700}>
                  1 km
                </Txt>
              )}
            </g>
          );
        })}
        <RoadRider km={4} />
        {done && t >= 1 && <Tag x={W / 2} y={X3_TY + 31} text="দূরত্ব 4 km · scalar" tone="cream" solid pop />}
      </RiverRoad>
      <div className="mt-2 text-center text-sm">
        <span className="font-semibold">ফিতায় উঠেছে:</span> <span className="font-mono">{laid.length} km</span>
        <span className="ml-1 text-muted">/ 4 km</span>
      </div>
      <Task done={done && !walk.running}>রাস্তার চারটা কিলোমিটার একটা একটা করে tap করে ফিতায় তুলুন। কোনটা কোন দিকে ঘুরেছিল, ফিতায় কি সেটা থাকে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · A থেকে দেখলে B কোথায়? The reader pulls a straight arrow out of A and lets
// go on B; it snaps there, turns mint and is named সরণ · Displacement. Let go
// anywhere else and it stays where it fell, red.

export function DrawArrow() {
  const pass = useGate();
  const [tip, setTip] = useSeed<P | null>("tip", null);
  const [drag, setDrag] = useState(false);
  const [miss, setMiss] = useState(0);
  const done = !!tip && tip[0] === B[0] && tip[1] === B[1];
  const aim = (e: React.PointerEvent<SVGSVGElement>) => setTip(svgPoint(e, W, H));
  const up = () => {
    if (!drag) return;
    setDrag(false);
    if (!tip || done) return;
    if (Math.hypot(tip[0] - B[0], tip[1] - B[1]) < 16) {
      setTip(B);
      sfx.pop();
      pass("শুরু থেকে শেষ, সোজা তীর: সরণ।");
    } else {
      setMiss((m) => m + 1);
      sfx.slip();
    }
  };
  const long = !!tip && Math.hypot(tip[0] - A[0], tip[1] - A[1]) > 6;
  return (
    <>
      <RiverRoad
        label="A থেকে B-এর রাস্তা, তিথি B-তে। A থেকে টেনে একটা সোজা তীর আঁকা যায়।"
        upTo={4}
        sheet={{
          onPointerDown: (e) => {
            if (done) return;
            setDrag(true);
            aim(e);
          },
          onPointerMove: (e) => drag && !done && aim(e),
          onPointerUp: up,
          className: "max-w-[22rem] cursor-crosshair",
        }}
      >
        <RoadTrace km={4} />
        <RoadRider km={4} />
        {!tip && <circle cx={A[0]} cy={A[1]} r={11} fill="none" stroke={PH.amber} strokeWidth={1.4} strokeDasharray="3 2.5" className="pointer-events-none" />}
        {!done && <circle cx={B[0]} cy={B[1]} r={11} fill="none" stroke={PH.mint} strokeWidth={1.2} strokeDasharray="2.5 2.5" className="pointer-events-none" />}
        {tip && long && <PArrow a={A} b={tip} tone={done ? "mint" : drag ? "blue" : "red"} tell={done ? "A থেকে B-এর দিকে" : false} />}
        {tip && long && !done && !drag && <WrongMark x={Math.min(Math.max(tip[0] + 12, 10), W - 8)} y={Math.max(tip[1] - 6, 16)} />}
        {done && <Ripple at={B} />}
        {done && <Tag x={148} y={106} text="সরণ · Displacement" tone="mint" solid pop />}
        <Scoreboard dist={4} disp={null} />
      </RiverRoad>
      {tip && !done && !drag && <Nope key={miss}>তীরের মাথা B-তে পড়েনি। A থেকে টেনে একদম B-এর উপর ছাড়ুন, রাস্তা ধরার দরকার নেই।</Nope>}
      <Task done={done}>A থেকে B পর্যন্ত একটা সোজা তীর টানুন: sheet-এ টেনে তীরের মাথা B-এর উপর ছাড়ুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · How long is the arrow? Three tapes; the picked one unrolls from A along
// the arrow. 4 km (the road's number) overshoots B by 1 km; 2 km stops short;
// 3 km ends on B, and the scoreboard's সরণ reads 3 km with its dial.

const X5_OPTS = [4, 3, 2];
const X5_RIGHT = 1;
const X5_NOPE = [
  "ফিতা B ছাড়িয়ে আরও 1 km চলে গেলো। 4 km হলো রাস্তা ধরে, আঁকাবাঁকা পথে। তীর তো সোজা।",
  "",
  "ফিতা B-এর 1 km আগেই ফুরিয়ে গেলো। তীরটা আরো লম্বা।",
];
const X5_RY = 122.5;

export function MeasureArrow() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(1200, { steps: false });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.tape(0.6);
    walk.start(() => {
      if (i === X5_RIGHT) {
        sfx.chime();
        pass("সরণ 3 km, মাথা দেখায় দিক।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const len = pick === null ? 0 : X5_OPTS[pick] * KM * t;
  const right = pick === X5_RIGHT && !walk.running;
  const wrong = pick !== null && pick !== X5_RIGHT && !walk.running;
  return (
    <>
      <RiverRoad label="A থেকে B-এর সোজা তীর, নিচে একটা ফিতা A থেকে খুলে যায়। ফিতার দাগে কিলোমিটার লেখা।" upTo={4}>
        <RoadTrace km={4} />
        <RoadRider km={4} />
        <PArrow a={A} b={B} tone={right ? "mint" : "blue"} tell={right ? "3 km, B-এর দিকে" : false} />
        {len > 1 && (
          <g className="pointer-events-none">
            <rect x={A[0]} y={X5_RY} width={len} height={6} rx={1.5} fill={PH.amberSoft} stroke={wrong ? PH.red : PH.amber} strokeWidth={1} />
            {Array.from({ length: 5 }, (_, k) => k + 1)
              .filter((k) => k * KM <= len + 0.5)
              .map((k) => (
                <g key={k}>
                  <path d={`M${A[0] + k * KM} ${X5_RY}v6`} stroke={PH.amber} strokeWidth={0.9} />
                  <Txt x={A[0] + k * KM - 4} y={X5_RY + 5} size={5.5} color={PH.amber} weight={800}>
                    {`${k}`}
                  </Txt>
                </g>
              ))}
            {!walk.running && <path d={`M${A[0] + len} ${X5_RY - 4}v13`} stroke={right ? PH.mint : PH.red} strokeWidth={1.8} strokeLinecap="round" />}
          </g>
        )}
        {wrong && <WrongMark x={Math.min(A[0] + len + 9, W - 8)} y={X5_RY + 24} />}
        {right && <Ripple at={B} />}
        <Scoreboard dist={4} disp={right ? 3 : null} dir={0} />
      </RiverRoad>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-sm">
        <span className="mr-0.5">ফিতা:</span>
        {X5_OPTS.map((o, i) => (
          <button key={o} type="button" disabled={walk.running || right} className={`${chip(pick === i)} font-mono`} onClick={() => choose(i)}>
            {o} km
          </button>
        ))}
      </div>
      {wrong && pick !== null && <Nope key={miss}>{X5_NOPE[pick]}</Nope>}
      <Task done={right}>তীরটা কত লম্বা? একটা ফিতা বেছে নিন, A থেকে খুলে দেখুন B-তে গিয়ে থামে কি না।</Task>
    </>
  );
}

// 5½ · Figure for screen 5's explanation: the arrow's two parts. Its length is
// the মান (3 km), its head the দিক; both together, a vector, written AB with an
// arrow on top.

const S5_SAY = ["A থেকে B, একটা সোজা তীর।", "তীরের দৈর্ঘ্য 3 km। এটা সরণের মান।", "তীরের মাথা দেখায় দিক।", "মান আর দিক দুটোই: vector। লিখি AB, মাথায় তীর।"];

export function ArrowName({}: Story) {
  const s = useScene(3, [600, 1600, 1600]);
  const k = s.k;
  const a: P = [34, 72];
  const b: P = [34 + 3 * KM, 72];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <Sheet w={230} h={108} label="A থেকে B-এর তীর: দৈর্ঘ্য 3 km, মাথা দিক দেখায়, নাম AB।" className="max-w-[17rem]">
        {[a, b].map((p, i) => (
          <g key={i} className="pointer-events-none">
            <circle cx={p[0]} cy={p[1]} r={3.4} fill={PH.ink} />
            <Txt x={p[0]} y={p[1] + 16} size={10} weight={800}>
              {i ? "B" : "A"}
            </Txt>
          </g>
        ))}
        <PArrow a={a} b={b} tone="mint" w={3} tell="3 km, B-এর দিকে" />
        {k >= 1 && <Tag x={(a[0] + b[0]) / 2} y={a[1] + 16} text="মান: 3 km" tone="ink" pop />}
        {k >= 2 && (
          <g className="pointer-events-none">
            <circle cx={b[0] - 4} cy={b[1]} r={10} fill="none" stroke={PH.amber} strokeWidth={1.8} className={POP} />
            <Tag x={b[0] - 4} y={b[1] - 22} text="দিক" tone="amber" solid pop />
          </g>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <VecName x={64} y={34} text="AB" size={15} />
            <Tag x={122} y={28} text="vector" tone="mint" solid pop />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · Story scene for screen 6: তিথি rides on to নানুবাড়ি; the odometer says
// 6 km; she says সরণ এখন আরো বেশি!

export function ToNanuBari({}: Story) {
  const s = useScene(2, [600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="তিথি সাইকেল চালিয়ে নানুবাড়ি পৌঁছালো। মোট দূরত্ব 6 km। তিথি ভাবছে, সরণ এখন আরো বেশি।">
        <path d="M0 168C70 162 130 174 200 167S290 163 320 168V180H0Z" fill="#93c5fd" />
        <NanuHouse x={268} y={150} s={3.2} flat />
        <text x={268} y={162} fontSize={8} fontWeight={700} textAnchor="middle" fill={PH.ink}>
          নানুবাড়ি
        </text>
        <g style={{ transform: `translate(${k >= 1 ? 186 : 36}px, 0px)` }} className="transition-transform duration-[1600ms] ease-out motion-reduce:transition-none">
          <Bicycle x={0} y={150} s={1.5} />
        </g>
        {k >= 1 && <Tag x={78} y={60} text="দূরত্ব 6 km" tone="cream" pop />}
        {k >= 2 && <Bubble x={190} y={88} lines={["সরণ এখন", "আরো বেশি!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6 · More road, less arrow: the reader drags the bike on from B to C. The
// arrow from A follows the bike, and the scoreboard runs both ways at once:
// দূরত্ব 4 → 6 up, সরণ 3 → 1.5 down. তিথির claim sits in red at the top.

export function OnToC() {
  const pass = useGate();
  const [km, setKm] = useSeed("km", 4);
  const [from, setFrom] = useState(4);
  const walk = useWalk(1500, { steps: false });
  const done = km >= 6;
  const finish = () => {
    sfx.chime();
    pass("বেশি পথ চালিয়েও সরণ কমে গেলো।");
  };
  const drag = useRideDrag(km, setKm, 6, finish, walk.running);
  const now = walk.running ? from + (6 - from) * walk.t : km;
  const tip = at(now);
  const auto = () => {
    if (walk.running || done) return;
    setFrom(km);
    sfx.pedal();
    walk.start(() => {
      setKm(6);
      finish();
    });
  };
  return (
    <>
      <RiverRoad label="পুরো রাস্তা, A থেকে B হয়ে C নানুবাড়ি। তিথি B-তে। A থেকে তিথি পর্যন্ত একটা সোজা তীর, উপরে বাঁয়ে দূরত্ব আর সরণের হিসাব।" sheet={{ ...drag, className: "max-w-[22rem] cursor-grab" }}>
        <RoadTrace km={now} />
        <PArrow a={A} b={B} tone="ink" opacity={0.25} tell="3 km, B-এর দিকে" />
        {now > 4.02 && <PArrow a={A} b={tip} tone="mint" tell={done ? "1.5 km, C-এর দিকে" : false} />}
        {done && <Ripple at={tip} r={22} />}
        <RoadRider km={now} />
        <Tag x={196} y={18} text="তিথি: সরণ আরো বেশি!" tone="red" />
        {done && <path d="M150 18H242" stroke={PH.red} strokeWidth={1.6} strokeLinecap="round" className={`pointer-events-none ${FADE}`} />}
        {done && <Tag x={196} y={40} text="বেশি পথ ≠ বেশি সরণ" tone="mint" solid pop />}
        <Scoreboard dist={now} disp={chordKm(A, now)} dir={angleOf(A, tip)} />
      </RiverRoad>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={auto} disabled={walk.running || done} className="cursor-pointer text-sm text-muted underline underline-offset-2 hover:text-foreground disabled:cursor-default disabled:opacity-40">
          টানতে না পারলে, এখানে tap করুন
        </button>
      </div>
      <Task done={done}>সাইকেলটা B থেকে টেনে নানুবাড়ি C-তে নিয়ে যান। দূরত্ব আর সরণ, দুইটার হিসাবই দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Back B → A. Which arrow is this ride's সরণ? Three small pictures. Each
// pick rides the bike back (the odometer counts 4 km again), then lays the
// picked arrow: head on B means she'd have ended at B (a ghost bike there),
// 0 means she never left B; head on A lands on the bike.

const X7_RIGHT = 2;
const X7_LABEL = ["মাথা B-তে", "সরণ 0", "মাথা A-তে"];
const X7_NOPE = [
  "এই তীরের মাথা B-তে, মানে তিথি শেষে B-তেই থাকতো। কিন্তু ও তো এখন A-তে। সরণের মাথা থাকে শেষের জায়গায়।",
  "সরণ 0 মানে তিথি B ছেড়ে নড়েইনি। কিন্তু ও 3 km দূরের A-তে চলে এসেছে।",
  "",
];

function BackPic({ i }: { i: number }) {
  const a: P = [14, 17];
  const b: P = [70, 17];
  return (
    <svg viewBox="0 0 84 34" className="mx-auto block h-auto w-full max-w-[5.5rem]" aria-hidden="true">
      <rect x={0.5} y={0.5} width={83} height={33} rx={6} fill="#fff" stroke={PH.faint} />
      {i === 0 && <PArrow a={a} b={b} tone="ink" w={2} tell={false} />}
      {i === 2 && <PArrow a={b} b={a} tone="ink" w={2} tell={false} />}
      {i === 1 && <circle cx={b[0]} cy={b[1]} r={4} fill="none" stroke={PH.ink} strokeWidth={1.6} />}
      {[a, b].map((p, j) => (
        <g key={j}>
          <circle cx={p[0]} cy={p[1]} r={2} fill={PH.ink} />
          <Txt x={p[0]} y={30} size={7.5} weight={800}>
            {j ? "B" : "A"}
          </Txt>
        </g>
      ))}
    </svg>
  );
}

export function BackToA() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(1800, { steps: false });
  const choose = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pedal();
    walk.start(() => {
      if (i === X7_RIGHT) {
        sfx.chime();
        pass("উল্টো পথে সরণও উল্টো: BA = −AB।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = pick === null ? 0 : walk.running ? walk.t : 1;
  const km = 4 - 4 * t;
  const bike = at(km);
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X7_RIGHT;
  const look = (i: number): Look => (pick === i ? (settled ? (i === X7_RIGHT ? "right" : "wrong") : "picked") : "idle");
  return (
    <>
      <RiverRoad label="A থেকে B-এর রাস্তা। তিথি B-তে, মুখ A-এর দিকে। ফেরার পথে সরণের তীর কোনটা, নিচে বাছতে হবে।" upTo={4}>
        {pick !== null && <RoadTrace from={km} km={4} />}
        {walk.running && t > 0.04 && <PArrow a={B} b={bike} tone="blue" tell={false} />}
        {settled && pick === 0 && (
          <>
            <PArrow a={A} b={B} tone="red" draw tell="3 km, B-এর দিকে" />
            <RoadRider km={4} ghost />
            <WrongMark x={B[0] - 2} y={B[1] - 42} />
          </>
        )}
        {settled && pick === 1 && (
          <g className={`pointer-events-none ${POP}`}>
            <circle cx={B[0]} cy={B[1]} r={6} fill={PH.redSoft} stroke={PH.red} strokeWidth={1.6} />
            <Tag x={B[0] + 22} y={B[1] - 12} text="0" tone="red" />
            <RoadRider km={4} ghost />
          </g>
        )}
        {right && <PArrow a={B} b={A} tone="mint" draw tell="3 km, A-এর দিকে" />}
        {right && <Ripple at={A} />}
        <RoadRider km={km} back />
        {right && (
          <g className={`pointer-events-none ${POP}`}>
            <rect x={150} y={14} width={98} height={26} rx={8} fill={PH.mintSoft} stroke={PH.mint} strokeWidth={1.1} />
            <VecName x={170} y={33} text="BA" color={PH.mint} />
            <Txt x={199} y={33} size={12} color={PH.mint} weight={800}>
              = −
            </Txt>
            <VecName x={227} y={33} text="AB" color={PH.mint} />
          </g>
        )}
        <Scoreboard dist={4 * t} disp={chordKm(B, km)} dir={angleOf(B, bike)} />
      </RiverRoad>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X7_LABEL.map((l, i) => (
          <button key={l} type="button" disabled={walk.running || right} onClick={() => choose(i)} className={`cursor-pointer rounded-xl border-2 px-1.5 pt-1.5 pb-1 text-sm transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look(i)]}`}>
            <BackPic i={i} />
            <span className="mt-0.5 block text-center">{l}</span>
          </button>
        ))}
      </div>
      {settled && pick !== X7_RIGHT && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={right}>তিথি B থেকে A-তে ফিরবে। এই ফেরার সরণ কোন তীর? বেছে নিন, তারপর দেখুন ও কোথায় থামে।</Task>
    </>
  );
}

// 7½ · Figure for screen 7's explanation: the two arrows side by side, same
// length, opposite heads; BA = −AB.

const S7_SAY = ["A থেকে B: 3 km, মাথা B-এর দিকে।", "B থেকে A: একই 3 km, মাথা A-এর দিকে।", "একই মান, উল্টো দিক।"];

export function FlipArrow({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  const a: P = [36, 56];
  const b: P = [36 + 3 * KM, 56];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S7_SAY[k]}</span>}>
      <Sheet w={230} h={112} label="A আর B, উপরে AB তীর, নিচে BA তীর। দুইটা সমান লম্বা, মাথা উল্টো।" className="max-w-[17rem]">
        {[a, b].map((p, i) => (
          <g key={i} className="pointer-events-none">
            <circle cx={p[0]} cy={p[1]} r={3.2} fill={PH.ink} />
            <Txt x={p[0] + (i ? 12 : -12)} y={p[1] + 4} size={10} weight={800}>
              {i ? "B" : "A"}
            </Txt>
          </g>
        ))}
        <PArrow a={[a[0], a[1] - 12]} b={[b[0], b[1] - 12]} tone="mint" tell="3 km, B-এর দিকে" />
        <VecName x={(a[0] + b[0]) / 2} y={a[1] - 20} text="AB" size={11} color={PH.mint} />
        {k >= 1 && <PArrow key="ba" a={[b[0], b[1] + 12]} b={[a[0], a[1] + 12]} tone="amber" draw tell="3 km, A-এর দিকে" />}
        {k >= 1 && (
          <g className={FADE}>
            <VecName x={(a[0] + b[0]) / 2} y={a[1] + 34} text="BA" size={11} color={PH.amber} />
          </g>
        )}
        {k >= 2 && (
          <g className={`pointer-events-none ${POP}`}>
            <rect x={136} y={86} width={86} height={22} rx={7} fill="#fff" stroke={PH.ink} strokeWidth={1} />
            <VecName x={153} y={102} text="BA" size={11} />
            <Txt x={179} y={102} size={11} weight={800}>
              = −
            </Txt>
            <VecName x={204} y={102} text="AB" size={11} />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn: the whole loop home, A → C → A. The reader fills the
// scoreboard first (দূরত্ব and সরণ), then runs the ride. The bike goes out
// and back, the odometer runs to 12 km, the arrow grows, shrinks and ends as a
// dot at A; the reader's guess is checked against it.

const X8_DIST = [6, 12, 0];
const X8_DISP = [12, 1.5, 0];
const X8_NOPE_DIST: Record<number, string> = {
  6: "চাকা ঘুরলো 12 km: যেতে 6, ফিরতে আরো 6। দূরত্ব পুরো পথটাই গোনে।",
  0: "দূরত্ব 0 মানে তিথি নড়েইনি। scoreboard গুনলো 12 km।",
};
const X8_NOPE_DISP: Record<number, string> = {
  12: "12 km তো রাস্তা ধরে, ওটা দূরত্ব। তিথি থামলো A-তেই। শুরু থেকে শেষের তীর কত লম্বা?",
  1.5: "1.5 km হতো C-তে থামলে। তিথি C থেকে আবার A-তে ফিরে এসেছে।",
};

export function LoopHome() {
  const pass = useGate();
  const [d, setD] = useSeed<number | null>("dist", null);
  const [s, setS] = useSeed<number | null>("disp", null);
  const [ran, setRan] = useSeed<{ dist: number; disp: number } | null>("ran", null);
  const [miss, setMiss] = useState(0);
  // One steady ride out and back: the odometer runs at an even rate.
  const walk = useWalk(2600, { steps: false, ease: "linear" });
  const go = () => {
    if (d === null || s === null || walk.running) return;
    const r = { dist: d, disp: s };
    setRan(r);
    sfx.pedal();
    walk.start(() => {
      if (r.dist === 12 && r.disp === 0) {
        sfx.chime();
        pass("পুরো পথ ঘুরে এলে সরণ শূন্য।");
      } else setMiss((m) => m + 1);
    });
  };
  const t = ran === null ? 0 : walk.running ? walk.t : 1;
  const sKm = 12 * t;
  const back = sKm > 6;
  const pos = back ? 12 - sKm : sKm;
  const tip = at(pos);
  const settled = ran !== null && !walk.running;
  const right = settled && ran.dist === 12 && ran.disp === 0;
  const same = ran !== null && ran.dist === d && ran.disp === s;
  const nope = !ran ? "" : ran.dist !== 12 ? X8_NOPE_DIST[ran.dist] : X8_NOPE_DISP[ran.disp];
  return (
    <>
      <RiverRoad label="পুরো রাস্তা A থেকে C। তিথি A-তে। চালালে ও C পর্যন্ত গিয়ে আবার A-তে ফেরে, উপরে বাঁয়ে দূরত্ব আর সরণের হিসাব।" sheet={{ className: "max-w-[21rem]" }}>
        <RoadTrace km={Math.min(sKm, 6)} />
        {pos > 0.05 && <PArrow a={A} b={tip} tone="mint" tell={false} />}
        <RoadRider km={pos} back={back} />
        {right && <Ripple at={A} />}
        {right && (
          <g className={`pointer-events-none ${POP}`}>
            <circle cx={A[0]} cy={A[1]} r={6} fill="none" stroke={PH.mint} strokeWidth={2} />
            <Tag x={A[0] + 4} y={A[1] - 44} text="সরণ = 0" tone="mint" solid />
          </g>
        )}
        <Scoreboard dist={sKm} disp={chordKm(A, pos)} dir={angleOf(A, tip)} />
        {settled && !right && <WrongMark x={118} y={ran.dist !== 12 ? 27 : 49} />}
      </RiverRoad>
      <div className="mx-auto mt-2 flex w-full max-w-[21rem] flex-wrap items-center justify-center gap-1.5 text-sm">
        <span className="w-12 font-semibold text-[#b08a4a]">দূরত্ব</span>
        {X8_DIST.map((v) => (
          <button key={v} type="button" disabled={walk.running || right} className={`${chip(d === v)} font-mono`} onClick={() => setD(v)}>
            {v} km
          </button>
        ))}
      </div>
      <div className="mx-auto mt-1.5 flex w-full max-w-[21rem] flex-wrap items-center justify-center gap-1.5 text-sm">
        <span className="w-12 font-semibold text-[#059669]">সরণ</span>
        {X8_DISP.map((v) => (
          <button key={v} type="button" disabled={walk.running || right} className={`${chip(s === v)} font-mono`} onClick={() => setS(v)}>
            {v} km
          </button>
        ))}
        <button type="button" className={`${primaryBtn} h-9! px-4!`} disabled={d === null || s === null || walk.running || right} onClick={go}>
          চালান
        </button>
      </div>
      {settled && !right && same && <Nope key={miss}>{nope}</Nope>}
      <Task done={right}>তিথি A থেকে C গিয়ে আবার A-তে ফিরবে। আগে আপনার উত্তর বাছুন: দূরত্ব কত, সরণ কত। তারপর চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Same unit, one difference. Three chips come down one at a time: একক m,
// মাত্রা L, দিক. The reader sends each to দূরত্ব, সরণ or both; it flies there.
// A wrong card keeps it in red and a Nope says why; right ones stay.

type Bin = "d" | "s" | "both";
const X9_CHIPS: { text: string; right: Bin }[] = [
  { text: "একক: m", right: "both" },
  { text: "মাত্রা: L", right: "both" },
  { text: "দিক", right: "s" },
];
const X9_BINS: [Bin, string][] = [
  ["d", "শুধু দূরত্ব"],
  ["s", "শুধু সরণ"],
  ["both", "দুইটাতেই"],
];
const X9_NOPE: Record<string, string> = {
  "0d": "m গেলো শুধু দূরত্বে। কিন্তু সরণও তো লম্বায় মাপি, 3 km। সরণের এককও m।",
  "0s": "m গেলো শুধু সরণে। কিন্তু দূরত্ব 4 km-ও তো লম্বা। ওর এককও m।",
  "1d": "দুজনেই দৈর্ঘ্য মাপে, তাই মাত্রা দুজনেরই L। সরণকে বাদ দিলেন কেন?",
  "1s": "দুজনেই দৈর্ঘ্য মাপে, তাই মাত্রা দুজনেরই L। দূরত্বকে বাদ দিলেন কেন?",
  "2d": "দিক গেলো দূরত্বে। কিন্তু দূরত্ব শুধু গোনে কত km, পথ যেমনই ঘুরুক।",
  "2both": "দূরত্বের তো কোনো দিক নেই। মাথাওয়ালা তীরটা কার?",
};
const X9_HOME: P = [140, 18];
const X9_CX: Record<"d" | "s", number> = { d: 72, s: 208 };
const slotOf = (card: "d" | "s", i: number): P => [X9_CX[card], 94 + i * 18];
const cardsOf = (b: Bin): ("d" | "s")[] => (b === "both" ? ["d", "s"] : [b]);

export function SameUnit() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pick, setPick] = useSeed<Bin | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(520, { steps: false, ease: "out" });
  const finished = round >= X9_CHIPS.length;
  const cur = X9_CHIPS[Math.min(round, X9_CHIPS.length - 1)];
  const choose = (b: Bin) => {
    if (walk.running || finished) return;
    setPick(b);
    sfx.whoosh(0.25);
    const r = round;
    walk.start(() => {
      if (b === X9_CHIPS[r].right) {
        sfx.pop();
        setRound(r + 1);
        setPick(null);
        if (r + 1 === X9_CHIPS.length) {
          sfx.chime();
          pass("একক একই, m। পার্থক্য শুধু দিক।");
        }
      } else setMiss((m) => m + 1);
    });
  };
  const t = walk.running ? walk.t : 1;
  const wrong = pick !== null && !walk.running && !finished;
  return (
    <>
      <Sheet w={280} h={150} label="দুইটা card: দূরত্ব আর সরণ। উপরে একটা chip, ওটা কোন card-এ যাবে বাছতে হবে।" className="max-w-[22rem]">
        {(["d", "s"] as const).map((c) => (
          <g key={c} className="pointer-events-none">
            <rect x={X9_CX[c] - 62} y={36} width={124} height={108} rx={10} fill={c === "d" ? PH.creamSoft : PH.mintSoft} stroke={c === "d" ? PH.cream : PH.mint} strokeWidth={1.2} />
            <Txt x={X9_CX[c]} y={53} size={11} weight={800} color={c === "d" ? PH.cream : PH.mint}>
              {c === "d" ? "দূরত্ব" : "সরণ"}
            </Txt>
          </g>
        ))}
        <path d={`M${X9_CX.d - 34} 70q11 -12 22 0t22 0t22 0`} stroke={PH.cream} strokeWidth={3} strokeDasharray="0.1 4.5" strokeLinecap="round" fill="none" className="pointer-events-none" />
        <PArrow a={[X9_CX.s - 32, 68]} b={[X9_CX.s + 32, 68]} tone="mint" tell="3 km, B-এর দিকে" />
        {X9_CHIPS.slice(0, Math.min(round, X9_CHIPS.length)).flatMap((c, i) =>
          cardsOf(c.right).map((card) => {
            const [x, y] = slotOf(card, i);
            return <Tag key={`${i}${card}`} x={x} y={y} text={c.text} tone="ink" />;
          }),
        )}
        {!finished && pick === null && <Tag x={X9_HOME[0]} y={X9_HOME[1]} text={cur.text} tone="blue" solid pop />}
        {!finished &&
          pick !== null &&
          cardsOf(pick).map((card) => {
            const [x, y] = lerp(X9_HOME, slotOf(card, round), t);
            return (
              <g key={card}>
                <Tag x={x} y={y} text={cur.text} tone={wrong ? "red" : "blue"} solid={!wrong} />
                {wrong && <WrongMark x={x + 42} y={y + 5} size={12} />}
              </g>
            );
          })}
        {finished && <Tag x={X9_HOME[0]} y={X9_HOME[1]} text="পার্থক্য শুধু দিক" tone="mint" solid pop />}
      </Sheet>
      {!finished && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-sm">
          {X9_BINS.map(([b, l]) => (
            <button key={b} type="button" disabled={walk.running} className={chip(pick === b)} onClick={() => choose(b)}>
              <span className="font-sans">{l}</span>
            </button>
          ))}
        </div>
      )}
      {wrong && pick !== null && <Nope key={miss}>{X9_NOPE[`${round}${pick}`]}</Nope>}
      <Task done={finished}>তিনটা chip, একটা একটা করে আসবে। প্রতিটা কার: শুধু দূরত্বের, শুধু সরণের, না দুইটারই?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10a · The recap figure for the last screen: the road, the dotted path
// labelled দূরত্ব, the straight arrow labelled সরণ.

const S10_SAY = ["তিথির রাস্তা, A থেকে B।", "যে পথ ধরে গেছেন, তার পুরো দৈর্ঘ্য: দূরত্ব।", "শুরু থেকে শেষ, একটা সোজা তীর: সরণ।"];

export function PathAndArrow({}: Story) {
  const s = useScene(2, [600, 1700]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10_SAY[k]}</span>}>
      <RiverRoad label="A থেকে B-এর রাস্তা। ফোঁটা ফোঁটা পথের নাম দূরত্ব, 4 km। সোজা তীরের নাম সরণ, 3 km।" upTo={4} sheet={{ className: "max-w-[18rem]" }}>
        {k >= 1 && (
          <g className={FADE}>
            <RoadTrace km={4} />
          </g>
        )}
        {k >= 1 && <Tag x={78} y={74} text="দূরত্ব · 4 km" tone="cream" pop />}
        {k >= 2 && <PArrow a={A} b={B} tone="mint" draw tell="3 km, B-এর দিকে" />}
        {k >= 2 && <Tag x={150} y={108} text="সরণ · 3 km" tone="mint" solid pop />}
        <RoadRider km={k >= 1 ? 4 : 0} />
      </RiverRoad>
    </Scene>
  );
}

// 10b · The next journey's teaser: তিথি took 20 minutes from A to B. How fast?
// Two answers: one for the path (দ্রুতি), one for the arrow (বেগ).

const S11_SAY = ["বাসার মোড় থেকে বটতলা।", "লাগলো 20 মিনিট।", "কত জোরে? পথ ধরে একটা উত্তর, তীর ধরে আরেকটা।"];

export function TwentyMin({}: Story) {
  const s = useScene(2, [600, 1700]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S11_SAY[k]}</span>}>
      <RiverRoad label="A থেকে B-এর রাস্তা, B-এর উপরে একটা ঘড়ি: 20 min। পথের পাশে দ্রুতি ?, তীরের পাশে বেগ ?" upTo={4} sheet={{ className: "max-w-[18rem]" }}>
        {k >= 1 && (
          <g className={FADE}>
            <RoadTrace km={4} />
          </g>
        )}
        {k >= 1 && (
          <g className={`pointer-events-none ${POP}`}>
            <circle cx={226} cy={50} r={11} fill="#fff" stroke={PH.amber} strokeWidth={1.8} />
            <path d="M226 50V42.5M226 50l5 3" stroke={PH.ink} strokeWidth={1.4} strokeLinecap="round" />
            <Tag x={226} y={75} text="20 min" tone="amber" solid />
          </g>
        )}
        {k >= 2 && <PArrow a={A} b={B} tone="mint" w={2} opacity={0.6} tell="3 km, B-এর দিকে" />}
        {k >= 2 && <Tag x={78} y={74} text="দ্রুতি ?" tone="cream" pop />}
        {k >= 2 && <Tag x={150} y={108} text="বেগ ?" tone="mint" pop />}
        <RoadRider km={k >= 1 ? 4 : 0} />
      </RiverRoad>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  RiverRide: { start: { k: 0 }, end: {} },
  MoreRoadBet: { start: {}, sealed: { bet: 2 } },
  RideToB: { start: {}, mid: { km: 2.3 }, done: { km: 4 } },
  CountKm: { start: {}, two: { laid: [2, 0] }, done: { laid: [1, 3, 0, 2] } },
  DrawArrow: { start: {}, wrong: { tip: [150, 60] }, right: { tip: B } },
  MeasureArrow: { start: {}, wrong: { pick: 0 }, short: { pick: 2 }, right: { pick: 1 } },
  ArrowName: { mid: { k: 2 }, end: {} },
  ToNanuBari: { start: { k: 0 }, end: {} },
  OnToC: { start: {}, mid: { km: 4.9 }, done: { km: 6 } },
  BackToA: { start: {}, wrong: { pick: 0 }, zero: { pick: 1 }, right: { pick: 2 } },
  FlipArrow: { end: {} },
  LoopHome: {
    start: {},
    wrong: { dist: 12, disp: 12, ran: { dist: 12, disp: 12 } },
    right: { dist: 12, disp: 0, ran: { dist: 12, disp: 0 } },
  },
  SameUnit: { start: {}, wrong: { round: 0, pick: "d" }, wrong2: { round: 2, pick: "both" }, done: { round: 3 } },
  PathAndArrow: { mid: { k: 1 }, end: {} },
  TwentyMin: { end: {} },
};
