"use client";

import { useId, useState, type ReactNode } from "react";

import { Tup, num } from "@/components/journey/box";
import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, Plane, makeFrame, type Frame, type XY } from "@/components/journey/plane";

// Screens for "Math for AI 7.5 — The photographer's fifty filters", told as a
// Journey in the author's Bangla-English. The plan is 07_journey_specs.md,
// block 7.5.
//
// The বিয়ের দিন at নানাবাড়ি. The ফটোগ্রাফার ভাই runs 50 colour filters, one after
// another, on each of 300 photos of the হলুদের রাত. A photo's colour is a point
// on a two-slot paper, (লাল, হলুদ); a filter is a 2 × 2 that moves the paper.
// He says fifty filters, fifty kinds of pretty, fifty times the wait; Samin
// says one filter could do all fifty.
//
// Ten screens. 1 seals the bet (FilterBet). 2 runs the first two filters,
// গরম [[1,1],[0,1]] then উজ্জ্বল [[2,0],[0,2]], on the colour (1, 1): (2, 1),
// then (4, 2); builds the one filter [[2,2],[0,2]] by following the ropes and
// runs it: (4, 2) in one hop (TwoFilters). 3 folds all fifty pair by pair into
// one; the path loses hops, the end never moves (FiftyIntoOne). 4 the contrast
// slider, a bend slot by slot, won't fold (TheBend). 5 all 300 photos in one
// multiplication (AllPhotos). 6 shapes of two matrices, then the book's
// (4 × 2)(2 × 3) (ShapeFits). 7 Your turn, six pairs (ShapeGame). 8 Try it: a
// 300 → 100 layer's W (TryLayerSize). 9 the album runs (AlbumDone). 10 the bet
// opened card by card (BetOpen).
//
// After the screens: the story scenes (numbered "a") and the watch-only
// figures (numbered "½"), each after its screen. The photographer wears Mama's
// look with his name drawn under his feet, as 6.1 did; no cast change.

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";
const OK = "#0d9488";
const BAD = "#e11d48";
const RED = "#dc2626";
const YEL = "#ca8a04";
const DOT = "#f59e0b";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a photo's colour, as the paper reads it */
const SLOTS = ["লাল", "হলুদ"];

/** a 2 × 2 by its columns: where (1, 0) and (0, 1) land */
type Cols = [XY, XY];
const ID: Cols = [
  [1, 0],
  [0, 1],
];
const apply = (c: Cols, p: XY): XY => [c[0][0] * p[0] + c[1][0] * p[1], c[0][1] * p[0] + c[1][1] * p[1]];
/** `a` first, then `b`, as one matrix: b's move applied to a's columns */
const thenCols = (a: Cols, b: Cols): Cols => [apply(b, a[0]), apply(b, a[1])];
const flat = (c: Cols) => [c[0][0], c[0][1], c[1][0], c[1][1]];
const unflat = (n: number[]): Cols => [
  [n[0], n[1]],
  [n[2], n[3]],
];

/** filter 1, গরম: হলুদ যতটা, লাল ততটা বাড়ে — the 6.7 shear */
const WARM: Cols = [
  [1, 0],
  [1, 1],
];
/** filter 2, উজ্জ্বল: দুইটাই দ্বিগুণ */
const BRIGHT: Cols = [
  [2, 0],
  [0, 2],
];
/** the two as one: [[2, 2], [0, 2]] */
const TWO = thenCols(WARM, BRIGHT);
const PHOTO: XY = [1, 1];

/**
 * The photographer's fifty filters: গরম and উজ্জ্বল first, then 48 small turns
 * that shrink a little each (together they undo the doubling), so the
 * colour's path wanders and stays on the paper. PTS are the colour after each
 * filter, from (1, 1); ONE is all fifty as a single matrix.
 */
const FIFTY: Cols[] = [WARM, BRIGHT];
for (let i = 2; i < 50; i += 1) {
  const t = Math.sin(i * 1.7) * 0.2 - 0.004;
  const s = Math.pow(0.5, 1 / 48) * (1 + 0.03 * Math.cos(i * 0.9));
  FIFTY.push([
    [Math.cos(t) * s, Math.sin(t) * s],
    [-Math.sin(t) * s, Math.cos(t) * s],
  ]);
}
const PTS: XY[] = [PHOTO];
FIFTY.forEach((m) => PTS.push(apply(m, PTS[PTS.length - 1])));
const ONE = FIFTY.reduce((acc, m) => thenCols(acc, m), ID);

/** the contrast slider, slot by slot: dark goes darker, bright brighter (0 → 0, 2 → 2, 4 → 4) */
const bend = (v: number) => 2 - 2 * Math.cos((Math.PI * v) / 4);

const fix = (n: number) => {
  const r = Math.round(n * 10) / 10 || 0;
  return r < 0 ? `−${-r}` : `${r}`;
};

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

// ---------------------------------------------------------------------------
// Shared drawing: the colour paper, its lines carried by a move, the photo's
// dot, a 2 × 2 written out, and the stack of fifty filter chips.

/** Clip children to the white sheet (Plane doesn't clip; a moved grid runs off it). */
function A_Clip({ f, children }: { f: Frame; children: ReactNode }) {
  const id = `aclip${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={f.sx(f.x0)} y={f.sy(f.y1)} width={(f.x1 - f.x0) * f.u} height={(f.y1 - f.y0) * f.u} rx={3} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
}

/** The paper's lines carried by `m` (any move, so each line is sampled), from lo to hi both ways. */
function A_Grid({
  f,
  m,
  lo = -3,
  hi = 7,
  stroke = "#3b82f6",
  opacity = 0.4,
  width = 1,
  dash,
  diag = false,
}: {
  f: Frame;
  m: (p: XY) => XY;
  lo?: number;
  hi?: number;
  stroke?: string;
  opacity?: number;
  width?: number;
  dash?: string;
  diag?: boolean;
}) {
  const line = (a: XY, b: XY) => {
    let d = "";
    for (let i = 0; i <= 20; i += 1) {
      const t = i / 20;
      const p = m([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      d += `${i ? "L" : "M"}${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}`;
    }
    return d;
  };
  let d = "";
  for (let i = lo; i <= hi; i += 1) d += line([i, lo], [i, hi]) + line([lo, i], [hi, i]);
  let dd = "";
  if (diag) for (let c = -2; c <= 2; c += 2) dd += line([Math.max(lo, lo + c), Math.max(lo, lo - c)], [Math.min(hi, hi + c), Math.min(hi, hi - c)]);
  return (
    <A_Clip f={f}>
      <g className="pointer-events-none">
        <path d={d} fill="none" stroke={stroke} strokeOpacity={opacity} strokeWidth={width} strokeDasharray={dash} />
        {diag && <path d={dd} fill="none" stroke="#7c3aed" strokeOpacity={0.7} strokeWidth={1.4} strokeDasharray={dash} />}
      </g>
    </A_Clip>
  );
}

/** the two slots' names at the ends of the axes */
function A_Axes({ f }: { f: Frame }) {
  return (
    <g className="pointer-events-none">
      <text x={f.sx(f.x1) - 3} y={f.sy(0) - 4} textAnchor="end" fontSize={8.5} fontWeight={700} fill={RED}>
        লাল
      </text>
      <text x={f.sx(0) + 4} y={f.sy(f.y1) + 10} fontSize={8.5} fontWeight={700} fill={YEL}>
        হলুদ
      </text>
    </g>
  );
}

/** the photo's colour, a dot on the paper */
function A_Dot({ f, at, faint = false, r = 5 }: { f: Frame; at: XY; faint?: boolean; r?: number }) {
  return <circle cx={f.sx(at[0])} cy={f.sy(at[1])} r={r} fill={DOT} stroke={INK} strokeWidth={1.2} opacity={faint ? 0.35 : 1} className="pointer-events-none" />;
}

/** a 2 × 2 written out, its first column amber and its second teal, as the ropes */
function A_Mat({ cols, d = 2 }: { cols: Cols; d?: 1 | 2 }) {
  const n = (v: number) => (d === 1 ? fix(v) : num(v));
  return (
    <span className="inline-flex items-center gap-1 align-middle font-mono text-sm font-semibold">
      <span aria-hidden="true" className="h-9 w-1.5 rounded-l-sm border-y-2 border-l-2 border-foreground/60" />
      {cols.map((c, j) => (
        <span key={j} className={`grid gap-0.5 px-1 text-center ${j ? "text-[#0d9488]" : "text-[#b45309]"}`}>
          <span>{n(c[0])}</span>
          <span>{n(c[1])}</span>
        </span>
      ))}
      <span aria-hidden="true" className="h-9 w-1.5 rounded-r-sm border-y-2 border-r-2 border-foreground/60" />
    </span>
  );
}

const STACK_HUE = Array.from({ length: 50 }, (_, i) => `hsl(${(i * 37) % 360} 70% 55%)`);

/** where chip i sits once the fifty have been paired up `round` times (2^round per group) */
function stackAt(i: number, round: number): XY {
  const size = 2 ** round;
  const groups = Math.ceil(50 / size);
  const g = Math.floor(i / size);
  const perRow = Math.min(10, groups);
  const rows = Math.ceil(groups / perRow);
  const row = Math.floor(g / perRow);
  const inRow = row === rows - 1 ? groups - row * perRow : perRow;
  return [100 - (inRow * 19 - 5) / 2 + (g % perRow) * 19, 35 - (rows * 14 - 4) / 2 + row * 14];
}

/** The fifty filters as chips; each round of pairing slides every pair onto one spot. */
function A_Stack({ round, className = "mx-auto block h-auto w-full max-w-[15rem]" }: { round: number; className?: string }) {
  return (
    <svg viewBox="0 0 200 70" aria-hidden="true" className={className}>
      {STACK_HUE.map((c, i) => {
        const [x, y] = stackAt(i, round);
        return (
          <rect
            key={i}
            width={14}
            height={10}
            rx={2}
            fill={c}
            stroke="white"
            strokeWidth={0.8}
            style={{ transform: `translate(${x}px, ${y}px)` }}
            className="transition-transform duration-700 ease-in-out motion-reduce:transition-none"
          />
        );
      })}
    </svg>
  );
}

/** a drawn tick or cross (✓ ✕ glyphs turn into emoji on Linux) */
function A_Mark({ ok, className = "size-4" }: { ok: boolean; className?: string }) {
  return ok ? (
    <svg viewBox="0 0 12 12" className={`${className} ${POP}`} aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3.5" fill="none" stroke={OK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 12 12" className={`${className} ${POP}`} aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke={BAD} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. The fifty filters as chips. Three claims, each a small
//     picture of the chips (fifty apart · one · a few); the pick is acted out
//     on the big stack (the chips slide together as the claim says, or stay
//     apart), a "?" hangs on it, and it is sealed. The finale opens it.

const B1_OPTS = ["50 রকম সুন্দর, প্রতিটা নতুন কিছু দেয়", "আসলে একটাই filter", "মাঝামাঝি, কয়েকটা filter এর সমান"];
const B1_ROUND = [0, 6, 3];
const B1_SAY = ["50 টা আলাদা?", "একটা?", "কয়েকটা?"];

export function FilterBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const act = usePlay(800);
  const seal = (i: number) => {
    setBet(i);
    act.play(3, () => pass("বাজি সিল হলো। আগে দুইটা filter।"));
  };
  // beats of the acted bet: 1 the chips do what the claim says, 2 its "?", 3 sealed
  const k = bet === null ? 0 : act.running ? act.k : 3;
  const round = bet !== null && k >= 1 ? B1_ROUND[bet] : 0;
  return (
    <>
      <div className="relative mx-auto max-w-[17rem] rounded-xl bg-[#0f172a] p-2">
        <A_Stack round={round} />
        {bet !== null && k >= 2 && (
          <span className={`${POP} absolute top-1 right-2 inline-block text-xl font-extrabold text-[#fde047]`}>?</span>
        )}
      </div>
      <div className="mt-1.5 h-5 text-center text-sm text-muted">
        {bet !== null && k >= 1 ? <span className={`${FADE} font-semibold text-foreground`}>{B1_SAY[bet]}</span> : "প্রতিটা ছবি, 50 টা filter, একটার পর একটা।"}
      </div>
      <div className="mt-2 grid gap-2">
        {B1_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => seal(i)}>
            <span className="flex items-center gap-2.5 text-sm leading-tight">
              {bet === null && (
                <span className="shrink-0 rounded bg-[#0f172a] px-0.5">
                  <A_Stack round={B1_ROUND[i]} className="block h-6 w-auto" />
                </span>
              )}
              <span>{o}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={bet !== null && k >= 3}>50 টা filter পরপর চালালে আসলে কী হয়? একটায় বাজি ধরুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The first two filters on the colour (1, 1). The whole paper moves under
