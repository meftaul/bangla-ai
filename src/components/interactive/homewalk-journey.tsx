"use client";

import {
  FADE,
  Nope,
  POP,
  Scene,
  Choice,
  Draw,
  Ticks,
  pill,
  primaryBtn,
  quietBtn,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
} from "@/components/journey/kit";
import { Bubble, Card as CastCard, Gate, Person as CastPerson, Stage, Stall, StoryFrame } from "@/components/journey/cast";
import { Arrow, Dot, Label, Plane, Star, makeFrame, same, sg, snap, tup, type Frame, type XY } from "@/components/journey/plane";
import { ButtonRemote, Chains, Recipe, SHELF, land, type Key } from "./remote-journey";
import { useState } from "react";
import { Shiku } from "./arrow-journey";
import { Task, useGate } from "@/components/journey/journey";

// Screens for "Math for AI 5.2b — The walk home, catching an extra button",
// told as a Journey in the author's Banglish, 7 steps (the pathshala-journey
// skill).
//
// The same night as 5.2. Nasib, whose "two buttons are always enough" lost
// in 5.1, turns up with a three-button remote from the toy shop: e₁, e₂ and
// w = (2, 3), 50 taka a button, returnable by morning. No two of its buttons
// sit on one line, so no copy shows. The reader seals a bet on whether the
// third button is worth its 50 taka, then learns to catch an extra button
// without seeing it: the walk home (can real presses bring Shiku back to the
// door?) on remotes B and A, the slot-by-slot sum on Fahim's own remote C,
// Nasib's remote walking home, and the reader's own third buttons, every one
// of which walks home (Your turn). Try it is the shopkeeper's "fake" remote
// (1, 3), (2, 7); the finale returns the remote and opens the bet.
//
// This was the second half of 5.2 (05b_extra_column, rent-journey.tsx) until
// the split; the remote machine is 5.1's (remote-journey.tsx), so the remote
// looks the same as the day before. This file draws its own door mark.
//
// Watch-only figures, one or two in every <Then>: no visible copy on Nasib's
// remote (NoLineHere), remote B's walk home (WalkHome), remote C's
// slot-by-slot proof on the floor (SlotKill) and the machine running it on a
// big table (BigTable, with OneNumber in its side quest), w's walk home
// (ThirdHome) and w landing nowhere new (SameSpot), any third button walking
// home (EveryThird) and the floor already full (FloorFull), the shop pair's
// slot meters (ShopSlots) and no stretch reaching (TwoArrowsTest), the slot
// count (FloorCount) and moving day (MovingDay). Story scenes: Nasib's remote
// (NasibRemote), Fahim looking at remote C (RemoteCStare), Nasib's "w was the
// bad one" (NasibObjects), the shopkeeper's cheap remote (CheapRemote) and the
// remote going back (NasibReturns). The sealed bet acts out the picked claim
// on Nasib's floor, unmarked (TB_Claim).
//
// Tailwind only; the sheets are journey/plane. Ink on white sheets is fixed.

const O: XY = [0, 0];
/** one decimal */
const r1 = (n: number) => Math.round(n * 10) / 10;

/** A story scene takes `story` and ignores it (see journey.tsx). */
type Story = { story?: boolean };

const GROUND = 150;

/** The door corner, labelled দরজা (5.1 has its own Door with the same look). */
function DoorMark({ f }: { f: Frame }) {
  return (
    <g className="pointer-events-none">
      <circle cx={f.sx(0)} cy={f.sy(0)} r={3.6} className="fill-[#0f1b2d]" />
      <text x={f.sx(0) - 5} y={f.sy(0) + 12} textAnchor="end" fontSize={8} fontWeight={700} className="fill-[#5a6b7d]">
        দরজা
      </text>
    </g>
  );
}

/** A name under someone's feet, for people the cast doesn't have (দোকানদার চাচা). */
function NameTag({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={8} fontWeight={700} fill="#1f2937" pointerEvents="none">
      {name}
    </text>
  );
}

/** A remote held up in a story scene: a dark body with `n` coloured buttons. */
function RemoteProp({ x, y, n }: { x: number; y: number; n: number }) {
  const tones = ["#2563eb", "#e11d48", "#0d9488"];
  const h = 14 + n * 9;
  return (
    <g className={POP}>
      <rect x={x - 8} y={y - h / 2} width={16} height={h} rx={4} fill="#1e293b" />
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={x} cy={y - h / 2 + 10 + i * 9} r={3} fill={tones[i]} />
      ))}
    </g>
  );
}

