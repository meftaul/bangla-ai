"use client";

import { useState, type ReactNode } from "react";

import { Tup } from "@/components/journey/box";
import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, GROW, Nope, POP, Scene, Stepper, Ticks, primaryBtn, usePlay, useScene, useSeed, useTween, type Fixtures, type Look } from "@/components/journey/kit";
import { Bubble, Card as CastCard, Person, Stage, Stall, StoryFrame } from "@/components/journey/cast";

// Screens for "Math for AI 4.0 — নাসিবের নিয়ম, ঘরে ঘরে গুণ কেন", told as a Journey.
//
// The night before the fair. নাসিব needs a rule that takes two cards, a
// person's taste and a film's score, both (drama, comedy), and gives one
// number to line the films up by. সামিন says any rule that gives a number will
// do; the reader seals a bet on that (1). Then the rules fall one by one, each
// on মামা (2, 5) and রিনা (5, 1): the film's card alone gives everyone Titanic
// (2); adding the taste in lifts every film alike, so the order never moves
// (3); dividing runs backwards and breaks on a 0 (4). রিনা's two wishes for
// one slot, grows with both and dies with either, are a patch's area: গুণ
// (5). Which slot with which: crossed wires and all-to-all both hand মামা
// Titanic (6). Two patches per film, combined how: multiplying them lets one
// empty slot kill a pure comedy, so they pile up, যোগ (7). The reader builds
// Mr. Bean's 22 by hand, the number মামা saw at the fair in 3.6 (8), shortens
// the long line on the board and puts a dot between t and f (9), and tries
// it for রিনা on three films (10). The end settles the bet (11).
//
// Pictures, not sums: a slot's worth is drawn as a খোপ, "how much the film
// has" wide and "how much the person wants" tall, counted in squares; a
// film's number is the tower its খোপ-গুলো pile into.
//
// Tailwind only; the stage and the sheets are fixed ink.

/** a card: (drama, comedy) */
type V = readonly [number, number];
const SLOTS = ["drama", "comedy"];

const MAMA: V = [2, 5];
const RINA: V = [5, 1];
const TITANIC: V = [5, 2];
const BEAN: V = [1, 4];
const HIROK: V = [4, 5];
const BHANU: V = [0, 6];

/** the rule the night ends with: slot by slot multiply, then add */
const box = (t: V, f: V) => t[0] * f[0] + t[1] * f[1];
/** a machine number: at most two decimals, a real minus, ∞ for a broken sum */
const sh = (n: number) => {
  if (!Number.isFinite(n)) return "∞";
  const r = Math.round(n * 100) / 100;
  return r < 0 ? `−${-r}` : `${r}`;
};

const INK = "#0f1b2d";
/** the two slots' colours: drama amber, comedy violet (fill, stroke) */
const SLOT_INK = [
  { fill: "#fcd34d", stroke: "#b45309", text: "text-cat-amber" },
  { fill: "#c4b5fd", stroke: "#6d28d9", text: "text-cat-violet" },
];
/** the films' colours */
const FILM = {
  titanic: { name: "Titanic", v: TITANIC, color: "#e11d48" },
  bean: { name: "Mr. Bean", v: BEAN, color: "#0d9488" },
  hirok: { name: "হীরক রাজার দেশে", v: HIROK, color: "#2563eb" },
  bhanu: { name: "ভানু পেল লটারি", v: BHANU, color: "#0284c7" },
};
type FilmKey = keyof typeof FILM;

// ---------------------------------------------------------------------------
// Shared chrome: a card, a row of bars, a খোপ of squares.

function ListCard({ who, v, tone = "border-cat-blue/40", className = "" }: { who: string; v: V; tone?: string; className?: string }) {
  return (
    <div className={`rounded-xl border-2 bg-surface px-2.5 py-1 text-center ${tone} ${className}`}>
      <div className="text-xs leading-tight text-muted">{who}</div>
      <div className="font-mono text-base font-bold">
        <Tup v={v} of={SLOTS} />
      </div>
    </div>
  );
}

type BarRow = { key: string; name: string; n: number; color: string };

/**
 * Bars that glide to their numbers (CSS width transition). `max` is the full
 * width; ∞ fills it, striped red. `numbers={false}` hides the readouts, for a
 * screen that must show who wins before the numbers are earned.
 */
function Bars({ rows, max, numbers = true }: { rows: BarRow[]; max: number; numbers?: boolean }) {
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const broken = !Number.isFinite(r.n);
        const pct = broken ? 100 : Math.max(0, Math.min(100, (r.n / max) * 100));
        return (
          <div key={r.key} className="flex items-center gap-2">
            <span className="w-[4.6rem] shrink-0 truncate text-right text-sm">{r.name}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-foreground/5">
              <div
                className="h-full rounded transition-[width] duration-700 ease-out motion-reduce:transition-none"
                style={{
                  width: `${pct}%`,
                  backgroundColor: broken ? "#ef4444" : r.color,
                  backgroundImage: broken ? "repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,.45) 6px 12px)" : undefined,
                }}
              />
            </div>
            {numbers && <span className={`w-11 shrink-0 font-mono text-sm tabular-nums ${broken ? "font-bold text-danger" : ""}`}>{sh(r.n)}</span>}
          </div>
        );
      })}
    </div>
  );
}

/**
 * A খোপ: `w` squares wide and `h` tall, its bottom-left corner at (x, y), `u`
 * units a square. The squares pop in as they mount, so a side that grows
 * brings its new squares in one by one; `shown` limits how many are drawn
 * (row by row from the bottom), for a count running up.
 */
function Patch({ x, y, w, h, u, slot, shown, pop = true }: { x: number; y: number; w: number; h: number; u: number; slot: 0 | 1; shown?: number; pop?: boolean }) {
  const c = SLOT_INK[slot];
  const cells: ReactNode[] = [];
  const upto = shown ?? w * h;
  for (let r = 0; r < h; r++)
    for (let col = 0; col < w; col++) {
      const i = r * w + col;
      if (i >= upto) continue;
      cells.push(
        <rect
          key={`${col},${r}`}
          x={x + col * u + 0.6}
          y={y - (r + 1) * u + 0.6}
          width={u - 1.2}
          height={u - 1.2}
          rx={1}
          fill={c.fill}
          stroke={c.stroke}
          strokeWidth={0.7}
          className={pop ? POP : undefined}
        />,
      );
    }
  return <g>{cells}</g>;
}

/** A tower: `n` squares piled five to a row, the drama ones first, bottom-left at (x, y). */
function Tower({ x, y, drama, comedy, u, shown, cols = 5 }: { x: number; y: number; drama: number; comedy: number; u: number; shown?: number; cols?: number }) {
  const total = drama + comedy;
  const upto = Math.min(total, shown ?? total);
  return (
    <g>
      {Array.from({ length: upto }, (_, i) => {
        const c = SLOT_INK[i < drama ? 0 : 1];
        return (
          <rect
            key={i}
            x={x + (i % cols) * u + 0.5}
            y={y - (Math.floor(i / cols) + 1) * u + 0.5}
            width={u - 1}
            height={u - 1}
            rx={0.8}
            fill={c.fill}
            stroke={c.stroke}
            strokeWidth={0.6}
            className={POP}
          />
        );
      })}
    </g>
  );
}

/** Draw a tick (the ✓ glyph turns into an emoji on Linux). */
function TickMark({ x, y, s = 1, color = "#16a34a" }: { x: number; y: number; s?: number; color?: string }) {
  return <path d={`M${x - 5 * s} ${y}l${3.5 * s} ${3.5 * s}l${7 * s} ${-8 * s}`} fill="none" stroke={color} strokeWidth={2 * s} strokeLinecap="round" strokeLinejoin="round" />;
}
function CrossMark({ x, y, s = 1, color = "#dc2626" }: { x: number; y: number; s?: number; color?: string }) {
  return <path d={`M${x - 5 * s} ${y - 5 * s}l${10 * s} ${10 * s}M${x + 5 * s} ${y - 5 * s}l${-10 * s} ${10 * s}`} fill="none" stroke={color} strokeWidth={2 * s} strokeLinecap="round" />;
}

// ---------------------------------------------------------------------------
// Props for the story scenes: the club's room at night (a window with the
// moon, a blackboard, a table of film boxes), and something carried. Fixed ink.

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

const S_Y = 150;

/** A film box, bottom-centre at (x, y), a strip of film across its top. */
function S_Film({ x = 0, y = 0, w = 16, h = 20, color }: { x?: number; y?: number; w?: number; h?: number; color: string }) {
  const holes = Math.max(1, Math.floor((w - 2) / 5));
  return (
    <g className="pointer-events-none">
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={1.5} fill={color} stroke={INK} strokeOpacity={0.35} strokeWidth={0.8} />
      <rect x={x - w / 2} y={y - h} width={w} height={4} fill="#1f2937" />
      {Array.from({ length: holes }, (_, i) => (
        <rect key={i} x={x - w / 2 + 1.5 + i * 5} y={y - h + 1} width={2} height={2} fill="white" />
      ))}
    </g>
  );
}

