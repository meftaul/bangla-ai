"use client";

import { type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  FADE,
  LOOK,
  Nope,
  POP,
  Scene,
  Stepper,
  Ticks,
  pill,
  predictLook,
  primaryBtn,
  usePlay,
  useScene,
  useTween,
  useSeed,
  type Fixtures,
  type Look,
} from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person as CastPerson, Robot, Stage, Stall, StoryFrame } from "@/components/journey/cast";
import { Arrow, Dot, Label, Plane, Star, makeFrame, same, sg, tup, type Frame, type Tone, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";

// Screens for "Math for AI 5.1 — Span, which remote reaches where", told as a Journey.
//
// Moving day. The new flat is empty, Ammu has chalked four marks on the tiles,
// and Shiku's remote broke in the packing. Four two-button remotes on the toy
// shop's shelf and money for one: which of them take Shiku from the door to
// every mark? Nasib says two buttons is always enough. The reader seals that
// bet, then drives one remote after another: a single button that only ever
// walks one line, the old e₁/e₂ remote whose presses are the mark's own
// numbers, a twin-button remote whose two slots always hold the same number,
// and the messiest-looking one, which gets everywhere by overshooting and
// stepping back. A paint toggle then shades everything a remote can reach
// between them, and that shaded set is the word: span. The door is always in
// it, the reader calls four new remotes unaided, picks the picture of a
// two-button remote's span, and the Finale settles the bet. 11 steps.
//
// The machine itself (Floor, ButtonRemote, Reach) is built here and reused by
// 5.2, 5.3 and 5.4, the way Article 4 reused DotBox.
//
// Every <Then> figure is watch-only (useScene) and acts out its paragraph: the
// four remotes that differ only in their numbers, the one-button line getting
// its name, the almirah built press by press, remote B's two buttons pointing
// one way, its two slots locked together, remote C's five-forward-one-back
// detour, three spans side by side, the door inside, the dead (0, 0) button,
// the Try-it's two remotes on one wall line, and the two remotes that lost
// Nasib his rule.
//
// Tailwind only; the sheets are journey/plane. Ink on the white sheet is fixed.

const O: XY = [0, 0];
const times = (k: number, v: XY): XY => [k * v[0], k * v[1]];
const add = (a: XY, b: XY): XY => [a[0] + b[0], a[1] + b[1]];
/** a press count rounded to two decimals, with a real minus */
const r2 = (n: number) => sg(Math.round(n * 100) / 100 || 0);
const tup2 = (v: readonly number[]) => `(${v.map(r2).join(", ")})`;

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

/** a key's colour as a literal class name */
const TEXT: Record<string, string> = {
  blue: "text-cat-blue",
  coral: "text-cat-coral",
  teal: "text-cat-teal",
  violet: "text-cat-violet",
};

// ---------------------------------------------------------------------------
// The shared machine: the flat's floor, Ammu's chalk marks, a remote of two or
// three buttons, and the paint that shades everywhere it can reach.

/** One button on a remote: the name on the key, the step it takes, its colour. */
export type Key = { name: string; v: XY; tone: Tone };

export const MARKS: { name: string; at: XY }[] = [
  { name: "almirah", at: [3, 5] },
  { name: "bed", at: [1, 3] },
  { name: "table", at: [2, 2] },
  { name: "shoe rack", at: [1, 0] },
];
const ALMIRAH = MARKS[0].at;
const BED = MARKS[1].at;
const TABLE = MARKS[2].at;

/** The four remotes on the toy shop's shelf. */
export const SHELF: { name: string; keys: Key[] }[] = [
  { name: "A", keys: [{ name: "e₁", v: [1, 0], tone: "blue" }, { name: "e₂", v: [0, 1], tone: "coral" }] },
  { name: "B", keys: [{ name: "u", v: [1, 1], tone: "blue" }, { name: "v", v: [2, 2], tone: "coral" }] },
  { name: "C", keys: [{ name: "u", v: [1, 2], tone: "blue" }, { name: "v", v: [2, 5], tone: "coral" }] },
  { name: "D", keys: [{ name: "u", v: [2, 0], tone: "blue" }, { name: "v", v: [-5, 0], tone: "coral" }] },
];

/** The floor of the empty flat: the door corner at (0, 0), one tile per unit. */
const FF = makeFrame(-2, 5, -2, 6, 26, 14);
/** The floor again, wide enough to hold remote D's (−5, 0) button. */
const PF = makeFrame(-5, 5, -3, 6, 20, 12);
/** The floor again, tall enough for remote C's overshoot to (5, 10). */
const MF = makeFrame(-1, 6, -3, 11, 15, 12);

/** where a remote leaves Shiku after `amt` presses of each key */
export const land = (keys: Key[], amt: number[]): XY => keys.reduce<XY>((s, k, i) => add(s, times(amt[i], k.v)), O);
const onSheet = ([x, y]: XY, f: Frame) => x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1;

/**
 * How far one key can still be pressed each way before Shiku would walk off
 * the floor, so a key simply runs out instead of taking him somewhere unseen.
 */
export function fitRange(keys: Key[], amt: number[], i: number, f: Frame, min: number, max: number): [number, number] {
  const ok = (n: number) => onSheet(land(keys, amt.map((a, j) => (j === i ? n : a))), f);
  let lo = amt[i];
  let hi = amt[i];
  while (lo - 1 >= min && ok(lo - 1)) lo -= 1;
  while (hi + 1 <= max && ok(hi + 1)) hi += 1;
  return [lo, hi];
}

/** The door corner of the flat: the (0, 0) every remote starts from. */
export function Door({ f }: { f: Frame }) {
  return (
    <g className="pointer-events-none">
      <circle cx={f.sx(0)} cy={f.sy(0)} r={3.6} className="fill-[#0f1b2d]" />
      <text x={f.sx(0) - 6} y={f.sy(0) + 13} textAnchor="end" fontSize={8.5} fontWeight={700} className="fill-[#5a6b7d]">
        door
      </text>
    </g>
  );
}

/** One of Ammu's chalk marks on the tiles, ticked once Shiku has stood on it. */
export function Chalk({ f, at, name, on = false }: { f: Frame; at: XY; name: string; on?: boolean }) {
  const x = f.sx(at[0]);
  const y = f.sy(at[1]);
  return (
    <g className="pointer-events-none">
      <rect
        x={x - 9}
        y={y - 9}
        width={18}
        height={18}
        rx={3}
        strokeDasharray="3 2.5"
        strokeWidth={1.6}
        className={on ? "fill-accent/25 stroke-accent" : "fill-none stroke-[#94a3b8]"}
      />
      <text x={x} y={y - 13} textAnchor="middle" fontSize={8} fontWeight={700} className={on ? "fill-accent" : "fill-[#5a6b7d]"}>
        {name}
      </text>
    </g>
  );
}

/** All four chalk marks; the names in `hit` are ticked. */
export function Marks({ f, hit = [] }: { f: Frame; hit?: string[] }) {
  return (
    <>
      {MARKS.map((m) => (
        <Chalk key={m.name} f={f} at={m.at} name={m.name} on={hit.includes(m.name)} />
      ))}
    </>
  );
}

const det = (a: XY, b: XY) => a[0] * b[1] - a[1] * b[0];
/** two buttons that push different ways: everything on the floor is in reach */
export const isPlane = (keys: Key[]) => keys.some((a, i) => keys.slice(i + 1).some((b) => det(a.v, b.v) !== 0));
const dirOf = (keys: Key[]): XY => keys.map((k) => k.v).find((v) => v[0] || v[1]) ?? [1, 0];

/** where the line through the door along `d` enters and leaves the sheet */
function clipT(d: XY, f: Frame): [number, number] {
  let lo = -1e6;
  let hi = 1e6;
  const cut = (dv: number, a: number, b: number) => {
    if (Math.abs(dv) < 1e-9) return;
    lo = Math.max(lo, Math.min(a / dv, b / dv));
    hi = Math.min(hi, Math.max(a / dv, b / dv));
  };
  cut(d[0], f.x0, f.x1);
  cut(d[1], f.y0, f.y1);
  return [lo, hi];
}

/**
 * Everywhere a remote can reach, shaded: the whole floor when two buttons push
 * different ways, one line through the door otherwise. The dots are the tile
 * crossings, and every remote here that paints the floor does land on all of
 * them.
 */
export function Reach({ f, keys, on, dots = true }: { f: Frame; keys: Key[]; on: boolean; dots?: boolean }) {
  if (!on) return null;
  const full = isPlane(keys);
  const d = dirOf(keys);
  const [lo, hi] = clipT(d, f);
  const xs = Array.from({ length: Math.floor(f.x1) - Math.ceil(f.x0) + 1 }, (_, i) => Math.ceil(f.x0) + i);
  const ys = Array.from({ length: Math.floor(f.y1) - Math.ceil(f.y0) + 1 }, (_, i) => Math.ceil(f.y0) + i);
  return (
    <g className={`${FADE} pointer-events-none`}>
      {full ? (
        <rect x={f.pad} y={f.pad} width={f.W - 2 * f.pad} height={f.H - 2 * f.pad} className="fill-cat-violet/20" />
      ) : (
        <line
          x1={f.sx(lo * d[0])}
          y1={f.sy(lo * d[1])}
          x2={f.sx(hi * d[0])}
          y2={f.sy(hi * d[1])}
          strokeWidth={14}
          className="stroke-cat-violet/30"
        />
      )}
      {full && dots
        ? xs.flatMap((x) => ys.map((y) => <circle key={`${x},${y}`} cx={f.sx(x)} cy={f.sy(y)} r={2.2} className="fill-cat-violet" />))
        : null}
    </g>
  );
}

/** Every press so far, as one chain of small arrows per key. */
export function Chains({ f, keys, amt }: { f: Frame; keys: Key[]; amt: number[] }) {
  let from = O;
  const out: ReactNode[] = [];
  keys.forEach((k, i) => {
    const n = amt[i];
    const s = Math.sign(n);
    for (let j = 0; j < Math.abs(n); j += 1) {
      out.push(
        <Arrow key={`${k.name}${j}`} f={f} from={add(from, times(s * j, k.v))} to={add(from, times(s * (j + 1), k.v))} tone={k.tone} w={2.3} />,
      );
    }
    from = add(from, times(n, k.v));
  });
  return <>{out}</>;
}

/** The remote in the reader's hand: one row per button, − and + around its count. */
export function ButtonRemote({
  keys,
  amt,
  onAmt,
  f,
  min = -6,
  max = 6,
  disabled = false,
}: {
  keys: Key[];
  amt: number[];
  onAmt: (i: number, n: number) => void;
  f: Frame;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-[15rem] rounded-2xl border border-border bg-surface px-3 py-1.5">
      {keys.map((k, i) => {
        const [lo, hi] = fitRange(keys, amt, i, f, min, max);
        return (
          <div key={k.name} className="flex items-center justify-between gap-2 py-1">
            <span className="text-sm">
              <b className={TEXT[k.tone]}>{k.name}</b> <span className="font-mono text-[0.95rem]">{tup(k.v)}</span>
            </span>
            <Stepper value={amt[i]} onChange={(n) => onAmt(i, n)} min={lo} max={hi} disabled={disabled} label={k.name} />
          </div>
        );
      })}
    </div>
  );
}

/** The line the remote is spelling out right now, and where it lands. */
export function Recipe({ keys, amt, hit = false, size = "text-lg" }: { keys: Key[]; amt: number[]; hit?: boolean; size?: string }) {
  const at = land(keys, amt);
  return (
    <div className={`text-center font-mono ${size}`}>
      {keys.map((k, i) => (
        <span key={k.name}>
          {i > 0 && <span className="text-muted">{amt[i] < 0 ? " − " : " + "}</span>}
          <span className={TEXT[k.tone]}>{i > 0 ? Math.abs(amt[i]) : sg(amt[i])}</span>·{k.name}
        </span>
      ))}
      {" = "}
      <b className={hit ? "text-accent-text" : ""}>{tup(at)}</b>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: moving day. The new flat
//      is empty but for boxes; Ammu chalks four marks on the tiles; Fahim holds
//      up Shiku's cracked remote; Nasib walks in with his claim. The shop's
//      four remotes are not shown: that is the widget's question.

const S1_FLOOR = 118;
const S1_SPOT = [126, 170, 214, 258];

/** a packing box, bottom-left at (x, y) */
function S1Box({ x, y, w = 26, h = 22 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g className="pointer-events-none">
      <rect x={x} y={y - h} width={w} height={h} rx={2} fill="#d6b98c" stroke="#92400e" strokeWidth={1.2} />
      <path d={`M${x} ${y - h + 7}H${x + w}`} stroke="#92400e" strokeWidth={1} fill="none" />
    </g>
  );
}

/** Shiku's remote: two keys, dead and cracked when `broken` */
function S1Remote({ x, y, broken }: { x: number; y: number; broken: boolean }) {
  return (
    <g className={POP}>
      <rect x={x} y={y} width={16} height={26} rx={4} fill="#334155" stroke="#0f172a" />
      <rect x={x + 3.5} y={y + 5} width={9} height={6} rx={2} fill={broken ? "#64748b" : "#2563eb"} />
      <rect x={x + 3.5} y={y + 15} width={9} height={6} rx={2} fill={broken ? "#64748b" : "#0d9488"} />
      {broken && <path d={`M${x + 1} ${y + 3}l6 9l-4 4l7 8`} fill="none" stroke="#e11d48" strokeWidth={1.8} strokeLinejoin="round" />}
    </g>
  );
}

export function MovingDay({}: Story) {
  const s = useScene(3, [600, 2400, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage
        backdrop="room"
        ground={S1_FLOOR}
        label="the new flat, empty but for boxes: Ammu chalks four marks on the tiles, Fahim holds up Shiku's broken remote, and Nasib walks in"
      >
        <S1Box x={14} y={150} />
        <S1Box x={22} y={128} w={20} h={18} />
        <S1Box x={44} y={152} w={22} h={26} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={`t${i}`} d={`M${86 + i * 40} ${S1_FLOOR}V180`} stroke="white" strokeOpacity={0.55} strokeWidth={1} fill="none" />
        ))}
        <path d={`M76 ${S1_FLOOR + 26}H320`} stroke="white" strokeOpacity={0.55} strokeWidth={1} fill="none" />
        {k >= 1 &&
          MARKS.map((m, i) => (
            <g key={m.name} className={POP} style={{ transitionDelay: `${i * 220}ms` }}>
              <rect x={S1_SPOT[i] - 11} y={161} width={22} height={13} rx={2} fill="none" stroke="white" strokeWidth={1.6} strokeDasharray="3 2" />
              <text x={S1_SPOT[i]} y={158} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white" stroke="#4a3418" strokeWidth={2} paintOrder="stroke">
                {m.name}
              </text>
            </g>
          ))}
        <CastPerson who="ammu" x={96} y={S1_FLOOR + 16} arm={k === 1 ? "point" : "down"} mood={k >= 1 ? "happy" : "plain"} />
        {k === 1 && <Bubble x={96} y={S1_FLOOR - 50} side="right" lines={["I've marked where", "each thing will go."]} />}
        <CastPerson who="fahim" x={186} y={S1_FLOOR + 16} mood={k >= 2 ? "sad" : "plain"} arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && <S1Remote x={198} y={S1_FLOOR - 30} broken />}
        {k === 2 && <Bubble x={186} y={S1_FLOOR - 50} side="mid" lines={["Shiku's remote broke", "in the packing."]} />}
        <Robot x={232} y={S1_FLOOR + 16} />
        <CastPerson who="nasib" x={k >= 3 ? 288 : 372} y={S1_FLOOR + 16} facing={-1} walking={k === 3} mood="smug" />
        {k >= 3 && <Bubble x={288} y={S1_FLOOR - 50} side="left" lines={["With two buttons you", "can go anywhere."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The shelf. Four two-button remotes and Ammu's four marks; the reader
//     ticks the ones they think reach every mark and seals the bet, unmarked.
//     This is the journey's question, and the Finale is what settles it.

export function RemoteShelf() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<string[]>("picks", []);
  const [sealed, setSealed] = useSeed("sealed", false);

  const toggle = (n: string) => setPicks(picks.includes(n) ? picks.filter((p) => p !== n) : [...picks, n]);
  const seal = () => {
    setSealed(true);
    pass(`Bet sealed: ${picks.length === 1 ? "1 remote reaches" : `${picks.length} remotes reach`} every mark.`);
  };

  return (
    <>
      <div className="mx-auto flex max-w-sm flex-wrap items-center justify-center gap-x-3 gap-y-0.5 rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-3 py-1.5 text-sm">
        <span className="font-semibold">Ammu&apos;s marks:</span>
        {MARKS.map((m) => (
          <span key={m.name}>
            {m.name} <span className="font-mono">{tup(m.at)}</span>
          </span>
        ))}
      </div>
      <div className="mt-2.5 text-sm font-medium text-muted">Which remotes will reach all four marks? Tap as many as you think.</div>
      <div className="mt-2 grid gap-1.5">
        {SHELF.map((r, i) => (
          <Choice key={r.name} n={i} look={picks.includes(r.name) ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => toggle(r.name)}>
            Remote {r.name}{" "}
            <span className="ml-1 font-mono text-[0.95rem] text-muted">
              {tup(r.keys[0].v)} {tup(r.keys[1].v)}
            </span>
          </Choice>
        ))}
      </div>
      {!sealed ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={seal} className={primaryBtn}>
            {picks.length ? "Seal the bet" : "None of them can. Seal it"}
          </button>
        </div>
      ) : (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>Bet sealed. Before the shop closes, we&apos;ll try all four.</div>
      )}
      <Task done={sealed}>Pick your remotes, then seal the bet.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: four remotes that look
//      almost the same, two buttons each; the numbers on the buttons land
//      last, and under each remote a chalk mark waits with a "?".

const X1_SAY = [
  "Four remotes on the shelf. They look almost the same.",
  "Two buttons on each one.",
  "The only difference is the numbers on the buttons.",
  "Those numbers will decide where Shiku can go, and where he can't.",
];

export function ShelfFour() {
  const s = useScene(3, [600, 1600, 2400]);
  const k = s.k;

  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X1_SAY[k]}</span>}>
      <svg viewBox="0 0 296 124" className="mx-auto h-auto w-full max-w-[17rem]" role="img" aria-label="four two-button remotes that differ only in the numbers on their buttons">
        <rect x={4} y={66} width={288} height={5} rx={2} fill="#a16207" />
        {SHELF.map((r, i) => {
          const cx = 40 + i * 72;
          return (
            <g key={r.name}>
              <text x={cx} y={9} textAnchor="middle" fontSize={10} fontWeight={700} fill="#5a6b7d">
                {r.name}
              </text>
              <rect x={cx - 13} y={14} width={26} height={52} rx={6} fill="#334155" stroke="#0f172a" />
              {r.keys.map((key, j) => (
                <rect
                  key={key.name}
                  x={cx - 8}
                  y={23 + j * 20}
                  width={16}
                  height={11}
                  rx={3}
                  fill={k >= 1 ? (j ? "#e0664f" : "#2563eb") : "#64748b"}
                  className="transition-[fill] duration-500 motion-reduce:transition-none"
                />
              ))}
              {k >= 2 &&
                r.keys.map((key, j) => (
                  <text
                    key={key.name}
                    x={cx}
                    y={86 + j * 12}
                    textAnchor="middle"
                    fontSize={9.5}
                    fontFamily="ui-monospace, monospace"
                    fontWeight={700}
                    fill={j ? "#c2410c" : "#1d4ed8"}
                    className={POP}
                  >
                    {tup(key.v)}
                  </text>
                ))}
              {k >= 3 && (
                <g className={POP}>
                  <rect x={cx - 8} y={105} width={16} height={16} rx={3} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 2" />
                  <text x={cx} y={117} textAnchor="middle" fontSize={10} fontWeight={700} fill="#5a6b7d">
                    ?
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2 · The shop's cheapest remote: one button, (1, 1), pressed forwards,
//     backwards and half-way. Every stop the reader makes leaves a dot, and
//     the dots spell out one line through the door. The bed is starred and
//     never comes.

const ONE_V: XY = [1, 1];
const ONE_KEY: Key[] = [{ name: "v", v: ONE_V, tone: "blue" }];
/** the slider counts quarter presses, so half a press is a real stop */
const Q_LO = -8;
const Q_HI = 20;
const swept = (qs: number[]) => qs.length >= 7 && qs.some((q) => q < 0) && qs.some((q) => q % 4 !== 0);

export function OneButton() {
  const pass = useGate();
  const [q, setQ] = useSeed("q", 0);
  const [seen, setSeen] = useSeed<number[]>("seen", [0]);
  const done = swept(seen);
  const lam = q / 4;
  const at = times(lam, ONE_V);

  const move = (n: number) => {
    setQ(n);
    if (seen.includes(n)) return;
    const next = [...seen, n];
    setSeen(next);
    if (!done && swept(next)) pass("One button: one line, through the door.");
  };

  return (
    <>
      <Plane f={FF} grid={1} ticks={2} label={`one button (1, 1) pressed ${lam} times, Shiku at ${tup2(at)}`} className="my-2! max-w-[10.5rem]">
        {done && <Reach f={FF} keys={ONE_KEY} on dots={false} />}
        <Marks f={FF} />
        <Star f={FF} at={BED} />
        {seen.map((n) => (
          <Dot key={n} f={FF} at={times(n / 4, ONE_V)} r={2.6} className="fill-cat-blue/60" />
        ))}
        <Arrow f={FF} from={O} to={at} tone="blue" w={2.4} />
        <Door f={FF} />
        <Shiku f={FF} at={at} />
      </Plane>
      <div className="text-center font-mono text-lg">
        <span className="text-cat-blue">{r2(lam)}</span>·v = <b>{tup2(at)}</b>
      </div>
      <label className="mx-auto mt-3 flex max-w-xs items-center gap-3">
        <span className="shrink-0 text-sm text-cat-blue">v button</span>
        <input
          type="range"
          min={Q_LO}
          max={Q_HI}
          step={1}
          value={q}
          aria-label="how many times the v button is pressed"
          onChange={(e) => move(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
        />
      </label>
      <div className="mt-1 text-center text-xs text-muted">Pull it back for minus. Stop in between for half a press.</div>
      <Task done={done}>Slide the button forwards and backwards. Can you land on the bed&apos;s mark?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the line gets its name.
//      The one button's arrow, then the stops forward, then backward and
//      half-way, and the whole line at last, labelled span{v}.

const X2_F = makeFrame(-3, 3, -3, 3, 22, 10);
const X2_FWD = [0.5, 1, 1.5, 2, 2.5, 3];
const X2_BACK = [-0.5, -1, -1.5, -2, -2.5, -3];
const X2_SAY = [
  "From the door corner, the v button. One press is (1, 1).",
  "Keep pressing forwards, and Shiku lands on these dots.",
  "Press backwards, and press half-way, and the gaps fill in too.",
];

export function LineNamed() {
  const s = useScene(3, [600, 1800, 2000]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 3 ? X2_SAY[k] : <span className={FADE}>All together, one whole line, and it passes right over the door. This whole line is called span&#x7B;v&#x7D;.</span>}
    >
      <div className="mx-auto w-[9.5rem]">
        <Plane f={X2_F} grid={1} axes={false} label="one button's stops fill in a line through the door" className="my-0! max-w-none">
          {k >= 3 && <Reach f={X2_F} keys={ONE_KEY} on dots={false} />}
          {k >= 1 && X2_FWD.map((t) => <Dot key={t} f={X2_F} at={times(t, ONE_V)} r={2.6} className="fill-cat-blue/70" pop />)}
          {k >= 2 && X2_BACK.map((t) => <Dot key={t} f={X2_F} at={times(t, ONE_V)} r={2.6} className="fill-cat-blue/70" pop />)}
          <Arrow f={X2_F} from={O} to={ONE_V} tone="blue" w={2.6} draw />
          <Door f={X2_F} />
          {k >= 3 && (
            <Label f={X2_F} at={[-2.6, -1.7]} anchor="start" size={9} className={`${FADE} fill-cat-violet font-mono`}>
              {"span{v}"}
            </Label>
          )}
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · Remote A, the old kind: e₁ east, e₂ north, minus allowed. The reader
//     takes Shiku to all four marks, and each mark's presses come out as the
//     mark's own two numbers. One quick screen.

export function OldRemote() {
  const keys = SHELF[0].keys;
  const pass = useGate();
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0]);
  const [hit, setHit] = useSeed<string[]>("hit", []);
  const at = land(keys, amt);
  const here = MARKS.some((m) => same(m.at, at));
  const done = hit.length === MARKS.length;

  const press = (i: number, n: number) => {
    const next = amt.map((a, j) => (j === i ? n : a));
    setAmt(next);
    const mark = MARKS.find((m) => same(m.at, land(keys, next)));
    if (!mark || hit.includes(mark.name)) return;
    const got = [...hit, mark.name];
    setHit(got);
    if (got.length === MARKS.length) pass("A mark's two numbers are the press counts.");
  };

  return (
    <>
      <Plane f={FF} grid={1} ticks={2} label={`remote A at ${tup(at)}`} className="my-2! max-w-[10.5rem]">
        <Marks f={FF} hit={hit} />
        <Chains f={FF} keys={keys} amt={amt} />
        <Door f={FF} />
        <Shiku f={FF} at={at} />
      </Plane>
      <Recipe keys={keys} amt={amt} hit={here} />
      <div className="mt-2">
        <ButtonRemote keys={keys} amt={amt} onAmt={press} f={FF} min={-4} max={6} />
      </div>
      <Ticks items={MARKS.map((m) => [m.name, hit.includes(m.name)] as [string, boolean])} />
      <Task done={done}>Land Shiku on each of the four marks once.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: the almirah built press
//      by press. (3, 5) is e₁ three times, then e₂ five times; the readout
//      fills slot by slot beside the sheet, and at the end the whole floor
//      lights up: every tile works the same way.

const X3_F = makeFrame(-1, 4, -1, 6, 17, 18);
const X3_SAY = [
  "The almirah's mark is at (3, 5).",
  "e₁ three times: three tiles east.",
  "Then e₂ five times: five tiles north. Right on the almirah.",
];

export function AlmirahBuild() {
  const s = useScene(3, [600, 1600, 1800]);
  const k = s.k;
  const keys = SHELF[0].keys;
  const amt = k >= 2 ? [3, 5] : k >= 1 ? [3, 0] : [0, 0];
  const at = land(keys, amt);

  return (
    <Scene
      scene={s}
      caption={k < 3 ? X3_SAY[k] : <span className={FADE}>Any tile works the same way. So remote A&apos;s span is the whole floor.</span>}
    >
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[6.8rem] shrink-0">
          <Plane f={X3_F} grid={1} ticks={0} label="the almirah (3, 5) reached by pressing e₁ three times and e₂ five times" className="my-0! max-w-none">
            {k >= 3 && <Reach f={X3_F} keys={keys} on dots={false} />}
            <Chalk f={X3_F} at={ALMIRAH} name="almirah" on={k >= 2} />
            <Chains f={X3_F} keys={keys} amt={amt} />
            <Door f={X3_F} />
            <Shiku f={X3_F} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 font-mono text-[0.95rem] leading-relaxed">
          <div className={k >= 1 ? "" : "opacity-30"}>
            <span className="text-cat-blue">3</span>·e₁
          </div>
          <div className={k >= 2 ? "" : "opacity-30"}>
            <span className="text-muted">+</span> <span className="text-cat-coral">5</span>·e₂
          </div>
          <div className="mt-1 border-t border-border pt-1">
            = (<span className={k >= 1 ? "text-cat-blue" : ""}>{at[0]}</span>, <span className={k >= 2 ? "text-cat-coral" : ""}>{at[1]}</span>)
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · Remote B: u = (1, 1) and v = (2, 2). The table comes easily, so the trap
//     holds; then the star moves to the almirah and no pair of counts ever
//     gets there. Every landing the reader tries leaves a dot, and the dots
//     line up on one diagonal. It cannot be won.

const TWIN_TRIES = 6;

export function TwinButtons() {
  const keys = SHELF[1].keys;
  const pass = useGate();
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0]);
  const [table, setTable] = useSeed("table", false);
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const [done, setDone] = useSeed("done", false);
  const at = land(keys, amt);
  const goal = table ? ALMIRAH : TABLE;

  const press = (i: number, n: number) => {
    const next = amt.map((a, j) => (j === i ? n : a));
    setAmt(next);
    const m = next[0] + 2 * next[1];
    if (!table) {
      if (m === 2) setTable(true);
      return;
    }
    if (tried.includes(m)) return;
    const list = [...tried, m];
    setTried(list);
    if (!done && list.length >= TWIN_TRIES) {
      setDone(true);
      pass("(2, 2) is just (1, 1) twice.");
    }
  };

  return (
    <>
      <Plane f={FF} grid={1} ticks={2} label={`remote B at ${tup(at)}, heading for ${tup(goal)}`} className="my-2! max-w-[10.5rem]">
        <Marks f={FF} hit={table ? [MARKS[2].name] : []} />
        <Star f={FF} at={goal} done={same(at, goal)} />
        {tried.map((m) => (
          <Dot key={m} f={FF} at={times(m, ONE_V)} r={2.8} className="fill-cat-coral/50" />
        ))}
        <Chains f={FF} keys={keys} amt={amt} />
        <Door f={FF} />
        <Shiku f={FF} at={at} />
      </Plane>
      <Recipe keys={keys} amt={amt} hit={same(at, goal)} />
      <div className="mt-2">
        <ButtonRemote keys={keys} amt={amt} onAmt={press} f={FF} min={-4} max={4} />
      </div>
      {table && !done && (
        <div className={`${FADE} mt-2 text-center text-[0.95rem] text-muted`}>
          Table done. Now the star is on the almirah, <span className="font-mono">(3, 5)</span>. Try {tried.length} of {TWIN_TRIES}.
        </div>
      )}
      <Task done={done}>{table ? "Now land on the almirah's mark, at (3, 5)." : "First land on the table's mark, at (2, 2)."}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: two buttons, one
//      direction. u is drawn, then u again tip to tail landing exactly on v,
//      then a dot slides the whole diagonal, and the almirah sits off it.

const X4_F = makeFrame(-2, 4, -2, 6, 20, 12);
/** v is drawn a little to the side of u, or the two would lie on top of each other */
const X4_OFF: XY = [0.35, -0.35];
const X4_SAY = [
  "Remote B's two buttons: u = (1, 1) and v = (2, 2).",
  "After u, u once more, and you land exactly on v's tip. v is just u, twice.",
  "Press them any way you like, and Shiku stays on this one line.",
];

export function SameDirection() {
  const s = useScene(3, [600, 1900, 1800]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? X4_SAY[k] : <span className={FADE}>And the almirah&apos;s mark is off that line. So Shiku can never get there.</span>}>
      <div className="mx-auto w-[8.5rem]">
        <Plane f={X4_F} grid={1} axes={false} label="remote B's two buttons push the same way, so every landing sits on one line" className="my-0! max-w-none">
          {k >= 2 && <Reach f={X4_F} keys={SHELF[1].keys} on dots={false} />}
          {k >= 3 && <Chalk f={X4_F} at={ALMIRAH} name="almirah" />}
          <Arrow f={X4_F} from={X4_OFF} to={add([2, 2], X4_OFF)} tone="coral" w={2.4} />
          <Label f={X4_F} at={add([2, 2], X4_OFF)} dx={11} dy={4} size={10} className="fill-cat-coral font-mono">
            v
          </Label>
          <Arrow f={X4_F} from={O} to={[1, 1]} tone="blue" w={2.4} />
          <Label f={X4_F} at={[1, 1]} dx={-11} dy={-3} size={10} className="fill-cat-blue font-mono">
            u
          </Label>
          {k >= 1 && <Arrow f={X4_F} from={[1, 1]} to={[2, 2]} tone="blue" w={2.4} draw dashed />}
          <Door f={X4_F} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5 · Why remote B cannot: build α·(1, 1) + β·(2, 2) one line at a time and
//     watch the same number come out in both slots, whatever α and β are.
//     The almirah wants 3 in one slot and 5 in the other.

const SLOT_ROWS: { lhs: string; rhs: string; note: string }[] = [
  { lhs: "u, α times", rhs: "(α, α)", note: "u = (1, 1), so α in both slots." },
  { lhs: "v, β times", rhs: "(2β, 2β)", note: "v = (2, 2), so 2β in both slots." },
  { lhs: "Add the two", rhs: "(α + 2β, α + 2β)", note: "Slot by slot, and the two slots come out exactly the same." },
];

export function SlotsSame() {
  const pass = useGate();
  const [k, setK] = useSeed("k", 0);
  const over = k > SLOT_ROWS.length;

  const step = () => {
    const next = k + 1;
    setK(next);
    if (next > SLOT_ROWS.length) pass("Both slots always hold the same number.");
  };

  return (
    <>
      <div className="mx-auto max-w-sm rounded-2xl border border-border px-3 py-3">
        <div className="text-center text-sm font-semibold">u pressed α times, and v pressed β times</div>
        <div className="mt-2 grid gap-1.5">
          {SLOT_ROWS.slice(0, k).map((r) => (
            <div key={r.lhs} className={`${FADE} rounded-xl bg-foreground/[0.04] px-3 py-1.5`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm">{r.lhs}</span>
                <b className="font-mono text-[1.05rem]">{r.rhs}</b>
              </div>
              <div className="text-xs text-muted">{r.note}</div>
            </div>
          ))}
        </div>
        {over && (
          <div className={`${FADE} mt-2 rounded-xl bg-danger/5 px-3 py-2 text-center text-[0.95rem] text-danger`}>
            The almirah wants <span className="font-mono">(3, 5)</span>. Put 3 in the first slot and the second slot is 3 too. There&apos;s no way to make it 5.
          </div>
        )}
      </div>
      {!over && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={step} className={primaryBtn}>
            {k === 0 ? "Start the sum" : "Next step"}
          </button>
        </div>
      )}
      <Task done={over}>Open up the sum, one step at a time.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the two slots locked
//      together. The almirah's (3, 5) on top, remote B's (α + 2β, α + 2β)
//      under it; make the first slot 3 and the second turns 3 with it, and
//      the almirah's 5 is left unmatched.

const X5_SAY = [
  "The almirah wants 3 in the first slot and 5 in the second.",
  "Remote B always gives the same sum in both slots.",
  "Make the first slot 3, and the second slot turns 3 with it.",
];

function X5Slot({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "ok" | "bad" }) {
  const look = { plain: "border-border", ok: "border-accent bg-accent/10 text-accent-text", bad: "border-danger/60 bg-danger/5 text-danger" }[tone];
  return (
    <span
      className={`inline-grid min-w-[4.6rem] place-items-center rounded-lg border-2 px-1.5 py-0.5 font-mono text-[0.95rem] transition-colors duration-300 motion-reduce:transition-none ${look}`}
    >
      {children}
    </span>
  );
}

export function TwinSlots() {
  const s = useScene(3, [600, 1800, 2000]);
  const k = s.k;
  const b = k >= 2 ? "3" : "α + 2β";

  return (
    <Scene
      scene={s}
      caption={k < 3 ? X5_SAY[k] : <span className={FADE}>The almirah&apos;s 5 is left with nothing to match it. Not hard: impossible.</span>}
    >
      <div className="mx-auto grid w-fit grid-cols-[auto_auto_auto] items-center gap-x-2 gap-y-2 text-sm">
        <span className="text-muted">almirah</span>
        <X5Slot tone={k >= 2 ? "ok" : "plain"}>3</X5Slot>
        <X5Slot tone={k >= 3 ? "bad" : "plain"}>5</X5Slot>
        {k >= 1 && (
          <>
            <span className={`${FADE} text-muted`}>remote B</span>
            <span key={`a${b}`} className={POP}>
              <X5Slot tone={k >= 2 ? "ok" : "plain"}>{b}</X5Slot>
            </span>
            <span key={`b${b}`} className={POP}>
              <X5Slot tone={k >= 3 ? "bad" : "plain"}>{b}</X5Slot>
            </span>
          </>
        )}
        {k >= 3 && (
          <>
            <span />
            <span />
            <span className={`${POP} text-center font-mono text-lg text-danger`}>3 ≠ 5</span>
          </>
        )}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · Remote C, the untidiest-looking one: u = (1, 2), v = (2, 5). The reader
//     calls it first, then hunts: five presses of u overshoot to (5, 10), and
//     one press back on v lands exactly on the almirah. Then the bed, with the
//     minus on u this time.

const GA_GUESS = ["It will", "It won't"];

export function MessyRemote() {
  const keys = SHELF[2].keys;
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0]);
  const [hit, setHit] = useSeed<string[]>("hit", []);
  const at = land(keys, amt);
  const almirah = MARKS[0].name;
  const bed = MARKS[1].name;
  const goal = hit.includes(almirah) ? BED : ALMIRAH;
  const done = hit.length === 2;

  const press = (i: number, n: number) => {
    const next = amt.map((a, j) => (j === i ? n : a));
    setAmt(next);
    const mark = MARKS.find((m) => same(m.at, land(keys, next)));
    if (!mark || ![almirah, bed].includes(mark.name) || hit.includes(mark.name)) return;
    const got = [...hit, mark.name];
    setHit(got);
    if (got.length === 2) pass("Messy, but two different directions.");
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={MF} grid={1} ticks={5} label={`remote C at ${tup(at)}, heading for ${tup(goal)}`} className="my-0! max-w-none">
            <Marks f={MF} hit={hit} />
            <Star f={MF} at={goal} done={same(at, goal)} />
            <Chains f={MF} keys={keys} amt={amt} />
            <Door f={MF} />
            <Shiku f={MF} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1 pt-1">
          {guess === null ? (
            <>
              <div className="text-sm font-medium text-muted">
                u = <span className="font-mono">(1, 2)</span>, v = <span className="font-mono">(2, 5)</span>. Will this remote reach the almirah, at{" "}
                <span className="font-mono">(3, 5)</span>?
              </div>
              <div className="mt-2 grid gap-2">
                {GA_GUESS.map((o, i) => (
                  <Choice key={o} n={i} look="idle" disabled={false} onClick={() => setGuess(i)}>
                    {o}
                  </Choice>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-muted">
                Your guess: {GA_GUESS[guess]} {done && <span className={guess === 0 ? "text-accent-text" : "text-danger"}>{guess === 0 ? "✓" : "✕"}</span>}
              </div>
              <Recipe keys={keys} amt={amt} hit={same(at, goal)} size="text-[0.95rem]" />
              <div className="mt-2">
                <ButtonRemote keys={keys} amt={amt} onAmt={press} f={MF} min={-3} max={6} />
              </div>
              <Ticks
                items={[
                  [almirah, hit.includes(almirah)],
                  [bed, hit.includes(bed)],
                ]}
              />
            </>
          )}
        </div>
      </div>
      <Task done={done}>
        {guess === null ? "Make a guess first, then pick up the remote." : hit.includes(almirah) ? "Now land on the bed's mark, at (1, 3)." : "Land on the almirah's mark, at (3, 5)."}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the detour. Five presses
//      of u carry Shiku past the almirah up to (5, 10), and one press back on
//      v brings him down onto it: (5, 10) − (2, 5) = (3, 5).

/** the same floor as screen 6, shorter on the page: the figure shares its step with words */
const X6_F = makeFrame(-1, 6, -1, 11, 12, 10);
const X6_SAY = [
  "u = (1, 2). One press is one tile right and two tiles up.",
  "Press it five times and Shiku is at (5, 10), with the almirah far below.",
  "Now v once, backwards: (5, 10) − (2, 5) = (3, 5).",
];

export function BackStep() {
  const s = useScene(3, [600, 2000, 2200]);
  const k = s.k;
  const keys = SHELF[2].keys;
  const amt = k >= 3 ? [5, -1] : k >= 2 ? [5, 0] : k >= 1 ? [1, 0] : [0, 0];
  const at = land(keys, amt);

  return (
    <Scene scene={s} caption={k < 3 ? X6_SAY[k] : <span className={FADE}>Overshoot, then step back. That&apos;s exactly the job the minus does.</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={X6_F} grid={1} ticks={5} label="five presses of u overshoot to (5, 10), then one press back on v lands on (3, 5)" className="my-0! max-w-none">
            <Chalk f={X6_F} at={ALMIRAH} name="almirah" on={k >= 3} />
            <Chains f={X6_F} keys={keys} amt={amt} />
            <Door f={X6_F} />
            <Shiku f={X6_F} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 font-mono text-[0.95rem] leading-relaxed">
          <div className={k >= 1 ? "" : "opacity-30"}>
            <span className="text-cat-blue">{k >= 2 ? 5 : 1}</span>·u
          </div>
          <div className={k >= 3 ? "" : "opacity-30"}>
            <span className="text-muted">−</span> <span className="text-cat-coral">1</span>·v
          </div>
          <div className="mt-1 border-t border-border pt-1">
            = <b className={k >= 3 ? "text-accent-text" : ""}>{tup(at)}</b>
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6¾ · A side quest off screen 6: the presses worked out instead of hunted,
//      floor first and the symbols last. PressesFirst replays remote A, where
//      each button owns one direction and the counts are the mark's own two
//      numbers, so the reader watches the journey before anything is named.
//      Then SolveWalk: settle how many times v is pressed (that is β), and
//      slot 1 settles the presses of u with no choice left, so every landing
//      sits on the x = 3 line and only the height is still in question. The
//      reader walks β and watches the dot slide that line — on A it reaches
//      the almirah at β = 5, on C at β = −1 (Fahim's own 5·u − 1·v), on B it
//      never leaves (3, 3). Nothing is gated: a side quest has no Task, no
//      pass().

const X6Q_F = makeFrame(-1, 5, -1, 6, 15, 10);
const X6Q_SAY = [
  "Remote A's two buttons: u goes one tile right, v one tile up.",
  "Press u three times, and Shiku is three tiles to the right.",
  "Then v five times, five tiles up, right onto the almirah.",
];

export function PressesFirst() {
  const s = useScene(3, [700, 1900, 2000]);
  const k = s.k;
  const keys = SHELF[0].keys;
  const amt = k >= 2 ? [3, 5] : k >= 1 ? [3, 0] : [0, 0];

  return (
    <Scene
      scene={s}
      caption={k < 3 ? X6Q_SAY[k] : <span className={FADE}>3 right and 5 up. The almirah&apos;s own two numbers.</span>}
    >
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[7rem] shrink-0">
          <Plane f={X6Q_F} grid={1} ticks={5} label="remote A: three presses of u go right, five presses of v go up, landing on (3, 5)" className="my-0! max-w-none">
            <Chalk f={X6Q_F} at={ALMIRAH} name="almirah" on={k >= 2} />
            {k === 0 ? (
              <>
                <Arrow f={X6Q_F} from={O} to={keys[0].v} tone={keys[0].tone} w={2.6} />
                <Arrow f={X6Q_F} from={O} to={keys[1].v} tone={keys[1].tone} w={2.6} />
              </>
            ) : (
              <Chains f={X6Q_F} keys={keys} amt={amt} />
            )}
            <Door f={X6Q_F} />
            <Shiku f={X6Q_F} at={land(keys, amt)} />
          </Plane>
        </div>
        <div className="min-w-0 font-mono text-[0.95rem] leading-relaxed">
          <div className={TEXT[keys[0].tone]}>
            {keys[0].name} = {tup(keys[0].v)}
          </div>
          <div className={TEXT[keys[1].tone]}>
            {keys[1].name} = {tup(keys[1].v)}
          </div>
          <div className={`mt-2 ${k >= 1 ? "" : "opacity-30"}`}>
            <span className={TEXT[keys[0].tone]}>3</span>·{keys[0].name} <span className="text-muted">right</span>
          </div>
          <div className={k >= 2 ? "" : "opacity-30"}>
            <span className={TEXT[keys[1].tone]}>5</span>·{keys[1].name} <span className="text-muted">up</span>
          </div>
          <div className="mt-1 border-t border-border pt-1">
            = <b className={k >= 2 ? "text-accent-text" : ""}>{tup(land(keys, amt))}</b>
          </div>
        </div>
      </div>
    </Scene>
  );
}

/** the three remotes worth walking, in shelf order: A separates, B is stuck, C is Fahim's */
const SQ_PICK = [0, 1, 2];
const SQ_BETA = [-1, 0, 1, 2, 3, 4, 5];
/** the almirah, the mark screen 6 was chasing */
const SQ_GOAL = ALMIRAH;
/** tall and narrow: every landing sits on one vertical line, so the height is what matters */
const SQ_F = makeFrame(-1, 5, -2, 12, 11, 10);

/** α is whatever puts slot 1 right, once β is settled. No choice is left in it. */
const sqAlpha = (keys: Key[], b: number) => (SQ_GOAL[0] - b * keys[1].v[0]) / keys[0].v[0];
/** and then slot 2 is whatever it turns out to be — nobody gets to pick it */
const sqSlot2 = (keys: Key[], b: number) => sqAlpha(keys, b) * keys[0].v[1] + b * keys[1].v[1];

function SqBox({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "ok" | "bad" }) {
  const look = { plain: "border-border", ok: "border-accent bg-accent/10 text-accent-text", bad: "border-danger/60 bg-danger/5 text-danger" }[tone];
  return <span className={`inline-grid min-w-[3.1rem] place-items-center rounded-lg border-2 px-1 py-0.5 font-mono text-[1rem] ${look}`}>{children}</span>;
}

export function SolveWalk() {
  const [pick, setPick] = useSeed("pick", 2);
  const [b, setB] = useSeed("b", 0);
  const keys = SHELF[SQ_PICK[pick]].keys;
  const a = sqAlpha(keys, b);
  const got = sqSlot2(keys, b);
  const hit = got === SQ_GOAL[1];
  const [dy] = useTween([got], 420);
  /** on remote A the second button puts nothing in slot 1, so α comes out the same whatever β is */
  const flat = keys[1].v[0] === 0;

  const say = pick === 1
    ? "Slot 2 reads 3 for every β there is. The dot never leaves (3, 3), so the almirah is out of reach."
    : hit
      ? pick === 0
        ? `Landed. ${keys[0].name} three times and ${keys[1].name} five times — the almirah's own two numbers.`
        : "There it is. u five times, v once backwards: the detour Fahim found by hunting."
      : "One step of β, one step up the line. Keep walking until the dot reaches the almirah.";

  return (
    <div className="mt-3">
      <div className="flex justify-center gap-2">
        {SQ_PICK.map((s, i) => (
          <button
            key={SHELF[s].name}
            type="button"
            onClick={() => {
              setPick(i);
              setB(0);
            }}
            className={pill(pick === i)}
          >
            remote {SHELF[s].name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="w-[5.5rem] shrink-0">
          <Plane f={SQ_F} grid={1} ticks={5} label="every landing sits on the vertical line through 3, and walking β slides it up and down that line" className="my-0! max-w-none">
            <line
              x1={SQ_F.sx(SQ_GOAL[0])}
              y1={SQ_F.sy(-2)}
              x2={SQ_F.sx(SQ_GOAL[0])}
              y2={SQ_F.sy(12)}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              className="stroke-cat-blue/30"
            />
            {SQ_BETA.map((x) => (
              <Dot key={x} f={SQ_F} at={[SQ_GOAL[0], sqSlot2(keys, x)]} r={2.2} className="fill-cat-blue/25" />
            ))}
            <Chalk f={SQ_F} at={SQ_GOAL} name="almirah" on={hit} />
            <Arrow f={SQ_F} from={O} to={keys[0].v} tone={keys[0].tone} w={2.2} />
            <Arrow f={SQ_F} from={O} to={keys[1].v} tone={keys[1].tone} w={2.2} />
            <Door f={SQ_F} />
            <Dot f={SQ_F} at={[SQ_GOAL[0], dy]} r={4.4} className={hit ? "fill-accent" : "fill-cat-blue"} />
          </Plane>
        </div>

        <div className="min-w-0">
          <div className="font-mono text-[0.9rem] leading-relaxed">
            <div className={TEXT[keys[0].tone]}>
              {keys[0].name} = {tup(keys[0].v)}
            </div>
            <div className={TEXT[keys[1].tone]}>
              {keys[1].name} = {tup(keys[1].v)}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-[auto_auto_auto] items-center gap-x-1.5 gap-y-1 text-xs">
            <span className="text-muted">wants</span>
            <SqBox>{SQ_GOAL[0]}</SqBox>
            <SqBox>{SQ_GOAL[1]}</SqBox>

            <span className="text-muted">you get</span>
            <span key={`a${a}${pick}`} className={POP}>
              <SqBox tone="ok">{sg(SQ_GOAL[0])}</SqBox>
            </span>
            <span key={`b${got}${pick}`} className={POP}>
              <SqBox tone={hit ? "ok" : "bad"}>{sg(got)}</SqBox>
            </span>

            <span />
            <span className="text-center text-muted">slot 1</span>
            <span className="text-center text-muted">slot 2</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span className="text-sm text-muted">
          press <span className={`font-mono ${TEXT[keys[1].tone]}`}>{keys[1].name}</span> <span className="font-mono text-cat-coral">β</span> times
        </span>
        <Stepper value={b} onChange={setB} min={SQ_BETA[0]} max={SQ_BETA[SQ_BETA.length - 1]} label="β" />
      </div>

      <div className="mt-2 text-center font-mono text-[0.95rem]">
        slot 1 then forces <span className="text-cat-blue">α</span> ={" "}
        {flat ? (
          <>
            <b>{sg(a)}</b>, whatever β is
          </>
        ) : (
          <>
            {SQ_GOAL[0]} − {keys[1].v[0]}β = <b>{sg(a)}</b>
          </>
        )}
      </div>

      <div className="mt-1">
        <Recipe keys={keys} amt={[a, b]} hit={hit} size="text-base" />
      </div>

      <div className="mt-3 rounded-xl bg-foreground/[0.04] px-3 py-2">
        <div className="text-center text-xs text-muted">how high you land, as β walks</div>
        <div className="mt-1 grid grid-cols-7 gap-1 text-center font-mono text-sm">
          {SQ_BETA.map((x) => (
            <div key={`h${x}`} className="text-xs text-muted">
              {sg(x)}
            </div>
          ))}
          {SQ_BETA.map((x) => {
            const val = sqSlot2(keys, x);
            const look = x === b ? "bg-cat-blue text-white" : val === SQ_GOAL[1] ? "text-accent-text" : "text-muted";
            return (
              <div key={`v${x}`} className={`rounded-md py-0.5 transition-colors duration-200 motion-reduce:transition-none ${look}`}>
                {sg(val)}
              </div>
            );
          })}
        </div>
      </div>

      <div key={`say${pick}${hit}`} className={`${FADE} mt-2 text-center text-[0.95rem] ${hit ? "text-accent-text" : "text-muted"}`}>
        {say}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7 · The paint toggle. For each remote in turn, shade every spot its buttons
//     can reach between them: A the whole floor, B one slanted line, C the
//     whole floor, D the wall line along the door. Four shapes, one word.

const REACH_SAY = ["the whole floor", "one slanted line", "the whole floor", "one line along the door"];

export function PaintReach() {
  const pass = useGate();
  const [pick, setPick] = useSeed("pick", 0);
  const [painted, setPainted] = useSeed<number[]>("painted", []);
  const [on, setOn] = useSeed("on", false);
  const keys = SHELF[pick].keys;
  const done = painted.length === SHELF.length;

  const show = () => {
    setOn(true);
    if (painted.includes(pick)) return;
    const next = [...painted, pick];
    setPainted(next);
    if (next.length === SHELF.length) pass("Everywhere it can reach: that's its span.");
  };

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2">
        {SHELF.map((r, i) => (
          <button
            key={r.name}
            type="button"
            onClick={() => {
              setPick(i);
              setOn(painted.includes(i));
            }}
            className={pill(pick === i)}
          >
            {r.name}
          </button>
        ))}
      </div>
      <Plane f={PF} grid={1} ticks={2} label={`everywhere remote ${SHELF[pick].name} can reach`} className="my-2! max-w-[12rem]">
        <Reach f={PF} keys={keys} on={on} />
        <Marks f={PF} />
        {keys.map((k) => (
          <Arrow key={k.name} f={PF} from={O} to={k.v} tone={k.tone} w={2.4} />
        ))}
        <Door f={PF} />
      </Plane>
      <div className="text-center text-sm">
        Remote {SHELF[pick].name}&apos;s buttons: <span className="font-mono">{tup(keys[0].v)}</span> and <span className="font-mono">{tup(keys[1].v)}</span>
      </div>
      {on ? (
        <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>It can reach {REACH_SAY[pick]}.</div>
      ) : (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={show} className={primaryBtn}>
            Show every combination
          </button>
        </div>
      )}
      <Ticks items={SHELF.map((r, i) => [r.name, painted.includes(i)] as [string, boolean])} />
      <Task done={done}>Paint the combinations of all four remotes.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: three spans side by side,
//      a line, the whole floor, a line again. One word for all three shapes.

const SP_F = makeFrame(-2, 2, -2, 2, 19, 7);
const SPANS: { title: string; keys: Key[] }[] = [
  { title: "span{v}", keys: ONE_KEY },
  { title: "span{e₁, e₂}", keys: SHELF[0].keys },
  { title: "span{u, v}", keys: SHELF[1].keys },
];
const SP_SAY = [
  "Three kinds of remote, side by side.",
  "One button means one line.",
  "Two buttons pushing two different ways means the whole floor.",
];

export function ThreeSpans() {
  const s = useScene(3, [600, 1700, 1700]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? SP_SAY[k] : <span className={FADE}>And two buttons pushing the same way: one line again. Three different shapes, one name.</span>}>
      <div className="flex justify-center gap-2">
        {SPANS.map((sp, i) => (
          <div key={sp.title} className={`w-[5.5rem] transition-opacity duration-500 motion-reduce:transition-none ${k >= i + 1 ? "opacity-100" : "opacity-40"}`}>
            <Plane f={SP_F} grid={1} axes={false} label={sp.title} className="my-0! max-w-none">
              {k >= i + 1 && <Reach f={SP_F} keys={sp.keys} on dots={false} />}
              {sp.keys.map((key) => (
                <Arrow key={key.name} f={SP_F} from={O} to={key.v} tone={key.tone} w={2} />
              ))}
              <circle cx={SP_F.sx(0)} cy={SP_F.sy(0)} r={3} className="fill-[#0f1b2d]" />
            </Plane>
            <div className="mt-1 text-center font-mono text-[0.7rem]">{sp.title}</div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A watch-only figure for the door check's setup (a story scene, no
//      task): the four paintings again, small, one after another, with the
//      door corner ringed each time it falls inside the paint. It poses the
//      question and does not answer "always?".

const X8_F = makeFrame(-5, 3, -2, 5, 7, 5);
const X8_SAY = [
  "The four remotes again, before the paint.",
  "Remote A: the whole floor. The door is inside.",
  "Remote B: a slanted line, right through the door.",
  "Remote C: the whole floor. The door is inside.",
];

export function DoorEveryTime({}: Story) {
  const s = useScene(4, [600, 1500, 1500, 1800]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 4 ? X8_SAY[k] : <span className={FADE}>Remote D: the wall line, through the door. Four paintings, and the door inside every one.</span>}
    >
      <div className="flex justify-center gap-1.5">
        {SHELF.map((r, i) => (
          <div key={r.name} className="w-[4.4rem]">
            <Plane f={X8_F} grid={1} axes={false} label={`remote ${r.name}'s span, with the door inside`} className="my-0! max-w-none">
              {k >= i + 1 && <Reach f={X8_F} keys={r.keys} on dots={false} />}
              {r.keys.map((key) => (
                <Arrow key={key.name} f={X8_F} from={O} to={key.v} tone={key.tone} w={1.6} />
              ))}
              {k >= i + 1 && <circle cx={X8_F.sx(0)} cy={X8_F.sy(0)} r={6} fill="none" strokeWidth={1.8} className={`${POP} stroke-cat-amber`} />}
              <circle cx={X8_F.sx(0)} cy={X8_F.sy(0)} r={2.6} className="fill-[#0f1b2d]" />
            </Plane>
            <div className="mt-0.5 text-center text-xs font-semibold">{r.name}</div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for the door check's explanation, no task: press nothing at
//      all, and Shiku is standing on the door corner. So whatever the buttons
//      are, the door is always inside the span.

const DI_SAY = [
  "Remote in hand, but not one button pressed.",
  "u zero times, v zero times: 0·u + 0·v = (0, 0).",
  "So Shiku is standing right on the door.",
];

export function DoorInside() {
  const s = useScene(3, [600, 2200, 1600]);
  const k = s.k;
  const keys = SHELF[2].keys;

  return (
    <Scene scene={s} caption={k < 3 ? DI_SAY[k] : <span className={FADE}>Whatever the buttons, this sum works for every remote. So the door never falls outside the span.</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[8rem] shrink-0">
          <Plane f={X2_F} grid={1} axes={false} label="no button pressed at all, so Shiku is on the door corner" className="my-0! max-w-none">
            {k >= 3 && <Reach f={X2_F} keys={keys} on />}
            {keys.map((key) => (
              <Arrow key={key.name} f={X2_F} from={O} to={[key.v[0] / 2, key.v[1] / 2]} tone={key.tone} w={2} faint />
            ))}
            <Door f={X2_F} />
            <Shiku f={X2_F} at={O} />
          </Plane>
        </div>
        <div className="min-w-0 font-mono text-[0.95rem] leading-relaxed">
          <div className={k >= 2 ? "" : "opacity-30"}>
            <span className="text-cat-blue">0</span>·u
          </div>
          <div className={k >= 2 ? "" : "opacity-30"}>
            <span className="text-muted">+</span> <span className="text-cat-coral">0</span>·v
          </div>
          <div className="mt-1 border-t border-border pt-1">
            = <b className={k >= 3 ? "text-accent-text" : ""}>(0, 0)</b>
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn. Four remotes the reader has not seen, and for each one the
//     call before any paint: one line, or the whole floor? A wrong tap
//     bounces, so the numbers actually get read. The dead (0, 0) button and
//     the lone (2, 3) are the two that catch people.

const YOURS: { keys: Key[]; note: string }[] = [
  {
    keys: [
      { name: "u", v: [3, 1], tone: "blue" },
      { name: "v", v: [-6, -2], tone: "coral" },
    ],
    note: "(−6, −2) is really −2 times (3, 1). The same road, the other way.",
  },
  {
    keys: [
      { name: "u", v: [1, 0], tone: "blue" },
      { name: "v", v: [1, 1], tone: "coral" },
    ],
    note: "One east, one slanting. Two different directions, so the whole floor.",
  },
  {
    keys: [
      { name: "u", v: [0, 0], tone: "blue" },
      { name: "v", v: [2, 1], tone: "coral" },
    ],
    note: "u = (0, 0) is a dead button: press it and Shiku doesn't move. That leaves one button in hand, which means one line.",
  },
  {
    keys: [{ name: "v", v: [2, 3], tone: "coral" }],
    note: "Only one button, so only one line.",
  },
];
const YF = makeFrame(-7, 4, -3, 4, 13, 10);
const YOUR_OPT = ["One line", "The whole floor"];

export function YourRemotes() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [miss, setMiss] = useSeed("miss", 0);
  const [shown, setShown] = useSeed("shown", false);
  const [done, setDone] = useSeed("done", false);
  const r = YOURS[at];
  const right = isPlane(r.keys) ? 1 : 0;

  const choose = (i: number) => {
    if (shown) return;
    if (i !== right) {
      setMiss(miss + 1);
      return;
    }
    setShown(true);
    if (at === YOURS.length - 1 && !done) {
      setDone(true);
      pass("Not how many buttons: which way they push.");
    }
  };
  const next = () => {
    setAt(at + 1);
    setShown(false);
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[9rem] shrink-0">
          <Plane f={YF} grid={1} axes={false} label={`remote ${at + 1}'s buttons`} className="my-0! max-w-none">
            <Reach f={YF} keys={r.keys} on={shown} dots={false} />
            {r.keys.map((k) => (
              <Arrow key={k.name} f={YF} from={O} to={k.v} tone={k.tone} w={2.4} />
            ))}
            <Door f={YF} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted">
            Remote {at + 1} of {YOURS.length}
          </div>
          <div className="mt-1 font-mono text-[1.05rem]">
            {r.keys.map((k, i) => (
              <span key={k.name} className={TEXT[k.tone]}>
                {i > 0 && <span className="text-muted"> · </span>}
                {tup(k.v)}
              </span>
            ))}
          </div>
          <div className="mt-2 grid gap-2">
            {YOUR_OPT.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, shown ? right : null, shown, right)} disabled={shown} onClick={() => choose(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </div>
      </div>
      {shown ? <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>{r.note}</div> : null}
      {miss > 0 && !shown ? <Nope key={miss}>Nope. Look again: do the two arrows really go two different ways?</Nope> : null}
      {shown && at < YOURS.length - 1 && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={next} className={primaryBtn}>
            Next remote
          </button>
        </div>
      )}
      <Task done={done}>Say each of the four remotes&apos; span: one line, or the whole floor?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for screen 9's explanation, no task: the dead button. Remote
//      3's u = (0, 0) is pressed once, then again and again, and Shiku stays
//      on the door; only v = (2, 1) moves him, along one line.

const X9_F = makeFrame(-1, 4, -1, 3, 18, 10);
const X9_KEYS: Key[] = YOURS[2].keys;
const X9_SAY = [
  "Remote 3: u = (0, 0) and v = (2, 1).",
  "Press u once. Shiku doesn't move a hair.",
  "Press u again, and again. Still on the door.",
];

export function DeadButton() {
  const s = useScene(3, [600, 1600, 2000]);
  const k = s.k;
  const n = k >= 2 ? 3 : k;
  const at = k >= 3 ? X9_KEYS[1].v : O;

  return (
    <Scene scene={s} caption={k < 3 ? X9_SAY[k] : <span className={FADE}>Only v moves him, and only along one line. So having u or not makes no difference.</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[7rem] shrink-0">
          <Plane f={X9_F} grid={1} axes={false} label="the (0, 0) button leaves Shiku on the door; only (2, 1) moves him, along one line" className="my-0! max-w-none">
            {k >= 3 && <Reach f={X9_F} keys={X9_KEYS} on dots={false} />}
            {k >= 3 && <Arrow f={X9_F} from={O} to={X9_KEYS[1].v} tone="coral" w={2.4} draw />}
            {(k === 1 || k === 2) && (
              <circle key={k} cx={X9_F.sx(0)} cy={X9_F.sy(0)} r={12} fill="none" strokeWidth={2} className={`${POP} stroke-cat-blue`} />
            )}
            <Door f={X9_F} />
            <Shiku f={X9_F} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 font-mono text-[0.95rem] leading-relaxed">
          <div className={k >= 1 ? "" : "opacity-30"}>
            <span key={n} className={`${POP} inline-block text-cat-blue`}>
              {n}
            </span>
            ·u = (0, 0)
          </div>
          <div className={k >= 3 ? "" : "opacity-30"}>
            <span className="text-cat-coral">1</span>·v = (2, 1)
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10 · Try it: one remote has only (2, 0); another has (2, 0) and (−5, 0).
//      The reader picks, as a picture, the second remote's span: the whole
//      floor, the one wall line, or two lines. The pick is painted on the
//      floor, then Shiku tries the second remote's real presses: every stop
//      lands on the wall line, so a wrong picture is left with paint he never
//      reaches. Wrong tries bounce.

const TP_F = makeFrame(-5, 5, -3, 3, 16, 10);
const TP_MINI = makeFrame(-3, 3, -2, 2, 11, 5);
const TP_KEYS: Key[] = SHELF[3].keys;
/** real presses of (2, 0) and (−5, 0): u, u + v, 2u + v, 2u, v */
const TP_STOPS: XY[] = [
  [2, 0],
  [-3, 0],
  [-1, 0],
  [4, 0],
  [-5, 0],
];
type TpKind = "floor" | "wall" | "two";
const TP_PICS: { kind: TpKind; label: string }[] = [
  { kind: "floor", label: "The whole floor" },
  { kind: "wall", label: "One wall line" },
  { kind: "two", label: "Two lines" },
];
const TP_RIGHT = 1;
const TP_NOPE: Record<TpKind, string> = {
  floor: "Nope. Every stop lands on the wall line. Which way does (−5, 0) push Shiku? A new way?",
  wall: "",
  two: "Nope. No stop lands on the second line. Which way does (−5, 0) push Shiku? A new way?",
};

/** a span shape drawn on a floor: the whole floor, the wall line, or the wall line plus the side wall */
const TP_INK = {
  main: { fill: "fill-cat-violet/25", stroke: "stroke-cat-violet/30" },
  mini: { fill: "fill-[#8b5cf6]/40", stroke: "stroke-[#8b5cf6]/50" },
};
function TpShape({ f, kind, ink, className = "" }: { f: Frame; kind: TpKind; ink: keyof typeof TP_INK; className?: string }) {
  if (kind === "floor") return <rect x={f.pad} y={f.pad} width={f.W - 2 * f.pad} height={f.H - 2 * f.pad} className={`${className} ${TP_INK[ink].fill}`} />;
  return (
    <g className={`${className} ${TP_INK[ink].stroke}`} strokeWidth={f.u * 0.7} strokeLinecap="round">
      <line x1={f.sx(f.x0)} y1={f.sy(0)} x2={f.sx(f.x1)} y2={f.sy(0)} />
      {kind === "two" && <line x1={f.sx(0)} y1={f.sy(f.y0)} x2={f.sx(0)} y2={f.sy(f.y1)} />}
    </g>
  );
}

export function WallPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(320);
  const won = pick === TP_RIGHT;
  const n = pl.running ? pl.k : pick !== null ? TP_STOPS.length : 0;
  const at = n ? TP_STOPS[n - 1] : O;

  const choose = (i: number) => {
    if (won) return;
    setPick(i);
    if (i !== TP_RIGHT) setMiss(miss + 1);
    pl.play(TP_STOPS.length, () => {
      if (i === TP_RIGHT) pass("One more button, and no more reach.");
    });
  };
  const look = (i: number): Look => (pick !== i ? (won ? "dim" : "idle") : n < TP_STOPS.length ? "picked" : i === TP_RIGHT ? "right" : "wrong");

  return (
    <>
      <Plane f={TP_F} grid={1} axes={false} label="the second remote's two buttons, (2, 0) and (−5, 0), from the door" className="my-1! max-w-[11rem]">
        {pick !== null && <TpShape key={pick} f={TP_F} kind={TP_PICS[pick].kind} ink="main" className={FADE} />}
        {TP_STOPS.slice(0, n).map((p) => (
          <Dot key={`${p}`} f={TP_F} at={p} r={3} className="fill-cat-violet" pop />
        ))}
        {TP_KEYS.map((key) => (
          <Arrow key={key.name} f={TP_F} from={O} to={key.v} tone={key.tone} w={2.4} />
        ))}
        <Door f={TP_F} />
        <Shiku f={TP_F} at={at} />
      </Plane>
      <div className="text-center text-sm text-muted">
        Second remote: <span className="font-mono text-cat-blue">(2, 0)</span> and <span className="font-mono text-cat-coral">(−5, 0)</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {TP_PICS.map((p, i) => (
          <button
            key={p.kind}
            type="button"
            disabled={won || pl.running}
            onClick={() => choose(i)}
            className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-1 py-1.5 text-xs font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look(i)]}`}
          >
            <svg viewBox={`0 0 ${TP_MINI.W} ${TP_MINI.H}`} className="h-auto w-full max-w-[5rem]" aria-hidden="true">
              <rect x={0} y={0} width={TP_MINI.W} height={TP_MINI.H} rx={4} fill="white" stroke="#cbd5e1" />
              <TpShape f={TP_MINI} kind={p.kind} ink="mini" />
              <circle cx={TP_MINI.sx(0)} cy={TP_MINI.sy(0)} r={2.6} fill="#0f1b2d" />
            </svg>
            {p.label}
          </button>
        ))}
      </div>
      {pick !== null && !pl.running && pick !== TP_RIGHT && <Nope key={miss}>{TP_NOPE[TP_PICS[pick].kind]}</Nope>}
      {won && !pl.running && <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>Every stop is on the wall line, same as the first remote.</div>}
      <Task done={won && !pl.running}>Pick the picture of the second remote&apos;s span.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for the Try-it's explanation, no task: {(2, 0)} and
//       {(2, 0), (−5, 0)} shade exactly the same wall line, because the
//       second button only walks the first one's road backwards.

const XC_F = makeFrame(-5, 5, -2, 2, 18, 10);
const XC_ONE: Key[] = [{ name: "u", v: [2, 0], tone: "blue" }];
const XC_TWO: Key[] = [...XC_ONE, { name: "v", v: [-5, 0], tone: "coral" }];
const XC_SAY = [
  "The first remote has only one button, (2, 0).",
  "Forwards, backwards and half presses give the whole line along the wall.",
  "The second remote's extra button, (−5, 0), walks that same wall too.",
];

export function WallLine() {
  const s = useScene(3, [600, 1800, 2000]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 3 ? XC_SAY[k] : <span className={FADE}>So the two spans are exactly the same: that one line. One more button, and not a hair more reach.</span>}
    >
      <div className="mx-auto w-[12rem]">
        <Plane f={XC_F} grid={1} axes={false} label="both remotes shade the same wall line" className="my-0! max-w-none">
          {k >= 2 && <Reach f={XC_F} keys={XC_ONE} on dots={false} />}
          <Arrow f={XC_F} from={O} to={XC_ONE[0].v} tone="blue" w={2.6} draw />
          {k >= 3 && <Arrow f={XC_F} from={O} to={XC_TWO[1].v} tone="coral" w={2.4} draw />}
          <Door f={XC_F} />
        </Plane>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11a · A story scene for the last step's setup, no task: just before Maghrib
//       Fahim comes back with remote C, and Nasib's rule is proved wrong.

const S9_FLOOR = 150;

export function RemoteBought({}: Story) {
  const s = useScene(3, [600, 2000, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S9_FLOOR} label="at dusk Fahim comes out of the toy shop with remote C, Nasib is not impressed, and Shiku walks home with them">
        <Stall x={48} y={S9_FLOOR} sign="Toys" color="#0d9488" w={72} />
        <CastPerson who="fahim" x={k >= 3 ? 112 : 152} y={S9_FLOOR + 16} facing={k >= 3 ? -1 : 1} walking={k === 3} arm={k >= 1 ? "hold" : "down"} mood={k >= 1 ? "happy" : "plain"} />
        {k >= 1 && <CastCard x={k >= 3 ? 112 : 152} y={S9_FLOOR - 56} text="remote C" tone="teal" />}
        {k >= 1 && <S1Remote x={k >= 3 ? 96 : 164} y={S9_FLOOR - 34} broken={false} />}
        <CastPerson who="nasib" x={262} y={S9_FLOOR + 16} facing={-1} mood={k >= 2 ? "sad" : "smug"} />
        {k === 2 && <Bubble x={262} y={S9_FLOOR - 50} side="left" lines={["But that's the", "messiest-looking one!"]} />}
        <Robot x={k >= 3 ? 168 : 206} y={S9_FLOOR + 16} walking={k === 3} />
        {k >= 3 && <Bubble x={112} y={S9_FLOOR - 78} side="right" lines={["Don't count buttons.", "See how far they reach."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 11 · The bet settled. Tap each remote to open its verdict: ✓ ✗ ✓ ✗. Nasib's
//      "two buttons go anywhere" lost twice, and the rule that replaces it is
//      the journey's one line.

const VERDICT: { name: string; ok: boolean; reach: string; why: string }[] = [
  { name: "A", ok: true, reach: "the whole floor", why: "One east, one north. Two different directions." },
  { name: "B", ok: false, reach: "one slanted line", why: "(2, 2) is (1, 1) twice, so only one direction." },
  { name: "C", ok: true, reach: "the whole floor", why: "Messy to look at, but two different directions." },
  { name: "D", ok: false, reach: "a line along the door's wall", why: "(2, 0) and (−5, 0) both walk the same wall." },
];

export function Finale() {
  const pass = useGate();
  const [open, setOpen] = useSeed<string[]>("open", []);
  const all = open.length === VERDICT.length;

  const show = (n: string) => {
    if (open.includes(n)) return;
    const next = [...open, n];
    setOpen(next);
    if (next.length === VERDICT.length) pass("Two buttons each, yet two got stuck.");
  };

  return (
    <>
      <div className="mx-auto grid max-w-sm gap-1.5">
        {VERDICT.map((r) => (
          <button
            key={r.name}
            type="button"
            onClick={() => show(r.name)}
            disabled={open.includes(r.name)}
            className={`w-full cursor-pointer rounded-xl border-2 px-3 py-1.5 text-left transition-colors disabled:cursor-default ${
              open.includes(r.name) ? (r.ok ? "border-accent bg-accent/10" : "border-danger/50 bg-danger/5") : "border-border hover:border-accent"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.95rem] font-semibold">Remote {r.name}</span>
              {open.includes(r.name) ? (
                <span className={`text-sm ${r.ok ? "text-accent-text" : "text-danger"}`}>
                  {r.ok ? "✓" : "✕"} {r.reach}
                </span>
              ) : (
                <span className="text-sm text-muted">Open</span>
              )}
            </div>
            {open.includes(r.name) && <div className={`${FADE} text-xs text-muted`}>{r.why}</div>}
          </button>
        ))}
      </div>
      {all && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-violet/5 px-4 py-3 text-center text-[0.95rem]`}>
          Nasib&apos;s rule lost twice. Counting buttons gets you nothing; look at how far they reach.
        </div>
      )}
      <Task done={all}>Open the four remotes&apos; results, one by one.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11½ · A figure for the last step's explanation, no task: the two remotes
//       that beat Nasib's rule, side by side. B paints one slanted line, D
//       one wall line: two buttons each, one line each.

const X11_F = makeFrame(-5, 3, -2, 3, 12, 8);
/** B's v is drawn a little to the side of u, or the two would lie on top of each other */
const X11_OFF: XY = [0.3, -0.3];
const X11_SAY = [
  "Remote B and remote D. Two buttons each.",
  "B: stuck on one slanted line.",
  "D: stuck on the wall line.",
];

export function RuleLost() {
  const s = useScene(3, [600, 1600, 2000]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? X11_SAY[k] : <span className={FADE}>Don&apos;t count the buttons. Look at how far they reach.</span>}>
      <div className="flex justify-center gap-3">
        {[1, 3].map((ri, i) => {
          const r = SHELF[ri];
          return (
            <div key={r.name} className="w-[7rem]">
              <Plane f={X11_F} grid={1} axes={false} label={`remote ${r.name}: two buttons, one line`} className="my-0! max-w-none">
                {k >= i + 1 && <Reach f={X11_F} keys={r.keys} on dots={false} />}
                {r.keys.map((key, j) => (
                  <Arrow
                    key={key.name}
                    f={X11_F}
                    from={ri === 1 && j === 1 ? X11_OFF : O}
                    to={ri === 1 && j === 1 ? add(key.v, X11_OFF) : key.v}
                    tone={key.tone}
                    w={2}
                  />
                ))}
                <circle cx={X11_F.sx(0)} cy={X11_F.sy(0)} r={2.8} className="fill-[#0f1b2d]" />
              </Plane>
              <div className="mt-0.5 text-center text-xs font-semibold">
                Remote {r.name}
                {k >= i + 1 && <span className={`${FADE} text-danger`}> ✕</span>}
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  MovingDay: { chalk: { k: 1 }, broken: { k: 2 }, end: {} },
  RemoteShelf: { start: {}, sealed: { picks: ["A", "B"], sealed: true } },
  ShelfFour: { start: { k: 0 }, numbers: { k: 2 }, end: {} },
  OneButton: { start: {}, swept: { q: 6, seen: [0, 4, 8, -4, -8, 6, 10, 14] } },
  LineNamed: { mid: { k: 2 }, end: {} },
  OldRemote: { start: {}, two: { amt: [2, 2], hit: ["table"] }, all: { amt: [3, 5], hit: ["almirah", "bed", "table", "shoe rack"] } },
  AlmirahBuild: { east: { k: 1 }, end: {} },
  TwinButtons: {
    start: {},
    table: { amt: [2, 0], table: true },
    stuck: { amt: [1, 1], table: true, tried: [0, 1, 3, 4, 5, -1], done: true },
  },
  SameDirection: { mid: { k: 2 }, end: {} },
  SlotsSame: { start: {}, mid: { k: 2 }, end: { k: 4 } },
  TwinSlots: { start: { k: 0 }, three: { k: 2 }, end: {} },
  MessyRemote: { start: {}, hunt: { guess: 0, amt: [5, 0] }, found: { guess: 0, amt: [5, -1], hit: ["almirah"] } },
  BackStep: { over: { k: 2 }, end: {} },
  PressesFirst: { arrows: { k: 0 }, right: { k: 1 }, end: {} },
  SolveWalk: { start: {}, found: { pick: 2, b: -1 }, stuck: { pick: 1, b: 2 }, plain: { pick: 0, b: 5 } },
  PaintReach: { start: {}, b: { pick: 1, on: true, painted: [0, 1] }, all: { pick: 3, on: true, painted: [0, 1, 2, 3] } },
  ThreeSpans: { mid: { k: 2 }, end: {} },
  DoorEveryTime: { start: { k: 0 }, mid: { k: 2 }, end: {} },
  DoorInside: { mid: { k: 2 }, end: {} },
  YourRemotes: { start: {}, shown: { at: 0, shown: true }, miss: { at: 2, miss: 1 }, last: { at: 3, shown: true, done: true } },
  DeadButton: { again: { k: 2 }, end: {} },
  WallPick: { start: {}, floor: { pick: 0, miss: 1 }, two: { pick: 2, miss: 1 }, right: { pick: 1 } },
  WallLine: { mid: { k: 2 }, end: {} },
  RemoteBought: { bought: { k: 1 }, nasib: { k: 2 }, end: {} },
  Finale: { start: {}, some: { open: ["A", "B"] }, all: { open: ["A", "B", "C", "D"] } },
  RuleLost: { mid: { k: 1 }, end: {} },
};
