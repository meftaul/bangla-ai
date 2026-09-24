"use client";

import { useId, useState, type ReactNode } from "react";

import { Tup } from "@/components/journey/box";
import { Bubble, Card, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, LOOK, Nope, POP, Scene, primaryBtn, quietBtn, usePlay, useScene, useSeed, type Fixtures, type Look } from "@/components/journey/kit";
import { Arrow, Plane, Star, makeFrame, same, type Frame, type XY } from "@/components/journey/plane";
import { ID, LensCard, LightBhai, LightGrid, LitRegion, Post, Projector, StageBeam, WALL_SLOTS, WallBed, apply, byCols, partway, pathOf, projectorLens, useLensRun, type Cols, type Move } from "./light-kit";

// Screens for "Math for AI 7.4 — হলুদ আগে না গোসল আগে, the order", told as a
// Journey in the author's Bangla-English. The plan is 07_journey_specs.md,
// block 7.4. It answers 6.7's last question (OrderQuestion): আগে হেলানো, তারপর
// দুইগুণ চওড়া; উল্টা order এ কি একই?
//
// হলুদের রাত, late, straight on from 7.3's bridge: the show is over and the
// লাইট ভাই has put 7.3's Z and W back the other way (W in the slot, Z held in
// front), not yet switched on. Nasib: দুইটা lens ই তো লাগানো, আগে পরে কী আসে
// যায়. For the বিয়ের রাত, আপা chose the picture of 7.3's last pair, chalked on
// the stand "আগে S, তারপর D": the হেলানো S = [[1, 1], [0, 1]] in the slot (by
// the bulb, so the light meets it first) and the চওড়া D = [[2, 0], [0, 1]] in
// front. Tomorrow the লাইট ভাই's helper fits them. ZW ≠ G is paid in step 2.
//
// Nine screens. 1 seals the bet: the other order gives the same picture ·
// always another picture · it depends on the pair (OrderBet). 2 the flower
// (2, 3) through S then D → (5, 3) → (10, 3); swapped → (4, 3) → (7, 3)
// (SwapLenses). 3 predict: in DS, which lens gets the light first? (WhichFirst).
// 4 Nasib's pair, a 90° turn and a doubling: same wall both ways (TurnAndDouble).
// 5 two spare lenses, neither empty, together leave only the pin (DarkWall).
// 6 Your turn: four pairs, order লাগে / লাগে না (YourOrders). 7 Try it: which
// picture does S R make (TryWhichWall). 8 the helper fits them for আপার ছবি
// (HelperFits). 9 the bet opened, card by card (BetOpen).
//
// After the screens: the story scenes (HoludNight, ChalkOrder, SaminApp,
// NasibBox, BoxBottom, HelperWaits, BackFromGosol) and the watch-only
// figures (HoludGosol, RopesTwoWays, ZWOther, LightEnters, DoubleCommutes,
// LostDirections, ClearGlass, FlipOrder, MorningPandal), each numbered after
// its screen.
//
// The wall pieces come from light-kit.tsx (read-only). The wall here is wider
// than 7.2's (x −3…11), so the flower can reach (10, 3); the chalk grid and
// the stage wall are drawn locally for that frame. The লাইট ভাই is light-kit's
// LightBhai; his helper (steps 8, 9 only) wears করিম's look with a গামছা tied
// on his head and his name drawn; করিম isn't in this journey.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const LIME = "#e9e4d8";
const CHALK = "#64748b";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

// ---------------------------------------------------------------------------
// The lenses. Each is a 2 × 2 given by its columns (light-kit's Cols).

type Lens = { key: string; name: string; tag: string; cols: Cols; hex: string };

const L_S: Lens = { key: "S", name: "হেলানো", tag: "S", cols: [[1, 0], [1, 1]], hex: "#c026d3" };
const L_D: Lens = { key: "D", name: "চওড়া", tag: "D", cols: [[2, 0], [0, 1]], hex: "#0284c7" };
const L_R: Lens = { key: "R", name: "ঘোরানো", tag: "R", cols: [[0, 1], [-1, 0]], hex: "#059669" };
const L_2: Lens = { key: "2", name: "দ্বিগুণ", tag: "2I", cols: [[2, 0], [0, 2]], hex: "#e11d48" };
const L_M: Lens = { key: "M", name: "আয়না", tag: "M", cols: [[-1, 0], [0, 1]], hex: "#ca8a04" };
const L_T: Lens = { key: "T", name: "লম্বা", tag: "T", cols: [[1, 0], [0, 2]], hex: "#65a30d" };
const L_K1: Lens = { key: "K1", name: "বাড়তি 1", tag: "K₁", cols: [[1, 0], [0, 0]], hex: "#78716c" };
const L_K2: Lens = { key: "K2", name: "বাড়তি 2", tag: "K₂", cols: [[0, 0], [0, 1]], hex: "#57534e" };

/** a first, then b, as one lens: its columns are e₁ and e₂ sent through a, then b */
const thenCols = (a: Cols, b: Cols): Cols => [apply(b, a[0]), apply(b, a[1])];
/** light through lens a (t 0 → 1), then lens b (t 1 → 2) */
const twoStep =
  (a: Cols, b: Cols, t: number): Move =>
  (p) => {
    const q = partway(byCols(a), Math.min(1, Math.max(0, t)))(p);
    return t <= 1 ? q : partway(byCols(b), Math.min(1, t - 1))(q);
  };

/** the flower 6.7's গাঁদা ফুল stood on: (2, 3) */
const FLOWER: XY = [2, 3];
const DS = thenCols(L_S.cols, L_D.cols); // [[2, 2], [0, 1]]
const SD = thenCols(L_D.cols, L_S.cols); // [[2, 1], [0, 1]]

// ---------------------------------------------------------------------------
// The wall, wider than 7.2's so (10, 3) fits, and a little shorter so the
// widget fits a phone: x −3…11, y −1…5.

const OF = makeFrame(-3, 11, -1, 5, 21, 8); // 310 × 142

/** Rina's chalk grid over the whole frame, the pin's row a little darker */
function O_Grid({ f, nums = true }: { f: Frame; nums?: boolean }) {
  let d = "";
  for (let x = Math.ceil(f.x0); x <= f.x1; x += 1) d += `M${f.sx(x)} ${f.sy(f.y0)}V${f.sy(f.y1)}`;
  for (let y = Math.ceil(f.y0); y <= f.y1; y += 1) d += `M${f.sx(f.x0)} ${f.sy(y)}H${f.sx(f.x1)}`;
  const fs = Math.max(5.5, f.u * 0.3);
  return (
    <g className="pointer-events-none">
      <path d={d} strokeWidth={0.7} stroke={CHALK} strokeOpacity={0.3} fill="none" />
      <path d={`M${f.sx(f.x0)} ${f.sy(0)}H${f.sx(f.x1)}`} strokeWidth={1.1} stroke={CHALK} strokeOpacity={0.55} />
      {nums &&
        [-2, 2, 4, 6, 8, 10].filter((x) => x > f.x0 && x < f.x1).map((x) => (
          <text key={`x${x}`} x={f.sx(x)} y={f.sy(0) + fs + 2} textAnchor="middle" fontSize={fs} fontFamily={MONO} fill={INK} fillOpacity={0.5}>
            {x < 0 ? `−${-x}` : x}
          </text>
        ))}
      {nums &&
        [2, 4].filter((y) => y < f.y1).map((y) => (
          <text key={`y${y}`} x={f.sx(0) - f.u * 0.35} y={f.sy(y) + fs * 0.35} textAnchor="end" fontSize={fs} fontFamily={MONO} fill={INK} fillOpacity={0.5}>
            {y}
          </text>
        ))}
    </g>
  );
}

/** clip to the frame (WallBed's door and plinth hang below a frame that stops above y = −2) */
function O_Clip({ f, children }: { f: Frame; children: ReactNode }) {
  const id = `oc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={0} y={0} width={f.W} height={f.H} rx={6} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

/** The wall on a Plane: lime, chalk grid, a night shade `dim` (0…1), the post, then the light. */
function O_Wall({ f = OF, label, dim = 0, width = "max-w-[22rem]", door = true, children }: { f?: Frame; label: string; dim?: number; width?: string; door?: boolean; children?: ReactNode }) {
  return (
    <Plane f={f} grid={0} axes={false} paper={false} label={label} className={`my-0! ${width}`}>
      <O_Clip f={f}>
        <WallBed f={f} door={door} />
      </O_Clip>
      <O_Grid f={f} nums={f.u >= 18} />
      {dim > 0 && <rect x={0} y={0} width={f.W} height={f.H} rx={6} fill="#0f172a" opacity={dim} className="pointer-events-none" />}
      <Post f={f} />
      {children}
    </Plane>
  );
}

/** a flower of light: five petals round c, carried by `move` (so it leans and widens with the grid) */
const PETALS: XY[] = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * 2 * Math.PI;
  const r = 0.28 + 0.34 * Math.abs(Math.cos(2.5 * a));
  return [Math.cos(a) * r, Math.sin(a) * r];
});
function O_Flower({ f, c = FLOWER, move = (p) => p, ghost = false, tone = "#f59e0b" }: { f: Frame; c?: XY; move?: Move; ghost?: boolean; tone?: string }) {
  const pts = PETALS.map(([x, y]) => [c[0] + x, c[1] + y] as XY);
  const m = move(c);
  const d = pathOf(f, move, pts, true);
  if (ghost) return <path d={d} fill="none" stroke={tone} strokeWidth={1.4} strokeDasharray="3 2" className="pointer-events-none" />;
  return (
    <g className="pointer-events-none">
      <path d={d} fill="#fde047" fillOpacity={0.35} stroke="#fde047" strokeOpacity={0.5} strokeWidth={4} />
      <path d={d} fill="#fbbf24" fillOpacity={0.85} stroke={tone} strokeWidth={1.1} />
      <circle cx={f.sx(m[0])} cy={f.sy(m[1])} r={Math.max(1.6, f.u * 0.1)} fill="#b45309" />
    </g>
  );
}

/** The machine's light on the wall: the grid and the flower, both carried by `move`. */
function O_Light({ f = OF, move, c = FLOWER, flower = true }: { f?: Frame; move: Move; c?: XY; flower?: boolean }) {
  return (
    <>
      <LightGrid f={f} move={move} x0={Math.ceil(f.x0)} x1={Math.floor(f.x1)} y0={Math.ceil(f.y0)} y1={Math.floor(f.y1)} />
      {flower && <O_Flower f={f} c={c} move={move} />}
    </>
  );
}

/** a ring where the flower stopped, with its spot written beside it */
function O_Ring({ f = OF, at, tone, r = 9, label = true, dy = -12 }: { f?: Frame; at: XY; tone: string; r?: number; label?: boolean; dy?: number }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  const t = `(${at.map((v) => (v < 0 ? `−${-v}` : v)).join(", ")})`;
  return (
    <g className={`${POP} pointer-events-none`}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={tone} strokeWidth={2} />
      {label && (
        <g>
          <rect x={x - t.length * 3.1 - 3} y={y + dy - 8} width={t.length * 6.2 + 6} height={12} rx={3} fill="white" fillOpacity={0.9} />
          <text x={x} y={y + dy + 1.5} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={tone}>
            {t}
          </text>
        </g>
      )}
    </g>
  );
}

/** the lens as a picture: the unit square, and where the lens throws it */
function O_LensIcon({ lens, size = 26 }: { lens: Lens; size?: number }) {
  const m = byCols(lens.cols);
  const pts: XY[] = [[0, 0], [1, 0], [1, 1], [0, 1]].map((p) => m(p as XY));
  const s = 5.2;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${13 + p[0] * s} ${13 - p[1] * s}`).join("") + "Z";
  return (
    <svg viewBox="0 0 26 26" width={size} height={size} aria-hidden="true" className="shrink-0">
      <circle cx={13} cy={13} r={12} fill="white" stroke={lens.hex} strokeWidth={1.6} />
      <path d={`M13 13h${s}v${-s}h${-s}Z`} fill="none" stroke="#94a3b8" strokeWidth={0.8} strokeDasharray="1.5 1" />
      <path d={d} fill={lens.hex} fillOpacity={0.3} stroke={lens.hex} strokeWidth={1.2} strokeLinejoin="round" />
      <circle cx={13} cy={13} r={1} fill={INK} />
    </svg>
  );
}