/** Something that glides to (x, y) over `ms`, the way a Person does: draw it around (0, 0). */
function S_Carry({ x, y, ms = 1200, children }: { x: number; y: number; ms?: number; children: ReactNode }) {
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)`, transitionDuration: `${ms}ms` }} className="pointer-events-none transition-transform ease-in-out motion-reduce:transition-none">
      {children}
    </g>
  );
}

/** The night outside the club's window, top-right of the room. */
function S_Window() {
  return (
    <g className="pointer-events-none">
      <rect x={250} y={18} width={52} height={40} rx={2} fill="#1e293b" stroke="#8b6b4a" strokeWidth={3} />
      <circle cx={288} cy={30} r={6} fill="#fef3c7" />
      <circle cx={285} cy={28} r={5} fill="#1e293b" />
      <circle cx={262} cy={27} r={0.9} fill="white" />
      <circle cx={272} cy={44} r={0.9} fill="white" />
      <path d="M276 18v40M250 38h52" stroke="#8b6b4a" strokeWidth={1.5} />
    </g>
  );
}

/** The club's blackboard, top-left of the room; children write on it. */
function S_Board({ x = 12, y = 30, w = 118, h = 64, children }: { x?: number; y?: number; w?: number; h?: number; children?: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill="#1f3d2e" stroke="#8b6b4a" strokeWidth={3} />
      <rect x={x + w - 22} y={y + h - 4} width={14} height={3} rx={1} fill="white" opacity={0.8} />
      {children}
    </g>
  );
}

/** Chalk writing, centred at (x, y). */
function S_Chalk({ x, y, size = 8.5, mono = false, children }: { x: number; y: number; size?: number; mono?: boolean; children: ReactNode }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={600} fill="#f8fafc" fontFamily={mono ? "ui-monospace, monospace" : undefined} className={FADE}>
      {children}
    </text>
  );
}

/** The table with the club's films on it, centred at x. */
function S_Table({ x, films = ["#e11d48", "#0d9488", "#2563eb"] }: { x: number; films?: string[] }) {
  return (
    <g className="pointer-events-none">
      {films.map((c, i) => (
        <S_Film key={c + i} x={x - 18 + i * 18} y={S_Y - 22} w={15} h={18} color={c} />
      ))}
      <rect x={x - 32} y={S_Y - 22} width={64} height={4} rx={1} fill="#92400e" />
      <path d={`M${x - 28} ${S_Y - 18}V${S_Y}M${x + 28} ${S_Y - 18}V${S_Y}`} stroke="#92400e" strokeWidth={3} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the club's room the night
//      before the fair. নাসিব puts two cards on the board, a taste and a film,
//      and an arrow to "?"; সামিন says any rule that gives a number will do.

const S1_NASIB = 158;
const S1_SAMIN = 280;
const S1_RINA = 214;

export function NightClub({}: Story) {
  const s = useScene(3, [600, 2400, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="মেলার আগের রাত, club-এর ঘর। নাসিব বোর্ডে দুইটা card লিখলো, মামার পছন্দ আর Titanic, পাশে একটা প্রশ্নবোধক। সামিন বললো যা খুশি করলেই একটা number আসবে।">
        <S_Window />
        <S_Board>
          {k >= 1 && (
            <>
              <S_Chalk x={42} y={52} mono>
                (2, 5)
              </S_Chalk>
              <S_Chalk x={42} y={78} mono>
                (5, 2)
              </S_Chalk>
              <S_Chalk x={42} y={42} size={6}>
                মামা
              </S_Chalk>
              <S_Chalk x={42} y={68} size={6}>
                Titanic
              </S_Chalk>
              <Draw d="M66 62h26" className="stroke-[#f8fafc]" delay={300} />
            </>
          )}
          {k >= 1 && (
            <text x={108} y={69} textAnchor="middle" fontSize={k >= 3 ? 22 : 15} fontWeight={700} fill="#fde68a" className={`${POP} transition-[font-size] duration-500 motion-reduce:transition-none`}>
              ?
            </text>
          )}
        </S_Board>
        <S_Table x={S1_RINA} />
        <Person who="rina" x={S1_RINA} y={S_Y} label />
        <Person who="nasib" x={S1_NASIB} y={S_Y} facing={-1} arm={k === 1 ? "point" : "down"} mood={k >= 3 ? "puzzled" : "plain"} label />
        <Person who="samin" x={S1_SAMIN} y={S_Y} facing={-1} mood={k === 2 ? "smug" : "plain"} label />
        {k === 1 && <Bubble x={S1_NASIB} y={S_Y - 66} lines={["দুইটা card থেকে", "একটা number চাই।"]} />}
        {k === 2 && <Bubble x={S1_SAMIN} y={S_Y - 66} side="left" lines={["যোগ কর, ভাগ কর।", "number আসলেই হলো।"]} />}
        {k >= 3 && <Bubble x={S1_NASIB} y={S_Y - 66} tone="think" lines={["সত্যি?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: is সামিন right? Four candidate rules drop through a
//     sieve; the pick is drawn as how many come out the other side, each with
//     a "?", then sealed. Never judged here; settled on the last screen.

const X1_BETS = ["সামিন ঠিক। যেকোনো rule-এ চলবে।", "কয়েকটা rule-এ চলবে।", "একটা rule-ই টিকবে।"];
/** how many of the four come through, per pick */
const X1_THROUGH = [4, 2, 1];

/** A sieve with four chips on top and `n` below it. */
function SieveIcon({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 80 52" className="h-auto w-full max-w-[5rem]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={10 + i * 16} y={4} width={12} height={9} rx={2} fill="#e2e8f0" stroke={INK} strokeOpacity={0.4} />
      ))}
      <path d="M6 20h68l-14 12H20Z" fill="none" stroke={INK} strokeOpacity={0.55} strokeWidth={1.4} />
      <path d="M14 24h52" stroke={INK} strokeOpacity={0.3} strokeDasharray="2 2" />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={40 - (n * 16) / 2 + i * 16 + 2} y={38} width={12} height={9} rx={2} fill="#fde68a" stroke="#b45309" />
      ))}
    </svg>
  );
}

const X1_RULES = ["ছবির card যোগ", "সব number যোগ", "ভাগ", "ঘরে ঘরে গুণ, যোগ"];

export function RuleBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const play = usePlay(260);
  const choose = (i: number) => {
    if (bet !== null) return;
    setBet(i);
    play.play(6, () => pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।"));
  };
  const k = bet === null ? 0 : play.running ? play.k : 6;
  const through = bet === null ? 0 : X1_THROUGH[bet];

  return (
    <>
      <div className={GROW}>
        <svg viewBox="0 0 300 150" className="mx-auto h-auto w-full max-w-[19rem]" role="img" aria-label="চারটা rule একটা ছাঁকনির ওপর; আপনার বাজি অনুযায়ী কয়টা নিচে পড়বে">
          <rect x={0} y={0} width={300} height={150} rx={10} fill="white" />
          {X1_RULES.map((r, i) => (
            <g key={r}>
              <rect x={8 + i * 72} y={10} width={68} height={24} rx={6} fill="#f1f5f9" stroke={INK} strokeOpacity={0.35} />
              <text x={42 + i * 72} y={26} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={INK}>
                {r}
              </text>
            </g>
          ))}
          <path d="M14 56h272l-40 30H54Z" fill="#f8fafc" stroke={INK} strokeOpacity={0.55} strokeWidth={1.5} />
          <text x={150} y={75} textAnchor="middle" fontSize={9} fill="#5a6b7d">
            মামাকে ঠিক ছবি দেয়?
          </text>
          {Array.from({ length: through }, (_, i) => {
            const x = 150 - (through * 56) / 2 + i * 56 + 4;
            return (
              k > i && (
                <g key={i} className={POP}>
                  <rect x={x} y={104} width={48} height={24} rx={6} fill="#fef3c7" stroke="#b45309" />
                  <text x={x + 24} y={121} textAnchor="middle" fontSize={14} fontWeight={700} fill="#b45309">
                    ?
                  </text>
                </g>
              )
            );
          })}
          {bet !== null && k >= 5 && (
            <g className={POP}>
              <circle cx={272} cy={124} r={15} fill="#be123c" />
              <text x={272} y={128} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">
                সিল
              </text>
            </g>
          )}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X1_BETS.map((b, i) => {
          const look: Look = bet === i ? "picked" : bet !== null ? "dim" : "idle";
          return (
            <Choice key={b} n={i} look={look} disabled={bet !== null} onClick={() => choose(i)}>
              <span className="flex flex-col items-center gap-1 text-center">
                {look !== "dim" && <SieveIcon n={X1_THROUGH[i]} />}
                <span className="text-xs leading-snug">{b}</span>
              </span>
            </Choice>
          );
        })}
      </div>
      <Task done={bet !== null && !play.running}>সামিনের কথা কি ঠিক? আপনার বাজি ধরুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1½ · A figure for screen 1's explanation, no task: what the number is for.
//      Two cards go into a box that only has a "?" on it; one number comes out
//      per film; the films stand on a line waiting to be ordered, with a "?".
//      Stops at the question.

export function TwoInOne() {
  const s = useScene(3, [600, 1500, 1800]);
  const k = s.k;
  const caps = [
    "ঢুকবে দুইটা card। মানুষের পছন্দ আর ছবির score।",
    "ভেতরে কোনো একটা rule।",
    "বের হবে একটা number। প্রতিটা ছবির জন্য একটা।",
    "তারপর ছবিগুলো লাইনে দাঁড়াবে। কে সামনে, কে পেছনে?",
  ];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <svg viewBox="0 0 260 130" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="দুইটা card একটা box-এ ঢুকছে, একটা number বের হচ্ছে, ছবিগুলো লাইনে দাঁড়াচ্ছে">
        <rect width={260} height={130} rx={10} fill="white" />
        <g style={{ transform: `translateX(${k >= 1 ? 30 : 0}px)` }} className="transition-transform duration-700 motion-reduce:transition-none">
          <CastCard x={36} y={26} text="(2, 5)" tone="blue" />
          <CastCard x={36} y={52} text="(5, 2)" tone="coral" />
        </g>
        <rect x={96} y={20} width={60} height={40} rx={7} fill="#1f2937" />
        <text x={126} y={46} textAnchor="middle" fontSize={16} fontWeight={700} fill="#fde68a">
          ?
        </text>
        {k >= 2 && (
          <g className={POP}>
            <rect x={176} y={28} width={40} height={24} rx={6} fill="#fef3c7" stroke="#b45309" />
            <text x={196} y={45} textAnchor="middle" fontSize={11} fontWeight={700} fill="#b45309">
              number
            </text>
          </g>
        )}
        <path d="M20 104h220" stroke={INK} strokeOpacity={0.5} strokeWidth={1.2} />
        {k >= 3 &&
          [
            { x: 90, c: FILM.titanic.color, n: "Titanic" },
            { x: 170, c: FILM.bean.color, n: "Mr. Bean" },
          ].map((f, i) => (
            <g key={f.n} className={POP} style={{ transitionDelay: `${i * 200}ms` }}>
              <S_Film x={f.x} y={100} w={18} h={20} color={f.c} />
              <text x={f.x} y={118} textAnchor="middle" fontSize={8} fill={INK}>
                {f.n}
              </text>
              <text x={f.x} y={74} textAnchor="middle" fontSize={12} fontWeight={700} fill="#b45309">
                ?
              </text>
            </g>
          ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 2 · The first try, নাসিবের: add up the film's own card. Serve মামা and
//     রিনা; the bars are the same both times (Titanic 7, Bean 5), so Titanic
//     glides to both. রিনা smiles, মামা doesn't.

const X2_X = { mama: 70, rina: 250 } as const;
type X2Who = keyof typeof X2_X;
const X2_TABLE = 160;

export function FilmOnly() {
  const pass = useGate();
  const [served, setServed] = useSeed<X2Who[]>("served", []);
  const [who, setWho] = useSeed<X2Who | null>("who", null);
  const play = usePlay(160);
  const run = (w: X2Who) => {
    if (play.running) return;
    setWho(w);
    const next = served.includes(w) ? served : [...served, w];
    play.play(9, () => {
      setServed(next);
      if (next.length === 2) pass("মানুষ বদলালো, ছবি বদলালো না।");
    });
  };
  const k = play.running ? play.k : who ? 9 : 0;
  const bars = who && k >= 2;
  const has = (w: X2Who) => served.includes(w) || (who === w && k >= 6);

  return (
    <>
      <div className={GROW}>
        <div className="mx-auto max-w-[21rem] overflow-hidden rounded-2xl ring-1 ring-black/10">
          <Stage backdrop="room" label="মামা আর রিনা; মাঝে টেবিলে Titanic আর Mr. Bean. rule যাকে ছবি দেয়, ছবিটা তার কাছে যায়।">
            <text x={X2_TABLE} y={40} textAnchor="middle" fontSize={10} fontWeight={600} fill={INK}>
              rule: ছবির card-এর দুই slot যোগ
            </text>
            <rect x={X2_TABLE - 30} y={S_Y - 22} width={60} height={4} rx={1} fill="#92400e" />
            <path d={`M${X2_TABLE - 26} ${S_Y - 18}V${S_Y}M${X2_TABLE + 26} ${S_Y - 18}V${S_Y}`} stroke="#92400e" strokeWidth={3} />
            <S_Film x={X2_TABLE + 14} y={S_Y - 22} w={18} h={20} color={FILM.bean.color} />
            <S_Film x={X2_TABLE - 14} y={S_Y - 22} w={18} h={20} color={FILM.titanic.color} />
            {(["mama", "rina"] as X2Who[]).map(
              (w) =>
                // a copy of Titanic glides from the table to whoever the rule serves
                (served.includes(w) || (who === w && play.running)) && (
                  <S_Carry key={w} x={has(w) ? X2_X[w] + (w === "mama" ? 22 : -22) : X2_TABLE - 14} y={has(w) ? S_Y - 26 : S_Y - 22} ms={900}>
                    <S_Film w={18} h={20} color={FILM.titanic.color} />
                  </S_Carry>
                ),
            )}
            <text x={X2_TABLE - 14} y={S_Y - 46} textAnchor="middle" fontSize={7} fill={INK}>
              Titanic
            </text>
            <text x={X2_TABLE + 14} y={S_Y - 46} textAnchor="middle" fontSize={7} fill={INK}>
              Bean
            </text>
            <Person who="mama" x={X2_X.mama} y={S_Y} mood={has("mama") && k >= 8 ? "sad" : "plain"} arm={has("mama") ? "hold" : "down"} label />
            <Person who="rina" x={X2_X.rina} y={S_Y} facing={-1} mood={has("rina") && k >= 8 ? "happy" : "plain"} arm={has("rina") ? "hold" : "down"} label />
            <CastCard x={X2_X.mama} y={S_Y - 78} text="(2, 5)" tone="blue" />
            <CastCard x={X2_X.rina} y={S_Y - 78} text="(5, 1)" tone="coral" />
          </Stage>
        </div>
      </div>
      <div className="mx-auto mt-3 min-h-[3.4rem] max-w-[21rem]">
        {bars && (
          <div className={FADE}>
            <Bars
              rows={[
                { key: "t", name: "Titanic", n: k >= 3 ? 7 : 0, color: FILM.titanic.color },
                { key: "b", name: "Mr. Bean", n: k >= 3 ? 5 : 0, color: FILM.bean.color },
              ]}
              max={8}
            />
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-center gap-2">
        <button type="button" className={primaryBtn} disabled={play.running} onClick={() => run("mama")}>
          মামাকে ছবি দিন
        </button>
        <button type="button" className={primaryBtn} disabled={play.running} onClick={() => run("rina")}>
          রিনাকে দিন
        </button>
      </div>
      <Task done={served.length === 2}>নাসিবের rule দিয়ে মামা আর রিনা, দুইজনকেই একটা করে ছবি দিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the person's card never
//      went in. The box takes only the film's card; মামার card lies outside,
//      greyed; then an empty slot for it opens on the box: two cards needed.

export function OneCardOut() {
  const s = useScene(3, [600, 1500, 2000]);
  const k = s.k;
  const caps = [
    "নাসিবের rule-এ ঢুকেছে শুধু ছবির card।",
    "মামার card বাইরে পড়ে ছিল। যে-ই আসুক, number একই।",
    "তাই দরকার দুইটা ঢোকার পথ।",
    "একটা মানুষের card-এর জন্য, একটা ছবির জন্য।",
  ];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="rule-এর box-এ শুধু ছবির card ঢুকছে, মামার card বাইরে; তারপর দুইটা ঢোকার পথ">
        <rect width={240} height={110} rx={10} fill="white" />
        <rect x={100} y={30} width={60} height={46} rx={7} fill="#1f2937" />
        <text x={130} y={57} textAnchor="middle" fontSize={9} fill="#e2e8f0">
          rule
        </text>
        <CastCard x={52} y={k >= 3 ? 40 : 58} text="(5, 2)" tone="coral" />
        <path d="M78 58h20" stroke={INK} strokeOpacity={0.5} strokeWidth={1.2} className={k >= 3 ? "opacity-0" : ""} />
        <g className={`transition-[opacity,transform] duration-700 motion-reduce:transition-none ${k === 1 || k === 2 ? "opacity-40" : "opacity-100"}`} style={{ transform: `translate(${k >= 3 ? 0 : -8}px, ${k >= 3 ? 34 : 50}px)` }}>
          <CastCard x={52} y={40} text="(2, 5)" tone="blue" />
        </g>
        {k >= 2 && (
          <g className={POP}>
            <rect x={96} y={36} width={8} height={10} rx={2} fill="#fde68a" />
            <rect x={96} y={62} width={8} height={10} rx={2} fill="#fde68a" />
          </g>
        )}
        {k >= 3 && (
          <>
            <Draw d="M78 40h18" className="stroke-[#0f1b2d]" />
            <Draw d="M78 74h18" className="stroke-[#0f1b2d]" />
          </>
        )}
        <path d="M160 53h22" stroke={INK} strokeOpacity={0.5} strokeWidth={1.2} />
        <text x={200} y={57} textAnchor="middle" fontSize={11} fontWeight={700} fill="#b45309">
          {k >= 1 && k < 3 ? "7" : "?"}
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3a · A story scene for screen 3's setup, no task: সামিন goes up to the
//      board and adds মামার card in too, four numbers in a row.

export function SaminAdds({}: Story) {
  const s = useScene(3, [600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সামিন বোর্ডের কাছে গিয়ে চারটা number যোগ লিখলো, মামার দুইটা আর ছবির দুইটা।">
        <S_Window />
        <S_Board>
          {k >= 2 && (
            <S_Chalk x={71} y={60} size={11} mono>
              2 + 5 + 5 + 2
            </S_Chalk>
          )}
          {k >= 2 && (
            <S_Chalk x={71} y={80} size={6.5}>
              মামা + Titanic
            </S_Chalk>
          )}
        </S_Board>
        <S_Table x={262} />
        <Person who="nasib" x={196} y={S_Y} facing={-1} mood={k >= 3 ? "puzzled" : "plain"} label />
        <Person who="samin" x={k >= 1 ? 142 : 276} y={S_Y} facing={-1} walking={k === 1} ms={1400} arm={k >= 2 ? "point" : "down"} mood="smug" label />
        {k >= 3 && <Bubble x={142} y={S_Y - 66} side="right" lines={["মানুষের card-ও", "যোগ করে দে। সোজা।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 3 · সামিনের rule: add all four numbers. The reader dials মামার card any
//     way they like; both bars rise and fall together and the gap between
//     them, a bracket, stays 2. The order never changes.

export function AddTaste() {
  const pass = useGate();
  const [t, setT] = useSeed<[number, number]>("t", [MAMA[0], MAMA[1]]);
  const [moves, setMoves] = useSeed("moves", 0);
  const sum = t[0] + t[1];
  const T = sum + 7;
  const B = sum + 5;
  const MAX = 26;
  const set = (i: 0 | 1, n: number) => {
    const next: [number, number] = i === 0 ? [n, t[1]] : [t[0], n];
    setT(next);
    const m = moves + 1;
    setMoves(m);
    if (m === 4) pass("যা-ই যোগ করি, সবাই সমান বাড়ে।");
  };
  const [bw, tw] = useTween([(B / MAX) * 100, (T / MAX) * 100], 600);

  return (
    <>
      <div className="mx-auto max-w-[21rem]">
        <div className="flex items-center justify-center gap-3">
          <div className="text-sm text-muted">মামার card</div>
          <div className="font-mono text-lg font-bold text-cat-blue">
            <Tup v={t} of={SLOTS} />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <div>
            <div className="text-xs text-muted">drama কতটা চান</div>
            <Stepper value={t[0]} min={0} max={9} label="drama" onChange={(n) => set(0, n)} />
          </div>
          <div>
            <div className="text-xs text-muted">comedy কতটা চান</div>
            <Stepper value={t[1]} min={0} max={9} label="comedy" onChange={(n) => set(1, n)} />
          </div>
        </div>
        <div className={`mt-4 rounded-xl bg-white p-3 ${GROW}`}>
          <svg viewBox="0 0 300 92" className="h-auto w-full" role="img" aria-label={`Titanic ${T}, Mr. Bean ${B}; ব্যবধান সবসময় 2`}>
            <text x={2} y={24} fontSize={10} fill={INK}>
              Titanic
            </text>
            <text x={2} y={58} fontSize={10} fill={INK}>
              Mr. Bean
            </text>
            <rect x={56} y={12} width={(tw / 100) * 230} height={18} rx={3} fill={FILM.titanic.color} />
            <rect x={56} y={46} width={(bw / 100) * 230} height={18} rx={3} fill={FILM.bean.color} />
            <text x={60 + (tw / 100) * 230} y={25} fontSize={10} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK}>
              {T}
            </text>
            <text x={60 + (bw / 100) * 230} y={59} fontSize={10} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK}>
              {B}
            </text>
            <path
              d={`M${56 + (bw / 100) * 230} 72v6h${((tw - bw) / 100) * 230}v-6`}
              fill="none"
              stroke="#be123c"
              strokeWidth={1.4}
            />
            <text x={56 + ((bw + tw) / 200) * 230} y={90} textAnchor="middle" fontSize={9} fontWeight={700} fill="#be123c">
              Bean পিছিয়ে 2
            </text>
          </svg>
        </div>
        <div className="mt-2 text-center text-sm text-muted">rule: মামার দুই number + ছবির দুই number</div>
      </div>
      <Task done={moves >= 4}>মামার card যেমন খুশি বদলান, চারবার। কোনোভাবে Bean-কে সামনে আনা যায়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: two people, one order.
//      মামার bars (14, 12), then রিনার (13, 11): whoever asks, Titanic stands
//      2 ahead. The person's numbers sit beside the film's, never mixing.

export function SameOrder() {
  const s = useScene(3, [600, 1500, 2000]);
  const k = s.k;
  const caps = [
    "মামার জন্য: Titanic 14, Bean 12.",
    "রিনার জন্য: Titanic 13, Bean 11.",
    "মানুষ বদলালো, ছবির order বদলালো না।",
    "মানুষের number শুধু পাশে বসে থাকে, সবার ঘাড়ে সমান।",
  ];
  const rows = (who: string, x: number, t: V, on: boolean) => {
    const add = t[0] + t[1];
    return (
      <g className={`transition-opacity duration-500 motion-reduce:transition-none ${on ? "opacity-100" : "opacity-0"}`}>
        <text x={x + 50} y={14} textAnchor="middle" fontSize={9} fontWeight={600} fill={INK}>
          {who}
        </text>
        {[
          { f: 7, c: FILM.titanic.color, y: 22 },
          { f: 5, c: FILM.bean.color, y: 46 },
        ].map((r) => (
          <g key={r.y}>
            <rect x={x} y={r.y} width={add * 5} height={16} fill="#cbd5e1" />
            <rect x={x + add * 5} y={r.y} width={r.f * 5} height={16} fill={r.c} />
            <text x={x + (add + r.f) * 5 + 3} y={r.y + 12} fontSize={8.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK}>
              {add + r.f}
            </text>
          </g>
        ))}
        {k >= 3 && <path d={`M${x + (add + 5) * 5} 66v4h10v-4`} fill="none" stroke="#be123c" strokeWidth={1.2} className={FADE} />}
      </g>
    );
  };
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <svg viewBox="0 0 250 80" className="mx-auto h-auto w-full max-w-[16rem]" role="img" aria-label="মামা আর রিনা, দুইজনের জন্যই Titanic 2 এগিয়ে; ধূসর অংশটা মানুষের number">
        <rect width={250} height={80} rx={8} fill="white" />
        {rows("মামা (2, 5)", 8, MAMA, true)}
        {rows("রিনা (5, 1)", 128, RINA, k >= 1)}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4a · A story scene for screen 4's setup, no task: সামিন isn't done. He
//      rubs out his sum and writes a division: film ÷ taste, slot by slot.

export function SaminDivides({}: Story) {
  const s = useScene(3, [600, 1600, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="সামিন যোগটা মুছে ভাগ লিখলো: ছবির drama ভাগ মামার drama, ছবির comedy ভাগ মামার comedy।">
        <S_Window />
        <S_Board>
          {k === 0 && (
            <text x={71} y={62} textAnchor="middle" fontSize={11} fontFamily="ui-monospace, monospace" fill="#f8fafc" opacity={0.3}>
              2 + 5 + 5 + 2
            </text>
          )}
          {k >= 1 && (
            <S_Chalk x={71} y={58} size={11} mono>
              5 ÷ 2 + 2 ÷ 5
            </S_Chalk>
          )}
          {k >= 2 && (
            <S_Chalk x={71} y={78} size={6.5}>
              ছবির ঘর ÷ মামার ঘর
            </S_Chalk>
          )}
        </S_Board>
        <Person who="samin" x={146} y={S_Y} facing={-1} arm={k >= 1 ? "point" : "down"} mood="smug" label />
        <Person who="nasib" x={200} y={S_Y} facing={-1} mood={k >= 3 ? "puzzled" : "plain"} label />
        <Person who="rina" x={270} y={S_Y} facing={-1} label />
        {k >= 3 && <Bubble x={146} y={S_Y - 66} side="right" lines={["তাহলে ভাগ।", "drama ভাগ drama."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 4 · সামিনের second rule: film ÷ taste, slot by slot, then add. The reader
//     turns up মামার comedy and watches Bean's bar sink; then sets drama to 0
//     and both bars shoot off the end, striped red: ∞.

export function DivideKnob() {
  const pass = useGate();
  const [t, setT] = useSeed<[number, number]>("t", [MAMA[0], MAMA[1]]);
  const [raised, setRaised] = useSeed("raised", false);
  const [zeroed, setZeroed] = useSeed("zeroed", false);
  const f = (film: V) => (t[0] === 0 ? Infinity : film[0] / t[0]) + film[1] / t[1];
  const set = (i: 0 | 1, n: number) => {
    const next: [number, number] = i === 0 ? [n, t[1]] : [t[0], n];
    setT(next);
    const r = raised || next[1] >= 7;
    const z = zeroed || next[0] === 0;
    setRaised(r);
    setZeroed(z);
    if (r && z && !(raised && zeroed)) pass("ভাগে চাওয়া বাড়লে number কমে।");
  };
  const T = f(TITANIC);
  const B = f(BEAN);

  return (
    <>
      <div className="mx-auto max-w-[21rem]">
        <div className="flex items-center justify-center gap-3">
          <div className="text-sm text-muted">মামার card</div>
          <div className="font-mono text-lg font-bold text-cat-blue">
            <Tup v={t} of={SLOTS} />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <div>
            <div className="text-xs text-muted">drama কতটা চান</div>
            <Stepper value={t[0]} min={0} max={6} label="drama" onChange={(n) => set(0, n)} />
          </div>
          <div>
            <div className="text-xs text-muted">comedy কতটা চান</div>
            <Stepper value={t[1]} min={1} max={8} label="comedy" onChange={(n) => set(1, n)} />
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-border p-3">
          <Bars
            rows={[
              { key: "t", name: "Titanic", n: T, color: FILM.titanic.color },
              { key: "b", name: "Mr. Bean", n: B, color: FILM.bean.color },
            ]}
            max={7}
          />
          <div className="mt-2 min-h-5 text-center text-sm">
            {t[0] === 0 ? (
              <span key="z" className={`${FADE} font-semibold text-danger`}>0 দিয়ে ভাগ! হিসাব ভেঙে গেলো।</span>
            ) : (
              <span className="text-muted">rule: ছবির ঘর ÷ মামার ঘর, তারপর যোগ</span>
            )}
          </div>
        </div>
      </div>
      <Ticks
        items={[
          ["comedy-র চাওয়া বাড়ান, 7 পর্যন্ত", raised],
          ["drama-র চাওয়া 0 করুন", zeroed],
        ]}
      />
      <Task done={raised && zeroed}>মামা comedy আরো বেশি চাইলে Bean-এর bar কোন দিকে যায়? তারপর drama-র চাওয়া 0 করে দেখুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: the other way round,
//      taste ÷ film, is no better. মামার comedy 5 ÷ a film's comedy: 2 gives
//      2.5, 5 gives 1, 8 gives 0.63. The funnier the film, the shorter its
//      bar; and a film with no comedy at all breaks it.

const X4_FILMS = [2, 5, 8];

export function FunnierLoses() {
  const s = useScene(4, [600, 1300, 1300, 1800]);
  const k = s.k;
  const caps = [
    "উল্টা দিক থেকে: মামার comedy 5, ভাগ ছবির comedy দিয়ে।",
    "ছবিতে comedy 2: পেলো 2.5.",
    "comedy 5: পেলো 1.",
    "comedy 8, সবচেয়ে হাসির ছবি: পেলো মাত্র 0.63.",
    "যে ছবিতে হাসি যত বেশি, সে তত পিছিয়ে।",
  ];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <div className="mx-auto max-w-[15rem] space-y-1.5 rounded-xl bg-white p-3">
        {X4_FILMS.map((c, i) => {
          const n = 5 / c;
          const on = k > i;
          return (
            <div key={c} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-right text-xs" style={{ color: INK }}>
                comedy <b className="font-mono">{c}</b>
              </span>
              <div className="relative h-4 flex-1 rounded" style={{ backgroundColor: "#f1f5f9" }}>
                <div
                  className="h-full rounded transition-[width] duration-700 ease-out motion-reduce:transition-none"
                  style={{ width: on ? `${(n / 2.6) * 100}%` : "0%", backgroundColor: SLOT_INK[1].stroke }}
                />
              </div>
              <span className="w-9 shrink-0 font-mono text-xs" style={{ color: INK }}>
                {on ? sh(n) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: রিনা, quiet till now,
//      walks to the board and writes her two wishes for one slot.

export function RinaWishes({}: Story) {
  const s = useScene(3, [600, 1600, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="রিনা বোর্ডে এক slot-এর দুইটা শর্ত লিখলো: দুইটাই বাড়লে বাড়বে, একটা 0 হলে 0।">
        <S_Window />
        <S_Board>
          {k >= 2 && (
            <S_Chalk x={71} y={52} size={7.5}>
              কতটা চাই, কতটা আছে
            </S_Chalk>
          )}
          {k >= 2 && (
            <S_Chalk x={71} y={68} size={7.5}>
              দুইটাই বাড়লে, বাড়বে
            </S_Chalk>
          )}
          {k >= 3 && (
            <S_Chalk x={71} y={84} size={7.5}>
              একটা 0 হলে, 0
            </S_Chalk>
          )}
        </S_Board>
        <Person who="samin" x={200} y={S_Y} facing={-1} label />
        <Person who="nasib" x={250} y={S_Y} facing={-1} label />
        <Person who="rina" x={k >= 1 ? 146 : 296} y={S_Y} facing={-1} walking={k === 1} ms={1400} arm={k >= 2 ? "point" : "down"} label />
        {k >= 1 && <Bubble x={k >= 1 ? 146 : 296} y={S_Y - 66} side="right" lines={["একটা slot", "ধরে ভাবো।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · A slot as a খোপ. On a sheet, the film's comedy runs across and মামার
//     comedy up; the খোপ is that many squares wide and tall, and the squares
//     pop in and out as the sides change. Three ticks: make it vanish, double
//     the film's side, double both. The count is the squares, not a sum.

const X5_U = 16;
const X5_OX = 34;
const X5_OY = 124;

export function PatchPlay() {
  const pass = useGate();
  const [has, setHas] = useSeed("has", 2);
  const [want, setWant] = useSeed("want", 3);
  const [done, setDone] = useSeed<[boolean, boolean, boolean]>("done", [false, false, false]);
  const [ow, oh] = useTween([has * X5_U, want * X5_U], 400);
  const n = has * want;
  const update = (h: number, w: number) => {
    setHas(h);
    setWant(w);
    const d: [boolean, boolean, boolean] = [done[0] || h * w === 0, done[1] || (h === 4 && w === 3), done[2] || (h === 4 && w === 6)];
    setDone(d);
    if (d.every(Boolean) && !done.every(Boolean)) pass("দুইটাই বাড়লে বাড়ে, একটা 0 হলেই 0।");
  };

  return (
    <>
      <div className={GROW}>
        <svg viewBox="0 0 200 150" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label={`comedy-র খোপ: ${has} square চওড়া, ${want} square উঁচু, মোট ${n} square`}>
          <rect width={200} height={150} rx={10} fill="white" />
          {Array.from({ length: 9 }, (_, i) => (
            <path key={`v${i}`} d={`M${X5_OX + i * X5_U} ${X5_OY}v${-6 * X5_U}`} stroke={INK} strokeOpacity={0.08} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <path key={`h${i}`} d={`M${X5_OX} ${X5_OY - i * X5_U}h${8 * X5_U}`} stroke={INK} strokeOpacity={0.08} />
          ))}
          <Patch x={X5_OX} y={X5_OY} w={has} h={want} u={X5_U} slot={1} />
          <rect x={X5_OX} y={X5_OY - oh} width={ow} height={oh} fill="none" stroke={SLOT_INK[1].stroke} strokeWidth={2} />
          <path d={`M${X5_OX} ${X5_OY}h${8 * X5_U + 4}M${X5_OX} ${X5_OY}v${-6 * X5_U - 4}`} stroke={INK} strokeWidth={1.2} />
          <text x={X5_OX + 4 * X5_U} y={X5_OY + 16} textAnchor="middle" fontSize={9} fill={INK}>
            ছবিতে comedy কতটা আছে →
          </text>
          <text x={16} y={X5_OY - 3 * X5_U} textAnchor="middle" fontSize={9} fill={INK} transform={`rotate(-90 16 ${X5_OY - 3 * X5_U})`}>
            মামা কতটা চান →
          </text>
          <text x={X5_OX + 8 * X5_U + 10} y={24} textAnchor="end" fontSize={14} fontWeight={700} fontFamily="ui-monospace, monospace" fill={SLOT_INK[1].stroke}>
            {n}
          </text>
          <text x={X5_OX + 8 * X5_U + 10} y={36} textAnchor="end" fontSize={8} fill={INK}>
            square
          </text>
        </svg>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-xs text-muted">ছবিতে comedy আছে</div>
          <Stepper value={has} min={0} max={8} label="ছবিতে comedy" onChange={(h) => update(h, want)} />
        </div>
        <div>
          <div className="text-xs text-muted">মামা comedy চান</div>
          <Stepper value={want} min={0} max={6} label="মামার চাওয়া" onChange={(w) => update(has, w)} />
        </div>
      </div>
      <Ticks
        items={[
          ["খোপ 0 করুন", done[0]],
          ["ছবির comedy 4 করুন", done[1]],
          ["তারপর মামার চাওয়াও দ্বিগুণ", done[2]],
        ]}
      />
      <Task done={done.every(Boolean)}>রিনার দুইটা শর্ত খোপে খাটে কি না দেখুন: খোপ গায়েব করুন, তারপর একটা একটা করে side দ্বিগুণ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: গুণ against যোগ when
//      someone wants none of it. রিনা wants comedy 0; the film has 4. The
//      গুণ খোপ is 4 wide and 0 tall, nothing; the যোগ strip still counts 4.

export function AddVsTimes() {
  const s = useScene(3, [600, 1500, 1800]);
  const k = s.k;
  const caps = [
    "ধরেন কেউ comedy একদম চান না, 0। ছবিতে comedy 4.",
    "গুণ: 4 চওড়া, 0 উঁচু। খোপই নাই, 0 square।",
    "যোগ: 0 + 4, তবু 4 পেয়ে গেলো।",
    "যা চান না, যোগে তার জন্যও number আসে। গুণে আসে না।",
  ];
  const U = 14;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <svg viewBox="0 0 240 90" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="গুণে খোপ 0, যোগে 4 square থেকে যায়">
        <rect width={240} height={90} rx={10} fill="white" />
        <text x={60} y={16} textAnchor="middle" fontSize={10} fontWeight={700} fill={INK}>
          গুণ
        </text>
        <text x={180} y={16} textAnchor="middle" fontSize={10} fontWeight={700} fill={INK}>
          যোগ
        </text>
        <path d="M120 22v60" stroke={INK} strokeOpacity={0.15} />
        {k >= 1 && (
          <g className={FADE}>
            <path d={`M32 70h${4 * U}`} stroke={SLOT_INK[1].stroke} strokeWidth={2} strokeDasharray="3 2" />
            <text x={60} y={58} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK}>
              0
            </text>
          </g>
        )}
        {k >= 2 && (
          <>
            <Patch x={152} y={70} w={4} h={1} u={U} slot={1} />
            <text x={180} y={46} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK} className={FADE}>
              4
            </text>
          </>
        )}
        {k >= 3 && <CrossMark x={210} y={30} s={0.9} />}
        {k >= 3 && <TickMark x={92} y={30} s={0.9} />}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6a · A story scene for screen 6's setup, no task: two cards on the board,
//      and সামিন runs the chalk across them, a cross.

export function SaminWires({}: Story) {
  const s = useScene(3, [600, 1500, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="বোর্ডে মামার card আর ছবির card পাশাপাশি। সামিন চক দিয়ে আড়াআড়ি দাগ টানলো।">
        <S_Window />
        <S_Board>
          <S_Chalk x={36} y={50} size={9} mono>
            2
          </S_Chalk>
          <S_Chalk x={36} y={78} size={9} mono>
            5
          </S_Chalk>
          <S_Chalk x={106} y={50} size={9} mono>
            5
          </S_Chalk>
          <S_Chalk x={106} y={78} size={9} mono>
            2
          </S_Chalk>
          <S_Chalk x={36} y={40} size={5.5}>
            মামা
          </S_Chalk>
          <S_Chalk x={106} y={40} size={5.5}>
            Titanic
          </S_Chalk>
          {k === 1 && (
            <>
              <Draw d="M44 47H98" className="stroke-[#f8fafc]" />
              <Draw d="M44 75H98" className="stroke-[#f8fafc]" delay={300} />
            </>
          )}
          {k >= 2 && (
            <>
              <Draw d="M44 47L98 75" className="stroke-[#fde68a]" />
              <Draw d="M44 75L98 47" className="stroke-[#fde68a]" delay={300} />
            </>
          )}
        </S_Board>
        <Person who="nasib" x={150} y={S_Y} facing={-1} arm={k === 1 ? "point" : "down"} label />
        <Person who="samin" x={206} y={S_Y} facing={-1} arm={k >= 2 ? "point" : "down"} mood="smug" label />
        <Person who="rina" x={262} y={S_Y} facing={-1} label />
        {k >= 3 && <Bubble x={206} y={S_Y - 66} lines={["আড়াআড়ি দিলে", "কী সমস্যা?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 6 · Which slot with which. Three wirings, drawn: crossed, straight, all to
//     all. The pick draws its wires between মামার card and both films' cards,
//     then the two bars grow, no numbers yet (screen 8 earns them). Crossed
//     and all-to-all hand মামা Titanic; straight hands him Bean.

const X6_WIRES: [number, number][][] = [
  [
    [0, 1],
    [1, 0],
  ],
  [
    [0, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ],
];
const X6_NAMES = ["আড়াআড়ি", "সোজা", "সবাই সবার সাথে"];
const X6_RIGHT = 1;
const X6_NOPE = [
  "Titanic অনেক এগিয়ে গেলো। মামার comedy-র 5 গুণ হলো Titanic-এর drama-র 5-এর সাথে। হাসি চাওয়ার number ঢুকে গেলো কান্নার ঘরে।",
  "",
  "আবার Titanic। সবার সাথে সবাই মানে আগে দুই card-এর সব যোগ, তারপর গুণ। তখন ছবির card-এর total-ই সব ঠিক করে, ঠিক প্রথম চেষ্টার মতো।",
];
const wired = (w: [number, number][], t: V, f: V) => w.reduce((s, [a, b]) => s + t[a] * f[b], 0);

function WireIcon({ w }: { w: [number, number][] }) {
  return (
    <svg viewBox="0 0 60 40" className="h-auto w-full max-w-[3.8rem]" aria-hidden="true">
      {[0, 1].map((i) => (
        <g key={i}>
          <circle cx={10} cy={10 + i * 20} r={5} fill={SLOT_INK[i].fill} stroke={SLOT_INK[i].stroke} />
          <circle cx={50} cy={10 + i * 20} r={5} fill={SLOT_INK[i].fill} stroke={SLOT_INK[i].stroke} />
        </g>
      ))}
      {w.map(([a, b]) => (
        <path key={`${a}${b}`} d={`M15 ${10 + a * 20}L45 ${10 + b * 20}`} stroke={INK} strokeWidth={1.6} />
      ))}
    </svg>
  );
}

export function WirePick() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(220);
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    play.play(8, () => (i === X6_RIGHT ? pass("drama-র সাথে drama, comedy-র সাথে comedy.") : setMiss((m) => m + 1)));
  };
  const k = pick === null ? 0 : play.running ? play.k : 8;
  const w = pick === null ? [] : X6_WIRES[pick];
  const T = pick === null ? 0 : wired(w, MAMA, TITANIC);
  const B = pick === null ? 0 : wired(w, MAMA, BEAN);
  const settled = pick !== null && !play.running;
  // three cards across: Titanic, মামা, Bean; each slot a dot
  const CX = { titanic: 40, mama: 150, bean: 260 };
  const slotY = (i: number) => 40 + i * 30;

  return (
    <>
      <div className={GROW}>
        <svg viewBox="0 0 300 100" className="mx-auto h-auto w-full max-w-[19rem]" role="img" aria-label="মামার card-এর দুই slot থেকে Titanic আর Bean-এর slot-এ তার">
          <rect width={300} height={100} rx={10} fill="white" />
          {(
            [
              ["titanic", "Titanic", TITANIC],
              ["mama", "মামা", MAMA],
              ["bean", "Mr. Bean", BEAN],
            ] as const
          ).map(([key, name, v]) => (
            <g key={key}>
              <text x={CX[key]} y={18} textAnchor="middle" fontSize={9} fontWeight={600} fill={key === "mama" ? "#1d4ed8" : FILM[key].color}>
                {name}
              </text>
              {[0, 1].map((i) => (
                <g key={i}>
                  <rect x={CX[key] - 15} y={slotY(i) - 11} width={30} height={22} rx={5} fill={SLOT_INK[i].fill} stroke={SLOT_INK[i].stroke} />
                  <text x={CX[key]} y={slotY(i) + 4} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK}>
                    {v[i]}
                  </text>
                </g>
              ))}
            </g>
          ))}
          {pick !== null &&
            w.map(([a, b], j) => (
              <g key={`${pick}-${a}${b}`}>
                <Draw d={`M${CX.mama - 16} ${slotY(a)}L${CX.titanic + 16} ${slotY(b)}`} className="stroke-[#0f1b2d]" delay={j * 200} />
                <Draw d={`M${CX.mama + 16} ${slotY(a)}L${CX.bean - 16} ${slotY(b)}`} className="stroke-[#0f1b2d]" delay={j * 200} />
              </g>
            ))}
        </svg>
      </div>
      <div className="mx-auto mt-2 min-h-[3.4rem] max-w-[19rem]">
        <Bars
          rows={[
            { key: "t", name: "Titanic", n: k >= 4 ? T : 0, color: FILM.titanic.color },
            { key: "b", name: "Mr. Bean", n: k >= 4 ? B : 0, color: FILM.bean.color },
          ]}
          max={50}
          numbers={false}
        />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X6_WIRES.map((wi, i) => {
          const look: Look = settled && pick === i ? (i === X6_RIGHT ? "right" : "wrong") : "idle";
          return (
            <Choice key={i} n={i} look={look} disabled={play.running || (settled && pick === X6_RIGHT)} onClick={() => choose(i)}>
              <span className="flex flex-col items-center gap-0.5 text-center">
                <WireIcon w={wi} />
                <span className="text-xs">{X6_NAMES[i]}</span>
              </span>
            </Choice>
          );
        })}
      </div>
      {settled && pick !== X6_RIGHT && pick !== null && <Nope key={miss}>{X6_NOPE[pick]}</Nope>}
      <Task done={settled && pick === X6_RIGHT}>কোন তার লাগালে comedy-পাগল মামা Mr. Bean পান? একটা বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: why a crossed pair means
//      nothing. মামার comedy 5 wired to Titanic's drama 5: "হাসি চাই × কান্না
//      আছে", crossed out; then the straight wire, "হাসি চাই × হাসি আছে".

export function NonsensePair() {
  const s = useScene(3, [600, 1600, 1800]);
  const k = s.k;
  const caps = [
    "মামার comedy-র 5 আর Titanic-এর drama-র 5।",
    "মামা হাসতে চান, আর ছবিতে কান্না আছে। এদের গুণ করে কী মাপলাম?",
    "কিছুই না। এই জোড়ার কোনো মানে নাই।",
    "মানে আছে একই slot-এর জোড়ায়। হাসি চাই, হাসি আছে।",
  ];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <svg viewBox="0 0 240 96" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="মামার comedy থেকে Titanic-এর drama-য় একটা তার কেটে দেওয়া হলো; সোজা তার থাকলো">
        <rect width={240} height={96} rx={10} fill="white" />
        <text x={50} y={16} textAnchor="middle" fontSize={9} fontWeight={600} fill="#1d4ed8">
          মামা
        </text>
        <text x={190} y={16} textAnchor="middle" fontSize={9} fontWeight={600} fill={FILM.titanic.color}>
          Titanic
        </text>
        {[0, 1].map((i) => (
          <g key={i}>
            <rect x={20} y={26 + i * 34} width={60} height={24} rx={5} fill={SLOT_INK[i].fill} stroke={SLOT_INK[i].stroke} />
            <text x={50} y={42 + i * 34} textAnchor="middle" fontSize={8.5} fill={INK}>
              {i === 0 ? "কান্না চাই 2" : "হাসি চাই 5"}
            </text>
            <rect x={160} y={26 + i * 34} width={60} height={24} rx={5} fill={SLOT_INK[i].fill} stroke={SLOT_INK[i].stroke} />
            <text x={190} y={42 + i * 34} textAnchor="middle" fontSize={8.5} fill={INK}>
              {i === 0 ? "কান্না আছে 5" : "হাসি আছে 2"}
            </text>
          </g>
        ))}
        {k >= 1 && k < 3 && <Draw d="M80 72L160 38" className="stroke-[#be123c]" strokeWidth={2} />}
        {k === 2 && <CrossMark x={120} y={55} s={1.1} />}
        {k >= 3 && <Draw d="M80 72H160" className="stroke-[#16a34a]" strokeWidth={2} />}
        {k >= 3 && <Draw d="M80 38H160" className="stroke-[#16a34a]" strokeWidth={2} delay={250} />}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: রিনা digs in the club's
//      box of films and holds up an old one, ভানু পেল লটারি, card (0, 6).

export function BhanuBox({}: Story) {
  const s = useScene(3, [600, 1500, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="রিনা বাক্স থেকে একটা পুরানো ছবি বের করলো, ভানু পেল লটারি, card (0, 6)।">
        <S_Window />
        <S_Board>
          <S_Chalk x={71} y={66} size={8.5}>
            খোপ দুইটা মেলাবো কীভাবে?
          </S_Chalk>
        </S_Board>
        <rect x={176} y={S_Y - 26} width={40} height={26} rx={2} fill="#a16207" stroke={INK} strokeOpacity={0.3} />
        <path d="M176 124h40" stroke="#78350f" strokeWidth={2} />
        <Person who="nasib" x={146} y={S_Y} label />
        <Person who="rina" x={240} y={S_Y} facing={-1} arm={k >= 2 ? "hold" : "down"} label />
        <S_Carry x={k >= 2 ? 222 : 196} y={k >= 2 ? S_Y - 28 : S_Y - 8} ms={1000}>
          <S_Film w={18} h={22} color={FILM.bhanu.color} />
        </S_Carry>
        {k >= 2 && <CastCard x={280} y={S_Y - 50} text="(0, 6)" tone="blue" />}
        {k >= 3 && <Bubble x={240} y={S_Y - 66} side="left" lines={["পুরা comedy.", "drama একফোঁটাও নাই।"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · Two খোপ per film; how do they combine? For মামা, Bean's খোপ-গুলো are
//     2 and 20 squares, ভানু's 0 and 30. যোগ piles them (22 against 30),
//     গুণ lets ভানু's empty drama খোপ wipe out the whole film (40 against
//     0), ভাগ leaves both near nothing. Only যোগ puts the pure comedy first.

const X7_OPS = ["গুণ", "যোগ", "ভাগ"];
const X7_RIGHT = 1;
const X7_NOPE = [
  "ভানু নেমে গেলো 0-তে। তার drama-র খোপ 0, আর 0 দিয়ে গুণ করলে সবই 0। খাঁটি comedy-টাই comedy-পাগল মামা পেলেন না।",
  "",
  "দুইজনই প্রায় 0। drama-র খোপ ভাগ comedy-র খোপ: comedy যত বড়, number তত ছোট। মামার বেলায় ঠিক উল্টা।",
];
const X7_OP = [(a: number, b: number) => a * b, (a: number, b: number) => a + b, (a: number, b: number) => (b === 0 ? 0 : a / b)];
const X7_ICONS = ["×", "+", "÷"];

export function PileOrMultiply() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(200);
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    play.play(8, () => (i === X7_RIGHT ? pass("খোপগুলো জমা, মানে যোগ।") : setMiss((m) => m + 1)));
  };
  const settled = pick !== null && !play.running;
  const k = pick === null ? 0 : play.running ? play.k : 8;
  const films = [
    { key: "bean", f: BEAN },
    { key: "bhanu", f: BHANU },
  ] as const;
  const U = 7;

  return (
    <>
      <div className={GROW}>
        <svg viewBox="0 0 300 150" className="mx-auto h-auto w-full max-w-[19rem]" role="img" aria-label="মামার জন্য Bean আর ভানুর দুইটা করে খোপ, আর জোড়া লাগানোর পর number">
          <rect width={300} height={150} rx={10} fill="white" />
          {films.map(({ key, f }, row) => {
            const y = 66 + row * 72;
            const d = MAMA[0] * f[0];
            const c = MAMA[1] * f[1];
            const n = pick === null ? 0 : X7_OP[pick](d, c);
            const shrink = k >= 3;
            return (
              <g key={key}>
                <text x={8} y={y - 48} fontSize={9} fontWeight={700} fill={FILM[key].color}>
                  {FILM[key].name}
                </text>
                <g className="transition-opacity duration-500 motion-reduce:transition-none" opacity={shrink ? 0.25 : 1}>
                  {f[0] === 0 ? <path d={`M10 ${y}v${-MAMA[0] * U}`} stroke={SLOT_INK[0].stroke} strokeWidth={2} strokeDasharray="2 2" /> : <Patch x={10} y={y} w={f[0]} h={MAMA[0]} u={U} slot={0} pop={false} />}
                  <text x={20 + f[0] * U} y={y - 2} fontSize={8} fontFamily="ui-monospace, monospace" fill={INK}>
                    {d}
                  </text>
                  <Patch x={40} y={y} w={f[1]} h={MAMA[1]} u={U} slot={1} pop={false} />
                  <text x={44 + f[1] * U} y={y - 2} fontSize={8} fontFamily="ui-monospace, monospace" fill={INK}>
                    {c}
                  </text>
                </g>
                {k >= 2 && pick !== null && (
                  <text x={112} y={y - 12} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK} className={POP}>
                    {X7_ICONS[pick]}
                  </text>
                )}
                <rect x={130} y={y - 20} width={140} height={16} rx={3} fill="#f1f5f9" />
                <rect
                  x={130}
                  y={y - 20}
                  width={k >= 4 ? Math.min(140, (n / 42) * 140) : 0}
                  height={16}
                  rx={3}
                  fill={FILM[key].color}
                  className="transition-[width] duration-700 ease-out motion-reduce:transition-none"
                />
                {k >= 5 && (
                  <text x={276} y={y - 8} textAnchor="end" fontSize={10} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK} className={FADE}>
                    {sh(n)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {X7_OPS.map((o, i) => {
          const look: Look = settled && pick === i ? (i === X7_RIGHT ? "right" : "wrong") : "idle";
          return (
            <Choice key={o} n={i} look={look} disabled={play.running || (settled && pick === X7_RIGHT)} onClick={() => choose(i)}>
              <span className="text-sm">
                দুই খোপ <b>{o}</b>
              </span>
            </Choice>
          );
        })}
      </div>
      {settled && pick !== X7_RIGHT && pick !== null && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={settled && pick === X7_RIGHT}>প্রতিটা ছবির দুইটা খোপ মিলে একটা number হবে। কীভাবে মেলালে comedy-পাগল মামার জন্য ভানু সামনে থাকে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: খোপ-গুলো are all made
//      of squares, so they pile. হীরক রাজার দেশে for মামা: drama 8 squares,
//      comedy 25; they slide into one tower, 33.

export function SameSquares() {
  const s = useScene(3, [600, 1500, 1800]);
  const k = s.k;
  const caps = [
    "হীরক রাজার দেশে, মামার জন্য। drama-র খোপ 8 square, comedy-র 25.",
    "দুই খোপই square দিয়ে বানানো। তাই এক জায়গায় জমা করা যায়।",
    "একটা tower, 33 square.",
    "একটা slot খালি থাকলে? tower একটু ছোট হয়, গায়েব হয় না।",
  ];
  const U = 7;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <svg viewBox="0 0 240 100" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="হীরকের দুইটা খোপ জমা হয়ে 33 square-এর একটা tower">
        <rect width={240} height={100} rx={10} fill="white" />
        <g className="transition-opacity duration-700 motion-reduce:transition-none" opacity={k >= 2 ? 0.2 : 1}>
          <Patch x={12} y={88} w={4} h={2} u={U} slot={0} pop={false} />
          <Patch x={50} y={88} w={5} h={5} u={U} slot={1} pop={false} />
        </g>
        {k >= 1 && <Draw d="M100 60h40" className="stroke-[#0f1b2d]" />}
        {k >= 2 && <Tower x={150} y={88} drama={8} comedy={25} u={U} cols={6} />}
        {k >= 2 && (
          <text x={200} y={24} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK} className={FADE}>
            33
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8 · Your turn: the whole rule by hand, no hints on screen. মামা (2, 5),
//     Mr. Bean (1, 4). The reader sets each খোপ's two sides; "জমা করুন"
//     piles the squares into a tower, counting as it goes. Right: 22, the
//     number মামা saw at the fair. Crossed slots or wrong sides bounce.

const X8_U = 9;
const X8_TU = 8;

type Sides = [[number, number], [number, number]];

export function BuildBean() {
  const pass = useGate();
  const [sides, setSides] = useSeed<Sides>("sides", [
    [0, 0],
    [0, 0],
  ]);
  const [piled, setPiled] = useSeed("piled", false);
  const [miss, setMiss] = useState(0);
  const d = sides[0][0] * sides[0][1];
  const c = sides[1][0] * sides[1][1];
  const total = d + c;
  const play = usePlay(Math.max(28, Math.round(1300 / Math.max(1, total))));
  const same = (a: [number, number], b: V) => (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
  const right = same(sides[0], [BEAN[0], MAMA[0]]) && same(sides[1], [BEAN[1], MAMA[1]]);
  // a comedy number in the drama খোপ, or a drama number in the comedy one
  const crossed = sides[0].some((n) => n === MAMA[1] || n === BEAN[1]) || sides[1].some((n) => n === MAMA[0] || n === BEAN[0]);
  const set = (slot: 0 | 1, side: 0 | 1, n: number) => {
    const next: Sides = [[...sides[0]], [...sides[1]]];
    next[slot][side] = n;
    setSides(next);
    setPiled(false);
  };
  const pile = () => {
    if (play.running) return;
    setPiled(true);
    play.play(Math.max(1, total), () => (right ? pass("Bean পেলো 22। মেলার দিনের সেই number।") : setMiss((m) => m + 1)));
  };
  const shown = !piled ? 0 : play.running ? play.k : total;
  const settled = piled && !play.running;

  return (
    <>
      <div className="flex justify-center gap-2">
        <ListCard who="মামা চান" v={MAMA} />
        <ListCard who="Mr. Bean-এ আছে" v={BEAN} tone="border-cat-teal/40" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {([0, 1] as const).map((slot) => (
          <div key={slot} className="rounded-xl border border-border p-2 text-center">
            <div className={`text-sm font-semibold ${SLOT_INK[slot].text}`}>{SLOTS[slot]}-এর খোপ</div>
            <svg viewBox="0 0 64 64" className="mx-auto mt-1 h-auto w-full max-w-[4.5rem]" aria-label={`${sides[slot][0]} চওড়া, ${sides[slot][1]} উঁচু`}>
              <rect width={64} height={64} rx={4} fill="white" />
              <path d="M4 60h56M4 60V4" stroke={INK} strokeOpacity={0.4} />
              <Patch x={5} y={59} w={sides[slot][0]} h={sides[slot][1]} u={X8_U} slot={slot} />
            </svg>
            <div className="mt-1 text-[0.7rem] text-muted">চওড়া: ছবিতে আছে</div>
            <Stepper value={sides[slot][0]} min={0} max={6} label={`${SLOTS[slot]} চওড়া`} onChange={(n) => set(slot, 0, n)} disabled={play.running} />
            <div className="mt-1 text-[0.7rem] text-muted">উঁচু: মামা চান</div>
            <Stepper value={sides[slot][1]} min={0} max={6} label={`${SLOTS[slot]} উঁচু`} onChange={(n) => set(slot, 1, n)} disabled={play.running} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-end justify-center gap-3">
        <button type="button" className={primaryBtn} disabled={play.running || total === 0} onClick={pile}>
          জমা করুন
        </button>
        <svg viewBox="0 0 90 70" className="h-auto w-[5.6rem]" role="img" aria-label={`tower: ${shown} square`}>
          <rect width={90} height={70} rx={6} fill="white" />
          <Tower x={5} y={67} drama={d} comedy={c} u={X8_TU} shown={shown} cols={10} />
          {piled && (
            <text x={86} y={14} textAnchor="end" fontSize={12} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK}>
              {shown}
            </text>
          )}
        </svg>
      </div>
      {settled && !right && (
        <Nope key={miss}>
          {crossed
            ? `জমা হলো ${total}. খোপে অন্য slot-এর number ঢুকে গেছে। drama-র খোপ শুধু drama দিয়ে, comedy-র খোপ শুধু comedy দিয়ে।`
            : `জমা হলো ${total} square. card দুইটা আরেকবার দেখুন: কোন slot-এ মামা কত চান, Bean-এ কত আছে।`}
        </Nope>
      )}
      <Task done={settled && right}>মামার জন্য Mr. Bean-এর number বের করুন: দুইটা খোপ বানান, তারপর জমা করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: the fair's numbers. Bean's
//      tower (2 + 20) and Titanic's (10 + 10) rise side by side: 22 and 20,
//      the two numbers from 3.6, the black box open.

export function TwentyTwoAgain() {
  const s = useScene(3, [600, 1500, 1800]);
  const k = s.k;
  const caps = [
    "Mr. Bean, মামার জন্য: 2 আর 20, মোট 22।",
    "Titanic: 10 আর 10, মোট 20।",
    "মেলার দিন সকালে মামা ঠিক এই দুইটা number-ই দেখেছিলেন।",
    "সেই black box-এর ভেতরে এখন আর কিছু লুকানো নাই।",
  ];
  const U = 7;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <svg viewBox="0 0 200 90" className="mx-auto h-auto w-full max-w-[13rem]" role="img" aria-label="Bean-এর tower 22, Titanic-এর tower 20">
        <rect width={200} height={90} rx={10} fill="white" />
        <Tower x={30} y={70} drama={2} comedy={20} u={U} />
        {k >= 1 && <Tower x={130} y={70} drama={10} comedy={10} u={U} />}
        <text x={47} y={84} textAnchor="middle" fontSize={9} fontWeight={600} fill={FILM.bean.color}>
          Mr. Bean
        </text>
        {k >= 1 && (
          <text x={147} y={84} textAnchor="middle" fontSize={9} fontWeight={600} fill={FILM.titanic.color}>
            Titanic
          </text>
        )}
        {k >= 2 && (
          <g className={FADE}>
            <text x={47} y={30} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK}>
              22
            </text>
            <text x={147} y={30} textAnchor="middle" fontSize={13} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK}>
              20
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9a · A story scene for screen 9's setup, no task: নাসিব writes the rule out
//      in words on the board; the second half runs off the edge. সামিন asks
//      what happens with ten slots.

export function LongBoard({}: Story) {
  const s = useScene(3, [600, 1500, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="নাসিব বোর্ডে পুরা rule কথায় লিখলো, লাইনটা বোর্ড ছাড়িয়ে গেলো। সামিন জিজ্ঞেস করলো slot দশটা হলে কী হবে।">
        <S_Window />
        <S_Board w={128}>
          {k >= 1 && (
            <text x={18} y={54} fontSize={8} fontWeight={600} fill="#f8fafc" className={FADE}>
              মামার drama × ছবির drama
            </text>
          )}
          {k >= 2 && (
            <text x={18} y={74} fontSize={8} fontWeight={600} fill="#f8fafc" className={FADE}>
              + মামার comedy × ছবির comedy + …
            </text>
          )}
        </S_Board>
        <Person who="nasib" x={168} y={S_Y} facing={-1} arm={k >= 1 && k < 3 ? "point" : "down"} label />
        <Person who="samin" x={230} y={S_Y} facing={-1} mood={k >= 3 ? "smug" : "plain"} label />
        <Person who="rina" x={284} y={S_Y} facing={-1} label />
        {k >= 3 && <Bubble x={230} y={S_Y - 66} side="left" lines={["slot দশটা হলে?", "বোর্ডে ধরবে?"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 9 · Shorten the line. Each tap squeezes it: words → t₁ × f₁ + t₂ × f₂ →
//     t₁f₁ + … + tₙfₙ → Σ tᵢfᵢ → t ▢ f, with a length bar shrinking. Then
//     the reader picks the sign for the gap; each sign plays what it would
//     mean for মামা and Bean: × leaves the list (2, 20), + the card (3, 9),
//     and · the one number 22.

const X9_LINES = [
  "মামার drama × ছবির drama + মামার comedy × ছবির comedy",
  "t₁ × f₁ + t₂ × f₂",
  "t₁f₁ + t₂f₂ + … + tₙfₙ",
  "Σ tᵢfᵢ",
  "t ▢ f",
];
const X9_CAPS = [
  "বোর্ডের সেই লম্বা লাইন।",
  "মামার card-কে বলি t, taste। ছবির card-কে f, film। ছোট 1, 2 মানে কোন slot।",
  "পাশাপাশি বসালেই গুণ, চিহ্ন লাগে না। আর slot n-টা হলেও লাইন একটাই।",
  "Σ মানে সব যোগ। প্রতিটা slot i-তে গুণ, তারপর সব যোগ।",
  "আরো ছোট? শুধু দুইটা card, মাঝে একটা চিহ্ন। কোন চিহ্ন?",
];
const X9_SIGNS = ["×", "+", "·"];
const X9_RIGHT = 2;
const X9_NOPE = [
  "t × f দেখলে মনে হবে ঘরে ঘরে গুণ করে থেমে যাওয়া। হাতে থাকে list, number না। আমাদের rule থামে একটা number-এ।",
  "+ তো ঘরে ঘরে যোগ, 3.1-এর সেই কাজ। ফেরত আসে আরেকটা card।",
  "",
];

export function ShortenIt() {
  const pass = useGate();
  const [stage, setStage] = useSeed("stage", 0);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(300);
  const last = X9_LINES.length - 1;
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    play.play(4, () => (i === X9_RIGHT ? pass("মাঝের dot থেকেই নাম dot product।") : setMiss((m) => m + 1)));
  };
  const settled = pick !== null && !play.running;
  const k = pick === null ? 0 : play.running ? play.k : 4;
  const line = stage === last && pick !== null ? `t ${X9_SIGNS[pick]} f` : X9_LINES[stage];
  const bangla = /[ঀ-৿]/.test(line);
  const lenPct = (X9_LINES[stage].length / X9_LINES[0].length) * 100;

  return (
    <>
      <div className={`rounded-2xl p-4 ${GROW}`} style={{ backgroundColor: "#1f3d2e" }}>
        <div
          key={`${stage}-${pick}`}
          className={`${POP} min-h-[3.5rem] text-center font-semibold [transform-box:border-box] ${bangla ? "text-base" : "font-mono text-2xl"}`}
          style={{ color: "#f8fafc" }}
        >
          {line}
        </div>
        <div className="mx-auto mt-3 h-1.5 max-w-[16rem] rounded-full" style={{ backgroundColor: "rgba(255,255,255,.12)" }}>
          <div className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${lenPct}%`, backgroundColor: "#fde68a" }} />
        </div>
      </div>
      <div key={stage} className={`${FADE} mt-2 min-h-10 text-center text-sm text-muted`}>
        {X9_CAPS[stage]}
      </div>
      {stage < last ? (
        <div className="mt-2 flex justify-center">
          <button type="button" className={primaryBtn} onClick={() => setStage(stage + 1)}>
            আরো ছোট করুন
          </button>
        </div>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {X9_SIGNS.map((sg, i) => {
              const look: Look = settled && pick === i ? (i === X9_RIGHT ? "right" : "wrong") : "idle";
              return (
                <Choice key={sg} n={i} look={look} disabled={play.running || (settled && pick === X9_RIGHT)} onClick={() => choose(i)}>
                  <span className="font-mono text-lg font-bold whitespace-nowrap">t {sg} f</span>
                </Choice>
              );
            })}
          </div>
          <div className="mt-2 min-h-12 text-center">
            {pick !== null && k >= 2 && (
              <div key={pick} className={`${FADE} text-sm`}>
                <span className="text-muted">মামা আর Bean দিয়ে: </span>
                {pick === 0 && (
                  <span className="font-mono font-bold">
                    <Tup v={[2, 20]} of={SLOTS} /> <span className="font-sans font-normal text-danger">একটা list</span>
                  </span>
                )}
                {pick === 1 && (
                  <span className="font-mono font-bold">
                    <Tup v={[3, 9]} of={SLOTS} /> <span className="font-sans font-normal text-danger">আরেকটা card</span>
                  </span>
                )}
                {pick === 2 && (
                  <span className="font-mono font-bold">
                    2 + 20 = 22 <span className="font-sans font-normal text-accent-text">একটা number</span>
                  </span>
                )}
              </div>
            )}
          </div>
          {settled && pick !== X9_RIGHT && pick !== null && <Nope key={miss}>{X9_NOPE[pick]}</Nope>}
        </>
      )}
      <Task done={settled && pick === X9_RIGHT}>লাইনটা ছোট করতে থাকুন। শেষে দুই card-এর মাঝে একটা চিহ্ন বসান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for screen 9's explanation, no task: Yale, 1881. A board with