//     each filter, the ropes (where (1, 0) and (0, 1) land) with it. Stage 1:
//     গরম, then উজ্জ্বল: the dot hops to (2, 1), then (4, 2). Stage 2: the two
//     ropes sent through both, landing on (2, 0) and (2, 2): the one filter's
//     columns. Stage 3: that one filter, one hop, lands on (4, 2) too.

const TF_F = makeFrame(-0.6, 4.6, -0.6, 2.6, 30, 8);
const TF_SEQ: Record<"walk" | "ropes" | "one", Cols[]> = { walk: [ID, WARM, TWO], ropes: [ID, WARM, TWO], one: [ID, TWO] };
const TF_BTN = ["দুইটা filter পরপর চালান", "দড়ি দুইটা পাঠান", "নতুন filter, এক লাফে"];

export function TwoFilters() {
  const pass = useGate();
  const [phase, setPhase] = useSeed("phase", 0); // 0 fresh · 1 walked · 2 ropes sent · 3 one hop run
  const [what, setWhat] = useState<"walk" | "ropes" | "one">("walk");
  const p = usePlay(1000);
  const go = () => {
    if (p.running || phase >= 3) return;
    const w = (["walk", "ropes", "one"] as const)[phase];
    setWhat(w);
    p.play(TF_SEQ[w].length - 1, () => {
      setPhase(phase + 1);
      if (phase === 2) pass("দুই filter = একটা filter.");
    });
  };
  const target = p.running ? TF_SEQ[what][p.k] : phase === 0 ? ID : TWO;
  const cols = unflat(useTween(flat(target), 800));
  const f = TF_F;
  const dot = apply(cols, PHOTO);
  const ropes = p.running && what === "ropes";
  const hopping = p.running && what === "one";
  // which filter is working now (for the chips under the paper)
  const on = p.running && what !== "one" ? p.k : p.running ? 3 : 0;
  return (
    <>
      <div className="mx-auto w-full max-w-[20rem]">
        <Plane f={f} grid={1} ticks={1} label="লাল আর হলুদের কাগজ; ছবির রং (1, 1); filter পুরা কাগজ সরায়" className="my-0! max-w-none">
          <A_Grid f={f} m={(q) => apply(cols, q)} stroke="#475569" opacity={0.45} />
          <A_Axes f={f} />
          {/* the two hops, kept once walked */}
          {phase >= 1 && !(p.running && what === "walk") && (
            <path d={`M${f.sx(1)} ${f.sy(1)}L${f.sx(2)} ${f.sy(1)}L${f.sx(4)} ${f.sy(2)}`} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={1.4} strokeDasharray="4 3" />
          )}
          {phase >= 1 && <circle cx={f.sx(2)} cy={f.sy(1)} r={3} fill={INK} fillOpacity={0.35} />}
          {(phase >= 3 || hopping) && <Arrow f={f} from={PHOTO} to={[4, 2]} tone="violet" w={2.2} draw />}
          <Arrow f={f} from={[0, 0]} to={cols[0]} tone="amber" w={ropes ? 3 : 2} />
          <Arrow f={f} from={[0, 0]} to={cols[1]} tone="teal" w={ropes ? 3 : 2} />
          {!ropes && <A_Dot f={f} at={dot} />}
        </Plane>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs">
        {["গরম", "উজ্জ্বল"].map((n, i) => (
          <span key={n} className={`rounded-full border px-2.5 py-0.5 font-semibold transition-colors duration-300 motion-reduce:transition-none ${on === i + 1 ? "border-cat-blue bg-cat-blue text-white" : "border-border text-muted"}`}>
            {i + 1}. {n}
          </span>
        ))}
        {phase >= 2 && (
          <span className={`${POP} rounded-full border px-2.5 py-0.5 font-semibold ${on === 3 ? "border-cat-violet bg-cat-violet text-white" : "border-cat-violet text-cat-violet"}`}>নতুন filter</span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 items-center gap-2 text-center">
        <div>
          <div className="text-xs text-muted">ছবির রং</div>
          <div className="font-mono text-lg font-bold">
            <Tup v={[Math.round(dot[0] * 10) / 10, Math.round(dot[1] * 10) / 10]} of={SLOTS} />
          </div>
        </div>
        <div>
          <div className="text-xs text-muted">{phase >= 2 ? "দড়ি যেখানে থামলো" : "দড়ি দুইটা"}</div>
          {phase >= 2 ? (
            <div className={POP}>
              <A_Mat cols={TWO} />
            </div>
          ) : (
            <div className="font-mono text-sm font-semibold">
              <span className="text-[#b45309]">(1, 0)</span> <span className="text-[#0d9488]">(0, 1)</span>
            </div>
          )}
        </div>
      </div>
      {phase < 3 && (
        <div className="mt-3 flex justify-center">
          <button type="button" className={primaryBtn} disabled={p.running} onClick={go}>
            {TF_BTN[phase]}
          </button>
        </div>
      )}
      <Task done={phase >= 3}>আগে দুইটা filter পরপর চালান। তারপর দড়ি দুইটা পাঠান, আর নতুন filter টা এক লাফে চালান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · All fifty, folded pair by pair. Each tap pairs neighbours up (6.3's
//     "two moves are one move", done 25 times at once): the chips slide
//     together, the colour's path loses every other hop, and its end never
//     moves. The work for 300 photos shrinks with the count.

const FI_F = makeFrame(-0.4, 4.6, -0.4, 2.4, 30, 8);
/** the filter boundaries after `round` pairings: the path visits PTS only there */
const bounds = (round: number) => {
  const s = 2 ** round;
  const b: number[] = [];
  for (let i = 0; i < 50; i += s) b.push(i);
  b.push(50);
  return b;
};

export function FiftyIntoOne() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const groups = Math.ceil(50 / 2 ** round);
  const fold = () => {
    if (round >= 6) return;
    setRound(round + 1);
    if (round + 1 === 6) pass("পঞ্চাশটা linear filter = একটা।");
  };
  const f = FI_F;
  const pts = bounds(round).map((i) => PTS[i]);
  const d = pts.map((q, i) => `${i ? "L" : "M"}${f.sx(q[0]).toFixed(1)} ${f.sy(q[1]).toFixed(1)}`).join("");
  const end = PTS[50];
  const done = round >= 6;
  return (
    <>
      <div className="mx-auto max-w-[15rem] rounded-xl bg-[#0f172a] p-1.5">
        <A_Stack round={round} />
      </div>
      <div className="mx-auto mt-2 w-full max-w-[19rem]">
        <Plane f={f} grid={1} ticks={1} label="ছবির রং (1, 1) থেকে প্রতিটা filter এ এক লাফ; জোড়া লাগালে লাফ কমে, শেষ জায়গা একই" className="my-0! max-w-none">
          <A_Axes f={f} />
          <Draw key={round} d={d} ms={900} strokeWidth={1.4} className="stroke-cat-violet" />
          {pts.slice(1, -1).map((q, i) => (
            <circle key={`${round}-${i}`} cx={f.sx(q[0])} cy={f.sy(q[1])} r={1.8} fill="#7c3aed" className={FADE} />
          ))}
          <circle cx={f.sx(end[0])} cy={f.sy(end[1])} r={9} fill="none" stroke={OK} strokeWidth={1.6} strokeDasharray="3 2" />
          <A_Dot f={f} at={PHOTO} r={4} />
          <A_Dot f={f} at={end} r={4} />
        </Plane>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-xs text-muted">filter, মানে লাফ</div>
          <div key={groups} className={`${POP} font-mono text-lg font-bold`}>
            {groups}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted">300 ছবিতে filter চালানো</div>
          <div className="font-mono text-lg font-bold">{(groups * 300).toLocaleString("en-IN")} বার</div>
        </div>
      </div>
      <div className="mx-auto mt-1 h-2 max-w-[17rem] overflow-hidden rounded-full bg-foreground/10">
        <div className="h-full rounded-full bg-cat-amber transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${(groups / 50) * 100}%` }} />
      </div>
      <div className="mt-3 flex justify-center">
        {done ? (
          <div className={`${FADE} text-center text-sm`}>
            পঞ্চাশটা মিলে একটা filter: <A_Mat cols={ONE} d={1} />
          </div>
        ) : (
          <button type="button" className={primaryBtn} onClick={fold}>
            পাশাপাশি দুইটা করে জোড়া লাগান
          </button>
        )}
      </div>
      <Task done={done}>পাশাপাশি দুইটা করে জোড়া লাগান, যতক্ষণ না একটা থাকে। ছবির রং শেষে কোথায় থামে, দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The contrast slider. Predict first: will it fold in like the others?
//     The play bends the paper slot by slot (the gaps go uneven, the slanting
//     lines curve), then lays the best straight try over it (the matrix that
//     sends the ropes where contrast sends them) and a photo at (3, 3) lands
//     in two places: the red gap. Nothing straight fits.

const TB_F = makeFrame(-0.3, 4.3, -0.3, 4.3, 26, 8);
const TB_OPTS = ["ঢুকে যাবে, বাকিদের মতোই", "ঢুকবে না", "ঢুকবে, তবে ছবি কালো হয়ে যাবে"];
const TB_RIGHT = 1;
const TB_NOPE = [
  "Straight grid টা contrast এর ঘরের সাথে মিললো না। (3, 3) এর ছবি দুই জায়গায় গেলো: লাল ফাঁকটা দেখুন।",
  "",
  "ছবি কালো হয়নি। ঘরগুলো অসমান হলো, কোনাকুনি দাগ বেঁকে গেলো। কোনো straight grid এর সাথে মিলে না।",
];
const TB_TEST: XY = [3, 3];
const TB_S = bend(1);

export function TheBend() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed("ran", false);
  const p = usePlay(1100);
  const run = () => {
    if (p.running) return;
    p.play(3, () => {
      setRan(true);
      pass("Bend থাকলে আর এক হয় না।");
    });
  };
  const beat = ran ? 3 : p.k;
  const [t] = useTween([beat >= 1 ? 1 : 0], 900);
  const f = TB_F;
  const m = (q: XY): XY => [q[0] + t * (bend(q[0]) - q[0]), q[1] + t * (bend(q[1]) - q[1])];
  const bent: XY = [bend(TB_TEST[0]), bend(TB_TEST[1])];
  const straight: XY = [TB_S * TB_TEST[0], TB_S * TB_TEST[1]];
  return (
    <>
      <div className="mx-auto w-full max-w-[12rem]">
        <Plane f={f} grid={0} ticks={1} label="contrast এর পরে কাগজ: ঘর অসমান, কোনাকুনি দাগ বাঁকা; একটা straight grid মেলানোর চেষ্টা" className="my-0! max-w-none">
          <A_Grid f={f} m={m} lo={0} hi={4} diag />
          {beat >= 2 && <A_Grid f={f} m={(q) => [TB_S * q[0], TB_S * q[1]]} lo={0} hi={4} stroke="#0f1b2d" opacity={0.55} dash="3 3" />}
          <A_Axes f={f} />
          {beat >= 3 && (
            <g className={FADE}>
              <path d={`M${f.sx(straight[0])} ${f.sy(straight[1])}L${f.sx(bent[0])} ${f.sy(bent[1])}`} stroke={BAD} strokeWidth={2.4} strokeLinecap="round" />
              <A_Dot f={f} at={straight} faint />
              <A_Dot f={f} at={bent} />
            </g>
          )}
        </Plane>
      </div>
      <div className="mt-1 h-5 text-center text-xs text-muted">
        {beat >= 3 ? "(3, 3) এর ছবি: contrast এ এক জায়গায়, straight grid এ আরেক জায়গায়।" : beat >= 2 ? "সবচেয়ে কাছের straight grid, কালো ডট ডট দাগ।" : beat >= 1 ? "মাঝের ঘর চওড়া, কিনারার ঘর সরু।" : "চালানোর আগে guess দিন।"}
      </div>
      {guess === null && <div className="mt-2 text-sm font-medium text-muted">Contrast কি বাকি filter গুলোর সাথে জোড়া লাগবে?</div>}
      <div className="mt-1.5 grid gap-1.5">
        {TB_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, ran, TB_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="text-sm">{o}</span>
          </Choice>
        ))}
      </div>
      {guess !== null && !ran && (
        <div className="mt-3 flex justify-center">
          <button type="button" className={primaryBtn} disabled={p.running} onClick={run}>
            জোড়া লাগানোর চেষ্টা করুন
          </button>
        </div>
      )}
      {ran && guess !== null && guess !== TB_RIGHT && <Nope>{TB_NOPE[guess]}</Nope>}
      <Task done={ran}>আগে guess দিন। তারপর contrast কে একটা straight grid এ মেলানোর চেষ্টা করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · All 300 photos. Their colours are 300 dots on the paper, the rows of one
//     table X. One by one is too slow (twelve dots, and 288 still waiting);
//     all at once, one multiplication, every dot glides together.

const AP_F = makeFrame(-0.2, 3, -0.3, 1.5, 62, 8);
/** 300 photos' colours, each in (0.3 … 1.3), from a fixed seed */
const AP_PTS: XY[] = (() => {
  let s = 7;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: 300 }, () => [Math.round((0.3 + r()) * 100) / 100, Math.round((0.3 + r()) * 100) / 100] as XY);
})();
const AP_ONE_BY_ONE = 12;

export function AllPhotos() {
  const pass = useGate();
  const [phase, setPhase] = useSeed("phase", 0); // 0 fresh · 1 twelve done by hand · 2 all at once
  const p = usePlay(160);
  const slow = () => {
    if (p.running) return;
    p.play(AP_ONE_BY_ONE, () => setPhase(1));
  };
  const all = () => {
    setPhase(2);
    pass("সব ছবি এক গুণে: batch।");
  };
  const moved = phase >= 2 ? 300 : phase === 1 ? AP_ONE_BY_ONE : p.k;
  const f = AP_F;
  return (
    <>
      <div className="mx-auto w-full max-w-[19rem]">
        <Plane f={f} grid={1} ticks={1} label="300 টা ছবির রং, কাগজে 300 টা dot; filter চালালে dot সরে" className="my-0! max-w-none">
          <A_Axes f={f} />
          {AP_PTS.map((q, i) => {
            const at = i < moved ? apply(ONE, q) : q;
            return (
              <circle
                key={i}
                r={2}
                fill={i < moved ? "#7c3aed" : DOT}
                fillOpacity={0.75}
                style={{ transform: `translate(${f.sx(at[0]).toFixed(1)}px, ${f.sy(at[1]).toFixed(1)}px)` }}
                className="pointer-events-none transition-[transform,fill] duration-700 ease-in-out motion-reduce:transition-none"
              />
            );
          })}
        </Plane>
      </div>
      <div className="mt-2 grid grid-cols-[auto_1fr] items-start gap-3">
        <div className="rounded-lg border border-border px-2 py-1 text-xs leading-relaxed">
          <div className="text-muted">X, এক row এক ছবি</div>
          {[0, 1, 2].map((i) => (
            <div key={`${i}-${i < moved}`} className={`${FADE} font-mono`}>
              <Tup v={(i < moved ? apply(ONE, AP_PTS[i]) : AP_PTS[i]).map((v) => Math.round(v * 10) / 10)} of={SLOTS} />
            </div>
          ))}
          <div className="text-muted">… 300 টা row</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted">filter পার হলো</div>
          <div className="font-mono text-2xl font-bold">
            {moved} <span className="text-base text-muted">/ 300</span>
          </div>
          {phase === 1 && <div className={`${FADE} mt-1 text-xs text-danger`}>এভাবে বাকি 288 টা?</div>}
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        {phase === 0 ? (
          <button type="button" className={primaryBtn} disabled={p.running} onClick={slow}>
            একটা একটা করে চালান
          </button>
        ) : phase === 1 ? (
          <button type="button" className={primaryBtn} onClick={all}>
            সব row একসাথে, এক গুণে
          </button>
        ) : (
          <div className={`${FADE} font-mono text-sm font-semibold`}>X @ Wᵀ: 300 টা ছবি, একটা গুণ</div>
        )}
      </div>
      <Task done={phase >= 2}>আগে একটা একটা করে চালান। তারপর পুরা table টা একসাথে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shapes, for 6 and 7: a matrix as a box whose height is its rows and width
// its columns (a big count is capped and drawn with a torn edge), its shape
// written under it. A pair slides together; the inner two numbers light up,
// then vanish if they match, or turn red and the right box bounces back.

const sz = (n: number) => (n <= 7 ? 9 * n + 6 : 78);

function A_Box({ r, c, tone }: { r: number; c: number; tone: string }) {
  const big = r > 7 || c > 7;
  return (
    <div
      className={`relative shrink-0 rounded-md border-2 ${tone} ${big ? "border-dashed" : ""}`}
      style={{ width: `${sz(c) * 0.8}px`, height: `${sz(r) * 0.8}px` }}
    />
  );
}

type Pair = [[number, number], [number, number]];

/**
 * A pair of shapes. `k` 0 apart · 1 slid together · 2 the inner numbers light
 * up · 3 matched: they vanish and the result box grows; or not: red, and the
 * right one bounces back.
 */
function A_Pair({ pair, k }: { pair: Pair; k: number }) {
  const [[m, n], [n2, p]] = pair;
  const ok = n === n2;
  const inner = (v: number) => (
    <span
      className={`inline-block rounded px-0.5 transition-[opacity,color,background-color] duration-500 motion-reduce:transition-none ${
        k >= 2 ? (ok ? "bg-accent/15 text-accent-text" : "bg-danger/15 text-danger") : ""
      } ${k >= 3 && ok ? "opacity-0" : ""}`}
    >
      {v}
    </span>
  );
  const apart = k === 0 || (k >= 3 && !ok);
  return (
    <div className="flex min-h-[7.5rem] items-end justify-center gap-2">
      <div className="flex flex-col items-center gap-1">
        <A_Box r={m} c={n} tone="border-cat-blue bg-cat-blue/10" />
        <div className="font-mono text-sm font-semibold whitespace-nowrap">
          {m} × {inner(n)}
        </div>
      </div>
      <div
        className="flex flex-col items-center gap-1 transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(${apart ? 22 : -8}px)` }}
      >
        <A_Box r={n2} c={p} tone="border-cat-amber bg-cat-amber/10" />
        <div className="font-mono text-sm font-semibold whitespace-nowrap">
          {inner(n2)} × {p}
        </div>
      </div>
      <div className="flex w-20 flex-col items-center gap-1">
        {k >= 3 && ok && (
          <>
            <div className={POP}>
              <A_Box r={m} c={p} tone="border-cat-violet bg-cat-violet/15" />
            </div>
            <div className={`${FADE} font-mono text-sm font-bold whitespace-nowrap text-cat-violet`}>
              {m} × {p}
            </div>
          </>
        )}
        {k >= 3 && !ok && <div className={`${POP} text-2xl font-extrabold text-danger`}>?</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6 · Shapes of two matrices. Round 1: the photo table X (300 × 2) against
//     Wᵀ (2 × 2), played: the inner 2s click and vanish, 300 × 2 stays.
//     Round 2: the book's A (4 × 2) and B (2 × 3); the reader picks the
//     result's shape as a picture first; the play shows the real one, and a
//     wrong pick is left beside it as a dashed ghost.

const SF_PAIRS: Pair[] = [
  [
    [300, 2],
    [2, 2],
  ],
  [
    [4, 2],
    [2, 3],
  ],
];
const SF_OPTS: [number, number][] = [
  [2, 2],
  [4, 3],
  [4, 2],
];
const SF_RIGHT = 1;
const SF_NOPE = [
  "2 × 2 হলো ভেতরের দুইটা, যেগুলো মিলে গায়েব হয়। থাকে বাইরের দুইটা: A এর 4 row, B এর 3 column।",
  "",
  "4 × 2 তো A এর নিজের shape। B এর 3 টা column কোথায় গেলো? ফল B এর প্রতিটা column এর জন্য একটা করে column পায়।",
];

function SF_Icon({ r, c }: { r: number; c: number }) {
  return (
    <svg viewBox="0 0 34 30" aria-hidden="true" className="h-7 w-auto shrink-0">
      <rect x={1} y={1} width={c * 8} height={r * 6.5} rx={2} fill="#7c3aed" fillOpacity={0.15} stroke="#7c3aed" strokeWidth={1.4} />
    </svg>
  );
}

export function ShapeFits() {
  const pass = useGate();
  const [round, setRound] = useSeed("round", 0);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const p = usePlay(750);
  const [played, setPlayed] = useSeed("played", false);
  const meet = () => {
    if (p.running) return;
    p.play(3, () => {
      setPlayed(true);
    });
  };
  const next = () => {
    setRound(1);
    setPlayed(false);
    p.play(0);
  };
  const choose = (i: number) => {
    if (p.running) return;
    setPick(i);
    setPlayed(false);
    p.play(3, () => {
      setPlayed(true);
      if (i === SF_RIGHT) pass("ভেতরের দুইটা মিলতে হবে, বাইরের দুইটা থাকে।");
      else setMiss((x) => x + 1);
    });
  };
  const k = played ? 3 : p.k;
  const over = round === 1 && pick !== null && played;
  return (
    <>
      {round === 1 && <div className="mb-1 text-center font-mono text-xs text-muted">(300 × 2)(2 × 2) → 300 × 2</div>}
      <div className="rounded-xl border border-border px-2 py-3">
        <div className="mb-1 text-center text-xs text-muted">{round === 0 ? "ছবির table X, আর filter Wᵀ" : "বইয়ের A, আর B"}</div>
        <A_Pair pair={SF_PAIRS[round]} k={k} />
        {over && pick !== SF_RIGHT && (
          <div className={`${FADE} mt-1 flex items-center justify-center gap-2 text-xs text-danger`}>
            আপনার shape:
            <div className="rounded-md border-2 border-dashed border-danger" style={{ width: `${sz(SF_OPTS[pick][1]) * 0.8}px`, height: `${sz(SF_OPTS[pick][0]) * 0.8}px` }} />
            <span className="font-mono">
              {SF_OPTS[pick][0]} × {SF_OPTS[pick][1]}
            </span>
          </div>
        )}
      </div>
      {round === 0 ? (
        <div className="mt-3 flex justify-center">
          {played ? (
            <button type="button" className={primaryBtn} onClick={next}>
              এবার বইয়ের জোড়া
            </button>
          ) : (
            <button type="button" className={primaryBtn} disabled={p.running} onClick={meet}>
              দুইটা মেলান
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mt-3 text-sm font-medium text-muted">A আর B গুণ করলে ফল কোন shape?</div>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {SF_OPTS.map(([r, c], i) => (
              <Choice
                key={i}
                n={i}
                look={pick === i && played ? (i === SF_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"}
                disabled={p.running || (played && pick === SF_RIGHT)}
                onClick={() => choose(i)}
              >
                <span className="flex flex-col items-start gap-1">
                  <SF_Icon r={r} c={c} />
                  <span className="font-mono text-sm">
                    {r} × {c}
                  </span>
                </span>
              </Choice>
            ))}
          </div>
          {over && pick !== SF_RIGHT && <Nope key={miss}>{SF_NOPE[pick]}</Nope>}
        </>
      )}
      <Task done={over && pick === SF_RIGHT}>আগে ছবির table আর filter মেলান। তারপর বইয়ের A আর B: ফল কোন shape, বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn: six pairs. For each the reader says "গুণ হয়" or "হয় না";
//     the pair then slides together and shows it: a snap and the result's
//     shape, or red inner numbers and a bounce. A wrong call is played the
//     same way, then a Nope says what to look at; the reader calls again.

const SG_PAIRS: Pair[] = [
  [
    [5, 3],
    [3, 7],
  ],
  [
    [3, 7],
    [5, 3],
  ],
  [
    [64, 768],
    [768, 512],
  ],
  [
    [2, 3],
    [2, 3],
  ],
  [
    [2, 3],
    [3, 2],
  ],
  [
    [100, 300],
    [300, 1],
  ],
];
const sgNope = ([[m, n], [n2, p]]: Pair) =>
  n === n2
    ? `ভেতরের ${n} আর ${n2} মিলে গেলো। তাই গুণ হয়, ফল ${m} × ${p}.`
    : `${n} টা number খাওয়াচ্ছেন এমন কিছুকে, যে খায় ${n2} টা। ভেতরের দুইটা মেলেনি।`;

export function ShapeGame() {
  const pass = useGate();
  const [i, setI] = useSeed("i", 0);
  const [call, setCall] = useSeed<boolean | null>("call", null);
  const [played, setPlayed] = useSeed("played", false);
  const [miss, setMiss] = useState(0);
  const p = usePlay(650);
  const pair = SG_PAIRS[i];
  const legal = pair[0][1] === pair[1][0];
  const last = i === SG_PAIRS.length - 1;
  const judge = (v: boolean) => {
    if (p.running) return;
    setCall(v);
    setPlayed(false);
    p.play(3, () => {
      setPlayed(true);
      if (v !== legal) setMiss((x) => x + 1);
      else if (last) pass("ভেতরের সংখ্যা মিললেই গুণ হয়।");
    });
  };
  const next = () => {
    setI(i + 1);
    setCall(null);
    setPlayed(false);
    p.play(0);
  };
  const k = call === null ? 0 : played ? 3 : p.k;
  const right = played && call === legal;
  const doneAll = right && last;
  return (
    <>
      <div className="mb-2 flex justify-center gap-1.5">
        {SG_PAIRS.map((_, j) => (
          <span key={j} className={`grid size-6 place-items-center rounded-full border text-xs font-semibold ${j < i || (j === i && right) ? "border-accent bg-accent/15 text-accent-text" : j === i ? "border-cat-blue text-cat-blue" : "border-border text-muted"}`}>
            {j + 1}
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-border px-2 py-3">
        <A_Pair key={i} pair={pair} k={k} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[true, false].map((v) => (
          <Choice
            key={String(v)}
            n={v ? 0 : 1}
            look={call === v && played ? (v === legal ? "right" : "wrong") : call === v ? "picked" : "idle"}
            disabled={p.running || right}
            onClick={() => judge(v)}
          >
            <span className="text-sm font-semibold">{v ? "গুণ হয়" : "গুণ হয় না"}</span>
          </Choice>
        ))}
      </div>
      {played && call !== null && call !== legal && <Nope key={miss}>{sgNope(pair)}</Nope>}
      {right && !last && (
        <div className="mt-3 flex justify-center">
          <button type="button" className={primaryBtn} onClick={next}>
            পরের জোড়া
          </button>
        </div>
      )}
      <Task done={doneAll}>ছয়টা জোড়া। প্রতিটায় বলুন গুণ হয় কি না। হলে ফলের shape দেখে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it: a layer takes 300 numbers to 100. The reader sets W's rows and
//     columns (in hundreds); on "চালান" every wire W asks for is drawn. A
//     column count off 300 leaves input wires dangling (red ghosts); a row
//     count off 100 leaves outputs dangling. Right: every wire lands, and the
//     count runs to 30,000, plus 100 for b. Each dot on the picture is 10.

const TL_IN = 30;
const TL_OUT = 10;

function TL_Step({ label, value, set, disabled }: { label: string; value: number; set: (v: number) => void; disabled: boolean }) {
  const btn =
    "grid size-8 cursor-pointer place-items-center rounded-full text-lg font-bold text-muted transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-default disabled:opacity-30";
  return (
    <div className="text-center">
      <div className="text-xs text-muted">{label}</div>
      <span className="mt-0.5 inline-flex items-center rounded-full border border-border bg-surface p-0.5 font-mono">
        <button type="button" aria-label={`${label} 100 কম`} className={btn} disabled={disabled || value <= 100} onClick={() => set(value - 100)}>
          −
        </button>
        <span className="w-11 text-center text-lg font-semibold tabular-nums">{value}</span>
        <button type="button" aria-label={`${label} 100 বেশি`} className={btn} disabled={disabled || value >= 400} onClick={() => set(value + 100)}>
          +
        </button>
      </span>
    </div>
  );
}

export function TryLayerSize() {
  const pass = useGate();
  const [rows, setRows] = useSeed("rows", 200);
  const [cols, setCols] = useSeed("cols", 200);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const p = usePlay(900);
  const right = rows === 100 && cols === 300;
  const run = () => {
    if (p.running) return;
    setRan(false);
    p.play(1, () => {
      setRan(true);
      if (rows === 100 && cols === 300) pass("100 × 300: 30,000 weight, আর 100 টা b.");
      else setMiss((x) => x + 1);
    });
  };
  const change = (set: (v: number) => void) => (v: number) => {
    set(v);
    setRan(false);
  };
  const wIn = cols / 10;
  const wOut = rows / 10;
  const nIn = Math.max(TL_IN, wIn);
  const nOut = Math.max(TL_OUT, wOut);
  const yIn = (j: number) => 8 + (j * 164) / (nIn - 1);
  const yOut = (j: number) => 12 + (j * 156) / (nOut - 1);
  const shown = ran || p.running;
  let good = "";
  let bad = "";
  for (let a = 0; a < wIn; a += 1)
    for (let b = 0; b < wOut; b += 1) {
      const seg = `M34 ${yIn(a).toFixed(1)}L206 ${yOut(b).toFixed(1)}`;
      if (a < TL_IN && b < TL_OUT) good += seg;
      else bad += seg;
    }
  return (
    <>
      <svg viewBox="0 0 240 184" role="img" aria-label="বাঁয়ে 300 input, ডানে 100 output, প্রতিটা dot 10 টা; W এর প্রতিটা weight একটা তার" className="mx-auto block h-auto w-full rounded-lg bg-white max-w-[17rem]">
        {shown && (
          <g key={`${rows}-${cols}-${miss}`}>
            {good && <Draw d={good} ms={800} strokeWidth={0.25} className="stroke-cat-blue/60" />}
            {bad && <Draw d={bad} ms={800} strokeWidth={0.4} className="stroke-danger" />}
          </g>
        )}
        {Array.from({ length: nIn }, (_, j) => (
          <circle key={`i${j}`} cx={34} cy={yIn(j)} r={2.4} fill={j < TL_IN ? INK : "white"} stroke={j < TL_IN ? INK : BAD} strokeDasharray={j < TL_IN ? undefined : "1.5 1"} />
        ))}
        {Array.from({ length: nOut }, (_, j) => (
          <circle key={`o${j}`} cx={206} cy={yOut(j)} r={4} fill={j < TL_OUT ? "#7c3aed" : "white"} stroke={j < TL_OUT ? "#7c3aed" : BAD} strokeDasharray={j < TL_OUT ? undefined : "2 1.5"} />
        ))}
        <text x={2} y={181} fontSize={8} fill={INK}>
          300 input
        </text>
        <text x={238} y={181} textAnchor="end" fontSize={8} fill={INK}>
          100 output
        </text>
      </svg>
      <div className="text-center text-xs text-muted">প্রতিটা dot 10 টা number। প্রতিটা তার একটা weight।</div>
      <div className="mt-2 flex items-end justify-center gap-3">
        <TL_Step label="W এর row" value={rows} set={change(setRows)} disabled={p.running} />
        <span className="pb-2 font-mono text-lg text-muted">×</span>
        <TL_Step label="W এর column" value={cols} set={change(setCols)} disabled={p.running} />
        <button type="button" className={`${primaryBtn} px-4`} disabled={p.running || (ran && right)} onClick={run}>
          চালান
        </button>
      </div>
      {ran && right && (
        <div className={`${FADE} mt-2 text-center font-mono text-sm font-semibold`}>
          100 × 300 = 30,000 weight <span className="text-muted">+ 100 টা b</span>
        </div>
      )}
      {ran && !right && (
        <Nope key={miss}>
          {cols !== 300 && `column ${cols} টা মানে W ${cols} টা input চায়। layer দেয় 300 টা। `}
          {rows !== 100 && `row ${rows} টা মানে ${rows} টা output. layer দেয় 100 টা। `}
          লাল তারগুলো কোথাও লাগেনি।
        </Nope>
      )}
      <Task done={ran && right}>W কয় row, কয় column? ঠিক করে চালান। একটা তারও যেন ঝুলে না থাকে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · The album runs: one filter, then the contrast, on all 300 thumbnails.
//     They recolour in a sweep; beside it, the old fifty-filter way at the
//     same speed has only begun (600 runs against 15,000).

const AD_HUE = Array.from({ length: 300 }, (_, i) => (i * 53 + Math.floor(i / 20) * 17) % 60);

export function AlbumDone() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const p = usePlay(70);
  const run = () => {
    if (p.running || ran) return;
    p.play(20, () => {
      setRan(true);
      pass("একটা filter, একটা বাঁক। album শেষ।");
    });
  };
  const k = ran ? 20 : p.k;
  return (
    <>
      <div className="mx-auto max-w-[18rem] rounded-xl bg-[#0f172a] p-2">
        <svg viewBox="0 0 200 116" role="img" aria-label="300 টা ছবি, এক filter আর contrast এ বদলাচ্ছে" className="block h-auto w-full">
          {AD_HUE.map((h, i) => {
            const c = i % 20;
            const r = Math.floor(i / 20);
            const done = c < k;
            return (
              <rect
                key={i}
                x={2 + c * 9.9}
                y={2 + r * 7.6}
                width={8.6}
                height={6.4}
                rx={1}
                fill={done ? `hsl(${h} 85% ${r % 3 ? 52 : 40}%)` : `hsl(${h} 12% 55%)`}
                className="transition-[fill] duration-300 motion-reduce:transition-none"
              />
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold">
        <span className="rounded-full border border-cat-violet px-2.5 py-0.5 text-cat-violet">এক filter</span>
        <span className="text-muted">তারপর</span>
        <span className="rounded-full border border-cat-coral px-2.5 py-0.5 text-cat-coral">contrast</span>
      </div>
      <div className="mx-auto mt-3 grid max-w-[18rem] gap-2 text-xs">
        <div>
          <div className="flex justify-between">
            <span>এখন: এক filter আর contrast</span>
            <span className="font-mono">{Math.round((k / 20) * 600)} / 600</span>
          </div>
          <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full bg-cat-violet transition-[width] duration-100 motion-reduce:transition-none" style={{ width: `${(k / 20) * 100}%` }} />
          </div>
        </div>
        <div className="text-muted">
          <div className="flex justify-between">
            <span>আগের মতো 50 টা filter</span>
            <span className="font-mono">{Math.round((k / 20) * 600)} / 15,300</span>
          </div>
          <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full bg-cat-amber transition-[width] duration-100 motion-reduce:transition-none" style={{ width: `${(k / 20) * 4}%` }} />
          </div>
        </div>
      </div>
      {!ran && (
        <div className="mt-3 flex justify-center">
          <button type="button" className={primaryBtn} disabled={p.running} onClick={run}>
            album চালান
          </button>
        </div>
      )}
      <Task done={ran}>পুরা album চালান। দুইটা দাগ পাশাপাশি দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · The finale's widget: the three sealed claims as cards. A tap on a card
//      plays the fold on the chips, all the way (it never stops at fifty, nor
//      halfway), then marks the card. All three open → the bet is settled.

const BO_CARDS: [string, boolean, string][] = [
  ["50 রকম সুন্দর", false, "50 টা থাকে না। জোড়া লেগে 1 টা।"],
  ["আসলে একটাই filter", true, "ঠিক। 50 টা মিলে একটাই filter।"],
  ["মাঝামাঝি, কয়েকটার সমান", false, "মাঝপথে থামে না। একদম 1 এ গিয়ে থামে।"],
];

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [now, setNow] = useState<number | null>(null);
  const p = usePlay(260);
  const tap = (i: number) => {
    if (p.running || open.includes(i)) return;
    setNow(i);
    p.play(6, () => {
      const next = [...open, i];
      setOpen(next);
      setNow(null);
      if (next.length === 3) pass("পঞ্চাশটা filter ছিল একটা, বাঁক টাই আসল কাজ।");
    });
  };
  const round = p.running ? p.k : open.length ? 6 : 0;
  return (
    <>
      <div className="mx-auto max-w-[15rem] rounded-xl bg-[#0f172a] p-1.5">
        <A_Stack round={round} />
      </div>
      <div className="mt-1 text-center text-xs text-muted">{`filter: ${Math.ceil(50 / 2 ** round)} টা`}</div>
      <div className="mt-3 grid gap-2">
        {BO_CARDS.map(([t, ok, line], i) => {
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
                {shown && <span className={`${FADE} block text-xs text-muted`}>{line}</span>}
              </span>
              {shown ? <A_Mark ok={ok} className="size-5 shrink-0" /> : <span className="text-xs text-muted">খুলুন</span>}
            </button>
          );
        })}
      </div>
      <Task done={open.length === 3}>তিনটা বাজি একটা একটা করে খুলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Story scenes. The wedding pandal (a striped canopy, marigold strings), a
// plastic table with a laptop, the photographer in Mama's look with his name
// and a camera.

function A_Pandal() {
  return (
    <g className="pointer-events-none">
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M${i * 20} 0h20v16q-10 8 -20 0Z`} fill={i % 2 ? "#facc15" : "#dc2626"} />
      ))}
      <path d="M0 22Q80 34 160 22T320 22" fill="none" stroke="#ea580c" strokeWidth={2.4} strokeDasharray="0.1 5" strokeLinecap="round" />
      <rect x={6} y={10} width={4} height={140} fill="#a16207" />
      <rect x={310} y={10} width={4} height={140} fill="#a16207" />
    </g>
  );
}

function A_Name({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y + 11} textAnchor="middle" fontSize={8} fontWeight={600} fill={INK}>
      {text}
    </text>
  );
}

/** the photographer: Mama's look, a camera on his chest, his name under his feet */
function A_Photographer({ x, y, arm = "down", facing = 1 }: { x: number; y: number; arm?: "down" | "wave" | "hold" | "point"; facing?: 1 | -1 }) {
  return (
    <g>
      <Person who="mama" x={x} y={y} arm={arm} facing={facing} />
      <rect x={x - 5} y={y - 36} width={10} height={7} rx={1.5} fill="#1f2937" />
      <circle cx={x} cy={y - 32.5} r={2.2} fill="#64748b" />
      <A_Name x={x} y={y} text="ফটোগ্রাফার ভাই" />
    </g>
  );
}

/** a plastic table, feet on y, laptop on it; the screen's box is (x − 26, y − 70, 52 × 32) */
function A_Desk({ x, y, closed = false, children }: { x: number; y: number; closed?: boolean; children?: ReactNode }) {
  return (
    <g>
      <path d={`M${x - 26} ${y}l4 -30M${x + 26} ${y}l-4 -30`} stroke="#e5e7eb" strokeWidth={3} />
      <rect x={x - 32} y={y - 34} width={64} height={5} rx={2} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={0.8} />
      <path d={`M${x - 28} ${y - 34}h56l-3 -3h-50Z`} fill="#94a3b8" />
      {closed ? (
        <rect x={x - 27} y={y - 40} width={54} height={3} rx={1} fill="#334155" className="transition-all duration-500 motion-reduce:transition-none" />
      ) : (
        <>
          <rect x={x - 27} y={y - 71} width={54} height={34} rx={2} fill="#334155" />
          <rect x={x - 26} y={y - 70} width={52} height={32} rx={1} fill="#0f172a" />
          {children}
        </>
      )}
    </g>
  );
}

/** a progress line on the laptop screen, with its count */
function A_ScreenBar({ x, y, done, of = 300 }: { x: number; y: number; done: number; of?: number }) {
  return (
    <g>
      <rect x={x - 22} y={y - 44} width={44} height={3} rx={1.5} fill="#334155" />
      <rect x={x - 22} y={y - 44} width={(44 * done) / of} height={3} rx={1.5} fill="#22c55e" className="transition-[width] duration-700 motion-reduce:transition-none" />
      <text x={x} y={y - 50} textAnchor="middle" fontSize={6} fontFamily={MONO} fill="#e2e8f0">
        {done} / {of}
      </text>
      {/* the photo being worked on */}
      <rect x={x - 12} y={y - 67} width={24} height={13} rx={1} fill="#fde68a" />
      <circle cx={x - 4} cy={y - 62} r={2.6} fill="#f59e0b" />
      <path d={`M${x - 12} ${y - 54}l7 -5l5 3l6 -4l6 6Z`} fill="#16a34a" />
    </g>
  );
}

// 1a · The pandal's back corner: the photographer at his laptop, 3 of 300
//      done; the bar crawls; he wipes his forehead. Samin walks up and says
//      fifty aren't needed; the photographer answers without looking up.

export function WeddingCorner({}: Story) {
  const s = useScene(4, [600, 1600, 2200, 2400, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="বিয়ের দিন, প্যান্ডেলের কোণায় প্লাস্টিকের টেবিলে laptop; ফটোগ্রাফার ভাই, 300 এর 3 টা ছবি শেষ; সামিন বললো পঞ্চাশটা লাগবে না, একটাতেই হবে; ফটোগ্রাফার ভাই বললেন পঞ্চাশটা filter, পঞ্চাশ রকম সুন্দর, সময় তো লাগবেই">
        <A_Pandal />
        <A_Photographer x={96} y={150} arm={k === 1 ? "wave" : "down"} />
        <A_Desk x={150} y={150}>
          <A_ScreenBar x={150} y={150} done={k >= 1 ? 4 : 3} />
        </A_Desk>
        <Person who="samin" x={k >= 2 ? 236 : 360} y={150} facing={-1} walking={k === 2} label />
        {k === 2 && <Bubble x={236} y={84} side="left" lines={["পঞ্চাশটা লাগবে না।", "একটাতেই হবে।"]} />}
        {k === 3 && <Bubble x={96} y={84} side="right" lines={["পঞ্চাশটা filter,", "পঞ্চাশ রকম সুন্দর।"]} />}
        {k >= 4 && <Bubble x={96} y={84} side="right" lines={["সময় তো লাগবোই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 2a · Samin pulls the laptop his way and opens the filter list: fifty lines;
//      the first two light up, গরম and উজ্জ্বল.

export function SaminOpensList({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const rows = ["1 গরম", "2 উজ্জ্বল", "3 …", "50 …"];
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="সামিন laptop টা নিজের দিকে টেনে filter এর list খুললো; পঞ্চাশটা লাইন; প্রথম দুইটা গরম আর উজ্জ্বল">
        <A_Pandal />
        <A_Photographer x={80} y={150} />
        <A_Desk x={170} y={150}>
          {k >= 1 &&
            rows.map((r, i) => (
              <g key={r} className={FADE}>
                {k >= 2 && i < 2 && <rect x={146} y={83 + i * 7} width={48} height={6.4} rx={1} fill="#facc15" fillOpacity={0.35} />}
                <text x={148} y={88 + i * 7} fontSize={5.4} fill="#e2e8f0">
                  {r}
                </text>
              </g>
            ))}
        </A_Desk>
        <Person who="samin" x={218} y={150} facing={-1} label arm={k >= 1 ? "point" : "down"} />
        {k >= 3 && <Bubble x={218} y={84} side="left" lines={["আগে দুইটা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · The photographer drags the contrast slider on the laptop: the photo on
//      screen goes darker in the dark and brighter in the bright. His line;
//      Samin's.

export function ContrastSlider({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2200]);
  const k = s.k;
  const knob = k >= 1 ? 164 : 146;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="ফটোগ্রাফার ভাই laptop এ contrast এর slider টানলেন; ছবির অন্ধকার আরো অন্ধকার, আলো আরো আলো; সামিন বললো এইটাও জোড়া লাগাই">
        <A_Pandal />
        <A_Photographer x={96} y={150} arm={k >= 1 ? "point" : "down"} />
        <A_Desk x={150} y={150}>
          <rect x={130} y={84} width={40} height={20} rx={1} fill={k >= 1 ? "#fef08a" : "#fde68a"} className="transition-[fill] duration-700 motion-reduce:transition-none" />
          <rect x={130} y={96} width={40} height={8} fill={k >= 1 ? "#14532d" : "#16a34a"} className="transition-[fill] duration-700 motion-reduce:transition-none" />
          <circle cx={142} cy={90} r={3} fill={k >= 1 ? "#ea580c" : "#f59e0b"} className="transition-[fill] duration-700 motion-reduce:transition-none" />
          <path d="M136 111h28" stroke="#64748b" strokeWidth={1.4} />
          <circle cx={knob} cy={111} r={2.6} fill="#e2e8f0" className="transition-[cx] duration-700 motion-reduce:transition-none" />
        </A_Desk>
        <Person who="samin" x={236} y={150} facing={-1} label />
        {k === 2 && <Bubble x={96} y={84} side="right" lines={["অন্ধকার আরো অন্ধকার।", "আলো আরো আলো।"]} />}
        {k >= 3 && <Bubble x={236} y={84} side="left" lines={["এইটাও জোড়া লাগাই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 5a · A loudspeaker on a bamboo pole: বরপক্ষ খেতে বসছে. The photographer
//      looks at his watch; one by one? Samin: all at once.

export function MikeCall({}: Story) {
  const s = useScene(3, [600, 2000, 2000, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="মাইকে কেউ বললো বরপক্ষ খেতে বসছে; ফটোগ্রাফার ভাই ঘড়ি দেখলেন, একটা একটা করে 300 টা?; সামিন বললো সবগুলা একসাথে">
        <A_Pandal />
        <path d="M40 150V56" stroke="#a16207" strokeWidth={3} />
        <path d="M40 60l18 -10v24Z" fill="#94a3b8" stroke={INK} strokeOpacity={0.4} />
        {k >= 1 && <path d="M64 52q6 10 0 20M70 48q9 14 0 28" fill="none" stroke={INK} strokeOpacity={0.45} className={FADE} />}
        {k === 1 && <Bubble x={60} y={46} side="right" lines={["বরপক্ষ খেতে বসছে।"]} />}
        <A_Photographer x={130} y={150} arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && <circle cx={139} cy={106} r={2.4} fill="#fde047" stroke={INK} strokeWidth={0.6} className={POP} />}
        {k === 2 && <Bubble x={130} y={84} side="mid" tone="think" lines={["300 টা।", "একটা একটা করে?"]} />}
        <A_Desk x={190} y={150}>
          <A_ScreenBar x={190} y={150} done={0} />
        </A_Desk>
        <Person who="samin" x={258} y={150} facing={-1} label />
        {k >= 3 && <Bubble x={258} y={84} side="left" lines={["সবগুলা একসাথে।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 6a · Samin runs the sum on his own laptop, the wrong way round: the screen
//      goes red. He says nothing, swaps the order, runs it again: green.

export function SaminError({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2000]);
  const k = s.k;
  const line = k >= 3 ? "(300 × 2)(2 × 2)" : "(2 × 2)(300 × 2)";
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="সামিন নিজের laptop এ উল্টা order এ গুণ লিখলো, screen লাল, error; সে order ঠিক করে আবার চালালো, এবার চললো">
        <A_Pandal />
        <A_Desk x={160} y={150}>
          {k >= 1 && (
            <g key={k >= 3 ? "ok" : "bad"} className={FADE}>
              {k >= 2 && <rect x={134} y={80} width={52} height={32} fill={k >= 3 ? "#14532d" : "#7f1d1d"} />}
              <text x={160} y={92} textAnchor="middle" fontSize={5.6} fontFamily={MONO} fill="#e2e8f0">
                {line}
              </text>
              {k === 2 && <path d="M154 98l12 10M166 98l-12 10" stroke="#fca5a5" strokeWidth={1.6} strokeLinecap="round" />}
              {k >= 3 && <path d="M153 103l4 4l9 -9" fill="none" stroke="#86efac" strokeWidth={1.6} strokeLinecap="round" />}
            </g>
          )}
        </A_Desk>
        <Person who="samin" x={214} y={150} facing={-1} label arm={k === 1 || k >= 3 ? "point" : "down"} />
        <A_Photographer x={92} y={150} />
      </Stage>
    </StoryFrame>
  );
}

// 8a · Som has the photographer's app open: inside, a small network that finds
//      faces; one layer takes 300 numbers to 100. Som's question.

export function SomSettings({}: Story) {
  const s = useScene(3, [600, 1600, 2000, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="সোম ফটোগ্রাফার ভাইয়ের app এর setting ঘাঁটছে; ভেতরে একটা ছোট network, মুখ খুঁজে বের করে; একটা layer 300 টা number নেয়, 100 টা দেয়; সোম জিজ্ঞেস করলো এর W কত বড়">
        <A_Pandal />
        <A_Photographer x={84} y={150} />
        <A_Desk x={160} y={150}>
          {k >= 1 && (
            <g className={FADE}>
              {Array.from({ length: 8 }, (_, j) => (
                <circle key={`a${j}`} cx={142} cy={83 + j * 3.6} r={1.1} fill="#e2e8f0" />
              ))}
              {Array.from({ length: 3 }, (_, j) => (
                <circle key={`b${j}`} cx={178} cy={89 + j * 5} r={1.6} fill="#c4b5fd" />
              ))}
              {k >= 2 && <path d="M143 90L177 94M143 100L177 99M143 84L177 89M143 108L177 99" stroke="#94a3b8" strokeWidth={0.4} className={FADE} />}
              <text x={142} y={116} textAnchor="middle" fontSize={5} fontFamily={MONO} fill="#e2e8f0">
                300
              </text>
              <text x={178} y={116} textAnchor="middle" fontSize={5} fontFamily={MONO} fill="#e2e8f0">
                100
              </text>
            </g>
          )}
        </A_Desk>
        <Person who="som" x={220} y={150} facing={-1} label arm={k >= 1 ? "point" : "down"} />
        {k >= 3 && <Bubble x={220} y={84} side="left" lines={["এর W", "কত বড়?"]} />}
      </Stage>
    </StoryFrame>
  );
}

/** the বরের গাড়ি, decorated, rear at x, wheels on y */
function A_Car({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y - 22} width={70} height={16} rx={4} fill="#e2e8f0" stroke="#94a3b8" />
      <path d={`M${x + 14} ${y - 22}l8 -12h26l8 12Z`} fill="#cbd5e1" stroke="#94a3b8" />
      <circle cx={x + 16} cy={y - 5} r={6} fill="#1f2937" />
      <circle cx={x + 54} cy={y - 5} r={6} fill="#1f2937" />
      <path d={`M${x + 4} ${y - 20}q31 12 62 0`} fill="none" stroke="#f97316" strokeWidth={2.4} strokeDasharray="0.1 4" strokeLinecap="round" />
      <circle cx={x + 35} cy={y - 26} r={3} fill="#dc2626" />
    </g>
  );
}

// 9a · Half past four. The bar reaches 300; the photographer shuts the laptop;
//      the বরের গাড়ি rolls up to the gate and honks.

export function LastPhoto({}: Story) {
  const s = useScene(3, [600, 1600, 1600, 2000]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="সাড়ে চারটা; শেষ ছবিটা বের হলো, 300 এর 300; ফটোগ্রাফার ভাই laptop বন্ধ করলেন; গেটে বরের গাড়ির হর্ন">
        <A_Pandal />
        <A_Photographer x={70} y={150} arm={k === 2 ? "hold" : "down"} />
        <A_Desk x={124} y={150} closed={k >= 2}>
          <A_ScreenBar x={124} y={150} done={k >= 1 ? 300 : 299} />
        </A_Desk>
        <g style={{ transform: `translateX(${k >= 3 ? 0 : 150}px)` }} className="transition-transform duration-1000 ease-out motion-reduce:transition-none">
          <A_Car x={216} y={160} />
        </g>
        {k >= 3 && (
          <text x={236} y={112} fontSize={10} fontWeight={800} fill={INK} className={POP}>
            পঁ পঁ
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 10a · Eight at night. The album on Nana's lap; he turns the pages slowly;
//       one photo of Apa in yellow; his finger rests on it. No words.

export function NanaAlbum({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="রাত আটটা, প্যান্ডেলের বাতি; album নানার কোলে, নানা খুব ধীরে পাতা উল্টাচ্ছেন; একটা ছবিতে হলুদ শাড়িতে আপা; নানা ছবিটার উপর আঙুল রাখলেন">
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx={14 + i * 27} cy={18 + (i % 2) * 5} r={2.4} fill={["#fde047", "#f97316", "#f43f5e"][i % 3]} />
        ))}
        <path d="M0 16Q160 34 320 16" fill="none" stroke="#475569" strokeWidth={0.8} />
        <Person who="nana" x={160} y={150} arm={k >= 3 ? "point" : "hold"} />
        {/* the album, open in his hands */}
        <g>
          <rect x={146} y={110} width={40} height={24} rx={1.5} fill="#7f1d1d" />
          <rect x={148} y={112} width={17.5} height={20} fill="#fefce8" />
          <rect x={166.5} y={112} width={17.5} height={20} fill="#fefce8" />
          <rect x={150} y={115} width={13} height={9} fill={k >= 2 ? "#fde047" : "#cbd5e1"} />
          {k >= 2 && <circle cx={156.5} cy={119} r={2} fill="#ca8a04" className={POP} />}
          {k === 1 && <path d="M166.5 112l14 -3v20l-14 3Z" fill="#fef9c3" stroke="#a8a29e" strokeWidth={0.4} className={FADE} />}
        </g>
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// Explanation figures, each after the paragraph it shows.

// 1½ · One photo through fifty filters, one after another; then 300 photos.
//      Stopped at "?": does it really take fifty?

const X1_SAY = ["একটা ছবি। সামনে 50 টা filter।", "একটা একটা করে পার হয়।", "এক ছবিতেই 50 বার।", "300 টা ছবি: 15,000 বার।", "সত্যিই কি 50 বার লাগে?"];

export function FiftyInARow() {
  const s = useScene(4, [600, 1400, 1400, 1800, 2200]);
  const k = s.k;
  const at = k === 0 ? 8 : k === 1 ? 70 : 212;
  return (
    <Scene scene={s} caption={say(X1_SAY, k)}>
      <svg viewBox="0 0 240 80" role="img" aria-label="একটা ছবি 50 টা filter এর ভেতর দিয়ে একটা একটা করে যায়; 300 টা ছবিতে 15,000 বার" className="mx-auto block h-auto w-full rounded-lg bg-white max-w-[16rem]">
        {STACK_HUE.map((c, i) => (
          <rect key={i} x={28 + i * 3.6} y={20} width={2.6} height={30} rx={0.6} fill={c} />
        ))}
        <g style={{ transform: `translateX(${at}px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
          <rect x={-6} y={27} width={14} height={16} rx={1.5} fill="#fde68a" stroke={INK} strokeWidth={0.8} />
          <circle cx={-1} cy={32} r={2} fill={DOT} />
        </g>
        {k >= 3 &&
          Array.from({ length: 6 }, (_, i) => (
            <rect key={i} x={4 + i * 3} y={58 - i * 1.5} width={14} height={16} rx={1.5} fill="#fde68a" stroke={INK} strokeWidth={0.6} className={POP} />
          ))}
        {k >= 3 && (
          <text x={40} y={72} fontSize={8} fontFamily={MONO} fontWeight={700} fill={INK} className={FADE}>
            × 300
          </text>
        )}
        {k >= 4 && (
          <text x={222} y={72} textAnchor="middle" fontSize={20} fontWeight={800} fill="#7c3aed" className={POP}>
            ?
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 2½ · Two hops and one hop. The colour (1, 1) hops to (2, 1) and (4, 2); then
//      the one filter sends it straight there; the formula lands last; 6.6's
//      three stacked matrices called back.

const X2_F = makeFrame(-0.4, 4.6, -0.4, 2.6, 26, 6);
const X2_SAY = [
  "ছবির রং (1, 1)।",
  "গরম: (2, 1)। তারপর উজ্জ্বল: (4, 2)।",
  "দড়ি থেকে বানানো একটা filter: এক লাফে (4, 2)।",
  "W₂(W₁x) = (W₂W₁)x. দুই লাফ আর এক লাফ, একই জায়গা।",
  "6.6 এ তিনটা, এখানে দুইটা। শেষে একটাই matrix।",
];

export function TwoHopsOneHop() {
  const s = useScene(4, [600, 1600, 1600, 2400, 2200]);
  const k = s.k;
  const f = X2_F;
  return (
    <Scene scene={s} caption={say(X2_SAY, k)}>
      <div className="mx-auto w-full max-w-[14rem]">
        <Plane f={f} grid={1} ticks={1} label="ছবির রং (1, 1) দুই লাফে (4, 2) এ; নতুন filter এ এক লাফে একই জায়গায়" className="my-0! max-w-none">
          <A_Axes f={f} />
          {k >= 1 && (
            <>
              <Arrow f={f} from={PHOTO} to={[2, 1]} tone="blue" w={2} draw />
              <Arrow f={f} from={[2, 1]} to={[4, 2]} tone="blue" w={2} draw delay={600} />
            </>
          )}
          {k >= 2 && <Arrow f={f} from={PHOTO} to={[4, 2]} tone="violet" w={2.4} draw />}
          <A_Dot f={f} at={PHOTO} r={4} />
          {k >= 1 && <A_Dot f={f} at={[4, 2]} r={4} />}
          {k >= 4 && <circle cx={f.sx(4)} cy={f.sy(2)} r={10} fill="none" stroke={OK} strokeWidth={1.6} className={POP} />}
        </Plane>
      </div>
    </Scene>
  );
}

// 3½ · A network: five linear layers with nothing between them. They slide
//      together into one set of wires; "fifty, still one".

const X3_SAY = ["5 টা layer। মাঝে কিছু নাই, শুধু matrix।", "মাঝের layer গুলো জোড়া লাগে।", "5 টা মিলে 1 টা layer।", "50 টা হলেও 1 টা। দেখতে গভীর, কাজে এক layer।"];

export function LayersCollapse() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const xs = [20, 70, 120, 170, 220];
  const ys = [22, 44, 66];
  const x = (i: number) => (k >= 1 && i > 0 && i < 4 ? (k >= 2 ? 220 : xs[i] + (220 - xs[i]) * 0.5) : xs[i]);
  let wires = "";
  for (let i = 0; i < 4; i += 1)
    for (const a of ys)
      for (const b of ys) wires += `M${xs[i]} ${a}L${xs[i + 1]} ${b}`;
  let one = "";
  for (const a of ys) for (const b of ys) one += `M20 ${a}L220 ${b}`;
  return (
    <Scene scene={s} caption={say(X3_SAY, k)}>
      <svg viewBox="0 0 240 88" role="img" aria-label="পাঁচটা linear layer জোড়া লেগে একটা layer হয়" className="mx-auto block h-auto w-full rounded-lg bg-white max-w-[16rem]">
        {k < 2 ? <path d={wires} stroke="#94a3b8" strokeWidth={0.7} opacity={k === 1 ? 0.35 : 0.8} /> : <Draw d={one} ms={900} strokeWidth={0.9} className="stroke-cat-violet" />}
        {xs.map((_, i) =>
          ys.map((y) => (
            <circle
              key={`${i}-${y}`}
              r={4.2}
              fill={i === 0 ? DOT : i === 4 ? "#7c3aed" : "#cbd5e1"}
              stroke={INK}
              strokeWidth={0.6}
              opacity={k >= 2 && i > 0 && i < 4 ? 0 : 1}
              style={{ transform: `translate(${x(i)}px, ${y}px)` }}
              className="transition-[transform,opacity] duration-700 ease-in-out motion-reduce:transition-none"
            />
          )),
        )}
        {k >= 3 && (
          <text x={120} y={84} textAnchor="middle" fontSize={8} fontFamily={MONO} fontWeight={700} fill={INK} className={FADE}>
            W₅W₄W₃W₂W₁ = একটা W
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 4½ · A layer's three jobs, on a small paper: W slants the grid, + b slides
//      it, the bend makes the gaps uneven and curves the slant. The formula
//      builds under it.

const X4_F = makeFrame(-0.4, 5, -0.4, 5, 19, 6);
/** the same contrast bend, stretched to 0 … 5 so the moved grid stays where it bends one way */
const bend5 = (v: number) => 2.5 - 2.5 * Math.cos((Math.PI * Math.min(5, Math.max(0, v))) / 5);
const X4_SAY = ["কাগজ, সোজা ঘর।", "W: মেশায়। grid হেলে যায়, তবু সোজা আর সমান।", "+ b: পুরা কাগজ সরে। খুঁটিও সরে, যেটা matrix পারে না।", "bend: ঘর অসমান, দাগ বাঁকা। এটা আর জোড়া লাগে না।", "তিন কাজ মিলে একটা layer: bend(Wx + b)।"];
const X4_B: XY = [0.6, 0.4];

export function ThreeJobs() {
  const s = useScene(4, [600, 1600, 1800, 1800, 2400]);
  const k = s.k;
  const [w, b, t] = useTween([k >= 1 ? 1 : 0, k >= 2 ? 1 : 0, k >= 3 ? 1 : 0], 800);
  const f = X4_F;
  const m = (q: XY): XY => {
    const a: XY = [q[0] + w * 0.4 * q[1], q[1] * (1 - 0.1 * w)];
    const c: XY = [a[0] + b * X4_B[0], a[1] + b * X4_B[1]];
    return [c[0] + t * (bend5(c[0]) - c[0]), c[1] + t * (bend5(c[1]) - c[1])];
  };
  return (
    <Scene scene={s} caption={say(X4_SAY, k)}>
      <div className="mx-auto w-full max-w-[12rem]">
        <Plane f={f} grid={0} label="একটা layer এর তিন কাজ: W grid হেলায়, b সরায়, bend ঘর অসমান করে" className="my-0! max-w-none">
          <A_Grid f={f} m={m} lo={0} hi={3} diag />
          <circle cx={f.sx(m([0, 0])[0])} cy={f.sy(m([0, 0])[1])} r={3.4} fill={INK} className="pointer-events-none" />
          <A_Axes f={f} />
        </Plane>
      </div>
    </Scene>
  );
}

// 5½ · The table X, row by row, through one W: each row goes in and comes out
//      changed; then all of them together, one multiplication.

const X5_SAY = ["X এর প্রতিটা row একটা ছবির রং।", "row 1 W এর ভেতর দিয়ে গেলো।", "row 2, row 3: একই W, একই হিসাব।", "কেউ কারো জন্য বসে থাকে না। তাই সবগুলা একসাথে: একটা গুণ।"];

export function RowsThroughOne() {
  const s = useScene(3, [600, 1600, 1800, 2400]);
  const k = s.k;
  const rows = [0, 1, 2, 3];
  const gone = (i: number) => (k >= 3 ? true : k === 2 ? i < 3 : k === 1 ? i < 1 : false);
  return (
    <Scene scene={s} caption={say(X5_SAY, k)}>
      <svg viewBox="0 0 240 92" role="img" aria-label="X এর row গুলো একটা W এর ভেতর দিয়ে যায়, বদলে বের হয়" className="mx-auto block h-auto w-full rounded-lg bg-white max-w-[16rem]">
        <rect x={104} y={10} width={32} height={72} rx={4} fill="#ede9fe" stroke="#7c3aed" strokeWidth={1.4} />
        <text x={120} y={50} textAnchor="middle" fontSize={11} fontFamily={MONO} fontWeight={700} fill="#6d28d9">
          W
        </text>
        {rows.map((i) => (
          <g key={i} style={{ transform: `translateX(${gone(i) ? 150 : 0}px)` }} className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none">
            <rect x={14} y={14 + i * 17} width={62} height={12} rx={2} fill={gone(i) ? "#ddd6fe" : "#fde68a"} stroke={INK} strokeOpacity={0.4} className="transition-[fill] duration-700 motion-reduce:transition-none" />
            <text x={45} y={23 + i * 17} textAnchor="middle" fontSize={7} fontFamily={MONO} fill={INK}>
              {i === 3 ? "…" : `ছবি ${i + 1}`}
            </text>
          </g>
        ))}
      </svg>
    </Scene>
  );
}

// 5½b · For the side note: the textbook puts one photo as a column after W
//       (Wx); code stacks photos as rows before Wᵀ (X @ Wᵀ). The same sums,
//       turned sideways.

const X5B_SAY = ["বইয়ে: W এর পরে একটা ছবি, খাড়া column: Wx।", "Code এ: ছবি শোয়ানো row, সবার আগে: X @ Wᵀ।", "একই হিসাব, দুই পাশই কাত করা। 6.1 এর ᵀ।"];

export function ColumnOrRow() {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X5B_SAY, k)}>
      <svg viewBox="0 0 240 70" role="img" aria-label="Wx: W এর পরে খাড়া column; X @ Wᵀ: শোয়ানো row আগে, তারপর Wᵀ" className="mx-auto block h-auto w-full rounded-lg bg-white max-w-[16rem]">
        <g opacity={k >= 2 ? 0.5 : 1} className="transition-opacity duration-500 motion-reduce:transition-none">
          <rect x={20} y={12} width={30} height={30} rx={3} fill="#ede9fe" stroke="#7c3aed" />
          <text x={35} y={31} textAnchor="middle" fontSize={10} fontFamily={MONO} fontWeight={700} fill="#6d28d9">
            W
          </text>
          <rect x={56} y={12} width={10} height={30} rx={2} fill="#fde68a" stroke={INK} strokeOpacity={0.5} />
          <text x={61} y={56} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={INK}>
            x
          </text>
        </g>
        {k >= 1 && (
          <g className={FADE}>
            <rect x={130} y={22} width={30} height={10} rx={2} fill="#fde68a" stroke={INK} strokeOpacity={0.5} />
            <text x={145} y={56} textAnchor="middle" fontSize={8} fontFamily={MONO} fill={INK}>
              X
            </text>
            <text x={170} y={31} textAnchor="middle" fontSize={9} fontFamily={MONO} fill={INK}>
              @
            </text>
            <rect x={180} y={12} width={30} height={30} rx={3} fill="#ede9fe" stroke="#7c3aed" />
            <text x={195} y={31} textAnchor="middle" fontSize={10} fontFamily={MONO} fontWeight={700} fill="#6d28d9">
              Wᵀ
            </text>
          </g>
        )}
        {k >= 2 && <path d="M70 27q30 -22 56 0" fill="none" stroke={OK} strokeWidth={1.4} strokeDasharray="3 2" className={FADE} />}
      </svg>
    </Scene>
  );
}

// 6½ · The book's example, cell by cell: A (4 × 2), B (2 × 3), C filling one
//      row a beat; then rows 2 and 4 light up together, as A's did.

const X6_A = [
  [2, 4],
  [1, 1],
  [3, 2],
  [1, 1],
];
const X6_B = [
  [1, 2, 1],
  [3, 1, 2],
];
const X6_C = X6_A.map((r) => [0, 1, 2].map((j) => r[0] * X6_B[0][j] + r[1] * X6_B[1][j]));
const X6_SAY = [
  "A: 4 × 2. B: 2 × 3. ফল হবে 4 × 3।",
  "row 1 · প্রতিটা column: 14, 8, 10.",
  "row 2: 4, 3, 3. row 3: 9, 8, 7.",
  "row 4: 4, 3, 3. আবার?",
  "A এর row 2 আর row 4 এক। তাই C এরও।",
];

function X6_Grid({ x, y, rows, lit, shown }: { x: number; y: number; rows: number[][]; lit: number[]; shown: number }) {
  return (
    <g>
      {rows.map((r, i) =>
        r.map((v, j) => (
          <g key={`${i}${j}`}>
            {lit.includes(i) && j === 0 && <rect x={x - 3} y={y + i * 12 - 9} width={r.length * 16 + 2} height={11} rx={2} fill="#fde047" fillOpacity={0.5} className={FADE} />}
            {i < shown && (
              <text x={x + j * 16 + 6} y={y + i * 12} textAnchor="middle" fontSize={8} fontFamily={MONO} fontWeight={600} fill={INK} className={FADE}>
                {v}
              </text>
            )}
          </g>
        )),
      )}
      <path d={`M${x - 4} ${y - 10}h-2v${rows.length * 12}h2M${x + rows[0].length * 16} ${y - 10}h2v${rows.length * 12}h-2`} fill="none" stroke={INK} strokeOpacity={0.6} />
    </g>
  );
}

export function BookC() {
  const s = useScene(4, [600, 1800, 1800, 1800, 2400]);
  const k = s.k;
  const shown = k === 0 ? 0 : k === 1 ? 1 : k === 2 ? 3 : 4;
  const lit = k >= 4 ? [1, 3] : [];
  return (
    <Scene scene={s} caption={say(X6_SAY, k)}>
      <svg viewBox="0 0 240 70" role="img" aria-label="বইয়ের উদাহরণ: A (4 × 2) গুণ B (2 × 3) = C (4 × 3); C এর row 2 আর row 4 এক, কারণ A এরও" className="mx-auto block h-auto w-full rounded-lg bg-white max-w-[16rem]">
        <X6_Grid x={14} y={16} rows={X6_A} lit={lit} shown={4} />
        <X6_Grid x={70} y={22} rows={X6_B} lit={[]} shown={2} />
        <text x={130} y={36} fontSize={10} fill={INK}>
          =
        </text>
        <X6_Grid x={148} y={16} rows={X6_C} lit={lit} shown={shown} />
      </svg>
    </Scene>
  );
}

// 7½ · A layer 768 → 512 as its matrix: one row per output, one column per
//      input; the count of its numbers.

const X7_SAY = ["একটা layer: 768 টা number ঢোকে, 512 টা বের হয়।", "প্রতিটা output এর এক row: 512 টা row।", "প্রতিটা row তে প্রতিটা input এর এক weight: 768 টা column।", "512 × 768: 393,216 টা number, এক layer এই।"];

export function LayerMatrix() {
  const s = useScene(3, [600, 1800, 1800, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X7_SAY, k)}>
      <svg viewBox="0 0 240 90" role="img" aria-label="768 থেকে 512 এর layer একটা 512 × 768 matrix, 393,216 টা number" className="mx-auto block h-auto w-full rounded-lg bg-white max-w-[16rem]">
        <rect x={14} y={10} width={10} height={70} rx={2} fill="#fde68a" stroke={INK} strokeOpacity={0.4} />
        <text x={19} y={88} textAnchor="middle" fontSize={7} fontFamily={MONO} fill={INK}>
          768
        </text>
        <rect x={216} y={20} width={10} height={50} rx={2} fill="#ddd6fe" stroke={INK} strokeOpacity={0.4} />
        <text x={221} y={80} textAnchor="middle" fontSize={7} fontFamily={MONO} fill={INK}>
          512
        </text>
        {k >= 1 && <rect x={60} y={20} width={120} height={k >= 2 ? 50 : 4} rx={2} fill="#ede9fe" stroke="#7c3aed" className="transition-[height] duration-700 motion-reduce:transition-none" />}
        {k >= 1 && (
          <text x={54} y={48} textAnchor="end" fontSize={7} fontFamily={MONO} fill="#6d28d9" className={FADE}>
            512
          </text>
        )}
        {k >= 2 && (
          <text x={120} y={16} textAnchor="middle" fontSize={7} fontFamily={MONO} fill="#6d28d9" className={FADE}>
            768
          </text>
        )}
        {k >= 3 && (
          <text x={120} y={49} textAnchor="middle" fontSize={9} fontFamily={MONO} fontWeight={700} fill={INK} className={POP}>
            393,216
          </text>
        )}
      </svg>
    </Scene>
  );
}

// 8½ · One output and its wires: one row of W, 300 weights; then all 100.

const X8_SAY = ["একটা output.", "তার তার: প্রতিটা input থেকে একটা। 300 টা weight, W এর এক row.", "100 টা output, 100 টা row: 100 × 300."];

export function RowPerOutput() {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  const yIn = (j: number) => 6 + j * 3;
  const yOut = (j: number) => 10 + j * 9;
  let one = "";
  for (let a = 0; a < 30; a += 1) one += `M30 ${yIn(a)}L200 ${yOut(0)}`;
  let all = "";
  for (let b = 1; b < 10; b += 1) for (let a = 0; a < 30; a += 3) all += `M30 ${yIn(a)}L200 ${yOut(b)}`;
  return (
    <Scene scene={s} caption={say(X8_SAY, k)}>
      <svg viewBox="0 0 230 100" role="img" aria-label="একটা output এর 300 টা তার, W এর এক row; 100 টা output মানে 100 row" className="mx-auto block h-auto w-full rounded-lg bg-white max-w-[15rem]">
        {k >= 1 && <Draw d={one} ms={800} strokeWidth={0.4} className="stroke-cat-violet" />}
        {k >= 2 && <Draw d={all} ms={900} strokeWidth={0.2} className="stroke-cat-blue/60" />}
        {Array.from({ length: 30 }, (_, j) => (
          <circle key={j} cx={30} cy={yIn(j)} r={1.2} fill={INK} />
        ))}
        {Array.from({ length: 10 }, (_, j) => (
          <circle key={j} cx={200} cy={yOut(j)} r={3} fill={j === 0 && k >= 1 ? "#7c3aed" : "#cbd5e1"} stroke={INK} strokeWidth={0.5} />
        ))}
      </svg>
    </Scene>
  );
}

// 10½ · The recap: fifty chips fold into one; the bend added after it; the
//       300 photos through both in one multiplication.

const X10_SAY = ["50 টা linear filter.", "জোড়া লেগে একটা।", "তার পরে একটা বাঁক: contrast।", "300 ছবি, এক গুণে, তারপর বাঁক। album শেষ।"];

export function AlbumRecap() {
  const s = useScene(3, [600, 1400, 1600, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(X10_SAY, k)}>
      <div className="mx-auto flex max-w-[17rem] items-center justify-center gap-2">
        <div className="w-32 rounded-lg bg-[#0f172a] p-1">
          <A_Stack round={k >= 1 ? 6 : 0} className="block h-auto w-full" />
        </div>
        {k >= 2 && (
          <svg viewBox="0 0 40 40" aria-hidden="true" className={`${POP} size-10`}>
            <path d="M4 34C14 34 14 6 20 6S26 34 36 34" fill="none" stroke="#f43f5e" strokeWidth={3} strokeLinecap="round" />
          </svg>
        )}
        {k >= 3 && <div className={`${POP} rounded-md bg-cat-violet/15 px-2 py-1 font-mono text-xs font-bold text-cat-violet`}>× 300</div>}
      </div>
    </Scene>
  );
}

// 10½b · The bridge: Nana goes in and comes back with a folded gamcha he wove
//        for the বর; unfolded, a check from two threads, up and across. "?".

export function NanaGamcha() {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  const cells: ReactNode[] = [];
  for (let i = 0; i < 6; i += 1)
    for (let j = 0; j < 6; j += 1) {
      const up = i % 3 === 0;
      const across = j % 3 === 0;
      cells.push(<rect key={`${i}${j}`} x={130 + i * 10} y={70 + j * 8} width={10} height={8} fill={up && across ? "#7f1d1d" : up || across ? "#dc2626" : "#16a34a"} opacity={up || across ? 1 : 0.8} />);
    }
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="নানা album পাশে রেখে ঘরে গেলেন; ফিরলেন একটা ভাঁজ করা গামছা হাতে, বরের জন্য নিজের তাঁতে বোনা; মেললে দুই রঙের সুতায় চেক, লম্বালম্বি আর আড়াআড়ি">
        <rect x={20} y={70} width={60} height={80} fill="#78350f" />
        <rect x={34} y={86} width={32} height={64} fill="#1c1917" />
        <Person who="nana" x={k >= 1 ? 100 : 50} y={150} walking={k === 1} arm={k >= 1 ? "hold" : "down"} />
        {k === 1 && <rect x={106} y={102} width={16} height={10} fill="#dc2626" stroke="#7f1d1d" strokeWidth={0.6} className={POP} />}
        {k >= 2 && <g className={FADE}>{cells}</g>}
        {k >= 3 && (
          <text x={210} y={100} fontSize={22} fontWeight={800} fill="#fde047" className={POP}>
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
  FilterBet: { start: {}, sealed: { bet: 1 }, many: { bet: 0 }, few: { bet: 2 } },
  TwoFilters: { start: {}, walked: { phase: 1 }, ropes: { phase: 2 }, done: { phase: 3 } },
  FiftyIntoOne: { start: {}, mid: { round: 3 }, done: { round: 6 } },
  TheBend: { start: {}, guessed: { guess: 0 }, wrong: { guess: 0, ran: true }, right: { guess: 1, ran: true } },
  AllPhotos: { start: {}, slow: { phase: 1 }, done: { phase: 2 } },
  ShapeFits: { start: {}, played: { played: true }, book: { round: 1 }, wrong: { round: 1, pick: 0, played: true }, right: { round: 1, pick: 1, played: true } },
  ShapeGame: { start: {}, legal: { call: true, played: true }, wrongCall: { i: 1, call: true, played: true }, big: { i: 2, call: true, played: true }, last: { i: 5, call: true, played: true } },
  TryLayerSize: { start: {}, flipped: { rows: 300, cols: 100, ran: true }, right: { rows: 100, cols: 300, ran: true } },
  AlbumDone: { start: {}, done: { ran: true } },
  BetOpen: { start: {}, one: { open: [0] }, done: { open: [0, 1, 2] } },
  WeddingCorner: { rest: { k: 0 }, samin: { k: 2 }, answer: { k: 3 }, done: {} },
  SaminOpensList: { list: { k: 1 }, done: {} },
  ContrastSlider: { rest: { k: 0 }, line: { k: 2 }, done: {} },
  MikeCall: { mike: { k: 1 }, think: { k: 2 }, done: {} },
  SaminError: { red: { k: 2 }, done: {} },
  SomSettings: { rest: { k: 1 }, done: {} },
  LastPhoto: { full: { k: 1 }, closed: { k: 2 }, done: {} },
  NanaAlbum: { turn: { k: 1 }, done: {} },
  FiftyInARow: { mid: { k: 1 }, many: { k: 3 }, done: {} },
  TwoHopsOneHop: { hops: { k: 1 }, done: {} },
  LayersCollapse: { rest: { k: 0 }, sliding: { k: 1 }, done: {} },
  ThreeJobs: { w: { k: 1 }, b: { k: 2 }, done: {} },
  RowsThroughOne: { one: { k: 1 }, done: {} },
  ColumnOrRow: { one: { k: 1 }, done: {} },
  BookC: { row1: { k: 1 }, done: {} },
  LayerMatrix: { rows: { k: 1 }, done: {} },
  RowPerOutput: { one: { k: 1 }, done: {} },
  AlbumRecap: { one: { k: 1 }, done: {} },
  NanaGamcha: { walk: { k: 1 }, done: {} },
};