/** a lens name with its picture */
function O_LensTag({ lens, className = "" }: { lens: Lens; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <O_LensIcon lens={lens} size={20} />
      <span className="font-semibold" style={{ color: lens.hex }}>
        {lens.name}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// The machine's slot seen from the side: the wall at the left, the bulb at the
// right, two lenses between them. Light leaves the bulb and goes through the
// back lens (by the bulb) first, then the front one, then hits the wall.

const BR_X = { front: 112, back: 188 } as const;

function O_Barrel({
  back,
  front,
  t = -1,
  onSlot,
  hot,
}: {
  back: Lens | null;
  front: Lens | null;
  /** light's progress 0 → 2 (−1: off) */
  t?: number;
  onSlot?: (slot: 0 | 1) => void;
  /** the slot to highlight (a lens is ready to go in) */
  hot?: boolean;
}) {
  const lit = t < 0 ? 0 : Math.min(1, t / 2 + 0.08);
  const x0 = 270 - lit * (270 - 18);
  const lensAt = (lens: Lens | null, x: number, slot: 0 | 1) => {
    const empty = !lens;
    const body = (
      <g>
        <ellipse cx={x} cy={30} rx={9} ry={19} fill={empty ? "#1e293b" : lens.hex} fillOpacity={empty ? 1 : 0.55} stroke={empty ? (hot ? "#60a5fa" : "#94a3b8") : lens.hex} strokeWidth={empty && hot ? 2 : 1.4} strokeDasharray={empty ? "3 2" : undefined} />
        {!empty && <ellipse cx={x - 3} cy={24} rx={2} ry={6} fill="white" opacity={0.5} />}
        <text x={x} y={62} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={empty ? "#64748b" : lens.hex}>
          {empty ? "খালি" : lens.name}
        </text>
      </g>
    );
    if (!onSlot) return body;
    return (
      <g
        role="button"
        tabIndex={0}
        aria-label={`${slot === 0 ? "খোপ, bulb এর পাশে" : "খোপের সামনে"}: ${lens ? lens.name : "খালি"}`}
        className="cursor-pointer"
        onClick={() => onSlot(slot)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSlot(slot);
          }
        }}
      >
        <rect x={x - 22} y={4} width={44} height={62} fill="transparent" />
        {body}
      </g>
    );
  };
  return (
    <svg viewBox="0 0 300 66" className="mx-auto mt-1.5 block h-auto w-full max-w-[18rem]" role="img" aria-label={`যন্ত্রের খোপ, পাশ থেকে: বামে দেয়াল, ডানে bulb; bulb এর পাশে ${back ? back.name : "খালি"}, সামনে ${front ? front.name : "খালি"}`}>
      {/* the wall */}
      <rect x={6} y={4} width={12} height={52} rx={2} fill={LIME} stroke="#a8a29e" />
      <text x={12} y={63} textAnchor="middle" fontSize={8} fill="#64748b">
        দেয়াল
      </text>
      {/* the barrel */}
      <rect x={70} y={14} width={186} height={32} rx={6} fill="#334155" />
      {/* the light */}
      {lit > 0 && <rect x={x0} y={25} width={270 - x0} height={10} rx={5} fill="#fde047" opacity={0.75} className="pointer-events-none" />}
      {lensAt(front, BR_X.front, 1)}
      {lensAt(back, BR_X.back, 0)}
      <text x={BR_X.front} y={8} textAnchor="middle" fontSize={7.5} fill="#64748b">
        সামনে
      </text>
      <text x={BR_X.back} y={8} textAnchor="middle" fontSize={7.5} fill="#64748b">
        খোপ
      </text>
      {/* the bulb */}
      <circle cx={272} cy={30} r={11} fill={t >= 0 ? "#fde047" : "#e5e7eb"} stroke="#78716c" strokeWidth={1.2} />
      <path d="M268 30q4 -6 8 0" fill="none" stroke="#78716c" strokeWidth={1} />
      <text x={272} y={62} textAnchor="middle" fontSize={8.5} fill="#64748b">
        bulb
      </text>
    </svg>
  );
}

const TONE = { a: "#d97706", b: "#0d9488" } as const;

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Tonight's picture on the wall, the two lenses in the
//     slot. The reader picks what the other order gives, and seals. The bet is
//     acted out: the lenses swap in the slot, the wall goes dark, and the pick
//     is drawn on it with a "?". Never marked.

const X1_OPTS = ["একই ছবি. Order এ কিছু আসে যায় না.", "অন্য ছবি, সবসময়.", "কোন দুইটা lens, তার উপর নির্ভর করে."];

function X1_Icon({ i }: { i: number }) {
  const fl = (x: number, y: number, dash = false) => <circle cx={x} cy={y} r={5} fill={dash ? "none" : "#fbbf24"} stroke="#d97706" strokeWidth={1.2} strokeDasharray={dash ? "2 1.5" : undefined} />;
  return (
    <svg viewBox="0 0 60 30" className="h-7 w-auto shrink-0" aria-hidden="true">
      <rect x={0} y={0} width={60} height={30} rx={3} fill={LIME} stroke="#a8a29e" />
      {fl(18, 15)}
      {i === 0 && fl(18, 15, true)}
      {i === 0 && <path d="M30 12h8M30 17h8" stroke={INK} strokeWidth={1.4} />}
      {i === 1 && <path d="M30 12h8M30 17h8M36 9l-4 11" stroke={INK} strokeWidth={1.4} />}
      {i === 1 && fl(48, 12, true)}
      {i === 2 && (
        <text x={42} y={20} textAnchor="middle" fontSize={13} fontWeight={800} fill="#2563eb">
          ?
        </text>
      )}
    </svg>
  );
}

