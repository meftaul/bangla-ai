"use client";

import {
  Choice,
  FADE,
  Nope,
  Scene,
  Stepper,
  Ticks,
  pill,
  primaryBtn,
  quietBtn,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
} from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person as CastPerson, Stage, StoryFrame } from "@/components/journey/cast";
import { Arrow, Dot, Label, Plane, Star, makeFrame, same, sg, snap, tup, type Frame, type XY } from "@/components/journey/plane";
import { ButtonRemote, Chains, Recipe, SHELF, land, type Key } from "./remote-journey";
import { Shiku } from "./arrow-journey";
import { Task, useGate } from "@/components/journey/journey";

// Screens for "Math for AI 5.2 — The extra column, what a bathroom is worth",
// told as a Journey, in English (the pathshala-journey-en twin of 5.1).
//
// Day two of moving week. Two flats left on the dalal's list, one extra
// bathroom and 4000 taka apart, so Abbu asks the only question that matters:
// what is one bathroom worth? The dalal's app said 3000 in the morning and
// −2000 by evening, on the same ledger. The reader seals a bet on which
// reading to believe, then digs the answer out of the khata itself: a column
// that is just another column in a new unit (sq ft / sq m), a column that
// isn't a copy but is built from the other two (total = bed + bath), two
// knob-sets that price all six flats identically — and, back on 5.1's remotes,
// the zero test that tells an extra button from a needed one. The finale
// deletes the total column, reruns the app, and settles the bet.
//
// The remote machine is 5.1's (remote-journey.tsx), so the remote looks the
// same as yesterday; this file draws its own door mark with an English label.
//
// Watch-only figures: the credit shuffling between knobs while no rent moves
// (KnobShuffle), the twin remote's walk home (WalkHome), and the recap pair no
// multiple can reach (TwoArrowsTest). Story scenes: the dalal's two readings
// (DalalArrives) and Abbu's pen (AbbuSigns).
//
// Tailwind only; the sheets are journey/plane. Ink on white sheets is fixed.

const O: XY = [0, 0];
/** one decimal, for square metres */
const r1 = (n: number) => Math.round(n * 10) / 10;
/** a knob term like 5·2 or −2·1, real minus */
const term = (k: number, v: number) => `${k < 0 ? "−" : ""}${Math.abs(k)}·${v}`;

/** A story scene takes `story` and ignores it (see journey.tsx). */
type Story = { story?: boolean };

/** The door corner, labelled in English — 5.1's Door says দরজা. */
function DoorMark({ f }: { f: Frame }) {
  return (
    <g className="pointer-events-none">
      <circle cx={f.sx(0)} cy={f.sy(0)} r={3.6} className="fill-[#0f1b2d]" />
      <text x={f.sx(0) - 5} y={f.sy(0) + 12} textAnchor="end" fontSize={8} fontWeight={700} className="fill-[#5a6b7d]">
        door
      </text>
    </g>
  );
}

/** A name under someone's feet — cast labels are Bangla, so English ones are drawn here. */
function NameTag({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={7} fontWeight={700} className="fill-[#5a6b7d]" pointerEvents="none">
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
// 0a · A story scene for screen 1's setup, no task: the dalal's app speaks
//      twice. Morning, six flats: one bathroom, +3000. Evening, one more flat
//      in the ledger: −2000. Abbu smells trouble; the widget seals the bet.

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
      <Stage backdrop="room" label="the dalal's rent app says +3000 per bathroom in the morning, and −2000 by evening, on the same ledger">
        <CastPerson who="karim" x={96} y={S1_GROUND} facing={1} arm={k >= 1 ? "point" : "down"} mood={k >= 2 ? "puzzled" : "smug"} />
        <NameTag x={96} y={S1_GROUND + 13} name="dalal" />
        <PhoneCard x={124} y={S1_GROUND - 44} says={k === 0 ? "rent app" : k === 1 ? "+3000" : "−2000"} />
        {k >= 2 && <CastCard x={158} y={S1_GROUND - 62} text="+1 flat" tone="amber" />}
        {k === 1 && <Bubble x={96} y={S1_GROUND - 68} side="mid" lines={["One bathroom:", "3 thousand taka."]} />}
        {k === 2 && <Bubble x={96} y={S1_GROUND - 68} side="mid" lines={["One more flat in,", "now it says −2000?"]} />}
        <CastPerson who="mama" x={184} y={S1_GROUND} facing={-1} mood={k >= 2 ? "puzzled" : "plain"} />
        <NameTag x={184} y={S1_GROUND + 13} name="Abbu" />
        {k >= 3 && <Bubble x={184} y={S1_GROUND - 68} side="mid" lines={["A bathroom that makes", "a flat cheaper?"]} />}
        <CastPerson who="fahim" x={248} y={S1_GROUND} facing={-1} mood={k >= 1 ? "puzzled" : "plain"} />
        <NameTag x={248} y={S1_GROUND + 13} name="Fahim" />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet. Four answers to "which number should Abbu believe?",
//     and no marking: the bet is settled only in the Finale, six screens of
//     khata later.

const BET = ["3000 was the right price", "−2000 was the right price", "both are somehow right", "neither number means anything"];

export function TwoAnswers() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);

  const seal = () => {
    setSealed(true);
    pass("The bet is sealed. Now the ledger.");
  };

  return (
    <>
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
        <div className="rounded-xl border-2 border-cat-blue/30 bg-cat-blue/5 px-3 py-1.5 text-center">
          <div className="text-xs font-semibold leading-tight text-muted">morning · 6 flats</div>
          <div className="mt-0.5 font-mono text-base font-semibold leading-tight text-cat-blue">+3000</div>
          <div className="text-xs leading-tight text-muted">per bathroom</div>
        </div>
        <div className="rounded-xl border-2 border-cat-coral/30 bg-cat-coral/5 px-3 py-1.5 text-center">
          <div className="text-xs font-semibold leading-tight text-muted">evening · 7 flats</div>
          <div className="mt-0.5 font-mono text-base font-semibold leading-tight text-cat-coral">−2000</div>
          <div className="text-xs leading-tight text-muted">per bathroom</div>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium leading-snug text-muted">Same ledger, same app. Abbu signs tonight — which number should he believe?</div>
      <div className="mt-2 grid gap-1.5">
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
          Sealed. The answer is hiding somewhere in the khata — we’ll dig it out screen by screen, and settle this at the end.
        </div>
      ) : null}
      <Task done={sealed}>Pick your answer and seal it. The marking comes much later.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The khata's first page: each flat's area, written twice — square feet
