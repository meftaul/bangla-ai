"use client";

import {
  Choice,
  Draw,
  FADE,
  Nope,
  POP,
  Scene,
  Stepper,
  Ticks,
  primaryBtn,
  quietBtn,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
} from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person as CastPerson, Stage, StoryFrame } from "@/components/journey/cast";
import { Lit, listOf, sg } from "@/components/journey/plane";
import { useState } from "react";
import { Task, useGate } from "@/components/journey/journey";

// Screens for "Math for AI 5.2 — The extra column, what a bathroom is worth",
// told as a Journey in the author's Banglish, 8 steps (the pathshala-journey
// skill).
//
// Day two of moving week. Two flats left on the dalal's list, one extra
// bathroom and 4000 taka apart, so Abbu asks the only question that matters:
// what is one bathroom worth? The dalal's app said 3000 in the morning and
// −2000 by evening, on the same khata. The reader seals a bet on which
// reading to believe, then digs the answer out of the khata itself: a column
// that is just another column in a new unit (sq ft / sq m), a column that
// isn't a copy but is built from the other two (total = bed + bath), two
// knob-sets that price all six flats identically, the reader's own shuffle,
// five loose pages (Your turn) and a "free bathroom" knob-set (Try it). The
// finale deletes the total column, reruns the app, and settles the bet.
//
// The zero-walk test and the third button were in this journey once; they
// are now their own journey, 5.2b (05b2_walk_home, homewalk-journey.tsx).
//
// Watch-only figures, one in every <Then>: both prices fitting every flat
// (BothFit), six numbers and three facts (ThreeFacts), total built row by row
// (BuiltRowByRow), the credit shuffling while no rent moves (KnobShuffle), the
// slow sum as taka blocks (SlowSum), the trap page's floor column (TrapPage),
// the whole family of knob-sets (KnobFamily) and the knobs with no room left
// to shuffle (NoRoomToShuffle); plus the reader's set joining the app's two
// (ThirdSet), and in the side quests the good app vs the dalal's (TwoApps)
// and the near-copy's wobble (NearCopyWobble). Story scenes: remote B's one
// line (RemoteBRecall), the dalal's two readings (DalalArrives), the khata's
// first page (KhataOpens), Samin squinting at total (SaminSquints), the
// phone's two knob cards (KnobCards), Samin and the dalal's bag (BagPages),
// the free-bathroom refresh (FreeRefresh), Abbu's pen (AbbuSigns) and Nasib
// at the door (NasibAtDoor, in the finale's <Then>).
//
// Tailwind only. Ink on white sheets is fixed. Words are Banglish; names in
// the story scenes are drawn in Bangla (NameTag for the ones not in the cast).

/** one decimal, for square metres */
const r1 = (n: number) => Math.round(n * 10) / 10;
/** a knob term like 5·2 or −2·1, real minus */
const term = (k: number, v: number) => `${k < 0 ? "−" : ""}${Math.abs(k)}·${v}`;

/** A story scene takes `story` and ignores it (see journey.tsx). */
type Story = { story?: boolean };

/** A name under someone's feet, for people the cast doesn't have (আব্বু, দালাল ভাই). */
function NameTag({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={8} fontWeight={700} fill="#1f2937" pointerEvents="none">
      {name}
    </text>
  );
}

// ---------------------------------------------------------------------------
// The shared data: the dalal's khata. Six flats, (bed, bath, total) and rent
// in thousands of taka. The true rule is 5·bed + 3·bath; because total =
// bed + bath, every knob-set (5 − c, 3 − c, c) fits equally well.

const FLATS = [
  { bed: 2, bath: 1, total: 3, rent: 13 },
  { bed: 3, bath: 2, total: 5, rent: 21 },
  { bed: 2, bath: 2, total: 4, rent: 16 },
  { bed: 3, bath: 1, total: 4, rent: 18 },
  { bed: 4, bath: 2, total: 6, rent: 26 },
  { bed: 1, bath: 1, total: 2, rent: 8 },
];

/** the app's morning and evening knob-sets, per (bed, bath, total) */
const MORNING = [5, 3, 0];
const EVENING = [0, -2, 5];
const knobRent = (knobs: number[], i: number) => knobs[0] * FLATS[i].bed + knobs[1] * FLATS[i].bath + knobs[2] * FLATS[i].total;
const knobLine = (knobs: number[], i: number) =>
  `${term(knobs[0], FLATS[i].bed)} + ${term(knobs[1], FLATS[i].bath)} + ${term(knobs[2], FLATS[i].total)} = ${knobRent(knobs, i)}`;

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the dalal's app speaks
//      twice. Morning, six flats: one bathroom, +3000. Evening, one more flat
//      in the khata: −2000. Abbu asks the obvious thing; the widget seals the bet.

const S1_GROUND = 150;

/** the dalal's phone, held up: whatever the app says right now */
function PhoneCard({ x, y, says }: { x: number; y: number; says: string }) {
  return (
    <g className="pointer-events-none">
      <rect x={x - 15} y={y - 11} width={30} height={22} rx={3} fill="#0f172a" />
      <rect x={x - 12.5} y={y - 8.5} width={25} height={15} rx={1.5} fill="#e2e8f0" />
      <text x={x} y={y + 2} textAnchor="middle" fontSize={7} fontWeight={700} fill="#0f1b2d" fontFamily="ui-monospace, monospace">
        {says}
      </text>
    </g>
  );
}

