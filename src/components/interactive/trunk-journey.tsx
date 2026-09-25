"use client";

import { useState, type ReactNode } from "react";

import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Speech, predictLook, primaryBtn, quietBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, makeFrame, type Frame, type XY } from "@/components/journey/plane";
import { LightBhai, Projector, STAGE_WALL_F, StageWall, apply, byCols, pathOf, projectorLens, type Cols, type Move } from "./light-kit";
import { turnCols } from "./road-kit";
import { LENS_G, LENS_H, LENS_L, PK, PatchWall, cellPoly, patchFrame } from "./patch-kit";

// Screens for "Math for AI 9.3 — আপার ট্রাংক, শেষেরটা আগে", told as a Journey in
// the author's Bangla-English. The plan is 09_journey_specs.md, block 9.3.
//
// ফিরানির পরের রাত। আপা packs her ট্রাংক; tomorrow she leaves. On the wall,
// beside the door, আপার হাত went through Z, then W, then L (12 ঘর, a right
// hand). Rina wants that one back as a stencil of her own. Karim holds the
// three undo lenses, Z⁻¹, W⁻¹ and H: যে order এ লাগাইছি, সেই order এ খুলি।
// The current goes at ten, so the machine runs once.
//
// Nine screens. 1 seals the bet on an order: Karim's Z⁻¹ W⁻¹ H · Samin's
// H W⁻¹ Z⁻¹ · Som's W⁻¹ H Z⁻¹ · Nasib's "order লাগে না" (OrderBet). 2 the
// ট্রাংক unpacked: তালা, ডালা, ব্যাগ, শাড়ি, outermost first (Unpack)। 3 predict,
// then two lenses: Z then W (= G) undone in Karim's order and in reverse
// (WrongOrder). 4 H first, middle, last: all fine; then W⁻¹ and Z⁻¹ swapped
// (HAnywhere). 5 a turn read sideways is its own undo: 37° and 90°
// (TurnReadSideways). 6 Your turn: the three lenses on the stand, the run
// stops at the first crooked hand (YourUnpack). 7 Try it (Check Q5): the heart
// turned 30° then doubled; which undo stands work? Both halving orders do
// (TryUndoTurn). 8 the bet opened on the door hand (BetOpen). 9 the end (MDX).
//
// After the screens: the story scenes (TrunkNight, ApaPacks, TurnLensOut,
// TrunkClose, TrunkByDoor, DulabhaiPaper) and the watch-only figures
// (TrunkStake, NestFig, SwapFig, DoubleAnywhere, SidewaysFig).
//
// The "ফেরা run" (a painting through a row of undo lenses onto the stencil's
// dashed ghost) is local here, as the plan says for parallel builds; the
// coordinator may fold it into undo-kit.tsx later. The মেহেদি hand is 8.3's
// stencil, redrawn (as 8.5 did): a right palm, fingers along e₂, thumb along e₁.
// Wall pieces from patch-kit.tsx and light-kit.tsx, read-only.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const BLUE = "#2563eb";
const OK = "#0d9488";
const BAD = PK.bad;
const HENNA = "#9a3412";
const HENNA_DARK = "#7c2d12";
const HENNA_LINE = "#fdba74";
const NIGHT_INK = "#e2e8f0";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