export function OrderBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(800);
  const k = !sealed ? 0 : act.running ? act.k : 3;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(3, () => pass("বাজি সিল হলো. আগে হলুদ আর গোসল."));
  };
  const end = apply(DS, FLOWER);
  return (
    <>
      <O_Wall label="দেয়ালে আপার পছন্দের ছবি, S খোপে আর D সামনে: আলোর grid আর ফুল (10, 3) এ; lens উল্টালে কী হবে, প্রশ্নবোধক" dim={k >= 2 ? 0.55 : 0}>
        {k < 2 && <O_Light move={byCols(DS)} />}
        {k >= 2 && <O_Flower f={OF} move={byCols(DS)} ghost />}
        {k >= 3 && bet === 0 && (
          <text x={OF.sx(end[0]) + 12} y={OF.sy(end[1]) - 8} fontSize={18} fontWeight={800} fill="#60a5fa" className={POP}>
            ?
          </text>
        )}
        {k >= 3 && bet !== null && bet >= 1 && (
          <g className={POP}>
            <path d={`M${OF.sx(end[0]) - 10} ${OF.sy(end[1]) - 6}Q${OF.sx(6)} ${OF.sy(5.1)} ${OF.sx(3.4)} ${OF.sy(4.5)}`} fill="none" stroke="#60a5fa" strokeWidth={1.6} strokeDasharray="4 3" />
            <text x={OF.sx(2.5)} y={OF.sy(4.1)} fontSize={18} fontWeight={800} fill="#60a5fa">
              ?
            </text>
            {bet === 2 && (
              <text x={OF.sx(end[0]) + 12} y={OF.sy(end[1]) - 8} fontSize={18} fontWeight={800} fill="#60a5fa">
                ?
              </text>
            )}
          </g>
        )}
      </O_Wall>
      <O_Barrel back={k >= 1 ? L_D : L_S} front={k >= 1 ? L_S : L_D} t={k >= 2 ? -1 : 2} />
      <div className="mt-2 grid gap-1.5">
        {X1_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex items-center gap-2 text-sm leading-tight">
              <X1_Icon i={i} />
              {o}
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={bet === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 3}>Lens দুইটার order উল্টালে দেয়ালের ছবি কী হয়? একটা বেছে নিয়ে বাজি সিল করুন. উত্তর শেষে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Swap the lenses. The flower (2, 3) through হেলানো then চওড়া: (5, 3), then
//     (10, 3). Swapped: (4, 3), then (7, 3). The whole light grid leans
//     differently too. Both spots stay marked; then the two one-lens cards.

const X2_ORDERS: [Lens, Lens][] = [
  [L_S, L_D],
  [L_D, L_S],
];
const X2_MID = X2_ORDERS.map(([a]) => apply(a.cols, FLOWER));
const X2_END = X2_ORDERS.map(([a, b]) => apply(thenCols(a.cols, b.cols), FLOWER));

export function SwapLenses() {
  const pass = useGate();
  const [order, setOrder] = useSeed<0 | 1>("order", 0);
  const [done, setDone] = useSeed<boolean[]>("done", [false, false]);
  const run = useLensRun(2400, 48);
  const [a, b] = X2_ORDERS[order];
  const T = run.running ? run.t * 2 : done[order] ? 2 : 0;
  const go = () => {
    if (run.running || done[order]) return;
    run.run(() => {
      const nd = done.map((v, i) => v || i === order);
      setDone(nd);
      if (nd.every(Boolean)) pass("Lens উল্টালে ছবি বদলায়: AB ≠ BA.");
    });
  };
  const swap = () => {
    if (run.running) return;
    setOrder(order === 0 ? 1 : 0);
  };
  const tone = order === 0 ? TONE.a : TONE.b;
  return (
    <>
      <O_Wall label="দেয়ালে আলোর grid আর ফুল; lens দুইটার ভেতর দিয়ে গেলে ফুল সরে; দুই order এ দুই জায়গা">
        <O_Light move={twoStep(a.cols, b.cols, T)} />
        {[0, 1].map((i) =>
          done[i] ? (
            <g key={i}>
              <circle cx={OF.sx(X2_MID[i][0])} cy={OF.sy(X2_MID[i][1])} r={3} fill={i === 0 ? TONE.a : TONE.b} opacity={0.7} />
              <O_Ring at={X2_END[i]} tone={i === 0 ? TONE.a : TONE.b} dy={i === 0 ? -13 : 17} />
            </g>
          ) : null,
        )}
        {run.running && T >= 1 && <circle cx={OF.sx(X2_MID[order][0])} cy={OF.sy(X2_MID[order][1])} r={3} fill={tone} className={POP} />}
      </O_Wall>
      <O_Barrel back={a} front={b} t={run.running || done[order] ? T : -1} />
      <div className="mt-2 flex justify-center gap-2">
        <button type="button" className={primaryBtn} disabled={run.running || done[order]} onClick={go}>
          চালান
        </button>
        <button type="button" className={quietBtn} disabled={run.running || !(done[0] || done[1])} onClick={swap}>
          lens অদলবদল
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className={`rounded-lg border px-1 py-1 text-center ${done[i] ? "border-border" : "border-dashed border-border opacity-50"}`}>
            <div className="text-xs" style={{ color: i === 0 ? TONE.a : TONE.b }}>
              আগে {X2_ORDERS[i][0].name}
            </div>
            {done[i] ? (
              <div className={FADE}>
                <div className="font-mono text-sm font-bold">
                  <Tup v={X2_END[i]} of={WALL_SLOTS} />
                </div>
                {done[0] && done[1] && <LensCard cols={i === 0 ? DS : SD} small name={<span className="text-xs text-muted">এক lens এ</span>} />}
              </div>
            ) : (
              <div className="text-sm text-muted">?</div>
            )}
          </div>
        ))}
      </div>
      <Task done={done[0] && done[1]}>যন্ত্র চালান, ফুল কোথায় থামে দেখুন. তারপর lens দুইটা অদলবদল করে আবার চালান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict: Samin's app writes the one lens as D S, and its preview puts
//     the flower on the star, (10, 3). Which lens gets the light first? The
//     pick goes by the bulb and the light runs; D first lands on (7, 3), three
//     squares short, with a red gap; S first lands on the star.

const X3_OPTS: [Lens, Lens][] = [
  [L_D, L_S],
  [L_S, L_D],
];
const X3_RIGHT = 1;
const X3_STAR = apply(DS, FLOWER);

export function WhichFirst() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(2200, 44);
  const choose = (i: number) => {
    if (run.running || (ran && pick === X3_RIGHT)) return;
    setPick(i);
    setRan(false);
    run.run(() => {
      setRan(true);
      if (i === X3_RIGHT) pass("DSv তে v এর পাশের S আগে: ডান থেকে বাম.");
      else setMiss((m) => m + 1);
    });
  };
  const T = run.running ? run.t * 2 : ran ? 2 : 0;
  const pair = pick === null ? null : X3_OPTS[pick];
  const land = pair ? apply(thenCols(pair[0].cols, pair[1].cols), FLOWER) : null;
  const over = ran && !run.running;
  return (
    <>
      <div className="mb-2 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted">সামিনের app:</span>
        <span className="font-mono font-bold">
          <span style={{ color: L_D.hex }}>D</span> <span style={{ color: L_S.hex }}>S</span>
        </span>
        <span className="text-muted">=</span>
        <LensCard cols={DS} small />
      </div>
      <O_Wall label="App এর হিসাবে ফুল যাবে তারার জায়গায়, (10, 3); যে lens আগে বেছে নেবেন, আলো আগে সেটায় ঢুকবে">
        <O_Light move={pair ? twoStep(pair[0].cols, pair[1].cols, T) : (p) => p} />
        <Star f={OF} at={X3_STAR} done={over && pick === X3_RIGHT} />
        {over && land && pick !== X3_RIGHT && (
          <g className={POP}>
            <path d={`M${OF.sx(land[0])} ${OF.sy(land[1])}H${OF.sx(X3_STAR[0])}`} stroke="#e11d48" strokeWidth={2.2} strokeDasharray="4 3" />
            <O_Ring at={land} tone="#e11d48" dy={17} />
          </g>
        )}
      </O_Wall>
      <O_Barrel back={pair ? pair[0] : null} front={pair ? pair[1] : null} t={pair && (run.running || ran) ? T : -1} />
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X3_OPTS.map(([first], i) => (
          <Choice key={first.key} n={i} look={pick === i && over ? (i === X3_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={run.running || (over && pick === X3_RIGHT)} onClick={() => choose(i)}>
            <span className="flex flex-col gap-0.5 text-sm leading-tight">
              <span>
                আগে <span className="font-mono font-bold" style={{ color: first.hex }}>{first.tag}</span>
              </span>
              <O_LensTag lens={first} className="text-xs" />
            </span>
          </Choice>
        ))}
      </div>
      {over && pick !== null && pick !== X3_RIGHT && (
        <Nope key={miss}>আগে চওড়া দিলে ফুল থামলো (7, 3) এ. তারা থেকে 3 ঘর বামে. App এর DS এর আলো তাহলে আগে অন্যটায় ঢোকে.</Nope>
      )}
      <Task done={over && pick === X3_RIGHT}>App এ লেখা D S. আলো আগে কোন lens এ ঢুকলে ফুল তারায় পড়ে? বেছে নিন, যন্ত্র চালিয়ে দেখাবে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Nasib's pair: a 90° turn and a doubling. The flower now at (2, 1)
//     (the helper lowered it so the doubled flower stays on the wall). Both
//     orders land on (−2, 4), the whole grid the same.

const X4_FLOWER: XY = [2, 1];
const X4_ORDERS: [Lens, Lens][] = [
  [L_R, L_2],
  [L_2, L_R],
];
const X4_END = apply(thenCols(L_R.cols, L_2.cols), X4_FLOWER); // (−2, 4)
const X4_ONE = thenCols(L_R.cols, L_2.cols);

export function TurnAndDouble() {
  const pass = useGate();
  const [order, setOrder] = useSeed<0 | 1>("order", 0);
  const [done, setDone] = useSeed<boolean[]>("done", [false, false]);
  const [ran, setRan] = useSeed("ran", false);
  const run = useLensRun(2200, 44);
  const go = (i: 0 | 1) => {
    if (run.running) return;
    setOrder(i);
    setRan(false);
    run.run(() => {
      setRan(true);
      const nd = done.map((v, j) => v || j === i);
      setDone(nd);
      if (nd.every(Boolean)) pass("এই জোড়ায় order লাগে না. সব জোড়ায় না.");
    });
  };
  const [a, b] = X4_ORDERS[order];
  const T = run.running ? run.t * 2 : ran ? 2 : 0;
  return (
    <>
      <O_Wall label="ফুল (2, 1) এ; আগে ঘোরানো তারপর দ্বিগুণ, বা উল্টা; দুইভাবেই ফুল (−2, 4) এ">
        <O_Light move={twoStep(a.cols, b.cols, T)} c={X4_FLOWER} />
        {done[0] && <O_Ring at={X4_END} tone={TONE.a} r={9} label={!done[1]} />}
        {done[1] && <O_Ring at={X4_END} tone={TONE.b} r={13} dy={-16} />}
      </O_Wall>
      <O_Barrel back={a} front={b} t={run.running || ran ? T : -1} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        {X4_ORDERS.map(([first], i) => (
          <button key={first.key} type="button" className={`${done[i] ? quietBtn : primaryBtn} justify-center px-2 text-sm`} disabled={run.running} onClick={() => go(i as 0 | 1)}>
            আগে {first.name}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className={`text-center ${done[i] ? "" : "opacity-40"}`}>
            <div className="text-xs" style={{ color: i === 0 ? TONE.a : TONE.b }}>
              আগে {X4_ORDERS[i][0].name}
            </div>
            <div className="font-mono text-sm font-bold">{done[i] ? <Tup v={X4_END} of={WALL_SLOTS} /> : "?"}</div>
          </div>
        ))}
      </div>
      {done[0] && done[1] && (
        <div className={`${FADE} mt-1 flex items-center justify-center gap-2 text-sm text-muted`}>
          দুইভাবেই এক lens: <LensCard cols={X4_ONE} small />
        </div>
      )}
      <Task done={done[0] && done[1]}>দুই order এই চালান. ফুল কোথায় থামে, grid কেমন হেলে, মিলিয়ে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The dark wall. বাড়তি 1 = [[1, 0], [0, 0]] keeps only ডান-বাম: the light
//     lies on the pin's row. বাড়তি 2 = [[0, 0], [0, 1]] keeps only উপর-নিচ:
//     the light stands on the post. Both: the wall goes dark, one dot on the
//     pin. Both singles first, then together.

type X5_Mode = 0 | 1 | 2;
const X5_RUN: Record<X5_Mode, [Cols, Cols]> = {
  0: [L_K1.cols, ID],
  1: [L_K2.cols, ID],
  2: [L_K2.cols, L_K1.cols],
};
const X5_WHERE = ["সব আলো পেরেকের সারিতে, শোয়ানো লাইনে.", "সব আলো খুঁটির উপর, খাড়া লাইনে.", "দেয়াল অন্ধকার. আলো শুধু পেরেকে."];

export function DarkWall() {
  const pass = useGate();
  const [mode, setMode] = useSeed<X5_Mode | null>("mode", null);
  const [tried, setTried] = useSeed<boolean[]>("tried", [false, false, false]);
  const [ran, setRan] = useSeed("ran", false);
  const run = useLensRun(2000, 40);
  const go = (m: X5_Mode) => {
    if (run.running) return;
    setMode(m);
    setRan(false);
    run.run(() => {
      setRan(true);
      const nt = tried.map((v, i) => v || i === m);
      setTried(nt);
      if (m === 2) pass("দুইটাই কিছু রাখে, একসাথে কিছুই না.");
    });
  };
  const span = mode === 2 ? 2 : 1;
  const T = mode === null ? 0 : run.running ? run.t * span : ran ? span : 0;
  const [a, b] = mode === null ? [ID, ID] : X5_RUN[mode];
  const dim = mode === 2 ? 0.6 * Math.min(1, Math.max(0, T - 1)) : 0;
  const settled = ran && !run.running && mode !== null;
  const both = tried[0] && tried[1];
  return (
    <>
      <O_Wall label="বাড়তি lens দুইটা: একটা সব আলো পেরেকের সারিতে ফেলে, একটা খুঁটিতে; দুইটা একসাথে: শুধু পেরেক" dim={dim}>
        <O_Light move={twoStep(a, b, T)} />
        {settled && mode === 2 && (
          <g className={POP}>
            <LitRegion f={OF} cols={[[0, 0], [0, 0]]} />
          </g>
        )}
      </O_Wall>
      <O_Barrel back={mode === null ? null : mode === 0 ? L_K1 : L_K2} front={mode === 2 ? L_K1 : null} t={mode !== null && (run.running || ran) ? T : -1} />
      <div className="mt-1 h-5 text-center text-sm">{settled && mode !== null && <span key={mode} className={`${FADE} ${mode === 2 ? "font-semibold text-danger" : "text-muted"}`}>{X5_WHERE[mode]}</span>}</div>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {([0, 1] as const).map((m) => (
          <button key={m} type="button" className={`${tried[m] ? quietBtn : primaryBtn} h-auto justify-center px-1 py-2 text-sm leading-tight`} disabled={run.running} onClick={() => go(m)}>
            শুধু {m === 0 ? L_K1.name : L_K2.name}
          </button>
        ))}
        <button type="button" className={`${primaryBtn} h-auto justify-center px-1 py-2 text-sm leading-tight`} disabled={run.running || !both} onClick={() => go(2)}>
          দুইটা একসাথে
        </button>
      </div>
      <div className="mt-2 flex items-center justify-center gap-3 text-xs text-muted">
        <LensCard cols={L_K1.cols} small name={L_K1.name} />
        <LensCard cols={L_K2.cols} small name={L_K2.name} />
      </div>
      <Task done={tried[2]}>আগে বাড়তি 1, তারপর বাড়তি 2, একটা একটা করে. তারপর দুইটা একসাথে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn. Four pairs. For each the reader says "order লাগে" or "লাগে
//     না"; then both orders run side by side on two small walls. A wrong
//     verdict leaves both walls showing and asks again.

const SF = makeFrame(-4, 6, -2, 5, 13, 5); // 140 × 101

const X6_PAIRS: { a: Lens; b: Lens; c: XY; same: boolean }[] = [
  { a: L_S, b: L_M, c: [1, 2], same: false },
  { a: L_R, b: L_2, c: [2, 1], same: true },
  { a: L_T, b: L_S, c: [1, 1], same: false },
  { a: L_K1, b: L_K2, c: [2, 3], same: true },
];
const X6_NOPE = [
  "দুই দেয়ালে ফুল দুই জায়গায়. আগে হেলালে (−3, 2), আগে আয়না দিলে (1, 2).",
  "দুই দেয়ালে ফুল একই জায়গায়, (−2, 4). দ্বিগুণ lens আগে পরে একই.",
  "দুই দেয়ালে ফুল দুই জায়গায়: (3, 2) আর (2, 2). Grid ও আলাদা হেলে আছে.",
  "দুই দেয়ালই অন্ধকার, আলো শুধু পেরেকে. দুই order এই একই.",
];

function X6_Mini({ a, b, c, T, tone, title }: { a: Lens; b: Lens; c: XY; T: number; tone: string; title: string }) {
  const end = apply(thenCols(a.cols, b.cols), c);
  const dark = a.cols.every((v) => v[0] === 0 && v[1] === 0) || thenCols(a.cols, b.cols).every((v) => v[0] === 0 && v[1] === 0);
  return (
    <div className="min-w-0">
      <div className="mb-0.5 text-center text-xs" style={{ color: tone }}>
        {title}
      </div>
      <O_Wall f={SF} label={title} width="max-w-none" door={false} dim={dark ? 0.5 * Math.min(1, Math.max(0, T - 1)) : 0}>
        <O_Light f={SF} move={twoStep(a.cols, b.cols, T)} c={c} />
        {T >= 2 && <O_Ring f={SF} at={end} tone={tone} r={7} label={false} />}
      </O_Wall>
    </div>
  );
}

export function YourOrders() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [said, setSaid] = useSeed<0 | 1 | null>("said", null);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(2000, 40);
  const fin = at >= X6_PAIRS.length;
  const i = Math.min(at, X6_PAIRS.length - 1);
  const p = X6_PAIRS[i];
  const right = p.same ? 1 : 0;
  const T = fin ? 2 : run.running ? run.t * 2 : ran ? 2 : 0;
  const tell = (v: 0 | 1) => {
    if (run.running || fin || ran) return;
    setSaid(v);
    run.run(() => {
      setRan(true);
      if (v !== right) setMiss((m) => m + 1);
      else if (at === X6_PAIRS.length - 1) {
        setAt(X6_PAIRS.length);
        pass("Order লাগে কি না, চালিয়েই দেখতে হয়.");
      }
    });
  };
  const next = () => {
    setAt(at + 1);
    setSaid(null);
    setRan(false);
  };
  const again = () => {
    setSaid(null);
    setRan(false);
  };
  const over = ran && !run.running;
  const look = (v: 0 | 1): Look => (said === v ? (over ? (v === right ? "right" : "wrong") : "picked") : said !== null ? "dim" : "idle");
  return (
    <>
      <div className="mb-1 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted">জোড়া {i + 1}/4:</span>
        <O_LensTag lens={p.a} />
        <span className="text-muted">আর</span>
        <O_LensTag lens={p.b} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <X6_Mini a={p.a} b={p.b} c={p.c} T={T} tone={TONE.a} title={`আগে ${p.a.name}`} />
        <X6_Mini a={p.b} b={p.a} c={p.c} T={T} tone={TONE.b} title={`আগে ${p.b.name}`} />
      </div>
      {!fin && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["order লাগে", "order লাগে না"] as const).map((t, v) => (
            <button
              key={t}
              type="button"
              disabled={run.running || ran}
              onClick={() => tell(v as 0 | 1)}
              className={`cursor-pointer rounded-xl border-2 px-2 py-2 text-sm font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look(v as 0 | 1)]}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {over && !fin && said !== null && said !== right && <Nope key={miss}>{X6_NOPE[i]}</Nope>}
      <div className="mt-2 flex justify-center">
        {over && !fin && said === right && (
          <button type="button" className={primaryBtn} onClick={next}>
            পরের জোড়া
          </button>
        )}
        {over && !fin && said !== right && (
          <button type="button" className={quietBtn} onClick={again}>
            আবার বলুন
          </button>
        )}
        {fin && <div className={`${FADE} text-sm font-semibold text-accent-text`}>চারটা জোড়াই হলো. দুইটায় order লাগে, দুইটায় লাগে না.</div>}
      </div>
      <Task done={fin}>প্রতিটা জোড়ায় বলুন, order লাগে, নাকি লাগে না. যন্ত্র দুই order এই চালিয়ে দেখাবে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it. The app says S R (হেলানো, ঘোরানো); flower (2, 1). Three wall
//     pictures: R then S (right, (1, 2)), S then R ((−1, 3)), R alone
//     ((−1, 2)). A pick plays how that picture came about on the big wall.

const TF = makeFrame(-3, 4, -1, 4, 11, 4); // 85 × 63
const X7_FLOWER: XY = [2, 1];
const X7_OPTS: { first: Lens; second: Lens | null }[] = [
  { first: L_S, second: L_R },
  { first: L_R, second: L_S },
  { first: L_R, second: null },
];
const X7_RIGHT = 1;
const X7_NOPE = [
  "এই ছবি আসে আগে হেলিয়ে, তারপর ঘুরিয়ে. লিখলে সেটা R S. App এ লেখা S R: ডানে R.",
  "",
  "এখানে শুধু ঘোরানো হলো. হেলানো lens টা আলো পেলোই না. দুইটা lens ই আলোর পথে আছে.",
];
const x7Cols = (o: { first: Lens; second: Lens | null }) => [o.first.cols, o.second ? o.second.cols : ID] as [Cols, Cols];

function X7_Pic({ i }: { i: number }) {
  const [a, b] = x7Cols(X7_OPTS[i]);
  const m = twoStep(a, b, 2);
  return (
    <svg viewBox={`0 0 ${TF.W} ${TF.H}`} className="block h-auto w-full" aria-hidden="true">
      <WallBed f={TF} door={false} window={false} tree={false} />
      <O_Grid f={TF} nums={false} />
      <Post f={TF} />
      <O_Light f={TF} move={m} c={X7_FLOWER} />
    </svg>
  );
}

export function TryWhichWall() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(2200, 44);
  const choose = (i: number) => {
    if (run.running || (ran && pick === X7_RIGHT)) return;
    setPick(i);
    setRan(false);
    run.run(() => {
      setRan(true);
      if (i === X7_RIGHT) pass("S R এ আগে R: ডানেরটা আগে কাজ করে.");
      else setMiss((m) => m + 1);
    });
  };
  const o = pick === null ? null : X7_OPTS[pick];
  const T = run.running ? run.t * 2 : ran ? 2 : 0;
  const [a, b] = o ? x7Cols(o) : [ID, ID];
  const over = ran && !run.running;
  const look = (i: number): Look => (pick === i && over ? (i === X7_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle");
  return (
    <>
      <div className="mb-2 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted">App এ:</span>
        <span className="font-mono font-bold">
          <span style={{ color: L_S.hex }}>S</span> <span style={{ color: L_R.hex }}>R</span>
        </span>
        <O_LensTag lens={L_S} className="text-xs" />
        <O_LensTag lens={L_R} className="text-xs" />
      </div>
      <O_Wall label="ফুল (2, 1) এ; বেছে নেওয়া ছবিটা কোন order এ আসে, দেয়ালে চলে">
        <O_Light move={twoStep(a, b, T)} c={X7_FLOWER} />
      </O_Wall>
      <div className="mt-1 h-5 text-center text-sm text-muted">
        {o && (
          <span key={pick} className={FADE}>
            এই ছবি: আগে <span style={{ color: o.first.hex }}>{o.first.name}</span>
            {o.second ? (
              <>
                , তারপর <span style={{ color: o.second.hex }}>{o.second.name}</span>
              </>
            ) : (
              ", আর কিছু না"
            )}
          </span>
        )}
      </div>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {X7_OPTS.map((_, i) => (
          <button
            key={i}
            type="button"
            disabled={run.running || (over && pick === X7_RIGHT)}
            onClick={() => choose(i)}
            aria-label={`ছবি ${String.fromCharCode(65 + i)}`}
            className={`cursor-pointer rounded-xl border-2 p-1 transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look(i)]}`}
          >
            <div className="mb-0.5 text-xs font-semibold">{String.fromCharCode(65 + i)}</div>
            <X7_Pic i={i} />
          </button>
        ))}
      </div>
      {over && pick !== null && pick !== X7_RIGHT && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={over && pick === X7_RIGHT}>App এ লেখা S R. দেয়ালে কোন ছবিটা উঠবে? বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The helper fits them. Two empty slots, bulb on the right; the reader
//     picks a lens, then a slot. Run: the light goes through the bulb-side
//     lens first. আপার ছবি (tonight's, flower at (10, 3)) is the dashed target.

const X8_LENSES = [L_S, L_D];

export function HelperFits() {
  const pass = useGate();
  const [slots, setSlots] = useSeed<(string | null)[]>("slots", [null, null]);
  const [sel, setSel] = useSeed<string | null>("sel", null);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const run = useLensRun(2200, 44);
  const lensOf = (k: string | null) => X8_LENSES.find((l) => l.key === k) ?? null;
  const back = lensOf(slots[0]);
  const front = lensOf(slots[1]);
  const right = slots[0] === "S" && slots[1] === "D";
  const onSlot = (s: 0 | 1) => {
    if (run.running || ran) return;
    const ns = [...slots];
    if (sel) {
      const other = ns.indexOf(sel);
      if (other >= 0) ns[other] = null;
      ns[s] = sel;
      setSel(null);
    } else ns[s] = null;
    setSlots(ns);
  };
  const go = () => {
    if (!back || !front || run.running) return;
    run.run(() => {
      setRan(true);
      if (right) pass("আগে যেটা, সেটা খোপে. লেখায় ডানে.");
      else setMiss((m) => m + 1);
    });
  };
  const reset = () => {
    setSlots([null, null]);
    setRan(false);
    setSel(null);
  };
  const T = run.running ? run.t * 2 : ran ? 2 : 0;
  const lit = back && front && (run.running || ran);
  const over = ran && !run.running;
  const land = back && front ? apply(thenCols(back.cols, front.cols), FLOWER) : null;
  return (
    <>
      <O_Wall label="আপার ছবি: ফুল (10, 3) এ, দাগ দিয়ে আঁকা; lens দুইটা খোপে বসিয়ে যন্ত্র চালান" dim={lit ? 0 : 0.35}>
        {lit ? <O_Light move={twoStep(back.cols, front.cols, T)} /> : null}
        <O_Flower f={OF} move={byCols(DS)} ghost tone="#db2777" />
        <text x={OF.sx(10)} y={OF.sy(4.2)} textAnchor="middle" fontSize={9} fontWeight={700} fill="#db2777">
          আপার ছবি
        </text>
        {over && land && !right && <O_Ring at={land} tone="#e11d48" dy={17} />}
      </O_Wall>
      <O_Barrel back={back} front={front} t={lit ? T : -1} onSlot={onSlot} hot={!!sel} />
      <div className="mt-2 flex items-center justify-center gap-2">
        {X8_LENSES.map((l) => {
          const placed = slots.includes(l.key);
          return (
            <button
              key={l.key}
              type="button"
              disabled={run.running || ran}
              onClick={() => setSel(sel === l.key ? null : l.key)}
              className={`cursor-pointer rounded-xl border-2 px-2.5 py-1.5 text-sm transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[sel === l.key ? "picked" : placed ? "dim" : "idle"]}`}
            >
              <O_LensTag lens={l} />
            </button>
          );
        })}
        {!over ? (
          <button type="button" className={primaryBtn} disabled={!back || !front || run.running} onClick={go}>
            চালান
          </button>
        ) : (
          !right && (
            <button type="button" className={quietBtn} onClick={reset}>
              খুলে আবার
            </button>
          )
        )}
      </div>
      {over && !right && (
        <Nope key={miss}>
          আলো আগে ঢুকলো {back?.name} lens এ, ওটা bulb এর পাশে. ফুল থামলো ({land?.[0]}, {land?.[1]}) এ. আপার ছবি (10, 3) এ.
        </Nope>
      )}
      <Task done={over && right}>একটা lens বেছে নিন, তারপর খোপে বা সামনে tap করুন. দুইটা বসলে চালান. দেয়ালে আপার ছবি উঠতে হবে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The bet opened, card by card. Two small walls hold the evidence: the
//     হেলানো + চওড়া pair lands on two spots; the ঘোরানো + দ্বিগুণ pair on one.

const X9_CARDS: [string, boolean, string][] = [
  ["একই ছবি. Order এ কিছু আসে যায় না.", false, "হেলানো আর চওড়া উল্টালে ফুল (10, 3) থেকে গেলো (7, 3) এ."],
  ["অন্য ছবি, সবসময়.", false, "ঘোরানো আর দ্বিগুণ: দুই order এই ফুল (−2, 4) এ."],
  ["কোন দুইটা lens, তার উপর নির্ভর করে.", true, "বেশিরভাগ জোড়ায় ছবি বদলায়. কিছু জোড়ায় বদলায় না."],
];

function X9_Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <svg viewBox="0 0 12 12" className={`size-5 shrink-0 ${POP}`} aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke="#0d9488" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" className={`size-5 shrink-0 ${POP}`} aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke="#e11d48" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

const BF = makeFrame(-3, 11, -2, 6, 10, 4); // 148 × 88

function X9_Evidence({ pair, c, show }: { pair: [Lens, Lens]; c: XY; show: boolean }) {
  const [a, b] = pair;
  const e1 = apply(thenCols(a.cols, b.cols), c);
  const e2 = apply(thenCols(b.cols, a.cols), c);
  return (
    <div className={`min-w-0 transition-opacity duration-500 motion-reduce:transition-none ${show ? "" : "opacity-30"}`}>
      <div className="mb-0.5 text-center text-xs text-muted">
        {a.name} + {b.name}
      </div>
      <O_Wall f={BF} label={`${a.name} আর ${b.name}, দুই order`} width="max-w-none" door={false}>
        {show && (
          <>
            <O_Flower f={BF} c={c} move={byCols(thenCols(a.cols, b.cols))} tone={TONE.a} />
            <O_Flower f={BF} c={c} move={byCols(thenCols(b.cols, a.cols))} ghost tone={TONE.b} />
            <O_Ring f={BF} at={e1} tone={TONE.a} r={6} label={false} />
            <O_Ring f={BF} at={e2} tone={TONE.b} r={same(e1, e2) ? 9 : 6} label={false} />
          </>
        )}
      </O_Wall>
    </div>
  );
}

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [now, setNow] = useState<number | null>(null);
  const p = usePlay(250);
  const tap = (i: number) => {
    if (p.running || open.includes(i)) return;
    setNow(i);
    p.play(4, () => {
      const next = [...open, i];
      setOpen(next);
      setNow(null);
      if (next.length === 3) pass("Order সাধারণত লাগে. কিছু জোড়ায় লাগে না.");
    });
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <X9_Evidence pair={[L_S, L_D]} c={FLOWER} show={open.includes(0) || open.includes(2)} />
        <X9_Evidence pair={[L_R, L_2]} c={X4_FLOWER} show={open.includes(1) || open.includes(2)} />
      </div>
      <div className="mt-3 grid gap-2">
        {X9_CARDS.map(([t, ok, line], i) => {
          const shown = open.includes(i);
          return (
            <button
              key={t}
              type="button"
              onClick={() => tap(i)}
              disabled={p.running || shown}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors duration-300 disabled:cursor-default motion-reduce:transition-none ${
                shown ? (ok ? "border-accent bg-accent/10" : "border-border opacity-70") : now === i ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"
              }`}
            >
              <span>
                <span className="font-semibold">{t}</span>
                {shown && <span className={`${FADE} block text-xs text-muted`}>{line.replace(/, (?=[\d−])/g, ", ")}</span>}
              </span>
              {shown ? <X9_Mark ok={ok} /> : <span className="shrink-0 text-xs text-muted">খুলুন</span>}
            </button>
          );
        })}
      </div>
      <Task done={open.length === 3}>তিনটা বাজি একটা একটা করে খুলুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. The wall at the stage's left (a local stage wall, x −3…11, so
// the flower's (10, 3) is on it), the machine on its stand at the right.

const SWF = makeFrame(-3, 11, -2, 6, 12, 0); // 168 × 96
const SWX = 12;
const SWY = 54;
const onSW = (p: XY): [number, number] => [SWX + SWF.sx(p[0]), SWY + SWF.sy(p[1])];
const PJ: [number, number] = [250, 150];

/** the wall on the stage, with roof; `night` shades it; children in SWF units */
function O_StageWall({ night = true, children }: { night?: boolean; children?: ReactNode }) {
  return (
    <g transform={`translate(${SWX} ${SWY})`}>
      <path d={`M-8 0L${SWF.W + 8} 0L${SWF.W - 4} -12L4 -12Z`} fill="#9f5a3a" />
      <WallBed f={SWF} />
      <O_Grid f={SWF} nums={false} />
      {night && <rect x={0} y={0} width={SWF.W} height={SWF.H} fill="#0f172a" opacity={0.45} />}
      <Post f={SWF} />
      {children}
    </g>
  );
}

/** tonight's picture on the stage wall, through lenses a then b */
function O_StageLight({ cols }: { cols: Cols }) {
  return (
    <>
      <LightGrid f={SWF} move={byCols(cols)} x0={-3} x1={11} y0={-2} y1={6} />
      <O_Flower f={SWF} move={byCols(cols)} />
    </>
  );
}

/** the helper: করিম's look, a red গামছা tied round his head, his name under his feet */
function O_Helper({ x, y, facing = -1, arm = "down", walking = false, ms = 1200 }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "wave" | "hold" | "point"; walking?: boolean; ms?: number }) {
  return (
    <>
      <Person who="karim" x={x} y={y} facing={facing} arm={arm} walking={walking} ms={ms} />
      <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
        <path d="M-9.6 -58.5h19.2v3.6h-19.2Z" fill="#dc2626" />
        <path d="M-6 -58.5v3.6M-1 -58.5v3.6M4 -58.5v3.6" stroke="white" strokeWidth={0.9} />
        <path d={`M${-facing * 9.6} -57l${-facing * 5} 3l${facing * 1} -4Z`} fill="#dc2626" />
        <text y={11} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#e2e8f0">
          হেল্পার
        </text>
      </g>
    </>
  );
}

/** a name under someone's feet, light ink for the night stage */
const NAMES = { rina: "রিনা", fahim: "ফাহিম", nasib: "নাসিব", ammu: "আম্মু", samin: "সামিন", apa: "আপা" } as const;
function O_Name({ x, who }: { x: number; who: keyof typeof NAMES }) {
  return (
    <text x={x} y={161} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#e2e8f0" className="pointer-events-none">
      {NAMES[who]}
    </text>
  );
}

/** a small round lens held up, in its colour */
function O_HeldLens({ x, y, lens, r = 5 }: { x: number; y: number; lens: Lens; r?: number }) {
  return (
    <g className={POP}>
      <circle cx={x} cy={y} r={r} fill={lens.hex} fillOpacity={0.6} stroke={INK} strokeWidth={0.9} />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill="white" opacity={0.6} />
    </g>
  );
}

/** a face smeared with হলুদ */
function O_Holud({ x, y, on = true }: { x: number; y: number; on?: boolean }) {
  return <circle cx={x} cy={y - 50} r={8.6} fill="#facc15" opacity={on ? 0.6 : 0} className="pointer-events-none transition-opacity duration-700 motion-reduce:transition-none" />;
}

/** আম্মু's বালতি at her hand */
function O_Balti({ x, y }: { x: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 7} ${y - 14}l2 14h10l2 -14Z`} fill="#2563eb" stroke="#1e3a8a" strokeWidth={0.8} />
      <path d={`M${x - 7} ${y - 14}q7 -9 14 0`} fill="none" stroke="#1e3a8a" strokeWidth={0.9} />
    </g>
  );
}

/** a glass with its letter, the way 7.3 draws Z and W; `lens` gives the colour */
function O_Glass({ x, y, letter, fill, r = 5.5 }: { x: number; y: number; letter: string; fill: string; r?: number }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={0.9} />
      <text x={x} y={y + r * 0.45} textAnchor="middle" fontSize={r * 1.3} fontWeight={800} fontFamily={MONO} fill={INK}>
        {letter}
      </text>
    </g>
  );
}
const Z_FILL = "#fde68a"; // 7.3's Z
const W_FILL = "#c4b5fd"; // 7.3's W
const S_FILL = "#f5d0fe";
const D_FILL = "#bae6fd";

/** the chalk note on the machine's stand: আগে S, তারপর D */
function O_Chalk({ x, y }: { x: number; y: number }) {
  return (
    <g className={`${POP} pointer-events-none`}>
      <rect x={x - 30} y={y - 8} width={60} height={11} rx={2} fill="#1f2937" stroke="#475569" strokeWidth={0.6} />
      <text x={x} y={y} textAnchor="middle" fontSize={7} fontWeight={700} fill="#f8fafc">
        আগে S, তারপর D
      </text>
    </g>
  );
}

// 1a · হলুদের রাত, late, straight on from 7.3: the show over, the wall dark,
//      the লাইট ভাই has put Z and W back the other way (W in the slot, Z in
//      front) and not switched on. Three children with হলুদ on their faces;
//      আম্মু with the বালতি; Nasib's question, Nasib's claim; the লাইট ভাই
//      holds up S and D; the chalk on the stand.

export function HoludNight({}: Story) {
  const s = useScene(4, [600, 2200, 2200, 2200, 2600]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="হলুদের রাত; show শেষ; লাইট ভাই lens দুইটা উল্টা করে লাগিয়েছেন, W খোপে, Z সামনে; ফাহিম, নাসিব, রিনার মুখে হলুদ; আম্মু বালতি হাতে বললেন এবার গোসল; নাসিব বললো গোসল আগে করলে কী হতো; তারপর বললো আগে পরে কী আসে যায়; লাইট ভাই ব্যাগ থেকে S আর D বের করলেন; যন্ত্রের গায়ে চকে লেখা আগে S, তারপর D">
        <O_StageWall />
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        <O_Glass x={lx} y={ly} letter="W" fill={W_FILL} />
        <O_Glass x={lx - 12} y={ly + 4} letter="Z" fill={Z_FILL} />
        {k >= 4 && <O_Chalk x={PJ[0]} y={PJ[1] - 22} />}
        {(
          [
            ["rina", 58],
            ["fahim", 96],
            ["nasib", 138],
          ] as const
        ).map(([who, x]) => (
          <g key={who}>
            <Person who={who} x={x} y={150} facing={1} arm={who === "nasib" && (k === 2 || k === 3) ? "point" : "down"} />
            <O_Name x={x} who={who} />
            <O_Holud x={x} y={150} />
          </g>
        ))}
        <Person who="ammu" x={196} y={150} facing={-1} arm="hold" />
        <O_Name x={196} who="ammu" />
        <O_Balti x={184} y={124} />
        <LightBhai x={300} y={150} facing={-1} arm={k >= 4 ? "hold" : "down"} nameTone="#e2e8f0" />
        {k >= 4 && (
          <g className={POP}>
            <O_Glass x={283} y={107} letter="S" fill={S_FILL} r={5} />
            <O_Glass x={293} y={98} letter="D" fill={D_FILL} r={5} />
          </g>
        )}
        {k === 1 && <Bubble x={196} y={84} side="left" lines={["হলুদ মাখা শেষ.", "এবার গোসল."]} />}
        {k === 2 && <Bubble x={138} y={84} side="right" lines={["গোসল আগে করলে", "কী হতো?"]} />}
        {k === 3 && <Bubble x={138} y={84} side="right" lines={["দুইটা lens ই তো লাগানো.", "আগে পরে কী আসে যায়."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · The লাইট ভাই follows the chalk: Z and W out, S into the slot, D in
//      front. The machine stays off; the flower's spot (2, 3) is marked
//      dashed on আপার জানালা. The reader runs it.

export function ChalkOrder({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 2000]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="লাইট ভাই Z আর W খুলে রাখলেন; চকের লেখা মতো S খোপে, D সামনে লাগালেন; lens ছাড়া ফুল পড়ে (2, 3) এ, আপার জানালায়">
        <O_StageWall>{k >= 3 && <circle cx={SWF.sx(2)} cy={SWF.sy(3)} r={5} fill="none" stroke="#fde047" strokeWidth={1.2} strokeDasharray="2 1.5" className={POP} />}</O_StageWall>
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        <O_Chalk x={PJ[0]} y={PJ[1] - 22} />
        {k === 0 && (
          <>
            <O_Glass x={lx} y={ly} letter="W" fill={W_FILL} />
            <O_Glass x={lx - 12} y={ly + 4} letter="Z" fill={Z_FILL} />
          </>
        )}
        {k >= 1 && (
          <g className={POP}>
            <O_Glass x={lx} y={ly} letter="S" fill={S_FILL} />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <O_Glass x={lx - 12} y={ly + 4} letter="D" fill={D_FILL} />
          </g>
        )}
        {k === 1 && <O_Glass x={283} y={107} letter="D" fill={D_FILL} r={5} />}
        <LightBhai x={300} y={150} facing={-1} arm={k <= 1 ? "hold" : "down"} nameTone="#e2e8f0" />
        <Person who="samin" x={200} y={150} facing={1} />
        <O_Name x={200} who="samin" />
      </Stage>
    </StoryFrame>
  );
}

// 3a · Samin opens the machine's app; the one lens reads "D S". The লাইট ভাই
//      asks which one the light enters first.

export function SaminApp({}: Story) {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="সামিন যন্ত্রের app খুললো; এক lens এর নাম D S; লাইট ভাই জিজ্ঞেস করলেন আলো আগে D তে ঢোকে কি না">
        <O_StageWall />
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        <O_Chalk x={PJ[0]} y={PJ[1] - 22} />
        <Person who="samin" x={200} y={150} facing={1} arm="hold" />
        <O_Name x={200} who="samin" />
        {/* the phone in Samin's hand */}
        <rect x={207} y={100} width={9} height={15} rx={1.5} fill="#1e293b" stroke="#94a3b8" strokeWidth={0.6} />
        {k >= 1 && <rect x={208.5} y={102} width={6} height={10} fill="#bae6fd" className={POP} />}
        {k >= 1 && <Card x={212} y={80} text="D S" tone="blue" />}
        <LightBhai x={298} y={150} facing={-1} arm={k >= 2 ? "point" : "down"} nameTone="#e2e8f0" />
        {k >= 2 && <Bubble x={298} y={60} side="left" lines={["তাইলে আলো", "আগে ঢুকে D তে?"]} />}
        {k >= 3 && (
          <text x={140} y={70} textAnchor="middle" fontSize={18} fontWeight={800} fill="#60a5fa" className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 4a · Nasib digs two more lenses out of the decorator's box: a ঘোরানো and a
//      দ্বিগুণ. His claim.

export function NasibBox({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="নাসিব ডেকোরেটরের বাক্স থেকে আরো দুইটা lens বের করলো, একটা ঘোরায়, একটা দ্বিগুণ করে; বললো এই দুইটা দিয়ে দেখাই, আগে পরে একই হবে">
        <O_StageWall />
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        {/* the decorator's box */}
        <rect x={212} y={136} width={22} height={14} rx={1.5} fill="#a16207" stroke="#78350f" />
        <Person who="nasib" x={170} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} />
        <O_Name x={170} who="nasib" />
        {k >= 1 && <O_HeldLens x={188} y={108} lens={L_R} />}
        {k >= 2 && <O_HeldLens x={199} y={98} lens={L_2} />}
        {k >= 1 && (
          <text x={196} y={117} fontSize={7.5} fontWeight={700} fill="#a7f3d0" className={POP}>
            ঘোরানো
          </text>
        )}
        {k >= 2 && (
          <text x={207} y={96} fontSize={7.5} fontWeight={700} fill="#fecdd3" className={POP}>
            দ্বিগুণ
          </text>
        )}
        <Person who="samin" x={120} y={150} facing={1} />
        <O_Name x={120} who="samin" />
        <LightBhai x={298} y={150} facing={-1} nameTone="#e2e8f0" />
        {k >= 3 && <Bubble x={170} y={64} side="left" lines={["এই দুইটা দিয়ে দেখাই.", "আগে পরে একই হবে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · The লাইট ভাই brings two dusty spares from the bottom of the box; their
//      plates read (1, 0) (0, 0) and (0, 0) (0, 1). His question.

export function BoxBottom({}: Story) {
  const s = useScene(3, [600, 1800, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="লাইট ভাই বাক্সের তলা থেকে দুইটা ধুলা মাখা lens আনলেন; একটার পাতে (1, 0) আর (0, 0), আরেকটার (0, 0) আর (0, 1); বললেন একটাও তো ফাঁকা না, একসাথে দেই">
        <O_StageWall />
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        <rect x={196} y={134} width={30} height={16} rx={1.5} fill="#a16207" stroke="#78350f" />
        <LightBhai x={k >= 1 ? 298 : 236} y={150} facing={k >= 1 ? -1 : 1} arm={k >= 1 ? "hold" : "down"} walking={k === 1} nameTone="#e2e8f0" />
        {k >= 1 && (
          <>
            <O_HeldLens x={280} y={106} lens={L_K1} />
            <O_HeldLens x={272} y={98} lens={L_K2} />
          </>
        )}
        {k >= 2 && (
          <>
            <Card x={150} y={30} text="(1, 0) (0, 0)" tone="amber" />
            <Card x={250} y={30} text="(0, 0) (0, 1)" tone="teal" />
          </>
        )}
        {k >= 3 && <Bubble x={298} y={84} side="left" lines={["একটাও তো ফাঁকা না.", "একসাথে দেই?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 8a · Late. The লাইট ভাই hands S and D to his helper for tomorrow and goes
//      to sleep; আপা shows the afternoon's picture on her phone; the helper
//      asks where "আগে" is: the slot, or in front?

export function HelperWaits({}: Story) {
  const s = useScene(4, [600, 2000, 1600, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="লাইট ভাই S আর D হেল্পারের হাতে দিলেন, বললেন কাল তুই লাগাবি, তারপর ঘুমাতে গেলেন; আপা phone এ বিকালের ছবি দেখিয়ে বললো কাল এইটাই চাই; হেল্পার জিজ্ঞেস করলো আগে মানে কোথায়, খোপে না সামনে">
        <O_StageWall />
        <Projector x={PJ[0]} y={PJ[1]} lens="empty" />
        <O_Chalk x={PJ[0]} y={PJ[1] - 22} />
        <LightBhai x={k >= 2 ? 360 : 300} y={150} facing={k >= 2 ? 1 : -1} arm={k === 0 ? "hold" : "down"} walking={k === 2} nameTone="#e2e8f0" />
        {k === 1 && <Bubble x={300} y={84} side="left" lines={["কাইল তুই লাগাবি."]} />}
        <O_Helper x={205} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 ? (
          <>
            <O_Glass x={222} y={108} letter="S" fill={S_FILL} r={5} />
            <O_Glass x={231} y={100} letter="D" fill={D_FILL} r={5} />
          </>
        ) : (
          <>
            <O_Glass x={283} y={107} letter="S" fill={S_FILL} r={5} />
            <O_Glass x={293} y={98} letter="D" fill={D_FILL} r={5} />
          </>
        )}
        {k >= 3 && <Person who="apa" x={150} y={150} facing={1} arm="hold" />}
        {k >= 3 && <O_Name x={150} who="apa" />}
        {k >= 3 && (
          <g className={POP}>
            <rect x={157} y={96} width={16} height={11} rx={1.5} fill="#1e293b" />
            <rect x={158.5} y={97.5} width={13} height={8} fill="#e9e4d8" />
            <circle cx={168} cy={100.5} r={1.6} fill="#fbbf24" />
          </g>
        )}
        {k === 3 && <Bubble x={150} y={84} side="right" lines={["কাল এইটাই চাই."]} />}
        {k >= 4 && <Bubble x={205} y={84} side="mid" lines={["আগে মানে কই?", "খোপে, না সামনে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 9a · Back from গোসল, faces clean. The helper swaps S and D once more: the
//      picture changes; back again, it returns. Nasib looks, says nothing.

export function BackFromGosol({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2200]);
  const k = s.k;
  const cols = k === 2 ? SD : DS;
  const flower = onSW(apply(cols, FLOWER));
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="ছেলেমেয়েরা গোসল সেরে ফিরলো, মুখে হলুদ নাই; হেল্পার lens উল্টালো, দেয়ালের ছবি বদলালো; আবার আগের মতো লাগালো, আগের ছবি ফিরলো; নাসিব কিছু বললো না">
        <O_StageWall>{k !== 1 && <O_StageLight cols={cols} />}</O_StageWall>
        {k !== 1 && <StageBeam from={projectorLens(PJ[0], PJ[1])} to={flower} />}
        <Projector x={PJ[0]} y={PJ[1]} on={k !== 1} lens={k === 1 ? "empty" : "good"} />
        {(
          [
            ["rina", 70],
            ["fahim", 110],
            ["nasib", 150],
          ] as const
        ).map(([who, x]) => (
          <g key={who}>
            <Person who={who} x={x} y={150} facing={1} />
            <O_Name x={x} who={who} />
            {[0, 1].map((d) => (
              <circle key={d} cx={x - 5 + d * 10} cy={96 + d * 3} r={1.1} fill="#93c5fd" />
            ))}
          </g>
        ))}
        <O_Helper x={222} y={150} facing={1} arm={k === 1 ? "hold" : "down"} />
        {k === 1 && (
          <>
            <O_Glass x={239} y={108} letter="D" fill={D_FILL} r={5} />
            <O_Glass x={248} y={100} letter="S" fill={S_FILL} r={5} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · হলুদ মেখে গোসল vs গোসল করে হলুদ: two children, two orders, two faces.

const X1B_SAY = [
  "দুইজন. একই হলুদের বাটি, একই বালতি.",
  "উপরের জন আগে হলুদ মাখলো.",
  "তারপর গোসল. মুখ পরিষ্কার.",
  "নিচের জন আগে গোসল করলো.",
  "তারপর হলুদ. হলুদ মুখেই ঘুমাতে গেলো. একই দুই কাজ, order আলাদা, ফল আলাদা.",
];

function X1B_Kid({ x, y, holud, wet }: { x: number; y: number; holud: boolean; wet: boolean }) {
  return (
    <g>
      <rect x={x - 7} y={y - 4} width={14} height={18} rx={4} fill="#60a5fa" />
      <circle cx={x} cy={y - 12} r={8} fill="#d8a47a" />
      <circle cx={x} cy={y - 12} r={8} fill="#facc15" opacity={holud ? 0.75 : 0} className="transition-opacity duration-700 motion-reduce:transition-none" />
      <circle cx={x - 2.8} cy={y - 13} r={1} fill={INK} />
      <circle cx={x + 2.8} cy={y - 13} r={1} fill={INK} />
      {wet && [0, 1, 2].map((i) => <circle key={i} cx={x - 6 + i * 6} cy={y - 23 - (i % 2) * 2} r={1.2} fill="#3b82f6" className={POP} />)}
    </g>
  );
}

function X1B_Bowl({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x - 9} ${y}q9 10 18 0Z`} fill="#b45309" />
      <ellipse cx={x} cy={y} rx={9} ry={2.5} fill="#facc15" />
    </g>
  );
}

