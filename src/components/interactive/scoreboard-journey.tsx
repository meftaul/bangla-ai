"use client";

import { useEffect, useId, type ReactNode } from "react";

import { Task, useGate } from "@/components/journey/journey";
import { Choice, Draw, FADE, Nope, POP, Scene, Ticks, primaryBtn, usePlay, useScene, useSeed, type Fixtures, type Look } from "@/components/journey/kit";
import { Bubble, Card, Person, Stage, StoryFrame } from "@/components/journey/cast";
import { sfx } from "@/components/journey/sfx";

// Screens for "Math for AI 1.2 — Binary, পাঁচ বাল্বের scoreboard", told as a Journey.
//
// A winter night, the neighbourhood tape-tennis final in the lane, fog between
// the two ends. The chalk score can't be read from the far end, so Mama hangs
// five bulbs on a bamboo pole with five switches under it. Nasib says five
// bulbs can show five runs at most; the reader seals a bet on the real top
// score. Then: a regulator's in-between glow is misread through the fog (so a
// bulb is only on or off), Nasib's "one bulb per run" runs out in the first
// over, the looks double with every bulb (32 for five), the reader prices the
// bulbs one by one and finds 1, 2, 4, 8, 16 (a smaller price repeats a score,
// a bigger one skips one), reads the pole (10110 = 22, named binary and bit),
// sets it themselves (25, then 31, all lit), watches 31 + 1 roll every bulb
// off and prices a sixth bulb at 32, and in the Try it finds eight bulbs top
// out at 255. The end settles the bet and bridges back to the main lesson's
// 0-to-255 brightness. 10 steps.
//
// Every story scene is a StoryFrame on the night stage; every <Then> figure
// is watch-only (useScene). The pole is one drawing (PoleG) used by scenes,
// widgets and figures alike; its night sheet is fixed ink in both themes.
// Words are the author's Banglish (pathshala-journey §2); bubbles are narrated
// the story-bangla-prose way, and only Mama speaks a little dialect.
//
// Replaces the older "Shom's five questions" screens (binary-journey.tsx,
// kept as it was, now unused).

/** A story scene takes `story` (it marks the scene as setup words for the Journey) and ignores it. */
type Story = { story?: boolean };

const INK = "#0f1b2d";
const NIGHT = "#0f172a";
/** the five bulbs' prices, left to right */
const TAGS5 = [16, 8, 4, 2, 1];
/** the eight bulbs' prices, left to right */
const TAGS8 = [128, 64, 32, 16, 8, 4, 2, 1];

/** which of n bulbs a number lights, left to right (the leftmost is the biggest) */
const litOf = (v: number, n: number) => Array.from({ length: n }, (_, i) => ((v >> (n - 1 - i)) & 1) === 1);
/** the prices of the lit bulbs, added */
const sumOf = (lit: boolean[], tags: number[]) => lit.reduce((s, on, i) => s + (on ? tags[i] : 0), 0);
/** the indexes of the lit bulbs, left to right */
const litIdx = (lit: boolean[]) => lit.flatMap((on, i) => (on ? [i] : []));

// ---------------------------------------------------------------------------
// The pole: a length of bamboo with bulbs hanging from it, one per column, each
// on or off, with a price tag under it when there are prices. A bulb can be
// ringed ("hot": the one being read or set), faded ("dim": not in play yet),
// missing ("gone": only its hook), or a dashed red empty socket ("ghost").

type Mark = "hot" | "dim" | "gone" | "ghost" | undefined;

