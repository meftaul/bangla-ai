"use client";

import { useState, type ReactNode } from "react";

import { Bubble, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, FADE, Nope, POP, Scene, Stepper, predictLook, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures } from "@/components/journey/kit";
import { Arrow, type Frame, type XY } from "@/components/journey/plane";
import { LightBhai, Projector, STAGE_WALL_F, StageBeam, StageWall, byCols, partway, pathOf, projectorLens, useLensRun, type Cols } from "./light-kit";
import {
  CutPieces,
  FLOWER_CELLS,
  FLOWER_OUTLINE,
  KoutaCount,
  KoutaRow,
  LENS_G,
  LENS_H,
  LENS_L,
  PK,
  PaintFill,
  Patch,
  PatchWall,
  StageBrush,
  StageKouta,
  StageMora,
  TargetCells,
  UnitTile,
  cellPoly,
  mapPts,
  moves,
  patchFrame,
  planPatch,
  wholeCells,
  type PatchPlan,
} from "./patch-kit";

// Screens for "Math for AI 8.1 — রঙের কৌটা, জায়গা কতগুণ", told as a Journey
// in the author's Bangla-English. The plan is 08_journey_specs.md, block 8.1.
// It pays the first half of 7.6's SquareQuestion: the light machine's square
// through the lens becomes a slanted patch; how many times bigger?
//
// The morning after বিদায়. Rina wants to paint the লাইট ভাই's light pattern
// (her small ফুল stencil, 5 ঘর, thrown through 7.3's G = [[2, 1], [1, 2]])
// on the wall for good before আপার ফিরানি. One chalk ঘর = one কৌটা রং. She
// has 5 কৌটা। মামা goes to the বাজার once. The লাইট ভাই: লেন্সে দুই লেখা,
// দুইগুণ।
//
// Nine screens. 1 seals the bet: 2× · 3× · 4× · 6× (PatchBet). 2 one ঘর
// through G, cut and slide: 3 (CountSquares). 3 predict, then the ফুল tile by
// tile: 15 (EveryShape). 4 the লাইট ভাই's L and H: 4 and ¼ (TwoMoreLenses).
// 5 the patch's sides are the lens's columns (OnlyTheColumns). 6 Your turn:
// [[2, 1], [0, 2]], cut, slide, set the কৌটা (YourPatch). 7 Try it: a 4-ঘর
// ঘুড়ি through a lens that makes one ঘর two; which row of কৌটা (TryPaint).
// 8 the bet opened on the painted ফুল (BetOpen). 9 the end (MDX only).
//
// After the screens: the story scenes (MorningWall, FourCounts, RinaStencil,
// BagLenses, NoonPaint, EveningWall, AminCall) and the watch-only figures
// (StakeFig, CutPaper, TilesTriple, ThreeLenses, ColumnsDraw, RecapFig),
// each numbered after its screen.
//
// The patch, the cut and slide, the wall and the কৌটা come from patch-kit.tsx
// (new, shared by 8.3–8.7); the machine and the লাইট ভাই from light-kit.tsx
// (read-only).

const INK = "#0f1b2d";
const MONO = "ui-monospace, monospace";

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
export type Story = { story?: boolean };

/** a caption that fades in afresh on every beat; a tuple never breaks across lines */
const say = (lines: readonly string[], k: number) => (
  <span key={k} className={FADE}>
    {lines[k].replace(/, (?=[\d−?])/g, ", ")}
  </span>
);

const frac = (v: number) => (v === 0.5 ? "½" : v === 0.25 ? "¼" : v < 0 ? `−${-v}` : `${v}`);

/** A lens as a matrix, columns side by side (knob 1 amber, knob 2 teal); ½ written as ½. `hi` rings one column. */
function P_Lens({ cols, name, hi, small = false }: { cols: Cols; name?: ReactNode; hi?: 0 | 1 | null; small?: boolean }) {
  const tone = ["text-cat-amber", "text-cat-teal"];
  const cell = small ? "w-4 text-xs" : "w-5 text-sm";
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {name && <span className="text-sm">{name}</span>}
      <span className={`inline-flex items-stretch font-mono font-bold ${small ? "text-xs" : "text-sm"}`}>
        <span className="w-1 rounded-l-sm border-y-2 border-l-2 border-current opacity-60" />
        {[0, 1].map((c) => (
          <span key={c} className={`flex flex-col items-center rounded px-0.5 transition-colors duration-300 motion-reduce:transition-none ${tone[c]} ${hi === c ? "bg-current/15 ring-2 ring-current" : ""}`}>
            <span className={`${cell} text-center`}>{frac(cols[c][0])}</span>
            <span className={`${cell} text-center`}>{frac(cols[c][1])}</span>
          </span>
        ))}
        <span className="w-1 rounded-r-sm border-y-2 border-r-2 border-current opacity-60" />
      </span>
    </span>
  );
}

const pathD = (f: Frame, pts: readonly XY[]) => pts.map((p, i) => `${i ? "L" : "M"}${f.sx(p[0]).toFixed(1)} ${f.sy(p[1]).toFixed(1)}`).join("") + "Z";

/** The ফুল through G, as one outline on the wall. */
const FLOWER_G = mapPts(LENS_G, FLOWER_OUTLINE);

// ---------------------------------------------------------------------------
// 1 · The sealed bet. 7.6's picture: the stencil's one ঘর of light, and the
//     slanted patch it becomes through G. Four cards, each a person's claim.
//     Sealing acts it out: that many কৌটা stand by the patch, with a "?".

const X1_CARDS = [
  { who: "লাইট ভাই", n: 2, line: "lens এ 2 লেখা" },
  { who: "সোম", n: 3, line: "দেখে তিনগুণ লাগে" },
  { who: "নাসিব", n: 4, line: "2 আর 2, দুই দুগুণে চার" },
  { who: "করিম", n: 6, line: "2 + 1 + 1 + 2" },
];
const X1F = patchFrame(-0.6, 5.2, -0.6, 3.6, 34); // 213 × 159

