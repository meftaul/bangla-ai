"use client";

import { useId, useState, type ReactNode } from "react";

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
  usePlay,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
} from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person as CastPerson, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Dot, Label, Plane, Star, clamp, makeFrame, same, sg, snap, tup, type Frame, type XY } from "@/components/journey/plane";
import { Task, useGate } from "@/components/journey/journey";

// Screens for "Math for AI 5.6 — The rooftop flat's rent, a new basis", told
// as a Journey in plain English, 10 steps (the pathshala-journey skill).
//
// Last day of moving week. Chacha, the landlord, has a new rooftop flat,
// (4 bed, 2 bath), and the tenant comes tonight. His khata has 8 flats as
// (bed, bath) with their rents. Fahim claims he can rewrite the same two
// columns so the rent needs just one number; Nasib says no new information
// goes in, so nothing new comes out. A jilapi rides on it (JilapiBet, sealed).
// One-column rules fail (RentGrid); Fahim's two buttons, size (1, 1) and
// imbalance (1, −1), are a basis at right angles (NewAxes); flat (3, 2)
// becomes (2.5, 0.5) by hand (HouseInNewBasis) and the numbers get read out
// (ReadTheNumbers); on the turned grid, one knob prices all 8 flats
// (OneNumberRent); turning a grid under 2.3's word map changes every number
// and no distance (SpinTheGrid); the rooftop flat is (3, 1), 24000 taka
// (YourHouse); a card converts back (TryConvertBack); and the bet splits the
// jilapi (BetSettled).
//
// The khata's rents are invented: about 8000 taka per size step, give or
// take 1000, so a one-column rule fits at most 3 of 8 flats and the
// imbalance barely matters (a least-squares fit gives about 7950 per size
// step and about 180 per imbalance step). Rents are in thousand taka.
//
// Story scenes: RooftopBet, NasibDoubts, FirstNight. Watch-only figures, one
// in every <Then>: EightFlats, SlantClimb, TwoButtonsDo, TwoCards,
// ShrinkToOne, DotsSlide, SameArrows, SameSizeRow, BackAndForth, PcaWords.
// Cast name labels are Bangla chrome, so names are drawn here (NameTag).
// Chacha and the jilapi aren't in cast.tsx; they're drawn locally.
//
// Tailwind only; the sheets are journey/plane. Ink on white sheets is fixed.

const O: XY = [0, 0];
const R2 = Math.SQRT2;

/** A story scene takes `story` and ignores it (see journey.tsx). */
type Story = { story?: boolean };

/** a number as it's said: 2.5, 3, −0.5 */
const say = (n: number) => sg(Math.round(n * 100) / 100);

// ---------------------------------------------------------------------------
// The shared data: Chacha's khata. 8 flats, rent in thousand taka. About
// 8 per size step ((bed + bath) / 2), give or take 1.

type Flat = { bed: number; bath: number; rent: number };
const FLATS: Flat[] = [
  { bed: 1, bath: 1, rent: 7 },
  { bed: 2, bath: 1, rent: 11 },
  { bed: 2, bath: 2, rent: 16 },
  { bed: 3, bath: 1, rent: 17 },
  { bed: 3, bath: 2, rent: 20 },
  { bed: 3, bath: 3, rent: 25 },
  { bed: 4, bath: 3, rent: 27 },
  { bed: 5, bath: 3, rent: 32 },
];
const sizeOf = (f: Flat) => (f.bed + f.bath) / 2;
const imbOf = (f: Flat) => (f.bed - f.bath) / 2;
const ROOF: XY = [4, 2];
/** within 1000 taka counts as a fit */
const fits = (guess: number, rent: number) => Math.abs(guess - rent) <= 1;

/** a rent's colour: pale yellow when cheap, deep red when dear */
const heat = (r: number) => {
  const t = clamp((r - 6) / 28, 0, 1);
  return `hsl(${Math.round(46 - 42 * t)} 85% ${Math.round(80 - 38 * t)}%)`;
};
const heatInk = (r: number) => (r >= 20 ? "#ffffff" : "#3b2a0a");

/** one flat on a sheet: a dot in its rent's colour, the rent written on it */
function FlatDot({ f, at, rent, ring = null, r = 10 }: { f: Frame; at: XY; rent: number; ring?: "fit" | "miss" | null; r?: number }) {
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
      <circle cx={x} cy={y} r={r} style={{ fill: heat(rent) }} stroke="#0f1b2d" strokeOpacity={0.25} />
      <text x={x} y={y + 3.2} textAnchor="middle" fontSize={r * 0.9} fontWeight={700} fill={heatInk(rent)} fontFamily="ui-monospace, monospace">
        {rent}
      </text>
    </g>
  );
}

/** an axis name in small grey ink */
function AxisName({ x, y, anchor = "middle", children }: { x: number; y: number; anchor?: "start" | "middle" | "end"; children: ReactNode }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={9} fontWeight={700} className="pointer-events-none fill-[#5a6b7d]">
      {children}
    </text>
  );
}

