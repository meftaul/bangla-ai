"use client";

import { useRef, useState } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, primaryBtn, quietBtn, useScene, useSeed, type Fixtures } from "@/components/journey/kit";
import { Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";
import { Gauge, PArrow, PH, Ripple, Sheet, Tag, Txt, WrongMark, svgPoint, toneHex, useWalk, type PhTone } from "@/components/interactive/phy-kit";
import { Rickshaw } from "@/components/interactive/phy-rest-journey";

// Screens for "Physics for High School 14 — Graph থেকে বেগ আর ত্বরণ"
// (src/content/articles/physics_for_high_school/chapter_2/14_motion_graphs.mdx), the
// journey of video EP 14 (physics_9_10/chapter-2/14-motion-graphs/script.md).
// Book "নিজে করো", pp. 51–54 (টেবিল ২.০১, চিত্র ২.০৯).
//
// The spine: one table, which second how far. Can it give both the velocity
// and the acceleration? The reader bets on the shape of the v–t graph
// (GraphBet), settled on the last screen. On the way, the video's own beats:
// তিথি's toy car on the corridor ramp, 0 1 4 9 16 25 m (ToyCarRamp); six
// dots and a bending curve (PlotDots); 2.5 s read off the curve, 6.25 m
// (ReadMiddle); the first second's average 1 m/s sits at 0.5 s
// (FirstSecond); 3 5 7 9 at 1.5 … 4.5 s fall on a straight line
// (NextSeconds); how much the curve rises in a second is its slope, the
// velocity (WhereFast); the v–t slope (6 − 4) / (3 − 2) = 2 m/s² is the
// acceleration (AccelSlope); the same 2 everywhere, a flat a–t line
// (FlatAccel); and the book's second table on the reader's own (Homework).
//
// Canon: s = t² (a = 2 m/s², from rest); slopes 1, 3, 5, 7, 9 m/s at
// 0.5 … 4.5 s; v(3) = 6 m/s; s(2.5) = 6.25 m. Homework: s = 1.5 t²
// (0 6 24 54 96 150 m at 0 2 4 6 8 10 s) → a = 3 m/s².

type Story = { story?: boolean };
type XY = [number, number];

const TABLE = [0, 1, 4, 9, 16, 25];
const sOf = (t: number) => t * t;
const vOf = (t: number) => 2 * t;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const f2 = (x: number) => (Number.isInteger(x) ? `${x}` : x.toFixed(2).replace(/0$/, ""));
const lerp = (a: XY, b: XY, t: number): XY => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const SOFT: Record<PhTone, string> = { mint: PH.mintSoft, amber: PH.amberSoft, blue: PH.blueSoft, red: PH.redSoft, ink: "#f1f5f9", cream: PH.creamSoft };

// ---------------------------------------------------------------------------
// Graph paper: the book's fig 2.09, a panel per graph, all on one time axis
// 0–5 s. A Panel is a plot box and what its edges stand for.

type Panel = { x: number; y: number; w: number; h: number; tMax: number; yMax: number };
const tx = (p: Panel, t: number) => p.x + (t / p.tMax) * p.w;
const vy = (p: Panel, v: number) => p.y + p.h - (v / p.yMax) * p.h;
const at = (p: Panel, t: number, v: number): XY => [tx(p, t), vy(p, v)];

const W = 300;
const GRID = "#d9efe0";
const GRAPH_BG = "#fbfdf8";
/** One graph on a sheet. */
const ONE_H = 200;
const ONE = { x: 40, y: 20, w: 244, h: 146 };
const P_S: Panel = { ...ONE, tMax: 5, yMax: 25 };
const P_V: Panel = { ...ONE, tMax: 5, yMax: 10 };
/** Two graphs stacked, one time axis. */
const TWO_H = 248;
const TOP = { x: 40, y: 18, w: 244, h: 94 };
const BOT = { x: 40, y: 146, w: 244, h: 76 };
const P_S_TOP: Panel = { ...TOP, tMax: 5, yMax: 25 };
const P_V_TOP: Panel = { ...TOP, tMax: 5, yMax: 10 };
const P_V_BOT: Panel = { ...BOT, tMax: 5, yMax: 10 };
const P_A_BOT: Panel = { ...BOT, tMax: 5, yMax: 4 };
const S_TICKS = [0, 5, 10, 15, 20, 25];
const V_TICKS = [0, 2, 4, 6, 8, 10];
const A_TICKS = [0, 1, 2, 3, 4];
const S_NAME = "দূরত্ব s (m)";
const V_NAME = "বেগ v (m/s)";
const A_NAME = "ত্বরণ a (m/s²)";

function Axes({ p, ticks, name, title = true }: { p: Panel; ticks: number[]; name: string; title?: boolean }) {
  const b = p.y + p.h;
  const ts = Array.from({ length: p.tMax + 1 }, (_, i) => i);
  return (
    <g className="pointer-events-none">
      {ts.map((i) => (
        <path key={`gt${i}`} d={`M${tx(p, i)} ${p.y}V${b}`} stroke={GRID} strokeWidth={0.8} />
      ))}
      {ticks.map((v) => (
        <path key={`gv${v}`} d={`M${p.x} ${vy(p, v)}H${p.x + p.w}`} stroke={GRID} strokeWidth={0.8} />
      ))}
      <path d={`M${p.x} ${p.y - 6}V${b}H${p.x + p.w + 8}`} stroke={PH.ink} strokeWidth={1.3} fill="none" />
      <path d={`M${p.x} ${p.y - 10}l-3 6h6Z`} fill={PH.ink} />
      <path d={`M${p.x + p.w + 12} ${b}l-6 -3v6Z`} fill={PH.ink} />
      {ticks.map((v) => (
        <Txt key={`lv${v}`} x={p.x - 5} y={vy(p, v) + 2.8} size={7.5} anchor="end" color={PH.mute}>
          {`${v}`}
        </Txt>
      ))}
      {ts.map((i) => (
        <Txt key={`lt${i}`} x={tx(p, i)} y={b + 10} size={7.5} color={PH.mute}>
          {`${i}`}
        </Txt>
      ))}
      <Txt x={p.x + 7} y={p.y - 4} size={8} anchor="start" weight={700}>
        {name}
      </Txt>
      {title && (
        <Txt x={p.x + p.w + 10} y={b + 21} size={8} anchor="end" color={PH.mute}>
          সময় t (s)
        </Txt>
      )}
    </g>
  );
}

const pathOf = (p: Panel, f: (t: number) => number, from = 0, to = p.tMax) => {
  const n = Math.max(2, Math.ceil((to - from) * 16));
  return (
    "M" +
    Array.from({ length: n + 1 }, (_, i) => {
      const t = from + ((to - from) * i) / n;
      const [x, y] = at(p, t, f(t));
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join("L")
  );
};

/** A graph's line; `draw` lets it draw itself when it mounts. */
function Line({ p, f, from = 0, to = p.tMax, tone = "mint", w = 2.4, draw = false, ms = 1100, delay = 0, opacity = 1 }: { p: Panel; f: (t: number) => number; from?: number; to?: number; tone?: PhTone; w?: number; draw?: boolean; ms?: number; delay?: number; opacity?: number }) {
  const d = pathOf(p, f, from, to);
  const c = toneHex(tone);
  if (draw)
    return (
      <g stroke={c} opacity={opacity}>
        <Draw d={d} ms={ms} delay={delay} strokeWidth={w} />
      </g>
    );
  return <path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={opacity} className="pointer-events-none" />;
}

const DROP = "transition-[translate,opacity] duration-500 ease-out motion-reduce:transition-none starting:-translate-y-5 starting:opacity-0";

/** A plotted point; `drop` lets it fall into place when it mounts. */
function Dot({ at: [x, y], tone = "ink", r = 3.6, drop = false, delay = 0 }: { at: XY; tone?: PhTone; r?: number; drop?: boolean; delay?: number }) {
  return (
    <g style={drop ? { transitionDelay: `${delay}ms` } : undefined} className={`pointer-events-none ${drop ? DROP : ""}`}>
      <circle cx={x} cy={y} r={r} fill={toneHex(tone)} stroke="#fff" strokeWidth={1.2} />
    </g>
  );
}

/** The step under a stretch of a line, t0 → t1: how far it goes along, how much it rises. */
function StepTri({ p, f, t0, t1, tone = "amber", glow = false, opacity = 1, delay = 0 }: { p: Panel; f: (t: number) => number; t0: number; t1: number; tone?: PhTone; glow?: boolean; opacity?: number; delay?: number }) {
  const [x0, y0] = at(p, t0, f(t0));
  const [x1, y1] = at(p, t1, f(t1));
  const c = toneHex(tone);
  const d = `M${x0} ${y0}L${x1} ${y0}L${x1} ${y1}Z`;
  return (
    <g opacity={opacity} style={{ transitionDelay: `${delay}ms` }} className={`pointer-events-none ${FADE}`}>
      {glow && <path d={d} fill="none" stroke={c} strokeWidth={6} opacity={0.22} strokeLinejoin="round" />}
      <path d={d} fill={SOFT[tone]} fillOpacity={0.75} stroke={c} strokeWidth={1.3} strokeLinejoin="round" />
    </g>
  );
}

/** What the drawing says after it has answered: the words come a beat after the picture. */
function Later({ children, ms = 450 }: { children: React.ReactNode; ms?: number }) {
  return (
    <g style={{ transitionDelay: `${ms}ms` }} className={`pointer-events-none ${FADE}`}>
      {children}
    </g>
  );
}

/** An arrowhead pointing up at (x, y): the line went off the top of the paper. */
function UpHead({ x, y, color }: { x: number; y: number; color: string }) {
  return <path d={`M${x} ${y}l-5 8h10Z`} fill={color} className="pointer-events-none" />;
}

/** তিথির খেলনা গাড়ি, wheels on y, facing right. */
function ToyCar({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="pointer-events-none">
      <ellipse cx={2} cy={0.8} rx={14} ry={2} fill={PH.ink} opacity={0.12} />
      <path d="M-12 -4v-6q0 -2 2 -2h4l4 -5h8q2 0 3 2l3 3h3q2 0 2 2v6Z" fill={PH.blue} stroke={PH.ink} strokeWidth={1} strokeLinejoin="round" />
      <path d="M-4 -12l3 -4h6l2.5 4Z" fill={PH.blueSoft} stroke={PH.ink} strokeWidth={0.6} strokeLinejoin="round" />
      {[-6, 10].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={-3} r={3} fill={PH.ink} />
          <circle cx={cx} cy={-3} r={1} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · Story scene for screen 1: the corridor, a sloping plank, তিথি lets the
// toy car go; the chalk marks under it each second spread wider, 0 1 4 9 16
// 25 m, and the table above fills in.

const R_X0 = 52;
const R_PX = 9.6;
const rampX = (m: number) => R_X0 + m * R_PX;
const rampY = (x: number) => 112 + (x - R_X0) * 0.05;
const S1_UPTO = [0, 9, 25];
const S1_MS = 1400;

export function ToyCarRamp({}: Story) {
  const s = useScene(2, [700, 1900]);
  const k = s.k;
  const upTo = S1_UPTO[k];
  const from = k > 0 ? S1_UPTO[k - 1] : 0;
  const cx = rampX(upTo);
  // the car speeds up, so it reaches mark m at about √(m) of the way through the ride
  const when = (m: number) => (m <= from || upTo === from ? 0 : Math.round(S1_MS * Math.sqrt((m - from) / (upTo - from))));
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="room" label="স্কুলের বারান্দা। একটা লম্বা ঢালু তক্তা, তিথি তার উপর দিয়ে একটা খেলনা গাড়ি ছেড়ে দিলো। মেঝেতে প্রতি সেকেন্ডের দাগ: 0, 1, 4, 9, 16, 25 m, ক্রমেই ফাঁকা হচ্ছে। উপরে সময় আর দূরত্বের table।">
        <rect x={56} y={12} width={252} height={48} rx={6} fill="#fff" opacity={0.94} stroke={PH.cream} strokeOpacity={0.45} />
        <Txt x={84} y={31} size={9} color={PH.mute}>
          সময় (s)
        </Txt>
        <Txt x={84} y={50} size={9} color={PH.mute}>
          দূরত্ব (m)
        </Txt>
        <path d="M112 38H300" stroke={PH.faint} strokeWidth={0.8} />
        {TABLE.map((m, i) => (
          <g key={i}>
            <Txt x={128 + i * 34} y={31} size={10} weight={700}>
              {`${i}`}
            </Txt>
            {m <= upTo && (
              <g style={{ transitionDelay: `${when(m)}ms` }} className={FADE}>
                <Txt x={128 + i * 34} y={50} size={10} weight={800} color={PH.blue}>
                  {`${m}`}
                </Txt>
              </g>
            )}
          </g>
        ))}
        {/* the plank on a stack of books, a leg at the far end */}
        {["#2563eb", "#dc2626", "#059669", "#d97706"].map((c, i) => (
          <rect key={c} x={36 + (i % 2)} y={114 + i * 9} width={24 - (i % 2) * 2} height={9} rx={1.5} fill={c} stroke={PH.ink} strokeWidth={0.6} />
        ))}
        <rect x={290} y={rampY(293) + 2} width={6} height={150 - rampY(293) - 2} fill="#8a6a3a" />
        <path d={`M44 ${rampY(44)}L302 ${rampY(302)}`} stroke="#b08a4a" strokeWidth={5} strokeLinecap="round" />
        {TABLE.map((m) =>
          m <= upTo ? (
            <g key={m} style={{ transitionDelay: `${when(m)}ms` }} className={POP}>
              <path d={`M${rampX(m)} 153v8`} stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
              <Txt x={rampX(m)} y={172} size={8} color="#fff" weight={800}>
                {`${m}`}
              </Txt>
            </g>
          ) : null,
        )}
        <g style={{ transform: `translate(${cx - R_X0}px, ${rampY(cx) - rampY(R_X0)}px)` }} className="transition-transform duration-[1400ms] ease-in motion-reduce:transition-none">
          <ToyCar x={R_X0} y={rampY(R_X0) - 2.5} />
        </g>
        <Person who="tithi" x={20} y={150} scale={0.72} arm={k >= 1 ? "point" : "down"} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The sealed bet: from this table, the velocity each second, on a graph.
// What shape is that line? The pick draws itself on empty v–t paper, with a
// "?" at its end. Not marked.

const X1_BETS = [
  { text: "বাঁকা, যত এগোয় তত খাড়া", f: (t: number) => 0.4 * t * t },
  { text: "সোজা, একই হারে উঠছে", f: (t: number) => 2 * t },
  { text: "সমান, একদম আড়াআড়ি", f: () => 5 },
];

/** A thumbnail of a line shape for a choice. */
function Thumb({ f }: { f: (t: number) => number }) {
  const d = "M" + Array.from({ length: 21 }, (_, i) => `${(6 + i * 2.25).toFixed(1)} ${(30 - f(i / 4) * 2.4).toFixed(1)}`).join("L");
  return (
    <svg viewBox="0 0 56 36" className="h-9 w-14 shrink-0" aria-hidden="true">
      <path d="M6 3V30H53" stroke={PH.ink} strokeWidth={1.2} fill="none" />
      <path d={d} stroke={PH.blue} strokeWidth={2} fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function GraphBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const b = bet === null ? null : X1_BETS[bet];
  const end = b ? at(P_V, 5, b.f(5)) : null;
  return (
    <>
      <Sheet w={W} h={ONE_H} label="খালি graph কাগজ: নিচে সময়, পাশে বেগ। বাজি ধরলে সেই রেখাটা আঁকা হয়, শেষে একটা প্রশ্নবোধক চিহ্ন।" bg={GRAPH_BG} className="max-w-[16rem]">
        <Axes p={P_V} ticks={V_TICKS} name={V_NAME} />
        {b && (
          <g key={bet} opacity={0.75}>
            <Line p={P_V} f={b.f} tone="blue" draw ms={1000} />
          </g>
        )}
        {end && b && (
          <g key={`q${bet}`} style={{ transitionDelay: "950ms" }} className={POP}>
            <Tag x={end[0] - 12} y={end[1] + (b.f(5) > 8 ? 16 : -14)} text="?" tone="blue" size={11} solid />
          </g>
        )}
      </Sheet>
      <div className="mt-2 grid gap-1.5">
        {X1_BETS.map((o, i) => (
          <Choice
            key={o.text}
            n={i}
            look={bet === i ? "picked" : bet !== null ? "dim" : "idle"}
            disabled={bet !== null}
            onClick={() => {
              setBet(i);
              sfx.stamp();
              pass("বাজি সিল হলো। শেষে মিলিয়ে দেখবো।");
            }}
          >
            <span className="flex items-center gap-2.5">
              {bet === null && <Thumb f={o.f} />}
              <span>{o.text}</span>
            </span>
          </Choice>
        ))}
      </div>
      <Task done={bet !== null}>এই table থেকে প্রতি সেকেন্ডের বেগ বের করে graph-এ বসালে, রেখাটা কেমন হবে? আন্দাজ করুন।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2 · The table onto graph paper. Each row tapped drops its dot onto the
// grid, with dashed guides from the two axes; the sixth one and the curve
// draws itself through all of them.

const X2_CURVE_MS = 1200;

export function PlotDots() {
  const pass = useGate();
  const [got, setGot] = useSeed<number[]>("got", []);
  const all = got.length === TABLE.length;
  const last = got.length ? got[got.length - 1] : null;
  const tap = (i: number) => {
    if (got.includes(i)) return;
    const next = [...got, i];
    setGot(next);
    sfx.pop();
    if (next.length === TABLE.length)
      setTimeout(() => {
        sfx.chime();
        pass("ছয়টা বিন্দু মিলিয়ে একটা বাঁকা রেখা।");
      }, X2_CURVE_MS);
  };
  const b = P_S.y + P_S.h;
  return (
    <>
      <Sheet w={W} h={ONE_H} label="Graph কাগজ: নিচে সময় 0 থেকে 5 s, পাশে দূরত্ব 0 থেকে 25 m। table-এর সারি ছুঁলে তার বিন্দু বসে।" bg={GRAPH_BG} className="max-w-[19rem]">
        <Axes p={P_S} ticks={S_TICKS} name={S_NAME} />
        {last !== null && !all && (
          <g key={last} className={`pointer-events-none ${FADE}`}>
            <path d={`M${tx(P_S, last)} ${b}V${vy(P_S, TABLE[last])}H${P_S.x}`} stroke={PH.amber} strokeWidth={1.1} strokeDasharray="3 3" fill="none" />
          </g>
        )}
        {all && <Line p={P_S} f={sOf} tone="blue" draw ms={X2_CURVE_MS} />}
        {got.map((i) => (
          <Dot key={i} at={at(P_S, i, TABLE[i])} drop />
        ))}
        {all && <Ripple at={at(P_S, 5, 25)} tone="blue" r={18} />}
      </Sheet>
      <div className="mx-auto mt-2 grid max-w-[19rem] grid-cols-6 gap-1">
        {TABLE.map((m, i) => {
          const on = got.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={on}
              onClick={() => tap(i)}
              className={`cursor-pointer rounded-lg border px-1 py-1 text-center font-mono text-xs leading-tight transition-colors motion-reduce:transition-none disabled:cursor-default ${on ? "border-accent/40 bg-accent/10 text-accent-text" : "border-border bg-surface hover:border-cat-blue/60"}`}
            >
              <span className="block text-muted">{i} s</span>
              <span className="block font-semibold">{m} m</span>
            </button>
          );
        })}
      </div>
      <Task done={all}>Table-এর প্রতিটা সারি ছুঁয়ে graph-এ তার বিন্দু বসান।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3 · Between the rows. A dashed line on the time axis, dragged (or nudged by
// half a second) to 2.5 s, meets the curve; a dashed line across reads the
// distance off the side: 6.25 m. The table had no 2.5 s.

const X3_GOAL = 2.5;

export function ReadMiddle() {
  const pass = useGate();
  const [t, setT] = useSeed("t", 1);
  const [found, setFound] = useSeed("found", false);
  const drag = useRef(false);
  const move = (raw: number) => {
    const nt = Math.round(clamp(raw, 0, 5) * 2) / 2;
    if (nt === t) return;
    setT(nt);
    sfx.tap();
    if (nt === X3_GOAL && !found) {
      setFound(true);
      sfx.chime();
      pass("Table-এ নেই, তবু graph থেকে পড়া গেলো।");
    }
  };
  const fromEvent = (e: React.PointerEvent<SVGSVGElement>) => {
    const [x] = svgPoint(e, W, ONE_H);
    move(((x - P_S.x) / P_S.w) * P_S.tMax);
  };
  const s = sOf(t);
  const [px, py] = at(P_S, t, s);
  const b = P_S.y + P_S.h;
  const hit = t === X3_GOAL;
  const tone = hit ? PH.mint : PH.amber;
  return (
    <>
      <Sheet
        w={W}
        h={ONE_H}
        label="দূরত্ব-সময় graph-এর বাঁকা রেখা। সময়ের অক্ষে একটা দাগ টানা যায়; দাগটা রেখাকে যেখানে ছোঁয়, সেখান থেকে পাশে দূরত্ব পড়া যায়।"
        bg={GRAPH_BG}
        className="max-w-[19rem] cursor-ew-resize"
        onPointerDown={(e) => {
          drag.current = true;
          fromEvent(e);
        }}
        onPointerMove={(e) => {
          if (drag.current) fromEvent(e);
        }}
        onPointerUp={() => {
          drag.current = false;
        }}
      >
        <Axes p={P_S} ticks={S_TICKS} name={S_NAME} />
        <Line p={P_S} f={sOf} tone="blue" />
        {TABLE.map((m, i) => (
          <Dot key={i} at={at(P_S, i, m)} r={2.8} />
        ))}
        <path d={`M${px} ${b}V${py}H${P_S.x}`} stroke={tone} strokeWidth={1.3} strokeDasharray="4 3" fill="none" className="pointer-events-none" />
        <circle cx={px} cy={py} r={4} fill={tone} stroke="#fff" strokeWidth={1.2} className="pointer-events-none" />
        <Tag x={P_S.x + 30} y={py - 11} text={`${f2(s)} m`} tone={hit ? "mint" : "amber"} size={9.5} solid={hit} />
        <circle cx={px} cy={b} r={7} fill={tone} stroke="#fff" strokeWidth={1.5} />
        <Txt x={px} y={b + 2.8} size={7} color="#fff" weight={800}>
          t
        </Txt>
        {hit && <Ripple at={[px, py]} r={20} />}
      </Sheet>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" className={`${quietBtn} h-9! px-3! text-sm`} disabled={t <= 0} onClick={() => move(t - 0.5)}>
          − 0.5 s
        </button>
        <span className="min-w-[8.5rem] text-center font-mono text-sm font-semibold">
          {t} s → {f2(s)} m
        </span>
        <button type="button" className={`${quietBtn} h-9! px-3! text-sm`} disabled={t >= 5} onClick={() => move(t + 0.5)}>
          + 0.5 s
        </button>
      </div>
      <Task done={found}>দাগটা টেনে আড়াই সেকেন্ডে (2.5 s) আনুন। গাড়ি তখন কোথায়?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4 · Velocity begins. On the s–t curve the first second's step: 1 m in 1 s,
// an average of 1 m/s. Below, empty v–t paper with the first second shaded.
// Which moment does that 1 m/s belong to? Each pick drops the dot from the
// step onto that moment: at 0 s or at 1 s it lands on the edge of the
// shaded second, with a red ?; at 0.5 s, right in the middle.

const X4_OPTS = [0, 0.5, 1];
const X4_RIGHT = 1;
const X4_NOPE = [
  "এটা প্রথম সেকেন্ডের একদম শুরু, গাড়ি তখন সবে ছাড়া হলো। 1 m/s তো পুরো সেকেন্ডের গড়।",
  "",
  "এটা প্রথম সেকেন্ডের একদম শেষ, গাড়ি তখন আরও জোরে ছুটছে। গড়টা বসে সেকেন্ডের ঠিক মাঝখানে।",
];

function FirstStep() {
  return (
    <g className="pointer-events-none">
      <StepTri p={P_S_TOP} f={sOf} t0={0} t1={1} glow />
      <path d={`M${tx(P_S_TOP, 1) + 2} ${vy(P_S_TOP, 1) - 3}L112 66`} stroke={PH.amber} strokeWidth={0.9} />
      <Tag x={128} y={57} text="1 m ÷ 1 s = 1 m/s" tone="amber" size={9.5} />
    </g>
  );
}

function FirstBand() {
  return (
    <g className="pointer-events-none">
      <rect x={tx(P_V_BOT, 0)} y={P_V_BOT.y} width={tx(P_V_BOT, 1) - tx(P_V_BOT, 0)} height={P_V_BOT.h} fill={PH.amberSoft} opacity={0.75} />
      <Txt x={tx(P_V_BOT, 0.5)} y={P_V_BOT.y + 10} size={7} color={PH.amber} weight={700}>
        প্রথম সেকেন্ড
      </Txt>
    </g>
  );
}

export function FirstSecond() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // the dot falls from the step down to its moment, speeding up as things fall
  const walk = useWalk(800, { steps: false, ease: "in" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.whoosh(0.5);
    walk.start(() => {
      sfx.tap();
      if (i === X4_RIGHT) {
        sfx.chime();
        pass("গড় বেগ বসে সেকেন্ডের মাঝখানে।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? 0 : walk.running ? walk.t : 1;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X4_RIGHT;
  const target = pick === null ? null : at(P_V_BOT, X4_OPTS[pick], 1);
  const pos = target ? lerp(at(P_S_TOP, 0.5, 0.5), target, p) : null;
  return (
    <>
      <Sheet w={W} h={TWO_H} label="উপরে দূরত্ব-সময় graph, প্রথম সেকেন্ডের ধাপ: 1 m ÷ 1 s = 1 m/s। নিচে খালি বেগ-সময় graph, প্রথম সেকেন্ডটা রঙ করা। বেছে নেওয়া সময়ে 1 m/s-এর বিন্দুটা পড়ে।" bg={GRAPH_BG} className="max-w-[19rem]">
        <Axes p={P_S_TOP} ticks={S_TICKS} name={S_NAME} title={false} />
        <Line p={P_S_TOP} f={sOf} tone="blue" />
        <FirstStep />
        <FirstBand />
        <Axes p={P_V_BOT} ticks={V_TICKS} name={V_NAME} />
        {pos && <Dot at={pos} tone={settled ? (right ? "mint" : "red") : "amber"} r={4} />}
        {settled && !right && target && <WrongMark x={target[0] + 12} y={target[1] - 8} />}
        {right && target && <Ripple at={target} r={16} />}
      </Sheet>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X4_OPTS.map((t, i) => (
          <Choice key={t} n={i} look={pick === i && settled ? (i === X4_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="text-sm whitespace-nowrap">
              <span className="font-mono font-semibold">{t} s</span>-এ
            </span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X4_RIGHT && <Nope key={miss}>{X4_NOPE[pick]}</Nope>}
      <Task done={right}>প্রথম সেকেন্ডের গড় বেগ 1 m/s। নিচের বেগের graph-এ এটা কোন সময়ে বসবে?</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5 · The other four seconds. Each tap steps the next second on the curve
// (4 − 1 = 3, then 5, 7, 9) and drops its dot in that second's middle,
// 1.5 … 4.5 s. With the fifth dot a straight line rules itself through all.

const X5_N = 4;
const X5_LINE_DELAY = 700;

export function NextSeconds() {
  const pass = useGate();
  const [n, setN] = useSeed("n", 0);
  const go = () => {
    if (n >= X5_N) return;
    const next = n + 1;
    setN(next);
    sfx.pencil(0.3);
    if (next === X5_N)
      setTimeout(() => {
        sfx.chime();
        pass("বেগের বিন্দুগুলো একটা সোজা রেখায়!");
      }, X5_LINE_DELAY + 1100);
  };
  const done = n >= X5_N;
  return (
    <>
      <Sheet w={W} h={TWO_H} label="উপরে দূরত্ব-সময় graph, প্রতি সেকেন্ডের ধাপ। নিচে বেগ-সময় graph, প্রতিটা ধাপের বেগ সেই সেকেন্ডের মাঝখানে একটা বিন্দু।" bg={GRAPH_BG} className="max-w-[19rem]">
        <Axes p={P_S_TOP} ticks={S_TICKS} name={S_NAME} title={false} />
        <Line p={P_S_TOP} f={sOf} tone="blue" />
        {Array.from({ length: n + 1 }, (_, i) => (
          <StepTri key={i} p={P_S_TOP} f={sOf} t0={i} t1={i + 1} glow={i === n && !done} opacity={i === n || done ? 1 : 0.55} />
        ))}
        <Axes p={P_V_BOT} ticks={V_TICKS} name={V_NAME} />
        {done && <Line p={P_V_BOT} f={vOf} tone="mint" draw delay={X5_LINE_DELAY} ms={1000} />}
        {Array.from({ length: n + 1 }, (_, i) => (
          <Dot key={i} at={at(P_V_BOT, i + 0.5, 2 * i + 1)} tone={done ? "mint" : "ink"} drop={i > 0} delay={350} />
        ))}
        {done && (
          <Later ms={X5_LINE_DELAY + 900}>
            <Tag x={tx(P_V_BOT, 1.6)} y={P_V_BOT.y + 14} text="সোজা রেখা!" tone="mint" size={9.5} />
          </Later>
        )}
      </Sheet>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1 font-mono text-sm">
        {[1, 3, 5, 7, 9].map((v, i) => (
          <span key={v} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted">·</span>}
            <span className={`rounded-md px-1.5 py-0.5 transition-colors duration-300 motion-reduce:transition-none ${i <= n ? (i === n ? "bg-cat-amber/15 font-bold" : "bg-foreground/[0.07] font-semibold") : "text-muted/50"}`}>{`${v} m/s`}</span>
          </span>
        ))}
      </div>
      <div className="mt-1 text-center text-sm">
        {n === 0 ? (
          <span>
            প্রথম সেকেন্ড: <span className="font-mono">1 − 0 = 1 m</span>
          </span>
        ) : (
          <span>
            {`${n} থেকে ${n + 1} সেকেন্ড: `}
            <span className="font-mono">{`${TABLE[n + 1]} − ${TABLE[n]} = ${2 * n + 1} m`}</span>
          </span>
        )}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" className={`${primaryBtn} h-10! px-4!`} disabled={done} onClick={go}>
          পরের সেকেন্ড
        </button>
      </div>
      <Task done={done}>বাকি চারটা সেকেন্ডেও একই কাজ করুন। বেগের বিন্দুগুলো কোথায় পড়ে, দেখুন।</Task>
    </>
  );
}

// 5½ · Figure for screen 5's explanation: the v–t line on its own; a dashed
// line up from 3 s meets it; across to the side: 6 m/s.

const S5_SAY = ["বেগ-সময় graph: একটা সোজা রেখা।", "3 s-এ রেখাটা কোথায়?", "6 m/s। যেকোনো মুহূর্তের বেগ এখন পড়া যায়।"];

export function ReadSix({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  const [x3, y3] = at(P_V, 3, 6);
  const b = P_V.y + P_V.h;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S5_SAY[k]}</span>}>
      <Sheet w={W} h={ONE_H} label="বেগ-সময় graph, সোজা রেখা। 3 s থেকে খাড়া দাগ রেখা ছুঁয়ে পাশে যায়: 6 m/s।" bg={GRAPH_BG} className="max-w-[17rem]">
        <Axes p={P_V} ticks={V_TICKS} name={V_NAME} />
        <Line p={P_V} f={vOf} tone="mint" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Dot key={i} at={at(P_V, i + 0.5, 2 * i + 1)} tone="mint" r={3} />
        ))}
        {k >= 1 && (
          <g className="stroke-[#d97706]">
            <Draw d={`M${x3} ${b}V${y3}`} ms={600} strokeWidth={1.4} />
          </g>
        )}
        {k >= 2 && (
          <g className="stroke-[#d97706]">
            <Draw d={`M${x3} ${y3}H${P_V.x}`} ms={600} strokeWidth={1.4} />
          </g>
        )}
        {k >= 2 && (
          <g style={{ transitionDelay: "550ms" }} className={POP}>
            <Tag x={P_V.x + 28} y={y3 - 11} text="6 m/s" tone="mint" size={10} solid />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · What did we keep doing? Each second's step on the curve is a tap
// target; a tap lights it and swings the speedometer to how much the curve
// rose in that second. Where was the car fastest? Only the steepest step,
// the last one, 9 m in a second, says so.

const X6_RIGHT = 4;

export function WhereFast() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const tap = (i: number) => {
    if (pick === X6_RIGHT) return;
    setPick(i);
    sfx.tap();
    if (i === X6_RIGHT) {
      sfx.chime();
      pass("রেখা যত খাড়া, গাড়ি তত জোরে।");
    } else setMiss((m) => m + 1);
  };
  const right = pick === X6_RIGHT;
  return (
    <>
      <Sheet w={W} h={ONE_H} label="দূরত্ব-সময় graph-এর বাঁকা রেখা, প্রতি সেকেন্ডের নিচে একটা ধাপ। ধাপ ছুঁলে speedometer দেখায় সেই সেকেন্ডে রেখা কতটা উঠলো।" bg={GRAPH_BG} className="max-w-[19rem]">
        <Axes p={P_S} ticks={S_TICKS} name={S_NAME} />
        <Line p={P_S} f={sOf} tone="blue" />
        {[0, 1, 2, 3, 4].map((i) => {
          const on = pick === i;
          const [x0, y0] = at(P_S, i, sOf(i));
          const [x1, y1] = at(P_S, i + 1, sOf(i + 1));
          return (
            <g key={i} onClick={() => tap(i)} className="cursor-pointer">
              <StepTri p={P_S} f={sOf} t0={i} t1={i + 1} tone={on && right ? "mint" : on ? "red" : "amber"} glow={on} opacity={on ? 1 : 0.5} />
              <rect x={x0 + 1} y={Math.min(y1, y0 - 18) - 4} width={x1 - x0 - 2} height={Math.max(y0 - y1, 18) + 10} fill="transparent" />
            </g>
          );
        })}
        <Txt x={92} y={34} size={8} color={PH.mute}>
          {pick === null ? "একটা ধাপ ছুঁয়ে দেখুন" : `${pick} থেকে ${pick + 1} সেকেন্ডে`}
        </Txt>
        <Gauge x={92} y={72} r={22} v={pick === null ? 0 : 2 * pick + 1} max={10} unit="m/s" digits={0} tone={right ? "mint" : "amber"} settle />
        {pick !== null && !right && <WrongMark x={tx(P_S, pick + 1) + 8} y={vy(P_S, sOf(pick + 1)) - 6} />}
        {right && <Ripple at={at(P_S, 4.5, 20.5)} r={22} />}
      </Sheet>
      {pick !== null && !right && <Nope key={miss}>{`এই সেকেন্ডে রেখা উঠলো মাত্র ${2 * pick + 1} m, তাই গাড়ি ছুটেছে ${2 * pick + 1} m/s-এ। রেখা আরও বেশি উঠেছে কোথায়?`}</Nope>}
      <Task done={right}>গাড়ি কোন সেকেন্ডে সবচেয়ে জোরে ছুটেছে? রেখার নিচে সেই ধাপটা ছুঁয়ে দেখুন।</Task>
    </>
  );
}

// 6½ · Figure for screen 6's explanation: the five steps glow amber, and
// the name lands on them: ঢাল, slope = বেগ.

const S6_SAY = ["প্রতি সেকেন্ডে রেখা উঠলো 1, 3, 5, 7, 9 m।", "এক সেকেন্ডে রেখা কতটা ওঠে: রেখার ঢাল, slope।", "দূরত্ব-সময় graph-এর ঢালই বেগ।"];

export function SlopeIsSpeed({}: Story) {
  const s = useScene(2, [600, 1700]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S6_SAY[k]}</span>}>
      <Sheet w={W} h={ONE_H} label="দূরত্ব-সময় graph-এর বাঁকা রেখা, প্রতি সেকেন্ডের ধাপ amber রঙে। পাশে লেখা: ঢাল, slope = বেগ।" bg={GRAPH_BG} className="max-w-[17rem]">
        <Axes p={P_S} ticks={S_TICKS} name={S_NAME} />
        <Line p={P_S} f={sOf} tone="blue" />
        {[0, 1, 2, 3, 4].map((i) => (
          <StepTri key={`${i}${k >= 1}`} p={P_S} f={sOf} t0={i} t1={i + 1} glow={k >= 1} opacity={k >= 1 ? 1 : 0.6} delay={k >= 1 ? i * 120 : 0} />
        ))}
        {k >= 1 && (
          <g className={POP}>
            <Tag x={120} y={52} text="ঢাল · slope" tone="amber" size={10.5} solid />
          </g>
        )}
        {k >= 2 && (
          <g className={POP}>
            <Tag x={120} y={78} text="= বেগ" tone="mint" size={10.5} solid />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7 · The same on the velocity graph. From 2 s to 3 s the velocity goes 4 →
// 6. What is this line's slope? Each pick draws its own step: 6 stands its
// step on the floor (the velocity, not how much it grew), 1 draws only the
// time along and no rise, 2 sits on the line: up 2 in 1 s.

const X7_OPTS = [
  { v: 6, base: 0, rise: true },
  { v: 1, base: 4, rise: false },
  { v: 2, base: 4, rise: true },
];
const X7_RIGHT = 2;
const X7_NOPE = [
  "ধাপটা দাঁড়ালো মেঝে থেকে, রেখার উপরে না। 6 হলো 3 s-এ বেগ কত, কতটা বাড়লো তা না।",
  "শুধু আড়াআড়ি টুকরোটা আঁকা হলো, ওঠাটা নেই। 3 − 2 = 1 তো সময়ের ফারাক, বেগের না।",
  "",
];

export function AccelSlope() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  const walk = useWalk(1000, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pencil(0.5);
    walk.start(() => {
      if (i === X7_RIGHT) {
        sfx.chime();
        pass("বেগের graph-এর ঢাল = ত্বরণ।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? 0 : walk.running ? walk.t : 1;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X7_RIGHT;
  const o = pick === null ? null : X7_OPTS[pick];
  const c = settled ? (right ? PH.mint : PH.red) : PH.amber;
  const runP = clamp(p * 2, 0, 1);
  const riseP = clamp(p * 2 - 1, 0, 1);
  const A = o ? at(P_V, 2, o.base) : null;
  const B = o ? at(P_V, 2 + runP, o.base) : null;
  const top = o ? o.base + (6 - o.base) * riseP : 0;
  return (
    <>
      <Sheet w={W} h={ONE_H} label="বেগ-সময় graph-এর সোজা রেখা। 2 s-এ বেগ 4, 3 s-এ 6। বেছে নেওয়া উত্তর তার নিজের ধাপ আঁকে।" bg={GRAPH_BG} className="max-w-[19rem]">
        <Axes p={P_V} ticks={V_TICKS} name={V_NAME} />
        <Line p={P_V} f={vOf} tone="mint" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Dot key={i} at={at(P_V, i + 0.5, 2 * i + 1)} tone="mint" r={2.8} />
        ))}
        {[2, 3].map((t) => (
          <g key={t} className="pointer-events-none">
            <circle cx={tx(P_V, t)} cy={vy(P_V, 2 * t)} r={3.6} fill={PH.ink} stroke="#fff" strokeWidth={1.2} />
            <Txt x={tx(P_V, t) - 6} y={vy(P_V, 2 * t) - 7} size={8} anchor="end" weight={700}>
              {`${2 * t} m/s`}
            </Txt>
          </g>
        ))}
        {o && A && B && runP > 0.01 && <path d={`M${A[0]} ${A[1]}L${B[0]} ${B[1]}`} stroke={c} strokeWidth={2.2} strokeLinecap="round" className="pointer-events-none" />}
        {o && o.rise && riseP > 0.01 && <path d={`M${tx(P_V, 3)} ${vy(P_V, o.base)}L${tx(P_V, 3)} ${vy(P_V, top)}`} stroke={c} strokeWidth={2.2} strokeLinecap="round" className="pointer-events-none" />}
        {settled && o && (
          <g className={`pointer-events-none ${FADE}`}>
            <Txt x={tx(P_V, 2.5)} y={vy(P_V, o.base) + (o.base === 0 ? -5 : 11)} size={8} color={c} weight={700}>
              1 s
            </Txt>
            {o.rise && (
              <Txt x={tx(P_V, 3) + 6} y={vy(P_V, (o.base + 6) / 2) + 3} size={8.5} anchor="start" color={c} weight={800}>
                {`+${6 - o.base} m/s`}
              </Txt>
            )}
          </g>
        )}
        {settled && !right && <WrongMark x={tx(P_V, 3) + 30} y={vy(P_V, o!.rise ? 3 : 4) - 6} />}
        {right && <Ripple at={at(P_V, 3, 5)} r={18} />}
        {right && (
          <Later>
            <Tag x={tx(P_V, 1.2)} y={vy(P_V, 8)} text="ঢাল = 2 ÷ 1 = 2" tone="mint" size={9.5} solid />
          </Later>
        )}
      </Sheet>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {X7_OPTS.map((x, i) => (
          <Choice key={x.v} n={i} look={pick === i && settled ? (i === X7_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="font-mono text-sm font-semibold whitespace-nowrap">{x.v} m/s²</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X7_RIGHT && <Nope key={miss}>{X7_NOPE[pick]}</Nope>}
      <Task done={right}>2 s থেকে 3 s-এ বেগ 4 থেকে 6। এই রেখার ঢাল কত? বেছে নিন, ধাপটা আঁকা হবে।</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8 · Measure it anywhere. Four stretches of the v–t line, tapped in any
// order: each draws its step (up 2 in 1 s) and drops a dot at 2 on the a–t
// paper below. With all four, a flat line draws itself at 2.

const X8_SECS = [1, 2, 3, 4];
const X8_LINE_DELAY = 600;

export function FlatAccel() {
  const pass = useGate();
  const [got, setGot] = useSeed<number[]>("got", []);
  const done = got.length === X8_SECS.length;
  const last = got.length ? got[got.length - 1] : null;
  const tap = (i: number) => {
    if (got.includes(i)) return;
    const next = [...got, i];
    setGot(next);
    sfx.pencil(0.3);
    if (next.length === X8_SECS.length)
      setTimeout(() => {
        sfx.chime();
        pass("যেখানেই মাপি, ঢাল 2।");
      }, X8_LINE_DELAY + 1100);
  };
  return (
    <>
      <Sheet w={W} h={TWO_H} label="উপরে বেগ-সময় graph-এর সোজা রেখা, নিচে খালি ত্বরণ-সময় graph। রেখার যেকোনো টুকরোর ধাপ মাপলে নিচে 2-এর উচ্চতায় একটা বিন্দু পড়ে।" bg={GRAPH_BG} className="max-w-[19rem]">
        <Axes p={P_V_TOP} ticks={V_TICKS} name={V_NAME} title={false} />
        <Line p={P_V_TOP} f={vOf} tone="mint" />
        {got.map((i) => (
          <StepTri key={i} p={P_V_TOP} f={vOf} t0={i} t1={i + 1} glow={i === last && !done} opacity={i === last || done ? 1 : 0.6} />
        ))}
        <Axes p={P_A_BOT} ticks={A_TICKS} name={A_NAME} />
        {done && <Line p={P_A_BOT} f={() => 2} tone="blue" draw delay={X8_LINE_DELAY} ms={1000} />}
        {got.map((i) => (
          <Dot key={i} at={at(P_A_BOT, i + 0.5, 2)} tone={done ? "blue" : "ink"} drop delay={300} />
        ))}
        {done && (
          <Later ms={X8_LINE_DELAY + 900}>
            <Tag x={tx(P_A_BOT, 2.5)} y={vy(P_A_BOT, 2) - 14} text="সব জায়গায় 2" tone="blue" size={9.5} />
          </Later>
        )}
      </Sheet>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
        {X8_SECS.map((i) => (
          <button
            key={i}
            type="button"
            disabled={got.includes(i)}
            onClick={() => tap(i)}
            className={`cursor-pointer rounded-full border px-3 py-1.5 font-mono text-sm font-semibold transition-colors motion-reduce:transition-none disabled:cursor-default ${got.includes(i) ? "border-accent/40 bg-accent/10 text-accent-text" : "border-border bg-surface hover:border-cat-blue/60"}`}
          >
            {`${i}–${i + 1} s`}
          </button>
        ))}
      </div>
      <div className="mt-1 min-h-5 text-center font-mono text-sm">{last !== null && `(${2 * last + 2} − ${2 * last}) ÷ 1 = 2 m/s²`}</div>
      <Task done={done}>বেগের রেখার চারটা জায়গাতেই ঢাল মাপুন। প্রতিবার কত আসে?</Task>
    </>
  );
}

// 8½ · Figure for screen 8's explanation: a = 2 from rest gives s = t², and
// t² lines up with the table, cell by cell.

const S8_SAY = ["ত্বরণ 2 m/s², আর গাড়ি শুরু করেছিল থেমে থেকে।", "s = ½ × 2 × t², মানে শুধু t²।", "0, 1, 4, 9, 16, 25: table-এর সাথে হুবহু মিল!"];

export function SquaresMatch({}: Story) {
  const s = useScene(2, [600, 1700]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S8_SAY[k]}</span>}>
      <Sheet w={W} h={120} label="a = 2, u = 0। s = ½ × 2 × t² = t²। নিচে t²-এর সারি আর table-এর সারি পাশাপাশি, প্রতিটা ঘর মিলে যায়।" className="max-w-[18rem]">
        <Txt x={150} y={24} size={12} weight={800}>
          a = 2 m/s², u = 0
        </Txt>
        {k >= 1 && (
          <g className={FADE}>
            <Txt x={150} y={48} size={12} weight={700} color={PH.blue}>
              s = ½ × 2 × t² = t²
            </Txt>
          </g>
        )}
        <Txt x={44} y={78} size={8.5} color={PH.mute}>
          t²
        </Txt>
        <Txt x={44} y={102} size={8.5} color={PH.mute}>
          table
        </Txt>
        {TABLE.map((m, i) => (
          <g key={i}>
            {k >= 2 && (
              <g style={{ transitionDelay: `${i * 220}ms` }} className={FADE}>
                <rect x={78 + i * 38} y={66} width={30} height={44} rx={6} fill={PH.mintSoft} stroke={PH.mint} strokeWidth={0.9} />
                <Txt x={93 + i * 38} y={78} size={10} weight={800} color={PH.mint}>
                  {`${i * i}`}
                </Txt>
              </g>
            )}
            <Txt x={93 + i * 38} y={102} size={10} weight={700}>
              {`${m}`}
            </Txt>
          </g>
        ))}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Your turn: the book's second table, s = 1.5 t² (not said). Its six
// points on the paper; the reader picks an acceleration and the curve
// s = ½at² draws itself from 0 to 10 s. 1.5 falls short, 75 m at 10 s; 6
// flies off the top before 7.1 s; 3 runs through every point.

const P_H: Panel = { x: 44, y: 20, w: 240, h: 146, tMax: 10, yMax: 150 };
const HW_S = [0, 6, 24, 54, 96, 150];
const X9_OPTS = [1.5, 3, 6];
const X9_RIGHT = 1;
const X9_NOPE = [
  "Curve 10 s-এ মাত্র 75 m-এ পৌঁছালো, table বলছে 150। s = ½at², তাই t²-এর পাশের সংখ্যাটা ত্বরণের অর্ধেক।",
  "",
  "Curve বিন্দুগুলোর অনেক উপর দিয়ে উড়ে গেলো, 8 s-এর আগেই 150 m ছাড়ালো। ত্বরণ এত বেশি না।",
];

export function Homework() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useState(0);
  // the curve draws on a linear clock in t, the way the car would cover it
  const walk = useWalk(1300, { steps: false, ease: "linear" });
  const go = (i: number) => {
    if (walk.running) return;
    setPick(i);
    sfx.pencil(0.9);
    walk.start(() => {
      if (i === X9_RIGHT) {
        sfx.chime();
        pass("ত্বরণ 3 m/s², মানে s = 1.5 t²।");
      } else setMiss((m) => m + 1);
    });
  };
  const p = pick === null ? 0 : walk.running ? walk.t : 1;
  const settled = pick !== null && !walk.running;
  const right = settled && pick === X9_RIGHT;
  const a = pick === null ? 0 : X9_OPTS[pick];
  const tEnd = a ? Math.min(10, Math.sqrt((2 * P_H.yMax) / a)) : 0;
  const tNow = tEnd * p;
  const f = (t: number) => 0.5 * a * t * t;
  const tone: PhTone = settled ? (right ? "mint" : "red") : "amber";
  return (
    <>
      <Sheet w={W} h={ONE_H} label="দূরত্ব-সময় graph, সময় 0 থেকে 10 s, দূরত্ব 0 থেকে 150 m। বইয়ের table-এর ছয়টা বিন্দু বসানো। বেছে নেওয়া ত্বরণের curve আঁকা হয়।" bg={GRAPH_BG} className="max-w-[19rem]">
        <Axes p={P_H} ticks={[0, 30, 60, 90, 120, 150]} name={S_NAME} />
        {pick !== null && tNow > 0.05 && <path d={pathOf(P_H, f, 0, tNow)} stroke={toneHex(tone)} strokeWidth={2.4} fill="none" strokeLinecap="round" className="pointer-events-none" />}
        {HW_S.map((m, i) => (
          <Dot key={i} at={at(P_H, i * 2, m)} tone={pick === X9_RIGHT && tNow >= i * 2 - 0.01 ? "mint" : "ink"} />
        ))}
        {settled && pick === 2 && (
          <g className="pointer-events-none">
            <UpHead x={tx(P_H, tEnd)} y={P_H.y - 10} color={PH.red} />
            <WrongMark x={tx(P_H, tEnd) + 14} y={P_H.y + 10} />
          </g>
        )}
        {settled && pick === 0 && (
          <g className="pointer-events-none">
            <Tag x={tx(P_H, 10) - 20} y={vy(P_H, 75) + 14} text="75 m" tone="red" size={9} />
            <WrongMark x={tx(P_H, 10) + 6} y={vy(P_H, 112)} />
          </g>
        )}
        {right && <Ripple at={at(P_H, 10, 150)} r={20} />}
      </Sheet>
      <div className="mt-1.5 text-center font-mono text-xs leading-snug text-muted">
        <span className="block">t (s): 0 · 2 · 4 · 6 · 8 · 10</span>
        <span className="block">s (m): 0 · 6 · 24 · 54 · 96 · 150</span>
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {X9_OPTS.map((x, i) => (
          <Choice key={x} n={i} look={pick === i && settled ? (i === X9_RIGHT ? "right" : "wrong") : "idle"} disabled={walk.running || right} onClick={() => go(i)}>
            <span className="font-mono text-sm font-semibold whitespace-nowrap">{x} m/s²</span>
          </Choice>
        ))}
      </div>
      {settled && pick !== X9_RIGHT && <Nope key={miss}>{X9_NOPE[pick]}</Nope>}
      <Task done={right}>বইয়ের table-এর বিন্দুগুলো graph-এ বসানো। কোন ত্বরণে curve ঠিক বিন্দুগুলোর উপর দিয়ে যায়?</Task>
    </>
  );
}

// 9½ · Figure for screen 9's explanation: the graph way. The average
// velocity of each 2 s, 3 9 15 21 27 m/s at 1 3 5 7 9 s; a straight line;
// its step from 3 s to 5 s: up 6 in 2 s, slope 3.

const P_HV: Panel = { x: 44, y: 20, w: 240, h: 120, tMax: 10, yMax: 30 };
const S9_SAY = ["প্রতি দুই সেকেন্ডের গড় বেগ, তার মাঝখানে: 3, 9, 15, 21, 27।", "বিন্দুগুলো আবার একটা সোজা রেখায়।", "দুই সেকেন্ডে বেগ বাড়ে 6, তাই ঢাল 6 ÷ 2 = 3 m/s²।"];

export function HomeworkSlopes({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  const v = (t: number) => 3 * t;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S9_SAY[k]}</span>}>
      <Sheet w={W} h={172} label="বেগ-সময় graph, 0 থেকে 10 s। পাঁচটা বিন্দু 3, 9, 15, 21, 27 m/s, একটা সোজা রেখায়। 3 থেকে 5 s-এর ধাপ: 6 উঠলো 2 সেকেন্ডে।" bg={GRAPH_BG} className="max-w-[18rem]">
        <Axes p={P_HV} ticks={[0, 6, 12, 18, 24, 30]} name={V_NAME} />
        {k >= 1 && <Line p={P_HV} f={v} tone="mint" draw ms={900} />}
        {k >= 2 && <StepTri p={P_HV} f={v} t0={3} t1={5} glow />}
        {[1, 3, 5, 7, 9].map((t, i) => (
          <Dot key={t} at={at(P_HV, t, v(t))} tone="mint" drop={k === 0} delay={i * 150} />
        ))}
        {k >= 2 && (
          <g className={POP}>
            <Tag x={tx(P_HV, 5) + 28} y={vy(P_HV, 12)} text="+6" tone="amber" size={9.5} />
            <Tag x={tx(P_HV, 4)} y={vy(P_HV, 9) + 12} text="2 s" tone="amber" size={9} />
            <Tag x={120} y={44} text="ঢাল = 3 m/s²" tone="mint" size={10} solid />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10a · Recap for the last screen: the book's three panels, one time axis;
// the slope of the top one comes down as the middle one, the slope of the
// middle one as the bottom one.

const R_TOP: Panel = { x: 40, y: 18, w: 196, h: 56, tMax: 5, yMax: 25 };
const R_MID: Panel = { x: 40, y: 104, w: 196, h: 56, tMax: 5, yMax: 10 };
const R_BOT: Panel = { x: 40, y: 190, w: 196, h: 56, tMax: 5, yMax: 4 };
const S10_SAY = ["দূরত্ব-সময় graph: বাঁকা রেখা।", "তার ঢাল হলো বেগ: সোজা রেখা।", "বেগের ঢাল হলো ত্বরণ: সমান রেখা, 2-এর উচ্চতায়।"];

export function ThreeGraphs({}: Story) {
  const s = useScene(2, [700, 1700]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10_SAY[k]}</span>}>
      <Sheet w={W} h={274} label="তিনটা graph উপর-নিচে, একই সময়ের অক্ষ: দূরত্বের বাঁকা রেখা, বেগের সোজা রেখা, ত্বরণের সমান রেখা। মাঝে তীর: ঢাল।" bg={GRAPH_BG} className="max-w-[17rem]">
        <Axes p={R_TOP} ticks={[0, 25]} name="দূরত্ব s" title={false} />
        <Line p={R_TOP} f={sOf} tone="blue" />
        <Axes p={R_MID} ticks={[0, 10]} name="বেগ v" title={false} />
        {k >= 1 && <Line p={R_MID} f={vOf} tone="mint" draw delay={500} ms={800} />}
        {k >= 1 && <PArrow a={[268, 48]} b={[268, 128]} tone="amber" draw ms={500} tell="দূরত্বের ঢাল = বেগ" />}
        {k >= 1 && (
          <g style={{ transitionDelay: "300ms" }} className={POP}>
            <Tag x={268} y={86} text="ঢাল" tone="amber" size={9.5} solid />
          </g>
        )}
        <Axes p={R_BOT} ticks={[0, 2, 4]} name="ত্বরণ a" />
        {k >= 2 && <Line p={R_BOT} f={() => 2} tone="blue" draw delay={500} ms={800} />}
        {k >= 2 && <PArrow a={[268, 134]} b={[268, 214]} tone="amber" draw ms={500} tell="বেগের ঢাল = ত্বরণ" />}
        {k >= 2 && (
          <g style={{ transitionDelay: "300ms" }} className={POP}>
            <Tag x={268} y={172} text="ঢাল" tone="amber" size={9.5} solid />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// 10b · The teaser: a rickshaw on the road, no speedometer, no stopwatch.
// How fast?

const S10B_SAY = ["রাস্তা দিয়ে একটা রিকশা যাচ্ছে।", "Speedometer নেই, stopwatch-ও নেই।", "তবু কি বলা যায়, কত জোরে?"];

/** A speedometer or a stopwatch, crossed out in red: "we don't have one". */
export function NoIcon({ x, y, kind }: { x: number; y: number; kind: "dial" | "watch" }) {
  return (
    <g className={`pointer-events-none ${POP}`}>
      <circle cx={x} cy={y} r={12} fill="#fff" stroke={PH.ink} strokeWidth={1.2} />
      {kind === "dial" ? <path d={`M${x - 7} ${y + 3}A7 7 0 0 1 ${x + 7} ${y + 3}M${x} ${y + 3}l4 -6`} stroke={PH.ink} strokeWidth={1.2} fill="none" /> : <path d={`M${x - 2} ${y - 15}h4M${x} ${y}V${y - 7}`} stroke={PH.ink} strokeWidth={1.4} />}
      <path d={`M${x - 11} ${y + 11}L${x + 11} ${y - 11}`} stroke={PH.red} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export function RickshawTease({}: Story) {
  const s = useScene(2, [600, 1600]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S10B_SAY[k]}</span>}>
      <Sheet w={W} h={120} label="রাস্তা দিয়ে একটা রিকশা যাচ্ছে। speedometer আর stopwatch দুটোই কাটা। উপরে প্রশ্ন: কত জোরে?" bg="#f3f6f9" className="max-w-[18rem]">
        <rect x={1.5} y={88} width={W - 3} height={20} fill="#d6d3cb" />
        <path d={`M8 98H${W - 8}`} stroke="#fff" strokeWidth={1} strokeDasharray="6 6" />
        <g style={{ transform: `translateX(${k >= 1 ? 150 : 0}px)` }} className="transition-transform duration-[1600ms] ease-linear motion-reduce:transition-none">
          <Rickshaw x={60} y={96} s={0.26} spin={k >= 1 ? 400 : 0} />
        </g>
        {k >= 1 && <NoIcon x={46} y={30} kind="dial" />}
        {k >= 1 && <NoIcon x={80} y={30} kind="watch" />}
        {k >= 2 && (
          <g className={POP}>
            <Tag x={200} y={28} text="কত জোরে?" tone="amber" size={10.5} solid />
          </g>
        )}
      </Sheet>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot`.

export const fixtures: Fixtures = {
  ToyCarRamp: { a: { k: 0 }, mid: { k: 1 }, end: {} },
  GraphBet: { start: {}, sealed: { bet: 0 } },
  PlotDots: { start: {}, three: { got: [0, 2, 3] }, done: { got: [0, 1, 2, 3, 4, 5] } },
  ReadMiddle: { start: {}, two: { t: 2 }, right: { t: 2.5, found: true } },
  FirstSecond: { start: {}, wrong: { pick: 2 }, right: { pick: 1 } },
  NextSeconds: { start: {}, two: { n: 2 }, done: { n: 4 } },
  ReadSix: { end: {} },
  WhereFast: { start: {}, wrong: { pick: 1 }, right: { pick: 4 } },
  SlopeIsSpeed: { end: {} },
  AccelSlope: { start: {}, wrong: { pick: 0 }, wrong2: { pick: 1 }, right: { pick: 2 } },
  FlatAccel: { start: {}, two: { got: [2, 4] }, done: { got: [1, 2, 3, 4] } },
  SquaresMatch: { end: {} },
  Homework: { start: {}, short: { pick: 0 }, over: { pick: 2 }, right: { pick: 1 } },
  HomeworkSlopes: { end: {} },
  ThreeGraphs: { end: {} },
  RickshawTease: { end: {} },
};
