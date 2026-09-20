"use client";

import { type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  FADE,
  Nope,
  POP,
  Scene,
  Stepper,
  Ticks,
  pill,
  predictLook,
  primaryBtn,
  useScene,
  useSeed,
  type Fixtures,
} from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person as CastPerson, Robot, Stage, Stall, StoryFrame } from "@/components/journey/cast";
import { Arrow, Dot, Label, Plane, Star, makeFrame, same, sg, tup, type Frame, type Tone, type XY } from "@/components/journey/plane";
import { Shiku } from "./arrow-journey";
import { bn } from "./figure-kit";

// Screens for "Math for AI 5.1 — Span, কোন remote কোথায় পৌঁছায়", told as a Journey.
//
// বাসা বদলের প্রথম দিন. The new flat is empty, আম্মু has chalked four marks on
// the tiles, and Shiku's remote broke in the packing. Four two-button remotes
// on the toy shop's shelf and money for one: which of them take Shiku from the
// door to every mark? নাসিব says two buttons is always enough. The reader
// seals that bet, then drives one remote after another: a single button that
// only ever walks one line, the old e₁/e₂ remote whose presses are the mark's
// own numbers, a twin-button remote whose two slots always hold the same
// number, and the messiest-looking one, which gets everywhere by overshooting
// and stepping back. A paint toggle then shades everything a remote can reach
// between them, and that shaded set is the word: span.
//
// The machine itself (Floor, ButtonRemote, Reach) is built here and reused by
// 5.2, 5.3 and 5.4, the way Article 4 reused DotBox.
//
// Every <Then> figure plays by itself (useScene) and acts out its paragraph:
// the one-button line getting its name, remote খ's two buttons pointing one
// way, remote গ's five-forward-one-back detour, three spans side by side with
// the door inside all three, and the Check's two sets on one wall line.
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
// The shared machine: the flat's floor, আম্মুর চকের দাগ, a remote of two or
// three buttons, and the paint that shades everywhere it can reach.

/** One button on a remote: the name on the key, the step it takes, its colour. */
export type Key = { name: string; v: XY; tone: Tone };

export const MARKS: { name: string; at: XY }[] = [
  { name: "আলমারি", at: [3, 5] },
  { name: "খাট", at: [1, 3] },
  { name: "টেবিল", at: [2, 2] },
  { name: "র‍্যাক", at: [1, 0] },
];
const ALMARI = MARKS[0].at;
const KHAT = MARKS[1].at;
const TEBIL = MARKS[2].at;

/** The four remotes on the toy shop's shelf. */
export const SHELF: { name: string; keys: Key[] }[] = [
  { name: "ক", keys: [{ name: "e₁", v: [1, 0], tone: "blue" }, { name: "e₂", v: [0, 1], tone: "coral" }] },
  { name: "খ", keys: [{ name: "u", v: [1, 1], tone: "blue" }, { name: "v", v: [2, 2], tone: "coral" }] },
  { name: "গ", keys: [{ name: "u", v: [1, 2], tone: "blue" }, { name: "v", v: [2, 5], tone: "coral" }] },
  { name: "ঘ", keys: [{ name: "u", v: [2, 0], tone: "blue" }, { name: "v", v: [-5, 0], tone: "coral" }] },
];

/** The floor of the empty flat: the door corner at (0, 0), one tile per unit. */
const FF = makeFrame(-2, 5, -2, 6, 26, 14);
/** The floor again, wide enough to hold remote ঘ's (−5, 0) button. */
const PF = makeFrame(-5, 5, -3, 6, 20, 12);
/** The floor again, tall enough for remote গ's overshoot to (5, 10). */
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

/** One of আম্মুর চকের দাগ on the tiles, ticked once Shiku has stood on it. */
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
// 1a · A story scene for screen 1's setup, no task: বাসা বদলের প্রথম দিন. The
//      new flat is empty but for boxes; আম্মু chalks four marks on the tiles;
//      ফাহিম holds up Shiku's cracked remote; নাসিব walks in with his claim.
//      The shop's four remotes are not shown: that is the widget's question.