/** Children clipped to the white sheet, for tilted grid lines. `name` keeps ids apart in a shot. */
function Clipped({ f, name, children }: { f: Frame; name: string; children: ReactNode }) {
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

/** Fahim's grid on the (bed, bath) sheet: lines of equal size and of equal imbalance, every half step. */
function TiltGrid({ f, className = "stroke-cat-violet/40" }: { f: Frame; className?: string }) {
  const seg = (a: XY, b: XY) => `M${f.sx(a[0])} ${f.sy(a[1])}L${f.sx(b[0])} ${f.sy(b[1])}`;
  let d = "";
  for (let s = -2; s <= 6; s += 0.5) d += seg([s - 8, s + 8], [s + 8, s - 8]);
  for (let m = -4; m <= 4; m += 0.5) d += seg([m - 8, -m - 8], [m + 8, -m + 8]);
  return <path d={d} strokeWidth={0.7} className={`pointer-events-none fill-none ${className}`} />;
}

/** A name under someone's feet — cast labels are Bangla, so English ones are drawn here. */
function NameTag({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={7} fontWeight={700} className="fill-[#5a6b7d]" pointerEvents="none">
      {name}
    </text>
  );
}

/** Chacha, the landlord: white panjabi, white tupi, grey beard. Feet at (x, y), cast scale. */
function Chacha({ x, y, facing = 1, arm = "down" }: { x: number; y: number; facing?: 1 | -1; arm?: "down" | "hold" | "point" }) {
  const armR = arm === "hold" ? "M8 -37l9 -6" : arm === "point" ? "M8 -37l13 -3" : "M8 -38l3 14";
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)` }} className="pointer-events-none">
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
function Jilapi({ x, y, s = 1, half = false }: { x: number; y: number; s?: number; half?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <path d="M-9 -16L0 4L9 -16Z" fill="#fef3c7" stroke="#a16207" strokeWidth={0.8} />
      <circle cx={-3.5} cy={-19} r={3.4} fill="none" stroke="#f97316" strokeWidth={2.2} />
      {!half && <circle cx={3.5} cy={-19.5} r={3.4} fill="none" stroke="#ea580c" strokeWidth={2.2} />}
      {!half && <circle cx={0} cy={-24.5} r={3} fill="none" stroke="#f59e0b" strokeWidth={2.2} />}
    </g>
  );
}

/** the rooftop: a grey floor, the parapet behind, a water tank and the new rooftop flat */
function RoofSet({ lit = false }: { lit?: boolean }) {
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
      <rect x={42} y={96} width={18} height={14} fill={lit ? "#fde047" : "#93c5fd"} stroke="#64748b" strokeWidth={0.6} />
      <text x={37} y={90} textAnchor="middle" fontSize={7} fontWeight={700} fill="#78350f">
        (4, 2)
      </text>
      <rect x={284} y={96} width={26} height={30} rx={4} fill="#1f2937" />
      <rect x={288} y={126} width={4} height={6} fill="#1f2937" />
      <rect x={302} y={126} width={4} height={6} fill="#1f2937" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the rooftop at dusk.
//      Chacha with his khata and no rent for the new flat; Fahim's claim,
//      Nasib's answer, and a cone of jilapi on the line.

const S1_GROUND = 150;

export function RooftopBet({}: Story) {
  const s = useScene(4, [700, 2400, 2600, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="on the rooftop, Chacha has no rent for the new flat; Fahim and Nasib bet a cone of jilapi on Fahim's claim">
        <RoofSet />
        <Chacha x={98} y={S1_GROUND} arm="hold" />
        <NameTag x={98} y={S1_GROUND + 13} name="Chacha" />
        {k === 1 && <Bubble x={98} y={S1_GROUND - 68} side="mid" lines={["Tenant comes tonight.", "What rent do I ask?"]} />}
        <CastPerson who="fahim" x={186} y={S1_GROUND} facing={-1} arm={k === 2 ? "point" : "down"} mood={k >= 2 ? "smug" : "plain"} />
        <NameTag x={186} y={S1_GROUND + 13} name="Fahim" />
        {k === 2 && <Bubble x={186} y={S1_GROUND - 68} side="mid" lines={["Same two columns,", "rent in ONE number."]} />}
        <CastPerson who="nasib" x={250} y={S1_GROUND} facing={-1} arm={k >= 4 ? "hold" : "down"} mood={k === 3 ? "shout" : k >= 4 ? "smug" : "plain"} />
        <NameTag x={250} y={S1_GROUND + 13} name="Nasib" />
        {k === 3 && <Bubble x={250} y={S1_GROUND - 68} side="left" lines={["No new facts,", "nothing new comes out."]} />}
        {k >= 4 && (
          <g className={POP}>
            <Jilapi x={262} y={S1_GROUND - 34} s={0.9} />
          </g>
        )}
        {k >= 4 && <CastCard x={218} y={S1_GROUND - 84} text="winner takes the jilapi" tone="amber" />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Fahim, Nasib, or both. The jilapi slides to whoever
//     the reader backs, and nothing is marked: the Finale settles it.

const BET = ["Fahim is right", "Nasib is right", "both are right"];
const BET_X = [44, 196, 120];

export function JilapiBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);
  const [jx] = useTween([bet === null ? 120 : BET_X[bet]], 900);

  const seal = () => {
    setSealed(true);
    pass("Bet sealed. Jilapi on the line.");
  };

  return (
    <>
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
        <div className="rounded-xl border-2 border-cat-blue/30 bg-cat-blue/5 px-2.5 py-1.5">
          <div className="text-xs font-semibold text-cat-blue">Fahim</div>
          <div className="text-[0.8rem] leading-snug">“Let me rewrite the same two columns, and rent needs just one number.”</div>
        </div>
        <div className="rounded-xl border-2 border-cat-coral/30 bg-cat-coral/5 px-2.5 py-1.5">
          <div className="text-xs font-semibold text-cat-coral">Nasib</div>
          <div className="text-[0.8rem] leading-snug">“No new information goes in. So nothing new can come out.”</div>
        </div>
      </div>
      <svg viewBox="0 0 240 52" className="mx-auto mt-1 block h-auto w-full max-w-[15rem]" aria-label="the cone of jilapi, sliding to whoever you back">
        <path d="M20 38H220" stroke="#a8a29e" strokeWidth={1.5} />
        <text x={44} y={50} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-cat-blue">
          Fahim
        </text>
        <text x={196} y={50} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-cat-coral">
          Nasib
        </text>
        <text x={120} y={50} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-[#5a6b7d]">
          both
        </text>
        <Jilapi x={jx} y={36} s={1.05} />
      </svg>
      <div className="mt-1 text-sm font-medium text-muted">Who’s right?</div>
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
            Seal the bet
          </button>
        </div>
      ) : null}
      {sealed ? (
        <div className={`${FADE} mt-2 text-center text-[0.9rem] leading-snug text-muted`}>
          Sealed. We’ll open it on the last screen, once Chacha has his rent.
        </div>
      ) : null}
      <Task done={sealed}>Back Fahim, Nasib or both, and seal it. No marking until the end.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: the khata's 8 flats land
//      on the (bed, bath) sheet, then the rooftop flat, with a "?" for a rent.

const KF = makeFrame(-0.4, 5.6, -0.4, 3.6, 38, 16);

export function EightFlats() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const SAY = [
    "Chacha's khata as a picture: beds along, baths up.",
    "His 8 flats, each at its (bed, bath). The number is the rent, in thousand taka.",
    "And the rooftop flat, (4, 2). Its rent is still a question mark.",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <Plane f={KF} ticks={1} label="Chacha's 8 flats on the bed and bath sheet, and the rooftop flat at (4, 2)" className="my-0! max-w-[13rem]">
        <AxisName x={KF.sx(5.5)} y={KF.sy(0) - 5} anchor="end">
          bed
        </AxisName>
        <AxisName x={KF.sx(0) + 5} y={KF.sy(3.45)} anchor="start">
          bath
        </AxisName>
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
    if (!both && t("bed") && t("bath")) pass("Rent climbs on the slant, not on one axis.");
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
        <AxisName x={KF.sx(5.5)} y={KF.sy(0) - 5} anchor="end">
          bed
        </AxisName>
        <AxisName x={KF.sx(0) + 5} y={KF.sy(3.45)} anchor="start">
          bath
        </AxisName>
        {FLATS.map((fl, i) => (
          <FlatDot key={i} f={KF} at={[fl.bed, fl.bath]} rent={fl.rent} ring={mode ? (fits(guess(fl), fl.rent) ? "fit" : "miss") : null} />
        ))}
      </Plane>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button type="button" onClick={() => pick("bed")} className={`${pill(mode === "bed")} font-sans`}>
          by bed alone
        </button>
        <button type="button" onClick={() => pick("bath")} className={`${pill(mode === "bath")} font-sans`}>
          by bath alone
        </button>
      </div>
      {mode ? (
        <div className="mt-2 flex items-center justify-center gap-2">
          <Stepper value={knob} onChange={turn} min={3} max={12} label={`thousand taka per ${mode}`} />
          <span className="text-sm text-muted">thousand taka a {mode}</span>
        </div>
      ) : null}
      <div className="mt-1.5 min-h-6 text-center text-[0.9rem]">
        {mode ? (
          <span key={`${mode}${knob}`} className={FADE}>
            <b className={`font-mono ${fit >= 8 ? "text-accent-text" : "text-danger"}`}>{fit}</b> of 8 flats fit, within 1000 taka.
          </span>
        ) : (
          <span className="text-muted">Pick a column to price by.</span>
        )}
      </div>
      <Ticks
        items={[
          ["bed alone", tried("bed")],
          ["bath alone", tried("bath")],
        ]}
      />
      <Task done={both}>Price by bed alone, then by bath alone. Turn each knob to three prices and count the green rings.</Task>
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
    "The 8 flats again, coloured by rent.",
    "Three flats with 3 beds: 17, 20 and 25. One column, three rents.",
    "Flats on the same slanted line cost about the same.",
    "So the rent climbs this way: more beds and more baths together.",
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
// 3 · Fahim's two buttons. Size (1, 1) and imbalance (1, −1). Draw each
//     button's line: two lines, so a basis (5.3). Then 4.2's box:
//     1·1 + 1·(−1) = 0, and the right-angle mark lands.

const NA_F = makeFrame(-1.5, 2.5, -1.5, 2.5, 34, 12);
const SIZE: XY = [1, 1];
const IMB: XY = [1, -1];
const BOX_ROWS = [
  ["bed slots", "1 × 1 = 1"],
  ["bath slots", "1 × (−1) = −1"],
  ["the box", "1 + (−1) = 0"],
];

/** the little square at the origin where size and imbalance meet */
function RightMark({ f, s = 0.22 }: { f: Frame; s?: number }) {
  const p = (x: number, y: number) => `${f.sx(x)} ${f.sy(y)}`;
  return <path d={`M${p(s, s)}L${p(2 * s, 0)}L${p(s, -s)}`} fill="none" strokeWidth={1.6} className={`${POP} stroke-[#0f1b2d]`} />;
}

export function NewAxes() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const p = usePlay(900);
  const rows = stage >= 2 ? 3 : p.k;

  const box = () => {
    if (p.running) return;
    p.play(3, () => {
      setStage(2);
      pass("Size and imbalance meet at a right angle.");
    });
  };
  const line = (v: XY) => `M${NA_F.sx(-1.45 * v[0])} ${NA_F.sy(-1.45 * v[1])}L${NA_F.sx(2.45 * v[0])} ${NA_F.sy(2.45 * v[1])}`;

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[10rem] shrink-0">
          <Plane f={NA_F} label="Fahim's two buttons: size (1, 1) and imbalance (1, −1)" className="my-0! max-w-none">
            {stage >= 1 && (
              <Clipped f={NA_F} name="na">
                <Draw d={line(SIZE)} strokeWidth={1.2} className="stroke-cat-blue/50" />
                <Draw d={line(IMB)} delay={300} strokeWidth={1.2} className="stroke-cat-coral/50" />
              </Clipped>
            )}
            <Arrow f={NA_F} from={O} to={SIZE} tone="blue" />
            <Arrow f={NA_F} from={O} to={IMB} tone="coral" />
            <Label f={NA_F} at={SIZE} dx={-4} dy={-7} size={9} className="fill-cat-blue">
              size
            </Label>
            <Label f={NA_F} at={IMB} dx={-2} dy={14} size={9} className="fill-cat-coral">
              imbalance
            </Label>
            {rows >= 3 && <RightMark f={NA_F} />}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 text-[0.8rem] leading-snug">
          <div className="font-mono">
            <span className="text-cat-blue">size = (1, 1)</span>
          </div>
          <div className="text-muted">one more bed and one more bath</div>
          <div className="mt-1 font-mono">
            <span className="text-cat-coral">imbalance = (1, −1)</span>
          </div>
          <div className="text-muted">one more bed, one less bath</div>
        </div>
      </div>
      {stage >= 1 ? (
        <div className={`${FADE} mt-2 text-center text-[0.85rem] leading-snug`}>
          Two different lines, crossing only at 0. Two directions on a two-slot sheet: that’s a basis, like 5.3’s.
        </div>
      ) : null}
      {stage >= 1 && rows > 0 ? (
        <div className="mx-auto mt-2 grid max-w-[16rem] grid-cols-[5.5rem_1fr] gap-x-2 gap-y-0.5 text-[0.85rem]">
          {BOX_ROWS.slice(0, rows).map(([a, b], i) => (
            <div key={a} className={`${FADE} contents`}>
              <span className="text-muted">{a}</span>
              <span className={`font-mono ${i === 2 ? "font-bold text-accent-text" : ""}`}>{b}</span>
            </div>
          ))}
        </div>
      ) : null}
      {stage === 0 ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={() => setStage(1)} className={primaryBtn}>
            Draw each button’s line
          </button>
        </div>
      ) : stage === 1 && !p.running && rows === 0 ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={box} className={primaryBtn}>
            Put them in 4.2’s box
          </button>
        </div>
      ) : null}
      <Task done={stage >= 2}>Draw each button’s line, then put the two buttons in 4.2’s box.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: what each button does to