export function PatchBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const act = usePlay(700);
  const k = !sealed ? 0 : act.running ? act.k : 2;
  const seal = () => {
    if (bet === null || sealed) return;
    setSealed(true);
    act.play(2, () => pass("বাজি সিল হলো। আগে এক ঘর গুনি।"));
  };
  const n = bet === null ? 0 : X1_CARDS[bet].n;
  return (
    <>
      <PatchWall f={X1F} label="দেয়ালে stencil এর এক ঘর আলো, আর lens পার হয়ে সেটা যে হেলানো ছোপ হয়; পাশে বাজির কৌটা, প্রশ্নবোধক" className="max-w-[15rem]">
        <Patch f={X1F} cols={LENS_G} />
        <UnitTile f={X1F} faint />
        {k >= 1 &&
          Array.from({ length: n }, (_, i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 90}ms` }}>
              <StageKouta x={X1F.sx(3.7 + (i % 2) * 0.62)} y={X1F.sy(0.2 + Math.floor(i / 2) * 0.72)} s={1.9} />
            </g>
          ))}
        {k >= 2 && (
          <text x={X1F.sx(4.7)} y={X1F.sy(2.9)} fontSize={24} fontWeight={800} fill="#2563eb" className={POP}>
            ?
          </text>
        )}
      </PatchWall>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((c, i) => (
          <Choice key={c.who} n={i} look={bet === i ? "picked" : sealed || bet !== null ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="flex flex-col text-sm leading-tight">
              <span>
                <span className="font-mono font-bold">{c.n}</span> গুণ · {c.who}
              </span>
              <span className="text-xs text-muted">{c.line}</span>
            </span>
          </Choice>
        ))}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={primaryBtn} disabled={bet === null || sealed} onClick={seal}>
          এই বাজি সিল
        </button>
      </div>
      <Task done={k >= 2}>দেয়ালের ছবিতে stencil এর কতগুণ রং লাগবে? একটা বেছে নিয়ে বাজি সিল করুন। উত্তর শেষে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Count the patch. One ঘর of light through G: (0, 0), (2, 1), (3, 3),
//     (1, 2). "কাটুন" cuts it along the chalk lines; the four triangles that
//     hang over are violet; each tap slides one (by a column of G) into a half
//     ঘর's gap. The কৌটা count ticks as a ঘর fills: 1, 2, 3.

const X2F = patchFrame(-0.6, 3.6, -0.6, 3.6, 40); // 184 × 184
const X2_PLAN = planPatch(LENS_G);
const X2_NONE = X2_PLAN.pieces.map(() => false);

/** How many ঘর are full; while a slide is gliding, the count waits for it to land. */
function useCutSlide(plan: PatchPlan, onAll: () => void) {
  const [cut, setCut] = useSeed("cut", false);
  const [slid, setSlid] = useSeed<boolean[]>("slid", plan.pieces.map(() => false));
  const [before, setBefore] = useState<boolean[]>(slid);
  const [seq, setSeq] = useState<number[]>([]);
  const glide = usePlay(750);
  const slide = (i: number) => {
    if (!cut || slid[i] || !moves(plan.pieces[i])) return;
    const ns = slid.map((v, j) => v || j === i);
    setSeq([...seq, i]);
    setBefore(slid);
    setSlid(ns);
    glide.play(1, () => {
      setBefore(ns);
      if (plan.pieces.every((p, j) => !moves(p) || ns[j])) onAll();
    });
  };
  const landed = glide.running ? before : slid;
  const full = wholeCells(plan, landed).filter(Boolean).length;
  const left = plan.pieces.filter((p, i) => moves(p) && !slid[i]).length;
  const allIn = cut && left === 0 && !glide.running;
  // number the ঘর in the order they filled: the whole ones first, then by their last slide
  const rank = (i: number) => (seq.includes(i) ? seq.indexOf(i) : 100 + i);
  const key = (t: number) => Math.max(-1, ...plan.pieces.map((p, i) => (p.target === t && moves(p) ? rank(i) : -1)));
  const order = plan.targets.map((_, t) => t).sort((a, b) => key(a) - key(b));
  return { cut, setCut, slid, setSlid, slide, landed, full, left, allIn, order, gliding: glide.running };
}

export function CountSquares() {
  const pass = useGate();
  const cs = useCutSlide(X2_PLAN, () => pass("এক ঘরের আলো lens পার হয়ে তিন ঘর।"));
  return (
    <>
      <PatchWall f={X2F} label="G এর ছোপ, চকের দাগে কাটা; ঝুলে থাকা চারটা তেকোনা টুকরা, tap করলে ফাঁকা ঘরে সরে যায়; কয়টা ঘর পুরা হলো তার হিসাব" className="max-w-[13rem]">
        <CutPieces f={X2F} plan={X2_PLAN} cut={cs.cut} slid={cs.slid} onSlide={cs.slide} />
        {cs.cut && <TargetCells f={X2F} plan={X2_PLAN} slid={cs.landed} order={cs.order} />}
      </PatchWall>
      <div className="mt-2 flex items-center justify-center gap-4">
        {!cs.cut ? (
          <button type="button" className={primaryBtn} onClick={() => cs.setCut(true)}>
            চকের দাগে কাটুন
          </button>
        ) : (
          <>
            <KoutaCount n={cs.full} label="পুরা ঘর, কৌটা" />
            <span className="text-sm text-muted">
              ঝুলে আছে <span className="font-mono font-bold">{cs.left}</span> টুকরা
            </span>
          </>
        )}
      </div>
      <Task done={cs.allIn}>ছোপটা চকের দাগে কাটুন। তারপর বেগুনি দাগের টুকরা গুলো tap করুন, ফাঁকা ঘরে সরে যাবে। কয় ঘর হলো?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict, then the ফুল tile by tile. Rina's stencil is 5 ঘর. Guess:
//     less than 15 (the petals' corners) · 15 · more. Then each tap sends one
//     ঘর of the stencil through G; it lands as the same patch, and the count
//     goes up by 3. The ফুল's whole outline waits dashed on the wall.

const X3_OPTS = ["15 এর কম। ফুল তো চারকোনা না।", "15. প্রতিটা ঘর 3।", "15 এর বেশি। পাপড়ি ছড়িয়ে যাবে।"];
const X3_RIGHT = 1;
const X3F = patchFrame(-2.4, 5.4, -2.4, 5.4, 22); // 188 × 188

export function EveryShape() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [ran, setRan] = useSeed<boolean[]>("ran", [false, false, false, false, false]);
  const [cur, setCur] = useState<number | null>(null);
  const run = useLensRun(900, 18);
  const send = (i: number) => {
    if (guess === null || run.running || ran[i]) return;
    setCur(i);
    run.run(() => {
      const nr = ran.map((v, j) => v || j === i);
      setRan(nr);
      setCur(null);
      if (nr.every(Boolean)) pass("এক ঘর যতগুণ, পুরা ছবি ততগুণ।");
    });
  };
  const count = 3 * ran.filter(Boolean).length;
  const over = ran.every(Boolean);
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <svg viewBox="0 0 76 76" className="h-auto w-[4.2rem] shrink-0" role="group" aria-label="রিনার ফুলের stencil, 5 ঘর; একটা ঘর tap করলে সেটা lens দিয়ে দেয়ালে যায়">
          <rect x={0} y={0} width={76} height={76} rx={6} fill="#a16207" />
          {FLOWER_CELLS.map((c, i) => {
            const x = 26 + c[0] * 22;
            const y = 28 - c[1] * 22;
            const on = !ran[i] && cur !== i;
            return (
              <g
                key={i}
                role="button"
                tabIndex={guess === null ? -1 : 0}
                aria-label={`stencil এর ঘর ${i + 1}`}
                className={guess !== null && on ? "cursor-pointer" : ""}
                onClick={() => send(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    send(i);
                  }
                }}
              >
                <rect x={x} y={y} width={22} height={22} fill={on ? "#fef9c3" : "#422006"} stroke="#713f12" strokeWidth={1} />
                {on && guess !== null && <rect x={x + 3} y={y + 3} width={16} height={16} fill="none" stroke={PK.loose} strokeWidth={1.4} strokeDasharray="3 2" />}
              </g>
            );
          })}
        </svg>
        <PatchWall f={X3F} label="দেয়ালে ফুলের পুরা ছবির দাগ; stencil এর প্রতিটা ঘর lens দিয়ে গিয়ে একই হেলানো ছোপ হয়" className="max-w-[9.5rem]">
          <path d={pathD(X3F, FLOWER_G)} fill="none" stroke={PK.lamp} strokeWidth={1.2} strokeDasharray="4 3" />
          {FLOWER_CELLS.map((c, i) => (ran[i] ? <Patch key={i} f={X3F} cols={LENS_G} cell={c} /> : null))}
          {cur !== null && <Patch f={X3F} cols={LENS_G} cell={FLOWER_CELLS[cur]} t={run.t} />}
          {over && <path d={pathD(X3F, FLOWER_G)} fill="none" stroke={PK.paintDark} strokeWidth={1.6} className={POP} />}
        </PatchWall>
      </div>
      <div className="mt-1 flex justify-center">
        <KoutaCount n={guess === null ? null : count} label="ঘর" />
      </div>
      <div className="mt-2 grid gap-1.5">
        {X3_OPTS.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, X3_RIGHT)} disabled={guess !== null} onClick={() => setGuess(i)}>
            <span className="text-sm leading-tight">{o}</span>
          </Choice>
        ))}
      </div>
      {over && guess !== null && guess !== X3_RIGHT && <Nope>ঠিক 15। পাঁচটা ঘর, প্রতিটা একই 3 ঘরের ছোপ। ফুল চারকোনা না হলেও হিসাব একই।</Nope>}
      <Task done={over}>আগে guess দিন। তারপর stencil এর পাঁচটা ঘর একটা একটা করে tap করে দেয়ালে পাঠান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Two more lenses from the লাইট ভাই's bag: L = [[2, 0], [0, 2]] and
//     H = [[½, 0], [0, ½]]. Each runs on the one ঘর: L's patch fills 4 whole
//     ঘর (numbered as they land); H's covers one quarter of the ঘর (the ঘর
//     cut in four, one lit).

const X4F = patchFrame(-0.5, 2.5, -0.5, 2.5, 50); // 166 × 166
const X4_LENSES = [
  { key: "L", cols: LENS_L, n: "4" },
  { key: "H", cols: LENS_H, n: "¼" },
] as const;
const X4_LPLAN = planPatch(LENS_L);

export function TwoMoreLenses() {
  const pass = useGate();
  const [which, setWhich] = useSeed<number | null>("which", null);
  const [done, setDone] = useSeed<boolean[]>("done", [false, false]);
  const run = useLensRun(1100, 22);
  const go = (i: number) => {
    if (run.running) return;
    setWhich(i);
    run.run(() => {
      const nd = done.map((v, j) => v || j === i);
      setDone(nd);
      if (nd.every(Boolean)) pass("গুণটা 1 এর কম হলে ছবি ছোট হয়।");
    });
  };
  const t = which === null ? 0 : run.running ? run.t : 1;
  const settled = which !== null && !run.running && done[which];
  return (
    <>
      <PatchWall f={X4F} label="এক ঘর আলো; L দিয়ে গেলে চার ঘর, H দিয়ে গেলে ঘরের চার ভাগের এক ভাগ" className="max-w-[11rem]">
        {which !== null && <Patch f={X4F} cols={X4_LENSES[which].cols} t={t} />}
        <UnitTile f={X4F} faint />
        {settled && which === 0 && <TargetCells f={X4F} plan={X4_LPLAN} slid={[]} />}
        {settled && which === 1 && (
          <g className={POP}>
            <path d={`M${X4F.sx(0.5)} ${X4F.sy(0)}V${X4F.sy(1)}M${X4F.sx(0)} ${X4F.sy(0.5)}H${X4F.sx(1)}`} stroke={INK} strokeWidth={1} strokeDasharray="3 2" strokeOpacity={0.7} />
            <text x={X4F.sx(0.25)} y={X4F.sy(0.25) + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill={INK}>
              ¼
            </text>
          </g>
        )}
      </PatchWall>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {X4_LENSES.map((l, i) => (
          <button
            key={l.key}
            type="button"
            disabled={run.running}
            onClick={() => go(i)}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-2 py-1.5 transition-colors disabled:cursor-default motion-reduce:transition-none ${which === i ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-cat-blue/60"}`}
          >
            <P_Lens cols={l.cols} name={<span className="font-mono font-bold">{l.key}</span>} small />
            <span className="text-sm">
              {done[i] ? (
                <span className={FADE}>
                  এক ঘর → <span className="font-mono font-bold">{l.n}</span> ঘর
                </span>
              ) : (
                <span className="text-muted">চালান</span>
              )}
            </span>
          </button>
        ))}
      </div>
      <Task done={done[0] && done[1]}>দুইটা lens ই এক ঘরের উপর চালান। প্রতিটায় এক ঘর কত ঘর হয়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Only the columns. The patch's two sides from the pin. Tap a side: it