/** A paper tag in Bangla, for prices and such (cast Card is monospace). */
function PaperTag({ x, y, text, ink = "#b45309" }: { x: number; y: number; text: string; ink?: string }) {
  const w = text.length * 6.2 + 20;
  return (
    <g className={POP}>
      <rect x={x - w / 2} y={y - 9} width={w} height={18} rx={3} fill="white" stroke={ink} strokeWidth={1.4} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill={ink}>
        {text}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: night, the same evening
//      as 5.2. Nasib arrives holding a three-button remote; the price tag says
//      150; he says two buttons aren't to be trusted; Fahim holds up his own
//      two-button remote C. Nothing shows whether the third button is extra.

export function NasibRemote({}: Story) {
  const s = useScene(4, [700, 1800, 2400, 2400, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যার পর নাসিব তিন button-এর একটা remote নিয়ে আসলো, দাম 150 টাকা; ফাহিমের হাতে দুই button-এর remote C">
        <CastPerson who="fahim" x={92} y={GROUND} facing={1} arm={k >= 4 ? "hold" : "down"} mood="plain" label />
        {k >= 4 && <RemoteProp x={108} y={GROUND - 42} n={2} />}
        <CastPerson who="nasib" x={k >= 1 ? 200 : 330} y={GROUND} facing={-1} walking={k === 1} arm={k >= 1 ? "hold" : "down"} mood={k === 3 ? "smug" : "plain"} label={k >= 1} />
        {k >= 1 && <RemoteProp x={184} y={GROUND - 46} n={3} />}
        {k >= 2 && <PaperTag x={250} y={34} text="3 button · 150 টাকা" />}
        {k === 3 && <Bubble x={200} y={GROUND - 68} side="left" lines={["দুই button-এ আর", "বিশ্বাস নাই. তিনটা!"]} />}
        {k >= 4 && <Bubble x={92} y={GROUND - 68} side="right" lines={["আমার remote C-তে", "তো দুইটাই."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Is the third button worth its 50 taka? Three answers,
//     no marking: the bet opens only in the finale. The remote's three
//     buttons are drawn above the question, no two on one line.

const BET = ["হ্যাঁ. তিন নম্বর button Shiku-কে নতুন জায়গায় নিবে", "না. Floor-এ তিন নম্বর button সবসময় বাড়তি", "কোন button, তার উপর নির্ভর করে"];
const NR_F = makeFrame(-1, 3, -1, 3.5, 22, 12);

/** The picked bet, acted out on Nasib's floor as a claim with a "?", never
 *  marked: a new spot at w's tip; w gone faint as extra; or w swinging to
 *  other spots, each its own case. */
function TB_Claim({ f, bet }: { f: Frame; bet: number | null }) {
  if (bet === 0)
    return (
      <g key="b0">
        <circle cx={f.sx(2)} cy={f.sy(3)} r={7} strokeWidth={1.6} strokeDasharray="3 2" className={`${POP} fill-none stroke-cat-amber`} />
        <Label f={f} at={[2, 3]} dx={-11} dy={4} anchor="end" size={9} className={`${FADE} fill-[#b45309]`}>
          নতুন?
        </Label>
      </g>
    );
  if (bet === 1)
    return (
      <g key="b1">
        <path d={`M${f.sx(0)} ${f.sy(0)}L${f.sx(2)} ${f.sy(3)}`} strokeWidth={6} strokeLinecap="round" className={`${FADE} stroke-white/70`} />
        <Label f={f} at={[2, 3]} dx={-10} dy={4} anchor="end" size={9} className={`${FADE} fill-[#5a6b7d]`}>
          বাড়তি?
        </Label>
      </g>
    );
  if (bet === 2)
    return (
      <g key="b2">
        {(
          [
            [3, 1],
            [-1, 2],
          ] as XY[]
        ).map((w, i) => (
          <g key={i}>
            <Arrow f={f} from={O} to={w} tone="teal" w={1.8} dashed draw delay={i * 450} />
            <Label f={f} at={w} dx={i ? -6 : 0} dy={-7} size={9} className={`${FADE} fill-cat-teal`}>
              ?
            </Label>
          </g>
        ))}
      </g>
    );
  return null;
}

export function ThirdBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);

  const seal = () => {
    setSealed(true);
    pass("বাজি সিল হলো. এবার চোখ ছাড়া পরীক্ষা.");
  };

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={NR_F} grid={1} axes={false} label="নাসিবের remote: e1 = (1, 0), e2 = (0, 1), w = (2, 3)" className="my-0! max-w-none">
            <Arrow f={NR_F} from={O} to={[1, 0]} tone="blue" w={2.2} draw />
            <Arrow f={NR_F} from={O} to={[0, 1]} tone="coral" w={2.2} draw delay={250} />
            <Arrow f={NR_F} from={O} to={[2, 3]} tone="teal" w={2.2} draw delay={500} />
            <TB_Claim f={NR_F} bet={bet} />
            <DoorMark f={NR_F} />
          </Plane>
        </div>
        <div className="min-w-0 font-mono text-[0.85rem] leading-relaxed">
          <div className="text-cat-blue">e₁ = (1, 0)</div>
          <div className="text-cat-coral">e₂ = (0, 1)</div>
          <div className="text-cat-teal">w = (2, 3)</div>
          <div className="mt-1 font-sans text-xs text-muted">প্রতি button 50 টাকা</div>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium leading-snug text-muted">তিন নম্বর button টা কি ওর 50 টাকার দাম রাখে?</div>
      <div className="mt-2 grid gap-1.5">
        {BET.map((o, i) => (
          <div key={o} className="relative">
            <Choice n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => setBet(i)}>
              {o}
            </Choice>
            {sealed && bet === i ? (
              <span
                aria-hidden="true"
                className={`${POP} pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 -rotate-12 rounded-md border-2 border-cat-coral px-1.5 text-xs font-bold text-cat-coral`}
              >
                সিল
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {bet !== null && !sealed ? (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={seal} className={`${primaryBtn} ${FADE}`}>
            বাজি সিল করুন
          </button>
        </div>
      ) : null}
      <Task done={sealed}>একটা উত্তর বেছে সিল করে দিন. মিলাবো একদম শেষে, remote ফেরত দেওয়ার আগে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: remote B's extra button
//      showed itself (both on one line); Nasib's three buttons each get their
//      own line, and no line holds two. No copy to see — so how to catch one?

const NL_F = makeFrame(-1, 3, -1, 3.5, 22, 12);
const NL_SAY = [
  "কাল remote B-র বাড়তি button চোখেই ধরা পড়েছিল. দুইটা একই line-এ.",
  "নাসিবের remote-এ তিনটা button: e₁, e₂ আর w = (2, 3).",
  "প্রতিটার নিজের line. কোনো line-এ দুইটা button নাই. চোখে কোনো কপি নাই.",
  "তাহলে বাড়তি button, যদি থাকেই, ধরবো কীভাবে?",
];

export function NoLineHere() {
  const s = useScene(3, [700, 1800, 2400, 2000]);
  const k = s.k;
  const line = (d: XY, cls: string) => {
    // clip the line through the door along d to the sheet, x in [−1, 3], y in [−1, 3.5]
    const lim = (a: number, lo: number, hi: number): [number, number] => (a > 0 ? [lo / a, hi / a] : a < 0 ? [hi / a, lo / a] : [-Infinity, Infinity]);
    const [ax, bx] = lim(d[0], -1, 3);
    const [ay, by] = lim(d[1], -1, 3.5);
    const t0 = Math.max(ax, ay);
    const t1 = Math.min(bx, by);
    return <path d={`M${NL_F.sx(d[0] * t0)} ${NL_F.sy(d[1] * t0)}L${NL_F.sx(d[0] * t1)} ${NL_F.sy(d[1] * t1)}`} strokeWidth={1.2} strokeDasharray="3 3" className={`${FADE} fill-none ${cls}`} />;
  };

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{NL_SAY[k]}</span>}>
      <div className="mx-auto w-[7rem]">
        <Plane f={NL_F} grid={1} axes={false} label={k === 0 ? "remote B: u = (1, 1), v = (2, 2), একই line-এ" : "নাসিবের তিনটা button, তিনটা আলাদা line"} className="my-0! max-w-none">
          {k === 0 && (
            <>
              {line([1, 1], "stroke-cat-violet/60")}
              <Arrow f={NL_F} from={O} to={[2, 2]} tone="coral" w={2.2} />
              <Arrow f={NL_F} from={O} to={[1, 1]} tone="blue" w={2.4} />
            </>
          )}
          {k >= 2 && line([1, 0], "stroke-cat-blue/50")}
          {k >= 2 && line([0, 1], "stroke-cat-coral/50")}
          {k >= 2 && line([2, 3], "stroke-cat-teal/60")}
          {k >= 1 && <Arrow f={NL_F} from={O} to={[1, 0]} tone="blue" w={2.2} draw={k === 1} />}
          {k >= 1 && <Arrow f={NL_F} from={O} to={[0, 1]} tone="coral" w={2.2} draw={k === 1} />}
          {k >= 1 && <Arrow f={NL_F} from={O} to={[2, 3]} tone="teal" w={2.2} draw={k === 1} />}
          {k >= 3 && (
            <text x={NL_F.sx(2.4)} y={NL_F.sy(1.2)} textAnchor="middle" fontSize={20} fontWeight={800} className={`${POP} fill-cat-violet`}>
              ?
            </text>
          )}
          <DoorMark f={NL_F} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2 · The walk home, on 5.1's remotes. Can Shiku press real amounts and
//     still end at the door? Remote B (the twin) can; remote A cannot, except
//     by pressing nothing. Every press walks Shiku; each non-zero try leaves
//     a dot where he stopped.

const WB_F = makeFrame(-1, 3, -1, 3, 24, 14);
const ZERO_KEYS: Key[][] = [SHELF[1].keys, SHELF[0].keys];
const ZERO_NAME = ["যমজ remote B", "পুরানো remote A"];

export function ZeroWalk() {
  const pass = useGate();
  const [rm, setRm] = useSeed("rm", 0);
  const [amt, setAmt] = useSeed<number[][]>("amt", [
    [0, 0],
    [0, 0],
  ]);
  const [dots, setDots] = useSeed<string[][]>("dots", [[], []]);
  const [tick, setTick] = useSeed<boolean[]>("tick", [false, false]);
  const keys = ZERO_KEYS[rm];
  const at = land(keys, amt[rm]);

  const press = (i: number, n: number) => {
    const next = amt[rm].map((a, j) => (j === i ? n : a));
    setAmt(amt.map((a, j) => (j === rm ? next : a)));
    const spot = land(keys, next);
    const key = `${spot[0]},${spot[1]}`;
    const nonzero = next.some((x) => x !== 0);
    const ds = dots.map((d, j) => (j === rm && nonzero && !d.includes(key) ? [...d, key] : d));
    setDots(ds);
    const t = [...tick];
    if (rm === 0 && nonzero && same(spot, O)) t[0] = true;
    if (rm === 1 && ds[1].length >= 3) t[1] = true;
    setTick(t);
    if (t[0] && t[1]) pass("শূন্য না চেপেও দরজায় ফেরা মানে: বাড়তি button.");
  };

  return (
    <>
      <div className="mx-auto flex max-w-xs justify-center gap-2">
        {ZERO_NAME.map((n, i) => (
          <button key={n} type="button" onClick={() => setRm(i)} className={pill(rm === i)}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-start justify-center gap-3">
        <div className="w-[8rem] shrink-0">
          <Plane f={WB_F} grid={1} axes={false} label={`${ZERO_NAME[rm]}, Shiku ${tup(at)}-এ`} className="my-0! max-w-none">
            {dots[rm].map((d) => {
              const p = d.split(",").map(Number) as XY;
              return p[0] === 0 && p[1] === 0 ? null : <Dot key={d} f={WB_F} at={p} r={2.6} className="fill-cat-coral/50" pop />;
            })}
            <Star f={WB_F} at={O} done={tick[rm]} />
            <Chains f={WB_F} keys={keys} amt={amt[rm]} />
            <DoorMark f={WB_F} />
            <Shiku f={WB_F} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <Recipe keys={keys} amt={amt[rm]} hit={same(at, O)} size="text-[0.95rem]" />
          <div className="mt-2">
            <ButtonRemote keys={keys} amt={amt[rm]} onAmt={press} f={WB_F} min={-3} max={3} />
          </div>
          {tick[0] ? <div className={`${FADE} mt-2 text-[0.85rem] leading-snug text-accent-text`}>B: 2·u − 1·v = (0, 0). সত্যিকারের চাপ, সোজা দরজায়.</div> : null}
          {tick[1] ? <div className={`${FADE} mt-1 text-[0.85rem] leading-snug text-muted`}>A: শুধু (0, 0) চাপলেই দরজা. মানে কিছুই না চাপা.</div> : null}
        </div>
      </div>
      <Ticks items={[["B দরজায় ফিরলো", tick[0]], ["A: শূন্য ছাড়া ফেরে না", tick[1]]]} />
      <Task done={tick[0] && tick[1]}>
        {rm === 0 ? "Remote B-তে: দুইটা button-ই 0 না রেখে Shiku-কে আবার দরজায় আনুন." : "এবার remote A. চেষ্টা করুন তিনটা আলাদা চাপ দিয়ে. শূন্য না, এমন."}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: u alone looks fine; v
//      arrives on the same line; then remote B's walk home, drawn out — u
//      twice forward, then v once back to the door.

const WH_SAY = [
  "Remote B-র u = (1, 1). u একা থাকলে ওকে কখনো বাড়তি মনে হয় নাই.",
  "v একই line-এ এসে বসতেই u বাড়তি হয়ে গেলো.",
  "u দুইবার: (1, 1), তারপর (2, 2). ঠিক v যেখানে পৌঁছায়.",
  "এবার v একবার, উল্টা দিকে: 2·u − 1·v = (0, 0). দরজা, অথচ চাপগুলা শূন্য না.",
];

export function WalkHome() {
  const s = useScene(3, [700, 2200, 2000, 2200]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{WH_SAY[k]}</span>}>
      <div className="mx-auto w-[8rem]">
        <Plane f={WB_F} grid={1} axes={false} label="remote B শূন্য না চেপেও দরজায় ফেরে" className="my-0! max-w-none">
          {k >= 1 && k < 3 && <Arrow f={WB_F} from={O} to={[2, 2]} tone="coral" w={2.4} draw={k === 1} faint={k === 2} />}
          {k >= 3 && <Arrow f={WB_F} from={[2, 2]} to={O} tone="coral" w={2.4} draw />}
          <Arrow f={WB_F} from={O} to={[1, 1]} tone="blue" w={2.4} draw={k === 0} />
          {k >= 2 && <Arrow f={WB_F} from={[1, 1]} to={[2, 2]} tone="blue" w={2.4} draw dashed />}
          <Label f={WB_F} at={[1, 1]} dx={-10} dy={-2} size={9} className="fill-cat-blue font-mono">
            u
          </Label>
          {k >= 1 && (
            <Label f={WB_F} at={[2, 2]} dx={9} dy={4} size={9} className="fill-cat-coral font-mono">
              v
            </Label>
          )}
          <DoorMark f={WB_F} />
          {k >= 3 && <Shiku f={WB_F} at={O} />}
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: Fahim, quiet, looking at
//      his own remote C. Its two buttons, (1, 2) and (2, 5), drawn on a small
//      sheet beside him, each with its own line: no copy shows. Then the
//      thought the setup asks: is an extra button hiding in there anyway?

const RC_O = { x: 214, y: 134 };
const rcX = (x: number) => RC_O.x + x * 11;
const rcY = (y: number) => RC_O.y - y * 11;

export function RemoteCStare({}: Story) {
  const s = useScene(3, [700, 2000, 2200, 2400]);
  const k = s.k;
  /** the line through the door along (a, b), clipped to the sheet */
  const rcLine = (a: number, b: number) => {
    const t = Math.min(2.7 / a, 5.7 / b);
    return `M${rcX(-a * 0.3)} ${rcY(-b * 0.3)}L${rcX(a * t)} ${rcY(b * t)}`;
  };

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="ফাহিম চুপ করে নিজের remote C-র দিকে তাকিয়ে আছে: u = (1, 2), v = (2, 5), কোনো কপি চোখে পড়ে না">
        <CastPerson who="fahim" x={110} y={GROUND} facing={1} arm="hold" mood={k >= 3 ? "puzzled" : "plain"} label />
        <RemoteProp x={126} y={GROUND - 42} n={2} />
        {k >= 1 && (
          <g className={FADE}>
            <rect x={196} y={60} width={52} height={86} rx={4} fill="white" stroke="#cbd5e1" />
            {[0, 1, 2].map((x) => (
              <path key={`x${x}`} d={`M${rcX(x)} 63V143`} stroke="#dbe6f3" strokeWidth={0.8} />
            ))}
            {[0, 1, 2, 3, 4, 5, 6].map((y) => (
              <path key={`y${y}`} d={`M199 ${rcY(y)}H245`} stroke="#dbe6f3" strokeWidth={0.8} />
            ))}
            <path d={`M${RC_O.x} ${RC_O.y}L${rcX(1)} ${rcY(2)}`} stroke="#2563eb" strokeWidth={2.4} strokeLinecap="round" />
            <circle cx={rcX(1)} cy={rcY(2)} r={2.4} fill="#2563eb" />
            <path d={`M${RC_O.x} ${RC_O.y}L${rcX(2)} ${rcY(5)}`} stroke="#e11d48" strokeWidth={2.4} strokeLinecap="round" />
            <circle cx={rcX(2)} cy={rcY(5)} r={2.4} fill="#e11d48" />
            <circle cx={RC_O.x} cy={RC_O.y} r={2.6} fill="#0f1b2d" />
            <text x={256} y={rcY(2) + 3} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8">
              (1, 2)
            </text>
            <text x={256} y={rcY(5) + 3} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#be123c">
              (2, 5)
            </text>
          </g>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <path d={rcLine(1, 2)} stroke="#2563eb" strokeOpacity={0.5} strokeWidth={1} strokeDasharray="3 3" fill="none" />
            <path d={rcLine(2, 5)} stroke="#e11d48" strokeOpacity={0.5} strokeWidth={1} strokeDasharray="3 3" fill="none" />
          </g>
        )}
        {k >= 3 && <Bubble x={110} y={GROUND - 68} side="right" tone="think" lines={["বাড়তি button লুকিয়ে", "নাই তো?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · Fahim's own remote C, (1, 2) and (2, 5): no visible copy anywhere.
//     First hunt for a non-zero walk home (there isn't one), then step the
//     slot machine that proves it, one line per tap.

const TP_F = makeFrame(-1, 3, -1, 6, 18, 15);
const TRICK_ROWS: { lhs: string; rhs: string; note: string }[] = [
  { lhs: "slot 1: α·1 + β·2 = 0", rhs: "α = −2β", note: "Slot 1 শূন্যে ফিরতে পারে, যদি α হয় β-র মাইনাস দ্বিগুণ." },
  { lhs: "slot 2: α·2 + β·5 = 0", rhs: "β = 0", note: "α = −2β বসাই: −4β + 5β = β. β শূন্য না হলে slot 2 রাজি না." },
  { lhs: "তাহলে α = −2 · 0", rhs: "α = 0", note: "একটা চাপ শূন্য হলো, সাথে অন্যটাও." },
];

export function NoVisibleCopy() {
  const pass = useGate();
  const [phase, setPhase] = useSeed<"hunt" | "sum">("phase", "hunt");
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0]);
  const [tries, setTries] = useSeed<string[]>("tries", []);
  const [k, setK] = useSeed("k", 0);
  const keys = SHELF[2].keys;
  const at = land(keys, amt);
  const over = k > TRICK_ROWS.length;

  const press = (i: number, n: number) => {
    const next = amt.map((a, j) => (j === i ? n : a));
    setAmt(next);
    const spot = land(keys, next);
    const key = `${spot[0]},${spot[1]}`;
    if (next.some((x) => x !== 0) && !tries.includes(key)) setTries([...tries, key]);
  };
  const step = () => {
    const nk = k + 1;
    setK(nk);
    if (nk > TRICK_ROWS.length) pass("শুধু (0, 0)-তেই দরজা: independent.");
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={TP_F} grid={1} axes={false} label={`remote C, Shiku ${tup(at)}-এ, দরজায় ফেরার চেষ্টা`} className="my-0! max-w-none">
            {tries.map((t) => {
              const p = t.split(",").map(Number) as XY;
              return p[0] === 0 && p[1] === 0 ? null : <Dot key={t} f={TP_F} at={p} r={2.4} className="fill-cat-coral/50" pop />;
            })}
            <Star f={TP_F} at={O} />
            <Chains f={TP_F} keys={keys} amt={amt} />
            <DoorMark f={TP_F} />
            <Shiku f={TP_F} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          {phase === "hunt" ? (
            <>
              <Recipe keys={keys} amt={amt} hit={same(at, O)} size="text-[0.95rem]" />
              <div className="mt-2">
                <ButtonRemote keys={keys} amt={amt} onAmt={press} f={TP_F} min={-2} max={4} />
              </div>
              {tries.length > 0 && tries.length < 3 ? <div className="mt-1.5 text-xs text-muted">চেষ্টা {tries.length} বার. দরজায় একবারও না.</div> : null}
              {tries.length >= 3 ? (
                <div className="mt-2">
                  <button type="button" onClick={() => setPhase("sum")} className={`${quietBtn} h-9 text-sm`}>
                    আঙুল হার মানলো, হিসাব করি
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-2xl border border-border px-3 py-2">
              <div className="text-center text-xs font-semibold">α বার (1, 2), β বার (2, 5). দুইটা slot-ই 0</div>
              <div className="mt-1.5 grid gap-1">
                {TRICK_ROWS.slice(0, k).map((r) => (
                  <div key={r.lhs} className={`${POP} rounded-xl bg-foreground/[0.04] px-2.5 py-1`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[0.7rem]">{r.lhs}</span>
                      <b className="whitespace-nowrap font-mono text-[0.85rem]">{r.rhs}</b>
                    </div>
                    <div className="text-[0.68rem] leading-snug text-muted">{r.note}</div>
                  </div>
                ))}
              </div>
              {over && (
                <div className={`${FADE} mt-1.5 rounded-xl bg-accent/10 px-2.5 py-1.5 text-center text-[0.85rem] font-medium text-accent-text`}>
                  শুধু (0, 0). দুইটা button-ই দরকারি.
                </div>
              )}
              {!over && (
                <div className="mt-2 flex justify-center">
                  <button type="button" onClick={step} className={`${primaryBtn} h-9 text-sm`}>
                    {k === 0 ? "হিসাব শুরু করুন" : "পরের লাইন"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Task done={over}>{phase === "hunt" ? "Remote C-কে দরজায় ফেরানোর চেষ্টা করুন. তিনবার সৎ চেষ্টা, তারপর হিসাব." : "হিসাবটা এক লাইন এক লাইন করে চালান: শূন্য না, এমন কোনো জোড়া কি দরজায় ফেরে?"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the slot-by-slot proof
//      acted out on the floor. Presses with α = −2β always bring slot 1 back
//      to 0, so Shiku stops straight above or below the door — exactly β
//      squares off. Home needs β = 0, and then α = 0 too.

const SK_F = makeFrame(-2.5, 2.5, -4.5, 3.5, 14, 10);
const SK_U: XY = [1, 2];
const SK_V: XY = [2, 5];
const SK_SAY = [
  "Remote C: u = (1, 2), v = (2, 5). α = −2β রেখে চাপ দিই: ধরেন α = −2, β = 1.",
  "−2u, তারপর v: slot 1 শূন্যে ফিরলো, কথামতো. Slot 2 থামলো 1-এ. ওটাই β.",
  "β যা-ই দিন, Shiku থামে দরজার ঠিক উপরে বা নিচে, β ঘর দূরে.",
  "β = 0, তাই α = 0-ও. কিছু না চাপলেই শুধু দরজা.",
];

export function SlotKill() {
  const s = useScene(3, [700, 2600, 2400, 2000]);
  const k = s.k;
  const low: XY = [-2 * SK_U[0], -2 * SK_U[1]];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SK_SAY[k]}</span>}>
      <div className="mx-auto w-[5.6rem]">
        <Plane f={SK_F} grid={1} axes={false} label="alpha = −2 beta রাখলে Shiku দরজার ঠিক উপরে বা নিচে থামে" className="my-0! max-w-none">
          {k >= 2 && <path d={`M${SK_F.sx(0)} ${SK_F.sy(-4.5)}V${SK_F.sy(3.5)}`} strokeWidth={1.4} strokeDasharray="3 3" className={`${FADE} fill-none stroke-cat-violet/60`} />}
          {k === 0 && <Arrow f={SK_F} from={O} to={SK_U} tone="blue" w={2.2} />}
          {k === 0 && <Arrow f={SK_F} from={O} to={SK_V} tone="coral" w={2.2} />}
          {k === 1 && <Arrow f={SK_F} from={O} to={low} tone="blue" w={2.2} draw dashed />}
          {k === 1 && <Arrow f={SK_F} from={low} to={[0, 1]} tone="coral" w={2.2} draw delay={700} />}
          {k >= 1 && k < 3 && <Dot f={SK_F} at={[0, 1]} r={3} className="fill-cat-violet" pop />}
          {k === 2 &&
            ([2, -1] as const).map((b) => (
              <g key={b}>
                <Dot f={SK_F} at={[0, b]} r={3} className="fill-cat-violet/70" pop />
                <Label f={SK_F} at={[0, b]} dx={8} dy={3} anchor="start" size={8} className="fill-[#5a6b7d] font-mono">
                  {`β = ${sg(b)}`}
                </Label>
              </g>
            ))}
          {k === 2 && (
            <Label f={SK_F} at={[0, 1]} dx={8} dy={3} anchor="start" size={8} className="fill-[#5a6b7d] font-mono">
              β = 1
            </Label>
          )}
          <Star f={SK_F} at={O} done={k >= 3} />
          <DoorMark f={SK_F} />
          {k >= 3 && <Shiku f={SK_F} at={O} />}
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3¾ · A second figure for screen 3's explanation, no task: who did the work.
//      Remote C's whole test was two lines of sum, no hunting. An AI table is
//      huge; there the same sum is the whole test, and the machine runs it,
//      column by column.

const BT_SAY = ["Remote C-র পুরা পরীক্ষা: দুই লাইন হিসাব. খোঁজাখুঁজি নাই.", "AI-এর table-গুলা বিশাল হয়.", "সেখানে এই হিসাবটাই পুরা পরীক্ষা. Machine চালায়."];
const BT_COLS = 14;
const BT_ROWS = 7;

export function BigTable() {
  const s = useScene(2, [700, 1800, 2400]);
  const k = s.k;
  const cx = (c: number) => 92 + c * 9;
  const cy = (r: number) => 12 + r * 9;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{BT_SAY[k]}</span>}>
      <svg viewBox="0 0 224 84" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="দুই লাইন হিসাব, আর বিশাল table-এ machine একই হিসাব চালায়">
        <g className={k >= 1 ? "opacity-60 transition-opacity duration-500 motion-reduce:transition-none" : ""}>
          <rect x={2} y={22} width={78} height={40} rx={5} fill="white" stroke="#cbd5e1" />
          <text x={10} y={38} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#0f1b2d">
            α = −2β
          </text>
          <text x={10} y={53} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#0f1b2d">
            β = 0
          </text>
        </g>
        {k >= 1 && (
          <g className={FADE}>
            <rect x={cx(0) - 5} y={cy(0) - 5} width={BT_COLS * 9 + 1} height={BT_ROWS * 9 + 1} rx={3} fill="white" stroke="#cbd5e1" />
            {Array.from({ length: BT_COLS * BT_ROWS }, (_, i) => (
              <rect key={i} x={cx(i % BT_COLS) - 3} y={cy(Math.floor(i / BT_COLS)) - 3} width={6} height={6} rx={1} fill="#dbe6f3" />
            ))}
          </g>
        )}
        {k >= 2 &&
          Array.from({ length: BT_COLS }, (_, c) => (
            <rect
              key={c}
              x={cx(c) - 4}
              y={cy(0) - 4}
              width={8}
              height={BT_ROWS * 9 - 1}
              rx={2}
              style={{ transitionDelay: `${c * 110}ms` }}
              className="fill-cat-violet/30 transition-opacity duration-300 motion-reduce:transition-none starting:opacity-0"
            />
          ))}
        {k >= 2 && <Draw d={`M${cx(0) - 4} ${cy(BT_ROWS) - 1}H${cx(BT_COLS - 1) + 4}`} ms={1600} strokeWidth={2} className="stroke-cat-violet" />}
        {k >= 2 && (
          <text x={cx(BT_COLS - 1) + 4} y={cy(BT_ROWS) + 9} textAnchor="end" fontSize={8} fontWeight={700} className={`${FADE} fill-cat-violet`}>
            machine
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3⅞ · A figure for screen 3's side quest, no task: the whole test in one
//      number. Remote C's two buttons go in, one number comes out, and which
//      number is left as "?" for Article 8.

const ON_SAY = ["Remote C-র দুইটা button: (1, 2) আর (2, 5).", "এক সংখ্যাতেই পুরা ব্যাপারটা মিটিয়ে ফেলার একটা উপায়ও আছে.", "কোন সংখ্যা? Article 8 সেটা আপনার হাতে দিবে."];

export function OneNumber() {
  const s = useScene(2, [700, 2200, 2200]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{ON_SAY[k]}</span>}>
      <svg viewBox="0 0 200 60" className="mx-auto h-auto w-full max-w-[14rem]" role="img" aria-label="দুইটা button থেকে একটা সংখ্যা">
        <g>
          <rect x={4} y={10} width={50} height={18} rx={4} fill="white" stroke="#2563eb" strokeWidth={1.3} />
          <text x={29} y={22.5} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8">
            (1, 2)
          </text>
          <rect x={4} y={34} width={50} height={18} rx={4} fill="white" stroke="#e11d48" strokeWidth={1.3} />
          <text x={29} y={46.5} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#be123c">
            (2, 5)
          </text>
        </g>
        {k >= 1 && <Draw d="M58 19C80 19 82 31 100 31M58 43C80 43 82 31 100 31" ms={800} strokeWidth={1.6} className="stroke-[#5a6b7d]" />}
        {k >= 1 && <Draw d="M100 31H140" delay={700} ms={500} strokeWidth={1.6} className="stroke-[#5a6b7d]" />}
        {k >= 1 && (
          <g className={POP} style={{ transitionDelay: "1100ms" }}>
            <rect x={144} y={17} width={36} height={28} rx={5} fill="white" stroke="#7c3aed" strokeWidth={1.6} />
            <text x={162} y={36} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily="ui-monospace, monospace" fill="#7c3aed">
              ?
            </text>
          </g>
        )}
        {k >= 2 && (
          <text x={162} y={56} textAnchor="middle" fontSize={8} fontWeight={700} className={`${FADE} fill-[#7c3aed]`}>
            Article 8
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · Nasib's remote walks home. Three buttons, e₁, e₂ and w = (2, 3): find
//     presses, not all zero, that bring Shiku back to the door.

const TH_F = makeFrame(-1, 3, -1, 4, 20, 14);
const TH_KEYS: Key[] = [...SHELF[0].keys, { name: "w", v: [2, 3], tone: "teal" }];
/** the widget's sheet: room for presses that run back past the door */
const NW_F = makeFrame(-3, 3, -3, 4, 16, 10);

export function NasibWalk() {
  const pass = useGate();
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0, 0]);
  const [found, setFound] = useSeed("found", false);
  const at = land(TH_KEYS, amt);

  const press = (i: number, n: number) => {
    if (found) return;
    const next = amt.map((a, j) => (j === i ? n : a));
    setAmt(next);
    if (next.some((x) => x !== 0) && same(land(TH_KEYS, next), O)) {
      setFound(true);
      pass("w-ও শূন্য না চেপে দরজায় ফেরে. ও বাড়তি.");
    }
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[8rem] shrink-0">
          <Plane f={NW_F} grid={1} axes={false} label={`নাসিবের তিন button, Shiku ${tup(at)}-এ`} className="my-0! max-w-none">
            <Chains f={NW_F} keys={TH_KEYS} amt={amt} />
            <Arrow f={NW_F} from={O} to={[2, 3]} tone="teal" w={2} faint />
            <Star f={NW_F} at={O} done={found} />
            <DoorMark f={NW_F} />
            <Shiku f={NW_F} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          <Recipe keys={TH_KEYS} amt={amt} hit={same(at, O)} size="text-[0.85rem]" />
          <div className="mt-2">
            <ButtonRemote keys={TH_KEYS} amt={amt} onAmt={press} f={NW_F} min={-3} max={3} />
          </div>
        </div>
      </div>
      {found ? (
        <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-3 py-1.5 text-center text-[0.85rem] leading-snug text-accent-text`}>
          তিনটা button. চাপ শূন্য না, তবু দরজা. কেন? w যতদূর নেয়, e₁ আর e₂ মিলে ঠিক ততটাই ফেরত আনে.
        </div>
      ) : null}
      <Task done={found}>তিন button মিলিয়ে এমন চাপ খুঁজুন যাতে Shiku আবার দরজায় ফেরে. সবগুলা 0 রাখলে চলবে না.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: (−x, −y, 1) walking home.
//      w = (2, 3) once, then e₁ back 2 and e₂ back 3 — Shiku is at the door.

const TH2_SAY = [
  "দুই slot-এর floor-এ তিনটা button: e₁, e₂ আর w = (2, 3).",
  "w একবার চাপুন: Shiku এখন (2, 3)-এ.",
  "e₁ −2 বার: 2 ঘর পিছনে. এখন (0, 3).",
  "e₂ −3 বার: দরজা. চাপগুলা ছিল (−2, −3, 1).",
];

export function ThirdHome() {
  const s = useScene(3, [700, 1600, 1800, 1800]);
  const k = s.k;
  const w: XY = [2, 3];
  const at: XY = k === 0 ? O : k === 1 ? w : k === 2 ? [0, 3] : O;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{TH2_SAY[k]}</span>}>
      <div className="mx-auto w-[7rem]">
        <Plane f={TH_F} grid={1} axes={false} label="w একবার, e1 পিছনে 2, e2 পিছনে 3: দরজা" className="my-0! max-w-none">
          <Arrow f={TH_F} from={O} to={[1, 0]} tone="blue" w={2.2} faint={k >= 1} />
          <Arrow f={TH_F} from={O} to={[0, 1]} tone="coral" w={2.2} faint={k >= 1} />
          <Arrow f={TH_F} from={O} to={w} tone="teal" w={2.2} draw={k === 1} />
          <Label f={TH_F} at={w} dx={9} dy={3} size={9} className="fill-cat-teal font-mono">
            w
          </Label>
          {k >= 2 && <Arrow f={TH_F} from={w} to={[0, 3]} tone="blue" w={2.2} draw />}
          {k >= 3 && <Arrow f={TH_F} from={[0, 3]} to={O} tone="coral" w={2.2} draw />}
          <Star f={TH_F} at={O} done={k >= 3} />
          <DoorMark f={TH_F} />
          <Shiku f={TH_F} at={at} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A second figure for screen 4's explanation, no task: w takes Shiku
//      nowhere new. One press of w lands on (2, 3); from the door again, e₁
//      twice and e₂ three times land on the very same spot.

const SS_SAY = ["w একবার চাপলে Shiku যায় (2, 3)-এ.", "আবার দরজা থেকে, এবার w ছাড়া. e₁ দুইবার: (2, 0).", "e₂ তিনবার: সেই (2, 3). w নতুন কোনো জায়গায় নেয় নাই."];

export function SameSpot() {
  const s = useScene(2, [700, 2000, 2400]);
  const k = s.k;
  const at: XY = k === 0 ? [2, 3] : k === 1 ? [2, 0] : [2, 3];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SS_SAY[k]}</span>}>
      <div className="mx-auto w-[7rem]">
        <Plane f={TH_F} grid={1} axes={false} label="w একবার, আর e1 দুইবার ও e2 তিনবার, একই জায়গায়" className="my-0! max-w-none">
          <Arrow f={TH_F} from={O} to={[2, 3]} tone="teal" w={2.2} draw={k === 0} faint={k >= 1} />
          <Label f={TH_F} at={[2, 3]} dx={-9} dy={-4} size={9} className="fill-cat-teal font-mono">
            w
          </Label>
          {k >= 1 &&
            [0, 1].map((j) => <Arrow key={`e1${j}`} f={TH_F} from={[j, 0]} to={[j + 1, 0]} tone="blue" w={2.2} draw delay={j * 500} />)}
          {k >= 2 &&
            [0, 1, 2].map((j) => <Arrow key={`e2${j}`} f={TH_F} from={[2, j]} to={[2, j + 1]} tone="coral" w={2.2} draw delay={j * 450} />)}
          <Star f={TH_F} at={[2, 3]} done={k >= 2} />
          <DoorMark f={TH_F} />
          <Shiku f={TH_F} at={at} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: the same evening. Nasib
//      won't let go: he points at w's card and says w was the bad one; any
//      other button, and you'd see.

export function NasibObjects({}: Story) {
  const s = useScene(2, [700, 2400, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="নাসিব বললো, ওই w টাই খারাপ ছিল, অন্য কোনো button হলে দেখতে">
        <CastPerson who="fahim" x={84} y={GROUND} facing={1} mood="plain" label />
        <CastPerson who="nasib" x={190} y={GROUND} facing={-1} arm={k >= 1 ? "point" : "hold"} mood={k >= 1 ? "shout" : "plain"} label />
        <RemoteProp x={168} y={GROUND - 44} n={3} />
        {k >= 1 && <CastCard x={270} y={66} text="w = (2, 3)" tone="teal" />}
        {k === 1 && <Bubble x={190} y={GROUND - 68} side="left" lines={["ওই w টাই", "খারাপ ছিল."]} />}
        {k >= 2 && <Bubble x={190} y={GROUND - 68} side="left" lines={["অন্য কোনো button", "হলে দেখতে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · Your turn: Nasib's challenge. Drop your own third button anywhere on
//     the floor — a button that is NOT extra wins. Every drop plays its walk
//     home: w out, e₁ back, e₂ back. It cannot be won; after three tries the
//     screen passes.

const AT_F = makeFrame(-2, 3, -1, 4, 19, 12);

/** the walk home for a third button w: w out, then e₁ back, then e₂ back */
function HomeTrail({ f, w, keyed }: { f: Frame; w: XY; keyed: string }) {
  if (same(w, O)) return <Dot key={keyed} f={f} at={O} r={6} className="fill-cat-teal/40" pop />;
  const mid: XY = [0, w[1]];
  return (
    <g key={keyed}>
      <Arrow f={f} from={O} to={w} tone="teal" w={2.2} draw />
      {w[0] !== 0 && <Arrow f={f} from={w} to={mid} tone="blue" w={2} draw delay={600} />}
      {w[1] !== 0 && <Arrow f={f} from={mid} to={O} tone="coral" w={2} draw delay={1100} />}
    </g>
  );
}

export function AnyThird() {
  const pass = useGate();
  const [wAt, setWAt] = useSeed<XY>("wAt", [2, 3]);
  const [placed, setPlaced] = useSeed<string[]>("placed", []);
  const done = placed.length >= 3;
  const last: XY | null = placed.length ? (placed[placed.length - 1].split(",").map(Number) as XY) : null;
  const dragging = !last || !same(last, wAt);

  const drop = (p: XY) => {
    if (done) return;
    setWAt(snap(p, AT_F));
  };
  const place = () => {
    if (done) return;
    const key = `${wAt[0]},${wAt[1]}`;
    if (placed.includes(key)) return;
    const list = [...placed, key];
    setPlaced(list);
    if (list.length >= 3) pass("Floor-এ তিনটা button: একটা সবসময় বাড়তি.");
  };
  const line = !last
    ? "w এখনো (2, 3). টেনে নতুন কোথাও নিয়ে ছেড়ে দিন."
    : same(last, O)
      ? "w = (0, 0): শূন্য button. একবার চাপলেই, কোথাও না গিয়ে দরজায়."
      : `w = ${tup(last)}: চাপ (${sg(-last[0])}, ${sg(-last[1])}, 1). দরজা.`;

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[7.5rem] shrink-0">
          <Plane f={AT_F} grid={1} axes={false} label="নিজের তিন নম্বর button যেখানে খুশি বসান" className="my-0! max-w-none" drag={done ? undefined : { down: drop, move: drop, up: place }}>
            <Arrow f={AT_F} from={O} to={[1, 0]} tone="blue" w={2.2} faint={!!last && !dragging} />
            <Arrow f={AT_F} from={O} to={[0, 1]} tone="coral" w={2.2} faint={!!last && !dragging} />
            {dragging ? <Arrow f={AT_F} from={O} to={wAt} tone="teal" w={2.2} dashed /> : null}
            {last && !dragging ? <HomeTrail f={AT_F} w={last} keyed={placed.join("|")} /> : null}
            <Label f={AT_F} at={wAt} dx={9} dy={3} size={9} className="fill-cat-teal font-mono">
              w
            </Label>
            <Star f={AT_F} at={O} done={!!last && !dragging} />
            <DoorMark f={AT_F} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[0.85rem] leading-snug text-muted">নাসিব বলছে, w টাই বাজে ছিল. যেখানে খুশি তিন নম্বর button বসান. Machine সাথে সাথে দরজায় ফেরার পথ খুঁজবে.</div>
          <div key={placed.length} className={`${FADE} mt-2 rounded-xl bg-foreground/[0.04] px-2.5 py-1.5 text-[0.8rem] leading-relaxed`}>
            {line}
          </div>
          <div className="mt-1.5 text-xs text-muted">
            আপনার button: {placed.length ? placed.map((p) => `(${p.replace(",", ", ")})`).join(" · ") : "এখনো নাই"}.{done ? "" : ` আর ${3 - placed.length} টা.`}
          </div>
        </div>
      </div>
      <Task done={done}>এমন একটা তিন নম্বর button খুঁজুন যেটা বাড়তি না. তিন জায়গায় বসিয়ে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: three third buttons,
//      one per beat — (3, 1), (−2, 2), the zero button — each walking home
//      with e₁ and e₂ taking back its whole push.

const EV_W: XY[] = [
  [3, 1],
  [-2, 2],
  [0, 0],
];
const EV_SAY = [
  "e₁ আর e₂ মিলে floor-এর যেকোনো জায়গায় যায়. কাল remote A-তে দেখেছেন.",
  "w = (3, 1): e₁ −3 বার, e₂ −1 বার, w একবার. দরজা.",
  "w = (−2, 2): e₁ +2 বার, e₂ −2 বার, w একবার. দরজা.",
  "w = (0, 0): শূন্য button নিজেই দরজায় ফেরে. সবসময় বাড়তি.",
];

export function EveryThird() {
  const s = useScene(3, [700, 2200, 2200, 2200]);
  const k = s.k;
  const w = k >= 1 ? EV_W[k - 1] : null;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{EV_SAY[k]}</span>}>
      <div className="mx-auto w-[8rem]">
        <Plane f={AT_F} grid={1} axes={false} label="যেকোনো তিন নম্বর button দরজায় ফেরে" className="my-0! max-w-none">
          <Arrow f={AT_F} from={O} to={[1, 0]} tone="blue" w={2.2} faint={k >= 1} />
          <Arrow f={AT_F} from={O} to={[0, 1]} tone="coral" w={2.2} faint={k >= 1} />
          {w ? <HomeTrail f={AT_F} w={w} keyed={`${k}`} /> : null}
          <Star f={AT_F} at={O} done={k >= 1} />
          <DoorMark f={AT_F} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5¾ · A second figure for screen 5's explanation, no task: why two is the
//      most. e₁ and e₂ already reach every spot on the floor; a third button
//      lands on a spot already in hand, so it is always the extra one.

const FF_SAY = [
  "দুই slot-এর floor. e₁ আর e₂.",
  "এই দুইটা মিলেই floor-এর প্রতিটা জায়গায় পৌঁছানো যায়.",
  "তিন নম্বর button যেখানেই নামুক, জায়গাটা আগেই হাতে. তিনটা হলেই একটা সবসময় বাড়তি.",
];
const FF_SPOTS: XY[] = [];
for (let y = 4; y >= -1; y -= 1) for (let x = -2; x <= 3; x += 1) FF_SPOTS.push([x, y]);

export function FloorFull() {
  const s = useScene(2, [700, 2200, 2600]);
  const k = s.k;
  const w: XY = [-1, 2];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{FF_SAY[k]}</span>}>
      <div className="mx-auto w-[8rem]">
        <Plane f={AT_F} grid={1} axes={false} label="e1 আর e2 floor-এর সব জায়গায় যায়, তিন নম্বর button বাড়তি" className="my-0! max-w-none">
          {k >= 1 &&
            FF_SPOTS.map((p, i) => (
              <circle
                key={`${p[0]},${p[1]}`}
                cx={AT_F.sx(p[0])}
                cy={AT_F.sy(p[1])}
                r={2.4}
                style={{ transitionDelay: `${i * 35}ms` }}
                className={`${POP} fill-cat-violet/45`}
              />
            ))}
          <Arrow f={AT_F} from={O} to={[1, 0]} tone="blue" w={2.2} />
          <Arrow f={AT_F} from={O} to={[0, 1]} tone="coral" w={2.2} />
          {k >= 2 && <Arrow f={AT_F} from={O} to={w} tone="teal" w={2.2} draw />}
          {k >= 2 && <circle cx={AT_F.sx(w[0])} cy={AT_F.sy(w[1])} r={5.5} strokeWidth={1.6} className={`${POP} fill-none stroke-cat-violet`} />}
          {k >= 2 && (
            <Label f={AT_F} at={w} dx={0} dy={-9} size={8.5} className={`${FADE} fill-[#5a6b7d]`}>
              বাড়তি
            </Label>
          )}
          <DoorMark f={AT_F} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for the Try it's setup, no task: next morning at the
//      toy shop. The shopkeeper pulls out a cheap remote, (1, 3) and (2, 7),
//      and calls it a fake: one button a copy of the other. Fahim looks.

export function CheapRemote({}: Story) {
  const s = useScene(3, [700, 2000, 2600, 2000]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="সকালে খেলনার দোকানে দোকানদার চাচা একটা সস্তা remote দেখালেন, বললেন একটা button আরেকটার কপি">
        <CastPerson who="nana" x={96} y={GROUND - 8} facing={1} arm={k >= 1 ? "hold" : "down"} mood="plain" scale={0.9} />
        <Stall x={96} y={GROUND} sign="খেলনা" w={92} />
        <NameTag x={96} y={GROUND + 14} name="দোকানদার চাচা" />
        {k >= 1 && <RemoteProp x={118} y={GROUND - 64} n={2} />}
        {k >= 1 && (
          <g className={POP}>
            <text x={130} y={64} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#1d4ed8">
              (1, 3)
            </text>
            <text x={130} y={76} fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#be123c">
              (2, 7)
            </text>
          </g>
        )}
        {k === 2 && <Bubble x={96} y={GROUND - 96} side="right" lines={["এইটা নকল মাল.", "একটা বাটন আরেকটার কপি."]} />}
        <CastPerson who="fahim" x={k >= 1 ? 214 : 290} y={GROUND} facing={-1} walking={k === 1} mood={k >= 3 ? "puzzled" : "plain"} label />
        <CastPerson who="nasib" x={k >= 1 ? 262 : 320} y={GROUND} facing={-1} walking={k === 1} arm="hold" mood="plain" label />
        {k >= 3 && <Bubble x={214} y={GROUND - 68} side="left" tone="think" lines={["কপি?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · Try it: u = (1, 3), v = (2, 7). Which stretch of u lands on v? Three
//     pictures: × 2 (fixes slot 1, lands one short), × 2⅓ (fixes slot 2,
//     overshoots slot 1), or none reaches. A wrong pick stretches u on the
//     big floor to where that stretch really goes; the right one sweeps u
//     along its whole line past v, never touching it.

const X10_F = makeFrame(-1, 3.5, -1, 8.5, 17, 12);
const X10_U: XY = [1, 3];
const X10_V: XY = [2, 7];
const X10_PICKS: { t: number | null; label: string }[] = [
  { t: 2, label: "× 2" },
  { t: 7 / 3, label: "× 2⅓" },
  { t: null, label: "কোনোটাই না" },
];
const X10_RIGHT = 2;
const X10_NOPE = ["Slot 1 ঠিক আছে, কিন্তু slot 2 v-র 7 থেকে এক ঘর কম.", "Slot 2 ঠিক আছে, কিন্তু slot 1 v-র 2 পার হয়ে গেলো."];
/** a stretch as it would be said: 2, or 2⅓ */
const x10Say = (t: number) => (Math.abs(t - 7 / 3) < 0.01 ? "2⅓" : `${r1(t)}`);

/** a small picture of one choice: v, and u stretched by t (or u's whole line for "none") */
function X10Pic({ t }: { t: number | null }) {
  const sx = (x: number) => 10 + x * 9;
  const sy = (y: number) => 66 - y * 8;
  const tip: XY = t === null ? X10_U : [X10_U[0] * t, X10_U[1] * t];
  return (
    <svg viewBox="0 0 44 72" className="h-12 w-auto shrink-0" aria-hidden="true">
      {[0, 1, 2, 3].map((x) => (
        <path key={`x${x}`} d={`M${sx(x)} ${sy(-0.5)}V${sy(8)}`} strokeWidth={0.5} className="stroke-cat-blue/25" />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((y) => (
        <path key={`y${y}`} d={`M${sx(-0.5)} ${sy(y)}H${sx(3.5)}`} strokeWidth={0.5} className="stroke-cat-blue/25" />
      ))}
      {t === null && <path d={`M${sx(-0.2)} ${sy(-0.6)}L${sx(2.8)} ${sy(8.4)}`} strokeWidth={1} strokeDasharray="2 2" className="stroke-cat-blue/70" />}
      <path d={`M${sx(0)} ${sy(0)}L${sx(X10_V[0])} ${sy(X10_V[1])}`} strokeWidth={2} strokeLinecap="round" className="stroke-cat-coral" />
      <circle cx={sx(X10_V[0])} cy={sy(X10_V[1])} r={2.2} className="fill-cat-coral" />
      <path d={`M${sx(0)} ${sy(0)}L${sx(tip[0])} ${sy(tip[1])}`} strokeWidth={2} strokeLinecap="round" className="stroke-cat-blue" />
      <circle cx={sx(tip[0])} cy={sy(tip[1])} r={2.2} className="fill-cat-blue" />
    </svg>
  );
}

export function StretchReach() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const right = pick === X10_RIGHT;
  const want = pick === null ? 1 : right ? 8 / 3 : (X10_PICKS[pick].t ?? 1);
  const [t] = useTween([want], right ? 1600 : 900);
  const tip: XY = [X10_U[0] * t, X10_U[1] * t];

  const choose = (i: number) => {
    if (right) return;
    setPick(i);
    if (i === X10_RIGHT) pass("u টেনে v-তে পৌঁছানো যায় না: independent.");
    else setMiss((m) => m + 1);
  };

  return (
    <>
      <div className="text-center text-sm font-medium text-muted">
        <div>
          <span className="font-mono text-cat-blue">u = (1, 3)</span>, <span className="font-mono text-cat-coral">v = (2, 7)</span>
        </div>
        <div>u-কে কত গুণ টানলে ঠিক v-তে গিয়ে পড়ে?</div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <div className="w-[6.2rem] shrink-0">
          <Plane f={X10_F} grid={1} axes={false} label={`u = (1, 3) টেনে (${r1(tip[0])}, ${r1(tip[1])}); v = (2, 7)`} className="my-0! max-w-none">
            {right && <path d={`M${X10_F.sx(-1 / 3)} ${X10_F.sy(-1)}L${X10_F.sx(8.5 / 3)} ${X10_F.sy(8.5)}`} strokeWidth={1.4} strokeDasharray="4 4" className={`${FADE} fill-none stroke-cat-blue/50`} />}
            <Arrow f={X10_F} from={O} to={X10_V} tone="coral" w={2.4} />
            <Label f={X10_F} at={X10_V} dx={-8} dy={-2} size={9} className="fill-cat-coral font-mono">
              v
            </Label>
            {pick !== null && <Arrow f={X10_F} from={O} to={tip} tone="blue" w={2} dashed />}
            <Arrow f={X10_F} from={O} to={X10_U} tone="blue" w={2.4} />
            <Label f={X10_F} at={X10_U} dx={-8} dy={0} size={9} className="fill-cat-blue font-mono">
              u
            </Label>
            {pick !== null && <Dot f={X10_F} at={tip} r={2.6} className="fill-cat-blue" />}
            <DoorMark f={X10_F} />
          </Plane>
        </div>
        <div className="grid min-w-0 flex-1 gap-1.5">
          {X10_PICKS.map((p, i) => (
            <Choice key={p.label} n={i} look={pick === i ? (i === X10_RIGHT ? "right" : "wrong") : "idle"} disabled={right} onClick={() => choose(i)}>
              <span className="flex items-center gap-2">
                <X10Pic t={p.t} />
                <span className={`text-[0.8rem] leading-tight ${p.t === null ? "" : "font-mono"}`}>{p.label}</span>
              </span>
            </Choice>
          ))}
        </div>
      </div>
      {pick !== null && !right ? (
        <Nope key={miss}>
          u × {x10Say(X10_PICKS[pick].t ?? 1)} গিয়ে পড়ে ({x10Say(X10_U[0] * (X10_PICKS[pick].t ?? 1))}, {r1(X10_U[1] * (X10_PICKS[pick].t ?? 1))})-এ. {X10_NOPE[pick]}
        </Nope>
      ) : null}
      {right ? (
        <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-3 py-1.5 text-center text-[0.85rem] leading-snug text-accent-text`}>
          Slot 1 চায় × 2, slot 2 চায় × 2⅓. একটা টানে দুইটা হয় না. u-র line টা v-র পাশ দিয়ে চলে যায়.
        </div>
      ) : null}
      <Task done={right}>u-কে কত গুণ টানলে v-তে পড়ে, সেই ছবিটা বাছুন. নাকি কোনোটাতেই পড়ে না?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6¼ · A figure for the exercise's explanation, no task: the slot-by-slot sum
//      on the shopkeeper's remote, read off two slot meters. With α = −2β,
//      slot 1 sits at 0 whatever β is, and slot 2 reads exactly β. Both at 0
//      only when β = 0, and then α = 0 too.

const SH_BEATS: { a: number; b: number; say: string }[] = [
  { a: 0, b: 0, say: "α বার u = (1, 3), β বার v = (2, 7). দুইটা slot-ই 0 হতে হবে." },
  { a: -2, b: 1, say: "Slot 1: α + 2β = 0, তাই α = −2β. ধরেন α = −2, β = 1. Slot 1 শূন্যে." },
  { a: 2, b: -1, say: "Slot 2: 3·(−2β) + 7β = β. β = −1 দিলে slot 2-ও −1." },
  { a: 0, b: 0, say: "β শূন্য হতেই হবে, সাথে α-ও. শুধু (0, 0)." },
];

export function ShopSlots() {
  const s = useScene(3, [700, 2600, 2600, 2200]);
  const k = s.k;
  const { a, b } = SH_BEATS[k];
  const [s1, s2] = useTween([a + 2 * b, 3 * a + 7 * b], 700);
  const mx = (v: number) => 130 + v * 28;
  const bar = (v: number, y: number, cls: string) => (
    <rect x={Math.min(mx(0), mx(v))} y={y - 5} width={Math.max(Math.abs(mx(v) - mx(0)), 0.5)} height={10} rx={2} className={cls} />
  );

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SH_BEATS[k].say}</span>}>
      <svg viewBox="0 0 220 74" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="দুইটা slot meter: alpha = −2 beta হলে slot 1 শূন্য, slot 2 ঠিক beta">
        <text x={130} y={11} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" className="fill-foreground">
          {k === 0 ? "α = ?, β = ?" : `α = ${sg(a)}, β = ${sg(b)}`}
        </text>
        {[
          ["slot 1", s1, 32],
          ["slot 2", s2, 54],
        ].map(([name, v, y]) => (
          <g key={name as string}>
            <rect x={mx(-3)} y={(y as number) - 7} width={168} height={14} rx={3} fill="white" stroke="#cbd5e1" />
            {[-2, -1, 1, 2].map((t) => (
              <path key={t} d={`M${mx(t)} ${(y as number) - 7}v14`} stroke="#e2e8f0" strokeWidth={0.8} />
            ))}
            {bar(v as number, y as number, Math.abs(v as number) < 0.05 ? "fill-cat-teal" : "fill-cat-coral/70")}
            <text x={mx(-3) - 3} y={(y as number) + 3} textAnchor="end" fontSize={8} fontWeight={700} fill="#5a6b7d">
              {name as string}
            </text>
          </g>
        ))}
        <path d={`M${mx(0)} 22V64`} strokeWidth={1.4} className="stroke-foreground" />
        <text x={mx(0)} y={72} textAnchor="middle" fontSize={7.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#5a6b7d">
          0
        </text>
        {k === 3 && <circle cx={mx(0)} cy={43} r={16} strokeWidth={1.6} className={`${POP} fill-none stroke-cat-teal`} />}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for the exercise's explanation, no task: (1, 3) and (2, 7).
//      Doubling u lands one slot short of v, and no other multiple does better.

const TA_F = makeFrame(-1, 3, -1, 8, 13, 12);
const TA_SAY = [
  "প্রশ্নের জোড়া: u = (1, 3).",
  "আর v = (2, 7). চোখে দেখে বোঝার উপায় ছিল না.",
  "2u পড়ে (2, 6)-এ, v থেকে এক ঘর নিচে.",
  "এখানে u টেনে v পাওয়া যায় না, v টেনেও u না.",
];

export function TwoArrowsTest() {
  const s = useScene(3, [700, 2000, 2200]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{TA_SAY[k]}</span>}>
      <div className="mx-auto w-[4.8rem]">
        <Plane f={TA_F} grid={1} axes={false} label="u-র কোনো গুণিতক v-তে পড়ে না" className="my-0! max-w-none">
          {k >= 2 && <Dot f={TA_F} at={[2, 6]} r={2.6} className="fill-cat-blue/60" />}
          <Arrow f={TA_F} from={O} to={[1, 3]} tone="blue" w={2.4} draw />
          {k >= 2 && <Arrow f={TA_F} from={[1, 3]} to={[2, 6]} tone="blue" w={2} dashed />}
          <Arrow f={TA_F} from={O} to={[2, 7]} tone="coral" w={2.4} draw={k >= 1} />
          <Label f={TA_F} at={[1, 3]} dx={-9} dy={0} size={9} className="fill-cat-blue font-mono">
            u
          </Label>
          <Label f={TA_F} at={[2, 7]} dx={9} dy={0} size={9} className="fill-cat-coral font-mono">
            v
          </Label>
          <DoorMark f={TA_F} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for the finale's setup, no task: at the same stall,
//      Nasib hands the three-button remote back, takes a two-button one,
//      and the shopkeeper counts out 50 taka.

export function NasibReturns({}: Story) {
  const s = useScene(4, [700, 1800, 2400, 2400, 1800]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="নাসিব তিন button-এর remote ফেরত দিলো, দুই button-এরটা নিলো, দোকানদার চাচা 50 টাকা ফেরত দিলেন">
        <CastPerson who="nana" x={96} y={GROUND - 8} facing={1} arm={k >= 3 ? "hold" : "down"} mood="plain" scale={0.9} />
        <Stall x={96} y={GROUND} sign="খেলনা" w={92} />
        <NameTag x={96} y={GROUND + 14} name="দোকানদার চাচা" />
        <CastPerson who="nasib" x={k >= 1 ? 172 : 250} y={GROUND} facing={-1} walking={k === 1} arm={k >= 1 && k < 4 ? "hold" : "down"} mood="plain" label />
        {k >= 1 && k < 3 && <RemoteProp x={156} y={GROUND - 46} n={3} />}
        {k >= 3 && <RemoteProp x={120} y={GROUND - 64} n={3} />}
        {k === 2 && <Bubble x={172} y={GROUND - 68} side="left" lines={["চাচা, তিন নম্বরটা", "লাগবে না."]} />}
        {k === 3 && <Bubble x={96} y={GROUND - 96} side="right" lines={["বাড়তি বাটন, বাড়তি দাম.", "লও, পঞ্চাশ টাকা."]} />}
        {k >= 4 && <PaperTag x={172} y={64} text="50 টাকা ফেরত" ink="#0f766e" />}
        {k >= 4 && <RemoteProp x={186} y={GROUND - 42} n={2} />}
        <CastPerson who="fahim" x={250} y={GROUND} facing={-1} mood="plain" label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · The finale. The sealed bet opens: three cards, each flipped by a tap,
//     each showing its verdict and why, with a tiny floor that acts it out.

const VERDICT: { ok: boolean; why: string; w: XY[] }[] = [
  { ok: false, why: "w = (2, 3) নতুন কোনো জায়গায় যায় না. e₁ 2 বার, e₂ 3 বার চাপলেই সেখানে.", w: [[2, 3]] },
  { ok: true, why: "যে button-ই দিন, (−x, −y, 1) চেপে দরজায় ফেরা যায়. তাই সবসময় বাড়তি.", w: [[2, 3], [-1, 2], [2, 1]] },
  { ok: false, why: "নিজে তিনবার চেষ্টা করেছেন. কোনো w-ই পার পায় নাই, (0, 0) তো আরোই না.", w: [[3, 1], [-2, 2]] },
];
const VD_F = makeFrame(-2, 3, -1, 3.5, 11, 5);

export function ThirdVerdict() {
  const pass = useGate();
  const [open, setOpen] = useSeed<number[]>("open", []);
  const done = open.length === VERDICT.length;

  const flip = (i: number) => {
    if (open.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === VERDICT.length) pass("Floor-এ তিন নম্বর button সবসময় বাড়তি.");
  };

  return (
    <>
      <div className="grid gap-1.5">
        {BET.map((b, i) => {
          const on = open.includes(i);
          const v = VERDICT[i];
          return (
            <button
              key={b}
              type="button"
              onClick={() => flip(i)}
              disabled={on}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-1.5 text-left transition-colors disabled:cursor-default ${
                on ? (v.ok ? "border-accent bg-accent/10" : "border-danger/40 bg-danger/5") : "border-dashed border-muted/50 hover:border-accent"
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-lg border text-sm font-semibold ${on ? (v.ok ? "border-accent text-accent-text" : "border-danger/60 text-danger") : "border-current/30"}`}
              >
                {on ? (v.ok ? "✓" : "✕") : String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.85rem] font-semibold leading-snug">{b}</span>
                {on ? <span className={`${FADE} block text-[0.75rem] leading-snug text-muted`}>{v.why}</span> : <span className="block text-[0.72rem] text-muted">tap করে খুলুন</span>}
              </span>
              {on ? (
                <span className={`${POP} w-[3.6rem] shrink-0`}>
                  <Plane f={VD_F} grid={1} axes={false} label="তিন নম্বর button দরজায় ফেরে" className="my-0! max-w-none">
                    {v.w.map((w, j) => (
                      <g key={j}>
                        <HomeTrail f={VD_F} w={w} keyed={`${i}-${j}`} />
                      </g>
                    ))}
                    <DoorMark f={VD_F} />
                  </Plane>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <Task done={done}>সিল করা বাজি খুলুন. তিনটা card-ই tap করে দেখুন কোনটা টিকলো.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for the finale's explanation, no task: the count. On a line
//      (one slot) a second button always walks home; on the floor (two slots)
//      a third one does. n slots, at most n needed buttons.

const FC_SAY = [
  "একটা line-এ slot একটাই. সেখানে দ্বিতীয় button সবসময় বাড়তি: 3 বার 2 সামনে, 2 বার 3 পিছনে, দরজা.",
  "Floor-এ slot দুইটা. সেখানে তৃতীয় button সবসময় বাড়তি.",
  "n টা slot, বড়জোর n টা দরকারি button. এর বেশি হলেই কেউ একজন বাড়তি.",
];

export function FloorCount() {
  const s = useScene(2, [700, 2400]);
  const k = s.k;
  const sx = (x: number) => 14 + x * 16;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{FC_SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[17rem] items-end justify-center gap-4">
        <div className={`text-center transition-opacity duration-300 motion-reduce:transition-none ${k >= 1 ? "opacity-50" : ""}`}>
          <svg viewBox="0 0 110 44" className="h-auto w-[6.5rem]" role="img" aria-label="line-এ দুইটা button, একটা বাড়তি">
            <path d={`M4 30H106`} strokeWidth={1} className="stroke-foreground/30" />
            {[0, 1, 2, 3, 4, 5, 6].map((x) => (
              <path key={x} d={`M${sx(x)} 27V33`} strokeWidth={1} className="stroke-foreground/30" />
            ))}
            <path d={`M${sx(0)} 22H${sx(2)}`} strokeWidth={2.4} strokeLinecap="round" className="stroke-cat-blue" />
            <path d={`M${sx(0)} 14H${sx(3)}`} strokeWidth={2.4} strokeLinecap="round" className="stroke-cat-coral" />
            <text x={sx(2) + 4} y={25} fontSize={8} fontWeight={700} fontFamily="ui-monospace, monospace" className="fill-cat-blue">
              2
            </text>
            <text x={sx(3) + 4} y={17} fontSize={8} fontWeight={700} fontFamily="ui-monospace, monospace" className="fill-cat-coral">
              3
            </text>
            <circle cx={sx(0)} cy={30} r={3} className="fill-[#0f1b2d]" />
          </svg>
          <div className="text-[0.7rem] font-semibold text-muted">1 slot · 2 button</div>
        </div>
        {k >= 1 ? (
          <div className={`${POP} w-[5.5rem] text-center`}>
            <Plane f={TH_F} grid={1} axes={false} label="floor-এ তিনটা button, একটা বাড়তি" className="my-0! max-w-none">
              <Arrow f={TH_F} from={O} to={[1, 0]} tone="blue" w={2.2} />
              <Arrow f={TH_F} from={O} to={[0, 1]} tone="coral" w={2.2} />
              <Arrow f={TH_F} from={O} to={[2, 3]} tone="teal" w={2.2} draw />
              <DoorMark f={TH_F} />
            </Plane>
            <div className="text-[0.7rem] font-semibold text-muted">2 slot · 3 button</div>
          </div>
        ) : null}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A second figure for the finale's explanation, no task: the bridge.
//      Moving day: the truck pulls up at the gate, the robotics club's drone
//      is there for the fan's dust, 50 taka a button still, and the question
//      turned round: the fewest buttons that do the job. Stops at "?".

/** A small delivery truck, rear at x, wheels on y. */
function MD_Truck({ x, y }: { x: number; y: number }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)` }} className="transition-transform duration-[1400ms] ease-out motion-reduce:transition-none">
      <rect x={0} y={-44} width={62} height={36} rx={2} fill="#f59e0b" stroke="#b45309" strokeWidth={1} />
      <path d="M62 -32H80L88 -20V-8H62Z" fill="#0ea5e9" stroke="#0369a1" strokeWidth={1} />
      <rect x={66} y={-29} width={11} height={9} rx={1} fill="#e0f2fe" />
      <rect x={0} y={-10} width={88} height={4} fill="#334155" />
      <circle cx={16} cy={-4} r={6} fill="#1f2937" />
      <circle cx={16} cy={-4} r={2.2} fill="#cbd5e1" />
      <circle cx={72} cy={-4} r={6} fill="#1f2937" />
      <circle cx={72} cy={-4} r={2.2} fill="#cbd5e1" />
      <text x={31} y={-22} textAnchor="middle" fontSize={8} fontWeight={700} fill="#78350f">
        ট্রাক
      </text>
    </g>
  );
}

/** A small quadcopter, centre at (x, y). */
function MD_Drone({ x, y }: { x: number; y: number }) {
  return (
    <g className={POP}>
      <path d={`M${x - 16} ${y}H${x + 16}`} stroke="#334155" strokeWidth={2} />
      <rect x={x - 7} y={y - 4} width={14} height={8} rx={3} fill="#475569" />
      <circle cx={x} cy={y} r={1.6} fill="#22d3ee" />
      {[-16, 16].map((d) => (
        <ellipse key={d} cx={x + d} cy={y - 3} rx={9} ry={1.8} fill="#94a3b8" opacity={0.8} />
      ))}
      <text x={x} y={y + 16} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#1f2937">
        drone
      </text>
    </g>
  );
}

export function MovingDay() {
  const s = useScene(3, [700, 1800, 2000, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" label="বাসা বদলের দিন: গেটে ট্রাক, robotics club-এর drone, প্রতি button 50 টাকা, সবচেয়ে কম কয়টা button?">
        <Gate x={44} y={GROUND} text="গেট" />
        <MD_Truck x={k >= 1 ? 70 : 330} y={GROUND} />
        {k >= 2 && <MD_Drone x={240} y={96} />}
        {k >= 3 && <PaperTag x={240} y={40} text="প্রতি button 50 টাকা" />}
        {k >= 3 && (
          <text x={240} y={68} textAnchor="middle" fontSize={10} fontWeight={800} fill="#7c3aed" className={FADE} style={{ transitionDelay: "900ms" }}>
            সবচেয়ে কম কয়টা button?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  NasibRemote: { start: { k: 0 }, arrive: { k: 1 }, price: { k: 2 }, claim: { k: 3 }, end: {} },
  ThirdBet: { start: {}, newSpot: { bet: 0 }, extra: { bet: 1 }, sealed: { bet: 2, sealed: true } },
  NoLineHere: { twin: { k: 0 }, three: { k: 1 }, lines: { k: 2 }, end: {} },
  ZeroWalk: {
    start: {},
    twin: { rm: 0, amt: [[2, -1], [0, 0]], dots: [["1,1", "0,0", "2,2"], []], tick: [true, false] },
    done: { rm: 1, amt: [[2, -1], [1, 0]], dots: [["1,1", "0,0"], ["1,0", "0,1", "1,1"]], tick: [true, true] },
  },
  WalkHome: { alone: { k: 0 }, vArrives: { k: 1 }, mid: { k: 2 }, end: {} },
  NoVisibleCopy: { hunt: { tries: ["1,2", "2,4", "-1,-2"] }, sum: { phase: "sum", k: 0 }, mid: { phase: "sum", k: 2 }, end: { phase: "sum", k: 4 } },
  SlotKill: { start: { k: 0 }, walk: { k: 1 }, many: { k: 2 }, end: {} },
  NasibWalk: { start: {}, mid: { amt: [0, 0, 1] }, found: { amt: [-2, -3, 1], found: true } },
  ThirdHome: { start: { k: 0 }, w: { k: 1 }, back: { k: 2 }, end: {} },
  AnyThird: { start: {}, dragging: { wAt: [-1, 3] }, own: { wAt: [3, 1], placed: ["3,1"] }, done: { wAt: [0, 0], placed: ["3,1", "-2,2", "0,0"] } },
  EveryThird: { start: { k: 0 }, one: { k: 1 }, two: { k: 2 }, end: {} },
  CheapRemote: { start: { k: 0 }, show: { k: 1 }, claim: { k: 2 }, end: {} },
  StretchReach: { start: {}, twice: { pick: 0 }, third: { pick: 1 }, right: { pick: 2 } },
  TwoArrowsTest: { start: { k: 0 }, mid: { k: 2 }, end: {} },
  NasibReturns: { start: { k: 0 }, back: { k: 2 }, chacha: { k: 3 }, end: {} },
  ThirdVerdict: { start: {}, one: { open: [0] }, done: { open: [0, 2, 1] } },
  FloorCount: { start: { k: 0 }, end: {} },
  RemoteCStare: { start: { k: 0 }, sheet: { k: 1 }, lines: { k: 2 }, end: {} },
  BigTable: { start: { k: 0 }, table: { k: 1 }, end: {} },
  OneNumber: { start: { k: 0 }, end: {} },
  SameSpot: { start: { k: 0 }, e1: { k: 1 }, end: {} },
  NasibObjects: { start: { k: 0 }, bad: { k: 1 }, end: {} },
  FloorFull: { start: { k: 0 }, all: { k: 1 }, end: {} },
  ShopSlots: { start: { k: 0 }, one: { k: 1 }, two: { k: 2 }, end: {} },
  MovingDay: { start: { k: 0 }, truck: { k: 1 }, end: {} },
};