//     and square metres. Row 1 by hand (which cell could it possibly be?),
//     then the machine fills the rest, and never needs to look at a flat
//     again. Six numbers, three facts.

const AREA_FT = [650, 860, 1050];
const SQM = (n: number) => r1(n / 10.76);
const AREA_OPT = [`${SQM(650)}`, "650", "325"];

export function AreaTwice() {
  const pass = useGate();
  const [filled, setFilled] = useSeed<number[]>("filled", []);
  const [miss, setMiss] = useSeed("miss", 0);
  const done = filled.length === AREA_FT.length;

  const pick = (i: number) => {
    if (filled.length || i === 1) return;
    if (i === 0) setFilled([0]);
    else setMiss(miss + 1);
  };
  const tap = (i: number) => {
    if (filled.includes(i)) return;
    const next = [...filled, i];
    setFilled(next);
    if (next.length === AREA_FT.length) pass("The sq m column: same fact, new coat.");
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
              <span className={`${FADE} rounded-lg bg-accent/10 py-1.5 text-center font-mono font-semibold text-accent-text`}>
                {SQM(ft).toFixed(1)}
              </span>
            ) : i === 0 ? (
              <span className="rounded-lg border-2 border-dashed border-muted/40 py-1.5 text-center font-mono text-muted">?</span>
            ) : (
              <button
                type="button"
                onClick={() => tap(i)}
                className="cursor-pointer rounded-lg border-2 border-dashed border-muted/40 py-1.5 text-center font-mono text-muted hover:border-accent hover:text-foreground"
              >
                tap to fill
              </button>
            )}
          </div>
        ))}
      </div>
      {filled.length === 0 ? (
        <>
          <div className="mt-3 text-sm font-medium text-muted">Row 1 by hand: 1 sq m is 10.76 sq ft, so the machine divides. What must the first sq m cell say?</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {AREA_OPT.map((o, i) => (
              <Choice key={o} n={i} look="idle" disabled={false} onClick={() => pick(i)}>
                <span className="font-mono">{o}</span>
              </Choice>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-3 text-center font-mono text-sm text-muted">
          {filled.includes(1) ? `${AREA_FT[1]} ÷ 10.76 = ${SQM(AREA_FT[1]).toFixed(1)} — it didn't look at the flat.` : ""}
          {filled.includes(1) && filled.includes(2) ? " " : ""}
          {filled.includes(2) ? `${AREA_FT[2]} ÷ 10.76 = ${SQM(AREA_FT[2]).toFixed(1)}.` : ""}
        </div>
      )}
      {miss > 0 && !filled.length ? (
        miss === 1 ? (
          <Nope key={miss}>650 again? A different unit has to change the number — or it’s the same coat.</Nope>
        ) : (
          <Nope key={miss}>Half of 650? Halving isn’t converting. The machine divides by 10.76.</Nope>
        )
      ) : null}
      {done ? (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-accent/10 px-4 py-2.5 text-center text-[0.95rem] text-accent-text`}>
          Six numbers, three facts. Whatever the sq m column could say, the sq ft column had already said.
        </div>
      ) : null}
      <Task done={done}>Fill the sq m column — row 1 by hand, then let the machine do the rest.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Page two: the flats. Bed, bath, total rooms — and total isn't a copy of
//     anything. Four rule cards; the reader picks one and the machine checks
//     it on every row, stopping at the first flat that breaks it.

const RULES = [
  { label: "bed × 2", note: "Flat 1: 2 × 2 = 4. The khata says 3." },
  { label: "bed + bath", note: "" },
  { label: "bath + 1", note: "Flat 1: 1 + 1 = 2. The khata says 3." },
  { label: "no rule at all", note: "Flat 1's total is 3. Something fixed it." },
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
    if (i === 1) pass("Not a copy — but built from the other two.");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[21rem] rounded-2xl border border-border bg-surface p-2.5">
        <div className="grid grid-cols-[1.1rem_0.9fr_0.9fr_0.9fr_1.9fr] gap-1 text-[0.7rem] font-semibold leading-none text-muted">
          <span />
          <span className="text-center">bed</span>
          <span className="text-center">bath</span>
          <span className="text-center">total</span>
          <span className="text-center">{rule === null ? "" : "the rule says"}</span>
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
                  className={`${FADE} whitespace-nowrap rounded-lg py-0.5 text-center font-mono text-[0.75rem] font-semibold leading-tight ${
                    ok ? "bg-accent/10 text-accent-text" : "bg-danger/10 text-danger"
                  }`}
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
            className={`cursor-pointer rounded-xl border-2 px-2.5 py-1.5 font-mono text-[0.8rem] font-semibold leading-tight transition-colors disabled:cursor-default ${
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
          Six rows, six matches. The total column is no copy — but bed and bath rebuild it perfectly.
        </div>
      ) : null}
      <Task done={done}>Find the rule the total column follows, and check it on every row.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The app itself. Two knob cards — the morning one and the evening one —
//     and one button: run them on the next flat. Row after row the rents come
//     out identical, and the reader watches the app's freedom appear.

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
      pass("Two knob-sets, one set of rents.");
    }
  };

  return (
    <>
      <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-2">
        {[MORNING, EVENING].map((knobs, c) => (
          <div key={c} className={`rounded-xl border-2 px-2.5 py-2 ${c === 0 ? "border-cat-blue/30 bg-cat-blue/5" : "border-cat-coral/30 bg-cat-coral/5"}`}>
            <div className="text-center text-xs font-semibold text-muted">
              {c === 0 ? "morning knobs" : "evening knobs"} <span className="font-mono">({knobs.map((k) => sg(k)).join(", ")})</span>
            </div>
            <div className="mt-1.5 text-center font-mono text-[0.8rem] leading-relaxed">{knobLine(knobs, at)}</div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 text-center text-[0.95rem] font-medium text-accent-text">
        Flat {at + 1}: both say {FLATS[at].rent}.
      </div>
      <div className="mt-2.5 flex justify-center">
        <button type="button" onClick={next} className={primaryBtn}>
          {done ? "Done" : at < FLATS.length - 1 ? "Next flat →" : "Run it on flat 6"}
        </button>
      </div>
      <Ticks items={FLATS.map((_, i) => [`flat ${i + 1}`, i < at || done] as [string, boolean])} />
      {done ? (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-accent/10 px-4 py-2.5 text-center text-[0.95rem] text-accent-text`}>
          Six flats, not one taka of difference. The app cannot tell which knob-set is the true one — that’s how it said 3000 one hour and −2000 the next.
        </div>
      ) : null}
      <Task done={done}>Run both knob-sets on all six flats.</Task>
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
          "Morning knobs on flat 1: 5 per bed, 3 per bath, 0 for total. Rent 13."
        ) : k < 3 ? (
          "Shift the credit: take it off bed and bath, pile it onto total — any amount you like."
        ) : (
          <span className={FADE}>Evening knobs (0, −2, 5) — and flat 1’s rent never noticed. No flat’s does.</span>
        )
      }
    >
      <div className="mx-auto flex max-w-[16rem] items-start justify-center gap-5">
        {["bed", "bath", "total"].map((lab, i) => (
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
      pass("Take 3 off the knobs — total pays 3 back.");
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[19rem] rounded-2xl border border-border bg-surface p-3">
        <div className="text-center text-xs font-semibold leading-snug text-muted">
          flat 1 · <span className="font-mono">2</span> bed · <span className="font-mono">1</span> bath · <span className="font-mono">3</span> rooms — khata rent{" "}
          <span className="font-mono">13</span>
        </div>
        {!ran ? (
          <>
            <div className="mt-2 text-center font-mono text-[0.8rem] text-muted">morning knobs (5, 3, 0) · thousands of taka</div>
            <div className="mt-2 flex justify-center">
              <button type="button" onClick={() => setRan(true)} className={primaryBtn}>
                Run them on flat 1
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 text-center font-mono text-[0.75rem] text-muted">
              morning: {knobLine(MORNING, 0)} — exact
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {(["bed", "bath", "total"] as const).map((lab, i) => (
                <div key={lab} className="text-center">
                  <Stepper label={`${lab} knob`} value={knobs[i]} min={SHUF_LIM[i].min} max={SHUF_LIM[i].max} disabled={done} onChange={(v) => turn(i, v)} />
                  <div className="mt-1 text-[0.65rem] font-semibold leading-tight text-muted">{lab === "total" ? "per room" : `per ${lab}`}</div>
                </div>
              ))}
            </div>
            <div className="mt-2.5 text-center font-mono text-sm">
              {term(knobs[0], f.bed)} + {term(knobs[1], f.bath)} + {term(knobs[2], f.total)} ={" "}
              <b className={gap === 0 ? "text-accent-text" : undefined}>{rent}</b>
            </div>
            {!done ? (
              <div className="mt-1 text-center text-[0.85rem] font-medium leading-snug text-muted">
                {!moved
                  ? "Now: 1 off the bed knob, 1 off the bath knob."
                  : gap === 0
                    ? "13 again — though that’s the 2-and-2 shuffle, not your 1-and-1."
                    : gap > 0
                      ? `${gap} short of 13 — the total knob owes ${gap}.`
                      : `${-gap} over 13.`}
              </div>
            ) : null}
          </>
        )}
      </div>
      {done ? (
        <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-4 py-2.5 text-center text-[0.95rem] leading-snug text-accent-text`}>
          −1 per bed took 2, −1 per bath took 1. The total knob pays 3 rooms × 1 — all 3 back, rent 13.
        </div>
      ) : null}
      <Ticks items={[["morning sum", ran], ["shuffle lands on 13", done]]} />
      <Task done={done}>Run the morning knobs, then do the 1-and-1 shuffle — and rescue the rent with the total knob.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Back to 5.1's remotes, and the zero test. Can Shiku press non-zero
//     amounts and still end at the door? The twin remote can; the old one
//     cannot, except by pressing nothing.

const WB_F = makeFrame(-1, 3, -1, 3, 24, 14);
const ZERO_KEYS: Key[][] = [SHELF[1].keys, SHELF[0].keys];
const ZERO_NAME = ["twin remote", "old remote"];

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
    if (t[0] && t[1]) pass("A non-zero walk home: an extra button.");
  };

  return (
    <>
      <div className="mx-auto flex max-w-xs justify-center gap-2">
        {ZERO_NAME.map((n, i) => (
          <button key={n} type="button" onClick={() => setRm(i)} className={pill(rm === i)}>
            {n} <span className="font-mono">{ZERO_KEYS[i].map((k2) => tup(k2.v)).join(" ")}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-start justify-center gap-3">
        <div className="w-[8rem] shrink-0">
          <Plane f={WB_F} grid={1} axes={false} label={`the ${ZERO_NAME[rm]}, Shiku at ${tup(at)}`} className="my-0! max-w-none">
            {dots[rm].map((d) => {
              const p = d.split(",").map(Number) as XY;
              return p[0] === 0 && p[1] === 0 ? null : <Dot key={d} f={WB_F} at={p} r={2.6} className="fill-cat-coral/50" />;
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
          {tick[0] ? (
            <div className={`${FADE} mt-2 text-[0.85rem] leading-snug text-accent-text`}>Twin: 2·u − 1·v = (0, 0). Real presses, straight home.</div>
          ) : null}
          {tick[1] ? (
            <div className={`${FADE} mt-1 text-[0.85rem] leading-snug text-muted`}>Old: only (0, 0) lands home — that’s pressing nothing.</div>
          ) : null}
        </div>
      </div>
      <Ticks items={[["twin walks home", tick[0]], ["old: only nothing", tick[1]]]} />
      <Task done={tick[0] && tick[1]}>
        {rm === 0 ? "On the twin remote: land Shiku back on the door without pressing nothing." : "Now the old remote — try three different non-zero pairs."}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the twin remote's walk
//      home, drawn out — u twice forward, then v once back to the door.

export function WalkHome() {
  const s = useScene(3, [700, 2000, 2200]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "The twin remote's buttons: u = (1, 1) and v = (2, 2)."
        ) : k < 3 ? (
          "Press u twice: (1, 1), then (2, 2) — exactly where v arrives."
        ) : (
          <span className={FADE}>Now v once, backwards: 2·u − 1·v = (0, 0). Home, and the presses weren’t nothing.</span>
        )
      }
    >
      <div className="mx-auto w-[8rem]">
        <Plane f={WB_F} grid={1} axes={false} label="the twin remote walks home on non-zero presses" className="my-0! max-w-none">
          {k >= 3 && <Arrow f={WB_F} from={[2, 2]} to={O} tone="coral" w={2.4} draw />}
          <Arrow f={WB_F} from={O} to={[1, 1]} tone="blue" w={2.4} draw={k === 0} />
          {k >= 2 && <Arrow f={WB_F} from={[1, 1]} to={[2, 2]} tone="blue" w={2.4} draw dashed />}
          <Label f={WB_F} at={[1, 1]} dx={-10} dy={-2} size={9} className="fill-cat-blue font-mono">
            u
          </Label>
          {k >= 2 && (
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
// 7 · The untidy remote, (1, 2) and (2, 5): no visible copy anywhere. First
//     hunt for a non-zero walk home (there isn't one), then step the slot
//     machine that proves it.

const TP_F = makeFrame(-1, 3, -1, 6, 18, 15);
const TRICK_ROWS: { lhs: string; rhs: string; note: string }[] = [
  { lhs: "slot 1: α·1 + β·2 = 0", rhs: "α = −2β", note: "Slot 1 can go back to 0 — as long as α is minus-twice β." },
  { lhs: "slot 2: α·2 + β·5 = 0", rhs: "put α = −2β in: β = 0", note: "−4β + 5β = β. Slot 2 won't hear of it unless β is 0." },
  { lhs: "then α = −2 · 0", rhs: "α = 0", note: "One press dies, both die." },
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
    if (nk > TRICK_ROWS.length) pass("Only (0, 0): independent.");
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={TP_F} grid={1} axes={false} label={`the untidy remote at ${tup(at)}, trying to reach (0, 0)`} className="my-0! max-w-none">
            {tries.map((t) => {
              const p = t.split(",").map(Number) as XY;
              return p[0] === 0 && p[1] === 0 ? null : <Dot key={t} f={TP_F} at={p} r={2.4} className="fill-cat-coral/50" />;
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
              {tries.length > 0 && tries.length < 3 ? (
                <div className="mt-1.5 text-xs text-muted">Tries so far: {tries.length}. None home.</div>
              ) : null}
              {tries.length >= 3 ? (
                <div className="mt-2">
                  <button type="button" onClick={() => setPhase("sum")} className={`${quietBtn} h-9 text-sm`}>
                    Fingers give up — do the sum
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-2xl border border-border px-3 py-2">
              <div className="text-center text-xs font-semibold">α times (1, 2), β times (2, 5) — both slots 0</div>
              <div className="mt-1.5 grid gap-1">
                {TRICK_ROWS.slice(0, k).map((r) => (
                  <div key={r.lhs} className={`${FADE} rounded-xl bg-foreground/[0.04] px-2.5 py-1`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs">{r.lhs}</span>
                      <b className="font-mono text-[0.85rem]">{r.rhs}</b>
                    </div>
                    <div className="text-[0.68rem] leading-snug text-muted">{r.note}</div>
                  </div>
                ))}
              </div>
              {over && (
                <div className={`${FADE} mt-1.5 rounded-xl bg-accent/10 px-2.5 py-1.5 text-center text-[0.85rem] font-medium text-accent-text`}>
                  Only (0, 0). The two buttons are independent.
                </div>
              )}
              {!over && (
                <div className="mt-2 flex justify-center">
                  <button type="button" onClick={step} className={`${primaryBtn} h-9 text-sm`}>
                    {k === 0 ? "Start the sum" : "Next line"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Task done={over}>{phase === "hunt" ? "Try to walk this one home — three honest tries, then the sum." : "Step the sum: can any non-zero pair land home?"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Nasib's idea: add a third button, maybe you get lucky. First find the
//     walk home for w = (2, 3); then drop your own third button anywhere and
//     watch the machine answer instantly, every time. It cannot be won.

const TH_F = makeFrame(-1, 3, -1, 4, 20, 14);
const TH_KEYS: Key[] = [...SHELF[0].keys, { name: "w", v: [2, 3], tone: "teal" }];

export function ThirdButton() {
  const pass = useGate();
  const [phase, setPhase] = useSeed("phase", 1);
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0, 0]);
  const [wAt, setWAt] = useSeed<XY>("wAt", [2, 3]);
  const [placed, setPlaced] = useSeed<string[]>("placed", []);
  const [lastLine, setLastLine] = useSeed("lastLine", "");
  const done = placed.length >= 3;
  const at = phase === 1 ? land(TH_KEYS, amt) : O;

  const press = (i: number, n: number) => {
    const next = amt.map((a, j) => (j === i ? n : a));
    setAmt(next);
    if (next.some((x) => x !== 0) && same(land(TH_KEYS, next), O)) setPhase(2);
  };
  const drop = (p: XY) => {
    if (phase !== 2) return;
    setWAt(snap(p, TH_F));
  };
  const place = () => {
    if (phase !== 2) return;
    const key = `${wAt[0]},${wAt[1]}`;
    if (placed.includes(key)) return;
    const list = [...placed, key];
    setPlaced(list);
    setLastLine(
      key === "0,0"
        ? "w = (0, 0): the zero button. Press it once — home, without going anywhere."
        : `w = (${wAt[0]}, ${wAt[1]}): presses (${sg(-wAt[0])}, ${sg(-wAt[1])}, 1) — home.`,
    );
    if (list.length >= 3) pass("Three on the floor: always one extra.");
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[7rem] shrink-0">
          <Plane
            f={TH_F}
            grid={1}
            axes={false}
            label={phase === 1 ? `three buttons, Shiku at ${tup(at)}` : "drop your own third button anywhere"}
            className="my-0! max-w-none"
            drag={phase === 2 ? { down: drop, move: drop, up: place } : undefined}
          >
            {phase === 1 && <Chains f={TH_F} keys={TH_KEYS} amt={amt} />}
            <Arrow f={TH_F} from={O} to={[1, 0]} tone="blue" w={2.2} />
            <Arrow f={TH_F} from={O} to={[0, 1]} tone="coral" w={2.2} />
            <Arrow f={TH_F} from={O} to={wAt} tone="teal" w={2.2} dashed={phase === 2} />
            <Label f={TH_F} at={wAt} dx={9} dy={3} size={9} className="fill-cat-teal font-mono">
              w
            </Label>
            <Star f={TH_F} at={O} />
            <DoorMark f={TH_F} />
            {phase === 1 && <Shiku f={TH_F} at={at} />}
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          {phase === 1 ? (
            <>
              <Recipe keys={TH_KEYS} amt={amt} hit={same(at, O)} size="text-[0.85rem]" />
              <div className="mt-2">
                <ButtonRemote keys={TH_KEYS} amt={amt} onAmt={press} f={TH_F} min={-3} max={4} />
              </div>
            </>
          ) : (
            <>
              <div className="text-[0.85rem] leading-snug text-muted">Your turn to design one. Drop the third button anywhere on the floor — the machine will find the walk home.</div>
              <div className="mt-2 rounded-xl bg-foreground/[0.04] px-2.5 py-1.5 font-mono text-[0.8rem] leading-relaxed">{lastLine || "w is still (2, 3). Drag it somewhere new."}</div>
              <div className="mt-1.5 text-xs text-muted">
                Your buttons so far: {placed.length ? placed.map((p) => `(${p.replace(",", ", ")})`).join(" · ") : "none yet"} — {3 - placed.length} to go.
              </div>
            </>
          )}
        </div>
      </div>
      <Task done={done}>
        {phase === 1 ? "Find presses for all three buttons that land Shiku back on the door." : "Drop your own third button three times — anywhere at all."}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn. Five little pages from the dalal's bag; in each, tap the
//     column the others can rebuild — or call "none". Wrong taps bounce.

const PAGES: { name: string; head: string[]; rows: number[][]; extra: number[]; recipe: string; wrongCol: string }[] = [
  {
    name: "the rent, written twice",
    head: ["rent, taka", "rent, thousands"],
    rows: [
      [13000, 13],
      [21000, 21],
      [8000, 8],
    ],
    extra: [0, 1],
    recipe: "× 1000 — the same rent in a thicker coat. Either column goes.",
    wrongCol: "",
  },
  {
    name: "the dalal's own page",
    head: ["bed", "bath", "total rooms"],
    rows: [
      [2, 1, 3],
      [3, 2, 5],
      [1, 1, 2],
    ],
    extra: [2],
    recipe: "bed + bath — the column this whole journey was about.",
    wrongCol: "That one changes freely — the other two don't decide it.",
  },
  {
    name: "the school's page",
    head: ["boys %", "girls %"],
    rows: [
      [60, 40],
      [55, 45],
      [48, 52],
    ],
    extra: [0, 1],
    recipe: "They always add to 100 — either one rebuilds the other.",
    wrongCol: "",
  },
  {
    name: "the facing page",
    head: ["north", "south", "east", "west"],
    rows: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
    ],
    extra: [0, 1, 2, 3],
    recipe: "Each row adds to 1 — drop any one column, the rest rebuild it.",
    wrongCol: "",
  },
  {
    name: "the last page",
    head: ["bed", "floor"],
    rows: [
      [2, 3],
      [3, 1],
      [1, 4],
    ],
    extra: [],
    recipe: "No rule between them — nothing on this page is extra.",
    wrongCol: "Which other column decides that one? Neither does.",
  },
];

export function SpotTheExtra() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [miss, setMiss] = useSeed("miss", 0);
  const [shown, setShown] = useSeed("shown", false);
  const [done, setDone] = useSeed("done", false);
  const p = PAGES[at];

  const choose = (col: number) => {
    if (shown) return;
    const right = p.extra.length ? p.extra.includes(col) : col === -1;
    if (!right) {
      setMiss(miss + 1);
      return;
    }
    setShown(true);
    if (at === PAGES.length - 1 && !done) {
      setDone(true);
      pass("Extra means: the rest can rebuild it.");
    }
  };
  const next = () => {
    setAt(at + 1);
    setShown(false);
    setMiss(0);
  };

  return (
    <>
      <div className="mx-auto max-w-sm text-center text-xs font-semibold text-muted">
        page {at + 1} of {PAGES.length} — {p.name}
      </div>
      <div className="mx-auto mt-2 w-full max-w-[21rem] rounded-2xl border border-border bg-surface p-3">
        <div className="flex gap-1.5">
          {p.head.map((h, i) => (
            <button
              key={h}
              type="button"
              disabled={shown}
              onClick={() => choose(i)}
              className={`min-w-0 flex-1 cursor-pointer rounded-lg border-2 px-1 py-1 text-[0.7rem] font-semibold transition-colors disabled:cursor-default ${
                shown && p.extra.includes(i) ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-accent"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
        {p.rows.map((r, i) => (
          <div key={i} className="mt-1.5 flex gap-1.5">
            {r.map((v, j) => (
              <span key={j} className="min-w-0 flex-1 rounded-lg bg-foreground/[0.04] py-1.5 text-center font-mono text-[0.9rem]">
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
            shown && p.extra.length === 0 ? "border-accent bg-accent text-accent-foreground" : "border-dashed border-muted/50 text-muted hover:border-accent"
          }`}
        >
          none of them is extra
        </button>
      </div>
      {miss > 0 && !shown ? (
        <Nope key={`${at}-${miss}`}>{miss === 1 && p.extra.length && at !== 4 ? p.wrongCol || "One of these columns never surprises you. Find it." : p.wrongCol || "Look again: one column here is pinned by the others."}</Nope>
      ) : null}
      {shown ? (
        <>
          <div className={`${FADE} mx-auto mt-2 max-w-sm rounded-2xl bg-accent/10 px-4 py-2.5 text-center text-[0.95rem] text-accent-text`}>{p.recipe}</div>
          {at < PAGES.length - 1 ? (
            <div className="mt-2.5 flex justify-center">
              <button type="button" onClick={next} className={primaryBtn}>
                Next page
              </button>
            </div>
          ) : null}
        </>
      ) : null}
      <Task done={done}>Five pages. In each, tap the column the others can rebuild — or call “none”.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for the recap Check's explanation, no task: (1, 3) and (2, 7).
//      Doubling u lands one slot short of v, and no other multiple does better.

const TA_F = makeFrame(-1, 3, -1, 8, 15, 12);

export function TwoArrowsTest() {
  const s = useScene(3, [700, 2000, 2200]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={
        k === 0 ? (
          "The pair in question: u = (1, 3) and v = (2, 7)."
        ) : k < 3 ? (
          "Double u: (2, 6) — one slot short of v. Halving, tripling: no better."
        ) : (
          <span className={FADE}>No multiple of u lands on v — just what the zero test said: only (0, 0) works.</span>
        )
      }
    >
      <div className="mx-auto w-[5.5rem]">
        <Plane f={TA_F} grid={1} axes={false} label="no multiple of u lands on v" className="my-0! max-w-none">
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
// 10a · A story scene for the finale's setup, no task: evening, the pen is out,
//      the dalal waits — and Abbu wants one column crossed off first.

export function AbbuSigns({}: Story) {
  const s = useScene(3, [700, 2400, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" label="evening: Abbu's pen is out, the dalal waits, and Fahim holds the khata">
        <CastPerson who="mama" x={96} y={S1_GROUND} facing={1} arm="hold" mood="plain" />
        <NameTag x={96} y={S1_GROUND + 13} name="Abbu" />
        {k >= 1 && <Bubble x={96} y={S1_GROUND - 68} side="mid" lines={["Before I sign —", "one small surgery."]} />}
        <CastPerson who="fahim" x={184} y={S1_GROUND} facing={-1} arm={k >= 2 ? "hold" : "down"} mood="happy" />
        <NameTag x={184} y={S1_GROUND + 13} name="Fahim" />
        {k >= 2 && <CastCard x={184} y={S1_GROUND - 60} text="total rooms" tone="coral" />}
        {k >= 2 && <Bubble x={184} y={S1_GROUND - 88} side="mid" lines={["This one. Out!"]} />}
        <CastPerson who="karim" x={252} y={S1_GROUND} facing={-1} mood={k >= 2 ? "sad" : "smug"} />
        <NameTag x={252} y={S1_GROUND + 13} name="dalal" />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10 · The finale. Delete the total-rooms column, rerun the app, watch 3000
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
    pass("Column gone: 3000, every time.");
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[21rem] rounded-2xl border border-border bg-surface p-2.5">
        <div className="grid grid-cols-[1fr_1fr_1.2fr_1fr] gap-1 text-[0.7rem] font-semibold leading-none text-muted">
          <span className="text-center">bed</span>
          <span className="text-center">bath</span>
          <span className={`text-center ${del ? "line-through opacity-40" : ""}`}>total</span>
          <span className="text-center">rent</span>
        </div>
        {FLATS.map((f, i) => (
          <div key={i} className="mt-0.5 grid grid-cols-[1fr_1fr_1.2fr_1fr] items-center gap-1">
            <span className="rounded-lg bg-foreground/[0.04] py-0.5 text-center font-mono text-[0.85rem] leading-tight">{f.bed}</span>
            <span className="rounded-lg bg-foreground/[0.04] py-0.5 text-center font-mono text-[0.85rem] leading-tight">{f.bath}</span>
            <span className={`rounded-lg py-0.5 text-center font-mono text-[0.85rem] leading-tight ${del ? "text-muted line-through opacity-40" : "bg-foreground/[0.04]"}`}>{f.total}</span>
            <span className="rounded-lg bg-foreground/[0.04] py-0.5 text-center font-mono text-[0.85rem] leading-tight">{f.rent}</span>
          </div>
        ))}
        {!del ? (
          <button
            type="button"
            onClick={() => setDel(true)}
            className="mt-2 w-full cursor-pointer rounded-xl border-2 border-dashed border-cat-coral/50 px-3 py-1 text-[0.8rem] font-semibold leading-tight text-cat-coral hover:border-cat-coral"
          >
            total rooms — delete this column
          </button>
        ) : null}
      </div>
      {del && !ranAll ? (
        <>
          <div className="mt-2 flex justify-center">
            <button type="button" onClick={run} className={primaryBtn}>
              Run the app — try {Math.min(runs + 1, 3)} of 3
            </button>
          </div>
          {runs > 0 ? (
            <div className="mt-1.5 grid gap-1">
              {Array.from({ length: runs }, (_, i) => (
                <div key={i} className={`${FADE} mx-auto max-w-sm rounded-xl bg-accent/10 px-3 py-0.5 text-center font-mono text-[0.75rem] leading-tight text-accent-text`}>
                  run {i + 1}: knobs (5, 3) — one bathroom, 3000
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
      {del && ranAll ? (
        <>
          <div className={`${FADE} mx-auto mt-1.5 max-w-sm rounded-2xl border border-border bg-surface px-3 py-1 text-[0.85rem] leading-snug`}>
            <div className="font-semibold">The two flats on today’s list</div>
            <div className="mt-0.5 font-mono text-[0.75rem]">A (3 bed, 1 bath) — 18000 · B (3 bed, 2 bath) — 22000</div>
            <div className="mt-0.5 text-[0.8rem] text-muted">One extra bathroom, 4000 dearer. A bathroom is worth 3000 — so 1000 of B’s price is just asking. Abbu takes A.</div>
          </div>
          {!settled ? (
            <div className="mt-1.5 flex justify-center">
              <button type="button" onClick={settle} className={quietBtn}>
                Settle the bet
              </button>
            </div>
          ) : (
            <div className={`${FADE} mx-auto mt-1.5 max-w-sm rounded-2xl bg-accent/10 px-3 py-1.5 text-center text-[0.85rem] leading-snug text-accent-text`}>
              Neither number meant anything — both knob-sets fit, and the app was only picking. With the column gone: 3000, every time.
            </div>
          )}
        </>
      ) : null}
      <Task done={settled}>Delete the extra column, rerun the app three times, then settle your bet.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  DalalArrives: { morning: { k: 1 }, evening: { k: 2 }, end: {} },
  TwoAnswers: { start: {}, sealed: { bet: 3, sealed: true } },
  AreaTwice: { start: {}, one: { filled: [0] }, done: { filled: [0, 1, 2] } },
  TotalColumn: { start: {}, wrong: { rule: 0 }, right: { rule: 1 } },
  TwoKnobSets: { start: {}, mid: { at: 2 }, done: { at: 5, done: true } },
  KnobShuffle: { mid: { k: 1 }, end: {} },
  YourShuffle: { start: {}, ran: { ran: true }, mid: { ran: true, knobs: [4, 2, 0] }, done: { ran: true, knobs: [4, 2, 1], done: true } },
  ZeroWalk: { start: {}, twin: { rm: 0, amt: [[2, -1], [0, 0]], dots: [["1,1", "0,0", "2,2"], []], tick: [true, false] }, done: { rm: 1, amt: [[2, -1], [1, 0]], dots: [["1,1", "0,0"], ["1,0", "0,1", "1,1"]], tick: [true, true] } },
  WalkHome: { mid: { k: 2 }, end: {} },
  NoVisibleCopy: { hunt: { tries: ["1,2", "2,4", "-1,-2"] }, sum: { phase: "sum", k: 0 }, mid: { phase: "sum", k: 2 }, end: { phase: "sum", k: 4 } },
  ThirdButton: { start: {}, found: { phase: 2, amt: [2, 3, -1] }, own: { phase: 2, wAt: [3, 1], placed: ["3,1"], lastLine: "w = (3, 1): presses (−3, −1, 1) — home." }, done: { phase: 2, wAt: [0, 0], placed: ["3,1", "0,0", "-2,2"], lastLine: "w = (0, 0): the zero button. Press it once — home, without going anywhere." } },
  SpotTheExtra: { start: {}, page2: { at: 1, miss: 0 }, trap: { at: 4 }, done: { at: 4, shown: true, done: true } },
  TwoArrowsTest: { mid: { k: 2 }, end: {} },
  AbbuSigns: { mid: { k: 1 }, end: {} },
  RerunApp: { start: {}, runs: { del: true, runs: 1 }, ready: { del: true, runs: 3 }, done: { del: true, runs: 3, settled: true } },
};