//      a flat. Size adds a bed and a bath; imbalance turns a bath into a bed.

const TB_STATES: [number, number][] = [
  [2, 1],
  [3, 2],
  [4, 1],
  [4, 1],
];

export function TwoButtonsDo() {
  const s = useScene(3, [700, 2200, 2400]);
  const k = s.k;
  const [bed, bath] = TB_STATES[k];
  const SAY = [
    "A flat with 2 beds and 1 bath: (2, 1).",
    "Press size: one more bed and one more bath. The flat just grows, (3, 2).",
    "Press imbalance: one more bed, one less bath. Same 5 rooms, shared differently: (4, 1).",
    "Growing and re-sharing don't get in each other's way. That's the right angle.",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[17rem] items-center gap-3">
        <div className="grid flex-1 gap-1.5">
          {[
            { n: bed, name: "bed", tone: "bg-cat-blue/80" },
            { n: bath, name: "bath", tone: "bg-cat-teal/80" },
          ].map((r) => (
            <div key={r.name} className="flex items-center gap-1">
              <span className="w-8 text-xs font-semibold text-muted">{r.name}</span>
              {Array.from({ length: r.n }, (_, i) => (
                <span key={i} className={`${POP} h-6 w-6 rounded ${r.tone}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="w-[4.5rem] shrink-0 text-center">
          {k >= 3 ? (
            <svg viewBox="0 0 60 60" className={`${FADE} mx-auto h-auto w-14`} aria-label="size and imbalance at a right angle">
              <path d="M10 30L40 5" strokeWidth={2.4} className="stroke-cat-blue" />
              <path d="M10 30L40 55" strokeWidth={2.4} className="stroke-cat-coral" />
              <path d="M17 24.2L22.8 31L17 35.8" fill="none" strokeWidth={1.4} className="stroke-[#0f1b2d]" />
            </svg>
          ) : (
            <span key={k} className={`${POP} inline-block rounded-lg border-2 border-[#b45309] px-1.5 py-0.5 font-mono text-sm font-bold text-[#b45309]`}>
              {tup([bed, bath])}
            </span>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · Flat (3, 2) in the new basis, by hand. beds = s + m, baths = s − m.
//     Add the lines (m cancels), halve, put s back, then walk the card:
//     2.5 size steps and 0.5 of imbalance land on the flat.

const HB_F = makeFrame(-0.5, 3.6, -0.6, 2.9, 36, 12);
const HB_BTN = ["Add the two lines", "Halve both sides", "Put s back in the bed line", "Walk the card"];

export function HouseInNewBasis() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const go = () => {
    const next = stage + 1;
    setStage(next);
    if (next === 4) pass("Same flat, new card: (2.5, 0.5).");
  };
  const cut = stage >= 1 ? "text-danger line-through decoration-2" : "";

  return (
    <>
      <div className="text-center text-[0.85rem] leading-snug text-muted">
        Each size step adds a bed and a bath. Each imbalance step adds a bed and takes a bath away. Say <b className="font-mono">s</b> size steps and <b className="font-mono">m</b> imbalance steps:
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={HB_F} ticks={1} label="flat (3, 2), and the card walked as size and imbalance steps" className="my-0! max-w-none">
            <Star f={HB_F} at={[3, 2]} done={stage >= 4} />
            {stage >= 4 && <Arrow key="s" f={HB_F} from={O} to={[2.5, 2.5]} tone="blue" draw />}
            {stage >= 4 && <Arrow key="m" f={HB_F} from={[2.5, 2.5]} to={[3, 2]} tone="coral" draw delay={800} />}
          </Plane>
        </div>
        <div className="min-w-0 flex-1 font-mono text-[0.9rem] leading-relaxed">
          <div>
            <span className="font-sans text-xs text-muted">beds </span>3 = s <span className={cut}>+ m</span>
          </div>
          <div>
            <span className="font-sans text-xs text-muted">baths </span>2 = s <span className={cut}>− m</span>
          </div>
          {stage >= 1 && (
            <div key="add" className={`${POP} border-t border-border`}>
              5 = 2s{stage >= 2 ? <span className={FADE}>, s = 2.5</span> : null}
            </div>
          )}
          {stage >= 3 && (
            <div key="put" className={POP}>
              3 = 2.5 + m, m = 0.5
            </div>
          )}
        </div>
      </div>
      {stage >= 4 ? (
        <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-3 py-1.5 text-center text-[0.85rem] leading-snug text-accent-text`}>
          2.5 size steps reach (2.5, 2.5). Half an imbalance step lands on (3, 2).
        </div>
      ) : (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={go} className={primaryBtn}>
            {HB_BTN[stage]}
          </button>
        </div>
      )}
      <Task done={stage >= 4}>Solve the two lines one move at a time, then walk the card to check it.</Task>
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
    "On the bed and bath grid, the flat's card is (3, 2).",
    "Lay Fahim's grid over it: size lines one way, imbalance lines the other.",
    "Same dot, new card: 2.5 along size, 0.5 along imbalance.",
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
    pass("The new numbers tell the flat's story.");
  };
  const SAY = [
    "Tap 2.5 first.",
    "2.5 size steps. Each step is one bed and one bath: two rooms. So 2.5 steps make 5 rooms. Now tap 0.5.",
    "Half a step of imbalance: half a bed more, half a bath less. So there's 1 more bed than bath: 3 beds, 2 baths. Flat (3, 2) again.",
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
      <Task done={read >= 2}>Tap 2.5, then 0.5, and watch what each one builds.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: Fahim's buttons are
//      about 1.41 long. Shrink both to 1 (the unit ring, 3.6) and the card
//      (2.5, 0.5) becomes (3.54, 0.71).

const SO_F = makeFrame(-0.4, 1.7, -1.6, 1.6, 44, 10);

export function ShrinkToOne() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const [len] = useTween([k >= 1 ? 1 / R2 : 1], 1200);
  const SAY = [
    "Fahim's buttons are two-room steps, each about 1.41 long.",
    "Divide each by 1.41: both land on the ring of length 1.",
    "Shorter steps, so more of them: the card becomes (3.54, 0.71).",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[15rem] items-center justify-center gap-3">
        <div className="w-[6rem] shrink-0">
          <Plane f={SO_F} label="the size and imbalance buttons shrinking to length 1" className="my-0! max-w-none">
            <circle cx={SO_F.sx(0)} cy={SO_F.sy(0)} r={SO_F.u} fill="none" strokeWidth={1.2} strokeDasharray="3 3" className="stroke-[#5a6b7d]" />
            <Arrow f={SO_F} from={O} to={[len, len]} tone="blue" w={2.4} />
            <Arrow f={SO_F} from={O} to={[len, -len]} tone="coral" w={2.4} />
            <Label f={SO_F} at={[len, len]} dx={4} dy={-4} anchor="start" size={9} className="fill-cat-blue font-mono">
              {k >= 1 ? "1" : "1.41"}
            </Label>
          </Plane>
        </div>
        <span key={k >= 2 ? "b" : "a"} className={`${POP} inline-block rounded-lg border-2 border-cat-violet px-1.5 py-0.5 font-mono text-sm font-bold whitespace-nowrap text-cat-violet`}>
          {k >= 2 ? "(3.54, 0.71)" : "(2.5, 0.5)"}
        </span>
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
      pass("Same facts, new grid: rent in one number.");
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
          <>
            <AxisName x={OR_F.sx(5.7)} y={OR_F.sy(0) - 5} anchor="end">
              bed
            </AxisName>
            <AxisName x={OR_F.sx(0) + 5} y={OR_F.sy(3.45)} anchor="start">
              bath
            </AxisName>
          </>
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
            Turn the sheet to Fahim’s grid
          </button>
        </div>
      ) : (
        <div className={FADE}>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Stepper value={knob} onChange={change} min={4} max={12} disabled={done} label="thousand taka per size step" />
            <span className="text-sm text-muted">thousand taka a size step</span>
          </div>
          <div className="mt-1.5 min-h-6 text-center text-[0.9rem]">
            <span key={knob} className={FADE}>
              <b className={`font-mono ${fit === 8 ? "text-accent-text" : "text-danger"}`}>{fit}</b> of 8 flats fit, within 1000 taka.
            </span>
          </div>
          {done ? (
            <div className={`${FADE} mx-auto mt-1 max-w-sm text-center text-[0.85rem] leading-snug text-muted`}>
              Look down each stripe: flats of one size cost about the same, whatever their imbalance.
            </div>
          ) : null}
        </div>
      )}
      <Task done={done}>Turn the sheet, then find the one price per size step that fits all 8 flats.</Task>
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
    "The 8 flats on Fahim's grid: size along, imbalance down.",
    "Drop the imbalance number. Each flat slides onto the size line, its shadow.",
    "The rents still climb in order along one line. One number kept, very little lost.",
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
// 7a · A story scene for screen 7's setup, no task: Nasib's objection. If
//      Fahim can pick any grid, which numbers are real?

export function NasibDoubts({}: Story) {
  const s = useScene(2, [700, 2600]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="Nasib asks which grid's numbers are the real ones">
        <RoofSet />
        <CastPerson who="fahim" x={112} y={S1_GROUND} facing={1} mood={k >= 2 ? "puzzled" : "happy"} />
        <NameTag x={112} y={S1_GROUND + 13} name="Fahim" />
        <CastPerson who="nasib" x={206} y={S1_GROUND} facing={-1} arm={k >= 1 ? "point" : "down"} mood={k >= 1 ? "smug" : "plain"} />
        <NameTag x={206} y={S1_GROUND + 13} name="Nasib" />
        {k >= 1 && <Bubble x={206} y={S1_GROUND - 68} side="mid" lines={["Pick any grid you like,", "get any numbers you like."]} />}
        {k >= 2 && <Bubble x={112} y={S1_GROUND - 68} side="left" tone="think" lines={["So which numbers", "are the real ones?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · 2.3's word map, and a square grid turned under it. The reader turns it
//     15° at a time: every slot number glides, the king–queen distance and
//     the cosine of man→king with woman→queen never move.

const SG_F = makeFrame(-4, 4, -3.4, 3.4, 26, 10);
const WORDS: { w: string; at: XY }[] = [
  { w: "man", at: [-2.9, -2.1] },
  { w: "woman", at: [1.1, -2.5] },
  { w: "king", at: [-1.9, 2.4] },
  { w: "queen", at: [2.4, 2.3] },
];
const W = (w: string) => WORDS.find((x) => x.w === w)!.at;
const d2 = (p: XY, q: XY) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const cosOf = (u: XY, v: XY) => (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
const KQ = d2(W("king"), W("queen"));
const MK: XY = [W("king")[0] - W("man")[0], W("king")[1] - W("man")[1]];
const WQ: XY = [W("queen")[0] - W("woman")[0], W("queen")[1] - W("woman")[1]];
const COS = cosOf(MK, WQ);
/** a word's slot numbers on a grid turned by `deg` */
const slots = (p: XY, deg: number): XY => {
  const a = (deg * Math.PI) / 180;
  return [p[0] * Math.cos(a) + p[1] * Math.sin(a), -p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};
const f1 = (n: number) => sg(Math.round(n * 10) / 10);
const pair1 = (v: XY) => `(${f1(v[0])}, ${f1(v[1])})`;

/**
 * A square grid turned by `deg` about the centre, clipped to the sheet, with
 * its two axes named near the middle (the words sit far out, so they never
 * clash). `spin` turns it further with a CSS transition, for a watch-only figure.
 */
function TurnedGrid({ f, deg, name, spin = 0 }: { f: Frame; deg: number; name: string; spin?: number }) {
  const a = (deg * Math.PI) / 180;
  const e1: XY = [Math.cos(a), Math.sin(a)];
  const e2: XY = [-Math.sin(a), Math.cos(a)];
  const at = (i: number, j: number) => `${f.sx(i * e1[0] + j * e2[0])} ${f.sy(i * e1[1] + j * e2[1])}`;
  let d = "";
  for (let i = -6; i <= 6; i++) d += `M${at(i, -7)}L${at(i, 7)}M${at(-7, i)}L${at(7, i)}`;
  const turning = {
    style: { transform: `rotate(${-spin}deg)`, transformOrigin: `${f.sx(0)}px ${f.sy(0)}px` },
    className: "transition-transform duration-1000 ease-in-out motion-reduce:transition-none",
  };
  return (
    <>
      <Clipped f={f} name={name}>
        <g {...turning}>
          <path d={d} strokeWidth={0.6} className="pointer-events-none fill-none stroke-cat-blue/30" />
          <path d={`M${at(-7, 0)}L${at(7, 0)}M${at(0, -7)}L${at(0, 7)}`} strokeWidth={1.3} className="pointer-events-none fill-none stroke-[#0f1b2d]/50" />
        </g>
      </Clipped>
      <g {...turning}>
        <text x={f.sx(1.5 * e1[0] + 0.3 * e2[0])} y={f.sy(1.5 * e1[1] + 0.3 * e2[1])} textAnchor="middle" fontSize={7.5} fontWeight={700} className="pointer-events-none fill-[#5a6b7d]">
          slot 1
        </text>
        <text x={f.sx(1.5 * e2[0] - 0.35 * e1[0])} y={f.sy(1.5 * e2[1] - 0.35 * e1[1])} textAnchor="middle" fontSize={7.5} fontWeight={700} className="pointer-events-none fill-[#5a6b7d]">
          slot 2
        </text>
      </g>
    </>
  );
}

function WordDots({ f }: { f: Frame }) {
  return (
    <>
      {WORDS.map((wd) => (
        <g key={wd.w} className="pointer-events-none">
          <circle cx={f.sx(wd.at[0])} cy={f.sy(wd.at[1])} r={4} className="fill-cat-violet" />
          <text x={f.sx(wd.at[0])} y={f.sy(wd.at[1]) - 7} textAnchor="middle" fontSize={10} fontWeight={700} className="fill-[#0f1b2d]">
            {wd.w}
          </text>
        </g>
      ))}
    </>
  );
}

export function SpinTheGrid() {
  const pass = useGate();
  const [deg, setDeg] = useSeed("deg", 0);
  const [seen, setSeen] = useSeed<number[]>("seen", [0]);
  const [now] = useTween([deg], 700);
  const enough = seen.length >= 4;

  const spin = (d: number) => {
    const next = clamp(deg + d, -90, 90);
    setDeg(next);
    if (seen.includes(next)) return;
    const all = [...seen, next];
    setSeen(all);
    if (all.length === 4) pass("New grid, new numbers, same distances.");
  };

  return (
    <>
      <Plane f={SG_F} grid={0} axes={false} label="2.3's word map with a square grid turned under it" className="my-0! max-w-[15rem]">
        <TurnedGrid f={SG_F} deg={now} name="sg" />
        <WordDots f={SG_F} />
      </Plane>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button type="button" onClick={() => spin(-15)} disabled={deg <= -90} className={`${pill(false)} font-sans`}>
          turn −15°
        </button>
        <span className="w-12 text-center font-mono text-sm tabular-nums">{sg(deg)}°</span>
        <button type="button" onClick={() => spin(15)} disabled={deg >= 90} className={`${pill(false)} font-sans`}>
          turn +15°
        </button>
      </div>
      <div className="mx-auto mt-2 grid max-w-[19rem] grid-cols-2 gap-1.5 text-[0.8rem]">
        <div className="rounded-xl border border-cat-coral/40 bg-cat-coral/5 px-2 py-1">
          <div className="text-xs text-muted">king’s numbers</div>
          <b className="font-mono tabular-nums">{pair1(slots(W("king"), now))}</b>
        </div>
        <div className="rounded-xl border border-cat-coral/40 bg-cat-coral/5 px-2 py-1">
          <div className="text-xs text-muted">queen’s numbers</div>
          <b className="font-mono tabular-nums">{pair1(slots(W("queen"), now))}</b>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent/5 px-2 py-1">
          <div className="text-xs text-muted">king to queen</div>
          <b className="font-mono">{KQ.toFixed(2)}</b>
        </div>
        <div className="rounded-xl border border-accent/40 bg-accent/5 px-2 py-1">
          <div className="text-xs leading-tight text-muted">cosine, man→king and woman→queen</div>
          <b className="font-mono">{COS.toFixed(2)}</b>
        </div>
      </div>
      <Task done={enough}>Turn the grid three times. Watch which numbers move, and which never do.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: the man→king and
//      woman→queen arrows on the map. The grid turns, every slot number
//      changes, and the two arrows still match: 2.3's sum survives.

const SA_ANG = [20, 20, 20, -40];

export function SameArrows() {
  const s = useScene(3, [700, 2200, 2200]);
  const k = s.k;
  const deg = SA_ANG[k];
  const SAY = [
    `Some grid the model happened to land in. King reads ${pair1(slots(W("king"), 20))}.`,
    "The man-to-king arrow and the woman-to-queen arrow: the same shape.",
    "Now turn the grid. Every slot number changes.",
    `King now reads ${pair1(slots(W("king"), -40))}. The arrows still match: king − man + woman still lands on queen.`,
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <Plane f={SG_F} grid={0} axes={false} label="the grid turns under the word map; the two arrows stay the same" className="my-0! max-w-[11.5rem]">
        <TurnedGrid f={SG_F} deg={20} spin={deg - 20} name="sa" />
        {k >= 1 && <Arrow f={SG_F} from={W("man")} to={W("king")} tone="teal" w={2.2} draw />}
        {k >= 1 && <Arrow f={SG_F} from={W("woman")} to={W("queen")} tone="teal" w={2.2} draw delay={300} />}
        <WordDots f={SG_F} />
      </Plane>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn. The rooftop flat, (4, 2). Dial a card, walk it; a wrong card
//     walks to where it really lands. Then price it: 8000 × 3 = 24000. The
//     wrong prices are the two real slips (8000 × beds, 8000 × rooms).

const YH_F = makeFrame(-1.3, 6.3, -2.3, 4.3, 24, 10);
const YH_PRICES = [32000, 24000, 48000];
const YH_RIGHT = 1;
const YH_NOPE: Record<number, string> = {
  0: "That's 8000 × 4, the bed count. The rule counts size steps.",
  2: "That's 8000 × 6 rooms. But one size step is two rooms.",
};

export function YourHouse() {
  const pass = useGate();
  const [s, setS] = useSeed("s", 1);
  const [m, setM] = useSeed("m", 0);
  const [walked, setWalked] = useSeed<XY | null>("walked", null);
  const [walks, setWalks] = useState(0);
  const [price, setPrice] = useSeed<number | null>("price", null);
  const [miss, setMiss] = useState(0);
  const land = (c: XY): XY => [c[0] + c[1], c[0] - c[1]];
  const cardOk = walked !== null && same(land(walked), ROOF);
  const priced = price === YH_RIGHT;

  const walk = () => {
    setWalked([s, m]);
    setWalks((w) => w + 1);
  };
  const choose = (i: number) => {
    if (priced) return;
    setPrice(i);
    if (i === YH_RIGHT) pass("Card (3, 1): 3 size steps, 24000 taka.");
    else setMiss((x) => x + 1);
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
          <div className="font-semibold">Rooftop flat</div>
          <div className="font-mono">4 bed, 2 bath</div>
          {cardOk ? (
            <div className={`${FADE} mt-1 text-accent-text`}>
              Card <b className="font-mono">(3, 1)</b>: 3 size steps, so 6 rooms. 1 imbalance step, so 2 more beds than baths.
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
              <Stepper value={s} onChange={setS} min={0} max={4} label="size steps" />
              <span className="text-cat-blue">size</span>
            </span>
            <span className="grid justify-items-center gap-0.5">
              <Stepper value={m} onChange={setM} min={-2} max={2} label="imbalance steps" />
              <span className="text-cat-coral">imbalance</span>
            </span>
          </div>
          <div className="mt-2 flex justify-center">
            <button type="button" onClick={walk} className={primaryBtn}>
              Walk the card
            </button>
          </div>
          {walked && end ? (
            <Nope key={walks}>
              Card {tup(walked)} lands at {tup(end)}. The rooftop flat is (4, 2).
            </Nope>
          ) : null}
        </>
      ) : (
        <div className={FADE}>
          <div className="mt-2 text-center text-sm font-medium text-muted">Now the rent, with 8000 taka a size step:</div>
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
          {price !== null && !priced ? <Nope key={miss}>{YH_NOPE[price]}</Nope> : null}
          {priced ? (
            <div className={`${POP} mx-auto mt-2 w-fit rounded-lg border-2 border-[#b45309] bg-[#fbf6e9] px-3 py-1 font-mono text-sm font-bold text-[#b45309]`}>
              rooftop flat: 24000 taka
            </div>
          ) : null}
        </div>
      )}
      <Task done={priced}>Find the rooftop flat’s card and walk it. Then pick its rent.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the khata's flats on the
//      size line, the rooftop flat landing at 3 steps, right beside flat
//      (3, 3) at 25000. Its imbalance hardly mattered.

export function SameSizeRow() {
  const s = useScene(2, [700, 2200]);
  const k = s.k;
  const sx = (v: number) => 16 + v * 58;
  const SAY = [
    "The khata's flats by size alone.",
    "The rooftop flat lands at 3 size steps: 24000.",
    "Right beside flat (3, 3), same size, 25000. The imbalance hardly mattered.",
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
              rooftop: 24
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it: Nasib's card (2, 1) on Fahim's grid. Tap the flat's spot on the
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
      if (same(at, TCB_AT)) pass("Every card converts back. No new facts.");
    });
  };

  return (
    <>
      <div className="mx-auto w-fit rounded-lg border-2 border-cat-violet px-3 py-1 text-center">
        <div className="text-xs text-muted">Nasib’s card on Fahim’s grid</div>
        <div className="font-mono font-bold text-cat-violet">size 2, imbalance 1</div>
      </div>
      <Plane f={TCB_F} ticks={1} drag={{ down }} label="tap the spot on the bed and bath sheet where the card (2, 1) really is" className="my-2! max-w-[16rem]">
        <AxisName x={TCB_F.sx(5.4)} y={TCB_F.sy(0) - 5} anchor="end">
          bed
        </AxisName>
        <AxisName x={TCB_F.sx(0) + 5} y={TCB_F.sy(3.45)} anchor="start">
          bath
        </AxisName>
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
            ? "That reads the card as beds and baths. Watch it walk: 2 size steps reach (2, 2), then 1 imbalance step lands on (3, 1)."
            : `The card walks to (3, 1), not ${tup(drop)}. Tap where it landed.`}
        </Nope>
      ) : null}
      {right && step >= 2 ? (
        <div className={`${FADE} mx-auto mt-1 max-w-sm rounded-2xl bg-accent/10 px-3 py-1.5 text-center text-[0.85rem] leading-snug text-accent-text`}>
          Card (2, 1) is flat (3, 1): 3 beds, 1 bath.
        </div>
      ) : null}
      <Task done={right && step >= 2}>Tap the spot where Nasib’s card really is, in beds and baths.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for the exercise's explanation, no task: two sums one way,
//      two sums back. Nothing lost, nothing added.

export function BackAndForth() {
  const s = useScene(3, [700, 1800, 1800]);
  const k = s.k;
  const SAY = [
    "Nasib's card, (2, 1): size 2, imbalance 1.",
    "Beds: size plus imbalance, 2 + 1 = 3. Baths: size minus imbalance, 2 − 1 = 1.",
    "And back again: size = (3 + 1) ÷ 2 = 2, imbalance = (3 − 1) ÷ 2 = 1.",
    "Two sums each way. Nothing lost, nothing added.",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[16rem] items-center justify-center gap-2">
        <div className="rounded-lg border-2 border-cat-violet px-2 py-1 text-center">
          <div className="text-[0.65rem] text-muted">size, imbalance</div>
          <div className="font-mono font-bold text-cat-violet">(2, 1)</div>
        </div>
        <div className="grid w-16 justify-items-center gap-0.5 font-mono text-xs">
          {k >= 1 && k < 3 && (
            <span key="to" className={`${FADE} ${k === 1 ? "text-foreground" : "text-muted"}`}>
              — sums →
            </span>
          )}
          {k >= 2 && (
            <span key="back" className={`${FADE} ${k === 2 ? "text-foreground" : "text-muted"}`}>
              ← sums —
            </span>
          )}
        </div>
        <div className="rounded-lg border-2 border-[#b45309] px-2 py-1 text-center">
          <div className="text-[0.65rem] text-muted">bed, bath</div>
          <div className="font-mono font-bold text-[#b45309]">{k >= 1 ? <span className={POP}>(3, 1)</span> : "(?, ?)"}</div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10a · A story scene for the finale's setup, no task: night, the new
//       flat's windows light up, and the jilapi comes apart in two.

function S10House({ lit }: { lit: number }) {
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
        <S10House lit={k >= 1 ? 6 : 0} />
        <CastPerson who="fahim" x={k >= 3 ? 176 : 196} y={S1_GROUND} facing={1} arm={k >= 3 ? "hold" : "down"} mood={k >= 2 ? "happy" : "plain"} walking={k === 3} ms={900} />
        <NameTag x={k >= 3 ? 176 : 196} y={S1_GROUND + 13} name="Fahim" />
        <CastPerson who="nasib" x={k >= 3 ? 268 : 248} y={S1_GROUND} facing={-1} arm={k >= 2 ? "hold" : "down"} mood={k >= 2 ? "happy" : "plain"} walking={k === 3} ms={900} />
        <NameTag x={k >= 3 ? 268 : 248} y={S1_GROUND + 13} name="Nasib" />
        {k === 2 && <Jilapi x={258} y={S1_GROUND - 36} s={0.9} />}
        {k >= 3 && (
          <>
            <g className={POP}>
              <Jilapi x={190} y={S1_GROUND - 28} s={0.8} half />
            </g>
            <g className={POP}>
              <Jilapi x={254} y={S1_GROUND - 28} s={0.8} half />
            </g>
            <Bubble x={222} y={S1_GROUND - 72} side="mid" lines={["Half each.", "We were both right."]} />
          </>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10 · The finale. Open the sealed bet: Nasib's half (the card converted
//      back), Fahim's half (8000 × size fit all 8), and the jilapi splits.
//      Then the five things to carry forward, one card per tap.

const FIVE = [
  ["Span", "Everything your buttons can reach. It always holds 0, and it can be smaller than you think."],
  ["Independent", "No button is extra. The only way back to 0 is to press nothing at all."],
  ["Basis", "Enough buttons to reach everywhere, none extra. Every basis has the same count: the dimension."],
  ["Coordinates", "Numbers belong to a basis, not to the arrow. The school was (2, 3) and (−1, 3)."],
  ["A good basis", "It makes the data say something: (3, 2) became (2.5, 0.5), and rent took one number."],
];

export function BetSettled() {
  const pass = useGate();
  const [open, setOpen] = useSeed("open", false);
  const [seen, setSeen] = useSeed<number[]>("seen", []);
  const [at, setAt] = useSeed<number | null>("at", null);
  const p = usePlay(900);
  const shown = open ? (p.running ? p.k : 3) : 0;
  const [gap] = useTween([shown >= 3 ? 1 : 0], 900);

  const read = (i: number) => {
    setAt(i);
    if (seen.includes(i)) return;
    const next = [...seen, i];
    setSeen(next);
    if (next.length === 5) pass("Same facts, better grid: both were right.");
  };
  const unseal = () => {
    setOpen(true);
    p.play(3);
  };

  return (
    <>
      {!open ? (
        <div className="flex justify-center">
          <button type="button" onClick={unseal} className={primaryBtn}>
            Open the sealed bet
          </button>
        </div>
      ) : (
        <div className="mx-auto grid max-w-sm gap-1.5">
          {shown >= 1 ? (
            <div className={`${FADE} rounded-xl border-2 border-accent/50 bg-accent/5 px-2.5 py-1 text-[0.8rem] leading-snug`}>
              <b className="text-cat-coral">Nasib</b> ✓ No new facts: card (2, 1) turned straight back into flat (3, 1).
            </div>
          ) : null}
          {shown >= 2 ? (
            <div className={`${FADE} rounded-xl border-2 border-accent/50 bg-accent/5 px-2.5 py-1 text-[0.8rem] leading-snug`}>
              <b className="text-cat-blue">Fahim</b> ✓ One number tells the rent: 8000 a size step fit all 8 flats.
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
      {shown >= 3 ? (
        <div className={FADE}>
          <div className="text-center text-sm font-semibold">Both were right. The jilapi gets split.</div>
          <div className="mt-2 text-center text-xs text-muted">Five things to carry forward. Tap each.</div>
          <div className="mt-1 flex justify-center gap-1.5">
            {FIVE.map(([name], i) => (
              <button key={name} type="button" onClick={() => read(i)} className={`${pill(at === i)} size-9 px-0! ${seen.includes(i) && at !== i ? "border-accent/60 text-accent-text" : ""}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mx-auto mt-2 min-h-16 max-w-sm rounded-2xl border border-border px-3 py-1.5 text-center text-[0.85rem] leading-snug">
            {at === null ? (
              <span className="text-muted">Start with 1.</span>
            ) : (
              <span key={at} className={FADE}>
                <b>{FIVE[at][0]}.</b> {FIVE[at][1]}
              </span>
            )}
          </div>
        </div>
      ) : null}
      <Task done={seen.length === 5}>Open the bet, then tap all five things to carry forward.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for the finale's explanation, no task: the PCA sentence,
//       built one phrase at a time, each tagged with where it was learned.

const PCA = [
  ["PCA finds, from the data itself,", ""],
  ["a basis", "5.3"],
  ["at right angles, each step 1 long,", "4.2 · 3.6"],
  ["whose first direction spreads the data the most, then the next,", "4.5"],
  ["and keeps only the first few.", "today"],
];

export function PcaWords() {
  const s = useScene(4, [700, 1400, 1400, 1800, 1800]);
  const k = s.k;
  const SAY = [
    "The big idea waiting at the end of this course, in one line.",
    "A basis: enough buttons, none extra.",
    "Square and 1 long: orthonormal, so every number is on one scale.",
    "The direction the data spreads most goes first, like the rent's slant.",
    "Keep the first few, drop the rest, like dropping imbalance. Every word is now yours.",
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[17rem] flex-wrap items-baseline justify-center gap-x-1.5 gap-y-1 text-[0.9rem] leading-snug">
        {PCA.slice(0, k + 1).map(([words, tag], i) => (
          <span key={i} className={`${FADE} ${i === k && i > 0 ? "font-semibold" : ""}`}>
            {words}
            {tag ? <sup className="ml-0.5 rounded bg-cat-violet/10 px-1 text-[0.6rem] font-semibold text-cat-violet">{tag}</sup> : null}
          </span>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  RooftopBet: { start: { k: 0 }, chacha: { k: 1 }, fahim: { k: 2 }, nasib: { k: 3 }, end: {} },
  JilapiBet: { start: {}, fahim: { bet: 0 }, sealed: { bet: 2, sealed: true } },
  EightFlats: { start: { k: 0 }, flats: { k: 1 }, end: {} },
  RentGrid: { start: {}, bed: { mode: "bed", knob: 8, seen: ["bed:6", "bed:7", "bed:8"] }, done: { mode: "bath", knob: 9, seen: ["bed:6", "bed:7", "bed:8", "bath:6", "bath:8", "bath:9"] } },
  SlantClimb: { start: { k: 0 }, column: { k: 1 }, lines: { k: 2 }, end: {} },
  NewAxes: { start: {}, lines: { stage: 1 }, done: { stage: 2 } },
  TwoButtonsDo: { start: { k: 0 }, size: { k: 1 }, imb: { k: 2 }, end: {} },
  HouseInNewBasis: { start: {}, add: { stage: 1 }, put: { stage: 3 }, done: { stage: 4 } },
  TwoCards: { start: { k: 0 }, over: { k: 1 }, end: {} },
  ReadTheNumbers: { start: {}, size: { read: 1 }, done: { read: 2 } },
  ShrinkToOne: { start: { k: 0 }, end: {} },
  OneNumberRent: { start: {}, turned: { turned: true, knob: 6 }, done: { turned: true, knob: 8, done: true } },
  DotsSlide: { start: { k: 0 }, end: {} },
  NasibDoubts: { start: { k: 0 }, end: {} },
  SpinTheGrid: { start: {}, turned: { deg: 45, seen: [0, 15, 30, 45] } },
  SameArrows: { start: { k: 0 }, arrows: { k: 1 }, end: {} },
  YourHouse: { start: {}, wrong: { s: 2, m: 1, walked: [2, 1] }, card: { s: 3, m: 1, walked: [3, 1] }, slip: { s: 3, m: 1, walked: [3, 1], price: 2 }, done: { s: 3, m: 1, walked: [3, 1], price: 1 } },
  SameSizeRow: { start: { k: 0 }, end: {} },
  TryConvertBack: { start: {}, wrong: { drop: [2, 1], walked: true }, right: { drop: [3, 1], walked: true } },
  BackAndForth: { start: { k: 0 }, there: { k: 1 }, end: {} },
  FirstNight: { start: { k: 0 }, lit: { k: 2 }, end: {} },
  BetSettled: { start: {}, open: { open: true }, reading: { open: true, seen: [0, 1, 2], at: 2 }, done: { open: true, seen: [0, 1, 2, 3, 4], at: 4 } },
  PcaWords: { start: { k: 0 }, mid: { k: 2 }, end: {} },
};