export function HoludGosol() {
  const s = useScene(4, [600, 1600, 1600, 1600, 2400]);
  const k = s.k;
  // row A: হলুদ then গোসল; row B: গোসল then হলুদ
  const ax = k === 0 ? 30 : k === 1 ? 120 : 220;
  const bx = k <= 2 ? 30 : k === 3 ? 120 : 220;
  const aHolud = k === 1;
  const bHolud = k >= 4;
  return (
    <Scene scene={s} caption={say(X1B_SAY, k)}>
      <svg viewBox="0 0 240 124" role="img" aria-label="দুইজন: একজন আগে হলুদ তারপর গোসল, মুখ পরিষ্কার; আরেকজন আগে গোসল তারপর হলুদ, মুখ হলুদ" className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect x={0} y={0} width={240} height={124} rx={8} fill="#1e293b" />
        <path d="M0 62H240" stroke="#475569" strokeDasharray="3 3" />
        {/* row A */}
        <X1B_Bowl x={100} y={48} />
        <O_Balti x={200} y={54} />
        <text x={100} y={15} textAnchor="middle" fontSize={8} fill="#e2e8f0">
          হলুদ
        </text>
        <text x={200} y={15} textAnchor="middle" fontSize={8} fill="#e2e8f0">
          গোসল
        </text>
        <g style={{ transform: `translateX(${ax - 30}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
          <X1B_Kid x={30} y={40} holud={aHolud} wet={k >= 2} />
        </g>
        {/* row B */}
        <O_Balti x={100} y={116} />
        <X1B_Bowl x={200} y={110} />
        <text x={100} y={77} textAnchor="middle" fontSize={8} fill="#e2e8f0">
          গোসল
        </text>
        <text x={200} y={77} textAnchor="middle" fontSize={8} fill="#e2e8f0">
          হলুদ
        </text>
        <g style={{ transform: `translateX(${bx - 30}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
          <X1B_Kid x={30} y={102} holud={bHolud} wet={k === 3} />
        </g>
      </svg>
    </Scene>
  );
}

// 2½ · The two ropes through both orders: e₁ lands on (2, 0) both times; e₂ on
//      (2, 1) one way, (1, 1) the other; the one-lens cards differ in column 2.

const RF = makeFrame(-1, 3, -1, 2, 26, 6); // 116 × 90

function X2B_Panel({ first, second, k, title, tone }: { first: Lens; second: Lens; k: number; title: string; tone: string }) {
  const e: XY[] = [
    [1, 0],
    [0, 1],
  ];
  const at = (v: XY): XY => (k === 0 ? v : k === 1 ? apply(first.cols, v) : apply(thenCols(first.cols, second.cols), v));
  return (
    <div className="min-w-0">
      <div className="mb-0.5 text-center text-xs" style={{ color: tone }}>
        {title}
      </div>
      <Plane f={RF} grid={1} axes label={title} className="my-0! max-w-none">
        <Arrow key={`a${k}`} f={RF} from={[0, 0]} to={at(e[0])} tone="amber" draw />
        <Arrow key={`b${k}`} f={RF} from={[0, 0]} to={at(e[1])} tone="teal" draw />
      </Plane>
      <div className="mt-1 flex justify-center">{k >= 3 && <LensCard cols={thenCols(first.cols, second.cols)} small />}</div>
    </div>
  );
}

const X2B_SAY = [
  "দুই দড়ি: e₁ = (1, 0), e₂ = (0, 1).",
  "প্রথম lens পার হলো. বামে হেলানো, ডানে চওড়া.",
  "দ্বিতীয় lens ও পার. e₁ দুই দিকেই (2, 0). কিন্তু e₂ একদিকে (2, 1), অন্যদিকে (1, 1).",
  "দড়ির মাথাগুলো column. দ্বিতীয় column মেলে না. দুইটা আলাদা lens.",
];

export function RopesTwoWays() {
  const s = useScene(3, [600, 1600, 2200, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X2B_SAY, k)}>
      <div className="mx-auto grid max-w-[17rem] grid-cols-2 gap-2">
        <X2B_Panel first={L_S} second={L_D} k={k} title="আগে হেলানো" tone={TONE.a} />
        <X2B_Panel first={L_D} second={L_S} k={k} title="আগে চওড়া" tone={TONE.b} />
      </div>
    </Scene>
  );
}

// 2½b · 7.3's pair the other way: Z then W gave G; W then Z gives [[1, 0], [1, 3]].

const L_Z: Lens = { key: "Z", name: "Z", tag: "Z", cols: [[-1, 2], [1, 1]], hex: "#b45309" };
const L_W: Lens = { key: "W", name: "W", tag: "W", cols: [[0, 1], [1, 1]], hex: "#4f46e5" };
const ZF = makeFrame(-1, 3, -1, 3, 22, 6); // 100 × 100

function X2C_Panel({ first, second, k, show, title }: { first: Lens; second: Lens; k: number; show: boolean; title: string }) {
  const m = byCols(thenCols(first.cols, second.cols));
  return (
    <div className="min-w-0">
      <div className="mb-0.5 text-center text-xs text-muted">{title}</div>
      <Plane f={ZF} grid={1} axes label={title} className="my-0! max-w-none">
        {show ? (
          <>
            <Arrow key={`a${k}`} f={ZF} from={[0, 0]} to={m([1, 0])} tone="amber" draw />
            <Arrow key={`b${k}`} f={ZF} from={[0, 0]} to={m([0, 1])} tone="teal" draw />
          </>
        ) : (
          <>
            <Arrow f={ZF} from={[0, 0]} to={[1, 0]} tone="amber" faint />
            <Arrow f={ZF} from={[0, 0]} to={[0, 1]} tone="teal" faint />
          </>
        )}
      </Plane>
      <div className="mt-1 flex justify-center">{show && k >= 3 && <LensCard cols={thenCols(first.cols, second.cols)} small />}</div>
    </div>
  );
}

const X2C_SAY = ["7.3 এর দুই lens, Z আর W.", "আগে Z, তারপর W: দড়ি দুইটা (2, 1) আর (1, 2) এ. এটাই G.", "উল্টা, আগে W, তারপর Z: (1, 1) আর (0, 3).", "ZW আর WZ আলাদা. উল্টালে G আর পাওয়া যায় না."];

export function ZWOther() {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X2C_SAY, k)}>
      <div className="mx-auto grid max-w-[15rem] grid-cols-2 gap-2">
        <X2C_Panel first={L_Z} second={L_W} k={k} show={k >= 1} title="আগে Z: WZ" />
        <X2C_Panel first={L_W} second={L_Z} k={k} show={k >= 2} title="আগে W: ZW" />
      </div>
    </Scene>
  );
}