//      a₁b₁ + a₂b₂ + a₃b₃ squeezes to a · b, the dot popping in; the students
//      read "a dot b"; two tags land: dot product, scalar product.

export function GibbsBoard() {
  const s = useScene(3, [600, 1600, 2000]);
  const k = s.k;
  const caps = [
    "1881, আমেরিকার Yale। physics-এর class-এ বারবার একই লাইন।",
    "Gibbs সাহেব ছোট করে লিখলেন, মাঝে একটা dot।",
    "মুখে বলি: a dot b।",
    "সেই dot থেকে নাম dot product। উত্তর একটা সাধারণ number, তাই আরেক নাম scalar product।",
  ];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <svg viewBox="0 0 240 110" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="একটা বোর্ডে লম্বা যোগফল ছোট হয়ে a · b হলো; নাম dot product আর scalar product">
        <rect width={240} height={110} rx={8} fill="#1f3d2e" />
        <text x={228} y={16} textAnchor="end" fontSize={8} fill="#fde68a">
          Yale, 1881
        </text>
        <text
          key={k >= 1 ? "short" : "long"}
          x={120}
          y={48}
          textAnchor="middle"
          fontSize={k >= 1 ? 22 : 13}
          fontWeight={600}
          fontFamily="ui-monospace, monospace"
          fill="#f8fafc"
          className={FADE}
        >
          {k >= 1 ? "a · b" : "a₁b₁ + a₂b₂ + a₃b₃"}
        </text>
        {k >= 1 && <circle cx={120} cy={41} r={3.2} fill="#fde68a" className={POP} />}
        {k >= 2 && (
          <text x={120} y={70} textAnchor="middle" fontSize={10} fill="#e2e8f0" className={FADE}>
            “a dot b”
          </text>
        )}
        {k >= 3 && (
          <g className={POP}>
            <rect x={30} y={80} width={84} height={18} rx={9} fill="#fde68a" />
            <text x={72} y={93} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
              dot product
            </text>
            <rect x={126} y={80} width={90} height={18} rx={9} fill="#e2e8f0" />
            <text x={171} y={93} textAnchor="middle" fontSize={9} fontWeight={700} fill={INK}>
              scalar product
            </text>
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9¾ · A figure for the SideQuest, no task: how old the sum is. A line runs
//      down through four stops: the হাটের দোকানদার, Grassmann's inner
//      product, Gibbs's dot, and today, inside every AI model.

const X9T_STOPS = [
  { when: "হাজার বছর", who: "হাটের দোকানদার", what: "পরিমাণ × দাম, তারপর যোগ" },
  { when: "1800-এর মাঝামাঝি", who: "Hermann Grassmann, জার্মানি", what: "নাম দিলেন inner product" },
  { when: "1881", who: "Josiah Willard Gibbs, Yale", what: "মাঝে বসালেন dot, a · b" },
  { when: "আজ", who: "AI model-এর ভেতরে", what: "সেকেন্ডে কোটি কোটি বার" },
];

export function DotTimeline() {
  const s = useScene(4, [600, 1300, 1300, 1300]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{k < 4 ? "গুণ-যোগটা কত পুরানো?" : "নাসিব প্রথম না। নামটা শুধু 1881-এর।"}</span>}>
      <div className="relative mx-auto max-w-[16rem] pl-6">
        <div className="absolute top-2 bottom-2 left-2 w-0.5 origin-top bg-border transition-transform duration-1000 motion-reduce:transition-none" style={{ transform: `scaleY(${k / 4})` }} />
        {X9T_STOPS.map((st, i) => (
          <div key={st.when} className={`relative py-1 transition-opacity duration-500 motion-reduce:transition-none ${k > i ? "opacity-100" : "opacity-0"}`}>
            <span className="absolute top-2.5 -left-[1.2rem] size-2.5 rounded-full bg-cat-amber" />
            <div className="text-xs font-semibold text-cat-amber">{st.when}</div>
            <div className="text-sm leading-tight">{st.who}</div>
            <div className="text-xs text-muted">{st.what}</div>
          </div>
        ))}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10 · Try it: রিনা (5, 1) and three films. The pick builds its two খোপ for
//      রিনা and piles them; then the other two towers rise faintly beside it.
//      হীরক, the heaviest card, is the slip: 25 against Titanic's 27.

const X10_FILMS: FilmKey[] = ["hirok", "bean", "titanic"];
const X10_RIGHT = 2;
const X10_NOPE: Record<string, string> = {
  hirok: "হীরক জমা হলো 25, Titanic 27। হীরক-এর card বড়, 4 আর 5। কিন্তু রিনা comedy চান মাত্র 1, তাই comedy-র খোপ এক square উঁচু, সরু।",
  bean: "Bean জমা হলো মাত্র 9। রিনা drama চান 5, আর Bean-এ drama মাত্র 1।",
};

export function TryRina() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const play = usePlay(260);
  const choose = (i: number) => {
    if (play.running) return;
    setPick(i);
    play.play(7, () => (i === X10_RIGHT ? pass("Titanic 27, হীরক 25। অল্পের জন্য।") : setMiss((m) => m + 1)));
  };
  const settled = pick !== null && !play.running;
  const k = pick === null ? 0 : play.running ? play.k : 7;
  const pf = pick === null ? null : FILM[X10_FILMS[pick]];
  const U = 6;
  const TU = 5;

  return (
    <>
      <div className="flex justify-center">
        <ListCard who="রিনা চান" v={RINA} tone="border-cat-coral/40" />
      </div>
      <div className={`mt-2 ${GROW}`}>
        <svg viewBox="0 0 300 120" className="mx-auto h-auto w-full max-w-[19rem]" role="img" aria-label="বেছে নেওয়া ছবির দুইটা খোপ রিনার জন্য, আর তিনটা ছবির tower">
          <rect width={300} height={120} rx={10} fill="white" />
          {pf && k >= 1 && (
            <g key={pick}>
              <text x={8} y={16} fontSize={9} fontWeight={700} fill={pf.color}>
                {pf.name}
              </text>
              <Patch x={10} y={100} w={pf.v[0]} h={RINA[0]} u={U} slot={0} />
              {k >= 2 && <Patch x={50} y={100} w={pf.v[1]} h={RINA[1]} u={U} slot={1} />}
              {k >= 2 && (
                <text x={50} y={112} fontSize={7.5} fill={INK}>
                  comedy-র খোপ
                </text>
              )}
              <text x={10} y={112} fontSize={7.5} fill={INK}>
                drama
              </text>
            </g>
          )}
          <path d="M104 12v100" stroke={INK} strokeOpacity={0.1} />
          {X10_FILMS.map((key, i) => {
            const f = FILM[key];
            const x = 118 + i * 62;
            const isPick = pick === i;
            const on = isPick ? k >= 3 : k >= 5;
            return (
              <g key={key} opacity={isPick ? 1 : 0.45}>
                {on && <Tower x={x} y={96} drama={RINA[0] * f.v[0]} comedy={RINA[1] * f.v[1]} u={TU} />}
                <text x={x + 12} y={108} textAnchor="middle" fontSize={7.5} fontWeight={600} fill={f.color}>
                  {key === "hirok" ? "হীরক" : f.name}
                </text>
                {on && (k >= 6 || (isPick && k >= 4)) && (
                  <text x={x + 12} y={Math.min(40, 96 - Math.ceil(box(RINA, f.v) / 5) * TU - 4)} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK} className={FADE}>
                    {box(RINA, f.v)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X10_FILMS.map((key, i) => {
          const look: Look = settled && pick === i ? (i === X10_RIGHT ? "right" : "wrong") : "idle";
          return (
            <Choice key={key} n={i} look={look} disabled={play.running || (settled && pick === X10_RIGHT)} onClick={() => choose(i)}>
              <span className="flex flex-col items-center text-center">
                <span className="text-xs leading-tight">{FILM[key].name}</span>
                <span className="font-mono text-sm font-bold">
                  <Tup v={FILM[key].v} of={SLOTS} />
                </span>
              </span>
            </Choice>
          );
        })}
      </div>
      {settled && pick !== null && pick !== X10_RIGHT && <Nope key={miss}>{X10_NOPE[X10_FILMS[pick]]}</Nope>}
      <Task done={settled && pick === X10_RIGHT}>নাসিবের rule রিনার হাতে কোন ছবি দেবে? বেছে নিন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 10½ · A figure for screen 10's explanation, no task: why the heavy card
//       lost. হীরক for রিনা: drama খোপ 4 × 5 = 20, comedy 5 wide but 1 tall,
//       a thin strip of 5. Then Titanic's drama খোপ, 5 × 5, one column wider.

export function ThinComedy() {
  const s = useScene(3, [600, 1500, 1800]);
  const k = s.k;
  const caps = [
    "হীরক রাজার দেশে, রিনার জন্য।",
    "drama-র খোপ: 4 চওড়া, 5 উঁচু। 20 square.",
    "comedy-র খোপ 5 চওড়া, কিন্তু রিনা চান মাত্র 1। সরু একটা ফিতা, 5 square।",
    "Titanic-এর drama খোপ এক কলাম বেশি চওড়া, 25। জিত ওখানেই।",
  ];
  const U = 9;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <svg viewBox="0 0 240 80" className="mx-auto h-auto w-full max-w-[15rem]" role="img" aria-label="হীরকের drama খোপ 20, comedy খোপ সরু 5; Titanic-এর drama খোপ 25">
        <rect width={240} height={80} rx={10} fill="white" />
        {k >= 1 && <Patch x={10} y={70} w={4} h={5} u={U} slot={0} />}
        {k >= 2 && <Patch x={56} y={70} w={5} h={1} u={U} slot={1} />}
        {k >= 3 && (
          <g>
            <text x={185} y={14} textAnchor="middle" fontSize={8} fontWeight={600} fill={FILM.titanic.color} className={FADE}>
              Titanic
            </text>
            <Patch x={162} y={70} w={5} h={5} u={U} slot={0} />
          </g>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 11a · A story scene for the ending, no task: morning at the fair. The club's
//       stall, a small board with the night's one line; নাসিব at the counter;
//       ফাহিমের মামা walks up first, as in 3.6, and says what he wants.

export function DawnMama({}: Story) {
  const s = useScene(3, [600, 1500, 2200]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="fair" label="সকালে মেলা বসলো। club-এর stall-এ বোর্ডে এক লাইন: ঘরে ঘরে গুণ, তারপর যোগ। প্রথমেই এলেন ফাহিমের মামা।">
        <Stall x={200} y={S_Y} w={100} sign="Movie Club" color="#7c3aed" />
        <rect x={146} y={60} width={108} height={24} rx={3} fill="#1f3d2e" stroke="#8b6b4a" strokeWidth={2} />
        {k >= 1 && (
          <text x={200} y={75} textAnchor="middle" fontSize={7.5} fontWeight={600} fill="#f8fafc" className={FADE}>
            ঘরে ঘরে গুণ, তারপর যোগ
          </text>
        )}
        <Person who="nasib" x={270} y={S_Y} facing={-1} mood="happy" label />
        <Person who="mama" x={k >= 2 ? 78 : -30} y={S_Y} walking={k === 2} ms={1500} mood={k >= 3 ? "happy" : "plain"} label={k >= 2} />
        {k >= 3 && <Bubble x={78} y={S_Y - 66} lines={["আমার", "comedy movie লাগবে!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 11½ · A recap figure for the ending, no task: the night's rules in a list.
//       Five get struck through, each with what broke it; the last one stays.

const X11_RULES = [
  { r: "ছবির card যোগ", why: "মানুষ বাদ পড়ে" },
  { r: "সব number যোগ", why: "order নড়ে না" },
  { r: "ভাগ", why: "উল্টা চলে, 0-তে ভাঙে" },
  { r: "আড়াআড়ি গুণ", why: "ভুল জোড়া" },
  { r: "খোপ গুণ", why: "একটা 0-তেই সব শেষ" },
];

export function FiveFell() {
  const s = useScene(4, [600, 1300, 1300, 1600]);
  const k = s.k;
  const struck = [1, 1, 2, 2, 3];
  const caps = ["রাতের সব rule।", "যোগে মানুষটাই হারিয়ে গেলো।", "ভাগে সব উল্টা, আর জোড়া ভুল হলে মানে নাই।", "খোপ গুণ করলে একটা খালি slot-ই যথেষ্ট।", "টিকলো একটা।"];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{caps[k]}</span>}>
      <div className="mx-auto max-w-[16rem] space-y-1">
        {X11_RULES.map((x, i) => {
          const out = k >= struck[i];
          return (
            <div key={x.r} className={`flex items-baseline justify-between gap-2 text-sm transition-opacity duration-500 motion-reduce:transition-none ${out ? "opacity-50" : ""}`}>
              <span className={`decoration-danger decoration-2 ${out ? "line-through" : ""}`}>{x.r}</span>
              {out && <span className={`${FADE} text-xs text-danger`}>{x.why}</span>}
            </div>
          );
        })}
        <div className={`mt-1 rounded-lg px-2 py-1 text-center text-sm font-semibold transition-colors duration-500 motion-reduce:transition-none ${k >= 4 ? "win-pop bg-accent text-accent-foreground" : "bg-foreground/5"}`}>
          ঘরে ঘরে গুণ, তারপর যোগ
        </div>
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys are the useSeed names).

export const fixtures: Fixtures = {
  RuleBet: { start: {}, sealed: { bet: 1 } },
  FilmOnly: { start: {}, mama: { who: "mama", served: ["mama"] }, both: { who: "rina", served: ["mama", "rina"] } },
  AddTaste: { start: {}, moved: { t: [6, 1], moves: 4 } },
  DivideKnob: { start: {}, raised: { t: [2, 8], raised: true }, zero: { t: [0, 8], raised: true, zeroed: true } },
  PatchPlay: { start: {}, doubled: { has: 4, want: 6, done: [true, true, true] } },
  WirePick: { start: {}, crossed: { pick: 0 }, all: { pick: 2 }, right: { pick: 1 } },
  PileOrMultiply: { start: {}, times: { pick: 0 }, divide: { pick: 2 }, right: { pick: 1 } },
  BuildBean: {
    start: {},
    crossed: { sides: [[4, 2], [1, 5]], piled: true },
    right: { sides: [[1, 2], [4, 5]], piled: true },
  },
  ShortenIt: { start: {}, sigma: { stage: 3 }, gap: { stage: 4 }, times: { stage: 4, pick: 0 }, right: { stage: 4, pick: 2 } },
  TryRina: { start: {}, hirok: { pick: 0 }, right: { pick: 2 } },
  // figures: a mid beat and the end
  TwoInOne: { mid: { k: 1 }, done: {} },
  OneCardOut: { mid: { k: 1 }, done: {} },
  SameOrder: { mid: { k: 1 }, done: {} },
  FunnierLoses: { mid: { k: 2 }, done: {} },
  AddVsTimes: { mid: { k: 1 }, done: {} },
  NonsensePair: { mid: { k: 2 }, done: {} },
  SameSquares: { mid: { k: 1 }, done: {} },
  TwentyTwoAgain: { mid: { k: 1 }, done: {} },
  GibbsBoard: { start: { k: 0 }, done: {} },
  DotTimeline: { mid: { k: 2 }, done: {} },
  ThinComedy: { mid: { k: 2 }, done: {} },
  FiveFell: { mid: { k: 2 }, done: {} },
  // story scenes
  NightClub: { cards: { k: 1 }, samin: { k: 2 }, played: {} },
  SaminAdds: { played: {} },
  SaminDivides: { played: {} },
  RinaWishes: { played: {} },
  SaminWires: { straight: { k: 1 }, played: {} },
  BhanuBox: { played: {} },
  LongBoard: { played: {} },
  DawnMama: { played: {} },
};
