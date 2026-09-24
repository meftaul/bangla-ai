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
  primaryBtn,
  usePlay,
  useScene,
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
// numbers, Nasib's twin-button remote that stays on one line, and the
// messiest-looking one, which gets everywhere by overshooting and stepping
// back. A paint toggle then shades everything a remote can reach, and that
// shaded set is the word: span. The door is always in it, the reader calls
// four new remotes unaided, picks the picture of a two-button remote's span,
// and the Finale settles the bet. 10 steps.
//
// The presses worked out instead of hunted (settle one count, and the first
// slot forces the other), and remote B's two slots locked together, are their
// own journey now: 5.1b, battery-journey.tsx, which imports this machine.
//
// The machine itself (Door, Chalk, Marks, ButtonRemote, Reach, Chains, Recipe)
// is built here and reused by 5.1b, 5.2, 5.3 and 5.5, the way Article 4
// reused DotBox.
//
// Story scenes (StoryFrame) act out the toy shop: the shopkeeper chacha, the
// one-button remote, Nasib grabbing remote B, the cheap messy C, the paint
// toggle, the four extra remotes from the back shelf. Every <Then> figure is
// watch-only (useScene) and acts out its paragraph.
//
// Words are the author's Banglish (pathshala-journey §2); bubbles are narrated
// the story-bangla-prose way, and only the shopkeeper speaks dialect.
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

/** Ammu's chalk marks: `name` is the id other journeys match on, `label` is what the chalk says. */
export const MARKS: { name: string; label: string; at: XY }[] = [
  { name: "almirah", label: "আলমারি", at: [3, 5] },
  { name: "bed", label: "খাট", at: [1, 3] },
  { name: "table", label: "টেবিল", at: [2, 2] },
  { name: "shoe rack", label: "জুতার র‍্যাক", at: [1, 0] },
];
/** a mark's chalk label by id */
const labelOf = (name: string) => MARKS.find((m) => m.name === name)?.label ?? name;
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
        দরজা
      </text>
    </g>
  );
}

/** One of Ammu's chalk marks on the tiles, ticked once Shiku has stood on it; `name` is the word chalked beside it. */
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
        <Chalk key={m.name} f={f} at={m.at} name={m.label} on={hit.includes(m.name)} />
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

/**
 * A remote in the story, top-left at (x, y), 16 × 26: one or two keys, dead
 * and cracked when `broken`, and a toggle on top that lights up when `glow`.
 * Exported for 5.1b (battery-journey), which has the same remote C in hand.
 */
