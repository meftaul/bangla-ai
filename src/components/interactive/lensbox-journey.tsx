"use client";

import { type KeyboardEvent, type ReactNode } from "react";

import { Tup, num } from "@/components/journey/box";
import { Bubble, Chest, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Laptop, Nope, Out, POP, Scene, Ticks, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, Star, makeFrame, mix, type Frame, type XY } from "@/components/journey/plane";
import {
  GOOD_LENS,
  LightBhai,
  LightGrid,
  LitRegion,
  OLD_LENS,
  Post,
  Projector,
  STAGE_WALL_F,
  StageBeam,
  StageWall,
  WallBed,
  WallClip,
  WallGrid,
  byCols,
  det,
  partway,
  projectorLens,
  sweepPts,
  useLensRun,
  wallFrame,
  type Cols,
} from "./light-kit";

// Screens for "Math for AI 8.4 — লাইট ভাইয়ের পুরানো lens, শূন্য", told as a
// Journey in the author's Bangla-English. The plan is 08_journey_specs.md,
// block 8.4.
//
// The night after 8.3: the machine's bulb has fused, the new one comes in the
// morning. The লাইট ভাই opens his old lens box on the মাদুর: six lenses, four
// numbers scratched on each rim. The ones that keep a picture go to Rina; the
// ones that crush it go in the পুকুর. Nobody can switch the machine on to
// check. নাসিব sorts them by the size of their numbers: বড় সংখ্যার lens বড় ছবি
// দেয়.
//
// Ten screens. 1 seals the bet: which of the six go in the পুকুর (BoxBet).
// 2 7.2's old lens [[2, 4], [1, 2]] from memory: the ঘর's two sides land on
// one line, the patch is a line, 0 (SquashedSquare). 3 seven old facts, one
// number: tap tiles, each plays its callback (AllSameFact). 4 predict, then
// [[100, 100], [100, 100]]: big numbers, zero (BigButZero). 5 [[0.1, 0],
// [0, 0.1]]: 0.01, and the whole ফুল is still there (TinyButFine). 6 5.2's
// খাতা: sq ft and sq m as a 2 × 2, det 0 (ExtraColumn). 7 Your turn: the six
// and a seventh, keep or পুকুর (YourBox). 8 Try it: [[1, 2], [2, ?]]
// (TryZero). 9 morning, the new bulb; each lens run on the wall (MorningRun).
// 10 the end (MDX only).
//
// After the screens: the story scenes (BoxNight, SomLine, NasibHundred,
// NasibTiny, SaminKhata, SeventhLens, NewBulb, PukurDawn, RinaWipes,
// DoorPiece) and the watch-only figures (LensStake, CopyColumn, RemoteC,
// BigVsSmall, SmallComesBack, NoisyZero, NearCopy), each numbered after its
// screen.
//
// The wall, the machine and the লাইট ভাই come from light-kit.tsx (read-only).
// The patch pieces the spec puts in a shared patch-kit.tsx are local here
// (LB_…), since 8.1 was built in parallel; the coordinator may fold them in.
// A lens is written by its columns (light-kit's Cols): column 1 amber, column
// 2 teal, as on the knobs of 7.2.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const GLOW = "#fde047";
const LAMP = "#f59e0b";
const CHALK = "#1d4ed8";
const CHALK_FILL = "#93c5fd";
const PAINT = "#ea580c";
const PAINT_DARK = "#9a3412";
const OK = "#0d9488";
const BAD = "#e11d48";
const POND = "#3b82f6";
const MOON = "#e2e8f0";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

// ---------------------------------------------------------------------------
// Numbers: the lenses, by columns.

const L_SPARE: Cols = [
  [1, 0],
  [0, 0],
];
const L_BIG: Cols = [
  [100, 100],
  [100, 100],
];
const L_TINY: Cols = [
  [0.1, 0],
  [0, 0.1],
];
const L_ONES: Cols = [
  [1, 1],
  [1, 1],
];
/** the seventh, from the bottom of the box: its first column blank (Check Q7) */
const L_SEVEN: Cols = [
  [0, 0],
  [3, 1],
];
/** 7.3's two spares, the pair 8.5 stacks: Z = [[−1, 1], [2, 1]], W = [[0, 1], [1, 1]] */
const L_Z: Cols = [
  [-1, 2],
  [1, 1],
];
const L_W: Cols = [
  [0, 1],
  [1, 1],
];

type Lens = { key: string; cols: Cols; name: string; nasib: "keep" | "throw" };

/** The six in the box, in the order they lie. নাসিব keeps the big numbers. */
const BOX: Lens[] = [
  { key: "old", cols: OLD_LENS, name: "পুরানো", nasib: "keep" },
  { key: "spare", cols: L_SPARE, name: "বাড়তি", nasib: "throw" },
  { key: "big", cols: L_BIG, name: "একশ", nasib: "keep" },
  { key: "tiny", cols: L_TINY, name: "পুঁচকে", nasib: "throw" },
  { key: "ones", cols: L_ONES, name: "চার এক", nasib: "throw" },
  { key: "g", cols: GOOD_LENS, name: "G", nasib: "keep" },
];
const SEVEN: Lens = { key: "seven", cols: L_SEVEN, name: "সাত নম্বর", nasib: "throw" };

const flat = (c: Cols) => Math.abs(det(c)) < 1e-9;

/** a number as the lens rim writes it: a real minus, at most three decimals */
const fmt = (v: number) => {
  const r = Math.round(v * 1000) / 1000;
  const s = Math.abs(r) < 1e-9 ? "0" : String(Math.abs(r));
  return r < -1e-9 ? `−${s}` : s;
};
/** the matrix's four numbers a, b, c, d (row by row) from its columns */
const abcd = (c: Cols) => [c[0][0], c[1][0], c[0][1], c[1][1]] as const;
/** ad − bc written out: "2·2 − 4·1 = 0" */
const detLine = (c: Cols) => {
  const [a, b, cc, d] = abcd(c);
  return `${fmt(a)}·${fmt(d)} − ${fmt(b)}·${fmt(cc)} = ${fmt(det(c))}`;
};