function PoleG({ x, y, w, lit, tags, marks }: { x: number; y: number; w: number; lit: boolean[]; tags?: (number | string | null)[]; marks?: Mark[] }) {
  const n = lit.length;
  const col = w / n;
  const r = Math.min(10, col * 0.27);
  const cy = y + 13 + r;
  const tw = Math.min(24, col - 3);
  return (
    <g>
      <rect x={x} y={y - 4} width={w} height={7} rx={3.5} fill="#c9a25e" stroke="#8a6a2f" strokeWidth={0.8} />
      {Array.from({ length: n - 1 }, (_, i) => (
        <path key={`n${i}`} d={`M${x + (i + 1) * col} ${y - 4}v7`} stroke="#8a6a2f" strokeWidth={0.8} />
      ))}
      {lit.map((on, i) => {
        const cx = x + col * (i + 0.5);
        const m = marks?.[i];
        if (m === "gone") return <path key={i} d={`M${cx - 2} ${y + 3}v5a2 2 0 0 0 4 0`} fill="none" stroke="#94a3b8" strokeWidth={1.2} />;
        const tag = tags?.[i];
        return (
          <g key={i} opacity={m === "dim" ? 0.3 : 1} className={m === "ghost" ? POP : undefined}>
            <path d={`M${cx} ${y + 3}V${y + 10}`} stroke="#94a3b8" strokeWidth={1.2} />
            <rect x={cx - 3} y={y + 8} width={6} height={5} rx={1} fill="#71717a" />
            <circle cx={cx} cy={cy} r={r * 2} fill="#fde68a" opacity={on ? 0.3 : 0} className="transition-opacity duration-300 motion-reduce:transition-none" />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              strokeWidth={1.3}
              strokeDasharray={m === "ghost" ? "3 2" : undefined}
              className={`transition-[fill,stroke] duration-300 motion-reduce:transition-none ${
                m === "ghost" ? "fill-transparent stroke-[#f87171]" : on ? "fill-[#fde047] stroke-[#eab308]" : "fill-[#334155] stroke-[#64748b]"
              }`}
            />
            {m === "hot" && <circle key={`h${i}`} cx={cx} cy={cy} r={r + 4} fill="none" stroke="#38bdf8" strokeWidth={1.8} className={POP} />}
            {tag !== undefined && tag !== null && (
              <g key={`t${tag}`} className={POP}>
                <rect x={cx - tw / 2} y={cy + r + 5} width={tw} height={14} rx={2.5} fill="white" stroke="#94a3b8" strokeWidth={0.8} />
                <text x={cx} y={cy + r + 15.5} textAnchor="middle" fontSize={tw < 22 ? 8.5 : 9.5} fontWeight={700} fontFamily="ui-monospace, monospace" fill={INK}>
                  {tag}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** a few pale drifts of fog; `shift` slides them, so a new try gets new fog */
function Fog({ w, h, shift = 0 }: { w: number; h: number; shift?: number }) {
  return (
    <g style={{ transform: `translateX(${shift}px)` }} className="pointer-events-none transition-transform duration-1000 ease-out motion-reduce:transition-none">
      {[
        [0.15, 0.3, 0.5],
        [0.55, 0.55, 0.45],
        [0.9, 0.25, 0.4],
        [0.35, 0.85, 0.55],
      ].map(([fx, fy, s], i) => (
        <ellipse key={i} cx={fx * w} cy={fy * h} rx={w * 0.3 * s + 30} ry={10 + 8 * s} fill="white" opacity={0.07} />
      ))}
    </g>
  );
}

/** the night sheet a pole hangs in, 300 wide */
function Night({ h, label, children, fog = true, shift = 0 }: { h: number; label: string; children: ReactNode; fog?: boolean; shift?: number }) {
  return (
    <svg viewBox={`0 0 300 ${h}`} role="img" aria-label={label} className="block h-auto w-full select-none">
      <rect width={300} height={h} fill={NIGHT} />
      {children}
      {fog && <Fog w={300} h={h} shift={shift} />}
    </svg>
  );
}

/** the pole's sheet with, under it, its switch board */
function Board({ children, bottom }: { children: ReactNode; bottom?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl ring-1 ring-black/20">
      {children}
      {bottom && <div className="bg-[#1e293b] py-1.5">{bottom}</div>}
    </div>
  );
}

/** one wall switch per bulb, lined up under the pole's columns */
function Switches({ on, onFlip, disabled = false }: { on: boolean[]; onFlip: (i: number) => void; disabled?: boolean }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${on.length}, minmax(0, 1fr))` }}>
      {on.map((o, i) => (
        <button
          key={i}
          type="button"
          aria-pressed={o}
          aria-label={`${i + 1} নম্বর বাল্বের switch`}
          disabled={disabled}
          onClick={() => onFlip(i)}
          className="mx-auto grid h-10 w-7 cursor-pointer place-items-center rounded-md border border-[#94a3b8] bg-[#f8fafc] shadow-sm disabled:cursor-default"
        >
          <span className={`block h-3.5 w-4 rounded-sm transition-transform duration-200 motion-reduce:transition-none ${o ? "-translate-y-1.5 bg-[#eab308]" : "translate-y-1.5 bg-[#64748b]"}`} />
        </button>
      ))}
    </div>
  );
}

/** a row of little bulbs, for patterns side by side */
function Dots({ x, y, lit, gap = 14, r = 4.5 }: { x: number; y: number; lit: boolean[]; gap?: number; r?: number }) {
  return (
    <g>
      {lit.map((on, i) => (
        <circle key={i} cx={x + i * gap} cy={y} r={r} strokeWidth={1} className={on ? "fill-[#fde047] stroke-[#eab308]" : "fill-[#334155] stroke-[#64748b]"} />
      ))}
    </g>
  );
}

/** a bulb glowing at brightness b (0…1), blurred when seen through the fog */
function Glow({ cx, cy, r, b, blur }: { cx: number; cy: number; r: number; b: number; blur?: string }) {
  return (
    <g filter={blur ? `url(#${blur})` : undefined}>
      <circle cx={cx} cy={cy} r={r * 2.2} fill="#fde68a" opacity={0.35 * b} className="transition-opacity duration-500 motion-reduce:transition-none" />
      <circle cx={cx} cy={cy} r={r} fill="#334155" stroke="#64748b" strokeWidth={1.2} />
      <circle cx={cx} cy={cy} r={r} fill="#fde047" opacity={b} className="transition-opacity duration-500 motion-reduce:transition-none" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// The lane at night, the set for the story scenes: a tube light on a post at
// each end, the score's little blackboard, fog across the middle.

const FEET = 170;

function LaneSet({ board = true }: { board?: boolean }) {
  return (
    <g className="pointer-events-none">
      <rect y={150} width={320} height={30} fill="#27272a" />
      {[14, 306].map((x) => (
        <g key={x}>
          <rect x={x - 1.5} y={66} width={3} height={104} fill="#475569" />
          <circle cx={x} cy={64} r={20} fill="#f8fafc" opacity={0.1} />
          <rect x={x - 12} y={62} width={24} height={4} rx={2} fill="#f8fafc" />
        </g>
      ))}
      {board && (
        <g>
          <path d="M28 170l4 -26M58 170l-4 -26" stroke="#92400e" strokeWidth={2} />
          <rect x={24} y={124} width={38} height={24} rx={2} fill="#1f3b2d" stroke="#92400e" strokeWidth={2} />
          <text x={43} y={140} textAnchor="middle" fontSize={9} fill="white" opacity={0.7} fontFamily="ui-monospace, monospace">
            3/0
          </text>
        </g>
      )}
      {[
        [70, 110, 70],
        [200, 128, 90],
        [140, 92, 60],
        [260, 100, 50],
      ].map(([x, y, rx]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx={rx} ry={12} fill="white" opacity={0.08} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// 1a · A story scene for screen 1's setup, no task: the final in the fog.
//      Samin chalks the score; Fahim at the far end can't read it; Mama walks
//      in and hangs five bulbs on the bamboo; Nasib says five runs, no more.

export function FogFinal({}: Story) {
  const s = useScene(3, [600, 2400, 2000, 2400]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage
        backdrop="night"
        label="a foggy winter night in the lane: Samin chalks the score, Fahim at the far end can't read it, Mama hangs five bulbs on a bamboo pole, and Nasib says five runs at most"
      >
        <LaneSet />
        {k >= 2 && (
          <g className={POP}>
            <PoleG x={96} y={20} w={140} lit={litOf(0, 5)} />
          </g>
        )}
        <Person who="samin" x={80} y={FEET} arm="hold" />
        <Person who="fahim" x={282} y={FEET - 12} scale={0.72} facing={-1} mood={k === 1 ? "shout" : "plain"} />
        {k === 1 && <Bubble x={282} y={FEET - 60} side="left" lines={["কত হলো?", "কিছুই তো দেখি না."]} />}
        <Person who="mama" x={k >= 2 ? 150 : -30} y={FEET} walking={k === 2} arm={k >= 2 ? "point" : "down"} />
        {k >= 3 && <Person who="nasib" x={214} y={FEET} facing={-1} mood="smug" />}
        {k >= 3 && <Bubble x={214} y={FEET - 66} side="left" lines={["পাঁচটা বাল্ব?", "পাঁচ run এই শেষ."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 1 · The bet. Five dark bulbs on the pole; how many runs at most? The pick is
//     chalked on a slate beside the pole with a "?", then sealed, unmarked.
//     The Finale settles it.

const B1_OPT = [5, 10, 31];

export function BulbBet() {
  const pass = useGate();
  const [bet, setBet] = useSeed<number | null>("bet", null);
  const [sealed, setSealed] = useSeed("sealed", false);

  const seal = () => {
    if (bet === null) return;
    setSealed(true);
    sfx.stamp();
    pass(`বাজি সিল: সবচেয়ে বেশি ${B1_OPT[bet]} run.`);
  };

  return (
    <>
      <div className="mx-auto flex max-w-sm items-stretch gap-2">
        <div className="min-w-0 flex-1">
          <Board>
            <Night h={66} label="five bulbs on a bamboo pole, all off, in the fog">
              <PoleG x={0} y={12} w={300} lit={litOf(0, 5)} />
            </Night>
          </Board>
        </div>
        <div className="flex w-[5.2rem] shrink-0 flex-col items-center justify-center rounded-xl border-4 border-[#92400e] bg-[#1f3b2d] py-1">
          <div className="text-[0.7rem] text-white/60">বাজি</div>
          {bet !== null ? (
            <div key={bet} className={`${POP} font-mono text-2xl font-bold text-white`}>
              {B1_OPT[bet]}
              <span className="text-[#fde047]">?</span>
            </div>
          ) : (
            <div className="font-mono text-2xl text-white/40">?</div>
          )}
          {sealed && <div className={`${POP} text-xs font-semibold text-[#fde047]`}>সিল</div>}
        </div>
      </div>
      <div className="mt-3 text-sm font-medium text-muted">পাঁচটা বাল্ব. প্রত্যেকটা শুধু জ্বলে, নয়তো নেভে. সবচেয়ে বেশি কত run দেখানো যাবে?</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {B1_OPT.map((o, i) => (
          <Choice key={o} n={i} look={bet === i ? "picked" : sealed ? "dim" : "idle"} disabled={sealed} onClick={() => setBet(i)}>
            <span className="font-mono text-lg font-bold">{o}</span> run
          </Choice>
        ))}
      </div>
      {!sealed ? (
        <div className="mt-3 flex justify-center">
          <button type="button" disabled={bet === null} onClick={seal} className={primaryBtn}>
            বাজি সিল করুন
          </button>
        </div>
      ) : (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>বাজি সিল হলো. খেলা শেষে মিলিয়ে দেখবো.</div>
      )}
      <Task done={sealed}>একটা সংখ্যা বেছে নিন, তারপর বাজি সিল করুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2a · A story scene for screen 2's setup, no task: Samin wants one bulb,
//      brighter or dimmer, with a fan regulator from Mama's shop.

export function DimmerIdea({}: Story) {
  const s = useScene(2, [600, 2400, 2200]);
  const k = s.k;
  useEffect(() => {
    if (k === 2) sfx.knob();
  }, [k]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="Samin holds up a fan regulator and turns one bulb half on">
        <LaneSet />
        <PoleG x={96} y={20} w={140} lit={litOf(0, 5)} />
        {k >= 2 && <circle cx={222} cy={40.6} r={7.6} fill="#fde047" opacity={0.45} className={FADE} />}
        <Person who="samin" x={140} y={FEET} arm={k >= 2 ? "hold" : "down"} mood={k >= 1 ? "happy" : "plain"} />
        {k >= 2 && (
          <g className={POP}>
            <rect x={144} y={118} width={14} height={16} rx={2} fill="#f8fafc" stroke="#64748b" />
            <circle cx={151} cy={126} r={4} fill="#94a3b8" />
            <path d="M151 126l2.5 -3" stroke={INK} strokeWidth={1.2} />
          </g>
        )}
        {k === 1 && <Bubble x={140} y={FEET - 66} lines={["পাঁচটা লাগবে কেন?", "একটাই কম-বেশি জ্বালাই."]} />}
        {k >= 2 && <Bubble x={140} y={FEET - 66} lines={["অর্ধেক জ্বললে 2 run."]} />}
        <Person who="mama" x={250} y={FEET} facing={-1} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 2 · Through the fog. The reader turns Samin's regulator to a notch and the
//     light crosses the fog to Fahim, who reads a number. An in-between glow
//     comes out a notch too bright or too dim each time; full off and full on
//     are always read right. Ticks: two in-between tries, full off, full on.

const F2_WOB = [1, -1, -1, 1, 1, -1, 1, -1];
const F2_NAME = ["OFF", "1", "2", "3", "পুরো"];
/** what Fahim reads at the far end for notch `lvl` on try `t` */
const f2Read = (lvl: number, t: number) => {
  if (lvl === 0 || lvl === 4) return lvl;
  const w = F2_WOB[t % F2_WOB.length];
  const r = lvl + w;
  return r < 1 || r > 3 ? lvl - w : r;
};

export function FogRead() {
  const pass = useGate();
  const [tries, setTries] = useSeed<number[]>("tries", []);
  const pl = usePlay(110);
  const blur = `fog${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const t = tries.length - 1;
  const lvl = t >= 0 ? tries[t] : null;
  const landed = lvl !== null && !pl.running;
  const read = lvl !== null ? f2Read(lvl, t) : null;
  const mids = tries.filter((l) => l > 0 && l < 4).length;
  const got = [mids >= 2, tries.includes(0), tries.includes(4)];
  const beam = pl.running ? pl.k / 8 : lvl !== null ? 1 : 0;

  const send = (l: number) => {
    if (pl.running) return;
    const next = [...tries, l];
    setTries(next);
    sfx.knob();
    pl.play(8, () => {
      const m = next.filter((x) => x > 0 && x < 4).length;
      if (m >= 2 && next.includes(0) && next.includes(4)) pass("কুয়াশায় শুধু ON  আর OFF ঠিক পড়া যায়.");
    });
  };

  return (
    <>
      <Board>
        <Night h={112} label="one bulb at Samin's end, its light crossing the fog to Fahim at the far end, and the number Fahim reads" shift={((tries.length * 17) % 40) - 20}>
          <defs>
            <filter id={blur} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={2.2} />
            </filter>
          </defs>
          <path d="M20 10H60" stroke="#c9a25e" strokeWidth={6} strokeLinecap="round" />
          <path d="M40 13V22" stroke="#94a3b8" strokeWidth={1.2} />
          <Glow cx={40} cy={34} r={11} b={(lvl ?? 0) / 4} />
          <text x={40} y={70} textAnchor="middle" fontSize={9} fill="#cbd5e1">
            সামিনের দিক
          </text>
          {beam > 0 && <path d={`M58 34H${58 + 170 * beam}`} stroke="#fde68a" strokeWidth={1.4} strokeDasharray="2 5" opacity={0.6} />}
          {landed && read !== null ? (
            <g key={tries.length} className={FADE}>
              <Glow cx={255} cy={34} r={11} b={read / 4} blur={blur} />
            </g>
          ) : (
            <circle cx={255} cy={34} r={11} fill="none" stroke="#475569" strokeDasharray="3 3" />
          )}
          <text x={255} y={70} textAnchor="middle" fontSize={9} fill="#cbd5e1">
            ফাহিমের দিক
          </text>
          {landed && read !== null && (
            <text key={`r${tries.length}`} x={255} y={96} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="ui-monospace, monospace" fill={read === lvl ? "#6ee7b7" : "#fca5a5"} className={POP}>
              {read}?
            </text>
          )}
        </Night>
      </Board>
      <div className="mt-2 text-center text-xs text-muted">সামিনের নিয়ম: OFF মানে 0 run, পুরো ON  মানে 4 run.</div>
      <div className="mt-1.5 flex justify-center gap-1.5">
        {F2_NAME.map((nm, i) => (
          <button
            key={nm}
            type="button"
            disabled={pl.running}
            onClick={() => send(i)}
            className={`cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-default motion-reduce:transition-none ${
              lvl === i ? "border-cat-blue bg-cat-blue text-white" : "border-border hover:border-cat-blue/60"
            }`}
          >
            {nm}
          </button>
        ))}
      </div>
      <div className="mt-2 min-h-6 text-center text-[0.95rem]">
        {landed && read !== null ? (
          <span key={tries.length} className={`${FADE} ${read === lvl ? "text-accent-text" : "text-danger"}`}>
            সামিন দিলো {lvl} run. ফাহিম পড়লো {read} run.
          </span>
        ) : (
          <span className="text-muted">{pl.running ? "আলো কুয়াশা পার হচ্ছে…" : "Regulator এর একটা ঘরে টিপুন."}</span>
        )}
      </div>
      <Ticks
        items={[
          ["মাঝামাঝি, দুইবার", got[0]],
          ["পুরো OFF", got[1]],
          ["পুরো ON ", got[2]],
        ]}
      />
      <Task done={got.every(Boolean) && !pl.running}>Regulator ঘুরিয়ে আলো পাঠান: মাঝামাঝি দুইবার, তারপর পুরো OFF আর পুরো ON .</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 2½ · A figure for screen 2's explanation, no task: the same light sent three
//      times. In-between comes out three different ways; off stays off, on
//      stays on.

const L2_ROWS = [
  { name: "মাঝামাঝি", send: 0.5, seen: [0.75, 0.25, 0.5] },
  { name: "OFF", send: 0, seen: [0, 0, 0] },
  { name: "পুরো ON ", send: 1, seen: [1, 1, 1] },
];
const L2_SAY = [
  "সামিন একই আলো তিনবার পাঠালো. ফাহিম দেখলো কুয়াশার ওপার থেকে.",
  "মাঝামাঝি আলো: তিনবার তিন রকম লাগলো.",
  "OFF বাল্ব: তিনবারই OFF.",
  "পুরো ON : তিনবারই ON . এই দুইটায় ভুল হয় না.",
];

export function TwoLooks() {
  const s = useScene(3, [600, 1800, 1500, 1800]);
  const k = s.k;
  const blur = `fog${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{L2_SAY[k]}</span>}>
      <svg viewBox="0 0 260 120" role="img" aria-label="three kinds of light sent through the fog three times each, and how each one looked at the far end" className="mx-auto block h-auto w-full max-w-[17rem] rounded-xl">
        <defs>
          <filter id={blur} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={1.8} />
          </filter>
        </defs>
        <rect width={260} height={120} rx={10} fill={NIGHT} />
        <rect x={112} y={4} width={46} height={112} fill="white" opacity={0.06} />
        {L2_ROWS.map((row, i) => {
          const y = 22 + i * 38;
          return (
            <g key={row.name}>
              <text x={8} y={y + 4} fontSize={9} fill="#cbd5e1">
                {row.name}
              </text>
              <Glow cx={88} cy={y} r={7} b={row.send} />
              <path d={`M100 ${y}H168`} stroke="#fde68a" strokeWidth={1} strokeDasharray="2 4" opacity={0.4} />
              {k >= i + 1
                ? row.seen.map((b, j) => (
                    <g key={j} className={POP} style={{ transitionDelay: `${j * 200}ms` }}>
                      <Glow cx={186 + j * 26} cy={y} r={7} b={b} blur={blur} />
                    </g>
                  ))
                : row.seen.map((_, j) => <circle key={j} cx={186 + j * 26} cy={y} r={7} fill="none" stroke="#475569" strokeDasharray="2 2" />)}
            </g>
          );
        })}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 3 · Nasib's rule, one bulb per run, over the first over. Each "next ball"
//     brings that ball's runs and Samin lights that many more bulbs, left to
//     right; at the sixth ball the score is 7 and two runs have nowhere to go.

const C3_RUNS = [1, 2, 0, 1, 1, 2];
const C3_CUM = C3_RUNS.map((_, i) => C3_RUNS.slice(0, i + 1).reduce((a, b) => a + b, 0));

export function CountRuns() {
  const pass = useGate();
  const [ball, setBall] = useSeed("ball", 0);
  const pl = usePlay(420);
  const before = ball > 1 ? C3_CUM[ball - 2] : 0;
  const total = ball ? C3_CUM[ball - 1] : 0;
  const shown = pl.running ? before + pl.k : total;
  const over = Math.max(0, shown - 5);
  const done = ball === 6 && !pl.running;

  // Samin flips one more switch for each run
  useEffect(() => {
    if (pl.running && pl.k > 0 && before + pl.k <= 5) sfx.click();
  }, [pl.running, pl.k, before]);

  const next = () => {
    if (pl.running || ball >= 6) return;
    const b = ball + 1;
    setBall(b);
    const add = C3_RUNS[b - 1];
    if (add) pl.play(add, () => (b === 6 ? pass("এক বাল্ব এক run হলে 5 এই শেষ.") : undefined));
  };

  return (
    <>
      <Board>
        <Night h={70} label={`Nasib's rule: one bulb per run. ${total} runs, ${Math.min(shown, 5)} bulbs lit`}>
          <PoleG x={0} y={12} w={235} lit={Array.from({ length: 5 }, (_, i) => i < shown)} />
          {Array.from({ length: over }, (_, i) => (
            <g key={i} className={POP}>
              <circle cx={255 + i * 26} cy={35} r={10} fill="none" stroke="#f87171" strokeWidth={1.4} strokeDasharray="3 2" />
              <text x={255 + i * 26} y={39} textAnchor="middle" fontSize={11} fontWeight={700} fill="#f87171">
                ?
              </text>
            </g>
          ))}
        </Night>
      </Board>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {C3_RUNS.map((r, i) => (
          <span
            key={i}
            className={`grid size-8 place-items-center rounded-full border-2 font-mono text-sm font-bold ${
              i < ball ? `${POP} border-cat-blue bg-cat-blue/10` : "border-dashed border-border text-muted"
            }`}
          >
            {i < ball ? r : ""}
          </span>
        ))}
      </div>
      <div className="mt-2 text-center text-[0.95rem]">
        মোট <b className="font-mono">{total}</b> run · জ্বলছে <b className="font-mono">{Math.min(shown, 5)}</b>টা বাল্ব
      </div>
      {done && <div className={`${FADE} mt-1 text-center text-[0.95rem] text-danger`}>7 run, কিন্তু বাল্ব মাত্র 5টা. বাকি 2 run কোথায় জ্বলবে?</div>}
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={next} disabled={pl.running || ball >= 6} className={primaryBtn}>
          পরের বল
        </button>
      </div>
      <Task done={done}>পরের বল চাপুন, over শেষ হওয়া পর্যন্ত. বাল্বগুলো কী করে, দেখুন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 3½ · A figure for screen 3's explanation, no task: three different looks,
//      each with three bulbs lit, and Nasib's rule reads every one as 3.

const S3_LOOKS = [0b11100, 0b00111, 0b10101];
const S3_SAY = [
  "নাসিবের নিয়মে শুধু গোনা হয়, কয়টা জ্বলছে.",
  "বামের তিনটা জ্বলছে. নাসিবের নিয়মে 3.",
  "ডানের তিনটা জ্বলছে. তাও 3.",
  "মাঝের তিনটা. এটাও 3. তিনটা আলাদা combination, কাজ হলো একটার.",
];

export function SameThree() {
  const s = useScene(3, [600, 1500, 1500, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{S3_SAY[k]}</span>}>
      <svg viewBox="0 0 220 110" role="img" aria-label="three different patterns of three lit bulbs, each read as 3 by counting" className="mx-auto block h-auto w-full max-w-[15rem] rounded-xl">
        <rect width={220} height={110} rx={10} fill={NIGHT} />
        {S3_LOOKS.map((m, i) => (
          <g key={m}>
            <Dots x={40} y={24 + i * 32} lit={k >= i + 1 ? litOf(m, 5) : litOf(0, 5)} gap={20} r={6.5} />
            {k >= i + 1 && (
              <text x={160} y={29 + i * 32} fontSize={14} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#fde047" className={POP}>
                = 3
              </text>
            )}
          </g>
        ))}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4 · How many looks? Two bulbs first: the reader flips switches and every new
//     look drops into the tray (all-off is already there). Then each "one more
//     bulb" copies the tray: every old look with the new bulb off, and again
//     with it on, while the pole flickers through them all. 4, 8, 16, 32.

/** the looks of n bulbs in tray order: the two-bulb looks as found, then each bulb doubles them */
function p4List(n: number, found: number[]): number[] {
  if (n <= 2) return found;
  const prev = p4List(n - 1, found);
  return [...prev, ...prev.map((m) => m | (1 << (n - 1)))];
}

export function Patterns() {
  const pass = useGate();
  const [n, setN] = useSeed("n", 2);
  const [found, setFound] = useSeed<number[]>("found", [0]);
  const [v, setV] = useSeed("v", 0);
  const pl = usePlay(55);
  const list = p4List(n, found);
  const half = n > 2 ? list.length / 2 : list.length;
  const now = n > 2 ? (pl.running ? (list[pl.k] ?? 0) : 0) : v;
  const allTwo = found.length === 4;
  const done = n === 5 && !pl.running;

  const flip = (i: number) => {
    if (n !== 2) return;
    const nv = v ^ (1 << (1 - i));
    setV(nv);
    sfx.click();
    if (!found.includes(nv)) setFound([...found, nv]);
  };
  const add = () => {
    if (pl.running || n >= 5 || !allTwo) return;
    const nn = n + 1;
    setN(nn);
    pl.play(2 ** nn, () => (nn === 5 ? pass("একটা বাল্ব বাড়লে combination দ্বিগুণ.") : undefined));
  };

  return (
    <>
      <Board bottom={n === 2 ? <Switches on={litOf(v, 2)} onFlip={flip} /> : undefined}>
        <Night h={62} label={`${n} bulbs on the pole`}>
          <PoleG x={0} y={10} w={300} lit={litOf(now, n)} marks={n > 2 ? ["hot"] : undefined} />
        </Night>
      </Board>
      <div className="mt-2 flex items-baseline justify-center gap-2">
        <span className="text-sm text-muted">{n}টা বাল্বে combination:</span>
        <b key={list.length} className={`${POP} font-mono text-xl`}>
          {list.length}
        </b>
      </div>
      <div className="mx-auto mt-1.5 grid max-w-sm grid-cols-6 gap-1 rounded-xl bg-[#0f172a] p-1.5">
        {list.map((m, i) => (
          <span
            key={`${n}-${i}`}
            style={{ transitionDelay: i >= half ? `${(i - half) * 20}ms` : undefined }}
            className={`flex h-5 items-center justify-center gap-[2px] rounded ${i >= half && n > 2 ? `${POP} bg-[#fde047]/15` : ""} ${
              pl.running && pl.k === i ? "ring-2 ring-[#38bdf8]" : ""
            }`}
          >
            {litOf(m, n).map((on, j) => (
              <i key={j} className={`block size-2 rounded-full ${on ? "bg-[#fde047]" : "bg-[#475569]"}`} />
            ))}
          </span>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        {n < 5 ? (
          <button type="button" onClick={add} disabled={!allTwo || pl.running} className={primaryBtn}>
            আরেকটা বাল্ব লাগান
          </button>
        ) : (
          <div className={`${FADE} text-center text-[0.95rem] text-muted`}>পাঁচটা বাল্ব, 32 রকম combination.</div>
        )}
      </div>
      <Task done={done}>{allTwo ? "আরেকটা করে বাল্ব লাগান, পাঁচটা হওয়া পর্যন্ত. combination কয়টা হয়, দেখুন." : "দুইটা switch টিপে 4 রকম আলাদা combination বানান."}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 4½ · A figure for screen 4's explanation, no task: why a bulb doubles the
//      looks. The two-bulb looks sit in the left panel; a new bulb is put in
//      front of each (ringed), first OFF, then the same looks again with it ON
//      in the right panel. The next bulbs repeat it: 4, 8, 16, 32.

const X4_SAY = [
  "দুইটা বাল্বে 4 রকম combination.",
  "নতুন একটা বাল্ব লাগলো. পুরোনো 4টার সামনে বসলো OFF.",
  "আবার সেই 4টা, এবার সামনে ON. মোট 8.",
  "আরেকটা বাল্ব. 8টার সামনে OFF, আবার 8টার সামনে ON. মোট 16.",
  "পাঁচটা বাল্ব. 16টার সামনে OFF, 16টার সামনে ON. মোট 32.",
];
/** bulbs on the pole at beat k */
const X4_N = [2, 3, 3, 4, 5];
const X4_GAP = 5.6;
const X4_R = 2.1;

/** one look of n bulbs centred at (cx, cy); the leftmost is ringed when it is the new bulb */
function X4Look({ cx, cy, m, n, fresh }: { cx: number; cy: number; m: number; n: number; fresh: boolean }) {
  const x0 = cx - ((n - 1) * X4_GAP) / 2;
  return (
    <g>
      <Dots x={x0} y={cy} lit={litOf(m, n)} gap={X4_GAP} r={X4_R} />
      {fresh && <circle key={n} cx={x0} cy={cy} r={X4_R + 1.8} fill="none" stroke="#38bdf8" strokeWidth={1} className={POP} />}
    </g>
  );
}

export function DoubleLooks() {
  const s = useScene(4, [600, 1600, 1600, 2200, 2400]);
  const k = s.k;
  const n = X4_N[k];
  // the looks before the newest bulb, in tray order (as in Patterns)
  const old = Array.from({ length: 2 ** (n === 2 ? 2 : n - 1) }, (_, i) => i);
  const fresh = n > 2;
  const showOn = k >= 2;
  const total = n === 2 ? 4 : showOn ? 2 ** n : 2 ** (n - 1);
  const cell = (i: number) => ({ dx: 17 + (i % 4) * 34, dy: 32 + Math.floor(i / 4) * 15 });
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{X4_SAY[k]}</span>}>
      <svg viewBox="0 0 300 116" role="img" aria-label="each new bulb goes in front of every old look, once off and once on, so the looks double: 4, 8, 16, 32" className="mx-auto block h-auto w-full max-w-[18rem] rounded-xl">
        <rect width={300} height={116} rx={10} fill={NIGHT} />
        <path d="M150 12V92" stroke="#334155" strokeWidth={1} strokeDasharray="3 3" opacity={fresh ? 1 : 0} className="transition-opacity duration-500 motion-reduce:transition-none" />
        {fresh && (
          <text key={`off${n}`} x={79} y={20} textAnchor="middle" fontSize={9} fill="#cbd5e1" className={FADE}>
            সামনে OFF
          </text>
        )}
        {showOn && (
          <text key={`on${n}`} x={221} y={20} textAnchor="middle" fontSize={9} fill="#fde047" className={FADE}>
            সামনে ON
          </text>
        )}
        {old.map((m, i) => {
          const { dx, dy } = cell(i);
          return (
            <g key={`o${i}`} className={POP} style={{ transitionDelay: `${i * 25}ms` }}>
              <X4Look cx={8 + dx} cy={dy} m={m} n={n} fresh={fresh} />
            </g>
          );
        })}
        {showOn &&
          old.map((m, i) => {
            const { dx, dy } = cell(i);
            return (
              <g key={`n${n}-${i}`} className={POP} style={{ transitionDelay: `${i * 40}ms` }}>
                <X4Look cx={150 + dx} cy={dy} m={m | (1 << (n - 1))} n={n} fresh />
              </g>
            );
          })}
        <text x={150} y={108} textAnchor="middle" fontSize={12} fontWeight={700} fontFamily="ui-monospace, monospace">
          {[4, 8, 16, 32].map((c, i) => (
            <tspan key={c} fill={c <= total ? "#fde047" : "#475569"} className="transition-[fill] duration-500 motion-reduce:transition-none">
              {i ? "  →  " : ""}
              {c}
            </tspan>
          ))}
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 4¾ · A figure for screen 4's explanation, no task: all 32 looks of five
//      bulbs; Nasib's rule uses six of them (0 to 5), the rest lie idle.

const W4_NASIB = [0, 16, 24, 28, 30, 31];
const W4_SAY = ["পাঁচটা বাল্বে 32 রকম combination.", "নাসিবের নিয়মে কাজে লাগে মাত্র 6টা: 0 থেকে 5 run.", "বাকি 26টা combination পড়ে থাকে. কোনো কাজে লাগে না."];

export function LooksWasted() {
  const s = useScene(2, [600, 1800, 2200]);
  const k = s.k;
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{W4_SAY[k]}</span>}>
      <div className="mx-auto grid max-w-[16rem] grid-cols-4 gap-1 rounded-xl bg-[#0f172a] p-1.5" role="img" aria-label="all 32 looks of five bulbs, with the six that Nasib's rule uses picked out">
        {Array.from({ length: 32 }, (_, m) => {
          const used = W4_NASIB.includes(m);
          return (
            <span
              key={m}
              className={`flex h-5 items-center justify-center gap-[2px] rounded transition-opacity duration-500 motion-reduce:transition-none ${
                k >= 1 && used ? "ring-2 ring-accent" : ""
              } ${k >= 2 && !used ? "opacity-25" : ""}`}
            >
              {litOf(m, 5).map((on, j) => (
                <i key={j} className={`block size-2 rounded-full ${on ? "bg-[#fde047]" : "bg-[#475569]"}`} />
              ))}
            </span>
          );
        })}
      </div>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 5a · A story scene for screen 5's setup, no task: Mama takes out a marker,
//      says to write a price under each bulb and add the lit ones; the
//      rightmost gets 1, the rest wait with "?".

export function MamaTags({}: Story) {
  const s = useScene(2, [600, 2400, 2600]);
  const k = s.k;
  useEffect(() => {
    if (k === 2) sfx.pencil(0.4);
  }, [k]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="Mama says to write a price under each bulb; the rightmost bulb gets 1, the others a question mark">
        <LaneSet board={false} />
        <PoleG x={80} y={12} w={160} lit={litOf(0, 5)} tags={k >= 2 ? ["?", "?", "?", "?", 1] : undefined} />
        <Person who="samin" x={80} y={FEET} />
        <Person who="mama" x={170} y={FEET} facing={-1} arm={k >= 1 ? "point" : "down"} />
        {k === 1 && <Bubble x={170} y={FEET - 66} side="left" lines={["প্রত্যেক বাল্বের নিচে", "একটা দাম লেইখা দে."]} />}
        {k >= 2 && <Bubble x={170} y={FEET - 66} side="left" lines={["যেগুলা জ্বলবো, দাম যোগ.", "ওইটাই score."]} />}
        <Person who="fahim" x={262} y={FEET} facing={-1} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 5 · Pricing the bulbs. The rightmost is 1. For each next bulb the reader
//     picks a price; the pole then flickers through every look of the bulbs
//     in play, and each look drops its score onto the strip 0…31. Too small a
//     price lands two looks on one score (amber); too big leaves a hole (red).
//     The right one fills the strip without a gap and the next bulb comes up.

const T5_OPT = [
  [1, 2, 3],
  [4, 3, 5],
  [7, 9, 8],
  [16, 15, 17],
];
const T5_RIGHT = [2, 4, 8, 16];
/** the score of every look of the bulbs in play; prices right to left, look bit j = price j */
const t5Sums = (tags: number[]) => Array.from({ length: 2 ** tags.length }, (_, look) => tags.reduce((s, t, j) => s + ((look >> j) & 1 ? t : 0), 0));

export function PriceTags() {
  const pass = useGate();
  const [tags, setTags] = useSeed<number[]>("tags", [1]);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const round = tags.length - 1;
  const inPlay = pick !== null ? [...tags, pick] : tags;
  const sums = t5Sums(inPlay);
  const pl = usePlay(Math.max(55, Math.round(1400 / sums.length)));
  const shown = pl.running ? pl.k : sums.length;
  const look = pl.running && pl.k > 0 ? pl.k - 1 : -1;
  const count = Array.from({ length: 32 }, (_, sc) => sums.slice(0, shown).filter((x) => x === sc).length);
  const top = Math.max(...sums.slice(0, shown));
  const landed = pick !== null && !pl.running;
  const dup = landed ? count.findIndex((c) => c >= 2) : -1;
  const gap = landed ? count.findIndex((c, sc) => c === 0 && sc < top) : -1;
  const done = tags.length === 5;

  const choose = (o: number) => {
    if (pl.running || done) return;
    setPick(o);
    const want = T5_RIGHT[tags.length - 1];
    const before = tags;
    pl.play(2 ** (before.length + 1), () => {
      if (o !== want) return setMiss(miss + 1);
      const nt = [...before, o];
      setTags(nt);
      setPick(null);
      if (nt.length === 5) pass("প্রতিটা দাম আগেরটার দ্বিগুণ.");
    });
  };

  // left to right: bulb i carries price index 4 - i
  const poleTags = Array.from({ length: 5 }, (_, i) => {
    const j = 4 - i;
    if (j < tags.length) return tags[j];
    if (j === tags.length) return pick ?? "?";
    return null;
  });
  const marks: Mark[] = Array.from({ length: 5 }, (_, i) => (4 - i > tags.length ? "dim" : 4 - i === tags.length ? "hot" : undefined));
  const lit = Array.from({ length: 5 }, (_, i) => look >= 0 && 4 - i < inPlay.length && ((look >> (4 - i)) & 1) === 1);

  return (
    <>
      <Board>
        <Night h={80} label="five bulbs with price tags; the next bulb's price is being chosen">
          <PoleG x={0} y={10} w={300} lit={lit} tags={poleTags} marks={done ? undefined : marks} />
        </Night>
      </Board>
      <div className="mt-2 text-center text-xs text-muted">কোন কোন score দেখানো গেলো</div>
      <div className="mx-auto mt-1 grid max-w-sm grid-cols-16 gap-[2px]">
        {count.map((c, sc) => (
          <span
            key={sc}
            className={`grid h-5 place-items-center rounded-sm border font-mono text-[0.6rem] transition-colors duration-200 motion-reduce:transition-none ${
              c >= 2
                ? "border-cat-amber bg-cat-amber text-white"
                : c === 1
                  ? "border-accent bg-accent text-accent-foreground"
                  : sc === gap
                    ? "border-danger text-danger"
                    : "border-border text-muted"
            }`}
          >
            {sc}
          </span>
        ))}
      </div>
      {!done ? (
        <>
          <div className="mt-3 text-sm font-medium text-muted">{round + 2} নম্বর বাল্বের দাম কত হবে?</div>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {T5_OPT[round].map((o, i) => {
              const lk: Look = pick !== o ? "idle" : pl.running ? "picked" : o === T5_RIGHT[round] ? "right" : "wrong";
              return (
                <Choice key={`${round}-${o}`} n={i} look={lk} disabled={pl.running} onClick={() => choose(o)}>
                  <span className="rounded border border-[#94a3b8] bg-white px-2 font-mono text-lg font-bold text-[#0f1b2d]">{o}</span>
                </Choice>
              );
            })}
          </div>
        </>
      ) : (
        <div className={`${FADE} mt-3 text-center text-[0.95rem] text-muted`}>দাম বসলো: 16, 8, 4, 2, 1.</div>
      )}
      {landed && dup >= 0 && <Nope key={`d${miss}`}>দুইটা combinationই {dup} বলছে. একটা combination নষ্ট হলো.</Nope>}
      {landed && dup < 0 && gap >= 0 && <Nope key={`g${miss}`}>{gap} কোনো combinationতেই আসলো না. ফাহিম কখনো {gap} দেখবে না.</Nope>}
      <Task done={done}>প্রতিটা নতুন বাল্বের দাম বেছে নিন, যাতে নিচের ঘরে কোনো ফাঁকা বা ডবল না থাকে.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 5½ · A figure for screen 5's explanation, no task: the prices land right to
//      left, each ×2 the one before, and what can be shown grows 0–1, 0–3,
//      0–7, 0–15. The last range stays "?": that is the bet.

const D5_SAY = [
  "ডানের বাল্ব: 1. দেখানো যায় 0 আর 1.",
  "পরেরটা 2. এখন 0 থেকে 3.",
  "তারপর 4. 0 থেকে 7.",
  "তারপর 8. 0 থেকে 15.",
  "শেষটা 16. প্রতিটা দাম আগেরটার দ্বিগুণ.",
];

export function PriceDouble() {
  const s = useScene(4, [600, 1500, 1500, 1500, 2000]);
  const k = s.k;
  const col = 60;
  const range = k < 4 ? `0 থেকে ${2 ** (k + 1) - 1}` : "0 থেকে ?";
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{D5_SAY[k]}</span>}>
      <svg viewBox="0 0 300 112" role="img" aria-label="the price tags 1, 2, 4, 8, 16 landing right to left, each double the last" className="mx-auto block h-auto w-full max-w-[18rem] rounded-xl">
        <rect width={300} height={112} rx={10} fill={NIGHT} />
        <PoleG x={0} y={10} w={300} lit={Array.from({ length: 5 }, (_, i) => 4 - i <= k)} tags={TAGS5.map((t, i) => (4 - i <= k ? t : null))} />
        {Array.from({ length: k }, (_, j) => {
          const x1 = col * (4 - j + 0.5);
          const x0 = x1 - col;
          return (
            <g key={j}>
              <Draw d={`M${x1 - 6} 70Q${(x0 + x1) / 2} 82 ${x0 + 6} 70`} className="stroke-[#38bdf8]" strokeWidth={1.3} />
              <text x={(x0 + x1) / 2} y={90} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#38bdf8" className={FADE}>
                ×2
              </text>
            </g>
          );
        })}
        <text key={k} x={150} y={106} textAnchor="middle" fontSize={10} fill="#e2e8f0" className={FADE}>
          দেখানো যায়: {range}
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 6 · Reading the pole from the far end: 16, 4 and 2 are lit. Each answer is
//     read out on the pole: "3" counts the lit bulbs one by one, "13" flips the
//     tags end for end first and then adds, "22" adds the lit prices.

const R6_V = 22;
const R6_OPT = [3, 22, 13];
const R6_RIGHT = 1;
const R6_REV = [...TAGS5].reverse();
const R6_NOPE = [
  "আপনি গুনলেন কয়টা জ্বলছে. ওটা নাসিবের নিয়ম. প্রত্যেক বাল্বের নিচে দাম লেখা আছে.",
  "",
  "দাম উল্টা দিক থেকে পড়লেন. 1 লেখা ডানের বাল্বের নিচে, 16 বামেরটার নিচে.",
];

export function ReadPole() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(650);
  const lit = litOf(R6_V, 5);
  const idx = litIdx(lit);
  const won = pick === R6_RIGHT;
  const flips = pick === 2 ? 1 : 0;
  const end = idx.length + flips;
  const k = pl.running ? pl.k : pick !== null ? end : 0;
  const tags = pick === 2 && k >= 1 ? R6_REV : TAGS5;
  const added = Math.max(0, k - flips);
  const parts = pick === null ? [] : idx.map((i) => (pick === 0 ? 1 : tags[i]));
  const sum = parts.slice(0, added).reduce((a, b) => a + b, 0);
  const marks: Mark[] = Array.from({ length: 5 }, (_, i) => (pl.running && added > 0 && idx[added - 1] === i ? "hot" : undefined));
  const landed = pick !== null && !pl.running;

  const choose = (i: number) => {
    if (won || pl.running) return;
    setPick(i);
    pl.play(idx.length + (i === 2 ? 1 : 0), () => (i === R6_RIGHT ? pass("ON  বাল্বের দাম যোগ করলেই score.") : setMiss(miss + 1)));
  };
  const look = (i: number): Look => (pick !== i ? (won ? "dim" : "idle") : !landed ? "picked" : i === R6_RIGHT ? "right" : "wrong");

  return (
    <>
      <Board>
        <Night h={80} label="the pole seen from the far end: the 16, 4 and 2 bulbs are lit">
          <PoleG x={0} y={10} w={300} lit={lit} tags={tags} marks={marks} />
        </Night>
      </Board>
      <div className="mt-2 min-h-7 text-center font-mono text-lg">
        {added > 0 && (
          <span key={`${pick}-${miss}`} className={FADE}>
            <span className="font-sans text-sm text-muted">ফাহিম পড়লো: </span>
            {parts.slice(0, added).join(" + ")}
            {added === idx.length && !pl.running ? ` = ${sum}` : ""}
          </span>
        )}
      </div>
      <div className="mt-2 text-sm font-medium text-muted">বাঁশে এখন score কত?</div>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {R6_OPT.map((o, i) => (
          <Choice key={o} n={i} look={look(i)} disabled={won || pl.running} onClick={() => choose(i)}>
            <span className="font-mono text-lg font-bold">{o}</span>
          </Choice>
        ))}
      </div>
      {landed && !won && <Nope key={miss}>{R6_NOPE[pick ?? 0]}</Nope>}
      <Task done={won && !pl.running}>বাঁশ দেখে score টা বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 6½ · A figure for screen 6's explanation, no task: under each bulb a 1 or a
//      0 appears, the row reads 10110 = 22, and the two names land: binary,
//      and bit for one place.

const O6_SAY = [
  "বাঁশে 16, 4 আর 2 জ্বলছে.",
  "ON র জায়গায় 1, OFFর জায়গায় 0.",
  "বাঁশের combination লেখা হলো 10110. মানে 22.",
  "0 আর 1 দিয়ে লেখা সংখ্যা: binary. এক ঘরের একটা 0 বা 1: এক bit.",
];

export function OnesZeros() {
  const s = useScene(3, [600, 1800, 2000, 2400]);
  const k = s.k;
  const lit = litOf(R6_V, 5);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{O6_SAY[k]}</span>}>
      <svg viewBox="0 0 300 122" role="img" aria-label="under each bulb a 1 if it is lit and a 0 if not: 10110, which is 22" className="mx-auto block h-auto w-full max-w-[18rem] rounded-xl">
        <rect width={300} height={122} rx={10} fill={NIGHT} />
        <PoleG x={0} y={10} w={300} lit={lit} tags={TAGS5} />
        {k >= 1 &&
          lit.map((on, i) => (
            <text key={i} x={60 * (i + 0.5)} y={88} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="ui-monospace, monospace" fill={on ? "#fde047" : "#94a3b8"} className={POP} style={{ transitionDelay: `${i * 150}ms` }}>
              {on ? 1 : 0}
            </text>
          ))}
        {k >= 3 && <rect x={80} y={72} width={20} height={22} rx={4} fill="none" stroke="#38bdf8" strokeWidth={1.6} className={POP} />}
        {k >= 3 && (
          <text x={104} y={86} fontSize={9} fontWeight={700} fill="#38bdf8" className={FADE}>
            bit
          </text>
        )}
        {k >= 2 && (
          <text x={150} y={114} textAnchor="middle" fontSize={12} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#e2e8f0" className={FADE}>
            10110 = 22{k >= 3 ? "  (binary)" : ""}
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 7a · A story scene for screen 7's setup, no task: Samin goes for tea and
//      leaves the switch board; the pole still shows 22.

export function TeaBreak({}: Story) {
  const s = useScene(2, [600, 2200, 1800]);
  const k = s.k;
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="Samin leaves the switch board to fetch tea; the pole shows 22">
        <LaneSet board={false} />
        <PoleG x={80} y={12} w={160} lit={litOf(R6_V, 5)} />
        <g>
          <rect x={52} y={120} width={44} height={20} rx={3} fill="#1e293b" stroke="#64748b" />
          {litOf(R6_V, 5).map((on, i) => (
            <rect key={i} x={56 + i * 8} y={on ? 124 : 130} width={5} height={6} rx={1} fill={on ? "#eab308" : "#64748b"} />
          ))}
          <path d="M60 140v30M88 140v30" stroke="#78350f" strokeWidth={2} />
        </g>
        <Person who="samin" x={k >= 2 ? -30 : 120} y={FEET} facing={k >= 2 ? -1 : 1} walking={k === 2} />
        {k === 1 && <Bubble x={120} y={FEET - 66} side="right" lines={["চা নিয়ে আসি.", "Switch গুলো দেখিস."]} />}
        <Person who="fahim" x={270} y={FEET - 12} scale={0.72} facing={-1} />
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 7 · Your turn. The switches are the reader's; the score moves 22 → 25 → 31.
//     No running total while setting: "show Fahim" reads the pole out loud,
//     lit price by lit price, and a wrong score bounces.

const Y7_GOAL = [25, 31];
const Y7_SAY = ["এই বলে 3 run. Score 22 থেকে 25.", "শেষ বলে ছক্কা! Score 25 থেকে 31."];

export function YourTurn() {
  const pass = useGate();
  const [v, setV] = useSeed("v", R6_V);
  const [t, setT] = useSeed("t", 0);
  const [said, setSaid] = useSeed<number | null>("said", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(420);
  const lit = litOf(v, 5);
  const idx = litIdx(lit);
  const done = t >= 2;
  const k = pl.running ? pl.k : said !== null ? idx.length : 0;
  const parts = idx.slice(0, k).map((i) => TAGS5[i]);
  const marks: Mark[] = Array.from({ length: 5 }, (_, i) => (pl.running && k > 0 && idx[k - 1] === i ? "hot" : undefined));
  const goal = Y7_GOAL[Math.min(t, 1)];

  const flip = (i: number) => {
    if (pl.running || done) return;
    setV(v ^ (1 << (4 - i)));
    setSaid(null);
    sfx.click();
  };
  const show = () => {
    if (pl.running || done) return;
    setSaid(null);
    pl.play(Math.max(1, idx.length), () => {
      setSaid(v);
      if (v !== goal) return setMiss(miss + 1);
      if (t === 1) pass("সব বাল্ব জ্বললে 31. এর বেশি না.");
      setT(t + 1);
    });
  };

  return (
    <>
      <div key={t} className={`${FADE} mb-2 text-center text-[0.95rem] font-semibold`}>
        {done ? "ইনিংস শেষ. Score 31." : Y7_SAY[t]}
      </div>
      <Board bottom={<Switches on={lit} onFlip={flip} disabled={pl.running || done} />}>
        <Night h={80} label="the pole with its price tags; the reader sets the switches">
          <PoleG x={0} y={10} w={300} lit={lit} tags={TAGS5} marks={marks} />
        </Night>
      </Board>
      <div className="mt-2 min-h-7 text-center font-mono text-lg">
        {k > 0 && (
          <span className={said !== null ? (said === goal || done ? "text-accent-text" : "text-danger") : ""}>
            <span className="font-sans text-sm text-muted">ফাহিম পড়লো: </span>
            {parts.join(" + ")}
            {said !== null ? ` = ${said}` : ""}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" onClick={show} disabled={pl.running || done} className={primaryBtn}>
          ফাহিমকে দেখান
        </button>
        <Ticks
          items={[
            ["25", t >= 1],
            ["31", t >= 2],
          ]}
        />
      </div>
      {said !== null && said !== goal && !done && <Nope key={miss}>ফাহিম পড়লো {said}. দরকার {goal}. {said < goal ? "আরো দাম লাগবে." : "বেশি হয়ে গেলো."}</Nope>}
      <Task done={done}>Switch টিপে বাঁশে নতুন score তুলুন, তারপর ফাহিমকে দেখান.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 7½ · A figure for screen 7's explanation, no task: 25 built from the
//      biggest price down, the remainder shrinking, the bulbs lighting.

const G7_SAY = [
  "25 বানাতে হবে. সবচেয়ে বড় দাম থেকে শুরু.",
  "16 লাগবে? হ্যাঁ. বাকি 9.",
  "8 লাগবে? হ্যাঁ. বাকি 1.",
  "4? না, বাকি মাত্র 1.",
  "2? না.",
  "1? হ্যাঁ. বাকি 0. বাঁশে 11001.",
];

export function BuildTwentyFive() {
  const s = useScene(5, [600, 1600, 1600, 1500, 1200, 2000]);
  const k = s.k;
  const want = litOf(25, 5);
  const lit = want.map((on, i) => on && i < k);
  const left = 25 - sumOf(lit, TAGS5);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{G7_SAY[k]}</span>}>
      <svg viewBox="0 0 300 108" role="img" aria-label="25 built from the biggest price down: 16, 8 and 1 lit" className="mx-auto block h-auto w-full max-w-[18rem] rounded-xl">
        <rect width={300} height={108} rx={10} fill={NIGHT} />
        <PoleG x={0} y={10} w={300} lit={lit} tags={TAGS5} marks={Array.from({ length: 5 }, (_, i) => (k > 0 && i === k - 1 ? "hot" : undefined))} />
        <text key={left} x={150} y={98} textAnchor="middle" fontSize={13} fontWeight={700} fill="#e2e8f0" className={FADE}>
          বাকি <tspan fontFamily="ui-monospace, monospace">{left}</tspan>
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 8a · A story scene for screen 8's setup, no task: the innings ends at 31,
//      all five lit; Nasib's team needs 32, and he says it won't go up.

export function TargetNasib({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  useEffect(() => {
    if (k === 1) sfx.click();
  }, [k]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="the pole shows 31 with all five lit; Nasib points at it and says 32 won't fit">
        <LaneSet board={false} />
        <PoleG x={80} y={12} w={160} lit={litOf(k >= 1 ? 31 : 0, 5)} />
        {k >= 1 && <Card x={262} y={30} text="31" tone="amber" />}
        <Person who="fahim" x={90} y={FEET} mood={k >= 1 ? "happy" : "plain"} />
        <Person who="nasib" x={k >= 2 ? 200 : 350} y={FEET} facing={-1} walking={k === 2} arm={k >= 2 ? "point" : "down"} mood="smug" />
        {k >= 2 && <Bubble x={200} y={FEET - 66} side="left" lines={["32 তো তোদের বাঁশে", "উঠবেই না."]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 8 · 31 + 1. All five lit; "+1 run" carries along the pole, turning each
//     bulb off from the right, and the carry falls off the left end: the pole
//     reads 0 and an empty socket appears. The reader prices the sixth bulb;
//     it lights alone and Fahim reads its price.

const N8_OPT = [31, 32, 64];
const N8_RIGHT = 1;
const N8_NOPE = [
  "নতুন বাল্ব একা জ্বললে 31. কিন্তু পুরোনো পাঁচটা জ্বালালেও 31. একই score দুইবার, আর 32 এখনো নাই.",
  "",
  "ফাহিম পড়লো 64. তাহলে 32 থেকে 63, কোনো combinationই এগুলো বলে না.",
];

export function ThirtyTwo() {
  const pass = useGate();
  const [rolled, setRolled] = useSeed("rolled", false);
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const roll = usePlay(380);
  const light = usePlay(700);
  const won = pick === N8_RIGHT;
  const rk = roll.running ? roll.k : rolled ? 6 : 0;
  const lk = light.running ? light.k : pick !== null ? 2 : 0;
  const landed = pick !== null && !light.running;

  // each bulb Samin switches off as the carry passes it
  useEffect(() => {
    if (roll.running && roll.k > 0 && roll.k <= 5) sfx.click();
  }, [roll.running, roll.k]);

  // columns: 0 is the new socket, 1…5 the old bulbs 16…1
  const lit = [lk >= 1, ...Array.from({ length: 5 }, (_, i) => i + 1 < 6 - rk)];
  const tags: (number | string | null)[] = [rk >= 6 ? (pick !== null && lk >= 1 ? N8_OPT[pick] : "?") : null, ...TAGS5];
  const marks: Mark[] = [rk >= 6 ? (pick !== null && lk >= 1 ? undefined : "ghost") : "gone", undefined, undefined, undefined, undefined, undefined];
  const carryCol = roll.running && rk >= 1 && rk <= 5 ? 5 - rk : -1;
  const reads = sumOf(lit, [pick !== null ? N8_OPT[pick] : 0, ...TAGS5]);

  const plusOne = () => {
    if (rolled || roll.running) return;
    roll.play(6, () => setRolled(true));
  };
  const choose = (i: number) => {
    if (!rolled || won || light.running) return;
    setPick(i);
    light.play(2, () => (i === N8_RIGHT ? pass("31 এর পরে নতুন বাল্ব লাগে, দাম 32.") : setMiss(miss + 1)));
  };
  const look = (i: number): Look => (pick !== i ? (won ? "dim" : "idle") : !landed ? "picked" : i === N8_RIGHT ? "right" : "wrong");

  return (
    <>
      <Board>
        <Night h={80} label="the pole at 31 gets one more run: every bulb turns off and a sixth socket appears">
          <PoleG x={0} y={10} w={300} lit={lit} tags={tags} marks={marks} />
          {carryCol >= 0 && (
            <g key={carryCol} className={POP}>
              <rect x={50 * carryCol + 13} y={0} width={24} height={13} rx={6.5} fill="#38bdf8" />
              <text x={50 * carryCol + 25} y={10} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill={NIGHT}>
                +1
              </text>
            </g>
          )}
        </Night>
      </Board>
      <div className="mt-2 min-h-7 text-center text-[0.95rem]">
        {rk === 0 && <span className="text-muted">বাঁশে এখন 31. পাঁচটাই ON .</span>}
        {roll.running && <span className="text-muted">এক run যোগ হচ্ছে…</span>}
        {rolled && pick === null && <span className={`${FADE} text-danger`}>সব বাল্ব নিভে গেলো. ফাহিম পড়বে 0!</span>}
        {pick !== null && lk >= 2 && (
          <span key={`${pick}-${miss}`} className={`${FADE} ${won ? "text-accent-text" : "text-danger"}`}>
            ফাহিম পড়লো <b className="font-mono">{reads}</b>.
          </span>
        )}
      </div>
      {!rolled ? (
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={plusOne} disabled={roll.running} className={primaryBtn}>
            +1 run
          </button>
        </div>
      ) : (
        <>
          <div className={`${FADE} mt-2 text-sm font-medium text-muted`}>বামের নতুন বাল্বের দাম কত হলে বাঁশে 32 উঠবে?</div>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {N8_OPT.map((o, i) => (
              <Choice key={o} n={i} look={look(i)} disabled={won || light.running} onClick={() => choose(i)}>
                <span className="rounded border border-[#94a3b8] bg-white px-2 font-mono text-lg font-bold text-[#0f1b2d]">{o}</span>
              </Choice>
            ))}
          </div>
        </>
      )}
      {landed && !won && <Nope key={miss}>{N8_NOPE[pick ?? 0]}</Nope>}
      <Task done={won && !light.running}>{rolled ? "নতুন বাল্বের দাম বেছে নিন." : "31 এর সাথে এক run যোগ করুন."}</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 8½ · A figure for screen 8's explanation, no task: 999 + 1 and 11111 + 1
//      side by side. Every place rolls to 0, and a new place opens on the left.

const V8_SAY = [
  "আমাদের গোনায় 999. বাঁশে 31, পাঁচটাই ON .",
  "এক যোগ. 999 এর তিনটা ঘরই 0. বাঁশের পাঁচটাই নিভলো.",
  "বামে নতুন ঘর: 1000. বাঁশে নতুন বাল্ব: 100000, মানে 32.",
];

export function Rollover() {
  const s = useScene(2, [600, 2000, 2400]);
  const k = s.k;
  const digits = k === 0 ? ["", "9", "9", "9"] : k === 1 ? ["", "0", "0", "0"] : ["1", "0", "0", "0"];
  const bulbs = k === 0 ? [null, true, true, true, true, true] : k === 1 ? [null, false, false, false, false, false] : [true, false, false, false, false, false];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{V8_SAY[k]}</span>}>
      <svg viewBox="0 0 280 110" role="img" aria-label="999 plus 1 becomes 1000, and 11111 plus 1 becomes 100000" className="mx-auto block h-auto w-full max-w-[17rem] rounded-xl">
        <rect width={280} height={110} rx={10} fill={NIGHT} />
        <text x={12} y={36} fontSize={9} fill="#cbd5e1">
          আমাদের গোনা
        </text>
        {digits.map((d, i) => (
          <g key={i}>
            <rect x={120 + i * 30} y={16} width={24} height={30} rx={4} fill="none" stroke={d ? "#64748b" : "#334155"} strokeDasharray={d ? undefined : "3 3"} />
            {d && (
              <text key={`${k}${d}`} x={132 + i * 30} y={37} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="ui-monospace, monospace" fill={i === 0 ? "#38bdf8" : "#e2e8f0"} className={POP}>
                {d}
              </text>
            )}
          </g>
        ))}
        <text x={12} y={84} fontSize={9} fill="#cbd5e1">
          বাঁশ
        </text>
        {bulbs.map((on, i) =>
          on === null ? (
            <circle key={i} cx={96 + i * 26} cy={80} r={8} fill="none" stroke="#334155" strokeDasharray="3 3" />
          ) : (
            <circle key={`${i}${k}`} cx={96 + i * 26} cy={80} r={8} strokeWidth={1.2} className={`${i === 0 ? POP : ""} ${on ? "fill-[#fde047] stroke-[#eab308]" : "fill-[#334155] stroke-[#64748b]"}`} />
          ),
        )}
        {k >= 2 && (
          <text x={96} y={104} textAnchor="middle" fontSize={9} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#38bdf8" className={FADE}>
            32
          </text>
        )}
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 9 · Try it: eight bulbs, the two new prices unknown. How high can it go?
//     "128" lights the new leftmost bulb (128), then its neighbour too (192);
//     "255" and "256" light all eight right to left, adding up to 255, and 256
//     is told why it needs a ninth bulb.

const E9_OPT = [128, 256, 255];
const E9_RIGHT = 2;
const E9_NOPE = [
  "বামের বাল্ব একাই 128. পাশেরটা জ্বালাতেই 192. তাহলে 128 সবচেয়ে বেশি না.",
  "আটটাই জ্বলে গেছে, ফাহিম পড়লো 255. 256 দেখাতে নয় নম্বর একটা বাল্ব লাগবে.",
  "",
];
/** which bulbs are lit after k ticks of the play for pick p (tick 1 only reveals the prices) */
const e9Lit = (p: number, k: number) =>
  Array.from({ length: 8 }, (_, i) => (p === 0 ? (i === 0 && k >= 2) || (i === 1 && k >= 3) : k - 1 >= 8 - i));

export function EightBulbs() {
  const pass = useGate();
  const [pick, setPick] = useSeed<number | null>("pick", null);
  const [miss, setMiss] = useSeed("miss", 0);
  const pl = usePlay(260);
  const won = pick === E9_RIGHT;
  const end = pick === 0 ? 3 : 9;
  const k = pl.running ? pl.k : pick !== null ? end : 0;
  const lit = pick === null ? litOf(0, 8) : e9Lit(pick, k);
  const tags = TAGS8.map((t, i) => (i < 2 && k < 1 ? "?" : t));
  const sum = sumOf(lit, TAGS8);
  const landed = pick !== null && !pl.running;

  const choose = (i: number) => {
    if (won || pl.running) return;
    setPick(i);
    pl.play(i === 0 ? 3 : 9, () => (i === E9_RIGHT ? pass("আটটা বাল্ব: 0 থেকে 255.") : setMiss(miss + 1)));
  };
  const look = (i: number): Look => (pick !== i ? (won ? "dim" : "idle") : !landed ? "picked" : i === E9_RIGHT ? "right" : "wrong");

  return (
    <>
      <Board>
        <Night h={78} label="eight bulbs on the pole; the two new ones on the left have unknown prices">
          <PoleG x={0} y={10} w={300} lit={lit} tags={tags} />
        </Night>
      </Board>
      <div className="mt-2 min-h-7 text-center text-[0.95rem]">
        {k >= 2 && (
          <span className={landed ? (won ? "text-accent-text" : "text-danger") : ""}>
            ফাহিম পড়লো <b className="font-mono text-lg">{sum}</b>
          </span>
        )}
      </div>
      <div className="mt-1 text-sm font-medium text-muted">আটটা বাল্বে সবচেয়ে বেশি কত score দেখানো যাবে?</div>
      <div className="mt-1.5 grid grid-cols-3 gap-2">
        {E9_OPT.map((o, i) => (
          <Choice key={o} n={i} look={look(i)} disabled={won || pl.running} onClick={() => choose(i)}>
            <span className="font-mono text-lg font-bold">{o}</span>
          </Choice>
        ))}
      </div>
      {landed && !won && <Nope key={miss}>{E9_NOPE[pick ?? 0]}</Nope>}
      <Task done={won && !pl.running}>সবচেয়ে বেশি score টা বেছে নিন.</Task>
    </>
  );
}

// ---------------------------------------------------------------------------
// 9½ · A figure for the Try-it's explanation, no task: looks are counted from
//      1, scores from 0. The first look (all off) is 0, the 256th (all on)
//      is 255.

const Z9 = [
  [1, 0],
  [2, 1],
  [3, 2],
  [256, 255],
];
const Z9_SAY = ["প্রথম combination: সব OFF. Score 0.", "দ্বিতীয় combination: score 1.", "তৃতীয় combination: score 2. Score সবসময় combinationর নম্বরের চেয়ে 1 কম.", "256 নম্বর combination: আটটাই ON . Score 255."];

export function CountFromZero() {
  const s = useScene(3, [600, 1500, 2200, 2200]);
  const k = s.k;
  const [nth, score] = Z9[k];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{Z9_SAY[k]}</span>}>
      <svg viewBox="0 0 300 96" role="img" aria-label={`look number ${nth} of eight bulbs is score ${score}`} className="mx-auto block h-auto w-full max-w-[18rem] rounded-xl">
        <rect width={300} height={96} rx={10} fill={NIGHT} />
        <PoleG x={0} y={12} w={300} lit={litOf(score, 8)} />
        <text key={k} x={150} y={86} textAnchor="middle" fontSize={11} fill="#e2e8f0" className={FADE}>
          combination নং <tspan fontFamily="ui-monospace, monospace" fontWeight={700}>{nth}</tspan> → score{" "}
          <tspan fontFamily="ui-monospace, monospace" fontWeight={700} fill="#fde047">
            {score}
          </tspan>
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10a · A story scene for the ending, no task: the last ball, the six-bulb
//       pole lights 29 (16, 8, 4, 1), and Fahim reads it from the far end.

export function MatchOver({}: Story) {
  const s = useScene(2, [600, 1800, 2400]);
  const k = s.k;
  useEffect(() => {
    if (k === 1) sfx.click();
  }, [k]);
  return (
    <StoryFrame scene={s}>
      <Stage backdrop="night" label="the six-bulb pole lights 29, and Fahim at the far end shouts the score">
        <LaneSet board={false} />
        <PoleG x={70} y={12} w={180} lit={litOf(k >= 1 ? 29 : 0, 6)} />
        <Person who="mama" x={50} y={FEET} />
        <Person who="nasib" x={120} y={FEET} mood={k >= 2 ? "sad" : "plain"} />
        <Person who="samin" x={176} y={FEET} mood={k >= 2 ? "happy" : "plain"} />
        <Person who="fahim" x={276} y={FEET - 12} scale={0.72} facing={-1} arm={k >= 2 ? "wave" : "down"} mood={k >= 2 ? "happy" : "plain"} />
        {k >= 2 && <Bubble x={276} y={FEET - 60} side="left" lines={["29!", "আমরা জিতছি!"]} />}
      </Stage>
    </StoryFrame>
  );
}

// ---------------------------------------------------------------------------
// 10b · The bet settled, watch-only: five bulbs light from the right, the
//       score climbing 1, 3, 7, 15, 31.

const Q10_SAY = ["পাঁচটা বাল্ব, সব OFF. Score 0.", "ডানের একটা: 1.", "দুইটা: 1 + 2 = 3.", "তিনটা: 7.", "চারটা: 15.", "পাঁচটাই ON : 31. নাসিব বলেছিল 5."];

export function BetSettle({}: Story) {
  const s = useScene(5, [600, 1200, 1200, 1200, 1200, 2000]);
  const k = s.k;
  const lit = Array.from({ length: 5 }, (_, i) => 4 - i < k);
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{Q10_SAY[k]}</span>}>
      <svg viewBox="0 0 300 104" role="img" aria-label="the five bulbs lighting from the right, the score climbing to 31" className="mx-auto block h-auto w-full max-w-[18rem] rounded-xl">
        <rect width={300} height={104} rx={10} fill={NIGHT} />
        <PoleG x={0} y={10} w={300} lit={lit} tags={TAGS5} />
        <text key={k} x={150} y={96} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#fde047" className={POP}>
          {sumOf(lit, TAGS5)}
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// 10c · The bridge back to the main lesson, watch-only: eight bulbs and one
//       square of a photo. 0 is pitch black, 128 a middle grey, 255 white.

const G10 = [0, 128, 200, 255];
const G10_SAY = [
  "0: সব OFF. ঘরটা ঘুটঘুটে কালো.",
  "128: শুধু বামেরটা ON . মাঝামাঝি ধূসর.",
  "200: 128, 64 আর 8 ON . আরো উজ্জ্বল.",
  "255: আটটাই ON . একদম সাদা.",
];

export function GreyEight({}: Story) {
  const s = useScene(3, [600, 1800, 1800, 2000]);
  const k = s.k;
  const v = G10[k];
  return (
    <Scene scene={s} caption={<span key={k} className={FADE}>{G10_SAY[k]}</span>}>
      <svg viewBox="0 0 300 92" role="img" aria-label={`eight bulbs reading ${v}, and a square of that brightness`} className="mx-auto block h-auto w-full max-w-[18rem] rounded-xl">
        <rect width={300} height={92} rx={10} fill={NIGHT} />
        <PoleG x={0} y={12} w={224} lit={litOf(v, 8)} tags={TAGS8} />
        <rect
          x={238}
          y={16}
          width={50}
          height={50}
          rx={3}
          stroke="#64748b"
          style={{ fill: `rgb(${v}, ${v}, ${v})` }}
          className="transition-[fill] duration-700 motion-reduce:transition-none"
        />
        <text key={k} x={263} y={84} textAnchor="middle" fontSize={12} fontWeight={700} fontFamily="ui-monospace, monospace" fill="#e2e8f0" className={FADE}>
          {v}
        </text>
      </svg>
    </Scene>
  );
}

// ---------------------------------------------------------------------------
// States for `npm run shot` (keys = useSeed names).

export const fixtures: Fixtures = {
  FogFinal: { dark: { k: 1 }, pole: { k: 2 }, end: {} },
  BulbBet: { start: {}, picked: { bet: 1 }, sealed: { bet: 2, sealed: true } },
  DimmerIdea: { say: { k: 1 }, end: {} },
  FogRead: { start: {}, mid: { tries: [2] }, all: { tries: [2, 3, 0, 4] } },
  TwoLooks: { mid: { k: 1 }, end: {} },
  CountRuns: { start: {}, four: { ball: 4 }, over: { ball: 6 } },
  SameThree: { one: { k: 1 }, end: {} },
  Patterns: { start: {}, two: { found: [0, 2, 3, 1], v: 1 }, three: { n: 3, found: [0, 2, 3, 1] }, five: { n: 5, found: [0, 2, 3, 1] } },
  DoubleLooks: { two: { k: 0 }, off: { k: 1 }, eight: { k: 2 }, sixteen: { k: 3 }, end: {} },
  LooksWasted: { nasib: { k: 1 }, end: {} },
  MamaTags: { say: { k: 1 }, end: {} },
  PriceTags: { start: {}, dup: { pick: 1, miss: 1 }, gap: { pick: 3, miss: 1 }, three: { tags: [1, 2, 4] }, lastGap: { tags: [1, 2, 4, 8], pick: 17, miss: 1 }, done: { tags: [1, 2, 4, 8, 16] } },
  PriceDouble: { mid: { k: 2 }, end: {} },
  ReadPole: { start: {}, count: { pick: 0, miss: 1 }, flip: { pick: 2, miss: 1 }, right: { pick: 1 } },
  OnesZeros: { digits: { k: 1 }, end: {} },
  TeaBreak: { say: { k: 1 }, end: {} },
  YourTurn: { start: {}, miss: { v: 21, said: 21, miss: 1 }, second: { t: 1, v: 25 }, done: { t: 2, v: 31, said: 31 } },
  BuildTwentyFive: { mid: { k: 2 }, end: {} },
  TargetNasib: { lit: { k: 1 }, end: {} },
  ThirtyTwo: { start: {}, rolled: { rolled: true }, dup: { rolled: true, pick: 0, miss: 1 }, right: { rolled: true, pick: 1 } },
  Rollover: { zero: { k: 1 }, end: {} },
  EightBulbs: { start: {}, small: { pick: 0, miss: 1 }, over: { pick: 1, miss: 1 }, right: { pick: 2 } },
  CountFromZero: { start: { k: 0 }, end: {} },
  MatchOver: { lit: { k: 1 }, end: {} },
  BetSettle: { mid: { k: 3 }, end: {} },
  GreyEight: { mid: { k: 1 }, end: {} },
};
