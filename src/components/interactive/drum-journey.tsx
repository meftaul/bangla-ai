"use client";

import { useRef, useState } from "react";

import { Task, useGate } from "@/components/journey/journey";
import {
  Choice,
  FADE,
  Nope,
  POP,
  Speech,
  predictLook,
  primaryBtn,
  usePlay,
  useScene,
  useSeed,
  useTween,
  type Fixtures,
} from "@/components/journey/kit";
import { Bubble, Person, Stage, Stall, StoryFrame } from "@/components/journey/cast";

// Screens for "Math for AI 1.2 — Binary from rice drums", the pieces-to-picture
// version of 01b_binary (see .claude/skills/pieces-to-picture and
// 01b2_pieces_plan.md).
//
// The route: Mama's shelf makes base 10 physical — loose kilos on the right,
// drums of 10 next, tanks of 10 drums after that — and 150 kg with only drums
// overflows one slot until the reader packs a tank. Then two pieces that look
// unrelated: wedding bulbs that are only on or off, and a newspaper whose
// layers double with each fold. The one rule change (a bulb has two states,
// so a drum holds 2) turns the shelf into 1 1 0 1, the snap turns full
// containers into lit bulbs with the fold numbers as their sizes, and the
// reader uses it to send table numbers to the kitchen, and last, to light a
// pixel with eight bulbs (0–255).
//
// Visual hook shared by every piece: AMBER is a full container and a lit bulb.
// Slots always run right to left, smallest on the right.
//
// Tailwind only; drawn objects use fixed ink.

type Story = { story?: boolean };

const AMBER = "#f59e0b";
const AMBER_RIM = "#b45309";
const NIGHT = "#0f172a";
const valueOf = (bits: number[]) => bits.reduce((a, b) => a * 2 + b, 0);
const bitsOf = (n: number, k: number) => Array.from({ length: k }, (_, j) => (n >> (k - 1 - j)) & 1);

// ---------------------------------------------------------------------------
// Things on the shelf: a sack of loose rice, and containers that get bigger
// with each slot. All containers are the same amber, which is what a lit bulb
// will be too.

function Sack({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.5 3h7l-1 3q5.5 3 5.5 8q0 5 -8 5t-8 -5q0 -5 5.5 -8z" fill="#d6b98c" stroke="#8a6a3d" strokeWidth={1.2} />
      <path d="M7.5 6h5" stroke="#8a6a3d" strokeWidth={1.2} />
    </svg>
  );
}

function Tub({ s }: { s: number }) {
  return (
    <svg width={s} height={s * 1.1} viewBox="0 0 20 22" aria-hidden="true">
      <rect x={2.5} y={3} width={15} height={17.5} rx={2} fill={AMBER} stroke={AMBER_RIM} strokeWidth={1.2} />
      <path d="M2.5 8.5h15M2.5 15h15" stroke={AMBER_RIM} strokeWidth={1.1} />
      <ellipse cx={10} cy={3} rx={7.5} ry={2} fill="#fbbf24" stroke={AMBER_RIM} strokeWidth={1.1} />
    </svg>
  );
}

/** Icon sizes per slot, smallest slot first. */
const SIZE = { ten: [14, 22, 34], two: [12, 16, 21, 27] } as const;
type Kind = keyof typeof SIZE;

function Item({ kind, level }: { kind: Kind; level: number }) {
  const s = SIZE[kind][level];
  return level === 0 ? <Sack s={s} /> : <Tub s={s} />;
}

// ---------------------------------------------------------------------------
// The shelf. `counts` is smallest slot first; it draws biggest on the left.
// A slot holding `base` or more is overflowing: the pile rises out of it and
// its digit turns red, because a slot can only show one digit.