export function DalalArrives({}: Story) {
  const s = useScene(4, [700, 2400, 2600, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="দালাল ভাইয়ের rent app সকালে বললো প্রতি বাথরুম +3000, আরেকটা flat তোলার পর সন্ধ্যায় বললো −2000">
        <CastPerson who="karim" x={96} y={S1_GROUND} facing={1} arm={k >= 1 ? "point" : "down"} mood={k >= 2 ? "puzzled" : "smug"} />
        <NameTag x={96} y={S1_GROUND + 14} name="দালাল ভাই" />
        <PhoneCard x={124} y={S1_GROUND - 44} says={k === 0 ? "rent app" : k === 1 ? "+3000" : "−2000"} />
        {k >= 2 && <CastCard x={142} y={S1_GROUND - 20} text="+1 flat" tone="amber" />}
        {k === 1 && <Bubble x={96} y={S1_GROUND - 68} side="mid" lines={["একটা বাথরুম,", "তিন হাজার টাকা."]} />}
        {k === 2 && <Bubble x={96} y={S1_GROUND - 68} side="mid" lines={["একটা flat বাড়াইলাম,", "এখন কয় −2000!"]} />}
        <CastPerson who="mama" x={184} y={S1_GROUND} facing={-1} mood={k >= 2 ? "puzzled" : "plain"} />
        <NameTag x={184} y={S1_GROUND + 14} name="আব্বু" />
        {k >= 3 && <Bubble x={184} y={S1_GROUND - 68} side="mid" lines={["বাথরুম বাড়লে", "ভাড়া কমে?"]} />}
        <CastPerson who="fahim" x={248} y={S1_GROUND} facing={-1} mood={k >= 1 ? "puzzled" : "plain"} label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1b · A recall for screen 1's setup, no task: yesterday's twin remote B. Its
//      two buttons, (1, 1) and (2, 2), push along the same tilted line, so on
//      the whole floor it only ever reaches that one line.

const R1B_U = 17;
const r1bx = (x: number) => 16 + x * R1B_U;
const r1by = (y: number) => 100 - y * R1B_U;
const R1B_SAY = [
  "কালকের যমজ remote B. দুইটা button: (1, 1) আর (2, 2).",
  "দুইটা button-ই ঠেলে একই হেলানো line বরাবর.",
  "যতই চাপুন, remote B থামে ওই line-এর উপরেই.",
  "পুরা floor-এ ওর দৌড় ওই এক line পর্যন্ত. বাকিটা ওর নাগালের বাইরে.",
];

/** an arrow from the floor's corner to (x, y), drawn in */
function R1BArrow({ x, y, ink, hex, w }: { x: number; y: number; ink: string; hex: string; w: number }) {
  const tx = r1bx(x);
  const ty = r1by(y);
  const len = Math.hypot(tx - r1bx(0), ty - r1by(0));
  const [dx, dy] = [(tx - r1bx(0)) / len, (ty - r1by(0)) / len];
  const bx = tx - dx * 7;
  const by = ty - dy * 7;
  return (
    <Lit a={[r1bx(0), r1by(0)]} b={[tx, ty]} list={listOf([0, 0], [x, y])} w={w} color={hex}>
      <g className="pointer-events-none">
        <Draw d={`M${r1bx(0)} ${r1by(0)}L${bx} ${by}`} strokeWidth={w} className={ink} ms={700} />
        <path d={`M${tx} ${ty}L${bx - dy * 3.6} ${by + dx * 3.6}L${bx + dy * 3.6} ${by - dx * 3.6}Z`} fill={hex} className={POP} />
      </g>
    </Lit>
  );
}

export function RemoteBRecall({}: Story) {
  const s = useScene(3, [700, 1800, 2000, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{R1B_SAY[k]}</span>}>
      <svg viewBox="0 0 200 112" className="mx-auto block h-auto w-full max-w-[15rem]" role="img" aria-label="remote B-র দুইটা button একই হেলানো line বরাবর ঠেলে, তাই পুরা floor-এ ও শুধু ওই line-এই যায়">
        <rect x={r1bx(0)} y={r1by(5)} width={6 * R1B_U} height={5 * R1B_U} fill="white" stroke="#cbd5e1" strokeWidth={0.8} />
        {Array.from({ length: 5 }, (_, i) => (
          <path key={`v${i}`} d={`M${r1bx(i + 1)} ${r1by(0)}V${r1by(5)}`} stroke="#e2e8f0" strokeWidth={0.7} />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <path key={`h${i}`} d={`M${r1bx(0)} ${r1by(i + 1)}H${r1bx(6)}`} stroke="#e2e8f0" strokeWidth={0.7} />
        ))}
        {k >= 3 && <rect className={FADE} x={r1bx(0)} y={r1by(5)} width={6 * R1B_U} height={5 * R1B_U} fill="#94a3b8" opacity={0.35} />}
        {k >= 2 && <Draw d={`M${r1bx(0)} ${r1by(0)}L${r1bx(5)} ${r1by(5)}`} strokeWidth={3.5} className="stroke-[#0f766e]/40" ms={900} />}
        {k >= 2 &&
          [1, 2, 3, 4, 5].map((t) => (
            <circle key={t} cx={r1bx(t)} cy={r1by(t)} r={2.6} fill="#0f766e" className={POP} style={{ transitionDelay: `${t * 140}ms` }} />
          ))}
        {k >= 1 && <R1BArrow x={2} y={2} ink="stroke-[#be123c]" hex="#be123c" w={2.2} />}
        {k >= 1 && <R1BArrow x={1} y={1} ink="stroke-[#1d4ed8]" hex="#1d4ed8" w={2.6} />}
        {/* remote B itself, its two buttons named */}
        <rect x={132} y={30} width={40} height={66} rx={8} fill="#1f2937" />
        <circle cx={152} cy={46} r={9} fill="#1d4ed8" />
        <circle cx={152} cy={74} r={9} fill="#be123c" />
        <text x={152} y={62} textAnchor="middle" fontSize={7} fontWeight={700} fill="white" fontFamily="ui-monospace, monospace">
          (1, 1)
        </text>
        <text x={152} y={90} textAnchor="middle" fontSize={7} fontWeight={700} fill="white" fontFamily="ui-monospace, monospace">
          (2, 2)
        </text>
        <text x={152} y={108} textAnchor="middle" fontSize={8} fontWeight={700} className="fill-foreground">
          remote B
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Four answers to "which number should Abbu believe?",
//     and no marking: the bet is settled only in the finale, seven screens of
//     khata later. Sealing stamps the picked card.

const BET = ["3000 টাই ঠিক দাম", "−2000 টাই ঠিক দাম", "দুইটাই কোনোভাবে ঠিক", "কোনোটারই কোনো মানে নাই"];

export function TwoAnswers() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);

  const seal = () => {
    setSealed(true);
    pass("বাজি সিল হলো. এবার খাতাটা খুলি.");
  };

  // what the bet claims, acted on the two price cards (never marked right or wrong):
  // "believe it" lifts a card, "not that one" fades it, "no meaning" hangs a ? on both
  const lift = (card: 0 | 1) =>
    bet === null
      ? ""
      : bet === 3
        ? "opacity-45"
        : bet === 2 || bet === card
          ? "ring-2 ring-foreground/25 shadow-md"
          : "opacity-35 scale-95";

  return (
    <>
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
        {([0, 1] as const).map((c) => (
          <div
            key={c}
            className={`relative rounded-xl border-2 px-3 py-1.5 text-center transition-all duration-500 motion-reduce:transition-none ${
              c === 0 ? "border-cat-blue/30 bg-cat-blue/5" : "border-cat-coral/30 bg-cat-coral/5"
            } ${lift(c)}`}
          >
            <div className="text-xs font-semibold leading-tight text-muted">{c === 0 ? "সকাল · 6টা flat" : "সন্ধ্যা · 7টা flat"}</div>
            <div className={`mt-0.5 font-mono text-base font-semibold leading-tight ${c === 0 ? "text-cat-blue" : "text-cat-coral"}`}>{c === 0 ? "+3000" : "−2000"}</div>
            <div className="text-xs leading-tight text-muted">প্রতি বাথরুম</div>
            {bet === 3 ? (
              <span
                key={`q${c}`}
                aria-hidden="true"
                className={`${POP} absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-foreground font-mono text-sm font-bold text-background`}
              >
                ?
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm font-medium leading-snug text-muted">একই খাতা, একই app. আব্বু আজ রাতেই sign করবেন. কোন সংখ্যাটা বিশ্বাস করবেন?</div>
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
      {sealed ? (
        <div className={`${FADE} mt-2 text-center text-[0.9rem] leading-snug text-muted`}>
          সিল হলো. উত্তরটা খাতার ভিতরেই লুকিয়ে আছে. এক screen এক screen করে বের করবো, মিলাবো একদম শেষে.
        </div>
      ) : null}
      <Task done={sealed}>একটা উত্তর বেছে সিল করে দিন. ঠিক না ভুল, সেটা জানবেন অনেক পরে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: each price is checked
//      against the khata of its hour, and every flat comes out right — six in
//      the morning, seven by evening. Two perfect answers, so the trouble is in
//      the khata itself, whose columns are still a "?".

const S1F_SAY = [
  "প্রতিটা দাম সেই সময়ের খাতার সব flat দিয়ে check করা হলো.",
  "সকাল: প্রতি বাথরুম +3000 ধরলে ছয়টা flat-ই মিলে যায়, টাকায় টাকায়.",
  "সন্ধ্যা: −2000 ধরলে সাতটাই মিলে যায়, টাকায় টাকায়.",
  "দুইটা নিখুঁত উত্তর. তাহলে গোলমাল খাতার ভিতরে. Column ধরে ধরে দেখতে হবে.",
];

export function BothFit() {
  const s = useScene(3, [700, 2200, 2200]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S1F_SAY[k]}</span>}>
      <div className="mx-auto grid max-w-[17rem] grid-cols-2 gap-2">
        {[
          { when: "সকাল", says: "+3000", n: 6, on: k >= 1, tone: "border-cat-blue/30 bg-cat-blue/5 text-cat-blue" },
          { when: "সন্ধ্যা", says: "−2000", n: 7, on: k >= 2, tone: "border-cat-coral/30 bg-cat-coral/5 text-cat-coral" },
        ].map((c) => (
          <div key={c.when} className={`rounded-xl border-2 px-2 py-1.5 text-center ${c.tone}`}>
            <div className="text-[0.7rem] font-semibold leading-tight text-muted">{c.when}</div>
            <div className="font-mono text-sm font-semibold leading-tight">{c.says}</div>
            <div className="mt-1 flex flex-wrap justify-center gap-0.5">
              {Array.from({ length: c.n }, (_, i) => (
                <span
                  key={i}
                  className={`grid size-4 place-items-center rounded font-mono text-[0.6rem] leading-none transition-colors duration-300 motion-reduce:transition-none ${
                    c.on ? "bg-accent text-accent-foreground" : "bg-foreground/10 text-muted"
                  }`}
                  style={{ transitionDelay: c.on ? `${i * 120}ms` : "0ms" }}
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <div className="mt-0.5 text-[0.65rem] leading-tight text-muted">{c.on ? "সব flat মিলেছে" : "খাতার flat"}</div>
          </div>
        ))}
      </div>
      {k >= 3 ? (
        <div className={`${POP} mx-auto mt-2 w-[9rem] rounded-lg border border-[#c9b98f] bg-[#fbf6e9] px-2 py-1.5`}>
          <div className="text-center text-[0.65rem] font-semibold leading-tight text-[#5a4a2a]">খাতা</div>
          <div className="mt-1 grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="rounded bg-[#ece2c6] text-center font-mono text-[0.7rem] font-semibold leading-snug text-[#5a4a2a]">
                ?
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: Samin comes to the table
//      and opens the khata. The first page holds each flat's area twice, in
//      square feet and in square metres, two columns side by side, and both
//      look useful. The numbers stay handwriting, so the widget's row isn't given away.

/** a low table, its top at y, legs to the floor */
function RTable({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x0} y={y} width={x1 - x0} height={5} rx={1.5} fill="#8b5a2b" />
      <path d={`M${x0 + 6} ${y + 5}V${S1_GROUND}M${x1 - 6} ${y + 5}V${S1_GROUND}`} stroke="#6b4423" strokeWidth={3} />
    </g>
  );
}

/** the dalal's khata lying on a table, closed or open */
function RKhata({ x, y, open }: { x: number; y: number; open: boolean }) {
  return open ? (
    <g className={POP}>
      <path d={`M${x - 22} ${y}L${x - 20} ${y - 7}H${x}V${y}Z`} fill="#fbf6e9" stroke="#a16207" strokeWidth={0.8} />
      <path d={`M${x + 22} ${y}L${x + 20} ${y - 7}H${x}V${y}Z`} fill="#fbf6e9" stroke="#a16207" strokeWidth={0.8} />
    </g>
  ) : (
    <rect x={x - 14} y={y - 6} width={28} height={6} rx={1} fill="#b45309" />
  );
}

/** a handwritten entry: a squiggle, not a number */
const scrawl = (x: number, y: number, w: number) => `M${x} ${y}q${w / 8} -3 ${w / 4} 0t${w / 4} 0t${w / 4} 0t${w / 4} 0`;

export function KhataOpens({}: Story) {
  const s = useScene(3, [700, 1800, 1800, 2000]);
  const k = s.k;
  const cols = [
    { x: 78, head: "sq ft" },
    { x: 142, head: "sq m" },
  ];

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সামিন খাতাটা খুললো; প্রথম পাতায় প্রতিটা flat-এর area দুইবার লেখা, sq ft আর sq m, পাশাপাশি দুইটা column">
        <RTable x0={70} x1={190} y={114} />
        <RKhata x={130} y={114} open={k >= 1} />
        {k >= 2 && (
          <g className={POP}>
            <rect x={40} y={10} width={140} height={86} rx={3} fill="#fbf6e9" stroke="#c9b98f" strokeWidth={1} />
            <path d={`M110 16V90`} stroke="#c9b98f" strokeWidth={0.8} />
            {cols.map((c) => (
              <g key={c.head}>
                {k >= 3 && <rect className={FADE} x={c.x - 28} y={16} width={56} height={74} rx={4} fill="#f59e0b" opacity={0.18} />}
                <text x={c.x} y={30} textAnchor="middle" fontSize={10} fontWeight={700} fill="#5a4a2a" fontFamily="ui-monospace, monospace">
                  {c.head}
                </text>
                {[0, 1, 2].map((r) => (
                  <path key={r} d={scrawl(c.x - 16, 48 + r * 16, 32)} fill="none" stroke="#5a4a2a" strokeWidth={1.3} strokeLinecap="round" />
                ))}
              </g>
            ))}
          </g>
        )}
        <CastPerson who="samin" x={k >= 1 ? 222 : 300} y={S1_GROUND} facing={-1} walking={k === 1} arm={k >= 3 ? "point" : "down"} mood="plain" label />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · The khata's first page: each flat's area, written twice — square feet
//     and square metres. Row 1 by hand (a wrong pick sits in the cell, struck
//     out, so the reader sees what it would have claimed), then the machine
//     fills the rest, and never needs to look at a flat again. Six numbers,
//     three facts.

const AREA_FT = [650, 860, 1050];
const SQM = (n: number) => r1(n / 10.76);
const AREA_OPT = ["650", `${SQM(650)}`, "325"];
const AREA_RIGHT = 1;
const AREA_NOPE = [
  "আবার 650? Unit বদলালে সংখ্যাও বদলাতে হবে. নইলে তো একই জামা.",
  "",
  "650-এর অর্ধেক? অর্ধেক করা মানে unit বদলানো না. Machine ভাগ দেয় 10.76 দিয়ে.",
];

export function AreaTwice() {
  const pass = useGate();
  const [filled, setFilled] = useSeed<number[]>("filled", []);
  const [wrong, setWrong] = useSeed<number | null>("wrong", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const done = filled.length === AREA_FT.length;

  const pick = (i: number) => {
    if (filled.length) return;
    if (i === AREA_RIGHT) {
      setFilled([0]);
      setWrong(null);
    } else {
      setWrong(i);
      setMiss(miss + 1);
    }
  };
  const tap = (i: number) => {
    if (filled.includes(i)) return;
    const next = [...filled, i];
    setFilled(next);
    if (next.length === AREA_FT.length) pass("sq m column: একই তথ্য, নতুন জামা.");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[19rem] rounded-2xl border border-border bg-surface p-3">
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-muted">
          <span className="text-center">area, sq ft</span>
          <span className="text-center">area, sq m</span>
        </div>
        {AREA_FT.map((ft, i) => (
          <div key={ft} className="mt-1.5 grid grid-cols-2 items-center gap-2">
            <span className="rounded-lg bg-foreground/[0.04] py-1.5 text-center font-mono">{ft}</span>
            {filled.includes(i) ? (
              <span className={`${POP} rounded-lg bg-accent/10 py-1.5 text-center font-mono font-semibold text-accent-text`}>
                {SQM(ft).toFixed(1)}
              </span>
            ) : i === 0 ? (
              wrong !== null ? (
                <span key={miss} className={`${POP} rounded-lg border-2 border-danger/50 bg-danger/5 py-1 text-center font-mono text-danger line-through`}>
                  {AREA_OPT[wrong]}
                </span>
              ) : (
                <span className="rounded-lg border-2 border-dashed border-muted/40 py-1.5 text-center font-mono text-muted">?</span>
              )
            ) : (
              <button
                type="button"
                onClick={() => tap(i)}
                disabled={!filled.length}
                className="cursor-pointer rounded-lg border-2 border-dashed border-muted/40 py-1.5 text-center text-sm text-muted hover:border-accent hover:text-foreground disabled:cursor-default disabled:opacity-50"
              >
                {filled.length ? "tap করুন" : "?"}
              </button>
            )}
          </div>
        ))}
      </div>
      {filled.length === 0 ? (
        <>
          <div className="mt-3 text-sm font-medium text-muted">প্রথম সারিটা নিজে করুন. 1 sq m মানে 10.76 sq ft, তাই machine ভাগ দেয়. প্রথম sq m ঘরে কত বসবে?</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {AREA_OPT.map((o, i) => (
              <Choice key={o} n={i} look={wrong === i ? "wrong" : "idle"} disabled={false} onClick={() => pick(i)}>
                <span className="font-mono">{o}</span>
              </Choice>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-3 text-center font-mono text-sm text-muted">
          {filled.includes(1) ? `${AREA_FT[1]} ÷ 10.76 = ${SQM(AREA_FT[1]).toFixed(1)}` : ""}
          {filled.includes(1) && filled.includes(2) ? " · " : ""}
          {filled.includes(2) ? `${AREA_FT[2]} ÷ 10.76 = ${SQM(AREA_FT[2]).toFixed(1)}` : ""}
        </div>
      )}
      {filled.length > 1 && !done ? <div className="text-center text-sm text-muted">Flat টা দেখারও দরকার পড়ে নাই.</div> : null}
      {wrong !== null && !filled.length ? <Nope key={miss}>{AREA_NOPE[wrong]}</Nope> : null}
      {done ? (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-accent/10 px-4 py-2.5 text-center text-[0.95rem] text-accent-text`}>
          ছয়টা সংখ্যা, তথ্য তিনটা. sq m column যা বলতে পারতো, sq ft column সেটা আগেই বলে দিয়েছে.
        </div>
      ) : null}
      <Task done={done}>sq m column টা ভরে ফেলুন. প্রথম সারি নিজে, বাকি দুইটা machine-কে দিয়ে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: six numbers on the page,
//      but each row is one fact about one flat — three facts. Cover the sq m
//      column and the sq ft column rebuilds it, ÷ 10.76, row after row.

const S2F_SAY = [
  "প্রথম পাতায় ছয়টা সংখ্যা.",
  "কিন্তু প্রতিটা সারি একটা flat-এর একটাই কথা বলে: ওর সাইজ. মানে তথ্য তিনটা.",
  "sq m column টা ঢেকে দিন. sq ft-কে 10.76 দিয়ে ভাগ দিলে হুবহু ফেরত আসে.",
  "নতুন কিছু নাই. পুরানো column, নতুন জামায়.",
];

export function ThreeFacts() {
  const s = useScene(3, [700, 2000, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S2F_SAY[k]}</span>}>
      <div className="mx-auto w-full max-w-[15rem]">
        <div className="grid grid-cols-[2.8rem_1fr_3.2rem_1fr] items-center gap-1 text-[0.7rem] font-semibold text-muted">
          <span />
          <span className="text-center">sq ft</span>
          <span />
          <span className="text-center">{k >= 3 ? <span className={`${FADE} text-accent-text`}>নতুন জামা</span> : "sq m"}</span>
        </div>
        {AREA_FT.map((ft, i) => (
          <div
            key={ft}
            className={`mt-1 grid grid-cols-[2.8rem_1fr_3.2rem_1fr] items-center gap-1 rounded-lg transition-colors duration-300 motion-reduce:transition-none ${
              k >= 1 ? "bg-cat-blue/10" : ""
            }`}
          >
            <span className="text-center text-[0.65rem] font-semibold leading-none text-cat-blue">{k >= 1 ? <span className={FADE}>তথ্য {i + 1}</span> : ""}</span>
            <span className="py-1 text-center font-mono text-sm">{ft}</span>
            <span className="whitespace-nowrap text-center font-mono text-[0.65rem] leading-none text-muted">
              {k >= 2 ? (
                <span className={FADE} style={{ transitionDelay: `${i * 300}ms` }}>
                  ÷ 10.76
                </span>
              ) : (
                ""
              )}
            </span>
            <span
              className={`py-1 text-center font-mono text-sm transition-opacity duration-300 motion-reduce:transition-none ${
                k === 2 ? "opacity-40" : ""
              } ${k >= 3 ? "font-semibold text-accent-text" : ""}`}
            >
              {SQM(ft).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: page two, bed, bath, total
//      and rent. Samin squints at the total column: not a copy of bed, not of
//      bath, and it changes flat to flat. So is it new? The rule stays unsaid.

const S3A_COLS = [
  { x: 42, head: "bed", key: "bed" },
  { x: 80, head: "bath", key: "bath" },
  { x: 120, head: "মোট ঘর", key: "total" },
  { x: 160, head: "ভাড়া", key: "rent" },
] as const;

const S3A_THINK: string[][] = [[], ["bed-এর কপি না."], ["bath-এরও কপি না."], ["flat বদলালে", "এটাও বদলায়."], ["তাহলে এটা কি", "নতুন তথ্য?"]];

export function SaminSquints({}: Story) {
  const s = useScene(4, [700, 2000, 2000, 2200, 2200]);
  const k = s.k;
  const lit = (key: string) => (key === "total" && k >= 1) || (key === "bed" && k === 1) || (key === "bath" && k === 2);

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="খাতার দ্বিতীয় পাতা: bed, bath, মোট ঘর, ভাড়া. সামিন মোট ঘরের column টা দেখছে: bed-এর কপি না, bath-এর কপি না, flat বদলালে বদলায়. তাহলে কি নতুন তথ্য?">
        <rect x={16} y={10} width={168} height={128} rx={3} fill="#fbf6e9" stroke="#c9b98f" strokeWidth={1} />
        {S3A_COLS.map((c) => (
          <g key={c.key}>
            {lit(c.key) && (
              <rect
                key={`${c.key}${k}`}
                className={FADE}
                x={c.x - 17}
                y={16}
                width={34}
                height={116}
                rx={4}
                fill={c.key === "total" ? "#f59e0b" : "#3b82f6"}
                opacity={0.2}
              />
            )}
            <text x={c.x} y={30} textAnchor="middle" fontSize={9} fontWeight={700} fill="#5a4a2a">
              {c.head}
            </text>
            {FLATS.map((f, r) => (
              <text
                key={r}
                x={c.x}
                y={48 + r * 16}
                textAnchor="middle"
                fontSize={10}
                fontWeight={c.key === "total" && k >= 3 ? 700 : 400}
                fill={c.key === "total" && k >= 3 ? "#b45309" : "#1f2937"}
                fontFamily="ui-monospace, monospace"
                className={c.key === "total" && k === 3 ? POP : undefined}
                style={c.key === "total" && k === 3 ? { transitionDelay: `${r * 200}ms` } : undefined}
              >
                {f[c.key]}
              </text>
            ))}
          </g>
        ))}
        <CastPerson who="samin" x={246} y={S1_GROUND} facing={-1} arm={k >= 1 ? "point" : "down"} mood={k >= 1 ? "puzzled" : "plain"} label />
        {k >= 1 && <Bubble key={k} x={246} y={S1_GROUND - 66} side="left" tone="think" lines={S3A_THINK[k]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · Page two: the flats. Bed, bath, total rooms — and total isn't a copy of
//     anything. Four rule cards; the reader picks one and the machine checks
//     it: a wrong rule breaks on flat 1, the right one ticks down all six.

const RULES = [
  { label: "bed × 2", note: "Flat 1: 2 × 2 = 4. কিন্তু খাতায় লেখা 3." },
  { label: "bed + bath", note: "" },
  { label: "bath + 1", note: "Flat 1: 1 + 1 = 2. কিন্তু খাতায় লেখা 3." },
  { label: "কোনো নিয়মই নাই", note: "Flat 1-এর মোট ঘর 3. কিছু একটা তো এটা ঠিক করে দিয়েছে. কী সেটা?" },
];

/** what a rule says for flat f, or null when it claims nothing */
const ruleVal = (r: number, f: number): number | null =>
  r === 1 ? FLATS[f].bed + FLATS[f].bath : r === 0 ? FLATS[f].bed * 2 : r === 2 ? FLATS[f].bath + 1 : null;

export function TotalColumn() {
  const pass = useGate();
  const [rule, setRule] = useSeed<number | null>("rule", null);
  const done = rule === 1;

  const run = (i: number) => {
    setRule(i);
    if (i === 1) pass("কপি না, তবু বাকি দুইটা দিয়েই বানানো.");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[21rem] rounded-2xl border border-border bg-surface p-2.5">
        <div className="grid grid-cols-[1.1rem_0.9fr_0.9fr_0.9fr_1.9fr] gap-1 text-[0.7rem] font-semibold leading-none text-muted">
          <span />
          <span className="text-center">bed</span>
          <span className="text-center">bath</span>
          <span className="text-center">মোট ঘর</span>
          <span className="text-center">{rule === null ? "" : "নিয়ম বলে"}</span>
        </div>
        {FLATS.map((f, i) => {
          const v = rule === null ? null : ruleVal(rule, i);
          const show = rule !== null && (done || i === 0);
          const ok = v === f.total;
          return (
            <div key={i} className="mt-0.5 grid grid-cols-[1.1rem_0.9fr_0.9fr_0.9fr_1.9fr] items-center gap-1">
              <span className="text-center text-xs leading-none text-muted">{i + 1}</span>
              <span className="rounded-lg bg-foreground/[0.04] py-0.5 text-center font-mono text-[0.85rem] leading-tight">{f.bed}</span>
              <span className="rounded-lg bg-foreground/[0.04] py-0.5 text-center font-mono text-[0.85rem] leading-tight">{f.bath}</span>
              <span className="rounded-lg bg-foreground/[0.04] py-0.5 text-center font-mono text-[0.85rem] leading-tight">{f.total}</span>
              {show ? (
                <span
                  key={rule}
                  className={`${POP} whitespace-nowrap rounded-lg py-0.5 text-center font-mono text-[0.75rem] font-semibold leading-tight ${
                    ok ? "bg-accent/10 text-accent-text" : "bg-danger/10 text-danger"
                  }`}
                  style={{ transitionDelay: `${i * 180}ms` }}
                >
                  {rule === 3 ? "?" : `${rule === 0 ? `${f.bed} × 2` : rule === 1 ? `${f.bed} + ${f.bath}` : `${f.bath} + 1`} = ${v}`}{" "}
                  {ok ? "✓" : "✕"}
                </span>
              ) : (
                <span />
              )}
            </div>
          );
        })}
      </div>
      <div className="mx-auto mt-2 grid max-w-[21rem] grid-cols-2 gap-1.5">
        {RULES.map((r, i) => (
          <button
            key={r.label}
            type="button"
            disabled={done}
            onClick={() => run(i)}
            className={`cursor-pointer rounded-xl border-2 px-2.5 py-1.5 text-[0.8rem] font-semibold leading-tight transition-colors disabled:cursor-default ${i < 3 ? "font-mono" : ""} ${
              rule === i ? (done ? "border-accent bg-accent text-accent-foreground" : "border-danger/50 bg-danger/5 text-danger") : "border-border hover:border-accent"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      {rule !== null && !done ? <Nope key={rule}>{RULES[rule].note}</Nope> : null}
      {done ? (
        <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-3 py-1.5 text-center text-[0.85rem] leading-snug text-accent-text`}>
          ছয় সারি, ছয়বারই মিললো. মোট ঘরের column কারো কপি না. তবু bed আর bath মিলে ওকে পুরাটা বানিয়ে দেয়.
        </div>
      ) : null}
      <Task done={done}>মোট ঘরের column কোন নিয়ম মানে, খুঁজে বের করুন. প্রতিটা সারিতে check হবে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: bed and bath on their
//      own, the total column blank; then bed + bath fills it, three rows at a
//      time, and the name "extra column" lands on it last.

const S3F_SAY = [
  "ছয়টা flat-এর bed আর bath. মোট ঘরের column ফাঁকা থাকুক.",
  "সারি ধরে ধরে bed + bath: 3, 5, 4 …",
  "… 4, 6, 2. একটা flat-ও না দেখে সবগুলা মোট ঘর ফেরত আসলো.",
  "যে column-কে বাকিরা বানিয়ে দিতে পারে, এখন থেকে ওর নাম বাড়তি column.",
];

export function BuiltRowByRow() {
  const s = useScene(3, [700, 1800, 1800]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S3F_SAY[k]}</span>}>
      <div className="mx-auto w-full max-w-[14rem]">
        <div className="grid grid-cols-[1fr_1fr_2.6fr] gap-1 text-[0.7rem] font-semibold leading-none text-muted">
          <span className="text-center">bed</span>
          <span className="text-center">bath</span>
          <span className="text-center">
            {k >= 3 ? <span className={`${POP} inline-block rounded-full bg-accent px-2 py-0.5 text-accent-foreground`}>বাড়তি column</span> : "মোট ঘর"}
          </span>
        </div>
        {FLATS.map((f, i) => {
          const on = k >= (i < 3 ? 1 : 2);
          return (
            <div key={i} className="mt-0.5 grid grid-cols-[1fr_1fr_2.6fr] items-center gap-1">
              <span className="rounded bg-foreground/[0.04] text-center font-mono text-[0.8rem] leading-snug">{f.bed}</span>
              <span className="rounded bg-foreground/[0.04] text-center font-mono text-[0.8rem] leading-snug">{f.bath}</span>
              {on ? (
                <span
                  className={`${FADE} rounded bg-accent/10 text-center font-mono text-[0.8rem] leading-snug text-accent-text`}
                  style={{ transitionDelay: `${(i % 3) * 250}ms` }}
                >
                  {f.bed} + {f.bath} = <b>{f.total}</b>
                </span>
              ) : (
                <span className="rounded border border-dashed border-muted/40 text-center font-mono text-[0.8rem] leading-snug text-muted">?</span>
              )}
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: the dalal puts his phone
//      on the table and swears by the machine; Abbu asks why it gave two
//      prices; Fahim picks up the phone, and the app's history shows two knob
//      cards, the morning one and the evening one. It doesn't show the rents.

export function KnobCards({}: Story) {
  const s = useScene(3, [700, 2400, 2200, 2000]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="দালাল ভাই বললেন মেশিনের হিসাব ভুল হয় না; আব্বু জিজ্ঞেস করলেন তাহলে দুই দাম কেন; ফাহিম phone হাতে নিলো, history-তে দুইটা knob card">
        <CastPerson who="karim" x={70} y={S1_GROUND} facing={1} arm={k === 1 ? "point" : "down"} mood={k >= 2 ? "puzzled" : "smug"} />
        <NameTag x={70} y={S1_GROUND + 14} name="দালাল ভাই" />
        {k === 1 && <Bubble x={70} y={S1_GROUND - 68} side="right" lines={["মেশিনের হিসাব ভাই,", "ভুল হয় না."]} />}
        <CastPerson who="fahim" x={k >= 3 ? 124 : 172} y={S1_GROUND} facing={-1} walking={k === 3} arm={k >= 3 ? "hold" : "down"} mood="plain" label />
        {k >= 3 && <PhoneCard x={104} y={S1_GROUND - 36} says="knob" />}
        <CastPerson who="mama" x={250} y={S1_GROUND} facing={-1} mood={k >= 2 ? "puzzled" : "plain"} />
        <NameTag x={250} y={S1_GROUND + 14} name="আব্বু" />
        {k === 2 && <Bubble x={250} y={S1_GROUND - 68} side="left" lines={["তাহলে দুইবার", "দুই দাম কেন?"]} />}
        {k >= 3 && (
          <g>
            <text x={112} y={38} textAnchor="middle" fontSize={8} fontWeight={700} fill="#1d4ed8">
              সকাল
            </text>
            <CastCard x={112} y={52} text="(5, 3, 0)" tone="blue" />
            <text x={206} y={38} textAnchor="middle" fontSize={8} fontWeight={700} fill="#be123c">
              সন্ধ্যা
            </text>
            <CastCard x={206} y={52} text="(0, −2, 5)" tone="coral" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · The app itself. Two knob cards — the morning one and the evening one —
//     and one button: run them on the next flat. Each tap pops the next
//     flat's two sums in; row after row the rents come out identical, and the
//     reader watches the app's freedom appear.

export function TwoKnobSets() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [done, setDone] = useSeed("done", false);

  const next = () => {
    if (at < FLATS.length - 1) {
      setAt(at + 1);
      return;
    }
    if (!done) {
      setDone(true);
      pass("দুইটা knob-set, ভাড়া হুবহু একই.");
    }
  };

  return (
    <>
      <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-2">
        {[MORNING, EVENING].map((knobs, c) => (
          <div key={c} className={`rounded-xl border-2 px-2.5 py-2 ${c === 0 ? "border-cat-blue/30 bg-cat-blue/5" : "border-cat-coral/30 bg-cat-coral/5"}`}>
            <div className="text-center text-xs font-semibold text-muted">
              {c === 0 ? "সকালের knob" : "সন্ধ্যার knob"} <span className="font-mono">({knobs.map((k) => sg(k)).join(", ")})</span>
            </div>
            <div key={at} className={`${POP} mt-1.5 text-center font-mono text-[0.8rem] leading-relaxed`} style={{ transitionDelay: `${c * 250}ms` }}>
              {knobLine(knobs, at)}
            </div>
          </div>
        ))}
      </div>
      <div key={at} className={`${FADE} mt-2.5 text-center text-[0.95rem] font-medium text-accent-text`}>
        Flat {at + 1}: দুইটাই বলে {FLATS[at].rent}. খাতায়ও {FLATS[at].rent}.
      </div>
      {!done ? (
        <div className="mt-2.5 flex justify-center">
          <button type="button" onClick={next} className={primaryBtn}>
            {at < FLATS.length - 1 ? "পরের flat →" : "ছয়টাই হলো, মিলিয়ে দেখি"}
          </button>
        </div>
      ) : null}
      <Ticks items={FLATS.map((_, i) => [`flat ${i + 1}`, i < at || done] as [string, boolean])} />
      {done ? (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-accent/10 px-4 py-2.5 text-center text-[0.95rem] text-accent-text`}>
          ছয়টা flat, এক টাকারও পার্থক্য নাই. কোন knob-set আসল, app সেটা বলতেই পারে না. তাই এক বেলা বলে 3000, আরেক বেলা −2000.
        </div>
      ) : null}
      <Task done={done}>দুইটা knob-set ছয়টা flat-এই চালান. চোখ রাখুন ভাড়ার উপর.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the credit shuffles from
//      the bed and bath knobs to the total knob (any c you like), and flat 1's
//      rent holds perfectly still the whole way.

export function KnobShuffle() {
  const s = useScene(3, [700, 2600, 2400]);
  const k = s.k;
  const v = useTween(k >= 1 ? [0, -2, 5] : [5, 3, 0], 2200, [5, 3, 0]);
  const r = v.map(Math.round);

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "Flat 1-এ সকালের knob: প্রতি bed 5, প্রতি bath 3, মোট ঘরে 0. ভাড়া 13."
        ) : k < 3 ? (
          "Credit সরান: bed আর bath থেকে কমিয়ে মোট ঘরে তুলে দিন. যত খুশি."
        ) : (
          <span className={FADE}>সন্ধ্যার knob (0, −2, 5). Flat 1-এর ভাড়া টেরও পেলো না. কোনো flat-এরই পায় না.</span>
        )
      }
    >
      <div className="mx-auto flex max-w-[16rem] items-start justify-center gap-5">
        {["bed", "bath", "মোট ঘর"].map((lab, i) => (
          <div key={lab} className="text-center">
            <div className="text-xs font-semibold text-muted">{lab}</div>
            <div className="relative mx-auto mt-1.5 h-1.5 w-14 rounded-full bg-foreground/10">
              <span aria-hidden="true" className="absolute top-1/2 left-1/2 h-3 w-px -translate-y-1/2 bg-foreground/25" />
              <span
                aria-hidden="true"
                className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cat-blue ring-2 ring-white"
                style={{ left: `${((v[i] + 2) / 7) * 100}%` }}
              />
            </div>
            <div className="mt-1.5 font-mono text-sm font-semibold">{sg(r[i])}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center font-mono text-sm">
        {term(r[0], 2)} + {term(r[1], 1)} + {term(r[2], 3)} = <b className="text-accent-text">13</b>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's side quest, no task: the same khata fed to two
//      apps. A good app won't name a price at all. The dalal's app quietly
//      picks a set: 3000 in the morning, −2000 in the evening.

const S4Q_SAY = [
  "একই খাতা, দুইটা app.",
  "ভালো app হলে দাম বলতেই রাজি হবে না.",
  "দালাল ভাইয়ের app চুপচাপ একটা set বেছে নিলো. সকালে 3000.",
  "সন্ধ্যায় −2000. আশা করে বসে আছে, সব ঠিক আছে.",
];

function S4QPhone({ x, name, says, tone }: { x: number; name: string; says: string; tone: string }) {
  return (
    <g>
      <rect x={x - 26} y={10} width={52} height={82} rx={8} fill="#0f172a" />
      <rect x={x - 21} y={18} width={42} height={62} rx={3} fill="#e2e8f0" />
      <text x={x} y={33} textAnchor="middle" fontSize={7} fontWeight={700} fill="#475569">
        বাথরুম
      </text>
      <text key={says} x={x} y={58} textAnchor="middle" fontSize={says.length > 2 ? 12 : 18} fontWeight={700} fill={tone} fontFamily="ui-monospace, monospace" className={POP}>
        {says}
      </text>
      <text x={x} y={106} textAnchor="middle" fontSize={8} fontWeight={700} className="fill-foreground">
        {name}
      </text>
    </g>
  );
}

export function TwoApps() {
  const s = useScene(3, [700, 2000, 2400, 2200]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S4Q_SAY[k]}</span>}>
      <svg viewBox="0 0 200 112" className="mx-auto block h-auto w-full max-w-[14rem]" role="img" aria-label="ভালো app দাম বলে না; দালাল ভাইয়ের app সকালে 3000, সন্ধ্যায় −2000 বলে">
        <S4QPhone x={52} name="ভালো app" says={k >= 1 ? "?" : "…"} tone="#475569" />
        <S4QPhone x={148} name="দালাল ভাইয়ের app" says={k >= 3 ? "−2000" : k >= 2 ? "+3000" : "…"} tone={k >= 3 ? "#be123c" : "#1d4ed8"} />
        {k >= 2 && (
          <text key={k} x={148} y={74} textAnchor="middle" fontSize={7} fontWeight={700} fill="#475569" className={FADE}>
            {k >= 3 ? "সন্ধ্যা" : "সকাল"}
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · The reader's own shuffle. Flat 1 on the table, morning knobs in hand:
//     check the morning sum first (13, to the taka), then take 1 off the bed
//     knob and 1 off the bath knob — 3 taka gone — and bring the rent back to
//     13 with the total knob alone. Landing on 1 per room is c = 1 from the
//     family the figure above was sliding through.

const SHUF_GOAL = [4, 2, 1];
const SHUF_LIM = [
  { min: 3, max: 5 },
  { min: 1, max: 3 },
  { min: 0, max: 3 },
];

export function YourShuffle() {
  const pass = useGate();
  const [ran, setRan] = useSeed("ran", false);
  const [knobs, setKnobs] = useSeed<number[]>("knobs", [...MORNING]);
  const [done, setDone] = useSeed("done", false);
  const f = FLATS[0];
  const rent = knobs[0] * f.bed + knobs[1] * f.bath + knobs[2] * f.total;
  const gap = f.rent - rent;
  const moved = knobs.some((k, i) => k !== MORNING[i]);

  const turn = (i: number, v: number) => {
    if (done) return;
    const next = knobs.map((k, j) => (j === i ? v : k));
    setKnobs(next);
    if (next.every((k, j) => k === SHUF_GOAL[j])) {
      setDone(true);
      pass("3 হাজার কমালেন, মোট ঘর 3 ফেরত দিলো.");
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[19rem] rounded-2xl border border-border bg-surface p-3">
        <div className="text-center text-xs font-semibold leading-snug text-muted">
          flat 1 · <span className="font-mono">2</span> bed · <span className="font-mono">1</span> bath · <span className="font-mono">3</span> ঘর · খাতার ভাড়া{" "}
          <span className="font-mono">13</span>
        </div>
        {!ran ? (
          <>
            <div className="mt-2 text-center font-mono text-[0.8rem] text-muted">সকালের knob (5, 3, 0) · হাজার টাকায়</div>
            <div className="mt-2 flex justify-center">
              <button type="button" onClick={() => setRan(true)} className={primaryBtn}>
                flat 1-এ চালান
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 text-center font-mono text-[0.75rem] text-muted">
              সকাল: {knobLine(MORNING, 0)} · একদম মিলেছে
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {(["bed", "bath", "total"] as const).map((lab, i) => (
                <div key={lab} className="text-center">
                  <Stepper label={`${lab} knob`} value={knobs[i]} min={SHUF_LIM[i].min} max={SHUF_LIM[i].max} disabled={done} onChange={(v) => turn(i, v)} />
                  <div className="mt-1 text-[0.65rem] font-semibold leading-tight text-muted">{lab === "total" ? "প্রতি ঘর" : `প্রতি ${lab}`}</div>
                </div>
              ))}
            </div>
            <div className="mt-2.5 text-center font-mono text-sm">
              {term(knobs[0], f.bed)} + {term(knobs[1], f.bath)} + {term(knobs[2], f.total)} ={" "}
              <b key={rent} className={`${POP} inline-block ${gap === 0 ? "text-accent-text" : "text-danger"}`}>
                {rent}
              </b>
            </div>
            {!done ? (
              <div className="mt-1 text-center text-[0.85rem] font-medium leading-snug text-muted">
                {!moved
                  ? "এবার bed-এর knob থেকে 1 কমান, bath-এর knob থেকেও 1."
                  : gap === 0
                    ? "আবার 13. তবে এটা 2-আর-2 এর shuffle, আপনার 1-আর-1 না."
                    : gap > 0
                      ? `13 থেকে ${gap} কম. মোট ঘরের knob-এর কাছে ${gap} পাওনা.`
                      : `13 থেকে ${-gap} বেশি হয়ে গেলো.`}
              </div>
            ) : null}
          </>
        )}
      </div>
      {done ? (
        <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-4 py-2.5 text-center text-[0.95rem] leading-snug text-accent-text`}>
          প্রতি bed −1 নিলো 2, প্রতি bath −1 নিলো 1. মোট ঘরের knob 3 ঘর × 1 দিয়ে তিনটাই ফেরত দিলো. ভাড়া আবার 13.
        </div>
      ) : null}
      <Ticks items={[["সকালের হিসাব", ran], ["shuffle করে 13", done]]} />
      <Task done={done}>আগে সকালের knob চালান. তারপর 1-আর-1 shuffle করুন, আর শুধু মোট ঘরের knob দিয়ে ভাড়াটা বাঁচান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the slow sum as blocks of
//      a thousand taka. Flat 1's 13 by the morning knobs; −1 per bed takes 2
//      blocks, −1 per bath 1 more; the total knob pays 1 per room, 3 rooms, 3
//      blocks back. The captions are the author's slow sum, beat by beat.

const S5F_SAY = [
  "Flat 1-এ সকালের knob: 2 bed-এর জন্য 10, 1 bath-এর জন্য 3, মোট ঘরে 0. ভাড়া 13.",
  "প্রতি bed −1, আর flat টায় bed দুইটা. তাই 2 কমলো.",
  "প্রতি bath −1, আরো 1 কমলো. মোট 3 হাজার গায়েব.",
  "মোট ঘরের knob টাকা দেয় ঘর গুনে. flat 1-এ ঘর কয়টা? 3টা. প্রতি ঘরে 1 দিলেই তিনটাই ফেরত.",
  "আপনার set (4, 2, 1)-ও flat 1-এর ভাড়া বলে 13, টাকায় টাকায়.",
];

/** one row of blocks: `have` shown, `gone` of them struck off at the end, `add` new ones popping in */
function BlockRow({ label, sum, have, gone, add, tone }: { label: string; sum: string; have: number; gone: number; add: number; tone: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-11 shrink-0 text-right text-[0.7rem] font-semibold text-muted">{label}</span>
      <div className="flex min-h-3 flex-1 gap-0.5">
        {Array.from({ length: have }, (_, i) => (
          <span
            key={i}
            className={`size-3 rounded-sm transition-all duration-500 motion-reduce:transition-none ${
              i >= have - gone ? "border border-dashed border-danger/60 bg-transparent opacity-50" : tone
            }`}
          />
        ))}
        {Array.from({ length: add }, (_, i) => (
          <span key={`a${i}`} className={`${POP} size-3 rounded-sm bg-accent`} style={{ transitionDelay: `${i * 200}ms` }} />
        ))}
      </div>
      <span className="w-16 shrink-0 whitespace-nowrap font-mono text-[0.75rem]">{sum}</span>
    </div>
  );
}

export function SlowSum() {
  const s = useScene(4, [700, 1800, 2000, 2600, 2000]);
  const k = s.k;
  const knobs = [k >= 1 ? 4 : 5, k >= 2 ? 2 : 3, k >= 3 ? 1 : 0];
  const rent = knobRent(knobs, 0);

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5F_SAY[k]}</span>}>
      <div className="mx-auto grid w-full max-w-[17rem] gap-1.5">
        <BlockRow label="bed" sum={`${knobs[0]}·2 = ${knobs[0] * 2}`} have={10} gone={k >= 1 ? 2 : 0} add={0} tone="bg-cat-blue" />
        <BlockRow label="bath" sum={`${knobs[1]}·1 = ${knobs[1]}`} have={3} gone={k >= 2 ? 1 : 0} add={0} tone="bg-cat-coral" />
        <BlockRow label="মোট ঘর" sum={`${knobs[2]}·3 = ${knobs[2] * 3}`} have={0} gone={0} add={k >= 3 ? 3 : 0} tone="bg-accent" />
      </div>
      <div className="mt-2 text-center font-mono text-sm">
        ভাড়া{" "}
        <b key={rent} className={`${POP} inline-block ${rent === 13 ? "text-accent-text" : "text-danger"}`}>
          {rent}
        </b>
        {k >= 4 ? <span className={`${FADE} ml-2 text-muted`}>knob (4, 2, 1)</span> : null}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5¾ · A second figure for screen 5's explanation, no task: the app's two
//      sets, morning and evening, each ticking all six flats; then the
//      reader's own (4, 2, 1) joins them and ticks all six too; the khata
//      can't tell the three apart.

const S5Q_SAY = [
  "App-এর কাছে ছিল দুইটা set. দুইটাই ছয়টা flat-এ মিলে.",
  "আপনি হাতে বানালেন তৃতীয়টা, (4, 2, 1). এটাও ছয়টাতেই মিলে.",
  "খাতার কোনো কিছুই এই তিনটাকে আলাদা করতে পারবে না.",
];

export function ThirdSet() {
  const s = useScene(2, [700, 2200, 2200]);
  const k = s.k;
  const sets = [
    { name: "সকাল", knobs: MORNING, on: true, tone: "border-cat-blue/30 bg-cat-blue/5" },
    { name: "আপনার", knobs: SHUF_GOAL, on: k >= 1, tone: "border-accent/40 bg-accent/5" },
    { name: "সন্ধ্যা", knobs: EVENING, on: true, tone: "border-cat-coral/30 bg-cat-coral/5" },
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5Q_SAY[k]}</span>}>
      <div className="mx-auto grid max-w-[17rem] grid-cols-3 gap-1.5">
        {sets.map((c) =>
          c.on ? (
            <div
              key={c.name}
              className={`${c.name === "আপনার" ? POP : ""} rounded-xl border-2 px-1 py-1.5 text-center transition-shadow duration-500 motion-reduce:transition-none ${c.tone} ${
                k >= 2 ? "ring-2 ring-foreground/25" : ""
              }`}
            >
              <div className="text-[0.65rem] font-semibold leading-tight text-muted">{c.name}</div>
              <div className="whitespace-nowrap font-mono text-[0.75rem] font-semibold leading-tight">({c.knobs.map((v) => sg(v)).join(", ")})</div>
              <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                {FLATS.map((_, i) => (
                  <span
                    key={i}
                    className={`${c.name === "আপনার" ? POP : ""} size-2.5 rounded-sm ${knobRent(c.knobs, i) === FLATS[i].rent ? "bg-accent" : "bg-danger"}`}
                    style={c.name === "আপনার" ? { transitionDelay: `${300 + i * 150}ms` } : undefined}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div key={c.name} className="grid place-items-center rounded-xl border-2 border-dashed border-muted/40 text-sm text-muted">
              ?
            </div>
          ),
        )}
      </div>
      {k >= 2 ? (
        <div className={`${POP} mx-auto mt-2 w-[8rem] rounded-lg border border-[#c9b98f] bg-[#fbf6e9] px-2 py-1 text-center text-[0.7rem] font-semibold leading-tight text-[#5a4a2a]`}>
          খাতা <span className="ml-1 font-mono">?</span>
        </div>
      ) : null}
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: Samin opens the dalal's
//      bag, five loose pages come out, the dalal tells him not to touch them,
//      and Samin lays them out anyway. No page says which column is extra.

/** the dalal's cloth bag, feet at (x, y) */
function BagProp({ x, y, open }: { x: number; y: number; open: boolean }) {
  return (
    <g className="pointer-events-none">
      <path d={`M${x - 16} ${y}L${x - 13} ${y - 24}H${x + 13}L${x + 16} ${y}Z`} fill="#a16207" stroke="#713f12" strokeWidth={1} />
      <path d={`M${x - 8} ${y - 24}Q${x} ${y - 38} ${x + 8} ${y - 24}`} fill="none" stroke="#713f12" strokeWidth={1.6} />
      {open && <path d={`M${x - 13} ${y - 24}L${x - 17} ${y - 30}M${x + 13} ${y - 24}L${x + 17} ${y - 30}`} stroke="#713f12" strokeWidth={1.2} />}
    </g>
  );
}

/** one loose page with a tiny table on it */
function LoosePage({ x, y, tilt }: { x: number; y: number; tilt: number }) {
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <g className={POP}>
        <rect x={x - 10} y={y - 13} width={20} height={26} rx={1.5} fill="white" stroke="#94a3b8" strokeWidth={0.8} />
        {[0, 1, 2, 3].map((r) => (
          <path key={r} d={`M${x - 7} ${y - 8 + r * 6}H${x + 7}`} stroke="#94a3b8" strokeWidth={0.6} />
        ))}
        <path d={`M${x} ${y - 10}V${y + 10}`} stroke="#94a3b8" strokeWidth={0.6} />
      </g>
    </g>
  );
}

export function BagPages({}: Story) {
  const s = useScene(3, [700, 1800, 2400, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সামিন দালাল ভাইয়ের ব্যাগ খুললো, ভিতরে পাঁচটা আলগা পাতা, প্রতিটায় ছোট একটা table">
        <CastPerson who="karim" x={62} y={S1_GROUND} facing={1} arm={k === 2 ? "point" : "down"} mood={k >= 2 ? "shout" : "plain"} />
        <NameTag x={62} y={S1_GROUND + 14} name="দালাল ভাই" />
        {k === 2 && <Bubble x={62} y={S1_GROUND - 68} side="right" lines={["ওইগুলা ধইরো না মিয়া,", "পুরান কাগজ."]} />}
        <BagProp x={128} y={S1_GROUND} open={k >= 1} />
        {k >= 1 &&
          [-2, -1, 0, 1, 2].map((d, i) => (
            <LoosePage key={d} x={k >= 3 ? 112 + i * 26 : 128 + d * 9} y={k >= 3 ? 30 : S1_GROUND - 40 + Math.abs(d) * 3} tilt={k >= 3 ? 0 : d * 14} />
          ))}
        <CastPerson who="samin" x={k >= 1 ? 172 : 250} y={S1_GROUND} facing={-1} walking={k === 1} arm={k >= 3 ? "hold" : "down"} mood="plain" label />
        {k >= 3 && <Bubble x={172} y={S1_GROUND - 68} side="right" lines={["পাঁচটা পাতা.", "পাঁচটা table."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · Your turn. Five little pages from the dalal's bag; in each, tap the
//     column the others can rebuild — or call "none". A wrong tap turns that
//     column red and bounces; the right one lights the rebuilt column cell by
//     cell.

const PAGES: { name: string; head: string[]; rows: number[][]; extra: number[]; recipe: string; wrongCol: string }[] = [
  {
    name: "ভাড়া, দুইবার লেখা",
    head: ["ভাড়া, টাকা", "ভাড়া, হাজার"],
    rows: [
      [13000, 13],
      [21000, 21],
      [8000, 8],
    ],
    extra: [0, 1],
    recipe: "× 1000. একই ভাড়া, মোটা জামায়. যেকোনো একটা column বাদ দিলেই চলে.",
    wrongCol: "",
  },
  {
    name: "দালাল ভাইয়ের নিজের পাতা",
    head: ["bed", "bath", "মোট ঘর"],
    rows: [
      [2, 1, 3],
      [3, 2, 5],
      [1, 1, 2],
    ],
    extra: [2],
    recipe: "bed + bath. এই পুরা journey যে column নিয়ে.",
    wrongCol: "ওটা তো নিজের মতো বদলায়. বাকি দুইটা ওকে ঠিক করে দেয় না.",
  },
  {
    name: "স্কুলের পাতা",
    head: ["ছেলে %", "মেয়ে %"],
    rows: [
      [60, 40],
      [55, 45],
      [48, 52],
    ],
    extra: [0, 1],
    recipe: "দুইটা মিলে সবসময় 100. একটা জানলেই আরেকটা বানানো যায়.",
    wrongCol: "",
  },
  {
    name: "বাসা কোন দিকে মুখ করা",
    head: ["উত্তর", "দক্ষিণ", "পূর্ব", "পশ্চিম"],
    rows: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
    ],
    extra: [0, 1, 2, 3],
    recipe: "প্রতিটা সারির যোগফল 1. যেকোনো একটা column বাদ দিন, বাকিরা ওকে বানিয়ে দিবে.",
    wrongCol: "",
  },
  {
    name: "শেষ পাতা",
    head: ["bed", "তলা"],
    rows: [
      [2, 3],
      [3, 1],
      [1, 4],
    ],
    extra: [],
    recipe: "দুইটার মধ্যে কোনো নিয়ম নাই. এই পাতায় কেউ বাড়তি না.",
    wrongCol: "কোন column ওকে ঠিক করে দেয়? কেউ না.",
  },
];

export function SpotTheExtra() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [miss, setMiss] = useSeed("miss", 0);
  const [bad, setBad] = useSeed<number | null>("bad", null);
  const [shown, setShown] = useSeed("shown", false);
  const [done, setDone] = useSeed("done", false);
  const p = PAGES[at];
  const lit = (j: number) => shown && p.extra.includes(j);

  const choose = (col: number) => {
    if (shown) return;
    const right = p.extra.length ? p.extra.includes(col) : col === -1;
    if (!right) {
      setBad(col);
      setMiss(miss + 1);
      return;
    }
    setBad(null);
    setShown(true);
    if (at === PAGES.length - 1 && !done) {
      setDone(true);
      pass("বাড়তি মানে: বাকিরা ওকে বানিয়ে দিতে পারে.");
    }
  };
  const next = () => {
    setAt(at + 1);
    setShown(false);
    setBad(null);
    setMiss(0);
  };

  return (
    <>
      <div className="mx-auto max-w-sm text-center text-xs font-semibold text-muted">
        পাতা {at + 1} / {PAGES.length} · {p.name}
      </div>
      <div key={at} className={`${FADE} mx-auto mt-2 w-full max-w-[21rem] rounded-2xl border border-border bg-surface p-3`}>
        <div className="flex gap-1.5">
          {p.head.map((h, i) => (
            <button
              key={h}
              type="button"
              disabled={shown}
              onClick={() => choose(i)}
              className={`min-w-0 flex-1 cursor-pointer rounded-lg border-2 px-1 py-1 text-[0.7rem] font-semibold transition-colors disabled:cursor-default ${
                lit(i) ? "border-accent bg-accent text-accent-foreground" : bad === i ? "border-danger bg-danger/10 text-danger" : "border-border hover:border-accent"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
        {p.rows.map((r, i) => (
          <div key={i} className="mt-1.5 flex gap-1.5">
            {r.map((v, j) => (
              <span
                key={j}
                className={`min-w-0 flex-1 rounded-lg py-1.5 text-center font-mono text-[0.9rem] transition-colors duration-300 motion-reduce:transition-none ${
                  lit(j) ? "bg-accent/15 font-semibold text-accent-text" : bad === j ? "bg-danger/10 text-danger" : "bg-foreground/[0.04]"
                }`}
                style={{ transitionDelay: lit(j) ? `${i * 200}ms` : "0ms" }}
              >
                {v}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-2 max-w-[21rem]">
        <button
          type="button"
          disabled={shown}
          onClick={() => choose(-1)}
          className={`w-full cursor-pointer rounded-xl border-2 px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-default ${
            shown && p.extra.length === 0
              ? "border-accent bg-accent text-accent-foreground"
              : bad === -1
                ? "border-danger bg-danger/10 text-danger"
                : "border-dashed border-muted/50 text-muted hover:border-accent"
          }`}
        >
          কোনোটাই বাড়তি না
        </button>
      </div>
      {miss > 0 && !shown ? (
        <Nope key={`${at}-${miss}`}>
          {p.wrongCol && bad !== -1 ? p.wrongCol : miss === 1 ? "এই পাতার একটা column কখনো চমকায় না. ওটা খুঁজুন." : "আরেকবার দেখুন: একটা column-কে বাকিরা বেঁধে রেখেছে."}
        </Nope>
      ) : null}
      {shown ? (
        <>
          <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-4 py-2 text-center text-[0.9rem] leading-snug text-accent-text`}>{p.recipe}</div>
          {at < PAGES.length - 1 ? (
            <div className="mt-2 flex justify-center">
              <button type="button" onClick={next} className={primaryBtn}>
                পরের পাতা
              </button>
            </div>
          ) : null}
        </>
      ) : null}
      <Task done={done}>পাঁচটা পাতা. প্রতিটায় যে column-কে বাকিরা বানিয়ে দিতে পারে, সেটায় tap করুন. নয়তো বলুন কোনোটাই বাড়তি না.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the trap page beside the
//      dalal's page. On the dalal's page, total minus (bed + bath) is 0 on
//      every row — it never surprises you. On the last page, floor minus bed
//      jumps about: 1, −2, 3. Two honest facts.

const TP9_SAY = [
  "দালাল ভাইয়ের পাতা আর শেষ পাতা, পাশাপাশি.",
  "দালালের পাতায় মোট ঘর থেকে (bed + bath) বাদ দিলে 0, 0, 0. ওই column কখনো চমকায় না.",
  "শেষ পাতায় তলা থেকে bed বাদ দিলে 1, তারপর −2, তারপর 3. লাফাচ্ছে.",
  "Bed আর তলার মধ্যে কোনো নিয়ম নাই. দুইটাই সৎ তথ্য, কোনোটাই বাড়তি না.",
];

function MiniPage({ head, rows, test, on, good }: { head: string[]; rows: number[][]; test: (r: number[]) => number; on: boolean; good: boolean }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-border bg-surface p-1.5">
      <div className="flex gap-0.5 text-[0.6rem] font-semibold leading-tight text-muted">
        {head.map((h) => (
          <span key={h} className="min-w-0 flex-1 truncate text-center">
            {h}
          </span>
        ))}
        <span className="w-7 shrink-0 text-center">ফাঁক</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="mt-0.5 flex gap-0.5">
          {r.map((v, j) => (
            <span key={j} className="min-w-0 flex-1 rounded bg-foreground/[0.04] text-center font-mono text-[0.75rem] leading-snug">
              {v}
            </span>
          ))}
          <span
            className={`w-7 shrink-0 rounded text-center font-mono text-[0.75rem] leading-snug ${on ? `${FADE} ${good ? "bg-accent/10 text-accent-text" : "bg-cat-amber/15 text-[#8a5a00]"}` : ""}`}
            style={on ? { transitionDelay: `${i * 250}ms` } : undefined}
          >
            {on ? sg(test(r)) : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrapPage() {
  const s = useScene(3, [700, 2400, 2400, 2000]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{TP9_SAY[k]}</span>}>
      <div className="mx-auto flex w-full max-w-[18rem] gap-2">
        <MiniPage head={["bed", "bath", "মোট"]} rows={PAGES[1].rows} test={(r) => r[2] - r[0] - r[1]} on={k >= 1} good />
        <div className={`min-w-0 flex-1 rounded-lg transition-shadow duration-300 motion-reduce:transition-none ${k >= 3 ? "ring-2 ring-accent" : ""}`}>
          <MiniPage head={PAGES[4].head} rows={PAGES[4].rows} test={(r) => r[1] - r[0]} on={k >= 2} good={false} />
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for the Try it's setup, no task: Abbu looks for a pen;
//      Fahim fiddles with the phone, refreshes once, and the app says a
//      bathroom costs 0 taka. Which knob-set it used stays for the widget.

export function FreeRefresh({}: Story) {
  const s = useScene(2, [700, 1600, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="আব্বু কলম খুঁজছেন; ফাহিম phone-এ একবার refresh দিলো, app বললো বাথরুমের দাম 0 টাকা">
        <RTable x0={14} x1={86} y={112} />
        <CastPerson who="mama" x={70} y={S1_GROUND} facing={-1} arm="point" mood="puzzled" />
        <NameTag x={70} y={S1_GROUND + 14} name="আব্বু" />
        <CastPerson who="fahim" x={172} y={S1_GROUND} facing={-1} arm="hold" mood={k >= 2 ? "puzzled" : "plain"} label />
        <PhoneCard x={150} y={S1_GROUND - 48} says={k >= 2 ? "0" : k === 1 ? "···" : "rent app"} />
        {k === 1 && (
          <g key="r" className={POP}>
            <path d="M143 84a8 8 0 1 1 3 7" fill="none" stroke="#0f766e" strokeWidth={2} strokeLinecap="round" />
            <path d="M141 88l2 -5l4 3.5Z" fill="#0f766e" />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <rect x={206} y={16} width={84} height={80} rx={10} fill="#0f172a" />
            <rect x={212} y={23} width={72} height={64} rx={4} fill="#e2e8f0" />
            <text x={248} y={40} textAnchor="middle" fontSize={9} fontWeight={700} fill="#475569">
              বাথরুম
            </text>
            <text x={248} y={62} textAnchor="middle" fontSize={16} fontWeight={700} fill="#0f766e" fontFamily="ui-monospace, monospace">
              0
            </text>
            <text x={248} y={79} textAnchor="middle" fontSize={9} fontWeight={700} fill="#0f766e">
              টাকা. ফ্রি.
            </text>
            <path d="M206 80L164 98" stroke="#0f172a" strokeWidth={1} strokeDasharray="2 2" />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · Try it: after a refresh the app says a bathroom costs 0 taka. Which
//     knob-set (bed, bath, total) would still price all six flats right?
//     Three knob cards; the pick runs the app, and six bars grow to the rents
//     it gives against the khata's marks. A wrong set's bars fall short and go
//     red; the right one lands on every mark.

const X7_SETS: number[][] = [
  [5, 0, 0],
  [2, 0, 3],
  [2, 0, 2],
];
const X7_RIGHT = 1;
const X7_NOPE = [
  "শুধু bath-এর knob 0 করলেন. ওই 3 হাজার কেউ ফেরত দিলো না. তাই প্রতিটা flat ছোট পড়লো, যত bath তত হাজার.",
  "",
  "Bed আর bath থেকে 3 করে কমালেন, কিন্তু মোট ঘর ফেরত দিলো 2 করে. প্রতিটা flat ঘর প্রতি 1 হাজার ছোট পড়লো.",
];
const X7_Y = (rent: number) => 104 - rent * 3.3;

/** three tiny knob sliders for one knob-set, the bath one in coral */
function X7Knobs({ set }: { set: number[] }) {
  return (
    <svg viewBox="0 0 48 30" className="h-8 w-auto shrink-0" aria-hidden="true">
      {set.map((v, i) => {
        const y = 5 + i * 10;
        const x = 6 + ((v + 2) / 7) * 36;
        return (
          <g key={i}>
            <path d={`M6 ${y}H42`} strokeWidth={2} strokeLinecap="round" className="stroke-foreground/15" />
            <circle cx={x} cy={y} r={3.2} className={i === 1 ? "fill-cat-coral" : "fill-cat-blue"} />
          </g>
        );
      })}
    </svg>
  );
}

export function FreeBath() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const right = pick === X7_RIGHT;
  const target = FLATS.map((_, i) => (pick === null ? 0 : knobRent(X7_SETS[pick], i)));
  const h = useTween(target, 900);

  const choose = (i: number) => {
    if (right) return;
    setPick(i);
    if (i === X7_RIGHT) pass("বাথরুম 0 টাকা, তবু ছয়টা ভাড়াই মিললো.");
    else setMiss((m) => m + 1);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[17rem]">
        <svg viewBox="0 0 240 124" className="h-auto w-full" role="img" aria-label="ছয়টা flat-এর ভাড়ার bar, খাতার দাগের পাশে">
          <path d="M10 104H232" strokeWidth={1} className="stroke-foreground/30" />
          {FLATS.map((f, i) => {
            const x = 22 + i * 36;
            const ok = pick !== null && target[i] === f.rent;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={X7_Y(Math.max(h[i], 0))}
                  width={22}
                  height={104 - X7_Y(Math.max(h[i], 0))}
                  rx={2}
                  className={pick === null ? "fill-foreground/10" : ok ? "fill-cat-teal/70" : "fill-cat-coral/70"}
                />
                <path d={`M${x - 4} ${X7_Y(f.rent)}H${x + 26}`} strokeWidth={2} strokeDasharray="3 2" className="stroke-[#0f1b2d]" />
                <text x={x + 11} y={X7_Y(f.rent) - 4} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" className="fill-foreground">
                  {f.rent}
                </text>
                <text x={x + 11} y={116} textAnchor="middle" fontSize={8} className="fill-muted">
                  {`flat ${i + 1}`}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="-mt-0.5 text-center text-[0.7rem] leading-tight text-muted">দাগ = খাতার ভাড়া · bar = app-এর ভাড়া (হাজার টাকা)</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {X7_SETS.map((set, i) => (
          <Choice key={i} n={i} look={pick === i ? (i === X7_RIGHT ? "right" : "wrong") : "idle"} disabled={right} onClick={() => choose(i)}>
            <span className="flex flex-col items-start gap-0.5">
              <X7Knobs set={set} />
              <span className="whitespace-nowrap font-mono text-[0.7rem] leading-tight">({set.join(",")})</span>
            </span>
          </Choice>
        ))}
      </div>
      {pick !== null && !right ? <Nope key={miss}>{X7_NOPE[pick]}</Nope> : null}
      {right ? (
        <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-3 py-1.5 text-center text-[0.85rem] leading-snug text-accent-text`}>
          Bed আর bath থেকে 3 করে কমলো, মোট ঘর প্রতি ঘরে 3 ফেরত দিলো. বাথরুম ফ্রি, তবু একটা ভাড়াও নড়ে নাই.
        </div>
      ) : null}
      <Task done={right}>কোন knob-set (bed, bath, মোট ঘর) চালালে ছয়টা bar-ই খাতার দাগে গিয়ে থামে? বেছে app চালান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for the Try it's explanation, no task: the whole family of
//      knob-sets (5 − c, 3 − c, c), c = 0 … 5, laid out in a row. Morning,
//      the reader's own set, the free bathroom, evening — the bathroom price
//      slides from +3000 to −2000 while every set still fits every flat.

const X7F_SAY = [
  "সকালের set, c = 0. একটা বাথরুম +3000.",
  "c = 1: আপনার হাতে বানানো set. বাথরুম +2000.",
  "c = 3: এইমাত্রের ফ্রি বাথরুম.",
  "c = 5: সন্ধ্যার set. বাথরুম −2000.",
  "প্রতিটা set ছয়টা flat-এই হুবহু মিলে. মাঝের ভগ্নাংশগুলাও মিলে. App যেকোনোটা তুলে নিতে পারে.",
];

export function KnobFamily() {
  const s = useScene(4, [700, 1800, 1800, 1800, 2400]);
  const k = s.k;
  const upTo = [0, 1, 3, 5, 5][k];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X7F_SAY[k]}</span>}>
      <div className="mx-auto grid w-full max-w-[18rem] grid-cols-[2.8rem_repeat(6,1fr)] gap-x-1 gap-y-0.5 text-center">
        <span />
        {[0, 1, 2, 3, 4, 5].map((c) => (
          <span key={c} className="font-mono text-[0.65rem] text-muted">
            c={c}
          </span>
        ))}
        {["bed", "bath", "মোট ঘর"].map((lab, row) => (
          <div key={lab} className="contents">
            <span className="text-right text-[0.65rem] font-semibold leading-snug text-muted">{lab}</span>
            {[0, 1, 2, 3, 4, 5].map((c) => {
              const v = [5 - c, 3 - c, c][row];
              const on = c <= upTo;
              return (
                <span
                  key={c}
                  className={`rounded font-mono text-[0.75rem] leading-snug transition-opacity duration-300 motion-reduce:transition-none ${on ? "" : "opacity-0"} ${
                    row === 1 ? "bg-cat-coral/10 font-semibold text-cat-coral" : "bg-foreground/[0.04]"
                  }`}
                >
                  {sg(v)}
                </span>
              );
            })}
          </div>
        ))}
        <span className="text-right text-[0.65rem] font-semibold leading-snug text-muted">বাথরুম</span>
        {[0, 1, 2, 3, 4, 5].map((c) => (
          <span
            key={c}
            className={`font-mono text-[0.6rem] font-semibold leading-snug text-cat-coral transition-opacity duration-300 motion-reduce:transition-none ${c <= upTo ? "" : "opacity-0"}`}
          >
            {c < 3 ? "+" : ""}
            {sg((3 - c) * 1000)}
          </span>
        ))}
        <span />
        {[0, 1, 2, 3, 4, 5].map((c) => (
          <span key={c} className="text-[0.6rem] leading-snug">
            {k >= 4 ? (
              <span className={`${POP} inline-block rounded-full bg-accent/15 px-1 text-accent-text`} style={{ transitionDelay: `${c * 120}ms` }}>
                মিলে
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for the finale's setup, no task: evening, the pen is out,
//      the dalal waits — and Abbu wants one column crossed off first. The
//      dalal asks, in his own words, whether that lowers the rent.

/** a paper label held up, in Bangla (cast Card is monospace, for tuples) */
function PaperTag({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 6 + 14;
  return (
    <g className={POP}>
      <rect x={x - w / 2} y={y - 9} width={w} height={18} rx={3} fill="white" stroke="#be123c" strokeWidth={1.4} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#be123c">
        {text}
      </text>
      <path d={`M${x - w / 2 + 3} ${y}H${x + w / 2 - 3}`} stroke="#be123c" strokeWidth={1.4} />
    </g>
  );
}

export function AbbuSigns({}: Story) {
  const s = useScene(3, [700, 2400, 2200, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="সন্ধ্যা: আব্বুর হাতে কলম, দালাল ভাই অপেক্ষা করছেন, ফাহিম খাতা থেকে মোট ঘরের column কেটে দিলো">
        <CastPerson who="mama" x={96} y={S1_GROUND} facing={1} arm="hold" mood="plain" />
        <NameTag x={96} y={S1_GROUND + 14} name="আব্বু" />
        {k === 1 && <Bubble x={96} y={S1_GROUND - 68} side="mid" lines={["sign-এর আগে খাতায়", "ছোট একটা অপারেশন."]} />}
        <CastPerson who="fahim" x={184} y={S1_GROUND} facing={-1} arm={k >= 2 ? "hold" : "down"} mood="plain" label />
        {k >= 2 && <PaperTag x={184} y={S1_GROUND - 80} text="মোট ঘর" />}
        {k === 2 && <Bubble x={184} y={S1_GROUND - 92} side="mid" lines={["এইটা. বাদ."]} />}
        <CastPerson who="karim" x={252} y={S1_GROUND} facing={-1} mood={k >= 3 ? "puzzled" : "smug"} />
        <NameTag x={252} y={S1_GROUND + 14} name="দালাল ভাই" />
        {k >= 3 && <Bubble x={252} y={S1_GROUND - 68} side="left" lines={["ঘর বাদ দিলে", "ভাড়া কমবো নাকি?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · The finale. Delete the total-rooms column, rerun the app, watch 3000
//     come out every time — then settle the sealed bet and Abbu's choice.

export function RerunApp() {
  const pass = useGate();
  const [del, setDel] = useSeed("del", false);
  const [runs, setRuns] = useSeed("runs", 0);
  const [settled, setSettled] = useSeed("settled", false);
  const ranAll = runs >= 3;

  const run = () => setRuns(runs + 1);
  const settle = () => {
    setSettled(true);
    pass("Column বাদ, এখন প্রতিবার 3000.");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[21rem] rounded-2xl border border-border bg-surface p-2.5">
        <div className="grid grid-cols-[1fr_1fr_1.2fr_1fr] gap-1 text-[0.7rem] font-semibold leading-none text-muted">
          <span className="text-center">bed</span>
          <span className="text-center">bath</span>
          <span className={`text-center transition-opacity duration-500 motion-reduce:transition-none ${del ? "line-through opacity-40" : ""}`}>মোট ঘর</span>
          <span className="text-center">ভাড়া</span>
        </div>
        {FLATS.map((f, i) => (
          <div key={i} className="mt-0.5 grid grid-cols-[1fr_1fr_1.2fr_1fr] items-center gap-1">
            <span className="rounded-lg bg-foreground/[0.04] py-0.5 text-center font-mono text-[0.85rem] leading-tight">{f.bed}</span>
            <span className="rounded-lg bg-foreground/[0.04] py-0.5 text-center font-mono text-[0.85rem] leading-tight">{f.bath}</span>
            <span
              className={`rounded-lg py-0.5 text-center font-mono text-[0.85rem] leading-tight transition-opacity duration-500 motion-reduce:transition-none ${
                del ? "text-muted line-through opacity-40" : "bg-foreground/[0.04]"
              }`}
              style={{ transitionDelay: del ? `${i * 120}ms` : "0ms" }}
            >
              {f.total}
            </span>
            <span className="rounded-lg bg-foreground/[0.04] py-0.5 text-center font-mono text-[0.85rem] leading-tight">{f.rent}</span>
          </div>
        ))}
        {!del ? (
          <button
            type="button"
            onClick={() => setDel(true)}
            className="mt-2 w-full cursor-pointer rounded-xl border-2 border-dashed border-cat-coral/50 px-3 py-1 text-[0.8rem] font-semibold leading-tight text-cat-coral hover:border-cat-coral"
          >
            মোট ঘর: এই column টা বাদ দিন
          </button>
        ) : null}
      </div>
      {del && !ranAll ? (
        <>
          <div className="mt-2 flex justify-center">
            <button type="button" onClick={run} className={primaryBtn}>
              App চালান, {Math.min(runs + 1, 3)} / 3 বার
            </button>
          </div>
          {runs > 0 ? (
            <div className="mt-1.5 grid gap-1">
              {Array.from({ length: runs }, (_, i) => (
                <div key={i} className={`${POP} mx-auto max-w-sm rounded-xl bg-accent/10 px-3 py-0.5 text-center font-mono text-[0.75rem] leading-tight text-accent-text`}>
                  {`run ${i + 1}: knob (5, 3) · বাথরুম 3000`}
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
      {del && ranAll ? (
        <>
          <div className={`${FADE} mx-auto mt-1.5 max-w-sm rounded-2xl border border-border bg-surface px-3 py-1 text-[0.85rem] leading-snug`}>
            <div className="font-semibold">আজকের লিস্টের দুইটা flat</div>
            <div className="mt-0.5 grid grid-cols-2 gap-1 font-mono text-[0.72rem] leading-tight">
              <span>A: 3 bed, 1 bath · 18000</span>
              <span>B: 3 bed, 2 bath · 22000</span>
            </div>
            <div className="mt-0.5 text-[0.8rem] text-muted">একটা বাথরুম বেশি, দাম 4000 বেশি. বাথরুমের দাম 3000. তাহলে B-র দামের 1000 শুধু শুধু চাওয়া. আব্বু A নিলেন.</div>
          </div>
          {!settled ? (
            <div className="mt-1.5 flex justify-center">
              <button type="button" onClick={settle} className={quietBtn}>
                বাজি মিলান
              </button>
            </div>
          ) : (
            <div className={`${FADE} mx-auto mt-1.5 max-w-sm rounded-2xl bg-accent/10 px-3 py-1.5 text-center text-[0.85rem] leading-snug text-accent-text`}>
              কোনো সংখ্যারই মানে ছিল না. দুইটা knob-set-ই মিলতো, app শুধু একটা তুলে নিচ্ছিল. Column বাদ দেওয়ার পর: 3000, প্রতিবার.
            </div>
          )}
        </>
      ) : null}
      <Task done={settled}>বাড়তি column টা বাদ দিন, app তিনবার চালান, তারপর বাজি মিলান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for the finale's explanation, no task: KnobShuffle again, with
//      the total knob gone. Take 1 off bed and bath and flat 1 falls to 10 —
//      nothing pays it back — so the knobs slide home to (5, 3).

const S11F_SAY = [
  "মোট ঘরের column নাই, তাই knob-গুলার credit সরানোর জায়গাও নাই.",
  "Bed আর bath থেকে 1 কমান. flat 1 নেমে যায় 10-এ. ফেরত দিবে কে? মোট ঘরের knob তো নাই.",
  "App তাই প্রতিবার (5, 3)-এ ফেরে: একটা বাথরুম ঠিক 3000.",
];

export function NoRoomToShuffle() {
  const s = useScene(2, [700, 2400]);
  const k = s.k;
  const v = useTween(k === 1 ? [4, 2] : [5, 3], 1200);
  const r = v.map(Math.round);
  const rent = r[0] * 2 + r[1] * 1;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S11F_SAY[k]}</span>}>
      <div className="mx-auto flex max-w-[16rem] items-start justify-center gap-5">
        {["bed", "bath"].map((lab, i) => (
          <div key={lab} className="text-center">
            <div className="text-xs font-semibold text-muted">{lab}</div>
            <div className="relative mx-auto mt-1.5 h-1.5 w-14 rounded-full bg-foreground/10">
              <span aria-hidden="true" className="absolute top-1/2 left-1/2 h-3 w-px -translate-y-1/2 bg-foreground/25" />
              <span
                aria-hidden="true"
                className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cat-blue ring-2 ring-white"
                style={{ left: `${((v[i] + 2) / 7) * 100}%` }}
              />
            </div>
            <div className="mt-1.5 font-mono text-sm font-semibold">{r[i]}</div>
          </div>
        ))}
        <div className="text-center opacity-40">
          <div className="text-xs font-semibold text-muted line-through">মোট ঘর</div>
          <div className="mx-auto mt-1.5 h-1.5 w-14 rounded-full border border-dashed border-muted/60" />
          <div className="mt-1.5 text-xs text-muted">নাই</div>
        </div>
      </div>
      <div className="mt-3 text-center font-mono text-sm">
        {term(r[0], 2)} + {term(r[1], 1)} = <b className={rent === 13 ? "text-accent-text" : "text-danger"}>{rent}</b>
        {rent !== 13 ? <span className="ml-1 text-danger">(খাতা: 13)</span> : null}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8¾ · A figure for the finale's side quest, no task: the bathroom price on a
//      line. With an exact extra column (bed + bath) it can slide anywhere,
//      +3000 to −2000. With a near-copy it doesn't swing — it only shakes in a
//      small band around 3000. The band's width is drawn, not measured.

const S8Q_SAY = [
  "দুইটা খাতা. একটায় মোট ঘর হুবহু bed + bath. আরেকটায় bed + bath, সাথে একটু এদিক ওদিক.",
  "হুবহু বাড়তি column: দাম +3000 থেকে −2000, যেকোনো দিকে যায়.",
  "প্রায়-কপি column দামটাকে যেকোনো দিকে ঘুরিয়ে দেয় না.",
  "তবে কাঁপায়.",
];

const s8x = (p: number) => 18 + ((p + 3000) / 7000) * 172;

export function NearCopyWobble() {
  const s = useScene(3, [700, 2200, 2000, 1800]);
  const k = s.k;
  const exact = useTween([k >= 1 ? -2000 : 3000], 1400, [3000]);
  const rows = [
    { y: 34, name: "মোট ঘর = bed + bath, হুবহু" },
    { y: 84, name: "মোট ঘর ≈ bed + bath, একটু এদিক ওদিক" },
  ];

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S8Q_SAY[k]}</span>}>
      <svg viewBox="0 0 208 106" className="mx-auto block h-auto w-full max-w-[16rem]" role="img" aria-label="হুবহু বাড়তি column-এ বাথরুমের দাম +3000 থেকে −2000 যায়; প্রায়-কপিতে শুধু 3000-এর আশেপাশে কাঁপে">
        {rows.map((r, i) => (
          <g key={r.name}>
            <text x={18} y={r.y - 14} fontSize={7.5} fontWeight={700} className="fill-foreground">
              {r.name}
            </text>
            <path d={`M${s8x(-3000)} ${r.y}H${s8x(4000)}`} stroke="#94a3b8" strokeWidth={1.5} strokeLinecap="round" />
            {[-2000, 0, 3000].map((p) => (
              <g key={p}>
                <path d={`M${s8x(p)} ${r.y - 3}V${r.y + 3}`} stroke="#94a3b8" strokeWidth={1} />
                <text x={s8x(p)} y={r.y + 12} textAnchor="middle" fontSize={7} className="fill-muted" fontFamily="ui-monospace, monospace">
                  {p > 0 ? `+${p}` : sg(p)}
                </text>
              </g>
            ))}
            {i === 0 && k >= 1 && (
              <path className={FADE} d={`M${s8x(-2000)} ${r.y}H${s8x(3000)}`} stroke="#be123c" strokeWidth={3} strokeOpacity={0.35} strokeLinecap="round" />
            )}
            {i === 1 && k >= 3 && <rect className={FADE} x={s8x(2600)} y={r.y - 5} width={s8x(3400) - s8x(2600)} height={10} rx={3} fill="#f59e0b" opacity={0.3} />}
            {i === 1 && k >= 3 && [2700, 3300].map((p) => <circle key={p} cx={s8x(p)} cy={r.y} r={3} fill="#b45309" opacity={0.45} className={POP} />)}
            <circle cx={s8x(i === 0 ? exact[0] : 3000)} cy={r.y} r={4} fill={i === 0 ? "#be123c" : "#b45309"} stroke="white" strokeWidth={1.2} />
          </g>
        ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8b · A story scene for the finale's last paragraph, no task: the dalal goes,
//      and Nasib is at the door with a new three-button remote. The third
//      button is nobody's copy. Is it any use? That stays a question.

function S8BRemote({ x, y }: { x: number; y: number }) {
  return (
    <g className={POP}>
      <rect x={x - 16} y={y - 34} width={32} height={68} rx={7} fill="#1f2937" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x} cy={y - 20 + i * 20} r={6.5} fill={i === 2 ? "#f59e0b" : "#64748b"} />
      ))}
      {[0, 1, 2].map((i) => (
        <text key={`t${i}`} x={x} y={y - 17 + i * 20} textAnchor="middle" fontSize={8} fontWeight={700} fill="white" fontFamily="ui-monospace, monospace">
          {i + 1}
        </text>
      ))}
    </g>
  );
}

export function NasibAtDoor() {
  const s = useScene(3, [700, 2000, 1800, 2000]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="দালাল ভাই চলে গেলেন; দরজায় নাসিব, হাতে তিন button-এর নতুন remote; তিন নম্বর button টা কারো কপি না, সেটা কি কাজের?">
        {/* the door, open once Nasib is in it */}
        <rect x={236} y={62} width={48} height={88} fill={k >= 1 ? "#3f2a17" : "#8b5a2b"} stroke="#6b4423" strokeWidth={2} />
        {k === 0 && <circle cx={276} cy={108} r={2.2} fill="#fbbf24" />}
        <CastPerson who="fahim" x={70} y={S1_GROUND} facing={1} mood="plain" label />
        <CastPerson who="karim" x={k >= 1 ? 350 : 196} y={S1_GROUND} facing={1} walking={k === 1} mood="plain" ms={1600} />
        {k === 0 && <NameTag x={196} y={S1_GROUND + 14} name="দালাল ভাই" />}
        {k >= 1 && <CastPerson who="nasib" x={260} y={S1_GROUND} facing={-1} arm={k >= 2 ? "hold" : "down"} mood="plain" label />}
        {k >= 2 && <S8BRemote x={186} y={70} />}
        {k >= 3 && (
          <g className={POP}>
            <circle cx={212} cy={90} r={9} fill="white" stroke="#b45309" strokeWidth={1.4} />
            <text x={212} y={94} textAnchor="middle" fontSize={11} fontWeight={700} fill="#b45309" fontFamily="ui-monospace, monospace">
              ?
            </text>
            <path d="M203 90H196" stroke="#b45309" strokeWidth={1.2} />
          </g>
        )}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  DalalArrives: { start: { k: 0 }, morning: { k: 1 }, evening: { k: 2 }, end: {} },
  TwoAnswers: { start: {}, picked: { bet: 3 }, morning: { bet: 0 }, both: { bet: 2 }, sealed: { bet: 3, sealed: true } },
  BothFit: { start: { k: 0 }, morning: { k: 1 }, evening: { k: 2 }, end: {} },
  AreaTwice: { start: {}, wrong: { wrong: 0, miss: 1 }, half: { wrong: 2, miss: 2 }, one: { filled: [0] }, done: { filled: [0, 1, 2] } },
  ThreeFacts: { start: { k: 0 }, facts: { k: 1 }, rebuild: { k: 2 }, end: {} },
  TotalColumn: { start: {}, wrong: { rule: 0 }, none: { rule: 3 }, right: { rule: 1 } },
  BuiltRowByRow: { start: { k: 0 }, half: { k: 1 }, full: { k: 2 }, end: {} },
  KnobCards: { start: { k: 0 }, dalal: { k: 1 }, abbu: { k: 2 }, end: {} },
  TwoKnobSets: { start: {}, mid: { at: 2 }, done: { at: 5, done: true } },
  KnobShuffle: { start: { k: 0 }, mid: { k: 1 }, end: {} },
  YourShuffle: { start: {}, ran: { ran: true }, mid: { ran: true, knobs: [4, 2, 0] }, done: { ran: true, knobs: [4, 2, 1], done: true } },
  SlowSum: { start: { k: 0 }, bed: { k: 1 }, bath: { k: 2 }, back: { k: 3 }, end: {} },
  BagPages: { start: { k: 0 }, open: { k: 1 }, dalal: { k: 2 }, end: {} },
  SpotTheExtra: { start: {}, wrong: { at: 1, miss: 1, bad: 0 }, page2: { at: 1, shown: true }, trap: { at: 4 }, trapWrong: { at: 4, miss: 1, bad: 1 }, done: { at: 4, shown: true, done: true } },
  TrapPage: { start: { k: 0 }, dalal: { k: 1 }, last: { k: 2 }, end: {} },
  FreeBath: { start: {}, bathOnly: { pick: 0 }, short: { pick: 2 }, right: { pick: 1 } },
  KnobFamily: { start: { k: 0 }, yours: { k: 1 }, free: { k: 2 }, evening: { k: 3 }, end: {} },
  AbbuSigns: { start: { k: 0 }, abbu: { k: 1 }, fahim: { k: 2 }, end: {} },
  RerunApp: { start: {}, deleted: { del: true }, runs: { del: true, runs: 1 }, ready: { del: true, runs: 3 }, done: { del: true, runs: 3, settled: true } },
  NoRoomToShuffle: { start: { k: 0 }, drop: { k: 1 }, end: {} },
  RemoteBRecall: { start: { k: 0 }, arrows: { k: 1 }, line: { k: 2 }, end: {} },
  KhataOpens: { start: { k: 0 }, open: { k: 1 }, page: { k: 2 }, end: {} },
  SaminSquints: { start: { k: 0 }, bed: { k: 1 }, bath: { k: 2 }, changes: { k: 3 }, end: {} },
  TwoApps: { start: { k: 0 }, good: { k: 1 }, morning: { k: 2 }, end: {} },
  ThirdSet: { start: { k: 0 }, yours: { k: 1 }, end: {} },
  FreeRefresh: { start: { k: 0 }, refresh: { k: 1 }, end: {} },
  NearCopyWobble: { start: { k: 0 }, exact: { k: 1 }, near: { k: 2 }, end: {} },
  NasibAtDoor: { start: { k: 0 }, door: { k: 1 }, remote: { k: 2 }, end: {} },
};
