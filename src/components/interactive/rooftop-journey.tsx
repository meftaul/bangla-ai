"use client";

import { useState } from "react";

import {
  Choice,
  Draw,
  FADE,
  Nope,
  POP,
  Scene,
  Stepper,
  Ticks,
  pill,
  primaryBtn,
  quietBtn,
  usePlay,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
} from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person as CastPerson, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Dot, Plane, Star, makeFrame, same, snap, tup, type Frame, type XY } from "@/components/journey/plane";
import { Task, useGate } from "@/components/journey/journey";
import {
  AxisName,
  BedBath,
  Chacha,
  Clipped,
  FLATS,
  FlatDot,
  GROUND,
  Jilapi,
  KF,
  NameTag,
  O,
  R2,
  ROOF,
  RoofSet,
  RightMark,
  TiltGrid,
  fits,
  heat,
  heatInk,
  imbOf,
  say,
  sizeOf,
  type Flat,
  type Story,
} from "./rooftop-parts";

// Screens for "Math for AI 5.6 — The rooftop flat's rent, a new basis", told
// as a Journey in the author's Bangla-English, 9 steps (the pathshala-journey
// skill). The shared khata, Chacha and the jilapi live in rooftop-parts.tsx.
//
// Last day of moving week. Chacha, the landlord, has a new rooftop flat,
// (4 bed, 2 bath), and the tenant comes tonight. His khata has 8 flats as
// (bed, bath) with their rents. Fahim claims he can rewrite the same two
// columns so the rent needs just one number; Nasib says no new information
// goes in, so nothing new comes out. A jilapi rides on it (JilapiBet, sealed).
// One-column rules fail (RentGrid); Fahim's two buttons, size (1, 1) and
// imbalance (1, −1), are pressed on a flat's rooms and meet at a right angle
// (PressButtons); flat (3, 2) is reached by walking the buttons, half steps
// and all (FindCard), and the card (2.5, 0.5) gets read out (ReadTheNumbers);
// on the turned grid, one knob prices all 8 flats (OneNumberRent); the
// rooftop flat is (3, 1), 24000 taka (YourHouse); a card converts back
// (TryConvertBack); and the bet splits the jilapi (BetSettled). Nasib's next
// objection ("any grid, any numbers") is the bridge to 5.6b, fairgrid-journey.
//
// Story scenes: RooftopBet, ChachaTries, FahimDraws, TenantStairs, NasibCard,
// FirstNight. Watch-only figures, one or two in every <Then>: EightFlats,
// SlantClimb, SquareTurned, TwoCards, RoomsToCard, AddLines, DotsSlide
// (OtherBases in its side quest), SameSizeRow, ChachaWrites, BackAndForth,
// SchoolSlip, KhataTwice, NasibNotDone.
//
// Tailwind only; the sheets are journey/plane. Ink on white sheets is fixed.