const S1_FLOOR = 118;
const S1_SPOT = [126, 166, 206, 246];

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
        label="the new flat, empty but for boxes: আম্মু chalks four marks on the tiles, ফাহিম holds up Shiku's broken remote, and নাসিব walks in"
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
        <CastPerson who="ammu" x={96} y={S1_FLOOR + 16} arm={k === 1 ? "point" : "down"} mood={k >= 1 ? "happy" : "plain"} label />
        {k === 1 && <Bubble x={96} y={S1_FLOOR - 50} side="right" lines={["কোন জিনিস কোথায় বসবে,", "দাগ দিয়ে দিলাম।"]} />}
        <CastPerson who="fahim" x={186} y={S1_FLOOR + 16} mood={k >= 2 ? "sad" : "plain"} arm={k >= 2 ? "hold" : "down"} label />
        {k >= 2 && <S1Remote x={198} y={S1_FLOOR - 30} broken />}
        {k === 2 && <Bubble x={186} y={S1_FLOOR - 50} side="mid" lines={["Shiku-র remote-টা", "প্যাকিংয়ে ভেঙে গেছে।"]} />}
        <Robot x={232} y={S1_FLOOR + 16} />
        <CastPerson who="nasib" x={k >= 3 ? 288 : 372} y={S1_FLOOR + 16} facing={-1} walking={k === 3} mood="smug" label={k >= 3} />
        {k >= 3 && <Bubble x={288} y={S1_FLOOR - 50} side="left" lines={["দুই button থাকলেই", "সব জায়গায় যাওয়া যায়।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The shelf. Four two-button remotes and আম্মুর চারটা দাগ; the reader ticks
//     the ones they think reach every mark and seals the bet, unmarked. This
//     is the journey's question, and the Finale is what settles it.

export function RemoteShelf() {
  const pass = useGate();
  const [picks, setPicks] = useSeed<string[]>("picks", []);
  const [sealed, setSealed] = useSeed("sealed", false);

  const toggle = (n: string) => setPicks(picks.includes(n) ? picks.filter((p) => p !== n) : [...picks, n]);
  const seal = () => {
    setSealed(true);
    pass(`বাজি সিল: ${bn(picks.length)}টা remote সব দাগে পৌঁছাবে।`);
  };

  return (
    <>
      <div className="mx-auto flex max-w-sm flex-wrap items-center justify-center gap-x-3 gap-y-0.5 rounded-xl border-2 border-cat-amber/40 bg-cat-amber/5 px-3 py-1.5 text-sm">
        <span className="font-semibold">আম্মুর দাগ:</span>
        {MARKS.map((m) => (
          <span key={m.name}>
            {m.name} <span className="font-mono">{tup(m.at)}</span>
          </span>
        ))}
      </div>
      <div className="mt-2.5 text-sm font-medium text-muted">চারটা দাগেই কোন remote পৌঁছাবে? যতগুলো মনে হয়, tap করুন।</div>
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
            {picks.length ? "বাজি সিল করুন" : "একটাও পারবে না, সিল করুন"}
          </button>
        </div>
      ) : (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>বাজি সিল করা হলো। দোকান বন্ধের আগে চারটাই চালিয়ে দেখবো।</div>
      )}
      <Task done={sealed}>বেছে নিয়ে বাজিটা সিল করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The shop's cheapest remote: one button, (1, 1), pressed forwards,
//     backwards and half-way. Every stop the reader makes leaves a dot, and
//     the dots spell out one line through the door. খাট is starred and never
//     comes.

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
    if (!done && swept(next)) pass("এক button মানে একটা লাইন, দরজা ছুঁয়ে।");
  };

  return (
    <>
      <Plane f={FF} grid={1} ticks={2} label={`one button (1, 1) pressed ${lam} times, Shiku at ${tup2(at)}`} className="my-2! max-w-[10.5rem]">
        {done && <Reach f={FF} keys={ONE_KEY} on dots={false} />}
        <Marks f={FF} />
        <Star f={FF} at={KHAT} />
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
          aria-label="v button কতবার চাপা হলো"
          onChange={(e) => move(Number(e.target.value))}
          className="h-6 min-w-0 flex-1 cursor-pointer accent-[var(--cat-blue)]"
        />
      </label>
      <div className="mt-1 text-center text-xs text-muted">পিছনে টানলে minus, মাঝখানে থামলে আধা চাপ।</div>
      <Task done={done}>Button-টা সামনে-পিছনে চালিয়ে দেখুন, খাটের দাগে নামানো যায় কিনা।</Task>
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
  "দরজার কোণ থেকে v button, এক চাপে (1, 1)।",
  "সামনে চাপতে থাকলে Shiku নামে এই dot-গুলোতে।",
  "পিছনে চাপলে, আর আধা চাপ দিলে মাঝের ফাঁকগুলোও ভরে যায়।",
];

export function LineNamed() {
  const s = useScene(3, [600, 1800, 2000]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 3 ? X2_SAY[k] : <span className={FADE}>সব মিলিয়ে একটা আস্ত লাইন, আর লাইনটা দরজার ওপর দিয়েই গেছে। এই পুরো লাইনটার নাম span&#x7B;v&#x7D;।</span>}
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
// 3 · Remote ক, the old kind: e₁ east, e₂ north, minus allowed. The reader
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
    if (got.length === MARKS.length) pass("দাগের সংখ্যা দুইটাই চাপের হিসাব।");
  };

  return (
    <>
      <Plane f={FF} grid={1} ticks={2} label={`remote ক at ${tup(at)}`} className="my-2! max-w-[10.5rem]">
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
      <Task done={done}>চারটা দাগেই একবার করে Shiku-কে নামান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Remote খ: u = (1, 1) and v = (2, 2). টেবিল comes easily, so the trap
//     holds; then the star moves to আলমারি and no pair of counts ever gets
//     there. Every landing the reader tries leaves a dot, and the dots line up
//     on one diagonal. It cannot be won.

const TWIN_TRIES = 6;

export function TwinButtons() {
  const keys = SHELF[1].keys;
  const pass = useGate();
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0]);
  const [table, setTable] = useSeed("table", false);
  const [tried, setTried] = useSeed<number[]>("tried", []);
  const [done, setDone] = useSeed("done", false);
  const at = land(keys, amt);
  const goal = table ? ALMARI : TEBIL;

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
      pass("(2, 2) মানে (1, 1)-এরই দুই গুণ।");
    }
  };

  return (
    <>
      <Plane f={FF} grid={1} ticks={2} label={`remote খ at ${tup(at)}, heading for ${tup(goal)}`} className="my-2! max-w-[10.5rem]">
        <Marks f={FF} hit={table ? ["টেবিল"] : []} />
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
          টেবিল হয়ে গেল। এবার তারাটা আলমারিতে, <span className="font-mono">(3, 5)</span>। চেষ্টা {bn(tried.length)}/{bn(TWIN_TRIES)}।
        </div>
      )}
      <Task done={done}>{table ? "এবার আলমারির দাগে নামান, (3, 5)-এ।" : "আগে টেবিলের দাগে নামান, (2, 2)-এ।"}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: two buttons, one