// 3½ · The light enters from the right: bulb (v), then S, then D, then the
//      wall. Under it the letters in the same places: D S v. Then the brackets
//      move while the letters stay.

const X3B_SAY = [
  "বামে দেয়াল, ডানে bulb. নিচে লেখাটা একই জায়গায়: D S v.",
  "আলো bulb থেকে বের হলো: v.",
  "আগে S পার হলো: Sv.",
  "তারপর D: D(Sv). এটাই (DS)v. পড়ি বাম থেকে, কাজ ডান থেকে.",
  "Bracket যেখানেই বসাই, (DS)v বা D(Sv), আলো একই পথে যায়. শুধু অক্ষরের order বদলানো যায় না.",
];

export function LightEnters() {
  const s = useScene(4, [600, 1400, 1600, 2200, 2600]);
  const k = s.k;
  const reach = k === 0 ? 234 : k === 1 ? 200 : k === 2 ? 110 : 18;
  const label = k === 1 ? "v" : k === 2 ? "Sv" : k >= 3 ? "D(Sv)" : "";
  return (
    <Scene scene={s} caption={say(X3B_SAY, k)}>
      <svg viewBox="0 0 250 104" role="img" aria-label="আলো bulb থেকে বের হয়ে আগে S, তারপর D পার হয়ে দেয়ালে; নিচে লেখা D S v একই জায়গায়" className="mx-auto block h-auto w-full max-w-[16rem]">
        <rect x={4} y={6} width={12} height={50} rx={2} fill={LIME} stroke="#a8a29e" />
        <rect x={60} y={16} width={160} height={30} rx={6} fill="#334155" />
        {k >= 1 && <rect x={reach} y={26} width={234 - reach} height={10} rx={5} fill="#fde047" opacity={0.75} className="transition-[x,width] duration-700 motion-reduce:transition-none" />}
        <ellipse cx={100} cy={31} rx={8} ry={17} fill={L_D.hex} fillOpacity={0.55} stroke={L_D.hex} />
        <ellipse cx={160} cy={31} rx={8} ry={17} fill={L_S.hex} fillOpacity={0.55} stroke={L_S.hex} />
        <circle cx={236} cy={31} r={10} fill={k >= 1 ? "#fde047" : "#e5e7eb"} stroke="#78716c" />
        {label && (
          <text key={label} x={k >= 3 ? 30 : k === 2 ? 130 : 205} y={12} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill="#b45309" className={POP}>
            {label}
          </text>
        )}
        {/* the letters under the things they name */}
        <g fontFamily={MONO} fontWeight={800} fontSize={16} textAnchor="middle">
          {k >= 4 ? (
            <>
              <text key="a" x={100} y={78} fill={INK} className={POP}>
                <tspan fill="#94a3b8">(</tspan>
                <tspan fill={L_D.hex}>D</tspan>
              </text>
              <text x={160} y={78} fill={L_S.hex}>
                S<tspan fill="#94a3b8">)</tspan>
              </text>
              <text x={236} y={78} fill="#b45309">
                v
              </text>
              <text x={168} y={98} fontSize={11} fill={INK}>
                = D(Sv)
              </text>
            </>
          ) : (
            <>
              <text x={100} y={78} fill={L_D.hex}>
                D
              </text>
              <text x={160} y={78} fill={L_S.hex}>
                S
              </text>
              <text x={236} y={78} fill="#b45309">
                v
              </text>
            </>
          )}
        </g>
      </svg>
    </Scene>
  );
}