/** a green tick, drawn (the ✓ glyph turns into an emoji on Linux) */
function Tick() {
  return (
    <svg viewBox="0 0 12 12" className="inline-block size-3 align-[-1px]" aria-hidden="true">
      <path d="M2 6.5l2.6 2.6L10 3" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="stroke-accent-text" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the rooftop at dusk.
//      Chacha with his khata and no rent for the new flat; Fahim's claim,
//      Nasib's answer, and a cone of jilapi on the line.

export function RooftopBet({}: Story) {
  const s = useScene(4, [700, 2400, 2600, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="on the rooftop, Chacha has no rent for the new flat; Fahim and Nasib bet a cone of jilapi on Fahim's claim">
        <RoofSet />
        <Chacha x={98} y={GROUND} arm="hold" />
        <NameTag x={98} y={GROUND + 13} name="চাচা" />
        {k === 1 && <Bubble x={98} y={GROUND - 68} side="mid" lines={["রাইতেই ভাড়াটিয়া আইবো।", "ভাড়া কত চামু?"]} />}
        <CastPerson who="fahim" x={186} y={GROUND} facing={-1} arm={k === 2 ? "point" : "down"} mood={k >= 2 ? "smug" : "plain"} label />
        {k === 2 && <Bubble x={186} y={GROUND - 68} side="mid" lines={["দুইটা column নতুন করে", "লিখলে, ভাড়া এক সংখ্যায়।"]} />}
        <CastPerson who="nasib" x={250} y={GROUND} facing={-1} arm={k >= 4 ? "hold" : "down"} mood={k === 3 ? "shout" : k >= 4 ? "smug" : "plain"} label />
        {k === 3 && <Bubble x={250} y={GROUND - 68} side="left" lines={["নতুন তথ্য নাই,", "নতুন কিছু বের হবে না।"]} />}
        {k >= 4 && (
          <g className={POP}>
            <Jilapi x={262} y={GROUND - 34} s={0.9} />
          </g>
        )}
        {k >= 4 && <Bubble x={250} y={GROUND - 68} side="left" lines={["বাজি। এক ঠোঙা জিলাপি।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Fahim, Nasib, or both. The jilapi slides to whoever
//     the reader backs, and nothing is marked: the finale settles it.

const BET = ["ফাহিম ঠিক", "নাসিব ঠিক", "দুইজনই ঠিক"];
const BET_X = [44, 196, 120];

export function JilapiBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const [jx] = useTween([bet === null ? 120 : BET_X[bet]], 900);

  const seal = () => {
    setSealed(true);
    pass("বাজি সিল হলো। জিলাপি এখন দানে।");
  };

  return (
    <>
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
        <div className="rounded-xl border-2 border-cat-blue/30 bg-cat-blue/5 px-2.5 py-1.5">
          <div className="text-xs font-semibold text-cat-blue">ফাহিম</div>
          <div className="text-[0.8rem] leading-snug">খাতার দুইটা column ই নতুন করে লিখবো। তখন ভাড়া বলতে একটা সংখ্যাই লাগবে।</div>
        </div>
        <div className="rounded-xl border-2 border-cat-coral/30 bg-cat-coral/5 px-2.5 py-1.5">
          <div className="text-xs font-semibold text-cat-coral">নাসিব</div>
          <div className="text-[0.8rem] leading-snug">নতুন কোনো তথ্য তো ঢুকছে না। তাই নতুন কিছু বেরও হবে না।</div>
        </div>
      </div>
      <svg viewBox="0 0 240 52" className="mx-auto mt-1 block h-auto w-full max-w-[15rem]" aria-label="the cone of jilapi, sliding to whoever you back">
        <path d="M20 38H220" stroke="#a8a29e" strokeWidth={1.5} />
        <text x={44} y={50} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-cat-blue">
          ফাহিম
        </text>
        <text x={196} y={50} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-cat-coral">
          নাসিব
        </text>
        <text x={120} y={50} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-[#5a6b7d]">
          দুইজনই
        </text>
        <Jilapi x={jx} y={36} s={1.05} />
      </svg>
      <div className="mt-1 text-sm font-medium text-muted">কে ঠিক?</div>
      <div className="mt-1.5 grid gap-1.5">
        {BET.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : bet !== null ? "dim" : "idle"} disabled={bet !== null} onClick={() => setBet(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {bet !== null && !sealed ? (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={seal} className={`${primaryBtn} ${FADE}`}>
            বাজি সিল করুন
          </button>
        </div>
      ) : null}
      {sealed ? (
        <div className={`${FADE} mt-2 text-center text-[0.9rem] leading-snug text-muted`}>
          সিল করা থাকলো। চাচা ভাড়া পেয়ে গেলে শেষ screen এ খুলবো।
        </div>
      ) : null}
      <Task done={sealed}>ফাহিম, নাসিব, নাকি দুইজনই? একটা বেছে নিয়ে বাজি সিল করুন। কে জিতলো, শেষের আগে কেউ বলবে না।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the khata's 8 flats land
//      on the (bed, bath) sheet, then the rooftop flat, with a "?" for a rent.

export function EightFlats() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const SAY = [
    "চাচার খাতা, ছবি করে: bed ডানে, bath উপরে।",
    "ওনার 8 টা flat, প্রতিটা নিজের (bed, bath) এ। গায়ে লেখা সংখ্যাটা ভাড়া, হাজার টাকায়।",
    "আর ছাদের flat, (4, 2)। ওর ভাড়ার জায়গায় এখনো একটা প্রশ্ন।",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <Plane f={KF} ticks={1} label="Chacha's 8 flats on the bed and bath sheet, and the rooftop flat at (4, 2)" className="my-0! max-w-[13rem]">
        <BedBath f={KF} />
        {k >= 1 &&
          FLATS.map((fl, i) => (
            <g key={i} className={POP} style={{ transitionDelay: `${i * 90}ms` }}>
              <FlatDot f={KF} at={[fl.bed, fl.bath]} rent={fl.rent} />
            </g>
          ))}
        {k >= 2 && (
          <g className={POP}>
            <circle cx={KF.sx(ROOF[0])} cy={KF.sy(ROOF[1])} r={10} fill="white" stroke="#b45309" strokeWidth={1.6} strokeDasharray="3 2" />
            <text x={KF.sx(ROOF[0])} y={KF.sy(ROOF[1]) + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#b45309">
              ?
            </text>
          </g>
        )}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: Chacha's own way. He
//      licks his pencil and prices by beds; Fahim looks at the khata.

export function ChachaTries({}: Story) {
  const s = useScene(3, [700, 2400, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="Chacha wants to price every flat by its beds alone; Fahim looks at the khata">
        <RoofSet />
        <Chacha x={128} y={GROUND} arm={k >= 1 ? "point" : "hold"} />
        <NameTag x={128} y={GROUND + 13} name="চাচা" />
        {k >= 1 && (
          <g className={POP}>
            <rect x={146} y={GROUND - 58} width={30} height={20} rx={2} fill="white" stroke="#b91c1c" strokeWidth={1.2} />
            <text x={161} y={GROUND - 45} textAnchor="middle" fontSize={7} fontWeight={700} fill="#0f1b2d">
              bed × ?
            </text>
          </g>
        )}
        {k === 1 && <Bubble x={128} y={GROUND - 70} side="mid" lines={["bed প্রতি ছয় হাজার", "ধরলেই তো হইলো।"]} />}
        <CastPerson who="fahim" x={214} y={GROUND} facing={-1} mood={k >= 2 ? "puzzled" : "plain"} label />
        {k >= 2 && <Bubble x={214} y={GROUND - 68} side="mid" tone="think" lines={["সবগুলা মিলবে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · The old way: a rule on one column. "So much per bed" paints the sheet
//     in upright stripes, "so much per bath" in flat ones; a flat fits when
//     its stripe's price is within 1000 of its rent. Neither ever fits more
//     than 3 of 8 — the three 3-bed flats alone have three different rents.

type Axis = "bed" | "bath";

export function RentGrid() {
  const pass = useGate();
  const [mode, setMode] = useSeed<Axis | null>("mode", null);
  const [knob, setKnob] = useSeed("knob", 6);
  const [seen, setSeen] = useSeed<string[]>("seen", []);
  const tried = (a: Axis) => seen.filter((x) => x.startsWith(a)).length >= 3;
  const both = tried("bed") && tried("bath");

  const note = (a: Axis, v: number) => {
    const key = `${a}:${v}`;
    if (seen.includes(key)) return;
    const next = [...seen, key];
    setSeen(next);
    const t = (b: Axis) => next.filter((x) => x.startsWith(b)).length >= 3;
    if (!both && t("bed") && t("bath")) pass("ভাড়া বাড়ে কোনাকুনি, এক axis বরাবর না।");
  };
  const pick = (a: Axis) => {
    setMode(a);
    note(a, knob);
  };
  const turn = (v: number) => {
    setKnob(v);
    if (mode) note(mode, v);
  };

  const guess = (fl: Flat) => knob * (mode === "bath" ? fl.bath : fl.bed);
  const fit = mode ? FLATS.filter((fl) => fits(guess(fl), fl.rent)).length : 0;

  return (
    <>
      <Plane f={KF} ticks={1} label="the 8 flats; a one-column rule paints stripes of price over them" className="my-0! max-w-[17rem]">
        {mode &&
          [1, 2, 3, 4, 5]
            .filter((c) => mode === "bed" || c <= 3)
            .map((c) =>
              mode === "bed" ? (
                <rect
                  key={`b${c}`}
                  x={KF.sx(c - 0.5)}
                  y={KF.sy(KF.y1)}
                  width={KF.u}
                  height={(KF.y1 - KF.y0) * KF.u}
                  opacity={0.4}
                  style={{ fill: heat(knob * c) }}
                  className="pointer-events-none transition-[fill] duration-500 motion-reduce:transition-none"
                />
              ) : (
                <rect
                  key={`h${c}`}
                  x={KF.sx(KF.x0)}
                  y={KF.sy(c + 0.5)}
                  width={(KF.x1 - KF.x0) * KF.u}
                  height={KF.u}
                  opacity={0.4}
                  style={{ fill: heat(knob * c) }}
                  className="pointer-events-none transition-[fill] duration-500 motion-reduce:transition-none"
                />
              ),
            )}
        <BedBath f={KF} />
        {FLATS.map((fl, i) => (
          <FlatDot key={i} f={KF} at={[fl.bed, fl.bath]} rent={fl.rent} ring={mode ? (fits(guess(fl), fl.rent) ? "fit" : "miss") : null} />
        ))}
      </Plane>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button type="button" onClick={() => pick("bed")} className={`${pill(mode === "bed")} font-sans`}>
          শুধু bed দিয়ে
        </button>
        <button type="button" onClick={() => pick("bath")} className={`${pill(mode === "bath")} font-sans`}>
          শুধু bath দিয়ে
        </button>
      </div>
      {mode ? (
        <div className="mt-2 flex items-center justify-center gap-2">
          <Stepper value={knob} onChange={turn} min={3} max={12} label={`প্রতি ${mode} এ হাজার টাকা`} />
          <span className="text-sm text-muted">হাজার টাকা, প্রতি {mode}</span>
        </div>
      ) : null}
      <div className="mt-1.5 min-h-6 text-center text-[0.9rem]">
        {mode ? (
          <span key={`${mode}${knob}`} className={FADE}>
            8 টার মধ্যে <b className={`font-mono ${fit >= 8 ? "text-accent-text" : "text-danger"}`}>{fit}</b> টা flat মিললো, 1000 টাকার ভিতরে।
          </span>
        ) : (
          <span className="text-muted">কোন column দিয়ে দাম ধরবেন, বেছে নিন।</span>
        )}
      </div>
      <Ticks
        items={[
          ["শুধু bed", tried("bed")],
          ["শুধু bath", tried("bath")],
        ]}
      />
      <Task done={both}>আগে শুধু bed দিয়ে, তারপর শুধু bath দিয়ে দাম ধরুন। প্রতিটায় knob টা তিনটা দামে ঘুরিয়ে সবুজ ring গুনুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the three 3-bed flats,
//      one column and three rents; then the lines of equal price, all on a
//      slant; then the way the rent climbs.

export function SlantClimb() {
  const s = useScene(3, [700, 2200, 2200]);
  const k = s.k;
  const SAY = [
    "আবার সেই 8 টা flat, ভাড়ার রঙে।",
    "3 bed এর তিনটা flat: 17, 20 আর 25। একই column, তিন রকম ভাড়া।",
    "একই কোনাকুনি line এর flat গুলার ভাড়া প্রায় সমান।",
    "তাই ভাড়া বাড়ে এই দিকে: bed আর bath যখন একসাথে বাড়ে।",
  ];
  const diag = (c: number) => {
    const xa = Math.max(KF.x0, c - KF.y1);
    const xb = Math.min(KF.x1, c - KF.y0);
    return `M${KF.sx(xa)} ${KF.sy(c - xa)}L${KF.sx(xb)} ${KF.sy(c - xb)}`;
  };

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <Plane f={KF} ticks={1} label="rent is equal along slanted lines and climbs where beds and baths grow together" className="my-0! max-w-[13rem]">
        {k === 1 && <rect x={KF.sx(2.55)} y={KF.sy(3.5)} width={KF.u * 0.9} height={KF.u * 3.1} rx={6} fill="none" stroke="#b45309" strokeWidth={1.6} strokeDasharray="4 3" className={FADE} />}
        {k >= 2 && [2, 3, 4, 5, 6, 7, 8].map((c, i) => <Draw key={c} d={diag(c)} delay={i * 120} strokeWidth={1.2} className="stroke-[#b45309]/60" />)}
        {k >= 3 && <Arrow f={KF} from={[0.3, 0.3]} to={[3.3, 3.3]} tone="violet" w={3} draw />}
        {FLATS.map((fl, i) => (
          <FlatDot key={i} f={KF} at={[fl.bed, fl.bath]} rent={fl.rent} />
        ))}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: Fahim draws two arrows on
//      a clean page of the khata; Chacha leans in.

export function FahimDraws({}: Story) {
  const s = useScene(4, [700, 1600, 1600, 2400, 2400]);
  const k = s.k;
  const px = (x: number) => 156 + x * 17;
  const py = (y: number) => 32 - y * 17;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="Fahim draws two new buttons on a page of the khata: size along the slant, imbalance across it; Chacha asks what they are">
        <RoofSet />
        <g className={k >= 1 ? POP : "opacity-0"}>
          <rect x={112} y={4} width={96} height={56} rx={3} fill="white" stroke="#b91c1c" strokeWidth={1.2} />
          <path d={`M${px(-1.6)} ${py(0)}H${px(1.7)}M${px(0)} ${py(-1.5)}V${py(1.5)}`} stroke="#94a3b8" strokeWidth={0.8} />
        </g>
        {k >= 1 && <Draw d={`M${px(0)} ${py(0)}L${px(1.2)} ${py(1.2)}`} strokeWidth={2.6} className="stroke-cat-blue" />}
        {k >= 1 && (
          <text x={px(1.4)} y={py(1.1)} textAnchor="start" fontSize={8} fontWeight={700} className={`${FADE} fill-cat-blue`}>
            size
          </text>
        )}
        {k >= 2 && <Draw d={`M${px(0)} ${py(0)}L${px(1.2)} ${py(-1.2)}`} strokeWidth={2.6} className="stroke-cat-coral" />}
        {k >= 2 && (
          <text x={px(1.4)} y={py(-1.1) + 3} textAnchor="start" fontSize={8} fontWeight={700} className={`${FADE} fill-cat-coral`}>
            imbalance
          </text>
        )}
        <CastPerson who="fahim" x={222} y={GROUND} facing={-1} arm={k >= 1 && k < 3 ? "point" : "down"} mood={k >= 4 ? "happy" : "plain"} label />
        <Chacha x={k >= 3 ? 100 : 70} y={GROUND} arm="hold" />
        <NameTag x={k >= 3 ? 100 : 70} y={GROUND + 13} name="চাচা" />
        {k === 3 && <Bubble x={100} y={GROUND - 68} side="mid" lines={["এইগুলা আবার", "কী জিনিস?"]} />}
        {k >= 4 && <Bubble x={222} y={GROUND - 68} side="left" lines={["দুইটা নতুন button,", "চাচা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · Fahim's two buttons, pressed on a real flat. The flat (2, 2) sits on a
//     small sheet with its rooms beside it. "+ size" adds a bed and a bath
//     (the dot hops along the slant, two squares pop in); "+ imbalance" turns
//     a bath into a bed (the dot hops across, a bath square leaves and a bed
//     square comes). Once both are pressed, the two go into 4.2's box:
//     1·1 + 1·(−1) = 0, and the right-angle mark lands on the sheet.

const PB_F = makeFrame(-0.3, 5.4, -0.3, 4.4, 26, 10);
const PB_START: XY = [2, 2];
const PB_BOX = [
  ["bed slot", "1 × 1 = 1"],
  ["bath slot", "1 × (−1) = −1"],
  ["dot product", "1 + (−1) = 0"],
];

/** a right-angle mark at `at`, for arrows along (1, 1) and (1, −1) from there */
function CornerMark({ f, at, s = 0.28 }: { f: Frame; at: XY; s?: number }) {
  const p = (x: number, y: number) => `${f.sx(at[0] + x)} ${f.sy(at[1] + y)}`;
  return <path d={`M${p(s, s)}L${p(2 * s, 0)}L${p(s, -s)}`} fill="none" strokeWidth={1.6} className={`${POP} stroke-[#0f1b2d]`} />;
}

export function PressButtons() {
  const pass = useGate();
  const [moves, setMoves] = useSeed<("s" | "m")[]>("moves", []);
  const [boxed, setBoxed] = useSeed("boxed", false);
  const p = usePlay(900);
  const at = moves.reduce<XY>((q, mv) => (mv === "s" ? [q[0] + 1, q[1] + 1] : [q[0] + 1, q[1] - 1]), PB_START);
  const [tx, ty] = useTween([at[0], at[1]], 700);
  const last = moves[moves.length - 1];
  const pressedBoth = moves.includes("s") && moves.includes("m");
  const rows = boxed ? 3 : p.k;
  const canS = at[0] + 1 <= 5 && at[1] + 1 <= 4;
  const canM = at[0] + 1 <= 5 && at[1] - 1 >= 1;

  const press = (mv: "s" | "m") => setMoves([...moves, mv]);
  const box = () => {
    if (p.running) return;
    p.play(3, () => {
      setBoxed(true);
      pass("Size আর imbalance, right angle এ।");
    });
  };
  const SAY: Record<string, string> = {
    none: "Flat (2, 2): 2 bed, 2 bath. একটা button চাপুন।",
    s: "Size: এক bed আর এক bath একসাথে বাড়লো। Flat টা শুধু বড় হলো।",
    m: "Imbalance: এক bath গেলো, এক bed আসলো। মোট room একই, ভাগটা বদলালো।",
  };

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[9.5rem] shrink-0">
          <Plane f={PB_F} ticks={1} label="a flat on the bed and bath sheet, moved by Fahim's two buttons" className="my-0! max-w-none">
            <BedBath f={PB_F} x={5.3} y={4.25} />
            {moves.map((mv, i) => {
              const from = moves.slice(0, i).reduce<XY>((q, v) => (v === "s" ? [q[0] + 1, q[1] + 1] : [q[0] + 1, q[1] - 1]), PB_START);
              const to: XY = mv === "s" ? [from[0] + 1, from[1] + 1] : [from[0] + 1, from[1] - 1];
              return <Arrow key={i} f={PB_F} from={from} to={to} tone={mv === "s" ? "blue" : "coral"} w={2.2} draw={i === moves.length - 1} />;
            })}
            {boxed && pressedBoth && (
              <g className={FADE}>
                <Arrow f={PB_F} from={at} to={[at[0] + 0.9, at[1] + 0.9]} tone="blue" w={1.6} dashed />
                <Arrow f={PB_F} from={at} to={[at[0] + 0.9, at[1] - 0.9]} tone="coral" w={1.6} dashed />
                <CornerMark f={PB_F} at={at} />
              </g>
            )}
            <circle cx={PB_F.sx(tx)} cy={PB_F.sy(ty)} r={6} className="pointer-events-none fill-[#b45309]" />
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          {[
            { n: at[0], name: "bed", tone: "bg-cat-blue/80" },
            { n: at[1], name: "bath", tone: "bg-cat-teal/80" },
          ].map((r) => (
            <div key={r.name} className="mb-1.5 flex flex-wrap items-center gap-1">
              <span className="w-8 text-xs font-semibold text-muted">{r.name}</span>
              {Array.from({ length: r.n }, (_, i) => (
                <span key={`${r.name}${i}`} className={`${POP} size-4 rounded-sm ${r.tone}`} />
              ))}
            </div>
          ))}
          <div className="font-mono text-sm font-bold text-[#b45309]">{tup(at)}</div>
        </div>
      </div>
      {!boxed ? (
        <div className="mt-2 flex items-center justify-center gap-2">
          <button type="button" onClick={() => press("s")} disabled={!canS || p.running} className={`${pill(false)} font-sans text-cat-blue! disabled:opacity-40`}>
            + size
          </button>
          <button type="button" onClick={() => press("m")} disabled={!canM || p.running} className={`${pill(false)} font-sans text-cat-coral! disabled:opacity-40`}>
            + imbalance
          </button>
          {moves.length > 0 ? (
            <button type="button" onClick={() => setMoves([])} disabled={p.running} className={quietBtn}>
              আবার
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="mx-auto mt-1.5 min-h-10 max-w-sm text-center text-[0.85rem] leading-snug">
        <span key={boxed ? "box" : moves.length} className={FADE}>
          {boxed ? "বড় হওয়া আর ভাগ বদলানো। কেউ কারো কাজে নাক গলায় না। এটাই right angle." : SAY[last ?? "none"]}
        </span>
      </div>
      {pressedBoth && rows > 0 ? (
        <div className="mx-auto mt-1 grid max-w-[16rem] grid-cols-[5rem_1fr] gap-x-2 gap-y-0.5 text-[0.85rem]">
          {PB_BOX.slice(0, rows).map(([a, b], i) => (
            <div key={a} className={`${FADE} contents`}>
              <span className="text-muted">{a}</span>
              <span className={`font-mono ${i === 2 ? "font-bold text-accent-text" : ""}`}>{b}</span>
            </div>
          ))}
        </div>
      ) : null}
      {pressedBoth && !boxed && !p.running ? (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={box} className={`${primaryBtn} ${FADE}`}>
            4.2 এর মতো দুইটা button এর dot product নিন
          </button>
        </div>
      ) : null}
      <Ticks
        items={[
          ["size চাপা", moves.includes("s")],
          ["imbalance চাপা", moves.includes("m")],
          ["dot product", boxed],
        ]}
      />
      <Task done={boxed}>দুইটা button ই চেপে দেখুন flat এর কী বদলায়। তারপর 4.2 এর মতো দুইটার dot product নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the two buttons on the
//      bed and bath sheet; their lines drawn every step make Fahim's grid, all
//      small squares; then the whole sheet turns 45° and it is a plain square
//      grid, only turned.

const ST_F = makeFrame(-2.2, 2.2, -2.2, 2.2, 26, 8);

export function SquareTurned() {
  const s = useScene(2, [700, 2000]);
  const k = s.k;
  const SAY = [
    "ফাহিমের দুইটা button, bed আর bath এর sheet এ।",
    "প্রতিটা button বরাবর ধাপে ধাপে line টানলে ফাহিমের grid। ঘর গুলা সব square।",
    "Sheet টা একটু ঘুরিয়ে দিলেই চেনা square grid। শুধু ঘুরানো।",
  ];
  const turn = {
    style: { transform: `rotate(${k >= 2 ? 45 : 0}deg)`, transformOrigin: `${ST_F.sx(0)}px ${ST_F.sy(0)}px` },
    className: "transition-transform duration-1000 ease-in-out motion-reduce:transition-none",
  };

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto w-full max-w-[10rem]">
        <Plane f={ST_F} grid={k >= 2 ? 0 : 1} axes={k < 2} label="Fahim's two buttons and their grid; the sheet turns and it is a square grid" className="my-0! max-w-none">
          {k >= 1 && (
            <g className={FADE}>
              <Clipped f={ST_F} name="st">
                <g {...turn}>
                  <TiltGrid f={ST_F} step={1} className="stroke-cat-violet/50" />
                </g>
              </Clipped>
            </g>
          )}
          <g {...turn}>
            <Arrow f={ST_F} from={O} to={[1, 1]} tone="blue" w={2.6} />
            <Arrow f={ST_F} from={O} to={[1, -1]} tone="coral" w={2.6} />
            <RightMark f={ST_F} />
          </g>
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · Flat (3, 2), found by walking. Two half-step dials, size and imbalance;
//     "walk" draws the size steps along the slant, then the imbalance steps
//     across. A wrong card lands where it really lands, in red. The right
//     one needs half steps: 2.5 and 0.5.

const FC_F = makeFrame(-0.4, 4.4, -0.6, 3.6, 34, 10);
const FC_AT: XY = [3, 2];

/** a stepper that counts in halves: `value` is in halves, shown as value / 2 */
function HalfStepper({ value, onChange, min, max, label }: { value: number; onChange: (v: number) => void; min: number; max: number; label: string }) {
  const btn =
    "grid size-8 cursor-pointer place-items-center rounded-full text-lg font-bold text-muted transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent motion-reduce:transition-none";
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-surface p-0.5 font-mono">
      <button type="button" aria-label={`${label} আধা কম`} className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-10 text-center text-lg font-semibold tabular-nums">{say(value / 2)}</span>
      <button type="button" aria-label={`${label} আধা বেশি`} className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </span>
  );
}

export function FindCard() {
  const pass = useGate();
  const [hs, setHs] = useSeed("hs", 2);
  const [hm, setHm] = useSeed("hm", 0);
  const [walked, setWalked] = useSeed<XY | null>("walked", null);
  const [walks, setWalks] = useState(0);
  const s = hs / 2;
  const m = hm / 2;
  const land = (c: XY): XY => [c[0] + c[1], c[0] - c[1]];
  const end = walked ? land(walked) : null;
  const right = end !== null && same(end, FC_AT);

  const walk = () => {
    const c: XY = [s, m];
    setWalked(c);
    setWalks((w) => w + 1);
    if (same(land(c), FC_AT)) pass("একই flat, নতুন card: (2.5, 0.5).");
  };

  return (
    <>
      <div className="text-center text-[0.85rem] leading-snug text-muted">
        Flat <b className="font-mono text-[#b45309]">(3, 2)</b>: 3 bed, 2 bath, ভাড়া 20000.
      </div>
      <Plane f={FC_F} ticks={1} label="flat (3, 2), and where the card you dial walks on Fahim's grid" className="my-1! max-w-[13rem]">
        <Clipped f={FC_F} name="fc">
          <TiltGrid f={FC_F} className="stroke-cat-violet/25" />
        </Clipped>
        <BedBath f={FC_F} x={4.3} y={3.45} />
        <Star f={FC_F} at={FC_AT} done={right} />
        {walked && walked[0] !== 0 && <Arrow key={`s${walks}`} f={FC_F} from={O} to={[walked[0], walked[0]]} tone="blue" w={2.4} draw />}
        {walked && walked[1] !== 0 && <Arrow key={`m${walks}`} f={FC_F} from={[walked[0], walked[0]]} to={land(walked)} tone="coral" w={2.4} draw delay={walked[0] !== 0 ? 700 : 0} />}
        {end && !right && <Dot key={`e${walks}`} f={FC_F} at={end} r={4} className={`fill-danger ${POP}`} />}
      </Plane>
      {!right ? (
        <>
          <div className="flex items-center justify-center gap-3 text-xs font-semibold text-muted">
            <span className="grid justify-items-center gap-0.5">
              <HalfStepper value={hs} onChange={setHs} min={0} max={8} label="size" />
              <span className="text-cat-blue">size এর ধাপ</span>
            </span>
            <span className="grid justify-items-center gap-0.5">
              <HalfStepper value={hm} onChange={setHm} min={-4} max={4} label="imbalance" />
              <span className="text-cat-coral">imbalance এর ধাপ</span>
            </span>
          </div>
          <div className="mt-2 flex justify-center">
            <button type="button" onClick={walk} className={primaryBtn}>
              Card টা হাঁটান
            </button>
          </div>
          {walked && end ? (
            <Nope key={walks}>
              Card {tup(walked)} গিয়ে থামলো {tup(end)} এ। Flat টা (3, 2) তে।{walks >= 2 ? " আধা ধাপও চলে।" : ""}
            </Nope>
          ) : null}
        </>
      ) : (
        <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-3 py-1.5 text-center text-[0.85rem] leading-snug text-accent-text`}>
          Size এ 2.5 ধাপ গিয়ে (2.5, 2.5). আধা ধাপ imbalance এ গিয়ে (3, 2)।
        </div>
      )}
      <Task done={right}>Size আর imbalance এর ধাপ ঠিক করে card টা হাঁটান, যতক্ষণ না ওটা flat (3, 2) তে গিয়ে থামে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: one dot, two grids. The
//      square grid reads (3, 2); Fahim's grid is laid over it; the square one
//      goes, and the same dot reads (2.5, 0.5).

const TC2_F = makeFrame(-0.5, 4, -1, 3.2, 30, 12);

export function TwoCards() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const SAY = [
    "Bed আর bath এর grid এ flat টার card (3, 2).",
    "উপরে ফাহিমের grid বসাই: এক দিকে size এর line, আরেক দিকে imbalance এর।",
    "একই dot, নতুন card: size বরাবর 2.5, imbalance বরাবর 0.5.",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[16rem] items-center justify-center gap-3">
        <div className="w-[9rem] shrink-0">
          <Plane f={TC2_F} grid={k >= 2 ? 0 : 1} axes={k < 2} label="flat (3, 2) on the square grid, then on Fahim's grid" className="my-0! max-w-none">
            {k >= 1 && (
              <g className={FADE}>
                <Clipped f={TC2_F} name="tc">
                  <TiltGrid f={TC2_F} />
                </Clipped>
              </g>
            )}
            {k >= 2 && <Arrow f={TC2_F} from={O} to={[2.5, 2.5]} tone="blue" w={2.2} draw />}
            {k >= 2 && <Arrow f={TC2_F} from={[2.5, 2.5]} to={[3, 2]} tone="coral" w={2.2} draw delay={600} />}
            <Dot f={TC2_F} at={[3, 2]} r={4.5} className="fill-[#b45309]" />
          </Plane>
        </div>
        <span key={k >= 2 ? "new" : "old"} className={`${POP} inline-block rounded-lg border-2 px-1.5 py-0.5 text-center font-mono text-sm font-bold ${k >= 2 ? "border-cat-violet text-cat-violet" : "border-[#b45309] text-[#b45309]"}`}>
          {k >= 2 ? "(2.5, 0.5)" : "(3, 2)"}
        </span>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · Read the card aloud. Tap 2.5: two rows of rooms fill to 2.5 each, five
//     rooms. Tap 0.5: half a bed more, half a bath less, and the flat is
//     (3, 2) again, one more bed than bath.

export function ReadTheNumbers() {
  const pass = useGate();
  const [read, setRead] = useSeed("read", 0);
  const bed = read >= 1 ? 2.5 + (read >= 2 ? 0.5 : 0) : 0;
  const bath = read >= 1 ? 2.5 - (read >= 2 ? 0.5 : 0) : 0;
  const [tb, th] = useTween([bed, bath], 900);

  const tapSize = () => {
    if (read === 0) setRead(1);
  };
  const tapImb = () => {
    if (read !== 1) return;
    setRead(2);
    pass("নতুন সংখ্যা গুলা flat এর গল্প বলে।");
  };
  const SAY = [
    "আগে 2.5 এ tap করুন।",
    "2.5 ধাপ size। প্রতি ধাপে এক bed আর এক bath, মানে দুইটা room। তাই 2.5 ধাপে 5 টা room। এবার 0.5 এ tap করুন।",
    "আধা ধাপ imbalance। আধা bed বেশি, আধা bath কম। তাই bath এর চেয়ে bed একটা বেশি। দাঁড়ালো কী? 3 bed, 2 bath. আবার সেই flat (3, 2)।",
  ];

  return (
    <>
      <div className="flex items-center justify-center gap-1 font-mono text-2xl font-bold">
        <span className="text-muted">(</span>
        <button type="button" onClick={tapSize} disabled={read > 0} className={`${pill(read >= 1)} px-3! text-xl!`}>
          2.5
        </button>
        <span className="text-muted">,</span>
        <button type="button" onClick={tapImb} disabled={read !== 1} className={`${pill(read >= 2)} px-3! text-xl! disabled:opacity-50`}>
          0.5
        </button>
        <span className="text-muted">)</span>
      </div>
      <div className="mt-1 flex justify-center gap-10 text-xs font-semibold text-muted">
        <span className="text-cat-blue">size</span>
        <span className="text-cat-coral">imbalance</span>
      </div>
      <div className="mx-auto mt-3 grid max-w-[18rem] gap-2">
        {[
          { name: "bed", v: tb, tone: "bg-cat-blue/80" },
          { name: "bath", v: th, tone: "bg-cat-teal/80" },
        ].map((r) => (
          <div key={r.name} className="grid grid-cols-[2.5rem_1fr_2.2rem] items-center gap-2">
            <span className="text-sm font-semibold text-muted">{r.name}</span>
            <span className="relative grid h-7 grid-cols-4 overflow-hidden rounded-md border border-border">
              <span className={`absolute inset-y-0 left-0 ${r.tone}`} style={{ width: `${(Math.max(0, r.v) / 4) * 100}%` }} />
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="relative border-r border-white/70 last:border-r-0" />
              ))}
            </span>
            <b className="text-right font-mono text-sm">{say(Math.round(r.v * 10) / 10)}</b>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-3 min-h-16 max-w-sm text-center text-[0.9rem] leading-snug">
        <span key={read} className={FADE}>
          {SAY[read]}
        </span>
      </div>
      <Task done={read >= 2}>আগে 2.5, তারপর 0.5 এ tap করুন। দেখুন কোনটা কী বানায়।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5¼ · A figure for screen 5's explanation, no task: the card without the
//      walk. Flat (3, 2)'s five rooms slide into one row and are cut in half:
//      2.5, the size. Back in two rows, every bath pairs with a bed but one
//      bed is left over; half of it is 0.5, the imbalance.

const RC_STEP = 20;
const rcX = (i: number) => 6 + i * RC_STEP;

export function RoomsToCard() {
  const s = useScene(3, [700, 2600, 2600]);
  const k = s.k;
  const SAY = [
    "Flat (3, 2): 3 টা bed, 2 টা bath.",
    "সব room এক সারিতে, মোট 5 টা। মাঝখান দিয়ে অর্ধেক করলে 2.5. এটাই size।",
    "প্রতিটা bath এর জোড়া একটা bed। বাকি থাকে 1 টা bed, মানে ফারাক 1। ওটার অর্ধেক 0.5. এটাই imbalance.",
    "হাঁটা ছাড়াই card: (2.5, 0.5).",
  ];
  const at = (j: number): XY => (k === 1 ? [rcX(j), 24] : j < 3 ? [rcX(j), 6] : [rcX(j - 3), 42]);

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[17rem] items-center justify-center gap-2">
        <svg viewBox="0 0 108 64" className="h-auto w-[6.5rem] shrink-0" aria-label="flat (3, 2)'s five rooms, halved for the size, and the one extra bed halved for the imbalance">
          {k >= 2 &&
            [0, 1].map((j) => <path key={j} d={`M${rcX(j) + 8} 22V42`} strokeWidth={1} strokeDasharray="2 2" className={`${FADE} stroke-muted`} />)}
          {[0, 1, 2, 3, 4].map((j) => {
            const [x, y] = at(j);
            return (
              <g key={j} style={{ transform: `translate(${x}px, ${y}px)` }} className="transition-transform duration-700 ease-in-out motion-reduce:transition-none">
                <rect width={16} height={16} rx={2} className={j < 3 ? "fill-cat-blue/80" : "fill-cat-teal/80"} />
                {k >= 2 && j === 2 && (
                  <g className={FADE}>
                    <rect width={8} height={16} rx={2} className="fill-cat-coral" />
                    <rect width={16} height={16} rx={2} fill="none" strokeWidth={1.6} className="stroke-cat-coral" />
                  </g>
                )}
              </g>
            );
          })}
          {k === 1 && (
            <g className={FADE}>
              <path d={`M${rcX(0) + 2.5 * RC_STEP - 2} 18V46`} strokeWidth={1.4} strokeDasharray="3 2" className="stroke-foreground" />
              <text x={rcX(0) + 1.25 * RC_STEP - 2} y={56} textAnchor="middle" fontSize={8} fontWeight={700} fontFamily="ui-monospace, monospace" className="fill-foreground">
                2.5
              </text>
              <text x={rcX(0) + 3.75 * RC_STEP - 2} y={56} textAnchor="middle" fontSize={8} fontWeight={700} fontFamily="ui-monospace, monospace" className="fill-foreground">
                2.5
              </text>
            </g>
          )}
          {k >= 2 && (
            <text x={rcX(2) + 20} y={17} textAnchor="start" fontSize={8} fontWeight={700} fontFamily="ui-monospace, monospace" className={`${FADE} fill-cat-coral`}>
              0.5
            </text>
          )}
        </svg>
        <div className="min-w-0 text-[0.8rem] leading-snug">
          {k >= 1 && (
            <div key="s" className={FADE}>
              <div className="text-[0.7rem] leading-none text-cat-blue">size</div>
              <div className="whitespace-nowrap font-mono">(3 + 2) ÷ 2 = 2.5</div>
            </div>
          )}
          {k >= 2 && (
            <div key="m" className={`${FADE} mt-1`}>
              <div className="text-[0.7rem] leading-none text-cat-coral">imbalance</div>
              <div className="whitespace-nowrap font-mono">(3 − 2) ÷ 2 = 0.5</div>
            </div>
          )}
          {k >= 3 && (
            <span key="c" className={`${POP} mt-1 inline-block rounded-lg border-2 border-cat-violet px-1.5 py-0.5 font-mono text-sm font-bold text-cat-violet`}>
              (2.5, 0.5)
            </span>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the same card, by sums.
//      beds = s + m, baths = s − m; add the lines and m cancels; halve; put
//      s back. The shortcut the reader just read, written the book way.

export function AddLines() {
  const s = useScene(3, [700, 2200, 2000]);
  const k = s.k;
  const cut = k >= 1 ? "text-danger line-through decoration-2" : "";
  const SAY = [
    "s ধাপ size আর m ধাপ imbalance হলে bed হয় s + m, আর bath হয় s − m.",
    "দুইটা line যোগ করি। +m আর −m কাটাকাটি, থাকে 5 = 2s।",
    "অর্ধেক করলে s = 2.5. মোট room এর অর্ধেক।",
    "s ফেরত বসাই bed এর line এ: 3 = 2.5 + m. তাই m = 0.5.",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto w-fit font-mono text-[0.95rem] leading-relaxed">
        <div>
          <span className="font-sans text-xs text-muted">bed </span>3 = s <span className={cut}>+ m</span>
        </div>
        <div>
          <span className="font-sans text-xs text-muted">bath </span>2 = s <span className={cut}>− m</span>
        </div>
        {k >= 1 && (
          <div key="add" className={`${POP} border-t border-border`}>
            5 = 2s{k >= 2 ? <span className={FADE}>, s = 2.5</span> : null}
          </div>
        )}
        {k >= 3 && (
          <div key="put" className={POP}>
            3 = 2.5 + m, m = 0.5
          </div>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · Fahim's grid, for real. Turn the sheet so size runs along and
//     imbalance down; then one knob, "so much per size step", paints upright
//     stripes again. At 8000 all 8 flats fit.

const OR_F = makeFrame(-0.3, 5.8, -0.3, 3.6, 36, 12);
/** the khata's middle, (3, 2): the sheet turns about it, so the flats stay in view */
const OR_C: XY = [3, 2];
/** turn a point by a (radians) about OR_C */
const turnAbout = (p: XY, a: number): XY => {
  const [x, y] = [p[0] - OR_C[0], p[1] - OR_C[1]];
  return [OR_C[0] + x * Math.cos(a) - y * Math.sin(a), OR_C[1] + x * Math.sin(a) + y * Math.cos(a)];
};
/** where the size-s stripe sits once the sheet is turned */
const stripeX = (s: number) => OR_C[0] + R2 * (s - 2.5);
/** a flat's spot on Fahim's grid, drawn flat: size along, imbalance down */
const onFahim = (fl: Flat): XY => [sizeOf(fl) * R2, -imbOf(fl) * R2];

export function OneNumberRent() {
  const pass = useGate();
  const [turned, setTurned] = useSeed("turned", false);
  const [knob, setKnob] = useSeed("knob", 6);
  const [done, setDone] = useSeed("done", false);
  const [t] = useTween([turned ? 1 : 0], 1500);
  const a = (-Math.PI / 4) * t;
  const P = (p: XY) => turnAbout(p, a);
  const seg = (p: XY, q: XY) => {
    const [u, v] = [P(p), P(q)];
    return `M${OR_F.sx(u[0])} ${OR_F.sy(u[1])}L${OR_F.sx(v[0])} ${OR_F.sy(v[1])}`;
  };
  let old = "";
  for (let x = -2; x <= 8; x++) old += seg([x, -3], [x, 7]);
  for (let y = -3; y <= 7; y++) old += seg([-2, y], [8, y]);
  let fresh = "";
  for (let s = -1; s <= 6; s += 0.5) fresh += seg([s - 4, s + 4], [s + 4, s - 4]);
  for (let m = -3; m <= 3; m += 0.5) fresh += seg([m - 4, -m - 4], [m + 4, -m + 4]);
  const fit = FLATS.filter((fl) => fits(knob * sizeOf(fl), fl.rent)).length;
  const striped = turned && t > 0.98;

  const change = (v: number) => {
    setKnob(v);
    const n = FLATS.filter((fl) => fits(v * sizeOf(fl), fl.rent)).length;
    if (n === 8 && !done) {
      setDone(true);
      pass("একই তথ্য, নতুন grid: ভাড়া এক সংখ্যায়।");
    }
  };
  const sizeEnd = P([4.6, 4.6]);
  const imbAt = P([2.1, -0.5]);

  return (
    <>
      <Plane f={OR_F} grid={0} axes={false} label="the 8 flats on the bed and bath sheet, turned onto Fahim's grid" className="my-0! max-w-[17rem]">
        <Clipped f={OR_F} name="or">
          <path d={old} strokeWidth={0.7} opacity={1 - t} className="pointer-events-none fill-none stroke-cat-blue/40" />
          <path d={fresh} strokeWidth={0.8} opacity={t} className="pointer-events-none fill-none stroke-cat-violet/50" />
          {striped &&
            [1, 1.5, 2, 2.5, 3, 3.5, 4].map((s) => (
              <rect
                key={s}
                x={OR_F.sx(stripeX(s) - 0.25 * R2)}
                y={OR_F.sy(OR_F.y1)}
                width={0.5 * R2 * OR_F.u}
                height={(OR_F.y1 - OR_F.y0) * OR_F.u}
                opacity={0.4}
                style={{ fill: heat(knob * s) }}
                className="pointer-events-none transition-[fill] duration-500 motion-reduce:transition-none"
              />
            ))}
        </Clipped>
        {t < 0.5 ? (
          <BedBath f={OR_F} x={5.7} />
        ) : (
          <>
            <AxisName x={OR_F.sx(sizeEnd[0])} y={OR_F.sy(sizeEnd[1]) - 6} anchor="end">
              size
            </AxisName>
            <AxisName x={OR_F.sx(imbAt[0])} y={OR_F.sy(imbAt[1])} anchor="start">
              imbalance
            </AxisName>
          </>
        )}
        {FLATS.map((fl, i) => (
          <FlatDot
            key={i}
            f={OR_F}
            at={P([fl.bed, fl.bath])}
            rent={fl.rent}
            r={9}
            ring={turned && t > 0.98 ? (fits(knob * sizeOf(fl), fl.rent) ? "fit" : "miss") : null}
          />
        ))}
      </Plane>
      {!turned ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={() => setTurned(true)} className={primaryBtn}>
            Sheet টা ফাহিমের grid এ ঘুরান
          </button>
        </div>
      ) : (
        <div className={FADE}>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Stepper value={knob} onChange={change} min={4} max={12} disabled={done} label="size এর প্রতি ধাপে হাজার টাকা" />
            <span className="text-sm text-muted">হাজার টাকা, প্রতি size ধাপ</span>
          </div>
          <div className="mt-1.5 min-h-6 text-center text-[0.9rem]">
            <span key={knob} className={FADE}>
              8 টার মধ্যে <b className={`font-mono ${fit === 8 ? "text-accent-text" : "text-danger"}`}>{fit}</b> টা flat মিললো, 1000 টাকার ভিতরে।
            </span>
          </div>
          {done ? (
            <div className={`${FADE} mx-auto mt-1 max-w-sm text-center text-[0.85rem] leading-snug text-muted`}>
              প্রতিটা খাড়া পট্টি ধরে নিচে তাকান। এক size এর flat গুলার ভাড়া প্রায় সমান। imbalance যা-ই হোক।
            </div>
          ) : null}
        </div>
      )}
      <Task done={done}>Sheet টা ঘুরান। তারপর size এর প্রতি ধাপে এমন একটা দাম খুঁজুন, যেটা 8 টা flat এই মিলে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: drop the imbalance
//      number, and each flat slides onto the size line. The rents still climb
//      in order: 4.5's shadows.

const DS_F = makeFrame(-0.3, 6.1, -1.8, 0.7, 36, 12);

export function DotsSlide() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const SAY = [
    "ফাহিমের grid এ 8 টা flat: size ডানে, imbalance নিচে।",
    "Imbalance এর সংখ্যাটা ফেলে দিন। প্রতিটা flat size এর line এ নেমে আসে, ওর shadow তে।",
    "ভাড়া এখনো এক line বরাবর ধাপে ধাপে বাড়ে। একটা সংখ্যা রাখলাম, হারালাম খুব সামান্য।",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <Plane f={DS_F} grid={0} axes={false} label="the flats sliding onto the size line when imbalance is dropped" className="my-0! max-w-[16rem]">
        <path d={`M${DS_F.sx(0)} ${DS_F.sy(0)}H${DS_F.sx(6)}`} strokeWidth={1.4} className="stroke-cat-violet" />
        <AxisName x={DS_F.sx(6)} y={DS_F.sy(0) - 13} anchor="end">
          size
        </AxisName>
        {FLATS.map((fl, i) => {
          const [x, y] = onFahim(fl);
          const down = k >= 1 ? (fl.bed === 3 && fl.bath === 1 ? -0.55 : 0) : y;
          return (
            <g
              key={i}
              style={{ transform: `translate(0px, ${(y - down) * DS_F.u}px)` }}
              className="transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
            >
              {k >= 1 && y !== 0 && <path d={`M${DS_F.sx(x)} ${DS_F.sy(y) - (y - down) * DS_F.u}V${DS_F.sy(y)}`} strokeWidth={1} strokeDasharray="2 2" className="stroke-[#5a6b7d]/50" />}
              <FlatDot f={DS_F} at={[x, y]} rent={fl.rent} r={8.5} />
            </g>
          );
        })}
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A figure for screen 6's side quest, no task: two more basis changes,
//      drawn without numbers. A shop's income and cost become the profit
//      (the part of income above cost) and the two stacked; two thermometers
//      on one wall become their average and their gap.

const OB_BASE = 92;
const OB_IN = 40;
const OB_OUT = 24;
const OB_T = [36, 64];

export function OtherBases() {
  const s = useScene(3, [700, 2600, 1800]);
  const k = s.k;
  const SAY = [
    "দোকানের আয় আর খরচ, দুইটা column।",
    "একই দুইটা, নতুন করে: লাভ, মানে আয়ের যে অংশ খরচের উপরে। আর দুইটার যোগফল।",
    "এক দেয়ালে দুইটা thermometer।",
    "নতুন করে: ওদের average আর ওদের ফারাক। প্রতিবার একই তথ্য, শুধু নতুন grid।",
  ];
  const dim = "transition-opacity duration-700 motion-reduce:transition-none";
  const bar = (x: number, h: number, cls: string, y = OB_BASE - h) => <rect x={x} y={y} width={16} height={h} className={cls} />;
  const label = (x: number, t: string) => (
    <text x={x + 8} y={OB_BASE + 11} textAnchor="middle" fontSize={8} fontWeight={700} className="fill-foreground">
      {t}
    </text>
  );

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <svg viewBox="0 0 250 108" className="mx-auto block h-auto w-full max-w-[16rem]" aria-label="a shop's income and cost rewritten as profit and total; two thermometers rewritten as their average and their gap">
        <g opacity={k >= 2 ? 0.35 : 1} className={dim}>
          <text x={58} y={12} textAnchor="middle" fontSize={8.5} fontWeight={700} className="fill-muted">
            দোকান
          </text>
          <path d={`M4 ${OB_BASE}H118`} strokeWidth={1} className="stroke-muted" />
          {bar(8, OB_IN, "fill-cat-blue/70")}
          {label(8, "আয়")}
          {bar(30, OB_OUT, "fill-cat-teal/70")}
          {label(30, "খরচ")}
          {k >= 1 && (
            <g className={FADE}>
              <rect x={8} y={OB_BASE - OB_IN} width={16} height={OB_IN - OB_OUT} fill="none" strokeWidth={1.6} className="stroke-cat-coral" />
              <path d={`M24 ${OB_BASE - OB_OUT}H66`} strokeWidth={1} strokeDasharray="2 2" className="stroke-muted" />
            </g>
          )}
          {k >= 1 && (
            <g className={POP}>
              {bar(66, OB_IN - OB_OUT, "fill-cat-coral")}
              {label(66, "লাভ")}
            </g>
          )}
          {k >= 1 && (
            <g className={POP} style={{ transitionDelay: "400ms" }}>
              {bar(94, OB_OUT, "fill-cat-teal/70")}
              {bar(94, OB_IN, "fill-cat-blue/70", OB_BASE - OB_OUT - OB_IN)}
              {label(94, "যোগফল")}
            </g>
          )}
        </g>
        <g opacity={k >= 2 ? 1 : 0.35} className={dim}>
          <text x={176} y={12} textAnchor="middle" fontSize={8.5} fontWeight={700} className="fill-muted">
            thermometer
          </text>
          {[146, 172].map((x, i) => (
            <g key={x}>
              <rect x={x - 4} y={20} width={8} height={74} rx={4} fill="white" stroke="#94a3b8" strokeWidth={1} />
              <rect x={x - 2} y={OB_T[i]} width={4} height={94 - OB_T[i]} className="fill-danger" />
              <circle cx={x} cy={96} r={6.5} className="fill-danger" />
            </g>
          ))}
          {k >= 3 && <Draw d={`M136 ${(OB_T[0] + OB_T[1]) / 2}H184`} strokeWidth={1.6} className="stroke-cat-violet" />}
          {k >= 3 && (
            <text x={202} y={(OB_T[0] + OB_T[1]) / 2 + 3} textAnchor="start" fontSize={8} fontWeight={700} className={`${FADE} fill-cat-violet`}>
              average
            </text>
          )}
          {k >= 3 && (
            <g className={FADE}>
              <path d={`M188 ${OB_T[0]}H194V${OB_T[1]}H188`} fill="none" strokeWidth={1.4} className="stroke-cat-coral" />
              <text x={200} y={OB_T[0] + 3} textAnchor="start" fontSize={8} fontWeight={700} className="fill-cat-coral">
                ফারাক
              </text>
            </g>
          )}
        </g>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: footsteps on the stairs.
//      Chacha with his khata; the tenant's head comes up at the stair door;
//      Fahim holds up the rooftop flat's card.

function S7Tenant({ x, y }: { x: number; y: number }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)` }} className="pointer-events-none transition-transform duration-1000 ease-out motion-reduce:transition-none">
      <path d="M-3.5 -22V-1M3.5 -22V-1" strokeWidth={5} strokeLinecap="round" stroke="#334155" />
      <rect x={-9} y={-40} width={18} height={22} rx={5} fill="#64748b" />
      <circle cy={-51} r={9} fill="#c68e5f" />
      <path d="M-9.5 -52q0 -11 9.5 -11t9.5 11q-6 -6 -19 0Z" fill="#1c1917" />
      <circle cx={-3.4} cy={-51} r={1.2} fill="#0f1b2d" />
      <circle cx={3.4} cy={-51} r={1.2} fill="#0f1b2d" />
    </g>
  );
}

export function TenantStairs({}: Story) {
  const s = useScene(3, [700, 2200, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="footsteps on the stairs: the tenant is coming up; Chacha checks his khata; Fahim holds up the rooftop flat's card (4, 2)">
        <RoofSet />
        {/* the stair head: a small room with its door open */}
        <rect x={236} y={82} width={60} height={68} fill="#e7d7c1" stroke="#a8a29e" strokeWidth={1} />
        <rect x={232} y={78} width={68} height={6} fill="#a8a29e" />
        <rect x={252} y={104} width={24} height={46} fill="#1f2937" />
        <S7Tenant x={264} y={k >= 2 ? 150 : 222} />
        <rect x={236} y={150} width={60} height={30} fill="#d6d3d1" />
        {k >= 2 && <NameTag x={264} y={GROUND + 13} name="ভাড়াটিয়া" />}
        {k === 1 && (
          <text x={266} y={98} textAnchor="middle" fontSize={8} fontWeight={700} fill="#78350f" className={FADE}>
            ঠক ঠক ঠক
          </text>
        )}
        <Chacha x={106} y={GROUND} arm="hold" facing={1} />
        <NameTag x={106} y={GROUND + 13} name="চাচা" />
        {k === 1 && <Bubble x={106} y={GROUND - 68} side="mid" lines={["উইঠা আসতেছে।", "দাম কী কমু?"]} />}
        <CastPerson who="fahim" x={176} y={GROUND} facing={1} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 && <CastCard x={196} y={GROUND - 66} text="(4, 2) → ?" tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn. The rooftop flat, (4, 2). Dial a card, walk it; a wrong card
//     walks to where it really lands. Then price it: 8000 × 3 = 24000. The
//     wrong prices are the two real slips (8000 × beds, 8000 × rooms), and
//     each price plays out as what it counts: one 8000 chip per bed, per
//     size step or per room, popping in one by one while the sum runs up.

const YH_F = makeFrame(-1.3, 6.3, -2.3, 4.3, 24, 10);
const YH_PRICES = [32000, 24000, 48000];
const YH_RIGHT = 1;
/** how many 8000s each price counts: 4 beds, 3 size steps, 6 rooms */
const YH_COUNT = [4, 3, 6];
const YH_SQ = "size-3 rounded-[2px]";

/** one 8000 chip: what it counts (a bed, a size step's bed and bath, or one room), and 8000 under it */
function YhChip({ kind, i }: { kind: number; i: number }) {
  const bed = <span className={`${YH_SQ} bg-cat-blue/80`} />;
  const bath = <span className={`${YH_SQ} bg-cat-teal/80`} />;
  const name = kind === 0 ? "bed" : kind === 1 ? "size" : i < 4 ? "bed" : "bath";
  return (
    <span className={`${POP} grid justify-items-center gap-0.5`}>
      <span className="flex gap-0.5">
        {kind === 1 ? (
          <>
            {bed}
            {bath}
          </>
        ) : kind === 2 && i >= 4 ? (
          bath
        ) : (
          bed
        )}
      </span>
      <span className="text-[0.6rem] leading-none text-muted">{name}</span>
      <span className="font-mono text-[0.65rem] leading-none">8000</span>
    </span>
  );
}

const YH_NOPE: Record<number, string> = {
  0: "এটা 8000 × 4। গুনলেন bed। কিন্তু rule গুনে size এর ধাপ।",
  2: "এটা 8000 × 6 room। কিন্তু size এর এক ধাপে দুইটা room।",
};

export function YourHouse() {
  const pass = useGate();
  const [s, setS] = useSeed("s", 1);
  const [m, setM] = useSeed("m", 0);
  const [walked, setWalked] = useSeed<XY | null>("walked", null);
  const [walks, setWalks] = useState(0);
  const [price, setPrice] = useSeed<number | null>("price", null);
  const [miss, setMiss] = useState(0);
  const cp = usePlay(280);
  const land = (c: XY): XY => [c[0] + c[1], c[0] - c[1]];
  const cardOk = walked !== null && same(land(walked), ROOF);
  const priced = price === YH_RIGHT && !cp.running;
  const chips = price === null ? 0 : cp.running ? cp.k : YH_COUNT[price];

  const walk = () => {
    setWalked([s, m]);
    setWalks((w) => w + 1);
  };
  const choose = (i: number) => {
    if (priced) return;
    setPrice(i);
    setMiss((x) => x + 1);
    cp.play(YH_COUNT[i], i === YH_RIGHT ? () => pass("Card (3, 1): 3 ধাপ size, 24000 টাকা।") : undefined);
  };
  const mid: XY | null = walked ? [walked[0], walked[0]] : null;
  const end: XY | null = walked ? land(walked) : null;

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[11rem] shrink-0">
          <Plane f={YH_F} ticks={2} label="the rooftop flat at (4, 2), and where your card walks" className="my-0! max-w-none">
            <Clipped f={YH_F} name="yh">
              <TiltGrid f={YH_F} className="stroke-cat-violet/25" />
            </Clipped>
            <Star f={YH_F} at={ROOF} done={cardOk} />
            {walked && mid && end && walked[0] !== 0 && <Arrow key={`s${walks}`} f={YH_F} from={O} to={mid} tone="blue" w={2.2} draw />}
            {walked && mid && end && walked[1] !== 0 && <Arrow key={`m${walks}`} f={YH_F} from={mid} to={end} tone="coral" w={2.2} draw delay={700} />}
            {end && !cardOk && <Dot key={`e${walks}`} f={YH_F} at={end} r={3.5} className={`fill-danger ${POP}`} />}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 text-[0.85rem] leading-snug">
          <div className="font-semibold">ছাদের flat</div>
          <div className="font-mono">4 bed, 2 bath</div>
          {cardOk ? (
            <div className={`${FADE} mt-1 text-accent-text`}>
              Card <b className="font-mono">(3, 1)</b>: 3 ধাপ size, মানে 6 টা room। 1 ধাপ imbalance, মানে bath এর চেয়ে bed 2 টা বেশি।
            </div>
          ) : (
            <div className="mt-1 text-muted">
              Card: <b className="font-mono text-foreground">{tup([s, m])}</b>
            </div>
          )}
        </div>
      </div>
      {!cardOk ? (
        <>
          <div className="mt-2 flex items-center justify-center gap-3 text-xs font-semibold text-muted">
            <span className="grid justify-items-center gap-0.5">
              <Stepper value={s} onChange={setS} min={0} max={4} label="size এর ধাপ" />
              <span className="text-cat-blue">size</span>
            </span>
            <span className="grid justify-items-center gap-0.5">
              <Stepper value={m} onChange={setM} min={-2} max={2} label="imbalance এর ধাপ" />
              <span className="text-cat-coral">imbalance</span>
            </span>
          </div>
          <div className="mt-2 flex justify-center">
            <button type="button" onClick={walk} className={primaryBtn}>
              Card টা হাঁটান
            </button>
          </div>
          {walked && end ? (
            <Nope key={walks}>
              Card {tup(walked)} গিয়ে থামলো {tup(end)} এ। ছাদের flat টা (4, 2) তে।
            </Nope>
          ) : null}
        </>
      ) : (
        <div className={FADE}>
          <div className="mt-2 text-center text-sm font-medium text-muted">এবার ভাড়া, size এর প্রতি ধাপে 8000 টাকা ধরে:</div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {YH_PRICES.map((p, i) => (
              <button
                key={p}
                type="button"
                onClick={() => choose(i)}
                disabled={priced}
                className={`${pill(price === i && i === YH_RIGHT)} ${price === i && i !== YH_RIGHT ? "nudge border-danger/50! text-danger" : ""}`}
              >
                {p}
              </button>
            ))}
          </div>
          {price !== null ? (
            <div className="mt-2">
              <div className="flex min-h-10 flex-wrap items-end justify-center gap-1.5">
                {Array.from({ length: chips }, (_, j) => (
                  <YhChip key={`${miss}-${j}`} kind={price} i={j} />
                ))}
              </div>
              <div className="mt-1 text-center font-mono text-sm">
                8000 × {chips} = <b className={!cp.running && price !== YH_RIGHT ? "text-danger" : ""}>{8000 * chips}</b>
              </div>
            </div>
          ) : null}
          {price !== null && price !== YH_RIGHT && !cp.running ? <Nope key={miss}>{YH_NOPE[price]}</Nope> : null}
          {priced ? (
            <div className={`${POP} mx-auto mt-2 w-fit rounded-lg border-2 border-[#b45309] bg-[#fbf6e9] px-3 py-1 text-sm font-bold text-[#b45309]`}>
              ছাদের flat: <span className="font-mono">24000</span> টাকা
            </div>
          ) : null}
        </div>
      )}
      <Task done={priced}>ছাদের flat এর card বের করে হাঁটান। তারপর ওর ভাড়া বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: the khata's flats on the
//      size line, the rooftop flat landing at 3 steps, right beside flat
//      (3, 3) at 25000. Its imbalance hardly mattered.

export function SameSizeRow() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const sx = (v: number) => 16 + v * 58;
  const SAY = [
    "খাতার flat গুলা, শুধু size দিয়ে সাজানো।",
    "ছাদের flat বসলো size এর 3 ধাপে: 24000।",
    "ঠিক পাশেই flat (3, 3), একই size, ভাড়া 25000। Imbalance প্রায় কিছুই বদলায় নাই।",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <svg viewBox="0 0 290 94" className="mx-auto block h-auto w-full max-w-[17rem]" aria-label="the flats on the size line, and the rooftop flat at 3">
        <path d={`M${sx(0)} 56H${sx(4.5)}`} strokeWidth={1.4} className="stroke-cat-violet" />
        {[0, 1, 2, 3, 4].map((v) => (
          <text key={v} x={sx(v)} y={89} textAnchor="middle" fontSize={9} className="fill-muted font-mono">
            {v}
          </text>
        ))}
        {FLATS.map((fl, i) => {
          const low = fl.bed === 3 && fl.bath === 1;
          const hot = k >= 2 && fl.bed === 3 && fl.bath === 3;
          return (
            <g key={i}>
              <circle cx={sx(sizeOf(fl))} cy={low ? 67 : 56} r={hot ? 10 : 8} style={{ fill: heat(fl.rent) }} stroke={hot ? "#b45309" : "#0f1b2d"} strokeOpacity={hot ? 1 : 0.25} strokeWidth={hot ? 2 : 1} />
              <text x={sx(sizeOf(fl))} y={(low ? 67 : 56) + 3} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={heatInk(fl.rent)} fontFamily="ui-monospace, monospace">
                {fl.rent}
              </text>
            </g>
          );
        })}
        {k >= 1 && (
          <g className={POP}>
            <path d={`M${sx(3)} 44V30`} strokeWidth={1.2} className="stroke-[#b45309]" />
            <rect x={sx(3) - 34} y={10} width={68} height={20} rx={4} fill="#fbf6e9" stroke="#b45309" strokeWidth={1.4} />
            <text x={sx(3)} y={24} textAnchor="middle" fontSize={9} fontWeight={700} fill="#b45309">
              ছাদ: 24
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7¾ · A second figure for screen 7's explanation, no task: Chacha looks at
//      his khata one last time. A page of it, the rows from FLATS; flat
//      (3, 3) at 25000 is ringed, and he writes 24000 on the rooftop's row.

const CW_ROWS: [string, string][] = [
  ["(2, 2)", "16000"],
  ["(3, 3)", "25000"],
  ["(4, 3)", "27000"],
];
const CW_X = 142;
const CW_Y = 30;

export function ChachaWrites() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const row = (i: number) => CW_Y + 14 + i * 15;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="Chacha looks at his khata one last time: flat (3, 3), the same size, is 25000; he writes 24000 for the rooftop flat">
        <RoofSet />
        <Chacha x={108} y={GROUND} arm={k >= 2 ? "point" : "hold"} />
        <NameTag x={108} y={GROUND + 13} name="চাচা" />
        <g className="pointer-events-none">
          <rect x={CW_X - 8} y={CW_Y - 12} width={128} height={78} rx={2} fill="white" stroke="#b91c1c" strokeWidth={1.2} />
          <path d={`M${CW_X + 2} ${CW_Y - 12}V${CW_Y + 66}`} stroke="#fca5a5" strokeWidth={0.8} />
          <text x={CW_X + 8} y={CW_Y} fontSize={7.5} fontWeight={700} fill="#5a6b7d">
            flat
          </text>
          <text x={CW_X + 112} y={CW_Y} textAnchor="end" fontSize={7.5} fontWeight={700} fill="#5a6b7d">
            ভাড়া
          </text>
          {CW_ROWS.map(([f, r], i) => (
            <g key={f}>
              <text x={CW_X + 8} y={row(i)} fontSize={8.5} fontWeight={600} fill="#0f1b2d" fontFamily="ui-monospace, monospace">
                {f}
              </text>
              <text x={CW_X + 112} y={row(i)} textAnchor="end" fontSize={8.5} fontWeight={600} fill="#0f1b2d" fontFamily="ui-monospace, monospace">
                {r}
              </text>
            </g>
          ))}
          <text x={CW_X + 8} y={row(3)} fontSize={8.5} fontWeight={700} fill="#b45309">
            ছাদ
          </text>
          <text x={CW_X + 26} y={row(3)} fontSize={8.5} fontWeight={700} fill="#b45309" fontFamily="ui-monospace, monospace">
            (4, 2)
          </text>
          {k < 2 && <path d={`M${CW_X + 80} ${row(3) + 2}H${CW_X + 112}`} stroke="#a8a29e" strokeWidth={0.8} strokeDasharray="2 2" />}
        </g>
        {k >= 1 && <rect x={CW_X + 2} y={row(1) - 10} width={114} height={14} rx={4} fill="none" stroke="#b45309" strokeWidth={1.4} strokeDasharray="3 2" className={FADE} />}
        {k >= 2 && (
          <text x={CW_X + 112} y={row(3)} textAnchor="end" fontSize={8.5} fontWeight={800} fill="#b45309" fontFamily="ui-monospace, monospace" className={FADE}>
            24000
          </text>
        )}
        {k >= 2 && <Draw d={`M${CW_X + 82} ${row(3) + 3}H${CW_X + 112}`} strokeWidth={1.2} className="stroke-[#b45309]" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: Nasib writes a card on
//      Fahim's grid, (2, 1), holds it up and asks which flat it is. The
//      answer stays with the exercise.

export function NasibCard({}: Story) {
  const s = useScene(2, [700, 2000]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="Nasib writes a card on Fahim's grid, (2, 1), and asks Fahim which flat it is in beds and baths">
        <RoofSet />
        <CastPerson who="nasib" x={150} y={GROUND} facing={1} arm={k >= 1 ? "hold" : "point"} label />
        {k >= 1 && (
          <g className={FADE}>
            <text x={194} y={GROUND - 58} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#5a6b7d">
              ফাহিমের grid
            </text>
          </g>
        )}
        {k >= 1 && <CastCard x={194} y={GROUND - 44} text="(2, 1)" tone="blue" />}
        {k >= 2 && <Bubble x={150} y={GROUND - 68} side="mid" lines={["bed আর bath এ এটা", "কোন flat?"]} />}
        <CastPerson who="fahim" x={240} y={GROUND} facing={-1} mood={k >= 2 ? "puzzled" : "plain"} label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · Try it: Nasib's card (2, 1) on Fahim's grid. Tap the flat's spot on the
//     (bed, bath) sheet; then the card walks, 2 size steps and 1 imbalance
//     step, to (3, 1). A wrong tap stays where it was dropped, in red.

const TCB_F = makeFrame(-0.5, 5.5, -0.8, 3.6, 34, 12);
const TCB_CARD: XY = [2, 1];
const TCB_MID: XY = [2, 2];
const TCB_AT: XY = [3, 1];

export function TryConvertBack() {
  const pass = useGate();
  const [drop, setDrop] = useSeed<XY | null>("drop", null);
  const [walkedSeed, setWalked] = useSeed("walked", false);
  const [tries, setTries] = useState(0);
  const p = usePlay(750);
  const right = drop !== null && same(drop, TCB_AT);
  const step = walkedSeed ? 2 : p.k;

  const down = (q: XY) => {
    if (right) return;
    const at = snap(q, TCB_F);
    setDrop(at);
    setWalked(false);
    setTries((t) => t + 1);
    p.play(2, () => {
      setWalked(true);
      if (same(at, TCB_AT)) pass("প্রতিটা card ফেরত যায়। নতুন তথ্য নাই।");
    });
  };

  return (
    <>
      <div className="mx-auto w-fit rounded-lg border-2 border-cat-violet px-3 py-1 text-center">
        <div className="text-xs text-muted">ফাহিমের grid এ নাসিবের card</div>
        <div className="font-mono font-bold text-cat-violet">size 2, imbalance 1</div>
      </div>
      <Plane f={TCB_F} ticks={1} drag={{ down }} label="tap the spot on the bed and bath sheet where the card (2, 1) really is" className="my-2! max-w-[16rem]">
        <BedBath f={TCB_F} x={5.4} />
        {drop && step >= 1 && <Arrow key={`s${tries}`} f={TCB_F} from={O} to={TCB_MID} tone="blue" w={2.4} draw />}
        {drop && step >= 2 && <Arrow key={`m${tries}`} f={TCB_F} from={TCB_MID} to={TCB_AT} tone="coral" w={2.4} draw />}
        {drop && step >= 2 && <Dot f={TCB_F} at={TCB_AT} r={4} className={`fill-cat-violet ${POP}`} />}
        {drop && (
          <circle key={`d${tries}`} cx={TCB_F.sx(drop[0])} cy={TCB_F.sy(drop[1])} r={7} strokeWidth={2.4} className={`${POP} fill-none ${step >= 2 && !right ? "stroke-danger" : "stroke-[#b45309]"}`} />
        )}
      </Plane>
      {drop && step >= 2 && !right ? (
        <Nope key={tries}>
          {same(drop, TCB_CARD)
            ? "card টাকে পড়লেন bed আর bath হিসাবে। হাঁটাটা দেখুন। 2 ধাপ size এ (2, 2)। তারপর 1 ধাপ imbalance এ (3, 1)।"
            : `Card টা হেঁটে গেলো (3, 1) এ, ${tup(drop)} এ না। যেখানে থামলো, সেখানে tap করুন।`}
        </Nope>
      ) : null}
      {right && step >= 2 ? (
        <div className={`${FADE} mx-auto mt-1 max-w-sm rounded-2xl bg-accent/10 px-3 py-1.5 text-center text-[0.85rem] leading-snug text-accent-text`}>
          Card (2, 1) মানে flat (3, 1): 3 bed, 1 bath.
        </div>
      ) : null}
      <Task done={right && step >= 2}>নাসিবের card টা bed আর bath এ আসলে কোথায়, সেই জায়গায় tap করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for the exercise's explanation, no task: two sums one way,
//      two sums back. Nothing lost, nothing added.

export function BackAndForth() {
  const s = useScene(3, [700, 2000, 2000]);
  const k = s.k;
  const SAY = [
    "নাসিবের card, (2, 1): size 2, imbalance 1.",
    "Bed: size যোগ imbalance, 2 + 1 = 3. Bath: size বিয়োগ imbalance, 2 − 1 = 1.",
    "আবার ফেরত: size = (3 + 1) ÷ 2 = 2, imbalance = (3 − 1) ÷ 2 = 1.",
    "দুই দিকেই দুইটা করে হিসাব। কিছু হারায় না, কিছু যোগও হয় না।",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[16rem] items-center justify-center gap-2">
        <div className="rounded-lg border-2 border-cat-violet px-2 py-1 text-center">
          <div className="text-[0.65rem] text-muted">size, imbalance</div>
          <div className="font-mono font-bold text-cat-violet">(2, 1)</div>
        </div>
        <svg viewBox="0 0 64 40" className="h-auto w-16" aria-hidden="true">
          {k >= 1 && k < 3 && <Draw d="M4 13H56M50 8L57 13L50 18" strokeWidth={1.8} className={k === 1 ? "stroke-[#0f1b2d]" : "stroke-[#5a6b7d]/50"} />}
          {k >= 2 && <Draw d="M60 28H8M14 23L7 28L14 33" strokeWidth={1.8} className={k === 2 ? "stroke-[#0f1b2d]" : "stroke-[#5a6b7d]/50"} />}
        </svg>
        <div className="rounded-lg border-2 border-[#b45309] px-2 py-1 text-center">
          <div className="text-[0.65rem] text-muted">bed, bath</div>
          <div className="font-mono font-bold text-[#b45309]">{k >= 1 ? <span className={POP}>(3, 1)</span> : "(?, ?)"}</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8¾ · A second figure for the exercise's explanation, no task: the same slip
//      twice. Nasib's (2, 1) read as bed and bath lands on the wrong flat; 5.5's
//      school card (−1, 3) read on the map lands off the road. Walked on their
//      own grids (Fahim's buttons; the rickshaw lanes, (1, 0) and (1, 1)), both
//      land home: flat (3, 1), the school at (2, 3).

const SS_L = makeFrame(-0.4, 3.6, -1.4, 2.6, 20, 8);
const SS_R = makeFrame(-1.6, 4.2, -0.4, 3.6, 20, 8);
const SS_SCHOOL: XY = [2, 3];

export function SchoolSlip() {
  const s = useScene(2, [700, 2400]);
  const k = s.k;
  const SAY = [
    "নাসিবের card (2, 1), আর কালকের স্কুলের রাস্তার card (−1, 3)।",
    "দুইটাকেই পুরানো grid এর slot হিসাবে পড়লাম। দুইটাই ভুল জায়গায় থামলো।",
    "যার card, তার grid এ হাঁটলে: flat (3, 1), আর স্কুলের গেট।",
  ];
  const tag = (t: string, cls: string) => <div className={`text-center font-mono text-xs font-bold ${cls}`}>{t}</div>;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[17rem] items-end justify-center gap-3">
        <div className="w-[7.2rem] shrink-0">
          {tag("(2, 1)", "text-cat-violet")}
          <Plane f={SS_L} ticks={1} label="Nasib's card (2, 1): read as bed and bath it is the wrong flat; walked on Fahim's grid it is flat (3, 1)" className="my-0! max-w-none">
            <BedBath f={SS_L} x={3.5} y={2.45} />
            {k === 1 && <Dot f={SS_L} at={[2, 1]} r={4} className={`fill-danger ${POP}`} />}
            {k >= 2 && <Arrow f={SS_L} from={O} to={[2, 2]} tone="blue" w={2} draw />}
            {k >= 2 && <Arrow f={SS_L} from={[2, 2]} to={[3, 1]} tone="coral" w={2} draw delay={600} />}
            {k >= 2 && <Dot f={SS_L} at={[3, 1]} r={4} className={`fill-cat-violet ${POP}`} />}
          </Plane>
        </div>
        <div className="w-[7.2rem] shrink-0">
          {tag("(−1, 3)", "text-cat-coral")}
          <Plane f={SS_R} ticks={1} label="the school's road card (−1, 3): read on the map it is off in a field; walked on the rickshaw lanes it is the school gate" className="my-0! max-w-none">
            <g className="pointer-events-none">
              <path d={`M${SS_R.sx(SS_SCHOOL[0]) - 8} ${SS_R.sy(SS_SCHOOL[1]) + 6}V${SS_R.sy(SS_SCHOOL[1]) - 4}L${SS_R.sx(SS_SCHOOL[0])} ${SS_R.sy(SS_SCHOOL[1]) - 10}L${SS_R.sx(SS_SCHOOL[0]) + 8} ${SS_R.sy(SS_SCHOOL[1]) - 4}V${SS_R.sy(SS_SCHOOL[1]) + 6}Z`} fill="#fde7c7" stroke="#92400e" strokeWidth={1} />
              <text x={SS_R.sx(SS_SCHOOL[0]) + 10} y={SS_R.sy(SS_SCHOOL[1]) + 3} textAnchor="start" fontSize={7} fontWeight={700} fill="#92400e">
                স্কুল
              </text>
            </g>
            {k === 1 && <Dot f={SS_R} at={[-1, 3]} r={4} className={`fill-danger ${POP}`} />}
            {k >= 2 && <Arrow f={SS_R} from={O} to={[-1, 0]} tone="blue" w={2} draw />}
            {k >= 2 && <Arrow f={SS_R} from={[-1, 0]} to={SS_SCHOOL} tone="coral" w={2} draw delay={600} />}
          </Plane>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for the finale's setup, no task: night, the new
//      flat's windows light up, and the jilapi comes apart in two.

function S9House({ lit }: { lit: number }) {
  const wins: XY[] = [
    [34, 58],
    [62, 58],
    [90, 58],
    [34, 88],
    [62, 88],
    [90, 88],
  ];
  return (
    <g className="pointer-events-none">
      <rect x={20} y={40} width={96} height={110} fill="#57534e" />
      <rect x={16} y={36} width={104} height={6} fill="#44403c" />
      {wins.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={14} height={16} fill={i < lit ? "#fde047" : "#1e293b"} className="transition-[fill] duration-700 motion-reduce:transition-none" style={{ transitionDelay: `${i * 150}ms` }} />
      ))}
      <rect x={58} y={120} width={20} height={30} fill="#78350f" />
    </g>
  );
}

export function FirstNight({}: Story) {
  const s = useScene(3, [700, 1800, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="the first night in the new flat: the windows light up, and Fahim and Nasib split the jilapi">
        <S9House lit={k >= 1 ? 6 : 0} />
        <CastPerson who="fahim" x={k >= 3 ? 176 : 196} y={GROUND} facing={1} arm={k >= 3 ? "hold" : "down"} mood={k >= 2 ? "happy" : "plain"} walking={k === 3} ms={900} />
        <NameTag x={k >= 3 ? 176 : 196} y={GROUND + 13} name="ফাহিম" night />
        <CastPerson who="nasib" x={k >= 3 ? 268 : 248} y={GROUND} facing={-1} arm={k >= 2 ? "hold" : "down"} mood={k >= 2 ? "happy" : "plain"} walking={k === 3} ms={900} />
        <NameTag x={k >= 3 ? 268 : 248} y={GROUND + 13} name="নাসিব" night />
        {k === 2 && <Jilapi x={258} y={GROUND - 36} s={0.9} />}
        {k >= 3 && (
          <>
            <g className={POP}>
              <Jilapi x={190} y={GROUND - 28} s={0.8} half />
            </g>
            <g className={POP}>
              <Jilapi x={254} y={GROUND - 28} s={0.8} half />
            </g>
            <Bubble x={222} y={GROUND - 72} side="mid" lines={["অর্ধেক অর্ধেক।", "দুইজনই ঠিক।"]} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9 · The finale. Open the sealed bet: Nasib's half (the card converted
//     back), Fahim's half (8000 × size fit all 8), and the jilapi splits.

export function BetSettled() {
  const pass = useGate();
  const [open, setOpen] = useSeed("open", false);
  const p = usePlay(900);
  const shown = open ? (p.running ? p.k : 3) : 0;
  const [gap] = useTween([shown >= 3 ? 1 : 0], 900);

  const unseal = () => {
    setOpen(true);
    p.play(3, () => pass("একই তথ্য, ভালো grid: দুইজনই ঠিক।"));
  };

  return (
    <>
      {!open ? (
        <div className="flex justify-center">
          <button type="button" onClick={unseal} className={primaryBtn}>
            সিল করা বাজি খুলুন
          </button>
        </div>
      ) : (
        <div className="mx-auto grid max-w-sm gap-1.5">
          {shown >= 1 ? (
            <div className={`${FADE} rounded-xl border-2 border-accent/50 bg-accent/5 px-2.5 py-1 text-[0.8rem] leading-snug`}>
              <b className="text-cat-coral">নাসিব</b> <Tick /> নতুন কোনো তথ্য নাই: card (2, 1) সোজা ফেরত গেলো flat (3, 1) এ।
            </div>
          ) : null}
          {shown >= 2 ? (
            <div className={`${FADE} rounded-xl border-2 border-accent/50 bg-accent/5 px-2.5 py-1 text-[0.8rem] leading-snug`}>
              <b className="text-cat-blue">ফাহিম</b> <Tick /> ভাড়া এক সংখ্যায়: size এর প্রতি ধাপে 8000, আর 8 টা flat এই মিলে গেলো।
            </div>
          ) : null}
        </div>
      )}
      <svg viewBox="0 0 200 40" className="mx-auto mt-1 block h-auto w-full max-w-[11rem]" aria-label="the jilapi, split in two">
        {shown >= 3 ? (
          <>
            <Jilapi x={100 - 30 * gap} y={36} half />
            <Jilapi x={100 + 30 * gap} y={36} half />
          </>
        ) : (
          <Jilapi x={100} y={36} />
        )}
      </svg>
      {shown >= 3 ? <div className={`${FADE} text-center text-sm font-semibold`}>দুইজনই ঠিক। জিলাপি ভাগ হলো।</div> : null}
      <Task done={shown >= 3}>সিল করা বাজিটা খুলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9¼ · A figure for the finale's explanation, no task: the khata twice. The
//      same 8 rows and rents, first as (bed, bath), then the two columns
//      rewritten as (size, imbalance); then size alone lines up with the rent
//      and the imbalance column fades. No row, no column added.

const KT_ROW = 10.5;

export function KhataTwice() {
  const s = useScene(2, [700, 2600]);
  const k = s.k;
  const SAY = [
    "চাচার খাতা: 8 টা flat, bed, bath আর ভাড়া।",
    "একই 8 টা row, একই ভাড়া। শুধু দুইটা column নতুন করে লেখা: size আর imbalance।",
    "এখন size পড়লেই ভাড়া বোঝা যায়। নতুন তথ্য নাই, শুধু দেখা সহজ।",
  ];
  const cols: [string, (f: Flat) => number][] =
    k >= 1
      ? [
          ["size", sizeOf],
          ["imbalance", imbOf],
        ]
      : [
          ["bed", (f) => f.bed],
          ["bath", (f) => f.bath],
        ];
  const X = [40, 96, 164];
  const ink = (c: number) => (k >= 2 ? (c === 0 ? "#6d28d9" : "#94a3b8") : "#0f1b2d");

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <svg viewBox="0 0 200 104" className="mx-auto block h-auto w-full max-w-[13rem]" aria-label="the khata's 8 flats, as bed and bath, then as size and imbalance, with the same rents">
        <rect x={2} y={1} width={196} height={102} rx={3} fill="white" stroke="#b91c1c" strokeWidth={1} />
        {cols.map(([name], c) => (
          <text key={`${k >= 1}${name}`} x={X[c]} y={12} textAnchor="middle" fontSize={8} fontWeight={700} fill={ink(c)} className={FADE}>
            {name}
          </text>
        ))}
        <text x={X[2]} y={12} textAnchor="middle" fontSize={8} fontWeight={700} fill="#0f1b2d">
          ভাড়া
        </text>
        <path d="M8 16H192" stroke="#e5e7eb" strokeWidth={1} />
        {FLATS.map((fl, i) => {
          const y = 25 + i * KT_ROW;
          return (
            <g key={i}>
              {cols.map(([name, v], c) => (
                <text key={`${k >= 1}${name}`} x={X[c]} y={y} textAnchor="middle" fontSize={8} fontWeight={c === 0 && k >= 2 ? 800 : 600} fill={ink(c)} fontFamily="ui-monospace, monospace" className={`${FADE} transition-[fill] duration-700 motion-reduce:transition-none`}>
                  {say(v(fl))}
                </text>
              ))}
              {k >= 2 && <rect x={X[2] - 22} y={y - 8} width={44} height={10} rx={2} style={{ fill: heat(fl.rent) }} opacity={0.6} className={FADE} />}
              <text x={X[2]} y={y} textAnchor="middle" fontSize={8} fontWeight={600} fill="#0f1b2d" fontFamily="ui-monospace, monospace">
                {fl.rent}000
              </text>
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for the finale's explanation, no task: the open question.
//      The rooftop flat's two cards; Nasib, half a jilapi in hand, isn't
//      done: any grid, any numbers. Then which ones are real? It stops at "?".

export function NasibNotDone() {
  const s = useScene(3, [700, 1800, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="Nasib, half a jilapi in hand, says any grid gives any numbers; which ones are real?">
        <CastPerson who="fahim" x={96} y={GROUND} facing={1} arm="hold" />
        <NameTag x={96} y={GROUND + 13} name="ফাহিম" night />
        <Jilapi x={110} y={GROUND - 28} s={0.8} half />
        <CastPerson who="nasib" x={220} y={GROUND} facing={-1} arm={k >= 2 ? "point" : "hold"} mood={k >= 2 ? "smug" : "plain"} />
        <NameTag x={220} y={GROUND + 13} name="নাসিব" night />
        {k < 2 && <Jilapi x={206} y={GROUND - 28} s={0.8} half />}
        {k >= 1 && <CastCard x={134} y={40} text="(4, 2)" tone="amber" />}
        {k >= 1 && <CastCard x={186} y={40} text="(3, 1)" tone="blue" />}
        {k >= 2 && <Bubble x={220} y={GROUND - 68} side="left" lines={["যেকোনো grid নিলে", "যেকোনো সংখ্যা।"]} />}
        {k >= 3 && (
          <text x={158} y={112} textAnchor="middle" fontSize={22} fontWeight={800} fill="#fde047" className={POP}>
            ?
          </text>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  RooftopBet: { start: { k: 0 }, chacha: { k: 1 }, fahim: { k: 2 }, nasib: { k: 3 }, end: {} },
  JilapiBet: { start: {}, fahim: { bet: 0 }, sealed: { bet: 2, sealed: true } },
  EightFlats: { start: { k: 0 }, flats: { k: 1 }, end: {} },
  ChachaTries: { start: { k: 0 }, chacha: { k: 1 }, end: {} },
  RentGrid: { start: {}, bed: { mode: "bed", knob: 8, seen: ["bed:6", "bed:7", "bed:8"] }, done: { mode: "bath", knob: 9, seen: ["bed:6", "bed:7", "bed:8", "bath:6", "bath:8", "bath:9"] } },
  SlantClimb: { start: { k: 0 }, column: { k: 1 }, lines: { k: 2 }, end: {} },
  FahimDraws: { start: { k: 0 }, both: { k: 2 }, ask: { k: 3 }, end: {} },
  PressButtons: { start: {}, size: { moves: ["s"] }, both: { moves: ["s", "m"] }, done: { moves: ["s", "m"], boxed: true } },
  SquareTurned: { start: { k: 0 }, grid: { k: 1 }, end: {} },
  FindCard: { start: {}, wrong: { hs: 4, hm: 2, walked: [2, 1] }, done: { hs: 5, hm: 1, walked: [2.5, 0.5] } },
  TwoCards: { start: { k: 0 }, over: { k: 1 }, end: {} },
  ReadTheNumbers: { start: {}, size: { read: 1 }, done: { read: 2 } },
  AddLines: { start: { k: 0 }, add: { k: 1 }, end: {} },
  OneNumberRent: { start: {}, turned: { turned: true, knob: 6 }, done: { turned: true, knob: 8, done: true } },
  DotsSlide: { start: { k: 0 }, end: {} },
  TenantStairs: { start: { k: 0 }, steps: { k: 1 }, end: {} },
  YourHouse: { start: {}, wrong: { s: 2, m: 1, walked: [2, 1] }, card: { s: 3, m: 1, walked: [3, 1] }, slip: { s: 3, m: 1, walked: [3, 1], price: 2 }, done: { s: 3, m: 1, walked: [3, 1], price: 1 } },
  SameSizeRow: { start: { k: 0 }, end: {} },
  TryConvertBack: { start: {}, wrong: { drop: [2, 1], walked: true }, right: { drop: [3, 1], walked: true } },
  BackAndForth: { start: { k: 0 }, there: { k: 1 }, end: {} },
  FirstNight: { start: { k: 0 }, lit: { k: 2 }, end: {} },
  BetSettled: { start: {}, open: { open: true } },
  NasibNotDone: { start: { k: 0 }, cards: { k: 1 }, end: {} },
  RoomsToCard: { start: { k: 0 }, size: { k: 1 }, imb: { k: 2 }, end: {} },
  OtherBases: { start: { k: 0 }, shop: { k: 1 }, thermo: { k: 2 }, end: {} },
  ChachaWrites: { start: { k: 0 }, ring: { k: 1 }, end: {} },
  NasibCard: { start: { k: 0 }, card: { k: 1 }, end: {} },
  SchoolSlip: { start: { k: 0 }, slip: { k: 1 }, end: {} },
  KhataTwice: { start: { k: 0 }, rewritten: { k: 1 }, end: {} },
};