//     lights as a column of G (amber / teal arrow, the column ringed on the
//     card). Then change column 2 with the steppers: the patch follows.

const X5F = patchFrame(-1.4, 3.6, -0.6, 4.4, 34); // 186 × 186
const X5_HIT = "#7c3aed";

export function OnlyTheColumns() {
  const pass = useGate();
  const [lit, setLit] = useSeed<boolean[]>("lit", [false, false]);
  const [c2, setC2] = useSeed<XY>("c2", [1, 2]);
  const [b, d] = useTween([c2[0], c2[1]], 600);
  const cols: Cols = [[2, 1], [b, d]];
  const both = lit[0] && lit[1];
  const changed = c2[0] !== 1 || c2[1] !== 2;
  const tap = (i: 0 | 1) => setLit(lit.map((v, j) => v || j === i));
  const set = (nc: XY) => {
    setC2(nc);
    if (both && (nc[0] !== 1 || nc[1] !== 2)) pass("Patch এর দুই পাশ = lens এর দুই column।");
  };
  const side = (i: 0 | 1) => {
    const tip = cols[i];
    const a: XY = [0, 0];
    return (
      <g
        role="button"
        tabIndex={0}
        aria-label={i === 0 ? "ছোপের নিচের পাশ" : "ছোপের বাম পাশ"}
        className="cursor-pointer"
        onClick={() => tap(i)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            tap(i);
          }
        }}
      >
        <path d={`M${X5F.sx(a[0])} ${X5F.sy(a[1])}L${X5F.sx(tip[0])} ${X5F.sy(tip[1])}`} stroke="transparent" strokeWidth={18} strokeLinecap="round" />
        {!lit[i] && <path d={`M${X5F.sx(a[0])} ${X5F.sy(a[1])}L${X5F.sx(tip[0])} ${X5F.sy(tip[1])}`} stroke={X5_HIT} strokeWidth={2.4} strokeDasharray="4 3" strokeLinecap="round" />}
      </g>
    );
  };
  return (
    <>
      <PatchWall f={X5F} label="G এর ছোপ; নিচের পাশ আর বাম পাশ tap করলে lens এর column হয়ে জ্বলে; column 2 বদলালে ছোপও বদলায়" className="max-w-[12rem]">
        <Patch f={X5F} cols={cols} />
        {side(0)}
        {side(1)}
        {lit[0] && <Arrow f={X5F} from={[0, 0]} to={[2, 1]} tone="amber" w={3} draw />}
        {lit[1] && <Arrow f={X5F} from={[0, 0]} to={[b, d]} tone="teal" w={3} draw={c2[0] === 1 && c2[1] === 2} list={`(${c2[0] < 0 ? `−${-c2[0]}` : c2[0]}, ${c2[1]})`} />}
      </PatchWall>
      <div className="mt-2 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted">সামিনের app:</span>
        <P_Lens cols={[[2, 1], c2]} hi={lit[1] && !lit[0] ? 1 : lit[0] && !lit[1] ? 0 : null} />
      </div>
      {both && (
        <div className={`mt-2 flex flex-wrap items-center justify-center gap-2 ${FADE}`}>
          <span className="text-sm text-cat-teal">column 2:</span>
          <Stepper label="column 2 এর উপরের সংখ্যা" value={c2[0]} min={-1} max={1} onChange={(v) => set([v, c2[1]])} />
          <Stepper label="column 2 এর নিচের সংখ্যা" value={c2[1]} min={1} max={3} onChange={(v) => set([c2[0], v])} />
        </div>
      )}
      <Task done={both && changed}>ছোপের বেগুনি দুইটা পাশ tap করুন। তারপর app এ column 2 বদলে দেখুন ছোপ কী করে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn. A new lens [[2, 1], [0, 2]]: columns (2, 0) and (1, 2). Cut,
//     slide the two pieces that hang over, then set the কৌটা. "রং করুন"
//     paints the full ঘর one কৌটা each: too few leave a bare ঘর (red), too
//     many spill.

const X6_COLS: Cols = [
  [2, 0],
  [1, 2],
];
const X6F = patchFrame(-0.6, 3.6, -0.8, 2.6, 40); // 184 × 152
const X6_PLAN = planPatch(X6_COLS);
const X6_ORDER = X6_PLAN.targets.map((_, i) => i).sort((a, b) => X6_PLAN.targets[a][1] - X6_PLAN.targets[b][1] || X6_PLAN.targets[a][0] - X6_PLAN.targets[b][0]);
const X6_N = X6_PLAN.targets.length; // 4

export function YourPatch() {
  const pass = useGate();
  const cs = useCutSlide(X6_PLAN, () => {});
  const [n, setN] = useSeed("n", 1);
  const [painted, setPainted] = useSeed("painted", false);
  const [miss, setMiss] = useState(0);
  const brush = usePlay(380);
  const paint = () => {
    if (!cs.allIn || brush.running) return;
    setPainted(true);
    brush.play(n, () => {
      if (n === X6_N) pass("এই lens এ এক ঘর হয় 4 ঘর।");
      else setMiss((m) => m + 1);
    });
  };
  const p = painted ? (brush.running ? brush.k : n) : 0;
  const over = painted && !brush.running;
  return (
    <>
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted">নতুন lens:</span>
        <P_Lens cols={X6_COLS} small />
      </div>
      <PatchWall f={X6F} label="নতুন lens এর ছোপ; কাটা, সরানো, তারপর যতগুলো কৌটা দেবেন ততগুলো ঘর রং হয়" className="max-w-[13rem]">
        <CutPieces f={X6F} plan={X6_PLAN} cut={cs.cut} slid={cs.slid} onSlide={cs.slide} tone={painted ? "paint" : "light"} />
        {cs.cut && !painted && <TargetCells f={X6F} plan={X6_PLAN} slid={cs.landed} numbers={false} />}
        {painted &&
          X6_ORDER.map((t, i) => {
            const c = X6_PLAN.targets[t];
            const x = X6F.sx(c[0]);
            const y = X6F.sy(c[1] + 1);
            if (i < p) return <rect key={t} x={x} y={y} width={X6F.u} height={X6F.u} fill={PK.paint} stroke={PK.paintDark} strokeWidth={1} className={POP} />;
            return over ? <rect key={t} x={x + 1} y={y + 1} width={X6F.u - 2} height={X6F.u - 2} fill="white" fillOpacity={0.85} stroke={PK.bad} strokeWidth={1.6} strokeDasharray="3 2" className={POP} /> : null;
          })}
        {over && n > X6_N && <ellipse cx={X6F.sx(1.6)} cy={X6F.sy(-0.45)} rx={X6F.u * (0.5 + 0.25 * (n - X6_N))} ry={4} fill={PK.paint} fillOpacity={0.85} className={POP} />}
      </PatchWall>
      {!cs.cut ? (
        <div className="mt-2 flex justify-center">
          <button type="button" className={primaryBtn} onClick={() => cs.setCut(true)}>
            চকের দাগে কাটুন
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-muted">কৌটা</span>
          <Stepper
            label="কৌটা"
            value={n}
            min={1}
            max={8}
            disabled={brush.running}
            onChange={(v) => {
              setN(v);
              setPainted(false);
            }}
          />
          <button type="button" className={primaryBtn} disabled={!cs.allIn || brush.running || (over && n === X6_N)} onClick={paint}>
            রং করুন
          </button>
        </div>
      )}
      {over && n < X6_N && (
        <Nope key={miss}>
          {n} কৌটায় {n} ঘর রং হলো। লাল দাগের {X6_N - n} ঘর খালি পড়ে থাকলো।
        </Nope>
      )}
      {over && n > X6_N && (
        <Nope key={miss}>
          সব ঘর রং হয়েও {n - X6_N} কৌটা বাড়তি। নিচে গড়িয়ে পড়লো। পুরা ঘর গুলো আবার গুনে দেখুন।
        </Nope>
      )}
      <Task done={over && n === X6_N}>ছোপ কাটুন, ঝুলে থাকা টুকরা সরান। তারপর যত কৌটা লাগবে, তত দিয়ে রং করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it. Rina's ঘুড়ি stencil, 4 ঘর (2 × 2), through a lens that makes
//     one ঘর into 2: [[2, 1], [0, 1]]. The inset shows its one ঘর → 2. Three
//     rows of কৌটা on the মাদুর: 6 · 8 · 12. The picked row paints the ঘুড়ি:
//     6 stops short, 12 fills it and spills 4.

const X7_COLS: Cols = [
  [2, 0],
  [1, 1],
];
const X7_KITE = mapPts(X7_COLS, [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2],
]);
const X7F = patchFrame(-0.4, 6.4, -0.9, 2.4, 30); // 220 × 115
const X7_INF = patchFrame(-0.3, 3.3, -0.3, 1.3, 22); // 95 × 51
const X7_INPLAN = planPatch(X7_COLS);
const X7_ROWS = [6, 8, 12];
const X7_RIGHT = 1;
const X7_NEED = 8;

export function TryPaint() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [ran, setRan] = useSeed("ran", false);
  const [miss, setMiss] = useState(0);
  const pour = usePlay(1100);
  const choose = (i: number) => {
    if (pour.running || (ran && pick === X7_RIGHT)) return;
    setPick(i);
    setRan(false);
    pour.play(1, () => {
      setRan(true);
      if (i === X7_RIGHT) pass("4 ঘরের ঘুড়ি, প্রতি ঘর 2: 8 কৌটা।");
      else setMiss((m) => m + 1);
    });
  };
  const n = pick === null ? 0 : X7_ROWS[pick];
  const level = pick === null ? 0 : Math.min(1, n / X7_NEED);
  const over = ran && !pour.running;
  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <div className="w-[5.5rem] shrink-0">
          <PatchWall f={X7_INF} label="এই lens এ এক ঘর: কেটে সরালে 2 ঘর" className="max-w-none" pin={false}>
            <CutPieces f={X7_INF} plan={X7_INPLAN} cut slid={X7_INPLAN.pieces.map(() => true)} />
            <TargetCells f={X7_INF} plan={X7_INPLAN} slid={X7_INPLAN.pieces.map(() => true)} />
          </PatchWall>
        </div>
        <span className="text-sm leading-tight whitespace-nowrap text-muted">
          এই lens এ এক ঘর → <span className="font-mono font-bold text-foreground">2</span> ঘর
        </span>
      </div>
      <PatchWall f={X7F} label="দেয়ালে ঘুড়ির ছবি, lens পার হয়ে হেলানো; যেই সারির কৌটা দেবেন, সেটা দিয়ে রং হবে" className="mt-1.5 max-w-[15rem]" pin={false}>
        <path d={pathD(X7F, X7_KITE)} fill="none" stroke={PK.paintDark} strokeWidth={1.2} strokeDasharray="4 3" />
        {pick !== null && <PaintFill f={X7F} poly={X7_KITE} frac={pour.running || ran ? level : 0} spill={over && n > X7_NEED} />}
        <path d={`M${X7F.sx(0)} ${X7F.sy(0)}L${X7F.sx(6)} ${X7F.sy(2)}M${X7F.sx(4)} ${X7F.sy(0)}L${X7F.sx(2)} ${X7F.sy(2)}`} stroke="#57534e" strokeWidth={0.9} strokeOpacity={0.6} />
        {over && n < X7_NEED && <path d={pathD(X7F, X7_KITE)} fill="none" stroke={PK.bad} strokeWidth={1.8} strokeDasharray="4 3" className={POP} />}
      </PatchWall>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X7_ROWS.map((r, i) => (
          <Choice key={r} n={i} look={pick === i && over ? (i === X7_RIGHT ? "right" : "wrong") : pick === i ? "picked" : "idle"} disabled={pour.running || (over && pick === X7_RIGHT)} onClick={() => choose(i)}>
            <span className="flex flex-col items-center gap-0.5">
              <KoutaRow n={r} size={10} per={6} />
              <span className="font-mono text-sm font-bold">{r}</span>
            </span>
          </Choice>
        ))}
      </div>
      {over && pick !== null && n < X7_NEED && <Nope key={miss}>6 কৌটায় ঘুড়ির নিচের দিকটাই রং হলো। উপরে খালি। ঘুড়ির 4 ঘরের প্রতিটা হয় 2 ঘর।</Nope>}
      {over && pick !== null && n > X7_NEED && <Nope key={miss}>ঘুড়ি ভরে গেলো, তাও 4 কৌটা বাড়তি। গড়িয়ে পড়লো নিচে।</Nope>}
      <Task done={over && pick === X7_RIGHT}>ঘুড়ির stencil 4 ঘর। মাদুরের কোন সারির কৌটা দেয়ালে নিলে ঠিক ঠিক রং হবে? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The bet opened on the ফুল. The ফুল through G is on the wall; Rina had
//     5 কৌটা। Each card, tapped, pours its কৌটা: 2 গুণ = 10 stops short, 3 গুণ
//     = 15 fills it exactly, 4 গুণ = 20 leaves 5, 6 গুণ = 30 leaves 15.

const X8F = patchFrame(-2.5, 5.5, -2.5, 5.5, 20); // 176 × 176

export function BetOpen() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const [cur, setCur] = useSeed<number | null>("cur", null);
  const pour = usePlay(1100);
  const tap = (i: number) => {
    if (pour.running) return;
    const no = open.includes(i) ? open : [...open, i];
    setOpen(no);
    setCur(i);
    pour.play(1, () => {
      if (no.length === X1_CARDS.length) pass("লাইট ভাইয়ের 2 ছিলো চার সংখ্যার একটা।");
    });
  };
  const c = cur === null ? null : X1_CARDS[cur];
  const kouta = c ? c.n * 5 : 0;
  const level = c ? Math.min(1, kouta / 15) : 0;
  const landed = c !== null && !pour.running;
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <PatchWall f={X8F} label="দেয়ালে ফুলের ছবি, G পার হয়ে; বাজির যেই card খুলবেন, তার কৌটা দিয়ে রং হবে" className="max-w-[10rem]" pin={false}>
          <path d={pathD(X8F, FLOWER_G)} fill="none" stroke={PK.paintDark} strokeWidth={1.2} strokeDasharray="4 3" />
          {c && <PaintFill key={cur} f={X8F} poly={FLOWER_G} frac={level} />}
          {landed && kouta < 15 && <path d={pathD(X8F, FLOWER_G)} fill="none" stroke={PK.bad} strokeWidth={1.8} strokeDasharray="4 3" className={POP} />}
        </PatchWall>
        <div className="flex w-[8.5rem] flex-col items-center gap-1 text-center text-sm">
          <P_Lens cols={LENS_G} name="G" small />
          {c && landed ? (
            <div key={cur} className={FADE}>
              <div>
                {c.who}: <span className="font-mono font-bold">{kouta}</span> কৌটা
              </div>
              {kouta < 15 && <div className="text-danger">ফুলের উপরটা খালি</div>}
              {kouta === 15 && <div className="font-semibold text-accent-text">ঠিক ঠিক ভরলো</div>}
              {kouta > 15 && (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-danger">
                    <span className="font-mono">{kouta - 15}</span> কৌটা বাড়তি
                  </span>
                  <KoutaRow n={kouta - 15} size={9} per={8} bad />
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted">রিনার ছিলো 5 কৌটা</div>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {X1_CARDS.map((b, i) => (
          <Choice key={b.who} n={i} look={open.includes(i) ? (b.n === 3 ? "right" : "wrong") : "idle"} disabled={pour.running} onClick={() => tap(i)}>
            <span className="flex flex-col text-sm leading-tight">
              <span>
                <span className="font-mono font-bold">{b.n}</span> গুণ · {b.who}
              </span>
              <span className="text-xs text-muted">{b.n * 5} কৌটা</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={open.length === X1_CARDS.length && !pour.running}>বাজির চারটা card একটা একটা করে খুলুন। প্রতিটার কৌটা দেয়ালে ঢেলে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stage bits for the story scenes.

const SW: [number, number] = [8, 30]; // the stage wall's top-left
const PJ: [number, number] = [206, 150]; // the machine's feet
/** a point on the stage wall (wall units) in stage units */
const onStage = (p: XY): [number, number] => [SW[0] + STAGE_WALL_F.sx(p[0]), SW[1] + STAGE_WALL_F.sy(p[1])];
/** the ফুল on the stage wall sits one ঘর right of the pin */
const ST_AT: XY = [1, 0];
const ST_FLOWER = mapPts(LENS_G, FLOWER_OUTLINE, ST_AT);

/** the ফুল of light (or paint) on the stage wall, drawn with STAGE_WALL_F (inside <StageWall>) */
function St_Flower({ light = false, paint, dim = false }: { light?: boolean; paint?: number; dim?: boolean }) {
  const f = STAGE_WALL_F;
  const d = pathD(f, ST_FLOWER);
  return (
    <g className="pointer-events-none">
      {paint !== undefined && <PaintFill f={f} poly={ST_FLOWER} frac={paint} />}
      {light && <path d={d} fill={PK.glow} fillOpacity={dim ? 0.3 : 0.55} stroke={PK.lamp} strokeWidth={0.9} className={FADE} />}
    </g>
  );
}

/** মামার সাইকেল, wheels on the ground at x ± 14 */
function St_Cycle({ x, y, bag = false }: { x: number; y: number; bag?: boolean }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x - 14} cy={y - 9} r={9} fill="none" stroke="#334155" strokeWidth={1.6} />
      <circle cx={x + 14} cy={y - 9} r={9} fill="none" stroke="#334155" strokeWidth={1.6} />
      <path d={`M${x - 14} ${y - 9}L${x - 3} ${y - 22}L${x + 10} ${y - 22}L${x + 14} ${y - 9}M${x - 3} ${y - 22}L${x + 2} ${y - 9}L${x - 14} ${y - 9}M${x + 2} ${y - 9}L${x + 10} ${y - 22}M${x + 10} ${y - 22}L${x + 8} ${y - 28}h5M${x - 3} ${y - 22}l-2 -4h6`} fill="none" stroke="#b91c1c" strokeWidth={1.5} strokeLinejoin="round" />
      {bag && <rect x={x - 22} y={y - 34} width={14} height={11} rx={2} fill="#d6c7a1" stroke="#78716c" strokeWidth={0.7} />}
    </g>
  );
}

/** a small round glass with its letter */
function St_Glass({ x, y, letter, r = 6 }: { x: number; y: number; letter: string; r?: number }) {
  return (
    <g className="pointer-events-none">
      <circle cx={x} cy={y} r={r} fill="#bae6fd" fillOpacity={0.85} stroke={INK} strokeWidth={0.9} />
      <text x={x} y={y + r * 0.45} textAnchor="middle" fontSize={r * 1.3} fontWeight={800} fontFamily={MONO} fill={INK}>
        {letter}
      </text>
    </g>
  );
}

/** Rina's cardboard ফুল stencil, held up: five squares with the middle one at (x, y) */
function St_Stencil({ x, y, s = 7 }: { x: number; y: number; s?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - s * 1.8} y={y - s * 1.8} width={s * 3.6} height={s * 3.6} rx={1.5} fill="#a16207" />
      {FLOWER_CELLS.map((c, i) => (
        <rect key={i} x={x - s / 2 + c[0] * s} y={y - s / 2 - c[1] * s} width={s} height={s} fill="#fef9c3" stroke="#713f12" strokeWidth={0.5} />
      ))}
    </g>
  );
}

/** the লাইট ভাই's ঝোলা */
function St_Bag({ x, y, open = false }: { x: number; y: number; open?: boolean }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 14} ${y}L${x - 12} ${y - 20}H${x + 12}L${x + 14} ${y}Z`} fill="#65a30d" stroke="#3f6212" strokeWidth={0.9} />
      {open && <path d={`M${x - 12} ${y - 20}L${x - 16} ${y - 27}M${x + 12} ${y - 20}L${x + 16} ${y - 27}`} stroke="#3f6212" strokeWidth={1.2} />}
      <path d={`M${x - 8} ${y - 20}q8 -14 16 0`} fill="none" stroke="#3f6212" strokeWidth={1.4} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · The morning after বিদায়. The উঠান; the machine on its stand, on; the
//      wall with the chalk grid; the ফুল of light on it. Rina on a মোড়া with a
//      তুলি, five কৌটা at her feet; মামা at the gate with the bicycle, one foot
//      on the pedal. The লাইট ভাই taps the lens rim: his claim.

export function MorningWall({}: Story) {
  const s = useScene(3, [600, 1600, 2400, 2600]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="বিদায়ের পরের সকাল; উঠানে লাইট ভাইয়ের যন্ত্র; দেয়ালে চকের grid আর রিনার ফুলের আলো; রিনা মোড়ায় দাঁড়িয়ে, হাতে তুলি, পায়ের কাছে পাঁচটা রঙের কৌটা; মামা গেটে সাইকেলে এক পা দিয়ে; লাইট ভাই lens এ টোকা দিয়ে বললেন, লেন্সে দুই লেখা আছে, ছবি দুইগুণ হইবো, রংও দুইগুণ কিনেন">
        <StageWall x={SW[0]} y={SW[1]}>{k >= 1 && <St_Flower light />}</StageWall>
        {k >= 1 && <StageBeam from={[lx, ly]} to={onStage([ST_AT[0] + 1.5, 1.5])} w={10} />}
        <Projector x={PJ[0]} y={PJ[1]} on={k >= 1} lens="good" />
        <StageMora x={132} y={150} />
        <Person who="rina" x={132} y={134} facing={-1} arm="hold" label />
        <StageBrush x={121} y={104} a={-150} />
        {[0, 1, 2, 3, 4].map((i) => (
          <StageKouta key={i} x={150 + i * 9} y={150} />
        ))}
        <LightBhai x={240} y={150} facing={-1} arm={k >= 2 ? "point" : "down"} />
        <St_Cycle x={296} y={150} />
        <Person who="mama" x={286} y={150} facing={-1} label />
        {k === 2 && <Bubble x={240} y={84} side="mid" lines={["লেন্সে দুই লেখা আছে।"]} />}
        {k >= 3 && <Bubble x={240} y={84} side="mid" lines={["ছবি দুইগুণ হইবো।", "রংও দুইগুণ কিনেন।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 1b · Three more answers, one after the other: Som (তিনগুণের মতো), Nasib
//      (2 আর 2), Karim (the four numbers added).

const FC_SAY: { who: "som" | "nasib" | "karim"; x: number; lines: string[]; side: "left" | "mid" | "right" }[] = [
  { who: "som", x: 70, lines: ["তিনগুণের মতো", "লাগে।"], side: "right" },
  { who: "nasib", x: 150, lines: ["lens এ 2 আর 2।", "দুই দুগুণে চার।"], side: "mid" },
  { who: "karim", x: 230, lines: ["2, 1, 1, 2.", "যোগ করলে 6।"], side: "left" },
];

export function FourCounts({}: Story) {
  const s = useScene(3, [600, 2200, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="উঠানে তিনজন; সোম বললো তিনগুণের মতো লাগে; নাসিব বললো lens এ 2 আর 2, দুই দুগুণে চার; করিম আঙুলে গুনে বললো 2, 1, 1, 2, যোগ করলে 6">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Flower light dim />
        </StageWall>
        {FC_SAY.map((p, i) => (
          <Person key={p.who} who={p.who} x={p.x} y={150} facing={i < 1 ? 1 : -1} label arm={k === i + 1 ? "point" : "down"} />
        ))}
        <LightBhai x={296} y={150} facing={-1} />
        {k >= 1 && <Bubble key={k} x={FC_SAY[k - 1].x} y={84} side={FC_SAY[k - 1].side} lines={FC_SAY[k - 1].lines} />}
      </Stage>
    </StoryFrame>
  );
}

// 3a · Rina holds the real stencil up to the light: the ফুল, 5 ঘর. Nasib: one
//      ঘর tripled is fine; a ফুল isn't square.

export function RinaStencil({}: Story) {
  const s = useScene(3, [600, 1600, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="রিনা আসল stencil টা আলোর দিকে তুলে ধরলো, মাঝে এক ঘর আর চার দিকে চারটা পাপড়ি; নাসিব বললো এক ঘর তিনগুণ ঠিক আছে, কিন্তু ফুল তো চারকোনা না, ফুলের হিসাব আলাদা">
        <Person who="rina" x={110} y={150} facing={1} arm={k >= 1 ? "hold" : "down"} label />
        {k >= 1 && (
          <g className={POP}>
            <St_Stencil x={134} y={92} />
          </g>
        )}
        <Person who="nasib" x={214} y={150} facing={-1} arm={k >= 2 ? "point" : "down"} label />
        {k === 2 && <Bubble x={214} y={84} side="left" lines={["এক ঘর তিনগুণ,", "ঠিক আছে।"]} />}
        {k >= 3 && <Bubble x={214} y={84} side="left" lines={["ফুল তো চারকোনা না।", "ফুলের হিসাব আলাদা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// 4a · The লাইট ভাই opens his ঝোলা: L, then H.

export function BagLenses({}: Story) {
  const s = useScene(3, [600, 1400, 1600, 1600]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="লাইট ভাই তার ঝোলা খুললেন; একটা lens বের করলেন, গায়ে L; তারপর আরেকটা, গায়ে H; রিনা আর সামিন দেখছে">
        <Person who="rina" x={62} y={150} facing={1} label />
        <Person who="samin" x={112} y={150} facing={1} label />
        <St_Bag x={176} y={150} open={k >= 1} />
        <LightBhai x={214} y={150} facing={-1} arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && (
          <g className={POP}>
            <St_Glass x={192} y={112} letter="L" />
          </g>
        )}
        {k >= 3 && (
          <g className={POP}>
            <St_Glass x={178} y={104} letter="H" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// 8a · Noon. মামা back with the কৌটা on his bicycle; the ten new ones by the
//      five old; Rina on the মোড়া paints the ফুল; the last কৌটা empties as
//      the ফুল fills.

export function NoonPaint({}: Story) {
  const s = useScene(3, [600, 1600, 1800, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="field" label="দুপুর; মামা বাজার থেকে সাইকেলে কৌটা নিয়ে ফিরলেন; রিনার পাঁচটার পাশে দশটা নতুন; রিনা মোড়ায় উঠে ফুলটা রং করলো; পনেরোটা কৌটাই খালি হলো, ফুল পুরা রং হলো">
        <StageWall x={SW[0]} y={SW[1]}>
          <path d={pathD(STAGE_WALL_F, ST_FLOWER)} fill="none" stroke={PK.paintDark} strokeWidth={0.8} strokeDasharray="3 2" />
          {k >= 2 && <St_Flower paint={k >= 3 ? 1 : 0.5} />}
        </StageWall>
        <StageMora x={140} y={150} />
        <Person who="rina" x={140} y={134} facing={-1} arm={k >= 2 ? "point" : "down"} label />
        <StageBrush x={128} y={103} a={-150} wet={k >= 2} />
        {Array.from({ length: 15 }, (_, i) =>
          i < 5 || k >= 1 ? (
            <g key={i} className={i >= 5 ? POP : undefined}>
              <StageKouta x={170 + (i % 8) * 9} y={150 - Math.floor(i / 8) * 11} open={k >= 3 || (k >= 2 && i < 7)} />
            </g>
          ) : null,
        )}
        <St_Cycle x={k >= 1 ? 284 : 300} y={150} bag={k < 1} />
        <Person who="mama" x={k >= 1 ? 272 : 290} y={150} facing={-1} walking={k === 1} label />
      </Stage>
    </StoryFrame>
  );
}

// 9a · Evening. The painted ফুল drying on the wall; the machine switched on,
//      its light lying exactly over the paint.

export function EveningWall({}: Story) {
  const s = useScene(1, [600, 1800]);
  const k = s.k;
  const [lx, ly] = projectorLens(PJ[0], PJ[1]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যা; দেয়ালে রং করা ফুল শুকাচ্ছে; লাইট ভাই যন্ত্র চালু করলেন; আলোর ফুল ঠিক রঙের ফুলের উপর পড়লো, এক চুলও এদিক ওদিক না; রিনা মোড়ার পাশে দাঁড়িয়ে দেখছে">
        <StageWall x={SW[0]} y={SW[1]}>
          <St_Flower paint={1} />
          {k >= 1 && <St_Flower light dim />}
        </StageWall>
        {k >= 1 && <StageBeam from={[lx, ly]} to={onStage([ST_AT[0] + 1.5, 1.5])} w={10} />}
        <Projector x={PJ[0]} y={PJ[1]} on={k >= 1} lens="good" />
        <StageMora x={126} y={150} />
        <Person who="rina" x={150} y={150} facing={-1} label />
        <LightBhai x={250} y={150} facing={-1} nameTone="#f8fafc" />
      </Stage>
    </StoryFrame>
  );
}

// 9b · The bridge to 8.2: নানা on the বারান্দা with his phone, calling the
//      আমিন। The plot for আপা, a slanted field, drawn small behind.

export function AminCall({}: Story) {
  const s = useScene(3, [600, 2000, 2200, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="নানা বারান্দায়, কানে phone; আমিনকে ফোন করলেন; দূরে একটা হেলানো জমি, চারপাশে আল; নানা বললেন আপার জমিটা হেলানো, মাঠে তো চক দিয়ে ঘর কাটা নাই, গুনবেন কীভাবে">
        <path d="M168 138L262 138L300 112L206 112Z" fill="#4d7c0f" stroke="#a3e635" strokeWidth={1.4} />
        <path d="M150 146L310 146" stroke="#3f6212" strokeWidth={2} />
        <rect x={20} y={70} width={6} height={80} fill="#8b5e34" />
        <path d="M10 70H120" stroke="#9f5a3a" strokeWidth={6} />
        <Person who="nana" x={78} y={150} facing={1} arm="hold" label />
        <rect x={84} y={90} width={5} height={9} rx={1} fill="#0f172a" />
        {k === 1 && <Bubble x={78} y={84} side="right" lines={["আপার জমিটা হেলানো।"]} />}
        {k === 2 && <Bubble x={78} y={84} side="right" lines={["মাঠে তো চক দিয়ে", "ঘর কাটা নাই।"]} />}
        {k >= 3 && <Bubble x={78} y={84} side="right" lines={["গুনবেন কীভাবে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1½ · The stake: মামা goes once. Too few কৌটা: the ফুল half painted. Too
//      many: কৌটা never opened. How many, exactly? Stopped at "?".

const S1_SAY = [
  "মামা বাজারে যাবেন একবারই। রিনার হাতে 5 কৌটা।",
  "কম আনলে: রং ফুরিয়ে যাবে। ফুল অর্ধেক রং হয়ে পড়ে থাকবে।",
  "বেশি আনলে: কৌটা না খুলেই পড়ে থাকবে। টাকা নষ্ট।",
  "তাহলে ঠিক কত?",
];
const S1F = patchFrame(-2.5, 7.5, -2.4, 5.4, 18); // 196 × 156

export function StakeFig() {
  const s = useScene(3, [600, 2200, 2200, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S1_SAY, k)}>
      <PatchWall f={S1F} label="দেয়ালে ফুলের ছবির দাগ; কম রং আনলে অর্ধেক রং, বেশি আনলে কৌটা পড়ে থাকে; ঠিক কত, প্রশ্নবোধক" className="max-w-[14rem]" pin={false}>
        <path d={pathD(S1F, FLOWER_G)} fill="none" stroke={PK.paintDark} strokeWidth={1.1} strokeDasharray="4 3" />
        {(k === 1 || k === 2) && <PaintFill f={S1F} poly={FLOWER_G} frac={k === 1 ? 0.5 : 1} />}
        {k === 1 && <path d={pathD(S1F, FLOWER_G)} fill="none" stroke={PK.bad} strokeWidth={1.6} strokeDasharray="4 3" className={POP} />}
        {[0, 1, 2, 3, 4].map((i) => (
          <StageKouta key={i} x={S1F.sx(5.6 + (i % 3) * 0.6)} y={S1F.sy(-1.8 + Math.floor(i / 3) * 0.95)} s={1.3} open={k >= 1} />
        ))}
        {k === 2 &&
          [0, 1, 2].map((i) => (
            <g key={`x${i}`} className={POP}>
              <StageKouta x={S1F.sx(5.6 + i * 0.6)} y={S1F.sy(0.1)} s={1.3} />
            </g>
          ))}
        {k >= 3 && (
          <text x={S1F.sx(1.3)} y={S1F.sy(1.2)} textAnchor="middle" fontSize={30} fontWeight={800} fill="#2563eb" className={POP}>
            ?
          </text>
        )}
      </PatchWall>
    </Scene>
  );
}

// 2½ · Cut from paper. Rina cuts the patch's shape out of a newspaper, cuts
//      it on the chalk lines, slides the pieces into three whole ঘর, and slides
//      them back: the same patch again. Nothing added, nothing lost.

const S2_SAY = [
  "রিনা newspaper থেকে ছোপের মাপে একটা টুকরা কাটলো।",
  "তারপর কাঁচি দিয়ে চকের দাগ ধরে কাটলো।",
  "ঝুলে থাকা টুকরা গুলো ফাঁকে বসালো। তিনটা পুরা ঘর।",
  "উল্টা দিকে সরালে আবার আগের ছোপ। কাগজ বাড়ে নাই, কমে নাই।",
];
const S2F = patchFrame(-0.4, 3.4, -0.4, 3.4, 34); // 145 × 145

export function CutPaper() {
  const s = useScene(3, [600, 1600, 2000, 2400]);
  const k = s.k;
  const all = X2_PLAN.pieces.map(() => true);
  return (
    <Scene scene={s} caption={say(S2_SAY, k)}>
      <PatchWall f={S2F} label="newspaper এর ছোপ; চকের দাগে কাটা; টুকরা সরিয়ে তিনটা পুরা ঘর; আবার সরিয়ে আগের ছোপ" className="max-w-[10rem]" pin={false}>
        <CutPieces f={S2F} plan={X2_PLAN} cut={k >= 1} slid={k === 2 ? all : X2_NONE} tone="paper" />
        {k === 2 && <TargetCells f={S2F} plan={X2_PLAN} slid={all} />}
        {/* print lines on the paper, for the look of a newspaper */}
        {k === 0 &&
          [0.9, 1.3, 1.7, 2.1].map((y) => <path key={y} d={`M${S2F.sx(y / 2 + 0.3)} ${S2F.sy(y)}H${S2F.sx(y / 2 + 1.5)}`} stroke="#94a3b8" strokeWidth={1.4} className="pointer-events-none" />)}
        {k === 1 && (
          <g className={POP} transform={`translate(${S2F.sx(2.6)} ${S2F.sy(0.6)})`}>
            <circle cx={-6} cy={6} r={4} fill="none" stroke="#dc2626" strokeWidth={1.6} />
            <circle cx={6} cy={6} r={4} fill="none" stroke="#dc2626" strokeWidth={1.6} />
            <path d="M-4 3L8 -12M4 3L-8 -12" stroke="#475569" strokeWidth={1.8} strokeLinecap="round" />
          </g>
        )}
      </PatchWall>
    </Scene>
  );
}

// 3½ · A round ফুল doesn't fit whole ঘর; cut the ঘর smaller; through G every
//      small ঘর becomes the same slanted patch, three times its size; so the
//      round ফুল is three times too.

const S3_SAY = [
  "গোল পাপড়ির একটা ফুল। চকের পুরা ঘরে মাপা যায় না।",
  "ঘর গুলো ছোট করে কাটেন। এক ঘরের চার ভাগের এক ভাগ।",
  "Lens পার হলে প্রতিটা ছোট ঘর একই রকম হেলানো ছোপ হয়।",
  "প্রতিটা ছোট ঘর তিনগুণ। তাই গোল ফুলও তিনগুণ।",
];
const S3F = patchFrame(-0.4, 5, -0.4, 5, 30); // 178 × 178
const S3_PETALS: XY[] = Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * 2 * Math.PI;
  const r = 0.45 + 0.28 * Math.abs(Math.cos(2.5 * a));
  return [0.8 + Math.cos(a) * r, 0.8 + Math.sin(a) * r];
});

export function TilesTriple() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  const [t] = useTween([k >= 2 ? 1 : 0], 1200);
  const m = partway(byCols(LENS_G), t);
  const step = k >= 1 ? 0.5 : 1;
  let d = "";
  for (let x = 0; x <= 2 + 1e-9; x += step) d += pathOf(S3F, m, [[x, 0], [x, 2]]);
  for (let y = 0; y <= 2 + 1e-9; y += step) d += pathOf(S3F, m, [[0, y], [2, y]]);
  const one: XY[] = [[1, 0.5], [1.5, 0.5], [1.5, 1], [1, 1]];
  return (
    <Scene scene={s} caption={say(S3_SAY, k)}>
      <PatchWall f={S3F} label="গোল পাপড়ির ফুল, ছোট ঘরে কাটা; lens পার হয়ে প্রতিটা ছোট ঘর একই হেলানো ছোপ, তিনগুণ" className="max-w-[12rem]">
        <path d={pathOf(S3F, m, S3_PETALS, true)} fill={PK.glow} fillOpacity={0.6} stroke={PK.lamp} strokeWidth={1.3} />
        <path d={d} fill="none" stroke={INK} strokeWidth={0.7} strokeOpacity={0.55} />
        {k >= 3 && <path d={pathOf(S3F, m, one, true)} fill={PK.paint} fillOpacity={0.85} stroke={PK.paintDark} strokeWidth={1} className={POP} />}
        {k >= 3 && (
          <text x={S3F.sx(4.2)} y={S3F.sy(0.9)} textAnchor="middle" fontSize={13} fontWeight={800} fontFamily={MONO} fill={PK.paintDark} className={POP}>
            ×3
          </text>
        )}
      </PatchWall>
    </Scene>
  );
}

// 4½ · Three lenses, three patches, three numbers; the name lands last.

const S4_SAY = [
  "তিনটা lens, প্রতিটার সামনে এক ঘর।",
  "G: এক ঘর হয় 3 ঘর।",
  "L: 4 ঘর।",
  "H: চার ভাগের এক ভাগ।",
  "প্রতিটা lens এর একটা করে সংখ্যা। নাম determinant.",
];
const S4_LENS: { name: string; cols: Cols; n: string }[] = [
  { name: "G", cols: LENS_G, n: "3" },
  { name: "L", cols: LENS_L, n: "4" },
  { name: "H", cols: LENS_H, n: "¼" },
];
const S4F = patchFrame(-0.3, 3.3, -0.3, 3.3, 20); // 88 × 88

export function ThreeLenses() {
  const s = useScene(4, [600, 1400, 1400, 1400, 2400]);
  const k = s.k;
  return (
    <Scene scene={s} caption={say(S4_SAY, k)}>
      <svg viewBox="0 0 282 118" role="img" aria-label="তিনটা lens এর ছোপ: G তে 3, L এ 4, H এ চার ভাগের এক; det(G) = 3, det(L) = 4, det(H) = ¼" className="mx-auto block h-auto w-full max-w-[18rem]">
        {S4_LENS.map((l, i) => {
          const f = S4F;
          const on = k >= i + 1;
          return (
            <g key={l.name} transform={`translate(${6 + i * 94} 4)`}>
              <rect x={0} y={0} width={f.W} height={f.H} rx={5} fill={PK.lime} />
              {on && <path d={pathD(f, mapPts(l.cols, cellPoly([0, 0])))} fill={PK.glow} fillOpacity={0.75} stroke={PK.lamp} strokeWidth={1.2} className={FADE} />}
              <path d={pathD(f, cellPoly([0, 0]))} fill="none" stroke={INK} strokeWidth={1} strokeDasharray="3 2" strokeOpacity={0.6} />
              <text x={f.W - 6} y={13} textAnchor="end" fontSize={11} fontWeight={800} fontFamily={MONO} fill={INK}>
                {l.name}
              </text>
              {on && (
                <text key={k >= 4 ? "det" : "n"} x={f.W / 2} y={f.H + 20} textAnchor="middle" fontSize={k >= 4 ? 11 : 14} fontWeight={800} fontFamily={MONO} fill={PK.paintDark} className={POP}>
                  {k >= 4 ? `det(${l.name}) = ${l.n}` : l.n}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// 5½ · The columns draw the patch: e₁ swings to G's first column, e₂ to its
//      second; the patch fills between them; how to read its size off the four
//      numbers without counting stays a "?".

const S5_SAY = [
  "এক ঘর। নিচের পাশ e₁, বাম পাশ e₂।",
  "Lens এর প্রথম column (2, 1). e₁ গিয়ে দাঁড়ালো সেখানে।",
  "দ্বিতীয় column (1, 2)। e₂ গেলো সেখানে।",
  "দুই পাশ ধরে বাকিটা আঁকা হয়ে গেলো। এটাই ছোপ।",
  "চারটা সংখ্যাতেই সব আছে। গোনা ছাড়া পড়বো কীভাবে?",
];
const S5F = patchFrame(-0.4, 3.4, -0.4, 3.4, 36); // 153 × 153

export function ColumnsDraw() {
  const s = useScene(4, [600, 1800, 1800, 1800, 2400]);
  const k = s.k;
  const [a, b, c, d] = useTween([k >= 1 ? 2 : 1, k >= 1 ? 1 : 0, k >= 2 ? 1 : 0, k >= 2 ? 2 : 1], 900);
  const cols: Cols = [[a, b], [c, d]];
  return (
    <Scene scene={s} caption={say(S5_SAY, k)}>
      <PatchWall f={S5F} label="এক ঘরের দুই পাশ e₁ আর e₂; e₁ যায় lens এর প্রথম column (2, 1) এ, e₂ দ্বিতীয় column (1, 2) এ; তাদের মাঝে ছোপ" className="max-w-[10.5rem]">
        {k >= 3 && <Patch f={S5F} cols={LENS_G} />}
        <path d={pathD(S5F, [[0, 0], cols[0], [a + c, b + d], cols[1]])} fill="none" stroke={INK} strokeWidth={0.9} strokeDasharray="3 2" strokeOpacity={0.6} />
        <Arrow f={S5F} from={[0, 0]} to={cols[0]} tone="amber" w={3} list={k >= 1 ? "(2, 1)" : "(1, 0)"} />
        <Arrow f={S5F} from={[0, 0]} to={cols[1]} tone="teal" w={3} list={k >= 2 ? "(1, 2)" : "(0, 1)"} />
        {k >= 4 && (
          <text x={S5F.sx(2.95)} y={S5F.sy(0.2)} textAnchor="middle" fontSize={24} fontWeight={800} fill="#2563eb" className={POP}>
            ?
          </text>
        )}
      </PatchWall>
    </Scene>
  );
}

// 9½ · The recap: through G, one ঘর → 3; the ফুল 5 → 15; a round one, 3 গুণ.

const S9_SAY = ["G তে এক ঘর: 3 ঘর।", "5 ঘরের ফুল: 15 ঘর।", "গোল কিছু হলেও: 3 গুণ।", "একটা lens, একটা গুণ। det(G) = 3."];
const S9F = patchFrame(-2.3, 5.3, -2.3, 5.3, 11); // 100 × 100

export function RecapFig() {
  const s = useScene(3, [600, 1600, 1600, 2200]);
  const k = s.k;
  const blob = S3_PETALS.map(([x, y]) => [x * 1.4 - 0.3, y * 1.4 - 0.3] as XY);
  const panels: { src: XY[]; n: string }[] = [
    { src: cellPoly([0, 0]), n: "1 → 3" },
    { src: FLOWER_OUTLINE, n: "5 → 15" },
    { src: blob, n: "× 3" },
  ];
  return (
    <Scene scene={s} caption={say(S9_SAY, k)}>
      <svg viewBox="0 0 312 146" role="img" aria-label="G পার হয়ে এক ঘর 3 ঘর, 5 ঘরের ফুল 15 ঘর, গোল কিছুও 3 গুণ; det(G) = 3" className="mx-auto block h-auto w-full max-w-[19rem]">
        {panels.map((p, i) => {
          const f = S9F;
          const shown = k >= i;
          return (
            <g key={i} transform={`translate(${4 + i * 104} 2)`} opacity={shown ? 1 : 0.25} className="transition-opacity duration-500 motion-reduce:transition-none">
              <rect x={0} y={0} width={f.W} height={f.H} rx={5} fill={PK.lime} />
              <path d={pathD(f, p.src)} fill="none" stroke={INK} strokeWidth={0.9} strokeDasharray="3 2" strokeOpacity={0.6} />
              {shown && <path d={pathD(f, mapPts(LENS_G, p.src))} fill={PK.paint} fillOpacity={0.8} stroke={PK.paintDark} strokeWidth={1} className={FADE} />}
              {shown && (
                <text x={f.W / 2} y={f.H + 16} textAnchor="middle" fontSize={12} fontWeight={800} fontFamily={MONO} fill={INK}>
                  {p.n}
                </text>
              )}
            </g>
          );
        })}
        {k >= 3 && (
          <text x={156} y={142} textAnchor="middle" fontSize={12} fontWeight={800} fontFamily={MONO} fill={PK.paintDark} className={POP}>
            det(G) = 3
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names; `k` = the beat shown).

const X2_ALL = X2_PLAN.pieces.map(() => true);
const X2_HALF = X2_PLAN.pieces.map((p, i) => moves(p) && i < 2);
const X6_ALL = X6_PLAN.pieces.map(() => true);

export const fixtures: Fixtures = {
  PatchBet: { start: {}, picked: { bet: 2 }, sealed: { bet: 3, sealed: true } },
  CountSquares: { start: {}, cut: { cut: true }, half: { cut: true, slid: X2_HALF }, done: { cut: true, slid: X2_ALL } },
  EveryShape: { start: {}, guessed: { guess: 0, ran: [true, true, false, false, false] }, done: { guess: 0, ran: [true, true, true, true, true] } },
  TwoMoreLenses: { start: {}, l: { which: 0, done: [true, false] }, h: { which: 1, done: [true, true] } },
  OnlyTheColumns: { start: {}, one: { lit: [true, false] }, both: { lit: [true, true] }, changed: { lit: [true, true], c2: [-1, 3] } },
  YourPatch: {
    start: {},
    cut: { cut: true },
    ready: { cut: true, slid: X6_ALL, n: 4 },
    short: { cut: true, slid: X6_ALL, n: 3, painted: true },
    spill: { cut: true, slid: X6_ALL, n: 6, painted: true },
    right: { cut: true, slid: X6_ALL, n: 4, painted: true },
  },
  TryPaint: { start: {}, short: { pick: 0, ran: true }, spill: { pick: 2, ran: true }, right: { pick: 1, ran: true } },
  BetOpen: { start: {}, short: { open: [0], cur: 0 }, over: { open: [0, 2, 3], cur: 3 }, done: { open: [0, 1, 2, 3], cur: 1 } },
  MorningWall: { rest: { k: 0 }, light: { k: 1 }, claim: { k: 2 }, done: {} },
  FourCounts: { som: { k: 1 }, nasib: { k: 2 }, done: {} },
  RinaStencil: { rest: { k: 1 }, done: {} },
  BagLenses: { rest: { k: 0 }, done: {} },
  NoonPaint: { rest: { k: 0 }, cans: { k: 1 }, half: { k: 2 }, done: {} },
  EveningWall: { rest: { k: 0 }, done: {} },
  AminCall: { one: { k: 1 }, two: { k: 2 }, done: {} },
  StakeFig: { rest: { k: 0 }, less: { k: 1 }, more: { k: 2 }, done: {} },
  CutPaper: { paper: { k: 0 }, cut: { k: 1 }, slid: { k: 2 }, done: {} },
  TilesTriple: { rest: { k: 0 }, small: { k: 1 }, done: {} },
  ThreeLenses: { g: { k: 1 }, done: {} },
  ColumnsDraw: { rest: { k: 0 }, one: { k: 1 }, fill: { k: 3 }, done: {} },
  RecapFig: { one: { k: 0 }, done: {} },
};