//      direction. u is drawn, then u again tip to tail landing exactly on v,
//      then a dot slides the whole diagonal, and আলমারি sits off it.

const X4_F = makeFrame(-2, 4, -2, 6, 20, 12);
/** v is drawn a little to the side of u, or the two would lie on top of each other */
const X4_OFF: XY = [0.35, -0.35];
const X4_SAY = [
  "খ remote-এর দুইটা button: u = (1, 1) আর v = (2, 2)।",
  "u-এর পরে আরেকবার u, গিয়ে ঠিক v-এর মাথায়। v মানে u-ই, দুই গুণ।",
  "যত রকমভাবেই চাপুন, Shiku এই একটা লাইনেই থাকে।",
];

export function SameDirection() {
  const s = useScene(3, [600, 1900, 1800]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? X4_SAY[k] : <span className={FADE}>আর আলমারির দাগটা সেই লাইনের বাইরে, তাই ওখানে কোনোদিনই পৌঁছানো হয় না।</span>}>
      <div className="mx-auto w-[8.5rem]">
        <Plane f={X4_F} grid={1} axes={false} label="remote খ's two buttons push the same way, so every landing sits on one line" className="my-0! max-w-none">
          {k >= 2 && <Reach f={X4_F} keys={SHELF[1].keys} on dots={false} />}
          {k >= 3 && <Chalk f={X4_F} at={ALMARI} name="আলমারি" />}
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

// 5 · Why remote খ cannot: build α·(1, 1) + β·(2, 2) one line at a time and
//     watch the same number come out in both slots, whatever α and β are.
//     আলমারি wants 3 in one slot and 5 in the other.

const SLOT_ROWS: { lhs: string; rhs: string; note: string }[] = [
  { lhs: "α বার u", rhs: "(α, α)", note: "u = (1, 1), তাই দুই ঘরেই α।" },
  { lhs: "β বার v", rhs: "(2β, 2β)", note: "v = (2, 2), তাই দুই ঘরেই 2β।" },
  { lhs: "দুইটা যোগ", rhs: "(α + 2β, α + 2β)", note: "ঘরে ঘরে যোগ, আর দুই ঘরের হিসাব হুবহু এক।" },
];

export function SlotsSame() {
  const pass = useGate();
  const [k, setK] = useSeed("k", 0);
  const over = k > SLOT_ROWS.length;

  const step = () => {
    const next = k + 1;
    setK(next);
    if (next > SLOT_ROWS.length) pass("দুই ঘরে সবসময় একই সংখ্যা বসে।");
  };

  return (
    <>
      <div className="mx-auto max-w-sm rounded-2xl border border-border px-3 py-3">
        <div className="text-center text-sm font-semibold">α বার u, আর β বার v</div>
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
            আলমারি চায় <span className="font-mono">(3, 5)</span>। প্রথম ঘরে 3 বসালে দ্বিতীয় ঘরেও 3, 5 হওয়ার উপায়ই থাকে না।
          </div>
        )}
      </div>
      {!over && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={step} className={primaryBtn}>
            {k === 0 ? "হিসাব শুরু করুন" : "পরের ধাপ"}
          </button>
        </div>
      )}
      <Task done={over}>ধাপে ধাপে হিসাবটা খুলে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Remote গ, the untidiest-looking one: u = (1, 2), v = (2, 5). The reader