// 4½ · Doubling goes with anything: the flower (1, 1) through হেলানো then
//      দ্বিগুণ, and দ্বিগুণ then হেলানো; both stop at (4, 2).

const DF = makeFrame(-1, 5, -1, 3, 26, 6); // 168 × 116
const X4B_STOPS: XY[][] = [
  [
    [1, 1],
    [2, 1],
    [4, 2],
  ],
  [
    [1, 1],
    [2, 2],
    [4, 2],
  ],
];
const X4B_SAY = [
  "ফুল (1, 1) এ. এবার দ্বিগুণ আর হেলানো.",
  "আগে হেলানো: (2, 1).",
  "তারপর দ্বিগুণ: (4, 2).",
  "উল্টা. আগে দ্বিগুণ: (2, 2).",
  "তারপর হেলানো: আবার (4, 2). দ্বিগুণ সব দিক সমান বাড়ায়, তাই যেকোনো lens এর আগে পরে একই.",
];

export function DoubleCommutes() {
  const s = useScene(4, [600, 1400, 1400, 1600, 2600]);
  const k = s.k;
  const path = (i: number, n: number) => X4B_STOPS[i].slice(0, n + 1);
  const shownA = k >= 1 ? Math.min(2, k) : 0;
  const shownB = k >= 3 ? k - 2 : 0;
  const line = (pts: XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${DF.sx(p[0])} ${DF.sy(p[1])}`).join("");
  return (
    <Scene scene={s} caption={say(X4B_SAY, k)}>
      <div className="mx-auto max-w-[14rem]">
        <Plane f={DF} grid={1} axes label="ফুল (1, 1) থেকে দুই পথে (4, 2) এ" className="my-0! max-w-none">
          {shownA > 0 && <path d={line(path(0, shownA))} fill="none" stroke={TONE.a} strokeWidth={2} strokeDasharray="4 3" />}
          {shownB > 0 && <path d={line(path(1, shownB))} fill="none" stroke={TONE.b} strokeWidth={2} strokeDasharray="4 3" />}
          {path(0, shownA).map((p, i) => (
            <circle key={`a${i}`} cx={DF.sx(p[0])} cy={DF.sy(p[1])} r={3.2} fill={TONE.a} className={POP} />
          ))}
          {path(1, shownB).map((p, i) => (
            <circle key={`b${i}`} cx={DF.sx(p[0])} cy={DF.sy(p[1])} r={i === 2 ? 6 : 3.2} fill={i === 2 ? "none" : TONE.b} stroke={TONE.b} strokeWidth={2} className={POP} />
          ))}
        </Plane>
      </div>
    </Scene>
  );
}

// 5½ · Lost directions, by the ropes: through বাড়তি 2, e₁ falls to the pin
//      and e₂ stays (0, 1); through বাড়তি 1, e₂ falls too. The one lens is all 0.

const KF = makeFrame(-1, 2, -1, 2, 30, 6); // 102 × 102
const X5B_SAY = [
  "দুই দড়ি: e₁ ডানে, e₂ উপরে.",
  "বাড়তি 2 রাখে শুধু উপর-নিচ. e₁ পড়ে গেলো পেরেকে. e₂ রইলো.",
  "বাড়তি 1 রাখে শুধু ডান-বাম. এবার e₂ ও পেরেকে.",
  "দুই দড়ির মাথাই (0, 0). এক lens এ লিখলে সব ঘর 0.",
];

export function LostDirections() {
  const s = useScene(3, [600, 2000, 2000, 2400]);
  const k = s.k;
  const e1: XY = k === 0 ? [1, 0] : [0, 0];
  const e2: XY = k <= 1 ? [0, 1] : [0, 0];
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <div className="mx-auto flex max-w-[16rem] items-center justify-center gap-3">
        <div className="w-[7rem]">
          <Plane f={KF} grid={1} axes label="দুই দড়ি দুই বাড়তি lens পার হয়ে পেরেকে" className="my-0! max-w-none">
            <Arrow f={KF} from={[0, 0]} to={[1, 0]} tone="amber" faint />
            <Arrow f={KF} from={[0, 0]} to={[0, 1]} tone="teal" faint />
            <Arrow key={`a${k}`} f={KF} from={[0, 0]} to={e1} tone="amber" />
            <Arrow key={`b${k}`} f={KF} from={[0, 0]} to={e2} tone="teal" />
            {k >= 1 && <circle cx={KF.sx(0)} cy={KF.sy(0)} r={k >= 2 ? 7 : 4} fill="#fde047" opacity={0.7} className={POP} />}
          </Plane>
        </div>
        <div className="flex flex-col items-center gap-1 text-xs text-muted">
          {k >= 3 ? <LensCard cols={[[0, 0], [0, 0]]} small /> : <LensCard cols={k >= 2 ? [[0, 0], [0, 0]] : [e1, e2]} small />}
          <span>এক lens এ</span>
        </div>
      </div>
    </Scene>
  );
}

// 9½ · For the properties side quest: the clear glass I with the হেলানো, both
//      orders; the flower lands on the same spot, the same as হেলানো alone.

const L_I: Lens = { key: "I", name: "খালি কাঁচ", tag: "I", cols: ID, hex: "#64748b" };
const X9B_SAY = ["খালি কাঁচ I আর হেলানো S.", "আগে I, তারপর S: ফুল (5, 3) এ.", "আগে S, তারপর I: আবার (5, 3). শুধু S দিলেও তাই. SI = IS = S."];

export function ClearGlass() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  const end = apply(L_S.cols, FLOWER);
  return (
    <Scene scene={s} caption={say(X9B_SAY, k)}>
      <div className="mx-auto max-w-[15rem]">
        <O_Wall f={BF} label="খালি কাঁচ আর হেলানো, দুই order এ ফুল (5, 3) এ" width="max-w-none">
          <O_Light f={BF} move={k >= 1 ? byCols(L_S.cols) : (p) => p} />
          {k >= 1 && <O_Ring f={BF} at={end} tone={TONE.a} r={6} label={false} />}
          {k >= 2 && <O_Ring f={BF} at={end} tone={TONE.b} r={9} label={false} />}
        </O_Wall>
      </div>
      <div className="mt-1 flex justify-center gap-3 text-xs">
        <O_LensTag lens={L_I} />
        <O_LensTag lens={L_S} />
      </div>
    </Scene>
  );
}

// 9½b · For the transpose side quest: the source's check. A = [[1, 2], [0, 1]],
//       B = [[1, 0], [3, 1]], AB = [[7, 2], [3, 1]]; (AB)ᵀ = BᵀAᵀ = [[7, 3], [2, 1]];
//       AᵀBᵀ = [[1, 3], [2, 7]] is something else.

/** rows-first → columns */
const colsOf = (r: [[number, number], [number, number]]): Cols => [
  [r[0][0], r[1][0]],
  [r[0][1], r[1][1]],
];
const X9C_ROWS: [string, Cols, boolean | null][] = [
  ["A", colsOf([[1, 2], [0, 1]]), null],
  ["B", colsOf([[1, 0], [3, 1]]), null],
  ["AB", colsOf([[7, 2], [3, 1]]), null],
  ["(AB)ᵀ", colsOf([[7, 3], [2, 1]]), null],
  ["BᵀAᵀ", colsOf([[7, 3], [2, 1]]), true],
  ["AᵀBᵀ", colsOf([[1, 3], [2, 7]]), false],
];
const X9C_SAY = [
  "বইয়ের দুইটা matrix, A আর B.",
  "AB: আগে B, তারপর A.",
  "AB এর transpose: row গুলো column হয়ে গেলো.",
  "BᵀAᵀ: order উল্টে গুণ. মিলে গেলো.",
  "AᵀBᵀ: order না উল্টালে অন্য জিনিস.",
];

export function FlipOrder() {
  const s = useScene(4, [600, 1600, 1800, 2000, 2400]);
  const k = s.k;
  const shown = k === 0 ? 2 : k + 2;
  return (
    <Scene scene={s} caption={say(X9C_SAY, k)}>
      <div className="mx-auto grid max-w-[16rem] grid-cols-2 gap-x-3 gap-y-1.5">
        {X9C_ROWS.slice(0, shown).map(([name, cols, ok]) => (
          <div key={name} className={`${POP} flex items-center justify-between gap-1 rounded-lg border px-2 py-1 ${ok === true ? "border-accent bg-accent/10" : ok === false ? "border-danger/50 bg-danger/5" : "border-border"}`}>
            <span className="font-mono text-sm font-bold">{name}</span>
            <LensCard cols={cols} small />
          </div>
        ))}
      </div>
    </Scene>
  );
}

// 9c · The bridge to 7.5: the বিয়ের দিন; the machine off; the photographer at
//      a plastic table with a laptop, 300 photos, fifty filters; "?".

export function MorningPandal() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বিয়ের দিন দুপুর; প্যান্ডেল; দেয়ালের যন্ত্র বন্ধ; ফটোগ্রাফার ভাই প্লাস্টিকের টেবিলে laptop নিয়ে; 300 টা ছবি, 50 টা filter; প্রশ্নবোধক">
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} d={`M${i * 20} 0h20v14q-10 7 -20 0Z`} fill={i % 2 ? "#facc15" : "#dc2626"} />
        ))}
        <rect x={6} y={10} width={4} height={140} fill="#a16207" />
        <rect x={310} y={10} width={4} height={140} fill="#a16207" />
        <Projector x={60} y={150} facing={1} lens="good" />
        {k >= 1 && (
          <g className={POP}>
            <rect x={160} y={112} width={70} height={4} fill="#e5e7eb" stroke="#94a3b8" />
            <path d="M166 116v34M224 116v34" stroke="#94a3b8" strokeWidth={2} />
            <rect x={178} y={98} width={30} height={14} rx={1.5} fill="#1e293b" />
            <rect x={180} y={100} width={26} height={10} fill="#bae6fd" />
            <rect x={181} y={107.5} width={3} height={1.6} fill="#16a34a" />
          </g>
        )}
        {k >= 1 && <Person who="mama" x={250} y={150} facing={-1} arm="hold" />}
        {k >= 1 && (
          <g className={POP}>
            <rect x={232} y={104} width={10} height={7} rx={1.2} fill="#1f2937" />
            <circle cx={237} cy={107.5} r={2} fill="#94a3b8" />
            <text x={250} y={161} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
              ফটোগ্রাফার ভাই
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <text x={193} y={86} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily={MONO} fill={INK}>
              3 / 300
            </text>
            <text x={193} y={72} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
              50 টা filter
            </text>
          </g>
        )}
        {k >= 3 && (
          <text x={140} y={70} textAnchor="middle" fontSize={20} fontWeight={800} fill="#2563eb" className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

export const fixtures: Fixtures = {
  OrderBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 0, sealed: true }, sealedDiff: { bet: 1, sealed: true } },
  SwapLenses: { start: {}, one: { done: [true, false] }, swapped: { order: 1, done: [true, false] }, done: { order: 1, done: [true, true] } },
  WhichFirst: { start: {}, wrong: { pick: 0, ran: true }, right: { pick: 1, ran: true } },
  TurnAndDouble: { start: {}, one: { order: 0, ran: true, done: [true, false] }, done: { order: 1, ran: true, done: [true, true] } },
  DarkWall: { start: {}, one: { mode: 0, ran: true, tried: [true, false, false] }, two: { mode: 1, ran: true, tried: [true, true, false] }, done: { mode: 2, ran: true, tried: [true, true, true] } },
  YourOrders: { start: {}, wrong: { at: 0, said: 1, ran: true }, right: { at: 1, said: 1, ran: true }, dark: { at: 3, said: 1, ran: true }, done: { at: 4 } },
  TryWhichWall: { start: {}, wrong: { pick: 0, ran: true }, alone: { pick: 2, ran: true }, right: { pick: 1, ran: true } },
  HelperFits: { start: {}, sel: { sel: "S", slots: [null, "D"] }, wrong: { slots: ["D", "S"], ran: true }, right: { slots: ["S", "D"], ran: true } },
  BetOpen: { start: {}, one: { open: [0] }, done: { open: [0, 1, 2] } },
  HoludNight: { rest: { k: 0 }, ammu: { k: 1 }, nasib: { k: 2 }, claim: { k: 3 }, done: {} },
  ChalkOrder: { rest: { k: 0 }, s: { k: 1 }, done: {} },
  SaminApp: { rest: { k: 0 }, done: {} },
  NasibBox: { rest: { k: 0 }, done: {} },
  BoxBottom: { rest: { k: 0 }, done: {} },
  HelperWaits: { rest: { k: 0 }, hand: { k: 1 }, apa: { k: 3 }, done: {} },
  BackFromGosol: { rest: { k: 0 }, out: { k: 1 }, swapped: { k: 2 }, done: {} },
  HoludGosol: { rest: { k: 0 }, a: { k: 2 }, done: {} },
  RopesTwoWays: { one: { k: 1 }, done: {} },
  ZWOther: { g: { k: 1 }, done: {} },
  LightEnters: { rest: { k: 0 }, s: { k: 2 }, d: { k: 3 }, done: {} },
  DoubleCommutes: { a: { k: 2 }, done: {} },
  LostDirections: { one: { k: 1 }, done: {} },
  ClearGlass: { done: {} },
  FlipOrder: { mid: { k: 2 }, done: {} },
  MorningPandal: { rest: { k: 0 }, done: {} },
};