export function Handset({ x, y, keys = 2, broken = false, toggle = false, glow = false }: { x: number; y: number; keys?: 1 | 2; broken?: boolean; toggle?: boolean; glow?: boolean }) {
  return (
    <g className={POP}>
      {toggle && <rect x={x + 5} y={y - 4} width={6} height={5} rx={1.5} fill={glow ? "#f59e0b" : "#94a3b8"} stroke="#0f172a" strokeWidth={0.6} />}
      {glow && <circle cx={x + 8} cy={y - 2} r={6} fill="#fbbf24" opacity={0.45} className={POP} />}
      <rect x={x} y={y} width={16} height={26} rx={4} fill="#334155" stroke="#0f172a" />
      {keys === 1 ? (
        <rect x={x + 3.5} y={y + 9} width={9} height={8} rx={2} fill="#2563eb" />
      ) : (
        <>
          <rect x={x + 3.5} y={y + 5} width={9} height={6} rx={2} fill={broken ? "#64748b" : "#2563eb"} />
          <rect x={x + 3.5} y={y + 15} width={9} height={6} rx={2} fill={broken ? "#64748b" : "#0d9488"} />
        </>
      )}
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
                {m.label}
              </text>
            </g>
          ))}
        <CastPerson who="ammu" x={96} y={S1_FLOOR + 16} arm={k === 1 ? "point" : "down"} mood={k >= 1 ? "happy" : "plain"} />
        {k === 1 && <Bubble x={96} y={S1_FLOOR - 50} side="right" lines={["কোথায় কী বসবে,", "দাগ দিয়ে রাখলাম."]} />}
        <CastPerson who="fahim" x={186} y={S1_FLOOR + 16} mood={k >= 2 ? "sad" : "plain"} arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && <Handset x={198} y={S1_FLOOR - 30} broken />}
        {k === 2 && <Bubble x={186} y={S1_FLOOR - 50} side="mid" lines={["Shiku র remote টা", "ভেঙে গেছে."]} />}
        <Robot x={232} y={S1_FLOOR + 16} />
        <CastPerson who="nasib" x={k >= 3 ? 288 : 372} y={S1_FLOOR + 16} facing={-1} walking={k === 3} mood="smug" />
        {k >= 3 && <Bubble x={288} y={S1_FLOOR - 50} side="left" lines={["দুটো button দিয়েই", "সব জায়গায় যাওয়া যাবে."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// The toy shop, the set for the story scenes of screens 2, 4, 5, 6 and 8: the
// sign, the back shelf with the four remotes, the counter, and the shopkeeper
// chacha behind it (the cast's white-bearded look, his own name on the
// counter). The customers stand on the left, feet at SH_FEET.

const SH_FLOOR = 150;
const SH_FEET = 166;
/** the shopkeeper stands on a step behind the counter, so his chest shows over it */
const KEEP_Y = 128;
/** where the four shelf remotes (A–D) stand, top-left x */
const SH_SLOT = [172, 206, 240, 274];

/** the sign and the back shelf; remotes whose index is in `gone` have been taken down */
function ShopWall({ gone = [] }: { gone?: number[] }) {
  return (
    <g className="pointer-events-none">
      <rect x={20} y={12} width={112} height={22} rx={4} fill="#0d9488" />
      <text x={76} y={27} textAnchor="middle" fontSize={10} fontWeight={700} fill="#f0fdfa">
        খেলনার দোকান
      </text>
      <rect x={160} y={64} width={146} height={5} rx={1.5} fill="#92400e" />
      {SH_SLOT.map((x, i) =>
        gone.includes(i) ? null : (
          <g key={x}>
            <rect x={x} y={38} width={16} height={26} rx={4} fill="#334155" stroke="#0f172a" />
            <rect x={x + 3.5} y={43} width={9} height={6} rx={2} fill="#2563eb" />
            <rect x={x + 3.5} y={53} width={9} height={6} rx={2} fill="#e0664f" />
          </g>
        ),
      )}
      {SH_SLOT.map((x, i) => (
        <text key={`n${x}`} x={x + 8} y={78} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#78350f">
          {SHELF[i].name}
        </text>
      ))}
    </g>
  );
}

/** the counter, drawn over the shopkeeper's legs, with his name on its front */
function ShopCounter() {
  return (
    <g className="pointer-events-none">
      <rect x={176} y={112} width={128} height={38} fill="#b45309" />
      <rect x={172} y={108} width={136} height={6} rx={2} fill="#92400e" />
      <text x={240} y={136} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#fef3c7">
        দোকানদার চাচা
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1 · The shelf. Four two-button remotes and Ammu's four marks; the reader
//     ticks the ones they think reach every mark and seals the bet, unmarked.
//     This is the journey's question, and the Finale is what settles it.
//     Each tap slides that remote down off the shelf into the bet tray (and a
//     second tap puts it back); sealing draws the tray shut. Nothing is marked.

const B1_X = [18, 48, 78, 108];
/** how far a picked remote slides down, from the shelf into the tray */
const B1_DROP = 40;

function B1Shelf({ picks, sealed }: { picks: string[]; sealed: boolean }) {
  return (
    <svg viewBox="0 0 128 84" className="h-auto w-full" aria-hidden="true">
      <rect x={4} y={36} width={120} height={4} rx={1.5} fill="#a16207" />
      <rect
        x={3}
        y={46}
        width={122}
        height={36}
        rx={6}
        fill="none"
        strokeWidth={sealed ? 2.2 : 1.4}
        strokeDasharray={sealed ? undefined : "4 3"}
        className={`transition-[stroke] duration-500 motion-reduce:transition-none ${sealed ? "stroke-cat-amber" : "stroke-[#94a3b8]"}`}
      />
      <text x={121} y={79} textAnchor="end" fontSize={7.5} fontWeight={700} className={sealed ? "fill-cat-amber" : "fill-[#94a3b8]"}>
        {sealed ? "বাজি সিল" : "বাজি"}
      </text>
      {SHELF.map((r, i) => {
        const on = picks.includes(r.name);
        const x = B1_X[i];
        return (
          <g
            key={r.name}
            style={{ transform: `translateY(${on ? B1_DROP : 0}px)` }}
            className="transition-transform duration-500 ease-out motion-reduce:transition-none"
          >
            <rect x={x - 8} y={2} width={16} height={27} rx={4} fill="#334155" stroke="#0f172a" />
            <rect x={x - 4.5} y={6} width={9} height={6} rx={2} fill="#2563eb" />
            <rect x={x - 4.5} y={17} width={9} height={6} rx={2} fill="#e0664f" />
            <text x={x} y={35} textAnchor="middle" fontSize={7} fontWeight={700} className="fill-[#5a6b7d]">
              {r.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function RemoteShelf() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<string[]>("picks", []);
  const [sealed, setSealed] = useSeed("sealed", false);

  const toggle = (n: string) => setPicks(picks.includes(n) ? picks.filter((p) => p !== n) : [...picks, n]);
  const seal = () => {
    setSealed(true);
    pass(`বাজি সিল: ${picks.length} টা remote সব mark এ.`);
  };

  return (
    <>
      <div className="mx-auto flex max-w-sm flex-wrap items-center justify-center gap-x-3 gap-y-0.5 rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-3 py-1.5 text-sm">
        <span className="font-semibold">আম্মুর mark:</span>
        {MARKS.map((m) => (
          <span key={m.name}>
            {m.label} <span className="font-mono">{tup(m.at)}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="min-w-0 flex-1 text-sm font-medium text-muted">কোন কোন remote চারটা mark এই পৌঁছাবে? যতগুলো মনে হয়, tap করুন.</div>
        <div className="w-[7.5rem] shrink-0">
          <B1Shelf picks={picks} sealed={sealed} />
        </div>
      </div>
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
            {picks.length ? "বাজি সিল করুন" : "একটাও পারবে না. সিল করুন"}
          </button>
        </div>
      ) : (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>বাজি সিল হলো. দোকান বন্ধের আগে চারটাই চালিয়ে দেখবো.</div>
      )}
      <Task done={sealed}>Remote গুলো বেছে নিন, তারপর বাজি সিল করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: four remotes that look
//      almost the same, two buttons each; the numbers on the buttons land
//      last, and under each remote a chalk mark waits with a "?".

const X1_SAY = [
  "Shelf এ চারটা remote. দেখতে প্রায় একই রকম.",
  "প্রত্যেকটায় দুটো করে button.",
  "পার্থক্য শুধু button এর উপরে লেখা number এ.",
  "ওই number গুলোই ঠিক করবে Shiku কোথায় যেতে পারবে, আর কোথায় পারবে না.",
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
// 2a · A story scene for screen 2's setup, no task: the shopkeeper puts the
//      shop's cheapest remote on the counter, one button; Fahim picks it up
//      and thinks the author's line. Nothing about where it reaches.

export function CheapRemote({}: Story) {
  const s = useScene(2, [600, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={SH_FLOOR} label="in the toy shop the shopkeeper puts a one-button remote on the counter, and Fahim picks it up to try it first">
        <ShopWall />
        <CastPerson who="nana" x={240} y={KEEP_Y} facing={1} arm={k === 1 ? "hold" : "down"} />
        <ShopCounter />
        {k === 1 && <Handset x={196} y={82} keys={1} />}
        {k === 1 && <Bubble x={240} y={KEEP_Y - 66} side="left" lines={["সবচাইতে সস্তা এইটা.", "button একটাই."]} />}
        <Robot x={30} y={SH_FEET} />
        <CastPerson who="nasib" x={112} y={SH_FEET} />
        <CastPerson who="fahim" x={k >= 2 ? 156 : 70} y={SH_FEET} walking={k === 2} arm={k >= 2 ? "hold" : "down"} />
        {k >= 2 && <Handset x={166} y={SH_FEET - 52} keys={1} />}
        {k >= 2 && <Bubble x={156} y={SH_FEET - 66} side="left" tone="think" lines={["এটাই আগে", "use করে দেখি."]} />}
      </Stage>
    </StoryFrame>
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
    if (!done && swept(next)) pass("এক button: দরজার উপর দিয়ে একটা line.");
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
      <div className="mt-1 text-center text-xs text-muted">পিছনে টানলে minus. মাঝপথে থামালে half-press.</div>
      <Task done={done}>Button টা সামনে, পিছনে, মাঝপথে থামিয়ে দেখুন. খাটের mark এ কি নামা যায়?</Task>
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
  "দরজার corner থেকে v button. এক press মানে (1, 1).",
  "সামনে চাপতে থাকুন, Shiku এই dot গুলোতে নামে.",
  "পিছনে চাপুন, অর্ধেক চাপুন, মাঝের ফাঁকগুলোও ভরে যায়.",
];

export function LineNamed() {
  const s = useScene(3, [600, 1800, 2000]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 3 ? X2_SAY[k] : <span className={FADE}>সব মিলিয়ে একটা পুরা line, ঠিক দরজার উপর দিয়ে গেছে. এই পুরা line টার নাম span&#x7B;v&#x7D;.</span>}
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
    if (got.length === MARKS.length) pass("A তে mark এর দুই সংখ্যাই press এর count.");
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
      <Ticks items={MARKS.map((m) => [m.label, hit.includes(m.name)] as [string, boolean])} />
      <Task done={done}>Shiku কে চারটা mark এ একবার করে নামান.</Task>
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
  "আলমারির mark (3, 5) এ.",
  "e₁ তিনবার: তিন tile east এ.",
  "তারপর e₂ পাঁচবার: পাঁচ tile north এ. ঠিক আলমারির উপর.",
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
      caption={k < 3 ? X3_SAY[k] : <span className={FADE}>যেকোনো tile এ একই কায়দা. তাই remote A র span পুরা floor.</span>}
    >
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[6.8rem] shrink-0">
          <Plane f={X3_F} grid={1} ticks={0} label="the almirah (3, 5) reached by pressing e₁ three times and e₂ five times" className="my-0! max-w-none">
            {k >= 3 && <Reach f={X3_F} keys={keys} on dots={false} />}
            <Chalk f={X3_F} at={ALMIRAH} name="আলমারি" on={k >= 2} />
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
// 3¾ · A second figure for screen 3's explanation, no task: "name any tile".
//      Two more tiles, one of them west of the door, each reached by pressing
//      e₁ and e₂ its own two numbers of times; then every tile crossing on the
//      floor lights up, and Nasib's rule survives for now.

const X3B_F = makeFrame(-3, 5, -1, 4, 15, 12);
const X3B_TILES: XY[] = [
  [4, 1],
  [-2, 3],
];
const X3B_SAY = [
  "Floor এর যেকোনো একটা tile নিন.",
  "(4, 1): e₁ চারবার, e₂ একবার.",
  "(−2, 3): e₁ দুইবার পিছনে, মানে −2. তারপর e₂ তিনবার.",
];

export function TileCounts() {
  const s = useScene(3, [600, 1800, 2400]);
  const k = s.k;
  const keys = SHELF[0].keys;
  const tile = k === 1 ? X3B_TILES[0] : k === 2 ? X3B_TILES[1] : null;
  const amt = tile ? [tile[0], tile[1]] : [0, 0];

  return (
    <Scene
      scene={s}
      caption={
        k < 3 ? (
          <span key={k} className={FADE}>
            {X3B_SAY[k]}
          </span>
        ) : (
          <span className={FADE}>যে tile-ই বলুন, press এর count ওর নিজের দুইটা সংখ্যা. নাসিবের rule আপাতত টিকে গেলো.</span>
        )
      }
    >
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[8rem] shrink-0">
          <Plane f={X3B_F} grid={1} ticks={0} label="any tile on the floor is reached by pressing e₁ and e₂ its own two numbers of times" className="my-0! max-w-none">
            {k >= 3 && <Reach f={X3B_F} keys={keys} on />}
            {tile && <Star key={k} f={X3B_F} at={tile} done />}
            <Chains key={`c${k}`} f={X3B_F} keys={keys} amt={amt} />
            <Door f={X3B_F} />
            <Shiku f={X3B_F} at={tile ?? O} />
          </Plane>
        </div>
        <div className="min-w-[5.5rem] font-mono text-[0.95rem] leading-relaxed">
          {tile ? (
            <div key={k} className={FADE}>
              <div>
                <span className="text-cat-blue">{sg(tile[0])}</span>·e₁
              </div>
              <div>
                <span className="text-muted">+</span> <span className="text-cat-coral">{tile[1]}</span>·e₂
              </div>
              <div className="mt-1 border-t border-border pt-1">= {tup(tile)}</div>
            </div>
          ) : k >= 3 ? (
            <div className={FADE}>
              <div>
                <span className="text-cat-blue">x</span>·e₁ <span className="text-muted">+</span> <span className="text-cat-coral">y</span>·e₂
              </div>
              <div className="mt-1 border-t border-border pt-1">= (x, y)</div>
            </div>
          ) : (
            <div className="text-muted">(?, ?)</div>
          )}
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: Nasib asks for remote B,
//      holds it up with its two numbers, and makes his claim again.

export function NasibPicksB({}: Story) {
  const s = useScene(3, [600, 1800, 1800]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={SH_FLOOR} label="Nasib asks the shopkeeper for remote B, holds it up with its buttons (1, 1) and (2, 2), and says it will go everywhere too">
        <ShopWall gone={k >= 2 ? [1] : []} />
        <CastPerson who="nana" x={240} y={KEEP_Y} facing={1} />
        <ShopCounter />
        <Robot x={30} y={SH_FEET} />
        <CastPerson who="fahim" x={70} y={SH_FEET} />
        <CastPerson who="nasib" x={k >= 2 ? 150 : 112} y={SH_FEET} walking={k === 2} arm={k === 1 ? "point" : k >= 2 ? "hold" : "down"} mood={k >= 3 ? "smug" : "plain"} />
        {k === 1 && <Bubble x={112} y={SH_FEET - 66} side="right" lines={["চাচা, B টা দেন তো."]} />}
        {k >= 2 && <Handset x={160} y={SH_FEET - 52} />}
        {k >= 2 && <CastCard x={150} y={SH_FEET - 78} text="(1, 1)  (2, 2)" tone="coral" />}
        {k >= 3 && <Bubble x={150} y={SH_FEET - 90} side="left" lines={["দুইটা আলাদা জোড়া.", "এটাও সব জায়গায় যাবে."]} />}
      </Stage>
    </StoryFrame>
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
      pass("(2, 2) হলো (1, 1) এরই দুইগুণ.");
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
          টেবিল হয়ে গেলো. এবার star টা আলমারিতে, <span className="font-mono">(3, 5)</span>. Try হলো {tried.length} / {TWIN_TRIES}.
        </div>
      )}
      <Task done={done}>{table ? "এবার আলমারির mark এ নামান, (3, 5) এ. অন্তত 6 রকম করে try করুন." : "আগে টেবিলের mark এ নামান, (2, 2) এ."}</Task>
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
  "Remote B র দুই button: u = (1, 1), v = (2, 2).",
  "u, তারপর আরেকবার u. গিয়ে পড়লেন ঠিক v এর মাথায়. v হলো u, দুইবার.",
  "যেভাবেই চাপেন, Shiku থাকে এই একটা line এর উপর.",
];

export function SameDirection() {
  const s = useScene(3, [600, 1900, 1800]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? X4_SAY[k] : <span className={FADE}>আর আলমারির mark ওই line এর বাইরে. তাই Shiku কখনোই ওখানে যেতে পারবে না.</span>}>
      <div className="mx-auto w-[8.5rem]">
        <Plane f={X4_F} grid={1} axes={false} label="remote B's two buttons push the same way, so every landing sits on one line" className="my-0! max-w-none">
          {k >= 2 && <Reach f={X4_F} keys={SHELF[1].keys} on dots={false} />}
          {k >= 3 && <Chalk f={X4_F} at={ALMIRAH} name="আলমারি" />}
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
// 5a · A story scene for screen 5's setup, no task: the shopkeeper takes down
//      remote C, the messiest-looking one, and says why nobody buys it.

export function CheapC({}: Story) {
  const s = useScene(2, [600, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={SH_FLOOR} label="the shopkeeper takes remote C off the shelf, buttons (1, 2) and (2, 5), and says it is cheap and nobody buys it">
        <ShopWall gone={k >= 1 ? [2] : []} />
        <CastPerson who="nana" x={240} y={KEEP_Y} facing={1} arm={k >= 1 ? "hold" : "down"} />
        <ShopCounter />
        {k >= 1 && <Handset x={252} y={70} />}
        {k >= 1 && <CastCard x={184} y={94} text="(1, 2)  (2, 5)" tone="teal" />}
        {k === 1 && <Bubble x={240} y={KEEP_Y - 66} side="left" lines={["দাম কম এইটার."]} />}
        {k >= 2 && <Bubble x={240} y={KEEP_Y - 66} side="left" lines={["সংখ্যা দেইখা", "কেউ নেয় না."]} />}
        <Robot x={30} y={SH_FEET} />
        <CastPerson who="fahim" x={76} y={SH_FEET} />
        <CastPerson who="nasib" x={124} y={SH_FEET} mood={k >= 2 ? "smug" : "plain"} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · Remote C, the untidiest-looking one: u = (1, 2), v = (2, 5). The reader
//     calls it first, then hunts: five presses of u overshoot to (5, 10), and
//     one press back on v lands exactly on the almirah. Then the bed, with the
//     minus on u this time.

const GA_GUESS = ["পারবে", "পারবে না"];

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
    if (got.length === 2) pass("এলোমেলো, কিন্তু দুইটা আলাদা direction.");
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
                u = <span className="font-mono">(1, 2)</span>, v = <span className="font-mono">(2, 5)</span>. এই remote কি আলমারিতে, মানে{" "}
                <span className="font-mono">(3, 5)</span> এ পৌঁছাতে পারবে?
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
                আপনার guess: {GA_GUESS[guess]} {done && <span className={guess === 0 ? "text-accent-text" : "text-danger"}>{guess === 0 ? "✓" : "✕"}</span>}
              </div>
              <Recipe keys={keys} amt={amt} hit={same(at, goal)} size="text-[0.95rem]" />
              <div className="mt-2">
                <ButtonRemote keys={keys} amt={amt} onAmt={press} f={MF} min={-3} max={6} />
              </div>
              <Ticks
                items={[
                  [labelOf(almirah), hit.includes(almirah)],
                  [labelOf(bed), hit.includes(bed)],
                ]}
              />
            </>
          )}
        </div>
      </div>
      <Task done={done}>
        {guess === null ? "আগে একটা guess দিন, তারপর remote হাতে নিন." : hit.includes(almirah) ? "এবার খাটের mark এ নামান, (1, 3) এ." : "আলমারির mark এ নামান, (3, 5) এ."}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the detour. Five presses
//      of u carry Shiku past the almirah up to (5, 10), and one press back on
//      v brings him down onto it: (5, 10) − (2, 5) = (3, 5).

/** the same floor as screen 6, shorter on the page: the figure shares its step with words */
const X6_F = makeFrame(-1, 6, -1, 11, 12, 10);
const X6_SAY = [
  "u = (1, 2). এক press মানে এক tile ডানে, দুই tile উপরে.",
  "পাঁচবার চাপলে Shiku (5, 10) এ. আলমারি পড়ে রইলো অনেক নিচে.",
  "এবার v একবার, উল্টা দিকে: (5, 10) − (2, 5) = (3, 5).",
];

export function BackStep() {
  const s = useScene(3, [600, 2000, 2200]);
  const k = s.k;
  const keys = SHELF[2].keys;
  const amt = k >= 3 ? [5, -1] : k >= 2 ? [5, 0] : k >= 1 ? [1, 0] : [0, 0];
  const at = land(keys, amt);

  return (
    <Scene scene={s} caption={k < 3 ? X6_SAY[k] : <span className={FADE}>একটু বেশি গিয়ে, তারপর পিছিয়ে আসা. Minus এর কাজ ঠিক এটাই.</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={X6_F} grid={1} ticks={5} label="five presses of u overshoot to (5, 10), then one press back on v lands on (3, 5)" className="my-0! max-w-none">
            <Chalk f={X6_F} at={ALMIRAH} name="আলমারি" on={k >= 3} />
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
// 6a · A story scene for screen 6's setup, no task: the shopkeeper shows the
//      toggle on top of a remote, and it lights up. What the paint looks like
//      is the widget's job, so no floor is drawn here.

export function ToggleShow({}: Story) {
  const s = useScene(2, [600, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={SH_FLOOR} label="the shopkeeper holds up a remote and shows the toggle on top that paints everywhere it can reach">
        <ShopWall />
        <CastPerson who="nana" x={240} y={KEEP_Y} facing={1} arm="hold" />
        <ShopCounter />
        <Handset x={252} y={70} toggle glow={k >= 2} />
        {k === 1 && <Bubble x={240} y={KEEP_Y - 66} side="left" lines={["সব remote এ একটা", "toggle আছে."]} />}
        {k >= 2 && <Bubble x={240} y={KEEP_Y - 66} side="left" lines={["টিপ দিলে floor এ", "রং জ্বলবো."]} />}
        <Robot x={30} y={SH_FEET} />
        <CastPerson who="fahim" x={76} y={SH_FEET} />
        <CastPerson who="nasib" x={124} y={SH_FEET} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · The paint toggle. For each remote in turn, shade every spot its buttons
//     can reach between them: A the whole floor, B one slanted line, C the
//     whole floor, D the wall line along the door. Four shapes, one word.

const REACH_SAY = ["পুরা floor", "একটা বাঁকা line", "পুরা floor", "দরজা বরাবর একটা line"];

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
    if (next.length === SHELF.length) pass("যেখানে যেখানে যায়, সব মিলিয়ে: span.");
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
        Remote {SHELF[pick].name} এর button: <span className="font-mono">{tup(keys[0].v)}</span> আর <span className="font-mono">{tup(keys[1].v)}</span>
      </div>
      {on ? (
        <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>রং পড়লো {REACH_SAY[pick]} জুড়ে.</div>
      ) : (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={show} className={primaryBtn}>
            সব combination দেখান
          </button>
        </div>
      )}
      <Ticks items={SHELF.map((r, i) => [r.name, painted.includes(i)] as [string, boolean])} />
      <Task done={done}>চারটা remote এরই সব combination রং করে দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: three spans side by side,
//      a line, the whole floor, a line again. One word for all three shapes.

const SP_F = makeFrame(-2, 2, -2, 2, 19, 7);
const SPANS: { title: string; keys: Key[] }[] = [
  { title: "span{v}", keys: ONE_KEY },
  { title: "span{e₁, e₂}", keys: SHELF[0].keys },
  { title: "span{u, v}", keys: SHELF[1].keys },
];
const SP_SAY = [
  "তিন রকম remote, পাশাপাশি.",
  "এক button মানে একটা line.",
  "দুই button ঠেলে দুই দিকে. তাই পুরা floor.",
];

export function ThreeSpans() {
  const s = useScene(3, [600, 1700, 1700]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? SP_SAY[k] : <span className={FADE}>আর দুই button একই দিকে ঠেললে আবার একটা line. তিনটা আলাদা আকার, নাম একটাই.</span>}>
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
// 7a · A watch-only figure for the door check's setup (a story scene, no
//      task): the four paintings again, small, one after another, with the
//      door corner ringed each time it falls inside the paint. It poses the
//      question and does not answer "always?".

const X8_F = makeFrame(-5, 3, -2, 5, 7, 5);
const X8_SAY = [
  "চারটা remote আবার, রং করার আগে.",
  "Remote A: পুরা floor. দরজা ভিতরে.",
  "Remote B: একটা বাঁকা line, ঠিক দরজার উপর দিয়ে.",
  "Remote C: পুরা floor. দরজা ভিতরে.",
];

export function DoorEveryTime({}: Story) {
  const s = useScene(4, [600, 1500, 1500, 1800]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 4 ? X8_SAY[k] : <span className={FADE}>Remote D: দেয়াল বরাবর line, দরজার উপর দিয়ে. চারটা ছবি, চারটাতেই দরজা ভিতরে.</span>}
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
// 7 · The door question, as an exercise (it was a text Check). The reader
//     answers, and the answer plays out on the floor: remote after remote is
//     painted with Shiku standing on the door, nothing pressed, and the door is
//     ringed inside the paint every time. "It depends on the buttons" is shown
//     four quite different remotes and never finds a door outside; "only with
//     two buttons" is shown two one-button remotes, door inside both. Wrong
//     tries bounce; the right one plays and then passes.

const D7_F = makeFrame(-5, 4, -3, 4, 12, 8);
const D7_Q = "যেকোনো একটা remote ধরেন. দরজা কি সবসময় ওর span এর ভিতরে থাকবে?";
const D7_OPT = ["না, কোন button আছে তার উপর নির্ভর করে.", "শুধু দুইটা button থাকলে.", "হ্যাঁ, সবসময়."];
const D7_RIGHT = 2;
/** the same buttons as Your turn's remote 3, with the dead (0, 0) button (8's table comes later in the file) */
const D7_DEAD: Key[] = [
  { name: "u", v: [0, 0], tone: "blue" },
  { name: "v", v: [2, 1], tone: "coral" },
];
/** the remotes each answer is shown, one after another */
const D7_RUNS: Key[][][] = [
  [SHELF[1].keys, SHELF[3].keys, D7_DEAD, SHELF[2].keys],
  [ONE_KEY, [{ name: "v", v: [2, 3], tone: "coral" }]],
  [SHELF[0].keys, SHELF[1].keys, ONE_KEY, SHELF[3].keys],
];
const D7_NOPE = [
  "উঁহু. চার রকম remote, চারবারই দরজা ভিতরে. একটা button-ও না চাপলে Shiku কোথায় দাঁড়িয়ে থাকে?",
  "উঁহু. এক button এর remote, তবুও দরজা ভিতরে. একটা button-ও না চাপলে Shiku কোথায় দাঁড়িয়ে থাকে?",
  "",
];

export function DoorPick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(480);
  const won = pick === D7_RIGHT;
  const run = pick !== null ? D7_RUNS[pick] : [];
  const n = pl.running ? pl.k : run.length;
  const keys = n ? run[n - 1] : null;
  const landed = pick !== null && !pl.running;

  const choose = (i: number) => {
    if (won || pl.running) return;
    setPick(i);
    pl.play(D7_RUNS[i].length, () => {
      if (i === D7_RIGHT) pass("কিছু না চাপাও একটা combination.");
      else setMiss(miss + 1);
    });
  };
  const look = (i: number): Look => (pick !== i ? (won ? "dim" : "idle") : !landed ? "picked" : i === D7_RIGHT ? "right" : "wrong");

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <div className="w-[9rem] shrink-0">
          <Plane f={D7_F} grid={1} axes={false} label="a remote's span painted, with Shiku on the door and no button pressed" className="my-0! max-w-none">
            {keys && <Reach key={`r${pick}-${n}`} f={D7_F} keys={keys} on dots={false} />}
            {keys?.filter((key) => key.v[0] || key.v[1]).map((key) => <Arrow key={`${pick}-${n}-${key.name}`} f={D7_F} from={O} to={key.v} tone={key.tone} w={2} />)}
            {keys && <circle key={`o${pick}-${n}`} cx={D7_F.sx(0)} cy={D7_F.sy(0)} r={12} fill="none" strokeWidth={2.2} className={`${POP} stroke-cat-amber`} />}
            <Door f={D7_F} />
            <Shiku f={D7_F} at={O} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1 text-sm">
          {keys ? (
            <div key={`${pick}-${n}`} className={FADE}>
              <div className="text-muted">
                Remote {n} / {run.length}
              </div>
              <div className="font-mono">{keys.map((key) => tup(key.v)).join(" ")}</div>
              <div className="mt-1 text-accent-text">দরজা রং এর ভিতরে.</div>
            </div>
          ) : (
            <div className="text-muted">এখনো কোনো button চাপা হয় নি. Shiku দরজায়.</div>
          )}
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-muted">{D7_Q}</div>
      <div className="mt-2 grid gap-1.5">
        {D7_OPT.map((o, i) => (
          <Choice key={o} n={i} look={look(i)} disabled={won || pl.running} onClick={() => choose(i)}>
            {o}
          </Choice>
        ))}
      </div>
      {landed && !won && <Nope key={miss}>{D7_NOPE[pick ?? 0]}</Nope>}
      <Task done={won && !pl.running}>একটা উত্তর বেছে নিন, তারপর floor এ দেখুন দরজা কোথায় পড়ে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for the door check's explanation, no task: press nothing at
//      all, and Shiku is standing on the door corner. So whatever the buttons
//      are, the door is always inside the span.

const DI_SAY = [
  "হাতে remote, কিন্তু একটা button-ও চাপা হয় নি.",
  "u শূন্যবার, v শূন্যবার: 0·u + 0·v = (0, 0).",
  "তাই Shiku দাঁড়িয়ে আছে ঠিক দরজার উপর.",
];

export function DoorInside() {
  const s = useScene(3, [600, 2200, 1600]);
  const k = s.k;
  const keys = SHELF[2].keys;

  return (
    <Scene scene={s} caption={k < 3 ? DI_SAY[k] : <span className={FADE}>Button যা-ই হোক, এই যোগ সব remote এ খাটে. তাই দরজা কখনো span এর বাইরে পড়ে না.</span>}>
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
// 8a · A story scene for screen 8's setup, no task: the shopkeeper goes to the
//      back, comes out with four more remotes, and dares them to call each
//      one before any paint.

export function BackShelf({}: Story) {
  const s = useScene(3, [600, 1400, 1800, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" ground={SH_FLOOR} label="the shopkeeper brings four more remotes from the back and asks them to say where each reaches before painting">
        <ShopWall />
        <CastPerson who="nana" x={k === 1 ? 352 : 240} y={KEEP_Y} facing={k === 1 ? -1 : 1} walking={k === 1 || k === 2} />
        <ShopCounter />
        {k >= 2 && [180, 198, 266, 284].map((x) => <Handset key={x} x={x} y={82} />)}
        {k === 2 && <Bubble x={240} y={KEEP_Y - 66} side="left" lines={["পিছে আরো চাইরটা", "ছিল."]} />}
        {k >= 3 && <Bubble x={240} y={KEEP_Y - 66} side="left" lines={["রং ছাড়া কইতে", "পারবা?"]} />}
        <Robot x={30} y={SH_FEET} />
        <CastPerson who="fahim" x={76} y={SH_FEET} mood={k >= 3 ? "puzzled" : "plain"} />
        <CastPerson who="nasib" x={124} y={SH_FEET} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn. Four remotes the reader has not seen, and for each one the
//     call before any paint: one line, or the whole floor? A wrong tap
//     bounces, so the numbers actually get read. The dead (0, 0) button and
//     the lone (2, 3) are the two that catch people.

const YOURS: { keys: Key[]; note: string }[] = [
  {
    keys: [
      { name: "u", v: [3, 1], tone: "blue" },
      { name: "v", v: [-6, -2], tone: "coral" },
    ],
    note: "(−6, −2) আসলে (3, 1) এর −2 গুণ. একই রাস্তা, উল্টা দিকে.",
  },
  {
    keys: [
      { name: "u", v: [1, 0], tone: "blue" },
      { name: "v", v: [1, 1], tone: "coral" },
    ],
    note: "একটা east এ, একটা বাঁকা. দুইটা আলাদা direction, তাই পুরা floor.",
  },
  {
    keys: [
      { name: "u", v: [0, 0], tone: "blue" },
      { name: "v", v: [2, 1], tone: "coral" },
    ],
    note: "u = (0, 0) একটা মরা button: চাপলে Shiku নড়ে না. হাতে থাকে একটা button, মানে একটা line.",
  },
  {
    keys: [{ name: "v", v: [2, 3], tone: "coral" }],
    note: "Button একটাই, তাই line-ও একটাই.",
  },
];
const YF = makeFrame(-7, 4, -3, 4, 13, 10);
const YOUR_OPT = ["একটা line", "পুরা floor"];
/** a few presses to try on any remote: each key forwards, backwards, and the two together */
const Y8_TRIES: number[][] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [-1, 0],
  [1, -1],
  [-1, 1],
  [0.5, 0],
  [0, 2],
  [0, -0.5],
];
/** where those presses take Shiku on this remote, on the sheet, each spot once */
function y8Stops(keys: Key[]): XY[] {
  const out: XY[] = [];
  Y8_TRIES.forEach((t) => {
    const p = land(keys, keys.map((_, i) => t[i] ?? 0));
    if (onSheet(p, YF) && !(p[0] === 0 && p[1] === 0) && !out.some((q) => same(q, p))) out.push(p);
  });
  return out;
}
/** the picture a claim paints: one line along the first real button, or the whole floor */
const Y8_FLOOR: Key[] = SHELF[0].keys;
const y8Claim = (keys: Key[], i: number): Key[] => (i === 0 ? [{ name: "l", v: dirOf(keys), tone: "violet" }] : Y8_FLOOR);
const Y8_NOPE = [
  "উঁহু. Shiku line এর বাইরেও নামলো. আবার দেখুন: button গুলো কি সত্যিই দুই আলাদা দিকে ঠেলে?",
  "উঁহু. সব stop একটা line এর উপরেই পড়লো. আবার দেখুন: button গুলো কি সত্যিই দুই আলাদা দিকে ঠেলে?",
];

/** a tiny picture of the two answers: a line through the door, or the whole floor shaded */
function Y8Pic({ kind }: { kind: number }) {
  return (
    <svg viewBox="0 0 56 36" className="h-auto w-full max-w-[3.5rem]" aria-hidden="true">
      <rect x={0.5} y={0.5} width={55} height={35} rx={4} fill="white" stroke="#cbd5e1" />
      {kind === 0 ? (
        <line x1={6} y1={32} x2={50} y2={4} strokeWidth={6} strokeLinecap="round" stroke="#8b5cf6" strokeOpacity={0.45} />
      ) : (
        <rect x={4} y={4} width={48} height={28} rx={2} fill="#8b5cf6" fillOpacity={0.35} />
      )}
      <circle cx={28} cy={18} r={2.6} fill="#0f1b2d" />
    </svg>
  );
}

export function YourRemotes() {
  const pass = useGate();
  const [at, setAt] = useSeed("at", 0);
  const [miss, setMiss] = useSeed("miss", 0);
  const [shown, setShown] = useSeed("shown", false);
  const [done, setDone] = useSeed("done", false);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const pl = usePlay(260);
  const r = YOURS[at];
  const right = isPlane(r.keys) ? 1 : 0;
  const stops = y8Stops(r.keys);
  const n = pl.running ? pl.k : pick !== null ? stops.length : 0;
  const landed = pick !== null && !pl.running;
  const claimLine = pick === 0 ? dirOf(r.keys) : null;

  const choose = (i: number) => {
    if (shown || pl.running) return;
    setPick(i);
    const last = at === YOURS.length - 1;
    pl.play(stops.length, () => {
      if (i !== right) {
        setMiss(miss + 1);
        return;
      }
      setShown(true);
      if (last && !done) {
        setDone(true);
        pass("কয়টা button, সেটা না. কোন দিকে ঠেলে, সেটা.");
      }
    });
  };
  const next = () => {
    setAt(at + 1);
    setShown(false);
    setPick(null);
  };
  const look = (i: number): Look => (pick !== i ? (shown ? "dim" : "idle") : !landed ? "picked" : i === right ? "right" : "wrong");

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[9rem] shrink-0">
          <Plane f={YF} grid={1} axes={false} label={`remote ${at + 1}'s buttons`} className="my-0! max-w-none">
            {pick !== null && <Reach key={`${at}-${pick}`} f={YF} keys={y8Claim(r.keys, pick)} on dots={false} />}
            {stops.slice(0, n).map((p) => {
              const off = claimLine !== null && det(claimLine, p) !== 0;
              return <Dot key={`${at}-${pick}-${p}`} f={YF} at={p} r={2.8} className={off ? "fill-danger" : "fill-cat-violet"} pop />;
            })}
            {r.keys
              .filter((k) => k.v[0] || k.v[1])
              .map((k) => (
                <Arrow key={k.name} f={YF} from={O} to={k.v} tone={k.tone} w={2.4} />
              ))}
            <Door f={YF} />
            <Shiku f={YF} at={n ? stops[n - 1] : O} />
          </Plane>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted">
            Remote {at + 1} / {YOURS.length}
          </div>
          <div className="mt-1 font-mono text-[1.05rem]">
            {r.keys.map((k, i) => (
              <span key={k.name} className={TEXT[k.tone]}>
                {i > 0 && <span className="text-muted"> · </span>}
                {tup(k.v)}
              </span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {YOUR_OPT.map((o, i) => (
              <button
                key={o}
                type="button"
                disabled={shown || pl.running}
                onClick={() => choose(i)}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-1 py-1.5 text-xs font-semibold transition-colors duration-200 disabled:cursor-default motion-reduce:transition-none ${LOOK[look(i)]}`}
              >
                <Y8Pic kind={i} />
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>
      {shown ? <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>{r.note}</div> : null}
      {landed && pick !== right && !shown ? <Nope key={miss}>{Y8_NOPE[pick ?? 0]}</Nope> : null}
      {shown && at < YOURS.length - 1 && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={next} className={primaryBtn}>
            পরের remote
          </button>
        </div>
      )}
      <Task done={done}>চারটা remote এরই span বলুন: একটা line, নাকি পুরা floor? ছবিতে tap করুন, Shiku চেপে দেখাবে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the dead button. Remote
//      3's u = (0, 0) is pressed once, then again and again, and Shiku stays
//      on the door; only v = (2, 1) moves him, along one line.

const X9_F = makeFrame(-1, 4, -1, 3, 18, 10);
const X9_KEYS: Key[] = YOURS[2].keys;
const X9_SAY = [
  "Remote 3: u = (0, 0), v = (2, 1).",
  "u একবার চাপুন. Shiku এক চুলও নড়ে না.",
  "u আবার চাপুন, আবার. এখনো দরজায়.",
];

export function DeadButton() {
  const s = useScene(3, [600, 1600, 2000]);
  const k = s.k;
  const n = k >= 2 ? 3 : k;
  const at = k >= 3 ? X9_KEYS[1].v : O;

  return (
    <Scene scene={s} caption={k < 3 ? X9_SAY[k] : <span className={FADE}>শুধু v ওকে নাড়ায়, তাও একটা line বরাবর. তাই u থাকলেও যা, না থাকলেও তা.</span>}>
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
// 9 · Try it: one remote has only (2, 0); another has (2, 0) and (−5, 0).
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
  { kind: "floor", label: "পুরা floor" },
  { kind: "wall", label: "দেয়ালের line" },
  { kind: "two", label: "দুইটা line" },
];
const TP_RIGHT = 1;
const TP_NOPE: Record<TpKind, string> = {
  floor: "উঁহু. সব stop পড়লো দেয়ালের line এ. (−5, 0) কি Shiku কে নতুন কোনো দিকে ঠেলে?",
  wall: "",
  two: "উঁহু. দ্বিতীয় line এ একটা stop-ও পড়লো না. (−5, 0) কি Shiku কে নতুন কোনো দিকে ঠেলে?",
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
      if (i === TP_RIGHT) pass("Button একটা বাড়লো, reach একটুও না.");
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
        দ্বিতীয় remote: <span className="font-mono text-cat-blue">(2, 0)</span> আর <span className="font-mono text-cat-coral">(−5, 0)</span>
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
      {won && !pl.running && <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>সব stop দেয়ালের line এ, ঠিক প্রথম remote এর মতো.</div>}
      <Task done={won && !pl.running}>দ্বিতীয় remote এর span এর ছবিটা বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for the Try-it's explanation, no task: {(2, 0)} and
//       {(2, 0), (−5, 0)} shade exactly the same wall line, because the
//       second button only walks the first one's road backwards.

const XC_F = makeFrame(-5, 5, -2, 2, 18, 10);
const XC_ONE: Key[] = [{ name: "u", v: [2, 0], tone: "blue" }];
const XC_TWO: Key[] = [...XC_ONE, { name: "v", v: [-5, 0], tone: "coral" }];
const XC_SAY = [
  "প্রথম remote এ একটাই button, (2, 0).",
  "সামনে, পিছনে, half-press মিলিয়ে দেয়াল বরাবর পুরা line.",
  "দ্বিতীয় remote এর বাড়তি button (−5, 0)-ও ওই দেয়াল ধরেই হাঁটে.",
];

export function WallLine() {
  const s = useScene(3, [600, 1800, 2000]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 3 ? XC_SAY[k] : <span className={FADE}>তাই দুইটার span হুবহু এক: ওই একটা line. Button একটা বাড়লো, reach এক চুলও না.</span>}
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
// 10a · A story scene for the last step's setup, no task: just before Maghrib
//       Fahim comes out with remote C. The shopkeeper warns him about the
//       cheap battery (5.1b's stake), Nasib objects, and Fahim says the rule.

const S9_FLOOR = 150;

export function RemoteBought({}: Story) {
  const s = useScene(4, [600, 2400, 2000, 2400]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S9_FLOOR} label="at dusk Fahim comes out of the toy shop with remote C; the shopkeeper warns that its battery is cheap, Nasib is not impressed, and Shiku walks home with them">
        <CastPerson who="nana" x={48} y={S9_FLOOR} scale={0.8} facing={1} />
        <Stall x={48} y={S9_FLOOR} sign="খেলনা" color="#0d9488" w={72} />
        {k === 1 && <Bubble x={52} y={S9_FLOOR - 56} side="right" lines={["সস্তা জিনিস.", "battery-ও সস্তা."]} />}
        <CastPerson who="fahim" x={k >= 4 ? 112 : 152} y={S9_FLOOR + 16} facing={k >= 4 ? -1 : 1} walking={k === 4} arm={k >= 1 ? "hold" : "down"} />
        {k >= 1 && <CastCard x={k >= 4 ? 112 : 152} y={S9_FLOOR - 56} text="remote C" tone="teal" />}
        {k >= 1 && <Handset x={k >= 4 ? 96 : 164} y={S9_FLOOR - 34} />}
        <CastPerson who="nasib" x={262} y={S9_FLOOR + 16} facing={-1} mood={k === 3 ? "puzzled" : "plain"} />
        {k === 3 && <Bubble x={262} y={S9_FLOOR - 50} side="left" lines={["কিন্তু ওইটাই তো", "সবচেয়ে এলোমেলো!"]} />}
        <Robot x={k >= 4 ? 168 : 206} y={S9_FLOOR + 16} walking={k === 4} />
        {k === 2 && <Bubble x={52} y={S9_FLOOR - 56} side="right" lines={["বেশি টিপাটিপি", "কইরো না."]} />}
        {k >= 4 && <Bubble x={112} y={S9_FLOOR - 78} side="right" lines={["Button গুনে লাভ নাই.", "দেখো কতদূর যায়."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10 · The bet settled. Tap each remote to open its verdict: ✓ ✗ ✓ ✗. Nasib's
//      "two buttons go anywhere" lost twice, and the rule that replaces it is
//      the journey's one line.

const VERDICT: { name: string; ok: boolean; reach: string; why: string }[] = [
  { name: "A", ok: true, reach: "পুরা floor", why: "একটা east এ, একটা north এ. দুইটা আলাদা direction." },
  { name: "B", ok: false, reach: "একটা বাঁকা line", why: "(2, 2) হলো (1, 1) এর দুইগুণ, তাই direction একটাই." },
  { name: "C", ok: true, reach: "পুরা floor", why: "দেখতে এলোমেলো, কিন্তু দুইটা আলাদা direction." },
  { name: "D", ok: false, reach: "দেয়াল বরাবর একটা line", why: "(2, 0) আর (−5, 0) দুইটাই একই দেয়াল ধরে হাঁটে." },
];

/** the Finale's small floor: the door, the four marks, and the opened remote's paint */
const F10_F = makeFrame(-5, 5, -2, 6, 13, 8);
/** is this mark inside the remote's span */
const f10Hit = (keys: Key[], at: XY) => isPlane(keys) || det(dirOf(keys), at) === 0;

export function Finale() {
  const pass = useGate();
  const [open, setOpen] = useSeed<string[]>("open", []);
  const pl = usePlay(380);
  const all = open.length === VERDICT.length;
  const last = open.length ? SHELF.find((r) => r.name === open[open.length - 1]) : undefined;
  const checked = pl.running ? pl.k : MARKS.length;
  const settled = (n: string) => open.includes(n) && !(pl.running && last?.name === n);

  const show = (n: string) => {
    if (open.includes(n) || pl.running) return;
    const next = [...open, n];
    setOpen(next);
    pl.play(MARKS.length, () => {
      if (next.length === VERDICT.length) pass("দুটো করে button, তবু দুইটা আটকে গেলো.");
    });
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[8.5rem]">
        <Plane f={F10_F} grid={1} axes={false} label={last ? `remote ${last.name}'s span, and which of the four marks it covers` : "the floor with the door and the four marks"} className="my-0! max-w-none">
          {last && <Reach key={last.name} f={F10_F} keys={last.keys} on dots={false} />}
          {last?.keys.map((key) => <Arrow key={`${last.name}${key.name}`} f={F10_F} from={O} to={key.v} tone={key.tone} w={2} />)}
          {MARKS.map((m, i) => {
            const x = F10_F.sx(m.at[0]);
            const y = F10_F.sy(m.at[1]);
            const seen = last && i < checked;
            const hit = last ? f10Hit(last.keys, m.at) : false;
            return (
              <g key={m.name}>
                <rect
                  x={x - 4.5}
                  y={y - 4.5}
                  width={9}
                  height={9}
                  rx={2}
                  strokeWidth={1.4}
                  strokeDasharray={seen ? undefined : "2.5 2"}
                  className={seen ? (hit ? "fill-accent stroke-accent" : "fill-white stroke-danger") : "fill-white stroke-[#94a3b8]"}
                />
                {seen && !hit && <path key={`${last?.name}x`} d={`M${x - 2.5} ${y - 2.5}l5 5M${x + 2.5} ${y - 2.5}l-5 5`} strokeWidth={1.6} className={`${POP} stroke-danger`} />}
              </g>
            );
          })}
          <circle cx={F10_F.sx(0)} cy={F10_F.sy(0)} r={2.8} className="fill-[#0f1b2d]" />
        </Plane>
      </div>
      <div className="mx-auto mt-2 grid max-w-sm gap-1.5">
        {VERDICT.map((r) => (
          <button
            key={r.name}
            type="button"
            onClick={() => show(r.name)}
            disabled={open.includes(r.name) || pl.running}
            className={`w-full cursor-pointer rounded-xl border-2 px-3 py-1.5 text-left transition-colors disabled:cursor-default motion-reduce:transition-none ${
              settled(r.name) ? (r.ok ? "border-accent bg-accent/10" : "border-danger/50 bg-danger/5") : open.includes(r.name) ? "border-cat-blue bg-cat-blue/10" : "border-border hover:border-accent"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.95rem] font-semibold">Remote {r.name}</span>
              {settled(r.name) ? (
                <span className={`${FADE} text-sm ${r.ok ? "text-accent-text" : "text-danger"}`}>
                  {r.ok ? "✓" : "✕"} {r.reach}
                </span>
              ) : (
                <span className="text-sm text-muted">{open.includes(r.name) ? "…" : "খুলুন"}</span>
              )}
            </div>
            {settled(r.name) && r.name === last?.name && <div className={`${FADE} text-xs text-muted`}>{r.why}</div>}
          </button>
        ))}
      </div>
      {all && !pl.running && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-violet/5 px-4 py-3 text-center text-[0.95rem]`}>
          নাসিবের rule দুইবার হারলো. Button গুনে লাভ নাই; দেখুন কতদূর যায়.
        </div>
      )}
      <Task done={all && !pl.running}>চারটা remote এর result একটা একটা করে খুলুন. Floor এ দেখুন কোন mark এ রং পড়ে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for the last step's explanation, no task: the two remotes
//       that beat Nasib's rule, side by side. B paints one slanted line, D
//       one wall line: two buttons each, one line each.

const X11_F = makeFrame(-5, 3, -2, 3, 12, 8);
/** B's v is drawn a little to the side of u, or the two would lie on top of each other */
const X11_OFF: XY = [0.3, -0.3];
const X11_SAY = [
  "Remote B আর remote D. দুইটাতেই দুটো করে button.",
  "B: একটা বাঁকা line এ আটকে গেলো.",
  "D: দেয়ালের line এ আটকে গেলো.",
];

export function RuleLost() {
  const s = useScene(3, [600, 1600, 2000]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? X11_SAY[k] : <span className={FADE}>Button গুনবেন না. দেখুন কতদূর যায়.</span>}>
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
// 10¾ · A second figure for the last step's explanation, no task: the open
//       question. Fahim's hunt for the almirah on remote C, press by press,
//       with the cheap battery going down a bar each beat; then Shiku back on
//       the door and the counts as "?". It stops at the question (5.1b's).

/** a battery with `bars` of its 4 bars left */
function H10Battery({ bars }: { bars: number }) {
  return (
    <svg viewBox="0 0 34 16" className="h-auto w-[2.4rem]" role="img" aria-label={`battery, ${bars} of 4 bars left`}>
      <rect x={1} y={1} width={28} height={14} rx={2.5} fill="none" stroke="#475569" strokeWidth={1.6} />
      <rect x={29.5} y={5} width={3} height={6} rx={1} fill="#475569" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={3.5 + i * 6.3}
          y={3.5}
          width={5}
          height={9}
          rx={1}
          className={`transition-opacity duration-500 motion-reduce:transition-none ${bars <= 1 ? "fill-danger" : "fill-accent"}`}
          opacity={i < bars ? 1 : 0.12}
        />
      ))}
    </svg>
  );
}

const H10_SAY = [
  "ফাহিম আলমারি খুঁজেছিল টিপে টিপে. হাতে remote C.",
  "u একবার, দুইবার… পাঁচবার. আলমারি পার হয়ে গেলো.",
  "তারপর v একবার, উল্টা দিকে. আলমারি. প্রতিটা টিপে battery একটু করে কমে.",
];

export function HuntAhead() {
  const s = useScene(3, [600, 2000, 2400]);
  const k = s.k;
  const keys = SHELF[2].keys;
  const amt = k === 1 ? [5, 0] : k === 2 ? [5, -1] : [0, 0];
  const at = land(keys, amt);
  const bars = [4, 3, 2, 2][k];

  return (
    <Scene scene={s} caption={k < 3 ? <span key={k} className={FADE}>{H10_SAY[k]}</span> : <span className={FADE}>টিপার আগেই কি বলা যায়, কোন button কয়বার?</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={X6_F} grid={1} ticks={5} label="remote C hunting for the almirah press by press, the battery going down" className="my-0! max-w-none">
            <Chalk f={X6_F} at={ALMIRAH} name="আলমারি" on={k === 2} />
            <Chains key={`h${k}`} f={X6_F} keys={keys} amt={amt} />
            <Door f={X6_F} />
            <Shiku f={X6_F} at={at} />
          </Plane>
        </div>
        <div className="min-w-0 space-y-2">
          <H10Battery bars={bars} />
          <div className="font-mono text-[0.95rem] leading-relaxed">
            {k >= 3 ? (
              <div className={FADE}>
                <div>
                  <b className={`${POP} inline-block text-cat-blue`}>?</b>·u
                </div>
                <div>
                  <span className="text-muted">+</span> <b className={`${POP} inline-block text-cat-coral`}>?</b>·v
                </div>
                <div className="mt-1 border-t border-border pt-1">= (3, 5)</div>
              </div>
            ) : (
              <div key={k} className={FADE}>
                <div className={k >= 1 ? "" : "opacity-30"}>
                  <span className="text-cat-blue">{amt[0]}</span>·u
                </div>
                <div className={k >= 2 ? "" : "opacity-30"}>
                  <span className="text-muted">−</span> <span className="text-cat-coral">{Math.abs(amt[1])}</span>·v
                </div>
                <div className="mt-1 border-t border-border pt-1">= {tup(at)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  MovingDay: { chalk: { k: 1 }, broken: { k: 2 }, end: {} },
  RemoteShelf: { start: {}, picked: { picks: ["A", "C"] }, sealed: { picks: ["A", "B"], sealed: true } },
  ShelfFour: { start: { k: 0 }, numbers: { k: 2 }, end: {} },
  CheapRemote: { offer: { k: 1 }, end: {} },
  OneButton: { start: {}, swept: { q: 6, seen: [0, 4, 8, -4, -8, 6, 10, 14] } },
  LineNamed: { mid: { k: 2 }, end: {} },
  OldRemote: { start: {}, two: { amt: [2, 2], hit: ["table"] }, all: { amt: [3, 5], hit: ["almirah", "bed", "table", "shoe rack"] } },
  AlmirahBuild: { east: { k: 1 }, end: {} },
  NasibPicksB: { ask: { k: 1 }, hold: { k: 2 }, end: {} },
  TwinButtons: {
    start: {},
    table: { amt: [2, 0], table: true },
    stuck: { amt: [1, 1], table: true, tried: [0, 1, 3, 4, 5, -1], done: true },
  },
  SameDirection: { mid: { k: 2 }, end: {} },
  CheapC: { cheap: { k: 1 }, end: {} },
  MessyRemote: { start: {}, hunt: { guess: 0, amt: [5, 0] }, found: { guess: 0, amt: [5, -1], hit: ["almirah"] } },
  BackStep: { over: { k: 2 }, end: {} },
  ToggleShow: { toggle: { k: 1 }, end: {} },
  PaintReach: { start: {}, b: { pick: 1, on: true, painted: [0, 1] }, all: { pick: 3, on: true, painted: [0, 1, 2, 3] } },
  ThreeSpans: { mid: { k: 2 }, end: {} },
  DoorEveryTime: { start: { k: 0 }, mid: { k: 2 }, end: {} },
  DoorInside: { mid: { k: 2 }, end: {} },
  BackShelf: { away: { k: 1 }, four: { k: 2 }, end: {} },
  YourRemotes: {
    start: {},
    shown: { at: 0, shown: true, pick: 0 },
    miss: { at: 2, miss: 1, pick: 1 },
    lineMiss: { at: 1, miss: 1, pick: 0 },
    last: { at: 3, shown: true, done: true, pick: 0 },
  },
  DeadButton: { again: { k: 2 }, end: {} },
  WallPick: { start: {}, floor: { pick: 0, miss: 1 }, two: { pick: 2, miss: 1 }, right: { pick: 1 } },
  WallLine: { mid: { k: 2 }, end: {} },
  RemoteBought: { bought: { k: 1 }, warn: { k: 2 }, nasib: { k: 3 }, end: {} },
  Finale: { start: {}, some: { open: ["A", "B"] }, all: { open: ["A", "B", "C", "D"] } },
  RuleLost: { mid: { k: 1 }, end: {} },
  TileCounts: { start: { k: 0 }, west: { k: 2 }, end: {} },
  DoorPick: { start: {}, depends: { pick: 0, miss: 1 }, two: { pick: 1, miss: 1 }, right: { pick: 2 } },
  HuntAhead: { over: { k: 1 }, back: { k: 2 }, end: {} },
};