function Shelf({
  kind,
  base,
  counts,
  names,
  packing = null,
  miss = null,
  onPack,
}: {
  kind: Kind;
  base: number;
  counts: number[];
  names: string[];
  packing?: number | null;
  miss?: { i: number; n: number } | null;
  onPack?: (i: number) => void;
}) {
  const order = counts.map((_, i) => i).reverse();
  const tight = counts.length > 3;
  return (
    <div className="mx-auto mt-6 flex w-full max-w-sm items-start justify-center gap-1.5">
      {order.map((i) => {
        const c = counts[i];
        const over = c >= base;
        const going = packing === i ? Math.floor(c / base) * base : 0;
        return (
          <div key={i} className={`flex min-w-0 flex-1 flex-col items-center ${tight ? "max-w-21" : "max-w-30"}`}>
            <span className="h-8 text-center text-[0.7rem] leading-tight text-muted">{names[i]}</span>
            <div
              className={`relative flex h-22 w-full flex-wrap-reverse content-start items-end justify-center gap-0.5 rounded-lg border-2 px-0.5 pb-1 transition-colors duration-300 motion-reduce:transition-none ${
                over ? "border-danger/60 bg-danger/5" : "border-border bg-foreground/[0.03]"
              }`}
            >
              {Array.from({ length: c }, (_, j) => (
                <span
                  key={j}
                  style={{ transitionDelay: `${i === 0 ? Math.min(j, 20) * 30 : 0}ms`, rotate: over && j >= base ? `${((j * 37) % 21) - 10}deg` : undefined }}
                  className={`${POP} ${j < going ? "scale-0 opacity-0" : ""} inline-flex`}
                >
                  <Item kind={kind} level={i} />
                </span>
              ))}
              {miss?.i === i && (
                <span key={miss.n} className="nudge absolute -top-3 rounded-full bg-danger px-2 text-[0.7rem] font-semibold text-white">
                  not full
                </span>
              )}
            </div>
            <span className={`mt-1 font-mono text-2xl font-bold tabular-nums transition-colors ${over ? "text-danger" : "text-foreground"}`}>{c}</span>
            {onPack && i < counts.length - 1 ? (
              <button
                type="button"
                onClick={() => onPack(i)}
                className="cursor-pointer rounded-full border border-cat-blue/50 px-2 py-0.5 text-xs font-semibold text-cat-blue hover:bg-cat-blue/10"
              >
                ← pack {base}
              </button>
            ) : (
              <span className="h-5.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The shelf's state. `pack(i)` packs every full group in slot i into slot
 * i + 1: the group shrinks away, then the new containers pop in next door.
 * Packing a slot that isn't full jiggles a "not full" tag instead.
 */
function usePack(base: number, initial: number[]) {
  const [counts, setCounts] = useSeed<number[]>("counts", initial);
  const [packing, setPacking] = useState<number | null>(null);
  const [miss, setMiss] = useState<{ i: number; n: number } | null>(null);
  const busy = useRef(false);

  const pack = (i: number, then?: (next: number[]) => void) => {
    if (busy.current) return false;
    if (counts[i] < base) {
      setMiss({ i, n: (miss?.n ?? 0) + 1 });
      return false;
    }
    busy.current = true;
    setMiss(null);
    setPacking(i);
    const g = Math.floor(counts[i] / base);
    const next = counts.map((c, j) => (j === i ? c - g * base : j === i + 1 ? c + g : c));
    setTimeout(() => {
      setCounts(next);
      setPacking(null);
      busy.current = false;
      then?.(next);
    }, 550);
    return true;
  };
  return { counts, setCounts, packing, miss, pack };
}

/** The number Mama writes in her book: the slots' digits, biggest first. */
const book = (counts: number[]) => Number([...counts].reverse().join("")).toString();
const settled = (counts: number[], base: number) => counts.every((c) => c < base);

// ---------------------------------------------------------------------------
// Bulbs. A lit bulb is the same amber as a full container.

function Bulb({ on, s = 34, onClick, label }: { on: boolean; s?: number; onClick?: () => void; label?: string }) {
  const svg = (
    <svg width={s} height={s * 1.3} viewBox="0 0 20 26" aria-hidden="true">
      <path d="M10 0v4" stroke="#64748b" strokeWidth={1.2} />
      {on && <circle cx={10} cy={13} r={10} fill={AMBER} opacity={0.3} className={POP} />}
      <circle cx={10} cy={13} r={7} fill={on ? AMBER : "#334155"} stroke={on ? "#fde68a" : "#475569"} strokeWidth={1.2} className="transition-[fill] duration-200 motion-reduce:transition-none" />
      <rect x={7} y={19} width={6} height={5} rx={1} fill="#94a3b8" />
    </svg>
  );
  if (!onClick) return <span className="inline-flex">{svg}</span>;
  return (
    <button type="button" onClick={onClick} aria-label={label ?? (on ? "bulb on" : "bulb off")} aria-pressed={on} className="inline-flex cursor-pointer rounded-lg active:scale-95">
      {svg}
    </button>
  );
}

/** A string of bulbs on a night panel; `labels` writes a small number under each. */
function BulbString({ bits, onToggle, labels, s = 34 }: { bits: number[]; onToggle?: (j: number) => void; labels?: (string | null)[]; s?: number }) {
  return (
    <div className="mx-auto flex w-fit items-start gap-2 rounded-2xl px-4 pt-1 pb-2" style={{ backgroundColor: NIGHT }}>
      {bits.map((b, j) => (
        <div key={j} className="flex flex-col items-center">
          <Bulb on={b === 1} s={s} onClick={onToggle ? () => onToggle(j) : undefined} />
          {labels && <span className="h-4 font-mono text-xs" style={{ color: "#94a3b8" }}>{labels[j] ?? ""}</span>}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The pandal: 32 tables in a row from the kitchen, 0 to 31. Karim carries the
// food to whichever table the bulbs say. The table Rina wants is flagged.

const tableX = (n: number) => 34 + n * 8.9;

function Pandal({ target, at }: { target?: number; at: number | null }) {
  // Karim glides by CSS (Person's own transition); the tween only tells us
  // whether he is still on the way, so his legs swing until he arrives.
  const dest = at === null ? 16 : tableX(at);
  const [x] = useTween([dest], 1100);
  const walking = Math.abs(x - dest) > 0.5;
  return (
    <svg viewBox="0 0 320 84" role="img" aria-label={at === null ? "Karim waits at the kitchen" : `Karim walks to table ${at}`} className="mx-auto mt-3 block h-auto w-full max-w-sm rounded-xl" style={{ backgroundColor: NIGHT }}>
      <rect x={2} y={40} width={26} height={30} rx={2} fill="#7c2d12" />
      <path d="M0 42l15 -10l15 10z" fill="#9a3412" />
      <text x={15} y={80} textAnchor="middle" fontSize={7} fill="#cbd5e1">
        kitchen
      </text>
      <path d="M30 70H318" stroke="#334155" strokeWidth={1} />
      {Array.from({ length: 32 }, (_, n) => (
        <g key={n}>
          <rect x={tableX(n) - 3} y={64} width={6} height={4} rx={1} fill={n === target ? AMBER : n === at ? "#e2e8f0" : "#475569"} />
          {(n === target || n === at || n % 8 === 0) && (
            <text x={tableX(n)} y={80} textAnchor="middle" fontSize={7} fontWeight={n === target || n === at ? 700 : 400} fill={n === target ? AMBER : "#cbd5e1"}>
              {n}
            </text>
          )}
        </g>
      ))}
      {target !== undefined && <path d={`M${tableX(target)} 62V50l7 3l-7 3`} stroke={AMBER} strokeWidth={1.2} fill={AMBER} />}
      <g transform="translate(0 2)">
        <Person who="karim" x={dest} y={68} scale={0.62} ms={1100} walking={walking} arm="hold" />
        <ellipse cx={x + 7} cy={38} rx={5} ry={1.8} fill="#e2e8f0" />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Story scenes.

export function WeddingNight({}: Story) {
  const s = useScene(3, [500, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" ground={140} label="the wedding pandal at night: Rina at the switches, a string of five bulbs to the kitchen, a guest at table 13 waving, Karim at the kitchen">
        <path d="M60 64Q160 84 262 64" stroke="#64748b" strokeWidth={1} fill="none" />
        {[0, 1, 2, 3, 4].map((j) => (
          <circle key={j} cx={100 + j * 30} cy={72 + (j === 2 ? 2 : j % 2)} r={4} fill={k >= 3 && (j === 1 || j === 2 || j === 4) ? AMBER : "#334155"} className="transition-[fill] duration-300" />
        ))}
        <rect x={40} y={112} width={26} height={16} rx={2} fill="#1e293b" stroke="#64748b" />
        <Person who="rina" x={54} y={156} mood={k >= 2 ? "puzzled" : "plain"} arm="point" />
        <rect x={258} y={96} width={52} height={44} fill="#7c2d12" />
        <path d="M252 98l32 -18l32 18z" fill="#9a3412" />
        <Person who="karim" x={284} y={160} facing={-1} mood={k >= 3 ? "happy" : "plain"} />
        {k >= 2 && (
          <g className={POP}>
            <rect x={140} y={140} width={30} height={10} rx={2} fill="#78350f" />
            <text x={155} y={148} textAnchor="middle" fontSize={7} fontWeight={700} fill="#fde68a">
              13
            </text>
          </g>
        )}
        {k >= 2 && <Person who="nasib" x={176} y={160} arm="wave" mood="shout" />}
        {k === 2 && <Bubble x={176} y={96} side="mid" lines={["Table 13!", "No biryani yet!"]} />}
        {k >= 3 && <Bubble x={270} y={70} side="left" lines={["Light the bulbs.", "I'll read them."]} />}
      </Stage>
    </StoryFrame>
  );
}

export function RiceShop({}: Story) {
  const s = useScene(2, [500, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="street" ground={150} label="Mama's rice shop in the afternoon: Mama beside his amber rice drums, Rina helping">
        <Stall x={120} y={150} w={120} sign="Mama's rice" color="#16a34a" />
        {[0, 1, 2].map((j) => (
          <g key={j} transform={`translate(${196 + j * 24} 126)`}>
            <Tub s={22} />
          </g>
        ))}
        <Person who="mama" x={70} y={164} arm={k >= 1 ? "point" : "down"} mood="happy" />
        <Person who="rina" x={290} y={164} facing={-1} />
        {k >= 1 && <Bubble x={90} y={86} side="right" lines={["One drum = 10 kg.", "Exactly 10."]} />}
        {k >= 2 && <Bubble x={284} y={86} side="left" lines={["And the rest", "stays in sacks?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The hook. Five bulbs, a Send button, and Karim walking to whatever table
//     the kitchen reads. The reader can't aim yet: that's the journey's
//     question, answered on screen 9.

function useBoard(k: number) {
  const [bits, setBits] = useSeed<number[]>("bits", Array(k).fill(0));
  const [sent, setSent] = useSeed<number | null>("sent", null);
  const toggle = (j: number) => setBits(bits.map((b, i) => (i === j ? 1 - b : b)));
  return { bits, setBits, sent, setSent, toggle };
}

export function LightBoard() {
  const pass = useGate();
  const { bits, sent, setSent, toggle } = useBoard(5);
  const [tries, setTries] = useSeed("tries", 0);

  const send = () => {
    const v = valueOf(bits);
    setSent(v);
    setTries(tries + 1);
    if (tries + 1 === 3) pass("The kitchen reads the bulbs somehow. How?");
  };

  return (
    <>
      <BulbString bits={bits} onToggle={toggle} />
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={send} className={primaryBtn}>
          Send
        </button>
      </div>
      <Pandal target={13} at={sent} />
      {sent !== null && sent !== 13 && (
        <Nope key={tries}>
          The kitchen read table {sent}. Table 13 is still waiting.
        </Nope>
      )}
      {sent === 13 && <Speech who="Rina" initial="R" tint="teal" tone="good">Lucky! But could I do that again on purpose?</Speech>}
      <Task done={tries >= 3}>Light some bulbs and send them. Try three times.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · Mama's shelf, 13 kg. Pour, then pack: ten sacks shrink into a drum.

const TEN_NAMES_2 = ["loose kg", "drum · 10 kg"];

export function PackThirteen() {
  const pass = useGate();
  const { counts, setCounts, packing, miss, pack } = usePack(10, [0, 0]);
  const [poured, setPoured] = useSeed("poured", false);
  const done = poured && settled(counts, 10) && counts[1] > 0;

  const onPack = (i: number) =>
    pack(i, (next) => {
      if (settled(next, 10)) pass("13 kg is 1 drum and 3 loose.");
    });

  return (
    <>
      <Shelf kind="ten" base={10} counts={counts} names={TEN_NAMES_2} packing={packing} miss={miss} onPack={poured ? onPack : undefined} />
      {!poured && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setPoured(true);
              setCounts([13, 0]);
            }}
            className={primaryBtn}
          >
            Pour 13 kg
          </button>
        </div>
      )}
      {miss && <Nope key={miss.n}>A drum only closes when it holds 10.</Nope>}
      {done && <div className={`${FADE} mt-3 text-center text-sm text-muted`}>Mama writes in her book: <b className="font-mono text-lg text-foreground">{book(counts)}</b></div>}
      <Task done={done}>Pour the order, then pack every full drum.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Predict: 93 kg. The drums roll in one by one after the guess.

const G93 = ["3 drums", "9 drums", "93 drums"];

export function NinetyThree() {
  const pass = useGate();
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const [over, setOver] = useSeed("over", false);
  const play = usePlay(260);
  const k = over && !play.running ? 9 : play.k;

  const pour = () =>
    play.play(9, () => {
      setOver(true);
      pass("The 9 in 93 counts drums.");
    });

  return (
    <>
      <Shelf kind="ten" base={10} counts={[k === 9 ? 3 : 0, k]} names={TEN_NAMES_2} />
      {guess !== null && !over && !play.running && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={pour} className={primaryBtn}>
            Pour 93 kg
          </button>
        </div>
      )}
      <div className="mt-3 text-sm font-medium text-muted">How many full drums will 93 kg make?</div>
      <div className="mt-2 grid gap-1.5">
        {G93.map((o, i) => (
          <Choice key={o} n={i} look={predictLook(i, guess, over, 1)} disabled={guess !== null} onClick={() => setGuess(i)}>
            {o}
          </Choice>
        ))}
      </div>
      <Task done={over}>Guess first, then pour.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · The wall: 150 kg is fifteen drums, and one slot can't hold 15. The tank
//     slot is there, empty, from the start; packing ten drums into it is the
//     reader's own move.

const TEN_NAMES_3 = ["loose kg", "drum · 10 kg", "tank · 10 drums"];

export function OneFifty() {
  const pass = useGate();
  const { counts, packing, miss, pack } = usePack(10, [0, 15, 0]);
  const [arrived, setArrived] = useSeed("arrived", false);
  const play = usePlay(140);
  const shown = arrived ? counts : [0, play.k, 0];
  const done = arrived && settled(counts, 10);

  const onPack = (i: number) =>
    pack(i, (next) => {
      if (settled(next, 10)) pass("One digit per slot. Ten moves up a slot.");
    });

  return (
    <>
      <Shelf kind="ten" base={10} counts={shown} names={TEN_NAMES_3} packing={packing} miss={miss} onPack={arrived ? onPack : undefined} />
      {!arrived && !play.running && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={() => play.play(15, () => setArrived(true))} className={primaryBtn}>
            Bring 150 kg
          </button>
        </div>
      )}
      {arrived && !done && !miss && <div className={`${FADE} mt-3 text-center text-sm text-danger`}>Fifteen drums in one slot. Mama can&apos;t write &ldquo;15&rdquo; in one place.</div>}
      {miss && <Nope key={miss.n}>Nothing to pack there. Where is the pile?</Nope>}
      {done && <div className={`${FADE} mt-3 text-center text-sm text-muted`}>Mama writes: <b className="font-mono text-lg text-foreground">{book(counts)}</b></div>}
      <Task done={done}>Bring the order in, then tidy the shelf.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · Piece: testing the wedding bulbs. Match three cards. A bulb has two
//     looks, on and off, and that's all this screen is about.

const CARDS = [
  [1, 0, 1, 1],
  [0, 1, 1, 0],
  [1, 1, 0, 1],
];

export function TestBulbs() {
  const pass = useGate();
  const { bits, setBits, toggle } = useBoard(4);
  const [round, setRound] = useSeed("round", 0);
  const card = CARDS[Math.min(round, CARDS.length - 1)];
  const done = round >= CARDS.length;

  const tap = (j: number) => {
    if (done) return;
    const next = bits.map((b, i) => (i === j ? 1 - b : b));
    toggle(j);
    if (next.join("") === card.join("")) {
      setTimeout(() => {
        setBits([0, 0, 0, 0]);
        setRound(round + 1);
        if (round + 1 === CARDS.length) pass("A bulb is on or off. Nothing else.");
      }, 500);
    }
  };

  return (
    <>
      {!done ? (
        <div key={round} className={`${POP} mx-auto flex w-fit items-center gap-2 rounded-xl border-2 border-dashed border-border px-3 py-2`}>
          <span className="text-sm text-muted">Card {round + 1}:</span>
          {card.map((b, j) => (
            <span key={j} className="size-4 rounded-full border" style={{ backgroundColor: b ? AMBER : "#334155", borderColor: b ? "#fde68a" : "#475569" }} />
          ))}
        </div>
      ) : (
        <div className={`${POP} text-center text-sm font-semibold text-accent-text`}>All three cards matched.</div>
      )}
      <div className="mt-4">
        <BulbString bits={done ? [1, 1, 0, 1] : bits} onToggle={tap} s={44} />
      </div>
      <Task done={done}>Tap the bulbs to match each card.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6 · Piece: folding a newspaper for paper bags. The sheet halves, the
//     layers double. The fourth fold is a prediction.

const G_FOLD = ["9 layers", "10 layers", "16 layers"];

export function FoldPaper() {
  const pass = useGate();
  const [folds, setFolds] = useSeed("folds", 0);
  const [guess, setGuess] = useSeed<number | null>("guess", null);
  const layers = 2 ** folds;
  const [w] = useTween([200 / layers], 450);
  const done = folds === 4;
  const locked = folds === 3 && guess === null;

  const fold = () => {
    if (done || locked) return;
    setFolds(folds + 1);
    if (folds + 1 === 4) pass("Every fold doubles: 1, 2, 4, 8, 16.");
  };

  return (
    <>
      <svg viewBox="0 0 320 86" role="img" aria-label={`a newspaper folded ${folds} times, ${layers} layers thick`} className="mx-auto block h-auto w-full max-w-sm">
        <rect x={10} y={4} width={w} height={70} fill="#f5f0e1" stroke="#a8a29e" />
        {Array.from({ length: 6 }, (_, j) => (
          <path key={j} d={`M${16} ${14 + j * 10}h${Math.max(0, w - 12)}`} stroke="#a8a29e" strokeWidth={1.5} />
        ))}
        {Array.from({ length: layers }, (_, j) => (
          <rect key={j} x={250} y={74 - (j + 1) * 4.4} width={50} height={3.6} rx={1} fill="#f5f0e1" stroke="#a8a29e" strokeWidth={0.6} className={POP} />
        ))}
        <text x={275} y={84} textAnchor="middle" fontSize={9} fill="currentColor" className="text-muted">
          side view
        </text>
      </svg>
      <div className="mt-1 flex items-center justify-center gap-3">
        <span className="font-mono text-3xl font-bold tabular-nums">{layers}</span>
        <span className="text-sm text-muted">{layers === 1 ? "layer" : "layers"}</span>
        <button type="button" onClick={fold} disabled={done || locked} className={primaryBtn}>
          Fold
        </button>
      </div>
      <div className="mt-2 flex justify-center gap-1.5 font-mono text-sm">
        {Array.from({ length: folds + 1 }, (_, j) => (
          <span key={j} className={`${POP} rounded-full bg-foreground/5 px-2`}>
            {2 ** j}
          </span>
        ))}
      </div>
      {folds >= 3 && (
        <>
          <div className="mt-3 text-sm font-medium text-muted">One more fold. How many layers?</div>
          <div className="mt-2 grid gap-1.5">
            {G_FOLD.map((o, i) => (
              <Choice key={o} n={i} look={predictLook(i, guess, done, 2)} disabled={guess !== null} onClick={() => setGuess(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </>
      )}
      <Task done={done}>Fold it four times.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7 · The rule change. A bulb has two states, so the containers hold 2: pot,
//     pail, drum. Same shelf, same pack button, and 13 kg lands as 1 1 0 1.

const TWO_NAMES = ["loose kg", "pot · 2 kg", "pail · 2 pots", "drum · 2 pails"];

export function TinyDrums() {
  const pass = useGate();
  const { counts, setCounts, packing, miss, pack } = usePack(2, [0, 0, 0, 0]);
  const [poured, setPoured] = useSeed("poured", false);
  const done = poured && settled(counts, 2);

  const onPack = (i: number) =>
    pack(i, (next) => {
      if (settled(next, 2)) pass("13 kg on the tiny shelf: 1 1 0 1.");
    });

  return (
    <>
      <Shelf kind="two" base={2} counts={counts} names={TWO_NAMES} packing={packing} miss={miss} onPack={poured ? onPack : undefined} />
      {!poured && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setPoured(true);
              setCounts([13, 0, 0, 0]);
            }}
            className={primaryBtn}
          >
            Pour 13 kg
          </button>
        </div>
      )}
      {miss && <Nope key={miss.n}>That one holds less than 2. Nothing to pack.</Nope>}
      {poured && !done && !miss && <div className="mt-3 text-center text-sm text-muted">A red number means that slot still needs packing.</div>}
      <Task done={done}>Pour 13 kg, then pack until every slot shows 0 or 1.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · The snap. The tiny shelf from screen 7 turns into bulbs: the fold
//     numbers drop in as the containers' sizes, full containers light up,
//     empty slots go dark, 1 1 0 1 appears. Then the reader adds the lit ones.

const SNAP = [1, 1, 0, 1];
const SIZES = [8, 4, 2, 1];
const SNAP_CAP = [
  "",
  "Each container holds double the one on its right. Just like the folds.",
  "Full becomes a lit bulb. Empty becomes a dark one.",
  "Write lit as 1 and dark as 0.",
];

export function ShelfToBulbs() {
  const pass = useGate();
  const play = usePlay(1100);
  const [seen, setSeen] = useSeed("seen", false);
  const [tapped, setTapped] = useSeed<number[]>("tapped", []);
  const k = seen && !play.running ? 3 : play.k;
  const total = tapped.reduce((a, j) => a + SIZES[j], 0);
  const done = tapped.length === 3;

  const tap = (j: number) => {
    if (!seen || !SNAP[j] || tapped.includes(j)) return;
    const next = [...tapped, j];
    setTapped(next);
    if (next.length === 3) pass("Full = on, empty = off: 1101 is 13.");
  };

  return (
    <>
      <div className="mx-auto mt-2 flex w-fit items-end gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: k >= 2 ? NIGHT : "transparent" }}>
        {SNAP.map((b, j) => (
          <div key={j} className="flex w-14 flex-col items-center gap-1">
            <span className="h-6 font-mono text-sm font-bold" style={{ color: k >= 2 ? "#fde68a" : undefined }}>
              {k >= 1 && <span className={`${POP} inline-block`}>{SIZES[j]} kg</span>}
            </span>
            <div className="grid h-16 place-items-center">
              {k >= 2 ? (
                <span key="b" className={POP}>
                  <Bulb on={b === 1} s={40} onClick={() => tap(j)} label={`bulb for ${SIZES[j]} kg`} />
                </span>
              ) : b ? (
                <Item kind="two" level={3 - j} />
              ) : (
                <span className="size-6 rounded border-2 border-dashed border-border" />
              )}
            </div>
            <span className="h-8 font-mono text-2xl font-bold" style={{ color: k >= 2 ? "#e2e8f0" : undefined }}>
              {k >= 3 && <span className={`${POP} inline-block`}>{b}</span>}
            </span>
            <span className="h-5 font-mono text-sm font-bold" style={{ color: "#6ee7b7" }}>
              {tapped.includes(j) && <span className={`${POP} inline-block`}>+{SIZES[j]}</span>}
            </span>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-2 min-h-10 max-w-xs text-center text-sm leading-snug text-muted">
        {seen ? (
          <span>
            Lit bulbs add up to <b className="font-mono text-lg text-foreground">{total}</b>
            {done && " kg — the 13 you packed."}
          </span>
        ) : (
          SNAP_CAP[k]
        )}
      </div>
      {!seen && !play.running && (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={() => play.play(3, () => setSeen(true))} className={primaryBtn}>
            Switch on the shelf
          </button>
        </div>
      )}
      <Task done={done}>Switch on the shelf, then tap each lit bulb.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9 · Use it: the board from screen 1, now with the sizes under the bulbs.
//     Send table 13, then 22. A wrong row walks Karim to the wrong table.

const TARGETS = [13, 22];
const FIVE = ["16", "8", "4", "2", "1"];

export function SendTable() {
  const pass = useGate();
  const { bits, setBits, sent, setSent, toggle } = useBoard(5);
  const [round, setRound] = useSeed("round", 0);
  const [tries, setTries] = useState(0);
  const target = TARGETS[Math.min(round, TARGETS.length - 1)];
  const done = round >= TARGETS.length;

  const send = () => {
    const v = valueOf(bits);
    setSent(v);
    setTries(tries + 1);
    if (v !== target) return;
    setTimeout(() => {
      setRound(round + 1);
      setBits([0, 0, 0, 0, 0]);
      if (round + 1 === TARGETS.length) pass("13 is 01101. 22 is 10110.");
    }, 1300);
  };

  return (
    <>
      <BulbString bits={bits} onToggle={done ? undefined : toggle} labels={FIVE} />
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={send} disabled={done} className={primaryBtn}>
          Send table {target}
        </button>
      </div>
      <Pandal target={target} at={sent} />
      {sent !== null && sent !== target && !done && (
        <Nope key={tries}>
          The kitchen read {sent}. Which bulbs add up to {target}?
        </Nope>
      )}
      <Task done={done}>Send table 13, then table 22.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10 · Try it: the kitchen lights a row back. Which table asked? Picked as a
//      table; a wrong pick walks Karim there. The slips: reading the row
//      backwards (29), dropping the first bulb (7).

const BACK = bitsOf(23, 5);
const X_TABLES = [29, 23, 7];
const X_RIGHT = 1;
const X_WHY: Record<number, string> = {
  29: "That's the row read from the right. The biggest bulb is on the left.",
  7: "The first bulb got left out. It stands for 16.",
};

export function WhichTable() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const choose = (i: number) => {
    setPick(i);
    if (i === X_RIGHT) pass("10111 = 16 + 4 + 2 + 1 = 23.");
    else setMiss(miss + 1);
  };
  const at = pick === null ? null : X_TABLES[pick];

  return (
    <>
      <BulbString bits={BACK} />
      <Pandal at={at} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X_TABLES.map((t, i) => (
          <Choice key={t} n={i} look={pick === i ? (i === X_RIGHT ? "right" : "wrong") : "idle"} disabled={pick === X_RIGHT} onClick={() => choose(i)}>
            <span className="flex flex-col items-center">
              <svg width={34} height={22} viewBox="0 0 34 22" aria-hidden="true">
                <rect x={2} y={4} width={30} height={5} rx={1.5} fill="#78350f" />
                <path d="M6 9v12M28 9v12" stroke="#78350f" strokeWidth={2} />
              </svg>
              <span className="font-mono font-bold">{t}</span>
            </span>
          </Choice>
        ))}
      </div>
      {pick !== null && pick !== X_RIGHT && <Nope key={miss}>{X_WHY[X_TABLES[pick]]}</Nope>}
      <Task done={pick === X_RIGHT}>Pick the table the kitchen means.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 11 · Eight bulbs are one dot of a photo. The dot's brightness is the row's
//      number; all eight on is 255, pure white.

const EIGHT = ["128", "64", "32", "16", "8", "4", "2", "1"];

export function EightBulbs() {
  const pass = useGate();
  const { bits, toggle } = useBoard(8);
  const v = valueOf(bits);
  const done = v === 255;

  const tap = (j: number) => {
    const next = bits.map((b, i) => (i === j ? 1 - b : b));
    toggle(j);
    if (valueOf(next) === 255) pass("8 bulbs: 0 to 255.");
  };

  return (
    <>
      <div className="mx-auto flex w-fit items-center gap-4">
        <div className="size-24 rounded-xl border border-border transition-[background-color] duration-300 motion-reduce:transition-none" style={{ backgroundColor: `rgb(${v} ${v} ${v})` }} />
        <div className="text-center">
          <div className="text-sm text-muted">brightness</div>
          <div className="font-mono text-4xl font-bold tabular-nums">{v}</div>
        </div>
      </div>
      <div className="mt-4">
        <BulbString bits={bits} onToggle={done ? undefined : tap} labels={EIGHT} s={26} />
      </div>
      {done && <div className={`${POP} mt-3 text-center text-sm font-semibold text-accent-text`}>128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255</div>}
      <Task done={done}>Make the dot pure white.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  WeddingNight: { start: { k: 0 }, end: { k: 3 } },
  RiceShop: { end: { k: 2 } },
  LightBoard: { start: {}, sent: { bits: [0, 1, 0, 1, 0], sent: 10, tries: 1 } },
  PackThirteen: { start: {}, poured: { poured: true, counts: [13, 0] }, packed: { poured: true, counts: [3, 1] } },
  NinetyThree: { start: {}, guessed: { guess: 0 }, over: { guess: 0, over: true } },
  OneFifty: { start: {}, wall: { arrived: true }, packed: { arrived: true, counts: [0, 5, 1] } },
  TestBulbs: { start: {}, done: { round: 3 } },
  FoldPaper: { start: {}, three: { folds: 3 }, done: { folds: 4, guess: 2 } },
  TinyDrums: { start: {}, poured: { poured: true, counts: [13, 0, 0, 0] }, half: { poured: true, counts: [1, 6, 0, 0] }, done: { poured: true, counts: [1, 0, 1, 1] } },
  ShelfToBulbs: { start: {}, seen: { seen: true }, done: { seen: true, tapped: [0, 1, 3] } },
  SendTable: { start: {}, wrong: { bits: [0, 1, 0, 1, 0], sent: 10 }, done: { round: 2 } },
  WhichTable: { start: {}, wrong: { pick: 0 }, right: { pick: 1 } },
  EightBulbs: { start: {}, grey: { bits: [1, 0, 0, 1, 0, 1, 1, 0] }, white: { bits: [1, 1, 1, 1, 1, 1, 1, 1] } },
};