const add = (p: XY, q: XY): XY => [p[0] + q[0], p[1] + q[1]];
const poly = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0])} ${f.sy(p[1])}`).join("") + "Z";
/** the patch of one ঘর: (0, 0), side 1, side 1 + side 2, side 2 */
const patchPts = (s1: XY, s2: XY, at: XY = [0, 0]): XY[] => [at, add(at, s1), add(at, add(s1, s2)), add(at, s2)];
/** a lens applied to a point */
const run = (c: Cols, p: XY): XY => [p[0] * c[0][0] + p[1] * c[1][0], p[0] * c[0][1] + p[1] * c[1][1]];

/** Rina's ফুল stencil, 5 ঘর (8.1's): the middle ঘর at the pin and one on each side. */
const FLOWER: XY[] = [
  [0, -1],
  [1, -1],
  [1, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [1, 2],
  [0, 2],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, 0],
];

// ---------------------------------------------------------------------------
// Shared drawing.

/** The whitewashed wall on a Plane, clipped: lime, chalk grid, the post with its nail, then children. */
function LB_Wall({ f, label, width = "max-w-[18rem]", nums = false, door = false, children, under }: { f: Frame; label: string; width?: string; nums?: boolean; door?: boolean; children?: ReactNode; under?: ReactNode }) {
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} className={`my-0! ${width}`}>
      <WallClip f={f}>
        <WallBed f={f} door={door} window={false} tree={false} />
        <WallGrid f={f} nums={nums} />
        {under}
      </WallClip>
      <Post f={f} />
      {children}
    </Plane>
  );
}

/** A patch drawn in Rina's blue chalk (the bulb is out: she draws what the light would do). */
function LB_ChalkPatch({ f, pts, faint = false }: { f: Frame; pts: readonly XY[]; faint?: boolean }) {
  return (
    <g className="pointer-events-none">
      <path d={poly(f, pts)} fill={CHALK_FILL} fillOpacity={faint ? 0.25 : 0.55} stroke={CHALK} strokeWidth={faint ? 1 : 2} strokeLinejoin="round" strokeDasharray={faint ? "3 3" : undefined} />
    </g>
  );
}

/** A patch of light (the machine on): yellow, glowing. */
function LB_LightPatch({ f, pts }: { f: Frame; pts: readonly XY[] }) {
  return (
    <g className="pointer-events-none">
      <path d={poly(f, pts)} fill={GLOW} fillOpacity={0.3} stroke={GLOW} strokeOpacity={0.5} strokeWidth={5} strokeLinejoin="round" />
      <path d={poly(f, pts)} fill={GLOW} fillOpacity={0.75} stroke={LAMP} strokeWidth={1.3} strokeLinejoin="round" />
    </g>
  );
}

/** The one-ঘর stencil at the pin, dashed: where the light starts. */
function LB_Unit({ f }: { f: Frame }) {
  return <path d={poly(f, patchPts([1, 0], [0, 1]))} fill="none" stroke={INK} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="3 2" className="pointer-events-none" />;
}

/**
 * One lens from the box, as a round glass with its four numbers scratched on
 * it (a b over c d; column 1 amber, column 2 teal). SVG units; centre (x, y).
 * `mark` hangs a "?" (a sealed guess) or a red cross.
 */
function LB_Disc({ x, y, r = 18, cols, mark, dim = false }: { x: number; y: number; r?: number; cols: Cols; mark?: "?" | "x"; dim?: boolean }) {
  const [a, b, c, d] = abcd(cols);
  const long = [a, b, c, d].some((v) => fmt(v).length >= 3);
  const fs = r * (long ? 0.36 : 0.46);
  const dx = r * 0.36;
  const dy = r * 0.3;
  return (
    <g opacity={dim ? 0.45 : 1}>
      <circle cx={x} cy={y} r={r + 2.2} fill="#475569" />
      <circle cx={x} cy={y} r={r} fill="#bae6fd" fillOpacity={0.85} stroke="#e2e8f0" strokeWidth={0.8} />
      <path d={`M${x - r * 0.55} ${y - r * 0.5}q${r * 0.3} ${-r * 0.3} ${r * 0.7} ${-r * 0.32}`} stroke="white" strokeOpacity={0.8} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <g fontFamily={MONO} fontWeight={800} fontSize={fs} textAnchor="middle">
        <text x={x - dx} y={y - dy + fs * 0.55} fill="#b45309">
          {fmt(a)}
        </text>
        <text x={x + dx} y={y - dy + fs * 0.55} fill="#0f766e">
          {fmt(b)}
        </text>
        <text x={x - dx} y={y + dy + fs * 0.55} fill="#b45309">
          {fmt(c)}
        </text>
        <text x={x + dx} y={y + dy + fs * 0.55} fill="#0f766e">
          {fmt(d)}
        </text>
      </g>
      {mark === "?" && (
        <text x={x + r * 0.75} y={y - r * 0.7} fontSize={r * 0.95} fontWeight={800} fill="#2563eb" className={POP}>
          ?
        </text>
      )}
      {mark === "x" && <path d={`M${x - r * 0.8} ${y - r * 0.8}l${r * 1.6} ${r * 1.6}m0 ${-r * 1.6}l${-r * 1.6} ${r * 1.6}`} stroke={BAD} strokeWidth={2.2} strokeLinecap="round" className={POP} />}
    </g>
  );
}

/** The lens as a matrix, a b over c d; column 1 amber, column 2 teal. Wide enough for 100 and 0.1. */
function LB_Matrix({ cols, name, small = false }: { cols: Cols; name?: ReactNode; small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {name && <span className="text-sm">{name}</span>}
      <span className={`inline-flex items-stretch font-mono font-bold leading-tight ${small ? "text-xs" : "text-sm"}`}>
        <span className="w-1 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
        {[0, 1].map((c) => (
          <span key={c} className={`flex flex-col items-end px-1 ${c === 0 ? "text-cat-amber" : "text-cat-teal"}`}>
            <span>{fmt(cols[c][0])}</span>
            <span>{fmt(cols[c][1])}</span>
          </span>
        ))}
        <span className="w-1 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
      </span>
    </span>
  );
}

/** the মাদুর on the বারান্দা floor, top-left (x, y) */
function LB_Mat({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const stripes = [];
  for (let i = 1; i < 6; i += 1) stripes.push(<path key={i} d={`M${x + (w * i) / 6} ${y + 2}V${y + h - 2}`} stroke="#a16207" strokeOpacity={0.35} strokeWidth={2} />);
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y} width={w} height={h} rx={3} fill="#e7c98a" stroke="#a16207" strokeWidth={1} />
      {stripes}
      <path d={`M${x} ${y + h / 2}H${x + w}`} stroke="#b45309" strokeOpacity={0.5} strokeWidth={1.2} />
    </g>
  );
}

/** the পুকুর, as seen from the ঘাট */
function LB_Pond({ cx, cy, rx, ry, ripples = [] }: { cx: number; cy: number; rx: number; ry: number; ripples?: readonly XY[] }) {
  return (
    <g className="pointer-events-none">
      <ellipse cx={cx} cy={cy} rx={rx + 4} ry={ry + 3} fill="#65a30d" opacity={0.5} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={POND} stroke="#1d4ed8" strokeOpacity={0.5} />
      <path d={`M${cx - rx * 0.5} ${cy - 2}q8 -3 16 0M${cx + rx * 0.1} ${cy + ry * 0.4}q8 -3 16 0`} stroke="white" strokeOpacity={0.6} strokeWidth={1} fill="none" />
      {ripples.map(([x, y], i) => (
        <g key={i} className={POP}>
          <ellipse cx={x} cy={y} rx={9} ry={3} fill="none" stroke="white" strokeOpacity={0.8} strokeWidth={1.2} />
          <ellipse cx={x} cy={y} rx={15} ry={5} fill="none" stroke="white" strokeOpacity={0.4} strokeWidth={1} />
        </g>
      ))}
    </g>
  );
}

/** the হারিকেন, feet at (x, y), with its warm pool of light */
function LB_Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y - 12} r={46} fill="#fbbf24" opacity={0.12} />
      <circle cx={x} cy={y - 12} r={22} fill="#fbbf24" opacity={0.2} />
      <rect x={x - 7} y={y - 4} width={14} height={4} rx={1} fill="#b91c1c" />
      <ellipse cx={x} cy={y - 12} rx={6} ry={8} fill="#fde68a" stroke="#b91c1c" strokeWidth={1} />
      <path d={`M${x} ${y - 16}q-1.6 3 0 6q1.6 -3 0 -6Z`} fill="#f97316" />
      <rect x={x - 5} y={y - 22} width={10} height={3} rx={1} fill="#b91c1c" />
      <path d={`M${x - 6} ${y - 22}q6 -9 12 0`} stroke="#57534e" strokeWidth={1} fill="none" />
    </g>
  );
}

/** a name under someone's feet, light ink for a night stage */
function LB_Name({ x, y, n, tone = MOON }: { x: number; y: number; n: string; tone?: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={tone}>
      {n}
    </text>
  );
}

/** the বারান্দা at night: the floor, a post, the lamp */
function LB_Verandah() {
  return (
    <g className="pointer-events-none">
      <rect x={0} y={0} width={320} height={10} fill="#3f2a1d" />
      <rect x={10} y={10} width={7} height={140} fill="#5b3a24" />
      <rect x={303} y={10} width={7} height={140} fill="#5b3a24" />
      <rect x={0} y={138} width={320} height={12} fill="#44403c" />
      <LB_Lamp x={36} y={138} />
    </g>
  );
}

/** a small tick or cross, drawn (glyphs render as emoji on Linux) */
function LB_Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <svg viewBox="0 0 12 12" className={`inline-block size-4 align-[-2px] ${POP}`} aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke={OK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" className={`inline-block size-4 align-[-2px] ${POP}`} aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke={BAD} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/** keyboard for an SVG shape that acts as a button */
const press = (go: () => void) => ({
  role: "button",
  tabIndex: 0,
  onClick: go,
  onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  },
});

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The six lenses lie on the মাদুর; the পুকুর is at the
//     right. A tap slides a lens to the পুকুরের পাড় (tap again to bring it
//     back). Sealing hangs a "?" on each one sent. Never marked.

const X1_MAT: XY[] = [
  [42, 92],
  [92, 92],
  [142, 92],
  [42, 132],
  [92, 132],
  [142, 132],
];
const X1_BANK: XY[] = [
  [224, 56],
  [260, 50],
  [296, 56],
  [224, 92],
  [260, 86],
  [296, 92],
];

export function BoxBet() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<boolean[]>("picks", [false, false, false, false, false, false]);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(650);
  const k = !sealed ? 0 : act.running ? act.k : 2;
  const n = picks.filter(Boolean).length;
  const toggle = (i: number) => {
    if (sealed) return;
    setPicks(picks.map((p, j) => (j === i ? !p : p)));
  };
  const seal = () => {
    if (n === 0 || sealed) return;
    setSealed(true);
    act.play(2, () => pass("বাজি সিল হলো. পুরানো lens টা দিয়ে শুরু."));
  };
  let slot = 0;
  const at = picks.map((p, i) => (p ? X1_BANK[slot++] : X1_MAT[i]));
  return (
    <>
      <div className="mx-auto w-full max-w-[21rem] overflow-hidden rounded-2xl ring-1 ring-black/10">
        <svg viewBox="0 0 320 160" role="group" aria-label="মাদুরের উপর ছয়টা lens; ডানে পুকুর; যেই lens tap করবেন, সেটা পুকুরের পাড়ে যাবে" className="block h-auto w-full select-none">
          <rect width={320} height={160} fill="#0f172a" />
          <rect y={40} width={320} height={120} fill="#1f2d1f" />
          <LB_Lamp x={196} y={150} />
          <LB_Mat x={12} y={68} w={162} h={86} />
          <text x={93} y={60} textAnchor="middle" fontSize={10} fontWeight={700} fill={MOON}>
            মাদুর: রিনার জন্য
          </text>
          <LB_Pond cx={266} cy={136} rx={48} ry={16} />
          <text x={260} y={20} textAnchor="middle" fontSize={10} fontWeight={700} fill={MOON}>
            পুকুরের দিকে
          </text>
          {BOX.map((l, i) => (
            <g
              key={l.key}
              {...(sealed ? {} : press(() => toggle(i)))}
              aria-label={`lens ${l.name}${picks[i] ? ", পুকুরের দিকে" : ""}`}
              style={{ transform: `translate(${at[i][0]}px, ${at[i][1]}px)` }}
              className={`outline-none transition-transform duration-700 ease-out motion-reduce:transition-none ${sealed ? "" : "cursor-pointer"}`}
            >
              <LB_Disc x={0} y={0} r={17} cols={l.cols} mark={picks[i] && k >= 1 ? "?" : undefined} />
            </g>
          ))}
          {k >= 2 && (
            <g className={POP}>
              <rect x={214} y={134} width={104} height={16} rx={8} fill="#1d4ed8" />
              <text x={266} y={145.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">
                বাজি সিল: {n} টা পুকুরে?
              </text>
            </g>
          )}
        </svg>
      </div>
      <div className="mt-2 text-center text-sm text-muted">
        পুকুরের দিকে <span className="font-mono font-bold text-foreground">{n}</span> টা lens
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={n === 0 || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 2}>যেগুলো ছবি পিষে ফেলে, সেগুলো tap করে পুকুরের দিকে পাঠান. তারপর বাজি সিল করুন. উত্তর শেষে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · 7.2's old lens, from memory. The one ঘর at the pin; tap to send its
//     first side through (it lands on (2, 1)), then its second (it lands on
//     (4, 2), on the same line). The ঘর follows its sides: it leans, then
//     folds flat. The area runs live; ad − bc lands last.

const X2F = makeFrame(-1.4, 7.4, -1, 4, 30, 6);

export function SquashedSquare() {
  const pass = useGate();
  const [phase, setPhase] = useSeed("phase", 0);
  const land = usePlay(750);
  const t1: XY = phase >= 1 ? OLD_LENS[0] : [1, 0];
  const t2: XY = phase >= 2 ? OLD_LENS[1] : [0, 1];
  const [a, c, b, d] = useTween([t1[0], t1[1], t2[0], t2[1]], 700);
  const s1: XY = [a, c];
  const s2: XY = [b, d];
  const area = Math.abs(a * d - b * c);
  const settled = !land.running;
  const done = phase >= 2 && settled;
  const go = () => {
    if (land.running || phase >= 2) return;
    const next = phase + 1;
    setPhase(next);
    land.play(1, next === 2 ? () => pass("জায়গা শূন্য: দুই পাশ এক লাইনে.") : undefined);
  };
  return (
    <>
      <div className="flex justify-center">
        <LB_Matrix cols={OLD_LENS} name="পুরানো lens" />
      </div>
      <div className="mt-2 flex justify-center">
        <LB_Wall f={X2F} label="দেয়ালে রিনার চকের এক ঘর; পুরানো lens এ তার দুই পাশ যায় (2, 1) আর (4, 2) এ, একই লাইনে; ঘরটা চ্যাপ্টা হয়ে দাগ" width="max-w-[19rem]">
          <LB_Unit f={X2F} />
          <LB_ChalkPatch f={X2F} pts={patchPts(s1, s2)} />
          {done && <Draw d={`M${X2F.sx(0)} ${X2F.sy(0)}L${X2F.sx(6)} ${X2F.sy(3)}`} strokeWidth={3.2} ms={700} className="stroke-[#1d4ed8]" />}
          <Arrow f={X2F} from={[0, 0]} to={s2} tone="teal" w={phase >= 2 ? 4.5 : 2.6} />
          <Arrow f={X2F} from={[0, 0]} to={s1} tone="amber" w={2.4} />
        </LB_Wall>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-sm">
        <span>
          জায়গা: <span className="font-mono text-base font-bold">{fmt(Math.round(area * 10) / 10)}</span> ঘর
        </span>
        <span className="text-muted">
          রং: <span className="font-mono font-bold text-foreground">{fmt(Math.round(area * 10) / 10)}</span> কৌটা
        </span>
      </div>
      <div className="mt-1 min-h-7 text-center">
        {done ? (
          <span className={`${POP} inline-block rounded-lg bg-cat-blue/10 px-2 py-0.5 font-mono text-sm font-bold`}>
            ad − bc = <span className="text-cat-amber">2</span>·<span className="text-cat-teal">2</span> − <span className="text-cat-teal">4</span>·<span className="text-cat-amber">1</span> = 0
          </span>
        ) : (
          <button type="button" className={primaryBtn} disabled={land.running} onClick={go}>
            {phase === 0 ? "প্রথম পাশ পাঠান" : "দ্বিতীয় পাশ পাঠান"}
          </button>
        )}
      </div>
      <Task done={done}>ঘরের দুই পাশ একটা একটা করে পুরানো lens দিয়ে পাঠান. জায়গাটা দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Seven old facts, one number. Seven tiles; a tap plays the tile's
//     picture on the small wall with the old lens. Each one is a thing met
//     before (5.2, 6.x, 7.2, 6.5) or coming (Articles 9, 10, 11). All seven
//     light: ad − bc = 0.

const X3F = makeFrame(-2.5, 7.5, -1.5, 4.2, 22, 4);
const X3_TILES = [
  { name: "দুই column এক লাইনে", from: "5.2", say: "Knob 1 দুই পাক সামনে, knob 2 এক পাক পেছনে. Dot আবার পেরেকে." },
  { name: "পুরা grid চ্যাপ্টা", from: "6.x", say: "দেয়ালের পুরা grid চেপে একটা লাইন হয়ে গেলো." },
  { name: "আলো শুধু এক লাইনে", from: "7.2", say: "Knob যেভাবেই ঘুরান, আলো এই লাইনের বাইরে যায় না." },
  { name: "আলাদা বিন্দু, এক জায়গা", from: "6.5", say: "(2, 0), (0, 1), (−2, 2): তিনজনই গিয়ে পড়লো (4, 2) এ." },
  { name: "উল্টা ফেরানো যায় না", from: "Article 9", say: "(4, 2) কে ফেরত পাঠাবো কোথায়? তিনটা জায়গাই হতে পারে." },
  { name: "Ax = b এর উত্তর নাই", from: "Article 10", say: "তারাটা লাইনের বাইরে. কোনো পাকেই আলো ওখানে যায় না." },
  { name: "একটা দিক মুছে গেলো", from: "Article 11", say: "(2, −1) দিকের arrow টা lens পার হয়ে চুপসে শূন্য." },
];
const X3_INS: XY[] = [
  [2, 0],
  [0, 1],
  [-2, 2],
];
const X3_HEX = ["#db2777", "#7c3aed", "#0891b2"];
const X3_PTS = sweepPts(OLD_LENS, 260, 3, 5);
const X3_FRAMES = 14;

/** where the zero walk's dot is at t: (2, 1), (4, 2), then back to the pin */
const zeroWalk = (t: number): XY => (t < 1 / 3 ? mix([0, 0], [2, 1], t * 3) : t < 2 / 3 ? mix([2, 1], [4, 2], t * 3 - 1) : mix([4, 2], [0, 0], t * 3 - 2));

function X3_Play({ i, t }: { i: number; t: number }) {
  const f = X3F;
  if (i === 0) {
    const p = zeroWalk(t);
    return (
      <>
        <Arrow f={f} from={[0, 0]} to={OLD_LENS[1]} tone="teal" w={4.5} />
        <Arrow f={f} from={[0, 0]} to={OLD_LENS[0]} tone="amber" w={2.2} />
        <circle cx={f.sx(p[0])} cy={f.sy(p[1])} r={5} fill="white" stroke={LAMP} strokeWidth={1.6} />
      </>
    );
  }
  if (i === 1) return <LightGrid f={f} move={byCols(OLD_LENS)} t={t} ghost />;
  if (i === 2)
    return (
      <>
        <LitRegion f={f} cols={OLD_LENS} t={t} />
        {X3_PTS.slice(0, Math.round(t * X3_PTS.length)).map((p, j) => (
          <circle key={j} cx={f.sx(p[0])} cy={f.sy(p[1])} r={1.6} fill={LAMP} opacity={0.8} />
        ))}
      </>
    );
  if (i === 3)
    return (
      <>
        <path d={`M${f.sx(-4)} ${f.sy(-2)}L${f.sx(8)} ${f.sy(4)}`} stroke={LAMP} strokeOpacity={0.4} strokeWidth={1.2} strokeDasharray="4 3" />
        {X3_INS.map((q, j) => {
          const p = mix(q, run(OLD_LENS, q), t);
          return <circle key={j} cx={f.sx(p[0])} cy={f.sy(p[1])} r={4.5} fill={X3_HEX[j]} stroke="white" strokeWidth={1} opacity={0.9} />;
        })}
      </>
    );
  if (i === 4)
    return (
      <>
        <path d={`M${f.sx(-4)} ${f.sy(-2)}L${f.sx(8)} ${f.sy(4)}`} stroke={LAMP} strokeOpacity={0.4} strokeWidth={1.2} strokeDasharray="4 3" />
        <circle cx={f.sx(4)} cy={f.sy(2)} r={5} fill="white" stroke={LAMP} strokeWidth={1.6} />
        {X3_INS.map((q, j) => {
          const p = mix([4, 2], q, t);
          return (
            <g key={j}>
              <path d={`M${f.sx(4)} ${f.sy(2)}L${f.sx(p[0])} ${f.sy(p[1])}`} stroke={X3_HEX[j]} strokeWidth={1.4} strokeDasharray="3 2" />
              {t > 0.95 && (
                <text x={f.sx(q[0])} y={f.sy(q[1]) + 4} textAnchor="middle" fontSize={12} fontWeight={800} fill={X3_HEX[j]}>
                  ?
                </text>
              )}
            </g>
          );
        })}
      </>
    );
  if (i === 5) {
    const p = mix([-2, -1], [7, 3.5], t);
    return (
      <>
        <path d={`M${f.sx(-4)} ${f.sy(-2)}L${f.sx(8)} ${f.sy(4)}`} stroke={LAMP} strokeOpacity={0.4} strokeWidth={1.2} strokeDasharray="4 3" />
        <Star f={f} at={[1, 3]} />
        <circle cx={f.sx(p[0])} cy={f.sy(p[1])} r={5} fill="white" stroke={LAMP} strokeWidth={1.6} />
        {t > 0.95 && <path d={`M${f.sx(1) - 9} ${f.sy(3) - 9}l18 18m0 -18l-18 18`} stroke={BAD} strokeWidth={2} strokeLinecap="round" className={POP} />}
      </>
    );
  }
  const q = mix([2, -1], [0, 0], t);
  return <>{Math.hypot(q[0], q[1]) > 0.08 ? <Arrow f={f} from={[0, 0]} to={q} tone="violet" w={2.6} /> : <circle cx={f.sx(0)} cy={f.sy(0)} r={4} fill="#7c3aed" />}</>;
}

export function AllSameFact() {
  const pass = useGate();
  const [seen, setSeen] = useSeed<boolean[]>("seen", [false, false, false, false, false, false, false]);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const play = usePlay(95);
  const all = seen.every(Boolean);
  const t = cur === null ? 0 : play.running ? play.k / X3_FRAMES : 1;
  const tap = (i: number) => {
    setCur(i);
    const next = seen.map((s, j) => s || j === i);
    play.play(X3_FRAMES, () => {
      setSeen(next);
      if (next.every(Boolean) && !all) pass("সাত রকম কথা, একটাই ঘটনা.");
    });
  };
  return (
    <>
      <div className="flex justify-center">
        <LB_Wall f={X3F} label="পুরানো lens এর ছোট দেয়াল; যেই কথাটা tap করবেন, তার ছবি এখানে চলবে" width="max-w-[16rem]">
          {cur !== null && <X3_Play i={cur} t={t} />}
          {all && !play.running && (
            <g className={POP}>
              <rect x={X3F.W / 2 - 56} y={4} width={112} height={20} rx={10} fill={INK} />
              <text x={X3F.W / 2} y={18} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={GLOW}>
                ad − bc = 0
              </text>
            </g>
          )}
        </LB_Wall>
      </div>
      <div className="mt-1 min-h-10 text-center text-sm leading-snug">{cur === null ? <span className="text-muted">একটা কথায় tap করুন.</span> : say(X3_TILES.map((x) => x.say), cur)}</div>
      <div className="mx-auto mt-1 grid max-w-[21rem] grid-cols-2 gap-1.5">
        {X3_TILES.map((x, i) => (
          <button
            key={x.name}
            type="button"
            onClick={() => tap(i)}
            className={`flex cursor-pointer items-center justify-between gap-1 rounded-xl border-2 px-2 py-1 text-left text-[0.8rem] leading-tight transition-colors motion-reduce:transition-none ${
              cur === i ? "border-cat-blue bg-cat-blue/10" : seen[i] ? "border-accent/50" : "border-border hover:border-cat-blue/60"
            } ${i === 6 ? "col-span-2" : ""}`}
          >
            <span>
              {x.name} <span className="text-[0.7rem] text-muted">{x.from}</span>
            </span>
            {seen[i] && <span className={`${POP} shrink-0 rounded bg-foreground/10 px-1 font-mono text-[0.7rem] font-bold`}>det 0</span>}
          </button>
        ))}
      </div>
      <Task done={all && !play.running}>সাতটা কথাই tap করে ছবিটা দেখুন. সবগুলো এই এক lens এর গল্প.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Predict, then the big lens. [[100, 100], [100, 100]]: three pictures
//     (a patch filling the wall · a line · a small patch). Then the ঘর goes
//     through: its sides shoot off the wall, the patch swells, then folds to
//     a line, since both sides end on (100, 100). ad − bc = 0.

const X4F = makeFrame(-1.4, 7.4, -1, 4.6, 26, 6);
const X4_OPTS = ["দেয়াল ভরে যাবে", "একটা দাগ", "ছোট একটা ছোপ"];
const X4_RIGHT = 1;

function X4_Pic({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 64 40" className="h-auto w-14 shrink-0" aria-hidden="true">
      <rect width={64} height={40} rx={4} fill="#e9e4d8" />
      {i === 0 && <path d="M2 38L20 4L62 2L44 38Z" fill={GLOW} stroke={LAMP} strokeWidth={1.2} />}
      {i === 1 && <path d="M6 36L58 6" stroke={LAMP} strokeWidth={3} strokeLinecap="round" />}
      {i === 2 && <path d="M8 34L16 28L22 18L14 24Z" fill={GLOW} stroke={LAMP} strokeWidth={1.2} />}
      <circle cx={8} cy={34} r={2} fill="#e5e7eb" stroke={INK} strokeWidth={0.8} />
    </svg>
  );
}

export function BigButZero() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);
  const go = useLensRun(1600, 32);
  const t = !ran ? 0 : go.running ? go.t : 1;
  const m = partway(byCols(L_BIG), t);
  const s1 = m([1, 0]);
  const s2 = m([0, 1]);
  const area = Math.abs(s1[0] * s2[1] - s2[0] * s1[1]);
  const over = ran && !go.running;
  const start = () => {
    if (guess === null || go.running) return;
    setRan(true);
    go.run(() => pass("বড় সংখ্যা মানেই বড় ছবি না."));
  };
  return (
    <>
      <div className="flex justify-center">
        <LB_Matrix cols={L_BIG} name="নাসিবের lens" />
      </div>
      <div className="mt-2 flex justify-center">
        <LB_Wall f={X4F} label="একশ lens এ রিনার এক ঘর: দুই পাশ দেয়াল ছাড়িয়ে (100, 100) এর দিকে; ঘর ফুলে উঠে আবার চ্যাপ্টা" width="max-w-[18rem]">
          <LB_Unit f={X4F} />
          {ran && (
            <WallClip f={X4F}>
              <LB_LightPatch f={X4F} pts={patchPts(s1, s2)} />
              {over && <path d={`M${X4F.sx(0)} ${X4F.sy(0)}L${X4F.sx(20)} ${X4F.sy(20)}`} stroke={LAMP} strokeWidth={3} />}
            </WallClip>
          )}
          {ran && (
            <WallClip f={X4F}>
              <Arrow f={X4F} from={[0, 0]} to={s2} tone="teal" w={4.5} list={over ? "(100, 100)" : false} />
              <Arrow f={X4F} from={[0, 0]} to={s1} tone="amber" w={2.2} list={over ? "(100, 100)" : false} />
            </WallClip>
          )}
          {over && (
            <text x={X4F.sx(4.9)} y={X4F.sy(0.35)} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={INK} stroke="#e9e4d8" strokeWidth={3} paintOrder="stroke" className={FADE}>
              দুই পাশই (100, 100) এ, দেয়াল ছাড়িয়ে
            </text>
          )}
        </LB_Wall>
      </div>
      <div className="mt-1 text-center text-sm">
        জায়গা: <span className="font-mono text-base font-bold">{ran ? fmt(Math.round(area)) : "?"}</span> ঘর
        {over && <span className={`${POP} ml-2 inline-block font-mono text-sm font-bold`}>100·100 − 100·100 = 0</span>}
      </div>
      <div className="mt-2 grid gap-1.5">
        {X4_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, X4_RIGHT)} disabled={ran} onClick={() => setGuess(i)}>
            <span className="flex items-center gap-2 text-sm">
              <X4_Pic i={i} />
              {o}
            </span>
          </Choice>
        ))}
      </div>
      {!ran && (
        <div className="mt-2 flex justify-center">
          <button type="button" className={primaryBtn} disabled={guess === null} onClick={start}>
            ঘরটা পাঠান
          </button>
        </div>
      )}
      {over && guess !== null && guess !== X4_RIGHT && <Nope>ঘরটা প্রথমে ফুললো ঠিকই. তারপর দুই পাশ গিয়ে বসলো একই জায়গায়, (100, 100) এ. ছোপ চ্যাপ্টা হয়ে দাগ.</Nope>}
      <Task done={over}>আগে guess দিন: এক ঘরের আলো এই lens এ কেমন হবে? তারপর ঘরটা পাঠান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The tiny lens. Rina's ফুল goes through [[0.1, 0], [0, 0.1]] and shrinks
//     to a speck at the pin. A magnifier over the pin shows it ×10: the whole
//     ফুল, every petal. Then the লাইট ভাই holds a ×10 lens behind it and the
//     ফুল comes back to full size on the wall.

const X5F = makeFrame(-1.5, 7, -1.6, 3.4, 28, 6);
/** the loupe: centre in SVG units, radius, and the wall point it looks at */
const X5_LOUPE = { cx: 0, cy: 0, r: 58, look: [0.05, 0.05] as XY, z: 10 };

export function TinyButFine() {
  const pass = useGate();
  const [phase, setPhase] = useSeed("phase", 0);
  const play = usePlay(800);
  const [s] = useTween([phase === 1 || phase === 2 ? 0.1 : 1], 800);
  const [zoom] = useTween([phase === 2 ? X5_LOUPE.z : 1], 800);
  const f = X5F;
  const lx = f.sx(4.4);
  const ly = f.sy(0.9);
  const done = phase >= 3 && !play.running;
  const go = () => {
    if (play.running || phase >= 3) return;
    const next = phase + 1;
    setPhase(next);
    play.play(1, next === 3 ? () => pass("ছোট মানে নষ্ট না. শুধু শূন্য হলেই নষ্ট.") : undefined);
  };
  const flower = FLOWER.map((p) => [p[0] * s, p[1] * s] as XY);
  // inside the loupe: wall point p sits at (lx, ly) + (p − look) · u · zoom
  const lp = (p: XY): XY => [lx + (p[0] - X5_LOUPE.look[0]) * f.u * zoom, ly - (p[1] - X5_LOUPE.look[1]) * f.u * zoom];
  const loupeFlower = flower.map(lp);
  const tenth: number[] = [];
  for (let i = -6; i <= 6; i += 1) tenth.push(i / 10);
  const BTN = ["পুঁচকে lens দিয়ে ফুল পাঠান", "কাছে গিয়ে দেখুন", "পেছনে 10 গুণ lens লাগান"];
  const SAY = [
    "রিনার ফুল, 5 ঘর.",
    "ফুলটা এখন পেরেকের পাশে একটা ফোঁটা. 0.05 ঘর.",
    "10 গুণ কাছে: পুরা ফুল. পাঁচটা ঘর, একটাও হারায় নাই.",
    "10 গুণ lens পেছনে: ফুল আবার 5 ঘর.",
  ];
  return (
    <>
      <div className="flex justify-center">
        <LB_Matrix cols={L_TINY} name="পুঁচকে lens" />
      </div>
      <div className="mt-2 flex justify-center">
        <LB_Wall f={f} label="রিনার ফুল পুঁচকে lens এ ছোট হয়ে পেরেকের পাশে; আতশ কাঁচে 10 গুণ কাছে পুরা ফুল; পেছনে 10 গুণ lens দিলে আবার আগের মাপ" width="max-w-[19rem]">
          <path d={poly(f, flower)} fill={PAINT} fillOpacity={0.85} stroke={PAINT_DARK} strokeWidth={1.2} strokeLinejoin="round" />
          {phase === 0 && <path d={poly(f, FLOWER)} fill="none" stroke={INK} strokeOpacity={0.5} strokeDasharray="3 2" />}
          {phase === 2 && (
            <g className={FADE}>
              <defs>
                <clipPath id="lb-loupe">
                  <circle cx={lx} cy={ly} r={X5_LOUPE.r} />
                </clipPath>
              </defs>
              <path d={`M${f.sx(0.1)} ${f.sy(0.1)}L${lx - X5_LOUPE.r * 0.72} ${ly + X5_LOUPE.r * 0.7}`} stroke="#57534e" strokeWidth={1} strokeDasharray="2 2" />
              <circle cx={lx} cy={ly} r={X5_LOUPE.r} fill="#e9e4d8" />
              <g clipPath="url(#lb-loupe)">
                {tenth.map((v) => (
                  <g key={v}>
                    <path d={`M${lp([v, -1])[0]} ${ly - X5_LOUPE.r}V${ly + X5_LOUPE.r}`} stroke="#64748b" strokeOpacity={Math.abs(v) < 1e-9 ? 0.7 : 0.18} strokeWidth={Math.abs(v) < 1e-9 ? 1.4 : 0.6} />
                    <path d={`M${lx - X5_LOUPE.r} ${lp([0, v])[1]}H${lx + X5_LOUPE.r}`} stroke="#64748b" strokeOpacity={Math.abs(v) < 1e-9 ? 0.7 : 0.18} strokeWidth={Math.abs(v) < 1e-9 ? 1.4 : 0.6} />
                  </g>
                ))}
                <path d={loupeFlower.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join("") + "Z"} fill={PAINT} fillOpacity={0.85} stroke={PAINT_DARK} strokeWidth={1.4} strokeLinejoin="round" />
                <circle cx={lp([0, 0])[0]} cy={lp([0, 0])[1]} r={3} fill="#e5e7eb" stroke={INK} />
              </g>
              <circle cx={lx} cy={ly} r={X5_LOUPE.r} fill="none" stroke="#57534e" strokeWidth={3} />
              <text x={lx} y={ly - X5_LOUPE.r - 4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={INK}>
                10 গুণ কাছে
              </text>
            </g>
          )}
        </LB_Wall>
      </div>
      <div className="mt-1 min-h-10 text-center text-sm leading-snug">{say(SAY, play.running ? Math.max(0, phase - 1) : phase)}</div>
      {!done && (
        <div className="mt-1 flex justify-center">
          <button type="button" className={primaryBtn} disabled={play.running} onClick={go}>
            {BTN[Math.min(phase, 2)]}
          </button>
        </div>
      )}
      <Task done={done}>ফুলটা পুঁচকে lens দিয়ে পাঠান, কাছে গিয়ে দেখুন, তারপর ফিরিয়ে আনুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · The extra column. 5.2's খাতা, two flats, four columns: bed, bath, sq
//     ft, sq m. Tap two column heads: they become a 2 × 2, its two columns
//     drawn as directions (each scaled to one length, its real numbers on
//     tap), the patch between them, and ad − bc. Only sq ft with sq m folds:
//     0.

const X6_COLS = [
  { key: "bed", v: [2, 3] as XY },
  { key: "bath", v: [1, 2] as XY },
  { key: "sq ft", v: [538, 1614] as XY },
  { key: "sq m", v: [50, 150] as XY },
];
const X6_SLOTS = ["flat 1", "flat 2"] as const;
const X6F = makeFrame(-0.1, 0.95, -0.1, 1.85, 64, 6);
const unit = (v: XY): XY => {
  const n = Math.hypot(v[0], v[1]);
  return [v[0] / n, v[1] / n];
};

export function ExtraColumn() {
  const pass = useGate();
  const [pair, setPair] = useSeed<number[]>("pair", []);
  const draw = usePlay(700);
  const two = pair.length === 2;
  const cols: Cols | null = two ? [X6_COLS[pair[0]].v, X6_COLS[pair[1]].v] : null;
  const D = cols ? det(cols) : null;
  const zero = D !== null && Math.abs(D) < 1e-9;
  const [p, q, r, s] = useTween(cols ? [...unit(cols[0]), ...unit(cols[1])] : [0.001, 0, 0, 0.001], 650);
  const u1: XY = [p, q];
  const u2: XY = [r, s];
  const settled = two && !draw.running;
  const done = zero && settled;
  const tap = (i: number) => {
    if (draw.running || done) return;
    const next = pair.length === 2 ? [i] : pair.includes(i) ? pair.filter((j) => j !== i) : [...pair, i].sort((a, b) => a - b);
    setPair(next);
    if (next.length === 2) {
      const c: Cols = [X6_COLS[next[0]].v, X6_COLS[next[1]].v];
      draw.play(1, flat(c) ? () => pass("বাড়তি column থাকলে det শূন্য. Code নিজেই ধরে.") : undefined);
    }
  };
  return (
    <>
      <div className="mx-auto w-full max-w-[21rem] rounded-2xl border border-[#d6c9a3] bg-[#fbf6e8] p-2 text-[#0f1b2d]">
        <div className="mb-1 text-center text-xs font-semibold">দালাল ভাইয়ের খাতা, প্রথম পাতা</div>
        <div className="grid grid-cols-[3.2rem_repeat(4,1fr)] gap-1 text-center text-[0.8rem]">
          <span />
          {X6_COLS.map((c, i) => (
            <button
              key={c.key}
              type="button"
              onClick={() => tap(i)}
              className={`cursor-pointer rounded-lg border-2 px-1 py-1 font-semibold transition-colors motion-reduce:transition-none ${
                pair.includes(i) ? (settled && zero ? "border-[#0d9488] bg-[#0d9488] text-white" : "border-[#2563eb] bg-[#2563eb]/15") : "border-[#d6c9a3] hover:border-[#2563eb]/60"
              }`}
            >
              {c.key}
            </button>
          ))}
          {[0, 1].map((row) => (
            <div key={row} className="contents">
              <span className="self-center text-xs">flat {row + 1}</span>
              {X6_COLS.map((c, i) => (
                <span key={c.key} className={`rounded font-mono ${pair.includes(i) ? "bg-[#2563eb]/10 font-bold" : ""}`}>
                  {num(c.v[row])}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <Plane f={X6F} grid={0} axes={false} paper={false} label="বেছে নেওয়া দুই column এর দিক, আর তাদের মাঝের ছোপ" className="my-0! max-w-[5.5rem]">
          <rect width={X6F.W} height={X6F.H} rx={6} fill="#e9e4d8" />
          {two && <path d={poly(X6F, patchPts(u1, u2))} fill={zero && settled ? "none" : GLOW} fillOpacity={0.7} stroke={LAMP} strokeWidth={zero && settled ? 3 : 1.2} strokeLinejoin="round" />}
          {two && cols && (
            <>
              <Arrow f={X6F} from={[0, 0]} to={u2} tone="teal" w={zero ? 4.5 : 2.4} list={`(${cols[1][0]}, ${cols[1][1]})`} />
              <Arrow f={X6F} from={[0, 0]} to={u1} tone="amber" w={2.2} list={`(${cols[0][0]}, ${cols[0][1]})`} />
            </>
          )}
          <circle cx={X6F.sx(0)} cy={X6F.sy(0)} r={3} fill="#e5e7eb" stroke={INK} />
        </Plane>
        <div className="min-w-[9rem] text-sm">
          {two && cols ? (
            <>
              <div className="text-xs text-muted">সামিনের app এ 2 × 2</div>
              <div className="font-mono text-sm">
                <span className="text-cat-amber">
                  <Tup v={cols[0]} of={X6_SLOTS} />
                </span>{" "}
                <span className="text-cat-teal">
                  <Tup v={cols[1]} of={X6_SLOTS} />
                </span>
              </div>
              {settled && (
                <div key={pair.join()} className={`${POP} mt-1 font-mono text-sm font-bold ${zero ? "text-accent-text" : ""}`}>
                  ad − bc = {fmt(D ?? 0)}
                </div>
              )}
            </>
          ) : (
            <span className="text-muted">দুইটা column এর মাথায় tap করুন.</span>
          )}
        </div>
      </div>
      {settled && !zero && (
        <Nope key={pair.join()}>
          det {fmt(D ?? 0)}. দুই column দুই দিকে, মাঝে ছোপ আছে. তাই দুইটাই নিজের নিজের information দেয়.
        </Nope>
      )}
      <Task done={done}>খাতার দুইটা column বেছে app এ দিন. কোন জোড়ার det শূন্য আসে, খুঁজে বের করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn. The six and the seventh, one at a time: tap রাখো or পুকুরে.
//     The lens glides there and the one ঘর runs through it on the small wall
//     in the middle. A wrong side: the patch says why, the lens comes back.

const X7_ORDER: Lens[] = [...BOX, SEVEN];
const X7F = makeFrame(-1.3, 3.3, -0.9, 2.3, 20, 2);
const X7_HOME: XY = [160, 36];
const X7_KEEP: XY[] = [
  [30, 104],
  [74, 104],
  [30, 144],
  [74, 144],
];
const X7_POND: XY[] = [
  [246, 108],
  [284, 104],
  [228, 140],
  [266, 140],
  [300, 136],
  [248, 124],
  [286, 124],
];

function X7_Nope({ l, side }: { l: Lens; side: 0 | 1 }) {
  if (side === 0) return <>ছোপ চ্যাপ্টা হয়ে দাগ. {detLine(l.cols)}. এই lens ছবি পিষে ফেলে.</>;
  if (l.key === "tiny") return <>ছোপ ছোট, তবু চারকোনা. {detLine(l.cols)}. শূন্য না.</>;
  return <>ছোপ দাঁড়ালো {fmt(Math.abs(det(l.cols)))} ঘর. {detLine(l.cols)}. শূন্য না.</>;
}

export function YourBox() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [placed, setPlaced] = useSeed<(0 | 1)[]>("placed", []);
  const [tried, setTried] = useSeed<0 | 1 | null>("tried", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const go = useLensRun(1000, 20);
  const cur = X7_ORDER[at] as Lens | undefined;
  const all = at >= X7_ORDER.length;
  const t = tried === null ? 0 : go.running ? go.t : 1;
  const choose = (side: 0 | 1) => {
    if (go.running || !cur) return;
    setTried(side);
    const right = (side === 1) === flat(cur.cols);
    go.run(() => {
      if (!right) {
        setMiss(miss + 1);
        return;
      }
      const next = [...placed, side];
      setPlaced(next);
      setTried(null);
      setAt(at + 1);
      if (at + 1 >= X7_ORDER.length) pass("ad − bc শূন্য হলে পুকুরে, না হলে রিনার.");
    });
  };
  const wrong = cur && tried !== null && !go.running && (tried === 1) !== flat(cur.cols);
  let nk = 0;
  let np = 0;
  const spots = placed.map((s) => (s === 0 ? X7_KEEP[nk++] : X7_POND[np++]));
  const target: XY = tried === null ? X7_HOME : tried === 0 ? X7_KEEP[nk] : X7_POND[np];
  const curAt: XY = wrong ? X7_HOME : mix(X7_HOME, target, t);
  const m = cur ? partway(byCols(cur.cols), tried === null ? 0 : t) : null;
  const s1 = m ? m([1, 0]) : ([1, 0] as XY);
  const s2 = m ? m([0, 1]) : ([0, 1] as XY);
  return (
    <>
      <div className="mx-auto w-full max-w-[21rem] overflow-hidden rounded-2xl ring-1 ring-black/10">
        <svg viewBox="0 0 320 170" role="group" aria-label="বামে মাদুর, রিনার lens এর জায়গা; ডানে পুকুর; মাঝে এখনকার lens আর তার এক ঘরের ছোপ" className="block h-auto w-full select-none">
          <rect width={320} height={170} fill="#0f172a" />
          <rect y={70} width={320} height={100} fill="#1f2d1f" />
          <LB_Mat x={8} y={84} w={90} h={80} />
          <text x={53} y={78} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={MOON}>
            রিনার
          </text>
          <LB_Pond cx={266} cy={128} rx={50} ry={26} />
          <text x={266} y={84} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={MOON}>
            পুকুর
          </text>
          <g transform={`translate(${160 - X7F.W / 2} 70)`}>
            <rect width={X7F.W} height={X7F.H} rx={4} fill="#e9e4d8" />
            <WallClip f={X7F}>
              <WallGrid f={X7F} nums={false} />
              <LB_Unit f={X7F} />
              {cur && tried !== null && <LB_LightPatch f={X7F} pts={patchPts(s1, s2)} />}
              {cur && tried !== null && !go.running && Math.abs(det(cur.cols)) > 0 && Math.abs(det(cur.cols)) < 0.5 && <circle cx={X7F.sx(0.05)} cy={X7F.sy(0.05)} r={7} fill="none" stroke={BAD} strokeWidth={1.4} className={POP} />}
            </WallClip>
            <circle cx={X7F.sx(0)} cy={X7F.sy(0)} r={2.4} fill="#e5e7eb" stroke={INK} strokeWidth={0.8} />
          </g>
          {placed.map((_, i) => (
            <g key={X7_ORDER[i].key} style={{ transform: `translate(${spots[i][0]}px, ${spots[i][1]}px)` }} className="transition-transform duration-700 motion-reduce:transition-none">
              <LB_Disc x={0} y={0} r={14} cols={X7_ORDER[i].cols} />
            </g>
          ))}
          {cur && (
            <g key={cur.key} className={POP}>
              <LB_Disc x={curAt[0]} y={curAt[1]} r={tried === null || wrong ? 22 : 14 + 8 * (1 - t)} cols={cur.cols} mark={wrong ? "x" : undefined} />
            </g>
          )}
          {all && (
            <text x={160} y={40} textAnchor="middle" fontSize={11} fontWeight={800} fill={GLOW} className={POP}>
              সাতটাই জায়গামতো
            </text>
          )}
        </svg>
      </div>
      <div className="mt-2 flex justify-center gap-3">
        <button type="button" className={primaryBtn} disabled={all || go.running} onClick={() => choose(0)}>
          রিনার জন্য রাখো
        </button>
        <button type="button" className={primaryBtn} disabled={all || go.running} onClick={() => choose(1)}>
          পুকুরে
        </button>
      </div>
      <div className="mt-1 text-center text-xs text-muted">
        lens <span className="font-mono">{Math.min(at + 1, X7_ORDER.length)}</span> / <span className="font-mono">{X7_ORDER.length}</span>
      </div>
      {wrong && cur && tried !== null && (
        <Nope key={miss}>
          <X7_Nope l={cur} side={tried} />
        </Nope>
      )}
      <Task done={all}>প্রতিটা lens এর ad − bc মনে মনে করুন. তারপর রাখুন, না হলে পুকুরে দিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it. Rina's own lens [[1, 2], [2, ?]]: three chips, 2 · 4 · 1. A chip
//     glides the teal side's head to (2, chip) and the patch opens: 2 and 1
//     leave a patch with area; 4 lays it on the amber side's line.

const X8F = makeFrame(-0.8, 3.8, -0.6, 6.4, 24, 6);
const X8_CHIPS = [2, 4, 1];
const X8_RIGHT = 1;

export function TryZero() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const land = usePlay(800);
  const d = pick === null ? null : X8_CHIPS[pick];
  const [hy] = useTween([d ?? 3], 700);
  const s1: XY = [1, 2];
  const s2: XY = [2, hy];
  const area = Math.abs(1 * hy - 2 * 2);
  const over = pick !== null && !land.running;
  const done = over && pick === X8_RIGHT;
  const choose = (i: number) => {
    if (land.running || done) return;
    setPick(i);
    land.play(1, () => (i === X8_RIGHT ? pass("(2, 4) হলো (1, 2) এর দ্বিগুণ: শূন্য.") : setMiss(miss + 1)));
  };
  const cols: Cols = [s1, [2, d ?? 0]];
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <Plane f={X8F} grid={0} axes={false} paper={false} label="রিনার lens: প্রথম column (1, 2), দ্বিতীয় (2, ?); বেছে নেওয়া সংখ্যায় ছোপ খোলে, না হলে দাগ" className="my-0! max-w-[8rem]">
          <WallClip f={X8F}>
            <WallBed f={X8F} door={false} window={false} tree={false} />
            <WallGrid f={X8F} nums={false} />
            <LB_Unit f={X8F} />
            {pick !== null && <LB_ChalkPatch f={X8F} pts={patchPts(s1, s2)} />}
            {pick === null && <path d={`M${X8F.sx(2)} ${X8F.sy(-0.5)}V${X8F.sy(6.3)}`} stroke="#0f766e" strokeWidth={1.4} strokeDasharray="4 3" />}
          </WallClip>
          <Post f={X8F} />
          {pick !== null && <Arrow f={X8F} from={[0, 0]} to={s2} tone="teal" w={2.6} />}
          <Arrow f={X8F} from={[0, 0]} to={s1} tone="amber" w={2.4} />
          {pick === null && (
            <text x={X8F.sx(2) + 5} y={X8F.sy(5.5)} fontSize={13} fontWeight={800} fill="#0f766e">
              ?
            </text>
          )}
        </Plane>
        <div className="text-center">
          <div className="text-xs text-muted">রিনার নকশা</div>
          <div className="mt-1 inline-flex items-stretch font-mono text-lg font-bold">
            <span className="w-1 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
            <span className="flex flex-col px-1 text-cat-amber">
              <span>1</span>
              <span>2</span>
            </span>
            <span className="flex flex-col px-1 text-cat-teal">
              <span>2</span>
              <span className="min-w-5">{d === null ? "?" : <span key={d} className={`${POP} inline-block`}>{d}</span>}</span>
            </span>
            <span className="w-1 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
          </div>
          <div className="mt-2 text-sm">
            জায়গা: <span className="font-mono font-bold">{pick === null ? "?" : fmt(Math.round(area * 10) / 10)}</span> ঘর
          </div>
          {over && <div className={`${POP} mt-1 font-mono text-xs font-bold`}>{detLine(cols)}</div>}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {X8_CHIPS.map((c, i) => (
          <button
            key={c}
            type="button"
            disabled={done || land.running}
            onClick={() => choose(i)}
            className={`grid size-12 cursor-pointer place-items-center rounded-xl border-2 font-mono text-xl font-bold transition-colors disabled:cursor-default motion-reduce:transition-none ${
              pick === i && over ? (i === X8_RIGHT ? "border-accent bg-accent text-accent-foreground" : "border-danger/50 bg-danger/5 text-danger") : "border-border hover:border-cat-blue/60"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {over && pick !== X8_RIGHT && (
        <Nope key={miss}>
          ছোপ রইলো, {fmt(area)} ঘর. দুই পাশ দুই দিকে গেছে. সবুজ পাশটা কমলার লাইনে পড়তে হলে (1, 2) এর ঠিক দ্বিগুণ হতে হবে.
        </Nope>
      )}
      <Task done={done}>কোন সংখ্যা বসালে এই lens পুকুরে যাবে? একটা সংখ্যা বেছে ছোপটা দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The morning run. The new bulb is in. A tap puts that lens in the
//     machine: the chalk grid's light is thrown through it, onto the wall.
//     Under each lens, নাসিবের ভাগ; once run, where it really goes.

const X9F = wallFrame(18, 6);

export function MorningRun() {
  const pass = useGate();
  const [opened, setOpened] = useSeed<boolean[]>("opened", [false, false, false, false, false, false]);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const go = useLensRun(1200, 24);
  const t = cur === null ? 0 : go.running ? go.t : 1;
  const all = opened.every(Boolean);
  const tap = (i: number) => {
    if (go.running) return;
    setCur(i);
    const next = opened.map((o, j) => o || j === i);
    go.run(() => {
      setOpened(next);
      if (next.every(Boolean) && !all) pass("নাসিবের রাখার ভাগেও দুইটা পুকুরের.");
    });
  };
  const l = cur === null ? null : BOX[cur];
  return (
    <>
      <div className="flex justify-center">
        <LB_Wall f={X9F} label="নতুন bulb; যেই lens বাছবেন, যন্ত্র সেটা দিয়ে পুরা grid এর আলো দেয়ালে ফেলে" width="max-w-[17rem]" door under={l ? <LightGrid f={X9F} move={byCols(l.cols)} t={t} ghost /> : null}>
          {l && !go.running && (
            <g key={l.key} className={POP}>
              <rect x={6} y={6} width={flat(l.cols) ? 104 : 96} height={18} rx={9} fill={flat(l.cols) ? BAD : OK} />
              <text x={flat(l.cols) ? 58 : 54} y={18.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="white">
                {flat(l.cols) ? "চ্যাপ্টা: পুকুরে" : "ছবি আছে: রিনার"}
              </text>
            </g>
          )}
        </LB_Wall>
      </div>
      <div className="mx-auto mt-2 grid max-w-[21rem] grid-cols-3 gap-1.5">
        {BOX.map((b, i) => (
          <button
            key={b.key}
            type="button"
            disabled={go.running}
            onClick={() => tap(i)}
            className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-1 transition-colors disabled:cursor-default motion-reduce:transition-none ${
              cur === i ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"
            }`}
          >
            <LB_Matrix cols={b.cols} small />
            <span className="text-[0.7rem] leading-tight text-muted">নাসিব: {b.nasib === "keep" ? "রাখো" : "ফেলো"}</span>
            <span className="h-4 text-[0.72rem] font-semibold leading-tight">
              {opened[i] && (
                <span className={flat(b.cols) ? "text-danger" : "text-accent-text"}>
                  {flat(b.cols) ? "পুকুরে" : "রিনার"} <LB_Mark ok={(b.nasib === "throw") === flat(b.cols)} />
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      {all && !go.running && (
        <div className={`${FADE} mx-auto mt-2 max-w-sm text-center text-sm leading-snug`}>
          নাসিবের রাখার ভাগে পুরানো, একশ আর G. প্রথম দুইটাই চ্যাপ্টা. ফেলার ভাগের পুঁচকেটা রাখার মতো.
        </div>
      )}
      <Ticks items={[["ছয়টা lens চালানো", all]]} />
      <Task done={all && !go.running}>ছয়টা lens একটা একটা করে যন্ত্রে দিন. আপনার বাজির সাথে মিলিয়ে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes.

// 1a · Night on the বারান্দা. The হারিকেন; the machine dark on its stand; the
//      লাইট ভাই with his old box open on the মাদুর; সামিন with the lenses;
//      নাসিব sorting them in two piles and saying so.

const S1_PILE_A: XY[] = [
  [128, 132],
  [142, 128],
  [156, 132],
];
const S1_PILE_B: XY[] = [
  [196, 132],
  [210, 128],
  [224, 132],
];

export function BoxNight({}: Story) {
  const s = useScene(4, [600, 1800, 2000, 2400, 2400]);
  const k = s.k;
  const inHand: XY[] = [
    [182, 108],
    [190, 104],
    [198, 108],
    [186, 114],
    [194, 114],
    [190, 99],
  ];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাত; বারান্দায় হারিকেন; bulb কাটা যন্ত্র; মাদুরে লাইট ভাইয়ের খোলা বাক্স; সামিনের তালুতে ছয়টা lens; নাসিব সংখ্যা দেখে দুই ভাগ করলো; বললো, বড় সংখ্যার lens বড় ছবি দেয়, ছোট সংখ্যারটা ফালায় দেন">
        <LB_Verandah />
        <Projector x={286} y={138} facing={-1} lens="old" />
        <path d="M282 72l8 8M290 72l-8 8" stroke={BAD} strokeWidth={1.6} strokeLinecap="round" />
        <LB_Mat x={100} y={126} w={140} h={14} />
        <Chest x={116} y={138} open />
        <LightBhai x={70} y={138} facing={1} arm={k === 1 ? "point" : "down"} nameTone={MOON} />
        <Person who="samin" x={168} y={138} arm="hold" />
        <LB_Name x={168} y={138} n="সামিন" />
        <Person who="nasib" x={250} y={138} facing={-1} arm={k >= 2 ? "point" : "down"} />
        <LB_Name x={250} y={138} n="নাসিব" />
        {(k < 2 ? inHand : [...S1_PILE_A, ...S1_PILE_B]).map(([x, y], i) => (
          <g key={i} style={{ transform: `translate(${x}px, ${y}px)` }} className="transition-transform duration-1000 ease-out motion-reduce:transition-none">
            <circle r={5} fill="#bae6fd" stroke="#e2e8f0" strokeWidth={0.8} />
          </g>
        ))}
        {k === 1 && <Bubble x={70} y={72} side="right" lines={["ছবি পিষা ফালায় যেগুলা,", "সেগুলা পুকুরে."]} />}
        {k === 3 && <Bubble x={250} y={72} side="left" lines={["বড় সংখ্যার lens", "বড় ছবি দেয়."]} />}
        {k >= 4 && <Bubble x={250} y={72} side="left" lines={["ছোট সংখ্যারটা", "ফালায় দেন."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · সোম in front of the wall at night, the torch on Rina's chalk line: the
//      flat patch. He has seen this line before.

export function SomLine({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const W = STAGE_WALL_F;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাতে দেয়ালে রিনার চকের দাগ, পুরানো lens এর চ্যাপ্টা ঘর; সোম টর্চ ধরে দাঁড়িয়ে; বললো, এই দাগ আগেও দেখছি">
        <StageWall x={16} y={30}>
          <path d={`M${W.sx(0)} ${W.sy(0)}L${W.sx(6)} ${W.sy(3)}`} stroke={CHALK} strokeWidth={2.4} strokeLinecap="round" />
          {k >= 1 && <circle cx={W.sx(3)} cy={W.sy(1.5)} r={30} fill={GLOW} opacity={0.25} className={FADE} />}
        </StageWall>
        <Person who="som" x={236} y={150} facing={-1} arm={k >= 1 ? "point" : "down"} />
        <LB_Name x={236} y={150} n="সোম" />
        {k >= 2 && <Bubble x={236} y={86} side="left" lines={["এই দাগ তো", "আগেও দেখছি."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · নাসিব lifts the biggest one from his keep pile: four 100s.

export function NasibHundred({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="নাসিব তার রাখার ভাগ থেকে সবচেয়ে বড় সংখ্যার lens তুলে ধরলো, চার ঘরেই 100; বললো, এইটা দিয়া দেয়াল ভরে যাবে">
        <LB_Verandah />
        <LB_Mat x={90} y={126} w={120} h={14} />
        <Person who="nasib" x={160} y={138} arm={k >= 1 ? "hold" : "down"} />
        <LB_Name x={160} y={138} n="নাসিব" />
        {k >= 1 && (
          <g className={POP}>
            <LB_Disc x={186} y={70} r={20} cols={L_BIG} />
          </g>
        )}
        <Person who="samin" x={250} y={138} facing={-1} />
        <LB_Name x={250} y={138} n="সামিন" />
        {k >= 2 && <Bubble x={140} y={72} side="left" lines={["এইটা দিয়া", "দেয়াল ভরে যাবে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · নাসিব holds up the smallest from his throw pile; সামিন's phone: 0.01.

export function NasibTiny({}: Story) {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="নাসিব ফেলার ভাগ থেকে পুঁচকে lens তুললো, 0.1 আর 0; বললো, এইটা তো কিছুই না, ফালাও; সামিনের phone এ 0.1·0.1 − 0·0 = 0.01">
        <LB_Verandah />
        <Person who="nasib" x={110} y={138} arm={k >= 1 ? "hold" : "down"} />
        <LB_Name x={110} y={138} n="নাসিব" />
        {k >= 1 && (
          <g className={POP}>
            <LB_Disc x={136} y={70} r={20} cols={L_TINY} />
          </g>
        )}
        {k >= 2 && <Bubble x={96} y={70} side="left" lines={["এইটা তো কিছুই না.", "ফালাও."]} />}
        <Person who="samin" x={236} y={138} facing={-1} arm="hold" />
        <LB_Name x={236} y={138} n="সামিন" />
        <g transform="translate(196 56)">
          <rect width={36} height={58} rx={5} fill="#1e293b" />
          <rect x={3} y={5} width={30} height={46} rx={2} fill="#e0f2fe" />
          {k >= 3 && (
            <g className={POP} fontFamily={MONO} fontWeight={800} textAnchor="middle" fill={INK}>
              <text x={18} y={22} fontSize={5.5}>
                0.1·0.1
              </text>
              <text x={18} y={30} fontSize={5.5}>
                − 0·0
              </text>
              <text x={18} y={42} fontSize={8} fill="#1d4ed8">
                0.01
              </text>
            </g>
          )}
        </g>
      </Stage>
    </StoryFrame>
  );
}

// 6a · সামিন opens an old photo on his phone: 5.2's খাতা, area written twice.

export function SaminKhata({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const rows = [
    ["", "bed", "bath", "sq ft", "sq m"],
    ["1", "2", "1", "538", "50"],
    ["2", "3", "2", "1614", "150"],
  ];
  const xs = [6, 22, 40, 66, 96];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="সামিন phone এ 5.2 এর দালাল ভাইয়ের খাতার ছবি খুললো; এক পাতায় area দুইবার লেখা, sq ft আর sq m">
        <LB_Verandah />
        <Person who="samin" x={78} y={138} arm="hold" />
        <LB_Name x={78} y={138} n="সামিন" />
        <Person who="som" x={284} y={138} facing={-1} />
        <LB_Name x={284} y={138} n="সোম" />
        <g transform="translate(120 34)">
          <rect width={132} height={80} rx={8} fill="#1e293b" />
          <rect x={5} y={6} width={122} height={68} rx={3} fill="#fbf6e8" />
          {k >= 1 && (
            <g className={FADE} fill={INK}>
              <text x={66} y={19} textAnchor="middle" fontSize={7.5} fontWeight={700}>
                দালাল ভাইয়ের খাতা
              </text>
              {rows.map((r, i) =>
                r.map((c, j) => (
                  <text key={`${i}${j}`} x={xs[j] + 4} y={36 + i * 13} fontFamily={MONO} fontSize={7.5} fontWeight={i === 0 ? 700 : 400}>
                    {c}
                  </text>
                )),
              )}
              {k >= 2 && <rect x={67} y={26} width={57} height={44} rx={3} fill="none" stroke={BAD} strokeWidth={1.4} className={POP} />}
            </g>
          )}
        </g>
        {k >= 2 && <Bubble x={78} y={74} side="mid" lines={["একই area,", "দুইবার লেখা."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 7a · The লাইট ভাই feels at the bottom of the box: a seventh lens, its first
//      column blank.

export function SeventhLens({}: Story) {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="লাইট ভাই বাক্সের তলা থেকে আরেকটা lens বের করলেন, সাত নম্বর; তার প্রথম column এ দুইটাই 0">
        <LB_Verandah />
        <LB_Mat x={100} y={126} w={140} h={14} />
        <Chest x={170} y={138} open />
        <LightBhai x={126} y={138} facing={1} arm={k >= 1 ? "hold" : "down"} nameTone={MOON} />
        {k >= 1 && (
          <g className={POP}>
            <LB_Disc x={170} y={82} r={22} cols={L_SEVEN} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <rect x={196} y={70} width={84} height={16} rx={8} fill="#b45309" />
            <text x={238} y={81} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="white">
              প্রথম column: 0, 0
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Morning. The লাইট ভাই screws in the new bulb; the machine throws its
//      light on the wall; রিনা waits with her কৌটা.

export function NewBulb({}: Story) {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  const PJ: XY = [262, 150];
  const [lx, ly] = projectorLens(PJ[0], PJ[1], -1);
  const W = STAGE_WALL_F;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="সকাল; লাইট ভাই নতুন bulb লাগালেন; যন্ত্রের আলো দেয়ালে পড়লো; রিনা কৌটা হাতে দাঁড়িয়ে">
        <StageWall x={16} y={30}>{k >= 2 && <LightGrid f={W} move={byCols(GOOD_LENS)} t={0} x0={-2} x1={8} y0={-1} y1={5} />}</StageWall>
        {k >= 2 && <StageBeam from={[lx, ly]} to={[16 + W.sx(3), 30 + W.sy(2)]} w={16} />}
        <Projector x={PJ[0]} y={PJ[1]} facing={-1} on={k >= 2} lens="good" />
        <LightBhai x={292} y={150} facing={-1} arm={k >= 1 ? "point" : "hold"} />
        {k >= 1 && k < 2 && (
          <g className={POP}>
            <circle cx={lx + 18} cy={ly - 12} r={5} fill="#fef9c3" stroke="#a16207" />
          </g>
        )}
        <Person who="rina" x={198} y={150} facing={-1} arm="hold" label />
      </Stage>
    </StoryFrame>
  );
}

// 10a · Dawn at the পুকুর. The লাইট ভাই throws the flat lenses in, one after
//       another; নাসিব, beside him, slips the four-ones lens into his pocket.

export function PukurDawn({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  const SINK: XY[] = [
    [168, 150],
    [196, 158],
    [226, 152],
    [252, 160],
  ];
  const THROWN = [OLD_LENS, L_SPARE, L_BIG, L_SEVEN];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={124} label="ভোরে পুকুরপাড়; লাইট ভাই চ্যাপ্টা lens গুলো একটা একটা করে পানিতে ফেললেন; পাশে নাসিব চার এক এর lens টা পকেটে ঢুকালো">
        <LB_Pond cx={214} cy={154} rx={96} ry={20} ripples={SINK.slice(0, k >= 2 ? 4 : k >= 1 ? 2 : 0)} />
        <LightBhai x={70} y={140} facing={1} arm={k === 1 || k === 2 ? "wave" : "hold"} />
        {THROWN.map((c, i) => {
          const gone = (k >= 1 && i < 2) || (k >= 2 && i >= 2);
          return (
            !gone && (
              <g key={i}>
                <LB_Disc x={88 + (i % 2) * 12} y={106 + Math.floor(i / 2) * 12} r={6} cols={c} />
              </g>
            )
          );
        })}
        <Person who="nasib" x={120} y={144} facing={-1} arm={k >= 3 ? "hold" : "down"} label />
        {k < 3 ? <LB_Disc x={128} y={112} r={6} cols={L_ONES} /> : <rect x={112} y={112} width={10} height={8} rx={1} fill="#1e3a8a" opacity={0.6} className={POP} />}
      </Stage>
    </StoryFrame>
  );
}

// 10b · Rina wipes the two kept lenses with her ওড়না.

export function RinaWipes({}: Story) {
  const s = useScene(2, [600, 1800, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="রিনা রাখা দুইটা lens ওড়না দিয়ে মুছলো, পুঁচকে আর G">
        <Person who="rina" x={130} y={150} arm="hold" label />
        <g style={{ transform: `translate(${k >= 1 ? 6 : -6}px, 0px)` }} className="transition-transform duration-700 motion-reduce:transition-none">
          <path d="M138 96q18 10 36 2q-4 16 -20 18q-12 0 -16 -20Z" fill="#f472b6" opacity={0.85} />
        </g>
        <LB_Disc x={186} y={84} r={16} cols={L_TINY} />
        <LB_Disc x={222} y={96} r={16} cols={GOOD_LENS} />
        {k >= 2 && (
          <g className={POP}>
            <path d="M178 68l3 -6M190 66l4 -5M226 78l3 -6M214 80l-2 -6" stroke={GLOW} strokeWidth={2} strokeLinecap="round" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 10c · The bridge to 8.5. At the door: the লাইট ভাই wants two lenses
//       together for the piece above it, and a দুইগুণ on top; রিনা looks at
//       her empty কৌটা.

export function DoorPiece({}: Story) {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  const W = STAGE_WALL_F;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="দরজার উপরের বড় জায়গা; লাইট ভাই দুইটা lens একসাথে ধরলেন, বললেন উপরে আবার দুইগুণ; রিনার কৌটা খালি">
        <StageWall x={16} y={30}>
          <rect x={W.sx(4.5)} y={W.sy(5.5)} width={W.u * 3} height={W.u * 2.6} fill="none" stroke={CHALK} strokeWidth={1.6} strokeDasharray="4 3" />
          {k >= 1 && (
            <text x={W.sx(6)} y={W.sy(4)} textAnchor="middle" fontSize={16} fontWeight={800} fill={CHALK} className={POP}>
              ?
            </text>
          )}
        </StageWall>
        <LightBhai x={224} y={150} facing={-1} arm={k >= 1 ? "hold" : "point"} />
        {k >= 1 && (
          <g className={POP}>
            <LB_Disc x={196} y={104} r={9} cols={L_Z} />
            <LB_Disc x={196} y={124} r={9} cols={L_W} />
          </g>
        )}
        {k >= 2 && <Bubble x={224} y={70} side="left" lines={["উপরে আবার", "একটা দুইগুণ."]} />}
        <Person who="rina" x={286} y={150} facing={-1} arm="hold" label />
        {k >= 3 && (
          <g className={POP}>
            <rect x={264} y={116} width={12} height={14} rx={2} fill="#f8fafc" stroke="#64748b" />
            <path d="M264 120h12" stroke="#64748b" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · The stake: the bulb out, six lenses nobody can try; a lens that goes
//      into the পুকুর never comes back; a flat one kept spoils Rina's wall.

const X1B_SAY = [
  "Bulb কাটা. ছয়টা lens, একটাও চালিয়ে দেখার উপায় নাই.",
  "পুকুরে গেলে lens আর ফেরে না.",
  "ভালো lens টা গেলে? রিনার দেয়ালের ছবিটা আর হবে না.",
  "পিষে ফেলা lens রেখে দিলে? কাল রিনা রং নিয়ে দাঁড়াবে, দেয়ালে পড়বে শুধু একটা দাগ.",
];

export function LensStake() {
  const s = useScene(3, [600, 1800, 2200, 2600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <svg viewBox="0 0 240 120" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="কাটা bulb, ছয়টা lens; একটা পুকুরে পড়লো; রাখা lens এর আলো দেয়ালে একটা দাগ">
        <rect width={240} height={120} rx={8} fill="#0f172a" />
        <g transform="translate(26 26)">
          <circle r={11} fill="#475569" stroke="#94a3b8" />
          <path d="M-4 -4l8 8M4 -4l-8 8" stroke={BAD} strokeWidth={1.8} strokeLinecap="round" />
          <rect x={-5} y={10} width={10} height={6} fill="#64748b" />
        </g>
        {BOX.map((l, i) => {
          const sunk = k >= 1 && i === 5;
          return !sunk && <LB_Disc key={l.key} x={62 + (i % 3) * 34} y={30 + Math.floor(i / 3) * 34} r={13} cols={l.cols} />;
        })}
        <LB_Pond cx={196} cy={92} rx={34} ry={12} ripples={k >= 1 ? [[196, 92]] : []} />
        {k >= 2 && (
          <text x={196} y={70} textAnchor="middle" fontSize={16} fontWeight={800} fill="#93c5fd" className={POP}>
            ?
          </text>
        )}
        {k >= 3 && (
          <g className={FADE}>
            <rect x={150} y={8} width={82} height={46} rx={3} fill="#e9e4d8" />
            <path d="M156 48L226 14" stroke={LAMP} strokeWidth={3} strokeLinecap="round" />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Copy a column: the second side swings onto the first. 3, 1.5, then 0
//      when it is a copy, and 0 again when it is twice the first.

const X2B_F = makeFrame(-0.5, 5.5, -0.5, 3.5, 30, 6);
const X2B_B: XY[] = [
  [1, 2],
  [1.5, 1.5],
  [2, 1],
  [4, 2],
];
const X2B_SAY = [
  "দুই পাশ দুই দিকে: (2, 1) আর (1, 2). জায়গা 3.",
  "দ্বিতীয় পাশ প্রথমটার দিকে হেলছে. জায়গা 1.5.",
  "একদম কপি: দুই পাশই (2, 1). জায়গা 0.",
  "কপি না, দ্বিগুণ: (4, 2). তবু একই লাইন. জায়গা 0.",
];

export function CopyColumn() {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const f = X2B_F;
  const [bx, by] = useTween(X2B_B[k], 700);
  const B: XY = [bx, by];
  const A: XY = [2, 1];
  const area = Math.abs(A[0] * B[1] - B[0] * A[1]);
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <LB_Wall f={f} label="প্রথম পাশ (2, 1) স্থির; দ্বিতীয় পাশ হেলে এসে তার উপর পড়ে; জায়গা 3 থেকে 0" width="max-w-[13rem]">
        <LB_ChalkPatch f={f} pts={patchPts(A, B)} />
        <Arrow f={f} from={[0, 0]} to={B} tone="teal" w={k >= 2 ? 4.5 : 2.6} list={`(${fmt(X2B_B[k][0])}, ${fmt(X2B_B[k][1])})`} />
        <Arrow f={f} from={[0, 0]} to={A} tone="amber" w={2.2} />
        <text x={f.W - 8} y={16} textAnchor="end" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK}>
          {fmt(Math.round(area * 10) / 10)} ঘর
        </text>
      </LB_Wall>
    </Scene>
  );
}

// 3½ · The 5.2b debt: remote C's two buttons (1, 2) and (2, 5). Their patch,
//      then ad − bc = 1: not zero, so the buttons point two ways.

const X3B_F = makeFrame(-0.5, 3.5, -0.5, 7.5, 18, 6);
const X3B_SAY = [
  "5.2b এর remote C. দুই button: (1, 2) আর (2, 5).",
  "দুই button এর মাঝের ছোপ. সরু, তবু ছোপ.",
  "1·5 − 2·2 = 1. শূন্য না.",
  "তাই দুই button দুই দিকে. Independent. সেদিনের লম্বা পরীক্ষা, এক সংখ্যায়.",
];

export function RemoteC() {
  const s = useScene(3, [600, 1600, 2000, 2600]);
  const k = s.k;
  const f = X3B_F;
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <div className="flex items-center justify-center gap-3">
        <Plane f={f} grid={1} axes={false} label="remote C এর দুই button (1, 2) আর (2, 5); মাঝের সরু ছোপ, জায়গা 1" className="my-0! max-w-[5.5rem]">
          {k >= 1 && <path d={poly(f, patchPts([1, 2], [2, 5]))} fill={GLOW} fillOpacity={0.8} stroke={LAMP} strokeWidth={1.2} className={FADE} />}
          <Arrow f={f} from={[0, 0]} to={[2, 5]} tone="teal" w={2.4} draw />
          <Arrow f={f} from={[0, 0]} to={[1, 2]} tone="amber" w={2.4} draw />
        </Plane>
        <div className="min-w-[7rem] text-center">
          {k >= 2 && <div className={`${POP} font-mono text-sm font-bold`}>1·5 − 2·2 = 1</div>}
          {k >= 3 && (
            <div className={`${POP} mt-1 rounded-lg bg-accent/10 px-2 py-0.5 text-sm font-semibold text-accent-text`}>
              শূন্য না: independent
            </div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// 4½ · Size is not area: the four-100 lens next to G. Big numbers, a line;
//      small numbers, a patch of 3.

const X4B_F = makeFrame(-1, 5, -0.8, 4, 20, 4);
const X4B_SAY = [
  "দুইটা lens. একটায় চারটা 100. আরেকটায় 2, 1, 1, 2.",
  "চারটা 100: ঘরটা দেয়াল ছাড়িয়ে গেলো, কিন্তু চ্যাপ্টা. জায়গা 0.",
  "2, 1, 1, 2: ছোট সংখ্যা. ছোপ 3 ঘর.",
  "সংখ্যা কত বড়, det সেটা বলে না. জায়গার কী হলো, সেটা বলে.",
];

export function BigVsSmall() {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;
  const f = X4B_F;
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <div className="mx-auto grid max-w-[18rem] grid-cols-2 gap-2">
        {[L_BIG, GOOD_LENS].map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <LB_Matrix cols={c} small />
            <LB_Wall f={f} label={i === 0 ? "চারটা 100 এর lens: ঘর চ্যাপ্টা দাগ" : "G: ঘর থেকে 3 ঘরের ছোপ"} width="max-w-none">
              <LB_Unit f={f} />
              {k > i && (
                <WallClip f={f}>
                  <g className={FADE}>{i === 0 ? <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(8)} ${f.sy(8)}`} stroke={LAMP} strokeWidth={3} /> : <LB_LightPatch f={f} pts={patchPts(c[0], c[1])} />}</g>
                </WallClip>
              )}
            </LB_Wall>
            <div className="h-5 font-mono text-sm font-bold">{k > i ? <span className={`${POP} inline-block`}>{i === 0 ? "0" : "3"} ঘর</span> : ""}</div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// 5½ · Small comes back, zero doesn't: the tiny ফুল through ×10 is the ফুল
//      again; the old lens's line through ×10 is a longer line.

const X5B_F = makeFrame(-1.5, 3.5, -1.5, 2.5, 18, 4);
const X5B_SAY = [
  "দুইটা ছবি: পুঁচকে lens এর ফুল, আর পুরানো lens এর দাগ.",
  "দুইটাকেই 10 গুণ lens দিয়ে পাঠাই.",
  "ফুল ফিরে এলো. পুরা ফুল.",
  "দাগ লম্বা হলো. তবু দাগ. যেই ফুল থেকে এসেছিলো, সেটা আর ফেরে না.",
];

export function SmallComesBack() {
  const s = useScene(3, [600, 1600, 1800, 2600]);
  const k = s.k;
  const f = X5B_F;
  const [z] = useTween([k >= 2 ? 1 : 0.1], 800);
  const [len] = useTween([k >= 3 ? 1 : 0.1], 800);
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <div className="mx-auto grid max-w-[16rem] grid-cols-2 gap-2">
        <div className="flex flex-col items-center gap-1">
          <LB_Wall f={f} label="পুঁচকে lens এর ফুল, 10 গুণ lens দিয়ে আবার পুরা ফুল" width="max-w-none">
            <path d={poly(f, FLOWER.map((p) => [p[0] * z, p[1] * z] as XY))} fill={PAINT} fillOpacity={0.85} stroke={PAINT_DARK} strokeWidth={1} />
          </LB_Wall>
          {k >= 1 && <span className={`${POP} text-xs font-semibold`}>× 10</span>}
        </div>
        <div className="flex flex-col items-center gap-1">
          <LB_Wall f={f} label="পুরানো lens এর দাগ, 10 গুণ lens দিয়ে লম্বা দাগ, তবু দাগ" width="max-w-none">
            <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(6 * len)} ${f.sy(3 * len)}`} stroke={CHALK} strokeWidth={2.6} strokeLinecap="round" />
            {k >= 3 && (
              <text x={f.sx(-0.7)} y={f.sy(1.6)} fontSize={14} fontWeight={800} fill={BAD} className={POP}>
                ?
              </text>
            )}
          </LB_Wall>
          {k >= 1 && <span className={`${POP} text-xs font-semibold`}>× 10</span>}
        </div>
      </div>
    </Scene>
  );
}

// 5¾ · Side quest: zero in code never comes out zero. A lens whose columns
//      share a line (numpy really prints −1.1657e−16 for it),
//      the computer's det, `== 0` says no, a tolerance says yes.

const X5C_SAY = [
  "দুই column একই লাইনে: (0.7, 2.1) আর (0.4, 1.2). det হওয়ার কথা 0.",
  "Computer বললো −1.17e−16. মানে −0.000000000000000117. প্রায় শূন্য, তবু শূন্য না.",
  "== 0 দিয়ে test করলে: False. ভুল উত্তর.",
  "খুব ছোট কি না দেখলে: True. এভাবেই test করতে হয়.",
];

export function NoisyZero() {
  const s = useScene(3, [600, 1800, 2000, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X5C_SAY, k)}>
      <div className="flex justify-center">
        <Laptop file="lens.py">
          <Out tone="plain">A = np.array([[0.7, 0.4], [2.1, 1.2]])</Out>
          {k >= 1 && (
            <>
              <Out tone="plain">np.linalg.det(A)</Out>
              <Out tone="dim">-1.1657341758564154e-16</Out>
            </>
          )}
          {k >= 2 && (
            <>
              <Out tone="plain">np.linalg.det(A) == 0</Out>
              <Out tone="bad">False</Out>
            </>
          )}
          {k >= 3 && (
            <>
              <Out tone="plain">abs(np.linalg.det(A)) &lt; 1e-9</Out>
              <Out tone="ok">True</Out>
            </>
          )}
        </Laptop>
      </div>
    </Scene>
  );
}

// 6½ · The near-copy, on the wall: columns (2, 1) and (2, 1.1). A patch
//      thin as a thread, det 0.2. Then the wobble (5.2's): the knob turns that
//      land the dot on (4, 2.1) are (1, 1); nudge the target to (4, 2.2) and
//      they jump to (0, 2).

const X6B_F = makeFrame(-0.6, 5, -0.6, 3, 30, 6);
const X6B_A: XY = [2, 1];
const X6B_B: XY = [2, 1.1];
const X6B_SAY = [
  "কপি না, প্রায় কপি: (2, 1) আর (2, 1.1).",
  "ছোপ আছে, কিন্তু সুতার মতো সরু. det 0.2.",
  "Dot কে (4, 2.1) এ নিতে knob লাগে (1, 1).",
  "Dot একটু উপরে, (4, 2.2) তে. Knob লাফ দিয়ে (0, 2). এটাই 5.2 এর কাঁপুনি.",
];

export function NearCopy() {
  const s = useScene(3, [600, 1800, 2200, 2600]);
  const k = s.k;
  const f = X6B_F;
  const target: XY = k >= 3 ? [4, 2.2] : [4, 2.1];
  const knobs: XY = k >= 3 ? [0, 2] : [1, 1];
  const mid: XY = [X6B_A[0] * knobs[0], X6B_A[1] * knobs[0]];
  return (
    <Scene scene={s} caption={say(X6B_SAY, k)}>
      <LB_Wall f={f} label="প্রায় কপি দুই column (2, 1) আর (2, 1.1); সুতার মতো সরু ছোপ; dot এক চুল সরালে knob এর পাক অনেক বদলায়" width="max-w-[14rem]">
        {k >= 1 && <path d={poly(f, patchPts(X6B_A, X6B_B))} fill={GLOW} stroke={LAMP} strokeWidth={1.4} strokeLinejoin="round" className={FADE} />}
        <Arrow f={f} from={[0, 0]} to={X6B_B} tone="teal" w={2.4} />
        <Arrow f={f} from={[0, 0]} to={X6B_A} tone="amber" w={2.4} />
        {k >= 2 && (
          <g key={k} className={FADE}>
            {knobs[0] > 0 && <Arrow f={f} from={[0, 0]} to={mid} tone="amber" w={1.6} dashed list={false} />}
            <Arrow f={f} from={mid} to={target} tone="teal" w={1.6} dashed list={false} />
            <circle cx={f.sx(target[0])} cy={f.sy(target[1])} r={5} fill="white" stroke={LAMP} strokeWidth={1.8} />
            <text x={f.sx(target[0]) + 8} y={f.sy(target[1]) - 6} fontSize={10} fontWeight={800} fill={INK}>
              পাক ({knobs[0]}, {knobs[1]})
            </text>
          </g>
        )}
      </LB_Wall>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  BoxBet: { start: {}, picked: { picks: [true, false, true, false, false, false] }, sealed: { picks: [true, true, false, false, true, false], sealed: true } },
  SquashedSquare: { start: {}, one: { phase: 1 }, done: { phase: 2 } },
  AllSameFact: { start: {}, walk: { cur: 0, seen: [true, false, false, false, false, false, false] }, many: { cur: 3, seen: [true, true, true, true, false, false, false] }, star: { cur: 5, seen: [true, true, true, true, true, true, false] }, done: { cur: 6, seen: [true, true, true, true, true, true, true] } },
  BigButZero: { start: {}, guessed: { guess: 0 }, wrong: { guess: 0, ran: true }, right: { guess: 1, ran: true } },
  TinyButFine: { start: {}, small: { phase: 1 }, loupe: { phase: 2 }, done: { phase: 3 } },
  ExtraColumn: { start: {}, wrong: { pair: [0, 2] }, right: { pair: [2, 3] } },
  YourBox: { start: {}, wrong: { at: 3, placed: [1, 1, 1], tried: 1 }, mid: { at: 5, placed: [1, 1, 1, 0, 1] }, done: { at: 7, placed: [1, 1, 1, 0, 1, 0, 1] } },
  TryZero: { start: {}, wrong: { pick: 0 }, right: { pick: 1 } },
  MorningRun: { start: {}, tiny: { cur: 3, opened: [true, true, true, true, false, false] }, big: { cur: 2, opened: [true, true, true, false, false, false] }, done: { cur: 5, opened: [true, true, true, true, true, true] } },
  BoxNight: { rest: { k: 0 }, say: { k: 1 }, piles: { k: 3 }, done: {} },
  SomLine: { done: {} },
  NasibHundred: { done: {} },
  NasibTiny: { done: {} },
  SaminKhata: { done: {} },
  SeventhLens: { done: {} },
  NewBulb: { fit: { k: 1 }, done: {} },
  PukurDawn: { rest: { k: 0 }, mid: { k: 1 }, done: {} },
  RinaWipes: { done: {} },
  DoorPiece: { done: {} },
  LensStake: { rest: { k: 0 }, sink: { k: 1 }, done: {} },
  CopyColumn: { rest: { k: 0 }, copy: { k: 2 }, done: {} },
  RemoteC: { rest: { k: 0 }, done: {} },
  BigVsSmall: { one: { k: 1 }, done: {} },
  SmallComesBack: { rest: { k: 0 }, done: {} },
  NoisyZero: { done: {} },
  NearCopy: { rest: { k: 0 }, thin: { k: 1 }, one: { k: 2 }, done: {} },
};