//     calls it first, then hunts: five presses of u overshoot to (5, 10), and
//     one press back on v lands exactly on আলমারি. Then খাট, with the minus on
//     u this time.

const GA_GUESS = ["পৌঁছাবে", "পৌঁছাবে না"];

export function MessyRemote() {
  const keys = SHELF[2].keys;
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [amt, setAmt] = useSeed<number[]>("amt", [0, 0]);
  const [hit, setHit] = useSeed<string[]>("hit", []);
  const at = land(keys, amt);
  const goal = hit.includes("আলমারি") ? KHAT : ALMARI;
  const done = hit.length === 2;

  const press = (i: number, n: number) => {
    const next = amt.map((a, j) => (j === i ? n : a));
    setAmt(next);
    const mark = MARKS.find((m) => same(m.at, land(keys, next)));
    if (!mark || !["আলমারি", "খাট"].includes(mark.name) || hit.includes(mark.name)) return;
    const got = [...hit, mark.name];
    setHit(got);
    if (got.length === 2) pass("অগোছালো, তবু দুই দিক আলাদা।");
  };

  return (
    <>
      <div className="flex items-start justify-center gap-3">
        <div className="w-[8.5rem] shrink-0">
          <Plane f={MF} grid={1} ticks={5} label={`remote গ at ${tup(at)}, heading for ${tup(goal)}`} className="my-0! max-w-none">
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
                u = <span className="font-mono">(1, 2)</span>, v = <span className="font-mono">(2, 5)</span>। এই remote কি আলমারিতে, <span className="font-mono">(3, 5)</span>-এ পৌঁছাবে?
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
                  ["আলমারি", hit.includes("আলমারি")],
                  ["খাট", hit.includes("খাট")],
                ]}
              />
            </>
          )}
        </div>
      </div>
      <Task done={done}>
        {guess === null ? "আগে একটা guess দিন, তারপর remote-টা হাতে নিন।" : hit.includes("আলমারি") ? "এবার খাটের দাগে নামান, (1, 3)-এ।" : "আলমারির দাগে নামান, (3, 5)-এ।"}
      </Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: the detour. Five presses
//      of u carry Shiku past the আলমারি up to (5, 10), and one press back on v
//      brings him down onto it: (5, 10) − (2, 5) = (3, 5).

/** the same floor as screen 6, shorter on the page: the figure shares its step with words */
const X6_F = makeFrame(-1, 6, -1, 11, 12, 10);
const X6_SAY = [
  "u = (1, 2), এক চাপে ডানে এক ঘর, ওপরে দুই ঘর।",
  "পাঁচবার চাপলে Shiku (5, 10)-এ, আলমারি অনেক নিচে পড়ে থাকে।",
  "এবার v একবার পিছনে: (5, 10) − (2, 5) = (3, 5)।",
];