const pathD = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}`).join("") + "Z";
const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const lerpCols = (a: Cols, b: Cols, t: number): Cols => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** one lens that does `first`, then `second` */
const onto = (second: Cols, first: Cols): Cols => [apply(second, first[0]), apply(second, first[1])];
const near = (a: Cols, b: Cols) => a.every((c, i) => Math.abs(c[0] - b[i][0]) < 1e-6 && Math.abs(c[1] - b[i][1]) < 1e-6);
const scale = (s: number, c: Cols): Cols => [
  [c[0][0] * s, c[0][1] * s],
  [c[1][0] * s, c[1][1] * s],
];

// ---------------------------------------------------------------------------
// The lenses, by columns (light-kit's Cols).

const I2: Cols = [
  [1, 0],
  [0, 1],
];
/** 7.3's yellow spare Z = [[−1, 1], [2, 1]]: det −3 */
const Z: Cols = [
  [-1, 2],
  [1, 1],
];
/** 7.3's violet spare W = [[0, 1], [1, 1]]: det −1 */
const W: Cols = [
  [0, 1],
  [1, 1],
];
/** Z⁻¹ = [[−1/3, 1/3], [2/3, 1/3]] (9.2's recipe) */
const ZI: Cols = [
  [-1 / 3, 2 / 3],
  [1 / 3, 1 / 3],
];
/** W⁻¹ = [[−1, 1], [1, 0]] */
const WI: Cols = [
  [-1, 1],
  [1, 0],
];
/** The door hand's lens: Z, then W, then L. L·W·Z = 2G = [[4, 2], [2, 4]], det 12. */
const DOOR: Cols = onto(LENS_L, onto(W, Z));

const Z_FILL = "#fde68a"; // 7.3's Z, yellow
const W_FILL = "#ddd6fe"; // 7.3's W, violet
const L_FILL = "#bae6fd"; // the দুইগুণ lens, and H

type GKey = "zi" | "wi" | "h";
const GLASS: Record<GKey, { cols: Cols; fill: string; l: string; inv: boolean }> = {
  zi: { cols: ZI, fill: Z_FILL, l: "Z", inv: true },
  wi: { cols: WI, fill: W_FILL, l: "W", inv: true },
  h: { cols: LENS_H, fill: L_FILL, l: "H", inv: false },
};
const G_ORDER: GKey[] = ["zi", "wi", "h"];

/** the pictures a painting passes through: start, then after each lens */
const statesOf = (start: Cols, lenses: readonly Cols[]) => {
  const s: Cols[] = [start];
  lenses.forEach((l, i) => s.push(onto(l, s[i])));
  return s;
};
/** the picture's columns `kk` frames into a run over `states`, `fr` frames a lens */
const colsAt = (states: readonly Cols[], kk: number, fr: number): Cols => {
  const n = states.length - 1;
  if (kk >= n * fr) return states[n];
  const i = Math.floor(kk / fr);
  return lerpCols(states[i], states[i + 1], (kk % fr) / fr);
};
/**
 * The pictures an honest unpacking of the door hand passes through: the
 * outer wrappings come off one by one, a ×2 may come off any time. Anything
 * else is a crooked hand.
 */
const HONEST: Cols[] = [DOOR, LENS_G, scale(2, Z), Z, scale(2, I2), I2];
const honest = (c: Cols) => HONEST.some((h) => near(h, c));

// ---------------------------------------------------------------------------
// The মেহেদি stencil (8.3): one ঘর [0, 1]², আপার ডান হাত inside it।

const SQ: XY[] = cellPoly([0, 0]);
const HAND: XY[] = [
  [0.25, 0.05],
  [0.2, 0.3],
  [0.17, 0.5],
  [0.14, 0.64],
  [0.16, 0.69],
  [0.21, 0.7],
  [0.25, 0.66],
  [0.28, 0.54],
  [0.3, 0.56],
  [0.3, 0.79],
  [0.33, 0.83],
  [0.38, 0.83],
  [0.41, 0.79],
  [0.42, 0.56],
  [0.44, 0.57],
  [0.44, 0.87],
  [0.47, 0.91],
  [0.52, 0.91],
  [0.55, 0.87],
  [0.56, 0.56],
  [0.58, 0.55],
  [0.58, 0.8],
  [0.61, 0.84],
  [0.66, 0.84],
  [0.69, 0.8],
  [0.69, 0.5],
  [0.73, 0.43],
  [0.83, 0.58],
  [0.88, 0.61],
  [0.93, 0.57],
  [0.92, 0.5],
  [0.81, 0.3],
  [0.73, 0.17],
  [0.68, 0.05],
];
const RING: XY[] = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * 2 * Math.PI;
  return [0.45 + 0.1 * Math.cos(a), 0.3 + 0.1 * Math.sin(a)];
});
const ID_MOVE: Move = (p) => p;

/** The stencil's light carried by `move`: the lit ঘর with the hand dark in it. `ghost`: a dashed outline in `tone`. */
function S_Print({ f, move = ID_MOVE, ghost = false, tone = BLUE, soft = false }: { f: Frame; move?: Move; ghost?: boolean; tone?: string; soft?: boolean }) {
  const tile = pathOf(f, move, SQ, true);
  const palm = pathOf(f, move, HAND, true);
  if (ghost)
    return (
      <g className="pointer-events-none" opacity={soft ? 0.5 : 1}>
        <path d={tile} fill="none" stroke={tone} strokeWidth={1.4} strokeDasharray="4 3" />
        <path d={palm} fill={tone} fillOpacity={0.12} stroke={tone} strokeWidth={1.3} strokeDasharray="3 2" strokeLinejoin="round" />
      </g>
    );
  return (
    <g className="pointer-events-none" opacity={soft ? 0.45 : 1}>
      <path d={tile} fill={PK.glow} fillOpacity={0.3} stroke={PK.glow} strokeOpacity={0.5} strokeWidth={4} strokeLinejoin="round" />
      <path d={tile} fill={PK.glow} fillOpacity={0.6} stroke={PK.lamp} strokeWidth={1.2} strokeLinejoin="round" />
      <path d={palm} fill={HENNA} stroke={HENNA_DARK} strokeWidth={0.8} strokeLinejoin="round" />
      <path d={pathOf(f, move, RING, true)} fill="none" stroke={HENNA_LINE} strokeWidth={Math.max(0.6, f.u * 0.02)} />
    </g>
  );
}

/** a small picture of what a lens does to the মেহেদি stencil; `span` fixes the scale so sizes compare */
function S_Icon({ cols, size = 44, span }: { cols: Cols; size?: number; span?: number }) {
  const m = byCols(cols);
  const c = SQ.map(m);
  const xs = c.map((p) => p[0]);
  const ys = c.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const S = span ?? Math.max(x1 - x0, y1 - y0, 1);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const f = makeFrame(cx - S / 2, cx + S / 2, cy - S / 2, cy + S / 2, (size - 6) / S, 3);
  return (
    <svg viewBox={`0 0 ${f.W} ${f.H}`} width={size} height={size} aria-hidden="true" className="shrink-0">
      <rect x={0} y={0} width={f.W} height={f.H} rx={4} fill={PK.lime} />
      <S_Print f={f} move={m} />
    </svg>
  );
}

/** a small white chip with words on the wall, at a spot in wall units */
function S_Chip({ f, at, text, tone = INK }: { f: Frame; at: XY; text: string; tone?: string }) {
  const bn = /[ঀ-৿]/.test(text);
  const w = text.length * (bn ? 5.4 : 6) + 10;
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className={`${POP} pointer-events-none`}>
      <rect x={x - w / 2} y={y - 8} width={w} height={14} rx={4} fill="white" fillOpacity={0.92} stroke={tone} strokeWidth={1} />
      <text x={x} y={y + 2.8} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={bn ? undefined : MONO} fill={tone}>
        {text}
      </text>
    </g>
  );
}

/** "Z⁻¹" in HTML, the −1 raised */
function Inv({ l }: { l: string }) {
  return (
    <span className="font-mono whitespace-nowrap">
      {l}
      <sup className="text-[0.7em]">−1</sup>
    </span>
  );
}

/** a lens's name in HTML: Z⁻¹, W⁻¹ or H */
const gName = (g: GKey) => (GLASS[g].inv ? <Inv l={GLASS[g].l} /> : <span className="font-mono">H</span>);

/**
 * One undo lens as a round glass: its colour, its letter, the −1 raised, and
 * a curled ফেরা arrow on the rim (H, L's undo, has been H since 9.1 and gets
 * no curl). `on` rings it (light passing), `bad` rings it red.
 */
function Disc({ g, size = 34, on = false, bad = false }: { g: GKey; size?: number; on?: boolean; bad?: boolean }) {
  const d = GLASS[g];
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-label={d.inv ? `${d.l} এর ফেরা` : "H"} className="shrink-0">
      {on && <circle cx={20} cy={20} r={19} fill="#fde047" opacity={0.55} />}
      <circle cx={20} cy={20} r={15} fill={d.fill} stroke={bad ? BAD : on ? "#f59e0b" : INK} strokeOpacity={on || bad ? 1 : 0.6} strokeWidth={on || bad ? 2.4 : 1.6} />
      <text x={d.inv ? 17 : 20} y={25} textAnchor="middle" fontSize={14} fontWeight={800} fontFamily={MONO} fill={INK}>
        {d.l}
        {d.inv && (
          <tspan dy={-6} fontSize={8}>
            −1
          </tspan>
        )}
      </text>
      {d.inv && <path d="M31 11A15 15 0 0 0 20 5M20 5l3.4 -2.6M20 5l3 3" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

/** an empty place on the stand */
function EmptySlot({ size = 34, n }: { size?: number; n?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      <circle cx={20} cy={20} r={15} fill="none" stroke={INK} strokeOpacity={0.35} strokeWidth={1.4} strokeDasharray="3 3" className="dark:stroke-[#e2e8f0]" />
      {n !== undefined && (
        <text x={20} y={24.5} textAnchor="middle" fontSize={12} fontWeight={700} fontFamily={MONO} fill="currentColor" className="fill-muted">
          {n}
        </text>
      )}
    </svg>
  );
}

/** a small drawn arrow for rows of lenses (no glyph) */
function RowArrow({ back = false }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 16 10" className={`h-2.5 w-4 shrink-0 text-muted ${back ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="M1 5H13M9 1.5L13 5L9 8.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The stand: the হাত's পলিথিন, then the slots in the order the light passes
 * them, then the card. `lit` rings the lens the light is in; `bad` the one
 * after which the hand went crooked.
 */
function StandRow({ keys, lit, bad, size = 34, onSlot }: { keys: readonly (GKey | null)[]; lit?: number; bad?: number; size?: number; onSlot?: (i: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="text-xs text-muted">পলিথিন</span>
      {keys.map((g, i) => (
        <span key={i} className="flex items-center gap-1">
          <RowArrow />
          {onSlot && g ? (
            <button type="button" onClick={() => onSlot(i)} className="cursor-pointer rounded-full" aria-label="lens টা তুলে নিন">
              <Disc g={g} size={size} on={lit === i} bad={bad === i} />
            </button>
          ) : g ? (
            <span key={`${g}${i}`} className={POP}>
              <Disc g={g} size={size} on={lit === i} bad={bad === i} />
            </span>
          ) : (
            <EmptySlot size={size} n={i + 1} />
          )}
        </span>
      ))}
      <RowArrow />
      <span className="text-xs text-muted">card</span>
    </div>
  );
}

/**
 * The ফেরা run on the wall: the picture now (`cols`), over the stencil's
 * dashed ghost at home. `verdict` hangs "ঘরে ফিরলো" or "বাঁকা" once landed.
 */
function RunWall({ f, cols, verdict, label, chipAt, className = "max-w-[13rem]" }: { f: Frame; cols: Cols; verdict?: "home" | "bent" | null; label: string; chipAt: XY; className?: string }) {
  return (
    <PatchWall f={f} label={label} className={className}>
      <S_Print f={f} move={byCols(cols)} />
      <S_Print f={f} ghost tone={verdict === "home" ? OK : verdict === "bent" ? BAD : BLUE} soft={!verdict} />
      {verdict === "home" && <S_Chip f={f} at={chipAt} text="ঘরে ফিরলো" tone={OK} />}
      {verdict === "bent" && <S_Chip f={f} at={chipAt} text="বাঁকা, stencil এ বসে না" tone={BAD} />}
    </PatchWall>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The door hand on the wall; the stand with three empty
//     places. Four cards, each an order (Nasib's: any). A pick drops its
//     lenses into the places; sealing sends the light through them one by
//     one and hangs a "?" on the stencil's ghost. Never judged here.

const X1_CARDS: { who: string; order: GKey[] | null; line: string }[] = [
  { who: "করিম", order: ["zi", "wi", "h"], line: "যে order এ লাগানো, সেই order এ" },
  { who: "সামিন", order: ["h", "wi", "zi"], line: "পুরাটা উল্টা order এ" },
  { who: "সোম", order: ["wi", "h", "zi"], line: "Z সবার আগে লেগেছে, খুলবে সবার শেষে" },
  { who: "নাসিব", order: null, line: "order লাগে না, সব তো গুণ" },
];
const X1F = patchFrame(-0.5, 6.5, -0.5, 6.5, 21); // 163 × 163

export function OrderBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(450);
  const k = !sealed ? 0 : act.running ? act.k : 4;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(4, () => pass("বাজি সিল হলো। আগে আপার ট্রাংক।"));
  };
  const card = bet === null ? null : X1_CARDS[bet];
  return (
    <>
      <div className="mb-1.5 min-h-9">
        {card && card.order ? (
          <StandRow keys={card.order} lit={k >= 1 && k <= 3 ? k - 1 : undefined} />
        ) : card ? (
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xs text-muted">যেকোনো order</span>
            {G_ORDER.map((g, i) => (
              <span key={g} className={`${POP} inline-block`} style={{ transform: `rotate(${(i - 1) * 14}deg)` }}>
                <Disc g={g} size={30} on={k === i + 1} />
              </span>
            ))}
          </div>
        ) : (
          <StandRow keys={[null, null, null]} />
        )}
      </div>
      <div className="flex justify-center">
        <PatchWall f={X1F} label="দরজার পাশের হাত, Z, W আর L পার হয়ে 12 ঘর; নিচে কোণায় stencil এর দাগ, সেখানে ফিরবে কি না, প্রশ্নবোধক" className="max-w-[10.5rem]">
          <S_Print f={X1F} move={byCols(DOOR)} />
          <S_Print f={X1F} ghost soft />
          {k >= 4 && (
            <text x={X1F.sx(0.5)} y={X1F.sy(0.5) + 7} textAnchor="middle" fontSize={20} fontWeight={800} fill={BLUE} className={POP}>
              ?
            </text>
          )}
        </PatchWall>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex flex-col text-sm leading-tight">
              <span className="flex items-center gap-1">
                {c.order ? (
                  c.order.map((g, j) => (
                    <span key={g} className="flex items-center">
                      {j > 0 && <span className="pr-1 text-muted">,</span>}
                      {gName(g)}
                    </span>
                  ))
                ) : (
                  <span>যেকোনো</span>
                )}
              </span>
              <span className="text-xs text-muted">
                {c.who}: {c.line}
              </span>
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={bet === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 4}>কোন order এ lens বসালে হাত ঘরে ফিরবে? একটা card বেছে নিয়ে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The ট্রাংক, seen through (a cutaway): শাড়ি inside the ব্যাগ inside the
//     ট্রাংক, the ডালা shut, the তালা on। Four buttons in a jumble. Only the
//     outermost thing comes off: it glides away. Anything else is pulled,
//     jiggles and stays, and the thing in its way lights red.

const X2_ITEMS = ["তালা", "ডালা", "ব্যাগ", "শাড়ি"] as const;
const X2_BTN = [3, 0, 2, 1]; // the buttons, in a jumble
const X2_NOPE = [
  "",
  "ডালা টানলেন, কিন্তু তালা লাগানো। তালা খোলে নাই।",
  "ব্যাগ টানলেন, কিন্তু সে ট্রাংকের ভেতরে। তার আগে যা বাইরে, তা খুলুন।",
  "শাড়ি টানলেন, কিন্তু সে ব্যাগের ভেতরে। ব্যাগ আবার ট্রাংকের ভেতরে।",
];

export function Unpack() {
  const pass = useGate();
  const [out, setOut] = useSeed("out", 0);
  const [pull, setPull] = useSeed<number | null>("pull", null);
  const [miss, setMiss] = useState(0);
  const shake = usePlay(55);
  const glide = usePlay(700);
  const tap = (i: number) => {
    if (shake.running || glide.running || i < out) return;
    if (i === out) {
      setPull(null);
      setOut(out + 1);
      glide.play(1, () => {
        if (i === 3) pass("যেটা শেষে লাগানো, সেটা আগে খোলে।");
      });
    } else {
      setPull(i);
      shake.play(8, () => setMiss((m) => m + 1));
    }
  };
  const jig = pull !== null && shake.running ? Math.sin(shake.k * 1.9) * 3 : 0;
  const blocker = pull !== null ? out : null;
  const t = (i: number, x: number, y: number, r = 0) => ({
    transform: `translate(${x + (pull === i ? jig : 0)}px, ${y - (pull === i && shake.running ? 3 : 0)}px) rotate(${r}deg)`,
  });
  const glideCls = "transition-transform duration-700 ease-out motion-reduce:transition-none";
  const lidOpen = out >= 2;
  return (
    <>
      <svg viewBox="0 20 300 130" role="img" aria-label="ট্রাংকের ভেতর দেখা যাচ্ছে: শাড়ি ব্যাগের ভেতরে, ব্যাগ ট্রাংকের ভেতরে, উপরে ডালা, সামনে তালা; বাইরেরটা আগে খোলে" className="mx-auto block h-auto w-full max-w-[19rem]">
        <rect x={0} y={20} width={300} height={130} rx={10} fill="#f5efe6" />
        <rect x={0} y={134} width={300} height={16} fill="#c8a27a" />
        {/* the ট্রাংক, seen through */}
        <rect x={95} y={80} width={110} height={54} rx={3} fill="#0f766e" fillOpacity={0.28} stroke="#115e59" strokeWidth={1.6} />
        <path d="M95 96H205M95 120H205" stroke="#115e59" strokeOpacity={0.35} strokeWidth={1} />
        <text x={100} y={130} fontSize={8} fontWeight={700} fill="#115e59">
          ট্রাংক
        </text>
        {/* the ব্যাগ, with the শাড়ি in it until it comes out */}
        <g className={glideCls} style={t(2, out >= 3 ? 212 : 112, out >= 3 ? 92 : 86)}>
          <rect x={0} y={0} width={80} height={42} rx={7} fill="#16a34a" fillOpacity={out >= 3 ? 1 : 0.55} stroke={blocker === 2 ? BAD : "#14532d"} strokeWidth={blocker === 2 ? 2.4 : 1.2} />
          <path d="M6 5H74" stroke="#fef08a" strokeWidth={1.4} strokeDasharray={out >= 4 ? "3 3" : undefined} />
          <text x={40} y={38} textAnchor="middle" fontSize={8} fontWeight={700} fill="#14532d">
            ব্যাগ
          </text>
        </g>
        {/* the শাড়ি */}
        {out < 4 ? (
          <g className={glideCls} style={t(3, out >= 3 ? 225 : 125, out >= 3 ? 104 : 98)}>
            <rect x={0} y={0} width={54} height={20} rx={2} fill="#dc2626" />
            <path d="M0 16H54" stroke="#facc15" strokeWidth={2.4} />
            <text x={27} y={12} textAnchor="middle" fontSize={8} fontWeight={700} fill="white">
              শাড়ি
            </text>
          </g>
        ) : (
          <g className={POP}>
            <path d="M14 52Q50 42 88 54L90 80Q52 68 16 78Z" fill="#dc2626" />
            <path d="M16 74Q52 64 90 76" stroke="#facc15" strokeWidth={3} fill="none" />
            <text x={52} y={63} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">
              শাড়ি
            </text>
          </g>
        )}
        {/* the ডালা: shut, then lifted and set aside */}
        <g className={glideCls} style={t(1, lidOpen ? 96 : 93, lidOpen ? 34 : 66, lidOpen ? -6 : 0)}>
          <rect x={0} y={0} width={114} height={15} rx={4} fill="#0f766e" stroke={blocker === 1 ? BAD : "#115e59"} strokeWidth={blocker === 1 ? 2.4 : 1.2} />
          <path d="M20 7.5H94" stroke="#99f6e4" strokeWidth={1} strokeDasharray="4 3" />
          <text x={57} y={11} textAnchor="middle" fontSize={8} fontWeight={700} fill="white">
            ডালা
          </text>
        </g>
        {/* the hasp and the তালা */}
        <rect x={146} y={79} width={8} height={10} rx={1.5} fill="#a8a29e" />
        <g className={glideCls} style={t(0, out >= 1 ? 36 : 150, out >= 1 ? 126 : 93)}>
          <path d="M-5 0V-5A5 5 0 0 1 5 -5V0" fill="none" stroke="#78716c" strokeWidth={2.2} />
          <rect x={-7} y={0} width={14} height={11} rx={2} fill="#eab308" stroke={blocker === 0 ? BAD : "#a16207"} strokeWidth={blocker === 0 ? 2.4 : 1} />
          <circle cx={0} cy={5} r={1.5} fill="#713f12" />
        </g>
        {out >= 1 && (
          <text x={36} y={148} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK} className={FADE}>
            তালা
          </text>
        )}
      </svg>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {X2_BTN.map((i) => (
          <button key={i} type="button" disabled={i < out || glide.running} onClick={() => tap(i)} className={`${quietBtn} h-10 justify-center px-1 text-sm ${i < out ? "border-accent text-accent-text" : ""}`}>
            {X2_ITEMS[i]}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-center gap-1 font-mono text-xs text-muted">
        {X2_ITEMS.slice(0, out).map((l, i) => (
          <span key={l} className={`${POP} rounded-full bg-accent/10 px-2 py-0.5 text-accent-text`}>
            {i + 1}. <span className="font-sans">{l}</span>
          </span>
        ))}
      </div>
      {pull !== null && !shake.running && <Nope key={miss}>{X2_NOPE[pull]}</Nope>}
      <Task done={out >= 4 && !glide.running}>শাড়িটা বের করুন। যেটা টানবেন, সেটা আগে খোলা যায় কি না দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict, then two lenses. The hand through Z then W (= G, the ফুল's
//     lens). Guess: Karim's order (Z⁻¹ first) · the reverse (W⁻¹ first) ·
//     both. Then run each: Karim's squeezes the hand into a crooked sliver
//     (Z⁻¹G, then W⁻¹Z⁻¹G = [[2, 1], [−1/3, 1/3]]); the reverse lands on the
//     ghost (W⁻¹G = Z, then I).

const X3F = patchFrame(-1.4, 3.4, -0.8, 3.4, 32); // 170 × 150
const X3_RUNS: { order: GKey[]; label: ReactNode }[] = [
  {
    order: ["zi", "wi"],
    label: (
      <>
        করিমের: আগে <Inv l="Z" />
      </>
    ),
  },
  {
    order: ["wi", "zi"],
    label: (
      <>
        উল্টা: আগে <Inv l="W" />
      </>
    ),
  },
];
const X3_STATES = X3_RUNS.map((r) => statesOf(LENS_G, r.order.map((g) => GLASS[g].cols)));
const X3_GUESS: ReactNode[] = [
  <>
    করিমের order: <Inv l="Z" />, তারপর <Inv l="W" />
  </>,
  <>
    উল্টা order: <Inv l="W" />, তারপর <Inv l="Z" />
  </>,
  <>দুইটাই ফেরাবে</>,
];
const X3_RIGHT = 1;
const X3_FR = 16;

export function WrongOrder() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed<boolean[]>("ran", [false, false]);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const run = usePlay(45);
  const go = (r: number) => {
    if (run.running || guess === null) return;
    setCur(r);
    run.play(2 * X3_FR, () => {
      const nr = ran.map((v, j) => v || j === r);
      setRan(nr);
      if (nr.every(Boolean)) pass("(WZ)⁻¹ = Z⁻¹W⁻¹: order উল্টে যায়।");
    });
  };
  const kk = cur === null ? 0 : run.running ? run.k : ran[cur] ? 2 * X3_FR : 0;
  const cols = cur === null ? LENS_G : colsAt(X3_STATES[cur], kk, X3_FR);
  const landed = cur !== null && !run.running && ran[cur];
  const over = ran.every(Boolean) && !run.running;
  const lit = cur !== null && run.running ? Math.min(1, Math.floor(kk / X3_FR)) : undefined;
  return (
    <>
      <div className="mb-1.5 min-h-9">
        <StandRow keys={cur === null ? [null, null] : X3_RUNS[cur].order} lit={lit} />
      </div>
      <div className="flex justify-center">
        <RunWall
          f={X3F}
          cols={cols}
          verdict={landed ? (cur === 1 ? "home" : "bent") : null}
          chipAt={[1.1, 3.05]}
          label="হাত Z আর W দিয়ে গিয়ে G এর ছবি; দুইটা ফেরার lens দুই order এ চালালে একবার বাঁকা ফালি, একবার stencil এর দাগে ফেরে"
          className="max-w-[10.5rem]"
        />
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {X3_GUESS.map((g, i) => (guess !== null && i !== guess && !(over && i === X3_RIGHT) ? null : (
          <Choice key={i} n={i} look={predictLook(i, guess, over, X3_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="text-sm">{g}</span>
          </Choice>
        )))}
      </div>
      {guess !== null && (
        <div className={`mt-2 grid grid-cols-2 gap-1.5 ${FADE}`}>
          {X3_RUNS.map((r, j) => (
            <button key={j} type="button" disabled={run.running} onClick={() => go(j)} className={`${quietBtn} h-auto justify-center px-2 py-1.5 text-sm ${ran[j] ? (j === 1 ? "border-accent text-accent-text" : "border-danger text-danger") : ""}`}>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      )}
      {over && guess === 0 && <Nope>করিমের order এ হাত চ্যাপ্টা ফালি হয়ে গেলো। W লেগেছিলো পরে, তাই তার ফেরা আগে।</Nope>}
      {over && guess === 2 && <Nope>দুই order দুইটা আলাদা ছবি দিলো। একটাই stencil এ বসলো।</Nope>}
      <Task done={over}>{guess === null ? "আগে guess দিন: কোন order এ হাত ঘরে ফিরবে?" : "এবার দুইটা order ই চালিয়ে দেখুন।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · H anywhere. The door hand (Z, W, L), W⁻¹ before Z⁻¹, and H put first,
//     in the middle, or last: every run lands home. Then Nasib: তাইলে order
//     লাগে না! and a fourth run swaps W⁻¹ and Z⁻¹ (H first): crooked.

const X4F = patchFrame(-2.4, 6.4, -1, 6.4, 23); // 218 × 186
const X4_ORDERS: GKey[][] = [
  ["h", "wi", "zi"],
  ["wi", "h", "zi"],
  ["wi", "zi", "h"],
  ["h", "zi", "wi"],
];
const X4_STATES = X4_ORDERS.map((o) => statesOf(DOOR, o.map((g) => GLASS[g].cols)));
const X4_BTN = ["H আগে", "H মাঝে", "H শেষে"];
const X4_FR = 14;

export function HAnywhere() {
  const pass = useGate();
  const [tried, setTried] = useSeed<boolean[]>("tried", [false, false, false]);
  const [swapped, setSwapped] = useSeed("swapped", false);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const run = usePlay(40);
  const go = (r: number) => {
    if (run.running) return;
    setCur(r);
    run.play(3 * X4_FR, () => {
      if (r === 3) {
        setSwapped(true);
        pass("শুধু H যেকোনো জায়গায় বসে। বাকিরা লাইনে।");
      } else setTried(tried.map((v, j) => v || j === r));
    });
  };
  const doneRun = cur !== null && !run.running && (cur === 3 ? swapped : tried[cur]);
  const kk = cur === null ? 0 : run.running ? run.k : doneRun ? 3 * X4_FR : 0;
  const cols = cur === null ? DOOR : colsAt(X4_STATES[cur], kk, X4_FR);
  const lit = cur !== null && run.running ? Math.min(2, Math.floor(kk / X4_FR)) : undefined;
  const all3 = tried.every(Boolean);
  return (
    <>
      <div className="mb-1.5 min-h-9">
        <StandRow keys={cur === null ? [null, null, null] : X4_ORDERS[cur]} lit={lit} />
      </div>
      <div className="flex justify-center">
        <RunWall
          f={X4F}
          cols={cols}
          verdict={doneRun ? (cur === 3 ? "bent" : "home") : null}
          chipAt={[2.6, 5.8]}
          label="দরজার পাশের হাত, 12 ঘর; তিনটা ফেরার lens দিয়ে একটার পর একটা; H যেখানেই বসুক হাত stencil এ ফেরে, W আর Z এর ফেরা অদলবদল করলে বাঁকা"
        />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X4_BTN.map((l, j) => (
          <button key={l} type="button" disabled={run.running} onClick={() => go(j)} className={`${quietBtn} h-9 justify-center px-1 font-mono text-sm ${tried[j] ? "border-accent text-accent-text" : ""}`}>
            {l}
          </button>
        ))}
      </div>
      {all3 && (
        <>
          <Speech who="নাসিব" initial="না" tint="teal">
            তাইলে order লাগেই না!
          </Speech>
          <div className="mt-2 flex justify-center">
            <button type="button" className={primaryBtn} disabled={run.running || swapped} onClick={() => go(3)}>
              <span>
                <Inv l="W" /> আর <Inv l="Z" /> অদলবদল
              </span>
            </button>
          </div>
        </>
      )}
      {swapped && doneRun && <Nope>H আগে বসেছে ঠিকই। কিন্তু Z এর ফেরা W এর ফেরার আগে চলে এলো, হাত বাঁকা।</Nope>}
      <Task done={swapped && !run.running}>{all3 ? "নাসিবের কথা মতো বাকি দুইটার জায়গা বদলে চালান।" : "H কে তিন জায়গাতেই বসিয়ে চালান। হাত কি ফেরে?"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · A turn read sideways. Two tabs: the 37° lens (8.5's, 3-4-5 numbers) and
//     9.1's 90° lens. Each: turn the hand; read the four numbers sideways
//     (b and c trade places across the diagonal); run the new lens: the
//     hand turns back onto the ghost.

type X5Lens = { key: string; deg: number; rows: [string, string, string, string] };
const X5_LENSES: X5Lens[] = [
  { key: "37°", deg: 37, rows: ["0.8", "−0.6", "0.6", "0.8"] },
  { key: "90°", deg: 90, rows: ["0", "−1", "1", "0"] },
];
const X5F = patchFrame(-1.3, 1.3, -0.3, 1.5, 68); // 193 × 138

/** a 2 × 2 lens in numbers; `t` 0 → 1 moves b and c across the diagonal (read sideways) */
function Mat2({ rows, t = 0, w = 112 }: { rows: readonly [string, string, string, string]; t?: number; w?: number }) {
  const [a, b, c, d] = rows;
  const P = { a: [34, 22], b: [78, 22], c: [34, 48], d: [78, 48] } as const;
  const bump = Math.sin(Math.PI * t) * 12;
  const bx = P.b[0] + (P.c[0] - P.b[0]) * t - bump;
  const by = P.b[1] + (P.c[1] - P.b[1]) * t - bump;
  const cx = P.c[0] + (P.b[0] - P.c[0]) * t + bump;
  const cy = P.c[1] + (P.b[1] - P.c[1]) * t + bump;
  const cell = (x: number, y: number, s: string, tone: string) => (
    <text x={x} y={y} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily={MONO} fill={tone}>
      {s}
    </text>
  );
  return (
    <svg viewBox="0 0 112 60" width={w} aria-label={`lens: উপরের সারি ${a}, ${t > 0.5 ? c : b}; নিচের সারি ${t > 0.5 ? b : c}, ${d}`} className="h-auto shrink-0">
      <rect x={0} y={0} width={112} height={60} rx={8} fill="white" />
      <path d="M14 6H9V56H14M98 6H103V56H98" fill="none" stroke={INK} strokeWidth={1.6} />
      {t > 0 && t < 1 && <path d="M22 8L90 56" stroke={INK} strokeOpacity={0.2} strokeDasharray="3 3" />}
      {cell(P.a[0], P.a[1], a, INK)}
      {cell(P.d[0], P.d[1], d, INK)}
      {cell(bx, by, b, "#b45309")}
      {cell(cx, cy, c, "#0f766e")}
    </svg>
  );
}

export function TurnReadSideways() {
  const pass = useGate();
  const [tab, setTab] = useSeed("tab", 0);
  const [st, setSt] = useSeed<number[]>("st", [0, 0]);
  const act = usePlay(950);
  const lens = X5_LENSES[tab];
  const s = st[tab];
  const [ang] = useTween([s === 1 || s === 2 ? lens.deg : 0], 900);
  const [flip] = useTween([s >= 2 ? 1 : 0], 800);
  const next = () => {
    if (act.running || s >= 3) return;
    const i = tab;
    const ns = st.map((v, j) => (j === i ? v + 1 : v));
    setSt(ns);
    act.play(1, () => {
      if (ns.every((v) => v >= 3)) pass("ঘোরানো lens এর উল্টা: পাশ থেকে পড়ো।");
    });
  };
  const home = s >= 3 && !act.running;
  const btn = ["এই lens দিয়ে চালান", "পাশ থেকে পড়ুন", "নতুন lens দিয়ে চালান"][Math.min(s, 2)];
  return (
    <>
      <div className="mb-1.5 flex justify-center gap-1.5">
        {X5_LENSES.map((l, j) => (
          <button key={l.key} type="button" disabled={act.running} onClick={() => setTab(j)} className={`cursor-pointer rounded-full border-2 px-3 py-1 font-mono text-sm font-semibold transition-colors motion-reduce:transition-none ${tab === j ? "border-cat-blue bg-cat-blue text-white" : st[j] >= 3 ? "border-accent text-accent-text" : "border-border hover:border-cat-blue/60"}`}>
            {l.key} lens
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2">
        <PatchWall key={lens.key} f={X5F} label={`মেহেদি হাত ${lens.key} ঘোরে; lens টা পাশ থেকে পড়লে উল্টা দিকে ঘোরানোর lens, হাত ঘরে ফেরে`} className="max-w-[11rem]">
          <S_Print f={X5F} move={byCols(turnCols(ang))} />
          <S_Print f={X5F} ghost tone={home ? OK : BLUE} soft={!home} />
          {s >= 1 && s < 3 && !act.running && <S_Chip f={X5F} at={[0.72, -0.14]} text={`${lens.key} বামে ঘুরলো`} tone={INK} />}
          {home && <S_Chip f={X5F} at={[0.5, 1.32]} text="ঘরে ফিরলো" tone={OK} />}
        </PatchWall>
        <div className="flex w-[7.5rem] flex-col items-center gap-1 text-center">
          <div className="text-xs text-muted">{s >= 2 ? "পাশ থেকে পড়া" : `${lens.key} ঘোরানো lens`}</div>
          <Mat2 rows={lens.rows} t={flip} w={108} />
          {s >= 2 && <div className={`text-xs text-muted ${FADE}`}>row হলো column</div>}
        </div>
      </div>
      <div className="mt-2 flex justify-center">
        {s < 3 ? (
          <button type="button" className={s === 1 ? quietBtn : primaryBtn} disabled={act.running} onClick={next}>
            {btn}
          </button>
        ) : (
          <span className="text-sm text-accent-text">{st.every((v) => v >= 3) ? "দুইটা lens ই ফিরলো।" : "এবার অন্য lens টা।"}</span>
        )}
      </div>
      <Task done={st.every((v) => v >= 3) && !act.running}>দুইটা ঘোরানো lens এর বেলায়: ঘোরান, পাশ থেকে পড়ুন, নতুন lens দিয়ে ফেরান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn. The three lenses in a tray; a tap puts one in the next free
//     place on the stand, a tap on a placed one takes it back. চালান runs the
//     door hand through the places and stops at the first crooked hand.

const X6_FR = 14;
const X6_NOPE: Record<number, string> = {
  1: "প্রথম lens এর পরেই হাত বাঁকা। দরজার হাতে সবার শেষে কোন lens লেগেছিলো? তার ফেরা আগে।",
  2: "প্রথমটা ঠিক ছিলো, দ্বিতীয়টার পরে বাঁকা। এবার বাকিদের মধ্যে কে বাইরে?",
  3: "শেষ lens এর পরে বাঁকা। Order টা আরেকবার দেখুন।",
};

export function YourUnpack() {
  const pass = useGate();
  const [slots, setSlots] = useSeed<(GKey | null)[]>("slots", [null, null, null]);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = usePlay(40);
  const full = slots.every((g) => g !== null);
  const keys = slots.filter((g): g is GKey => g !== null);
  const states = full ? statesOf(DOOR, keys.map((g) => GLASS[g].cols)) : [DOOR];
  const bad = full ? states.findIndex((c, i) => i > 0 && !honest(c)) : -1;
  const stopAt = bad === -1 ? 3 : bad;
  const place = (g: GKey) => {
    if (run.running) return;
    const i = slots.indexOf(null);
    if (i === -1) return;
    setRan(false);
    setSlots(slots.map((v, j) => (j === i ? g : v)));
  };
  const takeBack = (i: number) => {
    if (run.running) return;
    setRan(false);
    setSlots(slots.map((v, j) => (j === i ? null : v)));
  };
  const go = () => {
    if (run.running || !full) return;
    setRan(false);
    run.play(stopAt * X6_FR, () => {
      setRan(true);
      if (bad === -1) pass("শেষেরটা আগে: হাত ঘরে ফিরলো।");
      else setMiss((m) => m + 1);
    });
  };
  const kk = run.running ? run.k : ran ? stopAt * X6_FR : 0;
  const cols = colsAt(states, kk, X6_FR);
  const landed = ran && !run.running;
  const lit = run.running ? Math.min(2, Math.floor(kk / X6_FR)) : undefined;
  return (
    <>
      <div className="mb-1 min-h-9">
        <StandRow keys={slots} lit={lit} bad={landed && bad !== -1 ? bad - 1 : undefined} onSlot={run.running ? undefined : takeBack} />
      </div>
      <div className="flex justify-center">
        <RunWall
          f={X4F}
          cols={cols}
          verdict={landed ? (bad === -1 ? "home" : "bent") : null}
          chipAt={[2.6, 5.8]}
          label="দরজার পাশের হাত; আপনার বসানো তিনটা lens দিয়ে একটার পর একটা; প্রথম বাঁকা হাতে থামে"
        />
      </div>
      <div className="mt-2 flex min-h-11 items-center justify-center gap-2">
        {G_ORDER.filter((g) => !slots.includes(g)).map((g) => (
          <button key={g} type="button" onClick={() => place(g)} disabled={run.running} className="cursor-pointer rounded-full transition-transform hover:-translate-y-0.5 motion-reduce:transition-none" aria-label="stand এ বসান">
            <Disc g={g} size={40} />
          </button>
        ))}
        {full && (
          <button type="button" className={primaryBtn} disabled={run.running || (landed && bad === -1)} onClick={go}>
            চালান
          </button>
        )}
      </div>
      {landed && bad !== -1 && <Nope key={miss}>{X6_NOPE[bad]}</Nope>}
      <Task done={landed && bad === -1}>তিনটা lens stand এ বসান, তারপর চালান। বসানো lens এ আবার চাপলে উঠে আসে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it (Check Q5). Rina's heart, turned 30° then doubled. Three undo
//     stands: অর্ধেক, তারপর উল্টা ঘোরাও · উল্টা ঘোরাও, তারপর অর্ধেক · আবার
//     ঘোরাও, তারপর অর্ধেক। Find every stand that works: the first two both
//     do (a ×½ sits anywhere); the third leaves it turned 60°.

/** Rina's heart stencil, centred on the pin, about 0.8 ঘর across */
const HEART: XY[] = Array.from({ length: 40 }, (_, i) => {
  const t = (i / 40) * 2 * Math.PI;
  return [(16 * Math.sin(t) ** 3) / 40, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 40 + 0.06];
});
/** a picture state as (turn in degrees, size) */
type X7S = [number, number];
const X7_START: X7S = [30, 2];
const X7_OPTS: { states: X7S[]; steps: [string, string]; half: 0 | 1; dir: 1 | -1 }[] = [
  { states: [X7_START, [30, 1], [0, 1]], steps: ["অর্ধেক", "উল্টা ঘোরাও"], half: 0, dir: -1 },
  { states: [X7_START, [0, 2], [0, 1]], steps: ["উল্টা ঘোরাও", "অর্ধেক"], half: 1, dir: -1 },
  { states: [X7_START, [60, 2], [60, 1]], steps: ["আবার ঘোরাও", "অর্ধেক"], half: 1, dir: 1 },
];
const X7_RIGHT = [true, true, false];
const X7F = patchFrame(-1.15, 1.15, -1.1, 1.1, 66); // 168 × 161
const X7_FR = 14;
const heartMove = ([deg, s]: X7S): Move => {
  const c = turnCols(deg);
  return (p) => {
    const q = apply(c, p);
    return [q[0] * s, q[1] * s];
  };
};

/** a small glass for the heart's stands: ½, or a turn arrow (dir −1: back, clockwise) */
function X7_Glass({ half, dir = 1 }: { half?: boolean; dir?: 1 | -1 }) {
  return (
    <svg viewBox="0 0 28 28" width={24} height={24} aria-hidden="true" className="shrink-0">
      <circle cx={14} cy={14} r={11} fill={half ? L_FILL : "#fecdd3"} stroke={INK} strokeOpacity={0.6} strokeWidth={1.3} />
      {half ? (
        <text x={14} y={18.5} textAnchor="middle" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK}>
          ½
        </text>
      ) : (
        <g transform={dir < 0 ? "translate(28 0) scale(-1 1)" : undefined}>
          <path d="M19 10A6 6 0 1 0 20 16" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
          <path d="M19 10l0.6 -3.4M19 10l-3.2 -0.6" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export function TryUndoTurn() {
  const pass = useGate();
  const [found, setFound] = useSeed<boolean[]>("found", [false, false, false]);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const [miss, setMiss] = useState(0);
  const run = usePlay(45);
  const choose = (i: number) => {
    if (run.running) return;
    setCur(i);
    run.play(2 * X7_FR, () => {
      const nf = found.map((v, j) => v || j === i);
      setFound(nf);
      if (!X7_RIGHT[i]) setMiss((m) => m + 1);
      else if (nf[0] && nf[1]) pass("অর্ধেক করা যেকোনো জায়গায় বসে।");
    });
  };
  const kk = cur === null ? 0 : run.running ? run.k : found[cur] ? 2 * X7_FR : 0;
  let st: X7S = X7_START;
  if (cur !== null) {
    const ss = X7_OPTS[cur].states;
    if (kk >= 2 * X7_FR) st = ss[2];
    else {
      const i = Math.floor(kk / X7_FR);
      const t = (kk % X7_FR) / X7_FR;
      st = [ss[i][0] + (ss[i + 1][0] - ss[i][0]) * t, ss[i][1] + (ss[i + 1][1] - ss[i][1]) * t];
    }
  }
  const landed = cur !== null && !run.running && found[cur];
  const heart = pathOf(X7F, heartMove(st), HEART, true);
  const ghost = pathOf(X7F, ID_MOVE, HEART, true);
  const home = landed && cur !== null && X7_RIGHT[cur];
  return (
    <>
      <div className="mb-1.5 flex items-center justify-center gap-1.5 text-xs text-muted">
        <span>ছবিটা এলো:</span>
        <X7_Glass />
        <span>30° ঘোরাও</span>
        <RowArrow />
        <span className="grid size-6 place-items-center rounded-full border border-[#0f1b2d]/50 bg-[#bae6fd] font-mono text-[0.7rem] font-bold text-[#0f1b2d]">2</span>
        <span>দুইগুণ</span>
      </div>
      <div className="flex justify-center">
        <PatchWall f={X7F} label="রিনার heart 30° ঘোরানো আর দুইগুণ; বাছাই করা stand দিয়ে ফেরালে ঘরে ফেরে কি না, দাগের সাথে মিলিয়ে দেখায়" className="max-w-[10.5rem]" pin={false}>
          <path d={ghost} fill="none" stroke={home ? OK : BLUE} strokeWidth={1.4} strokeDasharray="4 3" opacity={home ? 1 : 0.6} />
          <path d={heart} fill="#ec4899" fillOpacity={0.85} stroke="#9d174d" strokeWidth={1.2} strokeLinejoin="round" />
          {landed && cur !== null && <S_Chip f={X7F} at={[0, -0.92]} text={X7_RIGHT[cur] ? "ঘরে ফিরলো" : "60° ঘোরানো"} tone={X7_RIGHT[cur] ? OK : BAD} />}
        </PatchWall>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {X7_OPTS.map((o, i) => (
          <Choice key={i} n={i} look={found[i] ? (X7_RIGHT[i] ? "right" : "wrong") : cur === i && run.running ? "picked" : "idle"} disabled={run.running || (found[i] && X7_RIGHT[i])} onClick={() => choose(i)}>
            <span className="flex items-center gap-1.5 text-sm">
              {o.half === 0 ? <X7_Glass half /> : <X7_Glass dir={o.dir} />}
              <span>{o.steps[0]}</span>
              <RowArrow />
              {o.half === 1 ? <X7_Glass half /> : <X7_Glass dir={o.dir} />}
              <span>{o.steps[1]}</span>
            </span>
          </Choice>
        ))}
      </div>
      {landed && cur === 2 && <Nope key={miss}>Heart আরো 30° ঘুরলো, মোট 60°। ঘোরানো ফেরাতে উল্টা দিকে ঘোরাতে হয়।</Nope>}
      {landed && cur !== null && X7_RIGHT[cur] && !(found[0] && found[1]) && <div className={`mt-2 text-center text-sm text-accent-text ${FADE}`}>এইটা মিললো। আর কোনোটা?</div>}
      <Task done={found[0] && found[1] && !run.running}>কোন কোন stand heart কে ঘরে ফেরায়? যতগুলো মেলে, সবগুলো চালিয়ে বের করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The bet opened on the door hand. Each card runs its order to the end:
//     Karim's comes out crooked, Samin's and Som's land home, Nasib's "any
//     order" is tried as Z⁻¹, H, W⁻¹: crooked.

const X8_ORDERS: GKey[][] = X1_CARDS.map((c) => c.order ?? ["zi", "h", "wi"]);
const X8_STATES = X8_ORDERS.map((o) => statesOf(DOOR, o.map((g) => GLASS[g].cols)));
const X8_HOME = X8_STATES.map((s) => near(s[3], I2));
const X8_FR = 14;

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const run = usePlay(40);
  const tap = (i: number) => {
    if (run.running) return;
    setCur(i);
    run.play(3 * X8_FR, () => {
      const no = open.includes(i) ? open : [...open, i];
      setOpen(no);
      if (no.length === X1_CARDS.length) pass("শেষে লাগানো lens আগে খোলে।");
    });
  };
  const landed = cur !== null && !run.running && open.includes(cur);
  const kk = cur === null ? 0 : run.running ? run.k : landed ? 3 * X8_FR : 0;
  const cols = cur === null ? DOOR : colsAt(X8_STATES[cur], kk, X8_FR);
  const lit = cur !== null && run.running ? Math.min(2, Math.floor(kk / X8_FR)) : undefined;
  return (
    <>
      <div className="mb-1.5 min-h-9">
        <StandRow keys={cur === null ? [null, null, null] : X8_ORDERS[cur]} lit={lit} />
      </div>
      <div className="flex justify-center">
        <RunWall f={X4F} cols={cols} verdict={landed && cur !== null ? (X8_HOME[cur] ? "home" : "bent") : null} chipAt={[2.6, 5.8]} label="দরজার পাশের হাত; বাজির যেই card খুলবেন, তার order এ তিনটা lens চলে; হাত stencil এ ফেরে কি না" />
      </div>
      {landed && cur === 3 && <div className={`mt-1 text-center text-sm text-danger ${FADE}`}>যেকোনো order চলার কথা ছিলো। এই order টা চললো না।</div>}
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={open.includes(i) ? (X8_HOME[i] ? "right" : "wrong") : "idle"} disabled={run.running} onClick={() => tap(i)}>
            <span className="flex flex-col text-sm leading-tight">
              <span>{c.who}</span>
              <span className="flex items-center gap-0.5 text-xs text-muted">
                {c.order ? (
                  c.order.map((g, j) => (
                    <span key={g} className="flex items-center">
                      {j > 0 && <span className="pr-1">,</span>}
                      {gName(g)}
                    </span>
                  ))
                ) : (
                  <span>যেকোনো order</span>
                )}
              </span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={open.length === X1_CARDS.length && !run.running}>বাজির চারটা card একটা একটা করে খুলুন। প্রতিটার order এ হাত চালিয়ে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage bits for the story scenes.

const SW: [number, number] = [8, 30]; // the stage wall's top-left
/** the door hand on the stage wall: D·hand, a third its size, right of the door */
const ST_DOOR_MOVE: Move = (p) => {
  const q = apply(DOOR, p);
  return [7.2 + 0.29 * q[0], -1.85 + 0.29 * q[1]];
};

function St_DoorHand() {
  const f = STAGE_WALL_F;
  return (
    <g className="pointer-events-none">
      <path d={pathOf(f, ST_DOOR_MOVE, SQ, true)} fill={PK.glow} fillOpacity={0.35} stroke={PK.lamp} strokeWidth={0.6} />
      <path d={pathOf(f, ST_DOOR_MOVE, HAND, true)} fill={HENNA} />
    </g>
  );
}

/** a cast name in light ink, for night stages */
function Name({ x, y = 161, children }: { x: number; y?: number; children: ReactNode }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={NIGHT_INK} className="pointer-events-none transition-[x] duration-1000 motion-reduce:transition-none">
      {children}
    </text>
  );
}

/** a small round glass with its letter; `inv` raises a −1 */
function St_Glass({ x, y, g, r = 5.5 }: { x: number; y: number; g: GKey; r?: number }) {
  const d = GLASS[g];
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill={d.fill} stroke={INK} strokeWidth={0.8} />
      <text x={x - (d.inv ? 1 : 0)} y={y + r * 0.42} textAnchor="middle" fontSize={r * 1.1} fontWeight={800} fontFamily={MONO} fill={INK}>
        {d.l}
        {d.inv && (
          <tspan dy={-r * 0.5} fontSize={r * 0.6}>
            −1
          </tspan>
        )}
      </text>
    </g>
  );
}

/** the চৌকি, top at y, from x0 to x1 */
function St_Chouki({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x0} y={y} width={x1 - x0} height={7} rx={1.5} fill="#92400e" />
      <rect x={x0 + 4} y={y + 7} width={5} height={150 - y - 7} fill="#78350f" />
      <rect x={x1 - 9} y={y + 7} width={5} height={150 - y - 7} fill="#78350f" />
    </g>
  );
}

/** আপার ট্রাংক, bottom-centre at (x, y); `open` lifts the ডালা, `lock` hangs the তালা, `bag` shows the ব্যাগ inside */
function St_Trunk({ x, y, open = false, lock = false, bag = false }: { x: number; y: number; open?: boolean; lock?: boolean; bag?: boolean }) {
  return (
    <g className="pointer-events-none">
      {bag && open && <rect x={x - 17} y={y - 30} width={34} height={12} rx={3} fill="#16a34a" className={POP} />}
      <rect x={x - 26} y={y - 24} width={52} height={24} rx={2} fill="#0f766e" stroke="#115e59" strokeWidth={1} />
      <path d={`M${x - 26} ${y - 12}H${x + 26}`} stroke="#99f6e4" strokeOpacity={0.5} strokeWidth={0.8} />
      {open ? (
        <path d={`M${x - 26} ${y - 24}L${x - 30} ${y - 46}H${x + 22}L${x + 26} ${y - 24}`} fill="#115e59" opacity={0.9} />
      ) : (
        <rect x={x - 27} y={y - 30} width={54} height={7} rx={2} fill="#0f766e" stroke="#115e59" strokeWidth={1} />
      )}
      {lock && (
        <g className={POP}>
          <path d={`M${x - 2.5} ${y - 20}v-2.5a2.5 2.5 0 0 1 5 0v2.5`} fill="none" stroke="#78716c" strokeWidth={1.2} />
          <rect x={x - 3.5} y={y - 20} width={7} height={6} rx={1} fill="#eab308" />
        </g>
      )}
    </g>
  );
}

/** a folded red শাড়ি with its golden পাড় */
function St_Saree({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 10} y={y - 5} width={20} height={9} rx={1} fill="#dc2626" />
      <path d={`M${x - 10} ${y + 2}H${x + 10}`} stroke="#facc15" strokeWidth={1.4} />
    </g>
  );
}

/** the ব্যাগ; `zip` closes it; `saree` shows red at its mouth */
function St_Bag({ x, y, zip = false, saree = false }: { x: number; y: number; zip?: boolean; saree?: boolean }) {
  return (
    <g className="pointer-events-none">
      {saree && !zip && <rect x={x - 9} y={y - 18} width={18} height={6} fill="#dc2626" />}
      <rect x={x - 15} y={y - 14} width={30} height={14} rx={4} fill="#16a34a" stroke="#14532d" strokeWidth={0.8} />
      <path d={`M${x - 12} ${y - 12}H${x + 12}`} stroke="#fef08a" strokeWidth={1} strokeDasharray={zip ? undefined : "2 2"} />
    </g>
  );
}

/** the new stencil: a cereal-box card with আপার হাত cut out */
function St_Stencil({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const f = makeFrame(0, 1, 0, 1, 16 * s, 0);
  return (
    <g transform={`translate(${x - 8 * s} ${y - 8 * s})`} className="pointer-events-none">
      <rect x={-2 * s} y={-2 * s} width={20 * s} height={20 * s} rx={1.5} fill="#fbbf24" stroke="#b45309" strokeWidth={0.8} />
      <path d={pathD(f, HAND)} fill="#44403c" />
    </g>
  );
}

/** আপা in her শাড়ি (8.7's look): the cast's আপা with a red আঁচল over the shoulder and head, her name under her feet */
function St_Apa({ x, y = 150, facing = 1, arm = "down", walking = false, night = false }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "hold" | "point"; walking?: boolean; night?: boolean }) {
  return (
    <>
      <Person who="apa" x={x} y={y} facing={facing} arm={arm} walking={walking} />
      <g style={{ transform: `translate(${x}px, ${y}px)` }} className="pointer-events-none transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none">
        <path d="M-10 -40h20l3 26h-26Z" fill="#dc2626" />
        <path d="M-10 -52q0 -13 10 -13t10 13l-2 14h-3l1 -12q-6 -5 -12 0l1 12h-3Z" fill="#b91c1c" />
        <path d="M-10 -34l20 12" stroke="#facc15" strokeWidth={1.4} />
        <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={night ? NIGHT_INK : INK}>
          আপা
        </text>
      </g>
    </>
  );
}

/** দুলাভাই: মামার look in a cream পাঞ্জাবি, his name under his feet (8.7's look) */
function St_Dulabhai({ x, y = 150, facing = 1, arm = "down" }: { x: number; y?: number; facing?: 1 | -1; arm?: "down" | "hold" | "point" }) {
  return (
    <>
      <Person who="mama" x={x} y={y} facing={facing} arm={arm} />
      <g transform={`translate(${x} ${y})`} className="pointer-events-none">
        <rect x={-9} y={-40} width={18} height={26} rx={4} fill="#fef3c7" />
        <path d="M0 -40v10" stroke="#d97706" strokeWidth={1} />
      </g>
      <Name x={x} y={y + 11}>
        দুলাভাই
      </Name>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1a · The night after ফিরানি। The wall with the door hand; the machine on its
//      stand; আপা at her ট্রাংক; Rina wants a hand of her own; Karim with the
//      three undo lenses and his claim.

export function TrunkNight({}: Story) {
  const s = useScene(4, [600, 1800, 1600, 2400, 2600]);
  const k = s.k;
  const [lx, ly] = projectorLens(206, 150);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাত; দেয়ালে দরজার পাশে আপার বড় হাত; উঠানে যন্ত্র; আপা ট্রাংক গোছাচ্ছেন; রিনা বললো একটা হাত আমার কাছে থাকবে; করিমের হাতে তিনটা ফেরার lens; করিম বললো যে order এ লাগাইছি সেই order এ খুলি">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_DoorHand />
        </StageWall>
        <Projector x={206} y={150} />
        {k >= 3 && <path d={`M${lx - 6} ${ly + 7}H${lx - 44}`} stroke="#b08d3c" strokeWidth={2} className={POP} />}
        <Person who="rina" x={120} y={150} facing={1} arm={k >= 1 ? "point" : "down"} />
        <Name x={120}>রিনা</Name>
        {k === 1 && <Bubble x={120} y={84} side="mid" lines={["একটা হাত আপার।", "একটা আমার কাছে থাকবে।"]} />}
        <Person who="karim" x={244} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} />
        <Name x={244}>করিম</Name>
        {k >= 2 && (
          <g className={POP}>
            {G_ORDER.map((g, i) => (
              <St_Glass key={g} x={228 - i * 11} y={111} g={g} r={5.2} />
            ))}
          </g>
        )}
        {k >= 3 && <Bubble x={244} y={84} side="left" lines={["যে order এ লাগাইছি,", "সেই order এ খুলি।"]} />}
        <St_Trunk x={288} y={150} open={k < 4} lock={k >= 4} />
        <St_Apa x={300} facing={-1} arm={k >= 4 ? "hold" : "down"} night />
      </Stage>
    </StoryFrame>
  );
}

// 2a · আপা packs: the folded শাড়ি into the ব্যাগ, the zip, the ব্যাগ into
//      the ট্রাংক, the ডালা, the তালা।

export function ApaPacks({}: Story) {
  const s = useScene(4, [600, 1400, 1400, 1200, 1400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="আপা লাল শাড়ি ভাঁজ করে ব্যাগে ঢুকালেন; ব্যাগের চেইন টানলেন; ব্যাগ গেলো ট্রাংকে; ডালা নামলো; শেষে তালা">
        <St_Chouki x0={130} x1={306} y={118} />
        <St_Apa x={k === 0 ? 96 : k <= 2 ? 150 : 222} facing={1} arm={k === 0 ? "hold" : "point"} walking={k === 1 || k === 3} />
        {k === 0 && <St_Saree x={112} y={112} />}
        {k <= 1 && <St_Bag x={176} y={118} saree={k >= 1} zip={false} />}
        {k === 2 && (
          <g className={POP}>
            <St_Bag x={176} y={118} zip />
          </g>
        )}
        <St_Trunk x={262} y={118} open={k <= 3} bag={k >= 3} lock={k >= 4} />
        {k >= 3 && k < 4 && (
          <text x={262} y={70} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK} className={FADE}>
            ব্যাগ ভেতরে
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 5a · The লাইট ভাই takes out 8.5's turning lens: এইটার ফেরায় det লাগে না;
//      কাইত কইরা পড়েন। Som leans in.

export function TurnLensOut({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="লাইট ভাই ব্যাগ থেকে ঘোরানো lens বের করলেন; বললেন এইটার ফেরায় det লাগে না; কাইত করে পড়েন; সোম ঝুঁকে দেখলো">
        <Projector x={40} y={150} facing={1} />
        <LightBhai x={110} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} nameTone={NIGHT_INK} />
        {k >= 1 && (
          <g className={POP}>
            <circle cx={126} cy={104} r={8} fill="#e0f2fe" stroke={INK} strokeWidth={0.9} />
            <path d="M122.5 105A3.6 3.6 0 1 1 127 107.4M127 107.4l-0.2 -2.2M127 107.4l-2 0.6" fill="none" stroke={INK} strokeWidth={0.9} />
          </g>
        )}
        {k === 2 && <Bubble x={110} y={84} side="right" lines={["এইটার ফেরায়", "det লাগে না।"]} />}
        {k >= 3 && <Bubble x={110} y={84} side="right" lines={["কাইত কইরা", "পড়েন।"]} />}
        <Person who="som" x={k >= 2 ? 178 : 210} y={150} facing={-1} mood={k >= 2 ? "puzzled" : "plain"} walking={k === 2} />
        <Name x={k >= 2 ? 178 : 210}>সোম</Name>
        <Person who="karim" x={262} y={150} facing={-1} />
        <Name x={262}>করিম</Name>
      </Stage>
    </StoryFrame>
  );
}

// 8a · The run before ten. Rina cuts along the light on the card: আপার হাত,
//      stencil-sized. আপা locks the ট্রাংক one last time; the current goes.

export function TrunkClose({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="রিনা card এর উপর আলোর দাগ ধরে কাটলো, আপার হাত; আপা শেষবার ট্রাংকে তালা দিলেন; কারেন্ট চলে গেলো">
        <Person who="rina" x={80} y={150} facing={1} arm={k >= 1 ? "hold" : "point"} label />
        {k === 0 && (
          <g>
            <rect x={90} y={104} width={20} height={20} rx={1.5} fill="#fbbf24" stroke="#b45309" strokeWidth={0.8} />
            <path d="M104 100l8 6M104 106l8 -6" stroke="#475569" strokeWidth={1.4} />
          </g>
        )}
        {k >= 1 && (
          <g className={POP}>
            <St_Stencil x={100} y={100} s={1.1} />
          </g>
        )}
        <St_Chouki x0={190} x1={306} y={122} />
        <St_Trunk x={250} y={122} open={k < 2} lock={k >= 2} />
        <St_Apa x={184} facing={1} arm={k >= 2 ? "point" : "down"} />
        {k >= 3 && <rect x={0} y={0} width={320} height={180} fill="#0f172a" opacity={0.78} className={FADE} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Late night. The ট্রাংক by the door; the তালার চাবি tied to আপার আঁচল।

export function TrunkByDoor({}: Story) {
  const s = useScene(2, [600, 1600, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="গভীর রাত; ট্রাংক দরজার পাশে; আপা তালার চাবি আঁচলে বাঁধলেন">
        <rect x={0} y={0} width={320} height={180} fill="#1e293b" opacity={0.45} />
        <rect x={40} y={62} width={46} height={88} fill="#78350f" stroke="#451a03" strokeWidth={1.2} />
        <circle cx={78} cy={108} r={2} fill="#fbbf24" />
        <St_Trunk x={122} y={150} lock />
        <St_Apa x={k >= 1 ? 190 : 230} facing={-1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} night />
        {k >= 2 && (
          <g className={POP}>
            <path d="M180 124q-6 6 -2 12" stroke="#dc2626" strokeWidth={2} fill="none" />
            <circle cx={178} cy={138} r={2.2} fill="none" stroke="#eab308" strokeWidth={1.2} />
            <path d="M178 140v5l1.6 0.8" stroke="#eab308" strokeWidth={1.2} fill="none" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 9b · The bridge to 9.4. দুলাভাই on the বারান্দা asks নানা for paper: will the
//      মামারা come? He draws his village: a straight road and a slanting বাঁধ।

export function DulabhaiPaper({}: Story) {
  const s = useScene(3, [600, 2200, 2200, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="দুলাভাই নানার কাছে কাগজ চাইলেন; বললেন মামারা আসবেন তো, ঠিকানা লিখে দেই; কাগজে তাঁর গ্রামের দুইটা রাস্তা, একটা সোজা, একটা হেলানো বাঁধ">
        <Person who="nana" x={80} y={150} facing={1} arm={k >= 2 ? "hold" : "down"} />
        <Name x={80}>নানা</Name>
        <St_Dulabhai x={150} facing={-1} arm={k >= 1 ? "hold" : "down"} />
        {k === 1 && <Bubble x={150} y={84} side="right" lines={["নানা, মামারা", "আসবেন তো?"]} />}
        {k === 2 && <Bubble x={150} y={84} side="right" lines={["ঠিকানা লিখে", "দেই।"]} />}
        {k >= 3 && (
          <g className={POP}>
            <rect x={206} y={60} width={96} height={70} rx={3} fill="white" stroke="#94a3b8" />
            <path d="M214 116H294" stroke="#64748b" strokeWidth={3} />
            <path d="M216 118L270 68" stroke="#a16207" strokeWidth={3} />
            <text x={292} y={112} textAnchor="end" fontSize={7} fill={INK}>
              পাকা রাস্তা
            </text>
            <text x={240} y={94} textAnchor="end" fontSize={7} fill="#a16207">
              বাঁধ
            </text>
            <rect x={284} y={80} width={9} height={8} fill="#b45309" />
            <text x={288} y={76} textAnchor="middle" fontSize={11} fontWeight={800} fill={BLUE}>
              ?
            </text>
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · The stake: the door hand, the three undo lenses, three empty places,
//      the current goes at ten: one run. Stops at "?".

const S1_SAY = [
  "দরজার পাশের হাত। Z, W, L পার হয়ে 12 ঘর।",
  "ফেরাতে তিনটা lens। Stand এ তিনটা খালি জায়গা।",
  "দশটায় কারেন্ট যাবে। যন্ত্র চলবে একবার।",
  "কোনটা আগে, কোনটা পরে?",
];

export function TrunkStake() {
  const s = useScene(3, [600, 1600, 2200, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S1_SAY, k)}>
      <div className="flex items-center justify-center gap-2">
        <S_Icon cols={DOOR} size={70} />
        <div className="flex flex-col items-center gap-1">
          {k >= 1 && (
            <div className={`flex gap-1 ${POP}`}>
              {G_ORDER.map((g, i) => (
                <span key={g} className="inline-block" style={{ transform: `rotate(${(i - 1) * 12}deg)` }}>
                  <Disc g={g} size={26} />
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="relative">
                <EmptySlot size={30} />
                {k >= 3 && (
                  <span className={`absolute inset-0 grid place-items-center font-bold text-cat-blue ${POP}`} style={{ transitionDelay: `${i * 150}ms` }}>
                    ?
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 50 50" width={48} height={48} aria-label="ঘড়িতে সাড়ে নয়টা, দশটায় কারেন্ট যাবে" className={k >= 2 ? POP : "opacity-0"}>
          <circle cx={25} cy={25} r={21} fill="white" stroke={INK} strokeWidth={1.6} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * 2 * Math.PI;
            return <path key={i} d={`M${25 + 17 * Math.sin(a)} ${25 - 17 * Math.cos(a)}L${25 + 19.5 * Math.sin(a)} ${25 - 19.5 * Math.cos(a)}`} stroke={INK} strokeWidth={1} />;
          })}
          <path d="M25 25L17 30" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <path d="M25 25L25 9" stroke={BAD} strokeWidth={1.4} strokeLinecap="round" />
        </svg>
      </div>
    </Scene>
  );
}

// 2½ · The nest: শাড়ি ⊂ ব্যাগ ⊂ ট্রাংক (+ তালা); হাত ⊂ Z ⊂ W ⊂ L। The
//      outermost of each lights up.

const S2_SAY = ["আগে শাড়ি।", "শাড়ি ঢুকলো ব্যাগে।", "ব্যাগ ঢুকলো ট্রাংকে। শেষে তালা।", "হাতের উপর আগে Z, তারপর W, শেষে L।", "তালা আর L: সবার বাইরে। খোলে সবার আগে।"];

function S2_Nest({ x, layers, k0, k, glow }: { x: number; layers: { l: string; fill: string; stroke: string }[]; k0: number; k: number; glow: boolean }) {
  const cy = 62;
  return (
    <g>
      {layers.map((ly, i) => {
        const pad = i * 13;
        const shown = k >= k0 + (k0 === 0 ? i : 0);
        if (!shown) return null;
        const outer = i === layers.length - 1;
        const bx = x - 22 - pad;
        const by = cy - 15 - pad;
        const bn = /[ঀ-৿]/.test(ly.l);
        return (
          <g key={ly.l} className={POP}>
            <rect x={bx} y={by} width={44 + 2 * pad} height={30 + 2 * pad} rx={5} fill={ly.fill} fillOpacity={i === 0 ? 1 : 0.3} stroke={outer && glow ? "#f59e0b" : ly.stroke} strokeWidth={outer && glow ? 2.6 : 1.2} />
            <text x={i === 0 ? x : bx + 4} y={i === 0 ? cy + 4 : by + 10} textAnchor={i === 0 ? "middle" : "start"} fontSize={i === 0 ? 9 : 8.5} fontWeight={700} fill={i === 0 && ly.fill === "#dc2626" ? "white" : INK} fontFamily={bn ? undefined : MONO}>
              {ly.l}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function NestFig() {
  const s = useScene(4, [600, 1200, 1400, 2200, 2400]);
  const k = s.k;
  const glow = k >= 4;
  return (
    <Scene scene={s} caption={say(S2_SAY, k)}>
      <svg viewBox="0 0 280 124" role="img" aria-label="বামে শাড়ি ব্যাগের ভেতরে, ব্যাগ ট্রাংকের ভেতরে, তালা বাইরে; ডানে হাত Z এর ভেতরে, Z W এর ভেতরে, W L এর ভেতরে" className="mx-auto block h-auto w-full max-w-[17rem]">
        <S2_Nest
          x={70}
          k0={0}
          k={Math.min(k, 2)}
          glow={glow}
          layers={[
            { l: "শাড়ি", fill: "#dc2626", stroke: "#7f1d1d" },
            { l: "ব্যাগ", fill: "#16a34a", stroke: "#14532d" },
            { l: "ট্রাংক", fill: "#0f766e", stroke: "#115e59" },
          ]}
        />
        {k >= 2 && (
          <g className={POP}>
            <path d="M65 101v-4a5 5 0 0 1 10 0v4" fill="none" stroke="#78716c" strokeWidth={1.8} />
            <rect x={63} y={101} width={14} height={11} rx={2} fill="#eab308" stroke={glow ? "#f59e0b" : "#a16207"} strokeWidth={glow ? 2.2 : 1} />
          </g>
        )}
        {k >= 3 && (
          <S2_Nest
            x={200}
            k0={3}
            k={k}
            glow={glow}
            layers={[
              { l: "হাত", fill: PK.glow, stroke: PK.lamp },
              { l: "Z", fill: Z_FILL, stroke: "#a16207" },
              { l: "W", fill: W_FILL, stroke: "#6d28d9" },
              { l: "L", fill: L_FILL, stroke: "#0369a1" },
            ]}
          />
        )}
      </svg>
    </Scene>
  );
}

// 3½ · The formula, built: হাত → Z → W is written WZ; the way back runs W⁻¹
//      first, then Z⁻¹, written Z⁻¹W⁻¹; so (WZ)⁻¹ = Z⁻¹W⁻¹.

const S3_SAY = [
  "হাত যায় আগে Z দিয়ে, তারপর W দিয়ে।",
  "লেখায় WZ। ডানের Z আগে চলে।",
  "ফেরার পথে উল্টা: আগে W⁻¹, তারপর Z⁻¹।",
  "লেখায় Z⁻¹W⁻¹। এবারও ডানেরটা আগে চলে।",
  "(WZ)⁻¹ = Z⁻¹W⁻¹. Order উল্টে গেলো।",
];

function S3_Letter({ x, y, l, inv = false, size = 16 }: { x: number; y: number; l: string; inv?: boolean; size?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={800} fontFamily={MONO} fill={INK}>
      {l}
      {inv && (
        <tspan dy={-size * 0.4} fontSize={size * 0.55}>
          −1
        </tspan>
      )}
    </text>
  );
}

export function SwapFig() {
  const s = useScene(4, [600, 1600, 2000, 2000, 2400]);
  const k = s.k;
  const arrow = (x1: number, x2: number, y: number) => <path d={`M${x1} ${y}H${x2}M${x2 + (x2 > x1 ? -5 : 5)} ${y - 4}L${x2} ${y}L${x2 + (x2 > x1 ? -5 : 5)} ${y + 4}`} fill="none" stroke={INK} strokeOpacity={0.6} strokeWidth={1.4} />;
  return (
    <Scene scene={s} caption={say(S3_SAY, k)}>
      <svg viewBox="0 0 280 130" role="img" aria-label="হাত Z আর W দিয়ে যায়, লেখা WZ; ফেরার পথে আগে W এর ফেরা, তারপর Z এর ফেরা, লেখা Z inverse W inverse" className="mx-auto block h-auto w-full max-w-[17rem]">
        {/* the way there */}
        <rect x={14} y={14} width={34} height={26} rx={4} fill={PK.glow} fillOpacity={0.7} stroke={PK.lamp} />
        <text x={31} y={31} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
          হাত
        </text>
        {arrow(52, 74, 27)}
        <circle cx={90} cy={27} r={13} fill={Z_FILL} stroke={INK} strokeOpacity={0.6} />
        <S3_Letter x={90} y={32} l="Z" size={13} />
        {arrow(107, 129, 27)}
        <circle cx={145} cy={27} r={13} fill={W_FILL} stroke={INK} strokeOpacity={0.6} />
        <S3_Letter x={145} y={32} l="W" size={13} />
        {k >= 1 && (
          <g className={POP}>
            <S3_Letter x={222} y={33} l="WZ" size={18} />
          </g>
        )}
        {/* the way back */}
        {k >= 2 && (
          <g className={POP}>
            <rect x={14} y={62} width={34} height={26} rx={4} fill="none" stroke={OK} strokeDasharray="3 2" strokeWidth={1.4} />
            <text x={31} y={79} textAnchor="middle" fontSize={9} fontWeight={700} fill={OK}>
              হাত
            </text>
            {arrow(74, 52, 75)}
            <circle cx={90} cy={75} r={13} fill={Z_FILL} stroke={INK} strokeOpacity={0.6} />
            <S3_Letter x={88} y={80} l="Z" inv size={12} />
            {arrow(129, 107, 75)}
            <circle cx={145} cy={75} r={13} fill={W_FILL} stroke={INK} strokeOpacity={0.6} />
            <S3_Letter x={143} y={80} l="W" inv size={12} />
            {arrow(178, 162, 75)}
            <rect x={180} y={64} width={26} height={22} rx={3} fill="#e5e7eb" stroke={INK} strokeOpacity={0.5} />
            <text x={193} y={79} textAnchor="middle" fontSize={7} fill={INK}>
              ছবি
            </text>
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <S3_Letter x={248} y={81} l="Z" inv size={15} />
            <S3_Letter x={270} y={81} l="W" inv size={15} />
          </g>
        )}
        {k >= 4 && (
          <g className={POP}>
            <rect x={60} y={98} width={160} height={26} rx={6} fill="white" stroke={OK} strokeWidth={1.4} />
            <text x={140} y={116} textAnchor="middle" fontSize={14} fontWeight={800} fontFamily={MONO} fill={INK}>
              (WZ)
              <tspan dy={-6} fontSize={8}>
                −1
              </tspan>
              <tspan dy={6}> = Z</tspan>
              <tspan dy={-6} fontSize={8}>
                −1
              </tspan>
              <tspan dy={6}>W</tspan>
              <tspan dy={-6} fontSize={8}>
                −1
              </tspan>
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · Doubling doesn't care about order: the hand doubled then slanted, and
//      slanted then doubled, land on the same picture.

const S4_SAY = ["একই হাত, দুই ভাবে।", "বামে আগে দুইগুণ। ডানে আগে হেলানো।", "এবার বামে হেলানো, ডানে দুইগুণ।", "একই ছবি। সব দিকে দুইগুণ করা order মানে না।"];
const S4_SLANT: Cols = [
  [1, 0],
  [1, 1],
];
const S4F = patchFrame(-0.3, 4.3, -0.3, 2.3, 24); // 126 × 78
const S4_LEFT: Cols[] = [I2, scale(2, I2), scale(2, S4_SLANT), scale(2, S4_SLANT)];
const S4_RIGHT: Cols[] = [I2, S4_SLANT, scale(2, S4_SLANT), scale(2, S4_SLANT)];

export function DoubleAnywhere() {
  const s = useScene(3, [600, 1400, 1400, 2400]);
  const k = s.k;
  const flat = (c: Cols) => [c[0][0], c[0][1], c[1][0], c[1][1]];
  const [a0, a1, a2, a3, b0, b1, b2, b3] = useTween([...flat(S4_LEFT[k]), ...flat(S4_RIGHT[k])], 900);
  const L: Cols = [
    [a0, a1],
    [a2, a3],
  ];
  const R: Cols = [
    [b0, b1],
    [b2, b3],
  ];
  return (
    <Scene scene={s} caption={say(S4_SAY, k)}>
      <div className="flex items-start justify-center gap-2">
        {[
          { c: L, t: "আগে দুইগুণ" },
          { c: R, t: "আগে হেলানো" },
        ].map((p) => (
          <div key={p.t} className="flex flex-col items-center gap-0.5">
            <div className="text-xs text-muted">{p.t}</div>
            <PatchWall f={S4F} label={`মেহেদি হাত, ${p.t}, তারপর অন্যটা; শেষে দুই পাশে একই ছবি`} className="max-w-[8rem]">
              <S_Print f={S4F} move={byCols(scale(2, S4_SLANT))} ghost tone={k >= 3 ? OK : "#94a3b8"} soft={k < 3} />
              <S_Print f={S4F} move={byCols(p.c)} />
            </PatchWall>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// 5½ · Why a turn reads sideways: its two columns are 1 long and square to
//      each other; read sideways, they turn the other way by the same 37°.

const S5_SAY = ["37° lens এর দুইটা column.", "দুইটাই 1 লম্বা। মাঝে সোজা কোণ।", "কাত করলে row হয় column।", "নতুন column দুইটা: উল্টা দিকে 37°।", "তাই কাত করা lens টাই ফেরার lens: Rᵀ = R⁻¹।"];
const S5F = makeFrame(-1.1, 1.1, -0.8, 1.1, 64, 14);

export function SidewaysFig() {
  const s = useScene(4, [600, 1600, 1800, 1800, 2400]);
  const k = s.k;
  const [flip] = useTween([k >= 2 ? 1 : 0], 800);
  const arc = Array.from({ length: 41 }, (_, i) => {
    const a = (-50 + (i / 40) * 190) * (Math.PI / 180);
    return `${i ? "L" : "M"}${S5F.sx(Math.cos(a)).toFixed(1)} ${S5F.sy(Math.sin(a)).toFixed(1)}`;
  }).join("");
  const sq = (u: XY, v: XY) => {
    const d = 0.13;
    const p1: XY = [u[0] * d, u[1] * d];
    const p2: XY = [u[0] * d + v[0] * d, u[1] * d + v[1] * d];
    const p3: XY = [v[0] * d, v[1] * d];
    return `M${S5F.sx(p1[0])} ${S5F.sy(p1[1])}L${S5F.sx(p2[0])} ${S5F.sy(p2[1])}L${S5F.sx(p3[0])} ${S5F.sy(p3[1])}`;
  };
  return (
    <Scene scene={s} caption={say(S5_SAY, k)}>
      <div className="flex items-center justify-center gap-2">
        <div className="w-full max-w-[11rem]">
          <Plane f={S5F} label="37° ঘোরানো lens এর দুইটা column, দুইটাই এক লম্বা, সোজা কোণে; কাত করা lens এর column দুইটা উল্টা দিকে ঘোরানো" grid={0.5} className="my-0! max-w-none">
            {k >= 1 && <path d={arc} fill="none" stroke={INK} strokeOpacity={0.3} strokeDasharray="3 3" className={FADE} />}
            <g opacity={k >= 3 ? 0.3 : 1}>
              <Arrow f={S5F} from={[0, 0]} to={[0.8, 0.6]} tone="amber" />
              <Arrow f={S5F} from={[0, 0]} to={[-0.6, 0.8]} tone="teal" />
              {k >= 1 && <path d={sq([0.8, 0.6], [-0.6, 0.8])} fill="none" stroke={INK} strokeWidth={1.2} className={FADE} />}
            </g>
            {k >= 3 && (
              <g>
                <Arrow f={S5F} from={[0, 0]} to={[0.8, -0.6]} tone="amber" draw />
                <Arrow f={S5F} from={[0, 0]} to={[0.6, 0.8]} tone="teal" draw />
              </g>
            )}
          </Plane>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Mat2 rows={["0.8", "−0.6", "0.6", "0.8"]} t={flip} w={96} />
          <span className="text-xs text-muted">{k >= 2 ? "পাশ থেকে পড়া" : "37° lens"}</span>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  OrderBet: { start: {}, picked: { bet: 0 }, nasib: { bet: 3 }, sealed: { bet: 2, sealed: true } },
  Unpack: { start: {}, wrong: { out: 0, pull: 3 }, two: { out: 2 }, done: { out: 4 } },
  WrongOrder: { start: {}, guessed: { guess: 0 }, karim: { guess: 0, ran: [true, false], cur: 0 }, done: { guess: 0, ran: [true, true], cur: 1 } },
  HAnywhere: { start: {}, one: { tried: [true, false, false], cur: 0 }, all3: { tried: [true, true, true], cur: 2 }, done: { tried: [true, true, true], swapped: true, cur: 3 } },
  TurnReadSideways: { start: {}, turned: { st: [1, 0] }, read: { st: [2, 0] }, done: { tab: 1, st: [3, 3] } },
  YourUnpack: {
    start: {},
    two: { slots: ["h", "wi", null] },
    wrong: { slots: ["zi", "wi", "h"], ran: true },
    wrong2: { slots: ["h", "zi", "wi"], ran: true },
    right: { slots: ["wi", "zi", "h"], ran: true },
  },
  TryUndoTurn: { start: {}, wrong: { found: [false, false, true], cur: 2 }, one: { found: [true, false, false], cur: 0 }, done: { found: [true, true, true], cur: 1 } },
  BetOpen: { start: {}, karim: { open: [0], cur: 0 }, nasib: { open: [0, 3], cur: 3 }, done: { open: [0, 1, 2, 3], cur: 1 } },
  TrunkNight: { rest: { k: 0 }, rina: { k: 1 }, claim: { k: 3 }, done: {} },
  ApaPacks: { rest: { k: 0 }, bag: { k: 2 }, done: {} },
  TurnLensOut: { det: { k: 2 }, done: {} },
  TrunkClose: { cut: { k: 1 }, locked: { k: 2 }, done: {} },
  TrunkByDoor: { rest: { k: 0 }, done: {} },
  DulabhaiPaper: { ask: { k: 1 }, done: {} },
  TrunkStake: { rest: { k: 0 }, lenses: { k: 1 }, done: {} },
  NestFig: { bag: { k: 1 }, trunk: { k: 2 }, done: {} },
  SwapFig: { there: { k: 1 }, back: { k: 3 }, done: {} },
  DoubleAnywhere: { mid: { k: 1 }, done: {} },
  SidewaysFig: { square: { k: 1 }, read: { k: 2 }, done: {} },
};