export function BackStep() {
  const s = useScene(3, [600, 2000, 2200]);
  const k = s.k;
  const keys = SHELF[2].keys;
  const amt = k >= 3 ? [5, -1] : k >= 2 ? [5, 0] : k >= 1 ? [1, 0] : [0, 0];
  const at = land(keys, amt);

  return (
    <Scene scene={s} caption={k < 3 ? X6_SAY[k] : <span className={FADE}>ছাড়িয়ে যেয়ে তারপর পিছিয়ে আসা, minus-টা ঠিক এই কাজটাই করে।</span>}>
      <div className="mx-auto flex items-center justify-center gap-4">
        <div className="w-[6.5rem] shrink-0">
          <Plane f={X6_F} grid={1} ticks={5} label="five presses of u overshoot to (5, 10), then one press back on v lands on (3, 5)" className="my-0! max-w-none">
            <Chalk f={X6_F} at={ALMARI} name="আলমারি" on={k >= 3} />
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
// 7 · The paint toggle. For each remote in turn, shade every spot its buttons
//     can reach between them: ক the whole floor, খ one slanted line, গ the
//     whole floor, ঘ the wall line along the door. Four shapes, one word.

const REACH_SAY = ["পুরো মেঝে", "একটা তেরছা লাইন", "পুরো মেঝে", "দরজা বরাবর একটা লাইন"];

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
    if (next.length === SHELF.length) pass("যত জায়গায় পৌঁছায়, সবটার নাম span।");
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
        Remote {SHELF[pick].name}-এর button: <span className="font-mono">{tup(keys[0].v)}</span> আর <span className="font-mono">{tup(keys[1].v)}</span>
      </div>
      {on ? (
        <div className={`${FADE} mt-2 text-center text-[0.95rem] text-accent-text`}>পৌঁছানো যায়: {REACH_SAY[pick]}।</div>
      ) : (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={show} className={primaryBtn}>
            সব combination দেখান
          </button>
        </div>
      )}
      <Ticks items={SHELF.map((r, i) => [r.name, painted.includes(i)] as [string, boolean])} />
      <Task done={done}>চারটা remote-এরই combination-গুলো রং করে দেখুন।</Task>
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
  "তিন রকম remote পাশাপাশি।",
  "এক button, মানে একটা লাইন।",
  "দুই দিকের দুইটা button, মানে পুরো মেঝে।",
];

export function ThreeSpans() {
  const s = useScene(3, [600, 1700, 1700]);
  const k = s.k;

  return (
    <Scene scene={s} caption={k < 3 ? SP_SAY[k] : <span className={FADE}>আর একই দিকের দুইটা button, আবার সেই একটা লাইন। তিনটার শেপ তিন রকম, নাম একটাই।</span>}>
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
// 7¾ · A figure for the door check's explanation, no task: press nothing at
//      all, and Shiku is standing on the door corner. So whatever the buttons
//      are, the door is always inside the span.

const DI_SAY = [
  "Remote হাতে, কিন্তু একটা button-ও চাপা হয়নি।",
  "শূন্যবার u, শূন্যবার v: 0·u + 0·v = (0, 0)।",
  "Shiku তাই দরজাতেই দাঁড়িয়ে।",
];

export function DoorInside() {
  const s = useScene(3, [600, 2200, 1600]);
  const k = s.k;
  const keys = SHELF[2].keys;

  return (
    <Scene scene={s} caption={k < 3 ? DI_SAY[k] : <span className={FADE}>Button-এর সংখ্যা যাই হোক, এই হিসাবটা সব remote-এর বেলাতেই খাটে। তাই দরজা কখনো span-এর বাইরে পড়ে না।</span>}>
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
// 8 · এবার আপনার পালা. Four remotes the reader has not seen, and for each one
//     the call before any paint: one line, or the whole floor? A wrong tap
//     bounces, so the numbers actually get read. The dead (0, 0) button and
//     the lone (2, 3) are the two that catch people.

const YOURS: { keys: Key[]; note: string }[] = [
  {
    keys: [
      { name: "u", v: [3, 1], tone: "blue" },
      { name: "v", v: [-6, -2], tone: "coral" },
    ],
    note: "(−6, −2) আসলে (3, 1)-এর −2 গুণ, মানে একই রাস্তা, উল্টো দিকে।",
  },
  {
    keys: [
      { name: "u", v: [1, 0], tone: "blue" },
      { name: "v", v: [1, 1], tone: "coral" },
    ],
    note: "একটা পূর্বে, একটা কোনাকুনি। দুই দিক আলাদা, তাই পুরো মেঝে।",
  },
  {
    keys: [
      { name: "u", v: [0, 0], tone: "blue" },
      { name: "v", v: [2, 1], tone: "coral" },
    ],
    note: "u = (0, 0) মরা button, চাপলে Shiku নড়েই না। তাহলে হাতে থাকলো একটা button, মানে একটা লাইন।",
  },
  {
    keys: [{ name: "v", v: [2, 3], tone: "coral" }],
    note: "Button একটাই, তাই লাইনও একটাই।",
  },
];
const YF = makeFrame(-7, 4, -3, 4, 13, 10);
const YOUR_OPT = ["একটা লাইন", "পুরো মেঝে"];

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
      pass("Button কয়টা না, button কোন দিকে।");
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
            Remote {bn(at + 1)}/{bn(YOURS.length)}
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
      {miss > 0 && !shown ? <Nope key={miss}>উঁহু। দুইটা arrow সত্যিই দুই দিকে যাচ্ছে কিনা, আরেকবার দেখুন।</Nope> : null}
      {shown && at < YOURS.length - 1 && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={next} className={primaryBtn}>
            পরের remote
          </button>
        </div>
      )}
      <Task done={done}>চারটা remote-এর প্রত্যেকটার span বলুন: লাইন, নাকি পুরো মেঝে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for the Check's explanation, no task: {(2, 0)} and
//      {(2, 0), (−5, 0)} shade exactly the same wall line, because the second
//      button only walks the first one's road backwards.

const XC_F = makeFrame(-5, 5, -2, 2, 18, 10);
const XC_ONE: Key[] = [{ name: "u", v: [2, 0], tone: "blue" }];
const XC_TWO: Key[] = [...XC_ONE, { name: "v", v: [-5, 0], tone: "coral" }];
const XC_SAY = [
  "প্রথম set-এ button একটাই, (2, 0)।",
  "সামনে-পিছনে আর আধা চাপে, দেয়াল বরাবর পুরো লাইনটাই পাওয়া যায়।",
  "দ্বিতীয় set-এ বাড়তি button (−5, 0), সে-ও ওই একই দেয়ালেই হাঁটে।",
];

export function WallLine() {
  const s = useScene(3, [600, 1800, 2000]);
  const k = s.k;

  return (
    <Scene
      scene={s}
      caption={k < 3 ? XC_SAY[k] : <span className={FADE}>তাই দুইটা set-এর span হুবহু এক, ওই একটা লাইন। Button একটা বাড়লেও reach এক চুলও বাড়েনি।</span>}
    >
      <div className="mx-auto w-[12rem]">
        <Plane f={XC_F} grid={1} axes={false} label="both sets shade the same wall line" className="my-0! max-w-none">
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
// 9a · A story scene for the last step's setup, no task: মাগরিবের আগে ফাহিম
//      remote গ কিনে ফিরলো, আর নাসিবের নিয়মটা ভুল প্রমাণ হলো।

const S9_FLOOR = 150;

export function RemoteBought({}: Story) {
  const s = useScene(3, [600, 2000, 2200]);
  const k = s.k;

  return (
    <StoryFrame scene={s}>
      <Stage backdrop="evening" ground={S9_FLOOR} label="at dusk ফাহিম comes out of the toy shop with remote গ, নাসিব is not impressed, and Shiku walks home with them">
        <Stall x={48} y={S9_FLOOR} sign="খেলনা" color="#0d9488" w={72} />
        <CastPerson who="fahim" x={k >= 3 ? 112 : 152} y={S9_FLOOR + 16} facing={k >= 3 ? -1 : 1} walking={k === 3} arm={k >= 1 ? "hold" : "down"} mood={k >= 1 ? "happy" : "plain"} label />
        {k >= 1 && <CastCard x={k >= 3 ? 112 : 152} y={S9_FLOOR - 56} text="remote গ" tone="teal" />}
        {k >= 1 && <S1Remote x={k >= 3 ? 96 : 164} y={S9_FLOOR - 34} broken={false} />}
        <CastPerson who="nasib" x={262} y={S9_FLOOR + 16} facing={-1} mood={k >= 2 ? "sad" : "smug"} label />
        {k === 2 && <Bubble x={262} y={S9_FLOOR - 50} side="left" lines={["ওটা তো দেখতে সবচেয়ে", "অগোছালো!"]} />}
        <Robot x={k >= 3 ? 168 : 206} y={S9_FLOOR + 16} walking={k === 3} />
        {k >= 3 && <Bubble x={112} y={S9_FLOOR - 78} side="right" lines={["Button গুনে লাভ নাই,", "দেখো কতদূর পৌঁছায়।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9 · The bet settled. Tap each remote to open its verdict: ✓ ✗ ✓ ✗. নাসিবের
//     "দুই button থাকলেই সব জায়গা" lost twice, and the rule that replaces it
//     is the journey's one line.

const VERDICT: { name: string; ok: boolean; reach: string; why: string }[] = [
  { name: "ক", ok: true, reach: "পুরো মেঝে", why: "একটা পূর্বে, একটা উত্তরে। দুই দিক আলাদা।" },
  { name: "খ", ok: false, reach: "একটা তেরছা লাইন", why: "(2, 2) হলো (1, 1)-এর দুই গুণ, তাই দিক একটাই।" },
  { name: "গ", ok: true, reach: "পুরো মেঝে", why: "দেখতে অগোছালো, কিন্তু দিক দুইটা আলাদা।" },
  { name: "ঘ", ok: false, reach: "দরজার দেয়াল বরাবর লাইন", why: "(2, 0) আর (−5, 0), দুইটাই একই দেয়ালে হাঁটে।" },
];

export function Finale() {
  const pass = useGate();
  const [open, setOpen] = useSeed<string[]>("open", []);
  const all = open.length === VERDICT.length;

  const show = (n: string) => {
    if (open.includes(n)) return;
    const next = [...open, n];
    setOpen(next);
    if (next.length === VERDICT.length) pass("দুই button, তবু দুইটা আটকে গেল।");
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
                <span className="text-sm text-muted">দেখুন</span>
              )}
            </div>
            {open.includes(r.name) && <div className={`${FADE} text-xs text-muted`}>{r.why}</div>}
          </button>
        ))}
      </div>
      {all && (
        <div className={`${FADE} mx-auto mt-3 max-w-sm rounded-2xl bg-cat-violet/5 px-4 py-3 text-center text-[0.95rem]`}>
          নাসিবের নিয়ম দুইবার হারলো। Button গুনে লাভ নাই, দেখতে হবে কতদূর পৌঁছায়।
        </div>
      )}
      <Task done={all}>চারটা remote-এর ফল একটা একটা করে খুলুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  MovingDay: { chalk: { k: 1 }, broken: { k: 2 }, end: {} },
  RemoteShelf: { start: {}, sealed: { picks: ["ক", "খ"], sealed: true } },
  OneButton: { start: {}, swept: { q: 6, seen: [0, 4, 8, -4, -8, 6, 10, 14] } },
  LineNamed: { mid: { k: 2 }, end: {} },
  OldRemote: { start: {}, two: { amt: [2, 2], hit: ["টেবিল"] }, all: { amt: [3, 5], hit: ["আলমারি", "খাট", "টেবিল", "র‍্যাক"] } },
  TwinButtons: {
    start: {},
    table: { amt: [2, 0], table: true },
    stuck: { amt: [1, 1], table: true, tried: [0, 1, 3, 4, 5, -1], done: true },
  },
  SameDirection: { mid: { k: 2 }, end: {} },
  SlotsSame: { start: {}, mid: { k: 2 }, end: { k: 4 } },
  MessyRemote: { start: {}, hunt: { guess: 0, amt: [5, 0] }, found: { guess: 0, amt: [5, -1], hit: ["আলমারি"] } },
  BackStep: { over: { k: 2 }, end: {} },
  PaintReach: { start: {}, kha: { pick: 1, on: true, painted: [0, 1] }, all: { pick: 3, on: true, painted: [0, 1, 2, 3] } },
  ThreeSpans: { mid: { k: 2 }, end: {} },
  DoorInside: { mid: { k: 2 }, end: {} },
  YourRemotes: { start: {}, shown: { at: 0, shown: true }, last: { at: 3, shown: true, done: true } },
  WallLine: { mid: { k: 2 }, end: {} },
  RemoteBought: { bought: { k: 1 }, nasib: { k: 2 }, end: {} },
  Finale: { start: {}, some: { open: ["ক", "খ"] }, all: { open: ["ক", "খ", "গ", "ঘ"] } },
};
